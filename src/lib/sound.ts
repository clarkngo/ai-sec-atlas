import { readFlag } from './urlState';

/**
 * Small UI sounds synthesized with the Web Audio API (no audio files).
 * Kept quiet and short; muting is remembered per browser.
 */
export type SoundName = 'select' | 'open' | 'close' | 'step' | 'success' | 'switch' | 'toggle';

const MUTE_KEY = 'atlas.muted';

let ctx: AudioContext | null = null;
let muted = readFlag(MUTE_KEY);
const listeners = new Set<(m: boolean) => void>();

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(next));
}

export function onMuteChange(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** One enveloped oscillator note. `at` is seconds from now. */
function tone(ac: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function play(name: SoundName) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  switch (name) {
    case 'select':
      tone(ac, 880, 0, 0.07, 0.05, 'triangle');
      break;
    case 'open':
      tone(ac, 520, 0, 0.12, 0.04, 'sine', 780);
      break;
    case 'close':
      tone(ac, 640, 0, 0.1, 0.035, 'sine', 420);
      break;
    case 'step':
      tone(ac, 660, 0, 0.08, 0.045, 'triangle');
      tone(ac, 990, 0.06, 0.1, 0.04, 'triangle');
      break;
    case 'success':
      tone(ac, 784, 0, 0.1, 0.045, 'sine');
      tone(ac, 1047, 0.08, 0.1, 0.045, 'sine');
      tone(ac, 1319, 0.16, 0.16, 0.04, 'sine');
      break;
    case 'switch':
      tone(ac, 300, 0, 0.09, 0.035, 'sine', 600);
      break;
    case 'toggle':
      tone(ac, 1200, 0, 0.04, 0.04, 'square');
      break;
  }
}
