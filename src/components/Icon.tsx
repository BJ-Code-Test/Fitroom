/**
 * Ein einziger Icon-Satz als Inline-SVG.
 *
 * Keine Icon-Bibliothek: es sind zwei Dutzend Symbole, die als Pfade weniger
 * wiegen als das Paket, das sie liefern würde — und sie erben `currentColor`.
 */

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6',
  studio: 'M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  catalog: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  wardrobe: 'M12 3.5a2 2 0 1 0 1.6 3.2L12 8.5l-8 5.2c-1 .7-.5 2.3.7 2.3h14.6c1.2 0 1.7-1.6.7-2.3l-8-5.2M4 20.5h16',
  ruler: 'M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.5a7.5 7.5 0 0 1 15 0',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9.9 4.1a2 2 0 1 1 4 0A1.7 1.7 0 0 0 16.8 5.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1Z',
  price: 'M12 2v20M17 5.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 2.6 5 3 5 1.4 5 3.2-2.2 3.3-5 3.3-5-1.5-5-3.3',
  crown: 'M4 18h16M4 18 3 7l5 4 4-6 4 6 5-4-1 11',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  heart: 'M12 20s-7.5-4.7-7.5-9.5A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9C19.5 15.3 12 20 12 20Z',
  trash: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 6.5l3 3',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM16 16l4.5 4.5',
  chevron: 'm9 5 7 7-7 7',
  chevronDown: 'm5 9 7 7 7-7',
  alert: 'M12 8.5v5M12 17h.01M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 7.5h.01',
  cube: 'm12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6ZM4 7.4l8 4.6 8-4.6M12 12v9.2',
  logout: 'M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9M15 16l4-4-4-4M19 12H9',
  download: 'M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15',
  mail: 'M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6',
  key: 'M15 3a6 6 0 1 0-3.6 10.8L10 15H8v2H6v2H3v-3l7.2-7.2A6 6 0 0 0 15 3Z M16.5 7.5h.01',
  sparkle: 'M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.3l-1.8-5.7L4.5 10.8 10.2 9 12 3.5ZM19 16l.7 2.1 2.1.7-2.1.7L19 21.6l-.7-2.1-2.1-.7 2.1-.7L19 16Z',
  // Kleidungs-Slots
  shirt: 'M8.5 3.5 12 6l3.5-2.5L20 6l-1.5 4-2 .5V20h-9v-9.5L5.5 10 4 6l4.5-2.5Z',
  jacket: 'M9 3.5 12 6l3-2.5L19.5 6 18 11h-1.5v9h-9v-9H6L4.5 6 9 3.5ZM12 6v14',
  pants: 'M7 3.5h10l.6 17h-4l-1.6-9-1.6 9h-4L7 3.5Z',
  shoe: 'M3 16.5V11h4l3 2.5h4c3 0 7 1 7 3v1.5c0 .6-.4 1-1 1H4a1 1 0 0 1-1-1Z',
  cap: 'M3.5 15.5A8.5 8.5 0 0 1 20.5 15v.5c0 .6-.4 1-1 1h-15a1 1 0 0 1-1-1v-.5ZM12 7v-.5',
  belt: 'M3 9.5h18v5H3zM9.5 9.5v5M14.5 9.5v5M9.5 12h5',
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  /** Symbole ohne eigene Bedeutung bleiben für Screenreader unsichtbar. */
  title?: string;
}

export function Icon({ name, size, className, title }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Welches Symbol steht für welchen Slot. */
export const SLOT_ICON = {
  head: 'cap',
  top: 'shirt',
  outer: 'jacket',
  bottom: 'pants',
  shoes: 'shoe',
  accessory: 'belt',
} as const satisfies Record<string, IconName>;
