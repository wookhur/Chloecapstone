import { isSupabaseConfigured, supabase } from './supabase';
import {
  demoAssignments,
  demoClasses,
  demoEnrollments,
  demoProfiles,
} from './demoData';
import type { Assignment, ClassInfo, Enrollment, Profile } from './types';

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
};

const uuid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

// --- Reads ------------------------------------------------------------------
export async function fetchProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [...mem.profiles];
  const { data, error } = await supabase!.from('profiles').select('*').order('name');
  if (error) throw error;
  return data as Profile[];
}

export async function fetchClasses(): Promise<ClassInfo[]> {
  if (!isSupabaseConfigured) return [...mem.classes];
  const { data, error } = await supabase!.from('classes').select('*').order('name');
  if (error) throw error;
  return data as ClassInfo[];
}

export async function fetchEnrollments(): Promise<Enrollment[]> {
  if (!isSupabaseConfigured) return [...mem.enrollments];
  const { data, error } = await supabase!.from('enrollments').select('*');
  if (error) throw error;
  return data as Enrollment[];
}

export async function fetchAssignments(): Promise<Assignment[]> {
  if (!isSupabaseConfigured) return [...mem.assignments];
  const { data, error } = await supabase!.from('assignments').select('*');
  if (error) throw error;
  return data as Assignment[];
}

// --- Enrollments (student picks classes) -----------------------------------
export async function enroll(studentId: string, classId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!mem.enrollments.some((e) => e.student_id === studentId && e.class_id === classId)) {
      mem.enrollments.push({
        id: uuid(),
        student_id: studentId,
        class_id: classId,
        created_at: new Date().toISOString(),
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
export async function createClass(
  cls: Omit<ClassInfo, 'id' | 'created_at'>,
): Promise<ClassInfo> {
  if (!isSupabaseConfigured) {
    const created: ClassInfo = { ...cls, id: uuid(), created_at: new Date().toISOString() };
    mem.classes.push(created);
    return created;
  }
  const { data, error } = await supabase!.from('classes').insert(cls).select().single();
  if (error) throw error;
  return data as ClassInfo;
}

// --- Assignments (teachers post homework) ----------------------------------
export async function createAssignment(
  a: Omit<Assignment, 'id' | 'created_at'>,
): Promise<Assignment> {
  if (!isSupabaseConfigured) {
    const created: Assignment = { ...a, id: uuid(), created_at: new Date().toISOString() };
    mem.assignments.push(created);
    return created;
  }
  const { data, error } = await supabase!.from('assignments').insert(a).select().single();
  if (error) throw error;
  return data as Assignment;
}

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
