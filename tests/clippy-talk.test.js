const fs = require('fs');
const path = require('path');
const assert = require('assert');

const spoken = [];
const opened = [];
const written = [];
const classes = new Set();

global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); } };
global.window = {
  soundSys: { playDing() {}, playError() {}, playClippyVictory() {} },
  appNotepad: { open(name, content) { opened.push([name, content]); } },
  appSolitaire: { open() { opened.push(['solitaire']); } },
  vfs: { writeFile(dir, name, content) { written.push([dir.join('/'), name, content]); } },
  clippyWardrobe: {
    equipped: { head: 'propeller' },
    items: [{ id: 'propeller', name: 'Кепка с пропеллером' }],
    getEquippedId(slot) { return this.equipped[slot] || null; },
    unequip(slot) { this.equipped[slot] = null; }
  }
};

const clippy = {
  _speakCount: 0,
  annoyance: 'normal',
  visible: true,
  charEl: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } },
  speak(text, actions = [], mood = '📎') {
    this._speakCount++;
    spoken.push({ text, actions, mood });
  },
  tapScreen() {},
  setAccessory(name, on) { if (on) classes.add('acc-' + name); },
  hide() { this.visible = false; if (window.clippyTalk) window.clippyTalk.onHidden(); },
  sayRandomTip() { spoken.push({ text: 'tip', actions: [] }); },
  startQuiz() {}
};
window.appClippy = clippy;

eval(fs.readFileSync(path.join(__dirname, '../js/apps/clippy-talk.js'), 'utf8'));
const talk = window.clippyTalk;

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const last = () => spoken[spoken.length - 1];
const click = (label) => {
  const btn = last().actions.find(a => a.text.includes(label));
  assert.ok(btn, `no button "${label}" in: ${last().actions.map(a => a.text).join(' | ')}`);
  btn.action();
};
const reset = () => {
  localStorage.store = {};
  talk.state = talk.loadState();
  talk.sulkUntil = 0;
  talk.pokeTimes = [];
};

test('every static link points to an existing node', () => {
  const ids = Object.keys(talk.nodes);
  ids.forEach(id => {
    const node = talk.nodes[id];
    const options = typeof node.options === 'function' ? [] : (node.options || []);
    options.forEach(opt => {
      if (typeof opt.to === 'string') assert.ok(talk.nodes[opt.to], `${id} -> ${opt.to}`);
    });
    if (node.then) assert.ok(talk.nodes[node.then.to], `${id} then ${node.then.to}`);
  });
  for (let i = 1; i <= 5; i++) assert.ok(talk.nodes[`arc${i}`], `arc${i}`);
});

test('every node renders text without throwing', () => {
  reset();
  talk.currentRiddle = talk.riddles()[0];
  talk.riddleReply = talk.riddles()[0].answers[0];
  talk.lastRps = { user: 'rock', clippy: 'paper' };
  talk.state.gapDays = 4;
  talk.state.hiddenMinutes = 45;
  Object.keys(talk.nodes).forEach(id => {
    if (id === 'hideBye' || id === 'pokeSulk') return;
    assert.ok(talk.play(id), id);
    assert.ok(typeof last().text === 'string' && last().text.length > 5, id);
  });
});

test('first launch greets with intro and tour', () => {
  reset();
  talk.greet();
  assert.ok(last().text.includes('впервые'));
  click('показывай');
  assert.strictEqual(talk.state.affinity, 1);
  click('Дальше');
  click('Дальше');
  assert.ok(last().text.includes('Ctrl+S'));
});

test('returning after days greets with absence line', () => {
  reset();
  talk.state.visits = 3;
  talk.state.lastVisit = Date.now() - 5 * 86400000;
  talk.partOfDay = () => 'day';
  talk.greet();
  assert.ok(last().text.includes('Вас не было 5'));
  delete talk.partOfDay;
});

test('hub hides arc topic until talks and affinity are met', () => {
  reset();
  talk.openHub();
  assert.ok(!last().actions.some(a => a.text.includes('грустный')));
  talk.openHub();
  assert.ok(last().actions.some(a => a.text.includes('грустный')));
});

