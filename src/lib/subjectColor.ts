// Stable color per subject, used for class chips, calendar dots, etc.
const PALETTE: Record<string, string> = {
  Math: '#3b6fd4',
  Science: '#2f9e6b',
  English: '#c0562f',
  History: '#a9772a',
  'World Language': '#8a53c4',
  'Computer Science': '#2a8ea9',
  Arts: '#c74a8a',
  'PE / Health': '#5b8f2f',
};

const FALLBACK = '#6f655b';

export function subjectColor(subject: string): string {
  return PALETTE[subject] ?? FALLBACK;
}
