/**
 * Willo's warp rig: region masks (public/mascot/rig) + a small WebGL shader that
 * moves each region of the flat artwork with its own physics, and a sim that
 * drives it. One shared GL context renders every Willo on the page.
 *
 * Regions per pose (built by scripts/willo-rig.py from the art):
 *   head (with antlers, ears), antlers, ears, scarf tail, raised arm, a held
 *   item (heart, cup, bulb), accent ticks, and the pupils.
 */

type V2 = [number, number];
export interface RigMeta {
  w: number;
  h: number;
  still?: boolean;
  c?: V2;
  R?: number;
  n?: V2;
  right?: V2;
  down?: V2;
  eyes?: { c: V2; r: number; open: boolean }[];
  ears?: { c: V2; p: V2 }[];
  arm?: { s: V2; p: V2; w: number } | null;
  item?: { mode: "pulse" | "sway" | "bob"; c: V2; pivot?: V2 } | null;
  ticks?: boolean;
  scarf?: boolean;
}
export interface Frame {
  breath: number;
  head: number;
  headT: V2;
  ant: V2;
  ear: V2;
  gaze: V2;
  scarfAmp: number;
  scarfPhase: number;
  armRot: number;
  itemV: number;
  tick: number;
  globalT: V2;
  eyes: V2[];
}
export interface Asset {
  meta: RigMeta;
  tex: WebGLTexture;
  m1: WebGLTexture;
  m2: WebGLTexture;
}

const VS = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const FS = `precision highp float;
varying vec2 vUv;
uniform sampler2D uTex, uM1, uM2;
uniform vec2 uSize, uGlobalT, uFeet, uC, uN, uRight, uDown, uHeadT, uAnt, uEar, uGaze, uItemC, uItemP;
uniform float uR, uBreath, uHead, uHasEars, uScarfAmp, uScarfPhase, uArmW, uArmRot, uItemMode, uItemV, uTick;
uniform vec4 uEars, uEarP, uEyeA, uEyeB, uArm;
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
void main(){
  vec2 p = vUv*uSize - uGlobalT;
  vec2 uvm = p/uSize;
  vec3 m1 = texture2D(uM1, uvm).rgb;
  vec3 m2 = texture2D(uM2, uvm).rgb;
  vec2 q = p;
  q = uFeet + (q - uFeet)/(1.0 + uBreath);
  // head block: rotate about the neck, then lift
  q = mix(q, uN + rot(q - uHeadT - uN, -uHead), m1.r);
  // antlers, each side about the skull
  float l = dot(p - uC, uRight);
  float side = l < 0.0 ? -1.0 : 1.0;
  vec2 pa = uC + uRight*(side*0.55*uR) + uDown*(-0.70*uR);
  q = mix(q, pa + rot(q - pa, -(side < 0.0 ? uAnt.x : uAnt.y)), m1.g);
  // ears: nearest ear, about its base
  if (uHasEars > 0.5) {
    bool isL = length(p - uEars.xy) < length(p - uEars.zw);
    vec2 pe = isL ? uEarP.xy : uEarP.zw;
    q = mix(q, pe + rot(q - pe, -(isL ? -uEar.x : uEar.y)), m1.b);
  }
  // scarf tail: a travelling wave that grows away from the neck
  float dn = length(p - uN);
  float amp = uScarfAmp * m2.r * smoothstep(0.7*uR, 1.9*uR, dn);
  float ph = dn*0.03 - uScarfPhase;
  q += vec2(0.35*amp*cos(ph + 1.2), amp*sin(ph));
  // accent ticks flick outward
  q -= normalize(p - uC + vec2(0.001)) * uTick * m2.b;
  // held item
  if (uItemMode > 0.5 && uItemMode < 1.5) q = mix(q, uItemC + (q - uItemC)/(1.0 + uItemV), m2.g);
  else if (uItemMode > 1.5 && uItemMode < 2.5) q = mix(q, uItemP + rot(q - uItemP, -uItemV), m2.g);
  else if (uItemMode > 2.5) q.y -= uItemV*m2.g;
  // raised arm about the shoulder
  if (uArmW > 0.0) {
    vec2 S = uArm.xy, P = uArm.zw, sp = P - S;
    float t = clamp(dot(p - S, sp)/dot(sp, sp), 0.0, 1.0);
    float d = length(p - (S + sp*t));
    float wa = (1.0 - smoothstep(uArmW*0.75, uArmW*1.5, d)) * smoothstep(0.12, 0.6, t);
    q = mix(q, S + rot(q - S, -uArmRot), wa);
  }
  // pupils
  if (uEyeA.w > 0.5) q -= uGaze * (1.0 - smoothstep(uEyeA.z*0.85, uEyeA.z*1.3, length(p - uEyeA.xy)));
  if (uEyeB.w > 0.5) q -= uGaze * (1.0 - smoothstep(uEyeB.z*0.85, uEyeB.z*1.3, length(p - uEyeB.xy)));
  gl_FragColor = texture2D(uTex, clamp(q/uSize, 0.0, 1.0));
}`;

