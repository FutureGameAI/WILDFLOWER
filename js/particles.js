export class Particles {
  constructor() { this.list = []; }

  burst(x, y, n, col, spd = 4) {
    for (let i = 0; i < n; i++) {
      this.list.push({
        x, y,
        vx: (Math.random() - 0.5) * spd,
        vy: (Math.random() - 0.5) * spd - 1,
        life: 30 + Math.random() * 30,
        max: 50,
        c: col,
        s: 2 + Math.random() * 4,
      });
    }
  }

  spawn(x, y, col) {
    this.list.push({
      x, y, vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.5,
      life: 60 + Math.random() * 60, max: 120, c: col, s: 2 + Math.random() * 2,
    });
  }

  update() {
    for (const p of this.list) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
    }
    this.list = this.list.filter((p) => p.life > 0);
    while (this.list.length > 200) this.list.shift();
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class Fireflies {
  constructor(n, w, h) {
    this.ff = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      ph: Math.random() * 6.28,
    }));
  }

  update(w, h) {
    for (const f of this.ff) {
      f.x += f.vx; f.y += f.vy; f.ph += 0.04;
      if (f.x < 0) f.x = w; if (f.x > w) f.x = 0;
      if (f.y < 0) f.y = h; if (f.y > h) f.y = 0;
    }
  }

  draw(ctx, cam) {
    for (const f of this.ff) {
      const a = 0.3 + Math.sin(f.ph) * 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#aaff88';
      ctx.beginPath();
      ctx.arc(f.x - cam.x * 0.3, f.y - cam.y * 0.1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
