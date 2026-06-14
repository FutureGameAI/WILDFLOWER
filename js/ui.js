import { W, H } from './constants.js';
import { unlockAudio, sfx, musicIntro } from './audio.js';
import { fetchLeaderboard } from './leaderboard.js';

export class UI {
  constructor(el) { this.el = el; }

  username(onDone) {
    this.el.classList.add('on');
    fetchLeaderboard(5).then((top) => {
      const rows = top.length
        ? top.map((e, i) => `<li>${i + 1}. ${e.username} — ${e.score}</li>`).join('')
        : '<li>No scores yet — be the first!</li>';
      this.el.innerHTML = `
        <div class="panel">
          <h1>WILDFLOWER</h1>
          <p class="tag">Enter your gardener name</p>
          <input class="name-in" id="name" maxlength="16" placeholder="Your name..." />
          <div class="box"><h3>Top Gardeners</h3><ul class="lb">${rows}</ul></div>
          <button class="btn" id="go">Start Adventure</button>
        </div>`;
      const inp = document.getElementById('name');
      inp.focus();
      document.getElementById('go').onclick = () => {
        const name = inp.value.trim().slice(0, 16) || 'Iris';
        unlockAudio().then(() => { musicIntro(); sfx.ui(); });
        this.el.classList.remove('on');
        this.el.innerHTML = '';
        onDone(name);
      };
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('go').click();
      });
    });
  }

  intro(onDone) {
    this.el.classList.add('on');
    const scenes = [
      { t: 'WILDFLOWER', s: 'A sky-garden sleeps above a dead world.' },
      { t: 'The Rain Engine is silent.', s: 'Only one gardener remains.' },
      { t: 'Her name is Iris.', s: 'She carries no sword — only hope.' },
      { t: 'Four Heart Petals must bloom again.', s: 'Only then will the rain return.' },
    ];
    let i = 0;
    const show = () => {
      if (i >= scenes.length) {
        this.el.innerHTML = `
          <div class="panel">
            <h1>WILDFLOWER</h1>
            <p class="tag">A platform journey of light and renewal</p>
            <button class="btn" id="go">Begin Journey</button>
          </div>`;
        document.getElementById('go').onclick = () => {
          unlockAudio().then(() => { musicIntro(); sfx.ui(); });
          this.el.classList.remove('on');
          this.el.innerHTML = '';
          onDone();
        };
        return;
      }
      const sc = scenes[i++];
      this.el.innerHTML = `
        <div class="panel" id="sc">
          <h1 style="font-size:36px">${sc.t}</h1>
          <p>${sc.s}</p>
          <p style="color:#668;margin-top:20px">Click to continue</p>
        </div>`;
      document.getElementById('sc').onclick = () => { sfx.ui(); show(); };
    };
    show();
  }

  controls(onStart) {
    this.el.classList.add('on');
    this.el.innerHTML = `
      <div class="panel">
        <h1>WILDFLOWER</h1>
        <div class="box"><h3>Controls</h3>
          <p>Move — A / D or Arrow Keys</p>
          <p>Jump — W or Up Arrow</p>
          <p>Float — Hold Space in air (after unlock)</p>
          <p>Ability — F or Left Click</p>
          <p>Collect * $ G orbs for points (combo bonus!)</p>
          <p>15 levels · ~15 min · World rank on the HUD</p>
          <p>Golden flag — Checkpoint (saves respawn mid-level too)</p>
          <p>Lose a heart → return to last checkpoint (5 hearts for the whole run)</p>
          <p>All hearts lost → Game Over, restart from Level 1</p>
          <p>Pause — Escape (N = SFX, M = Music)</p>
          <p><strong>Mobile:</strong> on-screen ◀ ▶ ↑ FLOAT ✦ ⏸ buttons appear automatically</p></div>
          <p>Explore 15 regions of the ruined sky-garden. Collect Heart Petals. Restore the Rain Engine. Survive the Blight.</p></div>
        <button class="btn" id="st">Enter the Garden</button>
      </div>`;
    document.getElementById('st').onclick = () => {
      unlockAudio().then(() => { musicIntro(); sfx.ui(); });
      this.el.classList.remove('on');
      this.el.innerHTML = '';
      onStart();
    };
  }

  ending(score, onDone) {
    this.el.classList.add('on');
    const lines = [
      'The Blight dissolved into morning mist.',
      'Rain fell for the first time in centuries.',
      'Iris planted the Heart Petals in the Engine.',
      'Green spread across the clouds.',
      'The world would bloom again.',
    ];
    let i = 0;
    const show = () => {
      if (i >= lines.length) {
        fetchLeaderboard(5).then((top) => {
          const rows = top.length
            ? top.map((e, j) => `<li>${j + 1}. ${e.username} — ${e.score}</li>`).join('')
            : '<li>No scores yet</li>';
          this.el.innerHTML = `
            <div class="panel">
              <h1>Thank You</h1>
              <p class="tag">Your score: ${score}</p>
              <div class="box"><h3>Top Gardeners</h3><ul class="lb">${rows}</ul></div>
              <button class="btn" id="rp">Play Again</button>
            </div>`;
          document.getElementById('rp').onclick = () => { sfx.ui(); onDone(); };
        });
        return;
      }
      this.el.innerHTML = `<div class="panel"><p style="font-size:22px">${lines[i++]}</p></div>`;
      setTimeout(show, 2800);
    };
    show();
  }
}

