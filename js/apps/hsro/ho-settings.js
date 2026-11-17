(function (HO) {
  'use strict';

  HO.KEY_ACTIONS = [
    { id: 'fwd', name: 'Вперёд', key: 'KeyW', group: 'move' },
    { id: 'back', name: 'Назад', key: 'KeyS', group: 'move' },
    { id: 'left', name: 'Поворот влево', key: 'KeyA', group: 'move' },
    { id: 'right', name: 'Поворот вправо', key: 'KeyD', group: 'move' },
    { id: 'sl', name: 'Шаг влево', key: 'KeyQ', group: 'move' },
    { id: 'sr', name: 'Шаг вправо', key: 'KeyE', group: 'move' },
    { id: 'jump', name: 'Прыжок', key: 'Space', group: 'move' },
    { id: 'autorun', name: 'Автобег', key: 'KeyR', group: 'move' },
    { id: 'sit', name: 'Сесть', key: 'KeyX', group: 'move' },
    { id: 'target', name: 'Следующий враг', key: 'Tab', group: 'fight' },
    { id: 'self', name: 'Выбрать себя', key: 'F1', group: 'fight' },
    ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((label, i) => ({
      id: 'bar' + (i + 1), name: 'Панель, ячейка ' + label, key: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'][i], group: 'fight'
    })),
    { id: 'char', name: 'Персонаж', key: 'KeyC', group: 'win' },
    { id: 'skills', name: 'Умения', key: 'KeyK', group: 'win' },
    { id: 'bag', name: 'Рюкзак', key: 'KeyB', group: 'win' },
    { id: 'log', name: 'Журнал заданий', key: 'KeyL', group: 'win' },
    { id: 'map', name: 'Карта', key: 'KeyM', group: 'win' },
    { id: 'party', name: 'Группа', key: 'KeyN', group: 'win' }
  ];
  HO.MOVE_ALT = { ArrowUp: 'fwd', ArrowDown: 'back', ArrowLeft: 'left', ArrowRight: 'right' };
  HO.RESERVED_KEYS = ['F9', 'F10', 'Escape'];
  HO.RES_CHOICES = [640, 800, 1024];
  HO.VIEW_CHOICES = [{ v: 0.75, name: 'Ближняя' }, { v: 1, name: 'Средняя' }, { v: 1.4, name: 'Дальняя' }];
  HO.UI_CHOICES = [1, 1.1, 1.25, 1.5];

  HO.SETTINGS_KEY = 'hsro.settings';
  HO.SETTINGS_DEFAULT = { sfx: 0.6, music: 0.35, res: 800, view: 1, fog: true, shadows: true, dither: false, ui: 1, perf: false, keys: {} };

  const clampTo = (v, list, d) => (list.includes(v) ? v : d);
  const vol = (v, d) => (typeof v === 'number' && v >= 0 && v <= 1 ? Math.round(v * 100) / 100 : d);

  HO.cleanSettings = function (raw) {
    const d = HO.SETTINGS_DEFAULT, s = raw && typeof raw === 'object' ? raw : {};
    const keys = {};
    const ids = new Set(HO.KEY_ACTIONS.map(a => a.id));
    const used = new Set();
    for (const [id, code] of Object.entries(s.keys && typeof s.keys === 'object' ? s.keys : {})) {
      if (!ids.has(id) || typeof code !== 'string' || HO.RESERVED_KEYS.includes(code) || used.has(code)) continue;
      keys[id] = code;
      used.add(code);
    }
    return {
      sfx: vol(s.sfx, d.sfx), music: vol(s.music, d.music),
      res: clampTo(s.res, HO.RES_CHOICES, d.res), view: clampTo(s.view, HO.VIEW_CHOICES.map(c => c.v), d.view),
      fog: typeof s.fog === 'boolean' ? s.fog : d.fog, shadows: typeof s.shadows === 'boolean' ? s.shadows : d.shadows,
      dither: typeof s.dither === 'boolean' ? s.dither : d.dither, ui: clampTo(s.ui, HO.UI_CHOICES, d.ui), perf: s.perf === true, keys
    };
  };

  HO.loadSettings = function (storage) {
    let saved = null;
    try { saved = JSON.parse(storage.getItem(HO.SETTINGS_KEY) || 'null'); } catch (err) { saved = null; }
    return HO.cleanSettings(saved);
  };

  HO.saveSettings = function (storage, s) {
    try { storage.setItem(HO.SETTINGS_KEY, JSON.stringify(HO.cleanSettings(s))); } catch (err) { return false; }
    return true;
  };

  HO.keyOf = (s, id) => (s.keys && s.keys[id]) || HO.KEY_ACTIONS.find(a => a.id === id).key;

  HO.actionFor = function (s, code) {
    for (const a of HO.KEY_ACTIONS) if (HO.keyOf(s, a.id) === code) return a.id;
    return HO.MOVE_ALT[code] || null;
  };

  HO.rebind = function (s, id, code) {
    if (HO.RESERVED_KEYS.includes(code)) return { ok: false, why: 'reserved' };
    const old = HO.keyOf(s, id), other = HO.KEY_ACTIONS.find(a => a.id !== id && HO.keyOf(s, a.id) === code);
    s.keys = Object.assign({}, s.keys, { [id]: code });
    if (other) s.keys[other.id] = old;
    for (const a of HO.KEY_ACTIONS) if (s.keys[a.id] === a.key) delete s.keys[a.id];
    return { ok: true, swapped: other ? other.id : null };
  };

  const NAMES = { Space: 'Пробел', Tab: 'Tab', Enter: 'Enter', Backspace: 'Backspace', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Backquote: '`', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', AltLeft: 'Alt', AltRight: 'Alt', CapsLock: 'Caps', Insert: 'Ins', Delete: 'Del', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn' };

  HO.CREATE_STEPS = [
    { name: 'Раса', line: 'Раса решает, где начнётся путь и какие расовые умения у героя' },
    { name: 'Путь', line: 'Путь решает роль в бою: держать врагов, лечить или бить по площади' },
    { name: 'Облик', line: 'Облик виден в мире и в окне персонажа, на бой он не влияет' },
    { name: 'Имя', line: 'Имя видно над головой героя, сменить его потом нельзя' }
  ];
  HO.LOADING_TIPS = [
    'Отдых копится в тавернах и городе: опыт за врагов удваивается, пока он не кончится.',
    'Якорь пространства запоминает место. Карманный якорь вернёт к нему раз в полчаса.',
    'Пробейте Стойкость врага стихией из его слабостей: он пропустит ход, а подготовка сорвётся.',
    'Подготовка врага видна полосой и отметкой на полу. Выйдите из отметки или пробейте его.',
    'Хлам продаётся одной кнопкой у любого торговца.',
    'Напарников зовёт маяк у группового задания. Приказы и метки в окне группы.',
    'Клавиши меняются в настройках: Esc, затем «Управление».',
    'Окно умений открывается клавишей K. Тяните умение на панель, чтобы поменять раскладку.'
  ];

  HO.uiKey = id => 'hsro.ui.' + id;
  HO.BAR_SIZE = 12;

  HO.defaultBar = function (path, race) {
    const ids = HO.BAR[path].slice(0, HO.BAR_SIZE - 1);
    while (ids.length < HO.BAR_SIZE - 1) ids.push(null);
    ids.push(HO.RACIALS[race].id);
    return ids;
  };

  HO.barAllowed = (path, race) => new Set([...HO.BAR[path], ...HO.pathAbilities(path), HO.RACIALS[race].id]);

  HO.loadHeroUi = function (storage, id, path, race) {
    let raw = null;
    try { raw = JSON.parse(storage.getItem(HO.uiKey(id)) || 'null'); } catch (err) { raw = null; }
    const allowed = HO.barAllowed(path, race), seen = new Set();
    let bar = raw && Array.isArray(raw.bar) && raw.bar.length === HO.BAR_SIZE ? raw.bar : HO.defaultBar(path, race);
    bar = bar.map(x => (allowed.has(x) && !seen.has(x) && seen.add(x) ? x : null));
    const untracked = raw && Array.isArray(raw.untracked) ? raw.untracked.filter(q => HO.QUESTS[q]) : [];
    return { bar, untracked };
  };

  HO.saveHeroUi = function (storage, id, ui) {
    try { storage.setItem(HO.uiKey(id), JSON.stringify({ bar: ui.bar, untracked: ui.untracked })); } catch (err) { return false; }
    return true;
  };

  HO.placeOnBar = function (ui, slot, id, from) {
    if (slot < 0 || slot >= HO.BAR_SIZE) return false;
    if (from >= 0 && from < HO.BAR_SIZE) {
      const t = ui.bar[slot];
      ui.bar[slot] = ui.bar[from];
      ui.bar[from] = t;
      return true;
    }
    const was = ui.bar.indexOf(id);
    if (was >= 0) ui.bar[was] = ui.bar[slot];
    ui.bar[slot] = id;
    return true;
  };

  HO.keyLabel = function (code) {
    if (!code) return '';
    if (NAMES[code]) return NAMES[code];
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    return code;
  };
})(globalThis.HO = globalThis.HO || {});
