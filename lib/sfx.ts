'use client';

import { storage } from './storage';

let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

// Unlock context on first user gesture (required by browsers)
export function unlockAudio() {
  if (unlocked) return;
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  unlocked = true;
}

type Voice = {
  type: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  durationMs: number;
  attackMs?: number;
  decayMs?: number;
  sustain?: number;   // 0..1
  peakGain?: number;  // 0..1
};

export type SfxName = 'latch' | 'traverse' | 'complete' | 'win' | 'fail' | 'undo' | 'invalid';

const VOICES: Record<SfxName, Voice | Voice[]> = {
  latch: { type: 'sine', freqStart: 220, freqEnd: 180, durationMs: 180, attackMs: 5, decayMs: 160, peakGain: 0.5 },
  traverse: { type: 'sine', freqStart: 440, freqEnd: 660, durationMs: 100, attackMs: 4, decayMs: 90, peakGain: 0.4 },
  complete: { type: 'triangle', freqStart: 660, freqEnd: 880, durationMs: 140, attackMs: 3, decayMs: 130, peakGain: 0.5 },
  win: [
    { type: 'sine', freqStart: 523, durationMs: 400, attackMs: 10, decayMs: 380, peakGain: 0.3 },      // C5
    { type: 'sine', freqStart: 659, durationMs: 400, attackMs: 80, decayMs: 320, peakGain: 0.3 },      // E5
    { type: 'sine', freqStart: 784, durationMs: 400, attackMs: 160, decayMs: 240, peakGain: 0.3 },     // G5
  ],
  fail: { type: 'triangle', freqStart: 220, freqEnd: 140, durationMs: 350, attackMs: 5, decayMs: 340, peakGain: 0.45 },
  undo: { type: 'sine', freqStart: 660, freqEnd: 440, durationMs: 110, attackMs: 3, decayMs: 100, peakGain: 0.35 },
  invalid: { type: 'square', freqStart: 110, durationMs: 80, attackMs: 2, decayMs: 70, peakGain: 0.2 },
};

function playVoice(c: AudioContext, v: Voice, userVolume: number, startAt = 0) {
  const t0 = c.currentTime + startAt;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = v.type;
  osc.frequency.setValueAtTime(v.freqStart, t0);
  if (v.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(v.freqEnd, t0 + v.durationMs / 1000);

  const peak = (v.peakGain ?? 0.4) * userVolume;
  const attack = (v.attackMs ?? 5) / 1000;
  const decay = (v.decayMs ?? v.durationMs - (v.attackMs ?? 5)) / 1000;

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay);

  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + v.durationMs / 1000 + 0.02);
}

export function playSfx(name: SfxName) {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const audio = storage.getAudio();
  if (audio.sfxMuted) return;
  const vol = audio.sfx;
  const voice = VOICES[name];
  if (Array.isArray(voice)) {
    voice.forEach((v, i) => playVoice(c, v, vol, i * 0.06));
  } else {
    playVoice(c, voice, vol, 0);
  }
}
