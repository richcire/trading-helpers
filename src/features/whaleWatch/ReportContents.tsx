import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {getReportHoldings} from './api';
import type {Holding} from './types';

export function ReportContents({manager,period,source,children}:{manager:string;period:string;source:string;children:ReactNode}){
 const {language,locale}=useI18n();const c=copy[language];
 const [view,setView]=useState('changes');
 return <><div className="ww-tabs ww-holdings-tabs" role="group" aria-label={c.reports}>
 {['changes','holdings'].map(value=><button key={value} aria-pressed={view===value} className={view===value?'active':''} onClick={()=>setView(value)}>{value==='changes'?c.holdingChanges:c.allHoldings}</button>)}
 </div>{view==='changes'?children:<Holdings key={manager+period+source} manager={manager} period={period} source={source} locale={locale}/>}</>;
}
function Holdings({manager,period,source,locale}:{manager:string;period:string;source:string;locale:string}){
 const {language}=useI18n();const c=copy[language];
 const [rows,setRows]=useState<Holding[]|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const [search,setSearch]=useState(''),[asset,setAsset]=useState(''),[limit,setLimit]=useState(50);
 useEffect(()=>{const controller=new AbortController();getReportHoldings(manager,period,source,controller.signal).then(data=>{if(!controller.signal.aborted)setRows(data);}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[manager,period,source,retry]);
 const needle=search.trim().toLowerCase();
 const filtered=(rows||[]).filter(row=>(!needle||[row.ticker,row.issuer,row.cusip].some(value=>value.toLowerCase().includes(needle)))&&(!asset||(asset==='STOCK'?!row.option&&row.unit!=='PRN':asset==='DEBT'?row.unit==='PRN':row.option===asset))).sort((a,b)=>a.ticker.localeCompare(b.ticker)||a.key.localeCompare(b.key));
 const fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n);
 return <div className="ww-holdings"><p className="ww-note"><strong>{c.period} · {period}</strong><br/>{c.holdingsNote}</p><a className="ww-text-button" href={source} target="_blank" rel="noreferrer">{c.source} ↗</a>
 {error?<div className="ww-warning" role="alert">{c.error}<button onClick={()=>{setError(false);setRetry(n=>n+1);}}>{c.refresh}</button></div>:rows===null?<p role="status" className="ww-empty">{c.loading}</p>:<>
 <div className="ww-filters"><input aria-label={c.allHoldings+' · '+c.search} placeholder={c.search} value={search} onChange={e=>{setSearch(e.target.value);setLimit(50);}}/><select aria-label={c.allHoldings+' · '+c.asset} value={asset} onChange={e=>{setAsset(e.target.value);setLimit(50);}}><option value="">{c.allAssets}</option><option value="STOCK">{c.stock}</option><option value="PUT">{c.put}</option><option value="CALL">{c.call}</option><option value="DEBT">{c.debt}</option></select></div>
 <p className="ww-note">{c.positionsShown} · {fmt(filtered.length)} / {fmt(rows.length)}</p>
 <div className="ww-holdings-list">{filtered.slice(0,limit).map(row=><div className="ww-holding" key={row.key}><div className="ww-security"><div><strong>{row.ticker}</strong><span className="ww-badge">{row.option==='PUT'?c.put:row.option==='CALL'?c.call:row.unit==='PRN'?c.debt:c.stock}</span></div><small>{row.issuer}</small><small>{row.title} · CUSIP {row.cusip}</small></div><div className="ww-holding-quantity"><strong>{fmt(row.shares)}</strong><small>{c.quantityHeld}</small><small>{row.option?c.optionUnit:row.unit==='PRN'?c.principalUnit:c.shareUnit}</small></div></div>)}</div>
 {!filtered.length&&<p className="ww-empty">{rows.length?c.empty:c.noHoldings}</p>}{filtered.length>limit&&<button className="ww-button ww-load" onClick={()=>setLimit(n=>n+50)}>{c.loadMore}</button>}
 </> }</div>;
}
