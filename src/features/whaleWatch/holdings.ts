import type {Holding,WhaleEvent} from './types.ts';
// Match the exact security key and reporting period; never rewrite snapshots.
export function resolveHoldings(holdings:Holding[],events:WhaleEvent[],period:string){
 const mappings=new Map<string,Set<string>>();
 for(const event of events){
  if(event.period!==period||!event.ticker||event.ticker===event.cusip)continue;
  const key=JSON.stringify([event.event_key.slice(event.event_key.indexOf(':')+1),event.issuer]);
  const tickers=mappings.get(key)||new Set<string>();tickers.add(event.ticker);mappings.set(key,tickers);
 }
 return holdings.map(holding=>{const tickers=mappings.get(JSON.stringify([holding.key,holding.issuer]));return {...holding,ticker:tickers?.size===1?[...tickers][0]:holding.ticker||holding.cusip};});
}
