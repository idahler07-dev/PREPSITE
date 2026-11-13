import { cn } from "@/lib/utils";

/**
 * Willo as a compact "box" character: the head is a rounded square with ears,
 * antlers and the teal scarf, drawn as flat vector shapes (no gradients) with a
 * single shine. Every part is its own shape, so it animates smoothly at the
 * screen's frame rate and never warps (CSS in globals.css, `.wb-*`).
 *
 * Moods: idle (bob, blink, ear flick), happy (eyes closed in a smile, hop),
 * wink, sad (droopy ears and brows, a tear), think (looks up, a question mark),
 * sleep (closed eyes, breathing, rising Zs), wow (round eyes and mouth, pop).
 */
export type WilloBoxMood =
  | "idle"
  | "happy"
  | "wink"
  | "sad"
  | "think"
  | "sleep"
  | "wow";

const C = {
  fur: "#FF8A2E",
  furDark: "#E9711A",
  cream: "#FFF1E0",
  ear: "#FFD9BC",
  antler: "#7A3D1A",
  antlerHi: "#9A5228",
  ink: "#123A49",
  nose: "#5B2C12",
  mouth: "#C2413A",
  tongue: "#FF7A6B",
  cheek: "#FF9F86",
  scarf: "#0E7E8E",
  scarfDark: "#0A6371",
  tear: "#6CC6EE",
  accent: "#FFB627",
};

function Eye({
  x,
  mood,
  side,
}: {
  x: number;
  mood: WilloBoxMood;
  side: -1 | 1;
}) {
  const y = 116;
  const closedSmile = mood === "happy" || (mood === "wink" && side === -1);
  const closedSleep = mood === "sleep";
  if (closedSmile)
    return (
      <path
        d={`M${x - 12} ${y + 3} Q${x} ${y - 11} ${x + 12} ${y + 3}`}
        fill="none"
        stroke={C.ink}
        strokeWidth={5.5}
        strokeLinecap="round"
      />
    );
  if (closedSleep)
    return (
      <path
        d={`M${x - 12} ${y} Q${x} ${y + 10} ${x + 12} ${y}`}
        fill="none"
        stroke={C.ink}
        strokeWidth={5}
        strokeLinecap="round"
      />
    );
  const big = mood === "wow" ? 1.12 : 1;
  const look = mood === "think" ? { dx: 3, dy: -4 } : { dx: 0, dy: 0 };
  return (
    <g className="wb-eye">
      <ellipse cx={x} cy={y} rx={13 * big} ry={15.5 * big} fill={C.ink} />
      <g
        className="wb-look"
        style={{ transform: `translate(${look.dx}px, ${look.dy}px)` }}
      >
        <circle cx={x + 4.5} cy={y - 6} r={4.6} fill="#fff" />
        <circle cx={x - 4} cy={y + 6} r={2.1} fill="#fff" opacity={0.85} />
      </g>
    </g>
  );
}

function Brows({ mood }: { mood: WilloBoxMood }) {
  if (mood === "sleep") return null;
  const sad = mood === "sad";
  const up = mood === "wow" || mood === "think";
  const yl = up ? 86 : 92;
  return (
    <g
      className="wb-brows"
      fill="none"
      stroke={C.antler}
      strokeWidth={5}
      strokeLinecap="round"
    >
      <path
        d={
          sad
            ? `M66 ${yl + 2} Q74 ${yl - 4} 84 ${yl - 6}`
            : `M66 ${yl} Q75 ${yl - 6} 84 ${yl - 1}`
        }
      />
      <path
        d={
          sad
            ? `M134 ${yl + 2} Q126 ${yl - 4} 116 ${yl - 6}`
            : mood === "think"
              ? `M116 ${yl - 4} Q125 ${yl - 9} 134 ${yl - 3}`
              : `M116 ${yl - 1} Q125 ${yl - 6} 134 ${yl}`
        }
      />
    </g>
  );
}

