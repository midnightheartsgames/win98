(function (H) {
  'use strict';
  const HD = H.HD;
  const { C } = H.UI_CONST;
  const wrap = (i, n) => ((i % n) + n) % n;
  const KINDS = [['relic', 'Реликвия'], ['cone', 'Конус'], ['dev', 'Устройство'], ['sup', 'Припас']];
  const SPEEDS = [1, 2, 4];
  const fmt = n => H.fmt(Math.round(n));

  function goods(kind, hero) {
    if (kind === 'relic') return Object.keys(H.RELIC_SETS).flatMap(set => Object.keys(H.RELIC_SETS[set].pieces).map(slot => ({ set, slot, name: H.RELIC_SETS[set].pieces[slot] })));
    if (kind === 'cone') return HD.conesFor(H.CHARS[hero].path).map(id => ({ id, name: H.CONES[id].name + ' · ' + H.CONES[id].rarity + '★' }));
    if (kind === 'dev') return Object.keys(HD.DEVICES).map(id => ({ id, name: HD.devName(id) }));
    return Object.keys(HD.SUPPLIES).map(id => ({ id, name: H.ITEMS[id].name }));
  }

  Object.assign(H.UI.prototype, {
    hdDebugScreen() { return this.screens.find(s => s.arena && s.arena.hero) || null; },

    hdCheckStart() {
      if (this.hdCheck && !this.hdCheck.job.done) return;
      const job = HD.goldenCheck(), check = this.hdCheck = { job, ms: 0 };
      const pump = () => {
        const t0 = performance.now();
        while (!job.done && performance.now() - t0 < 12) job.step(200);
        check.ms += performance.now() - t0;
        if (!job.done && this.running) setTimeout(pump, 0);
      };
      pump();
    },

    hdCheckText() {
      const check = this.hdCheck;
      if (!check) return 'Запустить';
      if (!check.job.done) return Math.floor(check.job.ticks * 100 / check.job.total) + '%';
      return check.job.same ? 'Совпало' : 'НЕ совпало';
    },

    debugHdForm(st, note) {
      const ui = this, g = this.game, run = g.hdRun();
      const checkRow = { label: 'Проверка', value: ui.hdCheckText(), fixed: true, open: () => ui.hdCheckStart() };
      if (!run || !run.players[0].hero) return { rows: [checkRow], acts: [] };
      const scr = ui.hdDebugScreen(), A = scr && scr.arena, h = A ? A.hero : null, p = run.players[0];
      const D = st.hd || (st.hd = { kind: 0, i: 0, up: 0 });
      const kind = KINDS[D.kind][0], list = goods(kind, p.hero);
      D.i = wrap(D.i, list.length);
      const pick = list[D.i], needA = 'нужна оборона';
      const upLabel = kind === 'relic' ? '+' + D.up * 3 : kind === 'cone' ? 'S' + (D.up + 1) : 'нет';
      const waveNow = A ? (A.jumpTo || A.wave) : run.wave;
      return {
        rows: [
          { label: 'Золото', value: fmt(h ? h.gold : p.gold), step: k => { if (h) h.gold = Math.max(0, h.gold + k * 1000); else p.gold = Math.max(0, p.gold + k * 1000); } },
          { label: 'Уровень', value: String(h ? h.lvl : p.lvl), step: k => {
            if (!h) { p.lvl = Math.max(1, Math.min(20, p.lvl + k)); p.exp = 0; return; }
            if (k > 0 && h.lvl < 20) A.giveExp(h, HD.expNext(h.lvl) - h.exp);
            else if (k < 0 && h.lvl > 1) { h.lvl--; h.exp = 0; HD.equip(A, h); }
          } },
          { label: 'Очко развития', value: '+' + (h ? h.pts : p.pts), step: k => { if (k > 0) { if (h) h.pts++; else p.pts++; } } },
          { label: 'Волна', value: waveNow + (A && A.jumpTo ? ' в перерыве' : ''), step: k => {
            const n = Math.max(1, Math.min(HD.WAVES.length, waveNow + k));
            if (!A) run.wave = n;
            else if (A.phase === 'break') { A.wave = n; A.jumpTo = null; }
            else A.jumpTo = n;
          } },
          { label: 'Герой', value: h ? (h.invuln ? 'неуязвим' : 'обычный') : needA, step: () => { if (h) h.invuln = !h.invuln; } },
          { label: 'Экспресс', value: A ? (A.base.invuln ? 'неуязвим' : 'обычный') : needA, step: () => { if (A) A.base.invuln = !A.base.invuln; } },
          { label: 'Скорость', value: scr ? '×' + (scr.speed || 1) : needA, step: k => { if (scr) scr.speed = SPEEDS[wrap(SPEEDS.indexOf(scr.speed || 1) + k, SPEEDS.length)]; } },
          { label: 'Поле и цели', value: scr ? (scr.dbgFlow ? 'видно' : 'скрыто') : needA, step: () => { if (scr) scr.dbgFlow = !scr.dbgFlow; } },
          { label: 'Выдать', value: KINDS[D.kind][1], step: k => { D.kind = wrap(D.kind + k, KINDS.length); D.i = 0; D.up = 0; } },
          { label: 'Что', value: ui.clip(pick.name, 150, 10), step: k => { D.i = wrap(D.i + k, list.length); } },
          { label: 'Улучшение', value: upLabel, step: k => { D.up = wrap(D.up + k, kind === 'relic' ? 6 : 5); } },
          checkRow
        ],
        acts: [
          { label: 'Выдать', icon: 'bag', fn: () => {
            if (!A) { note('откройте оборону', 'deny'); return; }
            const ok = kind === 'relic' ? HD.grantItem(A, h, 'relic', { set: pick.set, slot: pick.slot, up: D.up }) : kind === 'cone' ? HD.grantItem(A, h, 'cone', { cone: pick.id, sup: D.up + 1 }) : HD.grantItem(A, h, pick.id);
            if (ok) note(pick.name + (kind === 'relic' || kind === 'cone' ? ' ' + upLabel : '')); else note('нет места в инвентаре', 'deny');
          } },
          { label: 'Босс', icon: 'warp', fn: () => {
            if (!A || A.phase !== 'wave') { note('босса можно вызвать во время волны', 'deny'); return; }
            const late = A.wave >= HD.TUN.lateFrom, T = HD.THREATS[A.threats[late ? 1 : 0]], id = late ? T.big : T.small;
            A.spawnFoe(id, 'n', late ? { big: true } : {});
            note(H.ENEMIES[id].name);
          } },
          { label: 'Добить всех', icon: 'chars', fn: () => {
            if (!A) { note('откройте оборону', 'deny'); return; }
            const list2 = A.foes();
            for (const f of list2) A.hit(h, f, { amt: 1e9, type: 'divine', noCrit: true });
            note('врагов добито: ' + list2.length);
          } }
        ]
      };
    },

    debugHdPreview(c, x, y, w) {
      const ui = this, g = this.game, run = g.hdRun();
      const check = ui.hdCheck;
      if (check && check.job.done) ui.text(ui.clip('Проверка партии: ' + check.job.hash + ' · ' + Math.round(check.ms * 1000 / Math.max(1, check.job.ticks)) + ' мкс на такт', w - 28, 9), x + 14, y + 304, { size: 9, col: C.sub });
      ui.text('Вкладка видна только на экранах Рубежа.', x + 14, y + 318, { size: 9, col: C.dim });
      ui.text('Пока F8 открыта, арена стоит.', x + 14, y + 332, { size: 9, col: C.dim });
      if (!run || !run.players[0].hero) {
        ui.text('Партия Рубежа Экспресса', x + 14, y + 12, { size: 12, bold: true, col: C.gold });
        ui.text('Партия не начата.', x + 14, y + 36, { size: 10, col: C.sub });
        ui.text('Строки партии появятся после выбора героя.', x + 14, y + 54, { size: 10, col: C.sub });
        return;
      }
      const scr = ui.hdDebugScreen(), A = scr && scr.arena, p = run.players[0];
      ui.text('Партия Рубежа Экспресса', x + 14, y + 12, { size: 12, bold: true, col: C.gold });
      const rows = [
        ['Сложность', HD.DIFFS[run.diff].name],
        ['Угрозы', run.threats.map(t => HD.THREATS[t].name).join(', ')],
        ['Волна', (A ? A.wave : run.wave) + ' из ' + HD.WAVES.length + ' · ' + (A ? (A.phase === 'wave' ? 'волна' : 'перерыв') : run.phase)],
        ['Герой', H.CHARS[p.hero].name + ', ур. ' + (A ? A.hero.lvl : p.lvl)],
        ['Золото', fmt(A ? A.hero.gold : p.gold)],
        ['Экспресс', fmt(A ? A.base.hp : run.base.hp) + ' / ' + fmt(HD.DIFFS[run.diff].base)],
        ['Турели', String(A ? A.turrets.filter(t => !t.dead).length : run.towers.filter(v => v == null || v > 0).length) + ' из 3'],
        ['Врагов на поле', A ? String(A.foes().length) : 'оборона закрыта'],
        ['Добивания, урон', fmt(run.stats.kills) + ', ' + fmt(run.stats.dmg)],
        ['Скорость арены', scr ? '×' + (scr.speed || 1) : 'нет']
      ];
      rows.forEach(([a, b], i) => { ui.text(a, x + 14, y + 36 + i * 18, { size: 10, col: C.sub }); ui.text(ui.clip(b, w - 140, 10), x + w - 14, y + 36 + i * 18, { align: 'right', size: 10, bold: true, col: C.cream }); });
      if (A) A.hero.items.forEach((it, i) => { const ix = x + 14 + i * 34, iy = y + 230; c.fillStyle = '#10142e'; c.fillRect(ix, iy, 30, 30); if (it) H.Gfx.hdItemIcon(c, it, ix + 3, iy + 3, 24); });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
