// Kitchen foley: recorded clips, except microwave + reject.
// Mix knobs live in constants.js (SOUND). Press M or the music icon to mute the bed (foley stays on).

import { SOUND } from "./constants";

import beamUrl from "./assets/sounds/beam.mp3";
import clinkPlaceUrl from "./assets/sounds/clink-place.wav";
import clinkSoftUrl from "./assets/sounds/clink-soft.wav";
import doorCloseUrl from "./assets/sounds/door-close.wav";
import doorOpenUrl from "./assets/sounds/door-open.wav";
import pickupUrl from "./assets/sounds/pickup.wav";
import dragScrapeUrl from "./assets/sounds/drag-scrape.wav";
import poofUrl from "./assets/sounds/poof.wav";
import pourUrl from "./assets/sounds/pour.wav";
import tunkUrl from "./assets/sounds/tunk.wav";
import warmUrl from "./assets/sounds/warm.wav";

const MUTE_KEY = "the-freezer-muted";

const FOLEY = {
  "door-open": doorOpenUrl,
  "door-close": doorCloseUrl,
  "clink-place": clinkPlaceUrl,
  "clink-soft": clinkSoftUrl,
  pickup: pickupUrl,
  "drag-scrape": dragScrapeUrl,
  tunk: tunkUrl,
  poof: poofUrl,
  pour: pourUrl,
  warm: warmUrl,
};

const CLINK_RATE = {
  dinnerPlate: 1,
  sidePlate: 1.1,
  bowl: 0.9,
  smallBowl: 1.18,
};

let ctx;
let master;
let muted = readMute();
const buffers = {};
let loading;
let bed;
let bedStarting = false;
const BED_KEY = "__theFreezerBed";
const DRAG_KEY = "__theFreezerDrag";
const DRAG_FADE_IN = 0.04;
const DRAG_FADE_OUT = 0.1;
let dragVoice = null;

