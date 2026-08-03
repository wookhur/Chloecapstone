#!/usr/bin/env node
/**
 * Verify a Supabase project is set up the way Homework Hub expects.
 *
 *   npm run check:supabase
 *
 * Connecting Supabase is four steps in two different dashboards, and getting
 * one wrong fails quietly: the app just shows an error banner, or worse, looks
 * fine until someone opens the Files tab. This checks each piece and says which
 * one is missing.
 *
 * Reads .env.local the same way Vite does. Never asks for the service-role key
 * — everything here works with the anon key, which is meant to be public.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const TABLES = [
  'profiles', 'classes', 'enrollments', 'assignments', 'completions',
  'announcements', 'discussion_topics', 'discussion_posts',
  'practice_quizzes', 'practice_questions', 'files', 'calendar_events',
  'meeting_requests', 'counselor_slots', 'guardianships',
];

const BUCKET = 'course-files';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const note = (m) => console.log(`    \x1b[2m${m}\x1b[0m`);

/** Minimal .env parser — enough for KEY=value, which is all this file needs. */
function readEnvLocal() {
  const out = {};
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

let failed = false;
const fail = (m, hint) => {
  failed = true;
  bad(m);
  if (hint) note(hint);
};

console.log('\nHomework Hub — Supabase check\n');

console.log('Environment');
if (!url || url.includes('YOUR-PROJECT')) {
  fail('VITE_SUPABASE_URL is not set', 'cp .env.example .env.local, then fill it in from Project Settings → API');
} else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  fail(`VITE_SUPABASE_URL doesn't look like a project URL: ${url}`,
       'It should look like https://abcdefgh.supabase.co — no trailing path.');
} else {
  ok(`URL ${url}`);
}

if (!key || key.startsWith('your-')) {
  fail('VITE_SUPABASE_ANON_KEY is not set');
} else if (key.length < 40) {
  fail('VITE_SUPABASE_ANON_KEY looks too short to be a real key');
} else if (/service_role/.test(Buffer.from(key.split('.')[1] ?? '', 'base64').toString('utf8'))) {
  // Pasting the service-role key into a VITE_ variable ships full database
  // access to every visitor in the JS bundle. Worth stopping hard for.
  fail('That is the SERVICE ROLE key, not the anon key.',
       'VITE_ variables are compiled into the public bundle. Rotate that key in ' +
       'Supabase → Project Settings → API, and use the "anon public" key here.');
} else {
  ok('Anon key present');
}

if (failed) {
  console.log('\nFix the above, then run this again.\n');
  process.exit(1);
}

const db = createClient(url, key);

console.log('\nConnection');
const { error: reachErr } = await db.from('profiles').select('id').limit(1);
if (reachErr) {
  if (/relation .* does not exist|schema cache/i.test(reachErr.message)) {
    fail('Connected, but the tables are missing.',
         'Run supabase/schema.sql then supabase/seed.sql in the SQL Editor.');
  } else if (/Invalid API key|JWT/i.test(reachErr.message)) {
    fail('The project rejected the key.', 'Copy the "anon public" key again from Project Settings → API.');
  } else if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(reachErr.message)) {
    fail(`Could not reach ${url}`, 'Check the URL, and that the project is not paused.');
  } else {
    fail(`Could not read from the project: ${reachErr.message}`);
  }
  console.log('\nStopped here — nothing below can be checked yet.\n');
  process.exit(1);
}
ok('Reached the project and read a row');

console.log('\nTables');
const counts = {};
for (const t of TABLES) {
  const { count, error } = await db.from(t).select('*', { count: 'exact', head: true });
  if (error) fail(`${t} — ${error.message}`);
  else {
    counts[t] = count ?? 0;
    ok(`${t} (${count} rows)`);
  }
}

console.log('\nSeed data');
if ((counts.profiles ?? 0) === 0) {
  fail('No profiles. Sign-in matches on profiles.email, so nobody can get in.',
       'Run supabase/seed.sql, or insert your real roster.');
} else {
  ok(`${counts.profiles} people, ${counts.classes ?? 0} classes, ${counts.assignments ?? 0} assignments`);
}

const { data: withEmail } = await db.from('profiles').select('email').not('email', 'is', null).limit(50);
const examples = (withEmail ?? []).filter((p) => /@school\.example$/.test(p.email ?? ''));
if (examples.length) {
  note(`${examples.length} profiles still use @school.example — those addresses can never receive a sign-in link.`);
}

console.log('\nStorage');
const { data: buckets, error: bucketErr } = await db.storage.listBuckets();
if (bucketErr) {
  note(`Could not list buckets (${bucketErr.message}) — this is normal once rls-auth.sql is applied.`);
} else if (!buckets?.some((b) => b.name === BUCKET)) {
  fail(`No "${BUCKET}" bucket — file uploads will fail.`, 'Run supabase/storage.sql.');
} else {
  ok(`Bucket "${BUCKET}" exists`);
}

console.log('\nAccess');
note('The anon key can currently read your data. That is expected before launch.');
note('Once real accounts exist, run supabase/rls-auth.sql to require sign-in.');

console.log(
  failed
    ? '\n\x1b[31mSomething is missing — see above.\x1b[0m\n'
    : '\n\x1b[32mReady.\x1b[0m Restart the dev server; the "Demo mode" banner should be gone.\n',
);
process.exit(failed ? 1 : 0);
