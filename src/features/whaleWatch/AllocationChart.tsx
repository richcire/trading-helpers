import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip} from 'recharts';
import {useI18n} from '../../i18n';
import {copy} from './copy';
import {allocation} from './allocation';
import type {Holding} from './types';
const colors=['#52c7de','#8b9cff','#e8b86c','#85c991','#d38fcb','#ef8b81','#68a4da','#b7b971','#ae9cda','#8fbbb3','#52636f'];
export function AllocationChart({rows}:{rows:Holding[]}){
 const {language,locale}=useI18n();const c=copy[language];const result=allocation(rows);
 const percent=(value:number)=>new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(value/100);
 const items=result.items.map(row=>({...row,name:row.key==='other'?c.other:row.name}));
 return <section className="ww-allocation" aria-label={c.allocation}><h3>{c.allocation}</h3><p className="ww-note">{c.allocationNote}</p>
 {result.status!=='ready'?<p className="ww-note" role="status">{result.status==='missing'?c.valuesMissing:c.noEquities}</p>:<div className="ww-allocation-grid"><div className="ww-pie" role="img" aria-label={items.map(row=>`${row.name} ${percent(row.percent)}`).join(', ')}><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={items} dataKey="value" nameKey="name" innerRadius={72} outerRadius={115} paddingAngle={1} stroke="var(--color-bg-surface)" isAnimationActive={false}>{items.map((row,index)=><Cell key={row.key} fill={colors[index]}/>)}</Pie><Tooltip content={({active,payload})=>{const row=payload?.[0]?.payload;return active&&row?<div className="ww-pie-tooltip"><strong>{row.name} · {percent(row.percent)}</strong><small>{row.issuer}</small></div>:null;}}/></PieChart></ResponsiveContainer><div className="ww-pie-center"><strong>100%</strong><span>{c.reportedEquities}</span></div></div><ol className="ww-allocation-legend">{items.map((row,index)=><li key={row.key}><span className="ww-swatch" style={{background:colors[index]}}/><span title={row.issuer}>{row.name}</span><strong>{percent(row.percent)}</strong></li>)}</ol></div>}
 </section>;
}
