-- OpenFIGI exact ID_CUSIP + US exchange lookup, verified 2026-09-25.
-- 29273V100: ET, Energy Transfer LP, Partnership Shares.
-- 55336V100: MPLX, MPLX LP, Partnership Shares.
-- Source: https://api.openfigi.com/v3/mapping
do $$
declare old_rows jsonb; new_rows jsonb; changed integer;
begin
 select holdings into strict old_rows from public.ww_filings
 where accession='0001656456-26-000003' and manager_id='appaloosa' and period='2026-06-30' for update;
 select count(*) into changed from jsonb_array_elements(old_rows) h
 where (h->>'key'='29273V100|COM UT LTD PTN||SH' and h->>'issuer'='ENERGY TRANSFER L P' and h->>'ticker'='29273V100')
 or (h->>'key'='55336V100|COM UNIT REP LTD||SH' and h->>'issuer'='MPLX LP' and h->>'ticker'='55336V100');
 if changed<>2 then raise exception 'Expected exactly 2 unmapped holdings'; end if;
 select jsonb_agg(case
 when h->>'key'='29273V100|COM UT LTD PTN||SH' and h->>'issuer'='ENERGY TRANSFER L P' then jsonb_set(h,'{ticker}','"ET"')
 when h->>'key'='55336V100|COM UNIT REP LTD||SH' and h->>'issuer'='MPLX LP' then jsonb_set(h,'{ticker}','"MPLX"')
 else h end order by ord) into new_rows from jsonb_array_elements(old_rows) with ordinality a(h,ord);
 if (select jsonb_agg(h-'ticker' order by ord) from jsonb_array_elements(old_rows) with ordinality a(h,ord))
 is distinct from (select jsonb_agg(h-'ticker' order by ord) from jsonb_array_elements(new_rows) with ordinality a(h,ord))
 then raise exception 'Original filing data changed'; end if;
 update public.ww_filings set holdings=new_rows where accession='0001656456-26-000003';
end $$;
