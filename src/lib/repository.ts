import { isSupabaseConfigured, supabase } from './supabase';
import {
  demoAnnouncements,
  demoAssignments,
  demoClasses,
  demoConversations,
  demoDiscussionPosts,
  demoDiscussionTopics,
  demoEnrollments,
  demoFiles,
  demoMessages,
  demoModuleItems,
  demoModules,
  demoPages,
  demoPracticeQuestions,
  demoPracticeQuizzes,
  demoProfiles,
  demoSubmissions,
} from './demoData';
import type {
  Announcement,
  Assignment,
  ClassInfo,
  Conversation,
  CourseFile,
  CourseModule,
  DiscussionPost,
  DiscussionTopic,
  Enrollment,
  Message,
  ModuleItem,
  PracticeQuestion,
  PracticeQuiz,
  Profile,
  Submission,
  WikiPage,
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
  submissions: [...demoSubmissions],
  announcements: [...demoAnnouncements],
  discussionTopics: [...demoDiscussionTopics],
  discussionPosts: [...demoDiscussionPosts],
  practiceQuizzes: [...demoPracticeQuizzes],
  practiceQuestions: [...demoPracticeQuestions],
  modules: [...demoModules],
  moduleItems: [...demoModuleItems],
  pages: [...demoPages],
  files: [...demoFiles],
  conversations: [...demoConversations],
  messages: [...demoMessages],
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
export const fetchSubmissions = () => fetchTable<Submission>(mem.submissions, 'submissions');
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
export const fetchModules = () => fetchTable<CourseModule>(mem.modules, 'modules', 'position');
export const fetchModuleItems = () =>
  fetchTable<ModuleItem>(mem.moduleItems, 'module_items', 'position');
export const fetchPages = () => fetchTable<WikiPage>(mem.pages, 'pages', 'title');
export const fetchFiles = () => fetchTable<CourseFile>(mem.files, 'files', 'name');
export const fetchConversations = () =>
  fetchTable<Conversation>(mem.conversations, 'conversations');
export const fetchMessages = () => fetchTable<Message>(mem.messages, 'messages', 'created_at');

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

// --- Classes (teachers create their own) -----------------------------------
export const createClass = (cls: Omit<ClassInfo, 'id' | 'created_at'>) =>
  insertRow<ClassInfo>(mem.classes, 'classes', cls);

export async function updateClass(id: string, patch: Partial<ClassInfo>): Promise<ClassInfo> {
  if (!isSupabaseConfigured) {
    const idx = mem.classes.findIndex((c) => c.id === id);
    mem.classes[idx] = { ...mem.classes[idx], ...patch };
    return mem.classes[idx];
  }
  const { data, error } = await supabase!
    .from('classes')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ClassInfo;
}

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

// --- Submissions (students turn work in; teachers grade) --------------------
/** Create or replace the student's submission for an assignment. */
export async function submitWork(
  assignmentId: string,
  studentId: string,
  work: { body?: string | null; url?: string | null; score?: number | null; graded?: boolean },
): Promise<Submission> {
  const stamp = nowISO();
  const fields = {
    body: work.body ?? null,
    url: work.url ?? null,
    submitted_at: stamp,
    score: work.score ?? null,
    graded_at: work.graded ? stamp : null,
  };
  if (!isSupabaseConfigured) {
    const existing = mem.submissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId,
    );
    if (existing) {
      Object.assign(existing, fields);
      return existing;
    }
    const created: Submission = {
      id: uuid(),
      assignment_id: assignmentId,
      student_id: studentId,
      grade_comment: null,
      created_at: stamp,
      ...fields,
    };
    mem.submissions.push(created);
    return created;
  }
  const { data, error } = await supabase!
    .from('submissions')
    .upsert(
      { assignment_id: assignmentId, student_id: studentId, ...fields },
      { onConflict: 'assignment_id,student_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

/** Teacher grades a submission (creating a shell row if the student never submitted). */
export async function gradeSubmission(
  assignmentId: string,
  studentId: string,
  score: number | null,
  comment: string | null,
): Promise<Submission> {
  const stamp = nowISO();
  if (!isSupabaseConfigured) {
    let sub = mem.submissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId,
    );
    if (!sub) {
      sub = {
        id: uuid(),
        assignment_id: assignmentId,
        student_id: studentId,
        body: null,
        url: null,
        submitted_at: null,
        score: null,
        grade_comment: null,
        graded_at: null,
        created_at: stamp,
      };
      mem.submissions.push(sub);
    }
    sub.score = score;
    sub.grade_comment = comment;
    sub.graded_at = score == null ? null : stamp;
    return sub;
  }
  const { data, error } = await supabase!
    .from('submissions')
    .upsert(
      {
        assignment_id: assignmentId,
        student_id: studentId,
        score,
        grade_comment: comment,
        graded_at: score == null ? null : stamp,
      },
      { onConflict: 'assignment_id,student_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
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

// --- Modules ---------------------------------------------------------------------
export async function createModule(m: Omit<CourseModule, 'id'>): Promise<CourseModule> {
  if (!isSupabaseConfigured) {
    const created: CourseModule = { ...m, id: uuid() };
    mem.modules.push(created);
    return created;
  }
  const { data, error } = await supabase!.from('modules').insert(m).select().single();
  if (error) throw error;
  return data as CourseModule;
}

export async function createModuleItem(mi: Omit<ModuleItem, 'id'>): Promise<ModuleItem> {
  if (!isSupabaseConfigured) {
    const created: ModuleItem = { ...mi, id: uuid() };
    mem.moduleItems.push(created);
    return created;
  }
  const { data, error } = await supabase!.from('module_items').insert(mi).select().single();
  if (error) throw error;
  return data as ModuleItem;
}

// --- Pages -----------------------------------------------------------------------
export const createPage = (p: Omit<WikiPage, 'id' | 'created_at'>) =>
  insertRow<WikiPage>(mem.pages, 'pages', p);

export async function updatePage(id: string, patch: Partial<WikiPage>): Promise<WikiPage> {
  const withStamp = { ...patch, updated_at: nowISO() };
  if (!isSupabaseConfigured) {
    const idx = mem.pages.findIndex((p) => p.id === id);
    mem.pages[idx] = { ...mem.pages[idx], ...withStamp };
    return mem.pages[idx];
  }
  const { data, error } = await supabase!
    .from('pages')
    .update(withStamp)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WikiPage;
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

// --- Inbox -----------------------------------------------------------------------
export const createConversation = (c: Omit<Conversation, 'id' | 'created_at'>) =>
  insertRow<Conversation>(mem.conversations, 'conversations', c);

export const createMessage = (m: Omit<Message, 'id' | 'created_at'>) =>
  insertRow<Message>(mem.messages, 'messages', m);
