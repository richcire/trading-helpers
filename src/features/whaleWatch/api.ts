import type {Filters,Manager,WhaleEvent} from './types';
// This is intentionally a PUBLIC client key. RLS allows SELECT only on public filing data.
const endpoint='https://vcyzxlrhdirpllmcltrn.supabase.co/rest/v1/';
const key='sb_publishable_cCNInfs8EtJKfusiQwxrvg_WOLlPnd9';
async function read<T>(table:string,query:Record<string,string>,signal?:AbortSignal):Promise<T>{
 const response=await fetch(endpoint+table+'?'+new URLSearchParams(query),{headers:{apikey:key},signal:signal||AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 return response.json();
}
export const getManagers=()=>read<Manager[]>('ww_managers',{select:'id,cik,name_ko,name_en,name_ja,firm,last_attempt,last_success,latest_period,status,error_code,has_amendments',order:'slot.asc'});
export async function getFeed(filters:Filters,follows:string[],signal?:AbortSignal){
 const query:Record<string,string>={select:'*',order:'id.desc',limit:'1000'};
 if(filters.manager)query.manager_id=`eq.${filters.manager}`;
 else if(filters.followed)query.manager_id=`in.(${follows.filter(x=>/^[a-z]+$/.test(x)).join(',')||'none'})`;
 if(filters.action)query.action=`eq.${filters.action}`;
 if(filters.option)query.option=`eq.${filters.option==='STOCK'?'':filters.option}`;
 const search=filters.search.trim().replace(/[^\p{L}\p{N} .-]/gu,'').slice(0,60);
 if(search)query.or=`(ticker.ilike.*${search}*,issuer.ilike.*${search}*,cusip.ilike.*${search}*)`;
 // Read every page before grouping so large reports are never silently truncated.
 const events:WhaleEvent[]=[];
 while(true){
  const page=await read<WhaleEvent[]>('ww_events',query,signal);
  events.push(...page);
  if(page.length<1000)return events;
  query.id=`lt.${page[page.length-1].id}`;
 }

}
