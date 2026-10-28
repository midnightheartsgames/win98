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
      winamp: { isApp: true, title: 'Winamp' },
      kotor98_demo: { cdDemo: true, title: 'Star Wars: Knights of the Old Republic 98 Demo', subtitle: 'Тарис', genre: 'RPG', tags: ['Джедаи'], setupExe: 'kotor98demo.exe', launch() { runs.push(['launch', 'kotor98_demo']); } }
    },
    demoRenames: { kotor98: 'kotor98_demo' },
    state: { installed: ['winamp'], purchased: ['winamp'] },
    listeners: [],
    isInstalled(id) { return this.state.installed.includes(id); },
    addListener(fn) { this.listeners.push(fn); },
    showInSteam(id) { runs.push(['steam', id]); },
    showOnCd(id) { runs.push(['cd', id]); }
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

test('help: Igromania CD demos point to the disc instead of Steam', () => {
  const entry = help.search('knights of the old republic', 3)[0].entry;
  assert.strictEqual(entry.id, 'game:kotor98_demo');
  assert.ok(entry.q.includes('Демоверсия на диске «Игромании»'));
  assert.ok(entry.a.includes('kotor98demo.exe') && !entry.a.includes('продаётся в Steam'));
  runs.length = 0;
  help.run(entry);
  assert.deepStrictEqual(runs, [['cd', 'kotor98_demo']]);
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
  assert.strictEqual(c.isGameWindow('app_kotor98'), true);
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

test('system: mouse click disable meme wakes Clippy with blocked-click count and interactive replies', () => {
  clippy.visible = false;
  clippy.running = false;
  system.onMouseClicksRescued(4, 1);
  assert.strictEqual(clippy.visible, true);
  assert.strictEqual(clippy.running, true);
  assert.ok(last().text.includes('отключили щелчки мыши'));
  assert.ok(last().text.includes('4 раза'));
  assert.strictEqual(last().actions.length, 3);
  press('Зачем вообще нужна');
  assert.ok(last().text.includes('Microslop'));
  system.onMouseClicksRescued(0, 2);
  assert.ok(last().text.includes('Опять эта галочка'));
  press('Спасибо');
  assert.ok(last().text.includes('Всегда пожалуйста'));
});

test('cpanel: Mouse Properties settings, disable mouse clicking blocker, and 5s Clippy rescue', () => {
  const listeners = {};
  global.window.addEventListener = (evt, fn) => {
    if (!listeners[evt]) listeners[evt] = [];
    listeners[evt].push(fn);
  };
  global.window.removeEventListener = (evt, fn) => {
    if (!listeners[evt]) return;
    listeners[evt] = listeners[evt].filter(x => x !== fn);
  };
  global.document = {
    body: {
      dataset: {},
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); }
      },
      appendChild() {}
    },
    createElement: () => ({
      className: '',
      style: {},
      innerHTML: '',
      appendChild() {}
    })
  };
  global.Icons = new Proxy({}, { get: () => '<svg></svg>' });

  const AppCPanel = eval(`${read('js/apps/cpanel-applets.js').replace('window.appCPanel = new AppCPanel();', '')}; AppCPanel`);
  const cp = new AppCPanel();
  assert.strictEqual(cp.rescueDelayMs, 5000);
  assert.strictEqual(cp.mouseClicksDisabled, false);
  assert.ok(cp.renderIsoMouseSvg(false, false).includes('id="vis-left"'));
  assert.ok(cp.renderJackBoxSvg(true).includes('polygon'));
  assert.ok(cp.renderCursorRoleSvg('dino', 'dino').includes('<svg'));

  cp.saveMouseSettings({
    handedness: 'left',
    doubleClickSpeed: 8,
    scheme: 'dino',
    customSchemes: { Retro: '3d' },
    pointerSpeed: 9,
    pointerTrails: true,
    trailLength: 7
  });
  assert.strictEqual(global.document.body.dataset.cursorScheme, 'dino');
  assert.strictEqual(global.document.body.dataset.mouseHandedness, 'left');
  assert.strictEqual(cp.loadMouseSettings().doubleClickSpeed, 8);

  const mockChk = { checked: true };
  const mockDesc = { classList: { add() {}, remove() {} }, textContent: '' };
  const mockIso = { classList: { add() {}, remove() {} }, getBoundingClientRect: () => ({}) };
  const mockDialogEl = {
    querySelector(sel) {
      if (sel === '#mouse-disable-clicks') return mockChk;
      if (sel === '#mouse-disable-desc') return mockDesc;
      if (sel === '#mouse-iso-svg') return mockIso;
      return null;
    }
  };

  cp.disableMouseClicking(mockDialogEl);
  assert.strictEqual(cp.mouseClicksDisabled, true);
  assert.strictEqual(global.document.body.classList.classes.has('win-mouse-clicks-disabled'), true);
  assert.ok(listeners.mousedown && listeners.mousedown.length > 0);

  let prevented = 0;
  listeners.mousedown[0]({
    type: 'mousedown',
    preventDefault() { prevented++; },
    stopPropagation() {},
    stopImmediatePropagation() {}
  });
  listeners.mousedown[0]({
    type: 'mousedown',
    preventDefault() { prevented++; },
    stopPropagation() {},
    stopImmediatePropagation() {}
  });
  assert.strictEqual(prevented, 2);
  assert.strictEqual(cp.blockedClicks, 2);

  const spokenBefore = spoken.length;
  cp.rescueMouseClicks(mockDialogEl);
  assert.strictEqual(cp.mouseClicksDisabled, false);
  assert.strictEqual(mockChk.checked, false);
  assert.strictEqual(global.document.body.classList.classes.has('win-mouse-clicks-disabled'), false);
  assert.ok(spoken.length > spokenBefore);
  assert.ok(last().text.includes('2 раза'));
});

