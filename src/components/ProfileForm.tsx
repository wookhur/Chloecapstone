import { useState } from 'react';
import {
  AVAILABILITY_SLOTS,
  COMMUNICATION_STYLES,
  type CommunicationStyle,
  type Profile,
  type Role,
} from '../lib/types';

export interface ProfileDraft {
  name: string;
  role: Exclude<Role, 'coordinator'>;
  grade: number;
  is_new_student: boolean;
  subjectName: string;
  subjectLevel: number; // strength (mentor) or need (mentee)
  interests: string[];
  communication_style: CommunicationStyle | '';
  personality_tags: string[];
  availability: string[];
  bio: string;
}

const INTEREST_OPTIONS = [
  'robotics', 'chess', 'basketball', 'coding', 'gaming', 'reading', 'film',
  'debate', 'music', 'kpop', 'cooking', 'biology', 'travel', 'languages',
  'art', 'soccer', 'volunteering', 'photography',
];

export function draftFromProfile(p: Profile): ProfileDraft {
  const first = p.subjects[0] as { subject?: string; strength?: number; need?: number } | undefined;
  return {
    name: p.name,
    role: p.role === 'mentor' ? 'mentor' : 'mentee',
    grade: p.grade ?? 9,
    is_new_student: p.is_new_student,
    subjectName: first?.subject ?? '',
    subjectLevel: first?.strength ?? first?.need ?? 3,
    interests: p.interests,
    communication_style: p.communication_style ?? '',
    personality_tags: p.personality_tags,
    availability: p.availability,
    bio: p.bio ?? '',
  };
}

export function emptyDraft(): ProfileDraft {
  return {
    name: '', role: 'mentee', grade: 9, is_new_student: false,
    subjectName: '', subjectLevel: 3, interests: [], communication_style: '',
    personality_tags: [], availability: [], bio: '',
  };
}

/** Convert a draft into the shape repository.upsertProfile expects. */
export function draftToProfile(d: ProfileDraft): Omit<Profile, 'id' | 'created_at'> {
  const subject = d.subjectName.trim()
    ? [
        d.role === 'mentor'
          ? { subject: d.subjectName.trim(), strength: d.subjectLevel }
          : { subject: d.subjectName.trim(), need: d.subjectLevel },
      ]
    : [];
  return {
    name: d.name.trim(),
    role: d.role,
    grade: d.grade,
    is_new_student: d.role === 'mentee' ? d.is_new_student : false,
    subjects: subject,
    interests: d.interests,
    communication_style: d.communication_style || null,
    personality_tags: d.personality_tags,
    availability: d.availability,
    bio: d.bio.trim() || null,
  };
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface Props {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  lockRole?: boolean;
}

export default function ProfileForm({ draft, onChange, lockRole }: Props) {
  const [personalityInput, setPersonalityInput] = useState('');
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...draft, ...patch });

  return (
    <div>
      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={draft.name}
          placeholder="e.g. Yuna Kim"
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      {!lockRole && (
        <div className="field">
          <label>I want to join as</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle ${draft.role === 'mentee' ? 'on' : ''}`}
              onClick={() => set({ role: 'mentee' })}
            >
              Mentee — I'd like help
            </button>
            <button
              type="button"
              className={`toggle ${draft.role === 'mentor' ? 'on accent' : ''}`}
              onClick={() => set({ role: 'mentor' })}
            >
              Mentor — I can help
            </button>
          </div>
        </div>
      )}

      <div className="inline" style={{ gap: '1rem' }}>
        <div className="field" style={{ flex: '0 0 120px' }}>
          <label>Grade</label>
          <select value={draft.grade} onChange={(e) => set({ grade: Number(e.target.value) })}>
            {[6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        {draft.role === 'mentee' && (
          <div className="field" style={{ flex: 1 }}>
            <label>New / transfer student?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle ${draft.is_new_student ? 'on' : ''}`}
                onClick={() => set({ is_new_student: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={`toggle ${!draft.is_new_student ? 'on' : ''}`}
                onClick={() => set({ is_new_student: false })}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="inline" style={{ gap: '1rem', alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Subject {draft.role === 'mentor' ? 'I can teach' : 'I need help with'}</label>
          <input
            type="text"
            value={draft.subjectName}
            placeholder="e.g. Calculus"
            onChange={(e) => set({ subjectName: e.target.value })}
          />
        </div>
        <div className="field" style={{ flex: '0 0 180px' }}>
          <label>
            {draft.role === 'mentor' ? 'My strength' : 'How much help'} <span className="hint">(1–5)</span>
          </label>
          <select value={draft.subjectLevel} onChange={(e) => set({ subjectLevel: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Interests <span className="hint">— the heart of relationship-centered matching</span></label>
        <div className="toggle-group">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`toggle ${draft.interests.includes(opt) ? 'on accent' : ''}`}
              onClick={() => set({ interests: toggle(draft.interests, opt) })}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Communication style</label>
        <div className="toggle-group">
          {COMMUNICATION_STYLES.map((style) => (
            <button
              type="button"
              key={style}
              className={`toggle ${draft.communication_style === style ? 'on' : ''}`}
              onClick={() => set({ communication_style: draft.communication_style === style ? '' : style })}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Personality tags</label>
        <div className="chips" style={{ marginBottom: '0.5rem' }}>
          {draft.personality_tags.map((tag) => (
            <button
              type="button"
              key={tag}
              className="chip"
              onClick={() => set({ personality_tags: toggle(draft.personality_tags, tag) })}
              title="Click to remove"
            >
              {tag} ✕
            </button>
          ))}
        </div>
        <div className="inline">
          <input
            type="text"
            value={personalityInput}
            placeholder="e.g. patient, curious"
            onChange={(e) => setPersonalityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && personalityInput.trim()) {
                e.preventDefault();
                set({ personality_tags: toggle(draft.personality_tags, personalityInput.trim()) });
                setPersonalityInput('');
              }
            }}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn secondary small"
            onClick={() => {
              if (personalityInput.trim()) {
                set({ personality_tags: toggle(draft.personality_tags, personalityInput.trim()) });
                setPersonalityInput('');
              }
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="field">
        <label>Availability</label>
        <div className="toggle-group">
          {AVAILABILITY_SLOTS.map((slot) => (
            <button
              type="button"
              key={slot}
              className={`toggle ${draft.availability.includes(slot) ? 'on' : ''}`}
              onClick={() => set({ availability: toggle(draft.availability, slot) })}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Short intro</label>
        <textarea
          value={draft.bio}
          placeholder="A sentence about you and what you're hoping for."
          onChange={(e) => set({ bio: e.target.value })}
        />
      </div>
    </div>
  );
}