function readMute() {
  try {
    const v = localStorage.getItem(MUTE_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* private mode */
  }
  return SOUND.muted;
}

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = SOUND.master;
    master.connect(ctx.destination);
    loading = loadFoley(ctx);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

async function loadFoley(context) {
  await Promise.all(
    Object.entries(FOLEY).map(async ([name, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const raw = await res.arrayBuffer();
        buffers[name] = await context.decodeAudioData(raw.slice(0));
      } catch {
        /* clip missing — playClip already no-ops */
      }
    }),
  );
}

function ensureBed() {
  if (bed) return bed;
  const existing = globalThis[BED_KEY];
  if (existing) {
    bed = existing;
    applyBedMute();
    return bed;
  }
  const el = new Audio(beamUrl);
  el.loop = true;
  el.preload = "auto";
  el.playsInline = true;
  globalThis[BED_KEY] = el;
  bed = el;
  applyBedMute();
  return el;
}

function applyBedMute() {
  if (!bed) return;
  bed.muted = muted;
  bed.volume = muted ? 0 : SOUND.music;
}

function bedIsPlaying() {
  return Boolean(bed && !bed.paused);
}

export function startBed() {
  if (muted) {
    if (bed && !bed.paused) bed.pause();
    bedStarting = false;
    return;
  }
  const el = ensureBed();
  el.loop = true;
  applyBedMute();
  if (bedIsPlaying() || bedStarting) return;
  bedStarting = true;
  const pending = el.play();
  if (pending && typeof pending.then === "function") {
    pending.then(() => {
      bedStarting = false;
    }).catch(() => {
      bedStarting = false;
    });
    return;
  }
  bedStarting = false;
}

export function unlockSound() {
  audio();
  startBed();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (muted) playMusicCut();
  else playMusicPlay();
  startBed();
  return muted;
}

function playMusicCut() {
  const context = audio();
  const v = cue("musicCut");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  // Tiny tape-off — only from the mute toggle, never on load.
  tone(context, master, {
    freq: 420,
    slideTo: 160,
    start: now,
    dur: 0.1,
    gain: 0.032 * v,
    attack: 0.006,
    type: "triangle",
  });
}

function playMusicPlay() {
  const context = audio();
  const v = cue("musicPlay");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  // Tiny start chirp — unmute only, not the automatic bed.
  tone(context, master, {
    freq: 312,
    start: now,
    dur: 0.06,
    gain: 0.028 * v,
    attack: 0.008,
    type: "triangle",
  });
  tone(context, master, {
    freq: 392,
    start: now + 0.055,
    dur: 0.1,
    gain: 0.03 * v,
    attack: 0.01,
    type: "triangle",
  });
}

export function playPanelOpen() {
  lastPanelOpenAt = performance.now();
  const context = audio();
  const v = cue("panelOpen");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  tone(context, master, {
    freq: 292,
    start: now,
    dur: 0.05,
    gain: 0.02 * v,
    attack: 0.008,
    type: "triangle",
  });
  tone(context, master, {
    freq: 368,
    start: now + 0.045,
    dur: 0.07,
    gain: 0.022 * v,
    attack: 0.01,
    type: "triangle",
  });
}

export function playPanelClose() {
  const context = audio();
  const v = cue("panelClose");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  tone(context, master, {
    freq: 340,
    slideTo: 210,
    start: now,
    dur: 0.09,
    gain: 0.02 * v,
    attack: 0.006,
    type: "triangle",
  });
}

let lastHoverAt = 0;
let lastPanelOpenAt = 0;

export function playHover() {
  const nowMs = performance.now();
  if (nowMs - lastPanelOpenAt < 140) return;
  if (nowMs - lastHoverAt < 90) return;
  lastHoverAt = nowMs;
  const context = audio();
  const v = cue("hover");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  tone(context, master, {
    freq: 498,
    start: now,
    dur: 0.04,
    gain: 0.015 * v,
    attack: 0.006,
    type: "triangle",
  });
}

function cue(name) {
  return SOUND[name] ?? 1;
}

function jitter(value, amt = 0.04) {
  return value * (1 + (Math.random() * 2 - 1) * amt);
}

function playClip(clip, mix, { rate = 1, gain = 1, vary = 0.03 } = {}) {
  const context = audio();
  const v = cue(mix);
  if (!context || v <= 0) return;
  const start = () => {
    const buf = buffers[clip];
    if (!buf) return;
    const src = context.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = jitter(rate, vary);
    const g = context.createGain();
    g.gain.value = v * gain;
    src.connect(g);
    g.connect(master);
    src.start();
  };
  if (buffers[clip]) start();
  else if (loading) loading.then(start).catch(() => {});
}

export function playClink(type = "dinnerPlate", style = "place") {
  const rate = CLINK_RATE[type] ?? 1;
  if (style === "putAway") {
    playClip("clink-soft", "clink", { rate: rate * 0.96, gain: 0.64, vary: 0.025 });
    return;
  }
  if (style === "nudge") {
    playClip("clink-soft", "clink", { rate: rate * 1.04, gain: 0.48, vary: 0.03 });
    return;
  }
  playClip("clink-place", "clink", { rate, gain: 0.82, vary: 0.02 });
}

export function playDoor(open) {
  playClip(open ? "door-open" : "door-close", "door", {
    rate: open ? jitter(1, 0.02) : jitter(1, 0.02),
    gain: open ? 0.85 : 0.8,
    vary: 0.015,
  });
}

export function playMicroDoor(open) {
  playClip(open ? "door-open" : "door-close", "microDoor", {
    rate: open ? jitter(1.14, 0.02) : jitter(1.1, 0.02),
    gain: open ? 0.72 : 0.7,
    vary: 0.018,
  });
}

export function playMicroSettle() {
  playClip("tunk", "microSettle", { rate: jitter(1.18, 0.03), gain: 0.58, vary: 0.03 });
}

export function playSteamPuff() {
  playClip("poof", "steamPuff", { rate: jitter(0.86, 0.04), gain: 0.48, vary: 0.04 });
}

export function playBurnPuff() {
  playClip("poof", "smokePuff", { rate: jitter(0.72, 0.04), gain: 0.55, vary: 0.04 });
}

export function playBurn() {
  const context = audio();
  const v = cue("burn");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  const dur = 0.62;
  const buf = context.createBuffer(1, Math.floor(context.sampleRate * dur), context.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const t = i / data.length;
    const env = Math.exp(-t * 3.8) * (0.28 + 0.72 * Math.random());
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = context.createBufferSource();
  src.buffer = buf;
  const bp = context.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1640;
  bp.Q.value = 0.7;
  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1200;
  const g = context.createGain();
  g.gain.value = 0.2 * v;
  src.connect(bp);
  bp.connect(lp);
  lp.connect(g);
  g.connect(master);
  src.start(now);
  // Soft descending sigh — rueful, not a sting.
  tone(context, master, {
    freq: 349,
    slideTo: 220,
    start: now + 0.04,
    dur: 0.38,
    gain: 0.035 * v,
    type: "triangle",
  });
}

export function playPickup() {
  playClip("pickup", "pickup", { rate: jitter(1, 0.06), gain: 0.62, vary: 0.05 });
}

function readDragVoice() {
  return dragVoice || globalThis[DRAG_KEY] || null;
}

function writeDragVoice(voice) {
  dragVoice = voice;
  if (voice) globalThis[DRAG_KEY] = voice;
  else delete globalThis[DRAG_KEY];
}

function rampDragGain(gainParam, value, now, seconds) {
  const from = Math.max(0.0001, gainParam.value);
  gainParam.cancelScheduledValues(now);
  gainParam.setValueAtTime(from, now);
  gainParam.exponentialRampToValueAtTime(Math.max(0.0001, value), now + seconds);
}

export function startDragSound() {
  const context = audio();
  const v = cue("drag");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  const existing = readDragVoice();
  if (existing) {
    existing.stopping = false;
    rampDragGain(existing.gain.gain, v, now, DRAG_FADE_IN);
    return;
  }
  const begin = () => {
    if (readDragVoice()) return;
    const buf = buffers["drag-scrape"];
    if (!buf) return;
    const src = context.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(v, context.currentTime + DRAG_FADE_IN);
    src.connect(gain);
    gain.connect(master);
    src.start();
    writeDragVoice({ src, gain, stopping: false });
  };
  if (buffers["drag-scrape"]) begin();
  else if (loading) loading.then(begin).catch(() => {});
}

export function stopDragSound() {
  const voice = readDragVoice();
  if (!voice) return;
  voice.stopping = true;
  const context = ctx;
  const fadeMs = DRAG_FADE_OUT * 1000 + 20;
  if (!context) {
    try { voice.src.stop(); } catch { /* already stopped */ }
    writeDragVoice(null);
    return;
  }
  rampDragGain(voice.gain.gain, 0.0001, context.currentTime, DRAG_FADE_OUT);
  window.setTimeout(() => {
    if (readDragVoice() !== voice || !voice.stopping) return;
    try { voice.src.stop(); } catch { /* already stopped */ }
    try {
      voice.src.disconnect();
      voice.gain.disconnect();
    } catch { /* graph already torn down */ }
    if (readDragVoice() === voice) writeDragVoice(null);
  }, fadeMs);
}

export function playTunk() {
  playClip("tunk", "tunk", { rate: jitter(1, 0.05), gain: 0.82, vary: 0.04 });
}

export function playPoof() {
  playClip("poof", "poof", { rate: jitter(1, 0.05), gain: 0.7, vary: 0.04 });
}

export function playDiscard() {
  playClip("poof", "discard", { rate: jitter(0.76, 0.03), gain: 0.82, vary: 0.03 });
}

export function playWarm() {
  playClip("warm", "warm", { rate: 0.94, gain: 0.6, vary: 0.02 });
}

// Soft pour / plop — for the soup-fill pass. Not called until bowls fill.
export function playPour() {
  playClip("pour", "pour", { rate: jitter(1, 0.03), gain: 0.65, vary: 0.02 });
}

function envGain(context, dest, { start, attack = 0.008, dur, gain }) {
  const g = context.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  g.connect(dest);
  return g;
}

function tone(context, dest, { freq, type = "sine", start, dur, gain = 0.06, attack = 0.012, slideTo }) {
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  const g = envGain(context, dest, { start, attack, dur, gain });
  osc.connect(g);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function playNope() {
  const context = audio();
  const v = cue("nope");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  // Soft two-note wink — not a buzzer. Left as synthesized on purpose.
  tone(context, master, {
    freq: 392,
    start: now,
    dur: 0.09,
    gain: 0.045 * v,
    type: "triangle",
  });
  tone(context, master, {
    freq: 311,
    start: now + 0.09,
    dur: 0.13,
    gain: 0.04 * v,
    type: "triangle",
  });
}

export function playHum(duration = 2.1) {
  const context = audio();
  const v = cue("hum");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.045 * v, now + 0.18);
  env.gain.setValueAtTime(0.045 * v, now + duration - 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  env.connect(master);

  const low = context.createOscillator();
  low.type = "sine";
  low.frequency.value = 118;
  const mid = context.createOscillator();
  mid.type = "triangle";
  mid.frequency.value = 236;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;

  low.connect(filter);
  mid.connect(filter);
  filter.connect(env);

  low.start(now);
  mid.start(now);
  low.stop(now + duration);
  mid.stop(now + duration);
}

export function playDing() {
  const context = audio();
  const v = cue("ding");
  if (!context || v <= 0) return;
  const now = context.currentTime;
  tone(context, master, { freq: 1568, start: now, dur: 0.38, gain: 0.09 * v, type: "sine" });
  tone(context, master, { freq: 1318, start: now + 0.12, dur: 0.55, gain: 0.08 * v, type: "sine" });
}
