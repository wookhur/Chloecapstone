-- ---------------------------------------------------------------------------
-- Storage bucket for course handouts.
--
-- Run this in the Supabase SQL editor AFTER schema.sql. It is a separate file
-- because it touches the `storage` schema, which only exists inside a Supabase
-- project — schema.sql stays runnable on a plain Postgres for testing.
--
-- The bucket is private: files are reached through short-lived signed URLs
-- (src/lib/storage.ts asks for one at click time), so a handout is never a
-- permanent public link that outlives the class.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('course-files', 'course-files', false, 20971520) -- 20 MB, matches MAX_UPLOAD_MB
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Same pilot posture as the table policies in schema.sql: the app runs on the
-- anon key with no per-user auth yet, so anon may read and write inside this
-- one bucket and nowhere else. Tighten alongside the table policies when
-- Supabase Auth lands — reads restricted to members of the class the path
-- starts with, writes to that class's teacher.
drop policy if exists "pilot read — course files" on storage.objects;
create policy "pilot read — course files"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'course-files');

drop policy if exists "pilot write — course files" on storage.objects;
create policy "pilot write — course files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'course-files');

drop policy if exists "pilot delete — course files" on storage.objects;
create policy "pilot delete — course files"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'course-files');
