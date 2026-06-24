// Lightweight sound effects generated with the Web Audio API.
// No audio files to host — everything is synthesized on the fly,
// and respects the user's "Sound alerts" preference in Settings.

const PREF_KEY = 'cqm.soundEnabled';

export function isSoundEnabled() {
  const v = localStorage.getItem(PREF_KEY);
  return v === null ? true : v === 'true';
}

export function setSoundEnabled(enabled) {
  localStorage.setItem(PREF_KEY, String(enabled));
}

let _ctx = null;
function getCtx() {
  if (!_ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    _ctx = new AudioCtx();
  }
  // Browsers suspend audio contexts until a user gesture; resume defensively.
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

function tone(ctx, { freq, start, duration, type = 'sine', gain = 0.18 }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g);
  g.connect(ctx.destination);

  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Pleasant two-note chime — used for general notifications. */
export function playChime() {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { freq: 660, start: 0, duration: 0.25 });
  tone(ctx, { freq: 880, start: 0.12, duration: 0.3 });
}

/** Louder, more attention-grabbing triple chime — used when a patient is called. */
export function playCallAlert() {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { freq: 523.25, start: 0, duration: 0.22, gain: 0.22 });
  tone(ctx, { freq: 659.25, start: 0.18, duration: 0.22, gain: 0.22 });
  tone(ctx, { freq: 783.99, start: 0.36, duration: 0.4, gain: 0.24 });
}

/** Soft single blip — used for incoming chat messages. */
export function playMessageBlip() {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { freq: 740, start: 0, duration: 0.12, gain: 0.14, type: 'triangle' });
}
