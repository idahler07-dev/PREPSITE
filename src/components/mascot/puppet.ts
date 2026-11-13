/**
 * Willo as a puppet, animated every display frame (60 fps on most screens).
 *
 * One flat illustration, bent by a small rig (rigs.ts): the body breathes up from
 * the ground line, the head turns about the neck, each arm swings about its
 * shoulder, the scarf tail trails behind. Every part blends into its neighbours
 * with a soft seam, so nothing tears or slides apart. Lids are drawn on the bent
 * art, so blinks follow the head. A sad pose can let a single tear roll.
 *
 * Motion follows classic character animation: anticipation before a hop,
 * squash on landing, overlapping action (arms and scarf trail the body), and
 * eased holds. Wink poses start from open eyes and wink into the drawn wink.
 * The idea bulb fills with light from its base up, then glows and sends rays.
 * One shared WebGL context renders every Willo on the page.
 */
import { RIGS, rigKey, type Rig } from "./rigs";

export type Mood = "idle" | "happy" | "cry";
export interface Eye {
  x: number;
  y: number;
  rx: number;
  ry: number;
  fur: string;
}

const PAD = 0.08; // room around the art for a hand that swings past its edge
const MAX_LIMBS = 4;

const VS = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const FS = `precision highp float;
varying vec2 vUv;
uniform sampler2D uTex, uAlt;
uniform vec2 uImg, uN, uHeadT, uHeadC, uLift;
uniform float uPad, uBreath, uSquash, uLean, uFoot, uBand, uHead, uHeadR, uPx, uWinkK, uRays, uGlow;
uniform vec4 uWink, uBulb;
uniform vec4 uL[${MAX_LIMBS}];
uniform vec3 uLp[${MAX_LIMBS}];
uniform vec4 uEye[2];
uniform vec3 uFur[2];
uniform float uLid[2];
uniform vec4 uTear[2];
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
vec4 tex(vec2 q){
  vec2 uv = q/uImg;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uTex, uv);
}
vec4 alt(vec2 q){
  vec2 uv = q/uImg;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uAlt, uv);
}
void main(){
  vec2 p = ((vUv*(1.0 + 2.0*uPad)) - uPad)*uImg - uLift;
  float cx = uImg.x*0.5;
  vec2 F = vec2(cx, uFoot);
  // the whole body leans from the feet
  p = F + rot(p - F, -uLean);
  // breathing and squash-and-stretch from the ground line (volume kept: wider when shorter)
  float sy = (1.0 + uBreath)*(1.0 + uSquash);
  float sx = (1.0 + 0.35*uBreath)*(1.0 - 0.5*uSquash);
  vec2 pb = vec2(cx + (p.x - cx)/sx, uFoot + (p.y - uFoot)/sy);
  vec2 q = pb;
  // head: everything above the neck seam turns about the neck
  float wh = smoothstep(uN.y + uBand, uN.y - uBand, pb.y);
  if (uHeadR > 0.0) wh *= smoothstep(uHeadR*1.12, uHeadR*0.92, length(pb - uHeadC));
  q = mix(q, uN + rot(pb - uN - uHeadT, -uHead), wh);
  // limbs: a soft capsule from shoulder to hand swings about the shoulder
  for (int i = 0; i < ${MAX_LIMBS}; i++) {
    vec4 L = uL[i];
    vec3 P = uLp[i]; // radius, angle, taper
    if (P.x <= 0.0) continue;
    vec2 ab = L.zw - L.xy;
    float t = clamp(dot(pb - L.xy, ab)/dot(ab, ab), 0.0, 1.25);
    float d = length(pb - (L.xy + ab*min(t, 1.0)));
    float w = smoothstep(P.x, P.x*0.55, d);
    if (P.z > 0.5) w *= smoothstep(0.0, 0.45, t);
    q = mix(q, L.xy + rot(pb - L.xy, -P.y), w);
  }
  vec4 col = tex(q);
  // lids, drawn on the bent art so they ride with the head
  for (int i = 0; i < 2; i++) {
    float k = uLid[i];
    if (k <= 0.001) continue;
    vec2 v = (q - uEye[i].xy)/(uEye[i].zw*vec2(1.16, 1.14));
    float r = length(v);
    float aa = uPx/(uEye[i].w*1.14);
    float inside = smoothstep(1.0 + aa, 1.0 - aa, r);
    float edge = mix(-1.1, 0.28, k) + 0.34*k*(1.0 - v.x*v.x);
    float cover = smoothstep(edge + aa, edge - aa, v.y)*inside;
    vec3 fur = uFur[i]*(0.9 + 0.1*clamp((v.y + 1.0)*0.5, 0.0, 1.0));
    col = mix(col, vec4(fur, 1.0), cover);
    float lw = 0.09 + 0.05*k;
    float lash = smoothstep(lw + aa, lw - aa, abs(v.y - edge))*smoothstep(1.02, 0.86, r)*step(0.02, k);
    col = mix(col, vec4(0.227, 0.141, 0.086, 1.0), lash*inside);
  }
  // wink: once the lid is down, the drawn wink takes over around that eye
  if (uWinkK > 0.001) {
    vec2 v = (q - uWink.xy)/(uWink.zw*vec2(1.5, 1.6));
    float m = smoothstep(1.0, 0.72, length(v));
    col = mix(col, alt(q), m*uWinkK);
  }
  // the idea bulb: dim when off, light fills the glass from the base up, rays when full
  float glow = 0.0;
  if (uBulb.z > 0.0) {
    vec2 bv = (q - uBulb.xy)/uBulb.z;
    float d = length(bv);
    float yel = step(0.5, col.a)*smoothstep(0.55, 0.75, col.r)*smoothstep(0.42, 0.6, col.g)*smoothstep(0.6, 0.4, col.b);
    float glass = yel*smoothstep(1.12, 1.0, d);
    float fy = clamp((1.0 - bv.y)*0.5, 0.0, 1.0); // 0 at the base, 1 at the top
    float lit = smoothstep(uBulb.w + 0.08, uBulb.w - 0.08, fy)*step(0.001, uBulb.w);
    float lum = dot(col.rgb, vec3(0.3, 0.55, 0.15));
    vec3 off = mix(col.rgb, vec3(lum*0.95, lum*0.88, lum*0.62)*0.86, 0.6);
    vec3 on = mix(col.rgb, vec3(1.0, 0.97, 0.8), 0.42 + 0.18*smoothstep(0.7, 0.0, d));
    col.rgb = mix(col.rgb, mix(off, on, lit), glass);
    // rays: the drawn yellow marks around the bulb only show while it is lit
    float ray = yel*smoothstep(1.15, 1.3, d)*smoothstep(2.6, 2.2, d);
    col *= 1.0 - ray*(1.0 - uRays);
    col.rgb = mix(col.rgb, vec3(1.0, 0.9, 0.5), ray*uRays*0.35);
    glow = uGlow*exp(-pow(max(d - 0.55, 0.0)/0.85, 2.0));
  }
  // a single tear rolling from a drawn one
  for (int i = 0; i < 2; i++) {
    vec4 T = uTear[i]; // x, y, radius, alpha
    if (T.w <= 0.001) continue;
    vec2 v = (q - T.xy)/T.z;
    if (v.y < 0.0) v.y *= 0.62; // drawn out to a point on top
    float r = length(v);
    float aa = uPx/T.z;
    float body = smoothstep(1.0 + aa, 1.0 - aa, r);
    vec3 c = mix(vec3(0.561, 0.827, 0.957), vec3(0.243, 0.561, 0.749), smoothstep(0.7, 0.95, r));
    float hi = smoothstep(0.3, 0.18, length(v - vec2(-0.32, 0.05)));
    c = mix(c, vec3(1.0), hi*0.85);
    col = mix(col, vec4(c, 1.0), body*T.w);
  }
  vec4 pm = vec4(col.rgb*col.a, col.a);
  // warm light behind the art
  pm += (1.0 - pm.a)*vec4(vec3(1.0, 0.82, 0.35)*glow*0.55, glow*0.55);
  gl_FragColor = pm;
}`;

