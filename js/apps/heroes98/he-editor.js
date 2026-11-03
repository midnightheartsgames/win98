(function (H) {
  'use strict';
  const MD = H.MapData, MF = H.MapFile, D = H.MapDraw, SC = H.Script, T = 32;
  const UNDO_MAX = 30;
  const BRUSHES = [1, 3, 5];
  const START_BUILT = ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'];
  const GROUPS = [
    ['Ресурсы и находки', ['pile', 'chest', 'campfire', 'artifact', 'scroll', 'loot']],
    ['Шахты', ['mine']],
    ['Постройки', ['weekly', 'growth', 'knowledge', 'witchhut', 'arena', 'blessing', 'graveyard', 'weekaltar', 'library', 'lookout', 'observatory', 'cartographer', 'marketplace', 'fair', 'blackmarket', 'inn', 'changeforge', 'ruin', 'menhir', 'lore']],
    ['Святилища', ['shrine']],
    ['Сокровищницы', ['vault']],
    ['Жилища', ['dwelling']],
    ['Проходы и вода', ['portal', 'moongate', 'shipyard', 'boat', 'whirlpool', 'outpost', 'sealer', 'sealgate', 'quest', 'questgate', 'prison']],
    ['Украшения', ['decor']]
  ];
  const HIDDEN_OBJECTS = ['monster', 'town', 'digspot', 'heartstone'];
  const TABS = [['terrain', 'Местность'], ['lines', 'Дороги и реки'], ['objects', 'Объекты'], ['towns', 'Города'], ['heroes', 'Герои'], ['monsters', 'Нейтралы'], ['events', 'События']];
  const INSERTS = [
    ['Сообщение', 'say Текст сообщения'],
    ['Реплика', 'show renier left\nrenier: Текст реплики'],
    ['Выбор', 'choice\n- Первый ответ\n- Второй ответ\nend'],
    ['Дать', 'give gold 1000'],
    ['Забрать', 'take gold 500'],
    ['Поставить отряд', 'spawn monster wolves 10 hostile 10 10'],
    ['Поставить героя', 'spawn hero renier 0 10 10'],
    ['Открыть туман', 'reveal 10 10 8'],
    ['Сменить местность', 'terrain water 10 10 3 3'],
    ['Новая цель', 'goal add g1 Текст цели'],
    ['Флаг', 'set имя'],
    ['Проход', 'gate open метка'],
    ['Луна', 'moon gold'],
    ['Победа', 'win'],
    ['Поражение', 'lose']
  ];
  const WIN_KINDS = [['defeat', 'Разбить всех врагов'], ['town', 'Взять город'], ['gold', 'Накопить золото'], ['hero', 'Победить героя'], ['heart', 'Поднять Сердце'], ['flag', 'Поставить флаг']];
  const LOSE_KINDS = [['all', 'Потерять всё'], ['town', 'Потерять город'], ['hero', 'Потерять героя'], ['day', 'Срок в днях'], ['flag', 'Поставить флаг']];
  const WHO = [['both', 'Человек или ИИ'], ['human', 'Только человек'], ['ai', 'Только ИИ']];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const numberIn = (value, fn, min) => {
    const n = el('input', 'he-ed-in');
    n.type = 'number';
    n.value = value == null ? '' : value;
    if (min != null) n.min = min;
    n.addEventListener('change', () => fn(+n.value || 0));
    return n;
  };
  const textIn = (value, fn) => {
    const n = el('input', 'he-ed-in');
    n.value = value || '';
    n.addEventListener('change', () => fn(n.value));
    return n;
  };
  const areaIn = (value, fn, rows) => {
    const n = el('textarea', 'he-ed-in');
    n.value = value || '';
    n.rows = rows || 3;
    n.addEventListener('change', () => fn(n.value));
    return n;
  };
  const selectIn = (options, value, fn) => {
    const n = el('select', 'he-ed-in');
    for (const [v, label] of options) {
      const o = el('option', '', label);
      o.value = v;
      n.appendChild(o);
    }
    n.value = value == null ? '' : value;
    n.addEventListener('change', () => fn(n.value));
    return n;
  };
  const checkIn = (label, on, fn) => {
    const row = el('label', 'he-ed-check'), n = el('input');
    n.type = 'checkbox';
    n.checked = !!on;
    n.addEventListener('change', () => fn(n.checked));
    row.appendChild(n);
    row.appendChild(document.createTextNode(label));
    return row;
  };
  const button = (label, fn, cls) => {
    const n = el('button', 'he-ed-btn' + (cls ? ' ' + cls : ''), label);
    n.type = 'button';
    n.addEventListener('click', fn);
    return n;
  };
  const row = (label, node) => {
    const n = el('div', 'he-ed-row');
    n.appendChild(el('span', 'he-ed-label', label));
    n.appendChild(node);
    return n;
  };
  const group = (title, open) => {
    const n = el('details', 'he-ed-group');
    n.open = !!open;
    n.appendChild(el('summary', '', title));
    return n;
  };

  const unitOptions = () => [['', '(пусто)'], ...Object.values(H.UNITS).filter(u => u.faction !== 'summon' && u.faction !== 'machine').map(u => [u.id, u.name])];
  const artOptions = () => Object.values(H.ARTIFACTS).filter(a => a.slot !== 'scroll').map(a => [a.id, a.name]);
  const spellOptions = circle => Object.values(H.SPELLS).filter(s => !circle || s.circle === circle).map(s => [s.id, s.name]);
  const heroRec = hid => H.HEROES.find(x => x.id === hid) || null;

  class Editor {
    constructor(root, ui) {
      this.root = root;
      this.ui = ui;
      this.visible = false;
      this.doc = MF.blank({ w: 48 });
      this.fileId = null;
      this.dirty = false;
      this.level = 0;
      this.tab = 'terrain';
      this.tool = { kind: 'select' };
      this.brush = 3;
      this.fillMode = false;
      this.sel = null;
      this.hover = null;
      this.undo = [];
      this.redo = [];
      this.issues = [];
      this.cache = new Map();
      this.search = '';
      this.showGrid = false;
      this.placeCount = 10;
      this.placeMood = 'hostile';
      this.placeOwner = 0;
      this.dialogs = [];
      this.build();
      this.renderPalette();
      this.renderProps();
      this.fit();
      this.observer = new ResizeObserver(() => this.fit());
      this.observer.observe(this.node);
    }

    build() {
      const n = this.node = el('div', 'he-ed');
      n.style.display = 'none';
      this.menuBar = el('div', 'he-ed-menu');
      n.appendChild(this.menuBar);
      this.buildMenu();
      this.palette = el('div', 'he-ed-left');
      n.appendChild(this.palette);
      this.viewBox = el('div', 'he-ed-view');
      this.canvas = el('canvas', 'he-ed-canvas');
      this.scroller = el('div', 'he-ed-scroll');
      this.sizer = el('div', 'he-ed-sizer');
      this.scroller.appendChild(this.sizer);
      this.viewBox.appendChild(this.canvas);
      this.viewBox.appendChild(this.scroller);
      n.appendChild(this.viewBox);
      this.props = el('div', 'he-ed-right');
      n.appendChild(this.props);
      const bottom = el('div', 'he-ed-bottom');
      this.mini = el('canvas', 'he-ed-mini');
      this.mini.width = 128;
      this.mini.height = 128;
      bottom.appendChild(this.mini);
      const box = el('div', 'he-ed-issues-box');
      this.statusLine = el('div', 'he-ed-status', 'Готово');
      this.issueList = el('div', 'he-ed-issues');
      box.appendChild(this.statusLine);
      box.appendChild(this.issueList);
      bottom.appendChild(box);
      n.appendChild(bottom);
      this.fileInput = el('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = '.h98m';
      this.fileInput.style.display = 'none';
      this.fileInput.addEventListener('change', () => this.importFile());
      n.appendChild(this.fileInput);
      this.root.appendChild(n);
      this.ctx = this.canvas.getContext('2d');
      this.scroller.addEventListener('scroll', () => this.kick());
      for (const t of ['pointerdown', 'pointermove', 'pointerup']) this.scroller.addEventListener(t, e => this.pointer(t, e));
      this.scroller.addEventListener('pointerleave', () => {
        this.hover = null;
        this.kick();
      });
      this.scroller.addEventListener('contextmenu', e => e.preventDefault());
      this.mini.addEventListener('pointerdown', e => this.miniPick(e));
      this.closeMenus = () => this.menuBar.querySelectorAll('.he-ed-drop').forEach(d => { d.style.display = 'none'; });
      n.addEventListener('pointerdown', e => {
        if (!this.menuBar.contains(e.target)) this.closeMenus();
      });
      this.applySize();
    }

    buildMenu() {
      const bar = this.menuBar;
      const drop = (label, items) => {
        const wrap = el('div', 'he-ed-menuitem'), list = el('div', 'he-ed-drop');
        list.style.display = 'none';
        const top = button(label, () => {
          const open = list.style.display === 'none';
          this.closeMenus();
          list.style.display = open ? 'block' : 'none';
        }, 'he-ed-top');
        for (const [name, act] of items) {
          list.appendChild(button(name, () => {
            this.closeMenus();
            act();
          }, 'he-ed-pick'));
        }
        wrap.appendChild(top);
        wrap.appendChild(list);
        bar.appendChild(wrap);
      };
      drop('Файл', [['Новая...', () => this.askNew()], ['Открыть...', () => this.askOpen()], ['Сохранить', () => this.save()], ['Импорт...', () => this.fileInput.click()], ['Экспорт', () => this.exportFile()], ['Выход', () => this.leave()]]);
      drop('Правка', [['Отменить (Ctrl+Z)', () => this.stepBack()], ['Вернуть (Ctrl+Y)', () => this.stepForward()], ['Удалить выбранное (Del)', () => this.removeSelected()], ['Показать сетку (G)', () => this.toggleGrid()]]);
      drop('Карта', [['Свойства...', () => this.askProps()], ['Игроки...', () => this.askPlayers()], ['Условия...', () => this.askGoals()], ['Сцены...', () => this.askScenes()]]);
      bar.appendChild(button('Проверить', () => this.runCheck(true), 'he-ed-top'));
      bar.appendChild(button('Играть', () => this.play(), 'he-ed-top'));
      this.levelButton = button('Поверхность', () => this.switchLevel(), 'he-ed-top he-ed-level');
      bar.appendChild(this.levelButton);
      this.titleLine = el('span', 'he-ed-mapname');
      bar.appendChild(this.titleLine);
    }

    open() {
      this.visible = true;
      this.node.style.display = '';
      this.fit();
      this.refreshAll();
    }

    close() {
      this.visible = false;
      this.node.style.display = 'none';
    }

    destroy() {
      this.observer.disconnect();
      cancelAnimationFrame(this.raf);
      this.node.remove();
      this.visible = false;
    }

    leave() {
      this.confirmLoss('Выйти из редактора', () => {
        if (this.ui.opts.editor) {
          this.ui.closeEditor();
          return;
        }
        this.close();
      });
    }

    confirmLoss(title, go) {
      if (!this.dirty) {
        go();
        return;
      }
      this.dialog(title, body => body.appendChild(el('div', 'he-ed-text', 'Карта не сохранена. Изменения пропадут. Продолжить?')), [['Продолжить', go], ['Отмена', null]]);
    }

    dialog(title, fill, buttons) {
      const veil = el('div', 'he-ed-veil'), box = el('div', 'he-ed-dlg'), head = el('div', 'he-ed-dlg-title', title), body = el('div', 'he-ed-dlg-body'), foot = el('div', 'he-ed-dlg-foot');
      const shut = () => {
        veil.remove();
        this.dialogs = this.dialogs.filter(x => x !== shut);
      };
      fill(body, shut);
      for (const [label, act] of buttons || [['Закрыть', null]]) {
        foot.appendChild(button(label, () => {
          shut();
          if (act) act();
        }));
      }
      box.appendChild(head);
      box.appendChild(body);
      box.appendChild(foot);
      veil.appendChild(box);
      this.node.appendChild(veil);
      this.dialogs.push(shut);
      return shut;
    }

    setDoc(doc, fileId) {
      this.doc = doc;
      this.fileId = fileId || null;
      this.dirty = false;
      this.level = 0;
      this.sel = null;
      this.undo = [];
      this.redo = [];
      this.issues = [];
      this.tool = { kind: 'select' };
      this.lastCell = null;
      this.status('Готово');
      this.cache.clear();
      this.applySize();
      this.refreshAll();
    }

    applySize() {
      const M = this.doc.map;
      this.sizer.style.width = M.w * T + 'px';
      this.sizer.style.height = M.h * T + 'px';
    }

    fit() {
      const r = this.viewBox.getBoundingClientRect();
      const w = Math.max(1, Math.floor(this.scroller.clientWidth || r.width)), h = Math.max(1, Math.floor(this.scroller.clientHeight || r.height));
      if (this.canvas.width !== w) this.canvas.width = w;
      if (this.canvas.height !== h) this.canvas.height = h;
      this.ctx.imageSmoothingEnabled = false;
      this.kick();
    }

    refreshAll() {
      this.miniDirty = true;
      this.levelButton.textContent = this.doc.map.levels < 2 ? 'Один уровень' : this.level ? 'Подлунье' : 'Поверхность';
      this.titleLine.textContent = this.doc.name + (this.dirty ? ' *' : '') + ' · ' + this.doc.map.w + '×' + this.doc.map.h;
      this.renderPalette();
      this.renderProps();
      this.renderIssues();
      this.kick();
    }

    push() {
      this.undo.push(MF.write(this.doc));
      if (this.undo.length > UNDO_MAX) this.undo.shift();
      this.redo = [];
      this.dirty = true;
      this.titleLine.textContent = this.doc.name + ' * · ' + this.doc.map.w + '×' + this.doc.map.h;
    }

    edit(fn, rebuild) {
      this.push();
      fn();
      this.miniDirty = true;
      if (rebuild) this.renderProps();
      this.kick();
    }

    restore(text) {
      const doc = MF.read(text);
      this.doc = doc;
      this.sel = null;
      this.cache.clear();
      this.applySize();
      this.refreshAll();
    }

    stepBack() {
      if (!this.undo.length) return;
      this.redo.push(MF.write(this.doc));
      this.restore(this.undo.pop());
      this.dirty = true;
    }

    stepForward() {
      if (!this.redo.length) return;
      this.undo.push(MF.write(this.doc));
      this.restore(this.redo.pop());
      this.dirty = true;
    }

    status(text) {
      this.statusLine.textContent = text;
    }

    key(e) {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.dialogs.length) this.dialogs[this.dialogs.length - 1]();
        else this.setTool({ kind: 'select' });
        return;
      }
      if (this.dialogs.length) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        this.stepBack();
      } else if (e.ctrlKey && e.code === 'KeyY') {
        e.preventDefault();
        this.stepForward();
      } else if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        this.save();
      } else if (e.code === 'Delete') this.removeSelected();
      else if (e.code === 'KeyG' && !e.ctrlKey) this.toggleGrid();
      else if (e.code === 'KeyU' && !e.ctrlKey) this.switchLevel();
      else if (e.code === 'ArrowLeft') this.scroller.scrollLeft -= T;
      else if (e.code === 'ArrowRight') this.scroller.scrollLeft += T;
      else if (e.code === 'ArrowUp') this.scroller.scrollTop -= T;
      else if (e.code === 'ArrowDown') this.scroller.scrollTop += T;
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      this.kick();
    }

    switchLevel() {
      if (this.doc.map.levels < 2) return;
      this.level = (this.level + 1) % this.doc.map.levels;
      this.miniDirty = true;
      this.levelButton.textContent = this.level ? 'Подлунье' : 'Поверхность';
      this.kick();
    }

    setTool(tool) {
      this.tool = tool;
      this.line = null;
      this.scroller.style.cursor = tool.kind === 'select' ? 'default' : 'crosshair';
      this.renderPalette();
      this.kick();
    }

    cellOf(e) {
      const r = this.scroller.getBoundingClientRect(), M = this.doc.map;
      const c = Math.floor((e.clientX - r.left + this.scroller.scrollLeft) / T), row0 = Math.floor((e.clientY - r.top + this.scroller.scrollTop) / T);
      return MD.inside(M, c, row0) ? [c, row0] : null;
    }

    touch(c0, r0, c1, r1) {
      const k = D.CH;
      for (let y = Math.floor((r0 - 1) / k); y <= Math.floor((r1 + 1) / k); y++) for (let x = Math.floor((c0 - 1) / k); x <= Math.floor((c1 + 1) / k); x++) this.cache.delete(this.level + ':' + x + ':' + y);
      this.miniDirty = true;
    }

    paintAt(cell) {
      const [c, r] = cell, half = this.brush >> 1, tool = this.tool, M = this.doc.map;
      if (tool.kind === 'terrain') MF.brush(M, this.level, tool.id, c, r, this.brush);
      else MF.brushField(M, this.level, tool.id, c, r, this.brush);
      this.touch(c - half, r - half, c + half, r + half);
    }

    pointer(type, e) {
      const cell = this.cellOf(e);
      if (type === 'pointermove') {
        const same = cell && this.hover && cell[0] === this.hover[0] && cell[1] === this.hover[1];
        this.hover = cell;
        if (same) return;
        if (cell && this.painting) this.paintAt(cell);
        if (cell && this.dragging) this.dragging.to = cell;
        if (cell && this.line) this.line.to = cell;
        this.kick();
        return;
      }
      if (type === 'pointerup') {
        this.painting = false;
        if (this.line) this.finishLine();
        if (this.dragging) this.finishDrag();
        this.kick();
        return;
      }
      if (!cell) return;
      if (e.button === 2) {
        this.setTool({ kind: 'select' });
        return;
      }
      if (e.button !== 0) return;
      try {
        this.scroller.setPointerCapture(e.pointerId);
      } catch (err) {
        this.status('Мышь захватить не удалось');
      }
      this.lastCell = cell;
      this.press(cell);
    }

    press(cell) {
      const tool = this.tool, M = this.doc.map, [c, r] = cell;
      if (tool.kind === 'terrain' || tool.kind === 'field') {
        this.push();
        if (this.fillMode && tool.kind === 'terrain') {
          MF.fill(M, this.level, tool.id, c, r);
          this.cache.clear();
          this.miniDirty = true;
        } else {
          this.painting = true;
          this.paintAt(cell);
        }
      } else if (tool.kind === 'road' || tool.kind === 'river') this.line = { from: cell, to: cell };
      else if (tool.kind === 'object') this.placeObject(tool.t, c, r, {});
      else if (tool.kind === 'town') this.placeObject('town', c, r, { faction: tool.faction, name: 'Новый город', built: START_BUILT.slice(), garrison: [] });
      else if (tool.kind === 'monster') this.placeObject('monster', c, r, { unit: tool.unit, count: this.placeCount, max: this.placeCount * 3, mood: this.placeMood });
      else if (tool.kind === 'hero') this.placeHero(tool.hid, c, r);
      else if (tool.kind === 'heart') {
        this.edit(() => {
          M.heart = { l: this.level, c, r };
        });
        this.status('Сердце Восьмой луны спрятано здесь: ' + c + ', ' + r);
      } else this.pick(cell);
      this.kick();
    }

    defaultsFor(t) {
      const def = H.OBJ[t], x = {};
      if (def.kind === 'artifact') x.art = artOptions()[0][0];
      if (def.kind === 'scroll') x.spell = spellOptions()[0][0];
      if (def.kind === 'shrine') x.spell = spellOptions(def.circle)[0][0];
      if (def.kind === 'sealer' || def.kind === 'sealgate') x.color = 0;
      if (def.kind === 'moongate') x.moon = 'gold';
      if (def.kind === 'quest' || def.kind === 'questgate') x.quest = { kind: 'res', res: { gold: 1000 } };
      if (def.kind === 'quest') x.reward = { gold: 1000 };
      if (def.kind === 'lore') x.text = '';
      if (def.kind === 'vault') x.tier = 0;
      if (def.kind === 'prison') x.hid = null;
      if (def.held && t !== 'town') x.garrison = [];
      return x;
    }

    placeObject(t, c, r, extra) {
      const why = MF.whyNot(this.doc, t, c, r, this.level, null);
      if (why) {
        this.status(why);
        return;
      }
      this.push();
      const made = MF.place(this.doc, t, c, r, this.level, Object.assign(this.defaultsFor(t), extra));
      this.sel = { obj: made.obj };
      this.miniDirty = true;
      this.status('Поставлено: ' + MF.objName(made.obj));
      this.renderProps();
    }

    placeHero(hid, c, r) {
      const M = this.doc.map, why = MF.whyNot(this.doc, 'rock', c, r, this.level, null);
      if (why || !MD.groundCost(M, this.level, c, r)) {
        this.status(why || 'Герой не может здесь стоять');
        return;
      }
      this.push();
      const h = { owner: this.placeOwner, hid, c, r, l: this.level, army: [], arts: [], skills: null, xp: 0, patrol: 0, tag: '' };
      this.doc.heroes.push(h);
      this.sel = { hero: h };
      this.miniDirty = true;
      this.renderProps();
    }

    pick(cell) {
      const [c, r] = cell, M = this.doc.map;
      const h = this.doc.heroes.find(x => (x.l || 0) === this.level && x.c === c && x.r === r);
      const o = [...M.objs].reverse().find(x => x.l === this.level && MD.cells(x).some(([a, b]) => a === c && b === r));
      this.sel = h ? { hero: h } : o ? { obj: o } : null;
      if (this.sel) this.dragging = { from: cell, to: cell };
      this.renderProps();
    }

    finishDrag() {
      const d = this.dragging, s = this.sel;
      this.dragging = null;
      if (!s || (d.from[0] === d.to[0] && d.from[1] === d.to[1])) return;
      const dx = d.to[0] - d.from[0], dy = d.to[1] - d.from[1], item = s.obj || s.hero;
      const nc = item.c + dx, nr = item.r + dy, type = s.obj ? s.obj.t : 'rock', why = MF.whyNot(this.doc, type, nc, nr, this.level, item);
      if (why) {
        this.status(why);
        return;
      }
      if (s.hero && !MD.groundCost(this.doc.map, this.level, nc, nr)) {
        this.status('Герой не может здесь стоять');
        return;
      }
      this.edit(() => {
        item.c = nc;
        item.r = nr;
      }, true);
    }

    finishLine() {
      const { from, to } = this.line, tool = this.tool, M = this.doc.map;
      this.line = null;
      this.push();
      if (tool.kind === 'road') MD.road(M, this.level, tool.v, [from, to]);
      else MF.river(M, this.level, tool.v, [from, to]);
      this.touch(Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.max(from[0], to[0]), Math.max(from[1], to[1]));
    }

    removeSelected() {
      const s = this.sel;
      if (!s) return;
      this.edit(() => {
        if (s.obj) MF.removeObj(this.doc, s.obj);
        else this.doc.heroes = this.doc.heroes.filter(h => h !== s.hero);
        this.sel = null;
      }, true);
    }

    kick() {
      if (this.frameAsked || !this.visible) return;
      this.frameAsked = true;
      this.raf = requestAnimationFrame(() => {
        this.frameAsked = false;
        this.draw();
      });
    }

    ownerColor(owner) {
      return owner >= 0 ? H.PLAYER_COLORS[owner] : null;
    }

    fakeHero(h) {
      const rec = heroRec(h.hid), cls = rec ? rec.cls : Object.keys(H.CLASSES)[0];
      return { hid: h.hid, cls, faction: H.CLASSES[cls].faction, dir: 1, boat: null, heart: false, army: [], c: h.c, r: h.r };
    }

    draw() {
      const g = this.ctx, M = this.doc.map, l = this.level, view = { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
      const cam = { x: this.scroller.scrollLeft, y: this.scroller.scrollTop };
      g.fillStyle = '#000';
      g.fillRect(0, 0, view.w, view.h);
      D.terrain(g, this.cache, M, l, cam, view);
      const items = [];
      for (const o of M.objs) {
        if (o.l !== l) continue;
        const def = H.OBJ[o.t];
        if (!def) continue;
        items.push({ y: (o.r + def.foot[1]) * T, draw: () => D.object(g, o, o.c * T - cam.x, o.r * T - cam.y, 0, this.ownerColor(o.owner)) });
      }
      for (const h of this.doc.heroes) {
        if ((h.l || 0) === l) items.push({ y: (h.r + 1) * T + 0.5, draw: () => D.hero(g, this.fakeHero(h), h.c * T - cam.x, h.r * T - cam.y, H.PLAYER_COLORS[h.owner] || H.PLAYER_COLORS[0], 0) });
      }
      items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
      if (M.heart && M.heart.l === l) {
        g.strokeStyle = '#ffe060';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(M.heart.c * T + 16 - cam.x, M.heart.r * T + 16 - cam.y, 12, 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 1;
      }
      if (this.showGrid) {
        g.strokeStyle = 'rgba(255,255,255,0.16)';
        g.beginPath();
        for (let c = Math.ceil(cam.x / T); c * T - cam.x < view.w && c <= M.w; c++) {
          g.moveTo(c * T - cam.x + 0.5, 0);
          g.lineTo(c * T - cam.x + 0.5, view.h);
        }
        for (let r = Math.ceil(cam.y / T); r * T - cam.y < view.h && r <= M.h; r++) {
          g.moveTo(0, r * T - cam.y + 0.5);
          g.lineTo(view.w, r * T - cam.y + 0.5);
        }
        g.stroke();
      }
      this.drawMarks(g, cam);
      this.drawGhost(g, cam);
      if (this.miniDirty) this.paintMini();
      this.drawMini();
    }

    drawMarks(g, cam) {
      const s = this.sel;
      if (!s) return;
      if (s.hero) {
        if ((s.hero.l || 0) !== this.level) return;
        g.strokeStyle = '#ffffff';
        g.strokeRect(s.hero.c * T - cam.x + 0.5, s.hero.r * T - cam.y + 0.5, T - 1, T - 1);
        return;
      }
      const o = s.obj, def = H.OBJ[o.t];
      if (o.l !== this.level) return;
      g.strokeStyle = '#ffffff';
      g.strokeRect(o.c * T - cam.x + 0.5, o.r * T - cam.y + 0.5, def.foot[0] * T - 1, def.foot[1] * T - 1);
      const e = MD.entry(o);
      if (e) {
        g.fillStyle = 'rgba(255,224,96,0.5)';
        g.fillRect(e[0] * T - cam.x + 8, e[1] * T - cam.y + 8, 16, 16);
      }
    }

    drawGhost(g, cam) {
      const tool = this.tool, cell = this.hover;
      if (this.line) {
        g.fillStyle = 'rgba(255,255,255,0.45)';
        MD.line([this.line.from, this.line.to], (c, r) => g.fillRect(c * T - cam.x + 8, r * T - cam.y + 8, 16, 16));
        return;
      }
      if (!cell) return;
      const [c, r] = cell;
      if (tool.kind === 'terrain' || tool.kind === 'field') {
        const half = (this.fillMode && tool.kind === 'terrain' ? 0 : this.brush >> 1);
        g.strokeStyle = '#ffffff';
        g.strokeRect((c - half) * T - cam.x + 0.5, (r - half) * T - cam.y + 0.5, (half * 2 + 1) * T - 1, (half * 2 + 1) * T - 1);
        return;
      }
      const t = tool.kind === 'object' ? tool.t : tool.kind === 'town' ? 'town' : tool.kind === 'monster' ? 'monster' : tool.kind === 'hero' ? 'rock' : null;
      if (!t) {
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.strokeRect(c * T - cam.x + 0.5, r * T - cam.y + 0.5, T - 1, T - 1);
        return;
      }
      const bad = MF.whyNot(this.doc, t, c, r, this.level, null), foot = H.OBJ[t].foot;
      g.fillStyle = bad ? 'rgba(220,40,20,0.4)' : 'rgba(60,220,80,0.35)';
      g.fillRect(c * T - cam.x, r * T - cam.y, foot[0] * T, foot[1] * T);
      const e = H.OBJ[t].entry;
      if (e) {
        g.fillStyle = 'rgba(255,224,96,0.7)';
        g.fillRect((c + e[0]) * T - cam.x + 8, (r + e[1]) * T - cam.y + 8, 16, 16);
      }
    }

    fakeState() {
      const M = this.doc.map;
      if (!this.allSeen || this.allSeen.length !== M.levels || this.allSeen[0].length !== M.w * M.h) this.allSeen = Array.from({ length: M.levels }, () => new Array(M.w * M.h).fill(1));
      const seen = this.allSeen;
      return { map: M, players: H.PLAYER_COLORS.map((_, i) => ({ color: i, seen })), heroes: this.doc.heroes.map(h => ({ alive: true, l: h.l || 0, c: h.c, r: h.r, owner: h.owner })), caravans: [] };
    }

    paintMini() {
      const M = this.doc.map;
      this.miniDirty = false;
      this.miniMap = D.minimap(this.fakeState(), this.level, 0, new Uint8Array(M.w * M.h).fill(1));
    }

    drawMini() {
      const g = this.mini.getContext('2d'), M = this.doc.map, k = Math.min(128 / M.w, 128 / M.h), ox = (128 - M.w * k) / 2, oy = (128 - M.h * k) / 2;
      g.imageSmoothingEnabled = false;
      g.fillStyle = '#000';
      g.fillRect(0, 0, 128, 128);
      g.drawImage(this.miniMap, ox, oy, M.w * k, M.h * k);
      g.strokeStyle = '#fff';
      g.strokeRect(ox + this.scroller.scrollLeft / T * k + 0.5, oy + this.scroller.scrollTop / T * k + 0.5, this.canvas.width / T * k, this.canvas.height / T * k);
    }

    miniPick(e) {
      const r = this.mini.getBoundingClientRect(), M = this.doc.map, k = Math.min(128 / M.w, 128 / M.h), ox = (128 - M.w * k) / 2, oy = (128 - M.h * k) / 2;
      const x = (e.clientX - r.left) * 128 / r.width, y = (e.clientY - r.top) * 128 / r.height;
      this.goTo((x - ox) / k, (y - oy) / k);
    }

    goTo(c, r, l) {
      if (l != null && l !== this.level && l < this.doc.map.levels) {
        this.level = l;
        this.miniDirty = true;
        this.levelButton.textContent = l ? 'Подлунье' : 'Поверхность';
      }
      this.scroller.scrollLeft = c * T - this.canvas.width / 2;
      this.scroller.scrollTop = r * T - this.canvas.height / 2;
      this.kick();
    }

    renderPalette() {
      const box = this.palette, tabs = el('div', 'he-ed-tabs');
      box.textContent = '';
      for (const [id, label] of TABS) {
        tabs.appendChild(button(label, () => {
          this.tab = id;
          this.search = '';
          this.renderPalette();
        }, 'he-ed-tab' + (this.tab === id ? ' he-ed-on' : '')));
      }
      box.appendChild(tabs);
      const inner = el('div', 'he-ed-list');
      box.appendChild(inner);
      this['tab_' + this.tab](inner);
    }

    choice(list, label, on, act, color) {
      const n = button(label, act, 'he-ed-item' + (on ? ' he-ed-on' : ''));
      if (color) {
        const dot = el('span', 'he-ed-dot');
        dot.style.background = color;
        n.prepend(dot);
      }
      list.appendChild(n);
      return n;
    }

    tab_terrain(box) {
      const size = el('div', 'he-ed-bar');
      size.appendChild(el('span', 'he-ed-label', 'Кисть'));
      for (const b of BRUSHES) size.appendChild(button(b + '×' + b, () => { this.brush = b; this.fillMode = false; this.renderPalette(); }, this.brush === b && !this.fillMode ? 'he-ed-on' : ''));
      size.appendChild(button('Заливка', () => { this.fillMode = true; this.renderPalette(); }, this.fillMode ? 'he-ed-on' : ''));
      box.appendChild(size);
      for (const t of H.TERRAIN) this.choice(box, t.name, this.tool.kind === 'terrain' && this.tool.id === t.id, () => this.setTool({ kind: 'terrain', id: t.id }), D.COLORS[t.id][0]);
      box.appendChild(el('div', 'he-ed-head', 'Особые места'));
      this.choice(box, 'Убрать особое место', this.tool.kind === 'field' && !this.tool.id, () => this.setTool({ kind: 'field', id: '' }));
      for (const f of H.FIELDS.filter(Boolean)) this.choice(box, f.name, this.tool.kind === 'field' && this.tool.id === f.id, () => this.setTool({ kind: 'field', id: f.id }), f.color);
    }

    tab_lines(box) {
      box.appendChild(el('div', 'he-ed-text', 'Нажмите в начале линии и отпустите в конце.'));
      box.appendChild(el('div', 'he-ed-head', 'Дороги'));
      H.ROADS.forEach((r, v) => { if (r) this.choice(box, r.name, this.tool.kind === 'road' && this.tool.v === v, () => this.setTool({ kind: 'road', v })); });
      this.choice(box, 'Стереть дорогу', this.tool.kind === 'road' && this.tool.v === 0, () => this.setTool({ kind: 'road', v: 0 }));
      box.appendChild(el('div', 'he-ed-head', 'Реки'));
      H.RIVERS.forEach((r, v) => { if (r) this.choice(box, r.name, this.tool.kind === 'river' && this.tool.v === v, () => this.setTool({ kind: 'river', v })); });
      this.choice(box, 'Стереть реку', this.tool.kind === 'river' && this.tool.v === 0, () => this.setTool({ kind: 'river', v: 0 }));
    }

    searchBox(box, redraw) {
      const n = el('input', 'he-ed-in he-ed-search');
      n.placeholder = 'Поиск';
      n.value = this.search;
      n.addEventListener('input', () => {
        this.search = n.value;
        redraw();
      });
      box.appendChild(n);
    }

    tab_objects(box) {
      const list = el('div');
      const fill = () => {
        list.textContent = '';
        const q = this.search.trim().toLowerCase(), used = new Set();
        const rows = Object.entries(H.OBJ).filter(([id, def]) => !HIDDEN_OBJECTS.includes(def.kind) && !HIDDEN_OBJECTS.includes(id) && (!q || def.name.toLowerCase().includes(q)));
        for (const [title, kinds] of GROUPS) {
          const here = rows.filter(([, def]) => kinds.includes(def.kind));
          if (!here.length) continue;
          const g = group(title + ' (' + here.length + ')', !!q || (this.tool.kind === 'object' && kinds.includes(H.OBJ[this.tool.t].kind)));
          for (const [id, def] of here) {
            used.add(id);
            this.choice(g, def.name, this.tool.kind === 'object' && this.tool.t === id, () => this.setTool({ kind: 'object', t: id }));
          }
          list.appendChild(g);
        }
        const rest = rows.filter(([id]) => !used.has(id));
        if (rest.length) {
          const g = group('Прочее', !!q);
          for (const [id, def] of rest) this.choice(g, def.name, this.tool.kind === 'object' && this.tool.t === id, () => this.setTool({ kind: 'object', t: id }));
          list.appendChild(g);
        }
      };
      this.searchBox(box, fill);
      this.choice(box, 'Спрятать Сердце Восьмой луны', this.tool.kind === 'heart', () => this.setTool({ kind: 'heart' }), '#ffe060');
      fill();
      box.appendChild(list);
    }

    tab_towns(box) {
      box.appendChild(el('div', 'he-ed-text', 'Выберите народ и щёлкните по карте. Свойства города появятся справа.'));
      for (const [id, f] of Object.entries(H.FACTIONS)) this.choice(box, f.full || f.name, this.tool.kind === 'town' && this.tool.faction === id, () => this.setTool({ kind: 'town', faction: id }));
    }

    tab_heroes(box) {
      box.appendChild(row('Игрок', selectIn(this.doc.players.map((p, i) => [i, H.PLAYER_NAMES[i]]), this.placeOwner, v => { this.placeOwner = +v; })));
      this.choice(box, 'Случайный герой', this.tool.kind === 'hero' && !this.tool.hid, () => this.setTool({ kind: 'hero', hid: null }));
      const list = el('div');
      const fill = () => {
        list.textContent = '';
        const q = this.search.trim().toLowerCase();
        for (const rec of H.HEROES.filter(x => !q || x.name.toLowerCase().includes(q))) this.choice(list, rec.name, this.tool.kind === 'hero' && this.tool.hid === rec.id, () => this.setTool({ kind: 'hero', hid: rec.id }));
      };
      this.searchBox(box, fill);
      fill();
      box.appendChild(list);
    }

    tab_monsters(box) {
      box.appendChild(row('Число', numberIn(this.placeCount, v => { this.placeCount = Math.max(1, v); }, 1)));
      box.appendChild(row('Нрав', selectIn(Object.entries(H.MAP.mood), this.placeMood, v => { this.placeMood = v; })));
      const list = el('div');
      const fill = () => {
        list.textContent = '';
        const q = this.search.trim().toLowerCase();
        const units = Object.values(H.UNITS).filter(u => u.faction !== 'summon' && u.faction !== 'machine' && (!q || u.name.toLowerCase().includes(q)));
        units.sort((a, b) => (a.faction === 'neutral' ? 0 : 1) - (b.faction === 'neutral' ? 0 : 1) || a.tier - b.tier);
        for (const u of units) this.choice(list, u.name + ' (ур. ' + u.tier + ')', this.tool.kind === 'monster' && this.tool.unit === u.id, () => this.setTool({ kind: 'monster', unit: u.id }));
      };
      this.searchBox(box, fill);
      fill();
      box.appendChild(list);
    }

    tab_events(box) {
      box.appendChild(button('Новое событие...', () => this.askEvent(null, {})));
      box.appendChild(button('Все сцены текстом...', () => this.askScenes()));
      if (!this.doc.events.length) box.appendChild(el('div', 'he-ed-text', 'Событий пока нет. Выберите объект на карте и нажмите «Событие», чтобы связать его со сценой.'));
      this.doc.events.forEach(e => {
        this.choice(box, SC.eventText(e), false, () => this.askEvent(e, {}));
      });
    }

    renderProps() {
      const box = this.props, s = this.sel;
      box.textContent = '';
      if (!s) this.propsMap(box);
      else if (s.hero) this.propsHero(box, s.hero);
      else this.propsObject(box, s.obj);
    }

    propsMap(box) {
      box.appendChild(el('div', 'he-ed-head', 'Ничего не выбрано'));
      box.appendChild(el('div', 'he-ed-text', 'Щёлкните объект, чтобы увидеть свойства, и тащите мышью, чтобы передвинуть. Правая кнопка снимает инструмент.'));
      if (this.lastCell) {
        box.appendChild(el('div', 'he-ed-head', 'Клетка ' + this.lastCell[0] + ', ' + this.lastCell[1]));
        box.appendChild(button('Событие на этой клетке...', () => this.askEvent(null, { on: 'cell', c: this.lastCell[0], r: this.lastCell[1], l: this.level })));
      }
    }

    tagRow(box, item) {
      box.appendChild(row('Метка', textIn(item.tag, v => this.edit(() => {
        const clean = v.trim().replace(/\s+/g, '_');
        if (clean) item.tag = clean;
        else delete item.tag;
      }, true))));
    }

    armyRows(box, title, list, set) {
      const g = group(title, true);
      for (let i = 0; i < 7; i++) {
        const s = list[i] || null, line = el('div', 'he-ed-stack');
        line.appendChild(selectIn(unitOptions(), s ? s.unit : '', v => this.edit(() => {
          const next = list.slice();
          next[i] = v ? { unit: v, count: s ? s.count : 10 } : null;
          set(next);
        }, true)));
        line.appendChild(numberIn(s ? s.count : '', v => this.edit(() => {
          const next = list.slice();
          if (s) next[i] = { unit: s.unit, count: Math.max(1, v) };
          set(next);
        }, true), 1));
        g.appendChild(line);
      }
      box.appendChild(g);
    }

    propsHero(box, h) {
      box.appendChild(el('div', 'he-ed-head', 'Герой'));
      box.appendChild(row('Игрок', selectIn(this.doc.players.map((p, i) => [i, H.PLAYER_NAMES[i]]), h.owner, v => this.edit(() => { h.owner = +v; }))));
      box.appendChild(row('Шаблон', selectIn([['', 'Случайный'], ...H.HEROES.map(x => [x.id, x.name])], h.hid || '', v => this.edit(() => { h.hid = v || null; }))));
      box.appendChild(row('Опыт', numberIn(h.xp || 0, v => this.edit(() => { h.xp = v; }), 0)));
      box.appendChild(row('Обход ИИ', numberIn(h.patrol || 0, v => this.edit(() => { h.patrol = v; }), 0)));
      this.tagRow(box, h);
      this.armyRows(box, 'Войско (пусто: как у шаблона)', h.army || [], next => { h.army = next.filter(Boolean); });
      const arts = group('Артефакты', false);
      for (const id of h.arts || []) arts.appendChild(button(H.ARTIFACTS[id].name + ' ×', () => this.edit(() => { h.arts = h.arts.filter(x => x !== id); }, true), 'he-ed-item'));
      arts.appendChild(selectIn([['', 'Добавить...'], ...artOptions()], '', v => { if (v) this.edit(() => { h.arts = [...(h.arts || []), v]; }, true); }));
      box.appendChild(arts);
      const skills = group('Навыки (пусто: как у шаблона)', false);
      for (const [id, sk] of Object.entries(H.SKILLS)) {
        skills.appendChild(row(sk.name, selectIn([[0, '-'], [1, '1'], [2, '2'], [3, '3']], (h.skills || {})[id] || 0, v => this.edit(() => {
          const next = Object.assign({}, h.skills);
          if (+v) next[id] = +v;
          else delete next[id];
          h.skills = Object.keys(next).length ? next : null;
        }))));
      }
      box.appendChild(skills);
      box.appendChild(button('Событие: герой разбит...', () => this.eventFor(h, 'defeat')));
      box.appendChild(button('Удалить', () => this.removeSelected()));
    }

    eventFor(item, on) {
      if (!item.tag) {
        this.push();
        item.tag = (item.t || 'hero') + (item.id || this.doc.heroes.indexOf(item));
      }
      this.askEvent(null, { on, tag: item.tag });
      this.renderProps();
    }

    questRows(box, o) {
      const q = o.quest || { kind: 'res', res: { gold: 1000 } }, g = group('Задание', true);
      const set = fn => this.edit(() => {
        const next = Object.assign({}, q);
        fn(next);
        o.quest = next;
      }, true);
      g.appendChild(row('Вид', selectIn([['res', 'Принести ресурс'], ['art', 'Принести артефакт'], ['rank', 'Принести вещь редкости'], ['army', 'Привести существ'], ['kill', 'Разбить отряд'], ['foes', 'Победить героев']], q.kind, v => this.edit(() => {
        o.quest = v === 'res' ? { kind: 'res', res: { gold: 1000 } } : v === 'art' ? { kind: 'art', art: artOptions()[0][0] } : v === 'rank' ? { kind: 'rank', rank: 'rare' } : v === 'army' ? { kind: 'army', unit: 'militia', count: 10 } : v === 'kill' ? { kind: 'kill', obj: 0 } : { kind: 'foes', count: 1 };
      }, true))));
      if (q.kind === 'res') {
        const [res, n] = Object.entries(q.res)[0];
        g.appendChild(row('Ресурс', selectIn(H.RESOURCES, res, v => set(x => { x.res = { [v]: n }; }))));
        g.appendChild(row('Сколько', numberIn(n, v => set(x => { x.res = { [res]: v }; }), 1)));
      } else if (q.kind === 'art') g.appendChild(row('Вещь', selectIn(artOptions(), q.art, v => set(x => { x.art = v; }))));
      else if (q.kind === 'rank') {
        g.appendChild(row('Редкость', selectIn(Object.entries(H.ART_RANKS).map(([k, r]) => [k, r[0]]), q.rank, v => set(x => { x.rank = v; }))));
        g.appendChild(row('Место', selectIn([['', 'любое'], ...H.ART_SLOTS.map(x => [x[0], x[1]])], q.slot || '', v => set(x => { if (v) x.slot = v; else delete x.slot; }))));
      }
      else if (q.kind === 'army') {
        g.appendChild(row('Кого', selectIn(unitOptions().slice(1), q.unit, v => set(x => { x.unit = v; }))));
        g.appendChild(row('Сколько', numberIn(q.count, v => set(x => { x.count = v; }), 1)));
      } else if (q.kind === 'kill') {
        const mobs = this.doc.map.objs.filter(x => x.t === 'monster');
        g.appendChild(row('Отряд', selectIn(mobs.map(m => [m.id, MF.objName(m) + ' ' + m.c + ',' + m.r]), q.obj, v => set(x => { x.obj = +v; }))));
      } else g.appendChild(row('Сколько', numberIn(q.count, v => set(x => { x.count = v; }), 1)));
      box.appendChild(g);
    }

    linkRow(box, o) {
      const same = this.doc.map.objs.filter(x => x !== o && H.OBJ[x.t].kind === H.OBJ[o.t].kind);
      const options = [['', '(нет)'], ...same.map(x => [x.id, x.name || H.OBJ[x.t].name + ' ' + x.c + ',' + x.r + (x.l ? ', Подлунье' : '')])];
      box.appendChild(row('Куда ведёт', selectIn(options, o.link == null ? '' : o.link, v => this.edit(() => {
        const to = same.find(x => x.id === +v);
        if (v === '') delete o.link;
        else {
          o.link = +v;
          if (to && o.t !== 'portal1') to.link = o.id;
        }
      }))));
    }

    propsObject(box, o) {
      const def = H.OBJ[o.t], k = def.kind;
      box.appendChild(el('div', 'he-ed-head', MF.objName(o)));
      if (def.flag) box.appendChild(row('Владелец', selectIn([[-1, 'Ничей'], ...this.doc.players.map((p, i) => [i, H.PLAYER_NAMES[i]])], o.owner, v => this.edit(() => { o.owner = +v; }))));
      if (k === 'town') {
        box.appendChild(row('Имя', textIn(o.name, v => this.edit(() => { o.name = v; }))));
        box.appendChild(row('Народ', selectIn(Object.entries(H.FACTIONS).map(([id, f]) => [id, f.name]), o.faction, v => this.edit(() => {
          o.faction = v;
          o.built = (o.built || []).filter(id => H.FACTIONS[v].building[id]);
          o.branch = {};
        }, true))));
        const F = H.FACTIONS[o.faction], built = group('Готовые постройки', false), banned = group('Запрещённые постройки', false), branches = group('Ветви жилищ', false);
        for (const b of F.buildings) {
          built.appendChild(checkIn(b.name, (o.built || []).includes(b.id), on => this.edit(() => {
            o.built = on ? [...(o.built || []), b.id] : (o.built || []).filter(x => x !== b.id);
          })));
          banned.appendChild(checkIn(b.name, (o.forbid || []).includes(b.id), on => this.edit(() => {
            o.forbid = on ? [...(o.forbid || []), b.id] : (o.forbid || []).filter(x => x !== b.id);
          })));
          if (b.upgrade) {
            const line = F.units[b.upgrade - 1];
            branches.appendChild(row(b.name, selectIn([['', 'На выбор игрока'], ['a', H.UNITS[line[1]].name], ['b', H.UNITS[line[2]].name]], (o.branch || {})[b.upgrade] || '', v => this.edit(() => {
              o.branch = Object.assign({}, o.branch);
              if (v) o.branch[b.upgrade] = v;
              else delete o.branch[b.upgrade];
            }))));
          }
        }
        box.appendChild(built);
        box.appendChild(banned);
        box.appendChild(branches);
        this.armyRows(box, 'Гарнизон', o.garrison || [], next => { o.garrison = next; });
        box.appendChild(button('Событие: город захвачен...', () => this.eventFor(o, 'capture')));
      } else if (k === 'monster') {
        box.appendChild(row('Существо', selectIn(unitOptions().slice(1), o.unit, v => this.edit(() => { o.unit = v; }))));
        box.appendChild(row('Число', numberIn(o.count, v => this.edit(() => { o.count = Math.max(1, v); }), 1)));
        box.appendChild(row('Предел роста', numberIn(o.max, v => this.edit(() => { o.max = Math.max(1, v); }), 1)));
        box.appendChild(row('Нрав', selectIn(Object.entries(H.MAP.mood), o.mood, v => this.edit(() => { o.mood = v; }))));
        box.appendChild(row('Сообщение', areaIn(o.msg, v => this.edit(() => { o.msg = v; }))));
        box.appendChild(button('Событие: отряд разбит...', () => this.eventFor(o, 'defeat')));
      } else {
        if (k === 'artifact') box.appendChild(row('Вещь', selectIn(artOptions(), o.art, v => this.edit(() => { o.art = v; }))));
        if (k === 'scroll') box.appendChild(row('Заклинание', selectIn(spellOptions(), o.spell, v => this.edit(() => { o.spell = v; }))));
        if (k === 'shrine') box.appendChild(row('Заклинание', selectIn(spellOptions(def.circle), o.spell, v => this.edit(() => { o.spell = v; }))));
        if (k === 'pile') box.appendChild(row('Сколько (0: случайно)', numberIn(o.amount || 0, v => this.edit(() => { if (v) o.amount = v; else delete o.amount; }), 0)));
        if (k === 'chest') box.appendChild(row('Ступень', selectIn([[0, '1'], [1, '2'], [2, '3']], o.offer || 0, v => this.edit(() => { o.offer = +v; }))));
        if (o.t === 'oldmine') box.appendChild(row('Что внутри', selectIn([['', 'Неизвестно'], ...H.RESOURCES], o.res || '', v => this.edit(() => { if (v) o.res = v; else delete o.res; }))));
        if (k === 'vault') box.appendChild(row('Охрана', selectIn([[0, 'Слабая'], [1, 'Средняя'], [2, 'Сильная'], [3, 'Лютая']], o.tier || 0, v => this.edit(() => { o.tier = +v; }))));
        if (k === 'moongate') box.appendChild(row('Луна', selectIn(H.MOONS.slice(0, 7).map(m => [m.id, m.name]), o.moon, v => this.edit(() => { o.moon = v; }))));
        if (k === 'sealer' || k === 'sealgate') box.appendChild(row('Цвет печати', selectIn(H.SEAL_COLORS.map((x, i) => [i, x[0]]), o.color || 0, v => this.edit(() => { o.color = +v; }))));
        if (k === 'portal' || k === 'whirlpool') this.linkRow(box, o);
        if (k === 'quest' || k === 'questgate') this.questRows(box, o);
        if (k === 'quest') {
          const r = o.reward || {};
          box.appendChild(row('Награда, золото', numberIn(r.gold || 0, v => this.edit(() => { o.reward = Object.assign({}, r, { gold: v }); }), 0)));
          box.appendChild(row('Награда, опыт', numberIn(r.xp || 0, v => this.edit(() => { o.reward = Object.assign({}, r, { xp: v }); }), 0)));
        }
        if (k === 'prison') box.appendChild(row('Герой', selectIn([['', 'Случайный'], ...H.HEROES.map(x => [x.id, x.name])], o.hid || '', v => this.edit(() => { o.hid = v || null; }))));
        if (k === 'lore') box.appendChild(row('Надпись', areaIn(o.text, v => this.edit(() => { o.text = v; }))));
        if (def.held) this.armyRows(box, 'Гарнизон', o.garrison || [], next => { o.garrison = next; });
        if (MD.entry(o)) box.appendChild(row('Сообщение', areaIn(o.msg, v => this.edit(() => { o.msg = v; }))));
        if (k !== 'decor') {
          box.appendChild(button('Поставить охрану рядом', () => this.addGuard(o)));
          box.appendChild(button('Событие: посещение...', () => this.eventFor(o, 'visit')));
          if (def.flag) box.appendChild(button('Событие: захват...', () => this.eventFor(o, 'capture')));
        }
      }
      if (k !== 'decor') this.tagRow(box, o);
      box.appendChild(button('Удалить', () => this.removeSelected()));
    }

    addGuard(o) {
      const e = MD.entry(o) || [o.c, o.r];
      for (const [dc, dr] of [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, 2], [2, 1], [-2, 1], [0, -1]]) {
        const c = e[0] + dc, r = e[1] + dr;
        if (MF.whyNot(this.doc, 'monster', c, r, o.l, null) || !MD.groundCost(this.doc.map, o.l, c, r)) continue;
        this.push();
        const made = MF.place(this.doc, 'monster', c, r, o.l, { unit: 'wolves', count: 10, max: 30, mood: 'hostile' });
        this.sel = { obj: made.obj };
        this.miniDirty = true;
        this.renderProps();
        this.kick();
        return;
      }
      this.status('Рядом нет места для охраны');
    }

    runCheck(show) {
      this.issues = MF.check(this.doc);
      this.renderIssues();
      if (show) {
        const errors = MF.blocking(this.issues).length;
        this.status(this.issues.length ? 'Проверка: ошибок ' + errors + ', замечаний ' + (this.issues.length - errors) : 'Проверка: ошибок нет');
      }
      return this.issues;
    }

    renderIssues() {
      const box = this.issueList;
      box.textContent = '';
      for (const it of this.issues) {
        const n = button((it.level === 'error' ? 'Ошибка: ' : 'Замечание: ') + it.text, () => {
          if (it.c == null) return;
          this.goTo(it.c, it.r, it.l);
          const o = it.obj != null ? this.doc.map.objs.find(x => x.id === it.obj) : null;
          this.sel = o ? { obj: o } : this.sel;
          this.renderProps();
          this.kick();
        }, 'he-ed-issue' + (it.level === 'error' ? ' he-ed-bad' : ''));
        box.appendChild(n);
      }
    }

    play() {
      const list = this.runCheck(true), doc = this.doc;
      const fatal = !doc.players.some(p => p.who !== 'ai') || doc.players.some((p, i) => !MF.startOf(doc, i).town && !MF.startOf(doc, i).hero);
      if (fatal) {
        this.status('Играть нельзя: нужны старты всех игроков и хотя бы один человек');
        return;
      }
      const go = () => {
        const first = doc.players.findIndex(p => p.who !== 'ai');
        const slots = doc.players.map((p, i) => {
          const st = MF.startOf(doc, i), all = p.factions && p.factions.length ? p.factions : Object.keys(H.FACTIONS);
          const faction = st.town ? st.town.faction : st.hero && st.hero.hid ? H.CLASSES[heroRec(st.hero.hid).cls].faction : all[0];
          return { faction, human: i === first };
        });
        this.ui.playFromEditor(H.Maps.play(doc, { seed: Math.floor(Math.random() * 1e9), slots, difficulty: 'normal' }));
      };
      const errors = MF.blocking(list);
      if (!errors.length) {
        go();
        return;
      }
      this.dialog('Играть', body => body.appendChild(el('div', 'he-ed-text', 'В карте есть ошибки: ' + errors.length + '. Список внизу окна. Всё равно запустить?')), [['Запустить', go], ['Отмена', null]]);
    }

    askNew() {
      this.confirmLoss('Новая карта', () => {
        const o = { name: 'Новая карта', w: 48, levels: 1, fill: 'meadow', players: 2 };
        this.dialog('Новая карта', body => {
          body.appendChild(row('Имя', textIn(o.name, v => { o.name = v; })));
          body.appendChild(row('Размер', selectIn(MF.SIZES.map(([n, w]) => [w, n + ' ' + w + '×' + w]), o.w, v => { o.w = +v; })));
          body.appendChild(checkIn('Подлунье (второй уровень)', false, on => { o.levels = on ? 2 : 1; }));
          body.appendChild(row('Местность', selectIn(H.TERRAIN.map(t => [t.id, t.name]), o.fill, v => { o.fill = v; })));
          body.appendChild(row('Игроков', selectIn(Array.from({ length: MF.MAX_PLAYERS }, (_, i) => [i + 1, String(i + 1)]), o.players, v => { o.players = +v; })));
        }, [['Создать', () => this.setDoc(MF.blank(o))], ['Отмена', null]]);
      });
    }

    askOpen() {
      this.confirmLoss('Открыть карту', () => {
        Promise.all([H.Save.maps.all(), H.Maps.loadFiles()]).then(([rows]) => {
          this.dialog('Открыть карту', (body, shut) => {
            body.appendChild(el('div', 'he-ed-head', 'Карты игры'));
            for (const rec of H.Maps.LIST) {
              body.appendChild(button(rec.name + ' (' + rec.size + ')', () => {
                shut();
                this.setDoc(MF.clone(H.Maps.docOf(rec)));
              }, 'he-ed-item'));
            }
            body.appendChild(el('div', 'he-ed-head', 'Свои карты'));
            if (!rows.length) body.appendChild(el('div', 'he-ed-text', 'Сохранённых карт нет.'));
            for (const r of rows.sort((a, b) => b.when - a.when)) {
              const line = el('div', 'he-ed-stack');
              line.appendChild(button(r.name + ' (' + MF.sizeName(r.w) + ')', () => {
                shut();
                this.setDoc(MF.read(r.text), r.id);
              }, 'he-ed-item'));
              line.appendChild(button('Удалить', () => {
                H.Save.maps.del(r.id);
                line.remove();
              }));
              body.appendChild(line);
            }
          });
        }, () => this.status('Список карт не открылся'));
      });
    }

    save() {
      if (!this.fileId) this.fileId = 'own-' + Date.now();
      const doc = this.doc, rec = { id: this.fileId, name: doc.name, about: doc.about, w: doc.map.w, players: doc.players.length, when: Date.now(), text: MF.write(doc) };
      H.Save.maps.put(rec).then(() => {
        this.dirty = false;
        this.titleLine.textContent = doc.name + ' · ' + doc.map.w + '×' + doc.map.h;
        this.status('Карта сохранена. Она есть в списке сценариев.');
      }, () => this.status('Карту сохранить не удалось'));
    }

    exportFile() {
      const blob = new Blob([MF.write(this.doc)], { type: 'application/octet-stream' }), url = URL.createObjectURL(blob), a = el('a');
      a.href = url;
      a.download = (this.doc.name.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'map') + '.h98m';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.status('Файл карты выгружен: ' + a.download);
    }

    importFile() {
      const f = this.fileInput.files[0];
      if (!f) return;
      f.text().then(text => {
        this.fileInput.value = '';
        const doc = MF.read(text);
        this.confirmLoss('Импорт', () => {
          this.setDoc(doc);
          this.status('Карта загружена из файла. Сохраните её, чтобы она появилась в списке сценариев.');
        });
      }).catch(() => this.status('Этот файл не похож на карту Heroes 98'));
    }

    askProps() {
      const doc = this.doc;
      this.dialog('Свойства карты', body => {
        body.appendChild(row('Имя', textIn(doc.name, v => this.edit(() => { doc.name = v; }))));
        body.appendChild(row('Описание', areaIn(doc.about, v => this.edit(() => { doc.about = v; }), 5)));
        body.appendChild(el('div', 'he-ed-text', 'Размер ' + doc.map.w + '×' + doc.map.h + ', уровней ' + doc.map.levels + '. Размер задаётся при создании карты.'));
        if (doc.map.levels < 2) {
          body.appendChild(button('Добавить Подлунье', () => this.edit(() => {
            const M = doc.map, n = M.w * M.h;
            M.levels = 2;
            M.ter.push(new Array(n).fill(H.TERRAIN_INDEX.rock));
            M.road.push(new Array(n).fill(0));
            M.river.push(new Array(n).fill(0));
            M.over.push(new Array(n).fill(0));
            this.allSeen = null;
            this.levelButton.textContent = 'Поверхность';
          })));
        }
      }, [['Готово', () => this.refreshAll()]]);
    }

    askPlayers() {
      const doc = this.doc, towns = () => doc.map.objs.filter(o => o.t === 'town');
      const fill = body => {
        body.textContent = '';
        doc.players.forEach((p, i) => {
          const g = group('Игрок ' + (i + 1) + ': ' + H.PLAYER_NAMES[i], true);
          g.appendChild(row('Кто', selectIn(WHO, p.who, v => this.edit(() => { p.who = v; }))));
          g.appendChild(row('Союз', selectIn(Array.from({ length: MF.MAX_PLAYERS }, (_, k) => [k, 'Союз ' + (k + 1)]), p.team == null ? i : p.team, v => this.edit(() => { p.team = +v; }))));
          g.appendChild(row('Город старта', selectIn([['', '(по владельцу)'], ...towns().map(o => [o.id, o.name])], p.town == null ? '' : p.town, v => this.edit(() => {
            p.town = v === '' ? null : +v;
            const o = doc.map.objs.find(x => x.id === p.town);
            if (o) o.owner = i;
          }))));
          const allow = group('Разрешённые народы', false);
          for (const [id, f] of Object.entries(H.FACTIONS)) {
            allow.appendChild(checkIn(f.name, !p.factions || p.factions.includes(id), on => this.edit(() => {
              const all = Object.keys(H.FACTIONS), now = p.factions || all, next = on ? [...now, id] : now.filter(x => x !== id);
              p.factions = next.length === all.length ? null : next;
            })));
          }
          g.appendChild(allow);
          body.appendChild(g);
        });
        if (doc.players.length < MF.MAX_PLAYERS) {
          body.appendChild(button('Добавить игрока', () => {
            this.edit(() => doc.players.push({ who: 'both', factions: null, team: doc.players.length, town: null }));
            fill(body);
          }));
        }
        if (doc.players.length > 1) {
          body.appendChild(button('Убрать последнего игрока', () => {
            this.edit(() => {
              const last = doc.players.length - 1;
              doc.players.pop();
              doc.heroes = doc.heroes.filter(h => h.owner !== last);
              for (const o of doc.map.objs) if (o.owner === last) o.owner = -1;
            });
            fill(body);
          }));
        }
      };
      this.dialog('Игроки', fill, [['Готово', () => this.refreshAll()]]);
    }

    goalRows(body, title, list, kinds, set) {
      body.appendChild(el('div', 'he-ed-head', title));
      const towns = this.doc.map.objs.filter(o => o.t === 'town');
      list.forEach((g, i) => {
        const line = el('div', 'he-ed-stack');
        line.appendChild(selectIn(kinds, g.kind, v => {
          const next = { kind: v };
          if (v === 'town') next.town = towns[0] ? towns[0].id : 0;
          if (v === 'gold') next.n = 20000;
          if (v === 'day') next.day = 60;
          if (v === 'hero') next.hid = H.HEROES[0].id;
          if (v === 'flag') {
            next.flag = 'done';
            next.text = '';
          }
          set(list.map((x, k) => (k === i ? next : x)));
        }));
        if (g.kind === 'town') line.appendChild(selectIn(towns.map(o => [o.id, o.name]), g.town, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { town: +v }) : x)))));
        if (g.kind === 'gold') line.appendChild(numberIn(g.n, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { n: v }) : x))), 1));
        if (g.kind === 'day') line.appendChild(numberIn(g.day, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { day: v }) : x))), 1));
        if (g.kind === 'hero') line.appendChild(selectIn(H.HEROES.map(x => [x.id, x.name]), g.hid, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { hid: v }) : x)))));
        if (g.kind === 'flag') {
          line.appendChild(textIn(g.flag, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { flag: v }) : x)))));
          line.appendChild(textIn(g.text, v => set(list.map((x, k) => (k === i ? Object.assign({}, x, { text: v }) : x)))));
        }
        if (list.length > 1) line.appendChild(button('×', () => set(list.filter((x, k) => k !== i))));
        body.appendChild(line);
      });
      body.appendChild(button('Добавить условие', () => set([...list, { kind: kinds[0][0] }])));
    }

    askGoals() {
      const doc = this.doc;
      const fill = body => {
        body.textContent = '';
        this.goalRows(body, 'Победа', doc.goals.win, WIN_KINDS, next => {
          this.edit(() => { doc.goals.win = next; });
          fill(body);
        });
        this.goalRows(body, 'Поражение', doc.goals.lose, LOSE_KINDS, next => {
          this.edit(() => { doc.goals.lose = next; });
          fill(body);
        });
      };
      this.dialog('Условия победы и поражения', fill);
    }

    askScenes() {
      const doc = this.doc;
      this.dialog('Сцены', body => {
        body.appendChild(el('div', 'he-ed-text', 'Весь текст сцен карты. Метка начинается с @, строка события: event day 1 -> метка.'));
        const area = areaIn(doc.scenes, v => this.edit(() => { doc.scenes = v; }), 18);
        area.classList.add('he-ed-code');
        body.appendChild(area);
      }, [['Готово', () => this.refreshAll()]]);
    }

    askEvent(old, preset) {
      const doc = this.doc, e = Object.assign({ on: 'day', day: 1, who: 'human', repeat: false }, old || preset);
      const label = old ? old.go : this.freshLabel();
      let body0 = SC.block(doc.scenes, label) || 'say Текст сообщения';
      const editors = el('div');
      const params = () => {
        editors.textContent = '';
        if (e.on === 'day') editors.appendChild(row('День', numberIn(e.day || 1, v => { e.day = Math.max(1, v); }, 1)));
        if (e.on === 'cell') {
          editors.appendChild(row('Столбец', numberIn(e.c || 0, v => { e.c = v; }, 0)));
          editors.appendChild(row('Строка', numberIn(e.r || 0, v => { e.r = v; }, 0)));
          editors.appendChild(row('Уровень', numberIn(e.l || 0, v => { e.l = v; }, 0)));
        }
        if (e.on === 'visit' || e.on === 'defeat' || e.on === 'capture' || e.on === 'caravan' || e.on === 'done' || e.on === 'arrive') editors.appendChild(row('Метка объекта', selectIn(this.allTags(), e.tag || '', v => { e.tag = v; })));
        if (e.on === 'built') editors.appendChild(row('Здание', textIn(e.building || '', v => { e.building = v.trim(); })));
        if (e.on === 'heroes') editors.appendChild(row('Сколько героев', numberIn(e.n || 2, v => { e.n = Math.max(1, v); }, 1)));
        if (e.on === 'risen') editors.appendChild(row('Сколько поднять', numberIn(e.n || 1, v => { e.n = Math.max(1, v); }, 1)));
        if (e.on === 'army') {
          editors.appendChild(row('Существо', selectIn(Object.entries(H.UNITS).map(([id, u]) => [id, u.name]), e.unit || 'militia', v => { e.unit = v; })));
          editors.appendChild(row('Сколько', numberIn(e.n || 1, v => { e.n = Math.max(1, v); }, 1)));
        }
        if (e.on === 'res') {
          editors.appendChild(row('Ресурс', selectIn(H.RESOURCES, e.res || 'gold', v => { e.res = v; })));
          e.res = e.res || 'gold';
          editors.appendChild(row('Сколько', numberIn(e.n || 1000, v => { e.n = v; }, 1)));
          e.n = e.n || 1000;
        }
        if (e.on === 'flag') editors.appendChild(row('Флаг', textIn(e.flag || '', v => { e.flag = v.trim(); })));
      };
      const kinds = Object.entries(SC.EVENT_KINDS).filter(([id]) => id !== 'week').map(([id, x]) => [id, x.name]);
      const buttons = [['Готово', () => {
        const next = { on: e.on, go: label };
        if (e.on === 'day') next.day = e.day || 1;
        if (e.on === 'cell') Object.assign(next, { c: e.c || 0, r: e.r || 0, l: e.l || 0 });
        if (e.on === 'visit' || e.on === 'defeat' || e.on === 'capture' || e.on === 'caravan' || e.on === 'done' || e.on === 'arrive') next.tag = e.tag || this.allTags()[0][0];
        if (e.on === 'built') next.building = e.building || 'market';
        if (e.on === 'heroes') next.n = e.n || 2;
        if (e.on === 'risen') next.n = e.n || 1;
        if (e.on === 'army') {
          next.unit = e.unit || 'militia';
          next.n = e.n || 1;
        }
        if (e.on === 'res') Object.assign(next, { res: e.res, n: e.n });
        if (e.on === 'flag') next.flag = e.flag || 'done';
        if (e.who && e.who !== 'human') next.who = e.who;
        if (e.repeat) next.repeat = true;
        this.edit(() => {
          if (old) doc.events[doc.events.indexOf(old)] = next;
          else doc.events.push(next);
          doc.scenes = SC.setBlock(doc.scenes, label, body0);
        });
        this.refreshAll();
      }]];
      if (old) {
        buttons.push(['Удалить', () => {
          this.edit(() => {
            doc.events = doc.events.filter(x => x !== old);
            doc.scenes = SC.dropBlock(doc.scenes, label);
          });
          this.refreshAll();
        }]);
      }
      buttons.push(['Отмена', null]);
      this.dialog('Событие', body => {
        body.appendChild(row('Условие', selectIn(kinds, e.on, v => {
          e.on = v;
          params();
        })));
        body.appendChild(editors);
        params();
        body.appendChild(row('Для кого', selectIn([['human', 'Для человека'], ['any', 'Для всех'], ...doc.players.map((p, i) => [i, 'Игрок: ' + H.PLAYER_NAMES[i]])], e.who == null ? 'human' : e.who, v => { e.who = /^\d+$/.test(v) ? +v : v; })));
        body.appendChild(checkIn('Срабатывает каждый раз', e.repeat, on => { e.repeat = on; }));
        body.appendChild(el('div', 'he-ed-head', 'Что происходит'));
        const area = el('textarea', 'he-ed-in he-ed-code');
        area.rows = 8;
        area.value = body0;
        const bad = el('div', 'he-ed-bad');
        const parseNow = () => {
          body0 = area.value;
          const text = '@' + label + '\n' + body0, errs = SC.parse(text).errors;
          bad.textContent = errs.length ? errs.map(x => 'Строка ' + (x.line - 1) + ': ' + x.text).join('; ') : '';
        };
        area.addEventListener('input', parseNow);
        const tools = el('div', 'he-ed-bar');
        for (const [name, line] of INSERTS) {
          tools.appendChild(button(name, () => {
            area.value = area.value.replace(/\s*$/, '') + (area.value.trim() ? '\n' : '') + line;
            parseNow();
          }));
        }
        body.appendChild(tools);
        body.appendChild(area);
        body.appendChild(bad);
        parseNow();
      }, buttons);
    }

    freshLabel() {
      const P = SC.parse(this.doc.scenes);
      let n = this.doc.events.length + 1;
      while (P.labels['e' + n] != null) n++;
      return 'e' + n;
    }

    allTags() {
      const tags = [...this.doc.map.objs.filter(o => o.tag).map(o => o.tag), ...this.doc.heroes.filter(h => h.tag).map(h => h.tag)];
      return tags.length ? tags.map(t => [t, t]) : [['', '(нет меток: задайте метку объекту)']];
    }
  }

  H.Editor = Editor;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
