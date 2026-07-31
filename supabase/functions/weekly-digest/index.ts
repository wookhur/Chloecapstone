// Weekly digest sender — a Supabase Edge Function (Deno).
//
// Reminders inside the app only reach students who open the app. The ones most
// likely to miss a deadline are the ones not opening it, so once a week the
// list goes to them.
//
// Deploy:
//   supabase functions deploy weekly-digest
//   supabase secrets set RESEND_API_KEY=... DIGEST_FROM="Homework Hub <hub@yourschool.org>"
// Schedule: see supabase/cron.sql (Sunday evening).
//
// Run it by hand first — it accepts ?dry=1 to build every digest and return
// them as JSON without sending anything, which is how you check the content
// before a whole school gets mail.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildDigest } from '../../../src/lib/digest.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Service role, because this runs with no user session and must read every
// student's rows. It never leaves the server.
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('DIGEST_FROM') ?? 'Homework Hub <onboarding@resend.dev>';

/** Local YYYY-MM-DD in the school's timezone, not the server's UTC. */
function todayInZone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry') === '1';
  const timeZone = Deno.env.get('SCHOOL_TIMEZONE') ?? 'America/Los_Angeles';
  const weekStart = todayInZone(timeZone);

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  const [profiles, classes, enrollments, assignments, completions, events] = await Promise.all([
    db.from('profiles').select('id,name,email,role,wants_digest'),
    db.from('classes').select('id,name'),
    db.from('enrollments').select('student_id,class_id'),
    db.from('assignments').select('id,class_id,title,due_date,type'),
    db.from('completions').select('assignment_id,student_id'),
    db.from('calendar_events').select('owner_id,title,date,category,note'),
  ]);

  const failed = [profiles, classes, enrollments, assignments, completions, events].find(
    (r) => r.error,
  );
  if (failed?.error) {
    return new Response(JSON.stringify({ error: failed.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const classNames = Object.fromEntries(
    (classes.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]),
  );

  const recipients = (profiles.data ?? []).filter(
    (p: { role: string; email: string | null; wants_digest: boolean }) =>
      p.role === 'student' && p.email && p.wants_digest,
  );

  const results: { to: string; subject: string; items: number; sent: boolean; error?: string }[] =
    [];

  for (const student of recipients) {
    const myClassIds = new Set(
      (enrollments.data ?? [])
        .filter((e: { student_id: string }) => e.student_id === student.id)
        .map((e: { class_id: string }) => e.class_id),
    );

    const digest = buildDigest({
      studentName: student.name,
      assignments: (assignments.data ?? []).filter((a: { class_id: string }) =>
        myClassIds.has(a.class_id),
      ),
      doneIds: (completions.data ?? [])
        .filter((c: { student_id: string }) => c.student_id === student.id)
        .map((c: { assignment_id: string }) => c.assignment_id),
      classNames,
      events: (events.data ?? []).filter(
        (e: { owner_id: string }) => e.owner_id === student.id,
      ),
      weekStart,
    });

    // A weekly "you have nothing due" email is how a mailing list gets muted.
    if (digest.empty) {
      results.push({ to: student.email, subject: digest.subject, items: 0, sent: false });
      continue;
    }

    if (dryRun) {
      results.push({
        to: student.email,
        subject: digest.subject,
        items: digest.itemCount,
        sent: false,
      });
      continue;
    }

    try {
      await sendEmail(student.email, digest.subject, digest.html, digest.text);
      results.push({
        to: student.email,
        subject: digest.subject,
        items: digest.itemCount,
        sent: true,
      });
    } catch (err) {
      // One bad address must not stop the rest of the school's mail.
      results.push({
        to: student.email,
        subject: digest.subject,
        items: digest.itemCount,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return new Response(
    JSON.stringify({ weekStart, dryRun, considered: recipients.length, results }, null, 2),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