test('cpanel: Add/Remove Programs (appwiz.cpl) categories, tri-state state, uninstall, boot disk A:, and Clippy reactions', () => {
  localStorage.removeItem('win98_appwiz_state');
  const AppCPanel = eval(`${read('js/apps/cpanel-applets.js').replace('window.appCPanel = new AppCPanel();', '')}; AppCPanel`);
  const cp = new AppCPanel();

  const cats = cp.getAppWizCategories();
  assert.strictEqual(cats.length, 9);
  const state = cp.loadAppWizState();

  const accCat = cats.find(c => c.id === 'accessibility');
  const accInfo = cp.getCategoryInstallState(accCat, state.components);
  assert.strictEqual(accInfo.status, 'partial');
  assert.strictEqual(accInfo.checkedCount, 1);
  assert.strictEqual(accInfo.total, 2);

  const addrCat = cats.find(c => c.id === 'addressbook');
  const addrInfo = cp.getCategoryInstallState(addrCat, state.components);
  assert.strictEqual(addrInfo.status, 'all');

  const swBefore = cp.getAppWizInstalledSoftware(state);
  assert.ok(swBefore.some(a => a.id === 'office97' && a.isOffice));
  assert.ok(swBefore.some(a => a.id === 'winrar'));

  const winrarApp = swBefore.find(a => a.id === 'winrar');
  cp.uninstallAppWizProgram(winrarApp, state);
  const swAfter = cp.getAppWizInstalledSoftware(cp.loadAppWizState());
  assert.ok(!swAfter.some(a => a.id === 'winrar'));

  cp.createStartupDiskInVfs();
  const driveA = window.vfs.resolvePath(['My Computer', 'A:']);
  assert.ok(driveA && driveA.children['COMMAND.COM'] && driveA.children['OAKCDROM.SYS'] && driveA.children['FDISK.EXE']);

  clippy.running = true;
  clippy.visible = true;
  system.lastOfficeSelectAt = 0;
  assert.strictEqual(system.onAppWizOfficeSelected(), true);
  assert.ok(last().text.includes('Microslop Office 97'));
  press('Не бойся');
  assert.ok(last().text.includes('WIN386.SWP'));

  assert.strictEqual(system.onAppWizOfficeMaintenance('repair'), true);
  assert.ok(last().text.includes('шаблоны'));

  assert.strictEqual(system.onAppWizProgramRemoved(winrarApp), true);
  assert.ok(last().text.includes('WinRAR'));

  assert.strictEqual(system.onAppWizComponentsApplied({ added: [], removed: [{ id: 'ie5' }] }), true);
  assert.ok(last().text.includes('Internet Explorer 5'));

  assert.strictEqual(system.onAppWizComponentsApplied({ added: [], removed: [{ id: 'games' }] }), true);
  assert.ok(last().text.includes('Сапёра'));

  assert.strictEqual(system.onAppWizBootDiskCreated(), true);
  assert.ok(last().text.includes('OAKCDROM.SYS'));

  assert.strictEqual(system.onAppWizHelp('tab-appwiz-setup'), true);
  assert.ok(last().text.includes('Установка Win'));
});

