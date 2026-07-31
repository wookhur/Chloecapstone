import { isSupabaseConfigured, supabase } from './supabase';
import { removeStoredFile } from './storage';
import {
  demoAnnouncements,
  demoAssignments,
  demoCalendarEvents,
  demoClasses,
  demoCompletions,
  demoCounselorSlots,
  demoDiscussionPosts,
  demoDiscussionTopics,
  demoEnrollments,
  demoFiles,
  demoGuardianships,
  demoMeetingRequests,
  demoPracticeQuestions,
  demoPracticeQuizzes,
  demoProfiles,
} from './demoData';
import type {
  Announcement,
  Assignment,
  CalendarEvent,
  ClassInfo,
  Completion,
  CounselorSlot,
  CourseFile,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
  Guardianship,
  MeetingRequest,
  PracticeQuestion,
  PracticeQuiz,
  Profile,
} from './types';

/**
 * Data access for Homework Hub. When Supabase is configured every call hits the
 * database; otherwise it operates on an in-memory copy of the demo data so the
 * UI stays fully interactive during local exploration.
 */

const mem = {
  profiles: [...demoProfiles],
  classes: [...demoClasses],
  enrollments: [...demoEnrollments],
  assignments: [...demoAssignments],
  completions: [...demoCompletions],
  announcements: [...demoAnnouncements],
  discussionTopics: [...demoDiscussionTopics],
  discussionPosts: [...demoDiscussionPosts],
  practiceQuizzes: [...demoPracticeQuizzes],
  practiceQuestions: [...demoPracticeQuestions],
  files: [...demoFiles],
  calendarEvents: [...demoCalendarEvents],
  meetingRequests: [...demoMeetingRequests],
  counselorSlots: [...demoCounselorSlots],
  guardianships: [...demoGuardianships],
};

const uuid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

const nowISO = () => new Date().toISOString();

/** Generic table read: demo copy when offline, `select *` when connected. */
async function fetchTable<T>(memRows: T[], table: string, orderBy?: string): Promise<T[]> {
  if (!isSupabaseConfigured) return [...memRows];
  let q = supabase!.from(table).select('*');
  if (orderBy) q = q.order(orderBy);
  const { data, error } = await q;
  if (error) throw error;
  return data as T[];
}

// --- Reads ------------------------------------------------------------------
export const fetchProfiles = () => fetchTable<Profile>(mem.profiles, 'profiles', 'name');
export const fetchClasses = () => fetchTable<ClassInfo>(mem.classes, 'classes', 'name');
export const fetchEnrollments = () => fetchTable<Enrollment>(mem.enrollments, 'enrollments');
export const fetchAssignments = () => fetchTable<Assignment>(mem.assignments, 'assignments');
export const fetchCompletions = () => fetchTable<Completion>(mem.completions, 'completions');
export const fetchAnnouncements = () =>
  fetchTable<Announcement>(mem.announcements, 'announcements');
export const fetchDiscussionTopics = () =>
  fetchTable<DiscussionTopic>(mem.discussionTopics, 'discussion_topics');
export const fetchDiscussionPosts = () =>
  fetchTable<DiscussionPost>(mem.discussionPosts, 'discussion_posts');
export const fetchPracticeQuizzes = () =>
  fetchTable<PracticeQuiz>(mem.practiceQuizzes, 'practice_quizzes');
export const fetchPracticeQuestions = () =>
  fetchTable<PracticeQuestion>(mem.practiceQuestions, 'practice_questions', 'position');
export const fetchFiles = () => fetchTable<CourseFile>(mem.files, 'files', 'name');
export const fetchGuardianships = () =>
  fetchTable<Guardianship>(mem.guardianships, 'guardianships');
export const fetchMeetingRequests = () =>
  fetchTable<MeetingRequest>(mem.meetingRequests, 'meeting_requests');
export const fetchCalendarEvents = () =>
  fetchTable<CalendarEvent>(mem.calendarEvents, 'calendar_events', 'date');
export const fetchCounselorSlots = () =>
  fetchTable<CounselorSlot>(mem.counselorSlots, 'counselor_slots', 'date');

// --- Generic insert helper ---------------------------------------------------
async function insertRow<T extends { id: string; created_at?: string }>(
  memRows: T[],
  table: string,
  row: Omit<T, 'id' | 'created_at'>,
): Promise<T> {
  if (!isSupabaseConfigured) {
    const created = { ...row, id: uuid(), created_at: nowISO() } as T;
    memRows.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from(table)
    .insert(row as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

// --- Enrollments (student picks classes) -----------------------------------
export async function enroll(studentId: string, classId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!mem.enrollments.some((e) => e.student_id === studentId && e.class_id === classId)) {
      mem.enrollments.push({
        id: uuid(),
        student_id: studentId,
        class_id: classId,
        created_at: nowISO(),
      });
    }
    return;
  }
  const { error } = await supabase!
    .from('enrollments')
    .insert({ student_id: studentId, class_id: classId });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unenroll(studentId: string, classId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.enrollments = mem.enrollments.filter(
      (e) => !(e.student_id === studentId && e.class_id === classId),
    );
    return;
  }
  const { error } = await supabase!
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId);
  if (error) throw error;
}

