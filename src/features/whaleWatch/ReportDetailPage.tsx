import {useEffect,useRef,useState} from 'react';
import {Link,useParams,useNavigate} from 'react-router-dom';
import {SectionCard} from '../../components/ui/SectionCard';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {getFeed,getFiling,getManagers,getFilingHistory} from './api';
import {Holdings} from './ReportContents';
import type {Filing,Manager,WhaleEvent} from './types';
import './whale.css';

function Modal({children,onClose,label}:{children:React.ReactNode;onClose:()=>void;label:string}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog className="ww-modal" ref={ref} onCancel={onClose} aria-label={label} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><button className="ww-close" onClick={onClose} aria-label={label}>×</button>{children}</dialog>;
}

export function ReportDetailPage(){
 const {accession='',section='changes'}=useParams();
 return <ReportDetail key={accession} accession={accession} section={section}/>;
}
function ReportDetail({accession,section}:{accession:string;section:string}){
 const {language,locale}=useI18n();const c=copy[language];const navigate=useNavigate();
 const [history,setHistory]=useState<Omit<Filing,'holdings'>[]>([]);
 const [filing,setFiling]=useState<Omit<Filing,'holdings'>|null>(null),[managers,setManagers]=useState<Manager[]>([]),[events,setEvents]=useState<WhaleEvent[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const [detail,setDetail]=useState<WhaleEvent|null>(null);
 const [search,setSearch]=useState(''),[action,setAction]=useState(''),[limits,setLimits]=useState<Record<string,number>>({});
 const valid=/^\d{10}-\d{2}-\d{6}$/.test(accession)&&['changes','holdings'].includes(section);
 useEffect(()=>{if(!/^\d{10}-\d{2}-\d{6}$/.test(accession))return;const controller=new AbortController();
 Promise.all([getFiling(accession,controller.signal),getManagers(),getFeed({manager:'',search:'',action:'',option:''},controller.signal,accession)]).then(async([f,m,e])=>{const history=f?await getFilingHistory(controller.signal,f.manager_id):[];if(controller.signal.aborted)return;setHistory(history);setFiling(f);setManagers(m);setEvents(e);setLoading(false);}).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);}});return()=>controller.abort();
 },[accession,retry]);
 useEffect(()=>{window.scrollTo(0,0);},[accession,section]);
 const name=(id:string)=>managers.find(m=>m.id===id)?.[`name_${language}`]||id;
 const fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n);
 const actionLabel=(action:WhaleEvent['action'])=>c[action];
 const badges=(e:WhaleEvent)=><><span className={`ww-badge ${e.action}`}>{actionLabel(e.action)}</span>{e.option&&<span className="ww-badge option">{e.option==='PUT'?c.put:c.call}</span>}{e.review_required&&<span className="ww-badge review">{c.review}</span>}</>;
 const eventRow=(e:WhaleEvent)=><button key={e.id} className="ww-event ww-report-event" onClick={()=>setDetail(e)}><div className="ww-security"><div><strong>{e.ticker}</strong>{badges(e)}</div><small>{e.ticker===e.cusip?'CUSIP · ':''}{e.issuer}</small></div><div className={`ww-change ${e.action}`}><strong>{e.change_pct===null?'NEW':`${e.change_pct>0?'+':''}${fmt(e.change_pct)}%`}</strong><small>{e.period}<br/>{c.period}</small></div><span aria-hidden="true">↗</span></button>;
 const previousPeriod=filing?new Date(Date.UTC(Number(filing.period.slice(0,4)),Number(filing.period.slice(5,7))-3,0)).toISOString().slice(0,10):'';
 const hasPrevious=history.some(f=>f.period===previousPeriod);
 const base=`/whale-watch/reports/${encodeURIComponent(accession)}`;
 const needle=search.trim().toLowerCase();
 const filtered=events.filter(e=>(!action||e.action===action)&&(!needle||[e.ticker,e.issuer,e.cusip].some(value=>value.toLowerCase().includes(needle))));
 return <div className="ww ww-report-detail"><Link className="ww-text-button" to="/whale-watch">← {c.backReports}</Link>
 {!valid?<p className="ww-empty">{c.reportMissing}</p>:error?<div className="ww-warning" role="alert">{c.error}<button onClick={()=>{setError(false);setLoading(true);setRetry(n=>n+1);}}>{c.refresh}</button></div>:loading?<p className="ww-empty" role="status">{c.loading}</p>:!filing?<p className="ww-empty">{c.reportMissing}</p>:<>
 <header className="ww-detail-heading"><p className="ww-kicker">13F · {c.period} {filing.period}</p><h1>{name(filing.manager_id)}</h1><p>{c.filingDate} · {filing.filed}</p><a className="ww-text-button" href={filing.source} target="_blank" rel="noreferrer">{c.source} ↗</a></header>
 <div className="ww-history-select"><label htmlFor="holding-date">{c.period}</label><select id="holding-date" value={accession} onChange={e=>navigate(`/whale-watch/reports/${encodeURIComponent(e.target.value)}/${section}`)}>{history.map(f=><option value={f.accession} key={f.accession}>{f.period}{history.filter(other=>other.period===f.period).length>1?` · ${c.filingDate} ${f.filed}`:''}</option>)}</select><span>{c.asOfNote}</span></div>
 <nav className="ww-tabs ww-page-tabs" aria-label={c.reports}><Link to={`${base}/changes`} aria-current={section==='changes'?'page':undefined}>{c.holdingChanges}</Link><Link to={`${base}/holdings`} aria-current={section==='holdings'?'page':undefined}>{c.allHoldings}</Link></nav>
 <SectionCard title={section==='holdings'?c.allHoldings:c.holdingChanges}>
 {section==='holdings'?<Holdings manager={filing.manager_id} period={filing.period} source={filing.source} locale={locale}/>:<>
 <p className="ww-note">{c.timing}</p>
 {!events.length&&!hasPrevious&&<p className="ww-warning">{c.noComparison} <Link to={`${base}/holdings`}>{c.allHoldings} →</Link></p>}
 {(events.length>0||hasPrevious)&&<div className="ww-report-summary">{(['new','increased','reduced','closed'] as const).map(a=><span key={a} className={`ww-badge ${a}`}>{c[a]} {fmt(events.filter(e=>e.action===a).length)}</span>)}</div>}
 <div className="ww-filters"><input aria-label={c.search} placeholder={c.search} value={search} onChange={e=>{setSearch(e.target.value);setLimits({});}}/><select aria-label={c.action} value={action} onChange={e=>{setAction(e.target.value);setLimits({});}}><option value="">{c.allChanges}</option>{(['new','increased','reduced','closed'] as const).map(a=><option key={a} value={a}>{c[a]}</option>)}</select></div>
 <p className="ww-note">{c.positionsShown} · {fmt(filtered.length)} / {fmt(events.length)}</p><div className="ww-change-groups">{(['new','increased','reduced','closed'] as const).map(group=>{const rows=filtered.filter(e=>e.action===group);const limit=limits[group]||50;return rows.length>0&&<section className={`ww-change-group ${group}`} key={group} aria-labelledby={`change-${group}`}><h3 id={`change-${group}`}><span>{c[group]}</span><span className="ww-group-count">{fmt(rows.length)}</span></h3><div className="ww-event-list">{rows.slice(0,limit).map(eventRow)}</div>{limit<rows.length&&<button className="ww-button ww-load" onClick={()=>setLimits(old=>({...old,[group]:limit+50}))}>{c[group]} · {c.loadMore}</button>}</section>;})}</div>{!filtered.length&&(events.length>0||hasPrevious)&&<p className="ww-empty">{events.length?c.empty:c.noChanges}</p>}
 </>}
 </SectionCard><p className="ww-note">{c.interpretation}</p></>}
  {detail&&<Modal onClose={()=>setDetail(null)} label={c.close}><p className="ww-kicker">{name(detail.manager_id)}</p><h2>{detail.ticker}</h2><p>{detail.issuer}</p><div className="ww-detail-badges">{badges(detail)}{detail.baseline&&<span className="ww-badge">{c.history}</span>}</div><div className="ww-comparison"><div><span>{c.previous}</span><strong>{fmt(detail.old_shares)}</strong><small>{detail.previous_period}</small></div><span>→</span><div><span>{c.current}</span><strong>{fmt(detail.new_shares)}</strong><small>{detail.period}</small></div></div><p className="ww-note">{detail.option?c.optionUnit:detail.unit==='PRN'?c.principalUnit:c.shareUnit}</p><dl><div><dt>{c.filingDate}</dt><dd>{detail.filed}</dd></div><div><dt>{c.period}</dt><dd>{detail.period}</dd></div></dl><p className="ww-note">{c.unknownTrade}</p>{detail.review_required&&<p className="ww-warning">{c.reviewNote}</p>}<div className="ww-detail-actions"><a className="ww-button" href={detail.source} target="_blank" rel="noreferrer">{c.source} ↗</a></div></Modal>}
 </div>;
}
