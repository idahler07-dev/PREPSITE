import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pip, Satify's mascot: a lilac highlighter with a cobalt cap. Pip marks
 * what matters and glows when you get it right. Soft 3D shading in plain SVG
 * (gradients only, no filters). Everything outside this file only uses
 * <Mascot pose="..." />. Colors come from the --mascot-* tokens.
 *
 * Poses: wave, think, cheer, focus, sleepy, point, juggle, confused.
 * Never shown inside test questions.
 */
export type MascotPose = "wave" | "think" | "cheer" | "focus" | "sleepy" | "point" | "juggle" | "confused";

export const MASCOT_POSES: MascotPose[] = ["wave", "think", "cheer", "focus", "sleepy", "point", "juggle", "confused"];

const BODY = "var(--mascot-body)";
const LIGHT = "var(--mascot-light)";
const DARK = "var(--mascot-dark)";
const CAP = "var(--mascot-cap)";
const CAP_LIGHT = "var(--mascot-cap-light)";
const CAP_DARK = "var(--mascot-cap-dark)";
const ACCENT = "var(--mascot-accent)";
const EYE = "var(--mascot-eye)";
const INK = "var(--mascot-ink)";
const ZZ = ["z", "z"];
const QUESTION = "?";

const BARREL = { x: 68, y: 72, w: 64, h: 82, r: 18 };
const S_BODY = "M19 45C25 50 42 49.5 42 40.5C42 31.5 22 33 22 24.5C22 17 32 14.5 41 17.5";
const S_TIP = "M36.5 12.5L44 16.5L40.5 24";

/* ---------- Study props (simple shapes) ---------- */
const Pencil = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-3.5} y={-20} width={7} height={30} rx={1.5} fill="var(--flagged)" />
    <rect x={-3.5} y={-24} width={7} height={5} rx={1.5} fill={ACCENT} />
    <path d="M-3.5 10 L0 18 L3.5 10 Z" fill="#F5D9B0" />
    <path d="M-1.2 15.4 L0 18 L1.2 15.4 Z" fill={INK} />
  </g>
);
const Book = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-16} y={-12} width={32} height={24} rx={3} fill={CAP} />
    <rect x={-13} y={-9} width={26} height={18} rx={2} fill={EYE} opacity={0.92} />
    <path d="M0 -9 V9" stroke={CAP} strokeWidth={2} />
    <path d="M-9 -3 H-3 M-9 2 H-4 M3 -3 H9 M4 2 H9" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" />
  </g>
);
const Calculator = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-11} y={-15} width={22} height={30} rx={4} fill={INK} />
    <rect x={-7.5} y={-11} width={15} height={7} rx={1.5} fill="var(--correct)" />
    {[0, 1, 2].map((row) => [0, 1, 2].map((col) => <rect key={`${row}${col}`} x={-7.5 + col * 5.5} y={-1 + row * 5} width={4} height={3.5} rx={1} fill={EYE} opacity={0.85} />))}
  </g>
);
const Timer = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-3} y={-17} width={6} height={4} rx={1} fill={INK} />
    <circle r={13} fill={EYE} stroke={INK} strokeWidth={2.5} />
    <path d="M0 0 V-7 M0 0 L5 3" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);
