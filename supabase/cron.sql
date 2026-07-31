-- ---------------------------------------------------------------------------
-- Schedule the weekly digest.
--
-- Run AFTER deploying the Edge Function:
--   supabase functions deploy weekly-digest
--   supabase secrets set RESEND_API_KEY=... DIGEST_FROM="Homework Hub <hub@yourschool.org>"
--
-- Then edit the two placeholders below and run this in the SQL Editor.
--
-- This is the piece the browser can't do: nothing in the app is running on a
-- Sunday evening, so the send has to come from the server on a timer.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The anon key is not enough to call a function that reads every student's
-- rows, and the service key must not sit in a cron definition in plain text.
-- Store it once in Vault and reference it by name.
--   select vault.create_secret('<service-role-key>', 'digest_service_key');

select cron.unschedule('weekly-digest')
where exists (select 1 from cron.job where jobname = 'weekly-digest');

-- Sunday 18:00. cron.schedule runs in UTC, so convert from your school's local
-- time first — 18:00 in UTC-07:00 is 01:00 Monday UTC.
select cron.schedule(
  'weekly-digest',
  '0 1 * * 1',
  $$
  select net.http_post(
    url     := 'https://<your-project-ref>.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'digest_service_key'
      )
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Check it landed:
--   select jobname, schedule, active from cron.job;
-- And what it did:
--   select * from cron.job_run_details order by start_time desc limit 5;
--
-- Before the first real send, call the function by hand with ?dry=1 — it builds
-- every digest and returns them as JSON without mailing anyone, so you can read
-- the actual content before a whole school does.
