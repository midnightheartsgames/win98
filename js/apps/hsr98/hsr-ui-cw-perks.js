(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const PCB = '#0c2a1c', TRACE = '#2a6a44', PAD = '#c8a858';
  const ERR = { locked: 'Сезонные открываются, когда установлены все постоянные.', notes: 'Не хватает банкнот.', have: 'Уже установлено.' };

  Object.assign(H.UI.prototype, {
    cwNote(x, y) {
      const c = this.ctx;
      c.fillStyle = '#1a3a2a'; c.fillRect(x - 7, y - 4, 14, 8);
      c.fillStyle = '#7ad89a'; c.fillRect(x - 6, y - 3, 12, 6);
      c.fillStyle = '#1a3a2a'; c.fillRect(x - 2, y - 2, 4, 4);
    },

    openCwPerks() {
      const ui = this, g = this.game;
      const listOf = tab => CW.PERKS.filter(p => p.tab === tab);
      return this.push({
        full: true, cw: true, tab: 'p', sel: 0,
        layout(tab) {
          const mech = listOf(tab).filter(p => !p.pow), pow = listOf(tab).filter(p => p.pow), out = [];
          const cols = 4, mw = 138, mh = 36;
          mech.forEach((p, i) => out.push({ p, x: 24 + (i % cols) * 150, y: 92 + Math.floor(i / cols) * 50, w: mw, h: mh }));
          const py = 92 + Math.ceil(mech.length / cols) * 50 + 14;
          pow.forEach((p, i) => out.push({ p, x: 40 + i * (560 / pow.length), y: py, w: 30, h: 30, small: true }));
          return out;
        },
        draw(c) {
          const C0 = g.cwPerks(), L = this.layout(this.tab);
          if (this.sel >= L.length) this.sel = L.length - 1;
          c.fillStyle = PCB; c.fillRect(0, 0, W, HGT);
          for (let x = 0; x < W; x += 16) { c.fillStyle = 'rgba(80,160,110,0.06)'; c.fillRect(x, 0, 1, HGT); }
          for (let y = 0; y < HGT; y += 16) { c.fillStyle = 'rgba(80,160,110,0.06)'; c.fillRect(0, y, W, 1); }
          ui.plate(16, 14, 'Установка преимуществ');
          [['p', 'Постоянные преимущества'], ['s', 'Сезонные преимущества']].forEach(([t, n], i) => ui.button(16 + i * 196, 46, 188, 22, n, () => { this.tab = t; this.sel = 0; ui.sfx('select'); }, { active: this.tab === t, size: 10, bold: true }));
          ui.cwNote(418, 57);
          ui.text(String(C0.notes), 430, 50, { size: 12, bold: true, col: '#9affc0' });
          ui.text('Установлено ' + C0.perks.on.length + ' / ' + CW.PERKS.length, 594, 51, { align: 'right', size: 10, col: C.cream });
          ui.button(600, 46, 24, 22, '↺', () => { g.cwPerkReset(); ui.sfx('cancel'); ui.toast('Преимущества сброшены, банкноты возвращены.'); }, { size: 12, bold: true, disabled: !C0.perks.on.length });
          const locked = this.tab === 's' && CW.PERKS.some(x => x.tab === 'p' && !C0.perks.on.includes(x.id));
          for (let i = 1; i < L.length; i++) {
            const a = L[i - 1], b = L[i];
            c.strokeStyle = TRACE; c.lineWidth = 2;
            c.beginPath(); c.moveTo(a.x + a.w / 2, a.y + a.h / 2); c.lineTo(a.x + a.w / 2, (a.y + b.y) / 2 + a.h / 2); c.lineTo(b.x + b.w / 2, (a.y + b.y) / 2 + a.h / 2); c.lineTo(b.x + b.w / 2, b.y + b.h / 2); c.stroke();
            c.lineWidth = 1;
          }
          L.forEach((n, i) => {
            const own = C0.perks.on.includes(n.p.id), on = i === this.sel;
            if (n.small) {
              c.fillStyle = '#000000'; c.beginPath(); c.arc(n.x + 15, n.y + 15, 16, 0, Math.PI * 2); c.fill();
              c.fillStyle = own ? PAD : locked ? '#1a2a22' : '#24503a'; c.beginPath(); c.arc(n.x + 15, n.y + 15, 14, 0, Math.PI * 2); c.fill();
              ui.text('+' + Math.round(n.p.v * 100), n.x + 15, n.y + 9, { align: 'center', size: 9, bold: true, col: own ? '#141018' : '#9affc0', shadow: false });
              if (on) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(n.x + 15, n.y + 15, 17, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1; }
            } else {
              c.fillStyle = '#000000'; c.fillRect(n.x - 1, n.y - 1, n.w + 2, n.h + 2);
              c.fillStyle = own ? '#3a3010' : locked ? '#0e1a14' : '#163a28'; c.fillRect(n.x, n.y, n.w, n.h);
              for (let k = 0; k < 6; k++) { c.fillStyle = own ? PAD : '#5a7a60'; c.fillRect(n.x + 8 + k * 22, n.y - 3, 6, 3); c.fillRect(n.x + 8 + k * 22, n.y + n.h, 6, 3); }
              ui.wrap(n.p.name, n.w - 10, 9, true).slice(0, 2).forEach((l, j) => ui.text(l, n.x + 6, n.y + 5 + j * 12, { size: 9, bold: true, col: own ? K.gold : locked ? C.dim : '#c8f0d8' }));
              if (on) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(n.x - 2, n.y - 2, n.w + 4, n.h + 4); c.lineWidth = 1; }
            }
            ui.hit(n.x, n.y, n.w, n.h, () => { if (this.sel === i) this.buy(); else { this.sel = i; ui.sfx('select'); } });
          });
          const P = L[this.sel].p, own = C0.perks.on.includes(P.id);
          ui.win(16, 360, 608, 74, { corners: false, border: K.gold });
          ui.text(P.name, 30, 370, { size: 12, bold: true, col: K.gold });
          ui.wrap(P.text, 420, 10).slice(0, 2).forEach((l, i) => ui.text(l, 30, 388 + i * 13, { size: 10, col: C.cream }));
          ui.cwNote(476, 404); ui.text(String(P.cost), 488, 397, { size: 11, bold: true, col: '#9affc0' });
          ui.button(512, 392, 100, 26, own ? 'Установлено' : locked ? 'Закрыто' : 'Установить', () => this.buy(), { disabled: own || locked || C0.notes < P.cost, active: !own && !locked, bold: true, size: 11 });
          if (locked) ui.text(ERR.locked, 30, 342, { size: 10, col: '#ffb0a0' });
          ui.hints([['Q/E', 'Вкладка'], ['←→↑↓', 'Узел'], ['Enter', 'Установить'], ['Esc', 'Назад']], W / 2, HGT - 18, { align: 'center' });
        },
        buy() {
          const L = this.layout(this.tab), err = g.cwPerkBuy(L[this.sel].p.id);
          if (err) { if (ERR[err]) ui.toast(ERR[err]); ui.sfx('deny'); return; }
          ui.sfx('confirm');
        },
        key(k, code) {
          const n = this.layout(this.tab).length;
          if (code === 'KeyQ' || code === 'KeyE') { this.tab = this.tab === 'p' ? 's' : 'p'; this.sel = 0; ui.sfx('select'); return; }
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'up' || k === 'down') { this.sel = Math.max(0, Math.min(n - 1, this.sel + (k === 'up' ? -4 : 4))); ui.sfx('select'); }
          if (k === 'ok') this.buy();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwBank() {
      const ui = this, g = this.game;
      const TABS = [['strats', 'Стратегии'], ['envs', 'Среды'], ['items', 'Снаряжение'], ['kits', 'Герои'], ['bonds', 'Связи'], ['opps', 'Конкуренты']];
      const entries = k => {
        if (k === 'strats') return Object.keys(CW.STRATS).map(id => [id, CW.STRATS[id].name]);
        if (k === 'envs') return Object.keys(CW.ENVS).map(id => [id, CW.ENVS[id].name]);
        if (k === 'items') return Object.keys(CW.ITEMS).map(id => [id, CW.ITEMS[id].name]);
        if (k === 'kits') return CW.POOL.map(id => [id, H.CHARS[CW.UNITS[id].kitOn].name]);
        if (k === 'bonds') return Object.keys(CW.BONDS).map(id => [id, CW.BONDS[id].name]);
        return Object.keys(CW.OPPONENTS).map(id => [id, CW.OPPONENTS[id].name]);
      };
      return this.push({
        full: true, cw: true, tab: 0, top: 0, rsel: 0,
        draw(c) {
          const st = g.cwBankState(), key = TABS[this.tab][0], seen = g.cw().seen[key] || {}, list = entries(key), C0 = g.cwPerks();
          c.fillStyle = '#2a1e12'; c.fillRect(0, 0, W, HGT);
          for (let y = 0; y < HGT; y += 6) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, W, 2); }
          ui.plate(16, 14, 'Банк данных · ' + st.pct + '%');
          TABS.forEach(([k, n], i) => {
            const x = 16 + i * 102, on = i === this.tab, p = st.parts[k];
            c.fillStyle = on ? '#e8dcb8' : '#b8a878'; c.fillRect(x, 42, 98, 26);
            ui.text(n, x + 6, 46, { size: 10, bold: true, col: '#2a1e12', shadow: false });
            ui.text(Math.min(p[0], p[1]) + '/' + p[1], x + 6, 57, { size: 8, col: '#5a4a30', shadow: false });
            ui.hit(x, 42, 98, 26, () => { this.tab = i; this.top = 0; ui.sfx('select'); });
          });
          c.fillStyle = '#e8dcb8'; c.fillRect(16, 68, 608, 270);
          const cols = 4, rows = 13, cw = 150, rh = 20, maxTop = Math.max(0, Math.ceil(list.length / cols) - rows);
          this.top = Math.max(0, Math.min(this.top, maxTop));
          list.slice(this.top * cols, (this.top + rows) * cols).forEach(([id, name], i) => {
            const x = 22 + (i % cols) * cw, y = 74 + Math.floor(i / cols) * rh, have = !!seen[id];
            c.fillStyle = have ? '#fff8e0' : '#cfc2a0'; c.fillRect(x, y, cw - 6, rh - 3);
            c.fillStyle = have ? (seen[id] === 2 ? '#c8962c' : '#6a8ab8') : '#a89870'; c.fillRect(x, y, 3, rh - 3);
            ui.text(have ? ui.clip(name, cw - 16, 9) : '???', x + 7, y + 3, { size: 9, bold: have, col: have ? '#2a1e12' : '#7a6a48', shadow: false });
          });
          ui.wheelZone(16, 68, 608, 270, d => { this.top = Math.max(0, Math.min(maxTop, this.top + d)); });
          const steps = CW.BANK_STEPS[key];
          if (steps) {
            ui.text('Награды коллекции: 20 нефрита и 200 очков продвижения за ступень', 16, 346, { size: 10, col: '#e8dcb8' });
            const all = steps.every((s, i) => C0.bank.got.includes(key + i));
            steps.forEach((need, i) => {
              const x = 16 + i * 102, got = C0.bank.got.includes(key + i), ready = st.parts[key][0] >= need && !got, on = this.rsel === i;
              ui.button(x, 362, 96, 26, got ? '✓ ' + need : need + (ready ? ' · забрать' : ''), () => { this.rsel = i; this.claim(); }, { disabled: got || !ready, active: ready || on, size: 10, bold: ready });
            });
            if (all) { c.save(); c.translate(560, 330); c.rotate(-0.2); c.strokeStyle = K.stamp; c.lineWidth = 2; c.strokeRect(-50, -11, 100, 22); c.lineWidth = 1; ui.text('ВСЁ ПОЛУЧЕНО', 0, -6, { align: 'center', size: 10, bold: true, col: K.stamp, shadow: false }); c.restore(); }
          } else ui.text('Записывается всё, что встречалось в партиях. Наград за эту вкладку нет.', 16, 350, { size: 10, col: '#e8dcb8' });
          ui.hints([['Q/E', 'Вкладка'], ['↑↓', 'Листать'], ['←→', 'Награда'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 18, { align: 'center' });
        },
        claim() { ui.cwClaimSay(g.cwBankClaim(TABS[this.tab][0], this.rsel)); },
        key(k, code) {
          if (code === 'KeyQ' || code === 'KeyE') { this.tab = (this.tab + (code === 'KeyQ' ? TABS.length - 1 : 1)) % TABS.length; this.top = 0; this.rsel = 0; ui.sfx('select'); return; }
          if (k === 'up') this.top = Math.max(0, this.top - 1);
          if (k === 'down') this.top++;
          if (k === 'left' || k === 'right') { this.rsel = (this.rsel + (k === 'left' ? 5 : 1)) % 6; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwLinks() {
      const ui = this, g = this.game;
      const list = tab => CW.LINK_BONDS.filter(k => (CW.BONDS[k].kind === 'faction') === (tab === 0));
      return this.push({
        full: true, cw: true, tab: 0, sel: 0, task: 0,
        draw(c) {
          const C0 = g.cwPerks(), L = list(this.tab);
          if (this.sel >= L.length) this.sel = L.length - 1;
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Соединение связи');
          ['Связи фракций', 'Связи направлений'].forEach((n, i) => ui.button(16 + i * 160, 46, 152, 22, n, () => { this.tab = i; this.sel = 0; ui.sfx('select'); }, { active: this.tab === i, size: 10, bold: true }));
          ui.text('Засчитывается по связям в конце пройденной партии.', 340, 51, { size: 9, col: C.sub });
          const cw = 196, first = Math.max(0, Math.min(this.sel - 1, L.length - 3));
          L.slice(first, first + 3).forEach((k, j) => {
            const i = first + j, B = CW.BONDS[k], x = 16 + j * (cw + 10), y = 80, on = i === this.sel;
            ui.win(x, y, cw, 290, { corners: false, border: on ? K.gold : '#2a3460' });
            G.cwBondIcon(c, k, x + 10, y + 12, 20, B.col);
            ui.text(ui.clip(B.name, cw - 44, 12, true), x + 36, y + 14, { size: 12, bold: true, col: B.col });
            CW.linkTasks(k).forEach((t, n) => {
              const key = k + ':' + n, done = C0.links.done.includes(key), got = C0.links.got.includes(key), ty = y + 48 + n * 76, sel = on && this.task === n;
              c.fillStyle = sel ? 'rgba(255,212,113,0.14)' : 'rgba(0,0,0,0.25)'; c.fillRect(x + 8, ty, cw - 16, 70);
              const text = (t.hard ? 'Только в Стандартной игре: ' : '') + 'включите связь ' + B.name + '-' + t.n + (t.hard ? ' на ранге «Фиолетовое золото» и выше' : '');
              ui.wrap(text, cw - 30, 9).slice(0, 3).forEach((l, m) => ui.text(l, x + 14, ty + 6 + m * 11, { size: 9, col: done ? C.cream : C.sub }));
              ui.text('20 нефрита · 200 очков', x + 14, ty + 42, { size: 8, col: C.dim });
              ui.button(x + cw - 84, ty + 44, 70, 20, got ? 'Получено' : done ? 'Забрать' : 'Не выполнено', () => { this.sel = i; this.task = n; this.claim(); }, { disabled: got || !done, active: done && !got, size: 9 });
            });
            ui.hit(x, y, cw, 40, () => { this.sel = i; ui.sfx('select'); });
          });
          const total = C0.links.got.length * 20;
          ui.text('Получено: ' + total + ' / ' + CW.LINK_BONDS.length * 3 * 20 + ' нефрита', 16, 386, { size: 12, bold: true, col: K.gold });
          ui.text('Выполнено заданий: ' + C0.links.done.length + ' / ' + CW.LINK_BONDS.length * 3, 16, 404, { size: 10, col: C.sub });
          ui.hints([['Q/E', 'Вкладка'], ['←→', 'Связь'], ['↑↓', 'Задание'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 18, { align: 'center' });
        },
        claim() { const k = list(this.tab)[this.sel]; ui.cwClaimSay(g.cwLinkClaim(k + ':' + this.task)); },
        key(k, code) {
          const n = list(this.tab).length;
          if (code === 'KeyQ' || code === 'KeyE') { this.tab = 1 - this.tab; this.sel = 0; ui.sfx('select'); return; }
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'up' || k === 'down') { this.task = (this.task + (k === 'up' ? 2 : 1)) % 3; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
