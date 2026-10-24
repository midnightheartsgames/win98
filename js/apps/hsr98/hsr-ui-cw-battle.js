(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, TUN = CW.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const Q_COL = { s: '#c8d4e8', g: '#ffd471', p: '#ff9ae0' };
  const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  Object.assign(H.UI.prototype, {
    cwHud(c, b) {
      const I = b.cwInfo, cw = b.cw, bt = this.bt;
      if (!I) return;
      const boss = !!this.enemyLayout && [...this.enemyLayout().keys()].some(u => u.data.boss && !bt.fade.has(u));
      const x = 62, y = boss ? 66 : 8, w = 88, h = 30;
      c.fillStyle = '#000000'; c.fillRect(x, y, w, h);
      c.strokeStyle = I.finale ? K.red : K.gold; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (I.left == null) this.text('НАГРАДЫ', x + w / 2, y + 9, { align: 'center', size: 11, bold: true, col: K.gold, shadow: false });
      else {
        const left = Math.max(0, Math.ceil(I.left)), low = left < 30, blink = low && Math.floor(this.t * 4) % 2;
        this.text('ОТСЧЁТ', x + 5, y + 3, { size: 8, bold: true, col: low ? K.red : '#3a9a5a', shadow: false });
        this.text(String(left), x + w - 6, y + 8, { align: 'right', size: 18, bold: true, col: blink ? '#5a1a1a' : low ? K.red : K.led, shadow: false });
      }
      let uy = y + h + 2;
      if (I.finale) {
        const pulse = 0.6 + 0.4 * Math.sin(this.t * 6);
        c.fillStyle = 'rgba(80,6,10,0.88)'; c.fillRect(x, uy, w, 14);
        c.globalAlpha = pulse; this.text('МИГ ФИНАЛА ×2', x + w / 2, uy + 2, { align: 'center', size: 9, bold: true, col: '#ffd0a0', shadow: false }); c.globalAlpha = 1;
        uy += 16;
      }
      if (bt.cwT0 == null) bt.cwT0 = this.t;
      if ((this.options.battleSpeed || 1) < 3 && !bt.result) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x, uy, w, 12); this.text('время ' + clock(this.t - bt.cwT0), x + w / 2, uy + 1, { align: 'center', size: 8, col: C.sub, shadow: false }); }
      if (bt.cwNear && bt.cwNear.t > 0) { bt.cwNear.t -= 1 / 60; this.text('−' + bt.cwNear.cost, x + w + 6, y + 8, { size: 14, bold: true, col: K.red }); }
      this.cwTags(c, b);
      this.cwOffStrip(c, b);
    },

    cwTags(c, b) {
      const I = b.cwInfo, cw = b.cw, tags = [], t = key => cw.tiers[key] != null, BB = CW.BONDS;
      if (I.engine) tags.push(['Двигатель ' + I.eng + '/' + BB.belobog.full, '#ff9a4a', I.eng / BB.belobog.full]);
      if (I.lord) tags.push(['Повелитель ×' + I.lord.flags.hits, '#c8a8ff']);
      if (cw.tiers.express != null) tags.push(['Колея ×' + I.trail, '#e8d8ff']);
      if (I.aura) tags.push([CW.PHASE_FX.aura.name, '#8ad0ff']);
      if (t('kazuma')) tags.push(['Невезение ' + I.misfortune + '/' + BB.kazuma.cap[cw.tiers.kazuma], '#9affb0', I.misfortune / BB.kazuma.cap[cw.tiers.kazuma]]);
      if (t('inaba')) tags.push(['Общая атака ' + I.aoa + '/' + BB.inaba.full, '#ffd060', I.aoa / BB.inaba.full]);
      if (t('conton')) tags.push(['Аплодисменты ' + I.applause + '/' + BB.conton.full, '#ff8ac8', I.applause / BB.conton.full]);
      if (t('break') && cw.tiers.break >= 1) tags.push(['Волна ' + I.wave + '/' + BB.break.full, '#f4f4f8', I.wave / BB.break.full]);
      if (t('energy') && cw.tiers.energy >= 1) tags.push(['Энергия ' + Math.round(I.ultE) + '/' + BB.energy.pool, '#80e0ff', I.ultE / BB.energy.pool]);
      if (t('dot') && I.overQ) tags.push(['Сверхвозбуждение ×' + I.overQ, '#c8f070']);
      if (t('hpburn')) tags.push(['Арена ' + H.fmt(Math.round(I.arena)), '#ff5a6a']);
      if (t('follow') && I.combo) tags.push(['Подряд +' + Math.round(I.combo * 100) + '%', '#ffd471']);
      if (I.dayT > 0) tags.push(['Удачный день', '#9affb0']);
      if (cw.frenzy) tags.push(['Неистовый узел', '#ff7a7a']);
      let tx = 8, ty = 330;
      for (const [tag, col, frac] of tags) {
        const tw = this.measure(tag, 9, true) + 8;
        if (tx + tw > 452) { tx = 8; ty -= 16; }
        c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(tx, ty, tw, 14);
        this.text(tag, tx + 4, ty + 1, { size: 9, bold: true, col });
        if (frac != null) { c.fillStyle = '#20243c'; c.fillRect(tx + 2, ty + 12, tw - 4, 2); c.fillStyle = col; c.fillRect(tx + 2, ty + 12, Math.round((tw - 4) * Math.max(0, Math.min(1, frac))), 2); }
        tx += tw + 4;
      }
    },

    cwOffStrip(c, b) {
      const I = b.cwInfo, bt = this.bt, off = I.off || [];
      if (!off.length) return;
      const sx = 8, sy = 344;
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(sx, sy, 58 + off.length * 24, 26);
      this.text('ВНЕ ПОЛЯ', sx + 5, sy + 8, { size: 9, bold: true, col: K.gold });
      off.forEach((u, i) => {
        const px = sx + 58 + i * 24, py = sy + 2, lit = bt.lunge.has(u) || b.acting === u;
        this.portraitCard(c, G.lookOf(u.kitId, this.game), px, py, 20, { elem: u.elem, border: lit ? '#ffffff' : CW.COST_COL[u.cwU.cost] });
        if (lit) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px, py, 20, 20); }
        if (u.enMax) { c.fillStyle = '#0a0c1a'; c.fillRect(px, py + 21, 20, 2); c.fillStyle = u.en >= u.enMax ? K.gold : '#5ac8ff'; c.fillRect(px, py + 21, Math.round(20 * Math.min(1, (u.en || 0) / u.enMax)), 2); }
        if (u.dead || u.hp <= 0) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(px, py, 20, 20); }
      });
    },

    cwSummonPos(u) {
      const b = this.game.battle || this.lastBattle, I = b && b.cwInfo;
      if (u.cwOff && I) { const i = Math.max(0, I.off.indexOf(u)); return { x: 8 + 58 + i * 24 + 10, y: 350 }; }
      if (u.cwBond === 'lord') return { x: 120, y: 180 };
      if (u.cwBond === 'express') return { x: 90, y: 230 };
      if (u.cwBond === 'engine') return { x: W / 2, y: 150 };
      if (u.cwBond === 'gynoid' && b) { const i = Math.max(0, b.summons.filter(s => s.cwBond === 'gynoid').indexOf(u)); return { x: 90 + (i % 3) * 26, y: 250 + Math.floor(i / 3) * 24 }; }
      if (u.cwBond) return { x: 120 + ((u.cwBond.length * 37) % 200), y: 200 };
      return null;
    },

    cwSummonIcon(c, u, x, y, size) {
      if (u.cwOff) { this.portraitCard(c, G.lookOf(u.kitId, this.game), x, y, size, { elem: u.elem, border: CW.COST_COL[u.cwU.cost] }); return true; }
      if (u.cwBond === 'gynoid') { G.foeIcon(c, { id: 'gynoid', fam: 'boss' }, x, y, size, { border: false }); c.strokeStyle = '#a890ff'; c.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1); return true; }
      if (u.cwBond === 'echo') { const e = u.flags.echo; c.fillStyle = '#1a2a6a'; c.fillRect(x, y, size, size); G.foeIcon(c, H.ENEMIES[e.id], x + 2, y + 2, size - 4, { border: false }); c.fillStyle = 'rgba(120,160,255,0.35)'; c.fillRect(x, y, size, size); return true; }
      if (u.cwBond === 'arena' || u.cwBond === 'aha') {
        const col = u.cwBond === 'arena' ? ['#6a1018', '#ff5a6a'] : ['#5a1a4a', '#ff9ae0'];
        c.fillStyle = col[0]; c.fillRect(x, y, size, size);
        c.fillStyle = col[1]; c.beginPath(); c.arc(x + size / 2, y + size / 2, size * 0.32, 0, Math.PI * 2); c.fill();
        this.text(u.cwBond === 'arena' ? 'А' : '!', x + size / 2, y + size / 2 - 6, { align: 'center', size: 11, bold: true, col: '#ffffff' });
        return true;
      }
      if (u.cwBond === 'express') {
        const gr = c.createLinearGradient(0, y, 0, y + size);
        gr.addColorStop(0, '#3a2a68'); gr.addColorStop(1, '#120a2a');
        c.fillStyle = gr; c.fillRect(x, y, size, size);
        const s = size / 16;
        c.fillStyle = '#e8c878'; c.fillRect(x + 2 * s, y + 7 * s, 11 * s, 5 * s); c.fillRect(x + 9 * s, y + 4 * s, 4 * s, 3 * s); c.fillRect(x + 4 * s, y + 4 * s, 2 * s, 3 * s);
        c.fillStyle = '#5a3a14'; c.fillRect(x + 3 * s, y + 12 * s, 2 * s, 2 * s); c.fillRect(x + 7 * s, y + 12 * s, 2 * s, 2 * s); c.fillRect(x + 11 * s, y + 12 * s, 2 * s, 2 * s);
        c.fillStyle = '#bfe8ff'; c.fillRect(x + 10 * s, y + 5 * s, 2 * s, 1 * s);
        return true;
      }
      return false;
    },

    cwEvent(e) {
      const bt = this.bt;
      switch (e.t) {
        case 'cwNear': bt.cwNear = { cost: e.cost, t: 1.2 }; if (e.u) { this.floatAt(e.u, 'О ГИБЕЛИ', '#ffffff', 16); bt.flash.set(e.u, 0.5); } this.sfx('deny'); return true;
        case 'cwBond':
          if (e.k === 'express') bt.big = { text: 'ЗВЁЗДНЫЙ ЭКСПРЕСС', sub: 'Экипаж экспресса', col: '#c8a8ff', t: 0.9 };
          if (e.k === 'belobog') bt.big = { text: 'ДВИГАТЕЛЬ СОЗИДАНИЯ', sub: 'Белобог', col: '#ff9a4a', t: 0.9 };
          if (e.k === 'kazuma') bt.big = { text: 'УДАЧНЫЙ ДЕНЬ', sub: 'Отряд Казумы', col: '#9affb0', t: 0.9 };
          if (e.k === 'inaba') bt.big = { text: 'ОБЩАЯ АТАКА', sub: 'Команда расследования', col: '#ffd060', t: 0.9 };
          if (e.k === 'conton') bt.big = { text: 'ВЫХОД НА БИС', sub: 'Кон-Тон', col: '#ff8ac8', t: 0.9 };
          if (e.k === 'break') bt.big = { text: 'УДАРНАЯ ВОЛНА', sub: 'Пробитие', col: '#ffffff', t: 0.9 };
          this.sfx('ult');
          return true;
        case 'cwPhase':
          if (e.k === 'aura') bt.big = { text: 'АУРА ГАРНИЗОНА', sub: 'Сломайте щит Гепарда', col: '#8ad0ff', t: 1 };
          if (e.k === 'auraBreak') { bt.big = { text: 'АУРА РАЗБИТА', sub: 'Все враги пробиты', col: '#ffffff', t: 1 }; bt.shake = Math.max(bt.shake, 10); this.sfx('break'); }
          if (e.k === 'wrath') bt.big = { text: 'ГНЕВ ЗИМНИХ СВЯТЫХ', sub: 'Коколия наносит больше урона', col: '#bfe8ff', t: 1 };
          if (e.k === 'finale') { bt.big = { text: 'МИГ ФИНАЛА', sub: 'Двойной урон до конца боя', col: '#ffb070', t: 1.2 }; bt.shake = Math.max(bt.shake, 6); this.sfx('ult'); }
          return true;
        case 'cwOre': this.floatAt(e.u, 'Руда!', '#8ad0ff', 12); this.sfx('glint'); return true;
        case 'cwEngine': case 'cwLord': case 'cwTrail': case 'cwBar': return true;
      }
      return false;
    },

    cwFightTop(b) {
      if (!b || !b.cwInfo) return [];
      return Object.entries(b.cwInfo.dmg || {}).map(([uid, v]) => ({ u: b.cw.units[uid], v })).filter(x => x.u).sort((a, c) => c.v - a.v).slice(0, 3);
    },

    drawCwResult(c, out) {
      const r = out.cw, win = r.win;
      c.fillStyle = 'rgba(2,3,12,0.62)'; c.fillRect(0, 0, W, HGT);
      if (r.choice) {
        this.win(W / 2 - 180, 150, 360, 150, { title: 'Узел не пройден', border: '#d86060' });
        this.text('Отсчёт закончился. Прогресс ' + Math.round(r.progress * 100) + '%.', W / 2, 180, { align: 'center', size: 13, bold: true, col: C.cream });
        this.text('Можно переставить героев и сыграть тот же бой снова.', W / 2, 200, { align: 'center', size: 10, col: C.sub });
        this.loseOptions(out).forEach((o, i) => this.button(W / 2 - 150, 222 + i * 32, 300, 26, o.label, () => this.loseChoice(i), { active: (this.bt.loseSel || 0) === i }));
        return;
      }
      const b = this.game.battle || this.lastBattle, top = this.cwFightTop(b), x = W / 2 - 190, y = 120, w = 380, h = 196;
      this.win(x, y, w, h, { title: win ? 'Узел пройден' : 'Узел не пройден', border: win ? K.gold : '#d86060' });
      let ly = y + 26;
      if (r.kind === 'reward') this.text('Монеты с врагов: +' + r.coins, W / 2, ly, { align: 'center', size: 14, bold: true, col: K.gold });
      else if (win) this.text('Враги повержены до конца отсчёта.', W / 2, ly, { align: 'center', size: 13, bold: true, col: C.cream });
      else this.text('Отсчёт закончился. Прогресс ' + Math.round(r.progress * 100) + '%.', W / 2, ly, { align: 'center', size: 13, bold: true, col: C.cream });
      ly += 20;
      const left = b && b.cwInfo && b.cwInfo.left;
      if (win && left != null && r.kind !== 'reward') { this.text('Осталось отсчёта: ' + Math.max(0, Math.ceil(left)) + (b.cwInfo.finale ? ' · Миг финала' : ''), W / 2, ly, { align: 'center', size: 10, col: C.sub }); ly += 14; }
      if (r.near) { this.text('«О гибели» сработало: ' + r.near, W / 2, ly, { align: 'center', size: 11, col: C.sub }); ly += 14; }
      if (r.hpLoss) { this.text('НР команды −' + r.hpLoss, W / 2, ly, { align: 'center', size: 12, bold: true, col: C.bad }); ly += 16; }
      if (top.length) {
        const max = top[0].v || 1;
        top.forEach((t, i) => {
          const ry = y + 96 + i * 22, d = CW.UNITS[t.u.id];
          this.portraitCard(c, G.lookOf(t.u.place === 'off' ? d.kitOff : d.kitOn, this.game), x + 20, ry, 18, { elem: H.CHARS[d.kitOn].elem, border: CW.COST_COL[t.u.cost] });
          c.fillStyle = '#14183a'; c.fillRect(x + 44, ry + 5, 220, 8);
          c.fillStyle = i ? '#5a8ad0' : K.gold; c.fillRect(x + 44, ry + 5, Math.round(220 * t.v / max), 8);
          this.text(H.fmt(Math.round(t.v)), x + w - 20, ry + 3, { align: 'right', size: 10, bold: true, col: C.cream });
        });
      }
      if (win && r.kind !== 'reward' && !r.near) {
        c.save(); c.translate(x + w - 70, y + 60); c.rotate(-0.2); c.globalAlpha = 0.9;
        c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(-48, -11, 96, 22); c.lineWidth = 1;
        this.text('ИДЕАЛЬНАЯ ПОБЕДА', 0, -6, { align: 'center', size: 9, bold: true, col: K.gold, shadow: false });
        c.restore();
      }
      this.hints([['Enter', 'Квитанция']], W / 2, y + h - 20, { align: 'center' });
      this.hit(0, 0, W, HGT, () => this.closeResult());
    },

    openCwReport(sum) {
      const ui = this;
      return this.push({
        full: true, cw: true, report: true,
        draw(c) {
          const gr = c.createLinearGradient(0, 0, 0, HGT);
          gr.addColorStop(0, '#0c1a4a'); gr.addColorStop(1, '#040a22');
          c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          const px = 24, py = 22, pw = W - 48, ph = 418;
          c.fillStyle = '#000000'; c.fillRect(px + 4, py + 4, pw, ph);
          c.fillStyle = K.paper; c.fillRect(px, py, pw, ph);
          c.fillStyle = '#d8ccb0'; c.fillRect(px + pw / 2 - 1, py + 8, 2, ph - 16);
          const ink = K.ink, sub = '#6a5a44';
          ui.text('ГОДОВОЙ ОТЧЁТ', px + 16, py + 12, { size: 10, bold: true, col: sub, shadow: false });
          const title = sum.cleared ? 'ПОБЕДА НАД КОНКУРЕНТАМИ' : sum.hp <= 0 ? 'НР КОМАНДЫ КОНЧИЛИСЬ' : sum.node >= sum.nodes ? 'ПОСЛЕДНИЙ БОСС УСТОЯЛ' : 'ПАРТИЯ ЗАКРЫТА';
          ui.wrap(title, pw / 2 - 32, 14, true).slice(0, 2).forEach((l, i) => ui.text(l, px + 16, py + 30 + i * 18, { size: 14, bold: true, serif: true, col: sum.cleared ? '#8a5a10' : K.stamp, shadow: false }));
          const rows = [[CW.MODES[sum.mode].name, sum.rank], ['НР команды', sum.hp + ' / ' + sum.hpMax], ['Пройдено узлов', sum.node + ' из ' + sum.nodes], ['Победы / поражения', sum.wins + ' / ' + sum.losses], ['Вложено', sum.spent + ' мон.'], ['Доход', sum.earned + ' мон.'], ['Уровень', String(sum.lvl)]];
          rows.forEach(([a, b], i) => {
            const ry = py + 74 + i * 18;
            ui.text(a, px + 16, ry, { size: 11, col: sub, shadow: false });
            ui.text(b, px + pw / 2 - 16, ry, { align: 'right', size: 11, bold: true, col: ink, shadow: false });
            c.fillStyle = '#e4d8bc'; c.fillRect(px + 16, ry + 14, pw / 2 - 32, 1);
          });
          if (sum.rankGain) {
            c.save(); c.translate(px + pw / 2 - 52, py + 16); c.rotate(-0.18); c.globalAlpha = 0.88;
            c.strokeStyle = K.stamp; c.lineWidth = 2; c.strokeRect(-36, -10, 72, 20); c.lineWidth = 1;
            ui.text('РАНГ +' + sum.rankGain, 0, -6, { align: 'center', size: 11, bold: true, col: K.stamp, shadow: false });
            c.restore();
          }
          let cy = py + 206;
          const chips = (label, list) => {
            if (!list.length) return;
            ui.text(label, px + 16, cy, { size: 10, bold: true, col: sub, shadow: false });
            cy += 14;
            let cx = px + 16;
            for (const [text, col] of list) {
              const tw = ui.measure(text, 9, true) + 10;
              if (cx + tw > px + pw / 2 - 12) { cx = px + 16; cy += 15; }
              if (cy > py + ph - 40) return;
              c.fillStyle = col; c.fillRect(cx, cy, tw, 13);
              ui.text(text, cx + 5, cy + 1, { size: 9, bold: true, col: '#141018', shadow: false });
              cx += tw + 4;
            }
            cy += 20;
          };
          chips('Связи', (sum.bonds || []).map(x => [CW.BOND_NAMES[x.k] + ' ' + (x.tier + 1), CW.BONDS[x.k].col]));
          chips('Стратегии', (sum.strats || []).map(x => [CW.STRATS[x.id] ? CW.STRATS[x.id].name : x.id, Q_COL[x.q] || '#c8d4e8']));
          chips('Среда', (sum.envs || []).map(id => [CW.ENVS[id] ? CW.ENVS[id].name : id, '#9ae8d0']));
          const rx = px + pw / 2 + 16, rw = pw / 2 - 32;
          ui.text('Урон по героям', rx, py + 12, { size: 10, bold: true, col: sub, shadow: false });
          const dmg = (sum.dmg || []).slice(0, 6), max = dmg.length ? dmg[0].v || 1 : 1;
          dmg.forEach((d, i) => {
            const ry = py + 32 + i * 34, u = CW.UNITS[d.id];
            if (!u) return;
            const star = (sum.team.find(t => t.id === d.id) || { star: 1 }).star;
            ui.cwCell(c, { id: d.id, star }, rx, ry, 28);
            if (i === 0) ui.cwCrown(c, rx + 14, ry - 4);
            ui.text(ui.clip(H.CHARS[u.kitOn].name, 120, 10, true), rx + 34, ry, { size: 10, bold: true, col: ink, shadow: false });
            c.fillStyle = '#e4d8bc'; c.fillRect(rx + 34, ry + 15, rw - 34, 9);
            c.fillStyle = i ? '#6a8ab8' : '#c8962c'; c.fillRect(rx + 34, ry + 15, Math.round((rw - 34) * d.v / max), 9);
            ui.text(H.fmt(d.v), rx + rw, ry, { align: 'right', size: 10, col: sub, shadow: false });
          });
          if (!dmg.length) ui.text('Герои не вступали в бой.', rx, py + 36, { size: 10, col: sub, shadow: false });
          const M = sum.meta;
          if (M) {
            const my = py + 246;
            c.fillStyle = '#e4d8bc'; c.fillRect(rx, my - 6, rw, 1);
            ui.text(sum.past ? 'Награды той партии' : 'Награды', rx, my, { size: 10, bold: true, col: sub, shadow: false });
            [['Очки продвижения', '+' + H.fmt(M.asc) + (M.ascBonus ? ' +' + H.fmt(M.ascBonus) + ' двойные' : '')], ['Очки Валютных войн', '+' + H.fmt(M.week)], ['Банкноты', '+' + M.notes], ['Ранг', M.rankTo > M.rankFrom ? (M.promo ? 'матч продвижения выигран' : '+' + (M.rankTo - M.rankFrom) + ' подуровня') : 'без изменений']].forEach(([a, b2], i) => {
              ui.text(a, rx, my + 16 + i * 15, { size: 10, col: sub, shadow: false });
              ui.text(b2, rx + rw, my + 16 + i * 15, { align: 'right', size: 10, bold: true, col: ink, shadow: false });
            });
          }
          ui.text('Команда в конце партии', rx, py + ph - 76, { size: 10, bold: true, col: sub, shadow: false });
          sum.team.slice(0, 8).forEach((u, i) => ui.cwCell(c, u, rx + i * 34, py + ph - 60, 30));
          c.fillStyle = 'rgba(2,3,12,0.85)'; c.fillRect(W / 2 - 80, HGT - 30, 160, 20);
          ui.hints([['Enter', sum.past ? 'Назад' : 'На главный экран']], W / 2, HGT - 26, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(k) {
          if (k !== 'ok' && k !== 'back') return;
          ui.screens = ui.screens.filter(s => s !== this);
          ui.sfx('confirm');
          if (sum.past) return;
          if (!ui.screens.some(s => s.cw)) ui.openCwHub();
        }
      });
    },

    cwCrown(c, x, y) {
      c.fillStyle = '#4a3410'; c.beginPath(); c.moveTo(x - 9, y + 5); c.lineTo(x - 9, y - 3); c.lineTo(x - 4, y + 1); c.lineTo(x, y - 6); c.lineTo(x + 4, y + 1); c.lineTo(x + 9, y - 3); c.lineTo(x + 9, y + 5); c.closePath(); c.fill();
      c.fillStyle = K.gold; c.beginPath(); c.moveTo(x - 8, y + 4); c.lineTo(x - 8, y - 1); c.lineTo(x - 4, y + 2); c.lineTo(x, y - 4); c.lineTo(x + 4, y + 2); c.lineTo(x + 8, y - 1); c.lineTo(x + 8, y + 4); c.closePath(); c.fill();
    },

    cwSpeedOffer(then) {
      const ui = this, C0 = this.game.cw();
      if (C0.speedAsked || (this.options.battleSpeed || 1) >= 3) { then(); return; }
      C0.speedAsked = true;
      this.push({
        cw: true, sel: 0,
        draw() {
          ui.win(W / 2 - 180, 160, 360, 132, { title: 'Скорость боя', border: K.gold });
          ui.text('Бои режима идут сами. Включить скорость ×3?', W / 2, 186, { align: 'center', size: 11, col: C.cream });
          ui.text('Её можно поменять кнопкой в бою.', W / 2, 202, { align: 'center', size: 10, col: C.sub });
          ui.button(W / 2 - 150, 236, 140, 26, 'Включить ×3', () => this.go(0), { active: this.sel === 0, bold: true });
          ui.button(W / 2 + 10, 236, 140, 26, 'Оставить', () => this.go(1), { active: this.sel === 1 });
        },
        go(i) {
          ui.screens = ui.screens.filter(s => s !== this);
          if (i === 0) ui.options.battleSpeed = 3;
          ui.sfx(i === 0 ? 'confirm' : 'select');
          then();
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.go(this.sel);
          if (k === 'back') this.go(1);
        }
      });
    }
  });

  const UP = H.UI.prototype;
  const launch0 = UP.cwLaunch;
  UP.cwLaunch = function (fn) { this.cwSpeedOffer(() => launch0.call(this, fn)); };
  const startBattleUI0 = UP.startBattleUI;
  UP.startBattleUI = function (e) {
    const sticky = !!(this.bt && this.bt.autoSticky);
    startBattleUI0.call(this, e);
    const b = this.game.battle;
    if (b && b.cw) { if (this.cwAuto == null) this.cwAuto = true; this.bt.auto = this.cwAuto; this.bt.cwSticky = sticky; }
  };
  const closeResult0 = UP.closeResult;
  UP.closeResult = function () {
    const out = this.bt && this.bt.result;
    if (out && out.cw) this.cwAuto = this.bt.auto;
    closeResult0.call(this);
    if (out && out.cw) this.bt.autoSticky = !!this.bt.cwSticky;
    if (out && out.cw && !out.lost) this.cwAfterBattle(out);
  };
  const loseOptions0 = UP.loseOptions;
  UP.loseOptions = function (out) {
    if (out && out.cw) return [{ label: 'Переиграть бой' }, { label: 'Принять результат' }];
    return loseOptions0.call(this, out);
  };
  const loseChoice0 = UP.loseChoice;
  UP.loseChoice = function (i) {
    const out = this.bt && this.bt.result, g = this.game;
    if (!out || !out.cw) return loseChoice0.call(this, i);
    this.cwAuto = this.bt.auto;
    this.bt.autoSticky = !!this.bt.cwSticky;
    this.bt.result = null;
    this.bt.loseSel = 0;
    this.mode = 'field';
    this.lastBattle = null;
    this.cwMusic();
    if (i === 0) { g.cwReplay(); this.sfx('confirm'); this.openCwBoard(); return; }
    const rec = g.cwAccept();
    if (rec) this.cwAfterBattle({ cw: rec });
  };
  const enemyHud0 = UP.enemyHud;
  UP.enemyHud = function (c, u, p) {
    enemyHud0.call(this, c, u, p);
    if (u.cwStar > 1) this.cwStars(p.x, p.y - p.s - 33, u.cwStar, 4, 'center');
  };
  const bossHud0 = UP.bossHud;
  UP.bossHud = function (c, u) {
    bossHud0.call(this, c, u);
    if (u.cwStar > 1) this.cwStars(460, 14, u.cwStar, 4, 'center');
  };
  const drawResult0 = UP.drawResult;
  UP.drawResult = function (c) {
    const out = this.bt.result;
    if (out && out.cw) { this.drawCwResult(c, out); return; }
    drawResult0.call(this, c);
  };
  const drawBattle0 = UP.drawBattle;
  UP.drawBattle = function (c) {
    drawBattle0.call(this, c);
    const b = this.game.battle || this.lastBattle;
    if (b && b.cwInfo && this.bt && !(this.bt.ult && !this.bt.ult.fading)) this.cwHud(c, b);
  };
  const applyEvent0 = UP.applyEvent;
  UP.applyEvent = function (e) {
    if (e && typeof e.t === 'string' && e.t.slice(0, 2) === 'cw' && this.cwEvent(e)) return;
    const r = applyEvent0.call(this, e);
    if (e && e.t === 'dmg' && e.lucky && this.bt) { const want = (e.crit ? '!' : '') + e.v, f = this.bt.floats.slice(-3).reverse().find(x => x.text === want); if (f) { f.text = '◆' + f.text; f.col = K.gold; } else this.floatAt(e.u, '◆', K.gold, 14); }
    return r;
  };
  const fivesPos0 = UP.fivesPos;
  UP.fivesPos = function (u) { return (u.cwOff || u.cwBond) ? this.cwSummonPos(u) : fivesPos0.call(this, u); };
  const fivesIcon0 = UP.fivesIcon;
  UP.fivesIcon = function (c, u, x, y, size) {
    if (u.cwBond === 'lord') return fivesIcon0.call(this, c, Object.assign({}, u, { id: 'lord' }), x, y, size);
    if (u.cwOff || u.cwBond) return this.cwSummonIcon(c, u, x, y, size);
    return fivesIcon0.call(this, c, u, x, y, size);
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
