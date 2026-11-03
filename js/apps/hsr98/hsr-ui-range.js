(function (H) {
  'use strict';
  const G = H.Gfx, RG = H.RANGE, TUN = RG.TUN;
  const { W, HGT } = H.UI_CONST;
  const K = { bg: '#0a0616', panel: '#140c24', head: '#1e1236', line: '#3a2a5a', hi: '#ff7ad8', num: '#5ad8ff', dim: '#8a7aaa', text: '#e4dcf4', warn: '#ffd471', weak: '#6aff9a', resist: '#ff8a7a' };
  const T = { top: 24, scene: 144, table: 168, row: 22, panel: 298, hint: 456 };
  const TIER_TAG = { boss: ['Б', '#ff7070'], elite: ['Э', '#f2dc9a'], normal: ['', K.dim] };
  const X = { no: 8, icon: 26, name: 46, lvl: 216, hpx: 254, hp: 300, atkx: 362, atk: 408, defx: 458, spd: 498, tough: 534, weak: 574 };
  const CELLS = [['lvl', X.lvl, 38, 'lvl'], ['hp', X.hpx, 46, 'mul'], ['atk', X.atkx, 46, 'mul'], ['def', X.defx, 40, 'mul'], ['spd', X.spd, 36, 'num'], ['tough', X.tough, 40, 'num']];
  const SCENE_K = 0.62;
  const SH = { x: 20, y: 26, bottom: 236, cols: 20, cell: 30 };
  const sheetCache = new Map();
  const ELEMS = ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'];
  const ELEM_STATE = { weak: ['слаб.', K.weak], normal: ['норм.', K.dim], resist: ['сопр.', K.resist] };
  const mulText = v => '×' + String(v).replace('.', ',');
  const big = ui => ui.held.includes('ShiftLeft') || ui.held.includes('ShiftRight');

  const frame = (c, x, y, w, h, fill) => {
    c.fillStyle = '#000'; c.fillRect(x, y, w, h);
    c.fillStyle = fill || K.panel; c.fillRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = K.line; c.fillRect(x + 1, y + 1, w - 2, 1); c.fillRect(x + 1, y + 1, 1, h - 2);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x + 1, y + h - 2, w - 2, 1); c.fillRect(x + w - 2, y + 1, 1, h - 2);
  };

  const nearest = (items, cur, dir, cells) => {
    const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
    let best = null, score = Infinity;
    for (const o of items) {
      if (!cells && o.id === cur.id) continue;
      if (cells && o.x === cur.x && o.y === cur.y) continue;
      const dx = o.x + o.w / 2 - cx, dy = o.y + o.h / 2 - cy;
      const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy, across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      if (along <= 0) continue;
      const v = along + across * 2;
      if (v < score) { score = v; best = o; }
    }
    return best;
  };

  Object.assign(H.UI.prototype, {
    openUi_range() {
      const s = this.openRangeTable();
      s.onClose = () => this.finishPending();
    },

    rangeLeave() {
      const g = this.game;
      if (this.mode === 'field' && g.map) this.audio.music(g.mapMusic(g.map.def));
      g.emit({ t: 'autosave' });
    },

    rangeLaunch(fn) {
      const g = this.game, hub = this.screens.find(s => s.range && s.onClose);
      this.screens = this.screens.filter(s => !s.range);
      if (hub) this.finishPending();
      if (fn) fn(); else g.rangeFight();
      this.drainGameEvents();
    },

    rangeItems(s) {
      const g = this.game, R = g.range(), rows = g.rangeRows(), list = [], y0 = T.table + 20;
      R.waves.forEach((w, i) => list.push({ id: 'w' + i, x: 6 + i * 66, y: T.top + 4, w: 62, h: 18, kind: 'wave', wave: i }));
      if (R.waves.length < TUN.maxWaves) list.push({ id: 'wadd', x: 6 + R.waves.length * 66, y: T.top + 4, w: 24, h: 18, kind: 'wadd' });
      for (let i = 0; i < TUN.maxRows; i++) {
        const y = y0 + i * T.row, o = rows[i];
        if (o) {
          list.push({ id: 'c' + i + '_name', x: X.name - 20, y, w: X.lvl - X.name + 18, h: T.row - 1, row: i, kind: 'name' });
          for (const [key, x, w, kind] of CELLS) list.push({ id: 'c' + i + '_' + key, x, y, w, h: T.row - 1, row: i, kind, key, num: kind !== 'mul' });
          list.push({ id: 'c' + i + '_weak', x: X.weak, y, w: 58, h: T.row - 1, row: i, kind: 'weak' });
        } else if (i === rows.length) list.push({ id: 'add', x: X.name - 20, y, w: X.lvl - X.name + 18, h: T.row - 1, row: i, kind: 'add' });
      }
      const p0 = T.panel + 26, row = s.row == null ? -1 : s.row, cur = rows[row];
      if (s.tab === 'row' && cur) {
        const d = H.ENEMIES[cur.id], fields = [{ kind: 'num', key: 'hpStart' }, { kind: 'num', key: 'res' }, { kind: 'act' }, { kind: 'flag', key: 'immortal' }].concat(RG.mechsOf(d).map(m => ({ kind: 'flag', key: m.key, mech: m })));
        fields.forEach((f, i) => list.push(Object.assign({ id: 'f_' + (f.key || f.kind), x: 12, y: p0 + i * 20, w: 232, h: 19, row, num: f.kind === 'num' }, f)));
        ELEMS.forEach((e, i) => list.push({ id: 'e_' + e, x: 254 + i * 32, y: p0 + 2, w: 30, h: 42, kind: 'elem', elem: e, row }));
        [['dummy', 'Манекен'], ['copy', 'Копия'], ['reset', 'Сбросить'], ['drop', 'Убрать']].forEach(([act, label], i) => list.push({ id: 'a_' + act, x: 254 + (i % 2) * 112, y: p0 + 56 + (i >> 1) * 24, w: 108, h: 21, kind: 'act2', act, label, row }));
      }
      if (s.tab === 'fight') {
        if (g.rangeExtra()) list.push({ id: 'k_extra', x: 240, y: T.panel + 4, w: 250, h: 19, kind: 'extra' });
        list.push({ id: 'team', x: 10, y: p0, w: 150, h: 122, kind: 'team' });
        RG.COND.forEach((f, i) => list.push({ id: 'k_' + f.key, x: 166 + (i > 5 ? 164 : 0), y: p0 + (i % 6) * 20, w: 160, h: 19, kind: 'cond', key: f.key }));
        list.push({ id: 'k_seed', x: 166 + 164, y: p0 + 5 * 20, w: 160, h: 19, kind: 'seed', num: true });
      }
      if (s.tab === 'hack') RG.HACKS.forEach((f, i) => list.push({ id: 'h_' + f.key, x: 12, y: p0 + i * 30, w: 200, h: 21, kind: 'hack', key: f.key, text: f.text, label: f.label }));
      list.push({ id: 'b20', x: W - 138, y: T.panel + 30, w: 62, h: 24, kind: 'batch', n: 20 }, { id: 'b100', x: W - 72, y: T.panel + 30, w: 62, h: 24, kind: 'batch', n: 100 });
      list.push({ id: 'go', x: W - 138, y: T.panel + 62, w: 128, h: 60, kind: 'go' });
      return list;
    },

    openRangeTable() {
      const ui = this, g = this.game;
      this.audio.music('sim');
      g.rangeClear();
      return this.push({
        full: true, range: true, name: 'range table', focus: 'c0_name', tab: 'row', row: 0, typed: '',
        items() { return ui.rangeItems(this); },
        cur() {
          const list = this.items();
          return list.find(o => o.id === this.focus) || list.find(o => o.kind === 'name') || list.find(o => o.kind === 'add') || list[0];
        },
        setFocus(o) {
          this.focus = o.id;
          this.typed = '';
          if (o.row != null && o.kind !== 'act2' && o.kind !== 'elem' && !/^f_/.test(o.id)) this.row = o.row;
        },
        move(dir) {
          const cur = this.cur(), to = nearest(this.items(), cur, dir);
          if (to) { this.setFocus(to); ui.sfx('select'); }
        },
        step(d) {
          const o = this.cur(), wide = big(ui);
          this.typed = '';
          if (o.kind === 'lvl' || o.kind === 'mul' || o.kind === 'num') g.rangeStep(o.row, o.key, d, wide);
          else if (o.kind === 'team') g.rangeSquadStep(d);
          else if (o.kind === 'wave' || o.kind === 'wadd') { g.rangeWave(g.range().wave + d); this.focus = 'w' + g.range().wave; this.row = 0; }
          else if (o.kind === 'act') g.rangeActStep(o.row, d);
          else if (o.kind === 'flag') g.rangeToggle(o.row, o.key);
          else if (o.kind === 'elem') g.rangeElemStep(o.row, o.elem, d);
          else if (o.kind === 'cond') g.rangeCondStep(o.key, d);
          else if (o.kind === 'hack') g.range().hack[o.key] = !g.range().hack[o.key];
          else if (o.kind === 'seed') g.rangeSeedStep(d);
          else return;
          ui.sfx('select');
        },
        ok() {
          const o = this.cur();
          if (o.kind === 'name' || o.kind === 'add') { ui.openRangeCatalog(o.row, this); return; }
          if (o.kind === 'weak') { this.tab = 'row'; this.row = o.row; this.focus = 'e_phys'; ui.sfx('select'); return; }
          if (o.kind === 'wave') { g.rangeWave(o.wave); this.row = 0; ui.sfx('select'); return; }
          if (o.kind === 'wadd') { g.rangeAddWave(); this.focus = 'add'; this.row = 0; ui.sfx('confirm'); return; }
          if (o.kind === 'team') { ui.openRangeTeam(); return; }
          if (o.kind === 'flag' || o.kind === 'act' || o.kind === 'elem' || o.kind === 'cond' || o.kind === 'hack') { this.step(1); return; }
          if (o.kind === 'act2') { this.act(o.act, o.row); return; }
          if (o.kind === 'extra') { g.range().extra = {}; this.focus = 'team'; ui.sfx('cancel'); return; }
          if (o.kind === 'batch') { ui.openRangeBatch(o.n); return; }
          if (o.kind === 'go') this.go();
        },
        act(act, row) {
          if (act === 'dummy') { g.rangeDummy(row); ui.sfx('confirm'); return; }
          if (act === 'copy') { if (g.rangeCopy(row)) ui.sfx('confirm'); else { ui.sfx('deny'); ui.toast('Не влезает на сцену.'); } return; }
          if (act === 'reset') { g.rangeReset(row); ui.sfx('cancel'); return; }
          if (act === 'drop') { g.rangeRemove(row); this.row = 0; this.focus = 'c0_name'; ui.sfx('cancel'); }
        },
        go() {
          if (!g.rangeReady()) { ui.sfx('deny'); return; }
          ui.sfx('confirm');
          ui.rangeLaunch();
        },
        clear() {
          const o = this.cur();
          if (o.kind === 'name') { g.rangeRemove(o.row); ui.sfx('cancel'); return; }
          if (o.kind === 'wave') { if (g.rangeDropWave(o.wave)) { this.focus = 'w' + g.range().wave; this.row = 0; ui.sfx('cancel'); } else ui.sfx('deny'); return; }
          if (o.key && o.kind !== 'cond') { g.rangeClearField(o.row, o.key); this.typed = ''; ui.sfx('cancel'); return; }
          if (o.kind === 'act') { const r = g.rangeRows()[o.row]; if (r) delete r.act; ui.sfx('cancel'); return; }
          if (o.kind === 'seed') { g.range().cond.seed = 0; ui.sfx('cancel'); return; }
          if (o.kind === 'extra') { g.range().extra = {}; this.focus = 'team'; ui.sfx('cancel'); }
        },
        digit(n) {
          const o = this.cur();
          if (o.kind === 'seed') {
            const next = (this.typed || '') + n;
            this.typed = next.length > 9 ? String(n) : next;
            g.range().cond.seed = +this.typed;
            ui.sfx('select');
            return;
          }
          if (!o.key || !RG.NUMS[o.key]) return;
          const next = (this.typed || '') + n, hi = RG.NUMS[o.key][1];
          this.typed = +next > hi ? String(n) : next;
          g.rangeType(o.row, o.key, +this.typed);
          ui.sfx('select');
        },
        close() {
          ui.pop();
          ui.rangeLeave();
        },
        draw(c) {
          c.fillStyle = K.bg; c.fillRect(0, 0, W, HGT);
          const rows = g.rangeRows();
          if (this.row >= rows.length) this.row = Math.max(0, rows.length - 1);
          ui.rangeHead(c, this);
          ui.rangeScene(c, rows, this);
          ui.rangeWaves(c, this);
          ui.rangeGrid(c, this);
          ui.rangePanel(c, this);
          ui.hints([['←→↑↓', 'ячейка'], ['Q/E', 'число'], ['Enter', 'открыть'], ['Space', 'запуск'], ['R', 'прогон'], ['Tab', 'вкладка'], ['Del', 'сброс'], ['Esc', 'выход']], 8, T.hint + 4);
          ui.rangeStepper(c, this);
        },
        key(k, code) {
          if (k === 'back') { this.close(); return; }
          if (code === 'Space') { this.go(); return; }
          if (code === 'Tab') { this.tab = this.tab === 'row' ? 'fight' : this.tab === 'fight' ? 'hack' : 'row'; this.focus = /^(f_|e_|a_|k_|h_|team)/.test(this.focus) ? 'c' + this.row + '_name' : this.focus; ui.sfx('select'); return; }
          if (k === 'ok') { this.ok(); return; }
          if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { this.move(k); return; }
          if (code === 'KeyQ') { this.step(-1); return; }
          if (code === 'KeyE') { this.step(1); return; }
          if (code === 'PageUp' || code === 'PageDown') { g.rangeWave(g.range().wave + (code === 'PageUp' ? -1 : 1)); this.row = 0; ui.sfx('select'); return; }
          if (code === 'Delete' || code === 'Backspace' || code === 'KeyX') { this.clear(); return; }
          if (code === 'KeyL') { ui.openRangeLog(this); return; }
          if (code === 'KeyR') { if (g.rangeReady()) ui.openRangeBatch(100); else ui.sfx('deny'); return; }
          if (code === 'KeyC') { const o = this.cur(); if (o.row != null && g.rangeRows()[o.row]) this.act('copy', o.row); return; }
          if (code === 'KeyZ') { if (g.rangeUndo()) { this.row = 0; ui.sfx('confirm'); } else ui.sfx('deny'); return; }
          const m = /^(?:Digit|Numpad)(\d)$/.exec(code || '');
          if (m) this.digit(m[1]);
        }
      });
    },

    rangeHead(c, s) {
      const g = this.game, C = g.range().cond;
      frame(c, 0, 0, W, T.top, K.head);
      this.text('ПОЛИГОН', 10, 5, { size: 13, bold: true, serif: true, col: K.hi });
      this.text('Leveling_Solo', 100, 8, { size: 10, col: K.dim });
      if (RG.HACKS.some(f => g.range().hack[f.key])) this.text('ХАКИ', 186, 7, { size: 11, bold: true, col: K.warn });
      this.text(C.seed ? 'Сид: ' + C.seed : 'Сид: случайный', W - 112, 8, { align: 'right', size: 10, col: C.seed ? K.warn : K.dim });
      this.button(W - 104, 3, 76, 18, 'Журнал', () => this.openRangeLog(s), { size: 10 });
      this.hit(W - 24, 3, 18, 18, () => s.close());
      this.text('×', W - 15, 3, { align: 'center', size: 14, bold: true, col: K.text });
    },

    openRangeLog(table) {
      const ui = this, g = this.game;
      return this.push({
        range: true, name: 'range log', sel: 0, sc: { top: 0 }, tab: 'log', msel: 0,
        close() { ui.screens = ui.screens.filter(x => x !== this); },
        done(text) {
          this.close();
          table.row = 0;
          table.focus = 'c0_name';
          ui.sfx('confirm');
          ui.toast(text);
        },
        take(i) {
          if (!g.rangeLogLoad(i)) { ui.sfx('deny'); return; }
          this.done('Настройка загружена. Z вернёт прежнюю.');
        },
        mark(i) {
          if (g.range().marks[i]) { if (g.rangeMarkLoad(i)) this.done('Закладка загружена. Z вернёт прежнюю.'); return; }
          if (g.rangeMarkSave(i)) { ui.sfx('confirm'); ui.toast('Настройка сохранена в закладку ' + (i + 1) + '.'); } else ui.sfx('deny');
        },
        draw(c) {
          const R = g.range(), log = R.log, row = 32, x0 = 44, y0 = 86;
          ui.win(30, 30, 580, 416, { title: this.tab === 'log' ? 'Журнал запусков · ' + log.length : 'Закладки' });
          ui.button(44, 56, 110, 20, 'Журнал', () => { this.tab = 'log'; ui.sfx('select'); }, { active: this.tab === 'log', size: 10 });
          ui.button(158, 56, 110, 20, 'Закладки', () => { this.tab = 'marks'; ui.sfx('select'); }, { active: this.tab === 'marks', size: 10 });
          if (this.tab === 'marks') {
            R.marks.forEach((m, i) => {
              const y = y0 + i * row, on = i === this.msel;
              c.fillStyle = on ? 'rgba(255,122,216,0.14)' : i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)'; c.fillRect(x0, y, 552, row - 3);
              if (on) { c.strokeStyle = K.hi; c.strokeRect(x0 + 0.5, y + 0.5, 551, row - 4); }
              ui.text(String(i + 1), x0 + 14, y + 8, { align: 'center', size: 11, bold: true, col: K.dim });
              ui.text(m ? ui.fitText(m.label, 11, 480, true) : '+ сохранить текущую настройку', x0 + 30, y + 8, { size: 11, bold: !!m, col: m ? K.text : K.dim });
              ui.hit(x0, y, 552, row - 3, () => { if (this.msel === i) this.mark(i); else { this.msel = i; ui.sfx('select'); } });
            });
            ui.hints([['↑↓', 'ячейка'], ['Enter', 'сохранить или загрузить'], ['Del', 'удалить'], ['Tab', 'журнал'], ['Esc', 'назад']], 44, 422);
            return;
          }
          if (!log.length) ui.text('Запусков ещё не было.', W / 2, 200, { align: 'center', size: 12, col: K.dim });
          log.forEach((o, i) => {
            const y = y0 + i * row, on = i === this.sel, d = new Date(o.at);
            c.fillStyle = on ? 'rgba(255,122,216,0.14)' : i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)'; c.fillRect(x0, y, 552, row - 3);
            if (on) { c.strokeStyle = K.hi; c.strokeRect(x0 + 0.5, y + 0.5, 551, row - 4); }
            ui.text(ui.fitText(o.label, 11, 280, true), x0 + 8, y + 3, { size: 11, bold: true, col: K.text });
            ui.text(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '   ' + RG.KINDS[o.kind] + (o.edited ? ', правки в бою' : '') + (o.hacked ? ', хаки' : ''), x0 + 8, y + 16, { size: 10, col: K.dim });
            ui.text('Циклов ' + o.cycles, x0 + 390, y + 8, { align: 'right', size: 10, col: K.text });
            ui.text('За цикл ' + H.fmt(o.perCycle), x0 + 500, y + 8, { align: 'right', size: 10, bold: true, col: K.num });
            ui.text('Сид ' + o.seed, x0 + 546, y + 16, { align: 'right', size: 9, col: K.dim });
            ui.hit(x0, y, 552, row - 3, () => { if (this.sel === i) this.take(i); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['↑↓', 'запуск'], ['Enter', 'вернуть настройку'], ['Tab', 'закладки'], ['Esc', 'назад']], 44, 422);
        },
        key(k, code) {
          if (k === 'back') { this.close(); ui.sfx('cancel'); return; }
          if (code === 'Tab') { this.tab = this.tab === 'log' ? 'marks' : 'log'; ui.sfx('select'); return; }
          if (this.tab === 'marks') {
            const n = g.range().marks.length;
            if (k === 'up') { this.msel = (this.msel + n - 1) % n; ui.sfx('select'); return; }
            if (k === 'down') { this.msel = (this.msel + 1) % n; ui.sfx('select'); return; }
            if (k === 'ok') { this.mark(this.msel); return; }
            if (code === 'Delete' || code === 'Backspace' || code === 'KeyX') ui.sfx(g.rangeMarkDrop(this.msel) ? 'cancel' : 'deny');
            return;
          }
          if (k === 'ok') { this.take(this.sel); return; }
          ui.listNav(this, k, g.range().log.length);
        }
      });
    },

    rangeScene(c, rows, s) {
      const y0 = T.top, h = T.scene, g = this.game, ids = rows.map(o => o.id);
      const bg = g.rangeLook(ids.length ? ids : [TUN.foe], ids.some(id => H.ENEMIES[id].boss)).bg;
      c.save();
      c.beginPath(); c.rect(0, y0, W, h); c.clip();
      c.drawImage(G.bgCanvas(bg, W, HGT), 0, 120, W, h, 0, y0, W, h);
      const at = RG.layout(ids, W), mid = W / 2 + 34;
      at.forEach((p, i) => {
        const size = p.s * SCENE_K, foot = y0 + h - 14, cx = W / 2 + (p.x - mid) * SCENE_K, on = i === s.row;
        c.fillStyle = on ? 'rgba(255,122,216,0.45)' : 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(cx, foot + 2, size * 0.3, 5, 0, 0, Math.PI * 2); c.fill();
        G.drawEnemy(c, H.ENEMIES[ids[i]], cx, foot, size, { t: this.t + i });
        this.text(String(i + 1), cx, foot + 2, { align: 'center', size: 10, bold: true, col: on ? K.hi : K.text });
        this.hit(cx - size * 0.35, foot - size, size * 0.7, size, () => { s.row = i; s.focus = 'c' + i + '_name'; this.sfx('select'); });
      });
      c.restore();
      if (!rows.length) this.text('В этой волне нет врагов', W / 2, y0 + h / 2 - 6, { align: 'center', size: 12, col: K.warn });
      const tip = g.rangeTip();
      if (tip) { const tw = this.measure(tip, 10) + 12, tx = W - tw - 6, ty = y0 + 4; c.fillStyle = 'rgba(10,6,22,0.8)'; c.fillRect(tx, ty, tw, 16); this.text(tip, tx + 6, ty + 2, { size: 10, col: K.hi }); }
    },

    rangeWaves(c, s) {
      const g = this.game, R = g.range();
      for (const it of s.items()) {
        if (it.kind !== 'wave' && it.kind !== 'wadd') continue;
        const on = it.kind === 'wave' && it.wave === R.wave, focus = s.cur().id === it.id;
        c.fillStyle = on ? K.head : 'rgba(10,6,22,0.8)'; c.fillRect(it.x, it.y, it.w, it.h);
        c.strokeStyle = focus ? K.hi : K.line; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1);
        const label = it.kind === 'wadd' ? '+' : 'Волна ' + (it.wave + 1) + (R.waves[it.wave].length ? '' : ' –');
        this.text(label, it.x + it.w / 2, it.y + 3, { align: 'center', size: 10, bold: on, col: on ? K.hi : K.text });
        this.hit(it.x, it.y, it.w, it.h, () => { s.setFocus(it); s.ok(); });
      }
    },

    rangeGrid(c, s) {
      const g = this.game, rows = g.rangeRows(), y0 = T.table, R = g.range(), prev = g.rangePreview()[R.wave] || [], cur = s.cur();
      frame(c, 0, y0, W, T.panel - y0, K.panel);
      const head = (t, x, o) => this.text(t, x, y0 + 5, Object.assign({ size: 10, bold: true, col: K.dim }, o));
      head('№', X.no); head('Враг', X.name); head('Ур.', X.lvl + 34, { align: 'right' }); head('HP×', X.hpx + 42, { align: 'right' }); head('HP', X.hp + 58, { align: 'right' }); head('АТК×', X.atkx + 42, { align: 'right' }); head('АТК', X.atk + 46, { align: 'right' }); head('ЗАЩ×', X.defx + 37, { align: 'right' }); head('СКР', X.spd + 32, { align: 'right' }); head('СТК', X.tough + 36, { align: 'right' }); head('Слаб.', X.weak + 4);
      for (const it of s.items()) {
        if (!/^(c\d_|add$)/.test(it.id)) continue;
        if (it.id === cur.id) { c.strokeStyle = K.hi; c.lineWidth = 1; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1); }
        this.hit(it.x, it.y, it.w, it.h, () => { if (s.focus === it.id) s.ok(); else { s.setFocus(it); this.sfx('select'); } });
        if (it.key) this.wheelZone(it.x, it.y, it.w, it.h, d => { s.setFocus(it); s.step(-d); });
      }
      rows.forEach((o, i) => {
        const y = y0 + 20 + i * T.row, d = H.ENEMIES[o.id], [tag, tcol] = TIER_TAG[RG.tierOf(d)], p = prev[i] || {}, on = i === s.row;
        if (on) { c.fillStyle = 'rgba(255,122,216,0.08)'; c.fillRect(4, y, W - 8, T.row - 1); }
        this.text(String(i + 1), X.no + 6, y + 4, { align: 'center', size: 10, col: on ? K.hi : K.dim });
        G.foeIcon(c, d, X.icon, y + 2, 18);
        this.text(this.fitText(RG.nameOf(d), 10, X.lvl - X.name - 18, false), X.name, y + 5, { size: 10, col: K.text });
        if (tag) this.text(tag, X.lvl - 8, y + 5, { align: 'center', size: 10, bold: true, col: tcol });
        const cell = (t, x, changed, sz) => this.text(t, x, y + (sz === 12 ? 3 : 5), { align: 'right', size: sz || 10, bold: sz === 12, col: changed ? K.warn : K.num });
        cell(String(o.lvl), X.lvl + 34, false, 12);
        cell(mulText(RG.valueOf(o, 'hp')), X.hpx + 42, o.hp != null);
        this.text(H.fmt(p.hp || 0), X.hp + 58, y + 5, { align: 'right', size: 10, col: K.text });
        cell(mulText(RG.valueOf(o, 'atk')), X.atkx + 42, o.atk != null);
        this.text(H.fmt(p.atk || 0), X.atk + 46, y + 5, { align: 'right', size: 10, col: K.text });
        cell(mulText(RG.valueOf(o, 'def')), X.defx + 37, o.def != null);
        cell(String(RG.valueOf(o, 'spd')), X.spd + 32, o.spd != null);
        cell(o.tough === TUN.inf ? '∞' : String(RG.valueOf(o, 'tough')), X.tough + 36, o.tough != null);
        (o.weak || d.weak).forEach((e, n) => G.elemIcon(c, e, X.weak + 5 + n * 8, y + 11, 4));
        if (o.weak) { c.fillStyle = K.warn; c.fillRect(X.weak + 1, y + 3, 2, T.row - 7); }
      });
      if (rows.length < TUN.maxRows) this.text('+ добавить врага', X.name, y0 + 20 + rows.length * T.row + 5, { size: 10, col: K.dim });
    },

    rangePanel(c, s) {
      const y0 = T.panel;
      frame(c, 0, y0, W, T.hint - y0, K.panel);
      [['row', 'Строка'], ['fight', 'Бой'], ['hack', 'Хаки']].forEach(([id, label], i) => {
        const x = 8 + i * 74, on = s.tab === id;
        c.fillStyle = on ? K.head : '#0a0616'; c.fillRect(x, y0 + 4, 70, 18);
        c.strokeStyle = on ? K.hi : K.line; c.strokeRect(x + 0.5, y0 + 4.5, 69, 17);
        this.text(label, x + 35, y0 + 7, { align: 'center', size: 10, bold: on, col: on ? K.hi : K.text });
        this.hit(x, y0 + 4, 70, 18, () => { s.tab = id; this.sfx('select'); });
      });
      if (s.tab === 'row') this.rangeRowTab(c, s); else if (s.tab === 'fight') this.rangeFightTab(c, s); else this.rangeHackTab(c, s);
      const b = s.items().find(o => o.id === 'go'), ready = this.game.rangeReady();
      this.text('Прогон без анимации', W - 74, y0 + 16, { align: 'center', size: 9, col: K.dim });
      for (const it of s.items()) if (it.kind === 'batch') this.button(it.x, it.y, it.w, it.h, '×' + it.n, () => { s.focus = it.id; if (ready) this.openRangeBatch(it.n); else this.sfx('deny'); }, { active: s.cur().id === it.id, disabled: !ready, size: 11 });
      this.button(b.x, b.y, b.w, b.h, 'ЗАПУСК', () => s.go(), { active: s.cur().id === 'go', disabled: !ready, bold: true, size: 15 });
      if (!ready) this.text('Добавь врага', b.x + b.w / 2, b.y + b.h + 2, { align: 'center', size: 10, col: K.warn });
    },

    rangeFieldLine(c, s, it, label, value, changed) {
      const on = s.cur().id === it.id;
      c.fillStyle = on ? 'rgba(255,122,216,0.12)' : 'rgba(0,0,0,0.2)'; c.fillRect(it.x, it.y, it.w, it.h);
      if (on) { c.strokeStyle = K.hi; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1); }
      this.text(label, it.x + 6, it.y + 4, { size: 10, col: K.dim });
      const lw = this.measure(label, 10) + 12;
      this.text(this.fitText(value, 10, it.w - lw - 6, true), it.x + it.w - 5, it.y + 4, { align: 'right', size: 10, bold: true, col: changed ? K.warn : K.num });
      this.hit(it.x, it.y, it.w, it.h, () => { if (s.focus === it.id) s.ok(); else { s.setFocus(it); this.sfx('select'); } });
      this.wheelZone(it.x, it.y, it.w, it.h, d => { s.setFocus(it); s.step(-d); });
    },

    rangeRowTab(c, s) {
      const g = this.game, o = g.rangeRows()[s.row], y0 = T.panel;
      if (!o) { this.text('Выберите врага в таблице', 16, y0 + 34, { size: 11, col: K.dim }); return; }
      const d = H.ENEMIES[o.id];
      this.text(this.fitText(RG.nameOf(d), 10, 250, true), 240, y0 + 8, { size: 10, bold: true, col: K.text });
      for (const it of s.items()) {
        if (it.id === 'f_hpStart') this.rangeFieldLine(c, s, it, 'Старт HP', RG.valueOf(o, 'hpStart') + '%', o.hpStart != null);
        else if (it.id === 'f_res') this.rangeFieldLine(c, s, it, 'Сопр. эффектам', RG.valueOf(o, 'res') + '%', o.res != null);
        else if (it.id === 'f_act') this.rangeFieldLine(c, s, it, 'Поведение', RG.actName(d, o.act), !!o.act);
        else if (it.id === 'f_immortal') this.rangeFieldLine(c, s, it, 'Бессмертие', o.immortal ? 'Да' : 'Нет', !!o.immortal);
        else if (it.mech) this.rangeFieldLine(c, s, it, it.mech.label, o[it.key] ? it.mech.on : it.mech.off, !!o[it.key]);
        else if (it.kind === 'elem') {
          const st = g.rangeElem(o, it.elem), [label, col] = ELEM_STATE[st], on = s.cur().id === it.id;
          c.fillStyle = on ? 'rgba(255,122,216,0.12)' : 'rgba(0,0,0,0.2)'; c.fillRect(it.x, it.y, it.w, it.h);
          c.strokeStyle = on ? K.hi : st === 'normal' ? K.line : col; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1);
          G.elemIcon(c, it.elem, it.x + it.w / 2, it.y + 13, 7);
          this.text(label, it.x + it.w / 2, it.y + 26, { align: 'center', size: 9, col });
          this.hit(it.x, it.y, it.w, it.h, () => { if (s.focus === it.id) s.ok(); else { s.setFocus(it); this.sfx('select'); } });
        } else if (it.kind === 'act2') {
          this.button(it.x, it.y, it.w, it.h, it.label, () => { s.setFocus(it); s.ok(); }, { active: s.cur().id === it.id, size: 10 });
        }
      }
    },

    rangeFightTab(c, s) {
      const g = this.game, R = g.range(), C = R.cond;
      for (const it of s.items()) {
        if (it.kind === 'extra') { const x = g.rangeExtra(); this.rangeFieldLine(c, s, it, 'Условие встречи', x.field ? x.field.name : x.allyBuff[0].name, true); }
        else if (it.kind === 'cond') {
          const f = RG.COND.find(x => x.key === it.key), def = f.def !== undefined ? f.def : f.opts[0][0];
          this.rangeFieldLine(c, s, it, f.label, g.rangeCondText(it.key), C[it.key] !== def);
        } else if (it.kind === 'seed') this.rangeFieldLine(c, s, it, 'Сид', C.seed ? String(C.seed) : 'Случайный', !!C.seed);
        else if (it.kind === 'team') {
          const on = s.cur().id === 'team';
          c.fillStyle = on ? 'rgba(255,122,216,0.12)' : 'rgba(0,0,0,0.2)'; c.fillRect(it.x, it.y, it.w, it.h);
          if (on) { c.strokeStyle = K.hi; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1); }
          this.text(R.team.own ? 'Свой состав' : 'Отряд ' + (R.team.squad + 1), it.x + 6, it.y + 4, { size: 11, bold: true, col: K.warn });
          g.rangeKeys().forEach((k, i) => {
            const x = it.x + 5 + (i % 2) * 72, y = it.y + 20 + (i >> 1) * 50, kid = g.rangeKit(k), kit = H.CHARS[kid];
            this.portraitCard(c, G.lookOf(kid, g), x, y, 40, { elem: kit.elem, border: G.RARITY[kit.rarity] });
            this.text(String(g.rangeHeroLvl(k)), x + 44, y + 14, { size: 10, col: K.text });
          });
          this.hit(it.x, it.y, it.w, it.h, () => { if (s.focus === 'team') s.ok(); else { s.setFocus(it); this.sfx('select'); } });
        }
      }
    },

    rangeHackTab(c, s) {
      const g = this.game, H0 = g.range().hack;
      for (const it of s.items()) {
        if (it.kind !== 'hack') continue;
        this.rangeFieldLine(c, s, it, it.label, H0[it.key] ? 'Вкл' : 'Выкл', H0[it.key]);
        this.wrap(it.text, 270, 10).slice(0, 2).forEach((l, i) => this.text(l, it.x + it.w + 8, it.y + i * 12 - 1, { size: 10, col: K.dim }));
      }
      if (RG.HACKS.some(f => H0[f.key])) this.text('С хаками запуск не сравнивается. С.В.', 240, T.panel + 8, { size: 10, bold: true, col: K.warn });
      else this.text('Запись с этими галочками я не засчитаю. С.В.', 240, T.panel + 8, { size: 10, col: K.dim });
    },

    rangeStepper(c, s) {
      const o = s.cur();
      if (!(o.kind === 'lvl' || o.kind === 'mul' || o.kind === 'num' || o.kind === 'act' || o.kind === 'cond' || o.kind === 'seed')) return;
      const w = 22, x = Math.min(W - w * 2 - 4, o.x + o.w / 2 - w), y = o.y - 19;
      [[-1, '◄'], [1, '►']].forEach(([d, t], i) => {
        const bx = x + i * w;
        c.fillStyle = K.head; c.fillRect(bx, y, w - 1, 18);
        c.strokeStyle = K.hi; c.strokeRect(bx + 0.5, y + 0.5, w - 2, 17);
        this.text(t, bx + (w - 1) / 2, y + 3, { align: 'center', size: 10, bold: true, col: K.hi });
        this.hit(bx, y, w - 1, 18, () => s.step(d));
      });
    },

    openRangeTeam() {
      const ui = this, g = this.game;
      const items = () => {
        const list = [];
        for (let i = 0; i < H.SQUADS; i++) list.push({ id: 's' + i, x: 28 + (i % 2) * 294, y: 44 + (i >> 1) * 56, w: 288, h: 52, squad: i });
        list.push({ id: 'own', x: 28, y: 44 + 6 * 56, w: 288, h: 52, own: true });
        list.push({ id: 'edit', x: 322, y: 44 + 6 * 56, w: 288, h: 52, edit: true });
        return list;
      };
      const R0 = g.range();
      return this.push({
        range: true, name: 'range team', focus: R0.team.own ? 'own' : 's' + R0.team.squad,
        cur() { return items().find(o => o.id === this.focus) || items()[0]; },
        ok() {
          const o = this.cur();
          if (o.edit) { ui.openRangeOwn(); return; }
          const done = o.own ? g.rangeUseOwn() : g.rangeUseSquad(o.squad);
          if (!done) { ui.sfx('deny'); return; }
          ui.sfx('confirm');
          ui.screens = ui.screens.filter(s => s !== this);
        },
        draw(c) {
          const R = g.range();
          ui.win(16, 14, 608, 444, { title: 'Отряд для боя' });
          for (const it of items()) {
            const on = this.focus === it.id, used = it.own ? R.team.own : !it.edit && !R.team.own && R.team.squad === it.squad;
            c.fillStyle = on ? 'rgba(255,122,216,0.14)' : 'rgba(0,0,0,0.25)'; c.fillRect(it.x, it.y, it.w, it.h);
            c.strokeStyle = on ? K.hi : used ? K.warn : K.line; c.strokeRect(it.x + 0.5, it.y + 0.5, it.w - 1, it.h - 1);
            this.hitRow(it);
            if (it.edit) { ui.text('Собрать свой состав', it.x + it.w / 2, it.y + 19, { align: 'center', size: 12, bold: true, col: K.text }); continue; }
            const keys = it.own ? R.own : g.squadOf(it.squad);
            ui.text(it.own ? 'Свой' : 'Отряд ' + (it.squad + 1), it.x + 8, it.y + 6, { size: 11, bold: true, col: used ? K.warn : K.text });
            if (!keys.length) ui.text('пусто', it.x + 8, it.y + 24, { size: 10, col: K.dim });
            keys.slice(0, 4).forEach((k, i) => {
              const kid = g.rangeKit(k), kit = H.CHARS[kid];
              ui.portraitCard(c, G.lookOf(kid, g), it.x + 64 + i * 54, it.y + 4, 44, { elem: kit.elem, border: G.RARITY[kit.rarity] });
            });
          }
          ui.hints([['←→↑↓', 'выбор'], ['Enter', 'взять'], ['Esc', 'назад']], 32, 438);
        },
        hitRow(it) {
          ui.hit(it.x, it.y, it.w, it.h, () => { if (this.focus === it.id) this.ok(); else { this.focus = it.id; ui.sfx('select'); } });
        },
        key(k) {
          if (k === 'back') { ui.screens = ui.screens.filter(s => s !== this); ui.sfx('cancel'); return; }
          if (k === 'ok') { this.ok(); return; }
          if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { const to = nearest(items(), this.cur(), k); if (to) { this.focus = to.id; ui.sfx('select'); } }
        }
      });
    },

    openRangeOwn() {
      const ui = this, g = this.game, GR = { cols: 4, vis: 5, w: 132, h: 64, gap: 4, x: 42, y: 84 };
      return this.push({
        range: true, name: 'range own', sel: 0, sc: { top: 0 }, trial: false, tsel: 0, tsc: { top: 0 },
        close() { ui.screens = ui.screens.filter(x => x !== this); },
        toggle(k) { ui.sfx(g.rangeOwnToggle(k) ? 'select' : 'deny'); },
        draw(c) {
          const R = g.range();
          c.fillStyle = K.bg; c.fillRect(0, 0, W, HGT);
          ui.win(30, 16, 580, 434, { title: 'Свой состав · ' + R.own.length + ' из 4' });
          ui.button(44, 40, 120, 20, 'Свои герои', () => { this.trial = false; ui.sfx('select'); }, { active: !this.trial, size: 10 });
          ui.button(168, 40, 150, 20, 'Пробные герои', () => { this.trial = true; ui.sfx('select'); }, { active: this.trial, size: 10 });
          R.own.forEach((k, i) => { const kid = g.rangeKit(k), kit = H.CHARS[kid]; ui.portraitCard(c, G.lookOf(kid, g), 440 + i * 40, 30, 34, { elem: kit.elem, border: G.RARITY[kit.rarity] }); });
          if (!this.trial) {
            ui.charGrid(this, c, ui.rosterKeys(), R.own, 'настоящие отряды не меняются');
            ui.hints([['←↑↓→', 'выбор'], ['Enter', 'взять или убрать'], ['Tab', 'пробные'], ['Esc', 'готово']], W / 2, 426, { align: 'center' });
            return;
          }
          const ids = g.rangeTrialIds(), rows = Math.ceil(ids.length / GR.cols), top = ui.listTop(this.tsc, Math.floor(this.tsel / GR.cols), rows, GR.vis);
          ui.text('Уровень ' + R.trialLvl + '. Без реликвий и конусов, Эйдолоны 0.', 44, 66, { size: 10, col: K.warn });
          if (!ids.length) ui.text('Все герои игры уже есть в ростере.', W / 2, 200, { align: 'center', size: 12, col: K.dim });
          for (let i = top * GR.cols; i < Math.min(ids.length, (top + GR.vis) * GR.cols); i++) {
            const id = ids[i], x = GR.x + (i % GR.cols) * (GR.w + GR.gap), y = GR.y + (Math.floor(i / GR.cols) - top) * (GR.h + GR.gap), on = i === this.tsel, kit = H.CHARS[id], at = R.own.indexOf('trial:' + id);
            c.fillStyle = on ? 'rgba(255,122,216,0.16)' : 'rgba(0,0,0,0.3)'; c.fillRect(x, y, GR.w, GR.h);
            if (on) { c.strokeStyle = K.hi; c.strokeRect(x + 0.5, y + 0.5, GR.w - 1, GR.h - 1); }
            ui.portraitCard(c, G.lookOf(id, g), x + 6, y + 8, 48, { elem: kit.elem, border: G.RARITY[kit.rarity] });
            ui.text(ui.fitText(kit.name, 11, GR.w - 64, true), x + 60, y + 8, { size: 11, bold: true, col: on ? K.hi : K.text });
            G.pathIcon(c, kit.path, x + 60, y + 26, 12);
            G.elemIcon(c, kit.elem, x + 84, y + 32, 6);
            if (at >= 0) ui.text(String(at + 1), x + GR.w - 10, y + GR.h - 16, { align: 'center', size: 11, bold: true, col: K.warn });
            ui.hit(x, y, GR.w, GR.h, () => { if (this.tsel === i) this.toggle('trial:' + id); else { this.tsel = i; ui.sfx('select'); } });
          }
          if (rows > GR.vis) ui.scrollBar(GR.x + GR.cols * (GR.w + GR.gap) + 2, GR.y, GR.vis * (GR.h + GR.gap) - GR.gap, this.tsc, rows, GR.vis);
          ui.wheelZone(GR.x, GR.y, GR.cols * (GR.w + GR.gap) + 14, GR.vis * (GR.h + GR.gap), d => { this.tsc.top += d; });
          ui.hints([['←↑↓→', 'выбор'], ['Enter', 'взять'], ['Q/E', 'уровень'], ['Tab', 'свои'], ['Esc', 'готово']], W / 2, 432, { align: 'center' });
        },
        key(k, code) {
          if (k === 'back') { this.close(); ui.sfx('cancel'); return; }
          if (code === 'Tab') { this.trial = !this.trial; ui.sfx('select'); return; }
          if (!this.trial) {
            const list = ui.rosterKeys();
            ui.charGridKey(this, k, list.length);
            if (k === 'ok') this.toggle(list[this.sel]);
            return;
          }
          const ids = g.rangeTrialIds();
          if (!ids.length) return;
          if (code === 'KeyQ' || code === 'KeyE') { g.rangeTrialLvl(code === 'KeyQ' ? -1 : 1, big(ui)); ui.sfx('select'); return; }
          const step = { left: -1, right: 1, up: -GR.cols, down: GR.cols }[k];
          if (step) { this.tsel = H.clamp(this.tsel + step, 0, ids.length - 1); ui.sfx('select'); }
          if (k === 'ok') this.toggle('trial:' + ids[this.tsel]);
        }
      });
    },

    openRangeBatch(n) {
      const ui = this, g = this.game;
      const job = g.rangeBatchStart(n);
      if (!job) { ui.sfx('deny'); return null; }
      return this.push({
        range: true, full: true, name: 'range batch', job, result: null,
        tick() {
          if (this.result) return;
          if (g.rangeBatchStep(this.job, 8)) { this.result = g.rangeBatchResult(this.job); ui.sfx('confirm'); }
        },
        close() { ui.screens = ui.screens.filter(x => x !== this); ui.sfx('cancel'); },
        again() {
          this.job = g.rangeBatchStart(n, this.job.seed0 + n);
          this.result = null;
          ui.sfx('select');
        },
        draw(c) {
          c.fillStyle = K.bg; c.fillRect(0, 0, W, HGT);
          frame(c, 0, 0, W, 24, K.head);
          ui.text('ПРОГОН ×' + n, 10, 5, { size: 13, bold: true, serif: true, col: K.hi });
          ui.text('Отряд ведёт автобой. Вручную результат может быть другим.', W - 10, 8, { align: 'right', size: 10, col: K.dim });
          if (!this.result) {
            ui.text('Идут бои: ' + this.job.done + ' из ' + n, W / 2, 200, { align: 'center', size: 13, bold: true, col: K.text });
            c.fillStyle = '#000'; c.fillRect(120, 226, 400, 16);
            c.fillStyle = K.hi; c.fillRect(121, 227, 398 * this.job.done / n, 14);
            ui.hints([['Esc', 'отменить']], W / 2, 260, { align: 'center' });
            return;
          }
          ui.rangeBatchDraw(c, this.result);
          ui.button(10, HGT - 30, 196, 24, 'Ещё прогон · Enter', () => this.again(), { active: true, size: 11 });
          ui.button(W - 180, HGT - 30, 170, 24, 'В таблицу · Esc', () => this.close(), { size: 11 });
        },
        key(k) {
          if (k === 'back') { this.close(); return; }
          if (k === 'ok' && this.result) this.again();
        }
      });
    },

    rangeBatchDraw(c, r) {
      const g = this.game, x0 = 14, n = Math.max(1, r.n);
      const bars = [['win', 'Победы', '#6aff9a'], ['left', 'Враг ушёл', K.warn], ['lose', 'Поражения', '#ff7070'], ['limit', 'Предел', K.num]];
      let bx = x0;
      c.fillStyle = '#000'; c.fillRect(x0, 40, W - 28, 20);
      for (const [id, , col] of bars) {
        const w = (W - 28) * r.kinds[id] / n;
        c.fillStyle = col; c.fillRect(bx, 41, w, 18);
        bx += w;
      }
      let lx = x0;
      for (const [id, label, col] of bars) {
        const t = label + ' ' + r.kinds[id] + ' (' + Math.round(100 * r.kinds[id] / n) + '%)';
        c.fillStyle = col; c.fillRect(lx, 67, 8, 8);
        this.text(t, lx + 11, 65, { size: 10, col: K.text });
        lx += 11 + this.measure(t, 10) + 16;
      }
      const facts = [['Циклы мин.', String(r.cycles.min)], ['средн.', String(r.cycles.avg).replace('.', ',')], ['макс.', String(r.cycles.max)], ['Урон за цикл', H.fmt(r.perCycle)]];
      let fx = x0;
      for (const [a, b] of facts) {
        this.text(a, fx, 86, { size: 10, col: K.dim });
        fx += this.measure(a, 10) + 5;
        this.text(b, fx, 85, { size: 12, bold: true, col: K.num });
        fx += this.measure(b, 12, true) + 18;
      }
      if (r.hacked) this.text('ХАКИ: без сравнения', W - 14, 87, { align: 'right', size: 10, bold: true, col: K.warn });
      else if (r.delta) {
        const sign = v => (v > 0 ? '+' : '') + v;
        this.text('К прошлому: побед ' + sign(r.delta.winPct) + '%' + (r.delta.perCycle != null ? ', за цикл ' + sign(r.delta.perCycle) + '%' : ''), W - 14, 87, { align: 'right', size: 10, bold: true, col: K.warn });
      }
      const y0 = 112, head = (t, x, o) => this.text(t, x, y0, Object.assign({ align: 'right', size: 10, bold: true, col: K.dim }, o));
      head('Герой', 50, { align: 'left' }); head('Урон за бой', 300); head('Доля', 360); head('Падал в боях', 470);
      r.heroes.slice(0, 5).forEach((o, i) => {
        const y = y0 + 16 + i * 30;
        c.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)'; c.fillRect(x0, y - 2, W - 28, 28);
        if (H.CHARS[o.id]) { c.fillStyle = G.dark(H.ELEMENTS[H.CHARS[o.id].elem].col, 0.6); c.fillRect(x0 + 6, y, 24, 24); G.drawPortrait(c, G.lookOf(o.id, g), x0 + 6, y, 24); }
        this.text(this.fitText(o.name, 11, 170, true), 50, y + 6, { size: 11, bold: true, col: K.text });
        this.text(H.fmt(o.dmg), 300, y + 6, { align: 'right', size: 11, col: K.num });
        this.text(o.share + '%', 360, y + 6, { align: 'right', size: 11, col: K.text });
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(372, y + 8, 40, 8);
        c.fillStyle = K.hi; c.fillRect(372, y + 8, 40 * o.share / 100, 8);
        this.text(o.downPct + '%', 470, y + 6, { align: 'right', size: 11, col: o.downPct ? '#ff7070' : K.text });
      });
      this.text('Боёв ' + r.n + ', сиды ' + r.seed0 + '–' + (r.seed0 + r.n - 1) + ', ' + (r.ms / 1000).toFixed(2).replace('.', ',') + ' с', x0, HGT - 48, { size: 10, col: K.dim });
    },

    rangeSheet(tab) {
      const g = this.game, tier = tab > 0 ? RG.TIERS[tab][0] : 'all', groups = tier === 'all' ? [['boss', 'БОССЫ'], ['elite', 'ЭЛИТА'], ['normal', 'ОБЫЧНЫЕ']] : [[tier, null]];
      const cells = [], labels = [];
      let y = 0;
      for (const [id, label] of groups) {
        const ids = g.rangeFoes(id);
        if (label) { labels.push({ t: label, y }); y += 12; }
        ids.forEach((foe, n) => cells.push({ id: foe, x: (n % SH.cols) * SH.cell, y: y + Math.floor(n / SH.cols) * SH.cell, w: SH.cell, h: SH.cell }));
        y += Math.ceil(ids.length / SH.cols) * SH.cell;
      }
      return { cells, labels, h: y };
    },

    rangeSheetCanvas(tab, sheet) {
      const key = tab + '|' + sheet.cells.length;
      if (sheetCache.has(key)) return sheetCache.get(key);
      const cv = G.mkCanvas(SH.cols * SH.cell * 2, Math.max(2, sheet.h * 2)), g = cv.getContext('2d');
      for (const o of sheet.cells) G.foeIcon(g, H.ENEMIES[o.id], (o.x + 1) * 2, (o.y + 1) * 2, (SH.cell - 2) * 2);
      sheetCache.set(key, cv);
      return cv;
    },

    openRangeCatalog(row, table) {
      const ui = this, g = this.game, adding = row >= g.rangeRows().length, curId = (g.rangeRows()[row] || {}).id;
      const lvlNow = () => { const rows = g.rangeRows(); return (rows[row] || rows[rows.length - 1] || { lvl: g.rangeTeamLvl() }).lvl; };
      const SETS = RG.TIERS.length;
      const scr = this.push({
        range: true, full: true, name: 'range catalog', tab: 0, sel: 0, top: 0, group: 0, setSel: 0, setSc: { top: 0 },
        sheet() { return ui.rangeSheet(this.tab); },
        ids() { return this.sheet().cells.map(o => o.id); },
        sets() { return g.rangeSets(RG.SET_GROUPS[this.group][0]); },
        close() { ui.screens = ui.screens.filter(x => x !== this); },
        target() { return adding ? g.rangeRows().length : row; },
        take() {
          const id = this.ids()[this.sel];
          if (!g.rangePut(id, this.target())) { ui.sfx('deny'); ui.toast('Не влезает на сцену: уберите кого-нибудь.'); return; }
          this.close();
          table.row = adding ? g.rangeRows().length - 1 : row;
          table.focus = 'c' + table.row + '_name';
          ui.sfx('confirm');
        },
        more() {
          const id = this.ids()[this.sel], rows = g.rangeRows();
          if (!g.rangePut(id, rows.length)) { ui.sfx('deny'); ui.toast('Волна заполнена или враг не влезает на сцену.'); return; }
          ui.sfx('confirm');
          ui.toast('Добавлен: ' + RG.shortOf(H.ENEMIES[id]));
        },
        load() {
          const x = this.sets()[this.setSel];
          if (!x || !g.rangeLoadSet(x.id)) { ui.sfx('deny'); return; }
          this.close();
          table.row = 0;
          table.focus = 'c0_name';
          ui.sfx('confirm');
          ui.toast('Таблица заменена. Z вернёт прежнюю.');
        },
        setTab(i) { this.tab = i; if (i < SETS) { this.sel = 0; this.top = 0; } ui.sfx('select'); },
        setGroup(i) { this.group = i; this.setSel = 0; this.setSc = { top: 0 }; ui.sfx('select'); },
        draw(c) {
          c.fillStyle = K.bg; c.fillRect(0, 0, W, HGT);
          ui.rangeCatTabs(c, this);
          if (this.tab >= SETS) { ui.rangeSetsTab(c, this); return; }
          ui.rangeSheetDraw(c, this);
          ui.rangeDossierDraw(c, this.ids()[this.sel], lvlNow());
          ui.button(14, HGT - 28, 150, 22, 'В строку · Enter', () => this.take(), { active: true, size: 11 });
          ui.button(170, HGT - 28, 170, 22, 'Ещё одного · Space', () => this.more(), { size: 11 });
          ui.hints([['←→↑↓', 'враг'], ['Shift', 'шаг 5'], ['Q/E', 'вкладка'], ['Esc', 'назад']], 348, HGT - 23);
        },
        key(k, code) {
          if (k === 'back') { this.close(); ui.sfx('cancel'); return; }
          if (code === 'KeyQ') { this.setTab((this.tab + SETS) % (SETS + 1)); return; }
          if (code === 'KeyE') { this.setTab((this.tab + 1) % (SETS + 1)); return; }
          if (this.tab >= SETS) {
            const n = this.sets().length;
            if (k === 'left' || k === 'right') { this.setGroup((this.group + (k === 'left' ? RG.SET_GROUPS.length - 1 : 1)) % RG.SET_GROUPS.length); return; }
            if (k === 'up') { this.setSel = (this.setSel + n - 1) % n; ui.sfx('select'); return; }
            if (k === 'down') { this.setSel = (this.setSel + 1) % n; ui.sfx('select'); return; }
            if (k === 'ok') this.load();
            return;
          }
          if (code === 'Space') { this.more(); return; }
          if (k === 'ok') { this.take(); return; }
          const cells = this.sheet().cells.map((o, i) => Object.assign({ i }, o)), cur = cells[this.sel];
          if (k === 'left' || k === 'right') {
            const line = cells.filter(o => o.y === cur.y), at = line.indexOf(cur), by = (big(ui) ? 5 : 1) * (k === 'left' ? -1 : 1);
            this.sel = line[(at + by + line.length * 5) % line.length].i;
            ui.sfx('select');
          } else if (k === 'up' || k === 'down') {
            const far = k === 'up' ? Math.max(...cells.map(o => o.y)) : Math.min(...cells.map(o => o.y));
            const to = nearest(cells, cur, k, true) || cells.filter(o => o.y === far).reduce((a, o) => (Math.abs(o.x - cur.x) < Math.abs(a.x - cur.x) ? o : a));
            this.sel = to.i;
            ui.sfx('select');
          }
        }
      });
      const start = scr.ids().indexOf(curId);
      if (start >= 0) scr.sel = start;
      return scr;
    },

    rangeCatTabs(c, s) {
      const g = this.game;
      c.fillStyle = K.head; c.fillRect(0, 0, W, 24);
      let x = 8;
      RG.TIERS.map(([id, label]) => label + ' ' + g.rangeFoes(id).length).concat('Встречи ' + g.rangeSets().length).forEach((t, i) => {
        const w = this.measure(t, 11, true) + 16, on = i === s.tab;
        this.button(x, 2, w, 20, t, () => s.setTab(i), { active: on, size: 11 });
        x += w + 4;
      });
      this.hit(W - 24, 3, 18, 18, () => s.close());
      this.text('×', W - 15, 3, { align: 'center', size: 14, bold: true, col: K.text });
    },

    rangeSheetDraw(c, s) {
      const sheet = s.sheet(), cells = sheet.cells, room = SH.bottom - SH.y, known = this.game.state.bank.enemies, cur = cells[s.sel];
      if (cur) {
        if (cur.y < s.top) s.top = cur.y;
        if (cur.y + SH.cell > s.top + room) s.top = cur.y + SH.cell - room;
      }
      s.top = H.clamp(s.top, 0, Math.max(0, sheet.h - room));
      c.save();
      c.beginPath(); c.rect(0, SH.y, W, room); c.clip();
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(this.rangeSheetCanvas(s.tab, sheet), SH.x, SH.y - s.top, SH.cols * SH.cell, sheet.h);
      c.imageSmoothingEnabled = was;
      for (const l of sheet.labels) this.text(l.t, SH.x, SH.y - s.top + l.y, { size: 9, bold: true, col: K.dim });
      cells.forEach((o, i) => {
        const x = SH.x + o.x, y = SH.y - s.top + o.y;
        if (y + SH.cell < SH.y || y > SH.bottom) return;
        if (!known[o.id]) { c.fillStyle = K.warn; c.fillRect(x + SH.cell - 6, y + 2, 4, 4); }
        if (i === s.sel) { c.strokeStyle = K.hi; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, SH.cell - 2, SH.cell - 2); c.lineWidth = 1; }
        this.hit(x, Math.max(y, SH.y), SH.cell, SH.cell, () => { if (s.sel === i) s.take(); else { s.sel = i; this.sfx('select'); } });
      });
      c.restore();
      if (s.top > 0) this.text('▲', W - 8, SH.y, { align: 'right', size: 10, bold: true, col: K.hi });
      if (s.top + room < sheet.h) this.text('▼', W - 8, SH.bottom - 14, { align: 'right', size: 10, bold: true, col: K.hi });
      this.wheelZone(0, SH.y, W, room, d => { s.top += d * SH.cell; });
    },

    rangeDossierDraw(c, id, lvl) {
      const g = this.game, d = H.ENEMIES[id];
      if (!d) return;
      const info = g.rangeDossier(id, lvl), y0 = SH.bottom + 4, tx = 134, tw = W - tx - 12;
      frame(c, 0, y0, W, HGT - 32 - y0, K.panel);
      G.drawEnemy(c, d, 68, HGT - 44, 120, { t: this.t });
      this.text(RG.nameOf(d), tx, y0 + 6, { size: 13, bold: true, serif: true, col: K.text });
      const [tag, tcol] = { boss: ['БОСС', '#ff7070'], elite: ['ЭЛИТА', '#f2dc9a'], normal: ['ОБЫЧНЫЙ', K.dim] }[RG.tierOf(d)];
      this.text(tag, W - 12, y0 + 8, { align: 'right', size: 10, bold: true, col: tcol });
      this.text(this.fitText(info.origin + (info.known ? '' : ' · нет в Банке данных'), 10, tw, false), tx, y0 + 24, { size: 10, col: K.dim });
      this.text('На ' + lvl + ' ур.:  HP ' + H.fmt(info.hp) + '   АТК ' + info.atk + '   ЗАЩ ' + info.def + '   СКР ' + info.spd + '   СТК ' + info.tough + '   Сопр. ' + info.res + '%', tx, y0 + 39, { size: 10, bold: true, col: K.num });
      let ix = tx;
      this.text('Слабости', ix, y0 + 54, { size: 10, col: K.weak }); ix += 56;
      d.weak.forEach(e => { G.elemIcon(c, e, ix, y0 + 60, 5); ix += 13; });
      ix += 10;
      if ((d.resist || []).length) {
        this.text('Сопротивления', ix, y0 + 54, { size: 10, col: K.resist }); ix += 84;
        d.resist.forEach(e => { G.elemIcon(c, e, ix, y0 + 60, 5); ix += 13; });
        ix += 10;
      }
      this.text(info.contact ? 'Контакт можно' : 'Контакт нельзя', W - 12, y0 + 54, { align: 'right', size: 10, col: K.dim });
      const limitY = HGT - 36, tail = info.notes.length + (info.order ? 1 : 0), lines = Math.floor((limitY - (y0 + 70)) / 13), keep = Math.max(1, lines - tail), shown = info.skills.slice(0, keep);
      let y = y0 + 70;
      shown.forEach((t, i) => {
        const more = i === keep - 1 && info.skills.length > keep ? ' (и ещё ' + (info.skills.length - keep) + ')' : '';
        this.text(this.fitText(t, 10, tw - this.measure(more, 10), false) + more, tx, y, { size: 10, col: K.text });
        y += 13;
      });
      if (info.order) { this.text(this.fitText(info.order, 10, tw, false), tx, y, { size: 10, col: K.num }); y += 13; }
      for (const n of info.notes) { this.text(this.fitText(n, 10, tw, false), tx, y, { size: 10, col: K.warn }); y += 13; }
    },

    rangeSetsTab(c, s) {
      const g = this.game;
      let x = 8;
      RG.SET_GROUPS.forEach(([id, label], i) => {
        const t = label + ' ' + g.rangeSets(id).length, w = this.measure(t, 10, true) + 14;
        this.button(x, 28, w, 18, t, () => s.setGroup(i), { active: i === s.group, size: 10 });
        x += w + 3;
      });
      const list = s.sets(), cur = list[s.setSel];
      this.list(8, 50, 340, list.map(o => ({ label: o.label, right: 'ур. ' + o.lvl }), this), s.setSel, { rowH: 20, max: 19, size: 10, scroll: s.setSc, onClick: i => { if (i === s.setSel) s.load(); else { s.setSel = i; this.sfx('select'); } } });
      frame(c, 354, 28, W - 360, 412, K.panel);
      if (cur) {
        const px = 364;
        this.wrap(cur.label, W - px - 14, 12, true).slice(0, 2).forEach((l, i) => this.text(l, px, 36 + i * 15, { size: 12, bold: true, col: K.text }));
        let y = 70;
        cur.waves.forEach((w, n) => {
          this.text('Волна ' + (n + 1), px, y, { size: 10, bold: true, col: K.dim });
          y += 13;
          w.forEach((s0, i) => {
            const [id, lv] = String(s0).split(':');
            G.foeIcon(c, H.ENEMIES[id], px + i * 50, y, 32);
            this.text(String(lv), px + i * 50 + 16, y + 33, { align: 'center', size: 9, col: K.num });
          });
          y += 50;
        });
        const lines = [];
        if (cur.field) lines.push([cur.field.name + ': бьёт на ходах ' + cur.field.at.join(', '), K.warn]);
        if (cur.allyBuff) lines.push([cur.allyBuff[0].name + ': усиление команды', K.warn]);
        if (cur.hpStart) lines.push(['Первый враг начинает с ' + Math.round(cur.hpStart * 100) + '% HP', K.warn]);
        for (const t of cur.dropped) lines.push([t, K.dim]);
        const look = g.rangeLook(cur.waves.flat().map(o => String(o).split(':')[0]), false);
        lines.push(['Фон: ' + (RG.BG.find(([b]) => b === cur.bg) || [0, look.bg])[1], K.dim]);
        for (const [t, col] of lines) {
          this.wrap(t, W - px - 14, 10).slice(0, 2).forEach(l => { this.text(l, px, y, { size: 10, col }); y += 13; });
        }
      }
      this.button(364, 412, 150, 22, 'Загрузить · Enter', () => s.load(), { active: true, size: 11 });
      this.hints([['↑↓', 'бой'], ['←→', 'группа'], ['Q/E', 'вкладка'], ['Esc', 'назад']], 8, HGT - 20);
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