function Mouth({ mood }: { mood: WilloBoxMood }) {
  if (mood === "happy" || mood === "wink")
    return (
      <g>
        <path
          d="M89 143 Q100 147 111 143 Q110 160 100 160 Q90 160 89 143 Z"
          fill={C.mouth}
        />
        <path
          d="M93 155 Q100 150 107 155 Q104 160 100 160 Q96 160 93 155 Z"
          fill={C.tongue}
        />
      </g>
    );
  if (mood === "wow")
    return <ellipse cx={100} cy={152} rx={6.5} ry={8} fill={C.mouth} />;
  if (mood === "sad")
    return (
      <path
        d="M92 153 Q100 146 108 153"
        fill="none"
        stroke={C.nose}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
    );
  if (mood === "think")
    return (
      <path
        d="M93 150 Q99 147 107 151"
        fill="none"
        stroke={C.nose}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
    );
  return (
    <path
      d="M91 145 Q95.5 151 100 146 Q104.5 151 109 145"
      fill="none"
      stroke={C.nose}
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Antler({ side }: { side: -1 | 1 }) {
  // drawn for the left side, mirrored for the right
  const t = side === 1 ? "translate(200 0) scale(-1 1)" : undefined;
  return (
    <g transform={t}>
      <g className={side === -1 ? "wb-antler-l" : "wb-antler-r"}>
        <path
          d="M74 66 L64 24"
          stroke={C.antler}
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d="M67 40 L48 30"
          stroke={C.antler}
          strokeWidth={13}
          strokeLinecap="round"
        />
        <path
          d="M65 28 L76 14"
          stroke={C.antler}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d="M66 52 L62 34"
          stroke={C.antlerHi}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.8}
        />
      </g>
    </g>
  );
}

function Ear({ side, mood }: { side: -1 | 1; mood: WilloBoxMood }) {
  const t = side === 1 ? "translate(200 0) scale(-1 1)" : undefined;
  return (
    <g transform={t}>
      <g
        className={cn(
          "wb-ear",
          side === -1 ? "wb-ear-l" : "wb-ear-r",
          mood === "sad" && "wb-ear-down",
        )}
      >
        <path d="M40 86 C20 80 6 64 6 52 C22 50 40 60 50 74 Z" fill={C.fur} />
        <path d="M38 81 C24 76 15 66 14 58 C25 58 37 65 44 74 Z" fill={C.ear} />
      </g>
    </g>
  );
}

export function WilloBox({
  mood = "idle",
  className,
  label,
}: {
  mood?: WilloBoxMood;
  className?: string;
  /** Accessible name; omit when decorative. */
  label?: string;
}) {
  return (
    <span
      className={cn("willo-box", className)}
      data-mood={mood}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 200 210" className="wb-svg">
        <ellipse
          className="wb-shadow"
          cx={100}
          cy={203}
          rx={58}
          ry={5}
          fill="#000"
          opacity={0.08}
        />
        <g className="wb-body">
          <Antler side={-1} />
          <Antler side={1} />
          <Ear side={-1} mood={mood} />
          <Ear side={1} mood={mood} />
          {/* the box: head and body in one rounded square */}
          <rect x={32} y={56} width={136} height={134} rx={38} fill={C.fur} />
          <path
            d="M86 60 Q88 42 100 46 Q104 34 116 40 Q110 48 114 60 Z"
            fill={C.fur}
          />
          {/* shine */}
          <path
            d="M52 76 Q60 64 78 62"
            fill="none"
            stroke="#fff"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.35}
          />
          {/* face */}
          <g fill={C.cream}>
            <circle cx={76} cy={120} r={25} />
            <circle cx={124} cy={120} r={25} />
            <ellipse cx={100} cy={146} rx={44} ry={24} />
          </g>
          <ellipse
            cx={56}
            cy={142}
            rx={9}
            ry={5.5}
            fill={C.cheek}
            opacity={0.55}
          />
          <ellipse
            cx={144}
            cy={142}
            rx={9}
            ry={5.5}
            fill={C.cheek}
            opacity={0.55}
          />
          <Brows mood={mood} />
          <g className="wb-eyes">
            <Eye x={76} mood={mood} side={-1} />
            <Eye x={124} mood={mood} side={1} />
          </g>
          <path
            d="M93 132 Q100 128 107 132 Q104 139 100 139 Q96 139 93 132 Z"
            fill={C.nose}
          />
          <Mouth mood={mood} />
          {/* scarf */}
          <g className="wb-scarf">
            <rect
              x={30}
              y={170}
              width={140}
              height={22}
              rx={11}
              fill={C.scarf}
            />
            <path
              d="M44 176 H156"
              stroke={C.scarfDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.6}
            />
            <g className="wb-tail">
              <path
                d="M136 182 L150 206 L132 208 L124 186 Z"
                fill={C.scarfDark}
              />
              <path
                d="M136 204 L134 210 M142 204 L141 210 M148 203 L148 209"
                stroke={C.scarfDark}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </g>
          </g>
          {mood === "sad" && (
            <path
              className="wb-tear"
              d="M64 132 C60 140 59 145 64 147 C69 145 68 140 64 132 Z"
              fill={C.tear}
            />
          )}
        </g>
        {mood === "think" && (
          <g
            className="wb-q"
            fill="none"
            stroke={C.scarf}
            strokeWidth={7}
            strokeLinecap="round"
          >
            <path d="M166 34 Q168 22 178 22 Q189 22 189 32 Q189 40 180 44 Q177 46 177 52" />
            <circle cx={177} cy={62} r={4} fill={C.scarf} stroke="none" />
          </g>
        )}
        {mood === "sleep" && (
          <g
            className="wb-zs"
            fill="none"
            stroke={C.scarf}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path className="wb-z1" d="M150 46 H162 L150 58 H162" />
            <path className="wb-z2" d="M166 26 H180 L166 40 H180" />
          </g>
        )}
        {(mood === "happy" || mood === "wow" || mood === "wink") && (
          <g
            className="wb-spark"
            stroke={C.accent}
            strokeWidth={6}
            strokeLinecap="round"
          >
            <path d="M186 72 L197 64" />
            <path d="M188 88 L200 88" />
            <path d="M180 56 L186 44" />
          </g>
        )}
      </svg>
    </span>
  );
}
