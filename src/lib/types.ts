// Shared types — mirror the columns defined in supabase/schema.sql.

export type Role = 'mentor' | 'mentee' | 'coordinator';

export type CommunicationStyle =
  | 'direct'
  | 'supportive'
  | 'structured'
  | 'easygoing';

export const COMMUNICATION_STYLES: CommunicationStyle[] = [
  'direct',
  'supportive',
  'structured',
  'easygoing',
];

/** Days × time-of-day slots students select for availability. */
export const AVAILABILITY_SLOTS = [
  'Mon-AM', 'Mon-PM', 'Mon-Eve',
  'Tue-AM', 'Tue-PM', 'Tue-Eve',
  'Wed-AM', 'Wed-PM', 'Wed-Eve',
  'Thu-AM', 'Thu-PM', 'Thu-Eve',
  'Fri-AM', 'Fri-PM', 'Fri-Eve',
  'Sat-AM', 'Sat-PM',
  'Sun-AM', 'Sun-PM',
] as const;

export interface MentorSubject {
  subject: string;
  strength: number; // 1–5, how strong the mentor is
}

export interface MenteeSubject {
  subject: string;
  need: number; // 1–5, how much help is needed
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  grade: number | null;
  is_new_student: boolean;
  subjects: (MentorSubject | MenteeSubject)[];
  interests: string[];
  communication_style: CommunicationStyle | null;
  personality_tags: string[];
  availability: string[];
  bio: string | null;
  created_at: string;
}

export type MatchStatus =
  | 'suggested'
  | 'requested'
  | 'active'
  | 'ended'
  | 'rematch';

export interface ScoreBreakdown {
  subject: number;
  compatibility: number;
  time: number;
  coordinator: number;
}

export interface Match {
  id: string;
  mentor_id: string;
  mentee_id: string;
  subject: string;
  status: MatchStatus;
  requested_by: Role | null;
  score: number;
  score_breakdown: ScoreBreakdown;
  coordinator_adjustment: number;
  coordinator_note: string | null;
  created_at: string;
}

export type RelationshipFit = 'good' | 'okay' | 'poor';

export interface Session {
  id: string;
  match_id: string;
  session_no: number;
  date: string;
  topic: string | null;
  duration_min: number;
  satisfaction: number | null;
  relationship_fit: RelationshipFit | null;
  mentee_growth: boolean;
  notes: string | null;
  created_at: string;
}
