(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const K = H.Cine.Kit;
  const PX = 188, PY = 40, PW = 440;
  const ROW = 58;

  function header(c, ui, x, y, w, h) {
    const sky = c.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#3a7ad0'); sky.addColorStop(1, '#bfe2f6');
    c.fillStyle = sky; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) { const cx = x + 30 + i * 92 + G.hash(i, 1, 41) * 30, cy = y + 14 + G.hash(i, 2, 41) * 20; c.beginPath(); c.ellipse(cx, cy, 24, 6, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(cx - 8, cy - 4, 10, 5, 0, 0, Math.PI * 2); c.fill(); }
    const bx = x + w - 120, by = y + 34;
    c.save(); c.globalAlpha = 0.9;
    const cl = c.createRadialGradient(bx, by, 4, bx, by, 34);
    cl.addColorStop(0, 'rgba(255,250,220,1)'); cl.addColorStop(0.4, 'rgba(255,190,110,0.8)'); cl.addColorStop(1, 'rgba(255,140,80,0)');
    c.fillStyle = cl; c.beginPath(); c.arc(bx, by, 34, 0, Math.PI * 2); c.fill();
    c.restore();
    c.fillStyle = '#8ab4b0'; c.beginPath(); c.moveTo(x, y + h - 30);
    for (let i = 0; i <= w; i += 8) c.lineTo(x + i, y + h - 36 - Math.sin(i / 50) * 8);
    c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fill();
    c.fillStyle = '#6e8a96'; c.fillRect(bx - 12, by + 12, 24, 12); c.fillRect(bx - 16, by + 4, 6, 20); c.fillRect(bx + 10, by + 6, 6, 18);
    c.fillStyle = '#c8beaa'; c.fillRect(x + 20, y + h - 40, 150, 14);
    for (let i = 0; i < 150; i += 8) c.fillRect(x + 20 + i, y + h - 44, 5, 4);
    c.fillStyle = '#b8503a';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 30 + i * 36, y + h - 48); c.lineTo(x + 40 + i * 36, y + h - 60); c.lineTo(x + 50 + i * 36, y + h - 48); c.closePath(); c.fill(); }
    c.fillStyle = '#5e9a48'; c.fillRect(x, y + h - 26, w, 26);
    c.fillStyle = '#7a1c22'; c.fillRect(x + w - 210, y + h - 30, 120, 14); c.fillStyle = '#1e1a22'; c.fillRect(x + w - 90, y + h - 32, 30, 16);
    c.fillStyle = '#ffe8a0'; for (let i = 0; i < 6; i++) c.fillRect(x + w - 204 + i * 19, y + h - 27, 8, 5);
    c.fillStyle = '#d8b060'; c.fillRect(x + w - 214, y + h - 15, 158, 2);
    c.fillStyle = C.brass; c.fillRect(x, y + h, w, 1);
    ui.text(H.BRAND.event, x + 12, y + 8, { size: 22, bold: true, serif: true, col: '#ffffff' });
    ui.text('Обмен отрядами', x + 14, y + 36, { size: 13, bold: true, col: '#fff4c8' });
  }

  function giveList(m) {
    const g = m.give, out = [];
    if (g.jade) out.push(['jade', g.jade]);
    for (const [id, n] of Object.entries(g.items || {})) out.push([id, n]);
    if (g.credits) out.push(['credits', g.credits]);
    return out;
  }

  const TAB = {
    id: 'konosuba', title: H.BRAND.event, icon: 'mana', page: 'konosubaPage',
    done: g => H.KONOSUBA.MILESTONES.every(m => g.ks().got.includes(m.id)),
    sub: g => g.ksOpen() ? 'Наград: ' + g.ks().got.length + ' из ' + H.KONOSUBA.MILESTONES.length : 'Ранний доступ',
    key(ui, scr, k) {
      const n = H.KONOSUBA.MILESTONES.length;
      if (k === 'up' || k === 'down') { scr.pick = (scr.pick + (k === 'up' ? n : 1)) % (n + 1); ui.sfx('select'); return; }
      if (k === 'ok') ui.ksPick(scr, scr.pick);
    }
  };

  Object.assign(H.UI.prototype, {
    ksPick(scr, i) {
      const g = this.game, n = H.KONOSUBA.MILESTONES.length;
      scr.pick = i;
      if (i === n) {
        if (g.state.flags.ks_done && this.openClipCredits) { this.openClipCredits('konosuba'); return; }
        if (g.ksEarlyReady()) this.openKsEarly();
        else this.sfx('deny');
        return;
      }
      if (scr.report(g.ksClaim(i))) return;
      const m = H.KONOSUBA.MILESTONES[i];
      this.toast(g.ks().got.includes(m.id) ? 'Эта награда уже получена.' : !g.ksOpen() ? 'Событие откроется после главы «Ярило-VI» или по раннему доступу.' : 'Нужно: ' + m.text + '.');
    },

    konosubaPage(c, scr) {
      const g = this.game, hx = PX + 4, hy = PY + 4, hw = PW - 8, hh = 96;
      header(c, this, hx, hy, hw, hh);
      const MS = H.KONOSUBA.MILESTONES, n = MS.length, sy = hy + hh + 8;
      if (!g.ksOpen()) {
        this.text('Откроется после главы «Ярило-VI».', hx + 10, sy + 2, { size: 11, col: C.cream });
        this.text('В Белзерге уровень героев не ниже ' + H.KONOSUBA.FLOOR + '.', hx + 10, sy + 18, { size: 10, col: C.sub });
        this.button(hx + hw - 150, sy, 142, 28, 'Ранний доступ', () => this.ksPick(scr, n), { active: scr.pick === n, bold: true });
      } else {
        const q = Object.keys(H.QUESTS).filter(id => H.QUESTS[id].ch === 'ks' && g.state.quests[id] && g.state.quests[id] !== 'done').pop();
        this.text(q ? 'Сейчас: ' + H.QUESTS[q].name : g.state.flags.ks_done ? 'История пройдена.' : 'Сообщение от Пом-Пом ждёт в телефоне.', hx + 10, sy + 2, { size: 11, bold: true, col: C.gold });
        this.text(q ? g.questStep(q).text : 'Награды ниже забираются здесь.', hx + 10, sy + 18, { size: 10, col: C.sub });
        if (g.state.flags.ks_done) this.button(hx + hw - 150, sy, 142, 28, 'Смотреть титры', () => this.ksPick(scr, n), { active: scr.pick === n, bold: true });
      }
      MS.forEach((m, i) => {
        const y = sy + 40 + i * ROW, on = scr.pick === i, got = g.ks().got.includes(m.id), ready = g.ksReady(i);
        c.fillStyle = on ? 'rgba(80,90,170,0.45)' : 'rgba(20,24,60,0.6)'; c.fillRect(hx, y, hw, ROW - 6);
        c.fillStyle = on ? C.brassHi : '#3a4070'; c.fillRect(hx, y, 3, ROW - 6);
        this.text(m.name, hx + 12, y + 6, { size: 12, bold: true, col: on ? C.gold : C.cream });
        this.text(m.text[0].toUpperCase() + m.text.slice(1), hx + 12, y + 24, { size: 10, col: C.sub });
        let rx = hx + 214;
        if (m.char) { G.rarityCell(c, rx, y + 6, 40, 40, 4); G.drawPortrait(c, G.lookOf(m.char, g), rx + 2, y + 8, 36); rx += 44; }
        for (const [id, cnt] of giveList(m)) { this.rewardCell(c, id, cnt, rx, y + 6, 40); rx += 44; }
        if (got) this.stamp(hx + hw - 40, y + 26, 'ЕСТЬ');
        else if (ready) this.badge(hx + hw - 14, y + 10);
        this.hit(hx, y, hw, ROW - 6, () => this.ksPick(scr, i));
      });
    },

    openKsEarly() {
      const ui = this, g = this.game;
      this.push({
        sel: 0,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 230, y = 132, w = 460, h = 210;
          ui.win(x, y, w, h, { title: 'Ранний доступ' });
          const lines = ['История «Обмен отрядами» откроется сейчас, без главы «Ярило-VI». Она не раскрывает сюжет Ярило-VI.', 'В Белзерге герои ниже ' + H.KONOSUBA.FLOOR + ' уровня сражаются как ' + H.KONOSUBA.FLOOR + '-й уровень. Опыт начисляется по настоящему уровню.', 'Главу «Ярило-VI» можно продолжить в любой момент.'];
          let ly = y + 30;
          for (const t of lines) for (const l of ui.wrap(t, w - 40, 11)) { ui.text(l, x + 20, ly, { size: 11, col: C.cream }); ly += 15; }
          ui.button(x + 50, y + h - 44, 160, 28, 'Открыть', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, bold: true });
          ui.button(x + w - 210, y + h - 44, 160, 28, 'Не сейчас', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') {
            ui.screens.pop();
            if (this.sel === 0 && g.ksStartEarly()) { ui.sfx('levelup'); ui.toast('Пом-Пом прислал сообщение.'); }
            else ui.sfx('cancel');
          }
        }
      });
    },

    openUi_ksboard() {
      const ui = this, g = this.game, list = g.ksBoard();
      this.push({
        full: true, sel: 0,
        draw(c) {
          const bg = c.createLinearGradient(0, 0, 0, HGT);
          bg.addColorStop(0, '#5a3a22'); bg.addColorStop(1, '#3a2414');
          c.fillStyle = bg; c.fillRect(0, 0, W, HGT);
          c.fillStyle = '#a8865a'; c.fillRect(30, 50, W - 60, HGT - 110);
          for (let i = 0; i < 220; i++) { c.fillStyle = i % 3 ? '#9a7a4e' : '#b8966a'; c.fillRect(30 + Math.floor(G.hash(i, 1, 61) * (W - 62)), 50 + Math.floor(G.hash(i, 2, 61) * (HGT - 112)), 2, 1); }
          c.strokeStyle = '#3a2414'; c.lineWidth = 6; c.strokeRect(27, 47, W - 54, HGT - 104);
          ui.plate(12, 10, 'Доска заданий');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          const n = list.length, nw = 176, gap = 18, x0 = Math.round((W - n * nw - (n - 1) * gap) / 2);
          list.forEach((q, i) => {
            const on = i === this.sel, x = x0 + i * (nw + gap), y = 78 + (on ? -6 : 0), h = 300, st = g.state.quests[q.id];
            c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 4, y + 6, nw, h);
            c.fillStyle = on ? '#fbf3dc' : '#efe6d0'; c.fillRect(x, y, nw, h);
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, nw + 2, h + 2); }
            c.fillStyle = '#c84a3a'; c.beginPath(); c.arc(x + nw / 2, y + 8, 5, 0, Math.PI * 2); c.fill();
            ui.text('★'.repeat(q.rank), x + nw / 2, y + 18, { align: 'center', size: 12, col: '#a8822a', shadow: false });
            ui.wrap(q.title, nw - 20, 14).forEach((l, j) => ui.text(l, x + nw / 2, y + 38 + j * 18, { align: 'center', size: 14, bold: true, serif: true, col: '#3a2414', shadow: false }));
            ui.wrap(q.text, nw - 20, 11).forEach((l, j) => ui.text(l, x + 10, y + 86 + j * 14, { size: 11, col: '#4a3a2a', shadow: false }));
            c.fillStyle = '#c8b890'; c.fillRect(x + 10, y + 196, nw - 20, 1);
            ui.text('Награда: ' + H.fmt(q.eris) + ' эрис', x + 10, y + 204, { size: 11, bold: true, col: '#3a2414', shadow: false });
            ui.text('Прогноз Герты: КПД ' + q.kpd + '%', x + 10, y + 222, { size: 10, col: '#6a4a8a', shadow: false });
            if (st === 'done') ui.stamp(x + nw / 2, y + 262, 'ВЫПОЛНЕНО');
            else if (st) ui.stamp(x + nw / 2, y + 262, 'ВЗЯТО');
            ui.hit(x, y, nw, h, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['←→', 'Задание'], ['Enter', 'Взять'], ['Esc', 'Назад']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.screens.pop(); ui.finishPending(null); return; }
          if ((k === 'left' || k === 'right') && list.length) { this.sel = (this.sel + (k === 'left' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return; }
          if (k === 'ok' && list[this.sel]) {
            const q = list[this.sel], st = g.state.quests[q.id];
            if (g.ksTake(q.id)) { ui.sfx('confirm'); ui.screens.pop(); ui.finishPending(q.id); return; }
            ui.sfx('deny');
            ui.toast(st === 'done' ? 'Это задание уже выполнено.' : st ? 'Это задание уже взято.' : 'Сначала закончите взятое задание.');
          }
        }
      });
    },

    openUi_ksrate() {
      const ui = this, RATE = [['Звук', 2.1], ['Отдача', 2.9], ['Облако', 3.7]];
      this.push({
        full: true, row: 0, got: [], t0: ui.t, done: false,
        pos(i) { return 0.5 + 0.5 * Math.sin((ui.t - this.t0) * RATE[i][1] + i * 1.3); },
        draw(c) {
          const bg = c.createRadialGradient(W / 2, 120, 20, W / 2, 120, 420);
          bg.addColorStop(0, '#ffd890'); bg.addColorStop(0.35, '#c85a2a'); bg.addColorStop(1, '#1a0a0a');
          c.fillStyle = bg; c.fillRect(0, 0, W, HGT);
          ui.win(W / 2 - 230, 70, 460, 330, { title: 'Оценка взрыва' });
          ui.text('Остановите шкалу ближе к центру. Enter, чтобы оценить.', W / 2, 104, { align: 'center', size: 11, col: C.sub });
          RATE.forEach(([name], i) => {
            const y = 140 + i * 70, bx = W / 2 - 150, bw = 300, v = i < this.got.length ? this.got[i].p : i === this.row ? this.pos(i) : null;
            ui.text(name, W / 2 - 200, y + 4, { size: 14, bold: true, col: i === this.row && !this.done ? C.gold : C.cream });
            c.fillStyle = '#1a1420'; c.fillRect(bx, y, bw, 22);
            const gr = c.createLinearGradient(bx, 0, bx + bw, 0);
            gr.addColorStop(0, '#5a1a1a'); gr.addColorStop(0.42, '#c8a030'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.58, '#c8a030'); gr.addColorStop(1, '#5a1a1a');
            c.fillStyle = gr; c.fillRect(bx + 2, y + 2, bw - 4, 18);
            if (v != null) { const nx = Math.round(bx + 2 + v * (bw - 4)); c.fillStyle = '#0a0a10'; c.fillRect(nx - 2, y - 4, 5, 30); c.fillStyle = '#ffffff'; c.fillRect(nx - 1, y - 3, 3, 28); }
            if (i < this.got.length) ui.text(this.got[i].s + '', W / 2 + 170, y + 3, { size: 14, bold: true, col: C.gold });
          });
          if (this.done) {
            const total = this.got.reduce((a, x) => a + x.s, 0);
            ui.text(total + ' баллов', W / 2, 352, { align: 'center', size: 24, bold: true, serif: true, col: C.gold });
          }
          ui.hints([['Enter', this.done ? 'Готово' : 'Остановить']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k) {
          if (k !== 'ok') return;
          if (this.done) { ui.screens.pop(); ui.finishPending(this.got.reduce((a, x) => a + x.s, 0)); return; }
          const p = this.pos(this.row), d = Math.abs(p - 0.5) * 2;
          this.got.push({ p, s: d < 0.06 ? 34 : Math.max(0, Math.round(33 * (1 - d))) });
          ui.sfx(d < 0.06 ? 'crit' : 'select');
          this.row++;
          if (this.row >= RATE.length) { this.done = true; const t = this.got.reduce((a, x) => a + x.s, 0); if (t > 100) this.got[2].s -= t - 100; }
          else this.t0 = ui.t;
        }
      });
    },

    openUi_kslearn(p) {
      const sk = H.KONOSUBA.SKILLS[p.skill];
      if (sk) this.toast('Навык на карточке: ' + sk.name);
      this.sfx('levelup');
      this.finishPending();
    },

    openUi_kscard() {
      const ui = this, g = this.game, ids = Object.keys(H.KONOSUBA.SKILLS);
      this.push({
        full: true, sel: 0,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.75)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 250, y = 40, w = 500, h = 388, k = g.ksCard();
          c.fillStyle = '#3a2414'; c.fillRect(x - 4, y - 4, w + 8, h + 8);
          c.fillStyle = '#efe2c0'; c.fillRect(x, y, w, h);
          c.fillStyle = '#d8c494'; c.fillRect(x, y, w, 34);
          ui.text('Карточка искателя приключений', x + w / 2, y + 8, { align: 'center', size: 15, bold: true, serif: true, col: '#3a2414', shadow: false });
          c.fillStyle = '#2a5a9a'; c.fillRect(x + 16, y + 46, 96, 96);
          G.drawPortrait(c, G.lookOf(g.kitOf('trail'), g), x + 18, y + 48, 92);
          const st = g.charStats('trail'), lvl = g.state.roster.trail.lvl;
          ui.text(g.state.name, x + 128, y + 46, { size: 16, bold: true, serif: true, col: '#3a2414', shadow: false });
          ui.text('Класс: искатель приключений · ур. ' + lvl, x + 128, y + 68, { size: 11, col: '#4a3a2a', shadow: false });
          [['Здоровье', st.hp], ['Атака', st.atk], ['Защита', st.def], ['Скорость', st.spd]].forEach(([n, v], i) => {
            const cx = x + 128 + (i % 2) * 170, cy = y + 90 + Math.floor(i / 2) * 18;
            ui.text(n, cx, cy, { size: 11, col: '#6a5a3a', shadow: false }); ui.text(String(Math.round(v)), cx + 150, cy, { size: 11, bold: true, col: '#3a2414', align: 'right', shadow: false });
          });
          ui.text('Удача', x + 128, y + 126, { size: 11, col: '#6a5a3a', shadow: false });
          ui.text('???', x + 278, y + 126, { size: 11, bold: true, col: '#8a2a2a', align: 'right', shadow: false });
          c.fillStyle = '#b8a070'; c.fillRect(x + 16, y + 154, w - 32, 1);
          ui.text('Очки навыков: ' + g.ksSP(), x + 16, y + 162, { size: 12, bold: true, col: '#3a2414', shadow: false });
          ui.text('В бою: ' + k.equip.length + ' из 2', x + w - 16, y + 162, { size: 11, col: '#6a5a3a', align: 'right', shadow: false });
          ids.forEach((id, i) => {
            const sk = H.KONOSUBA.SKILLS[id], ry = y + 186 + i * 56, on = i === this.sel, learned = k.skills.includes(id), eq = k.equip.includes(id);
            c.fillStyle = on ? 'rgba(42,90,154,0.18)' : 'rgba(0,0,0,0.04)'; c.fillRect(x + 12, ry, w - 24, 50);
            if (on) { c.fillStyle = '#2a5a9a'; c.fillRect(x + 12, ry, 3, 50); }
            ui.text(sk.name, x + 24, ry + 5, { size: 13, bold: true, col: learned ? '#3a2414' : '#8a7a5a', shadow: false });
            ui.text(learned ? (eq ? 'В бою' : 'Изучен') : 'Учит ' + sk.teacher, x + w - 24, ry + 6, { size: 11, bold: eq, col: eq ? '#2a6a3a' : '#6a5a3a', align: 'right', shadow: false });
            ui.wrap(sk.text, w - 60, 10).slice(0, 2).forEach((l, j) => ui.text(l, x + 24, ry + 23 + j * 12, { size: 10, col: '#5a4a3a', shadow: false }));
            ui.hit(x + 12, ry, w - 24, 50, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['↑↓', 'Навык'], ['Enter', 'В бой / убрать'], ['Esc', 'Закрыть']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.screens.pop(); ui.finishPending(); return; }
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? ids.length - 1 : 1)) % ids.length; ui.sfx('select'); return; }
          if (k === 'ok') {
            const id = ids[this.sel], card = g.ksCard();
            if (!card.skills.includes(id)) { ui.sfx('deny'); ui.toast('Этому навыку учит ' + H.KONOSUBA.SKILLS[id].teacher + '.'); return; }
            if (g.ksEquip(id)) ui.sfx('confirm'); else { ui.sfx('deny'); ui.toast('В бою можно держать два навыка.'); }
          }
        }
      });
    },

    openUi_ksreport(pend) {
      const ui = this, g = this.game, final = !!(pend && pend.final);
      this.push({
        full: true,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.78)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 240, y = 30, w = 480, h = final ? 410 : 360, f = g.state.flags;
          c.fillStyle = '#f4f2ec'; c.fillRect(x, y, w, h);
          c.fillStyle = '#6a4a8a'; c.fillRect(x, y, w, 30);
          ui.text('Отчёт куклы Герты: обмен отрядами', x + 14, y + 7, { size: 14, bold: true, serif: true, col: '#ffffff', shadow: false });
          const ax = g.ksStats('ax'), kz = g.ksStats('kz');
          const jobsAx = ['ks_toads', 'ks_blast', 'ks_lake'].filter(k => f[k]).length, jobsKz = ['ks_i2', 'ks_i3'].filter(k => f[k]).length + (f.ks_i1 ? 1 : 0);
          const cols = [x + 200, x + 350];
          ui.text('Отряд Акселя', cols[0], y + 44, { size: 11, bold: true, col: '#3a2a4a', align: 'center', shadow: false });
          ui.text('командир: ' + g.state.name, cols[0], y + 58, { size: 9, col: '#6a5a7a', align: 'center', shadow: false });
          ui.text('Отряд Экспресса', cols[1], y + 44, { size: 11, bold: true, col: '#3a2a4a', align: 'center', shadow: false });
          ui.text('носильщик: Казума', cols[1], y + 58, { size: 9, col: '#6a5a7a', align: 'center', shadow: false });
          const rows = [['Дела выполнены', jobsAx, jobsKz], ['Бои', ax.fights, kz.fights], ['Ходы в боях', ax.turns, kz.turns], ['Промахи Даркнесс', ax.miss, kz.miss], ['Провалы Аквы', ax.fail, kz.fail], ['Обмороки Мегумин', ax.collapse, kz.collapse], ['Проглочены', ax.swallow, kz.swallow]].concat(final ? [['Прикрытие', ax.cover, kz.cover]] : []);
          rows.forEach(([n, a, k], i) => {
            const ry = y + 80 + i * 26;
            c.fillStyle = i % 2 ? 'rgba(106,74,138,0.06)' : 'rgba(106,74,138,0.12)'; c.fillRect(x + 12, ry - 4, w - 24, 24);
            ui.text(n, x + 22, ry, { size: 11, col: '#3a2a4a', shadow: false });
            ui.text(String(a), cols[0], ry, { size: 12, bold: true, col: '#3a2a4a', align: 'center', shadow: false });
            ui.text(String(k), cols[1], ry, { size: 12, bold: true, col: '#3a2a4a', align: 'center', shadow: false });
          });
          const ry = y + 80 + rows.length * 26 + 8;
          c.fillStyle = '#6a4a8a'; c.fillRect(x + 12, ry - 4, w - 24, 2);
          ui.text('КПД', x + 22, ry + 6, { size: 14, bold: true, serif: true, col: '#3a2a4a', shadow: false });
          ui.text(g.ksKpd(ax) + '%', cols[0], ry + 4, { size: 18, bold: true, serif: true, col: '#a83a3a', align: 'center', shadow: false });
          ui.text(g.ksKpd(kz) + '%', cols[1], ry + 4, { size: 18, bold: true, serif: true, col: '#2a7a4a', align: 'center', shadow: false });
          if (final) {
            ui.text('КПД с прикрытием', x + 22, ry + 32, { size: 12, bold: true, serif: true, col: '#6a4a8a', shadow: false });
            ui.text(g.ksKpd(ax, true) + '%', cols[0], ry + 30, { size: 18, bold: true, serif: true, col: '#2a7a4a', align: 'center', shadow: false });
            ui.text(g.ksKpd(kz, true) + '%', cols[1], ry + 30, { size: 18, bold: true, serif: true, col: '#2a7a4a', align: 'center', shadow: false });
          }
          ui.text('КПД: доля ходов без промахов, провалов, обмороков и проглатываний.', x + w / 2, y + h - 22, { size: 9, col: '#8a7a9a', align: 'center', shadow: false });
          ui.hints([['Enter', 'Закрыть']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k) { if (k === 'ok' || k === 'back') { ui.screens.pop(); ui.finishPending(); } }
      });
    },

    drawProto(c, b) {
      const p = b.enemies.find(e => e.data && e.data.proto && !e.dead);
      if (!p) return;
      const f = p.flags, init = f.protoInit;
      const [name, hint, col] = !init || f.barrier ? ['Барьер', 'Урон проходит только от Аквы', '#8ad0ff'] : f.legs ? ['Ноги', 'Урон снижен, нужен Взрыв Мегумин', '#ffb040'] : ['Ядро открыто', 'Кража Казумы! Перегрев через ' + (f.coreT || 0), '#ffd040'];
      const x = W / 2 - 130, y = 64, w = 260;
      c.fillStyle = 'rgba(6,10,28,0.82)'; c.fillRect(x, y, w, 30);
      c.fillStyle = col; c.fillRect(x, y, 3, 30);
      this.text('Фаза: ' + name, x + 10, y + 3, { size: 11, bold: true, col });
      this.text(hint, x + 10, y + 16, { size: 10, col: C.cream });
    },

    drawWard(c, w) {
      const x = W / 2 - 110, y = 46, bw = 220;
      c.fillStyle = 'rgba(6,10,28,0.82)'; c.fillRect(x, y, bw, 38);
      c.fillStyle = C.brass; c.fillRect(x, y, bw, 1); c.fillRect(x, y + 37, bw, 1);
      this.text(w.name, x + 8, y + 4, { size: 11, bold: true, col: C.gold });
      this.text(w.turns ? 'Очищение: ещё ' + w.turns : 'Вода чистая', x + bw - 8, y + 4, { size: 10, col: '#8ad0ff', align: 'right' });
      c.fillStyle = '#1a1420'; c.fillRect(x + 8, y + 22, bw - 16, 8);
      c.fillStyle = w.hp / w.max > 0.35 ? '#c8a050' : '#d84a3a'; c.fillRect(x + 9, y + 23, Math.round((bw - 18) * w.hp / w.max), 6);
      for (let i = 1; i < w.total; i++) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 8 + Math.round((bw - 16) * i / w.total), y + 33, 1, 3); }
      c.fillStyle = '#8ad0ff'; c.fillRect(x + 8, y + 33, Math.round((bw - 16) * (w.total - w.turns) / w.total), 2);
    },

    drawCarry(c, px, py, dir, before) {
      const g = this.game;
      if (!g || !g.state.flags.ks_carry || (dir === 'up') === before) return;
      const dx = dir === 'left' ? 6 : dir === 'right' ? -6 : 0;
      G.drawSprite(c, G.lookOf('megumin', g), dir, 0, px + dx, py - 12);
    },

    newEventNotice() {
      const ui = this, g = this.game;
      if (g.state.flags.ks_note) return;
      g.state.flags.ks_note = true;
      this.push({
        sel: 0,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 236, y = 104, w = 472, h = 244;
          ui.win(x, y, w, h, { title: 'Новое событие' });
          header(c, ui, x + 12, y + 30, w - 24, 96);
          const text = g.ksOpen() ? 'Экспресс поймал странный сигнал. Сообщение от Пом-Пом ждёт в телефоне.' : 'Событие откроется после главы «Ярило-VI». Во вкладке события есть ранний доступ.';
          ui.wrap(text, w - 40, 11).forEach((l, j) => ui.text(l, x + 20, y + 138 + j * 15, { size: 11, col: C.cream }));
          ui.button(x + 70, y + h - 46, 170, 28, 'Открыть событие', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, bold: true, icon: 'events' });
          ui.button(x + w - 240, y + h - 46, 170, 28, 'Позже', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') { ui.screens.pop(); if (this.sel === 0) ui.openEvents('konosuba'); else ui.sfx('cancel'); }
        }
      });
      this.sfx('levelup');
    }
  });

  K.BG.meadow = (g, t, o = {}) => {
    K.vgrad(g, 0, 150, [[0, '#3a7ad0'], [1, '#c4e6f6']]);
    for (let i = 0; i < 6; i++) { const x = ((i * 70 + t * 4) % 380) - 30, y = 20 + (i % 3) * 18; K.ell(g, 'rgba(255,255,255,0.9)', x, y, 26, 7); K.ell(g, 'rgba(255,255,255,0.9)', x - 9, y - 5, 12, 6); }
    K.poly(g, '#8ab4b0', [0, 150, 0, 120, 60, 110, 120, 116, 190, 104, 250, 112, 320, 106, 320, 150]);
    if (o.castle !== false) { K.rect(g, '#6e8a96', 236, 100, 26, 14); K.rect(g, '#6e8a96', 232, 92, 7, 22); K.rect(g, '#6e8a96', 258, 94, 7, 20); K.rect(g, '#6e8a96', 246, 86, 7, 14); }
    if (o.walls !== false) {
      K.rect(g, '#c8beaa', 20, 112, 140, 20); for (let x = 20; x < 160; x += 9) K.rect(g, '#c8beaa', x, 108, 6, 4);
      for (let i = 0; i < 5; i++) K.poly(g, '#b8503a', [30 + i * 26, 112, 40 + i * 26, 100, 50 + i * 26, 112]);
    }
    K.vgrad(g, 130, 240, [[0, '#6cae3e'], [1, '#4c8c2c']]);
    for (let i = 0; i < 60; i++) K.rect(g, i % 2 ? '#8cca52' : '#3a7424', (i * 53) % 320, 140 + (i * 37) % 100, 1, 3);
    if (o.pond) { K.ell(g, '#2a5e9e', o.pond[0], o.pond[1], 46, 10); K.ell(g, '#3a82cc', o.pond[0], o.pond[1] - 1, 42, 8); }
  };

  function belzerg(g, x, y, r) {
    K.glow(g, x, y, r * 1.35, '#a8f0c8', 0.3);
    K.ell(g, '#1a4686', x, y, r, r);
    for (let i = 0; i < 9; i++) K.ell(g, '#4e9a3a', x - r * 0.5 + G.hash(i, 1, 51) * r, y - r * 0.6 + G.hash(i, 2, 51) * r * 1.2, r * 0.22, r * 0.14);
    for (let i = 0; i < 6; i++) K.ell(g, 'rgba(255,255,255,0.7)', x - r * 0.6 + G.hash(i, 3, 51) * r * 1.2, y - r * 0.7 + i * r * 0.25, r * 0.3, r * 0.05);
    K.hgrad(g, x - r * 0.1, x + r, y - r, y + r, [[0, 'rgba(0,0,10,0)'], [1, 'rgba(0,0,10,0.7)']]);
  }

  function toadEyes(g, x, y, t) {
    const blink = Math.sin(t * 2.3) > 0.94;
    for (const dx of [-7, 7]) { K.ell(g, '#5a9a3a', x + dx, y, 6, 5); if (!blink) { K.ell(g, '#f4e8a0', x + dx, y - 1, 4, 3); K.ell(g, '#1a1a10', x + dx, y - 1, 2.4, 1.4); } }
  }

  Object.assign(H.Cine.CINES, {
    c_ks_land: {
      music: 'express',
      shots: [
        { d: 3.2, sub: [[0.3, 'pompom|Входим в атмосферу! Держитесь крепче!']], draw: S => {
          S.bg('space', S.T, { drift: 6 });
          belzerg(S.g, 200, 140, 90);
          K.expressSide(S.g, K.lerp(40, 190, S.t / 3.2), K.lerp(60, 100, S.t / 3.2), 0.3, S.T, { cars: 2 });
        } },
        { d: 3.4, sub: [[0.3, 'march|Смотрите, там город! И замок на холме!']], draw: S => {
          const g = S.g, k = S.t / 3.4;
          S.bg('meadow', S.T, { pond: [250, 196] });
          K.lighter(g, () => { K.line(g, 'rgba(255,220,140,0.8)', 2, -20, 40, K.lerp(80, 300, k), K.lerp(70, 186, k)); K.glow(g, K.lerp(80, 300, k), K.lerp(70, 186, k), 10, '#ffffff', 0.8); });
          K.expressSide(g, K.lerp(40, 260, k), K.lerp(60, 180, k), 0.45, S.T, { cars: 2 });
        } },
        { d: 3.0, sub: [[0.3, 'danheng|Сели мягко. Даже слишком тихо.']], draw: S => {
          const g = S.g;
          S.bg('meadow', S.T, { pond: [80, 206] });
          K.expressSide(g, 250, 190, 0.7, S.T, { cars: 2 });
          for (let i = 0; i < 8; i++) K.rect(g, '#4a7a2a', 40 + i * 9, 190 - (i % 3) * 4, 2, 22);
          if (S.t > 1.4) toadEyes(g, 78, 194, S.T);
        } }
      ]
    }
  });

  Object.assign(H.Cine.CINES, {
    c_ks_blast: {
      shots: [
        { d: 2.6, sub: [[0.2, 'megumin|Взрыв!']], draw: S => {
          const g = S.g, t = S.t;
          S.bg('meadow', S.T, { walls: false });
          K.rect(g, '#6e8a96', 226, 88, 40, 20); K.rect(g, '#6e8a96', 220, 76, 10, 32); K.rect(g, '#6e8a96', 260, 80, 10, 28); K.rect(g, '#6e8a96', 238, 68, 10, 20);
          const r = K.lerp(4, 46, Math.min(1, t / 1.6));
          const oval = (col, w, rx, ry) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.ellipse(244, 92, rx, ry, 0, 0, Math.PI * 2); g.stroke(); };
          K.lighter(g, () => { oval('#ff4a2a', 2, r, r * 0.4); oval('#ffb040', 1, r * 0.7, r * 0.28); K.glow(g, 244, 92, r, '#ff6a2a', 0.4); });
          if (t > 1.8) K.lighter(g, () => K.line(g, '#fff4c8', 6, 244, -10, 244, 92));
        } },
        { d: 2.6, sub: [], draw: S => {
          const g = S.g, t = S.t;
          S.bg('meadow', S.T, { walls: false, castle: false });
          S.shake(t, Math.max(0, 4 - t * 2));
          const k = Math.min(1, t / 1.2);
          K.lighter(g, () => { K.glow(g, 244, 96, 30 + k * 90, '#ffd070', 0.9); K.glow(g, 244, 96, 20 + k * 40, '#ffffff', 1); });
          K.ell(g, 'rgba(90,60,50,0.85)', 244, 60 - k * 30, 20 + k * 40, 14 + k * 16);
          K.rect(g, 'rgba(90,60,50,0.85)', 236, 60 - k * 30, 16, 40 + k * 30);
          K.flash(g, '#ffffff', Math.max(0, 0.9 - t * 1.5));
        } }
      ]
    }
  });

  if (!H.EVENT_TABS.some(e => e.id === TAB.id)) H.EVENT_TABS.push(TAB);
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