// --- Profiles (e.g. a teacher created while importing) ----------------------
export const createProfile = (p: Omit<Profile, 'id' | 'created_at'>) =>
  insertRow<Profile>(mem.profiles, 'profiles', p);

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const idx = mem.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Profile ${id} no longer exists`);
    mem.profiles[idx] = { ...mem.profiles[idx], ...patch };
    return mem.profiles[idx];
  }
  const { data, error } = await supabase!
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// --- Classes (teachers create their own) -----------------------------------
export const createClass = (cls: Omit<ClassInfo, 'id' | 'created_at'>) =>
  insertRow<ClassInfo>(mem.classes, 'classes', cls);

// --- Assignments (teachers post homework) ----------------------------------
export const createAssignment = (a: Omit<Assignment, 'id' | 'created_at'>) =>
  insertRow<Assignment>(mem.assignments, 'assignments', a);

/**
 * Insert several assignments at once. Teachers plan a unit in one sitting, so a
 * single round trip beats one request per row.
 */
export async function createAssignments(
  rows: Omit<Assignment, 'id' | 'created_at'>[],
): Promise<Assignment[]> {
  if (rows.length === 0) return [];
  if (!isSupabaseConfigured) {
    const created = rows.map((r) => ({
      ...r,
      id: uuid(),
      created_at: nowISO(),
    })) as Assignment[];
    mem.assignments.push(...created);
    return created;
  }
  const { data, error } = await supabase!.from('assignments').insert(rows).select();
  if (error) throw error;
  return data as Assignment[];
}

export async function updateAssignment(
  id: string,
  patch: Partial<Assignment>,
): Promise<Assignment> {
  if (!isSupabaseConfigured) {
    const idx = mem.assignments.findIndex((a) => a.id === id);
    // Match the Supabase path, which errors rather than writing to index -1.
    if (idx === -1) throw new Error(`Assignment ${id} no longer exists`);
    mem.assignments[idx] = { ...mem.assignments[idx], ...patch };
    return mem.assignments[idx];
  }
  const { data, error } = await supabase!
    .from('assignments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Assignment;
}

export async function deleteAssignment(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.assignments = mem.assignments.filter((a) => a.id !== id);
    return;
  }
  const { error } = await supabase!.from('assignments').delete().eq('id', id);
  if (error) throw error;
}

// --- Completions (a student's private checklist) -----------------------------
/** Tick or untick an assignment for one student. Returns the new state. */
export async function setCompleted(
  assignmentId: string,
  studentId: string,
  done: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    if (done) {
      if (!mem.completions.some((c) => c.assignment_id === assignmentId && c.student_id === studentId)) {
        mem.completions.push({
          id: uuid(),
          assignment_id: assignmentId,
          student_id: studentId,
          completed_at: nowISO(),
        });
      }
    } else {
      mem.completions = mem.completions.filter(
        (c) => !(c.assignment_id === assignmentId && c.student_id === studentId),
      );
    }
    return done;
  }

  if (done) {
    const { error } = await supabase!
      .from('completions')
      .insert({ assignment_id: assignmentId, student_id: studentId });
    if (error && error.code !== '23505') throw error; // ignore double-tick
  } else {
    const { error } = await supabase!
      .from('completions')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId);
    if (error) throw error;
  }
  return done;
}

// --- Announcements -----------------------------------------------------------
export const createAnnouncement = (a: Omit<Announcement, 'id' | 'created_at'>) =>
  insertRow<Announcement>(mem.announcements, 'announcements', a);

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.announcements = mem.announcements.filter((a) => a.id !== id);
    return;
  }
  const { error } = await supabase!.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// --- Discussions ---------------------------------------------------------------
export const createDiscussionTopic = (t: Omit<DiscussionTopic, 'id' | 'created_at'>) =>
  insertRow<DiscussionTopic>(mem.discussionTopics, 'discussion_topics', t);

export const createDiscussionPost = (p: Omit<DiscussionPost, 'id' | 'created_at'>) =>
  insertRow<DiscussionPost>(mem.discussionPosts, 'discussion_posts', p);

// --- Practice quizzes (Quizlet-style, student-made) -----------------------------
export const createPracticeQuiz = (q: Omit<PracticeQuiz, 'id' | 'created_at'>) =>
  insertRow<PracticeQuiz>(mem.practiceQuizzes, 'practice_quizzes', q);

export async function deletePracticeQuiz(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.practiceQuizzes = mem.practiceQuizzes.filter((q) => q.id !== id);
    mem.practiceQuestions = mem.practiceQuestions.filter((q) => q.quiz_id !== id);
    return;
  }
  const { error } = await supabase!.from('practice_quizzes').delete().eq('id', id);
  if (error) throw error;
}

export async function createPracticeQuestion(
  q: Omit<PracticeQuestion, 'id'>,
): Promise<PracticeQuestion> {
  if (!isSupabaseConfigured) {
    const created: PracticeQuestion = { ...q, id: uuid() };
    mem.practiceQuestions.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from('practice_questions')
    .insert(q)
    .select()
    .single();
  if (error) throw error;
  return data as PracticeQuestion;
}

export async function deletePracticeQuestion(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.practiceQuestions = mem.practiceQuestions.filter((q) => q.id !== id);
    return;
  }
  const { error } = await supabase!.from('practice_questions').delete().eq('id', id);
  if (error) throw error;
}

// --- Files (row here, bytes in Storage — see lib/storage.ts) ------------------
export const createFile = (f: Omit<CourseFile, 'id' | 'created_at'>) =>
  insertRow<CourseFile>(mem.files, 'files', f);

/**
 * Removes the stored bytes first. If that fails we stop and keep the row, so
 * the file stays listed and openable — the alternative is an invisible object
 * sitting in the bucket that nobody can find to clean up.
 */
export async function deleteFile(id: string, storagePath: string | null): Promise<void> {
  await removeStoredFile(storagePath);
  if (!isSupabaseConfigured) {
    mem.files = mem.files.filter((f) => f.id !== id);
    return;
  }
  const { error } = await supabase!.from('files').delete().eq('id', id);
  if (error) throw error;
}

// --- Meeting requests (student asks a counselor for time) ---------------------
export const createMeetingRequest = (r: Omit<MeetingRequest, 'id' | 'created_at'>) =>
  insertRow<MeetingRequest>(mem.meetingRequests, 'meeting_requests', r);

export async function updateMeetingRequest(
  id: string,
  patch: Partial<MeetingRequest>,
): Promise<MeetingRequest> {
  if (!isSupabaseConfigured) {
    const idx = mem.meetingRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Meeting request ${id} no longer exists`);
    mem.meetingRequests[idx] = { ...mem.meetingRequests[idx], ...patch };
    return mem.meetingRequests[idx];
  }
  const { data, error } = await supabase!
    .from('meeting_requests')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MeetingRequest;
}

