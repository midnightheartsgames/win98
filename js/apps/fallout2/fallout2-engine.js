/**
 * Fallout 2 2.5D Isometric Engine
 * Handles 2:1 dimetric projection, depth sorting, A* pathfinding,
 * camera tracking, particle effects, and procedural retro pixel-art rendering.
 */
class FalloutEngine {
  constructor(canvas, char, temple, audio, onCombatTrigger) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.char = char;
    this.temple = temple;
    this.audio = audio;
    this.onCombatTrigger = onCombatTrigger;

    // Dimetric 2:1 projection dimensions
    this.tileW = 64;
    this.tileH = 32;

    // Camera view offset (in screen pixels)
    this.camX = 0;
    this.camY = 0;

    // Hovered tile
    this.hoverTile = null;

    // Pathfinding & Movement
    this.isMoving = false;
    this.currentPath = [];
    this.moveTimer = 0;
    this.stepInterval = 140; // ms per tile
    this.lastStepTime = 0;

    // Visual effects & particles
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;

    // Sprite Cache (Offscreen Canvases for sharp retro rendering)
    this.sprites = {};
    this.initSprites();

    // Bind event listeners
    this.bindEvents();
  }

  initSprites() {
    this.sprites.floor = this.createTileSprite('#3c342a', '#2b241c', 'floor');
    this.sprites.floorAlt = this.createTileSprite('#443c32', '#322a22', 'floorAlt');
    this.sprites.pillar = this.createPillarSprite();
    this.sprites.wallPillar = this.sprites.pillar;
    this.sprites.trapPlate = this.createTrapSprite();
  }

  createTileSprite(baseCol, borderCol, type) {
    const c = document.createElement('canvas');
    c.width = this.tileW;
    c.height = this.tileH;
    const ctx = c.getContext('2d');

    // Isometric Diamond
    ctx.beginPath();
    ctx.moveTo(this.tileW / 2, 0);
    ctx.lineTo(this.tileW, this.tileH / 2);
    ctx.lineTo(this.tileW / 2, this.tileH);
    ctx.lineTo(0, this.tileH / 2);
    ctx.closePath();

    ctx.fillStyle = baseCol;
    ctx.fill();

    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Noise / Stone cracks
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(this.tileW * 0.3, this.tileH * 0.4, 6, 2);
    ctx.fillRect(this.tileW * 0.6, this.tileH * 0.6, 8, 1);
    ctx.fillRect(this.tileW * 0.45, this.tileH * 0.25, 4, 3);

    if (type === 'floorAlt') {
      ctx.fillStyle = 'rgba(180, 150, 100, 0.08)';
      ctx.fillRect(this.tileW * 0.2, this.tileH * 0.3, 14, 8);
    }

    return c;
  }

  drawWall(ctx, sx, sy, x, y) {
    const map = this.temple.map;
    const h = this.temple.height;
    const w = this.temple.width;

    // Surrounding floor checks to distinguish front vs back walls
    const hasFloorNorth = (y > 0 && map[y - 1][x] === 3);
    const hasFloorSouth = (y + 1 < h && map[y + 1][x] === 3);
    const hasFloorWest  = (x > 0 && map[y][x - 1] === 3);
    const hasFloorEast  = (x + 1 < w && map[y][x + 1] === 3);

    // Front wall: room is behind it (North/West) and no floor in front (South/East)
    // Low cutaway wall (14px) so camera can see inside rooms and corridors
    const isFront = (hasFloorNorth || hasFloorWest) && !hasFloorSouth && !hasFloorEast;
    const wallH = isFront ? 14 : 44;

    // 1. South-West Face (facing camera left)
    ctx.beginPath();
    ctx.moveTo(sx, sy + 16 - wallH);
    ctx.lineTo(sx + 32, sy + 32 - wallH);
    ctx.lineTo(sx + 32, sy + 32);
    ctx.lineTo(sx, sy + 16);
    ctx.closePath();

    ctx.fillStyle = isFront ? '#42382e' : '#4c4033';
    ctx.fill();
    ctx.strokeStyle = '#221b14';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (wallH > 20) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(sx, sy + 16 - 22);
      ctx.lineTo(sx + 32, sy + 32 - 22);
      ctx.stroke();
    }

    // 2. South-East Face (facing camera right)
    ctx.beginPath();
    ctx.moveTo(sx + 32, sy + 32 - wallH);
    ctx.lineTo(sx + 64, sy + 16 - wallH);
    ctx.lineTo(sx + 64, sy + 16);
    ctx.lineTo(sx + 32, sy + 32);
    ctx.closePath();

    ctx.fillStyle = isFront ? '#55473a' : '#635544';
    ctx.fill();
    ctx.strokeStyle = '#221b14';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (wallH > 20) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(sx + 32, sy + 32 - 22);
      ctx.lineTo(sx + 64, sy + 16 - 22);
      ctx.stroke();

      // Ancient temple carving on select back wall blocks
      if ((x + y) % 4 === 0) {
        ctx.fillStyle = 'rgba(200, 170, 110, 0.2)';
        ctx.fillRect(sx + 44, sy + 24 - 28, 8, 12);
        ctx.strokeStyle = 'rgba(30, 20, 15, 0.35)';
        ctx.strokeRect(sx + 44, sy + 24 - 28, 8, 12);
      }
    }

    // 3. Top Face (horizontal stone cap diamond)
    ctx.beginPath();
    ctx.moveTo(sx + 32, sy - wallH);
    ctx.lineTo(sx + 64, sy + 16 - wallH);
    ctx.lineTo(sx + 32, sy + 32 - wallH);
    ctx.lineTo(sx, sy + 16 - wallH);
    ctx.closePath();

    ctx.fillStyle = isFront ? '#665747' : '#756654';
    ctx.fill();
    ctx.strokeStyle = '#221b14';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  createPillarSprite() {
    const c = document.createElement('canvas');
    c.width = this.tileW;
    c.height = this.tileH + 56;
    const ctx = c.getContext('2d');

    // Stone Totem/Pillar
    ctx.fillStyle = '#554a3e';
    ctx.fillRect(this.tileW / 2 - 12, 12, 24, 52);
    ctx.strokeStyle = '#2a221a';
    ctx.strokeRect(this.tileW / 2 - 12, 12, 24, 52);

    // Tribal Carvings
    ctx.fillStyle = '#bfa77e';
    ctx.fillRect(this.tileW / 2 - 6, 20, 12, 6);
    ctx.fillRect(this.tileW / 2 - 8, 32, 16, 4);
    ctx.fillRect(this.tileW / 2 - 4, 42, 8, 8);

    return c;
  }

  createTrapSprite() {
    const c = document.createElement('canvas');
    c.width = this.tileW;
    c.height = this.tileH;
    const ctx = c.getContext('2d');

    // Isometric inner plate
    ctx.beginPath();
    ctx.moveTo(this.tileW / 2, 4);
    ctx.lineTo(this.tileW - 8, this.tileH / 2);
    ctx.lineTo(this.tileW / 2, this.tileH - 4);
    ctx.lineTo(8, this.tileH / 2);
    ctx.closePath();

    ctx.fillStyle = '#261f18';
    ctx.fill();
    ctx.strokeStyle = '#ff3322';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center pressure bolt
    ctx.fillStyle = '#ff4433';
    ctx.beginPath();
    ctx.arc(this.tileW / 2, this.tileH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    return c;
  }

  // World coordinates (x, y) -> Screen coordinates (px, py)
  worldToScreen(wx, wy) {
    const sx = (wx - wy) * (this.tileW / 2) + this.camX;
    const sy = (wx + wy) * (this.tileH / 2) + this.camY;
    return { x: sx, y: sy };
  }

  // Screen coordinates (px, py) -> World coordinates (wx, wy)
  screenToWorld(sx, sy) {
    const adjX = sx - this.camX;
    const adjY = sy - this.camY;
    const wx = Math.floor((adjX / (this.tileW / 2) + adjY / (this.tileH / 2)) / 2);
    const wy = Math.floor((adjY / (this.tileH / 2) - adjX / (this.tileW / 2)) / 2);
    return { x: wx, y: wy };
  }

  centerOnPlayer() {
    const p = {
      x: (this.char.x - this.char.y) * (this.tileW / 2),
      y: (this.char.x + this.char.y) * (this.tileH / 2)
    };
    this.camX = Math.round(this.canvas.width / 2 - p.x);
    this.camY = Math.round(this.canvas.height / 2 - p.y);
  }

  addFloatingText(text, wx, wy, color = '#ffdd44') {
    const s = this.worldToScreen(wx, wy);
    this.floatingTexts.push({
      text,
      x: s.x,
      y: s.y - 30,
      color,
      alpha: 1.0,
      life: 50
    });
  }

  addExplosionEffect(wx, wy) {
    this.screenShake = 18;
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        wx, wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 8 + 4,
        color: ['#ff4400', '#ffaa00', '#ffff55', '#444444'][Math.floor(Math.random() * 4)],
        life: Math.random() * 30 + 20,
        maxLife: 40
      });
    }
  }

  addBloodEffect(wx, wy) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      this.particles.push({
        wx, wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: '#aa1111',
        life: 25,
        maxLife: 25
      });
    }
  }

  // A* Pathfinding algorithm
  findPath(startX, startY, endX, endY, allowEndOccupied = false) {
    if (startX === endX && startY === endY) return [];

    // Ensure destination is at least a valid floor tile inside temple
    if (!this.temple.isFloor(endX, endY)) return [];

    // If destination is blocked and allowEndOccupied is false
    if (!allowEndOccupied && !this.temple.isWalkable(endX, endY)) return [];

    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();
    const key = (x, y) => `${x},${y}`;

    const dist = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = key(current.x, current.y);

      if (current.x === endX && current.y === endY) {
        const path = [];
        let curr = current;
        while (curr.parent) {
          path.unshift({ x: curr.x, y: curr.y });
          curr = curr.parent;
        }
        return path;
      }

      closedSet.add(currentKey);

      // 4 cardinal isometric directions + 4 diagonals (8 directions)
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
        { x: current.x + 1, y: current.y + 1 },
        { x: current.x - 1, y: current.y - 1 },
        { x: current.x + 1, y: current.y - 1 },
        { x: current.x - 1, y: current.y + 1 }
      ];

      for (const n of neighbors) {
        const nKey = key(n.x, n.y);
        if (closedSet.has(nKey)) continue;
        const isDestination = (n.x === endX && n.y === endY);
        const walkable = this.temple.isWalkable(n.x, n.y, allowEndOccupied) || (allowEndOccupied && isDestination);
        if (!walkable) continue;

        const g = current.g + 1;
        const h = dist(n.x, n.y, endX, endY);
        const f = g + h;

        const existing = openSet.find(item => item.x === n.x && item.y === n.y);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          openSet.push({ x: n.x, y: n.y, g, h, f, parent: current });
        }
      }
    }

    return [];
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.hoverTile = this.screenToWorld(mx, my);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Right click: toggle examine / attack cursor
      if (window.falloutUI) {
        window.falloutUI.onRightClick();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const target = this.screenToWorld(mx, my);

      if (window.falloutUI) {
        window.falloutUI.onWorldClick(target.x, target.y);
      }
    });
  }

  update(delta) {
    if (window.falloutUI && (!window.falloutUI.gameStarted || window.falloutUI.isPaused)) {
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - delta * 25);
    }

    // Camera following player
    const targetP = {
      x: (this.char.x - this.char.y) * (this.tileW / 2),
      y: (this.char.x + this.char.y) * (this.tileH / 2)
    };
    const desiredCamX = Math.round(this.canvas.width / 2 - targetP.x);
    const desiredCamY = Math.round(this.canvas.height / 2 - targetP.y);

    this.camX += (desiredCamX - this.camX) * Math.min(1, delta * 6);
    this.camY += (desiredCamY - this.camY) * Math.min(1, delta * 6);

    // Movement along path in Real-Time
    if (this.isMoving && this.currentPath.length > 0) {
      const now = performance.now();
      if (now - this.lastStepTime >= this.stepInterval) {
        this.lastStepTime = now;
        const nextStep = this.currentPath.shift();

        // Check if destination tile is blocked (e.g. closed door or enemy moved)
        if (this.temple.isWalkable(nextStep.x, nextStep.y)) {
          const dx = nextStep.x - this.char.x;
          const dy = nextStep.y - this.char.y;
          const dsx = (dx - dy) * (this.tileW / 2);
          if (dsx !== 0) {
            this.char.facingLeft = (dsx < 0);
          }

          this.char.x = nextStep.x;
          this.char.y = nextStep.y;

          // Check temple trigger on this tile (traps, door sensors)
          this.temple.onStepTile(this.char.x, this.char.y);

          // Check proximity to enemies to auto-engage combat
          if (this.onCombatTrigger) {
            const enemyNearby = this.temple.getEnemyNear(this.char.x, this.char.y, 4);
            if (enemyNearby && !enemyNearby.isDead && enemyNearby.state !== 'neutral') {
              this.isMoving = false;
              this.currentPath = [];
              this.onCombatTrigger(enemyNearby);
              return;
            }
          }
        } else {
          this.isMoving = false;
          this.currentPath = [];
        }

        if (this.currentPath.length === 0) {
          this.isMoving = false;
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta * 60;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= delta * 20;
      t.life -= delta * 30;
      t.alpha = Math.max(0, t.life / 50);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear background (Dark void / temple rock)
    ctx.fillStyle = '#0f0c09';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Render floor tiles
    this.renderFloor();

    // Render Depth-Sorted Objects (Walls, Containers, Enemies, Player, Traps)
    this.renderDepthObjects();

    // Render Hover Tile Marker / Selection
    this.renderHoverMarker();

    // Render Floating Text
    this.renderFloatingText();

    // Render Pause Indicator
    if (window.falloutUI && window.falloutUI.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(this.canvas.width / 2 - 70, 12, 140, 26);
      ctx.strokeStyle = '#ffaa33';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.canvas.width / 2 - 70, 12, 140, 26);
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ПАУЗА ]', this.canvas.width / 2, 29);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  isTileRevealed(x, y) {
    const d1 = this.temple.doors.find(d => d.id === 'door_1');
    const d2 = this.temple.doors.find(d => d.id === 'door_blast');
    // Area 2 is behind door 1 (y: 12)
    if (d1 && !d1.isOpen && y > 12) return false;
    // Area 3 is behind door blast (y: 28)
    if (d2 && !d2.isOpen && y > 28) return false;
    return true;
  }

  triggerAttackAnim(entity, dx, dy) {
    const dsx = (dx - dy) * (this.tileW / 2);
    const dsy = (dx + dy) * (this.tileH / 2);
    const len = Math.hypot(dsx, dsy) || 1;
    const lungeDist = 14;
    entity.lunge = {
      lx: (dsx / len) * lungeDist,
      ly: (dsy / len) * lungeDist,
      start: performance.now(),
      duration: 180
    };
    if (entity === this.char && dsx !== 0) {
      this.char.facingLeft = (dsx < 0);
    }
  }

  renderFloor() {
    const ctx = this.ctx;
    const map = this.temple.map;

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        if (tile !== 3) continue; // Only walkable floors
        if (!this.isTileRevealed(x, y)) continue; // Fog of war

        const s = this.worldToScreen(x, y);

        // Frustum culling
        if (s.x + this.tileW < 0 || s.x - this.tileW > this.canvas.width ||
            s.y + this.tileH < 0 || s.y - this.tileH > this.canvas.height) {
          continue;
        }

        // Draw Floor Tile
        const sprite = ((x + y) % 5 === 0) ? this.sprites.floorAlt : this.sprites.floor;
        ctx.drawImage(sprite, s.x, s.y);

        // Check if revealed trap exists here
        const trap = this.temple.getTrapAt(x, y);
        if (trap && trap.revealed && !trap.disarmed) {
          ctx.drawImage(this.sprites.trapPlate, s.x, s.y);
        }
      }
    }
  }

  renderDepthObjects() {
    const ctx = this.ctx;
    const map = this.temple.map;
    const objects = [];

    // Collect all walls
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (!this.isTileRevealed(x, y)) continue; // Fog of war
        const tile = map[y][x];
        if (tile === 1) { // Wall
          objects.push({ type: 'wall', x, y, depth: x + y });
        } else if (tile === 2) { // Pillar
          objects.push({ type: 'pillar', x, y, depth: x + y });
        }
      }
    }

    // Collect Doors
    this.temple.doors.forEach(d => {
      if (d.y <= 12 || this.isTileRevealed(d.x, d.y - 1)) {
        objects.push({ type: 'door', door: d, x: d.x, y: d.y, depth: d.x + d.y + 0.1 });
      }
    });

    // Collect Containers
    this.temple.containers.forEach(c => {
      if (this.isTileRevealed(c.x, c.y)) {
        objects.push({ type: 'container', container: c, x: c.x, y: c.y, depth: c.x + c.y + 0.2 });
      }
    });

    // Collect Enemies
    this.temple.enemies.forEach(e => {
      if (this.isTileRevealed(e.x, e.y)) {
        objects.push({ type: 'enemy', enemy: e, x: e.x, y: e.y, depth: e.x + e.y + 0.5 });
      }
    });

    // Player
    objects.push({
      type: 'player',
      char: this.char,
      x: this.char.x,
      y: this.char.y,
      depth: this.char.x + this.char.y + 0.6
    });

    // Sort by Isometric Depth (Painter's algorithm)
    objects.sort((a, b) => a.depth - b.depth);

    // Draw sorted objects
    objects.forEach(obj => {
      const s = this.worldToScreen(obj.x, obj.y);

      // Frustum culling
      if (s.x + 80 < 0 || s.x - 80 > this.canvas.width ||
          s.y + 120 < 0 || s.y - 120 > this.canvas.height) {
        return;
      }

      if (obj.type === 'wall') {
        this.drawWall(ctx, s.x, s.y, obj.x, obj.y);
      } else if (obj.type === 'pillar') {
        if (this.sprites.pillar) ctx.drawImage(this.sprites.pillar, s.x, s.y - 56);
      } else if (obj.type === 'door') {
        this.drawDoor(ctx, s.x, s.y, obj.door);
      } else if (obj.type === 'container') {
        this.drawContainer(ctx, s.x, s.y, obj.container);
      } else if (obj.type === 'enemy') {
        this.drawEnemy(ctx, s.x, s.y, obj.enemy);
      } else if (obj.type === 'player') {
        this.drawPlayer(ctx, s.x, s.y);
      }
    });

    // Render Particles on top
    this.renderParticles(ctx);
  }

  drawPlayer(ctx, sx, sy) {
    let lx = 0, ly = 0;
    if (this.char.lunge) {
      const elapsed = performance.now() - this.char.lunge.start;
      if (elapsed < this.char.lunge.duration) {
        const factor = Math.sin((elapsed / this.char.lunge.duration) * Math.PI);
        lx = this.char.lunge.lx * factor;
        ly = this.char.lunge.ly * factor;
      } else {
        this.char.lunge = null;
      }
    }

    const cx = sx + this.tileW / 2 + lx;
    const cy = sy + this.tileH / 2 + ly;

    ctx.save();
    if (this.char.facingLeft) {
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vault 13 Jumpsuit / Tribal Garb
    // Legs
    ctx.fillStyle = '#1e3888'; // Vault Blue
    ctx.fillRect(cx - 5, cy - 10, 4, 12);
    ctx.fillRect(cx + 1, cy - 10, 4, 12);

    // Torso
    ctx.fillStyle = '#2a4eb5';
    ctx.fillRect(cx - 7, cy - 24, 14, 15);

    // Yellow stripe down spine / collar (Vault Suit iconic mark)
    ctx.fillStyle = '#ffdd33';
    ctx.fillRect(cx - 1.5, cy - 24, 3, 15);

    // Head / Face
    ctx.fillStyle = '#f0b080';
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 6, 0, Math.PI * 2);
    ctx.fill();

    // Dark Tribal hair
    ctx.fillStyle = '#110d08';
    ctx.fillRect(cx - 6, cy - 36, 12, 5);

    // Weapon rendering (Spear, Healing Powder, or Fists)
    if (this.char.activeHand === 'spear') {
      // Long wooden spear shaft
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 14);
      ctx.lineTo(cx + 18, cy - 38);
      ctx.stroke();

      // Sharp Flint Spearhead
      ctx.fillStyle = '#dddddd';
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy - 38);
      ctx.lineTo(cx + 23, cy - 43);
      ctx.lineTo(cx + 15, cy - 40);
      ctx.closePath();
      ctx.fill();
    } else if (this.char.activeHand === 'healing_powder') {
      // Healing pouch / herbal packet
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(cx + 6, cy - 22, 6, 7);
      ctx.fillStyle = '#4e7c3b';
      ctx.fillRect(cx + 7, cy - 25, 4, 3);
      ctx.fillStyle = '#f0b080';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 18, 3, 0, Math.PI * 2);
      ctx.arc(cx - 7, cy - 18, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Boxer fists raised
      ctx.fillStyle = '#f0b080';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 20, 3.5, 0, Math.PI * 2);
      ctx.arc(cx - 8, cy - 18, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawEnemy(ctx, sx, sy, enemy) {
    let lx = 0, ly = 0;
    if (enemy.lunge) {
      const elapsed = performance.now() - enemy.lunge.start;
      if (elapsed < enemy.lunge.duration) {
        const factor = Math.sin((elapsed / enemy.lunge.duration) * Math.PI);
        lx = enemy.lunge.lx * factor;
        ly = enemy.lunge.ly * factor;
      } else {
        enemy.lunge = null;
      }
    }

    const cx = sx + this.tileW / 2 + lx;
    const cy = sy + this.tileH / 2 + ly;

    if (enemy.isDead) {
      // Corpse
      ctx.fillStyle = 'rgba(70, 30, 20, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.type === 'ant') {
      // Giant Ant
      ctx.fillStyle = '#612513';
      // Abdomen
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy - 4, 10, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Thorax
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 6, 7, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Head & Mandibles
      ctx.fillStyle = '#44160a';
      ctx.beginPath();
      ctx.arc(cx + 12, cy - 7, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mandibles
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 16, cy - 8);
      ctx.lineTo(cx + 20, cy - 5);
      ctx.stroke();

      // 6 Spidery Legs
      ctx.strokeStyle = '#44160a';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 5, cy - 4);
        ctx.lineTo(cx + i * 7 - 6, cy + 6);
        ctx.stroke();
      }
    } else if (enemy.type === 'scorpion') {
      // Small Radscorpion
      ctx.fillStyle = '#5c4827';
      // Carapace
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy - 4, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Raised curved stinger tail
      ctx.strokeStyle = '#7c6235';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 4);
      ctx.quadraticCurveTo(cx - 14, cy - 22, cx - 4, cy - 24);
      ctx.stroke();

      // Poison Stinger tip
      ctx.fillStyle = '#a8241b';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 24, 3, 0, Math.PI * 2);
      ctx.fill();

      // Two front pincers
      ctx.strokeStyle = '#5c4827';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy - 4);
      ctx.lineTo(cx + 16, cy - 10);
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + 16, cy + 6);
      ctx.stroke();
    } else if (enemy.type === 'cameron') {
      // Cameron (Tribal Champion)
      ctx.fillStyle = '#8c593b'; // Skin tone
      ctx.fillRect(cx - 6, cy - 14, 12, 16);

      // Tribal Warpaint & Kilt
      ctx.fillStyle = '#aa3322';
      ctx.fillRect(cx - 7, cy - 2, 14, 8); // Red loincloth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, cy - 22, 8, 2); // White paint

      // Head
      ctx.fillStyle = '#8c593b';
      ctx.beginPath();
      ctx.arc(cx, cy - 26, 7, 0, Math.PI * 2);
      ctx.fill();

      // Feathers
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 32);
      ctx.lineTo(cx + 4, cy - 42);
      ctx.stroke();
    }

    // Health Bar above enemy
    if (enemy.hp < enemy.maxHp) {
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(cx - 16, cy - 36, 32, 5);
      ctx.fillStyle = pct > 0.4 ? '#44ee44' : '#ee3322';
      ctx.fillRect(cx - 15, cy - 35, 30 * pct, 3);
    }
  }

  drawDoor(ctx, sx, sy, door) {
    const cx = sx + this.tileW / 2;
    const cy = sy + this.tileH / 2;

    // Doorway spans across X axis along wall line (slope dx: +32, dy: +16)
    const p1x = cx - 16, p1y = cy - 8;
    const p2x = cx + 16, p2y = cy + 8;
    const h = 38;

    if (door.isOpen) {
      // 1. Threshold line on floor
      ctx.strokeStyle = '#2b231a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      // 2. Open Door Frame Posts
      ctx.fillStyle = '#3c2c1d';
      ctx.strokeStyle = '#18120b';
      ctx.lineWidth = 1.5;

      // Left post
      ctx.fillRect(p1x - 3, p1y - h, 6, h + 2);
      ctx.strokeRect(p1x - 3, p1y - h, 6, h + 2);

      // Right post
      ctx.fillRect(p2x - 3, p2y - h, 6, h + 2);
      ctx.strokeRect(p2x - 3, p2y - h, 6, h + 2);

      // Lintel beam across top
      ctx.fillStyle = '#4c3825';
      ctx.beginPath();
      ctx.moveTo(p1x - 5, p1y - h);
      ctx.lineTo(p2x + 5, p2y - h);
      ctx.lineTo(p2x + 5, p2y - h + 6);
      ctx.lineTo(p1x - 5, p1y - h + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swung open door panel resting on left side
      ctx.fillStyle = '#523a22';
      ctx.beginPath();
      ctx.moveTo(p1x - 2, p1y);
      ctx.lineTo(p1x - 14, p1y + 6);
      ctx.lineTo(p1x - 14, p1y + 6 - 32);
      ctx.lineTo(p1x - 2, p1y - 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      return;
    }

    // CLOSED DOOR
    if (door.id === 'door_blast') {
      // Massive Stone Blast Door (Cracked)
      ctx.beginPath();
      ctx.moveTo(p1x - 2, p1y);
      ctx.lineTo(p2x + 2, p2y);
      ctx.lineTo(p2x + 2, p2y - h);
      ctx.lineTo(p1x - 2, p1y - h);
      ctx.closePath();

      ctx.fillStyle = '#484239';
      ctx.fill();
      ctx.strokeStyle = '#1c1713';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Deep glowing blast cracks
      ctx.strokeStyle = '#ff8822';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 26);
      ctx.lineTo(cx + 2, cy - 14);
      ctx.lineTo(cx - 3, cy - 2);
      ctx.stroke();
    } else if (door.id === 'door_exit') {
      // Ritual Gate to Arroyo
      ctx.beginPath();
      ctx.moveTo(p1x - 2, p1y);
      ctx.lineTo(p2x + 2, p2y);
      ctx.lineTo(p2x + 2, p2y - h);
      ctx.lineTo(p1x - 2, p1y - h);
      ctx.closePath();

      ctx.fillStyle = '#2d2419';
      ctx.fill();
      ctx.strokeStyle = '#aa8833';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vault 13 golden sun carving
      ctx.fillStyle = '#ffcc22';
      ctx.beginPath();
      ctx.arc(cx, cy - 18, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Reinforced Wooden Temple Door
      ctx.beginPath();
      ctx.moveTo(p1x - 2, p1y);
      ctx.lineTo(p2x + 2, p2y);
      ctx.lineTo(p2x + 2, p2y - h);
      ctx.lineTo(p1x - 2, p1y - h);
      ctx.closePath();

      ctx.fillStyle = '#543922';
      ctx.fill();
      ctx.strokeStyle = '#1d1209';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Iron Studs / Reinforcement Bands
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y - 10);
      ctx.lineTo(p2x, p2y - 10);
      ctx.moveTo(p1x, p1y - 26);
      ctx.lineTo(p2x, p2y - 26);
      ctx.stroke();

      // Iron rivets
      ctx.fillStyle = '#aaaaaa';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(cx + i * 8 - 1, cy + i * 4 - 11, 2.5, 2.5);
        ctx.fillRect(cx + i * 8 - 1, cy + i * 4 - 27, 2.5, 2.5);
      }

      // Keyhole / Latch
      ctx.fillStyle = '#ffaa33';
      ctx.fillRect(cx + 6, cy + 3 - 18, 3, 4);
    }

    // Door Frame border
    ctx.strokeStyle = '#3a2b1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1x - 2, p1y);
    ctx.lineTo(p1x - 2, p1y - h);
    ctx.lineTo(p2x + 2, p2y - h);
    ctx.lineTo(p2x + 2, p2y);
    ctx.stroke();
  }

  drawContainer(ctx, sx, sy, container) {
    const cx = sx + this.tileW / 2;
    const cy = sy + this.tileH / 2;

    if (container.type === 'bones') {
      // Human skeleton remains
      ctx.fillStyle = '#e8dcc4';
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 6, 4, 0, Math.PI * 2); // Skull
      ctx.fill();
      ctx.fillRect(cx + 2, cy - 4, 10, 3); // Ribs
      ctx.fillRect(cx - 6, cy + 2, 12, 2);
    } else if (container.type === 'urn') {
      // Clay vase / Urn
      ctx.fillStyle = '#9c5a3c';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 6, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c47d58';
      ctx.fillRect(cx - 4, cy - 16, 8, 3); // rim
    } else if (container.type === 'chest') {
      // Ancient Stone / Wood Chest
      ctx.fillStyle = '#443224';
      ctx.fillRect(cx - 12, cy - 14, 24, 16);
      ctx.strokeStyle = '#aa8844';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 12, cy - 14, 24, 16);
      // Keyhole
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(cx - 1.5, cy - 7, 3, 4);
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      const s = this.worldToScreen(p.wx, p.wy);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(s.x + this.tileW / 2 + (p.vx || 0) * (p.maxLife - p.life),
              s.y + this.tileH / 2 + (p.vy || 0) * (p.maxLife - p.life),
              p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderHoverMarker() {
    if (!this.hoverTile) return;
    const s = this.worldToScreen(this.hoverTile.x, this.hoverTile.y);
    const ctx = this.ctx;

    // Dimetric cursor diamond
    ctx.beginPath();
    ctx.moveTo(s.x + this.tileW / 2, s.y);
    ctx.lineTo(s.x + this.tileW, s.y + this.tileH / 2);
    ctx.lineTo(s.x + this.tileW / 2, s.y + this.tileH);
    ctx.lineTo(s.x, s.y + this.tileH / 2);
    ctx.closePath();

    ctx.strokeStyle = 'rgba(0, 255, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderFloatingText() {
    const ctx = this.ctx;
    ctx.font = 'bold 12px "Courier New", monospace';
    for (const t of this.floatingTexts) {
      ctx.fillStyle = `rgba(0,0,0,${t.alpha * 0.8})`;
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
  }
}

window.FalloutEngine = FalloutEngine;

