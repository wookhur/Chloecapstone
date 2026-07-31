/**
 * The app's icon set.
 *
 * These replace the emoji that used to sit in the nav and on buttons. Emoji
 * render as somebody else's artwork — full-colour, inconsistent in weight, and
 * different on every platform — so a screen full of them never looks designed.
 * These are one stroke weight on one grid, and they take the surrounding text
 * colour, which is what makes an interface read as a single piece.
 *
 * Drawn on a 24px grid, 1.75 stroke, round caps. Sized in `em` so an icon
 * always matches the text it sits next to.
 */

export type IconName =
  | 'home'
  | 'courses'
  | 'calendar'
  | 'discussions'
  | 'checklist'
  | 'compass'
  | 'family'
  | 'plus'
  | 'search'
  | 'download'
  | 'mail'
  | 'clock'
  | 'cards'
  | 'file'
  | 'image'
  | 'sheet'
  | 'slides'
  | 'paperclip'
  | 'play'
  | 'refresh'
  | 'check'
  | 'star'
  | 'flask'
  | 'users'
  | 'pin'
  | 'chevron-left'
  | 'chevron-right';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6',
  courses: 'M4 4.5h6a2.5 2.5 0 0 1 2.5 2.5v13A2 2 0 0 0 10.5 18H4zM20 4.5h-6A2.5 2.5 0 0 0 11.5 7v13A2 2 0 0 1 13.5 18H20z',
  calendar: 'M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  discussions: 'M20 14.5a2 2 0 0 1-2 2H8l-4 3.5v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM8.5 8.5h7M8.5 12h4.5',
  checklist: 'M4 5.5h3v3H4zM4 14h3v3H4zM10.5 7h9.5M10.5 15.5H20M4.2 14.9l1.3 1.4 2-2.6',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.2 8.8l-1.7 4.7-4.7 1.7 1.7-4.7z',
  family: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 20v-1.5A4.5 4.5 0 0 1 7 14h3a4.5 4.5 0 0 1 4.5 4.5V20M16 5.4a3 3 0 0 1 0 5.8M17.5 14.2a4.5 4.5 0 0 1 4 4.3V20',
  plus: 'M12 5.5v13M5.5 12h13',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.2 16.2 21 21',
  download: 'M12 3.5v12M7.5 11l4.5 4.5 4.5-4.5M4.5 20h15',
  mail: 'M3.5 6h17v12h-17zM3.5 6.5 12 13l8.5-6.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.3l3.4 2',
  cards: 'M7.5 8.5h12v11h-12zM4.5 15.5v-11h12',
  file: 'M6 3.5h7.5L18.5 8.5V20.5H6zM13.5 3.5v5h5',
  image: 'M4 5.5h16v13H4zM4 15l4.5-4 4 3.5 3-2.5L20 16M15.5 9.6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  sheet: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14',
  slides: 'M4 4.5h16v11H4zM12 15.5V20M8.5 20h7',
  paperclip: 'M20 11.5 12.4 19a4.5 4.5 0 0 1-6.4-6.4l7.6-7.5a3 3 0 0 1 4.3 4.3l-7.6 7.5a1.5 1.5 0 0 1-2.1-2.1l7-7',
  play: 'M7.5 4.8 19 12 7.5 19.2z',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 3.5V9h-5.5',
  check: 'M5 12.5 10 17.5 19.5 7',
  star: 'm12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z',
  flask: 'M10 3.5v6L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5v-6M8.5 3.5h7M7.2 14.5h9.6',
  users: 'M9 11.5a3.2 3.2 0 1 0 0-6.5 3.2 3.2 0 0 0 0 6.5zM2.5 20v-1.2A4.8 4.8 0 0 1 7.3 14h3.4a4.8 4.8 0 0 1 4.8 4.8V20M16.5 5.4a3.2 3.2 0 0 1 0 6.2M18 14.2a4.8 4.8 0 0 1 3.5 4.6V20',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  'chevron-left': 'M14.5 5.5 8 12l6.5 6.5',
  'chevron-right': 'M9.5 5.5 16 12l-6.5 6.5',
};

/** Icons that read better filled than stroked. */
const FILLED: IconName[] = ['play', 'star'];

interface IconProps {
  name: IconName;
  /** Any CSS length. Defaults to 1.15em so it scales with its label. */
  size?: string;
  className?: string;
  /**
   * Only pass this when the icon is the *only* content of a control. Everywhere
   * else it sits beside a visible label and repeating it just makes a screen
   * reader say everything twice.
   */
  title?: string;
}

export default function Icon({ name, size = '1.15em', className, title }: IconProps) {
  const filled = FILLED.includes(name);
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The wordmark's D. Its own shape so the brand isn't a stock glyph either. */
export function BrandMark({ size = '22' }: { size?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="3.5" width="19" height="17" rx="5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M8.5 8.5h3.2a3.5 3.5 0 0 1 0 7H8.5z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M7 3.5v3M17 3.5v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Icon per assignment type. Lived in three files as three separate copies,
 * which is how a "test" ends up looking different on two screens.
 */
export const ASSIGNMENT_ICON: Record<string, IconName> = {
  homework: 'checklist',
  quiz: 'cards',
  test: 'flask',
  project: 'star',
};