test('netscape: Clippy reacts to https://pennygachi.men/web98/ and Win98.zip download in Netscape 6', () => {
  const AppClippy = eval(`${read('js/apps/clippy.js').replace('window.appClippy = new AppClippy();', '')}; AppClippy`);
  const AppNetscape = eval(`${read('js/apps/netscape.js').replace('window.appNetscape = new AppNetscape();', '')}; AppNetscape`);

  clippy.isNetscapeMinimized = AppClippy.prototype.isNetscapeMinimized;
  clippy.identifyNetscapePageKey = AppClippy.prototype.identifyNetscapePageKey;
  clippy.scrollNetscapeSection = AppClippy.prototype.scrollNetscapeSection;
  clippy.reactToWeb98Download = AppClippy.prototype.reactToWeb98Download;
  clippy.onNavigateNetscape = AppClippy.prototype.onNavigateNetscape;
  clippy.tapScreen = () => { clippy.anims.push('tap'); };
  clippy.countReaction = (k) => { clippy.reactions.push(k); };
  window.appClippy = clippy;

  assert.strictEqual(clippy.identifyNetscapePageKey('https://pennygachi.men/web98/'), 'web98');
  assert.strictEqual(clippy.identifyNetscapePageKey('http://pennygachi.men/web98'), 'web98');
  assert.strictEqual(clippy.identifyNetscapePageKey('https://pennygachi.men/web98/#download'), 'web98-download');
  assert.strictEqual(clippy.identifyNetscapePageKey('https://pennygachi.men/web98/Win98.zip'), 'web98-download');
  assert.strictEqual(clippy.identifyNetscapePageKey('https://example.com/'), null);

  const ns = new AppNetscape();
  ns.root = { querySelector: () => ({ disabled: false, style: {}, classList: { toggle() {}, remove() {} } }), querySelectorAll: () => [] };
  ns.frame = { setAttribute() {}, removeAttribute() {}, style: {} };
  ns.addressInput = { value: '' };
  ns.statusText = { textContent: '' };
  ns.progressBar = { style: {} };
  ns.throbber = { classList: { toggle() {} } };

  window.isOnline = true;
  clippy._lastNsPageKey = null;
  clippy._lastNsTime = 0;

  ns.navigate('https://pennygachi.men/web98/');
  assert.ok(last().text.includes('pennygachi.men/web98'));
  assert.ok(last().text.includes('Win 98 Web Edition'));
  assert.ok(last().text.includes('Clippy, awake'));

  press('Скрепыш всё видит');
  assert.ok(last().text.includes('девяти глав'));

  press('Назад к обзору сайта');
  assert.ok(last().text.includes('pennygachi.men/web98'));

  press('44 игры');
  assert.ok(last().text.includes('44 игр'));

  press('Назад к обзору сайта');
  press('Win98.zip');
  assert.ok(last().text.includes('1067 дискет'));

  press('Win 10 и 11');
  assert.ok(last().text.includes('Win 2000'));

  press('Вернуться к обзору сайта');
  press('Win98.zip');
  opened.length = 0;
  press('Сохранить памятку в Блокнот');
  assert.strictEqual(opened.length, 1);
  assert.strictEqual(opened[0][0], 'WEB98_META.TXT');
  assert.ok(opened[0][1].includes('https://pennygachi.men/web98/'));
});