let gl: WebGLRenderingContext | null = null;
let prog: WebGLProgram | null = null;
let glCanvas: HTMLCanvasElement | null = null;
let failed = false;
const locs: Record<string, WebGLUniformLocation | null> = {};
let zeroTex: WebGLTexture | null = null;

function ensureGL(): boolean {
  if (gl) return true;
  if (failed || typeof document === "undefined") return false;
  try {
    glCanvas = document.createElement("canvas");
    const ctx = glCanvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!ctx) throw new Error("no webgl");
    const mk = (type: number, src: string) => {
      const s = ctx.createShader(type)!;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const p = ctx.createProgram()!;
    ctx.attachShader(p, mk(ctx.VERTEX_SHADER, VS));
    ctx.attachShader(p, mk(ctx.FRAGMENT_SHADER, FS));
    ctx.linkProgram(p);
    if (!ctx.getProgramParameter(p, ctx.LINK_STATUS)) throw new Error("link");
    ctx.useProgram(p);
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
    const a = ctx.getAttribLocation(p, "aPos");
    ctx.enableVertexAttribArray(a);
    ctx.vertexAttribPointer(a, 2, ctx.FLOAT, false, 0, 0);
    gl = ctx;
    prog = p;
    zeroTex = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, zeroTex);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, 1, 1, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    return true;
  } catch {
    failed = true;
    gl = null;
    return false;
  }
}

function texture(img: TexImageSource, premultiply: boolean): WebGLTexture {
  const g = gl!;
  const t = g.createTexture()!;
  g.bindTexture(g.TEXTURE_2D, t);
  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  return t;
}

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

const assets = new Map<string, Promise<Asset | null>>();
export function loadPose(pose: string): Promise<Asset | null> {
  let p = assets.get(pose);
  if (!p) {
    p = (async () => {
      if (!ensureGL()) return null;
      try {
        const meta = (await (await fetch(`/mascot/rig/${pose}.json`)).json()) as RigMeta;
        const main = await image(`/mascot/deer-${pose}.webp`);
        const tex = texture(main, true);
        if (meta.still) return { meta, tex, m1: zeroTex!, m2: zeroTex! };
        const [a, b] = await Promise.all([image(`/mascot/rig/${pose}-m1.png`), image(`/mascot/rig/${pose}-m2.png`)]);
        return { meta, tex, m1: texture(a, false), m2: texture(b, false) };
      } catch {
        return null;
      }
    })();
    assets.set(pose, p);
  }
  return p;
}

const U = (n: string) => (locs[n] ??= gl!.getUniformLocation(prog!, n));
const bind = (unit: number, t: WebGLTexture, name: string) => {
  gl!.activeTexture(gl!.TEXTURE0 + unit);
  gl!.bindTexture(gl!.TEXTURE_2D, t);
  gl!.uniform1i(U(name), unit);
};

