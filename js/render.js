import { W, H, T, BIOMES, SCORE_ITEMS, HUD_H, PLAY_TOP } from './constants.js';
import { LEVELS } from './levels.js';
import { drawTile, drawEnemy, drawPetal, drawScoreItem } from './world.js';

function drawCloud(ctx, cx, cy, scale, light) {
  const blobs = [
    [0, 0, 34], [28, -6, 26], [-26, -4, 24], [14, 8, 20], [-18, 6, 18], [38, 4, 16], [-36, 2, 14],
  ];
  ctx.save();
  ctx.globalAlpha = 0.92;

  const shadow = ctx.createLinearGradient(cx - 50 * scale, cy + 10 * scale, cx + 50 * scale, cy + 28 * scale);
  shadow.addColorStop(0, 'rgba(170,185,210,0.15)');
  shadow.addColorStop(1, 'rgba(120,135,165,0.35)');
  for (const [dx, dy, r] of blobs) {
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(cx + dx * scale, cy + (dy + 6) * scale, r * scale * 0.95, r * scale * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const [dx, dy, r] of blobs) {
    const g = ctx.createRadialGradient(
      cx + (dx - 6) * scale, cy + (dy - 8) * scale, 2,
      cx + dx * scale, cy + dy * scale, r * scale
    );
    g.addColorStop(0, light);
    g.addColorStop(0.55, 'rgba(248,252,255,0.88)');
    g.addColorStop(1, 'rgba(210,220,235,0.05)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + dx * scale, cy + dy * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSky(ctx, biome, time, cam) {
  const b = BIOMES[biome] || BIOMES.atrium;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, b.sky[0]);
  g.addColorStop(0.45, b.sky[1]);
  g.addColorStop(1, b.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const sunX = W * 0.78;
  const sunY = 90 + Math.sin(time * 0.008) * 8;
  const sunG = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
  sunG.addColorStop(0, 'rgba(255,240,200,0.55)');
  sunG.addColorStop(0.4, 'rgba(255,200,140,0.12)');
  sunG.addColorStop(1, 'rgba(255,180,120,0)');
  ctx.fillStyle = sunG;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  const cloudLight = biome === 'storm' ? 'rgba(220,225,240,0.75)' : 'rgba(255,255,255,0.98)';
  for (let layer = 0; layer < 4; layer++) {
    const par = 0.08 + layer * 0.07;
    const spd = 0.18 + layer * 0.08;
    const alpha = 0.35 + layer * 0.12;
    ctx.globalAlpha = alpha;
    const count = 5 + layer;
    for (let i = 0; i < count; i++) {
      const seed = i * 137 + layer * 991;
      const bx = ((seed * 1.7 - cam.x * par + time * spd) % (W + 420)) - 210;
      const by = 50 + layer * 55 + (seed % 40) + Math.sin(time * 0.012 + seed) * 12;
      const scale = 0.55 + layer * 0.22 + (seed % 10) * 0.03;
      drawCloud(ctx, bx, by, scale, cloudLight);
    }
  }
  ctx.restore();

  if (biome === 'atrium' || biome === 'greenhouse') {
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 12; i++) {
      const px = (i * 97 + time * 0.4) % W;
      const py = (i * 53 + Math.sin(time * 0.02 + i) * 30 + 100) % (H * 0.6);
      ctx.fillStyle = '#ffaacc';
      ctx.fillRect(px, py, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

export function drawWorld(ctx, world, biome, time, darkMode, iris) {
  const b = BIOMES[biome] || BIOMES.atrium;
  const glowR = iris?.glowT > 0 ? 200 : 90;
  const gx = iris ? iris.x + iris.w / 2 : 0;
  const gy = iris ? iris.y + iris.h / 2 : 0;

  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      const id = world.id(x, y);
      if (id === 0 && !world.dark) continue;
      if (SCORE_ITEMS[id]) {
        const px = x * T, py = y * T;
        drawScoreItem(ctx, id, px, py, time);
        continue;
      }
      const px = x * T, py = y * T;

      if (world.dark && id === 8) {
        const dist = iris ? Math.hypot(px + T / 2 - gx, py + T / 2 - gy) : 9999;
        const lit = glowR > 0 && dist < glowR;
        if (!lit) {
          ctx.fillStyle = '#050508';
          ctx.fillRect(px, py, T, T);
          continue;
        }
      }

      drawTile(ctx, id, px, py, b, time, world.dark);
    }
  }

  for (const p of world.petals) drawPetal(ctx, p, time);
  for (const e of world.enemies) drawEnemy(ctx, e, time);
}

export function drawDarkOverlay(ctx, world, iris, cam) {
  if (!world.dark || !iris) return;
  const sx = iris.x - cam.x + iris.w / 2;
  const sy = iris.y - cam.y + iris.h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';

  const torchR = iris.glowT > 0 ? 280 : 200;
  const torch = ctx.createRadialGradient(sx, sy, 12, sx, sy, torchR);
  torch.addColorStop(0, iris.glowT > 0 ? 'rgba(255,255,240,1)' : 'rgba(255,255,255,0.75)');
  torch.addColorStop(0.4, iris.glowT > 0 ? 'rgba(200,255,220,0.7)' : 'rgba(180,210,255,0.45)');
  torch.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = torch;
  ctx.beginPath();
  ctx.arc(sx, sy, torchR, 0, Math.PI * 2);
  ctx.fill();

  if (iris.glowT > 0) {
    const r = 340;
    const g = ctx.createRadialGradient(sx, sy, 24, sx, sy, r);
    g.addColorStop(0, 'rgba(255,255,240,0.9)');
    g.addColorStop(0.5, 'rgba(160,255,180,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPlayerInDark(ctx, iris) {
  if (!iris || iris.dead) return;
  const cx = iris.x + iris.w / 2;
  const cy = iris.y + iris.h / 2;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffb7d5';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(iris.x - 2, iris.y - 2, iris.w + 4, iris.h + 4);
  iris.draw(ctx);
  ctx.restore();
}

export function drawDangerVignette(ctx, intensity) {
  if (intensity <= 0) return;
  const a = Math.min(0.45, intensity * 0.5);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(120,0,20,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(255,0,40,${a * 0.8})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);
}

export { HUD_H, PLAY_TOP };

export const HELP_BTN = { x: W - 44, y: 54, w: 26, h: 22 };

export function hitHelpBtn(sx, sy) {
  const b = HELP_BTN;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return Math.hypot(sx - cx, sy - cy) <= b.w / 2 + 2;
}

export function drawHelpButton(ctx, open) {
  const b = HELP_BTN;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.fillStyle = open ? 'rgba(255,183,213,0.35)' : 'rgba(20,28,42,0.85)';
  ctx.strokeStyle = open ? '#ffb7d5' : 'rgba(136,204,170,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, b.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = open ? '#ffe8f0' : '#88ccaa';
  ctx.font = 'bold 15px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('?', cx, cy + 5);
  ctx.textAlign = 'left';
}

export function hitHelpPanel(sx, sy) {
  const pw = 272;
  const ph = 252;
  const px = Math.min(W - pw - 10, HELP_BTN.x + HELP_BTN.w - pw);
  const py = HELP_BTN.y + HELP_BTN.h + 10;
  return sx >= px && sx <= px + pw && sy >= py && sy <= py + ph;
}

export function drawHelpPanel(ctx) {
  const pw = 272;
  const ph = 252;
  const px = Math.min(W - pw - 10, HELP_BTN.x + HELP_BTN.w - pw);
  const py = HELP_BTN.y + HELP_BTN.h + 10;

  ctx.fillStyle = 'rgba(8,14,24,0.94)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,183,213,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffb7d5';
  ctx.font = 'bold 14px Georgia';
  ctx.fillText('Controls', px + 14, py + 24);

  const lines = [
    ['Move', 'A / D  or  Arrow Keys'],
    ['Jump', 'W  or  Up Arrow'],
    ['Float', 'Hold Space in air'],
    ['Ability', 'F  or  Left Click'],
    ['Pause', 'Escape'],
    ['Mobile', '◀ ▶  ↑  FLOAT  ✦  ⏸'],
  ];
  let ly = py + 46;
  for (const [label, keys] of lines) {
    ctx.fillStyle = '#88ccaa';
    ctx.font = '12px Georgia';
    ctx.fillText(label, px + 14, ly);
    ctx.fillStyle = '#ccddee';
    ctx.fillText(keys, px + 72, ly);
    ly += 22;
  }

  ctx.fillStyle = 'rgba(136,204,170,0.2)';
  ctx.fillRect(px + 12, py + ph - 52, pw - 24, 1);
  ctx.fillStyle = '#778899';
  ctx.font = '11px Georgia';
  ctx.fillText('Collect  *  $  G  orbs for score', px + 14, py + ph - 32);
  ctx.fillText('Click ? again to close', px + 14, py + ph - 14);
  ctx.textAlign = 'left';
}

export function drawHUD(ctx, lvl, save, iris, dlg, runScore = 0, combo = 0, displayScore = 0, lvlIdx = 0, lvlTotal = 15, worldRank = 1, sessionFrames = 0, progress = 0, showHelp = false) {
  const mins = Math.floor(sessionFrames / 3600);
  const secs = Math.floor((sessionFrames / 60) % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  ctx.fillStyle = 'rgba(6,10,20,0.92)';
  ctx.fillRect(0, 0, W, 58);
  ctx.fillStyle = 'rgba(6,10,20,0.78)';
  ctx.fillRect(0, 58, W, 22);
  ctx.strokeStyle = 'rgba(136,204,170,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 58);
  ctx.lineTo(W, 58);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,183,213,0.35)';
  ctx.fillRect(0, 78, W * Math.min(1, Math.max(0, progress)), 2);

  ctx.fillStyle = 'rgba(255,183,213,0.12)';
  ctx.fillRect(10, 10, 48, 38);
  ctx.strokeStyle = 'rgba(255,183,213,0.35)';
  ctx.strokeRect(10, 10, 48, 38);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#88ccaa';
  ctx.font = '10px Georgia';
  ctx.fillText('LVL', 34, 22);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px Georgia';
  ctx.fillText(`${lvlIdx + 1}/${lvlTotal}`, 34, 42);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffb7d5';
  ctx.font = 'bold 16px Georgia';
  const lvlName = lvl.name.length > 18 ? `${lvl.name.slice(0, 16)}…` : lvl.name;
  ctx.fillText(lvlName, 66, 26);
  ctx.fillStyle = '#556677';
  ctx.font = '11px Georgia';
  ctx.fillText('score', 66, 40);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 26px Georgia';
  const scoreStr = `${Math.floor(displayScore)}`;
  ctx.fillText(scoreStr, 66, 52);
  let sx = 66 + ctx.measureText(scoreStr).width + 12;
  if (save.bestScore > 0) {
    ctx.fillStyle = '#556677';
    ctx.font = '11px Georgia';
    ctx.fillText(`best ${save.bestScore}`, sx, 52);
    sx += ctx.measureText(`best ${save.bestScore}`).width + 10;
  }
  if (combo > 1) {
    ctx.fillStyle = '#ff88cc';
    ctx.font = 'bold 12px Georgia';
    ctx.fillText(`×${combo}`, sx, 52);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#cce8ff';
  ctx.font = '13px Georgia';
  ctx.fillText(save.username || 'Iris', W / 2, 24);
  ctx.fillStyle = '#778899';
  ctx.font = '12px Georgia';
  ctx.fillText(`Rank #${worldRank}   ·   Petals ${save.petals}/4`, W / 2, 44);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#667788';
  ctx.font = '12px Georgia';
  ctx.fillText(timeStr, W - 14, 22);
  for (let i = 0; i < iris.maxHp; i++) {
    const hx = W - 18 - (iris.maxHp - 1 - i) * 20;
    ctx.fillStyle = i < iris.hp ? '#ff5577' : '#2a2030';
    ctx.strokeStyle = i < iris.hp ? '#ff8899' : '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, 42, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.textAlign = 'left';

  const abs = ['float', 'dash', 'glow', 'seed'];
  const pillW = 72;
  const gap = 8;
  const totalW = abs.length * pillW + (abs.length - 1) * gap;
  let ax = (W - totalW) / 2;
  for (const a of abs) {
    const on = save.ab[a];
    ctx.fillStyle = on ? 'rgba(60,120,90,0.85)' : 'rgba(30,35,48,0.9)';
    ctx.fillRect(ax, 62, pillW, 16);
    ctx.strokeStyle = on ? 'rgba(136,255,170,0.5)' : 'rgba(80,80,100,0.4)';
    ctx.strokeRect(ax, 62, pillW, 16);
    ctx.fillStyle = on ? '#eaffee' : '#667';
    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(a.toUpperCase(), ax + pillW / 2, 74);
    ax += pillW + gap;
  }
  ctx.textAlign = 'left';

  drawHelpButton(ctx, showHelp);
  if (showHelp) drawHelpPanel(ctx);

  if (dlg) {
    ctx.fillStyle = 'rgba(12,18,30,0.92)';
    ctx.fillRect(40, H - 130, W - 80, 100);
    ctx.strokeStyle = '#ffb7d5';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, H - 130, W - 80, 100);
    ctx.fillStyle = '#ffb7d5';
    ctx.font = 'bold 16px Georgia';
    ctx.fillText(dlg.speaker, 56, H - 102);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = '16px Georgia';
    const t = dlg.text.slice(0, dlg.ch);
    ctx.fillText(t, 56, H - 72);
    ctx.fillStyle = '#668';
    ctx.font = '13px Georgia';
    ctx.fillText('Space or Click to continue', 56, H - 44);
  }
}

function levelMapNodePos(idx) {
  const cols = 5;
  const row = Math.floor(idx / cols);
  const colInRow = idx % cols;
  const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
  return { x: 150 + col * 235, y: 248 + row * 108 };
}

function drawMapPath(ctx, nodes) {
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - (Math.abs(a.y - b.y) < 20 ? 28 : 0);
    ctx.strokeStyle = 'rgba(136,204,170,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

export function drawLevelMap(ctx, currentIdx, timer, mapMode = 'start') {
  const total = LEVELS.length;
  const fade = Math.min(1, timer / 35);
  const hold = timer < 260 ? 1 : Math.max(0, 1 - (timer - 260) / 30);

  ctx.fillStyle = `rgba(4,8,18,${0.9 * fade * hold})`;
  ctx.fillRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, 620);
  bg.addColorStop(0, 'rgba(40,80,100,0.25)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = fade * hold;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#88ccaa';
  ctx.font = '13px Georgia';
  ctx.fillText('SKY GARDEN — JOURNEY MAP', W / 2, 52);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 34px Georgia';
  const headline = mapMode === 'advance'
    ? `You are now on Level ${currentIdx + 1}`
    : mapMode === 'continue'
      ? `Continuing — Level ${currentIdx + 1}`
      : `Level ${currentIdx + 1} of ${total}`;
  ctx.fillText(headline, W / 2, 92);

  const L = LEVELS[currentIdx];
  ctx.fillStyle = '#ffb7d5';
  ctx.font = 'bold 26px Georgia';
  ctx.fillText(L.name, W / 2, 126);

  const biome = L.biome.replace(/^\w/, (c) => c.toUpperCase());
  ctx.fillStyle = '#778899';
  ctx.font = '15px Georgia';
  let sub = biome;
  if (L.boss) sub += '  ·  Final Boss';
  else if (L.dark) sub += '  ·  Dark Cave';
  else if (L.unlock) sub += '  ·  New Power';
  ctx.fillText(sub, W / 2, 152);

  const nodes = LEVELS.map((_, i) => levelMapNodePos(i));
  drawMapPath(ctx, nodes);

  const pulse = 1 + Math.sin(timer * 0.1) * 0.12;
  for (let i = 0; i < total; i++) {
    const lv = LEVELS[i];
    const { x, y } = nodes[i];
    const done = i < currentIdx;
    const here = i === currentIdx;
    const locked = i > currentIdx;
    const r = here ? 22 * pulse : 16;
    const b = BIOMES[lv.biome] || BIOMES.atrium;

    if (here) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 8 + Math.sin(timer * 0.12) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = here
      ? b.accent
      : done
        ? 'rgba(255,215,0,0.75)'
        : locked
          ? 'rgba(35,42,58,0.95)'
          : b.ground;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = here ? '#fff' : done ? '#ffe8a0' : 'rgba(100,110,130,0.6)';
    ctx.lineWidth = here ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = here || done ? '#102018' : '#889';
    ctx.font = here ? 'bold 14px Georgia' : '12px Georgia';
    ctx.fillText(`${i + 1}`, x, y + 5);

    if (lv.boss && !locked) {
      ctx.fillStyle = '#ff4466';
      ctx.font = '9px Georgia';
      ctx.fillText('BOSS', x, y - r - 8);
    } else if (lv.dark && !locked) {
      ctx.fillStyle = '#aabbff';
      ctx.font = '9px Georgia';
      ctx.fillText('DARK', x, y - r - 8);
    }

    const label = lv.name.length > 11 ? `${lv.name.slice(0, 9)}…` : lv.name;
    ctx.fillStyle = here ? '#ffe8f0' : done ? '#ccddee' : '#556677';
    ctx.font = here ? 'bold 11px Georgia' : '10px Georgia';
    ctx.fillText(label, x, y + r + 16);

    if (here) {
      ctx.fillStyle = '#ffb7d5';
      ctx.beginPath();
      ctx.arc(x + r * 0.55, y - r * 0.45, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (done) {
      ctx.strokeStyle = '#aaffcc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 1);
      ctx.lineTo(x - 1, y + 5);
      ctx.lineTo(x + 6, y - 4);
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(12,20,32,0.85)';
  ctx.fillRect(W / 2 - 280, H - 118, 560, 52);
  ctx.strokeStyle = 'rgba(255,183,213,0.35)';
  ctx.strokeRect(W / 2 - 280, H - 118, 560, 52);

  ctx.fillStyle = '#ccddee';
  ctx.font = '14px Georgia';
  const tip = mapMode === 'advance'
    ? 'Portal crossed — prepare for the next garden path'
    : 'Follow the glowing node to begin this stage';
  ctx.fillText(tip, W / 2, H - 92);

  if (timer > 50) {
    const blink = Math.floor(timer / 28) % 2 === 0;
    ctx.fillStyle = blink ? '#88ccaa' : '#556677';
    ctx.font = '13px Georgia';
    ctx.fillText('Space / Click to start', W / 2, H - 68);
  }

  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

export function drawTitle(ctx, text, sub, timer, lvlIdx = 0, lvlTotal = 15) {
  drawLevelMap(ctx, lvlIdx, timer, 'start');
}

export function drawUnlock(ctx, name, timer, hint) {
  const a = Math.min(1, timer / 25);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffb7d5';
  ctx.font = 'bold 40px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('New Power Awakened', W / 2, H / 2 - 30);
  ctx.fillStyle = '#aaffcc';
  ctx.font = 'bold 32px Georgia';
  ctx.fillText(name, W / 2, H / 2 + 10);
  if (hint) {
    ctx.fillStyle = '#cce8ff';
    ctx.font = '18px Georgia';
    ctx.fillText(hint, W / 2, H / 2 + 48);
  }
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

export function drawDeath(ctx, timer) {
  const a = Math.min(1, timer / 20);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(10, 0, 20, 0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff4466';
  ctx.font = 'bold 72px Georgia';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff0044';
  ctx.shadowBlur = 20;
  ctx.fillText('YOU DIED', W / 2, H / 2 - 16);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '22px Georgia';
  const sub = timer > 90 ? 'Returning to the garden\'s start...' : 'All hearts lost...';
  ctx.fillText(sub, W / 2, H / 2 + 36);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

export function drawSoundHint(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(W / 2 - 160, H - 48, 320, 32);
  ctx.fillStyle = '#ffb7d5';
  ctx.font = '14px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('Tap anywhere to enable sound', W / 2, H - 28);
  ctx.textAlign = 'left';
}

export function drawPause(ctx, save, pauseBtns) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('Paused', W / 2, H / 2 - 90);
  ctx.font = '18px Georgia';
  ctx.fillStyle = '#cce8ff';
  ctx.fillText('Escape — Resume', W / 2, H / 2 - 52);

  const toggles = [
    { id: 'sfx', label: 'Sound Effects', on: save.sfxOn !== false, y: H / 2 - 6 },
    { id: 'music', label: 'Music', on: save.musicOn !== false, y: H / 2 + 44 },
  ];
  pauseBtns.length = 0;
  for (const t of toggles) {
    const bw = 280, bh = 44, bx = W / 2 - bw / 2;
    ctx.fillStyle = t.on ? 'rgba(60,120,90,0.85)' : 'rgba(50,50,70,0.85)';
    ctx.fillRect(bx, t.y, bw, bh);
    ctx.strokeStyle = t.on ? '#88ffaa' : '#667';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, t.y, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Georgia';
    ctx.fillText(`${t.label}: ${t.on ? 'ON' : 'OFF'}`, W / 2, t.y + 28);
    pauseBtns.push({ id: t.id, x: bx, y: t.y, w: bw, h: bh });
  }
  ctx.fillText('Escape — Resume  |  N — SFX  |  M — Music', W / 2, H / 2 + 96);
  ctx.textAlign = 'left';
}

export function drawPortalTransition(ctx, tr, iris, time, cam) {
  const t = tr.t;
  const cx = (tr.wx ?? W / 2) - (cam?.x ?? 0);
  const cy = (tr.wy ?? H / 2) - (cam?.y ?? 0);

  ctx.save();
  const pulse = 1 + Math.sin(t * 0.12) * 0.08;
  const r = 24 + t * 2.2 * pulse;

  for (let ring = 0; ring < 5; ring++) {
    const rr = r + ring * 18 + Math.sin(t * 0.08 + ring) * 6;
    ctx.strokeStyle = `hsla(${160 + ring * 25}, 90%, ${60 + ring * 5}%, ${0.55 - ring * 0.08})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r + 40);
  g.addColorStop(0, `rgba(255,255,255,${Math.min(0.95, t / 35)})`);
  g.addColorStop(0.35, `rgba(120,255,180,${Math.min(0.6, t / 50)})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 50, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2 + t * 0.06;
    const dist = r + 10 + (i % 3) * 8;
    ctx.fillStyle = `hsla(${200 + i * 6}, 80%, 70%, 0.8)`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 3 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }

  if (iris && t < 55) {
    const shrink = Math.max(0.15, 1 - t / 55);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(shrink, shrink);
    const saved = { x: iris.x, y: iris.y };
    iris.x = -iris.w / 2;
    iris.y = -iris.h / 2;
    iris.draw(ctx);
    iris.x = saved.x;
    iris.y = saved.y;
    ctx.restore();
  }

  if (t > 40) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, (t - 40) / 28)})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

export function drawScorePopups(ctx, popups, cam) {
  for (const p of popups) {
    const a = Math.max(0, 1 - p.t / 50);
    const sx = p.x - cam.x;
    const sy = p.y - cam.y - p.t * 0.6;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col || '#ffd700';
    ctx.font = 'bold 22px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, sx, sy);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawCollectHint(ctx) {
  const x = 12, y = H - 56, w = 248, h = 28;
  ctx.fillStyle = 'rgba(8,14,24,0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,215,0,0.45)';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#ccddee';
  ctx.font = '12px Georgia';
  ctx.fillText('Orbs:  * Pollen +30   $ Dew +80   G Sun +200', x + 10, y + 19);
}

export function drawToasts(ctx, toasts) {
  ctx.font = '13px Georgia';
  let y = 88;
  for (const t of toasts.slice(-2)) {
    const a = t.t < 15 ? t.t / 15 : t.t > 100 ? (120 - t.t) / 20 : 1;
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    const text = t.text.length > 48 ? `${t.text.slice(0, 46)}…` : t.text;
    const tw = Math.min(420, Math.max(200, ctx.measureText(text).width + 32));
    ctx.fillStyle = 'rgba(8,16,28,0.9)';
    ctx.fillRect(W / 2 - tw / 2, y, tw, 28);
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.strokeRect(W / 2 - tw / 2, y, tw, 28);
    ctx.fillStyle = '#ffe8a0';
    ctx.font = '13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y + 19);
    y += 34;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawFloatMeter(ctx, iris) {
  if (!iris?.ab?.float) return;
  const pct = iris.floatFuel / iris.floatMax;
  const bx = W / 2 - 80, by = H - 28;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(bx, by, 160, 10);
  ctx.fillStyle = pct > 0.25 ? '#ffb7d5' : '#ff4466';
  ctx.fillRect(bx, by, 160 * pct, 10);
  ctx.strokeStyle = '#88ccaa';
  ctx.strokeRect(bx, by, 160, 10);
  ctx.fillStyle = '#cce8ff';
  ctx.font = '11px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(`FLOAT  ${Math.ceil(iris.floatFuel)}`, W / 2, by - 4);
  ctx.textAlign = 'left';
}

export function drawRain(ctx, time) {
  ctx.strokeStyle = 'rgba(180,220,255,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 120; i++) {
    const x = (i * 37 + time * 4) % W;
    const y = (i * 19 + time * 10) % H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + 18);
    ctx.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const sx = (i * 113 + time * 2) % W;
    const sy = H - 40 + Math.sin(time * 0.05 + i) * 8;
    ctx.fillStyle = `rgba(120,200,160,${0.15 + Math.sin(time * 0.08 + i) * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 8 + (i % 4) * 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
