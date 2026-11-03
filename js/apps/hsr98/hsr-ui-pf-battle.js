(function (H) {
  'use strict';
  const G = H.Gfx, PF = H.PF, TUN = PF.TUN, UP = H.UI.prototype;
  const { W, HGT, C } = H.UI_CONST;
  const { alive } = H.battleStat;
  const HUD = { x: W - 108, y: 36, w: 100, h: 86 };
  const END_TEXT = { clear: 'На этом заканчивается наша история.', cycles: 'Циклы закончились.', wiped: 'История прервалась: отряд пал.' };
  const QUIT_TEXT = 'Вы уверены, что хотите завершить испытание и вернуться к Чистому вымыслу? При выходе из испытания очки не будут подсчитаны.';
  const KIND_NAME = { normal: 'Обычный', elite: 'Элита', trotter: 'Свинка', boss: 'Босс' };
  const activeBattle = ui => ui.game && (ui.game.battle || ui.lastBattle);
  const inPf = ui => { const b = activeBattle(ui); return !!(b && b.opts && b.opts.pf); };
  const shown = bt => bt.pf || (bt.pf = { score: 0, disp: 0, wave: 0, kills: 0, cyc: 1, feathers: [], starT: [0, 0, 0] });

  function slotX(u) {
    const cx = W / 2 + 34, max = u.pfMax || 5, mid = Math.floor(max / 2);
    if (u.pfBossWave) {
      if (u.pfSlot === mid) return cx;
      const side = Math.abs(u.pfSlot - mid);
      return cx + Math.sign(u.pfSlot - mid) * (TUN.bossPitch / 2 + TUN.bossSide / 2 + (side - 1) * TUN.bossSide);
    }
    return cx + (u.pfSlot - (max - 1) / 2) * (TUN.pitch[max] || TUN.pitch[5]);
  }

  Object.assign(UP, {
    pfOtherScore(b) {
      const done = this.bt.result && this.bt.result.pf;
      if (done) return done.sum - done.score;
      const run = this.game.pf().run, node = b.opts.pf.node;
      return run ? run.scores.reduce((a, v, i) => a + (i === node ? 0 : v), 0) : 0;
    },

    pfKeepAuto() {
      const bt = this.bt;
      if (bt.pfResume) { bt.auto = true; bt.pfResume = false; }
      bt.autoSticky = bt.auto;
    },

    pfPlay() {
      const g = this.game;
      this.pfKeepAuto();
      g.pfDrop();
      this.lastBattle = null;
      g.pfFight();
      this.drainGameEvents();
    },

    pfNextNode() {
      this.game.pf().run.node++;
      this.pfPlay();
    },

    pfStageEnd() {
      const info = this.game.pfFinish();
      this.closeResult();
      this.openPfStage(info);
    },

    pfExpiredExit(R) {
      const g = this.game;
      this.closeResult();
      if (g.pfAfterDue(R.n)) { g.runScript('pf_after'); return; }
      this.pfTurned();
    },

    pfAbort() {
      const g = this.game, n = g.pf().run.n;
      g.pfLeave();
      this.pfKeepAuto();
      g.pfDrop();
      this.lastBattle = null;
      this.mode = 'field';
      this.audio.music(g.mapMusic(g.map.def));
      this.openPfMap(null, n);
      this.openPfTeam(n);
    },

    pfAsk() {
      const bt = this.bt;
      if (!bt || bt.result) return;
      if (bt.sub) { if (bt.sub.type === 'pflist') { bt.sub = null; this.sfx('cancel'); } return; }
      bt.pfWant = true;
      if (bt.auto) { bt.auto = false; bt.pfResume = true; }
    },

    pfHud(c, b) {
      const bt = this.bt, S = shown(bt), O = b.opts.pf, { x, y, w, h } = HUD;
      this.pfPanel(c, x, y, { total: this.pfOtherScore(b) + Math.floor(S.disp), wave: S.wave + 1, waves: O.waves.length, kills: S.kills, pool: PF.poolSize(O.waves[S.wave]), cyc: Math.min(S.cyc, O.cycles), cycles: O.cycles, node: O.node + 1, starT: S.starT });
      this.hit(x, y, w, h, () => this.pfAsk());
    },

    pfPanel(c, x, y, o) {
      const { w, h } = HUD, total = o.total, last = o.cyc >= o.cycles;
      this.fhBox(x, y, w, h, last ? '#ff8a8a' : '#7ac8ff');
      this.text('СЧЁТ', x + 7, y + 6, { size: 9, bold: true, col: C.gold });
      this.keycap(x + w - 21, y + 4, 'Z');
      this.text(H.fmt(total), x + w - 7, y + 15, { align: 'right', size: 17, bold: true, serif: true, col: '#ffffff' });
      const bx = x + 7, bw = w - 14, top = TUN.stars[2];
      this.bar(bx, y + 38, bw, 4, Math.min(1, total / top), C.gold);
      TUN.stars.forEach((v, i) => {
        const sx = bx + Math.round(bw * v / top) - (i === 2 ? 1 : 0), on = total >= v;
        c.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.5)'; c.fillRect(sx, y + 36, 1, 8);
        this.fhStar(sx, y + 49, 4 + o.starT[i] * 4, on);
      });
      this.text('Волна ' + o.wave + '/' + o.waves, x + 7, y + 55, { size: 10, col: C.cream });
      this.text(o.kills + '/' + o.pool, x + w - 7, y + 55, { align: 'right', size: 10, col: C.cream });
      this.text('Цикл ' + o.cyc + '/' + o.cycles, x + 7, y + 69, { size: 10, bold: last, col: last ? '#ff9a9a' : C.cream });
      this.text('Узел ' + o.node, x + w - 7, y + 69, { align: 'right', size: 10, col: C.sub });
    },

    pfCycleMark(c, b) {
      const bt = this.bt, O = b.opts.pf, S = shown(bt), list = this.turnOrder(7), av = bt.order && bt.order.pfAv;
      if (!list.length || av == null) return;
      const left = Math.max(1, O.cycles - Math.min(S.cyc, O.cycles) + 1), last = left <= 1;
      let i = list.findIndex((o, k) => k > 0 && o.av > av);
      if (i < 0) i = list.length;
      this.pfCyclePlate(c, 8, 26 + i * 42 - 9, left, last, !last || Math.sin(this.t * 8) > -0.2);
    },

    pfCyclePlate(c, x, y, left, last, on) {
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, 40, 12);
      c.fillStyle = last ? '#6a1820' : '#16204e'; c.fillRect(x, y, 38, 10);
      c.fillStyle = on ? (last ? '#ff9a9a' : C.gold) : '#3a2a30';
      for (let r = 0; r < 4; r++) { c.fillRect(x + 3 + r, y + 1 + r, 7 - r * 2, 1); c.fillRect(x + 3 + r, y + 8 - r, 7 - r * 2, 1); }
      this.text('×' + left, x + 15, y, { size: 9, bold: true, col: on ? (last ? '#ffd0d0' : C.cream) : C.dim, shadow: false });
    },

    pfForeground(c, b) {
      const bt = this.bt, S = shown(bt);
      if (bt.ult) return;
      for (const f of S.feathers) {
        const x = Math.round(f.x), y = Math.round(f.y), lean = Math.sin(f.t * 7 + f.ph) > 0 ? 1 : 0;
        c.globalAlpha = Math.min(1, f.t * 2);
        c.fillStyle = '#ffffff'; c.fillRect(x + lean, y, 5, 1); c.fillRect(x + 1 - lean, y + 1, 6, 1);
        c.fillStyle = '#8ad0ff'; c.fillRect(x + 2 - lean, y + 2, 4, 1);
        c.globalAlpha = 1;
      }
      for (const [u, p] of this.enemyLayout()) {
        if (u.id !== 'pf_trotter' || !alive(u) || !u.appear) continue;
        const left = Math.max(0, H.ENEMIES.pf_trotter.flee - (u.turnsTaken || 0));
        const label = left ? 'Побег через ' + left : 'Сейчас сбежит';
        const tw = this.measure(label, 9, true) + 8;
        c.fillStyle = 'rgba(40,30,4,0.85)'; c.fillRect(p.x - tw / 2, p.y + 8, tw, 12);
        this.text(label, p.x, p.y + 8, { align: 'center', size: 9, bold: true, col: left > 1 ? '#ffe08a' : '#ffb0a0', shadow: false });
      }
    },

    pfListRows(b) {
      const O = b.opts.pf, wave = O.waves[b.wave], left = {};
      for (const id of b.pf.bag) left[id] = (left[id] || 0) + 1;
      for (const u of b.living) if (u.pfVal) left[u.id] = (left[u.id] || 0) + 1;
      return wave.pool.map(([id, n]) => {
        const v = b.pf.vals[id], d = H.ENEMIES[id];
        return { id, data: d, name: d.name, kind: PF.kindOf(id), total: n, left: left[id] || 0, price: v.d + v.k, weak: id === 'pf_trotter' ? O.rec : d.weak };
      });
    },

    drawPfList(c, b) {
      const O = b.opts.pf, rows = this.pfListRows(b), later = O.waves.slice(b.wave + 1), x = 96, w = 448, h = 102 + rows.length * 44 + later.length * 28, y = Math.round((HGT - h) / 2), season = PF.seasonOf(O.season), caco = season.caco.find(it => it.id === O.caco);
      c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
      this.win(x, y, w, h, { title: 'Список противников', border: '#7ac8ff' });
      this.text('Волна ' + (b.wave + 1) + ' из ' + O.waves.length + ', на поле до ' + O.waves[b.wave].max, x + 16, y + 24, { size: 11, bold: true, col: C.cream });
      this.text('Рекомендуемые типы:', x + w - 120, y + 25, { align: 'right', size: 10, col: C.sub });
      O.rec.forEach((e, i) => G.elemIcon(c, e, x + w - 106 + i * 18, y + 31, 7));
      this.text('Нелепость: ' + season.whim.name + (caco ? '. Какофония: ' + caco.name : ''), x + 16, y + 42, { size: 10, col: C.gold });
      rows.forEach((r, i) => {
        const ry = y + 64 + i * 44;
        c.fillStyle = 'rgba(122,200,255,0.08)'; c.fillRect(x + 12, ry - 2, w - 24, 40);
        G.foeIcon(c, r.data, x + 16, ry, 36);
        this.text(this.fitText(r.name, 11, 208, true), x + 60, ry + 2, { size: 11, bold: true, col: r.kind === 'normal' ? C.cream : C.gold });
        this.text(KIND_NAME[r.kind] + ', цена ' + H.fmt(r.price), x + 60, ry + 19, { size: 10, col: C.sub });
        r.weak.slice(0, 5).forEach((e, k) => G.elemIcon(c, e, x + 282 + k * 16, ry + 18, 6));
        this.text('Осталось ' + r.left + ' из ' + r.total, x + w - 24, ry + 2, { align: 'right', size: 11, col: r.left ? C.cream : C.dim });
      });
      later.forEach((wave, i) => {
        const ry = y + 66 + rows.length * 44 + i * 28;
        this.text('Волна ' + (b.wave + i + 2), x + 16, ry + 5, { size: 10, bold: true, col: C.sub });
        wave.pool.forEach(([id, n], k) => {
          G.foeIcon(c, H.ENEMIES[id], x + 76 + k * 66, ry, 22);
          this.text('×' + n, x + 102 + k * 66, ry + 5, { size: 10, col: C.cream });
        });
      });
      this.hints([['Z', 'Закрыть'], ['Esc', 'Закрыть']], W / 2, y + h - 20, { align: 'center' });
      this.hit(0, 0, W, HGT, () => this.pfAsk());
    },

    drawPfQuit(c) {
      const bt = this.bt, opts = this.subOptions(), run = this.game.pf().run, lines = this.wrap(QUIT_TEXT + (run && run.node ? ' Очки прошлого узла тоже пропадут.' : ''), 330, 12);
      const h = 66 + lines.length * 15 + opts.length * 26;
      c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
      this.win(W / 2 - 190, 200 - h / 2, 380, h, { title: 'Покинуть историю', border: '#d86060' });
      lines.forEach((l, i) => this.text(l, W / 2, 200 - h / 2 + 24 + i * 15, { align: 'center', size: 12, col: C.cream }));
      this.list(W / 2 - 170, 200 - h / 2 + 34 + lines.length * 15, 340, opts, bt.sub.sel, { rowH: 26, onClick: i => { bt.sub.sel = i; this.subKey('ok'); } });
    },

    drawPfResult(c, out) {
      const R = out.pf, g = this.game, b = this.lastBattle, total = R.sum, stars = this.pfStarsOf(total), x = W / 2 - 240, y = 42, w = 480, h = 396, bt = this.bt;
      c.fillStyle = 'rgba(2,3,12,0.72)'; c.fillRect(0, 0, W, HGT);
      this.win(x, y, w, h, { title: 'Узел ' + (R.node + 1) + ': итог', border: '#7ac8ff' });
      this.text(H.fmt(R.score), W / 2, y + 22, { align: 'center', size: 30, bold: true, serif: true, col: C.gold });
      this.text(END_TEXT[R.end] || '', W / 2, y + 60, { align: 'center', size: 12, col: C.cream });
      R.byWave.forEach((v, i) => {
        const ry = y + 84 + i * 22, max = R.values[i];
        this.text('Волна ' + (i + 1), x + 24, ry, { size: 11, col: C.cream });
        this.bar(x + 84, ry + 3, 260, 8, v / max, v >= max ? C.gold : '#7ac8ff');
        this.text(H.fmt(v) + ' / ' + H.fmt(max), x + w - 24, ry, { align: 'right', size: 11, col: C.cream });
      });
      this.text(this.pfNodeHint(R), W / 2, y + 152, { align: 'center', size: 11, bold: true, col: R.end === 'clear' && !R.expired ? C.ok : '#ffd471' });
      const caco = PF.seasonOf(R.season).caco.find(it => it.id === R.caco);
      this.text('Побеждено ' + R.kills + ' из ' + R.total + ' · циклы ' + R.cycles + ' из ' + R.maxCycles + ' · пало героев ' + R.down + (caco ? ' · ' + caco.name : ''), W / 2, y + 170, { align: 'center', size: 10, col: C.sub });
      if (b && bt.dmgBy) {
        const rows = b.allies.map(u => ({ u, v: bt.dmgBy.get(u) || 0 })).sort((p, q) => q.v - p.v), top = Math.max(1, rows[0].v);
        rows.forEach((r, i) => {
          const rx = x + 24 + (i % 2) * 222, ry = y + 192 + Math.floor(i / 2) * 26;
          G.drawPortrait(c, G.lookOf(r.u.charId, g), rx, ry, 22);
          this.text(this.fitText(r.u.name, 10, 96), rx + 28, ry, { size: 10, col: C.cream });
          this.text(H.fmt(r.v), rx + 208, ry, { align: 'right', size: 10, bold: true, col: C.cream });
          this.bar(rx + 28, ry + 14, 180, 4, r.v / top, H.ELEMENTS[r.u.elem].col);
        });
      }
      this.text('Сумма этапа ' + H.fmt(total) + ' · порог ' + H.fmt(TUN.clear), W / 2 - 34, y + 256, { align: 'center', size: 12, bold: true, col: total >= TUN.clear ? C.gold : C.cream });
      for (let i = 0; i < 3; i++) this.fhStar(W / 2 + 92 + i * 20, y + 264, 8, stars > i);
      const acts = this.pfResultActions(R), bw = acts.length > 2 ? 146 : 200, left = W / 2 - (acts.length * bw + (acts.length - 1) * 8) / 2, sel = bt.pfSel || 0;
      acts.forEach((a, i) => this.button(left + i * (bw + 8), y + 290, bw, 30, a.label, bt.sub ? null : a.fn, { active: i === sel, bold: i === 0 }));
      this.hints(R.expired ? [['Enter', 'К карте']] : [['←→', 'Кнопка'], ['Enter', 'Выбрать'], ['Esc', 'Покинуть']], W / 2, y + 338, { align: 'center' });
      if (bt.sub) this.drawPfQuit(c);
    },

    pfResultActions(R) {
      if (R.expired) return [{ label: 'К карте', leave: true, fn: () => this.pfExpiredExit(R) }];
      const last = R.node >= this.game.pfStage(R.n).nodes.length - 1;
      return [
        last ? { label: 'Итог этапа', fn: () => this.pfStageEnd() } : { label: 'Узел ' + (R.node + 2), fn: () => this.pfNextNode() },
        { label: 'Повторить узел', fn: () => this.pfPlay() },
        { label: 'Покинуть', leave: true, fn: () => { this.bt.sub = { type: 'pfquit', sel: 1 }; this.sfx('confirm'); } }
      ];
    },

    pfNodeHint(R) {
      if (R.expired) return 'Сезон завершился, результат записан в прошлый.';
      if (R.end === 'clear') return 'Все волны закрыты.';
      if (R.end === 'wiped') return 'Отряд пал на цикле ' + R.cycles + '. Выживание здесь тоже важно.';
      return 'Волна ' + (R.wave + 1) + ' не закрыта: не хватило циклов.';
    }
  });

  const haresFoeTags0 = UP.haresFoeTags;
  UP.haresFoeTags = function (u, tags) {
    haresFoeTags0.call(this, u, tags);
    if (u.dShat) tags.unshift('Раскол ×' + u.dShat);
    if (u.data.boss && !u.dEloqOff && inPf(this)) tags.unshift('Риторика: ещё ' + Math.max(1, TUN.eloq - shown(this.bt).kills));
  };

  const enemyHud0 = UP.enemyHud;
  UP.enemyHud = function (c, u, p) {
    if (inPf(this)) this.bt.tagW = (u.pfBossWave ? TUN.bossSide : TUN.pitch[u.pfMax] || TUN.pitch[5]) - 6;
    enemyHud0.call(this, c, u, p);
  };

  const enemyLayout0 = UP.enemyLayout;
  UP.enemyLayout = function () {
    if (!inPf(this)) return enemyLayout0.call(this);
    const bt = this.bt, out = new Map();
    const list = bt.foes.filter(u => u.appear && (!bt.fade.has(u) || bt.fade.get(u) > 0)).slice().sort((a, b) => a.pfSlot - b.pfSlot);
    for (const u of list) out.set(u, { x: slotX(u), y: 290, s: u.data.boss ? 200 : u.data.elite ? 140 : 104 });
    return out;
  };

  const applyEvent0 = UP.applyEvent;
  UP.applyEvent = function (e) {
    const bt = this.bt;
    if (e.t === 'pfscore') {
      const S = shown(bt), b = activeBattle(this), other = this.pfOtherScore(b), was = other + S.score;
      S.score += e.v;
      TUN.stars.forEach((v, i) => { if (was < v && other + S.score >= v) { S.starT[i] = 1; this.sfx('pfstar'); } });
      return;
    }
    if (e.t === 'pfshat') {
      e.u.dShat = e.n;
      this.floatAt(e.u, 'Раскол ×' + e.n, '#c8b0ff', 11);
      return;
    }
    if (e.t === 'pfhold') {
      e.u.dHp = e.u.hp;
      if (!bt.pfHeld) { bt.pfHeld = true; bt.msg = 'Риторика: босс не падёт, пока не побеждено ' + TUN.eloq + ' врагов.'; bt.msgT = 1.8; bt.msgWarn = true; }
      return;
    }
    if (e.t === 'pfeloq') {
      e.u.dEloqOff = true;
      bt.big = { text: 'РИТОРИКА СНЯТА', sub: 'Босс получает на 500% больше урона', col: '#ffb060', t: 1.1 };
      bt.shake = Math.max(bt.shake, 6);
      this.sfx('break');
      return;
    }
    if (e.t === 'pfkill') {
      const S = shown(bt), p = this.unitPos(e.u);
      S.kills++;
      this.floatAt(e.u, '+' + H.fmt(e.v), C.gold, PF.special(e.u.id) ? 15 : 12);
      for (let i = 0; i < 8 && S.feathers.length < 48; i++) S.feathers.push({ x: p.x + (Math.random() - 0.5) * 56, y: p.y + (Math.random() - 0.5) * 48, t: 0.7 + Math.random() * 0.5, v: 14 + Math.random() * 18, ph: Math.random() * 6 });
      this.sfx('pfpage');
      return;
    }
    if (e.t === 'pfcycle') {
      const S = shown(bt), b = activeBattle(this), last = e.n >= b.opts.pf.cycles;
      S.cyc = e.n;
      if (last) { bt.msg = 'Последний цикл'; bt.msgT = 1.2; bt.msgWarn = true; this.sfx('pflast'); } else this.sfx('select');
      return;
    }
    if (e.t === 'summon' && e.u.pfSlot != null && !e.u.pfExtra) {
      bt.foes.push(e.u);
      e.u.appear = true;
      e.u.dHp = e.u.hp;
      e.u.dTough = e.u.tough;
      e.u.dShield = 0;
      e.u.data.pfIn = 0;
      return;
    }
    if (e.t === 'flee' && e.u && e.u.id === 'pf_trotter') {
      this.sfx('pfrun');
      this.floatAt(e.u, 'Ускакала: +0', '#ffb0a0', 13);
      e.text = 'Свинка-копилка ускакала в варп!';
    }
    const out = applyEvent0.call(this, e);
    if (e.t === 'wave' && inPf(this)) {
      const S = shown(bt), b = activeBattle(this);
      S.wave = e.n - 1;
      S.kills = 0;
      for (const u of e.list) u.data.pfIn = 0;
      if (bt.big) bt.big.text = 'ВОЛНА ' + e.n + ' / ' + b.opts.pf.waves.length;
      this.sfx('pfpage');
    }
    return out;
  };

  const updateBattle0 = UP.updateBattle;
  UP.updateBattle = function (dt) {
    const bt = this.bt, b = this.game.battle;
    if (bt && inPf(this)) {
      const S = shown(bt);
      S.disp += (S.score - S.disp) * Math.min(1, dt * 12);
      if (Math.abs(S.score - S.disp) < 1) S.disp = S.score;
      S.starT = S.starT.map(v => Math.max(0, v - dt * 2));
      for (const f of S.feathers) { f.t -= dt; f.y += f.v * dt; f.x += Math.sin(f.t * 7 + f.ph) * 24 * dt; }
      S.feathers = S.feathers.filter(f => f.t > 0);
      for (const u of bt.foes) if (u.data.pfIn != null && u.data.pfIn < 1) u.data.pfIn = Math.min(1, u.data.pfIn + dt * 4);
    }
    if (bt && b && b.opts.pf && !bt.result) {
      if (bt.target && !alive(bt.target)) {
        const same = b.living.find(u => u.pfSlot === bt.target.pfSlot && u.appear);
        if (same) bt.target = same;
      }
      if (bt.pfWant && b.phase === 'input' && !bt.queue.length && !bt.cur && !bt.ult && !bt.sub) {
        bt.sub = { type: 'pflist', sel: 0 };
        bt.pfWant = false;
        this.sfx('confirm');
      } else if (bt.pfResume && !bt.pfWant && !bt.sub) {
        bt.auto = true;
        bt.pfResume = false;
      }
    }
    return updateBattle0.call(this, dt);
  };

  const drawDamageBoard0 = UP.drawDamageBoard;
  UP.drawDamageBoard = function (c, b) {
    if (b && b.opts.pf) { this.pfHud(c, b); return; }
    drawDamageBoard0.call(this, c, b);
  };

  const drawTurnOrder0 = UP.drawTurnOrder;
  UP.drawTurnOrder = function (c, b) {
    drawTurnOrder0.call(this, c, b);
    if (inPf(this)) this.pfCycleMark(c, activeBattle(this));
  };

  const drawBattle0 = UP.drawBattle;
  UP.drawBattle = function (c) {
    drawBattle0.call(this, c);
    const bt = this.bt;
    if (bt && inPf(this) && !bt.result && !bt.sub) this.pfForeground(c, activeBattle(this));
  };

  const drawSub0 = UP.drawSub;
  UP.drawSub = function (c) {
    const type = this.bt.sub.type;
    if (type === 'pflist') { this.drawPfList(c, this.game.battle); return; }
    if (type === 'pfquit') { if (!this.bt.result) this.drawPfQuit(c); return; }
    drawSub0.call(this, c);
  };

  const subKey0 = UP.subKey;
  UP.subKey = function (k, code) {
    if (this.bt.sub.type === 'pflist') {
      if (k === 'ok' || k === 'back' || code === 'KeyZ') this.pfAsk();
      return;
    }
    return subKey0.call(this, k, code);
  };

  const drawResult0 = UP.drawResult;
  UP.drawResult = function (c) {
    const out = this.bt.result;
    if (out && out.pf) { this.drawPfResult(c, out); return; }
    drawResult0.call(this, c);
  };

  const closeResult0 = UP.closeResult;
  UP.closeResult = function () {
    const out = this.bt && this.bt.result;
    if (!out || !out.pf) return closeResult0.call(this);
    this.pfKeepAuto();
    closeResult0.call(this);
  };

  const battleKey0 = UP.battleKey;
  UP.battleKey = function (k, code) {
    const bt = this.bt, out = bt && bt.result;
    if (out && out.pf) {
      if (bt.sub) { this.subKey(k, code); return; }
      const acts = this.pfResultActions(out.pf), sel = bt.pfSel || 0;
      if (k === 'left' || k === 'right') { bt.pfSel = (sel + (k === 'left' ? -1 : 1) + acts.length) % acts.length; this.sfx('select'); }
      else if (k === 'ok') acts[sel].fn();
      else if (k === 'back') acts.find(a => a.leave).fn();
      return;
    }
    if (code === 'KeyZ' && inPf(this) && !(bt && bt.sub && bt.sub.type !== 'pflist')) { this.pfAsk(); return; }
    return battleKey0.call(this, k, code);
  };

  const subOptions0 = UP.subOptions;
  UP.subOptions = function () {
    const sub = this.bt && this.bt.sub;
    if (sub && sub.type === 'pfquit') return [{ label: 'Покинуть без записи очков', fn: () => this.pfAbort() }, { label: this.bt.result ? 'Вернуться к итогу' : 'Вернуться в бой', fn: () => { } }];
    if (!sub || sub.type !== 'pause' || !inPf(this)) return subOptions0.call(this);
    return [
      { label: 'Продолжить бой', fn: () => { } },
      { label: 'Список противников', right: 'Z', fn: () => this.pfAsk() },
      { label: 'Повторить узел', fn: () => this.pfPlay() },
      { label: 'Покинуть', fn: () => { this.bt.sub = { type: 'pfquit', sel: 1 }; } }
    ];
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
