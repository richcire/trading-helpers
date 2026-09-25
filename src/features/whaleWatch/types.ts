export interface Manager {
 id:string; cik:string; name_ko:string; name_en:string; name_ja:string; firm:string;
 last_attempt:string|null; last_success:string|null; latest_period:string|null;
 status:string; error_code:string|null; has_amendments:boolean;
}
export interface WhaleEvent {
 id:number; event_key:string; manager_id:string; ticker:string; cusip:string; issuer:string;
 option:''|'PUT'|'CALL'; unit:string; action:'new'|'increased'|'reduced'|'closed';
 old_shares:number; new_shares:number; change_pct:number|null;
 period:string; previous_period:string; filed:string; source:string;
 baseline:boolean; review_required:boolean; created_at:string;
}
export interface Filters {manager:string;search:string;action:string;option:string;}

export interface Holding {key:string;cusip:string;ticker:string;issuer:string;title:string;option:''|'PUT'|'CALL';unit:string;shares:number;reported_value?:number|null;}
export interface Filing {accession:string;manager_id:string;period:string;filed:string;source:string;holdings:Holding[];}
