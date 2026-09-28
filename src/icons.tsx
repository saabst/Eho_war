import { T } from "./theme";

type P = { size?: number | string; className?: string };

const base = (size: number | string) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const,
});
const F = { fill: "currentColor", fillOpacity: 0.28 } as const;

export const Bolt = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none"><path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z" /></svg>
);
export const Shield = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
);
export const Crystal = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="M12 2 19 9l-7 13L5 9Z" /><path d="M5 9h14M12 2 9 9l3 13 3-13-3-7" fill="none" /></svg>
);
export const Tower = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="M5 21V7h3v2h2V7h4v2h2V7h3v14Z" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" fill="none" /></svg>
);
export const Gate = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.2" {...F} /><circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
  </svg>
);
export const Crag = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="M2.5 20 8.5 7l3.5 6.5 2.5-3.5 7 10Z" /><path d="m8.5 7 1.5 6M14.5 10l1 4" fill="none" /></svg>
);
export const MineIcon = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="5.2" fill="currentColor" fillOpacity=".4" />
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8" />
    <circle cx="10.3" cy="10.3" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
export const Skull = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3Z" {...F} />
    <circle cx="9" cy="11" r="1.8" fill="currentColor" /><circle cx="15" cy="11" r="1.8" fill="currentColor" />
    <path d="M10 20v-2.5M14 20v-2.5M12 13.5l-1 2h2Z" />
  </svg>
);
export const Relic = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="m12 2 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 8.4l6-.8Z" /></svg>
);
export const Flag = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className}><path d="M6 21V3.5" /><path d="M6 4.5h11l-2.6 4 2.6 4H6" fill="currentColor" fillOpacity=".45" /></svg>
);
export const Crown = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F}><path d="M3 18 4.5 7l4.5 5 3-7 3 7 4.5-5L21 18Z" /><path d="M3 21h18" fill="none" /></svg>
);
export const SigilOrder = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.4}>
    <path d="M12 1.5 14.2 9 22.5 12 14.2 15 12 22.5 9.8 15 1.5 12 9.8 9Z" fill="currentColor" fillOpacity=".6" />
    <circle cx="12" cy="12" r="3.6" fill="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
export const SigilHorde = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.5}>
    <path d="M4 3c-.5 6 1.7 9.2 5.2 10.4M20 3c.5 6-1.7 9.2-5.2 10.4" />
    <circle cx="12" cy="15" r="6" fill="currentColor" fillOpacity=".5" />
    <path d="M9.4 14.2 11 15.4M14.6 14.2 13 15.4M12 17v2.2" />
  </svg>
);
export const Plus = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.7}><path d="M12 5v14M5 12h14" /></svg>
);
export const Minus = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.7}><path d="M5 12h14" /></svg>
);
export const Sword = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}><path d="m14.5 3.5 6 0 0 6-9.5 9.5-3-3Z" fill="currentColor" fillOpacity=".25" /><path d="M8 16l-4 4M6 14l4 4" /></svg>
);
export const Undo = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
);
export const Help = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" /><path d="M12 17.2v.1" /></svg>
);
export const Restart = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 11a9 9 0 1 1 2.5 7" /><path d="M3 4v7h7" /></svg>
);
export const Arrow = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
export const Sun = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".35" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
  </svg>
);
export const Eclipse = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="6.5" fill="#1a0a0d" />
    <circle cx="12" cy="12" r="9.5" strokeDasharray="2 3.4" />
  </svg>
);
export const WallIcon = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F} strokeWidth={1.6}>
    <path d="M3 5h18v14H3Z" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" fill="none" />
  </svg>
);
export const ForgeIcon = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F} strokeWidth={1.6}>
    <path d="M12 2.5c.8 3 4.5 5 4.5 9.2a4.5 4.5 0 0 1-9 0c0-2 1-3.4 2.3-4.4.1 1.8.9 2.4 1.7 2.6C11.2 7.6 10.6 5 12 2.5Z" />
    <path d="M9.8 15.2c.3 1.2 1 1.9 2.2 1.9" fill="none" />
  </svg>
);
export const CampIcon = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} {...F} strokeWidth={1.6}>
    <path d="M12 3 3 20h18Z" /><path d="M12 3v17M9.3 20 12 14l2.7 6" fill="none" />
  </svg>
);
export const Chevrons = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}><path d="m6 11 6-6 6 6M6 19l6-6 6 6" /></svg>
);
export const Chevron = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}><path d="m6 9 6 6 6-6" /></svg>
);

/* ---- значки сторон для темы «Современный фронт» ---- */
export const FrontA = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <path d="M12 2.5 20 5.5v6.2c0 4.6-3.3 8-8 9.8-4.7-1.8-8-5.2-8-9.8V5.5Z" fill="currentColor" fillOpacity=".3" />
    <path d="m7.6 12.6 4.4-3.6 4.4 3.6M7.6 16.4 12 12.8l4.4 3.6" />
  </svg>
);
export const FrontB = ({ size = "100%", className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" fill="currentColor" fillOpacity=".28" />
    <circle cx="12" cy="12" r="4" /><path d="M12 5.5v4M12 14.5v4M5.5 12h4M14.5 12h4" />
  </svg>
);

/** Значок стороны с учётом текущей темы. */
export const Sigil = ({ side, size = "100%", className }: P & { side: "player" | "enemy" }) =>
  T.id === "front"
    ? (side === "player" ? <FrontA size={size} className={className} /> : <FrontB size={size} className={className} />)
    : (side === "player" ? <SigilOrder size={size} className={className} /> : <SigilHorde size={size} className={className} />);
