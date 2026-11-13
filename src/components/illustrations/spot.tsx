import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Spot illustrations: small flat objects with a soft 3D edge (each shape sits on
 * a darker copy of itself, a few pixels down), in the brand palette, matching
 * the compact Willo. One idea per picture. Parts marked `.sp-lift` rise a little
 * when the card around them is hovered; `.sp-twinkle` sparkles shimmer (CSS in
 * globals.css). Decorative: always aria-hidden.
 */
export type SpotName =
  | "bank"
  | "mocks"
  | "review"
  | "vocab"
  | "plan"
  | "progress"
  | "target"
  | "focus";

const P = {
  ink: "#123A49",
  inkSide: "#0B2731",
  teal: "#0E7E8E",
  tealSide: "#0A6371",
  tealLight: "#7FD0D9",
  tealLightSide: "#56B4BF",
  orange: "#FF8A2E",
  orangeSide: "#DD6417",
  gold: "#FFB627",
  goldSide: "#D98E0B",
  red: "#EF5B47",
  paper: "#FFFFFF",
  paperSide: "#E6DCCD",
  cream: "#FFF4E6",
  creamSide: "#EBD9C2",
  chip: "#F2EBE1",
};

/** A shape on its own darker edge: the flat-3D look. */
function Slab({
  x,
  y,
  w,
  h,
  r = 10,
  fill,
  side,
  depth = 5,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  fill: string;
  side: string;
  depth?: number;
}) {
  return (
    <g>
      <rect x={x} y={y + depth} width={w} height={h} rx={r} fill={side} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
    </g>
  );
}

function Spark({
  x,
  y,
  s = 1,
  c = P.gold,
  d = 0,
}: {
  x: number;
  y: number;
  s?: number;
  c?: string;
  d?: number;
}) {
  return (
    <path
      className="sp-twinkle"
      style={{ animationDelay: `${d}s` }}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z"
      fill={c}
    />
  );
}

