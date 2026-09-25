import {useEffect,useState} from 'react';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {getReportHoldings} from './api';
import {compareAllocation} from './compareWeights';
import {resolveHoldings} from './holdings';
import type {WhaleEvent,Filing} from './types';
type Report=Omit<Filing,'holdings'>;
export function AllocationComparison({previous,current,events}:{previous:Report;current:Report;events:WhaleEvent[]}){
 const {language,locale}=useI18n();const c=copy[language];
 const [result,setResult]=useState<ReturnType<typeof compareAllocation>|null>(null);
 const [error,setError]=useState(false),[retry,setRetry]=useState(0),[limit,setLimit]=useState(15),[search,setSearch]=useState('');
 useEffect(()=>{const controller=new AbortController();
 Promise.all([getReportHoldings(previous.manager_id,previous.period,previous.source,controller.signal),getReportHoldings(current.manager_id,current.period,current.source,controller.signal)]).then(([a,b])=>{if(!controller.signal.aborted)setResult(compareAllocation(resolveHoldings(a,events,current.period),b));}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();
 },[previous.manager_id,previous.period,previous.source,current.manager_id,current.period,current.source,events,retry]);
 const pct=(value:number)=>value>0&&value<0.01?'<0.01%':new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(value)+'%';
 const pp=(value:number)=>Math.abs(value)<0.005&&value!==0?(value>0?'+':'−')+'<0.01%p':(value>0?'+':'')+new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(value)+'%p';
 const items=result?.items||[];
 const maximum=Math.max(10,Math.ceil(Math.max(0,...items.map(row=>Math.max(row.previous,row.current)))/10)*10);
 const needle=search.trim().toLowerCase();const filtered=items.filter(row=>!needle||[row.name,row.issuer,row.key].some(value=>value.toLowerCase().includes(needle)));
 return <section className="ww-allocation-comparison" aria-label={c.compareWeights}><h3>{c.compareWeights}</h3><p className="ww-note">{c.compareWeightsNote}</p>
 <div className="ww-weight-legend"><span><i className="before"/>{previous.period}</span><span><i className="after"/>{current.period}</span></div>
 {error?<div className="ww-warning" role="alert">{c.error}<button onClick={()=>{setError(false);setRetry(n=>n+1);}}>{c.refresh}</button></div>:!result?<p className="ww-note" role="status">{c.loading}</p>:result.status!=='ready'?<p className="ww-note">{c.weightsUnavailable}</p>:<>
 <div className="ww-filters"><input aria-label={c.compareWeights+' · '+c.search} placeholder={c.search} value={search} onChange={e=>{setSearch(e.target.value);setLimit(15);}}/></div>
 <p className="ww-weight-scale">{c.commonScale} · 0–{pct(maximum)}</p>
 <div className="ww-weight-rows">{filtered.slice(0,limit).map(row=><div key={row.key} className="ww-weight-row"><div className="ww-weight-name"><strong>{row.name}</strong><small title={row.issuer}>{row.issuer}</small></div><div className="ww-weight-bars"><div className="ww-weight-line"><div className="ww-weight-track"><div className="ww-weight-bar before" style={{width:`${row.previous/maximum*100}%`}}/></div><span><span className="ww-sr-only">{previous.period}: </span>{pct(row.previous)}</span></div><div className="ww-weight-line"><div className="ww-weight-track"><div className="ww-weight-bar after" style={{width:`${row.current/maximum*100}%`}}/></div><span><span className="ww-sr-only">{current.period}: </span>{pct(row.current)}</span></div></div><strong className={`ww-weight-delta ${row.delta>0?'up':row.delta<0?'down':''}`}><span className="ww-sr-only">{c.weightDelta}: </span>{pp(row.delta)}</strong></div>)}</div>
 {!filtered.length&&<p className="ww-note">{c.empty}</p>}{filtered.length>limit&&<button className="ww-button ww-load" onClick={()=>setLimit(n=>n+15)}>{c.loadMore} ({limit}/{filtered.length})</button>}
 </>}
 </section>;
}