const Sparkle = ({ x, y, s = 1, fill = "var(--flagged)" }: { x: number; y: number; s?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2 Z" fill={fill} />
);

/* ---------- Face ---------- */
type Eyes = "open" | "closed" | "happy" | "side";
type Mouth = "smile" | "open" | "o" | "flat";

function Face({ eyes, mouth }: { eyes: Eyes; mouth: Mouth }) {
  const dx = eyes === "side" ? 2.5 : 0;
  return (
    <g>
      {eyes === "closed" && (
        <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
          <path d="M82 99 q 6 5 12 0" />
          <path d="M106 99 q 6 5 12 0" />
        </g>
      )}
      {eyes === "happy" && (
        <g stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
          <path d="M82 100 q 6 -8 12 0" />
          <path d="M106 100 q 6 -8 12 0" />
        </g>
      )}
      {(eyes === "open" || eyes === "side") && (
        <g className="mascot-blink">
          <ellipse cx={88 + dx} cy={97} rx={6.2} ry={7.8} fill={INK} />
          <ellipse cx={112 + dx} cy={97} rx={6.2} ry={7.8} fill={INK} />
          <circle cx={90.2 + dx} cy={93.6} r={2.6} fill={EYE} />
          <circle cx={114.2 + dx} cy={93.6} r={2.6} fill={EYE} />
          <circle cx={85.8 + dx} cy={100.8} r={1.1} fill={EYE} opacity={0.75} />
          <circle cx={109.8 + dx} cy={100.8} r={1.1} fill={EYE} opacity={0.75} />
        </g>
      )}
      <ellipse cx={77} cy={110} rx={5.5} ry={3.2} fill={ACCENT} opacity={0.45} />
      <ellipse cx={123} cy={110} rx={5.5} ry={3.2} fill={ACCENT} opacity={0.45} />
      {mouth === "smile" && <path d="M94 111 q 6 6 12 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />}
      {mouth === "open" && <path d="M93 109 q 7 11 14 0 Z" fill={INK} />}
      {mouth === "o" && <ellipse cx={100} cy={113} rx={3.2} ry={4} fill={INK} />}
      {mouth === "flat" && <path d="M95 113 h 10" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />}
    </g>
  );
}

/** An arm as a soft tube ending in a round hand. */
function Arm({ d, hand, className, style }: { d: string; hand: [number, number]; className?: string; style?: React.CSSProperties }) {
  return (
    <g className={className} style={style} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeWidth={9} />
      <path d={d} stroke={BODY} strokeWidth={6.5} transform="translate(-.6 -.8)" />
      <circle cx={hand[0]} cy={hand[1]} r={6.2} fill={LIGHT} />
      <circle cx={hand[0] - 1.8} cy={hand[1] - 1.8} r={1.8} fill={EYE} opacity={0.6} />
    </g>
  );
}

/* Arms at rest, by side. */
const REST_L = { d: "M70 112 C60 116 56 126 57 136", hand: [57, 138] as [number, number] };
const REST_R = { d: "M130 112 C140 116 144 126 143 136", hand: [143, 138] as [number, number] };

/** Pip's body: cap with clip, barrel with label band, collar and chisel nib. */
function Body({ id, eyes, mouth, glow = false }: { id: string; eyes: Eyes; mouth: Mouth; glow?: boolean }) {
  const b = BARREL;
  return (
    <g>
      {glow && <ellipse cx={100} cy={104} rx={74} ry={84} fill={`url(#${id}-glow)`} />}
      {/* Collar and chisel nib */}
      <path d="M70 150H130L122 168H78Z" fill={DARK} />
      <path d="M73 153H127" stroke={EYE} strokeOpacity={0.25} strokeWidth={1.6} />
      <path d="M80 168H120L113 190L87 182Z" fill={`url(#${id}-nib)`} />
      <path d="M80 168H100L94 188L87 182Z" fill={EYE} opacity={0.3} />
      {/* Barrel */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={`url(#${id}-barrel)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`url(#${id}-ao)`} />
        <rect x={b.x} y={130} width={b.w} height={14} fill={EYE} opacity={0.88} />
        <path d={`M${b.x} 130H${b.x + b.w}M${b.x} 144H${b.x + b.w}`} stroke={DARK} strokeOpacity={0.3} strokeWidth={1.2} />
        <path d={`M${b.x + b.w - 5} ${b.y + 8}V${b.y + b.h - 6}`} stroke={EYE} strokeOpacity={0.35} strokeWidth={1.6} />
      </g>
      <rect x={76} y={80} width={7} height={44} rx={3.5} fill={`url(#${id}-spec)`} />
      {/* The logo on the label band */}
      <g transform="translate(94.2 131.2) scale(.18)">
        <rect width={64} height={64} rx={18} fill={CAP} />
        <g fill="none" stroke={EYE} strokeLinecap="round" strokeLinejoin="round">
          <path d={S_BODY} strokeWidth={7.5} />
          <path d={S_TIP} strokeWidth={6} />
        </g>
      </g>
      {/* Cap, lip and pocket clip */}
      <path d="M70 70V44C70 30 82 20 100 20C118 20 130 30 130 44V70Z" fill={`url(#${id}-cap)`} />
      <path d="M77 44C78 33 87 26 99 25" stroke={EYE} strokeOpacity={0.45} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M80 54H120M80 60H120" stroke={CAP_DARK} strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={66} y={64} width={68} height={12} rx={6} fill={CAP_DARK} />
      <rect x={70} y={65.5} width={60} height={3} rx={1.5} fill={EYE} opacity={0.22} />
      <path d="M126 30H134C137 30 139 32 139 35V88C139 91.5 136.5 94 133 94C129.5 94 128 91.5 128 88V48" fill="#ECE9FF" stroke="#9A92D6" strokeWidth={1} />
      <rect x={130.5} y={36} width={2.4} height={46} rx={1.2} fill={EYE} opacity={0.75} />
      <Face eyes={eyes} mouth={mouth} />
    </g>
  );
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-barrel`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: LIGHT }} />
        <stop offset=".45" style={{ stopColor: BODY }} />
        <stop offset="1" style={{ stopColor: DARK }} />
      </linearGradient>
      <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: CAP_LIGHT }} />
        <stop offset=".5" style={{ stopColor: CAP }} />
        <stop offset="1" style={{ stopColor: CAP_DARK }} />
      </linearGradient>
      <linearGradient id={`${id}-nib`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: LIGHT }} />
        <stop offset="1" style={{ stopColor: BODY }} />
      </linearGradient>
      <linearGradient id={`${id}-ao`} x1="0" y1="0" x2="0" y2="1">
        <stop offset=".55" stopColor="#1A1060" stopOpacity="0" />
        <stop offset="1" stopColor="#1A1060" stopOpacity=".28" />
      </linearGradient>
      <linearGradient id={`${id}-spec`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".8" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" style={{ stopColor: LIGHT }} stopOpacity=".7" />
        <stop offset="1" style={{ stopColor: LIGHT }} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-shadow`}>
        <stop offset="0" style={{ stopColor: INK }} stopOpacity=".22" />
        <stop offset="1" style={{ stopColor: INK }} stopOpacity="0" />
      </radialGradient>
      <clipPath id={`${id}-clip`}>
        <rect x={BARREL.x} y={BARREL.y} width={BARREL.w} height={BARREL.h} rx={BARREL.r} />
      </clipPath>
    </defs>
  );
}

function Pose({ pose, id }: { pose: MascotPose; id: string }): ReactNode {
  switch (pose) {
    case "wave":
      return (
        <g transform="rotate(-5 100 120)">
          <Arm {...REST_L} />
          <Body id={id} eyes="open" mouth="smile" />
          <g className="mascot-wave" style={{ transformOrigin: "130px 110px" }}>
            <Arm d="M130 110 C146 104 152 90 151 76" hand={[151, 72]} />
          </g>
        </g>
      );
    case "think":
      return (
        <>
          <g transform="rotate(4 100 120)">
            <Arm {...REST_L} />
            <Body id={id} eyes="side" mouth="flat" />
            <Arm d="M130 116 C146 120 146 106 136 102" hand={[134, 104]} />
          </g>
          <g fill={LIGHT}>
            <circle cx={156} cy={52} r={4} />
            <circle cx={166} cy={38} r={6} />
            <circle cx={178} cy={20} r={9} />
          </g>
        </>
      );
    case "cheer":
      return (
        <>
          <Body id={id} eyes="happy" mouth="open" glow />
          <g className="mascot-cheer">
            <Arm d="M70 108 C54 100 48 86 50 72" hand={[50, 68]} />
            <Arm d="M130 108 C146 100 152 86 150 72" hand={[150, 68]} />
          </g>
          <Sparkle x={32} y={44} />
          <Sparkle x={172} y={40} s={0.8} fill="var(--highlight)" />
          <Sparkle x={160} y={150} s={0.6} fill={ACCENT} />
        </>
      );
    case "focus":
      return (
        <>
          {/* Highlighting a line: the nib leaves a lilac mark. */}
          <path d="M22 192 H118" stroke="var(--highlight)" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
          <g transform="rotate(-28 100 120)">
            <Arm {...REST_L} />
            <Body id={id} eyes="open" mouth="flat" />
            <Arm {...REST_R} />
          </g>
        </>
      );
    case "sleepy":
      return (
        <>
          <g transform="rotate(8 100 120)">
            <Arm {...REST_L} />
            <Body id={id} eyes="closed" mouth="o" />
            <Arm {...REST_R} />
          </g>
          <g fill={INK} opacity={0.55} fontFamily="var(--font-sans)" fontWeight={700}>
            <text x={150} y={40} fontSize={18}>
              {ZZ[0]}
            </text>
            <text x={164} y={22} fontSize={13}>
              {ZZ[1]}
            </text>
          </g>
        </>
      );
    case "point":
      return (
        <g transform="rotate(-4 100 120)">
          <Arm {...REST_L} />
          <Body id={id} eyes="side" mouth="smile" />
          <Arm d="M130 112 C146 112 160 106 172 98" hand={[175, 96]} />
        </g>
      );
    case "juggle":
      return (
        <>
          <Body id={id} eyes="open" mouth="smile" />
          <g className="mascot-juggle">
            <Arm d="M70 108 C54 100 48 86 50 72" hand={[50, 68]} />
            <Arm d="M130 108 C146 100 152 86 150 72" hand={[150, 68]} />
            <Pencil x={22} y={104} r={-30} />
            <Calculator x={30} y={46} r={-12} />
            <Timer x={172} y={40} />
            <Book x={182} y={102} r={16} />
          </g>
        </>
      );
    case "confused":
      return (
        <>
          <g transform="rotate(10 100 120)">
            <Arm {...REST_L} />
            <Body id={id} eyes="open" mouth="o" />
            <Arm d="M130 108 C144 96 142 74 132 60" hand={[130, 56]} />
          </g>
          <text x={150} y={46} fontSize={34} fontWeight={700} fill="var(--highlight)" fontFamily="var(--font-sans)">
            {QUESTION}
          </text>
        </>
      );
  }
}

/**
 * <Mascot pose="wave" /> — decorative by default (aria-hidden); pass `label`
 * when Pip carries meaning. Plain SVG (no client JavaScript): idle blink and
 * arm movement, a short fade when the pose changes and a hover reaction are
 * CSS animations, all off with reduced motion.
 */
export function Mascot({ pose, className, label, hoverReact = false }: { pose: MascotPose; className?: string; label?: string; hoverReact?: boolean }) {
  const id = `pip${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("mascot h-auto w-32 overflow-visible", hoverReact && "mascot-react", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Defs id={id} />
      <ellipse cx={100} cy={194} rx={44} ry={5.5} fill={`url(#${id}-shadow)`} />
      {/* Keyed by pose: a new pose remounts and fades in. */}
      <g key={pose} className="mascot-pose">
        <Pose pose={pose} id={id} />
      </g>
    </svg>
  );
}
