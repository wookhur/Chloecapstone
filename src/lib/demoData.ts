import type { Match, Profile, Session } from './types';

// In-memory mirror of supabase/seed.sql. Used only when Supabase env vars are
// absent, so the app is fully explorable before the backend is wired up.

export const demoProfiles: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Chaehyun', role: 'coordinator', grade: 12, is_new_student: false,
    subjects: [], interests: ['community', 'leadership', 'music'],
    communication_style: 'supportive',
    personality_tags: ['empathetic', 'connector', 'trustworthy'],
    availability: ['Mon-PM', 'Wed-PM', 'Fri-PM'],
    bio: 'Matching coordinator & community lead for Yeon.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'Jisoo Park', role: 'mentor', grade: 12, is_new_student: false,
    subjects: [{ subject: 'Calculus', strength: 5 }, { subject: 'Physics', strength: 4 }],
    interests: ['robotics', 'chess', 'basketball'], communication_style: 'structured',
    personality_tags: ['patient', 'organized'], availability: ['Mon-PM', 'Wed-PM', 'Sat-AM'],
    bio: 'AP Calc & Physics. Loves breaking big problems into small steps.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    name: 'Daniel Cho', role: 'mentor', grade: 11, is_new_student: false,
    subjects: [{ subject: 'Chemistry', strength: 5 }, { subject: 'Biology', strength: 4 }],
    interests: ['biology', 'cooking', 'kpop'], communication_style: 'supportive',
    personality_tags: ['warm', 'encouraging'], availability: ['Tue-PM', 'Thu-PM', 'Sun-PM'],
    bio: 'Future pre-med. Makes chem feel less scary.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    name: 'Mina Seo', role: 'mentor', grade: 12, is_new_student: false,
    subjects: [{ subject: 'English Literature', strength: 5 }, { subject: 'History', strength: 4 }],
    interests: ['debate', 'reading', 'film'], communication_style: 'direct',
    personality_tags: ['candid', 'motivating'], availability: ['Mon-PM', 'Thu-PM', 'Sat-PM'],
    bio: 'Essay structure & close reading. Honest, fast feedback.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000014',
    name: 'Kevin Lim', role: 'mentor', grade: 11, is_new_student: false,
    subjects: [{ subject: 'Computer Science', strength: 5 }, { subject: 'Calculus', strength: 3 }],
    interests: ['coding', 'gaming', 'robotics'], communication_style: 'easygoing',
    personality_tags: ['chill', 'creative'], availability: ['Wed-PM', 'Fri-PM', 'Sun-PM'],
    bio: 'CS & intro Python. We build small projects together.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000015',
    name: 'Soyeon Han', role: 'mentor', grade: 12, is_new_student: false,
    subjects: [{ subject: 'Spanish', strength: 5 }, { subject: 'English Literature', strength: 3 }],
    interests: ['languages', 'travel', 'music'], communication_style: 'supportive',
    personality_tags: ['friendly', 'patient'], availability: ['Tue-PM', 'Thu-PM', 'Sat-AM'],
    bio: 'Bilingual. Conversation-first language practice.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    name: 'Yuna Kim', role: 'mentee', grade: 9, is_new_student: true,
    subjects: [{ subject: 'Calculus', need: 5 }],
    interests: ['chess', 'basketball', 'robotics'], communication_style: 'structured',
    personality_tags: ['shy', 'curious'], availability: ['Mon-PM', 'Sat-AM'],
    bio: 'New 9th-grade transfer. Math moves fast here.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000022',
    name: 'Ethan Yoon', role: 'mentee', grade: 10, is_new_student: false,
    subjects: [{ subject: 'Chemistry', need: 4 }],
    interests: ['cooking', 'kpop', 'biology'], communication_style: 'supportive',
    personality_tags: ['friendly', 'anxious-about-tests'], availability: ['Tue-PM', 'Sun-PM'],
    bio: 'Want to feel calm before chem quizzes.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000023',
    name: 'Hana Lee', role: 'mentee', grade: 9, is_new_student: true,
    subjects: [{ subject: 'English Literature', need: 5 }],
    interests: ['reading', 'film', 'debate'], communication_style: 'direct',
    personality_tags: ['determined'], availability: ['Mon-PM', 'Thu-PM'],
    bio: 'New student. Need help with analytical essays.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000024',
    name: 'Leo Jung', role: 'mentee', grade: 10, is_new_student: false,
    subjects: [{ subject: 'Computer Science', need: 4 }],
    interests: ['gaming', 'coding', 'robotics'], communication_style: 'easygoing',
    personality_tags: ['playful', 'self-taught'], availability: ['Wed-PM', 'Sun-PM'],
    bio: 'Can code a bit, want to get serious about it.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000025',
    name: 'Sara Moon', role: 'mentee', grade: 11, is_new_student: false,
    subjects: [{ subject: 'Spanish', need: 3 }],
    interests: ['travel', 'music', 'languages'], communication_style: 'supportive',
    personality_tags: ['outgoing'], availability: ['Tue-PM', 'Sat-AM'],
    bio: 'Conversational Spanish for an exchange trip.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000026',
    name: 'Noah Bae', role: 'mentee', grade: 9, is_new_student: true,
    subjects: [{ subject: 'Physics', need: 4 }, { subject: 'Calculus', need: 3 }],
    interests: ['basketball', 'chess', 'gaming'], communication_style: 'structured',
    personality_tags: ['quiet', 'hardworking'], availability: ['Mon-PM', 'Sat-AM'],
    bio: 'New here. Physics feels overwhelming.',
    created_at: new Date().toISOString(),
  },
];

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const demoMatches: Match[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    mentor_id: '00000000-0000-0000-0000-000000000011',
    mentee_id: '00000000-0000-0000-0000-000000000021',
    subject: 'Calculus', status: 'active', requested_by: 'mentee', score: 88,
    score_breakdown: { subject: 40, compatibility: 31, time: 10, coordinator: 7 },
    coordinator_adjustment: 2,
    coordinator_note: 'Both love chess & robotics — great rapport early on.',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    mentor_id: '00000000-0000-0000-0000-000000000013',
    mentee_id: '00000000-0000-0000-0000-000000000023',
    subject: 'English Literature', status: 'requested', requested_by: 'mentee', score: 84,
    score_breakdown: { subject: 40, compatibility: 29, time: 10, coordinator: 5 },
    coordinator_adjustment: 0, coordinator_note: null,
    created_at: new Date().toISOString(),
  },
];

export const demoSessions: Session[] = [
  {
    id: 's1', match_id: '00000000-0000-0000-0000-000000000101', session_no: 1,
    date: daysAgo(21), topic: 'Limits & continuity', duration_min: 60,
    satisfaction: 4, relationship_fit: 'good', mentee_growth: false, notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 's2', match_id: '00000000-0000-0000-0000-000000000101', session_no: 2,
    date: daysAgo(14), topic: 'Derivatives intro', duration_min: 60,
    satisfaction: 5, relationship_fit: 'good', mentee_growth: false, notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 's3', match_id: '00000000-0000-0000-0000-000000000101', session_no: 3,
    date: daysAgo(7), topic: 'Chain rule practice', duration_min: 60,
    satisfaction: 5, relationship_fit: 'good', mentee_growth: true, notes: null,
    created_at: new Date().toISOString(),
  },
];
