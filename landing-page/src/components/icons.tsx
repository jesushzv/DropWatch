// Outline icons only, per the design spec. All stroke, no fill.
import type { ReactNode } from "react";

function Icon({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export const BellDotIcon = () => (
  <Icon label="Bell with a single notification dot">
    <path d="M8 22 h16 M10 22 v-8 a6 6 0 0 1 12 0 v8 M14 25 a2 2 0 0 0 4 0" />
    <circle cx="23" cy="9" r="2.5" fill="var(--text-primary)" stroke="none" />
  </Icon>
);

export const StorefrontsIcon = () => (
  <Icon label="Three storefronts">
    <path d="M4 13 l2 -5 h6 l2 5 M5 13 v10 h8 v-10 M4 13 h11" />
    <path d="M19 10 l1.5 -4 h5 l1.5 4 M20 10 v8 h6 v-8 M19 10 h8" />
    <path d="M20 23 h7 M23.5 23 v-3" />
  </Icon>
);

export const DipChartIcon = () => (
  <Icon label="Line chart with a downward dip">
    <path d="M4 6 v20 h24" />
    <path d="M7 14 l6 1 l5 -2 l5 1 l5 8" />
    <circle cx="28" cy="22" r="2" fill="var(--text-primary)" stroke="none" />
  </Icon>
);

export const TargetArrowIcon = () => (
  <Icon label="Target with an arrow">
    <circle cx="14" cy="18" r="9" />
    <circle cx="14" cy="18" r="4" />
    <path d="M14 18 L26 6 M26 6 h-5 M26 6 v5" />
  </Icon>
);

export const ChatBubbleIcon = () => (
  <Icon label="Chat bubble">
    <path d="M5 8 a3 3 0 0 1 3 -3 h16 a3 3 0 0 1 3 3 v11 a3 3 0 0 1 -3 3 h-11 l-6 5 v-5 h-2 a3 3 0 0 1 -3 -3 z" />
    <path d="M10 11 h12 M10 16 h8" />
  </Icon>
);

export const ShieldIcon = () => (
  <Icon label="Shield outline">
    <path d="M16 4 l10 4 v8 c0 6 -4 10 -10 12 c-6 -2 -10 -6 -10 -12 v-8 z" />
  </Icon>
);
