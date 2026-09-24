import {useCallback,useEffect,useEffectEvent,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {getFeed,getManagers} from './api';
import {restorePreferences} from './logic';
import type {Filters,Manager,Preferences,WhaleEvent} from './types';

const storageKey='trading-whale-watch-v1';
const emptyFilters:Filters={manager:'',search:'',action:'',option:'',followed:false};
function initial(){try{return restorePreferences(localStorage.getItem(storageKey));}catch{return restorePreferences(null);}}
export function useWhaleWatch(){
 const [checkedAt,setCheckedAt]=useState(Date.now);
 const [prefs,setPrefs]=useState<Preferences>(initial);
 const [storageError,setStorageError]=useState(false);
 const [managers,setManagers]=useState<Manager[]>([]);
 const [events,setEvents]=useState<WhaleEvent[]>([]);
 const [searchParams,setSearchParams]=useSearchParams();
 const selectedView=searchParams.get('view');
 const tab=selectedView==='following'?'following':'feed';
 const setTab=(view:string)=>setSearchParams(view==='feed'?{}:{view});
 useEffect(()=>{
  if(selectedView&&selectedView!=='following'){
   setSearchParams(previous=>{const next=new URLSearchParams(previous);next.delete('view');return next;},{replace:true});
  }
 },[selectedView,setSearchParams]);
 const [filters,setFilters]=useState<Filters>(emptyFilters);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false),[more,setMore]=useState(false);
 const [detail,setDetail]=useState<WhaleEvent|null>(null);
 const busy=useRef(false),request=useRef<AbortController|null>(null);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(prefs));}catch{queueMicrotask(()=>setStorageError(true));}},[prefs]);
 const followsKey=prefs.follows.join(',');
 const loadFeed=useCallback(async(append=false,offset=0)=>{
  request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);
  try{const data=await getFeed(filters,followsKey.split(','),offset,controller.signal);if(controller.signal.aborted)return;setEvents(old=>append?[...old,...data.filter(e=>!old.some(o=>o.id===e.id))]:data);setMore(data.length===50);setError(false);}
  catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setError(true);}
  finally{if(!controller.signal.aborted)setLoading(false);}
 },[filters,followsKey]);
 const check=useCallback(async()=>{
  if(busy.current)return;busy.current=true;
  try{
   setManagers(await getManagers());
  }catch{setError(true);}finally{busy.current=false;setCheckedAt(Date.now());}
 },[]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void loadFeed();},250);return()=>{clearTimeout(timer);request.current?.abort();};},[loadFeed]);
 const refreshVisible=useEffectEvent(()=>{void check();void loadFeed();});
 useEffect(()=>{
  void check();
  const update=()=>{if(document.visibilityState==='visible')refreshVisible();};
  const timer=setInterval(update,5*60*1000);document.addEventListener('visibilitychange',update);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);};
 },[check]);
 return {checkedAt,prefs,setPrefs,storageError,managers,events,tab,setTab,filters,setFilters,loading,error,more,detail,setDetail,loadFeed,check};
}
