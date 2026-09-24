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
