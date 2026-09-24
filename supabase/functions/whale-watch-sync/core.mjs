import { XMLParser, XMLValidator } from 'npm:fast-xml-parser@5.11.1';

// Only these curated identifiers receive tickers; unknown CUSIPs remain visible.
const symbols={'69608A108':'PLTR','67066G104':'NVDA','037833100':'AAPL','060505104':'BAC','02079K305':'GOOGL','02079K107':'GOOG','023135106':'AMZN','594918104':'MSFT','88160R101':'TSLA','191216100':'KO','025816109':'AXP','674599105':'OXY'};
export function parseHoldings(xml) {
  if(typeof xml!=='string'||xml.length>20_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('지원하지 않는 XML입니다.');
  if(XMLValidator.validate(xml)!==true) throw new Error('올바른 XML 공시가 아닙니다.');
  const doc=new XMLParser({removeNSPrefix:true,parseTagValue:false,trimValues:true}).parse(xml);
  const root=doc.informationTable;
  if(!root||!('infoTable' in root)) throw new Error('13F 보유 내역 XML을 찾지 못했습니다.');
  const rows=Array.isArray(root.infoTable)?root.infoTable:[root.infoTable];
  const merged=new Map();
  for(const r of rows){
    const cusip=String(r.cusip||'').trim().toUpperCase();
    const option=String(r.putCall||'').toUpperCase();
    const unit=String(r.shrsOrPrnAmt?.sshPrnamtType||'SH').toUpperCase();
    const title=String(r.titleOfClass||'').toUpperCase();
    const shares=Number(r.shrsOrPrnAmt?.sshPrnamt);
    if(!/^[A-Z0-9]{9}$/.test(cusip)||!Number.isFinite(shares)||shares<0||!['','PUT','CALL'].includes(option)) throw new Error('공시 수량 또는 식별자가 올바르지 않습니다.');
    const key=[cusip,title,option,unit].join('|');
    if(merged.has(key)) merged.get(key).shares+=shares;
    else merged.set(key,{key,cusip,ticker:symbols[cusip]||cusip,issuer:String(r.nameOfIssuer||cusip),title,option,unit,shares});
  }
  return [...merged.values()];
}

export function compareHoldings(previous,current){
  const before=new Map(previous.map(r=>[r.key,r]));
  const after=new Map(current.map(r=>[r.key,r]));
  const changes=[];
  for(const key of new Set([...before.keys(),...after.keys()])){
    const a=before.get(key),b=after.get(key),old=a?.shares||0,next=b?.shares||0;
    if(old===next)continue;
    changes.push({...b||a,oldShares:old,newShares:next,change:old?((next-old)/old)*100:null,action:!old?'new':!next?'closed':next>old?'increased':'reduced'});
  }
  return changes;
}

export function recentFilings(recent){
  if(!recent?.accessionNumber)return [];
  return recent.accessionNumber.map((accession,i)=>({accession,form:recent.form[i],filed:recent.filingDate[i],period:recent.reportDate[i],primary:recent.primaryDocument[i]})).filter(f=>f.form==='13F-HR'&&f.period&&/^\d{10}-\d{2}-\d{6}$/.test(f.accession)).sort((a,b)=>b.period.localeCompare(a.period)||b.filed.localeCompare(a.filed));
}