// ─── shared GL ──────────────────────────────────────────────────────────────
let gl: WebGLRenderingContext | null = null;
let gl2 = false;
let glCanvas: HTMLCanvasElement | null = null;
let prog: WebGLProgram | null = null;
let failed = false;
const loc: Record<string, WebGLUniformLocation | null> = {};

function ensureGL(): boolean {
  if (gl) return true;
  if (failed) return false;
  try {
    glCanvas = document.createElement("canvas");
    const attrs = {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    };
    // WebGL 2 can mipmap any image size: a crisp, clean line when the art is drawn small
    const g2 = glCanvas.getContext(
      "webgl2",
      attrs,
    ) as WebGLRenderingContext | null;
    gl2 = !!g2;
    const g =
      g2 ??
      (glCanvas.getContext("webgl", attrs) as WebGLRenderingContext | null);
    if (!g) throw new Error("no webgl");
    const sh = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS))
        throw new Error(g.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const p = g.createProgram()!;
    g.attachShader(p, sh(g.VERTEX_SHADER, VS));
    g.attachShader(p, sh(g.FRAGMENT_SHADER, FS));
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error("link");
    g.useProgram(p);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(
      g.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      g.STATIC_DRAW,
    );
    const a = g.getAttribLocation(p, "aPos");
    g.enableVertexAttribArray(a);
    g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl = g;
    prog = p;
    return true;
  } catch {
    failed = true;
    return false;
  }
}