test('full story arc reaches the letter ending', () => {
  reset();
  talk.state.talks = 2;
  talk.play('hub');
  click('грустный');
  click('Прочитай');
  assert.strictEqual(talk.state.arc, 1);

  talk.state.talks = 4;
  talk.state.affinity = 2;
  talk.play('hub');
  click('грустный');
  click('Давай помогу');
  assert.strictEqual(talk.state.arc, 2);
  assert.ok(opened.some(([name]) => name === 'Резюме друга.txt'));
  assert.ok(clippy.reactionsMutedUntil > Date.now());

  talk.state.talks = 6;
  talk.state.affinity = 4;
  talk.play('hub');
  click('грустный');
  click('Конечно тебя');
  assert.strictEqual(talk.state.arc, 3);

  talk.state.talks = 8;
  talk.play('hub');
  click('грустный');
  click('не выключу');
  assert.strictEqual(talk.state.arc, 4);
  assert.ok(talk.hasFlag('promise'));

  talk.state.talks = 10;
  talk.play('hub');
  click('грустный');
  assert.ok(last().text.includes('обещали'));
  click('помог');
  assert.strictEqual(talk.state.arc, 5);
  assert.ok(written.some(([dir, name]) => dir.endsWith('My Documents') && name === 'Письмо от Скрепыша.txt'));
  talk.play('hub');
  assert.ok(!last().actions.some(a => a.text.includes('грустный')));
  assert.ok(last().actions.some(a => a.text.includes('Как ты теперь')));
});

test('arc state persists across reloads', () => {
  const saved = JSON.parse(localStorage.getItem('win98_clippy_talk'));
  assert.strictEqual(saved.arc, 5);
  assert.strictEqual(talk.loadState().flags.promise, true);
});

test('rapid pokes escalate to sulking and apology', () => {
  reset();
  for (let i = 0; i < 3; i++) talk.onPoke();
  assert.ok(last().text.includes('кнопка «Пуск»'));
  talk.onPoke();
  talk.onPoke();
  assert.ok(last().text.includes('завис'));
  talk.onPoke();
  talk.onPoke();
  assert.ok(last().text.includes('обиделся'));
  assert.strictEqual(talk.state.affinity, -1);
  talk.onPoke();
  assert.ok(last().text.includes('обижаюсь'));
  click('Прости');
  assert.ok(!talk.isSulking());
  assert.strictEqual(talk.state.affinity, 0);
});

test('first hide request negotiates, quiet option keeps clippy visible', () => {
  reset();
  clippy.visible = true;
  talk.requestHide();
  assert.ok(last().text.includes('Спрятать меня'));
  click('потише');
  assert.strictEqual(clippy.annoyance, 'quiet');
  assert.strictEqual(clippy.visible, true);
});

test('coming back after a long hide mentions minutes', () => {
  reset();
  talk.hiddenAt = Date.now() - 40 * 60000;
  talk.onShown();
  assert.ok(last().text.includes('40 мин'));
});

test('rock paper scissors keeps score and allows calling out the cheat', () => {
  reset();
  const rnd = Math.random;
  Math.random = () => 0.5;
  talk.startRps();
  click('Камень');
  assert.ok(last().text.includes('Ничья') || last().text.includes('победили') || last().text.includes('Моя взяла'));
  Math.random = () => 0.01;
  talk.play('rps');
  click('Бумага');
  assert.ok(last().text.includes('скрепку'));
  click('нечестно');
  assert.ok(last().text.includes('Засчитываю'));
  assert.strictEqual(talk.rpsScore.clippy, 0);
  Math.random = rnd;
});

test('riddle answers get feedback', () => {
  reset();
  talk.play('riddle');
  const correct = talk.currentRiddle.answers.find(a => a.correct);
  click(correct.text);
  assert.ok(last().text.includes('Правильно'));
});

test('help menu opens templates in notepad', () => {
  reset();
  talk.play('helpMenu');
  click('Объяснительную');
  const [name, content] = opened[opened.length - 1];
  assert.strictEqual(name, 'Объяснительная.txt');
  assert.ok(content.includes('ОБЪЯСНИТЕЛЬНАЯ'));
});

test('hoverbot asks for the propeller back', () => {
  reset();
  talk.play('hoverbot');
  click('Верни');
  assert.strictEqual(window.clippyWardrobe.equipped.head, null);
});

console.log(`clippy-talk: ${passed} passed`);
