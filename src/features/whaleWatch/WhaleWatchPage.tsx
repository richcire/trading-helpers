import {useEffect,useRef} from 'react';
import {SectionCard} from '../../components/ui/SectionCard';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {useWhaleWatch} from './useWhaleWatch';
import type {WhaleEvent} from './types';
import './whale.css';

function Modal({children,onClose,label}:{children:React.ReactNode;onClose:()=>void;label:string}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog className="ww-modal" ref={ref} onCancel={onClose} aria-label={label} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><button className="ww-close" onClick={onClose} aria-label={label}>×</button>{children}</dialog>;
}
export function WhaleWatchPage(){
 const {language,locale}=useI18n();const c=copy[language];
 const {checkedAt,prefs,setPrefs,storageError,managers,events,tab,setTab,filters,setFilters,loading,error,more,detail,setDetail,loadFeed,check}=useWhaleWatch();
 const name=(id:string)=>{const m=managers.find(m=>m.id===id);return m?.[`name_${language}`]||id;};
 const fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n);
 const when=(s:string|null)=>s?new Date(s).toLocaleString(locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):c.never;
 const follow=(id:string)=>setPrefs(p=>({...p,follows:p.follows.includes(id)?p.follows.filter(x=>x!==id):[...p.follows,id]}));
 const actionLabel=(action:WhaleEvent['action'])=>c[action];
 const success=managers.map(m=>m.last_success).filter((s):s is string=>!!s).sort().at(-1)||null;
 const assetOptions=<><option value="">{c.allAssets}</option><option value="STOCK">{c.stock}</option><option value="PUT">{c.put}</option><option value="CALL">{c.call}</option></>;
 const actionOptions=<><option value="">{c.allChanges}</option>{(['new','increased','reduced','closed'] as const).map(a=><option key={a} value={a}>{c[a]}</option>)}</>;
 const investorOptions=<><option value="">{c.allManagers}</option>{managers.map(m=><option key={m.id} value={m.id}>{name(m.id)}</option>)}</>;
 const badges=(e:WhaleEvent)=><><span className={`ww-badge ${e.action}`}>{actionLabel(e.action)}</span>{e.option&&<span className="ww-badge option">{e.option==='PUT'?c.put:c.call}</span>}{e.review_required&&<span className="ww-badge review">{c.review}</span>}</>;
 const eventRow=(e:WhaleEvent)=><button key={e.id} className="ww-event" onClick={()=>setDetail(e)}><div className="ww-person"><span className="ww-avatar">{e.manager_id.slice(0,2).toUpperCase()}</span><span><strong>{name(e.manager_id)}</strong><small>{e.filed} · {c.filingDate}</small></span></div><div className="ww-security"><div><strong>{e.ticker}</strong>{badges(e)}</div><small>{e.ticker===e.cusip?'CUSIP · ':''}{e.issuer}</small></div><div className={`ww-change ${e.action}`}><strong>{e.change_pct===null?'NEW':`${e.change_pct>0?'+':''}${fmt(e.change_pct)}%`}</strong><small>{e.period}<br/>{c.period}</small></div><span aria-hidden="true">↗</span></button>;
 return <div className="ww">
  <div className="ww-toolbar"><div className="ww-tabs" role="group" aria-label="Whale Watch">{(['feed','following'] as const).map(t=><button key={t} aria-pressed={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t==='following'?c.investors:c.feed}</button>)}</div></div>
  {storageError&&<p className="ww-warning" role="status">{c.storage}</p>}
  <div className="ww-overview"><div><span>{c.following}</span><strong>{prefs.follows.length}<small> / {managers.length||'—'}</small></strong></div><div className="ww-overview-time"><span>{c.lastSuccess}</span><strong>{when(success)}</strong><small>{c.schedule}</small></div></div>
  {error&&<div className="ww-warning" role="alert">{c.error} <button onClick={()=>{void check();void loadFeed();}}>{c.refresh}</button></div>}
  {tab==='feed'&&<SectionCard title={c.feed} actions={<button className="ww-text-button" disabled={loading} onClick={()=>{void check();void loadFeed();}}>{loading?c.loading:`↻ ${c.refresh}`}</button>}>
   <div className="ww-filters"><input aria-label={c.search} placeholder={c.search} value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/><select aria-label={c.name} value={filters.manager} onChange={e=>setFilters(f=>({...f,manager:e.target.value}))}>{investorOptions}</select><select aria-label={c.asset} value={filters.option} onChange={e=>setFilters(f=>({...f,option:e.target.value}))}>{assetOptions}</select></div>
   <div className="ww-filters secondary"><select aria-label={c.action} value={filters.action} onChange={e=>setFilters(f=>({...f,action:e.target.value}))}>{actionOptions}</select><label><input type="checkbox" checked={filters.followed} onChange={e=>setFilters(f=>({...f,followed:e.target.checked}))}/>{c.followOnly}</label></div>
   <div className="ww-event-list" aria-busy={loading}>{events.map(eventRow)}{!events.length&&<div className="ww-empty"><strong>{loading?c.loading:c.empty}</strong><p>{!loading&&c.emptyHint}</p></div>}</div>{more&&<button className="ww-button ww-load" disabled={loading} onClick={()=>void loadFeed(true,events.length)}>{loading?c.loading:c.loadMore}</button>}
  </SectionCard>}
  {tab==='following'&&<><div className="ww-manager-grid">{managers.map(m=>{const stale=m.last_success&&checkedAt-Date.parse(m.last_success)>26*60*60*1000;return <SectionCard key={m.id}><div className="ww-manager-top"><span className="ww-avatar">{m.id.slice(0,2).toUpperCase()}</span><a href={`https://www.sec.gov/edgar/browse/?CIK=${m.cik}&owner=exclude`} target="_blank" rel="noreferrer">SEC ↗</a></div><h3>{name(m.id)}</h3><p className="ww-firm">{m.firm}</p><dl><div><dt>{c.period}</dt><dd>{m.latest_period||'—'}</dd></div><div><dt>{c.lastSuccess}</dt><dd>{when(m.last_success)}</dd></div></dl><p className={m.status==='error'||stale?'ww-state warning':'ww-state'}>{stale?c.stale:m.status==='error'?c.failed:m.status==='ready'?c.ready:m.status==='review'?c.review:m.status==='syncing'?c.syncing:m.status==='no_filings'?c.noFilings:c.pending}</p>{m.has_amendments&&<p className="ww-small">{c.review}</p>}<button className={`ww-button full ${prefs.follows.includes(m.id)?'selected':''}`} aria-pressed={prefs.follows.includes(m.id)} onClick={()=>follow(m.id)}>{prefs.follows.includes(m.id)?`✓ ${c.followed}`:`＋ ${c.follow}`}</button></SectionCard>;})}</div><p className="ww-note">{c.institution} {c.older}</p></>}
  <div className="ww-footnotes"><p>{c.timing}</p><p>{c.interpretation}</p><p>{c.localNote}</p><a href="https://www.sec.gov/divisions/investment/13ffaq" target="_blank" rel="noreferrer">SEC Form 13F FAQ ↗</a></div>
  {detail&&<Modal onClose={()=>setDetail(null)} label={c.close}><p className="ww-kicker">{name(detail.manager_id)}</p><h2>{detail.ticker}</h2><p>{detail.issuer}</p><div className="ww-detail-badges">{badges(detail)}{detail.baseline&&<span className="ww-badge">{c.history}</span>}</div><div className="ww-comparison"><div><span>{c.previous}</span><strong>{fmt(detail.old_shares)}</strong><small>{detail.previous_period}</small></div><span>→</span><div><span>{c.current}</span><strong>{fmt(detail.new_shares)}</strong><small>{detail.period}</small></div></div><p className="ww-note">{detail.option?c.optionUnit:detail.unit==='PRN'?c.principalUnit:c.shareUnit}</p><dl><div><dt>{c.filingDate}</dt><dd>{detail.filed}</dd></div><div><dt>{c.period}</dt><dd>{detail.period}</dd></div></dl><p className="ww-note">{c.unknownTrade}</p>{detail.review_required&&<p className="ww-warning">{c.reviewNote}</p>}<div className="ww-detail-actions"><a className="ww-button" href={detail.source} target="_blank" rel="noreferrer">{c.source} ↗</a></div></Modal>}
 </div>;
}
