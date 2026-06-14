import { T, GRAV, MAX_VY, RUN, JUMP, TILE, PLAY_TOP } from './constants.js';
import * as I from './input.js';
import { sfx } from './audio.js';

export class Iris {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 26; this.h = 36;
    this.vx = 0; this.vy = 0;
    this.ground = false; this.face = 1;
    this.hp = 5; this.maxHp = 5;
    this.inv = 0; this.frame = 0;
    this.dead = false;
    this.rx = x; this.ry = y;
    this.ab = { float: false, dash: false, glow: false, seed: false };
    this.dashT = 0; this.dashCd = 0; this.dashD = 0;
    this.floatOn = false; this.glowT = 0; this.seedCd = 0;
    this.anim = 'idle';
    this.pitFlag = false;
    this.dashHit = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.floatFuel = 360;
    this.floatMax = 360;
    this.wasGround = false;
    this.landT = 0;
  }

  setAb(ab) { this.ab = { ...ab }; }
  checkpoint(x, y) { this.rx = x; this.ry = y; }

  respawn() {
    this.x = this.rx; this.y = this.ry;
    this.vx = this.vy = 0;
    this.dead = false;
    this.inv = 120;
    this.pitFlag = false;
    this.dashHit = false;
    this.floatFuel = this.floatMax;
    this.coyote = 0;
    this.jumpBuf = 0;
  }

  hurt() {
    if (this.inv > 0 || this.dead) return false;
    this.hp--;
    this.inv = 120;
    sfx.hurt();
    if (this.hp <= 0) {
      this.dead = true;
      sfx.death();
      return true;
    }
    return false;
  }

  update(map, fx) {
    if (this.dead) return { burst: null };

    if (this.inv > 0) this.inv--;
    if (this.dashCd > 0) this.dashCd--;
    if (this.seedCd > 0) this.seedCd--;
    if (this.glowT > 0) this.glowT--;

    if (this.dashT > 0) {
      this.dashT--;
      this.vx = this.dashD * 15;
      this.vy = 0;
      this.x += this.vx;
      this.collide(map, true);
      this.anim = 'dash';
      this.frame++;
      if (this.dashT <= 0) this.dashHit = false;
      return { burst: null };
    }

    const d = I.dir();
    if (d) this.face = d;
    this.vx = d * RUN;

    if (this.ground) {
      this.coyote = 14;
      this.floatFuel = this.floatMax;
    } else if (this.coyote > 0) {
      this.coyote--;
    }

    if (I.jumpTap()) this.jumpBuf = 15;
    if (this.jumpBuf > 0) this.jumpBuf--;

    const canJump = this.ground || this.coyote > 0;
    if (this.jumpBuf > 0 && canJump) {
      this.vy = JUMP;
      this.ground = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      sfx.jump();
    }

    this.floatOn = false;
    const ceilY = map.floatCeil;
    if (this.ab.float && !this.ground && I.floatHold() && this.floatFuel > 0) {
      const atCeil = ceilY != null && this.y <= ceilY + 2;
      if (!atCeil) {
        this.floatFuel -= 0.55;
        this.vy -= 0.48;
        if (this.vy > 0.2) this.vy *= 0.55;
        this.vy = Math.max(this.vy, -6.5);
      } else {
        this.vy = Math.min(this.vy, 0);
      }
      this.floatOn = true;
    }

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    if (this.glowT > 0 && this.ab.glow) {
      map.burnVines(cx, cy, map.dark ? 130 : 95);
    }

    let burst = null;
    if (I.action()) {
      const wantGlow = this.ab.glow && this.glowT <= 0 && (map.dark || map.hasVinesNear(cx, cy, 120));
      if (wantGlow) {
        this.glowT = 200;
        sfx.glow();
        map.burnVines(cx, cy, map.dark ? 140 : 110);
        fx?.burst(cx, cy, 24, '#aaffcc');
      } else if (this.ab.dash && this.dashCd <= 0 && !this.ground) {
        this.dashD = this.face; this.dashT = 9; this.dashCd = 40;
        this.dashHit = false;
        sfx.dash();
        fx?.burst(cx, cy, 12, '#ffb7d5');
      } else if (this.ab.glow && this.glowT <= 0) {
        this.glowT = 200;
        sfx.glow();
        map.burnVines(cx, cy, 110);
        fx?.burst(cx, cy, 24, '#aaffcc');
      } else if (this.ab.seed && this.seedCd <= 0) {
        this.seedCd = 35; sfx.burst();
        burst = { x: this.x + this.w / 2, y: this.y + this.h / 2, r: 80 };
        fx?.burst(this.x + this.w / 2, this.y + this.h / 2, 16, '#88ff88');
      }
    }

    this.vy = Math.min(this.vy + GRAV, MAX_VY);
    this.x += this.vx;
    this.collide(map, false);
    this.y += this.vy;
    this.ground = false;
    this.collide(map, true);

    if (ceilY != null && this.y < ceilY) {
      this.y = ceilY;
      if (this.vy < 0) this.vy = 0;
    }

    let pitFall = false;
    const pitLine = map.h * T + 20;
    if (this.y + this.h > pitLine + 60) {
      if (!this.pitFlag) {
        this.pitFlag = true;
        pitFall = true;
      }
    } else if (this.ground) {
      this.pitFlag = false;
    }

    this.anim = this.dashT > 0 ? 'dash' : !this.ground ? (this.floatOn ? 'float' : 'jump') : d ? 'run' : 'idle';
    if (this.ground && !this.wasGround && this.vy >= 0 && !this.dead) {
      sfx.land();
      this.landT = 8;
    }
    this.wasGround = this.ground;
    if (this.landT > 0) this.landT--;
    this.frame++;
    return { burst, pitFall };
  }

  collide(map, vert) {
    const l = Math.floor(this.x / T);
    const r = Math.floor((this.x + this.w - 1) / T);
    const tp = Math.floor(this.y / T);
    const bt = Math.floor((this.y + this.h - 1) / T);

    if (vert && this.vy > 0) {
      let bestSurface = null;
      for (let ty = tp; ty <= bt + 1; ty++) {
        for (let tx = l; tx <= r; tx++) {
          const id = map.id(tx, ty);
          if (!map.solid(id, tx, ty, this, true)) continue;
          const surf = map.surfaceY(tx, ty, id);
          if (this.y + this.h >= surf - 4 && (this.y + this.h - this.vy) <= surf + 8) {
            if (bestSurface === null || surf < bestSurface) bestSurface = surf;
          }
        }
      }
      if (bestSurface !== null) {
        this.y = bestSurface - this.h;
        this.vy = 0;
        this.ground = true;
      }
      return;
    }

    if (vert && this.vy < 0) {
      const nextY = this.y + this.vy;
      for (let ty = tp; ty <= bt + 1; ty++) {
        for (let tx = l; tx <= r; tx++) {
          const id = map.id(tx, ty);
          if (id !== TILE.SOLID && id !== TILE.BREAK && id !== TILE.CRYSTAL && id !== TILE.VINE) continue;
          const tileTop = ty * T;
          if (this.y >= tileTop && nextY < tileTop) {
            this.y = tileTop;
            this.vy = 0;
          }
        }
      }
      return;
    }

    for (let ty = tp; ty <= bt; ty++) {
      for (let tx = l; tx <= r; tx++) {
        const id = map.id(tx, ty);
        if (id !== TILE.SOLID && id !== TILE.BREAK && id !== TILE.CRYSTAL && id !== TILE.VINE) continue;
        const surf = map.surfaceY(tx, ty, id);
        const feet = this.y + this.h;
        if (feet <= surf + 8 && feet >= surf - 10) continue;
        const px = tx * T;
        if (this.vx > 0 && this.x + this.w > px) {
          this.x = px - this.w;
          this.vx = 0;
        } else if (this.vx < 0 && this.x < px + T) {
          this.x = px + T;
          this.vx = 0;
        }
      }
    }
  }

  draw(ctx) {
    if (this.dead) return;
    if (this.inv > 0 && this.inv % 6 < 3) ctx.globalAlpha = 0.45;

    const f = this.frame;
    const bob = this.anim === 'run' ? Math.sin(f * 0.35) * 2 : 0;
    const squash = this.landT > 0 ? 1 + this.landT * 0.04 : 1;
    const stretchY = this.landT > 0 ? 1 - this.landT * 0.03 : 1;
    const x = this.x, y = this.y + bob;
    const cx = x + this.w / 2;
    const cy = y + this.h;

    ctx.save();
    if (this.landT > 0) {
      ctx.translate(cx, cy);
      ctx.scale(squash, stretchY);
      ctx.translate(-cx, -cy);
    }

    if (this.glowT > 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ccffaa';
      ctx.beginPath();
      ctx.arc(x + this.w / 2, y + this.h / 2, 80 + Math.sin(f * 0.2) * 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = this.inv > 0 && this.inv % 6 < 3 ? 0.45 : 1;
    }

    const hairWave = Math.sin(f * 0.08) * 2;
    ctx.fillStyle = '#6a3080';
    ctx.fillRect(x + 4, y + 2, 18, 10);
    ctx.fillRect(x + 2 + hairWave, y, 8, 14);
    ctx.fillRect(x + 16 - hairWave, y, 8, 14);

    ctx.fillStyle = '#ffd4c8';
    ctx.fillRect(x + 6, y + 10, 14, 10);

    ctx.fillStyle = '#4488aa';
    ctx.fillRect(x + 8, y + 13, 4, 3);
    ctx.fillRect(x + 14, y + 13, 4, 3);
    ctx.fillStyle = '#224466';
    ctx.fillRect(x + 9, y + 14, 2, 2);
    ctx.fillRect(x + 15, y + 14, 2, 2);

    ctx.fillStyle = '#3a8866';
    ctx.fillRect(x + 5, y + 20, 16, 14);
    ctx.fillStyle = '#2a6648';
    ctx.fillRect(x + 5, y + 30, 7, 6);
    ctx.fillRect(x + 14, y + 30, 7, 6);

    ctx.fillStyle = '#ffb7d5';
    ctx.fillRect(x + 5, y + 22, 3, 8);
    ctx.fillRect(x + 18, y + 22, 3, 8);

    if (this.floatOn) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffaacc';
      for (let i = 0; i < 4; i++) {
        const px = x + 6 + i * 5 + Math.sin(f * 0.15 + i) * 3;
        const py = y + 34 + Math.cos(f * 0.12 + i) * 2;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.anim === 'dash') {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffb7d5';
      ctx.fillRect(x - this.face * 18, y + 8, 16, 20);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export class Camera {
  constructor() {
    this.x = 0; this.y = 0; this.sh = 0;
  }

  follow(t, mw, mh) {
    this.x += ((t.x + t.w / 2 - 640) - this.x) * 0.09;
    let targetY = t.y + t.h / 2 - 360;
    targetY = Math.max(0, Math.min(targetY, Math.max(0, mh - 720)));
    this.y += (targetY - this.y) * 0.09;
    if (t.y < this.y + PLAY_TOP) {
      this.y = Math.max(0, Math.min(this.y, t.y - PLAY_TOP + 10));
    }
    this.x = Math.max(0, Math.min(this.x, mw - 1280));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, mh - 720)));
    if (this.sh > 0) this.sh *= 0.82;
    if (this.sh < 0.4) this.sh = 0;
  }

  shake(n = 6) { this.sh = n; }

  apply(ctx) {
    const sx = (Math.random() - 0.5) * this.sh;
    const sy = (Math.random() - 0.5) * this.sh;
    ctx.translate(-Math.floor(this.x + sx), -Math.floor(this.y + sy));
  }

  reset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
}
