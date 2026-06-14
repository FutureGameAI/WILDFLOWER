export const T = 40;
export const W = 1280;
export const H = 720;
export const HUD_H = 80;
export const PLAY_TOP = HUD_H;
export const GRAV = 0.42;
export const MAX_VY = 13;
export const RUN = 4.8;
export const JUMP = -11;

export const BIOMES = {
  atrium: { sky: ['#1a1030', '#3a2060', '#6a4080'], ground: '#3a5a40', accent: '#88cc88', fog: '#ffeedd' },
  greenhouse: { sky: ['#102030', '#204060', '#4080a0'], ground: '#4a6a5a', accent: '#aaffcc', fog: '#ccffee' },
  undergarden: { sky: ['#081018', '#102028', '#203848'], ground: '#3a4a50', accent: '#88aaff', fog: '#6688aa' },
  storm: { sky: ['#101028', '#202048', '#404080'], ground: '#505060', accent: '#aaaaff', fog: '#8888cc' },
  engine: { sky: ['#180818', '#301030', '#502050'], ground: '#4a3050', accent: '#ff88cc', fog: '#ffaaee' },
};

export const ABILITIES = {
  float: { name: 'Petal Float', key: 'Hold Space in air to float up' },
  dash: { name: 'Blossom Dash', key: 'F / Click in air' },
  glow: { name: 'Glow Spore', key: 'F / Click — burns vines, lights dark caves' },
  seed: { name: 'Seed Burst', key: 'F / Click' },
};

export const TILE = {
  EMPTY: 0, SOLID: 1, PLAT: 2, SPIKE: 3, VINE: 4, BREAK: 5,
  CHECK: 6, GOAL: 7, DARK: 8, CRYSTAL: 9,
  POLLEN: 10, DEW: 11, SUN: 12,
};

export const SCORE_ITEMS = {
  [10]: { value: 30, color: '#ffaacc', label: 'Pollen' },
  [11]: { value: 80, color: '#88ddff', label: 'Dew Gem' },
  [12]: { value: 200, color: '#ffd700', label: 'Sun Seed' },
};

export const MAP = {
  '.': 0, '#': 1, '=': 2, '^': 3, 'V': 4, 'B': 5, 'C': 6, '!': 7, 'D': 8, 'X': 9,
  '*': 10, '$': 11, 'G': 12,
};