function u(name: string) {
  if (!(name in loc)) loc[name] = gl!.getUniformLocation(prog!, name);
  return loc[name] ?? null;
}

/** The sharpest copy of a deer pose (-hd); other art is used as is. */
function hiRes(url: string) {
  return /\/mascot\/deer-[a-z-]+?(-sm)?\.webp$/.test(url) &&
    !url.includes("-hd.")
    ? url.replace(/(-sm)?\.webp$/, "-hd.webp")
    : url;
}
const textures = new Map<
  string,
  { tex: WebGLTexture | null; img: HTMLImageElement; ready: boolean }
>();
function upload(img: TexImageSource, tex: WebGLTexture) {
  const g = gl!;
  g.bindTexture(g.TEXTURE_2D, tex);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
  if (gl2) {
    g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
  } else g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
}
/** The texture for `url`, loading the sharpest copy; `fallback` (already loaded) stands in meanwhile. */
function textureFor(
  url: string,
  fallback?: HTMLImageElement,
): WebGLTexture | null {
  const want = hiRes(url);
  let e = textures.get(want);
  if (!e) {
    const img = new Image();
    img.decoding = "async";
    const entry: {
      tex: WebGLTexture | null;
      img: HTMLImageElement;
      ready: boolean;
    } = { tex: null, img, ready: false };
    img.onload = () => {
      entry.tex = gl!.createTexture();
      if (entry.tex) upload(img, entry.tex);
      entry.ready = true;
    };
    img.src = want;
    textures.set(want, entry);
    e = entry;
  }
  if (e.ready) return e.tex;
  if (fallback?.complete && fallback.naturalWidth) {
    const key = "fb:" + url;
    let f = textures.get(key);
    if (!f) {
      f = { tex: gl!.createTexture(), img: fallback, ready: true };
      if (f.tex) upload(fallback, f.tex);
      textures.set(key, f);
    }
    return f.tex;
  }
  return null;
}

