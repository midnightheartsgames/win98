(function (T) {
  'use strict';
  const { clamp, lerp, FONT_H, FONT_T, SCREENS } = T;

  const DIFF = ['Очень легко', 'Легко', 'Средне', 'Сложно', 'Очень сложно'];
  const TIMES = [30, 40, 60, 99, 0];

  function showcase(ui, def, costume, o) {
    const B = Object.assign({}, T.BODY, def.body || {});
    const fake = { def, sd: def, B, state: 'idle', t: 0, pos: [0, 0, 0], yaw: 0, dir: 5, walkDir: 0, vy: 0, hp: 1, maxHp: 1, react: null, stance: null, bt: false, isLying: () => false, m: { throwS: null } };
    const an = new T.Animator(fake);
    return { def, costume: costume || 0, an, fake, look: T.lookFor(def, costume || 0), B, t: 0, o: o || {} };
  }

  function tickShow(sh, state) {
    sh.t++;
    sh.fake.t++;
    if (state && sh.fake.state !== state) { sh.fake.state = state; sh.fake.t = 0; sh.fake.winPose = Math.random() < 0.5 ? 0 : 1; }
    sh.an.update();
  }

  function showItem(sh, pos, yaw, key) {
    return { key: key || ('sh:' + sh.def.id + ':' + sh.costume), look: sh.look, j: sh.an.j, B: sh.B, pos, yaw, size: sh.B.size };
  }

  class Boot {
    constructor(ui) { this.ui = ui; this.t = 0; }
    step() { if (++this.t > 170) this.ui.go('title'); }
    input() { if (this.t > 10) this.ui.go('title'); }
    click() { this.input(); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const a = clamp(Math.min(this.t / 30, (170 - this.t) / 30), 0, 1);
      g.globalAlpha = a;
      ui.text('WIN 98 EDITION', W / 2, H / 2 - 6 * S, 30 * S, '#e8e8e8', 'center', FONT_H, { italic: true, grad: [[0, '#fff'], [1, '#9aa']] });
      ui.text('3D-ФАЙТИНГ ДЛЯ ВАШЕГО ПЕНТИУМА', W / 2, H / 2 + 22 * S, 13 * S, '#999', 'center', FONT_T, { weight: 'bold' });
      g.globalAlpha = 1;
    }
  }

  class Title {
    constructor(ui) {
      this.ui = ui; this.t = 0; this.idle = 0;
      const pool = T.selectableFighters(ui.save).filter(d => !d.boss);
      this.a = showcase(ui, pool[Math.floor(Math.random() * pool.length)]);
      this.b = showcase(ui, pool[Math.floor(Math.random() * pool.length)]);
      this.stage = T.STAGE[['dojo', 'castle', 'temple', 'roof', 'forest'][Math.floor(Math.random() * 5)]];
    }
    enter() { this.ui.scene.setStage(this.stage); this.ui.audio.music('title'); }
    step() {
      this.t++; this.idle++;
      tickShow(this.a); tickShow(this.b);
      T.ambientTick(this.ui.scene, this.stage, this.ui.scene.cam || { at: [0, 1, 0] }, this.ui.clock);
      this.ui.scene.tickParts();
      if (this.idle > 60 * 25) this.ui.flow.demo();
    }
    input(a) { this.idle = 0; if (a === 'ok' || a === 'start') { this.ui.audio.play('ok'); this.ui.go('main'); } }
    click() { this.input('ok'); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S, t = this.t;
      const ang = t * 0.003;
      ui.fighterView([showItem(this.a, [-1.1, 0, 0], 0), showItem(this.b, [1.1, 0, 0], Math.PI)], { eye: [Math.sin(ang) * 5.5, 1.4, -Math.cos(ang) * 5.5 + 0.0], at: [0, 1.1, 0], fov: 0.7 }, this.stage);
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.1)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const cy = H * 0.3;
      const sweep = ((t * 6) % (W * 2)) - W * 0.5;
      g.save();
      ui.text('TEKKEN', W / 2 - 40 * S, cy, 92 * S, '#fff', 'center', FONT_H, { italic: true, stroke: 10, strokeColor: '#1a0a02', grad: [[0, '#ffffff'], [0.5, '#d8d8e0'], [0.52, '#8a8a98'], [1, '#e8e8f0']] });
      ui.text('3', W / 2 + 190 * S, cy + 16 * S, 150 * S, '#ff3010', 'center', FONT_H, { italic: true, stroke: 12, strokeColor: '#1a0400', grad: [[0, '#ffe080'], [0.4, '#ff6010'], [1, '#a01000']] });
      g.globalCompositeOperation = 'lighter';
      const sg = g.createLinearGradient(sweep - 60, 0, sweep + 60, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,240,200,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sg; g.fillRect(sweep - 60, cy - 110 * S, 120, 150 * S);
      g.restore();
      ui.text('WIN 98 EDITION', W / 2, cy + 44 * S, 20 * S, '#e8a430', 'center', FONT_H, { italic: true, stroke: 4 });
      if ((t >> 5) % 2 === 0) ui.text('НАЖМИТЕ START', W / 2, H * 0.78, 26 * S, '#fff', 'center', FONT_H, { italic: true, stroke: 5 });
      ui.text('Enter — начать   ·   W A S D + U I J K — бой   ·   Esc — пауза', W / 2, H - 16 * S, 12 * S, '#aaa', 'center', FONT_T);
    }
  }

  const MODES = [
    ['arcade', 'АРКАДА', 'Одиннадцать боёв подряд: турнир, глава концерна Курогане и древний Колосс. Победа открывает новых бойцов, концовки и режимы.'],
    ['vs', 'БОЙ ВДВОЁМ', 'Два игрока на одной клавиатуре или с геймпадами. Выбор арены и счёт побед.'],
    ['team', 'КОМАНДНЫЙ БОЙ', 'Команды до восьми бойцов. Победитель остаётся на ринге с остатком здоровья.'],
    ['ta', 'НА ВРЕМЯ', 'Аркада на скорость. Лучшие пять результатов попадают в рекорды.'],
    ['survival', 'ВЫЖИВАНИЕ', 'Бои до первого поражения. Между боями восстанавливается немного здоровья.'],
    ['practice', 'ТРЕНИРОВКА', 'Свободная тренировка: манекен, лог ввода, фреймовое преимущество и разучивание приёмов.'],
    ['force', 'ШТУРМ «КУРОГАНЕ»', 'Прорвитесь через охрану концерна: четыре этажа, волны противников и главарь.'],
    ['ball', 'ПЛЯЖНЫЙ МЯЧ', 'Бейте по мячу приёмами: чем сильнее удар, тем опаснее мяч для соперника.'],
    ['theater', 'КИНОЗАЛ', 'Открытые концовки и музыкальный автомат.'],
    ['records', 'РЕКОРДЫ', 'Лучшее время, серии выживания и очки штурма.'],
    ['options', 'НАСТРОЙКИ', 'Сложность, раунды, время, звук и управление.']
  ];

  class Main {
    constructor(ui, a) {
      this.ui = ui; this.sel = a.sel || 0; this.t = 0;
      const pool = T.selectableFighters(ui.save);
      this.show = showcase(ui, pool[Math.floor(Math.random() * pool.length)]);
      this.stage = T.STAGE.training;
    }
    enter() { this.ui.scene.setStage(this.stage); this.ui.audio.music('select'); }
    locked(id) {
      const s = this.ui.save;
      if (id === 'force') return !s.force;
      if (id === 'ball') return !s.ball;
      if (id === 'theater') return !s.theater;
      return false;
    }
    step() { this.t++; tickShow(this.show, this.t % 600 < 300 ? 'idle' : 'win'); }
    input(a) {
      const ui = this.ui;
      if (a === 'up') { this.sel = (this.sel + MODES.length - 1) % MODES.length; ui.audio.play('menu'); }
      if (a === 'down') { this.sel = (this.sel + 1) % MODES.length; ui.audio.play('menu'); }
      if (a === 'back') { ui.audio.play('back'); ui.go('title'); }
      if (a === 'ok' || a === 'start') this.pick();
    }
    pick() {
      const ui = this.ui, id = MODES[this.sel][0];
      if (this.locked(id)) { ui.audio.play('deny'); return; }
      ui.audio.play('ok');
      ui.flow.start(id, this.sel);
    }
    click(id) { if (id.startsWith('m')) { this.sel = +id.slice(1); this.pick(); } }
    hover(id) { if (id.startsWith('m') && this.sel !== +id.slice(1)) { this.sel = +id.slice(1); this.ui.audio.play('menu'); } }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      const ang = this.t * 0.004;
      const sz = this.show.B.size || 1;
      ui.fighterView([showItem(this.show, [0.9, 0, 0], Math.PI + 0.5)], { eye: [0.9 + Math.sin(ang) * 0.6 - 2.6, 1.3 * sz, 3.2], at: [0.2, 1.0 * sz, 0], fov: 0.7 }, this.stage);
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, 'rgba(10,4,2,0.92)'); gr.addColorStop(0.45, 'rgba(10,4,2,0.55)'); gr.addColorStop(1, 'rgba(10,4,2,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      ui.text('ГЛАВНОЕ МЕНЮ', 40 * S, 52 * S, 30 * S, '#e8a430', 'left', FONT_H, { italic: true, stroke: 4 });
      const x0 = 46 * S, y0 = 98 * S, lh = Math.min(38 * S, (H - 170 * S) / MODES.length);
      MODES.forEach(([id, label], k) => {
        const on = k === this.sel;
        const lock = this.locked(id);
        const y = y0 + k * lh;
        const off = on ? 18 * S + Math.sin(this.t * 0.15) * 3 * S : 0;
        if (on) {
          const bg = g.createLinearGradient(x0 - 10 * S, 0, x0 + 360 * S, 0);
          bg.addColorStop(0, 'rgba(255,90,10,0.95)'); bg.addColorStop(0.7, 'rgba(255,170,40,0.6)'); bg.addColorStop(1, 'rgba(255,170,40,0)');
          g.fillStyle = bg;
          g.beginPath(); g.moveTo(x0 - 14 * S, y - lh * 0.72); g.lineTo(x0 + 380 * S, y - lh * 0.72); g.lineTo(x0 + 368 * S, y + lh * 0.12); g.lineTo(x0 - 26 * S, y + lh * 0.12); g.closePath(); g.fill();
        }
        ui.text(lock ? '? ? ?' : label, x0 + off, y, (on ? 24 : 20) * S, on ? '#fff' : lock ? '#555' : '#cfc3b0', 'left', FONT_H, { italic: true, stroke: on ? 4 : 0 });
        ui.hotspot('m' + k, x0 - 10 * S, y - lh * 0.72, 380 * S, lh);
      });
      const d = MODES[this.sel];
      const lock = this.locked(d[0]);
      ui.panel(40 * S, H - 74 * S, Math.min(W - 80 * S, 520 * S), 56 * S, { fill: 'rgba(0,0,0,0.7)' });
      ui.wrap(lock ? 'Режим откроется после прохождения аркады.' : d[2], 56 * S, H - 50 * S, Math.min(W - 110 * S, 490 * S), 13 * S, '#ddd', 17 * S);
      const s = ui.save;
      ui.text(`Пройдено аркад: ${s.clears}   Бойцов открыто: ${T.selectableFighters(s).length}/${T.ROSTER.length}`, W - 20 * S, H - 14 * S, 11 * S, '#998', 'right', FONT_T);
    }
  }

  class Select {
    constructor(ui, a) {
      this.ui = ui; this.a = a; this.t = 0;
      this.list = T.rosterOrder();
      this.cols = Math.min(9, Math.ceil(this.list.length / 2));
      this.players = a.players || 1;
      this.cpuPick = a.cpuPick || false;
      this.cur = [0, Math.min(1, this.list.length - 1)];
      this.done = [false, this.players === 1 && !this.cpuPick];
      this.costume = [0, 1];
      this.shows = [null, null];
      this.title = a.title || 'ВЫБОР БОЙЦА';
      if (a.pre) this.cur[0] = Math.max(0, this.list.findIndex(d => d.id === a.pre));
      this.refresh(0); if (this.players === 2 || this.cpuPick) this.refresh(1);
    }
    enter() { this.ui.scene.setStage(T.STAGE.training); this.ui.audio.music('select'); }
    unlocked(d) { return T.isUnlocked(this.ui.save, d); }
    refresh(i) {
      const d = this.list[this.cur[i]];
      if (!d || !this.unlocked(d)) { this.shows[i] = null; return; }
      this.shows[i] = showcase(this.ui, d, this.costume[i]);
    }
    active() { return this.done[0] ? 1 : 0; }
    move(i, dx, dy) {
      const n = this.list.length;
      let c = this.cur[i];
      const col = c % this.cols, row = Math.floor(c / this.cols);
      const rows = Math.ceil(n / this.cols);
      let nc = col + dx, nr = (row + dy + rows) % rows;
      nc = (nc + this.cols) % this.cols;
      c = Math.min(n - 1, nr * this.cols + nc);
      this.cur[i] = c;
      this.refresh(i);
      this.ui.audio.play('menu');
    }
    input(a, p) {
      const ui = this.ui;
      let i = this.players === 2 ? p : this.active();
      if (this.players === 1 && this.done[0] && !this.cpuPick) return;
      if (this.done[i] && a !== 'back') return;
      if (a === 'left') this.move(i, -1, 0);
      else if (a === 'right') this.move(i, 1, 0);
      else if (a === 'up') this.move(i, 0, -1);
      else if (a === 'down') this.move(i, 0, 1);
      else if (a === 'ok' || a === 'start' || a === 'b3' || a === 'b4' || a === 'back' && false) this.choose(i, a === 'ok' || a === 'start' ? 0 : a === 'b3' ? 2 : 3);
      else if (a === 'back') {
        if (this.done[i] && (this.players === 2 || this.cpuPick)) { this.done[i] = false; ui.audio.play('back'); }
        else if (this.players === 1 && this.cpuPick && this.done[0]) { this.done[0] = false; ui.audio.play('back'); }
        else { ui.audio.play('back'); this.a.onBack ? this.a.onBack() : ui.go('main'); }
      }
    }
    choose(i, cost) {
      const ui = this.ui;
      const d = this.list[this.cur[i]];
      if (!this.unlocked(d)) { ui.audio.play('deny'); return; }
      const maxC = T.costumesFor(ui.save, d);
      this.costume[i] = Math.min(cost, maxC - 1);
      if (i === 1 && this.done[0] && this.list[this.cur[0]] === d && this.costume[1] === this.costume[0]) this.costume[1] = (this.costume[0] + 1) % Math.max(2, maxC);
      this.refresh(i);
      this.done[i] = true;
      this.shows[i] && tickShow(this.shows[i], 'win');
      ui.audio.play('ok');
      ui.audio.say(d.en.split(' ')[0].toLowerCase().replace(/^./, c => c.toUpperCase()), 0.95);
      const need = this.players === 2 || this.cpuPick ? [true, true] : [true, false];
      if (this.done[0] && (!need[1] || this.done[1])) {
        this.finishT = 40;
      }
    }
    step() {
      this.t++;
      for (let i = 0; i < 2; i++) if (this.shows[i]) tickShow(this.shows[i], this.done[i] ? 'win' : 'idle');
      if (this.finishT !== undefined && --this.finishT <= 0) {
        this.finishT = undefined;
        const pick = i => ({ def: this.list[this.cur[i]], costume: this.costume[i] });
        this.a.onDone(pick(0), this.players === 2 || this.cpuPick ? pick(1) : null);
      }
    }
    click(id) {
      if (!id.startsWith('c')) return;
      const k = +id.slice(1);
      const i = this.players === 2 ? (this.done[0] ? 1 : 0) : this.active();
      if (this.cur[i] === k) this.choose(i, 0);
      else { this.cur[i] = k; this.refresh(i); this.ui.audio.play('menu'); }
    }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      const items = [];
      if (this.shows[0]) items.push(showItem(this.shows[0], [-1.25, 0, 0], 0.55));
      if (this.shows[1]) items.push(showItem(this.shows[1], [1.25, 0, 0], Math.PI - 0.55));
      if (ui.glOk) ui.fighterView(items, { eye: [0, 1.25, 4.4], at: [0, 1.15, 0], fov: 0.72 }, T.STAGE.training);
      const vg = g.createRadialGradient(W / 2, H * 0.4, H * 0.2, W / 2, H * 0.4, H);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      ui.text(this.title, W / 2, 40 * S, 28 * S, '#e8a430', 'center', FONT_H, { italic: true, stroke: 5 });
      if (this.a.sub) ui.text(this.a.sub, W / 2, 60 * S, 13 * S, '#ccc', 'center', FONT_T, { weight: 'bold', stroke: 3 });
      for (let i = 0; i < 2; i++) {
        const d = this.list[this.cur[i]];
        if (i === 1 && !(this.players === 2 || this.cpuPick)) continue;
        const x = i === 0 ? 24 * S : W - 24 * S, al = i === 0 ? 'left' : 'right';
        const lock = !this.unlocked(d);
        ui.text(i === 0 ? '1P' : this.players === 2 ? '2P' : 'CPU', x, 96 * S, 16 * S, i === 0 ? '#40a0ff' : '#ff4040', al, FONT_H, { italic: true, stroke: 4 });
        ui.text(lock ? '? ? ?' : d.name.toUpperCase(), x, 124 * S, 24 * S, '#fff', al, FONT_H, { italic: true, stroke: 5 });
        if (!lock) {
          ui.text(`${d.country} · ${d.style}`, x, 144 * S, 12 * S, '#e8c070', al, FONT_T, { weight: 'bold', stroke: 3 });
          if (this.done[i]) ui.text('ГОТОВ!', x, 168 * S, 18 * S, '#ffe040', al, FONT_H, { italic: true, stroke: 4 });
          else ui.text(`Костюм: Enter/1 · 3 · 4   (${T.costumesFor(ui.save, d)} дост.)`, x, 164 * S, 10 * S, '#aaa', al, FONT_T, { stroke: 3 });
        }
      }
      const d0 = this.list[this.cur[this.active()]];
      if (d0 && this.unlocked(d0) && !(this.players === 2)) {
        const bw = Math.min(360 * S, W * 0.42);
        ui.panel(24 * S, H * 0.5, bw, 92 * S, { fill: 'rgba(0,0,0,0.6)' });
        ui.wrap(d0.bio, 36 * S, H * 0.5 + 22 * S, bw - 24 * S, 12 * S, '#ddd', 15 * S);
      }
      const n = this.list.length, cols = this.cols, rows = Math.ceil(n / cols);
      const tw = Math.min(64 * S, (W - 60 * S) / cols - 6 * S), th = tw * 1.1;
      const gx = W / 2 - (cols * (tw + 6 * S)) / 2, gy = H - rows * (th + 6 * S) - 18 * S;
      this.list.forEach((d, k) => {
        const cx = gx + (k % cols) * (tw + 6 * S), cy = gy + Math.floor(k / cols) * (th + 6 * S);
        const lock = !this.unlocked(d);
        g.fillStyle = '#111'; g.fillRect(cx, cy, tw, th);
        if (!lock) g.drawImage(ui.portrait(d, 0), cx, cy, tw, th);
        else { g.fillStyle = '#1a1414'; g.fillRect(cx, cy, tw, th); ui.text('?', cx + tw / 2, cy + th * 0.66, th * 0.5, '#444', 'center', FONT_H); }
        g.strokeStyle = 'rgba(232,164,48,0.5)'; g.lineWidth = 1; g.strokeRect(cx + 0.5, cy + 0.5, tw - 1, th - 1);
        ui.hotspot('c' + k, cx, cy, tw, th);
        for (let i = 0; i < 2; i++) {
          if (i === 1 && !(this.players === 2 || this.cpuPick)) continue;
          if (this.cur[i] !== k) continue;
          const col = i === 0 ? '#40a0ff' : '#ff4040';
          const pulse = this.done[i] ? 1 : 0.6 + Math.sin(this.t * 0.2) * 0.4;
          g.strokeStyle = col; g.globalAlpha = pulse; g.lineWidth = 4 * S; g.strokeRect(cx + 2, cy + 2, tw - 4, th - 4); g.globalAlpha = 1;
          ui.text(i === 0 ? '1P' : '2P', cx + (i === 0 ? 4 * S : tw - 4 * S), cy + 14 * S, 11 * S, col, i === 0 ? 'left' : 'right', FONT_H, { stroke: 3 });
        }
        if (!lock) ui.text(d.short.length > 8 ? d.short.slice(0, 8) : d.short, cx + tw / 2, cy + th - 5 * S, 9 * S, '#fff', 'center', FONT_T, { weight: 'bold', stroke: 3 });
      });
    }
  }

  class Stage {
    constructor(ui, a) { this.ui = ui; this.a = a; this.list = T.SELECTABLE_STAGES.concat([T.STAGE.training]); this.sel = Math.max(0, this.list.findIndex(s => s.id === a.pre)); this.t = 0; this.apply(); }
    apply() { this.ui.scene.setStage(this.list[this.sel]); this.ui.scene.parts.length = 0; }
    enter() { this.ui.audio.music('select'); }
    step() { this.t++; T.ambientTick(this.ui.scene, this.list[this.sel], this.ui.scene.cam || { at: [0, 1, 0] }, this.ui.clock); this.ui.scene.tickParts(); }
    input(a) {
      const ui = this.ui;
      if (a === 'up' || a === 'left') { this.sel = (this.sel + this.list.length - 1) % this.list.length; this.apply(); ui.audio.play('menu'); }
      if (a === 'down' || a === 'right') { this.sel = (this.sel + 1) % this.list.length; this.apply(); ui.audio.play('menu'); }
      if (a === 'back') { ui.audio.play('back'); this.a.onBack(); }
      if (a === 'ok' || a === 'start') { ui.audio.play('ok'); this.a.onDone(this.list[this.sel].id); }
      if (a === 'b3') { this.a.onDone(this.list[Math.floor(Math.random() * (this.list.length - 1))].id); }
    }
    click(id) { if (id.startsWith('s')) { const k = +id.slice(1); if (k === this.sel) this.input('ok'); else { this.sel = k; this.apply(); } } }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      const ang = this.t * 0.004;
      ui.fighterView([], { eye: [Math.sin(ang) * 6, 2.2, Math.cos(ang) * 6], at: [0, 1.2, 0], fov: 0.8 }, this.list[this.sel]);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 300 * S, H);
      ui.text('АРЕНА', 24 * S, 46 * S, 28 * S, '#e8a430', 'left', FONT_H, { italic: true, stroke: 4 });
      const lh = Math.min(30 * S, (H - 110 * S) / this.list.length);
      this.list.forEach((s, k) => {
        const on = k === this.sel, y = 84 * S + k * lh;
        if (on) { g.fillStyle = 'rgba(232,120,30,0.9)'; g.fillRect(16 * S, y - lh * 0.72, 270 * S, lh * 0.9); }
        ui.text(s.name, 26 * S, y, 14 * S, on ? '#fff' : '#ccc', 'left', FONT_T, { weight: 'bold' });
        ui.text(s.time, 278 * S, y, 11 * S, on ? '#fff' : '#888', 'right', FONT_T);
        ui.hotspot('s' + k, 16 * S, y - lh * 0.72, 270 * S, lh * 0.9);
      });
      ui.text('Enter — выбрать · J — случайная · Esc — назад', W - 16 * S, H - 14 * S, 12 * S, '#ccc', 'right', FONT_T, { stroke: 3 });
    }
  }

  class Versus {
    constructor(ui, a) { this.ui = ui; this.a = a; this.t = 0; }
    enter() { this.ui.audio.play('gong'); this.ui.audio.music(null); }
    step() { if (++this.t > (this.a.dur || 150)) this.a.onDone(); }
    input(a) { if ((a === 'ok' || a === 'start') && this.t > 30) this.a.onDone(); }
    click() { this.input('ok'); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S, t = this.t;
      ui.clearGL([0, 0, 0]);
      const [p1, p2] = this.a.p;
      const k = clamp(t / 18, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      g.save();
      const g1 = g.createLinearGradient(0, 0, W / 2, H);
      g1.addColorStop(0, '#0a2a6a'); g1.addColorStop(1, '#020818');
      g.fillStyle = g1; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.58, 0); g.lineTo(W * 0.42, H); g.lineTo(0, H); g.closePath(); g.fill();
      const g2 = g.createLinearGradient(W, 0, W / 2, H);
      g2.addColorStop(0, this.a.boss ? '#8a1a00' : '#6a0a0a'); g2.addColorStop(1, '#180202');
      g.fillStyle = g2; g.beginPath(); g.moveTo(W * 0.58, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(W * 0.42, H); g.closePath(); g.fill();
      g.strokeStyle = '#ffd060'; g.lineWidth = 6 * S; g.beginPath(); g.moveTo(W * 0.58, 0); g.lineTo(W * 0.42, H); g.stroke();
      const ps = Math.min(W * 0.34, H * 0.62);
      const x1 = lerp(-ps, W * 0.08, e), x2 = lerp(W, W * 0.92 - ps, e);
      g.drawImage(ui.portrait(p1.def, p1.costume), x1, H * 0.16, ps, ps);
      g.save(); g.translate(x2 + ps, H * 0.16); g.scale(-1, 1); g.drawImage(ui.portrait(p2.def, p2.costume), 0, 0, ps, ps); g.restore();
      g.restore();
      ui.text(p1.def.name.toUpperCase(), W * 0.06, H * 0.16 + ps + 40 * S, 26 * S, '#fff', 'left', FONT_H, { italic: true, stroke: 5 });
      ui.text(p1.def.country, W * 0.06, H * 0.16 + ps + 60 * S, 13 * S, '#9cf', 'left', FONT_T, { weight: 'bold' });
      ui.text(p2.def.name.toUpperCase(), W * 0.94, H * 0.16 + ps + 40 * S, 26 * S, '#fff', 'right', FONT_H, { italic: true, stroke: 5 });
      ui.text(p2.def.country, W * 0.94, H * 0.16 + ps + 60 * S, 13 * S, '#f99', 'right', FONT_T, { weight: 'bold' });
      const vs = t > 18 ? 1 + Math.max(0, 0.6 - (t - 18) * 0.05) : 0;
      if (vs) ui.text('VS', W / 2, H * 0.52, 110 * S * vs, '#ffe040', 'center', FONT_H, { italic: true, stroke: 10, grad: [[0, '#fff8c0'], [0.5, '#ffb020'], [1, '#c04000']] });
      if (this.a.top) ui.text(this.a.top, W / 2, 44 * S, 22 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
      if (this.a.bottom) ui.text(this.a.bottom, W / 2, H - 22 * S, 15 * S, '#ddd', 'center', FONT_T, { weight: 'bold', stroke: 3 });
    }
  }

  class Continue {
    constructor(ui, a) { this.ui = ui; this.a = a; this.t = 0; this.n = 10; }
    enter() { this.ui.audio.music('select'); }
    step() {
      this.t++;
      if (this.t % 60 === 0) { this.n--; this.ui.audio.play('tick'); if (this.n < 0) this.a.onNo(); }
    }
    input(a) {
      if (a === 'ok' || a === 'start') { this.ui.audio.play('coin'); this.a.onYes(); }
      if (a === 'back') { this.t += 60 - (this.t % 60); this.n--; this.ui.audio.play('tick'); if (this.n < 0) this.a.onNo(); }
    }
    click() { this.input('ok'); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]);
      ui.bg('red');
      g.drawImage(ui.portrait(this.a.def, this.a.costume), W / 2 - 80 * S, H * 0.18, 160 * S, 160 * S);
      ui.text('ПРОДОЛЖИТЬ?', W / 2, H * 0.62, 44 * S, '#fff', 'center', FONT_H, { italic: true, stroke: 6 });
      ui.text(String(Math.max(0, this.n)), W / 2, H * 0.82, 90 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 8 });
      ui.text('Enter — да   ·   Esc — быстрее', W / 2, H - 16 * S, 12 * S, '#ccc', 'center', FONT_T);
    }
  }

  class Message {
    constructor(ui, a) { this.ui = ui; this.a = a; this.t = 0; this.show = a.def ? showcase(ui, a.def, a.costume || 0) : null; }
    enter() { if (this.a.sound) this.ui.audio.play(this.a.sound); if (this.a.music !== undefined) this.ui.audio.music(this.a.music); this.ui.scene.setStage(T.STAGE.training); }
    step() { this.t++; if (this.show) tickShow(this.show, this.t > 60 ? 'win' : 'intro'); if (this.a.auto && this.t > this.a.auto) this.a.onDone(); }
    input(a) { if ((a === 'ok' || a === 'start' || a === 'back') && this.t > 40) { this.ui.audio.play('ok'); this.a.onDone(); } }
    click() { this.input('ok'); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      if (this.show && ui.glOk) {
        const ang = this.t * 0.01, sz = this.show.B.size || 1;
        ui.fighterView([showItem(this.show, [0, 0, 0], Math.PI / 2)], { eye: [Math.sin(ang) * 4.4 * sz, 1.25 * sz, Math.cos(ang) * 4.4 * sz], at: [0, 1.15 * sz, 0], fov: 0.7 }, T.STAGE.training);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H);
      } else { ui.clearGL([0, 0, 0]); ui.bg(this.a.bg || 'gold'); }
      ui.text(this.a.title, W / 2, H * 0.18, 40 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 6 });
      if (this.a.name) ui.text(this.a.name, W / 2, H * 0.72, 34 * S, '#fff', 'center', FONT_H, { italic: true, stroke: 5 });
      if (this.a.text) {
        ui.panel(W / 2 - 280 * S, H * 0.76, 560 * S, 84 * S, { fill: 'rgba(0,0,0,0.7)' });
        ui.wrap(this.a.text, W / 2 - 262 * S, H * 0.76 + 24 * S, 524 * S, 13 * S, '#eee', 17 * S);
      }
      if (this.t > 40 && (this.t >> 5) % 2) ui.text('Enter', W - 20 * S, H - 16 * S, 12 * S, '#ccc', 'right', FONT_T);
    }
  }

  class Result {
    constructor(ui, a) { this.ui = ui; this.a = a; this.t = 0; this.sel = 0; this.show = showcase(ui, a.def, a.costume); }
    enter() { this.ui.audio.music('select'); }
    step() { this.t++; tickShow(this.show, 'win'); }
    input(a) {
      const n = this.a.items.length;
      if (a === 'up') { this.sel = (this.sel + n - 1) % n; this.ui.audio.play('menu'); }
      if (a === 'down') { this.sel = (this.sel + 1) % n; this.ui.audio.play('menu'); }
      if (a === 'ok' || a === 'start') { this.ui.audio.play('ok'); this.a.items[this.sel][1](); }
    }
    click(id) { if (id.startsWith('r')) { this.sel = +id.slice(1); this.input('ok'); } }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      const sz = this.show.B.size || 1;
      ui.fighterView([showItem(this.show, [0, 0, 0], Math.PI / 2 + 0.4)], { eye: [0.9, 1.35 * sz, 2.6], at: [0.3, 1.05 * sz, 0], fov: 0.65 }, T.STAGE[this.a.stage] || T.STAGE.training);
      const gr = g.createLinearGradient(W, 0, 0, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      ui.text(this.a.title, W - 30 * S, 60 * S, 34 * S, '#ffe040', 'right', FONT_H, { italic: true, stroke: 5 });
      ui.text('«' + this.a.def.quote + '»', W - 30 * S, 96 * S, 15 * S, '#fff', 'right', FONT_T, { weight: 'bold', italic: true, stroke: 3 });
      if (this.a.score) ui.text(this.a.score, W - 30 * S, 124 * S, 20 * S, '#9cf', 'right', FONT_H, { italic: true, stroke: 4 });
      this.a.items.forEach(([label], k) => {
        const on = k === this.sel, y = H - (this.a.items.length - k) * 36 * S - 20 * S;
        if (on) { g.fillStyle = 'rgba(232,120,30,0.9)'; g.fillRect(W - 300 * S, y - 24 * S, 270 * S, 32 * S); }
        ui.text(label, W - 44 * S, y, 18 * S, on ? '#fff' : '#ccc', 'right', FONT_H, { italic: true });
        ui.hotspot('r' + k, W - 300 * S, y - 24 * S, 270 * S, 32 * S);
      });
    }
  }

  class Options {
    constructor(ui) { this.ui = ui; this.sel = 0; this.confirm = false; }
    enter() { this.ui.audio.music('select'); }
    rows() {
      const o = this.ui.save.opts;
      const pct = v => Math.round(v * 100) + '%';
      return [
        ['diff', 'Сложность', DIFF[o.diff]],
        ['rounds', 'Раундов до победы', String(o.rounds)],
        ['time', 'Время раунда', o.time ? o.time + ' с' : 'без ограничения'],
        ['sfx', 'Громкость эффектов', pct(o.sfx)],
        ['music', 'Громкость музыки', pct(o.music)],
        ['voice', 'Громкость голосов', pct(o.voice)],
        ['announcer', 'Диктор', o.announcer ? 'вкл' : 'выкл'],
        ['chText', 'Надпись «Контрудар»', o.chText ? 'вкл' : 'выкл'],
        ['shake', 'Тряска камеры', o.shake ? 'вкл' : 'выкл'],
        ['fps', 'Счётчик FPS', o.fps ? 'вкл' : 'выкл'],
        ['keys', 'Управление…', ''],
        ['reset', this.confirm ? 'Точно стереть прогресс? Enter — да' : 'Сбросить прогресс', ''],
        ['back', 'Назад', '']
      ];
    }
    change(id, d) {
      const o = this.ui.save.opts;
      if (id === 'diff') o.diff = clamp(o.diff + d, 0, 4);
      if (id === 'rounds') o.rounds = clamp(o.rounds + d, 1, 5);
      if (id === 'time') { const i = TIMES.indexOf(o.time); o.time = TIMES[(i + d + TIMES.length) % TIMES.length]; }
      if (id === 'sfx' || id === 'music' || id === 'voice') o[id] = clamp(Math.round((o[id] + d * 0.1) * 10) / 10, 0, 1);
      if (['announcer', 'chText', 'shake', 'fps'].includes(id)) o[id] = !o[id];
      this.ui.applyOpts(); this.ui.persist();
      this.ui.audio.play('menu');
    }
    input(a) {
      const rows = this.rows(), id = rows[this.sel][0];
      if (a === 'up') { this.sel = (this.sel + rows.length - 1) % rows.length; this.confirm = false; this.ui.audio.play('menu'); }
      if (a === 'down') { this.sel = (this.sel + 1) % rows.length; this.confirm = false; this.ui.audio.play('menu'); }
      if (a === 'left') this.change(id, -1);
      if (a === 'right') this.change(id, 1);
      if (a === 'back') { this.ui.audio.play('back'); this.ui.go('main', { sel: 10 }); }
      if (a === 'ok' || a === 'start') {
        if (id === 'keys') { this.ui.audio.play('ok'); this.ui.go('keys'); }
        else if (id === 'back') { this.ui.audio.play('back'); this.ui.go('main', { sel: 10 }); }
        else if (id === 'reset') {
          if (!this.confirm) { this.confirm = true; this.ui.audio.play('menu'); }
          else { const keep = { opts: this.ui.save.opts, keys: this.ui.save.keys }; this.ui.save = Object.assign(T.freshSave(), keep); this.ui.persist(); this.confirm = false; this.ui.audio.play('ok'); }
        } else this.change(id, 1);
      }
    }
    click(id) { if (id.startsWith('o')) { const k = +id.slice(1); if (k === this.sel) this.input('ok'); else this.sel = k; } }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]); ui.bg('blue');
      const rows = this.rows();
      const w = Math.min(560 * S, W - 40 * S), h = (90 + rows.length * 32) * S, x = W / 2 - w / 2, y = Math.max(10 * S, H / 2 - h / 2);
      ui.panel(x, y, w, h);
      ui.text('НАСТРОЙКИ', W / 2, y + 44 * S, 30 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 4 });
      rows.forEach(([id, label, val], k) => {
        const on = k === this.sel, yy = y + (86 + k * 32) * S;
        if (on) { g.fillStyle = 'rgba(232,164,48,0.85)'; g.fillRect(x + 14 * S, yy - 22 * S, w - 28 * S, 29 * S); }
        ui.text(label, x + 28 * S, yy, 15 * S, on ? '#111' : '#eee', 'left', FONT_T, { weight: 'bold' });
        if (val) ui.text((on ? '◄ ' : '') + val + (on ? ' ►' : ''), x + w - 28 * S, yy, 15 * S, on ? '#111' : '#ffd070', 'right', FONT_T, { weight: 'bold' });
        ui.hotspot('o' + k, x + 14 * S, yy - 22 * S, w - 28 * S, 29 * S);
      });
    }
  }

  const KEY_ROWS = [['up', 'Вверх'], ['down', 'Вниз'], ['left', 'Влево'], ['right', 'Вправо'], ['b1', 'Левая рука (1)'], ['b2', 'Правая рука (2)'], ['b3', 'Левая нога (3)'], ['b4', 'Правая нога (4)'], ['start', 'Старт / пауза']];

  class Keys {
    constructor(ui) { this.ui = ui; this.row = 0; this.col = 0; this.wait = false; }
    rawKey(code) {
      if (!this.wait) return false;
      if (code === 'Escape') { this.wait = false; return true; }
      const p = this.col === 0 ? 'p1' : 'p2';
      this.ui.save.keys[p][KEY_ROWS[this.row][0]] = code;
      this.ui.save.keys = JSON.parse(JSON.stringify(this.ui.save.keys));
      this.ui.persist();
      this.wait = false;
      this.ui.audio.play('ok');
      return true;
    }
    input(a) {
      if (this.wait) return;
      const n = KEY_ROWS.length + 2;
      if (a === 'up') this.row = (this.row + n - 1) % n;
      if (a === 'down') this.row = (this.row + 1) % n;
      if (a === 'left' || a === 'right') this.col = 1 - this.col;
      if (a === 'back') { this.ui.go('options'); return; }
      if (a === 'ok' || a === 'start') {
        if (this.row === KEY_ROWS.length) { this.ui.save.keys = JSON.parse(JSON.stringify(T.DEFAULT_KEYS)); this.ui.persist(); this.ui.audio.play('ok'); }
        else if (this.row === KEY_ROWS.length + 1) this.ui.go('options');
        else { this.wait = true; this.ui.audio.play('menu'); }
      }
    }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]); ui.bg('blue');
      const w = Math.min(620 * S, W - 40 * S), x = W / 2 - w / 2, y = 30 * S, h = H - 60 * S;
      ui.panel(x, y, w, h);
      ui.text('УПРАВЛЕНИЕ', W / 2, y + 42 * S, 28 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 4 });
      ui.text('ИГРОК 1', x + w * 0.6, y + 74 * S, 14 * S, '#40a0ff', 'center', FONT_H);
      ui.text('ИГРОК 2', x + w * 0.85, y + 74 * S, 14 * S, '#ff5050', 'center', FONT_H);
      const lh = Math.min(30 * S, (h - 140 * S) / (KEY_ROWS.length + 2));
      KEY_ROWS.forEach(([id, label], k) => {
        const yy = y + 104 * S + k * lh;
        ui.text(label, x + 30 * S, yy, 14 * S, '#eee', 'left', FONT_T, { weight: 'bold' });
        for (let c = 0; c < 2; c++) {
          const on = this.row === k && this.col === c;
          const cx = x + w * (c ? 0.85 : 0.6);
          if (on) { g.fillStyle = this.wait ? 'rgba(255,60,40,0.9)' : 'rgba(232,164,48,0.85)'; g.fillRect(cx - 70 * S, yy - 20 * S, 140 * S, 26 * S); }
          const code = ui.save.keys[c ? 'p2' : 'p1'][id];
          ui.text(on && this.wait ? 'нажмите…' : code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '↕').replace('Numpad', 'Num '), cx, yy, 14 * S, on ? '#111' : '#ffd070', 'center', FONT_T, { weight: 'bold' });
        }
      });
      const extra = [['По умолчанию', KEY_ROWS.length], ['Назад', KEY_ROWS.length + 1]];
      extra.forEach(([label, k]) => {
        const yy = y + 104 * S + k * lh + 8 * S, on = this.row === k;
        if (on) { g.fillStyle = 'rgba(232,164,48,0.85)'; g.fillRect(x + 20 * S, yy - 20 * S, w - 40 * S, 26 * S); }
        ui.text(label, W / 2, yy, 15 * S, on ? '#111' : '#eee', 'center', FONT_T, { weight: 'bold' });
      });
      ui.text('Геймпад: X/□=1  Y/△=2  A/✕=3  B/○=4  LB=1+2  RB=3+4  LT/RT=броски', W / 2, y + h - 14 * S, 11 * S, '#aaa', 'center', FONT_T);
    }
  }

  class Records {
    constructor(ui) { this.ui = ui; }
    input(a) { if (a) { this.ui.audio.play('back'); this.ui.go('main', { sel: 9 }); } }
    click() { this.input('back'); }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S, r = ui.save.records;
      ui.clearGL([0, 0, 0]); ui.bg('gold');
      ui.text('РЕКОРДЫ', W / 2, 50 * S, 32 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
      const cols = [
        ['НА ВРЕМЯ', r.ta.map(e => [T.FIGHTER[e.id] ? T.FIGHTER[e.id].short : e.id, T.fmtTime(e.t)])],
        ['ВЫЖИВАНИЕ', r.surv.map(e => [T.FIGHTER[e.id] ? T.FIGHTER[e.id].short : e.id, e.n + ' поб.'])],
        ['ШТУРМ', r.force.map(e => [T.FIGHTER[e.id] ? T.FIGHTER[e.id].short : e.id, String(e.score)])]
      ];
      const cw = (W - 60 * S) / 3;
      cols.forEach(([title, rows], c) => {
        const x = 30 * S + c * cw;
        ui.panel(x + 6 * S, 80 * S, cw - 12 * S, 220 * S);
        ui.text(title, x + cw / 2, 108 * S, 18 * S, '#e8a430', 'center', FONT_H, { italic: true });
        for (let k = 0; k < 5; k++) {
          const e = rows[k];
          const y = 140 * S + k * 30 * S;
          ui.text(`${k + 1}.`, x + 22 * S, y, 14 * S, '#888', 'left', FONT_T, { weight: 'bold' });
          ui.text(e ? e[0] : '—', x + 46 * S, y, 14 * S, '#fff', 'left', FONT_T, { weight: 'bold' });
          ui.text(e ? e[1] : '', x + cw - 24 * S, y, 14 * S, '#ffd070', 'right', FONT_T, { weight: 'bold' });
        }
      });
      ui.panel(30 * S, 316 * S, W - 60 * S, H - 350 * S);
      ui.text('ПРОЙДЕНО АРКАДОЙ', 50 * S, 344 * S, 16 * S, '#e8a430', 'left', FONT_H, { italic: true });
      const list = T.rosterOrder();
      const per = Math.ceil(list.length / 3);
      list.forEach((d, k) => {
        const cx = 50 * S + Math.floor(k / per) * ((W - 100 * S) / 3), cy = 372 * S + (k % per) * 18 * S;
        if (cy > H - 40 * S) return;
        const known = T.isUnlocked(ui.save, d);
        ui.text(known ? d.short : '???', cx, cy, 12 * S, known ? '#ddd' : '#555', 'left', FONT_T, { weight: 'bold' });
        ui.text(String(ui.save.cleared[d.id] || 0), cx + 150 * S, cy, 12 * S, '#ffd070', 'right', FONT_T);
      });
    }
  }

  class Theater {
    constructor(ui) {
      this.ui = ui; this.sel = 0;
      this.tracks = Object.keys(T.TRACKS); this.tr = 0;
    }
    enter() { this.ui.audio.music('theater'); }
    items() {
      const s = this.ui.save;
      const it = [['intro', 'Вступление', true]];
      for (const d of T.rosterOrder()) it.push(['end:' + d.id, 'Концовка: ' + (s.endings[d.id] ? d.name : '???'), !!s.endings[d.id]]);
      it.push(['music', 'Музыка: ◄ ' + this.tracks[this.tr] + ' ►', true]);
      it.push(['back', 'Назад', true]);
      return it;
    }
    input(a) {
      const it = this.items();
      if (a === 'up') this.sel = (this.sel + it.length - 1) % it.length;
      if (a === 'down') this.sel = (this.sel + 1) % it.length;
      const id = it[this.sel][0];
      if ((a === 'left' || a === 'right') && id === 'music') { this.tr = (this.tr + (a === 'left' ? -1 : 1) + this.tracks.length) % this.tracks.length; this.ui.audio.music(this.tracks[this.tr]); }
      if (a === 'back') { this.ui.go('main', { sel: 8 }); return; }
      if (a === 'ok' || a === 'start') {
        if (!it[this.sel][2]) { this.ui.audio.play('deny'); return; }
        if (id === 'back') this.ui.go('main', { sel: 8 });
        else if (id === 'intro') this.ui.go('cine', { kind: 'intro', onDone: () => this.ui.go('theater') });
        else if (id.startsWith('end:')) this.ui.go('cine', { kind: 'ending', id: id.slice(4), onDone: () => this.ui.go('theater') });
        else if (id === 'music') this.ui.audio.music(this.tracks[this.tr]);
      }
    }
    click(id) { if (id.startsWith('t')) { const k = +id.slice(1); if (k === this.sel) this.input('ok'); else this.sel = k; } }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]); ui.bg('red');
      ui.text('КИНОЗАЛ', W / 2, 44 * S, 30 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
      const it = this.items();
      const lh = Math.min(24 * S, (H - 90 * S) / it.length);
      it.forEach(([id, label, ok], k) => {
        const on = k === this.sel, y = 78 * S + k * lh;
        if (on) { g.fillStyle = 'rgba(232,120,30,0.9)'; g.fillRect(W / 2 - 220 * S, y - lh * 0.75, 440 * S, lh * 0.95); }
        ui.text(label, W / 2, y, 13 * S, ok ? '#fff' : '#666', 'center', FONT_T, { weight: 'bold' });
        ui.hotspot('t' + k, W / 2 - 220 * S, y - lh * 0.75, 440 * S, lh * 0.95);
      });
    }
  }

  class TeamSize {
    constructor(ui, a) { this.ui = ui; this.a = a; this.n = [3, 3]; this.cpu = true; this.row = 0; }
    input(a) {
      if (a === 'up') this.row = (this.row + 3) % 4;
      if (a === 'down') this.row = (this.row + 1) % 4;
      const d = a === 'left' ? -1 : a === 'right' ? 1 : 0;
      if (d && this.row < 2) this.n[this.row] = clamp(this.n[this.row] + d, 1, 8);
      if (d && this.row === 2) this.cpu = !this.cpu;
      if (a === 'back') this.ui.go('main', { sel: 2 });
      if ((a === 'ok' || a === 'start') && this.row === 3) this.a.onDone(this.n.slice(), this.cpu);
      if ((a === 'ok' || a === 'start') && this.row === 2) this.cpu = !this.cpu;
      this.ui.audio.play('menu');
    }
    draw(g, W, H) {
      const ui = this.ui, S = ui.S;
      ui.clearGL([0, 0, 0]); ui.bg('blue');
      ui.text('КОМАНДНЫЙ БОЙ', W / 2, 60 * S, 30 * S, '#ffe040', 'center', FONT_H, { italic: true, stroke: 5 });
      const rows = [['Команда 1', this.n[0] + ' бойц.'], ['Команда 2', this.n[1] + ' бойц.'], ['Команда 2 играет', this.cpu ? 'компьютер' : 'игрок 2'], ['Начать выбор бойцов', '']];
      rows.forEach(([l, v], k) => {
        const on = k === this.row, y = H * 0.35 + k * 44 * S;
        if (on) { g.fillStyle = 'rgba(232,164,48,0.85)'; g.fillRect(W / 2 - 220 * S, y - 28 * S, 440 * S, 38 * S); }
        ui.text(l, W / 2 - 200 * S, y, 18 * S, on ? '#111' : '#eee', 'left', FONT_T, { weight: 'bold' });
        if (v) ui.text('◄ ' + v + ' ►', W / 2 + 200 * S, y, 18 * S, on ? '#111' : '#ffd070', 'right', FONT_T, { weight: 'bold' });
      });
    }
  }

  Object.assign(SCREENS, { boot: Boot, title: Title, main: Main, select: Select, stage: Stage, vs: Versus, cont: Continue, message: Message, result: Result, options: Options, keys: Keys, records: Records, theater: Theater, teamsize: TeamSize });
  Object.assign(T, { MODES, showcase, tickShow, showItem, DIFF_NAMES: DIFF });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