test('cpanel: Power Management Properties (powercfg.cpl) schemes, custom save/delete, standby, and Clippy reactions', () => {
  localStorage.removeItem('win98_power_settings');
  const AppCPanel = eval(`${read('js/apps/cpanel-applets.js').replace('window.appCPanel = new AppCPanel();', '')}; AppCPanel`);
  const cp = new AppCPanel();
  window.appCPanel = cp;

  clippy.onPowerHelp = (tab) => system.onPowerHelp(tab);
  clippy.onPowerSettingsChanged = (prev, next, src) => system.onPowerSettingsChanged(prev, next, src);
  clippy.onPowerSchemeSaved = (name, timers) => system.onPowerSchemeSaved(name, timers);
  clippy.onPowerSchemeDeleted = (name) => system.onPowerSchemeDeleted(name);
  clippy.onMonitorStandbyWake = () => system.onMonitorStandbyWake();
  clippy.onHardDiskSpinDown = () => system.onHardDiskSpinDown();
  clippy.onHardDiskWake = () => system.onHardDiskWake();

  const defaults = cp.defaultPowerSettings();
  assert.strictEqual(defaults.scheme, 'always_on');
  assert.strictEqual(defaults.schemes.always_on.monitorTimeout, 15);
  assert.strictEqual(defaults.schemes.always_on.diskTimeout, 60);
  assert.strictEqual(defaults.schemes.home_office.monitorTimeout, 15);
  assert.strictEqual(defaults.schemes.home_office.diskTimeout, 0);
  assert.strictEqual(defaults.schemes.portable.monitorTimeout, 5);
  assert.strictEqual(defaults.schemes.portable.diskTimeout, 15);
  assert.strictEqual(defaults.showTrayIcon, false);

  const opts = cp.getPowerTimeoutOptions();
  assert.strictEqual(opts.length, 16);
  assert.strictEqual(opts[0].value, 1);
  assert.strictEqual(opts[opts.length - 1].value, 0);

  clippy.running = true;
  clippy.visible = true;

  const beforePortable = cp.clonePowerSettings(cp.powerSettings);
  const nextPortable = cp.clonePowerSettings(cp.powerSettings);
  nextPortable.scheme = 'portable';
  cp.savePowerSettings(nextPortable);
  cp.applyPowerSettings(nextPortable, 'dialog');
  assert.ok(system.onPowerSettingsChanged(beforePortable, nextPortable, 'dialog'));
  assert.ok(last().text.includes('Портативный или ноутбук'));

  press('Верни как было');
  assert.strictEqual(cp.powerSettings.scheme, 'always_on');
  assert.ok(last().text.includes('Вернул прежние настройки электропитания'));

  const prevMon = cp.clonePowerSettings(cp.powerSettings);
  const nextMon1 = cp.clonePowerSettings(cp.powerSettings);
  cp.setSchemeTimers(nextMon1, 'always_on', 1, 60);
  assert.ok(system.onPowerSettingsChanged(prevMon, nextMon1, 'dialog'));
  assert.ok(last().text.includes('через 1 минуту'));

  const nextMonNever = cp.clonePowerSettings(cp.powerSettings);
  cp.setSchemeTimers(nextMonNever, 'always_on', 0, 60);
  assert.ok(system.onPowerSettingsChanged(prevMon, nextMonNever, 'dialog'));
  assert.ok(last().text.includes('никогда не отключается'));

  const nextDiskNever = cp.clonePowerSettings(cp.powerSettings);
  cp.setSchemeTimers(nextDiskNever, 'always_on', 15, 0);
  assert.ok(system.onPowerSettingsChanged(prevMon, nextDiskNever, 'dialog'));
  assert.ok(last().text.includes('никогда не останавливаются'));

  const nextTray = cp.clonePowerSettings(cp.powerSettings);
  nextTray.showTrayIcon = true;
  assert.ok(system.onPowerSettingsChanged(prevMon, nextTray, 'dialog'));
  assert.ok(last().text.includes('Значок электропитания появился'));

  assert.ok(system.onPowerSchemeSaved('Ночной модем', { monitorTimeout: 2, diskTimeout: 30 }));
  assert.ok(last().text.includes('Ночной модем'));

  assert.ok(system.onPowerSchemeDeleted('Ночной модем'));
  assert.ok(last().text.includes('удалена'));

  assert.ok(system.onPowerHelp('tab-power-schemes'));
  assert.ok(last().text.includes('схема управления питанием'));
  assert.ok(system.onPowerHelp('tab-power-advanced'));
  assert.ok(last().text.includes('Дополнительно'));

  cp.enterMonitorStandby('tray');
  assert.strictEqual(cp.monitorInStandby, true);
  cp.wakeMonitorStandby();
  assert.strictEqual(cp.monitorInStandby, false);
  assert.ok(last().text.includes('Кинескоп снова прогрелся'));

  cp.spinDownHardDisks('tray');
  assert.strictEqual(cp.disksSpunDown, true);
  assert.ok(last().text.includes('запарковал головки'));
  cp.spinUpHardDisks();
  assert.strictEqual(cp.disksSpunDown, false);
  assert.ok(last().text.includes('5400 оборотов'));

  const hits = help.search('как настроить электропитание и спящий режим');
  assert.ok(hits.some(r => r.entry.id === 'power'));
  window.winManager.activeWindowId = 'app_powercfg_cpl';
  const sugg = help.suggestions().map(e => e.id);
  assert.ok(sugg.includes('power'));
});

