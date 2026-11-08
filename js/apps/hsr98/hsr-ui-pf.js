(function (H) {
  'use strict';
  const G = H.Gfx, PF = H.PF, TUN = PF.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const NODE_MAX = 40000, STAR_START = 0.3, STAR_STEP = 0.35, BREAK_TIME = 1.4, VIGN = { x: 296, step: 16, out: 10, in: 6 };

  Object.assign(H.UI.prototype, {
    openUi_pf() { this.openPfEntry(() => this.finishPending()); },

    openPfEntry(close) {
      const g = this.game, why = g.pfBlocked();
      if (why) { this.sfx('deny'); this.toast(why); close(); return; }
      g.pfSync();
      if (g.pf().run) { this.openPfResume(close); return; }
      this.openPfMap(close);
      this.pfFirstVisit();
    },

    pfTurned(close) {
      this.screens = this.screens.filter(s => !s.pf);
      this.openPfMap(close);
      this.pfFirstVisit();
    },

    pfPaid(got) {
      if (!got || !got.length) { this.sfx('deny'); return; }
      this.sfx('chest');
      this.toast('Получено: ' + got.join(', '));
    },

    guidePfView(c, p) {
      const ui = this, g = this.game, b = ui.guideStage(c, cc => cc.drawImage(G.bgCanvas('pf', W, HGT), 50, 0));
      c.fillStyle = 'rgba(4,6,30,0.62)'; c.fillRect(b.x, b.y, b.w, b.h);
      if (!p.name || !p.open) {
        ui.wrap(p.why, b.w - 48, 12).forEach((l, i) => ui.text(l, b.x + b.w / 2, b.y + 140 + i * 17, { align: 'center', size: 12, col: C.cream }));
        return;
      }
      G.pfShield(c, p.shield, b.x + 12, b.y + 10, 2);
      const nameLines = ui.wrap(p.name, b.w - 92, 15, true, true), infoY = b.y + 14 + nameLines.length * 18 + 4;
      nameLines.forEach((l, i) => ui.text(l, b.x + b.w - 14, b.y + 12 + i * 18, { align: 'right', size: 15, bold: true, serif: true, col: C.gold }));
      ui.text('Нелепость: ' + p.whim, b.x + b.w - 14, infoY - 4, { align: 'right', size: 10, col: C.cream });
      ui.text('До смены сезона ' + p.days + ' дн.', b.x + b.w - 14, infoY + 10, { align: 'right', size: 10, col: C.sub });
      const sw = b.w > 400 ? 128 : 67, sstep = b.w > 400 ? 136 : 71;
      p.stages.forEach((st, i) => {
        const x = b.x + 14 + i * sstep, y = b.y + 78;
        c.fillStyle = 'rgba(4,6,30,0.75)'; c.fillRect(x, y, sw, 44);
        c.strokeStyle = st.open ? '#7ac8ff' : '#3a4a78'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, sw - 1, 43);
        ui.text(String(st.n).padStart(2, '0'), x + sw / 2, y + 4, { align: 'center', size: 13, bold: true, serif: true, col: st.open ? '#e8f0ff' : C.dim });
        for (let k = 0; k < 3; k++) ui.fhStar(x + sw / 2 + (k - 1) * 18, y + 32, 6, st.stars > k);
      });
      ui.text('Награды за истории', b.x + 14, b.y + 134, { size: 11, bold: true, col: C.cream });
      p.tiers.forEach((tr, i) => {
        const x = b.x + 14 + (i % 6) * 36, y = b.y + 152 + Math.floor(i / 6) * 36, ready = tr.ready && !tr.got, col = tr.got ? '#6a8a6a' : ready ? '#ffd060' : '#4a5a88';
        c.fillStyle = ready ? 'rgba(255,208,96,' + (0.35 + 0.25 * Math.sin(ui.t * 5)).toFixed(3) + ')' : 'rgba(4,6,30,0.75)'; c.fillRect(x, y, 32, 32);
        c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, 31, 31);
        ui.text(tr.got ? '✓' : String(tr.need), x + 16, y + 9, { align: 'center', size: 11, bold: true, col });
      });
      const sx = b.x + (b.w > 400 ? 310 : 256);
      ui.fhStar(sx, b.y + 170, 12, p.stars > 0);
      ui.text(p.stars + ' / ' + p.total, sx, b.y + 188, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
      const fic = p.fictions.filter(f => f.got).length;
      ui.text('Награды за вымысел: ' + fic + ' из ' + p.fictions.length, b.x + 14, b.y + 232, { size: 10, col: C.cream });
      ui.text(p.due ? 'Можно забрать: ' + p.due : 'Новых наград нет', b.x + 14, b.y + 248, { size: 10, col: p.due ? C.gold : C.sub });
      ui.button(b.x + b.w - 130, b.y + 234, 116, 24, 'Забрать всё', () => ui.pfPaid(g.pfClaimAll()), { size: 11, disabled: !p.due, active: !!p.due });
      ui.text('Перья тратятся в лавке «Шутки сбываются».', b.x + 14, b.y + 278, { size: 10, col: C.sub });
      ui.guideShopBtn(c, b);
      ui.guideGoBig(c, b.x + 60, b.y + b.h - 40, b.w - 80, 'Перейти к Чистому вымыслу', () => ui.guideEnter(p), true);
    },

    pfFirstVisit() {
      const F = this.game.pf(), season = this.game.pfSeason(), lesson = () => { if (!F.tut) this.openPfTutorial(); };
      if (F.seen[season.id]) { lesson(); return; }
      F.seen[season.id] = true;
      this.openPfSplash(true, lesson);
    },

    pfVignette(c, season) {
      const g = this.game, edge = () => {
        c.beginPath();
        c.moveTo(0, 0);
        for (let y = 0, i = 0; y <= HGT + VIGN.step; y += VIGN.step, i++) c.lineTo(VIGN.x + (i % 2 ? VIGN.out : -VIGN.in), y);
        c.lineTo(0, HGT);
        c.closePath();
      };
      c.save();
      edge();
      c.clip();
      const gr = c.createLinearGradient(0, 0, 0, HGT);
      gr.addColorStop(0, '#1a2a78'); gr.addColorStop(0.6, '#10164a'); gr.addColorStop(1, '#080c2c');
      c.fillStyle = gr; c.fillRect(0, 0, VIGN.x + VIGN.out, HGT);
      if (!G.drawSplash(c, season.hero, g.state.gender, 150, 0, HGT, 1)) G.drawBust(c, G.lookOf(season.hero, g), 40, 130, 4);
      c.restore();
      edge();
      c.strokeStyle = '#3a7ad8'; c.lineWidth = 3; c.stroke();
      edge();
      c.strokeStyle = '#e8f0ff'; c.lineWidth = 1; c.stroke();
    },

    openPfSplash(first, then) {
      const ui = this, season = this.game.pfSeason(), list = season.caco, quote = first ? ui.wrap(PF.QUOTE, 306, 9) : [], whim = ui.wrap(season.whim.text, 306, 11);
      const done = () => { ui.screens.pop(); ui.sfx('cancel'); if (then) then(); };
      this.push({
        full: true, pf: true, splash: true, t: 0, sel: 0,
        tick(dt) { this.t += dt; },
        draw(c) {
          c.drawImage(G.bgCanvas('pf', W, HGT), 0, 0);
          c.fillStyle = 'rgba(4,6,30,0.88)'; c.fillRect(0, 0, W, HGT);
          ui.hit(0, 0, W, HGT, done);
          ui.pfVignette(c, season);
          for (let i = 0; i < 26; i++) {
            const x = G.hash(i, 3, 71) * 290, y = (G.hash(i, 5, 73) * HGT + this.t * (8 + G.hash(i, 7, 79) * 14)) % HGT;
            c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(this.t * 1.5 + i));
            c.fillStyle = i % 3 ? '#e8f0ff' : '#ffe08a'; c.fillRect(Math.round(x), Math.round(y), 2 + (i % 2), 2);
          }
          c.globalAlpha = 1;
          ui.plate(12, 10, 'Чистый вымысел');
          G.pfShield(c, season.id, 318, 28, 2);
          const nameLines = ui.wrap(season.name, W - 392, 19, true, true);
          nameLines.forEach((l, i) => ui.text(l, 382, 42 - (nameLines.length - 1) * 11 + i * 23, { size: 19, bold: true, serif: true, col: C.gold }));
          ui.text('Нелепость: ' + season.whim.name, 318, 100, { size: 12, bold: true, col: '#7ac8ff' });
          whim.forEach((l, i) => ui.text(l, 318, 118 + i * 14, { size: 11, col: C.cream }));
          const top = 122 + whim.length * 14;
          ui.text('Какофония', 318, top, { size: 12, bold: true, col: '#7ac8ff' });
          list.forEach((it, i) => {
            const x = 318 + i * 50, y = top + 18, on = i === this.sel;
            c.fillStyle = on ? 'rgba(122,200,255,0.25)' : 'rgba(4,6,20,0.7)'; c.fillRect(x, y, 42, 42);
            c.strokeStyle = on ? C.brassHi : '#3a4a78'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, 41, 41);
            G.pfIcon(c, it.id, x + 5, y + 5, 2);
            ui.hit(x, y, 42, 42, () => { this.sel = i; ui.sfx('select'); });
          });
          const it = list[this.sel];
          ui.text(it.name, 318, top + 66, { size: 11, bold: true, col: C.gold });
          ui.wrap(it.text, 306, 10).forEach((l, i) => ui.text(l, 318, top + 81 + i * 12, { size: 10, col: C.cream }));
          quote.forEach((l, i) => ui.text(l, 318, 400 + i * 11, { size: 9, col: C.sub }));
          ui.text('Нажмите на пустую область, чтобы закрыть', 471, 456, { align: 'center', size: 10, col: C.sub });
        },
        key(k) {
          if (k === 'left') { this.sel = (this.sel + list.length - 1) % list.length; ui.sfx('select'); }
          if (k === 'right') { this.sel = (this.sel + 1) % list.length; ui.sfx('select'); }
          if (k === 'ok' || k === 'back') done();
        }
      });
    },

    pfTutArrow(c, x0, x1, y) {
      const dir = x1 > x0 ? 1 : -1;
      c.fillStyle = '#ffe08a';
      c.fillRect(Math.min(x0, x1), y - 1, Math.abs(x1 - x0), 2);
      for (let i = 0; i < 5; i++) c.fillRect(x1 - dir * (i + 1), y - i, 1, i * 2 + 1);
    },

    pfTutScene(c, page, x, y, t) {
      const g = this.game;
      if (page === 0) {
        const ids = ['beetle', 'spider', 'windspawn', 'reaver', 'distorter'], loop = t % 2.4;
        ids.forEach((id, i) => {
          const cx = x + 54 + i * 88, data = Object.assign({}, H.ENEMIES[id], { pfGhost: true });
          if (i === 2) data.pfIn = Math.min(1, loop / 0.5);
          G.drawEnemy(c, data, cx, y + 124, 84, { t: t + i });
          c.fillStyle = 'rgba(122,200,255,0.25)'; c.fillRect(cx - 34, y + 128, 68, 3);
        });
        if (loop < 1.2) this.text('+500', x + 230, y + 30 - loop * 16, { align: 'center', size: 14, bold: true, col: C.gold });
        this.text('Новый враг встаёт на место павшего', x + 230, y + 140, { align: 'center', size: 11, col: C.sub });
        return;
      }
      if (page === 1) {
        const px = x + 80, rows = g.state.party.slice(0, 2).map(k => ({ kid: g.kitOf(k) })).concat(['beetle', 'spider', 'windspawn'].map(foe => ({ foe }))).slice(0, 4);
        rows.forEach((r, i) => {
          const ry = y + 2 + i * 38, size = 32;
          c.fillStyle = '#000'; c.fillRect(px - 1, ry - 1, size + 2, size + 2);
          if (r.kid) G.drawPortrait(c, G.lookOf(r.kid, g), px, ry, size);
          else G.foeIcon(c, H.ENEMIES[r.foe], px, ry, size, { border: false });
        });
        this.pfCyclePlate(c, px - 3, y + 2 + 2 * 38 - 9, 3, false, true);
        this.pfTutArrow(c, px + 110, px + 42, y + 2 + 2 * 38 - 4);
        this.text('Осталось циклов', px + 118, y + 2 + 2 * 38 - 11, { size: 12, bold: true, col: C.gold });
        return;
      }
      if (page === 2) {
        const px = x + 90, py = y + 20;
        this.pfPanel(c, px, py, { total: 29750, wave: 2, waves: 3, kills: 9, pool: 14, cyc: 2, cycles: 5, node: 1, starT: [0, 0, 0] });
        this.pfTutArrow(c, px + 150, px + 104, py + 61);
        this.text('Волна и побеждённые в ней', px + 158, py + 54, { size: 12, bold: true, col: C.gold });
        this.pfTutArrow(c, px + 150, px + 104, py + 24);
        this.text('Сумма этапа', px + 158, py + 17, { size: 12, bold: true, col: C.gold });
        return;
      }
      const sample = [22600, 37560];
      sample.forEach((v, i) => {
        const bx = x + 30 + i * 150;
        this.fhBox(bx, y + 30, 130, 60, '#7ac8ff');
        this.text('Узел ' + (i + 1), bx + 65, y + 38, { align: 'center', size: 12, bold: true, col: C.cream });
        this.text(H.fmt(v), bx + 65, y + 56, { align: 'center', size: 16, bold: true, serif: true, col: '#ffffff' });
      });
      this.text('+', x + 170, y + 50, { align: 'center', size: 18, bold: true, col: C.gold });
      this.text('=', x + 320, y + 50, { align: 'center', size: 18, bold: true, col: C.gold });
      this.text(H.fmt(sample[0] + sample[1]), x + 392, y + 48, { align: 'center', size: 22, bold: true, serif: true, col: C.gold });
      for (let i = 0; i < 3; i++) this.fhStar(x + 368 + i * 24, y + 90, 9, true);
    },

    openPfTutorial(then) {
      const ui = this, g = this.game, pages = PF.TUTORIAL;
      this.push({
        pf: true, lesson: true, page: 0, t: 0,
        tick(dt) { this.t += dt; },
        finish() { g.pf().tut = true; ui.screens.pop(); ui.sfx('confirm'); if (then) then(); },
        step(d) {
          const next = this.page + d;
          if (next >= pages.length) { this.finish(); return; }
          if (next >= 0) { this.page = next; ui.sfx('pfpage'); }
        },
        draw(c) {
          const x = 70, y = 40, w = 500, h = 390;
          c.fillStyle = 'rgba(2,3,12,0.8)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Беспощадные противники', border: '#7ac8ff' });
          ui.pfTutScene(c, this.page, x + 20, y + 24, this.t);
          ui.wrap(pages[this.page], w - 56, 12).forEach((l, i) => ui.text(l, x + 28, y + 196 + i * 16, { size: 12, col: C.cream }));
          pages.forEach((_, i) => ui.diamond(W / 2 - 24 + i * 16, y + h - 74, 4, i === this.page ? C.brassHi : '#3a4a78'));
          if (this.page > 0) ui.button(x + 28, y + h - 58, 160, 28, 'Назад', () => this.step(-1), { size: 12 });
          ui.button(x + w - 188, y + h - 58, 160, 28, this.page === pages.length - 1 ? 'Понятно' : 'Дальше', () => this.step(1), { active: true, bold: true });
          ui.hints([['←→', 'Страница'], ['Enter', 'Дальше']], W / 2, y + h - 22, { align: 'center' });
        },
        key(k) {
          if (k === 'left') this.step(-1);
          if (k === 'right' || k === 'ok') this.step(1);
          if (k === 'back') this.finish();
        }
      });
    },

    openPfRules() {
      const ui = this, season = this.game.pfSeason(), pages = PF.rulesPages(season), quote = ui.wrap(PF.QUOTE, 560, 10), SHOW = 21, ROW_H = 14;
      const linesOf = page => {
        const out = [];
        page.blocks.forEach((b, i) => {
          const before = page.blocks[i - 1];
          if (b.h) { if (out.length) out.push({ text: '' }); out.push({ text: '◆ ' + b.h + ' ◆', head: true }); return; }
          if (before && before.p && !b.p.startsWith('●')) out.push({ text: '' });
          ui.wrap(b.p, 556, 11).forEach(text => out.push({ text, gold: b.col === 'gold' }));
        });
        return out;
      };
      this.push({
        full: true, pf: true, rules: true, tab: 0, sc: { top: 0 },
        setTab(i) { if (i !== this.tab) { this.tab = i; this.sc.top = 0; ui.sfx('pfpage'); } },
        draw(c) {
          c.fillStyle = '#060a22'; c.fillRect(0, 0, W, HGT);
          ui.win(16, 10, 608, 448, { title: 'Правила', border: '#7ac8ff' });
          ui.closeBtn(W - 46, 18, () => this.key('back'));
          quote.forEach((l, i) => ui.text(l, 34, 32 + i * 12, { size: 10, col: C.sub }));
          pages.forEach((p, i) => ui.button(34 + i * 190, 64, 184, 22, p.tab, () => this.setTab(i), { active: i === this.tab, size: 11, bold: i === this.tab }));
          const lines = linesOf(pages[this.tab]);
          this.sc.top = Math.max(0, Math.min(this.sc.top, Math.max(0, lines.length - SHOW)));
          lines.slice(this.sc.top, this.sc.top + SHOW).forEach((l, i) => ui.text(l.text, 34, 96 + i * ROW_H, { size: 11, bold: !!l.head, col: l.head ? C.gold : l.gold ? '#ffe9b0' : C.cream }));
          if (lines.length > SHOW) ui.scrollBar(602, 96, SHOW * ROW_H, this.sc, lines.length, SHOW);
          ui.wheelZone(34, 96, 570, SHOW * ROW_H, d => { this.sc.top += d * 2; });
          ui.button(34, 400, 150, 24, 'Обучение', () => ui.openPfTutorial(), { size: 11 });
          ui.hints([['Tab', 'Вкладка'], ['↑↓', 'Прокрутка'], ['T', 'Обучение'], ['Esc', 'Назад']], W / 2, 432, { align: 'center' });
        },
        key(k, code) {
          if (code === 'Tab' || k === 'right') { this.setTab((this.tab + 1) % pages.length); return; }
          if (k === 'left') { this.setTab((this.tab + pages.length - 1) % pages.length); return; }
          if (code === 'KeyT') { ui.openPfTutorial(); return; }
          if (k === 'up') this.sc.top -= 2;
          if (k === 'down') this.sc.top += 2;
          if (k === 'back') ui.pop();
        }
      });
    },

    pfStarsOf(total) { return TUN.stars.filter(v => total >= v).length; },

    pfStartRun(n, close) {
      const g = this.game;
      if (g.pfSync()) { this.pfTurned(close); return; }
      if (!g.pfOpen(n)) { this.sfx('deny'); this.toast('Сначала пройдите предыдущий этап.'); return; }
      if (!g.pfBegin(n)) { this.sfx('deny'); this.toast('В каждом узле нужен хотя бы один герой.'); return; }
      this.pfEnterNode(close);
    },

    pfEnterNode(close) {
      const g = this.game, n = g.pf().run.n;
      this.screens = this.screens.filter(s => !s.pf);
      if (close) close();
      if (g.pfFight()) { this.drainGameEvents(); return; }
      g.pfLeave();
      this.sfx('deny');
      this.toast('В узле не осталось героев.');
      this.openPfMap(null, n);
      this.openPfTeam(n);
    },

    openPfResume(close) {
      const ui = this, g = this.game, run = g.pf().run;
      const acts = [
        { label: 'Продолжить', fn: () => ui.pfEnterNode(close) },
        { label: 'Начать заново', fn: () => { g.pfLeave(); ui.screens = ui.screens.filter(s => !s.pf); ui.openPfMap(close, run.n); ui.openPfTeam(run.n, close); } }
      ];
      this.sfx('confirm');
      this.push({
        pf: true, sel: 0,
        draw(c) {
          const x = W / 2 - 190, y = 150, w = 380, h = 164;
          c.fillStyle = '#060a22'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Незавершённая история', border: '#7ac8ff' });
          ui.text('Этап ' + run.n + ', узел ' + (run.node + 1), W / 2, y + 26, { align: 'center', size: 13, bold: true, col: C.gold });
          ui.text(run.node ? 'Очки прошлого узла: ' + H.fmt(run.scores[0]) : 'Узел начнётся заново.', W / 2, y + 46, { align: 'center', size: 11, col: C.cream });
          acts.forEach((a, i) => ui.button(W / 2 - 160 + i * 164, y + 76, 156, 30, a.label, a.fn, { active: i === this.sel, bold: i === 0 }));
          ui.hints([['←→', 'Выбор'], ['Enter', 'Принять'], ['Esc', 'Позже']], W / 2, y + 124, { align: 'center' });
          ui.closeBtn(x + w - 30, y + 8, () => this.key('back'));
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') acts[this.sel].fn();
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    },

    openPfStage(info) {
      const ui = this, g = this.game, n = info.n, next = g.pfOpen(n + 1) ? n + 1 : null;
      const leave = () => { ui.screens = ui.screens.filter(s => !s.pf); };
      const then = fn => () => {
        leave();
        if (g.pfAfterDue(n)) { g.runScript('pf_after'); return; }
        fn();
      };
      const acts = [];
      if (next) acts.push({ label: 'Этап ' + next, fn: then(() => { ui.openPfMap(null, next); ui.openPfTeam(next); }) });
      acts.push({ label: 'Повторить этап', fn: then(() => ui.pfStartRun(n)) });
      acts.push({ label: 'К карте', out: true, fn: then(() => ui.openPfMap(null, n)) });
      this.push({
        full: true, pf: true, stage: true, t: 0, sel: 0, rung: 0,
        tick(dt) {
          this.t += dt;
          while (this.rung < info.stars.length && this.t >= STAR_START + this.rung * STAR_STEP) {
            if (info.stars[this.rung]) ui.sfx('pfstar');
            this.rung++;
          }
        },
        draw(c) {
          c.drawImage(G.bgCanvas('pf', W, HGT), 0, 0);
          c.fillStyle = 'rgba(4,6,30,0.8)'; c.fillRect(0, 0, W, HGT);
          ui.text('Этап ' + n + ': итог', W / 2, 22, { align: 'center', size: 24, bold: true, serif: true, col: C.gold });
          ui.text('На этом заканчивается наша история.', W / 2, 56, { align: 'center', size: 12, col: C.sub });
          info.scores.forEach((v, i) => {
            const y = 84 + i * 26;
            ui.text('Узел ' + (i + 1), 116, y, { size: 12, col: C.cream });
            ui.bar(176, y + 3, 250, 9, Math.min(1, v / NODE_MAX), v >= NODE_MAX ? C.gold : '#7ac8ff');
            ui.text(H.fmt(v) + ' / ' + H.fmt(NODE_MAX), 524, y, { align: 'right', size: 12, col: C.cream });
          });
          ui.text(H.fmt(info.total), W / 2, 140, { align: 'center', size: 36, bold: true, serif: true, col: '#ffffff' });
          const line = info.beat ? (info.oldBest ? 'Новый рекорд! Прибавка ' + H.fmt(info.total - info.oldBest) : 'Первый результат записан') : 'Рекорд остался: ' + H.fmt(info.best);
          ui.text(line, W / 2, 188, { align: 'center', size: 13, bold: true, col: info.beat ? C.ok : C.cream });
          info.stars.forEach((on, i) => {
            const x = W / 2 - 110 + i * 110, a = Math.max(0, Math.min(1, (this.t - STAR_START - i * STAR_STEP) * 3));
            c.globalAlpha = on ? Math.max(0.25, a) : 1;
            ui.fhStar(x, 244, 22 + (on ? (1 - a) * 14 : 0), on);
            c.globalAlpha = 1;
            if (info.fresh[i] && a >= 1) ui.text('Новая!', x, 206, { align: 'center', size: 10, bold: true, col: C.ok });
            ui.text(H.fmt(TUN.stars[i]), x, 272, { align: 'center', size: 11, col: on ? C.gold : C.dim });
          });
          if (!info.clear) ui.text('Для прохождения нужно ' + H.fmt(TUN.clear) + ' очков. Не хватило ' + H.fmt(TUN.clear - info.total) + '.', W / 2, 304, { align: 'center', size: 12, bold: true, col: '#ffd471' });
          else ui.text(info.opened ? 'Открыт этап ' + (n + 1) + '.' : 'Этап пройден.', W / 2, 304, { align: 'center', size: 12, bold: true, col: C.ok });
          ui.text('Звёзд в сезоне: ' + g.pfStarTotal() + ' / 12', W / 2, 326, { align: 'center', size: 11, col: C.sub });
          const bw = 170, left = W / 2 - (acts.length * bw + (acts.length - 1) * 8) / 2;
          acts.forEach((a, i) => ui.button(left + i * (bw + 8), 362, bw, 30, a.label, a.fn, { active: i === this.sel, bold: i === 0 }));
          ui.hints([['←→', 'Кнопка'], ['Enter', 'Выбрать'], ['Esc', 'К карте']], W / 2, HGT - 28, { align: 'center' });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? acts.length - 1 : 1)) % acts.length; ui.sfx('select'); }
          if (k === 'ok') acts[this.sel].fn();
          if (k === 'back') acts.find(a => a.out).fn();
        }
      });
    },

    openPfRewards() {
      const ui = this, g = this.game;
      this.push({
        pf: true, rewards: true, tab: 0,
        setTab(i) { if (this.tab !== i) { this.tab = i; ui.sfx('pfpage'); } },
        drawStars(c, x, y) {
          g.pfTiers().forEach((tier, i) => {
            const cx = x + (i % 6) * 88, cy = y + Math.floor(i / 6) * 124, ready = tier.ready && !tier.got;
            c.fillStyle = ready ? 'rgba(255,224,138,' + (0.16 + 0.1 * Math.sin(ui.t * 5)).toFixed(3) + ')' : 'rgba(8,10,30,0.8)'; c.fillRect(cx, cy, 84, 116);
            c.strokeStyle = ready ? '#ffe08a' : '#3a4a78'; c.lineWidth = 1; c.strokeRect(cx + 0.5, cy + 0.5, 83, 115);
            ui.fhStar(cx + 12, cy + 12, 6, tier.ready);
            ui.text(String(tier.need), cx + 22, cy + 5, { size: 12, bold: true, col: tier.ready ? C.gold : C.sub });
            const cells = [['jade', tier.jade], ['credits', tier.credits]].concat(tier.feather ? [['feather', tier.feather]] : []);
            cells.forEach(([id, count], k) => ui.rewardCell(c, id, count, cx + 3 + (k % 2) * 40, cy + 26 + Math.floor(k / 2) * 44, 38));
            if (tier.got) {
              c.fillStyle = 'rgba(4,6,20,0.68)'; c.fillRect(cx + 1, cy + 1, 82, 114);
              ui.text('Получено', cx + 42, cy + 52, { align: 'center', size: 11, bold: true, col: C.ok });
            }
            ui.hit(cx, cy, 84, 116, () => ui.pfPaid(g.pfClaimTier(tier.need)));
          });
        },
        drawFiction(c, x, y) {
          const cells = Object.entries(PF.FICTION);
          g.pfFictions().forEach((s, i) => {
            const ry = y + i * 60, done = s.ready;
            c.fillStyle = done ? 'rgba(122,200,255,0.14)' : 'rgba(8,10,30,0.8)'; c.fillRect(x, ry, 524, 54);
            c.strokeStyle = done ? '#7ac8ff' : '#3a4a78'; c.lineWidth = 1; c.strokeRect(x + 0.5, ry + 0.5, 523, 53);
            ui.text('Этап ' + s.n, x + 12, ry + 8, { size: 13, bold: true, serif: true, col: done ? C.gold : C.cream });
            ui.text(done ? 'Пройден' : 'Не пройден', x + 12, ry + 30, { size: 10, col: done ? C.ok : C.sub });
            cells.forEach(([id, count], k) => ui.rewardCell(c, id, count, x + 96 + k * 46, ry + 6, 42));
            ui.button(x + 412, ry + 14, 100, 26, s.got ? 'Получено' : 'Забрать', () => ui.pfPaid(g.pfClaimFiction(s.n)), { size: 11, disabled: !done || s.got, active: done && !s.got });
          });
        },
        draw(c) {
          const x = 46, y = 30, w = 548, h = 410;
          c.fillStyle = 'rgba(2,3,12,0.72)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Награды', border: '#7ac8ff' });
          ui.closeBtn(x + w - 30, y + 8, () => this.key('back'));
          ui.fhStar(x + 22, y + 34, 7, true);
          ui.text(g.pfStarTotal() + ' / 12', x + 34, y + 26, { size: 13, bold: true, col: C.gold });
          ui.text('До смены сезона ' + g.pfDaysLeft() + ' дн.', x + w - 44, y + 28, { align: 'right', size: 11, col: C.sub });
          ['Награды за истории', 'Награды за вымысел'].forEach((label, i) => ui.button(x + 12 + i * 186, y + 48, 180, 24, label, () => this.setTab(i), { active: i === this.tab, size: 11, bold: i === this.tab }));
          ui.button(x + w - 144, y + 48, 132, 24, 'Забрать всё', () => ui.pfPaid(g.pfClaimAll()), { size: 11, disabled: !g.pfDue() });
          if (this.tab === 0) this.drawStars(c, x + 12, y + 82);
          else this.drawFiction(c, x + 12, y + 82);
          ui.hints([['Tab', 'Вкладка'], ['C', 'Забрать всё'], ['Esc', 'Назад']], W / 2, y + h - 22, { align: 'center' });
        },
        key(k, code) {
          if (code === 'Tab' || k === 'left' || k === 'right') { this.setTab(1 - this.tab); return; }
          if (code === 'KeyC') { ui.pfPaid(g.pfClaimAll()); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openPfMap(close, n) {
      const ui = this, g = this.game, season = g.pfSeason(), stages = season.stages;
      close = close || (() => {});
      this.push({
        pf: true, full: true, map: true, sel: (n || g.pfFirstStage()) - 1, t: 0, breaking: null,
        tick(dt) {
          this.t += dt;
          const F = g.pf();
          if (this.breaking) {
            this.breaking.t += dt;
            if (this.breaking.t >= BREAK_TIME) { F.free[this.breaking.n] = true; this.breaking = null; }
            return;
          }
          const next = stages.find(s => g.pfStars(s.n) === 3 && !F.free[s.n]);
          if (next) { this.breaking = { n: next.n, t: 0 }; ui.sfx('pfchain'); }
        },
        enter(i) {
          const s = stages[i].n;
          this.sel = i;
          if (!g.pfOpen(s)) { ui.sfx('deny'); ui.toast('Пройдите этап ' + (s - 1)); return; }
          ui.openPfTeam(s, close);
        },
        step(d) {
          this.sel = (this.sel + d + stages.length) % stages.length;
          ui.sfx('select');
        },
        drawPlate(c, st, i) {
          const [px, py] = H.PFMap.placeOf(i), on = i === this.sel, x = Math.round(px - 58), y = Math.round(py - 96), w = 116, h = 40, col = on ? '#e8f0ff' : st.open ? 'rgba(122,200,255,0.55)' : 'rgba(90,100,130,0.5)';
          ui.fhBox(x, y, w, h, col);
          ui.text(String(st.n).padStart(2, '0'), x + 8, y + 4, { size: 15, bold: true, serif: true, col: !st.open ? C.dim : on ? C.gold : '#e8f0ff' });
          if (!st.open) {
            c.fillStyle = '#8a94a8'; c.fillRect(x + 48, y + 10, 12, 9); c.fillStyle = '#060a22'; c.fillRect(x + 53, y + 13, 2, 3);
            c.strokeStyle = '#8a94a8'; c.lineWidth = 2; c.strokeRect(x + 50.5, y + 5, 7, 6); c.lineWidth = 1;
            ui.text('Пройдите этап ' + (st.n - 1), x + w / 2, y + 24, { align: 'center', size: 10, col: C.dim });
            return;
          }
          for (let k = 0; k < 3; k++) ui.fhStar(x + 52 + k * 20, y + 12, 7, st.stars > k);
          ui.text(st.quick ? 'По прошлому сезону' : st.best ? 'Счёт ' + H.fmt(st.best) : 'Нет результата', x + w / 2, y + 24, { align: 'center', size: 10, col: st.quick ? C.gold : st.best ? C.cream : C.sub });
        },
        draw(c) {
          const list = g.pfMapInfo().map(st => Object.assign(st, this.breaking && this.breaking.n === st.n ? { free: true, breaking: true, breakT: this.breaking.t } : {}));
          H.PFMap.draw(c, W, HGT, { sel: this.sel, stages: list }, this.t);
          list.forEach((st, i) => {
            const [px, py] = H.PFMap.placeOf(i);
            ui.hit(px - 66, py - 96, 132, 164, () => this.enter(i));
          });
          list.forEach((st, i) => this.drawPlate(c, st, i));

          G.pfShield(c, season.id, 10, 8, 2);
          ui.text('Чистый вымысел', 72, 10, { size: 18, bold: true, serif: true, col: '#e8f0ff' });
          const nameW = ui.measure(season.name + ' ›', 13, true);
          ui.text(season.name + ' ›', 72, 36, { size: 13, bold: true, col: C.gold });
          ui.hit(70, 34, nameW + 6, 18, () => ui.openPfSplash(false));
          ui.text('До смены сезона ' + g.pfDaysLeft() + ' дн.', 72, 54, { size: 10, col: C.sub });

          ui.button(W - 138, 8, 100, 22, 'Правила', () => ui.openPfRules(), { size: 11 });
          ui.closeBtn(W - 30, 6, () => this.key('back'));

          const total = g.pfStarTotal();
          ui.fhBox(W - 132, HGT - 72, 122, 36, 'rgba(255,224,138,0.5)');
          ui.fhStar(W - 116, HGT - 54, 8, total > 0);
          ui.text(total + ' / 12', W - 102, HGT - 62, { size: 14, bold: true, col: C.gold });
          G.pfGift(c, W - 48, HGT - 66, 2);
          if (g.pfDue()) ui.badge(W - 16, HGT - 66);
          ui.hit(W - 132, HGT - 72, 122, 36, () => ui.openPfRewards());
          ui.hints([['←→', 'Этап'], ['Enter', 'Отряд'], ['Tab', 'Нелепость'], ['R', 'Правила'], ['F', 'Награды'], ['Esc', 'Выход']], W / 2, HGT - 20, { align: 'center' });
        },
        key(k, code) {
          if (code === 'Tab') { ui.openPfSplash(false); return; }
          if (code === 'KeyR') { ui.openPfRules(); return; }
          if (code === 'KeyF') { ui.openPfRewards(); return; }
          if (k === 'left' || k === 'up') this.step(-1);
          if (k === 'right' || k === 'down') this.step(1);
          if (k === 'ok') this.enter(this.sel);
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
