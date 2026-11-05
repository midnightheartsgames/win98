(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, TS, C } = H.UI_CONST;
  const PX = 188, PY = 40, PW = 440;
  const ROW = 46;
  const TAG_INFO = {
    clean: { name: 'Уют и уборка', col: '#e87898' },
    stock: { name: 'Учёт и склад', col: '#58b8e8' },
    tech: { name: 'Ремонт и быт', col: '#f0b848' },
    all: { name: 'Координация', col: '#a890f0' }
  };
  let previewMap = null;

  function getPreviewMap(g) {
    const def = H.MAPS.express_room;
    if (!previewMap) {
      const w = Math.max(...def.rows.map(r => r.length)), h = def.rows.length, tiles = [];
      for (let y = 0; y < h; y++) {
        const row = [];
        for (let x = 0; x < w; x++) {
          const ch = def.rows[y][x] || '#';
          if (H.TILES[ch]) { row.push(ch); continue; }
          const mk = def.marks[ch];
          if (mk && mk.tile) { row.push(mk.tile); continue; }
          let fl = def.floor || '.';
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nc = def.rows[y + dy] && def.rows[y + dy][x + dx], nt = H.TILES[nc];
            if (nt && nt.walk && nc !== '^' && nc !== 'v' && nc !== 'D') { fl = nc; break; }
          }
          row.push(fl);
        }
        tiles.push(row);
      }
      previewMap = { id: 'express_room', def, w, h, tiles, ents: [], outside: 'herta' };
    }
    previewMap.outside = g.expressWorld ? g.expressWorld().id : 'herta';
    return previewMap;
  }

  function drawRoomPreview(ui, c, cam) {
    const g = ui.game, m = getPreviewMap(g), ox = ui.ox ? ui.ox() : 0, lx = ui.left || 0, rx = ui.right || W, vw = ui.vw || W;
    const mw = m.w * TS, mh = m.h * TS;
    const tx = (cam ? cam[0] : 18) * TS + 16, ty = (cam ? cam[1] : 8) * TS + 16;
    let cx = tx - W / 2, cy = ty - HGT / 2;
    cx = mw <= vw ? (mw - W) / 2 : Math.max(ox, Math.min(mw - W - ox, cx));
    cy = mh <= HGT ? (mh - HGT) / 2 : Math.max(0, Math.min(mh - HGT, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    c.save(); c.translate(lx, 0); G.drawMap(c, m, cx - ox, cy, ui.t, vw, HGT); c.restore();
    const draws = [], L = G.mapLayer(m);
    for (const s of L.sprites || []) {
      if (s.if && !g.cond(s.if)) continue;
      const sx = s.x * TS - cx, sy = s.y * TS - cy;
      if (sx > rx + 32 || sy > HGT + 32 || sx + s.w * TS < lx - 32 || sy + s.h * TS < -32) continue;
      draws.push({ y: s.sort, fn: () => H.Train.drawSprite(c, s, sx, sy, ui.t) });
    }
    draws.sort((a, b) => a.y - b.y);
    for (const d of draws) d.fn();
    if (L.deco) { c.save(); c.translate(lx, 0); H.Train.drawFx(c, L, m, cx - ox, cy, ui.t, vw, HGT, x => g.cond(x)); c.restore(); }
  }

  function drawZoneIcon(c, icon, cx, cy, col) {
    const x = Math.round(cx), y = Math.round(cy);
    c.fillStyle = col;
    if (icon === 'bed') {
      c.fillRect(x - 7, y - 4, 3, 9);
      c.fillRect(x - 4, y + 1, 11, 3);
      c.fillRect(x + 5, y - 1, 2, 6);
      c.fillRect(x - 3, y - 2, 4, 2);
      c.fillRect(x + 2, y - 1, 4, 2);
    } else if (icon === 'bath') {
      c.fillRect(x - 7, y, 14, 4);
      c.fillRect(x - 5, y + 4, 10, 2);
      c.fillRect(x - 6, y - 4, 2, 4);
      c.fillRect(x - 6, y - 5, 4, 2);
      c.fillRect(x + 2, y - 3, 3, 2);
    } else if (icon === 'door') {
      c.fillRect(x - 5, y - 6, 10, 12);
      c.fillStyle = '#181420';
      c.fillRect(x - 3, y - 4, 6, 8);
      c.fillStyle = col;
      c.fillRect(x + 1, y - 1, 2, 2);
    } else if (icon === 'cup') {
      c.fillRect(x - 5, y - 3, 9, 7);
      c.fillRect(x + 4, y - 2, 2, 4);
      c.fillRect(x - 6, y + 5, 11, 2);
      c.fillRect(x - 3, y - 6, 1, 2);
      c.fillRect(x + 1, y - 6, 1, 2);
    } else if (icon === 'pad') {
      c.fillRect(x - 7, y - 3, 14, 6);
      c.fillRect(x - 6, y + 3, 3, 2);
      c.fillRect(x + 3, y + 3, 3, 2);
      c.fillStyle = '#181420';
      c.fillRect(x - 5, y - 1, 3, 1);
      c.fillRect(x - 4, y - 2, 1, 3);
      c.fillRect(x + 3, y - 1, 1, 1);
      c.fillRect(x + 5, y - 2, 1, 1);
    } else {
      c.fillRect(x - 6, y - 5, 3, 10);
      c.fillRect(x - 2, y - 5, 3, 10);
      c.fillRect(x + 2, y - 4, 4, 9);
      c.fillRect(x - 7, y + 5, 14, 1);
    }
  }

  function drawHex(c, cx, cy, r, fill, stroke, lw) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); c.lineWidth = 1; }
  }

  function drawFundIcon(c, cx, cy, r) {
    c.fillStyle = '#24345a';
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f2dc9a'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, r - 1, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#ffd868';
    c.beginPath();
    c.moveTo(cx, cy - r + 2); c.lineTo(cx + 2, cy - 2); c.lineTo(cx + r - 2, cy);
    c.lineTo(cx + 2, cy + 2); c.lineTo(cx, cy + r - 2); c.lineTo(cx - 2, cy + 2);
    c.lineTo(cx - r + 2, cy); c.lineTo(cx - 2, cy - 2);
    c.closePath(); c.fill();
  }

  function drawFundCounter(c, ui, x, y, val, dark) {
    const digits = String(Math.max(0, Math.min(9999999, Math.floor(val || 0)))).padStart(7, '0').split('');
    drawFundIcon(c, x + 10, y + 10, 8);
    let dx = x + 24;
    digits.forEach((d, i) => {
      c.fillStyle = dark ? 'rgba(16,18,32,0.85)' : 'rgba(255,250,236,0.92)';
      c.fillRect(dx, y, 16, 20);
      c.strokeStyle = dark ? 'rgba(201,164,92,0.45)' : 'rgba(160,130,76,0.45)';
      c.strokeRect(dx + 0.5, y + 0.5, 15, 19);
      if (i < 6) {
        c.fillStyle = dark ? 'rgba(201,164,92,0.25)' : 'rgba(120,96,50,0.2)';
        c.fillRect(dx + 16, y + 3, 1, 14);
      }
      const leadZero = d === '0' && digits.slice(0, i + 1).every(ch => ch === '0') && i < 6;
      ui.text(d, dx + 8, y + 3, { align: 'center', size: 12, bold: true, col: dark ? (leadZero ? '#6e728a' : '#f6ecd4') : (leadZero ? '#9a907c' : '#3a2e1e'), shadow: dark });
      dx += 18;
    });
  }

  function drawWrenchIcon(c, cx, cy, col) {
    const x = Math.round(cx), y = Math.round(cy);
    c.strokeStyle = col; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 6, y + 6); c.lineTo(x + 5, y - 5);
    c.moveTo(x - 5, y - 5); c.lineTo(x + 6, y + 6);
    c.stroke(); c.lineWidth = 1;
    c.fillStyle = col;
    c.fillRect(x + 2, y - 7, 5, 4);
    c.fillRect(x - 7, y - 7, 4, 5);
  }

  function drawItemThumb(c, slotId, item, x, y, w, h) {
    const cx = Math.round(x + w / 2), cy = Math.round(y + h / 2 - 4), col = item.col || '#d89a34';
    const gr = c.createRadialGradient(cx, cy, 2, cx, cy, 24);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(20,20,30,0)');
    c.save();
    c.globalAlpha = 0.25; c.fillStyle = gr; c.fillRect(x + 2, y + 2, w - 4, h - 18);
    c.restore();
    if (slotId === 'pillow') {
      c.fillStyle = '#3a3634'; c.fillRect(cx - 14, cy - 10, 28, 22);
      c.fillStyle = '#f4f0e6'; c.fillRect(cx - 12, cy - 8, 24, 18);
      c.fillStyle = col; c.fillRect(cx - 12, cy - 8, 12, 10);
      c.fillStyle = '#2d2926'; c.fillRect(cx - 12, cy + 2, 24, 8);
    } else if (slotId === 'tub' || slotId === 'vanity' || slotId === 'towel' || slotId === 'bathmat') {
      c.fillStyle = '#d8e4ec'; c.fillRect(cx - 14, cy - 6, 28, 16);
      c.fillStyle = col; c.beginPath(); c.arc(cx, cy - 2, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(cx - 5, cy - 6, 4, 3);
    } else if (slotId === 'pcdesk' || slotId === 'arcade' || slotId === 'neon') {
      c.fillStyle = '#1e2234'; c.fillRect(cx - 14, cy - 10, 28, 20);
      c.fillStyle = col; c.fillRect(cx - 11, cy - 7, 22, 14);
      c.fillStyle = '#ffffff'; c.fillRect(cx - 8, cy - 4, 8, 2);
    } else if (slotId === 'fridge' || slotId === 'minibar' || slotId === 'buffet' || slotId === 'island') {
      c.fillStyle = '#5c3b24'; c.fillRect(cx - 14, cy + 4, 28, 6);
      c.fillStyle = col; c.beginPath(); c.arc(cx, cy - 2, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff8e8'; c.fillRect(cx - 6, cy - 8, 12, 4);
    } else {
      c.fillStyle = '#4a3422'; c.fillRect(cx - 13, cy - 9, 26, 20);
      c.fillStyle = col; c.fillRect(cx - 10, cy - 6, 20, 14);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(cx - 7, cy - 3, 8, 4);
    }
  }

  function drawTrophyArt(c, g, id, cx, cy) {
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath(); c.ellipse(cx, cy + 32, 34, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a3444'; c.fillRect(cx - 26, cy + 22, 52, 10);
    c.fillStyle = '#d2ac64'; c.fillRect(cx - 28, cy + 20, 56, 3);
    const L = G.mapLayer(getPreviewMap(g));
    const sp = L && L.sprites && L.sprites.find(s => s.k === 'rm_trophy' && s.if && s.if.endsWith('_' + id));
    if (sp && sp.cv) {
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(sp.cv, Math.round(cx - sp.cv.width * 2), Math.round(cy + 22 - sp.cv.height * 4), sp.cv.width * 4, sp.cv.height * 4);
      c.imageSmoothingEnabled = was;
    }
  }

  function header(c, ui, x, y, w, h) {
    const bg = c.createLinearGradient(0, y, w, y + h);
    bg.addColorStop(0, '#1e162e'); bg.addColorStop(0.55, '#3a2638'); bg.addColorStop(1, '#6a4834');
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    c.fillStyle = '#0c1228'; c.fillRect(x + w - 210, y + 8, 124, 52);
    c.strokeStyle = '#d2ac64'; c.strokeRect(x + w - 210.5, y + 7.5, 125, 53);
    for (let i = 0; i < 24; i++) {
      c.fillStyle = i % 3 ? '#dce8ff' : '#fff4c8';
      c.fillRect(x + w - 206 + Math.floor(G.hash(i, 3, 19) * 116), y + 12 + Math.floor(G.hash(i, 7, 19) * 44), 1, 1);
    }
    c.fillStyle = '#4e3222'; c.fillRect(x, y + h - 24, w, 24);
    c.fillStyle = '#d2ac64'; c.fillRect(x, y + h - 25, w, 2);
    if (H.POM_OUTFITS && H.POM_OUTFITS.chef) {
      G.drawPortrait(c, H.pomOutfitLook('chef'), x + w - 82, y + 10, 74);
    } else if (H.SPEAKERS.pompom) {
      G.drawPortrait(c, H.SPEAKERS.pompom.look, x + w - 82, y + 10, 74);
    }
    c.fillStyle = C.brass; c.fillRect(x, y + h, w, 1);
    ui.text('Идеи декора для космического дома', x + 12, y + 10, { size: 18, bold: true, serif: true, col: '#fff4d8' });
    ui.text('Комната Первопроходца · Постоянное событие', x + 12, y + 34, { size: 11, bold: true, col: C.gold });
    ui.text('Обустройте 6 зон на втором этаже Вагона для вечеринок и получите 4★ персонажа и наряд Пом-Пом.', x + 12, y + 54, { size: 10, col: '#e4d8c8' });
  }

  function starGiveList(m) {
    const out = [['jade', m.jade]];
    if (m.aether) out.push(['aether2', m.aether]);
    if (m.log) out.push(['exp2', m.log]);
    if (m.credits) out.push(['credits', m.credits]);
    return out;
  }

  if (G.ITEM_ART) {
    G.ITEM_ART.cosmic_home = function (p) {
      const { thick, star4 } = G.iconHelp;
      const orbit = (a0, a1, col, w) => {
        const pts = [], c = Math.cos(-0.18), s = Math.sin(-0.18);
        for (let i = 0; i <= 14; i++) {
          const a = a0 + (a1 - a0) * i / 14, x = Math.cos(a) * 14, y = Math.sin(a) * 4.8;
          pts.push(16 + x * c - y * s, 21.6 + x * s + y * c);
        }
        thick(p, col, pts, w);
      };
      orbit(Math.PI * 0.96, Math.PI * 2.04, '#1e3888', 2.4);
      orbit(Math.PI * 1.0, Math.PI * 2.0, '#68c8ff', 1.2);
      p.rect('#6a1824', 19.6, 4.2, 3.6, 7.2);
      p.rect('#b82e3e', 19.6, 4.2, 2, 7.2);
      p.rect('#f2d478', 19, 3.6, 4.8, 1.5);
      p.poly('#3a1824', [5.8, 13.4, 16, 6, 26.2, 13.4, 26.2, 23.6, 16, 25.4, 5.8, 25]);
      p.poly('#f8f1e4', [6.6, 13.4, 16, 6.8, 25.4, 13.4, 25.4, 23.2, 16, 24.8, 6.6, 24.4]);
      p.poly('#dfd2bc', [19.4, 9.2, 25.4, 13.4, 25.4, 23.2, 19.4, 24.4]);
      p.poly('#4a101c', [2.2, 15, 16, 3, 29.8, 15, 27.2, 17.4, 16, 8.2, 4.8, 17.4]);
      p.poly('#d83246', [3, 14.4, 16, 3.4, 16, 7.8, 5, 16.6]);
      p.poly('#ff7888', [3.6, 13.8, 16, 3.4, 16, 5.2, 4.8, 14.8]);
      p.poly('#a41e30', [16, 3.4, 29, 14.4, 27, 16.6, 16, 7.8]);
      p.poly('#f4d678', [4.4, 15.6, 16, 6.4, 27.6, 15.6, 26.8, 16.8, 16, 8, 5.2, 16.8]);
      p.ell('#c89238', 16, 11.8, 2.7, 2.7);
      p.ell('#162258', 16, 11.8, 1.8, 1.8);
      p.ell('#8ce4ff', 15.5, 11.3, 0.9, 0.9);
      p.rect('#5a301e', 8.4, 16.2, 5.6, 8.2);
      p.rect('#a4522c', 9.2, 17, 4, 7.4);
      p.rect('#c86e3e', 9.2, 17, 1.8, 7.4);
      p.ell('#ffd868', 12.2, 20.8, 0.9, 0.9);
      p.rect('#3a2438', 15.2, 15.2, 8.2, 6.4);
      p.rect('#ffb838', 16.2, 16.2, 6.4, 5);
      p.rect('#fff4b8', 16.2, 16.2, 2.8, 2);
      p.rect('#5a3428', 19, 16.2, 1, 5);
      p.rect('#5a3428', 16.2, 18.2, 6.4, 0.8);
      p.rect('#c89238', 14.8, 21.2, 9, 1.4);
      orbit(-0.04, Math.PI * 1.04, '#1e3888', 2.8);
      orbit(0.02, Math.PI * 0.98, '#70d0ff', 1.6);
      orbit(0.24, Math.PI * 0.76, '#e8fcff', 0.9);
      star4(p, '#ffffff', 5.5, 5.5, 3.6, 0.95);
      star4(p, '#ffe888', 27.5, 4.5, 2.8, 0.7);
    };
  }

  const TAB = {
    id: 'cosmic_home', title: 'Космический дом', icon: 'cosmic_home', page: 'cosmicHomePage',
    done: g => H.ROOM_REWARDS.stars.every(m => g.room().starGot.includes(m.stars)) && H.ROOM_REWARDS.logs.every(m => g.room().logGot.includes(m.count)) && !!g.room().charGot,
    sub: g => g.roomOpen() ? 'Звёзд: ' + g.roomStars() + '/30★' : 'Ранний доступ',
    key(ui, scr, k) {
      const n = H.ROOM_REWARDS.stars.length + 2;
      if (k === 'up' || k === 'down') { scr.pick = (scr.pick + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
      if (k === 'ok') ui.cosmicHomePick(scr, scr.pick);
    }
  };
  if (H.EVENT_TABS && !H.EVENT_TABS.some(t => t.id === TAB.id)) H.EVENT_TABS.push(TAB);

  Object.assign(H.UI.prototype, {
    cosmicHomePick(scr, i) {
      const g = this.game, MS = H.ROOM_REWARDS.stars, n = MS.length;
      scr.pick = i;
      if (i === n) {
        if (g.roomOpen() || g.state.flags.ending || g.state.flags.room_early) this.openRoomEvent('hub');
        else if (g.roomEarlyReady()) this.openRoomEarly();
        else this.sfx('deny');
        return;
      }
      if (i === n + 1) {
        this.openRoomEvent('charpick');
        return;
      }
      if (scr.report(g.claimRoomStar(MS[i].stars))) return;
      const m = MS[i];
      this.toast(g.room().starGot.includes(m.stars) ? 'Эта награда уже получена.' : !g.roomOpen() ? 'Откройте событие после главы «Ярило-VI» или по кнопке «Ранний доступ».' : 'Нужно достичь ' + m.stars + '/30★ обустройства комнаты.');
    },

    cosmicHomePage(c, scr) {
      const g = this.game, eb = this.eventBox ? this.eventBox() : { px: PX, py: PY, pw: PW, wide: false };
      const hx = eb.px + 4, hy = eb.py + 4, hw = eb.pw - 8, hh = 76;
      header(c, this, hx, hy, hw, hh);
      const MS = H.ROOM_REWARDS.stars, n = MS.length, sy = hy + hh + 6;
      const open = g.roomOpen() || g.state.flags.ending || g.state.flags.room_early;
      if (!open) {
        this.text('Откроется после главы «Ярило-VI» или по раннему доступу.', hx + 8, sy + 2, { size: 11, bold: true, col: C.cream });
        this.text('Лестница в Вагоне для вечеринок ведёт в вашу будущую комнату.', hx + 8, sy + 17, { size: 10, col: C.sub });
        this.button(hx + hw - 246, sy + 2, 108, 26, 'Персонаж 4★', () => this.cosmicHomePick(scr, n + 1), { active: scr.pick === n + 1, size: 10 });
        this.button(hx + hw - 132, sy + 2, 128, 26, 'Ранний доступ', () => this.cosmicHomePick(scr, n), { active: scr.pick === n, bold: true, size: 11 });
      } else {
        const q = g.state.quests.room_home;
        const status = !g.roomOpen() ? 'Поднимитесь по лестнице в Вагоне для вечеринок!' : q && q !== 'done' ? g.questStep('room_home').text : 'Обустроено: ' + g.roomStars() + '/30★ · Фонд: ' + H.fmt(g.room().fund);
        this.text('Прогресс обустройства: ' + g.roomStars() + '/30★ · Журнал: ' + g.room().logs + '/12', hx + 8, sy + 2, { size: 11, bold: true, col: C.gold });
        this.text(this.fitText ? this.fitText(status, 10, hw - 260) : status, hx + 8, sy + 17, { size: 10, col: C.sub });
        this.button(hx + hw - 252, sy + 2, 108, 26, g.room().charGot ? 'Герой выбран' : 'Персонаж 4★', () => this.cosmicHomePick(scr, n + 1), { active: scr.pick === n + 1, size: 10 });
        if (g.roomCharReady()) this.badge(hx + hw - 148, sy + 4);
        this.button(hx + hw - 138, sy + 2, 134, 26, 'План обустройства', () => this.cosmicHomePick(scr, n), { active: scr.pick === n, bold: true, size: 10 });
      }
      MS.forEach((m, i) => {
        const y = sy + 34 + i * ROW, on = scr.pick === i, got = g.room().starGot.includes(m.stars), ready = g.roomStarReady(m.stars);
        c.fillStyle = on ? 'rgba(80,90,170,0.45)' : 'rgba(20,24,60,0.6)'; c.fillRect(hx, y, hw, ROW - 4);
        c.fillStyle = on ? C.brassHi : '#3a4070'; c.fillRect(hx, y, 3, ROW - 4);
        this.text('★ ' + m.stars + '/30 · ' + m.title, hx + 10, y + 5, { size: 11, bold: true, col: on ? C.gold : C.cream });
        this.text('Обустроить предметы мебели до ' + m.stars + '★', hx + 10, y + 22, { size: 9, col: C.sub });
        let rx = hx + (eb.wide ? 280 : 196);
        if (m.pom) { this.pomCell(c, m.pom, rx, y + 4, 34); rx += 38; }
        for (const [id, cnt] of starGiveList(m)) { this.rewardCell(c, id, cnt, rx, y + 4, 34); rx += 38; }
        if (got) this.stamp(hx + hw - 42, y + 21, 'ЕСТЬ');
        else if (ready) {
          if (eb.wide) this.button(hx + hw - 104, y + 8, 92, 24, 'Получить', () => this.cosmicHomePick(scr, i), { active: on, bold: true, size: 10 });
          else this.badge(hx + hw - 14, y + 10);
        } else if (eb.wide) {
          this.text(g.roomStars() + '/' + m.stars + '★', hx + hw - 16, y + 14, { align: 'right', size: 10, col: C.dim });
        }
        this.hit(hx, y, hw, ROW - 4, () => this.cosmicHomePick(scr, i));
      });
    },

    openRoomEarly() {
      const ui = this, g = this.game;
      this.push({
        sel: 0,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 230, y = 126, w = 460, h = 216;
          ui.win(x, y, w, h, { title: 'Ранний доступ: Космический дом' });
          const lines = [
            'Миссия приключений и постоянное событие «Идеи декора для космического дома» откроются прямо сейчас, не дожидаясь завершения главы «Ярило-VI».',
            'Пом-Пом пришлёт сообщение в Семейный чат, а винтовая лестница в Вагоне для вечеринок откроет вход в вашу личную комнату на втором этаже.',
            'Вы также сможете сразу открыть «План обустройства» из окна событий.'
          ];
          let ly = y + 28;
          for (const t of lines) for (const l of ui.wrap(t, w - 40, 11)) { ui.text(l, x + 20, ly, { size: 11, col: C.cream }); ly += 15; }
          ui.button(x + 46, y + h - 44, 168, 28, 'Открыть сейчас', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, bold: true });
          ui.button(x + w - 214, y + h - 44, 168, 28, 'Не сейчас', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') {
            ui.screens.pop();
            if (this.sel === 0 && g.roomStartEarly()) {
              g.state.flags.room_open = true;
              g.state.flags.room_grant_1 = true;
              g.roomSyncGrants();
              ui.sfx('levelup');
              ui.toast('Лестница на второй этаж Вагона для вечеринок открыта!');
            } else ui.sfx('cancel');
          }
        }
      });
    },

    openUi_roomevent(p) {
      return this.openRoomEvent((p && p.mode) || 'hub', () => this.finishPending());
    },

    openRoomEvent(startMode, done) {
      const ui = this, g = this.game;
      if (g.guest) {
        ui.sfx('select');
        ui.toast('Комната Первопроходца обустроена на ' + g.roomStars() + '/30★.');
        if (done) done();
        return null;
      }
      g.roomSyncGrants();
      g.roomQuestSync();
      const firstZone = Math.max(0, H.ROOM_ZONES.findIndex(z => g.roomZoneStars(z.id) < 5));
      return this.push({
        full: true,
        roomEvent: true,
        mode: startMode || 'hub',
        sel: 0,
        zIdx: firstZone >= 0 ? firstZone : 0,
        bIdx: 0,
        sIdx: 0,
        iIdx: 0,
        pIdx: 0,
        cIdx: 0,
        lIdx: 0,
        rIdx: 0,
        chIdx: 0,
        hop: 0,
        sayIdx: 0,
        lastShift: null,
        sparks: [],
        onClose() { if (done) done(); },
        zone() { return H.ROOM_ZONES[this.zIdx] || H.ROOM_ZONES[0]; },
        zoneSlots() { return H.ROOM_SLOTS.filter(s => s.zone === this.zone().id); },
        curSlot() { const list = this.zoneSlots(); return list[Math.min(this.sIdx, Math.max(0, list.length - 1))] || H.ROOM_SLOTS[0]; },
        setMode(m) {
          this.mode = m;
          this.sel = 0;
          if (m === 'checklist') {
            const builds = g.roomZoneBuilds(this.zone().id), next = g.roomNextBuild(this.zone().id);
            this.bIdx = next ? Math.max(0, builds.findIndex(b => b.id === next.id)) : 0;
          } else if (m === 'decor') {
            this.sIdx = 0;
            const sl = this.curSlot(), cur = g.roomSlotItem(sl.id);
            this.iIdx = Math.max(0, sl.items.findIndex(it => it.id === cur));
          } else if (m === 'duty') {
            this.cIdx = 0;
          }
          ui.sfx('select');
        },
        setZone(idx) {
          const n = H.ROOM_ZONES.length;
          this.zIdx = (idx + n) % n;
          this.sIdx = 0;
          if (this.mode === 'checklist') {
            const builds = g.roomZoneBuilds(this.zone().id), next = g.roomNextBuild(this.zone().id);
            this.bIdx = next ? Math.max(0, builds.findIndex(b => b.id === next.id)) : 0;
          } else if (this.mode === 'decor') {
            const sl = this.curSlot(), cur = g.roomSlotItem(sl.id);
            this.iIdx = Math.max(0, sl.items.findIndex(it => it.id === cur));
          }
          ui.sfx('select');
        },
        setSlot(idx) {
          const list = this.zoneSlots();
          if (!list.length) return;
          this.sIdx = (idx + list.length) % list.length;
          const sl = this.curSlot(), cur = g.roomSlotItem(sl.id);
          this.iIdx = Math.max(0, sl.items.findIndex(it => it.id === cur));
          ui.sfx('select');
        },
        doBuild(b) {
          if (!b) return;
          if (g.room().built.includes(b.id)) {
            if (b.slot) {
              const slots = this.zoneSlots(), si = slots.findIndex(s => s.id === b.slot);
              if (si >= 0) { this.setMode('decor'); this.setSlot(si); return; }
            }
            ui.sfx('select');
            ui.toast('Предмет «' + b.name + '» уже установлен в комнате.');
            return;
          }
          const next = g.roomNextBuild(b.zone);
          if (!next || next.id !== b.id) {
            ui.sfx('deny');
            ui.toast('Сначала установите предыдущий предмет в этой зоне: «' + (next ? next.name : '') + '».');
            return;
          }
          if (g.room().fund < b.cost) {
            ui.sfx('deny');
            ui.toast('Не хватает средств Фонда Экспресса (' + H.fmt(b.cost) + '). Выйдите на дежурство!');
            return;
          }
          if (g.buildRoomItem(b.id)) {
            ui.sfx('chest');
            for (let i = 0; i < 14; i++) {
              const a = i / 14 * Math.PI * 2;
              this.sparks.push({ x: 240 + Math.cos(a) * (30 + (i % 3) * 18), y: 230 + Math.sin(a) * (24 + (i % 2) * 14), t: 0 });
            }
            const zStars = g.roomZoneStars(b.zone);
            ui.toast('Установлено: «' + b.name + '»! Зона «' + this.zone().name + '»: ' + zStars + '/5★.');
            const nb = g.roomNextBuild(b.zone), builds = g.roomZoneBuilds(b.zone);
            if (nb) this.bIdx = Math.max(0, builds.findIndex(x => x.id === nb.id));
          }
        },
        doPlaceDecor() {
          const sl = this.curSlot(), it = sl && sl.items[this.iIdx];
          if (!sl || !it) return;
          if (!g.roomSlotUnlocked(sl.id)) {
            const needBuild = H.ROOM_BUILDS.find(b => b.id === sl.build);
            ui.sfx('deny');
            ui.toast('Сначала постройте в чек-листе: «' + (needBuild ? needBuild.name : sl.name) + '».');
            return;
          }
          if (g.roomSlotItem(sl.id) === it.id) {
            ui.sfx('select');
            ui.toast('Вариант «' + it.name + '» уже размещён.');
            return;
          }
          if (g.setRoomDecor(sl.id, it.id)) {
            ui.sfx('confirm');
            for (let i = 0; i < 10; i++) {
              const a = i / 10 * Math.PI * 2;
              this.sparks.push({ x: 300 + Math.cos(a) * 36, y: 210 + Math.sin(a) * 24, t: 0 });
            }
            ui.toast('Размещено: «' + it.name + '» (' + sl.name + ').');
          }
        },
        tick(dt) {
          if (this.hop > 0) this.hop = Math.max(0, this.hop - dt * 2.4);
          for (const s of this.sparks) s.t += dt;
          this.sparks = this.sparks.filter(s => s.t < 0.65);
        },
        drawSparks(c) {
          for (const s of this.sparks) {
            const k = 1 - s.t / 0.65, r = 4 + k * 5;
            c.save(); c.globalAlpha = k; c.fillStyle = '#fff4c8';
            c.beginPath();
            c.moveTo(s.x, s.y - s.t * 26 - r); c.lineTo(s.x + r * 0.3, s.y - s.t * 26 - r * 0.3);
            c.lineTo(s.x + r, s.y - s.t * 26); c.lineTo(s.x + r * 0.3, s.y - s.t * 26 + r * 0.3);
            c.lineTo(s.x, s.y - s.t * 26 + r); c.lineTo(s.x - r * 0.3, s.y - s.t * 26 + r * 0.3);
            c.lineTo(s.x - r, s.y - s.t * 26); c.lineTo(s.x - r * 0.3, s.y - s.t * 26 - r * 0.3);
            c.closePath(); c.fill();
            c.restore();
          }
        },
        drawHub(c) {
          const r = g.room(), stars = g.roomStars(), ox = ui.left || 0, vw = ui.vw || W;
          const sky = c.createLinearGradient(ox, 0, ox + vw, HGT);
          sky.addColorStop(0, '#070b22'); sky.addColorStop(0.55, '#172048'); sky.addColorStop(1, '#2e294e');
          c.fillStyle = sky; c.fillRect(ox, 0, vw, HGT);
          for (let i = 0; i < 72; i++) {
            c.fillStyle = i % 4 ? 'rgba(220,234,255,0.75)' : '#fff4c8';
            c.fillRect(ox + Math.floor(G.hash(i, 4, 13) * vw), Math.floor(G.hash(i, 9, 13) * HGT), i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
          }
          c.save();
          const orb = c.createRadialGradient(540, 240, 40, 520, 240, 310);
          orb.addColorStop(0, 'rgba(236,214,158,0.42)'); orb.addColorStop(0.65, 'rgba(184,154,96,0.22)'); orb.addColorStop(1, 'rgba(40,32,60,0)');
          c.fillStyle = orb; c.beginPath(); c.arc(540, 240, 300, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(242,220,154,0.28)';
          c.beginPath(); c.arc(540, 240, 250, 0, Math.PI * 2); c.stroke();
          c.restore();

          ui.plate(12, 10, 'Идеи декора для космического дома');
          ui.button(W - 114, 10, 76, 22, 'Правила', () => this.setMode('rules'), { size: 10, icon: 'guide' });
          ui.closeBtn(W - 32, 10, () => ui.pop());

          const px = 204, py = 396, lift = Math.sin(this.hop * Math.PI) * 14, bob = Math.round(Math.sin(ui.t * 2.5) * 1.5);
          c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.ellipse(px, py + 4, 68, 12, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(242,220,154,0.45)'; c.beginPath(); c.ellipse(px, py + 4, 82, 16, 0, 0, Math.PI * 2); c.stroke();
          G.drawFigure(c, H.pomOutfitLook(g.pomWorn ? g.pomWorn() : 'uniform'), px, py - lift + bob, 4);
          ui.hit(px - 68, 120, 136, 286, () => { this.hop = 1; this.sayIdx = (this.sayIdx + 1) % 3; ui.sfx('select'); });

          const lines = [
            stars >= 30 ? 'Все шесть зон сияют чистотой, пом! Загляни в Заказать декор, чтобы менять детали в любое время!' : 'Выполняй дежурства и пополняй Фонд Экспресса, чтобы обустроить все шесть зон комнаты, пом!',
            'Каждая смена дежурства открывает новую вечернюю историю с друзьями в Журнале дежурств!',
            'На 10★ обустройства тебя ждёт подарок новоселья: любой 4★ персонаж на выбор, пом!'
          ];
          const bubbleLines = ui.wrap(lines[this.sayIdx % lines.length], 224, 10).slice(0, 3);
          const bw = 240, bh = bubbleLines.length * 13 + 12, bx = 84, by = 52;
          c.fillStyle = 'rgba(18,20,42,0.9)'; c.fillRect(bx, by, bw, bh);
          c.strokeStyle = C.brass; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
          bubbleLines.forEach((l, i) => ui.text(l, bx + 8, by + 6 + i * 13, { size: 10, col: C.cream }));

          const charReady = g.roomCharReady(), charGot = !!r.charGot;
          const rewReady = H.ROOM_REWARDS.stars.some(m => g.roomStarReady(m.stars)) || H.ROOM_REWARDS.logs.some(m => g.roomLogReady(m.count));
          [[46, 312, 'Персонаж', 'в награду', 'charpick', charReady, charGot, 4], [46, 392, 'Награды', 'события', 'rewards', rewReady, false, 5]].forEach(([cx, cy, l1, l2, m, ready, doneMark, idx]) => {
            const on = this.sel === idx;
            c.fillStyle = '#0c1028'; c.beginPath(); c.arc(cx, cy, 27, 0, Math.PI * 2); c.fill();
            const g2 = c.createRadialGradient(cx, cy - 6, 4, cx, cy, 26);
            g2.addColorStop(0, on ? '#5e4c28' : '#2e3468'); g2.addColorStop(1, '#141838');
            c.fillStyle = g2; c.beginPath(); c.arc(cx, cy, 25, 0, Math.PI * 2); c.fill();
            c.strokeStyle = on ? C.brassHi : C.brass; c.lineWidth = on ? 2 : 1.5;
            c.beginPath(); c.arc(cx, cy, 25, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
            G.menuIcon(c, m === 'charpick' ? 'team' : 'events', cx - 11, cy - 17, 22, '#ffe8a8');
            c.fillStyle = '#f2e8d0'; c.fillRect(cx - 38, cy + 12, 76, 22);
            c.strokeStyle = '#8a6e38'; c.strokeRect(cx - 37.5, cy + 12.5, 75, 21);
            ui.text(l1, cx, cy + 13, { align: 'center', size: 8, bold: true, col: '#2c2012', shadow: false });
            ui.text(l2, cx, cy + 22, { align: 'center', size: 8, bold: true, col: '#2c2012', shadow: false });
            if (doneMark) {
              c.fillStyle = '#3a2e1e'; c.beginPath(); c.arc(cx + 18, cy - 18, 7, 0, Math.PI * 2); c.fill();
              ui.text('✓', cx + 18, cy - 24, { align: 'center', size: 10, bold: true, col: C.gold, shadow: false });
            } else if (ready) ui.badge(cx + 18, cy - 18);
            ui.hit(cx - 40, cy - 28, 80, 64, () => { this.sel = idx; this.setMode(m); });
          });

          const rx = 342, ry = 46, rw = 282, rh = 402;
          c.fillStyle = 'rgba(18,16,28,0.88)'; c.fillRect(rx, ry, rw, rh);
          c.fillStyle = '#f4ede0'; c.fillRect(rx + 6, ry + 32, rw - 12, 174);
          const headGr = c.createLinearGradient(rx, ry, rx, ry + 32);
          headGr.addColorStop(0, '#725c3a'); headGr.addColorStop(1, '#4a3a22');
          c.fillStyle = headGr; c.fillRect(rx + 4, ry + 4, rw - 8, 28);
          c.strokeStyle = '#e6cf94'; c.lineWidth = 1.5; c.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4); c.lineWidth = 1;
          ui.text('План обустройства', rx + rw / 2, ry + 9, { align: 'center', size: 15, bold: true, serif: true, col: '#fff4d8' });

          c.fillStyle = '#faecc4'; c.fillRect(rx + 26, ry + 38, rw - 52, 18);
          ui.text('★ ' + stars + '/30', rx + rw / 2, ry + 40, { align: 'center', size: 12, bold: true, col: '#6e4e16', shadow: false });

          H.ROOM_ZONES.forEach((z, i) => {
            const zx = rx + 35 + i * 42, zy = ry + 78, zs = g.roomZoneStars(z.id), full = zs >= 5;
            drawHex(c, zx, zy, 18, full ? '#d8aa48' : zs > 0 ? '#8c7648' : '#c8beaa', '#5a4624', 1.5);
            drawHex(c, zx, zy, 14, full ? '#f6dc8c' : '#3a3228', '#a88a48', 1);
            if (full) {
              ui.text('✓', zx, zy - 7, { align: 'center', size: 13, bold: true, col: '#4a3210', shadow: false });
            } else {
              drawZoneIcon(c, z.icon, zx, zy, zs > 0 ? '#ffe8a0' : '#b8b0a0');
            }
            ui.hit(zx - 18, zy - 18, 36, 36, () => { this.zIdx = i; this.setMode('checklist'); });
          });

          c.fillStyle = '#e8c872'; c.fillRect(rx + 28, ry + 104, rw - 56, 15);
          ui.text('Фонд экспресса', rx + rw / 2, ry + 106, { align: 'center', size: 10, bold: true, col: '#3a280c', shadow: false });
          drawFundCounter(c, ui, rx + 64, ry + 124, r.fund, false);

          const canAnyBuild = H.ROOM_BUILDS.some(b => g.roomCanBuild(b.id));
          const b0 = this.sel === 0;
          c.fillStyle = b0 ? '#fffaf0' : '#e8dfd0'; c.fillRect(rx + 14, ry + 162, rw - 28, 34);
          c.strokeStyle = b0 ? '#b88628' : '#b8ad98'; c.lineWidth = b0 ? 2 : 1; c.strokeRect(rx + 14.5, ry + 162.5, rw - 29, 33); c.lineWidth = 1;
          ui.text('Чек-лист обустройства', rx + 26, ry + 172, { size: 13, bold: true, col: '#3a2e1e', shadow: false });
          c.fillStyle = '#d8ccb8'; c.beginPath(); c.arc(rx + rw - 32, ry + 179, 10, 0, Math.PI * 2); c.fill();
          ui.text('›', rx + rw - 32, ry + 170, { align: 'center', size: 15, bold: true, col: '#4a3a24', shadow: false });
          if (canAnyBuild) ui.badge(rx + rw - 20, ry + 166);
          ui.hit(rx + 14, ry + 162, rw - 28, 34, () => { this.sel = 0; this.setMode('checklist'); });

          const b1 = this.sel === 1;
          const dutyGr = c.createLinearGradient(rx + 14, ry + 214, rx + rw - 14, ry + 306);
          dutyGr.addColorStop(0, b1 ? '#5c4e36' : '#463c2c'); dutyGr.addColorStop(1, b1 ? '#8a7248' : '#68583c');
          c.fillStyle = dutyGr; c.fillRect(rx + 14, ry + 214, rw - 28, 92);
          c.strokeStyle = b1 ? C.brassHi : '#a89060'; c.lineWidth = b1 ? 2 : 1; c.strokeRect(rx + 14.5, ry + 214.5, rw - 29, 91); c.lineWidth = 1;
          drawHex(c, rx + rw - 56, ry + 260, 32, 'rgba(242,220,154,0.18)', 'rgba(242,220,154,0.45)', 1.5);
          G.menuIcon(c, 'mission', rx + rw - 70, ry + 246, 28, '#f4dfb0');
          ui.text('Начать дежурство', rx + 26, ry + 226, { size: 15, bold: true, col: '#fff4d8' });
          c.fillStyle = '#f4ede0'; c.beginPath(); c.arc(rx + 184, ry + 234, 9, 0, Math.PI * 2); c.fill();
          ui.text('›', rx + 184, ry + 225, { align: 'center', size: 14, bold: true, col: '#3a2e1e', shadow: false });
          ui.text(r.shift && !r.shift.done ? 'Смена в разгаре (ход ' + r.shift.turn + '/4)' : 'Пополнение Фонда Экспресса', rx + 26, ry + 254, { size: 10, col: '#e8d8b0' });
          ui.text('Проведено смен: ' + r.shifts, rx + 26, ry + 272, { size: 10, col: C.gold });
          ui.hit(rx + 14, ry + 214, rw - 28, 92, () => { this.sel = 1; this.setMode('duty'); });

          const b2 = this.sel === 2, b3 = this.sel === 3, hw2 = Math.floor((rw - 34) / 2);
          [[rx + 14, 'Журнал', 'дежурств', r.logs + '/12', b2, 'log', H.ROOM_REWARDS.logs.some(m => g.roomLogReady(m.count)), 2],
           [rx + 20 + hw2, 'Выплата за', 'обустройство', r.starGot.length + '/6', b3, 'rewards', H.ROOM_REWARDS.stars.some(m => g.roomStarReady(m.stars)), 3]].forEach(([bx2, t1, t2, sub, on, m, badge, idx]) => {
            c.fillStyle = on ? '#4e4230' : '#362e22'; c.fillRect(bx2, ry + 314, hw2, 76);
            c.strokeStyle = on ? C.brassHi : '#8a7650'; c.lineWidth = on ? 2 : 1; c.strokeRect(bx2 + 0.5, ry + 314.5, hw2 - 1, 75); c.lineWidth = 1;
            ui.text(t1, bx2 + 10, ry + 324, { size: 11, bold: true, col: '#f4ede0' });
            ui.text(t2, bx2 + 10, ry + 339, { size: 11, bold: true, col: '#f4ede0' });
            ui.text(sub, bx2 + 10, ry + 364, { size: 11, bold: true, col: C.gold });
            if (badge) ui.badge(bx2 + hw2 - 12, ry + 322);
            ui.hit(bx2, ry + 314, hw2, 76, () => { this.sel = idx; this.setMode(m); });
          });

          ui.hints([['↑↓←→', 'Выбор'], ['Enter', 'Открыть'], ['D', 'Заказать декор'], ['Esc', 'Выйти']], 14, HGT - 18);
        },
        drawChecklist(c) {
          const z = this.zone(), r = g.room(), stars = g.roomStars(), builds = g.roomZoneBuilds(z.id), next = g.roomNextBuild(z.id);
          drawRoomPreview(ui, c, z.cam);
          this.drawSparks(c);

          c.fillStyle = 'rgba(10,12,24,0.72)'; c.fillRect(10, 8, 250, 34);
          c.strokeStyle = C.brass; c.strokeRect(10.5, 8.5, 249, 33);
          ui.text('Идеи декора для космического дома', 18, 12, { size: 9, col: C.sub });
          ui.text('Обустройство комнаты', 18, 23, { size: 12, bold: true, col: C.gold });

          H.ROOM_ZONES.forEach((zn, i) => {
            const y = 52 + i * 58, on = i === this.zIdx, pct = g.roomZonePct(zn.id), zNext = g.roomNextBuild(zn.id), canZ = zNext && g.roomCanBuild(zNext.id);
            if (on) {
              c.fillStyle = 'rgba(246,240,226,0.95)'; c.fillRect(14, y + 6, 138, 36);
              c.strokeStyle = '#c8a458'; c.strokeRect(14.5, y + 6.5, 137, 35);
            }
            drawHex(c, 32, y + 24, 18, on ? '#fffaf0' : '#2a2830', on ? '#d2ac64' : '#8a8274', 1.5);
            drawZoneIcon(c, zn.icon, 32, y + 22, on ? '#3a2e1e' : '#e8e0d0');
            c.fillStyle = pct >= 100 ? '#3a3428' : '#26242c'; c.fillRect(16, y + 32, 32, 12);
            ui.text(pct + '%', 32, y + 33, { align: 'center', size: 8, bold: true, col: pct >= 100 ? C.gold : '#e0d8c8', shadow: false });
            ui.text(zn.name, 56, y + 17, { size: 11, bold: true, col: on ? '#2c2214' : '#fff8ea', shadow: !on });
            if (canZ) {
              c.fillStyle = '#c87828'; c.fillRect(14, y - 1, 34, 11);
              ui.text('Новое', 31, y, { align: 'center', size: 8, bold: true, col: '#fff8e8', shadow: false });
            }
            ui.hit(12, y, 144, 52, () => this.setZone(i));
          });

          c.fillStyle = '#f6f0e2'; c.fillRect(12, 420, 144, 28);
          c.strokeStyle = '#b89448'; c.strokeRect(12.5, 420.5, 143, 27);
          ui.text('‹ Заказать декор', 84, 427, { align: 'center', size: 11, bold: true, col: '#3a2e1e', shadow: false });
          ui.hit(12, 420, 144, 28, () => this.setMode('decor'));

          const rx = 386, rw = 242;
          c.fillStyle = 'rgba(24,22,28,0.92)'; c.fillRect(rx, 8, rw - 38, 94);
          c.strokeStyle = '#a88c54'; c.strokeRect(rx + 0.5, 8.5, rw - 39, 93);
          ui.text('Прогресс обустройства', rx + (rw - 38) / 2, 13, { align: 'center', size: 10, bold: true, col: '#e8dec8' });
          ui.bar(rx + 18, 29, rw - 74, 8, stars / 30, '#e8b848', '#141218');
          ui.text('★ ' + stars + '/30', rx + (rw - 38) / 2, 39, { align: 'center', size: 11, bold: true, col: C.gold });
          c.fillStyle = '#d8b868'; c.fillRect(rx + 18, 53, rw - 74, 14);
          ui.text('Фонд экспресса', rx + (rw - 38) / 2, 55, { align: 'center', size: 9, bold: true, col: '#2c2010', shadow: false });
          drawFundCounter(c, ui, rx + 26, 72, r.fund, true);
          ui.closeBtn(W - 32, 10, () => this.setMode('hub'));

          const cy = 108, ch = 338, zStars = g.roomZoneStars(z.id), zPct = g.roomZonePct(z.id);
          c.fillStyle = 'rgba(34,30,28,0.93)'; c.fillRect(rx, cy, rw, ch);
          c.strokeStyle = '#bfa064'; c.strokeRect(rx + 0.5, cy + 0.5, rw - 1, ch - 1);
          ui.text(z.name, rx + 12, cy + 10, { size: 14, bold: true, col: '#fff4d8' });
          ui.text(zPct + '%', rx + rw - 12, cy + 11, { align: 'right', size: 13, bold: true, col: C.gold });
          ui.bar(rx + 12, cy + 32, 56, 5, zStars / 5, '#f0be50', '#181412');
          for (let s = 0; s < 5; s++) {
            ui.text('★', rx + 82 + s * 28, cy + 26, { size: 14, bold: true, col: s < zStars ? '#f6c858' : '#585048' });
          }

          builds.forEach((b, i) => {
            const by = cy + 50 + i * 55, bh = 49, on = i === this.bIdx;
            const built = r.built.includes(b.id), isNext = !!next && next.id === b.id, canAfford = r.fund >= b.cost;
            c.fillStyle = built ? '#3e382e' : isNext ? '#f4efe4' : '#c8c2b6';
            c.fillRect(rx + 10, by, rw - 20, bh);
            if (on) {
              c.strokeStyle = built || !isNext ? C.brassHi : '#b87818';
              c.lineWidth = 2; c.strokeRect(rx + 10, by, rw - 20, bh); c.lineWidth = 1;
            }
            if (built) {
              c.fillStyle = '#d8aa48'; c.beginPath(); c.arc(rx + 28, by + 24, 11, 0, Math.PI * 2); c.fill();
              ui.text('✓', rx + 28, by + 17, { align: 'center', size: 13, bold: true, col: '#2c1e0c', shadow: false });
              ui.text(ui.fitText ? ui.fitText(b.name, 11, rw - 64, true) : b.name, rx + 46, by + 10, { size: 11, bold: true, col: '#f4ede0' });
              ui.text(b.slot ? 'Установлено · Enter: декор' : 'Установлено в комнате', rx + 46, by + 27, { size: 9, col: C.gold });
            } else if (isNext) {
              drawWrenchIcon(c, rx + 28, by + 24, '#4a4238');
              ui.text(ui.fitText ? ui.fitText(b.name, 11, rw - 102, true) : b.name, rx + 46, by + 8, { size: 11, bold: true, col: '#2a2218', shadow: false });
              c.fillStyle = canAfford ? '#e4dcd0' : '#f2d6d0'; c.fillRect(rx + 46, by + 25, 104, 18);
              drawFundIcon(c, rx + 56, by + 34, 6);
              ui.text(H.fmt(b.cost), rx + 66, by + 28, { size: 10, bold: true, col: canAfford ? '#2a2218' : '#a82828', shadow: false });
              ui.text('›', rx + 142, by + 26, { align: 'center', size: 13, bold: true, col: '#5a4a32', shadow: false });
              c.fillStyle = '#c88228'; c.fillRect(rx + rw - 52, by + 2, 38, 12);
              ui.text('Новое', rx + rw - 33, by + 3, { align: 'center', size: 8, bold: true, col: '#fff8ea', shadow: false });
            } else {
              drawWrenchIcon(c, rx + 28, by + 24, '#6e685e');
              ui.text(ui.fitText ? ui.fitText(b.name, 11, rw - 94, true) : b.name, rx + 46, by + 10, { size: 11, bold: true, col: '#4e483e', shadow: false });
              ui.text('Цена: ' + H.fmt(b.cost), rx + 46, by + 27, { size: 9, col: '#6a6256', shadow: false });
              c.strokeStyle = '#6e685e'; c.beginPath(); c.arc(rx + rw - 32, by + 24, 11, 0, Math.PI * 2); c.stroke();
              ui.domainLock(c, rx + rw - 32, by + 22, '#6e685e');
            }
            ui.hit(rx + 10, by, rw - 20, bh, () => {
              if (this.bIdx === i) this.doBuild(b);
              else { this.bIdx = i; ui.sfx('select'); }
            });
          });

          ui.hints([['Q/E', 'Зона'], ['↑↓', 'Предмет'], ['Enter', 'Построить'], ['D', 'Заказать декор'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        drawDecor(c) {
          const z = this.zone(), slots = this.zoneSlots(), sl = this.curSlot(), curItem = g.roomSlotItem(sl.id);
          drawRoomPreview(ui, c, sl.cam || z.cam);
          this.drawSparks(c);

          c.fillStyle = 'rgba(10,12,24,0.78)'; c.fillRect(0, 0, W, 42);
          c.fillStyle = C.brass; c.fillRect(0, 41, W, 1);
          ui.text('Идеи декора для космического дома', 14, 5, { size: 9, col: C.sub });
          ui.text('Заказать декор · ' + z.name, 14, 18, { size: 12, bold: true, col: C.gold });

          const stripX = 216;
          ui.keycap(stripX - 22, 14, 'Q');
          ui.hit(stripX - 24, 10, 20, 22, () => this.setZone(this.zIdx - 1));
          H.ROOM_ZONES.forEach((zn, i) => {
            const zx = stripX + 14 + i * 32, zy = 20, on = i === this.zIdx;
            c.fillStyle = on ? '#f6efe0' : 'rgba(40,42,64,0.85)';
            c.beginPath(); c.arc(zx, zy, 13, 0, Math.PI * 2); c.fill();
            c.strokeStyle = on ? C.brassHi : '#6a7090'; c.stroke();
            drawZoneIcon(c, zn.icon, zx, zy - 1, on ? '#2c2214' : '#d8dce8');
            if (on) { c.fillStyle = '#f6efe0'; c.fillRect(zx - 10, 36, 20, 3); }
            ui.hit(zx - 14, 6, 28, 30, () => this.setZone(i));
          });
          ui.keycap(stripX + H.ROOM_ZONES.length * 32 + 4, 14, 'E');
          ui.hit(stripX + H.ROOM_ZONES.length * 32 + 2, 10, 20, 22, () => this.setZone(this.zIdx + 1));

          ui.button(W - 114, 10, 76, 22, 'Чек-лист', () => this.setMode('checklist'), { size: 10 });
          ui.closeBtn(W - 32, 10, () => this.setMode('checklist'));

          const barY = 308;
          c.fillStyle = 'rgba(18,18,28,0.86)'; c.fillRect(12, barY, W - 24, 26);
          c.strokeStyle = 'rgba(201,164,92,0.6)'; c.strokeRect(12.5, barY + 0.5, W - 25, 25);
          ui.keycap(18, barY + 6, 'Z');
          ui.hit(14, barY + 2, 22, 22, () => this.setSlot(this.sIdx - 1));
          const tabAreaW = 420, tabW = Math.floor(tabAreaW / Math.max(1, slots.length));
          slots.forEach((s, i) => {
            const tx = 40 + i * tabW, on = i === this.sIdx, unlocked = g.roomSlotUnlocked(s.id);
            if (on) {
              c.fillStyle = '#f4efe2'; c.fillRect(tx + 2, barY + 3, tabW - 4, 20);
            } else if (i > 0) {
              c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(tx, barY + 6, 1, 14);
            }
            const label = ui.fitText ? ui.fitText(s.name, 9, tabW - 8, on) : s.name;
            ui.text(label, tx + tabW / 2, barY + 7, { align: 'center', size: 9, bold: on, col: on ? '#2a2014' : unlocked ? C.cream : C.dim, shadow: !on });
            ui.hit(tx, barY + 2, tabW, 22, () => this.setSlot(i));
          });
          ui.keycap(464, barY + 6, 'C');
          ui.hit(462, barY + 2, 22, 22, () => this.setSlot(this.sIdx + 1));

          const unlocked = g.roomSlotUnlocked(sl.id), selItem = sl.items[this.iIdx] || sl.items[0];
          const canPlace = unlocked && selItem && curItem !== selItem.id;
          ui.button(492, barY + 2, 132, 22, !unlocked ? 'Не построено' : curItem === selItem.id ? 'Размещено' : 'Разместить', () => this.doPlaceDecor(), { size: 10, bold: true, active: canPlace, disabled: !canPlace });

          const trayY = 338, trayH = 120;
          const trayGr = c.createLinearGradient(0, trayY, 0, trayY + trayH);
          trayGr.addColorStop(0, 'rgba(34,28,24,0.92)'); trayGr.addColorStop(1, 'rgba(18,14,14,0.96)');
          c.fillStyle = trayGr; c.fillRect(0, trayY, W, trayH);
          c.fillStyle = '#bfa064'; c.fillRect(0, trayY, W, 1);

          const cw = 72, ch = 92, gap = 8, startX = 16;
          sl.items.forEach((it, i) => {
            const x = startX + i * (cw + gap), y = trayY + 12, on = i === this.iIdx, placed = unlocked && curItem === it.id;
            c.fillStyle = on ? '#fffdf8' : '#e8e2d6'; c.fillRect(x, y, cw, ch);
            c.strokeStyle = on ? '#d29b38' : '#8a8070'; c.lineWidth = on ? 2 : 1;
            c.strokeRect(x + (on ? 1 : 0.5), y + (on ? 1 : 0.5), cw - (on ? 2 : 1), ch - (on ? 2 : 1)); c.lineWidth = 1;
            drawItemThumb(c, sl.id, it, x, y + 6, cw, ch - 24);
            c.fillStyle = '#f6f2e8'; c.fillRect(x + 2, y + ch - 22, cw - 4, 20);
            const nm = ui.fitText ? ui.fitText(it.name, 8, cw - 6, on) : it.name;
            ui.text(nm, x + cw / 2, y + ch - 17, { align: 'center', size: 8, bold: on, col: '#2c2216', shadow: false });
            if (placed) {
              c.fillStyle = '#c8aa58'; c.fillRect(x + 2, y + 2, 54, 12);
              ui.text('Размещено', x + 29, y + 3, { align: 'center', size: 8, bold: true, col: '#2a1e0c', shadow: false });
            } else if (!unlocked) {
              c.fillStyle = 'rgba(10,12,20,0.45)'; c.fillRect(x + 2, y + 2, cw - 4, ch - 24);
              ui.domainLock(c, x + cw / 2, y + 32, C.cream);
            }
            ui.hit(x, y, cw, ch, () => {
              if (this.iIdx === i) this.doPlaceDecor();
              else { this.iIdx = i; ui.sfx('select'); }
            });
          });

          const infoX = startX + sl.items.length * (cw + gap) + 8, infoW = W - infoX - 14;
          if (selItem && infoW >= 120) {
            c.fillStyle = 'rgba(16,14,20,0.75)'; c.fillRect(infoX, trayY + 12, infoW, ch);
            c.strokeStyle = 'rgba(201,164,92,0.45)'; c.strokeRect(infoX + 0.5, trayY + 12.5, infoW - 1, ch - 1);
            ui.text(ui.fitText ? ui.fitText(selItem.name, 11, infoW - 16, true) : selItem.name, infoX + 8, trayY + 18, { size: 11, bold: true, col: C.gold });
            const needBuild = H.ROOM_BUILDS.find(b => b.id === sl.build);
            const subTxt = unlocked ? selItem.desc : 'Требуется построить: «' + (needBuild ? needBuild.name : sl.name) + '». ' + selItem.desc;
            ui.wrap(subTxt, infoW - 16, 9).slice(0, 5).forEach((l, j) => ui.text(l, infoX + 8, trayY + 35 + j * 12, { size: 9, col: unlocked ? C.cream : '#e8a888' }));
          }

          ui.hints([['Q/E', 'Зона'], ['Z/C', 'Категория'], ['←→', 'Вариант'], ['Enter', 'Разместить'], ['Esc', 'К чек-листу']], 14, HGT - 16);
        },
        drawDuty(c) {
          const r = g.room(), sh = r.shift;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(6,8,24,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(12, 10, 'Дежурство по Экспрессу');
          drawFundCounter(c, ui, W - 206, 10, r.fund, true);
          ui.closeBtn(W - 32, 10, () => this.setMode('hub'));

          if (this.lastShift) {
            const ls = this.lastShift, log = H.ROOM_LOGS.find(x => x.id === ls.logUnlocked) || H.ROOM_LOGS[0];
            ui.win(36, 48, 568, 396, { title: 'Вечернее собрание Экспресса' });
            ui.text('Смена дежурства успешно завершена!', 56, 72, { size: 15, bold: true, serif: true, col: C.gold });
            ui.text('Напарник смены: ' + (H.ROOM_CREW.find(x => x.id === ls.partner) || H.ROOM_CREW[0]).name + ' · Премия Пом-Пом: +' + H.fmt(ls.evalBonus), 56, 94, { size: 11, col: C.cream });
            ui.text('Заработано за смену: +' + H.fmt(ls.earned) + ' в Фонд Экспресса', 56, 114, { size: 13, bold: true, col: C.ok });
            ui.stamp(520, 92, 'ОЦЕНКА ' + (ls.rank || 'S'));

            c.fillStyle = 'rgba(10,12,32,0.75)'; c.fillRect(54, 140, 532, 240);
            c.strokeStyle = C.brass; c.strokeRect(54.5, 140.5, 531, 239);
            ui.text('Запись журнала: «' + log.title + '»', 68, 150, { size: 13, bold: true, serif: true, col: C.gold });
            let ly = 176;
            log.lines.forEach(line => {
              const idx = line.indexOf('|'), spk = line.slice(0, idx), txt = g.fill(line.slice(idx + 1));
              const spName = spk === 'trail' ? g.state.name : (H.SPEAKERS[spk] && H.SPEAKERS[spk].name) || spk;
              const look = spk === 'pompom' ? H.pomOutfitLook(g.pomWorn ? g.pomWorn() : 'uniform') : G.lookOf(spk === 'trail' ? g.kitOf('trail') : spk, g);
              G.rarityCell(c, 68, ly, 36, 36, 4);
              G.drawPortrait(c, look, 70, ly + 2, 32);
              ui.text(spName, 114, ly, { size: 10, bold: true, col: C.gold });
              const wrapped = ui.wrap(txt, 456, 10).slice(0, 3);
              wrapped.forEach((wl, wi) => ui.text(wl, 114, ly + 14 + wi * 12, { size: 10, col: C.cream }));
              ly += Math.max(46, 18 + wrapped.length * 12);
            });

            ui.button(116, 396, 190, 30, 'Новая смена', () => { this.lastShift = null; ui.sfx('confirm'); }, { active: this.sel === 0, bold: true });
            ui.button(334, 396, 190, 30, 'К обустройству', () => { this.lastShift = null; this.setMode('checklist'); }, { active: this.sel === 1, bold: true });
            ui.hints([['←→', 'Выбор'], ['Enter', 'Продолжить'], ['Esc', 'Назад']], 14, HGT - 18);
            return;
          }

          if (!sh || sh.done) {
            ui.win(24, 46, 592, 400, { title: 'Выбор напарника на смену (4 хода)' });
            ui.text('Выберите товарища по Звёздному экспрессу. Совпадение тегов задач подряд даёт комбо-надбавку!', 42, 70, { size: 10, col: C.sub });
            H.ROOM_CREW.forEach((cr, i) => {
              const x = 38 + i * 142, y = 94, w = 132, h = 290, on = i === this.pIdx, ti = TAG_INFO[cr.tag];
              const gr = c.createLinearGradient(0, y, 0, y + h);
              gr.addColorStop(0, on ? '#383264' : '#181c3e'); gr.addColorStop(1, on ? '#221c3e' : '#0c0e24');
              c.fillStyle = gr; c.fillRect(x, y, w, h);
              c.strokeStyle = on ? C.brassHi : '#464e82'; c.lineWidth = on ? 2 : 1;
              c.strokeRect(x + (on ? 1 : 0.5), y + (on ? 1 : 0.5), w - (on ? 2 : 1), h - (on ? 2 : 1)); c.lineWidth = 1;
              ui.platform(c, x + w / 2, y + 150, 42);
              G.drawFigure(c, G.lookOf(cr.id, g), x + w / 2, y + 152, 2);
              ui.text(cr.name, x + w / 2, y + 162, { align: 'center', size: 13, bold: true, serif: true, col: on ? C.gold : C.cream });
              c.fillStyle = ti.col; c.fillRect(x + 12, y + 184, w - 24, 15);
              ui.text(ti.name, x + w / 2, y + 186, { align: 'center', size: 9, bold: true, col: '#18121e', shadow: false });
              ui.wrap(cr.bonus, w - 16, 9).slice(0, 2).forEach((l, j) => ui.text(l, x + w / 2, y + 206 + j * 12, { align: 'center', size: 9, bold: true, col: C.gold }));
              ui.wrap(cr.desc, w - 16, 9).slice(0, 4).forEach((l, j) => ui.text(l, x + 8, y + 234 + j * 12, { size: 9, col: '#c8d0f0' }));
              ui.hit(x, y, w, h, () => {
                if (this.pIdx === i) { g.startRoomDuty(cr.id); this.cIdx = 0; ui.sfx('confirm'); }
                else { this.pIdx = i; ui.sfx('select'); }
              });
            });
            const picked = H.ROOM_CREW[this.pIdx] || H.ROOM_CREW[0];
            ui.button(W / 2 - 110, 398, 220, 32, 'Начать смену: ' + picked.name, () => { g.startRoomDuty(picked.id); this.cIdx = 0; ui.sfx('confirm'); }, { active: true, bold: true });
            ui.hints([['←→', 'Напарник'], ['Enter', 'Начать дежурство'], ['Esc', 'Назад']], 14, HGT - 18);
            return;
          }

          const crew = H.ROOM_CREW.find(x => x.id === sh.partner) || H.ROOM_CREW[0];
          ui.win(24, 46, 592, 400, { title: 'Смена дежурства · Ход ' + sh.turn + ' из ' + sh.maxTurns });
          G.rarityCell(c, 40, 68, 44, 44, 4);
          G.drawPortrait(c, G.lookOf(crew.id, g), 42, 70, 40);
          ui.text('Напарник: ' + crew.name, 94, 70, { size: 12, bold: true, col: C.gold });
          ui.text(crew.bonus, 94, 88, { size: 10, col: C.cream });
          ui.text('Накоплено за смену: +' + H.fmt(sh.earned), 596, 70, { align: 'right', size: 12, bold: true, col: C.ok });
          ui.text(sh.lastTag ? 'Прошлая задача: ' + TAG_INFO[sh.lastTag].name + ' (комбо ×' + sh.combo + ')' : 'Выберите первую задачу смены', 596, 88, { align: 'right', size: 10, col: sh.combo > 0 ? C.gold : C.sub });

          sh.hand.forEach((card, i) => {
            const x = 38 + i * 190, y = 124, w = 176, h = 256, on = i === this.cIdx, ti = TAG_INFO[card.tag];
            const mult = crew.tag === 'all' ? 1.2 : crew.tag === card.tag ? 1.3 : 1;
            const nextCombo = sh.lastTag === card.tag ? sh.combo + 1 : 0;
            const totalGain = Math.round(card.fund * mult) + nextCombo * 1500;
            c.fillStyle = on ? '#fbf4e2' : '#e6decb'; c.fillRect(x, y, w, h);
            c.strokeStyle = on ? '#c88a28' : '#8a7e68'; c.lineWidth = on ? 2.5 : 1;
            c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.lineWidth = 1;
            c.fillStyle = ti.col; c.fillRect(x + 8, y + 8, w - 16, 20);
            ui.text(ti.name, x + w / 2, y + 12, { align: 'center', size: 10, bold: true, col: '#18121e', shadow: false });
            ui.wrap(card.name, w - 20, 12, true, true).slice(0, 2).forEach((l, j) => ui.text(l, x + w / 2, y + 38 + j * 15, { align: 'center', size: 12, bold: true, serif: true, col: '#2c2012', shadow: false }));
            ui.wrap(card.desc, w - 20, 10).slice(0, 4).forEach((l, j) => ui.text(l, x + 10, y + 78 + j * 14, { size: 10, col: '#4a3c2c', shadow: false }));

            c.fillStyle = '#d8ceb8'; c.fillRect(x + 10, y + 148, w - 20, 1);
            ui.text('Базовый вклад: +' + H.fmt(card.fund), x + 12, y + 158, { size: 9, col: '#5a4c38', shadow: false });
            if (mult > 1) ui.text('Бонус напарника: +' + Math.round((mult - 1) * 100) + '%', x + 12, y + 173, { size: 9, bold: true, col: '#246a34', shadow: false });
            if (nextCombo > 0) ui.text('Серия тегов ×' + nextCombo + ': +' + H.fmt(nextCombo * 1500), x + 12, y + 188, { size: 9, bold: true, col: '#b85818', shadow: false });

            c.fillStyle = '#2e261c'; c.fillRect(x + 10, y + h - 42, w - 20, 32);
            drawFundIcon(c, x + 26, y + h - 26, 8);
            ui.text('+' + H.fmt(totalGain), x + w / 2 + 8, y + h - 33, { align: 'center', size: 13, bold: true, col: C.gold });
            ui.hit(x, y, w, h, () => {
              if (this.cIdx === i) this.playCard(i);
              else { this.cIdx = i; ui.sfx('select'); }
            });
          });
          ui.button(W / 2 - 100, 396, 200, 32, 'Выполнить поручение', () => this.playCard(this.cIdx), { active: true, bold: true });
          ui.hints([['←→', 'Задача'], ['Enter', 'Выполнить'], ['Esc', 'Отложить смену']], 14, HGT - 18);
        },
        playCard(idx) {
          const res = g.playRoomDutyCard(idx);
          if (!res) return;
          if (res.done) {
            this.lastShift = res;
            this.sel = 0;
            ui.sfx('star4');
          } else {
            this.cIdx = 0;
            ui.sfx('confirm');
            const last = res.history[res.history.length - 1];
            if (last) ui.toast(last.name + ': +' + H.fmt(last.gain) + ' в Фонд Экспресса');
          }
        },
        drawLog(c) {
          const r = g.room();
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(6,8,24,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(12, 10, 'Журнал дежурств Экспресса');
          ui.text('Открыто историй: ' + r.logs + ' из ' + H.ROOM_LOGS.length, 236, 15, { size: 11, bold: true, col: C.gold });
          ui.closeBtn(W - 32, 10, () => this.setMode('hub'));

          ui.win(16, 42, 236, 332);
          const rows = H.ROOM_LOGS.map((lg, i) => ({
            label: i < r.logs ? (i + 1) + '. ' + lg.title : (i + 1) + '. Запись закрыта',
            col: i < r.logs ? C.cream : C.dim
          }));
          ui.list(26, 54, 216, rows, this.lIdx, { rowH: 25, max: 12, size: 10, onClick: i => { this.lIdx = i; ui.sfx('select'); } });

          ui.win(260, 42, 364, 332);
          const lg = H.ROOM_LOGS[this.lIdx];
          if (this.lIdx < r.logs && lg) {
            ui.text(lg.title, 276, 56, { size: 14, bold: true, serif: true, col: C.gold });
            c.fillStyle = C.brassDk; c.fillRect(276, 78, 332, 1);
            let ly = 88;
            lg.lines.forEach(line => {
              const idx = line.indexOf('|'), spk = line.slice(0, idx), txt = g.fill(line.slice(idx + 1));
              const spName = spk === 'trail' ? g.state.name : (H.SPEAKERS[spk] && H.SPEAKERS[spk].name) || spk;
              const look = spk === 'pompom' ? H.pomOutfitLook(g.pomWorn ? g.pomWorn() : 'uniform') : G.lookOf(spk === 'trail' ? g.kitOf('trail') : spk, g);
              G.rarityCell(c, 276, ly, 38, 38, 4);
              G.drawPortrait(c, look, 278, ly + 2, 34);
              ui.text(spName, 322, ly, { size: 11, bold: true, col: C.gold });
              const wrapped = ui.wrap(txt, 284, 10).slice(0, 4);
              wrapped.forEach((wl, wi) => ui.text(wl, 322, ly + 15 + wi * 13, { size: 10, col: C.cream }));
              ly += Math.max(52, 20 + wrapped.length * 13);
            });
          } else {
            G.menuIcon(c, 'archive', 426, 150, 32, C.dim);
            ui.text('История ещё не открыта', 442, 194, { align: 'center', size: 13, bold: true, col: C.cream });
            ui.text('Проведите ещё дежурство по Экспрессу, чтобы открыть запись #' + (this.lIdx + 1) + '.', 442, 216, { align: 'center', size: 10, col: C.sub });
          }

          ui.win(16, 380, 608, 72);
          ui.text('Награды журнала', 28, 390, { size: 11, bold: true, col: C.gold });
          H.ROOM_REWARDS.logs.forEach((m, i) => {
            const x = 28 + i * 118, y = 408, w = 112, h = 36, got = r.logGot.includes(m.count), ready = g.roomLogReady(m.count);
            c.fillStyle = got ? 'rgba(30,36,58,0.7)' : ready ? 'rgba(90,76,36,0.85)' : 'rgba(18,22,44,0.85)';
            c.fillRect(x, y, w, h);
            c.strokeStyle = ready ? C.brassHi : '#464e78'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
            G.itemIcon(c, 'jade', x + 4, y + 6, 22);
            ui.text(m.count + ' зап. · +' + m.jade, x + 30, y + 6, { size: 9, bold: true, col: got ? C.dim : C.cream });
            ui.text(got ? 'Получено' : ready ? 'Забрать!' : r.logs + '/' + m.count, x + 30, y + 20, { size: 9, col: got ? C.ok : ready ? C.gold : C.sub });
            ui.hit(x, y, w, h, () => {
              const out = g.claimRoomLog(m.count);
              if (out) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); }
              else { ui.sfx('deny'); ui.toast(got ? 'Награда уже получена.' : 'Нужно открыть записей журнала: ' + m.count + '.'); }
            });
          });
          ui.hints([['↑↓', 'История'], ['F', 'Забрать награды журнала'], ['Esc', 'Назад']], 14, HGT - 16);
        },
        drawRewards(c) {
          const r = g.room(), MS = H.ROOM_REWARDS.stars;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(6,8,24,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(12, 10, 'Выплата за обустройство');
          ui.money(248, 14, 'jade', g.state.jade);
          ui.button(W - 168, 10, 128, 22, 'Получить всё (F)', () => {
            const out = g.claimEvent('cosmic_home');
            if (out && out.length) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); }
            else { ui.sfx('deny'); ui.toast('Сейчас нет готовых наград.'); }
          }, { size: 10, bold: true });
          ui.closeBtn(W - 32, 10, () => this.setMode('hub'));

          ui.win(16, 40, 608, 412);
          MS.forEach((m, i) => {
            const y = 52 + i * 64, on = i === this.rIdx, got = r.starGot.includes(m.stars), ready = g.roomStarReady(m.stars);
            c.fillStyle = on ? 'rgba(72,82,156,0.45)' : 'rgba(18,22,52,0.65)'; c.fillRect(28, y, 584, 58);
            c.fillStyle = on ? C.brassHi : '#3a4070'; c.fillRect(28, y, 3, 58);
            ui.text('★ ' + m.stars + '/30 · ' + m.title, 42, y + 8, { size: 13, bold: true, col: on ? C.gold : C.cream });
            ui.text('Обустройте предметы мебели до отметки ' + m.stars + '★ (сейчас ' + g.roomStars() + '/30★)', 42, y + 28, { size: 10, col: C.sub });
            let rx = 310;
            if (m.pom) { ui.pomCell(c, m.pom, rx, y + 9, 40); rx += 46; }
            for (const [id, cnt] of starGiveList(m)) { ui.rewardCell(c, id, cnt, rx, y + 9, 40); rx += 46; }
            if (got) ui.stamp(558, y + 28, 'ЕСТЬ');
            else if (ready) ui.button(504, y + 16, 96, 26, 'Получить', () => {
              const out = g.claimRoomStar(m.stars);
              if (out) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); }
            }, { active: on, bold: true });
            else ui.text('В процессе', 586, y + 22, { align: 'right', size: 10, col: C.dim });
            ui.hit(28, y, 584, 58, () => {
              this.rIdx = i;
              const out = g.claimRoomStar(m.stars);
              if (out) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); }
              else ui.sfx('select');
            });
          });
          ui.hints([['↑↓', 'Этап'], ['Enter', 'Получить'], ['F', 'Получить всё'], ['Esc', 'Назад']], 14, HGT - 16);
        },
        drawCharPick(c) {
          const pool = H.ROOM_REWARDS.chars, r = g.room(), ready = g.roomCharReady(), got = r.charGot;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(6,8,24,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(12, 10, 'Персонаж 4★ в подарок новоселья');
          ui.closeBtn(W - 32, 10, () => this.setMode('hub'));

          ui.win(16, 42, 376, 408, { title: 'Пул Станции «Герта», Белобога и Лофу' });
          const COLS = 4, cw = 84, ch = 114, gx = 28, gy = 68;
          pool.forEach((cid, i) => {
            const x = gx + (i % COLS) * (cw + 6), y = gy + Math.floor(i / COLS) * (ch + 10), on = i === this.chIdx;
            const chDef = H.CHARS[cid], own = g.state.roster[cid], picked = got === cid;
            G.rarityCell(c, x, y, cw, ch, 4);
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, cw + 2, ch + 2); c.lineWidth = 1; }
            G.drawPortrait(c, G.lookOf(cid, g), x + 8, y + 6, 68);
            G.elemIcon(c, chDef.elem, x + 12, y + 12, 6);
            c.fillStyle = 'rgba(8,10,26,0.88)'; c.fillRect(x + 2, y + ch - 34, cw - 4, 32);
            ui.text(chDef.short || chDef.name, x + cw / 2, y + ch - 31, { align: 'center', size: 10, bold: on, col: on ? C.gold : C.cream });
            const stTxt = picked ? 'Выбран!' : !own ? 'Новый' : own.eid >= 6 ? 'Эйд. 6' : 'Эйд. ' + own.eid + ' → ' + (own.eid + 1);
            ui.text(stTxt, x + cw / 2, y + ch - 16, { align: 'center', size: 9, col: picked ? C.ok : !own ? '#80e8ff' : C.sub });
            ui.hit(x, y, cw, ch, () => {
              if (this.chIdx === i && ready) this.claimChar();
              else { this.chIdx = i; ui.sfx('select'); }
            });
          });

          const cid = pool[this.chIdx] || pool[0], chDef = H.CHARS[cid], own = g.state.roster[cid];
          ui.win(400, 42, 224, 408);
          ui.platform(c, 512, 240, 64);
          G.drawFigure(c, G.lookOf(cid, g), 512, 244, 2.5);
          ui.text(chDef.name, 512, 260, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
          ui.text('★★★★ · ' + H.PATHS[chDef.path].name + ' · ' + H.ELEMENTS[chDef.elem].name, 512, 282, { align: 'center', size: 10, col: G.RARITY[4] });
          const note = got ? 'Подарок получен: ' + H.CHARS[got].name + '.' : !ready ? 'Достигните 10/30★ обустройства комнаты (сейчас ' + g.roomStars() + '/30★), чтобы пригласить персонажа.' : !own ? 'Персонаж присоединится к вашему экипажу!' : own.eid < 6 ? 'Персонаж уже в отряде: вы получите Эйдолон ' + (own.eid + 1) + ' и звёздный свет.' : 'У персонажа уже все 6 Эйдолонов: вы получите 20 неугасаемого звёздного света.';
          ui.wrap(note, 196, 10).slice(0, 5).forEach((l, j) => ui.text(l, 414, 310 + j * 14, { size: 10, col: got ? C.ok : ready ? C.cream : C.sub }));
          ui.button(416, 402, 192, 32, got ? 'Уже получен' : ready ? 'Пригласить: ' + (chDef.short || chDef.name) : 'Нужно 10/30★', () => this.claimChar(), { active: ready, disabled: !ready, bold: true });
          ui.hints([['←↑↓→', 'Персонаж'], ['Enter', 'Выбрать'], ['Esc', 'Назад']], 14, HGT - 16);
        },
        claimChar() {
          const cid = H.ROOM_REWARDS.chars[this.chIdx];
          const out = g.claimRoomChar(cid);
          if (!out) {
            ui.sfx('deny');
            ui.toast(g.room().charGot ? 'Подарок новоселья уже получен.' : 'Сначала достигните 10/30★ обустройства комнаты.');
            return;
          }
          ui.sfx('star4');
          ui.toast('Подарок новоселья: ' + out.join(', ') + '!');
        },
        drawRules(c) {
          this.drawHub(c);
          c.fillStyle = 'rgba(2,3,12,0.72)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          const x = W / 2 - 240, y = 64, w = 480, h = 340;
          ui.win(x, y, w, h, { title: 'Правила: Идеи декора для космического дома' });
          ui.closeBtn(x + w - 30, y + 8, () => this.setMode('hub'));
          const rules = [
            '1. Комната Первопроходца разделена на 6 жилых зон: Спальня, Ванная, Прихожая, Гостиная, Игровая и Галерея редкостей.',
            '2. В каждой зоне 5 этапов обустройства (всего 30★). Постройка мебели тратит средства из Фонда Экспресса и сразу преображает комнату на втором этаже.',
            '3. В разделе «Начать дежурство» вы проводите смены по 4 хода вместе с Март 7, Дань Хэном, Химеко или Вельтом. Задачи одного тега подряд дают комбо-бонус в Фонд Экспресса, а в конце смены открывается история в Журнале дежурств.',
            '4. В режиме «Заказать декор» и у выставочных стендов Галереи редкостей можно свободно менять расцветку мебели, сувениры и трофеи из пройденных миров.',
            '5. На 10★ открывается выбор 4★ персонажа, а на 30★ — новоселье экипажа, снимок на стену Март 7 и Поварской наряд Пом-Пом!'
          ];
          let ly = y + 34;
          for (const par of rules) {
            for (const l of ui.wrap(par, w - 36, 10)) {
              ui.text(l, x + 18, ly, { size: 10, col: C.cream });
              ly += 14;
            }
            ly += 6;
          }
          ui.button(W / 2 - 80, y + h - 42, 160, 26, 'Понятно', () => this.setMode('hub'), { active: true, bold: true });
        },
        draw(c) {
          if (this.mode === 'checklist') this.drawChecklist(c);
          else if (this.mode === 'decor') this.drawDecor(c);
          else if (this.mode === 'duty') this.drawDuty(c);
          else if (this.mode === 'log') this.drawLog(c);
          else if (this.mode === 'rewards') this.drawRewards(c);
          else if (this.mode === 'charpick') this.drawCharPick(c);
          else if (this.mode === 'rules') this.drawRules(c);
          else this.drawHub(c);
        },
        key(k, code) {
          if (this.mode === 'rules') {
            if (k === 'back' || k === 'ok') this.setMode('hub');
            return;
          }
          if (this.mode === 'hub') {
            if (k === 'back') { ui.pop(); return; }
            if (code === 'KeyD') { this.setMode('decor'); return; }
            if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? 5 : 1)) % 6; ui.sfx('select'); return; }
            if (k === 'left' || k === 'right') { this.sel = this.sel === 2 ? 3 : this.sel === 3 ? 2 : this.sel === 4 ? 5 : this.sel === 5 ? 4 : this.sel; ui.sfx('select'); return; }
            if (k === 'ok') {
              const modes = ['checklist', 'duty', 'log', 'rewards', 'charpick', 'rewards'];
              this.setMode(modes[this.sel] || 'checklist');
            }
            return;
          }
          if (this.mode === 'checklist') {
            if (k === 'back') { this.setMode('hub'); return; }
            if (code === 'KeyD' || k === 'left') { this.setMode('decor'); return; }
            if (code === 'KeyQ') { this.setZone(this.zIdx - 1); return; }
            if (code === 'KeyE') { this.setZone(this.zIdx + 1); return; }
            const builds = g.roomZoneBuilds(this.zone().id);
            if (k === 'up' || k === 'down') { this.bIdx = (this.bIdx + (k === 'up' ? builds.length - 1 : 1)) % builds.length; ui.sfx('select'); return; }
            if (k === 'ok') { this.doBuild(builds[this.bIdx]); return; }
            return;
          }
          if (this.mode === 'decor') {
            if (k === 'back') { this.setMode('checklist'); return; }
            if (code === 'KeyQ') { this.setZone(this.zIdx - 1); return; }
            if (code === 'KeyE') { this.setZone(this.zIdx + 1); return; }
            if (code === 'KeyZ' || k === 'up') { this.setSlot(this.sIdx - 1); return; }
            if (code === 'KeyC' || k === 'down') { this.setSlot(this.sIdx + 1); return; }
            const items = this.curSlot().items;
            if (k === 'left' || k === 'right') { this.iIdx = (this.iIdx + (k === 'left' ? items.length - 1 : 1)) % items.length; ui.sfx('select'); return; }
            if (k === 'ok') { this.doPlaceDecor(); return; }
            return;
          }
          if (this.mode === 'duty') {
            if (this.lastShift) {
              if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
              if (k === 'back') { this.lastShift = null; this.setMode('hub'); return; }
              if (k === 'ok') {
                const toChecklist = this.sel === 1;
                this.lastShift = null;
                if (toChecklist) this.setMode('checklist'); else ui.sfx('select');
              }
              return;
            }
            if (k === 'back') { this.setMode('hub'); return; }
            const sh = g.room().shift;
            if (!sh || sh.done) {
              if (k === 'left' || k === 'right') { this.pIdx = (this.pIdx + (k === 'left' ? 3 : 1)) % 4; ui.sfx('select'); return; }
              if (k === 'ok') { g.startRoomDuty(H.ROOM_CREW[this.pIdx].id); this.cIdx = 0; ui.sfx('confirm'); }
            } else {
              const n = sh.hand.length;
              if (k === 'left' || k === 'right') { this.cIdx = (this.cIdx + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
              if (k === 'ok') this.playCard(this.cIdx);
            }
            return;
          }
          if (this.mode === 'log') {
            if (k === 'back') { this.setMode('hub'); return; }
            if (code === 'KeyF') {
              const out = [];
              for (const m of H.ROOM_REWARDS.logs) { const got = g.claimRoomLog(m.count); if (got) out.push(...got); }
              if (out.length) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); } else { ui.sfx('deny'); ui.toast('Сейчас нет готовых наград журнала.'); }
              return;
            }
            if (k === 'up' || k === 'down') { const n = H.ROOM_LOGS.length; this.lIdx = (this.lIdx + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
            return;
          }
          if (this.mode === 'rewards') {
            if (k === 'back') { this.setMode('hub'); return; }
            if (code === 'KeyF') {
              const out = g.claimEvent('cosmic_home');
              if (out && out.length) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); } else { ui.sfx('deny'); ui.toast('Сейчас нет готовых наград.'); }
              return;
            }
            const MS = H.ROOM_REWARDS.stars;
            if (k === 'up' || k === 'down') { this.rIdx = (this.rIdx + (k === 'up' ? MS.length - 1 : 1)) % MS.length; ui.sfx('select'); return; }
            if (k === 'ok') {
              const out = g.claimRoomStar(MS[this.rIdx].stars);
              if (out) { ui.sfx('chest'); ui.toast('Получено: ' + out.join(', ')); } else ui.sfx('deny');
            }
            return;
          }
          if (this.mode === 'charpick') {
            if (k === 'back') { this.setMode('hub'); return; }
            const n = H.ROOM_REWARDS.chars.length, COLS = 4;
            if (k === 'left' || k === 'right') { this.chIdx = (this.chIdx + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
            if (k === 'up' || k === 'down') { this.chIdx = (this.chIdx + (k === 'up' ? n - COLS : COLS)) % n; ui.sfx('select'); return; }
            if (k === 'ok') this.claimChar();
          }
        }
      });
    },

    openUi_roomstand(p) {
      return this.openRoomStand(p && p.stand ? p.stand - 1 : 0, () => this.finishPending());
    },

    openRoomStand(standIdx, done) {
      const ui = this, g = this.game;
      const startStand = Math.max(0, Math.min(2, standIdx || 0));
      const curId = g.room().stands[startStand];
      const startSel = Math.max(0, H.ROOM_TROPHIES.findIndex(t => t.id === curId));
      return this.push({
        full: true,
        roomStand: true,
        stand: startStand,
        sel: startSel,
        onClose() { if (done) done(); },
        setStand(idx) {
          const s = (idx + 3) % 3;
          if (!g.room().built.includes('gal_' + (s + 1))) {
            ui.sfx('deny');
            ui.toast('Выставочный стенд ' + ['I', 'II', 'III'][s] + ' ещё не построен.');
            return;
          }
          this.stand = s;
          const id = g.room().stands[s], ti = H.ROOM_TROPHIES.findIndex(t => t.id === id);
          if (ti >= 0) this.sel = ti;
          ui.sfx('select');
        },
        place() {
          if (g.guest) { ui.sfx('deny'); ui.toast('Экспонаты выбирает хозяин комнаты.'); return; }
          const t = H.ROOM_TROPHIES[this.sel];
          if (!t) return;
          if (!g.roomTrophyOk(t.id)) {
            ui.sfx('deny');
            ui.toast('Экспонат ещё не получен (' + t.world + ').');
            return;
          }
          if (g.setRoomStand(this.stand, t.id)) {
            ui.sfx('confirm');
            ui.toast('Стенд ' + ['I', 'II', 'III'][this.stand] + ': выставлен «' + t.name + '».');
          }
        },
        draw(c) {
          drawRoomPreview(ui, c, [30, 12]);
          c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(12, 10, 'Галерея редкостей · Выставочные стенды');
          ['I', 'II', 'III'].forEach((rom, i) => {
            const built = g.room().built.includes('gal_' + (i + 1));
            ui.button(320 + i * 86, 10, 80, 22, 'Стенд ' + rom, () => this.setStand(i), { size: 10, active: this.stand === i, disabled: !built });
          });
          ui.closeBtn(W - 32, 10, () => ui.pop());

          ui.win(18, 44, 290, 396, { title: 'Коллекция диковинок' });
          const rows = H.ROOM_TROPHIES.map(t => {
            const ok = g.roomTrophyOk(t.id), onStand = g.room().stands.indexOf(t.id);
            return {
              label: ok ? t.name : '??? · ' + t.world,
              right: onStand >= 0 ? 'Стенд ' + ['I', 'II', 'III'][onStand] : ok ? 'В запасе' : 'Закрыто',
              col: ok ? C.cream : C.dim,
              rcol: onStand >= 0 ? C.gold : ok ? C.sub : C.dim
            };
          });
          ui.list(28, 68, 270, rows, this.sel, { rowH: 36, max: 10, size: 11, onClick: i => { if (this.sel === i) this.place(); else { this.sel = i; ui.sfx('select'); } } });

          const t = H.ROOM_TROPHIES[this.sel] || H.ROOM_TROPHIES[0], ok = g.roomTrophyOk(t.id), curOnThis = g.room().stands[this.stand] === t.id;
          ui.win(318, 44, 304, 396);
          if (ok) drawTrophyArt(c, g, t.id, 470, 150);
          else ui.domainLock(c, 470, 146, C.dim);
          ui.text(ok ? t.name : 'Неизвестная редкость', 470, 210, { align: 'center', size: 14, bold: true, serif: true, col: ok ? C.gold : C.dim });
          ui.text('Происхождение: ' + t.world, 470, 232, { align: 'center', size: 10, col: C.sub });
          c.fillStyle = C.brassDk; c.fillRect(334, 250, 272, 1);
          ui.wrap(ok ? t.desc : 'Пройдите сюжет мира «' + t.world + '», чтобы пополнить коллекцию этим памятным трофеем.', 272, 11).slice(0, 6).forEach((l, j) => ui.text(l, 334, 262 + j * 15, { size: 11, col: ok ? C.cream : C.dim }));
          if (!g.guest) {
            ui.button(350, 394, 240, 30, !ok ? 'Экспонат не получен' : curOnThis ? 'Стоит на этом стенде' : 'Выставить на Стенд ' + ['I', 'II', 'III'][this.stand], () => this.place(), { active: ok && !curOnThis, disabled: !ok || curOnThis, bold: true });
          }
          ui.hints([['Q/E', 'Стенд'], ['↑↓', 'Экспонат'], ['Enter', 'Выставить'], ['Esc', 'Назад']], 14, HGT - 16);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || k === 'left') { this.setStand(this.stand - 1); return; }
          if (code === 'KeyE' || k === 'right') { this.setStand(this.stand + 1); return; }
          if (ui.listNav(this, k, H.ROOM_TROPHIES.length)) return;
          if (k === 'ok') this.place();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
