import { W, H, T, ABILITIES, TILE, SCORE_ITEMS, PLAY_TOP } from './constants.js';
import { Iris, Camera } from './player.js';
import { World } from './world.js';
import { LEVELS, goalOf } from './levels.js';
import { Particles, Fireflies } from './particles.js';
import { UI, IntroCanvas } from './ui.js';
import * as R from './render.js';
import * as I from './input.js';
import { load, save, reset as resetSave, MAX_LIVES } from './save.js';
import { sfx, musicIntro, musicDark, musicBoss, musicStop, musicPlay, unlockAudio, isAudioUnlocked, setSfxEnabled, setMusicEnabled } from './audio.js';
import { getTouchState } from './touch.js';
import { submitScore, fetchLeaderboard, computeRank } from './leaderboard.js';

const S = { INTRO: 0, CTRL: 1, TITLE: 2, PLAY: 3, PAUSE: 4, DIALOG: 5, UNLOCK: 6, END: 7, RAIN: 8, DEAD: 9, TRANSITION: 10 };

export class Game {
  constructor(canvas, overlay) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = new UI(overlay);
    this.intro = new IntroCanvas();
    this.cam = new Camera();
    this.fx = new Particles();
    this.ff = new Fireflies(30, W, H);
    this.data = load();
    this.state = S.INTRO;
    this.lvlIdx = 0;
    this.world = null;
    this.iris = null;
    this.goal = null;
    this.time = 0;
    this.titleT = 0;
    this.unlock = null;
    this.dlg = null;
    this.dlgQ = [];
    this.rainT = 0;
    this.won = false;
    this.goalDone = false;
    this.pendingNext = false;
    this.deathTimer = 0;
    this.transition = null;
    this.pauseBtns = [];
    this.runScore = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastCollect = 0;
    this.popups = [];
    this.toasts = [];
    this.checkMsgT = 0;
    this.lvlTimer = 0;
    this.showCollectHint = true;
    this.worldRank = 1;
    this.leaderboardList = [];
    this.rankRefreshT = 0;
    this.sessionFrames = 0;
    this.mapMode = 'start';
    this.showHelp = false;
    this.onLayout = null;
  }

  showTouchControls() {
    return this.state === S.PLAY || this.state === S.PAUSE || this.state === S.DEAD;
  }

  async refreshRank() {
    try {
      this.leaderboardList = await fetchLeaderboard(100);
      const effective = Math.max(this.runScore, this.data.bestScore || 0);
      this.worldRank = computeRank(this.data.username, effective, this.leaderboardList);
    } catch (_) {
      this.worldRank = 1;
    }
  }

  beginPlay() {
    I.setGameplay(true);
    this.lvlTimer = 0;
    this.startLevelMusic();
    const L = LEVELS[this.lvlIdx];
    if (L.boss) {
      this.toasts.push({ text: 'Boss: Dash / Glow / Seed all hurt the Blight!', t: 0 });
    } else if (L.enemies?.length) {
      this.toasts.push({ text: '⚠ Red enemies — do NOT touch them!', t: 0 });
    }
    if (L.unlock && this.data.ab[L.unlock]) {
      this.toasts.push({ text: `${ABILITIES[L.unlock].name} ready — ${ABILITIES[L.unlock].key}`, t: 0 });
    }
  }

  resumePlay() {
    I.setGameplay(true);
  }

  startLevelMusic() {
    const L = LEVELS[this.lvlIdx];
    musicPlay(L.music || `lv${L.id}`);
  }

  addScore(n, msg, wx, wy, col) {
    this.runScore += n;
    this.displayScore = this.runScore;
    if (wx != null) {
      this.popups.push({ x: wx, y: wy, text: `+${n}`, t: 0, col: col || '#ffd700' });
    }
    if (msg) this.toasts.push({ text: msg, t: 0 });
    if (this.runScore > (this.data.bestScore || 0)) {
      this.data.bestScore = this.runScore;
      save(this.data);
    }
    this.refreshRank();
  }

  collectItem(tile, tx, ty) {
    const item = SCORE_ITEMS[tile];
    if (!item) return;
    this.world.set(tx, ty, TILE.EMPTY);
    const wx = tx * T + T / 2;
    const wy = ty * T + T / 2;

    if (this.time - this.lastCollect < 100) {
      this.combo++;
      if (this.combo % 3 === 0) sfx.combo();
    } else {
      this.combo = 1;
    }
    this.lastCollect = this.time;
    this.comboTimer = 120;

    const mult = 1 + Math.min(4, Math.floor(this.combo / 2)) * 0.25;
    const pts = Math.round(item.value * mult);
    this.addScore(pts, null, wx, wy, item.color);
    if (this.iris) this.iris.floatFuel = Math.min(this.iris.floatMax, this.iris.floatFuel + 50);
    sfx.collect();
    this.fx.burst(wx, wy, 18, item.color);
    this.data.totalOrbs = (this.data.totalOrbs || 0) + 1;
    if (this.combo > 1) {
      this.toasts.push({ text: `${item.label} — Combo x${this.combo}!`, t: 0 });
    }
    save(this.data);
  }

  start() {
    I.init();
    I.setGameplay(false);
    setSfxEnabled(this.data.sfxOn !== false);
    setMusicEnabled(this.data.musicOn !== false);
    if (this.data.done) {
      this.ui.ending(this.data.bestScore || 0, () => this.restart());
      return;
    }
    const go = () => {
      if (this.data.lvl > 0) this.load(this.data.lvl, 'continue');
      else this.intro.start(() => {
        this.state = S.CTRL;
        this.ui.controls(() => this.load(0, 'start'));
      });
    };
    if (!this.data.username) {
      this.ui.username((name) => {
        this.data.username = name;
        save(this.data);
        go();
      });
    } else go();
    this.refreshRank();
  }

  restart() {
    resetSave();
    this.data = load();
    this.runScore = 0;
    this.state = S.INTRO;
    I.setGameplay(false);
    this.ui.username((name) => {
      this.data.username = name;
      save(this.data);
      this.intro.start(() => {
        this.state = S.CTRL;
        this.ui.controls(() => this.load(0, 'start'));
      });
    });
  }

  syncLives() {
    this.data.lives = this.iris.hp;
    save(this.data);
  }

  knockToCheckpoint() {
    this.iris.x = this.iris.rx;
    this.iris.y = this.iris.ry;
    this.iris.vx = 0;
    this.iris.vy = 0;
    this.iris.pitFlag = false;
    this.cam.shake(10);
    this.fx.burst(this.iris.x + this.iris.w / 2, this.iris.y + this.iris.h / 2, 22, '#ff4466');
    this.syncLives();
    this.toasts.push({ text: `Life lost! ${this.iris.hp} heart${this.iris.hp === 1 ? '' : 's'} left`, t: 0 });
  }

  onPlayerDeath() {
    this.state = S.DEAD;
    this.deathTimer = 0;
    this.cam.shake(14);
    I.setGameplay(false);
  }

  gameOverRestart() {
    this.data.lvl = 0;
    this.data.petals = 0;
    this.data.lives = MAX_LIVES;
    this.data.ab = { float: false, dash: false, glow: false, seed: false };
    this.runScore = 0;
    this.displayScore = 0;
    this.combo = 0;
    save(this.data);
    this.load(0, 'start');
    this.dlgQ = [];
    this.dlg = null;
    this.state = S.TITLE;
    this.titleT = 0;
    this.mapMode = 'start';
  }

  skipMap() {
    const L = LEVELS[this.lvlIdx];
    if (L.unlock && !this.data.ab[L.unlock]) {
      this.grantAbility(L.unlock);
      I.setGameplay(false);
      this.state = S.UNLOCK;
    } else {
      this.state = S.PLAY;
      this.beginPlay();
    }
  }

  beginTransition(cb, wx, wy) {
    sfx.portal();
    sfx.win();
    this.transition = { t: 0, cb, wx, wy };
    this.state = S.TRANSITION;
  }

  toggleSetting(id) {
    if (id === 'sfx') {
      const on = this.data.sfxOn !== false;
      this.data.sfxOn = !on;
      setSfxEnabled(this.data.sfxOn);
    } else if (id === 'music') {
      const on = this.data.musicOn !== false;
      this.data.musicOn = !on;
      setMusicEnabled(this.data.musicOn);
    }
    save(this.data);
    if (this.data.sfxOn !== false) sfx.ui();
  }

  load(i, mapMode = 'start') {
    I.setGameplay(false);
    if (i === 0 && mapMode === 'start') {
      this.runScore = 0;
      this.sessionFrames = 0;
      this.data.lives = MAX_LIVES;
    }
    this.mapMode = mapMode;
    this.lvlIdx = i;
    this.goalDone = false;
    this.pendingNext = false;
    const L = LEVELS[i];
    this.world = new World(L);
    this.world.floatCeil = null;
    this.goal = goalOf(L);
    const sx = L.spawn.x * T + 8;
    const sy = L.spawn.y * T - 36;
    this.iris = new Iris(sx, sy);
    this.iris.maxHp = MAX_LIVES;
    this.iris.hp = Math.max(1, Math.min(MAX_LIVES, this.data.lives ?? MAX_LIVES));
    this.data.lives = this.iris.hp;
    this.iris.setAb(this.data.ab);
    this.snapToGround(this.iris, L.spawn.x, L.spawn.y);
    this.deathTimer = 0;
    this.fx.list = [];
    musicIntro();

    this.dlgQ = (L.story || []).map((t) => ({ speaker: t.includes(':') ? t.split(':')[0] : 'Spirit Tree', text: t.includes(':') ? t.split(':').slice(1).join(':').trim() : t, ch: 0 }));
    if (this.dlgQ.length) {
      this.state = S.DIALOG;
      this.dlg = { ...this.dlgQ.shift(), ch: 0 };
    } else {
      this.state = S.TITLE;
      this.titleT = 0;
    }

    this.data.lvl = i;
    save(this.data);
  }

  snapToGround(iris, spawnX, spawnY) {
    const col = spawnX ?? Math.floor((iris.x + iris.w / 2) / T);
    const startRow = spawnY ?? 0;
    for (let row = startRow; row < this.world.h; row++) {
      const id = this.world.id(col, row);
      if (id === TILE.SOLID || id === TILE.PLAT) {
        const surf = this.world.surfaceY(col, row, id);
        iris.y = surf - iris.h;
        iris.vx = 0;
        iris.vy = 0;
        iris.ground = true;
        iris.checkpoint(iris.x, iris.y);
        return;
      }
    }
    iris.checkpoint(iris.x, iris.y);
  }

  grantAbility(key) {
    this.data.ab[key] = true;
    this.iris.setAb(this.data.ab);
    save(this.data);
    this.unlock = { name: ABILITIES[key].name, hint: ABILITIES[key].key, t: 0 };
    sfx.petal();
  }

  nextLvl() {
    if (this.lvlIdx + 1 >= LEVELS.length) {
      this.state = S.RAIN;
      this.rainT = 0;
      musicStop();
      sfx.win();
      return;
    }
    this.load(this.lvlIdx + 1, 'advance');
  }

  update() {
    this.time++;
    I.end();

    if (this.state === S.INTRO) {
      this.intro.update();
      if (I.tap('Space') || I.tap('Enter')) this.intro.advance();
      return;
    }

    if (this.state === S.TITLE) {
      this.titleT++;
      if (this.titleT > 280 || (this.titleT > 55 && (I.tap('Space') || I.tap('Enter') || I.action()))) {
        this.skipMap();
      }
      return;
    }

    if (this.state === S.UNLOCK) {
      this.unlock.t++;
      if (this.unlock.t > 110) {
        this.unlock = null;
        this.state = S.PLAY;
        this.beginPlay();
        if (this.pendingNext) { this.pendingNext = false; this.nextLvl(); }
      }
      return;
    }

    if (this.state === S.DIALOG) {
      if (this.dlg.ch < this.dlg.text.length) this.dlg.ch++;
      else if (I.tap('Space') || I.tap('Enter') || I.action()) {
        if (this.dlgQ.length) this.dlg = { ...this.dlgQ.shift(), ch: 0 };
        else { this.dlg = null; this.state = S.TITLE; this.titleT = 0; }
      }
      return;
    }

    if (this.state === S.RAIN) {
      this.rainT++;
      if (this.rainT === 1) {
        submitScore(this.data.username, this.runScore);
        save(this.data);
        musicPlay('victory');
      }
      if (this.rainT > 540) {
        this.data.done = true;
        save(this.data);
        this.ui.ending(this.runScore, () => this.restart());
      }
      return;
    }

    if (this.state === S.PAUSE) {
      I.setGameplay(false);
      if (I.tap('Escape')) { this.state = S.PLAY; this.resumePlay(); }
      if (I.tap('KeyM')) this.toggleSetting('music');
      if (I.tap('KeyN')) this.toggleSetting('sfx');
      return;
    }

    if (this.state === S.TRANSITION) {
      this.transition.t++;
      if (this.transition.t === 1) this.fx.burst(this.transition.wx, this.transition.wy, 40, '#aaffcc');
      this.fx.update();
      this.cam.follow(this.iris, this.world.w * T, this.world.h * T);
      if (this.transition.t > 72) {
        const cb = this.transition.cb;
        this.transition = null;
        cb?.();
      }
      return;
    }

    if (I.tap('Escape') && this.state === S.PLAY) {
      if (this.showHelp) { this.showHelp = false; return; }
      I.setGameplay(false);
      this.state = S.PAUSE;
      return;
    }

    if (this.state !== S.PLAY && this.state !== S.DEAD) return;

    if (this.state === S.PLAY) this.sessionFrames++;

    if (this.state === S.DEAD) {
      this.deathTimer++;
      if (this.deathTimer > 150) {
        this.gameOverRestart();
        return;
      }
      this.cam.follow(this.iris, this.world.w * T, this.world.h * T);
      return;
    }

    this.world.floatCeil = this.cam.y + PLAY_TOP;
    const res = this.iris.update(this.world, this.fx);
    if (this.state === S.PLAY && (Math.abs(this.iris.vx) > 0.5 || !this.iris.ground || this.iris.floatOn)) {
      if (this.time % 3 === 0) {
        this.fx.spawn(this.iris.x + this.iris.w / 2, this.iris.y + this.iris.h - 4, this.iris.floatOn ? '#ffaacc' : '#88ccaa');
      }
    }
    this.lvlTimer++;
    this.rankRefreshT++;
    if (this.rankRefreshT >= 180) {
      this.rankRefreshT = 0;
      this.refreshRank();
    }

    if (this.comboTimer > 0) this.comboTimer--;
    else if (this.combo > 0) this.combo = 0;

    this.displayScore += (this.runScore - this.displayScore) * 0.15;

    const cx = Math.floor((this.iris.x + this.iris.w / 2) / T);
    const cy = Math.floor((this.iris.y + this.iris.h / 2) / T);
    for (let ty = cy - 1; ty <= cy + 1; ty++) {
      for (let tx = cx - 1; tx <= cx + 1; tx++) {
        const id = this.world.id(tx, ty);
        if (SCORE_ITEMS[id]) this.collectItem(id, tx, ty);
      }
    }

    if (res.pitFall) {
      if (this.iris.hurt()) {
        this.onPlayerDeath();
      } else {
        this.knockToCheckpoint();
      }
    }
    if (res.burst) {
      this.world.breakAt(res.burst.x, res.burst.y, res.burst.r);
      this.world.hitEnemies(res.burst);
      this.cam.shake(8);
    }

    if (this.iris.dashT > 0 && !this.iris.dashHit) {
      for (const e of this.world.enemies) {
        if (e.alive && Math.hypot(e.x - this.iris.x, e.y - this.iris.y) < 48) {
          e.hp -= 1;
          if (e.hp <= 0) e.alive = false;
        }
      }
      this.iris.dashHit = true;
    }
    if (this.iris.glowT > 0) {
      for (const e of this.world.enemies) {
        if (e.alive && Math.hypot(e.x - this.iris.x, e.y - this.iris.y) < 130) {
          if (this.time % 12 === 0) { e.hp -= 1; if (e.hp <= 0) e.alive = false; }
        }
      }
    }

    const enemyHit = this.world.updateEnemies(this.iris);
    if (enemyHit === 'dead') this.onPlayerDeath();
    else if (enemyHit === 'hurt') this.knockToCheckpoint();

    this.fx.update();
    this.ff.update(W, H);

    for (const p of this.world.petals) {
      if (p.got) continue;
      if (Math.hypot(this.iris.x - p.x, this.iris.y - p.y) < 36) {
        p.got = true;
        this.data.petals++;
        this.addScore(500, 'Heart Petal +500', p.x + 12, p.y, '#ffb7d5');
        if (this.iris) this.iris.floatFuel = this.iris.floatMax;
        sfx.petal();
        this.fx.burst(p.x, p.y, 30, '#ffb7d5');
      }
    }

    const fx = Math.floor((this.iris.x + this.iris.w / 2) / T);
    const fy = Math.floor((this.iris.y + this.iris.h - 4) / T);
    if (this.world.id(fx, fy) === TILE.SPIKE) {
      if (this.iris.hurt()) this.onPlayerDeath();
      else this.knockToCheckpoint();
    }
    if (this.world.id(fx, fy) === TILE.CHECK) {
      this.iris.checkpoint(this.iris.x, this.iris.y);
      this.world.set(fx, fy, 0);
      this.addScore(200, 'Checkpoint saved! +200', fx * T + T / 2, fy * T + T / 2, '#ffd700');
      this.checkMsgT = 120;
      sfx.check();
      this.fx.burst(fx * T + 20, fy * T + 20, 35, '#ffd700');
    }

    for (const e of this.world.enemies) {
      if (e._scored) continue;
      if (!e.alive) {
        e._scored = true;
        this.addScore(150, 'Enemy cleared +150', e.x + 12, e.y + 12, '#ff88aa');
      }
    }

    for (const p of this.popups) p.t++;
    this.popups = this.popups.filter((p) => p.t < 55);
    for (const t of this.toasts) t.t++;
    this.toasts = this.toasts.filter((t) => t.t < 120);
    if (this.checkMsgT > 0) this.checkMsgT--;
    if (this.lvlTimer > 600) this.showCollectHint = false;

    if (this.goal && !this.goalDone) {
      const gx = this.goal.x * T, gy = this.goal.y * T;
      const atGoal = this.iris.x + this.iris.w > gx && this.iris.x < gx + T && this.iris.y + this.iris.h > gy - T;
      if (atGoal) {
        const L = LEVELS[this.lvlIdx];
        const boss = this.world.enemies.find((e) => e.type === 'blight');
        if (L.boss && boss?.alive) {
          if (this.time % 45 === 0) this.toasts.push({ text: 'Defeat the Blight first!', t: 0 });
        } else {
          const wx = this.goal.x * T + T / 2;
          const wy = this.goal.y * T + T / 2;
          const timeBonus = Math.max(100, 800 - Math.floor(this.lvlTimer / 8));
          this.addScore(1000, null, wx, wy, '#aaffcc');
          this.addScore(timeBonus, `Speed bonus +${timeBonus}!`, wx, wy - 16, '#88ffaa');
          this.goalDone = true;
          this.beginTransition(() => this.nextLvl(), wx, wy);
        }
      }
    }

    const boss = this.world.enemies.find((e) => e.type === 'blight');
    if (boss && !boss.alive && !this.goalDone) {
      const wx = boss.x + 24;
      const wy = boss.y + 24;
      this.addScore(2000, 'Blight defeated! +2000', wx, wy, '#ff6688');
      this.goalDone = true;
      this.beginTransition(() => this.nextLvl(), wx, wy);
    }

    this.cam.follow(this.iris, this.world.w * T, this.world.h * T);
    const skyTop = this.cam.y + PLAY_TOP;
    if (this.iris.y < skyTop) {
      this.iris.y = skyTop;
      if (this.iris.vy < 0) this.iris.vy = 0;
    }
  }

  draw() {
    const ctx = this.ctx;
    const L = LEVELS[this.lvlIdx];

    if (this.state === S.INTRO) {
      this.intro.draw(ctx);
      if (!isAudioUnlocked()) R.drawSoundHint(ctx);
      return;
    }

    if (this.state === S.RAIN) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const bloom = Math.min(1, this.rainT / 200);
      g.addColorStop(0, `rgb(${32 + bloom * 40},${48 + bloom * 60},${80 + bloom * 40})`);
      g.addColorStop(1, `rgb(${64 + bloom * 80},${128 + bloom * 60},${96 + bloom * 40})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      R.drawRain(ctx, this.rainT);
      ctx.fillStyle = '#fff';
      ctx.font = '28px Georgia';
      ctx.textAlign = 'center';
      const msgs = [
        'The rain returns...',
        'Petals open across the clouds.',
        'Green spreads through the sky-garden.',
        'The Rain Engine sings again.',
        'The world blooms — thanks to you, gardener.',
      ];
      const mi = Math.min(msgs.length - 1, Math.floor(this.rainT / 100));
      ctx.fillText(msgs[mi], W / 2, H / 2 - 20);
      ctx.font = '22px Georgia';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Final Score: ${this.runScore}`, W / 2, H / 2 + 30);
      const mins = Math.floor(this.sessionFrames / 3600);
      const secs = Math.floor((this.sessionFrames / 60) % 60);
      ctx.fillStyle = '#aaffcc';
      ctx.font = '18px Georgia';
      ctx.fillText(`Journey time: ${mins}:${String(secs).padStart(2, '0')}`, W / 2, H / 2 + 62);
      ctx.textAlign = 'left';
      return;
    }

    if (!this.world || !this.iris) {
      ctx.fillStyle = '#101820';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (this.state === S.TITLE) {
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, W, H);
      R.drawLevelMap(ctx, this.lvlIdx, this.titleT, this.mapMode);
      if (!isAudioUnlocked()) R.drawSoundHint(ctx);
      return;
    }

    R.drawSky(ctx, L.biome, this.time, this.cam);
    this.cam.apply(ctx);
    R.drawWorld(ctx, this.world, L.biome, this.time, this.world.dark, this.iris);
    this.fx.draw(ctx);
    R.drawScorePopups(ctx, this.popups, this.cam);
    if (this.state !== S.TRANSITION && !this.world.dark) this.iris.draw(ctx);
    this.cam.reset(ctx);

    if (this.world.dark) {
      R.drawDarkOverlay(ctx, this.world, this.iris, this.cam);
      if (this.state !== S.TRANSITION) {
        this.cam.apply(ctx);
        R.drawPlayerInDark(ctx, this.iris);
        this.cam.reset(ctx);
      }
    }
    this.ff.draw(ctx, this.cam);

    const prog = this.world ? (this.lvlIdx + (this.iris.x + this.iris.w / 2) / (this.world.w * T)) / LEVELS.length : 0;
    if (this.state !== S.TITLE) {
      R.drawHUD(ctx, L, this.data, this.iris, this.state === S.DIALOG ? this.dlg : null, this.runScore, this.combo, this.displayScore, this.lvlIdx, LEVELS.length, this.worldRank, this.sessionFrames, prog, this.showHelp);

      let danger = 0;
      if ((this.state === S.PLAY || this.state === S.DEAD) && this.iris) {
        for (const e of this.world.enemies) {
          if (!e.alive) continue;
          const d = Math.hypot(e.x + 14 - (this.iris.x + this.iris.w / 2), e.y + 14 - (this.iris.y + this.iris.h / 2));
          if (d < 140) danger = Math.max(danger, 1 - d / 140);
        }
      }
      R.drawDangerVignette(ctx, danger);
      if (this.state === S.PLAY && this.showCollectHint) R.drawCollectHint(ctx);
      R.drawToasts(ctx, this.toasts);
      R.drawFloatMeter(ctx, this.iris);
    }

    if (this.unlock) R.drawUnlock(ctx, this.unlock.name, this.unlock.t, this.unlock.hint);
    if (this.state === S.PAUSE) R.drawPause(ctx, this.data, this.pauseBtns);
    if (this.state === S.TRANSITION && this.transition) {
      R.drawPortalTransition(ctx, this.transition, this.iris, this.time, this.cam);
    }

    if (this.state === S.DEAD) R.drawDeath(ctx, this.deathTimer);

    if (!isAudioUnlocked() && this.state !== S.INTRO) R.drawSoundHint(ctx);
  }

  loop() {
    I.setTouchInput(getTouchState());
    this.onLayout?.();
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  click(x, y) {
    unlockAudio();
    const r = this.c.getBoundingClientRect();
    const sx = (x - r.left) * (W / r.width);
    const sy = (y - r.top) * (H / r.height);

    if (this.state === S.PAUSE) {
      for (const b of this.pauseBtns) {
        if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
          this.toggleSetting(b.id);
          return;
        }
      }
    }

    if ((this.state === S.PLAY || this.state === S.PAUSE) && R.hitHelpBtn(sx, sy)) {
      this.showHelp = !this.showHelp;
      if (this.data.sfxOn !== false) sfx.ui();
      return;
    }
    if (this.showHelp && (this.state === S.PLAY || this.state === S.PAUSE) && !R.hitHelpPanel(sx, sy)) {
      this.showHelp = false;
      return;
    }

    if (this.state === S.TITLE && this.titleT > 55) {
      this.skipMap();
      return;
    }

    if (this.state === S.INTRO) this.intro.click(sx, sy);
    if (this.state === S.DIALOG && this.dlg && this.dlg.ch >= this.dlg.text.length) {
      if (this.dlgQ.length) this.dlg = { ...this.dlgQ.shift(), ch: 0 };
      else { this.dlg = null; this.state = S.TITLE; this.titleT = 0; }
    }
  }
}
