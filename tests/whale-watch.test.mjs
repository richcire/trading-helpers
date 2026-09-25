import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Test the deployed parser; only resolve Deno's pinned npm import for Node.
const source=await readFile(new URL('../supabase/functions/whale-watch-sync/core.mjs',import.meta.url),'utf8');
const {parseHoldings,compareHoldings,recentFilings}=await import('data:text/javascript;base64,'+Buffer.from(source.replace('npm:fast-xml-parser@5.11.1',import.meta.resolve('fast-xml-parser'))).toString('base64'));
const row=(shares,option='')=>`<infoTable><nameOfIssuer>PALANTIR</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>69608A108</cusip><shrsOrPrnAmt><sshPrnamt>${shares}</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>${option?`<putCall>${option}</putCall>`:''}</infoTable>`;
const xml=(...rows)=>`<informationTable xmlns="http://www.sec.gov/edgar/document/thirteenf/informationtable">${rows.join('')}</informationTable>`;
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
test('reports keep all positions together and separate institutions, periods and filings',async()=>{
 const {groupReports}=await import('../src/features/whaleWatch/reports.ts');
 const base={manager_id:'ark',period:'2026-06-30',filed:'2026-08-14',source:'https://www.sec.gov/report-a'};
 const rows=Array.from({length:1051},(_,id)=>({...base,id}));
 rows.push({...base,id:1052,manager_id:'scion'});
 rows.push({...base,id:1053,period:'2026-03-31',filed:'2026-05-15'});
 rows.push({...base,id:1054,source:'https://www.sec.gov/report-b',filed:'2026-08-15'});
 const reports=groupReports(rows);
 assert.equal(reports.length,4);
 assert.equal(reports[0].source,'https://www.sec.gov/report-b');
 assert.equal(reports.find(r=>r.manager==='ark'&&r.period===base.period&&r.source===base.source).events.length,1051);
 assert.equal(reports.at(-1).period,'2026-03-31');
});

test('holding tickers require matching period, issuer and exact security; snapshots remain untouched',async()=>{
 const {resolveHoldings}=await import('../src/features/whaleWatch/holdings.ts');
 const row={key:'123456789|COM||SH',cusip:'123456789',ticker:'123456789',issuer:'Example',shares:25};
 const event={event_key:'accession:'+row.key,period:'2026-06-30',issuer:'Example',cusip:row.cusip,ticker:'EX'};
 assert.equal(resolveHoldings([row],[event],'2026-06-30')[0].ticker,'EX');
 for(const changed of [{period:'2026-03-31'},{issuer:'Different'},{event_key:'accession:123456789|ADR||SH'}])assert.equal(resolveHoldings([row],[{...event,...changed}],'2026-06-30')[0].ticker,row.cusip);
 assert.equal(resolveHoldings([row],[event,{...event,ticker:'OTHER'}],'2026-06-30')[0].ticker,row.cusip);
 assert.equal(row.ticker,row.cusip);
 assert.equal(resolveHoldings([row],[],'2026-06-30')[0].shares,25);
});

test('reported values sum duplicate lots and enrichment refuses changed snapshots',async()=>{
 const {enrichValues}=await import('data:text/javascript;base64,'+Buffer.from(source.replace('npm:fast-xml-parser@5.11.1',import.meta.resolve('fast-xml-parser'))).toString('base64'));
 const valued=n=>row(n).replace('<titleOfClass>','<value>200</value><titleOfClass>');
 const fresh=parseHoldings(xml(valued(10),valued(20)));
 assert.equal(fresh[0].shares,30);assert.equal(fresh[0].reported_value,400);
 const saved=fresh.map(({reported_value,...h})=>h);
 assert.equal(enrichValues(saved,fresh)[0].reported_value,400);
 assert.equal(saved[0].reported_value,undefined);
 assert.throws(()=>enrichValues(saved,[{...fresh[0],shares:31}]));
 assert.throws(()=>enrichValues(saved,[{...fresh[0],issuer:'Another company'}]));
 assert.throws(()=>parseHoldings(xml(row(10).replace('<titleOfClass>','<value>-1</value><titleOfClass>'))));
});

test('allocation uses complete equity values, excludes derivatives, and conserves the Other slice',async()=>{
 const {allocation}=await import('../src/features/whaleWatch/allocation.ts');
 const rows=Array.from({length:12},(_,i)=>({key:String(i),ticker:'T'+i,issuer:'I'+i,unit:'SH',option:'',shares:1000000-i,reported_value:i+1}));
 const result=allocation([...rows,{...rows[0],option:'PUT',reported_value:10000},{...rows[0],unit:'PRN',reported_value:10000}]);
 assert.equal(result.total,78);assert.equal(result.items.length,11);
 assert.equal(result.items[0].name,'T11');assert.equal(result.items.at(-1).value,3);
 assert.ok(Math.abs(result.items.reduce((s,r)=>s+r.percent,0)-100)<1e-8);
 assert.equal(allocation([{...rows[0],reported_value:null}]).status,'missing');
 assert.equal(allocation([{...rows[0],reported_value:0}]).status,'empty');
});
