(function (AW) {
  'use strict';

  const S = AW.Scripts = {};

  function play(W, id, src) {
    const t = id === 'Game' ? { seq: W.gameSeq } : W.resolve(id);
    if (t && t.seq) t.seq.play(src);
  }

  function amb(W, id, name) {
    const a = W.actor(id);
    if (!a) return;
    a.fixedAmb = name;
    a.idle();
  }

  function onPoint(W, id, areaId, pt) {
    const a = W.actor(id) || (id === 'Hero' ? W.hero : null);
    const ar = W.area(areaId);
    if (!a || !ar) return;
    const p = ar.point(pt);
    if (!p) return;
    const q = W.walk ? W.walk.nearestWalkable(p[0], p[1], 20) || p : p;
    a.x = q[0];
    a.y = q[1];
    if (p[2] !== null && p[2] !== undefined) a.dir = AW.angToDir(p[2]);
    a.stopWalk();
  }

  function show(W, id, v) {
    const t = W.resolve(id);
    if (t) W.setVisible(t, v);
  }

  function setAI(W, id, type, args) {
    const a = W.actor(id);
    if (a) a.ai = AW.AI.create(a, type, args || []);
  }

  S.fns = {
    heroToroll(W, a) { W.hero.toroll = parseInt(a[0], 10) || 0; },
    truckDialog(W) {
      const ar = W.area('aTruck');
      if (ar) ar.dlg = 'citroen';
      W.setFlag('truckDlg', 1);
    },
    setDlg(W, a) {
      const t = W.resolve(a[0]);
      if (t) t.dlg = a[1] || '';
      if (a[0] === 'Johann') W.setFlag('johannDlg', a[1] || '');
    },
    graczeShutup(W) {
      W.setFlag('graczeShut', 1);
      for (const id of ['Gracz1', 'Gracz2', 'Gracz3']) {
        const g = W.actor(id);
        if (g) g.dlg = '';
      }
    },
    setActive(W, a) {
      const t = W.resolve(a[0]);
      if (!t) return;
      const v = parseInt(a[1], 10) ? 1 : 0;
      if (t.kind === 'area') t.active = v;
      else W.setVisible(t, !!v);
    },
    antykSzuka(W) {
      const an = W.actor('Antykwariusz');
      if (!an) return;
      an.seq.reset();
      an.ai = null;
      an.seq.play('WM:0|WT:aDrzwi,-2|W|HIDE:Antykwariusz|W:5|SHOW:Antykwariusz|WT:Hero|W|F:spisDlg');
    },
    spisDlg(W) {
      if (W.dialog || W.tradeWith || W.cutscene) { W.later(0.5, () => S.fns.spisDlg(W)); return; }
      W.openDialog('spis', W.actor('Antykwariusz'));
    },
    kradnij1(W) {
      const j = W.actor('Johann');
      const an = W.actor('Antykwariusz');
      if (!j || !an) return;
      j.aiPaused = 1;
      an.seq.reset();
      an.ai = null;
      an.fixedAmb = '';
      j.seq.play('CAM:Johann|S:_Antyksorki|W|WT:aTalk,1|W|O:Antykwariusz|WT:aTalk,2|W|S:_Antykslucham|W|O:Johann|S:_Antykczy|W|O:Antykwariusz|S:_Antykzaraz|W|O:Johann|CAM:Hero');
    },
    kradnij2(W) {
      const j = W.actor('Johann');
      const an = W.actor('Antykwariusz');
      if (j) j.aiPaused = 0;
      if (an) { an.aiPaused = 0; an.ai = AW.AI.create(an, 'randomwalker', ['aWalkpath']); }
    },
    hurtHero(W, a) {
      const h = W.hero;
      const n = AW.random(parseInt(a[0], 10) || 1);
      h.hp = Math.max(1, h.hp - n);
      W.floatText(h, 'Здоровье: -' + n, '#ff4040');
      W.painSound(h);
    },
    maxHpDown(W, a) {
      const h = W.hero;
      const n = parseInt(a[0], 10) || 1;
      h.hpMax = Math.max(5, h.hpMax - n);
      h.hp = Math.min(h.hp, h.hpMax);
    },
    addToTeam(W, a) { S.addToTeam(W, W.actor(a[0])); },
    clearAmb(W, a) {
      const t = W.actor(a[0]);
      if (t) { t.fixedAmb = ''; t.idle(); }
    },
    followDist(W, a) {
      const t = W.actor(a[0]);
      if (t) t.followDist = parseInt(a[1], 10) || 60;
    },
    arrest(W) {
      show(W, 'General', true);
      show(W, 'Tajniak1', true);
      show(W, 'Tajniak2', true);
      W.camFollow(W.actor('General'));
      play(W, 'General', 'WT:aGeneral,1');
      play(W, 'Tajniak1', 'WT:aGeneral,0');
      play(W, 'Tajniak2', 'WT:aGeneral,2');
      play(W, 'Game', 'W:1|CAM:Hero');
    },
    soundOff(W, a) {
      const s = W.sounds.find(x => x.id === a[0]);
      if (s) { s.active = 0; W.ev('stopLoop', s); }
    },
    setStat(W, a) {
      const t = W.actor(a[0]);
      if (t) t.base[a[1]] = parseInt(a[2], 10) || 0;
    },
    restock(W, a) {
      const t = W.actor(a[0]);
      if (t) t.tradeStock = false;
    },
    studniaSwitch(W) {
      const ar = W.area('aStudnia');
      if (ar) { ar.dlg = 'PLAY:LEV:A09_Katakumby'; ar.icon = 'Door'; }
    },
    heroReset(W) {
      W.hero.stopWalk();
      W.hero.attack = null;
    },
    reset(W, a) {
      const t = W.actor(a[0]);
      if (t) { t.seq.reset(); t.stopWalk(); }
    },
    wartownikGada(W) {
      play(W, 'Wartownik', 'S:_przed3|W:3|S:_przed4|W:3|S:_przed5|W:3|S:_przed6|W:3|R:S|S:_przed7|W:3|S:_przed8|W|S:_przed9|W|W:10|F:wartownikGada');
    },
    grabarzMummy(W) {
      const g = W.actor('Grabarz2');
      if (!g) return;
      g.looks.head = 'mumia';
      g.blindWalk = 'blindwalk';
      g.idle();
    },
    kryptkaOpen(W) {
      const ar = W.area('aKryptka');
      if (ar) { ar.dlg = 'PLAY:LEV:A08_KryptaMala'; ar.desc = 'PLAY:LEV:A08_KryptaMala'; }
      W.setFlag('kryptkaOpen', 1);
    },
    kryptkaCut(W) {
      const g = W.actor('Grabarz2');
      if (!g) return;
      W.control(0);
      g.seq.reset();
      g.ai = null;
      g.seq.play('W|AMB|WM:1|WT:aA08_KryptaMala,-2|W|S:_kryp1|W');
      play(W, 'Hero', 'W:Grabarz2|R:S|W|S:_kryp2|W');
      g.seq.play('W:Hero|S:_kryp3|W|WM:0|CONTROL:1|F:grabarzUndercover');
    },
    grabarzUndercover(W) { setAI(W, 'Grabarz2', 'undercover', []); },
    gadka(W) { S.gadka(W); },
    smiechRazem(W) {
      for (const id of ['Gracz1', 'Gracz2', 'Gracz3']) { const g = W.actor(id); if (g) g.seq.reset(); }
      play(W, 'Gracz1', 'AA:Talk1|S:_gadka11');
      play(W, 'Gracz2', 'AA:Talk1|S:_gadka10');
      play(W, 'Gracz3', 'AA:Talk1|S:_gadka12|W|W:3|F:gadka|W|W:5');
    },
    miuzik(W) { S.miuzik(W); },
    pij(W) { S.pij(W); },
    poPrzyjezdzie(W) { S.poPrzyjezdzie(W); },
    startTown(W) {
      W.control(1);
      W.requestLevel('A01_Rynek');
    },
    backFromTheDead(W) {
      const from = String(W.state.deathFrom || 'A');
      W.backFromTheDead(from[0] === 'A' ? 'A02_CafeRene' : 'A02_CafeRene');
    },
    departAct2(W) {
      W.setFlag('act1done', 1);
      W.ev('actEnd', 1);
    },
    dobij(W, a) {
      const t = W.actor(a[0]) || W.actors.find(x => x.script === 'TajniakZTajemnica' && x.dying);
      if (t) S.finishAgent(W, t);
    },
    chairMove(W, a) {
      const k = a[0] === 'L' ? 'chairL' : 'chairR';
      const d = parseInt(a[1], 10) || 0;
      W.setFlag(k, Math.max(-1, Math.min(1, (W.flag(k) || 0) + d)));
    },
    truckPay(W) {
      if (!W.flag('Forsazaquest') || W.flag('truckPaid')) return;
      W.setFlag('truckPaid', 1);
      W.cash(W.hero, 24);
    },
    giveOnce(W, a) {
      if (W.flag(a[0])) return;
      W.setFlag(a[0], 1);
      W.createItem(W.hero, a[1]);
    },
    guardStop(W, a) { S.guardScene(W, W.actor(a[0]), a[1], a[2]); }
  };

  const LUA = [
    [/^OpenDoor\((\w+),(\w+),(\w+)\)$/, (W, m) => S.openDoorAreas(W, m[1], m[2], m[3])],
    [/^(\w+)\.dlgDesc\s*=\s*(?:""|''|##)$/, (W, m) => S.fns.setDlg(W, [m[1], ''])],
    [/^(\w+)\.dlgDesc\s*=\s*"(\w+)"$/, (W, m) => S.fns.setDlg(W, [m[1], m[2].toLowerCase()])],
    [/^aSkrytka:Switch\(\)$/, W => S.fns.setDlg(W, ['aSkrytka', ''])],
    [/^aStudnia:Switch\(\)$/, W => S.fns.studniaSwitch(W)],
    [/^aKryptka:Cut\(\)$/, W => S.fns.kryptkaCut(W)],
    [/^GUI:Control\((-?\d)\)$/, (W, m) => W.control(parseInt(m[1], 10))],
    [/^GUI:Mode\((\d)\)$/, (W, m) => W.ev('guiMode', parseInt(m[1], 10))],
    [/^SG\.(\w+)\s*=\s*(\d+)$/, (W, m) => W.setFlag(m[1], parseInt(m[2], 10))],
    [/^(\w+)\.active\s*=\s*(\d)$/, (W, m) => S.fns.setActive(W, [m[1], m[2]])],
    [/^(\w+):Hide\(\)$/, (W, m) => show(W, m[1], false)],
    [/^(\w+):Show\(\)$/, (W, m) => show(W, m[1], true)]
  ];

  S.lua = function (W, code) {
    const c = String(code || '').trim();
    for (const [re, fn] of LUA) {
      const m = c.match(re);
      if (m) { fn(W, m); return true; }
    }
    if (W.onUnknownCommand) W.onUnknownCommand('L:' + c);
    return false;
  };

  S.openDoorAreas = function (W, areaId, wmId, gfxId) {
    const ar = W.area(areaId);
    const wm = W.area(wmId);
    const g = W.gfxObj(gfxId);
    if (wm && W.walk) {
      W.walk.fillPoly(wm.poly, 1);
      W.walkMods = W.walkMods || [];
      W.walkMods.push({ area: wm.id, val: 1 });
    }
    if (ar) ar.active = 0;
    if (g) g.visible = false;
    W.setFlag('open_' + areaId, 1);
  };

  S.addToTeam = function (W, a) {
    if (!a || a.dead) return;
    a.team = 1;
    a.enemy = 1;
    a.fixedAmb = '';
    a.seq.reset();
    a.ai = AW.AI.create(a, 'companion', []);
    a.follow = true;
    const cash = a.inv.cash();
    if (cash > 0) { a.inv.changeCash(-cash); W.hero.inv.changeCash(cash); }
    if (!a.cls) a.cls = 'johann';
    W.setFlag('team_' + a.id, 1);
    W.message(a.name + ' присоединяется к вам', 'green');
    a.idle();
  };

  S.guardScene = function (W, g, walkArea, guardArea) {
    const h = W.hero;
    if (!g || !h) return;
    h.seq.reset();
    h.stopWalk();
    h.fixedAmb = '';
    h.idle();
    g.aiPaused = 1;
    W.control(0);
    const id = g.id;
    g.seq.play('CAM:' + id + '|W|SND:enemies/enemy1/Halt2|S:_wart1|W|AMB|WT:' + walkArea + ',-2|W|AMB|S:_wart2|W');
    h.seq.play('W:' + id + '|CAM:Hero|W|WT:' + guardArea + ',-2|W|AMB|S:_wart3|W');
    g.seq.play('W:Hero|CAM:' + id + '|S:_wart4|W|S:_wart5|W|S:_wart6|W|S:_wart7|CONT');
    h.seq.play('W:' + id + '|CAM:Hero|S:_wart8|CONTROL:1|CONT');
  };

  S.gadka = function (W) {
    const g = W.actor('Gracz1');
    if (!g) return;
    let src = 'W:10|W';
    for (let i = 1; i <= 9; i++) src += '|AA:Talk1|S:_gadka' + i + '|W';
    g.seq.play(src + '|F:smiechRazem');
  };

  S.miuzik = function (W) {
    play(W, 'Siedzacy2', 'W:5|AMB:stalk1|S:_siedz1|W|AMB:sambient1');
    play(W, 'Siedzacy3', 'W:Siedzacy2|AMB:stalk1|S:_siedz2|W|AMB:sambient1');
    play(W, 'Siedzacy2', 'W:Siedzacy3|AMB:stalk1|S:_siedz3|W|AMB:sambient1');
    play(W, 'Siedzacy3', 'W:Siedzacy2|AMB:stalk1|S:_siedz4|W|AMB:sambient1');
    play(W, 'Siedzacy2', 'W:Siedzacy3|AMB:stalk1|S:_siedz5|W|AMB:sambient1');
    play(W, 'Siedzacy3', 'W:Siedzacy2|AMB:stalk1|S:_siedz6|W|AMB:sambient1|W:2|F:miuzik');
  };

  S.pij = function (W) {
    play(W, 'Pijak2', 'AMB:sambient1|AA:sdrink,1|W|S:__drinkGulp|AMB:sambient1|W:10|AA:sdrink,1|W|AMB:sambient1|W:4|AA:sdrink,2|W|AMB:sambient1|W:2|F:pij');
  };

  S.wjazd = function (W) {
    const g = W.gfxObj('gCiezarowka');
    W.control(0);
    show(W, 'Hero', false);
    show(W, 'Pierre', false);
    onPoint(W, 'Hero', 'aStart', 0);
    W.camGoto(1000, 440);
    W.camInstant();
    if (W.flag('ciezarowka') || !g) {
      if (g) g.visible = false;
      W.setFlag('ciezarowka', 1);
      S.poPrzyjezdzie(W);
      return;
    }
    g.visible = true;
    g.anim = 0;
    g.t = 0;
    g.frame = 0;
    g.loop = false;
    g.playing = false;
    g.onEnd = () => {
      g.visible = false;
      g.playing = false;
      W.setFlag('ciezarowka', 1);
      W.later(0.4, () => S.poPrzyjezdzie(W));
    };
    W.later(5, () => {
      g.playing = true;
      W.playSound('locations/truck-arrive', 1000, 440, 100);
    });
  };

  S.poPrzyjezdzie = function (W) {
    onPoint(W, 'Hero', 'aStart', 0);
    show(W, 'Hero', true);
    show(W, 'Pierre', true);
    W.control(0);
    play(W, 'Hero', 'WM:0|W:2|WT:aStart,4|W|AA:Ambient_Talk,1|S:_rozm1|W|S:_rozm2');
    play(W, 'Pierre', 'W:Hero|WT:aStart,2|W|S:_rozm3|W|R:SE|W|S:_rozm4|W|R:SW|S:_rozm5|W');
    play(W, 'Hero', 'W:Pierre|AA:Ambient_Talk,1|S:_rozm6|W|R:E|W|AA:Ambient_Talk,1|S:_rozm7|W');
    play(W, 'Pierre', 'W:Hero|S:_rozm8');
    play(W, 'Hero', 'W:Pierre|S:_rozm9|CAM|CONTROL:1|CONT|F:truckNote');
  };

  S.fns.truckNote = function (W) { W.setFlag('arrived', 1); };

  S.finishAgent = function (W, t) {
    t.dying = false;
    t.dlg = '';
    t.fixedAmb = '';
    t.setAnim('death2', { loop: false, hold: true });
    t.anim.t = 999;
    W.dropLoot(t);
  };

  S.zoneSets = {
    A11_Las: () => [
      { area: 'aGEN1_7', commander: ['A_Woffic_Wal'], soldiers: [0, 7, 4, 6], units: [[50, 'A_Wsold_M98k']] },
      { area: 'aGEN2_5', commander: ['A_Woffic_Par'], soldiers: [0, 5, 2, 3], units: [[100, 'A_Wsold_M98k']] },
      { area: 'aGEN3_12', soldiers: [0, 12, 6, 8], units: [[100, 'A_Wsold_M98k']] },
      { area: 'aGEN4_6', commander: ['A_Woffic_Par'], soldiers: [0, 6, 2, 3], units: [[100, 'A_Wsold_M98k']] },
      { area: 'aGEN6_CDIS_8', mines: [0, 8, 5, 7], units: [[100, 'A_mine_CDIS']] },
      { area: 'aGEN8_2', soldiers: [0, 2, 2, 3], units: [[100, 'A_Wsold_M98k_G']] }
    ],
    A12_LasNE: () => {
      const z = [
        { area: 'aGEN1_23', soldiers: [0, 23, 5, 8], units: [[10, 'A_guard_NozMys'], [30, 'A_guard_Par'], [20, 'A_guard_M98k']] },
        { area: 'aGEN2_5', commander: ['A_Woffic_Par', 'A_Woffic_Wal'], soldiers: [0, 5, 3, 4], units: [[100, 'A_Wsold_M98k']] },
        { area: 'aGEN3_3', commander: ['A_UOpart_Par', 'A_UOpart_Wal', 'A_UOpart_StrzeS'], soldiers: [0, 3, 2, 3], units: [[60, 'A_Upart_M98k'], [50, 'A_Upart_Strze'], [20, 'A_Upart_Sztu']] },
        { area: 'aGEN4_7', soldiers: [0, 7, 2, 4], units: [[25, 'A_guard_NozMys'], [20, 'A_guard_Par'], [50, 'A_guard_M98k']] }
      ];
      if (AW.random(100) < 60) z.push({ area: 'aGEN8_CDIS_17', mines: [0, 17, 3, 12], units: [[100, 'A_mine_CDIS']] });
      return z;
    },
    A12_LasNW: () => [
      { area: 'aGEN1_34', soldiers: [0, 34, 4, 8], units: [[30, 'A_guard_NozMys'], [30, 'A_guard_Par'], [20, 'A_guard_M98k']] },
      { area: 'aGEN2_5', commander: ['A_Woffic_Par'], soldiers: [0, 5, 3, 4], units: [[100, 'A_Wsold_M98k']] },
      { area: 'aGEN3_3', soldiers: [0, 3, 3, 4], units: [[70, 'A_guard_NozMys'], [10, 'A_guard_Par'], [15, 'A_guard_M98k']] }
    ],
    A12_LasSE: () => [
      { area: 'aGEN1_23', soldiers: [0, 23, 6, 8], units: [[30, 'A_guard_NozMys'], [30, 'A_guard_Par'], [20, 'A_guard_M98k']] },
      { area: 'aGEN2_16', soldiers: [0, 16, 4, 7], units: [[70, 'A_guard_NozMys'], [10, 'A_guard_Par'], [15, 'A_guard_M98k']] }
    ],
    A12_LasSW: () => [
      { area: 'aGEN1_37', soldiers: [0, 37, 2, 4], units: [[40, 'A_guard_NozMys'], [50, 'A_guard_Par'], [70, 'A_guard_M98k']] },
      { area: 'aGEN2_17', soldiers: [0, 17, 2, 4], units: [[40, 'A_guard_NozMys'], [50, 'A_guard_Par'], [60, 'A_guard_M98k']] },
      { area: 'aGEN3_11', soldiers: [0, 11, 6, 10], units: [[30, 'A_guard_NozMys'], [40, 'A_guard_Par'], [60, 'A_guard_M98k']] }
    ]
  };

  function pubScene(W, lines) {
    W.hero.visible = false;
    for (const m of W.teamMembers()) m.visible = false;
    for (const id of ['Opowiadacz', 'Znajomy', 'Znajomy_lewy', 'Znajomy_lewy2']) amb(W, id, 'sambient1');
    amb(W, 'Stojacy', 'ambient1');
    const z = W.actor('Znajomy');
    if (z) { W.camGoto(z.x, z.y - 60); W.camInstant(); }
    for (const [id, src] of lines) play(W, id, src);
  }

  S.StoryRoom = {
    onLoad(W) {
      W.control(-1);
      W.ev('guiMode', 0);
      W.setFlag('firsttime', 1);
      if (W.flag('story')) { S.fns.startTown(W); return; }
      W.setFlag('story', 1);
      play(W, 'Game', 'POPUP:maja,3|W|POPUP:gdzies,3|W');
      pubScene(W, [
        ['Opowiadacz', 'W:Game|W:1|AA:sdrink,1|W|AA:stalk1,1|S:_intro|W|S:_intro2|W|AA:sdrink,1|W|AMB:sambient1'],
        ['Znajomy_lewy', 'W:Game|W:1|AA:sdrink,1|W|AA:stalk1|W|AMB:sambient1'],
        ['Znajomy', 'AMB:ambient1|W:Opowiadacz|W|AA:talk1,1|S:_intro4|W|S:_intro5|W|S:_intro6|W:1|AA:drink1,1|W|AMB:ambient1'],
        ['Znajomy_lewy', 'W:Znajomy|W|AA:sdrink,1|W|AA:stalk1,1|S:_intro7|W|AMB:sambient1'],
        ['Stojacy', 'W:Znajomy_lewy|W|AA:talk2|S:_intro8|W|S:_intro9|W:1|AA:drink1,1|W|AMB:ambient1'],
        ['Opowiadacz', 'W:Stojacy|W|AA:sdrink,1|W|AA:stalk1,1|S:_intro10|W|AA:sdrink,1|W|AA:stalk1,1|S:_intro11|W|S:_intro12|W|S:_intro13|W|S:_intro14|W|S:_intro15|W']
      ]);
      play(W, 'Game', 'W:Opowiadacz|W|POPUP:kilka,3|W|F:startTown');
    }
  };

  S.A_Death = {
    onLoad(W) {
      W.control(-1);
      W.ev('guiMode', 0);
      const from = String(W.state.deathFrom || 'A');
      const last = from[0] === 'B' ? '_death21' : '_death11';
      pubScene(W, [
        ['Opowiadacz', 'W:1|AA:sdrink,1|W|AA:stalk1,2|S:_death1|W|S:_death2|W|AA:sdrink,1|W|AMB:sambient1'],
        ['Znajomy_lewy', 'W:2|AA:sdrink,1|W|AA:stalk1|W|AMB:sambient1'],
        ['Znajomy', 'AMB:ambient1|W:Opowiadacz|W|AA:talk1,1|S:_death3|W|S:_death4|W|S:_death5|W:3|AA:drink1,1|W|AMB:ambient1'],
        ['Znajomy_lewy', 'W:Znajomy|W|AA:sdrink,1|W|AA:stalk1|S:_death6|W|AMB:sambient1'],
        ['Stojacy', 'W:Znajomy_lewy|W|AA:talk2|S:_death7|W|S:_death8|W:1|AA:drink1,1|W|AMB:ambient1'],
        ['Opowiadacz', 'W:Stojacy|W|AA:sdrink,1|W|AA:stalk1,1|S:_death9|W|AA:sdrink,1|W|AA:stalk1,1|S:_death10|W|S:' + last + '|W|S:_death12|W|S:_death13|W']
      ]);
      play(W, 'Game', 'W:Opowiadacz|W|F:backFromTheDead');
    }
  };

  S.AKT1 = {
    onLoad(W) {
      W.control(-1);
      W.ev('guiMode', 0);
      W.hero.visible = false;
      play(W, 'Game', 'POPUP:act1,12|W|SHOW:Hero|LEV:A03_Lochy');
    }
  };

  S.A01_Rynek = {
    onLoad(W, prev, first, o) {
      for (const id of ['Siedzacy', 'Siedzacy2', 'Siedzacy3']) amb(W, id, 'sambient1');
      const A = id => W.area(id);
      if (W.flag('firsttime') === 1) {
        if (o.restoring) { S.miuzik(W); return; }
        W.control(0);
        if (A('aOkno')) A('aOkno').dlg = 'okno';
        if (A('aAntyk')) A('aAntyk').active = 0;
        if (A('aAntykfirst')) A('aAntykfirst').active = 1;
        onPoint(W, 'Hero', 'aStart', 2);
        onPoint(W, 'Pierre', 'aStart', 1);
        for (const id of ['Gracz1', 'Gracz2', 'Gracz3', 'Alfred']) show(W, id, false);
        setAI(W, 'Tajniak', 'undercover', []);
        S.miuzik(W);
        onPoint(W, 'Wartownikmost', 'aWalkmost', 0);
        setAI(W, 'Wartownikmost', 'guardian', ['aWalkmost', 'aGuardmost']);
        onPoint(W, 'Wartownikzamek', 'aWalkzamek', 0);
        setAI(W, 'Wartownikzamek', 'guardian', ['aWalkzamek', 'aGuardzamek']);
        W.setFlag('malyState', W.flag('malyState') || 0);
        S.wjazd(W);
        return;
      }
      if (A('aOkno')) A('aOkno').dlg = '';
      show(W, 'Alfred', true);
      W.setFlag('ciezarowka', 1);
      if (A('aAntyk')) A('aAntyk').active = 1;
      if (A('aAntykfirst')) A('aAntykfirst').active = 0;
      const g = W.gfxObj('gCiezarowka');
      if (g) { g.visible = false; g.playing = false; }
      for (const id of ['Wartownikmost', 'Wartownikzamek', 'Tajniak']) show(W, id, false);
      for (const id of ['Gracz1', 'Gracz2', 'Gracz3']) show(W, id, true);
      setAI(W, 'Alfred', 'areawalker', ['aTrumniarzwalk']);
      if (!o.restoring) {
        onPoint(W, 'Pierre', 'aStart', 2);
        onPoint(W, 'Gracz1', 'aGracze', 0);
        onPoint(W, 'Gracz2', 'aGracze', 1);
        onPoint(W, 'Gracz3', 'aGracze', 2);
      }
      if (W.flag('graczeShut')) S.fns.graczeShutup(W);
      if (W.flag('truckDlg')) S.fns.truckDialog(W);
      if (W.flag('pierreGone')) show(W, 'Pierre', false);
      S.gadka(W);
      S.miuzik(W);
    },
    guards: {
      Wartownikmost(W, a) { S.guardScene(W, a, 'aWalkmost', 'aGuardmost'); },
      Wartownikzamek(W, a) { S.guardScene(W, a, 'aWalkzamek', 'aGuardzamek'); }
    },
    areas: {
      aAntyk: { def(W) { W.requestLevel('A06_Antyk'); } },
      aCmentarz: { def(W) { W.requestLevel('A04_cmentarz'); } },
      aDozamku: { def(W) { W.requestLevel('A07_Przedzamcze'); } },
      aDrzwi: {
        def(W) {
          W.playSound('locations/cafe/cafe-door-open', W.hero.x, W.hero.y, 100);
          W.requestLevel('A02_CafeRene');
        }
      },
      aMalyczolg: {
        def(W, ar) {
          const st = W.flag('malyState') || 0;
          if (st === 0) {
            W.hero.seq.play('S:_maly');
            W.setFlag('malyState', 1);
            ar.name = 'Sdkfz 263 8-rad';
          } else W.hero.seq.play('S:_maly2');
        }
      }
    }
  };

  S.A02_CafeRene = {
    onLoad(W, prev, first, o) {
      if (!o.restoring) S.fns.restock(W, ['Rene']);
      const rene = W.actor('Rene');
      if (rene) { rene.fixedAmb = ''; rene.idle(); }
      amb(W, 'Bogart', 'sambient1');
      S.pij(W);
      amb(W, 'Pianista', 'pianistaplay');
      setAI(W, 'Kelnerka', 'randomwalker', []);
      for (const id of ['General', 'Tajniak1', 'Tajniak2']) show(W, id, false);
      const st = W.area('aStart');
      if (W.flag('firsttime') === 1) {
        if (st) { st.dlg = ''; st.desc = 'PLAY:S:_wylaz'; }
        show(W, 'Bogart', true);
      } else {
        if (st) { st.dlg = 'PLAY:LEV:A01_Rynek'; st.desc = 'PLAY:LEV:A01_Rynek'; }
        show(W, 'Bogart', false);
      }
    }
  };

  S.A03_Lochy = {
    onLoad(W, prev, first, o) {
      if (first && !o.restoring) W.stashItems(W.hero);
      W.setFlag('firsttime', 303);
      if (first && !o.restoring) onPoint(W, 'Straznik1', 'aGuardguard', 1);
      amb(W, 'Straznik1', '');
      amb(W, 'Friend', 'hang');
      if (!W.inTeam('Johann')) amb(W, 'Johann', 'laid');
      const j = W.actor('Johann');
      if (j && !W.inTeam('Johann')) { j.dlg = W.flag('johannDlg') || ''; j.ai = null; }
    },
    areas: {
      aJdoor: {
        def(W) { S.jdoor(W, false); },
        use(W) { S.jdoor(W, true); }
      }
    },
    onDeath(W, a) {
      if (a.id === 'Friend') W.setFlag('friendDead', 1);
    }
  };

  S.jdoor = function (W, use) {
    const h = W.hero;
    if (W.teamHas('klucz')) {
      h.seq.play('OPEN:Jdoor|SND:locations/door-key-open-reverb|DELETE:klucz');
      S.fns.setDlg(W, ['Johann', 'johann']);
      return;
    }
    const ar = W.area('aJdoor');
    if (use && ar && ar.dlg) { W.useTarget(ar); return; }
    h.seq.play('S:_General_txtDesc');
  };

  S.A04_cmentarz = {
    onLoad(W) {
      W.setFlag('cosState', W.flag('cosState') || 0);
      setAI(W, 'Grabarz', 'randomwalker', []);
      setAI(W, 'Grabarz2', 'undercover', []);
      const k = W.area('aKryptka');
      if (W.flag('kryptkaOpen')) S.fns.kryptkaOpen(W);
      else if (W.hasNote('MAPADREWNO') && W.flag('zabandazowany') !== 500 && k) { k.dlg = 'PLAY:L:aKryptka:Cut()'; k.desc = 'PLAY:L:aKryptka:Cut()'; }
      if (W.flag('zabandazowany') === 500) {
        setAI(W, 'Grabarz2', 'randomwalker', []);
        S.fns.grabarzMummy(W);
      }
      if (W.flag('studniaOpen')) S.fns.studniaSwitch(W);
    },
    areas: {
      aChurch: { def(W) { W.requestLevel('A05_Church'); } },
      aWyjscie: { def(W) { W.requestLevel('A01_Rynek'); } },
      aCos: {
        def(W, ar) {
          const st = W.flag('cosState') || 0;
          const steps = { 0: ['_cos2', 1, '_cos3'], 1: ['_cos4', 3, '_cos5'], 3: ['_cos6', 4, '_cos7'], 4: ['_cos8', 5, '_cos9'], 5: ['_cos10', 5, '_cos1'] };
          const s = steps[st] || steps[5];
          W.hero.seq.play('S:' + s[0]);
          W.setFlag('cosState', s[1]);
          ar.name = AW.TEXT[s[2].slice(1)] || ar.name;
        }
      }
    }
  };

  S.A05_Church = {
    onLoad(W) {
      setAI(W, 'Wiesniak', 'randomwalker', []);
      if (W.flag('krzesloActive')) for (const id of ['aKrzeslo', 'aKrzeslo2']) { const a = W.area(id); if (a) a.active = 1; }
    },
    areas: {
      aStart: { def(W) { W.requestLevel('A04_cmentarz'); } },
      aObrazglowny: {
        left(W) {
          W.setFlag('krzesloActive', 1);
          for (const id of ['aKrzeslo', 'aKrzeslo2']) { const a = W.area(id); if (a) a.active = 1; }
        }
      }
    }
  };

  S.A06_Antyk = {
    onLoad(W) {
      setAI(W, 'Antykwariusz', 'randomwalker', ['aWalkpath']);
      W.playSound('locations/doorbell-getin', W.hero.x, W.hero.y, 100);
    },
    areas: {
      aStart: { def(W) { W.requestLevel('A01_Rynek'); } }
    }
  };

  S.A07_Przedzamcze = {
    onLoad(W, prev) {
      const ar = W.area('aNacmentarz');
      if (ar) {
        if (W.hasNote('RUCHOPORU')) { ar.active = 1; ar.desc = 'PLAY:LEV:A12_LasSE'; }
        else ar.desc = 'PLAY:S:_jeszcze';
      }
      if (prev === 'A03_Lochy') setAI(W, 'Wartownik', 'guardian', ['aWalkg', 'aGuard']);
      else setAI(W, 'Wartownik', 'randomwalker', []);
    },
    guards: {
      Wartownik(W, g) {
        const h = W.hero;
        h.seq.reset();
        h.stopWalk();
        h.idle();
        g.aiPaused = 1;
        W.control(-1);
        g.seq.play('CAM:Wartownik|W|SND:enemies/enemy1/Halt2|S:_przed1|W|WT:aGuard,0|W|O:Hero|WT:aGuard,-2|W|O|S:_przed2|W|CAM:Hero|W|O:Hero|CONTROL:1|DLG:Wartownik|W');
      }
    },
    areas: {
      aWyjscie: { def(W) { W.requestLevel('A01_Rynek'); } }
    }
  };

  S.A08_KryptaMala = {
    onLoad(W) {
      const m = W.area('aMiejsce');
      if (m) {
        if (W.hasNote('BRON') && !W.hasNote('MAPAPIERY') && !W.teamHas('skrzynia') && !W.flag('skrzyniaTaken')) m.dlg = 'PLAY:CREATE:cItem/skrzynia|S:_skrzynia_txtDesc|SET:skrzyniaTaken=1|F:setDlg,aMiejsce';
        else m.dlg = '';
      }
      const g = W.area('aGrobbig');
      if (g && W.hasNote('MAPADREWNO') && W.flag('mamape') !== 500) g.dlg = 'PLAY:CREATE:cItem/mapadrewno|S:_mapka_txtDesc|SET:mamape=500|F:setDlg,aGrobbig';
    }
  };

  S.A09_Katakumby = {
    onLoad(W) {
      const st = W.area('aStart');
      if (st) {
        const to = W.hero.cls === 'thief' ? 'A04_cmentarz' : 'A05_Church';
        st.desc = 'PLAY:LEV:' + to;
        st.dlg = 'PLAY:LEV:' + to;
      }
      if (W.flag('skrytkaOpen')) { const s = W.area('aSkrytka'); if (s) s.active = 1; }
      if (W.flag('skrytkaTaken')) S.fns.setDlg(W, ['aSkrytka', '']);
    },
    onDeath(W, a) {
      if (a.script === 'TajniakZTajemnica') return 'dying';
      return null;
    }
  };

  S.A11_Las = {
    onLoad(W) {
      onPoint(W, 'Partyzant', 'aGadka2', -2);
      show(W, 'Partyzant', !!W.flag('partyzantShown'));
    },
    zones: W => S.zoneSets.A11_Las(W)
  };
  S.A12_LasNE = { zones: W => S.zoneSets.A12_LasNE(W) };
  S.A12_LasNW = { zones: W => S.zoneSets.A12_LasNW(W) };
  S.A12_LasSE = { zones: W => S.zoneSets.A12_LasSE(W) };
  S.A12_LasSW = { zones: W => S.zoneSets.A12_LasSW(W) };

  S.onNote = function (W, id) {
    if (id === 'RUCHOPORU') {
      const ar = W.levelId === 'A07_Przedzamcze' ? W.area('aNacmentarz') : null;
      if (ar) { ar.active = 1; ar.desc = 'PLAY:LEV:A12_LasSE'; }
    }
  };
})(globalThis.AW = globalThis.AW || {});