// ─── motion ─────────────────────────────────────────────────────────────────
const D = Math.PI / 180;
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0 → 1 → 0 over [t0, t0 + len], eased in and out. */
const bump = (t: number, t0: number, len: number) => {
  const x = (t - t0) / len;
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

interface Pose {
  breath: number;
  squash: number;
  lean: number;
  head: number;
  headT: [number, number];
  lift: number;
  limbs: number[];
  lids: [number, number];
  wink: number; // 0..1: the lid is down and the drawn wink shows
  winkLid: number; // the lid closing over the winking eye
  bulb: [number, number, number]; // fill level, rays, glow
  tears: [number, number, number][]; // dy (fraction of height), alpha, which
}

/** Overshoot then settle: 0 → 1 with a small bounce past 1. */
const back = (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c = 1.6;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** The motion for one Willo: rhythms that never quite line up, plus acted beats. */
class Motion {
  phase = Math.random() * 10;
  blinkAt = rnd(0.8, 3);
  blinkTwice = false;
  glanceAt = rnd(2, 5);
  glanceDir = 1;
  gestureAt: number[] = [];
  tearAt = rnd(0.6, 1.6);
  tearWhich = 0;
  hopAt = -10;
  happyAt = -10;
  winkAt = rnd(1.2, 2.4);
  bulbAt = rnd(0.3, 1);
  mood: Mood = "idle";

  constructor(limbs: number) {
    for (let i = 0; i < limbs; i++) this.gestureAt.push(rnd(1.5, 4) + i * 1.3);
  }

  setMood(m: Mood, t: number) {
    if (m === "happy" && this.mood !== "happy") {
      this.happyAt = t;
      this.hopAt = t;
    }
    this.mood = m;
  }

  /** A hop: anticipation (crouch), lift with stretch, land with squash, settle. */
  hop(t: number): [number, number] {
    const h = t - this.hopAt;
    if (h < 0 || h > 0.95) return [0, 0];
    if (h < 0.14) return [0, -0.05 * Math.sin((Math.PI / 2) * (h / 0.14))];
    if (h < 0.6) {
      const x = (h - 0.14) / 0.46;
      return [
        0.075 * Math.sin(Math.PI * x),
        0.045 * Math.cos(Math.PI * x) - 0.01,
      ];
    }
    const x = (h - 0.6) / 0.35;
    return [0, -0.045 * Math.sin(Math.PI * x) * (1 - x)];
  }

  at(t: number, rig: Rig): Pose {
    const sad = this.mood === "cry" || !!rig.tears;
    const T = t + this.phase;
    const TAU = 2 * Math.PI;
    // breathing (slower and deeper when sad, with a sniffle)
    const bp = sad ? 4.2 : 3.4;
    let breath = (sad ? 0.018 : 0.014) * (0.5 - 0.5 * Math.cos((TAU * T) / bp));
    if (sad) {
      const s = T % 4.4;
      breath += 0.012 * (bump(s, 1.8, 0.2) + bump(s, 2.08, 0.2));
    }
    // hops: celebratory poses hop now and then; turning happy hops at once
    if (rig.hop && t > this.hopAt + 1) this.hopAt = t + rnd(2.2, 4.2);
    const [lift, hopSq] = this.hop(t);
    const squash = hopSq;
    // the body leans and shifts its weight
    let lean =
      (sad ? 0.8 : 1.6) * D * Math.sin((TAU * T) / 4.6) +
      0.6 * D * Math.sin((TAU * T) / 2.3 + 0.4);
    // head: drifts, glances (anticipate a little the other way, swing over, overshoot, settle)
    let head =
      (sad ? 1.6 : 2.6) * D * Math.sin((TAU * T) / 5.3) +
      1.1 * D * Math.sin((TAU * T) / 2.9 + 1.1);
    if (t > this.glanceAt + 2.6) {
      this.glanceAt = t + rnd(2.5, 5.5);
      this.glanceDir = Math.random() < 0.5 ? -1 : 1;
    }
    const gt = t - this.glanceAt;
    const glance =
      gt < 0
        ? 0
        : gt < 0.12
          ? -0.2 * Math.sin((Math.PI / 2) * (gt / 0.12))
          : back((gt - 0.12) / 0.45) * (1 - ease((gt - 1.7) / 0.6));
    head += this.glanceDir * 6 * D * glance;
    lean += this.glanceDir * 1.2 * D * glance;
    // wink: lid down fast, hold the drawn wink with a head tilt, open again
    let wink = 0;
    let winkLid = 0;
    if (rig.wink) {
      const w = t - this.winkAt;
      if (w > 1.5) this.winkAt = t + rnd(2.5, 4.5);
      else if (w > 0) {
        winkLid = w < 0.09 ? w / 0.09 : w < 1.0 ? 1 : 1 - (w - 1.0) / 0.12;
        winkLid = Math.max(0, Math.min(1, winkLid));
        wink =
          w < 0.08
            ? 0
            : w < 0.11
              ? (w - 0.08) / 0.03
              : w < 0.97
                ? 1
                : Math.max(0, 1 - (w - 0.97) / 0.06);
        const tilt = ease(w / 0.18) * (1 - ease((w - 0.95) / 0.35));
        head += (rig.wink[0] < 0.5 ? 1 : -1) * 4.5 * D * tilt;
      }
    }
    const lag =
      (sad ? 0.018 : 0.014) * (0.5 - 0.5 * Math.cos((TAU * (T - 0.35)) / bp));
    const headT: [number, number] = [
      0,
      (sad ? 0.004 : 0) + lag * 0.6 - squash * 0.25,
    ];

    const happyBurst =
      this.mood === "happy" ? bump(t - this.happyAt, 0.15, 2.2) : 0;
    const limbs = (rig.limbs ?? []).map((l, i) => {
      const kind = l[5];
      const side = l[2] < l[0] ? -1 : 1;
      const ph = T - 0.4 - i * 0.45; // arms trail the body
      if (t > (this.gestureAt[i] ?? 0) + 2.2)
        this.gestureAt[i] = t + rnd(2.5, 5.5);
      const ev = t - (this.gestureAt[i] ?? 0);
      // arms also follow through after a hop
      const follow = -squash * 60 * D * side;
      if (kind === "sway") {
        const lift = ev < 0 ? 0 : back(ev / 0.4) * (1 - ease((ev - 1.1) / 0.6));
        return (
          side * 3.5 * D * Math.sin((TAU * ph) / bp) +
          side * 11 * D * lift +
          follow
        );
      }
      if (kind === "wave") {
        const env = Math.max(bump(ev, 0, 1.8), happyBurst);
        return (
          side * 4 * D * Math.sin((TAU * ph) / 1.9) +
          side * 16 * D * env * Math.sin(TAU * 2.3 * Math.max(0, ev)) +
          follow
        );
      }
      if (kind === "hold")
        return 3.2 * D * Math.sin((TAU * ph) / 3.8) + 2 * D * bump(ev, 0, 1.2);
      // tap: runs of quick taps
      const run = bump(ev, 0, 1.6);
      return 6 * D * run * Math.abs(Math.sin(TAU * 3 * ev));
    });
    // scarf tail: overlaps the head and body, flutters
    if (rig.tail)
      limbs.push(
        (rig.tail[2] < rig.tail[0] ? 1 : -1) *
          (6 * D * Math.sin((TAU * (T - 0.8)) / 2.4) +
            2 * D * Math.sin((TAU * T) / 0.9)) +
          head * 0.8 +
          lean * 1.5 -
          squash * 40 * D,
      );

    // blinks: quick, every 2–5 s, sometimes twice
    let lid = 0;
    const b = t - this.blinkAt;
    if (b > 0) {
      lid = b < 0.16 ? Math.sin((Math.PI * b) / 0.16) : 0;
      if (b > 0.16) {
        if (this.blinkTwice || Math.random() > 0.25) {
          this.blinkTwice = false;
          this.blinkAt = t + rnd(2, 5);
        } else {
          this.blinkTwice = true;
          this.blinkAt = t + 0.1;
        }
      }
    }
    lid = Math.min(1, lid * 1.2);
    const L = Math.max(sad ? 0.12 : 0, lid);

    // the bulb: off, fills from the base up, glows with rays, fades
    let bulb: [number, number, number] = [0, 0, 0];
    if (rig.bulb) {
      const c = t - this.bulbAt;
      if (c > 4.4) this.bulbAt = t + 0.5;
      else if (c > 0) {
        const fill = ease(c / 0.9);
        const out = ease((c - 3.5) / 0.6);
        const pulse = 0.85 + 0.15 * Math.sin(TAU * 1.6 * c);
        bulb = [
          fill * (1 - out),
          back((c - 0.85) / 0.35) * (1 - out),
          fill * pulse * (1 - out),
        ];
      }
    }

    // tears: one drop at a time, alternating eyes, rolling and fading
    const tears: [number, number, number][] = [];
    if (rig.tears?.length) {
      const k = (t - this.tearAt) / 1.6;
      if (k > 1) {
        this.tearAt = t + rnd(1.2, 2.6);
        this.tearWhich = (this.tearWhich + 1) % rig.tears.length;
      } else if (k > 0) {
        const fall = ease(k) * 0.08;
        const alpha = Math.min(1, k * 6) * (1 - ease((k - 0.6) / 0.4));
        tears.push([fall, alpha, this.tearWhich]);
      }
    }
    return {
      breath,
      squash,
      lean,
      head,
      headT,
      lift,
      limbs,
      lids: [L, L],
      wink,
      winkLid,
      bulb,
      tears,
    };
  }
}

// ─── instances and the frame loop ──────────────────────────────────────────
interface Inst {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  eyes: () => Eye[];
  mood: () => Mood;
  motion: Motion;
  start: number;
  onFirst: () => void;
  drawn: boolean;
}
const insts = new Set<Inst>();
let raf = 0;

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function draw(i: Inst, now: number) {
  const g = gl!;
  const img = i.img;
  if (!img.complete || !img.naturalWidth) return;
  const rig = RIGS[rigKey(img.currentSrc || img.src)] ?? {};
  const t = (now - i.start) / 1000;
  i.motion.setMood(i.mood(), t);
  const box = i.canvas.getBoundingClientRect();
  if (box.width < 2) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.min(1100, Math.round(box.width * dpr));
  const H = Math.min(1100, Math.round(box.height * dpr));
  if (i.canvas.width !== W || i.canvas.height !== H) {
    i.canvas.width = W;
    i.canvas.height = H;
  }
  if (glCanvas!.width !== W || glCanvas!.height !== H) {
    glCanvas!.width = W;
    glCanvas!.height = H;
  }
  const url = img.currentSrc || img.src;
  const tex = textureFor(url, img);
  if (!tex) return;
  const altTex = rig.wink
    ? textureFor(url.replace("-wink-open", "-wink"))
    : null;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const still = rig.still;
  const pose = i.motion.at(t, rig);
  g.viewport(0, 0, W, H);
  g.clearColor(0, 0, 0, 0);
  g.clear(g.COLOR_BUFFER_BIT);
  g.activeTexture(g.TEXTURE1);
  g.bindTexture(g.TEXTURE_2D, altTex ?? tex);
  g.activeTexture(g.TEXTURE0);
  g.bindTexture(g.TEXTURE_2D, tex);
  g.uniform1i(u("uTex"), 0);
  g.uniform1i(u("uAlt"), 1);
  g.uniform1f(u("uSquash"), still ? 0 : pose.squash);
  g.uniform1f(u("uLean"), still || !rig.n ? 0 : pose.lean);
  const wk = rig.wink;
  g.uniform4f(
    u("uWink"),
    (wk?.[0] ?? 0) * iw,
    (wk?.[1] ?? 0) * ih,
    (wk?.[2] ?? 1) * iw,
    (wk?.[3] ?? 1) * ih,
  );
  g.uniform1f(u("uWinkK"), altTex ? pose.wink : 0);
  const bu = rig.bulb;
  g.uniform4f(
    u("uBulb"),
    (bu?.[0] ?? 0) * iw,
    (bu?.[1] ?? 0) * ih,
    (bu?.[2] ?? 0) * iw,
    pose.bulb[0],
  );
  g.uniform1f(u("uRays"), bu ? pose.bulb[1] : 1);
  g.uniform1f(u("uGlow"), pose.bulb[2]);
  g.uniform2f(u("uImg"), iw, ih);
  g.uniform1f(u("uPad"), PAD);
  g.uniform1f(u("uPx"), iw / (W / (1 + 2 * PAD)));
  g.uniform1f(u("uBreath"), still ? 0 : pose.breath);
  g.uniform1f(u("uFoot"), (rig.foot ?? 1) * ih);
  g.uniform2f(u("uLift"), 0, still ? 0 : -pose.lift * ih);
  const n = rig.n;
  g.uniform2f(u("uN"), (n?.[0] ?? 0.5) * iw, (n?.[1] ?? -1) * ih);
  g.uniform1f(u("uBand"), (rig.band ?? 0.04) * ih);
  g.uniform1f(u("uHead"), still || !n ? 0 : pose.head);
  g.uniform2f(u("uHeadT"), 0, still || !n ? 0 : pose.headT[1] * ih);
  g.uniform2f(u("uHeadC"), (rig.c?.[0] ?? 0) * iw, (rig.c?.[1] ?? 0) * ih);
  g.uniform1f(u("uHeadR"), (rig.R ?? 0) * iw);
  const limbs = [...(rig.limbs ?? [])];
  const L = new Float32Array(MAX_LIMBS * 4);
  const P = new Float32Array(MAX_LIMBS * 3);
  const all: [number, number, number, number, number, boolean][] = limbs.map(
    (l) => [l[0], l[1], l[2], l[3], l[4], l[5] !== "hold"],
  );
  if (rig.tail) all.push([...rig.tail, true]);
  all.slice(0, MAX_LIMBS).forEach((l, k) => {
    L.set([l[0] * iw, l[1] * ih, l[2] * iw, l[3] * ih], k * 4);
    P.set([l[4] * iw, still ? 0 : (pose.limbs[k] ?? 0), l[5] ? 1 : 0], k * 3);
  });
  g.uniform4fv(u("uL"), L);
  g.uniform3fv(u("uLp"), P);
  const eyes = i.eyes();
  const E = new Float32Array(8);
  const F = new Float32Array(6);
  const lids = new Float32Array(2);
  // the eye nearest the wink spot closes for the wink
  const wi = wk
    ? eyes
        .slice(0, 2)
        .reduce(
          (best, e, k, a) =>
            Math.hypot(e.x - wk[0], e.y - wk[1]) <
            Math.hypot(a[best]!.x - wk[0], a[best]!.y - wk[1])
              ? k
              : best,
          0,
        )
    : -1;
  eyes.slice(0, 2).forEach((e, k) => {
    E.set([e.x * iw, e.y * ih, e.rx * iw, e.ry * ih], k * 4);
    F.set(hex(e.fur), k * 3);
    lids[k] = Math.max(pose.lids[k] ?? 0, k === wi ? pose.winkLid : 0);
  });
  g.uniform4fv(u("uEye"), E);
  g.uniform3fv(u("uFur"), F);
  g.uniform1fv(u("uLid"), lids);
  const Tr = new Float32Array(8);
  pose.tears.forEach(([dy, a, which], k) => {
    const at = rig.tears?.[which];
    if (!at || k > 1) return;
    Tr.set([at[0] * iw, (at[1] + dy) * ih, 0.016 * iw, a], k * 4);
  });
  g.uniform4fv(u("uTear"), Tr);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  i.ctx.clearRect(0, 0, W, H);
  i.ctx.drawImage(glCanvas!, 0, 0);
  if (!i.drawn) {
    i.drawn = true;
    i.onFirst();
  }
}

function loop(now: number) {
  if (!document.hidden) for (const i of insts) draw(i, now);
  raf = insts.size ? requestAnimationFrame(loop) : 0;
}

/** The padding (fraction of the art's size) the canvas extends past the image on each side. */
export const PUPPET_PAD = PAD;

/**
 * Start animating `img` into `canvas`. Returns a stop function, or null when
 * WebGL is unavailable (the plain image stays).
 */
export function startPuppet(opts: {
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;
  eyes: () => Eye[];
  mood: () => Mood;
  onFirst: () => void;
}): (() => void) | null {
  if (!ensureGL()) return null;
  const ctx = opts.canvas.getContext("2d");
  if (!ctx) return null;
  const rig = RIGS[rigKey(opts.img.currentSrc || opts.img.src)];
  const inst: Inst = {
    ...opts,
    ctx,
    motion: new Motion(rig?.limbs?.length ?? 0),
    start: performance.now(),
    drawn: false,
  };
  insts.add(inst);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    insts.delete(inst);
  };
}
