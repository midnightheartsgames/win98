(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const walls = new Map(), pics = new Map();
  const LATIN_GRID = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  const pad2 = n => String(n).padStart(2, '0');
  const dateOf = ms => { const d = new Date(ms); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const latinOfKey = code => (/^Key[A-Z]$/.test(code) ? code[3] : /^Digit[0-9]$/.test(code) ? code[5] : /^Numpad[0-9]$/.test(code) ? code[6] : code === 'Space' || code === 'Minus' ? '' : null);

  function paintWall(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#d8381c'); bg.addColorStop(0.3, '#b82418'); bg.addColorStop(1, '#6a1210');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w * 0.62, cy = 56;
    for (let i = 0; i < 28; i++) {
      const a = i * Math.PI / 14, a2 = a + Math.PI / 28;
      g.fillStyle = i % 2 ? 'rgba(255,190,60,0.32)' : 'rgba(255,120,40,0.2)';
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 340, cy + Math.sin(a) * 340); g.lineTo(cx + Math.cos(a2) * 340, cy + Math.sin(a2) * 340); g.closePath(); g.fill();
    }
    const sun = (x, y, r) => {
      g.strokeStyle = '#f0b030'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#ffd860'; g.beginPath(); g.arc(x, y, r * 0.5, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillStyle = '#f0b030'; g.fillRect(Math.round(x + Math.cos(a) * r * 1.35) - 2, Math.round(y + Math.sin(a) * r * 1.35) - 2, 4, 4); }
    };
    for (const [x, y, r] of [[34, 40, 16], [226, 120, 18], [40, 200, 22], [210, 300, 24], [60, 400, 20]]) sun(x, y, r);
    g.fillStyle = 'rgba(50,8,6,0.2)';
    for (let y = 0; y < h; y += 2) for (let x = y % 4; x < w; x += 4) g.fillRect(x, y, 1, 1);
    if (H.SPEAKERS.pompom) G.drawPortrait(g, H.SPEAKERS.pompom.look, w - 84, 18, 72);
  }

  Object.assign(H.UI.prototype, {
    phoneDots(c, x, y) {
      c.fillStyle = '#000'; c.fillRect(x, y, 32, 18);
      c.fillStyle = '#2a3268'; c.fillRect(x + 1, y + 1, 30, 16);
      c.fillStyle = 'rgba(170,190,255,0.35)'; c.fillRect(x + 1, y + 1, 30, 1);
      c.fillStyle = C.cream;
      for (let i = 0; i < 3; i++) c.fillRect(x + 9 + i * 6, y + 8, 3, 3);
      this.hit(x, y, 32, 18, () => this.openPhoneMenu());
    },

    phoneSign(c, dx, dy, dw) {
      const g = this.game, p = g.state.profile, sign = p && p.sign, x = dx + 74, y = dy + 66, w = dw - 86;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y - 1, w, 15);
      this.text(this.fitText(sign || 'Просмотр профиля', 10, w - 8), x + 4, y + 1, { size: 10, col: sign ? C.cream : C.sub });
      if (this.openProfile) this.hit(x, y - 1, w, 15, () => this.openProfile());
    },

    wardrobeList(mine) {
      const g = this.game, ids = Object.keys(H.OUTFITS), rank = id => (g.outfitOf(H.OUTFITS[id].char) === id ? 0 : g.ownsOutfit(id) ? 1 : 2);
      return ids.filter(id => !mine || g.ownsOutfit(id)).map((id, i) => ({ id, i })).sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i).map(x => x.id);
    },

    openWardrobe() {
      const ui = this, g = this.game, COLS = 3, ROWS = 2, CW = 120, CH = 162, GAP = 10, GX = 236, GY = 46;
      return this.push({
        full: true, sc: { top: 0 }, mine: !!ui.wardMine, wardId: null, order: null,
        list() { if (!this.order) this.order = ui.wardrobeList(this.mine); return this.order; },
        setMine(on) {
          if (this.mine === on) return;
          this.mine = on; ui.wardMine = on; this.order = null; this.sel = 0; this.sc.top = 0;
          ui.sfx('select');
        },
        act() {
          const id = this.list()[this.sel];
          if (!id) { ui.sfx('deny'); return; }
          const o = H.OUTFITS[id], ch = H.CHARS[o.char], who = o.char === 'trail' ? g.state.name : ch.name;
          if (!g.ownsOutfit(id)) {
            if (g.state.jade >= o.price) ui.openOutfitBuy(id);
            else ui.openSupply('fashion', id);
            return;
          }
          if (!g.state.roster[o.char]) { ui.sfx('deny'); ui.toast('Наряд в коллекции. Наденьте его, когда ' + who + ' будет в экипаже.'); return; }
          if (g.outfitOf(o.char) === id) { g.wearOutfit(o.char, null); ui.sfx('cancel'); ui.toast(who + ': обычный наряд.'); return; }
          g.wearOutfit(o.char, id);
          ui.sfx('confirm');
          ui.toast(who + ': надет наряд «' + o.name + '».');
        },
        draw(c) {
          const s = g.state, list = this.list();
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Наряды');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          const owned = Object.keys(H.OUTFITS).filter(id => g.ownsOutfit(id)).length;
          ui.text('В коллекции: ' + owned + ' из ' + Object.keys(H.OUTFITS).length, 104, 15, { size: 11, bold: true, col: C.gold });
          ui.money(W - 150, 15, 'jade', s.jade);
          ui.button(GX, 12, 62, 24, 'Все', () => this.setMine(false), { size: 11, active: !this.mine });
          ui.button(GX + 66, 12, 62, 24, 'Мои', () => this.setMine(true), { size: 11, active: this.mine });
          ui.keycap(GX + 134, 17, 'F');
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          const rows = Math.ceil(list.length / COLS), top = ui.listTop(this.sc, Math.floor(this.sel / COLS), rows, ROWS);
          ui.wheelZone(GX, GY, COLS * (CW + GAP), ROWS * (CH + GAP), d => { this.sc.top += d; });
          list.slice(top * COLS, (top + ROWS) * COLS).forEach((id, j) => {
            const i = top * COLS + j, x = GX + (j % COLS) * (CW + GAP), y = GY + Math.floor(j / COLS) * (CH + GAP);
            ui.wardrobeCard(c, id, x, y, i === this.sel, false);
            ui.hit(x, y, CW, CH, () => { if (this.sel === i) this.act(); else { this.sel = i; ui.sfx('select'); } });
          });
          if (rows > ROWS) ui.scrollBar(GX + COLS * (CW + GAP) + 2, GY, ROWS * (CH + GAP) - GAP, this.sc, rows, ROWS);
          if (!list.length) ui.text('Нарядов пока нет. Они продаются в Снабжении.', GX + 190, 200, { align: 'center', col: C.dim });
          this.drawPreview(c, list[this.sel]);
          ui.hints([['←↑↓→', 'Наряд'], ['Enter', 'Надеть или снять'], ['F', 'Все или мои'], ['V', 'Катсцены'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        drawPreview(c, id) {
          const x = 12, y = 44, w = 212, h = 286;
          c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
          if (!id) return;
          const o = H.OUTFITS[id], ch = H.CHARS[o.char], own = g.ownsOutfit(id), worn = g.outfitOf(o.char) === id, inCrew = !!g.state.roster[o.char], who = o.char === 'trail' ? g.state.name : ch.name;
          c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
          c.imageSmoothingEnabled = false;
          c.drawImage(H.outfitShowcase(id), x, y, w, h);
          ui.platform(c, x + w / 2, y + h - 20, 72);
          G.drawFigure(c, H.outfitLook(id, g.state.gender), x + w / 2, y + h - 16, 2.5);
          c.restore();
          c.strokeStyle = C.brass; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.lineWidth = 1;
          const ts = [14, 13, 12, 11].find(sz => ui.measure(o.name, sz, true, true) <= w) || 11;
          ui.text(o.name, x, y + h + 8, { size: ts, bold: true, serif: true, col: C.gold });
          ui.text(who + ' · ' + '★'.repeat(o.rarity) + ' ' + o.kind, x, y + h + 27, { size: 10, col: G.RARITY[o.rarity] });
          ui.wrap(H.OUTFIT_TIER[o.rarity].perk + '.', w, 10).slice(0, 2).forEach((l, i) => ui.text(l, x, y + h + 42 + i * 12, { size: 10, col: '#c8d0f0' }));
          const label = !own ? (g.state.jade >= o.price ? 'Купить' : 'В Снабжение') : !inCrew ? 'Героя нет в экипаже' : worn ? 'Снять' : 'Надеть';
          ui.button(x, 424, w, 26, label, () => this.act(), { size: 12, bold: true, active: own && inCrew, disabled: own && !inCrew });
          if (o.cuts) { ui.button(x + w - 74, y + 6, 68, 20, 'Катсцены', () => ui.openOutfitCuts(id), { size: 9 }); }
        },
        key(k, code) {
          const list = this.list(), n = list.length;
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyF') { this.setMine(!this.mine); return; }
          if (code === 'KeyV') { const id = list[this.sel]; if (id && H.OUTFITS[id].cuts) ui.openOutfitCuts(id); else ui.sfx('deny'); return; }
          if (k === 'ok') { this.act(); return; }
          const to = k === 'left' ? this.sel - 1 : k === 'right' ? this.sel + 1 : k === 'up' ? this.sel - COLS : k === 'down' ? Math.min(n - 1, this.sel + COLS) : this.sel;
          if (to !== this.sel && to >= 0 && to < n && !(k === 'down' && Math.floor(to / COLS) === Math.floor(this.sel / COLS))) { this.sel = to; ui.sfx('select'); }
        }
      });
    },

    phoneWallSource(skin) {
      const src = H.PHONE_PIX && H.PHONE_PIX[skin.wall];
      if (src && typeof Image !== 'undefined') {
        let im = pics.get(skin.wall);
        if (!im) { im = new Image(); im.src = src; pics.set(skin.wall, im); }
        if (im.complete && im.naturalWidth) return im;
      }
      let cv = walls.get(skin.wall);
      if (!cv) { cv = G.mkCanvas(268, 464); paintWall(cv.getContext('2d'), 268, 464); walls.set(skin.wall, cv); }
      return cv;
    },

    phoneWall(c, skin, x, y, w, h) {
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(this.phoneWallSource(skin), x, y, w, h);
      c.imageSmoothingEnabled = was;
    },

    phoneThumb(c, id, x, y, w, h) {
      const skin = H.PHONE_SKINS[id];
      G.rarityCell(c, x, y, w, h, skin.rar);
      if (skin.wall) this.phoneWall(c, skin, x + 2, y + 2, w - 4, h - 4);
      else {
        const gr = c.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, skin.win[0]); gr.addColorStop(1, skin.win[1]);
        c.fillStyle = gr; c.fillRect(x + 2, y + 2, w - 4, h - 4);
        G.menuIcon(c, 'phone', x + (w - 26) / 2, y + (h - 26) / 2, 26, '#c8cce4');
      }
    },

    openPhoneDecor() {
      const ui = this, g = this.game, ids = Object.keys(H.PHONE_SKINS), COLS = 3, CW = 68, CH = 96;
      const fake = { sel: -1, rail: -1, railSel: 0 };
      return this.push({
        full: true, phoneDecor: true,
        act() {
          const id = ids[this.sel], skin = H.PHONE_SKINS[id];
          if (!g.ownsSkin(id)) { ui.sfx('deny'); ui.toast(skin.how || 'Эти обои пока не получены.'); return; }
          if (g.phoneSkinId() === id) { ui.sfx('deny'); return; }
          g.setPhoneSkin(id);
          ui.sfx('confirm');
          ui.toast('Обои установлены: «' + skin.name + '».');
        },
        draw(c) {
          const cur = g.phoneSkinId(), id = ids[this.sel], skin = H.PHONE_SKINS[id], own = g.ownsSkin(id), used = cur === id;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Украшения для смартфона');
          ui.text('Обои для смартфона', 16, 36, { size: 12, bold: true, col: C.cream });
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ids.forEach((sid, i) => {
            const x = 12 + (i % COLS) * (CW + 4), y = 56 + Math.floor(i / COLS) * (CH + 6), s0 = H.PHONE_SKINS[sid], on = i === this.sel, has = g.ownsSkin(sid);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 2, y - 2, CW + 4, CH + 4); }
            ui.phoneThumb(c, sid, x, y, CW, CH);
            if (!has) { c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(x, y, CW, CH); ui.domainLock(c, x + CW / 2, y + CH / 2 - 8, C.cream); }
            const nameLines = ui.wrap(s0.name, CW - 4, 9).slice(0, 2), nameBand = 5 + nameLines.length * 11;
            c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(x, y + CH - nameBand, CW, nameBand);
            nameLines.forEach((line, n) => ui.text(line, x + CW / 2, y + CH - nameBand + 3 + n * 11, { size: 9, align: 'center', col: on ? C.gold : C.cream }));
            if (cur === sid) { c.fillStyle = 'rgba(120,20,16,0.9)'; c.fillRect(x, y, CW, 13); ui.text('Используется', x + CW / 2, y + 2, { size: 8, bold: true, align: 'center', col: C.cream }); }
            ui.hit(x, y, CW, CH, () => { if (this.sel === i) this.act(); else { this.sel = i; ui.sfx('select'); } });
          });
          c.save();
          c.translate(232 - 318 * 0.8, 40 - 8 * 0.8);
          c.scale(0.8, 0.8);
          ui.drawPhone(c, fake, { preview: true, skin: own ? skin : H.PHONE_SKINS[id] });
          c.restore();
          const x = 492, wid = 136;
          ui.wrap(skin.name, wid, 14, true, true).slice(0, 2).forEach((l, i) => ui.text(l, x, 60 + i * 18, { size: 14, bold: true, serif: true, col: C.gold }));
          ui.wrap(skin.quote, wid, 10).slice(0, 9).forEach((l, i) => ui.text(l, x, 104 + i * 13, { size: 10, col: '#c8d0f0' }));
          if (!own && skin.how) ui.wrap(skin.how, wid, 10).slice(0, 3).forEach((l, i) => ui.text(l, x, 236 + i * 13, { size: 10, col: C.bad }));
          ui.button(x, 380, wid, 30, used ? 'Используется' : own ? 'Установить' : 'Не получено', () => this.act(), { size: 12, bold: true, active: own && !used, disabled: used || !own });
          ui.hints([['←↑↓→', 'Обои'], ['Enter', 'Установить'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        key(k) {
          const n = ids.length;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') { this.act(); return; }
          const to = k === 'left' ? this.sel - 1 : k === 'right' ? this.sel + 1 : k === 'up' ? this.sel - COLS : k === 'down' ? this.sel + COLS : this.sel;
          if (to !== this.sel && to >= 0 && to < n) { this.sel = to; ui.sfx('select'); }
        }
      });
    },

    clipboardText() {
      const android = globalThis.Sr98Android, clip = globalThis.navigator && globalThis.navigator.clipboard;
      if (android && android.clipboardText) return Promise.resolve(android.clipboardText());
      return clip && clip.readText ? clip.readText() : Promise.reject(new Error('no clipboard'));
    },

    copyText(text) {
      const android = globalThis.Sr98Android, clip = globalThis.navigator && globalThis.navigator.clipboard;
      if (android && android.copyText) { android.copyText(text); return Promise.resolve(); }
      return clip && clip.writeText ? clip.writeText(text) : Promise.reject(new Error('no clipboard'));
    },

    openTextEntry(o) {
      const ui = this, X = o.side ? 18 : 130, Y = 70, WID = 380, COLS = o.cols, GX = X + 22, CELL = Math.floor(336 / COLS), ROW = 24;
      const pages = o.pages || [{ grid: o.grid }], SIZE = pages[0].grid.length, rows = Math.ceil(SIZE / COLS), many = pages.length > 1, HEI = 134 + rows * ROW;
      const bottom = many
        ? [{ id: 'erase', label: '←', dx: 0, w: 40 }, { id: 'space', label: 'Пробел', dx: 44, w: 74 }, { id: 'page', dx: 122, w: 44 }, { id: 'clear', label: 'Очистить', dx: 170, w: 76 }, { id: 'ok', label: o.okLabel, dx: 250, w: 86 }]
        : o.paste
          ? [{ id: 'erase', label: '←', dx: 0, w: 40 }, { id: 'clear', label: 'Очистить', dx: 44, w: 84 }, { id: 'paste', label: 'Вставить', dx: 132, w: 84 }, { id: 'ok', label: o.okLabel, dx: 220, w: 116 }]
          : [{ id: 'erase', label: '←', dx: 0, w: 60 }, { id: 'clear', label: 'Очистить', dx: 67, w: 110 }, { id: 'ok', label: o.okLabel, dx: 184, w: 150 }];
      const OK = SIZE + bottom.length - 1;
      return this.push({
        textEntry: true, value: o.value || '', sel: OK, note: null, page: 0,
        grid() { return pages[this.page].grid; },
        type(ch) {
          if (this.value.length >= o.max) { ui.sfx('deny'); return; }
          this.value += ch; this.note = null; ui.sfx('select');
        },
        erase() {
          if (!this.value) { ui.sfx('deny'); return; }
          this.value = this.value.slice(0, -1); this.note = null; ui.sfx('select');
        },
        takeText(text) {
          if (!o.paste) return;
          const value = o.paste(String(text || ''));
          if (!value) { this.note = { ok: false, text: o.pasteMiss }; ui.sfx('deny'); return; }
          this.value = value; this.note = null; this.sel = OK; ui.sfx('select');
        },
        readClipboard() {
          ui.clipboardText().then(text => this.takeText(text), () => { this.note = { ok: false, text: 'Браузер не дал доступ к буферу. Нажмите Ctrl+V.' }; ui.sfx('deny'); });
        },
        submit() {
          const res = o.submit(this.value);
          this.note = res;
          if (res.wait) return;
          ui.sfx(res.ok ? o.okSfx || 'chest' : 'deny');
          if (!res.ok) return;
          this.value = '';
          if (o.closeOnOk) ui.screens.pop();
        },
        press(i) {
          if (i < SIZE) { this.type(this.grid()[i]); return; }
          const id = bottom[i - SIZE].id;
          if (id === 'ok') this.submit();
          else if (id === 'erase') this.erase();
          else if (id === 'space') this.type(' ');
          else if (id === 'page') { this.page = (this.page + 1) % pages.length; ui.sfx('select'); }
          else if (id === 'paste') this.readClipboard();
          else { this.value = ''; this.note = null; ui.sfx('select'); }
        },
        drawField(c, fy) {
          if (o.max <= 16) {
            const cellW = Math.floor((WID - 40) / o.max), fx = X + Math.round((WID - cellW * o.max) / 2);
            for (let i = 0; i < o.max; i++) {
              const here = i === this.value.length;
              c.fillStyle = '#04061a'; c.fillRect(fx + i * cellW, fy, cellW - 1, 24);
              c.strokeStyle = here ? C.brassHi : '#3a4070'; c.strokeRect(fx + i * cellW + 0.5, fy + 0.5, cellW - 2, 23);
              if (this.value[i]) ui.text(this.value[i], fx + i * cellW + (cellW - 1) / 2, fy + 5, { size: 13, bold: true, align: 'center', col: C.gold });
            }
            return;
          }
          c.fillStyle = '#04061a'; c.fillRect(X + 20, fy, WID - 40, 24);
          c.strokeStyle = C.brassHi; c.strokeRect(X + 20.5, fy + 0.5, WID - 41, 23);
          ui.text(ui.fitText(this.value + '_', 12, WID - 90), X + 26, fy + 5, { size: 12, col: C.gold });
          ui.text(this.value.length + '/' + o.max, X + WID - 26, fy + 6, { size: 10, align: 'right', col: C.sub });
        },
        draw(c) {
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(X, Y, WID, HEI, { title: o.title });
          this.drawField(c, Y + 34);
          const note = this.note;
          ui.text(note ? note.text : o.hint, X + WID / 2, Y + 64, { size: 11, align: 'center', bold: !!note, col: note ? (note.ok ? '#8fe08a' : '#ff9a8a') : C.sub });
          const gy = Y + 84;
          this.grid().forEach((ch, i) => {
            const x = GX + (i % COLS) * CELL, y = gy + Math.floor(i / COLS) * ROW;
            ui.button(x, y, CELL - 2, ROW - 2, ch, () => { this.sel = i; this.press(i); }, { bold: true, active: this.sel === i });
          });
          const by = gy + rows * ROW + 6;
          bottom.forEach((b, n) => ui.button(GX + b.dx, by, b.w, 28, b.id === 'page' ? pages[(this.page + 1) % pages.length].label : b.label, () => { this.sel = SIZE + n; this.press(SIZE + n); }, { bold: b.id === 'ok', size: many ? 11 : 12, active: this.sel === SIZE + n }));
          if (o.side) o.side(c, X + WID + 8, Y, W - X * 2 - WID - 8, HEI);
          ui.hints(o.hints, 14, HGT - 18);
        },
        key(k, code, e) {
          const ch = e && (e.ctrlKey || e.metaKey || e.altKey) ? null : o.read(code, e);
          if (ch === '') return;
          if (ch) { this.type(ch); this.sel = OK; return; }
          if (code === 'Backspace') { this.erase(); return; }
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') { this.press(this.sel); return; }
          const to = this.step(k);
          if (to !== this.sel) { this.sel = to; ui.sfx('select'); }
        },
        step(k) {
          const s = this.sel;
          if (s >= SIZE) {
            if (k === 'left') return Math.max(SIZE, s - 1);
            if (k === 'right') return Math.min(OK, s + 1);
            if (k === 'up') return Math.min(SIZE - 1, (rows - 1) * COLS + Math.floor((s - SIZE) / bottom.length * COLS));
            return s;
          }
          if (k === 'left') return s % COLS ? s - 1 : s;
          if (k === 'right') return s % COLS < COLS - 1 && s + 1 < SIZE ? s + 1 : s;
          if (k === 'up') return s >= COLS ? s - COLS : s;
          if (k === 'down') return s + COLS < SIZE ? s + COLS : SIZE + Math.floor((s % COLS) / COLS * bottom.length);
          return s;
        }
      });
    },

    openLatinEntry(o) {
      return this.openTextEntry(Object.assign({ grid: LATIN_GRID, cols: 6, read: latinOfKey }, o));
    },

    openPromo() {
      const ui = this, g = this.game;
      return this.openLatinEntry({
        title: 'Промокод', max: 16, okLabel: 'Активировать',
        hint: 'Код набирается латиницей, раскладка не важна.',
        hints: [['A-Z 0-9', 'Ввод'], ['Backspace', 'Стереть'], ['↑↓←→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        submit: text => g.redeemPromo(text),
        side(c, x, y, w, h) {
          ui.win(x, y, w, h, { title: 'Введённые коды' });
          const used = g.promosUsed();
          if (!used.length) ui.text('Пока ни одного кода.', x + w / 2, y + 44, { size: 11, align: 'center', col: C.dim });
          used.slice(0, 6).forEach((u, i) => {
            const ry = y + 34 + i * 42;
            c.fillStyle = 'rgba(30,38,90,0.6)'; c.fillRect(x + 8, ry, w - 16, 38);
            ui.text(ui.fitText(u.code, 11, w - 28, true), x + 14, ry + 3, { size: 11, bold: true, col: C.gold });
            ui.text(ui.fitText(u.title, 10, w - 28), x + 14, ry + 15, { size: 10, col: C.cream });
            ui.text(dateOf(u.at), x + 14, ry + 26, { size: 9, col: C.dim });
          });
        }
      });
    },

    phoneMenuItems() {
      const ui = this, g = this.game, intro = !!g.state.flags.express_intro;
      return [
        { label: 'Профиль Первопроходца', icon: 'chars', fn: ui.openProfile && (() => ui.openProfile()) },
        { label: 'Друзья', icon: 'friends', lock: !intro, fn: ui.openFriends && (() => ui.openFriends(0)) },
        { label: 'Украшения для смартфона', icon: 'phone', fn: ui.openPhoneDecor && (() => ui.openPhoneDecor()) },
        { label: 'Наряды', icon: 'outfit', lock: !intro, fn: ui.openWardrobe && (() => ui.openWardrobe()) },
        { label: 'Промокод', icon: 'gift', lock: !intro, fn: ui.openPromo && (() => ui.openPromo()) }
      ];
    },

    openPhoneMenu() {
      const ui = this, X = 346, Y = 58, ROW = 28, WID = 236;
      this.push({
        act() {
          const it = ui.phoneMenuItems()[this.sel];
          if (!it.fn) { ui.sfx('deny'); ui.toast('«' + it.label + '» появится позже.'); return; }
          if (it.lock) { ui.sfx('deny'); ui.toast('«' + it.label + '» доступно после знакомства с Экспрессом.'); return; }
          ui.screens.pop();
          it.fn();
        },
        draw(c) {
          const items = ui.phoneMenuItems();
          ui.hit(0, 0, W, HGT, () => ui.pop());
          c.fillStyle = 'rgba(2,3,14,0.35)'; c.fillRect(0, 0, W, HGT);
          ui.win(X, Y, WID, items.length * ROW + 16, { top: '#1c2458', bottom: '#0a0e30', alpha: 0.98 });
          items.forEach((it, i) => {
            const y = Y + 8 + i * ROW, on = i === this.sel, off = !it.fn || it.lock;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.2)'; c.fillRect(X + 6, y, WID - 12, ROW - 2); c.fillStyle = C.brassHi; c.fillRect(X + 6, y, 2, ROW - 2); }
            G.menuIcon(c, it.icon, X + 12, y + 4, 18, off ? '#4c5070' : on ? '#fff0c0' : '#d8dcf0');
            ui.text(ui.fitText(it.label, 11, WID - (it.fn ? 48 : 84), on), X + 36, y + 7, { size: 11, bold: on, col: off ? C.dim : on ? C.gold : C.cream });
            if (!it.fn) ui.text('Скоро', X + WID - 12, y + 8, { size: 9, align: 'right', col: C.dim });
            ui.hit(X + 6, y, WID - 12, ROW - 2, () => { this.sel = i; this.act(); });
          });
        },
        key(k, code) {
          if (k === 'back' || code === 'Tab') { ui.pop(); return; }
          if (ui.listNav(this, k, ui.phoneMenuItems().length)) return;
          if (k === 'ok') this.act();
        }
      });
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
