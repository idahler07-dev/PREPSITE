"use client";

import { useSyncExternalStore } from "react";

/*
 * Sound effects: short, soft tones made with the Web Audio API (no files to
 * load or license). Off with one switch (Settings, or the speaker in a drill);
 * the choice is kept per device in localStorage. Never plays in silence-by-
 * default contexts: it needs a tap first, which every effect here follows.
 */

const KEY = "satify:sfx";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Whether sound effects are on (on by default; the server render assumes on). */
export function useSfxEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

let ctx: AudioContext | null = null;

interface Note {
  freq: number;
  at: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
  glideTo?: number;
}

const SOUNDS = {
  /** Two rising notes, like a soft chime. */
  correct: [
    { freq: 659.25, at: 0, dur: 0.22, gain: 0.12 },
    { freq: 987.77, at: 0.09, dur: 0.3, gain: 0.12 },
  ],
  /** One low, gentle note sliding down a little: "not quite", not an alarm. */
  incorrect: [{ freq: 293.66, glideTo: 261.63, at: 0, dur: 0.28, gain: 0.1, type: "triangle" }],
  /** A very quiet tick when an answer is picked. */
  select: [{ freq: 1318.5, at: 0, dur: 0.05, gain: 0.035 }],
  /** Three rising notes for finishing a set. */
  done: [
    { freq: 523.25, at: 0, dur: 0.2, gain: 0.11 },
    { freq: 659.25, at: 0.09, dur: 0.2, gain: 0.11 },
    { freq: 783.99, at: 0.18, dur: 0.34, gain: 0.11 },
  ],
} satisfies Record<string, Note[]>;

export type Sfx = keyof typeof SOUNDS;

export function playSfx(name: Sfx) {
  if (typeof window === "undefined" || !read()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const n of SOUNDS[name] as Note[]) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, t0 + n.at);
      if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(n.glideTo, t0 + n.at + n.dur);
      amp.gain.setValueAtTime(0.0001, t0 + n.at);
      amp.gain.exponentialRampToValueAtTime(n.gain, t0 + n.at + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t0 + n.at);
      osc.stop(t0 + n.at + n.dur + 0.02);
    }
  } catch {
    // Sound is a nicety; never break a drill over it.
  }
}
