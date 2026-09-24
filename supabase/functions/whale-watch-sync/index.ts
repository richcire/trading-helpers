import { parseHoldings, compareHoldings, recentFilings } from './core.mjs';

const base=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function db(route:string,method='GET',body?:unknown){
 const response=await fetch(`${base}/rest/v1/${route}`,{method,headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`DATABASE_${response.status}`);
 const text=await response.text();return text?JSON.parse(text):null;
}
interface Filing {accession:string;period:string;filed:string;primary:string;}
interface Recent {form:string[];reportDate:string[];accessionNumber:string[];}
Deno.serve(async req=>{
 if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 const token=req.headers.get('x-whale-token')||'';
 if(token.length<60||token.length>100)return reply({error:'UNAUTHORIZED'},401);
 let managerId='',lease='',claimed=false;
 try{
  const config=(await db('ww_worker_settings?select=contact,token_hash&id=eq.true'))[0];
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  let diff=0;for(let i=0;i<64;i++)diff|=hash.charCodeAt(i)^(config?.token_hash||'').charCodeAt(i);
  if(!config||diff!==0)return reply({error:'UNAUTHORIZED'},401);
  const text=await req.text();if(text.length>1024)return reply({error:'BODY_TOO_LARGE'},413);
  const body=JSON.parse(text);managerId=String(body.manager||'');
  if(!/^[a-z]{1,20}$/.test(managerId))return reply({error:'INVALID_MANAGER'},400);
  const manager=(await db(`ww_managers?id=eq.${managerId}&select=id,cik`))[0];
  if(!manager)return reply({error:'UNKNOWN_MANAGER'},400);
  lease=crypto.randomUUID();claimed=await db('rpc/ww_claim','POST',{p_manager:managerId,p_lease:lease});
  if(!claimed)return reply({ok:true,skipped:'LEASE_BUSY'});
  await db(`ww_managers?id=eq.${managerId}`,'PATCH',{last_attempt:new Date().toISOString(),status:'syncing',error_code:null});
  const deadline=Date.now()+105000;let last=0;
  async function sec(url:string){
   if(Date.now()>deadline)throw new Error('TIME_BUDGET');
   await new Promise(r=>setTimeout(r,Math.max(0,700-(Date.now()-last))));last=Date.now();
   const response=await fetch(url,{headers:{'User-Agent':`TradingHelpers-WhaleWatch/1.0 ${config.contact}`,'Accept-Encoding':'gzip, deflate'},signal:AbortSignal.timeout(18000)});
   if(!response.ok){await response.body?.cancel();throw new Error(`SEC_${response.status}`);}
   const result=await response.text();if(result.length>20000000)throw new Error('DOCUMENT_TOO_LARGE');return result;
  }
  const submission=JSON.parse(await sec(`https://data.sec.gov/submissions/CIK${manager.cik.padStart(10,'0')}.json`));
  const recent:Recent=submission.filings?.recent;
  if(!Array.isArray(recent?.form))throw new Error('INVALID_SUBMISSIONS');
  const originals:Filing[]=recentFilings(recent);
  const periods=[...new Set(recent.form.flatMap((f,i)=>['13F-HR','13F-HR/A'].includes(f)&&recent.reportDate[i]?[recent.reportDate[i]]:[]))].sort().reverse();
  const amended=[...new Set(recent.form.flatMap((f,i)=>f==='13F-HR/A'&&recent.reportDate[i]?[recent.reportDate[i]]:[]))];
  if(amended.length)await db('rpc/ww_mark_amendments','POST',{p_manager:managerId,p_periods:amended});
  const saved=await db(`ww_filings?manager_id=eq.${managerId}&select=accession,period&order=period.desc`);
  const initial=saved.length===0;
  const known=new Set(saved.map((f:Filing)=>f.accession));
  const latest=saved[0]?.period;
  const candidates=originals.filter(f=>!known.has(f.accession)&&(initial?periods.slice(0,2).includes(f.period):f.period>latest)).sort((a,b)=>a.period.localeCompare(b.period)||a.filed.localeCompare(b.filed));
  let added=0,changes=0,held=0;
  for(const f of candidates.slice(0,4)){
   const expectedPrevious=periods[periods.indexOf(f.period)+1];
   if(amended.includes(f.period)||amended.includes(expectedPrevious)){held++;continue;}
   const url=`https://www.sec.gov/Archives/edgar/data/${Number(manager.cik)}/${f.accession.replaceAll('-','')}`;
   const listing=JSON.parse(await sec(`${url}/index.json`));
   const files=(listing.directory?.item||[]).map((x:{name:string})=>x.name).filter((name:string)=>/\.xml$/i.test(name)&&name!==f.primary&&!name.includes('/')).sort((a:string,b:string)=>Number(/info|table/i.test(b))-Number(/info|table/i.test(a)));
   let holdings=null;
   for(const name of files.slice(0,6)){
    const xml=await sec(`${url}/${encodeURIComponent(name)}`);
    if(/<(?:\w+:)?informationTable\b/.test(xml)){holdings=parseHoldings(xml);break;}
   }
   if(!holdings)throw new Error('HOLDINGS_NOT_FOUND');
   const prior=expectedPrevious?(await db(`ww_filings?manager_id=eq.${managerId}&period=eq.${expectedPrevious}&select=period,holdings&order=filed.desc&limit=1`))[0]:null;
   const events=prior?compareHoldings(prior.holdings,holdings):[];
   const inserted=await db('rpc/ww_commit_filing','POST',{p:{accession:f.accession,manager_id:managerId,period:f.period,filed:f.filed,source:`${url}/${f.accession}-index.html`,holdings,previous_period:prior?.period||null,events,baseline:initial||saved.length<2}});
   if(inserted){added++;changes+=events.length;}
  }
  await db(`ww_managers?id=eq.${managerId}`,'PATCH',{last_success:new Date().toISOString(),latest_period:periods[0]||null,status:held?'review':originals.length?'ready':'no_filings',error_code:null,has_amendments:amended.length>0});
  return reply({ok:true,manager:managerId,added,changes,held});
 }catch(error){
  const raw=error instanceof Error?error.message:'UNKNOWN';
  const code=/^(SEC_\d+|DATABASE_\d+|TIME_BUDGET|DOCUMENT_TOO_LARGE|INVALID_SUBMISSIONS|HOLDINGS_NOT_FOUND)$/.test(raw)?raw:'SYNC_FAILED';
  if(claimed)try{await db(`ww_managers?id=eq.${managerId}`,'PATCH',{status:'error',error_code:code});}catch{/* Retry on next scheduled run. */}
  console.error('Whale Watch',managerId,code);return reply({ok:false,error:code},502);
 }finally{
  if(claimed)try{await db(`ww_jobs?manager_id=eq.${managerId}&lease_id=eq.${lease}`,'PATCH',{lease_id:null,lease_until:null});}catch{/* Lease expires after 3 minutes. */}
 }
});
