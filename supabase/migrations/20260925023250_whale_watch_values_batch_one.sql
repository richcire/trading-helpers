-- One-time refresh; existing request throttling and snapshot checks apply.
select whale_private.dispatch(id) from public.ww_managers where id in ('appaloosa','ark','baron');
