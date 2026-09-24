import {useCallback,useEffect,useEffectEvent,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {getFeed,getManagers} from './api';
import type {Filters,Manager,WhaleEvent} from './types';

const emptyFilters:Filters={manager:'',search:'',action:'',option:''};
export function useWhaleWatch(){
 const [checkedAt,setCheckedAt]=useState(Date.now);
 const [managers,setManagers]=useState<Manager[]>([]);
 const [events,setEvents]=useState<WhaleEvent[]>([]);
 const [searchParams,setSearchParams]=useSearchParams();
 const selectedView=searchParams.get('view');
 const tab=selectedView==='investors'||selectedView==='following'?'investors':'feed';
 const setTab=(view:string)=>setSearchParams(view==='feed'?{}:{view});
 useEffect(()=>{
  if(selectedView&&selectedView!=='investors'){
   setSearchParams(previous=>{const next=new URLSearchParams(previous);if(selectedView==='following')next.set('view','investors');else next.delete('view');return next;},{replace:true});
  }
 },[selectedView,setSearchParams]);
 const [filters,setFilters]=useState<Filters>(emptyFilters);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false);
 const [detail,setDetail]=useState<WhaleEvent|null>(null);
 const busy=useRef(false),request=useRef<AbortController|null>(null);
 // Remove settings from the retired browser-only follow and alert features.
 useEffect(()=>{try{localStorage.removeItem('trading-whale-watch-v1');}catch{/* Storage may be disabled. */}},[]);
 const loadFeed=useCallback(async()=>{
  request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);
  try{const data=await getFeed(filters,controller.signal);if(controller.signal.aborted)return;setEvents(data);setError(false);}
  catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setError(true);}
  finally{if(!controller.signal.aborted)setLoading(false);}
 },[filters]);
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
 return {checkedAt,managers,events,tab,setTab,filters,setFilters,loading,error,detail,setDetail,loadFeed,check};
}
