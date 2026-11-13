import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Spot illustrations: small objects with real depth (every shape has a visible
 * side in a darker tone, a bright top edge and a cast shadow), in the brand
 * palette, matching the compact Willo. One idea per picture. Parts marked
 * `.sp-lift` rise a little when the card around them is hovered, `.sp-pop`
 * grows, `.sp-twinkle` sparkles shimmer (CSS in globals.css). Decorative:
 * always aria-hidden.
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
  ink: "#16394A",
  inkSide: "#0C2633",
  teal: "#0E8796",
  tealSide: "#0A6672",
  tealHi: "#3FB3C1",
  aqua: "#8DDAE2",
  aquaSide: "#5DBAC4",
  orange: "#FF8A2E",
  orangeSide: "#D9621A",
  orangeHi: "#FFB27A",
  gold: "#FFC23D",
  goldSide: "#E29A12",
  goldHi: "#FFE08F",
  red: "#EF5B47",
  redSide: "#C43F2D",
  paper: "#FFFFFF",
  paperSide: "#E3D7C6",
  paper2: "#FBF6EE",
  line: "#E9E0D3",
  chip: "#F2EBE1",
  shadow: "#2B1A0E",
};

/** A rounded block with a visible bottom side and a bright top edge. */
function Block({
  x,
  y,
  w,
  h,
  r = 10,
  face,
  side,
  depth = 6,
  hi = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  face: string;
  side: string;
  depth?: number;
  hi?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y + depth} width={w} height={h} rx={r} fill={side} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={face} />
      {hi && (
        <path
          d={`M${x + r * 0.9} ${y + 2.2} H${x + w - r * 0.9}`}
          stroke="#fff"
          strokeOpacity={0.55}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** Soft cast shadow on the ground. */
function Ground({
  cx = 80,
  cy = 108,
  rx = 48,
}: {
  cx?: number;
  cy?: number;
  rx?: number;
}) {
  return (
    <g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={6.5}
        fill={P.shadow}
        opacity={0.08}
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx * 0.62}
        ry={4}
        fill={P.shadow}
        opacity={0.07}
      />
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
      d="M0 -8 Q1.4 -1.4 8 0 Q1.4 1.4 0 8 Q-1.4 1.4 -8 0 Q-1.4 -1.4 0 -8 Z"
      fill={c}
    />
  );
}

function Dot({
  x,
  y,
  r = 2.2,
  c = P.aqua,
  d = 0,
}: {
  x: number;
  y: number;
  r?: number;
  c?: string;
  d?: number;
}) {
  return (
    <circle
      className="sp-twinkle"
      style={{ animationDelay: `${d}s` }}
      cx={x}
      cy={y}
      r={r}
      fill={c}
    />
  );
}

function Check({
  x,
  y,
  s = 1,
  c = P.paper,
  w = 2.6,
}: {
  x: number;
  y: number;
  s?: number;
  c?: string;
  w?: number;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-4.2 0.2 L-1.3 3.1 L4.6 -3.4"
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** A pencil lying at an angle: wood tip, yellow body with a stripe, metal band, eraser. */
function Pencil({
  x,
  y,
  a = -32,
  s = 1,
}: {
  x: number;
  y: number;
  a?: number;
  s?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <rect x={0} y={1.5} width={44} height={10} rx={3} fill={P.goldSide} />
      <rect x={0} y={0} width={44} height={10} rx={3} fill={P.gold} />
      <rect x={2} y={3.6} width={40} height={2.2} rx={1.1} fill={P.goldHi} />
      <path d="M0 0 L-11 5 L0 10 Z" fill="#F4CFA0" />
      <path d="M-11 5 L-6.5 3 L-6.5 7 Z" fill={P.ink} />
      <rect x={42} y={-0.5} width={6} height={11} rx={1.5} fill="#B9C4C9" />
      <rect x={47} y={-0.5} width={8} height={11} rx={3.5} fill="#FF8F8F" />
    </g>
  );
}

const SPOTS: Record<SpotName, ReactNode> = {
  /* Question bank: a stack of question sheets, the top one answered, a pencil beside it */
  bank: (
    <>
      <Ground rx={52} />
      <g transform="rotate(-8 78 64)">
        <Block
          x={34}
          y={32}
          w={84}
          h={60}
          r={9}
          face={P.aqua}
          side={P.aquaSide}
          hi={false}
        />
      </g>
      <g transform="rotate(4 80 64)">
        <Block
          x={36}
          y={30}
          w={84}
          h={62}
          r={9}
          face={P.paper2}
          side={P.paperSide}
          hi={false}
        />
      </g>
      <g className="sp-lift">
        <Block
          x={32}
          y={26}
          w={90}
          h={68}
          r={10}
          face={P.paper}
          side={P.paperSide}
          depth={7}
        />
        <circle cx={46} cy={40} r={7.5} fill={P.teal} />
        <path
          d="M43.3 37.6 Q43.6 34.6 46.2 34.6 Q49 34.7 48.9 37.2 Q48.8 39 46.5 40 L46.2 41.6"
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={46.2} cy={44.6} r={1.25} fill="#fff" />
        <rect
          x={58}
          y={35}
          width={52}
          height={4.4}
          rx={2.2}
          fill={P.ink}
          opacity={0.82}
        />
        <rect
          x={58}
          y={43}
          width={34}
          height={4.4}
          rx={2.2}
          fill={P.ink}
          opacity={0.22}
        />
        {[
          [40, 55, false],
          [80, 55, true],
          [40, 72, false],
          [80, 72, false],
        ].map(([x, y, on]) => (
          <g key={`${x}${y}`}>
            <rect
              x={x as number}
              y={y as number}
              width={36}
              height={13}
              rx={6.5}
              fill={on ? P.orange : P.chip}
            />
            {on ? (
              <>
                <circle
                  cx={(x as number) + 7}
                  cy={(y as number) + 6.5}
                  r={4.2}
                  fill="#fff"
                />
                <Check
                  x={(x as number) + 7}
                  y={(y as number) + 6.5}
                  s={0.6}
                  c={P.orange}
                  w={3}
                />
                <rect
                  x={(x as number) + 14}
                  y={(y as number) + 5}
                  width={16}
                  height={3}
                  rx={1.5}
                  fill="#fff"
                  opacity={0.85}
                />
              </>
            ) : (
              <>
                <circle
                  cx={(x as number) + 7}
                  cy={(y as number) + 6.5}
                  r={4}
                  fill="none"
                  stroke={P.paperSide}
                  strokeWidth={1.6}
                />
                <rect
                  x={(x as number) + 14}
                  y={(y as number) + 5}
                  width={16}
                  height={3}
                  rx={1.5}
                  fill={P.ink}
                  opacity={0.18}
                />
              </>
            )}
          </g>
        ))}
      </g>
      <Pencil x={118} y={78} a={-58} s={0.82} />
      <Spark x={132} y={22} />
      <Dot x={26} y={34} c={P.orange} d={0.6} />
      <Spark x={22} y={60} s={0.55} c={P.teal} d={1.2} />
      <g
        className="sp-lift"
        fontFamily="inherit"
        fontWeight={800}
        fontSize={6.4}
        textAnchor="middle"
        fill={P.ink}
        fillOpacity={0.55}
      >
        <text x={47} y={63.8}>
          A
        </text>
        <text x={47} y={80.8}>
          C
        </text>
        <text x={87} y={80.8}>
          D
        </text>
        <path
          d="M103 34 V19 a3.6 3.6 0 0 1 7.2 0 V31 a2.3 2.3 0 0 1 -4.6 0 V22"
          fill="none"
          stroke="#9AAAB2"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </g>
      <g className="sp-pop">
        <circle
          cx={22}
          cy={88}
          r={10}
          fill={P.orangeSide}
          transform="translate(0 2.5)"
        />
        <circle cx={22} cy={88} r={10} fill={P.orange} />
        <path
          d="M22 81.5 C26 85 27 88 25.5 91 C24.6 92.8 22.8 93.6 21.3 93.4 C19 93.1 17.6 91 18.2 88.7 C18.6 87.2 19.8 86.4 20.6 85.2 C21.6 83.8 21.6 82.6 22 81.5 Z"
          fill="#fff"
        />
        <path
          d="M22.2 87.6 C23.6 89 23.9 90.4 23 91.6 C22.3 92.4 21 92.3 20.6 91.3 C20.2 90.3 21 89.4 21.6 88.8 Z"
          fill={P.gold}
        />
      </g>
    </>
  ),

  /* Mock tests: a laptop with a test on screen, keys on the deck, a stopwatch */
  mocks: (
    <>
      <Ground rx={56} />
      {/* deck */}
      <path d="M22 92 H138 L130 100 H30 Z" fill={P.paperSide} />
      <path d="M30 78 H130 L138 92 H22 Z" fill="#E8EEF0" />
      <path
        d="M31 79 H129"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.9}
      />
      {[0, 1, 2].map((r) =>
        Array.from({ length: 9 - r }, (_, c) => (
          <rect
            key={`${r}${c}`}
            x={38 + r * 3 + c * 9.6}
            y={81 + r * 3.4}
            width={7.6}
            height={2.4}
            rx={1}
            fill="#C9D6DA"
          />
        )),
      )}
      <rect x={66} y={92.5} width={28} height={2.4} rx={1.2} fill="#C9D6DA" />
      {/* screen */}
      <g className="sp-lift">
        <rect x={34} y={14} width={92} height={66} rx={9} fill={P.inkSide} />
        <rect x={34} y={12} width={92} height={64} rx={9} fill={P.ink} />
        <rect x={40} y={18} width={80} height={52} rx={5} fill={P.paper} />
        <rect x={46} y={23} width={20} height={7} rx={3.5} fill={P.teal} />
        <rect x={69} y={23} width={14} height={7} rx={3.5} fill={P.chip} />
        <rect
          x={46}
          y={35}
          width={60}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.78}
        />
        <rect
          x={46}
          y={42}
          width={44}
          height={4}
          rx={2}
          fill={P.ink}
          opacity={0.2}
        />
        {[0, 1].map((i) => (
          <g key={i}>
            <rect
              x={46 + i * 33}
              y={51}
              width={30}
              height={9}
              rx={4.5}
              fill={i === 0 ? "#FFE9D8" : P.chip}
            />
            <circle
              cx={51 + i * 33}
              cy={55.5}
              r={2.4}
              fill={i === 0 ? P.orange : P.paperSide}
            />
          </g>
        ))}
        <rect x={46} y={64} width={68} height={3} rx={1.5} fill={P.chip} />
        <rect x={46} y={64} width={42} height={3} rx={1.5} fill={P.teal} />
      </g>
      {/* stopwatch */}
      <g className="sp-pop">
        <rect x={121} y={9} width={8} height={6} rx={2} fill={P.orangeSide} />
        <circle
          cx={125}
          cy={32}
          r={17}
          fill={P.orangeSide}
          transform="translate(0 3.5)"
        />
        <circle cx={125} cy={32} r={17} fill={P.orange} />
        <path
          d="M113 25 A14 14 0 0 1 131 18"
          fill="none"
          stroke={P.orangeHi}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <circle cx={125} cy={32} r={11.5} fill={P.paper} />
        {[0, 90, 180, 270].map((d) => (
          <rect
            key={d}
            x={124.2}
            y={21.8}
            width={1.6}
            height={3}
            rx={0.8}
            fill={P.ink}
            opacity={0.5}
            transform={`rotate(${d} 125 32)`}
          />
        ))}
        <path
          d="M125 32 V25.5 M125 32 L129.5 34.5"
          stroke={P.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <circle cx={125} cy={32} r={1.6} fill={P.ink} />
      </g>
      <Spark x={24} y={24} s={0.75} c={P.teal} d={0.5} />
      <Dot x={20} y={50} c={P.gold} d={1.1} />
      <g className="sp-lift">
        <circle cx={80} cy={15.2} r={1.3} fill="#4C6B78" />
        <g transform="rotate(-8 45 66)">
          <rect
            x={36}
            y={58}
            width={17}
            height={15}
            rx={1.5}
            fill={P.goldSide}
            transform="translate(0.8 1.2)"
          />
          <rect x={36} y={58} width={17} height={15} rx={1.5} fill={P.gold} />
          <rect
            x={39}
            y={62}
            width={11}
            height={1.8}
            rx={0.9}
            fill={P.ink}
            opacity={0.35}
          />
          <rect
            x={39}
            y={66}
            width={8}
            height={1.8}
            rx={0.9}
            fill={P.ink}
            opacity={0.35}
          />
        </g>
      </g>
      <g>
        <rect
          x={4}
          y={76}
          width={18}
          height={22}
          rx={4}
          fill={P.paperSide}
          transform="translate(1.5 1.5)"
        />
        <rect x={4} y={76} width={18} height={22} rx={4} fill={P.paper} />
        <rect x={4} y={82} width={18} height={6} fill={P.teal} />
        <path
          d="M22 81 h3 a4.5 4.5 0 0 1 0 9 h-3"
          fill="none"
          stroke={P.paper}
          strokeWidth={3}
        />
        <ellipse cx={13} cy={76.5} rx={8} ry={2} fill="#6B3E22" />
        <path
          className="sp-twinkle"
          d="M10 70 q-2.5 -4 0 -8 M15.5 71 q-2.5 -4 0 -8"
          fill="none"
          stroke={P.paperSide}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </g>
    </>
  ),

  /* Mistake notebook: a spiral notebook with page edges, one cross turning into checks, a bookmark */
  review: (
    <>
      <Ground rx={50} />
      <g className="sp-lift">
        {/* pages, then cover edge */}
        <rect x={40} y={30} width={84} height={72} rx={9} fill={P.orangeSide} />
        <rect x={42} y={26} width={82} height={72} rx={8} fill={P.paper2} />
        <path d="M44 99 H120" stroke={P.line} strokeWidth={1.5} />
        <path d="M44 96.5 H120" stroke={P.line} strokeWidth={1.2} />
        <Block
          x={38}
          y={20}
          w={86}
          h={74}
          r={9}
          face={P.paper}
          side={P.paperSide}
          depth={2}
        />
        <rect x={38} y={20} width={15} height={74} rx={7.5} fill={P.orange} />
        <rect x={46} y={20} width={7} height={74} fill={P.orange} />
        <rect
          x={53}
          y={20}
          width={2}
          height={74}
          fill={P.orangeSide}
          opacity={0.5}
        />
        {[30, 44, 58, 72, 86].map((y) => (
          <g key={y}>
            <circle cx={45} cy={y} r={3.2} fill={P.orangeSide} />
            <path
              d={`M45 ${y} H36`}
              stroke={P.ink}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </g>
        ))}
        {[33, 50, 67].map((y, i) => (
          <g key={y}>
            {i === 0 ? (
              <>
                <circle cx={67} cy={y} r={7} fill="#FFE3DE" />
                <path
                  d={`M63.6 ${y - 3.4} l6.8 6.8 M70.4 ${y - 3.4} l-6.8 6.8`}
                  stroke={P.red}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx={67} cy={y} r={7} fill={P.teal} />
                <Check x={67} y={y} s={0.8} />
              </>
            )}
            <rect
              x={79}
              y={y - 4.5}
              width={28 - i * 6}
              height={4}
              rx={2}
              fill={P.ink}
              opacity={0.75}
            />
            <rect
              x={79}
              y={y + 1.5}
              width={24 - i * 3}
              height={3}
              rx={1.5}
              fill={P.ink}
              opacity={0.18}
            />
          </g>
        ))}
        <rect
          x={62}
          y={80}
          width={46}
          height={3.4}
          rx={1.7}
          fill={P.ink}
          opacity={0.12}
        />
      </g>
      <g className="sp-pop">
        <path
          d="M110 13 h11 v24 l-5.5 -5 l-5.5 5 Z"
          fill={P.goldSide}
          transform="translate(1.5 1.5)"
        />
        <path d="M110 13 h11 v24 l-5.5 -5 l-5.5 5 Z" fill={P.gold} />
        <path
          d="M112.8 16 v14"
          stroke={P.goldHi}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(143 66) rotate(24)">
        <rect
          x={-3.5}
          y={-22}
          width={7}
          height={36}
          rx={3.5}
          fill={P.redSide}
          transform="translate(1.2 1.2)"
        />
        <rect x={-3.5} y={-22} width={7} height={36} rx={3.5} fill={P.red} />
        <rect
          x={-1.5}
          y={-19}
          width={1.8}
          height={22}
          rx={0.9}
          fill="#fff"
          opacity={0.45}
        />
        <path d="M-3.5 14 L0 22 L3.5 14 Z" fill={P.ink} />
        <rect x={-3.5} y={-22} width={7} height={6} rx={2} fill={P.ink} />
      </g>
      <Spark x={30} y={22} s={0.7} c={P.teal} d={0.4} />
      <Dot x={140} y={30} c={P.orange} d={1} />
      <g className="sp-lift">
        <rect x={123} y={32} width={8} height={10} rx={2.5} fill={P.teal} />
        <rect x={123} y={46} width={8} height={10} rx={2.5} fill={P.gold} />
        <rect x={123} y={60} width={8} height={10} rx={2.5} fill={P.aqua} />
      </g>
      <g transform="rotate(-18 128 98)">
        <rect
          x={116}
          y={93}
          width={22}
          height={10}
          rx={3}
          fill="#E58D9B"
          transform="translate(0 2)"
        />
        <rect x={116} y={93} width={22} height={10} rx={3} fill="#FFB3BF" />
        <rect x={116} y={93} width={8} height={10} rx={3} fill="#7FB7D8" />
      </g>
    </>
  ),

  /* Vocabulary: two flashcards fanned out, a word and its meaning, a star */
  vocab: (
    <>
      <Ground rx={52} />
      <g transform="rotate(-13 70 62)">
        <Block
          x={26}
          y={30}
          w={80}
          h={56}
          r={10}
          face={P.teal}
          side={P.tealSide}
          depth={6}
        />
        <rect
          x={38}
          y={44}
          width={34}
          height={6}
          rx={3}
          fill={P.paper}
          opacity={0.6}
        />
        <rect
          x={38}
          y={56}
          width={48}
          height={4}
          rx={2}
          fill={P.paper}
          opacity={0.3}
        />
        <path
          d="M36 34 H96"
          stroke={P.tealHi}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </g>
      <g className="sp-lift">
        <g transform="rotate(7 94 62)">
          <Block
            x={54}
            y={30}
            w={86}
            h={60}
            r={10}
            face={P.paper}
            side={P.paperSide}
            depth={6}
          />
          <rect x={66} y={42} width={9} height={14} rx={2} fill={P.orange} />
          <rect
            x={79}
            y={45}
            width={42}
            height={8}
            rx={4}
            fill={P.ink}
            opacity={0.88}
          />
          <rect
            x={66}
            y={62}
            width={60}
            height={4}
            rx={2}
            fill={P.ink}
            opacity={0.22}
          />
          <rect
            x={66}
            y={70}
            width={46}
            height={4}
            rx={2}
            fill={P.ink}
            opacity={0.22}
          />
          <rect x={66} y={79} width={24} height={6} rx={3} fill="#FFE9D8" />
          <rect x={94} y={79} width={18} height={6} rx={3} fill="#DFF4F6" />
        </g>
      </g>
      <g className="sp-pop">
        <path
          d="M130 12 l3.9 7.9 8.7 1.3 -6.3 6.1 1.5 8.7 -7.8 -4.1 -7.8 4.1 1.5 -8.7 -6.3 -6.1 8.7 -1.3 Z"
          fill={P.goldSide}
          transform="translate(0 3)"
        />
        <path
          d="M130 12 l3.9 7.9 8.7 1.3 -6.3 6.1 1.5 8.7 -7.8 -4.1 -7.8 4.1 1.5 -8.7 -6.3 -6.1 8.7 -1.3 Z"
          fill={P.gold}
        />
        <path
          d="M126.5 21 l2.5 -4.5"
          stroke={P.goldHi}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
      <Spark x={22} y={26} s={0.6} c={P.orange} d={0.9} />
      <Dot x={18} y={74} c={P.teal} d={0.3} />
      <g
        transform="rotate(-13 70 62)"
        fontFamily="inherit"
        fontWeight={800}
        fontSize={18}
        fill="#fff"
        fillOpacity={0.9}
      >
        <text x={36} y={80}>
          A
        </text>
      </g>
      <g className="sp-pop">
        <path
          d="M14 12 h30 a7 7 0 0 1 7 7 v8 a7 7 0 0 1 -7 7 h-18 l-7 6 l1 -6 h-6 a7 7 0 0 1 -7 -7 v-8 a7 7 0 0 1 7 -7 Z"
          fill={P.tealSide}
          transform="translate(0 2)"
        />
        <path
          d="M14 12 h30 a7 7 0 0 1 7 7 v8 a7 7 0 0 1 -7 7 h-18 l-7 6 l1 -6 h-6 a7 7 0 0 1 -7 -7 v-8 a7 7 0 0 1 7 -7 Z"
          fill={P.teal}
        />
        {[20, 29, 38].map((x) => (
          <circle key={x} cx={x} cy={23} r={2.4} fill="#fff" />
        ))}
      </g>
    </>
  ),

  /* Study plan: a desk calendar with rings, today marked, two days done, a clock */
  plan: (
    <>
      <Ground rx={52} />
      <g className="sp-lift">
        <Block
          x={30}
          y={22}
          w={96}
          h={76}
          r={11}
          face={P.paper}
          side={P.paperSide}
          depth={7}
        />
        <path
          d="M30 33 a11 11 0 0 1 11 -11 h74 a11 11 0 0 1 11 11 v9 h-96 Z"
          fill={P.teal}
        />
        <path
          d="M38 25.5 H118"
          stroke={P.tealHi}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {[52, 104].map((x) => (
          <g key={x}>
            <rect
              x={x - 3.5}
              y={14}
              width={7}
              height={16}
              rx={3.5}
              fill={P.inkSide}
              transform="translate(0 1.5)"
            />
            <rect
              x={x - 3.5}
              y={14}
              width={7}
              height={16}
              rx={3.5}
              fill={P.ink}
            />
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((c) =>
          [0, 1, 2].map((r) => {
            const x = 38 + c * 17;
            const y = 49 + r * 14;
            const today = c === 3 && r === 1;
            const done = r === 0 || (r === 1 && c < 3);
            return (
              <g key={`${c}${r}`}>
                {today && (
                  <rect
                    x={x}
                    y={y + 2}
                    width={13}
                    height={10}
                    rx={3.5}
                    fill={P.orangeSide}
                  />
                )}
                <rect
                  x={x}
                  y={y}
                  width={13}
                  height={10}
                  rx={3.5}
                  fill={today ? P.orange : done ? "#DDF3F5" : P.chip}
                />
                {done && (
                  <Check x={x + 6.5} y={y + 5} s={0.55} c={P.teal} w={3.4} />
                )}
                {today && (
                  <circle cx={x + 6.5} cy={y + 5} r={1.8} fill="#fff" />
                )}
              </g>
            );
          }),
        )}
      </g>
      <g className="sp-pop">
        <circle
          cx={128}
          cy={84}
          r={13}
          fill={P.tealSide}
          transform="translate(0 3)"
        />
        <circle cx={128} cy={84} r={13} fill={P.teal} />
        <circle cx={128} cy={84} r={9} fill={P.paper} />
        <path
          d="M128 84 V78.5 M128 84 L131.5 86"
          stroke={P.ink}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
      <Spark x={138} y={22} d={0.3} />
      <Dot x={20} y={58} c={P.orange} d={1.1} />
      <g transform="rotate(-10 26 92)">
        <rect
          x={12}
          y={80}
          width={24}
          height={22}
          rx={2}
          fill={P.goldSide}
          transform="translate(1 1.5)"
        />
        <rect x={12} y={80} width={24} height={22} rx={2} fill={P.gold} />
        <path d="M30 102 L36 96 V102 Z" fill={P.goldSide} />
        <rect
          x={16}
          y={86}
          width={14}
          height={2}
          rx={1}
          fill={P.ink}
          opacity={0.35}
        />
        <rect
          x={16}
          y={91}
          width={10}
          height={2}
          rx={1}
          fill={P.ink}
          opacity={0.35}
        />
      </g>
    </>
  ),

  /* Progress: 3D bars rising to the right, a trend arrow above them, a star at the top */
  progress: (
    <>
      <Ground rx={54} />
      <path
        d="M24 97 H136"
        stroke={P.paperSide}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {[
        { x: 32, h: 22, f: P.aqua, s: P.aquaSide, t: "#B9EAEF" },
        { x: 58, h: 34, f: P.aqua, s: P.aquaSide, t: "#B9EAEF" },
        { x: 84, h: 48, f: P.teal, s: P.tealSide, t: P.tealHi },
        { x: 110, h: 62, f: P.orange, s: P.orangeSide, t: P.orangeHi },
      ].map((b, i) => (
        <g key={b.x} className={i === 3 ? "sp-lift" : undefined}>
          {/* side, front, top */}
          <path
            d={`M${b.x + 18} ${95 - b.h} l6 -4 v${b.h} l-6 4 Z`}
            fill={b.s}
          />
          <rect
            x={b.x}
            y={95 - b.h}
            width={18}
            height={b.h}
            rx={2.5}
            fill={b.f}
          />
          <path d={`M${b.x} ${95 - b.h} l6 -4 h18 l-6 4 Z`} fill={b.t} />
          <rect
            x={b.x + 3}
            y={98 - b.h}
            width={3}
            height={b.h - 8}
            rx={1.5}
            fill="#fff"
            opacity={0.3}
          />
        </g>
      ))}
      <path
        d="M30 60 C52 58 62 46 76 38 S102 24 118 16"
        fill="none"
        stroke={P.ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M108 13 L121 14.5 L116 26.5"
        fill="none"
        stroke={P.ink}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [30, 60],
        [76, 38],
      ].map(([x, y]) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r={3.6}
          fill="#fff"
          stroke={P.ink}
          strokeWidth={2.4}
        />
      ))}
      <Spark x={140} y={30} d={0.4} />
      <Dot x={22} y={30} c={P.orange} d={1} />
      <g>
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <ellipse
              cx={16}
              cy={96 - k * 5}
              rx={9}
              ry={3.4}
              fill={P.goldSide}
            />
            <ellipse cx={16} cy={94 - k * 5} rx={9} ry={3.4} fill={P.gold} />
          </g>
        ))}
        <path
          d="M10 83.5 a6 2 0 0 0 8 1"
          fill="none"
          stroke={P.goldHi}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    </>
  ),

  /* Goal: a target turned sideways on a wooden easel, a pennant beside it */
  target: (
    <>
      <Ground rx={46} />
      {/* easel: back leg, then the two front legs */}
      <path
        d="M86 70 L100 104"
        stroke="#8A5530"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <g transform="rotate(-10 78 60)">
        {/* the board seen from the side: its rim, then the face */}
        <ellipse cx={86} cy={60} rx={23} ry={40} fill="#D9BFA0" />
        <rect x={74} y={20} width={12} height={80} fill="#D9BFA0" />
        <ellipse cx={74} cy={60} rx={23} ry={40} fill={P.paper} />
        <ellipse cx={74} cy={60} rx={17.5} ry={30.5} fill={P.orange} />
        <ellipse cx={74} cy={60} rx={12} ry={21} fill={P.paper} />
        <ellipse cx={74} cy={60} rx={6.6} ry={11.5} fill={P.teal} />
        <ellipse
          className="sp-pop"
          cx={74}
          cy={60}
          rx={2.6}
          ry={4.5}
          fill={P.ink}
        />
        <path
          d="M58 40 A20 36 0 0 1 70 22"
          fill="none"
          stroke={P.orangeHi}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {[
          [79, 47],
          [69, 72],
          [82, 66],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={1.6} fill={P.ink} opacity={0.55} />
        ))}
      </g>
      <path
        d="M68 74 L54 106 M80 76 L84 106"
        stroke="#A86A3D"
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      <path
        d="M58 96 H84"
        stroke="#A86A3D"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <g className="sp-pop">
        <path
          d="M112 22 V48"
          stroke={P.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path d="M112 23 L130 28 L112 34 Z" fill={P.red} />
      </g>
      <Spark x={30} y={24} s={0.75} c={P.teal} d={0.7} />
      <Spark x={134} y={70} s={0.8} d={0.2} />
      <Dot x={24} y={70} c={P.orange} d={1.1} />
    </>
  ),

  /* Focus: a stopwatch with a crown and side button, a quarter of the session done */
  focus: (
    <>
      <Ground rx={42} />
      <rect
        x={73}
        y={8}
        width={14}
        height={9}
        rx={3}
        fill={P.inkSide}
        transform="translate(0 2)"
      />
      <rect x={73} y={8} width={14} height={9} rx={3} fill={P.ink} />
      <rect x={77} y={14} width={6} height={8} fill={P.ink} />
      <g transform="rotate(40 116 30)">
        <rect x={111} y={24} width={11} height={8} rx={3} fill={P.ink} />
      </g>
      <circle
        cx={80}
        cy={62}
        r={38}
        fill={P.tealSide}
        transform="translate(0 5)"
      />
      <circle cx={80} cy={62} r={38} fill={P.teal} />
      <path
        d="M50 46 A34 34 0 0 1 72 26"
        fill="none"
        stroke={P.tealHi}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <circle cx={80} cy={62} r={29} fill={P.paper} />
      <path
        className="sp-lift"
        d="M80 62 L80 33 A29 29 0 0 1 108.6 57 Z"
        fill={P.orange}
        opacity={0.92}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={79.2}
          y={35}
          width={1.6}
          height={i % 3 === 0 ? 5 : 3}
          rx={0.8}
          fill={P.ink}
          opacity={i % 3 === 0 ? 0.6 : 0.3}
          transform={`rotate(${i * 30} 80 62)`}
        />
      ))}
      <path
        d="M80 62 L80 41"
        stroke={P.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M80 62 L95 70"
        stroke={P.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={80} cy={62} r={3.6} fill={P.ink} />
      <Spark x={132} y={66} d={0.2} />
      <Dot x={28} y={36} c={P.orange} d={0.9} />
      <g className="sp-twinkle">
        <path
          d="M44 26 q-6 4 -8 11 M38 20 q-9 6 -12 16"
          fill="none"
          stroke={P.orange}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        <path
          d="M116 18 q6 3 9 9 M121 11 q9 5 13 14"
          fill="none"
          stroke={P.orange}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      </g>
      <g className="sp-pop">
        <circle
          cx={116}
          cy={94}
          r={11}
          fill={P.tealSide}
          transform="translate(0 2.5)"
        />
        <circle cx={116} cy={94} r={11} fill={P.gold} />
        <Check x={116} y={94} s={0.95} c={P.ink} w={3} />
      </g>
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
      {SPOTS[name]}
    </svg>
  );
}
