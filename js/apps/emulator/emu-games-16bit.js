(function() {
  const W = 256;
  const H = 224;

  function getGfx() {
    if (typeof window !== 'undefined' && window.EmuGfx) return window.EmuGfx;
    return {
      rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
      },
      drawPixelSprite(ctx, rows, pal, x, y, scale, flipX, flipY) {
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
      },
      drawHudText(ctx, str, x, y, color, shadow, size) {
        ctx.font = `bold ${size || 9}px "Courier New", monospace`;
        if (shadow) {
          ctx.fillStyle = shadow;
          ctx.fillText(str, x + 1, y + 1);
        }
        ctx.fillStyle = color || '#fcfcfc';
        ctx.fillText(str, x, y);
      },
      stepFxList(list) {
        for (let i = list.length - 1; i >= 0; i--) {
          const f = list[i];
          f.timer = (f.timer || 0) + 1;
          if (f.vx) f.x += f.vx;
          if (f.vy != null) {
            f.y += f.vy;
            if (f.gravity) f.vy += f.gravity;
          }
          if (f.timer >= (f.maxTimer || 24)) list.splice(i, 1);
        }
      },
      renderFxList(ctx, list, sx) {
        list.forEach(f => {
          if (f.kind === 'popup') {
            ctx.fillStyle = f.color || '#fce000';
            ctx.fillText(f.text, f.x - (sx || 0), f.y);
          }
        });
      }
    };
  }

  const SONIC_SPRITES = {
    stand: [
      '....bbbbbb..',
      '..bbbbbbbbbb',
      '.bbbbbbwwkbb',
      'bbbbbbbwwkbs',
      '..bbbbssssss',
      '.bbbbbbsss..',
      '..bbbbwwbb..',
      '...bbssssbb.',
      '...bbbbbbbb.',
      '...bb....bb.',
      '..rrr...rrr.',
      '.rrrrw.rrrrw'
    ],
    run: [
      '...bbbbbb...',
      '.bbbbbbbbbb.',
      'bbbbbbbwwkbb',
      '.bbbbbbwwkbs',
      '..bbbbbsssss',
      '...bbbbsss..',
      '..wwwwbbbb..',
      '...bbbbbbbb.',
      '..rrr....rrr',
      '.rrrrw..rrrr'
    ],
    spin: [
      '..bbbbbb..',
      '.bdwwwwdb.',
      'bdwbbbbwdb',
      'bwbbbbbbwb',
      'bdwbbbbwdb',
      '.bdwwwwdb.',
      '..bbbbbb..'
    ],
    tails: [
      '..oo..oo..',
      '.oooooooo.',
      '.oooowwko.',
      '..ooowwwww',
      'ww.ooooooo',
      'wwoooooooo',
      '.ww.oo..oo',
      '...rr...rr'
    ],
    buzzer: [
      '..wwww..',
      '.bbbbbb.',
      'yyyyyyyy',
      'bbbbbbbb',
      '....rr..'
    ],
    eggman: [
      '....rrrrrr....',
      '..rrwwwwwwrr..',
      '.rwwkksskkwwr.',
      'gggggggggggggg',
      'gyyggggggggyyg',
      '.gggggggggggg.',
      '..kkkkkkkkkk..'
    ]
  };

  class Sonic2Core {
    constructor(audio) {
      this.audio = audio;
      this.id = 'sonic2';
      this.sys = 'sega';
      this.zones = ['EMERALD HILL', 'CHEMICAL PLANT', 'CASINO NIGHT', 'DEATH EGG'];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.menuRow = 0;
      this.zoneIndex = 0;
      this.score = 0;
      this.rings = 0;
      this.emeralds = 0;
      this.superSonic = false;
      this.cheatUnlocked = false;
      this.levelSelectUnlocked = false;
      this.soundTestVal = 19;
      this.soundTestHistory = [];
      this.tick = 0;
      this.fx = [];
      this.scatteredRings = [];
      this.initZone(0);
    }

    initZone(idx) {
      this.zoneIndex = idx % this.zones.length;
      this.scrollX = 0;
      this.fx = [];
      this.scatteredRings = [];
      this.sonic = { x: 42, y: 140, vx: 0, vy: 0, dir: 1, onGround: true, spin: false, invuln: 0 };
      this.tails = { x: 18, y: 142, dir: 1 };
      this.ringItems = [];
      for (let i = 0; i < 20; i++) {
        this.ringItems.push({ x: 100 + i * 32, y: (i % 4 === 0) ? 104 : 138, taken: false });
      }
      this.springs = [
        { x: 256, y: 148 },
        { x: 486, y: 148 }
      ];
      this.bumpers = [
        { x: 340, y: 98 },
        { x: 560, y: 98 }
      ];
      this.badniks = [
        { x: 210, y: 142, vx: -0.95, kind: 'buzzer', alive: true },
        { x: 370, y: 142, vx: -1.1, kind: 'coconuts', alive: true },
        { x: 520, y: 142, vx: -1.2, kind: 'buzzer', alive: true },
        { x: 680, y: 120, vx: -0.85, boss: true, hp: 6, alive: true }
      ];
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.levelSelectUnlocked = true;
      this.emeralds = 7;
      this.rings = Math.max(this.rings, 50);
      this.superSonic = true;
      this.zoneIndex = (this.zoneIndex + 1) % this.zones.length;
      this.initZone(this.zoneIndex);
      this.mode = 'play';
      if (this.audio) this.audio.sfx('cheat');
      return `Sound Test 19-65-09-17 + 04-01-02-06: Super Sonic (${this.zones[this.zoneIndex]})`;
    }

    onButtonPress(btn, inputState) {
      if (this.mode === 'title') {
        if (btn === 'up' || btn === 'down') {
          this.menuRow = this.menuRow === 0 ? 1 : 0;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'start') {
          if (inputState && inputState.a && this.levelSelectUnlocked) {
            this.mode = 'level_select';
            if (this.audio) this.audio.sfx('cheat');
          } else if (this.menuRow === 1) {
            this.mode = 'options';
          } else {
            this.mode = 'play';
          }
        }
        return;
      }

      if (this.mode === 'options' || this.mode === 'level_select') {
        const order = [19, 65, 9, 17, 4, 1, 2, 6];
        if (btn === 'left') {
          const i = order.indexOf(this.soundTestVal);
          this.soundTestVal = order[(i <= 0 ? order.length - 1 : i - 1)];
        } else if (btn === 'right') {
          const i = order.indexOf(this.soundTestVal);
          this.soundTestVal = order[(i + 1) % order.length];
        } else if (btn === 'up' && this.mode === 'level_select') {
          this.zoneIndex = (this.zoneIndex + this.zones.length - 1) % this.zones.length;
        } else if (btn === 'down' && this.mode === 'level_select') {
          this.zoneIndex = (this.zoneIndex + 1) % this.zones.length;
        } else if (btn === 'a' || btn === 'b' || btn === 'c') {
          this.soundTestHistory.push(this.soundTestVal);
          if (this.soundTestHistory.length > 10) this.soundTestHistory.shift();
          if (this.audio) this.audio.sfx('ring');
          const str = this.soundTestHistory.join(',');
          if (str.includes('19,65,9,17')) {
            this.levelSelectUnlocked = true;
            this.cheatUnlocked = true;
            if (this.audio) this.audio.sfx('cheat');
          }
          if (str.includes('4,1,2,6')) {
            this.emeralds = 7;
            this.superSonic = true;
            this.cheatUnlocked = true;
            if (this.audio) this.audio.sfx('cheat');
          }
        } else if (btn === 'start') {
          if (this.mode === 'options') {
            this.mode = this.levelSelectUnlocked ? 'level_select' : 'title';
          } else {
            this.initZone(this.zoneIndex);
            this.mode = 'play';
          }
        }
        return;
      }

      if (this.mode === 'play') {
        if ((btn === 'a' || btn === 'b' || btn === 'c') && this.sonic.onGround) {
          if (inputState && inputState.down) {
            this.sonic.spin = true;
            this.sonic.vx = (this.sonic.dir || 1) * 5.8;
            for (let k = 0; k < 4; k++) {
              this.fx.push({ kind: 'debris', x: this.sonic.x - this.sonic.dir * 8, y: this.sonic.y + 16, vx: -this.sonic.dir * (1 + k * 0.5), vy: -0.6 * k, maxTimer: 12, color: '#fcfcfc' });
            }
            if (this.audio) this.audio.sfx('spindash');
          } else {
            this.sonic.vy = -6.0;
            this.sonic.onGround = false;
            this.sonic.spin = true;
            if (this.audio) this.audio.sfx('jump');
          }
        }
      }
    }

    step(input) {
      const gfx = getGfx();
      this.tick++;
      gfx.stepFxList(this.fx);
      if (this.mode !== 'play') return;
      const s = this.sonic;
      if (s.invuln > 0) s.invuln--;
      if (this.emeralds >= 7 && this.rings >= 50) this.superSonic = true;
      const topSpeed = this.superSonic ? 4.5 : 3.0;

      if (input.left) { s.vx = Math.max(-topSpeed, s.vx - 0.36); s.dir = -1; }
      else if (input.right) { s.vx = Math.min(topSpeed, s.vx + 0.36); s.dir = 1; }
      else s.vx *= 0.88;

      s.x = Math.max(this.scrollX + 12, s.x + s.vx);
      if (s.x - this.scrollX > 110) this.scrollX = s.x - 110;

      s.vy += 0.3;
      s.y += s.vy;
      if (s.y >= 138) {
        s.y = 138;
        s.vy = 0;
        s.onGround = true;
        if (Math.abs(s.vx) < 1.3) s.spin = false;
      }

      const targetTailsX = s.x - s.dir * 22;
      this.tails.x += (targetTailsX - this.tails.x) * 0.14;
      this.tails.y = s.y + 4;
      this.tails.dir = s.dir;

      this.springs.forEach(sp => {
        if (gfx.rectOverlap(s.x, s.y, 16, 20, sp.x, sp.y, 14, 10)) {
          s.vy = -7.2;
          s.onGround = false;
          s.spin = true;
          if (this.audio) this.audio.sfx('bumper');
        }
      });

      this.bumpers.forEach(bm => {
        if (gfx.rectOverlap(s.x, s.y, 16, 20, bm.x, bm.y, 16, 16)) {
          s.vy = -4.8;
          s.vx = -s.vx || 3.0;
          this.score += 100;
          this.fx.push({ kind: 'popup', text: '100', x: bm.x, y: bm.y - 6, vy: -0.7, maxTimer: 20, color: '#fce000' });
          if (this.audio) this.audio.sfx('bumper');
        }
      });

      this.ringItems.forEach(r => {
        if (!r.taken && gfx.rectOverlap(s.x, s.y, 16, 20, r.x, r.y, 10, 10)) {
          r.taken = true;
          this.rings++;
          this.score += 100;
          this.fx.push({ kind: 'spark', x: r.x + 4, y: r.y + 4, maxTimer: 8, color: '#fce000' });
          if (this.audio) this.audio.sfx('ring');
        }
      });

      for (let i = this.scatteredRings.length - 1; i >= 0; i--) {
        const sr = this.scatteredRings[i];
        sr.x += sr.vx;
        sr.y += sr.vy;
        sr.vy += 0.22;
        sr.life--;
        if (sr.y >= 146) { sr.y = 146; sr.vy = -Math.abs(sr.vy) * 0.72; }
        if (s.invuln < 45 && gfx.rectOverlap(s.x, s.y, 16, 20, sr.x, sr.y, 10, 10)) {
          this.rings++;
          this.scatteredRings.splice(i, 1);
          if (this.audio) this.audio.sfx('ring');
          continue;
        }
        if (sr.life <= 0) this.scatteredRings.splice(i, 1);
      }

      this.badniks.forEach(b => {
        if (!b.alive) return;
        b.x += b.vx;
        if (b.x < 100 || b.x > 740) b.vx = -b.vx;
        if (gfx.rectOverlap(s.x, s.y, 16, 20, b.x, b.y, b.boss ? 28 : 16, b.boss ? 24 : 16)) {
          if (s.spin || !s.onGround || this.superSonic) {
            b.hp = (b.hp || 1) - 1;
            s.vy = -3.8;
            this.fx.push({ kind: 'explosion', x: b.x + 8, y: b.y + 8, maxTimer: 14 });
            if (b.hp <= 0) {
              b.alive = false;
              const pts = b.boss ? 2000 : 300;
              this.score += pts;
              this.fx.push({ kind: 'popup', text: String(pts), x: b.x, y: b.y, vy: -0.7, maxTimer: 24 });
              if (b.boss) {
                this.zoneIndex = (this.zoneIndex + 1) % this.zones.length;
                this.initZone(this.zoneIndex);
              }
            }
            if (this.audio) this.audio.sfx('explosion');
          } else if (s.invuln === 0) {
            if (this.rings > 0) {
              const dropCount = Math.min(8, this.rings);
              for (let k = 0; k < dropCount; k++) {
                const ang = -0.4 - (k / dropCount) * 2.3;
                this.scatteredRings.push({ x: s.x, y: s.y, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3.5, life: 120 });
              }
              this.rings = 0;
              s.vx = -2.5 * s.dir;
              s.vy = -3.4;
              s.invuln = 70;
              if (this.audio) this.audio.sfx('hit');
            } else {
              this.initZone(this.zoneIndex);
            }
          }
        }
      });
    }

    render(ctx) {
      const gfx = getGfx();
      const zoneColors = ['#2038ec', '#181848', '#300c40', '#101018'];
      ctx.fillStyle = zoneColors[this.zoneIndex % zoneColors.length];
      ctx.fillRect(0, 0, W, 118);
      ctx.fillStyle = this.zoneIndex === 0 ? '#5c94fc' : '#282868';
      ctx.fillRect(0, 118, W, 36);

      for (let i = 0; i < 4; i++) {
        const px = ((i * 110 + 30 - Math.floor(this.scrollX * 0.45)) % 420 + 420) % 420 - 40;
        if (this.zoneIndex === 0) {
          ctx.fillStyle = '#a85000';
          ctx.fillRect(px, 78, 6, 76);
          ctx.fillStyle = '#00a800';
          [[-18, -4], [18, -4], [-14, 6], [14, 6]].forEach(([dx, dy]) => {
            ctx.fillRect(px + dx, 74 + dy, 18, 6);
          });
        } else if (this.zoneIndex === 1) {
          ctx.fillStyle = '#fce000';
          ctx.fillRect(px, 64, 24, 90);
          ctx.fillStyle = '#202020';
          for (let y = 70; y < 148; y += 14) ctx.fillRect(px + 2, y, 20, 6);
        } else if (this.zoneIndex === 2) {
          ctx.strokeStyle = '#fc58b8';
          ctx.strokeRect(px, 60, 32, 48);
          gfx.drawHudText(ctx, '777', px + 6, 88, '#fce000', '#000000', 9);
        }
      }

      ctx.fillStyle = this.zoneIndex === 1 ? '#fce000' : '#00a800';
      ctx.fillRect(0, 152, W, 8);
      ctx.fillStyle = '#58d854';
      ctx.fillRect(0, 152, W, 3);
      for (let x = -Math.floor(this.scrollX % 16); x < W; x += 16) {
        for (let y = 160; y < H; y += 16) {
          ctx.fillStyle = ((Math.floor((x + this.scrollX) / 16) + y / 16) % 2) ? '#a85000' : '#c86c00';
          ctx.fillRect(x, y, 16, 16);
        }
      }

      if (this.mode === 'title') {
        ctx.fillStyle = '#d82800';
        ctx.fillRect(28, 28, 200, 56);
        ctx.strokeStyle = '#fce000';
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, 196, 52);
        gfx.drawHudText(ctx, 'SONIC', 82, 54, '#fcfcfc', '#000000', 20);
        gfx.drawHudText(ctx, 'THE HEDGEHOG 2', 58, 72, '#fce000', '#000000', 12);
        gfx.drawPixelSprite(ctx, SONIC_SPRITES.stand, { b: '#2038ec', w: '#fcfcfc', k: '#000000', s: '#fca044', r: '#d82800' }, 36, 114, 2.2);
        gfx.drawPixelSprite(ctx, SONIC_SPRITES.tails, { o: '#fca044', w: '#fcfcfc', k: '#000000', r: '#d82800' }, 192, 124, 2.2, true);
        gfx.drawHudText(ctx, `${this.menuRow === 0 ? '>' : ' '} 1 PLAYER`, 86, 108, this.menuRow === 0 ? '#fce000' : '#fcfcfc', '#000000', 10);
        gfx.drawHudText(ctx, `${this.menuRow === 1 ? '>' : ' '} OPTIONS (SOUND TEST)`, 56, 124, this.menuRow === 1 ? '#fce000' : '#fcfcfc', '#000000', 10);
        if (this.levelSelectUnlocked) {
          gfx.drawHudText(ctx, 'LEVEL SELECT ОТКРЫТ! Зажмите A + START', 22, 146, '#58d854', '#000000', 9);
        }
        return;
      }

      if (this.mode === 'options' || this.mode === 'level_select') {
        ctx.fillStyle = '#101838';
        ctx.fillRect(0, 0, W, H);
        gfx.drawHudText(ctx, this.mode === 'level_select' ? 'SONIC 2 LEVEL SELECT' : 'OPTIONS - SOUND TEST', 42, 34, '#fce000', '#000000', 13);
        gfx.drawHudText(ctx, `SOUND TEST: [ ${String(this.soundTestVal).padStart(2, '0')} ] (Влево/Вправо, A/B/C)`, 16, 74, '#fcfcfc', null, 10);
        gfx.drawHudText(ctx, 'Код выбора уровня: 19, 65, 09, 17', 22, 98, '#3cbcfc', null, 9);
        gfx.drawHudText(ctx, 'Код 7 изумрудов:   04, 01, 02, 06', 22, 114, '#58d854', null, 9);
        if (this.mode === 'level_select') {
          this.zones.forEach((z, idx) => {
            gfx.drawHudText(ctx, `${idx === this.zoneIndex ? '>' : ' '} ${z} ZONE`, 48, 142 + idx * 14, idx === this.zoneIndex ? '#fce000' : '#bcbcbc', null, 10);
          });
        }
        gfx.drawHudText(ctx, `Изумруды Хаоса: ${this.emeralds}/7  [START - ИГРАТЬ]`, 28, 210, '#fce000', null, 9);
        return;
      }

      this.springs.forEach(sp => {
        const sx = Math.round(sp.x - this.scrollX);
        ctx.fillStyle = '#d82800';
        ctx.fillRect(sx, sp.y, 14, 4);
        ctx.fillStyle = '#fce000';
        ctx.fillRect(sx + 3, sp.y + 4, 8, 6);
      });

      this.bumpers.forEach(bm => {
        const bx = Math.round(bm.x - this.scrollX);
        gfx.drawPixelSprite(ctx, ['.rrrr.', 'ryyyyr', 'rywwyr', 'ryyyyr', '.rrrr.'], { r: '#d82800', y: '#fce000', w: '#fcfcfc' }, bx, bm.y, 2.2);
      });

      const drawRing = (rx, ry) => {
        if (rx < -12 || rx > W) return;
        const spinW = [8, 6, 3, 6][(this.tick >> 2) % 4];
        ctx.strokeStyle = '#fce000';
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(rx + (8 - spinW) / 2), Math.round(ry), spinW, 9);
      };

      this.ringItems.forEach(r => { if (!r.taken) drawRing(r.x - this.scrollX, r.y); });
      this.scatteredRings.forEach(sr => { if (sr.life % 2 === 0) drawRing(sr.x - this.scrollX, sr.y); });

      this.badniks.forEach(b => {
        if (!b.alive) return;
        const bx = Math.round(b.x - this.scrollX);
        if (bx < -36 || bx > W) return;
        if (b.boss) {
          gfx.drawPixelSprite(ctx, SONIC_SPRITES.eggman, { r: '#d82800', w: '#fcfcfc', k: '#202020', s: '#fca044', g: '#bcbcbc', y: '#fce000' }, bx, b.y, 2);
        } else {
          gfx.drawPixelSprite(ctx, SONIC_SPRITES.buzzer, { w: '#fcfcfc', b: '#3cbcfc', y: '#fce000', r: '#d82800' }, bx, b.y, 2, b.vx > 0);
        }
      });

      gfx.drawPixelSprite(ctx, SONIC_SPRITES.tails, { o: '#fca044', w: '#fcfcfc', k: '#000000', r: '#d82800' }, Math.round(this.tails.x - this.scrollX), Math.round(this.tails.y), 1.8, this.tails.dir < 0);

      const sx = Math.round(this.sonic.x - this.scrollX);
      if (this.sonic.invuln % 2 === 0) {
        const pal = this.superSonic
          ? { b: (this.tick % 6 < 3) ? '#fce000' : '#fff8a0', d: '#fca044', w: '#fcfcfc', k: '#d82800', s: '#fca044', r: '#d82800' }
          : { b: '#2038ec', d: '#101888', w: '#fcfcfc', k: '#000000', s: '#fca044', r: '#d82800' };
        const spr = this.sonic.spin ? SONIC_SPRITES.spin : (Math.abs(this.sonic.vx) > 0.4 && ((this.tick >> 1) & 1) ? SONIC_SPRITES.run : SONIC_SPRITES.stand);
        gfx.drawPixelSprite(ctx, spr, pal, sx, Math.round(this.sonic.y), 1.8, this.sonic.dir < 0);
      }

      gfx.renderFxList(ctx, this.fx, this.scrollX);

      gfx.drawHudText(ctx, `SCORE ${String(this.score).padStart(6, '0')}`, 8, 14, '#fce000', '#000000', 9);
      gfx.drawHudText(ctx, `RINGS ${String(this.rings).padStart(3, '0')}`, 8, 25, (this.rings === 0 && (this.tick % 16 < 8)) ? '#d82800' : '#fce000', '#000000', 9);
      gfx.drawHudText(ctx, this.zones[this.zoneIndex], 144, 14, '#fcfcfc', '#000000', 9);
      if (this.superSonic) {
        gfx.drawHudText(ctx, '★ SUPER SONIC ★', 144, 25, '#58d854', '#000000', 9);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        zoneIndex: this.zoneIndex,
        score: this.score,
        rings: this.rings,
        emeralds: this.emeralds,
        superSonic: this.superSonic,
        cheatUnlocked: this.cheatUnlocked,
        levelSelectUnlocked: this.levelSelectUnlocked,
        scrollX: this.scrollX,
        sonic: { ...this.sonic }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
      if (st.sonic) this.sonic = { ...st.sonic };
    }
  }

  const MK_FIGHTER_SPRITES = {
    idle: [
      '...kkkk...',
      '..kssssk..',
      '..kmmmmk..',
      '.cckkkkcc.',
      'ssccccccss',
      'ssccccccss',
      '..kkkkkk..',
      '..cccccc..',
      '..kk..kk..',
      '.kk....kk.',
      '.bb....bb.'
    ],
    punch: [
      '...kkkk.....',
      '..kssssk....',
      '..kmmmmk....',
      '.cckkkkccsss',
      'sscccccc....',
      '..kkkkkk....',
      '..cccccc....',
      '..kk..kk....',
      '.kk....kk...',
      '.bb....bb...'
    ],
    kick: [
      '...kkkk.....',
      '..kssssk....',
      '..kmmmmk....',
      '.cckkkkcc...',
      'ssccccccss..',
      '..kkkkkk....',
      '..ccc.kkkkbb',
      '..kk........',
      '.kk.........',
      '.bb.........'
    ],
    uppercut: [
      '.......ss.',
      '...kkkkss.',
      '..kssssks.',
      '..kmmmmks.',
      '.cckkkkcc.',
      '..cccccc..',
      '..kkkkkk..',
      '..kk..kk..',
      '.bb....bb.'
    ],
    dizzy: [
      '..y..y..y.',
      '...kkkk...',
      '..kssssk..',
      '..kmmmmk..',
      '..cccccc..',
      '.ssccccss.',
      '..kkkkkk..',
      '...kk.kk..',
      '..bb...bb.'
    ],
    skeleton: [
      '...wwww...',
      '..wkwwkw..',
      '...wwww...',
      '..wwwwww..',
      '...wwww...',
      '..wwwwww..',
      '...w..w...',
      '..ww..ww..'
    ]
  };

  class Umk3Core {
    constructor(audio) {
      this.audio = audio;
      this.id = 'umk3';
      this.sys = 'sega';
      this.secretSeq = ['a', 'c', 'up', 'b', 'up', 'b', 'a', 'down'];
      this.fighters = [
        { name: 'SCORPION', color: '#e8c800', mask: '#c89800', special: 'harpoon' },
        { name: 'SUB-ZERO', color: '#2878f8', mask: '#1848a8', special: 'ice' },
        { name: 'CYRAX', color: '#f0b000', mask: '#404040', special: 'net' },
        { name: 'NOOB SAIBOT', color: '#383848', mask: '#181820', special: 'shadow' },
        { name: 'SHAO KAHN', color: '#d82800', mask: '#bcbcbc', special: 'hammer' }
      ];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.cheatUnlocked = false;
      this.oneButtonFatality = false;
      this.inputHistory = [];
      this.fighterIdx = 0;
      this.round = 1;
      this.score = 0;
      this.tick = 0;
      this.fatalityTriggered = false;
      this.toastyTimer = 0;
      this.comboCount = 0;
      this.comboTimer = 0;
      this.fx = [];
      this.initMatch();
    }

    initMatch() {
      this.fatalityTriggered = false;
      this.toastyTimer = 0;
      this.fx = [];
      this.p1 = { x: 60, y: 118, vy: 0, hp: 100, pose: 'idle', poseTimer: 0, freeze: 0, wins: this.p1 ? this.p1.wins : 0 };
      this.p2 = { x: 166, y: 118, vy: 0, hp: 100, pose: 'idle', poseTimer: 0, freeze: 0, wins: 0 };
      this.projectiles = [];
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.oneButtonFatality = true;
      this.mode = 'killer_codes';
      if (this.audio) this.audio.sfx('cheat');
      return 'Меню Killer Codes: 1-Button Fatality (C) + Shao Kahn / Noob Saibot';
    }

    spawnBlood(x, y, count) {
      for (let i = 0; i < count; i++) {
        this.fx.push({
          kind: 'debris',
          x,
          y,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -1.8 - Math.random() * 2.5,
          gravity: 0.25,
          maxTimer: 22,
          color: '#d80000'
        });
      }
    }

    onButtonPress(btn, inputState) {
      if (this.mode === 'title') {
        this.inputHistory.push(btn);
        if (this.inputHistory.length > 12) this.inputHistory.shift();
        const tail = this.inputHistory.slice(-this.secretSeq.length);
        if (tail.length === this.secretSeq.length && tail.every((k, i) => k === this.secretSeq[i])) {
          this.cheatUnlocked = true;
          this.oneButtonFatality = true;
          this.mode = 'killer_codes';
          if (this.audio) this.audio.sfx('cheat');
          return;
        }
        if (btn === 'start') {
          this.initMatch();
          this.mode = 'play';
        }
        return;
      }

      if (this.mode === 'killer_codes') {
        if (btn === 'left' || btn === 'up') {
          this.fighterIdx = (this.fighterIdx + this.fighters.length - 1) % this.fighters.length;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'right' || btn === 'down') {
          this.fighterIdx = (this.fighterIdx + 1) % this.fighters.length;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'start' || btn === 'a' || btn === 'c') {
          this.initMatch();
          this.mode = 'play';
        }
        return;
      }

      if (this.mode === 'play') {
        const dist = Math.abs(this.p1.x - this.p2.x);
        if (btn === 'a' || btn === 'b') {
          const isUppercut = !!(inputState && inputState.down && btn === 'a');
          this.p1.pose = isUppercut ? 'uppercut' : (btn === 'a' ? 'punch' : 'kick');
          this.p1.poseTimer = 14;
          if (dist < 46) {
            const dmg = isUppercut ? 22 : (btn === 'a' ? 12 : 16);
            this.p2.hp = Math.max(0, this.p2.hp - dmg);
            this.p2.pose = 'dizzy';
            this.p2.poseTimer = 12;
            this.comboCount = this.comboTimer > 0 ? this.comboCount + 1 : 1;
            this.comboTimer = 45;
            this.score += dmg * 25;
            this.spawnBlood(this.p2.x + 8, this.p2.y + 12, isUppercut ? 10 : 5);
            if (isUppercut) {
              this.p2.vy = -4.2;
              this.toastyTimer = 55;
              if (this.audio) this.audio.sfx('uppercut');
            } else if (this.audio) {
              this.audio.sfx('hit');
            }
          }
        } else if (btn === 'c' || btn === 'z') {
          this.p1.pose = 'punch';
          this.p1.poseTimer = 16;
          if ((this.oneButtonFatality && this.p2.hp <= 25) || (this.p2.hp <= 15 && dist < 60)) {
            this.p2.hp = 0;
            this.fatalityTriggered = true;
            this.score += 5000;
            this.spawnBlood(this.p2.x + 10, this.p2.y + 18, 16);
            if (this.audio) this.audio.sfx('fatality');
          } else {
            const f1 = this.fighters[this.fighterIdx];
            this.projectiles.push({
              x: this.p1.x + 20,
              y: this.p1.y + 16,
              vx: 4.8,
              kind: f1.special,
              fromP1: true
            });
            if (this.audio) this.audio.sfx(f1.special === 'harpoon' ? 'harpoon' : 'shoot');
          }
        }
      }
    }

    step(input) {
      const gfx = getGfx();
      this.tick++;
      gfx.stepFxList(this.fx);
      if (this.mode !== 'play') return;
      if (this.toastyTimer > 0) this.toastyTimer--;
      if (this.comboTimer > 0) this.comboTimer--;
      if (this.p1.poseTimer > 0) {
        this.p1.poseTimer--;
        if (this.p1.poseTimer === 0) this.p1.pose = 'idle';
      }
      if (this.p2.poseTimer > 0) {
        this.p2.poseTimer--;
        if (this.p2.poseTimer === 0) this.p2.pose = 'idle';
      }

      if (input.left) this.p1.x = Math.max(18, this.p1.x - 1.85);
      if (input.right) this.p1.x = Math.min(200, this.p1.x + 1.85);
      if (input.up && this.p1.y >= 118) this.p1.vy = -5.2;

      [this.p1, this.p2].forEach(f => {
        if (f.y < 118 || f.vy !== 0) {
          f.y += f.vy;
          f.vy += 0.32;
          if (f.y >= 118) { f.y = 118; f.vy = 0; }
        }
      });

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.x += pr.vx;
        if (Math.abs(pr.x - this.p2.x) < 18) {
          this.p2.hp = Math.max(0, this.p2.hp - 14);
          this.p2.freeze = 42;
          if (pr.kind === 'harpoon') {
            this.p2.x = Math.min(200, this.p1.x + 28);
            this.fx.push({ kind: 'popup', text: 'GET OVER HERE!', x: this.p1.x - 10, y: 88, vy: -0.3, maxTimer: 32, color: '#fce000' });
          }
          this.spawnBlood(this.p2.x + 8, this.p2.y + 16, 6);
          this.projectiles.splice(i, 1);
          if (this.audio) this.audio.sfx('hit');
          continue;
        }
        if (pr.x < 0 || pr.x > W) this.projectiles.splice(i, 1);
      }

      if (this.p2.hp > 0) {
        if (this.p2.freeze > 0) {
          this.p2.freeze--;
        } else {
          const dist = this.p1.x - this.p2.x;
          if (Math.abs(dist) > 32) {
            this.p2.x += Math.sign(dist) * 0.9;
          } else if (Math.random() < 0.03) {
            this.p2.pose = 'kick';
            this.p2.poseTimer = 10;
            this.p1.hp = Math.max(10, this.p1.hp - 4);
            this.spawnBlood(this.p1.x + 8, this.p1.y + 14, 3);
            if (this.audio) this.audio.sfx('hit');
          }
        }
      } else if (!this.fatalityTriggered && this.oneButtonFatality) {
        this.fatalityTriggered = true;
        this.spawnBlood(this.p2.x + 10, this.p2.y + 18, 16);
        if (this.audio) this.audio.sfx('fatality');
      }
    }

    drawFighter(ctx, f, fighterDef, flipX, isSkeleton) {
      const gfx = getGfx();
      if (isSkeleton) {
        gfx.drawPixelSprite(ctx, MK_FIGHTER_SPRITES.skeleton, { w: '#fcfcfc', k: '#d82800' }, f.x, f.y + 8, 3, flipX);
        return;
      }
      const frozen = f.freeze > 0;
      const pal = frozen
        ? { k: '#1848a8', s: '#80e8ff', m: '#fcfcfc', c: '#3cbcfc', b: '#1848a8', y: '#fce000' }
        : { k: '#181820', s: '#fca044', m: fighterDef.mask, c: fighterDef.color, b: '#303030', y: '#fce000' };
      const sprKey = f.hp <= 20 && f.pose === 'idle' ? 'dizzy' : (MK_FIGHTER_SPRITES[f.pose] ? f.pose : 'idle');
      gfx.drawPixelSprite(ctx, MK_FIGHTER_SPRITES[sprKey], pal, Math.round(f.x), Math.round(f.y), 2.8, flipX);
    }

    render(ctx) {
      const gfx = getGfx();
      ctx.fillStyle = this.fatalityTriggered ? '#080000' : '#181428';
      ctx.fillRect(0, 0, W, H);

      if (this.mode === 'title') {
        ctx.fillStyle = '#380808';
        ctx.fillRect(16, 26, 224, 62);
        ctx.strokeStyle = '#fce000';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 28, 220, 58);
        gfx.drawHudText(ctx, 'ULTIMATE', 82, 48, '#fce000', '#000000', 14);
        gfx.drawHudText(ctx, 'MORTAL KOMBAT 3', 28, 70, '#d82800', '#fcfcfc', 18);
        this.drawFighter(ctx, { x: 42, y: 108, hp: 100, pose: 'punch', freeze: 0 }, this.fighters[0], false, false);
        this.drawFighter(ctx, { x: 176, y: 108, hp: 100, pose: 'idle', freeze: 0 }, this.fighters[1], true, false);
        gfx.drawHudText(ctx, 'Код на заставке: A, C, Up, B, Up, B, A, Down', 8, 192, '#fce000', '#000000', 9);
        gfx.drawHudText(ctx, 'НАЖМИТЕ START ДЛЯ ТУРНИРА', 50, 210, '#fcfcfc', '#000000', 9);
        return;
      }

      if (this.mode === 'killer_codes') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        gfx.drawHudText(ctx, 'KILLER CODES MENU', 54, 36, '#d82800', '#fce000', 14);
        const f1 = this.fighters[this.fighterIdx];
        this.drawFighter(ctx, { x: 112, y: 52, hp: 100, pose: 'idle', freeze: 0 }, f1, false, false);
        gfx.drawHudText(ctx, `БОЕЦ: < ${f1.name} >`, 54, 142, '#fce000', null, 10);
        gfx.drawHudText(ctx, '1-BUTTON FATALITY (C): ВКЛ', 48, 162, '#58d854', null, 9);
        gfx.drawHudText(ctx, 'БОССЫ SHAO KAHN / NOOB: ОТКРЫТЫ', 34, 178, '#3cbcfc', null, 9);
        gfx.drawHudText(ctx, 'Нажмите START для боя', 64, 204, '#fcfcfc', null, 10);
        return;
      }

      for (let i = 0; i < 6; i++) {
        const px = 12 + i * 42;
        ctx.fillStyle = '#28243c';
        ctx.fillRect(px, 44, 22, 136);
        ctx.fillStyle = '#3c3658';
        ctx.fillRect(px + 3, 44, 6, 136);
        const flameCol = ((this.tick >> 2) + i) % 2 ? '#fce000' : '#d82800';
        ctx.fillStyle = flameCol;
        ctx.fillRect(px + 7, 74, 8, 10);
      }
      ctx.fillStyle = '#383438';
      ctx.fillRect(0, 178, W, 46);
      ctx.fillStyle = '#585058';
      ctx.fillRect(0, 178, W, 3);

      ctx.fillStyle = '#600000';
      ctx.fillRect(10, 12, 102, 11);
      ctx.fillRect(144, 12, 102, 11);
      ctx.fillStyle = '#58d854';
      ctx.fillRect(11, 13, Math.max(0, this.p1.hp), 9);
      ctx.fillRect(145 + (100 - Math.max(0, this.p2.hp)), 13, Math.max(0, this.p2.hp), 9);
      ctx.strokeStyle = '#fce000';
      ctx.strokeRect(10, 12, 102, 11);
      ctx.strokeRect(144, 12, 102, 11);
      gfx.drawHudText(ctx, '99', 121, 21, '#fce000', '#000000', 11);

      const f1 = this.fighters[this.fighterIdx];
      gfx.drawHudText(ctx, f1.name, 12, 33, '#fce000', '#000000', 9);
      gfx.drawHudText(ctx, 'SUB-ZERO', 188, 33, '#3cbcfc', '#000000', 9);

      if (this.comboTimer > 0 && this.comboCount > 1) {
        gfx.drawHudText(ctx, `${this.comboCount} HITS COMBO!`, 12, 50, '#d82800', '#fce000', 9);
      }

      this.drawFighter(ctx, this.p1, f1, false, false);
      this.drawFighter(ctx, this.p2, this.fighters[1], true, this.fatalityTriggered);

      this.projectiles.forEach(pr => {
        if (pr.kind === 'harpoon') {
          ctx.fillStyle = '#bcbcbc';
          ctx.fillRect(this.p1.x + 22, pr.y + 2, pr.x - (this.p1.x + 22), 2);
          ctx.fillStyle = '#fce000';
          ctx.fillRect(pr.x, pr.y, 10, 6);
        } else if (pr.kind === 'ice') {
          gfx.drawPixelSprite(ctx, ['.www.', 'wcccw', 'wcccw', '.www.'], { w: '#fcfcfc', c: '#3cbcfc' }, pr.x, pr.y - 2, 2);
        } else {
          ctx.fillStyle = '#58d854';
          ctx.strokeStyle = '#fce000';
          ctx.strokeRect(pr.x, pr.y - 4, 12, 12);
        }
      });

      gfx.renderFxList(ctx, this.fx, 0);

      if (this.toastyTimer > 0) {
        ctx.fillStyle = '#fca044';
        ctx.fillRect(216, 186, 36, 34);
        ctx.fillStyle = '#000000';
        ctx.fillRect(222, 194, 6, 4);
        ctx.fillRect(234, 194, 6, 4);
        gfx.drawHudText(ctx, 'TOASTY!', 166, 208, '#fce000', '#d82800', 10);
      }

      if (this.p2.hp <= 20 && this.p2.hp > 0 && !this.fatalityTriggered) {
        gfx.drawHudText(ctx, 'FINISH HIM!', 76, 76, (this.tick % 6 < 3) ? '#d82800' : '#fce000', '#000000', 15);
      } else if (this.fatalityTriggered || this.p2.hp === 0) {
        gfx.drawHudText(ctx, 'FATALITY!', 78, 74, '#d82800', '#fcfcfc', 17);
        gfx.drawHudText(ctx, `${f1.name} WINS`, 76, 92, '#fce000', '#000000', 10);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        cheatUnlocked: this.cheatUnlocked,
        oneButtonFatality: this.oneButtonFatality,
        fighterIdx: this.fighterIdx,
        score: this.score,
        p1: { ...this.p1 },
        p2: { ...this.p2 }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
    }
  }

  const COMIX_SPRITES = {
    sketch: [
      '..yyyy....',
      '.ykkkkss..',
      'yyssssss..',
      '..ooooooww',
      '..ooooooww',
      '..bbbbbb..',
      '..bb..bb..',
      '.bb....bb.',
      '.ww....ww.'
    ],
    sketch_kick: [
      '..yyyy......',
      '.ykkkkss....',
      '..oooooo....',
      '..bbbbbbbbww',
      '..bb........',
      '.ww.........'
    ],
    mutant: [
      '..gggggg..',
      '.gwwkkwwg.',
      'gggggggggg',
      'gg.rrrr.gg',
      '.gggggggg.',
      '..gg..gg..',
      '.gg....gg.'
    ],
    roadkill: [
      '..nn..nn',
      '.nnnnnnn',
      'ppnnnnwk',
      '..nn..nn'
    ],
    barrel: [
      '.rrrrrr.',
      'ryyyyyyr',
      'rrkkykrr',
      'ryyyyyyr',
      '.rrrrrr.'
    ]
  };

  class ComixZoneCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'comixzone';
      this.sys = 'sega';
      this.jukeboxSeq = [14, 15, 18, 5, 13, 1, 3, 18, 15, 6];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.page = 1;
      this.maxPages = 6;
      this.score = 0;
      this.cheatUnlocked = false;
      this.jukeboxTrack = 14;
      this.jukeboxHistory = [];
      this.shout = 'AAARGH!';
      this.tick = 0;
      this.handTimer = 0;
      this.burstTimer = 0;
      this.burstText = 'POW!';
      this.planes = [];
      this.initPage(1);
    }

    initPage(pg) {
      this.page = pg;
      this.sketch = { x: 38, y: 146, hp: 100, dir: 1, pose: 'idle', poseTimer: 0 };
      this.mutant = { x: 174, y: 144, hp: 40 + pg * 10, maxHp: 40 + pg * 10, alive: true };
      this.planes = [];
      this.handTimer = 45;
      this.shout = pg > 1 ? `PAGE ${pg}: OH YEAH!` : 'EPISODE 1: NIGHT OF MUTANTS';
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.page = (this.page % this.maxPages) + 1;
      this.initPage(this.page);
      this.shout = `OH YEAH! СТРАНИЦА ${this.page}/6`;
      this.mode = 'play';
      if (this.audio) this.audio.sfx('cheat');
      return `Jukebox код: выбор страницы комикса (Стр. ${this.page}/6)`;
    }

    onButtonPress(btn) {
      if (this.mode === 'title') {
        if (btn === 'b' || btn === 'select') {
          this.mode = 'jukebox';
        } else if (btn === 'start' || btn === 'a') {
          this.mode = 'play';
        }
        return;
      }

      if (this.mode === 'jukebox') {
        if (btn === 'left') this.jukeboxTrack = this.jukeboxTrack > 1 ? this.jukeboxTrack - 1 : 18;
        else if (btn === 'right') this.jukeboxTrack = this.jukeboxTrack < 18 ? this.jukeboxTrack + 1 : 1;
        else if (btn === 'c' || btn === 'a') {
          this.jukeboxHistory.push(this.jukeboxTrack);
          if (this.audio) this.audio.sfx('coin');
          if (this.jukeboxHistory.length >= 3) {
            this.cheatUnlocked = true;
            this.shout = 'OH YEAH!';
            if (this.audio) this.audio.sfx('cheat');
          }
        } else if (btn === 'up' && this.cheatUnlocked) {
          this.page = (this.page % this.maxPages) + 1;
        } else if (btn === 'start') {
          this.initPage(this.page);
          this.mode = 'play';
        }
        return;
      }

      if (this.mode === 'play') {
        if (this.cheatUnlocked && btn === 'select') {
          this.page = (this.page % this.maxPages) + 1;
          this.initPage(this.page);
          return;
        }
        if (btn === 'c') {
          const p = { x: this.sketch.x + 14, y: this.sketch.y + 12, vx: 4.2 * (this.sketch.dir || 1), active: true };
          this.planes.push(p);
          this.plane = p;
          this.shout = 'PAPER PLANE!';
          if (this.audio) this.audio.sfx('shoot');
          return;
        }
        if (btn === 'a' || btn === 'b') {
          this.sketch.pose = 'kick';
          this.sketch.poseTimer = 12;
          if (this.mutant.alive && Math.abs(this.sketch.x - this.mutant.x) < 48) {
            this.mutant.hp -= 15;
            const words = ['POW!', 'SMASH!', 'WHAM!', 'CRACK!'];
            this.burstText = words[(this.tick + this.page) % words.length];
            this.burstTimer = 18;
            this.shout = `${this.burstText} OH YEAH!`;
            this.score += 250;
            if (this.audio) this.audio.sfx('uppercut');
            if (this.mutant.hp <= 0) {
              this.mutant.alive = false;
              this.page = (this.page % this.maxPages) + 1;
              this.initPage(this.page);
              if (this.audio) this.audio.sfx('stageClear');
            }
          }
        }
      }
    }

    step(input) {
      this.tick++;
      if (this.mode !== 'play') return;
      if (this.handTimer > 0) this.handTimer--;
      if (this.burstTimer > 0) this.burstTimer--;
      if (this.sketch.poseTimer > 0) {
        this.sketch.poseTimer--;
        if (this.sketch.poseTimer === 0) this.sketch.pose = 'idle';
      }

      if (input.left) { this.sketch.x = Math.max(18, this.sketch.x - 1.9); this.sketch.dir = -1; }
      if (input.right) { this.sketch.x = Math.min(210, this.sketch.x + 1.9); this.sketch.dir = 1; }

      for (let i = this.planes.length - 1; i >= 0; i--) {
        const pl = this.planes[i];
        pl.x += pl.vx;
        if (this.mutant.alive && Math.abs(pl.x - this.mutant.x) < 20) {
          this.mutant.hp -= 20;
          this.burstText = 'ZAP!';
          this.burstTimer = 16;
          this.planes.splice(i, 1);
          if (this.mutant.hp <= 0) {
            this.mutant.alive = false;
            this.page = (this.page % this.maxPages) + 1;
            this.initPage(this.page);
          }
          continue;
        }
        if (pl.x < 8 || pl.x > W - 8) this.planes.splice(i, 1);
      }

      if (this.mutant.alive) {
        const d = this.sketch.x - this.mutant.x;
        if (Math.abs(d) > 28) this.mutant.x += Math.sign(d) * 0.75;
      }
    }

    render(ctx) {
      const gfx = getGfx();
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(0, 0, W, H);
      const panels = [
        [6, 6, 118, 96, '#f8d878'],
        [132, 6, 118, 96, '#a8e4fc'],
        [6, 110, 244, 108, (this.page % 2 === 1) ? '#fcbcb0' : '#d8f8b8']
      ];
      panels.forEach(([x, y, w, h, c]) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      });

      if (this.mode === 'title') {
        ctx.fillStyle = '#fce000';
        ctx.fillRect(36, 26, 184, 52);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 26, 184, 52);
        gfx.drawHudText(ctx, 'COMIX ZONE', 64, 56, '#d82800', '#000000', 18);
        gfx.drawPixelSprite(ctx, COMIX_SPRITES.sketch, { y: '#fce000', k: '#000000', s: '#fca044', o: '#d84818', w: '#fcfcfc', b: '#2038ec' }, 64, 134, 3);
        gfx.drawPixelSprite(ctx, COMIX_SPRITES.mutant, { g: '#00a800', w: '#fcfcfc', k: '#000000', r: '#d82800' }, 168, 138, 3, true);
        gfx.drawHudText(ctx, 'START - Играть | B - Jukebox (Коды)', 24, 204, '#000000', null, 9);
        return;
      }

      if (this.mode === 'jukebox') {
        gfx.drawHudText(ctx, `JUKEBOX TRACK: [ ${this.jukeboxTrack} ]`, 42, 146, '#000000', '#fcfcfc', 12);
        gfx.drawHudText(ctx, 'Код: 14,15,18,5,13,1,3,18,15,6 (кнопка C)', 14, 168, '#000000', null, 9);
        gfx.drawHudText(ctx, `СТРАНИЦА КОМИКСА: ${this.page} / ${this.maxPages} [START]`, 32, 192, '#d82800', null, 9);
        return;
      }

      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(14, 14, 102, 26);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(14, 14, 102, 26);
      gfx.drawHudText(ctx, this.shout.slice(0, 17), 18, 30, '#000000', null, 8);
      gfx.drawHudText(ctx, `PAGE ${this.page}/6  SCORE ${this.score}`, 138, 24, '#000000', '#fcfcfc', 8);

      for (let bx = 14; bx < 110; bx += 22) {
        ctx.fillStyle = '#382848';
        ctx.fillRect(bx, 54, 18, 46);
        for (let wy = 58; wy < 92; wy += 10) {
          ctx.fillStyle = '#fce000';
          ctx.fillRect(bx + 3, wy, 4, 5);
          ctx.fillRect(bx + 10, wy, 4, 5);
        }
      }
      ctx.fillStyle = '#483858';
      ctx.fillRect(8, 186, 240, 30);
      for (let gx = 12; gx < 240; gx += 16) {
        ctx.fillStyle = '#281838';
        ctx.fillRect(gx, 188, 12, 6);
      }

      gfx.drawPixelSprite(ctx, COMIX_SPRITES.roadkill, { n: '#887058', p: '#f87858', w: '#fcfcfc', k: '#000000' }, 20, 82, 2);
      gfx.drawPixelSprite(ctx, COMIX_SPRITES.barrel, { r: '#d82800', y: '#fce000', k: '#000000' }, 218, 162, 2.5);

      ctx.fillStyle = '#d82800';
      ctx.fillRect(138, 32, 96, 7);
      ctx.fillStyle = '#fce000';
      ctx.fillRect(138, 32, Math.max(0, this.sketch.hp * 0.96), 7);

      const spr = this.sketch.pose === 'kick' ? COMIX_SPRITES.sketch_kick : COMIX_SPRITES.sketch;
      gfx.drawPixelSprite(ctx, spr, { y: '#fce000', k: '#000000', s: '#fca044', o: '#d84818', w: '#fcfcfc', b: '#2038ec' }, Math.round(this.sketch.x), Math.round(this.sketch.y), 2.8, this.sketch.dir < 0);

      this.planes.forEach(pl => {
        gfx.drawPixelSprite(ctx, ['..wwww', 'wwwwww', '..ww..'], { w: '#fcfcfc' }, pl.x, pl.y, 2);
      });

      if (this.mutant.alive) {
        gfx.drawPixelSprite(ctx, COMIX_SPRITES.mutant, { g: '#00a800', w: '#fcfcfc', k: '#000000', r: '#d82800' }, Math.round(this.mutant.x), Math.round(this.mutant.y), 2.8, true);
        if (this.handTimer > 0) {
          ctx.fillStyle = '#fca044';
          ctx.fillRect(this.mutant.x + 6, 92, 16, 36);
          ctx.fillStyle = '#fce000';
          ctx.fillRect(this.mutant.x + 2, 124, 20, 6);
        }
      }

      if (this.burstTimer > 0) {
        const bx = (this.sketch.x + this.mutant.x) / 2;
        ctx.fillStyle = '#fce000';
        ctx.fillRect(bx - 16, 120, 52, 20);
        ctx.strokeStyle = '#d82800';
        ctx.strokeRect(bx - 16, 120, 52, 20);
        gfx.drawHudText(ctx, this.burstText, bx - 10, 134, '#d82800', '#000000', 10);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        page: this.page,
        score: this.score,
        cheatUnlocked: this.cheatUnlocked,
        sketch: { ...this.sketch }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
    }
  }

  const SMW_SPRITES = {
    yoshi_mario: [
      '....rrrrr.....',
      '...rrrrrrr....',
      'yy.bbbssbs....',
      'yyy.rrrrbb....',
      'yy..bbbbbbgggg',
      '..ggggggggwkgg',
      '.ggggggggggggg',
      'ggggrrorrgggg.',
      '.ggggggggggg..',
      '..rr....rr....'
    ]
  };

  class SuperMarioWorldCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'smw';
      this.sys = 'snes';
      this.courses = ["YOSHI'S ISLAND 1", 'DONUT PLAINS 1', 'VANILLA DOME 1', 'BOWSER KEEP'];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.paused = false;
      this.courseIdx = 0;
      this.clearedCourses = { 0: true, 1: true };
      this.cheatUnlocked = false;
      this.score = 0;
      this.exits = 12;
      this.hasYoshi = true;
      this.hasCape = true;
      this.tick = 0;
      this.tongueTimer = 0;
      this.fx = [];
      this.initStage();
    }

    initStage() {
      this.scrollX = 0;
      this.fx = [];
      this.tongueTimer = 0;
      this.mario = { x: 48, y: 138, vx: 0, vy: 0, dir: 1, onGround: true };
      this.coins = [
        { x: 130, y: 118, taken: false },
        { x: 160, y: 118, taken: false },
        { x: 240, y: 96, taken: false },
        { x: 340, y: 118, taken: false }
      ];
      this.koopas = [
        { x: 210, y: 152, vx: -0.85, alive: true },
        { x: 380, y: 152, vx: -0.95, alive: true }
      ];
      this.goalX = 480;
    }

    activateCheat() {
      this.cheatUnlocked = true;
      this.paused = false;
      this.hasYoshi = true;
      this.hasCape = true;
      this.mode = 'map';
      if (this.audio) this.audio.sfx('cheat');
      return 'Start + Select: Выход на карту Dinosaur Land с Йоши и Пером!';
    }

    onButtonPress(btn) {
      if (this.mode === 'title') {
        if (btn === 'start' || btn === 'a') {
          this.mode = 'play';
        }
        return;
      }
      if (this.mode === 'map') {
        if (btn === 'left' || btn === 'up') {
          this.courseIdx = (this.courseIdx + this.courses.length - 1) % this.courses.length;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'right' || btn === 'down') {
          this.courseIdx = (this.courseIdx + 1) % this.courses.length;
          if (this.audio) this.audio.sfx('coin');
        } else if (btn === 'start' || btn === 'a' || btn === 'b') {
          this.initStage();
          this.mode = 'play';
        }
        return;
      }
      if (this.mode === 'play') {
        if (btn === 'start') {
          this.paused = !this.paused;
          if (this.audio) this.audio.sfx('coin');
          return;
        }
        if (btn === 'select' && (this.paused || this.clearedCourses[this.courseIdx])) {
          this.cheatUnlocked = true;
          this.paused = false;
          this.mode = 'map';
          if (this.audio) this.audio.sfx('cheat');
          return;
        }
        if (!this.paused) {
          if (btn === 'c') {
            this.tongueTimer = 14;
            if (this.audio) this.audio.sfx('tongue');
          } else if (btn === 'a' || btn === 'b') {
            if (this.mario.onGround || this.hasCape) {
              this.mario.vy = -5.5;
              this.mario.onGround = false;
              if (this.audio) this.audio.sfx('jump');
            }
          }
        }
      }
    }

    step(input) {
      const gfx = getGfx();
      this.tick++;
      gfx.stepFxList(this.fx);
      if (this.mode !== 'play' || this.paused) return;
      if (this.tongueTimer > 0) this.tongueTimer--;
      const m = this.mario;
      if (input.left) { m.x = Math.max(this.scrollX + 12, m.x - 2.05); m.dir = -1; }
      if (input.right) { m.x += 2.05; m.dir = 1; }
      if (m.x - this.scrollX > 110) this.scrollX = m.x - 110;

      m.vy += 0.28;
      m.y += m.vy;
      if (m.y >= 138) {
        m.y = 138;
        m.vy = 0;
        m.onGround = true;
      }

      const reach = this.tongueTimer > 0 ? 44 : 20;
      this.coins.forEach(c => {
        if (!c.taken && gfx.rectOverlap(m.x, m.y, reach, 28, c.x, c.y, 12, 14)) {
          c.taken = true;
          this.score += 200;
          this.fx.push({ kind: 'popup', text: '200', x: c.x, y: c.y, vy: -0.7, maxTimer: 20 });
          if (this.audio) this.audio.sfx('coin');
        }
      });

      this.koopas.forEach(k => {
        if (!k.alive) return;
        k.x += k.vx;
        if (gfx.rectOverlap(m.x, m.y, reach, 28, k.x, k.y, 16, 16)) {
          k.alive = false;
          this.score += 400;
          this.fx.push({ kind: 'popup', text: '400', x: k.x, y: k.y, vy: -0.7, maxTimer: 22 });
          if (this.audio) this.audio.sfx('powerup');
        }
      });

      if (m.x >= this.goalX) {
        this.clearedCourses[this.courseIdx] = true;
        this.exits = Math.min(96, this.exits + 1);
        this.mode = 'map';
        if (this.audio) this.audio.sfx('stageClear');
      }
    }

    render(ctx) {
      const gfx = getGfx();
      ctx.fillStyle = '#9cdcfc';
      ctx.fillRect(0, 0, W, H);

      if (this.mode === 'title') {
        ctx.fillStyle = '#fce000';
        ctx.fillRect(28, 30, 200, 62);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 30, 200, 62);
        gfx.drawHudText(ctx, 'SUPER MARIO WORLD', 42, 62, '#d82800', '#fcfcfc', 16);
        gfx.drawHudText(ctx, 'SUPER NINTENDO 1990', 68, 80, '#0058f8', null, 9);
        gfx.drawPixelSprite(ctx, SMW_SPRITES.yoshi_mario, { r: '#d82800', y: '#fce000', b: '#2038ec', s: '#fca044', g: '#38c838', w: '#fcfcfc', k: '#000000', o: '#fca044' }, 96, 122, 3);
        gfx.drawHudText(ctx, 'Пауза (START) + SELECT = Выход на карту', 18, 192, '#000000', null, 9);
        gfx.drawHudText(ctx, 'НАЖМИТЕ START', 88, 210, '#d82800', '#fcfcfc', 10);
        return;
      }

      if (this.mode === 'map') {
        ctx.fillStyle = '#2058d8';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#38a838';
        ctx.fillRect(18, 36, 220, 140);
        ctx.strokeStyle = '#f8d878';
        ctx.lineWidth = 4;
        ctx.strokeRect(18, 36, 220, 140);
        gfx.drawHudText(ctx, 'DINOSAUR LAND OVERWORLD', 42, 24, '#fce000', '#000000', 12);
        this.courses.forEach((c, i) => {
          const nx = 38 + i * 54;
          const ny = 96 + (i % 2) * 28;
          if (i < this.courses.length - 1) {
            ctx.strokeStyle = '#fcfcfc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nx + 10, ny + 10);
            ctx.lineTo(nx + 64, 96 + ((i + 1) % 2) * 28 + 10);
            ctx.stroke();
          }
          ctx.fillStyle = i === this.courseIdx ? '#d82800' : '#fce000';
          ctx.fillRect(nx, ny, 20, 20);
          if (i === this.courseIdx) {
            gfx.drawPixelSprite(ctx, SMW_SPRITES.yoshi_mario, { r: '#d82800', y: '#fce000', b: '#2038ec', s: '#fca044', g: '#38c838', w: '#fcfcfc', k: '#000000', o: '#fca044' }, nx - 2, ny - 18, 1.5);
          }
        });
        gfx.drawHudText(ctx, `КУРС: ${this.courses[this.courseIdx]}`, 24, 194, '#fcfcfc', '#000000', 10);
        gfx.drawHudText(ctx, `ВЫХОДОВ: ★${this.exits}/96  [START - ВХОД]`, 24, 210, '#fce000', '#000000', 9);
        return;
      }

      [[30, 114, 62, 58], [148, 102, 74, 70]].forEach(([hx, hy, hw, hh]) => {
        const rx = ((hx - Math.floor(this.scrollX * 0.4)) % 280 + 280) % 280 - 30;
        ctx.fillStyle = '#58b858';
        ctx.fillRect(rx, hy, hw, hh);
        ctx.strokeStyle = '#205020';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, hy, hw, hh);
        ctx.fillStyle = '#98e898';
        ctx.fillRect(rx + 10, hy + 12, 8, 8);
        ctx.fillRect(rx + 28, hy + 26, 8, 8);
      });

      ctx.fillStyle = '#38a838';
      ctx.fillRect(0, 172, W, 10);
      ctx.fillStyle = '#c8a050';
      ctx.fillRect(0, 182, W, 42);

      this.coins.forEach(c => {
        if (c.taken) return;
        const cx = Math.round(c.x - this.scrollX);
        ctx.fillStyle = '#fce000';
        ctx.fillRect(cx, c.y, 10, 14);
        ctx.fillStyle = '#fcfcfc';
        ctx.fillRect(cx + 2, c.y + 2, 3, 6);
      });

      this.koopas.forEach(k => {
        if (!k.alive) return;
        const kx = Math.round(k.x - this.scrollX);
        gfx.drawPixelSprite(ctx, ['.yy....', 'ykwgggg', '.gggggg', '..yy.yy'], { y: '#fce000', k: '#000000', w: '#fcfcfc', g: '#d82800' }, kx, k.y, 2.2);
      });

      const gx = Math.round(this.goalX - this.scrollX);
      if (gx < W + 30) {
        ctx.fillStyle = '#fcfcfc';
        ctx.fillRect(gx, 64, 6, 108);
        ctx.fillRect(gx + 28, 64, 6, 108);
        const tapeY = 110 + Math.sin(this.tick * 0.08) * 36;
        ctx.fillStyle = '#fce000';
        ctx.fillRect(gx + 6, tapeY, 22, 5);
      }

      const mx = Math.round(this.mario.x - this.scrollX);
      gfx.drawPixelSprite(ctx, SMW_SPRITES.yoshi_mario, { r: '#d82800', y: '#fce000', b: '#2038ec', s: '#fca044', g: '#38c838', w: '#fcfcfc', k: '#000000', o: '#fca044' }, mx, Math.round(this.mario.y), 2.4, this.mario.dir < 0);
      if (this.tongueTimer > 0) {
        ctx.fillStyle = '#d82800';
        ctx.fillRect(mx + (this.mario.dir > 0 ? 28 : -26), this.mario.y + 14, 26, 4);
      }

      gfx.renderFxList(ctx, this.fx, this.scrollX);

      gfx.drawHudText(ctx, `MARIO  ${String(this.score).padStart(6, '0')}   ${this.courses[this.courseIdx]}`, 8, 16, '#fcfcfc', '#000000', 9);

      if (this.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(28, 80, 200, 54);
        gfx.drawHudText(ctx, 'ПАУЗА — НАЖМИТЕ SELECT ДЛЯ КАРТЫ', 34, 110, '#fce000', '#000000', 9);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        courseIdx: this.courseIdx,
        score: this.score,
        exits: this.exits,
        hasYoshi: this.hasYoshi,
        hasCape: this.hasCape,
        cheatUnlocked: this.cheatUnlocked,
        mario: { ...this.mario }
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
    }
  }

  class TetrisGbCore {
    constructor(audio) {
      this.audio = audio;
      this.id = 'tetris';
      this.sys = 'gb';
      this.pal = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
      this.shapes = [
        [[1, 1, 1, 1]],
        [[2, 2], [2, 2]],
        [[0, 3, 0], [3, 3, 3]],
        [[4, 0, 0], [4, 4, 4]],
        [[0, 0, 5], [5, 5, 5]],
        [[0, 6, 6], [6, 6, 0]],
        [[7, 7, 0], [0, 7, 7]]
      ];
      this.reset();
    }

    reset() {
      this.mode = 'title';
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.heartMode = false;
      this.cheatUnlocked = false;
      this.dropCounter = 0;
      this.tick = 0;
      this.lastClearText = '';
      this.clearBannerTimer = 0;
      this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
      this.nextShape = this.shapes[0];
      this.spawnPiece();
    }

    spawnPiece() {
      const mat = this.nextShape || this.shapes[Math.floor(Math.random() * this.shapes.length)];
      this.nextShape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
      this.piece = {
        mat: mat.map(r => r.slice()),
        x: 3,
        y: 0
      };
      this.cur = this.piece;
      if (this.collides(this.piece.mat, this.piece.x, this.piece.y)) {
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
      }
    }

    startGame(heart = false) {
      this.heartMode = !!heart;
      this.mode = 'play';
    }

    collides(mat, px, py) {
      for (let r = 0; r < mat.length; r++) {
        for (let c = 0; c < mat[r].length; c++) {
          if (!mat[r][c]) continue;
          const nx = px + c;
          const ny = py + r;
          if (nx < 0 || nx >= 10 || ny >= 20) return true;
          if (ny >= 0 && this.board[ny][nx]) return true;
        }
      }
      return false;
    }

    getGhostY() {
      let gy = this.piece.y;
      while (!this.collides(this.piece.mat, this.piece.x, gy + 1)) {
        gy++;
      }
      return gy;
    }

    rotatePiece() {
      const m = this.piece.mat;
      const rot = m[0].map((_, i) => m.map(row => row[i]).reverse());
      const kicks = [0, -1, 1, -2, 2];
      for (const dx of kicks) {
        if (!this.collides(rot, this.piece.x + dx, this.piece.y)) {
          this.piece.mat = rot;
          this.piece.x += dx;
          if (this.audio) this.audio.sfx('jump');
          return;
        }
      }
    }

    activateCheat() {
      this.heartMode = true;
      this.cheatUnlocked = true;
      this.mode = 'play';
      if (this.audio) this.audio.sfx('cheat');
      return 'Режим Heart (Down + Start): скорость LEVEL ♥ +10!';
    }

    onButtonPress(btn, inputState) {
      if (this.mode === 'title') {
        if (btn === 'start') {
          if (inputState && inputState.down) {
            this.heartMode = true;
            this.cheatUnlocked = true;
            if (this.audio) this.audio.sfx('cheat');
          }
          this.mode = 'play';
        }
        return;
      }

      if (this.mode === 'play') {
        if (btn === 'left' && !this.collides(this.piece.mat, this.piece.x - 1, this.piece.y)) {
          this.piece.x--;
        } else if (btn === 'right' && !this.collides(this.piece.mat, this.piece.x + 1, this.piece.y)) {
          this.piece.x++;
        } else if (btn === 'a' || btn === 'b' || btn === 'up') {
          this.rotatePiece();
        } else if (btn === 'c') {
          while (!this.collides(this.piece.mat, this.piece.x, this.piece.y + 1)) {
            this.piece.y++;
            this.score += 2;
          }
          this.dropStep();
        } else if (btn === 'down') {
          this.dropStep();
        }
      }
    }

    dropStep() {
      if (!this.collides(this.piece.mat, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
      } else {
        this.piece.mat.forEach((row, r) => {
          row.forEach((v, c) => {
            if (v && this.piece.y + r >= 0 && this.piece.y + r < 20) {
              this.board[this.piece.y + r][this.piece.x + c] = v;
            }
          });
        });
        let cleared = 0;
        for (let r = 19; r >= 0; r--) {
          if (this.board[r].every(cell => cell > 0)) {
            this.board.splice(r, 1);
            this.board.unshift(Array(10).fill(0));
            cleared++;
            r++;
          }
        }
        if (cleared > 0) {
          this.lines += cleared;
          const mult = [0, 100, 300, 500, 1200][cleared] || 200;
          this.score += mult * (this.heartMode ? 2 : 1) * this.level;
          this.level = Math.min(20, 1 + Math.floor(this.lines / 5));
          this.lastClearText = cleared === 4 ? 'TETRIS!' : `${cleared} LINE${cleared > 1 ? 'S' : ''}`;
          this.clearBannerTimer = 40;
          if (this.audio) this.audio.sfx('lineClear');
        } else if (this.audio) {
          this.audio.sfx('hit');
        }
        this.spawnPiece();
      }
    }

    step(input) {
      this.tick++;
      if (this.clearBannerTimer > 0) this.clearBannerTimer--;
      if (this.mode !== 'play') return;
      this.dropCounter++;
      const interval = Math.max(3, (this.heartMode ? 9 : 22) - this.level);
      if (input.down || this.dropCounter >= interval) {
        this.dropCounter = 0;
        this.dropStep();
      }
    }

    drawMino(ctx, x, y, kind) {
      const g = this.pal;
      ctx.fillStyle = g[0];
      ctx.fillRect(x, y, 8, 8);
      ctx.fillStyle = (kind % 2 === 0) ? g[2] : g[1];
      ctx.fillRect(x + 1, y + 1, 6, 6);
      ctx.fillStyle = g[3];
      ctx.fillRect(x + 2, y + 2, 2, 2);
      if (kind === 2 || kind === 3) {
        ctx.fillStyle = g[0];
        ctx.fillRect(x + 3, y + 3, 2, 2);
      }
    }

    render(ctx) {
      const gfx = getGfx();
      const g = this.pal;
      ctx.fillStyle = g[3];
      ctx.fillRect(0, 0, W, H);

      if (this.mode === 'title') {
        ctx.fillStyle = g[1];
        ctx.fillRect(28, 18, 200, 54);
        ctx.fillStyle = g[3];
        ctx.fillRect(32, 22, 192, 46);
        gfx.drawHudText(ctx, 'TETRIS', 78, 52, g[0], g[2], 24);
        gfx.drawHudText(ctx, 'GAME BOY 1989 NINTENDO', 58, 84, g[0], null, 9);

        const spires = [
          '.......#.......',
          '......###......',
          '.......#.......',
          '.....#1#1#.....',
          '....#12#21#....',
          '..#..#1#1#..#..',
          '.###..###..###.',
          '..#...###...#..',
          '.#1#.#121#.#1#.',
          '#121##1#1##121#',
          '.###.#####.###.',
          '###############',
          '#.#.#1###1#.#.#',
          '###############'
        ];
        gfx.drawPixelSprite(ctx, spires, { '#': g[0], '1': g[1], '2': g[2] }, 56, 86, 6);

        gfx.drawHudText(ctx, 'Секрет: Удерживайте ВНИЗ + START', 34, 178, g[0], null, 9);
        gfx.drawHudText(ctx, 'для скоростного режима LEVEL ♥', 38, 192, g[1], null, 9);
        gfx.drawHudText(ctx, 'НАЖМИТЕ START', 86, 210, g[0], null, 10);
        return;
      }

      for (let by = 24; by < 200; by += 12) {
        ctx.fillStyle = g[2];
        ctx.fillRect(10, by, 36, 10);
        ctx.fillStyle = g[1];
        ctx.fillRect(12, by + 2, 14, 6);
        ctx.fillRect(28, by + 2, 14, 6);
      }
      const miniKremlin = [
        '...#...',
        '..###..',
        '.#1#1#.',
        '#######',
        '#.#.#.#',
        '#######'
      ];
      gfx.drawPixelSprite(ctx, miniKremlin, { '#': g[0], '1': g[1] }, 14, 26, 4);

      ctx.fillStyle = g[1];
      ctx.fillRect(54, 16, 10, 192);
      ctx.fillRect(144, 16, 10, 192);
      for (let y = 16; y < 208; y += 6) {
        ctx.fillStyle = g[0];
        ctx.fillRect(54, y, 10, 2);
        ctx.fillRect(144, y, 10, 2);
        ctx.fillStyle = g[2];
        ctx.fillRect(56, y + 2, 6, 2);
        ctx.fillRect(146, y + 2, 6, 2);
      }

      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          if (this.board[r][c]) {
            this.drawMino(ctx, 64 + c * 8, 24 + r * 8, this.board[r][c]);
          }
        }
      }

      const gy = this.getGhostY();
      this.piece.mat.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v) {
            ctx.strokeStyle = g[1];
            ctx.strokeRect(65 + (this.piece.x + c) * 8, 25 + (gy + r) * 8, 6, 6);
            this.drawMino(ctx, 64 + (this.piece.x + c) * 8, 24 + (this.piece.y + r) * 8, v);
          }
        });
      });

      ctx.fillStyle = g[2];
      ctx.fillRect(160, 20, 86, 40);
      ctx.fillRect(160, 66, 86, 48);
      ctx.fillRect(160, 120, 86, 52);
      ctx.strokeStyle = g[0];
      ctx.strokeRect(160, 20, 86, 40);
      ctx.strokeRect(160, 66, 86, 48);
      ctx.strokeRect(160, 120, 86, 52);

      gfx.drawHudText(ctx, 'SCORE', 168, 34, g[0], null, 9);
      gfx.drawHudText(ctx, String(this.score), 168, 50, g[0], null, 10);
      gfx.drawHudText(ctx, 'LEVEL', 168, 80, g[0], null, 9);
      gfx.drawHudText(ctx, `${this.level}${this.heartMode ? ' ♥' : ''}`, 168, 94, g[0], null, 10);
      gfx.drawHudText(ctx, `LINES: ${this.lines}`, 168, 108, g[0], null, 9);
      gfx.drawHudText(ctx, 'NEXT', 168, 134, g[0], null, 9);

      this.nextShape.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v) {
            this.drawMino(ctx, 178 + c * 8, 144 + r * 8, v);
          }
        });
      });

      const rocketY = Math.max(176, 196 - Math.min(20, Math.floor(this.score / 300)));
      gfx.drawPixelSprite(ctx, ['..#..', '.###.', '.#.#.', '#####', '.#.#.'], { '#': g[0] }, 196, rocketY, 2);

      if (this.clearBannerTimer > 0) {
        gfx.drawHudText(ctx, this.lastClearText, 76, 18, g[0], null, 10);
      }
    }

    serializeState() {
      return {
        mode: this.mode,
        score: this.score,
        lines: this.lines,
        level: this.level,
        heartMode: this.heartMode,
        cheatUnlocked: this.cheatUnlocked,
        board: this.board.map(r => r.slice())
      };
    }

    restoreState(st) {
      if (!st) return;
      Object.assign(this, st);
      if (st.board) this.board = st.board.map(r => r.slice());
    }
  }

  if (typeof window !== 'undefined') {
    window.Emu16BitCores = {
      sonic2: Sonic2Core,
      umk3: Umk3Core,
      comixzone: ComixZoneCore,
      smw: SuperMarioWorldCore,
      tetris: TetrisGbCore
    };
  }
})();