test('office_games_98: CD-ROM insert/eject, launcher, 8 games, boss cover stories, help, tips, and ICQ', () => {
  spoken.length = 0;
  opened.length = 0;
  options.set('appReactions', true);
  system.gameEventCooldowns = {};

  const c = makeCore();
  assert.strictEqual(c.isGameWindow('app_og_hunt'), true);
  assert.strictEqual(c.isGameWindow('app_og_lines'), true);

  window.vfs.cdRomState = { inserted: true, discId: 'office_games_98' };
  c.reactToSwitch('genius');
  assert.ok(c.spoken[c.spoken.length - 1].text.includes('ARKANOID.EXE'));

  const reactions = c.getAppReactions();
  for (const wid of [
    'app_office_launcher', 'app_og_snake3d', 'app_og_arkanoid', 'app_og_rush',
    'app_og_hunt', 'app_og_gems', 'app_og_lines', 'app_og_tetris', 'app_og_chairs'
  ]) {
    assert.ok(reactions.some(r => r.match(wid)), `missing reaction for ${wid}`);
  }

  system.onCdRomInserted('office_games_98', 'D:');
  assert.ok(last().text.includes('Офисные игры ’98'));
  assert.ok(last().actions.some(a => a.text.includes('LAUNCHER.EXE')));

  window.winManager.windows.set('app_og_lines', { id: 'app_og_lines', isMinimized: false });
  system.onCdRomEjected('office_games_98', 'D:');
  assert.ok(last().text.includes('оперативную память'));
  window.winManager.windows.delete('app_og_lines');

  system.onCdRomEjected('office_games_98', 'D:');
  assert.ok(last().text.includes('извлечён из привода D:'));

  clippy.balloonOpen = () => false;
  system.lastOgSelectAt = 0;
  system.lastOgSelectedId = null;
  system.onOfficeLauncherSelect({ id: 'hunt', title: 'Офисный Тир', scoreKey: 'office_games_scores_hunt' });
  assert.ok(last().text.includes('Офисный Тир'));
  assert.ok(last().text.includes('SKR-004') || last().text.includes('4 500 скрепок'));

  system.onOfficeGameShortcut({ id: 'lines98', title: 'Цветные Линии 98', exePath: 'D:\\LINES98.EXE' });
  assert.ok(last().text.includes('Цветные Линии 98.lnk'));

  system.onOfficeLauncherHelp();
  assert.ok(last().text.includes('2-НДФЛ'));

  localStorage.setItem('office_games_scores_lines98', '240');
  localStorage.setItem('office_games_scores_hunt', '110');
  system.speakOfficeGamesRecords();
  assert.ok(last().text.includes('350 очков'));
  assert.ok(last().text.includes('Цветные Линии 98'));
  const saveRecordsBtn = last().actions.find(a => a.text.includes('Выписать табель рекордов'));
  assert.ok(saveRecordsBtn);
  saveRecordsBtn.action();
  assert.strictEqual(opened[opened.length - 1][0], 'ОФИСНЫЕ_РЕКОРДЫ_98.TXT');
  assert.ok(opened[opened.length - 1][1].includes('Цветные Линии 98: 240 очк.'));

  system.onOfficeGameEvent('tetris', 'boss_on');
  assert.ok(last().text.includes('Опись документов постоянного хранения'));

  system.onOfficeGameEvent('tetris', 'boss_off');
  assert.ok(last().text.includes('Коридор чист'));

  system.lastShotClippyAt = 0;
  system.shotClippyCount = 0;
  system.onOfficeGameEvent('hunt', 'shot_clippy');
  assert.ok(last().text.includes('0,9 мм'));
  system.lastShotClippyAt = 0;
  system.onOfficeGameEvent('hunt', 'shot_clippy');
  assert.ok(last().text.includes('CLIPPIT.ACS'));

  system.shotPaperclipSeen = false;
  system.onOfficeGameEvent('hunt', 'shot_paperclip');
  assert.ok(last().text.includes('SKR-004'));

  system.lastTetrisFourAt = 0;
  system.onOfficeGameEvent('tetris', 'four_lines');
  assert.ok(last().text.includes('ТЕТРИС (+800 очков)'));

  system.lastOgHighScoreAt = 0;
  system.onOfficeGameEvent('chairs', 'high_score', { score: 420 });
  assert.ok(last().text.includes('420 очков'));
  assert.ok(last().text.includes('Гонки на креслах 98'));

  const helpHits = help.search('во что поиграть на диске офисные игры 98 цветные линии');
  assert.ok(helpHits.some(r => r.entry.id === 'office-games'));

  window.winManager.activeWindowId = 'app_og_hunt';
  const ogSugg = help.suggestions().map(e => e.id);
  assert.ok(ogSugg.includes('office-games'));
  assert.ok(ogSugg.includes('boss'));

  assert.strictEqual(tips.trigger('office-games-cd'), true);
  assert.ok(last().text.includes('Офисные игры ’98'));

  assert.ok(system.icqReply('посоветуй офисные игры на диске').includes('LAUNCHER.EXE'));
  assert.ok(system.icqReply('охота на скрепки').includes('MOORHUNT.EXE'));
  assert.ok(system.icqReply('цветные линии 98').includes('Цветных Линий 98'));
});

