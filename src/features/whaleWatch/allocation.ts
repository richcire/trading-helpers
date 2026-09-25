import type {Holding} from './types.ts';
export function allocation(rows:Holding[]){
 const equities=rows.filter(row=>!row.option&&row.unit==='SH');
 if(!equities.length)return {status:'empty' as const,items:[],total:0};
 if(equities.some(row=>typeof row.reported_value!=='number'||!Number.isFinite(row.reported_value)||row.reported_value<0))return {status:'missing' as const,items:[],total:0};
 const sorted=equities.filter(row=>row.reported_value!>0).map(row=>({key:row.key,name:row.ticker,issuer:row.issuer,value:row.reported_value!})).sort((a,b)=>b.value-a.value);
 const total=sorted.reduce((sum,row)=>sum+row.value,0);
 if(!total)return {status:'empty' as const,items:[],total:0};
 const items=sorted.slice(0,10);
 if(sorted.length>10)items.push({key:'other',name:'other',issuer:'',value:sorted.slice(10).reduce((sum,row)=>sum+row.value,0)});
 return {status:'ready' as const,items:items.map(row=>({...row,percent:row.value/total*100})),total};
}