// --- Counselor availability slots --------------------------------------------
export async function createCounselorSlots(
  rows: Omit<CounselorSlot, 'id' | 'created_at'>[],
): Promise<CounselorSlot[]> {
  if (rows.length === 0) return [];
  if (!isSupabaseConfigured) {
    const created = rows
      // Posting the same time twice would put two identical rows on the list and
      // let two students each "book" it. The unique index does this in Postgres.
      .filter(
        (r) =>
          !mem.counselorSlots.some(
            (s) =>
              s.counselor_id === r.counselor_id &&
              s.date === r.date &&
              s.start_time === r.start_time,
          ),
      )
      .map((r) => ({ ...r, id: uuid(), created_at: nowISO() })) as CounselorSlot[];
    mem.counselorSlots.push(...created);
    return created;
  }
  const { data, error } = await supabase!
    .from('counselor_slots')
    .upsert(rows, { onConflict: 'counselor_id,date,start_time', ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return (data ?? []) as CounselorSlot[];
}

export async function deleteCounselorSlot(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.counselorSlots = mem.counselorSlots.filter((s) => s.id !== id);
    return;
  }
  const { error } = await supabase!.from('counselor_slots').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Claim an open slot. The write is conditional on it still being open, so two
 * students hitting "book" at the same time can't both get it — the second gets
 * told the time was taken instead of a meeting that doesn't exist.
 */
export async function bookCounselorSlot(
  slotId: string,
  studentId: string,
): Promise<CounselorSlot> {
  const taken = new Error('That time was just booked by someone else. Pick another.');
  if (!isSupabaseConfigured) {
    const idx = mem.counselorSlots.findIndex((s) => s.id === slotId);
    if (idx === -1) throw new Error('That time is no longer available.');
    if (mem.counselorSlots[idx].booked_by) throw taken;
    mem.counselorSlots[idx] = { ...mem.counselorSlots[idx], booked_by: studentId };
    return mem.counselorSlots[idx];
  }
  const { data, error } = await supabase!
    .from('counselor_slots')
    .update({ booked_by: studentId })
    .eq('id', slotId)
    .is('booked_by', null)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw taken;
  return data[0] as CounselorSlot;
}

/** Free a slot again — used when a booked meeting is cancelled. */
export async function releaseCounselorSlot(slotId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = mem.counselorSlots.findIndex((s) => s.id === slotId);
    if (idx !== -1) mem.counselorSlots[idx] = { ...mem.counselorSlots[idx], booked_by: null };
    return;
  }
  const { error } = await supabase!
    .from('counselor_slots')
    .update({ booked_by: null })
    .eq('id', slotId);
  if (error) throw error;
}

// --- Calendar events (personal, hand-added) -----------------------------------
export const createCalendarEvent = (e: Omit<CalendarEvent, 'id' | 'created_at'>) =>
  insertRow<CalendarEvent>(mem.calendarEvents, 'calendar_events', e);

export async function deleteCalendarEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.calendarEvents = mem.calendarEvents.filter((e) => e.id !== id);
    return;
  }
  const { error } = await supabase!.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
