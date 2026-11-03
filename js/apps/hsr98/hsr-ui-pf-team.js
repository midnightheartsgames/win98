(function (H) {
  'use strict';
  const G = H.Gfx, PF = H.PF, TUN = PF.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const ROMAN = ['I', 'II', 'III', 'IV'];
  const GRID = { x: 12, y: 72, cols: 4, rows: 7, cell: 40, pitch: 44 };
  const SQUAD_ROW = 26, SQUADS_SHOWN = 12;
  const TITLE_W = 248;
  const FILTERS = [{ id: 'all', label: 'Все типы' }, { id: 'rec', label: 'Рекомендуемые' }].concat(Object.keys(H.ELEMENTS).map(id => ({ id, label: H.ELEMENTS[id].name })));
  const ROW = { x: 204, w: 430, h: 112, y: [166, 284] };

  const mainFoe = node => {
    const last = node.waves[node.waves.length - 1].pool;
    return H.ENEMIES[(last.find(([id]) => PF.special(id)) || last[0])[0]];
  };

  Object.assign(H.UI.prototype, {
    openPfSure(title, text, yes, fn) {
      const ui = this, lines = ui.wrap(text, 300, 12);
      this.push({
        pf: true, sel: 1,
        choose() { ui.screens.pop(); if (this.sel === 0) fn(); else ui.sfx('cancel'); },
        draw(c) {
          const h = 96 + lines.length * 15, y = Math.round((HGT - h) / 2), x = W / 2 - 170;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 340, h, { title, border: '#d86060' });
          lines.forEach((l, i) => ui.text(l, W / 2, y + 24 + i * 15, { align: 'center', size: 12, col: C.cream }));
          [yes, 'Отмена'].forEach((label, i) => ui.button(x + 16 + i * 158, y + h - 46, 150, 28, label, () => { this.sel = i; this.choose(); }, { active: i === this.sel, bold: i === this.sel }));
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.choose();
          if (k === 'back') { this.sel = 1; this.choose(); }
        }
      });
    },

    openPfNode(n, ni) {
      const ui = this, g = this.game, st = g.pfStage(n), node = st.nodes[ni], rec = PF.recOf(node);
      const pig = node.waves.some(w => w.pool.some(([id]) => id === 'pf_trotter')), lord = node.waves.some(w => w.pool.some(([id]) => H.ENEMIES[id].boss));
      const notes = [];
      if (pig) notes.push('Свинка сбегает после ' + TUN.trotterFlee + ' ходов. Её слабости совпадают с рекомендуемыми типами.');
      if (lord) notes.push('Риторика: босс не падает, пока в волне не побеждено ' + TUN.eloq + ' врагов, затем получает на 500% больше урона.');
      this.push({
        pf: true,
        draw(c) {
          const x = 44, w = 552, lines = notes.map(t => ui.wrap(t, w - 32, 10)).flat(), h = 72 + node.waves.reduce((a, wave) => a + 22 + Math.ceil(wave.pool.length / 2) * 32, 0) + lines.length * 13, y = Math.max(6, Math.round((HGT - h) / 2) - 8);
          c.fillStyle = 'rgba(2,3,12,0.7)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Этап ' + n + ', узел ' + (ni + 1), border: '#7ac8ff' });
          ui.text('Враги ур. ' + st.lvl + ', циклов ' + st.cycles, x + 16, y + 22, { size: 11, bold: true, col: C.cream });
          ui.text('Рекомендуемые типы:', x + w - 66, y + 23, { align: 'right', size: 10, col: C.sub });
          rec.forEach((e, i) => G.elemIcon(c, e, x + w - 52 + i * 18, y + 29, 7));
          let ry = y + 42;
          node.waves.forEach((wave, wi) => {
            const vals = PF.valuesOf(wave, wi);
            ui.text('Волна ' + (wi + 1) + ': на поле до ' + wave.max + ', всего ' + H.fmt(TUN.waveValue[wi]) + ' очков', x + 16, ry, { size: 10, bold: true, col: C.gold });
            ry += 16;
            wave.pool.forEach(([id, count], i) => {
              const d = H.ENEMIES[id], cx = x + 16 + (i % 2) * 262, cy = ry + Math.floor(i / 2) * 32, kind = PF.kindOf(id);
              G.foeIcon(c, d, cx, cy, 28);
              ui.text(ui.fitText(d.name, 10, 186, true) + ' ×' + count, cx + 34, cy + 1, { size: 10, bold: kind !== 'normal', col: kind === 'normal' ? C.cream : C.gold });
              ui.text('Цена ' + H.fmt(vals[id].d + vals[id].k), cx + 34, cy + 15, { size: 9, col: C.sub });
              (id === 'pf_trotter' ? rec : d.weak).slice(0, 5).forEach((e, k) => G.elemIcon(c, e, cx + 124 + k * 14, cy + 20, 5));
            });
            ry += Math.ceil(wave.pool.length / 2) * 32 + 6;
          });
          lines.forEach((l, i) => ui.text(l, x + 16, ry + i * 13, { size: 10, col: '#ffd471' }));
          ui.hints([['Esc', 'Закрыть']], W / 2, y + h - 18, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => ui.pop());
        },
        key(k) { if (k === 'back' || k === 'ok') ui.pop(); }
      });
    },

    openPfCaco(n, node) {
      const ui = this, g = this.game, season = g.pfSeason(), list = season.caco, plan = () => g.pf().plan[n].caco[node];
      g.pfTeams(n);
      this.sfx('confirm');
      this.push({
        full: true, pf: true, pick: true, sel: plan(),
        choose() { g.pfSetCaco(n, node, this.sel); ui.screens.pop(); ui.sfx('confirm'); },
        draw(c) {
          c.drawImage(G.bgCanvas('pf', W, HGT), 0, 0);
          c.fillStyle = 'rgba(4,6,30,0.86)'; c.fillRect(0, 0, W, HGT);

          ui.fhBox(10, 10, 226, 436, 'rgba(122,200,255,0.5)');
          G.pfWings(c, 75, 22, 3);
          ui.text('Узел ' + (node + 1), 123, 72, { align: 'center', size: 20, bold: true, serif: true, col: C.gold });
          const team = g.pfTeams(n)[node];
          for (let i = 0; i < 4; i++) {
            const x = 22 + i * 51, y = 106, k = team[i];
            if (k) { const kid = g.kitOf(k); ui.portraitCard(c, G.lookOf(kid, g), x, y, 46, { elem: H.CHARS[kid].elem, border: C.brassHi }); }
            else { c.fillStyle = 'rgba(10,14,40,0.8)'; c.fillRect(x, y, 46, 46); c.strokeStyle = '#3a4a78'; c.strokeRect(x + 0.5, y + 0.5, 45, 45); }
          }
          ui.text('Нелепость: ' + season.whim.name, 22, 164, { size: 10, bold: true, col: C.gold });
          ui.wrap(season.whim.text, 204, 10).forEach((l, i) => ui.text(l, 22, 180 + i * 13, { size: 10, col: C.cream }));

          ui.text('Выберите усиления и установите их в Какофонию', 250, 16, { size: 12, bold: true, col: C.cream });
          let ry = 40;
          list.forEach((it, i) => {
            const on = i === this.sel, lines = ui.wrap(it.text, 304, 11), rh = Math.max(56, 28 + lines.length * 14);
            c.fillStyle = on ? 'rgba(122,200,255,0.2)' : 'rgba(122,200,255,0.06)'; c.fillRect(246, ry, 384, rh);
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 1; c.strokeRect(246.5, ry + 0.5, 383, rh - 1); }
            c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(254, ry + 8, 40, 40);
            G.pfIcon(c, it.id, 258, ry + 12, 2);
            ui.text(it.name, 306, ry + 6, { size: 13, bold: true, col: on ? C.gold : C.cream });
            if (i === plan()) ui.text('Установлено', 620, ry + 8, { align: 'right', size: 10, bold: true, col: C.ok });
            lines.forEach((l, k) => ui.text(l, 306, ry + 24 + k * 14, { size: 11, col: C.cream }));
            ui.hit(246, ry, 384, rh, () => { if (this.sel === i) this.choose(); else { this.sel = i; ui.sfx('select'); } });
            ry += rh + 8;
          });
          ui.button(404, 410, 226, 34, 'Установить эффект', () => this.choose(), { active: true, bold: true });
          ui.closeBtn(W - 30, 6, () => this.key('back'));
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Установить'], ['Esc', 'Назад']], W / 2, 456, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); return; }
          if (k === 'up') { this.sel = (this.sel + list.length - 1) % list.length; ui.sfx('select'); }
          if (k === 'down') { this.sel = (this.sel + 1) % list.length; ui.sfx('select'); }
          if (k === 'ok') this.choose();
        }
      });
    },

    openPfTeam(n, close) {
      const ui = this, g = this.game, season = g.pfSeason(), st = g.pfStage(n);
      this.push({
        full: true, pf: true, team: true, node: 0, sel: 0, tab: 'list', filter: 0, asc: false, ssel: 0, sc: { top: 0 },

        heroes() {
          const f = FILTERS[this.filter].id, rec = PF.recOf(st.nodes[this.node]);
          const elemOf = k => H.CHARS[g.kitOf(k)].elem;
          let out = g.pfHeroes();
          if (f === 'rec') out = out.filter(k => rec.includes(elemOf(k)));
          else if (f !== 'all') out = out.filter(k => elemOf(k) === f);
          return this.asc ? out.slice().reverse() : out;
        },

        toggle(k) {
          const res = g.pfToggle(n, this.node, k);
          if (!res) { ui.sfx('deny'); ui.toast('В отряде не больше четырёх героев.'); return; }
          ui.sfx('select');
          if (res.moved != null) ui.toast('Перенесён из узла ' + (res.moved + 1));
        },

        swap() { g.pfSwapRows(n); ui.sfx('confirm'); },

        clear() { ui.openPfSure('Сброс отрядов', 'Очистить оба ряда состава?', 'Очистить', () => { g.pfClearRows(n); ui.sfx('cancel'); }); },

        useRecord() {
          if (!g.pfLoadRecord(n)) { ui.sfx('deny'); ui.toast('У этого этапа ещё нет результата.'); return; }
          ui.sfx('confirm');
        },

        useSquad(i) {
          if (!g.pfLoadSquad(n, this.node, i)) { ui.sfx('deny'); ui.toast('Этот отряд пуст.'); return; }
          ui.sfx('confirm');
        },

        describe() {
          const k = this.tab === 'list' ? this.heroes()[this.sel] : g.pfTeams(n)[this.node][0];
          if (!k) { ui.sfx('deny'); return; }
          ui.openChars(k);
        },

        drawList(c, used) {
          const list = this.heroes(), rows = Math.ceil(list.length / GRID.cols);
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          const top = ui.listTop(this.sc, Math.floor(this.sel / GRID.cols), rows, GRID.rows);
          if (!list.length) ui.text('Никого нет', 102, 140, { align: 'center', size: 11, col: C.dim });
          for (let i = top * GRID.cols; i < Math.min(list.length, (top + GRID.rows) * GRID.cols); i++) {
            const k = list[i], x = GRID.x + (i % GRID.cols) * GRID.pitch, y = GRID.y + (Math.floor(i / GRID.cols) - top) * GRID.pitch, kid = g.kitOf(k), u = used.get(k), on = i === this.sel;
            ui.portraitCard(c, G.lookOf(kid, g), x, y, GRID.cell, { elem: H.CHARS[kid].elem, border: on ? '#ffffff' : u === this.node ? C.brassHi : u != null ? '#8a6ac8' : '#3a4a7a' });
            c.fillStyle = 'rgba(6,8,24,0.82)'; c.fillRect(x, y + GRID.cell - 10, GRID.cell, 10);
            ui.text(String(g.state.roster[k].lvl), x + GRID.cell - 2, y + GRID.cell - 11, { align: 'right', size: 9, col: on ? C.gold : C.cream });
            G.elemIcon(c, H.CHARS[kid].elem, x + 6, y + GRID.cell - 5, 4);
            if (u != null && u !== this.node) { c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(x, y, GRID.cell, GRID.cell - 10); }
            if (u != null) { c.fillStyle = 'rgba(4,6,20,0.85)'; c.fillRect(x, y, 13, 13); ui.text(String(u + 1), x + 6, y, { align: 'center', size: 10, bold: true, col: u === this.node ? C.gold : '#c8a8ff' }); }
            ui.hit(x, y, GRID.cell, GRID.cell, () => { this.sel = i; this.toggle(k); });
          }
          if (rows > GRID.rows) ui.scrollBar(GRID.x + GRID.cols * GRID.pitch - 1, GRID.y, GRID.rows * GRID.pitch - 4, this.sc, rows, GRID.rows);
          ui.wheelZone(GRID.x, GRID.y, GRID.cols * GRID.pitch, GRID.rows * GRID.pitch, d => { this.sc.top += d; });
          ui.button(10, 384, 92, 20, FILTERS[this.filter].label, () => { this.filter = (this.filter + 1) % FILTERS.length; this.sel = 0; ui.sfx('select'); }, { size: 9 });
          ui.button(104, 384, 88, 20, 'Уровень ' + (this.asc ? '↑' : '↓'), () => { this.asc = !this.asc; ui.sfx('select'); }, { size: 10 });
        },

        drawSquads(c) {
          for (let i = 0; i < SQUADS_SHOWN; i++) {
            const y = GRID.y + i * SQUAD_ROW, on = i === this.ssel, mem = g.squadOf(i);
            c.fillStyle = on ? 'rgba(122,200,255,0.2)' : 'rgba(122,200,255,0.05)'; c.fillRect(10, y, 182, SQUAD_ROW - 2);
            ui.text(String(i + 1), 28, y + 5, { align: 'right', size: 11, bold: true, col: on ? C.gold : mem.length ? C.cream : C.dim });
            for (let j = 0; j < 4; j++) {
              const k = mem[j], px = 36 + j * 37, py = y + 1;
              if (k) { const kid = g.kitOf(k); ui.portraitCard(c, G.lookOf(kid, g), px, py, 22, { elem: H.CHARS[kid].elem, border: '#3a4a7a' }); }
              else { c.fillStyle = 'rgba(10,14,40,0.8)'; c.fillRect(px, py, 22, 22); }
            }
            ui.hit(10, y, 182, SQUAD_ROW - 2, () => { this.ssel = i; this.useSquad(i); });
          }
          ui.text('Клик раскладывает отряд в ряд ' + (this.node + 1), 102, 390, { align: 'center', size: 9, col: C.sub });
        },

        drawRow(c, ni) {
          const y = ROW.y[ni], x = ROW.x, w = ROW.w, on = ni === this.node, node = st.nodes[ni], team = g.pfTeams(n)[ni], foe = mainFoe(node), rec = PF.recOf(node);
          ui.fhBox(x, y, w, ROW.h, !team.length ? '#d86060' : on ? '#7ac8ff' : 'rgba(80,100,160,0.5)');
          ui.hit(x, y, w, ROW.h, () => { if (this.node !== ni) { this.node = ni; ui.sfx('select'); } });
          ui.text(String(ni + 1), x + 16, y + 6, { align: 'center', size: 18, bold: true, serif: true, col: on ? C.gold : C.cream });
          G.foeIcon(c, foe, x + 28, y + 8, 40);
          ui.wrap(foe.name, 84, 9).slice(0, 2).forEach((l, i) => ui.text(l, x + 72, y + 6 + i * 11, { size: 9, bold: true, col: C.cream }));
          ui.text('ур. ' + st.lvl, x + 72, y + 29, { size: 9, col: C.sub });
          rec.forEach((e, i) => G.elemIcon(c, e, x + 80 + i * 18, y + 54, 7));
          ui.button(x + 8, y + 74, 142, 26, 'Подробнее ›', () => { this.node = ni; ui.openPfNode(n, ni); }, { size: 10 });
          for (let i = 0; i < 4; i++) {
            const k = team[i], sx = x + 162 + i * 64, sy = y + 8, size = 58;
            if (k) {
              const kid = g.kitOf(k);
              ui.portraitCard(c, G.lookOf(kid, g), sx, sy, size, { elem: H.CHARS[kid].elem, border: on ? C.brassHi : '#5a6a9a' });
              c.fillStyle = 'rgba(6,8,24,0.82)'; c.fillRect(sx, sy + size - 11, size, 11);
              ui.text('ур. ' + g.state.roster[k].lvl, sx + size / 2, sy + size - 12, { align: 'center', size: 9, col: C.cream });
              ui.hit(sx, sy, size, size, () => { this.node = ni; g.pfToggle(n, ni, k); ui.sfx('cancel'); });
            } else {
              c.fillStyle = 'rgba(10,14,40,0.8)'; c.fillRect(sx, sy, size, size);
              c.strokeStyle = on ? '#5a7ac8' : '#3a4a78'; c.strokeRect(sx + 0.5, sy + 0.5, size - 1, size - 1);
              ui.text('+', sx + size / 2, sy + 18, { align: 'center', size: 18, col: on ? '#5a7ac8' : '#3a4a78' });
            }
          }
          ui.button(x + 162, y + 74, 250, 26, 'Какофония: ' + g.pfCaco(n, ni).name, () => { this.node = ni; ui.openPfCaco(n, ni); }, { size: 11 });
        },

        draw(c) {
          const rec = g.pf().st[n], used = new Map();
          g.pfTeams(n).forEach((t, ni) => t.forEach(k => used.set(k, ni)));
          c.drawImage(G.bgCanvas('pf', W, HGT), 0, 0);
          c.fillStyle = 'rgba(4,6,30,0.86)'; c.fillRect(0, 0, W, HGT);

          ui.fhBox(6, 6, 192, 404, 'rgba(122,200,255,0.6)');
          ui.text('Чистый вымысел', 14, 12, { size: 10, col: C.sub });
          ui.text('Отряд', 14, 24, { size: 17, bold: true, serif: true, col: C.gold });
          ui.button(10, 48, 90, 20, 'Список', () => { this.tab = 'list'; ui.sfx('select'); }, { active: this.tab === 'list', size: 10 });
          ui.button(102, 48, 90, 20, 'Шаблоны', () => { this.tab = 'squads'; ui.sfx('select'); }, { active: this.tab === 'squads', size: 10 });
          if (this.tab === 'list') this.drawList(c, used);
          else this.drawSquads(c);

          const title = season.name + ' (' + ROMAN[n - 1] + ')', titleFits = ui.measure(title, 15, true, true) <= TITLE_W;
          ui.text(title, 208, titleFits ? 8 : 10, { size: titleFits ? 15 : 13, bold: true, serif: true, col: C.gold });
          ui.button(462, 6, 142, 20, 'Использованный отряд', () => this.useRecord(), { size: 10, disabled: !rec || rec.quick });
          ui.closeBtn(W - 30, 6, () => this.key('back'));
          ui.text(rec && rec.quick ? 'Засчитан на 3★ по прошлому сезону' : rec ? 'Очки ' + H.fmt(rec.best) + ' · ' + rec.nodes.map((v, i) => 'Узел ' + (i + 1) + ': ' + H.fmt(v)).join(' · ') : 'Результата пока нет', 208, 30, { size: 11, col: C.cream });

          ui.fhBox(204, 48, 430, 70, 'rgba(122,200,255,0.35)');
          ui.text('Нелепость: ' + season.whim.name, 212, 53, { size: 10, bold: true, col: C.gold });
          ui.wrap(season.whim.text, 414, 10).slice(0, 4).forEach((l, i) => ui.text(l, 212, 66 + i * 12, { size: 10, col: C.cream }));

          const clear = !!(rec && rec.clear), stars = g.pfStars(n);
          ui.text('Цель: ' + H.fmt(TUN.clear) + (clear ? ' взята' : ''), 208, 124, { size: 11, bold: true, col: clear ? C.ok : C.cream });
          TUN.stars.forEach((v, i) => {
            const x = 340 + i * 98;
            ui.fhStar(x, 130, 6, stars > i);
            ui.text(H.fmt(v), x + 10, 124, { size: 11, col: stars > i ? C.gold : C.sub });
          });

          ui.text('Состав отряда', 208, 146, { size: 12, bold: true, col: C.cream });
          ui.button(450, 142, 100, 20, 'Поменять ⇅', () => this.swap(), { size: 10 });
          ui.button(554, 142, 80, 20, 'Сброс', () => this.clear(), { size: 10 });
          st.nodes.forEach((_, ni) => this.drawRow(c, ni));

          ui.button(204, 416, 180, 28, 'Описание персонажа', () => this.describe(), { size: 11 });
          ui.button(434, 416, 200, 28, 'Войти в историю', () => ui.pfStartRun(n, close), { active: true, bold: true });
          ui.hints([['Стрелки', 'Выбор'], ['Enter', 'Взять'], ['Tab', 'Ряд'], ['C', 'Какофония'], ['D', 'Подробнее'], ['F', 'Войти'], ['Esc', 'Назад']], W / 2, 456, { align: 'center' });
        },

        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'Tab') { this.node = 1 - this.node; ui.sfx('select'); return; }
          if (code === 'KeyF') { ui.pfStartRun(n, close); return; }
          if (code === 'KeyC') { ui.openPfCaco(n, this.node); return; }
          if (code === 'KeyD') { ui.openPfNode(n, this.node); return; }
          if (code === 'KeyT') { this.tab = this.tab === 'list' ? 'squads' : 'list'; ui.sfx('select'); return; }
          if (code === 'KeyU') { this.useRecord(); return; }
          if (code === 'KeyX') { this.swap(); return; }
          if (code === 'Delete') { this.clear(); return; }
          if (code === 'KeyI') { this.describe(); return; }
          if (this.tab === 'squads') {
            if (k === 'up') { this.ssel = (this.ssel + SQUADS_SHOWN - 1) % SQUADS_SHOWN; ui.sfx('select'); }
            if (k === 'down') { this.ssel = (this.ssel + 1) % SQUADS_SHOWN; ui.sfx('select'); }
            if (k === 'ok') this.useSquad(this.ssel);
            return;
          }
          const list = this.heroes();
          if (!list.length) return;
          if (k === 'left') this.sel = Math.max(0, this.sel - 1);
          if (k === 'right') this.sel = Math.min(list.length - 1, this.sel + 1);
          if (k === 'up') this.sel = Math.max(0, this.sel - GRID.cols);
          if (k === 'down') this.sel = Math.min(list.length - 1, this.sel + GRID.cols);
          if (['left', 'right', 'up', 'down'].includes(k)) ui.sfx('select');
          if (k === 'ok') this.toggle(list[this.sel]);
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
