/**
 * Doom 98 — static data: 256-colour palette, thing/weapon tables with Doom-style state machines, strings.
 * Pure data, no DOM: loaded by the browser and by Node tests.
 */
(function (D) {
  'use strict';
  const TICRATE = 35;

  // ---------------------------------------------------------------- palette: 16 ramps x 16 shades
  // index = ramp * 16 + shade (0 darkest .. 15 brightest). Index 0 is transparent in sprites.
  const RAMP = { GRAY: 0, BROWN: 1, SKIN: 2, RED: 3, GREEN: 4, OLIVE: 5, BLUE: 6, ORANGE: 7, YELLOW: 8, STEEL: 9, PINK: 10, RUST: 11, PURPLE: 12, CYAN: 13, CONCRETE: 14, GOLD: 15 };
  const RAMP_KEYS = [
    [[0, 0, 0], [128, 128, 128], [255, 255, 255]],
    [[18, 10, 4], [118, 78, 40], [222, 184, 134]],
    [[40, 22, 12], [178, 122, 82], [255, 224, 186]],
    [[28, 0, 0], [176, 18, 10], [255, 150, 128]],
    [[0, 18, 0], [40, 140, 30], [196, 255, 150]],
    [[10, 14, 4], [82, 92, 42], [186, 196, 124]],
    [[0, 0, 32], [34, 54, 206], [176, 196, 255]],
    [[42, 10, 0], [232, 112, 12], [255, 234, 150]],
    [[40, 30, 0], [220, 190, 24], [255, 255, 204]],
    [[8, 10, 14], [92, 100, 116], [212, 222, 236]],
    [[40, 10, 16], [204, 92, 104], [255, 214, 214]],
    [[16, 8, 4], [94, 52, 26], [176, 114, 72]],
    [[16, 0, 22], [112, 40, 144], [232, 182, 255]],
    [[0, 16, 16], [22, 132, 132], [184, 255, 255]],
    [[12, 11, 10], [112, 106, 96], [232, 226, 212]],
    [[30, 20, 4], [172, 122, 40], [255, 232, 162]]
  ];
  const PALETTE = new Uint8Array(768);
  for (let r = 0; r < 16; r++) {
    const [a, m, b] = RAMP_KEYS[r];
    for (let s = 0; s < 16; s++) {
      const t = s / 15, lo = t < 0.5, k = lo ? t * 2 : (t - 0.5) * 2, p = lo ? a : m, q = lo ? m : b;
      for (let c = 0; c < 3; c++) PALETTE[(r * 16 + s) * 3 + c] = Math.round(p[c] + (q[c] - p[c]) * k);
    }
  }
  const C = (ramp, shade) => ramp * 16 + Math.max(0, Math.min(15, Math.round(shade)));

  // ---------------------------------------------------------------- mobj flags
  const MF = {
    SPECIAL: 1, SOLID: 2, SHOOTABLE: 4, NOSECTOR: 8, NOGRAVITY: 16, DROPOFF: 32, PICKUP: 64, NOCLIP: 128,
    FLOAT: 256, MISSILE: 512, DROPPED: 1024, SHADOW: 2048, NOBLOOD: 4096, CORPSE: 8192, COUNTKILL: 16384,
    COUNTITEM: 32768, SKULLFLY: 65536, AMBUSH: 131072, JUSTHIT: 262144, JUSTATTACKED: 524288, SPAWNCEILING: 1048576,
    INFLOAT: 2097152, TELEPORT: 4194304, BOSS: 8388608
  };

  // State strings: "A10:look" = frame A for 10 tics then call action; "*" = fullbright; ">label" = goto; tics -1 = forever.
  const MONSTER = MF.SOLID | MF.SHOOTABLE | MF.COUNTKILL;
  const THINGS = {
    player: { sprite: 'PLAY', hp: 100, radius: 16, height: 56, mass: 100, speed: 0, flags: MF.SOLID | MF.SHOOTABLE | MF.DROPOFF | MF.PICKUP, pain: 255,
      states: { spawn: 'A-1', see: 'A4 B4 C4 D4 >see', missile: 'E12 >spawn', melee: 'F6* >missile', pain: 'G4 G4:pain >spawn', death: 'H10 I10:playerScream J10:fall K10 L10 M10 N-1', xdeath: 'O5 P5:xscream Q5:fall R5 S5 T5 U5 V5 W-1' } },
    zombie: { name: 'Zombieman', sprite: 'POSS', hp: 20, radius: 20, height: 56, mass: 100, speed: 8, pain: 200, reaction: 8, flags: MONSTER, drop: 'clip',
      sounds: { see: 'posit', active: 'posact', pain: 'popain', death: 'podth', attack: 'pistol' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A4:chase A4:chase B4:chase B4:chase C4:chase C4:chase D4:chase D4:chase >see', missile: 'E10:face F8*:posAttack E8 >see', pain: 'G3 G3:pain >see', death: 'H5 I5:scream J5:fall K5 L-1', xdeath: 'M5 N5:xscream O5:fall P5 Q5 R5 S5 T5 U-1' } },
    sgguy: { name: 'Shotgun Guy', sprite: 'SPOS', hp: 30, radius: 20, height: 56, mass: 100, speed: 8, pain: 170, reaction: 8, flags: MONSTER, drop: 'shotgun',
      sounds: { see: 'posit', active: 'posact', pain: 'popain', death: 'podth', attack: 'shotgn' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A3:chase A3:chase B3:chase B3:chase C3:chase C3:chase D3:chase D3:chase >see', missile: 'E10:face F10*:sposAttack E10 >see', pain: 'G3 G3:pain >see', death: 'H5 I5:scream J5:fall K5 L-1', xdeath: 'M5 N5:xscream O5:fall P5 Q5 R5 S5 T5 U-1' } },
    imp: { name: 'Imp', sprite: 'TROO', hp: 60, radius: 20, height: 56, mass: 100, speed: 8, pain: 200, reaction: 8, flags: MONSTER,
      sounds: { see: 'bgsit', active: 'bgact', pain: 'popain', death: 'bgdth', attack: 'claw' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A3:chase A3:chase B3:chase B3:chase C3:chase C3:chase D3:chase D3:chase >see', melee: 'E8:face F8:face G6:troopAttack >see', missile: 'E8:face F8:face G6:troopAttack >see', pain: 'H2 H2:pain >see', death: 'I8 J8:scream K6 L6:fall M-1', xdeath: 'N5 O5:xscream P5 Q5:fall R5 S5 T5 U-1' } },
    demon: { name: 'Demon', sprite: 'SARG', hp: 150, radius: 30, height: 56, mass: 400, speed: 10, pain: 180, reaction: 8, flags: MONSTER,
      sounds: { see: 'sgtsit', active: 'dmact', pain: 'dmpain', death: 'sgtdth', attack: 'sgtatk' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A2:chase A2:chase B2:chase B2:chase C2:chase C2:chase D2:chase D2:chase >see', melee: 'E8:face F8:face G8:sargAttack >see', pain: 'H2 H2:pain >see', death: 'I8 J8:scream K4 L4:fall M4 N-1' } },
    spectre: { name: 'Spectre', sprite: 'SARG', hp: 150, radius: 30, height: 56, mass: 400, speed: 10, pain: 180, reaction: 8, flags: MONSTER | MF.SHADOW, inherit: 'demon' },
    soul: { name: 'Lost Soul', sprite: 'SKUL', hp: 100, radius: 16, height: 56, mass: 50, speed: 8, pain: 256, reaction: 8, damage: 3, flags: MONSTER | MF.FLOAT | MF.NOGRAVITY | MF.NOBLOOD,
      sounds: { active: 'dmact', pain: 'dmpain', death: 'firxpl', attack: 'sklatk' },
      states: { spawn: 'A10*:look B10*:look >spawn', see: 'A6*:chase B6*:chase >see', missile: 'C10*:face D4*:skullAttack C4* D4* >missile+2', pain: 'E3* E3*:pain >see', death: 'F6* G6*:scream H6* I6*:fall J6 K6 >null' } },
    caco: { name: 'Cacodemon', sprite: 'HEAD', hp: 400, radius: 31, height: 56, mass: 400, speed: 8, pain: 128, reaction: 8, flags: MONSTER | MF.FLOAT | MF.NOGRAVITY,
      sounds: { see: 'cacsit', active: 'dmact', pain: 'dmpain', death: 'cacdth' },
      states: { spawn: 'A10:look >spawn', see: 'A3:chase >see', missile: 'B5:face C5:face D5*:headAttack >see', pain: 'E3 E3:pain F6 >see', death: 'G8 H8:scream I8 J8 K8:fall L-1' } },
    baron: { name: 'Baron of Hell', sprite: 'BOSS', hp: 1000, radius: 24, height: 64, mass: 1000, speed: 8, pain: 50, reaction: 8, flags: MONSTER,
      sounds: { see: 'brssit', active: 'dmact', pain: 'dmpain', death: 'brsdth' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A3:chase A3:chase B3:chase B3:chase C3:chase C3:chase D3:chase D3:chase >see', melee: 'E8:face F8:face G8:bruisAttack >see', pain: 'H2 H2:pain >see', death: 'I8 J8:scream K8 L8 M8:fall N8 O-1' } },
    cyber: { name: 'Cyberdemon', sprite: 'CYBR', hp: 4000, radius: 40, height: 110, mass: 1000, speed: 16, pain: 20, reaction: 8, flags: MONSTER | MF.BOSS,
      sounds: { see: 'cybsit', active: 'dmact', pain: 'dmpain', death: 'cybdth' },
      states: { spawn: 'A10:look B10:look >spawn', see: 'A3:hoof A3:chase B3:chase B3:chase C3:chase C3:chase D3:metal D3:chase >see', missile: 'E6:face F12*:cyberAttack E12:face F12*:cyberAttack E12:face F12*:cyberAttack >see', pain: 'G10:pain >see', death: 'H10 I10:scream J10 K10 L10 M10:fall N10 O10 P30 P-1:bossDeath' } },

    // ---- projectiles & effects
    impball: { sprite: 'BAL1', radius: 6, height: 8, speed: 10, damage: 3, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { see: 'firsht', death: 'firxpl' },
      states: { spawn: 'A4* B4* >spawn', death: 'C6* D6* E6* >null' } },
    cacoball: { sprite: 'BAL2', radius: 6, height: 8, speed: 10, damage: 5, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { see: 'firsht', death: 'firxpl' },
      states: { spawn: 'A4* B4* >spawn', death: 'C6* D6* E6* >null' } },
    baronball: { sprite: 'BAL7', radius: 6, height: 16, speed: 15, damage: 8, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { see: 'firsht', death: 'firxpl' },
      states: { spawn: 'A4* B4* >spawn', death: 'C6* D6* E6* >null' } },
    rocket: { sprite: 'MISL', radius: 11, height: 8, speed: 20, damage: 20, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { see: 'rlaunc', death: 'barexp' },
      states: { spawn: 'A1* >spawn', death: 'B8*:explode C6* D4* >null' } },
    plasmaball: { sprite: 'PLSS', radius: 13, height: 8, speed: 25, damage: 5, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { see: 'plasma', death: 'firxpl' },
      states: { spawn: 'A6* B6* >spawn', death: 'C4* D4* E4* F4* G4* >null' } },
    bfgball: { sprite: 'BFS1', radius: 13, height: 8, speed: 25, damage: 100, flags: MF.NOGRAVITY | MF.MISSILE | MF.DROPOFF, sounds: { death: 'rxplod' },
      states: { spawn: 'A4* B4* >spawn', death: 'C8* D8* E8*:bfgSpray F8* G8* H8* >null' } },
    bfgspray: { sprite: 'BFE2', radius: 20, height: 16, flags: MF.NOGRAVITY, states: { spawn: 'A8* B8* C8* D8* >null' } },
    puff: { sprite: 'PUFF', radius: 20, height: 16, flags: MF.NOGRAVITY, states: { spawn: 'A4* B4 C4 D4 >null' } },
    blood: { sprite: 'BLUD', radius: 20, height: 16, flags: 0, states: { spawn: 'C8 B8 A8 >null' } },
    tfog: { sprite: 'TFOG', radius: 20, height: 16, flags: MF.NOGRAVITY, states: { spawn: 'A6* B6* A6* B6* C6* D6* E6* F6* G6* H6* I6* J6* >null' } },
    ifog: { sprite: 'IFOG', radius: 20, height: 16, flags: MF.NOGRAVITY, states: { spawn: 'A6* B6* A6* B6* C6* D6* E6* >null' } },
    teledest: { sprite: null, radius: 20, height: 16, flags: MF.NOGRAVITY, states: { spawn: 'A-1' } },

    // ---- shootable scenery
    barrel: { name: 'Barrel', sprite: 'BAR1', hp: 20, radius: 10, height: 42, mass: 100, flags: MF.SOLID | MF.SHOOTABLE | MF.NOBLOOD, sounds: { death: 'barexp' },
      states: { spawn: 'A6 B6 >spawn', death: 'C5* D5*:scream E5* F10*:explode G10* >null' } },

    // ---- pickups (flags SPECIAL)
    clip: { sprite: 'CLIP', pickup: 'ammo', ammo: 'bullets', amount: 10, msg: 'gotclip' },
    ammobox: { sprite: 'AMMO', pickup: 'ammo', ammo: 'bullets', amount: 50, msg: 'gotclipbox' },
    shells: { sprite: 'SHEL', pickup: 'ammo', ammo: 'shells', amount: 4, msg: 'gotshells' },
    shellbox: { sprite: 'SBOX', pickup: 'ammo', ammo: 'shells', amount: 20, msg: 'gotshellbox' },
    rocketammo: { sprite: 'ROCK', pickup: 'ammo', ammo: 'rockets', amount: 1, msg: 'gotrocket' },
    rocketbox: { sprite: 'BROK', pickup: 'ammo', ammo: 'rockets', amount: 5, msg: 'gotrocketbox' },
    cell: { sprite: 'CELL', pickup: 'ammo', ammo: 'cells', amount: 20, msg: 'gotcell' },
    cellpack: { sprite: 'CELP', pickup: 'ammo', ammo: 'cells', amount: 100, msg: 'gotcellbox' },
    backpack: { sprite: 'BPAK', pickup: 'backpack', msg: 'gotbackpack', count: true },
    stimpack: { sprite: 'STIM', pickup: 'health', amount: 10, max: 100, msg: 'gotstim' },
    medikit: { sprite: 'MEDI', pickup: 'health', amount: 25, max: 100, msg: 'gotmedikit' },
    hbonus: { sprite: 'BON1', pickup: 'health', amount: 1, max: 200, msg: 'gothealthbonus', anim: 'ABCDCB', count: true },
    abonus: { sprite: 'BON2', pickup: 'armorbonus', msg: 'gotarmorbonus', anim: 'ABCDCB', count: true },
    garmor: { sprite: 'ARM1', pickup: 'armor', armor: 100, cls: 1, msg: 'gotarmor', anim: 'AB', bright: 'B' },
    barmor: { sprite: 'ARM2', pickup: 'armor', armor: 200, cls: 2, msg: 'gotmega', anim: 'AB', bright: 'B' },
    soulsphere: { sprite: 'SOUL', pickup: 'soulsphere', msg: 'gotsuper', anim: 'ABCDCB', bright: 'ABCD', count: true, float: 8 },
    invuln: { sprite: 'PINV', pickup: 'power', power: 'invuln', msg: 'gotinvul', anim: 'ABCD', bright: 'ABCD', count: true },
    berserk: { sprite: 'PSTR', pickup: 'power', power: 'strength', msg: 'gotberserk', bright: 'A', count: true },
    invis: { sprite: 'PINS', pickup: 'power', power: 'invis', msg: 'gotinvis', anim: 'ABCD', bright: 'ABCD', count: true },
    radsuit: { sprite: 'SUIT', pickup: 'power', power: 'ironfeet', msg: 'gotsuit', bright: 'A' },
    allmap: { sprite: 'PMAP', pickup: 'power', power: 'allmap', msg: 'gotmap', anim: 'ABCDCB', bright: 'ABCD', count: true },
    visor: { sprite: 'PVIS', pickup: 'power', power: 'infrared', msg: 'gotvisor', anim: 'AB', bright: 'A', count: true },
    redcard: { sprite: 'RKEY', pickup: 'key', key: 'red', msg: 'gotredcard', anim: 'AB', bright: 'B' },
    bluecard: { sprite: 'BKEY', pickup: 'key', key: 'blue', msg: 'gotbluecard', anim: 'AB', bright: 'B' },
    yellowcard: { sprite: 'YKEY', pickup: 'key', key: 'yellow', msg: 'gotyellowcard', anim: 'AB', bright: 'B' },
    chainsaw: { sprite: 'CSAW', pickup: 'weapon', weapon: 'chainsaw', msg: 'gotchainsaw' },
    shotgun: { sprite: 'SHOT', pickup: 'weapon', weapon: 'shotgun', msg: 'gotshotgun' },
    ssg: { sprite: 'SGN2', pickup: 'weapon', weapon: 'ssg', msg: 'gotshotgun2' },
    chaingun: { sprite: 'MGUN', pickup: 'weapon', weapon: 'chaingun', msg: 'gotchaingun' },
    launcher: { sprite: 'LAUN', pickup: 'weapon', weapon: 'rocket', msg: 'gotlauncher' },
    plasmagun: { sprite: 'PLAS', pickup: 'weapon', weapon: 'plasma', msg: 'gotplasma' },
    bfg: { sprite: 'BFUG', pickup: 'weapon', weapon: 'bfg', msg: 'gotbfg' },

    // ---- decorations
    techlamp: { sprite: 'COLU', radius: 16, height: 48, solid: true, bright: 'A' },
    techcolumn: { sprite: 'ELEC', radius: 16, height: 128, solid: true },
    torchred: { sprite: 'TRED', radius: 16, height: 68, solid: true, anim: 'ABCD', bright: 'ABCD' },
    torchblue: { sprite: 'TBLU', radius: 16, height: 68, solid: true, anim: 'ABCD', bright: 'ABCD' },
    torchgreen: { sprite: 'TGRN', radius: 16, height: 68, solid: true, anim: 'ABCD', bright: 'ABCD' },
    candle: { sprite: 'CAND', radius: 20, height: 16, bright: 'A' },
    candelabra: { sprite: 'CBRA', radius: 16, height: 60, solid: true, bright: 'A' },
    firecan: { sprite: 'FCAN', radius: 16, height: 40, solid: true, anim: 'ABC', bright: 'ABC' },
    deadmarine: { sprite: 'PLAY', frame: 'N', radius: 20, height: 16 },
    deadzombie: { sprite: 'POSS', frame: 'L', radius: 20, height: 16 },
    deadimp: { sprite: 'TROO', frame: 'M', radius: 20, height: 16 },
    gibs: { sprite: 'POL5', radius: 20, height: 16 },
    bloodpool: { sprite: 'POB1', radius: 20, height: 16 },
    skullpole: { sprite: 'POL4', radius: 16, height: 64, solid: true },
    evileye: { sprite: 'CEYE', radius: 16, height: 54, solid: true, anim: 'ABCB', bright: 'ABC' },
    tree: { sprite: 'TRE1', radius: 16, height: 64, solid: true },
    pillar: { sprite: 'COL1', radius: 16, height: 64, solid: true }
  };
  for (const id in THINGS) {
    const t = THINGS[id]; t.id = id;
    if (t.inherit) { const b = THINGS[t.inherit]; t.sounds = t.sounds || b.sounds; t.states = t.states || b.states; }
    if (t.pickup) { t.flags = MF.SPECIAL | (t.count ? MF.COUNTITEM : 0); t.radius = 20; t.height = 16; t.states = { spawn: t.anim ? t.anim.split('').map(f => `${f}6${(t.bright || '').includes(f) ? '*' : ''}`).join(' ') + ' >spawn' : `A-1${(t.bright || '').includes('A') ? '*' : ''}` }; }
    else if (!t.states) {
      t.flags = (t.solid ? MF.SOLID : 0) | (t.hang ? MF.SPAWNCEILING | MF.NOGRAVITY : 0);
      const fr = t.frame || 'A';
      t.states = { spawn: t.anim ? t.anim.split('').map(f => `${f}4${(t.bright || '').includes(f) ? '*' : ''}`).join(' ') + ' >spawn' : `${fr}-1${(t.bright || '').includes(fr) ? '*' : ''}` };
    }
    t.radius = t.radius || 20; t.height = t.height || 16; t.mass = t.mass || 100; t.flags = t.flags || 0;
  }

  // ---------------------------------------------------------------- player weapons
  const AMMO = { bullets: { max: 200, clip: 10 }, shells: { max: 50, clip: 4 }, rockets: { max: 50, clip: 1 }, cells: { max: 300, clip: 20 } };
  const WEAPONS = {
    fist: { slot: 1, ammo: null, sprite: 'PUNG', states: { ready: 'A1:weaponReady >ready', fire: 'B4 C4:punch D5 C4 B5:reFire >ready' } },
    chainsaw: { slot: 1, ammo: null, sprite: 'SAWG', states: { ready: 'C4:weaponReady D4:weaponReady >ready', fire: 'A4:saw B4:saw B0:reFire >ready' } },
    pistol: { slot: 2, ammo: 'bullets', per: 1, sprite: 'PISG', flash: 'PISF', states: { ready: 'A1:weaponReady >ready', fire: 'A4 B6:firePistol C4 B5:reFire >ready', flash: 'A7*:light1 >lightDone' } },
    shotgun: { slot: 3, ammo: 'shells', per: 1, sprite: 'SHTG', flash: 'SHTF', states: { ready: 'A1:weaponReady >ready', fire: 'A3 A7:fireShotgun B5 C5 D4 C5 B5 A3 A7:reFire >ready', flash: 'A4*:light1 B3*:light2 >lightDone' } },
    ssg: { slot: 3, ammo: 'shells', per: 2, sprite: 'SHT2', flash: 'SHT2F', states: { ready: 'A1:weaponReady >ready', fire: 'A3 A7:fireShotgun2 B7 C7:checkReload D7:openShotgun2 E7 F7:loadShotgun2 G6 H6:closeShotgun2 A5:reFire >ready', flash: 'I4*:light1 J3*:light2 >lightDone' } },
    chaingun: { slot: 4, ammo: 'bullets', per: 1, sprite: 'CHGG', flash: 'CHGF', states: { ready: 'A1:weaponReady >ready', fire: 'A4:fireCGun B4:fireCGun B0:reFire >ready', flash: 'A5*:light1 >lightDone', flash2: 'B5*:light2 >lightDone' } },
    rocket: { slot: 5, ammo: 'rockets', per: 1, sprite: 'MISG', flash: 'MISF', states: { ready: 'A1:weaponReady >ready', fire: 'B8:gunFlash B12:fireMissile B0:reFire >ready', flash: 'A3*:light1 B4* C4*:light2 D4*:light2 >lightDone' } },
    plasma: { slot: 6, ammo: 'cells', per: 1, sprite: 'PLSG', flash: 'PLSF', states: { ready: 'A1:weaponReady >ready', fire: 'A3:firePlasma B20:reFire >ready', flash: 'A4*:light1 >lightDone', flash2: 'B4*:light1 >lightDone' } },
    bfg: { slot: 7, ammo: 'cells', per: 40, sprite: 'BFGG', flash: 'BFGF', states: { ready: 'A1:weaponReady >ready', fire: 'A20:bfgSound B10:gunFlash B10:fireBFG B20:reFire >ready', flash: 'A11*:light1 B6*:light2 >lightDone' } }
  };
  const WEAPON_ORDER = ['fist', 'chainsaw', 'pistol', 'shotgun', 'ssg', 'chaingun', 'rocket', 'plasma', 'bfg'];

  // ---------------------------------------------------------------- state parsing
  function parseStates(src) {
    const out = {};
    for (const label in src) {
      const toks = src[label].trim().split(/\s+/), list = [];
      let next = null;
      for (const tk of toks) {
        if (tk[0] === '>') { next = tk.slice(1); continue; }
        const m = /^([A-Z])(-?\d+)(\*)?(?::(\w+))?$/.exec(tk);
        if (!m) throw new Error(`bad state token "${tk}" in ${label}`);
        list.push({ frame: m[1], tics: +m[2], bright: !!m[3], action: m[4] || null });
      }
      list.forEach((s, i) => { s.label = label; s.index = i; s.next = i + 1 < list.length ? { label, index: i + 1 } : null; });
      if (list.length) {
        const last = list[list.length - 1];
        if (next === 'null') last.next = null, last.remove = true;
        else if (next) { const [l, off] = next.split('+'); last.next = { label: l, index: +(off || 0) }; }
        else if (last.tics >= 0) last.remove = false;
      }
      out[label] = list;
    }
    return out;
  }
  for (const id in THINGS) THINGS[id].st = parseStates(THINGS[id].states);
  for (const id in WEAPONS) { WEAPONS[id].id = id; WEAPONS[id].st = parseStates(WEAPONS[id].states); }

  const SKILLS = [
    { id: 0, dmg: 0.5, ammo: 2 }, { id: 1, dmg: 1, ammo: 1 }, { id: 2, dmg: 1, ammo: 1 }, { id: 3, dmg: 1, ammo: 1 }, { id: 4, dmg: 1, ammo: 2, fast: true, respawn: true }
  ];

  // ---------------------------------------------------------------- strings (ru / en)
  const STR = {
    ru: {
      gotarmor: 'Взят бронежилет.', gotmega: 'Взята МЕГАБРОНЯ!', gothealthbonus: 'Взят бонус здоровья.', gotarmorbonus: 'Взят бонус брони.',
      gotstim: 'Взят стимулятор.', gotmedikit: 'Взята аптечка.', gotmedineed: 'Взята аптечка, ОЧЕНЬ нужная!', gotsuper: 'Сверхзаряд!',
      gotbluecard: 'Взята синяя карта-ключ.', gotyellowcard: 'Взята жёлтая карта-ключ.', gotredcard: 'Взята красная карта-ключ.',
      gotinvul: 'Неуязвимость!', gotberserk: 'Берсерк!', gotinvis: 'Частичная невидимость', gotsuit: 'Антирадиационный костюм',
      gotmap: 'Компьютерная карта местности', gotvisor: 'Очки ночного видения',
      gotclip: 'Взята обойма.', gotclipbox: 'Взят ящик патронов.', gotrocket: 'Взята ракета.', gotrocketbox: 'Взят ящик ракет.',
      gotcell: 'Взята энергобатарея.', gotcellbox: 'Взят энергоблок.', gotshells: 'Взято 4 патрона для дробовика.',
      gotshellbox: 'Взята коробка патронов для дробовика.', gotbackpack: 'Взят рюкзак, полный боеприпасов!',
      gotbfg: 'Вы взяли BFG9000! О да.', gotchaingun: 'Взят пулемёт!', gotchainsaw: 'Бензопила! Найдите мясо!',
      gotlauncher: 'Взят ракетомёт!', gotplasma: 'Взята плазменная винтовка!', gotshotgun: 'Взят дробовик!', gotshotgun2: 'Взята двустволка!',
      pd_blueo: 'Нужна синяя карта, чтобы активировать', pd_redo: 'Нужна красная карта, чтобы активировать', pd_yellowo: 'Нужна жёлтая карта, чтобы активировать',
      pd_bluek: 'Нужна синяя карта, чтобы открыть дверь', pd_redk: 'Нужна красная карта, чтобы открыть дверь', pd_yellowk: 'Нужна жёлтая карта, чтобы открыть дверь',
      secret: 'Найден тайник!', dqdon: 'Режим бога ВКЛ', dqdoff: 'Режим бога ВЫКЛ', kfaadded: 'Очень счастливые боеприпасы', faadded: 'Боеприпасы (без ключей)',
      ncon: 'Проход сквозь стены ВКЛ', ncoff: 'Проход сквозь стены ВЫКЛ', behold: 'inVuln, Str, Inviso, Rad, Allmap, или Lite-amp', beholdx: 'Способность включена',
      choppers: '... не отстой. — GM', clev: 'Смена уровня...', paused: 'ПАУЗА', saved: 'Игра сохранена.', loaded: 'Игра загружена.',
      msgson: 'Сообщения ВКЛ', msgsoff: 'Сообщения ВЫКЛ', gamma: 'Гамма-коррекция: уровень', mypos: 'x={x} y={y} угол={a}',
      newgame: 'НОВАЯ ИГРА', options: 'НАСТРОЙКИ', loadgame: 'ЗАГРУЗИТЬ', savegame: 'СОХРАНИТЬ', readthis: 'СПРАВКА', quitgame: 'ВЫХОД',
      choose_skill: 'Выберите сложность:', skill0: 'Я слишком молод, чтобы умирать', skill1: 'Эй, не так грубо', skill2: 'Сделай мне больно', skill3: 'Ультра-насилие', skill4: 'Кошмар!',
      nightmare: 'Вы уверены? Этот уровень сложности\nдаже отдалённо не честен.\n\n(Y/N)',
      quit_msgs: ['Пожалуйста, не уходите — тут ещё\nполно демонов для поджарки!', 'Давайте пройдём ещё уровень…\nда ладно!', 'Я бы на вашем месте не уходил.\nWin 98 куда страшнее.', 'Вы правда хотите бросить\nэту великолепную игру?', 'Не уходите — в углу\nещё лежит BFG!'],
      quit_hint: '(нажмите Y для выхода)', yesno: '(Y/N)', empty_slot: 'пустой слот', save_title: 'Сохранить игру', load_title: 'Загрузить игру',
      mouse_sens: 'Чувств. мыши', sfx_vol: 'Громкость звуков', music_vol: 'Громкость музыки', detail: 'Детализация', detail_hi: 'высокая', detail_lo: 'низкая',
      hud: 'Интерфейс', hud_bar: 'строка состояния', hud_full: 'полный экран', messages: 'Сообщения', on: 'ВКЛ', off: 'ВЫКЛ', autorun: 'Всегда бежать', freelook: 'Обзор мышью',
      back: 'Назад', press_key: 'нажмите любую клавишу', click_mouse: 'щёлкните по экрану, чтобы захватить мышь',
      finished: 'ПРОЙДЕН', entering: 'ДАЛЕЕ', kills: 'Убийства', items: 'Предметы', secrets: 'Тайники', time: 'Время', par: 'Норма', sucks: 'ОТСТОЙ',
      loading: 'ЗАГРУЗКА', map_title: 'Уровень', cant_save: 'Сохранять можно только во время игры!', cant_load_empty: 'Слот пуст.',
      quicksave: 'Быстрое сохранение', quickload: 'Быстрая загрузка',
      dbg_title: 'ОТЛАДКА', dbg_health: 'Здоровье', dbg_armor: 'Броня', dbg_weapons: 'Оружие', dbg_ammo: 'Патроны', dbg_god: 'Бессмертие', dbg_infammo: 'Бесконечные патроны',
      dbg_fast: 'Быстрый бег', dbg_close: 'Закрыть', dbg_all_weapons: 'Всё оружие', dbg_all_ammo: 'Все патроны', dbg_owned: 'есть',
      w_fist: 'Кулаки', w_chainsaw: 'Бензопила', w_pistol: 'Пистолет', w_shotgun: 'Дробовик', w_ssg: 'Двустволка', w_chaingun: 'Пулемёт', w_rocket: 'Ракетомёт', w_plasma: 'Плазмоган', w_bfg: 'BFG9000',
      a_bullets: 'Пули', a_shells: 'Дробь', a_rockets: 'Ракеты', a_cells: 'Энергия',
      help: [
        'УПРАВЛЕНИЕ',
        'W / S, стрелки ↑↓ .......... вперёд / назад', 'A / D ....................... шаг влево / вправо', '← / → или мышь ........... поворот',
        'Ctrl, ЛКМ ................... огонь', 'E, Пробел, ПКМ ........... использовать / открыть', 'Shift ......................... бег',
        '1–7, колесо мыши ....... оружие', 'Tab ........................... карта (F — следовать, +/- масштаб)', 'Esc ........................... меню',
        'F2 / F3 ...................... сохранить / загрузить', 'F6 / F9 ...................... быстрое сохранение / загрузка', 'F8 ............................. отладочное меню', 'F11 ........................... гамма',
        'Pause, P .................... пауза', '', 'Щёлкните по экрану, чтобы захватить мышь.', 'Коды из doom2_cheats.zip тоже работают :)'
      ],
      e1text: 'Уничтожив чудовищ и очистив\nлунную базу, вы победили!\nВы герой, верно?\n\nНо что это? Там, где должна была\nбыть дорога домой, зияет портал.\nЗа ним — пламя, камень и вой\nтысяч глоток.\n\nВы проходите через него.\nНазад пути нет.\n\nПродолжение следует в DOOM 98 II...',
      secret_enter: 'Вы нашли секретный уровень!', skull_msg: 'КОНЕЦ ЭПИЗОДА'
    },
    en: {
      gotarmor: 'Picked up the armor.', gotmega: 'Picked up the MegaArmor!', gothealthbonus: 'Picked up a health bonus.', gotarmorbonus: 'Picked up an armor bonus.',
      gotstim: 'Picked up a stimpack.', gotmedikit: 'Picked up a medikit.', gotmedineed: 'Picked up a medikit that you REALLY need!', gotsuper: 'Supercharge!',
      gotbluecard: 'Picked up a blue keycard.', gotyellowcard: 'Picked up a yellow keycard.', gotredcard: 'Picked up a red keycard.',
      gotinvul: 'Invulnerability!', gotberserk: 'Berserk!', gotinvis: 'Partial Invisibility', gotsuit: 'Radiation Shielding Suit',
      gotmap: 'Computer Area Map', gotvisor: 'Light Amplification Visor',
      gotclip: 'Picked up a clip.', gotclipbox: 'Picked up a box of bullets.', gotrocket: 'Picked up a rocket.', gotrocketbox: 'Picked up a box of rockets.',
      gotcell: 'Picked up an energy cell.', gotcellbox: 'Picked up an energy cell pack.', gotshells: 'Picked up 4 shotgun shells.',
      gotshellbox: 'Picked up a box of shotgun shells.', gotbackpack: 'Picked up a backpack full of ammo!',
      gotbfg: 'You got the BFG9000! Oh, yes.', gotchaingun: 'You got the chaingun!', gotchainsaw: 'A chainsaw! Find some meat!',
      gotlauncher: 'You got the rocket launcher!', gotplasma: 'You got the plasma gun!', gotshotgun: 'You got the shotgun!', gotshotgun2: 'You got the super shotgun!',
      pd_blueo: 'You need a blue key to activate this object', pd_redo: 'You need a red key to activate this object', pd_yellowo: 'You need a yellow key to activate this object',
      pd_bluek: 'You need a blue key to open this door', pd_redk: 'You need a red key to open this door', pd_yellowk: 'You need a yellow key to open this door',
      secret: 'A secret is revealed!', dqdon: 'Degreelessness Mode On', dqdoff: 'Degreelessness Mode Off', kfaadded: 'Very Happy Ammo Added', faadded: 'Ammo (no keys) Added',
      ncon: 'No Clipping Mode ON', ncoff: 'No Clipping Mode OFF', behold: 'inVuln, Str, Inviso, Rad, Allmap, or Lite-amp', beholdx: 'Power-up Toggled',
      choppers: "... doesn't suck - GM", clev: 'Changing Level...', paused: 'PAUSE', saved: 'Game saved.', loaded: 'Game loaded.',
      msgson: 'Messages ON', msgsoff: 'Messages OFF', gamma: 'Gamma correction level', mypos: 'x={x} y={y} ang={a}',
      newgame: 'NEW GAME', options: 'OPTIONS', loadgame: 'LOAD GAME', savegame: 'SAVE GAME', readthis: 'READ THIS!', quitgame: 'QUIT GAME',
      choose_skill: 'Choose Skill Level:', skill0: "I'm too young to die.", skill1: 'Hey, not too rough.', skill2: 'Hurt me plenty.', skill3: 'Ultra-Violence.', skill4: 'Nightmare!',
      nightmare: 'are you sure? this skill level\nisn\'t even remotely fair.\n\n(press y or n)',
      quit_msgs: ["please don't leave, there's more\ndemons to toast!", "let's beat it -- this is turning\ninto a bloodbath!", "i wouldn't leave if i were you.\nWin 98 is much worse.", "you're trying to say you like Win 98\nbetter than me, right?", "don't leave yet -- there's a\ndemon around that corner!"],
      quit_hint: '(press y to quit)', yesno: '(y/n)', empty_slot: 'empty slot', save_title: 'Save game', load_title: 'Load game',
      mouse_sens: 'Mouse sensitivity', sfx_vol: 'Sfx volume', music_vol: 'Music volume', detail: 'Graphic detail', detail_hi: 'high', detail_lo: 'low',
      hud: 'Hud', hud_bar: 'status bar', hud_full: 'fullscreen', messages: 'Messages', on: 'ON', off: 'OFF', autorun: 'Always run', freelook: 'Mouse look',
      back: 'Back', press_key: 'press any key', click_mouse: 'click the view to capture the mouse',
      finished: 'FINISHED', entering: 'ENTERING', kills: 'Kills', items: 'Items', secrets: 'Secrets', time: 'Time', par: 'Par', sucks: 'SUCKS',
      loading: 'LOADING', map_title: 'Level', cant_save: 'You can only save while playing!', cant_load_empty: 'Slot is empty.',
      quicksave: 'Quicksave', quickload: 'Quickload',
      dbg_title: 'DEBUG', dbg_health: 'Health', dbg_armor: 'Armor', dbg_weapons: 'Weapons', dbg_ammo: 'Ammo', dbg_god: 'Immortality', dbg_infammo: 'Infinite ammo',
      dbg_fast: 'Fast run', dbg_close: 'Close', dbg_all_weapons: 'All weapons', dbg_all_ammo: 'All ammo', dbg_owned: 'owned',
      w_fist: 'Fist', w_chainsaw: 'Chainsaw', w_pistol: 'Pistol', w_shotgun: 'Shotgun', w_ssg: 'Super shotgun', w_chaingun: 'Chaingun', w_rocket: 'Rocket launcher', w_plasma: 'Plasma gun', w_bfg: 'BFG9000',
      a_bullets: 'Bullets', a_shells: 'Shells', a_rockets: 'Rockets', a_cells: 'Cells',
      help: [
        'CONTROLS',
        'W / S, arrows ↑↓ .......... forward / back', 'A / D ....................... strafe left / right', '← / → or mouse ........... turn',
        'Ctrl, left mouse .......... fire', 'E, Space, right mouse ... use / open', 'Shift ......................... run',
        '1–7, mouse wheel ........ weapons', 'Tab ........................... automap (F follow, +/- zoom)', 'Esc ........................... menu',
        'F2 / F3 ...................... save / load', 'F6 / F9 ...................... quicksave / quickload', 'F8 ............................. debug menu', 'F11 ........................... gamma',
        'Pause, P .................... pause', '', 'Click the view to capture the mouse.', 'Codes from doom2_cheats.zip work too :)'
      ],
      e1text: 'Once you beat the big badasses and\nclean out the moon base you\'re supposed\nto win, aren\'t you? Aren\'t you?\n\nBut where the way home should be,\na portal yawns open. Beyond it —\nfire, stone and the howl of\na thousand throats.\n\nYou step through.\nThere is no way back.\n\nTo be continued in DOOM 98 II...',
      secret_enter: 'You found a secret level!', skull_msg: 'END OF EPISODE'
    }
  };

  D.DATA = { TICRATE, RAMP, PALETTE, C, MF, THINGS, WEAPONS, WEAPON_ORDER, AMMO, SKILLS, STR, parseStates };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
