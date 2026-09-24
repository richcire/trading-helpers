import type {Preferences} from './types';
export const initialPreferences:Preferences={follows:['scion','berkshire','pershing']};
export function restorePreferences(value:string|null):Preferences{
 try{
  const p=JSON.parse(value||'null');
  if(!p||!Array.isArray(p.follows))return structuredClone(initialPreferences);
  // Retain follow choices only; obsolete local fields are discarded on the next save.
  return {follows:[...new Set<string>(p.follows.filter((x:unknown):x is string=>typeof x==='string'&&/^[a-z]{1,20}$/.test(x)))]};
 }catch{return structuredClone(initialPreferences);}
}
