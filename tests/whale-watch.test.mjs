import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ingest,matches,restorePreferences} from '../src/features/whaleWatch/logic.ts';

// Test the deployed parser; only resolve Deno's pinned npm import for Node.
const source=await readFile(new URL('../supabase/functions/whale-watch-sync/core.mjs',import.meta.url),'utf8');
const {parseHoldings,compareHoldings,recentFilings}=await import('data:text/javascript;base64,'+Buffer.from(source.replace('npm:fast-xml-parser@5.11.1',import.meta.resolve('fast-xml-parser'))).toString('base64'));
const row=(shares,option='')=>`<infoTable><nameOfIssuer>PALANTIR</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>69608A108</cusip><shrsOrPrnAmt><sshPrnamt>${shares}</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>${option?`<putCall>${option}</putCall>`:''}</infoTable>`;
const xml=(...rows)=>`<informationTable xmlns="http://www.sec.gov/edgar/document/thirteenf/informationtable">${rows.join('')}</informationTable>`;
const rule={id:'rule',manager:'scion',ticker:'PLTR',action:'new',option:'PUT',enabled:true,createdAt:'2026-09-24T00:00:00.000Z'};
const event={id:11,manager_id:'scion',ticker:'PLTR',cusip:'69608A108',action:'new',option:'PUT',baseline:false,review_required:false,created_at:'2026-09-24T01:00:00+00:00'};
const prefs=()=>({follows:['scion'],rules:[rule],alerts:[],cursor:10});

test('aggregates duplicate lots without conflating puts, calls or stock',()=>{
 const holdings=parseHoldings(xml(row(100,'PUT'),row(200,'PUT'),row(50),row(20,'CALL')));
 assert.equal(holdings.length,3);assert.equal(holdings[0].shares,300);assert.equal(holdings[0].ticker,'PLTR');
});
test('rejects malformed, entity-bearing, or negative-quantity XML',()=>{
 for(const value of ['<broken>', '<!DOCTYPE x>'+xml(row(1)),xml(row(-1))])assert.throws(()=>parseHoldings(value));
});
test('reports quantity changes independently of valuation and distinguishes closed positions',()=>{
 const previous=parseHoldings(xml(row(100,'PUT'),row(200),row(50,'CALL')));
 const current=parseHoldings(xml(row(150,'PUT'),row(100)));
 assert.deepEqual(compareHoldings(previous,current).map(e=>[e.option,e.action,e.change]),[['PUT','increased',50],['','reduced',-50],['CALL','closed',-100]]);
 assert.deepEqual(compareHoldings(current,current),[]);
});
test('only original 13F reports are comparison candidates',()=>{
 const filings=recentFilings({accessionNumber:['0000000001-26-000001','0000000001-26-000002'],form:['13F-HR','13F-HR/A'],filingDate:['2026-08-01','2026-08-02'],reportDate:['2026-06-30','2026-06-30'],primaryDocument:['a.xml','b.xml']});
 assert.equal(filings.length,1);assert.equal(filings[0].form,'13F-HR');
});
test('put rule excludes history, amendments, earlier events, stock and unfollowed institutions',()=>{
 assert.equal(matches(event,rule,['scion']),true);
 for(const patch of [{baseline:true},{review_required:true},{created_at:'2026-09-23T00:00:00Z'},{option:''},{manager_id:'ark'}])assert.equal(matches({...event,...patch},rule,['scion']),false);
 assert.equal(matches(event,rule,[]),false);
});
test('first visit establishes a cursor without notifying past filings',()=>{
 const next=ingest({...prefs(),cursor:null},[event]);assert.equal(next.cursor,11);assert.deepEqual(next.alerts,[]);
});
test('retry and duplicate rules do not create duplicate alerts',()=>{
 const next=ingest({...prefs(),rules:[rule,{...rule,id:'duplicate'}]},[event,event]);
 assert.equal(next.alerts.length,1);assert.deepEqual(ingest(next,[event]),next);
});
test('catch-up advances across nonmatching events and retains latest 200 alerts',()=>{
 const next=ingest(prefs(),Array.from({length:250},(_,i)=>({...event,id:i+11})));
 assert.equal(next.cursor,260);assert.equal(next.alerts.length,200);assert.equal(next.alerts[0].event.id,260);
 assert.equal(ingest(next,[{...event,id:261,baseline:true}]).cursor,261);
});
test('invalid local preferences recover safely',()=>{
 assert.equal(restorePreferences('bad JSON').cursor,null);
 assert.deepEqual(restorePreferences(JSON.stringify({follows:[1,'scion'],rules:[null],alerts:[],cursor:'invalid'})),{follows:['scion'],rules:[],alerts:[],cursor:null});
});

test('rule timestamps compare instants across timezones',()=>{
 assert.equal(matches({...event,created_at:'2026-09-24T02:00:00+09:00'},rule,['scion']),false);
});
