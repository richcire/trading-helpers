-- Collect each institution once per day, staggered by slot to avoid SEC bursts.
-- pg_cron runs in GMT: 22:00-22:14 UTC = 07:00-07:14 Asia/Seoul.
-- Slots 0-9 are currently occupied; slots 10-14 make no HTTP requests.
select cron.unschedule(jobid) from cron.job where jobname = 'whale-watch-15m';
select cron.schedule('whale-watch-daily', '0-14 22 * * *', $job$select whale_private.dispatch();$job$);
