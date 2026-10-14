class AppStalker {
  constructor() {
    this.win = null;
    this.prefs = this.loadPrefs();
    this.discovered = this.loadEndings();
    this.save = this.loadSave();
    this.state = Object.assign(this.freshFlags(), { location: '', objective: '', radiation: '', danger: false });
    this.nodeId = null;
    this.moves = 0;
    this.lastArt = null;
    this.menu = null;
    this.typing = null;
    this.timer = null;
    this.keyHandler = (e) => this.onKey(e);
    this.palettes = [
      { id: 'vga', name: 'цветной VGA' },
      { id: 'green', name: 'зелёный люминофор' },
      { id: 'amber', name: 'янтарный люминофор' }
    ];
    this.kinds = { false: 'ложная', alt: 'альтернативная', true: 'истинная' };
    this.endings = [
      {
        id: 'ending_wealth', kind: 'false', title: 'Золотой дождь и каменный гроб',
        desc: 'Меченый просит богатства. С потолка сыплется золото, а следом рушится перекрытие.'
      },
      {
        id: 'ending_immortal', kind: 'false', title: 'Вечный камень',
        desc: 'Меченый просит вечной жизни и каменеет в сердце ЧАЭС.'
      },
      {
        id: 'ending_peace', kind: 'false', title: 'Слепая иллюзия',
        desc: 'Меченый просит, чтобы Зона исчезла. Он видит цветущий луг, хотя на самом деле ослеп от вспышки.'
      },
      {
        id: 'ending_apocalypse', kind: 'false', title: 'Огонь и тьма',
        desc: 'Меченый просит уничтожить людей. Видения конца света убивают его самого.'
      },
      {
        id: 'ending_power', kind: 'false', title: 'Поглощение разума',
        desc: 'Меченый просит власти над миром. Кристалл забирает его разум себе.'
      },
      {
        id: 'ending_join_c_consciousness', kind: 'alt', title: 'Присоединение к «О-Сознанию»',
        desc: 'Стрелок выслушивает учёных и ложится в пустую капсулу. Теперь он держит Зону вместе с ними.'
      },
      {
        id: 'ending_true_freedom', kind: 'true', title: 'Свобода',
        desc: 'Стрелок отказывается и расстреливает капсулы. Он приходит в себя на траве: «Я свободен».'
      }
    ];
    this.commands = {
      help: ['помощь', 'справка', 'help', '?'],
      task: ['задача', 'цель', 'task'],
      look: ['осмотр', 'осмотреться', 'смотреть', 'look', 'l', 'о'],
      codex: ['концовки', 'журнал', 'codex'],
      load: ['загрузить', 'загрузка', 'чекпоинт', 'load'],
      restart: ['заново', 'рестарт', 'restart'],
      color: ['цвет', 'color'],
      crt: ['элт', 'crt'],
      sound: ['звук', 'sound'],
      clear: ['очистить', 'cls', 'clear']
    };
    this.fkeys = { F1: 'help', F2: 'task', F3: 'codex', F4: 'color', F5: 'load', F8: 'sound', F9: 'crt', F10: 'restart' };
    this.initStoryNodes();
  }

  freshFlags() {
    return {
      atpTactic: null,
      bridgePass: null,
      rescuedNimble: false,
      hasAgropromDocs: false,
      killedBorov: false,
      hasX18Docs: false,
      rescuedKruglov: false,
      calibratedPsiHelmet: false,
      hasX16Docs: false,
      metGuide: false,
      metDoctor: false,
      hasDecoder: false,
      scorcherDisabled: false
    };
  }

  flagSnapshot() {
    const snap = {};
    Object.keys(this.freshFlags()).forEach(k => { snap[k] = this.state[k]; });
    return snap;
  }

  readStore(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  loadPrefs() {
    return Object.assign({ pal: 'vga', crt: true, sound: true, typing: true }, this.readStore('stalker_prefs') || {});
  }

  loadEndings() {
    const list = this.readStore('stalker_unlocked_endings');
    return new Set(Array.isArray(list) ? list : []);
  }

  loadSave() {
    const s = this.readStore('stalker_save');
    return s && s.node ? s : null;
  }

  saveDiscoveredEnding(id) {
    const isNew = !this.discovered.has(id);
    this.discovered.add(id);
    this.writeStore('stalker_unlocked_endings', [...this.discovered]);
    return isNew;
  }

  open() {
    const id = 'app_stalker';
    if (this.win && window.winManager.windows.has(id)) {
      window.winManager.createWindow({ id });
      return;
    }
    this.win = window.winManager.createWindow({
      id,
      title: 'S.T.A.L.K.E.R. - Тень Чернобыля (Текстовый квест)',
      icon: 'stalker',
      width: 700,
      height: 540,
      minWidth: 420,
      minHeight: 320,
      resizable: true,
      content: this.buildHTML(),
      onClose: () => this.onClosed()
    });
    const el = this.win.element;
    this.root = el.querySelector('.stalker-app');
    this.screen = el.querySelector('.stl-screen');
    this.log = el.querySelector('.stl-log');
    this.input = el.querySelector('.stl-input');
    this.typed = el.querySelector('.stl-typed');
    this.bindEvents();
    this.applyPrefs();
    this.showTitle();
    this.beep('pda');
  }

  onClosed() {
    this.stopTimer();
    this.typing = null;
    this.menu = null;
    window.removeEventListener('keydown', this.keyHandler);
    this.win = null;
  }

  buildHTML() {
    const keys = [['1', 'Помощь', 'help'], ['2', 'Задача', 'task'], ['3', 'Концовки', 'codex'], ['4', 'Цвет', 'color'], ['5', 'Загрузка', 'load'], ['8', 'Звук', 'sound'], ['9', 'ЭЛТ', 'crt'], ['10', 'Заново', 'restart']];
    return `
      <div class="stalker-app">
        <div class="stl-status">
          <span class="stl-st-left"></span>
          <span class="stl-st-right"><span class="stl-st-rad"></span><span class="stl-st-moves"></span></span>
        </div>
        <div class="stl-screen"><div class="stl-log"></div></div>
        <div class="stl-prompt">
          <span class="stl-gt">&gt;</span><span class="stl-typed"></span><span class="stl-cursor"></span>
          <input class="stl-input" maxlength="40" autocomplete="off" spellcheck="false" aria-label="Команда">
        </div>
        <div class="stl-keys">${keys.map(([n, label, cmd]) => `<button class="stl-key" data-cmd="${cmd}"><b>${n}</b>${label}</button>`).join('')}</div>
      </div>`;
  }

  bindEvents() {
    this.screen.addEventListener('mouseup', () => {
      if (this.typing) {
        this.finishTyping();
        return;
      }
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.isCollapsed) this.input.focus({ preventScroll: true });
    });
    this.input.addEventListener('input', () => this.syncTyped());
    this.root.querySelectorAll('.stl-key').forEach(btn => {
      btn.addEventListener('click', () => this.command(btn.dataset.cmd));
    });
    window.addEventListener('keydown', this.keyHandler);
  }

  onKey(e) {
    if (!this.win || !this.win.element.classList.contains('active')) return;
    const fcmd = this.fkeys[e.key];
    if (fcmd) {
      e.preventDefault();
      this.command(fcmd);
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const t = e.target;
    const own = t === window || t === document || t === document.body || (t instanceof Node && this.win.element.contains(t));
    if (!own) return;
    if (this.typing) {
      if (e.key.length === 1 || e.key === 'Enter') {
        e.preventDefault();
        this.finishTyping();
      }
      return;
    }
    if (!this.input.value && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      this.pick(Number(e.key) - 1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      this.submit();
      return;
    }
    if (e.key === 'Escape') {
      this.input.value = '';
      this.syncTyped();
      return;
    }
    if (e.target !== this.input) {
      if (e.key.length === 1) {
        e.preventDefault();
        this.input.value = (this.input.value + e.key).slice(0, 40);
        this.syncTyped();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.input.value = this.input.value.slice(0, -1);
        this.syncTyped();
      }
    }
  }

  syncTyped() {
    this.typed.textContent = this.input.value.toUpperCase();
  }

  esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  plain(html) {
    return String(html).replace(/<[^>]+>/g, '');
  }

  beep(kind) {
    const s = window.soundSys;
    if (!this.prefs.sound || !s) return;
    if (kind === 'geiger') s.playGeiger(this.state.danger ? 7 : 4);
    else if (kind === 'pda') s.playPDABeep();
    else if (kind === 'guitar') s.playStalkerGuitar();
    else if (kind === 'drone') s.playZoneDrone();
    else if (kind === 'blowout') s.playBlowout();
    else if (kind === 'gunshot') s.playGunshot();
    else if (kind === 'click') s.playClick();
  }

  applyPrefs() {
    if (!this.root) return;
    this.root.dataset.pal = this.prefs.pal;
    this.root.classList.toggle('stl-crt', !!this.prefs.crt);
    this.root.querySelector('[data-cmd="sound"]').classList.toggle('off', !this.prefs.sound);
    this.root.querySelector('[data-cmd="crt"]').classList.toggle('off', !this.prefs.crt);
  }

  savePrefs() {
    this.writeStore('stalker_prefs', this.prefs);
    this.applyPrefs();
  }

  updateStatus() {
    if (!this.root) return;
    const name = this.state.metDoctor ? 'СТРЕЛОК' : 'МЕЧЕНЫЙ';
    const left = this.root.querySelector('.stl-st-left');
    const rad = this.root.querySelector('.stl-st-rad');
    const moves = this.root.querySelector('.stl-st-moves');
    if (!this.nodeId) {
      left.textContent = 'S.T.A.L.K.E.R.  ТЕНЬ ЧЕРНОБЫЛЯ';
      rad.textContent = '';
      moves.textContent = '';
      rad.classList.remove('stl-hot');
      return;
    }
    left.textContent = `${name} │ ${this.state.location.toUpperCase()}`;
    rad.textContent = `РАД ${this.state.radiation}`;
    rad.classList.toggle('stl-hot', !!this.state.danger);
    moves.textContent = `ХОД ${this.moves}`;
  }

  out(html, opts = {}) {
    if (!this.log) return null;
    this.finishTyping();
    const block = document.createElement('div');
    block.className = 'stl-block' + (opts.cls ? ' ' + opts.cls : '');
    block.innerHTML = html;
    if (opts.items) this.dropMenu();
    this.log.appendChild(block);
    if (opts.items) this.buildMenu(opts.items);
    if (this.menu) {
      this.log.appendChild(this.menu.el);
      this.menu.el.hidden = true;
    }
    this.trimLog();
    this.typeOut(block, opts.instant);
    return block;
  }

  line(text, cls) {
    return this.out(`<div class="${cls || 'stl-sys'}">${text}</div>`, { instant: true });
  }

  trimLog() {
    while (this.log.children.length > 80) this.log.removeChild(this.log.firstChild);
  }

  scrollDown() {
    if (this.screen) this.screen.scrollTop = this.screen.scrollHeight;
  }

  typeOut(block, instant) {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant || reduced || !this.prefs.typing) {
      this.revealMenu();
      return;
    }
    const parts = [];
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push({ node: walker.currentNode, text: walker.currentNode.nodeValue, pos: 0 });
    parts.forEach(part => { part.node.nodeValue = ''; });
    this.typing = { parts, i: 0 };
    this.timer = setInterval(() => this.typeStep(), 16);
  }

  typeStep() {
    const t = this.typing;
    if (!t) return;
    let budget = 11;
    while (budget > 0 && t.i < t.parts.length) {
      const part = t.parts[t.i];
      if (!part.text.trim()) {
        part.node.nodeValue = part.text;
        t.i++;
        continue;
      }
      const take = Math.min(budget, part.text.length - part.pos);
      part.pos += take;
      budget -= take;
      part.node.nodeValue = part.text.slice(0, part.pos);
      if (part.pos >= part.text.length) t.i++;
    }
    this.scrollDown();
    if (t.i >= t.parts.length) this.finishTyping();
  }

  stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  finishTyping() {
    if (!this.typing) return;
    this.stopTimer();
    this.typing.parts.forEach(part => { part.node.nodeValue = part.text; });
    this.typing = null;
    this.revealMenu();
  }

  revealMenu() {
    if (this.menu) this.menu.el.hidden = false;
    this.scrollDown();
  }

  buildMenu(items) {
    const el = document.createElement('div');
    el.className = 'stl-menu';
    items.forEach((it, i) => {
      const btn = document.createElement('button');
      btn.className = 'stalker-choice-btn';
      btn.innerHTML = `<span class="stl-num">${i + 1}.</span><span class="stl-ct">${it.text}${it.tag ? ` <span class="stl-tag">[${it.tag}]</span>` : ''}</span>`;
      btn.addEventListener('click', () => this.pick(i));
      el.appendChild(btn);
    });
    this.menu = { items, el };
  }

  dropMenu() {
    if (this.menu && this.menu.el.parentNode) this.menu.el.parentNode.removeChild(this.menu.el);
    this.menu = null;
  }

  pick(i) {
    if (this.typing) {
      this.finishTyping();
      return;
    }
    const menu = this.menu;
    if (!menu || !menu.items[i]) return;
    const it = menu.items[i];
    const echo = document.createElement('div');
    echo.className = 'stl-echo';
    echo.textContent = `> ${i + 1}. ${this.plain(it.text)}`;
    menu.el.replaceWith(echo);
    this.menu = null;
    this.beep('click');
    if (it.keep) {
      this.buildMenu(menu.items);
      this.log.appendChild(this.menu.el);
    }
    it.run();
  }

  submit() {
    const raw = this.input.value.trim();
    this.input.value = '';
    this.syncTyped();
    if (!raw) return;
    const low = raw.toLowerCase().replace(/ё/g, 'е');
    const items = this.menu ? this.menu.items : [];
    if (/^\d+$/.test(low)) {
      const n = Number(low);
      if (items[n - 1]) this.pick(n - 1);
      else this.reply(raw, items.length ? `Нет действия с номером ${n}. Доступно: 1-${items.length}.` : 'Сейчас выбирать нечего.');
      return;
    }
    const cmd = Object.keys(this.commands).find(k => this.commands[k].some(w => w.replace(/ё/g, 'е') === low));
    if (cmd) {
      this.echoInput(raw);
      this.command(cmd);
      return;
    }
    const hits = low.length >= 3 ? items.map((it, i) => ({ i, t: this.plain(it.text).toLowerCase().replace(/ё/g, 'е') })).filter(h => h.t.includes(low)) : [];
    if (hits.length === 1) {
      this.pick(hits[0].i);
    } else if (hits.length > 1) {
      this.reply(raw, `Подходит несколько действий: ${hits.map(h => h.i + 1).join(', ')}. Наберите номер.`);
    } else {
      this.reply(raw, 'Не понял. Наберите номер действия или ПОМОЩЬ.');
    }
  }

  echoInput(raw) {
    this.line(`&gt; ${this.esc(raw.toUpperCase())}`, 'stl-echo');
  }

  reply(raw, text) {
    this.echoInput(raw);
    this.line(text);
  }

  command(cmd) {
    if (!this.log) return;
    if (cmd === 'help') this.showHelp();
    else if (cmd === 'task') {
      if (this.nodeId) this.line(`КПК: ${this.esc(this.state.objective)}`, 'stl-task');
      else this.line('Игра ещё не начата.');
    } else if (cmd === 'look') {
      if (this.nodeId) this.renderNode(this.nodeId, { repeat: true });
      else this.showTitle();
    } else if (cmd === 'codex') this.showCodex();
    else if (cmd === 'load') this.loadCheckpoint();
    else if (cmd === 'restart') this.confirmRestart();
    else if (cmd === 'color') {
      const i = this.palettes.findIndex(p => p.id === this.prefs.pal);
      const next = this.palettes[(i + 1) % this.palettes.length];
      this.prefs.pal = next.id;
      this.savePrefs();
      this.line(`Экран: ${next.name}.`);
    } else if (cmd === 'crt') {
      this.prefs.crt = !this.prefs.crt;
      this.savePrefs();
      this.line(this.prefs.crt ? 'Полосы кинескопа включены.' : 'Полосы кинескопа выключены.');
    } else if (cmd === 'sound') {
      this.prefs.sound = !this.prefs.sound;
      this.savePrefs();
      this.line(this.prefs.sound ? 'Звук включён.' : 'Звук выключен.');
      this.beep('click');
    } else if (cmd === 'clear') {
      this.finishTyping();
      const menu = this.menu;
      this.log.innerHTML = '';
      if (menu) this.log.appendChild(menu.el);
    }
  }

  showTitle() {
    this.finishTyping();
    this.nodeId = null;
    this.log.innerHTML = '';
    this.menu = null;
    this.updateStatus();
    const logo = [
      '████   █████    ███    █       █   █   █████   ████   ',
      '█        █     █   █   █       █  █    █       █   █  ',
      '████     █     █████   █       ███     ████    ████   ',
      '   █     █     █   █   █       █  █    █       █  █   ',
      '████ ▄   █   ▄ █   █ ▄ █████ ▄ █   █ ▄ █████ ▄ █   █ ▄'
    ].join('\n');
    const items = [{ text: 'Новая игра', run: () => this.askNewGame() }];
    if (this.save) items.push({ text: 'Продолжить', tag: this.esc(this.save.location || 'контрольная точка'), run: () => this.loadCheckpoint() });
    items.push({ text: 'Журнал концовок', keep: true, run: () => this.showCodex() });
    items.push({ text: 'Как играть', keep: true, run: () => this.showHelp() });
    const html = `
      <pre class="stl-logo">${logo}</pre>
      <div class="stl-title-sub">ТЕНЬ ЧЕРНОБЫЛЯ</div>
      <div class="stl-title-ver">текстовая версия 0.98 &nbsp; (C) 1998 GSC Game World</div>
      <div class="stl-title-line">════════════════════════════════════════════════════</div>
      <p>Зона отчуждения ЧАЭС, 2012 год. Вы очнулись без памяти. В КПК одна запись: «Убить Стрелка».</p>
      <div class="stl-sys">Открыто концовок: ${this.discovered.size} из ${this.endings.length}. Помощь: F1.</div>`;
    this.out(html, { items, cls: 'stl-title' });
  }

  showHelp() {
    const html = `
      <div class="stl-head">КАК ИГРАТЬ</div>
      <p>Действие выбирается цифрой: нажмите 1, 2 или 3. Можно щёлкнуть мышью. Можно набрать слово из действия, например ВОЛК или ТУННЕЛЬ, и нажать Enter.</p>
      <p>Пока текст печатается, любая клавиша выводит его целиком.</p>
      <p>На контрольных точках игра сохраняется сама. Если погибли или выбрали не то, вернитесь к последней точке.</p>
      <pre class="stl-pre">КОМАНДА     ЧТО ДЕЛАЕТ                     КЛАВИША
ЗАДАЧА      текущая задача в КПК           F2
ОСМОТР      повторить описание места
КОНЦОВКИ    журнал найденных концовок      F3
ЗАГРУЗИТЬ   последняя контрольная точка    F5
ЗАНОВО      начать игру сначала            F10
ЦВЕТ        сменить цвет экрана            F4
ЭЛТ         полосы кинескопа               F9
ЗВУК        включить или выключить звук    F8
ОЧИСТИТЬ    очистить экран</pre>`;
    this.out(html);
  }

  showCodex() {
    const rows = this.endings.map((e, i) => {
      const open = this.discovered.has(e.id);
      const head = open
        ? `<b>${e.title}</b> <span class="stl-tag">[${this.kinds[e.kind]}]</span>`
        : '<span class="stl-dim">? ? ?   запись не найдена</span>';
      return `<div class="stl-codex-row${open ? ' open' : ''}"><span class="stl-num">${i + 1}.</span><span class="stl-ct">${head}${open ? `<span class="stl-codex-d">${e.desc}</span>` : ''}</span></div>`;
    }).join('');
    this.out(`<div class="stl-head">ЖУРНАЛ КОНЦОВОК. Открыто ${this.discovered.size} из ${this.endings.length}</div>${rows}`);
  }

  askNewGame() {
    if (!this.save) {
      this.newGame();
      return;
    }
    this.out('<p>Начать новую игру? Сохранённая контрольная точка будет потеряна.</p>', {
      items: [
        { text: 'Да, начать сначала', run: () => this.newGame() },
        { text: 'Нет', run: () => this.showTitle() }
      ]
    });
  }

  confirmRestart() {
    if (!this.nodeId) {
      this.askNewGame();
      return;
    }
    const back = this.menu ? this.menu.items : null;
    this.out('<p>Начать игру сначала? Весь путь до этого места придётся пройти заново.</p>', {
      items: [
        { text: 'Да, начать сначала', run: () => this.newGame() },
        { text: 'Нет, играть дальше', run: () => (back ? this.out('', { items: back, instant: true }) : this.showTitle()) }
      ]
    });
  }

  newGame() {
    Object.assign(this.state, this.freshFlags(), { location: '', objective: '', radiation: '', danger: false });
    this.moves = 0;
    this.lastArt = null;
    this.log.innerHTML = '';
    this.menu = null;
    this.renderNode('prologue', { fresh: true });
    this.beep('pda');
  }

  setCheckpoint(id) {
    this.save = { node: id, flags: this.flagSnapshot(), moves: this.moves, location: this.state.location };
    this.writeStore('stalker_save', this.save);
  }

  loadCheckpoint() {
    if (!this.save || !this.nodes[this.save.node]) {
      this.line('Контрольных точек пока нет. Начните новую игру.');
      return;
    }
    Object.assign(this.state, this.freshFlags(), this.save.flags || {}, { location: '', objective: '' });
    this.moves = this.save.moves || 0;
    this.lastArt = null;
    this.line('*** ЗАГРУЖЕНА КОНТРОЛЬНАЯ ТОЧКА ***', 'stl-sys stl-center');
    this.renderNode(this.save.node, { fresh: true });
  }

  renderNode(id, opts = {}) {
    const node = this.nodes[id];
    if (!node || !this.log) return;
    const s = this.state;
    const prevLoc = s.location;
    const prevTask = s.objective;
    this.nodeId = id;
    if (!opts.repeat) {
      if (node.location) s.location = node.location;
      if (node.objective) s.objective = typeof node.objective === 'function' ? node.objective(s) : node.objective;
      if (node.radiation) s.radiation = node.radiation;
      if (node.danger !== undefined) s.danger = node.danger;
      if (node.isCheckpoint) this.setCheckpoint(id);
      this.beep(node.sound);
    }
    const showAll = opts.repeat || opts.fresh;
    let html = '';
    if (showAll || s.location !== prevLoc) html += `<div class="stl-room">${this.esc(s.location.toUpperCase())}</div>`;
    if (node.art && (showAll || node.art !== this.lastArt)) html += `<pre class="stl-art">${this.esc(this.art(node.art))}</pre>`;
    this.lastArt = node.art || null;
    const text = typeof node.text === 'function' ? node.text(s) : node.text;
    if (node.ending) {
      const idx = this.endings.findIndex(e => e.id === node.ending);
      const meta = this.endings[idx];
      const isNew = opts.repeat ? false : this.saveDiscoveredEnding(node.ending);
      html += `
        <div class="stl-end stl-end-${meta.kind}">
          <div class="stl-end-badge">КОНЦОВКА ${idx + 1} ИЗ ${this.endings.length} (${this.kinds[meta.kind].toUpperCase()})</div>
          <div class="stl-end-title">«${meta.title.toUpperCase()}»</div>
          ${text}
          <div class="stl-end-mark">* * *   К О Н Е Ц   * * *</div>
        </div>`;
      if (isNew) html += '<div class="stl-sys">Новая запись в журнале концовок.</div>';
    } else {
      html += `<div class="stl-text">${text}</div>`;
    }
    if (node.isCheckpoint && !opts.repeat) html += '<div class="stl-sys">[ контрольная точка ]</div>';
    if (!opts.repeat && s.objective && (s.objective !== prevTask || opts.fresh)) html += `<div class="stl-task">КПК: ${this.esc(s.objective)}</div>`;
    this.out(html, { items: this.nodeItems(node), cls: node.ending ? 'stl-ending-block' : '' });
    this.updateStatus();
  }

  nodeItems(node) {
    if (node.ending) {
      const items = [];
      if (node.back) items.push({ text: node.backText, run: () => this.renderNode(node.back) });
      items.push({ text: 'Вернуться к последней контрольной точке', run: () => this.loadCheckpoint() });
      items.push({ text: 'Открыть журнал концовок', keep: true, run: () => this.showCodex() });
      items.push({ text: 'Начать заново', run: () => this.newGame() });
      return items;
    }
    return (node.choices || [])
      .filter(c => !c.condition || c.condition(this.state))
      .map(c => ({
        text: c.text,
        tag: c.tag,
        run: () => {
          if (c.action) c.action(this.state, this);
          this.moves++;
          this.renderNode(c.next);
        }
      }));
  }

  art(key) {
    const lines = (this.arts[key] || '').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    const body = lines.map(l => l.slice(indent).replace(/\s+$/, ''));
    const title = this.artTitles[key] || '';
    const w = Math.max(title.length + 4, ...body.map(l => l.length + 2));
    const top = '┌' + ('─ ' + title + ' ').padEnd(w, '─') + '┐';
    const mid = body.map(l => '│' + (' ' + l).padEnd(w) + '│');
    return [top, ...mid, '└' + '─'.repeat(w) + '┘'].join('\n');
  }

  initArts() {
    this.artTitles = {
      truck: 'КОРДОН. МАЙ 2012',
      bunker: 'ПОДВАЛ СИДОРОВИЧА',
      agroprom: 'ПОДЗЕМЕЛЬЯ АГРОПРОМА',
      bar: 'РОСТОК. БАР «100 РЕНТГЕН»',
      x18: 'ЛАБОРАТОРИЯ X-18',
      yantar: 'ЯНТАРЬ. БУНКЕР УЧЁНЫХ',
      x16: 'ЛАБОРАТОРИЯ X-16',
      radar: 'РАДАР. ВЫЖИГАТЕЛЬ МОЗГОВ',
      pripyat: 'ПРИПЯТЬ',
      chnpp: 'ЧАЭС. ЧЕТВЁРТЫЙ ЭНЕРГОБЛОК',
      monolith: 'ИСПОЛНИТЕЛЬ ЖЕЛАНИЙ',
      hologram: 'О-СОЗНАНИЕ'
    };
    this.arts = {
      truck: String.raw`
           \                       '   .   '    .
            \_      .   '    .   '    .    '
             /    '    .   '     .   '   .    '
            /_
              \           ______________________
               \         |                      |\__
                         |   ГРУЗОВИК  СМЕРТИ   | o \__
                         |______________________|______|
           ____________________(@)________(@)_______(@)__
           ░░░░░░░░░░░░░░░░░░░░░ кювет ░░░░░░░░░░░░░░░░░░░`,
      bunker: String.raw`
               ___
              |###|                ┌───────────────┐
              '-.-'                │ ТУШЁНКА       │
             .-"""-.               │ АПТЕЧКИ       │
            ( o   o )              │ ПАТРОНЫ 9x18  │
             \  =  /               │ ВОДКА         │
          ____|___|___________     └───────────────┘
          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`,
      agroprom: String.raw`
          ═══╦═══════════╦═══════════╦═══════════╦═══
             ║     '     ║           ║     '     ║
             ║     .     ║   _____   ║     .     ║
             ║           ║  |#####|  ║           ║
             ║           ║  |#####|  ║           ║
          ░░░╩░░░░░░░░░░░╩░░|_____|░░╩░░░░░░░░░░░╩░░░`,
      bar: String.raw`
              ╔══════════════════════════════╗
              ║   Б А Р    100  РЕНТГЕН      ║
              ╚══════════════════════════════╝
               «Проходи, не задерживайся»
            ________________________________________
             [ ]   [ ]   [ ]        _      _      _
             | |   | |   | |       |~|    |~|    |~|
          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`,
      x18: String.raw`
            ┌─────────────────────────┐
            │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │        □
            │ ▓▓▓▓   X - 1 8   ▓▓▓▓▓▓ │    ○
            │ ▓▓▓▓ ДОСТУП ЗАКРЫТ ▓▓▓▓ │           ○
            │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │      □
            │  [ КЛЮЧ 1 ]  [ КЛЮЧ 2 ] │
            └─────────────────────────┘`,
      yantar: String.raw`
                       _________________
                  ____/    БУНКЕР-1     \____
                 |   [ ]    [=====]    [ ]   |
                 |___________________________|
            ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
              ~ ~ ~ ~ ~ ~ ~  болото  ~ ~ ~ ~ ~ ~ ~`,
      x16: String.raw`
          ║ (~~) ║   ║ (~~) ║   ║ (~~) ║   ║ (~~) ║
          ║ (~~) ║   ║ (~~) ║   ║ (~~) ║   ║ (~~) ║
          ╚══╤═══╝   ╚══╤═══╝   ╚══╤═══╝   ╚══╤═══╝
         ════╧══════════╧══════════╧══════════╧════
                     [  РУБИЛЬНИК  ]`,
      radar: String.raw`
            |\  /|        |\  /|        |\  /|
            | \/ |        | \/ |        | \/ |
            | /\ |        | /\ |        | /\ |
            |/  \|        |/  \|        |/  \|
            | \/ |        | \/ |        | \/ |
          __|_/\_|__    __|_/\_|__    __|_/\_|__
          ^^^^^^^^^^^^  Рыжий лес  ^^^^^^^^^^^^^`,
      pripyat: String.raw`
                 .-""-.
               .'  |   '.             ___     _____
              /    |     \     ___   |   |   |     |
             |-----+------|   |   |  |   |___| # # |
              \    |     /    |# #|  |# #|   | # # |
               '.  |   .'     |# #|  |# #|   | # # |
                 '-+-'        |# #|  |# #|   |_____|
          _________|__________|___|__|___|___|_____|____`,
      chnpp: String.raw`
                               ║▓║
                               ║░║
                               ║▓║
                 ______________║░║__________
                /▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\
               /▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\
              |▓▓▓▓▓▓▓▓▓    САРКОФАГ   ▓▓▓▓▓▓▓|
              |▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|`,
      monolith: String.raw`
                          /\
                         /  \
                        / /\ \
                       / /  \ \
                      / /    \ \
                     /_/______\_\
                  .  '   .   '   .  '`,
      hologram: String.raw`
                     .-------.
                    (  o   o  )
                     \   -   /
                .-----'-----'-----.
               /  ░░░░░░░░░░░░░░░  \
              ░░░░░░░░░░░░░░░░░░░░░░░`
    };
  }

  initStoryNodes() {
    this.initArts();
    const p = (...lines) => lines.map(x => `<p>${x}</p>`).join('');
    const say = (who, ...lines) => lines.map((x, i) => (i === 0
      ? `<p class="stl-say"><span class="stl-who">${who}:</span> ${x}</p>`
      : `<p class="stl-say stl-cont">${x}</p>`)).join('');
    const note = (...lines) => `<div class="stl-note">${lines.map(x => `<p>${x}</p>`).join('')}</div>`;
    const voice = x => `<p class="stl-voice">${x}</p>`;
    const alarm = x => `<p class="stl-alarm">${x}</p>`;
    const hero = s => (s.metDoctor ? 'Стрелок' : 'Меченый');

    this.nodes = {
      prologue: {
        isCheckpoint: true,
        location: 'Кордон',
        objective: 'Прийти в себя',
        radiation: '0.03 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        art: 'truck',
        text: p(
          '12 апреля 2006 года в 14:33 на Чернобыльской АЭС случился второй взрыв. После него вокруг станции появилась Зона: аномалии, мутанты и артефакты, ради которых сюда и лезут. Военные пытались взять Зону штурмом и не смогли. Теперь её окружает колючая проволока и блокпосты. Сталкеры всё равно идут внутрь.',
          'Май 2012 года, ночь, гроза. Молния попадает в «Грузовик смерти», который вывозит трупы из центра Зоны. Грузовик вылетает в кювет на Кордоне.',
          'Утром мимо проходит сталкер. Среди тел он находит одно живое, ваше, и относит его в подвал к местному торговцу Сидоровичу.',
          'При вас КПК с одной-единственной записью: <span class="stl-alarm-in">«УБИТЬ СТРЕЛКА»</span>. На предплечье татуировка S.T.A.L.K.E.R. Кто вы и как здесь оказались, вы не помните.'
        ),
        choices: [
          { text: 'Открыть глаза', next: 'sidorovich_intro' }
        ]
      },

      sidorovich_intro: {
        location: 'Кордон. Подвал Сидоровича',
        objective: 'Найти флешку Шустрого',
        radiation: '0.04 мкЗв/ч',
        danger: false,
        sound: 'pda',
        art: 'bunker',
        text: p('Толстый торговец отрывается от куриной ножки и разглядывает вас.') + say('СИДОРОВИЧ',
          'Очнулся? Ну и ладно. Звать тебя буду Меченым, раз наколка есть. Я тебя спас и в благородство играть не буду. Выполнишь для меня пару заданий, и мы в расчёте. Заодно, глядишь, память вернётся.',
          'Дело такое. Мой курьер Шустрый нёс мне флешку и пропал у железнодорожного моста. Говорят, его взяли бандиты и держат на АТП, в старом автопредприятии. Наверху в деревне Волк, он даст людей. Принесёшь флешку, расскажу, что знаю про твоего Стрелка.'
        ),
        choices: [
          { text: '«По рукам. Пойду к Волку.»', next: 'cordon_wolf' },
          { text: '«А что ты знаешь про Стрелка?»', next: 'sidorovich_strelok_rumor' }
        ]
      },

      sidorovich_strelok_rumor: {
        location: 'Кордон. Подвал Сидоровича',
        objective: 'Найти флешку Шустрого',
        radiation: '0.04 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('Сидорович хмыкает.') + say('СИДОРОВИЧ',
          'Стрелок... Личность известная. Говорят, он прошёл через пси-поле к центру Зоны и вернулся живым. Таких по пальцам пересчитать.',
          'Остальное после флешки. Иди к Волку, он уже собрал людей на АТП.'
        ),
        choices: [
          { text: 'Подняться наверх, в деревню новичков', next: 'cordon_wolf' }
        ]
      },

      cordon_wolf: {
        location: 'Кордон. Деревня новичков',
        objective: 'Выручить Шустрого на АТП',
        radiation: '0.05 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        text: p('Вы выходите наверх. У костра новичок тихо перебирает струны гитары. Волк, старший в лагере, протягивает вам ПМ и горсть патронов.') + say('ВОЛК',
          'Сидорович предупредил. Шустрого держат в кирпичном здании на АТП, сторожат его уголовники. Петруха с ребятами уже ждёт неподалёку. Как пойдёшь?'
        ),
        choices: [
          { text: '«Один. Залезу на чердак и сниму часовых по-тихому.»', action: (s) => { s.atpTactic = 'solo'; }, next: 'atp_solo' },
          { text: '«С Петрухой. Ударим с двух сторон.»', action: (s) => { s.atpTactic = 'team'; }, next: 'atp_team' },
          { text: '«Попробую выкупить Шустрого за артефакт.»', next: 'atp_negotiate' }
        ]
      },

      atp_negotiate: {
        location: 'Кордон. АТП',
        radiation: '0.07 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p('Вы подходите к воротам с поднятыми руками и кричите, что хотите договориться. За воротами ржут.') + say('БАНДИТ',
          'Ха! Лови маслину, фраер! Хабар на землю, сам к стенке!'
        ) + p('Заряд из обреза взрывает землю у ваших ног. Разговора не будет.'),
        choices: [
          { text: 'Упасть за бетонные блоки и стрелять вместе с людьми Петрухи', action: (s) => { s.atpTactic = 'team'; }, next: 'atp_team' }
        ]
      },

      atp_solo: {
        location: 'Кордон. АТП',
        objective: 'Отнести флешку Сидоровичу',
        radiation: '0.06 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы обходите АТП кустами, пролезаете в дыру в заборе и по приставной лестнице забираетесь на чердак. Внизу у костра двое часовых.',
          'Два выстрела. Вы спрыгиваете во двор и вышибаете дверь в комнату с пленником. Последний бандит бросает ствол и убегает.',
          'На матрасе в углу сидит Шустрый, перепуганный, но целый.'
        ) + say('ШУСТРЫЙ', 'Братуха! Я уж думал, всё, кранты. Вот флешка для Сидоровича, забирай.'),
        choices: [
          { text: 'Забрать флешку и вернуться к Сидоровичу', action: (s) => { s.rescuedNimble = true; }, next: 'cordon_sidorovich_reward' }
        ]
      },

      atp_team: {
        location: 'Кордон. АТП',
        objective: 'Отнести флешку Сидоровичу',
        radiation: '0.06 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы машете Петрухе. Его люди открывают огонь по главному входу, и бандиты отвечают туда же. Вы тем временем заходите сбоку, через гаражи.',
          'Пули выбивают кирпичную крошку из стен. Бандиты падают один за другим.'
        ) + say('ПЕТРУХА', 'Чисто! Шустрый в дальнем бараке!') + p('Шустрый жмёт вам руку и отдаёт флешку. Там, по его словам, маршруты вглубь Зоны.'),
        choices: [
          { text: 'Забрать флешку и идти к Сидоровичу', action: (s) => { s.rescuedNimble = true; }, next: 'cordon_sidorovich_reward' }
        ]
      },

      cordon_sidorovich_reward: {
        location: 'Кордон. Подвал Сидоровича',
        objective: 'Украсть документы военных в НИИ «Агропром»',
        radiation: '0.04 мкЗв/ч',
        danger: false,
        sound: 'pda',
        art: 'bunker',
        text: p('Сидорович втыкает флешку в древний компьютер, читает и довольно кряхтит.') + say('СИДОРОВИЧ',
          'Молодец, Меченый. Теперь про Стрелка.',
          'Ходят слухи, что Стрелок нашёл проход на север, к центру Зоны. Там, говорят, Клондайк артефактов, а в самом центре Исполнитель желаний. Только дорогу перекрывает Выжигатель мозгов. Кто к нему подходит, становится зомби.',
          'Недавно военные нашли в НИИ «Агропром» документы: исследования центра Зоны и защита от излучения. Укради их, и поймём, как Стрелок прошёл на север. Иди через железнодорожную насыпь на Свалку. Будут новости, свяжусь.'
        ),
        choices: [
          { text: 'Идти к железнодорожной насыпи', next: 'cordon_railway_bridge' }
        ]
      },

      cordon_railway_bridge: {
        location: 'Кордон. Железнодорожная насыпь',
        objective: 'Пройти через насыпь на север',
        radiation: '0.08 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p(
          'Дорогу на север перекрывает высокая насыпь с разрушенным мостом. Под мостом армейский блокпост майора Кузнецова. Солдаты стреляют в каждого, кто не заплатил.',
          'Левее в насыпи чернеет дренажный туннель. Внутри потрескивает «Электра».'
        ),
        choices: [
          { text: 'Заплатить Кузнецову: 500 рублей и бутылка водки', action: (s) => { s.bridgePass = 'bribe'; }, next: 'fox_encounter' },
          { text: 'Пройти туннель, бросая перед собой болты', action: (s) => { s.bridgePass = 'tunnel'; }, next: 'tunnel_electra' },
          { text: 'Залечь на пригорке и напасть на блокпост', action: (s) => { s.bridgePass = 'fight'; }, next: 'bridge_firefight' }
        ]
      },

      tunnel_electra: {
        location: 'Кордон. Дренажный туннель',
        radiation: '0.12 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p(
          'В туннеле гудит, пахнет озоном и горелой медью. Вы бросаете болт. «Электра» бьёт по нему синей дугой с громким треском.',
          'Разрядившейся аномалии нужно несколько секунд. Вы проскакиваете и выбираетесь по ту сторону насыпи. Военные ничего не заметили.'
        ),
        choices: [
          { text: 'Идти дальше, в сторону Свалки', next: 'fox_encounter' }
        ]
      },

      bridge_firefight: {
        location: 'Кордон. Мост',
        radiation: '0.08 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы открываете огонь. Солдаты отвечают из АКС-74У, бой выходит злой. Блокпост вы всё-таки зачищаете, но с южной стороны уже поднимают по тревоге вертолёт.',
          'Вы собираете с убитых патроны и уходите, пока не накрыли.'
        ),
        choices: [
          { text: 'Уйти от погони к полуразрушенному дому у дороги', next: 'fox_encounter' }
        ]
      },

      fox_encounter: {
        location: 'Кордон. Дом у дороги',
        objective: 'Помочь Лису',
        radiation: '0.07 мкЗв/ч',
        danger: true,
        sound: 'pda',
        text: p('Пищит КПК. На связи Сидорович.') + say('СИДОРОВИЧ',
          'Меченый, слушай. Лис из рейда вернулся, раненый. Засел в домике у дороги, отбивается. Выручи его, он про Стрелка кое-что знает.'
        ) + p('У домика стая слепых псов. Они кидаются на окна, изнутри кто-то отстреливается одиночными.'),
        choices: [
          { text: 'Убить вожака и разогнать стаю гранатой', next: 'fox_dialogue' }
        ]
      },

      fox_dialogue: {
        location: 'Кордон. Дом у дороги',
        objective: 'Найти Серого на Свалке',
        radiation: '0.06 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        text: p('Псы с визгом разбегаются. Лис перетягивает рану бинтом и жмёт вам руку.') + say('ЛИС',
          'Спасибо. Ещё минута, и порвали бы. Ищешь Стрелка? Сам я его не видел. Брат мой, Серый, имел дело с его людьми. Он на Свалке, в старом ангаре. Скажи, что от меня, он всё расскажет.'
        ),
        choices: [
          { text: 'Идти на Свалку', next: 'garbage_entry' }
        ]
      },

      garbage_entry: {
        isCheckpoint: true,
        location: 'Свалка. Кладбище техники',
        objective: 'Найти Серого в ангаре',
        radiation: '0.22 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p(
          'Свалка. Сюда после аварии 1986 года свезли грузовики, краны, бронетехнику, всё, что фонило. Счётчик Гейгера трещит не умолкая.',
          'Здесь хозяйничают бандиты. По радио кто-то кричит: на старый ангар у депо напала большая банда.'
        ),
        choices: [
          { text: 'Зайти в ангар с тыла и помочь отбиться', next: 'garbage_hangar_fight' },
          { text: 'Забраться на стрелу крана и бить сверху из снайперской винтовки', next: 'garbage_sniper' }
        ]
      },

      garbage_sniper: {
        location: 'Свалка. Ангар',
        radiation: '0.24 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы забираетесь на ржавую площадку крана. Ангар отсюда как на ладони. Первым выстрелом вы снимаете главаря, вторым пулемётчика.',
          'Без них бандиты быстро скисают и отходят в сторону Тёмной долины. Ангар отстояли.'
        ),
        choices: [
          { text: 'Спуститься и найти Серого', next: 'seriy_dialogue' }
        ]
      },

      garbage_hangar_fight: {
        location: 'Свалка. Ангар',
        radiation: '0.19 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы вбегаете в ворота депо. Бандиты прижали нескольких сталкеров к вагонам. Вы бросаете Ф-1 им за укрытие и добиваете тех, кто уцелел.',
          'Один из сталкеров, в потёртом комбинезоне, опускает ствол. Это Серый.'
        ),
        choices: [
          { text: 'Передать Серому привет от Лиса', next: 'seriy_dialogue' }
        ]
      },

      seriy_dialogue: {
        location: 'Свалка. Ангар',
        objective: 'Выручить Крота на Агропроме',
        radiation: '0.15 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: say('СЕРЫЙ',
          'От Лиса? Живой, значит. Ну, слава Зоне.',
          'Про Стрелка спроси Крота, диггера. Он нашёл тайник группы Стрелка под Агропромом. Только там сейчас военные, спецназ, ищут какие-то документы. Крота прижали. Поторопись, а то не застанешь.'
        ),
        choices: [
          { text: 'Идти на запад через холмы, к Агропрому', next: 'agroprom_surface' }
        ]
      },

      agroprom_surface: {
        isCheckpoint: true,
        location: 'НИИ «Агропром»',
        objective: 'Выручить Крота',
        radiation: '0.18 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'На Агропроме стрельба. Спецназ в бронекостюмах «Берилл-5М» прижал диггеров к люкам дренажной системы. Капитан командует зачисткой.',
          'Крот ещё отстреливается, но патронов у него почти не осталось.'
        ),
        choices: [
          { text: 'Ударить спецназу в спину и убрать командира', next: 'agroprom_mole_saved' },
          { text: 'Бросить дымовую шашку и пробиться к Кроту', next: 'agroprom_mole_saved' }
        ]
      },

      agroprom_mole_saved: {
        location: 'НИИ «Агропром». Люк в коллектор',
        objective: 'Найти тайник Стрелка под Агропромом',
        radiation: '0.16 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('Стрельба стихает. Крот переводит дух.') + say('КРОТ',
          'Вовремя ты. Про Стрелка слушай. Тайник его глубоко под заводом, в вентиляционной шахте, между трубами. Лезь вот в этот люк. Только смотри: внизу чертовщина творится, оттуда мало кто возвращается.'
        ) + p('Крот сдвигает тяжёлую чугунную крышку. Снизу тянет сыростью.'),
        choices: [
          { text: 'Включить фонарь и спуститься по скобам', next: 'agroprom_underground_entry' }
        ]
      },

      agroprom_underground_entry: {
        location: 'Подземелья Агропрома',
        radiation: '0.30 мкЗв/ч',
        danger: true,
        sound: 'drone',
        art: 'agroprom',
        text: p('Темно, с ржавых труб капает вода. Впереди кто-то тяжело, с хлюпаньем дышит. В луче фонаря дрожит воздух, как над костром.') +
          alarm('КРОВОСОС! Тварь почти невидима и несётся прямо на вас.'),
        choices: [
          { text: 'Выстрелить из дробовика в упор, туда, где дрожит воздух', next: 'agroprom_bloodsucker_kill' },
          { text: 'Прыгнуть в боковой ход, где светится «Холодец»', next: 'agroprom_underground_trap' }
        ]
      },

      agroprom_underground_trap: {
        location: 'Подземелья Агропрома',
        radiation: '0.45 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p(
          'Вы ныряете в боковой ход и чудом не наступаете в зелёную лужу «Холодца». Кровосос бросается следом, влетает прямо в аномалию, и кислота его разрывает.',
          'Отдышавшись, вы идёте дальше по карте КПК.'
        ),
        choices: [
          { text: 'Подняться по винтовой лестнице к вентиляционной шахте', next: 'agroprom_strelok_stash' }
        ]
      },

      agroprom_bloodsucker_kill: {
        location: 'Подземелья Агропрома',
        radiation: '0.28 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Дробь сбивает с кровососа невидимость. Он с рёвом валится на бетон и больше не встаёт.',
          'Дальше коридоры, в них трупы бандитов, которым повезло меньше. За железной решёткой вы находите вентиляционную трубу.'
        ),
        choices: [
          { text: 'Пролезть в трубу', next: 'agroprom_strelok_stash' }
        ]
      },

      agroprom_strelok_stash: {
        location: 'Подземелья Агропрома. Тайник Стрелка',
        objective: 'Выбраться из подземелий',
        radiation: '0.20 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('В тайнике модернизированный «калаш», патроны и флешка группы Стрелка. Вы вставляете флешку в КПК. На ней переписка.') +
          note(
            'В группе трое: Стрелок, Призрак и Клык. Помогает им общий друг, Доктор.',
            'Клык недавно погиб на Свалке. После этого Стрелок один ушёл на север, к центру Зоны. Призрак работает на учёных, на Янтаре.'
          ) +
          p('В коридоре за спиной что-то воет. Звук отдаётся прямо в голове.'),
        choices: [
          { text: 'Выглянуть в коридор с оружием наготове', next: 'agroprom_controller' }
        ]
      },

      agroprom_controller: {
        location: 'Подземелья Агропрома. Выход',
        objective: 'Убить контролёра',
        radiation: '0.35 мкЗв/ч',
        danger: true,
        sound: 'drone',
        text: p('В глазах темнеет, в ушах звенит. Взгляд сам тянется к фигуре в лохмотьях. Голова у неё раздутая, бугристая.') +
          alarm('КОНТРОЛЁР! Он бьёт по разуму, и с каждым ударом мысли путаются сильнее.'),
        choices: [
          { text: 'Уйти за угол, чтобы он вас не видел, и бросить гранату на звук шагов', next: 'agroprom_controller_defeated' },
          { text: 'Броситься на него, стреляя очередями', next: 'agroprom_controller_defeated' }
        ]
      },

      agroprom_controller_defeated: {
        location: 'Подземелья Агропрома. Люк наверх',
        objective: 'Украсть документы военных',
        radiation: '0.22 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Контролёр падает. Звон в ушах медленно проходит. В конце тоннеля вертикальная лестница наверх.',
          'Люк выводит прямо на охраняемую территорию института. Документы лежат в главном корпусе, на третьем этаже.'
        ),
        choices: [
          { text: 'Дождаться сумерек, тихо снять часовых и унести кейс', action: (s) => { s.hasAgropromDocs = true; }, next: 'agroprom_docs_stolen' },
          { text: 'Прорваться на третий этаж под вой сирены и забрать документы', action: (s) => { s.hasAgropromDocs = true; }, next: 'agroprom_docs_stolen' }
        ]
      },

      agroprom_docs_stolen: {
        location: 'НИИ «Агропром»',
        objective: 'Отнести документы Бармену в бар «100 рентген»',
        radiation: '0.18 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('Кейс с грифом «Особой важности» у вас. На защищённом канале Сидорович.') + say('СИДОРОВИЧ',
          'Хорошо сработал, Меченый. Только ко мне с этим не лезь, военные сейчас на Кордоне облаву устроят.',
          'Неси в бар «100 рентген», это на заводе «Росток». Там Бармен, мой старый знакомый. Он с «Долгом» договорился, тебя на блокпосту пропустят.'
        ),
        choices: [
          { text: 'Идти на «Росток», в бар «100 рентген»', next: 'bar_rostock' }
        ]
      },

      bar_rostock: {
        isCheckpoint: true,
        location: 'Бар «100 рентген»',
        objective: 'Добыть ключ Борова в Тёмной долине',
        radiation: '0.05 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        art: 'bar',
        text: p(
          '«Росток» держит группировка «Долг». В подвале завода бар «100 рентген». Сталкеры пьют водку «Казаки» и травят байки.',
          'Бармен листает документы с Агропрома.'
        ) + say('БАРМЕН',
          'Так. Тут прямо написано: Выжигатель мозгов люди построили. Испытательный комплекс. Как его выключить, здесь нет. Это ищи в лаборатории X-18, в Тёмной долине.',
          'Дверь в X-18 открывается двумя электронными ключами. Один дам я, военные оставили копию. Второй у Борова, это пахан бандитов в долине. Достанешь ключ, достанешь и документы.'
        ),
        choices: [
          { text: '«Сделаю. Иду в Тёмную долину.»', next: 'dark_valley_entry' }
        ]
      },

      dark_valley_entry: {
        location: 'Тёмная долина',
        objective: 'Попасть на базу Борова',
        radiation: '0.14 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p('В Тёмной долине туман и мелкий дождь. У входа вы встречаете долговца по кличке Пуля. Бандиты ведут его раненого товарища на старую фабрику, на допрос.'),
        choices: [
          { text: 'Устроить вместе с Пулей засаду на конвой', next: 'dark_valley_bullet_helped' },
          { text: 'Не ввязываться и идти прямо на базу Борова', next: 'dark_valley_borov_base' }
        ]
      },

      dark_valley_bullet_helped: {
        location: 'Тёмная долина. Дорога к фабрике',
        objective: 'Пробраться к Борову через крышу',
        radiation: '0.12 мкЗв/ч',
        danger: false,
        sound: 'gunshot',
        text: p('Вдвоём вы снимаете конвойных за пару секунд. Спасённый долговец отдышался и говорит:') + say('ДОЛГОВЕЦ',
          'Спасибо, сталкер. У Борова на базе народу полно. Но с восточной стороны есть водосточная труба. По ней на крышу, а в крыше дыра прямо над его кабинетом.'
        ),
        choices: [
          { text: 'Лезть по трубе и через крышу в кабинет Борова', next: 'dark_valley_borov_assault' }
        ]
      },

      dark_valley_borov_base: {
        location: 'Тёмная долина. База бандитов',
        objective: 'Пробиться к Борову',
        radiation: '0.14 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p('База бандитов в недостроенном заводском комплексе. Везде патрули в кожанках, с обрезами и автоматами. Договориться тут не с кем.'),
        choices: [
          { text: 'Штурмовать в лоб', next: 'dark_valley_borov_assault' }
        ]
      },

      dark_valley_borov_assault: {
        location: 'Тёмная долина. Кабинет Борова',
        objective: 'Войти в лабораторию X-18',
        radiation: '0.16 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Вы врываетесь в кабинет. Боров хватается за карабин, но вы стреляете первым. В его кармане ключ-карта от X-18.',
          'Вход в лабораторию рядом, под соседним цехом.'
        ),
        choices: [
          { text: 'Спуститься ко входу в X-18', action: (s) => { s.killedBorov = true; }, next: 'lab_x18_entry' }
        ]
      },

      lab_x18_entry: {
        isCheckpoint: true,
        location: 'Лаборатория X-18',
        objective: 'Найти документы в X-18',
        radiation: '0.40 мкЗв/ч',
        danger: true,
        sound: 'drone',
        art: 'x18',
        text: p(
          'Вы вставляете оба ключа в считыватель. Гермодверь со скрежетом отъезжает. Внутри пыль и красный аварийный свет.',
          'Здесь шли генетические опыты. По воздуху летают ящики и стулья: полтергейст швыряет всё, что не прибито. Снизу, из шахты, ревёт псевдогигант, и от рёва дрожат стены.'
        ),
        choices: [
          { text: 'Стрелять полтергейсту в центр огненного сгустка', next: 'lab_x18_docs_found' },
          { text: 'Спуститься на нижний ярус и закидать псевдогиганта гранатами', next: 'lab_x18_docs_found' }
        ]
      },

      lab_x18_docs_found: {
        location: 'Лаборатория X-18. Пульт',
        objective: 'Уходить из Тёмной долины',
        radiation: '0.35 мкЗв/ч',
        danger: true,
        sound: 'pda',
        text: p('За бронестеклом диспетчерской лежат папки: чертежи, отчёты по излучателям Кайманова. В одном отчёте сказано:') +
          note('Лаборатория X-18 разрабатывала биологические излучатели. Финальные испытания пси-установки проводились в лаборатории X-16, под заводом на озере Янтарь.') +
          p('Рация хрипит голосом Сидоровича.') + say('СИДОРОВИЧ',
            'Меченый! В Тёмную долину зашёл армейский спецназ, проходы на Свалку перекрыты. Уходи южной тропой на Кордон!'
          ),
        choices: [
          { text: 'Бежать южной тропой на Кордон', action: (s) => { s.hasX18Docs = true; }, next: 'cordon_mercs_attack' }
        ]
      },

      cordon_mercs_attack: {
        location: 'Кордон. Деревня новичков',
        objective: 'Отнести документы X-18 Бармену',
        radiation: '0.06 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'На Кордоне стрельба. Деревню новичков штурмуют наёмники в синих комбинезонах, снаряжение у них дорогое. Они хотят закрепиться здесь и перебить новичков.',
          'Вы с Фанатом и новичками берёте их в клещи. Кто не успел уйти, остаётся лежать. Деревня цела, дорога на «Росток» свободна.'
        ),
        choices: [
          { text: 'Вернуться в бар к Бармену с документами X-18', next: 'bar_after_x18' }
        ]
      },

      bar_after_x18: {
        isCheckpoint: true,
        location: 'Бар «100 рентген»',
        objective: 'Добраться до Сахарова на Янтаре',
        radiation: '0.05 мкЗв/ч',
        danger: false,
        sound: 'pda',
        art: 'bar',
        text: p('Бармен долго читает документы из X-18 и сверяет их с бумагами с Агропрома.') + say('БАРМЕН',
          'Сходится. Выжигатель на Радаре построили на основе установки из X-16. Лаборатория под Янтарём. Там сейчас экспедиция профессора Сахарова. Учёные делают пси-шлем, чтобы мозги от излучения прикрыть.',
          'На Янтарь иди через Дикую территорию. Там наёмники, люди Волкодава. Не подставляйся.'
        ),
        choices: [
          { text: 'Идти на Дикую территорию', next: 'wild_territory' }
        ]
      },

      wild_territory: {
        location: 'Дикая территория',
        objective: 'Спасти профессора Круглова',
        radiation: '0.18 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Над разбитым депо свистит ракета. Наёмники сбивают вертолёт учёных, и Ми-8 падает среди бетонных развалин.',
          'По рации кричит выживший, профессор Круглов: наёмники идут добивать экспедицию.'
        ),
        choices: [
          { text: 'Напасть на наёмников и спасти Круглова', action: (s) => { s.rescuedKruglov = true; }, next: 'kruglov_saved' },
          { text: 'Обойти бой через туннель с «Жаркой»', action: (s) => { s.rescuedKruglov = false; }, next: 'yantar_bunker_alone' }
        ]
      },

      kruglov_saved: {
        location: 'Дикая территория. Туннель',
        objective: 'Довести Круглова до Янтаря',
        radiation: '0.20 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('Наёмников больше нет. Круглов в оранжевом защитном костюме долго трясёт вам руку.') + say('КРУГЛОВ',
          'Спасибо, коллега! Без вас мои исследования пропали бы вместе со мной. Я знаю дорогу через туннели прямо к нашему бункеру на Янтаре. Профессор Сахаров будет очень рад.'
        ),
        choices: [
          { text: 'Идти с Кругловым на Янтарь', next: 'yantar_bunker' }
        ]
      },

      yantar_bunker_alone: {
        location: 'Янтарь. Озеро',
        objective: 'Добраться до бункера учёных',
        radiation: '0.35 мкЗв/ч',
        danger: true,
        sound: 'geiger',
        text: p('Вы идёте один через заражённую местность и выходите к высохшему озеру Янтарь. Пси-фон здесь сильный, голову будто налили свинцом. Посреди болота стоит герметичный бункер учёных.'),
        choices: [
          { text: 'Войти в шлюз бункера', next: 'yantar_bunker' }
        ]
      },

      yantar_bunker: {
        isCheckpoint: true,
        location: 'Янтарь. Бункер Сахарова',
        objective: 'Помочь Сахарову откалибровать пси-шлем',
        radiation: '0.10 мкЗв/ч',
        danger: false,
        sound: 'pda',
        art: 'yantar',
        text: p('В чистом белом отсеке вас встречает пожилой академик Сахаров.') + say('САХАРОВ',
          'Да-да, молодой человек, проходите. Мы изучаем пси-поле над заводом. Под заводом установка, X-16, она превращает сталкеров в зомби. Несколько дней назад туда пошёл наш сотрудник Васильев, со сталкером по прозвищу Призрак. Связи с ними нет.',
          'Без защиты вы в X-16 сойдёте с ума. У меня есть прототип пси-шлема, но его нужно откалибровать. Для этого нужны замеры пси-поля на открытой местности.'
        ),
        choices: [
          { text: 'Выйти с Кругловым на болото для замеров', condition: (s) => s.rescuedKruglov, action: (s) => { s.calibratedPsiHelmet = true; }, next: 'yantar_measurements' },
          { text: 'Выйти на болото и сделать замеры самому', condition: (s) => !s.rescuedKruglov, action: (s) => { s.calibratedPsiHelmet = true; }, next: 'yantar_measurements' }
        ]
      },

      yantar_measurements: {
        location: 'Янтарь. Болото',
        objective: 'Найти тело Васильева и войти в X-16',
        radiation: '0.45 мкЗв/ч',
        danger: true,
        sound: 'drone',
        text: (s) => p(
          'На болоте начинается пси-всплеск. Зомбированные сталкеры с пустыми глазами бредут на звук приборов.',
          s.rescuedKruglov
            ? 'Вы держите периметр, пока Круглов снимает показания с датчиков.'
            : 'Вы отстреливаетесь и между выстрелами переставляете датчики, как объяснил Сахаров. Показания набираются медленно.',
          'В бункере Сахаров отдаёт вам откалиброванный пси-шлем.'
        ) + say('САХАРОВ', 'Готово, шлем настроен. На озере лежит вертолёт, там должно быть тело Васильева. В его КПК карта входа в X-16.'),
        choices: [
          { text: 'Найти тело Васильева и пробраться на завод, в X-16', next: 'lab_x16_inside' }
        ]
      },

      lab_x16_inside: {
        isCheckpoint: true,
        location: 'Лаборатория X-16',
        objective: 'Обыскать лабораторию',
        radiation: '0.50 мкЗв/ч',
        danger: true,
        sound: 'drone',
        art: 'x16',
        text: p(
          'Вы спускаетесь в X-16. Пси-шлем гудит, удерживая излучение. Вокруг огромной многоярусной шахты стоят колбы, в них пульсирует мозговая ткань.',
          'Отовсюду лезут снорки и зомби. По железным мосткам вы пробираетесь к пультам охлаждения и опускаете главный рубильник.'
        ) + voice('УСТАНОВКА X-16 ОТКЛЮЧЕНА. Гул стихает.'),
        choices: [
          { text: 'Обыскать пультовую за установкой', next: 'lab_x16_ghost_body' }
        ]
      },

      lab_x16_ghost_body: {
        location: 'Лаборатория X-16. Пультовая',
        objective: 'Вернуться к Бармену с документами X-16',
        radiation: '0.25 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p('У стены пультовой лежит мёртвый Призрак. Рядом папка с документами по Выжигателю и его КПК. В КПК голосовая запись.') +
          say('ПРИЗРАК (ЗАПИСЬ)',
            'Васильев струсил и сбежал. Я один. Стрелок ушёл на север.',
            'Кто найдёт запись: где искать Стрелка, знает наш общий друг Доктор. Где искать Доктора, знает Проводник. Он часто бывает на Кордоне.'
          ) +
          p('Из документов ясно и другое: Выжигатель мозгов на Радаре, в лаборатории X-10, тоже можно выключить вручную.'),
        choices: [
          { text: 'Выбраться наверх и вернуться к Бармену', action: (s) => { s.hasX16Docs = true; }, next: 'bar_after_x16' }
        ]
      },

      bar_after_x16: {
        isCheckpoint: true,
        location: 'Бар «100 рентген»',
        objective: 'Решить, куда идти дальше',
        radiation: '0.05 мкЗв/ч',
        danger: false,
        sound: 'pda',
        art: 'bar',
        text: p('Бармен разглядывает документы X-16. В них точная схема отключения Выжигателя в X-10.') + say('БАРМЕН',
          'Ну, Меченый, уважаю. Дорога на север теперь есть. Иди на Радар, выруби Выжигатель, а дальше Припять и станция. Там Монолит.'
        ) + p('Но у вас из головы не идёт запись Призрака: «Где искать Доктора, знает Проводник. Он часто бывает на Кордоне».'),
        choices: [
          { text: 'Сначала вернуться на Кордон и найти Проводника', tag: 'канон', next: 'guide_at_cordon' },
          { text: 'Хватит прошлого. Идти на Радар, выключить Выжигатель и прорываться к ЧАЭС', tag: 'прямо к Монолиту', next: 'radar_rush_direct' }
        ]
      },

      guide_at_cordon: {
        location: 'Кордон. У разрушенного моста',
        objective: 'Найти Доктора под Агропромом',
        radiation: '0.05 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        text: p('Вы возвращаетесь на Кордон. У костра сидит седой сталкер в плаще с капюшоном. Это Проводник. Говорят, он знает в Зоне каждую тропу.') + say('ПРОВОДНИК',
          'Здравствуй, Меченый. Слышал о тебе. От Призрака, значит...',
          'Доктор будет ждать тебя в тайнике группы Стрелка, под Агропромом. Иди. Пора тебе узнать, кто ты.'
        ),
        choices: [
          { text: 'Спуститься в подземелья Агропрома к Доктору', action: (s) => { s.metGuide = true; }, next: 'doctor_agroprom_meeting' }
        ]
      },

      doctor_agroprom_meeting: {
        isCheckpoint: true,
        location: 'Подземелья Агропрома. Тайник Стрелка',
        objective: 'Забрать декодер в Припяти, гостиница «Полесье», номер 26',
        radiation: '0.18 мкЗв/ч',
        danger: false,
        sound: 'drone',
        art: 'agroprom',
        text: p(
          'Вы снова в тайнике. Под ногой щёлкает растяжка. Светошумовая граната глушит, и вы падаете на колени.',
          'Из темноты выходит пожилой человек. Он долго смотрит на вас.'
        ) + voice('ДОКТОР: Стрелок... Живой.') +
          p('В КПК у вас по-прежнему одна задача: убить Стрелка.') + say('ДОКТОР',
            'Это ошибка программы. Тебя везли в грузовике смерти и приказали убить самого себя.',
            'Исполнителя желаний нет, это морок. Все, кто до него дошёл, умерли там в бреду.',
            'В Саркофаге есть дверь, за ней те, кто управляет Зоной. Чтобы её открыть, нужен декодер. Мы с ребятами спрятали его в Припяти, в гостинице «Полесье», номер 26. Забери его и узнай, что там.'
          ),
        choices: [
          { text: '«Кажется, я вспоминаю. Я Стрелок. Декодер я заберу.»', action: (s) => { s.metDoctor = true; }, next: 'army_warehouses_barrier' }
        ]
      },

      radar_rush_direct: {
        location: 'Армейские склады. Барьер',
        objective: 'Прорваться к Радару',
        radiation: '0.25 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Копаться в прошлом вы не стали. Вам нужен центр Зоны, Монолит и Исполнитель желаний.',
          'Вы выходите на Армейские склады, к Барьеру. За ним выжженная земля до самого Радара.'
        ),
        choices: [
          { text: 'Прорываться через Барьер к антеннам Выжигателя', next: 'radar_x10' }
        ]
      },

      army_warehouses_barrier: {
        location: 'Армейские склады. Барьер',
        objective: 'Помочь «Свободе» удержать Барьер',
        radiation: '0.20 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: p(
          'Барьер держит «Свобода», отряд Кэпа. Со стороны Радара прёт «Монолит». Вы встаёте рядом со свободовцами, и фанатиков отбрасывают.',
          'Дорога на Радар открыта.'
        ),
        choices: [
          { text: 'Идти через Рыжий лес к Радару', next: 'radar_x10' }
        ]
      },

      radar_x10: {
        isCheckpoint: true,
        location: 'Радар. Лаборатория X-10',
        objective: 'Дойти до Припяти',
        radiation: '0.65 мкЗв/ч',
        danger: true,
        sound: 'drone',
        art: 'radar',
        text: p(
          'Рыжий лес и огромные антенны Радара. Воздух светится, перед глазами встают фантомы. Снайперы «Монолита» бьют из гауссовок.',
          'Пси-шлем Сахарова держит. Вы прорываетесь в бункер X-10, зачищаете зал управления и опускаете рычаг.'
        ) + voice('ВЫЖИГАТЕЛЬ МОЗГОВ ОТКЛЮЧЁН.') +
          p('По всем частотам кричат сталкеры. Сотни людей идут на север, к Припяти.'),
        choices: [
          { text: 'Выбраться из бункера и идти в Припять', action: (s) => { s.scorcherDisabled = true; }, next: 'pripyat_street_fight' }
        ]
      },

      pripyat_street_fight: {
        isCheckpoint: true,
        location: 'Припять. Проспект Ленина',
        objective: (s) => (s.metDoctor ? 'Найти номер 26 в гостинице «Полесье»' : 'Прорваться к ЧАЭС'),
        radiation: '0.45 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        art: 'pripyat',
        text: p('Мёртвый город. Ветер гонит пыль мимо ржавого колеса обозрения. На улицах настоящая война: сталкеры штурмуют укрепления «Монолита».'),
        choices: [
          { text: 'Искать гостиницу «Полесье», номер 26', condition: (s) => s.metDoctor, next: 'pripyat_hotel_cache' },
          { text: 'Прорываться к стадиону «Авангард» и дальше к ЧАЭС', next: 'chnpp_approaches' }
        ]
      },

      pripyat_hotel_cache: {
        location: 'Припять. Гостиница «Полесье», номер 26',
        objective: 'Прорваться к ЧАЭС',
        radiation: '0.30 мкЗв/ч',
        danger: false,
        sound: 'pda',
        text: p(
          'На втором этаже «Полесья» вы выбиваете дверь двадцать шестого номера. За задней стенкой шкафа тайник.',
          'В тайнике декодер к кодовому замку в Саркофаге и дневники Стрелка.'
        ),
        choices: [
          { text: 'Убрать декодер в подсумок и идти к станции', action: (s) => { s.hasDecoder = true; }, next: 'chnpp_approaches' }
        ]
      },

      chnpp_approaches: {
        isCheckpoint: true,
        location: 'ЧАЭС. Внешний периметр',
        objective: 'Добежать до Саркофага до Выброса',
        radiation: '0.90 мкЗв/ч',
        danger: true,
        sound: 'blowout',
        art: 'chnpp',
        text: p('Впереди четвёртый энергоблок. Вокруг него бой: Ми-24 бьют НУРСами, БТРы ломают заграждения, монолитовцы стреляют с крыш из гранатомётов и гауссовок.') +
          alarm('РАЦИЯ: «Всем подразделениям! Фиксируем мощный выброс! До пика три минуты! Всем в укрытие!»') +
          p('Небо багровеет, земля дрожит. Укрыться можно только в Саркофаге, через пролом.'),
        choices: [
          { text: 'Бежать по теплотрассе к пролому в энергоблоке', next: 'sarcophagus_inside' }
        ]
      },

      sarcophagus_inside: {
        isCheckpoint: true,
        location: 'ЧАЭС. Саркофаг',
        objective: 'Выбрать',
        radiation: '0.95 мкЗв/ч',
        danger: true,
        sound: 'drone',
        text: p('Вы вваливаетесь в пролом. Снаружи прокатывается волна Выброса. Здесь тихо, только щёлкает дозиметр, и кто-то шепчет прямо в голове.') +
          voice('ИДИ КО МНЕ... ТЫ ПОЛУЧИШЬ ТО, ЧЕГО ЗАСЛУЖИВАЕШЬ... ТВОЁ ЖЕЛАНИЕ ИСПОЛНИТСЯ...') +
          p(
            'В реакторном зале светится огромный кристалл. Исполнитель желаний.',
            'Сбоку, за завалами, железная лестница. Она ведёт к бронированной двери с кодовым замком.'
          ),
        choices: [
          { text: 'Идти на зов кристалла и загадать желание', tag: 'Исполнитель', next: 'wish_granter_altar' },
          { text: 'Подняться к двери и открыть её декодером', tag: 'канон', condition: (s) => s.hasDecoder, next: 'secret_door_unlock' },
          { text: 'Подняться к двери и попробовать её открыть', condition: (s) => !s.hasDecoder, next: 'secret_door_failed' }
        ]
      },

      secret_door_failed: {
        location: 'ЧАЭС. Бронированная дверь',
        radiation: '0.85 мкЗв/ч',
        danger: true,
        sound: 'pda',
        text: p('Дверь заперта военным электронным шифром. Без декодера её не вскрыть. Остаётся одна дорога, вниз, к кристаллу.'),
        choices: [
          { text: 'Спуститься в реакторный зал', next: 'wish_granter_altar' }
        ]
      },

      wish_granter_altar: {
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Загадать желание',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'drone',
        art: 'monolith',
        text: p('Вы стоите перед кристаллом. По телу проходит тепло, усталость и страх уходят. Голос будто перебирает ваши мысли одну за другой.') +
          voice('Я ВИЖУ ТВОЁ ЖЕЛАНИЕ. НАЗОВИ ЕГО.'),
        choices: [
          { text: '«Хочу быть богатым.»', next: 'ending_wealth' },
          { text: '«Хочу жить вечно.»', next: 'ending_immortal' },
          { text: '«Пусть Зона исчезнет.»', next: 'ending_peace' },
          { text: '«Людей не исправить. Уничтожь их.»', next: 'ending_apocalypse' },
          { text: '«Дай мне власть над всем миром.»', next: 'ending_power' }
        ]
      },

      ending_wealth: {
        ending: 'ending_wealth',
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Заданий нет',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'blowout',
        text: (s) => p(
          `${hero(s)} поднимает руки к потолку. Сверху сыплется золото: монеты, слитки, гайки. Он смеётся и гребёт его горстями.`,
          'Потом трескаются бетонные балки. Плита перекрытия падает и хоронит его под радиоактивным щебнем.'
        )
      },

      ending_immortal: {
        ending: 'ending_immortal',
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Заданий нет',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'drone',
        text: (s) => p(
          'Исполнитель отвечает. По телу ползёт холод. Кровь останавливается, кости и органы твердеют, кожа становится как гранит.',
          `${hero(s)} застывает. В сердце Зоны теперь стоит каменная статуя. Жить она будет вечно.`
        )
      },

      ending_peace: {
        ending: 'ending_peace',
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Заданий нет',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'guitar',
        text: (s) => p(
          `Вспыхивает белый свет, стены Саркофага тают. Перед ${s.metDoctor ? 'Стрелком' : 'Меченым'} луг: трава, ромашки, бабочки, чистое небо и солнце.`,
          'Он улыбается и ложится в траву. На самом деле он лежит на грязном бетоне энергоблока. Вспышка кристалла выжгла ему глаза. Он бредит лугом, пока не умирает.'
        )
      },

      ending_apocalypse: {
        ending: 'ending_apocalypse',
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Заданий нет',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'blowout',
        text: (s) => p(
          'Монолит отвечает гулом. В голову хлещут видения: горящие города, миллиарды умирающих, крики детей.',
          `Мозг не выдерживает. Сосуды лопаются, и ${hero(s)} падает мёртвым у подножия кристалла.`
        )
      },

      ending_power: {
        ending: 'ending_power',
        location: 'ЧАЭС. Исполнитель желаний',
        objective: 'Заданий нет',
        radiation: '1.00 мкЗв/ч',
        danger: true,
        sound: 'drone',
        text: (s) => p(
          'Кристалл начинает вращаться и затягивает разум внутрь. Тело оседает на пол, пустое.',
          `То, что было ${s.metDoctor ? 'Стрелком' : 'Меченым'}, растворяется в Монолите. Ещё одна батарейка для пси-сети, которая держит Зону.`
        )
      },

      secret_door_unlock: {
        location: 'ЧАЭС. Секретная лаборатория',
        objective: 'Найти тех, кто за дверью',
        radiation: '0.50 мкЗв/ч',
        danger: true,
        sound: 'pda',
        text: p(
          'Вы подносите декодер к замку. По экранчику бегут зелёные строки: 25%... 60%... 100%. ДОСТУП РАЗРЕШЁН. Засовы лязгают.',
          'За дверью лаборатория. Семеро монолитовцев в экзоскелетах пытаются вас остановить и не могут. Посреди зала генераторы, они что-то питают. Вы расстреливаете батареи одну за другой.',
          'В центре зала загорается голубая голограмма: человек в лабораторном халате.'
        ),
        choices: [
          { text: 'Говорить с голограммой', next: 'c_consciousness_dialogue' }
        ]
      },

      c_consciousness_dialogue: {
        location: 'ЧАЭС. Лаборатория «О-Сознания»',
        objective: 'Выбрать',
        radiation: '0.20 мкЗв/ч',
        danger: false,
        sound: 'drone',
        art: 'hologram',
        text: say('О-СОЗНАНИЕ',
          'Здравствуй, Стрелок. Мы ждали. Мы называем себя «О-Сознание». Нас несколько учёных, наши разумы объединены в одну сеть.',
          'Вокруг Земли есть ноосфера, информационное поле. В нём мысли, чувства и память всего живого. В 2006 году мы подключились к ноосфере. Хотели убрать из людей злобу, агрессию, зависть. Случился пробой. Энергия ноосферы вышла в наш мир, и появилась Зона.',
          'Мы сдерживаем разрыв. Ты подошёл к нам слишком близко, и мы отправили за тобой грузовик смерти. В задание твоего КПК вкралась ошибка: тебе приказали убить себя самого.',
          'Выбирай. Ляг в свободную капсулу и стань одним из нас. Или откажись.'
        ),
        choices: [
          { text: '«Хорошо. Я останусь с вами.»', tag: 'альтернативный финал', next: 'ending_join_c_consciousness' },
          { text: '«Зону сделали вы. Я вас уничтожу.»', tag: 'истинный финал', next: 'teleport_rooftop_battle' }
        ]
      },

      ending_join_c_consciousness: {
        ending: 'ending_join_c_consciousness',
        back: 'c_consciousness_dialogue',
        backText: 'Вернуться к разговору с «О-Сознанием»',
        location: 'ЧАЭС. Капсула «О-Сознания»',
        objective: 'Заданий нет',
        radiation: '0.20 мкЗв/ч',
        danger: false,
        sound: 'drone',
        text: p(
          'Стрелок поднимается к пустой стеклянной капсуле. К вискам липнут датчики. Крышка закрывается, капсулу заполняет раствор.',
          'Его сознание уходит в ноосферу. Теперь он вместе с ними держит разрыв и смотрит за Зоной изнутри.'
        )
      },

      teleport_rooftop_battle: {
        location: 'ЧАЭС. Крыши энергоблоков',
        objective: 'Добраться до капсул',
        radiation: '0.60 мкЗв/ч',
        danger: true,
        sound: 'gunshot',
        text: voice('О-СОЗНАНИЕ: Ты выбрал. Ты умрёшь.') + p(
          'Голограмма гаснет. Вспышка, и вы стоите на крыше станции.',
          'Дальше одни порталы. Вы прыгаете из одного в другой, по трубам и переходам, отстреливаясь от монолитовцев. Последний портал выбрасывает вас в зал с капсулами. В них спят учёные «О-Сознания».'
        ),
        choices: [
          { text: 'Расстрелять капсулы', next: 'ending_true_freedom' }
        ]
      },

      ending_true_freedom: {
        ending: 'ending_true_freedom',
        location: 'За пределами Зоны',
        objective: 'Заданий нет',
        radiation: '0.00 мкЗв/ч',
        danger: false,
        sound: 'guitar',
        text: p(
          'Очереди бьют по стеклу. Сыплются искры, воют сирены. Связь «О-Сознания» рвётся.',
          '. . .',
          'Тихо. Дозиметр молчит. Никто не стреляет.',
          'Стрелок лежит в траве. Тепло, светит солнце, где-то поют птицы. На травинку у его руки садится стрекоза.',
          'Он закрывает глаза.'
        ) + voice('СТРЕЛОК: Не знаю, правильно ли я поступил. Наверное, никогда не узнаю. Но я жив. И я свободен.')
      }
    };
  }
}

window.appStalker = new AppStalker();
