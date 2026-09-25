import type {WhaleEvent,Filing} from './types.ts';

export function groupReports(events:WhaleEvent[],filings:Omit<Filing,'holdings'>[]=[]){
 const groups=new Map<string,{key:string;accession:string;manager:string;period:string;filed:string;source:string;events:WhaleEvent[]}>();
 for(const filing of filings){const key=JSON.stringify([filing.manager_id,filing.period,filing.source]);groups.set(key,{key,accession:filing.accession,manager:filing.manager_id,period:filing.period,filed:filing.filed,source:filing.source,events:[]});}
 for(const event of events){
  const key=JSON.stringify([event.manager_id,event.period,event.source]);
  let report=groups.get(key);
  if(!report){report={key,accession:event.event_key?.split(':')[0]||'',manager:event.manager_id,period:event.period,filed:event.filed,source:event.source,events:[]};groups.set(key,report);}
  report.events.push(event);
 }
 return [...groups.values()].sort((a,b)=>b.period.localeCompare(a.period)||b.filed.localeCompare(a.filed)||a.manager.localeCompare(b.manager)||a.key.localeCompare(b.key));
}
