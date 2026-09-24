import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {restorePreferences} from '../src/features/whaleWatch/logic.ts';

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
test('legacy preferences retain follows and discard removed notification data',()=>{
 const previous={follows:['baron','scion'],rules:[{id:'old'}],alerts:[{event:{id:7}}],cursor:99};
 assert.deepEqual(restorePreferences(JSON.stringify(previous)),{follows:['baron','scion']});
});
test('corrupt preferences recover and valid follow choices are sanitized',()=>{
 assert.deepEqual(restorePreferences('bad JSON'),{follows:['scion','berkshire','pershing']});
 assert.deepEqual(restorePreferences(JSON.stringify({follows:[1,null,'baron','baron','invalid,filter']})),{follows:['baron']});
 assert.deepEqual(restorePreferences(JSON.stringify({follows:[]})),{follows:[]});
});
