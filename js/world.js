import { T, TILE, MAP, SCORE_ITEMS } from './constants.js';

export class World {
  constructor(data) {
    this.name = data.name;
    this.biome = data.biome;
    this.w = data.rows[0].length;
    this.h = data.rows.length;
    this.tiles = new Uint8Array(this.w * this.h);
    this.petals = [];
    this.enemies = [];
    this.dark = data.dark || false;
    this.lvlId = data.id ?? 0;
    this.floatCeil = null;

    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.tiles[y * this.w + x] = MAP[data.rows[y][x]] ?? 0;
      }
    }

    if (data.petal) this.petals.push({ x: data.petal.x * T + 8, y: data.petal.y * T + 8, got: false });
    if (data.enemies) {
      for (const e of data.enemies) {
        const ey = e.y * T;
        this.enemies.push({
          ...e, x: e.x * T, y: ey, hp: e.hp || 2, maxHp: e.hp || 2,
          alive: true, t: 0, baseY: ey, vx: e.vx,
        });
      }
    }
  }

  idx(x, y) { return y * this.w + x; }
  id(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 0;
    return this.tiles[this.idx(tx, ty)];
  }

  set(tx, ty, v) {
    if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.tiles[this.idx(tx, ty)] = v;
  }

  surfaceY(tx, ty, tile) {
    if (tile === TILE.PLAT) return ty * T + T - 10;
    return ty * T;
  }

  solid(tile, tx, ty, p, vert) {
    if (SCORE_ITEMS[tile]) return false;
    if (tile === TILE.EMPTY || tile === TILE.CHECK || tile === TILE.GOAL) return false;
    if (tile === TILE.DARK) return false;
    if (tile === TILE.VINE) return true;

    if (tile === TILE.PLAT) {
      if (!vert || p.vy <= 0) return false;
      const surface = this.surfaceY(tx, ty, tile);
      const prevFeet = p.y + p.h - p.vy;
      const feet = p.y + p.h;
      return prevFeet <= surface + 6 && feet >= surface - 8;
    }

    return tile === TILE.SOLID || tile === TILE.SPIKE || tile === TILE.BREAK || tile === TILE.CRYSTAL;
  }

  hasVinesNear(cx, cy, r) {
    const r2 = r * r;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.id(x, y) !== TILE.VINE) continue;
        const px = x * T + T / 2, py = y * T + T / 2;
        if ((px - cx) ** 2 + (py - cy) ** 2 < r2) return true;
      }
    }
    return false;
  }

  burnVines(cx, cy, r) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.id(x, y) !== TILE.VINE) continue;
        const px = x * T + T / 2, py = y * T + T / 2;
        if ((px - cx) ** 2 + (py - cy) ** 2 < r * r) this.set(x, y, TILE.EMPTY);
      }
    }
  }

  breakAt(cx, cy, r) {
    let hit = false;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const t = this.id(x, y);
        if (t !== TILE.BREAK && t !== TILE.CRYSTAL) continue;
        const px = x * T + T / 2, py = y * T + T / 2;
        if ((px - cx) ** 2 + (py - cy) ** 2 < r * r) {
          this.set(x, y, TILE.EMPTY);
          hit = true;
        }
      }
    }
    return hit;
  }

  goalPos() {
    for (let y = 0; y < this.h; y++) {
      const x = this.rows?.indexOf?.('!') ?? -1;
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.id(x, y) === TILE.GOAL) return { x, y };
      }
    }
    return null;
  }

  updateEnemies(p) {
    const agg = 1 + this.lvlId * 0.07;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.t++;
      if (e.type === 'wisp') {
        const dx = (p.x + p.w / 2) - (e.x + 14);
        const dy = (p.y + p.h / 2) - (e.y + 14);
        const dist = Math.hypot(dx, dy) || 1;
        const chase = Math.min(1.8 * agg, dist * 0.02 * agg);
        e.x += (dx / dist) * chase + Math.sin(e.t * 0.05) * 0.8;
        e.y += (dy / dist) * chase * 0.6 + Math.cos(e.t * 0.04) * 0.5;
      } else if (e.type === 'thorn') {
        e.x += (e.vx || 1.2) * agg;
        if (e.x < e.l * T || e.x > e.r * T) e.vx = -(e.vx || 1.2);
      } else if (e.type === 'spore') {
        e.x += (e.vx || 0.9) * agg;
        if (e.x < e.l * T || e.x > e.r * T) e.vx = -(e.vx || 0.9);
        e.y = e.baseY + Math.sin(e.t * 0.06) * 4;
      } else if (e.type === 'blight') {
        const dx = p.x - (e.x + 24);
        const spd = e.hp <= (e.maxHp || 8) / 2 ? 2.1 : 1.35;
        if (Math.abs(dx) > 8) e.x += Math.sign(dx) * spd;
        e.x = Math.max(38 * T, Math.min(56 * T, e.x));
        if (e.t % 100 === 0) e.y -= 36;
        if (e.y < e.baseY - 55) e.y = e.baseY;
      }
      if (!p.dead && p.inv <= 0 &&
          Math.abs(p.x + p.w / 2 - (e.x + 14)) < 22 && Math.abs(p.y + p.h / 2 - (e.y + 14)) < 26) {
        return p.hurt() ? 'dead' : 'hurt';
      }
    }
    return null;
  }

  hitEnemies(burst) {
    if (!burst) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if ((e.x - burst.x) ** 2 + (e.y - burst.y) ** 2 < burst.r * burst.r) {
        e.hp--;
        if (e.hp <= 0) e.alive = false;
      }
    }
  }
}