test('shell: safe mode, boot log, Hearts, floppy, registry, updates, printer, EDIT, network, windows', () => {
  clippy.running = true;
  clippy.visible = true;
  clippy.annoyance = 'normal';
  const restarts = [];
  const tools = [];
  window.appShutdown = { triggerRestart() { restarts.push(true); } };
  window.appSysTools = { openSfc() { tools.push('sfc'); }, openScanReg() { tools.push('scanreg'); } };

  assert.strictEqual(system.onSafeMode(), true);
  assert.ok(last().text.includes('безопасном режиме'));
  press('Что вообще');
  assert.ok(last().text.includes('VGA'));
  press('Проверить системные');
  press('Проверить реестр');
  assert.deepStrictEqual(tools, ['sfc', 'scanreg']);
  press('Перезагрузиться');
  assert.strictEqual(restarts.length, 1);

  window.vfs.root.children['My Computer'].children['C:'].children['BOOTLOG.TXT'] = { type: 'file', content: '[000D1F40] Loading Device = C:\\WINDOWS\\HIMEM.SYS' };
  assert.strictEqual(system.onBootLogged(), true);
  assert.ok(last().text.includes('BOOTLOG.TXT'));
  press('Открыть BOOTLOG');
  assert.strictEqual(opened[opened.length - 1][0], 'BOOTLOG.TXT');

  system.heartsQueenAt = 0;
  assert.strictEqual(system.onHeartsEvent('queen'), true);
  assert.ok(last().text.includes('Дама пик'));
  assert.strictEqual(system.onHeartsEvent('queen'), false);
  assert.strictEqual(system.onHeartsEvent('moon', { human: true }), true);
  assert.ok(last().text.includes('сорвали банк'));
  assert.strictEqual(system.onHeartsEvent('moon', { human: false, name: 'Ben' }), true);
  assert.ok(last().text.startsWith('Ben:'));

  assert.strictEqual(system.onFloppyFormatted({ system: true }), true);
  assert.ok(last().text.includes('COMMAND.COM'));
  assert.strictEqual(system.onRegistryBackup(), true);
  assert.ok(last().text.includes('RB001.CAB'));
  assert.strictEqual(system.onWinUpdateInstalled(['kb_y2k']), true);
  assert.ok(last().text.includes('2000 года'));
  assert.ok(system.winUpdateSiteReaction().text.includes('Обновление Win'));
  assert.strictEqual(system.winUpdateSiteReaction(), null);
  assert.strictEqual(system.onTestPagePrinted('HP LaserJet 4L', 'LPT1:'), true);
  assert.ok(last().text.includes('HP LaserJet 4L'));
  assert.strictEqual(system.onDosEditor('AUTOEXEC.BAT'), true);
  assert.ok(last().text.includes('EDIT.COM'));
  assert.strictEqual(system.onDosEditor('CONFIG.SYS'), false);
  assert.strictEqual(system.onNetworkNeighborhood(), true);
  assert.ok(last().text.includes('Гений'));
  assert.strictEqual(system.onNetworkNeighborhood(), false);

  const find = (id) => system.shellAppReactions().find(r => r.match(id));
  assert.ok(find('app_hearts').text.includes('Червы'));
  assert.strictEqual(find('app_hearts'), undefined);
  assert.ok(find('fontview_Comic_Sans_MS').text.includes('Comic Sans'));
  assert.strictEqual(find('fontview_Arial'), undefined);
  assert.ok(find('app_mstask').text.includes('19 ноября'));

  const depth = system.displayEffectReaction({ values: { colorDepth: { from: '32bit', to: '16color' } } });
  assert.ok(depth.text.includes('Шестнадцать цветов'));

  clippy.annoyance = 'quiet';
  assert.strictEqual(system.onSafeMode(), false);
  clippy.annoyance = 'normal';
});

console.log(`clippy: ${passed} passed`);
process.exit(0);

