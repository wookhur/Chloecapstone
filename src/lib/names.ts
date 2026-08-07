import type { Profile } from './types';

/**
 * Demo profiles carry a role suffix in their name ("Mina (Student)",
 * "Ms. Rivera (Counselor)") so the account switcher is readable. Strip it
 * everywhere the name is shown as a person, not as an account.
 */
export function displayName(person: Profile | { name: string } | undefined | null): string {
  if (!person) return 'Unknown';
  return person.name.replace(/\s*\((?:Student|Teacher|Counselor|Admin)\)\s*$/i, '').trim();
}

/**
 * Just the given name, for places the interface is speaking to or about
 * someone directly — a confirmation, a greeting. Full names belong in lists
 * and rosters, where you need to tell two Leos apart.
 */
export function firstName(person: Profile | { name: string } | undefined | null): string {
  return displayName(person).split(' ')[0];
}

/** First letter, for the avatar squircle. */
export function initial(person: Profile | { name: string } | undefined | null): string {
  return displayName(person).charAt(0).toUpperCase() || '?';
}