export function drawTile(ctx, tile, px, py, biome, time, dark) {
  const g = biome.ground, a = biome.accent;
  switch (tile) {
    case TILE.SOLID:
      ctx.fillStyle = g;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(px + 3, py + 3, T - 6, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px, py + T - 4, T, 4);
      ctx.fillStyle = a;
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 6 + i * 10, py + 1, 4, 7);
      break;
    case TILE.PLAT:
      ctx.fillStyle = '#6a8a70';
      ctx.fillRect(px, py + T - 10, T, 10);
      ctx.fillStyle = a;
      ctx.fillRect(px + 2, py + T - 12, T - 4, 4);
      break;
    case TILE.SPIKE:
      ctx.fillStyle = '#553355';
      ctx.fillRect(px, py + T - 6, T, 6);
      ctx.fillStyle = '#cc4466';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(px + 4 + i * 10, py + T - 6);
        ctx.lineTo(px + 9 + i * 10, py + 8);
        ctx.lineTo(px + 14 + i * 10, py + T - 6);
        ctx.fill();
      }
      break;
    case TILE.VINE:
      ctx.fillStyle = '#1a331a';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#336633';
      ctx.fillRect(px + 12, py + 2, 16, T - 4);
      ctx.fillStyle = '#cc6644';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px + 8 + i * 12, py + T - 4);
        ctx.lineTo(px + 14 + i * 12, py + 10);
        ctx.lineTo(px + 20 + i * 12, py + T - 4);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,100,80,0.35)';
      ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
      break;
    case TILE.BREAK:
      ctx.fillStyle = '#5a4a40';
      ctx.fillRect(px, py, T, T);
      ctx.strokeStyle = '#3a2a20';
      ctx.strokeRect(px + 4, py + 4, T - 8, T - 8);
      break;
    case TILE.CRYSTAL:
      ctx.fillStyle = `hsla(${280 + Math.sin(time * 0.05) * 20}, 70%, 60%, 0.85)`;
      ctx.beginPath();
      ctx.moveTo(px + T / 2, py + 2);
      ctx.lineTo(px + T - 4, py + T - 4);
      ctx.lineTo(px + 4, py + T - 4);
      ctx.fill();
      break;
    case TILE.CHECK: {
      const cx = px + T / 2, cy = py + T / 2;
      const bob = Math.sin(time * 0.08) * 3;
      ctx.fillStyle = 'rgba(255,215,0,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 22 + Math.sin(time * 0.1) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(px + 16, py + 4 + bob, 8, 28);
      ctx.fillStyle = '#ff8844';
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 28 + bob);
      ctx.lineTo(px + 20, py + 14 + bob);
      ctx.lineTo(px + 32, py + 28 + bob);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('SAVE', cx, py - 4 + bob);
      ctx.textAlign = 'left';
      break;
    }
    case TILE.GOAL: {
      const pulse = 16 + Math.sin(time * 0.1) * 4;
      const cx = px + T / 2, cy = py + T / 2;
      for (let ring = 0; ring < 3; ring++) {
        ctx.strokeStyle = `hsla(${170 + ring * 20}, 90%, 65%, ${0.35 + Math.sin(time * 0.08 + ring) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, pulse + ring * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulse + 6);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, `hsla(${160 + Math.sin(time * 0.08) * 30}, 90%, 70%, 0.95)`);
      g.addColorStop(1, 'rgba(120,255,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, pulse + 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TILE.DARK:
      if (dark) {
        ctx.fillStyle = '#0a0810';
        ctx.fillRect(px, py, T, T);
      }
      break;
    default:
      if (SCORE_ITEMS[tile]) drawScoreItem(ctx, tile, px, py, time);
      break;
  }
}

export function drawScoreItem(ctx, tile, px, py, time) {
  const item = SCORE_ITEMS[tile];
  const cx = px + T / 2, cy = py + T / 2;
  const bob = Math.sin(time * 0.09 + px * 0.01) * 4;
  const pulse = 10 + Math.sin(time * 0.12 + py) * 2;

  ctx.fillStyle = `${item.color}33`;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, pulse + 8, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(cx - 3, cy + bob - 3, 1, cx, cy + bob, pulse);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, item.color);
  g.addColorStop(1, `${item.color}00`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(`+${item.value}`, cx, cy + bob + 18);
  ctx.textAlign = 'left';
}

export function drawEnemy(ctx, e, time) {
  if (!e.alive) return;
  const cx = e.x + 14, cy = e.y + 14;
  const pulse = 0.35 + Math.sin(time * 0.12 + e.x * 0.01) * 0.25;

  ctx.save();
  ctx.globalAlpha = pulse * 0.5;
  ctx.fillStyle = '#ff0022';
  ctx.beginPath();
  ctx.arc(cx, cy, 28 + Math.sin(time * 0.1) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,50,50,${0.4 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 32 + Math.sin(time * 0.08) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ff2244';
  ctx.font = 'bold 14px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('!', cx, cy - 22 + Math.sin(time * 0.15) * 2);

  if (e.type === 'wisp') {
    const bob = Math.sin(time * 0.1) * 3;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#1a0820';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, 16, 18 + Math.sin(time * 0.08) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1133';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2 + bob, 4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 2 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 4, cy - 3 + bob, 2, 3);
    ctx.fillRect(cx + 2, cy - 3 + bob, 2, 3);
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 8 + bob);
    ctx.lineTo(cx, cy + 4 + bob);
    ctx.lineTo(cx + 6, cy + 8 + bob);
    ctx.fill();
    ctx.strokeStyle = '#ff6688';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + time * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx, cy + bob);
      ctx.lineTo(cx + Math.cos(ang) * 22, cy + bob + Math.sin(ang) * 22);
      ctx.stroke();
    }
  } else if (e.type === 'thorn') {
    ctx.fillStyle = '#2a1020';
    ctx.fillRect(e.x + 2, e.y + 10, 28, 22);
    ctx.fillStyle = '#ff2244';
    for (let i = 0; i < 5; i++) {
      const sx = e.x + 4 + i * 6;
      ctx.beginPath();
      ctx.moveTo(sx, e.y + 32);
      ctx.lineTo(sx + 3, e.y + 4);
      ctx.lineTo(sx + 6, e.y + 32);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.arc(cx, e.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 3, e.y + 6, 2, 3);
    ctx.fillRect(cx + 1, e.y + 6, 2, 3);
  } else if (e.type === 'spore') {
    const bob = Math.sin(time * 0.08) * 3;
    ctx.fillStyle = '#331144';
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 14 + Math.sin(time * 0.1) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#662266';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 4 + bob, 5, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 2 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0022';
    ctx.fillRect(cx - 5, cy - 6 + bob, 3, 4);
    ctx.fillRect(cx + 2, cy - 5 + bob, 3, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 4, cy - 5 + bob, 1, 2);
    ctx.fillRect(cx + 3, cy - 4 + bob, 1, 2);
    ctx.strokeStyle = '#aa0044';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 10, cy + bob + Math.sin(a) * 10);
      ctx.lineTo(cx + Math.cos(a) * 18, cy + bob + Math.sin(a) * 18);
      ctx.stroke();
    }
  } else if (e.type === 'blight') {
    const r = 28 + Math.sin(time * 0.06) * 5;
    ctx.fillStyle = '#120008';
    ctx.beginPath();
    ctx.arc(cx + 10, cy + 10, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff0044';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx + 10, cy + 10, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ff1133';
    ctx.beginPath();
    ctx.arc(cx + 6, cy + 6, 9, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(cx + 3, cy + 4, 4, 5);
    ctx.fillRect(cx + 15, cy + 5, 3, 4);
    if (e.hp < (e.maxHp || 8)) {
      ctx.fillStyle = '#440000';
      ctx.fillRect(e.x, e.y - 14, 48, 6);
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(e.x, e.y - 14, 48 * (e.hp / (e.maxHp || 8)), 6);
    }
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawPetal(ctx, p, time) {
  if (p.got) return;
  ctx.save();
  ctx.translate(p.x + 12, p.y + 12);
  ctx.rotate(time * 0.02);
  ctx.fillStyle = '#ffb7d5';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff88aa';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
