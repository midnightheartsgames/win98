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
  const REC_ICONS = { fh: 'ipg', su: 'nav', cw: 'shop', hd: 'team', boss: 'mission', warp: 'warp', time: 'events' };
  const COLL_ICONS = { five: 'chars', four: 'team', cones: 'cones', outfits: 'outfit', pets: 'pet', foes: 'archive', fusions: 'synth', chests: 'bag' };
  const REC_ROW = 38, COLL_ROW = 34, ROWS_Y = 48;
  const CARD_STOPS = [
    { id: 'avatar', x: 22, y: 50, w: 64, h: 64 },
    { id: 'name', x: 92, y: 50, w: 94, h: 24 },
    { id: 'bday', x: 20, y: 122, w: 164, h: 20 },
    { id: 'sign', x: 20, y: 168, w: 164, h: 76 },
    { id: 'room', x: 222, y: 424, w: 172, h: 26 }
  ];
  const FIRST_TAB_STOP = CARD_STOPS.length;
  const rowStops = (ids, row) => ids.map((rowId, i) => ({ id: 'row', rowId, i, x: 422, y: ROWS_Y + i * row, w: 200, h: row - 3 }));
  const SLOT_STOPS = [
    { id: 'show', i: 0, x: 424, y: 64, w: 64, h: 100 },
    { id: 'show', i: 1, x: 494, y: 64, w: 64, h: 100 },
    { id: 'show', i: 2, x: 564, y: 64, w: 64, h: 100 },
    { id: 'comp', i: 0, x: 424, y: 196, w: 36, h: 56 },
    { id: 'comp', i: 1, x: 466, y: 196, w: 36, h: 56 },
    { id: 'comp', i: 2, x: 508, y: 196, w: 36, h: 56 },
    { id: 'comp', i: 3, x: 550, y: 196, w: 36, h: 56 },
    { id: 'comp', i: 4, x: 592, y: 196, w: 36, h: 56 }
  ];
  const TAB_STOPS = [
    CARD_STOPS.concat(rowStops(Object.keys(REC_ICONS), REC_ROW)),
    CARD_STOPS.concat(SLOT_STOPS),
    CARD_STOPS.concat(rowStops(Object.keys(COLL_ICONS), COLL_ROW))
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

  function paintRoom(g) {
    g.fillStyle = '#4a1420'; g.fillRect(0, 0, W, HGT);
    g.fillStyle = '#3a0e18';
    for (let y = 0; y < 400; y += 2) for (let x = y % 4; x < W; x += 4) g.fillRect(x, y, 1, 1);
    g.fillStyle = 'rgba(214,170,92,0.1)';
    for (let y = 16; y < 400; y += 32) for (let x = (y % 64 ? 16 : 0); x < W; x += 32) { g.fillRect(x + 7, y, 2, 6); g.fillRect(x + 5, y + 2, 6, 2); }
    const dado = g.createLinearGradient(0, 400, 0, HGT);
    dado.addColorStop(0, '#5a3418'); dado.addColorStop(1, '#2a1608');
    g.fillStyle = dado; g.fillRect(0, 400, W, HGT - 400);
    g.fillStyle = '#c09a50'; g.fillRect(0, 398, W, 2);
    g.fillStyle = '#1a0c04'; g.fillRect(0, 400, W, 1);
    for (let x = 0; x < W; x += 64) { g.fillStyle = '#1a0c04'; g.fillRect(x, 410, 1, 60); g.fillStyle = 'rgba(255,214,150,0.14)'; g.fillRect(x + 1, 410, 1, 60); }
    g.fillStyle = '#100a24'; g.fillRect(200, 40, 216, 346);
    const glow = g.createLinearGradient(0, 56, 0, 386);
    glow.addColorStop(0, 'rgba(255,226,170,0.32)'); glow.addColorStop(1, 'rgba(255,226,170,0.04)');
    g.fillStyle = glow; g.beginPath(); g.moveTo(278, 56); g.lineTo(338, 56); g.lineTo(404, 386); g.lineTo(212, 386); g.closePath(); g.fill();
    for (const [x0, flip] of [[200, 1], [416, -1]]) {
      for (let i = 0; i < 9; i++) {
        const wid = 34 - i * 2, x = x0 + flip * (i * 3);
        g.fillStyle = i % 2 ? '#8a1c24' : '#6a1018';
        if (flip > 0) g.fillRect(x, 40, Math.max(2, wid - i * 2), 346);
        else g.fillRect(x - Math.max(2, wid - i * 2), 40, Math.max(2, wid - i * 2), 346);
      }
    }
    g.fillStyle = '#7a1820'; g.fillRect(196, 36, 224, 26);
    g.fillStyle = '#5a0e16';
    for (let x = 196; x < 420; x += 14) g.fillRect(x, 36, 3, 26);
    g.fillStyle = '#d8b060'; g.fillRect(196, 62, 224, 2);
    g.fillStyle = '#a07c38';
    for (let x = 198; x < 420; x += 6) g.fillRect(x, 64, 3, 5);
    for (const lx of [206, 410]) {
      g.fillStyle = '#c09a50'; g.fillRect(lx - 1, 70, 2, 12);
      g.fillStyle = '#ffe8a8'; g.fillRect(lx - 4, 82, 8, 7);
      g.fillStyle = 'rgba(255,232,168,0.25)'; g.fillRect(lx - 8, 78, 16, 15);
    }
    const shelf = g.createLinearGradient(0, 386, 0, 412);
    shelf.addColorStop(0, '#8a5a2a'); shelf.addColorStop(1, '#4a2a10');
    g.fillStyle = '#000'; g.fillRect(190, 385, 236, 30);
    g.fillStyle = shelf; g.fillRect(191, 386, 234, 28);
    g.fillStyle = 'rgba(255,224,170,0.4)'; g.fillRect(191, 386, 234, 1);
    g.fillStyle = '#c09a50'; g.fillRect(191, 398, 234, 1);
  }

  Object.assign(H.UI.prototype, {
    profileUid() {
      const s = this.game.state, p = this.game.profile();
      if (!p.uid) p.uid = String(70000000 + Math.floor(G.hash(s.name.length, s.name.charCodeAt(0), 7) * 9999999));
      return p.uid;
    },

    profileRoom() {
      if (!this.profileRoomCv) { this.profileRoomCv = G.mkCanvas(W, HGT); paintRoom(this.profileRoomCv.getContext('2d')); }
      return this.profileRoomCv;
    },

    heroTitle(k) {
      const g = this.game, kit = H.CHARS[g.kitOf(k)];
      return k === 'trail' ? g.state.name : kit.short || kit.name;
    },

    profileCard(c, scr) {
      const ui = this, g = this.game, s = g.state, p = g.profile(), avatar = g.profileAvatar();
      ui.win(12, 40, 180, 404, { top: '#2a1630', bottom: '#120a1c' });
      ui.circlePortrait(c, G.lookOf(g.kitOf(avatar), g), 22, 50, 64, C.brassHi);
      ui.text(ui.fitText(s.name, 15, 92, true), 94, 54, { size: 15, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brass; c.fillRect(94, 73, 88, 1);
      ui.text('Ур. Освоения', 94, 80, { size: 10, col: C.sub });
      ui.text(String(s.tl.lvl), 94, 92, { size: 16, bold: true, serif: true, col: C.gold });
      ui.text('День рождения', 24, 126, { size: 10, col: C.sub });
      ui.text(p.bday ? pad2(p.bday.d) + '.' + pad2(p.bday.m) : 'не указан', 180, 126, { size: 11, align: 'right', col: p.bday ? C.cream : C.dim });
      ui.text('UID', 24, 148, { size: 10, col: C.sub });
      ui.text(ui.profileUid(), 180, 148, { size: 11, align: 'right', col: C.cream });
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(20, 168, 164, 76);
      ui.text('Подпись', 26, 172, { size: 10, bold: true, col: C.sub });
      if (p.sign) ui.wrap(p.sign, 150, 11).slice(0, 4).forEach((line, i) => ui.text(line, 26, 186 + i * 14, { size: 11, col: C.cream }));
      else ui.text('Пока пусто.', 26, 186, { size: 11, col: C.dim });
      ui.text('Успехи Освоения', 24, 256, { size: 11, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brass; c.fillRect(24, 272, 156, 1);
      const log = p.log;
      if (!log.length) ui.text('Записей пока нет.', 24, 280, { size: 10, col: C.dim });
      let ly = 280;
      for (const e of log) {
        const lines = ui.wrap(ui.profileAgo(e.at) + ' ' + g.profileLogText(e), 156, 10).slice(0, 2);
        if (ly + lines.length * 12 > 438) break;
        lines.forEach((line, i) => ui.text(line, 24, ly + i * 12, { size: 10, col: C.cream }));
        ly += lines.length * 12 + 3;
      }
      scr.stopHit(0); scr.stopHit(1); scr.stopHit(2); scr.stopHit(3);
    },

    profileStage(c, scr) {
      const ui = this, g = this.game, k = g.profileStageHero(), look = G.lookOf(g.kitOf(k), g);
      ui.platform(c, 308, 378, 58);
      G.drawFigure(c, look, 308, 378, 3);
      ui.text(ui.fitText(ui.heroTitle(k), 12, 200, true), 308, 400, { size: 12, bold: true, align: 'center', col: '#fff0c8' });
      ui.button(222, 424, 172, 26, 'Разместить в комнате', () => { scr.sel = 4; scr.act(); }, { size: 11, active: scr.sel === 4 });
    },

    profileSlot(c, k, st, big) {
      const ui = this, g = this.game;
      if (!k) {
        c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(st.x, st.y, st.w, st.h);
        c.strokeStyle = '#3a4070'; c.strokeRect(st.x + 0.5, st.y + 0.5, st.w - 1, st.h - 1);
        ui.text('+', st.x + st.w / 2, st.y + st.h / 2 - 9, { size: 16, align: 'center', col: C.dim });
        return;
      }
      const kit = H.CHARS[g.kitOf(k)], r = g.state.roster[k], size = big ? 56 : 36;
      G.rarityCell(c, st.x, st.y, st.w, st.h, kit.rarity);
      G.drawPortrait(c, G.lookOf(g.kitOf(k), g), st.x + (st.w - size) / 2, st.y + (big ? 2 : 4), size);
      c.fillStyle = H.ELEMENTS[kit.elem].col; c.fillRect(st.x + 2, st.y + 2, 4, 4);
      if (big) {
        c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(st.x, st.y + 60, st.w, 40);
        ui.text(ui.fitText(ui.heroTitle(k), 10, st.w - 4, true), st.x + st.w / 2, st.y + 62, { size: 10, bold: true, align: 'center', col: C.cream });
        ui.text('Ур. ' + r.lvl, st.x + st.w / 2, st.y + 75, { size: 10, align: 'center', col: C.gold });
        ui.text('Эйдолон ' + r.eid, st.x + st.w / 2, st.y + 87, { size: 9, align: 'center', col: C.sub });
      } else {
        c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(st.x, st.y + 41, st.w, 15);
        ui.text('Ур. ' + r.lvl, st.x + st.w / 2, st.y + 43, { size: 9, bold: true, align: 'center', col: C.gold });
      }
    },

    profileAgo(at) {
      const days = Math.floor((this.game.now() - at) / 86400000);
      return days > 0 ? days + ' д. назад' : 'Сегодня';
    },

    profileRec(c, scr) {
      const ui = this, g = this.game;
      ui.win(416, 40, 212, 296, { top: '#2a1630', bottom: '#120a1c' });
      g.profileMerits().forEach((row, i) => {
        const st = TAB_STOPS[scr.tab][FIRST_TAB_STOP + i];
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(st.x, st.y, st.w, st.h);
        G.menuIcon(c, REC_ICONS[row.id], st.x + 4, st.y + 8, 20, row.open ? '#f0d8a0' : '#4c5070');
        ui.text(row.label, st.x + 30, st.y + 4, { size: 10, col: C.sub });
        ui.text(ui.fitText(row.value, 13, st.w - 36, true), st.x + 30, st.y + 17, { size: 13, bold: true, col: row.open ? C.gold : C.dim });
        scr.stopHit(FIRST_TAB_STOP + i);
      });
    },

    profileColl(c, scr) {
      const ui = this, g = this.game;
      if (!scr.coll) scr.coll = g.profileCollections();
      ui.win(416, 40, 212, 296, { top: '#2a1630', bottom: '#120a1c' });
      scr.coll.forEach((row, i) => {
        const st = TAB_STOPS[scr.tab][FIRST_TAB_STOP + i], full = row.total > 0 && row.got >= row.total;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(st.x, st.y, st.w, st.h);
        G.menuIcon(c, COLL_ICONS[row.id], st.x + 4, st.y + 6, 18, '#f0d8a0');
        ui.text(row.label, st.x + 28, st.y + 3, { size: 10, col: C.cream });
        ui.text(row.got + ' / ' + row.total, st.x + st.w - 6, st.y + 3, { size: 11, bold: true, align: 'right', col: full ? '#8fe08a' : C.gold });
        ui.rail(st.x + 28, st.y + 20, st.w - 36, row.total ? row.got / row.total : 0);
        scr.stopHit(FIRST_TAB_STOP + i);
      });
    },

    profileRowAct(id) {
      const ui = this, g = this.game, f = g.state.flags, closed = () => { ui.sfx('deny'); ui.toast('Этот режим ещё не открыт.'); };
      const merit = g.profileMerits().find(row => row.id === id);
      if (merit && !merit.open) { closed(); return; }
      if (id === 'fh' || id === 'su') { ui.guideEnter({ kind: id, open: true }); return; }
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
      const ui = this, g = this.game, slots = g.profileSlots(), stops = TAB_STOPS[scr.tab], cur = stops[scr.sel], hero = scr.heroAt(scr.sel);
      ui.win(416, 40, 212, 296, { top: '#2a1630', bottom: '#120a1c' });
      ui.text('Витрина', 424, 47, { size: 12, bold: true, serif: true, col: C.gold });
      ui.text('Звёздные попутчики', 424, 178, { size: 12, bold: true, serif: true, col: C.gold });
      stops.forEach((st, i) => {
        if (st.id !== 'show' && st.id !== 'comp') return;
        ui.profileSlot(c, slots[st.id][st.i], st, st.id === 'show');
        scr.stopHit(i);
      });
      c.fillStyle = C.brass; c.fillRect(424, 260, 196, 1);
      if (hero) {
        const kit = H.CHARS[g.kitOf(hero)];
        ui.text(ui.fitText(ui.heroTitle(hero), 12, 196, true), 424, 268, { size: 12, bold: true, col: C.cream });
        ui.text(H.PATHS[kit.path].name + ' · ' + H.ELEMENTS[kit.elem].name, 424, 284, { size: 10, col: C.sub });
        ui.text('Ур. ' + g.state.roster[hero].lvl + ' · Эйдолон ' + g.state.roster[hero].eid, 424, 298, { size: 10, col: C.sub });
      } else if (cur.id === 'show' || cur.id === 'comp') ui.text('Свободное место. Enter выбирает героя.', 424, 268, { size: 10, col: C.dim });
    },

    openProfile() {
      const ui = this, g = this.game;
      return this.push({
        full: true, profile: true, sel: FIRST_TAB_STOP, tab: TAB_CHARS, coll: null,
        stops() { return TAB_STOPS[this.tab]; },
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
          c.drawImage(ui.profileRoom(), 0, 0);
          ui.plate(12, 10, 'Профиль Первопроходца');
          PROFILE_TABS.forEach((t, i) => ui.button(290 + i * 106, 10, 102, 22, t.label, () => this.setTab(i), { size: 10, active: i === this.tab }));
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ui.profileStage(c, this);
          ui.profileCard(c, this);
          if (PROFILE_TABS[this.tab].id === 'rec') ui.profileRec(c, this);
          else if (PROFILE_TABS[this.tab].id === 'coll') ui.profileColl(c, this);
          else ui.profileChars(c, this);
          if (this.sel === 4) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(222, 424, 172, 26); c.lineWidth = 1; }
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Открыть'], ['Q E', 'Вкладка'], ['V', 'Герой'], ['Esc', 'Назад']], 14, HGT - 18);
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

    openProfilePick(title, cur, pick, canClear) {
      const ui = this, g = this.game, keys = ui.rosterKeys(), X = 170, Y = 44, WID = 300, MAX = 12, ROW = 30;
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

    openProfileSign() {
      const g = this.game;
      return this.openTextEntry({
        title: 'Подпись', max: 40, pages: TEXT_PAGES, cols: 11, read: textOfKey, okLabel: 'Готово', closeOnOk: true, okSfx: 'confirm', value: g.profile().sign,
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
