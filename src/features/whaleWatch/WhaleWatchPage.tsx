import {Link} from 'react-router-dom';
import {SectionCard} from '../../components/ui/SectionCard';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {useWhaleWatch} from './useWhaleWatch';
import './whale.css';
import {groupReports} from './reports';

export function WhaleWatchPage(){
 const {language,locale}=useI18n();const c=copy[language];
 const {checkedAt,managers,events,filings,tab,setTab,filters,setFilters,loading,error,loadFeed,check}=useWhaleWatch();
 const filtered=!!(filters.search.trim()||filters.action||filters.option);
 const reports=groupReports(events,filtered?[]:filings);
 const name=(id:string)=>{const m=managers.find(m=>m.id===id);return m?.[`name_${language}`]||id;};
 const fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n);
 const when=(s:string|null)=>s?new Date(s).toLocaleString(locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):c.never;
 const success=managers.map(m=>m.last_success).filter((s):s is string=>!!s).sort().at(-1)||null;
 const assetOptions=<><option value="">{c.allAssets}</option><option value="STOCK">{c.stock}</option><option value="PUT">{c.put}</option><option value="CALL">{c.call}</option></>;
 const actionOptions=<><option value="">{c.allChanges}</option>{(['new','increased','reduced','closed'] as const).map(a=><option key={a} value={a}>{c[a]}</option>)}</>;
 const investorOptions=<><option value="">{c.allManagers}</option>{managers.map(m=><option key={m.id} value={m.id}>{name(m.id)}</option>)}</>;

 return <div className="ww">
  <div className="ww-toolbar"><div className="ww-tabs" role="group" aria-label="Whale Watch">{(['feed','investors'] as const).map(t=><button key={t} aria-pressed={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t==='investors'?c.investors:c.reports}</button>)}</div></div>
  <div className="ww-overview"><div className="ww-overview-time"><span>{c.lastSuccess}</span><strong>{when(success)}</strong><small>{c.schedule}</small></div></div>
  {error&&<div className="ww-warning" role="alert">{c.error} <button onClick={()=>{void check();void loadFeed();}}>{c.refresh}</button></div>}
  {tab==='feed'&&<SectionCard title={c.reports} actions={<button className="ww-text-button" disabled={loading} onClick={()=>{void check();void loadFeed();}}>{loading?c.loading:`↻ ${c.refresh}`}</button>}>
   <div className="ww-filters"><input aria-label={c.search} placeholder={c.search} value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/><select aria-label={c.name} value={filters.manager} onChange={e=>setFilters(f=>({...f,manager:e.target.value}))}>{investorOptions}</select><select aria-label={c.asset} value={filters.option} onChange={e=>setFilters(f=>({...f,option:e.target.value}))}>{assetOptions}</select></div>
   <div className="ww-filters secondary"><select aria-label={c.action} value={filters.action} onChange={e=>setFilters(f=>({...f,action:e.target.value}))}>{actionOptions}</select></div>
   <p className="ww-note">{filtered?c.filteredReports:c.reportHint}</p>
   <div className="ww-report-list" aria-busy={loading}>{!loading&&reports.map(report=>{const base=`/whale-watch/reports/${encodeURIComponent(report.accession)}`;return <article className="ww-report" key={report.key}>
    <Link className="ww-report-heading" to={`${base}/changes`}>
     <span className="ww-person"><span className="ww-avatar">{report.manager.slice(0,2).toUpperCase()}</span><span><strong>{name(report.manager)}</strong><small>13F · {c.period} {report.period}</small></span></span>
     <span className="ww-report-date">{c.filingDate}<strong>{report.filed}</strong></span>
     <span className="ww-report-total"><strong>{report.events.length?fmt(report.events.length):'—'}</strong><small>{c.reportCount}</small></span>
     <span className="ww-report-toggle">{c.viewReport} →</span>
    </Link>
    <nav className="ww-report-links" aria-label={name(report.manager)}><Link to={`${base}/changes`}>{c.holdingChanges} →</Link><Link to={`${base}/holdings`}>{c.allHoldings} →</Link></nav>
   </article>;})}{(loading||!reports.length)&&<div className="ww-empty"><strong>{loading?c.loading:c.empty}</strong><p>{!loading&&c.emptyHint}</p></div>}</div>
  </SectionCard>}
  {tab==='investors'&&<><div className="ww-manager-grid">{managers.map(m=>{const stale=m.last_success&&checkedAt-Date.parse(m.last_success)>26*60*60*1000;return <SectionCard key={m.id}><div className="ww-manager-top"><span className="ww-avatar">{m.id.slice(0,2).toUpperCase()}</span><a href={`https://www.sec.gov/edgar/browse/?CIK=${m.cik}&owner=exclude`} target="_blank" rel="noreferrer">SEC ↗</a></div><h3>{name(m.id)}</h3><p className="ww-firm">{m.firm}</p><dl><div><dt>{c.period}</dt><dd>{m.latest_period||'—'}</dd></div><div><dt>{c.lastSuccess}</dt><dd>{when(m.last_success)}</dd></div></dl><p className={m.status==='error'||stale?'ww-state warning':'ww-state'}>{stale?c.stale:m.status==='error'?c.failed:m.status==='ready'?c.ready:m.status==='review'?c.review:m.status==='syncing'?c.syncing:m.status==='no_filings'?c.noFilings:c.pending}</p>{m.has_amendments&&<p className="ww-small">{c.review}</p>}</SectionCard>;})}</div><p className="ww-note">{c.institution} {c.older}</p></>}
  <div className="ww-footnotes"><p>{c.timing}</p><p>{c.interpretation}</p><a href="https://www.sec.gov/divisions/investment/13ffaq" target="_blank" rel="noreferrer">SEC Form 13F FAQ ↗</a></div>

 </div>;
}
