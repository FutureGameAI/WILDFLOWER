import { Game } from './game.js';
import { unlockAudio } from './audio.js';
import { initTouch, isTouchUiActive, setTouchUiVisible } from './touch.js';

const GW = 1280;
const GH = 720;
const ASPECT = GW / GH;

const canvas = document.getElementById('c');
const overlay = document.getElementById('overlay');
const loadTip = document.getElementById('load-tip');
const rotateScreen = document.getElementById('rotate-screen');
const wrap = document.getElementById('game-wrap');
const game = new Game(canvas, overlay);

initTouch();

function isMobile() {
  return matchMedia('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 0
    || window.innerWidth < 900;
}

function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

function fitGame() {
  const mobile = isMobile();
  const landscape = isLandscape();
  const menuOpen = overlay.classList.contains('on');
  const inPlay = (game.showTouchControls?.() ?? false) && !menuOpen;
  const needTouch = mobile && inPlay && landscape;

  document.body.classList.toggle('mobile', mobile);
  document.body.classList.toggle('landscape', landscape);
  document.body.classList.toggle('playing', inPlay);

  setTouchUiVisible(needTouch);

  const showRotate = mobile && inPlay && !landscape;
  if (rotateScreen) rotateScreen.classList.toggle('show', showRotate);

  const touchH = needTouch ? 76 : 0;
  document.documentElement.style.setProperty('--touch-h', `${touchH}px`);

  if (showRotate) return;

  const vv = window.visualViewport;
  const playW = vv?.width ?? window.innerWidth;
  const playH = (vv?.height ?? window.innerHeight) - touchH;
  let w;
  let h;

  if (mobile && landscape && inPlay) {
    if (playW / playH > ASPECT) {
      h = playH;
      w = playH * ASPECT;
    } else {
      w = playW;
      h = playW / ASPECT;
    }
  } else if (mobile) {
    const scale = Math.min(playW / GW, playH / GH);
    w = GW * scale;
    h = GH * scale;
  } else {
    const scale = Math.min(playW / GW, playH / GH, 1);
    w = GW * scale;
    h = GH * scale;
  }

  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;
  wrap.style.transform = 'none';
}

function tryAudio() { unlockAudio(); }

function handleCanvasPointer(clientX, clientY) {
  tryAudio();
  game.click(clientX, clientY);
}

let lastTouchEnd = 0;

canvas.addEventListener('click', (e) => {
  if (Date.now() - lastTouchEnd < 500) return;
  handleCanvasPointer(e.clientX, e.clientY);
});

canvas.addEventListener('touchend', (e) => {
  if (!e.target.closest('#c')) return;
  lastTouchEnd = Date.now();
  const t = e.changedTouches[0];
  if (t) handleCanvasPointer(t.clientX, t.clientY);
}, { passive: true });

window.addEventListener('keydown', tryAudio, { once: true });
window.addEventListener('pointerdown', tryAudio, { once: true });
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', () => setTimeout(fitGame, 200));
window.visualViewport?.addEventListener('resize', fitGame);

document.body.addEventListener('touchstart', (e) => {
  if (e.target.closest('#touch-ui') || e.target.closest('#overlay') || e.target.closest('#rotate-screen')) return;
  if (game.blocksTouchScroll?.() && (e.target === canvas || e.target.closest('#game-wrap'))) {
    e.preventDefault();
  }
}, { passive: false });

const overlayObs = new MutationObserver(fitGame);
overlayObs.observe(overlay, { attributes: true, attributeFilter: ['class'] });

fitGame();
if (loadTip) loadTip.style.display = 'none';

game.start();
game.onLayout = fitGame;
game.loop();
