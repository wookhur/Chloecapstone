import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import {
  fetchClassroomSnapshot,
  isGoogleClassroomConfigured,
  type ClassroomSnapshot,
  type GClassroomCourse,
} from '../lib/googleClassroom';
import { SCHOOL_YEAR, type AssignmentType } from '../lib/types';
import { today } from '../lib/dates';
import { subjectColor } from '../lib/subjectColor';

type Phase = 'idle' | 'connecting' | 'preview' | 'importing' | 'done';

interface ImportSummary {
  classes: number;
  assignments: number;
  announcements: number;
  skipped: string[];
}

// Guess a subject from the course name so imported classes get a sensible color.
function guessSubject(name: string): string {
  const n = name.toLowerCase();
  if (/math|algebra|calc|geometry|statistics/.test(n)) return 'Math';
  if (/phys|chem|bio|science|anatomy/.test(n)) return 'Science';
  if (/english|literature|writing|lang arts/.test(n)) return 'English';
  if (/history|government|econ|civics|geograph/.test(n)) return 'History';
  if (/spanish|french|latin|chinese|german|language/.test(n)) return 'World Language';
  if (/computer|coding|program|cs\b/.test(n)) return 'Computer Science';
  if (/art|music|drama|theater|design/.test(n)) return 'Arts';
  if (/pe\b|health|gym|physical/.test(n)) return 'PE / Health';
  return 'Arts';
}

