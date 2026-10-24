(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, SP = CW.SPECIAL, HK = CW.HACKS;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const PEPPY = { x: 80, y: 314, s: 36 };
  const ERR = {
    owner: 'Нужен владелец связи.', emblem: 'Пеппи носит только эмблемы.', slots: 'У Пеппи больше нет места. Поднимите звёздность Арлана.', unique: 'Такая эмблема у Пеппи уже есть.',
    busy: 'Вклад уже лежит в копилке.', cap: 'Предел исчерпан.', used: 'В этом узле уже было.', same: 'Эта связь уже выбрана.', phase: 'Сейчас нельзя.', target: 'Сюда нельзя.', gold: 'Не хватает монет.'
  };
  const GM_HP = [0.01, 0.1, 0.25, 0.5, 1, 2, 5, 10];
  const FORM = { belobog: 'Белобог', underworld: 'Подземье' };

  Object.assign(H.UI.prototype, {
    cwSpecialSay(err) { if (ERR[err]) this.toast(ERR[err]); this.sfx('deny'); },

    cwSpecialKey(u) {
      if (!u) return null;
      if (u.id === 'peppy') return 'peppy';
      return Object.keys(SP).find(k => SP[k].owner === u.id) || null;
    },

    cwPeppyCell() { return PEPPY; },

    cwPeppyShown(r) { return !!r && this.game.cwPeppySlots(r) > 0; },

    cwPeppy(c, r, on) {
      const g = this.game, sp = g.cwSpecial(r), slots = g.cwPeppySlots(r), p = PEPPY;
      c.fillStyle = on ? 'rgba(255,212,113,0.18)' : 'rgba(26,10,22,0.85)'; c.fillRect(p.x, p.y, p.s, p.s);
      c.strokeStyle = on ? K.gold : '#ffb8c8'; c.strokeRect(p.x + 0.5, p.y + 0.5, p.s - 1, p.s - 1);
      c.save(); c.beginPath(); c.rect(p.x + 1, p.y + 1, p.s - 2, p.s - 2); c.clip();
      G.drawSprite(c, H.SPEAKERS.peppy.look, 'down', Math.floor(this.t * 2) % 2, p.x + 2, p.y);
      c.restore();
      for (let j = 0; j < slots; j++) {
        const it = sp.peppy[j], bx = p.x + p.s - 11, by = p.y + 1 + j * 11;
        if (it) this.cwItemIcon(c, it, bx, by, 10);
        else { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(bx, by, 10, 10); c.strokeStyle = '#ffb8c8'; c.strokeRect(bx + 0.5, by + 0.5, 9, 9); }
      }
      this.text('Пеппи', p.x + p.s / 2, p.y - 12, { align: 'center', size: 9, bold: true, col: '#ffb8c8' });
    },

    cwSpecialBadges(c, r, u, p) {
      const g = this.game, sp = g.cwSpecial(r);
      if (u.lv) { c.fillStyle = '#ff6ad8'; c.fillRect(p.x + 1, p.y + 1, p.s >= 40 ? 20 : 14, p.s >= 40 ? 11 : 8); this.text('LV', p.x + (p.s >= 40 ? 11 : 8), p.y + (p.s >= 40 ? 1 : 0), { align: 'center', size: p.s >= 40 ? 9 : 7, bold: true, col: '#ffffff', shadow: false }); }
      if (u.id === 'topaz' && sp.numby) {
        const big = p.s >= 40, bx = p.x + 1, by = big ? p.y + 14 : p.y + 1, tw = this.measure(String(sp.numby.amt), big ? 9 : 7, true) + (big ? 14 : 10);
        c.fillStyle = 'rgba(26,18,6,0.85)'; c.fillRect(bx, by, tw, big ? 11 : 8);
        this.cwCoin(bx + (big ? 5 : 4), by + (big ? 5.5 : 4), big ? 3.5 : 2.5);
        this.text(String(sp.numby.amt), bx + (big ? 10 : 8), by + (big ? 0 : -1), { size: big ? 9 : 7, bold: true, col: K.gold, shadow: false });
      }
    },

    cwSpecialLines(u) {
      const k = this.cwSpecialKey(u), out = [];
      if (k) out.push('Особая связь «' + CW.BOND_NAMES[k] + '»:', ...SP[k].text);
      if (CW.BONDS.mentor.members.includes(u.id)) out.push('Особая связь «' + CW.BONDS.mentor.name + '»:', CW.BONDS.mentor.text);
      return out;
    },

    cwSpecialCardButton(r, u, x, y) {
      const g = this.game;
      if (!r || !u || !u.uid) return;
      if (u.id === 'topaz') this.button(x, y, 132, 20, 'Копилка Счетовода', () => this.openCwInvest(), { size: 10, bold: true });
      if (u.id === 'yu') this.button(x, y, 132, 20, 'Дикая карта', () => this.openCwWild(), { size: 10, bold: true });
      if (u.id === 'silverwolf' && g.cwGm(r)) this.button(x, y, 132, 20, 'Консоль ГМ', () => this.openCwGm(), { size: 10, bold: true, active: true });
      if (u.id === 'bronya') this.text('Сейчас: ' + FORM[CW.keeperForm(g.cwDeployed(r))], x, y + 4, { size: 10, bold: true, col: K.gold });
    },

    cwChoiceSpecial(c, o, x, y, w) {
      if (o.p1) {
        this.portraitCard(c, G.lookOf('silverwolf', this.game), x + w / 2 - 30, y + 12, 60, { elem: 'quant', border: CW.COST_COL[5] });
        this.text('Повышение', x + w / 2, y + 80, { align: 'center', size: 11, bold: true, col: C.cream });
        const lines = ['Волк сразу становится 1★ версией стоимости 5: «Серебряный Волк: Leveling_Solo».', 'На 3★ откроется «Консоль ГМ».'];
        let yy = y + 100;
        for (const l of lines) for (const s of this.wrap(l, w - 12, 9)) { this.text(s, x + 6, yy, { size: 9, col: '#d8dcf0' }); yy += 11; }
        return;
      }
      const D = HK[o.hack];
      c.fillStyle = '#0a0a18'; c.fillRect(x + w / 2 - 22, y + 12, 44, 44);
      c.strokeStyle = ['#8ad0ff', '#c8a8ff', '#ff9ae0'][D.ver]; c.strokeRect(x + w / 2 - 21.5, y + 12.5, 43, 43);
      this.text('>_', x + w / 2, y + 24, { align: 'center', size: 16, bold: true, col: ['#8ad0ff', '#c8a8ff', '#ff9ae0'][D.ver] });
      this.wrap(D.name, w - 12, 10, true).slice(0, 2).forEach((l, j) => this.text(l, x + w / 2, y + 62 + j * 12, { align: 'center', size: 10, bold: true, col: C.cream }));
      let yy = y + 92;
      for (const s of this.wrap('Компонент взлома: ' + D.text, w - 12, 9)) { if (yy > y + 190) break; this.text(s, x + 6, yy, { size: 9, col: '#d8dcf0' }); yy += 11; }
    },

    openCwInvest() {
      const ui = this, g = this.game;
      return this.push({
        cw: true, sel: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r) { ui.pop(); return; }
          const sp = g.cwSpecial(r), cap = g.cwNumbyCap(r), x = 170, y = 140, w = 300, h = 178;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Копилка Счетовода', border: K.gold });
          ui.portraitCard(c, G.lookOf('topaz', g), x + 14, y + 22, 48, { elem: 'fire', border: CW.COST_COL[5] });
          const s = g.cwBest(r, 'topaz'), k = s ? SP.numby.gain[Math.min(2, s - 1)] : 0;
          ui.text('Вклад до ' + cap + ' монет, доход ' + Math.round(k * 100) + '%', x + 72, y + 24, { size: 11, bold: true, col: C.cream });
          ui.text('Возврат через ' + SP.numby.nodes + ' узла.', x + 72, y + 40, { size: 10, col: C.sub });
          if (sp.numby) ui.text('В копилке ' + sp.numby.amt + ', вернётся через ' + Math.max(0, sp.numby.due - r.step) + ' узл.', x + 72, y + 56, { size: 10, bold: true, col: K.gold });
          const opts = [...new Set([1, 5, cap].filter(v => v <= cap))];
          opts.forEach((v, i) => ui.button(x + 14 + i * 92, y + 92, 86, 24, 'Вложить ' + v, () => this.put(v), { disabled: !!sp.numby || r.gold < 1, active: !sp.numby && i === this.sel, size: 11, bold: true }));
          ui.text('Монет на руках: ' + r.gold, x + 14, y + 126, { size: 10, col: C.sub });
          ui.button(x + w - 90, y + h - 34, 76, 22, 'Закрыть', () => { ui.pop(); ui.sfx('cancel'); }, { size: 10 });
          this.n = opts.length; this.opts = opts;
        },
        put(v) { const err = g.cwInvest(v); if (err) { ui.cwSpecialSay(err); return; } ui.sfx('glint'); ui.toast('Счетовод принял ' + g.cwSpecial(g.cwRun()).numby.amt + ' мон.'); },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? this.n - 1 : 1)) % this.n; ui.sfx('select'); }
          if (k === 'ok' && this.opts) this.put(this.opts[this.sel]);
          if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      });
    },

    openCwWild() {
      const ui = this, g = this.game, DIR = CW.DIR_BONDS;
      return this.push({
        cw: true, sel: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r) { ui.pop(); return; }
          const sp = g.cwSpecial(r), max = g.cwWildMax(r), cost = g.cwWildCost(r), x = 96, y = 96, w = 448, h = 270;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Дикая карта', border: K.gold });
          ui.portraitCard(c, G.lookOf('yu', g), x + 14, y + 22, 48, { elem: H.CHARS.yu.elem, border: CW.COST_COL[5] });
          ui.text('Ю считается членом ' + (max >= 2 ? 'двух выбранных связей' : 'выбранной связи') + '.', x + 72, y + 24, { size: 11, bold: true, col: C.cream });
          ui.text(cost ? 'Смена в этом узле: ' + cost + ' мон.' : 'Первая смена в узле бесплатна.', x + 72, y + 40, { size: 10, col: cost ? K.gold : C.ok });
          const cur = sp.wild.slice(-max), st = g.cwBonds(r);
          DIR.forEach((k, i) => {
            const B = CW.BONDS[k], bx = x + 14 + (i % 3) * 142, by = y + 80 + Math.floor(i / 3) * 34, on = cur.includes(k), focus = i === this.sel;
            c.fillStyle = on ? 'rgba(255,212,113,0.22)' : 'rgba(6,10,34,0.85)'; c.fillRect(bx, by, 134, 28);
            c.strokeStyle = focus ? '#ffffff' : on ? K.gold : '#2a3460'; c.strokeRect(bx + 0.5, by + 0.5, 133, 27);
            if (on) ui.diamond(bx + 10, by + 14, 4, '#ffd0ff', '#2a1030');
            ui.text(ui.clip(B.name, 108, 10, true), bx + 20, by + 4, { size: 10, bold: true, col: B.col });
            ui.text(st[k].n + (st[k].next ? ' / ' + st[k].next : ''), bx + 20, by + 16, { size: 9, col: C.sub });
            ui.hit(bx, by, 134, 28, () => { this.sel = i; this.pick(); });
          });
          ui.button(x + w - 90, y + h - 32, 76, 22, 'Закрыть', () => { ui.pop(); ui.sfx('cancel'); }, { size: 10 });
        },
        pick() { const err = g.cwSetWild(DIR[this.sel]); if (err) { ui.cwSpecialSay(err); return; } ui.sfx('confirm'); },
        key(k) {
          const n = DIR.length;
          if (k === 'left') this.sel = (this.sel + n - 1) % n;
          if (k === 'right') this.sel = (this.sel + 1) % n;
          if (k === 'up') this.sel = (this.sel + n - 3) % n;
          if (k === 'down') this.sel = (this.sel + 3) % n;
          if (['left', 'right', 'up', 'down'].includes(k)) ui.sfx('select');
          if (k === 'ok') this.pick();
          if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      });
    },

    openCwGm() {
      const ui = this, g = this.game, st = { row: 0, set: 0 };
      return this.push({
        cw: true,
        rows() {
          const r = g.cwRun(), gm = g.cwGm(r), P1 = SP.player1;
          return [
            { label: 'НР врагов', value: Math.round(gm.hp * 100) + '%', col: gm.hp === 1 ? C.cream : K.gold, step: d => { const i = Math.max(0, GM_HP.indexOf(gm.hp)); g.cwGmAct('hp', GM_HP[Math.max(0, Math.min(GM_HP.length - 1, i + d))]); } },
            { label: 'Монеты', value: gm.coins + ' / ' + P1.coinsMax, fixed: true, act: () => g.cwGmAct('coins') },
            { label: 'НР команды', value: gm.teamAt === r.step ? 'выдано в узле' : '+' + P1.teamHp, fixed: true, act: () => g.cwGmAct('team') },
            { label: 'Руда ' + gm.ores + '/' + P1.ores, value: CW.GM_SETS[st.set].name, step: d => { st.set = (st.set + d + CW.GM_SETS.length) % CW.GM_SETS.length; }, act: () => g.cwGmAct('ore', st.set) }
          ];
        },
        run(i) {
          const row = this.rows()[i];
          if (!row || !row.act) { ui.sfx('deny'); return; }
          const err = row.act();
          if (err) { ui.cwSpecialSay(err); return; }
          ui.sfx('confirm');
          ui.toast('Консоль ГМ: ' + row.label.split(' ')[0].toLowerCase() + ' выдано');
        },
        draw(c) {
          const r = g.cwRun();
          if (!r || !g.cwGm(r)) { ui.pop(); return; }
          const x = 150, y = 100, w = 340, h = 230;
          c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { alpha: 0.95 });
          ui.plate(x + 8, y - 12, 'Консоль ГМ');
          ui.text('SilverWolf.exe · Испытательный вагон', x + w - 14, y + 10, { align: 'right', size: 9, col: C.dim });
          const rows = this.rows();
          rows.forEach((row, i) => ui.debugRow(c, st, row, i, x + 8, y + 30 + i * 24, w - 16));
          const ay = y + 30 + rows.length * 24 + 10;
          [['Выдать', () => this.run(st.row)], ['Закрыть', () => { ui.pop(); ui.sfx('cancel'); }]].forEach(([l, fn], i) => ui.button(x + 14 + i * 160, ay, 150, 26, l, fn, { size: 11, bold: true, active: i === 0 }));
          ui.text('НР врагов действует до конца узла.', x + 14, ay + 36, { size: 10, col: C.dim });
          ui.hints([['↑↓', 'Поле'], ['←→', 'Значение'], ['Enter', 'Выдать'], ['Esc', 'Закрыть']], x + w / 2, y + h - 16, { align: 'center' });
        },
        key(k) {
          const rows = this.rows();
          if (k === 'up' || k === 'down') { st.row = (st.row + (k === 'up' ? rows.length - 1 : 1)) % rows.length; ui.sfx('select'); }
          if ((k === 'left' || k === 'right') && rows[st.row].step) { rows[st.row].step(k === 'left' ? -1 : 1); ui.sfx('select'); }
          if (k === 'ok') this.run(st.row);
          if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
