-- Keep the existing six institutions and add four verified 13F filers.
-- Each slot is visited once every 15 minutes by whale_private.dispatch().
alter table public.ww_managers drop constraint ww_managers_slot_check;
alter table public.ww_managers add constraint ww_managers_slot_check check (slot between 0 and 14);

insert into public.ww_managers(id,cik,name_ko,name_en,name_ja,firm,slot) values
 ('baron','1017918','바론 캐피털','Baron Capital','バロン・キャピタル','BAMCO, Inc. (Baron Capital)',6),
 ('tci','1647251','TCI','TCI','TCI','TCI Fund Management Ltd',7),
 ('duquesne','1536411','듀케인 패밀리오피스','Duquesne Family Office','デュケイン・ファミリーオフィス','Duquesne Family Office LLC',8),
 ('thirdpoint','1040273','서드 포인트','Third Point','サード・ポイント','Third Point LLC',9);

insert into public.ww_jobs(manager_id)
select id from public.ww_managers where id in ('baron','tci','duquesne','thirdpoint');

-- Bootstrap only the four new institutions; later checks use their regular slots.
select whale_private.dispatch('baron');
select whale_private.dispatch('tci');
select whale_private.dispatch('duquesne');
select whale_private.dispatch('thirdpoint');
