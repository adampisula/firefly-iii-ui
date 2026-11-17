import type { SVGProps } from "react";

export const ICON_PATHS: Record<string, string> = {
  verdelo:
    '<path d="M4.5 5.5c4.2.4 6.6 3.7 7.5 13"/><path d="M19.5 5.5c-3.3.3-5.5 2.5-6.6 6.4"/><path d="M12 18.5c.6-5.4 3-9.4 7.5-13"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  swap: '<path d="M4.5 8.5h14M15 5l3.5 3.5L15 12M19.5 15.5h-14M9 12l-3.5 3.5L9 19"/>',
  chart:
    '<path d="M4.5 19.5h15"/><path d="M7.5 16v-4.5M12 16V7.5M16.5 16v-6.5"/>',
  pie: '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5Z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>',
  jar: '<ellipse cx="12" cy="6.5" rx="6.5" ry="2.5"/><path d="M5.5 6.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5M5.5 11.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5"/>',
  users:
    '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c1.8.6 3 2.2 3.5 4.7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8l2 2.1 2.9-.4.7 2.8 2.6 1.4-1 2.8 1 2.8-2.6 1.4-.7 2.8-2.9-.4-2 2.1-2-2.1-2.9.4-.7-2.8-2.6-1.4 1-2.8-1-2.8 2.6-1.4.7-2.8 2.9.4Z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  send: '<path d="M20.5 3.5 3.5 10.6l6.6 2.8 2.8 6.6z"/><path d="m10.1 13.4 4.2-4.2"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
  monitor:
    '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  chevL: '<path d="m14.5 6-6 6 6 6"/>',
  chevR: '<path d="m9.5 6 6 6-6 6"/>',
  down: '<path d="m6 9.5 6 6 6-6"/>',
  up: '<path d="m6 14.5 6-6 6 6"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUR: '<path d="M7 17 17 7M9 7h8v8"/>',
  arrowDL: '<path d="M17 7 7 17M15 17H7V9"/>',
  arrowDown: '<path d="M12 4.5v15M6 13.5l6 6 6-6"/>',
  arrowUp: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
  panel:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15M16 10l-2 2 2 2"/>',
  flipCard:
    '<rect x="3.5" y="6" width="13" height="9" rx="2"/><path d="M7.5 18.5h11a2 2 0 0 0 2-2v-7M18 4l2.5 2.5L18 9"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff:
    '<path d="M3.5 3.5l17 17M10 5.7a8.8 8.8 0 0 1 2-.2c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.5 4.2-1.1M9.9 10a2.8 2.8 0 0 0 4 4"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  unlock:
    '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2M12 14.5v2"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash:
    '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/>',
  download: '<path d="M12 4v11.5M7 10.5l5 5 5-5M5 20h14"/>',
  upload:
    '<path d="M12 15.5V4M7 8.5l5-5 5 5M5 14.5v3.5A2 2 0 0 0 7 20h10a2 2 0 0 0 2-2v-3.5"/>',
  refresh:
    '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  sparkle:
    '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',
  userPlus:
    '<circle cx="10" cy="8.5" r="3.8"/><path d="M3 20c.8-3.8 3.4-6 7-6 1.7 0 3.2.5 4.3 1.4M18 13v6M15 16h6"/>',
  logout:
    '<path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 5.5 12 10 7.5M5.5 12h10"/>',
  shield:
    '<path d="M12 3.5 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9 4.3-1.2 7.5-4.4 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.7 6.7a1.5 1.5 0 0 1-2.1 0Z"/><circle cx="8" cy="8" r="1.4"/>',
  percent:
    '<path d="M18.5 5.5l-13 13"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  target:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  flame:
    '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.8-3-6-4.2-10-2 1.7-3 3.6-3 5.6-1-.6-1.6-1.5-1.8-2.6-2.1 1.9-4 4.4-4 7A6.5 6.5 0 0 0 12 21Z"/><path d="M12 21a2.8 2.8 0 0 1-2.8-2.8c0-1.6 1.4-2.7 2.8-4.4 1.4 1.7 2.8 2.8 2.8 4.4A2.8 2.8 0 0 1 12 21Z"/>',
  plane:
    '<path d="M10.5 13.5 4 12l1.5-2 6.5.5 4-5.5c.8-1 2.5-1.4 3.2-.7.7.7.3 2.4-.7 3.2L13 11.5l.5 6.5-2 1.5z"/><path d="M7 17l-2 2"/>',
  case: '<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
  pen: '<path d="M4.5 19.5c3-1 4-4 6-4s1.5 3 4 3 3-2 5-2"/><path d="m13 4 3 3-7 7-3.5.5L6 11Z"/>',
  undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-2"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-5v6h-4A1.5 1.5 0 0 1 4 19z"/>',
  truck:
    '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  cup: '<path d="M5 8.5h11v5.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2M11 3.5v2"/>',
  heart:
    '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  pulse: '<path d="M3 12.5h4l2-5 3.5 10 2.5-6.5 1.5 1.5H21"/>',
  repeat:
    '<path d="M4 11.5V10a3 3 0 0 1 3-3h13M17 4l3 3-3 3M20 12.5V14a3 3 0 0 1-3 3H4M7 20l-3-3 3-3"/>',
  bolt: '<path d="M13 3 5 13.5h6L10.5 21 19 10h-6z"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0"/><path d="M12 19.5h.01"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8.5 20.5h7M12 17v3.5"/>',
  dumbbell: '<path d="M6.5 7.5v9M4 9.5v5M17.5 7.5v9M20 9.5v5M6.5 12h11"/>',
  music:
    '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  drop: '<path d="M12 3.5s-6 6.4-6 10.7a6 6 0 0 0 12 0C18 9.9 12 3.5 12 3.5Z"/><path d="M9 14.5a3 3 0 0 0 3 3"/>',
  phone:
    '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8Zm0 0c1.5-3 5-3.5 5-1.5S14 8 12 8Z"/>',
  book: '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13.5v14H6a1.5 1.5 0 0 0-1.5 1.5zM4.5 19.5A1.5 1.5 0 0 0 6 21h13.5v-3"/>',
  wallet:
    '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11.5" rx="2.5"/><path d="M16 13.8h.01"/>',
  building:
    '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5v-3h3v3"/>',
  ticket:
    '<path d="M3.5 8.5V6.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-2a2.5 2.5 0 0 0 0-5Z"/><path d="M14.5 5v2M14.5 10.5v3M14.5 17v2"/>',
  scroll:
    '<path d="M6.5 3.5h8.5l3.5 3.5v11a2.5 2.5 0 0 0 2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M15 3.5V7h3.5M9 11h6M9 14.5h6"/>',
  sparkles:
    '<path d="M11 4.5 12.4 8 16 9.4 12.4 10.8 11 14.3 9.6 10.8 6 9.4 9.6 8z"/><path d="M17.5 13.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  coins:
    '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4.5C3.5 12.9 6 14 9 14s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.5c.8.3 1.9.5 3 .5 3 0 5.5-1.1 5.5-2.5v-4.5M14.5 11.6c2.1.2 3.5.9 3.5 1.9M3.5 11.5V16c0 1.4 2.5 2.5 5.5 2.5 1 0 2-.1 2.8-.4"/>',
  hourglass:
    '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 5-8 8.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  camera:
    '<path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.2l1.5-2.2h6.6L16.8 7H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/><circle cx="12" cy="13" r="3.6"/>',
  activity: '<path d="M3.5 12h4l2.5-6 4 12 2.5-6h4"/>',
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.info;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      dangerouslySetInnerHTML={{ __html: path }}
      {...rest}
    />
  );
}
