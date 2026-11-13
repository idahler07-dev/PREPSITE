/**
 * Willo as a paper puppet, animated on twos-and-ones at 24 fps.
 *
 * One flat illustration, bent by a small rig (rigs.ts): the body breathes up from
 * the ground line, the head turns about the neck, each arm swings about its
 * shoulder, the scarf tail trails behind. Every part blends into its neighbours
 * with a soft seam, so nothing tears or slides apart. Lids are drawn on the bent
 * art, so blinks follow the head. A sad pose can let a single tear roll.
 *
 * Motion is kept small and human: a few degrees at most, eased, with the arms
 * lagging the breath and the head drifting on two slow, unrelated rhythms.
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

const FPS = 24;
const PAD = 0.08; // room around the art for a hand that swings past its edge
const MAX_LIMBS = 4;

const VS = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const FS = `precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uImg, uN, uHeadT, uHeadC, uLift;
uniform float uPad, uBreath, uFoot, uBand, uHead, uHeadR, uPx;
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
void main(){
  vec2 p = ((vUv*(1.0 + 2.0*uPad)) - uPad)*uImg - uLift;
  // breathing: the body rises from the ground line and fills out a little
  float cx = uImg.x*0.5;
  vec2 pb = vec2(cx + (p.x - cx)/(1.0 + 0.35*uBreath), uFoot + (p.y - uFoot)/(1.0 + uBreath));
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
  gl_FragColor = vec4(col.rgb*col.a, col.a);
}`;

// ─── shared GL ──────────────────────────────────────────────────────────────
let gl: WebGLRenderingContext | null = null;
let glCanvas: HTMLCanvasElement | null = null;
let prog: WebGLProgram | null = null;
let failed = false;
const loc: Record<string, WebGLUniformLocation | null> = {};

function ensureGL(): boolean {
  if (gl) return true;
  if (failed) return false;
  try {
    glCanvas = document.createElement("canvas");
    const g = glCanvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });
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

const textures = new WeakMap<
  HTMLImageElement,
  { src: string; tex: WebGLTexture }
>();
function textureFor(img: HTMLImageElement): WebGLTexture | null {
  const g = gl!;
  const have = textures.get(img);
  if (have && have.src === img.currentSrc) return have.tex;
  if (have) g.deleteTexture(have.tex);
  const tex = g.createTexture();
  if (!tex) return null;
  g.bindTexture(g.TEXTURE_2D, tex);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
  textures.set(img, { src: img.currentSrc, tex });
  return tex;
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
  head: number;
  headT: [number, number];
  lift: number;
  limbs: number[];
  lids: [number, number];
  tears: [number, number, number][]; // dy (fraction of height), alpha, which
}

/** The motion for one Willo: slow rhythms plus occasional, unhurried events. */
class Motion {
  phase = Math.random() * 10;
  blinkAt = rnd(0.8, 3);
  blinkTwice = false;
  glanceAt = rnd(3, 7);
  glanceDir = 1;
  gestureAt: number[] = [];
  tearAt = rnd(0.6, 1.6);
  tearWhich = 0;
  hopAt = -10;
  mood: Mood = "idle";

  constructor(limbs: number) {
    for (let i = 0; i < limbs; i++) this.gestureAt.push(rnd(2, 6) + i * 1.7);
  }

  setMood(m: Mood, t: number) {
    if (m === "happy" && this.mood !== "happy") this.hopAt = t;
    this.mood = m;
  }

