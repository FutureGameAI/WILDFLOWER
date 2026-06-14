import { Game } from './game.js';
import { unlockAudio } from './audio.js';
import { initTouch, isTouchUiActive } from './touch.js';

const canvas = document.getElementById('c');
const overlay = document.getElementById('overlay');
const loadTip = document.getElementById('load-tip');
const game = new Game(canvas, overlay);

initTouch();

function fitGame() {
  const wrap = document.getElementById('game-wrap');
  const touchPad = isTouchUiActive() ? 132 : 0;
  const availW = window.innerWidth;
  const availH = window.innerHeight - touchPad;
  const desktop = !isTouchUiActive();
  const scale = Math.min(availW / 1280, availH / 720, desktop ? 1 : 2);
  wrap.style.transform = `scale(${scale})`;
  wrap.style.marginBottom = touchPad ? `${touchPad * 0.35}px` : '0';
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
    const sy = (e.clientY - r.top) * (720 / r.height);
    if (sy < 80) game.click(e.clientX, e.clientY);
  }
});

window.addEventListener('keydown', tryAudio, { once: true });
window.addEventListener('pointerdown', tryAudio, { once: true });
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', () => setTimeout(fitGame, 120));

document.body.addEventListener('touchstart', (e) => {
  if (e.target.closest('#touch-ui')) return;
  if (e.target === canvas || e.target.closest('#game-wrap')) e.preventDefault();
}, { passive: false });

fitGame();
if (loadTip) loadTip.style.display = 'none';

game.start();
game.loop();
