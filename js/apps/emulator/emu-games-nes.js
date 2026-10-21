(function() {
  const W = 256;
  const H = 224;

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function drawPixelSprite(ctx, rows, pal, x, y, scale, flipX, flipY) {
    const k = scale || 2;
    const h = rows.length;
    for (let j = 0; j < h; j++) {
      const row = rows[flipY ? (h - 1 - j) : j];
      const w = row.length;
      for (let i = 0; i < w; i++) {
        const ch = row[flipX ? (w - 1 - i) : i];
        const col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + i * k), Math.round(y + j * k), Math.ceil(k), Math.ceil(k));
      }
    }
  }

  function rotateGridCW(rows) {
    const h = rows.length;
    const w = rows[0] ? rows[0].length : 0;
    const out = [];
    for (let i = 0; i < w; i++) {
      let s = '';
      for (let j = h - 1; j >= 0; j--) {
        s += rows[j][i] || '.';
      }
      out.push(s);
    }
    return out;
  }

  function drawDirectionalSprite(ctx, baseUpRows, pal, x, y, scale, dir) {
    let rows = baseUpRows;
    const turns = ((dir % 4) + 4) % 4;
    for (let t = 0; t < turns; t++) {
      rows = rotateGridCW(rows);
    }
    drawPixelSprite(ctx, rows, pal, x, y, scale, false, false);
  }

  function drawHudText(ctx, str, x, y, color, shadow, size) {
    const px = size || 9;
    ctx.font = `bold ${px}px "Courier New", monospace`;
    if (shadow) {
      ctx.fillStyle = shadow;
      ctx.fillText(str, x + 1, y + 1);
    }
    ctx.fillStyle = color || '#fcfcfc';
    ctx.fillText(str, x, y);
  }

  function drawExplosionSprite(ctx, x, y, frame) {
    const pal = {
      w: '#fcfcfc',
      y: '#fce000',
      o: '#fca044',
      r: '#d82800'
    };
    const small = [
      '..r..r..',
      '.royyor.',
      'roywwyor',
      '.oywwyo.',
      '.royyor.',
      '..r..r..'
    ];
    const big = [
      'r..o..r.',
      '.royyor.',
      'oywwwwyo',
      'ywwwwwwy',
      'oywwwwyo',
      '.royyor.',
      '.r..o..r'
    ];
    drawPixelSprite(ctx, frame < 6 ? small : big, pal, x - 8, y - 8, 2);
  }

  function stepFxList(fxList) {
    for (let i = fxList.length - 1; i >= 0; i--) {
      const f = fxList[i];
      f.timer = (f.timer || 0) + 1;
      if (f.vx) f.x += f.vx;
      if (f.vy != null) {
        f.y += f.vy;
        if (f.gravity) f.vy += f.gravity;
      }
      if (f.timer >= (f.maxTimer || 24)) {
        fxList.splice(i, 1);
      }
    }
  }

  function renderFxList(ctx, fxList, scrollX) {
    const sx = scrollX || 0;
    fxList.forEach(f => {
      const rx = f.x - sx;
      const ry = f.y;
      if (f.kind === 'explosion') {
        drawExplosionSprite(ctx, rx, ry, f.timer);
      } else if (f.kind === 'popup') {
        drawHudText(ctx, f.text, rx, ry, f.color || '#fce000', '#000000', f.size || 8);
      } else if (f.kind === 'debris') {
        ctx.fillStyle = f.color || '#c84c0c';
        ctx.fillRect(Math.round(rx), Math.round(ry), f.size || 4, f.size || 4);
        ctx.fillStyle = '#fcbcb0';
        ctx.fillRect(Math.round(rx), Math.round(ry), 2, 2);
      } else if (f.kind === 'spark') {
        ctx.fillStyle = (f.timer % 2 === 0) ? '#fcfcfc' : (f.color || '#fce000');
        ctx.fillRect(Math.round(rx - 1), Math.round(ry - 1), 3, 3);
      }
    });
  }

  const TANK_SPRITES = {
    p1_0: [
      '...bb...',
      't.bbbb.t',
      'ttbaabtt',
      't.baab.t',
      'ttbaabtt',
      't.bbbb.t',
      'ttb..btt',
      't......t'
    ],
    p1_1: [
      '...bb...',
      '.tbbbbt.',
      'ttbaabtt',
      '.tbaabt.',
      'ttbaabtt',
      '.tbbbbt.',
      'ttb..btt',
      '.t....t.'
    ],
    fast_0: [
      '...bb...',
      'w.bbbb.w',
      'w.baab.w',
      '..baab..',
      'w.baab.w',
      'w.bbbb.w',
      '..b..b..',
      'w......w'
    ],
    armor_0: [
      '..bbbb..',
      'ttbbbbtt',
      'ttbaabtt',
      'ttbaabtt',
      'ttbaabtt',
      'ttbbbbtt',
      'ttbbbbtt',
      'tt....tt'
    ]
  };

  class BattleCityCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'battlecity';
      this.sys = 'nes';
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.stage = 1;
      this.maxStages = 35;
      this.score = 0;
      this.hiScore = 20000;
      this.lives = 3;
      this.tankTier = 1;
      this.cheatUnlocked = false;
      this.twoPlayer = false;
      this.tick = 0;
      this.grid = [];
      this.brickMask = [];
      this.enemiesLeft = 20;
      this.enemies = [];
      this.spawnEffects = [];
      this.bullets = [];
      this.fx = [];
      this.powerup = null;
      this.shovelTimer = 0;
      this.freezeTimer = 0;
      this.eagleAlive = true;
      this.spawnTimer = 0;
      this.curtainTimer = 0;
      this.player = { x: 80, y: 192, dir: 0, cd: 0, shield: 180, moveTick: 0 };
      this.ally = { x: 144, y: 192, dir: 0, cd: 0, active: false, shield: 180, moveTick: 0 };
      this.buildStage(this.stage);
    }

    buildStage(stageNum) {
      this.grid = [];
      this.brickMask = [];
      for (let r = 0; r < 13; r++) {
        const row = [];
        const maskRow = [];
        for (let c = 0; c < 13; c++) {
          let cell = 0;
          if (r >= 2 && r <= 9 && (c === 1 || c === 3 || c === 9 || c === 11)) {
            cell = ((r + c + stageNum) % 6 === 0) ? 2 : 1;
          } else if (r === 6 && c >= 5 && c <= 7) {
            cell = (stageNum % 2 === 1 && c === 6) ? 2 : 3;
          } else if ((r + stageNum) % 4 === 1 && c >= 4 && c <= 8 && r < 10) {
            cell = 1;
          } else if ((r * c + stageNum) % 9 === 0 && r > 1 && r < 10) {
            cell = 4;
          } else if ((r + c * 2 + stageNum) % 13 === 0 && r > 2 && r < 10) {
            cell = 5;
          }
          row.push(cell);
          maskRow.push(15);
        }
        this.grid.push(row);
        this.brickMask.push(maskRow);
      }
      this.grid[12][6] = 9;
      this.grid[12][4] = 0;
      this.grid[12][8] = 0;
      this.grid[0][0] = 0;
      this.grid[0][6] = 0;
      this.grid[0][12] = 0;
      this.setEagleWall(1);
      this.enemiesLeft = 20;
      this.enemies = [];
      this.spawnEffects = [];
      this.bullets = [];
      this.fx = [];
      this.powerup = null;
      this.freezeTimer = 0;
      this.eagleAlive = true;
      this.player.x = 80;
      this.player.y = 192;
      this.player.dir = 0;
      this.player.shield = 160;
      this.ally.x = 144;
      this.ally.y = 192;
      this.ally.dir = 0;
      this.ally.active = this.twoPlayer;
      this.ally.shield = 160;
      for (let i = 0; i < 3; i++) this.spawnEnemy(i);
    }

    setEagleWall(tileType) {
      const coords = [[11, 5], [11, 6], [11, 7], [12, 5], [12, 7]];
      coords.forEach(([r, c]) => {
        if (this.grid[r]) {
          this.grid[r][c] = tileType;
          if (this.brickMask[r]) this.brickMask[r][c] = 15;
        }
      });
    }

    spawnEnemy(slotIndex) {
      if (this.enemiesLeft <= 0 || this.enemies.length >= 4) return;
      const xs = [16, 112, 208];
      const idx = 20 - this.enemiesLeft;
      const sx = xs[(slotIndex != null ? slotIndex : idx) % 3];
      const bonus = (this.enemiesLeft % 4 === 0);
      const kinds = ['basic', 'fast', 'power', 'armor'];
      const kind = kinds[(idx + this.stage) % kinds.length];
      const hp = kind === 'armor' ? 3 : (this.stage > 4 && kind === 'power' ? 2 : 1);
      this.enemies.push({
        x: sx,
        y: 8,
        dir: 2,
        cd: 28,
        kind,
        hp,
        maxHp: hp,
        bonus,
        moveTick: 0,
        spawnFlash: 18
      });
      this.enemiesLeft--;
    }

    activateCheat() {
      this.cheatUnlocked = true;
      if (this.mode === 'title') {
        this.mode = 'stage_select';
      }
      this.stage = (this.stage % this.maxStages) + 1;
      this.tankTier = 3;
      this.shovelTimer = 600;
      this.player.shield = 360;
      this.buildStage(this.stage);
      this.setEagleWall(2);
      if (this.audio) this.audio.sfx('cheat');
      return `STAGE ${this.stage} / 35 + Тяжёлый танк 3-го ранга и бетонный штаб`;
    }

    onButtonPress(btn) {
      if (this.mode === 'title') {
        if (btn === 'select' || btn === 'up' || btn === 'down') {
          this.twoPlayer = !this.twoPlayer;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'start' || btn === 'a') {
          this.mode = 'stage_select';
          this.curtainTimer = 20;
          if (this.audio) this.audio.sfx('coin');
        }
        return;
      }
      if (this.mode === 'stage_select') {
        if (btn === 'a' || btn === 'right' || btn === 'up') {
          this.stage = this.stage < this.maxStages ? this.stage + 1 : 1;
          this.cheatUnlocked = true;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'b' || btn === 'left' || btn === 'down') {
          this.stage = this.stage > 1 ? this.stage - 1 : this.maxStages;
          this.cheatUnlocked = true;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'start') {
          this.buildStage(this.stage);
          if (this.shovelTimer > 0) this.setEagleWall(2);
          this.mode = 'play';
          if (this.audio) this.audio.sfx('powerup');
        }
        return;
      }
      if (this.mode === 'gameover') {
        if (btn === 'start' || btn === 'a') {
          this.reset();
        }
        return;
      }
      if (this.mode === 'play' && (btn === 'a' || btn === 'b' || btn === 'c')) {
        this.fireTank(this.player, true);
      }
    }

    fireTank(tank, fromPlayer) {
      if (tank.cd > 0) return;
      const tier = fromPlayer ? this.tankTier : (tank.kind === 'power' ? 2 : 1);
      tank.cd = fromPlayer ? Math.max(7, 20 - tier * 4) : (tank.kind === 'power' ? 26 : 42);
      const speed = tier >= 2 ? 4.4 : 3.4;
      const dirs = [[0, -speed], [speed, 0], [0, speed], [-speed, 0]];
      const [vx, vy] = dirs[tank.dir] || [0, -speed];
      this.bullets.push({
        x: tank.x + 7,
        y: tank.y + 7,
        vx,
        vy,
        dir: tank.dir,
        fromPlayer,
        power: tier
      });
      this.fx.push({ kind: 'spark', x: tank.x + 7 + vx * 2, y: tank.y + 7 + vy * 2, maxTimer: 5, color: '#fcfcfc' });
      if (fromPlayer && this.audio) this.audio.sfx('shoot');
    }

    canMoveTank(nx, ny) {
      if (nx < 16 || nx > 208 || ny < 8 || ny > 200) return false;
      const corners = [
        [nx + 2, ny + 2],
        [nx + 12, ny + 2],
        [nx + 2, ny + 12],
        [nx + 12, ny + 12]
      ];
      for (const [px, py] of corners) {
        const c = Math.floor((px - 16) / 16);
        const r = Math.floor((py - 8) / 16);
        if (r >= 0 && r < 13 && c >= 0 && c < 13) {
          const cell = this.grid[r][c];
          if (cell === 1 || cell === 2 || cell === 3 || cell === 9) return false;
        }
      }
      return true;
    }

    isOnIce(tank) {
      const c = Math.floor((tank.x + 7 - 16) / 16);
      const r = Math.floor((tank.y + 7 - 8) / 16);
      return r >= 0 && r < 13 && c >= 0 && c < 13 && this.grid[r][c] === 5;
    }

    damageBrickTile(r, c, dir, power) {
      if (!this.brickMask[r]) {
        this.grid[r][c] = 0;
        return;
      }
      if (power >= 3) {
        this.brickMask[r][c] = 0;
        this.grid[r][c] = 0;
        return;
      }
      let m = this.brickMask[r][c];
      if (dir === 0) {
        if (m & 12) m &= ~12; else m = 0;
      } else if (dir === 2) {
        if (m & 3) m &= ~3; else m = 0;
      } else if (dir === 1) {
        if (m & 5) m &= ~5; else m = 0;
      } else {
        if (m & 10) m &= ~10; else m = 0;
      }
      this.brickMask[r][c] = m;
      if (m === 0) this.grid[r][c] = 0;
    }

    step(input) {
      this.tick++;
      stepFxList(this.fx);
      if (this.curtainTimer > 0) this.curtainTimer--;
      if (this.mode !== 'play') return;

      const p = this.player;
      if (p.cd > 0) p.cd--;
      if (p.shield > 0) p.shield--;
      if (this.freezeTimer > 0) this.freezeTimer--;

      const spd = 1.55 + (this.tankTier > 1 ? 0.35 : 0) + (this.isOnIce(p) ? 0.45 : 0);
      let dx = 0;
      let dy = 0;
      if (input.up) { dy = -spd; p.dir = 0; }
      else if (input.right) { dx = spd; p.dir = 1; }
      else if (input.down) { dy = spd; p.dir = 2; }
      else if (input.left) { dx = -spd; p.dir = 3; }
      if (dx !== 0 || dy !== 0) {
        p.moveTick++;
        if (this.canMoveTank(p.x + dx, p.y + dy)) {
          p.x += dx;
          p.y += dy;
        }
      }
      if (input.a || input.b || input.c) this.fireTank(p, true);

      if (this.twoPlayer && this.ally.active) {
        if (this.ally.cd > 0) this.ally.cd--;
        if (this.ally.shield > 0) this.ally.shield--;
        this.ally.moveTick++;
        if (Math.random() < 0.04) this.ally.dir = Math.floor(Math.random() * 4);
        const dirs = [[0, -1.4], [1.4, 0], [0, 1.4], [-1.4, 0]];
        const [ax, ay] = dirs[this.ally.dir];
        if (this.canMoveTank(this.ally.x + ax, this.ally.y + ay)) {
          this.ally.x += ax;
          this.ally.y += ay;
        } else {
          this.ally.dir = (this.ally.dir + 1) % 4;
        }
        if (Math.random() < 0.06) this.fireTank(this.ally, true);
      }

      if (this.shovelTimer > 0) {
        this.shovelTimer--;
        if (this.shovelTimer === 0) this.setEagleWall(1);
      }

      this.spawnTimer++;
      if (this.spawnTimer > 90 && this.enemies.length < 4 && this.enemiesLeft > 0) {
        this.spawnTimer = 0;
        this.spawnEnemy();
      }

      this.enemies.forEach(en => {
        if (en.spawnFlash > 0) {
          en.spawnFlash--;
          return;
        }
        if (this.freezeTimer > 0) return;
        if (en.cd > 0) en.cd--;
        en.moveTick++;
        const espd = en.kind === 'fast' ? 1.65 : (en.kind === 'armor' ? 0.9 : 1.15);
        const dirs = [[0, -espd], [espd, 0], [0, espd], [-espd, 0]];
        const [ex, ey] = dirs[en.dir];
        if (this.canMoveTank(en.x + ex, en.y + ey) && Math.random() > 0.02) {
          en.x += ex;
          en.y += ey;
        } else {
          en.dir = Math.random() < 0.48 ? 2 : Math.floor(Math.random() * 4);
        }
        if (en.cd === 0 && Math.random() < 0.085) this.fireTank(en, false);
      });

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 16 || b.x > 222 || b.y < 8 || b.y > 214) {
          this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 6 });
          this.bullets.splice(i, 1);
          continue;
        }

        let cancelled = false;
        for (let k = i - 1; k >= 0; k--) {
          const ob = this.bullets[k];
          if (ob.fromPlayer !== b.fromPlayer && Math.abs(ob.x - b.x) < 6 && Math.abs(ob.y - b.y) < 6) {
            this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 8 });
            this.bullets.splice(i, 1);
            this.bullets.splice(k, 1);
            i--;
            cancelled = true;
            break;
          }
        }
        if (cancelled) continue;

        const c = Math.floor((b.x - 16) / 16);
        const r = Math.floor((b.y - 8) / 16);
        if (r >= 0 && r < 13 && c >= 0 && c < 13) {
          const cell = this.grid[r][c];
          if (cell === 1) {
            this.damageBrickTile(r, c, b.dir, b.power);
            this.fx.push({ kind: 'debris', x: b.x, y: b.y, vx: -1, vy: -1.5, gravity: 0.2, maxTimer: 12, color: '#b84818' });
            this.bullets.splice(i, 1);
            if (this.audio) this.audio.sfx('brickBreak');
            continue;
          } else if (cell === 2) {
            if (b.power >= 3) {
              this.grid[r][c] = 0;
              this.fx.push({ kind: 'explosion', x: b.x, y: b.y, maxTimer: 12 });
            } else {
              this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 6 });
            }
            this.bullets.splice(i, 1);
            if (this.audio) this.audio.sfx('hit');
            continue;
          } else if (cell === 9) {
            this.eagleAlive = false;
            this.grid[r][c] = 0;
            this.fx.push({ kind: 'explosion', x: 16 + c * 16 + 8, y: 8 + r * 16 + 8, maxTimer: 24 });
            this.mode = 'gameover';
            if (this.audio) this.audio.sfx('explosion');
            this.bullets.splice(i, 1);
            continue;
          }
        }

        if (b.fromPlayer) {
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const en = this.enemies[j];
            if (en.spawnFlash > 0) continue;
            if (rectOverlap(b.x - 2, b.y - 2, 4, 4, en.x, en.y, 14, 14)) {
              en.hp--;
              this.bullets.splice(i, 1);
              if (en.hp <= 0) {
                if (en.bonus) {
                  const types = ['star', 'shovel', 'bomb', 'clock', 'helmet', 'tank'];
                  this.powerup = {
                    type: types[(this.stage + j + this.enemiesLeft) % types.length],
                    x: 32 + ((j * 48 + this.stage * 16) % 144),
                    y: 40 + ((j * 32 + this.stage * 12) % 120)
                  };
                }
                const pts = en.kind === 'armor' ? 400 : (en.kind === 'power' ? 300 : (en.kind === 'fast' ? 200 : 100));
                this.score += pts;
                if (this.score > this.hiScore) this.hiScore = this.score;
                this.fx.push({ kind: 'explosion', x: en.x + 7, y: en.y + 7, maxTimer: 16 });
                this.fx.push({ kind: 'popup', text: String(pts), x: en.x, y: en.y, vy: -0.6, maxTimer: 26, color: '#fcfcfc' });
                this.enemies.splice(j, 1);
                if (this.audio) this.audio.sfx('explosion');
              } else {
                this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 7 });
                if (this.audio) this.audio.sfx('hit');
              }
              break;
            }
          }
        } else {
          if (rectOverlap(b.x - 2, b.y - 2, 4, 4, p.x, p.y, 14, 14)) {
            this.bullets.splice(i, 1);
            if (p.shield > 0) {
              this.fx.push({ kind: 'spark', x: p.x + 7, y: p.y + 7, maxTimer: 8 });
              continue;
            }
            this.lives--;
            this.tankTier = 1;
            this.fx.push({ kind: 'explosion', x: p.x + 7, y: p.y + 7, maxTimer: 20 });
            if (this.audio) this.audio.sfx('explosion');
            if (this.lives <= 0) {
              this.mode = 'gameover';
            } else {
              p.x = 80;
              p.y = 192;
              p.dir = 0;
              p.shield = 180;
            }
          }
        }
      }

      if (this.powerup && rectOverlap(p.x, p.y, 14, 14, this.powerup.x, this.powerup.y, 14, 14)) {
        const pt = this.powerup.type;
        if (pt === 'star') {
          this.tankTier = Math.min(3, this.tankTier + 1);
        } else if (pt === 'shovel') {
          this.shovelTimer = 550;
          this.setEagleWall(2);
        } else if (pt === 'bomb') {
          this.enemies.forEach(en => {
            this.fx.push({ kind: 'explosion', x: en.x + 7, y: en.y + 7, maxTimer: 18 });
          });
          this.score += this.enemies.length * 200;
          this.enemies = [];
          if (this.audio) this.audio.sfx('explosion');
        } else if (pt === 'clock') {
          this.freezeTimer = 360;
        } else if (pt === 'helmet') {
          p.shield = 420;
        } else if (pt === 'tank') {
          this.lives++;
        }
        this.score += 500;
        if (this.score > this.hiScore) this.hiScore = this.score;
        this.fx.push({ kind: 'popup', text: pt === 'tank' ? '1UP' : '500', x: this.powerup.x, y: this.powerup.y, vy: -0.7, maxTimer: 28, color: '#fce000' });
        this.powerup = null;
        if (this.audio) this.audio.sfx('powerup');
      }

      if (this.enemiesLeft === 0 && this.enemies.length === 0) {
        this.stage = (this.stage % this.maxStages) + 1;
        this.score += 1000;
        this.mode = 'stage_select';
        this.curtainTimer = 20;
        if (this.audio) this.audio.sfx('stageClear');
      }
    }

    drawBrickCell(ctx, tx, ty, mask) {
      const m = mask != null ? mask : 15;
      const quads = [
        [0, 0, 1],
        [8, 0, 2],
        [0, 8, 4],
        [8, 8, 8]
      ];
      quads.forEach(([qx, qy, bit]) => {
        if (!(m & bit)) return;
        const bx = tx + qx;
        const by = ty + qy;
        ctx.fillStyle = '#b84818';
        ctx.fillRect(bx, by, 8, 8);
        ctx.fillStyle = '#fca044';
        ctx.fillRect(bx, by, 7, 1);
        ctx.fillRect(bx, by + 4, 7, 1);
        ctx.fillStyle = '#706860';
        ctx.fillRect(bx, by + 3, 8, 1);
        ctx.fillRect(bx, by + 7, 8, 1);
        ctx.fillRect(bx + 7, by, 1, 4);
        ctx.fillRect(bx + 3, by + 4, 1, 4);
      });
    }

    drawTankEntity(ctx, tank, pal, spriteKey) {
      const frame = (tank.moveTick >> 1) & 1;
      const base = TANK_SPRITES[spriteKey] || (frame ? TANK_SPRITES.p1_1 : TANK_SPRITES.p1_0);
      drawDirectionalSprite(ctx, base, pal, tank.x, tank.y, 1.75, tank.dir || 0);
      if (tank.shield && tank.shield > 0) {
        ctx.strokeStyle = (this.tick % 4 < 2) ? '#fcfcfc' : '#3cbcfc';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(tank.x - 1), Math.round(tank.y - 1), 16, 16);
      }
    }

    render(ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);
      if (this.mode === 'title') {
        drawHudText(ctx, `I-    ${String(this.score).padStart(6, '0')}  HI- ${String(this.hiScore).padStart(6, '0')}`, 24, 24, '#fcfcfc', null, 9);
        const logoRows = [
          '###...##..#####.#####.#....####',
          '#..#.#..#...#.....#...#....#...',
          '###..####...#.....#...#....###.',
          '#..#.#..#...#.....#...#....#...',
          '###..#..#...#.....#...####.####',
          '...............................',
          '.....###..###.#####.#...#......',
          '....#......#....#....#.#.......',
          '....#......#....#.....#........',
          '....#......#....#.....#........',
          '.....###..###...#.....#........'
        ];
        drawPixelSprite(ctx, logoRows, { '#': '#d84818' }, 34, 38, 6);
        drawPixelSprite(ctx, logoRows, { '#': '#fca044' }, 33, 37, 6);

        const cursorY = this.twoPlayer ? 132 : 116;
        drawDirectionalSprite(ctx, TANK_SPRITES.p1_0, { b: '#fce020', a: '#fff8a0', t: '#c87800' }, 64, cursorY - 10, 1.6, 1);
        drawHudText(ctx, '1 PLAYER', 88, 120, !this.twoPlayer ? '#fce000' : '#fcfcfc', null, 10);
        drawHudText(ctx, '2 PLAYERS', 88, 136, this.twoPlayer ? '#fce000' : '#fcfcfc', null, 10);
        drawHudText(ctx, 'CONSTRUCTION', 88, 152, '#bcbcbc', null, 10);
        drawPixelSprite(ctx, ['..y..y..', '.yyyyyy.', 'yyy..yyy', '.yyyyyy.', '..y..y..'], { y: '#d84818' }, 118, 166, 2);
        drawHudText(ctx, 'NAMCO 1985  [НАЖМИТЕ START]', 44, 200, '#fcfcfc', null, 9);
        return;
      }

      if (this.mode === 'stage_select') {
        ctx.fillStyle = '#7c7c7c';
        ctx.fillRect(0, 0, W, H);
        drawHudText(ctx, `STAGE  ${String(this.stage).padStart(2, ' ')}`, 86, 104, '#000000', '#bcbcbc', 14);
        drawHudText(ctx, 'Кнопки A / B меняют уровень (1..35)', 28, 136, '#000000', null, 9);
        drawHudText(ctx, 'Нажмите START для высадки в бой', 42, 152, '#202020', null, 9);
        return;
      }

      ctx.fillStyle = '#7c7c7c';
      ctx.fillRect(0, 0, 16, H);
      ctx.fillRect(0, 0, W, 8);
      ctx.fillRect(0, 216, W, 8);
      ctx.fillRect(224, 0, 32, H);

      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          const cell = this.grid[r][c];
          const tx = 16 + c * 16;
          const ty = 8 + r * 16;
          if (cell === 1) {
            this.drawBrickCell(ctx, tx, ty, this.brickMask[r] ? this.brickMask[r][c] : 15);
          } else if (cell === 2) {
            ctx.fillStyle = '#7c7c7c';
            ctx.fillRect(tx, ty, 16, 16);
            ctx.fillStyle = '#bcbcbc';
            ctx.fillRect(tx + 1, ty + 1, 14, 14);
            ctx.fillStyle = '#fcfcfc';
            ctx.fillRect(tx + 3, ty + 3, 10, 10);
          } else if (cell === 3) {
            ctx.fillStyle = '#2038ec';
            ctx.fillRect(tx, ty, 16, 16);
            ctx.fillStyle = '#3cbcfc';
            const waveShift = ((this.tick >> 4) + r + c) % 2;
            ctx.fillRect(tx + 2 + waveShift * 3, ty + 3, 5, 2);
            ctx.fillRect(tx + 7 - waveShift * 3, ty + 10, 5, 2);
          } else if (cell === 5) {
            ctx.fillStyle = '#bcbcbc';
            ctx.fillRect(tx, ty, 16, 16);
            ctx.fillStyle = '#fcfcfc';
            ctx.fillRect(tx + 2, ty + 2, 5, 2);
            ctx.fillRect(tx + 9, ty + 9, 5, 2);
            ctx.fillRect(tx + 3, ty + 11, 3, 3);
          } else if (cell === 9) {
            if (this.eagleAlive) {
              drawPixelSprite(ctx, [
                '..y....y..',
                '.yyy..yyy.',
                'yyyywwyyyy',
                '.yyyyyyyy.',
                '..yyyyyy..',
                '...yyyy...',
                '.yyyyyyyy.'
              ], { y: '#d8a020', w: '#fcfcfc' }, tx + 1, ty + 1, 1.5);
            } else {
              drawPixelSprite(ctx, [
                '..rrrr..',
                '.r....r.',
                'r.r..r.r',
                '........',
                '.rrrrrr.'
              ], { r: '#7c7c7c' }, tx + 2, ty + 3, 1.6);
            }
          }
        }
      }

      const p1Pal = this.tankTier >= 3
        ? { b: '#fff040', a: '#fcfcfc', t: '#d88800' }
        : { b: '#e8d020', a: '#fcf8a0', t: '#a87800' };
      this.drawTankEntity(ctx, this.player, p1Pal, this.tankTier >= 3 ? 'armor_0' : ((this.player.moveTick >> 1) & 1 ? 'p1_1' : 'p1_0'));

      if (this.twoPlayer && this.ally.active) {
        this.drawTankEntity(ctx, this.ally, { b: '#58d854', a: '#b8f8b8', t: '#007800' }, 'p1_0');
      }

      this.enemies.forEach(en => {
        if (en.spawnFlash > 0) {
          const starRows = (en.spawnFlash % 4 < 2)
            ? ['...w...', '..www..', '.wwwww.', 'wwwwwww', '.wwwww.', '..www..', '...w...']
            : ['...w...', '...w...', '...w...', 'wwwwwww', '...w...', '...w...', '...w...'];
          drawPixelSprite(ctx, starRows, { w: '#fcfcfc' }, en.x + 1, en.y + 1, 2);
          return;
        }
        let pal = { b: '#bcbcbc', a: '#fcfcfc', t: '#7c7c7c', w: '#585858' };
        if (en.bonus && (this.tick % 12 < 6)) {
          pal = { b: '#d82800', a: '#fcfcfc', t: '#fcbcb0', w: '#fcfcfc' };
        } else if (en.kind === 'armor') {
          pal = en.hp >= 3
            ? { b: '#00a800', a: '#b8f8b8', t: '#005000' }
            : (en.hp === 2 ? { b: '#e8d020', a: '#fcfcfc', t: '#887000' } : { b: '#bcbcbc', a: '#fcfcfc', t: '#585858' });
        } else if (en.kind === 'fast') {
          pal = { b: '#3cbcfc', a: '#fcfcfc', t: '#0058f8', w: '#fcfcfc' };
        } else if (en.kind === 'power') {
          pal = { b: '#fca044', a: '#fcfcfc', t: '#b84818', w: '#7c7c7c' };
        }
        const key = en.kind === 'fast' ? 'fast_0' : (en.kind === 'armor' ? 'armor_0' : 'p1_0');
        this.drawTankEntity(ctx, en, pal, key);
      });

      ctx.fillStyle = '#fcfcfc';
      this.bullets.forEach(b => {
        ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - 2), 4, 4);
      });

      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          if (this.grid[r][c] === 4) {
            const tx = 16 + c * 16;
            const ty = 8 + r * 16;
            ctx.fillStyle = '#005000';
            ctx.fillRect(tx + 1, ty + 1, 14, 14);
            ctx.fillStyle = '#00a800';
            ctx.fillRect(tx + 2, ty + 2, 5, 5);
            ctx.fillRect(tx + 9, ty + 2, 5, 5);
            ctx.fillRect(tx + 2, ty + 9, 5, 5);
            ctx.fillRect(tx + 9, ty + 9, 5, 5);
            ctx.fillStyle = '#58d854';
            ctx.fillRect(tx + 4, ty + 3, 2, 2);
            ctx.fillRect(tx + 10, ty + 10, 2, 2);
          }
        }
      }

      if (this.powerup && (this.tick % 16 < 12)) {
        const px = this.powerup.x;
        const py = this.powerup.y;
        ctx.fillStyle = '#0058f8';
        ctx.fillRect(px, py, 16, 16);
        ctx.strokeStyle = '#fcfcfc';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, 14, 14);
        const labelMap = { star: '★', shovel: 'П', bomb: 'Б', clock: 'Ч', helmet: 'Щ', tank: 'Т' };
        drawHudText(ctx, labelMap[this.powerup.type] || '★', px + 4, py + 12, '#fce000', '#000000', 10);
      }

      renderFxList(ctx, this.fx, 0);

      for (let i = 0; i < Math.min(20, this.enemiesLeft); i++) {
        const ix = 229 + (i % 2) * 10;
        const iy = 14 + Math.floor(i / 2) * 9;
        drawPixelSprite(ctx, ['.#.#.', '#####', '.###.', '#.#.#'], { '#': '#000000' }, ix, iy, 1.4);
      }
      drawHudText(ctx, 'IP', 228, 138, '#000000', null, 9);
      drawPixelSprite(ctx, ['.#.', '###', '#.#'], { '#': '#e8d020' }, 228, 143, 2);
      drawHudText(ctx, String(this.lives), 238, 150, '#000000', null, 9);
      drawPixelSprite(ctx, ['#####', '#####', '###..', '#....', '#....'], { '#': '#d82800' }, 229, 174, 2);
      drawHudText(ctx, String(this.stage).padStart(2, ' '), 230, 198, '#000000', null, 10);

      if (this.mode === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(56, 88, 128, 44);
        drawHudText(ctx, 'GAME', 96, 106, '#d82800', '#fcfcfc', 14);
        drawHudText(ctx, 'OVER', 96, 122, '#d82800', '#fcfcfc', 14);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        stage: this.stage,
        score: this.score,
        lives: this.lives,
        tankTier: this.tankTier,
        cheatUnlocked: this.cheatUnlocked,
        enemiesLeft: this.enemiesLeft,
        player: { ...this.player },
        grid: this.grid.map(r => r.slice()),
        brickMask: this.brickMask.map(r => r.slice())
      };
    }

    restoreState(st) {
      if (!st) return;
      this.mode = st.mode || 'play';
      this.stage = st.stage || 1;
      this.score = st.score || 0;
      this.lives = st.lives || 3;
      this.tankTier = st.tankTier || 1;
      this.cheatUnlocked = !!st.cheatUnlocked;
      this.enemiesLeft = st.enemiesLeft != null ? st.enemiesLeft : 15;
      if (st.player) this.player = { ...this.player };
      if (st.grid) this.grid = st.grid.map(r => r.slice());
      if (st.brickMask) this.brickMask = st.brickMask.map(r => r.slice());
    }
  }

  const MARIO_SPRITES = {
    small_idle: [
      '..rrrrr...',
      '.rrrrrrrr.',
      '.bbbssbs..',
      'bsbsssbss.',
      'bsbbsssbs.',
      'bbssssbbb.',
      '..sssss...',
      '.rrbrrr...',
      'rrrbrrbrr.',
      'rrrrbbbbr.',
      'ssbybbybss',
      'ssbbbbbbss',
      '..bb..bb..',
      '.bbb..bbb.'
    ],
    small_run: [
      '..rrrrr...',
      '.rrrrrrrr.',
      '.bbbssbs..',
      'bsbsssbss.',
      'bsbbsssbs.',
      'bbssssbbb.',
      '..sssss...',
      '..rrrbrr..',
      '.ssbbbbbr.',
      'ssbbbbbb..',
      '..bbbbbb..',
      '.bbb..bbb.',
      'bb......bb',
      '..........'
    ],
    small_jump: [
      '......sss.',
      '..rrrrrsss',
      '.rrrrrrrrb',
      '.bbbssbsb.',
      'bsbsssbss.',
      'bbssssbbb.',
      '..sssss...',
      '.rrrbrrr..',
      'rrrrbbbbr.',
      'ssbybbybr.',
      '..bbbbbb..',
      '.bb....bbb',
      'bb........',
      '..........'
    ],
    goomba_0: [
      '....bbbb....',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      'bbbwkbbkwbbb',
      'bbbwkbbkwbbb',
      'bbbbbbbbbbbb',
      '..ssssssss..',
      '...ssssss...',
      '..kkk....kk.'
    ],
    goomba_1: [
      '....bbbb....',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      'bbbwkbbkwbbb',
      'bbbwkbbkwbbb',
      'bbbbbbbbbbbb',
      '..ssssssss..',
      '...ssssss...',
      '.kk....kkk..'
    ],
    goomba_flat: [
      '............',
      '..bbbbbbbb..',
      'bbbwkbbkwbbb',
      'bbbbbbbbbbbb',
      '..kkkkkkkk..'
    ],
    koopa_0: [
      '.yy.........',
      'ykwy..gggg..',
      'yyyy.gggggg.',
      '..yygwgwgwgg',
      '.yyygggggggg',
      'yyyy.gggggg.',
      '..yy..yy..yy',
      '.....yy..yy.'
    ],
    shell: [
      '..gggggg..',
      '.gwgwgwgg.',
      'gggggggggg',
      'gwwwwwwwwg',
      '.gggggggg.'
    ],
    bowser: [
      '..rr..gggg....',
      '.wyrrgggggg...',
      'wwkrggggoyog..',
      'rrrggggoyyyog.',
      '..yyyyggggoyog',
      '.yyyyygggggggg',
      '..rr..ggggggg.',
      '....yy...yy...'
    ]
  };

  class SuperMarioBrosCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'smb';
      this.sys = 'nes';
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.world = 1;
      this.stage = 1;
      this.lastLostWorld = 1;
      this.score = 0;
      this.coins = 0;
      this.lives = 3;
      this.time = 400;
      this.tick = 0;
      this.cheatUnlocked = false;
      this.fx = [];
      this.loadCourse(1, 1);
    }

    loadCourse(w, s) {
      this.world = w;
      this.stage = s;
      this.time = 400;
      this.scrollX = 0;
      this.fx = [];
      this.mario = {
        x: 36,
        y: 168,
        vx: 0,
        vy: 0,
        dir: 1,
        onGround: true,
        crouch: false,
        power: this.mario ? this.mario.power : 0,
        invuln: 0,
        starTimer: 0
      };
      this.blocks = [
        { x: 112, y: 128, type: 'q', item: 'coin', hit: false, bump: 0 },
        { x: 144, y: 128, type: 'brick', item: null, hit: false, bump: 0 },
        { x: 160, y: 128, type: 'q', item: 'power', hit: false, bump: 0 },
        { x: 176, y: 128, type: 'brick', item: null, hit: false, bump: 0 },
        { x: 192, y: 128, type: 'q', item: 'coin', hit: false, bump: 0 },
        { x: 160, y: 76, type: 'q', item: 'star', hit: false, bump: 0 },
        { x: 280, y: 128, type: 'q', item: 'coin', hit: false, bump: 0 },
        { x: 296, y: 128, type: 'brick', item: null, hit: false, bump: 0 },
        { x: 360, y: 96, type: 'q', item: 'power', hit: false, bump: 0 },
        { x: 464, y: 128, type: 'brick', item: null, hit: false, bump: 0 },
        { x: 480, y: 128, type: 'q', item: 'coin', hit: false, bump: 0 }
      ];
      this.pipes = s === 4 ? [] : [
        { x: 216, y: 160, h: 32, piranha: true },
        { x: 320, y: 144, h: 48, piranha: true },
        { x: 430, y: 152, h: 40, piranha: false }
      ];
      this.enemies = [
        { x: 185, y: 176, vx: -0.75, kind: 'goomba', alive: true, flatTimer: 0 },
        { x: 265, y: 176, vx: -0.75, kind: 'goomba', alive: true, flatTimer: 0 },
        { x: 305, y: 174, vx: -0.85, kind: 'koopa', shell: false, shellMoving: false, alive: true },
        { x: 395, y: 176, vx: -0.85, kind: 'goomba', alive: true, flatTimer: 0 },
        { x: 490, y: 174, vx: -0.9, kind: 'koopa', shell: false, shellMoving: false, alive: true },
        { x: 545, y: s === 4 ? 156 : 174, vx: -0.8, kind: s === 4 ? 'bowser' : 'koopa', hp: s === 4 ? 5 : 1, shell: false, shellMoving: false, alive: true }
      ];
      this.items = [];
      this.fireballs = [];
      this.flagX = 600;
      this.flagY = 70;
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.world = Math.max(this.lastLostWorld || 2, (this.world % 8) + 1);
      this.stage = 1;
      this.lives = Math.max(this.lives, 5);
      this.loadCourse(this.world, this.stage);
      this.mario.power = 2;
      this.mario.starTimer = 240;
      this.mode = 'play';
      if (this.audio) this.audio.sfx('cheat');
      return `Продолжение с WORLD ${this.world}-1 + Огненный Марио и Звезда`;
    }

    onButtonPress(btn, inputState) {
      if (this.mode === 'title' || this.mode === 'gameover') {
        if (btn === 'start') {
          if (inputState && inputState.a && this.lastLostWorld > 1) {
            this.cheatUnlocked = true;
            this.world = this.lastLostWorld;
            this.stage = 1;
            if (this.audio) this.audio.sfx('cheat');
          } else {
            this.world = 1;
            this.stage = 1;
          }
          this.lives = 3;
          this.loadCourse(this.world, this.stage);
          this.mode = 'play';
        }
        return;
      }
      if (this.mode === 'play') {
        if (btn === 'a' && this.mario.onGround) {
          this.mario.vy = -5.8;
          this.mario.onGround = false;
          if (this.audio) this.audio.sfx('jump');
        } else if ((btn === 'b' || btn === 'c') && this.mario.power === 2 && this.fireballs.length < 3) {
          this.fireballs.push({
            x: this.mario.x + (this.mario.dir > 0 ? 12 : -4),
            y: this.mario.y + 8,
            vx: 3.6 * (this.mario.dir || 1),
            vy: 1.5
          });
          if (this.audio) this.audio.sfx('shoot');
        }
      }
    }

    step(input) {
      this.tick++;
      stepFxList(this.fx);
      if (this.mode !== 'play') return;
      if (this.tick % 30 === 0 && this.time > 0) this.time--;
      const m = this.mario;
      if (m.invuln > 0) m.invuln--;
      if (m.starTimer > 0) m.starTimer--;
      m.crouch = !!(input.down && m.onGround && m.power > 0);

      const accel = input.b ? 2.45 : 1.75;
      if (input.left && !m.crouch) { m.vx = -accel; m.dir = -1; }
      else if (input.right && !m.crouch) { m.vx = accel; m.dir = 1; }
      else m.vx *= 0.76;

      if (input.a && m.onGround) {
        m.vy = -5.8;
        m.onGround = false;
        if (this.audio) this.audio.sfx('jump');
      }

      m.x = Math.max(this.scrollX + 8, m.x + m.vx);
      if (m.x - this.scrollX > 112) {
        this.scrollX = m.x - 112;
      }

      m.vy += 0.28;
      m.y += m.vy;

      const mh = (m.power > 0 && !m.crouch) ? 24 : 16;
      if (m.y + mh >= 192) {
        m.y = 192 - mh;
        m.vy = 0;
        m.onGround = true;
      }

      this.pipes.forEach(p => {
        if (rectOverlap(m.x, m.y, 13, mh, p.x, p.y, 28, p.h)) {
          if (m.vy > 0 && m.y + mh - m.vy <= p.y + 5) {
            m.y = p.y - mh;
            m.vy = 0;
            m.onGround = true;
          } else if (m.vx > 0) {
            m.x = p.x - 13;
          } else if (m.vx < 0) {
            m.x = p.x + 28;
          }
        }
      });

      for (let bi = this.blocks.length - 1; bi >= 0; bi--) {
        const b = this.blocks[bi];
        if (b.bump > 0) b.bump--;
        if (rectOverlap(m.x, m.y, 13, mh, b.x, b.y, 16, 16)) {
          if (m.vy < 0 && m.y - m.vy >= b.y + 9) {
            m.y = b.y + 16;
            m.vy = 0.6;
            b.bump = 6;
            this.enemies.forEach(en => {
              if (en.alive && rectOverlap(en.x, en.y, 14, 18, b.x - 2, b.y - 18, 20, 18)) {
                en.alive = false;
                this.score += 200;
                this.fx.push({ kind: 'popup', text: '200', x: en.x, y: en.y, vy: -0.7, maxTimer: 22 });
              }
            });
            if (b.type === 'brick' && !b.item && m.power > 0) {
              [[-1.8, -3.5], [1.8, -3.5], [-1.2, -2.0], [1.2, -2.0]].forEach(([dvx, dvy]) => {
                this.fx.push({ kind: 'debris', x: b.x + 6, y: b.y + 4, vx: dvx, vy: dvy, gravity: 0.25, maxTimer: 24, color: '#c84c0c' });
              });
              this.score += 50;
              this.blocks.splice(bi, 1);
              if (this.audio) this.audio.sfx('brickBreak');
              continue;
            }
            if (!b.hit && b.item) {
              b.hit = true;
              if (b.item === 'coin') {
                this.coins++;
                this.score += 200;
                this.fx.push({ kind: 'popup', text: '200', x: b.x + 2, y: b.y - 10, vy: -0.8, maxTimer: 22, color: '#fce000' });
                if (this.audio) this.audio.sfx('coin');
              } else if (b.item === 'power') {
                this.items.push({ x: b.x, y: b.y - 16, vx: 0.9, vy: 0, kind: m.power === 0 ? 'mushroom' : 'flower' });
                if (this.audio) this.audio.sfx('powerup');
              } else if (b.item === 'star') {
                this.items.push({ x: b.x, y: b.y - 16, vx: 1.2, vy: -2.5, kind: 'star' });
                if (this.audio) this.audio.sfx('powerup');
              }
            } else if (this.audio) {
              this.audio.sfx('hit');
            }
          } else if (m.vy > 0 && m.y + mh - m.vy <= b.y + 6) {
            m.y = b.y - mh;
            m.vy = 0;
            m.onGround = true;
          }
        }
      }

      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (it.kind === 'mushroom' || it.kind === 'star') {
          it.x += it.vx;
          if (it.kind === 'star') {
            it.y += it.vy;
            it.vy += 0.22;
            if (it.y >= 176) { it.y = 176; it.vy = -3.4; }
          } else if (it.y < 176 && it.x > 196) {
            it.y = Math.min(176, it.y + 1.8);
          }
        }
        if (rectOverlap(m.x, m.y, 13, mh, it.x, it.y, 14, 14)) {
          if (it.kind === 'star') {
            m.starTimer = 360;
          } else {
            m.power = it.kind === 'flower' ? 2 : Math.max(1, m.power);
          }
          this.score += 1000;
          this.fx.push({ kind: 'popup', text: '1000', x: it.x, y: it.y, vy: -0.7, maxTimer: 24, color: '#fcfcfc' });
          this.items.splice(i, 1);
          if (this.audio) this.audio.sfx('powerup');
        }
      }

      for (let i = this.fireballs.length - 1; i >= 0; i--) {
        const fb = this.fireballs[i];
        fb.x += fb.vx;
        fb.y += fb.vy;
        if (fb.y >= 184) fb.vy = -2.0;
        else fb.vy += 0.25;
        if (fb.x > this.scrollX + W || fb.x < this.scrollX) {
          this.fireballs.splice(i, 1);
          continue;
        }
        for (const en of this.enemies) {
          if (en.alive && en.flatTimer === 0 && rectOverlap(fb.x, fb.y, 6, 6, en.x, en.y, en.kind === 'bowser' ? 26 : 16, en.kind === 'bowser' ? 28 : 16)) {
            en.hp = (en.hp || 1) - 1;
            this.fx.push({ kind: 'spark', x: fb.x, y: fb.y, maxTimer: 6 });
            if (en.hp <= 0) {
              en.alive = false;
              const pts = en.kind === 'bowser' ? 5000 : 200;
              this.score += pts;
              this.fx.push({ kind: 'popup', text: String(pts), x: en.x, y: en.y, vy: -0.7, maxTimer: 24 });
            }
            this.fireballs.splice(i, 1);
            if (this.audio) this.audio.sfx('hit');
            break;
          }
        }
      }

      this.enemies.forEach(en => {
        if (!en.alive) return;
        if (en.flatTimer > 0) {
          en.flatTimer--;
          if (en.flatTimer === 0) en.alive = false;
          return;
        }
        en.x += en.vx;
        if (en.x < 40 || en.x > 585) en.vx = -en.vx;

        if (en.shell && en.shellMoving) {
          this.enemies.forEach(other => {
            if (other !== en && other.alive && other.flatTimer === 0 && rectOverlap(en.x, en.y, 14, 14, other.x, other.y, 14, 16)) {
              other.alive = false;
              this.score += 500;
              this.fx.push({ kind: 'popup', text: '500', x: other.x, y: other.y, vy: -0.7, maxTimer: 22 });
              if (this.audio) this.audio.sfx('hit');
            }
          });
        }

        const ew = en.kind === 'bowser' ? 26 : 14;
        const eh = en.kind === 'bowser' ? 28 : 16;
        if (rectOverlap(m.x, m.y, 13, mh, en.x, en.y, ew, eh)) {
          if (m.starTimer > 0) {
            en.alive = false;
            this.score += 200;
            this.fx.push({ kind: 'popup', text: '200', x: en.x, y: en.y, vy: -0.7, maxTimer: 22 });
            if (this.audio) this.audio.sfx('hit');
          } else if (en.shell && !en.shellMoving) {
            en.shellMoving = true;
            en.vx = (m.x < en.x ? 1 : -1) * 4.2;
            m.vy = -2.5;
            this.score += 400;
            if (this.audio) this.audio.sfx('hit');
          } else if (m.vy > 0 && m.y + mh - m.vy <= en.y + 9 && en.kind !== 'bowser') {
            m.vy = -4.2;
            if (en.kind === 'koopa' && !en.shell) {
              en.shell = true;
              en.shellMoving = false;
              en.vx = 0;
              this.score += 100;
            } else {
              en.flatTimer = 22;
              en.vx = 0;
              this.score += 100;
            }
            this.fx.push({ kind: 'popup', text: '100', x: en.x, y: en.y - 6, vy: -0.7, maxTimer: 20 });
            if (this.audio) this.audio.sfx('hit');
          } else if (m.invuln === 0) {
            if (m.power > 0) {
              m.power--;
              m.invuln = 65;
              if (this.audio) this.audio.sfx('hit');
            } else {
              this.lives--;
              if (this.audio) this.audio.sfx('explosion');
              if (this.lives <= 0) {
                this.lastLostWorld = this.world;
                this.mode = 'gameover';
              } else {
                this.loadCourse(this.world, this.stage);
              }
            }
          }
        }
      });

      if (m.x >= this.flagX) {
        this.score += 2000;
        if (this.stage < 4) {
          this.stage++;
        } else {
          this.stage = 1;
          this.world = (this.world % 8) + 1;
        }
        this.loadCourse(this.world, this.stage);
        if (this.audio) this.audio.sfx('stageClear');
      }
    }

    drawScenery(ctx, castle, underground) {
      if (!castle && !underground) {
        for (let i = 0; i < 4; i++) {
          const cx = ((i * 160 + 40 - Math.floor(this.scrollX * 0.35)) % 640 + 640) % 640 - 60;
          const cy = 36 + (i % 2) * 16;
          ctx.fillStyle = '#fcfcfc';
          ctx.fillRect(cx + 6, cy, 24, 14);
          ctx.fillRect(cx, cy + 4, 36, 10);
          ctx.fillStyle = '#3cbcfc';
          ctx.fillRect(cx + 2, cy + 13, 32, 2);

          const hx = ((i * 190 + 10 - Math.floor(this.scrollX * 0.6)) % 640 + 640) % 640 - 60;
          ctx.fillStyle = '#00a800';
          ctx.beginPath();
          ctx.moveTo(hx, 192);
          ctx.lineTo(hx + 28, 156);
          ctx.lineTo(hx + 56, 192);
          ctx.fill();
          ctx.fillStyle = '#58d854';
          ctx.fillRect(hx + 24, 166, 6, 4);
          ctx.fillRect(hx + 30, 174, 6, 4);

          const bx = hx + 84;
          ctx.fillStyle = '#58d854';
          ctx.fillRect(bx, 180, 28, 12);
          ctx.fillRect(bx + 6, 176, 16, 6);
        }
      } else if (castle) {
        for (let x = 0; x < W; x += 16) {
          ctx.fillStyle = '#d82800';
          ctx.fillRect(x, 206, 16, 18);
          ctx.fillStyle = '#fce000';
          ctx.fillRect(x + ((this.tick >> 2) + x) % 8, 206, 6, 3);
        }
      }

      for (let x = -Math.floor(this.scrollX % 16); x < W; x += 16) {
        ctx.fillStyle = castle ? '#7c7c7c' : (underground ? '#008088' : '#c84c0c');
        ctx.fillRect(x, 192, 16, 32);
        ctx.fillStyle = castle ? '#bcbcbc' : (underground ? '#3cbcfc' : '#fcbcb0');
        ctx.fillRect(x, 192, 15, 2);
        ctx.fillRect(x, 208, 15, 1);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 15, 192, 1, 16);
        ctx.fillRect(x + 7, 208, 1, 16);
      }
    }

    render(ctx) {
      const underground = this.stage === 2;
      const castle = this.stage === 4;
      ctx.fillStyle = castle ? '#000000' : (underground ? '#000018' : '#5c94fc');
      ctx.fillRect(0, 0, W, H);

      this.drawScenery(ctx, castle, underground);

      drawHudText(ctx, `MARIO         WORLD  TIME`, 16, 14, '#fcfcfc', '#000000', 9);
      drawHudText(ctx, `${String(this.score).padStart(6, '0')}  x${String(this.coins).padStart(2, '0')}   ${this.world}-${this.stage}    ${String(this.time).padStart(3, '0')}`, 16, 24, '#fcfcfc', '#000000', 9);

      if (this.mode === 'title') {
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(36, 38, 184, 62);
        ctx.strokeStyle = '#fcbcb0';
        ctx.lineWidth = 2;
        ctx.strokeRect(38, 40, 180, 58);
        drawHudText(ctx, 'SUPER', 50, 62, '#fcbcb0', '#000000', 16);
        drawHudText(ctx, 'MARIO BROS.', 48, 86, '#fcfcfc', '#000000', 18);
        drawHudText(ctx, '©1985 NINTENDO', 108, 112, '#fcbcb0', '#000000', 9);
        drawHudText(ctx, '> 1 PLAYER GAME  [START]', 54, 134, '#fcfcfc', '#000000', 9);
        if (this.lastLostWorld > 1) {
          drawHudText(ctx, `A + START: ПРОДОЛЖИТЬ WORLD ${this.lastLostWorld}-1`, 26, 152, '#fce000', '#000000', 9);
        }
        drawPixelSprite(ctx, MARIO_SPRITES.small_idle, { r: '#d82800', b: '#887000', s: '#fca044', y: '#fcfc00' }, 52, 164, 2, false);
        drawPixelSprite(ctx, MARIO_SPRITES.goomba_0, { b: '#c84c0c', w: '#fcfcfc', k: '#000000', s: '#fcbcb0' }, 168, 174, 2, false);
        return;
      }

      this.pipes.forEach(p => {
        const px = Math.round(p.x - this.scrollX);
        if (px < -32 || px > W) return;
        if (p.piranha && Math.abs((this.mario.x) - (p.x + 14)) > 26) {
          const offset = Math.sin(this.tick * 0.07) * 12;
          if (offset > -2) {
            const py = Math.round(p.y - 16 + offset);
            drawPixelSprite(ctx, [
              '.rrrrrr.',
              'rwwrrwwr',
              'rrrrrrrr',
              '.wwwwww.',
              '..gggg..',
              '.gggggg.'
            ], { r: '#d82800', w: '#fcfcfc', g: '#00a800' }, px + 6, py, 2);
          }
        }
        ctx.fillStyle = '#00a800';
        ctx.fillRect(px, p.y, 28, p.h);
        ctx.fillRect(px - 2, p.y, 32, 11);
        ctx.fillStyle = '#58d854';
        ctx.fillRect(px + 4, p.y + 11, 5, p.h - 11);
        ctx.fillRect(px + 2, p.y + 1, 5, 9);
        ctx.fillStyle = '#005000';
        ctx.fillRect(px + 22, p.y + 11, 4, p.h - 11);
        ctx.fillRect(px + 24, p.y + 1, 4, 9);
      });

      this.blocks.forEach(b => {
        const bx = Math.round(b.x - this.scrollX);
        const by = Math.round(b.y - (b.bump || 0));
        if (bx < -20 || bx > W) return;
        if (b.hit) {
          ctx.fillStyle = '#887000';
          ctx.fillRect(bx, by, 16, 16);
          ctx.fillStyle = '#000000';
          ctx.fillRect(bx + 2, by + 2, 2, 2);
          ctx.fillRect(bx + 12, by + 2, 2, 2);
          ctx.fillRect(bx + 2, by + 12, 2, 2);
          ctx.fillRect(bx + 12, by + 12, 2, 2);
        } else if (b.type === 'q') {
          const shimmer = (this.tick >> 4) % 3;
          ctx.fillStyle = shimmer === 0 ? '#fca044' : (shimmer === 1 ? '#fce000' : '#c84c0c');
          ctx.fillRect(bx, by, 16, 16);
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(bx, by, 15, 15);
          drawHudText(ctx, '?', bx + 5, by + 12, '#fcfcfc', '#000000', 10);
        } else {
          this.drawBrickBlock(ctx, bx, by, underground);
        }
      });

      this.items.forEach(it => {
        const ix = Math.round(it.x - this.scrollX);
        const iy = Math.round(it.y);
        if (it.kind === 'mushroom') {
          drawPixelSprite(ctx, [
            '..rrrr..',
            '.rrwwrr.',
            'rwwrrwwr',
            'rrrrrrrr',
            '.ssssss.',
            '..ssss..'
          ], { r: '#d82800', w: '#fcfcfc', s: '#fca044' }, ix, iy, 2);
        } else if (it.kind === 'flower') {
          drawPixelSprite(ctx, [
            '.rrrrrr.',
            'ryyyyyyr',
            'rywwwwyr',
            '.rrrrrr.',
            '...gg...',
            '.gggggg.'
          ], { r: '#d82800', y: '#fce000', w: '#fcfcfc', g: '#00a800' }, ix, iy, 2);
        } else {
          drawPixelSprite(ctx, [
            '...yy...',
            '..yyyy..',
            'yyyyyyyy',
            '.yykkyy.',
            '.yyyyyy.',
            'yy....yy'
          ], { y: '#fce000', k: '#000000' }, ix, iy, 2);
        }
      });

      this.fireballs.forEach(fb => {
        drawPixelSprite(ctx, ['.rr.', 'ryyr', 'ryyr', '.rr.'], { r: '#d82800', y: '#fce000' }, fb.x - this.scrollX - 3, fb.y - 3, 2);
      });

      this.enemies.forEach(en => {
        if (!en.alive) return;
        const ex = Math.round(en.x - this.scrollX);
        if (ex < -32 || ex > W) return;
        if (en.kind === 'goomba') {
          const spr = en.flatTimer > 0 ? MARIO_SPRITES.goomba_flat : (((this.tick >> 3) & 1) ? MARIO_SPRITES.goomba_1 : MARIO_SPRITES.goomba_0);
          drawPixelSprite(ctx, spr, { b: underground ? '#008088' : '#c84c0c', w: '#fcfcfc', k: '#000000', s: '#fcbcb0' }, ex, en.y + (en.flatTimer > 0 ? 6 : 0), 1.6);
        } else if (en.kind === 'koopa') {
          if (en.shell) {
            drawPixelSprite(ctx, MARIO_SPRITES.shell, { g: '#00a800', w: '#fcfcfc' }, ex, en.y + 4, 1.6);
          } else {
            drawPixelSprite(ctx, MARIO_SPRITES.koopa_0, { g: '#00a800', y: '#fca044', w: '#fcfcfc', k: '#000000' }, ex, en.y, 1.5, en.vx > 0);
          }
        } else if (en.kind === 'bowser') {
          drawPixelSprite(ctx, MARIO_SPRITES.bowser, { g: '#00a800', r: '#d82800', y: '#fca044', o: '#fce000', w: '#fcfcfc', k: '#000000' }, ex, en.y, 2);
        }
      });

      const fx = Math.round(this.flagX - this.scrollX);
      if (fx >= -40 && fx <= W + 40) {
        if (!castle) {
          ctx.fillStyle = '#00a800';
          ctx.fillRect(fx, 56, 6, 4);
          ctx.fillStyle = '#fcfcfc';
          ctx.fillRect(fx + 2, 60, 2, 132);
          drawPixelSprite(ctx, ['gggggggg', 'ggwwwwgg', 'gggggggg', 'gggg....'], { g: '#58d854', w: '#fcfcfc' }, fx - 14, this.flagY, 2);
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(fx + 22, 136, 44, 56);
          ctx.fillStyle = '#000000';
          ctx.fillRect(fx + 38, 166, 12, 26);
        } else {
          drawPixelSprite(ctx, ['..yyyy..', '.yyyyyy.', '..kkkk..', '...kk...'], { y: '#fce000', k: '#bcbcbc' }, fx, 168, 2);
        }
      }

      const mx = Math.round(this.mario.x - this.scrollX);
      if (this.mario.invuln % 2 === 0) {
        const isFire = this.mario.power === 2;
        const isStar = this.mario.starTimer > 0 && (this.tick % 4 < 2);
        const pal = isStar
          ? { r: '#fce000', b: '#00a800', s: '#fcfcfc', y: '#d82800' }
          : (isFire
            ? { r: '#fcfcfc', b: '#d82800', s: '#fca044', y: '#fce000' }
            : { r: '#d82800', b: '#887000', s: '#fca044', y: '#fcfc00' });
        const spr = !this.mario.onGround
          ? MARIO_SPRITES.small_jump
          : (Math.abs(this.mario.vx) > 0.3 && ((this.tick >> 2) & 1) ? MARIO_SPRITES.small_run : MARIO_SPRITES.small_idle);
        const scaleY = (this.mario.power > 0 && !this.mario.crouch) ? 1.65 : 1.2;
        drawPixelSprite(ctx, spr, pal, mx, this.mario.y, scaleY, this.mario.dir < 0, false);
      }

      renderFxList(ctx, this.fx, this.scrollX);

      if (this.mode === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 80, W, 62);
        drawHudText(ctx, 'GAME OVER', 88, 104, '#fcfcfc', '#d82800', 14);
        drawHudText(ctx, `Зажмите A + START для продолжения с ${this.lastLostWorld}-1`, 18, 126, '#fce000', '#000000', 9);
      }
    }

    drawBrickBlock(ctx, bx, by, underground) {
      ctx.fillStyle = underground ? '#008088' : '#c84c0c';
      ctx.fillRect(bx, by, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(bx, by + 7, 16, 1);
      ctx.fillRect(bx, by + 15, 16, 1);
      ctx.fillRect(bx + 7, by, 1, 7);
      ctx.fillRect(bx + 15, by + 8, 1, 7);
    }

    serializeState() {
      return {
        mode: this.mode,
        world: this.world,
        stage: this.stage,
        lastLostWorld: this.lastLostWorld,
        score: this.score,
        coins: this.coins,
        lives: this.lives,
        cheatUnlocked: this.cheatUnlocked,
        scrollX: this.scrollX,
        mario: { ...this.mario }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
      if (st.mario) this.mario = { ...st.mario };
    }
  }

  const CONTRA_SPRITES = {
    bill_stand: [
      '..rrrr..',
      '.rssss..',
      '.skkkks.',
      '.ssssgg.',
      'ssgggggg',
      '.bbbbbb.',
      '.bb..bb.',
      '.bb..bb.',
      'kk....kk'
    ],
    bill_run: [
      '..rrrr..',
      '.rssss..',
      '.skkkks.',
      '.ssssgg.',
      'ssgggggg',
      '.bbbbbb.',
      '..bb.bb.',
      '.bb...bb',
      'kk....kk'
    ],
    bill_prone: [
      '..rrrr............',
      '.rssssgggggggggg..',
      'bbbbbbbbbbkk......'
    ],
    bill_spin: [
      '..bbbb..',
      '.brrrrb.',
      'brssssrb',
      'brssssrb',
      '.brrrrb.',
      '..bbbb..'
    ],
    soldier: [
      '..kkkk..',
      '.kssssk.',
      '.rrrrrr.',
      'grrrrrrg',
      '.rrrrrr.',
      '.rr..rr.',
      'kk....kk'
    ]
  };

  class ContraCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'contra';
      this.sys = 'nes';
      this.konamiSeq = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.inputHistory = [];
      this.cheatUnlocked = false;
      this.lives = 3;
      this.score = 0;
      this.stage = 1;
      this.weapon = 'M';
      this.tick = 0;
      this.fx = [];
      this.initStage(1);
    }

    initStage(st) {
      this.stage = st;
      this.scrollX = 0;
      this.fx = [];
      this.player = { x: 40, y: 124, vx: 0, vy: 0, onGround: true, prone: false, dirX: 1, dirY: 0, cd: 0, invuln: 90 };
      this.bullets = [];
      this.enemies = [];
      for (let i = 0; i < 12; i++) {
        this.enemies.push({
          x: 150 + i * 58,
          y: i % 2 === 0 ? 124 : 156,
          kind: i % 3 === 0 ? 'turret' : 'soldier',
          hp: i % 3 === 0 ? 4 : 2,
          cd: 50 + (i * 17) % 40,
          alive: true
        });
      }
      this.capsules = [
        { x: 180, y: 70, wpn: 'S', alive: true },
        { x: 410, y: 64, wpn: 'L', alive: true }
      ];
      this.boss = { x: 750, y: 84, hp: 28, maxHp: 28, cd: 45, alive: true };
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.lives = 30;
      this.weapon = 'S';
      this.mode = 'play';
      if (this.audio) this.audio.sfx('cheat');
      return 'Код Konami: 30 жизней + дробовик S (Spread Gun)';
    }

    onButtonPress(btn) {
      if (this.mode === 'title') {
        if (btn === 'start') {
          const tail = this.inputHistory.slice(-this.konamiSeq.length);
          const matched = tail.length === this.konamiSeq.length && tail.every((k, i) => k === this.konamiSeq[i]);
          if (matched || this.cheatUnlocked) {
            this.cheatUnlocked = true;
            this.lives = 30;
            this.weapon = 'S';
            if (this.audio) this.audio.sfx('cheat');
          } else {
            this.lives = 3;
          }
          this.initStage(1);
          this.mode = 'play';
        } else {
          this.inputHistory.push(btn);
          if (this.inputHistory.length > 16) this.inputHistory.shift();
          const tail = this.inputHistory.slice(-this.konamiSeq.length);
          if (tail.length === this.konamiSeq.length && tail.every((k, i) => k === this.konamiSeq[i])) {
            this.cheatUnlocked = true;
            this.lives = 30;
            if (this.audio) this.audio.sfx('cheat');
          }
        }
        return;
      }
      if (this.mode === 'gameover' && (btn === 'start' || btn === 'a')) {
        this.reset();
        return;
      }
      if (this.mode === 'play') {
        if (btn === 'a' && this.player.onGround) {
          this.player.vy = -5.3;
          this.player.onGround = false;
          this.player.prone = false;
          if (this.audio) this.audio.sfx('jump');
        } else if (btn === 'b' || btn === 'c') {
          this.shoot();
        }
      }
    }

    shoot() {
      const p = this.player;
      if (p.cd > 0) return;
      p.cd = this.weapon === 'L' ? 14 : 9;
      const muzzleY = p.prone ? p.y + 14 : p.y + 7;
      let baseAngle = 0;
      if (p.dirY < 0) baseAngle = -0.65 * (p.dirX || 1);
      else if (p.dirY > 0 && !p.onGround) baseAngle = 0.65 * (p.dirX || 1);

      if (this.weapon === 'S') {
        [-0.32, -0.16, 0, 0.16, 0.32].forEach(off => {
          this.bullets.push({
            x: p.x + 8,
            y: muzzleY,
            vx: Math.cos(baseAngle + off) * 4.2 * (p.dirX || 1),
            vy: Math.sin(baseAngle + off) * 4.2,
            fromPlayer: true,
            wpn: 'S',
            dmg: 1
          });
        });
      } else if (this.weapon === 'L') {
        this.bullets.push({
          x: p.x + 8,
          y: muzzleY,
          vx: 5.5 * (p.dirX || 1),
          vy: p.dirY * 3.5,
          fromPlayer: true,
          wpn: 'L',
          dmg: 3
        });
      } else {
        this.bullets.push({
          x: p.x + 8,
          y: muzzleY,
          vx: 4.4 * (p.dirX || 1),
          vy: (!p.prone ? p.dirY * 3.0 : 0),
          fromPlayer: true,
          wpn: 'M',
          dmg: 1
        });
      }
      if (this.audio) this.audio.sfx('shoot');
    }

    step(input) {
      this.tick++;
      stepFxList(this.fx);
      if (this.mode !== 'play') return;
      const p = this.player;
      if (p.cd > 0) p.cd--;
      if (p.invuln > 0) p.invuln--;

      p.dirY = input.up ? -1 : (input.down ? 1 : 0);
      p.prone = !!(input.down && p.onGround && !input.left && !input.right);

      if (input.left) { p.x = Math.max(this.scrollX + 8, p.x - 1.85); p.dirX = -1; }
      if (input.right) { p.x += 1.85; p.dirX = 1; }
      if (p.x - this.scrollX > 110 && this.scrollX < 560) this.scrollX = p.x - 110;

      if (input.b || input.c) this.shoot();
      p.vy += 0.28;
      p.y += p.vy;

      const platY = (p.x % 160 < 95) ? 124 : 156;
      if (p.y >= platY && p.vy >= 0) {
        p.y = platY;
        p.vy = 0;
        p.onGround = true;
      }

      this.capsules.forEach(cap => {
        if (cap.alive) {
          cap.x += 1.1;
          cap.y = 64 + Math.sin(cap.x * 0.06) * 14;
        }
      });

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < this.scrollX || b.x > this.scrollX + W || b.y < 0 || b.y > H) {
          this.bullets.splice(i, 1);
          continue;
        }
        if (!b.fromPlayer) {
          const ph = p.prone ? 8 : 20;
          const py = p.prone ? p.y + 12 : p.y;
          if (p.invuln === 0 && rectOverlap(b.x - 2, b.y - 2, 4, 4, p.x, py, 12, ph)) {
            this.bullets.splice(i, 1);
            this.lives--;
            this.fx.push({ kind: 'explosion', x: p.x + 6, y: p.y + 10, maxTimer: 18 });
            if (this.audio) this.audio.sfx('explosion');
            if (this.lives <= 0) this.mode = 'gameover';
            else p.invuln = 110;
          }
          continue;
        }

        let hitCap = false;
        this.capsules.forEach(cap => {
          if (cap.alive && rectOverlap(b.x - 3, b.y - 3, 6, 6, cap.x, cap.y, 18, 12)) {
            cap.alive = false;
            this.weapon = cap.wpn;
            this.score += 500;
            this.fx.push({ kind: 'explosion', x: cap.x + 8, y: cap.y + 6, maxTimer: 14 });
            this.fx.push({ kind: 'popup', text: `WPN ${cap.wpn}`, x: cap.x, y: cap.y, vy: -0.7, maxTimer: 26, color: '#fce000' });
            if (this.audio) this.audio.sfx('powerup');
            hitCap = true;
          }
        });
        if (hitCap) {
          this.bullets.splice(i, 1);
          continue;
        }

        for (const en of this.enemies) {
          if (en.alive && rectOverlap(b.x - 2, b.y - 2, 5, 5, en.x, en.y, 16, 20)) {
            en.hp -= (b.dmg || 1);
            this.bullets.splice(i, 1);
            if (en.hp <= 0) {
              en.alive = false;
              this.score += 300;
              this.fx.push({ kind: 'explosion', x: en.x + 8, y: en.y + 10, maxTimer: 16 });
              this.fx.push({ kind: 'popup', text: '300', x: en.x, y: en.y, vy: -0.6, maxTimer: 20 });
              if (this.audio) this.audio.sfx('explosion');
            } else {
              this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 6 });
            }
            break;
          }
        }

        if (this.boss.alive && rectOverlap(b.x - 2, b.y - 2, 5, 5, this.boss.x, this.boss.y, 44, 88)) {
          this.boss.hp -= (b.dmg || 1);
          this.fx.push({ kind: 'spark', x: b.x, y: b.y, maxTimer: 6, color: '#fce000' });
          this.bullets.splice(i, 1);
          if (this.boss.hp <= 0) {
            this.boss.alive = false;
            this.score += 5000;
            for (let k = 0; k < 5; k++) {
              this.fx.push({ kind: 'explosion', x: this.boss.x + (k % 2) * 20, y: this.boss.y + k * 14, maxTimer: 24 });
            }
            this.stage = (this.stage % 4) + 1;
            this.initStage(this.stage);
            if (this.audio) this.audio.sfx('stageClear');
          } else if (this.audio) {
            this.audio.sfx('hit');
          }
        }
      }

      this.enemies.forEach(en => {
        if (!en.alive) return;
        const ex = en.x - this.scrollX;
        if (en.kind === 'soldier') {
          en.x -= 0.65;
        } else if (ex > 0 && ex < W) {
          en.cd--;
          if (en.cd <= 0) {
            en.cd = 75;
            const dx = p.x - en.x;
            const dy = p.y - en.y;
            const len = Math.hypot(dx, dy) || 1;
            this.bullets.push({ x: en.x + 8, y: en.y + 8, vx: (dx / len) * 2.4, vy: (dy / len) * 2.4, fromPlayer: false });
          }
        }
        if (p.invuln === 0 && rectOverlap(p.x, p.y, 12, 20, en.x, en.y, 14, 20)) {
          en.alive = false;
          this.lives--;
          this.fx.push({ kind: 'explosion', x: p.x + 6, y: p.y + 10, maxTimer: 18 });
          if (this.audio) this.audio.sfx('explosion');
          if (this.lives <= 0) this.mode = 'gameover';
          else p.invuln = 110;
        }
      });

      if (this.boss.alive && this.boss.x - this.scrollX < W) {
        this.boss.cd--;
        if (this.boss.cd <= 0) {
          this.boss.cd = 60;
          this.bullets.push({ x: this.boss.x, y: this.boss.y + 22, vx: -2.6, vy: 0.4, fromPlayer: false });
        }
      }
    }

    render(ctx) {
      ctx.fillStyle = this.stage === 3 ? '#102040' : '#000000';
      ctx.fillRect(0, 0, W, H);
      if (this.mode === 'title') {
        ctx.fillStyle = '#d82800';
        ctx.fillRect(46, 30, 164, 42);
        drawHudText(ctx, 'CONTRA', 68, 58, '#fce000', '#000000', 26);
        drawPixelSprite(ctx, CONTRA_SPRITES.bill_stand, { r: '#d82800', s: '#fca044', k: '#000000', g: '#bcbcbc', b: '#0058f8' }, 76, 82, 3);
        drawPixelSprite(ctx, CONTRA_SPRITES.bill_stand, { r: '#0058f8', s: '#fca044', k: '#000000', g: '#bcbcbc', b: '#d82800' }, 146, 82, 3, true);
        drawHudText(ctx, 'KONAMI 1988  1P / 2P', 66, 134, '#fcfcfc', null, 9);
        drawHudText(ctx, this.cheatUnlocked ? 'КОД 30 ЖИЗНЕЙ АКТИВИРОВАН!' : 'Введите код Konami до нажатия START', 24, 152, this.cheatUnlocked ? '#58d854' : '#bcbcbc', null, 9);
        drawHudText(ctx, '> 1 PLAYER   [START]', 68, 178, '#fce000', null, 10);
        return;
      }

      for (let i = 0; i < 9; i++) {
        const tx = ((i * 36 - Math.floor(this.scrollX * 0.4)) % 280 + 280) % 280 - 20;
        ctx.fillStyle = '#005000';
        ctx.fillRect(tx, 34, 20, 108);
        ctx.fillStyle = '#00a800';
        ctx.fillRect(tx - 6, 26, 32, 22);
        ctx.fillStyle = '#58d854';
        ctx.fillRect(tx - 2, 28, 12, 8);
      }

      ctx.fillStyle = '#885000';
      ctx.fillRect(0, 142, W, 14);
      ctx.fillStyle = '#00a800';
      ctx.fillRect(0, 140, W, 5);
      ctx.fillStyle = '#787878';
      ctx.fillRect(0, 174, W, 10);

      ctx.fillStyle = '#0058f8';
      ctx.fillRect(0, 184, W, 40);
      for (let wx = 0; wx < W; wx += 16) {
        ctx.fillStyle = '#3cbcfc';
        ctx.fillRect(wx + ((this.tick >> 2) % 8), 188, 8, 2);
        ctx.fillRect(wx + ((this.tick >> 2) + 4) % 8, 202, 6, 2);
      }

      this.capsules.forEach(cap => {
        if (!cap.alive) return;
        const cx = Math.round(cap.x - this.scrollX);
        drawPixelSprite(ctx, [
          '.wwwwwwww.',
          'wrrrrrrrrw',
          'wrwwwwwwrw',
          'wrrrrrrrrw',
          '.wwwwwwww.'
        ], { w: '#bcbcbc', r: '#d82800' }, cx, Math.round(cap.y), 1.8);
        drawHudText(ctx, cap.wpn, cx + 6, Math.round(cap.y) + 8, '#fce000', '#000000', 8);
      });

      this.enemies.forEach(en => {
        if (!en.alive) return;
        const ex = Math.round(en.x - this.scrollX);
        if (ex < -24 || ex > W) return;
        if (en.kind === 'turret') {
          drawPixelSprite(ctx, [
            '..wwww..',
            '.wkkkkw.',
            'wkrrrrkw',
            'wkrrrrkw',
            '.wkkkkw.',
            '..wwww..'
          ], { w: '#bcbcbc', k: '#404040', r: '#d82800' }, ex, en.y, 2);
        } else {
          drawPixelSprite(ctx, CONTRA_SPRITES.soldier, { k: '#000000', s: '#fca044', r: '#d82800', g: '#bcbcbc' }, ex, en.y, 2, true);
        }
      });

      if (this.boss.alive) {
        const bx = Math.round(this.boss.x - this.scrollX);
        if (bx < W) {
          ctx.fillStyle = '#585858';
          ctx.fillRect(bx, this.boss.y, 46, 92);
          ctx.fillStyle = '#bcbcbc';
          ctx.fillRect(bx + 3, this.boss.y + 3, 40, 86);
          ctx.fillStyle = '#202020';
          ctx.fillRect(bx + 6, this.boss.y + 12, 12, 12);
          ctx.fillRect(bx + 24, this.boss.y + 12, 12, 12);
          const pulse = (this.tick % 10 < 5) ? '#fce000' : '#d82800';
          ctx.fillStyle = pulse;
          ctx.fillRect(bx + 10, this.boss.y + 44, 22, 24);
          ctx.strokeStyle = '#fcfcfc';
          ctx.strokeRect(bx + 10, this.boss.y + 44, 22, 24);
        }
      }

      const px = Math.round(this.player.x - this.scrollX);
      if (this.player.invuln % 2 === 0) {
        const pal = { r: '#d82800', s: '#fca044', k: '#000000', g: '#fcfcfc', b: '#0058f8' };
        if (!this.player.onGround) {
          drawPixelSprite(ctx, CONTRA_SPRITES.bill_spin, pal, px, this.player.y + 2, 2);
        } else if (this.player.prone) {
          drawPixelSprite(ctx, CONTRA_SPRITES.bill_prone, pal, px - 4, this.player.y + 12, 1.5, this.player.dirX < 0);
        } else {
          const spr = ((this.tick >> 2) & 1) ? CONTRA_SPRITES.bill_run : CONTRA_SPRITES.bill_stand;
          drawPixelSprite(ctx, spr, pal, px, this.player.y, 2, this.player.dirX < 0);
        }
      }

      this.bullets.forEach(b => {
        const bx = Math.round(b.x - this.scrollX);
        if (b.wpn === 'L') {
          ctx.fillStyle = '#3cbcfc';
          ctx.fillRect(bx - 6, Math.round(b.y - 2), 12, 3);
        } else {
          ctx.fillStyle = b.fromPlayer ? '#fce000' : '#fcfcfc';
          ctx.fillRect(bx - 2, Math.round(b.y - 2), 5, 5);
          ctx.fillStyle = '#d82800';
          ctx.fillRect(bx - 1, Math.round(b.y - 1), 3, 3);
        }
      });

      renderFxList(ctx, this.fx, this.scrollX);

      drawHudText(ctx, `1P ${String(this.score).padStart(6, '0')}  REST:${this.lives}  WPN:[${this.weapon}]  STAGE:${this.stage}`, 8, 15, '#fcfcfc', '#000000', 9);
      for (let i = 0; i < Math.min(6, this.lives); i++) {
        ctx.fillStyle = '#0058f8';
        ctx.fillRect(10 + i * 7, 19, 4, 7);
      }

      if (this.mode === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(48, 84, 160, 52);
        drawHudText(ctx, 'GAME OVER', 84, 108, '#d82800', '#fcfcfc', 14);
        drawHudText(ctx, 'НАЖМИТЕ START', 84, 126, '#fce000', '#000000', 9);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        cheatUnlocked: this.cheatUnlocked,
        lives: this.lives,
        score: this.score,
        stage: this.stage,
        weapon: this.weapon,
        scrollX: this.scrollX,
        player: { ...this.player }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
      if (st.player) this.player = { ...st.player };
    }
  }

  const CHIPDALE_SPRITES = {
    chip: [
      '..kkkk..',
      '.kkkkkk.',
      'kkbbbbbk',
      '.bwkbwkb',
      '.bbbbbbb',
      '..bsssb.',
      '.jjwwwwj',
      'b.jjjj.b',
      '..b..b..'
    ],
    dale: [
      '..rr....',
      '.rrrr...',
      'bbbbbb..',
      'bwkbwkb.',
      'bbbbrrr.',
      '.bssww..',
      '.hhhhhh.',
      'b.hhhh.b',
      '..b..b..'
    ],
    bulldog: [
      '.kkkkkk.',
      'kwwwwwwk',
      'kwkwwkwk',
      'krrrrrrk',
      '.kkkkkk.',
      'kk.kk.kk'
    ],
    fatcat: [
      '..pppppp..',
      '.ppwwwwpp.',
      'ppwkppkwpp',
      'pppppppppp',
      'mmmmmmmmmm',
      'mwmwmwmwmw',
      'mmmmmmmmmm',
      '.pp....pp.'
    ]
  };

  class ChipAndDaleCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'chipdale';
      this.sys = 'nes';
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.zone = 1;
      this.score = 0;
      this.hearts = 3;
      this.stars = 0;
      this.cheatUnlocked = false;
      this.partnerThrownCount = 0;
      this.tick = 0;
      this.fx = [];
      this.initZone(1);
    }

    initZone(z) {
      this.zone = z;
      this.fx = [];
      this.chip = { x: 36, y: 150, vx: 0, vy: 0, onGround: true, dir: 1, hiding: false, holding: null, zipperTimer: 0 };
      this.dale = { x: 72, y: 150, vx: 0, vy: 0, dir: 1, thrown: false };
      this.crates = [
        { x: 108, y: 158, vx: 0, vy: 0, kind: 'wood', reward: 'star', active: true },
        { x: 144, y: 158, vx: 0, vy: 0, kind: 'steel', reward: null, active: true },
        { x: 184, y: 158, vx: 0, vy: 0, kind: 'wood', reward: 'zipper', active: true },
        { x: 132, y: 108, vx: 0, vy: 0, kind: 'apple', reward: null, active: true }
      ];
      this.enemies = [
        { x: 162, y: 152, vx: -0.75, hp: 1, boss: false, alive: true },
        { x: 208, y: 102, vx: -0.6, hp: 1, boss: false, alive: true },
        { x: 214, y: 58, vx: -0.45, hp: 3, boss: true, alive: true }
      ];
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.mode = 'play';
      this.partnerThrownCount++;
      this.chip.zipperTimer = 360;
      this.chip.holding = 'dale';
      this.throwHeldObject();
      if (this.audio) this.audio.sfx('cheat');
      return 'Командный бросок Дейла + неуязвимый Вжик (Zipper)!';
    }

    throwHeldObject() {
      const c = this.chip;
      if (!c.holding) return;
      if (c.holding === 'dale') {
        this.dale.x = c.x + c.dir * 10;
        this.dale.y = c.y - 14;
        this.dale.vx = c.dir * 4.3;
        this.dale.vy = -4.0;
        this.dale.thrown = true;
        this.cheatUnlocked = true;
        this.partnerThrownCount++;
      } else if (typeof c.holding === 'object') {
        c.holding.x = c.x + c.dir * 12;
        c.holding.y = c.y - 4;
        c.holding.vx = c.dir * 4.2;
        c.holding.vy = -2.0;
      }
      c.holding = null;
      if (this.audio) this.audio.sfx('shoot');
    }

    onButtonPress(btn) {
      if (this.mode === 'title') {
        if (btn === 'start' || btn === 'a') {
          this.mode = 'play';
          if (this.audio) this.audio.sfx('coin');
        }
        return;
      }
      if (this.mode === 'play') {
        const c = this.chip;
        if (btn === 'a' && c.onGround) {
          c.vy = -5.4;
          c.onGround = false;
          if (this.audio) this.audio.sfx('jump');
        } else if (btn === 'b' || btn === 'c') {
          if (c.holding) {
            this.throwHeldObject();
          } else if (Math.abs(c.x - this.dale.x) < 22 && Math.abs(c.y - this.dale.y) < 22) {
            c.holding = 'dale';
            if (this.audio) this.audio.sfx('powerup');
          } else {
            const crate = this.crates.find(cr => cr.active && Math.abs(cr.x - c.x) < 22 && Math.abs(cr.y - c.y) < 22);
            if (crate) {
              c.holding = crate;
              if (this.audio) this.audio.sfx('coin');
            }
          }
        }
      }
    }

    step(input) {
      this.tick++;
      stepFxList(this.fx);
      if (this.mode !== 'play') return;
      const c = this.chip;
      if (c.zipperTimer > 0) c.zipperTimer--;
      c.hiding = !!(input.down && c.holding && c.holding !== 'dale');

      if (!c.hiding) {
        if (input.left) { c.x = Math.max(12, c.x - 1.85); c.dir = -1; }
        if (input.right) { c.x = Math.min(230, c.x + 1.85); c.dir = 1; }
      }
      c.vy += 0.28;
      c.y += c.vy;

      if (c.y >= 110 && c.y <= 122 && c.vy >= 0 && c.x >= 96 && c.x <= 220) {
        c.y = 104;
        c.vy = 0;
        c.onGround = true;
      } else if (c.y >= 150) {
        c.y = 150;
        c.vy = 0;
        c.onGround = true;
      }

      if (c.holding === 'dale') {
        this.dale.x = c.x;
        this.dale.y = c.y - 18;
      } else if (this.dale.thrown) {
        this.dale.x += this.dale.vx;
        this.dale.y += this.dale.vy;
        this.dale.vy += 0.22;
        this.enemies.forEach(en => {
          if (en.alive && rectOverlap(this.dale.x, this.dale.y, 18, 18, en.x, en.y, 24, 24)) {
            en.hp -= 2;
            this.fx.push({ kind: 'explosion', x: en.x + 10, y: en.y + 10, maxTimer: 14 });
            if (en.hp <= 0) {
              en.alive = false;
              this.score += 800;
              this.fx.push({ kind: 'popup', text: '800', x: en.x, y: en.y, vy: -0.7, maxTimer: 22 });
            }
            if (this.audio) this.audio.sfx('explosion');
          }
        });
        if (this.dale.y >= 150 || this.dale.x < 8 || this.dale.x > 240) {
          this.dale.y = 150;
          this.dale.vx = 0;
          this.dale.vy = 0;
          this.dale.thrown = false;
        }
      } else {
        const diff = (c.x - 24 * c.dir) - this.dale.x;
        if (Math.abs(diff) > 4) {
          this.dale.x += Math.sign(diff) * 1.15;
          this.dale.dir = Math.sign(diff) || 1;
        }
        this.dale.y = c.y;
      }

      this.crates.forEach(cr => {
        if (!cr.active || c.holding === cr) return;
        if (cr.vx !== 0 || cr.vy !== 0) {
          cr.x += cr.vx;
          cr.y += cr.vy;
          cr.vy += 0.2;
          this.enemies.forEach(en => {
            if (en.alive && rectOverlap(cr.x, cr.y, 16, 16, en.x, en.y, 20, 20)) {
              en.hp--;
              if (cr.kind === 'steel') {
                cr.vx = 0;
                cr.vy = -1.5;
              } else {
                cr.active = false;
                if (cr.reward === 'zipper') c.zipperTimer = 360;
                if (cr.reward === 'star') this.stars++;
              }
              if (en.hp <= 0) en.alive = false;
              this.score += 400;
              this.fx.push({ kind: 'explosion', x: en.x + 8, y: en.y + 8, maxTimer: 14 });
              this.fx.push({ kind: 'popup', text: '400', x: en.x, y: en.y, vy: -0.7, maxTimer: 22 });
              if (this.audio) this.audio.sfx('hit');
            }
          });
          if (cr.kind === 'steel' && cr.y >= 158) {
            cr.y = 158;
            cr.vx = 0;
            cr.vy = 0;
          } else if (cr.x < 0 || cr.x > W || cr.y > H) {
            cr.active = false;
          }
        }
      });

      this.enemies.forEach(en => {
        if (!en.alive) return;
        en.x += en.vx;
        if (en.x < 100 || en.x > 228) en.vx = -en.vx;
        if (c.zipperTimer > 0 && Math.abs(c.x - en.x) < 30 && Math.abs(c.y - en.y) < 30) {
          en.alive = false;
          this.score += 500;
          this.fx.push({ kind: 'explosion', x: en.x + 8, y: en.y + 8, maxTimer: 14 });
        }
      });

      if (this.enemies.every(e => !e.alive)) {
        this.zone = (this.zone % 3) + 1;
        this.score += 1500;
        this.initZone(this.zone);
        if (this.audio) this.audio.sfx('stageClear');
      }
    }

    render(ctx) {
      const bgCols = ['#fcbcb0', '#a8e4fc', '#401830'];
      ctx.fillStyle = bgCols[(this.zone - 1) % 3];
      ctx.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 32) {
        ctx.fillStyle = this.zone === 3 ? '#582040' : (this.zone === 2 ? '#8cd0ec' : '#f8a8a0');
        ctx.fillRect(x, 0, 16, 176);
      }

      ctx.fillStyle = '#785838';
      ctx.fillRect(96, 124, 136, 8);
      ctx.fillRect(156, 80, 88, 8);

      for (let x = 0; x < W; x += 16) {
        for (let y = 176; y < H; y += 16) {
          ctx.fillStyle = ((x + y) / 16) % 2 ? '#a8a8a8' : '#fcfcfc';
          ctx.fillRect(x, y, 16, 16);
        }
      }

      if (this.mode === 'title') {
        ctx.fillStyle = '#181830';
        ctx.fillRect(24, 32, 208, 78);
        ctx.strokeStyle = '#fce000';
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 34, 204, 74);
        drawHudText(ctx, "CHIP 'N DALE", 66, 58, '#fce000', '#d82800', 16);
        drawHudText(ctx, 'RESCUE RANGERS (CAPCOM 1990)', 38, 78, '#fcfcfc', '#000000', 9);
        drawHudText(ctx, 'B - Поднять ящик или напарника Дейла!', 22, 98, '#58d854', '#000000', 8);
        drawPixelSprite(ctx, CHIPDALE_SPRITES.chip, { k: '#202020', b: '#a85000', w: '#fcfcfc', s: '#fcd8a8', j: '#884000' }, 72, 146, 3);
        drawPixelSprite(ctx, CHIPDALE_SPRITES.dale, { r: '#d82800', b: '#c86c00', w: '#fcfcfc', s: '#fcd8a8', h: '#fce000', k: '#202020' }, 156, 146, 3, true);
        drawHudText(ctx, 'НАЖМИТЕ START', 86, 134, '#000000', '#fcfcfc', 10);
        return;
      }

      this.crates.forEach(cr => {
        if (!cr.active) return;
        const cx = Math.round(this.chip.holding === cr ? this.chip.x : cr.x);
        const cy = Math.round(this.chip.holding === cr ? (this.chip.hiding ? this.chip.y + 4 : this.chip.y - 16) : cr.y);
        if (cr.kind === 'apple') {
          drawPixelSprite(ctx, ['...gg...', '.rrrrrr.', 'rrwrrrrr', 'rrrrrrrr', '.rrrrrr.'], { g: '#00a800', r: '#d82800', w: '#fcfcfc' }, cx, cy, 2);
        } else {
          ctx.fillStyle = cr.kind === 'steel' ? '#7c7c7c' : '#d82800';
          ctx.fillRect(cx, cy, 16, 16);
          ctx.fillStyle = cr.kind === 'steel' ? '#bcbcbc' : '#f87858';
          ctx.fillRect(cx + 2, cy + 2, 12, 12);
          ctx.fillStyle = cr.kind === 'steel' ? '#fcfcfc' : '#a82000';
          ctx.fillRect(cx + 6, cy + 6, 4, 4);
        }
      });

      this.enemies.forEach(en => {
        if (!en.alive) return;
        if (en.boss) {
          drawPixelSprite(ctx, CHIPDALE_SPRITES.fatcat, { p: '#a8a8a8', w: '#fcfcfc', k: '#000000', m: '#7030a0' }, Math.round(en.x), Math.round(en.y), 2.2);
        } else {
          drawPixelSprite(ctx, CHIPDALE_SPRITES.bulldog, { k: '#404040', w: '#fcfcfc', r: '#d82800' }, Math.round(en.x), Math.round(en.y), 2, en.vx > 0);
        }
      });

      drawPixelSprite(ctx, CHIPDALE_SPRITES.dale, { r: '#d82800', b: '#c86c00', w: '#fcfcfc', s: '#fcd8a8', h: '#fce000', k: '#202020' }, Math.round(this.dale.x), Math.round(this.dale.y), 2.4, this.dale.dir < 0);
      if (!this.chip.hiding) {
        drawPixelSprite(ctx, CHIPDALE_SPRITES.chip, { k: '#202020', b: '#a85000', w: '#fcfcfc', s: '#fcd8a8', j: '#884000' }, Math.round(this.chip.x), Math.round(this.chip.y), 2.4, this.chip.dir < 0);
      }

      if (this.chip.zipperTimer > 0) {
        const zx = this.chip.x + Math.cos(this.tick * 0.25) * 18;
        const zy = this.chip.y - 8 + Math.sin(this.tick * 0.35) * 10;
        drawPixelSprite(ctx, ['w..w', '.gg.', '.yy.'], { w: '#fcfcfc', g: '#58d854', y: '#fce000' }, zx, zy, 2);
      }

      renderFxList(ctx, this.fx, 0);

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, 18);
      for (let h = 0; h < this.hearts; h++) {
        drawPixelSprite(ctx, ['.r.r.', 'rrrrr', '.rrr.', '..r..'], { r: '#d82800' }, 8 + h * 12, 4, 2);
      }
      drawHudText(ctx, `ZONE ${this.zone}   ★${this.stars}   SCORE ${this.score}`, 52, 13, '#fcfcfc', '#000000', 9);
    }

    serializeState() {
      return {
        mode: this.mode,
        zone: this.zone,
        score: this.score,
        hearts: this.hearts,
        cheatUnlocked: this.cheatUnlocked,
        partnerThrownCount: this.partnerThrownCount,
        chip: { x: this.chip.x, y: this.chip.y }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
      if (st.chip && this.chip) {
        this.chip.x = st.chip.x;
        this.chip.y = st.chip.y;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.EmuGfx = {
      rectOverlap,
      drawPixelSprite,
      drawDirectionalSprite,
      drawHudText,
      drawExplosionSprite,
      stepFxList,
      renderFxList
    };
    window.EmuNesCores = {
      battlecity: BattleCityCore,
      smb: SuperMarioBrosCore,
      contra: ContraCore,
      chipdale: ChipAndDaleCore
    };
  }
})();
