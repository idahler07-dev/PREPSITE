import { useId, type ReactNode } from "react";
import { LEAF } from "@/lib/brand/antler";
import { cn } from "@/lib/utils";

/**
 * Spot illustrations (masterplan §5): soft-shaded objects in Willo's palette
 * (teal body, orange accent, cream paper, gold detail), lit from the top left,
 * with a soft ground shadow. Decorative: always aria-hidden.
 *
 * Use at most one per card, in the bottom-right corner, slightly cropped by
 * the card (see <CardArt />).
 */

type P = { className?: string };
const uid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

function Lg({ id, a, b, x2 = 0, y2 = 1 }: { id: string; a: string; b: string; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}
function Rg({ id, a, b }: { id: string; a: string; b: string }) {
  return (
    <radialGradient id={id} cx=".35" cy=".3" r=".8">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </radialGradient>
  );
}
function Frame({ vb, className, id, defs, children }: { vb: string; className?: string; id: string; defs: ReactNode; children: ReactNode }) {
  return (
    <svg viewBox={vb} className={cn("block h-auto w-full overflow-visible", className)} aria-hidden>
      <defs>
        {defs}
        <filter id={`${id}sh`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#0B3C50" floodOpacity=".2" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}
/** A four-point sparkle. */
export function Spark({ cx, cy, s, fill = "#F6B53C" }: { cx: number; cy: number; s: number; fill?: string }) {
  return <path d={`M${cx} ${cy - s} Q${cx} ${cy} ${cx + s} ${cy} Q${cx} ${cy} ${cx} ${cy + s} Q${cx} ${cy} ${cx - s} ${cy} Q${cx} ${cy} ${cx} ${cy - s}Z`} fill={fill} />;
}
function Leaf({ x, y, w, rot, id }: { x: number; y: number; w: number; rot: number; id: string }) {
  const h = w * 0.42;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <svg x={-w / 2} y={-h / 2} width={w} height={h} viewBox="0 0 100 42" overflow="visible">
        <defs>
          <Lg id={id} a={LEAF.fillFrom} b={LEAF.fillTo} x2={1} y2={1} />
        </defs>
        <path d={LEAF.outline} fill={`url(#${id})`} stroke={LEAF.rim} strokeWidth={3.4} strokeLinejoin="round" />
        <path d={LEAF.vein} stroke={LEAF.rim} strokeWidth={3.6} fill="none" strokeLinecap="round" />
      </svg>
    </g>
  );
}

/** Target with an arrow in the bullseye: target score. */
export function TargetArt({ className }: P) {
  const id = uid(useId());
  const rings: [number, string][] = [
    [96, `url(#${id}o)`],
    [78, `url(#${id}c)`],
    [60, `url(#${id}o)`],
    [42, `url(#${id}c)`],
    [24, `url(#${id}t)`],
  ];
  return (
    <Frame
      vb="0 0 260 240"
      className={className}
      id={id}
      defs={
        <>
          <Rg id={`${id}o`} a="#FFB57A" b="#E8671C" />
          <Rg id={`${id}c`} a="#FFFFFF" b="#F3E3D0" />
          <Rg id={`${id}t`} a="#3CC6DA" b="#0A6E87" />
          <Lg id={`${id}s`} a="#2E8FA6" b="#0B4E63" />
          <Lg id={`${id}f`} a="#FFB36B" b="#E8712C" x2={1} y2={0} />
        </>
      }
    >
      <ellipse cx="128" cy="222" rx="86" ry="10" fill="#0B3C50" opacity=".12" />
      <g filter={`url(#${id}sh)`}>
        <g transform="translate(128 118) rotate(-10) scale(1 .94)">
          <circle cx="0" cy="12" r="96" fill="#C95A18" />
          {rings.map(([r, f]) => (
            <circle key={r} r={r} fill={f} />
          ))}
          <path d="M-70 -44 A84 84 0 0 1 4 -84" stroke="#fff" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>
      </g>
      <g filter={`url(#${id}sh)`}>
        <path d="M232 22 L136 112" stroke={`url(#${id}s)`} strokeWidth="9" strokeLinecap="round" />
        <path d="M226 10 l24 4 l-6 22 z" fill={`url(#${id}f)`} />
        <path d="M214 24 l30 -2 l-14 22 z" fill="#FFF1E2" />
      </g>
      <Spark cx={34} cy={36} s={12} />
      <Spark cx={236} cy={190} s={9} fill="#FFB36B" />
    </Frame>
  );
}

/** Rising bars with a trend line and a willow leaf: estimated score, improvement. */
export function GrowthArt({ className }: P) {
  const id = uid(useId());
  const bars: [number, number, number][] = [
    [30, 120, 86],
    [92, 82, 124],
    [154, 40, 166],
  ];
  return (
    <Frame
      vb="0 0 250 230"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}b`} a="#43CBDD" b="#0A6E87" />
          <Lg id={`${id}a`} a="#FFC27A" b="#EC7A2C" x2={1} y2={0} />
        </>
      }
    >
      <ellipse cx="116" cy="214" rx="100" ry="10" fill="#0B3C50" opacity=".12" />
      <g filter={`url(#${id}sh)`}>
        {bars.map(([x, y, h]) => (
          <g key={x}>
            <rect x={x} y={y} width="44" height={h} rx="14" fill={`url(#${id}b)`} />
            <rect x={x + 6} y={y + 6} width="8" height={h - 26} rx="4" fill="#fff" opacity=".28" />
          </g>
        ))}
      </g>
      <path d="M18 112 C70 100 112 84 182 28" stroke={`url(#${id}a)`} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M196 14 L170 20 L186 42 Z" fill="#EC7A2C" />
      <Leaf x={212} y={44} w={46} rot={24} id={`${id}l`} />
      <Spark cx={22} cy={60} s={8} fill="#FFB36B" />
    </Frame>
  );
}

/** Calendar page with a checked day: test day, study plan. */
export function CalendarArt({ className }: P) {
  const id = uid(useId());
  return (
    <Frame
      vb="0 0 200 210"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}k`} a="#3CC6DA" b="#0A6E87" />
          <Lg id={`${id}p`} a="#FFFFFF" b="#F2EADF" />
        </>
      }
    >
      <ellipse cx="100" cy="196" rx="84" ry="9" fill="#0B3C50" opacity=".12" />
      <g filter={`url(#${id}sh)`}>
        <rect x="20" y="36" width="160" height="150" rx="26" fill={`url(#${id}p)`} />
        <path d="M20 62 a26 26 0 0 1 26 -26 h108 a26 26 0 0 1 26 26 v16 h-160z" fill={`url(#${id}k)`} />
        <rect x="62" y="20" width="14" height="34" rx="7" fill="#F07A2A" />
        <rect x="124" y="20" width="14" height="34" rx="7" fill="#F07A2A" />
        {[0, 1, 2].flatMap((r) =>
          [0, 1, 2, 3].map((c) => {
            const x = 42 + c * 30;
            const y = 96 + r * 26;
            return r === 1 && c === 2 ? (
              <g key={`${r}${c}`}>
                <circle cx={x + 8} cy={y + 6} r="13" fill="#F07A2A" />
                <path d={`M${x + 1} ${y + 6} l5 5 l9 -11`} stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : (
              <rect key={`${r}${c}`} x={x} y={y} width="17" height="13" rx="4" fill="#C8E2EA" />
            );
          }),
        )}
      </g>
      <Spark cx={190} cy={30} s={10} />
    </Frame>
  );
}

/** Flame: study streak. */
export function FlameArt({ className }: P) {
  const id = uid(useId());
  return (
    <Frame
      vb="0 0 200 200"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}a`} a="#FFC15E" b="#EE6A24" />
          <Lg id={`${id}b`} a="#FFF0B8" b="#FFC54A" />
        </>
      }
    >
      <ellipse cx="100" cy="190" rx="58" ry="9" fill="#0B3C50" opacity=".12" />
      <g filter={`url(#${id}sh)`}>
        <path d="M104 14 C116 48 156 64 156 112 C156 148 132 172 102 172 C72 172 46 148 46 114 C46 90 60 76 70 62 C72 80 80 90 90 92 C88 64 96 38 104 14 Z" fill={`url(#${id}a)`} />
        <path d="M104 80 C112 100 132 110 132 132 C132 152 120 164 102 164 C84 164 72 152 72 136 C72 122 82 114 88 106 C90 116 96 120 100 120 C98 106 100 92 104 80 Z" fill={`url(#${id}b)`} />
      </g>
      <path d="M70 86 C64 98 60 108 60 120" stroke="#fff" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round" fill="none" />
      <Spark cx={176} cy={52} s={10} />
    </Frame>
  );
}

/** A stack of books with a sprouting willow leaf: today's plan, practice. */
export function BooksArt({ className }: P) {
  const id = uid(useId());
  const book = (x: number, y: number, w: number, h: number, g: string, rot: number) => (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx="12" fill={`url(#${id}${g})`} />
      <rect x={x + 10} y={y + h - 14} width={w - 18} height="9" rx="4" fill="#FFF6E9" opacity=".9" />
      <rect x={x + 16} y={y + 10} width={w * 0.36} height="7" rx="3.5" fill="#fff" opacity=".4" />
    </g>
  );
  return (
    <Frame
      vb="0 0 230 230"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}t`} a="#2FB6CC" b="#0A6E87" x2={1} y2={0} />
          <Lg id={`${id}o`} a="#FFB36B" b="#E8712C" x2={1} y2={0} />
        </>
      }
    >
      <ellipse cx="120" cy="214" rx="104" ry="11" fill="#0B3C50" opacity=".13" />
      <g filter={`url(#${id}sh)`}>
        {book(14, 150, 196, 56, "t", -2)}
        {book(30, 100, 176, 52, "o", 3)}
        {book(22, 54, 162, 48, "t", -4)}
      </g>
      <path d="M120 56 C118 34 126 20 140 8" stroke="#0A6E87" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Leaf x={146} y={10} w={64} rot={-32} id={`${id}l1`} />
      <Leaf x={100} y={30} w={52} rot={205} id={`${id}l2`} />
    </Frame>
  );
}

/** A notebook with ticks and crosses and a pencil: mistake notebook. */
export function NotebookArt({ className }: P) {
  const id = uid(useId());
  const rows: [boolean, number][] = [
    [true, 92],
    [false, 78],
    [true, 100],
    [false, 66],
  ];
  return (
    <Frame
      vb="0 0 250 240"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}p`} a="#FFFFFF" b="#F6E8D8" />
          <Lg id={`${id}o`} a="#FFC27A" b="#EC7A2C" />
          <Lg id={`${id}y`} a="#FFE08A" b="#F2A93B" x2={1} y2={0} />
        </>
      }
    >
      <ellipse cx="122" cy="226" rx="92" ry="9" fill="#0B3C50" opacity=".12" />
      <g filter={`url(#${id}sh)`} transform="rotate(7 120 120)">
        <rect x="38" y="20" width="168" height="196" rx="22" fill={`url(#${id}p)`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="28" y={36 + i * 34} width="30" height="13" rx="6.5" fill={`url(#${id}o)`} />
        ))}
        {rows.map(([ok, wd], i) => {
          const y = 66 + i * 34;
          return (
            <g key={i}>
              {ok ? (
                <path d={`M62 ${y} l9 9 l17 -19`} stroke="#1B9E77" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d={`M64 ${y - 9} l22 20 M86 ${y - 9} l-22 20`} stroke="#E5622B" strokeWidth="6" fill="none" strokeLinecap="round" />
              )}
              <rect x="104" y={y - 2} width={wd} height="9" rx="4.5" fill="#D5E4EA" />
            </g>
          );
        })}
      </g>
      <g filter={`url(#${id}sh)`} transform="rotate(38 200 150)">
        <rect x="192" y="86" width="16" height="104" rx="4" fill={`url(#${id}y)`} />
        <path d="M192 190 h16 l-8 20 z" fill="#FBE3C2" />
        <path d="M197 202 h6 l-3 8 z" fill="#6B3A22" />
        <rect x="192" y="80" width="16" height="12" rx="4" fill="#EC7A2C" />
      </g>
      <Spark cx={16} cy={22} s={9} />
    </Frame>
  );
}

/** A peak with a flag: test day, goal reached. */
export function FlagArt({ className }: P) {
  const id = uid(useId());
  return (
    <Frame
      vb="0 0 150 124"
      className={className}
      id={id}
      defs={
        <>
          <Lg id={`${id}m`} a="#2DB7CF" b="#0A6E87" />
          <Lg id={`${id}f`} a="#FFA65C" b="#E8712C" />
        </>
      }
    >
      <path d="M0 124 L70 36 L140 124 Z" fill={`url(#${id}m)`} />
      <path d="M70 36 L86 58 L76 54 L68 62 L60 54 L54 58 Z" fill="#fff" />
      <rect x="68.5" y="0" width="3.5" height="40" rx="1.7" fill="#6B3A22" />
      <path d="M72 2 C86 -2 94 10 108 6 L108 26 C94 30 86 18 72 22 Z" fill={`url(#${id}f)`} />
    </Frame>
  );
}

/** A soft cloud band in a card's own tint, for the illustration to sit on. */
export function Cloud({ className, color = "var(--tint-peach)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 300 90" preserveAspectRatio="none" className={cn("block", className)} aria-hidden>
      <path d="M0 90 V52 C26 30 58 34 78 50 C98 22 142 18 168 44 C190 30 222 34 238 52 C260 44 284 50 300 62 V90Z" fill={color} />
    </svg>
  );
}

/** Two soft waves, for the bottom of wide cards and the page header. */
export function Waves({ className, a = "var(--tint-aqua)", b = "var(--tint-aqua)" }: { className?: string; a?: string; b?: string }) {
  return (
    <svg viewBox="0 0 420 120" preserveAspectRatio="none" className={cn("block", className)} aria-hidden>
      <path d="M0 120 V70 C60 40 120 40 180 62 C250 88 320 70 420 28 V120Z" fill={a} opacity=".6" />
      <path d="M0 120 V92 C80 70 150 84 230 96 C300 106 360 88 420 66 V120Z" fill={b} />
    </svg>
  );
}
