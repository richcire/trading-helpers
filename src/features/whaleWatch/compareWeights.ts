import type {Holding} from './types.ts';
import {allocation} from './allocation.ts';
export function compareAllocation(previous:Holding[],current:Holding[]){
 const before=allocation(previous),after=allocation(current);
 if(before.status!=='ready'||after.status!=='ready')return {status:'unavailable' as const,items:[]};
 const old=new Map(before.items.map(row=>[row.key,row]));
 const next=new Map(after.items.map(row=>[row.key,row]));
 const items=[...new Set([...old.keys(),...next.keys()])].map(key=>{
  const a=old.get(key),b=next.get(key);const identity=b||a!;
  const previous=a?.percent||0,current=b?.percent||0;
  // Display a verified symbol for the same security key if either report has it.
  const holding=current===0?previous:current;
  return {key,name:b&&b.name!==b.key.split('|')[0]?b.name:a?.name||identity.name,issuer:identity.issuer,previous,current,delta:current-previous,holding};
 }).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||b.holding-a.holding||a.key.localeCompare(b.key));
 return {status:'ready' as const,items};
}
