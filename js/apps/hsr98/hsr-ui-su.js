(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING, SU = H.SU;
  const { W, HGT, C } = H.UI_CONST;
  const RAR_COL = { 1: '#c8d0e0', 2: '#6aa8ff', 3: '#ffc850' };
  const RAR_DK = { 1: '#2a3044', 2: '#13285a', 3: '#4a3008' };
  const SIM = { cyan: '#50e0ff', violet: '#c890ff', ink: '#0c0620', line: 'rgba(200,144,255,0.55)' };
  const blessDef = id => SU.BLESSINGS.find(b => b.id === id);
  const curioDef = id => SU.CURIOS.find(c => c.id === id);
  const worldDef = id => SU.WORLDS.find(w => w.id === id);
  const pathCol = p => (SU.PATHS[p] ? SU.PATHS[p].col : '#c8d0e0');
  const stars = n => '★'.repeat(n);
  const SHOP_TEXT = {
    bless: 'Три благословения 1★ на выбор, одно останется с вами.',
    curio: 'Три диковины на выбор, одна останется с вами.',
    enhance2: 'Два случайных неусиленных благословения станут усиленными.',
    revive: 'Павшие встанут с половиной здоровья.',
    enhance: 'Перед боссом можно усилить любые благословения за фрагменты.',
    bank: 'Вклад из Банка времени вернётся вдвойне.'
  };
  const HINT = {
    fight: 'Победите стража зоны, и порталы откроются',
    event: 'Подойдите к раме и узнайте, что в ней',
    respite: 'Капсулы лечат, кукла Герты торгует за фрагменты',
    open: 'Порталы открыты: выберите следующую зону',
    boss: 'Последний бой мира. Поражение завершит погружение'
  };
  const PATH_SLOTS = Object.keys(SU.PATHS);
  let simCache = null;

  function simCanvas() {
    if (simCache) return simCache;
    const cv = G.mkCanvas(W, HGT), g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, HGT);
    gr.addColorStop(0, '#04020a'); gr.addColorStop(0.55, '#130a2c'); gr.addColorStop(1, '#251450');
    g.fillStyle = gr; g.fillRect(0, 0, W, HGT);
    for (let i = 0; i < 4; i++) {
      const x = G.hash(i, 3, 11) * W, y = G.hash(i, 4, 12) * HGT * 0.6, r = 80 + G.hash(i, 5, 13) * 140;
      const n = g.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, i % 2 ? 'rgba(200,144,255,0.16)' : 'rgba(80,224,255,0.12)'); n.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = n; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 240; i++) { g.fillStyle = 'rgba(230,220,255,' + (0.15 + 0.7 * G.hash(i, 7, 14)).toFixed(2) + ')'; g.fillRect(Math.floor(G.hash(i, 8, 15) * W), Math.floor(G.hash(9, i, 16) * HGT * 0.8), G.hash(i, 10, 17) > 0.97 ? 2 : 1, 1); }
    g.strokeStyle = 'rgba(80,224,255,0.13)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { const y = 330 + Math.pow(i / 8, 1.8) * 150; g.beginPath(); g.moveTo(0, Math.round(y) + 0.5); g.lineTo(W, Math.round(y) + 0.5); g.stroke(); }
    for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(W / 2 + i * 14, 330); g.lineTo(W / 2 + i * 90, HGT); g.stroke(); }
    for (let y = 0; y < HGT; y += 3) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, W, 1); }
    simCache = cv;
    return cv;
  }

  Object.assign(H.UI.prototype, {
    suBackdrop(c) { c.drawImage(simCanvas(), 0, 0); },

    suFrameBox(x, y, w, h, col) {
      const c = this.ctx;
      c.fillStyle = 'rgba(8,4,22,0.86)'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#010006'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.strokeStyle = col || SIM.line; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      c.fillStyle = col || SIM.violet;
      for (const [cx, cy] of [[x + 1, y + 1], [x + w - 7, y + 1], [x + 1, y + h - 3], [x + w - 7, y + h - 3]]) c.fillRect(cx, cy, 6, 2);
    },

    suSteps(cur) {
      const c = this.ctx, steps = ['Мир', 'Путь', 'Команда'];
      steps.forEach((s, i) => {
        const x = 206 + i * 100, on = i === cur, done = i < cur;
        c.fillStyle = on ? 'rgba(200,144,255,0.35)' : 'rgba(8,4,22,0.7)'; c.fillRect(x, 12, 90, 20);
        c.fillStyle = on ? SIM.violet : done ? SIM.cyan : '#3a2e5a'; c.fillRect(x, 31, 90, 1);
        this.text((i + 1) + '  ' + s, x + 45, 15, { align: 'center', size: 11, bold: on, col: on ? '#f4e8ff' : done ? SIM.cyan : C.dim });
      });
    },

    lockGlyph(x, y, col) {
      const c = this.ctx;
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x + 5, y + 5, 3.5, Math.PI, 0); c.stroke(); c.lineWidth = 1;
      c.fillStyle = col; c.fillRect(x, y + 5, 10, 8); c.fillStyle = '#0c0620'; c.fillRect(x + 4, y + 7, 2, 4);
    },

    suAeonWhere(path) {
      if (path === 'preservation' || path === 'remembrance') return 'учебный тест Герты';
      const w = SU.WORLDS.find(x => (x.aeons || []).some(a => a.path === path));
      return w ? w.name + (w.aeons.find(a => a.path === path).after === 'elite' ? ', после элиты' : ', после первой победы') : 'неизвестно где';
    },

    suSetCells(c, w, sets, x, y, s) {
      const list = w.set ? [w.set] : H.PLANAR_SETS;
      if (!w.set) {
        H.PLANAR_SETS.forEach((set, i) => { G.rarityCell(c, x + i * (s * 0.72), y + i * 3, s * 0.7, s * 0.7, 4); G.itemIcon(c, 'relic:sphere', x + i * (s * 0.72) + 2, y + i * 3 + 2, s * 0.7 - 4, set); });
        return x + 3 * s * 0.72 + 8;
      }
      let cx = x;
      for (const set of list) for (const sl of H.PLANAR_SLOTS) {
        G.rarityCell(c, cx, y, s, s, 4); G.itemIcon(c, 'relic:' + sl.key, cx + 3, y + 3, s - 6, set);
        const label = '×' + sets, bw = Math.round(this.measure(label, 9, true) + 6);
        c.fillStyle = '#0a0a10'; c.fillRect(cx + s - bw, y + s - 12, bw, 12);
        this.text(label, cx + s - bw / 2, y + s - 11, { align: 'center', size: 9, bold: true, col: '#ffffff', shadow: false });
        cx += s + 6;
      }
      return cx;
    },

    openSuTerminal(close) {
      const ui = this, g = this.game, s = g.state;
      const worlds = () => SU.WORLDS.map(w => ({ w, open: g.suWorldOpen(w), first: g.suFirst(w), rw: g.suReward(w, g.suFirst(w)) }));
      const firstOpen = Math.max(0, worlds().map(x => x.open && x.first).lastIndexOf(true));
      const pathOk = p => g.suPaths().includes(p);
      const leave = () => { ui.screens.pop(); ui.sfx('cancel'); close(); };
      const claim = () => {
        const got = g.suClaim(0);
        if (!got) { ui.sfx('deny'); ui.toast('Нужно ' + SU.TUN.power + ' энергии освоения.'); if (g.powerInfo().cur < SU.TUN.power) ui.openPower(); return; }
        ui.sfx('chest'); ui.toast('Награда Виртуальной вселенной: ' + got.join(', '));
      };
      const start = scr => {
        const w = worlds()[scr.wsel].w, path = PATH_SLOTS[scr.psel];
        ui.screens = [];
        close();
        if (!g.suStart(w.id, path, s.party)) { ui.sfx('deny'); ui.toast('Погружение не началось.'); return; }
        ui.drainGameEvents();
      };
      this.push({
        full: true, step: 0, wsel: firstOpen, psel: Math.max(0, PATH_SLOTS.findIndex(pathOk)), bsel: 1,
        draw(c) {
          ui.suBackdrop(c);
          ui.plate(12, 10, 'Виртуальная вселенная');
          ui.suSteps(this.step);
          ui.powerChip(W - 140, 14, { sep: ' / ' });
          if (this.step === 0) this.drawWorlds(c);
          else if (this.step === 1) this.drawPaths(c);
          else this.drawTeam(c);
        },
        drawWorlds(c) {
          const list = worlds();
          list.forEach((x, i) => {
            const y = 48 + i * 84, on = i === this.wsel, w = x.w;
            const bg = c.createLinearGradient(16, 0, 248, 0);
            bg.addColorStop(0, on ? 'rgba(120,70,200,0.62)' : 'rgba(20,10,44,0.82)'); bg.addColorStop(1, on ? 'rgba(40,20,90,0.5)' : 'rgba(8,4,22,0.7)');
            c.fillStyle = '#010006'; c.fillRect(15, y - 1, 234, 78);
            c.fillStyle = bg; c.fillRect(16, y, 232, 76);
            c.fillStyle = on ? SIM.violet : x.open ? '#4a3a7a' : '#241c3a'; c.fillRect(16, y, 3, 76);
            if (on) { c.strokeStyle = SIM.violet; c.strokeRect(16.5, y + 0.5, 231, 75); }
            c.strokeStyle = x.open ? (on ? '#f4e8ff' : SIM.cyan) : '#3a2e5a'; c.lineWidth = 2; c.beginPath(); c.arc(48, y + 38, 20, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
            ui.text(String(w.id), 48, y + 25, { align: 'center', size: 24, bold: true, serif: true, col: x.open ? '#f4e8ff' : '#4a4060' });
            ui.text(w.name, 78, y + 8, { size: 10, col: x.open ? C.sub : C.dim });
            ui.text(w.title, 78, y + 21, { size: 13, bold: true, serif: true, col: x.open ? (on ? C.gold : C.cream) : C.dim });
            ui.text('ур. ' + w.lvl, 240, y + 8, { align: 'right', size: 10, col: x.open ? C.sub : C.dim });
            if (!x.open) { ui.lockGlyph(78, y + 44, '#8a7aa8'); ui.text('Закрыт', 94, y + 46, { size: 11, col: '#8a7aa8' }); }
            else if (x.first) ui.text('Первая награда ×3', 78, y + 46, { size: 10, bold: true, col: C.gold });
            else ui.text('Пройден · повтор за ' + SU.TUN.power + ' энергии', 78, y + 46, { size: 10, col: C.ok });
            if (x.open && w.set) G.itemIcon(c, 'relic:sphere', 214, y + 34, 26, w.set);
            ui.hit(16, y, 232, 76, () => { if (this.wsel === i) this.key('ok'); else { this.wsel = i; ui.sfx('select'); } });
          });
          const x = list[this.wsel], w = x.w;
          ui.suFrameBox(262, 48, 362, 328);
          ui.text(w.name + ' · ' + w.title, 278, 60, { size: 16, bold: true, serif: true, col: C.gold });
          ui.wrap(w.text, 330, 12).slice(0, 3).forEach((l, i) => ui.text(l, 278, 86 + i * 15, { size: 12, col: '#e4dcf4' }));
          const last = w.pools.boss[0].waves[w.pools.boss[0].waves.length - 1][0];
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(276, 136, 334, 50);
          G.foeIcon(c, H.ENEMIES[last], 282, 141, 40, { round: true });
          ui.text('Зона босса', 330, 142, { size: 10, col: C.sub });
          ui.text(w.bossName, 330, 156, { size: 12, bold: true, col: '#ffd0c8' });
          ui.text('ур. ' + (w.lvl + Math.floor((w.plan.length - 1) * 0.4) + 2), 604, 142, { align: 'right', size: 10, col: C.sub });
          ui.text(x.first ? 'Награда за первое прохождение' : 'Награда за прохождение', 278, 196, { size: 11, bold: true, col: C.cream });
          ui.rewardCell(c, 'jade', x.rw.jade, 278, 214, 44);
          ui.rewardCell(c, 'credits', x.rw.credits, 328, 214, 44);
          ui.suSetCells(c, w, x.rw.sets, 386, 214, 44);
          if (x.first && x.open) ui.stamp(566, 226, '×3');
          const set = w.set && H.RELIC_SETS[w.set];
          ui.text(set ? set.name : 'Случайный набор планарных украшений', 278, 268, { size: 12, bold: true, serif: true, col: SIM.cyan });
          ui.wrap(set ? '2 предмета: ' + set.text : 'Запечатывающая космос станция, Живой Вонвак или Замершее Салсотто. Сфера и вязь одного набора.', 330, 11).slice(0, 3).forEach((l, i) => ui.text(l, 278, 286 + i * 14, { size: 11, col: '#d8d0ec' }));
          const note = !x.open ? (w.needText || 'Сначала пройдите учебный тест Герты.') : x.first ? 'Первая награда бесплатна. Повторные стоят ' + SU.TUN.power + ' энергии освоения.' : 'Награда спишет ' + SU.TUN.power + ' энергии освоения. Без неё награда подождёт у машины.';
          ui.wrap(note, 330, 11).slice(0, 2).forEach((l, i) => ui.text(l, 278, 336 + i * 14, { size: 11, col: !x.open ? C.bad : C.sub }));
          const claims = g.suClaims();
          if (claims.length) {
            ui.suFrameBox(16, 388, 608, 40, '#e8c060');
            ui.text('Ожидают награды: ' + claims.length + ' (' + claims.map(cl => worldDef(cl.world).name).join(', ') + ')', 28, 400, { size: 11, bold: true, col: C.gold });
            ui.button(456, 395, 158, 26, 'Забрать · ' + SU.TUN.power + ' энергии', claim, { size: 11 });
          }
          ui.hints([['↑↓', 'Мир'], ['Enter', 'Выбрать Путь'], ...(claims.length ? [['C', 'Забрать награду']] : []), ['Esc', 'Выйти']], W / 2, HGT - 22, { align: 'center' });
        },
        drawPaths(c) {
          const cx = W / 2, cy = 190, rx = 200, ry = 112, sel = PATH_SLOTS[this.psel], P = SU.PATHS[sel], open = pathOk(sel);
          c.strokeStyle = 'rgba(200,144,255,0.25)'; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.stroke();
          PATH_SLOTS.forEach((p, i) => {
            const a = -Math.PI / 2 + i * Math.PI * 2 / PATH_SLOTS.length, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, on = i === this.psel, ok = pathOk(p), col = pathCol(p);
            if (on) { const gl = c.createRadialGradient(x, y, 4, x, y, 44); gl.addColorStop(0, ok ? 'rgba(255,240,200,0.4)' : 'rgba(160,150,190,0.25)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(x - 44, y - 44, 88, 88); }
            c.fillStyle = '#05020e'; c.beginPath(); c.arc(x, y, 25, 0, Math.PI * 2); c.fill();
            c.strokeStyle = ok ? col : '#3a3050'; c.lineWidth = on ? 3 : 2; c.stroke(); c.lineWidth = 1;
            if (ok) G.pathIcon(c, p, x - 14, y - 14, 28, col);
            else ui.text('?', x, y - 10, { align: 'center', size: 18, bold: true, col: '#4a4060' });
            ui.text(ok ? SU.PATHS[p].name : '???', x, y + 29, { align: 'center', size: 11, bold: on, col: ok ? (on ? C.gold : C.cream) : C.dim });
            ui.hit(x - 26, y - 26, 52, 64, () => { if (this.psel === i) this.key('ok'); else { this.psel = i; ui.sfx('select'); } });
          });
          const gl = c.createRadialGradient(cx, cy - 10, 6, cx, cy - 10, 70);
          gl.addColorStop(0, open ? 'rgba(255,240,210,0.28)' : 'rgba(120,110,150,0.18)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gl; c.fillRect(cx - 70, cy - 80, 140, 140);
          if (open) G.pathIcon(c, sel, cx - 32, cy - 52, 64, pathCol(sel));
          else ui.text('?', cx, cy - 46, { align: 'center', size: 44, bold: true, serif: true, col: '#4a4060' });
          ui.text(open ? P.aeon : 'Эон молчит', cx, cy + 18, { align: 'center', size: 15, bold: true, serif: true, col: open ? '#f4e8ff' : C.dim });
          ui.text(open ? 'Эон ' + P.gen : 'Путь не открыт', cx, cy + 38, { align: 'center', size: 11, col: open ? C.sub : C.dim });
          ui.suFrameBox(40, 352, 560, 82, open ? pathCol(sel) : '#3a3050');
          if (open) {
            ui.text('Сила Пути', 54, 362, { size: 10, col: C.sub });
            ui.text(P.buffText, 130, 362, { size: 11, col: C.cream });
            ui.text('Резонанс', 54, 380, { size: 10, col: C.sub });
            const res = ui.wrap(P.res, 456, 11).slice(0, 2);
            res.forEach((l, i) => ui.text(l, 130, 380 + i * 14, { size: 11, col: '#e4dcf4' }));
            ui.text('Открывают 3 благословения этого Пути, в бою клавиша F', 130, 382 + res.length * 14, { size: 10, col: C.sub });
          } else {
            ui.text('Путь «' + P.name + '» откроет встреча с Эоном ' + P.aeon + '.', 54, 368, { size: 12, bold: true, col: C.cream });
            ui.text('Где искать: ' + ui.suAeonWhere(sel) + '.', 54, 388, { size: 11, col: C.sub });
          }
          ui.hints([['←→', 'Путь'], ['Enter', 'Команда'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        drawTeam(c) {
          const w = worlds()[this.wsel].w, path = PATH_SLOTS[this.psel];
          ui.text(w.name + ' · ' + w.title, W / 2, 48, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
          const label = 'Путь ' + SU.PATHS[path].gen + ' · ' + SU.PATHS[path].aeon, lw = ui.measure(label, 12) + 22;
          G.pathIcon(c, path, W / 2 - lw / 2, 71, 16, pathCol(path));
          ui.text(label, W / 2 - lw / 2 + 22, 72, { size: 12, col: '#e4dcf4' });
          s.party.slice(0, 4).forEach((k, i) => {
            const x = 64 + i * 132, y = 100, kid = g.kitOf(k), kit = H.CHARS[kid], r = s.roster[k];
            ui.suFrameBox(x, y, 120, 180, i === 0 ? C.brassHi : SIM.line);
            ui.text(ui.shortName(k), x + 60, y + 8, { align: 'center', size: 12, bold: true, col: i === 0 ? C.gold : C.cream });
            ui.portraitCard(c, G.lookOf(kid, g), x + 12, y + 28, 96, { elem: kit.elem, border: i === 0 ? C.brassHi : '#5a4a8a' });
            ui.text('ур. ' + r.lvl, x + 12, y + 134, { size: 11, bold: true, col: C.cream });
            G.pathIcon(c, kit.path, x + 76, y + 132, 14);
            G.elemIcon(c, kit.elem, x + 100, y + 139, 6);
            ui.text(H.PATHS[kit.path].name, x + 60, y + 154, { align: 'center', size: 10, col: C.sub });
            if (i === 0) ui.text('Лидер', x + 60, y + 166, { align: 'center', size: 9, bold: true, col: C.gold });
          });
          for (let i = s.party.length; i < 4; i++) { ui.suFrameBox(64 + i * 132, 100, 120, 180, '#2a2240'); ui.text('—', 124 + i * 132, 180, { align: 'center', size: 20, col: '#3a3050' }); }
          ui.suFrameBox(64, 292, 516, 56);
          ui.wrap('Здоровье и энергия переходят из боя в бой и восстанавливаются только в зонах отдыха. Поражение в бою завершает погружение без награды.', 490, 11).forEach((l, i) => ui.text(l, 78, 302 + i * 14, { size: 11, col: '#d8d0ec' }));
          ui.button(120, 366, 180, 30, 'Изменить состав', () => { this.bsel = 0; this.key('ok'); }, { active: this.bsel === 0, icon: 'team' });
          ui.button(340, 366, 180, 30, 'Начать погружение', () => { this.bsel = 1; this.key('ok'); }, { active: this.bsel === 1, bold: true, icon: 'warp' });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Подтвердить'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        key(k, code) {
          if (this.step === 0) {
            const list = worlds();
            if (k === 'up' || k === 'down') { this.wsel = (this.wsel + (k === 'up' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return; }
            if (code === 'KeyC' && g.suClaims().length) { claim(); return; }
            if (k === 'back') { leave(); return; }
            if (k === 'ok') {
              const x = list[this.wsel];
              if (!x.open) { ui.sfx('deny'); ui.toast(x.w.needText || 'Мир ещё закрыт.'); return; }
              this.step = 1; ui.sfx('confirm');
            }
            return;
          }
          if (this.step === 1) {
            const n = PATH_SLOTS.length;
            if (k === 'left' || k === 'up') { this.psel = (this.psel + n - 1) % n; ui.sfx('select'); }
            if (k === 'right' || k === 'down') { this.psel = (this.psel + 1) % n; ui.sfx('select'); }
            if (k === 'back') { this.step = 0; ui.sfx('cancel'); }
            if (k === 'ok') {
              const p = PATH_SLOTS[this.psel];
              if (!pathOk(p)) { ui.sfx('deny'); ui.toast('Этот Путь ещё не открыт.'); return; }
              this.step = 2; this.bsel = 1; ui.sfx('confirm');
            }
            return;
          }
          if (k === 'left' || k === 'right') { this.bsel = 1 - this.bsel; ui.sfx('select'); }
          if (k === 'back') { this.step = 1; ui.sfx('cancel'); }
          if (k === 'ok') { if (this.bsel === 0) ui.openTeam(); else start(this); }
        }
      });
    },

    blessCard(c, id, x, y, w, h, o) {
      const d = blessDef(id), col = pathCol(d.path), rc = RAR_COL[d.rar];
      const gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, G.dark(col, 0.55)); gr.addColorStop(0.35, RAR_DK[d.rar]); gr.addColorStop(1, '#06030e');
      if (o.on) { const gl = c.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w); gl.addColorStop(0, 'rgba(255,240,200,0.18)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(x - 20, y - 20, w + 40, h + 40); }
      c.fillStyle = '#010006'; c.fillRect(x - 1, y - 1 - (o.on ? 6 : 0), w + 2, h + 2);
      c.fillStyle = gr; c.fillRect(x, y - (o.on ? 6 : 0), w, h);
      const top = y - (o.on ? 6 : 0);
      c.strokeStyle = o.on ? rc : G.dark(rc, 0.35); c.lineWidth = o.on ? 2 : 1; c.strokeRect(x + 1, top + 1, w - 2, h - 2); c.lineWidth = 1;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 6, top + 6, w - 12, 34);
      G.pathIcon(c, d.path, x + 10, top + 9, 28, col);
      this.text(SU.PATHS[d.path].name, x + 44, top + 10, { size: 10, col: C.sub });
      this.text(stars(d.rar), x + 44, top + 23, { size: 12, bold: true, col: rc });
      if (o.enh) { c.fillStyle = '#e8c060'; c.fillRect(x + w - 58, top + 12, 50, 14); this.text('Усилено', x + w - 33, top + 13, { align: 'center', size: 9, bold: true, col: '#20140c', shadow: false }); }
      if (o.picked) { this.diamond(x + w - 14, top + 32, 7, C.ok, '#0a2010'); this.text('✓', x + w - 14, top + 25, { align: 'center', size: 10, bold: true, col: '#0a2010', shadow: false }); }
      const name = this.wrap(d.name, w - 20, 13).slice(0, 3);
      name.forEach((l, i) => this.text(l, x + 10, top + 48 + i * 16, { size: 13, bold: true, serif: true, col: o.on ? C.gold : '#f4ecff' }));
      const ty = top + 54 + name.length * 16;
      c.fillStyle = G.dark(rc, 0.4); c.fillRect(x + 10, ty - 2, w - 20, 1);
      this.wrap(d.text[o.enh ? 1 : 0], w - 20, 11).slice(0, 9).forEach((l, i) => this.text(l, x + 10, ty + 4 + i * 14, { size: 11, col: '#e4dcf4' }));
      if (o.note) this.text(o.note, x + w / 2, top + h - 20, { align: 'center', size: 10, bold: o.noteHi, col: o.noteHi ? C.gold : C.sub });
    },

    openSuBless(p) {
      const ui = this, g = this.game, su = g.state.su;
      const two = !!g.suCurioRun('twoPicks') && p.opts.length > 1;
      const own = su ? su.bless.filter(b => blessDef(b.id).path === su.path).length : 0;
      const enhOf = id => !!p.enh || (blessDef(id).rar === 1 && !!g.suCurioRun('enhanceOne'));
      const done = val => { ui.screens.pop(); ui.sfx('star4'); ui.finishPending(val); };
      this.push({
        sel: 0, picks: [],
        draw(c) {
          c.fillStyle = 'rgba(4,2,12,0.72)'; c.fillRect(0, 0, W, HGT);
          ui.plate(W / 2 - 90, 22, 'Выберите благословение');
          ui.text(p.why || '', W / 2, 46, { align: 'center', size: 11, col: C.sub });
          if (two) ui.text('Кубики снижения размерности: можно взять два', W / 2, 62, { align: 'center', size: 11, bold: true, col: SIM.cyan });
          const n = p.opts.length, cw = 186, gap = 14, x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
          p.opts.forEach((id, i) => {
            const d = blessDef(id), x = x0 + i * (cw + gap), mine = su && d.path === su.path;
            const note = mine ? (own >= 3 ? 'Ваш Путь · Резонанс открыт' : 'Ваш Путь · резонанс ' + Math.min(3, own + 1) + '/3') : 'Путь ' + SU.PATHS[d.path].gen;
            ui.blessCard(c, id, x, 92, cw, 290, { on: i === this.sel, enh: enhOf(id), picked: this.picks.includes(i), note, noteHi: mine });
            ui.hit(x, 86, cw, 296, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints(two ? [['←→', 'Выбор'], ['Enter', 'Отметить'], ['Esc', 'Взять отмеченное']] : [['←→', 'Выбор'], ['Enter', 'Взять']], W / 2, HGT - 40, { align: 'center' });
        },
        key(k) {
          const n = p.opts.length;
          if (k === 'left' || k === 'up') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); }
          if (k === 'right' || k === 'down') { this.sel = (this.sel + 1) % n; ui.sfx('select'); }
          if (k === 'back' && two && this.picks.length) { done(this.picks.slice()); return; }
          if (k !== 'ok') return;
          if (!two) { done(this.sel); return; }
          const at = this.picks.indexOf(this.sel);
          if (at >= 0) this.picks.splice(at, 1); else this.picks.push(this.sel);
          ui.sfx('confirm');
          if (this.picks.length >= 2) done(this.picks.slice());
        }
      });
    },

    openSuCurio(p) {
      const ui = this;
      const done = val => { ui.screens.pop(); ui.sfx('star4'); ui.finishPending(val); };
      this.push({
        sel: 0,
        draw(c) {
          c.fillStyle = 'rgba(4,2,12,0.72)'; c.fillRect(0, 0, W, HGT);
          ui.plate(W / 2 - 74, 22, 'Выберите диковину');
          ui.text(p.why || '', W / 2, 46, { align: 'center', size: 11, col: C.sub });
          const n = p.opts.length;
          p.opts.forEach((id, i) => {
            const x = W / 2 + (i - (n - 1) / 2) * 170, on = i === this.sel, bob = on ? Math.sin(ui.t * 3) * 4 : 0;
            const gl = c.createRadialGradient(x, 150, 6, x, 150, on ? 70 : 46);
            gl.addColorStop(0, on ? 'rgba(200,144,255,0.42)' : 'rgba(120,90,200,0.18)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = gl; c.fillRect(x - 70, 80, 140, 140);
            c.fillStyle = '#1a1030'; c.beginPath(); c.ellipse(x, 222, 46, 10, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = on ? SIM.violet : '#4a3a7a'; c.beginPath(); c.ellipse(x, 220, 42, 8, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#120a24'; c.beginPath(); c.ellipse(x, 220, 36, 6, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(80,224,255,0.25)'; c.fillRect(x - 1, 186, 2, 32);
            G.curioIcon(c, id, x - 32, 116 + bob, 64);
            ui.text(curioDef(id).name, x, 238, { align: 'center', size: 11, bold: on, col: on ? C.gold : C.cream });
            ui.hit(x - 70, 90, 140, 170, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; ui.sfx('select'); } });
          });
          const d = curioDef(p.opts[this.sel]);
          if (d) {
            ui.suFrameBox(90, 274, 460, 120);
            ui.text(d.name, W / 2, 288, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
            ui.wrap(d.text, 420, 12).slice(0, 3).forEach((l, i) => ui.text(l, W / 2, 314 + i * 16, { align: 'center', size: 12, col: '#e4dcf4' }));
            if (d.instant) ui.text('Срабатывает сразу', W / 2, 368, { align: 'center', size: 10, col: C.sub });
            else if (!d.uses) ui.text('Работает до конца погружения', W / 2, 368, { align: 'center', size: 10, col: C.sub });
          }
          ui.hints([['←→', 'Выбор'], ['Enter', 'Взять']], W / 2, HGT - 40, { align: 'center' });
        },
        key(k) {
          const n = p.opts.length;
          if (k === 'left' || k === 'up') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); }
          if (k === 'right' || k === 'down') { this.sel = (this.sel + 1) % n; ui.sfx('select'); }
          if (k === 'ok') done(this.sel);
        }
      });
    },

    suTeamStrip(c, x, y) {
      const g = this.game, su = g.state.su;
      g.suTeam().forEach((k, i) => {
        const cx = x + i * 92, hp = g.suHpOf(k), kid = g.kitOf(k), down = hp.cur <= 0;
        c.fillStyle = 'rgba(8,4,22,0.85)'; c.fillRect(cx, y, 86, 40);
        this.portraitCard(c, G.lookOf(kid, g), cx + 4, y + 5, 30, { elem: H.CHARS[kid].elem, border: down ? '#6a2a3a' : '#5a4a8a' });
        if (down) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(cx + 4, y + 5, 30, 30); }
        this.text(this.shortName(k), cx + 38, y + 3, { size: 10, bold: true, col: down ? C.bad : C.cream });
        this.bar(cx + 38, y + 18, 44, 4, hp.cur / hp.max, hp.cur / hp.max < 0.3 ? '#ff5050' : '#52d67a');
        this.bar(cx + 38, y + 25, 44, 2, (su.en[k] || 0) / H.CHARS[kid].energy, '#f2b632');
        this.text(down ? 'повержен' : hp.cur + '/' + hp.max, cx + 38, y + 29, { size: 9, col: down ? C.bad : C.sub });
      });
    },

    openSuShop(p, close) {
      const ui = this, g = this.game;
      const leave = () => { ui.screens.pop(); ui.sfx('cancel'); close(); };
      this.push({
        sel: 0,
        draw(c) {
          const su = g.state.su;
          if (!su) return;
          const list = g.suShop();
          c.fillStyle = 'rgba(4,2,12,0.6)'; c.fillRect(0, 0, W, HGT);
          G.drawBust(c, G.lookOf('herta', g), 16, 120, 3);
          ui.suFrameBox(20, 64, 210, 50);
          ui.wrap(su.dom.final ? '«Потрать всё на усиление. Другого шанса не будет».' : '«Не смотри так. Просто боюсь, что фрагменты тебе некуда девать».', 190, 11).forEach((l, i) => ui.text(l, 30, 72 + i * 14, { size: 11, col: '#f4e8ff' }));
          ui.win(250, 40, 372, 316, { title: 'Кукла Герты', top: '#1e1240', bottom: '#0a0620', border: SIM.violet });
          ui.money(470, 54, 'frag', su.frag + ' фрагм.', { col: SIM.cyan });
          ui.list(262, 78, 348, list.map(e => {
            const cant = e.off || su.frag < e.cost;
            return { label: e.name, right: e.gain ? '+' + e.gain : e.cost ? e.cost + ' фр.' : 'бесплатно', rcol: cant ? '#a06070' : SIM.cyan, disabled: cant };
          }), this.sel, { rowH: 26, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
          const e = list[this.sel];
          if (e) {
            c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(262, 252, 348, 64);
            ui.wrap(SHOP_TEXT[e.id] || '', 330, 11).forEach((l, i) => ui.text(l, 272, 260 + i * 14, { size: 11, col: '#e4dcf4' }));
            if (e.off) ui.text(e.id === 'revive' ? 'Все на ногах.' : 'Нечего усиливать.', 272, 296, { size: 11, col: C.dim });
            else if (su.frag < e.cost) ui.text('Не хватает фрагментов: нужно ' + e.cost + '.', 272, 296, { size: 11, col: C.bad });
          }
          ui.suTeamStrip(c, 250, 372);
          ui.hints([['↑↓', 'Товар'], ['Enter', 'Купить'], ['Esc', 'Уйти']], W / 2, HGT - 22, { align: 'center' });
        },
        key(k) {
          const list = g.suShop();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { leave(); return; }
          if (k !== 'ok') return;
          const e = list[this.sel];
          if (!e || !g.suShopBuy(e.id)) { ui.sfx('deny'); return; }
          ui.sfx('chest');
          if (e.id === 'enhance2') ui.toast('Два благословения усилены.');
          if (e.id === 'revive') ui.toast('Павшие снова в строю.');
          if (e.id === 'bank') ui.toast('Вклад вернулся: +' + e.gain + ' фрагментов.');
          this.sel = Math.min(this.sel, Math.max(0, g.suShop().length - 1));
          if (g.pending && g.pending !== p) ui.openUi(g.pending);
        }
      });
    },

    openSuEnhance(p, close) {
      const ui = this, g = this.game;
      const leave = () => { ui.screens.pop(); ui.sfx('cancel'); close(); };
      this.push({
        sel: 0,
        draw(c) {
          const su = g.state.su;
          if (!su) return;
          c.fillStyle = 'rgba(4,2,12,0.72)'; c.fillRect(0, 0, W, HGT);
          ui.win(20, 36, 600, 400, { title: 'Усиление благословений', top: '#1e1240', bottom: '#0a0620', border: SIM.violet });
          ui.money(480, 50, 'frag', su.frag + ' фрагм.', { col: SIM.cyan });
          const list = su.bless;
          if (!list.length) { ui.text('Благословений пока нет.', W / 2, 200, { align: 'center', col: C.dim }); ui.hints([['Esc', 'Назад']], W / 2, HGT - 60, { align: 'center' }); return; }
          ui.list(32, 74, 250, list.map(b => {
            const d = blessDef(b.id), cost = g.suEnhanceCost(b.id);
            return { label: d.name, right: b.lvl > 1 ? 'усилено' : cost + ' фр.', rcol: b.lvl > 1 ? C.ok : su.frag < cost ? '#a06070' : SIM.cyan, col: RAR_COL[d.rar], icon: (cc, x, y) => G.pathIcon(cc, d.path, x, y - 7, 14, pathCol(d.path)), iconW: 18 };
          }), this.sel, { rowH: 24, max: 14, size: 11, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
          const b = list[this.sel], d = b && blessDef(b.id);
          if (d) {
            const x = 296, cost = g.suEnhanceCost(b.id);
            G.pathIcon(c, d.path, x, 76, 28, pathCol(d.path));
            ui.wrap(d.name, 270, 13).slice(0, 2).forEach((l, i) => ui.text(l, x + 36, 76 + i * 16, { size: 13, bold: true, serif: true, col: C.gold }));
            ui.text(SU.PATHS[d.path].name + ' · ' + stars(d.rar), x + 36, 110, { size: 11, col: RAR_COL[d.rar] });
            ui.text('Сейчас', x, 136, { size: 10, col: C.sub });
            ui.wrap(d.text[b.lvl > 1 ? 1 : 0], 300, 11).slice(0, 6).forEach((l, i) => ui.text(l, x, 150 + i * 14, { size: 11, col: '#e4dcf4' }));
            if (b.lvl < 2) {
              ui.text('После усиления', x, 246, { size: 10, col: C.gold });
              ui.wrap(d.text[1], 300, 11).slice(0, 6).forEach((l, i) => ui.text(l, x, 260 + i * 14, { size: 11, col: '#fff0c8' }));
              ui.button(x, 360, 200, 28, 'Усилить · ' + cost + ' фр.', () => this.key('ok'), { disabled: su.frag < cost, bold: true });
            } else ui.text('Уже усилено.', x, 260, { size: 12, bold: true, col: C.ok });
          }
          ui.hints([['↑↓', 'Благословение'], ['Enter', 'Усилить'], ['Esc', 'Готово']], W / 2, 410, { align: 'center' });
        },
        key(k) {
          const su = g.state.su, list = su ? su.bless : [];
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { leave(); return; }
          if (k === 'ok' && list[this.sel]) {
            if (g.suEnhance(list[this.sel].id)) { ui.sfx('star4'); ui.toast('Усилено: ' + blessDef(list[this.sel].id).name); } else ui.sfx('deny');
          }
        }
      });
    },

    openSuEnd(p) {
      const ui = this, g = this.game, res = p.res, w = worldDef(res.world);
      const su = g.state.su, log = su ? su.log.slice() : [], bless = su ? su.bless.slice() : [], curios = su ? su.curios.slice() : [];
      const back = () => { ui.screens.pop(); ui.sfx('confirm'); ui.finishPending(); };
      this.push({
        full: true,
        draw(c) {
          ui.suBackdrop(c);
          const win = res.win;
          ui.text(win ? 'Погружение завершено' : 'Погружение прервано', W / 2, 26, { align: 'center', size: 26, bold: true, serif: true, col: win ? C.gold : '#ff9a9a' });
          ui.text(w.name + ' · ' + w.title, W / 2, 62, { align: 'center', size: 12, col: C.sub });
          ui.suFrameBox(24, 90, 284, 300);
          ui.text('Путь погружения', 38, 102, { size: 11, bold: true, col: C.cream });
          log.forEach((t, i) => {
            const x = 44 + (i % 6) * 42, y = 128 + Math.floor(i / 6) * 40, dm = SU.DOMAINS[t];
            ui.diamond(x, y, 11, G.dark(dm.col, 0.3), dm.col);
            ui.text(dm.short, x, y + 13, { align: 'center', size: 9, col: C.sub });
          });
          const sy = 128 + Math.ceil(Math.max(1, log.length) / 6) * 40 + 8;
          [['Пройдено зон', log.length + ' / ' + w.plan.length], ['Благословения', String(bless.length)], ['Диковины', String(curios.length)], ['Фрагменты', String(res.frag)]].forEach(([a, b], i) => {
            ui.text(a, 38, sy + i * 20, { size: 11, col: C.sub });
            ui.text(b, 292, sy + i * 20, { align: 'right', size: 12, bold: true, col: C.cream });
          });
          bless.slice(0, 16).forEach((b, i) => { const d = blessDef(b.id); G.pathIcon(c, d.path, 38 + i * 17, sy + 90, 14, RAR_COL[d.rar]); });
          curios.slice(0, 10).forEach((cu, i) => G.curioIcon(c, cu.id, 38 + i * 26, sy + 112, 24));
          ui.suFrameBox(324, 90, 292, 300, win ? '#e8c060' : '#6a3a4a');
          ui.text('Награда', 338, 102, { size: 11, bold: true, col: C.cream });
          if (!win) ui.wrap('Награды нет. Благословения и диковины исчезли вместе с симуляцией. Мир можно пройти снова.', 262, 12).forEach((l, i) => ui.text(l, 338, 130 + i * 16, { size: 12, col: '#e4dcf4' }));
          else {
            ui.rewardCell(c, 'jade', res.jade, 338, 126, 50);
            ui.rewardCell(c, 'credits', res.credits, 394, 126, 50);
            if (res.tracks) ui.rewardCell(c, 'tracks', res.tracks, 450, 126, 50);
            res.sets.forEach((st, i) => H.PLANAR_SLOTS.forEach((sl, j) => {
              const x = 338 + (i * 2 + j) * 56, y = 192;
              G.rarityCell(c, x, y, 50, 50, 4); G.itemIcon(c, 'relic:' + sl.key, x + 4, y + 4, 42, st.set);
            }));
            const names = [...new Set(res.sets.map(st => H.RELIC_SETS[st.set].name))];
            names.forEach((n, i) => ui.text(n, 338, 250 + i * 15, { size: 11, bold: true, col: SIM.cyan }));
            if (res.first) ui.stamp(560, 140, 'Первое ×3');
            if (res.pending) ui.wrap('Не хватило энергии освоения. Награда ждёт у машины Виртуальной вселенной: нужно ' + SU.TUN.power + '.', 262, 11).forEach((l, i) => ui.text(l, 338, 300 + i * 14, { size: 11, col: C.bad }));
            else if (!res.first) ui.text('Списано ' + res.power + ' энергии освоения.', 338, 300, { size: 11, col: C.sub });
            else ui.text('Награда получена. Украшения в инвентаре.', 338, 300, { size: 11, col: C.ok });
          }
          ui.button(W / 2 - 110, 404, 220, 30, 'Вернуться в офис Герты', back, { active: true, bold: true });
          ui.hints([['Enter', 'Продолжить']], W / 2, HGT - 22, { align: 'center' });
        },
        key(k) { if (k === 'ok') back(); }
      });
      this.sfx(res.win ? 'win' : 'lose');
    },

    openSuRun() {
      const ui = this, g = this.game;
      const su = () => g.state.su;
      const confirm = () => {
        ui.push({
          sel: 1,
          draw() {
            ui.win(W / 2 - 190, 160, 380, 140, { title: 'Завершить погружение', border: '#d86060' });
            ui.text('Выйти из симуляции? Награды не будет,', W / 2, 184, { align: 'center' });
            ui.text('благословения и диковины исчезнут.', W / 2, 200, { align: 'center', col: C.sub });
            ui.button(W / 2 - 170, 240, 160, 28, 'Выйти', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0 });
            ui.button(W / 2 + 10, 240, 160, 28, 'Остаться', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
          },
          key(k) {
            if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
            if (k === 'back') ui.pop();
            if (k === 'ok') {
              if (this.sel === 1) { ui.pop(); return; }
              ui.screens = [];
              g.suAbort();
            }
          }
        });
      };
      this.push({
        tab: 0,
        draw(c) {
          const r = su();
          if (!r) { ui.screens.pop(); return; }
          const w = worldDef(r.world);
          c.fillStyle = 'rgba(4,2,12,0.84)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Погружение');
          ui.text(w.name + ' · ' + w.title, 160, 13, { size: 12, bold: true, col: C.cream });
          G.pathIcon(c, r.path, 400, 12, 16, pathCol(r.path));
          ui.text('Путь ' + SU.PATHS[r.path].gen, 420, 13, { size: 11, col: C.sub });
          ui.closeBtn(W - 32, 8, () => this.key('back'));
          const n = w.plan.length, step = Math.min(56, 560 / Math.max(1, n - 1)), x0 = W / 2 - step * (n - 1) / 2;
          c.fillStyle = 'rgba(200,144,255,0.35)'; c.fillRect(x0, 56, step * (n - 1), 2);
          w.plan.forEach((opts, i) => {
            const x = x0 + i * step, t = i <= r.d ? r.log[i] : opts.length === 1 ? opts[0] : null, dm = t && SU.DOMAINS[t], cur = i === r.d;
            const col = dm ? dm.col : '#4a3e6a';
            ui.diamond(x, 57, cur ? 11 + Math.sin(ui.t * 5) : 8, i < r.d ? G.dark(col, 0.45) : cur ? col : '#120a24', col);
            ui.text(dm ? dm.short : '?', x, 72, { align: 'center', size: 9, bold: cur, col: cur ? C.gold : i < r.d ? C.sub : C.dim });
          });
          ['Благословения ' + r.bless.length, 'Диковины ' + r.curios.length].forEach((label, i) => {
            const x = 20 + i * 150, on = this.tab === i;
            c.fillStyle = on ? 'rgba(200,144,255,0.32)' : 'rgba(8,4,22,0.8)'; c.fillRect(x, 92, 144, 22);
            c.fillStyle = on ? SIM.violet : '#3a2e5a'; c.fillRect(x, 113, 144, 1);
            ui.text(label, x + 72, 96, { align: 'center', size: 11, bold: on, col: on ? '#f4e8ff' : C.sub });
            ui.hit(x, 92, 144, 22, () => { this.tab = i; this.sel = 0; ui.sfx('select'); });
          });
          ui.suFrameBox(20, 118, 294, 248);
          ui.suFrameBox(324, 92, 296, 274);
          const own = r.bless.filter(b => blessDef(b.id).path === r.path).length;
          if (this.tab === 0) {
            const list = r.bless.slice().sort((a, b) => (blessDef(a.id).path === r.path ? 0 : 1) - (blessDef(b.id).path === r.path ? 0 : 1) || blessDef(b.id).rar - blessDef(a.id).rar);
            this.items = list;
            if (!list.length) ui.text('Пока пусто', 167, 230, { align: 'center', col: C.dim });
            ui.list(28, 126, 280, list.map(b => { const d = blessDef(b.id); return { label: d.name + (b.lvl > 1 ? ' +' : ''), right: stars(d.rar), rcol: RAR_COL[d.rar], col: b.lvl > 1 ? C.gold : C.cream, icon: (cc, x, y) => G.pathIcon(cc, d.path, x, y - 7, 14, pathCol(d.path)), iconW: 18 }; }), this.sel || 0, { rowH: 22, max: 10, size: 11, onClick: i => { this.sel = i; } });
            const b = list[this.sel || 0], d = b && blessDef(b.id);
            if (d) {
              G.pathIcon(c, d.path, 336, 104, 28, pathCol(d.path));
              ui.wrap(d.name, 236, 13).slice(0, 2).forEach((l, i) => ui.text(l, 372, 104 + i * 16, { size: 13, bold: true, serif: true, col: C.gold }));
              ui.text(SU.PATHS[d.path].name + ' · ' + stars(d.rar) + (b.lvl > 1 ? ' · усилено' : ''), 372, 140, { size: 11, col: RAR_COL[d.rar] });
              ui.wrap(d.text[b.lvl > 1 ? 1 : 0], 268, 11).slice(0, 10).forEach((l, i) => ui.text(l, 336, 164 + i * 14, { size: 11, col: '#e4dcf4' }));
            }
          } else {
            const list = r.curios;
            this.items = list;
            if (!list.length) ui.text('Пока пусто', 167, 230, { align: 'center', col: C.dim });
            ui.list(28, 126, 280, list.map(cu => { const d = curioDef(cu.id); return { label: d.name, right: cu.broken ? 'сломана' : cu.uses != null ? 'ещё ' + cu.uses : '', rcol: cu.broken ? C.bad : C.sub, col: cu.broken ? C.dim : d.bad ? '#ffb0b0' : C.cream, icon: (cc, x, y) => G.curioIcon(cc, cu.id, x, y - 9, 18), iconW: 22 }; }), this.sel || 0, { rowH: 22, max: 10, size: 11, onClick: i => { this.sel = i; } });
            const cu = list[this.sel || 0], d = cu && curioDef(cu.id);
            if (d) {
              G.curioIcon(c, cu.id, 336, 104, 48);
              ui.wrap(d.name, 216, 13).slice(0, 2).forEach((l, i) => ui.text(l, 392, 108 + i * 16, { size: 13, bold: true, serif: true, col: d.bad ? '#ffb0b0' : C.gold }));
              ui.wrap(d.text, 268, 11).slice(0, 8).forEach((l, i) => ui.text(l, 336, 164 + i * 14, { size: 11, col: '#e4dcf4' }));
              if (cu.broken) ui.text('Диковина сломалась и больше не работает.', 336, 300, { size: 11, col: C.bad });
            }
          }
          ui.suTeamStrip(c, 20, 376);
          ui.money(400, 380, 'frag', r.frag + ' фрагментов', { col: SIM.cyan });
          ui.text(own >= 3 ? 'Резонанс Пути открыт: F в бою' : 'Резонанс Пути: ' + own + '/3 благословения', 400, 400, { size: 11, bold: own >= 3, col: own >= 3 ? C.gold : C.sub });
          ui.button(436, 420, 184, 24, 'Завершить погружение', confirm, { size: 11 });
          ui.hints([['←→', 'Вкладка'], ['↑↓', 'Список'], ['X', 'Завершить'], ['Esc', 'Назад']], 20, HGT - 18);
        },
        key(k, code) {
          const n = (this.items || []).length;
          if (k === 'left' || k === 'right') { this.tab = 1 - this.tab; this.sel = 0; ui.sfx('select'); return; }
          if (n && ui.listNav(this, k, n)) return;
          if (code === 'KeyX') { confirm(); return; }
          if (k === 'back' || code === 'KeyM') ui.pop();
        }
      });
    },

    suPlaceLabel() {
      const g = this.game, su = g.state.su, w = worldDef(su.world), dm = SU.DOMAINS[su.dom.type];
      return { world: w.name + ' · зона ' + (su.d + 1) + '/' + w.plan.length, domain: dm.name, col: dm.col };
    },

    suHint() {
      const g = this.game, su = g.state.su, dom = su.dom;
      if (dom.type === 'boss') return HINT.boss;
      if (dom.type === 'respite') return HINT.respite;
      if (dom.cleared) return HINT.open;
      return ['combat', 'elite'].includes(dom.type) ? HINT.fight : HINT.event;
    },

    drawSuHudTop(c) {
      const g = this.game, su = g.state.su, L = this.suPlaceLabel();
      const w = Math.max(this.measure(L.world, 11, true), this.measure(L.domain, 12, true)) + 40;
      c.fillStyle = 'rgba(8,4,22,0.8)'; c.fillRect(6, 6, w, 34);
      c.fillStyle = L.col; c.fillRect(6, 6, 3, 34); c.fillRect(6, 39, w, 1);
      this.text(L.world, 16, 8, { size: 10, col: C.sub });
      this.text(L.domain, 16, 21, { size: 12, bold: true, col: L.col });
      const hint = this.wrap(this.suHint(), 200, 11);
      c.fillStyle = 'rgba(8,4,22,0.6)'; c.fillRect(6, 44, 214, 8 + hint.length * 13);
      this.diamond(13, 51, 3.5, SIM.violet);
      hint.forEach((l, i) => this.text(l, 21, 45 + i * 13, { size: 11, col: '#f0e0ff' }));
      const y = 52 + hint.length * 13, own = su.bless.filter(b => blessDef(b.id).path === su.path).length;
      c.fillStyle = 'rgba(8,4,22,0.72)'; c.fillRect(6, y, 214, 22);
      let x = 12;
      x += this.money(x, y + 4, 'frag', String(su.frag), { col: SIM.cyan, size: 14 }) + 6;
      G.pathIcon(c, su.path, x, y + 3, 14, pathCol(su.path)); x += 17;
      this.text(String(su.bless.length), x, y + 4, { size: 11, bold: true }); x += this.measure(String(su.bless.length), 11, true) + 8;
      G.curioIcon(c, 'c_box', x, y + 2, 16); x += 18;
      this.text(String(su.curios.length), x, y + 4, { size: 11, bold: true }); x += this.measure(String(su.curios.length), 11, true) + 8;
      this.text(own >= 3 ? 'Резонанс ✓' : 'Резонанс ' + own + '/3', 214, y + 5, { align: 'right', size: 10, bold: own >= 3, col: own >= 3 ? C.gold : C.sub });
      return w;
    },

    drawSuPortal(c, e, x, y) {
      const g = this.game, type = g.suPortal(e.def.slot);
      if (!type) return;
      const dm = SU.DOMAINS[type];
      G.drawObject(c, 'su_portal', x, y, { col: dm.col, phase: this.objPhase(e) }, this.t);
      const w = this.measure(dm.short, 10, true) + 12;
      c.fillStyle = 'rgba(8,4,22,0.85)'; c.fillRect(x + 16 - w / 2, y - 40, w, 14);
      c.strokeStyle = dm.col; c.strokeRect(x + 16.5 - w / 2, y - 39.5, w - 1, 13);
      this.text(dm.short, x + 16, y - 39, { align: 'center', size: 10, bold: true, col: dm.col });
    },

    drawSuFrameEnt(c, e, x, y) {
      const g = this.game, dom = g.state.su && g.state.su.dom, ev = dom && SU.EVENTS[dom.event], done = !dom || dom.cleared;
      const ph = this.objPhase(e), lift = done ? 0 : Math.round((0.5 + 0.5 * Math.sin(this.t * 1.6 + ph)) * 2);
      G.drawObject(c, 'su_frame', x, y, { done, phase: ph }, this.t);
      if (ev) { c.save(); if (done) c.globalAlpha = 0.4; G.suEventIcon(c, ev.art, x + 6, y - 18 - lift, 20); c.restore(); }
      if (ev && !done && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 3.5) {
        const w = this.measure(ev.title, 10, true) + 12;
        c.fillStyle = 'rgba(8,4,22,0.85)'; c.fillRect(x + 16 - w / 2, y - 52, w, 14);
        c.strokeStyle = SIM.violet; c.strokeRect(x + 16.5 - w / 2, y - 51.5, w - 1, 13);
        this.text(ev.title, x + 16, y - 51, { align: 'center', size: 10, bold: true, col: '#f0e0ff' });
      }
    },

    drawSuScene(c) {
      const g = this.game, su = g.state.su, sc = g.script;
      if (!su || !sc || !sc.name) return;
      if (sc.name.startsWith('su_aeon_')) {
        const path = sc.name.slice(8), P = SU.PATHS[path];
        if (!P) return;
        const col = pathCol(path), k = 0.5 + 0.5 * Math.sin(this.t * 1.5);
        c.fillStyle = 'rgba(2,1,8,0.55)'; c.fillRect(0, 0, W, HGT);
        const gl = c.createRadialGradient(W / 2, 140, 10, W / 2, 140, 170);
        gl.addColorStop(0, 'rgba(255,240,210,' + (0.18 + 0.1 * k).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gl; c.fillRect(W / 2 - 170, 0, 340, 320);
        for (let i = 0; i < 24; i++) { const a = i * 0.26 + this.t * 0.2, r = 90 + (i % 4) * 14; c.fillStyle = i % 3 ? 'rgba(255,255,255,0.7)' : col; c.fillRect(Math.round(W / 2 + Math.cos(a) * r), Math.round(140 + Math.sin(a) * r * 0.5), 2, 2); }
        c.strokeStyle = col; c.globalAlpha = 0.55; c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, 132, 70 + k * 3, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1; c.globalAlpha = 0.35; c.beginPath(); c.arc(W / 2, 132, 80, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + this.t * 0.1, r0 = 84, r1 = 84 + (i % 2 ? 10 : 22); c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, 132 + Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * r1, 132 + Math.sin(a) * r1); c.stroke(); }
        c.globalAlpha = 1;
        G.pathIcon(c, path, W / 2 - 48, 84 - Math.round(k * 4), 96, col);
        this.text(P.aeon, W / 2, 222, { align: 'center', size: 18, bold: true, serif: true, col: '#fff4e0' });
        this.text('Эон ' + P.gen, W / 2, 246, { align: 'center', size: 11, col: C.sub });
        return;
      }
      const ev = Object.values(SU.EVENTS).find(x => x.script === sc.name);
      if (!ev) return;
      const x = W / 2 - 110, y = 40;
      this.suFrameBox(x, y, 220, 170, '#e8c060');
      const gr = c.createLinearGradient(0, y + 8, 0, y + 138);
      gr.addColorStop(0, '#1a1036'); gr.addColorStop(1, '#2a1a50');
      c.fillStyle = gr; c.fillRect(x + 10, y + 10, 200, 124);
      G.suEventIcon(c, ev.art, W / 2 - 48, y + 22, 96);
      this.text(ev.title, W / 2, y + 142, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
      this.text(SU.DOMAINS[ev.kind].name, W / 2, y + 157, { align: 'center', size: 9, col: C.sub });
    },

    drawSuOrb(c, b, x, y) {
      const R = b.su.res, col = pathCol(b.su.path), f = R.energy / R.max, ready = b.resReady();
      c.fillStyle = 'rgba(0,0,0,0.65)'; c.beginPath(); c.arc(x, y, 15, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a1030'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = ready ? 'hsl(' + ((this.t * 160) % 360) + ',90%,70%)' : col; c.beginPath(); c.arc(x, y, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); c.stroke(); c.lineWidth = 1;
      if (ready) { const gl = c.createRadialGradient(x, y, 3, x, y, 26); gl.addColorStop(0, 'rgba(255,240,200,0.5)'); gl.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = gl; c.fillRect(x - 26, y - 26, 52, 52); }
      G.pathIcon(c, b.su.path, x - 8, y - 8, 16, ready ? '#fff4e0' : col);
      this.keycap(x - 24, y - 16, 'F');
      this.text(ready ? 'Резонанс!' : Math.round(f * 100) + '%', x, y + 15, { align: 'center', size: 9, bold: ready, col: ready ? C.gold : C.sub });
      this.hit(x - 15, y - 15, 30, 30, () => this.battleKey(null, 'KeyF'));
    },

    suResonate() {
      const g = this.game, b = g.battle, bt = this.bt;
      if (!b || !b.su || !b.su.res.on) { this.sfx('deny'); bt.msg = 'Резонанс Пути откроют 3 благословения вашего Пути.'; bt.msgT = 1.4; return; }
      if (!b.resReady()) { this.sfx('deny'); bt.msg = 'Резонанс копит энергию: ' + Math.round(b.su.res.energy / b.su.res.max * 100) + '%.'; bt.msgT = 1.2; return; }
      if (b.resonate()) this.pullEvents();
    },

    drawSuResult(c, out) {
      const g = this.game, su = g.state.su;
      c.fillStyle = 'rgba(4,2,12,0.66)'; c.fillRect(0, 0, W, HGT);
      if (out.lost) {
        this.win(W / 2 - 190, 140, 380, 170, { title: 'Поражение', border: '#d86060', top: '#2a0e22', bottom: '#0a0410' });
        this.text(out.suFail ? 'Симуляция выбросила команду.' : 'Тест прерван. Герта недовольна.', W / 2, 166, { align: 'center', serif: true, size: 14 });
        this.text(out.suFail ? 'Погружение окончено, награды не будет.' : 'Бой можно начать заново.', W / 2, 188, { align: 'center', size: 11, col: C.sub });
        this.loseOptions(out).forEach((o, i) => this.button(W / 2 - 150, 222 + i * 34, 300, 26, o.label, () => this.loseChoice(i), { active: (this.bt.loseSel || 0) === i }));
        return;
      }
      this.win(W / 2 - 200, 110, 400, 200, { title: 'Победа', top: '#1e1240', bottom: '#0a0620', border: SIM.violet });
      if (out.frag) this.money(W / 2 - 180, 136, 'frag', '+' + out.frag + ' космических фрагментов', { col: SIM.cyan });
      else this.text('Зона босса пройдена', W / 2 - 180, 136, { size: 12, bold: true, col: C.gold });
      if (su) {
        this.suTeamStrip(c, W / 2 - 184, 168);
        this.text('Здоровье и энергия остаются такими до зоны отдыха.', W / 2, 220, { align: 'center', size: 10, col: C.sub });
      }
      this.hints([['Enter', 'Продолжить']], W / 2, 282, { align: 'center' });
      this.hit(0, 0, W, HGT, () => this.closeResult());
    },

    suLoseOptions(out) {
      if (out.suFail) return [{ label: 'Завершить погружение', fn: () => this.game.giveUpBattle() }];
      return [{ label: 'Повторить бой', fn: () => this.game.retryBattle() }];
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
