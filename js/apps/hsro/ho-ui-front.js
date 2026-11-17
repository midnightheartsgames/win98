(function (HO) {
  'use strict';

  const RACE_TEXT = {
    human: ['Сотрудники и добровольцы станции. Начинают в Базовой зоне.', '«Собранность»: снимает оглушение и замедление.', '«Свой человек»: у торговцев станции цены ниже на 10%.'],
    foxian: ['Экипаж грузового судна Комиссии по облачным переправам. Начинают на перроне Зоны поддержки.', '«Лисий рывок»: рывок вперёд на 8 м.', '«Чуткий слух»: враги и тайники на мини-карте видны дальше.']
  };
  const PATH_TEXT = {
    destruction: ['В группе держит врагов на себе.', 'Одному: бьёт вблизи и терпит удары.', 'Запас: Ярость, копится от ударов.'],
    abundance: ['В группе лечит союзников.', 'Одному: бьёт мнимым светом издали и лечит себя.', 'Запас: Сила Пути.'],
    erudition: ['В группе пробивает Стойкость огнём и льдом и бьёт по площади.', 'Одному: держит врага на расстоянии.', 'Запас: Сила Пути.']
  };
  const LOOK_ROWS = [
    { key: 'face', label: 'Лицо', count: () => HO.LOOK.faces },
    { key: 'hair', label: 'Причёска', count: () => HO.LOOK.hairs },
    { key: 'hairColor', label: 'Цвет волос', count: () => HO.LOOK.hairColors.length },
    { key: 'skin', label: 'Кожа', count: () => HO.LOOK.skins.length },
    { key: 'ears', label: 'Уши', count: () => HO.LOOK.ears, fox: true },
    { key: 'tail', label: 'Хвост', count: () => HO.LOOK.tails, fox: true }
  ];
  const rnd = () => Math.random();
  const STEPS = HO.CREATE_STEPS;

  Object.assign(HO.UI.prototype, {
    initFront() {
      this.front = { rot: 0, sel: this.store.last(), draft: null, confirm: null, error: null };
      const list = this.store.list();
      if (!list.some(x => x.id === this.front.sel)) this.front.sel = list.length ? list[0].id : null;
    },

    enterFront(mode) {
      this.mode = mode;
      this.menu = false;
      this.trainer = null;
      if (this.renderer) this.renderer.setZone(HO.ZONES.showroom);
      this.front.confirm = null;
      this.front.error = null;
      if (mode === 'select' && !this.store.list().length) return this.startCreate();
      return true;
    },

    startCreate() {
      const race = 'human';
      this.front.draft = { race, sex: 'f', path: 'destruction', look: HO.randomLook(rnd, race), name: '', err: null };
      this.mode = 'create';
      this.front.rot = 0;
      return true;
    },

    previewSheet() {
      if (this.mode === 'create') return this.front.draft;
      if (this.mode === 'select' && this.front.sel) return this.store.load(this.front.sel);
      return null;
    },

    frontFrame(dt) {
      this.resize();
      if (!this.mouse.l) this.front.rot += dt * (this.mode === 'login' ? 0.12 : 0);
      const sh = this.previewSheet(), actors = [];
      if (sh) {
        const fake = { uid: -1, kind: 'hero', race: sh.race, sheet: sh, dead: false, cast: null };
        const v = { uid: -1, kind: 'hero', x: 0, y: this.mode === 'login' ? 0 : 0.17, z: 0.4, yaw: HO.PI + this.front.rot, path: sh.path, race: sh.race, look: sh.look, sex: sh.sex, floor: 0, r: 0.45 };
        const ap = this.animPose(fake, v, 0);
        if (ap) Object.assign(v, ap);
        actors.push(v);
      }
      const orbit = this.mode === 'login' ? this.front.rot : 0;
      const eye = this.mode === 'login' ? [Math.sin(orbit) * 7, 2.4, 3 + Math.cos(orbit) * 4] : this.mode === 'create' ? [-0.85, 1.3, 3.0] : [0.9, 1.35, 4.6];
      const view = { eye, target: this.mode === 'login' ? [0, 1.6, -1] : this.mode === 'create' ? [-0.85, 1.08, 0] : [0.9, 1.0, 0], actors, me: actors[0], pos: {}, marks: [], effects: [], time: this.time, decor: this.mode === 'login' ? HO.ZONES.showroom.decor : [...HO.ZONES.showroom.decor, { model: 'prop_podium', x: 0, y: 0, z: 0.4, yaw: 0 }] };
      if (this.renderer) this.renderer.render(view);
      this.buttons = [];
      const c = this.hctx;
      c.clearRect(0, 0, this.hud.width, this.hud.height);
      if (this.mode === 'login') this.drawLogin();
      else if (this.mode === 'select') this.drawSelect(sh);
      else if (this.mode === 'create') this.drawCreate();
      if (this.error) this.text('Нет 3D: ' + this.error, this.hud.width / 2, this.hud.height / 2, '#ff8080', { align: 'center', bold: true });
      if (this.settingsWin) { this.buttons = []; this.drawSettings(this.hud.width, this.hud.height); }
    },

    drawLogin() {
      const w = this.hud.width, h = this.hud.height;
      this.text(HO.TITLE, w / 2, h * 0.2, '#f0d890', { align: 'center', bold: true, size: 40 });
      this.text('Станция «Герта» ждёт добровольцев', w / 2, h * 0.2 + 50, '#c8d0e0', { align: 'center', size: 15 });
      const exit = !!this.opts.onExit, ph = exit ? 182 : 148, py = h * 0.52;
      this.panel(w / 2 - 150, py, 300, ph);
      this.text('Мир: Станция «Герта» (локальный)', w / 2, py + 12, '#c8d0e0', { align: 'center', size: 12 });
      this.button(w / 2 - 110, py + 38, 220, 30, 'Войти в мир', true, () => this.enterFront('select'));
      this.button(w / 2 - 110, py + 76, 220, 26, 'Настройки', false, () => this.openSettings('gfx'));
      if (exit) this.button(w / 2 - 110, py + 110, 220, 26, 'Выход', false, () => this.quitGame());
      this.text('Enter: войти', w / 2, py + ph - 22, '#8890a8', { align: 'center', size: 11 });
      this.text('miHoYo Shanghai, 2003', w / 2, h - 24, '#6a7290', { align: 'center', size: 11 });
    },

    drawSelect(sh) {
      const w = this.hud.width, h = this.hud.height, list = this.store.list();
      const x = w - 280;
      this.panel(x, 20, 260, 60 + Math.max(1, list.length) * 46 + 50);
      this.text('Ваши добровольцы', x + 12, 30, '#f0d890', { bold: true, size: 14 });
      list.forEach((row, i) => {
        const y = 58 + i * 46, sel = row.id === this.front.sel;
        const c = this.hctx;
        c.fillStyle = sel ? 'rgba(216,191,114,0.35)' : 'rgba(30,40,70,0.6)';
        c.fillRect(x + 8, y, 244, 40);
        this.text(row.name, x + 16, y + 4, sel ? '#ffffff' : '#e0e4ee', { bold: true, size: 14 });
        this.text(row.lvl + ' ур., ' + HO.PATHS[row.path].name + ', ' + this.placeName(row.id), x + 16, y + 22, '#a8b0c8', { size: 11 });
        this.buttons.push({ x: x + 8, y, w: 244, h: 40, fn: () => { this.front.sel = row.id; } });
      });
      const by = 58 + Math.max(1, list.length) * 46 + 6;
      if (list.length < HO.MAX_HEROES) this.button(x + 8, by, 244, 24, 'Создать героя', false, () => this.startCreate());
      else this.text('Больше ' + HO.MAX_HEROES + ' героев не помещается', x + 130, by + 6, '#a8b0c8', { align: 'center', size: 11 });
      if (sh) {
        this.button(w / 2 - 150, h - 78, 300, 42, 'Войти в мир', true, () => this.enterWorld(sh.id));
        this.button(20, h - 50, 150, 24, 'Удалить героя', false, () => { this.front.confirm = { id: sh.id, typed: '' }; });
        this.text(this.placeName(sh.id), 30, 96, '#a8b0c8', { size: 12 });
        this.text(sh.name, 30, 28, '#ffffff', { bold: true, size: 22 });
        this.text(sh.lvl + ' уровень, ' + HO.PATHS[sh.path].name + ', ' + HO.RACES[sh.race].one.toLowerCase(), 30, 58, '#c8d0e0', { size: 13 });
        this.text('Кредиты: ' + sh.credits, 30, 78, '#c8d0e0', { size: 12 });
      }
      this.button(20, 20 + (sh ? 98 : 0), 90, 22, 'Назад', false, () => this.enterFront('login'));
      if (this.front.confirm) {
        const cf = this.front.confirm, row = list.find(r => r.id === cf.id), ok = !!row && cf.typed.toLowerCase() === row.name.toLowerCase();
        this.buttons = [];
        this.panel(w / 2 - 200, h / 2 - 84, 400, 160);
        this.text('Удалить героя ' + (row ? row.name : '') + '?', w / 2, h / 2 - 72, '#ffb0a0', { align: 'center', bold: true, size: 15 });
        this.text('Вернуть его будет нельзя. Наберите его имя, чтобы подтвердить.', w / 2, h / 2 - 48, '#c8d0e0', { align: 'center', size: 12 });
        const c = this.hctx;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(w / 2 - 140, h / 2 - 26, 280, 28);
        c.strokeStyle = ok ? '#ff8070' : '#d8bf72'; c.strokeRect(w / 2 - 139.5, h / 2 - 25.5, 279, 27);
        this.text(cf.typed + (Math.floor(this.time * 2) % 2 ? '|' : ''), w / 2 - 132, h / 2 - 19, '#ffffff', { size: 14 });
        this.button(w / 2 - 180, h / 2 + 18, 170, 28, 'Удалить навсегда', ok, () => { if (ok) this.deleteHero(cf.id); });
        this.button(w / 2 + 10, h / 2 + 18, 170, 28, 'Отмена', !ok, () => { this.front.confirm = null; });
      }
      this.text('Тяните мышью, чтобы повернуть героя', w / 2 - 80, h - 18, '#8890a8', { align: 'center', size: 11 });
    },

    drawCreate() {
      const w = this.hud.width, h = this.hud.height, d = this.front.draft, step = d.step | 0, sw = Math.min(170, (w - 40) / 4 - 6);
      STEPS.forEach((st, i) => {
        const sx = 20 + i * (sw + 6);
        this.button(sx, 14, sw, 26, (i + 1) + '. ' + st.name + (i < step ? ' ✓' : ''), i === step, () => { d.step = i; });
        if (i < STEPS.length - 1) this.text('›', sx + sw + 1, 20, '#d8bf72', { size: 14, bold: true });
      });
      this.panel(14, 50, 320, h - 120);
      this.wrapText(STEPS[step].line, 26, 60, 296, '#a8b0c8', 11);
      let y = 66 + 14 * this.wrapCount(STEPS[step].line, 296, 11) + 8;
      const head = t => { this.text(t, 26, y, '#f0d890', { bold: true, size: 13 }); y += 20; };
      if (step === 0) {
        head('Раса');
        HO.RACE_IDS.forEach((r, i) => this.button(26 + i * 150, y, 146, 24, HO.RACES[r].name, d.race === r, () => this.setDraft('race', r)));
        y += 32;
        RACE_TEXT[d.race].forEach(t => { this.wrapText(t, 26, y, 296, '#c8d0e0', 12); y += 15 * this.wrapCount(t, 296, 12); });
      } else if (step === 1) {
        head('Путь');
        HO.PATH_IDS.forEach((p, i) => this.button(26 + i * 100, y, 96, 24, HO.PATHS[p].name, d.path === p, () => this.setDraft('path', p)));
        y += 32;
        PATH_TEXT[d.path].forEach(t => { this.wrapText(t, 26, y, 296, '#c8d0e0', 12); y += 15 * this.wrapCount(t, 296, 12) + 4; });
      } else if (step === 2) {
      head('Пол');
      Object.keys(HO.SEXES).forEach((s, i) => this.button(26 + i * 150, y, 146, 22, HO.SEXES[s], d.sex === s, () => this.setDraft('sex', s)));
      y += 32;
      head('Облик');
      for (const row of LOOK_ROWS) {
        if (row.fox && d.race !== 'foxian') continue;
        const n = row.count(), v = d.look[row.key] | 0;
        this.text(row.label, 26, y + 4, '#e0e4ee', { size: 12 });
        this.button(150, y, 24, 20, '<', false, () => { d.look[row.key] = (v + n - 1) % n; });
        this.text((v + 1) + ' из ' + n, 214, y + 4, '#ffffff', { align: 'center', size: 12 });
        this.button(254, y, 24, 20, '>', false, () => { d.look[row.key] = (v + 1) % n; });
        if (row.key === 'hairColor' || row.key === 'skin') {
          this.hctx.fillStyle = row.key === 'skin' ? HO.LOOK.skins[v] : HO.LOOK.hairColors[v];
          this.hctx.fillRect(284, y + 2, 16, 16);
        }
        y += 24;
      }
      this.button(26, y, 296, 24, 'Случайный облик', false, () => { d.look = HO.randomLook(rnd, d.race); });
      } else {
      head('Имя');
      const c = this.hctx;
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillRect(26, y, 296, 28);
      c.strokeStyle = '#d8bf72';
      c.strokeRect(26.5, y + 0.5, 295, 27);
      const caret = Math.floor(this.time * 2) % 2 ? '|' : '';
      this.text((d.name || '') + caret, 34, y + 7, '#ffffff', { size: 14 });
      y += 36;
      const err = d.name ? HO.nameError(d.name, this.store.list().map(r => r.name)) : 'Наберите имя на клавиатуре';
      this.text(err || 'Имя подходит', 26, y, err ? '#ff9a8a' : '#a0ffb0', { size: 11 });
      }
      this.text(HO.RACES[d.race].one + ', ' + HO.PATHS[d.path].name + ', ' + HO.SEXES[d.sex].toLowerCase() + (d.name ? ': ' + HO.niceName(d.name) : ''), 26, h - 98, '#f0d890', { size: 12, bold: true });
      const err = d.name ? HO.nameError(d.name, this.store.list().map(r => r.name)) : 'нет имени';
      this.button(26, h - 64, 140, 30, step ? '‹ Назад' : 'К героям', false, () => { if (step) d.step = step - 1; else { this.mode = 'select'; if (!this.store.list().length) this.enterFront('login'); } });
      if (step < STEPS.length - 1) this.button(176, h - 64, 140, 30, 'Далее ›', true, () => { d.step = step + 1; });
      else this.button(176, h - 64, 140, 30, 'Создать героя', !err, () => this.createHero());
      this.text('Тяните мышью, чтобы повернуть героя', w / 2 + 170, h - 24, '#8890a8', { align: 'center', size: 11 });
    },

    placeName(id) {
      const sh = this.store.load(id), at = sh && sh.at, zone = at && HO.ZONES[at.zone] || HO.ZONES[HO.START_ZONE[sh ? sh.race : 'human']];
      const area = at && (zone.areas || []).find(a => at.x > a.x0 && at.x < a.x1 && at.z > a.z0 && at.z < a.z1);
      return area ? area.name : zone.name.replace('Станция «Герта»: ', '');
    },

    wrapCount(t, width, size) {
      this.hctx.font = size + 'px Tahoma, Verdana, sans-serif';
      let lines = 1, line = '';
      for (const word of t.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (this.hctx.measureText(next).width > width && line) { lines++; line = word; } else line = next;
      }
      return lines;
    },

    wrapText(t, x, y, width, col, size) {
      this.hctx.font = size + 'px Tahoma, Verdana, sans-serif';
      let line = '', yy = y;
      for (const word of t.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (this.hctx.measureText(next).width > width && line) { this.text(line, x, yy, col, { size }); yy += 14; line = word; } else line = next;
      }
      if (line) this.text(line, x, yy, col, { size });
    },

    setDraft(key, v) {
      const d = this.front.draft;
      d[key] = v;
      if (key === 'race') d.look = HO.randomLook(rnd, v);
    },

    createHero() {
      const d = this.front.draft, taken = this.store.list().map(r => r.name);
      if (HO.nameError(d.name, taken) || this.store.list().length >= HO.MAX_HEROES) return false;
      const sheet = HO.newSheet({ id: this.store.nextId(), name: HO.niceName(d.name), race: d.race, sex: d.sex, path: d.path, look: d.look, created: Date.now() });
      this.store.save(sheet);
      this.store.setLast(sheet.id);
      this.front.sel = sheet.id;
      this.front.draft = null;
      this.mode = 'select';
      return true;
    },

    deleteHero(id) {
      this.store.remove(id);
      try { this.storage.removeItem(HO.uiKey(id)); } catch (err) { this.error = this.error || null; }
      this.front.confirm = null;
      const list = this.store.list();
      this.front.sel = list.length ? list[0].id : null;
      if (!list.length) this.startCreate();
    },

    frontKey(e) {
      if (this.mode === 'login') {
        if (e.code === 'Enter') { this.enterFront('select'); e.preventDefault(); }
        return;
      }
      if (this.mode === 'select') {
        const list = this.store.list(), i = list.findIndex(r => r.id === this.front.sel);
        if (this.front.confirm) {
          const cf = this.front.confirm, row = list.find(r => r.id === cf.id);
          e.preventDefault();
          if (e.code === 'Escape') this.front.confirm = null;
          else if (e.code === 'Backspace') cf.typed = cf.typed.slice(0, -1);
          else if (e.code === 'Enter' && row && cf.typed.toLowerCase() === row.name.toLowerCase()) this.deleteHero(cf.id);
          else if (e.key && e.key.length === 1 && cf.typed.length < 16) cf.typed += e.key;
          return;
        }
        if (e.code === 'Enter' && this.front.sel) { this.enterWorld(this.front.sel); e.preventDefault(); }
        else if (e.code === 'ArrowDown' && list.length) this.front.sel = list[(i + 1) % list.length].id;
        else if (e.code === 'ArrowUp' && list.length) this.front.sel = list[(i - 1 + list.length) % list.length].id;
        else if (e.code === 'Escape') this.enterFront('login');
        return;
      }
      if (this.mode === 'create') {
        const d = this.front.draft;
        if (e.code === 'Escape') { if (d.step) { d.step--; return; } this.mode = 'select'; if (!this.store.list().length) this.enterFront('login'); return; }
        if (e.code === 'Enter') { e.preventDefault(); if ((d.step | 0) < STEPS.length - 1) d.step = (d.step | 0) + 1; else this.createHero(); return; }
        if ((d.step | 0) !== STEPS.length - 1) return;
        if (e.code === 'Backspace') { d.name = d.name.slice(0, -1); e.preventDefault(); return; }
        if (e.key && e.key.length === 1 && /[A-Za-zА-ЯЁа-яё]/.test(e.key) && d.name.length < 12) { d.name += e.key; e.preventDefault(); }
      }
    }
  });
})(globalThis.HO = globalThis.HO || {});
