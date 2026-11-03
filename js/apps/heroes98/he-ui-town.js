(function (H) {
  'use strict';
  const TW = H.Town, TD = H.TownDraw, MDR = H.MapDraw, Adv = H.Adv;
  const PANEL = 432, RES_NAME = Object.fromEntries(H.RESOURCES);
  const hit = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;
  const BLUEPRINT = [['hall1', 'hall2', 'hall3', 'hall4'], ['fort1', 'fort2', 'fort3'], ['guild1', 'guild2', 'guild3', 'guild4', 'guild5'], ['market', 'store', 'caravan'], ['tavern', 'smith', 'shipyard'], ['special1', 'special2', 'special3', 'special4'], ['altar', 'barrow2', 'barrow3']];
  const FRAME = {
    built: ['#e8f0ff', 'rgba(232,240,255,0.18)', '#ffffff'],
    ok: ['#ffe060', 'rgba(255,224,96,0.14)', '#fff0b0'],
    money: ['#ff9a50', 'rgba(255,154,80,0.10)', '#ffc8a0'],
    needs: ['#7088b0', 'rgba(0,0,0,0)', '#90a4c8'],
    today: ['#a0b4d0', 'rgba(160,180,208,0.08)', '#b8c8e0'],
    forbidden: ['#c04040', 'rgba(192,64,64,0.12)', '#e09090']
  };
  const STATE_TEXT = { built: 'Построено', ok: 'Можно строить', today: 'Сегодня в городе уже строили', needs: 'Сначала нужны другие постройки', money: 'Не хватает ресурсов' };

  class TownView {
    constructor(ui, map, town) {
      this.ui = ui;
      this.map = map;
      this.S = map.S;
      this.o = town;
      this.pid = map.pid;
      this.time = 0;
      this.mouse = [0, 0];
      this.hover = null;
      this.hot = null;
      this.win = null;
      this.stack = [];
      this.regions = [];
      this.toasts = [];
      this.tip = null;
      this.drag = null;
      this.carry = null;
      this.split = null;
      this.theme = H.THEMES['town_' + town.faction] ? 'town_' + town.faction : null;
      const fresh = TW.teach(this.S, this.o);
      if (fresh.length) this.toast('Выучено: ' + fresh.map(id => H.SPELLS[id].name).join(', '), '#a0e0ff');
      if (this.S.players[this.pid].deals.some(d => H.Contracts.canDeliver(this.S, town, d))) this.toast('Ратуша контрактов ждёт вашу поставку', '#ffe080');
    }

    get res() {
      return this.S.players[this.pid].res;
    }

    toast(text, color) {
      this.toasts.push({ text, color: color || '#f0e2b8', t: 0 });
      if (this.toasts.length > 3) this.toasts.shift();
    }

    events(ev) {
      for (const e of ev) {
        if (e.t === 'built') this.toast('Построено: ' + TW.def(this.o, e.id).name, '#a0ffa0');
        else if (e.t === 'recruit') this.toast('Нанято: ' + H.UNITS[e.unit].name + ' ' + e.count, '#a0ffa0');
        else if (e.t === 'upgrade') this.toast('Улучшено: ' + H.UNITS[e.unit].name + ' ' + e.count, '#a0ffa0');
        else if (e.t === 'hired') this.toast('Новый герой: ' + this.S.heroes[e.hero].name, '#a0ffa0');
        else if (e.t === 'learned') this.toast('Выучено: ' + e.spells.map(id => H.SPELLS[id].name).join(', '), '#a0e0ff');
        else if (e.t === 'dealDone') this.toast('Контракт исполнен', '#a0ffa0');
        else if (e.t === 'risen2') this.toast('Поднято: ' + H.UNITS[e.unit].name + ' ' + e.count, '#a0ffa0');
        else if (e.t === 'trade') this.toast(RES_NAME[e.from] + ' −' + e.give + ', ' + RES_NAME[e.to].toLowerCase() + ' +' + e.get, '#ffe080');
      }
    }

    update(dt) {
      this.time += dt;
      for (const t of this.toasts) t.t += dt;
      this.toasts = this.toasts.filter(t => t.t < 3);
    }

    openWin(win, keep) {
      if (keep && this.win) this.stack.push(this.win);
      else this.stack = [];
      this.win = win;
      this.tip = null;
      this.carry = null;
    }

    closeWin() {
      this.win = this.stack.pop() || null;
    }

    exit() {
      this.map.ver = -1;
      this.map.ensureHero();
      this.ui.show(this.map);
    }

    back() {
      if (this.tip) this.tip = null;
      else if (this.split) this.split = null;
      else if (this.carry) this.carry = null;
      else if (this.win) this.closeWin();
      else this.exit();
      return true;
    }

    armyMove(k, t, n) {
      const row = q => (q.key === 'hero' ? 'hero' : 'garrison');
      return TW.move(this.S, this.o, { side: row(k), slot: k.slot, n }, { side: row(t), slot: t.slot });
    }

    key(code) {
      if ((code === 'Enter' || code === 'Space') && this.win && this.win.enter) this.win.enter();
      else if (code === 'KeyB' && !this.win) this.openWin({ kind: 'blueprint' });
    }

    pointer(type, x, y, btn) {
      this.mouse = [x, y];
      if (type === 'move' && this.drag) {
        this.drag(x, y);
        return;
      }
      if (type === 'up') {
        this.drag = null;
        this.down = null;
        if (btn === 2) this.tip = null;
        if (btn === 0) this.cellUp(x, y);
        return;
      }
      const r = this.regionAt(x, y);
      this.hot = r && !r.off && r.act ? r.id : null;
      this.hover = !this.win && !this.split && !r && y < PANEL ? TD.pick(this.o, x, y) : null;
      this.cellTip = r && r.info && !this.carry && !this.split && (r.cell ? !this.win : /^gs-/.test(r.id)) ? r.info : null;
      this.ui.gfx.cursor(this.hot || this.hover ? 'hand' : 'arrow');
      if (type !== 'down') return;
      if (btn === 2) {
        if (r && r.right && !this.split) r.right();
        else this.tip = r && r.info ? { lines: r.info(), x, y } : this.hover ? { lines: this.buildingLines(this.hover), x, y } : null;
        return;
      }
      if (btn !== 0) return;
      if (r) {
        if (r.off || !r.act) return;
        this.down = r.id;
        r.act(x, y);
        if (r.drag) this.drag = r.drag;
        return;
      }
      if (!this.win && this.hover) this.openBuilding(this.hover);
      else if (!this.win) this.carry = null;
    }

    openBuilding(id) {
      const x = TW.def(this.o, id);
      if (x.dwelling || x.upgrade) this.openRecruit(x.dwelling || x.upgrade);
      else if (id === 'tavern') this.openWin({ kind: 'tavern' });
      else if (id === 'smith') this.openWin({ kind: 'smith' });
      else if (id === 'caravan') this.openCaravan();
      else if (id === 'shipyard') this.openWin({ kind: 'shipyard' });
      else if (x.contracts) this.openWin({ kind: 'contracts' });
      else if (x.barrow) this.openWin({ kind: 'barrow' });
      else if (x.ring) this.openWin({ kind: 'ring' });
      else if (x.reforge) this.openWin({ kind: 'reforge' });
      else if (x.shop) this.openWin({ kind: 'chamber', id });
      else if (x.market) this.openMarket();
      else if (x.guild) this.openWin({ kind: 'guild' });
      else if (/^hall/.test(id)) this.openWin({ kind: 'blueprint' });
      else this.openWin({ kind: 'info', id });
    }

    openRecruit(tier) {
      const list = TW.offers(this.o, tier);
      this.openWin({ kind: 'recruit', tier, unit: list[list.length - 1], n: 0 });
      this.win.n = Math.min(1, TW.canRecruit(this.S, this.o, tier, this.win.unit));
    }

    openCaravan() {
      const list = TW.caravanSources(this.S, this.o);
      this.openWin({ kind: 'caravan', from: list.length ? list[0].id : null, off: {} });
    }

    openMarket() {
      this.openWin({ kind: 'market', from: 'wood', to: 'gold', m: 0 });
    }

    buildingLines(id) {
      const x = TW.def(this.o, id), out = [x.name];
      if (x.dwelling || x.upgrade) {
        const t = x.dwelling || x.upgrade, u = TW.offers(this.o, t).map(v => H.UNITS[v].name).join(', ');
        out.push('Наём: ' + u, 'Доступно: ' + this.o.pool[t - 1] + ', прирост ' + TW.growth(this.S, this.o, t) + ' в неделю');
      } else out.push(...H.Font.wrap('small', x.about, 260));
      if (x.barrow) out.push('В кургане существ: ' + (this.o.barrow || []).reduce((t, e) => t + e.count, 0));
      return out;
    }

    draw(g) {
      this.regions = [];
      TD.paint(g.ctx, this.o, this.time, this.win ? null : this.hover);
      if (!this.win && this.hover) this.drawHover(g);
      this.drawPanel(g);
      if (this.win) {
        g.ctx.fillStyle = 'rgba(5,7,15,0.5)';
        g.ctx.fillRect(0, 0, H.W, H.H);
        this.region('blocker', 0, 0, H.W, H.H, null);
        this['draw' + this.win.kind[0].toUpperCase() + this.win.kind.slice(1) + 'Win'](g, this.win);
      }
      if (this.split) this.drawSplit(g);
      this.toasts.forEach((t, i) => g.text(t.text, H.W / 2, 18 + i * 16, { align: 'center', bold: true, color: t.color }));
      if (this.tip) this.drawTip(g, this.tip);
      else if (this.cellTip) this.drawTip(g, { lines: this.cellTip(), x: this.mouse[0], y: this.mouse[1] });
      this.drawCarry(g);
    }

    drawHover(g) {
      const lines = this.buildingLines(this.hover).slice(0, 3), w = Math.max(...lines.map(s => g.measure(s, { size: 10 }))) + 20;
      const x = H.clamp(this.mouse[0] + 16, 4, H.W - w - 4), y = H.clamp(this.mouse[1] + 16, 4, PANEL - 60);
      g.panel(x, y, w, lines.length * 14 + 10, 'tip');
      lines.forEach((s, i) => g.text(s, x + 10, y + 11 + i * 14, { size: i ? 10 : 11, bold: !i }));
    }

    drawTip(g, tip) {
      const lines = tip.lines, w = Math.max(...lines.map(s => g.measure(s))) + 20, h = lines.length * 15 + 12;
      const x = H.clamp(tip.x + 14, 4, H.W - w - 4), y = H.clamp(tip.y - h - 6, 4, H.H - h - 4);
      g.panel(x, y, w, h, 'tip');
      lines.forEach((s, i) => g.text(s, x + 10, y + 12 + i * 15, { bold: i === 0, size: i ? 10 : 11 }));
    }

    resStrip(g, x, y, gap) {
      const c = g.ctx;
      H.RESOURCES.forEach(([id, name], i) => {
        const rx = x + i * gap;
        c.fillStyle = MDR.RES[id];
        c.fillRect(rx, y - 5, 10, 10);
        c.strokeStyle = '#000';
        c.strokeRect(rx + 0.5, y - 4.5, 9, 9);
        g.text(String(this.res[id]), rx + 15, y, { size: 10 });
        this.region('res-' + id, rx, y - 8, gap - 6, 16, null, { info: () => [name, 'Есть: ' + this.res[id]] });
      });
    }

    cost(g, cost, x, y, n) {
      let cx = x;
      for (const [k, v] of Object.entries(cost)) {
        const need = v * (n || 1), c = g.ctx;
        c.fillStyle = MDR.RES[k];
        c.fillRect(cx, y - 5, 10, 10);
        c.strokeStyle = '#000';
        c.strokeRect(cx + 0.5, y - 4.5, 9, 9);
        cx += 14 + g.text(String(need), cx + 14, y, { size: 10, color: this.res[k] < need ? '#ff7060' : '#f0e2b8' }) + 10;
      }
      return cx - x;
    }

    drawPanel(g) {
      const o = this.o, S = this.S;
      g.panel(0, PANEL, H.W, H.H - PANEL, 'plate');
      g.text(o.name, 14, PANEL + 18, { serif: true });
      g.text(H.FACTIONS[o.faction].full, 14, PANEL + 38, { size: 10, color: '#c8b88a' });
      const hall = ['hall4', 'hall3', 'hall2', 'hall1'].find(id => TW.has(o, id));
      g.text('Управа: ' + TW.def(o, hall).name, 14, PANEL + 56, { size: 10 });
      g.text('Доход: ' + TW.goldOf(o) + ' золота в день', 14, PANEL + 70, { size: 10 });
      g.text(o.today ? 'Сегодня уже строили' : 'Сегодня можно строить', 14, PANEL + 84, { size: 10, color: o.today ? '#c8a0a0' : '#a0e0a0' });
      const v = TW.visitor(S, o);
      this.drawRow(g, 'garrison', 'Гарнизон', o.garrison, PANEL + 6, null);
      this.drawRow(g, 'hero', v ? 'Гость: ' + v.name + ', уровень ' + v.level : 'Гостя нет', v ? v.army : null, PANEL + 64, v);
      const B = [['blueprint', 'Чертёж', true], ['all', 'Нанять всех', o.pool.some((n, i) => n > 0 && TW.offers(o, i + 1).length)], ['guild', 'Гильдия', TW.has(o, 'guild1')], ['market', 'Рынок', TW.markets(S, this.pid) > 0], ['tavern', 'Таверна', TW.has(o, 'tavern')], ['caravan', 'Обоз', TW.has(o, 'caravan')], ['smith', 'Кузня', TW.has(o, 'smith')], ['exit', 'Выход', true]];
      B.forEach(([id, label, on], i) => this.button(g, 'p-' + id, label, 598 + (i >> 2) * 100, PANEL + 8 + (i % 4) * 26, 96, 22, () => this.press(id), !on));
      this.resStrip(g, 14, PANEL + 150, 112);
    }

    press(id) {
      if (id === 'blueprint') this.openWin({ kind: 'blueprint' });
      else if (id === 'all') this.openWin({ kind: 'all', tiers: [1, 2, 3, 4, 5, 6, 7] });
      else if (id === 'guild') this.openWin({ kind: 'guild' });
      else if (id === 'market') this.openMarket();
      else if (id === 'tavern') this.openWin({ kind: 'tavern' });
      else if (id === 'smith') this.openWin({ kind: 'smith' });
      else if (id === 'caravan') this.openCaravan();
      else if (id === 'exit') this.exit();
    }

    drawRow(g, side, title, army, y, hero) {
      const c = g.ctx, o = this.o;
      g.text(title, 206, y + 6, { size: 10, color: '#e8d8a8' });
      c.fillStyle = '#05070f';
      c.fillRect(206, y + 12, 44, 44);
      if (side === 'garrison') {
        const pal = H.Art.PALETTES[o.faction];
        c.fillStyle = pal.body;
        c.beginPath();
        c.moveTo(214, y + 18);
        c.lineTo(242, y + 18);
        c.lineTo(242, y + 36);
        c.lineTo(228, y + 50);
        c.lineTo(214, y + 36);
        c.closePath();
        c.fill();
        c.strokeStyle = pal.dark;
        c.stroke();
      } else if (hero) {
        H.Art.drawPortrait(g, hero, 206, y + 12, 44);
        this.region('hero-card', 206, y + 12, 44, 44, () => this.ui.show(new H.HeroView(this.ui, this, hero)), { info: () => [hero.name, 'Щелчок: окно героя'] });
      }
      if (army) this.armyCells(g, side, army, 256, y + 12, 44, 48, { hero });
      else {
        for (let i = 0; i < 7; i++) {
          c.fillStyle = '#05070f';
          c.fillRect(256 + i * 48, y + 12, 44, 44);
          c.strokeStyle = '#3a3020';
          c.strokeRect(256.5 + i * 48, y + 12.5, 43, 43);
        }
      }
    }

    frameAt(id) {
      const col = BLUEPRINT.findIndex(c => c.includes(id));
      if (col >= 0) return { x: 8 + col * 112, y: 304 - BLUEPRINT[col].indexOf(id) * 46, w: 104, h: 32 };
      const m = /^dwell(\d)(u?)$/.exec(id);
      return { x: 8 + (+m[1] - 1) * 112, y: m[2] ? 384 : 446, w: 104, h: 40 };
    }

    drawBlueprintWin(g) {
      const c = g.ctx, o = this.o, F = H.FACTIONS[o.faction];
      c.fillStyle = '#1c3a6e';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#24467e';
      for (let x = 0; x < H.W; x += 16) c.fillRect(x, 0, 1, H.H);
      for (let y = 0; y < H.H; y += 16) c.fillRect(0, y, H.W, 1);
      g.text('Чертёж: ' + o.name, H.W / 2, 22, { align: 'center', serif: true, color: '#e8f0ff' });
      g.text('Снизу вверх: что строится после чего. Щелчок по рамке — постройка.', H.W / 2, 44, { align: 'center', size: 10, color: '#b8c8e8' });
      g.text('Жилища', 8, 372, { bold: true, color: '#e8f0ff' });
      const states = Object.fromEntries(F.buildings.map(b => [b.id, TW.state(this.S, o, b.id)]));
      const hot = this.hot && this.hot.startsWith('bp-') ? this.hot.slice(3) : null;
      c.save();
      for (const b of F.buildings) {
        const to = this.frameAt(b.id);
        for (const n of b.needs) {
          const from = this.frameAt(n), missing = !TW.has(o, n), mine = b.id === hot;
          if (!mine && from.x !== to.x) continue;
          c.strokeStyle = mine ? (missing ? 'rgba(255,110,90,' + (0.5 + 0.5 * Math.sin(this.time * 8)).toFixed(2) + ')' : '#ffffff') : 'rgba(200,220,255,0.35)';
          c.lineWidth = mine ? 2 : 1;
          c.beginPath();
          c.moveTo(from.x + from.w / 2, from.y);
          c.lineTo(to.x + to.w / 2, to.y + to.h);
          c.stroke();
        }
      }
      c.restore();
      for (const b of F.buildings) {
        const f = this.frameAt(b.id), st = states[b.id], [line, fill, text] = FRAME[st.s];
        c.fillStyle = fill;
        c.fillRect(f.x, f.y, f.w, f.h);
        c.save();
        c.strokeStyle = this.hot === 'bp-' + b.id ? '#ffffff' : line;
        c.lineWidth = this.hot === 'bp-' + b.id ? 2 : 1;
        if (st.s === 'needs') c.setLineDash([3, 3]);
        c.strokeRect(f.x + 0.5, f.y + 0.5, f.w - 1, f.h - 1);
        c.restore();
        if (st.s === 'forbidden') {
          c.strokeStyle = 'rgba(192,64,64,0.7)';
          c.beginPath();
          c.moveTo(f.x + 4, f.y + 4);
          c.lineTo(f.x + f.w - 4, f.y + f.h - 4);
          c.moveTo(f.x + f.w - 4, f.y + 4);
          c.lineTo(f.x + 4, f.y + f.h - 4);
          c.stroke();
        }
        const name = H.Font.wrap('small', b.name, f.w - 8);
        name.slice(0, 2).forEach((s, i) => g.text(s, f.x + f.w / 2, f.y + (name.length > 1 ? 10 : 16) + i * 11, { align: 'center', size: 10, color: text }));
        if (f.h > 32) {
          const t = b.dwelling || b.upgrade, u = b.upgrade && o.branch[t] ? H.FACTIONS[o.faction].units[t - 1][o.branch[t] === 'a' ? 1 : 2] : null;
          if (u) g.text(H.UNITS[u].name, f.x + f.w / 2, f.y + 33, { align: 'center', size: 10, color: '#a0e0ff' });
        }
        this.region('bp-' + b.id, f.x, f.y, f.w, f.h, () => this.openWin({ kind: 'build', id: b.id }, true), { info: () => [b.name, STATE_TEXT[st.s] || st.why || '', ...H.Font.wrap('small', b.about, 240)] });
      }
      const legend = [['built', 'есть'], ['ok', 'можно'], ['money', 'нет ресурсов'], ['needs', 'нет постройки'], ['today', 'завтра'], ['forbidden', 'запрещено']];
      legend.forEach(([s, label], i) => {
        const x = 150 + i * 92;
        c.strokeStyle = FRAME[s][0];
        c.strokeRect(x + 0.5, 64.5, 12, 9);
        g.text(label, x + 18, 69, { size: 10, color: FRAME[s][2] });
      });
      this.resStrip(g, 14, 580, 96);
      this.button(g, 'bp-close', 'Закрыть', 690, 568, 100, 24, () => this.closeWin());
    }

    drawBuildWin(g, w) {
      const o = this.o, b = TW.def(o, w.id), st = TW.state(this.S, o, w.id), x = 170, y = 130, W = 460, Hh = 330;
      g.panel(x, y, W, Hh);
      g.text(b.name, x + W / 2, y + 26, { align: 'center', serif: true });
      g.ctx.fillStyle = '#0a1024';
      g.ctx.fillRect(x + 20, y + 48, 150, 120);
      TD.building(g.ctx, o.faction, w.id, x + 20, y + 48, 150, 120, this.time);
      H.Font.wrap('text', b.about, 250).slice(0, 6).forEach((s, i) => g.text(s, x + 186, y + 58 + i * 16, { size: 11 }));
      g.text('Цена:', x + 20, y + 190, { bold: true });
      if (Object.keys(b.cost).length) this.cost(g, b.cost, x + 70, y + 190);
      else g.text('даром', x + 70, y + 190, { size: 10 });
      if (b.needs.length) {
        g.text('Нужно:', x + 20, y + 212, { bold: true });
        let nx = x + 80;
        for (const n of b.needs) nx += 12 + g.text(TW.def(o, n).name, nx, y + 212, { size: 10, color: TW.has(o, n) ? '#a0e0a0' : '#ff7060' });
      }
      const why = st.s === 'forbidden' ? 'Нельзя: ' + st.why : STATE_TEXT[st.s];
      g.text(why, x + W / 2, y + 244, { align: 'center', color: st.s === 'ok' ? '#a0e0a0' : st.s === 'built' ? '#e8f0ff' : '#ffb090' });
      const go = () => {
        if (b.upgrade) this.openWin({ kind: 'branch', id: w.id }, true);
        else {
          const r = TW.build(this.S, o, w.id);
          this.events(r.ev);
          if (r.ok) this.openWin(null);
        }
      };
      w.enter = st.s === 'ok' ? go : null;
      this.button(g, 'b-go', b.upgrade ? 'Выбрать ветвь' : 'Строить', x + 90, y + Hh - 46, 130, 26, go, st.s !== 'ok');
      this.button(g, 'b-back', 'Назад', x + 240, y + Hh - 46, 130, 26, () => this.closeWin());
    }

    statRows(u) {
      return [['Натиск', u.atk], ['Стойкость', u.def], ['Урон', (u.dmg[0] + u.dmg[1]) / 2, u.dmg[0] + '–' + u.dmg[1]], ['Здоровье', u.hp], ['Скорость', u.speed], ['Инициатива', u.init], ['Выстрелы', u.shots || 0, u.shots ? String(u.shots) : '—']];
    }

    card(g, id, x, y, w, other) {
      const u = H.UNITS[id], c = g.ctx;
      c.fillStyle = '#0a1024';
      c.fillRect(x, y, w, 130);
      c.strokeStyle = '#6a5430';
      c.strokeRect(x + 0.5, y + 0.5, w - 1, 129);
      H.Art.drawUnit(c, id, x + w / 2, y + 116 + Math.sin(this.time * 2) * 2, { scale: u.big ? 0.95 : 1.25, tier: false });
      g.text(u.name, x + w / 2, y + 146, { align: 'center', bold: true });
      const mine = this.statRows(u), theirs = other ? this.statRows(H.UNITS[other]) : null;
      mine.forEach(([label, v, shown], i) => {
        const d = theirs ? v - theirs[i][1] : 0;
        g.text(label, x + 10, y + 166 + i * 14, { size: 10, color: '#c8b88a' });
        g.text(shown || String(v), x + w - 10, y + 166 + i * 14, { size: 10, align: 'right', color: d > 0 ? '#a0ffa0' : d < 0 ? '#ff9a8a' : '#f0e2b8' });
      });
      H.unitTraits(u).filter(t => !['Строй', 'Плач'].includes(t[0])).slice(0, 3).forEach((t, i) => g.text(t[0], x + 10, y + 268 + i * 13, { size: 10, color: '#a0c8ff' }));
    }

    drawBranchWin(g, w) {
      const o = this.o, b = TW.def(o, w.id), t = b.upgrade, row = H.FACTIONS[o.faction].units[t - 1], x = 70, y = 60, W = 660, Hh = 480;
      g.panel(x, y, W, Hh);
      g.text(b.name + ': выбор ветви', x + W / 2, y + 26, { align: 'center', serif: true });
      g.text('Выбор навсегда для этого города. Другой город этого народа может выбрать другую ветвь.', x + W / 2, y + 48, { align: 'center', size: 10, color: '#ffc080' });
      [['a', row[1], row[2]], ['b', row[2], row[1]]].forEach(([br, id, other], i) => {
        const cx = x + 24 + i * 316;
        this.card(g, id, cx, y + 64, 296, other);
        this.button(g, 'br-' + br, 'Строить: ' + H.UNITS[id].name, cx + 8, y + 64 + 316, 280, 26, () => {
          const r = TW.build(this.S, o, w.id, br);
          this.events(r.ev);
          if (r.ok) this.openWin(null);
        }, TW.state(this.S, o, w.id).s !== 'ok');
      });
      g.text('Цена:', x + 24, y + Hh - 52, { bold: true });
      this.cost(g, b.cost, x + 76, y + Hh - 52);
      this.button(g, 'br-back', 'Назад', x + W - 154, y + Hh - 66, 130, 26, () => this.closeWin());
    }

    drawRecruitWin(g, w) {
      const o = this.o, S = this.S, t = w.tier, list = TW.offers(o, t), u = H.UNITS[w.unit], x = 110, y = 90, W = 580, Hh = 400;
      const max = TW.canRecruit(S, o, t, w.unit);
      w.n = H.clamp(w.n, 0, max);
      g.panel(x, y, W, Hh);
      g.text(TW.def(o, TW.has(o, 'dwell' + t + 'u') ? 'dwell' + t + 'u' : 'dwell' + t).name, x + W / 2, y + 26, { align: 'center', serif: true });
      const c = g.ctx;
      if (list.length > 1) {
        list.forEach((id, i) => this.button(g, 'r-tab' + i, H.UNITS[id].name, x + 150 + i * 144, y + 42, 136, 22, () => { w.unit = id; w.n = Math.min(1, TW.canRecruit(S, o, t, id)); }, false));
        c.strokeStyle = '#ffe060';
        c.strokeRect(x + 148.5 + list.indexOf(w.unit) * 144, y + 40.5, 139, 25);
      }
      c.fillStyle = '#0a1024';
      c.fillRect(x + 20, y + 76, 190, 180);
      c.strokeStyle = '#6a5430';
      c.strokeRect(x + 20.5, y + 76.5, 189, 179);
      H.Art.drawUnit(c, w.unit, x + 115, y + 236 + Math.sin(this.time * 2) * 2, { scale: u.big ? 1 : 1.4, tier: false });
      g.text(u.name, x + 115, y + 270, { align: 'center', bold: true });
      this.statRows(u).forEach(([label, v, shown], i) => {
        g.text(label, x + 230, y + 86 + i * 16, { size: 10, color: '#c8b88a' });
        g.text(shown || String(v), x + 340, y + 86 + i * 16, { size: 10, align: 'right' });
      });
      g.text('Прирост: ' + TW.growth(S, o, t) + ' в неделю', x + 230, y + 204, { size: 10 });
      H.unitTraits(u).slice(0, 4).flatMap(tr => H.Font.wrap('small', tr[0] + ': ' + tr[1], 206).slice(0, 2)).slice(0, 8).forEach((s, i) => g.text(s, x + 358, y + 86 + i * 14, { size: 10, color: '#a0c8ff' }));
      g.text('Доступно: ' + o.pool[t - 1], x + 230, y + 230, { bold: true });
      g.text('Цена за одного:', x + 230, y + 250, { size: 10 });
      this.cost(g, TW.price(w.unit), x + 330, y + 250);
      const bar = { x: x + 230, y: y + 276, w: 220, h: 14 };
      const set = mx => { w.n = Math.round(H.clamp((mx - bar.x) / bar.w, 0, 1) * max); };
      this.button(g, 'r-minus', '−', bar.x - 26, bar.y - 4, 22, 22, () => { w.n = Math.max(0, w.n - 1); }, w.n <= 0);
      this.region('r-bar', bar.x, bar.y - 4, bar.w, bar.h + 8, mx => set(mx), { drag: mx => set(mx) });
      c.fillStyle = '#0a1024';
      c.fillRect(bar.x, bar.y, bar.w, bar.h);
      c.fillStyle = '#c8a050';
      c.fillRect(bar.x, bar.y, max ? bar.w * w.n / max : 0, bar.h);
      c.strokeStyle = '#6a5430';
      c.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1);
      this.button(g, 'r-plus', '+', bar.x + bar.w + 4, bar.y - 4, 22, 22, () => { w.n = Math.min(max, w.n + 1); }, w.n >= max);
      this.button(g, 'r-max', 'Максимум', bar.x + bar.w + 32, bar.y - 4, 80, 22, () => { w.n = max; }, !max);
      g.text('Нанять ' + w.n + ':', x + 230, y + 312, { size: 10 });
      this.cost(g, TW.price(w.unit), x + 300, y + 312, w.n);
      const hire = () => {
        const r = TW.recruit(S, o, t, w.unit, w.n);
        this.events(r.ev);
        if (r.ok) w.n = Math.min(1, TW.canRecruit(S, o, t, w.unit));
      };
      w.enter = w.n > 0 ? hire : null;
      if (!max) g.text(!o.pool[t - 1] ? 'Все наняты, новые придут через неделю' : !TW.room(S, o, w.unit) ? 'Нет свободной ячейки в войске' : 'Не хватает ресурсов', x + 230, y + 292, { size: 10, color: '#ff9a8a' });
      this.button(g, 'r-hire', 'Нанять', x + 230, y + Hh - 52, 110, 26, hire, w.n <= 0);
      const up = TW.upgradeOf(o, list[0]) && TW.upgradeTotal(S, o, t);
      if (up && Object.keys(up).length) {
        this.button(g, 'r-up', 'Улучшить в войске', x + 20, y + Hh - 52, 190, 26, () => this.events(TW.upgradeAll(S, o, t)), !TW.afford(this.res, up));
        this.cost(g, up, x + 24, y + Hh - 64);
      }
      this.button(g, 'r-close', 'Закрыть', x + W - 130, y + Hh - 52, 110, 26, () => this.closeWin());
    }

    drawAllWin(g, w) {
      const o = this.o, S = this.S, x = 160, y = 100, W = 480, Hh = 380, plan = TW.recruitPlan(S, o, w.tiers), total = {};
      g.panel(x, y, W, Hh);
      g.text('Нанять всех', x + W / 2, y + 26, { align: 'center', serif: true });
      g.text('От старших существ к младшим, на все деньги', x + W / 2, y + 46, { align: 'center', size: 10, color: '#c8b88a' });
      let row = 0;
      for (let t = 7; t >= 1; t--) {
        const list = TW.offers(o, t);
        if (!list.length) continue;
        const ry = y + 70 + row * 34, on = w.tiers.includes(t), p = plan.find(q => q.tier === t);
        this.region('all-' + t, x + 20, ry, 26, 26, () => { w.tiers = on ? w.tiers.filter(v => v !== t) : [...w.tiers, t]; });
        g.ctx.fillStyle = '#0a1024';
        g.ctx.fillRect(x + 24, ry + 5, 16, 16);
        g.ctx.strokeStyle = '#c8a050';
        g.ctx.strokeRect(x + 24.5, ry + 5.5, 15, 15);
        if (on) g.text('×', x + 32, ry + 13, { align: 'center', bold: true, color: '#ffe060' });
        const unit = list[list.length - 1];
        g.text(H.UNITS[unit].name, x + 52, ry + 13, { color: on ? '#f0e2b8' : '#8a7a5a' });
        g.text(p ? '× ' + p.n : 'доступно ' + o.pool[t - 1], x + 236, ry + 13, { size: 10, color: p ? '#a0ffa0' : '#8a7a5a' });
        if (p) {
          this.cost(g, p.cost, x + 320, ry + 13);
          for (const [k, v] of Object.entries(p.cost)) total[k] = (total[k] || 0) + v;
        }
        row++;
      }
      g.text('Всего:', x + 20, y + Hh - 72, { bold: true });
      if (Object.keys(total).length) this.cost(g, total, x + 80, y + Hh - 72);
      else g.text('нанимать некого или не на что', x + 80, y + Hh - 72, { size: 10, color: '#8a7a5a' });
      const go = () => {
        this.events(TW.recruitAll(S, o, w.tiers));
        this.closeWin();
      };
      w.enter = plan.length ? go : null;
      this.button(g, 'all-go', 'Нанять', x + 100, y + Hh - 46, 130, 26, go, !plan.length);
      this.button(g, 'all-close', 'Закрыть', x + 250, y + Hh - 46, 130, 26, () => this.closeWin());
    }

    drawTavernWin(g) {
      const o = this.o, S = this.S, x = 100, y = 80, W = 600, Hh = 420, why = TW.hireBlock(S, o);
      g.panel(x, y, W, Hh);
      g.text('Таверна', x + W / 2, y + 26, { align: 'center', serif: true });
      o.tavern.forEach((id, i) => {
        const cx = x + 24 + i * 284, cy = y + 50, c = g.ctx, rec = id && H.HEROES.find(v => v.id === id);
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(cx, cy, 268, 236);
        if (!rec) {
          g.text('Героев нет', cx + 134, cy + 118, { align: 'center', color: '#8a7a5a' });
          return;
        }
        const cls = H.CLASSES[rec.cls];
        H.Art.drawPortrait(g, { hid: rec.id, name: rec.name, cls: rec.cls, faction: cls.faction }, cx + 10, cy + 10, 64);
        g.text(rec.name, cx + 84, cy + 18, { bold: true });
        g.text(cls.name + ', ' + H.FACTIONS[cls.faction].name, cx + 84, cy + 34, { size: 10, color: '#c8b88a' });
        g.text(rec.spec.name, cx + 84, cy + 50, { size: 10, color: '#a0c8ff' });
        H.Font.wrap('small', rec.spec.about, 248).slice(0, 2).forEach((s, k) => g.text(s, cx + 10, cy + 88 + k * 13, { size: 10 }));
        g.text('Войско:', cx + 10, cy + 124, { bold: true });
        rec.army.forEach(([u, lo, hi], k) => g.text(H.UNITS[u].name + ' ' + lo + '–' + hi, cx + 14, cy + 140 + k * 14, { size: 10 }));
        this.button(g, 'tv-' + i, 'Нанять за ' + H.TOWN.heroPrice, cx + 34, cy + 196, 200, 26, () => {
          const r = TW.hire(S, o, i);
          this.events(r.ev);
          if (r.ok) this.closeWin();
        }, !!why);
      });
      const back = TW.backHeroes(S, o)[0];
      if (back) {
        g.text('Вернулся: ' + back.name + ', уровень ' + back.level + (back.army.some(Boolean) ? ', с войском' : ''), x + 24, y + 304, { bold: true, color: '#a0e0a0' });
        this.button(g, 'tv-back', 'Нанять за ' + H.TOWN.heroPrice, x + W - 224, y + 292, 200, 24, () => {
          const r = TW.hireBack(S, o, back.id);
          this.events(r.ev);
          if (r.ok) this.closeWin();
        }, !!why);
      } else if (why) g.text(why, x + W / 2, y + 302, { align: 'center', color: '#ff9a8a' });
      g.text('Слух недели', x + 24, y + 324, { bold: true });
      H.Font.wrap('text', TW.rumor(S), W - 48).slice(0, 3).forEach((s, i) => g.text(s, x + 24, y + 342 + i * 15, { size: 11, color: '#e8dcb8' }));
      this.button(g, 'tv-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawSmithWin(g) {
      const o = this.o, S = this.S, x = 130, y = 90, W = 540, Hh = 400, hero = TW.visitor(S, o), c = g.ctx;
      g.panel(x, y, W, Hh);
      g.text(TW.def(o, 'smith').name, x + W / 2, y + 26, { align: 'center', serif: true });
      g.text(hero ? 'Машины для героя ' + hero.name : 'Машину можно купить только герою в городе', x + W / 2, y + 48, { align: 'center', size: 10, color: hero ? '#c8b88a' : '#ff9a8a' });
      Object.entries(H.MACHINES).forEach(([id, m], i) => {
        const my = y + 66 + i * 92, u = H.UNITS[m.unit], price = H.Town.machinePrice(S, this.pid, id), has = hero && hero.machines.includes(id), poor = this.res.gold < price;
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(x + 20, my, W - 40, 84);
        H.Art.drawUnit(c, m.unit, x + 62, my + 68, { scale: 0.7, tier: false });
        g.text(u.name, x + 110, my + 16, { bold: true });
        H.Font.wrap('small', m.about, 250).slice(0, 2).forEach((s, k) => g.text(s, x + 110, my + 34 + k * 13, { size: 10 }));
        g.text('Здоровье ' + u.hp + (u.machine === 'ballista' ? ', урон ' + u.dmg[0] + '–' + u.dmg[1] : ''), x + 110, my + 66, { size: 10, color: '#c8b88a' });
        this.cost(g, { gold: price }, x + 380, my + 22);
        this.button(g, 'sm-' + id, has ? 'Уже есть' : 'Купить', x + 380, my + 44, 120, 26, () => {
          if (H.Hero.buyMachine(S, hero, id)) this.toast(u.name + ': куплено', '#a0ffa0');
        }, !hero || has || poor);
      });
      g.text('Катапульта есть у каждого нападающего героя. Разбитую машину покупают снова.', x + W / 2, y + Hh - 54, { align: 'center', size: 10, color: '#a89870' });
      this.button(g, 'sm-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawChamberWin(g, w) {
      const o = this.o, S = this.S, x = 130, y = 90, W = 540, Hh = 400, hero = TW.visitor(S, o), c = g.ctx;
      g.panel(x, y, W, Hh);
      g.text(TW.def(o, w.id).name, x + W / 2, y + 26, { align: 'center', serif: true });
      g.text(hero ? 'Покупает герой ' + hero.name : 'Купить может только герой в городе', x + W / 2, y + 48, { align: 'center', size: 10, color: hero ? '#c8b88a' : '#ff9a8a' });
      TW.shop(S, o).forEach((id, i) => {
        const my = y + 66 + i * 92;
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(x + 20, my, W - 40, 84);
        if (!id) {
          g.text('Продано', x + W / 2, my + 42, { align: 'center', color: '#8a7a5a' });
          return;
        }
        const a = H.ARTIFACTS[id];
        H.Art.drawArtifact(c, id, x + 32, my + 18, 48);
        g.text(a.name, x + 96, my + 18, { bold: true });
        H.Font.wrap('small', a.about, 260).slice(0, 2).forEach((s, k) => g.text(s, x + 96, my + 36 + k * 13, { size: 10 }));
        if (a.set) g.text('Набор: ' + H.ART_SETS[a.set].name, x + 96, my + 68, { size: 10, color: '#a0c8ff' });
        this.cost(g, { gold: a.cost }, x + 380, my + 22);
        this.button(g, 'ch-' + i, 'Купить', x + 380, my + 44, 120, 26, () => {
          const r = TW.buyArt(S, o, i);
          if (r.ok) this.toast(a.name + ': куплено', '#a0ffa0');
          else this.toast(r.why, '#ff9080');
        }, !hero || this.res.gold < a.cost);
      });
      this.button(g, 'ch-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawRingWin(g) {
      const o = this.o, S = this.S, x = 170, y = 90, W = 460, Hh = 360, c = g.ctx, hero = TW.visitor(S, o), why = hero ? H.Sites.ringWhy(S, hero) : 'Нужен герой Чащи у ворот города', list = hero ? H.Sites.ringTargets(S, hero, o) : [];
      c.fillStyle = 'rgba(5,7,15,0.7)';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#10180e';
      c.fillRect(x, y, W, Hh);
      c.strokeStyle = '#6a8a52';
      c.strokeRect(x + 0.5, y + 0.5, W - 1, Hh - 1);
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2, gx = x + W / 2 + Math.cos(a) * 60, gy = y + 84 + Math.sin(a) * 22;
        c.fillStyle = '#d8d0b0';
        c.fillRect(gx - 3, gy - 2, 6, 3);
        c.fillStyle = '#6a4a2a';
        c.fillRect(gx - 1, gy + 1, 2, 3);
      }
      g.text('Ведьмино кольцо', x + W / 2, y + 30, { align: 'center', serif: true, size: 18 });
      if (hero && !why) g.text('Переход стоит ' + H.Sites.ringCost(S, hero) + ' шагов, раз в день. У героя ' + Math.floor(hero.steps), x + W / 2, y + 130, { align: 'center', size: 10, color: '#c8b88a' });
      if (why) g.text(why, x + W / 2, y + 130, { align: 'center', color: '#e0a080' });
      else if (!list.length) g.text('Кольцу некуда вести: постройте ещё одно или займите ведьмин круг', x + W / 2, y + 130, { align: 'center', color: '#a89870' });
      if (!why) {
        list.forEach((t, i) => this.button(g, 'ring-' + t.id, H.Sites.ringName(S, t), x + 90, y + 148 + i * 32, W - 180, 26, () => {
          const ev = [];
          if (H.Sites.ringJump(S, hero, t, ev)) this.exit();
        }));
      }
      this.button(g, 'ring-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawReforgeWin(g) {
      const o = this.o, S = this.S, x = 140, y = 70, W = 520, Hh = 430, c = g.ctx, hero = TW.visitor(S, o), pairs = hero ? TW.reforgePairs(hero).slice(0, 6) : [], items = hero ? TW.forgeables(hero) : [];
      c.fillStyle = 'rgba(5,7,15,0.7)';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#1a100c';
      c.fillRect(x, y, W, Hh);
      c.strokeStyle = '#a8602a';
      c.strokeRect(x + 0.5, y + 0.5, W - 1, Hh - 1);
      c.fillStyle = '#3a3634';
      c.fillRect(x + W / 2 - 40, y + 56, 80, 14);
      c.fillRect(x + W / 2 - 14, y + 70, 28, 14);
      c.fillStyle = 'rgba(255,140,40,0.7)';
      c.fillRect(x + W / 2 - 40, y + 52, 80, 4);
      g.text('Великий горн', x + W / 2, y + 30, { align: 'center', serif: true, size: 18 });
      g.text('Две вещи одного места и одной редкости дают одну вещь того же места, на ступень реже', x + W / 2, y + 100, { align: 'center', size: 10, color: '#d8c8a8' });
      if (!hero) g.text('Нужен герой у ворот города', x + W / 2, y + 140, { align: 'center', color: '#e0a080' });
      else if (!pairs.length) g.text('У героя нет двух вещей одного места и одной редкости', x + W / 2, y + 140, { align: 'center', color: '#a89870' });
      pairs.forEach(([i, j], k) => {
        const a = H.ARTIFACTS[items[i].id], b = H.ARTIFACTS[items[j].id], yy = y + 122 + k * 44, cost = TW.reforgeCost(hero, a.rank);
        c.fillStyle = 'rgba(40,24,16,0.8)';
        c.fillRect(x + 16, yy - 4, W - 32, 40);
        H.Art.drawArtifact(c, a.id, x + 22, yy, 32);
        H.Art.drawArtifact(c, b.id, x + 58, yy, 32);
        g.text(a.name + ' и ' + b.name, x + 100, yy + 10, { size: 10, bold: true });
        g.text(H.ART_RANKS[a.rank][0] + ' → ' + H.ART_RANKS[a.rank === 'plain' ? 'rare' : 'relic'][0], x + 100, yy + 26, { size: 10, color: '#c8b88a' });
        this.button(g, 'reforge-' + k, 'Перековать: ' + cost, x + W - 190, yy + 2, 170, 26, () => {
          const made = TW.reforge(S, o, hero, i, j);
          if (made) this.toast('Вышло: ' + H.ARTIFACTS[made].name, '#ffd080');
        }, this.res.gold < cost);
      });
      this.button(g, 'reforge-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawBarrowWin(g) {
      const o = this.o, S = this.S, x = 110, y = 56, W = 580, Hh = 484, c = g.ctx, list = o.barrow.slice().sort((a, b) => H.UNITS[b.unit].cost - H.UNITS[a.unit].cost), limit = TW.barrowLimit(S, o), left = TW.raiseLeft(S, o);
      c.fillStyle = 'rgba(5,7,15,0.7)';
      c.fillRect(0, 0, H.W, H.H);
      c.fillStyle = '#17120c';
      c.fillRect(x, y, W, Hh);
      c.fillStyle = '#2a2318';
      c.beginPath();
      c.ellipse(x + W / 2, y + 96, W / 2 - 20, 62, 0, Math.PI, Math.PI * 2);
      c.fill();
      c.fillStyle = '#e8e4d0';
      for (let k = 0; k < 40; k++) c.fillRect(x + 40 + ((k * 37) % (W - 80)), y + 40 + ((k * 13) % 54), 2, 1);
      c.strokeStyle = '#8a7a5a';
      c.strokeRect(x + 0.5, y + 0.5, W - 1, Hh - 1);
      const name = ['barrow3', 'barrow2', 'special1'].find(id => TW.has(o, id));
      g.text(TW.def(o, name).name, x + W / 2, y + 30, { align: 'center', serif: true, size: 18 });
      g.text('Поднять за неделю ещё на ' + left + ' из ' + limit + ' золота ценности', x + W / 2, y + 118, { align: 'center', size: 10, color: '#c8b88a' });
      c.fillStyle = '#05070f';
      c.fillRect(x + 90, y + 126, W - 180, 8);
      c.fillStyle = '#d8d0b0';
      c.fillRect(x + 90, y + 126, (W - 180) * (limit ? left / limit : 0), 8);
      if (!list.length) g.text('В кургане пусто. Сюда уходят тени павших после боя.', x + W / 2, y + 190, { align: 'center', color: '#a89870' });
      list.slice(0, 7).forEach((e, i) => {
        const ry = y + 146 + i * 42, u = H.UNITS[e.unit], max = TW.canRaise(S, o, e.unit);
        c.fillStyle = 'rgba(232,228,208,0.06)';
        c.fillRect(x + 16, ry, W - 32, 38);
        H.Art.drawUnit(c, e.unit, x + 40, ry + 36, { scale: 0.34, tier: false });
        g.text(u.name, x + 66, ry + 15, { bold: true });
        g.text('в кургане ' + e.count + ', цена ' + TW.raisePrice(S, o.owner, e.unit) + ' золота', x + 66, ry + 31, { size: 10, color: '#c8b88a' });
        this.button(g, 'bw-one-' + e.unit, 'Одного', x + W - 196, ry + 7, 80, 24, () => this.events(TW.raise(S, o, e.unit, 1).ev), max < 1);
        this.button(g, 'bw-all-' + e.unit, max > 0 ? 'Всех: ' + max : 'Всех', x + W - 110, ry + 7, 90, 24, () => this.events(TW.raise(S, o, e.unit, max).ev), max < 1);
      });
      this.button(g, 'bw-raise', 'Поднять всех', x + 24, y + Hh - 40, 150, 26, () => this.events(TW.raiseAll(S, o)), !list.some(e => TW.canRaise(S, o, e.unit) > 0));
      this.button(g, 'bw-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawContractsWin(g) {
      const o = this.o, S = this.S, C = H.Contracts, x = 56, y = 40, W = 688, Hh = 516, c = g.ctx, deals = S.players[this.pid].deals, cap = H.TOWN.contract.active, offers = C.board(S, o), inHand = deals.length >= cap, ink = '#2a1c0c';
      g.panel(x, y, W, Hh);
      g.text('Ратуша контрактов', x + W / 2, y + 26, { align: 'center', serif: true });
      g.text('На доске новые бумаги каждую неделю. Срок контракта ' + H.TOWN.contract.term + ' дней с того дня, как его взяли.', x + W / 2, y + 46, { align: 'center', size: 10, color: '#c8b88a' });
      for (let i = 0; i < H.TOWN.contract.board; i++) {
        const d = offers[i], sx = x + 18 + i * 220, sy = y + 60, sw = 212, sh = 216;
        c.fillStyle = '#17110a';
        c.fillRect(sx + 3, sy + 3, sw, sh);
        c.fillStyle = d ? '#d8c698' : '#4a3f2c';
        c.fillRect(sx, sy, sw, sh);
        c.strokeStyle = d ? '#8a7446' : '#2a2318';
        c.strokeRect(sx + 3.5, sy + 3.5, sw - 7, sh - 7);
        if (!d) {
          g.text('Бумагу сняли', sx + sw / 2, sy + sh / 2, { align: 'center', color: '#a89870' });
          continue;
        }
        const text = C.describe(S, d);
        c.fillStyle = '#7a1e14';
        c.beginPath();
        c.arc(sx + sw - 24, sy + 24, 11, 0, Math.PI * 2);
        c.fill();
        g.text(text.title, sx + 14, sy + 24, { serif: true, color: ink });
        text.lines.flatMap(l => H.Font.wrap('small', l, sw - 28)).slice(0, 6).forEach((l, k) => g.text(l, sx + 14, sy + 54 + k * 14, { size: 10, color: ink }));
        g.text('Плата:', sx + 14, sy + 148, { size: 10, bold: true, color: ink });
        H.Font.wrap('small', text.reward, sw - 28).slice(0, 2).forEach((l, k) => g.text(l, sx + 14, sy + 162 + k * 13, { size: 10, color: ink }));
        this.button(g, 'ct-take-' + i, 'Взять', sx + sw / 2 - 50, sy + sh - 30, 100, 22, () => {
          const r = C.take(S, o, i);
          this.toast(r.ok ? 'Контракт взят: ' + text.title : r.why, r.ok ? '#a0ffa0' : '#ff9080');
        }, inHand);
      }
      g.text('Идут контракты: ' + deals.length + ' из ' + cap, x + 24, y + 298, { bold: true });
      if (!deals.length) g.text('Пока ни одного. Возьмите бумагу с доски.', x + 24, y + 322, { size: 10, color: '#a89870' });
      deals.forEach((d, i) => {
        const ry = y + 310 + i * 52, text = C.describe(S, d), left = d.until - S.day, here = C.canDeliver(S, o, d);
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(x + 20, ry, W - 40, 46);
        g.text(text.title + ': ' + text.lines[0], x + 30, ry + 14, { size: 10 });
        g.text(text.reward + ', осталось ' + left + ' ' + H.plural(left, 'день', 'дня', 'дней'), x + 30, ry + 32, { size: 10, color: left <= 2 ? '#ff9a8a' : '#c8b88a' });
        if (d.kind === 'supply') {
          this.button(g, 'ct-give-' + d.id, 'Сдать', x + W - 244, ry + 10, 96, 24, () => {
            const r = C.deliver(S, o, d.id);
            this.events(r.ev);
            if (!r.ok) this.toast(r.why, '#ff9080');
          }, !here);
        }
        this.button(g, 'ct-drop-' + d.id, 'Отказаться', x + W - 136, ry + 10, 106, 24, () => C.dropDeal(S, this.pid, d.id));
      });
      this.button(g, 'ct-close', 'Закрыть', x + W - 134, y + Hh - 36, 110, 26, () => this.closeWin());
    }

    drawShipyardWin(g) {
      const o = this.o, S = this.S, x = 200, y = 180, W = 400, Hh = 200, free = H.Sites.dockFree(S, o), rich = TW.afford(this.res, H.MAP.boat);
      g.panel(x, y, W, Hh);
      g.text(TW.def(o, 'shipyard').name, x + W / 2, y + 26, { align: 'center', serif: true });
      g.text(free ? 'Лодка встанет у причала. На ней герой идёт по воде.' : 'У причала уже стоит лодка', x + W / 2, y + 62, { align: 'center' });
      this.cost(g, H.MAP.boat, x + 120, y + 88);
      this.button(g, 'yard-build', 'Построить лодку', x + 60, y + Hh - 44, 150, 26, () => {
        if (H.Sites.buildBoat(S, o, o.owner)) this.toast('Лодка у причала', '#a0ffa0');
      }, !free || !rich);
      this.button(g, 'yard-close', 'Закрыть', x + W - 170, y + Hh - 44, 110, 26, () => this.closeWin());
    }

    drawCaravanWin(g, w) {
      const o = this.o, S = this.S, x = 90, y = 70, W = 620, Hh = 450, c = g.ctx, list = TW.caravanSources(S, o), from = list.find(t => t.id === w.from) || list[0] || null;
      g.panel(x, y, W, Hh);
      g.text('Обоз в город ' + o.name, x + W / 2, y + 26, { align: 'center', serif: true });
      g.text('Откуда', x + 24, y + 54, { bold: true });
      if (!list.length) g.text('В других ваших городах некого нанять', x + 24, y + 76, { color: '#8a7a5a' });
      list.forEach((t, i) => {
        const id = 'cv-from-' + t.id, ty = y + 66 + i * 30, on = from === t;
        this.region(id, x + 20, ty, 190, 26, () => {
          w.from = t.id;
          w.off = {};
        });
        g.button({ x: x + 20, y: ty, w: 190, h: 26, label: t.name || H.OBJ[t.t].name, hot: this.hot === id, down: on });
      });
      const rows = from ? TW.caravanRows(S, from).filter(r => !w.off[r.tier]) : [], route = from ? Adv.caravanRoute(S, from, o) : null;
      if (route) this.drawRoute(c, route, from, x + 24, y + 186, 100);
      if (from) {
        g.text('Кого везти', x + 230, y + 54, { bold: true });
        TW.caravanRows(S, from).forEach((r, i) => {
          const ry = y + 66 + i * 30, id = 'cv-t-' + r.tier, on = !w.off[r.tier];
          this.region(id, x + 228, ry, 360, 26, () => { w.off[r.tier] = on; });
          c.fillStyle = on ? 'rgba(80,110,200,0.25)' : 'rgba(5,7,15,0.5)';
          c.fillRect(x + 228, ry, 360, 26);
          c.strokeStyle = '#6a5430';
          c.strokeRect(x + 228.5, ry + 0.5, 359, 25);
          g.text((on ? '+ ' : '− ') + H.UNITS[r.unit].name + ': ' + r.n, x + 238, ry + 13, { color: on ? '#fff6d0' : '#8a7a5a' });
        });
      }
      const line = y + 300, cost = rows.length ? TW.caravanCost(o, rows) : null, why = from ? TW.caravanWhy(S, from, o, rows) : 'Некого отправить';
      if (cost) {
        g.text('Цена с платой за обоз:', x + 24, line, { bold: true });
        this.cost(g, cost, x + 200, line);
        g.text((route ? 'В пути около ' + Math.max(1, Math.ceil(route.cost / H.MAP.caravanSteps)) + ' дн., ' : 'Пути нет. ') + H.MAP.caravanSteps + ' шагов в день. Обоз виден всем, чужой герой может на него напасть.', x + 24, line + 22, { size: 10, color: '#c8b88a' });
      }
      const going = S.caravans.filter(v => v.to === o.id && v.owner === this.pid);
      g.text('В пути сюда: ' + (going.length ? going.map(v => v.stacks.map(q => H.UNITS[q.unit].name + ' ' + q.count).join(', ')).join('; ').slice(0, 80) : 'нет'), x + 24, line + 44, { size: 10 });
      if (why && from) g.text(why, x + 24, line + 66, { color: '#ff9a8a' });
      const go = () => {
        const r = TW.sendCaravan(S, from, o, rows);
        if (r.ok) {
          this.toast('Обоз вышел', '#a0ffa0');
          this.closeWin();
        }
      };
      w.enter = !why ? go : null;
      this.button(g, 'cv-go', 'Отправить', x + W - 264, y + Hh - 40, 120, 26, go, !!why);
      this.button(g, 'cv-close', 'Закрыть', x + W - 134, y + Hh - 40, 110, 26, () => this.closeWin());
    }

    drawRoute(c, route, from, x, y, size) {
      const M = this.S.map, k = size / Math.max(M.w, M.h), a = MDR.minimap(this.S, this.o.l, this.pid, Adv.visible(this.S, this.pid, this.o.l));
      c.imageSmoothingEnabled = false;
      c.drawImage(a, x, y, M.w * k, M.h * k);
      c.strokeStyle = '#6a5430';
      c.strokeRect(x - 0.5, y - 0.5, M.w * k + 1, M.h * k + 1);
      c.fillStyle = '#ffe060';
      for (const i of route.cells) c.fillRect(x + (i % M.w) * k, y + ((i / M.w) | 0) * k, Math.max(1, k), Math.max(1, k));
    }

    drawMarketWin(g, w) {
      const S = this.S, x = 100, y = 70, W = 600, Hh = 450, q = TW.quote(S, this.pid, w.from, w.to);
      g.panel(x, y, W, Hh);
      g.text('Рынок', x + W / 2, y + 26, { align: 'center', serif: true });
      g.text('Рынков у вас: ' + TW.markets(S, this.pid) + '. Каждый рынок улучшает курс.', x + W / 2, y + 46, { align: 'center', size: 10, color: '#c8b88a' });
      g.text('Отдаёте', x + 30, y + 70, { bold: true });
      g.text('Получаете', x + 330, y + 70, { bold: true });
      H.RESOURCES.forEach(([id, name], i) => {
        const ry = y + 82 + i * 34, c = g.ctx;
        for (const [side, bx] of [['from', x + 30], ['to', x + 330]]) {
          const on = w[side] === id;
          this.region('m-' + side + id, bx, ry, 240, 28, () => { w[side] = id; w.m = 0; });
          c.fillStyle = on ? '#2a3a6a' : this.hot === 'm-' + side + id ? '#1a2448' : '#0a1024';
          c.fillRect(bx, ry, 240, 28);
          c.strokeStyle = on ? '#ffe060' : '#6a5430';
          c.strokeRect(bx + 0.5, ry + 0.5, 239, 27);
          c.fillStyle = MDR.RES[id];
          c.fillRect(bx + 8, ry + 8, 12, 12);
          g.text(name, bx + 28, ry + 14, { size: 11 });
          if (side === 'from') g.text(String(this.res[id]), bx + 232, ry + 14, { align: 'right', size: 10 });
          else {
            const k = TW.quote(S, this.pid, w.from, id);
            g.text(k ? (k.give >= k.get ? '1 → ' + Math.floor(k.give / k.get) : Math.ceil(k.get / k.give) + ' → 1') : '—', bx + 232, ry + 14, { align: 'right', size: 10, color: '#c8b88a' });
          }
        }
      });
      const max = q ? q.max : 0;
      w.m = H.clamp(w.m, 0, max);
      const bar = { x: x + 120, y: y + 334, w: 360, h: 14 }, c = g.ctx, set = mx => { w.m = Math.round(H.clamp((mx - bar.x) / bar.w, 0, 1) * max); };
      this.region('m-bar', bar.x, bar.y - 4, bar.w, bar.h + 8, mx => set(mx), { drag: mx => set(mx), off: !max });
      c.fillStyle = '#0a1024';
      c.fillRect(bar.x, bar.y, bar.w, bar.h);
      c.fillStyle = '#c8a050';
      c.fillRect(bar.x, bar.y, max ? bar.w * w.m / max : 0, bar.h);
      c.strokeStyle = '#6a5430';
      c.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1);
      this.button(g, 'm-minus', '−', bar.x - 28, bar.y - 4, 22, 22, () => { w.m = Math.max(0, w.m - 1); }, w.m <= 0);
      this.button(g, 'm-plus', '+', bar.x + bar.w + 6, bar.y - 4, 22, 22, () => { w.m = Math.min(max, w.m + 1); }, w.m >= max);
      const give = q && w.m ? TW.tradeCost(q, w.m) : 0;
      g.text(q ? 'Отдаёте: ' + RES_NAME[w.from].toLowerCase() + ' ' + give + '. Получаете: ' + RES_NAME[w.to].toLowerCase() + ' ' + w.m + '.' : 'Выберите два разных ресурса', x + W / 2, y + 370, { align: 'center' });
      const go = () => {
        const r = TW.trade(S, this.pid, w.from, w.to, w.m);
        this.events(r.ev);
        w.m = 0;
      };
      w.enter = w.m > 0 ? go : null;
      this.button(g, 'm-all', 'Всё', x + 110, y + Hh - 46, 110, 26, () => { w.m = max; }, !max);
      this.button(g, 'm-go', 'Обменять', x + 240, y + Hh - 46, 120, 26, go, !w.m);
      this.button(g, 'm-close', 'Закрыть', x + 380, y + Hh - 46, 110, 26, () => this.closeWin());
    }

    drawGuildWin(g, w) {
      const o = this.o, x = 110, y = 60, W = 580, Hh = 470, c = g.ctx, v = TW.visitor(this.S, o);
      g.panel(x, y, W, Hh);
      g.text('Гильдия чар', x + W / 2, y + 26, { align: 'center', serif: true });
      g.text(v ? v.name + ' учит всё, что ему доступно' : 'Гостя нет: заклинания выучит герой у ворот', x + W / 2, y + 46, { align: 'center', size: 10, color: '#c8b88a' });
      H.TOWN.shelves.forEach((n, i) => {
        const ry = y + 62 + i * 68, built = TW.has(o, 'guild' + (i + 1)), list = built ? TW.shelf(o, i + 1) : [];
        g.text('Круг ' + (i + 1), x + 20, ry + 26, { bold: true, color: built ? '#f0e2b8' : '#6a604a' });
        if (!built) g.text('не построен', x + 20, ry + 40, { size: 10, color: '#8a7a5a' });
        for (let k = 0; k < Math.max(n, list.length); k++) {
          const sx = x + 90 + k * 72;
          c.fillStyle = built ? '#0a1024' : '#14141a';
          c.fillRect(sx, ry, 60, 60);
          c.strokeStyle = built ? '#6a5430' : '#2a2a30';
          c.strokeRect(sx + 0.5, ry + 0.5, 59, 59);
          const id = list[k];
          if (!id) continue;
          const sp = H.SPELLS[id], knows = v && v.spells.includes(id), can = !v || H.Hero.canLearn(v, id);
          H.Art.drawSpell(g, id, sx + 6, ry + 6, 48, !can);
          if (knows) {
            c.fillStyle = '#a0ffa0';
            c.fillRect(sx + 50, ry + 4, 6, 6);
          }
          this.region('gs-' + id, sx, ry, 60, 60, () => { w.pick = id; }, { info: () => [sp.name, H.SCHOOLS[sp.school] + ', круг ' + sp.circle + ', мана ' + sp.mana, sp.about, knows ? 'Герой знает' : can ? 'Доступно' : 'Нужна школа ' + H.SCHOOLS[sp.school]] });
        }
      });
      if (w.pick) {
        const sp = H.SPELLS[w.pick];
        g.text(sp.name + ': ' + sp.about, x + 20, y + Hh - 22, { size: 10, color: '#e8dcb8' });
      }
      this.button(g, 'g-close', 'Закрыть', x + W - 124, y + Hh - 36, 110, 26, () => this.closeWin());
    }

    drawInfoWin(g, w) {
      const b = TW.def(this.o, w.id), x = 190, y = 170, W = 420, lines = H.Font.wrap('text', b.about, W - 60), Hh = 110 + lines.length * 16;
      g.panel(x, y, W, Hh);
      g.text(b.name, x + W / 2, y + 26, { align: 'center', serif: true });
      lines.forEach((s, i) => g.text(s, x + W / 2, y + 56 + i * 16, { align: 'center' }));
      w.enter = () => this.closeWin();
      this.button(g, 'i-close', 'Закрыть', x + W / 2 - 55, y + Hh - 40, 110, 26, () => this.closeWin());
    }
  }

  Object.assign(TownView.prototype, H.Regions, H.ArmyCells);
  H.TownView = TownView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
