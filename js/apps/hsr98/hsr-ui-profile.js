(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const RU = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя.,!?-:;()«»'.split('');
  const LAT = 'abcdefghijklmnopqrstuvwxyz0123456789.,!?-:;('.split('');
  const upper = grid => grid.map(ch => ch.toUpperCase());
  const TEXT_PAGES = [{ label: 'абв', grid: RU }, { label: 'АБВ', grid: upper(RU) }, { label: 'abc', grid: LAT }, { label: 'ABC', grid: upper(LAT) }];
  const TEXT_KEY = /^[0-9A-Za-zА-Яа-яЁё .,!?:;()«»"'+=%№-]$/;
  const textOfKey = (code, e) => (e && e.key && e.key.length === 1 && TEXT_KEY.test(e.key) ? e.key : null);
  const pad2 = n => String(n).padStart(2, '0');
  const PROFILE_TABS = [{ id: 'rec', label: 'Боевые заслуги' }, { id: 'chars', label: 'Персонажи' }, { id: 'coll', label: 'Коллекции' }];
  const TAB_CHARS = PROFILE_TABS.findIndex(t => t.id === 'chars');
  const REC_ICONS = { fh: 'ipg', pf: 'archive', su: 'nav', cw: 'shop', hd: 'team', boss: 'mission', warp: 'warp', time: 'events' };
  const COLL_ICONS = { five: 'chars', four: 'team', cones: 'cones', outfits: 'outfit', pets: 'pet', foes: 'foes', fusions: 'fusions', chests: 'bag' };
  const ROW_LABEL = {
    merit: { fh: 'Зал забвения', pf: 'Чистый вымысел', su: 'Виртуальная вселенная', cw: 'Валютные войны', hd: 'Рубеж Экспресса', boss: 'Боссов побеждено', warp: 'Прыжков', time: 'В пути' },
    coll: { five: 'Персонажи 5★', four: 'Персонажи 4★', cones: 'Световые конусы', outfits: 'Наряды', pets: 'Питомцы', foes: 'Враги в Архиве', fusions: 'Слияния', chests: 'Сундуки' }
  };
  const REC_ROW = 36, COLL_ROW = 34, ROWS_Y = 48;
  const CARD_STOPS = [
    { id: 'avatar', x: 22, y: 50, w: 64, h: 64 },
    { id: 'name', x: 92, y: 50, w: 94, h: 24 },
    { id: 'bday', x: 20, y: 122, w: 164, h: 20 },
    { id: 'sign', x: 20, y: 168, w: 164, h: 76 },
    { id: 'room', x: 222, y: 424, w: 172, h: 26 }
  ];
  const WIDE_CARD_STOPS = [
    { id: 'avatar', x: -85, y: 50, w: 64, h: 64 },
    { id: 'name', x: -13, y: 50, w: 152, h: 24 },
    { id: 'bday', x: -87, y: 122, w: 224, h: 20 },
    { id: 'sign', x: -87, y: 168, w: 224, h: 76 },
    { id: 'room', x: 178, y: 424, w: 172, h: 26 }
  ];
  const FIRST_TAB_STOP = CARD_STOPS.length;
  const rowStops = (ids, row) => ids.map((rowId, i) => ({ id: 'row', rowId, i, x: 422, y: ROWS_Y + i * row, w: 200, h: row - 3 }));
  const wideRowStops = ids => ids.map((rowId, i) => ({ id: 'row', rowId, i, x: 394, y: 50 + i * 48, w: 331, h: 43 }));
  const SLOT_STOPS = [
    { id: 'show', i: 0, x: 424, y: 68, w: 62, h: 100 },
    { id: 'show', i: 1, x: 491, y: 68, w: 62, h: 100 },
    { id: 'show', i: 2, x: 558, y: 68, w: 62, h: 100 },
    { id: 'comp', i: 0, x: 424, y: 201, w: 36, h: 56 },
    { id: 'comp', i: 1, x: 464, y: 201, w: 36, h: 56 },
    { id: 'comp', i: 2, x: 504, y: 201, w: 36, h: 56 },
    { id: 'comp', i: 3, x: 544, y: 201, w: 36, h: 56 },
    { id: 'comp', i: 4, x: 584, y: 201, w: 36, h: 56 }
  ];
  const WIDE_SLOT_STOPS = [
    { id: 'show', i: 0, x: 396, y: 68, w: 103, h: 122 },
    { id: 'show', i: 1, x: 508, y: 68, w: 103, h: 122 },
    { id: 'show', i: 2, x: 620, y: 68, w: 103, h: 122 },
    { id: 'comp', i: 0, x: 396, y: 218, w: 62, h: 82 },
    { id: 'comp', i: 1, x: 462, y: 218, w: 62, h: 82 },
    { id: 'comp', i: 2, x: 528, y: 218, w: 62, h: 82 },
    { id: 'comp', i: 3, x: 594, y: 218, w: 62, h: 82 },
    { id: 'comp', i: 4, x: 660, y: 218, w: 62, h: 82 }
  ];
  const TAB_STOPS = [
    CARD_STOPS.concat(rowStops(Object.keys(REC_ICONS), REC_ROW)),
    CARD_STOPS.concat(SLOT_STOPS),
    CARD_STOPS.concat(rowStops(Object.keys(COLL_ICONS), COLL_ROW))
  ];
  const WIDE_TAB_STOPS = [
    WIDE_CARD_STOPS.concat(wideRowStops(Object.keys(REC_ICONS))),
    WIDE_CARD_STOPS.concat(WIDE_SLOT_STOPS),
    WIDE_CARD_STOPS.concat(wideRowStops(Object.keys(COLL_ICONS)))
  ];
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

  function stopFrom(stops, from, k) {
    const dir = DIRS[k], cur = stops[from], cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
    let best = from, score = Infinity;
    stops.forEach((s, i) => {
      if (i === from) return;
      const dx = s.x + s.w / 2 - cx, dy = s.y + s.h / 2 - cy, along = dx * dir[0] + dy * dir[1], across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
      if (along <= 0 || along + across * 2 >= score) return;
      score = along + across * 2; best = i;
    });
    return best;
  }

  function paintRoom(g, vw = W, sx = 200) {
    g.fillStyle = '#4a1420'; g.fillRect(0, 0, vw, HGT);
    g.fillStyle = '#3a0e18';
    for (let y = 0; y < 400; y += 2) for (let x = y % 4; x < vw; x += 4) g.fillRect(x, y, 1, 1);
    g.fillStyle = 'rgba(214,170,92,0.1)';
    for (let y = 16; y < 400; y += 32) for (let x = (y % 64 ? 16 : 0); x < vw; x += 32) { g.fillRect(x + 7, y, 2, 6); g.fillRect(x + 5, y + 2, 6, 2); }
    const dado = g.createLinearGradient(0, 400, 0, HGT);
    dado.addColorStop(0, '#5a3418'); dado.addColorStop(1, '#2a1608');
    g.fillStyle = dado; g.fillRect(0, 400, vw, HGT - 400);
    g.fillStyle = '#c09a50'; g.fillRect(0, 398, vw, 2);
    g.fillStyle = '#1a0c04'; g.fillRect(0, 400, vw, 1);
    for (let x = 0; x < vw; x += 64) { g.fillStyle = '#1a0c04'; g.fillRect(x, 410, 1, 60); g.fillStyle = 'rgba(255,214,150,0.14)'; g.fillRect(x + 1, 410, 1, 60); }
    g.fillStyle = '#100a24'; g.fillRect(sx, 40, 216, 346);
    const glow = g.createLinearGradient(0, 56, 0, 386);
    glow.addColorStop(0, 'rgba(255,226,170,0.32)'); glow.addColorStop(1, 'rgba(255,226,170,0.04)');
    g.fillStyle = glow; g.beginPath(); g.moveTo(sx + 78, 56); g.lineTo(sx + 138, 56); g.lineTo(sx + 204, 386); g.lineTo(sx + 12, 386); g.closePath(); g.fill();
    for (const [x0, flip] of [[sx, 1], [sx + 216, -1]]) {
      for (let i = 0; i < 9; i++) {
        const wid = 34 - i * 2, x = x0 + flip * (i * 3);
        g.fillStyle = i % 2 ? '#8a1c24' : '#6a1018';
        if (flip > 0) g.fillRect(x, 40, Math.max(2, wid - i * 2), 346);
        else g.fillRect(x - Math.max(2, wid - i * 2), 40, Math.max(2, wid - i * 2), 346);
      }
    }
    g.fillStyle = '#7a1820'; g.fillRect(sx - 4, 36, 224, 26);
    g.fillStyle = '#5a0e16';
    for (let x = sx - 4; x < sx + 220; x += 14) g.fillRect(x, 36, 3, 26);
    g.fillStyle = '#d8b060'; g.fillRect(sx - 4, 62, 224, 2);
    g.fillStyle = '#a07c38';
    for (let x = sx - 2; x < sx + 220; x += 6) g.fillRect(x, 64, 3, 5);
    for (const lx of [sx + 6, sx + 210]) {
      g.fillStyle = '#c09a50'; g.fillRect(lx - 1, 70, 2, 12);
      g.fillStyle = '#ffe8a8'; g.fillRect(lx - 4, 82, 8, 7);
      g.fillStyle = 'rgba(255,232,168,0.25)'; g.fillRect(lx - 8, 78, 16, 15);
    }
    const shelf = g.createLinearGradient(0, 386, 0, 412);
    shelf.addColorStop(0, '#8a5a2a'); shelf.addColorStop(1, '#4a2a10');
    g.fillStyle = '#000'; g.fillRect(sx - 10, 385, 236, 30);
    g.fillStyle = shelf; g.fillRect(sx - 9, 386, 234, 28);
    g.fillStyle = 'rgba(255,224,170,0.4)'; g.fillRect(sx - 9, 386, 234, 1);
    g.fillStyle = '#c09a50'; g.fillRect(sx - 9, 398, 234, 1);
  }

  Object.assign(H.UI.prototype, {
    profileUid() {
      return globalThis.Net98 ? globalThis.Net98.uid() : '700000000';
    },

    profileRoom() {
      if (this.wide && this.wide()) {
        if (!this.profileRoomWideCv) { this.profileRoomWideCv = G.mkCanvas(this.vw, HGT); paintRoom(this.profileRoomWideCv.getContext('2d'), this.vw, 156 - this.left); }
        return this.profileRoomWideCv;
      }
      if (!this.profileRoomCv) { this.profileRoomCv = G.mkCanvas(W, HGT); paintRoom(this.profileRoomCv.getContext('2d'), W, 200); }
      return this.profileRoomCv;
    },

    profileStops(tab) {
      return (this.wide && this.wide() ? WIDE_TAB_STOPS : TAB_STOPS)[tab];
    },

    heroTitle(k) {
      const g = this.game, kit = H.CHARS[g.kitOf(k)];
      return k === 'trail' ? g.state.name : kit.short || kit.name;
    },

    profileSource() {
      const ui = this, g = this.game, s = g.state, p = g.profile(), stage = g.profileStageHero();
      const view = k => {
        if (!k) return null;
        const id = g.kitOf(k), kit = H.CHARS[id], r = s.roster[k];
        return { look: G.lookOf(id, g), rarity: kit.rarity, elem: kit.elem, path: kit.path, title: ui.heroTitle(k), lvl: r.lvl, eid: r.eid };
      };
      return {
        own: true, name: s.name, tl: s.tl.lvl, bday: p.bday, uid: ui.profileUid(), sign: p.sign, presence: null, view,
        avatarLook: G.lookOf(g.kitOf(g.profileAvatar()), g), stageLook: G.lookOf(g.kitOf(stage), g), stageTitle: ui.heroTitle(stage),
        log: p.log.map(e => ui.profileAgo(e.at) + ' ' + g.profileLogText(e)),
        merits: () => g.profileMerits(), coll: () => g.profileCollections(), slot: (id, i) => view(g.profileSlots()[id][i])
      };
    },

    friendRows(list, kind) {
      return list.map(row => Object.assign({ label: ROW_LABEL[kind][row.id] || row.id }, row));
    },

    profileCard(c, scr) {
      const ui = this, d = scr.src, wide = !!(ui.wide && ui.wide());
      const cx = wide ? ui.left + 12 : 12, cw = wide ? 240 : 180, ix = cx + 12, rx = cx + cw - 12, nx = cx + 82, nw = cw - 88;
      ui.win(cx, 40, cw, 404, { top: '#2a1630', bottom: '#120a1c' });
      ui.circlePortrait(c, d.avatarLook, cx + 10, 50, 64, C.brassHi);
      const nameSize = ui.measure(d.name, 15, true, true) > nw ? 11 : 15;
      ui.text(ui.fitText(d.name, nameSize, nw, true), nx, nameSize === 15 ? 54 : 58, { size: nameSize, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brass; c.fillRect(nx, 73, nw - 4, 1);
      ui.text('Ур. Освоения', nx, 80, { size: 10, col: C.sub });
      ui.text(String(d.tl), nx, 92, { size: 16, bold: true, serif: true, col: C.gold });
      ui.text('День рождения', ix, 126, { size: 10, col: C.sub });
      ui.text(d.bday ? pad2(d.bday.d) + '.' + pad2(d.bday.m) : d.own ? 'не указан' : 'скрыт', rx, 126, { size: 11, align: 'right', col: d.bday ? C.cream : C.dim });
      ui.text('UID', ix, 148, { size: 10, col: C.sub });
      ui.text(d.uid, rx, 148, { size: 11, align: 'right', col: C.cream });
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(cx + 8, 168, cw - 16, 76);
      ui.text('Подпись', cx + 14, 172, { size: 10, bold: true, col: C.sub });
      if (d.sign) ui.wrap(d.sign, cw - 30, 11).slice(0, 4).forEach((line, i) => ui.text(line, cx + 14, 186 + i * 14, { size: 11, col: C.cream }));
      else ui.text('Пока пусто.', cx + 14, 186, { size: 11, col: C.dim });
      ui.text('Успехи Освоения', ix, 256, { size: 11, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brass; c.fillRect(ix, 272, cw - 24, 1);
      if (!d.log.length) ui.text('Записей пока нет.', ix, 280, { size: 10, col: C.dim });
      let ly = 280;
      for (const line0 of d.log) {
        const lines = ui.wrap(line0, cw - 24, 10).slice(0, 2);
        if (ly + lines.length * 12 > 438) break;
        lines.forEach((line, i) => ui.text(line, ix, ly + i * 12, { size: 10, col: C.cream }));
        ly += lines.length * 12 + 3;
      }
      if (d.own) { scr.stopHit(0); scr.stopHit(1); scr.stopHit(2); scr.stopHit(3); }
    },

    profileStage(c, scr) {
      const ui = this, d = scr.src, wide = !!(ui.wide && ui.wide()), sx = wide ? 264 : 308;
      ui.platform(c, sx, 378, 58);
      G.drawFigure(c, d.stageLook, sx, 378, 3);
      ui.text(ui.fitText(d.stageTitle, 12, 200, true), sx, 400, { size: 12, bold: true, align: 'center', col: '#fff0c8' });
      if (d.own) ui.button(sx - 86, 424, 172, 26, 'Разместить в комнате', () => { scr.sel = 4; scr.act(); }, { size: 11, active: scr.sel === 4 });
    },

    profileSlot(c, v, st, big) {
      const ui = this, wide = !!(ui.wide && ui.wide());
      if (!v) {
        c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(st.x, st.y, st.w, st.h);
        c.strokeStyle = '#3a4070'; c.strokeRect(st.x + 0.5, st.y + 0.5, st.w - 1, st.h - 1);
        ui.text('+', st.x + st.w / 2, st.y + st.h / 2 - 9, { size: 16, align: 'center', col: C.dim });
        return;
      }
      const size = big ? (wide ? 64 : 56) : (wide ? 46 : 36);
      G.rarityCell(c, st.x, st.y, st.w, st.h, v.rarity);
      G.drawPortrait(c, v.look, st.x + (st.w - size) / 2, st.y + (big ? (wide ? 4 : 2) : (wide ? 3 : 4)), size);
      c.fillStyle = H.ELEMENTS[v.elem].col; c.fillRect(st.x + 2, st.y + 2, wide ? 5 : 4, wide ? 5 : 4);
      if (big) {
        const fy = st.y + (wide ? 72 : 60), fh = st.h - (wide ? 72 : 60);
        c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(st.x, fy, st.w, fh);
        ui.text(ui.fitText(v.title, wide ? 11 : 10, st.w - 6, true), st.x + st.w / 2, fy + (wide ? 4 : 2), { size: wide ? 11 : 10, bold: true, align: 'center', col: C.cream });
        ui.text('Ур. ' + v.lvl, st.x + st.w / 2, fy + (wide ? 19 : 15), { size: 10, align: 'center', col: C.gold });
        ui.text('Эйдолон ' + v.eid, st.x + st.w / 2, fy + (wide ? 33 : 27), { size: 9, align: 'center', col: C.sub });
      } else if (wide) {
        c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(st.x, st.y + 50, st.w, st.h - 50);
        ui.text(ui.fitText(v.title, 9, st.w - 4, true), st.x + st.w / 2, st.y + 53, { size: 9, bold: true, align: 'center', col: C.cream });
        ui.text('Ур. ' + v.lvl, st.x + st.w / 2, st.y + 66, { size: 9, bold: true, align: 'center', col: C.gold });
      } else {
        c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(st.x, st.y + 41, st.w, 15);
        ui.text('Ур. ' + v.lvl, st.x + st.w / 2, st.y + 43, { size: 9, bold: true, align: 'center', col: C.gold });
      }
    },

    profileAgo(at) {
      const days = Math.floor((this.game.now() - at) / 86400000);
      return days > 0 ? days + ' д. назад' : 'Сегодня';
    },

    profileRec(c, scr) {
      const ui = this, wide = !!(ui.wide && ui.wide()), stops = scr.stops();
      ui.win(wide ? 384 : 416, 40, wide ? 351 : 212, wide ? 404 : 296, { top: '#2a1630', bottom: '#120a1c' });
      scr.src.merits().forEach((row, i) => {
        const st = stops[FIRST_TAB_STOP + i];
        if (!st) return;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(st.x, st.y, st.w, st.h);
        G.menuIcon(c, REC_ICONS[row.id] || 'guide', st.x + (wide ? 8 : 4), st.y + (wide ? 10 : 8), wide ? 22 : 20, row.open ? '#f0d8a0' : '#4c5070');
        if (wide) {
          ui.text(row.label, st.x + 38, st.y + 7, { size: 11, bold: true, col: row.open ? C.cream : C.sub });
          ui.text(row.open ? 'Испытание открыто' : 'Режим закрыт', st.x + 38, st.y + 23, { size: 9, col: C.dim });
          ui.text(ui.fitText(row.value, 14, 150, true), st.x + st.w - 10, st.y + 13, { size: 14, bold: true, align: 'right', col: row.open ? C.gold : C.dim });
        } else {
          ui.text(row.label, st.x + 30, st.y + 4, { size: 10, col: C.sub });
          ui.text(ui.fitText(row.value, 13, st.w - 36, true), st.x + 30, st.y + 17, { size: 13, bold: true, col: row.open ? C.gold : C.dim });
        }
        scr.stopHit(FIRST_TAB_STOP + i);
      });
    },

    profileColl(c, scr) {
      const ui = this, wide = !!(ui.wide && ui.wide()), stops = scr.stops();
      if (!scr.coll) scr.coll = scr.src.coll();
      ui.win(wide ? 384 : 416, 40, wide ? 351 : 212, wide ? 404 : 296, { top: '#2a1630', bottom: '#120a1c' });
      scr.coll.forEach((row, i) => {
        const st = stops[FIRST_TAB_STOP + i], full = st && row.total > 0 && row.got >= row.total, pct = row.total ? row.got / row.total : 0;
        if (!st) return;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(st.x, st.y, st.w, st.h);
        G.menuIcon(c, COLL_ICONS[row.id] || 'guide', st.x + (wide ? 8 : 4), st.y + (wide ? 10 : 6), wide ? 22 : 18, '#f0d8a0');
        ui.text(row.label, st.x + (wide ? 38 : 28), st.y + (wide ? 6 : 3), { size: wide ? 11 : 10, bold: wide, col: C.cream });
        if (wide) ui.text(Math.floor(pct * 100) + '%', st.x + st.w - 78, st.y + 7, { size: 10, align: 'right', col: C.sub });
        ui.text(row.got + ' / ' + row.total, st.x + st.w - (wide ? 10 : 6), st.y + (wide ? 6 : 3), { size: wide ? 12 : 11, bold: true, align: 'right', col: full ? '#8fe08a' : C.gold });
        ui.rail(st.x + (wide ? 38 : 28), st.y + (wide ? 26 : 20), st.w - (wide ? 48 : 36), pct);
        scr.stopHit(FIRST_TAB_STOP + i);
      });
    },

    profileRowAct(id) {
      const ui = this, g = this.game, f = g.state.flags, closed = () => { ui.sfx('deny'); ui.toast('Этот режим ещё не открыт.'); };
      const merit = g.profileMerits().find(row => row.id === id);
      if (merit && !merit.open) { closed(); return; }
      if (id === 'fh' || id === 'su') { ui.guideEnter({ kind: id, open: true }); return; }
      if (id === 'pf') { ui.guideEnter(g.guidePf()); return; }
      if (id === 'cw' || id === 'hd') {
        if (g.state.su) { ui.sfx('deny'); ui.toast('Из Виртуальной вселенной сюда не попасть.'); return; }
        if (id === 'cw') ui.openCwHub(); else ui.openHdHub();
        return;
      }
      if (id === 'boss' || id === 'foes') { ui.openBank(null); return; }
      if (id === 'fusions') { ui.openBank(null); ui.top().setTab(1); return; }
      if (id === 'five' || id === 'four') { ui.openChars(g.state.party[0]); return; }
      if (id === 'cones') { ui.openInventory(4); return; }
      const needsExpress = { warp: () => ui.openWarp(null), outfits: () => ui.openWardrobe(), pets: () => ui.openSupply('pets') }[id];
      if (!needsExpress) { ui.sfx('deny'); return; }
      if (!f.express_intro) { ui.sfx('deny'); ui.toast('Доступно после знакомства с Экспрессом.'); return; }
      needsExpress();
    },

    profileChars(c, scr) {
      const ui = this, d = scr.src, wide = !!(ui.wide && ui.wide()), stops = scr.stops(), cur = stops[scr.sel], v = scr.viewAt(scr.sel);
      const wx = wide ? 384 : 416, ww = wide ? 351 : 212, wh = wide ? 404 : 296, ix = wide ? 396 : 424, iw = ww - (wide ? 24 : 16);
      ui.win(wx, 40, ww, wh, { top: '#2a1630', bottom: '#120a1c' });
      ui.text('Витрина', ix, 50, { size: 12, bold: true, serif: true, col: C.gold });
      ui.text('Звёздные попутчики', ix, wide ? 198 : 183, { size: 12, bold: true, serif: true, col: C.gold });
      stops.forEach((st, i) => {
        if (st.id !== 'show' && st.id !== 'comp') return;
        ui.profileSlot(c, d.slot(st.id, st.i), st, st.id === 'show');
        scr.stopHit(i);
      });
      const dy = wide ? 310 : 269;
      c.fillStyle = C.brass; c.fillRect(ix, dy, iw, 1);
      if (v) {
        if (wide) {
          c.fillStyle = 'rgba(0,0,0,0.32)'; c.fillRect(ix, dy + 8, iw, 114);
          G.rarityCell(c, ix + 8, dy + 16, 64, 64, v.rarity);
          G.drawPortrait(c, v.look, ix + 10, dy + 18, 60);
          ui.text(ui.fitText(v.title, 14, iw - 90, true), ix + 82, dy + 16, { size: 14, bold: true, serif: true, col: C.gold });
          ui.text('★'.repeat(v.rarity), ix + 82, dy + 35, { size: 10, col: G.RARITY[v.rarity] });
          ui.text((v.path ? H.PATHS[v.path].name + ' · ' : '') + H.ELEMENTS[v.elem].name, ix + 82, dy + 50, { size: 11, col: C.cream });
          ui.text('Ур. ' + v.lvl + ' · Эйдолон ' + v.eid, ix + 82, dy + 66, { size: 11, col: C.sub });
          if (d.own && scr.heroAt) {
            const hero = scr.heroAt(scr.sel);
            ui.button(ix + 8, dy + 88, 148, 26, 'Сменить', () => scr.act(), { size: 11 });
            if (hero) ui.button(ix + 166, dy + 88, 152, 26, 'К персонажу (V)', () => ui.openChars(hero), { size: 11, icon: 'chars' });
          }
        } else {
          ui.text(ui.fitText(v.title, 12, iw, true), ix, dy + 9, { size: 12, bold: true, col: C.cream });
          ui.text((v.path ? H.PATHS[v.path].name + ' · ' : '') + H.ELEMENTS[v.elem].name, ix, dy + 25, { size: 10, col: C.sub });
          ui.text('Ур. ' + v.lvl + ' · Эйдолон ' + v.eid, ix, dy + 39, { size: 10, col: C.sub });
        }
      } else if (d.own && (cur.id === 'show' || cur.id === 'comp')) {
        ui.text('Свободное место. Enter выбирает героя.', ix, dy + (wide ? 22 : 9), { size: wide ? 11 : 10, col: C.dim });
        if (wide) ui.button(ix, dy + 48, 156, 26, 'Выбрать героя', () => scr.act(), { size: 11, active: true });
      }
    },

    openProfile() {
      const ui = this, g = this.game;
      return this.push({
        full: true, profile: true, sel: FIRST_TAB_STOP, tab: TAB_CHARS, coll: null, src: null,
        onClose() { if (ui.netCardDue) ui.netCardDue(); },
        stops() { return ui.profileStops(this.tab); },
        viewAt(i) { const hero = this.heroAt(i); return hero ? this.src.view(hero) : null; },
        setTab(i) {
          if (i === this.tab) return;
          this.tab = i; this.sel = FIRST_TAB_STOP; this.coll = null;
          ui.sfx('select');
        },
        heroAt(i) {
          const st = this.stops()[i];
          if (st.id === 'show' || st.id === 'comp') return g.profileSlots()[st.id][st.i];
          return st.id === 'avatar' ? g.profileAvatar() : st.id === 'room' ? g.profileStageHero() : null;
        },
        stopHit(i) {
          const st = this.stops()[i];
          if (i === this.sel) { const c = ui.ctx; c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(st.x, st.y, st.w, st.h); c.lineWidth = 1; }
          ui.hit(st.x, st.y, st.w, st.h, () => { this.sel = i; this.act(); });
        },
        act() {
          const st = this.stops()[this.sel];
          if (st.id === 'row') { this.coll = null; ui.profileRowAct(st.rowId); return; }
          if (st.id === 'avatar') ui.openProfilePick('Аватар', g.profileAvatar(), key => g.setProfileAvatar(key));
          else if (st.id === 'room') ui.openProfilePick('Разместить в комнате', g.profileStageHero(), key => g.setProfileStage(key));
          else if (st.id === 'name') ui.openProfileName();
          else if (st.id === 'bday') ui.openProfileBday();
          else if (st.id === 'sign') ui.openProfileSign();
          else ui.openProfilePick(st.id === 'show' ? 'Витрина' : 'Звёздные попутчики', g.profileSlots()[st.id][st.i], key => g.setProfileSlot(st.id, st.i, key), true);
        },
        draw(c) {
          const wide = !!(ui.wide && ui.wide()), tx0 = wide ? 384 : 290, tw = wide ? 104 : 102, ts = wide ? 108 : 106;
          this.src = ui.profileSource();
          c.drawImage(ui.profileRoom(), wide ? ui.left : 0, 0);
          ui.plate(ui.left + 12, 10, 'Профиль Первопроходца');
          PROFILE_TABS.forEach((t, i) => ui.button(tx0 + i * ts, 10, tw, 22, t.label, () => this.setTab(i), { size: 10, active: i === this.tab }));
          ui.closeBtn(ui.right - 32, 10, () => this.key('back'));
          ui.profileStage(c, this);
          ui.profileCard(c, this);
          if (PROFILE_TABS[this.tab].id === 'rec') ui.profileRec(c, this);
          else if (PROFILE_TABS[this.tab].id === 'coll') ui.profileColl(c, this);
          else ui.profileChars(c, this);
          const rm = this.stops()[4];
          if (this.sel === 4) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(rm.x, rm.y, rm.w, rm.h); c.lineWidth = 1; }
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Открыть'], ['Q E', 'Вкладка'], ['V', 'Герой'], ['Esc', 'Назад']], ui.left + 14, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab((this.tab + (code === 'KeyE' ? 1 : PROFILE_TABS.length - 1)) % PROFILE_TABS.length); return; }
          if (code === 'KeyV') {
            const hero = this.heroAt(this.sel);
            if (hero) ui.openChars(hero); else ui.sfx('deny');
            return;
          }
          if (k === 'ok') { this.act(); return; }
          if (!DIRS[k]) return;
          const to = stopFrom(this.stops(), this.sel, k);
          if (to !== this.sel) { this.sel = to; ui.sfx('select'); }
        }
      });
    },

    openFriendProfile(row) {
      const ui = this, n = globalThis.Net98, card = () => (row.solo ? H.FRIEND_TEXT.SOLO_CARD : n.cards[row.uid] || null);
      if (!row.solo) n.send('cardOf', { uid: row.uid });
      return this.push({
        full: true, friendProfile: true, row, sel: FIRST_TAB_STOP, tab: TAB_CHARS, coll: null, src: null, confirm: false,
        stops() { return ui.profileStops(this.tab); },
        viewAt(i) { const st = this.stops()[i]; return st && (st.id === 'show' || st.id === 'comp') ? this.src.slot(st.id, st.i) : null; },
        setTab(i) { if (i === this.tab) return; this.tab = i; this.sel = FIRST_TAB_STOP; this.coll = null; ui.sfx('select'); },
        stopHit(i) {
          const st = this.stops()[i];
          if (i === this.sel) { const c = ui.ctx; c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(st.x, st.y, st.w, st.h); c.lineWidth = 1; }
          ui.hit(st.x, st.y, st.w, st.h, () => { this.sel = i; ui.sfx('select'); });
        },
        invite() {
          if (row.solo || !n.table || n.table.state !== 'lobby') { ui.sfx('deny'); ui.toast('Сначала сядьте за стол Рубежа'); return; }
          n.send('invite', { uid: row.uid });
        },
        remove() {
          if (row.solo) { ui.sfx('deny'); return; }
          if (!this.confirm) { this.confirm = true; ui.sfx('deny'); return; }
          n.send('unfriend', { uid: row.uid });
          ui.pop();
        },
        draw(c) {
          const wide = !!(ui.wide && ui.wide()), tx0 = wide ? 384 : 290, tw = wide ? 104 : 102, ts = wide ? 108 : 106, sx = wide ? 264 : 308;
          const data = card();
          this.src = ui.cardSource(data, row);
          if (data && !this.had) { this.had = true; this.coll = null; }
          c.drawImage(ui.profileRoom(), wide ? ui.left : 0, 0);
          ui.plate(ui.left + 12, 10, 'Профиль: ' + this.src.name);
          PROFILE_TABS.forEach((t, i) => ui.button(tx0 + i * ts, 10, tw, 22, t.label, () => this.setTab(i), { size: 10, active: i === this.tab }));
          ui.closeBtn(ui.right - 32, 10, () => this.key('back'));
          ui.profileStage(c, this);
          ui.profileCard(c, this);
          ui.text(ui.fitText(this.src.presence, 10, wide ? 148 : 88), wide ? ui.left + 94 : 94, 110, { size: 10, col: row.on ? '#a8f0b0' : C.dim });
          if (PROFILE_TABS[this.tab].id === 'rec') ui.profileRec(c, this);
          else if (PROFILE_TABS[this.tab].id === 'coll') ui.profileColl(c, this);
          else ui.profileChars(c, this);
          if (!data) ui.text('Загружаем карточку...', sx, 44, { size: 11, align: 'center', col: C.sub });
          if (!row.solo) {
            const bx = wide ? 148 : 120, bw0 = wide ? 68 : 84, bw1 = wide ? 92 : 104, bw2 = wide ? 64 : 84, gap = wide ? 4 : 6;
            ui.button(bx, 424, bw0, 26, 'В гости', () => ui.visitGo(row), { size: 10 });
            ui.button(bx + bw0 + gap, 424, bw1, 26, 'Позвать за стол', () => this.invite(), { size: 10 });
            ui.button(bx + bw0 + bw1 + gap * 2, 424, bw2, 26, this.confirm ? 'Точно?' : 'Удалить', () => this.remove(), { size: 10 });
          }
          ui.hints(row.solo ? [['←↑↓→', 'Герой'], ['Q E', 'Вкладка'], ['Esc', 'Назад']] : [['←↑↓→', 'Герой'], ['Q E', 'Вкладка'], ['I', 'Позвать'], ['Del', 'Удалить'], ['Esc', 'Назад']], ui.left + 14, HGT - 18);
        },
        key(k, code) {
          if (code !== 'Delete') this.confirm = false;
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab((this.tab + (code === 'KeyE' ? 1 : PROFILE_TABS.length - 1)) % PROFILE_TABS.length); return; }
          if (code === 'KeyI') { this.invite(); return; }
          if (code === 'KeyG' && !row.solo) { ui.visitGo(row); return; }
          if (code === 'Delete') { this.remove(); return; }
          if (!DIRS[k]) return;
          const list = this.stops().slice(FIRST_TAB_STOP), to = stopFrom(list, this.sel - FIRST_TAB_STOP, k) + FIRST_TAB_STOP;
          if (to !== this.sel) { this.sel = to; ui.sfx('select'); }
        }
      });
    },

    openProfilePick(title, cur, pick, canClear) {
      const ui = this, g = this.game, keys = ui.rosterKeys().filter(k => !H.labOnly(k)), X = 170, Y = 44, WID = 300, MAX = 12, ROW = 30;
      const items = keys.map(k => ({
        label: ui.heroTitle(k), right: 'Ур. ' + g.state.roster[k].lvl, iconW: 30,
        icon: (c, x, y) => ui.circlePortrait(c, G.lookOf(g.kitOf(k), g), x, y - 13, 26, H.ELEMENTS[H.CHARS[g.kitOf(k)].elem].col),
        key: k
      }));
      if (canClear) items.unshift({ label: 'Освободить место', key: null, col: C.sub });
      this.push({
        profilePick: true, sel: Math.max(0, items.findIndex(it => it.key === cur)), scroll: {}, keys: items.map(it => it.key),
        act() {
          pick(items[this.sel].key);
          ui.screens.pop();
          ui.sfx('confirm');
        },
        draw(c) {
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(X, Y, WID, 392, { title });
          ui.list(X + 10, Y + 30, WID - 20, items, this.sel, { rowH: ROW, max: MAX, scroll: this.scroll, onClick: i => { this.sel = i; this.act(); } });
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Выбрать'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (ui.listNav(this, k, items.length)) return;
          if (k === 'ok') this.act();
        }
      });
    },

    openProfileName() {
      const g = this.game;
      return this.openTextEntry({
        title: 'Имя Первопроходца', max: 12, pages: TEXT_PAGES, cols: 11, read: textOfKey, okLabel: 'Готово', closeOnOk: true, okSfx: 'confirm', value: g.state.name,
        hint: 'Имя меняет только подпись: пол и реплики останутся прежними.',
        hints: [['Буквы', 'Ввод'], ['Backspace', 'Стереть'], ['←↑↓→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        submit: text => g.setProfileName(text)
      });
    },

    openShortText(o) {
      return this.openTextEntry(Object.assign({ max: 40, pages: TEXT_PAGES, cols: 11, read: textOfKey, okLabel: 'Готово', closeOnOk: true, okSfx: 'confirm' }, o));
    },

    openProfileSign() {
      const g = this.game;
      return this.openShortText({
        title: 'Подпись', value: g.profile().sign,
        hint: 'До 40 знаков. Пустая подпись тоже подойдёт.',
        hints: [['Буквы', 'Ввод'], ['Backspace', 'Стереть'], ['←↑↓→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        submit: text => g.setProfileSign(text)
      });
    },

    openProfileBday() {
      const ui = this, g = this.game, X = W / 2 - 130, Y = 140, had = g.profile().bday;
      const columns = [{ label: 'День', x: X + 40 }, { label: 'Месяц', x: X + 150 }];
      return this.push({
        profileBday: true, d: had ? had.d : 1, m: had ? had.m : 1, field: 0,
        shift(field, by) {
          if (field === 0) this.d = (this.d - 1 + by + DAYS[this.m - 1]) % DAYS[this.m - 1] + 1;
          else { this.m = (this.m - 1 + by + 12) % 12 + 1; this.d = Math.min(this.d, DAYS[this.m - 1]); }
          ui.sfx('select');
        },
        save() { g.setProfileBday(this.d, this.m); ui.screens.pop(); ui.sfx('confirm'); },
        clear() { g.setProfileBday(null); ui.screens.pop(); ui.sfx('cancel'); },
        draw(c) {
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(X, Y, 260, 180, { title: 'День рождения' });
          columns.forEach((col, i) => {
            const on = i === this.field;
            ui.text(col.label, col.x + 35, Y + 32, { size: 11, align: 'center', col: on ? C.gold : C.sub });
            ui.button(col.x + 12, Y + 48, 46, 18, '▲', () => { this.field = i; this.shift(i, 1); }, { size: 10 });
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(0,0,0,0.35)'; c.fillRect(col.x, Y + 68, 70, 30);
            ui.text(pad2(i ? this.m : this.d), col.x + 35, Y + 72, { size: 20, bold: true, serif: true, align: 'center', col: on ? C.gold : C.cream });
            ui.button(col.x + 12, Y + 100, 46, 18, '▼', () => { this.field = i; this.shift(i, -1); }, { size: 10 });
          });
          ui.button(X + 20, Y + 134, 100, 28, 'Не указывать', () => this.clear(), { size: 11 });
          ui.button(X + 140, Y + 134, 100, 28, 'Готово', () => this.save(), { size: 12, bold: true, active: true });
          ui.hints([['←→', 'Поле'], ['↑↓', 'Значение'], ['Enter', 'Готово'], ['Del', 'Не указывать'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'Delete') { this.clear(); return; }
          if (k === 'ok') { this.save(); return; }
          if (k === 'left' || k === 'right') { this.field = 1 - this.field; ui.sfx('select'); return; }
          if (k === 'up') this.shift(this.field, 1);
          else if (k === 'down') this.shift(this.field, -1);
        }
      });
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