/** Render one frame; returns the shared canvas (valid until the next call). */
export function renderPose(a: Asset, f: Frame): HTMLCanvasElement {
  const g = gl!;
  const m = a.meta;
  if (glCanvas!.width !== m.w || glCanvas!.height !== m.h) {
    glCanvas!.width = m.w;
    glCanvas!.height = m.h;
  }
  g.viewport(0, 0, m.w, m.h);
  g.clearColor(0, 0, 0, 0);
  g.clear(g.COLOR_BUFFER_BIT);
  bind(0, a.tex, "uTex");
  bind(1, a.m1, "uM1");
  bind(2, a.m2, "uM2");
  const v2 = (n: string, x: number, y: number) => g.uniform2f(U(n), x, y);
  const f1 = (n: string, x: number) => g.uniform1f(U(n), x);
  v2("uSize", m.w, m.h);
  v2("uGlobalT", f.globalT[0], f.globalT[1]);
  v2("uFeet", m.w / 2, m.h * 0.98);
  f1("uBreath", f.breath);
  const c = m.c ?? [0, 0];
  const n = m.n ?? [0, 0];
  v2("uC", c[0], c[1]);
  v2("uN", n[0], n[1]);
  v2("uRight", (m.right ?? [1, 0])[0], (m.right ?? [1, 0])[1]);
  v2("uDown", (m.down ?? [0, 1])[0], (m.down ?? [0, 1])[1]);
  f1("uR", m.R ?? 1);
  f1("uHead", f.head);
  v2("uHeadT", f.headT[0], f.headT[1]);
  v2("uAnt", f.ant[0], f.ant[1]);
  v2("uEar", f.ear[0], f.ear[1]);
  const ears = m.ears ?? [];
  const eL = ears[0];
  const eR = ears[1] ?? ears[0];
  f1("uHasEars", ears.length ? 1 : 0);
  g.uniform4f(U("uEars"), eL?.c[0] ?? 0, eL?.c[1] ?? 0, eR?.c[0] ?? 0, eR?.c[1] ?? 0);
  g.uniform4f(U("uEarP"), eL?.p[0] ?? 0, eL?.p[1] ?? 0, eR?.p[0] ?? 0, eR?.p[1] ?? 0);
  f1("uScarfAmp", m.scarf ? f.scarfAmp : 0);
  f1("uScarfPhase", f.scarfPhase);
  f1("uTick", m.ticks ? f.tick : 0);
  const arm = m.arm;
  g.uniform4f(U("uArm"), arm?.s[0] ?? 0, arm?.s[1] ?? 0, arm?.p[0] ?? 0, arm?.p[1] ?? 0);
  f1("uArmW", arm?.w ?? 0);
  f1("uArmRot", f.armRot);
  const item = m.item;
  f1("uItemMode", item ? (item.mode === "pulse" ? 1 : item.mode === "sway" ? 2 : 3) : 0);
  v2("uItemC", item?.c[0] ?? 0, item?.c[1] ?? 0);
  v2("uItemP", item?.pivot?.[0] ?? item?.c[0] ?? 0, item?.pivot?.[1] ?? item?.c[1] ?? 0);
  f1("uItemV", f.itemV);
  v2("uGaze", f.gaze[0], f.gaze[1]);
  const eo = m.eyes ?? [];
  const eye = (i: number) => (eo[i]?.open && f.eyes[i] ? ([f.eyes[i]![0], f.eyes[i]![1], eo[i]!.r, 1] as const) : ([0, 0, 1, 0] as const));
  const A = eye(0);
  const B = eye(1);
  g.uniform4f(U("uEyeA"), A[0], A[1], A[2], A[3]);
  g.uniform4f(U("uEyeB"), B[0], B[1], B[2], B[3]);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return glCanvas!;
}

// ─── Sim ────────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
function spring(x: number, v: number, target: number, k: number, c: number, dt: number): [number, number] {
  v += (k * (target - x) - c * v) * dt;
  return [x + v * dt, v];
}

export interface Pointer {
  dx: number;
  dy: number;
}
export interface SimOut {
  frame: Frame;
  blink: number;
  hop: number;
}

/**
 * Idle life for one Willo (masterplan §7): small amplitudes, slow timing, long
 * pauses. Breathing, a slow head drift with a rare glance, calm eyes that follow
 * the pointer, an occasional ear flick, a low scarf wave, one hop on arrival
 * for celebration poses.
 */
