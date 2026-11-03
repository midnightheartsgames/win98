(function (H) {
  'use strict';
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = name => {
    const m = /^([A-G]#?)(\d)$/.exec(name);
    return m ? 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12) : 0;
  };

  const THEMES = {
    title: {
      name: 'Семь лун', step: 0.34,
      voices: [
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'D3 A3 D4 F4 A4 F4 D4 A3 C3 G3 C4 E4 G4 E4 C4 G3 A#2 F3 A#3 D4 F4 D4 A#3 F3 A2 E3 A3 C#4 E4 C#4 A3 E3' },
        { wave: 'sine', gain: 0.2, len: 7, notes: 'D5 . . F5 . G5 A5 . . . C6 . A5 . . . G5 . . A5 . G5 F5 . . . E5 . F5 . E5 D5' },
        { wave: 'sine', gain: 0.1, len: 16, notes: 'D3 . . . . . . . C3 . . . . . . . A#2 . . . . . . . A2 . . . . . . .' }
      ]
    },
    meadow: {
      name: 'Заливные луга', step: 0.24,
      voices: [
        { wave: 'triangle', gain: 0.15, len: 2, notes: 'G3 . D4 . B3 . D4 . C4 . G4 . E4 . G4 . A3 . E4 . C4 . E4 . D4 . A4 . F#4 . A4 .' },
        { wave: 'square', gain: 0.045, len: 3, notes: 'G4 . B4 D5 . . E5 D5 C5 . E5 G5 . . E5 C5 A4 . C5 E5 . . D5 C5 D5 . F#5 A5 . G5 F#5 D5' },
        { wave: 'sine', gain: 0.14, len: 6, notes: 'G2 . . . . . . . C3 . . . . . . . A2 . . . . . . . D3 . . . . . . .' }
      ]
    },
    steppe: {
      name: 'Степной ветер', step: 0.3,
      voices: [
        { wave: 'sawtooth', gain: 0.035, len: 22, notes: 'A2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'A4 . C5 D5 E5 . . D5 C5 . A4 G4 A4 . . . E5 . G5 A5 G5 E5 D5 . C5 D5 E5 . A4 . . .' },
        { wave: 'square', gain: 0.03, len: 1, notes: 'A3 . E3 . A3 . E3 . G3 . D3 . G3 . D3 . A3 . E3 . A3 . E3 . C4 . G3 . A3 . E3 .' }
      ]
    },
    battle: {
      name: 'Бой', step: 0.16,
      voices: [
        { wave: 'sawtooth', gain: 0.07, len: 1, notes: 'E2 E2 . E2 E3 . E2 . G2 G2 . G2 G3 . D3 . A2 A2 . A2 A3 . A2 . B2 B2 . B2 B3 . B2 .' },
        { wave: 'square', gain: 0.05, len: 3, notes: 'E4 . . G4 A4 . B4 . D5 . . B4 A4 . G4 . A4 . . C5 B4 . A4 . F#4 . G4 . A4 . B4 .' },
        { wave: 'noise', gain: 0.09, len: 1, notes: 'x . . x . . x . x . . x . . x . x . . x . . x . x . . x . x x .' }
      ]
    },
    town_league: {
      name: 'Звонград', step: 0.22,
      voices: [
        { wave: 'triangle', gain: 0.14, len: 2, notes: 'A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . A2 . E3 . A2 . E3 .' },
        { wave: 'triangle', gain: 0.08, len: 1, notes: 'A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3 A3 C4 E4 A4 E4 C4 A3 .' },
        { wave: 'square', gain: 0.035, len: 3, notes: 'A4 . . C5 E5 . D5 C5 D5 . . B4 C5 . A4 . B4 . G4 . D5 . C5 B4 A4 . . . . . . .' },
        { wave: 'sine', gain: 0.13, len: 14, notes: 'A5 . . . . . . . F5 . . . . . . . G5 . . . . . . . A5 . . . E5 . . .' },
        { wave: 'sine', gain: 0.05, len: 14, notes: 'E6 . . . . . . . C6 . . . . . . . D6 . . . . . . . E6 . . . B5 . . .' }
      ]
    },
    town_throne: {
      name: 'Хор под пустым троном', step: 0.34,
      voices: [
        { wave: 'sawtooth', gain: 0.04, len: 8, notes: 'D2 . . . . . . . A1 . . . . . . . B1 . . . . . . . G1 . . . A1 . . .' },
        { wave: 'square', gain: 0.035, len: 8, notes: 'F3 . . . . . . . E3 . . . . . . . D3 . . . . . . . D3 . . . C#3 . . .' },
        { wave: 'sine', gain: 0.1, len: 4, notes: 'A4 . . . D5 . . . C5 . . . A4 . . . B4 . . . G4 . . . A4 . . . E4 . . .' },
        { wave: 'triangle', gain: 0.07, len: 2, notes: 'D5 . F5 . A5 . . . G5 . E5 . C5 . . . D5 . F5 . B4 . . . E5 . C#5 . A4 . . .' },
        { wave: 'sine', gain: 0.05, len: 14, notes: 'D6 . . . . . . . E6 . . . . . . . F6 . . . . . . . E6 . . . . . . .' }
      ]
    },
    town_forge: {
      name: 'Молоты Старого Горна', step: 0.24,
      voices: [
        { wave: 'noise', gain: 0.07, len: 1, notes: 'x . . x . . x . x . . x . . x . x . . x . . x . x . . x . x x .' },
        { wave: 'sawtooth', gain: 0.05, len: 8, notes: 'D2 . . . . . . . . . . . . . . . A1 . . . . . . . . . . . . . . .' },
        { wave: 'square', gain: 0.06, len: 3, notes: 'D3 . . F3 . . G3 . . A3 . . . . . . C4 . . A3 . . G3 . . F3 . . . . . .' },
        { wave: 'triangle', gain: 0.12, len: 2, notes: 'D4 . . . A3 . . . D4 . F4 . E4 . . . D4 . . . C4 . . . A3 . . . D4 . . .' }
      ]
    },
    town_tide: {
      name: 'Прибой и колыбельная', step: 0.3,
      voices: [
        { wave: 'noise', gain: 0.05, len: 8, notes: 'x . . . . . . . . . . . x . . . . . . . . . . . x . . . . . . .' },
        { wave: 'sine', gain: 0.11, len: 12, notes: 'A2 . . . . . . . . . . . E3 . . . . . . . . . . . F2 . . . . . . .' },
        { wave: 'triangle', gain: 0.14, len: 4, notes: 'E5 . . . C5 . . . A4 . . . C5 . . . D5 . . . B4 . . . G4 . . . A4 . . .' },
        { wave: 'sine', gain: 0.05, len: 1, notes: 'E6 . . A5 . . C6 . . E6 . . B5 . . D6 . . G5 . . B5 . . A5 . . C6 . . . .' }
      ]
    },
    town_thicket: {
      name: 'Гусли и туман', step: 0.26,
      voices: [
        { wave: 'triangle', gain: 0.12, len: 1, notes: 'E4 B4 G4 B4 E4 B4 G4 B4 D4 A4 F#4 A4 D4 A4 F#4 A4 C4 G4 E4 G4 C4 G4 E4 G4 B3 F#4 D4 F#4 B3 F#4 D4 F#4' },
        { wave: 'sine', gain: 0.1, len: 8, notes: 'E3 . . . . . . . D3 . . . . . . . C3 . . . . . . . B2 . . . . . . .' },
        { wave: 'square', gain: 0.03, len: 3, notes: 'B5 . . . G5 . A5 . B5 . . . D6 . . . C6 . . . A5 . G5 . E5 . . . . . . .' },
        { wave: 'sine', gain: 0.05, len: 16, notes: 'E5 . . . . . . . . . . . . . . . G5 . . . . . . . . . . . . . . .' }
      ]
    },
    town_barrows: {
      name: 'Соль и ветер', step: 0.3,
      voices: [
        { wave: 'sawtooth', gain: 0.04, len: 24, notes: 'D2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
        { wave: 'sine', gain: 0.12, len: 24, notes: 'D3 . . . . . . . . . . . . . . . A2 . . . . . . . . . . . . . . .' },
        { wave: 'square', gain: 0.03, len: 1, notes: 'D4 D4 A4 D4 D4 C5 D4 D4 A4 D4 G4 D4 D4 F4 D4 D4 A3 A3 E4 A3 A3 G4 A3 A3 E4 A3 D4 A3 A3 C4 A3 C4' },
        { wave: 'triangle', gain: 0.14, len: 3, notes: 'D4 . . . F4 . E4 D4 C4 . . . D4 . . . A3 . . . C4 . D4 . A3 . . . . . . .' },
        { wave: 'noise', gain: 0.07, len: 1, notes: 'x . . . x . x . x . . . x . . . x . . . x . x . x . . . x . x .' }
      ]
    },
    camp_map: {
      name: 'Венец', step: 0.36,
      voices: [
        { wave: 'sine', gain: 0.14, len: 8, notes: 'A2 . . . . . . . F2 . . . . . . . C3 . . . . . . . G2 . . . . . . .' },
        { wave: 'triangle', gain: 0.1, len: 2, notes: 'A3 E4 A4 E4 C4 E4 A3 E4 F3 C4 F4 C4 A3 C4 F3 C4 G3 C4 E4 C4 G3 C4 E4 C4 G3 D4 G4 D4 B3 D4 G3 D4' },
        { wave: 'sine', gain: 0.16, len: 6, notes: 'E5 . . . D5 . C5 . A4 . . . . . C5 . E5 . . . G5 . E5 . D5 . . . . . . .' }
      ]
    },
    camp_tysyacha: {
      name: 'Тысячелетие', step: 0.36,
      voices: [
        { wave: 'sawtooth', gain: 0.035, len: 16, notes: 'D2 . . . . . . . . . . . . . . . A1 . . . . . . . . . . . . . . .' },
        { wave: 'sine', gain: 0.1, len: 8, notes: 'F3 . . . . . . . E3 . . . . . . . D3 . . . . . . . C#3 . . . . . . .' },
        { wave: 'triangle', gain: 0.13, len: 3, notes: 'A4 . . D5 . . F5 . . E5 . . D5 . . . C5 . . A4 . . A#4 . . A4 . . . . . .' },
        { wave: 'sine', gain: 0.05, len: 12, notes: 'D6 . . . . . . . . . . . A5 . . . . . . . . . . . F5 . . . E5 . . .' }
      ]
    },
    finale: {
      name: 'Первое утро', step: 0.4,
      voices: [
        { wave: 'sine', gain: 0.11, len: 16, notes: 'D3 . . . . . . . . . . . . . . . G2 . . . . . . . A2 . . . . . . .' },
        { wave: 'triangle', gain: 0.14, len: 3, notes: 'F#4 . . A4 . . D5 . . C#5 . . B4 . . . A4 . . G4 . . F#4 . . E4 . . . . . .' },
        { wave: 'sine', gain: 0.06, len: 14, notes: 'A5 . . . . . . . . . . . . . . . B5 . . . . . . . C#6 . . . . . . .' },
        { wave: 'square', gain: 0.025, len: 8, notes: 'D4 . . . . . . . F#4 . . . . . . . G4 . . . . . . . A4 . . . . . . .' }
      ]
    },
    camp_chasha: {
      name: 'Чаша', step: 0.34,
      voices: [
        { wave: 'sine', gain: 0.11, len: 16, notes: 'A2 . . . . . . . . . . . . . . . E2 . . . . . . . . . . . . . . .' },
        { wave: 'triangle', gain: 0.14, len: 3, notes: 'E4 . . A4 . . C5 . . B4 . . A4 . . . G4 . . E4 . . F4 . . E4 . . . . . .' },
        { wave: 'sine', gain: 0.05, len: 1, notes: 'A5 . . . E5 . . . . . . . C6 . . . . . . . B5 . . . . . . . E5 . . .' },
        { wave: 'noise', gain: 0.04, len: 8, notes: 'x . . . . . . . . . . . . . . . x . . . . . . . . . . . . . . .' }
      ]
    },
    camp_zhar: {
      name: 'Жар', step: 0.28,
      voices: [
        { wave: 'noise', gain: 0.06, len: 1, notes: 'x . . . x . . . x . x . x . . . x . . . x . . . x . x . x . x .' },
        { wave: 'sawtooth', gain: 0.05, len: 12, notes: 'E2 . . . . . . . . . . . . . . . C2 . . . . . . . . . . . . . . .' },
        { wave: 'square', gain: 0.06, len: 3, notes: 'E3 . . G3 . . A3 . . B3 . . A3 . . . G3 . . E3 . . D3 . . E3 . . . . . .' },
        { wave: 'triangle', gain: 0.12, len: 2, notes: 'B4 . . . A4 . G4 . E4 . . . . . . . D4 . E4 . G4 . A4 . B4 . . . . . . .' }
      ]
    },
    camp_zapoved: {
      name: 'Заповедь', step: 0.3,
      voices: [
        { wave: 'sine', gain: 0.1, len: 16, notes: 'G2 . . . . . . . . . . . . . . . D3 . . . . . . . . . . . . . . .' },
        { wave: 'triangle', gain: 0.14, len: 2, notes: 'G4 . B4 . D5 . . . E5 . D5 . B4 . A4 . G4 . . . A4 . B4 . D5 . . . B4 . A4 .' },
        { wave: 'square', gain: 0.03, len: 1, notes: 'G4 D5 B4 D5 G4 D5 B4 D5 E4 B4 G4 B4 E4 B4 G4 B4 D4 A4 F#4 A4 D4 A4 F#4 A4 G3 D4 B3 D4 G3 D4 B3 D4' }
      ]
    },
    camp_sol: {
      name: 'Соль', step: 0.32,
      voices: [
        { wave: 'sawtooth', gain: 0.03, len: 28, notes: 'A1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
        { wave: 'triangle', gain: 0.15, len: 4, notes: 'A3 . . C4 D4 . . . E4 . D4 C4 A3 . . . G3 . . A3 C4 . . . D4 . C4 A3 G3 . . .' },
        { wave: 'sine', gain: 0.12, len: 10, notes: 'E4 . . . . . . . . . . . . . . . D4 . . . . . . . . . . . . . . .' },
        { wave: 'noise', gain: 0.06, len: 1, notes: 'x . . . . . x . x . . . . . . . x . . . . . x . x . . . x . . .' }
      ]
    },
    camp_nabat: {
      name: 'Набат', step: 0.26,
      voices: [
        { wave: 'sine', gain: 0.17, len: 12, notes: 'D5 . . . . . D5 . . . . . D5 . . . F5 . . . . . F5 . . . . . E5 . . .' },
        { wave: 'sine', gain: 0.06, len: 12, notes: 'A5 . . . . . A5 . . . . . A5 . . . C6 . . . . . C6 . . . . . B5 . . .' },
        { wave: 'triangle', gain: 0.15, len: 2, notes: 'D3 . . D3 A2 . D3 . A#2 . . A#2 F3 . A#2 . C3 . . C3 G3 . C3 . A2 . . A2 E3 . A2 .' },
        { wave: 'noise', gain: 0.05, len: 1, notes: 'x . . x . . x . x . . x . . x . x . . x . . x . x . . x . . x .' }
      ]
    },
    victory: {
      name: 'Победа', step: 0.2, once: true,
      voices: [
        { wave: 'square', gain: 0.07, len: 3, notes: 'D4 F#4 A4 D5 . A4 D5 F#5 . . . . .' },
        { wave: 'triangle', gain: 0.15, len: 8, notes: 'D3 . . . A3 . . . D3 . . . .' }
      ]
    },
    defeat: {
      name: 'Поражение', step: 0.3, once: true,
      voices: [
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'A4 F4 D4 C#4 . D4 A3 . . .' },
        { wave: 'sine', gain: 0.15, len: 8, notes: 'D3 . . . A2 . . . . .' }
      ]
    }
  };

  const STEP_NOISE = { meadow: 900, steppe: 1100, palegrass: 900, forest: 700, swamp: 420, sand: 1500, saltflat: 1800, highland: 1300, ash: 1000, cave: 1200, fungal: 500 };
  const WEAPON = { melee: 1, retal: 1, support: 0.8, pole: 1, shot: 0.7, saddle: 0.7, volley: 0.8, splash: 0.7, through: 0.7, trample: 0.9, sweep: 0.9, arc: 0.7, bell: 0.9, spell: 0.9, poison: 0.5, fire: 0.6, thorn: 0.5, last: 1 };

  const BLOWS = {
    spear: { band: 1100, gain: 0.24, dur: 0.11, ping: ['square', 240, 120, 0.05, 0.08] },
    blade: { band: 1900, gain: 0.26, dur: 0.1, ping: ['triangle', 900, 420, 0.07, 0.09] },
    pole: { band: 800, gain: 0.3, dur: 0.15, ping: ['square', 200, 90, 0.08, 0.13] },
    mace: { band: 520, gain: 0.3, dur: 0.14, ping: ['square', 150, 70, 0.1, 0.12] },
    hoof: { band: 380, gain: 0.34, dur: 0.18, ping: ['sawtooth', 120, 50, 0.1, 0.16] },
    cold: { band: 2400, gain: 0.2, dur: 0.2, ping: ['sine', 660, 240, 0.08, 0.2] },
    stone: { band: 300, gain: 0.34, dur: 0.16, ping: ['square', 110, 45, 0.11, 0.14] },
    claw: { band: 1500, gain: 0.24, dur: 0.09, ping: ['sawtooth', 420, 160, 0.06, 0.08] }
  };
  const SHOTS = {
    bolt: { band: 2800, gain: 0.12, dur: 0.16, q: 3, ping: ['square', 700, 300, 0.03, 0.05] },
    arrow: { band: 3400, gain: 0.1, dur: 0.14, q: 4, ping: null },
    gun: { band: 1300, gain: 0.26, dur: 0.16, q: 0.8, ping: ['square', 300, 80, 0.08, 0.1] },
    bomb: { band: 640, gain: 0.32, dur: 0.3, q: 0.6, ping: ['sine', 240, 50, 0.14, 0.26] },
    cannon: { band: 240, gain: 0.46, dur: 0.46, q: 0.5, ping: ['sine', 130, 34, 0.24, 0.42] }
  };
  const FALLS = {
    man: { ping: ['sawtooth', 300, 80, 0.09, 0.26], band: 420, gain: 0.14, dur: 0.22 },
    iron: { ping: ['square', 340, 90, 0.08, 0.3], band: 1500, gain: 0.2, dur: 0.3 },
    horse: { ping: ['sawtooth', 500, 70, 0.1, 0.4], band: 300, gain: 0.22, dur: 0.34 },
    gas: { ping: ['triangle', 900, 120, 0.1, 0.34], band: 2100, gain: 0.16, dur: 0.3 },
    gun: { ping: ['sine', 110, 30, 0.2, 0.42], band: 240, gain: 0.3, dur: 0.4 },
    stone: { ping: ['square', 180, 40, 0.12, 0.36], band: 420, gain: 0.26, dur: 0.34 },
    spirit: { ping: ['sine', 700, 200, 0.08, 0.42], band: 3000, gain: 0.08, dur: 0.36 }
  };
  const SOUND_OF = {
    militia: ['spear', null, 'man'], pikeman: ['spear', null, 'man'], shieldbearer: ['spear', null, 'iron'],
    crossbow: ['blade', 'bolt', 'man'], heavycrossbow: ['blade', 'bolt', 'man'], skirmisher: ['blade', 'bolt', 'man'],
    ringer: ['mace', null, 'man'], alarmist: ['mace', null, 'man'], herald: ['mace', null, 'man'],
    plated: ['blade', null, 'iron'], halberdier: ['pole', null, 'iron'], cityguard: ['blade', null, 'iron'],
    aeronaut: ['blade', 'gun', 'gas'], bomber: ['blade', 'bomb', 'gas'], spotter: ['blade', 'gun', 'gas'],
    horseguard: ['hoof', null, 'horse'], palaceknight: ['hoof', null, 'horse'], cuirassier: ['hoof', 'gun', 'horse'],
    bombard: ['mace', 'cannon', 'gun'], mortar: ['mace', 'bomb', 'gun'], culverin: ['mace', 'cannon', 'gun'],
    shade: ['cold', null, 'spirit'], mourner: ['cold', null, 'spirit'], dustguard: ['cold', null, 'spirit'],
    horsebow: ['blade', 'arrow', 'horse'], steppearcher: ['blade', 'arrow', 'horse'], lasso: ['hoof', 'arrow', 'horse'],
    stonewoman: ['stone', null, 'stone'], kinidol: ['stone', null, 'stone'], speakingstone: ['stone', null, 'stone'],
    eaglespirit: ['claw', null, 'spirit'], stormeagle: ['claw', null, 'spirit'], soulcatcher: ['claw', null, 'spirit'],
    saltnoyon: ['blade', null, 'man'], shamannoyon: ['blade', null, 'man'], thousander: ['blade', null, 'man'],
    bonebull: ['hoof', null, 'horse'], thunderbull: ['hoof', null, 'horse'], greybull: ['hoof', null, 'horse'],
    stonekhan: ['stone', null, 'stone'], kurgankhan: ['stone', null, 'stone'], stormkhan: ['stone', 'bomb', 'stone'],
    auka: ['claw', null, 'man'], mocker: ['claw', null, 'man'], wisp: ['cold', 'arrow', 'spirit'],
    werewolf: ['claw', null, 'man'], elderwolf: ['claw', null, 'man'], greyturn: ['claw', null, 'man'],
    bereginya: ['cold', null, 'spirit'], keeper: ['cold', null, 'spirit'], rusalka: ['cold', null, 'spirit'],
    kikimora: ['claw', 'arrow', 'man'], bogwitch: ['claw', 'arrow', 'man'], spinner: ['claw', 'arrow', 'man'],
    sirin: ['claw', null, 'spirit'], alkonost: ['claw', null, 'spirit'], gamayun: ['claw', null, 'spirit'],
    leshy: ['mace', null, 'stone'], borovik: ['mace', null, 'stone'], warden: ['mace', null, 'stone'],
    zmey: ['hoof', null, 'horse'], threeheaded: ['hoof', null, 'horse'], firezmey: ['hoof', null, 'horse'],
    woodtree: ['mace', null, 'stone'],
    shellman: ['spear', null, 'iron'], claw: ['claw', null, 'iron'], shellback: ['spear', null, 'iron'],
    harpooner: ['spear', 'bolt', 'man'], whaler: ['spear', 'bolt', 'man'], netter: ['spear', 'arrow', 'man'],
    jelly: ['cold', null, 'gas'], deeplight: ['cold', null, 'gas'], stinger: ['cold', null, 'gas'],
    seawitch: ['cold', 'arrow', 'man'], abyssinger: ['cold', 'arrow', 'man'], saltwitch: ['cold', 'arrow', 'man'],
    rayrider: ['blade', null, 'spirit'], stormray: ['blade', null, 'spirit'], nightray: ['blade', null, 'spirit'],
    turtlefort: ['mace', 'bolt', 'stone'], turtleram: ['hoof', null, 'stone'], turtlebeacon: ['mace', null, 'stone'],
    apprentice: ['mace', null, 'man'], hammerer: ['mace', null, 'man'], stoker: ['mace', 'bomb', 'man'],
    salamander: ['claw', null, 'man'], firelizard: ['claw', null, 'man'], bladelizard: ['blade', null, 'man'],
    obsidianspider: ['claw', null, 'stone'], glassblower: ['claw', 'arrow', 'stone'], blackspider: ['claw', null, 'stone'],
    caster: ['mace', 'gun', 'man'], mastercaster: ['mace', 'gun', 'man'], temperer: ['mace', 'gun', 'man'],
    steamling: ['cold', null, 'gas'], geyser: ['cold', null, 'gas'], overheated: ['cold', null, 'gas'],
    slaggiant: ['stone', null, 'stone'], obsidiangiant: ['stone', null, 'stone'], slagthrower: ['stone', 'bomb', 'stone'],
    volcano: ['stone', 'cannon', 'stone'], firemountain: ['stone', 'cannon', 'stone'], sleepingvolcano: ['stone', 'cannon', 'stone'],
    kraken: ['hoof', null, 'gas'], ancientkraken: ['hoof', null, 'gas'], devourer: ['hoof', null, 'gas'],
    legionary: ['blade', null, 'spirit'], standardbearer: ['spear', null, 'spirit'], mirrorlegion: ['blade', null, 'spirit'],
    moonarcher: ['blade', 'arrow', 'man'], silverarcher: ['blade', 'arrow', 'man'], moonhunter: ['blade', 'arrow', 'man'],
    mirrorguard: ['pole', null, 'iron'], prismguard: ['pole', null, 'iron'], mirrorswap: ['pole', null, 'iron'],
    moonmaiden: ['cold', 'bolt', 'man'], whitemaiden: ['cold', 'bolt', 'man'], silvermaiden: ['cold', 'bolt', 'man'],
    deerrider: ['hoof', null, 'horse'], silverrider: ['hoof', null, 'horse'], deerhunter: ['hoof', 'arrow', 'horse'],
    throneknight: ['blade', null, 'iron'], oathkeeper: ['mace', null, 'iron'], punisher: ['blade', null, 'iron'],
    shard: ['stone', 'bolt', 'stone'], radiantshard: ['stone', 'bolt', 'stone'], darkshard: ['stone', 'bolt', 'stone'],
    moonking: ['cold', null, 'spirit']
  };
  const BY_SHAPE = {
    foot: ['blade', null, 'man'], shooter: ['blade', 'arrow', 'man'], heavy: ['mace', 'arrow', 'iron'], spirit: ['cold', 'arrow', 'spirit'], rider: ['hoof', 'arrow', 'horse'], idol: ['stone', 'arrow', 'iron'],
    bird: ['claw', null, 'spirit'], beast: ['claw', null, 'horse'], engine: ['mace', 'cannon', 'gun'], blob: ['claw', null, 'spirit'], serpent: ['claw', null, 'horse']
  };
  const soundOf = id => (id && (SOUND_OF[id] || BY_SHAPE[H.UNITS[id].shape])) || ['blade', 'arrow', 'man'];

  class Sound {
    constructor(ctx, volumes) {
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.ratio.value = 3;
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus.connect(this.comp);
      this.sfxBus.connect(this.comp);
      this.comp.connect(this.master);
      this.master.connect(ctx.destination);
      this.setVolumes(volumes);
      const len = Math.floor(ctx.sampleRate * 0.5), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.theme = null;
      this.at = 0;
      this.pos = 0;
      this.timer = setInterval(() => this.schedule(), 90);
    }

    setVolumes(v) {
      this.musicBus.gain.value = v.music;
      this.sfxBus.gain.value = v.sound;
    }

    play(id) {
      if (this.theme === id) return;
      this.theme = id;
      this.pos = 0;
      this.at = this.ctx.currentTime + 0.08;
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    }

    stop() {
      this.theme = null;
    }

    tone(voice, name, when, dur, bus) {
      const c = this.ctx, g = c.createGain();
      g.connect(bus);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(voice.gain, when + Math.min(0.02, dur / 4));
      g.gain.exponentialRampToValueAtTime(Math.max(0.0005, voice.gain * 0.03), when + dur);
      let src;
      if (voice.wave === 'noise') {
        src = c.createBufferSource();
        src.buffer = this.noise;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2400;
        src.connect(f);
        f.connect(g);
      } else {
        src = c.createOscillator();
        src.type = voice.wave;
        src.frequency.value = freq(name);
        src.connect(g);
      }
      src.onended = () => g.disconnect();
      src.start(when);
      src.stop(when + dur + 0.02);
    }

    schedule() {
      if (!this.theme || this.ctx.state !== 'running') return;
      const th = THEMES[this.theme], rows = th.voices.map(v => v.notes.split(' ')), n = Math.max(...rows.map(r => r.length));
      if (this.at < this.ctx.currentTime) this.at = this.ctx.currentTime + 0.05;
      while (this.at < this.ctx.currentTime + 0.3) {
        th.voices.forEach((v, i) => {
          const name = rows[i][this.pos % rows[i].length];
          if (name !== '.') this.tone(v, name, this.at, th.step * v.len, this.musicBus);
        });
        this.at += th.step;
        this.pos++;
        if (this.pos >= n) {
          if (th.once) {
            this.theme = null;
            return;
          }
          this.pos = 0;
        }
      }
    }

    burst(band, gain, dur, q) {
      const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), when = c.currentTime;
      src.buffer = this.noise;
      f.type = 'bandpass';
      f.frequency.value = band;
      f.Q.value = q || 1;
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.onended = () => g.disconnect();
      src.start(when, Math.random() * 0.3);
      src.stop(when + dur + 0.02);
    }

    ping(wave, from, to, gain, dur) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), when = c.currentTime;
      o.type = wave;
      o.frequency.setValueAtTime(from, when);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + dur);
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
      o.connect(g);
      g.connect(this.sfxBus);
      o.onended = () => g.disconnect();
      o.start(when);
      o.stop(when + dur + 0.02);
    }

    click() {
      this.ping('square', 880, 660, 0.05, 0.05);
    }

    pop() {
      this.ping('triangle', 300, 520, 0.09, 0.1);
    }

    coin() {
      this.ping('square', 1300, 1700, 0.04, 0.08);
      this.ping('square', 1900, 2300, 0.03, 0.12);
    }

    step(terrain) {
      this.burst(STEP_NOISE[terrain] || 900, 0.13, 0.09, 1.4);
    }

    hit(o) {
      const a = o || {}, k = WEAPON[a.kind] || 0.8;
      if (a.kind === 'bell') {
        this.ping('sine', 880, 870, 0.14, 0.7);
        this.ping('sine', 1320, 1310, 0.07, 0.5);
        return;
      }
      const b = BLOWS[soundOf(a.unit)[0]];
      this.burst(b.band * (0.9 + Math.random() * 0.2), b.gain * k, b.dur, 0.8);
      this.ping(b.ping[0], b.ping[1], b.ping[2], b.ping[3] * k, b.ping[4]);
    }

    shot(unit) {
      const b = SHOTS[soundOf(unit)[1] || 'arrow'];
      this.burst(b.band, b.gain, b.dur, b.q);
      if (b.ping) this.ping(...b.ping);
    }

    death(unit) {
      const b = FALLS[soundOf(unit)[2]];
      this.ping(...b.ping);
      this.burst(b.band, b.gain, b.dur, 0.7);
    }

    cast() {
      this.ping('sine', 500, 1500, 0.09, 0.32);
      this.ping('triangle', 750, 2200, 0.05, 0.4);
    }

    destroy() {
      clearInterval(this.timer);
      this.theme = null;
      this.master.disconnect();
    }
  }

  H.THEMES = THEMES;
  H.UNIT_SOUNDS = { BLOWS, SHOTS, FALLS, SOUND_OF, BY_SHAPE, soundOf };
  H.noteFreq = freq;
  H.Sound = Sound;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
