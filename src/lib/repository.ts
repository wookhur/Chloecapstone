import { isSupabaseConfigured, supabase } from './supabase';
import {
  demoAnnouncements,
  demoAssignments,
  demoCalendarEvents,
  demoClasses,
  demoDiscussionPosts,
  demoDiscussionTopics,
  demoEnrollments,
  demoFiles,
  demoPracticeQuestions,
  demoPracticeQuizzes,
  demoProfiles,
} from './demoData';
import type {
  Announcement,
  Assignment,
  CalendarEvent,
  ClassInfo,
  CourseFile,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
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
  announcements: [...demoAnnouncements],
  discussionTopics: [...demoDiscussionTopics],
  discussionPosts: [...demoDiscussionPosts],
  practiceQuizzes: [...demoPracticeQuizzes],
  practiceQuestions: [...demoPracticeQuestions],
  files: [...demoFiles],
  calendarEvents: [...demoCalendarEvents],
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
export const fetchCalendarEvents = () =>
  fetchTable<CalendarEvent>(mem.calendarEvents, 'calendar_events', 'date');

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

// --- Classes (teachers create their own) -----------------------------------
export const createClass = (cls: Omit<ClassInfo, 'id' | 'created_at'>) =>
  insertRow<ClassInfo>(mem.classes, 'classes', cls);

// --- Assignments (teachers post homework) ----------------------------------
export const createAssignment = (a: Omit<Assignment, 'id' | 'created_at'>) =>
  insertRow<Assignment>(mem.assignments, 'assignments', a);

export async function updateAssignment(
  id: string,
  patch: Partial<Assignment>,
): Promise<Assignment> {
  if (!isSupabaseConfigured) {
    const idx = mem.assignments.findIndex((a) => a.id === id);
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

// --- Files (metadata only for now) --------------------------------------------
export const createFile = (f: Omit<CourseFile, 'id' | 'created_at'>) =>
  insertRow<CourseFile>(mem.files, 'files', f);

export async function deleteFile(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mem.files = mem.files.filter((f) => f.id !== id);
    return;
  }
  const { error } = await supabase!.from('files').delete().eq('id', id);
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
