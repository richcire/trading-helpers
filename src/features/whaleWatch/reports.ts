import type {WhaleEvent} from './types.ts';

export function groupReports(events:WhaleEvent[]){
 const groups=new Map<string,{key:string;manager:string;period:string;filed:string;source:string;events:WhaleEvent[]}>();
 for(const event of events){
  const key=JSON.stringify([event.manager_id,event.period,event.source]);
  let report=groups.get(key);
  if(!report){report={key,manager:event.manager_id,period:event.period,filed:event.filed,source:event.source,events:[]};groups.set(key,report);}
  report.events.push(event);
 }
 return [...groups.values()].sort((a,b)=>b.filed.localeCompare(a.filed)||b.period.localeCompare(a.period)||a.manager.localeCompare(b.manager)||a.key.localeCompare(b.key));
}
