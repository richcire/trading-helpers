import type {Alert,Preferences,Rule,WhaleEvent} from './types';
export const initialPreferences:Preferences={follows:['scion','berkshire','pershing'],rules:[],alerts:[],cursor:null};
export function matches(event:WhaleEvent,rule:Rule,follows:string[]){
 return rule.enabled&&!event.baseline&&!event.review_required&&follows.includes(event.manager_id)
  &&Date.parse(event.created_at)>=Date.parse(rule.createdAt)&&(!rule.manager||rule.manager===event.manager_id)
  &&(!rule.ticker||rule.ticker.toUpperCase()===event.ticker.toUpperCase()||rule.ticker.toUpperCase()===event.cusip)
  &&(!rule.action||rule.action===event.action)&&(!rule.option||(rule.option==='STOCK'?!event.option:rule.option===event.option));
}
export function ingest(previous:Preferences,events:WhaleEvent[]):Preferences{
 if(previous.cursor===null)return {...previous,cursor:Math.max(0,...events.map(e=>e.id))};
 const alerts=[...previous.alerts];const known=new Set(alerts.map(a=>a.event.id));
 for(const event of events){
  if(event.id<=previous.cursor||known.has(event.id))continue;
  if(previous.rules.some(rule=>matches(event,rule,previous.follows))){alerts.push({event,seen:false});known.add(event.id);}
 }
 return {...previous,cursor:Math.max(previous.cursor,...events.map(e=>e.id)),alerts:alerts.sort((a,b)=>b.event.id-a.event.id).slice(0,200)};
}
export function restorePreferences(value:string|null):Preferences{
 try{
  const p=JSON.parse(value||'null');if(!p||!Array.isArray(p.follows)||!Array.isArray(p.rules)||!Array.isArray(p.alerts))return structuredClone(initialPreferences);
  return {follows:p.follows.filter((x:unknown)=>typeof x==='string'),rules:p.rules.filter((r:Rule)=>r&&typeof r.id==='string'&&typeof r.manager==='string'&&typeof r.ticker==='string'&&typeof r.action==='string'&&typeof r.option==='string'&&typeof r.createdAt==='string'&&typeof r.enabled==='boolean'),alerts:p.alerts.filter((a:Alert)=>a?.event&&Number.isSafeInteger(a.event.id)).slice(0,200),cursor:Number.isSafeInteger(p.cursor)?p.cursor:null};
 }catch{return structuredClone(initialPreferences);}
}
