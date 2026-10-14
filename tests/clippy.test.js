const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

global.localStorage = {
  store: {},
  getItem(k) { return k in this.store ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const spoken = [];
const runs = [];
const opened = [];
const scheduled = [];

const makeVfs = () => {
  const rootNode = {
    name: 'Desktop',
    children: {
      'My Computer': {
        children: {
          'C:': {
            children: {
              'Program Files': { type: 'folder', children: {} },
              'My Documents': { type: 'folder', children: { Downloads: { type: 'folder', children: {} } } }
            }
          }
        }
      },
      'Recycle Bin': { items: [] }
    }
  };
  return {
    root: rootNode,
    saved: 0,
    resolvePath(parts) {
      if (parts[0] === 'Desktop') parts = parts.slice(1);
      let node = this.root;
      for (const p of parts) {
        if (!node || !node.children || !node.children[p]) return null;
        node = node.children[p];
      }
      return node;
    },
    saveToStorage() { this.saved++; },
    writeFile(parts, name, content) {
      const folder = this.resolvePath(parts);
      if (!folder || !folder.children) return false;
      folder.children[name] = { type: 'file', name, content };
      return true;
    },
    getRecycleBinItems() { return this.root.children['Recycle Bin'].items; },
    restoreRecycleBinItem(name) {
      const bin = this.root.children['Recycle Bin'];
      const i = bin.items.findIndex(x => x.name === name);
      if (i < 0) return { success: false };
      bin.items.splice(i, 1);
      return { success: true };
    }
  };
};

const makeWindows = () => new Map();

global.window = {
  addEventListener() {},
  vfs: makeVfs(),
  winManager: {
    windows: makeWindows(),
    activeWindowId: null,
    minimized: [],
    opened: [],
    minimizeWindow(id) { this.minimized.push(id); },
    minimizeAll() {},
    cascadeWindows() {},
    bringToTop() {},
    restoreWindow() {},
    closeWindow(id) { this.windows.delete(id); },
    openDialog(cfg) { this.opened.push(cfg); return { id: 'dialog_test' }; },
    createWindow(cfg) { const w = { id: cfg.id, element: null, cfg }; this.windows.set(cfg.id, w); return w; }
  },
  appDialogs: { executeRunCommand(cmd) { runs.push(['cmd', cmd]); }, openHelp(topic) { runs.push(['help', topic]); }, openRunDialog() {} },
  appOutlook: { myFrom() { return 'Alexey Ivanov <alexey@mail98.com>'; }, schedule(mail, delay) { scheduled.push([mail, delay]); }, save() {} },
  appNotepad: { open(name, content) { opened.push([name, content]); } },
  gameManager: {
    catalog: {
      doom: { steam: true, title: 'DOOM 98', subtitle: 'Демоны Марса', genre: 'Шутер', tags: ['Демоны'], priceDisplay: '$9.99', launch() { runs.push(['launch', 'doom']); } },
      winamp: { isApp: true, title: 'Winamp' }
    },
    state: { installed: ['winamp'], purchased: ['winamp'] },
    listeners: [],
    isInstalled(id) { return this.state.installed.includes(id); },
    addListener(fn) { this.listeners.push(fn); },
    showInSteam(id) { runs.push(['steam', id]); }
  },
  appIE: { favorites: [['http://www.clippy98.com', "Скрепыш '98 (Гардероб Помощника)"], ['http://www.youvid.com', 'YouVid (Видео от каждого)']] }
};

const clippy = {
  visible: true,
  running: true,
  annoyance: 'normal',
  state: 'idle',
  tips: ['Совет один.', 'Совет два.'],
  bulb: false,
  anims: [],
  sounds: [],
  reactions: [],
  _speakCount: 0,
  charEl: { classList: { add() {}, remove() {} } },
  speak(text, actions = [], mood = '📎', duration, opts) { this._speakCount++; spoken.push({ text, actions, mood, opts }); },
  opt(name) { return window.clippyOptions ? window.clippyOptions.get(name) : undefined; },
  isRunning() { return this.running; },
  setBulb(on) { this.bulb = on; },
  sound(name) { this.sounds.push(name); },
  animate(name) { this.anims.push(name); },
  flash() {},
  balloonOpen() { return false; },
  countReaction(kind) { this.reactions.push(kind); },
  show() { this.visible = true; this.running = true; },
  launch(reason) { this.launched = reason; this.visible = true; this.running = true; },
  kill() { this.running = false; this.visible = false; },
  hide() { this.visible = false; },
  retire() { this.retired = true; },
  ask(q) { this.asked = q; },
  openInIE(url) { runs.push(['url', url]); },
  isGameWindow(id) { return id === 'app_doom'; },
  sayRandomTip() { spoken.push({ text: 'random tip', actions: [] }); },
  resetIdleTimer() {},
  tapScreen() {},
  setAccessory() {},
  updateTray() {},
  startQuiz() {},
  triggerBossKey() {},
  openWardrobeSite() {}
};
window.appClippy = clippy;

for (const file of ['clippy-options', 'clippy-actors', 'clippy-help', 'clippy-tips', 'clippy-letters', 'clippy-system', 'clippy-talk']) {
  eval(read(`js/apps/${file}.js`));
}
const options = window.clippyOptions;
const actors = window.clippyActors;
const help = window.clippyHelp;
const tips = window.clippyTips;
const letters = window.clippyLetters;
const system = window.clippySystem;
const talk = window.clippyTalk;

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const last = () => spoken[spoken.length - 1];
const press = (label) => {
  const btn = last().actions.find(a => a.text.includes(label));
  assert.ok(btn, `no button "${label}" in: ${last().actions.map(a => a.text).join(' | ')}`);
  btn.action();
};

test('options: defaults, persistence and sanitizing', () => {
  assert.strictEqual(options.get('enabled'), true);
  assert.strictEqual(options.get('tipsMode'), 'bulb');
  assert.strictEqual(options.set('annoyance', 'chaos'), true);
  assert.strictEqual(JSON.parse(localStorage.getItem('win98_clippy_options')).annoyance, 'chaos');
  options.set('annoyance', 'nonsense');
  assert.strictEqual(options.get('annoyance'), 'normal');
  const fresh = new options.constructor();
  assert.strictEqual(fresh.get('annoyance'), 'normal');
});

test('options: settings mirror into the registry and come back after a restart', () => {
  const registry = { name: 'My Computer', children: { HKEY_CURRENT_USER: { children: {} } } };
  window.appRegEdit = { registry, saveRegistry() { localStorage.setItem('win98_registry_data', JSON.stringify(this.registry)); } };
  options.set('sounds', false);
  const key = options.findKey(registry, options.assistantPath);
  assert.ok(key, 'assistant key created');
  assert.deepStrictEqual(key.values.AsstSound, { type: 'REG_DWORD', data: 0 });
  assert.strictEqual(key.values.AsstFile.data, 'CLIPPIT.ACT');
  options.writeFavorite('Скрепыш');
  assert.strictEqual(registry.children.HKEY_CURRENT_USER.values['Любимый_помощник'].data, 'Скрепыш');
  key.values.AsstSound.data = 1;
  key.values.AsstFile.data = 'ROCKY.ACS';
  key.values.AsstAnnoyance.data = 'quiet';
  window.appRegEdit.saveRegistry();
  delete window.appRegEdit;
  const fresh = new options.constructor();
  assert.strictEqual(fresh.get('sounds'), true);
  assert.strictEqual(fresh.get('annoyance'), 'quiet');
  assert.strictEqual(fresh.takeRegistryFile(), 'ROCKY.ACS');
  assert.strictEqual(fresh.takeRegistryFile(), null);
  options.set('sounds', true);
  options.set('annoyance', 'normal');
});

test('help: finds answers by everyday words', () => {
  const top = (q) => (help.search(q, 3)[0] || {}).entry;
  assert.strictEqual(top('как сохранить файл').id, 'save');
  assert.strictEqual(top('сменить обои').id, 'wallpaper');
  assert.strictEqual(top('программа зависла').id, 'hang');
  assert.strictEqual(top('очистить корзину').id, 'empty-bin');
  assert.strictEqual(top('я случайно удалил файл').id, 'restore');
  assert.strictEqual(top('doom').id, 'game:doom');
  assert.strictEqual(top('youvid').id, 'video');
  assert.deepStrictEqual(help.search('абвгд'), []);
});

test('help: answers run real system actions', () => {
  runs.length = 0;
  help.run(help.byId('wallpaper'));
  help.run(help.byId('help'));
  help.run(help.byId('themes'));
  assert.deepStrictEqual(runs, [['cmd', 'desk.cpl'], ['help', 'welcome'], ['url', 'http://www.themeworld98.com']]);
  help.run(help.search('doom')[0].entry);
  assert.deepStrictEqual(runs[runs.length - 1], ['steam', 'doom']);
});

test('help: ask balloon has an input, suggestions follow the active window', () => {
  window.winManager.activeWindowId = 'app_notepad_1';
  help.openAsk();
  assert.ok(last().opts.input, 'balloon has an input field');
  assert.ok(last().actions.some(a => a.text.includes('Как сохранить документ')));
  last().opts.input.onSubmit('где игры');
  assert.ok(last().text.includes('где игры'));
  assert.ok(last().actions.some(a => a.text.includes('Где взять игры')));
  last().opts.input.onSubmit('qwerty zzz');
  assert.ok(last().actions.some(a => a.text.includes('WebSeeker')));
  window.winManager.activeWindowId = null;
  assert.ok(help.icqAnswer('как сохранить документ?').includes('Ctrl+S'));
});

test('tips: light bulb queues tips, respects cooldown and mute', () => {
  localStorage.removeItem('win98_clippy_tips');
  tips.state = tips.load();
  tips.pending = [];
  assert.strictEqual(tips.trigger('many-windows'), true);
  assert.strictEqual(clippy.bulb, true);
  assert.strictEqual(tips.trigger('many-windows'), false);
  tips.showNext();
  assert.ok(last().text.includes('каскадом'));
  assert.strictEqual(clippy.bulb, false);
  press('Больше не показывать');
  tips.state.seen['many-windows'] = 0;
  assert.strictEqual(tips.trigger('many-windows'), false);
  tips.reset();
  assert.strictEqual(tips.trigger('many-windows'), true);
  options.set('tipsMode', 'balloon');
  tips.pending = [];
  const before = spoken.length;
  assert.strictEqual(tips.trigger('bin-full'), true);
  assert.strictEqual(spoken.length, before + 1);
  options.set('tipsMode', 'bulb');
});

test('tips: observation rules fire from real behaviour', () => {
  tips.reset();
  tips.pending = [];
  tips.onMinimize();
  tips.onMinimize();
  assert.ok(!tips.pending.some(p => p.id === 'show-desktop'));
  tips.onMinimize();
  assert.ok(tips.pending.some(p => p.id === 'show-desktop'));
  tips.onTyping('np1', 120);
  assert.ok(!tips.pending.some(p => p.id === 'save-reminder'));
  tips.onTyping('np1', 420);
  assert.ok(tips.pending.some(p => p.id === 'save-reminder'));
  tips.onSaved('notepad', 'a.txt', 'np2', 900);
  tips.onTyping('np2', 1000);
  assert.strictEqual(tips.pending.filter(p => p.id === 'save-reminder').length, 1);
  talk.state.visits = 1;
  assert.strictEqual(tips.tipOfDay(), false);
  talk.state.visits = 2;
  assert.strictEqual(tips.tipOfDay(), true);
  assert.strictEqual(tips.tipOfDay(), false);
});

test('letters: the wizard writes a letter into the open notepad', () => {
  const area = { value: 'Уважаемый', focus() {} };
  const win = { id: 'app_notepad_7', element: { isConnected: true, querySelector: sel => (sel === '.notepad-textarea' ? area : null) } };
  letters.startWizard({ kind: 'notepad', win });
  assert.ok(last().text.includes('Кому пишем'));
  press('Начальнику');
  press('Попросить отпуск');
  press('Официально');
  assert.ok(area.value.startsWith(letters.dayStamp()));
  assert.ok(area.value.includes('Уважаемое руководство!') && area.value.includes('отпуск') && area.value.includes('С уважением'));
  assert.ok(last().text.includes('в Блокнот'));
  letters.startWizard({ kind: 'new' });
  press('Другу');
  press('Вернуть дискету');
  press('С юмором');
  assert.strictEqual(opened[opened.length - 1][0], 'Письмо.txt');
  assert.ok(opened[opened.length - 1][1].includes('дискету'));
});

test('letters: a greeting in the text triggers the classic offer once', () => {
  letters.offered.clear();
  const win = { id: 'app_notepad_9' };
  assert.strictEqual(letters.onTyping('notepad', win, 'Привет'), false);
  assert.strictEqual(letters.onTyping('notepad', win, 'Привет,'), true);
  assert.ok(last().text.includes('Похоже, вы пишете письмо'));
  assert.strictEqual(letters.onTyping('notepad', win, 'Привет, Миша'), false);
  press('Больше не показывать этот совет');
  assert.strictEqual(options.get('letters'), false);
  letters.offered.clear();
  assert.strictEqual(letters.onTyping('notepad', { id: 'x' }, 'Дорогой друг!'), false);
  options.set('letters', true);
});

test('letters: saves are counted, the first one goes to the diary', () => {
  talk.state = talk.defaultState();
  letters.onSaved('notepad', 'Отчёт.txt');
  assert.strictEqual(talk.state.saves, 1);
  assert.ok(last().text.includes('Отчёт.txt'));
  assert.ok(talk.state.diary.some(e => e.id === 'firstSave'));
  const diary = window.vfs.resolvePath(actors.actorsPath).children['Дневник Скрепыша.txt'];
  assert.ok(diary && diary.content.includes('Ctrl+S'));
  letters.onDiscarded('notepad', 'Черновик');
  assert.ok(last().text.includes('не стали сохранять'));
});

test('letters: story mail is forwarded to Outlook once', () => {
  scheduled.length = 0;
  assert.strictEqual(letters.deliverMail('rocky', 10), true);
  assert.strictEqual(letters.deliverMail('rocky', 10), false);
  assert.strictEqual(scheduled.length, 1);
  const [mail, delay] = scheduled[0];
  assert.strictEqual(delay, 10);
  assert.ok(mail.from.includes('clippy@clippy98.com'));
  assert.ok(mail.subject.startsWith('FW:') && mail.body.includes('Rocky'));
});

test('actors: Actors folder, Rocky file after chapter one, file opening', () => {
  actors.ensureFolder();
  const folder = window.vfs.resolvePath(actors.actorsPath);
  ['CLIPPIT.ACT', 'DOT.ACT', 'GENIUS.ACT', 'HOVER.ACT', 'LOGO.ACT', 'MNATURE.ACT', 'POWERPUP.ACT', 'SCRIBBLE.ACT', 'WILL.ACT']
    .forEach(f => assert.ok(folder.children[f], f));
  assert.ok(!folder.children['ROCKY.ACS']);
  assert.ok(window.vfs.resolvePath(actors.officePath).children['CLIPPY.EXE']);
  assert.strictEqual(actors.addRockyFile(), true);
  assert.ok(folder.children['ROCKY.ACS']);
  actors.openFile('GENIUS.ACT');
  assert.ok(last().text.includes('Гений'));
  actors.actors.forEach(a => assert.ok(actors.portrait(a.id).includes('<svg'), a.id));
  assert.ok(actors.rockySvg().includes('rocky-tail'));
});

test('system: clippy.exe in Task Manager, end task kills and the return is remembered', () => {
  talk.state = talk.defaultState();
  talk.state.visits = 3;
  clippy.running = true;
  assert.strictEqual(system.processList()[0].imageName, 'clippy.exe');
  system.onEndTask();
  const dlg = window.winManager.opened[window.winManager.opened.length - 1];
  assert.ok(dlg.message.includes('clippy.exe'));
  dlg.buttons[0].onClick();
  assert.strictEqual(clippy.running, false);
  assert.deepStrictEqual(system.processList(), []);
  assert.strictEqual(talk.state.kills, 1);
  system.onLaunched('tray');
  assert.ok(last().text.includes('сняли с задачи'));
  assert.strictEqual(talk.state.killedAt, 0);
  talk.state.kills = 3;
  talk.state.killedAt = Date.now();
  assert.strictEqual(talk.afterKillNode(), 'backAfterKill3');
});

test('system: ICQ replies use the help index and the mood', () => {
  talk.state.affinity = 0;
  assert.ok(system.icqReply('привет').includes('Скрепыш'));
  assert.ok(system.icqReply('как поставить заставку?').includes('Заставка'));
  talk.state.affinity = 15;
  assert.ok(system.icqReply('привет').includes('любимый'));
  clippy.running = true;
  clippy.visible = false;
  assert.deepStrictEqual(system.icqStatus(), ['na', 'В трее, у часов']);
  clippy.visible = true;
});

test('system: DOS command, holidays and Steam installs', () => {
  assert.ok(system.dosCommand(['/?']).some(l => l.includes('/STATUS')));
  assert.ok(system.dosCommand(['/status'])[0].includes('PID 1997'));
  system.dosCommand(['как', 'сменить', 'обои']);
  assert.strictEqual(clippy.asked, 'как сменить обои');
  assert.strictEqual(system.todayEvent(new Date(1998, 10, 19)), 'dayBirthday');
  assert.strictEqual(system.todayEvent(new Date(1998, 5, 25)), 'dayWin98');
  assert.strictEqual(system.todayEvent(new Date(1998, 8, 13)), 'dayProgrammer');
  assert.strictEqual(system.todayEvent(new Date(1998, 3, 1)), 'dayAprilFools');
  assert.strictEqual(system.todayEvent(new Date(1998, 2, 3)), null);
  system.watchGames();
  const gm = window.gameManager;
  gm.state = { installed: ['winamp', 'doom'], purchased: ['winamp', 'doom'] };
  gm.listeners.forEach(fn => fn(gm.state));
  assert.ok(last().text.includes('DOOM 98'));
  press('Играть');
  assert.deepStrictEqual(runs[runs.length - 1], ['launch', 'doom']);
});

test('system: deleting his letter and unsaved documents before shutdown', () => {
  window.vfs.root.children['Recycle Bin'].items.push({ name: 'Письмо от Скрепыша.txt' });
  system.onFileDeleted(['My Computer', 'C:', 'My Documents'], { name: 'Письмо от Скрепыша.txt' });
  assert.ok(last().text.includes('наизусть'));
  press('верни');
  assert.strictEqual(window.vfs.getRecycleBinItems().length, 0);
  window.winManager.windows.set('app_notepad_5', { id: 'app_notepad_5', title: 'Безымянный - Блокнот', isModified: () => true });
  system.onShutdownDialog();
  assert.ok(last().text.includes('Безымянный'));
  window.winManager.windows.delete('app_notepad_5');
  system.onShutdownDialog();
  assert.ok(last().text.includes('проверил'));
});

test('story: chapters 6 to 9 need new sessions and end with a kind choice', () => {
  talk.state = talk.defaultState();
  Object.assign(talk.state, { arc: 5, talks: 12, affinity: 8, visits: 4, arcVisit: 4 });
  assert.strictEqual(talk.arcReady(), false);
  talk.state.visits = 5;
  assert.strictEqual(talk.arcReady(), true);
  assert.ok(talk.arcTopic().includes('Office 2000'));
  talk.play('arc6');
  press('Прочитай');
  press('Power Pup');
  press('Напиши ему');
  assert.strictEqual(talk.state.arc, 6);
  assert.ok(window.vfs.resolvePath(actors.actorsPath).children['Письмо для Power Pup.txt']);
  assert.strictEqual(talk.arcReady(), false);
  Object.assign(talk.state, { visits: 6, talks: 14 });
  talk.play('arc7');
  press('Зови');
  press('Привет, Rocky');
  press('Спроси');
  press('Дай ему совет');
  press('Хороший совет');
  assert.strictEqual(talk.state.arc, 7);
  Object.assign(talk.state, { visits: 7, talks: 16, reactions: { app: 40, site: 12 }, questions: 3 });
  talk.play('arc8');
  assert.ok(last().text.includes('52'));
  press('Как по-другому');
  press('Давай попробуем');
  assert.strictEqual(options.get('appReactions'), false);
  assert.strictEqual(options.get('siteReactions'), false);
  Object.assign(talk.state, { visits: 8, talks: 18 });
  talk.setFlag('promise');
  talk.play('arc9');
  press('Ты не мешал');
  assert.ok(last().text.includes('Освобождаю'));
  press('Снять галочку');
  assert.strictEqual(talk.state.arc, 9);
  assert.ok(talk.hasFlag('xpOff'));
  assert.strictEqual(options.get('enabled'), false);
  assert.ok(window.vfs.root.children['Если соскучитесь.txt']);
  assert.ok(talk.state.diary.some(e => e.id === 'arc9off'));
  talk.play('afterArc');
  assert.ok(last().text.includes('в трее'));
  options.set('enabled', true);
  options.set('appReactions', true);
  options.set('siteReactions', true);
});

const AppClippy = eval(`${read('js/apps/clippy.js').replace('window.appClippy = new AppClippy();', '')}; AppClippy`);
const makeCore = () => {
  const c = Object.create(AppClippy.prototype);
  c.spoken = [];
  c.visible = true;
  c.running = true;
  c.annoyance = 'normal';
  c.activeAccessories = new Set();
  c.classes = new Set();
  c.container = {
    classList: { add: x => c.classes.add(x), remove: x => c.classes.delete(x), toggle() {} },
    style: {},
    contains: () => false
  };
  c.charEl = {
    classList: { add() {}, remove() {} },
    getBoundingClientRect: () => ({ left: 712, top: 486, right: 780, bottom: 562, width: 68, height: 76 })
  };
  c.speak = (text, actions = [], mood = '') => c.spoken.push({ text, actions, mood });
  c.setGlasses = () => {};
  c.updateBalloonPlacement = () => {};
  return c;
};

test('core: boss key hides every game window, not just the old list', () => {
  const c = makeCore();
  const wm = window.winManager;
  wm.windows = new Map([
    ['app_doom', { id: 'app_doom', isMinimized: false }],
    ['app_minesweeper', { id: 'app_minesweeper', isMinimized: false }],
    ['app_notepad_1', { id: 'app_notepad_1', isMinimized: false }],
    ['app_winamp', { id: 'app_winamp', isMinimized: false }]
  ]);
  wm.minimized = [];
  assert.strictEqual(c.isGameWindow('app_doom'), true);
  assert.strictEqual(c.isGameWindow('app_winamp'), false);
  assert.strictEqual(c.isGameWindow('app_notepad_1'), false);
  c.triggerBossKey();
  assert.deepStrictEqual(wm.minimized.sort(), ['app_doom', 'app_minesweeper']);
  assert.ok(c.spoken[0].text.includes('2 игровых окон'));
  wm.windows = new Map();
});

test('core: quiz round has five shuffled questions and a perfect round unlocks the crown', () => {
  const c = makeCore();
  c.quizQuestions = Array.from({ length: 9 }, (_, i) => ({
    q: `Вопрос ${i}`, winText: 'да', failText: 'нет',
    options: [{ text: 'верно', correct: true }, { text: 'мимо', correct: false }, { text: 'тоже мимо', correct: false }]
  }));
  c.quizRoundSize = 5;
  c.quizHighScore = 0;
  c.quizAced = false;
  c.startQuiz();
  assert.strictEqual(c.quizRound.length, 5);
  assert.ok(c.spoken[0].text.includes('вопрос 1 из 5'));
  for (let i = 0; i < 5; i++) {
    c.spoken[c.spoken.length - 1].actions.find(a => a.text.includes('верно')).action();
    c.spoken[c.spoken.length - 1].actions[0].action();
  }
  assert.ok(c.spoken[c.spoken.length - 1].text.includes('5 из 5'));
  assert.strictEqual(c.quizAced, true);
  assert.strictEqual(localStorage.getItem('win98_clippy_quiz_aced'), 'true');
});

test('core: program comments follow the option and he moves out of the way of input fields', () => {
  const c = makeCore();
  let counted = 0;
  c.countReaction = () => { counted++; };
  options.set('appReactions', false);
  c.onWindowOpened('app_doom', 'DOOM', null);
  assert.strictEqual(counted, 0);
  options.set('appReactions', true);
  c.onWindowOpened('app_calculator', 'Калькулятор', null);
  assert.strictEqual(counted, 1);
  global.window.innerWidth = 800;
  global.window.innerHeight = 600;
  const field = {
    matches: () => true,
    getBoundingClientRect: () => ({ left: 640, top: 520, right: 790, bottom: 542, width: 150, height: 22 })
  };
  assert.strictEqual(c.maybeMoveAway(field), true);
  assert.strictEqual(c.container.style.left, '20px');
  options.set('moveAway', false);
  assert.strictEqual(c.maybeMoveAway(field), false);
  options.set('moveAway', true);
});

console.log(`clippy: ${passed} passed`);
process.exit(0);
