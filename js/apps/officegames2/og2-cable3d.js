(() => {
  const WIDTH = 640;
  const HEIGHT = 400;
  const FOCAL = 360;
  const CAMERA_HEIGHT = 5.4;
  const CAMERA_BACK = 4.6;
  const PITCH = 0.66;
  const NEAR = 0.25;
  const FOG_COLOR = [34, 48, 78];

  const COLORS = {
    carpetA: [58, 96, 104],
    carpetB: [66, 108, 116],
    wall: [190, 190, 184],
    partition: [150, 164, 132],
    cable: [40, 96, 210],
    cableRing: [24, 58, 140],
    plug: [208, 208, 204],
    gold: [230, 190, 60],
    paper: [244, 244, 236],
    flap: [200, 60, 52],
    cup: [120, 78, 44],
    lid: [236, 236, 230]
  };

  const FACES = [
    { corners: [2, 3, 7, 6], normal: [0, 1, 0], shade: 1 },
    { corners: [0, 2, 6, 4], normal: [-1, 0, 0], shade: 0.6 },
    { corners: [1, 3, 7, 5], normal: [1, 0, 0], shade: 0.68 },
    { corners: [0, 1, 3, 2], normal: [0, 0, -1], shade: 0.74 },
    { corners: [4, 5, 7, 6], normal: [0, 0, 1], shade: 0.84 }
  ];

  function rgb(color, shade, fog) {
    const r = color[0] * shade;
    const g = color[1] * shade;
    const b = color[2] * shade;
    const mixed = [
      r + (FOG_COLOR[0] - r) * fog,
      g + (FOG_COLOR[1] - g) * fog,
      b + (FOG_COLOR[2] - b) * fog
    ];
    return `rgb(${Math.round(mixed[0])},${Math.round(mixed[1])},${Math.round(mixed[2])})`;
  }

  function fogAt(depth) {
    return Math.max(0, Math.min(0.6, (depth - 7) / 18));
  }

  function clipToNear(points) {
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const aIn = a.z >= NEAR;
      const bIn = b.z >= NEAR;
      if (aIn) out.push(a);
      if (aIn !== bIn) {
        const t = (NEAR - a.z) / (b.z - a.z);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR });
      }
    }
    return out;
  }

  class CableView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.camera = { angle: 0, x: 0, z: 0 };
    }

    place(angle, headX, headZ) {
      this.camera.angle = angle;
      this.camera.x = headX - Math.sin(angle) * CAMERA_BACK;
      this.camera.z = headZ - Math.cos(angle) * CAMERA_BACK;
      this.sinA = Math.sin(angle);
      this.cosA = Math.cos(angle);
      this.sinP = Math.sin(PITCH);
      this.cosP = Math.cos(PITCH);
    }

    toCamera(x, y, z) {
      const px = x - this.camera.x;
      const py = y - CAMERA_HEIGHT;
      const pz = z - this.camera.z;
      const xr = px * this.cosA - pz * this.sinA;
      const zr = px * this.sinA + pz * this.cosA;
      return { x: xr, y: py * this.cosP + zr * this.sinP, z: zr * this.cosP - py * this.sinP };
    }

    rotateDirection(nx, ny, nz) {
      const xr = nx * this.cosA - nz * this.sinA;
      const zr = nx * this.sinA + nz * this.cosA;
      return { x: xr, y: ny * this.cosP + zr * this.sinP, z: zr * this.cosP - ny * this.sinP };
    }

    fillPolygon(points, color, shade) {
      const clipped = clipToNear(points);
      if (clipped.length < 3) return;
      let depth = 0;
      clipped.forEach(p => { depth += p.z; });
      depth /= clipped.length;
      const ctx = this.ctx;
      ctx.beginPath();
      clipped.forEach((p, i) => {
        const sx = WIDTH / 2 + FOCAL * p.x / p.z;
        const sy = HEIGHT / 2 - FOCAL * p.y / p.z;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fillStyle = rgb(color, shade, fogAt(depth));
      ctx.fill();
    }

    drawFloor(size) {
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          const corners = [
            this.toCamera(x - 0.5, 0, z - 0.5),
            this.toCamera(x + 0.5, 0, z - 0.5),
            this.toCamera(x + 0.5, 0, z + 0.5),
            this.toCamera(x - 0.5, 0, z + 0.5)
          ];
          this.fillPolygon(corners, (x + z) % 2 ? COLORS.carpetA : COLORS.carpetB, 1);
        }
      }
    }

    boxDepth(box) {
      return this.toCamera((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, (box.minZ + box.maxZ) / 2).z;
    }

    drawBox(box) {
      const verts = [];
      for (let i = 0; i < 8; i++) {
        verts.push(this.toCamera(
          i & 1 ? box.maxX : box.minX,
          i & 2 ? box.maxY : box.minY,
          i & 4 ? box.maxZ : box.minZ
        ));
      }
      FACES.forEach(face => {
        const points = face.corners.map(i => verts[i]);
        const center = {
          x: (points[0].x + points[2].x) / 2,
          y: (points[0].y + points[2].y) / 2,
          z: (points[0].z + points[2].z) / 2
        };
        const n = this.rotateDirection(face.normal[0], face.normal[1], face.normal[2]);
        if (n.x * center.x + n.y * center.y + n.z * center.z >= 0) return;
        const color = face.normal[1] === 1 && box.topColor ? box.topColor : box.color;
        this.fillPolygon(points, color, face.shade);
      });
      if (box.extras) box.extras.forEach(extra => this.drawBox(extra));
    }

    makeBox(cx, cz, halfX, halfZ, y0, y1, color, topColor) {
      return { minX: cx - halfX, maxX: cx + halfX, minZ: cz - halfZ, maxZ: cz + halfZ, minY: y0, maxY: y1, color, topColor };
    }

    collectBoxes(engine, alpha, time) {
      const boxes = [];
      const size = engine.size;
      for (let i = -1; i <= size; i++) {
        boxes.push(this.makeBox(i, -1, 0.5, 0.5, 0, 0.8, COLORS.wall));
        boxes.push(this.makeBox(i, size, 0.5, 0.5, 0, 0.8, COLORS.wall));
        if (i >= 0 && i < size) {
          boxes.push(this.makeBox(-1, i, 0.5, 0.5, 0, 0.8, COLORS.wall));
          boxes.push(this.makeBox(size, i, 0.5, 0.5, 0, 0.8, COLORS.wall));
        }
      }
      engine.obstacles.forEach(cell => {
        boxes.push(this.makeBox(cell.x, cell.z, 0.46, 0.46, 0, 1.25, COLORS.partition, [112, 128, 98]));
      });
      if (engine.letter) {
        const bob = 0.06 * Math.sin(time * 4);
        const letter = this.makeBox(engine.letter.x, engine.letter.z, 0.3, 0.2, 0.12 + bob, 0.3 + bob, COLORS.paper);
        letter.extras = [this.makeBox(engine.letter.x, engine.letter.z, 0.1, 0.2, 0.3 + bob, 0.33 + bob, COLORS.flap)];
        boxes.push(letter);
      }
      if (engine.coffee) {
        const bob = 0.05 * Math.sin(time * 5 + 1);
        const cup = this.makeBox(engine.coffee.x, engine.coffee.z, 0.2, 0.2, 0.05 + bob, 0.5 + bob, COLORS.cup);
        cup.extras = [this.makeBox(engine.coffee.x, engine.coffee.z, 0.23, 0.23, 0.5 + bob, 0.56 + bob, COLORS.lid)];
        boxes.push(cup);
      }
      engine.snake.forEach((cell, i) => {
        const before = engine.prevSnake[Math.min(i, engine.prevSnake.length - 1)];
        const x = before.x + (cell.x - before.x) * alpha;
        const z = before.z + (cell.z - before.z) * alpha;
        if (i === 0) {
          const head = this.makeBox(x, z, 0.38, 0.38, 0, 0.62, COLORS.plug);
          const forward = this.headForward(engine);
          head.extras = [this.makeBox(x + forward.x * 0.2, z + forward.z * 0.2, 0.22, 0.22, 0.62, 0.7, COLORS.gold)];
          boxes.push(head);
        } else {
          boxes.push(this.makeBox(x, z, 0.33, 0.33, 0, 0.46, i % 3 === 0 ? COLORS.cableRing : COLORS.cable));
        }
      });
      return boxes;
    }

    headForward(engine) {
      return window.Og2CableEngine.DIRS[engine.dir];
    }

    render(engine, alpha, time) {
      const ctx = this.ctx;
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#16213a');
      sky.addColorStop(1, '#2a3a5c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      this.drawFloor(engine.size);
      const boxes = this.collectBoxes(engine, alpha, time);
      boxes.forEach(box => { box.depth = this.boxDepth(box); });
      boxes.sort((a, b) => b.depth - a.depth);
      boxes.forEach(box => {
        if (box.depth > -1) this.drawBox(box);
      });
    }
  }

  class Cable3dApp {
    constructor() {
      this.winId = 'og2_cable3d';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Патч-корд 3D',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-cable-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="length"></span>
            <span data-cell="level"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.view = new CableView(this.canvas);
      this.engine = new window.Og2CableEngine();
      this.mode = 'ready';
      this.heading = 0;
      this.targetHeading = 0;
      this.tickClock = 0;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        boss: (shown) => { if (shown && this.mode === 'playing') this.mode = 'paused'; }
      });
      this.canvas.addEventListener('mousedown', (e) => this.onPointer(e));
      this.updateStatus();
      this.frame = requestAnimationFrame((now) => this.loop(now));
    }

    dispose() {
      if (this.stopKeys) this.stopKeys();
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.stopKeys = null;
      this.win = null;
    }

    startRound() {
      this.engine.reset();
      this.heading = 0;
      this.targetHeading = 0;
      this.tickClock = 0;
      this.recordBeaten = false;
      this.mode = 'playing';
      this.updateStatus();
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        this.steer('left');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        this.steer('right');
      } else if (key === ' ' || key === 'enter') {
        e.preventDefault();
        this.primaryAction();
      }
    }

    onPointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      if (this.mode !== 'playing') {
        this.primaryAction();
        return;
      }
      this.steer(e.clientX - rect.left < rect.width / 2 ? 'left' : 'right');
    }

    steer(side) {
      if (this.mode === 'ready') {
        this.startRound();
      }
      if (this.mode === 'playing') this.engine.turn(side);
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'over') this.startRound();
      else if (this.mode === 'playing') this.mode = 'paused';
      else if (this.mode === 'paused') this.mode = 'playing';
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'playing' && !window.Og2.isBossShown(this.winId)) this.advance(dt * 1000);
      this.draw(now / 1000, dt);
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(ms) {
      this.tickClock += ms;
      while (this.mode === 'playing' && this.tickClock >= this.engine.tickMs) {
        this.tickClock -= this.engine.tickMs;
        this.applyStep(this.engine.step());
      }
    }

    applyStep(result) {
      if (result.turned) this.targetHeading += result.turned * Math.PI / 2;
      if (result.kind === 'letter') {
        window.Og2.beep(880, 0.07, 'square');
        this.updateStatus();
      } else if (result.kind === 'coffee') {
        window.Og2.beep(1180, 0.05, 'triangle');
        window.Og2.beep(1480, 0.09, 'triangle');
        this.updateStatus();
      } else if (result.kind === 'crash') {
        window.Og2.beep(110, 0.35, 'sawtooth', 0.07);
        this.mode = 'over';
        this.recordBeaten = window.Og2.submitScore('cable3d', this.engine.score);
        this.updateStatus();
      }
    }

    draw(time, dt) {
      this.heading += (this.targetHeading - this.heading) * Math.min(1, dt * 9);
      const alpha = this.mode === 'playing' ? Math.min(1, this.tickClock / this.engine.tickMs) : 1;
      const head = this.engine.snake[0];
      const before = this.engine.prevSnake[0];
      const hx = before.x + (head.x - before.x) * alpha;
      const hz = before.z + (head.z - before.z) * alpha;
      this.view.place(this.heading, hx, hz);
      this.view.render(this.engine, alpha, time);
      this.drawOverlay();
    }

    drawOverlay() {
      const ctx = this.view.ctx;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, WIDTH, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Microsoft Sans Serif", Tahoma, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('ОЧКИ ' + this.engine.score, 10, 13);
      ctx.textAlign = 'right';
      ctx.fillText('РЕКОРД ' + Math.max(window.Og2.bestScore('cable3d'), this.engine.score), WIDTH - 10, 13);
      if (this.engine.calm > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd36a';
        ctx.fillText('КОФЕ: ВСЁ ИДЁТ МЕДЛЕННЕЕ', WIDTH / 2, 13);
      }
      if (this.mode === 'playing') return;
      const lines = this.overlayLines();
      ctx.fillStyle = 'rgba(8,14,30,0.78)';
      ctx.fillRect(120, 120, WIDTH - 240, 40 + lines.length * 24);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(120.5, 120.5, WIDTH - 241, 39 + lines.length * 24);
      ctx.textAlign = 'center';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#ffd36a' : '#ffffff';
        ctx.font = (i === 0 ? 'bold 18px' : '13px') + ' "Microsoft Sans Serif", Tahoma, sans-serif';
        ctx.fillText(line, WIDTH / 2, 148 + i * 24);
      });
    }

    overlayLines() {
      if (this.mode === 'ready') {
        return ['ПАТЧ-КОРД 3D', 'Влево / Вправо — поворот относительно кабеля', 'Собирайте письма, обходите перегородки', 'Пробел — начать'];
      }
      if (this.mode === 'paused') {
        return ['ПАУЗА', 'Пробел — продолжить'];
      }
      const cause = { wall: 'Кабель упёрся в стену', partition: 'Кабель врезался в перегородку', self: 'Кабель запутался в себе' }[this.lastCause()] || 'Связь потеряна';
      const lines = ['СВЯЗЬ ПОТЕРЯНА', cause, 'Очки: ' + this.engine.score];
      if (this.recordBeaten) lines.push('Новый рекорд!');
      lines.push('Пробел — ещё раз');
      return lines;
    }

    lastCause() {
      return this.engine.lastCause || '';
    }

    updateStatus() {
      if (!this.cells) return;
      this.cells.score.textContent = 'Очки: ' + this.engine.score;
      this.cells.length.textContent = 'Длина: ' + this.engine.snake.length;
      this.cells.level.textContent = 'Уровень: ' + this.engine.level;
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('cable3d'), this.engine.score);
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#3a6068';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#42707a';
    for (let x = 0; x < w; x += 16) {
      for (let y = 0; y < h; y += 16) {
        if (((x + y) / 16) % 2 === 0) ctx.fillRect(x, y, 16, 16);
      }
    }
    const path = [[10, 46], [26, 46], [42, 46], [42, 30], [58, 30], [74, 30], [74, 14]];
    path.forEach((p, i) => {
      ctx.fillStyle = i % 3 === 0 ? '#183a8c' : '#2860d2';
      ctx.fillRect(p[0], p[1], 14, 14);
    });
    ctx.fillStyle = '#d0d0cc';
    ctx.fillRect(70, 8, 18, 14);
    ctx.fillStyle = '#e6be3c';
    ctx.fillRect(74, 4, 10, 4);
  }

  const app = new Cable3dApp();
  window.appOg2Cable3d = app;
  window.Og2.attach('cable3d', { open: () => app.open(), drawIcon });
})();
