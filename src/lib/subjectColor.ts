import type { CSSProperties } from 'react';

// Stable color per subject, used for class chips, calendar dots, etc.
/**
 * One hue per subject, held to a similar lightness and saturation so no single
 * course shouts louder than the others. Eight fully saturated hues next to a
 * near-monochrome interface read as a paint set, not a system.
 */
const PALETTE: Record<string, string> = {
  Math: '#3a62a8',
  Science: '#2f7f5b',
  English: '#b0533a',
  History: '#94702f',
  'World Language': '#7451a8',
  'Computer Science': '#2c7a8f',
  Arts: '#a94a76',
  'PE / Health': '#587f38',
};

const FALLBACK = '#6b6259';

export function subjectColor(subject: string): string {
  return PALETTE[subject] ?? FALLBACK;
}

/**
 * Hand a colour to CSS as a custom property rather than as a finished rule.
 * Which edge is tinted, how thick it is and how far the tint is knocked back
 * are decisions that belong in the stylesheet with the rest of them; the only
 * thing the component actually knows is the value. Pair with `.accent-left`.
 *
 * The property is `--subject`, not `--accent`: `--accent` is already a token on
 * `:root`, and a name collision here would be invisible rather than broken —
 * an element that missed its colour would quietly inherit the global green
 * instead of showing up as obviously wrong.
 */
export function accent(color: string): CSSProperties {
  return { '--subject': color } as CSSProperties;
}
