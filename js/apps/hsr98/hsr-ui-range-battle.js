(function (H) {
  'use strict';
  const G = H.Gfx, RG = H.RANGE;
  const { W, HGT, C } = H.UI_CONST;
  const K = { bg: '#0a0616', head: '#1e1236', hi: '#ff7ad8', num: '#5ad8ff', dim: '#8a7aaa', text: '#e4dcf4', warn: '#ffd471' };
  const KIND_COL = { win: C.ok, left: '#ffd471', lose: C.bad, limit: '#5ad8ff', abort: C.sub };
  const UP = H.UI.prototype;
  const inRange = ui => { const b = ui.game && ui.game.battle; return !!(b && b.opts && b.opts.range); };

  Object.assign(UP, {
    rangeKeepAuto() {
      if (this.bt) this.game.range().cond.auto = !!(this.bt.auto || this.bt.rangeResume);
    },

    rangeRestart(seed) {
      const g = this.game;
      this.rangeKeepAuto();
      g.rangeDrop();
      this.lastBattle = null;
      g.rangeFight(seed);
      this.drainGameEvents();
    },

    rangeToTable() {
      const g = this.game;
      this.rangeKeepAuto();
      g.rangeDrop();
      this.lastBattle = null;
      this.mode = 'field';
      this.openRangeTable();
    },

    rangeHud(c, b) {
      const R = b.opts.range, st = b.rangeStat, cyc = Math.min(RG.cycleOf(b.clock || 0), R.cycles), x = W - 108, y = 42 + 22 + b.allies.length * 22, w = 100, h = 44, limit = R.cycles < RG.TUN.maxCycles;
      c.fillStyle = 'rgba(14,6,28,0.82)'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,122,216,0.7)'; c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1);
      this.text('ПОЛИГОН', x + 6, y + 4, { size: 9, bold: true, col: '#ff7ad8' });
      if (st.hacked || st.edited) this.text(st.hacked ? 'ХАКИ' : 'ПРАВКИ', x + w - 6, y + 4, { align: 'right', size: 9, bold: true, col: K.warn });
      this.text('Цикл', x + 6, y + 17, { size: 10, col: C.sub });
      this.text(cyc + (limit ? ' / ' + R.cycles : ''), x + w - 6, y + 16, { align: 'right', size: 11, bold: true, col: C.cream });
      this.text('За цикл', x + 6, y + 30, { size: 10, col: C.sub });
      this.text(H.fmt(Math.round(st.total / cyc)), x + w - 6, y + 29, { align: 'right', size: 11, bold: true, col: C.cream });
    },

    drawRangeResult(c, out) {
      const R = out.range, g = this.game, C0 = g.range().cond, fixed = C0.seed === R.seed;
      c.fillStyle = K.bg; c.fillRect(0, 0, W, HGT);
      c.fillStyle = K.head; c.fillRect(0, 0, W, 24);
      this.text('ОТЧЁТ', 10, 5, { size: 13, bold: true, serif: true, col: K.hi });
      this.text(R.name, W - 10, 4, { align: 'right', size: 14, bold: true, serif: true, col: KIND_COL[R.kind] });
      if (R.hacked || R.edited) { const t = R.hacked ? 'ХАКИ' : 'ПРАВКИ', tw = this.measure(t, 11, true) + 12, sx = W - 160 - tw; c.strokeStyle = K.warn; c.strokeRect(sx + 0.5, 4.5, tw, 15); this.text(t, sx + 6, 6, { size: 11, bold: true, col: K.warn }); }
      const lead = 'Циклов ' + R.cycles + (R.kind === 'limit' ? ' (предел)' : '') + '   Ходов ' + R.turns + '   Волна ' + R.wave + ' из ' + R.waves;
      this.text(lead, 76, 8, { size: 10, col: K.dim });
      const facts = [['Всего', H.fmt(R.total)], ['За цикл', H.fmt(R.perCycle)], ['Пробитий', String(R.breaks)], ['Получено', H.fmt(R.taken)], ['Потери', String(R.downs)]];
      let fx = 10;
      for (const [a, b] of facts) {
        this.text(a, fx, 31, { size: 10, col: K.dim });
        fx += this.measure(a, 10) + 5;
        this.text(b, fx, 30, { size: 12, bold: true, col: K.num });
        fx += this.measure(b, 12, true) + 16;
      }
      this.text(this.rangeDeltaText(R), W - 10, 31, { align: 'right', size: 10, bold: true, col: R.delta ? K.warn : K.dim });
      const notes = [];
      if (R.kind === 'left') notes.push('Враг ушёл сам: ' + R.left.map(o => o.name + ' (' + o.hp + '% HP)').join(', '));
      if (R.selfKills) notes.push('Взорвался сам: ' + R.selfKills);
      if (R.firstBreak) notes.push('Первое пробитие: цикл ' + R.firstBreak);
      notes.push('Сид ' + R.seed + (fixed ? ' закреплён' : ''));
      this.text(this.fitText(notes.join('   '), 10, W - 20, false), 10, 47, { size: 10, col: K.dim });
      this.rangeHeroTable(c, R);
      this.rangeFoeTable(c, R);
      this.text('Leveling_Solo: ' + g.rangeQuip(R), W / 2, HGT - 48, { align: 'center', size: 10, col: K.hi });
      this.button(10, HGT - 30, 170, 24, 'Повторить · Enter', () => this.battleKey('ok', 'Enter'), { active: true, size: 11 });
      this.button(186, HGT - 30, 196, 24, (fixed ? 'Открепить сид' : 'Закрепить сид') + ' · F', () => this.battleKey(null, 'KeyF'), { size: 11 });
      this.button(W - 180, HGT - 30, 170, 24, 'В таблицу · Esc', () => this.battleKey('back', 'Escape'), { size: 11 });
    },

    rangePanelTarget() {
      const b = this.game.battle, t = this.bt.target;
      return t && H.battleStat.alive(t) ? t : b.living[0] || null;
    },

    rangePanelItems() {
      const b = this.game.battle, bt = this.bt, t = this.rangePanelTarget(), sub = bt.sub;
      const run = fn => () => { fn(); this.pullEvents(); };
      const list = [];
      if (t) {
        const skills = t.data.skills, at = H.clamp(sub.skill || 0, 0, skills.length - 1);
        list.push({ label: 'Цель: HP 50%', fn: run(() => b.rangeEditHp(t, 0.5)) });
        list.push({ label: 'Цель: HP почти ноль', fn: run(() => b.rangeEditHp(t, 0)) });
        list.push({ label: 'Цель: пробить', disabled: t.broken, fn: run(() => b.rangeEditBreak(t)) });
        list.push({ label: 'Цель: навык', right: '◄ ' + this.fitText(skills[at].n, 10, 110, false) + ' ►', skill: true, fn: run(() => { b.rangeEditSkill(t, at); b.rangeEditNow(t); }) });
      }
      list.push({ label: 'Команда: энергия 100%', fn: () => b.rangeEditEnergy() });
      list.push({ label: 'Команда: очки навыка на максимум', fn: () => b.rangeEditSp() });
      list.push({ label: 'Команда: лечение, воскрешение, чистка', fn: run(() => b.rangeEditHeal()) });
      list.push({ label: b.wave < b.waves.length - 1 ? 'Следующая волна' : 'Добить всех врагов', fn: run(() => b.rangeEditWave()) });
      list.push({ label: 'Закрыть', fn: () => { } });
      return list;
    },

    drawRangePanel(c) {
      const bt = this.bt, opts = this.subOptions(), h = 48 + opts.length * 26, t = this.rangePanelTarget(), { spdOf } = H.battleStat, b = this.game.battle;
      c.fillStyle = 'rgba(2,3,12,0.45)'; c.fillRect(0, 0, W, HGT);
      this.win(W / 2 - 150, 200 - h / 2, 340, h, { title: 'Панель Полигона' });
      this.list(W / 2 - 140, 216 - h / 2, 320, opts, bt.sub.sel, { rowH: 26, onClick: i => { bt.sub.sel = i; this.subKey('ok'); } });
      if (!t) return;
      const x = 6, y = 200 - h / 2, w = 158, rows = [['HP', H.fmt(Math.round(t.hp)) + ' / ' + H.fmt(t.maxHp)], ['АТК', H.fmt(Math.round(t.base.atk))], ['ЗАЩ', H.fmt(Math.round(t.base.def))], ['СКР', String(Math.round(spdOf(t)))], ['СТК', t.broken ? 'пробит' : Math.round(t.tough) + ' / ' + t.maxTough], ['Щит', H.fmt(Math.round(t.shield || 0))], ['Шкала', String(Math.round(t.av))]];
      this.win(x, y, w, 62 + rows.length * 15 + 40, { title: 'Цель' });
      this.text(this.fitText(t.name, 10, w - 16, true), x + 8, y + 22, { size: 10, bold: true, col: C.cream });
      rows.forEach(([a, v], i) => {
        this.text(a, x + 8, y + 38 + i * 15, { size: 10, col: C.sub });
        this.text(v, x + w - 8, y + 38 + i * 15, { align: 'right', size: 10, bold: true, col: C.cream });
      });
      const next = t.charging != null ? t.data.skills[t.charging] : t.planned, ny = y + 40 + rows.length * 15;
      this.text('Следующий навык', x + 8, ny, { size: 10, col: C.sub });
      this.text(this.fitText(next ? next.n : t.data.pat ? t.data.skills[t.data.pat[t.patIdx % t.data.pat.length]].n : 'случайно', 10, w - 16, true), x + 8, ny + 14, { size: 10, bold: true, col: K.warn });
      const fx = t.buffs.filter(q => q.name).map(q => q.name).concat(t.dots.map(d => H.DOT_NAME[d.type]));
      if (fx.length) this.text(this.fitText(fx.join(', '), 9, w - 16, false), x + 8, ny + 28, { size: 9, col: C.dim });
      if (b.over) this.text('Бой окончен', x + 8, ny + 40, { size: 10, col: C.dim });
    },

    rangeDeltaText(R) {
      if (R.hacked) return 'Хаки: без сравнения';
      if (R.edited) return 'Правки в бою: без сравнения';
      if (R.kind === 'abort') return 'Прервано: без сравнения';
      if (!R.delta) return 'Сравнивать не с чем';
      const sign = v => (v > 0 ? '+' : '') + v, bits = [];
      if (R.delta.perCycle != null) bits.push(sign(R.delta.perCycle) + '% за цикл');
      if (R.delta.cycles) bits.push(sign(R.delta.cycles) + ' цикл.');
      return 'К прошлому: ' + (bits.join(', ') || 'без изменений');
    },

    rangeHeroTable(c, R) {
      const g = this.game, y0 = 64, row = 26, X = { name: 36, dmg: 170, share: 204, bar: 212, barW: 150, max: 408, crit: 442, turns: 470, ult: 500, heal: 552, taken: 600, down: 630 };
      const head = (t, x, o) => this.text(t, x, y0, Object.assign({ align: 'right', size: 10, bold: true, col: K.dim }, o));
      head('Герой', X.name, { align: 'left' }); head('Урон', X.dmg); head('%', X.share); head('Виды урона', X.bar, { align: 'left' }); head('Макс.', X.max); head('Крит', X.crit); head('Ход', X.turns); head('Абс.', X.ult); head('Лечение', X.heal); head('Получил', X.taken); head('Пал', X.down);
      const top = Math.max(1, ...R.heroes.map(o => o.dmg));
      R.heroes.slice(0, 5).forEach((o, i) => {
        const y = y0 + 15 + i * row;
        c.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)'; c.fillRect(6, y - 2, W - 12, row - 2);
        if (H.CHARS[o.id]) { c.fillStyle = G.dark(H.ELEMENTS[H.CHARS[o.id].elem].col, 0.6); c.fillRect(10, y, 20, 20); G.drawPortrait(c, G.lookOf(o.id, g), 10, y, 20); }
        this.text(this.fitText(o.name, 10, X.dmg - X.name - 42, true), X.name, y + 5, { size: 10, bold: true, col: K.text });
        const cell = (t, x, col) => this.text(t, x, y + 5, { align: 'right', size: 10, col: col || K.text });
        cell(H.fmt(Math.round(o.dmg)), X.dmg, K.num);
        cell((R.total ? Math.round(100 * o.dmg / R.total) : 0) + '%', X.share);
        let bx = X.bar;
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(X.bar, y + 5, X.barW, 10);
        for (const [id, , col] of RG.DMG_KINDS) {
          const v = o.kinds[id] || 0, w = X.barW * v / top;
          if (!v) continue;
          c.fillStyle = col; c.fillRect(bx, y + 5, w, 10);
          bx += w;
        }
        cell(H.fmt(Math.round(o.max)), X.max);
        cell((o.hits ? Math.round(100 * o.crits / o.hits) : 0) + '%', X.crit);
        cell(String(o.turns), X.turns);
        cell(String(o.ults), X.ult);
        cell(H.fmt(Math.round(o.heal)), X.heal);
        cell(H.fmt(Math.round(o.taken)), X.taken);
        cell(String(o.down), X.down, o.down ? C.bad : K.text);
      });
      let lx = 10;
      const ly = y0 + 15 + Math.min(5, R.heroes.length) * row + 2;
      for (const [id, label, col] of RG.DMG_KINDS) {
        const sum = R.heroes.reduce((a, o) => a + (o.kinds[id] || 0), 0);
        if (!sum) continue;
        const t = label + ' ' + Math.round(100 * sum / Math.max(1, R.total)) + '%';
        c.fillStyle = col; c.fillRect(lx, ly + 2, 8, 8);
        this.text(t, lx + 11, ly, { size: 10, col: K.dim });
        lx += 11 + this.measure(t, 10) + 12;
      }
      this.rangeFoeY = ly + 20;
    },

    rangeFoeTable(c, R) {
      const y0 = this.rangeFoeY, X = { name: 36, taken: 240, breaks: 284, kills: 322, turns: 360, acts: 372 };
      const head = (t, x, o) => this.text(t, x, y0, Object.assign({ align: 'right', size: 10, bold: true, col: K.dim }, o));
      head('Враг', X.name, { align: 'left' }); head('Получил', X.taken); head('Пробит', X.breaks); head('Пал', X.kills); head('Ходов', X.turns); head('Навыки по порядку', X.acts, { align: 'left' });
      const room = Math.floor((HGT - 56 - (y0 + 14)) / 21);
      R.foes.slice(0, room).forEach((o, i) => {
        const y = y0 + 14 + i * 21, d = H.ENEMIES[o.id];
        G.foeIcon(c, d, 12, y, 18);
        this.text(this.fitText(RG.nameOf(d), 10, X.taken - X.name - 52, false), X.name, y + 4, { size: 10, col: K.text });
        const cell = (t, x) => this.text(t, x, y + 4, { align: 'right', size: 10, col: K.text });
        cell(H.fmt(Math.round(o.taken)), X.taken);
        cell(String(o.breaks), X.breaks);
        cell(String(o.kills), X.kills);
        cell(String(o.acts.length), X.turns);
        this.text(this.fitText(o.acts.join(', ') || 'не ходил', 10, W - X.acts - 10, false), X.acts, y + 4, { size: 10, col: K.dim });
      });
      if (R.foes.length > room) this.text('И ещё врагов: ' + (R.foes.length - room), X.name, y0 + 14 + room * 21 - 2, { size: 10, col: K.dim });
    }
  });

  for (const name of ['ultCineOn', 'fusionCineOn', 'skinCineOn']) {
    const base = UP[name];
    UP[name] = function (x) {
      if (inRange(this) && this.game.range().cond.cine === 'off') return false;
      return base.call(this, x);
    };
  }

  const startBattleUI0 = UP.startBattleUI;
  UP.startBattleUI = function (e) {
    startBattleUI0.call(this, e);
    if (inRange(this)) this.bt.auto = !!this.game.range().cond.auto;
  };

  const closeResult0 = UP.closeResult;
  UP.closeResult = function () {
    const out = this.bt && this.bt.result;
    if (!out || !out.range) return closeResult0.call(this);
    const sticky = this.bt.autoSticky;
    this.rangeKeepAuto();
    closeResult0.call(this);
    this.bt.autoSticky = sticky;
    this.openRangeTable();
  };

  const battleKey0 = UP.battleKey;
  UP.battleKey = function (k, code) {
    const out = this.bt && this.bt.result, bt = this.bt;
    if (bt && !out && inRange(this)) {
      if (code === 'Tab') { this.rangeAsk('range'); return; }
      const b = this.game.battle, busy = b.phase !== 'input' || bt.queue.length || bt.cur;
      if (k === 'back' && !bt.ult && !bt.sub && busy) { this.rangeAsk('pause'); return; }
      if (bt.sub && bt.sub.type === 'range') {
        const it = this.subOptions()[bt.sub.sel];
        if (it && it.skill && (k === 'left' || k === 'right' || code === 'KeyQ' || code === 'KeyE')) {
          const n = this.rangePanelTarget().data.skills.length;
          bt.sub.skill = ((bt.sub.skill || 0) + (k === 'left' || code === 'KeyQ' ? n - 1 : 1)) % n;
          this.sfx('select');
          return;
        }
      }
    }
    if (!out || !out.range) return battleKey0.call(this, k, code);
    if (k === 'ok') { this.rangeRestart(); return; }
    if (code === 'KeyF') { this.game.rangeSeedLock(out.range.seed); this.sfx('confirm'); return; }
    if (k === 'back') this.closeResult();
  };

  const drawBattle0 = UP.drawBattle;
  UP.drawBattle = function (c) {
    drawBattle0.call(this, c);
    const bt = this.bt;
    if (inRange(this) && bt && !bt.ult && !bt.result && !bt.sub) this.rangeHud(c, this.game.battle);
  };

  UP.rangeAsk = function (type) {
    const bt = this.bt;
    if (bt.sub) { if (bt.sub.type === type) { bt.sub = null; this.sfx('cancel'); } return; }
    bt.rangeWant = type;
    if (bt.auto) { bt.auto = false; bt.rangeResume = true; }
  };

  const updateBattle0 = UP.updateBattle;
  UP.updateBattle = function (dt) {
    const bt = this.bt, b = this.game.battle;
    if (bt && b && b.opts.range && !bt.result) {
      if (bt.rangeWant && b.phase === 'input' && !bt.queue.length && !bt.cur && !bt.ult && !bt.sub) {
        bt.sub = { type: bt.rangeWant, sel: 0, skill: 0 };
        bt.rangeWant = null;
        this.sfx('confirm');
      } else if (bt.rangeResume && !bt.rangeWant && !bt.sub) {
        bt.auto = true;
        bt.rangeResume = false;
      }
    }
    return updateBattle0.call(this, dt);
  };

  const drawSub0 = UP.drawSub;
  UP.drawSub = function (c) {
    if (this.bt.sub.type === 'range') { this.drawRangePanel(c); return; }
    drawSub0.call(this, c);
  };

  const drawResult0 = UP.drawResult;
  UP.drawResult = function (c) {
    const out = this.bt.result;
    if (out && out.range) { this.drawRangeResult(c, out); return; }
    drawResult0.call(this, c);
  };

  const subOptions0 = UP.subOptions;
  UP.subOptions = function () {
    const sub = this.bt && this.bt.sub, b = this.game.battle;
    if (sub && sub.type === 'range') return this.rangePanelItems();
    if (!sub || sub.type !== 'pause' || !inRange(this)) return subOptions0.call(this);
    const bt = this.bt, seed = b.opts.seed;
    return [
      { label: 'Продолжить бой', fn: () => { } },
      { label: 'Перезапустить', right: 'тот же сид', fn: () => this.rangeRestart(seed) },
      { label: 'Перезапустить с новым сидом', fn: () => this.rangeRestart() },
      { label: 'Завершить и показать итог', fn: () => { b.flee(); this.pullEvents(); } },
      { label: 'В таблицу', fn: () => this.rangeToTable() },
      { label: 'Панель Полигона', right: 'Tab', fn: () => { bt.sub = { type: 'range', sel: 0, skill: 0 }; } },
      { label: 'Авто-бой: ' + (bt.auto || bt.rangeResume ? 'вкл' : 'выкл'), fn: () => { if (bt.rangeResume) bt.rangeResume = false; else bt.auto = !bt.auto; } }
    ];
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
