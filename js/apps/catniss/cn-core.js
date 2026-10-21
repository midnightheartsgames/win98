(function (C) {
  'use strict';
  const W = 320, H = 240, T = 16;
  const ASSET = 'content/Catniss/';
  const SAVE_KEY = 'catniss98_save';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function hash(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const PH = {
    w: 14, h: 13,
    run: 105, accG: 950, accA: 640, fricG: 1250, fricA: 300, overRun: 420,
    g: 980, gFall: 1650, gCut: 2300, maxFall: 380,
    jumpV: 330, coyote: 0.09, buffer: 0.12,
    dashV: 275, dashT: 0.17, dashLift: 40, dashCool: 0.3,
    wallSlide: 55, wallJumpVX: 150, wallJumpVY: 300, wallLock: 0.15, wallCoyote: 0.08,
    stompV: 270, stompHeld: 360, bounceV: 470, bounceHeld: 540,
    hurtVX: 120, hurtVY: 200, invul: 1.3,
    fanLift: 1500, fanMax: 150, conveyor: 52
  };

  const START_LIVES = 5, MAX_LIVES = 9, COINS_PER_LIFE = 50;

  const SIBLINGS = {
    ugolek: { name: 'Уголёк', sheet: 'cats32', block: [0, 1] },
    chernika: { name: 'Черника', sheet: 'cats32', block: [1, 1] },
    pyatnashka: { name: 'Пятнашка', sheet: 'cats32', block: [2, 1] },
    snezhka: { name: 'Снежка', sheet: 'cats32', block: [0, 0] }
  };
  const PLAYER_CAT = { name: 'Catniss', sheet: 'cats32', block: [3, 1] };
  const SKINS = ['catniss', 'ugolek', 'chernika', 'pyatnashka', 'snezhka'];

  const FISH = [
    { id: 'petal', name: 'Лепесток' }, { id: 'comet', name: 'Комета' }, { id: 'moor', name: 'Телескоп' },
    { id: 'bubble', name: 'Пузырчатая' }, { id: 'pompom', name: 'Помпон' }, { id: 'common', name: 'Простая' },
    { id: 'fantail', name: 'Веерохвост' }, { id: 'lionhead', name: 'Львиноголовка' }, { id: 'koi', name: 'Карп кои' },
    { id: 'veiltail', name: 'Вуалехвост' }, { id: 'curled', name: 'Кудряшка' }, { id: 'globe', name: 'Шарик' }
  ];

  function defaultSave() {
    return { v: 1, intro: false, levels: {}, lives: START_LIVES, skin: 'catniss', rescued: [], music: 0.7, sfx: 0.8, at: 0 };
  }

  function loadSave() {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const s = JSON.parse(raw);
      if (!s || s.v !== 1) return defaultSave();
      return Object.assign(defaultSave(), s);
    } catch (e) { return defaultSave(); }
  }

  function storeSave(s) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { }
  }

  Object.assign(C, {
    W, H, T, ASSET, SAVE_KEY, PH, START_LIVES, MAX_LIVES, COINS_PER_LIFE, SIBLINGS, PLAYER_CAT, SKINS, FISH,
    clamp, lerp, approach, sign, overlap, hash, rng, defaultSave, loadSave, storeSave
  });
})(globalThis.Catniss = globalThis.Catniss || {});