function Check({
  x,
  y,
  s = 1,
  c = P.paper,
}: {
  x: number;
  y: number;
  s?: number;
  c?: string;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-4 0 L-1.2 3 L4.5 -3.5"
      fill="none"
      stroke={c}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const SPOTS: Record<SpotName, ReactNode> = {
  // a stack of question cards, the top one answered
  bank: (
    <>
      <g transform="rotate(-9 80 60)">
        <Slab
          x={42}
          y={26}
          w={78}
          h={58}
          fill={P.tealLight}
          side={P.tealLightSide}
        />
      </g>
      <g transform="rotate(6 80 60)">
        <Slab x={40} y={28} w={80} h={60} fill={P.cream} side={P.creamSide} />
      </g>
      <g className="sp-lift">
        <Slab x={34} y={30} w={92} h={64} fill={P.paper} side={P.paperSide} />
        <rect
          x={44}
          y={40}
          width={58}
          height={5}
          rx={2.5}
          fill={P.ink}
          opacity={0.8}
        />
        <rect
          x={44}
          y={49}
          width={40}
          height={5}
          rx={2.5}
          fill={P.ink}
          opacity={0.25}
        />
        <rect x={44} y={61} width={34} height={11} rx={5.5} fill={P.chip} />
        <rect x={82} y={61} width={34} height={11} rx={5.5} fill={P.teal} />
        <Check x={99} y={66.5} s={0.85} />
        <rect x={44} y={76} width={34} height={11} rx={5.5} fill={P.chip} />
        <rect x={82} y={76} width={34} height={11} rx={5.5} fill={P.chip} />
      </g>
      <Spark x={128} y={24} />
      <Spark x={30} y={30} s={0.6} c={P.teal} d={0.8} />
    </>
  ),
  // a laptop with a mock test on screen and a timer badge
  mocks: (
    <>
      <path d="M26 92 L134 92 L126 80 L34 80 Z" fill={P.paperSide} />
      <path d="M26 88 L134 88 L126 76 L34 76 Z" fill="#DCE8EB" />
      <rect x={68} y={82} width={24} height={3} rx={1.5} fill="#B9CDD2" />
      <g className="sp-lift">
        <Slab
          x={36}
          y={16}
          w={88}
          h={60}
          r={9}
          fill={P.ink}
          side={P.inkSide}
          depth={4}
        />
        <rect x={42} y={22} width={76} height={48} rx={5} fill={P.paper} />
        <rect x={48} y={28} width={18} height={7} rx={3.5} fill={P.teal} />
        <rect x={69} y={28} width={18} height={7} rx={3.5} fill={P.chip} />
        <rect
          x={48}
          y={41}
          width={56}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.75}
        />
        <rect
          x={48}
          y={49}
          width={42}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.25}
        />
        <rect x={48} y={60} width={64} height={4} rx={2} fill={P.chip} />
        <rect x={48} y={60} width={38} height={4} rx={2} fill={P.orange} />
      </g>
      <g className="sp-pop">
        <circle
          cx={124}
          cy={30}
          r={16}
          fill={P.orangeSide}
          transform="translate(0 4)"
        />
        <circle cx={124} cy={30} r={16} fill={P.orange} />
        <circle cx={124} cy={30} r={11} fill={P.paper} />
        <path
          d="M124 23 V30 L129 33"
          fill="none"
          stroke={P.ink}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x={120} y={10} width={8} height={5} rx={2} fill={P.orangeSide} />
      </g>
      <Spark x={28} y={24} s={0.7} c={P.teal} d={0.5} />
    </>
  ),
  // the mistake notebook: crosses that turn into checks, a bookmark
  review: (
    <>
      <g className="sp-lift">
        <Slab x={38} y={20} w={86} h={74} fill={P.paper} side={P.paperSide} />
        <rect x={38} y={20} width={14} height={74} rx={7} fill={P.orange} />
        <rect x={46} y={20} width={6} height={74} fill={P.orange} />
        {[32, 46, 60, 74].map((y) => (
          <circle key={y} cx={45} cy={y} r={2.6} fill={P.paper} opacity={0.9} />
        ))}
        {[34, 50, 66].map((y, i) => (
          <g key={y}>
            <rect
              x={76}
              y={y - 2}
              width={38 - i * 6}
              height={4}
              rx={2}
              fill={P.ink}
              opacity={0.22}
            />
            {i === 0 ? (
              <path
                d={`M60 ${y - 4} l8 8 M68 ${y - 4} l-8 8`}
                stroke={P.red}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ) : (
              <>
                <circle cx={64} cy={y} r={6.5} fill={P.teal} />
                <Check x={64} y={y} s={0.8} />
              </>
            )}
          </g>
        ))}
        <rect
          x={60}
          y={78}
          width={44}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.12}
        />
      </g>
      <path
        className="sp-pop"
        d="M106 14 h14 v24 l-7 -6 l-7 6 Z"
        fill={P.gold}
      />
      <Spark x={134} y={60} s={0.7} d={0.6} />
    </>
  ),
  // two flashcards, a word on the front
  vocab: (
    <>
      <g transform="rotate(-12 70 60)">
        <Slab x={30} y={28} w={76} h={54} fill={P.teal} side={P.tealSide} />
        <rect
          x={42}
          y={40}
          width={30}
          height={5}
          rx={2.5}
          fill={P.paper}
          opacity={0.55}
        />
      </g>
      <g className="sp-lift" transform="rotate(7 92 62)">
        <Slab x={52} y={32} w={82} h={58} fill={P.paper} side={P.paperSide} />
        <rect
          x={64}
          y={46}
          width={46}
          height={7}
          rx={3.5}
          fill={P.ink}
          opacity={0.85}
        />
        <rect
          x={64}
          y={59}
          width={58}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.22}
        />
        <rect
          x={64}
          y={68}
          width={40}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.22}
        />
        <rect x={64} y={78} width={22} height={6} rx={3} fill={P.cream} />
      </g>
      <g className="sp-pop">
        <path
          d="M128 18 l3.5 7.2 7.9 1.1 -5.7 5.6 1.4 7.9 -7.1 -3.8 -7.1 3.8 1.4 -7.9 -5.7 -5.6 7.9 -1.1 Z"
          fill={P.goldSide}
          transform="translate(0 2.5)"
        />
        <path
          d="M128 18 l3.5 7.2 7.9 1.1 -5.7 5.6 1.4 7.9 -7.1 -3.8 -7.1 3.8 1.4 -7.9 -5.7 -5.6 7.9 -1.1 Z"
          fill={P.gold}
        />
      </g>
      <Spark x={24} y={88} s={0.6} c={P.orange} d={0.9} />
    </>
  ),
  // a week planner with today marked and two days done
  plan: (
    <>
      <g className="sp-lift">
        <Slab x={32} y={20} w={96} h={76} fill={P.paper} side={P.paperSide} />
        <path
          d="M32 30 a10 10 0 0 1 10 -10 h76 a10 10 0 0 1 10 10 v8 h-96 Z"
          fill={P.teal}
        />
        <rect x={52} y={13} width={6} height={14} rx={3} fill={P.ink} />
        <rect x={102} y={13} width={6} height={14} rx={3} fill={P.ink} />
        {[0, 1, 2, 3].map((c) =>
          [0, 1, 2].map((r) => {
            const x = 41 + c * 21;
            const y = 46 + r * 15;
            const today = c === 2 && r === 1;
            const done = (c === 0 && r === 1) || (c === 1 && r === 1);
            return (
              <g key={`${c}${r}`}>
                <rect
                  x={x}
                  y={y}
                  width={16}
                  height={11}
                  rx={3.5}
                  fill={today ? P.orange : done ? P.tealLight : P.chip}
                />
                {done && <Check x={x + 8} y={y + 5.5} s={0.7} c={P.ink} />}
              </g>
            );
          }),
        )}
      </g>
      <Spark x={136} y={30} d={0.3} />
      <Spark x={24} y={70} s={0.6} c={P.teal} d={1.1} />
    </>
  ),
  // rising bars and an arrow up
  progress: (
    <>
      <path
        d="M28 96 H132"
        stroke={P.paperSide}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {[
        { x: 38, h: 22, c: P.tealLight, s: P.tealLightSide },
        { x: 62, h: 34, c: P.tealLight, s: P.tealLightSide },
        { x: 86, h: 46, c: P.teal, s: P.tealSide },
        { x: 110, h: 60, c: P.orange, s: P.orangeSide },
      ].map((b, i) => (
        <g key={b.x} className={i === 3 ? "sp-lift" : undefined}>
          <rect
            x={b.x + 4}
            y={92 - b.h}
            width={16}
            height={b.h}
            rx={4}
            fill={b.s}
          />
          <rect
            x={b.x}
            y={90 - b.h}
            width={16}
            height={b.h}
            rx={4}
            fill={b.c}
          />
        </g>
      ))}
      <path
        d="M36 56 Q64 50 80 36 T120 16"
        fill="none"
        stroke={P.ink}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d="M110 14 L122 15 L118 26"
        fill="none"
        stroke={P.ink}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Spark x={136} y={40} d={0.4} />
      <Spark x={30} y={30} s={0.6} c={P.orange} d={1} />
    </>
  ),
  // a goal target with an arrow in the bullseye
  target: (
    <>
      <ellipse
        cx={74}
        cy={64}
        rx={40}
        ry={40}
        fill={P.creamSide}
        transform="translate(0 5)"
      />
      <circle cx={74} cy={64} r={40} fill={P.paper} />
      <circle cx={74} cy={64} r={30} fill={P.orange} />
      <circle cx={74} cy={64} r={20} fill={P.paper} />
      <circle cx={74} cy={64} r={10} fill={P.teal} />
      <g className="sp-lift">
        <path
          d="M76 62 L124 22"
          stroke={P.ink}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path d="M118 16 L132 14 L126 28 Z" fill={P.gold} />
        <path
          d="M124 22 L136 20 M124 22 L126 34"
          stroke={P.goldSide}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <Spark x={30} y={26} s={0.7} c={P.teal} d={0.7} />
    </>
  ),
  // a focus timer
  focus: (
    <>
      <circle
        cx={80}
        cy={64}
        r={38}
        fill={P.tealSide}
        transform="translate(0 5)"
      />
      <circle cx={80} cy={64} r={38} fill={P.teal} />
      <circle cx={80} cy={64} r={29} fill={P.paper} />
      <path
        d="M80 64 L80 35 A29 29 0 0 1 105 79 Z"
        fill={P.orange}
        opacity={0.9}
      />
      <circle cx={80} cy={64} r={4} fill={P.ink} />
      <rect x={74} y={16} width={12} height={9} rx={3} fill={P.ink} />
      <rect
        x={110}
        y={26}
        width={10}
        height={7}
        rx={3}
        fill={P.ink}
        transform="rotate(40 115 29)"
      />
      <g className="sp-lift">
        <Spark x={128} y={70} d={0.2} />
      </g>
      <Spark x={30} y={40} s={0.6} c={P.orange} d={0.9} />
    </>
  ),
};

export function Spot({
  name,
  className,
}: {
  name: SpotName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={cn("spot block h-auto w-full overflow-visible", className)}
      aria-hidden
    >
      <ellipse cx={80} cy={110} rx={50} ry={5} fill="#000" opacity={0.07} />
      {SPOTS[name]}
    </svg>
  );
}
