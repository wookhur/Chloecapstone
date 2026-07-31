import type { PracticeQuestion, PracticeQuiz } from './types';

/**
 * The class question bank: every practice card anyone in a course has written,
 * pooled together.
 *
 * Individual quizzes are small — one person's twelve vocab cards. The useful
 * study session is all of them at once, and the useful shortcut when writing a
 * new quiz is pulling in cards that already exist instead of retyping them.
 */

export interface BankCard extends PracticeQuestion {
  quizTitle: string;
  quizAuthorId: string;
}

export function bankFor(
  quizzes: PracticeQuiz[],
  questions: PracticeQuestion[],
  classId: string,
): BankCard[] {
  const inClass = new Map(
    quizzes.filter((q) => q.class_id === classId).map((q) => [q.id, q]),
  );
  return questions
    .filter((q) => inClass.has(q.quiz_id))
    .map((q) => {
      const quiz = inClass.get(q.quiz_id)!;
      return { ...q, quizTitle: quiz.title, quizAuthorId: quiz.author_id };
    })
    .sort((a, b) =>
      a.quizTitle.localeCompare(b.quizTitle) || a.position - b.position,
    );
}

/**
 * Two cards are "the same" when they ask the same thing. Bank duplicates are
 * common — two people both write "photosynthesis produces…" — and studying the
 * same card three times in a round is just annoying.
 */
export const cardKey = (q: { question: string }) =>
  q.question.trim().toLowerCase().replace(/\s+/g, ' ');

export function dedupe(cards: BankCard[]): BankCard[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const k = cardKey(c);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Seeded shuffle. Seeded rather than Math.random() so a study round stays put
 * across re-renders — with a plain random the cards would reorder under the
 * student every time they picked an answer.
 */
export function shuffle<T>(items: T[], seed: number): T[] {
  let state = seed || 1;
  const next = () => {
    // mulberry32 — small, fast, and good enough to shuffle flashcards.
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
