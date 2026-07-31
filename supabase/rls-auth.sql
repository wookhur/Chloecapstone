-- ---------------------------------------------------------------------------
-- Lock the database to signed-in users.
--
-- Run this AFTER schema.sql, once sign-in is switched on (Supabase → Auth, and
-- VITE_SUPABASE_* set for the site). It replaces the open pilot policies with
-- ones that only the `authenticated` role can use, so a leaked anon key reads
-- nothing.
--
-- Do not run it while the site is still meant to be explorable without an
-- account — every request would come back empty.
--
-- Profiles keep one narrow anon read: sign-in has to look up which profile an
-- email belongs to, and that lookup happens before the session exists.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'classes', 'enrollments', 'assignments', 'completions',
    'announcements', 'discussion_topics', 'discussion_posts',
    'practice_quizzes', 'practice_questions', 'files', 'calendar_events',
    'meeting_requests', 'counselor_slots', 'guardianships'
  ]
  loop
    execute format('drop policy if exists "pilot full access — %s" on %I', t, t);
    execute format('drop policy if exists "signed in — %s" on %I', t, t);
    execute format(
      'create policy "signed in — %s" on %I for all to authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

drop policy if exists "sign-in lookup — profiles" on profiles;
create policy "sign-in lookup — profiles"
  on profiles for select to anon
  using (true);

-- Storage follows the same rule: handouts are for people with an account.
drop policy if exists "pilot read — course files" on storage.objects;
drop policy if exists "pilot write — course files" on storage.objects;
drop policy if exists "pilot delete — course files" on storage.objects;

drop policy if exists "signed in read — course files" on storage.objects;
create policy "signed in read — course files"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-files');

drop policy if exists "signed in write — course files" on storage.objects;
create policy "signed in write — course files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-files');

drop policy if exists "signed in delete — course files" on storage.objects;
create policy "signed in delete — course files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-files');
