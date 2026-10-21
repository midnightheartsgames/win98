
class AppScreensaver {
  constructor() {
    this.currentMode = 'pipes';
    this.idleTime = 0;
    this.timeoutSeconds = 180;
    this.isActive = false;
    this.animId = null;

    this.loadSavedSettings();
    this.initDOM();
    this.initIdleTracker();
  }

  loadSavedSettings() {
    try {
      const raw = localStorage.getItem('win98_display_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.screensaverMode !== undefined) {
          this.currentMode = parsed.screensaverMode;
        }
        if (parsed.screensaverTimeout !== undefined) {
          const hasExplicit = localStorage.getItem('win98_custom_screensaver_timeout');
          let mins = Math.max(1, parseInt(parsed.screensaverTimeout, 10) || 3);
          if (!hasExplicit) mins = 3;
          this.timeoutSeconds = mins * 60;
        } else {
          this.timeoutSeconds = 180;
        }
      } else {
        this.timeoutSeconds = 180;
      }
    } catch (e) {
      console.warn('Failed to load screensaver settings:', e);
      this.timeoutSeconds = 180;
    }
  }

  applyConfig(mode, timeoutMinutes) {
    if (mode !== undefined) {
      this.currentMode = mode;
    }
    if (timeoutMinutes !== undefined) {
      const mins = Math.max(1, parseInt(timeoutMinutes, 10) || 1);
      this.timeoutSeconds = mins * 60;
    }
    this.idleTime = 0;
  }

  initDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'screensaver-overlay';
    this.overlay.innerHTML = '<canvas id="screensaver-canvas"></canvas>';
    document.body.appendChild(this.overlay);

    this.canvas = this.overlay.querySelector('#screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    const dismiss = () => {
      if (this.isActive) {
        this.stop();
      }
      this.idleTime = 0;
    };

    window.addEventListener('mousemove', dismiss);
    window.addEventListener('mousedown', dismiss);
    window.addEventListener('keydown', dismiss);
  }

  initIdleTracker() {
    this._idleInterval = setInterval(() => {
      this.idleTime++;
      if (this.currentMode !== 'none' && !this.isActive && this.idleTime >= this.timeoutSeconds) {
        this.start(this.currentMode);
      }
    }, 1000);
    if (this._idleInterval && typeof this._idleInterval.unref === 'function') {
      this._idleInterval.unref();
    }
  }

  start(mode = this.currentMode) {
    if (mode === 'none') return;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.isActive = true;
    this.currentMode = mode;
    this.overlay.style.display = 'block';

    if (window.appClippy) {
      window.appClippy.onScreensaver(true);
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (mode === 'starfield') {
      this.initStarfield();
    } else if (mode === 'mystify') {
      this.initMystify();
    } else if (mode === 'flowerbox') {
      this.initFlowerBox();
    } else if (mode === 'matrix') {
      this.initMatrix();
    } else if (mode === 'flying_win') {
      this.initFlyingWindows();
    } else if (mode === 'maze') {
      this.initMaze();
    } else if (mode === 'text3d') {
      this.initText3D();
    } else {
      this.initPipes();
    }
  }

  stop() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    if (this.animId) cancelAnimationFrame(this.animId);

    if (window.appClippy) {
      window.appClippy.onScreensaver(false);
    }
  }

  initStarfield() {
    const numStars = 400;
    this.stars = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * w,
        y: (Math.random() - 0.5) * h,
        z: Math.random() * w
      });
    }

    const loop = () => {
      if (!this.isActive) return;
      const ctx = this.ctx;
      const cw = this.canvas.width;
      const ch = this.canvas.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, cw, ch);

      const cx = cw / 2;
      const cy = ch / 2;

      this.stars.forEach(star => {
        star.z -= 12;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * cw;
          star.y = (Math.random() - 0.5) * ch;
          star.z = cw;
        }

        const k = 250 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= cw && py >= 0 && py <= ch) {
          const size = Math.max(1, (1 - star.z / cw) * 3.5);
          const brightness = Math.floor((1 - star.z / cw) * 255);
          ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
          ctx.fillRect(px, py, size, size);
        }
      });

      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  initMystify() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    const createPolygon = (colorHue) => {
      const vertices = [];
      for (let i = 0; i < 4; i++) {
        vertices.push({
          x: Math.random() * (cw - 100) + 50,
          y: Math.random() * (ch - 100) + 50,
          vx: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1),
          vy: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1)
        });
      }
      return { vertices, history: [], hue: colorHue };
    };

    const polys = [createPolygon(0), createPolygon(180)];
    const maxHistory = 10;

    const loop = () => {
      if (!this.isActive) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, cw, ch);

      polys.forEach(poly => {
        poly.hue = (poly.hue + 0.5) % 360;

        const currentPoints = poly.vertices.map(v => ({ x: v.x, y: v.y }));
        poly.history.push(currentPoints);
        if (poly.history.length > maxHistory) poly.history.shift();

        poly.vertices.forEach(v => {
          v.x += v.vx;
          v.y += v.vy;
          if (v.x <= 0 || v.x >= cw) v.vx *= -1;
          if (v.y <= 0 || v.y >= ch) v.vy *= -1;
        });

        poly.history.forEach((pts, idx) => {
          const alpha = (idx + 1) / poly.history.length;
          ctx.strokeStyle = `hsla(${poly.hue}, 100%, 65%, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        });
      });

      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  initFlowerBox() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;
    let morph = 0;

    const baseVerts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
    ];

    const faces = [
      { v: [0, 1, 2, 3], col: '#e74c3c' },
      { v: [4, 5, 6, 7], col: '#3498db' },
      { v: [0, 1, 5, 4], col: '#2ecc71' },
      { v: [2, 3, 7, 6], col: '#f1c40f' },
      { v: [0, 3, 7, 4], col: '#9b59b6' },
      { v: [1, 2, 6, 5], col: '#e67e22' }
    ];

    const loop = () => {
      if (!this.isActive) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cw, ch);

      rotX += 0.015;
      rotY += 0.022;
      rotZ += 0.008;
      morph += 0.02;

      const scale = (Math.min(cw, ch) * 0.22) * (1 + Math.sin(morph) * 0.2);
      const cx = cw / 2;
      const cy = ch / 2;

      const proj = baseVerts.map(pt => {
        let x = pt[0];
        let y = pt[1];
        let z = pt[2];

        let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
        let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

        let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
        let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

        let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
        let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);

        const dist = 3.2;
        const pz = z2 + dist;
        const k = scale / pz;

        return {
          sx: x3 * k + cx,
          sy: y3 * k + cy,
          z: z2
        };
      });

      const sortedFaces = faces.map(f => {
        const avgZ = (proj[f.v[0]].z + proj[f.v[1]].z + proj[f.v[2]].z + proj[f.v[3]].z) / 4;
        return { ...f, avgZ };
      }).sort((a, b) => a.avgZ - b.avgZ);

      sortedFaces.forEach(f => {
        ctx.fillStyle = f.col;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(proj[f.v[0]].sx, proj[f.v[0]].sy);
        ctx.lineTo(proj[f.v[1]].sx, proj[f.v[1]].sy);
        ctx.lineTo(proj[f.v[2]].sx, proj[f.v[2]].sy);
        ctx.lineTo(proj[f.v[3]].sx, proj[f.v[3]].sy);
        ctx.closePath();

        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
      });

      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  initPipes() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const w = (canvas && canvas.width) || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = (canvas && canvas.height) || (typeof window !== 'undefined' ? window.innerHeight : 600);

    if (ctx && typeof ctx.fillRect === 'function') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    }

    const materials = [
      { name: 'Red',    base: '#e02828', light: '#ff8585', shadow: '#500505', cap: '#ff3b30' },
      { name: 'Blue',   base: '#2563eb', light: '#93c5fd', shadow: '#0f2766', cap: '#3b82f6' },
      { name: 'Green',  base: '#16a34a', light: '#86efac', shadow: '#053818', cap: '#22c55e' },
      { name: 'Gold',   base: '#d97706', light: '#fde68a', shadow: '#451a03', cap: '#f59e0b' },
      { name: 'Purple', base: '#9333ea', light: '#d8b4fe', shadow: '#3b0764', cap: '#a855f7' },
      { name: 'Cyan',   base: '#0891b2', light: '#7dd3fc', shadow: '#083344', cap: '#06b6d4' },
      { name: 'Orange', base: '#ea580c', light: '#fdba74', shadow: '#431407', cap: '#f97316' },
      { name: 'Silver', base: '#94a3b8', light: '#f1f5f9', shadow: '#1e293b', cap: '#cbd5e1' }
    ];

    const aspect = w / (h || 1);
    const gridX = Math.round(15 * Math.max(1, Math.min(2.2, aspect)));
    const gridY = 13;
    const gridZ = 12;
    const cellSize = 38;
    const basePipeRadius = 9.0;

    const DIRS = [
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 }
    ];

    const cellKey = (x, y, z) => `${x},${y},${z}`;
    const occupied = new Set();


    const yaw = -0.44;
    const pitch = 0.30;
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const camDist = 700;
    const focalLength = Math.min(w, h) * 1.02;
    const cx = w / 2;
    const cy = h / 2;

    const project = (gx, gy, gz) => {

      const wx = (gx - gridX / 2 + 0.5) * cellSize;
      const wy = (gy - gridY / 2 + 0.5) * cellSize;
      const wz = (gz - gridZ / 2 + 0.5) * cellSize;

      const x1 = wx * cosYaw - wz * sinYaw;
      const z1 = wx * sinYaw + wz * cosYaw;
      const y1 = wy;

      const y2 = y1 * cosPitch - z1 * sinPitch;
      const z2 = y1 * sinPitch + z1 * cosPitch + camDist;

      const zSafe = Math.max(100, z2);
      const scale = focalLength / zSafe;

      return {
        x: cx + x1 * scale,
        y: cy + y2 * scale,
        z: zSafe,
        scale: scale,
        r: Math.max(2, basePipeRadius * scale)
      };
    };

    const elements = [];
    let totalSegments = 0;
    const maxSegmentsBeforeReset = 550;

    const findRandomStartNode = () => {
      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * gridX);
        const y = Math.floor(Math.random() * gridY);
        const z = Math.floor(Math.random() * gridZ);
        if (!occupied.has(cellKey(x, y, z))) {
          return { x, y, z };
        }
      }
      return {
        x: Math.floor(gridX / 2),
        y: Math.floor(gridY / 2),
        z: Math.floor(gridZ / 2)
      };
    };

    let matIndex = 0;
    const getNextMaterial = () => {
      const mat = materials[matIndex % materials.length];
      matIndex++;
      return mat;
    };

    const createPipeLeader = () => {
      const start = findRandomStartNode();
      occupied.add(cellKey(start.x, start.y, start.z));
      const mat = getNextMaterial();

      elements.push({
        type: 'sphere',
        x: start.x,
        y: start.y,
        z: start.z,
        mat: mat,
        isCap: true
      });

      const validDirs = [];
      for (let i = 0; i < DIRS.length; i++) {
        const nx = start.x + DIRS[i].dx;
        const ny = start.y + DIRS[i].dy;
        const nz = start.z + DIRS[i].dz;
        if (nx >= 0 && nx < gridX && ny >= 0 && ny < gridY && nz >= 0 && nz < gridZ) {
          if (!occupied.has(cellKey(nx, ny, nz))) {
            validDirs.push(i);
          }
        }
      }
      const dirIndex = validDirs.length > 0
        ? validDirs[Math.floor(Math.random() * validDirs.length)]
        : Math.floor(Math.random() * 6);

      const targetX = start.x + DIRS[dirIndex].dx;
      const targetY = start.y + DIRS[dirIndex].dy;
      const targetZ = start.z + DIRS[dirIndex].dz;

      return {
        fromX: start.x,
        fromY: start.y,
        fromZ: start.z,
        toX: targetX,
        toY: targetY,
        toZ: targetZ,
        dirIndex: dirIndex,
        mat: mat,
        progress: 0.0,
        length: 0,
        maxSegments: 25 + Math.floor(Math.random() * 30),
        alive: true
      };
    };

    const numLeaders = 4;
    let leaders = [];
    for (let i = 0; i < numLeaders; i++) {
      leaders.push(createPipeLeader());
    }


    const stepDuration = 230;
    let lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const drawSphere = (p, mat, isCap) => {
      if (!ctx || typeof ctx.beginPath !== 'function') return;
      const radius = p.r * (isCap ? 1.05 : 1.14);
      const hx = p.x - radius * 0.32;
      const hy = p.y - radius * 0.35;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

      if (typeof ctx.createRadialGradient === 'function') {
        const grad = ctx.createRadialGradient(hx, hy, radius * 0.05, p.x, p.y, radius);
        grad.addColorStop(0.0, '#ffffff');
        grad.addColorStop(0.18, mat.light);
        grad.addColorStop(0.55, mat.base);
        grad.addColorStop(0.9, mat.shadow);
        grad.addColorStop(1.0, '#0a0a0a');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = mat.base;
      }
      ctx.fill();
      ctx.restore();
    };

    const drawCylinder = (p1, p2, mat) => {
      if (!ctx || typeof ctx.beginPath !== 'function') return;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);

      if (len < 1.0) {
        drawSphere(p2, mat, true);
        return;
      }

      let nx = -dy / len;
      let ny = dx / len;

      const lightDot = nx * (-0.7) + ny * (-0.7);
      if (lightDot < 0) {
        nx = -nx;
        ny = -ny;
      }

      const r1 = p1.r;
      const r2 = p2.r;
      const tx = dx / len;
      const ty = dy / len;
      const overlap = 0.8;

      const x1a = p1.x - tx * overlap + nx * r1, y1a = p1.y - ty * overlap + ny * r1;
      const x1b = p1.x - tx * overlap - nx * r1, y1b = p1.y - ty * overlap - ny * r1;
      const x2b = p2.x + tx * overlap - nx * r2, y2b = p2.y + ty * overlap - ny * r2;
      const x2a = p2.x + tx * overlap + nx * r2, y2a = p2.y + ty * overlap + ny * r2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1a, y1a);
      ctx.lineTo(x2a, y2a);
      ctx.lineTo(x2b, y2b);
      ctx.lineTo(x1b, y1b);
      ctx.closePath();

      if (typeof ctx.createLinearGradient === 'function') {

        const mx1 = (x1a + x2a) / 2;
        const my1 = (y1a + y2a) / 2;
        const mx2 = (x1b + x2b) / 2;
        const my2 = (y1b + y2b) / 2;
        const grad = ctx.createLinearGradient(mx1, my1, mx2, my2);
        grad.addColorStop(0.0, mat.light);
        grad.addColorStop(0.25, '#ffffff');
        grad.addColorStop(0.48, mat.light);
        grad.addColorStop(0.72, mat.base);
        grad.addColorStop(1.0, mat.shadow);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = mat.base;
      }
      ctx.fill();
      ctx.restore();
    };

    const loop = (currentTime) => {
      if (!this.isActive) return;

      const now = (typeof currentTime === 'number' ? currentTime : (typeof performance !== 'undefined' ? performance.now() : Date.now()));
      const dt = Math.min(50, Math.max(1, now - lastTime));
      lastTime = now;

      leaders.forEach(leader => {
        if (!leader.alive) return;

        leader.progress += dt / stepDuration;

        if (leader.progress >= 1.0) {

          leader.progress = 0.0;
          leader.length++;
          totalSegments++;

          elements.push({
            type: 'pipe',
            x1: leader.fromX,
            y1: leader.fromY,
            z1: leader.fromZ,
            x2: leader.toX,
            y2: leader.toY,
            z2: leader.toZ,
            mat: leader.mat
          });

          occupied.add(cellKey(leader.toX, leader.toY, leader.toZ));

          const turnX = leader.toX;
          const turnY = leader.toY;
          const turnZ = leader.toZ;

          leader.fromX = leader.toX;
          leader.fromY = leader.toY;
          leader.fromZ = leader.toZ;

          if (leader.length >= leader.maxSegments) {
            elements.push({
              type: 'sphere',
              x: turnX,
              y: turnY,
              z: turnZ,
              mat: leader.mat,
              isCap: true
            });
            leader.alive = false;
            return;
          }


          const prevDir = leader.dirIndex;
          const sx = leader.fromX + DIRS[prevDir].dx;
          const sy = leader.fromY + DIRS[prevDir].dy;
          const sz = leader.fromZ + DIRS[prevDir].dz;

          const isStraightOpen = (
            sx >= 0 && sx < gridX &&
            sy >= 0 && sy < gridY &&
            sz >= 0 && sz < gridZ &&
            !occupied.has(cellKey(sx, sy, sz))
          );

          const oppositeDir = prevDir ^ 1;
          const openTurns = [];
          for (let d = 0; d < 6; d++) {
            if (d === prevDir || d === oppositeDir) continue;
            const nx = leader.fromX + DIRS[d].dx;
            const ny = leader.fromY + DIRS[d].dy;
            const nz = leader.fromZ + DIRS[d].dz;
            if (nx >= 0 && nx < gridX && ny >= 0 && ny < gridY && nz >= 0 && nz < gridZ) {
              if (!occupied.has(cellKey(nx, ny, nz))) {
                openTurns.push(d);
              }
            }
          }

          let nextDir = null;

          if (isStraightOpen && (Math.random() < 0.65 || openTurns.length === 0)) {
            nextDir = prevDir;
          } else if (openTurns.length > 0) {
            nextDir = openTurns[Math.floor(Math.random() * openTurns.length)];
          } else if (isStraightOpen) {
            nextDir = prevDir;
          }

          if (nextDir !== null) {


            if (nextDir !== prevDir) {
              elements.push({
                type: 'sphere',
                x: turnX,
                y: turnY,
                z: turnZ,
                mat: leader.mat,
                isCap: false
              });
            }

            leader.dirIndex = nextDir;
            leader.toX = leader.fromX + DIRS[nextDir].dx;
            leader.toY = leader.fromY + DIRS[nextDir].dy;
            leader.toZ = leader.fromZ + DIRS[nextDir].dz;
          } else {

            elements.push({
              type: 'sphere',
              x: turnX,
              y: turnY,
              z: turnZ,
              mat: leader.mat,
              isCap: true
            });
            leader.alive = false;
          }
        }
      });

      for (let i = 0; i < leaders.length; i++) {
        if (!leaders[i].alive) {
          leaders[i] = createPipeLeader();
        }
      }

      if (totalSegments > maxSegmentsBeforeReset || occupied.size > (gridX * gridY * gridZ * 0.75)) {
        elements.length = 0;
        occupied.clear();
        totalSegments = 0;
        if (ctx && typeof ctx.fillRect === 'function') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, w, h);
        }
        leaders = [];
        for (let i = 0; i < numLeaders; i++) {
          leaders.push(createPipeLeader());
        }
      }

      if (ctx && typeof ctx.fillRect === 'function') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
      }

      const renderables = [];

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.type === 'sphere') {
          const p = project(el.x, el.y, el.z);
          renderables.push({
            type: 'sphere',
            depth: p.z,
            p: p,
            mat: el.mat,
            isCap: el.isCap
          });
        } else if (el.type === 'pipe') {
          const p1 = project(el.x1, el.y1, el.z1);
          const p2 = project(el.x2, el.y2, el.z2);
          renderables.push({
            type: 'pipe',
            depth: (p1.z + p2.z) / 2,
            p1: p1,
            p2: p2,
            mat: el.mat
          });
        }
      }

      leaders.forEach(leader => {
        if (!leader.alive) return;
        const curX = leader.fromX + (leader.toX - leader.fromX) * leader.progress;
        const curY = leader.fromY + (leader.toY - leader.fromY) * leader.progress;
        const curZ = leader.fromZ + (leader.toZ - leader.fromZ) * leader.progress;

        const p1 = project(leader.fromX, leader.fromY, leader.fromZ);
        const p2 = project(curX, curY, curZ);

        renderables.push({
          type: 'pipe',
          depth: (p1.z + p2.z) / 2,
          p1: p1,
          p2: p2,
          mat: leader.mat
        });

        renderables.push({
          type: 'sphere',
          depth: p2.z,
          p: p2,
          mat: leader.mat,
          isCap: true
        });
      });

      renderables.sort((a, b) => b.depth - a.depth);

      for (let i = 0; i < renderables.length; i++) {
        const item = renderables[i];
        if (item.type === 'sphere') {
          drawSphere(item.p, item.mat, item.isCap);
        } else if (item.type === 'pipe') {
          drawCylinder(item.p1, item.p2, item.mat);
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  initMatrix() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    const chars = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜﾝ0123456789ABCDEFZ$+-*=%<>~#:';
    const fontSize = 16;
    const columns = Math.ceil(cw / fontSize);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, ch);

    const streams = [];
    for (let i = 0; i < columns; i++) {
      streams.push({
        x: i * fontSize,
        y: Math.random() * -50,
        speed: 0.35 + Math.random() * 0.65,
        length: 12 + Math.floor(Math.random() * 20),
        chars: []
      });
    }

    const loop = () => {
      if (!this.isActive) return;

      ctx.fillStyle = 'rgba(0, 5, 0, 0.12)';
      ctx.fillRect(0, 0, cw, ch);

      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.textAlign = 'center';

      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        stream.y += stream.speed;

        const headY = Math.floor(stream.y);

        for (let j = 0; j < stream.length; j++) {
          const charY = headY - j;
          if (charY < 0) continue;
          const pixelY = charY * fontSize;
          if (pixelY > ch + fontSize) continue;

          if (!stream.chars[j] || Math.random() < 0.03) {
            stream.chars[j] = chars.charAt(Math.floor(Math.random() * chars.length));
          }

          if (j === 0) {

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff66';
            ctx.shadowBlur = 10;
            ctx.fillText(stream.chars[j], stream.x + fontSize / 2, pixelY);
            ctx.shadowBlur = 0;
          } else if (j === 1) {

            ctx.fillStyle = '#7dff9e';
            ctx.fillText(stream.chars[j], stream.x + fontSize / 2, pixelY);
          } else {

            const factor = 1 - (j / stream.length);
            const greenVal = Math.floor(255 * factor);
            ctx.fillStyle = `rgb(0, ${Math.max(35, greenVal)}, ${Math.floor(40 * factor)})`;
            ctx.fillText(stream.chars[j], stream.x + fontSize / 2, pixelY);
          }
        }

        if ((headY - stream.length) * fontSize > ch) {
          stream.y = Math.random() * -25;
          stream.speed = 0.35 + Math.random() * 0.65;
          stream.length = 12 + Math.floor(Math.random() * 22);
          stream.chars = [];
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  initFlyingWindows() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    const numFlags = 28;
    const flags = [];
    for (let i = 0; i < numFlags; i++) {
      flags.push({
        x: (Math.random() - 0.5) * cw * 1.5,
        y: (Math.random() - 0.5) * ch * 1.5,
        z: Math.random() * 1000 + 50,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03
      });
    }

    const loop = () => {
      if (!this.isActive) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, cw, ch);

      const cx = cw / 2;
      const cy = ch / 2;

      flags.sort((a, b) => b.z - a.z);

      for (let i = 0; i < flags.length; i++) {
        const f = flags[i];
        f.z -= 4.5;
        f.rot += f.rotSpeed;

        if (f.z <= 10) {
          f.x = (Math.random() - 0.5) * cw * 1.5;
          f.y = (Math.random() - 0.5) * ch * 1.5;
          f.z = 1000;
        }

        const k = 300 / f.z;
        const px = f.x * k + cx;
        const py = f.y * k + cy;
        const size = Math.max(8, 70 * k);

        if (px >= -size && px <= cw + size && py >= -size && py <= ch + size) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(f.rot);

          const half = size / 2;
          const quad = size * 0.44;
          const gap = size * 0.08;

          ctx.fillStyle = '#ff3333';
          ctx.fillRect(-half, -half, quad, quad);
          ctx.fillStyle = '#33cc33';
          ctx.fillRect(-half + quad + gap, -half, quad, quad);
          ctx.fillStyle = '#3366ff';
          ctx.fillRect(-half, -half + quad + gap, quad, quad);
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(-half + quad + gap, -half + quad + gap, quad, quad);

          ctx.restore();
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  initMaze() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    const map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,1,0,1],
      [1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    let gx = 1;
    let gy = 1;
    let dir = 0;
    const dxArr = [1, 0, -1, 0];
    const dyArr = [0, 1, 0, -1];

    let px = 1.5;
    let py = 1.5;
    let angle = 0;
    let targetX = 1.5;
    let targetY = 1.5;
    let targetAngle = 0;
    let state = 'choose';

    const chooseNextStep = () => {
      const rightDir = (dir + 1) % 4;
      const fwdDir = dir;
      const leftDir = (dir + 3) % 4;
      const backDir = (dir + 2) % 4;

      if (map[gy + dyArr[rightDir]][gx + dxArr[rightDir]] === 0) {
        dir = rightDir;
        targetAngle += Math.PI / 2;
        state = 'turn';
      } else if (map[gy + dyArr[fwdDir]][gx + dxArr[fwdDir]] === 0) {
        gx += dxArr[fwdDir];
        gy += dyArr[fwdDir];
        targetX = gx + 0.5;
        targetY = gy + 0.5;
        state = 'move';
      } else if (map[gy + dyArr[leftDir]][gx + dxArr[leftDir]] === 0) {
        dir = leftDir;
        targetAngle -= Math.PI / 2;
        state = 'turn';
      } else {
        dir = backDir;
        targetAngle += Math.PI;
        state = 'turn';
      }
    };

    const cols = 160;
    const colW = Math.ceil(cw / cols);

    const loop = () => {
      if (!this.isActive) return;

      if (state === 'choose') {
        chooseNextStep();
      } else if (state === 'turn') {
        const diff = targetAngle - angle;
        if (Math.abs(diff) <= 0.06) {
          angle = targetAngle;
          gx += dxArr[dir];
          gy += dyArr[dir];
          targetX = gx + 0.5;
          targetY = gy + 0.5;
          state = 'move';
        } else {
          angle += Math.sign(diff) * 0.06;
        }
      } else if (state === 'move') {
        const dx = targetX - px;
        const dy = targetY - py;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0.05) {
          px = targetX;
          py = targetY;
          state = 'choose';
        } else {
          px += (dx / dist) * 0.05;
          py += (dy / dist) * 0.05;
        }
      }

      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(0, 0, cw, ch / 2);
      ctx.fillStyle = '#5a5246';
      ctx.fillRect(0, ch / 2, cw, ch / 2);

      const fov = Math.PI / 3;
      for (let i = 0; i < cols; i++) {
        const rayAngle = angle - fov / 2 + (i / cols) * fov;
        const rCos = Math.cos(rayAngle);
        const rSin = Math.sin(rayAngle);

        let dist = 0;
        let hitSide = 0;
        let hitX = 0;
        let hitY = 0;
        while (dist < 14) {
          dist += 0.03;
          hitX = px + rCos * dist;
          hitY = py + rSin * dist;
          const mx = Math.floor(hitX);
          const my = Math.floor(hitY);
          if (my < 0 || my >= map.length || mx < 0 || mx >= map[0].length || map[my][mx] === 1) {
            const fx = hitX - mx;
            const fy = hitY - my;
            hitSide = (Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy)) ? 0 : 1;
            break;
          }
        }

        const perpDist = Math.max(0.1, dist * Math.cos(rayAngle - angle));
        const wallH = Math.min(ch * 1.5, (ch * 0.85) / perpDist);
        const topY = (ch - wallH) / 2;

        const shade = Math.max(0.22, Math.min(1, 1.15 - perpDist * 0.12)) * (hitSide ? 0.8 : 1.0);
        const r = Math.floor(168 * shade);
        const g = Math.floor(62 * shade);
        const b = Math.floor(46 * shade);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * colW, topY, colW, wallH);

        const texCoord = hitSide ? (hitX - Math.floor(hitX)) : (hitY - Math.floor(hitY));
        if (Math.floor(texCoord * 4) % 2 === 0 && (texCoord * 16) % 4 < 0.35) {
          ctx.fillStyle = `rgba(210, 200, 185, ${0.45 * shade})`;
          ctx.fillRect(i * colW, topY, colW, wallH);
        }
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  initText3D() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    let t = 0;
    let vx = 3.2;
    let vy = 2.4;
    let cx = cw / 2;
    let cy = ch / 2;

    const loop = () => {
      if (!this.isActive) return;
      t += 0.035;
      cx += vx;
      cy += vy;
      if (cx < 200 || cx > cw - 200) vx *= -1;
      if (cy < 100 || cy > ch - 100) vy *= -1;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cw, ch);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const label = `Win 98 SE  ${timeStr}`;

      const scaleX = Math.cos(t);
      const tiltY = Math.sin(t * 0.7) * 0.22;
      const layers = 16;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.font = 'bold 56px "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = layers; i >= 0; i--) {
        ctx.save();
        const depthOffset = (i - layers / 2) * 2.2;
        ctx.translate(depthOffset * Math.sin(t), depthOffset * tiltY);
        ctx.scale(Math.max(0.12, Math.abs(scaleX)), 1);
        if (i === 0) {
          const grad = ctx.createLinearGradient(0, -30, 0, 30);
          grad.addColorStop(0, '#93c5fd');
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, '#2563eb');
          ctx.fillStyle = grad;
        } else {
          const c = Math.floor(40 + ((layers - i) / layers) * 110);
          ctx.fillStyle = `rgb(${Math.floor(c * 0.4)}, ${Math.floor(c * 0.7)}, ${c})`;
        }
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      ctx.restore();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }
}

window.appScreensaver = new AppScreensaver();
window.AppScreensaver = AppScreensaver;