export class IntroCanvas {
  constructor() {
    this.on = false;
    this.done = null;
    this.scene = 0;
    this.timer = 0;
    this.ch = 0;
    this.scenes = [
      'In the age after the Last Rain, gardens floated above a silent earth.',
      'Iris, the final keeper, woke among wilted roses and broken glass.',
      '"Find the Heart Petals," whispered the spirit-tree. "Wake the Engine."',
      'Four powers slumber in the petals: Float, Dash, Glow, and Seed.',
      'Fifteen regions stand between Iris and the Rain Engine.',
      'The Blight guards the heart of the garden. It feeds on forgotten hope.',
    ];
    this.btn = null;
  }

  start(cb) {
    this.on = true; this.done = cb; this.scene = 0; this.timer = 0; this.ch = 0;
    unlockAudio().then(() => musicIntro());
  }

  advance() {
    const full = this.scenes[this.scene];
    if (this.ch < full.length) { this.ch = full.length; return; }
    if (this.scene < this.scenes.length - 1) {
      this.scene++; this.ch = 0; this.timer = 0; sfx.ui();
    }
  }

  click(x, y) {
    if (!this.on) return;
    if (this.btn && x >= this.btn.x && x <= this.btn.x + this.btn.w && y >= this.btn.y && y <= this.btn.y + this.btn.h) {
      sfx.ui();
      unlockAudio().then(() => musicIntro());
      this.on = false;
      this.done?.();
      return;
    }
    this.advance();
  }

  update() {
    if (!this.on) return;
    this.timer++;
    if (this.timer % 2 === 0 && this.ch < this.scenes[this.scene].length) this.ch++;
  }

  draw(ctx) {
    if (!this.on) return;
    const t = this.timer;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1035');
    g.addColorStop(1, '#402860');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 0.03 + i) * 0.3;
      ctx.fillStyle = '#ffaacc';
      ctx.fillRect((i * 61 + t * 0.5) % W, (i * 37) % (H * 0.5), 3, 3);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffb7d5';
    ctx.font = 'bold 56px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('WILDFLOWER', W / 2, 100);
    ctx.font = '18px Georgia';
    ctx.fillStyle = '#88ccaa';
    ctx.fillText('A sky-garden tale', W / 2, 132);

    ctx.fillStyle = 'rgba(8,12,24,0.85)';
    ctx.fillRect(80, H / 2 - 60, W - 160, 120);
    ctx.strokeStyle = '#ffb7d5';
    ctx.strokeRect(80, H / 2 - 60, W - 160, 120);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = '22px Georgia';
    ctx.fillText(this.scenes[this.scene].slice(0, this.ch), W / 2, H / 2);

    if (this.ch >= this.scenes[this.scene].length) {
      if (this.scene < this.scenes.length - 1) {
        ctx.fillStyle = `rgba(170,200,255,${0.5 + Math.sin(t * 0.08) * 0.5})`;
        ctx.font = '16px Georgia';
        ctx.fillText('Click or Space to continue', W / 2, H - 40);
      } else {
        const bw = 260, bh = 50, bx = W / 2 - bw / 2, by = H - 90;
        this.btn = { x: bx, y: by, w: bw, h: bh };
        ctx.fillStyle = '#cc4488';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Georgia';
        ctx.fillText('Begin Journey', W / 2, by + 34);
      }
    }

    for (let i = 0; i < this.scenes.length; i++) {
      ctx.fillStyle = i === this.scene ? '#ffb7d5' : '#445';
      ctx.fillRect(W / 2 - this.scenes.length * 8 + i * 16, H / 2 + 80, 10, 10);
    }
    ctx.textAlign = 'left';
  }
}
