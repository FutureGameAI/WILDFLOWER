let ac, master, musicGain, sfxGain, music, pad, bass, loop, drumLoop;
let musicOn = false;
let unlocked = false;
let pendingMode = 'calm';
let sfxEnabled = true;
let musicEnabled = true;

function ctx() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.85;
    master.connect(ac.destination);
    sfxGain = ac.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(master);
    musicGain = ac.createGain();
    musicGain.gain.value = 1;
    musicGain.connect(master);
  }
  return ac;
}

export function setSfxEnabled(on) {
  sfxEnabled = on;
  if (sfxGain) sfxGain.gain.value = on ? 1 : 0;
}

export function setMusicEnabled(on) {
  musicEnabled = on;
  if (musicGain) musicGain.gain.value = on ? 1 : 0;
  if (!on) musicStop();
  else if (unlocked && pendingMode) musicStart(pendingMode);
}

export function isSfxEnabled() { return sfxEnabled; }
export function isMusicEnabled() { return musicEnabled; }

export async function unlockAudio() {
  const a = ctx();
  if (a.state === 'suspended') await a.resume();
  unlocked = true;
  setSfxEnabled(sfxEnabled);
  setMusicEnabled(musicEnabled);
  if (pendingMode && musicEnabled && !musicOn) musicStart(pendingMode);
  return true;
}

export function isAudioUnlocked() { return unlocked; }
export function resume() { return unlockAudio(); }

function note(f, d, type = 'sine', v = 0.08, t = 0, dest = sfxGain) {
  if (!unlocked || !sfxEnabled) return;
  const a = ctx();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(v, a.currentTime + t);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t + d);
  o.connect(g);
  g.connect(dest || sfxGain);
  o.start(a.currentTime + t);
  o.stop(a.currentTime + t + d);
}

