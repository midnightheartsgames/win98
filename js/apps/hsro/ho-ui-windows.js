(function (HO) {
  'use strict';
  const C = HO.CMB;
  const FONT = 'Tahoma, Verdana, sans-serif';
  const KIND_TEXT = { gear: 'Снаряжение', junk: 'Хлам', quest: 'Предмет задания', food: 'Еда', drink: 'Питьё', potion: 'Лечение' };
  const MAP_COL = { floor: '#3a4258', wall: '#9aa2b8', portrait: '#d8bf72', bed: '#6a7290', desk: '#6a7290', machine: '#6a7290', ship: '#5a6a8a', gate: '#7ad8ff', ramp: '#3a4258', core: '#8a7ac0', shelf: '#6a7290', rail: '#1c2240', void: '#05060c', tank: '#3a8a6a', planter: '#6a5a3a', cabinet: '#9aa2b8' };

  Object.assign(HO.UI.prototype, {
    sheet() {
      return this.hero().sheet;
    },

    itemIcon(x, y, size, id, n, dim) {
      const it = HO.ITEMS[id], c = this.hctx, q = HO.QUALITY[it.q] || HO.QUALITY[1];
      c.fillStyle = dim ? '#20242e' : '#2a3048';
      c.fillRect(x, y, size, size);
      c.strokeStyle = q.col;
      c.lineWidth = 2;
      c.strokeRect(x + 1, y + 1, size - 2, size - 2);
      c.lineWidth = 1;
      const label = it.kind === 'gear' ? HO.GEAR_NAMES[it.slot].slice(0, 2) : it.name.slice(0, 2);
      this.text(label, x + size / 2, y + size / 2, dim ? '#70768a' : '#e8ecf4', { align: 'center', base: 'middle', bold: true, size: 12 });
      if (n > 1) this.text(String(n), x + size - 3, y + size - 13, '#ffffff', { align: 'right', size: 10, bold: true });
    },

    itemLines(id, extra, dur) {
      const it = HO.ITEMS[id], sh = this.sheet(), q = HO.QUALITY[it.q] || HO.QUALITY[1];
      const lines = [{ t: it.name, col: q.col, bold: true }];
      lines.push({ t: it.kind === 'gear' ? HO.GEAR_NAMES[it.slot] + (it.q > 1 ? ', ' + q.name : '') : KIND_TEXT[it.kind] || '', col: '#a8b0c8' });
      if (it.path) lines.push({ t: 'Путь: ' + HO.PATHS[it.path].name, col: it.path === sh.path ? '#a8b0c8' : '#ff8070' });
      if (it.stats) for (const [k, v] of Object.entries(it.stats)) lines.push({ t: '+' + v + ' ' + HO.STAT_NAMES[k], col: '#ffffff' });
      if (it.set) lines.push({ t: 'Набор «' + HO.SETS[it.set].name + '»: ' + HO.SETS[it.set].text + (HO.setBonus(sh, 'atkP') && Object.values(sh.gear).some(g => g && HO.ITEMS[g.id].set === it.set) ? ' (действует)' : ''), col: '#f0d890' });
      if (dur >= 0 && it.kind === 'gear') lines.push({ t: dur === 0 ? 'Сломано: свойства не действуют' : 'Прочность: ' + Math.round(dur) + '%', col: dur === 0 ? '#ff6050' : dur < 30 ? '#ffb040' : '#a8b0c8' });
      if (it.text) lines.push({ t: it.text, col: '#dfe4f0' });
      if (it.use && it.use.recall) {
        const left = Math.ceil(Math.max(0, sh.recallAt - sh.clock) / 60);
        lines.push({ t: sh.bind ? 'Привязан: ' + HO.ANCHORS[sh.bind].name : 'Не привязан. Привяжите у любого Якоря', col: '#7ad8ff' });
        if (left > 0) lines.push({ t: 'Перезарядка: ещё ' + left + ' мин.', col: '#ffb040' });
      }
      if (it.sell) lines.push({ t: 'Продажа: ' + it.sell + ' кр.', col: '#c8a040' });
      for (const e of extra || []) lines.push(e);
      return lines;
    },

    compareLines(id) {
      const it = HO.ITEMS[id], sh = this.sheet();
      if (it.kind !== 'gear') return [];
      const cur = sh.gear[it.slot], cs = cur ? HO.ITEMS[cur.id].stats || {} : {}, ns = it.stats || {};
      const out = [{ t: cur ? 'Сейчас надето: ' + HO.ITEMS[cur.id].name : 'Ячейка «' + HO.GEAR_NAMES[it.slot] + '» пуста', col: '#a8b0c8' }];
      for (const k of new Set([...Object.keys(cs), ...Object.keys(ns)])) {
        const d = Math.round(((ns[k] || 0) - (cs[k] || 0)) * 100) / 100;
        if (d) out.push({ t: (d > 0 ? '+' : '−') + String(Math.abs(d)).replace('.', ',') + ' ' + HO.STAT_NAMES[k] + ' к надетому', col: d > 0 ? '#60ff80' : '#ff7060' });
      }
      return out;
    },

    tooltipAt(x, y, lines) {
      const c = this.hctx, w = this.hud.width, h = this.hud.height;
      c.font = '12px ' + FONT;
      const tw = Math.min(300, Math.max(...lines.map(l => c.measureText(l.t).width)) + 16), th = lines.length * 16 + 8;
      const px = HO.clamp(x + 14, 4, w - tw - 4), py = HO.clamp(y - th - 6, 4, h - th - 4);
      this.panel(px, py, tw, th);
      lines.forEach((l, i) => this.text(l.t, px + 8, py + 5 + i * 16, l.col, { size: 12, bold: !!l.bold }));
    },

    hover(x, y, w, h, lines) {
      const mx = this.mouse.hx, my = this.mouse.hy;
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) this.pendingTip = lines;
    },

    drawSettings(w, h) {
      const st = this.settingsWin, s = this.settings;
      const ww = Math.min(w - 20, 560), hh = Math.min(h - 20, 430), x = Math.round(w / 2 - ww / 2), y = Math.round(h / 2 - hh / 2), c = this.hctx;
      c.fillStyle = 'rgba(4,6,16,0.6)';
      c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(10,16,36,0.97)';
      c.fillRect(x, y, ww, hh);
      this.panel(x, y, ww, hh);
      this.text('Настройки', x + ww / 2, y + 10, '#f0d890', { align: 'center', bold: true, size: 15 });
      const tabs = [['gfx', 'Графика'], ['sound', 'Звук'], ['ui', 'Интерфейс'], ['keys', 'Управление']], tw = (ww - 28) / 4;
      tabs.forEach(([id, name], i) => this.button(x + 14 + i * tw, y + 36, tw - 6, 24, name, st.tab === id, () => { st.tab = id; st.wait = null; st.msg = null; }));
      const label = (i, text, note) => {
        const ry = y + 78 + i * 40;
        this.text(text, x + 20, ry + 2, '#e8ecf4', { size: 12, bold: true });
        if (note) this.text(note, x + 20, ry + 18, '#8890a8', { size: 10 });
        return ry;
      };
      const choice = (ry, list, cur, key) => list.forEach((c, i) => this.button(x + 230 + i * 78, ry, 72, 24, c.name, c.v === cur, () => this.setSetting(key, c.v)));
      const onOff = [{ v: true, name: 'Вкл' }, { v: false, name: 'Выкл' }];
      if (st.tab === 'gfx') {
        choice(label(0, 'Кадр 3D', 'Меньший кадр легче для компьютера'), HO.RES_CHOICES.map(v => ({ v, name: v + '×' + v * 3 / 4 })), s.res, 'res');
        choice(label(1, 'Дальность', 'Как далеко видно до тумана'), HO.VIEW_CHOICES, s.view, 'view');
        choice(label(2, 'Туман'), onOff, s.fog, 'fog');
        choice(label(3, 'Пятна теней', 'Тень под ногами героев и врагов'), onOff, s.shadows, 'shadows');
        choice(label(4, 'Режим 16 бит', 'Меньше цветов, сглаживание узором'), onOff, s.dither, 'dither');
      } else if (st.tab === 'sound') {
        const vol = (i, text, key) => {
          const ry = label(i, text);
          this.button(x + 230, ry, 28, 24, '−', false, () => this.setSetting(key, Math.max(0, Math.round((s[key] - 0.1) * 100) / 100)));
          c.fillStyle = 'rgba(30,40,70,0.9)'; c.fillRect(x + 264, ry + 6, 200, 12);
          c.fillStyle = '#d8bf72'; c.fillRect(x + 264, ry + 6, 200 * s[key], 12);
          this.button(x + 470, ry, 28, 24, '+', false, () => this.setSetting(key, Math.min(1, Math.round((s[key] + 0.1) * 100) / 100)));
          this.text(Math.round(s[key] * 100) + '%', x + 506, ry + 5, '#e8ecf4', { size: 12 });
        };
        vol(0, 'Звуки', 'sfx');
        vol(1, 'Музыка', 'music');
        this.text('Звук включается после первого щелчка или клавиши в окне игры.', x + 20, y + 170, '#8890a8', { size: 11 });
      } else if (st.tab === 'ui') {
        choice(label(0, 'Масштаб интерфейса', 'Надписи, окна и панели'), HO.UI_CHOICES.map(v => ({ v, name: Math.round(v * 100) + '%' })), s.ui, 'ui');
        choice(label(1, 'Показывать к/с', 'Кадры в секунду, вызовы отрисовки, треугольники, память'), onOff, s.perf, 'perf');
      } else {
        const list = HO.KEY_ACTIONS, half = Math.ceil(list.length / 2), colW = (ww - 40) / 2, rh = Math.min(20, (hh - 150) / half);
        list.forEach((a, i) => {
          const cx = x + 16 + (i >= half ? colW + 8 : 0), cy = y + 72 + (i % half) * rh;
          this.text(a.name, cx, cy + 3, '#dfe4f0', { size: 11 });
          const wait = st.wait === a.id;
          this.button(cx + colW - 96, cy, 90, rh - 3, wait ? 'Нажмите…' : HO.keyLabel(HO.keyOf(s, a.id)), wait, () => { st.wait = a.id; st.msg = { text: 'Нажмите новую клавишу для «' + a.name + '». Esc: отмена', col: '#f0d890' }; });
        });
        this.button(x + 16, y + hh - 36, 130, 24, 'По умолчанию', false, () => { s.keys = {}; st.wait = null; st.msg = { text: 'Клавиши сброшены', col: '#a0ffb0' }; this.saveSettings(); });
        this.text('Стрелки тоже ведут героя. F9, F10 и Esc заняты', x + 156, y + hh - 30, '#8890a8', { size: 10 });
      }
      if (st.msg) this.text(st.msg.text, x + ww / 2, y + hh - 58, st.msg.col, { align: 'center', size: 11, bold: true });
      this.button(x + ww - 110, y + hh - 36, 96, 24, 'Готово', true, () => { this.settingsWin = null; });
    },

    closeWin() {
      this.win = null;
    },

    openNpc(uid) {
      const n = this.world.byUid(uid);
      if (!n) return;
      if (n.role === 'trainer') { this.trainer = uid; this.win = null; return; }
      if (n.trains && n.trains.includes(this.hero().path)) { this.win = { type: 'npc', uid }; return; }
      if (n.role === 'vendor') { this.win = { type: 'vendor', uid }; this.bagOpen = true; return; }
      const list = HO.npcQuests(this.sheet(), n.id);
      const all = [...list.ready, ...list.offer];
      if (all.length === 1 && !list.active.length) return this.openQuest(all[0], uid);
      this.win = { type: 'npc', uid };
    },

    openQuest(qid, uid) {
      const sh = this.sheet();
      const mode = sh.quests[qid] ? (HO.questReady(sh, qid) ? 'done' : 'wait') : 'offer';
      this.win = { type: 'quest', q: qid, uid, mode, pick: -1 };
    },

    drawOverlays(w, h) {
      if (this.charOpen) this.drawCharacter(w, h);
      if (this.bagOpen) this.drawBag(w, h);
      const win = this.win;
      if (win) {
        if (win.uid && win.type !== 'loot') {
          const n = this.world.byUid(win.uid), a = this.hero();
          if (!n || Math.hypot(n.x - a.x, n.z - a.z) > C.talkRange + (n.r || 0) + 3) this.win = null;
        }
        if (this.win) {
          const fn = { npc: this.drawNpcWin, quest: this.drawQuestWin, loot: this.drawLootWin, vendor: this.drawVendorWin, lift: this.drawLiftWin, anchor: this.drawAnchorWin, party: this.drawPartyWin, log: this.drawLogWin, map: this.drawMapWin, skills: this.drawSkillsWin }[this.win.type];
          if (fn) fn.call(this, w, h);
        }
      }
      if (this.pendingTip) this.tooltipAt(this.mouse.hx, this.mouse.hy, this.pendingTip);
    },

    winFrame(x, y, ww, hh, title) {
      this.panel(x, y, ww, hh);
      this.text(title, x + 12, y + 8, '#f0d890', { bold: true, size: 14 });
      this.button(x + ww - 28, y + 6, 22, 20, 'x', false, () => this.closeWin());
    },

    npcPortrait(cx, cy, r, n) {
      const look = n.look;
      if (look && typeof look === 'object') {
        const sp = HO.npcSpec(n.id);
        this.portrait(cx, cy, r, look.skin, look.hair, sp.face, look.race === 'foxian');
        return;
      }
      const c = this.hctx, glyph = { terminal: '▣', vendor: '$', robot: '◉', dog: 'ᴥ', creature: '❀' }[look] || '•';
      c.beginPath(); c.arc(cx, cy, r + 2, 0, Math.PI * 2); c.fillStyle = '#d8bf72'; c.fill();
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = '#1a2240'; c.fill();
      this.text(glyph, cx, cy + 1, '#7ad8ff', { align: 'center', base: 'middle', bold: true, size: Math.round(r * 1.1) });
    },

    drawNpcWin(w, h) {
      const n = this.world.byUid(this.win.uid), sh = this.sheet(), def = this.world.npcDef(n) || {};
      const list = HO.npcQuests(sh, n.id), ww = 520, x = Math.round(w / 2 - ww / 2), tw = ww - 96;
      const rows = [...list.ready.map(q => ['?', q, '#f0d890']), ...list.offer.map(q => ['!', q, '#f0d890']), ...list.active.map(q => ['·', q, '#a8b0c8'])];
      const textLines = this.wrapCount(def.greet || '', tw, 12), teach = n.trains && n.trains.includes(this.hero().path);
      const hh = Math.max(110, 70 + textLines * 14 + rows.length * 28 + (teach ? 30 : 0)), y = Math.max(70, h - hh - 128);
      this.winFrame(x, y, ww, hh, n.name);
      this.npcPortrait(x + 44, y + 64, 30, n);
      const tx = x + 84;
      if (teach) this.button(tx, y + hh - 34, tw, 24, 'Обучение: ' + HO.PATHS[this.hero().path].name, true, () => { this.trainer = n.uid; this.win = null; });
      this.wrapText(def.greet || '', tx, y + 32, tw, '#dfe4f0', 12);
      rows.forEach(([m, q, col], i) => {
        const ry = y + 44 + textLines * 14 + i * 28;
        this.button(tx, ry, tw, 24, m + '  ' + HO.QUESTS[q].title, false, () => this.openQuest(q, this.win.uid));
        this.text(m, tx + 10, ry + 5, col, { bold: true, size: 13 });
      });
      if (!rows.length && !teach) this.text('Заданий для вас пока нет.', tx, y + hh - 26, '#8890a8', { size: 12 });
    },

    drawQuestWin(w, h) {
      const win = this.win, q = HO.QUESTS[win.q], sh = this.sheet(), x = w / 2 - 230, y = 90;
      const text = win.mode === 'offer' ? q.offer : win.mode === 'done' ? q.done : q.wait;
      const tl = this.wrapCount(text, 436, 12);
      const r = q.reward || {};
      const choice = r.choice || [], items = (r.items || []).slice();
      if (r.pathItem) items.push([HO.PATH_CONE[sh.path], 1]);
      const traces = r.trace ? HO.TRACES[sh.path] : [];
      const hh = 120 + tl * 14 + q.goals.length * 16 + (items.length || choice.length ? 60 : 0) + 40 + (r.ult ? 18 : 0) + (traces.length ? 30 + traces.length * 46 : 0);
      this.winFrame(x, y, 460, hh, q.title);
      let yy = y + 32;
      this.wrapText(text, x + 12, yy, 436, '#dfe4f0', 12);
      yy += tl * 14 + 10;
      this.text('Цели', x + 12, yy, '#f0d890', { bold: true, size: 12 });
      yy += 18;
      q.goals.forEach((g, i) => {
        const have = sh.quests[win.q] ? HO.questGoalCount(sh, win.q, i) : 0, need = HO.goalNeed(g);
        this.text('• ' + g.text + (need > 1 ? ': ' + have + ' / ' + need : have >= need && sh.quests[win.q] ? ': готово' : ''), x + 16, yy, have >= need && sh.quests[win.q] ? '#a0ffb0' : '#e0e4ee', { size: 12 });
        yy += 16;
      });
      yy += 6;
      this.text('Награда: ' + (sh.lvl >= HO.MAX_LEVEL ? '' : HO.questXp(q) + ' опыта') + (r.credits ? (sh.lvl >= HO.MAX_LEVEL ? '' : ', ') + r.credits + ' кр.' : ''), x + 12, yy, '#f0d890', { size: 12, bold: true });
      yy += 20;
      if (r.ult) {
        const ult = HO.ABILITIES[HO.pathAbilities(sh.path).find(id => HO.ABILITIES[id].ult)];
        this.text('Абсолютная техника «' + ult.name + '»', x + 12, yy, '#e0b030', { size: 12, bold: true });
        this.hover(x + 12, yy, 300, 16, [{ t: ult.name, col: '#e0b030', bold: true }, { t: ult.text, col: '#dfe4f0' }]);
        yy += 18;
      }
      if (traces.length) {
        this.text(win.mode === 'done' ? 'Выберите След. Он покажет, куда пойдёт Путь:' : 'При сдаче: выбор одного из двух Следов', x + 12, yy, '#a8b0c8', { size: 11 });
        yy += 20;
        traces.forEach(t => {
          const on = win.trace === t.id;
          this.button(x + 12, yy, 436, 40, '', on, () => { if (win.mode === 'done') win.trace = t.id; });
          this.text(t.name, x + 22, yy + 5, on ? '#141a30' : '#f0d890', { size: 12, bold: true });
          this.text(t.text, x + 22, yy + 22, on ? '#141a30' : '#dfe4f0', { size: 11 });
          yy += 46;
        });
      }
      items.forEach(([id, k], i) => { this.itemIcon(x + 12 + i * 44, yy, 38, id, k); this.hover(x + 12 + i * 44, yy, 38, 38, this.itemLines(id)); });
      if (choice.length) {
        this.text('Выберите одно:', x + 12 + items.length * 44, yy - 2, '#a8b0c8', { size: 11 });
        choice.forEach((id, i) => {
          const bx = x + 12 + items.length * 44 + i * 44, by = yy + 12;
          this.itemIcon(bx, by, 38, id, 1);
          if (win.pick === i) { this.hctx.strokeStyle = '#ffe060'; this.hctx.lineWidth = 3; this.hctx.strokeRect(bx - 2, by - 2, 42, 42); this.hctx.lineWidth = 1; }
          this.buttons.push({ x: bx, y: by, w: 38, h: 38, fn: () => { win.pick = i; } });
          this.hover(bx, by, 38, 38, this.itemLines(id));
        });
      }
      const by = y + hh - 34;
      if (win.mode === 'offer') {
        this.button(x + 12, by, 140, 26, 'Принять', true, () => { this.cmd({ t: 'accept', q: win.q }); this.closeWin(); });
        this.button(x + 308, by, 140, 26, 'Отказаться', false, () => this.closeWin());
      } else if (win.mode === 'done') {
        const can = (!choice.length || win.pick >= 0) && (!traces.length || win.trace);
        this.button(x + 12, by, 180, 26, can ? 'Завершить' : traces.length && !win.trace ? 'Выберите След' : 'Выберите награду', can, () => { if (can) { this.cmd({ t: 'turnIn', q: win.q, pick: win.pick, trace: win.trace || '' }); this.closeWin(); } });
      } else this.button(x + 308, by, 140, 26, 'Закрыть', false, () => this.closeWin());
    },

    drawLootWin(w, h) {
      const f = this.world.byUid(this.win.uid), me = this.hero();
      const L = f && f.loot && f.loot[me.uid];
      if (!L || Math.hypot(f.x - me.x, f.z - me.z) > C.useRange + f.r + 2) { this.win = null; return; }
      const rows = L.items.length + (L.credits ? 1 : 0), ww = 240, hh = 70 + rows * 42;
      const x = HO.clamp((this.win.x === undefined ? 60 : this.win.x) + 14, 8, w - ww - 8), y = HO.clamp((this.win.y === undefined ? 200 : this.win.y) - 24, 8, h - hh - 8);
      this.winFrame(x, y, ww, hh, 'Добыча: ' + f.name.replace('Рейнджер пустоты: ', ''));
      let yy = y + 32;
      if (L.credits) { this.text('Кредиты: ' + L.credits, x + 12, yy + 10, '#f0d890', { bold: true, size: 13 }); yy += 42; }
      L.items.forEach((it, i) => {
        this.itemIcon(x + 12, yy, 36, it.id, it.n);
        this.text(HO.ITEMS[it.id].name, x + 56, yy + 10, (HO.QUALITY[HO.ITEMS[it.id].q] || HO.QUALITY[1]).col, { size: 12 });
        this.buttons.push({ x: x + 12, y: yy, w: ww - 24, h: 36, fn: () => this.cmd({ t: 'loot', uid: f.uid, i }) });
        this.hover(x + 12, yy, 36, 36, this.itemLines(it.id));
        yy += 42;
      });
      this.button(x + 12, y + hh - 32, ww - 24, 24, 'Забрать всё', true, () => this.cmd({ t: 'loot', uid: f.uid, i: -1 }));
    },

    drawVendorWin(w, h) {
      const n = this.world.byUid(this.win.uid), def = this.world.npcDef(n), sh = this.sheet();
      const x = 40, y = 120, ww = 400, hh = 90 + def.stock.length * 42 + (sh.buyback.length ? 30 + sh.buyback.length * 30 : 0) + (n.repair ? 34 : 0);
      this.winFrame(x, y, ww, hh, n.name);
      this.text('Кредиты: ' + sh.credits + (sh.race === 'human' ? '   («Свой человек»: −10%)' : ''), x + 12, y + 30, '#c8d0e0', { size: 12 });
      def.stock.forEach((id, i) => {
        const ry = y + 52 + i * 42, price = HO.buyPrice(sh, id);
        this.itemIcon(x + 12, ry, 36, id, 1);
        this.text(HO.ITEMS[id].name, x + 56, ry + 2, '#e8ecf4', { size: 12 });
        this.text(price + ' кр.', x + 56, ry + 18, sh.credits >= price ? '#f0d890' : '#ff8070', { size: 11 });
        this.button(x + ww - 92, ry + 6, 80, 24, 'Купить', sh.credits >= price, () => this.cmd({ t: 'buy', uid: n.uid, item: id }));
        this.hover(x + 12, ry, 36, 36, this.itemLines(id));
      });
      let yy = y + 52 + def.stock.length * 42;
      if (sh.buyback.length) {
        this.text('Выкуп проданного', x + 12, yy + 4, '#f0d890', { size: 12, bold: true });
        yy += 24;
        sh.buyback.forEach((b, i) => {
          this.text(HO.ITEMS[b.id].name + (b.n > 1 ? ' ×' + b.n : ''), x + 12, yy + 4, '#c8d0e0', { size: 11 });
          this.button(x + ww - 112, yy, 100, 22, b.price + ' кр.', false, () => this.cmd({ t: 'buyback', uid: n.uid, i }));
          yy += 30;
        });
      }
      if (n.repair) {
        const cost = HO.repairCost(sh);
        this.button(x + 12, y + hh - 66, ww - 24, 26, cost ? 'Починить снаряжение: ' + cost + ' кр.' : 'Снаряжение цело', cost > 0 && sh.credits >= cost, () => this.cmd({ t: 'repair', uid: n.uid }));
      }
      this.button(x + 12, y + hh - 32, 150, 24, 'Продать хлам', false, () => this.cmd({ t: 'sellJunk', uid: n.uid }));
      this.text('Щелчок по вещи в рюкзаке: продать', x + ww - 12, y + hh - 26, '#8890a8', { align: 'right', size: 10 });
    },

    drawLiftWin(w) {
      const x = w / 2 - 170, y = 150, here = this.world.zone.id;
      this.winFrame(x, y, 340, 52 + HO.LIFT_ZONES.length * 36, 'Космический лифт');
      HO.LIFT_ZONES.forEach((z, i) => {
        const ready = !!HO.TRAVEL[z];
        const label = HO.ZONES[z].name.replace('Станция «Герта»: ', '') + (z === here ? ' (вы здесь)' : !ready ? ' (на ремонте)' : '');
        this.button(x + 12, y + 36 + i * 36, 316, 28, label, ready && z !== here, () => this.cmd({ t: 'lift', zone: z }));
      });
    },

    drawPartyWin(w) {
      const P = this.world.state.party;
      if (!P) { this.win = null; return; }
      const a = this.hero(), t = this.world.byUid(a.target), x = w / 2 - 200, y = 110, ww = 400;
      this.winFrame(x, y, ww, 236, 'Группа');
      this.text('Приказы напарникам', x + 12, y + 32, '#f0d890', { size: 12, bold: true });
      Object.entries(HO.ORDERS).forEach(([o, name], i) => this.button(x + 12 + (i % 2) * 190, y + 52 + Math.floor(i / 2) * 30, 182, 26, name, P.order === o, () => this.cmd({ t: 'order', o })));
      this.text('Метки на цели' + (t && t.kind === 'foe' ? ': ' + t.name.replace('Рейнджер пустоты: ', '') : ' (сначала выберите врага)'), x + 12, y + 120, '#f0d890', { size: 12, bold: true });
      const foe = t && t.kind === 'foe' && !t.dead;
      this.button(x + 12, y + 140, 182, 26, '◆ Первая цель', foe && P.first === t.uid, () => { if (foe) this.cmd({ t: 'mark', uid: t.uid, m: 'first' }); });
      this.button(x + 202, y + 140, 182, 26, '■ Стоп-кадр', foe && P.stop === t.uid, () => { if (foe) this.cmd({ t: 'mark', uid: t.uid, m: 'stop' }); });
      this.button(x + 12, y + 172, 182, 24, 'Снять метки', false, () => { this.cmd({ t: 'mark', uid: 0, m: 'first' }); this.cmd({ t: 'mark', uid: 0, m: 'stop' }); });
      this.text('Отпустить напарников можно у маяка.', x + 12, y + 210, '#8890a8', { size: 11 });
    },

    drawAnchorWin(w) {
      const o = this.world.byUid(this.win.uid), sh = this.sheet(), here = o.anchor, cost = 5 * sh.lvl;
      const known = HO.ANCHOR_IDS.filter(id => sh.anchors[id]), zoneName = z => HO.ZONES[z].name.replace('Станция «Герта»: ', '');
      const x = w / 2 - 230, y = 100, ww = 460, rowH = 36, hh = 152 + known.length * rowH;
      this.winFrame(x, y, ww, hh, 'Якорь пространства');
      this.text('«' + HO.ANCHORS[here].name + '», ' + zoneName(HO.ANCHORS[here].zone), x + 12, y + 30, '#7ad8ff', { size: 12, bold: true });
      this.text('Перемещение к открытому Якорю: ' + cost + ' кр. У вас: ' + sh.credits + ' кр.', x + 12, y + 48, '#c8d0e0', { size: 11 });
      known.forEach((id, i) => {
        const an = HO.ANCHORS[id], ry = y + 70 + i * rowH, same = id === here;
        this.text(an.name, x + 12, ry + 2, same ? '#8890a8' : '#e8ecf4', { size: 12, bold: !same });
        this.text(zoneName(an.zone), x + 12, ry + 18, '#8890a8', { size: 10 });
        if (same) this.text('вы здесь', x + ww - 12, ry + 8, '#8890a8', { align: 'right', size: 11 });
        else this.button(x + ww - 122, ry + 4, 110, 24, 'Переместиться', sh.credits >= cost, () => this.cmd({ t: 'anchorGo', to: id }));
      });
      const by = y + hh - 72, bound = sh.bind === here;
      this.text('Карманный якорь: ' + (sh.bind ? HO.ANCHORS[sh.bind].name : 'не привязан'), x + 12, by + 6, '#7ad8ff', { size: 12 });
      this.button(x + 12, by + 28, ww - 24, 28, bound ? 'Карманный якорь уже привязан сюда' : 'Привязать Карманный якорь сюда', !bound, () => { if (!bound) this.cmd({ t: 'bind', anchor: here }); });
    },

    drawLogWin(w, h) {
      const sh = this.sheet(), ui = this.heroUi(), x = w / 2 - 280, y = 90;
      const zoneOf = q => HO.QUESTS[q].zone || this.world.zone.id;
      const zones = [...new Set(Object.keys(sh.quests).map(zoneOf))];
      const ids = zones.flatMap(z => Object.keys(sh.quests).filter(q => zoneOf(q) === z));
      this.winFrame(x, y, 560, 360, 'Журнал заданий (' + ids.length + ' из ' + HO.MAX_QUESTS + ')');
      if (!this.win.sel || !sh.quests[this.win.sel]) this.win.sel = ids[0] || null;
      let ly = y + 34;
      for (const z of zones) {
        this.text((HO.ZONES[z] ? HO.ZONES[z].name : z).replace('Станция «Герта»: ', ''), x + 14, ly + 2, '#f0d890', { bold: true, size: 11 });
        ly += 18;
        for (const q of ids.filter(q2 => zoneOf(q2) === z)) {
          const ready = HO.questReady(sh, q), off = ui.untracked.includes(q);
          this.button(x + 12, ly, 200, 22, (off ? '' : '◆ ') + HO.QUESTS[q].title + (ready ? ' ✓' : ''), q === this.win.sel, () => { this.win.sel = q; });
          ly += 25;
        }
        ly += 4;
      }
      if (this.win.sel) {
        const sel = this.win.sel, off = ui.untracked.includes(sel);
        this.button(x + 226, y + 360 - 34, 170, 24, off ? '☐ Показывать на экране' : '☑ Показывать на экране', !off, () => {
          ui.untracked = off ? ui.untracked.filter(q => q !== sel) : [...ui.untracked, sel];
          this.saveHeroUi();
        });
      }
      if (!ids.length) this.text('Заданий нет. Ищите «!» над головами жителей.', x + 12, y + 40, '#a8b0c8', { size: 12 });
      const q = this.win.sel && HO.QUESTS[this.win.sel];
      if (q) {
        const tx = x + 226;
        this.wrapText(q.offer, tx, y + 36, 320, '#dfe4f0', 12);
        let yy = y + 44 + this.wrapCount(q.offer, 320, 12) * 14;
        q.goals.forEach((g, i) => {
          const have = HO.questGoalCount(sh, this.win.sel, i), need = HO.goalNeed(g);
          this.text('• ' + g.text + (need > 1 ? ': ' + have + ' / ' + need : have >= need ? ': готово' : ''), tx, yy, have >= need ? '#a0ffb0' : '#e0e4ee', { size: 12 });
          yy += 16;
        });
        const turn = HO.npcName(q.turnIn);
        this.text('Сдать: ' + turn, tx, yy + 8, '#a8b0c8', { size: 11 });
        const sel = this.win.sel;
        this.button(x + 560 - 152, y + 360 - 34, 140, 24, 'Отказаться', false, () => this.cmd({ t: 'abandon', q: sel }));
      }
    },

    mapTransform(x, y, ww, hh, zone) {
      const z = zone || this.world.zone;
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (const b of z.boxes) if (b[6] === 'floor') { x0 = Math.min(x0, b[0]); z0 = Math.min(z0, b[2]); x1 = Math.max(x1, b[3]); z1 = Math.max(z1, b[5]); }
      const k = Math.min(ww / (x1 - x0), hh / (z1 - z0));
      const ox = x + (ww - (x1 - x0) * k) / 2, oz = y + (hh - (z1 - z0) * k) / 2;
      return { k, px: wx => ox + (wx - x0) * k, pz: wz => oz + (wz - z0) * k };
    },

    drawZonePlan(m, clipBox, zone) {
      const c = this.hctx, z = zone || this.world.zone;
      for (const kind of ['floor', 'other']) {
        for (const b of zone && zone !== this.world.zone ? zone.boxes : this.world.boxes) {
          if ((kind === 'floor') !== (b[6] === 'floor') || b[6] === 'hidden') continue;
          const col = MAP_COL[b[6]] || '#9aa2b8';
          c.fillStyle = col;
          const x0 = m.px(b[0]), y0 = m.pz(b[2]), x1 = m.px(b[3]), y1 = m.pz(b[5]);
          if (clipBox && (x1 < clipBox[0] || x0 > clipBox[2] || y1 < clipBox[1] || y0 > clipBox[3])) continue;
          c.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
        }
      }
      return z;
    },

    goalSpots() {
      const sh = this.sheet(), out = [], z = this.world.zone;
      for (const qid of Object.keys(sh.quests)) {
        const q = HO.QUESTS[qid];
        if (HO.questReady(sh, qid)) { const n = this.world.npcById(q.turnIn); if (n) out.push({ x: n.x, z: n.z, mark: '?' }); continue; }
        q.goals.forEach((g, i) => {
          if (HO.questGoalCount(sh, qid, i) >= HO.goalNeed(g)) return;
          if (g.k === 'talk') { const n = this.world.npcById(g.npc); if (n) out.push({ x: n.x, z: n.z, mark: '*' }); }
          if (g.k === 'use') for (const o of z.objects.filter(o2 => o2.id === g.obj)) out.push({ x: o.x, z: o.z, mark: '*' });
          if (g.k === 'collect') for (const o of z.objects.filter(o2 => o2.give === g.item)) out.push({ x: o.x, z: o.z, mark: '*' });
          if (g.k === 'kill' || g.k === 'collect') for (const f of z.foes.filter(f2 => f2.id === g.foe || (g.k === 'collect' && ((HO.LOOT[f2.id] || {}).quest || []).some(([it]) => it === g.item)))) out.push({ x: f.x, z: f.z, mark: '•', foe: true });
          if (g.k === 'escort') { const ar = z.areas.find(a => a.id === g.area); if (ar) out.push({ x: (ar.x0 + ar.x1) / 2, z: (ar.z0 + ar.z1) / 2, mark: '*' }); }
        });
      }
      return out;
    },

    drawMapWin(w, h) {
      const x = 40, y = 40, ww = w - 80, hh = h - 120, here = this.world.zone, me = this.hero(), sh = this.sheet();
      const list = [...new Set([...HO.LIFT_ZONES.filter(id => HO.ZONES[id]), here.id])];
      if (!this.win.zone || !HO.ZONES[this.win.zone]) this.win.zone = here.id;
      const z = HO.ZONES[this.win.zone];
      this.winFrame(x, y, ww, hh, 'Карта: ' + z.name);
      const bw = Math.min(150, (ww - 24) / list.length - 4);
      list.forEach((id, i) => this.button(x + 12 + i * (bw + 4), y + 32, bw, 22, HO.ZONES[id].name.replace('Станция «Герта»: ', '') + (id === here.id ? ' ●' : ''), id === z.id, () => { this.win.zone = id; }));
      const m = this.mapTransform(x + 12, y + 62, ww - 24, hh - 74, z);
      this.drawZonePlan(m, null, z);
      for (const a of z.areas || []) this.text(a.name, m.px((a.x0 + a.x1) / 2), m.pz((a.z0 + a.z1) / 2), '#c8d0e0', { align: 'center', base: 'middle', size: 11, bold: true });
      if (z !== here) {
        for (const n of z.npcs || []) {
          const mk = HO.npcMark(sh, n.id);
          this.text(mk && mk !== '·' ? mk : n.role === 'trainer' ? 'Т' : n.role === 'vendor' ? '$' : '•', m.px(n.x), m.pz(n.z), mk === '!' || mk === '?' ? '#ffe060' : '#a0ffb0', { align: 'center', base: 'middle', size: 13, bold: true });
        }
        for (const o of z.objects || []) if (o.act === 'lift') this.text('Лифт', m.px(o.x), m.pz(o.z), '#7ad8ff', { align: 'center', base: 'middle', size: 11, bold: true });
        for (const an of z.anchors || []) this.text('⚓', m.px(an.x), m.pz(an.z), sh.anchors[an.id] ? '#7ad8ff' : '#5a7a9a', { align: 'center', base: 'middle', size: 15, bold: true });
        for (const md of z.medpoints || []) this.text('+', m.px(md.x), m.pz(md.z), '#60ff80', { align: 'center', base: 'middle', size: 16, bold: true });
        this.text('Вы в зоне «' + here.name.replace('Станция «Герта»: ', '') + '»', x + ww - 16, y + hh - 22, '#a8b0c8', { align: 'right', size: 11 });
        return;
      }
      for (const s of this.goalSpots()) this.text(s.mark, m.px(s.x), m.pz(s.z), s.foe ? '#ff9a7a' : '#ffe060', { align: 'center', base: 'middle', size: 16, bold: true });
      for (const n of this.world.state.actors) {
        if (n.kind === 'npc') {
          const mk = HO.npcMark(sh, n.id);
          this.text(mk && mk !== '·' ? mk : n.role === 'trainer' ? 'Т' : n.role === 'vendor' ? '$' : '•', m.px(n.x), m.pz(n.z), mk === '!' || mk === '?' ? '#ffe060' : '#a0ffb0', { align: 'center', base: 'middle', size: 13, bold: true });
        } else if (n.kind === 'obj' && (this.world.objDef(n) || {}).act === 'lift') this.text('Лифт', m.px(n.x), m.pz(n.z), '#7ad8ff', { align: 'center', base: 'middle', size: 11, bold: true });
        else if (n.kind === 'obj' && n.anchor) { this.text('⚓', m.px(n.x), m.pz(n.z), sh.anchors[n.anchor] ? '#7ad8ff' : '#5a7a9a', { align: 'center', base: 'middle', size: 15, bold: true }); this.hover(m.px(n.x) - 8, m.pz(n.z) - 8, 16, 16, [{ t: HO.ANCHORS[n.anchor].name, col: '#7ad8ff', bold: true }, { t: sh.anchors[n.anchor] ? 'Якорь открыт' : 'Якорь ещё не открыт', col: '#dfe4f0' }]); }
      }
      for (const md of z.medpoints || []) this.text('+', m.px(md.x), m.pz(md.z), '#60ff80', { align: 'center', base: 'middle', size: 16, bold: true });
      if (me.ghost && me.corpse) this.text('Тело', m.px(me.corpse.x), m.pz(me.corpse.z), '#9ad8ff', { align: 'center', base: 'middle', size: 12, bold: true });
      this.drawArrow(m.px(me.x), m.pz(me.z), me.yaw, 7);
      this.text('Вы здесь', m.px(me.x) + 10, m.pz(me.z) - 6, '#ffffff', { size: 11 });
    },

    drawArrow(px, py, yaw, s) {
      const c = this.hctx, fx = Math.sin(yaw), fz = -Math.cos(yaw);
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(px + fx * s, py + fz * s);
      c.lineTo(px - fz * s * 0.6 - fx * s * 0.6, py + fx * s * 0.6 - fz * s * 0.6);
      c.lineTo(px + fz * s * 0.6 - fx * s * 0.6, py - fx * s * 0.6 - fz * s * 0.6);
      c.closePath();
      c.fill();
    },

    drawMinimap(w) {
      const size = 150, x = w - size - 12, y = 12, me = this.hero(), sh = this.sheet(), c = this.hctx;
      const radius = 30, k = size / (radius * 2);
      this.panel(x - 2, y - 2, size + 4, size + 22);
      c.save();
      c.beginPath();
      c.rect(x, y, size, size);
      c.clip();
      c.fillStyle = '#0b1430';
      c.fillRect(x, y, size, size);
      const m = { k, px: wx => x + size / 2 + (wx - me.x) * k, pz: wz => y + size / 2 + (wz - me.z) * k };
      this.drawZonePlan(m, [x, y, x + size, y + size]);
      const sight = sh.race === 'foxian' ? 40 : 25;
      for (const f of this.world.foes()) {
        if (f.dead || Math.hypot(f.x - me.x, f.z - me.z) > sight) continue;
        c.fillStyle = f.state === 'fight' ? '#ff4040' : '#ff9a7a';
        c.fillRect(m.px(f.x) - 2, m.pz(f.z) - 2, 4, 4);
      }
      for (const s of this.goalSpots()) if (!s.foe) this.text(s.mark, m.px(s.x), m.pz(s.z), '#ffe060', { align: 'center', base: 'middle', size: 13, bold: true });
      for (const n of this.world.state.actors) {
        if (n.kind !== 'npc') continue;
        const mk = HO.npcMark(sh, n.id);
        this.text(mk === '!' || mk === '?' ? mk : '•', m.px(n.x), m.pz(n.z), mk === '!' || mk === '?' ? '#ffe060' : '#a0ffb0', { align: 'center', base: 'middle', size: 12, bold: true });
      }
      for (const n of this.world.state.actors) if (n.kind === 'obj' && n.anchor) this.text('⚓', m.px(n.x), m.pz(n.z), sh.anchors[n.anchor] ? '#7ad8ff' : '#5a7a9a', { align: 'center', base: 'middle', size: 12, bold: true });
      if (me.ghost && me.corpse) this.text('✚', m.px(me.corpse.x), m.pz(me.corpse.z), '#9ad8ff', { align: 'center', base: 'middle', size: 14, bold: true });
      this.drawArrow(x + size / 2, y + size / 2, me.yaw, 6);
      c.restore();
      const area = (this.world.zone.areas || []).find(a => me.x > a.x0 && me.x < a.x1 && me.z > a.z0 && me.z < a.z1);
      this.text(area ? area.name : this.world.zone.name.replace('Станция «Герта»: ', ''), x + size / 2, y + size + 4, '#f0d890', { align: 'center', size: 11 });
      this.button(x - 2, y + size + 22, 74, 18, 'Карта (M)', false, () => { this.win = this.win && this.win.type === 'map' ? null : { type: 'map' }; });
      this.button(x + 76, y + size + 22, 76, 18, 'Журнал (L)', false, () => { this.win = this.win && this.win.type === 'log' ? null : { type: 'log' }; });
    },

    drawTracker(w) {
      const sh = this.sheet(), off = this.heroUi().untracked, ids = Object.keys(sh.quests).filter(q => !off.includes(q)).slice(0, 5), x = w - 250;
      let y = 210;
      for (const q of ids) {
        const Q = HO.QUESTS[q], ready = HO.questReady(sh, q);
        this.text(Q.title + (ready ? ': сдать' : ''), x, y, ready ? '#a0ffb0' : '#f0d890', { bold: true, size: 12 });
        y += 16;
        if (ready) { this.text('  ' + HO.npcName(Q.turnIn), x, y, '#c8d0e0', { size: 11 }); y += 16; }
        else Q.goals.forEach((g, i) => {
          const have = HO.questGoalCount(sh, q, i), need = HO.goalNeed(g);
          if (have >= need) return;
          this.text('  ' + g.text + (need > 1 ? ': ' + have + '/' + need : ''), x, y, '#e0e4ee', { size: 11 });
          y += 15;
        });
        y += 4;
      }
    },

    drawBag(w, h) {
      const sh = this.sheet(), cell = 38, gap = 4, ww = 4 * (cell + gap) + 20, hh = Math.ceil(sh.bag.length / 4) * (cell + gap) + 64, x = w - ww - 12, y = Math.max(8, h - hh - 110);
      this.panel(x, y, ww, hh);
      this.text('Рюкзак', x + 10, y + 8, '#f0d890', { bold: true, size: 13 });
      this.button(x + ww - 28, y + 6, 22, 20, 'x', false, () => { this.bagOpen = false; });
      const vend = this.win && this.win.type === 'vendor' ? this.win.uid : 0;
      sh.bag.forEach((s, i) => {
        const cx = x + 10 + (i % 4) * (cell + gap), cy = y + 32 + Math.floor(i / 4) * (cell + gap);
        if (!s) { this.hctx.fillStyle = 'rgba(30,36,56,0.9)'; this.hctx.fillRect(cx, cy, cell, cell); return; }
        const it = HO.ITEMS[s.id];
        this.itemIcon(cx, cy, cell, s.id, s.n, it.kind === 'junk');
        if (it.kind === 'junk') this.text('хлам', cx + 3, cy + 2, '#c8a040', { size: 9, bold: true });
        const act = vend ? (it.kind === 'quest' ? 'Нельзя продать' : 'Щелчок: продать за ' + HO.sellPrice(s.id) * s.n + ' кр.') : it.kind === 'gear' ? 'Щелчок: надеть' : it.use ? 'Щелчок: использовать' : '';
        this.hover(cx, cy, cell, cell, this.itemLines(s.id, [...(act ? [{ t: act, col: '#a0ffb0' }] : []), ...this.compareLines(s.id)], s.dur));
        this.buttons.push({ x: cx, y: cy, w: cell, h: cell, fn: () => { if (vend) this.cmd({ t: 'sell', uid: vend, slot: i }); else this.cmd({ t: 'item', slot: i }); } });
      });
      this.text('Кредиты: ' + sh.credits, x + 10, y + hh - 22, '#f0d890', { size: 12 });
    },

    drawSkillsWin(w, h) {
      const a = this.hero(), sh = a.sheet, c = this.hctx;
      const ids = HO.pathAbilities(a.path).slice().sort((p, q) => HO.ABILITIES[p].lvl - HO.ABILITIES[q].lvl), racial = HO.RACIALS[a.race].id;
      const ww = 460, rowH = Math.min(36, Math.floor((h - 260) / (ids.length + 2))), hh = 78 + (ids.length + 1) * rowH + 30, x = Math.round(w / 2 - ww / 2), y = Math.max(20, Math.round((h - 120 - hh) / 2));
      this.winFrame(x, y, ww, hh, 'Умения: ' + HO.PATHS[a.path].name);
      this.text('Тяните умение на панель внизу. С панели: на другую ячейку или прочь, чтобы убрать', x + 12, y + 30, '#8890a8', { size: 10 });
      const onBar = new Set(this.barIds());
      const row = (id, ry) => {
        const ab = this.abilityOf(id), learned = ab.racial || ab.auto || sh.learned[id] >= 1, ready = learned && ab.lvl <= a.lvl, size = rowH - 6;
        c.fillStyle = ready ? (ab.racial ? '#5a8a6a' : HO.pathColor(a.path)) : '#2a2e3a';
        c.fillRect(x + 12, ry, size, size);
        this.text(ab.icon || ab.name.slice(0, 2).toUpperCase(), x + 12 + size / 2, ry + size / 2, ready ? '#141a30' : '#70768a', { align: 'center', base: 'middle', bold: true, size: 12 });
        const rank = HO.maxRank(id) > 1 && sh.learned[id] ? ', ранг ' + sh.learned[id] + ' из ' + HO.maxRank(id) : '';
        this.text(ab.name + rank, x + 20 + size, ry + 2, ready ? '#ffffff' : '#8890a8', { size: 12, bold: ready });
        const state = ready ? (onBar.has(id) ? 'на панели' : 'тяните на панель') : ab.lvl > a.lvl ? 'с ' + ab.lvl + '-го уровня' : ab.ult ? 'за классовое задание' : 'учит ' + HO.npcName(HO.PATH_TRAINER[a.path]).replace(/ \(.*\)$/, '');
        this.text(state, x + 20 + size, ry + 16, ready ? (onBar.has(id) ? '#a0ffb0' : '#f0d890') : '#8890a8', { size: 10 });
        this.text(ab.racial ? 'расовое' : ab.lvl + ' ур.', x + ww - 14, ry + 8, '#a8b0c8', { align: 'right', size: 11 });
        if (ready) this.buttons.push({ x: x + 12, y: ry, w: ww - 24, h: size, fn: () => { this.drag = { id, from: -1 }; } });
        this.hover(x + 12, ry, ww - 24, size, this.abilityLines(id).map((t, i) => ({ t, col: i ? '#dfe4f0' : '#f0d890', bold: !i })));
      };
      ids.forEach((id, i) => row(id, y + 48 + i * rowH));
      const ry = y + 48 + ids.length * rowH + 8;
      c.strokeStyle = 'rgba(216,191,114,0.5)';
      c.beginPath(); c.moveTo(x + 12, ry - 4); c.lineTo(x + ww - 12, ry - 4); c.stroke();
      row(racial, ry + 2);
    },

    drawCharacter(w, h) {
      const a = this.hero(), sh = this.sheet(), x = this.world.state.party ? 188 : 12, y = 96, ww = 440, top = sh.title ? 16 : 0, hh = 404 + top;
      this.panel(x, y, ww, hh);
      const inset = { x: x + 118, y: y + 48 + top, w: 204, h: 250 }, c = this.hctx;
      this.charInset = inset;
      c.clearRect(inset.x, inset.y, inset.w, inset.h);
      c.strokeStyle = 'rgba(216,191,114,0.6)';
      c.strokeRect(inset.x - 0.5, inset.y - 0.5, inset.w + 1, inset.h + 1);
      const slotAt = (slot, sx, sy) => {
        const g = sh.gear[slot], size = 42;
        if (g) {
          this.itemIcon(sx, sy, size, g.id, 1);
          this.hover(sx, sy, size, size, this.itemLines(g.id, [{ t: 'Щелчок: снять', col: '#a0ffb0' }], g.dur));
          if (g.dur < 100) this.text(g.dur === 0 ? 'сломано' : Math.round(g.dur) + '%', sx + size + 4, sy + 26, g.dur === 0 ? '#ff6050' : g.dur < 30 ? '#ffb040' : '#a8b0c8', { size: 10, bold: g.dur < 30 });
          this.buttons.push({ x: sx, y: sy, w: size, h: size, fn: () => this.cmd({ t: 'unequip', gear: slot }) });
        } else { c.fillStyle = 'rgba(30,36,56,0.9)'; c.fillRect(sx, sy, size, size); c.strokeStyle = 'rgba(120,130,160,0.6)'; c.strokeRect(sx + 0.5, sy + 0.5, size - 1, size - 1); }
        this.text(HO.GEAR_NAMES[slot], sx + size / 2, sy + size + 3, g ? (HO.QUALITY[HO.ITEMS[g.id].q] || HO.QUALITY[1]).col : '#6a7290', { align: 'center', size: 10 });
      };
      slotAt('cone', x + 38, inset.y + 128);
      ['head', 'hands', 'body', 'feet'].forEach((slot, i) => slotAt(slot, x + ww - 80, inset.y + 4 + i * 62));
      this.text(sh.name + ', ' + sh.lvl + ' ур.', x + 10, y + 8, '#f0d890', { bold: true, size: 13 });
      if (sh.title) this.text('Звание: «' + sh.title + '»', x + 10, y + 42, '#c8a0ff', { size: 11, bold: true });
      this.button(x + ww - 28, y + 6, 22, 20, 'x', false, () => { this.charOpen = false; });
      const trace = sh.trace && HO.TRACES[sh.path].find(t => t.id === sh.trace);
      this.text(HO.RACES[sh.race].one + ', ' + HO.PATHS[sh.path].name + (trace ? '. След: ' + trace.name : ''), x + 10, y + 26, '#a8b0c8', { size: 11 });
      if (trace) this.hover(x + 10, y + 26, ww - 20, 14, [{ t: trace.name, col: '#f0d890', bold: true }, { t: trace.text, col: '#dfe4f0' }]);
      const stats = [['НР', Math.round(this.world.stat(a, 'maxHp'))], ['Атака', Math.round(this.world.stat(a, 'atk') * 10) / 10], ['Защита', Math.round(this.world.stat(a, 'def'))], ['Скорость', 100], ['Шанс крит.', Math.round(C.crit * 100) + '%'], ['Урон крит.', Math.round((1 + C.critD) * 100) + '%']];
      stats.forEach(([k, v], i) => {
        const cx = x + 14 + (i % 3) * 140, cy = inset.y + inset.h + 26 + Math.floor(i / 3) * 18;
        this.text(k, cx, cy, '#a8b0c8', { size: 11 });
        this.text(String(v), cx + 124, cy, '#ffffff', { size: 11, align: 'right' });
      });
    }
  });

  HO.npcName = function (id) {
    for (const z of Object.values(HO.ZONES)) for (const n of z.npcs || []) if (n.id === id) return n.name + ' (' + z.name.replace('Станция «Герта»: ', '') + ')';
    if (id === 'asta') return 'Аста (Главная контрольная зона)';
    return id;
  };
})(globalThis.HO = globalThis.HO || {});
