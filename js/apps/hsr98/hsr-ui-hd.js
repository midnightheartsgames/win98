(function (H) {
  'use strict';
  const G = H.Gfx, HD = H.HD;
  const { W, HGT, C } = H.UI_CONST;
  const K = { red: '#ff4a3a', redDk: '#5a1410', led: '#ff9a7a', rail: '#c9a45c' };
  const fmt = n => H.fmt(Math.round(n));
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const CRT = { bg: '#021006', fg: '#5aff7a', hi: '#b8ffc8', mid: '#3ac85a', dim: '#1e6a30' };
  const dateOf = ms => { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
  const CONTROLS = [
    ['W A S D', 'Движение в восемь сторон'], ['ПКМ', 'Идти в точку или бить врага'], ['ЛКМ, Space', 'Выбрать цель'],
    ['Q E R', 'Навык, Техника, Абсолютная техника'], ['Shift + Q E R T', 'Повысить способность'], ['1–6', 'Припасы'],
    ['X', 'Стоять на месте'], ['B', 'Лавка (на площади)'], ['F', 'Возврат на площадь'], ['N', 'Начать волну раньше'],
    ['Enter', 'Срочный вызов, восстановить турель'], ['Tab', 'Большая карта'], ['Esc', 'Пауза'],
    ['G', 'За столом: метка под курсором'], ['V', 'За столом: готовые фразы'], ['P', 'За столом: пауза для всех']
  ];

  Object.assign(H.UI.prototype, {
    openUi_hd() {
      const s = this.openHdHub();
      s.onClose = () => this.finishPending();
    },

    hdLeaveMusic() { const g = this.game; if (this.mode === 'field' && g.map) this.audio.music(g.mapMusic(g.map.def)); },

    openHdHub() {
      const ui = this, g = this.game, D = g.hd();
      this.audio.music('sim');
      const pref = () => (HD.DIFFS[D.opts.diff] && g.hdCanDiff(D.opts.diff) ? D.opts.diff : 'normal');
      const items = () => {
        const run = g.hdRun(), list = [];
        if (hub && hub.pick) {
          for (const d of Object.keys(HD.DIFFS)) list.push({ id: 'd:' + d, diff: d, label: HD.DIFFS[d].name + (g.hdCanDiff(d) ? '' : ' (закрыта)') });
          list.push({ id: 'back', label: 'Назад' });
          return list;
        }
        if (run) list.push({ id: 'go', label: run.phase === 'draft' ? 'Продолжить (выбор героя)' : 'Продолжить (волна ' + run.wave + ')' });
        else list.push({ id: 'new', label: '1 ИГРОК: начать оборону' });
        const link = globalThis.Net98;
        if (link && link.me && link.me.table) list.push({ id: 'rejoin', label: 'Вернуться за стол' });
        list.push(link ? { id: 'coop', label: '2–4 ИГРОКА' } : { id: 'coop', label: '2–4 ИГРОКА: скоро', off: true });
        list.push({ id: 'diff', label: 'Сложность: ' + HD.DIFFS[pref()].name });
        const cl = g.hdClaimable(), n = v => (v ? ' (' + v + ')' : '');
        list.push({ id: 'dossier', label: 'Досье героев' }, { id: 'recs', label: 'Рекорды' }, { id: 'asc', label: 'Продвижение' + n(cl.asc) }, { id: 'week', label: 'Недельные очки' + n(cl.week) }, { id: 'trials', label: 'Испытания' + n(cl.trials) }, { id: 'hist', label: 'История' }, { id: 'rules', label: 'Правила' });
        if (run) list.push({ id: 'quit', label: 'Сдаться' });
        list.push({ id: 'close', label: 'Закрыть' });
        return list;
      };
      const act = (s, id) => {
        if (id === 'go') { if (g.hdRun().phase === 'draft') ui.openHdDraft(); else ui.openHdArena(); return; }
        if (id === 'new' || id === 'diff') { s.pick = id === 'new' ? 'start' : 'set'; s.back = s.sel; s.sel = Object.keys(HD.DIFFS).indexOf(pref()); return; }
        if (id === 'back') { s.pick = false; s.sel = s.back || 0; return; }
        if (id === 'rejoin') { ui.netRejoin(); return; }
        if (id === 'coop') { if (globalThis.Net98) ui.netOpenTable(); else ui.sfx('deny'); return; }
        if (id.startsWith('d:')) {
          const d = id.slice(2);
          if (!g.hdCanDiff(d)) { ui.sfx('deny'); return; }
          D.opts.diff = d;
          const start = s.pick === 'start';
          s.pick = false; s.sel = s.back || 0;
          if (start) { g.hdNew({ diff: d }); ui.openHdDraft(); } else ui.sfx('confirm');
          return;
        }
        if (id === 'quit') {
          if (s.confirm !== 'quit') { s.confirm = 'quit'; ui.sfx('deny'); return; }
          s.confirm = null;
          const sum = g.hdFinish(null, true);
          if (sum) ui.openHdResult(sum); else ui.sfx('cancel');
          return;
        }
        const OPEN = { dossier: 'openHdDossier', recs: 'openHdRecords', asc: 'openHdAsc', week: 'openHdWeek', trials: 'openHdTrials', hist: 'openHdHistory', rules: 'openHdRules' };
        if (OPEN[id]) { ui[OPEN[id]](); return; }
        if (id === 'close') { ui.pop(); ui.hdLeaveMusic(); }
      };
      const SX = 52, SY = 70, SW = W - 104, SH = 250, BY = 344;
      let hub = null;
      return (hub = this.push({
        full: true, hd: true, hub: true, sel: 0, confirm: null, pick: false, back: 0, items,
        draw(c) {
          const list = items(), run = g.hdRun();
          if (this.sel >= list.length) this.sel = list.length - 1;
          ui.hdCabinet(c, BY);
          ui.hdCrt(c, SX, SY, SW, SH);
          if (this.pick) this.drawDiff(c, list[this.sel]);
          else { this.drawAttract(c, run); this.drawTable(c); }
          this.drawButtons(c, list);
          if (this.confirm === 'quit') ui.text('Ещё раз Enter: сдаться', W / 2, SY + SH + 6, { align: 'center', size: 10, bold: true, col: K.red });
          else ui.text(this.pick ? '↑↓ выбор · Enter · Esc назад' : '↑↓ ←→ выбор · Enter · R правила · D досье · Esc выход', W / 2, SY + SH + 6, { align: 'center', size: 9, col: '#6a6080' });
        },
        drawAttract(c, run) {
          const x = SX + 10, y = SY + 10, w = 300, hh = 170, t = ui.t;
          c.fillStyle = '#041208'; c.fillRect(x, y, w, hh);
          const base = { x: x + w / 2, y: y + hh - 18 }, rifts = [{ x: x + 20, y: y + 30 }, { x: x + w / 2, y: y + 10 }, { x: x + w - 20, y: y + 30 }];
          const turrets = rifts.map(r => ({ x: r.x + (base.x - r.x) * 0.62, y: r.y + (base.y - r.y) * 0.62 }));
          c.strokeStyle = CRT.dim; c.lineWidth = 3;
          for (const r of rifts) { c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(base.x, base.y); c.stroke(); }
          c.lineWidth = 1;
          for (const r of rifts) { c.fillStyle = 'rgba(176,80,255,' + (0.6 + 0.3 * Math.sin(t * 3)).toFixed(3) + ')'; c.fillRect(r.x - 4, r.y - 6, 8, 12); }
          for (const tt of turrets) { c.fillStyle = '#56d4ff'; c.fillRect(tt.x - 3, tt.y - 3, 6, 6); }
          c.fillStyle = '#c9a45c'; c.fillRect(base.x - 40, base.y - 4, 80, 10);
          c.fillStyle = '#ffe0a0'; for (let i = 0; i < 6; i++) c.fillRect(base.x - 34 + i * 12, base.y - 2, 6, 3);
          for (let i = 0; i < 18; i++) {
            const r = rifts[i % 3], ph = (t * 0.22 + i * 0.137) % 1, stop = 0.62;
            const p = Math.min(ph, stop), fade = ph > stop ? Math.max(0, 1 - (ph - stop) * 8) : 1;
            if (fade <= 0) continue;
            c.fillStyle = 'rgba(255,74,58,' + fade.toFixed(3) + ')';
            c.fillRect(Math.round(r.x + (base.x - r.x) * p) - 1, Math.round(r.y + (base.y - r.y) * p) - 1, 3, 3);
            if (ph > stop && ph < stop + 0.05) { const tt = turrets[i % 3]; c.strokeStyle = 'rgba(86,212,255,0.9)'; c.beginPath(); c.moveTo(tt.x, tt.y); c.lineTo(r.x + (base.x - r.x) * p, r.y + (base.y - r.y) * p); c.stroke(); }
          }
          const ly = y + hh + 10, asc = g.hdAscLvl(), wk = D.week.pts;
          if (run) ui.text(ui.clip('ПАРТИЯ: ' + (run.phase === 'draft' ? 'выбор героя' : H.CHARS[run.players[0].hero].name + ', волна ' + run.wave + ' из ' + HD.WAVES.length) + ' · ' + HD.DIFFS[run.diff].name, w, 10, true), x, ly, { size: 10, bold: true, col: CRT.hi, shadow: false });
          else ui.text(Math.floor(ui.t * 2) % 2 ? 'ВСТАВЬТЕ ЖЕТОН' : 'НАЖМИТЕ ENTER', x + w / 2, ly, { align: 'center', size: 11, bold: true, col: CRT.hi, shadow: false });
          ui.text('ПРОДВИЖЕНИЕ ' + asc + '/' + HD.META.ascMax + ' · НЕДЕЛЯ ' + fmt(wk) + '/' + fmt(HD.META.weekMax), x, ly + 18, { size: 9, col: CRT.mid, shadow: false });
          if (D.last) ui.text(ui.clip('ПОСЛЕДНЯЯ: ' + (D.last.win ? 'рубеж удержан' : 'пал на волне ' + D.last.wave) + ' · ' + H.CHARS[D.last.hero].name, w, 9), x, ly + 32, { size: 9, col: CRT.mid, shadow: false });
        },
        drawTable(c) {
          const x = SX + 324, y = SY + 10, w = SW - 334, d = pref();
          ui.text('ЛУЧШИЕ · ' + HD.DIFFS[d].name.toUpperCase(), x + w / 2, y, { align: 'center', size: 11, bold: true, col: CRT.hi, shadow: false });
          const list = g.hdRecords(d).slice(0, HD.META.recShow);
          list.forEach((r, i) => {
            const yy = y + 22 + i * 26, col = r.solo ? CRT.fg : CRT.hi;
            ui.text(String(i + 1), x + 2, yy, { size: 10, bold: true, col, shadow: false });
            ui.text(ui.clip(r.name, 96, 10, true), x + 16, yy, { size: 10, bold: true, col, shadow: false });
            ui.text('В' + r.wave + ' ' + mmss(r.time), x + w, yy, { align: 'right', size: 10, col, shadow: false });
            ui.text(ui.clip(H.CHARS[r.hero].name, w - 66, 9), x + 16, yy + 12, { size: 9, col: CRT.mid, shadow: false });
            ui.hdStars(c, x + w - 30, yy + 17, r.stars, 4);
          });
        },
        drawDiff(c, it) {
          const x = SX + 16, y = SY + 14, list = items();
          ui.text(this.pick === 'start' ? 'ВЫБЕРИТЕ СЛОЖНОСТЬ' : 'СЛОЖНОСТЬ ПО УМОЛЧАНИЮ', x, y, { size: 12, bold: true, col: CRT.hi, shadow: false });
          list.forEach((r, i) => {
            const yy = y + 30 + i * 24, on = i === this.sel, open = !r.diff || g.hdCanDiff(r.diff);
            if (on) { c.fillStyle = 'rgba(90,255,122,0.16)'; c.fillRect(x - 4, yy - 3, 200, 20); }
            ui.text((on ? '> ' : '  ') + r.label, x, yy, { size: 11, bold: on, col: open ? (on ? CRT.hi : CRT.fg) : CRT.dim, shadow: false });
            ui.hit(x - 4, yy - 3, 200, 20, () => { if (this.sel === i) act(this, r.id); else { this.sel = i; ui.sfx('select'); } });
          });
          if (!it || !it.diff) return;
          const Dd = HD.DIFFS[it.diff], rx = SX + 260, num = v => '×' + String(v).replace('.', ',');
          const rows = [['НР врагов', num(Dd.hp)], ['Урон врагов', num(Dd.dmg)], ['НР Экспресса', fmt(Dd.base)], ['Перерыв', Dd.breakT + ' с'], ['Возрождение героя', num(Dd.respawn)], ['Золото', num(Dd.gold)]];
          rows.forEach(([k2, v], i) => { ui.text(k2, rx, y + 30 + i * 22, { size: 11, col: CRT.mid, shadow: false }); ui.text(v, SX + SW - 20, y + 30 + i * 22, { align: 'right', size: 11, bold: true, col: CRT.hi, shadow: false }); });
          if (!g.hdCanDiff(it.diff)) ui.text('Откроется после победы на Обычной', rx, y + 170, { size: 11, bold: true, col: '#ff8a6a', shadow: false });
        },
        drawButtons(c, list) {
          const cols = 3, bw = 184, bh = 24, gx = 10, x0 = (W - cols * bw - (cols - 1) * gx) / 2;
          list.forEach((it, i) => {
            if (this.pick) return;
            const x = x0 + (i % cols) * (bw + gx), y = BY + Math.floor(i / cols) * (bh + 6), on = i === this.sel;
            c.fillStyle = it.off ? '#1a1620' : on ? '#ffd471' : '#2a2038'; c.fillRect(x, y, bw, bh);
            c.fillStyle = it.off ? '#2a2430' : on ? '#fff0b0' : '#3a3050'; c.fillRect(x, y, bw, 3);
            c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x, y + bh - 3, bw, 3);
            c.fillStyle = it.off ? '#3a3440' : on ? '#ff4a3a' : '#a03a50'; c.beginPath(); c.arc(x + 13, y + bh / 2, 6, 0, Math.PI * 2); c.fill();
            ui.text(ui.clip(it.label, bw - 32, 10, true), x + 26, y + 7, { size: 10, bold: true, col: it.off ? '#5a5060' : on ? '#1a1208' : C.cream, shadow: false });
            ui.hit(x, y, bw, bh, () => { if (this.sel === i) act(this, it.id); else { this.sel = i; ui.sfx('select'); } });
          });
        },
        key(k, code) {
          const list = items();
          if (k !== 'ok') this.confirm = null;
          if (!this.pick && code === 'KeyR') { ui.openHdRules(); return; }
          if (!this.pick && code === 'KeyD') { ui.openHdDossier(); return; }
          if (!this.pick && (k === 'left' || k === 'right')) { this.sel = (this.sel + (k === 'left' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return; }
          if (!this.pick && (k === 'up' || k === 'down')) { const s = this.sel + (k === 'up' ? -3 : 3); if (s >= 0 && s < list.length) this.sel = s; ui.sfx('select'); return; }
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok') { act(this, list[this.sel].id); return; }
          if (k === 'back' && this.pick) { this.pick = false; this.sel = this.back || 0; return; }
          if (k === 'back') { ui.pop(); ui.hdLeaveMusic(); }
        }
      }));
    },

    hdCabinet(c, deckY) {
      const plate = this.game.hd().plate;
      c.fillStyle = '#07050c'; c.fillRect(0, 0, W, HGT);
      const gr = c.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, '#1a1024'); gr.addColorStop(0.5, '#2a1a3a'); gr.addColorStop(1, '#1a1024');
      c.fillStyle = gr; c.fillRect(24, 0, W - 48, HGT);
      c.fillStyle = this.dither(); c.fillRect(24, 0, W - 48, HGT);
      c.fillStyle = '#3a2450'; c.fillRect(24, 0, 6, HGT); c.fillRect(W - 30, 0, 6, HGT);
      c.fillStyle = '#120818'; c.fillRect(40, 8, W - 80, 48);
      const k = 0.75 + 0.25 * Math.sin(this.t * 2.4);
      c.fillStyle = 'rgba(255,122,90,' + (0.18 * k).toFixed(3) + ')'; c.fillRect(40, 8, W - 80, 48);
      c.strokeStyle = '#ff7a5a'; c.lineWidth = 2; c.strokeRect(41, 9, W - 82, 46); c.lineWidth = 1;
      this.text('РУБЕЖ ЭКСПРЕССА', W / 2, 18, { align: 'center', size: 22, bold: true, serif: true, col: k > 0.9 ? '#ffe0c8' : '#ffb090' });
      for (let i = 0; i < 9; i++) { c.fillStyle = (Math.floor(this.t * 4) + i) % 3 ? '#5a2a20' : '#ffd471'; c.fillRect(54 + i * 8, 46, 4, 4); c.fillRect(W - 90 + i * 4, 46, 2, 4); }
      if (plate) { const pw = this.measure(plate, 9, true) + 14; c.fillStyle = '#c9a45c'; c.fillRect(W / 2 - pw / 2, 57, pw, 11); this.text(plate, W / 2, 57, { align: 'center', size: 9, bold: true, col: '#1a1208', shadow: false }); }
      c.fillStyle = '#100a18'; c.fillRect(36, deckY - 8, W - 72, HGT - deckY);
      c.fillStyle = '#4a3060'; c.fillRect(36, deckY - 8, W - 72, 2);
    },

    openHdDraft(net) {
      const ui = this, g = this.game, STOP = [0.5, 0.8, 1.1], CW = 200, CH = 352, CY = 64;
      const run = () => (net ? net.drafts[net.seat] : g.hdRun());
      const take = s => {
        if (net) {
          if (s.sent || net.takes[net.seat]) return;
          s.sent = true;
          net.send({ t: 'take', i: s.sel });
          ui.sfx('confirm');
          return;
        }
        if (!g.hdTake(s.sel)) return;
        ui.sfx('confirm');
        ui.screens.splice(ui.screens.indexOf(s), 1);
        ui.openHdArena();
      };
      const refresh = (s, R) => {
        if (net) { if (!net.takes[net.seat] && R.draft.cards[s.sel].left > 0) net.send({ t: 'refresh', i: s.sel }); else ui.sfx('deny'); return; }
        if (g.hdRefresh(s.sel)) { s.roll[s.sel] = 0.35; ui.sfx('shuffle'); } else ui.sfx('deny');
      };
      return this.push({
        full: true, hd: true, hdRound: !!net, draft: true, sel: 0, age: 0, roll: [0, 0, 0], card: null, sent: false, leave: false, shown: null,
        tick(dt) {
          this.age += dt; this.roll = this.roll.map(r => Math.max(0, r - dt));
          if (!net) return;
          if (ui.netSession !== net || !ui.screens.includes(this)) return;
          net.advance(dt);
          if (net.A) { ui.netRoute(); return; }
          const now = run().draft.cards.map(cd => cd.hero);
          if (this.shown) now.forEach((id, i) => { if (id !== this.shown[i]) { this.roll[i] = 0.35; ui.sfx('shuffle'); } });
          this.shown = now;
        },
        ready() { return this.age >= STOP[2]; },
        draw(c) {
          const R = run();
          if (!R || !R.draft) return;
          c.fillStyle = '#07060f'; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          c.fillStyle = '#3a0c10'; c.fillRect(0, 0, W, 34);
          c.fillStyle = K.red; c.fillRect(0, 34, W, 1);
          const TA = HD.THREATS[R.threats[0]], TB = HD.THREATS[R.threats[1]], boss = H.ENEMIES[TA.small], big = H.ENEMIES[TB.big];
          G.foeIcon(c, Object.assign({ id: TA.small }, boss), 8, 4, 26, {});
          ui.text(ui.clip('Угрозы: ' + TA.name + ', затем ' + TB.name, 470, 12, true), 42, 4, { size: 12, bold: true, col: '#ffb0a0' });
          ui.text(ui.clip('Волны 1–10: ' + boss.name + ' · 11–20: ' + big.name, 470, 10), 42, 19, { size: 10, col: '#d08a80' });
          ui.text('Сложность: ' + HD.DIFFS[R.diff].name, W - 10, 11, { align: 'right', size: 10, col: C.sub });
          R.draft.cards.forEach((cd, i) => this.drawCard(c, R, cd, i));
          if (net) ui.drawHdDraftSeats(c, net);
          ui.hints([['←→', 'Карточка'], ['R', 'Обновить'], ['Enter', 'Взять'], ['C', 'Карточка героя'], ['Esc', !net ? 'Назад' : this.leave ? 'Ещё раз: покинуть стол' : 'Покинуть']], W / 2, HGT - 18, { align: 'center' });
          if (this.card) ui.drawHdCard(c, ui.hdHeroInfo(R.draft.cards[this.sel].hero), this.card, 4, 40, 300, 410);
        },
        drawCard(c, R, cd, i) {
          const x = 12 + i * 208, on = i === this.sel, y = CY - (on ? 6 : 0), stop = this.age >= STOP[i];
          ui.win(x, y, CW, CH, { border: on ? C.brassHi : '#3a3060', corners: on });
          c.fillStyle = '#05040c'; c.fillRect(x + 70, y + 10, 60, 50);
          c.strokeStyle = '#6a5328'; c.strokeRect(x + 70.5, y + 10.5, 59, 49);
          if (!stop) {
            const paths = HD.PATHS, spin = Math.floor(this.age * 14 + i * 3) % paths.length, off = (this.age * 14 % 1) * 40;
            c.save(); c.beginPath(); c.rect(x + 71, y + 11, 58, 48); c.clip();
            G.pathIcon(c, paths[spin], x + 80, y + 15 - off, 40, C.brassHi);
            G.pathIcon(c, paths[(spin + 1) % paths.length], x + 80, y + 55 - off, 40, C.brassHi);
            c.restore();
            ui.hit(x, y, CW, CH, () => { this.sel = i; });
            return;
          }
          G.pathIcon(c, cd.path, x + 80, y + 15, 40, C.brassHi);
          ui.text(H.PATHS[cd.path].name, x + CW / 2, y + 64, { align: 'center', size: 11, bold: true, col: C.gold });
          const id = cd.hero, k = H.CHARS[id], d = HD.HEROES[id], st = HD.heroStats(id, 1), sc = this.roll[i] / 0.35;
          c.save(); c.beginPath(); c.rect(x + 4, y + 80, CW - 8, 70); c.clip();
          G.drawBust(c, G.lookOf(id, g), x + CW / 2 - 32, y + 82 - sc * 70, 1);
          c.restore();
          let yy = y + 152;
          ui.text(k.name, x + CW / 2, yy, { align: 'center', size: 13, bold: true, col: on ? C.gold : C.cream });
          yy += 18;
          G.elemIcon(c, k.elem, x + 22, yy + 6, 6);
          ui.text(H.ELEMENTS[k.elem].name + ' · ' + HD.ATTR_NAME[d.main], x + 34, yy, { size: 10, col: HD.ATTR_COL[d.main] });
          yy += 15;
          ui.text((d.melee ? 'Ближний' : 'Дальний') + ' · ' + HD.ATK_NAME[d.atk] + ' · ' + HD.ARMOR_NAME[d.armor], x + 12, yy, { size: 10, col: C.sub });
          yy += 14;
          ui.text('Скорость ' + Math.round(st.spd) + ' · НР ' + fmt(st.hpMax), x + 12, yy, { size: 10, col: C.sub });
          yy += 16;
          ui.wrap(d.role, CW - 24, 10).slice(0, 2).forEach(l => { ui.text(l, x + 12, yy, { size: 10, col: C.cream }); yy += 13; });
          yy += 4;
          const names = { q: k.skill.name, e: k.tech.name, t: 'Талант', r: k.ult.name };
          for (const sl of ['q', 'e', 't', 'r']) {
            ui.keycap(x + 12, yy, sl.toUpperCase());
            ui.text(ui.clip(names[sl], CW - 46, 10), x + 32, yy + 1, { size: 10, col: C.cream });
            yy += 16;
          }
          ui.text('Обновлений:', x + 12, y + CH - 22, { size: 10, col: C.sub });
          for (let j = 0; j < 2; j++) { c.fillStyle = j < cd.left ? '#ffd471' : '#2a2a3a'; c.beginPath(); c.arc(x + 96 + j * 14, y + CH - 16, 5, 0, Math.PI * 2); c.fill(); }
          ui.hit(x, y, CW, CH, () => { if (this.sel === i && this.ready()) take(this); else { this.sel = i; ui.sfx('select'); } });
          ui.hit(x + 8, y + CH - 28, CW - 16, 24, () => { this.sel = i; if (this.ready()) refresh(this, R); });
        },
        key(k, code) {
          const R = run();
          if (this.card) {
            if (code === 'KeyC' || k === 'back') { this.card = null; ui.sfx('cancel'); return; }
            if (code === 'KeyQ' || code === 'KeyE') { this.card.tab = (this.card.tab + (code === 'KeyQ' ? 2 : 1)) % 3; this.card.top = 0; ui.sfx('select'); return; }
            if (k === 'up' || k === 'down') { this.card.top = Math.max(0, this.card.top + (k === 'up' ? -3 : 3)); return; }
            return;
          }
          if (k === 'back') {
            if (!net) { ui.pop(); return; }
            if (this.leave) { ui.netFinish(true); return; }
            this.leave = true;
            ui.sfx('deny');
            return;
          }
          this.leave = false;
          if (!this.ready()) { if (k === 'ok') this.age = STOP[2]; return; }
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? 2 : 1)) % 3; ui.sfx('select'); return; }
          if (code === 'KeyR') { refresh(this, R); return; }
          if (code === 'KeyC') { this.card = { tab: 0, top: 0 }; ui.sfx('select'); return; }
          if (k === 'ok' && R) take(this);
        }
      });
    },

    openHdPause(arena) {
      const ui = this, g = this.game, A = arena.arena, net = arena.net, hero = A.heroes[arena.me];
      const items = () => (net
        ? [{ id: 'go', label: 'Продолжить' }, { id: 'share', label: ui.netPaused() ? 'Снять паузу' : ui.netPausesLeft() == null ? 'Пауза для всех' : 'Пауза для всех (осталось ' + ui.netPausesLeft() + ')' }, { id: 'keys', label: 'Управление' }, { id: 'rules', label: 'Правила' }, { id: 'leave', label: 'Покинуть партию' }]
        : [{ id: 'go', label: 'Продолжить' }, { id: 'keys', label: 'Управление' }, { id: 'rules', label: 'Правила' }, { id: 'quit', label: 'Сдаться' }, { id: 'exit', label: 'Выйти в вагон' }]);
      const act = (s, id) => {
        if (id === 'go') { ui.pop(); return; }
        if (id === 'share') {
          if (!ui.netPaused() && ui.netPausesLeft() === 0) { ui.sfx('deny'); return; }
          ui.netPauseToggle();
          ui.pop();
          return;
        }
        if (id === 'leave') {
          if (s.confirm !== 'quit') { s.confirm = 'quit'; ui.sfx('deny'); return; }
          ui.netFinish(true);
          return;
        }
        if (id === 'keys') { ui.openHdControls(); return; }
        if (id === 'rules') { ui.openHdRules(); return; }
        if (id === 'quit') {
          if (s.confirm !== 'quit') { s.confirm = 'quit'; ui.sfx('deny'); return; }
          ui.screens.pop(); ui.screens.pop();
          ui.openHdResult(g.hdFinish(A, true));
          return;
        }
        if (id === 'exit') {
          if (A.phase === 'break') { g.hdSync(A); g.events.push({ t: 'autosave' }); }
          while (ui.top() && ui.top().hd) ui.pop();
          ui.hdLeaveMusic();
        }
      };
      return this.push({
        hd: true, pause: !net, hdRound: !!net, sel: 0, confirm: null,
        draw(c) {
          const list = items(), x = W / 2 - 130, y = 120, h = 60 + list.length * 24;
          ui.win(x, y, 260, h + 30, { title: net ? 'Меню' : 'Пауза' });
          ui.list(x + 14, y + 22, 232, list.map(it => ({ label: it.label })), this.sel, { rowH: 24, onClick: i => { this.sel = i; act(this, list[i].id); } });
          const note = net ? (this.confirm === 'quit' ? 'Ещё раз Enter: покинуть партию' : 'Партия не остановлена') : this.confirm === 'quit' ? 'Ещё раз Enter: сдаться' : A.phase === 'wave' ? 'Выход в вагон: волна начнётся заново' : 'Партия сохранится в перерыве';
          ui.text(note, W / 2, y + 30 + list.length * 24, { align: 'center', size: 10, col: this.confirm || (!net && A.phase === 'wave') ? K.red : C.sub });
          ui.text('Волна ' + A.wave + ' · ' + H.CHARS[hero.key].name + ', ур. ' + hero.lvl, W / 2, y + 46 + list.length * 24, { align: 'center', size: 10, col: C.sub });
        },
        key(k) {
          if (k !== 'ok') this.confirm = null;
          if (ui.listNav(this, k, items().length)) return;
          if (k === 'ok') act(this, items()[this.sel].id);
          if (k === 'back') ui.pop();
        }
      });
    },

    openHdDossier() {
      const ui = this, g = this.game, PATHS = HD.draftPaths();
      return this.push({
        full: true, hd: true, dossier: true, p: 0, sel: 0, card: { tab: 0, top: 0 },
        hero() { return HD.heroesOf(PATHS[this.p])[this.sel]; },
        draw(c) {
          c.fillStyle = '#06050e'; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          ui.plate(16, 12, 'Досье героев');
          ui.text('Числа 20-го уровня, все Следы и Эйдолоны', 196, 18, { size: 10, col: C.sub });
          PATHS.forEach((path, i) => {
            const y = 44 + i * 58, on = i === this.p;
            c.fillStyle = on ? '#2e2410' : '#0e1230'; c.fillRect(14, y, 52, 52);
            c.strokeStyle = on ? C.brassHi : '#2a3460'; c.strokeRect(14.5, y + 0.5, 51, 51);
            G.pathIcon(c, path, 22, y + 4, 36, on ? C.brassHi : '#6a6a8a');
            ui.text(ui.clip(H.PATHS[path].name, 50, 8), 40, y + 42, { align: 'center', size: 8, col: on ? C.gold : C.dim });
            ui.hit(14, y, 52, 52, () => { this.p = i; this.sel = 0; this.card.top = 0; ui.sfx('select'); });
          });
          HD.heroesOf(PATHS[this.p]).forEach((id, i) => {
            const y = 44 + i * 132, on = i === this.sel, d = HD.HEROES[id], k = H.CHARS[id];
            ui.win(76, y, 158, 124, { border: on ? C.brassHi : '#3a3060', corners: on });
            G.drawBust(c, G.lookOf(id, g), 120, y + 8, 1);
            ui.text(ui.clip(k.name, 140, 11, true), 155, y + 80, { align: 'center', size: 11, bold: true, col: on ? C.gold : C.cream });
            G.hdAttrIcon(c, d.main, 86, y + 96, 12); G.hdAtkIcon(c, d.atk, 102, y + 96, 12); G.hdArmorIcon(c, d.armor, 118, y + 96, 12);
            ui.text(ui.clip(H.ELEMENTS[k.elem].name + ' · ' + (d.melee ? 'ближний' : 'дальний'), 92, 9), 136, y + 97, { size: 9, col: C.sub });
            ui.text(ui.clip(d.role, 140, 9), 84, y + 110, { size: 9, col: C.dim });
            ui.hit(76, y, 158, 124, () => { this.sel = i; this.card.top = 0; ui.sfx('select'); });
          });
          ui.drawHdCard(c, ui.hdHeroInfo(this.hero(), null, null, 20), this.card, 244, 40, W - 256, HGT - 52, [['Q E', 'Путь'], ['↑↓', 'Герой'], ['←→', 'Вкладки'], ['PgDn', 'Листать'], ['Esc', 'Назад']]);
        },
        key(k, code) {
          const n = PATHS.length;
          if (code === 'KeyQ' || code === 'KeyE') { this.p = (this.p + (code === 'KeyQ' ? n - 1 : 1)) % n; this.sel = 0; this.card.top = 0; ui.sfx('select'); return; }
          if (k === 'up' || k === 'down') { const m = HD.heroesOf(PATHS[this.p]).length; this.sel = (this.sel + (k === 'up' ? m - 1 : 1)) % m; this.card.top = 0; ui.sfx('select'); return; }
          if (k === 'left' || k === 'right') { this.card.tab = (this.card.tab + (k === 'left' ? 2 : 1)) % 3; this.card.top = 0; ui.sfx('select'); return; }
          if (code === 'PageDown' || code === 'PageUp') { this.card.top = Math.max(0, this.card.top + (code === 'PageUp' ? -6 : 6)); return; }
          if (k === 'back' || k === 'ok') ui.pop();
        }
      });
    },

    openHdRules() {
      const ui = this, g = this.game, D = g.hd();
      const AIMS = [['auto', 'авто'], ['cursor', 'курсор'], ['target', 'цель']];
      const T = HD.TUN, M = HD.META;
      const PAGES = [
        ['Цель', [
          'Экспресс стоит у перрона, к нему по трём линиям идут враги двух угроз. Продержитесь 20 волн: на 10-й выходит малый босс первой угрозы, на 20-й большой босс второй.',
          'Партия проиграна, когда НР Экспресса падает до нуля. Гибель героя поражением не считается: он возрождается на площади.',
          'Звёзды победы: одна за целый Экспресс, две при НР от 50%, три при НР от 90% и всех турелях.'
        ]],
        ['Управление', CONTROLS.map(([k, v]) => k + ': ' + v).concat(['Наведение «авто»: области и прыжки ставятся под курсор, если он двигался в последние ' + T.aimFresh + ' с, иначе в выбранную цель. «Курсор»: всегда под курсор. «Цель»: всегда в цель.'])],
        ['Атрибуты', [
          'СИЛ даёт ' + T.hpPerStr + ' НР и восстановление НР за единицу.',
          'ЛОВ даёт броню и скорость атаки.',
          'ИНТ даёт ' + T.enPerInt + ' энергии и восстановление энергии за единицу.',
          'Основной атрибут героя ещё прибавляется к урону атаки один к одному.'
        ]],
        ['Атака и броня', ['Урон зависит от типа атаки и типа брони цели. Броня снижает урон: при броне 20 урон вдвое меньше.']],
        ['Стойкость', [
          'Удар по слабости врага сбивает полную стойкость, удар без слабости только ' + Math.round(T.toughNoWeak * 100) + '%.',
          'Пробитый враг оглушён, получает на ' + Math.round(T.brokenVuln * 100) + '% больше урона и эффект пробития своей стихии. Стойкость возвращается через ' + T.toughBack + ' с.',
          'Пробитие во время подготовки отменяет способность врага или босса.'
        ]],
        ['Развитие', [
          'Опыт дают добивания рядом с героем и каждая отбитая волна. Каждый уровень даёт очко развития.',
          'Навык, Техника и Талант растут до 5-го уровня, Абсолютная техника до 3-го (на 6, 12 и 18-м уровне героя).',
          'На 10-м уровне выбирается След, на 20-м Эйдолон.'
        ]],
        ['Лавка', [
          'Лавка Пом-Пом стоит на площади, клавиша B. Шесть ячеек на реликвии, устройства и припасы, отдельная ячейка для конуса.',
          'Реликвия: одна часть каждого вида, улучшение до +15. Конусы только своего Пути, наложение до S5.',
          'Продажа даёт ' + Math.round(T.sell * 100) + '% потраченного; купленное в том же перерыве продаётся за полную цену.'
        ]],
        ['Рубеж', [
          'Три турели держат входы с линий. Павшую турель можно восстановить в перерыве за золото.',
          'В перерыве Экспресс восстанавливает ' + Math.round(T.baseRegen * 100) + '% НР в секунду, а герой на площади всё НР и энергию за ' + T.plazaFull + ' с.',
          'Вылазка: добивание у разлома даёт +' + Math.round(T.raidGold * 100) + '% золота. «Чистая линия»: если ни один враг не дошёл до турели, золото за волну +' + Math.round(T.cleanBonus * 100) + '%.',
          'Продвижение: победа ' + fmt(M.ascWin.easy) + ', ' + fmt(M.ascWin.normal) + ' или ' + fmt(M.ascWin.hard) + ' очков. Недельные очки: ' + fmt(M.weekWave) + ' за волну, победа сразу ' + fmt(M.weekWin) + '.'
        ]],
        ['Экипаж', [
          'За столом от двух до четырёх игроков. Хозяин выбирает сложность, зовёт друзей и начинает партию, когда все нажали «Готов». Открытый стол виден всем в списке, закрытый только по коду.',
          'У каждого свой бросок Путей, одного героя двоим не дают. Экспресс и турели общие. Золото за добивание получают все поровну, золото с вылазки только добивший. Волна досрочно начнётся, когда согласны все.',
          'G ставит метку под курсором, V открывает готовые фразы. Их видят все за столом.',
          'Esc партию не останавливает. P ставит паузу для всех: за открытым столом 3 раза по 2 минуты, за закрытым без счёта и до 10 минут. Снять её может сразу тот, кто поставил, остальные через 15 секунд.',
          'Если связь пропала, партия идёт дальше, а ваш герой стоит и бьёт сам. Вернуться можно в любой момент: кнопка «Вернуться за стол».'
        ]]
      ];
      return this.push({
        full: true, hd: true, rules: true, sel: 0,
        draw(c) {
          c.fillStyle = '#06060e'; c.fillRect(0, 0, W, HGT);
          ui.plate(16, 12, 'Правила');
          PAGES.forEach(([name], i) => {
            const y = 48 + i * 30, on = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.16)' : 'rgba(10,14,40,0.8)'; c.fillRect(16, y, 150, 26);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(16, y, 3, 26); }
            ui.text(name, 26, y + 7, { size: 11, bold: on, col: on ? C.gold : C.cream });
            ui.hit(16, y, 150, 26, () => { this.sel = i; ui.sfx('select'); });
          });
          const ay = 48 + PAGES.length * 30 + 12, aim = AIMS.findIndex(a => a[0] === (D.opts.aim || 'auto'));
          c.fillStyle = '#1a1c34'; c.fillRect(16, ay, 150, 26);
          ui.text('Наведение: ' + AIMS[aim][1], 26, ay + 7, { size: 11, bold: true, col: '#ffd471' });
          ui.hit(16, ay, 150, 26, () => this.aim());
          const x = 184, w = W - x - 16, [name, lines] = PAGES[this.sel];
          ui.win(x, 40, w, HGT - 80, { title: name });
          let y = 60;
          for (const p of lines) { for (const l of ui.wrap(p, w - 28, 10)) { ui.text(l, x + 14, y, { size: 10, col: C.cream }); y += 13; } y += 6; }
          if (name === 'Атака и броня') this.drawTable(c, x + 14, y + 6);
          ui.hints([['↑↓', 'Страница'], ['A', 'Наведение'], ['Esc', 'Назад']], W / 2, HGT - 24, { align: 'center' });
        },
        drawTable(c, x, y) {
          const AR = Object.keys(HD.ARMOR0), AT = Object.keys(HD.ATK_ARMOR), cw = 60;
          AR.forEach((a, j) => { G.hdArmorIcon(c, a, x + 100 + j * cw + 24, y, 14); ui.text(HD.ARMOR_NAME[a], x + 100 + j * cw + 31, y + 18, { align: 'center', size: 9, col: C.sub }); });
          AT.forEach((t, i) => {
            const yy = y + 40 + i * 26;
            G.hdAtkIcon(c, t, x, yy, 14);
            ui.text(HD.ATK_NAME[t], x + 20, yy + 2, { size: 10, bold: true, col: C.cream });
            AR.forEach((a, j) => { const v = HD.ATK_ARMOR[t][a]; ui.text(Math.round(v * 100) + '%', x + 100 + j * cw + 31, yy + 2, { align: 'center', size: 10, bold: true, col: v > 1 ? C.ok : v < 1 ? '#ff8a6a' : C.cream }); });
          });
        },
        aim() { const i = AIMS.findIndex(a => a[0] === (D.opts.aim || 'auto')); D.opts.aim = AIMS[(i + 1) % AIMS.length][0]; ui.sfx('select'); },
        key(k, code) {
          if (ui.listNav(this, k, PAGES.length)) return;
          if (code === 'KeyA' || k === 'ok') { this.aim(); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openHdControls() {
      const ui = this;
      return this.push({
        hd: true,
        draw() {
          const x = W / 2 - 200, y = 60, h = 40 + CONTROLS.length * 20;
          ui.win(x, y, 400, h + 20, { title: 'Управление' });
          CONTROLS.forEach(([key, what], i) => {
            ui.text(key, x + 20, y + 24 + i * 20, { size: 11, bold: true, col: C.gold });
            ui.text(what, x + 140, y + 24 + i * 20, { size: 11, col: C.cream });
          });
          ui.hints([['Esc', 'Назад']], W / 2, y + h + 26, { align: 'center' });
        },
        key(k) { if (k === 'back' || k === 'ok') ui.pop(); }
      });
    },

    hdCrt(c, x, y, w, h) {
      c.fillStyle = '#000000'; c.fillRect(x - 3, y - 3, w + 6, h + 6);
      c.fillStyle = CRT.bg; c.fillRect(x, y, w, h);
      for (let yy = y; yy < y + h; yy += 2) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x, yy, w, 1); }
      c.strokeStyle = CRT.dim; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },

    hdStars(c, x, y, n, r) {
      for (let i = 0; i < 3; i++) {
        const cx = x + i * (r * 2 + 6);
        c.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(cx + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        c.closePath();
        c.fillStyle = i < n ? '#ffd471' : '#2a2438'; c.fill();
        c.strokeStyle = i < n ? '#fff0b0' : '#4a4060'; c.lineWidth = 1; c.stroke();
      }
    },

    hdMetaLine(c, M, y, x0) {
      const P = HD.META, D = this.game.hd(), lv = M.ascLvl[1], x1 = x0 + 212, x2 = x0 + 422;
      this.text('Продвижение +' + fmt(M.asc), x0, y, { size: 11, bold: true, col: C.gold });
      this.text(M.ascLvl[0] === lv ? 'уровень ' + lv : 'уровень ' + M.ascLvl[0] + ' → ' + lv, x0, y + 16, { size: 10, col: M.ascLvl[0] === lv ? C.sub : C.ok });
      this.bar(x0, y + 32, 190, 5, lv >= P.ascMax ? 1 : (D.asc.pts % P.ascPer) / P.ascPer, '#ffd471');
      this.text('Недельные очки +' + fmt(M.week), x1, y, { size: 11, bold: true, col: C.gold });
      this.text(fmt(D.week.pts) + ' / ' + fmt(P.weekMax), x1, y + 16, { size: 10, col: C.sub });
      this.bar(x1, y + 32, 190, 5, D.week.pts / P.weekMax, '#80e0ff');
      const tr = M.trials.map(id => HD.TRIALS.find(T => T.id === id).name);
      this.text(tr.length ? 'Испытания: ' + tr.length : 'Новых испытаний нет', x2, y, { size: 11, bold: true, col: tr.length ? C.ok : C.sub });
      if (tr.length) this.text(this.clip(tr[0] + (tr.length > 1 ? ' и ещё ' + (tr.length - 1) : ''), W - 16 - x2, 10), x2, y + 16, { size: 10, col: C.cream });
    },

    hdRecRows(c, list, x, y, w, rows, o = {}) {
      const ui = this, rh = o.rh || 15, place = o.place || 0;
      let show = list.slice(0, rows).map((r, i) => ({ r, n: i + 1 }));
      if (place > rows) show = show.slice(0, rows - 1).concat([{ r: list[place - 1], n: place }]);
      const k = Math.min(1, (o.age || 0) / 0.8);
      show.forEach(({ r, n }, i) => {
        const fresh = r === o.mark, below = place && n > place && n <= rows;
        const dx = fresh ? Math.round((1 - k) * w) : 0, dy = below ? -Math.round((1 - k) * rh) : 0, yy = y + i * rh + dy;
        if (fresh) { c.fillStyle = 'rgba(90,255,122,' + (0.18 + 0.1 * Math.sin(ui.t * 6)).toFixed(3) + ')'; c.fillRect(x + dx, yy - 2, w, rh - 1); }
        const col = fresh ? CRT.hi : r.solo ? CRT.fg : CRT.mid;
        ui.text(String(n).padStart(2, ' '), x + 4 + dx, yy, { size: 10, bold: true, col, shadow: false });
        if (o.crew) ui.text(ui.clip(r.crew.join(', '), 220, 10, true), x + 24 + dx, yy, { size: 10, bold: true, col, shadow: false });
        else {
          ui.text(ui.clip(r.name, o.wide ? 96 : 70, 10, true), x + 24 + dx, yy, { size: 10, bold: true, col, shadow: false });
          if (o.wide) ui.text(ui.clip(H.CHARS[r.hero].name, 120, 10), x + 126 + dx, yy, { size: 10, col, shadow: false });
        }
        ui.text('В' + r.wave, x + w - (o.wide ? 184 : 72) + dx, yy, { size: 10, bold: true, col, shadow: false });
        ui.text(mmss(r.time), x + w - (o.wide ? 144 : 40) + dx, yy, { size: 10, col, shadow: false });
        if (o.wide) { ui.hdStars(c, x + w - 100 + dx, yy + 6, r.stars, 4); ui.text(dateOf(r.date), x + w - 6 + dx, yy, { align: 'right', size: 10, col: CRT.mid, shadow: false }); }
      });
      if (!show.length) ui.text('Записей нет', x + w / 2, y + 4, { align: 'center', size: 10, col: CRT.mid, shadow: false });
    },

    openHdResult(sum, view) {
      if (sum.crewRows) return this.openHdCrewResult(sum, { view });
      const ui = this, g = this.game;
      if (!view) { this.sfx(sum.win ? 'win' : 'lose'); this.audio.music('sim'); }
      const M = sum.meta, recs = g.hdRecords(sum.diff);
      return this.push({
        full: true, hd: true, result: true, sum, view: !!view, age: 0,
        tick(dt) { this.age += dt; },
        draw(c) {
          c.fillStyle = '#05040c'; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          const col = sum.win ? '#86e39a' : K.red;
          c.save(); c.translate(W / 2, 42); c.rotate(-0.05);
          c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(-150, -24, 300, 48);
          ui.text(sum.win ? 'РУБЕЖ УДЕРЖАН' : 'РУБЕЖ ПАЛ', 0, -13, { align: 'center', size: 24, bold: true, serif: true, col });
          c.restore();
          ui.hdStars(c, W / 2 - 24, 86, sum.stars || 0, 9);
          const th = (sum.threats || []).map(t => HD.THREATS[t].name).join(', затем ');
          ui.text(ui.clip((sum.win ? 'Все ' + sum.waves + ' волн отбиты' : 'Экспресс пал на волне ' + sum.wave + ' из ' + sum.waves) + ' · ' + HD.DIFFS[sum.diff].name + (th ? ' · ' + th : ''), W - 40, 11), W / 2, 104, { align: 'center', size: 11, col: C.cream });
          this.drawHero(c);
          this.drawStats(c);
          this.drawRecs(c);
          this.drawMeta(c);
          ui.hints([['Enter', view ? 'Назад' : 'К автомату']], W / 2, HGT - 18, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        drawHero(c) {
          const x = 16, y = 130, w = 196;
          ui.win(x, y, w, 252, { title: 'Герой' });
          G.drawBust(c, G.lookOf(sum.hero, g), x + 48, y + 14, 1.4);
          ui.text(ui.clip(H.CHARS[sum.hero].name + ', ур. ' + sum.lvl, w - 20, 11, true), x + w / 2, y + 120, { align: 'center', size: 11, bold: true, col: C.gold });
          ui.text('Гибели: ' + sum.deaths, x + w / 2, y + 136, { align: 'center', size: 10, col: C.sub });
          const B = sum.build || { items: [] };
          (B.items || []).forEach((it, i) => {
            const ix = x + 14 + (i % 3) * 30, iy = y + 156 + Math.floor(i / 3) * 30;
            c.fillStyle = '#0e1230'; c.fillRect(ix, iy, 26, 26);
            if (it) { G.hdItemIcon(c, it, ix + 1, iy + 1, 24); if (it.up) ui.text('+' + it.up * 3, ix + 25, iy + 16, { align: 'right', size: 8, bold: true, col: '#ffd471' }); }
          });
          if (B.cone) { G.drawConeCard(c, B.cone.id, x + 112, y + 156, 40, 56, { info: false }); ui.text('S' + B.cone.sup, x + 160, y + 198, { size: 10, bold: true, col: '#ffd471' }); }
          const K2 = HD.KITS[sum.hero], tr = B.tr != null && K2.tr[B.tr], ei = B.ei != null && K2.ei[B.ei];
          ui.text(ui.clip('След: ' + (tr ? tr.name : 'нет'), w - 20, 9), x + 10, y + 220, { size: 9, col: tr ? C.cream : C.dim });
          ui.text(ui.clip('Эйдолон: ' + (ei ? ei.name : 'нет'), w - 20, 9), x + 10, y + 234, { size: 9, col: ei ? C.cream : C.dim });
        },
        drawStats(c) {
          const x = 220, y = 130, w = 196;
          ui.win(x, y, w, 252, { title: 'Итог обороны' });
          const rows = [
            ['НР Экспресса', fmt(sum.base) + ' / ' + fmt(sum.baseMax)], ['Турели целы', sum.towers + ' из 3'], ['Время волн', mmss(sum.time)],
            ['Добивания', fmt(sum.kills)], ['Урон', fmt(sum.dmg)], ['Лечение', fmt(sum.heal)],
            ['Золото заработано', fmt(sum.gold)], ['Золото потрачено', fmt(sum.spent)], ['Золото с вылазок', fmt(sum.raid)],
            ['Быстрейший босс', sum.bossMin == null ? 'нет' : mmss(sum.bossMin)]
          ];
          rows.forEach(([a, b], i) => { ui.text(a, x + 12, y + 20 + i * 22, { size: 10, col: C.sub }); ui.text(b, x + w - 12, y + 20 + i * 22, { align: 'right', size: 10, bold: true, col: C.cream }); });
        },
        drawRecs(c) {
          const x = 428, y = 124, w = 196, h = 258;
          ui.hdCrt(c, x, y, w, h);
          ui.text('РЕКОРДЫ', x + w / 2, y + 8, { align: 'center', size: 12, bold: true, col: CRT.hi, shadow: false });
          ui.text(HD.DIFFS[sum.diff].name, x + w / 2, y + 24, { align: 'center', size: 10, col: CRT.mid, shadow: false });
          ui.hdRecRows(c, recs, x + 6, y + 46, w - 12, 11, { place: M && !view ? M.place : 0, mark: M && !view ? M.rec : null, age: this.age, rh: 16 });
          if (M && !view && M.place) ui.text(M.place <= HD.META.recShow ? 'Новая запись: место ' + M.place : 'Место ' + M.place, x + w / 2, y + h - 18, { align: 'center', size: 10, bold: true, col: CRT.hi, shadow: false });
        },
        drawMeta(c) {
          const y = 392;
          if (view || !M) { ui.text('Запись из истории: награды за неё уже получены', W / 2, y + 16, { align: 'center', size: 11, col: C.sub }); return; }
          ui.hdMetaLine(c, M, y, 16);
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openHdRecords() {
      const ui = this, g = this.game, DIFF = Object.keys(HD.DIFFS), HEROES = [null].concat(Object.keys(HD.HEROES));
      return this.push({
        full: true, hd: true, recs: true, d: 1, h: 0, tab: 0,
        setTab(i) { if (this.tab !== i) { this.tab = i; ui.sfx('select'); } },
        draw(c) {
          c.fillStyle = '#050608'; c.fillRect(0, 0, W, HGT);
          ui.hdCrt(c, 24, 24, W - 48, HGT - 80);
          ui.text('ТАБЛИЦА РЕКОРДОВ', W / 2, 36, { align: 'center', size: 16, bold: true, col: CRT.hi, shadow: false });
          ['Один игрок', 'Экипаж'].forEach((t, i) => {
            const on = i === this.tab, tx = 36 + i * 76;
            ui.text((on ? '[' : '') + t + (on ? ']' : ''), tx + 36, 40, { align: 'center', size: 10, bold: on, col: on ? CRT.hi : CRT.mid, shadow: false });
            ui.hit(tx, 34, 72, 18, () => this.setTab(i));
          });
          DIFF.forEach((d, i) => {
            const tx = W / 2 - 150 + i * 100, on = i === this.d;
            ui.text((on ? '[ ' : '') + HD.DIFFS[d].name + (on ? ' ]' : ''), tx + 50, 62, { align: 'center', size: 11, bold: on, col: on ? CRT.hi : CRT.mid, shadow: false });
            ui.hit(tx, 58, 100, 18, () => { this.d = i; ui.sfx('select'); });
          });
          const hero = HEROES[this.h];
          ui.text('Герой: ' + (hero ? H.CHARS[hero].name : 'все'), W / 2, 82, { align: 'center', size: 11, col: CRT.fg, shadow: false });
          const y = 108;
          (this.tab ? [['№', 40], ['Экипаж', 60], ['Волна', W - 220], ['Время', W - 180], ['Звёзды', W - 140]] : [['№', 40], ['Ник', 60], ['Герой', 162], ['Волна', W - 220], ['Время', W - 180], ['Звёзды', W - 140]]).forEach(([t, x]) => ui.text(t, x, y, { size: 10, col: CRT.dim, shadow: false }));
          ui.text('Дата', W - 42, y, { align: 'right', size: 10, col: CRT.dim, shadow: false });
          c.fillStyle = CRT.dim; c.fillRect(36, y + 14, W - 72, 1);
          ui.hdRecRows(c, this.tab ? g.hdCrewRecords(DIFF[this.d], hero) : g.hdRecords(DIFF[this.d], hero), 36, y + 22, W - 72, 16, { wide: true, rh: 18, crew: !!this.tab });
          ui.hints([['Q E', 'Таблица'], ['←→', 'Сложность'], ['↑↓', 'Герой'], ['Esc', 'Назад']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k, code) {
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(1 - this.tab); return; }
          if (k === 'left' || k === 'right') { this.d = (this.d + (k === 'left' ? DIFF.length - 1 : 1)) % DIFF.length; ui.sfx('select'); return; }
          if (k === 'up' || k === 'down') { this.h = (this.h + (k === 'up' ? HEROES.length - 1 : 1)) % HEROES.length; ui.sfx('select'); return; }
          if (k === 'back' || k === 'ok') ui.pop();
        }
      });
    },

    openHdAsc() {
      const ui = this, g = this.game, P = HD.META;
      return this.push({
        full: true, hd: true, asc: true, sel: Math.max(1, Math.min(P.ascMax, g.hdAscLvl() || 1)),
        claim() { const lines = g.hdClaimAsc(this.sel); ui.cwClaimSay(lines); },
        draw(c) {
          const D = g.hd(), lv = g.hdAscLvl();
          const gr = c.createLinearGradient(0, 0, 0, HGT); gr.addColorStop(0, '#0c0a18'); gr.addColorStop(1, '#04040a');
          c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
          ui.plate(16, 14, 'Продвижение Рубежа');
          ui.text('Уровень ' + lv + ' из ' + P.ascMax, W / 2, 60, { align: 'center', size: 18, bold: true, serif: true, col: C.gold });
          ui.text(lv >= P.ascMax ? 'Все уровни пройдены' : fmt(D.asc.pts % P.ascPer) + ' / ' + P.ascPer + ' очков до уровня ' + (lv + 1), W / 2, 88, { align: 'center', size: 11, col: C.sub });
          ui.bar(W / 2 - 150, 106, 300, 5, lv >= P.ascMax ? 1 : (D.asc.pts % P.ascPer) / P.ascPer, '#ffd471');
          const first = Math.max(1, Math.min(P.ascMax - 6, this.sel - 3)), y = 190;
          c.fillStyle = '#5a5a6a'; c.fillRect(0, y + 64, W, 3); c.fillRect(0, y + 80, W, 3);
          for (let x = (-(first * 13) % 22 + 22) % 22 - 22; x < W; x += 22) { c.fillStyle = '#4a3220'; c.fillRect(x, y + 60, 10, 28); }
          for (let i = 0; i < 7; i++) {
            const l = first + i, x = 22 + i * 86, R = P.asc[l], got = D.asc.got.includes(l), ready = l <= lv && !got, on = l === this.sel;
            c.fillStyle = got ? '#16241a' : ready ? '#3a2a08' : '#10142c'; c.fillRect(x, y, 70, 52);
            c.strokeStyle = on ? '#ffffff' : ready ? '#ffd471' : '#2a3460'; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, 69, 51); c.lineWidth = 1;
            ui.text('Ур. ' + l, x + 35, y + 4, { align: 'center', size: 10, bold: true, col: l <= lv ? C.cream : C.dim });
            const id = R && R.items ? Object.keys(R.items)[0] : null;
            if (id) G.itemIcon(c, id, x + 23, y + 18, 24);
            else ui.text(R && R.plate ? 'Плашка' : R && R.jade ? 'Нефрит' : 'Кредиты', x + 35, y + 26, { align: 'center', size: 9, bold: true, col: '#ffd471' });
            if (got) ui.text('получено', x + 35, y + 40, { align: 'center', size: 8, col: C.ok });
            c.fillStyle = l <= lv ? '#ffd471' : '#3a3a4a'; c.fillRect(x + 31, y + 66, 8, 12);
            ui.hit(x, y, 70, 52, () => { if (this.sel === l) this.claim(); else { this.sel = l; ui.sfx('select'); } });
          }
          const R = P.asc[this.sel], got = D.asc.got.includes(this.sel);
          ui.win(80, 320, W - 160, 78, { title: 'Уровень ' + this.sel });
          ui.text(ui.clip(ui.cwRewardText(R), W - 200, 12, true), W / 2, 344, { align: 'center', size: 12, bold: true, col: C.gold });
          ui.text(got ? 'Награда получена' : this.sel <= lv ? 'Enter: забрать награду' : 'Нужен уровень ' + this.sel, W / 2, 366, { align: 'center', size: 11, col: got ? C.ok : this.sel <= lv ? C.cream : C.dim });
          if (D.plate) ui.text('Плашка на автомате: «' + D.plate + '»', W / 2, 410, { align: 'center', size: 11, col: C.ok });
          ui.text('Очки: победа ' + fmt(P.ascWin.easy) + ' / ' + fmt(P.ascWin.normal) + ' / ' + fmt(P.ascWin.hard) + ' по сложностям, поражение половина за пройденные волны', W / 2, 430, { align: 'center', size: 9, col: C.dim });
          ui.hints([['←→', 'Уровень'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = Math.max(1, Math.min(P.ascMax, this.sel + (k === 'left' ? -1 : 1))); ui.sfx('select'); return; }
          if (k === 'ok') { this.claim(); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openHdWeek() {
      const ui = this, g = this.game, P = HD.META;
      return this.push({
        full: true, hd: true, week: true, sel: 0,
        draw(c) {
          const D = g.hd();
          c.fillStyle = '#06070c'; c.fillRect(0, 0, W, HGT);
          ui.plate(16, 14, 'Недельные очки');
          const left = g.hdWeekLeft(), hh = Math.floor(left / 3600000), mm = Math.floor(left / 60000) % 60, ss = Math.floor(left / 1000) % 60;
          ui.text('Новая неделя через ' + hh + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'), W - 16, 20, { align: 'right', size: 11, col: C.sub });
          const gx = 40, gy = 64, gh = 360;
          c.fillStyle = '#0e1230'; c.fillRect(gx, gy, 14, gh);
          const k = Math.min(1, D.week.pts / P.weekMax);
          c.fillStyle = '#80e0ff'; c.fillRect(gx, gy + gh * (1 - k), 14, gh * k);
          c.strokeStyle = '#3a4a80'; c.strokeRect(gx + 0.5, gy + 0.5, 13, gh - 1);
          ui.text(fmt(D.week.pts), gx + 7, gy + gh + 6, { align: 'center', size: 10, bold: true, col: '#80e0ff' });
          P.week.forEach(([need, R], i) => {
            const y = gy + gh - (i + 1) * 36, on = i === this.sel, reach = D.week.pts >= need, got = D.week.got.includes(i);
            c.fillStyle = on ? 'rgba(242,220,154,0.14)' : 'rgba(10,14,40,0.8)'; c.fillRect(72, y, W - 112, 32);
            c.fillStyle = got ? '#3a7a4a' : reach ? '#ffd471' : '#2a2a3a'; c.beginPath(); c.arc(90, y + 16, 7, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#3a4a80'; c.fillRect(gx + 14, y + 16, 58 - gx + 4, 1);
            ui.text(fmt(need), 108, y + 9, { size: 11, bold: true, col: reach ? C.cream : C.dim });
            ui.text(ui.clip(ui.cwRewardText(R), 300, 11), 176, y + 9, { size: 11, col: reach ? C.gold : C.sub });
            ui.text(got ? 'получено' : reach ? 'Enter' : '', W - 52, y + 9, { align: 'right', size: 10, bold: true, col: got ? C.ok : '#ffd471' });
            ui.hit(72, y, W - 112, 32, () => { if (this.sel === i) ui.cwClaimSay(g.hdClaimWeek(i)); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.text('Пройденная волна ' + fmt(P.weekWave) + ', победа сразу ' + fmt(P.weekWin) + '; за неделю не больше ' + fmt(P.weekMax), W / 2, HGT - 40, { align: 'center', size: 9, col: C.dim });
          ui.hints([['↑↓', 'Ступень'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 20, { align: 'center' });
        },
        key(k) {
          const n = P.week.length;
          if (k === 'up') { this.sel = (this.sel + 1) % n; ui.sfx('select'); return; }
          if (k === 'down') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); return; }
          if (k === 'ok') { ui.cwClaimSay(g.hdClaimWeek(this.sel)); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openHdTrials() {
      const ui = this, g = this.game, T = HD.TRIALS, HEROS = T.filter(t => t.kind === 'hero'), REST = T.filter(t => t.kind !== 'hero'), COLS = 7;
      return this.push({
        full: true, hd: true, trials: true, sel: 0,
        draw(c) {
          const D = g.hd(), state = t => (D.trials.got.includes(t.id) ? 'got' : D.trials.done.includes(t.id) ? 'ready' : 'open');
          c.fillStyle = '#07060f'; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          ui.plate(16, 14, 'Испытания Рубежа');
          ui.text('За каждое: ' + HD.META.trial.jade + ' нефрита и ' + HD.META.trial.asc + ' очков продвижения · выполнено ' + D.trials.done.length + ' из ' + T.length, W - 16, 20, { align: 'right', size: 10, col: C.sub });
          ui.text('Победа каждым героем', 20, 48, { size: 11, bold: true, col: C.gold });
          HEROS.forEach((t, i) => {
            const x = 20 + (i % COLS) * 86, y = 66 + Math.floor(i / COLS) * 70, st = state(t), on = i === this.sel;
            c.fillStyle = st === 'got' ? '#12201a' : st === 'ready' ? '#2e2208' : '#0e1230'; c.fillRect(x, y, 80, 64);
            c.strokeStyle = on ? '#ffffff' : st === 'ready' ? '#ffd471' : '#2a3460'; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, 79, 63); c.lineWidth = 1;
            G.drawBust(c, G.lookOf(t.hero, g), x + 20, y + 2, 0.6);
            if (st === 'open') { c.fillStyle = 'rgba(4,4,12,0.55)'; c.fillRect(x + 1, y + 1, 78, 62); }
            ui.text(ui.clip(H.CHARS[t.hero].name, 76, 9), x + 40, y + 50, { align: 'center', size: 9, col: st === 'open' ? C.dim : C.cream });
            if (st !== 'open') ui.text(st === 'got' ? '✓' : '!', x + 72, y + 4, { align: 'right', size: 12, bold: true, col: st === 'got' ? C.ok : '#ffd471' });
            ui.hit(x, y, 80, 64, () => this.pick(i));
          });
          const ly = 66 + Math.ceil(HEROS.length / COLS) * 70 + 8;
          ui.text('Другие испытания', 20, ly, { size: 11, bold: true, col: C.gold });
          REST.forEach((t, j) => {
            const i = HEROS.length + j, x = 20 + (j % 2) * 304, y = ly + 18 + Math.floor(j / 2) * 22, st = state(t), on = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.16)' : 'rgba(10,14,40,0.8)'; c.fillRect(x, y, 296, 20);
            ui.text(st === 'got' ? '✓' : st === 'ready' ? '!' : '·', x + 8, y + 4, { size: 11, bold: true, col: st === 'got' ? C.ok : st === 'ready' ? '#ffd471' : C.dim });
            ui.text(ui.clip(t.name, 260, 10), x + 24, y + 4, { size: 10, col: st === 'open' ? C.sub : C.cream });
            ui.hit(x, y, 296, 20, () => this.pick(i));
          });
          ui.hints([['←→↑↓', 'Выбор'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 20, { align: 'center' });
        },
        pick(i) { if (this.sel === i) this.claim(); else { this.sel = i; ui.sfx('select'); } },
        claim() { ui.cwClaimSay(g.hdClaimTrial(HEROS.concat(REST)[this.sel].id)); },
        key(k) {
          const nh = HEROS.length, n = T.length, s = this.sel;
          if (k === 'left' || k === 'right') { this.sel = (s + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
          if (k === 'up') { this.sel = s < nh ? (s >= COLS ? s - COLS : s) : s - 2 >= nh ? s - 2 : nh - 1; ui.sfx('select'); return; }
          if (k === 'down') { this.sel = s < nh ? (s + COLS < nh ? s + COLS : nh) : Math.min(n - 1, s + 2); ui.sfx('select'); return; }
          if (k === 'ok') { this.claim(); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openHdHistory() {
      const ui = this, g = this.game;
      return this.push({
        full: true, hd: true, hist: true, sel: 0,
        draw(c) {
          const L = g.hd().hist;
          c.fillStyle = '#06060c'; c.fillRect(0, 0, W, HGT);
          ui.plate(16, 14, 'История партий');
          ui.text('Последние ' + HD.META.hist + ' партий · Enter открывает итог', W - 16, 20, { align: 'right', size: 10, col: C.sub });
          const y = 52, cols = [['Дата', 20], ['Сложность', 104], ['Герой', 196], ['Волна', 352], ['Итог', 404], ['Экспресс', 500], ['Звёзды', 572]];
          cols.forEach(([t, x]) => ui.text(t, x, y, { size: 10, col: C.dim }));
          c.fillStyle = '#3a3060'; c.fillRect(16, y + 14, W - 32, 1);
          if (!L.length) ui.text('Партий ещё не было', W / 2, y + 40, { align: 'center', size: 11, col: C.sub });
          L.forEach((r, i) => {
            const yy = y + 20 + i * 19, on = i === this.sel;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.14)'; c.fillRect(16, yy - 2, W - 32, 18); }
            const col = r.win ? C.cream : '#e0a0a0';
            ui.text(dateOf(r.date), 20, yy, { size: 10, col: C.sub });
            ui.text(HD.DIFFS[r.diff].name, 104, yy, { size: 10, col });
            ui.text(ui.clip(H.CHARS[r.hero].name + (r.crew ? ' · экипаж' : ''), 150, 10), 196, yy, { size: 10, col });
            ui.text(String(r.wave), 352, yy, { size: 10, col });
            ui.text(r.win ? 'удержан' : 'пал', 404, yy, { size: 10, bold: true, col: r.win ? C.ok : C.bad });
            ui.text(fmt(r.base), 500, yy, { size: 10, col });
            ui.hdStars(c, 580, yy + 6, r.stars || 0, 5);
            ui.hit(16, yy - 2, W - 32, 18, () => { if (this.sel === i) this.open(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['↑↓', 'Партия'], ['Enter', 'Итог'], ['Esc', 'Назад']], W / 2, HGT - 20, { align: 'center' });
        },
        open() { const r = g.hd().hist[this.sel]; if (r && r.sum) ui.openHdResult(r.sum, true); else ui.sfx('deny'); },
        key(k) {
          const n = g.hd().hist.length;
          if (ui.listNav(this, k, n)) return;
          if (k === 'ok') { this.open(); return; }
          if (k === 'back') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