function noiseBurst(d, v = 0.06, freq = 120) {
  if (!unlocked || !sfxEnabled) return;
  const a = ctx();
  const len = Math.floor(a.sampleRate * d);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filt = a.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(v, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
  src.connect(filt);
  filt.connect(g);
  g.connect(sfxGain);
  src.start();
}

export const sfx = {
  jump: () => note(420, 0.1, 'triangle', 0.07),
  land: () => note(220, 0.08, 'sine', 0.05),
  dash: () => note(660, 0.12, 'sawtooth', 0.06),
  glow: () => { note(330, 0.2, 'sine', 0.07); note(440, 0.25, 'triangle', 0.05, 0.05); },
  burst: () => note(110, 0.35, 'square', 0.08),
  petal: () => { [523, 659, 784].forEach((f, i) => note(f, 0.15, 'sine', 0.08, i * 0.08)); },
  hurt: () => { note(180, 0.2, 'sawtooth', 0.09); note(120, 0.3, 'sawtooth', 0.07, 0.05); },
  death: () => { note(130, 0.5, 'sawtooth', 0.1); note(90, 0.6, 'sine', 0.08, 0.15); },
  check: () => { note(494, 0.1, 'sine', 0.07); note(587, 0.15, 'sine', 0.07, 0.08); },
  collect: () => { note(660, 0.08, 'sine', 0.06); note(880, 0.12, 'triangle', 0.07, 0.06); },
  combo: () => note(988, 0.1, 'square', 0.05),
  win: () => [392, 494, 587, 659, 784].forEach((f, i) => note(f, 0.25, 'triangle', 0.08, i * 0.12)),
  ui: () => note(523, 0.08, 'sine', 0.06),
  rain: () => note(196, 0.5, 'sine', 0.05),
  portal: () => {
    [220, 330, 440, 554, 659].forEach((f, i) => note(f, 0.18, 'sine', 0.06, i * 0.06));
    noiseBurst(0.25, 0.04, 800);
  },
};

const TRACKS = {
  intro: { bpm: 72, bass: [110, 130.81, 110, 98], lead: [261.63, 329.63, 392, 329.63], padHz: 82.41, vol: 0.055, drums: false },
  lv0: { bpm: 118, bass: [98, 110, 123.47, 110], lead: [392, 440, 493.88, 523.25, 493.88, 440, 392, 349.23], padHz: 98, vol: 0.07 },
  lv1: { bpm: 124, bass: [110, 130.81, 146.83, 130.81], lead: [523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33], padHz: 110, vol: 0.075 },
  lv2: { bpm: 128, bass: [123.47, 110, 98, 110, 123.47, 146.83], lead: [659.25, 698.46, 783.99, 880, 783.99, 698.46, 659.25, 587.33], padHz: 123.47, vol: 0.078 },
  lv3: { bpm: 132, bass: [110, 146.83, 164.81, 146.83], lead: [587.33, 659.25, 783.99, 880, 987.77, 880, 783.99, 659.25], padHz: 110, vol: 0.08 },
  lv4: { bpm: 136, bass: [98, 123.47, 146.83, 123.47, 98, 87.31], lead: [440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 392], padHz: 98, vol: 0.082 },
  lv5: { bpm: 138, bass: [110, 110, 130.81, 146.83, 130.81, 110, 98, 110], lead: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880], padHz: 110, vol: 0.085 },
  lv6: { bpm: 142, bass: [82.41, 98, 110, 98, 82.41, 73.42, 82.41, 98], lead: [392, 440, 493.88, 440, 349.23, 392, 440, 493.88], padHz: 82.41, vol: 0.08 },
  lv7: { bpm: 146, bass: [73.42, 87.31, 98, 87.31, 73.42, 65.41, 73.42, 82.41], lead: [349.23, 392, 440, 493.88, 440, 392, 349.23, 329.63], padHz: 73.42, vol: 0.083 },
  lv8: { bpm: 150, bass: [65.41, 73.42, 82.41, 98, 82.41, 73.42], lead: [293.66, 349.23, 392, 440, 493.88, 440, 392, 349.23], padHz: 65.41, vol: 0.086 },
  lv9: { bpm: 158, bass: [55, 65.41, 73.42, 82.41, 73.42, 65.41, 55, 65.41], lead: [261.63, 293.66, 329.63, 349.23, 392, 440, 392, 349.23], padHz: 55, vol: 0.092, arp: [523.25, 659.25, 783.99, 659.25] },
  lv10: { bpm: 160, bass: [61.74, 73.42, 82.41, 73.42], lead: [349.23, 392, 440, 493.88, 523.25, 493.88, 440, 392], padHz: 61.74, vol: 0.088, arp: [440, 554.37, 659.25, 554.37] },
  lv11: { bpm: 162, bass: [58.27, 69.3, 77.78, 69.3], lead: [329.63, 369.99, 415.3, 440, 415.3, 369.99, 329.63, 293.66], padHz: 58.27, vol: 0.09, arp: [392, 493.88, 587.33, 493.88] },
  lv12: { bpm: 164, bass: [55, 65.41, 73.42, 65.41], lead: [293.66, 329.63, 369.99, 392, 440, 392, 369.99, 329.63], padHz: 55, vol: 0.091, arp: [349.23, 440, 523.25, 440] },
  lv13: { bpm: 166, bass: [51.91, 61.74, 69.3, 61.74], lead: [277.18, 311.13, 349.23, 392, 440, 392, 349.23, 311.13], padHz: 51.91, vol: 0.093, arp: [329.63, 415.3, 493.88, 415.3] },
  lv14: { bpm: 172, bass: [46.25, 55, 61.74, 55, 46.25, 41.2], lead: [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 440], padHz: 46.25, vol: 0.1, arp: [293.66, 369.99, 440, 369.99] },
  calm: { bpm: 138, bass: [110, 110, 130.81, 146.83, 130.81, 110, 98, 110], lead: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880], padHz: 110, vol: 0.085 },
  dark: { bpm: 142, bass: [82.41, 98, 110, 98, 82.41, 73.42, 82.41, 98], lead: [392, 440, 493.88, 440, 349.23, 392, 440, 493.88], padHz: 82.41, vol: 0.08 },
  boss: { bpm: 156, bass: [73.42, 73.42, 87.31, 98, 87.31, 73.42, 65.41, 73.42], lead: [293.66, 349.23, 392, 440, 392, 349.23, 293.66, 349.23], padHz: 73.42, vol: 0.09 },
  victory: { bpm: 120, bass: [110, 130.81, 146.83, 164.81], lead: [523.25, 659.25, 783.99, 880, 987.77, 880, 783.99, 659.25], padHz: 110, vol: 0.07, drums: false, arp: [659.25, 783.99, 987.77, 783.99] },
};

