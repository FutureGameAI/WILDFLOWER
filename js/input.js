const k = {}, p = {}, m = { down: false, press: false };
let gameplay = false;
let touchLeft = false;
let touchRight = false;
let touchFloat = false;
let touchJumpTap = false;
let touchActionTap = false;
let touchPauseTap = false;

const BLOCK = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape'];

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

export function setTouchInput(t) {
  touchLeft = !!t.left;
  touchRight = !!t.right;
  touchFloat = !!t.float;
  if (t.jumpTap) { touchJumpTap = true; t.jumpTap = false; }
  if (t.actionTap) { touchActionTap = true; t.actionTap = false; }
  if (t.pauseTap) { touchPauseTap = true; t.pauseTap = false; }
}

export function init() {
  addEventListener('keydown', (e) => {
    if (isTyping(e)) return;
    if (!k[e.code]) p[e.code] = true;
    k[e.code] = true;
    if (BLOCK.includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => {
    if (isTyping(e)) return;
    k[e.code] = false;
  });
  addEventListener('mousedown', () => { if (!m.down) m.press = true; m.down = true; });
  addEventListener('mouseup', () => { m.down = false; });

  const canvas = document.getElementById('c');
  addEventListener('touchmove', (e) => {
    if (gameplay && canvas && e.target === canvas) e.preventDefault();
  }, { passive: false });
}

export function setGameplay(on) {
  clearInput();
  gameplay = on;
}

export function clearInput() {
  for (const key of Object.keys(p)) delete p[key];
  for (const code of BLOCK) delete k[code];
  m.down = false;
  m.press = false;
  touchJumpTap = false;
  touchActionTap = false;
  touchPauseTap = false;
}

export const down = (c) => !!k[c];
export const tap = (c) => {
  if (c === 'Escape' && touchPauseTap) { touchPauseTap = false; return true; }
  if (p[c]) { p[c] = false; return true; }
  return false;
};
export const action = () => {
  if (!gameplay) return false;
  if (tap('KeyF')) return true;
  if (touchActionTap) { touchActionTap = false; return true; }
  if (m.press) { m.press = false; return true; }
  return false;
};
export const jumpTap = () => {
  if (!gameplay) return false;
  if (tap('KeyW') || tap('ArrowUp')) return true;
  if (touchJumpTap) { touchJumpTap = false; return true; }
  return false;
};
export const jumpHeld = () => gameplay && (down('KeyW') || down('ArrowUp'));
export const left = () => gameplay && (down('KeyA') || down('ArrowLeft') || touchLeft);
export const right = () => gameplay && (down('KeyD') || down('ArrowRight') || touchRight);

export const dir = () => {
  let d = 0;
  if (left()) d -= 1;
  if (right()) d += 1;
  return d;
};

export const floatHold = () => gameplay && (down('Space') || touchFloat);
export const end = () => { m.press = false; };
