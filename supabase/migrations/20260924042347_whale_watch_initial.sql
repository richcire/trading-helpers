create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists whale_private;
revoke all on schema whale_private from public, anon, authenticated;

create table public.ww_managers (
 id text primary key, cik text not null unique,
 name_ko text not null, name_en text not null, name_ja text not null, firm text not null,
 slot smallint not null unique check(slot between 0 and 5),
 last_attempt timestamptz, last_success timestamptz, latest_period date,
 status text not null default 'pending', error_code text, has_amendments boolean not null default false
);
create table public.ww_filings (
 accession text primary key, manager_id text not null references public.ww_managers(id),
 period date not null, filed date not null, source text not null,
 holdings jsonb not null check(jsonb_typeof(holdings)='array'), created_at timestamptz not null default now()
);
create index ww_filings_manager_period on public.ww_filings(manager_id,period desc);
create table public.ww_events (
 id bigint generated always as identity primary key,
 event_key text not null unique, accession text not null references public.ww_filings(accession),
 manager_id text not null references public.ww_managers(id),
 ticker text not null, cusip text not null, issuer text not null, option text not null check(option in ('','PUT','CALL')),
 unit text not null, action text not null check(action in ('new','increased','reduced','closed')),
 old_shares numeric not null check(old_shares>=0), new_shares numeric not null check(new_shares>=0), change_pct numeric,
 period date not null, previous_period date not null, filed date not null, source text not null,
 baseline boolean not null default false, review_required boolean not null default false,
 created_at timestamptz not null default now()
);
create index ww_events_manager_id on public.ww_events(manager_id,id desc);
create index ww_events_filed on public.ww_events(filed desc,id desc);
create index ww_events_accession on public.ww_events(accession);
create table public.ww_worker_settings (id boolean primary key default true check(id), contact text not null, token_hash text not null);
create table public.ww_jobs (manager_id text primary key references public.ww_managers(id), lease_id uuid, lease_until timestamptz);

alter table public.ww_managers enable row level security;
alter table public.ww_filings enable row level security;
alter table public.ww_events enable row level security;
alter table public.ww_worker_settings enable row level security;
alter table public.ww_jobs enable row level security;
revoke all on public.ww_managers,public.ww_filings,public.ww_events,public.ww_worker_settings,public.ww_jobs from anon,authenticated;
grant select on public.ww_managers,public.ww_events to anon,authenticated;
grant all on public.ww_managers,public.ww_filings,public.ww_events,public.ww_worker_settings,public.ww_jobs to service_role;
grant usage,select on sequence public.ww_events_id_seq to service_role;
create policy ww_managers_public_read on public.ww_managers for select to anon,authenticated using(true);
create policy ww_events_public_read on public.ww_events for select to anon,authenticated using(true);

insert into public.ww_managers(id,cik,name_ko,name_en,name_ja,firm,slot) values
 ('scion','1649339','마이클 버리','Michael Burry','マイケル・バーリ','Scion Asset Management',0),
 ('berkshire','1067983','버크셔 해서웨이','Berkshire Hathaway','バークシャー・ハサウェイ','Berkshire Hathaway',1),
 ('pershing','1336528','빌 애크먼','Bill Ackman','ビル・アックマン','Pershing Square Capital Management',2),
 ('bridgewater','1350694','브리지워터','Bridgewater','ブリッジウォーター','Bridgewater Associates',3),
 ('ark','1697748','캐시 우드','Cathie Wood','キャシー・ウッド','ARK Investment Management',4),
 ('appaloosa','1656456','데이비드 테퍼','David Tepper','デビッド・テッパー','Appaloosa LP',5);
insert into public.ww_jobs(manager_id) select id from public.ww_managers;

create function public.ww_claim(p_manager text,p_lease uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.ww_jobs set lease_id=p_lease,lease_until=now()+interval '3 minutes'
 where manager_id=p_manager and (lease_until is null or lease_until<now());
 return found;
end $$;
create function public.ww_commit_filing(p jsonb) returns boolean language plpgsql security invoker set search_path='' as $$
declare added text;
begin
 insert into public.ww_filings(accession,manager_id,period,filed,source,holdings)
 values(p->>'accession',p->>'manager_id',(p->>'period')::date,(p->>'filed')::date,p->>'source',p->'holdings')
 on conflict(accession) do nothing returning accession into added;
 if added is null then return false; end if;
 insert into public.ww_events(event_key,accession,manager_id,ticker,cusip,issuer,option,unit,action,old_shares,new_shares,change_pct,period,previous_period,filed,source,baseline)
 select added||':'||(e->>'key'),added,p->>'manager_id',e->>'ticker',e->>'cusip',e->>'issuer',e->>'option',e->>'unit',e->>'action',
 (e->>'oldShares')::numeric,(e->>'newShares')::numeric,(e->>'change')::numeric,(p->>'period')::date,(p->>'previous_period')::date,(p->>'filed')::date,p->>'source',coalesce((p->>'baseline')::boolean,false)
 from jsonb_array_elements(coalesce(p->'events','[]'::jsonb)) e;
 return true;
end $$;
create function public.ww_mark_amendments(p_manager text,p_periods date[]) returns void language sql security invoker set search_path='' as $$
 update public.ww_events set review_required=true where manager_id=p_manager and (period=any(p_periods) or previous_period=any(p_periods));
$$;
revoke execute on function public.ww_claim(text,uuid),public.ww_commit_filing(jsonb),public.ww_mark_amendments(text,date[]) from public,anon,authenticated;
grant execute on function public.ww_claim(text,uuid),public.ww_commit_filing(jsonb),public.ww_mark_amendments(text,date[]) to service_role;

-- Runs as the scheduler's postgres role. Never exposed through the Data API.
create function whale_private.dispatch(p_manager text default null) returns setof bigint language plpgsql security invoker set search_path='' as $$
declare m record; secret text;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='whale_watch_cron_token';
 if secret is null then raise exception 'Whale Watch worker token not configured'; end if;
 for m in select id from public.ww_managers where (p_manager is not null and id=p_manager) or (p_manager is null and slot=extract(minute from now())::integer%15)
 loop
  return next net.http_post(
   url:='https://vcyzxlrhdirpllmcltrn.supabase.co/functions/v1/whale-watch-sync',
   headers:=jsonb_build_object('Content-Type','application/json','x-whale-token',secret),
   body:=jsonb_build_object('manager',m.id),timeout_milliseconds:=120000);
 end loop;
end $$;
revoke all on function whale_private.dispatch(text) from public,anon,authenticated,service_role;