export class Sim {
  t = Math.random() * 10;
  head = 2 * RAD * (Math.random() < 0.5 ? -1 : 1); // a small settle on arrival
  headV = 0;
  ant: V2 = [0, 0];
  antV: V2 = [0, 0];
  ear: V2 = [0, 0];
  earV: V2 = [0, 0];
  gaze: V2 = [0, 0];
  gazeV: V2 = [0, 0];
  gTarget: V2 = [0, 0];
  nextLook = rnd(2, 4);
  cur = -1;
  nextCur = rnd(6, 11);
  curDir = 1;
  nextEar = rnd(4, 9);
  wave = -1;
  nextWave = rnd(5, 9);
  blinkNext = rnd(1.2, 3);
  blink = -1;
  hop = -1;
  nextHop = 0.45;
  hopped = false;
  scarfPhase = Math.random() * 6;
  scarfAmp = 1.6;

  constructor(
    private meta: RigMeta,
    private pose: string,
  ) {}

  step(dt: number, ptr: Pointer | null): SimOut {
    const m = this.meta;
    const steps = 2;
    for (let i = 0; i < steps; i++) this.sub(dt / steps, ptr);
    this.t += dt;
    const t = this.t;

    // events
    this.nextCur -= dt;
    if (this.nextCur <= 0 && this.cur < 0) {
      this.cur = 0;
      this.curDir = Math.random() < 0.5 ? -1 : 1;
      this.nextCur = rnd(8, 14);
    }
    if (this.cur >= 0) {
      this.cur += dt;
      if (this.cur > 2.6) this.cur = -1;
    }
    this.nextEar -= dt;
    if (this.nextEar <= 0) {
      const a = Math.random() < 0.5 ? 0 : 1;
      this.earV[a] = (this.earV[a] ?? 0) + rnd(1.3, 1.9);
      this.nextEar = rnd(6, 12);
    }
    this.nextWave -= dt;
    if (this.nextWave <= 0 && this.wave < 0) {
      this.wave = 0;
      this.nextWave = rnd(8, 13);
    }
    if (this.wave >= 0) {
      this.wave += dt;
      if (this.wave > 2.4) this.wave = -1;
    }
    this.blinkNext -= dt;
    if (this.blinkNext <= 0 && this.blink < 0) {
      this.blink = 0;
      this.blinkNext = rnd(3, 6);
      if (Math.random() < 0.12) this.blinkNext = 0.36;
    }
    let blink = 0;
    if (this.blink >= 0) {
      this.blink += dt;
      blink = Math.sin(Math.PI * clamp(this.blink / 0.15, 0, 1));
      if (this.blink > 0.15) this.blink = -1;
    }
    const hopper = this.pose === "cheer" || this.pose === "jump" || this.pose === "trophy";
    let hopY = 0;
    let hopU = 0;
    if (hopper) {
      this.nextHop -= dt;
      // One small hop when the celebration pose arrives; no looping bounce.
      if (this.nextHop <= 0 && this.hop < 0 && !this.hopped) {
        this.hop = 0;
        this.hopped = true;
      }
      if (this.hop >= 0) {
        this.hop += dt;
        const dur = 0.62;
        hopU = clamp(this.hop / dur, 0, 1);
        hopY = -(this.pose === "jump" ? 12 : 9) * 4 * hopU * (1 - hopU);
        if (this.hop > dur) this.hop = -1;
      }
    }

    const breathe = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 5);
    const sleepy = m.still;
    const headT: V2 = [0.5 * Math.sin(t * 0.5), -1.1 * breathe + (this.cur >= 0 ? -0.8 * Math.sin(Math.PI * clamp(this.cur / 2.6, 0, 1)) : 0)];

