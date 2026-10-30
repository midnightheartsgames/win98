(function (A) {
  'use strict';
  A.TITLE = 'Star Wars: Aayla Secura — Twilight';
  A.W = 640;
  A.H = 480;
  A.LW = 320;
  A.LH = 240;
  A.STEP = 1 / 60;
  A.SAVE_VERSION = 3;
  A.live = A.live || { uis: 0, loops: 0, audio: 0 };
  A.CHAPTERS = {
    pro: { name: 'Пролог «Глиттерилл»', short: 'Пролог', done: 'Пролог «Глиттерилл» пройден', after: 'Эйла не помнит, кто она.', next: 'Глава 1 «Сумерки»', stage: 6 },
    ch1: { name: 'Глава 1 «Сумерки»', short: 'Глава 1', done: 'Глава 1 «Сумерки» пройдена', after: 'К Киффексу падает одна капсула.', next: 'Глава 2 «Тьма»', stage: 7 },
    ch2: { name: 'Глава 2 «Тьма»', short: 'Глава 2', done: 'Глава 2 «Тьма» пройдена', after: 'Эйла становится ученицей Толма.', next: 'Интерлюдия «Чужая память»', stage: 8 },
    int: { name: 'Интерлюдия «Чужая память»', short: 'Интерлюдия', done: 'Интерлюдия «Чужая память» пройдена', after: 'Эйла снова падаван, теперь у Толма.', next: 'Глава 3 «Посвящение»', stage: 9 },
    ch3: { name: 'Глава 3 «Посвящение»', short: 'Глава 3', done: 'Глава 3 «Посвящение» пройдена', after: 'Эйла становится рыцарем-джедаем.', next: 'Глава 4 «Война»', stage: 11, credits: 300 },
    ch4: { name: 'Глава 4 «Война»', short: 'Глава 4', done: 'Глава 4 «Война» пройдена', after: 'Эйла принимает 327-й звёздный корпус.', next: 'Глава 5 «Брошенные»', stage: 12, credits: 300 },
    ch5: { name: 'Глава 5 «Брошенные»', short: 'Глава 5', done: 'Глава 5 «Брошенные» пройдена', after: 'Эйла нашла в себе то, чего не хватало.', next: 'Глава 6 «Двойной агент»', stage: 13, credits: 500 },
    ch6: { name: 'Глава 6 «Двойной агент»', short: 'Глава 6', done: 'Глава 6 «Двойной агент» пройдена', after: 'Квинлан Вос вернулся из тьмы.', next: 'Глава 7 «Фелуция»', stage: 14, credits: 300 },
    ch7: { name: 'Глава 7 «Фелуция»', short: 'Глава 7', done: 'Глава 7 «Фелуция» пройдена', after: 'Эйлу Секуру помнят.', next: 'Титры', stage: 15, credits: 300 }
  };
  A.CHAPTER_ORDER = ['pro', 'ch1', 'ch2', 'int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];
  A.chapterIndex = id => A.CHAPTER_ORDER.indexOf(id);
  A.reached = (S, id) => A.chapterIndex(S.chapter) >= A.chapterIndex(id);

  A.rng = seed => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  A.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  A.fit = (w, h) => {
    const raw = Math.max(0.25, Math.min(w / A.W, h / A.H));
    const scale = raw >= 1 ? Math.floor(raw) : raw;
    const width = Math.round(A.W * scale), height = Math.round(A.H * scale);
    return { scale, width, height, x: Math.max(0, Math.floor((w - width) / 2)), y: Math.max(0, Math.floor((h - height) / 2)) };
  };

  const KEY_NAMES = { Enter: 'Enter', Space: 'Space', Escape: 'Esc', Backspace: 'Backspace', KeyQ: 'Q', KeyZ: 'Z', KeyX: 'X', KeyA: 'A', KeyH: 'H', ShiftLeft: 'Shift', ControlLeft: 'Ctrl', ArrowUp: 'Стрелки', F5: 'F5' };
  const PAD_NAMES = { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', back: 'Back', start: 'Start', ls: 'L3', rs: 'R3', up: 'Крестовина' };
  A.Input = {
    PAD_BUTTONS: ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'back', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right'],
    COMMANDS: [
      { id: 'move', name: 'Движение и выбор', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], pad: ['up', 'down', 'left', 'right'] },
      { id: 'ok', name: 'Да, осмотреть, дальше', keys: ['Enter', 'Space'], pad: ['a'] },
      { id: 'back', name: 'Назад', keys: ['Escape'], pad: ['b'] },
      { id: 'menu', name: 'Меню и пауза', keys: ['Escape'], pad: ['y', 'start'] },
      { id: 'sense', name: 'Чутьё Силы', keys: ['KeyQ'], pad: ['x'] },
      { id: 'push', name: 'Толчок', keys: ['KeyZ'], pad: ['lb'] },
      { id: 'pull', name: 'Притяжение', keys: ['KeyX'], pad: ['rb'] },
      { id: 'sneak', name: 'Красться', keys: ['ShiftLeft', 'ShiftRight'], pad: ['lt'] },
      { id: 'log', name: 'Журнал реплик', keys: ['Backspace'], pad: ['rt'] },
      { id: 'skip', name: 'Пропуск прочитанного', keys: ['ControlLeft', 'ControlRight'], pad: ['back'] },
      { id: 'auto', name: 'Автотекст', keys: ['KeyA'], pad: ['rs'] },
      { id: 'hide', name: 'Спрятать окно', keys: ['KeyH'], pad: ['ls'] },
      { id: 'fire', name: 'Огонь в полёте', keys: ['Space', 'Enter'], pad: ['a'] },
      { id: 'dash', name: 'Рывок в полёте', keys: ['ShiftLeft', 'ShiftRight', 'KeyX'], pad: ['rb'] }
    ],
    TO_KEY: { a: 'Enter', b: 'Escape', x: 'KeyQ', y: 'Escape', lb: 'KeyZ', rb: 'KeyX', lt: 'ShiftLeft', rt: 'Backspace', back: 'ControlLeft', start: 'Escape', ls: 'KeyH', rs: 'KeyA', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
    pad(gp) {
      const out = new Set();
      if (!gp) return out;
      A.Input.PAD_BUTTONS.forEach((name, i) => {
        const b = gp.buttons && gp.buttons[i];
        if (b && (b.pressed || b.value > 0.5)) out.add(name);
      });
      const ax = gp.axes || [];
      if (ax[0] < -0.5) out.add('left');
      if (ax[0] > 0.5) out.add('right');
      if (ax[1] < -0.5) out.add('up');
      if (ax[1] > 0.5) out.add('down');
      return out;
    },
    label(id, device) {
      const c = A.Input.COMMANDS.find(x => x.id === id);
      if (!c) return id;
      return device === 'pad' ? PAD_NAMES[c.pad[0]] || c.pad[0] : KEY_NAMES[c.keys[0]] || c.keys[0];
    }
  };
  A.Input.KEYS = new Set([...A.Input.COMMANDS.flatMap(c => c.keys), 'F5']);

  A.newState = () => ({
    version: A.SAVE_VERSION,
    chapter: 'pro',
    scene: null,
    resume: null,
    flags: {},
    dark: 0,
    restraint: 0,
    bonds: {},
    faded: [],
    palace: null,
    respite: null,
    cover: null,
    party: [],
    items: {},
    memory: [],
    at: null,
    field: null,
    credits: 0,
    difficulty: 'normal',
    time: 0
  });
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