function playMelodyNote(f, dur, vol = 0.09, type = 'square') {
  if (!unlocked || !musicEnabled) return;
  const a = ctx();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g);
  g.connect(music);
  o.start();
  o.stop(a.currentTime + dur);
}

function playBassNote(f, dur, vol = 0.12) {
  if (!unlocked || !musicEnabled) return;
  const a = ctx();
  const o = a.createOscillator();
  const g = a.createGain();
  const flp = a.createBiquadFilter();
  flp.type = 'lowpass';
  flp.frequency.value = 420;
  o.type = 'sawtooth';
  o.frequency.value = f;
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(flp);
  flp.connect(g);
  g.connect(music);
  o.start();
  o.stop(a.currentTime + dur);
}

function playDrum(step, bpm) {
  if (!unlocked || !musicEnabled) return;
  const beat = 60000 / bpm / 2;
  if (step % 2 === 0) noiseBurst(0.08, 0.11, 90);
  if (step % 4 === 2) noiseBurst(0.05, 0.07, 220);
  if (step % 8 === 6) note(880, 0.03, 'square', 0.025, 0, music);
}

export function musicStart(mode = 'calm') {
  pendingMode = mode;
  if (!unlocked || !musicEnabled) return;
  musicStop();
  const tr = TRACKS[mode] || TRACKS.calm;
  music = ctx().createGain();
  music.gain.value = 0.2;
  music.connect(musicGain);

  pad = ctx().createOscillator();
  pad.type = 'triangle';
  pad.frequency.value = tr.padHz;
  const pg = ctx().createGain();
  pg.gain.value = 0.22;
  pad.connect(pg);
  pg.connect(music);
  pad.start();

  bass = ctx().createGain();
  bass.gain.value = 0.9;
  bass.connect(music);

  let step = 0;
  const beatMs = 60000 / tr.bpm / 2;
  loop = setInterval(() => {
    if (!unlocked || !musicEnabled) return;
    playMelodyNote(tr.lead[step % tr.lead.length], beatMs * 0.9 / 1000, tr.vol || 0.075);
    if (step % 2 === 0) playBassNote(tr.bass[(step / 2) % tr.bass.length], beatMs * 1.8 / 1000, (tr.vol || 0.075) + 0.025);
    if (tr.arp && step % 4 === 0) {
      playMelodyNote(tr.arp[(step / 4) % tr.arp.length], beatMs * 0.7 / 1000, (tr.vol || 0.075) * 0.55, 'triangle');
    }
    if (tr.drums !== false && mode !== 'intro') playDrum(step, tr.bpm);
    step++;
  }, beatMs);
  musicOn = true;
}

export function musicStop() {
  if (loop) clearInterval(loop);
  loop = null;
  if (pad) { try { pad.stop(); } catch (_) {} pad = null; }
  musicOn = false;
}

export function musicIntro() { musicStart('intro'); }
export function musicBoss() { musicStart('boss'); }
export function musicDark() { musicStart('dark'); }
export function musicCalm() { musicStart('calm'); }
export function musicPlay(mode = 'calm') { musicStart(mode); }
