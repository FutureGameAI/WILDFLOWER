const KEY = 'wildflower_save';
const VER = 8;
export const MAX_LIVES = 5;

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v >= 6) {
      d.v = VER;
      if (d.lvl >= 15) d.lvl = 0;
      if (d.lives == null) d.lives = MAX_LIVES;
      return d;
    }
  } catch (_) {}
  return {
    v: VER, lvl: 0, username: '',
    ab: { float: false, dash: false, glow: false, seed: false },
    petals: 0, lives: MAX_LIVES, done: false, bestScore: 0, totalOrbs: 0,
    sfxOn: true, musicOn: true,
  };
}

export function save(d) {
  localStorage.setItem(KEY, JSON.stringify({ ...d, v: VER }));
}

export function reset() { localStorage.removeItem(KEY); }
