(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const PAPER = { bg: '#e6dec8', line: '#d8cfb6', card: '#f4efe2', ink: '#2a2418', sub: '#7a705c', dark: '#2a2418', bar: '#b8ae98', lock: '#3a3628' };
  const BODY = { x: 24, y: 64, w: 592, h: 378 };
  const TAB = { x: 44, y: 38, w: 62, h: 26, step: 66 };
  const ACT = { x: 40, y: 80, w: 264, h: 64, gap: 8 };
  const CARD = { x: 320, y: 80, w: 140, h: 96, gx: 8, gy: 10, cols: 2 };
  const IDX = { x: 40, y: 80, cw: 236, ch: 40, gap: 5, rx: 292, rh: 50, vis: 5 };
  const DAY = { mx: 76, my: 108, bx: 136, bw: 448, by: 98, cards: { x: 40, y: 180, w: 136, h: 214, gap: 8, vis: 4 } };
  const PAGE = { x: 36, y: 46, w: 568, h: 396, rows: 10, rh: 22 };

  Object.assign(H.UI.prototype, {
    guideLock(i) { return H.GUIDE_SECTIONS[i].open(this.game); },

    guidePaper(c) {
      const { x, y, w, h } = BODY;
      c.fillStyle = '#010208'; c.fillRect(x - 3, y - 3, w + 6, h + 6);
      c.fillStyle = C.brass; c.fillRect(x - 2, y - 2, w + 4, h + 4);
      c.fillStyle = PAPER.bg; c.fillRect(x, y, w, h);
      c.fillStyle = PAPER.line; for (let ly = y + 6; ly < y + h; ly += 4) c.fillRect(x, ly, w, 1);
      c.save(); c.globalAlpha = 0.07;
      c.fillStyle = PAPER.ink; c.beginPath(); c.arc(x + w - 90, y + h - 90, 70, 0, Math.PI * 2); c.fill();
      c.fillStyle = PAPER.bg; c.beginPath(); c.arc(x + w - 90, y + h - 90, 58, 0, Math.PI * 2); c.fill();
      const sx = x + w - 90, sy = y + h - 90, r = 54, t = 12;
      c.fillStyle = PAPER.ink; c.beginPath(); c.moveTo(sx, sy - r); c.lineTo(sx + t, sy - t); c.lineTo(sx + r, sy); c.lineTo(sx + t, sy + t); c.lineTo(sx, sy + r); c.lineTo(sx - t, sy + t); c.lineTo(sx - r, sy); c.lineTo(sx - t, sy - t); c.fill();
      c.restore();
    },

    guideTabs(c, scr) {
      const ui = this, al = this.game.alerts();
      H.GUIDE_SECTIONS.forEach((sec, i) => {
        const x = TAB.x + i * TAB.step, on = i === scr.tab, locked = !!ui.guideLock(i);
        c.fillStyle = '#010208'; c.fillRect(x - 1, TAB.y - 1, TAB.w + 2, TAB.h + (on ? 4 : 1));
        c.fillStyle = on ? PAPER.bg : '#232640'; c.fillRect(x, TAB.y, TAB.w, TAB.h + (on ? 3 : 0));
        c.fillStyle = on ? C.brassHi : C.brassDk; c.fillRect(x, TAB.y, TAB.w, 2);
        if (on) { c.fillStyle = PAPER.dark; c.beginPath(); c.arc(x + TAB.w / 2, TAB.y + 14, 12, 0, Math.PI * 2); c.fill(); }
        G.menuIcon(c, sec.icon, x + TAB.w / 2 - 11, TAB.y + 3, 22, locked ? '#5a5e7a' : on ? C.gold : '#d8dcf0');
        if (al['guide_' + sec.id]) ui.badge(x + TAB.w - 6, TAB.y + 4);
        ui.hit(x, TAB.y, TAB.w, TAB.h, () => scr.setTab(i));
      });
      ui.keycap(TAB.x - 22, TAB.y + 7, 'Q');
      ui.keycap(TAB.x + H.GUIDE_SECTIONS.length * TAB.step + 2, TAB.y + 7, 'E');
    },

    guideHeader(c, scr) {
      const ui = this;
      G.menuIcon(c, 'ipg', 10, 6, 28, C.brassHi);
      ui.text('Межзвёздный путеводитель', 44, 5, { size: 10, col: C.brass });
      ui.text(H.GUIDE_SECTIONS[scr.tab].label, 44, 18, { size: 14, bold: true, serif: true, col: C.gold });
      ui.button(W - 140, 8, 100, 22, 'Правила', () => ui.openGuideRules(scr.tab), { size: 11, icon: 'info' });
      ui.closeBtn(W - 32, 10, () => scr.key('back'));
    },

    guideLockedBody(c, why) {
      this.text('Раздел откроется ' + why + '.', BODY.x + BODY.w / 2, BODY.y + BODY.h / 2 - 8, { align: 'center', size: 13, bold: true, serif: true, col: PAPER.ink, shadow: false });
    },

    guideActRow(c, a, x, y, on) {
      const ui = this;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, y + 2, ACT.w, ACT.h);
      c.fillStyle = on ? PAPER.dark : PAPER.card; c.fillRect(x, y, ACT.w, ACT.h);
      c.fillStyle = on ? C.brassHi : PAPER.bar; c.fillRect(x, y, 4, ACT.h);
      ui.text(ui.fitText(a.title, 13, ACT.w - 26, true), x + 16, y + 12, { size: 13, bold: true, col: !a.open ? '#9a9080' : on ? C.gold : PAPER.ink, shadow: on });
      const status = !a.open ? 'Путь ещё не проложен' : a.finished ? 'Завершено' : a.done + ' / ' + a.parts.length;
      ui.text(status, x + 16, y + 38, { size: 11, col: on ? C.brass : PAPER.sub, shadow: on });
    },

    guidePadlock(c, cx, cy, col) {
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy - 4, 6, Math.PI, 0); c.stroke(); c.lineWidth = 1;
      c.fillStyle = col; c.fillRect(cx - 9, cy - 4, 18, 14);
      c.fillStyle = '#1a1810'; c.fillRect(cx - 1, cy, 2, 5);
    },

    guidePhoto(c, ch, x, y, w, h) {
      const ui = this, ph = this.game.chapterPhoto(ch);
      const was = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.drawImage(G.bgCanvas(ph.bg, w, h), x, y, w, h);
      (ph.cast || []).forEach((id, k, all) => G.drawSprite(c, G.lookOf(id, ui.game), 'down', 0, x + w / 2 - 16 + (k - (all.length - 1) / 2) * 30, y + h * 0.5 - 6));
      c.restore();
      c.imageSmoothingEnabled = was;
    },

    guideCard(c, p, x, y, on) {
      const ui = this;
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 3, y + 3, CARD.w, CARD.h);
      c.fillStyle = '#ffffff'; c.fillRect(x - 2, y - 2, CARD.w + 4, CARD.h + 4);
      if (p.started) {
        ui.guidePhoto(c, p.ch, x, y, CARD.w, CARD.h);
        if (!p.finished) { c.fillStyle = 'rgba(20,16,10,0.35)'; c.fillRect(x, y, CARD.w, CARD.h); ui.text(p.done + '/' + p.total, x + CARD.w - 6, y + 5, { align: 'right', size: 10, bold: true, col: C.gold }); }
      } else {
        c.fillStyle = PAPER.lock; c.fillRect(x, y, CARD.w, CARD.h);
        ui.guidePadlock(c, x + CARD.w / 2, y + 26, '#8a8068');
      }
      c.fillStyle = 'rgba(16,14,10,0.78)'; c.fillRect(x, y + 50, 64, 15);
      ui.text(p.part, x + 6, y + 51, { size: 11, bold: true, col: '#ffffff' });
      c.fillStyle = '#1c1810'; c.fillRect(x, y + 66, CARD.w, 30);
      c.fillStyle = '#e8b040'; c.fillRect(x, y + 66, CARD.w, 1); c.fillRect(x, y + 66, 1, 30);
      ui.diamond(x + 10, y + 81, 4, '#e8b040', '#1a1208');
      ui.wrap(p.name, CARD.w - 26, 10).slice(0, 2).forEach((l, i) => ui.text(l, x + 20, y + 69 + i * 12, { size: 10, col: p.started ? '#ffffff' : '#9a9080' }));
      if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 3; c.strokeRect(x - 3.5, y - 3.5, CARD.w + 7, CARD.h + 7); c.lineWidth = 1; }
    },

    guideTrail(c, scr) {
      const ui = this, acts = this.game.guideActs();
      scr.act = Math.max(0, Math.min(scr.act, acts.length - 1));
      acts.forEach((a, i) => {
        const y = ACT.y + i * (ACT.h + ACT.gap);
        ui.guideActRow(c, a, ACT.x, y, i === scr.act);
        ui.hit(ACT.x, y, ACT.w, ACT.h, () => { if (scr.act !== i) { scr.act = i; scr.card = 0; ui.sfx('select'); } scr.focus = 'list'; });
      });
      const a = acts[scr.act];
      if (!a.open || !a.parts.length) {
        ui.wrap('Экспресс ещё не прокладывал сюда путь. Глава появится, когда Освоение дойдёт до этого мира.', 260, 11).forEach((l, i) => ui.text(l, CARD.x + 144, BODY.y + 150 + i * 16, { align: 'center', size: 11, col: PAPER.sub, shadow: false }));
        return;
      }
      scr.card = Math.max(0, Math.min(scr.card, a.parts.length - 1));
      a.parts.forEach((p, i) => {
        const x = CARD.x + (i % CARD.cols) * (CARD.w + CARD.gx), y = CARD.y + Math.floor(i / CARD.cols) * (CARD.h + CARD.gy);
        ui.guideCard(c, p, x, y, scr.focus === 'cards' && i === scr.card);
        ui.hit(x, y, CARD.w, CARD.h, () => { if (scr.focus === 'cards' && scr.card === i) ui.openGuideChapter(p.ch, p.part); else { scr.focus = 'cards'; scr.card = i; ui.sfx('select'); } });
      });
    },

    guideTrailKey(scr, k) {
      const ui = this, acts = this.game.guideActs(), a = acts[scr.act], n = a.open ? a.parts.length : 0;
      if (scr.focus === 'list') {
        if (k === 'up' || k === 'down') { scr.act = (scr.act + (k === 'up' ? acts.length - 1 : 1)) % acts.length; scr.card = 0; ui.sfx('select'); return true; }
        if ((k === 'right' || k === 'ok') && n) { scr.focus = 'cards'; scr.card = 0; ui.sfx('select'); return true; }
        if (k === 'ok') { ui.sfx('deny'); return true; }
        return false;
      }
      if (k === 'left' && scr.card % CARD.cols === 0) { scr.focus = 'list'; ui.sfx('select'); return true; }
      const mv = { left: -1, right: 1, up: -CARD.cols, down: CARD.cols }[k];
      if (mv) { const to = scr.card + mv; if (to >= 0 && to < n) { scr.card = to; ui.sfx('select'); } return true; }
      if (k === 'ok') { const p = a.parts[scr.card]; ui.openGuideChapter(p.ch, p.part); return true; }
      if (k === 'back') { scr.focus = 'list'; ui.sfx('cancel'); return true; }
      return false;
    },

    openGuideChapter(ch, part) {
      const ui = this, g = this.game, chap = H.MISSION_CHAPTERS[ch];
      this.push({
        sel: 0, sc: { top: 0 },
        draw(c) {
          const st = g.chapterState(ch), list = st.list, cur = list.findIndex(m => !m.done);
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(PAGE.x, PAGE.y, PAGE.w, PAGE.h, { title: chap.label });
          c.fillStyle = '#ffffff'; c.fillRect(PAGE.x + 14, PAGE.y + 20, 228, 158);
          if (st.started) ui.guidePhoto(c, ch, PAGE.x + 18, PAGE.y + 24, 220, 150);
          else { c.fillStyle = PAPER.lock; c.fillRect(PAGE.x + 18, PAGE.y + 24, 220, 150); ui.guidePadlock(c, PAGE.x + 128, PAGE.y + 96, '#8a8068'); }
          ui.text(part, PAGE.x + 16, PAGE.y + 190, { size: 11, col: C.sub });
          ui.wrap(chap.name, 228, 14).slice(0, 3).forEach((l, i) => ui.text(l, PAGE.x + 16, PAGE.y + 206 + i * 18, { size: 14, bold: true, serif: true, col: C.gold }));
          ui.text('Миссии: ' + st.done + ' / ' + st.total, PAGE.x + 16, PAGE.y + 266, { size: 11, col: C.cream });
          if (st.finished) ui.text('Завершено', PAGE.x + 16, PAGE.y + 284, { size: 11, bold: true, col: C.ok });
          const lx = PAGE.x + 258, lw = PAGE.w - 274, top = ui.listTop(this.sc, this.sel, list.length, PAGE.rows);
          list.slice(top, top + PAGE.rows).forEach((m, j) => {
            const i = top + j, y = PAGE.y + 20 + j * PAGE.rh, on = i === this.sel, known = m.done || i === cur;
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(255,255,255,0.03)'; c.fillRect(lx, y, lw, PAGE.rh - 2);
            if (on) { c.strokeStyle = C.brassHi; c.strokeRect(lx + 0.5, y + 0.5, lw - 1, PAGE.rh - 3); }
            ui.text(m.done ? '✓' : i === cur ? '►' : '·', lx + 8, y + 4, { size: 11, bold: true, col: m.done ? C.ok : i === cur ? C.gold : C.dim });
            ui.text(known ? ui.fitText(m.name, 11, lw - 34) : '???', lx + 24, y + 4, { size: 11, col: known ? C.cream : C.dim });
            ui.hit(lx, y, lw, PAGE.rh - 2, () => { this.sel = i; });
          });
          if (list.length > PAGE.rows) ui.scrollBar(PAGE.x + PAGE.w - 14, PAGE.y + 20, PAGE.rows * PAGE.rh - 2, this.sc, list.length, PAGE.rows);
          const m = list[this.sel], dy = PAGE.y + 20 + PAGE.rows * PAGE.rh + 8;
          c.fillStyle = C.brassDk; c.fillRect(lx, dy - 4, lw, 1);
          if (m) {
            const known = m.done || this.sel === cur;
            ui.wrap(known ? m.desc : 'Эта страница путеводителя ещё не заполнена.', lw - 8, 10).slice(0, 8).forEach((l, i) => ui.text(l, lx + 4, dy + 4 + i * 13, { size: 10, col: known ? C.cream : C.dim }));
          }
          ui.hints([['↑↓', 'Миссия'], ['Esc', 'Назад']], W / 2, PAGE.y + PAGE.h + 6, { align: 'center' });
        },
        key(k) {
          const n = g.chapterMissions(ch).length;
          if (k === 'back' || k === 'ok') { ui.pop(); return; }
          if ((k === 'up' || k === 'down') && n) { this.sel = (this.sel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
        }
      });
    },

    guideEnter(row) {
      const ui = this, g = this.game;
      if (!row.open) { ui.sfx('deny'); ui.toast(row.why); return; }
      if (g.state.su) { ui.sfx('deny'); ui.toast('Из Виртуальной вселенной телепорт не работает.'); return; }
      const site = g.guideSite(row.kind, row.id), hop = site && g.guideHop(site);
      if (!hop || !hop.ok) { ui.sfx('deny'); ui.toast(hop ? hop.why : 'Сюда не проложен путь.'); return; }
      if (!hop.here && !ui.canSaveHere()) { ui.sfx('deny'); ui.toast('Телепорт работает у якоря пространства или в безопасной зоне.'); return; }
      if (hop.here) ui.screens = [];
      else ui.navTravel(hop.dest);
      if (row.kind === 'su') { g.runScript('su_terminal'); ui.drainGameEvents(); return; }
      if (row.kind === 'fh') { ui.openFh(() => {}); return; }
      if (row.kind === 'pf') { ui.openPfEntry(() => {}); return; }
      ui.openCalyx(() => {}, [row.id]);
    },

    guideBust(c, key, x, y, d) {
      const kit = this.game.kitOf(key);
      c.save();
      c.fillStyle = '#1a1208'; c.beginPath(); c.arc(x + d / 2, y + d / 2, d / 2 + 1, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#3a3426'; c.fillRect(x, y, d, d);
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(G.bustCanvas(G.lookOf(kit, this.game), 64), x - d * 0.15, y - d * 0.05, d * 1.3, d * 1.3);
      c.imageSmoothingEnabled = was;
      c.restore();
      c.strokeStyle = C.brass; c.lineWidth = 1; c.beginPath(); c.arc(x + d / 2, y + d / 2, d / 2 + 0.5, 0, Math.PI * 2); c.stroke();
    },

    guideCoupon(c, x, y, r, on, ok, fn) {
      const ui = this;
      c.fillStyle = '#1a1208'; c.beginPath(); c.arc(x, y, r + 1, 0, Math.PI * 2); c.fill();
      c.fillStyle = on ? '#fbf6e8' : ok ? '#efe6cf' : '#c8c0aa'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = on ? C.brassDk : PAPER.bar; c.beginPath(); c.arc(x, y, r - 0.5, 0, Math.PI * 2); c.stroke();
      c.save(); if (!ok) c.globalAlpha = 0.45;
      G.itemIcon(c, 'fuelv', x - r + 3, y - r + 3, r * 2 - 6);
      c.restore();
      ui.hit(x - r, y - r, r * 2, r * 2, fn);
    },

    guideQuick(row) {
      const ui = this, g = this.game;
      if (!row || row.kind !== 'calyx' || !g.domainCoupons(row.id)) { ui.sfx('deny'); ui.toast('Здесь Топливные купоны не принимают.'); return; }
      if (!row.open) { ui.sfx('deny'); ui.toast(row.why); return; }
      ui.openQuickFarm(row.id, Math.max(0, g.tiersOpen().lastIndexOf(true)));
    },

    guideView(row) {
      const ui = this;
      if (!row || row.kind !== 'calyx') { ui.sfx('deny'); return; }
      ui.sfx('select');
      ui.openDomain(row.id, () => {}, { enter: () => ui.guideEnter(row) });
    },

    guideIndexRow(c, cat, r, x, y, w, on) {
      const ui = this, g = this.game, quick = r.kind === 'calyx' && g.domainCoupons(r.id) > 0, tk = r.forTarget && g.guideTarget();
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 2, y + 2, w, IDX.rh);
      c.fillStyle = on ? '#fbf6e8' : PAPER.card; c.fillRect(x, y, w, IDX.rh);
      c.fillStyle = r.open ? cat.col : PAPER.bar; c.fillRect(x, y, 4, IDX.rh);
      const drops = r.kind === 'su' ? [['relic:sphere', r.set], ['relic:rope', r.set]] : r.c.sets ? (r.c.mat ? [[r.c.mat, 'thunder']] : []).concat(r.c.sets.map(st => ['relic:head', st])).slice(0, 2) : ui.calyxDrops(r.c).slice(0, 2).map(d => [d, 'thunder']);
      drops.forEach(([d, st], i) => {
        const it = H.ITEMS[d], dx = x + 10 + i * 30;
        G.rarityCell(c, dx, y + 8, 28, 28, it ? it.rar : 4);
        G.itemIcon(c, d, dx + 1, y + 9, 26, st);
      });
      if (r.kind === 'calyx') {
        c.fillStyle = '#5a5444'; c.beginPath(); c.arc(x + 34, y + 34, 6, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#f4efe2'; c.beginPath(); c.arc(x + 33, y + 33, 2.5, 0, Math.PI * 2); c.moveTo(x + 35, y + 35); c.lineTo(x + 37, y + 37); c.stroke();
        ui.hit(x + 6, y + 4, 62, 36, () => ui.guideView(r));
      }
      const tx = x + 76, tw = w - 76 - (quick || tk ? 112 : 88);
      ui.text(ui.fitText(r.name, 12, tw, true), tx, y + 6, { size: 12, bold: true, col: r.open ? PAPER.ink : '#9a9080', shadow: false });
      ui.text(ui.fitText(r.place, 10, tw), tx, y + 22, { size: 10, col: PAPER.sub, shadow: false });
      const note = r.kind === 'su' ? 'Украшения «' + H.RELIC_SETS[r.set].name + '»' : r.c.reward === 'echo' ? 'Награды в этот час: ' + this.game.echoLeft() + ' из ' + H.TRACE_ECHO_LIMIT : r.c.sets ? 'Наборы: ' + r.c.sets.map(x => H.RELIC_SETS[x].name).join(', ') : '';
      if (note) ui.text(ui.fitText(note, 9, tw), tx, y + 36, { size: 9, col: PAPER.sub, shadow: false });
      G.itemIcon(c, 'power', x + w - 78, y + 5, 14);
      ui.text(String(r.cost), x + w - 60, y + 6, { size: 11, bold: true, col: PAPER.ink, shadow: false });
      if (tk) ui.guideBust(c, tk, x + w - 106, y + 2, 20);
      if (quick && r.open) ui.guideCoupon(c, x + w - 97, y + 34, 11, on, (g.state.inv.items.fuelv || 0) >= g.domainCoupons(r.id), () => ui.guideQuick(r));
      if (r.open) {
        const bx = x + w - 80, by = y + 24;
        c.fillStyle = on ? PAPER.dark : '#4a4434'; c.fillRect(bx, by, 72, 20);
        c.fillStyle = on ? C.brassHi : C.brass; c.fillRect(bx, by, 72, 1);
        ui.text('▶ Войти', bx + 36, by + 4, { align: 'center', size: 11, bold: true, col: on ? C.gold : C.cream });
        ui.hit(bx, by, 72, 20, () => ui.guideEnter(r));
      } else ui.wrap(r.why, 80, 9).slice(0, 2).forEach((l, i) => ui.text(l, x + w - 84, y + 24 + i * 11, { size: 9, col: '#a05a3a', shadow: false }));
      if (on) { c.strokeStyle = C.brassDk; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, w + 2, IDX.rh + 2); c.lineWidth = 1; }
    },

    guideIndex(c, scr) {
      const ui = this, g = this.game, cats = H.GUIDE_INDEX;
      ui.powerChip(420, 12, { sep: ' / ' });
      scr.cat = Math.max(0, Math.min(scr.cat, cats.length - 1));
      cats.forEach((cat, i) => {
        const y = IDX.y + i * (IDX.ch + IDX.gap), on = i === scr.cat && scr.focus !== 'pick';
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(IDX.x + 2, y + 2, IDX.cw, IDX.ch);
        c.fillStyle = on ? PAPER.dark : PAPER.card; c.fillRect(IDX.x, y, IDX.cw, IDX.ch);
        c.fillStyle = on ? C.brassHi : cat.col; c.fillRect(IDX.x, y, 4, IDX.ch);
        if (on) { c.fillStyle = '#3a3426'; c.beginPath(); c.arc(IDX.x + 24, y + IDX.ch / 2, 14, 0, Math.PI * 2); c.fill(); }
        G.menuIcon(c, cat.icon, IDX.x + 13, y + IDX.ch / 2 - 11, 22, cat.col);
        ui.text(cat.label, IDX.x + 46, y + 5, { size: 13, bold: true, col: on ? C.gold : PAPER.ink, shadow: on });
        const tk = cat.id === 'target' && g.guideTarget(), sub = tk ? H.CHARS[g.kitOf(tk)].name === 'Первопроходец' ? g.state.name : H.CHARS[g.kitOf(tk)].name : cat.sub;
        ui.text(ui.fitText(sub, 10, IDX.cw - 54), IDX.x + 46, y + 22, { size: 10, col: on ? C.brass : PAPER.sub, shadow: on });
        ui.hit(IDX.x, y, IDX.cw, IDX.ch, () => { if (scr.cat !== i) { scr.cat = i; scr.row = 0; scr.isc = { top: 0 }; ui.sfx('select'); } scr.focus = 'list'; });
      });
      ui.guideTargetButton(c, scr);
      const cat = cats[scr.cat], rx = IDX.rx, rw = BODY.x + BODY.w - 16 - rx;
      if (cat.id === 'target') { ui.guideTargetPanel(c, scr, rx, rw); return; }
      c.fillStyle = PAPER.dark; c.fillRect(rx, IDX.y, rw, 24);
      c.fillStyle = C.brassHi; c.fillRect(rx, IDX.y + 23, rw, 1);
      ui.text(cat.label, rx + 10, IDX.y + 5, { size: 12, bold: true, col: C.gold });
      const rows = g.guideIndexList(cat.id);
      scr.row = Math.max(0, Math.min(scr.row, rows.length - 1));
      const top = ui.listTop(scr.isc, scr.row, rows.length, IDX.vis);
      rows.slice(top, top + IDX.vis).forEach((r, j) => {
        const i = top + j, y = IDX.y + 30 + j * (IDX.rh + 6);
        ui.guideIndexRow(c, cat, r, rx, y, rw - (rows.length > IDX.vis ? 14 : 0), scr.focus === 'rows' && i === scr.row);
        ui.hit(rx, y, rw - 90, IDX.rh, () => { scr.focus = 'rows'; if (scr.row !== i) { scr.row = i; ui.sfx('select'); } });
      });
      if (rows.length > IDX.vis) ui.scrollBar(rx + rw - 10, IDX.y + 30, IDX.vis * (IDX.rh + 6) - 6, scr.isc, rows.length, IDX.vis);
      ui.wheelZone(rx, IDX.y + 30, rw, IDX.vis * (IDX.rh + 6), d => { scr.isc.top += d; });
    },

    guideIndexKey(scr, k, code) {
      const ui = this, cats = H.GUIDE_INDEX, cat = cats[scr.cat];
      if (scr.focus !== 'pick' && cat.id === 'target' && ui.guideTargetKey(scr, k, code)) return true;
      const rows = cat.id === 'target' ? [] : this.game.guideIndexList(cat.id);
      if (scr.focus === 'pick') {
        if (k === 'up') { scr.focus = 'list'; scr.cat = cats.length - 1; ui.sfx('select'); return true; }
        if (k === 'down') { scr.focus = 'list'; scr.cat = 0; ui.sfx('select'); return true; }
        if (k === 'ok') { ui.openGuideTargetPick(scr); return true; }
        if (k === 'back') { scr.focus = 'list'; ui.sfx('cancel'); return true; }
        return true;
      }
      if (scr.focus === 'list' && k === 'down' && scr.cat === cats.length - 1) { scr.focus = 'pick'; ui.sfx('select'); return true; }
      if (scr.focus === 'list' && k === 'up' && scr.cat === 0) { scr.focus = 'pick'; ui.sfx('select'); return true; }
      if (scr.focus === 'rows' && code === 'KeyF') { ui.guideQuick(rows[scr.row]); return true; }
      if (scr.focus === 'rows' && code === 'KeyL') { ui.guideView(rows[scr.row]); return true; }
      if (scr.focus === 'list') {
        if (k === 'up' || k === 'down') { scr.cat = (scr.cat + (k === 'up' ? cats.length - 1 : 1)) % cats.length; scr.row = 0; scr.isc = { top: 0 }; ui.sfx('select'); return true; }
        if ((k === 'right' || k === 'ok') && rows.length) { scr.focus = 'rows'; scr.row = 0; ui.sfx('select'); return true; }
        if (k === 'ok') { ui.sfx('deny'); return true; }
        return false;
      }
      if (k === 'left' || k === 'back') { scr.focus = 'list'; ui.sfx('cancel'); return true; }
      if (k === 'up' || k === 'down') { const to = scr.row + (k === 'up' ? -1 : 1); if (to >= 0 && to < rows.length) { scr.row = to; ui.sfx('select'); } return true; }
      if (k === 'ok') { if (rows[scr.row]) ui.guideEnter(rows[scr.row]); return true; }
      return false;
    },

    guideRecToggle() {
      const g = this.game, on = !g.guideRecOnly();
      g.setGuideRecOnly(on);
      this.sfx('select');
      this.toast(on ? 'Считаются только Навык, Ультимейт, Талант и бонусные способности.' : 'Считаются все Следы.');
    },

    guideTargetMark(c, x, y) {
      c.fillStyle = '#1a1208'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.brassHi; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 4.2, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      c.fillStyle = C.brassHi; c.fillRect(x - 1, y - 1, 2, 2); c.fillRect(x - 1, y - 8, 2, 3); c.fillRect(x - 1, y + 5, 2, 3); c.fillRect(x - 8, y - 1, 3, 2); c.fillRect(x + 5, y - 1, 3, 2);
    },

    guideTargetButton(c, scr) {
      const ui = this, g = this.game, key = g.guideTarget(), y = IDX.y + H.GUIDE_INDEX.length * (IDX.ch + IDX.gap) + 2, w = IDX.cw, x = IDX.x, h = 28, on = scr.focus === 'pick';
      const done = key && !g.targetNeeds(key).length, blink = done && Math.sin(ui.t * 5) > 0;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, y + 2, w, h);
      c.fillStyle = on ? PAPER.dark : blink ? '#f4e2a8' : PAPER.card; c.fillRect(x, y, w, h);
      c.strokeStyle = on ? C.brassHi : C.brassDk; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (key) ui.guideBust(c, key, x + 4, y + 2, 24);
      else { c.strokeStyle = PAPER.bar; c.setLineDash([2, 2]); c.beginPath(); c.arc(x + 16, y + 14, 11, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
      ui.text(key ? 'Сменить цель развития' : 'Выбрать цель развития', x + 36, y + 7, { size: 12, bold: true, col: on ? C.gold : PAPER.ink, shadow: on });
      const ax = x + w - 16, ay = y + 14, col = on ? C.gold : PAPER.ink;
      c.strokeStyle = col; c.lineWidth = 1.5;
      c.beginPath(); c.arc(ax, ay, 6, Math.PI * 0.15, Math.PI * 0.95); c.stroke();
      c.beginPath(); c.arc(ax, ay, 6, Math.PI * 1.15, Math.PI * 1.95); c.stroke();
      c.lineWidth = 1;
      c.fillStyle = col; c.fillRect(ax + 4, ay - 6, 3, 3); c.fillRect(ax - 7, ay + 3, 3, 3);
      ui.hit(x, y, w, h, () => ui.openGuideTargetPick(scr));
    },

    guideTargetItems(key) {
      const g = this.game, b = H.guideBuild(g.kitOf(key));
      const needs = g.targetNeeds(key).map(n => Object.assign({ type: 'need' }, n));
      const sets = [b.set, b.planar].map(set => ({ type: 'set', set, row: g.setSource(set) }));
      return { needs, sets, all: needs.concat(sets) };
    },

    guideItemQuick(it) {
      const g = this.game, row = it.row, price = row && row.kind === 'calyx' ? g.domainCoupons(row.id) : 0;
      return it.type === 'need' && row.open && price > 0 && (g.state.inv.items.fuelv || 0) >= price;
    },

    guideItemGo(it) {
      const ui = this;
      if (it.row && ui.guideItemQuick(it)) { ui.guideQuick(it.row); return; }
      if (it.row) { ui.guideEnter(it.row); return; }
      if (it.supply) { ui.openSupply(); return; }
      ui.sfx('deny');
      ui.toast(it.type === 'set' ? 'Этот набор пока негде добыть. Его можно создать в Синтезе.' : 'Этот материал остаётся после врагов в мире.');
    },

    guideGoButton(c, x, y, it, on) {
      const ui = this, label = it.row ? (ui.guideItemQuick(it) ? '▶ Быстро' : '▶ Войти') : it.supply ? '▶ Снабжение' : '';
      if (!label) return;
      const w = it.supply ? 86 : 64, open = !it.row || it.row.open;
      c.fillStyle = on ? PAPER.dark : '#4a4434'; c.fillRect(x - w, y, w, 18);
      c.fillStyle = on ? C.brassHi : C.brass; c.fillRect(x - w, y, w, 1);
      ui.text(label, x - w / 2, y + 3, { align: 'center', size: 10, bold: true, col: open ? (on ? C.gold : C.cream) : C.dim });
      ui.hit(x - w, y, w, 18, () => ui.guideItemGo(it));
    },

    guideTargetPanel(c, scr, rx, rw) {
      const ui = this, g = this.game, key = g.guideTarget();
      if (!key) {
        ui.wrap('Выберите героя, которого хотите развить. Путеводитель посчитает, каких материалов ему не хватает, и подскажет, где их взять.', rw - 40, 11).forEach((l, i) => ui.text(l, rx + rw / 2, IDX.y + 60 + i * 16, { align: 'center', size: 11, col: PAPER.sub, shadow: false }));
        ui.button(rx + rw / 2 - 90, IDX.y + 130, 180, 26, 'Выбрать героя', () => ui.openGuideTargetPick(scr), { size: 11, icon: 'chars' });
        return;
      }
      const kit = g.kitOf(key), name = H.CHARS[kit].name === 'Первопроходец' ? g.state.name : H.CHARS[kit].name, items = ui.guideTargetItems(key), r = g.state.roster[key], own = g.guideOwned(key);
      c.fillStyle = PAPER.dark; c.fillRect(rx, IDX.y, rw, 24);
      c.fillStyle = C.brassHi; c.fillRect(rx, IDX.y + 23, rw, 1);
      ui.text(ui.fitText('Развитие: ' + name + (own ? ', ур. ' + r.lvl : ' · Прыжок'), 12, rw - 96, true), rx + 10, IDX.y + 5, { size: 12, bold: true, col: C.gold });
      ui.button(rx + rw - 82, IDX.y + 2, 78, 20, 'Следы', () => ui.guideOpenChar(key, 'traces'), { size: 10, icon: 'traces', disabled: !own });
      ui.text('Требуемые материалы', rx + 4, IDX.y + 30, { size: 11, bold: true, col: PAPER.ink, shadow: false });
      ui.text('Только рекомендуемые Следы', rx + rw - 44, IDX.y + 31, { align: 'right', size: 9, col: PAPER.sub, shadow: false });
      ui.domainToggle(c, rx + rw - 38, IDX.y + 27, g.guideRecOnly());
      ui.hit(rx + rw - 170, IDX.y + 26, 170, 18, () => ui.guideRecToggle());
      const vis = 4, rh = 36, y0 = IDX.y + 46, focusRows = scr.focus === 'rows';
      if (!items.needs.length && own) {
        const gs = g.guideState(), seen = gs.done || (gs.done = {});
        if (!seen[key]) { seen[key] = true; ui.toast('Цель развития достигнута: ' + name + '.'); }
        c.fillStyle = PAPER.dark; c.fillRect(rx + 20, y0 + 30, rw - 40, 30);
        c.fillStyle = C.brassHi; c.fillRect(rx + 20, y0 + 30, rw - 40, 1);
        ui.text('Цель достигнута', rx + rw / 2, y0 + 37, { align: 'center', size: 14, bold: true, serif: true, col: C.gold });
        ui.text('Для Следов и уровня всё уже собрано. Выберите новую цель.', rx + rw / 2, y0 + 70, { align: 'center', size: 10, col: PAPER.sub, shadow: false });
        ui.button(rx + rw / 2 - 80, y0 + 92, 160, 24, 'Сменить цель', () => ui.openGuideTargetPick(scr), { size: 11, icon: 'chars' });
      }
      const top = ui.listTop(scr.tsc, Math.min(scr.trow, Math.max(0, items.needs.length - 1)), items.needs.length, vis);
      items.needs.slice(top, top + vis).forEach((it, j) => {
        const i = top + j, y = y0 + j * (rh + 4), on = focusRows && scr.trow === i, w = rw - (items.needs.length > vis ? 14 : 0), info = H.ITEMS[it.id] || { name: 'Кредиты', rar: 3 };
        c.fillStyle = on ? '#fbf6e8' : PAPER.card; c.fillRect(rx, y, w, rh);
        c.fillStyle = PAPER.bar; c.fillRect(rx, y, 3, rh);
        G.rarityCell(c, rx + 8, y + 3, 30, 30, info.rar || 2); G.itemIcon(c, it.id, rx + 9, y + 4, 28);
        const cnt = '×' + H.fmt(it.miss), nx = rx + 44 + ui.measure(cnt, 11, true) + 6;
        ui.text(cnt, rx + 44, y + 4, { size: 11, bold: true, col: '#a03a2a', shadow: false });
        ui.text(ui.fitText(info.name, 10, rx + w - 104 - nx, true), nx, y + 5, { size: 10, bold: true, col: PAPER.ink, shadow: false });
        const quick = it.row && it.row.kind === 'calyx' && g.domainCoupons(it.row.id) > 0 && it.row.open;
        ui.text(ui.fitText(it.src, 9, w - (quick ? 150 : 120)), rx + 44, y + 21, { size: 9, col: PAPER.sub, shadow: false });
        if (it.row) { G.itemIcon(c, 'power', rx + w - 100, y + 4, 12); ui.text(String(it.row.cost), rx + w - 86, y + 4, { size: 10, bold: true, col: PAPER.ink, shadow: false }); }
        if (quick) ui.guideCoupon(c, rx + w - 84, y + 24, 9, on, (g.state.inv.items.fuelv || 0) >= g.domainCoupons(it.row.id), () => ui.guideQuick(it.row));
        ui.guideGoButton(c, rx + w - 6, y + 15, it, on);
        if (on) { c.strokeStyle = C.brassDk; c.lineWidth = 2; c.strokeRect(rx - 1, y - 1, w + 2, rh + 2); c.lineWidth = 1; }
        ui.hit(rx, y, w - 90, rh, () => { scr.focus = 'rows'; scr.trow = i; });
      });
      if (items.needs.length > vis) ui.scrollBar(rx + rw - 10, y0, vis * (rh + 4) - 4, scr.tsc, items.needs.length, vis);
      const sy = y0 + vis * (rh + 4) + 2, sc = g.relicScore(key);
      c.fillStyle = PAPER.dark; c.fillRect(rx, sy, rw, 26);
      ui.text('Оценка реликвий', rx + 8, sy + 7, { size: 10, col: C.cream });
      c.fillStyle = C.brassDk; c.beginPath(); c.arc(rx + 108, sy + 13, 11, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.brassHi; c.beginPath(); c.arc(rx + 108, sy + 13, 10, 0, Math.PI * 2); c.stroke();
      ui.text(sc.grade, rx + 108, sy + 6, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
      ui.text('Полезных доп. хар.: ' + sc.useful, rx + 124, sy + 7, { size: 9, col: C.cream });
      ui.button(rx + rw - 72, sy + 3, 68, 20, 'Надеты', () => ui.guideOpenChar(key, 'relics'), { size: 10, disabled: !own });
      const hy = sy + 32;
      ui.text('Рекомендованные реликвии', rx + 4, hy, { size: 11, bold: true, col: PAPER.ink, shadow: false });
      ui.text('Популярно среди игроков', rx + rw - 4, hy + 1, { align: 'right', size: 9, col: PAPER.sub, shadow: false });
      items.sets.forEach((it, j) => {
        const i = items.needs.length + j, y = hy + 16 + j * 38, on = focusRows && scr.trow === i, def = H.RELIC_SETS[it.set];
        c.fillStyle = on ? '#fbf6e8' : PAPER.card; c.fillRect(rx, y, rw, 34);
        c.fillStyle = def.planar ? '#80c8ff' : C.brass; c.fillRect(rx, y, 3, 34);
        G.rarityCell(c, rx + 8, y + 3, 28, 28, 4); G.itemIcon(c, def.planar ? 'relic:sphere' : 'relic:head', rx + 9, y + 4, 26, it.set);
        ui.text(ui.fitText(def.name, 10, rw - 150, true), rx + 42, y + 4, { size: 10, bold: true, col: PAPER.ink, shadow: false });
        ui.text(ui.fitText(it.row ? it.row.name + (it.row.place ? ', ' + it.row.place : '') : 'Синтез, вкладка «Реликвии»', 9, rw - 120), rx + 42, y + 19, { size: 9, col: PAPER.sub, shadow: false });
        if (it.row) { G.itemIcon(c, 'power', rx + rw - 100, y + 4, 12); ui.text(String(it.row.cost), rx + rw - 86, y + 4, { size: 10, bold: true, col: PAPER.ink, shadow: false }); }
        ui.guideGoButton(c, rx + rw - 6, y + 14, it, on);
        if (on) { c.strokeStyle = C.brassDk; c.lineWidth = 2; c.strokeRect(rx - 1, y - 1, rw + 2, 36); c.lineWidth = 1; }
        ui.hit(rx, y, rw - 90, 34, () => { scr.focus = 'rows'; scr.trow = i; });
      });
    },

    guideOpenChar(key, sec) {
      if (!this.game.guideOwned(key)) { this.sfx('deny'); this.toast('Этого героя ещё нет в экипаже.'); return; }
      this.openChars(key);
      const top = this.top(), idx = { traces: 1, relics: 2 }[sec];
      if (top && idx != null) top.sec = idx;
    },

    guideTargetKey(scr, k, code) {
      const ui = this, g = this.game, key = g.guideTarget();
      if (code === 'KeyC') { ui.openGuideTargetPick(scr); return true; }
      if (!key) { if (k === 'right' || k === 'ok') { if (scr.focus === 'rows' || k === 'ok') ui.openGuideTargetPick(scr); return true; } return false; }
      if (code === 'KeyR') { ui.guideRecToggle(); return true; }
      if (code === 'KeyG') { ui.guideOpenChar(key, 'traces'); return true; }
      if (code === 'KeyV') { ui.guideOpenChar(key, 'relics'); return true; }
      const all = ui.guideTargetItems(key).all;
      if (scr.focus === 'list') {
        if ((k === 'right' || k === 'ok') && all.length) { scr.focus = 'rows'; scr.trow = 0; ui.sfx('select'); return true; }
        return false;
      }
      if (k === 'left' || k === 'back') { scr.focus = 'list'; ui.sfx('cancel'); return true; }
      if (k === 'up' || k === 'down') { const to = scr.trow + (k === 'up' ? -1 : 1); if (to >= 0 && to < all.length) { scr.trow = to; ui.sfx('select'); } return true; }
      if (k === 'ok') { if (all[scr.trow]) ui.guideItemGo(all[scr.trow]); return true; }
      if (code === 'KeyF') { const it = all[scr.trow]; if (it && it.row) ui.guideQuick(it.row); else ui.sfx('deny'); return true; }
      return false;
    },

    openGuideTargetPick(scr) {
      const ui = this, g = this.game, list = g.guideTargets(), COLS = 6, VIS = 4, CW = 72, CH = 74;
      const at = list.indexOf(g.guideTarget());
      this.push({
        sel: Math.max(0, at), sc: { top: 0 },
        draw(c) {
          const x0 = W / 2 - (COLS * CW) / 2, y0 = 92;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x0 - 16, 64, COLS * CW + 32, VIS * CH + 60, { title: 'Сменить цель развития' });
          const rows = Math.ceil(list.length / COLS), top = ui.listTop(this.sc, Math.floor(this.sel / COLS), rows, VIS);
          list.slice(top * COLS, (top + VIS) * COLS).forEach((k, j) => {
            const i = top * COLS + j, x = x0 + (j % COLS) * CW, y = y0 + Math.floor(j / COLS) * CH, kit = g.kitOf(k), on = i === this.sel;
            const own = g.guideOwned(k), warp = g.guideIsWarp(k);
            if (!own) { c.save(); c.globalAlpha = 0.6; }
            ui.portraitCard(c, G.lookOf(kit, g), x + 10, y, 52, { elem: H.CHARS[kit].elem });
            if (!own) c.restore();
            const nm = H.CHARS[kit].name === 'Первопроходец' ? g.state.name : H.CHARS[kit].name;
            ui.text(ui.fitText(nm, 9, CW - 4), x + CW / 2, y + 56, { align: 'center', size: 9, bold: on, col: on ? C.gold : own ? C.cream : C.sub });
            const info = g.guideWarpInfo(k);
            if (warp || (!own && info)) { c.fillStyle = own ? '#a8803a' : info.tag === 'Прыжок' ? '#6a3ab8' : '#3a5a9a'; c.fillRect(x + 10, y + 40, 52, 11); ui.text(info.tag, x + 36, y + 40, { align: 'center', size: 8, bold: true, col: '#fff6e0', shadow: false }); }
            if (k === g.guideTarget()) ui.guideTargetMark(c, x + 58, y + 6);
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x + 7, y - 3, 58, 72); c.lineWidth = 1; }
            ui.hit(x + 6, y - 2, 60, 70, () => { if (this.sel === i) this.key('ok'); else this.sel = i; });
          });
          if (rows > VIS) ui.scrollBar(x0 + COLS * CW + 2, y0, VIS * CH - 4, this.sc, rows, VIS);
          const cur = list[this.sel];
          const ci = cur && g.guideWarpInfo(cur);
          if (cur) ui.text(g.guideOwned(cur) ? (g.guideIsWarp(cur) ? 'Герой экипажа, есть в Прыжке «' + ci.src + '».' : 'Герой экипажа.') : 'Героя нет в экипаже. Где взять: «' + ci.src + '». Нехватка считается с 1 уровня.', W / 2, 64 + VIS * CH + 44, { align: 'center', size: 10, col: g.guideOwned(cur) ? C.sub : '#c8b0ff' });
          ui.hints([['←↑↓→', 'Герой'], ['Enter', 'Выбрать'], ['Esc', 'Назад']], W / 2, 64 + VIS * CH + 68, { align: 'center' });
        },
        key(k) {
          const n = list.length, mv = { left: -1, right: 1, up: -COLS, down: COLS }[k];
          if (k === 'back') { ui.pop(); return; }
          if (mv) { const to = this.sel + mv; if (to >= 0 && to < n) { this.sel = to; ui.sfx('select'); } return; }
          if (k === 'ok' && list[this.sel]) { g.setGuideTarget(list[this.sel]); scr.trow = 0; scr.tsc = { top: 0 }; ui.screens.pop(); ui.sfx('confirm'); }
        }
      });
    },

    guideSideRow(c, x, y, title, status, on, open, i, scr, field) {
      const ui = this;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, y + 2, IDX.cw, 56);
      c.fillStyle = on ? PAPER.dark : PAPER.card; c.fillRect(x, y, IDX.cw, 56);
      c.fillStyle = on ? C.brassHi : PAPER.bar; c.fillRect(x, y, 4, 56);
      ui.text(ui.fitText(title, 13, IDX.cw - 26, true), x + 16, y + 10, { size: 13, bold: true, col: !open ? '#9a9080' : on ? C.gold : PAPER.ink, shadow: on });
      ui.text(status, x + 16, y + 32, { size: 11, col: on ? C.brass : PAPER.sub, shadow: on });
      ui.hit(x, y, IDX.cw, 56, () => { if (scr[field] !== i) { scr[field] = i; ui.sfx('select'); } });
    },

    guideStage(c, draw) {
      const x = 292, y = 80, w = 308, h = 354;
      c.fillStyle = '#010208'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.translate(x - 170, y - 60);
      draw(c);
      c.restore();
      c.fillStyle = 'rgba(4,4,16,0.35)'; c.fillRect(x, y, w, h);
      return { x, y, w, h };
    },

    guideGoBig(c, x, y, w, label, fn, on) {
      const ui = this;
      c.fillStyle = '#010208'; c.fillRect(x - 1, y - 1, w + 2, 28);
      const gr = c.createLinearGradient(x, y, x, y + 26);
      gr.addColorStop(0, on ? '#fbf6e8' : '#e6dec8'); gr.addColorStop(1, on ? '#d8cfb6' : '#b8ae98');
      c.fillStyle = gr; c.fillRect(x, y, w, 26);
      ui.diamond(x + 12, y + 13, 3, C.brassDk); ui.diamond(x + w - 12, y + 13, 3, C.brassDk);
      ui.text(label, x + w / 2, y + 6, { align: 'center', size: 12, bold: true, col: PAPER.ink, shadow: false });
      ui.hit(x, y, w, 26, fn);
    },

    guideCosmicView(c, scr) {
      const ui = this, list = this.game.guideCosmic();
      scr.wsel = Math.max(0, Math.min(scr.wsel, list.length - 1));
      list.forEach((r, i) => ui.guideSideRow(c, ACT.x, ACT.y + i * 64, r.w.title, r.w.name + ' · ' + (!r.open ? 'закрыт' : r.first ? 'первая награда ×3' : 'пройден'), i === scr.wsel, r.open, i, scr, 'wsel'));
      const r = list[scr.wsel], b = ui.guideStage(c, cc => ui.suBackdrop(cc));
      ui.text(r.w.title, b.x + b.w - 14, b.y + 14, { align: 'right', size: 18, bold: true, serif: true, col: C.gold });
      ui.text(r.w.name + ' · ур. ' + r.w.lvl, b.x + b.w - 14, b.y + 40, { align: 'right', size: 11, col: C.cream });
      ui.wrap(r.w.text, b.w - 28, 10).slice(0, 3).forEach((l, i) => ui.text(l, b.x + 14, b.y + 64 + i * 13, { size: 10, col: '#e4dcf4' }));
      ui.text('Босс: ' + r.w.bossName, b.x + 14, b.y + 112, { size: 11, bold: true, col: '#ffd0c8' });
      ui.text(r.first ? 'Награда за первое прохождение' : 'Награда за прохождение', b.x + 14, b.y + 140, { size: 11, bold: true, col: C.cream });
      ui.rewardCell(c, 'jade', r.rw.jade, b.x + 14, b.y + 158, 40);
      ui.rewardCell(c, 'credits', r.rw.credits, b.x + 60, b.y + 158, 40);
      ui.suSetCells(c, r.w, r.rw.sets, b.x + 112, b.y + 158, 40);
      const set = r.w.set && H.RELIC_SETS[r.w.set];
      ui.text(set ? 'Украшения: ' + set.name : 'Украшения: случайный планарный набор', b.x + 14, b.y + 214, { size: 10, col: '#80e0ff' });
      ui.text(r.first ? 'Первое прохождение бесплатно' : 'Повтор: ' + r.cost + ' энергии освоения', b.x + 14, b.y + 232, { size: 10, col: C.sub });
      const claims = this.game.suClaims().length, paths = this.game.suPaths().length;
      ui.text('Открытые Пути: ' + paths + ' из ' + Object.keys(H.SU.PATHS).length + (claims ? ' · награды ждут: ' + claims : ''), b.x + 14, b.y + 250, { size: 10, col: claims ? C.gold : C.sub });
      if (!r.open) { ui.guidePadlock(c, b.x + b.w / 2, b.y + 292, '#8a7aa8'); ui.text('Сначала пройдите прошлый мир', b.x + b.w / 2, b.y + 312, { align: 'center', size: 11, col: '#c8b8e8' }); return; }
      ui.guideGoBig(c, b.x + 40, b.y + b.h - 40, b.w - 80, 'Перейти к испытанию', () => ui.guideEnter(r), true);
    },

    guideTreasureView(c, scr) {
      const ui = this, g = this.game, t = g.guideTreasure(), done = t.stars >= t.total, fiction = g.guidePf();
      ui.guideSideRow(c, ACT.x, ACT.y, 'Зал забвения', (done ? '✓ ' : '') + '★ ' + t.stars + ' / ' + t.total, scr.tsel === 0, t.open, 0, scr, 'tsel');
      ui.guideSideRow(c, ACT.x, ACT.y + 64, 'Чистый вымысел', fiction.open ? (fiction.stars >= fiction.total ? '✓ ' : '') + '★ ' + fiction.stars + ' / ' + fiction.total : 'Закрыт', scr.tsel === 1, fiction.open, 1, scr, 'tsel');
      if (scr.tsel === 1) { ui.guidePfView(c, fiction); return; }
      const b = ui.guideStage(c, cc => ui.fhBackdrop(cc));
      ui.text(t.name, b.x + b.w - 14, b.y + 14, { align: 'right', size: 16, bold: true, serif: true, col: C.gold });
      ui.text('Зал забвения · пройдено этапов: ' + t.cleared + ' из ' + H.FH.STAGES.length, b.x + b.w - 14, b.y + 38, { align: 'right', size: 10, col: C.cream });
      ui.text('★', b.x + b.w / 2 - 34, b.y + 70, { align: 'center', size: 28, bold: true, col: '#ffd060' });
      ui.text(t.stars + ' / ' + t.total, b.x + b.w / 2 + 14, b.y + 76, { align: 'center', size: 20, bold: true, serif: true, col: C.cream });
      ui.text('Награды за звёзды', b.x + 14, b.y + 120, { size: 11, bold: true, col: C.cream });
      t.tiers.forEach((tr, i) => {
        const tx = b.x + 18 + (i % 8) * 36, ty = b.y + 142 + Math.floor(i / 8) * 36, col = tr.got ? '#6a8a6a' : tr.ready ? '#ffd060' : '#4a4e68';
        c.fillStyle = '#010208'; c.fillRect(tx - 1, ty - 1, 30, 30);
        c.fillStyle = tr.ready && !tr.got ? 'rgba(255,208,96,' + (0.35 + 0.25 * Math.sin(ui.t * 5)) + ')' : 'rgba(255,255,255,0.08)'; c.fillRect(tx, ty, 28, 28);
        c.strokeStyle = col; c.strokeRect(tx + 0.5, ty + 0.5, 27, 27);
        ui.text(tr.got ? '✓' : String(tr.need), tx + 14, ty + 8, { align: 'center', size: 10, bold: true, col: col });
      });
      const ready = t.tiers.filter(tr => tr.ready && !tr.got).length;
      ui.text(ready ? 'Можно забрать: ' + ready + ' (F)' : 'Новых наград нет', b.x + 14, b.y + 222, { size: 10, col: ready ? C.gold : C.sub });
      ui.text('Эхо Зала на этой неделе: ' + t.echo + ' из ' + t.echoMax, b.x + 14, b.y + 244, { size: 10, col: C.cream });
      ui.text('«Шутки сбываются»: обновление через ' + t.shopLeft + ' дн.', b.x + 14, b.y + 260, { size: 10, col: C.cream });
      if (!t.open) return;
      ui.guideShopBtn(c, b);
      ui.guideGoBig(c, b.x + 60, b.y + b.h - 40, b.w - 80, 'Перейти к испытанию', () => ui.guideEnter(t), true);
    },

    guideShopBtn(c, b) {
      const ui = this;
      c.fillStyle = '#010208'; c.beginPath(); c.arc(b.x + 34, b.y + b.h - 27, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e6dec8'; c.beginPath(); c.arc(b.x + 34, b.y + b.h - 27, 13, 0, Math.PI * 2); c.fill();
      G.menuIcon(c, 'bag', b.x + 23, b.y + b.h - 38, 22, PAPER.ink);
      ui.hit(b.x + 19, b.y + b.h - 42, 30, 30, () => ui.openFhShop(() => {}));
    },

    guideCosmicKey(scr, k) {
      const ui = this, list = this.game.guideCosmic();
      if (k === 'up' || k === 'down') { scr.wsel = (scr.wsel + (k === 'up' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return true; }
      if (k === 'ok') { ui.guideEnter(list[scr.wsel]); return true; }
      return false;
    },

    guideTreasureKey(scr, k, code) {
      const ui = this, g = this.game, fiction = scr.tsel === 1;
      if (k === 'up' || k === 'down') { scr.tsel = 1 - scr.tsel; ui.sfx('select'); return true; }
      if (code === 'KeyF' && fiction) { ui.pfPaid(g.pfUnlocked() ? g.pfClaimAll() : []); return true; }
      if (code === 'KeyF') { const got = g.fhClaimAll(); if (!got.length) { ui.sfx('deny'); return true; } ui.sfx('chest'); ui.toast('Награды за звёзды: ' + got.join(', ')); return true; }
      if (code === 'KeyB') { ui.openFhShop(() => {}); return true; }
      if (k === 'ok') { ui.guideEnter(fiction ? g.guidePf() : g.guideTreasure()); return true; }
      return false;
    },

    dailyGo(scr, t) {
      const ui = this, g = this.game;
      if (t.done && !t.got && !t.full) {
        if (g.dailyClaimTask(t.def.id)) { ui.sfx('chest'); ui.toast('+' + t.def.pts + ' активности'); }
        return;
      }
      if (t.got || t.done || !t.def.go) { ui.sfx('deny'); return; }
      const go = t.def.go;
      if (go === 'index') scr.setTab(H.GUIDE_SECTIONS.findIndex(x => x.id === 'index'));
      else if (go === 'field') { ui.screens = []; ui.sfx('cancel'); }
      else if (go === 'su') { const w = g.guideCosmic().find(r => r.open); if (w) ui.guideEnter(w); else ui.sfx('deny'); }
      else if (go === 'synth') ui.openSynth();
      else if (go === 'trace') ui.guideOpenChar(g.guideTarget() && g.guideOwned(g.guideTarget()) ? g.guideTarget() : g.state.party[0], 'traces');
      else if (go === 'item') ui.openInventory(0);
      else if (go === 'levelup') ui.openLevelUp(g.guideTarget() && g.guideOwned(g.guideTarget()) ? g.guideTarget() : g.state.party[0]);
      else if (go === 'coneup') {
        const worn = g.state.party.map(k => g.state.roster[k].cone).find(uid => uid != null);
        if (worn != null) ui.openConeUp(worn); else ui.openInventory(4);
      }
    },

    dailyStepClaim(i) {
      const ui = this, got = this.game.dailyClaimStep(i);
      if (!got) { ui.sfx('deny'); return; }
      ui.sfx('chest'); ui.toast('Награда тренировки: ' + got.join(', '));
    },

    guideDailyView(c, scr) {
      const ui = this, g = this.game, d = g.dailySync(), steps = g.dailySteps(), tasks = g.dailyTasks();
      const mx = DAY.mx, my = DAY.my, x0 = DAY.bx, x1 = DAY.bx + DAY.bw;
      c.fillStyle = '#010208'; c.beginPath(); c.arc(mx, my, 32, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.brass; c.beginPath(); c.arc(mx, my, 31, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fbf6e8'; c.beginPath(); c.arc(mx, my, 28, 0, Math.PI * 2); c.fill();
      G.itemIcon(c, 'activity', mx - 12, my - 24, 24);
      ui.text(String(d.pts), mx, my + 4, { align: 'center', size: 15, bold: true, col: PAPER.ink, shadow: false });
      c.fillStyle = PAPER.bar; c.fillRect(x0, DAY.by - 2, x1 - x0, 4);
      c.fillStyle = '#e8a040'; c.fillRect(x0, DAY.by - 2, (x1 - x0) * Math.min(1, d.pts / 500), 4);
      ui.text('0', x0, DAY.by + 14, { align: 'center', size: 11, col: PAPER.ink, shadow: false });
      steps.forEach((st, i) => {
        const cx = x0 + (i + 1) * (x1 - x0) / steps.length, on = scr.dfocus === 'steps' && scr.dstep === i;
        c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, DAY.by, 14, 0, Math.PI * 2); c.fill();
        c.fillStyle = st.got ? '#fbf6e8' : st.ready ? 'rgb(255,' + Math.round(200 + 30 * Math.sin(ui.t * 5)) + ',96)' : '#e6dec8'; c.beginPath(); c.arc(cx, DAY.by, 13, 0, Math.PI * 2); c.fill();
        c.strokeStyle = st.got || st.ready ? '#e8a040' : PAPER.bar; c.lineWidth = 2; c.beginPath(); c.arc(cx, DAY.by, 12, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        if (st.got) ui.text('✓', cx, DAY.by - 8, { align: 'center', size: 14, bold: true, col: '#e8a040', shadow: false });
        else G.itemIcon(c, 'jade', cx - 9, DAY.by - 9, 18);
        if (on) { c.strokeStyle = PAPER.ink; c.lineWidth = 2; c.strokeRect(cx - 17.5, DAY.by - 17.5, 35, 35); c.lineWidth = 1; }
        ui.text(String(st.need), cx, DAY.by + 18, { align: 'center', size: 11, bold: true, col: PAPER.ink, shadow: false });
        ui.hit(cx - 16, DAY.by - 16, 32, 46, () => { scr.dfocus = 'steps'; if (scr.dstep === i) ui.dailyStepClaim(i); else scr.dstep = i; });
      });
      const sel = steps[scr.dfocus === 'steps' ? scr.dstep : Math.max(0, steps.findIndex(st => !st.got))] || steps[4], r = sel.reward;
      const ry = DAY.by + 36;
      ui.text('Награда за ' + sel.need + ':', x0, ry + 6, { size: 10, bold: true, col: PAPER.ink, shadow: false });
      let rx = x0 + 96;
      ui.text('+' + r.exp + ' опыта Освоения', rx, ry + 6, { size: 10, col: PAPER.sub, shadow: false });
      rx += ui.measure('+' + r.exp + ' опыта Освоения', 10) + 10;
      const cells = [['jade', r.jade]].concat(r.credits ? [['credits', r.credits]] : [], Object.entries(r.items));
      cells.forEach(([id, n], i) => ui.rewardCell(c, id, n, rx + i * 34, ry, 28));
      const cards = DAY.cards, top = ui.listTop(scr.dsc, scr.dcard, tasks.length, cards.vis);
      tasks.slice(top, top + cards.vis).forEach((t, j) => {
        const i = top + j, x = cards.x + j * (cards.w + cards.gap), y = cards.y, on = scr.dfocus === 'cards' && scr.dcard === i;
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 3, y + 3, cards.w, cards.h);
        c.fillStyle = '#fbf6e8'; c.fillRect(x, y, cards.w, cards.h);
        c.fillStyle = '#efe0b8'; c.fillRect(x, y, 104, 20);
        ui.text('Прогресс  ' + Math.min(t.prog, t.def.need) + ' / ' + t.def.need, x + 8, y + 4, { size: 10, col: PAPER.ink, shadow: false });
        c.strokeStyle = '#d8b878'; c.setLineDash([2, 2]); c.strokeRect(x + 8.5, y + 28.5, cards.w - 17, cards.h - 82); c.setLineDash([]);
        ui.wrap(t.def.text, cards.w - 28, 12).slice(0, 4).forEach((l, k) => ui.text(l, x + 14, y + 36 + k * 16, { size: 12, col: PAPER.ink, shadow: false }));
        c.fillStyle = '#f0e8d4'; c.fillRect(x + 9, y + cards.h - 92, cards.w - 18, 36);
        G.itemIcon(c, 'activity', x + 14, y + cards.h - 88, 28);
        ui.text('+' + t.def.pts, x + 46, y + cards.h - 90, { size: 15, bold: true, col: PAPER.ink, shadow: false });
        ui.text('Активность', x + 46, y + cards.h - 72, { size: 10, col: PAPER.sub, shadow: false });
        const by = y + cards.h - 46, ready = t.done && !t.got && !t.full;
        c.fillStyle = '#3a3426'; c.fillRect(x, by, cards.w, 46);
        c.fillStyle = ready ? C.brassHi : C.brassDk; c.fillRect(x, by, cards.w, 2);
        const label = t.got ? 'Получено' : t.full ? 'Активность заполнена' : t.done ? 'Получить' : t.def.go ? 'Перейти' : 'Выполняется';
        ui.wrap(label, cards.w - 16, 12).slice(0, 2).forEach((l, k, all) => ui.text(l, x + cards.w / 2, by + (all.length > 1 ? 8 : 15) + k * 15, { align: 'center', size: 12, bold: ready, col: t.got ? C.dim : ready ? C.gold : '#e8c890' }));
        if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, cards.w + 2, cards.h + 2); c.lineWidth = 1; }
        ui.hit(x, y, cards.w, cards.h, () => { scr.dfocus = 'cards'; if (scr.dcard === i) ui.dailyGo(scr, t); else { scr.dcard = i; ui.sfx('select'); } });
      });
      if (top > 0) ui.text('◄', cards.x - 12, cards.y + cards.h / 2, { size: 12, bold: true, col: PAPER.ink, shadow: false });
      if (top + cards.vis < tasks.length) ui.text('►', cards.x + cards.vis * (cards.w + cards.gap) - 4, cards.y + cards.h / 2, { size: 12, bold: true, col: PAPER.ink, shadow: false });
      ui.wheelZone(cards.x, cards.y, cards.vis * (cards.w + cards.gap), cards.h, dd => { scr.dcard = Math.max(0, Math.min(tasks.length - 1, scr.dcard + dd)); });
      const mins = Math.ceil(g.dailyLeft() / 60000);
      ui.text('Обновление через ' + mins + ' мин.', BODY.x + BODY.w - 16, BODY.y + BODY.h - 20, { align: 'right', size: 12, col: PAPER.ink, shadow: false });
    },

    guideDailyKey(scr, k, code) {
      const ui = this, g = this.game, tasks = g.dailyTasks();
      if (code === 'KeyF') { const got = g.dailyClaimAll(); if (!got.length) { ui.sfx('deny'); return true; } ui.sfx('chest'); ui.toast('Тренировка: ' + got.join(', ')); return true; }
      if (scr.dfocus === 'steps') {
        if (k === 'left' || k === 'right') { scr.dstep = Math.max(0, Math.min(4, scr.dstep + (k === 'left' ? -1 : 1))); ui.sfx('select'); return true; }
        if (k === 'down' || k === 'back') { scr.dfocus = 'cards'; ui.sfx('select'); return true; }
        if (k === 'ok') { ui.dailyStepClaim(scr.dstep); return true; }
        return k === 'up';
      }
      if (k === 'left' || k === 'right') { scr.dcard = Math.max(0, Math.min(tasks.length - 1, scr.dcard + (k === 'left' ? -1 : 1))); ui.sfx('select'); return true; }
      if (k === 'up') { scr.dfocus = 'steps'; const st = g.dailySteps(); scr.dstep = Math.max(0, st.findIndex(x => x.ready && !x.got)); ui.sfx('select'); return true; }
      if (k === 'ok' && tasks[scr.dcard]) { ui.dailyGo(scr, tasks[scr.dcard]); return true; }
      return false;
    },

    openGuideRules(tab) {
      const ui = this, R = H.GUIDE_RULES, sec = H.GUIDE_SECTIONS[tab];
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = 70, y = 56, w = 500, h = 368;
          ui.win(x, y, w, h, { title: 'Правила' });
          let ly = y + 20;
          for (const p of R.intro) { const lines = ui.wrap(p, w - 40, 11); lines.forEach((l, i) => ui.text(l, x + 20, ly + i * 14, { size: 11, col: C.cream })); ly += lines.length * 14 + 6; }
          ui.text(R.sign, x + w - 20, ly, { align: 'right', size: 10, col: C.sub });
          ly += 22;
          c.fillStyle = C.brassDk; c.fillRect(x + 20, ly, w - 40, 1);
          ly += 10;
          ui.text(sec.label, x + 20, ly, { size: 12, bold: true, serif: true, col: C.gold });
          ly += 20;
          ui.wrap(R[sec.id] || 'Раздел появится в следующем обновлении Путеводителя.', w - 40, 11).forEach((l, i) => ui.text(l, x + 20, ly + i * 14, { size: 11, col: C.cream }));
          ui.hints([['Enter', 'Закрыть']], W / 2, y + h + 8, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openIpg(tab) {
      const ui = this, g = this.game, S = H.GUIDE_SECTIONS;
      const first = S.findIndex((s, i) => !ui.guideLock(i));
      const start = typeof tab === 'string' ? S.findIndex(s => s.id === tab) : tab;
      this.push({
        full: true, tab: start >= 0 ? start : first, act: 0, card: 0, focus: 'list', cat: g.guideTarget() ? 0 : 1, row: 0, isc: { top: 0 }, trow: 0, tsc: { top: 0 }, wsel: 0, tsel: 0, dfocus: 'cards', dcard: 0, dstep: 0, dsc: { top: 0 },
        setTab(i) { this.tab = (i + S.length) % S.length; this.focus = 'list'; ui.sfx('select'); },
        draw(c) {
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(0, 0, W, HGT);
          ui.guideHeader(c, this);
          ui.guideTabs(c, this);
          ui.guidePaper(c);
          const lock = ui.guideLock(this.tab);
          if (lock) ui.guideLockedBody(c, lock);
          else if (S[this.tab].id === 'trail') ui.guideTrail(c, this);
          else if (S[this.tab].id === 'index') ui.guideIndex(c, this);
          else if (S[this.tab].id === 'daily') ui.guideDailyView(c, this);
          else if (S[this.tab].id === 'cosmic') ui.guideCosmicView(c, this);
          else if (S[this.tab].id === 'treasure') ui.guideTreasureView(c, this);
          const hints = [['Q/E', 'Раздел'], ['I', 'Правила']];
          if (!lock && S[this.tab].id === 'trail') hints.push(['↑↓←→', 'Выбор'], ['Enter', this.focus === 'cards' ? 'Глава' : 'Открыть']);
          if (!lock && S[this.tab].id === 'index') hints.push(['↑↓←→', 'Выбор'], ['Enter', this.focus === 'rows' ? 'Войти' : 'Открыть']);
          if (!lock && S[this.tab].id === 'index' && H.GUIDE_INDEX[this.cat].id === 'target') hints.push(['C', 'Цель'], ['R', 'Рекомендуемые']);
          if (!lock && S[this.tab].id === 'index' && this.focus === 'rows') hints.push(['F', 'Купон']);
          if (!lock && S[this.tab].id === 'index' && this.focus === 'rows' && H.GUIDE_INDEX[this.cat].id !== 'target') hints.push(['L', 'Испытание']);
          if (!lock && S[this.tab].id === 'daily') hints.push(['←→', 'Задача'], ['↑↓', 'Шкала'], ['Enter', 'Получить'], ['F', 'Всё']);
          if (!lock && S[this.tab].id === 'cosmic') hints.push(['↑↓', 'Мир'], ['Enter', 'Перейти']);
          if (!lock && S[this.tab].id === 'treasure') hints.push(['↑↓', 'Режим'], ['Enter', 'Перейти'], ['B', 'Лавка'], ['F', 'Награды']);
          ui.hints(hints.concat([['Esc', 'Закрыть']]), 12, HGT - 18);
        },
        key(k, code) {
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(this.tab + (code === 'KeyQ' ? -1 : 1)); return; }
          if (code === 'KeyI') { ui.openGuideRules(this.tab); return; }
          if (!ui.guideLock(this.tab) && S[this.tab].id === 'trail' && ui.guideTrailKey(this, k)) return;
          if (!ui.guideLock(this.tab) && S[this.tab].id === 'index' && ui.guideIndexKey(this, k, code)) return;
          if (!ui.guideLock(this.tab) && S[this.tab].id === 'daily' && ui.guideDailyKey(this, k, code)) return;
          if (!ui.guideLock(this.tab) && S[this.tab].id === 'cosmic' && ui.guideCosmicKey(this, k)) return;
          if (!ui.guideLock(this.tab) && S[this.tab].id === 'treasure' && ui.guideTreasureKey(this, k, code)) return;
          if (k === 'back') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