    // arm
    let armRot = 0;
    if (m.arm) {
      armRot = 0.9 * RAD * Math.sin(t * 0.6);
      if (this.wave >= 0) armRot += 5.5 * RAD * Math.exp(-this.wave / 0.9) * Math.sin(2 * Math.PI * 1.7 * this.wave);
    }
    // item
    let itemV = 0;
    if (m.item?.mode === "pulse") {
      const c = (t % 1.7) / 1.7;
      itemV = 0.024 * (Math.exp(-(((c - 0.1) / 0.06) ** 2)) + 0.7 * Math.exp(-(((c - 0.3) / 0.07) ** 2)));
    } else if (m.item?.mode === "sway") itemV = 1.6 * RAD * Math.sin(t * 0.9);
    else if (m.item?.mode === "bob") itemV = 2.4 * Math.sin(t * 1.1);
    const tick = 3 * Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 6.5), 10);

    this.scarfPhase += dt * (1.4 + this.scarfAmp * 0.1);
    const target = 1.6 + Math.min(5, Math.abs(this.headV) * 30);
    this.scarfAmp += (target - this.scarfAmp) * Math.min(1, dt * 4);

    const N = m.n ?? [0, 0];
    const rotPt = (p: V2): V2 => {
      const dx = p[0] - N[0];
      const dy = p[1] - N[1];
      const c = Math.cos(this.head);
      const s = Math.sin(this.head);
      return [N[0] + c * dx - s * dy + headT[0], N[1] + s * dx + c * dy + headT[1]];
    };
    const eyes = (m.eyes ?? []).map((e) => rotPt(e.c));

    const frame: Frame = {
      breath: sleepy ? 0.011 * breathe : 0.0055 * breathe,
      head: sleepy ? 0 : this.head,
      headT: sleepy ? [0, 0] : headT,
      ant: [clamp(this.ant[0] - this.head, -0.14, 0.14), clamp(this.ant[1] - this.head, -0.14, 0.14)],
      ear: [clamp(this.ear[0], -0.35, 0.35), clamp(this.ear[1], -0.35, 0.35)],
      gaze: [this.gaze[0] * 3.2, this.gaze[1] * 2.6],
      scarfAmp: this.scarfAmp,
      scarfPhase: this.scarfPhase,
      armRot,
      itemV,
      tick,
      globalT: [0, hopY],
      eyes,
    };
    return { frame, blink, hop: hopU };
  }

  private sub(dt: number, ptr: Pointer | null) {
    const t = this.t;
    // head target: slow drift + curiosity + pointer
    let target = (0.8 * Math.sin(t * 0.4) + 0.3 * Math.sin(t * 0.93 + 1.7)) * RAD;
    if (this.cur >= 0) target += this.curDir * 2.2 * RAD * Math.pow(Math.sin(Math.PI * clamp(this.cur / 2.6, 0, 1)), 2);
    if (ptr) target += ptr.dx * 2.6 * RAD;
    [this.head, this.headV] = spring(this.head, this.headV, target, 26, 9, dt);
    // antlers lag the head
    [this.ant[0], this.antV[0]] = spring(this.ant[0], this.antV[0], this.head, 40, 6, dt);
    [this.ant[1], this.antV[1]] = spring(this.ant[1], this.antV[1], this.head, 46, 6.4, dt);
    // ears settle after flicks
    [this.ear[0], this.earV[0]] = spring(this.ear[0], this.earV[0], 0.012 * Math.sin(t * 1.1), 130, 8, dt);
    [this.ear[1], this.earV[1]] = spring(this.ear[1], this.earV[1], 0.012 * Math.sin(t * 1.3 + 1), 130, 8, dt);
    // gaze: saccades, looks with the head, follows the pointer
    this.nextLook -= dt;
    if (this.nextLook <= 0) {
      this.nextLook = rnd(3, 6.5);
      this.gTarget = Math.random() < 0.65 ? [0, 0] : [rnd(-0.7, 0.7), rnd(-0.3, 0.5)];
    }
    let gt: V2 = this.gTarget;
    if (this.cur >= 0) gt = [this.curDir * 0.9, -0.2];
    if (ptr) gt = [clamp(ptr.dx * 1.1, -1, 1), clamp(ptr.dy * 0.9, -1, 1)];
    [this.gaze[0], this.gazeV[0]] = spring(this.gaze[0], this.gazeV[0], gt[0], 160, 22, dt);
    [this.gaze[1], this.gazeV[1]] = spring(this.gaze[1], this.gazeV[1], gt[1], 160, 22, dt);
  }
}