export default function ImportClassroom() {
  const { currentUser, classes, profiles, refresh } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [snapshot, setSnapshot] = useState<ClassroomSnapshot | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const connect = async () => {
    setError(null);
    setPhase('connecting');
    try {
      const snap = await fetchClassroomSnapshot();
      setSnapshot(snap);
      setSelected(new Set(snap.courses.map((c) => c.id)));
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('idle');
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runImport = async () => {
    if (!snapshot) return;
    setPhase('importing');
    const result: ImportSummary = { classes: 0, assignments: 0, announcements: 0, skipped: [] };
    const teacherCache = new Map<string, string>();

    const resolveTeacherId = async (course: GClassroomCourse): Promise<string> => {
      if (currentUser.role === 'teacher') return currentUser.id;
      if (teacherCache.has(course.ownerName)) return teacherCache.get(course.ownerName)!;
      const existing = profiles.find(
        (p) => p.role === 'teacher' && p.name === course.ownerName,
      );
      if (existing) {
        teacherCache.set(course.ownerName, existing.id);
        return existing.id;
      }
      const created = await repo.createProfile({
        name: course.ownerName,
        role: 'teacher',
        grade: null,
      });
      teacherCache.set(course.ownerName, created.id);
      return created.id;
    };

    try {
      for (const course of snapshot.courses) {
        if (!selected.has(course.id)) continue;

        // Skip a course we've already imported (matched by name).
        if (classes.some((c) => c.name.toLowerCase() === course.name.toLowerCase())) {
          result.skipped.push(course.name);
          continue;
        }

        const teacherId = await resolveTeacherId(course);
        const newClass = await repo.createClass({
          name: course.name,
          subject: guessSubject(course.name),
          grade_level: currentUser.grade ?? null,
          teacher_id: teacherId,
          period: course.section,
          room: course.room,
          school_year: SCHOOL_YEAR,
        });
        result.classes += 1;

        // Enroll the current student so it shows up on their dashboard.
        if (currentUser.role === 'student') {
          await repo.enroll(currentUser.id, newClass.id);
        }

        for (const w of snapshot.coursework.filter((x) => x.courseId === course.id)) {
          await repo.createAssignment({
            class_id: newClass.id,
            title: w.title,
            description: w.description,
            assigned_date: today(),
            due_date: w.dueDate ?? today(),
            type: w.workType as AssignmentType,
            link: null,
            created_by: teacherId,
          });
          result.assignments += 1;
        }

        for (const a of snapshot.announcements.filter((x) => x.courseId === course.id)) {
          const title = a.text.length > 60 ? a.text.slice(0, 57) + '…' : a.text;
          await repo.createAnnouncement({
            class_id: newClass.id,
            author_id: teacherId,
            title,
            body: a.text,
          });
          result.announcements += 1;
        }
      }
      await refresh();
      setSummary(result);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('preview');
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Import from Google Classroom</h1>
        <p>Bring your Google Classroom courses, assignments, and announcements into Homework Hub.</p>
      </div>

      {!isGoogleClassroomConfigured && (
        <div className="banner demo">
          <span className="dot" />
          Demo mode — showing sample Google Classroom data. Set{' '}
          <code>VITE_GOOGLE_CLIENT_ID</code> to connect a real account.
        </div>
      )}

      {error && (
        <div className="banner error" role="alert">
          <span className="dot" />
          {error}
        </div>
      )}

      {phase === 'idle' && (
        <div className="card gc-connect">
          <div className="gc-logo">🎓</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem' }}>Connect Google Classroom</h3>
            <p className="sub" style={{ margin: 0 }}>
              We'll read your courses, their coursework (with due dates), and
              announcements — read-only. Nothing is changed in Google Classroom.
            </p>
          </div>
          <button className="btn" onClick={connect}>
            {isGoogleClassroomConfigured ? 'Connect' : 'Connect (demo)'}
          </button>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="empty">Connecting to Google Classroom…</div>
      )}

      {phase === 'preview' && snapshot && (
        <div>
          <div className="row-between" style={{ marginBottom: '0.75rem' }}>
            <h2 className="section-title">
              Choose courses to import ({selected.size}/{snapshot.courses.length})
            </h2>
            <button className="btn" disabled={selected.size === 0} onClick={runImport}>
              Import selected
            </button>
          </div>
          <div className="grid cols-2">
            {snapshot.courses.map((c) => {
              const color = subjectColor(guessSubject(c.name));
              const work = snapshot.coursework.filter((w) => w.courseId === c.id).length;
              const anns = snapshot.announcements.filter((a) => a.courseId === c.id).length;
              const already = classes.some(
                (x) => x.name.toLowerCase() === c.name.toLowerCase(),
              );
              return (
                <label
                  key={c.id}
                  className={`card gc-course ${selected.has(c.id) ? 'picked' : ''}`}
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    disabled={already}
                    onChange={() => toggle(c.id)}
                  />
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem', fontSize: '1rem' }}>{c.name}</h3>
                    <p className="sub" style={{ margin: 0 }}>
                      {c.ownerName}
                      {c.section ? ` · ${c.section}` : ''}
                      {c.room ? ` · Room ${c.room}` : ''}
                    </p>
                    <p className="meta" style={{ margin: '4px 0 0' }}>
                      {work} assignment{work === 1 ? '' : 's'} · {anns} announcement
                      {anns === 1 ? '' : 's'}
                      {already && ' · already imported'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'importing' && <div className="empty">Importing…</div>}

      {phase === 'done' && summary && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.2rem' }}>✅</div>
          <h2 style={{ margin: '0.5rem 0 0.25rem' }}>Import complete</h2>
          <p className="sub">
            Added {summary.classes} course{summary.classes === 1 ? '' : 's'},{' '}
            {summary.assignments} assignment{summary.assignments === 1 ? '' : 's'}, and{' '}
            {summary.announcements} announcement{summary.announcements === 1 ? '' : 's'}.
          </p>
          {summary.skipped.length > 0 && (
            <p className="meta">
              Skipped (already imported): {summary.skipped.join(', ')}
            </p>
          )}
          <div className="inline" style={{ justifyContent: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button className="btn secondary small" onClick={() => navigate('/courses')}>
              View my courses
            </button>
            <button className="btn small" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </button>
          </div>
        </div>
      )}

      <p className="meta" style={{ marginTop: '1.25rem' }}>
        ← Back to <Link to="/courses">Courses</Link>
      </p>
    </div>
  );
}
