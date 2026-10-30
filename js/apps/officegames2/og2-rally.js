(() => {
  const WIDTH = 640;
  const HEIGHT = 400;
  const HORIZON = 140;
  const CAMERA_DISTANCE = 3;
  const HALF_ROAD = 250;
  const WALL_X = 1.3;
  const CURVE_SCALE = 0.0012;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';
  const FOG = [48, 58, 84];
  const SPAN = HEIGHT - HORIZON;

  function mix(color, fog) {
    return `rgb(${Math.round(color[0] + (FOG[0] - color[0]) * fog)},${Math.round(color[1] + (FOG[1] - color[1]) * fog)},${Math.round(color[2] + (FOG[2] - color[2]) * fog)})`;
  }

  class RallyApp {
    constructor() {
      this.winId = 'og2_rally';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Ралли на колёсиках',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-rally-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="time"></span>
            <span data-cell="speed"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2RallyEngine();
      this.mode = 'ready';
      this.held = { left: false, right: false, push: false, brake: false };
      this.floaters = [];
      this.rowOffset = new Float32Array(HEIGHT + 1);
      this.shake = 0;
      this.tilt = 0;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        up: (e) => this.onKeyUp(e),
        boss: (shown) => {
          this.releaseKeys();
          if (shown && this.mode === 'play') this.mode = 'paused';
        }
      });
      this.canvas.addEventListener('mousedown', () => this.primaryAction());
      this.updateStatus();
      this.frame = requestAnimationFrame((now) => this.loop(now));
    }

    dispose() {
      if (this.stopKeys) this.stopKeys();
      cancelAnimationFrame(this.frame);
      this.stopKeys = null;
      this.frame = null;
      this.win = null;
    }

    releaseKeys() {
      Object.keys(this.held).forEach(k => { this.held[k] = false; });
    }

    role(key) {
      if (key === 'arrowleft' || key === 'a') return 'left';
      if (key === 'arrowright' || key === 'd') return 'right';
      if (key === 'arrowup' || key === 'w') return 'push';
      if (key === 'arrowdown' || key === 's') return 'brake';
      return null;
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      const role = this.role(key);
      if (role) {
        e.preventDefault();
        this.held[role] = true;
        return;
      }
      if (key === ' ') {
        e.preventDefault();
        if (this.mode === 'play') this.held.push = true;
        else this.primaryAction();
      } else if (key === 'enter') {
        this.primaryAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') {
          this.mode = 'paused';
          this.releaseKeys();
        } else if (this.mode === 'paused') {
          this.mode = 'play';
        }
      }
    }

    onKeyUp(e) {
      const key = e.key.toLowerCase();
      const role = this.role(key);
      if (role) this.held[role] = false;
      else if (key === ' ') this.held.push = false;
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'won') {
        this.engine.nextLevel();
        this.floaters = [];
        this.mode = 'play';
        this.updateStatus();
      } else if (this.mode === 'lost') {
        this.engine.restart();
        this.floaters = [];
        this.recordBeaten = false;
        this.mode = 'play';
        this.updateStatus();
      }
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'play' && !window.Og2.isBossShown(this.winId)) {
        const events = this.engine.update(dt, this.held);
        events.forEach(event => this.react(event));
      }
      this.shake = Math.max(0, this.shake - dt);
      const steer = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
      this.tilt += (steer * 0.12 - this.tilt) * Math.min(1, dt * 8);
      this.floaters.forEach(f => {
        f.life -= dt;
        f.y -= 24 * dt;
      });
      this.floaters = this.floaters.filter(f => f.life > 0);
      this.draw(now / 1000);
      this.updateStatus();
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    say(text, color) {
      this.floaters.push({ text, color, x: WIDTH / 2, y: 190, life: 1.3 });
    }

    react(event) {
      const beep = window.Og2.beep;
      if (event === 'crash') {
        beep(100, 0.25, 'sawtooth', 0.07);
        this.shake = 0.4;
        this.say('Бум!', '#ff8a7a');
      } else if (event === 'puddle') {
        beep(190, 0.2, 'sawtooth', 0.05);
        this.say('Лужа!', '#8ec8ff');
      } else if (event === 'coffee') {
        beep(900, 0.05, 'triangle');
        beep(1300, 0.08, 'triangle');
        this.say('Кофе! Турбо', '#ffd36a');
      } else if (event === 'checkpoint') {
        [700, 900, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.08, 'triangle'), i * 80));
        this.say('Контрольная точка! +' + Math.max(10, 16 - this.engine.level) + ' с', '#8fe08f');
      } else if (event === 'win') {
        [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle'), i * 110));
        this.mode = 'won';
        this.recordBeaten = window.Og2.submitScore('rally', this.engine.score) || this.recordBeaten;
      } else if (event === 'timeUp') {
        beep(110, 0.5, 'sawtooth', 0.07);
        this.mode = 'lost';
        this.recordBeaten = window.Og2.submitScore('rally', this.engine.score) || this.recordBeaten;
      }
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.time.textContent = 'Время: ' + Math.ceil(e.timeLeft) + ' с';
      this.cells.speed.textContent = 'Скорость: ' + Math.round(e.speed * 3.6) + ' км/ч';
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('rally'), e.score);
    }

    rowGeometry(row) {
      const t = (row - HORIZON) / SPAN;
      return { t, zRel: CAMERA_DISTANCE / t - CAMERA_DISTANCE };
    }

    draw(time) {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.save();
      if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * this.shake * 2.5, (Math.random() - 0.5) * 8 * this.shake * 2.5);
      const ceiling = ctx.createLinearGradient(0, 0, 0, HORIZON + 20);
      ceiling.addColorStop(0, '#d8d4c4');
      ceiling.addColorStop(1, '#8a8a90');
      ctx.fillStyle = ceiling;
      ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);
      const cameraX = e.x * 0.8;
      let offset = 0;
      let slope = 0;
      const rows = [];
      for (let y = HEIGHT; y > HORIZON; y--) {
        const { t, zRel } = this.rowGeometry(y);
        const dz = CAMERA_DISTANCE / (t * t * SPAN);
        slope += e.curveAt(e.z + zRel) * dz * CURVE_SCALE;
        offset += slope * dz;
        this.rowOffset[y] = offset;
        rows.push({ y, t, zRel, cx: WIDTH / 2 + (offset - cameraX) * HALF_ROAD * t, world: e.z + zRel });
      }
      rows.reverse();
      this.drawCeilingAndWalls(rows);
      this.drawFloor(rows);
      this.drawObjects(rows, cameraX);
      this.drawChair(time);
      ctx.restore();
      this.drawEffects(time);
      this.drawHud();
      this.drawMessage();
    }

    drawFloor(rows) {
      const ctx = this.ctx;
      rows.forEach(row => {
        const fog = Math.min(0.8, row.zRel / 90);
        const left = row.cx - WALL_X * HALF_ROAD * row.t;
        const right = row.cx + WALL_X * HALF_ROAD * row.t;
        const tile = Math.floor(row.world / 3) % 2;
        ctx.fillStyle = mix(tile ? [66, 98, 128] : [58, 88, 118], fog);
        ctx.fillRect(left, row.y, right - left, 1);
        ctx.fillStyle = mix([230, 226, 200], fog);
        const lineW = Math.max(1, 0.035 * HALF_ROAD * row.t);
        ctx.fillRect(row.cx - HALF_ROAD * row.t - lineW, row.y, lineW * 2, 1);
        ctx.fillRect(row.cx + HALF_ROAD * row.t - lineW, row.y, lineW * 2, 1);
        if (Math.floor(row.world / 4) % 2 === 0) ctx.fillRect(row.cx - lineW * 0.6, row.y, lineW * 1.2, 1);
      });
    }

    drawCeilingAndWalls(rows) {
      const ctx = this.ctx;
      for (let i = 0; i < rows.length - 2; i += 2) {
        const near = rows[i];
        const far = rows[i + 2];
        const fog = Math.min(0.8, near.zRel / 90);
        const topNear = HORIZON - (near.y - HORIZON) * 0.9;
        const topFar = HORIZON - (far.y - HORIZON) * 0.9;
        const panel = Math.floor(near.world / 2) % 2;
        [-1, 1].forEach(side => {
          const xNear = near.cx + side * WALL_X * HALF_ROAD * near.t;
          const xFar = far.cx + side * WALL_X * HALF_ROAD * far.t;
          ctx.fillStyle = mix(panel ? [200, 194, 170] : [190, 184, 160], fog);
          ctx.beginPath();
          ctx.moveTo(xNear, near.y);
          ctx.lineTo(xNear, topNear);
          ctx.lineTo(xFar, topFar);
          ctx.lineTo(xFar, far.y);
          ctx.closePath();
          ctx.fill();
          const phase = Math.floor(near.world / 8);
          const local = near.world - phase * 8;
          if ((phase + (side > 0 ? 1 : 0)) % 3 === 0 && local > 1 && local < 5) {
            const doorNear = HORIZON - (near.y - HORIZON) * 0.25;
            const doorFar = HORIZON - (far.y - HORIZON) * 0.25;
            ctx.fillStyle = mix([138, 98, 58], fog);
            ctx.beginPath();
            ctx.moveTo(xNear, near.y);
            ctx.lineTo(xNear, doorNear);
            ctx.lineTo(xFar, doorFar);
            ctx.lineTo(xFar, far.y);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = mix([120, 116, 100], fog);
          ctx.fillRect(Math.min(xNear, xFar) - 1, near.y - Math.max(1, (near.y - HORIZON) * 0.06), 3, Math.max(1, (near.y - HORIZON) * 0.06));
        });
        const lampOn = Math.floor(near.world / 6) % 2 === 0;
        const xl = near.cx - WALL_X * HALF_ROAD * near.t;
        const xr = near.cx + WALL_X * HALF_ROAD * near.t;
        ctx.fillStyle = lampOn ? mix([255, 252, 220], fog * 0.6) : mix([150, 150, 150], fog);
        ctx.fillRect(xl + (xr - xl) * 0.3, topNear, (xr - xl) * 0.4, 2);
      }
    }

    drawObjects(rows, cameraX) {
      const e = this.engine;
      const visible = e.objects
        .filter(o => !o.hit || o.type === 'puddle')
        .map(o => ({ o, zRel: o.z - e.z }))
        .filter(item => item.zRel > 0.3 && item.zRel < 80)
        .sort((a, b) => b.zRel - a.zRel);
      visible.forEach(({ o, zRel }) => {
        const t = CAMERA_DISTANCE / (zRel + CAMERA_DISTANCE);
        const y = HORIZON + t * SPAN;
        const unit = HALF_ROAD * t;
        const cx = WIDTH / 2 + (this.rowOffset[Math.min(HEIGHT, Math.round(y))] - cameraX) * unit + e.objectX(o) * unit;
        this.drawObject(o, cx, y, unit, Math.min(0.8, zRel / 90));
      });
    }

    drawObject(o, x, y, u, fog) {
      const ctx = this.ctx;
      if (o.type === 'box') {
        ctx.fillStyle = mix([150, 108, 60], fog);
        ctx.fillRect(x - 0.26 * u, y - 0.5 * u, 0.52 * u, 0.5 * u);
        ctx.fillStyle = mix([190, 148, 92], fog);
        ctx.fillRect(x - 0.26 * u, y - 0.5 * u, 0.52 * u, 0.1 * u);
        ctx.fillStyle = mix([216, 192, 144], fog);
        ctx.fillRect(x - 0.05 * u, y - 0.5 * u, 0.1 * u, 0.5 * u);
      } else if (o.type === 'cart') {
        ctx.fillStyle = mix([230, 190, 40], fog);
        ctx.fillRect(x - 0.32 * u, y - 0.6 * u, 0.64 * u, 0.42 * u);
        ctx.fillStyle = mix([170, 136, 20], fog);
        ctx.fillRect(x - 0.32 * u, y - 0.6 * u, 0.64 * u, 0.07 * u);
        ctx.fillStyle = mix([120, 120, 128], fog);
        ctx.fillRect(x + 0.2 * u, y - 1.05 * u, 0.05 * u, 0.5 * u);
        ctx.fillStyle = mix([200, 200, 190], fog);
        ctx.fillRect(x + 0.12 * u, y - 1.12 * u, 0.22 * u, 0.1 * u);
        ctx.fillStyle = mix([30, 30, 34], fog);
        ctx.fillRect(x - 0.3 * u, y - 0.18 * u, 0.1 * u, 0.18 * u);
        ctx.fillRect(x + 0.2 * u, y - 0.18 * u, 0.1 * u, 0.18 * u);
      } else if (o.type === 'puddle') {
        ctx.fillStyle = mix(o.hit ? [90, 130, 170] : [110, 160, 210], fog);
        ctx.beginPath();
        ctx.ellipse(x, y, 0.42 * u, 0.08 * u + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x - 0.2 * u, y - 0.03 * u, 0.2 * u, Math.max(1, 0.025 * u));
      } else {
        ctx.fillStyle = mix([245, 245, 238], fog);
        ctx.fillRect(x - 0.15 * u, y - 0.38 * u, 0.3 * u, 0.38 * u);
        ctx.fillStyle = mix([106, 66, 36], fog);
        ctx.fillRect(x - 0.12 * u, y - 0.36 * u, 0.24 * u, 0.1 * u);
        ctx.strokeStyle = mix([245, 245, 238], fog);
        ctx.lineWidth = Math.max(1, 0.05 * u);
        ctx.beginPath();
        ctx.arc(x + 0.18 * u, y - 0.2 * u, 0.09 * u, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    drawChair(time) {
      const ctx = this.ctx;
      const e = this.engine;
      const cameraX = e.x * 0.8;
      const cx = WIDTH / 2 + (e.x - cameraX) * HALF_ROAD;
      const bob = Math.sin(time * (6 + e.speed * 0.5)) * Math.min(2.5, e.speed * 0.15);
      const baseY = HEIGHT - 28 + bob;
      ctx.save();
      ctx.translate(cx, baseY);
      ctx.rotate(this.tilt + (e.slip > 0 ? Math.sin(time * 14) * 0.08 : 0));
      const spin = time * e.speed * 1.5;
      ctx.fillStyle = '#25272e';
      [-46, -22, 22, 46].forEach((dx, i) => {
        const w = 12;
        ctx.fillRect(dx - w / 2, -4, w, 14);
        ctx.fillStyle = Math.sin(spin + i) > 0 ? '#4a4d58' : '#6a6e7a';
        ctx.fillRect(dx - 1, -2, 2, 10);
        ctx.fillStyle = '#25272e';
      });
      ctx.fillStyle = '#3a3d48';
      ctx.fillRect(-50, -12, 100, 8);
      ctx.fillRect(-6, -40, 12, 30);
      ctx.fillStyle = '#4a4f5c';
      ctx.fillRect(-34, -58, 68, 22);
      ctx.fillStyle = '#5a6070';
      ctx.fillRect(-34, -58, 68, 5);
      ctx.fillStyle = '#31456e';
      ctx.fillRect(-30, -128, 60, 74);
      ctx.fillStyle = '#425a8a';
      ctx.fillRect(-30, -128, 60, 8);
      ctx.fillStyle = '#e8e4da';
      ctx.fillRect(-22, -118, 44, 52);
      ctx.fillStyle = '#c8322a';
      ctx.fillRect(-2, -116, 4, 20);
      ctx.fillStyle = '#d6b48a';
      ctx.beginPath();
      ctx.arc(0, -138, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a1c';
      ctx.beginPath();
      ctx.arc(0, -142, 15, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }

    drawEffects(time) {
      const ctx = this.ctx;
      const e = this.engine;
      if (e.turbo > 0) {
        ctx.strokeStyle = 'rgba(255,230,140,0.5)';
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2 + time * 0.3;
          const inner = 120 + ((time * 400 + i * 37) % 160);
          ctx.beginPath();
          ctx.moveTo(WIDTH / 2 + Math.cos(angle) * inner, 210 + Math.sin(angle) * inner * 0.7);
          ctx.lineTo(WIDTH / 2 + Math.cos(angle) * (inner + 40), 210 + Math.sin(angle) * (inner + 40) * 0.7);
          ctx.stroke();
        }
      }
      if (e.slip > 0) {
        ctx.fillStyle = 'rgba(80,140,220,0.12)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      ctx.font = 'bold 18px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.floaters.forEach(f => {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = '#000000';
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      });
      ctx.globalAlpha = 1;
    }

    drawHud() {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, 26);
      ctx.font = 'bold 14px ' + FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('КОРИДОР ' + e.level, 10, 13);
      ctx.textAlign = 'center';
      ctx.fillStyle = e.timeLeft < 8 ? '#ff7a6a' : '#ffffff';
      ctx.fillText(e.timeLeft.toFixed(1) + ' с', WIDTH / 2, 13);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(Math.round(e.speed * 3.6) + ' км/ч', WIDTH - 10, 13);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, 32, 150, 10);
      ctx.fillStyle = '#69c46a';
      ctx.fillRect(11, 33, 148 * e.progress, 8);
      ctx.fillStyle = '#ffffff';
      for (let z = e.checkpointEvery; z < e.length; z += e.checkpointEvery) ctx.fillRect(10 + 150 * z / e.length, 31, 2, 12);
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['РАЛЛИ НА КОЛЁСИКАХ', 'Вверх — толкаться, Вниз — тормоз, Влево / Вправо — руль', 'Объезжайте тележки и коробки, лужи скользкие', 'Кофе — турбо. Пробел — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'won') {
        lines = ['ФИНИШ', 'Очки: ' + e.score, 'Пробел — следующий коридор'];
      } else if (this.mode === 'lost') {
        lines = ['ВРЕМЯ ВЫШЛО', 'Очки: ' + e.score + ', пройдено ' + Math.round(e.z) + ' м'];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — ещё раз');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 70;
      ctx.fillStyle = 'rgba(10,12,18,0.86)';
      ctx.fillRect(60, top, WIDTH - 120, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(60.5, top + 0.5, WIDTH - 121, height - 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#ffd36a' : '#ffffff';
        ctx.font = (i === 0 ? 'bold 17px ' : '13px ') + FONT;
        ctx.fillText(line, WIDTH / 2, top + 24 + i * 24);
      });
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#8a8a90';
    ctx.fillRect(0, 0, w, 20);
    ctx.fillStyle = '#3a5876';
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.lineTo(66, 20);
    ctx.lineTo(96, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8c2aa';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(30, 20);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(96, 8);
    ctx.lineTo(66, 20);
    ctx.lineTo(96, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#31456e';
    ctx.fillRect(40, 30, 16, 16);
    ctx.fillStyle = '#d6b48a';
    ctx.beginPath();
    ctx.arc(48, 26, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#25272e';
    ctx.fillRect(36, 50, 8, 6);
    ctx.fillRect(52, 50, 8, 6);
    ctx.fillRect(34, 46, 28, 4);
  }

  const app = new RallyApp();
  window.appOg2Rally = app;
  window.Og2.attach('rally', { open: () => app.open(), drawIcon });
})();