  at(t: number, rig: Rig): Pose {
    const sad = this.mood === "cry" || !!rig.tears;
    const T = t + this.phase;
    // breathing: in and out over ~3.6 s (slower and a touch deeper when sad)
    const bp = sad ? 4.4 : 3.6;
    let breath =
      (sad ? 0.012 : 0.009) * (0.5 - 0.5 * Math.cos((2 * Math.PI * T) / bp));
    // a sniffle when sad: two small catches in the breath
    if (sad) {
      const s = T % 4.6;
      breath += 0.006 * (bump(s, 2.0, 0.22) + bump(s, 2.3, 0.22));
    }
    // head: two slow unrelated drifts, plus a glance (a gentle tilt held, then back)
    let head =
      (sad ? 0.9 : 1.3) * D * Math.sin((2 * Math.PI * T) / 5.3) +
      0.6 * D * Math.sin((2 * Math.PI * T) / 2.9 + 1.1);
    if (t > this.glanceAt + 2.4) {
      this.glanceAt = t + rnd(4, 9);
      this.glanceDir = Math.random() < 0.5 ? -1 : 1;
    }
    const g =
      ease((t - this.glanceAt) / 0.5) *
      (1 - ease((t - this.glanceAt - 1.5) / 0.6));
    head += this.glanceDir * 2.6 * D * g;
    // the head trails the breath a little, nodding with it
    const lag =
      (sad ? 0.012 : 0.009) *
      (0.5 - 0.5 * Math.cos((2 * Math.PI * (T - 0.3)) / bp));
    const headT: [number, number] = [0, (sad ? 0.003 : 0) + lag * 0.35];
    // a small hop when he turns happy (once, no squash)
    const lift =
      0.035 *
      Math.sin(Math.PI * Math.min(1, Math.max(0, (t - this.hopAt) / 0.42)));

    const limbs = (rig.limbs ?? []).map((l, i) => {
      const kind = l[5];
      const side = l[2] < l[0] ? -1 : 1;
      const ph = T - 0.35 - i * 0.4;
      if (t > (this.gestureAt[i] ?? 0) + 2) this.gestureAt[i] = t + rnd(5, 10);
      const ev = t - (this.gestureAt[i] ?? 0);
      if (kind === "sway") {
        // hangs with the breath, now and then shifts out a little and settles
        return (
          side * 2.2 * D * Math.sin((2 * Math.PI * ph) / bp) +
          side * 4.5 * D * bump(ev, 0, 1.6)
        );
      }
      if (kind === "wave") {
        const burst =
          this.mood === "happy" ? bump(t - this.hopAt, 0.1, 1.8) : 0;
        const env = Math.max(bump(ev, 0, 1.6), burst);
        return (
          side * 2 * D * Math.sin((2 * Math.PI * ph) / 1.9) +
          side * 6 * D * env * Math.sin(2 * Math.PI * 2.2 * ev)
        );
      }
      if (kind === "hold") return 1.4 * D * Math.sin((2 * Math.PI * ph) / 4.2);
      // tap: short runs of light taps
      const run = bump(ev, 0, 1.4);
      return 3 * D * run * Math.abs(Math.sin(2 * Math.PI * 2.6 * ev));
    });

    // scarf tail: trails the head and breath
    if (rig.tail)
      limbs.push(
        (rig.tail[2] < rig.tail[0] ? 1 : -1) *
          3 *
          D *
          Math.sin((2 * Math.PI * (T - 0.7)) / 2.6) +
          head * 0.5,
      );

    // blinks: ~0.2 s, every 2.5–6 s, sometimes twice
    let lid = 0;
    const b = t - this.blinkAt;
    if (b > 0) {
      lid = b < 0.21 ? Math.sin((Math.PI * b) / 0.21) : 0;
      if (b > 0.21) {
        if (this.blinkTwice || Math.random() > 0.2) {
          this.blinkTwice = false;
          this.blinkAt = t + rnd(2.5, 6);
        } else {
          this.blinkTwice = true;
          this.blinkAt = t + 0.12;
        }
      }
    }
    lid = Math.min(1, lid * 1.15);
    // sad: lids a touch lower all the time
    const rest = sad ? 0.12 : 0;
    const L = Math.max(rest, lid);

    // tears: one drop at a time, alternating eyes, rolling slowly and fading
    const tears: [number, number, number][] = [];
    if (rig.tears?.length) {
      const k = (t - this.tearAt) / 1.7;
      if (k > 1) {
        this.tearAt = t + rnd(1.6, 3.2);
        this.tearWhich = (this.tearWhich + 1) % rig.tears.length;
      } else if (k > 0) {
        const fall = ease(k) * 0.07;
        const alpha = Math.min(1, k * 6) * (1 - ease((k - 0.6) / 0.4));
        tears.push([fall, alpha, this.tearWhich]);
      }
    }
    return { breath, head, headT, lift, limbs, lids: [L, L], tears };
  }
}

// ─── instances and the 24 fps loop ──────────────────────────────────────────
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
let lastFrame = -1;

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
  const tex = textureFor(img);
  if (!tex) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const still = rig.still;
  const pose = i.motion.at(t, rig);
  g.viewport(0, 0, W, H);
  g.clearColor(0, 0, 0, 0);
  g.clear(g.COLOR_BUFFER_BIT);
  g.bindTexture(g.TEXTURE_2D, tex);
  g.uniform1i(u("uTex"), 0);
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
  eyes.slice(0, 2).forEach((e, k) => {
    E.set([e.x * iw, e.y * ih, e.rx * iw, e.ry * ih], k * 4);
    F.set(hex(e.fur), k * 3);
    lids[k] = pose.lids[k] ?? 0;
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
  const frame = Math.floor(now / (1000 / FPS));
  if (frame !== lastFrame && !document.hidden) {
    lastFrame = frame;
    // time is held on whole frames, like stop-motion
    const held = frame * (1000 / FPS);
    for (const i of insts) draw(i, held);
  }
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
