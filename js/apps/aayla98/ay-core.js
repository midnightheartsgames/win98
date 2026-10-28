(function (A) {
  'use strict';
  A.TITLE = 'Star Wars: Aayla Secura — Twilight';
  A.W = 640;
  A.H = 480;
  A.LW = 320;
  A.LH = 240;
  A.STEP = 1 / 60;
  A.SAVE_VERSION = 1;
  A.live = A.live || { uis: 0, loops: 0, audio: 0 };

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
      { id: 'hide', name: 'Спрятать окно', keys: ['KeyH'], pad: ['ls'] }
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
    flags: {},
    dark: 0,
    restraint: 0,
    bonds: {},
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
