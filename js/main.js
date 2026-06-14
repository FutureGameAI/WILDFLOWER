import { Game } from './game.js';
import { unlockAudio } from './audio.js';
import { initTouch, isTouchUiActive, setTouchUiVisible, getTouchBarHeight } from './touch.js';

const GW = 1280;
const GH = 720;

const canvas = document.getElementById('c');
const overlay = document.getElementById('overlay');
const loadTip = document.getElementById('load-tip');
const rotateHint = document.getElementById('rotate-hint');
const game = new Game(canvas, overlay);

initTouch();

function isMobileLayout() {
  return matchMedia('(pointer: coarse)').matches || window.innerWidth < 960;
}

function fitGame() {
  const inPlay = game.showTouchControls?.() ?? false;
  const menuOpen = overlay.classList.contains('on');
  setTouchUiVisible(isTouchUiActive() && inPlay && !menuOpen);

  const touchH = getTouchBarHeight();
  document.documentElement.style.setProperty('--touch-h', `${touchH}px`);

  const availW = window.innerWidth;
  const availH = window.innerHeight - touchH;
  const scaleW = availW / GW;
  const scaleH = availH / GH;

  let scale;
  if (isMobileLayout()) {
    scale = Math.max(scaleW, scaleH);
  } else {
    scale = Math.min(scaleW, scaleH, 1);
  }

  document.documentElement.style.setProperty('--game-scale', String(scale));

  const portrait = availH > availW;
  document.body.classList.toggle('portrait-play', portrait && inPlay && isTouchUiActive());
  if (rotateHint) rotateHint.style.display = portrait && inPlay && isTouchUiActive() ? 'block' : 'none';
}

function tryAudio() { unlockAudio(); }

canvas.addEventListener('click', (e) => {
  tryAudio();
  game.click(e.clientX, e.clientY);
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') {
    tryAudio();
    const r = canvas.getBoundingClientRect();
    const sy = (e.clientY - r.top) * (GH / r.height);
    if (sy < 80) game.click(e.clientX, e.clientY);
  }
});

window.addEventListener('keydown', tryAudio, { once: true });
window.addEventListener('pointerdown', tryAudio, { once: true });
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', () => setTimeout(fitGame, 150));

document.body.addEventListener('touchstart', (e) => {
  if (e.target.closest('#touch-ui') || e.target.closest('#overlay')) return;
  if (e.target === canvas || e.target.closest('#game-wrap')) e.preventDefault();
}, { passive: false });

const overlayObs = new MutationObserver(fitGame);
overlayObs.observe(overlay, { attributes: true, attributeFilter: ['class'] });

fitGame();
if (loadTip) loadTip.style.display = 'none';

game.start();
game.onLayout = fitGame;
game.loop();
