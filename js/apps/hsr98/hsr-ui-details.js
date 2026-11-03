(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const UP = H.UI.prototype;
  const BTN = { x: 15, y: 326, w: 34, h: 30 };
  const SIDES = [['foe', 'Противники'], ['ally', 'Союзники']];
  const SUB = { foe: 'Описание противника', ally: 'Описание союзника' };
  const TABS = { foe: ['Подробнее', 'Умения', 'История'], ally: ['Подробнее', 'Умения', 'Световой конус'], summon: ['Подробнее'] };
  const STRIP = { x: 344, y: 6, size: 30, step: 34, vis: 7 };
  const LEFT = { x: 8, y: 48, w: 228, h: 394 };
  const PANE = { x: 244, y: 48, w: 388, h: 394 };
  const VIEW = { x: 256, y: 84, w: 348, h: 324 };
  const LINE = 14;
  const GROUPS = [['buff', 'Положительные эффекты', C.ok, '▲'], ['debuff', 'Отрицательные эффекты', C.bad, '▼'], ['other', 'Другие эффекты', C.brassHi, '◆']];
  const FOE_SIZE = { boss: 220, elite: 200, normal: 180 };
  const TIER_COL = { boss: '#ff7070', elite: C.gold, normal: C.sub };
  const SKILL_LABEL = { basic: 'Атака', skill: 'Навык', ult: 'Абсолютная' };
  const alive = u => !!u && !u.dead && !u.gone;
  const nightmare = u => (u.dForm != null ? u.dForm : !!(u.flags && u.flags.nightmare > 0));

  Object.assign(UP, {
    bdIdle() {
      const b = this.game && this.game.battle, bt = this.bt;
      return !!(b && bt && !b.over && b.phase === 'input' && !bt.queue.length && !bt.cur && !bt.ult && !bt.result && !bt.elHelp && !(bt.intro > 0) && !(this.chainOpen && this.chainOpen()));
    },

    bdAsk(u) {
      const bt = this.bt;
      if (!bt || bt.result || !this.game.battle) return;
      if (bt.bdWant) {
        if (u && bt.bdWant.u !== u) { bt.bdWant.u = u; this.sfx('select'); return; }
        this.bdDrop();
        this.sfx('cancel');
        return;
      }
      if (this.bdIdle()) { this.openBattleDetails(u || null); return; }
      bt.bdWant = { u: u || null };
      if (bt.auto) { bt.auto = false; bt.bdResume = true; }
      this.sfx('select');
    },

    bdDrop() {
      const bt = this.bt;
      bt.bdWant = null;
      if (bt.bdResume) { bt.auto = true; bt.bdResume = false; }
    },

    bdUnits(side) {
      const b = this.game.battle;
      if (!b) return [];
      if (side === 'ally') return b.allies.concat(b.livingSummons ? b.livingSummons.filter(u => u.appear !== false) : []);
      const lay = [...this.enemyLayout().keys()].filter(alive);
      return lay.length ? lay : b.living;
    },

    openBattleDetails(u) {
      const ui = this, bt = this.bt, b = this.game.battle;
      if (!bt || !b) return null;
      const st = bt.bd || (bt.bd = { tab: { foe: 0, ally: 0 }, pick: { foe: null, ally: null }, ext: false, ab: 0 });
      let side = u ? (u.side === 'enemy' ? 'foe' : 'ally') : bt.allyMode ? 'ally' : 'foe';
      if (!this.bdUnits(side).length) side = side === 'foe' ? 'ally' : 'foe';
      const want = u || (side === 'ally' ? bt.allyMode && bt.allyMode.target : bt.target);
      const s = this.push({
        name: 'battleDetails', pause: true, bd: true, side, unit: null, sc: { top: 0 },
        list() { return ui.bdUnits(this.side); },
        choose(x) {
          const l = this.list(), keep = st.pick[this.side];
          this.unit = l.includes(x) ? x : l.includes(keep) ? keep : l[0] || null;
          st.pick[this.side] = this.unit;
          this.sc.top = 0;
        },
        tabs() { return this.unit && this.unit.summon ? TABS.summon : TABS[this.side]; },
        tab() { return this.unit && this.unit.summon ? 0 : st.tab[this.side]; },
        setTab(i) { if (this.unit && this.unit.summon) return; const n = TABS[this.side].length; st.tab[this.side] = (i + n) % n; this.sc.top = 0; ui.sfx('select'); },
        setSide(id) {
          if (id === this.side) return;
          if (!ui.bdUnits(id).length) { ui.sfx('deny'); return; }
          this.side = id;
          this.choose(null);
          ui.sfx('select');
        },
        step(d) {
          const l = this.list();
          if (l.length < 2) return;
          this.choose(l[(l.indexOf(this.unit) + d + l.length) % l.length]);
          ui.sfx('select');
        },
        draw(c) { ui.bdDraw(c, this); },
        key(k, code) {
          if (k === 'back' || code === 'KeyC') { ui.pop(); return; }
          if (code === 'Tab') { this.setSide(this.side === 'foe' ? 'ally' : 'foe'); return; }
          if (k === 'left' || k === 'right') { this.step(k === 'left' ? -1 : 1); return; }
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(this.tab() + (code === 'KeyQ' ? -1 : 1)); return; }
          if ((k === 'up' || k === 'down') && this.side === 'ally' && this.tab() === 1 && this.unit) {
            const n = ui.bdSkillItems({ u: this.unit }).length;
            st.ab = ((st.ab || 0) + (k === 'up' ? -1 : 1) + n) % n;
            this.sc.top = 0;
            ui.sfx('select');
            return;
          }
          if (k === 'up' || k === 'down') { this.sc.top += k === 'up' ? -1 : 1; return; }
          if (code === 'PageUp' || code === 'PageDown') this.sc.top += (code === 'PageUp' ? -1 : 1) * Math.floor(VIEW.h / LINE);
          if (k === 'ok' && this.side === 'ally' && this.tab() === 0 && !(this.unit && this.unit.summon)) { st.ext = !st.ext; this.sc.top = 0; ui.sfx('select'); }
        },
        onClose() { if (bt.bdResume) { bt.auto = true; bt.bdResume = false; } }
      });
      s.choose(want);
      return s;
    },

    bdButton(c) {
      const bt = this.bt;
      if (!bt || bt.result || bt.intro > 0) return;
      const { x, y, w, h } = BTN, want = !!bt.bdWant;
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      const gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, '#2a3478'); gr.addColorStop(1, '#0e1438');
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      const a = want ? 0.5 + 0.5 * Math.sin(this.t * 8) : 1;
      c.strokeStyle = want ? 'rgba(255,236,170,' + a.toFixed(2) + ')' : C.brass; c.lineWidth = want ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
      c.strokeStyle = C.brassHi; c.lineWidth = 2;
      c.beginPath(); c.arc(x + 14, y + 12, 6, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x + 18.5, y + 16.5); c.lineTo(x + 24, y + 22); c.stroke(); c.lineWidth = 1;
      c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(x + 11, y + 9, 3, 2);
      this.keycap(x + w - 11, y + h - 8, 'C');
      this.hit(x - 1, y - 1, w + 2, h + 2, () => this.bdAsk(null));
    },

    bdDraw(c, s) {
      const b = this.game.battle;
      if (!b) return;
      if (s.unit && !s.list().includes(s.unit)) s.choose(null);
      const m = s.unit ? H.BD.model(b, s.unit, this.game) : null;
      c.fillStyle = 'rgba(2,3,12,0.9)'; c.fillRect(0, 0, W, HGT);
      c.fillStyle = this.dither(); c.fillRect(0, 0, W, HGT);
      this.bdHeader(c, s, b);
      this.bdScene(c, m);
      this.bdPane(c, s, m);
      this.hints([['←→', 'юнит'], ['Tab', 'сторона'], ['Q E', 'вкладка'], ['↑↓', s.side === 'ally' && s.tab() === 1 ? 'умение' : 'прокрутка']].concat(s.side === 'ally' && s.tab() === 0 && !(s.unit && s.unit.summon) ? [['Enter', 'характеристики']] : [], [['Esc', 'в бой']]), W / 2, 454, { align: 'center' });
    },

    bdHeader(c, s, b) {
      this.plate(12, 8, 'Детали боя');
      const wave = b.waves && b.waves.length > 1 ? ' · волна ' + (b.wave + 1) + '/' + b.waves.length : '';
      this.text(SUB[s.side] + wave, 14, 31, { size: 10, col: C.sub });
      this.keycap(128, 11, 'Tab');
      SIDES.forEach(([id, label], i) => this.button(158 + i * 88, 7, 84, 20, label, () => s.setSide(id), { active: s.side === id, size: 10 }));
      this.bdStrip(c, s, b);
      this.closeBtn(W - 30, 8, () => this.pop());
    },

    bdStrip(c, s, b) {
      const list = s.list(), { x, y, size, step, vis } = STRIP, n = list.length;
      const start = Math.max(0, Math.min(list.indexOf(s.unit) - Math.floor(vis / 2), n - vis));
      for (let i = start; i < Math.min(n, start + vis); i++) {
        const u = list[i], ix = x + (i - start) * step, on = u === s.unit, ally = u.side === 'ally';
        c.fillStyle = '#000'; c.fillRect(ix - 1, y - 1, size + 2, size + 2);
        const gr = c.createLinearGradient(0, y, 0, y + size);
        gr.addColorStop(0, ally ? '#2a4a9a' : '#8a2a2a'); gr.addColorStop(1, ally ? '#101a44' : '#3a0c10');
        c.fillStyle = gr; c.fillRect(ix, y, size, size);
        this.turnIcon(c, u, ix, y, size);
        if (!alive(u)) { c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(ix, y, size, size); }
        c.strokeStyle = on ? C.brassHi : ally ? '#6a8ad8' : '#d86a6a'; c.lineWidth = on ? 2 : 1; c.strokeRect(ix - 0.5, y - 0.5, size + 1, size + 1); c.lineWidth = 1;
        if (b.current === u) this.diamond(ix + size - 4, y + 4, 3, C.brassHi, '#1a1208');
        if (on) this.diamond(ix + size / 2, y + size + 5, 3, C.brassHi, '#1a1208');
        this.hit(ix - 1, y - 1, size + 2, size + 2, () => { if (s.unit !== u) { s.choose(u); this.sfx('select'); } });
      }
      if (start > 0) this.diamond(x - 7, y + size / 2, 3, C.brassHi);
      if (start + vis < n) this.diamond(x + vis * step - 1, y + size / 2, 3, C.brassHi);
    },

    bdScene(c, m) {
      const { x, y, w, h } = LEFT, cx = x + w / 2, foot = y + h - 62;
      this.win(x, y, w, h);
      if (!m) return;
      const u = m.u;
      const label = m.foe ? H.BD.TIER[m.tier] : m.summon ? 'ПРИЗЫВ' : H.PATHS[m.path].name + ' · ' + H.ELEMENTS[m.elem].name;
      this.text(label, cx, y + 12, { align: 'center', size: 10, bold: true, col: m.foe ? TIER_COL[m.tier] : C.sub });
      this.platform(c, cx, foot, 72);
      if (m.foe) G.drawEnemy(c, u.data, cx, foot + 4, FOE_SIZE[m.tier], { t: this.t });
      else if (m.summon) {
        const gr = c.createLinearGradient(0, foot - 170, 0, foot - 50);
        gr.addColorStop(0, '#2a4a9a'); gr.addColorStop(1, '#101a44');
        c.fillStyle = '#000'; c.fillRect(cx - 61, foot - 171, 122, 122);
        c.fillStyle = gr; c.fillRect(cx - 60, foot - 170, 120, 120);
        this.turnIcon(c, u, cx - 60, foot - 170, 120);
        c.strokeStyle = C.brass; c.strokeRect(cx - 60.5, foot - 170.5, 121, 121);
      }
      else if (nightmare(u)) G.drawEnemy(c, { id: 'scar_nightmare', boss: true }, cx, foot + 4, 200, { t: this.t });
      else G.drawFigure(c, G.lookOf(u.charId, this.game), cx, foot + 2, 3, { alpha: m.dead ? 0.4 : 1 });
      const order = this.bt && this.bt.order, av = order && order.av ? order.av.get(u) : null;
      const line = m.dead ? 'Повержен' : m.current ? 'Ходит сейчас' : av != null ? 'До хода: ' + Math.max(0, Math.round(av)) : '';
      if (line) this.text(line, cx, y + h - 34, { align: 'center', size: 11, bold: true, col: m.dead ? C.bad : m.current ? C.gold : C.cream });
    },

    bdPane(c, s, m) {
      const { x, y, w, h } = PANE, tabs = s.tabs(), tab = s.tab();
      this.win(x, y, w, h);
      this.keycap(x + 10, y + 11, 'Q');
      tabs.forEach((label, i) => this.button(x + 30 + i * 110, y + 7, 106, 20, label, () => { if (s.tab() !== i) s.setTab(i); }, { active: i === tab, size: 10 }));
      this.keycap(x + w - 26, y + 11, 'E');
      if (!m) return;
      if (!m.foe && tab === 1) {
        const items = this.bdSkillItems(m), view = { x: VIEW.x, y: VIEW.y + 54, w: VIEW.w, h: VIEW.h - 54 };
        this.bdSkillIcons(c, s, m, items);
        this.bdRows(c, s, this.bdSkillRows(m, items), view);
      } else this.bdRows(c, s, tab === 0 ? this.bdInfoRows(m, s) : m.foe && tab === 1 ? this.bdFoeSkillRows(m) : m.foe ? this.bdLoreRows(m) : this.bdConeRows(m));
      if (tab !== 0) return;
      c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(x + 10, y + h - 32, w - 20, 1);
      this.text('Статусы', x + 14, y + h - 24, { size: 10, bold: true, serif: true, col: C.gold });
      this.text('Усиления: ' + m.counts.buff + ' | Ослабления: ' + m.counts.debuff, x + w - 14, y + h - 24, { align: 'right', size: 10, col: C.cream });
    },

    bdRows(c, s, rows, view) {
      const { x, y, w, h } = view || VIEW, total = rows.reduce((a, r) => a + r.h, 0), n = Math.ceil(total / LINE), max = Math.floor(h / LINE);
      s.sc.top = Math.max(0, Math.min(Math.round(s.sc.top), Math.max(0, n - max)));
      if (n > max) this.scrollBar(x + w + 4, y, h, s.sc, n, max);
      this.wheelZone(x, y, w, h, d => { s.sc.top += d * 2; });
      c.save();
      c.beginPath(); c.rect(x - 4, y, w + 8, h); c.clip();
      let yy = y - s.sc.top * LINE;
      for (const r of rows) { if (yy + r.h > y && yy < y + h) r.draw(yy); yy += r.h; }
      c.restore();
    },

    bdBarRow(label, f, col, value, shieldF) {
      const { x, w } = VIEW, bx = x + 72, bw = w - 72 - 96;
      return { h: 18, draw: y => {
        this.text(label, x, y + 2, { size: 10, col: C.sub });
        this.bar(bx, y + 5, bw, 6, f, col);
        if (shieldF > 0) { const c = this.ctx; c.fillStyle = 'rgba(140,200,255,0.9)'; c.fillRect(bx, y + 5, Math.round(Math.min(1, shieldF) * bw), 2); }
        this.text(value, x + w, y + 2, { align: 'right', size: 10, bold: true, col: C.cream });
      } };
    },

    bdInfoRows(m, s) {
      const { x, w } = VIEW, c = this.ctx;
      const rows = m.foe ? this.bdFoeHead(m) : m.summon ? this.bdSummonHead(m) : this.bdAllyHead(m, s);
      rows.push({ h: 6, draw: () => { } });
      if (!GROUPS.some(([k]) => m.statuses[k].length)) rows.push({ h: 64, draw: y => { this.diamond(x + w / 2, y + 16, 9, 'rgba(154,166,208,0.18)', 'rgba(154,166,208,0.5)'); this.text('Нет статуса', x + w / 2, y + 32, { align: 'center', size: 11, col: C.dim }); } });
      for (const [k, label, col, mark] of GROUPS) {
        const list = m.statuses[k];
        if (!list.length) continue;
        const head = label + ' ' + list.length;
        rows.push({ h: 18, draw: y => {
          const tw = this.measure(head, 10, true);
          this.text(head, x, y + 3, { size: 10, bold: true, col });
          c.fillStyle = 'rgba(242,220,154,0.22)'; c.fillRect(x + tw + 8, y + 9, Math.max(0, w - tw - 8), 1);
        } });
        for (const st of list) rows.push(this.bdStatusRow(st, col, mark));
        rows.push({ h: 4, draw: () => { } });
      }
      return rows;
    },

    bdNameRow(m, left, tail) {
      const { x, w } = VIEW, lw = this.measure(tail, 11, true) + 12;
      const names = this.wrap(m.name, w - left - lw, 14, true, true).slice(0, 2);
      return { names, row: { h: names.length * 17 + 6, draw: y => {
        names.forEach((l, i) => this.text(l, x + left, y + i * 17, { size: 14, bold: true, serif: true, col: C.gold }));
        this.text(tail, x + w, y + 3, { align: 'right', size: 11, bold: true, col: C.cream });
      } } };
    },

    bdRing(c, m, cx, cy) {
      const ec = H.ELEMENTS[m.elem], f = m.maxEnergy ? Math.min(1, m.energy / m.maxEnergy) : 0, ready = f >= 1;
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(cx, cy, 16, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a1c2c'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = ready ? 'hsl(' + ((this.t * 200) % 360) + ',90%,65%)' : ec.col; c.beginPath(); c.arc(cx, cy, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); c.stroke(); c.lineWidth = 1;
      G.elemIcon(c, m.elem, cx, cy, 8);
    },

    bdStatCell(r, x, y, w) {
      this.text(r.label, x, y + 1, { size: 10, col: C.sub });
      const pw = r.plus ? this.measure(r.plus, 10, true) : 0;
      if (r.plus) this.text(r.plus, x + w, y + 1, { align: 'right', size: 10, bold: true, col: r.delta > 0 ? C.cyan : C.bad });
      this.text(r.text, x + w - (pw ? pw + 4 : 0), y, { align: 'right', size: 11, bold: true, col: C.cream });
    },

    bdAllyHead(m, s) {
      const { x, w } = VIEW, c = this.ctx, st = this.bt.bd, cw = Math.floor((w - 14) / 2);
      const { names, row } = this.bdNameRow(m, 40, 'ур. ' + m.lvl + ' · Э' + m.eid);
      const rows = [{ h: Math.max(42, row.h + 14), draw: y => {
        this.bdRing(c, m, x + 16, y + 18);
        row.draw(y);
        if (m.maxEnergy) this.text('Энергия ' + m.energy + ' / ' + m.maxEnergy, x + 40, y + names.length * 17 + 1, { size: 10, col: m.energy >= m.maxEnergy ? C.gold : C.sub });
      } }];
      rows.push(this.bdBarRow('HP', m.hp / m.maxHp, m.hp / m.maxHp < 0.3 ? '#ff4040' : '#52d67a', m.hp + ' / ' + m.maxHp + (m.shield ? '  Щит ' + m.shield : ''), m.shield / m.maxHp));
      const toggle = (xx, y) => this.button(xx, y, cw, 16, st.ext ? '▲ Пять характеристик' : '▼ Все характеристики', () => { st.ext = !st.ext; s.sc.top = 0; this.sfx('select'); }, { size: 9 });
      const stripe = (y, i) => { if (i % 2 === 0) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x - 2, y - 1, w + 4, 18); } };
      if (!st.ext) {
        const [atk, def, cr, cd, spd] = m.stats.main;
        [[atk, def], [cr, cd], [spd, null]].forEach(([a, b], i) => rows.push({ h: 18, draw: y => {
          stripe(y, i);
          this.bdStatCell(a, x, y + 1, cw);
          if (b) this.bdStatCell(b, x + cw + 14, y + 1, cw);
          else toggle(x + cw + 14, y);
        } }));
      } else {
        m.stats.all.forEach((r, i) => rows.push({ h: 17, draw: y => { stripe(y, i); this.bdStatCell(r, x, y + 1, w); } }));
        rows.push({ h: 20, draw: y => toggle(x + w - cw, y + 2) });
      }
      return rows;
    },

    bdSummonHead(m) {
      const { x, w } = VIEW, rows = [this.bdNameRow(m, 0, 'ур. ' + m.lvl).row];
      if (m.owner) rows.push({ h: 16, draw: y => this.text('Призыв героя: ' + m.owner, x, y + 1, { size: 10, col: C.sub }) });
      if (m.maxHp > 1) rows.push(this.bdBarRow('HP', m.hp / m.maxHp, '#52d67a', m.hp + ' / ' + m.maxHp + (m.shield ? '  Щит ' + m.shield : ''), m.shield / m.maxHp));
      if (m.u.id === 'lord' && m.u.flags) rows.push({ h: 16, draw: y => this.text('Ударов в свой ход: ' + (m.u.flags.hits || 0), x, y + 1, { size: 10, col: C.cream }) });
      if (m.u.id === 'numby' && m.u.flags && m.u.flags.wind > 0) rows.push({ h: 16, draw: y => this.text('Поразительный рост: ещё ' + m.u.flags.wind + ' ' + (m.u.flags.wind === 1 ? 'атака' : 'атаки'), x, y + 1, { size: 10, col: C.cream }) });
      return rows;
    },

    bdFoeHead(m) {
      const { x, w } = VIEW, c = this.ctx, cw = Math.floor((w - 14) / 2), ct = m.contact;
      const rows = [this.bdNameRow(m, 0, 'ур. ' + m.lvl).row];
      rows.push(this.bdBarRow('Стойкость', m.broken ? 0 : m.tough / m.maxTough, '#f4f4f8', m.broken ? 'Пробит' : Math.round(m.tough) + ' / ' + m.maxTough));
      rows.push(this.bdBarRow('HP', m.hp / m.maxHp, '#e04848', Math.ceil(m.hp / m.maxHp * 100) + '%' + (m.shield ? '  Щит ' + m.shield : ''), m.shield / m.maxHp));
      const pc = v => Math.round(v * 100) + '%';
      rows.push({ h: 20, draw: y => { this.text('Уязвимости', x, y + 3, { size: 10, col: C.sub }); this.weakIcons(c, m.u, x + 86, y + 9, 16, 6); this.text('сопр. 0%', x + w, y + 3, { align: 'right', size: 10, col: C.sub }); } });
      if (m.resist.length) rows.push({ h: 20, draw: y => { this.text('Сопротивления', x, y + 3, { size: 10, col: C.sub }); m.resist.forEach((e, i) => G.elemIcon(c, e, x + 86 + i * 16, y + 9, 6)); this.text('сопр. ' + pc(m.resistPct), x + w, y + 3, { align: 'right', size: 10, col: C.sub }); } });
      if (m.others > 0) rows.push({ h: 18, draw: y => { this.text('Остальные стихии', x, y + 2, { size: 10, col: C.sub }); this.text('сопр. ' + pc(m.otherPct), x + w, y + 2, { align: 'right', size: 10, col: C.sub }); } });
      rows.push({ h: 20, draw: y => { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x - 2, y, w + 4, 18); this.bdStatCell(m.spd, x, y + 2, cw); this.bdStatCell(Object.assign({}, m.effRes, { label: 'Сопр. эффектам' }), x + cw + 14, y + 2, cw); } });
      const lines = [];
      if (ct.off) lines.push(['Контакт в этом бою недоступен.', C.dim]);
      else if (!ct.can) lines.push(['Контакт: нельзя' + (m.u.data.boss ? ', босс не слушает.' : '.'), C.dim]);
      else {
        lines.push(['Контакт: можно' + (ct.family ? ' · ' + ct.family : ''), C.cream]);
        if (ct.mood.length) lines.push(['Настроение: ' + ct.mood.join(', '), C.gold]);
        lines.push([ct.known.length ? 'Изученные исходы: ' + ct.known.join(', ') : 'Исходы ещё не изучены.', ct.known.length ? C.sub : C.dim]);
        if (ct.hint.length) lines.push(['Подсказка: ' + ct.hint.join(', '), C.ok]);
      }
      const wrapped = lines.flatMap(([t, col]) => this.wrap(t, w, 10).map(l => [l, col]));
      rows.push({ h: 6 + wrapped.length * 13, draw: y => wrapped.forEach(([l, col], i) => this.text(l, x, y + 4 + i * 13, { size: 10, col })) });
      return rows;
    },

    bdSkillItems(m) {
      const u = m.u, kit = u.kit, eid = (H.traceEidUp && H.traceEidUp(u.charId, u.eid || 0)) || {};
      const lvOf = id => (u.tr && u.tr[id] != null ? { lv: u.tr[id], up: eid[id] || 0 } : null);
      const items = this.abilityRows(kit, u.charId, lvOf).map(r => ({ type: 'ab', r, key: r.key, label: SKILL_LABEL[r.id] }));
      items.push({ type: 'talent', label: 'Талант', lv: lvOf('talent') });
      if (kit.enhanced && kit.showEnhanced) items.push({ type: 'enh', label: 'Усиление' });
      if (kit.elSkill) items.push({ type: 'el', label: 'Радость' });
      if (kit.tech) items.push({ type: 'tech', label: 'Техника' });
      if (kit.contact && kit.contact.length) items.push({ type: 'contact', key: 'T', label: 'Контакт' });
      return items;
    },

    bdNow(u, id) {
      const b = this.game.battle;
      if (!b || !['basic', 'skill', 'ult'].includes(id)) return null;
      const r = b.abilityFor(u, id), base = id === 'basic' ? u.kit.basic : id === 'skill' ? (u.kit.skills ? null : u.kit.skill) : u.kit.ult;
      if (!r || !r.ab) return null;
      return !base || r.kind === 'enhanced' || r.ab.name !== base.name ? r : null;
    },

    bdTough(ab, kind) {
      const b = this.game.battle, dmg = (ab.fx || []).find(f => f.k === 'dmg');
      if (!b || !dmg) return '';
      const main = dmg.tough || b.toughFor(kind, true), adj = ab.target === 'blast' || dmg.adj != null ? dmg.adjTough || b.toughFor(kind, false) : 0;
      return 'Урон стойкости ' + main + (adj ? ' / ' + adj : '');
    },

    bdSkillIcons(c, s, m, items) {
      const { x, y, w } = VIEW, st = this.bt.bd, n = items.length, step = Math.min(50, Math.floor(w / n)), r = 15, u = m.u;
      const sel = Math.min(st.ab || 0, n - 1);
      items.forEach((it, i) => {
        const cx = x + step * i + step / 2, cy = y + 18, on = i === sel, col = on ? C.brassHi : '#c8d0f0';
        c.fillStyle = on ? 'rgba(242,220,154,0.22)' : 'rgba(8,12,36,0.92)'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? C.brassHi : '#3a4a8a'; c.lineWidth = on ? 2 : 1; c.stroke(); c.lineWidth = 1;
        if (it.type === 'ab' && it.r.id === 'basic') G.statIcon(c, 'atk', cx - 8, cy - 8, 16, col);
        else if (it.type === 'ab' && it.r.id === 'skill') G.pathIcon(c, u.kit.path, cx - 9, cy - 9, 18, col);
        else if (it.type === 'ab') G.elemIcon(c, u.elem, cx, cy, 8);
        else if (it.type === 'talent') this.diamond(cx, cy, 7, col, '#0a1020');
        else if (it.type === 'enh') G.statIcon(c, 'dmgP', cx - 8, cy - 8, 16, col);
        else if (it.type === 'el') G.statIcon(c, 'elation', cx - 8, cy - 8, 16, col);
        else this.text(it.type === 'tech' ? '★' : '«»', cx, cy - 7, { align: 'center', size: 12, bold: true, col });
        if (it.key) this.keycap(Math.round(cx - r - 2), y, it.key);
        this.text(it.label, cx, cy + r + 4, { align: 'center', size: 9, bold: on, col: on ? C.gold : C.sub });
        this.hit(cx - step / 2, y, step, 50, () => { if (st.ab !== i) { st.ab = i; s.sc.top = 0; this.sfx('select'); } });
      });
    },

    bdSkillRows(m, items) {
      const { x, w } = VIEW, u = m.u, kit = u.kit, it = items[Math.min(this.bt.bd.ab || 0, items.length - 1)], rows = [];
      let name = '', lv = null, up = 0, tag = '', tough = '', cost = '', now = '', desc = '', list = [];
      if (it.type === 'ab') {
        const r = it.r, eff = this.bdNow(u, r.id), ab = eff ? eff.ab : r.shown;
        name = r.name; lv = r.lv; up = r.up;
        tag = H.BD.allyTag(ab);
        cost = r.id === 'basic' ? '+1 очко навыка' : r.id === 'skill' ? (!kit.skills && kit.skill.noSp ? 'Тратит HP' : '−1 очко навыка') : 'Энергия ' + (u.maxEnergy || kit.energy);
        tough = this.bdTough(ab, eff ? eff.kind : r.id);
        if (eff) now = 'Сейчас: ' + eff.ab.name;
        desc = eff ? eff.ab.text || this.describeFx(eff.ab) : r.desc;
      } else if (it.type === 'talent') { name = 'Талант'; lv = it.lv ? it.lv.lv : null; up = it.lv ? it.lv.up : 0; desc = kit.talent; }
      else if (it.type === 'enh') { name = 'Усиление: ' + kit.enhanced.short; desc = kit.enhanced.text; }
      else if (it.type === 'el') { name = 'Навык Радости: ' + kit.elSkill.name; desc = kit.elSkill.text; }
      else if (it.type === 'tech') { name = kit.tech.name; tag = 'Техника'; desc = kit.tech.text + ' Применяется в поле до боя.'; }
      else { name = 'Контакт'; desc = 'Фраза для врага на клавише T. Исход решают ' + H.TUNING.contactThreshold + ' очка одного настроения.'; list = kit.contact.map(x => '· ' + x.name + ' (' + H.BD.TAGS[x.tag] + ')'); }
      const lvText = lv != null ? 'ур. ' + lv : '', lw = lvText ? this.measure(lvText, 11, true) + 12 : 0;
      const names = this.wrap(name, w - lw, 14, true, true).slice(0, 2);
      rows.push({ h: names.length * 17 + 4, draw: y => {
        names.forEach((l, i) => this.text(l, x, y + i * 17, { size: 14, bold: true, serif: true, col: C.gold }));
        if (lvText) this.text(lvText, x + w, y + 3, { align: 'right', size: 11, bold: true, col: up ? C.cyan : C.cream });
      } });
      if (tag || tough) rows.push({ h: 16, draw: y => { if (tag) this.text('[' + tag + ']', x, y + 1, { size: 10, bold: true, col: C.brassHi }); if (tough) this.text(tough, x + w, y + 1, { align: 'right', size: 10, col: C.sub }); } });
      if (cost) rows.push({ h: 15, draw: y => this.text(cost, x, y + 1, { size: 10, col: C.sub }) });
      if (now) rows.push({ h: 15, draw: y => this.text(now, x, y + 1, { size: 10, bold: true, col: C.ok }) });
      rows.push({ h: 6, draw: () => { } });
      for (const l of this.richWrap(this.bdSegs(desc || ''), w, 11)) rows.push({ h: 14, draw: y => this.richText(l, x, y, { size: 11, col: C.cream, hot: C.gold }) });
      for (const t of list) rows.push({ h: 14, draw: y => this.text(t, x + 4, y, { size: 10, col: C.sub }) });
      return rows;
    },

    bdFoeSkillRows(m) {
      const { x, w } = VIEW, u = m.u, d = u.data, rows = [];
      (d.skills || []).forEach((sk, i) => {
        const f = H.BD.foeSkill(sk, d), mark = u.charging === i ? '◆ следующий ход' : '', tag = '[' + f.tag + ']';
        const side = this.measure(tag, 10, true) + (mark ? this.measure(mark, 10, true) + 10 : 0) + 18;
        const names = this.wrap(f.name, w - side, 11, true).slice(0, 2);
        const lines = this.richWrap(this.bdSegs(f.text), w - 12, 10);
        const warn = f.warn ? this.wrap('В бою: «' + f.warn + '»', w - 12, 10) : [];
        rows.push({ h: names.length * 14 + (lines.length + warn.length) * 12 + 9, draw: y => {
          this.diamond(x + 4, y + 7, 3, mark ? C.gold : C.brass);
          names.forEach((l, j) => this.text(l, x + 12, y + j * 14, { size: 11, bold: true, col: mark ? C.gold : C.cream }));
          this.text(tag, x + w, y + 1, { align: 'right', size: 10, bold: true, col: C.brassHi });
          if (mark) this.text(mark, x + w - this.measure(tag, 10, true) - 10, y + 1, { align: 'right', size: 10, bold: true, col: C.gold });
          let yy = y + names.length * 14 + 1;
          for (const l of lines) { this.richText(l, x + 12, yy, { size: 10, col: C.sub, hot: C.gold }); yy += 12; }
          for (const l of warn) { this.text(l, x + 12, yy, { size: 10, col: C.dim }); yy += 12; }
        } });
      });
      if (!rows.length) rows.push({ h: 40, draw: y => this.text('Умений нет.', x + w / 2, y + 12, { align: 'center', size: 11, col: C.dim }) });
      return rows;
    },

    bdLoreRows(m) {
      const { x, w } = VIEW, c = this.ctx, u = m.u, text = H.foeLore ? H.foeLore(u.id) : null, rows = [];
      const names = this.wrap(u.name, w, 13, true, true).slice(0, 2);
      rows.push({ h: names.length * 16 + 4, draw: y => names.forEach((l, i) => this.text(l, x, y + i * 16, { size: 13, bold: true, serif: true, col: C.gold })) });
      rows.push({ h: 10, draw: y => { c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(x, y + 4, w, 1); } });
      if (!text) rows.push({ h: 40, draw: y => this.text('Записей нет.', x + w / 2, y + 12, { align: 'center', size: 11, col: C.dim }) });
      else for (const p of text.split('\n')) {
        for (const l of this.wrap(p, w, 11)) rows.push({ h: 15, draw: y => this.text(l, x, y, { size: 11, col: C.cream }) });
        rows.push({ h: 6, draw: () => { } });
      }
      const bank = this.game.state.bank && this.game.state.bank.enemies[u.id];
      if (bank) rows.push({ h: 24, draw: y => this.text('Встречен: ' + bank.seen + ' · Побед: ' + bank.kills, x, y + 8, { size: 10, col: C.dim }) });
      return rows;
    },

    bdConeRows(m) {
      const { x, w } = VIEW, c = this.ctx, b = this.game.battle, cone = H.BD.coneOf(this.game, b, m.u);
      if (!cone) {
        const why = b && b.cw ? 'В Валютных войнах фигуры сражаются без световых конусов.' : m.u.trial ? 'Пробный герой выходит в бой без светового конуса.' : '';
        return [{ h: 70, draw: y => {
          c.strokeStyle = 'rgba(154,166,208,0.6)'; c.setLineDash([3, 2]); c.strokeRect(x + 0.5, y + 0.5, 39, 55); c.setLineDash([]);
          this.text('+', x + 20, y + 18, { align: 'center', size: 18, col: C.sub });
          this.text('Конус не надет.', x + 52, y + 12, { size: 12, bold: true, col: C.dim });
          if (why) this.wrap(why, w - 52, 10).forEach((l, i) => this.text(l, x + 52, y + 30 + i * 12, { size: 10, col: C.dim }));
        } }];
      }
      const { d, sup, stats, lvl, match } = cone, tx = x + 92, tw = w - 92, rows = [];
      const names = this.wrap(d.name, tw, 13, true, true).slice(0, 2);
      rows.push({ h: 120, draw: y => {
        G.drawConeCard(c, cone.id, x, y, 80, 112, { info: false });
        let yy = y;
        names.forEach(l => { this.text(l, tx, yy, { size: 13, bold: true, serif: true, col: C.gold }); yy += 16; });
        G.pathIcon(c, d.path, tx, yy + 2, 12);
        this.text(H.PATHS[d.path].name + ' · ' + '★'.repeat(d.rarity), tx + 16, yy + 2, { size: 10, col: G.RARITY[d.rarity] });
        yy += 17;
        this.text((lvl ? 'Ур. ' + lvl.lvl + '/' + lvl.cap + ' · ' : '') + 'Наложение ур. ' + sup, tx, yy, { size: 10, col: C.cream });
        yy += 16;
        [['hp', stats.hp], ['atk', stats.atk], ['def', stats.def]].forEach(([k, v], i) => {
          const sx = tx + i * Math.floor(tw / 3);
          G.statIcon(c, k, sx, yy, 12, '#c8d0f0');
          this.text('+' + v, sx + 15, yy, { size: 10, bold: true, col: C.cream });
        });
        yy += 17;
        this.wrap(match ? 'Пассивка действует' : 'Другой Путь: действуют только характеристики', tw, 10).slice(0, 2).forEach(l => { this.text(l, tx, yy, { size: 10, bold: true, col: match ? C.ok : C.bad }); yy += 12; });
      } });
      rows.push({ h: 10, draw: y => { c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(x, y + 4, w, 1); } });
      rows.push({ h: 18, draw: y => this.text(d.skill || 'Эффект', x, y, { size: 12, bold: true, serif: true, col: match ? C.gold : C.dim }) });
      for (const l of this.coneLines(cone.id, sup, w, 11)) rows.push({ h: 14, draw: y => this.richText(l, x, y, { size: 11, col: match ? C.cream : C.dim, hot: match ? C.gold : C.dim }) });
      if (d.desc) {
        rows.push({ h: 12, draw: y => { c.fillStyle = 'rgba(242,220,154,0.2)'; c.fillRect(x, y + 5, w, 1); } });
        for (const l of d.desc.split('\n').flatMap(p => this.wrap(p, w, 10))) rows.push({ h: 13, draw: y => this.text(l, x, y, { size: 10, col: C.sub }) });
      }
      return rows;
    },

    bdSegs(text) {
      const out = [], re = /([+−]?\d(?:[\d,]|\u00a0(?=\d))*%?)/g;
      let at = 0, m;
      while ((m = re.exec(text))) {
        if (m.index > at) out.push({ t: text.slice(at, m.index) });
        out.push({ t: m[1], hot: true });
        at = re.lastIndex;
      }
      if (at < text.length) out.push({ t: text.slice(at) });
      return out;
    },

    bdStatusRow(st, col, mark) {
      const { x, w } = VIEW, c = this.ctx, off = st.on === false;
      const lines = st.text ? this.richWrap(this.bdSegs(st.text), w - 18, 10).slice(0, 3) : [];
      const name = st.name + (off ? ' (не действует)' : '');
      return { h: 16 + lines.length * 12 + 4, draw: y => {
        if (st.elem) G.elemIcon(c, st.elem, x + 5, y + 7, 5);
        else if (st.icon) G.statIcon(c, st.icon, x - 1, y + 1, 12, off ? C.dim : col);
        else this.text(mark, x + 5, y + 1, { align: 'center', size: 10, col: off ? C.dim : col });
        const room = w - 20 - (st.right ? this.measure(st.right, 10) + 10 : 0);
        this.text(this.clip(name, room, 11, true), x + 16, y + 1, { size: 11, bold: true, col: off ? C.dim : C.cream });
        if (st.right) this.text(st.right, x + w, y + 2, { align: 'right', size: 10, col: C.sub });
        lines.forEach((l, i) => this.richText(l, x + 16, y + 16 + i * 12, { size: 10, col: off ? C.dim : C.sub, hot: off ? C.dim : C.gold }));
      } };
    }
  });

  const battleKey0 = UP.battleKey;
  UP.battleKey = function (k, code) {
    const bt = this.bt;
    if (bt && !bt.result && this.game.battle) {
      if (code === 'KeyC') { this.bdAsk(null); return; }
      if (code === 'KeyV' && bt.bdWant) { bt.bdResume = !bt.bdResume; this.sfx('select'); return; }
    }
    return battleKey0.call(this, k, code);
  };

  const updateBattle0 = UP.updateBattle;
  UP.updateBattle = function (dt) {
    const bt = this.bt;
    if (bt && bt.bdWant && this.bdIdle()) {
      const want = bt.bdWant;
      bt.bdWant = null;
      this.openBattleDetails(want.u);
      return;
    }
    const out = updateBattle0.call(this, dt);
    if (bt && bt.result && (bt.bdWant || bt.bdResume)) this.bdDrop();
    return out;
  };

  const drawTurnOrder0 = UP.drawTurnOrder;
  UP.drawTurnOrder = function (c, b) {
    drawTurnOrder0.call(this, c, b);
    const bt = this.bt;
    if (bt && !bt.result && !(bt.intro > 0)) this.turnOrder(7).forEach((o, i) => { const { x, y, size } = this.turnCell(i); this.hit(x - 1, y - 1, size + 2, size + 2, () => this.bdAsk(o.u)); });
    this.bdButton(c);
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
