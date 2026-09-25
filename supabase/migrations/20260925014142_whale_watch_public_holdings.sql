grant select on public.ww_filings to anon, authenticated;
create policy ww_filings_public_read on public.ww_filings for select to anon, authenticated using (true);
