const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const pfSetup = odd => "const g = hsrShots.fresh('express_lab', ['trail']); const pfNow = Date.now() + (g.pfPeriod() % 2 === " + odd + " ? 0 : 42 * 86400000); g.clock = () => pfNow; for (const k of ['himeko', 'herta', 'asta', 'natasha', 'serval', 'bailu', 'kafka', 'pela', 'sampo']) g.debugChar(k, 80, 6, 0); g.pf().plan[1] = { team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']] }; hsrui.options.ultCine = 'off'; const until = (test, more) => { for (let i = 0; i < 2600 && !hsrui.bt.result && !test(hsrui.bt); i++) hsrShots.pump(2); hsrShots.pump(more || 0); return hsrShots.shot(); }; ";
const PF_SETUP = pfSetup(0), PF_SETUP2 = pfSetup(1);
const PF_PLAY = "g.events.length = 0; hsrui.toasts = []; g.state.flags.pf_open = true; g.pf().tut = true; g.pf().seen[g.pfSeason().id] = true; const play = (n, a, b) => { g.pfBegin(n); g.pf().run.scores = [a, b]; g.pfFinish(); }; const later = () => { const t0 = g.now(); g.clock = () => t0 + 43 * 86400000; }; ";
const SCENES = {
  title: 'hsrShots.title()',
  hdterm: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); Object.assign(g.state.flags, { lab_found: true, lab_sw: true }); g.loadMap('express_lab', null, { x: 25, y: 5, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  rangeterm: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); Object.assign(g.state.flags, { lab_found: true, lab_sw: true }); g.loadMap('express_lab', null, { x: 10, y: 6, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  rangehub: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'doomsday', lvl: 40 }, { id: 'reaver', lvl: 38 }, { id: 'eliminator', lvl: 38 }]] }; hsrui.openRangeTable(); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangefull: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'ipc_security', lvl: 150, hp: 100, atk: 20, def: 5, spd: 300, tough: 1e6 }, { id: 'dunn', lvl: 150, hp: 100, weak: ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'], resist: [] }, { id: 'trotter', lvl: 150 }, { id: 'ipc_field', lvl: 150, hp: 0.1, atk: 0 }, { id: 'hound', lvl: 1 }]] }; hsrui.openRangeTable(); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangewaves: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'reaver', lvl: 30 }, { id: 'eliminator', lvl: 30 }], [], [{ id: 'phantylia', lvl: 40 }, { id: 'lotus_ab', lvl: 40 }], [{ id: 'phantylia2', lvl: 40 }, { id: 'lotus_de', lvl: 40 }, { id: 'lotus_de', lvl: 40 }]], wave: 2 }; hsrui.openRangeTable(); hsrui.top().focus = 'w2'; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangerow: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'doomsday', lvl: 40, hp: 2, act: 'skill:3', immortal: true, weak: ['wind', 'imag'], resist: ['ice'], hpStart: 50 }, { id: 'ks_proto', lvl: 40, barrier: true }]] }; const s = hsrui.openRangeTable(); s.focus = 'f_act'; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangefight: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'doomsday', lvl: 40 }]], cond: { cycles: 5, seed: 12345, energy: 1, techs: true, ambush: 'player', bg: 'memory' } }; const s = hsrui.openRangeTable(); s.tab = 'fight'; s.focus = 'k_cycles'; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangeteam: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openRangeTable(); hsrui.openRangeTeam(); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangecat: "(() => { hsrShots.fresh('express_lab', ['trail']); const t = hsrui.openRangeTable(); const s = hsrui.openRangeCatalog(0, t); s.sel = s.ids().indexOf('cocolia2'); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangecat_boss: "(() => { hsrShots.fresh('express_lab', ['trail']); const t = hsrui.openRangeTable(); const s = hsrui.openRangeCatalog(0, t); s.setTab(3); s.sel = s.ids().indexOf('ks_proto'); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangesets: "(() => { hsrShots.fresh('express_lab', ['trail']); const t = hsrui.openRangeTable(); const s = hsrui.openRangeCatalog(0, t); s.setTab(4); s.setSel = s.sets().findIndex(x => x.id === 'svarog2'); hsrShots.pump(4); return hsrShots.shot(); })()",
  rangesets2: "(() => { hsrShots.fresh('express_lab', ['trail']); const t = hsrui.openRangeTable(); const s = hsrui.openRangeCatalog(0, t); s.setTab(4); s.setGroup(2); s.setSel = s.sets().findIndex(x => x.id === 'cx_echo_ochema'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfproto: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfbattle: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(110); return hsrShots.shot(); })()",
  pfauto: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(1500); return hsrShots.shot(); })()",
  pfwave2: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pf().run.node = 1; g.pfFight(777); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2600); return hsrShots.shot(); })()",
  pfpause: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 60 && (g.battle.phase !== 'input' || hsrui.bt.queue.length || hsrui.bt.cur); i++) hsrShots.pump(20); hsrui.battleKey('back', 'Escape'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfleave: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 60 && (g.battle.phase !== 'input' || hsrui.bt.queue.length || hsrui.bt.cur); i++) hsrShots.pump(20); hsrui.battleKey('back', 'Escape'); hsrShots.pump(2); hsrui.bt.sub.sel = 3; hsrui.subKey('ok'); hsrShots.pump(2); hsrui.bt.sub.sel = 0; hsrui.subKey('ok'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfback: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; for (let i = 0; i < 90 && !hsrui.bt.result; i++) hsrShots.pump(100); hsrui.battleKey('back', 'Escape'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pflist: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 60 && (g.battle.phase !== 'input' || hsrui.bt.queue.length || hsrui.bt.cur); i++) hsrShots.pump(20); hsrui.battleKey(null, 'KeyZ'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfquit: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 60 && (g.battle.phase !== 'input' || hsrui.bt.queue.length || hsrui.bt.cur); i++) hsrShots.pump(20); hsrui.battleKey('back', 'Escape'); hsrShots.pump(2); hsrui.bt.sub.sel = 3; hsrui.subKey('ok'); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfelite: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => u.appear && u.data.pfRim && !u.dead && !u.gone && u.dHp < u.maxHp), 4); })()",
  pftrot: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => u.appear && u.id === 'pf_trotter' && !u.dead && !u.gone), 4); })()",
  pfkill: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.pf && bt.pf.feathers.length >= 8, 3); })()",
  pfban: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.big && /ВОЛНА 2/.test(bt.big.text), 4); })()",
  pflast: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.msg === 'Последний цикл' && bt.msgT > 0.9, 2); })()",
  pfcaco: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(2); hsrui.handleKey(null, 'KeyC', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfshat: "(() => { " + PF_SETUP + "g.pfSetCaco(1, 0, 0); g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => (u.dShat || 0) >= 2 && !u.dead && !u.gone), 6); })()",
  pfstage: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pf().run.scores = [31240, 28710]; const info = g.pfFinish(); hsrui.openPfStage(info); hsrShots.pump(70); return hsrShots.shot(); })()",
  pffail: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pf().run.scores = [12100, 9880]; const info = g.pfFinish(); hsrui.openPfStage(info); hsrShots.pump(40); return hsrShots.shot(); })()",
  pfagain: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pfBegin(3); g.pf().run.scores = [14800, 12300]; const info = g.pfFinish(); hsrui.openPfStage(info); hsrShots.pump(40); return hsrShots.shot(); })()",
  pfstages: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; hsrui.openPfMap(null, 3); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfresume: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pf().run.scores[0] = 22450; g.pf().run.node = 1; hsrui.openPfResume(() => {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfboss: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; Hsr98.PF.SEASONS[0].stages[3].hp = 0.25; g.pf().plan[4] = { team: g.pf().plan[1].team, caco: [0, 0] }; g.pfBegin(4); g.pfFight(4242); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => u.data.boss && u.hp < u.maxHp * 0.6), 2); })()",
  pfeloq: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; Hsr98.PF.SEASONS[0].stages[3].hp = 0.25; g.pf().plan[4] = { team: g.pf().plan[1].team, caco: [0, 0] }; g.pfBegin(4); g.pfFight(4242); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.big && /РИТОРИКА/.test(bt.big.text), 6); })()",
  pfquit2: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pf().run.scores[0] = 22450; g.pf().run.node = 1; g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; for (let i = 0; i < 90 && !hsrui.bt.result; i++) hsrShots.pump(100); hsrShots.pump(10); hsrui.battleKey('back', 'Escape'); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfteam: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; hsrui.openPfMap(); hsrui.openPfTeam(4); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfteam1: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 61000, nodes: [31000, 30000], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfempty: "(() => { " + PF_SETUP + "g.pf().plan[1].team[1] = []; hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfsquads: "(() => { " + PF_SETUP + "g.state.squads = [[], ['kafka', 'pela', 'serval'], ['himeko', 'herta']]; hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(1); hsrui.top().tab = 'squads'; hsrShots.pump(3); return hsrShots.shot(); })()",
  pfdetail: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfNode(1, 0); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfdetail4: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfNode(4, 1); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfsure: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(1); hsrui.top().clear(); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfmap: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 76043, nodes: [38000, 38043], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pf().free[1] = true; hsrui.openPfMap(); hsrShots.pump(60); return hsrShots.shot(); })()",
  pfsplash: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfSplash(true); hsrShots.pump(30); return hsrShots.shot(); })()",
  pfsplash2: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfSplash(false); hsrui.top().sel = 2; hsrShots.pump(50); return hsrShots.shot(); })()",
  pfrules: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfRules(); hsrShots.pump(3); return hsrShots.shot(); })()",
  pfrules2: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfRules(); hsrui.top().tab = 1; hsrShots.pump(3); return hsrShots.shot(); })()",
  pfrules3: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfRules(); hsrui.top().tab = 2; hsrShots.pump(3); return hsrShots.shot(); })()",
  pftut1: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTutorial(); hsrShots.pump(24); return hsrShots.shot(); })()",
  pftut2: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTutorial(); hsrui.top().page = 1; hsrShots.pump(3); return hsrShots.shot(); })()",
  pftut3: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTutorial(); hsrui.top().page = 2; hsrShots.pump(3); return hsrShots.shot(); })()",
  pftut4: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrui.openPfTutorial(); hsrui.top().page = 3; hsrShots.pump(3); return hsrShots.shot(); })()",
  pficons: "(() => { " + PF_SETUP + "const G = Hsr98.Gfx; hsrui.push({ full: true, draw(c) { c.fillStyle = '#10163a'; c.fillRect(0, 0, 640, 480); G.pfIconList().forEach((id, i) => { G.pfIcon(c, id, 30 + i * 100, 30, 4); G.pfIcon(c, id, 40 + i * 100, 110, 2); G.pfIcon(c, id, 40 + i * 100, 150, 1); }); G.pfShield(c, 's1', 40, 190, 4); G.pfShield(c, 's2', 180, 190, 4); G.pfShield(c, 's1', 320, 190, 2); G.pfShield(c, 's2', 400, 190, 2); G.pfWings(c, 40, 340, 4); G.pfWings(c, 240, 340, 3); G.pfWings(c, 400, 340, 2); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  pfmap0: "(() => { " + PF_SETUP + "hsrui.openPfMap(); hsrShots.pump(60); return hsrShots.shot(); })()",
  pfbreak: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 76043, nodes: [38000, 38043], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pf().free[1] = true; g.pf().free = {}; hsrui.openPfMap(); hsrShots.pump(22); return hsrShots.shot(); })()",
  pfrewards: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 76043, nodes: [38000, 38043], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pf().free[1] = true; hsrui.openPfMap(); hsrui.openPfRewards(); hsrShots.pump(5); return hsrShots.shot(); })()",
  pfrewards2: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 76043, nodes: [38000, 38043], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pf().free[1] = true; hsrui.openPfMap(); hsrui.openPfRewards(); hsrui.top().tab = 1; hsrShots.pump(5); return hsrShots.shot(); })()",
  pfperf: "(() => { " + PF_SETUP + "g.pf().st = { 1: { best: 76043, nodes: [38000, 38043], stars: [true, true, true], clear: true, team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: ['excite', 'rupture'] }, 2: { best: 45000, nodes: [25000, 20000], stars: [true, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] }, 3: { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['erupt', 'erupt'] } }; g.pf().free[1] = true; const c = hsrui.ctx, info = g.pfMapInfo(), tb = performance.now(); Hsr98.PFMap.draw(c, 640, 480, { sel: 1, stages: info }, 0); const bake = performance.now() - tb; hsrui.openPfMap(); hsrShots.pump(5); let t0 = performance.now(); for (let i = 0; i < 200; i++) Hsr98.PFMap.draw(c, 640, 480, { sel: 1, stages: info }, i * 0.033); const scene = (performance.now() - t0) / 200; t0 = performance.now(); for (let i = 0; i < 200; i++) hsrui.render(); const full = (performance.now() - t0) / 200; hsrui.push({ full: true, draw(cx) { cx.fillStyle = '#000'; cx.fillRect(0, 0, 640, 480); hsrui.text('bake ' + bake.toFixed(0) + ' ms, scene ' + scene.toFixed(2) + ' ms, full ' + full.toFixed(2) + ' ms, faces ' + Hsr98.PFMap.cost(), 20, 200, { size: 20, col: '#fff' }); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  pffield: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { lf_s_arrive: true }); g.chatSync(); g.chatAuto('pf_call'); g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.loadMap('lf_sanctum', null, { x: 38, y: 34, silent: true }); g.player.dir = 'up'; hsrui.enterField(); hsrui.banner = null; g.events.length = 0; hsrShots.pump(1); hsrui.toasts = []; hsrui.chatNote = null; hsrui.questNote = null; hsrShots.pump(30); return hsrShots.shot(); })()",
  pfdlgmeet: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { lf_s_arrive: true }); g.chatSync(); g.chatAuto('pf_call'); g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.loadMap('lf_sanctum', null, { x: 38, y: 34, silent: true }); g.player.dir = 'up'; hsrui.enterField(); hsrui.banner = null; g.events.length = 0; hsrShots.pump(1); hsrui.toasts = []; hsrui.chatNote = null; hsrui.questNote = null; g.interact(); hsrShots.pump(90); return hsrShots.shot(); })()",
  pfdlgyin: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { lf_s_arrive: true }); g.chatSync(); g.chatAuto('pf_call'); g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.loadMap('lf_sanctum', null, { x: 38, y: 34, silent: true }); g.player.dir = 'up'; hsrui.enterField(); hsrui.banner = null; g.events.length = 0; hsrShots.pump(1); hsrui.toasts = []; hsrui.chatNote = null; hsrui.questNote = null; g.runScript('pf_yinshu'); hsrShots.pump(90); return hsrShots.shot(); })()",
  pfmenu: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { lf_s_arrive: true }); g.chatSync(); g.chatAuto('pf_call'); g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.loadMap('lf_sanctum', null, { x: 38, y: 34, silent: true }); g.player.dir = 'up'; g.setQuest('pf_decor', 'done'); g.state.flags.pf_open = true; hsrui.enterField(); hsrui.banner = null; g.events.length = 0; hsrShots.pump(1); hsrui.toasts = []; hsrui.chatNote = null; hsrui.questNote = null; g.interact(); hsrShots.pump(4); g.pending = null; g.advanceScript(); hsrShots.pump(8); return hsrShots.shot(); })()",
  pfyinshu: "(() => { " + PF_SETUP + "const G = Hsr98.Gfx, look = Hsr98.SPEAKERS.yinshu.look; hsrui.push({ full: true, draw(c) { c.fillStyle = '#3a3a4a'; c.fillRect(0, 0, 640, 480); G.drawBust(c, look, 20, 20, 3); G.drawBust(c, Hsr98.SPEAKERS.youci.look, 240, 20, 3); G.drawBust(c, Hsr98.SPEAKERS.xiyan.look, 440, 20, 3); G.drawFigure(c, look, 120, 460, 2); G.drawSprite(c, look, 'down', 0, 300, 300); G.drawSprite(c, look, 'left', 0, 350, 300); G.drawPortrait(c, Hsr98.SPEAKERS.youci.look, 420, 300, 48); G.drawPortrait(c, look, 480, 300, 48); G.mapIcon(c, 'pf', 540, 300, 16); G.mapIcon(c, 'pf', 570, 300, 32); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  pfdlgyin2: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { lf_s_arrive: true }); g.chatSync(); g.chatAuto('pf_call'); g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.loadMap('lf_sanctum', null, { x: 38, y: 34, silent: true }); g.player.dir = 'up'; hsrui.enterField(); hsrui.banner = null; g.events.length = 0; hsrShots.pump(1); hsrui.toasts = []; hsrui.chatNote = null; hsrui.questNote = null; g.interact(); for (let i = 0; i < 40 && !(g.pending && g.pending.type === 'say' && g.pending.spk === 'yinshu'); i++) { if (g.pending) g.resume(g.pending.type === 'choice' ? 0 : undefined); else g.advanceScript(); } hsrShots.pump(90); return hsrShots.shot(); })()",
  pfitem: "(() => { " + PF_SETUP + "g.state.inv.items.feather = 20; hsrui.openInventory(3); const s = hsrui.top(); const list = hsrui.invEntries(s.tab); s.sel = Math.max(0, list.findIndex(e => e.id === 'feather')); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfquick: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); play(2, 30500, 30500); play(3, 31000, 31000); later(); g.pfSync(); g.events.length = 0; hsrui.openPfMap(); hsrShots.pump(60); return hsrShots.shot(); })()",
  pfdesk: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); play(2, 30500, 30500); play(3, 31000, 31000); later(); g.pfSync(); g.events.length = 0; hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfpaid: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); play(2, 30500, 30500); [1, 2, 3].forEach(n => g.pfClaimTier(n)); g.pfClaimFiction(1); hsrui.openPfMap(); hsrui.openPfRewards(); hsrShots.pump(6); return hsrShots.shot(); })()",
  pfpaid2: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); play(2, 30500, 30500); [1, 2, 3].forEach(n => g.pfClaimTier(n)); g.pfClaimFiction(1); hsrui.openPfMap(); hsrui.openPfRewards(); hsrui.top().tab = 1; hsrShots.pump(6); return hsrShots.shot(); })()",
  pfdue: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); g.pf().free[1] = true; hsrui.openPfMap(); hsrShots.pump(30); return hsrShots.shot(); })()",
  pfguide: "(() => { " + PF_SETUP + PF_PLAY + "Object.assign(g.state.flags, { fh_met: true, express_intro: true }); play(1, 31000, 31000); play(2, 30500, 30500); play(3, 25000, 20000); [1, 2].forEach(n => g.pfClaimTier(n)); hsrui.openIpg('treasure'); hsrui.top().tsel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  pfguide2: "(() => { " + PF_SETUP + PF_PLAY + "Object.assign(g.state.flags, { fh_met: true, express_intro: true }); hsrui.openIpg('treasure'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pfprofile: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); hsrui.openMenu(); const s = hsrui.openProfile(); s.setTab(0); hsrShots.pump(2); return hsrShots.shot(); })()",
  pflate: "(() => { " + PF_SETUP + PF_PLAY + "g.pfBegin(1); g.pfFight(77); hsrui.drainGameEvents(); hsrShots.pump(1); g.battle.pfTick(1e6); hsrui.pullEvents(); later(); return until(() => false, 8); })()",
  pfnew: "(() => { " + PF_SETUP + PF_PLAY + "play(1, 31000, 31000); const state = JSON.parse(JSON.stringify(g.serialize())), t1 = g.now() + 43 * 86400000; hsrui.game = new Hsr98.Game({ state, clock: () => t1 }); hsrui.enterField(); hsrui.banner = null; hsrShots.pump(3); return hsrShots.shot(); })()",
  pfguide0: "(() => { " + PF_SETUP + "Object.assign(g.state.flags, { fh_met: true, express_intro: true }); hsrui.openIpg('treasure'); hsrui.top().tsel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  pfhelp: "(() => { " + PF_SETUP + PF_PLAY + "Object.assign(g.state.flags, { fh_met: true, express_intro: true }); hsrui.openIpg('treasure'); hsrui.openGuideRules(hsrui.top().tab); hsrShots.pump(4); return hsrShots.shot(); })()",
  pf2splash: "(() => { " + PF_SETUP2 + "hsrui.openPfMap(); hsrui.openPfSplash(true); hsrShots.pump(30); return hsrShots.shot(); })()",
  pf2map: "(() => { " + PF_SETUP2 + "hsrui.openPfMap(); hsrShots.pump(60); return hsrShots.shot(); })()",
  pf2rules: "(() => { " + PF_SETUP2 + "hsrui.openPfMap(); hsrui.openPfRules(); hsrui.top().tab = 1; hsrShots.pump(3); return hsrShots.shot(); })()",
  pf2team: "(() => { " + PF_SETUP2 + "hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(3); return hsrShots.shot(); })()",
  pf2caco: "(() => { " + PF_SETUP2 + "hsrui.openPfMap(); hsrui.openPfTeam(1); hsrShots.pump(2); hsrui.handleKey(null, 'KeyC', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  pf2dot: "(() => { " + PF_SETUP2 + "['kafka', 'sampo', 'guinaifen', 'huohuo'].forEach(k => g.debugChar(k, 80, 6, 0)); g.pf().plan[1] = { team: [['kafka', 'sampo', 'guinaifen', 'huohuo'], ['himeko', 'herta', 'asta', 'natasha']], caco: [0, 0] }; g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.filter(u => !u.dead && !u.gone && u.dDots && u.dDots.length).length >= 3 || (g.battle && g.battle.living.filter(u => u.dots.length).length >= 3), 150); })()",
  pf2rumor: "(() => { " + PF_SETUP2 + "g.pf().plan[1] = { team: [['himeko', 'herta', 'asta', 'natasha'], ['serval', 'bailu', 'kafka', 'pela']], caco: [1, 1] }; g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(() => g.battle && g.battle.living.filter(u => u.dots.length).length >= 3, 150); })()",
  pf2list: "(() => { " + PF_SETUP2 + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 60 && (g.battle.phase !== 'input' || hsrui.bt.queue.length || hsrui.bt.cur); i++) hsrShots.pump(20); hsrui.battleKey(null, 'KeyZ'); hsrShots.pump(4); return hsrShots.shot(); })()",
  pf2boss: "(() => { " + PF_SETUP2 + "const open = { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['slander', 'slander'] }; g.pf().st = { 1: open, 2: open, 3: open }; Hsr98.PF.SEASONS[1].stages[3].hp = 0.25; Hsr98.PF.SEASONS[1].stages[3].atk = 0.5; g.pf().plan[4] = { team: g.pf().plan[1].team, caco: [0, 0] }; g.pfBegin(4); g.pfFight(4242); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => u.data.boss), 40); })()",
  pf2boss2: "(() => { " + PF_SETUP2 + "const open = { best: 31000, nodes: [16000, 15000], stars: [false, false, false], clear: true, team: [[], []], caco: ['slander', 'slander'] }; g.pf().st = { 1: open, 2: open, 3: open }; Hsr98.PF.SEASONS[1].stages[3].hp = 0.25; Hsr98.PF.SEASONS[1].stages[3].atk = 0.5; g.pf().plan[4] = { team: g.pf().plan[1].team, caco: [0, 0] }; g.pfBegin(4); g.pf().run.node = 1; g.pfFight(4242); hsrui.drainGameEvents(); hsrui.bt.auto = true; return until(bt => bt.foes.some(u => u.data.boss), 40); })()",
  pf2guide: "(() => { " + PF_SETUP2 + PF_PLAY + "Object.assign(g.state.flags, { fh_met: true, express_intro: true }); play(1, 31000, 31000); play(2, 30500, 30500); play(3, 25000, 20000); hsrui.openIpg('treasure'); hsrui.top().tsel = 1; hsrShots.pump(120); return hsrShots.shot(); })()",
  pfwalk: "(() => { " + PF_SETUP + "const must = (c, m) => { if (!c) throw new Error('pfwalk: ' + m); }; const press = (k, code) => hsrui.handleKey(k, code || null, {}); const pump = hsrShots.pump; const pressUntil = (test, max = 1500) => { for (let i = 0; i < max && !test(); i++) { pump(1); if (!test()) press('ok', 'Enter'); } return test(); }; const auto = () => { for (let i = 0; i < 9000 && !hsrui.bt.result; i++) { hsrui.bt.auto = true; pump(2); } return !!hsrui.bt.result; }; g.state.party = ['trail', 'himeko', 'herta', 'asta']; g.state.flags.lf_s_arrive = true; g.chatSync(); g.chatAuto('pf_call'); must(g.state.quests.pf_decor === 'talk', 'the letter starts the mission'); g.loadMap('lf_sanctum', 'v'); g.script = null; g.pending = null; g.events.length = 0; hsrui.mode = 'field'; hsrui.screens = []; hsrui.dlg = null; const cage = g.map.ents.find(e => e.ch === 'М'); must(cage, 'the cage stands'); g.placePlayer(cage.x, cage.y + 1); g.player.dir = 'up'; must(g.interact(), 'the cage talks'); must(pressUntil(() => hsrui.top() && hsrui.top().map && hsrui.screens.length === 1), 'the first talk, splash and lesson lead to the map'); must(g.state.quests.pf_decor === 'listen', 'the mission waits'); must(g.pf().tut, 'the lesson is over'); press('ok'); must(hsrui.top().team, 'the map opens the squad'); press(null, 'KeyF'); pump(1); must(g.battle && hsrui.mode === 'battle', 'the story starts'); must(auto(), 'node 1 ends'); const first = hsrui.bt.result.pf.score; press('ok'); pump(1); must(g.battle && g.battle.opts.pf.node === 1, 'node 2 starts'); must(auto(), 'node 2 ends'); const sum = hsrui.bt.result.pf.sum; must(sum === first + hsrui.bt.result.pf.score, 'the sum adds up'); press('ok'); must(hsrui.top().stage, 'the stage result opens'); pump(60); press('back'); must(g.script && g.script.name === 'pf_after', 'the last scene plays'); must(pressUntil(() => g.state.quests.pf_decor === 'done'), 'the mission ends'); must(pressUntil(() => !g.script && !g.pending && !hsrui.dlg), 'the scene ends'); pump(4); const best = g.pf().st[1] ? g.pf().st[1].best : 0; must(best === sum, 'the record is the sum'); hsrui.screens = []; hsrui.openPfMap(); pump(4); hsrui.openPfRewards(); pump(2); const due = g.pfDue(), jade = g.state.jade; press(null, 'KeyC'); must(!due || g.state.jade > jade, 'rewards pay'); must(g.pfDue() === 0, 'nothing is left'); pump(2); press('back'); press('back'); Object.assign(g.state.flags, { fh_met: true, express_intro: true }); hsrui.openIpg('treasure'); pump(2); press('down'); pump(2); must(hsrui.top().tsel === 1, 'the guide has the row'); press('ok'); must(hsrui.top().map, 'the guide opens the map by the cage'); pump(2); press('back'); const later = g.now() + 43 * 86400000; g.clock = () => later; hsrui.openPfEntry(() => {}); must(hsrui.top().splash, 'the next season opens with its splash'); must(g.pf().hist.length === 1, 'the old season is written'); must(g.pfSeason().id === 's2', 'the next season is the second'); pump(10); press('back'); must(hsrui.top().map, 'the map follows'); pump(30); press('ok'); must(hsrui.top().team, 'and the squad'); pump(2); press(null, 'KeyF'); pump(1); must(g.battle && g.battle.opts.pf.season === 's2', 'the second season fights'); must(auto(), 'its node ends'); must(hsrui.bt.result.pf.score > 0, 'and pays'); pump(4); return hsrShots.shot(); })()",
  pfnode: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = true; for (let i = 0; i < 90 && !hsrui.bt.result; i++) hsrShots.pump(100); hsrShots.pump(20); return hsrShots.shot(); })()",
  rangebattle: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'cocolia2', lvl: 40 }, { id: 'iceedge', lvl: 38 }]] }; hsrui.rangeLaunch(); hsrShots.pump(120); return hsrShots.shot(); })()",
  rangepause: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'reaver', lvl: 10 }]] }; hsrui.rangeLaunch(); hsrShots.pump(120); hsrui.bt.sub = { type: 'pause', sel: 1 }; hsrShots.pump(2); return hsrShots.shot(); })()",
  rangereport: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'cocolia2', lvl: 45 }, { id: 'iceedge', lvl: 43 }]], cond: { cine: 'off', auto: true, seed: 77 } }; hsrui.rangeLaunch(); hsrui.bt.auto = true; hsrShots.pump(6000); return hsrShots.shot(); })()",
  rangelose: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'cocolia_x', lvl: 150 }, { id: 'doomsday', lvl: 150 }]], cond: { cine: 'off', auto: true, seed: 5 } }; hsrui.rangeLaunch(); hsrui.bt.auto = true; hsrShots.pump(4000); return hsrShots.shot(); })()",
  rangelimit: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'reaver', lvl: 80, hp: 100, act: 'idle', immortal: true }]], cond: { cine: 'off', auto: true, cycles: 5, seed: 5 } }; const R0 = g.range(); hsrui.rangeLaunch(); hsrui.bt.auto = true; hsrShots.pump(3000); hsrui.battleKey('ok', 'Enter'); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(3000); return hsrShots.shot(); })()",
  rangehack: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.state.range = { waves: [[{ id: 'doomsday', lvl: 40 }]], hack: { immortal: true, intent: true } }; const s = hsrui.openRangeTable(); s.tab = 'hack'; s.focus = 'h_sp'; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangepanel: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'cocolia2', lvl: 45 }, { id: 'iceedge', lvl: 43 }]], cond: { seed: 5, cine: 'off' } }; hsrui.rangeLaunch(); hsrShots.pump(120); hsrui.battleKey(null, 'Tab'); hsrShots.pump(4); hsrui.bt.sub.sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  rangeintent: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'doomsday', lvl: 45 }, { id: 'reaver', lvl: 40 }]], hack: { immortal: true, intent: true }, cond: { seed: 5, cine: 'off' } }; hsrui.rangeLaunch(); hsrShots.pump(120); return hsrShots.shot(); })()",
  rangebatch: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'cocolia2', lvl: 40 }, { id: 'iceedge', lvl: 38 }]], cond: { seed: 100 } }; const t = hsrui.openRangeTable(); hsrui.openRangeBatch(100); hsrShots.pump(120); return hsrShots.shot(); })()",
  rangemarks: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'cocolia2', lvl: 40 }, { id: 'iceedge', lvl: 38 }]] }; g.range(); g.rangeMarkSave(0); g.rangeRows()[0].id = 'mimic'; g.rangeMarkSave(2); const t = hsrui.openRangeTable(); const s = hsrui.openRangeLog(t); s.tab = 'marks'; s.msel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangeown: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of Object.keys(g.state.roster)) if (k !== 'trail') delete g.state.roster[k]; g.state.range = { own: ['trail', 'trial:himeko', 'trial:seele'], team: { own: true }, waves: [[{ id: 'reaver', lvl: 40 }]] }; g.range(); hsrui.openRangeTable(); hsrui.openRangeTeam(); const s = hsrui.openRangeOwn(); s.trial = true; hsrShots.pump(4); return hsrShots.shot(); })()",
  rangehud: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'doomsday', lvl: 45 }]], cond: { cine: 'off', cycles: 5, seed: 5 } }; hsrui.rangeLaunch(); hsrShots.pump(120); return hsrShots.shot(); })()",
  rangelog: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'reaver', lvl: 10 }]], cond: { cine: 'off' } }; for (let i = 0; i < 4; i++) { const b = g.rangeFight(i + 1); b.start(); for (let k = 0; k < 800 && !b.over; k++) { b.autoStep(); b.drain(); } g.endBattle(); g.rangeRows()[0].lvl += 10; } g.events.length = 0; const t = hsrui.openRangeTable(); hsrui.openRangeLog(t); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdhub: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); hsrui.top().hero = 1; hsrShots.pump(10); return hsrShots.shot(); })()",
  hdroll: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.hdNew({ seed: 5 }); hsrui.openHdHub(); hsrui.openHdDraft(); hsrui.top().age = 0.62; hsrShots.pump(1); return hsrShots.shot(); })()",
  hdcards: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.hdNew({ seed: 5 }); g.hdRefresh(2); hsrui.openHdHub(); hsrui.openHdDraft(); const s = hsrui.top(); s.age = 2; s.sel = 1; hsrShots.pump(1); return hsrShots.shot(); })()",
  hdcard: "(() => { const s = hsrShots.hd('jingyuan', 12); const A = s.arena, h = A.hero; h.x = h.px = 46 * 32; h.y = h.py = 24.5 * 32; s.card = { tab: 1, top: 0 }; hsrShots.pump(20); return hsrShots.shot(); })()",
  hdtrace: "(() => { const s = hsrShots.hd('topaz', 10); const A = s.arena, h = A.hero; h.x = h.px = 29.5 * 32; h.y = h.py = 23 * 32; hsrShots.pump(20); return hsrShots.shot(); })()",
  hdarena: "(() => { const s = hsrShots.hd('trail', 6); const A = s.arena, h = A.hero; h.x = h.px = 29.5 * 32; h.y = h.py = 23 * 32; hsrShots.pump(40); return hsrShots.shot(); })()",
  hdwave: "(() => { const s = hsrShots.hd('trail', 5); const A = s.arena, h = A.hero; h.x = h.px = 29.5 * 32; h.y = h.py = 12 * 32; A.wave = 5; A.cmd({ t: 'early' }); hsrShots.pump(+(window.HDP || 235)); A.cmd({ t: 'cast', slot: 'q' }); hsrShots.pump(5); return hsrShots.shot(); })()",
  hdboss_doomsday: "(() => { const s = hsrShots.hd('trail', 12); const A = s.arena, h = A.hero; A.wave = 10; A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; h.x = h.px = 29.5 * 32; h.y = h.py = 23.5 * 32; const b = A.spawnFoe('doomsday', 'n'); b.x = b.px = 30 * 32; b.y = b.py = 21.5 * 32; b.patI = 3; b.gapT = 0; for (const id of ['reaver', 'eliminator', 'reaver']) { const u = A.spawnFoe(id, 'n'); u.y = u.py = 18 * 32; } hsrShots.pump(+(window.HDP || 40)); return hsrShots.shot(); })()",
  hdshop: "hsrShots.hdShop(0, 9)",
  hdshop_cone: "hsrShots.hdShop(1, 2)",
  hdshop_dev: "hsrShots.hdShop(2, 1)",
  hdshop_sup: "hsrShots.hdShop(3, 0)",
  hdgear: "(() => { const s = hsrShots.hdGear(); const A = s.arena, h = A.hero; A.cmd({ t: 'early' }); hsrShots.pump(12); h.x = h.px = 29.5 * 32; h.y = h.py = 14 * 32; const gi = h.items.findIndex(it => it && it.id === 'grenade'); A.cmd({ t: 'use', i: gi, x: h.x + 60, y: h.y - 80 }); A.cmd({ t: 'use', i: h.items.findIndex(it => it && it.id === 'garrison') }); hsrShots.pump(+(window.HDP || 200)); return hsrShots.shot(); })()",
  hdboss_bronya_b: "hsrShots.hdBoss('bronya_b', ['silvermane', 'legion'], { move: 'ult', escort: ['soldier', 'gunner'], post: 30 })",
  hdboss_gepard_b: "hsrShots.hdBoss('gepard_b', ['legion', 'silvermane'], { wave: 20, big: true, phase2: true, move: 'ult', post: 25 })",
  hdboss_grizzly: "hsrShots.hdBoss('grizzly', ['automaton', 'legion'], { move: 'ult', escort: ['beetle', 'spider'], post: 30 })",
  hdboss_svarog_b: "hsrShots.hdBoss('svarog_b', ['legion', 'automaton'], { wave: 20, big: true, phase2: true, move: 'ult', post: 80 })",
  hdboss_cocolia_echo: "hsrShots.hdBoss('cocolia_echo', ['winter', 'legion'], { move: 'blade', escort: ['vagrant', 'frostspawn'], post: 12 })",
  hdboss_cocolia2: "hsrShots.hdBoss('cocolia1', ['legion', 'winter'], { wave: 20, big: true, phase2: true, pre: 75, move: 'ult', post: 30 })",
  hdboss_doomsday_big: "hsrShots.hdBoss('doomsday', ['silvermane', 'legion'], { wave: 20, big: true, phase2: true, pre: 40, post: 20 })",
  hdthreat_silvermane: "hsrShots.hdThreat('silvermane')",
  hdthreat_automaton: "hsrShots.hdThreat('automaton')",
  hdthreat_winter: "hsrShots.hdThreat('winter')",
  hddiff: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); const s = hsrui.top(); s.pick = 'start'; s.sel = 2; hsrShots.pump(20); return hsrShots.shot(); })()",
  hdlose: "(() => { const s = hsrShots.hd('kafka', 15, ['automaton', 'winter']); const A = s.arena; A.wave = 14; Object.assign(A.stats, { kills: 160, dmg: 120400, heal: 2100, gold: 14100, spent: 12900, raid: 820, time: 640, tfell: 2, bossMin: 71 }); A.hero.deaths = 2; A.base.hp = 0; A.over = 'lose'; hsrShots.pump(30); return hsrShots.shot(); })()",
  hdrecs: "(() => { hsrShots.hdMeta(); hsrui.openHdRecords(); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdasc: "(() => { hsrShots.hdMeta(); hsrui.openHdAsc(); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdweek: "(() => { hsrShots.hdMeta(); hsrui.openHdWeek(); hsrui.top().sel = 6; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdtrials: "(() => { hsrShots.hdMeta(); hsrui.openHdTrials(); hsrui.top().sel = 23; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdhist: "(() => { hsrShots.hdMeta(); hsrui.openHdHistory(); hsrui.top().sel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdhubmeta: "(() => { hsrShots.hdMeta(); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdalarm: "(() => { const s = hsrShots.hd('seele', 8); const A = s.arena, h = A.hero; h.x = h.px = 46 * 32; h.y = h.py = 10 * 32; A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; const u = A.spawnFoe('reaver', 'n'); u.x = u.px = 30 * 32; u.y = u.py = 30.5 * 32; hsrShots.pump(40); A.hit(u, A.base, { amt: 30, noCrit: true }); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdturret: "(() => { const s = hsrShots.hd('trail', 8); const A = s.arena, h = A.hero, t = A.turrets[1]; A.hit(null, t, { amt: 1e9, type: 'divine', noCrit: true }); h.x = h.px = t.x + 40; h.y = h.py = t.y + 30; h.gold = 900; hsrShots.pump(70); return hsrShots.shot(); })()",
  hdrecords: "(() => { hsrShots.hdMeta(); hsrui.openHdRecords(); hsrShots.pump(4); return hsrShots.shot(); })()",
  hddossier: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); hsrui.openHdDossier(); const s = hsrui.top(); s.p = 2; s.sel = 2; s.card.tab = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  hddossier2: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); hsrui.openHdDossier(); const s = hsrui.top(); s.p = 5; s.sel = 1; s.card.tab = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdrules: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); hsrui.openHdRules(); hsrui.top().sel = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdrules2: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openHdHub(); hsrui.openHdRules(); hsrui.top().sel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  hdbreak: "(() => { const s = hsrShots.hd('march', 9, ['winter', 'legion']); const A = s.arena, h = A.hero; A.wave = 6; A.breakT = 18; A.turrets[2].hp = 0; A.turrets[2].dead = true; h.x = h.px = 32 * 32; h.y = h.py = 24 * 32; hsrShots.pump(60); return hsrShots.shot(); })()",
  hddead: "(() => { const s = hsrShots.hd('blade', 12); const A = s.arena, h = A.hero; A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; h.gold = 700; h.x = h.px = 29.5 * 32; h.y = h.py = 18 * 32; for (const id of ['reaver', 'trampler', 'distorter']) { const u = A.spawnFoe(id, 'n'); u.y = u.py = 16 * 32; } A.hit(A.units.find(u => u.key === 'trampler'), h, { amt: 1e9, type: 'divine', noCrit: true }); hsrShots.pump(40); return hsrShots.shot(); })()",
  hdwarn: "(() => { const s = hsrShots.hd('herta', 11, ['winter', 'legion']); const A = s.arena, h = A.hero; A.phase = 'wave'; A.wave = 8; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; h.x = h.px = 29.5 * 32; h.y = h.py = 22 * 32; const p = A.spawnFoe('prowler', 'n'); p.x = p.px = h.x + 40; p.y = p.py = h.y - 40; const io = A.spawnFoe('iceout', 'n'); io.x = io.px = h.x - 60; io.y = io.py = h.y - 150; for (const id of ['shadewalker', 'flamespawn', 'frostspawn']) { const u = A.spawnFoe(id, 'n'); u.y = u.py = h.y - 120; } hsrShots.pump(5); p.skCd = 0; p.skI = 0; Hsr98.HD.foeSkill(A, p, h); io.skCd = 0; Hsr98.HD.foeSkill(A, io, h); A.cmd({ t: 'cast', slot: 'q', x: h.x, y: h.y - 100 }); hsrShots.pump(12); return hsrShots.shot(); })()",
  hddebug: "(() => { const s = hsrShots.hdGear(); s.dbgFlow = true; hsrShots.pump(4); hsrui.openDebug(); const tabs = hsrui.top(); tabs.setTab(5); hsrShots.pump(4); return hsrShots.shot(); })()",
  hdflow: "(() => { const s = hsrShots.hd('trail', 6); const A = s.arena, h = A.hero; A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }]; h.x = h.px = 29.5 * 32; h.y = h.py = 15 * 32; for (const id of ['reaver', 'eliminator', 'baryon', 'reaver']) { const u = A.spawnFoe(id, 'n'); } s.dbgFlow = true; hsrShots.pump(50); return hsrShots.shot(); })()",
  hdpause: "(() => { const s = hsrShots.hd('seele', 4); hsrShots.pump(10); hsrui.openHdPause(s); hsrShots.pump(2); return hsrShots.shot(); })()",
  hdwin: "(() => { const s = hsrShots.hdGear(); const A = s.arena; Object.assign(A.stats, { kills: 414, dmg: 486400, heal: 9300, gold: 29120, spent: 27950, raid: 1640, time: 1490, bossMin: 58 }); A.hero.lvl = 20; A.hero.picks[10] = 1; A.hero.picks[20] = 0; A.base.hp = 2140; A.hero.deaths = 1; A.over = 'win'; hsrShots.pump(40); return hsrShots.shot(); })()",
  express: "hsrShots.field('express')",
  labwolf: "(() => { const g = hsrShots.fresh('express_party', ['trail']); g.loadMap('express_party', 'q', { silent: true }); g.player.dir = 'left'; g.interact({ shift: true }); g.resume(); g.resume(); for (let i = 0; i < 400 && g.pending && g.pending.type === 'walk'; i++) g.update(0.05); hsrui.drainGameEvents(); hsrShots.pump(40); return hsrShots.shot(); })()",
  labterm: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); Object.assign(g.state.flags, { lab_found: true, lab_sw: true }); g.loadMap('express_lab', null, { x: 27, y: 5, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  labwarp: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(100); g.addChar('theherta', 40); g.labState().pair.theherta = 1; g.state.roster.theherta.eid = 2; g.addCone('undeniable'); hsrui.openLabWarp(); hsrShots.pump(10); return hsrShots.shot(); })()",
  labwarp2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(10); g.setStarOf('lab', 'tribbie'); hsrui.openLabWarp(); hsrShots.pump(10); return hsrShots.shot(); })()",
  labwarpnone: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openLabWarp(); hsrShots.pump(4); hsrui.top().sel = 3; hsrui.top().act(3); hsrShots.pump(2); return hsrShots.shot(); })()",
  labwarpfull: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(100); for (let i = 0; i < 16; i++) g.labGrant(10); for (let i = 0; i < 14; i++) g.labWarp(10); hsrui.openLabWarp(); hsrShots.pump(4); return hsrShots.shot(); })()",
  labhist: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(100); g.labWarp(10); g.labWarp(10); hsrui.openWarpHistory('lab'); hsrShots.pump(4); return hsrShots.shot(); })()",
  labrack: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(100); hsrui.openLabWarp(); const s = hsrui.top(); s.pull(10); s.show.toRack(); s.show.rt = 2; s.show.fade = 0; hsrShots.pump(1); return hsrShots.shot(); })()",
  labitem: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.labGrant(100); g.labWarp(10); hsrui.openWarpHistory('lab'); hsrui.screens.length = 0; hsrui.openInventory && hsrui.openInventory(); hsrShots.pump(4); return hsrShots.shot(); })()",
  labbattle1: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.addChar('theherta', 40); g.addChar('himeko', 40); g.state.party = ['theherta', 'himeko', 'trail']; const b = g.startBattle({ enemies: ['reaver:20', 'trampler:20', 'eliminator:20'], lvl: 20, bg: 'station', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(50); const h = b.allies[0]; h.flags.thInsp = 2; h.flags.thAnswer = 31; b.current = h; b.phase = 'input'; b.sp = 3; hsrui.bt.pick = 'skill'; hsrShots.pump(4); return hsrShots.shot(); })()",
  labskills: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.addChar('theherta', 40); hsrui.openChars('theherta'); hsrui.top().sec = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  labtraces: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.addChar('theherta', 80); hsrui.openChars('theherta'); hsrui.top().sec = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  labbattle2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.addChar('tribbie', 40); g.addChar('jingliu', 40); g.state.party = ['tribbie', 'jingliu', 'trail']; const b = g.startBattle({ enemies: ['reaver:20', 'trampler:20', 'eliminator:20'], lvl: 20, bg: 'station', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(50); const h = b.allies[0]; b.trNumOn(h, 0.24); b.trZoneOpen(h, { vuln: 0.3, add: 0.12 }); hsrui.drainGameEvents(); hsrShots.pump(6); return hsrShots.shot(); })()",
  labskills2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.addChar('tribbie', 40); hsrui.openChars('tribbie'); hsrui.top().sec = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  labeid: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.debugChar('theherta', 80, 6); hsrui.openChars('theherta'); hsrui.top().sec = 4; hsrShots.pump(4); return hsrShots.shot(); })()",
  labinfo: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.debugChar('theherta', 80, 6); hsrui.openChars('theherta'); const s = hsrui.top(); s.sec = 5; s.infoPage = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  labinfo2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); g.debugChar('tribbie', 80, 6); hsrui.openChars('tribbie'); const s = hsrui.top(); s.sec = 5; s.infoPage = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  labcar: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); Object.assign(g.state.flags, { lab_found: true, lab_sw: true }); g.loadMap('express_lab', null, { x: 17, y: 7, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  cwhub: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); hsrShots.pump(30); return hsrShots.shot(); })()",
  cwhubrun: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwHub(); hsrShots.pump(30); return hsrShots.shot(); })()",
  cwboard: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'shop', i: 1 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwboardunit: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'on', i: 1 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbonds: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().bondInfo = { k: null }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwdrag: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); const s = hsrui.top(); s.press('bench', 0, 0, { x: 138, y: 332 }); hsrui.drag.move({ x: 300, y: 400 }); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreceipt: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().receipt = { t: 0, r: { kind: 'fight', win: false, progress: 0.64, node: 3, base: 5, streak: 0, interest: 2, coins: 0, total: 7, exp: 2, hpLoss: 7, near: 1 } }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreceiptwin: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().receipt = { t: 0, r: { kind: 'fight', win: true, progress: 1, node: 5, base: 5, streak: 1, interest: 2, coins: 0, total: 8, exp: 2, hpLoss: 0, near: 0 } }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwsupply: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 4; r.phase = 'supply'; r.offer = g.cwOffer(r); hsrui.openCwSupply(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreport: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.dmg = { qingque: 52000, tingyun: 9000 }; r.node = 9; r.wins = 4; r.losses = 1; r.spent = 46; r.earned = 58; const sum = g.cwClose(r, true); hsrui.openCwReport(sum); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbattle: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 3; g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 90)); return hsrShots.shot(); })()",
  cwboss: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 8; g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 90)); return hsrShots.shot(); })()",
  cwresult: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 50; e.hp = e.maxHp; } hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrui.options.battleSpeed = 3; for (let i = 0; i < 4000 && !hsrui.bt.result; i++) hsrShots.pump(1); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwmode: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); hsrui.openCwMode(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrank: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); hsrui.openCwRankPick('standard'); const s = hsrui.top(); s.tier = 4; s.sub = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrivals: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); g.cwNew({ mode: 'standard', tier: 2, sub: 1 }).envPick = null; hsrui.openCwBoard(); hsrui.openCwRivals(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwenc: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.node = 6; g.cwGo(); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwencfinal: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 4); r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.lastIndexOf('enc'); g.cwGo(); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwplane3: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 7); r.plane = 2; g.cwEnterPlane(r); r.node = 1; r.harvest = 1; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreward: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 1; r.harvest = 1; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreceiptore: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g); hsrui.openCwBoard(); hsrui.top().receipt = { t: 0, r: { kind: 'reward', win: true, progress: 1, node: 7, base: 0, streak: 0, interest: 0, coins: 7, total: 14, exp: 0, hpLoss: 0, near: 0, ores: [{ ore: 'ore1', gold: 3 }, { ore: 'ore1', gold: 0, hero: 'pela' }, { ore: 'ore2', gold: 4 }] } }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreceiptenc: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetup(g, 2); hsrui.openCwBoard(); hsrui.top().receipt = { t: 0, r: { kind: 'enc', win: true, progress: 1, node: 6, base: 5, streak: 2, interest: 2, coins: 3, total: 12, exp: 2, hpLoss: 0, near: 0, ores: [], branch: 2, hero: 'gepard', strat: false, frenzy: false } }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwlost: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 800; e.hp = e.maxHp; } hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrui.options.battleSpeed = 3; for (let i = 0; i < 4000 && !hsrui.bt.result; i++) hsrShots.pump(1); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreplay: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 800; e.hp = e.maxHp; } b.start(); b.runAuto(3000); g.endBattle(); g.events.length = 0; g.cwReplay(); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwaura: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.opps = ['everwinter', 'ironshield', 'deepsky']; r.plane = 1; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); const b = g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); for (const e of b.enemies) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(+(window.CWP || 60)); return hsrShots.shot(); })()",
  cwstars: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 6); r.plane = 2; g.cwEnterPlane(r); r.node = 3; const b = g.cwFight(); b.cw.stars = b.cw.stars.map(w => w.map((s, i) => 1 + (i % 3))); for (const e of b.enemies) e.cwDone = false; hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(40); return hsrShots.shot(); })()",
  cwcard3: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.openCwCard({ id: 'jingliu', star: 2 }); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbattlekits3: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; const put = (z, id, star) => { r.board[z][r.board[z].indexOf(null)] = { uid: ++r.uid, id, star }; }; put('on', 'seele', 2); put('on', 'darkness', 2); put('on', 'ratio', 2); put('on', 'makoto', 2); put('off', 'jingliu', 2); put('off', 'blade', 2); put('off', 'bailu', 2); put('off', 'himeko', 2); put('off', 'rise', 2); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 6; e.hp = e.maxHp; } hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 90)); return hsrShots.shot(); })()",
  cwcard: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.openCwCard(r.board.on[0]); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwcardoff: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.openCwCard({ id: 'sampo', star: 3 }); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwcardlater: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.openCwCard({ id: 'jingliu', star: 1 }); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbattlekits: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; const put = (z, id, star) => { r.board[z][r.board[z].indexOf(null)] = { uid: ++r.uid, id, star }; }; put('on', 'herta', 2); put('on', 'qingque', 2); put('on', 'danheng', 2); put('on', 'sushang', 2); put('off', 'march', 2); put('off', 'tingyun', 2); put('off', 'pela', 2); put('off', 'yukong', 2); put('off', 'guinaifen', 2); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 6; e.hp = e.maxHp; } hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 80)); return hsrShots.shot(); })()",
  cwbattlekits45: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'bronya', 2); put('on', 'welt', 2); put('on', 'clara', 2); put('on', 'gepard', 2); put('off', 'topaz', 2); put('off', 'talleah', 2); put('off', 'yanqing', 2); put('off', 'megumin', 2); put('off', 'fuxuan', 2); r.node = 3; const b = g.cwFight(); for (const e of b.enemies) { e.maxHp *= 6; e.hp = e.maxHp; } hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 80)); return hsrShots.shot(); })()",
  cwp1: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'herta', 1); put('bench', 'silverwolf', 1); put('bench', 'silverwolf', 1); g.cwGive(r, 'silverwolf'); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwgm: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'herta', 2); put('on', 'silverwolf', 3, true); g.cwSpecial(r).p1 = 'promote'; hsrui.openCwBoard(); hsrui.top().cur = { zone: 'on', i: 1 }; hsrShots.pump(2); hsrui.openCwGm(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwwild: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'yu', 3); put('on', 'herta', 2); g.cwSetWild('heal'); hsrui.openCwBoard(); hsrShots.pump(2); hsrui.openCwWild(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwinvest: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'herta', 2); put('off', 'topaz', 2); g.cwInvest(5); hsrui.openCwBoard(); hsrShots.pump(2); hsrui.openCwInvest(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwpeppy: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('on', 'arlan', 3); put('on', 'herta', 2); put('off', 'topaz', 2); put('bench', 'yu', 1); g.cwInvest(10); g.cwInvAdd(r, 'em_heal'); g.cwInvAdd(r, 'em_dot'); g.cwPeppyGive(g.cwInv(r).findIndex(x => x.id === 'em_heal')); g.cwPeppyGive(g.cwInv(r).findIndex(x => x.id === 'em_dot')); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'peppy', i: 0 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwcardspecial: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; put('off', 'topaz', 2); g.cwInvest(5); hsrui.openCwBoard(); hsrShots.pump(2); hsrui.openCwCard(r.board.off[0]); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwmentor: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = g.cwNew({ tier: 2 }); r.envPick = null; for (const z of ['on', 'off', 'bench']) r.board[z].fill(null); r.lvl = 9; r.gold = 40; const put = (z, id, star, lv) => { const u = { uid: ++r.uid, id, star }; if (lv) u.lv = true; r.board[z][r.board[z].indexOf(null)] = u; return u; }; r.strats = ['moonFlash']; put('on', 'jingyuan', 2); put('off', 'jingliu', 2); put('off', 'yanqing', 2); hsrui.openCwBoard(); hsrui.top().bondInfo = { k: 'mentor' }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstratp: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.gold = 40; const take = id => { r.stratPick = { q: Hsr98.CW.STRATS[id].q, opts: [id], rolls: [0] }; g.cwTakeStrat(0); }; r.stratPick = { q: 'p', opts: ['rateUp', 'set_xianzhou', 'arrows'], rolls: [1, 1, 0] }; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstratg: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.gold = 40; const take = id => { r.stratPick = { q: Hsr98.CW.STRATS[id].q, opts: [id], rolls: [0] }; g.cwTakeStrat(0); }; r.stratPick = { q: 'g', opts: ['refuel', 'market', 'hyper'], rolls: [0, 0, 0] }; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstrats: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.gold = 40; const take = id => { r.stratPick = { q: Hsr98.CW.STRATS[id].q, opts: [id], rolls: [0] }; g.cwTakeStrat(0); }; r.stratPick = { q: 's', opts: ['easy', 'jobs', 'quartz'], rolls: [3, 3, 3] }; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstratlist: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.gold = 40; const take = id => { r.stratPick = { q: Hsr98.CW.STRATS[id].q, opts: [id], rolls: [0] }; g.cwTakeStrat(0); }; take('market'); take('jobs'); take('midnight'); take('prismFut'); hsrui.openCwBoard(); hsrShots.pump(2); hsrui.openCwStratList(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstratboard: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.gold = 40; const take = id => { r.stratPick = { q: Hsr98.CW.STRATS[id].q, opts: [id], rolls: [0] }; g.cwTakeStrat(0); }; take('market'); take('jobs'); take('midnight'); r.lvl = 7; for (let n = 0; n < 40 && !r.shopStar.includes(2); n++) g.cwRollShop(r); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwenv: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 6); r.envPick = { opts: ['heroExit', 'unique_xianzhou', 'tricolor'] }; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwconditions: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 8); r.gold = 40; r.envs = ['evolution']; r.affixOff = [r.affixes[1]]; r.stratPick = { q: 'g', opts: ['refuel'], rolls: [0] }; g.cwTakeStrat(0); hsrui.openCwBoard(); hsrShots.pump(2); hsrui.openCwStratList(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwstrattri: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 8); r.gold = 40; r.envs = ['tricolor']; g.cwStratQueue(r, 'g', 0, r.step); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwheroexit: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 8); r.gold = 40; r.envPick = { opts: ['heroExit'] }; g.cwTakeEnv(0); r.envPick = null; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrivals7: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); const r = g.cwNew({ mode: 'standard', tier: 2, sub: 1 }); r.envPick = null; r.opps = ['doomsday', 'axel', 'deathless']; r.plane = 2; hsrui.openCwBoard(); hsrui.openCwRivals(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwnewfoes: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.push({ full: true, draw(c) { c.fillStyle = '#101428'; c.fillRect(0, 0, 640, 480); ['cocolia_x', 'svarog_hand', 'phantylia_x', 'timekiller', 'trotter_big'].forEach((id, i) => { Hsr98.Gfx.drawEnemy(c, Hsr98.ENEMIES[id], 70 + i * 125, 300, 120, { t: 0 }); Hsr98.Gfx.foeIcon(c, Hsr98.ENEMIES[id], 46 + i * 125, 340, 48); c.fillStyle = '#ffffff'; c.font = '11px sans-serif'; c.fillText(Hsr98.ENEMIES[id].name.slice(0, 22), 14 + i * 125, 410); }); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  cwfinale: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.affixes = []; r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrui.options.battleSpeed = 1; const b = g.battle; for (const e of b.enemies) { e.maxHp *= 30; e.hp = e.maxHp; } hsrShots.pump(30); b.cwInfo.left = 100.5; for (let i = 0; i < 400 && !b.cwInfo.finale; i++) hsrShots.pump(1); hsrShots.pump(+(window.CWP || 30)); return hsrShots.shot(); })()",
  cwhub8: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrShots.pump(30); return hsrShots.shot(); })()",
  cwhub8b: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrShots.pump(30); return hsrShots.shot(); })()",
  cwhub8c: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; const Gs = g.cwGoals(); Gs.cnt = { buyExp: 6, deploy2: 1, trackHero: 2, interest: 12, winStd: 1, winQuick: 1, keyP: 4 }; Gs.done = ['0:0', '0:1', '0:2', '1:0', '2:0', '3:6']; Gs.got = ['0:0', '0:1']; Gs.profit = ['lvl10', 'earn400', 'cheap', 'xzsp', 'm_xianzhou', 'dnaTop']; Gs.pgot = ['lvl10']; hsrui.openCwHub(); hsrShots.pump(30); return hsrShots.shot(); })()",
  cwartsheet: "(() => { hsrShots.fresh('express_lab', ['trail']); const CW = Hsr98.CW, G = Hsr98.Gfx; const ids = Object.keys(CW.ITEMS).filter(k => CW.ITEMS[k].kind !== 'emblem'); hsrui.push({ full: true, draw(c) { c.fillStyle = '#0a0e2e'; c.fillRect(0, 0, 640, 480); ids.forEach((id, i) => hsrui.cwItemIcon(c, { id, sp: i === 12 }, 8 + (i % 16) * 39, 8 + Math.floor(i / 16) * 39, 32)); Object.keys(CW.BONDS).concat(['keeper', 'player1', 'numby', 'wildcard', 'peppy']).forEach((k, i) => { c.fillStyle = '#141a3a'; c.fillRect(8 + (i % 16) * 39, 214 + Math.floor(i / 16) * 39, 32, 32); G.cwBondIcon(c, k, 8 + (i % 16) * 39, 214 + Math.floor(i / 16) * 39, 32); }); ['express', 'xianzhou', 'kazuma', 'heal', 'break', 'sp'].forEach((b, i) => hsrui.cwItemIcon(c, { id: 'em_' + b }, 8 + i * 39, 340, 32)); ['reward', 'fight', 'enc', 'supply', 'boss'].forEach((k, i) => G.cwNodeIcon(c, k, 260 + i * 30, 344, 24, '#ffd471')); for (let t = 0; t < 9; t++) G.cwRankIcon(c, t, 8 + t * 60, 392, 48); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  cwdebughub: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.debugState = null; hsrui.openCwHub(); hsrui.openDebug(); hsrui.top().setTab(5); hsrShots.pump(4); return hsrShots.shot(); })()",
  hddebughub: "(() => { hsrShots.fresh('express_lab', ['trail']); hsrui.debugState = null; hsrui.openHdHub(); hsrui.openDebug(); hsrui.top().setTab(5); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwdebug: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.strats = [{ id: 'rateUp', q: 'p' }]; r.envs = ['evolution']; hsrui.openCwBoard(); hsrui.openDebug(); hsrui.top().setTab(5); hsrui.debugState.row = 4; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwartsheet2: "(() => { hsrShots.fresh('express_lab', ['trail']); const CW = Hsr98.CW, G = Hsr98.Gfx; const ids = Object.keys(CW.ITEMS).filter(k => CW.ITEMS[k].kind !== 'emblem'); hsrui.push({ full: true, draw(c) { c.fillStyle = '#0a0e2e'; c.fillRect(0, 0, 640, 480); ids.forEach((id, i) => hsrui.cwItemIcon(c, { id, sp: i === 12 }, 8 + (i % 26) * 24, 8 + Math.floor(i / 26) * 24, 20)); Object.keys(CW.BONDS).concat(['keeper', 'player1', 'numby', 'wildcard', 'peppy']).forEach((k, i) => { c.fillStyle = '#141a3a'; c.fillRect(8 + (i % 16) * 39, 214 + Math.floor(i / 16) * 39, 32, 32); G.cwBondIcon(c, k, 8 + (i % 16) * 39, 214 + Math.floor(i / 16) * 39, 32); }); ['express', 'xianzhou', 'kazuma', 'heal', 'break', 'sp'].forEach((b, i) => hsrui.cwItemIcon(c, { id: 'em_' + b }, 8 + i * 39, 340, 32)); ['reward', 'fight', 'enc', 'supply', 'boss'].forEach((k, i) => G.cwNodeIcon(c, k, 260 + i * 30, 344, 24, '#ffd471')); for (let t = 0; t < 9; t++) G.cwRankIcon(c, t, 8 + t * 60, 392, 48); } }); hsrShots.pump(2); return hsrShots.shot(); })()",
  cwguide: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; const Gs = g.cwGoals(); Gs.cnt = { buyExp: 6, deploy2: 1, trackHero: 2, interest: 12, winStd: 1, winQuick: 1, keyP: 4 }; Gs.done = ['0:0', '0:1', '0:2', '1:0', '2:0', '3:6']; Gs.got = ['0:0', '0:1']; Gs.profit = ['lvl10', 'earn400', 'cheap', 'xzsp', 'm_xianzhou', 'dnaTop']; Gs.pgot = ['lvl10']; hsrui.openCwHub(); hsrui.openCwGuide(); hsrui.top().sel = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwprofit: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; const Gs = g.cwGoals(); Gs.cnt = { buyExp: 6, deploy2: 1, trackHero: 2, interest: 12, winStd: 1, winQuick: 1, keyP: 4 }; Gs.done = ['0:0', '0:1', '0:2', '1:0', '2:0', '3:6']; Gs.got = ['0:0', '0:1']; Gs.profit = ['lvl10', 'earn400', 'cheap', 'xzsp', 'm_xianzhou', 'dnaTop']; Gs.pgot = ['lvl10']; hsrui.openCwHub(); hsrui.openCwProfit(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwlineups: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; const Gs = g.cwGoals(); Gs.cnt = { buyExp: 6, deploy2: 1, trackHero: 2, interest: 12, winStd: 1, winQuick: 1, keyP: 4 }; Gs.done = ['0:0', '0:1', '0:2', '1:0', '2:0', '3:6']; Gs.got = ['0:0', '0:1']; Gs.profit = ['lvl10', 'earn400', 'cheap', 'xzsp', 'm_xianzhou', 'dnaTop']; Gs.pgot = ['lvl10']; Gs.applied = 'lucky'; hsrui.openCwHub(); hsrui.openCwLineups(); hsrui.top().sel = 5; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwboardguide: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); g.cwGoals().applied = 'lucky'; g.cwTrack('bonds', 'kazuma'); g.cwTrack('heroes', 'kazuma'); r.shop = ['aqua', 'darkness', 'herta', 'sampo', 'pela']; hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwperks: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrui.openCwPerks(); hsrui.top().sel = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwperks2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrui.openCwPerks(); hsrui.top().tab = 's'; hsrui.top().sel = 4; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbank: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrui.openCwBank(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbankheroes: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrui.openCwBank(); hsrui.top().tab = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwlinks: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; const P = g.cwPerks(); P.notes = 640; P.perks.on = ['prep', 'goldBless', 'baseArms', 'extraSupply', 'stratRoll', 'longFight', 'powP0', 'powP1', 'powP2', 'powP3', 'powP4', 'powP5', 'powP6', 'thanks', 'recovery']; P.links.done = ['xianzhou:0', 'xianzhou:1', 'express:0', 'kazuma:0', 'aoe:0']; P.links.got = ['xianzhou:0']; const S = g.cw().seen; S.strats = {}; Object.keys(Hsr98.CW.STRATS).slice(0, 34).forEach((id, i) => S.strats[id] = i % 3 ? 1 : 2); S.envs = { arena: 2, evolution: 2, tricolor: 1 }; S.opps = { everwinter: 1, axel: 1, swarm: 1 }; S.kits = {}; Hsr98.CW.POOL.slice(0, 40).forEach(id => S.kits[id] = 1); P.bank.got = ['strats0']; hsrui.openCwHub(); hsrui.openCwLinks(); hsrui.top().sel = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwasc: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwAsc(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwweek: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwWeek(); hsrui.top().sel = 4; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrankrew: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwRankRewards(); hsrui.top().sel = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwhistory: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwHistory(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrank8: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; C.rank.best = Hsr98.CW.rankIndex(5, 7); hsrui.openCwHub(); hsrui.openCwMode(); hsrui.openCwRankPick('standard'); hsrui.top().top(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwmode8: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwMode(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreport8: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const C = g.cwMeta(); C.asc.pts = 9300; C.asc.got = [1, 2, 3, 4, 5, 6, 7, 8]; C.rank.best = 14; C.rankGot = [0, 1]; C.week.pts = 9600; C.week.got = [0, 1, 2]; C.week.dbl = 1400; C.notes = 230; C.plate = 'Последний победитель'; C.hist = [{ at: 1761300000000, mode: 'standard', rank: 'A3-2', cleared: true, hp: 74, hpMax: 100, node: 23, nodes: 23, wins: 15, losses: 2, spent: 160, earned: 210, lvl: 9, team: [{ id: 'kazuma', star: 3 }, { id: 'aqua', star: 2 }, { id: 'megumin', star: 2 }, { id: 'chie', star: 2 }, { id: 'herta', star: 3 }, { id: 'asta', star: 2 }], best: { id: 'kazuma', dmg: 81000 }, dmg: [{ id: 'kazuma', v: 81000 }, { id: 'megumin', v: 64000 }], bonds: [{ k: 'kazuma', tier: 2 }, { k: 'elation', tier: 1 }, { k: 'inaba', tier: 0 }], strats: [{ id: 'rateUp', q: 'p' }], envs: ['evolution'], rankGain: 3, meta: { asc: 1300, ascBonus: 1300, week: 18000, notes: 40, rankFrom: 11, rankTo: 14, promo: false } }, { at: 1761200000000, mode: 'quick', rank: 'A3-1', cleared: false, hp: 0, hpMax: 100, node: 11, nodes: 16, team: [], bonds: [{ k: 'xianzhou', tier: 1 }] }]; hsrui.openCwHub(); hsrui.openCwReport(Object.assign({}, C.hist[0])); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwwin: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.affixes = []; r.node = 2; g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrui.options.battleSpeed = 3; for (let i = 0; i < 4000 && !hsrui.bt.result; i++) hsrShots.pump(1); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwreport2: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.dmg = { kazuma: 81000, megumin: 64000, chie: 42000, herta: 30500, asta: 12000, aqua: 9000 }; r.node = 9; r.wins = 14; r.losses = 2; r.spent = 146; r.earned = 188; r.hp = 76; r.strats = [{ id: 'rateUp', q: 'p' }, { id: 'refuel', q: 'g' }, { id: 'easy', q: 's' }]; r.envs = ['evolution']; const sum = g.cwClose(r, true); hsrui.openCwReport(sum); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwspeed: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); hsrui.options.battleSpeed = 1; hsrui.openCwBoard(); hsrShots.pump(2); hsrui.top().go(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwrivals7b: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrui.openCwHub(); const r = g.cwNew({ mode: 'standard', tier: 2, sub: 1 }); r.envPick = null; r.opps = ['swarm', 'everwinter', 'deepsky']; r.plane = 2; hsrui.openCwBoard(); hsrui.openCwRivals(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbossdoom: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['doomsday', 'doomsday', 'doomsday']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbossswarm: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['swarm', 'swarm', 'swarm']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbossdeath: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['deathless', 'deathless', 'deathless']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbossaxel: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['axel', 'axel', 'axel']; r.plane = 0; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 0; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbosscore: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['axel', 'axel', 'axel']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbosscocolia: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['everwinter', 'everwinter', 'everwinter']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwbosshand: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g, 2); r.affixes = []; r.opps = ['deepsky', 'deepsky', 'deepsky']; r.plane = 2; g.cwEnterPlane(r); r.node = r.nodes.indexOf('boss'); g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(2); const b = g.battle; b.cwInfo.left = 9999; for (let n = 0; n < 6 && b.wave < 2; n++) { for (const e of b.living.slice()) { e.hp = 0; e.dead = true; } b.cleanup(); hsrShots.pump(90); } hsrShots.pump(120); for (const e of b.living) { e.maxHp *= 8; e.hp = e.maxHp; } const s = b.living.find(e => e.id === 'svarog_b'); s.hp = Math.round(s.maxHp * 0.55); b.hit(b.allies[0], s, 0, { raw: Math.round(s.maxHp * 0.1) }); hsrShots.pump(+(window.CWP || 40)); return hsrShots.shot(); })()",
  cwinv: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'inv', i: 2 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwinvunit: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'on', i: 3 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwinvdrag: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); hsrui.openCwBoard(); const s = hsrui.top(); s.press('inv', 0, 0, { x: 502, y: 164 }); hsrui.drag.move({ x: 280, y: 90 }); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwchoice: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); g.cwOpenBox(g.cwInv(r).findIndex(x => x.id === 'boxAdv')); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwchoicehero: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); g.cwOpenBox(g.cwInv(r).findIndex(x => x.id === 'contract4')); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwsupplyitem: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupItems(g); r.node = 4; r.phase = 'prep'; g.cwGo(); hsrui.openCwBoard(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbondpanel: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); hsrui.openCwBoard(); hsrui.top().cur = { zone: 'on', i: 0 }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbondinfo: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.bond.dna = 30; r.bond.dnaAt = 2; hsrui.openCwBoard(); hsrui.top().bondInfo = { k: 'scholars' }; hsrShots.pump(4); return hsrShots.shot(); })()",
  cworders: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.board.off[5] = { uid: 901, id: 'nicole', star: 1 }; r.board.on[3] = { uid: 902, id: 'billy', star: 1 }; r.board.off[6] = { uid: 903, id: 'anby', star: 1 }; g.cwBeginNode(r); hsrui.openCwBoard(); hsrui.openCwOrders(); hsrShots.pump(4); return hsrShots.shot(); })()",
  cwbattlebonds: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetupMix(g); r.node = 3; g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(+(window.CWP || 70)); return hsrShots.shot(); })()",
  cwreceiptbond: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); hsrShots.cwSetupMix(g); hsrui.openCwBoard(); hsrui.top().receipt = { t: 0, r: { kind: 'fight', win: true, progress: 1, node: 3, base: 5, streak: 1, interest: 2, coins: 3, bondGold: 3, total: 11, exp: 2, hpLoss: 0, near: 0, ores: [], dna: 9, geo: 4, order: { id: 'breaks', done: true }, bondLines: ['ДНК 24'], bondHeroes: ['Аста', 'Хук'] } }; hsrShots.pump(4); return hsrShots.shot(); })()",
  lfseat: "hsrShots.lfSay('lf_haven', 'lf_h_seat', 2)",
  lfyukong: "hsrShots.lfSay('lf_astrum', 'lf_a_yukong2', 0)",
  lfpanel: "hsrShots.lfScene('panel')",
  lfhall: "hsrShots.lfScene('hall')",
  lfbridge: "hsrShots.lfScene('bridge')",
  lfchasm: "hsrShots.lfScene('chasm')",
  lfshifterfield: "hsrShots.lfScene('shifter')",
  lfmara: "hsrShots.lfFoeBattle('lf_mara1')",
  lfshifter: "hsrShots.lfFoeBattle('lf_shifter')",
  lfpatrol: "hsrShots.lfFoeBattle('lf_patrol')",
  lfkafka: "hsrShots.lfFoeBattle('lf_kafka')",
  lfnavdock: "hsrShots.navScene('clues', 44, 7, 'left')",
  lfnavclues: "hsrShots.navScene('clues', 36, 8, 'left')",
  lfnavhunt: "hsrShots.navScene('track', 27, 19, 'left', {}, {}, true)",
  lfnavbelt: "hsrShots.navScene('gate', 18, 34, 'down', { lf_patrol_win: true, lf_t_ambush: true, lf_t_door2: true }, { p: 7 })",
  lfnavbridge: "hsrShots.navScene('gate', 21, 36, 'right', { lf_patrol_win: true, lf_t_ambush: true, lf_t_door2: true }, { p: 0, q: 0 })",
  lfnavgate: "hsrShots.navScene('gate', 17, 30, 'right', { lf_patrol_win: true, lf_t_ambush: true, lf_t_door2: true })",
  lfnavinc: "hsrShots.navScene('chase2', 30, 29, 'up', { lf_patrol_win: true, lf_t_other: true }, { p: 0, q: 0 })",
  lfnavinc2: "hsrShots.navScene('chase2', 34, 28, 'up', { lf_patrol_win: true, lf_t_other: true }, { p: 0, q: 0 })",
  lfnavroute: "hsrShots.navScene('route', 41, 31, 'down', { lf_patrol_win: true, lf_t_other: true, lf_t_under: true }, { p: 0, q: 0 }, true)",
  lfnavpier: "hsrShots.navScene('route', 41, 34, 'down', { lf_patrol_win: true, lf_t_other: true, lf_t_under: true }, { p: 0, q: 0, r: 2 })",
  lfnavfx: "hsrShots.navScene('sanctum', 43, 38, 'right', { lf_patrol_win: true, lf_kafka_win: true, lf_kafka_done: true }, { p: 0, q: 0, r: 2 })",
  lfdominated: "hsrShots.lfDominated()",
  lfsanjetty: "hsrShots.sanScene({ lf_q5: 'sanctum' }, 16, 36, 'up', {})",
  lfsancourt: "hsrShots.sanScene({ lf_q5: 'sanctum' }, 25, 34, 'up', { lf_s_arrive: true, lf_fx_gone: true })",
  lfsanplaza: "hsrShots.sanScene({ lf_q5: 'talk' }, 22, 25, 'down', { lf_s_arrive: true, lf_fx_gone: true, lf_s_plaza: true, lf_bailu_win: true })",
  lfsanwest: "hsrShots.sanScene({ lf_q5: 'talk' }, 13, 22, 'up', { lf_s_arrive: true, lf_fx_gone: true, lf_s_plaza: true, lf_bailu_win: true })",
  lfsaneast: "hsrShots.sanScene({ lf_q5: 'talk' }, 31, 21, 'down', { lf_s_arrive: true, lf_fx_gone: true, lf_s_plaza: true, lf_bailu_win: true })",
  lfsanjade: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'photo' }, 15, 9, 'left', { lf_s_arrive: true, lf_fx_gone: true, lf_s_plaza: true, lf_bailu_win: true, lf_q6_msg: true })",
  lfsanarbor: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'photo' }, 24, 10, 'up', { lf_s_arrive: true, lf_fx_gone: true, lf_bailu_win: true })",
  lfsanstump: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'go' }, 31, 9, 'up', { lf_s_arrive: true, lf_fx_gone: true, lf_bailu_win: true, lf_qingque: true, lf_arbor_seen: true })",
  lfsandock: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'done' }, 37, 6, 'up', { lf_s_arrive: true, lf_q6_dock: true, lf_qingque: true })",
  lfsandoor: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'done' }, 5, 5, 'up', { lf_s_arrive: true, lf_q6_dock: true })",
  lfsantree: "hsrShots.sanScene({ lf_q5: 'done', lf_q6: 'done' }, 30, 9, 'up', { lf_s_arrive: true, lf_arbor_up: true, lf_q6_dock: true })",
  lfmxtree2: "hsrShots.lfMapScene('lf_matrix', { lf_q8: 'report' }, 23, 33, 'down', { lf_d_arrive: true, lf_m_core: true, lf_arbor_up: true, lf_fx_report: true, lf_fx_orders: true, lf_t_tree: true })",
  lfdivtree: "hsrShots.lfMapScene('lf_divination', { lf_q8: 'report' }, 25, 7, 'down', { lf_d_arrive: true, lf_side_gate: true, lf_gate_win: true, lf_arbor_up: true, lf_t_tree: true })",
  lfphoto: "hsrShots.lfPhoto()",
  lfphotoflow: "hsrShots.lfPhotoFlow()",
  lfcgseat: "hsrShots.cg('lf_seat')",
  lfbailu: "hsrShots.lfFoeBattle('lf_bailu')",
  lfdivyard: "hsrShots.lfMapScene('lf_divination', { lf_q6: 'done', lf_q7: 'enter' }, 25, 28, 'up', { lf_d_arrive: true })",
  lfdivdock: "hsrShots.lfMapScene('lf_divination', { lf_q6: 'done', lf_q7: 'enter' }, 25, 37, 'up', { lf_d_arrive: true })",
  lfdivhall: "hsrShots.lfMapScene('lf_divination', { lf_q7: 'repair' }, 11, 17, 'right', { lf_d_arrive: true, lf_d_gate_seen: true })",
  lfdivplaza: "hsrShots.lfMapScene('lf_divination', { lf_q7: 'meet' }, 25, 13, 'up', { lf_d_arrive: true, lf_side_gate: true, lf_gate_win: true })",
  lfdivfight: "hsrShots.lfMapScene('lf_divination', { lf_q7: 'meet' }, 16, 18, 'right', { lf_d_arrive: true, lf_side_gate: true })",
  lfdivroom: "hsrShots.lfMapScene('lf_divination', { lf_q8: 'bye' }, 45, 16, 'up', { lf_d_arrive: true, lf_side_gate: true, lf_gate_win: true, lf_arbor_up: true, lf_orders: true, lf_t_tree: true })",
  lfmxcore: "hsrShots.lfMapScene('lf_matrix', { lf_q7: 'temporal' }, 23, 22, 'up', { lf_d_arrive: true, lf_m_core: true, lf_fx_orders: true })",
  lfmxkafka: "hsrShots.lfMapScene('lf_matrix', { lf_q8: 'kafka' }, 23, 26, 'up', { lf_d_arrive: true, lf_m_core: true, lf_fx_orders: true, lf_fx_report: true, lf_kafka_out: true, lf_jy_left: true })",
  lfmxwest: "hsrShots.lfMapScene('lf_matrix', { lf_q7: 'temporal' }, 6, 18, 'up', { lf_d_arrive: true, lf_m_core: true, lf_fx_orders: true, lf_t_termt: true })",
  lfmxspat: "hsrShots.lfMapScene('lf_matrix', { lf_q7: 'others' }, 36, 8, 'right', { lf_d_arrive: true, lf_m_core: true, lf_fx_orders: true, lf_term_t: true })",
  lfmxtree: "hsrShots.lfMapScene('lf_matrix', { lf_q8: 'report' }, 23, 29, 'down', { lf_d_arrive: true, lf_m_core: true, lf_arbor_up: true, lf_fx_report: true })",
  lfabacus1: "hsrShots.lfPuzzle('abacus', 'gate1')",
  lfabacus2: "hsrShots.lfPuzzle('abacus', 'gate2')",
  lfmutare1: "hsrShots.lfPuzzle('mutare', 't')",
  lfmutare2: "hsrShots.lfPuzzle('mutare', 's')",
  lfmutare3: "hsrShots.lfPuzzle('mutare', 'k', 1)",
  lfgate: "hsrShots.lfFoeBattle('lf_gate')",
  lfaurumaton: "hsrShots.lfFoeBattle('lf_aurumaton')",
  lfartdock: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'ask' }, 5, 22, 'right', { lf_r_arrive: true })",
  lfartdome: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'roots' }, 18, 21, 'right', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true })",
  lfartbridge: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'roots' }, 33, 22, 'right', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true })",
  lfartboard1: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'node1' }, 28, 19, 'up', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true })",
  lfartfurnace: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'furnace' }, 50, 19, 'up', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true, lf_px_1: true })",
  lfartdeer: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'search' }, 50, 20, 'up', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true, lf_px_1: true, lf_deer_try: true })",
  lfartforge: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'node2' }, 41, 7, 'up', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true, lf_px_1: true, lf_deer_try: true })",
  lfartyard: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'node3' }, 45, 37, 'right', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true, lf_px_1: true, lf_deer_try: true, lf_px_2: true })",
  lfartend: "hsrShots.lfMapScene('lf_artisan', { lf_q9: 'done' }, 49, 21, 'up', { lf_r_arrive: true, lf_gate_seal: true, lf_t_spot: true, lf_ingenium_win: true, lf_gongshu: true, lf_gongshu_lead: true, lf_px_1: true, lf_deer_try: true, lf_px_2: true, lf_px_3: true, lf_deer_done: true })",
  lfdelve: "hsrShots.lfMapScene('lf_delve', { lf_dh2: 'delve' }, 15, 13, 'up', {})",
  lfdelveview: "hsrShots.lfMapScene('lf_delve', { lf_dh2: 'follow' }, 9, 6, 'up', { lf_dh2_win: true, lf_dh2_lead: true })",
  lfalbureau: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'survivors' }, 45, 57, 'left', { lf_al_arrive: true, lf_r_arrive: true })",
  lfalgarden: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'survivors' }, 39, 58, 'left', { lf_al_arrive: true, lf_r_arrive: true })",
  lfalstairs: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'survivors' }, 31, 50, 'up', { lf_al_arrive: true, lf_r_arrive: true })",
  lfalyard: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'survivors' }, 30, 40, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true })",
  lfalyard2: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 22, 41, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalterrace: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 47, 40, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalstreet: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 10, 39, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalpier: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 9, 52, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalpier2: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 22, 53, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalstreetb: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'camp' }, 16, 23, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true })",
  lfalmarket: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'wait' }, 30, 23, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true })",
  lfalmarket2: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'wait' }, 40, 22, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true })",
  lfallift: "hsrShots.lfMapScene('lf_alchemy', { lf_q10: 'crucibles' }, 8, 11, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true })",
  lfmist0: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'crucibles' }, 28, 55, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true })",
  lfmist1: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'crucibles' }, 20, 44, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true })",
  lfmist2: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'crucibles' }, 38, 45, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true })",
  lfmistwall: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'crucibles' }, 28, 40, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true })",
  lfmistgate: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'crucibles' }, 13, 44, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true })",
  lfmist3: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'furnace' }, 28, 32, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true })",
  lfmistfurnace: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'furnace' }, 28, 24, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true })",
  lfmistend: "hsrShots.lfMapScene('lf_evemist', { lf_q10: 'skiff' }, 28, 7, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true })",
  lfdisciple: "hsrShots.lfWaveBattle('lf_disciple', 'lf_alch', 1)",
  lfdanshu: "hsrShots.lfWaveBattle('lf_danshu', 'lf_mist', 1)",
  lflegion: "hsrShots.lfWaveBattle('lf_legion', 'lf_mist', 0)",
  lfdhmarket: "hsrShots.lfGuest('lf_alchemy', { lf_q10: 'done', lf_dh3: 'market' }, 42, 23, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true }, 'danheng')",
  lfdhcamp: "hsrShots.lfGuest('lf_alchemy', { lf_q10: 'done', lf_dh3: 'market' }, 30, 22, 'down', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true }, 'danheng')",
  lfdhlook: "hsrShots.lfGuest('lf_alchemy', { lf_q10: 'done', lf_dh3: 'find' }, 11, 13, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true }, 'danheng')",
  lfdhgate: "hsrShots.lfGuest('lf_evemist', { lf_q10: 'done', lf_dh3: 'skiff' }, 13, 44, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_dh3_in: true }, 'danheng')",
  lfdhpier: "hsrShots.lfGuest('lf_evemist', { lf_q10: 'done', lf_dh3: 'skiff' }, 7, 53, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_dh3_in: true }, 'danheng')",
  lftrarrive: "hsrShots.lfGuest('lf_terrace', { lf_q10: 'done', lf_dh3: 'altar' }, 12, 12, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true }, 'danheng')",
  lftrmeet: "hsrShots.lfGuest('lf_terrace', { lf_q10: 'done', lf_dh3: 'altar' }, 12, 10, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_tr_meet: true, lf_tr_yq: true }, 'danheng')",
  lftrjy: "hsrShots.lfGuest('lf_terrace', { lf_q10: 'done', lf_dh3: 'altar' }, 15, 9, 'right', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_tr_meet: true, lf_tr_yq: true, lf_tr_il: true, lf_tr_win: true, lf_tr_jy: true, lf_tr_left: true }, 'imbibitor')",
  lfscpier: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'monument' }, 78, 17, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true }, 'imbibitor')",
  lfscbeach: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'monument' }, 71, 17, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true }, 'imbibitor')",
  lfscnorth: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'monument' }, 71, 9, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true }, 'imbibitor')",
  lfscsouth: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'monument' }, 72, 24, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true }, 'imbibitor')",
  lfscfight: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'monument' }, 66, 17, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true }, 'imbibitor')",
  lfscplaza: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'open' }, 52, 23, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true, lf_rainhall_win: true }, 'imbibitor')",
  lfscstatue: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'open' }, 52, 17, 'up', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true, lf_rainhall_win: true }, 'imbibitor')",
  lfscwest: "hsrShots.lfGuest('lf_scale', { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'open' }, 42, 17, 'left', { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_dh3_on: true, lf_terrace_done: true, lf_scale_in: true, lf_rainhall_win: true }, 'imbibitor')",
  lfyanqing: "hsrShots.lfWaveBattle('lf_yanqing', 'lf_sea', 0)",
  lfrainhall: "hsrShots.lfWaveBattle('lf_rainhall', 'lf_sea', 1)",
  lfseopen: "hsrShots.lfSea({ lf_q11: 'enter' }, 42, 17, 'left')",
  lfseroad: "hsrShots.lfSea({ lf_q11: 'enter' }, 35, 17, 'left')",
  lfsehall: "hsrShots.lfSea({ lf_q11: 'seals' }, 24, 17, 'up')",
  lfsegate: "hsrShots.lfSea({ lf_q11: 'seals' }, 18, 17, 'left')",
  lfsetile: "hsrShots.lfSea({ lf_q11: 'seals' }, 24, 7, 'up')",
  lfsetile2: "hsrShots.lfSea({ lf_q11: 'seals' }, 24, 7, 'up', {}, { tile: 2 })",
  lfsemural: "hsrShots.lfSea({ lf_q11: 'seals' }, 16, 29, 'up')",
  lfseape: "hsrShots.lfSea({ lf_q11: 'seals' }, 30, 27, 'right')",
  lfseslate: "hsrShots.lfSea({ lf_q11: 'seals' }, 33, 31, 'up', { lf_ape_win: true })",
  lfsedepth: "hsrShots.lfSea({ lf_q11: 'depths' }, 8, 17, 'left', { lf_seal_tile: true, lf_seal_mural: true, lf_seal_slate: true })",
  lfseeggs: "hsrShots.lfSea({ lf_q11: 'depths' }, 9, 19, 'down', { lf_seal_tile: true, lf_seal_mural: true, lf_seal_slate: true })",
  lfrootsin: "hsrShots.lfMapScene('lf_roots', { lf_q11: 'done', lf_dh5: 'fight' }, 13, 19, 'up', { lf_sea_open: true, lf_roots_in: true })",
  lfrootsmid: "hsrShots.lfMapScene('lf_roots', { lf_q11: 'done', lf_dh5: 'fight' }, 13, 12, 'up', { lf_sea_open: true, lf_roots_in: true })",
  lfape: "hsrShots.lfWaveBattle('lf_ape', 'lf_sea', 0)",
  lfscopen_full: "hsrShots.fullMap('lf_scale', { lf_sea_open: true, lf_rainhall_win: true, lf_rainhall_done: true })",
  lfalley: "hsrShots.lfEnd('lf_alley', 'gifts', 13, 19, 'up')",
  lfalleyn: "hsrShots.lfEnd('lf_alley', 'gifts', 13, 8, 'up')",
  lfalleyshop: "hsrShots.lfEnd('lf_alley', 'gifts', 20, 19, 'right')",
  lfalleyw: "hsrShots.lfEnd('lf_alley', 'gifts', 6, 18, 'left')",
  lfsangate: "hsrShots.lfEnd('lf_sanctum', 'gifts', 6, 22, 'left')",
  lfseatin: "hsrShots.lfEnd('lf_seat', 'fuxuan', 10, 31, 'up')",
  lfseatfx: "hsrShots.lfEnd('lf_seat', 'fuxuan', 9, 11, 'up')",
  lfseatjy: "hsrShots.lfEnd('lf_seat', 'talk', 10, 7, 'up', { lf_ceremony: true, lf_oath: true })",
  lfastrumyk: "hsrShots.lfEnd('lf_astrum', 'astrum', 12, 8, 'up')",
  lfastrumym: "hsrShots.lfEnd('lf_astrum', 'yanming', 15, 12, 'right', { lf_fn_astrum: true })",
  lfhavenearl: "hsrShots.lfEnd('lf_haven', 'gifts', 6, 19, 'left', { lf_fn_astrum: true })",
  lfhavenplaza: "hsrShots.lfEnd('lf_haven', 'plaza', 39, 23, 'up', { lf_fn_astrum: true, lf_gifts: true, lf_boat_done: true, lf_kite_in: true })",
  lfhavenbye: "hsrShots.lfEnd('lf_haven', 'express', 8, 19, 'left', { lf_fn_astrum: true, lf_gifts: true, lf_ceremony: true, lf_oath: true, lf_fn_split: true })",
  lfnavboat: "hsrShots.lfEnd('lf_navalia', 'boat', 38, 9, 'left', { lf_fn_astrum: true, lf_gifts: true, lf_gift_bow: true, lf_gift_tea: true, lf_gift_knife: true, lf_kite_in: true })",
  lfsankids: "hsrShots.lfEnd('lf_sanctum', 'express', 42, 22, 'down', { lf_fn_astrum: true, lf_gifts: true, lf_ceremony: true, lf_oath: true, lf_fn_split: true })",
  lfwindow: "hsrShots.lfEnd('express', 'done', 20, 8, 'up', { lf_arrive: true, lf_done: true })",
  lfstarmap: "hsrShots.starMap('lf_haven', { lf_arrive: true, lf_haven_in: true })",
  lfguideacts: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { jarilo_done: true, lf_arrive: true }); for (const q of ['lf_q1', 'lf_q2', 'lf_q3', 'lf_dh1', 'lf_q4', 'lf_q5', 'lf_q6', 'lf_q7', 'lf_q8', 'lf_dh2', 'lf_q9', 'lf_q10', 'lf_dh3', 'lf_dh4', 'lf_q11', 'lf_dh5', 'lf_q12']) g.state.quests[q] = 'done'; hsrui.openIpg('trail'); const s = hsrui.top(); s.act = 2; s.focus = 'cards'; return hsrShots.shot(); })()",
  lfguidech: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { jarilo_done: true, lf_arrive: true }); for (const q of ['lf_q1', 'lf_q2', 'lf_q3', 'lf_dh1', 'lf_q4', 'lf_q5']) g.state.quests[q] = 'done'; hsrui.openIpg('trail'); hsrui.openGuideChapter('wander', 'Раздел I'); return hsrShots.shot(); })()",
  lfmail18: "(() => { const g = hsrShots.fresh('express'); g.state.flags.jarilo_done = true; g.mailSync(); hsrui.openMail && hsrui.openMail(); return hsrShots.shot(); })()",
  lfmail18b: "(() => { const g = hsrShots.fresh('express'); g.state.flags.jarilo_done = true; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(s.list().findIndex(x => x.m.id === 'v18_luofu')); hsrShots.pump(2); return hsrShots.shot(); })()",
  lfmail18c: "(() => { const g = hsrShots.fresh('express'); g.state.flags.jarilo_done = true; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(s.list().findIndex(x => x.m.id === 'v18_luofu')); hsrShots.pump(2); for (let i = 0; i < 12; i++) hsrui.handleKey(null, 'PageDown', {}); hsrShots.pump(2); return hsrShots.shot(); })()",
  lfitems: "(() => { const c = hsrui.ctx, G = Hsr98.Gfx; hsrShots.fresh('express'); c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480); ['lf_fan', 'lf_amiseal', 'lf_chest', 'lf_knife', 'lf_bowset', 'lf_blend', 'lf_offal', 'lf_kite', 'lf_abacus', 'lf_ditingpic', 'lf_slate'].forEach((id, i) => { const x = 24 + (i % 4) * 150, y = 30 + Math.floor(i / 4) * 150; G.itemIcon(c, id, x, y, 128); }); return hsrui.canvas.toDataURL('image/png'); })()",
  lfdeer1: "hsrShots.lfFoeBattle('lf_deer1')",
  lfdeer2: "hsrShots.lfDeerBattle()",
  lfingenium: "hsrShots.lfFoeBattle('lf_ingenium')",
  lfnavkafka: "hsrShots.lfSay('lf_navalia', 'lf_n_kafka', 2)",
  lfnavclue: "hsrShots.lfSay('lf_navalia', 'lf_n_chest1', 2)",
  lfbattle1: "hsrShots.lfBattle(1, true)",
  lfbattle2: "hsrShots.lfBattle(2, false)",
  lfbattle3: "hsrShots.lfBattle(3, true)",
  ksmeadow: "hsrShots.fieldAt('ax_meadow', 13, 15)",
  ksmeadowgate: "hsrShots.fieldAt('ax_meadow', 23, 6)",
  ksmeadowfield: "hsrShots.fieldAt('ax_meadow', 30, 19)",
  ksmeadowpond: "hsrShots.fieldAt('ax_meadow', 18, 22)",
  ksstar: "(() => { const g = hsrShots.fresh('ax_meadow'); Object.assign(g.state.flags, { ks_signal: true, ks_land: true }); hsrui.openStarMap(null); hsrShots.pump(2); return hsrShots.shot(); })()",
  kswindow: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { ks_signal: true, ks_land: true }); hsrui.enterField(); hsrShots.pump(30); return hsrShots.shot(); })()",
  ksbattle: "hsrShots.battlePlay(['ks_toad:40', 'ks_toad:40'], 'meadow', ['trail', 'aqua', 'megumin', 'darkness'], '')",
  kstown: "hsrShots.fieldAt('ax_town', 25, 31)",
  kstownsquare: "(() => { const g = hsrShots.fresh('ax_town'); Object.assign(g.state.flags, { ks_signal: true, ks_land: true, ks_met: true, ks_town: true }); g.loadMap('ax_town', null, { x: 24, y: 21, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  kstowneast: "hsrShots.fieldAt('ax_town', 41, 31)",
  kstownwest: "hsrShots.fieldAt('ax_town', 9, 30)",
  ksguild: "(() => { const g = hsrShots.fresh('ax_guild'); Object.assign(g.state.flags, { ks_signal: true, ks_land: true, ks_met: true, ks_town: true, ks_cards: true }); g.loadMap('ax_guild', null, { x: 12, y: 9, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  kswiz: "hsrShots.fieldAt('ax_wiz', 7, 8)",
  ksstable: "hsrShots.fieldAt('ax_stable', 6, 6)",
  ksevent: "(() => { const g = hsrShots.fresh('express'); delete g.state.flags.jarilo_done; hsrui.openEvents('konosuba'); hsrShots.pump(4); return hsrShots.shot(); })()",
  kseventopen: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { ks_early: true, ks_signal: true, ks_land: true, ks_met: true, ks_town: true, ks_cards: true, ks_swap: true }); g.state.quests.ks_q3 = 'done'; hsrui.openEvents('konosuba'); hsrui.top().pick = 0; hsrShots.pump(4); return hsrShots.shot(); })()",
  ksearly: "(() => { const g = hsrShots.fresh('express'); hsrui.openEvents('konosuba'); hsrui.openKsEarly(); hsrShots.pump(4); return hsrShots.shot(); })()",
  ksnotice: "(() => { const g = hsrShots.fresh('express'); delete g.state.flags.ks_note; hsrui.newEventNotice(); hsrShots.pump(4); return hsrShots.shot(); })()",
  kscredits: "(() => { hsrShots.fresh('express'); hsrui.openClipCredits('konosuba'); const s = hsrui.top(); s.start(); const at = " + (+(process.env.CT || 20)) + "; s.time = () => at; hsrShots.pump(2); return hsrShots.shot(); })()",
  uimail: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { jarilo_done: true, ks_done: true }); g.state.mail = {}; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(g.mailbox().length - 1); s.select(g.mailbox().findIndex(x => x.m.id === 'v13_signal')); hsrShots.pump(2); return hsrShots.shot(); })()",
  uiconepick: "(() => { const g = hsrShots.fresh('express'); for (const id of Object.keys(Hsr98.CONES).slice(0, 60)) g.state.inv.cones.push({ uid: 'shot_' + id, id, sup: 1 }); hsrui.openConePick(g.state.party[0]); hsrui.top().sel = 30; hsrShots.pump(2); return hsrShots.shot(); })()",
  uidetails: "(() => { const g = hsrShots.fresh('express'); hsrui.openChars(g.state.party[0]); hsrShots.pump(2); return hsrShots.shot(); })()",
  uioutfits: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; hsrui.openSupply('fashion'); hsrui.top().fsel = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  uicharlist: "(() => { const g = hsrShots.fresh('express'); hsrui.openChars(g.state.party[0]); hsrShots.pump(1); hsrui.openCharList(hsrui.top()); hsrShots.pump(2); return hsrShots.shot(); })()",
  uicharbtn: "(() => { const g = hsrShots.fresh('express'); hsrui.openChars(g.state.party[0]); hsrShots.pump(2); return hsrShots.shot(); })()",
  uiarchive: "(() => { const g = hsrShots.fresh('express'); const ids = Object.keys(Hsr98.CONES); g.state.warpLog = Array.from({ length: 40 }, (_, i) => ({ kind: 'cone', id: ids[i % ids.length], rar: 3 + (i % 3 === 0), ban: 'std', n: i + 1, at: Date.now(), pity: i % 10 + 1 })); hsrui.openBank(null); hsrui.top().setTab(3); hsrui.top().sel = 25; hsrShots.pump(2); return hsrShots.shot(); })()",
  ksmail: "(() => { const g = hsrShots.fresh('express'); g.state.flags.jarilo_done = true; g.state.mail = {}; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(g.mailbox().findIndex(x => x.m.id === 'v14_konosuba')); hsrShots.pump(2); return hsrShots.shot(); })()",
  kschat: "(() => { const g = hsrShots.fresh('express'); g.state.flags.ks_done = true; g.state.chats = null; for (let i = 0; i < 6; i++) for (const id of g.chatSync()) if (id !== 'ks_kazuma_after') g.chatAuto(id, true); g.chatThread('ks_kazuma_after').picks = [1]; g.chatAuto('ks_kazuma_after', true); g.events.length = 0; hsrui.openChats('kazuma'); hsrShots.pump(90); return hsrShots.shot(); })()",
  ksphoto: "(() => { const g = hsrShots.fresh('express_cabin'); g.state.flags.ks_done = true; hsrui.openBook('photos'); hsrui.top().sel = Hsr98.PHOTOS.findIndex(p => p[0] === 'ks_done'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ksfinal: "(() => { const g = hsrShots.fresh('ax_guild'); Object.assign(g.state.flags, { ks_swap: true, ks_toads: true, ks_blast: true, ks_lake: true, ks_i1: true, ks_i2: true, ks_i3: true }); g.state.ks = { got: [], stats: { ax: { fights: 15, turns: 102, miss: 11, fail: 7, collapse: 6, swallow: 4, cover: 38 }, kz: { fights: 5, turns: 40, miss: 0, fail: 0, collapse: 0, swallow: 0, cover: 2 } } }; hsrui.openUi_ksreport({ final: true }); hsrShots.pump(4); return hsrShots.shot(); })()",
  ksafter: "(() => { const g = hsrShots.fresh('ax_mansion'); Object.assign(g.state.flags, { ks_swap: true, ks_night: true, ks_tadpole: true, ks_done: true }); g.loadMap('ax_mansion', null, { x: 11, y: 13, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksdinner: "(() => { const g = hsrShots.fresh('ax_mansion'); Object.assign(g.state.flags, { ks_swap: true, ks_tadpole: true }); g.loadMap('ax_mansion', null, { x: 11, y: 13, silent: true }); g.runScript('ks_dinner'); for (let i = 0; i < 4; i++) { g.resume(); } hsrShots.pump(20); return hsrShots.shot(); })()",
  kscarryself: "(() => { const g = hsrShots.fresh('ax_town'); Object.assign(g.state.flags, { ks_met: true, ks_carry: true }); g.loadMap('ax_town', null, { x: 33, y: 5, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksgate: "(() => { const g = hsrShots.fresh('ax_gate', ['kazuma', 'aqua', 'megumin', 'darkness']); g.state.flags.ks_alarm = true; g.loadMap('ax_gate', null, { x: 19, y: 15, silent: true }); g.player.dir = 'down'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksboss: "(() => { const g = hsrShots.fresh('ax_gate', ['kazuma', 'aqua', 'megumin', 'darkness']); g.startBattle({ encId: 'ks_proto', fromScript: true }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; b.hit(b.allies[0], b.enemies[0], 1, {}); for (let i = 0; i < 300 && !(b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur); i++) hsrui.update(1 / 10); hsrShots.pump(4); return hsrShots.shot(); })()",
  ksforest: "(() => { const g = hsrShots.fresh('ax_forest', ['kazuma', 'march', 'danheng', 'himeko']); g.loadMap('ax_forest', null, { x: 30, y: 9, silent: true }); g.player.dir = 'right'; hsrShots.pump(30); return hsrShots.shot(); })()",
  kscave: "hsrShots.fieldAt('ax_forest', 6, 13)",
  kskeele: "(() => { const g = hsrShots.fresh('ax_keele1', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.ks_i3_go = true; g.loadMap('ax_keele1', null, { x: 9, y: 15, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  kskeele2: "(() => { const g = hsrShots.fresh('ax_keele2', ['kazuma', 'march', 'danheng', 'himeko']); g.loadMap('ax_keele2', null, { x: 15, y: 14, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksreport: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { ks_swap: true, ks_toads: true, ks_blast: true, ks_i1: true, ks_i2: true }); g.state.ks = { got: [], stats: { ax: { fights: 9, turns: 61, miss: 9, fail: 6, collapse: 4, swallow: 3 }, kz: { fights: 3, turns: 24, miss: 0, fail: 0, collapse: 0, swallow: 0 } } }; hsrui.openUi_ksreport({}); hsrShots.pump(4); return hsrShots.shot(); })()",
  kscard: "(() => { const g = hsrShots.fresh('ax_guild'); Object.assign(g.state.flags, { ks_swap: true, ks_cards: true, ks_toads: true, ks_blast: true }); g.state.ks = { got: [], skills: ['steal', 'drain'], equip: ['steal', 'drain'] }; hsrui.openUi_kscard({}); hsrui.top().sel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  kschris: "(() => { const g = hsrShots.fresh('ax_guild'); Object.assign(g.state.flags, { ks_swap: true, ks_cards: true, ks_chris_met: true }); g.runScript('ax_chris_menu'); hsrShots.pump(20); return hsrShots.shot(); })()",
  ksskills: "(() => { const g = hsrShots.fresh('ax_meadow', ['trail', 'aqua', 'megumin', 'darkness']); g.state.flags.ks_swap = true; g.state.ks = { got: [], skills: ['steal', 'bind'], equip: ['steal', 'bind'] }; g.startBattle({ enemies: ['ks_toad:40', 'ks_toad_blue:41'], noFlee: true }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle, idle = () => b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur; const wait = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) hsrui.update(1 / 10); }; for (let n = 0; n < 6; n++) { wait(); if (b.current && b.current.key === 'trail') break; hsrui.battleKey('ok', 'Space'); } wait(); hsrui.battleKey(null, 'KeyE'); hsrui.battleKey('down', 'ArrowDown'); hsrui.battleKey('down', 'ArrowDown'); hsrShots.pump(10); return hsrShots.shot(); })()",
  kslake: "hsrShots.fieldAt('ax_lake', 17, 16)",
  kslakeshore: "hsrShots.fieldAt('ax_lake', 22, 22)",
  kslakebattle: "(() => { const g = hsrShots.fresh('ax_lake', ['trail', 'aqua', 'megumin', 'darkness']); g.startBattle({ encId: 'ks_lake', fromScript: true }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; b.ward.hp = Math.round(b.ward.max * 0.62); b.ward.turns = 3; hsrui.bt.ward = Object.assign({}, b.ward); for (let i = 0; i < 300 && !(b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur); i++) hsrui.update(1 / 10); hsrShots.pump(2); return hsrShots.shot(); })()",
  ksestate: "(() => { const g = hsrShots.fresh('ax_estate'); Object.assign(g.state.flags, { ks_signal: true, ks_land: true, ks_met: true, ks_town: true, ks_cards: true, ks_swap: true }); g.setGuest(['trail', 'aqua', 'megumin', 'darkness'], { solo: true }); g.loadMap('ax_estate', null, { x: 19, y: 18, silent: true }); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksmansion: "(() => { const g = hsrShots.fresh('ax_mansion'); Object.assign(g.state.flags, { ks_swap: true, ks_night: true, ks_tadpole: true }); g.loadMap('ax_mansion', null, { x: 11, y: 10, silent: true }); g.player.dir = 'left'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksfort: "hsrShots.fieldAt('ax_fort', 16, 13)",
  ksforttop: "hsrShots.fieldAt('ax_fort', 18, 8)",
  ksboard: "(() => { const g = hsrShots.fresh('ax_guild'); Object.assign(g.state.flags, { ks_swap: true, ks_night: true }); g.state.quests.ks_qa = 'done'; hsrui.openUi_ksboard({}); hsrui.top().sel = 1; hsrShots.pump(4); return hsrShots.shot(); })()",
  ksrate: "(() => { hsrShots.fresh('ax_fort'); hsrui.openUi_ksrate({}); const s = hsrui.top(); s.got = [{ p: 0.48, s: 31 }, { p: 0.7, s: 20 }]; s.row = 2; hsrShots.pump(4); return hsrShots.shot(); })()",
  kscarry: "(() => { const g = hsrShots.fresh('ax_meadow'); Object.assign(g.state.flags, { ks_met: true, ks_swap: true, ks_carry: true }); g.setGuest(['trail', 'aqua', 'megumin', 'darkness'], { solo: true }); g.loadMap('ax_meadow', null, { x: 44, y: 20, silent: true }); g.player.dir = 'left'; hsrShots.pump(30); return hsrShots.shot(); })()",
  ksswallow: "(() => { hsrShots.battlePlay(['ks_toad_gold:42', 'ks_toad_blue:41'], 'meadow', ['trail', 'aqua', 'megumin', 'darkness'], ''); const b = hsrui.game.battle; b.swallow(b.enemies[0], b.allies.find(a => a.charId === 'aqua')); hsrui.drainGameEvents && hsrui.drainGameEvents(); hsrShots.pump(20); return hsrShots.shot(); })()",
  expguests: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { asta_met: true, arlan_met: true, serval_met: true, underworld: true, moles: true }); hsrui.openBook('guests'); hsrShots.pump(2); return hsrShots.shot(); })()",
  expphotos: "(() => { const g = hsrShots.fresh('express_cabin'); g.state.flags.underworld = true; hsrui.openBook('photos'); hsrui.top().sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  expnav: "(() => { hsrShots.fresh('express'); hsrui.openNav(); hsrShots.pump(4); return hsrShots.shot(); })()",
  plains: "hsrShots.field('j_plains')",
  belobog: "hsrShots.field('j_belobog')",
  station: "hsrShots.field('hs_storage')",
  dialog: "hsrShots.dialog('himeko_talk', 40)",
  menu: 'hsrShots.menu()',
  phonerail: 'hsrShots.phoneRail()',
  phonesave: "(() => { hsrShots.fresh('j_belobog'); hsrui.openMenu(); const s = hsrui.top(); s.railSel = 2; s.toRail(2); hsrShots.pump(2); return hsrShots.shot(); })()",
  phoneguide: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); hsrui.top().sel = 7; hsrShots.pump(2); return hsrShots.shot(); })()",
  supply: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state, { starlight: 734, embers: 1260 }); g.state.shop.intro = true; g.supplyBuy('s_milkyway', 1); hsrui.openMenu(); hsrui.openSupply(); hsrui.top().sel = 5; hsrShots.pump(2); return hsrShots.shot(); })()",
  supplyembers: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state, { starlight: 734, embers: 1260 }); g.state.shop.intro = true; g.supplyBuy('e_spass', 5); hsrui.openMenu(); hsrui.openSupply(); hsrui.top().tab = 1; hsrui.top().sel = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  supplyintro: "(() => { const g = hsrShots.fresh('express'); g.state.shop.back = { starlight: 248, embers: 1340 }; hsrui.openMenu(); hsrui.openSupply(); hsrShots.pump(2); return hsrShots.shot(); })()",
  supplybuy: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state, { starlight: 734, embers: 1260 }); g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply(); const s = hsrui.top(); s.tab = 1; s.sel = 2; s.key('ok', 'Enter'); hsrui.top().setN(12); hsrShots.pump(2); return hsrShots.shot(); })()",
  supplypass: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 1240; g.state.shop.intro = true; delete g.state.pass; hsrui.opts.store = { buy: () => 'open', take: () => (window.__orders || []).splice(0) }; hsrui.openMenu(); hsrui.openSupply('pass'); hsrShots.pump(2); return hsrShots.shot(); })()",
  supplypassactive: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; delete g.state.pass; for (let i = 0; i < 2; i++) g.passGrant('S' + i); hsrui.openMenu(); hsrui.openSupply('pass'); hsrShots.pump(2); return hsrShots.shot(); })()",
  supplypassmax: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; delete g.state.pass; for (let i = 0; i < 6; i++) g.passGrant('S' + i); hsrui.openMenu(); hsrui.openSupply('pass'); hsrShots.pump(2); return hsrShots.shot(); })()",
  passrules: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('pass'); hsrui.openPassRules(); hsrShots.pump(2); return hsrShots.shot(); })()",
  passgot: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; delete g.state.pass; hsrui.opts.store = { buy: () => 'open', take: () => (window.__orders || []).splice(0) }; window.__orders = [{ id: 'SHOT1', sku: Hsr98.PASS.sku }]; hsrui.openMenu(); hsrui.openSupply('pass'); hsrui.storeSync(); hsrShots.pump(2); return hsrShots.shot(); })()",
  passdaily: "(() => { const g = hsrShots.fresh('express'); delete g.state.pass; g.passGrant('S1'); g.state.pass.last -= 1; hsrui.screens = []; hsrui.passT = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  contracts: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 3200; g.state.shop.intro = true; delete g.state.contracts; g.contractBuy('c_quest'); g.state.jade = 3200; g.contractBuy('c_quest'); g.state.jade = 3200; hsrui.openMenu(); hsrui.openSupply('contracts'); hsrui.top().csel = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  contractbuy: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 3200; g.state.shop.intro = true; delete g.state.contracts; hsrui.openMenu(); hsrui.openSupply('contracts'); hsrui.top().csel = 0; hsrui.contractAct(hsrui.top()); const b = hsrui.top(); b.toggle(1); b.toggle(2); b.sel = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  contractbuy2: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 3200; g.state.shop.intro = true; delete g.state.contracts; hsrui.openMenu(); hsrui.openSupply('contracts'); hsrui.top().csel = 5; hsrui.contractAct(hsrui.top()); hsrShots.pump(2); return hsrShots.shot(); })()",
  tracetears: "(() => { const g = hsrShots.fresh('express'); const k = 'himeko'; if (!g.state.roster[k]) g.addChar(k, 52); g.state.roster[k].lvl = 52; g.fillTraces(k, 'cap'); const t = g.traceOf(k); t.lv.skill = Math.max(1, t.lv.skill - 1); g.state.credits = 99999; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat')) g.state.inv.items[m] = Hsr98.ITEMS[m].mat === 'path' ? 1 : 9; g.state.inv.items.tears = 60; hsrui.openMenu(); hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'skill'; hsrShots.pump(2); return hsrShots.shot(); })()",
  pets: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('pets'); hsrui.t = " + (+(process.env.PT || 6)) + "; hsrShots.pump(1); return hsrShots.shot(); })()",
  petsowned: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; g.state.pets = ['chomusuke']; g.setPet('chomusuke'); Object.assign(g.petStats('chomusuke'), { steps: 1342, pets: 27 }); hsrui.openMenu(); hsrui.openSupply('pets'); hsrShots.pump(2); return hsrShots.shot(); })()",
  petfield: "(() => { const g = hsrShots.fresh('j_belobog', '" + (process.env.PL || 'trail,march,danheng,himeko') + "'.split(',')); g.state.pets = ['chomusuke']; g.setPet('chomusuke'); hsrShots.pump(4); const a = g.pet, act = '" + (process.env.PA || '') + "'; if (act) { a.act = act; a.actT = 0.5; a.still = 2; } hsrShots.pump(2); return hsrShots.shot(); })()",
  petsheet: "(() => { hsrShots.fresh('express'); const c = hsrui.ctx, H = Hsr98; c.fillStyle = '#7a8a6a'; c.fillRect(0, 0, 640, 480); const rows = [['front', 'sit'], ['front', 'walk'], ['front', 'groom'], ['front', 'yawn'], ['front', 'squint'], ['front', 'happy'], ['back', 'sit'], ['back', 'walk'], ['side', 'sit'], ['side', 'walk'], ['side', 'fly'], ['side', 'hiss'], ['front', 'sleep']]; c.imageSmoothingEnabled = false; rows.forEach(([v, p], i) => { for (let f = 0; f < 2; f++) { const cv = H.petCanvas('chomusuke', v, p, f), x = (i % 5) * 128 + f * 62, y = Math.floor(i / 5) * 150 + 10; c.drawImage(cv, x, y, 72, 72); c.drawImage(cv, x + 4, y + 88, 36, 36); } hsrui.text(v + ' ' + p, (i % 5) * 128 + 4, Math.floor(i / 5) * 150 + 132, { size: 10 }); }); return hsrui.canvas.toDataURL('image/png'); })()",
  fashion: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion'); hsrShots.pump(2); return hsrShots.shot(); })()",
  fashioncuts: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'himeko_vermilion'); hsrShots.pump(2); return hsrShots.shot(); })()",
  fashioncutsplay: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'himeko_vermilion'); const v = hsrui.openOutfitCuts('himeko_vermilion'); v.begin(2); v.show.i = 1; v.show.t = 1.1; v.show.T = 2.1; hsrui.hits = []; v.draw(hsrui.ctx); return hsrui.canvas.toDataURL('image/png'); })()",
  eidoutfit: "(() => { const g = hsrShots.fresh('express', ['himeko', 'trail']); g.debugOutfit('himeko_vermilion', true); const r = g.state.roster.himeko; r.eid = " + (+(process.env.EID || 6)) + "; r.eidSeen = r.eid; hsrui.openMenu(); hsrui.openEidolonView('himeko'); hsrShots.pump(" + (+(process.env.PUMP || 2)) + "); return hsrShots.shot(); })()",
  eidoutfitpanel: "(() => { const g = hsrShots.fresh('express', ['himeko', 'trail']); g.debugOutfit('himeko_vermilion', true); const r = g.state.roster.himeko; r.eid = 3; r.eidSeen = 3; hsrui.openMenu(); hsrui.openChars('himeko'); hsrui.top().sec = 4; hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionback: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; g.state.shop.outfitBack = 1680; hsrui.openMenu(); hsrui.openSupply('fashion'); hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionbuyask: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'megumin_bakuen'); hsrShots.pump(2); hsrui.openOutfitBuy('megumin_bakuen'); hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionmeg: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; g.state.outfits = ['march_spring']; hsrui.openMenu(); hsrui.openSupply('fashion', 'megumin_bakuen'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitmeg: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['megumin_bakuen']; g.wearOutfit('megumin', 'megumin_bakuen'); hsrui.openMenu(); hsrui.openChars('megumin'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitmeg: "(() => { const g = hsrShots.fresh('express', ['megumin', 'trail']); g.state.outfits = ['megumin_bakuen']; g.wearOutfit('megumin', 'megumin_bakuen'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionplum: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'ruanmei_plum'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitplum: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['ruanmei_plum']; g.wearOutfit('ruanmei', 'ruanmei_plum'); hsrui.openMenu(); hsrui.openChars('ruanmei'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionwelt: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'welt_idol'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitwelt: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['welt_idol']; g.wearOutfit('welt', 'welt_idol'); hsrui.openMenu(); hsrui.openChars('welt'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionbride: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'darkness_bride'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitbride: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['darkness_bride']; g.wearOutfit('darkness', 'darkness_bride'); hsrui.openMenu(); hsrui.openChars('darkness'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitbride: "(() => { const g = hsrShots.fresh('express', ['darkness', 'trail']); g.state.outfits = ['darkness_bride']; g.wearOutfit('darkness', 'darkness_bride'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionaqua: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'aqua_beach'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitaqua: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['aqua_beach']; g.wearOutfit('aqua', 'aqua_beach'); hsrui.openMenu(); hsrui.openChars('aqua'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitaqua: "(() => { const g = hsrShots.fresh('express', ['aqua', 'trail']); g.state.outfits = ['aqua_beach']; g.wearOutfit('aqua', 'aqua_beach'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionnicole: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'nicole_bunny'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitnicole: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['nicole_bunny']; g.wearOutfit('nicole', 'nicole_bunny'); hsrui.openMenu(); hsrui.openChars('nicole'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitnicole: "(() => { const g = hsrShots.fresh('express', ['nicole', 'trail']); g.state.outfits = ['nicole_bunny']; g.wearOutfit('nicole', 'nicole_bunny'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionmiyabi: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'miyabi_blossom'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitmiyabi: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['miyabi_blossom']; g.wearOutfit('miyabi', 'miyabi_blossom'); hsrui.openMenu(); hsrui.openChars('miyabi'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitmiyabi: "(() => { const g = hsrShots.fresh('express', ['miyabi', 'trail']); g.state.outfits = ['miyabi_blossom']; g.wearOutfit('miyabi', 'miyabi_blossom'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionmakoto: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'makoto_chocola'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitmakoto: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['makoto_chocola']; g.wearOutfit('makoto', 'makoto_chocola'); hsrui.openMenu(); hsrui.openChars('makoto'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfitmakoto: "(() => { const g = hsrShots.fresh('express', ['makoto', 'trail']); g.state.outfits = ['makoto_chocola']; g.wearOutfit('makoto', 'makoto_chocola'); hsrShots.pump(30); return hsrShots.shot(); })()",
  fashionjersey: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion', 'kazuma_jersey'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitjersey: "(() => { const g = hsrShots.fresh('express'); g.state.flags.ks_done = true; g.wearOutfit('kazuma', 'kazuma_jersey'); hsrui.openMenu(); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fashionbuy: "(() => { const g = hsrShots.fresh('express'); g.state.jade = 2400; g.state.shop.intro = true; hsrui.openMenu(); hsrui.openSupply('fashion'); hsrui.top().key('ok', 'Enter'); hsrui.top().key('ok', 'Enter'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfit: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring']; hsrui.openMenu(); hsrui.openChars('march'); const s = hsrui.top(); s.sec = 6; s.outfitFocus = true; s.outfitFor = 'march'; s.outfitPick = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitworn: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring']; g.wearOutfit('march', 'march_spring'); hsrui.openMenu(); hsrui.openChars('march'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  charoutfitnone: "(() => { const g = hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  fieldoutfit: "(() => { const g = hsrShots.fresh('express', ['march', 'trail']); g.state.outfits = ['march_spring']; g.wearOutfit('march', 'march_spring'); hsrShots.pump(30); return hsrShots.shot(); })()",
  evnotice: 'hsrShots.eventsNotice()',
  events: "hsrShots.events('comet', 3, [true], 1)",
  events7: "hsrShots.events('comet', 7, [true, true, true, false, true], 6)",
  eventsdone: "hsrShots.events('comet', 7, [true, true, true, true, true, true, true], 0)",
  will: "hsrShots.events('will', 0, [], 1, 18, [5])",
  tlrewards: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.setTrailLevel(27); for (let l = 2; l <= 14; l++) g.claimTl(l); hsrui.openTlRewards(); hsrShots.pump(2); return hsrShots.shot(); })()",
  tlrewardsend: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.setTrailLevel(70); g.claimAllTl(); hsrui.openTlRewards(); const s = hsrui.top(); s.sel = 68; hsrShots.pump(2); return hsrShots.shot(); })()",
  tlrewardsfirst: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.setTrailLevel(12); hsrui.openTlRewards(); hsrShots.pump(2); return hsrShots.shot(); })()",
  pomtalk: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.state.flags.ending = true; g.runScript('pompom_talk'); hsrShots.pump(40); g.resume(); hsrShots.pump(20); return hsrShots.shot(); })()",
  pomfield: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.setTrailLevel(20); const p = g.map.ents.find(e => e.ch === 'p'); g.placePlayer(p.x, p.y + 2); hsrShots.pump(30); return hsrShots.shot(); })()",
  willdone: "hsrShots.events('will', 0, [], 3, 40, [5, 15, 25])",
  willfar: "hsrShots.events('will', 0, [], 5, 58, [5, 15, 25, 35, 45])",
  willtop: "hsrShots.events('will', 0, [], 7, 70, [5, 15, 25, 35, 45, 55, 65])",
  willowned: "hsrShots.events('will', 0, [], 6, 66, [5, 15, 25, 35, 45, 55], ['trail_trashlord'])",
  mail: 'hsrShots.mail(0)',
  chats: 'hsrShots.chats(0)',
  chatpick: 'hsrShots.chats(1)',
  chatphoto: 'hsrShots.chats(2)',
  chatsticker: 'hsrShots.chats(3)',
  chatlist: 'hsrShots.chats(4)',
  chatempty: 'hsrShots.chats(5)',
  chatnote: 'hsrShots.chatNote()',
  mailgot: 'hsrShots.mail(1)',
  mail12: 'hsrShots.mail(4)',
  mailhares: 'hsrShots.mail(5)',
  mail15: 'hsrShots.mail(6)',
  mail15got: 'hsrShots.mail(7)',
  mailgifts: 'hsrShots.mail(8)',
  mailgifts2: 'hsrShots.mail(9)',
  mail0: 'hsrShots.mail(2)',
  maildel: 'hsrShots.mail(3)',
  warpev: "hsrShots.warpBanner('ev')",
  warpstd: "hsrShots.warpBanner('std')",
  warpseele: "hsrShots.warpBanner('ev', 'seele')",
  warpcone: "hsrShots.warpBanner('cone')",
  warpconeseele: "hsrShots.warpBanner('cone', 'seele')",
  warpsig: "hsrShots.warpBanner('sig')",
  warpsigyanagi: "hsrShots.warpBanner('sig', 'yanagi')",
  warpamp: "hsrShots.warpBanner('amp', 'yanagi')",
  warpconv: "hsrShots.warpBanner('conv')",
  warpconvscar: "hsrShots.warpBanner('conv', 'scar')",
  warpguild: "hsrShots.warpBanner('guild')",
  personas: 'hsrShots.personaSheet()',
  p4persona: "hsrShots.p4Battle('persona')",
  p4stitch: "hsrShots.p4Battle('stitch')",
  p4onemore: "hsrShots.p4Battle('onemore')",
  p4aoaask: "hsrShots.p4Battle('aoaask')",
  p4aoa: "hsrShots.p4Battle('aoa')",
  cccmk: "hsrShots.ccBattle('mk')",
  haresfield: "hsrShots.haresBattle('field')",
  hareschain: "hsrShots.haresBattle('chain')",
  harespips: "hsrShots.haresBattle('pips')",
  cccportal: "hsrShots.ccBattle('portal')",
  cccheist: "hsrShots.ccBattle('heist')",
  cccam: "hsrShots.ccBattle('am')",
  cccam2: "hsrShots.ccBattle('am2')",
  ccctl: "hsrShots.ccBattle('tl')",
  cccsquad: "hsrShots.ccBattle('squad')",
  ccccapsule: "hsrShots.ccBattle('capsule')",
  cccclap: "hsrShots.ccBattle('clap')",
  warpmid: "hsrShots.warpBanner('mid')",
  warpmidkanji: "hsrShots.warpBanner('mid', 'kanji')",
  warpmidrise: "hsrShots.warpBanner('mid', 'rise')",
  warpcomp: "hsrShots.warpBanner('comp')",
  warpcomprise: "hsrShots.warpBanner('comp', 'rise')",
  warpmidc: "hsrShots.warpBanner('mid', 'rise', { unsigned: true })",
  warpmidguar: "hsrShots.warpBanner('mid', 'rise', { pity: { five: 55, guar5: true } })",
  warpcon: "hsrShots.warpBanner('con')",
  warpconam: "hsrShots.warpBanner('con', 'amanda')",
  warpcontl: "hsrShots.warpBanner('con', 'talleah', { pity: { five: 52, guar5: true } })",
  warpconreg: "hsrShots.warpBanner('con', 'makoto', { unreg: true })",
  warpalley: "hsrShots.warpBanner('alley')",
  warpalleyam: "hsrShots.warpBanner('alley', 'amanda')",
  evconton: "(() => { let now = new Date(2026, 9, 16, 12, 0).getTime(); const g = hsrShots.fresh('express'); g.clock = () => now; g.conDays(); g.claimConDay(0); now += 86400000; g.conDays(); hsrui.openEvents('conton'); hsrui.top().pick = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  warpguildmeg: "hsrShots.warpBanner('guild', 'megumin')",
  warpguilddark: "hsrShots.warpBanner('guild', 'darkness')",
  warpwiz: "hsrShots.warpBanner('wiz')",
  warpwizmeg: "hsrShots.warpBanner('wiz', 'megumin')",
  warpwizdark: "hsrShots.warpBanner('wiz', 'darkness')",
  battleks: "hsrShots.battlePlay(['reaver:20', 'soldier:20', 'shadewalker:20'], 'snow', ['kazuma', 'aqua', 'megumin', 'darkness'], " + JSON.stringify(process.env.KEYS || '  E') + ")",
  skillskazuma: "hsrShots.chars('kazuma', 3)",
  skillsaqua: "hsrShots.chars('aqua', 3)",
  skillsmegumin: "hsrShots.chars('megumin', 3)",
  skillsdarkness: "hsrShots.chars('darkness', 3)",
  warpforge: "hsrShots.warpBanner('forge')",
  battles6: "hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'snow', ['miyabi', 'yanagi', 'march', 'natasha'], " + JSON.stringify(process.env.KEYS || '  E    ^') + ")",
  skillsmiyabi: "hsrShots.chars('miyabi', 3)",
  skillsyanagi: "hsrShots.chars('yanagi', 3)",
  skillsphrolova: "hsrShots.chars('phrolova', 3)",
  skillsscar: "hsrShots.chars('scar', 3)",
  warphistev: 'hsrShots.warpHistEv()',
  charsheet: "hsrShots.charSheet(" + JSON.stringify(process.env.CHAR || 'ruanmei') + ", " + (process.env.LOOK || 'null') + ")",
  guide: "(() => { hsrShots.fresh('express'); hsrui.openGuide(); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide2: "(() => { hsrShots.fresh('express'); hsrui.openGuide(); hsrui.top().page = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugoutfit: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); const st = hsrui.debugState; st.ch.i = Object.keys(Hsr98.CHARS).filter(k => k !== 'trail_p').indexOf('ruanmei'); st.row = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugchars: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); hsrui.debugState.ch.i = 13; hsrui.debugState.ch.eid = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugcones: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 1, row: 1 }); hsrui.debugState.cn.i = 1; hsrui.debugState.cn.sup = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugult: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); hsrui.debugState.sc.id = 'seele'; hsrui.t = 1.6; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugfus: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); Object.assign(hsrui.debugState.sc, { kind: 1, id: 'f_landau' }); hsrui.t = 3.1; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugfusview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 1, id: 'f_wings' }); hsrui.openDebugShow(hsrui.debugState, false); for (let i = 0; i < 30; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugwarp: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 3 }); Object.assign(hsrui.debugState.sc, { kind: 3, id: 'ruanmei', cut: 1 }); hsrui.t = 2.4; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugeid: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 2 }); Object.assign(hsrui.debugState.sc, { kind: 4, id: 'pela', stage: 2 }); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugeidview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 4, id: 'himeko', stage: 3 }); hsrui.openDebugEidolon(hsrui.debugState, false); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugeidasm: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 4, id: 'himeko', stage: 1 }); hsrui.openDebugEidolon(hsrui.debugState, true); for (let i = 0; i < 26; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugultview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 0, id: 'himeko' }); hsrui.openDebugShow(hsrui.debugState, false); for (let i = 0; i < 30; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugcard: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 3, id: 'seele', cut: 1 }); const v = hsrui.openDebugShow(hsrui.debugState, false); v.stop(); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugrelics: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 2, row: 3 }); Object.assign(hsrui.debugState.rl, { set: 8, slot: 2, main: 'critD' }); hsrui.debugState.rl.subs = ['critR', '', 'atkP', 'spd']; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugitems: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 3, row: 4 }); hsrui.debugState.it.i = 12; hsrShots.pump(2); hsrui.debugForm(hsrui.debugState).acts[0].fn(); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugsets: "(() => { const g = hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 2, row: 0 }); hsrui.debugState.rl.set = 4; g.state.inv.relics.push({ uid: 'shot_r', set: 'firesmith', slot: 'head', main: 'hpF', mv: 1, subs: [], lvl: 0 }); hsrShots.pump(1); hsrui.openDebugSets(hsrui.debugState); hsrui.top().sel = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugmusic: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); hsrui.top().setTab(5); hsrui.debugState.mu.i = Hsr98.debugMusicList().findIndex(e => e.key === 'crises'); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugmusicsong: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); hsrui.top().setTab(5); Object.assign(hsrui.debugState.mu, { i: Hsr98.debugMusicList().findIndex(e => e.key === 'signal'), v: 2 }); hsrui.debugState.row = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugmusicplay: "(async () => { hsrShots.fresh('express'); hsrui.audio.init(); hsrui.debugState = null; hsrui.openDebug(); hsrui.top().setTab(5); const st = hsrui.debugState, list = Hsr98.debugMusicList(), e = list.find(x => x.key === 'pedu2'); st.mu.i = list.indexOf(e); hsrui.debugMusicPlay(st, e); await new Promise(r => setTimeout(r, 2500)); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugmusicgrant: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); hsrui.top().setTab(5); const st = hsrui.debugState, list = Hsr98.debugMusicList(), e = list.find(x => x.rec && !hsrui.game.recordOk(x.rec)); st.mu.i = list.indexOf(e); st.row = 2; hsrui.debugForm(st).acts[1].fn(); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugaha: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); hsrui.debugState.sc.kind = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  debuglong: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 3, row: 0 }); const K = ['food', 'exp', 'mat', 'key'], ids = Object.keys(Hsr98.ITEMS).sort((a, b) => K.indexOf(Hsr98.ITEMS[a].kind) - K.indexOf(Hsr98.ITEMS[b].kind)); hsrui.debugState.it.i = 2 + ids.reduce((m, k, i) => Hsr98.ITEMS[k].name.length > Hsr98.ITEMS[ids[m]].name.length ? i : m, 0); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugsceneslong: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); Object.assign(hsrui.debugState.sc, { kind: 1, id: Object.keys(Hsr98.FUSIONS).reduce((m, k) => Hsr98.FUSIONS[k].name.length > Hsr98.FUSIONS[m].name.length ? k : m) }); hsrui.t = 3.1; hsrShots.pump(1); return hsrShots.shot(); })()",
  missions: 'hsrShots.missions(0)',
  missionstrail: 'hsrShots.missions(1)',
  missionscomp: "hsrShots.missions(2, 'hook_foreman')",
  missionsadv: 'hsrShots.missions(3)',
  missionstrack: "hsrShots.missions(0, 'hook_treasure', 'hook_treasure')",
  hudhook: "hsrShots.questAt('u_boulder', 'hook_treasure', 'talk', 6, 9)",
  campfight: "hsrShots.questAt('u_camp', 'hook_foreman', 'mine', 2, 8)",
  campask: "hsrShots.questAt('u_camp', 'hook_foreman', 'ask', 14, 8)",
  campcrates: "hsrShots.questAt('u_camp', 'hook_foreman', 'crates', 26, 11)",
  campauction: "hsrShots.questAt('u_camp', 'hook_gift', 'buyers', 18, 6, 'hg_camp,hg_lady1,hg_wallet_ask')",
  rivetdig: "hsrShots.questAt('u_rivet', 'hook_treasure', 'findie', 4, 14)",
  rivetjunk: "hsrShots.questAt('u_rivet', 'hook_treasure', 'drill', 32, 25)",
  boulderhook: "hsrShots.questAt('u_clinic', 'hook_foreman', 'fersman', 11, 9)",
  mission: "(() => { const g = hsrShots.fresh('j_belobog'); g.state.obj = 'Прогуляться по Белобогу: заглянуть в мастерскую «Незимье» (юго-восток)'; hsrui.openMission(); hsrShots.pump(2); return hsrShots.shot(); })()",
  items: 'hsrShots.inventory(0)',
  hudenergy: 'hsrShots.hudEnergy(0)',
  hudcharge: 'hsrShots.hudEnergy(1)',
  powerx: "(() => { const g = hsrShots.fresh('express'); g.powerSync(); Object.assign(g.state, { power: 412, powerRes: 1730, jade: 900 }); g.state.inv.items.fuel = 3; hsrui.openCalyx(() => {}); hsrui.openPower(); hsrShots.pump(2); return hsrShots.shot(); })()",
  powerjade: "(() => { const g = hsrShots.fresh('express'); g.powerSync(); Object.assign(g.state, { power: 2680, powerRes: 2400, jade: 640 }); hsrui.openCalyx(() => {}); hsrui.openPower(); hsrui.top().sel = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  useenergy: "hsrShots.useEnergy('thermos')",
  invcones: 'hsrShots.inventory(4)',
  invrelics: 'hsrShots.inventory(5)',
  archive: 'hsrShots.archive()',
  team: 'hsrShots.team()',
  teamsquad: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openTeam(); hsrui.top().key(null, 'KeyE'); hsrShots.pump(2); return hsrShots.shot(); })()",
  teamempty: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openTeam(); hsrui.top().setView(3); hsrShots.pump(2); return hsrShots.shot(); })()",
  teamover: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openTeam(); hsrui.top().key(null, 'Tab'); hsrui.top().osel = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  teampick: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openTeam(); hsrui.top().key('ok'); hsrShots.pump(2); return hsrShots.shot(); })()",
  teampickend: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openTeam(); hsrui.top().key('ok'); const p = hsrui.top(); p.sel = hsrui.rosterKeys().length - 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  charfav: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 60, 0); g.state.squads = [null, ['seele', 'bronya', 'natasha', 'pela'], ['kafka', 'blade'], null, ['himeko', 'welt', 'herta', 'asta']]; g.toggleFav('seele'); g.toggleFav('kafka'); hsrui.openMenu(); hsrui.openChars('seele'); hsrShots.pump(2); return hsrShots.shot(); })()",
  char: "hsrShots.chars('arlan', 0)",
  charseele: "hsrShots.chars('seele', 0)",
  charruan: "hsrShots.chars('ruanmei', 0)",
  skillsruan: "hsrShots.chars('ruanmei', 3)",
  charcone: "hsrShots.cones('himeko')",
  charrelic: "hsrShots.chars('march', 2)",
  charplanar: "hsrShots.planar('seele', 4)",
  charplanar2: "hsrShots.planar('march', 5)",
  relicsplanar: "hsrShots.planarPick('seele', 4)",
  planaricons: 'hsrShots.planarIcons()',
  relicsheet: "hsrShots.relicSheet('cavern')",
  relicsheetg: "hsrShots.relicSheet('cavern', true)",
  planarsheet: "hsrShots.relicSheet('planar')",
  planarsheetg: "hsrShots.relicSheet('planar', true)",
  matsheet: "hsrShots.itemSheet('path')",
  elaha: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (let i = 0; i < 80; i++) hsrui.update(0.1); b.gainPunch(18); b.ahaTurn(b.summons.find(s => s.aha)); hsrui.pullEvents(); for (let i = 0; i < 5; i++) hsrui.update(0.1); return hsrShots.shot(); })()",
  elahaend: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (let i = 0; i < 80; i++) hsrui.update(0.1); b.gainPunch(18); b.ahaTurn(b.summons.find(s => s.aha)); hsrui.pullEvents(); for (let i = 0; i < 400 && (hsrui.bt.queue.length || hsrui.bt.cur); i++) { hsrui.update(0.05); if (hsrui.bt.msg && /Миг Ахи:/.test(hsrui.bt.msg)) break; } hsrui.update(0.2); return hsrShots.shot(); })()",
  ellaugh: "(() => { const g = hsrShots.fresh('j_plains', ['march', 'danheng', 'himeko', 'natasha']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (let i = 0; i < 80; i++) hsrui.update(0.1); b.gainPunch(6); b.ahaTurn(b.summons.find(s => s.aha)); hsrui.pullEvents(); for (let i = 0; i < 5; i++) hsrui.update(0.1); return hsrShots.shot(); })()",
  elkazuma: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march', 'danheng', 'himeko']); hsrui.openChars('kazuma'); hsrShots.pump(2); return hsrShots.shot(); })()",
  elhud: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (const e of b.enemies) e.hp = e.maxHp = e.dHp = 1e7; const idle = () => b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur; for (let i = 0; i < 300 && !idle(); i++) hsrui.update(0.1); b.gainPunch(9); hsrui.pullEvents(); for (let i = 0; i < 30; i++) hsrui.update(0.1); hsrui.bt.pick = 'skill'; return hsrShots.shot(); })()",
  elinstant: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (const e of b.enemies) e.hp = e.maxHp = e.dHp = 1e7; const idle = () => b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur; for (let i = 0; i < 300 && !idle(); i++) hsrui.update(0.1); b.drain(); b.gainPunch(18); b.ahaTurn(b.ahaUnit()); hsrui.pullEvents(); for (let i = 0; i < 400 && !(hsrui.bt.el && hsrui.bt.el.fx && hsrui.bt.el.fx.t > 0.5); i++) hsrui.update(0.05); return hsrShots.shot(); })()",
  elcard: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (const e of b.enemies) e.hp = e.maxHp = e.dHp = 1e7; const idle = () => b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur; for (let i = 0; i < 300 && !idle(); i++) hsrui.update(0.1); b.drain(); b.gainPunch(18); b.ahaTurn(b.ahaUnit()); hsrui.pullEvents(); for (let i = 0; i < 600 && !(hsrui.bt.el && hsrui.bt.el.card && hsrui.bt.el.card.t < 1.2); i++) hsrui.update(0.05); return hsrShots.shot(); })()",
  elrps: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); g.state.flags.seen_elation = true; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; const b = g.battle; for (const e of b.enemies) e.hp = e.maxHp = e.dHp = 1e7; const idle = () => b.phase === 'input' && !hsrui.bt.queue.length && !hsrui.bt.cur; for (let i = 0; i < 300 && !idle(); i++) hsrui.update(0.1); b.drain(); b.gainPunch(18); b.ahaTurn(b.ahaUnit()); hsrui.pullEvents(); for (let i = 0; i < 600 && !(hsrui.bt.cur && hsrui.bt.cur.t === 'rps'); i++) hsrui.update(0.05); hsrui.update(0.1); return hsrShots.shot(); })()",
  elhelp: "(() => { const g = hsrShots.fresh('j_plains', ['kazuma', 'march', 'danheng', 'himeko']); delete g.state.flags.seen_elation; g.startBattle({ enemies: ['reaver:20', 'flamespawn:20', 'eliminator:20'], lvl: 20, bg: 'snow', music: 'battle' }); hsrui.drainGameEvents(); hsrui.bt.auto = false; for (let i = 0; i < 300 && !hsrui.bt.elHelp; i++) hsrui.update(0.1); hsrui.bt.elHelp.page = " + (+(process.env.HP || 0)) + "; return hsrShots.shot(); })()",
  eltraces: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march', 'danheng', 'himeko']); g.debugChar('kazuma', 80, 6); g.fillTraces('kazuma', 'cap'); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; hsrShots.pump(2); return hsrShots.shot(); })()",
  elskills: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march', 'danheng', 'himeko']); g.debugChar('kazuma', 80, 6); g.fillTraces('kazuma', 'cap'); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  eleid: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march', 'danheng', 'himeko']); g.debugChar('kazuma', 80, 6); g.fillTraces('kazuma', 'cap'); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 4; s.star = 5; s.starFocus = true; hsrShots.pump(2); return hsrShots.shot(); })()",
  eldetails: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march', 'danheng', 'himeko']); g.debugChar('kazuma', 80, 6); g.fillTraces('kazuma', 'cap'); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  elcutkazuma: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march']); hsrui.debugState = null; hsrui.openDebug(); const st = hsrui.debugState; st.aha = { i: 0, p: 2 }; const scr = hsrui.openDebugAha(st, false); scr.show.t = scr.show.T = " + (+(process.env.CT || 1.1)) + "; return hsrShots.shot(); })()",
  elcutlaugh: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march']); hsrui.debugState = null; hsrui.openDebug(); const st = hsrui.debugState; st.aha = { i: 1, p: 2 }; const scr = hsrui.openDebugAha(st, false); scr.show.t = scr.show.T = " + (+(process.env.CT || 0.7)) + "; return hsrShots.shot(); })()",
  eldebug: "(() => { const g = hsrShots.fresh('express', ['kazuma', 'march']); hsrui.debugState = null; hsrui.openDebug(); hsrui.top().setTab(5); hsrShots.pump(2); return hsrShots.shot(); })()",
  elcone: "hsrShots.coneArt(['goodluck', 'sneering', 'chunchunmaru'])",
  elmail: "(() => { const g = hsrShots.fresh('express'); g.state.mail = {}; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(g.mailbox().findIndex(x => x.m.id === 'v16_elation')); hsrShots.pump(2); return hsrShots.shot(); })()",
  elsign: "(() => { const g = hsrShots.fresh('express'); Hsr98.CHARS.__elation = Object.assign({}, Hsr98.CHARS.kazuma, { path: 'elation' }); const WI = Hsr98.WarpIntro, ts = [0.25, 0.6, 0.95, 1.12, 1.26], [cv, c] = hsrShots.sheetCanvas(ts.length * 330 + 10, 210); ts.forEach((t, i) => { const f = WI.render(g, { id: '__elation', rar: 4, kind: 'char' }, t, false); c.imageSmoothingEnabled = false; c.drawImage(f, 10 + i * 330, 5); }); delete Hsr98.CHARS.__elation; return hsrShots.sheetOut(cv); })()",
  elcalyx: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 3; s.focus = 'rows'; s.row = 8; hsrShots.pump(2); return hsrShots.shot(); })()",
  foesheet: "hsrShots.itemSheet('foe')",
  echosheet: "hsrShots.itemSheet('echo')",
  synmatsheet: "hsrShots.itemSheet('syn')",
  foodsheet: "hsrShots.itemSheet('food')",
  foodsheetg: "hsrShots.itemSheet('food', true)",
  expsheet: "hsrShots.itemSheet('exp')",
  iconcheck: 'hsrShots.iconCheck()',
  shoprecipe: "(() => { hsrShots.fresh('u_boulder'); hsrui.openShop('boulder', () => {}); const s = hsrui.top(); s.sel = Math.max(0, hsrui.game.shopList('boulder').findIndex(e => /^rcp_/.test(e.id))); hsrShots.pump(2); return hsrShots.shot(); })()",
  invplanar: "(() => { hsrShots.fresh('express'); hsrui.game.give({ ornament: [{ set: 'station', rl: 12 }, { set: 'vonwacq', rl: 6 }, { set: 'salsotto', rl: 9 }] }); hsrui.openMenu(); hsrui.openInventory(5); const rel = hsrui.invEntries(5).findIndex(e => e.rel && e.rel.slot === 'sphere'); hsrui.top().sel = Math.max(0, rel); hsrShots.pump(2); return hsrShots.shot(); })()",
  skills: "hsrShots.chars('himeko', 3)",
  eidolon: "hsrShots.chars('march', 4)",
  eidolon2: "hsrShots.chars('march', 4, 1)",
  eidolon4: "hsrShots.chars('ruanmei', 4, 3)",
  eidolon6: "hsrShots.chars('gepard', 4, 5)",
  cones: "hsrShots.cones('trail')",
  relics: "hsrShots.relics('march')",
  newname: 'hsrShots.newName()',
  saves: "hsrShots.saves()",
  settings: "(() => { hsrShots.fresh('express'); hsrui.openSettings(); hsrui.top().sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  charstrip: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 20, 0); hsrui.openMenu(); hsrui.openChars('natasha'); hsrShots.pump(2); return hsrShots.shot(); })()",
  charstripend: "(() => { const g = hsrShots.fresh('express'); for (const k of Object.keys(Hsr98.CHARS)) if (k !== 'trail_p' && !g.state.roster[k]) g.debugChar(k, 20, 0); hsrui.openMenu(); const list = hsrui.rosterKeys(); hsrui.openChars(list[list.length - 1]); hsrShots.pump(2); return hsrShots.shot(); })()",
  charstripfew: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openChars('march'); hsrShots.pump(2); return hsrShots.shot(); })()",
  loads: "(() => { hsrShots.fresh('express'); hsrui.writeSave(1); hsrui.openSaves('load'); hsrShots.pump(2); return hsrShots.shot(); })()",
  calyx: 'hsrShots.calyx()',
  rumors: 'hsrShots.rumors()',
  warp: 'hsrShots.warp()',
  warpres: 'hsrShots.warpResult()',
  warphist: 'hsrShots.warpHistory(0, 0)',
  warphist5: 'hsrShots.warpHistory(2, 0)',
  warphistp: 'hsrShots.warpHistory(0, 4)',
  warphist0: 'hsrShots.warpHistory(0, 0, true)',
  archwarp: 'hsrShots.archiveWarp()',
  archstory: 'hsrShots.archiveStory()',
  skipping: "hsrShots.skipping('dawn_summit')",
  shop: "hsrShots.shop('boulder')",
  battle: "hsrShots.battle(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'])",
  battle2: "hsrShots.battle(['soldier:20', 'gunner:20'], 'snow', ['seele', 'bronya', 'gepard', 'natasha'])",
  battleruan: "hsrShots.battle(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'express', ['ruanmei', 'march', 'himeko', 'seele'])",
  battlenew: "hsrShots.battle(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'under', ['clara', 'yanqing', 'bailu', 'march'])",
  charbailu: "hsrShots.chars('bailu', 0)",
  charyanqing: "hsrShots.chars('yanqing', 0)",
  charclara: "hsrShots.chars('clara', 0)",
  skillsclara: "hsrShots.chars('clara', 3)",
  skillsyanqing: "hsrShots.chars('yanqing', 3)",
  skillsbailu: "hsrShots.chars('bailu', 3)",
  battlepick: "hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], 'E')",
  battleboard: "hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20', 'reaver:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], '  E  E  >')",
  battleheal: "hsrShots.battlePlay(['soldier:20', 'gunner:20'], 'snow', ['bailu', 'march', 'natasha', 'seele'], " + JSON.stringify(process.env.KEYS || 'E') + ")",
  bosspick: "hsrShots.battlePlay(['cocolia1:29', 'iceedge:27'], 'hill', ['trail', 'march', 'serval', 'natasha'], ' ', true)",
  bdbutton: "hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], '')",
  bdpending: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); hsrui.bt.auto = true; hsrShots.pump(3); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(2); return hsrShots.shot(); })()",
  bdfoe: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const b = hsrui.game.battle, e = b.enemies[0]; e.buffs.push({ s: 'defDown', v: 0.2, turns: 2, name: 'Пробивание брони', debuff: true }); e.dots.push({ type: 'burn', dmg: 312, turns: 2, src: b.allies[0], stacks: 1 }); e.charging = 1; hsrui.bt.target = e; hsrui.battleKey(null, 'KeyC'); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdally: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const b = hsrui.game.battle, a = b.allies[1]; a.shield = 474; a.shieldT = 3; a.buffs.push({ s: 'atkP', v: 0.24, turns: 2, name: 'Подбадривание' }, { s: 'spdP', v: 0.1, turns: 99, name: 'Попутный ветер' }); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdempty: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); hsrui.bt.target = hsrui.game.battle.enemies[1]; hsrui.battleKey(null, 'KeyC'); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdlong: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const b = hsrui.game.battle, a = b.allies[2]; a.shield = 260; a.shieldT = 2; a.taunt = 2; a.buffs.push({ s: 'atkP', v: 0.24, turns: 2, name: 'Подбадривание' }, { s: 'critD', v: 0.3, turns: 3, name: 'Блаженный дождь: крит. урон' }, { s: 'dmgP', v: 0.4, turns: 3, name: 'Адский пейзаж' }, { s: 'hotMark', v: 0, turns: 2, name: 'Регенерация', hot: 115 }, { s: 'critR', v: 0.4, turns: 2, name: 'Тест условия', cond: 'hp80' }, { s: 'spdP', v: -0.15, turns: 2, name: 'Цепи', debuff: true }); a.hp = Math.round(a.maxHp * 0.6); a.dots.push({ type: 'burn', dmg: 155, turns: 2, src: b.enemies[0], stacks: 1 }); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdallystats: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const b = hsrui.game.battle, a = b.allies[1]; a.buffs.push({ s: 'atkP', v: 0.24, turns: 2, name: 'Подбадривание' }, { s: 'critR', v: 0.15, turns: 2, name: 'Колесница' }, { s: 'spd', v: 12, turns: 2, name: 'Указ' }); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrShots.pump(2); hsrui.handleKey('ok', 'Enter', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdallymain: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const b = hsrui.game.battle, a = b.allies[1]; a.shield = 474; a.shieldT = 3; a.buffs.push({ s: 'atkP', v: 0.24, turns: 2, name: 'Подбадривание' }, { s: 'critR', v: 0.15, turns: 2, name: 'Колесница' }, { s: 'spd', v: 12, turns: 2, name: 'Указ' }); a.energy = 70; hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdboss: "(() => { hsrShots.battlePlay(['cocolia1:29', 'iceedge:27'], 'hill', ['trail', 'march', 'serval', 'natasha'], '', true); const b = hsrui.game.battle; hsrui.bt.target = b.enemies.find(u => u.data.boss); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdcontact: "(() => { hsrShots.battlePlay(['reaver:20', 'trotter:20'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); const g = hsrui.game, b = g.battle, e = b.enemies[0]; e.mood.eager = 2; e.mood.angry = 1; g.state.bank.enemies[e.id].contacts = { eager: 1, angry: 2 }; hsrui.bt.target = e; hsrui.battleKey(null, 'KeyC'); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdskills: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'himeko', 'arlan'], ''); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey(null, 'KeyE', {}); hsrui.handleKey('down', 'ArrowDown', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdskillsenh: "(() => { const g = hsrShots.fresh('j_plains', ['darkness', 'march', 'himeko', 'arlan']); g.state.flags.seen_elation = true; hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['darkness', 'march', 'himeko', 'arlan'], ''); const b = hsrui.game.battle, dk = b.allies.find(u => u.charId === 'darkness'); dk.flags.ecstasy = 6; hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.bt.bd.pick.ally = dk; hsrui.top().choose(dk); hsrui.handleKey(null, 'KeyE', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdfoeskills: "(() => { hsrShots.battlePlay(['reaver:20', 'direwolf:20'], 'station', ['trail', 'march', 'himeko', 'arlan'], ''); const b = hsrui.game.battle; hsrui.bt.target = b.enemies.find(u => u.id === 'direwolf'); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'KeyE', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdfoecharge: "(() => { hsrShots.battlePlay(['cocolia1:29', 'iceedge:27'], 'hill', ['trail', 'march', 'serval', 'natasha'], '', true); const b = hsrui.game.battle, e = b.enemies.find(u => u.data.boss); e.charging = 3; hsrui.bt.target = e; hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'KeyE', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdcone: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'himeko', 'arlan'], ''); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey(null, 'KeyQ', {}); hsrShots.pump(12); return hsrShots.shot(); })()",
  bdconeoff: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['trail', 'march', 'himeko', 'arlan'], ''); const g = hsrui.game, cn = g.state.inv.cones.find(x => x.id === 'collapsing'); g.equipCone('march', cn.uid); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('right', 'ArrowRight', {}); hsrui.handleKey(null, 'KeyQ', {}); hsrShots.pump(12); return hsrShots.shot(); })()",
  bdlore: "(() => { hsrShots.battlePlay(['antibaryon:20', 'reaver:20'], 'station', ['trail', 'march', 'himeko', 'arlan'], ''); hsrui.bt.target = hsrui.game.battle.enemies.find(u => u.id === 'antibaryon'); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'KeyQ', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdsummon: "(() => { hsrShots.battlePlay(['reaver:20', 'flamespawn:20'], 'station', ['jingyuan', 'march', 'himeko', 'arlan'], ''); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey('left', 'ArrowLeft', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdks: "(() => { hsrShots.battlePlay(['ks_toad:40', 'ks_toad_gold:40'], 'meadow', ['trail', 'aqua', 'megumin', 'darkness'], ''); hsrui.battleKey(null, 'KeyC'); hsrui.handleKey(null, 'KeyQ', {}); hsrShots.pump(3); return hsrShots.shot(); })()",
  bdpf: "(() => { " + PF_SETUP + "g.pfBegin(1); g.pfFight(12345); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(110); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(200); return hsrShots.shot(); })()",
  bdfh: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 3; n++) g.fh().st[n] = { clear: true, stars: [true, true, true], best: 14 }; g.fhBegin(4); g.fhFight(); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(60); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(200); return hsrShots.shot(); })()",
  bdsu: "(() => { hsrShots.suBattle(0); hsrui.bt.auto = false; hsrShots.pump(60); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(200); return hsrShots.shot(); })()",
  bdcw: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); const r = hsrShots.cwSetup(g); r.node = 3; g.cwFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; hsrShots.pump(60); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(400); hsrui.handleKey(null, 'Tab', {}); hsrui.handleKey(null, 'KeyQ', {}); hsrShots.pump(2); return hsrShots.shot(); })()",
  bdrange: "(() => { const g = hsrShots.fresh('express_lab', ['trail']); for (const k of ['seele', 'bronya', 'natasha', 'gepard']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0); g.state.squads = []; g.state.squads[3] = ['seele', 'bronya', 'natasha', 'gepard']; g.state.range = { team: { squad: 3 }, waves: [[{ id: 'doomsday', lvl: 40, hp: 2, immortal: true, weak: ['wind', 'imag'], resist: ['ice'], hpStart: 50 }, { id: 'reaver', lvl: 38 }]], cond: { cine: 'off' } }; g.rangeFight(7); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(60); hsrui.battleKey(null, 'KeyC'); hsrShots.pump(200); return hsrShots.shot(); })()",
  bdlongname: "(() => { hsrShots.battlePlay(['dragonfish:40', 'cloudtoad:40'], 'station', ['trail', 'march', 'arlan', 'himeko'], ''); hsrui.bt.target = hsrui.game.battle.enemies[0]; hsrui.battleKey(null, 'KeyC'); hsrShots.pump(3); return hsrShots.shot(); })()",
  boss: "hsrShots.battle(['cocolia1:29', 'iceedge:27'], 'hill', ['trail', 'march', 'serval', 'natasha'], true)",
  anchor: 'hsrShots.anchor()',
  choice: 'hsrShots.choice()',
  tut: 'hsrShots.tut()',
  warp1: 'hsrShots.warpOne()',
  defeat: 'hsrShots.defeat()',
  pompom: "hsrShots.dialog('pompom_talk', 50)",
  opening: 'hsrShots.opening()',
  contact: "hsrShots.battleCmd(['soldier:20', 'gunner:20'], 'city', ['trail', 'march', 'arlan', 'himeko'])",
  ult: "hsrShots.battleUlt(['reaver:20', 'eliminator:20'], 'station', ['trail', 'march', 'arlan', 'himeko'])",
  result: "hsrShots.result()",
  sprites: 'hsrShots.sprites()',
  portraits: 'hsrShots.portraits()',
  busts: 'hsrShots.busts(0)',
  busts2: 'hsrShots.busts(1)',
  figures: 'hsrShots.figures(0)',
  figures2: 'hsrShots.figures(1)',
  icons: 'hsrShots.icons()',
  maticons: 'hsrShots.matIcons()',
  profilerec: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fh_met: true, su_open: true, lab_cw: true, lab_hd: true, su_clear_1: true, first_doomsday: true }); g.state.warpN = 412; hsrui.openMenu(); const s = hsrui.openProfile(); s.setTab(0); hsrShots.pump(2); return hsrShots.shot(); })()",
  profilecoll: "(() => { const g = hsrShots.fresh('express'); ['himeko', 'welt', 'bronya', 'seele', 'clara'].forEach(k => g.addChar(k, 40)); hsrui.openMenu(); const s = hsrui.openProfile(); s.setTab(2); hsrShots.pump(2); return hsrShots.shot(); })()",
  profilelog: "(() => { const g = hsrShots.fresh('express'); const now = g.now(), day = 86400000; const p = g.profile(); p.log = [{ at: now, kind: 'cw', id: 'A1' }, { at: now - day, kind: 'su', id: 1 }, { at: now - 3 * day, kind: 'boss', id: 'doomsday' }, { at: now - 9 * day, kind: 'char', id: 'bronya' }, { at: now - 12 * day, kind: 'char', id: 'himeko' }, { at: now - 20 * day, kind: 'char', id: 'welt' }, { at: now - 25 * day, kind: 'char', id: 'seele' }]; hsrui.openMenu(); hsrui.openProfile(); hsrShots.pump(2); return hsrShots.shot(); })()",
  profile: "(() => { const g = hsrShots.fresh('express'); ['himeko', 'welt', 'bronya', 'seele', 'clara'].forEach(k => g.addChar(k, 40)); hsrui.openMenu(); hsrui.openProfile(); hsrShots.pump(2); return hsrShots.shot(); })()",
  profilefull: "(() => { const g = hsrShots.fresh('express'); ['himeko', 'welt', 'bronya', 'seele', 'clara'].forEach(k => g.addChar(k, 40)); g.setProfileSign('Еду туда, куда ведут рельсы, и не жалею.'); g.setProfileBday(14, 3); g.setProfileStage('himeko'); g.setProfileAvatar('himeko'); g.setProfileSlot('comp', 4, null); hsrui.openMenu(); const s = hsrui.openProfile(); s.sel = 12; hsrShots.pump(2); return hsrShots.shot(); })()",
  profilepick: "(() => { const g = hsrShots.fresh('express'); ['himeko', 'welt', 'bronya', 'seele', 'clara'].forEach(k => g.addChar(k, 40)); hsrui.openMenu(); const s = hsrui.openProfile(); s.sel = 4; s.act(); hsrShots.pump(2); return hsrShots.shot(); })()",
  profilesign: "(() => { const g = hsrShots.fresh('express'); hsrui.openMenu(); const p = hsrui.openProfile(); p.sel = 3; p.act(); hsrui.top().value = 'Еду туда, куда ведут'; hsrShots.pump(2); return hsrShots.shot(); })()",
  profilename: "(() => { const g = hsrShots.fresh('express'); hsrui.openMenu(); const p = hsrui.openProfile(); p.sel = 1; p.act(); hsrui.top().page = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  profilebday: "(() => { const g = hsrShots.fresh('express'); g.setProfileBday(14, 3); hsrui.openMenu(); const p = hsrui.openProfile(); p.sel = 2; p.act(); hsrShots.pump(2); return hsrShots.shot(); })()",
  promo: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openPromo(); hsrShots.pump(2); return hsrShots.shot(); })()",
  promotype: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); const s = hsrui.openPromo(); s.value = 'POMPOM'; s.sel = 15; hsrShots.pump(2); return hsrShots.shot(); })()",
  promook: "(() => { const g = hsrShots.fresh('express'); g.redeemPromo('STARRAILGIFT'); hsrui.openMenu(); const s = hsrui.openPromo(); s.value = 'POMPOM98'; s.submit(); hsrShots.pump(2); return hsrShots.shot(); })()",
  promobad: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); const s = hsrui.openPromo(); s.value = 'NOSUCHCODE'; s.submit(); hsrShots.pump(2); return hsrShots.shot(); })()",
  promomail: "(() => { const g = hsrShots.fresh('express'); g.redeemPromo('POMPOM98'); g.state.mail.promo_POMPOM98.at = g.now() + 1000; hsrui.openMail(); hsrShots.pump(2); return hsrShots.shot(); })()",
  skins: "(() => { const g = hsrShots.fresh('express'); const scr = hsrui.openPhoneDecor(); scr.sel = 1; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  skinsprev: "(() => { const g = hsrShots.fresh('express'); g.state.phoneSkins = ['nexttoyou']; g.setPhoneSkin('nexttoyou'); const scr = hsrui.openPhoneDecor(); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  phoneskin: "(() => { const g = hsrShots.fresh('express'); g.state.phoneSkins = ['nexttoyou']; g.setPhoneSkin('nexttoyou'); hsrui.openMenu(); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  wardrobe: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring', 'himeko_vermilion', 'welt_idol']; g.addChar('himeko', 40); g.addChar('welt', 40); g.wearOutfit('march', 'march_spring'); g.state.jade = 2000; hsrui.openWardrobe(); hsrShots.pump(2); return new Promise(r => setTimeout(r, 300)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  wardrobe5: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring', 'himeko_vermilion', 'welt_idol']; g.addChar('himeko', 40); g.addChar('welt', 40); g.wearOutfit('march', 'march_spring'); g.state.jade = 2000; const s = hsrui.openWardrobe(); s.sel = 1; hsrShots.pump(2); return new Promise(r => setTimeout(r, 300)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  wardrobemine: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring', 'himeko_vermilion', 'welt_idol']; g.addChar('himeko', 40); g.addChar('welt', 40); g.wearOutfit('march', 'march_spring'); g.state.jade = 2000; const s = hsrui.openWardrobe(); s.setMine(true); hsrShots.pump(2); return new Promise(r => setTimeout(r, 300)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  wardrobelock: "(() => { const g = hsrShots.fresh('express'); g.state.outfits = ['march_spring', 'himeko_vermilion', 'welt_idol']; g.addChar('himeko', 40); g.addChar('welt', 40); g.wearOutfit('march', 'march_spring'); g.state.jade = 2000; const s = hsrui.openWardrobe(); s.sel = 5; hsrShots.pump(2); return new Promise(r => setTimeout(r, 300)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coatroom: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; hsrui.openCoatroom(); hsrShots.pump(4); return hsrShots.shot(); })()",
  coatroompick: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; const s = hsrui.openCoatroom(); s.key('right'); hsrShots.pump(16); return hsrShots.shot(); })()",
  coatroomspin: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; const s = hsrui.openCoatroom(); s.key('right'); hsrShots.pump(+(window.PT || 3)); return hsrShots.shot(); })()",
  coatroomwear: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; const s = hsrui.openCoatroom(); s.key('right'); hsrShots.pump(16); s.key('ok'); hsrShots.pump(+(window.PT || 24)); return hsrShots.shot(); })()",
  coatroomlock: "(() => { const g = hsrShots.fresh('express_party'); const s = hsrui.openCoatroom(); s.key('right'); hsrShots.pump(16); return hsrShots.shot(); })()",
  coatroomscenes: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; g.pomWear('pajamas'); const s = hsrui.openCoatroom(); s.key('down'); s.key('ok'); hsrShots.pump(4); return hsrShots.shot(); })()",
  coatquest: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; g.placePlayer(6, 5); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  coatquestdlg: "(() => { const g = hsrShots.fresh('express_party'); g.pomGive('pajamas'); g.events.length = 0; hsrui.toasts = []; hsrui.drainGameEvents(); hsrui.toasts = []; hsrui.banner = null; g.placePlayer(6, 4); g.player.dir = 'up'; g.runScript('pom_coat_talk'); hsrShots.pump(40); return hsrShots.shot(); })()",
  pomfieldpj: "(() => { const g = hsrShots.fresh('express'); g.pomGive('pajamas'); g.pomWear('pajamas'); g.state.quests.pom_coat = 'done'; g.events.length = 0; hsrui.drainGameEvents(); hsrui.toasts = []; const p = g.map.ents.find(e => e.ch === 'p'); g.placePlayer(p.x, p.y + 2); hsrShots.pump(30); return hsrShots.shot(); })()",
  pomtalkpj: "(() => { const g = hsrShots.fresh('express'); g.pomGive('pajamas'); g.pomWear('pajamas'); g.state.quests.pom_coat = 'done'; g.events.length = 0; hsrui.drainGameEvents(); hsrui.toasts = []; g.runScript('pompom_talk'); hsrShots.pump(40); return hsrShots.shot(); })()",
  mailcoat: "(() => { const g = hsrShots.fresh('express'); g.state.mail = {}; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(g.mailbox().findIndex(x => x.m.id === 'v18_coatroom')); hsrShots.pump(2); return hsrShots.shot(); })()",
  cinepomoff: "(() => { const g = hsrShots.fresh('express'); g.pomGive('pajamas'); g.pomWear('pajamas'); g.pomSetScenes(false); const p = new Hsr98.Cine.Player(hsrui, 'c_jump'); p.i = 0; p.t = 1.4; p.T = 1.4; p.draw(hsrui.ctx); return hsrui.canvas.toDataURL('image/png'); })()",
  cinepomon: "(() => { const g = hsrShots.fresh('express'); g.pomGive('pajamas'); g.pomWear('pajamas'); g.pomSetScenes(true); const p = new Hsr98.Cine.Player(hsrui, 'c_jump'); p.i = 0; p.t = 1.4; p.T = 1.4; p.draw(hsrui.ctx); return hsrui.canvas.toDataURL('image/png'); })()",
  pomsheet: "(() => { const G = Hsr98.Gfx, c = hsrui.ctx; c.imageSmoothingEnabled = false; c.fillStyle = '#3a3f5c'; c.fillRect(0, 0, 640, 480); ['uniform', 'pajamas'].forEach((id, i) => { const L = Hsr98.pomOutfitLook(id), x = 8 + i * 318; c.drawImage(G.bustCanvas(L, 64), x, 4, 192, 192); c.drawImage(G.figureCanvas(L), x + 196, 4, 96, 192); ['down', 'left', 'right', 'up'].forEach((d, j) => { const sc = G.spriteCanvas(L, d, 0); c.drawImage(sc, x + j * 76, 206, sc.width * 3, sc.height * 3); }); [['down', 1], ['down', 3], ['right', 1], ['right', 3]].forEach(([d, f], j) => { const sc = G.spriteCanvas(L, d, f); c.drawImage(sc, x + j * 76, 300, sc.width * 3, sc.height * 3); }); c.drawImage(G.bustCanvas(L, 40), x, 404, 40, 40); c.drawImage(G.bustCanvas(L, 84), x + 48, 394, 84, 84); c.drawImage(G.figureCanvas(L), x + 140, 384, 48, 96); const sc = G.spriteCanvas(L, 'down', 0); c.drawImage(sc, x + 200, 430, sc.width, sc.height); }); return hsrui.canvas.toDataURL('image/png'); })()",
  phonemenu: "(() => { hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openPhoneMenu(); hsrShots.pump(2); return hsrShots.shot(); })()",
  conesup: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; g.setConeSup('manual'); const cn = g.addCone('postop'); cn.lvl = 25; cn.asc = 1; const d1 = g.addCone('postop'); d1.lvl = 40; d1.asc = 3; const d2 = g.addCone('postop'); d2.sup = 2; const d3 = g.addCone('postop'); d3.sup = 4; g.state.inv.items.aether2 = 12; const s = hsrui.openConeUp(cn.uid); s.tab = 2; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  conesupdlg: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; g.setConeSup('manual'); const cn = g.addCone('postop'); cn.lvl = 25; cn.asc = 1; const d1 = g.addCone('postop'); d1.lvl = 40; d1.asc = 3; const d2 = g.addCone('postop'); d2.sup = 2; const d3 = g.addCone('postop'); d3.sup = 4; g.state.inv.items.aether2 = 12; const s = hsrui.openConeUp(cn.uid); s.tab = 2; hsrui.openConeMerge(cn, d1); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  conefeed: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; g.setConeSup('manual'); const cn = g.addCone('postop'); cn.lvl = 25; cn.asc = 1; const d1 = g.addCone('postop'); d1.lvl = 40; d1.asc = 3; const d2 = g.addCone('postop'); d2.sup = 2; const d3 = g.addCone('postop'); d3.sup = 4; g.state.inv.items.aether2 = 12; const s = hsrui.openConeUp(cn.uid); s.feed = [d2.uid]; hsrui.openConeFeed(s, cn); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  conefeedslot: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; g.setConeSup('manual'); const cn = g.addCone('postop'); cn.lvl = 25; cn.asc = 1; const d1 = g.addCone('postop'); d1.lvl = 40; d1.asc = 3; const d2 = g.addCone('postop'); d2.sup = 2; const d3 = g.addCone('postop'); d3.sup = 4; g.state.inv.items.aether2 = 12; const s = hsrui.openConeUp(cn.uid); s.feed = [d2.uid]; s.picks = { aether2: 3 }; s.slot = 1; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  settingsup: "(() => { hsrShots.fresh('express'); hsrui.openSettings(); hsrui.top().sel = 8; hsrShots.pump(2); return hsrShots.shot(); })()",
  coneup: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.lvl = 25; cn.asc = 1; Object.assign(g.state.inv.items, { aether1: 40, aether2: 12, aether3: 4 }); const s = hsrui.openConeUp(cn.uid, { only: true }); s.picks = { aether3: 2, aether1: 3 }; s.slot = 2; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneasc: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.lvl = 30; cn.asc = 1; Object.assign(g.state.inv.items, { core1: 93, abund1: 3782 }); hsrui.openConeUp(cn.uid, { only: true }); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  conequick: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.lvl = 30; cn.asc = 1; g.setUpQuick('cone', true); Object.assign(g.state.inv.items, { aether3: 1278, core1: 10, abund1: 3, core2: 15, abund2: 9, core3: 12, abund3: 12 }); hsrui.openConeUp(cn.uid, { only: true }); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneshort: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.lvl = 30; cn.asc = 1; g.setUpQuick('cone', true); Object.assign(g.state.inv.items, { aether3: 111, core1: 10 }); const s = hsrui.openConeUp(cn.uid, { only: true }); s.target = 80; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  conesuptab: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.sup = 3; const s = hsrui.openConeUp(cn.uid, { only: true }); s.tab = 2; hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneres: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.state.credits = 900000; const cn = g.addCone('postop'); cn.lvl = 30; cn.asc = 1; Object.assign(g.state.inv.items, { core1: 93, abund1: 3782 }); const s = hsrui.openConeUp(cn.uid, { only: true }); s.act(); hsrShots.pump(16); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  aether_icons: "(() => { const c = hsrui.ctx, G = Hsr98.Gfx; hsrShots.fresh('express'); c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480); ['aether1', 'aether2', 'aether3'].forEach((id, i) => { G.rarityCell(c, 10 + i * 210, 10, 200, 200, Hsr98.ITEMS[id].rar); G.itemIcon(c, id, 20 + i * 210, 20, 180); G.itemIcon(c, id, 10 + i * 210, 220, 32); G.itemIcon(c, id, 50 + i * 210, 220, 18); }); return hsrui.canvas.toDataURL('image/png'); })()",
  aether_domain: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fled = true; g.state.power = 300; hsrui.openDomain('cx_aether', () => {}); hsrShots.pump(2); return hsrShots.shot(); })()",
  aether_inv: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.inv.items, { exp1: 3, exp2: 2, aether1: 12, aether2: 5, aether3: 2 }); hsrui.openInventory(1); const s = hsrui.top(); s.sel = hsrui.invEntries(1).findIndex(e => e.id === 'aether3'); hsrShots.pump(2); return hsrShots.shot(); })()",
  aether_supply: "(() => { const g = hsrShots.fresh('express'); g.state.shop.intro = true; g.state.starlight = 200; hsrui.openSupply('shop'); hsrShots.pump(2); return hsrShots.shot(); })()",
  conepick: "(() => { const g = hsrShots.fresh('express'); g.debugChar('seele', 60, 0); const c1 = g.addCone('night'); c1.lvl = 30; c1.asc = 2; c1.sup = 2; const c2 = g.addCone('arrows'); c2.lvl = 80; c2.asc = 6; const c3 = g.addCone('postop'); g.equipCone('seele', c1.uid); hsrui.openConePick('seele'); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneinv: "(() => { const g = hsrShots.fresh('express'); g.debugChar('seele', 60, 0); const c1 = g.addCone('night'); c1.lvl = 30; c1.asc = 2; c1.sup = 2; const c2 = g.addCone('arrows'); c2.lvl = 80; c2.asc = 6; const c3 = g.addCone('postop'); g.equipCone('seele', c1.uid); hsrui.openInventory(4); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneview: "(() => { const g = hsrShots.fresh('express'); g.debugChar('seele', 60, 0); const c1 = g.addCone('night'); c1.lvl = 30; c1.asc = 2; c1.sup = 2; const c2 = g.addCone('arrows'); c2.lvl = 80; c2.asc = 6; const c3 = g.addCone('postop'); g.equipCone('seele', c1.uid); hsrui.openConeView(c1.id, c1.uid); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  coneviewnone: "(() => { const g = hsrShots.fresh('express'); hsrui.openConeView('night'); hsrShots.pump(16); return hsrShots.shot(); })()",
  conedetails: "(() => { const g = hsrShots.fresh('express'); g.debugChar('seele', 60, 0); const c1 = g.addCone('night'); c1.lvl = 30; c1.asc = 2; c1.sup = 2; const c2 = g.addCone('arrows'); c2.lvl = 80; c2.asc = 6; const c3 = g.addCone('postop'); g.equipCone('seele', c1.uid); hsrui.openChars('seele'); hsrShots.pump(2); return new Promise(r => setTimeout(r, 500)).then(() => { hsrShots.pump(2); return hsrShots.shot(); }); })()",
  lvlupq: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.debugChar('hanya', 60, 0); g.state.credits = 200000; g.setUpQuick('hero', true); Object.assign(g.state.inv.items, { exp1: 224, exp2: 80, exp3: 2346 }); const s = hsrui.openLevelUp('hanya'); s.target = 70; hsrShots.pump(2); return hsrShots.shot(); })()",
  lvlupqasc: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.debugChar('hanya', 30, 0, 1); g.state.credits = 900000; g.setUpQuick('hero', true); Object.assign(g.state.inv.items, { exp3: 900, artifex1: 8, artifex2: 13, artifex3: 12, asc_perdition: 30 }); const s = hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  lvlupqshort: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(65); g.debugChar('hanya', 30, 0, 1); g.state.credits = 90000; g.setUpQuick('hero', true); Object.assign(g.state.inv.items, { exp3: 12, artifex1: 3 }); const s = hsrui.openLevelUp('hanya'); s.target = 80; hsrShots.pump(2); return hsrShots.shot(); })()",
  ascend: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; Object.assign(g.state.inv.items, { artifex2: 6, asc_perdition: 4 }); hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ascendmiss: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; g.state.inv.items.artifex2 = 2; hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ascendsynth: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; Object.assign(g.state.inv.items, { artifex1: 30, asc_perdition: 4 }); hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ascendtl: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; g.setTrailLevel(12); Object.assign(g.state.inv.items, { artifex2: 6, asc_perdition: 4 }); hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ascendres: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; Object.assign(g.state.inv.items, { artifex2: 6, asc_perdition: 4 }); const s = hsrui.openLevelUp('hanya'); s.act(); hsrShots.pump(16); return hsrShots.shot(); })()",
  ascendsrc: "(() => { const g = hsrShots.fresh('express'); g.setTrailLevel(45); g.debugChar('hanya', 40, 0, 2); g.state.credits = 200000; g.state.inv.items.artifex2 = 2; const s = hsrui.openLevelUp('hanya'); hsrui.upSource('hanya', 'asc_perdition'); hsrShots.pump(2); return hsrShots.shot(); })()",
  ascnote: "(() => { const g = hsrShots.fresh('express'); g.state.roster.march.lvl = 20; g.state.roster.march.asc = 0; delete g.state.flags.asc_note; hsrShots.pump(4); return hsrShots.shot(); })()",
  lvlup: "(() => { const g = hsrShots.fresh('express'); g.debugChar('hanya', 60, 0); g.state.credits = 200000; Object.assign(g.state.inv.items, { exp1: 224, exp2: 80, exp3: 2346 }); hsrui.openLevelUp('hanya'); hsrShots.pump(2); return hsrShots.shot(); })()",
  lvlupsel: "(() => { const g = hsrShots.fresh('express'); g.debugChar('hanya', 60, 0); g.state.credits = 200000; Object.assign(g.state.inv.items, { exp1: 224, exp2: 80, exp3: 2346 }); const s = hsrui.openLevelUp('hanya'); s.slot = 2; s.picks = { exp1: 207, exp2: 80, exp3: 36 }; hsrShots.pump(2); return hsrShots.shot(); })()",
  lvlupmax: "(() => { const g = hsrShots.fresh('express'); g.debugChar('seele', 80, 0); hsrui.openLevelUp('seele'); hsrShots.pump(2); return hsrShots.shot(); })()",
  lvlupbroke: "(() => { const g = hsrShots.fresh('express'); g.debugChar('himeko', 30, 0); g.state.credits = 0; g.state.inv.items.exp1 = 3; const s = hsrui.openLevelUp('himeko'); s.picks = { exp1: 3 }; hsrShots.pump(2); return hsrShots.shot(); })()",
  ascicons: 'hsrShots.ascIcons()',
  asc_domain: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, doom: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, ending: true }); g.state.power = 300; hsrui.openDomain('cx_mirage', () => {}); hsrShots.pump(2); return hsrShots.shot(); })()",
  asc_sim: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, doom: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, ending: true }); g.state.power = 300; hsrui.openCalyx(() => {}); const s = hsrui.top(); s.sel = g.calyxList().findIndex(x => x.c.id === 'cx_perdition'); hsrShots.pump(2); return hsrShots.shot(); })()",
  asc_index: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, doom: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, ending: true }); g.state.power = 300; g.addChar('hanya', 40); hsrui.openIpg('index'); const s = hsrui.top(); s.cat = +(process_cat); s.focus = 'rows'; hsrShots.pump(2); return hsrShots.shot(); })()".replace('process_cat', String(process.env.CAT || 4)),
  asc_tl: "(() => { const g = hsrShots.fresh('express'); g.state.flags.pc_rewards_done = true; g.setTrailLevel(31); hsrui.openTlRewards(); const s = hsrui.top(); s.sel = 28; hsrShots.pump(2); return hsrShots.shot(); })()",
  himekotraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.himeko) g.addChar('himeko', 40); g.state.roster.himeko.lvl = 40; g.fillTraces('himeko', 'cap'); hsrui.openMenu(); hsrui.openChars('himeko'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  himekoeid: "hsrShots.chars('himeko', 4, 5)",
  welttraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.welt) g.addChar('welt', 40); g.state.roster.welt.lvl = 40; g.fillTraces('welt', 'cap'); hsrui.openMenu(); hsrui.openChars('welt'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  welteid: "hsrShots.chars('welt', 4, 5)",
  hertatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.herta) g.addChar('herta', 40); g.state.roster.herta.lvl = 40; g.fillTraces('herta', 'cap'); hsrui.openMenu(); hsrui.openChars('herta'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  hertaeid: "hsrShots.chars('herta', 4, 5)",
  astatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.asta) g.addChar('asta', 40); g.state.roster.asta.lvl = 40; g.fillTraces('asta', 'cap'); hsrui.openMenu(); hsrui.openChars('asta'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  astaeid: "hsrShots.chars('asta', 4, 5)",
  arlantraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.arlan) g.addChar('arlan', 40); g.state.roster.arlan.lvl = 40; g.fillTraces('arlan', 'cap'); hsrui.openMenu(); hsrui.openChars('arlan'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  arlaneid: "hsrShots.chars('arlan', 4, 5)",
  trailptraces: "(() => { const g = hsrShots.fresh('express'); g.setPath('trail_p'); g.state.roster.trail.lvl = 40; g.fillTraces('trail', 'cap'); hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a6'; hsrShots.pump(2); return hsrShots.shot(); })()",
  trailpeid: "(() => { const g = hsrShots.fresh('express'); g.setPath('trail_p'); hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 4; s.star = 1; s.starFocus = true; hsrShots.pump(2); return hsrShots.shot(); })()",
  bronyatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.bronya) g.addChar('bronya', 40); g.state.roster.bronya.lvl = 40; g.fillTraces('bronya', 'cap'); hsrui.openMenu(); hsrui.openChars('bronya'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  bronyaeid: "hsrShots.chars('bronya', 4, 5)",
  seeletraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.seele) g.addChar('seele', 40); g.state.roster.seele.lvl = 40; g.fillTraces('seele', 'cap'); hsrui.openMenu(); hsrui.openChars('seele'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  seeleeid: "hsrShots.chars('seele', 4, 5)",
  gepardtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.gepard) g.addChar('gepard', 40); g.state.roster.gepard.lvl = 40; g.fillTraces('gepard', 'cap'); hsrui.openMenu(); hsrui.openChars('gepard'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  gepardeid: "hsrShots.chars('gepard', 4, 5)",
  claratraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.clara) g.addChar('clara', 40); g.state.roster.clara.lvl = 40; g.fillTraces('clara', 'cap'); hsrui.openMenu(); hsrui.openChars('clara'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  claraeid: "hsrShots.chars('clara', 4, 5)",
  yanqingtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yanqing) g.addChar('yanqing', 40); g.state.roster.yanqing.lvl = 40; g.fillTraces('yanqing', 'cap'); hsrui.openMenu(); hsrui.openChars('yanqing'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yanqingeid: "hsrShots.chars('yanqing', 4, 5)",
  bailutraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.bailu) g.addChar('bailu', 40); g.state.roster.bailu.lvl = 40; g.fillTraces('bailu', 'cap'); hsrui.openMenu(); hsrui.openChars('bailu'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  bailueid: "hsrShots.chars('bailu', 4, 5)",
  natashatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.natasha) g.addChar('natasha', 40); g.state.roster.natasha.lvl = 40; g.fillTraces('natasha', 'cap'); hsrui.openMenu(); hsrui.openChars('natasha'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  natashaeid: "hsrShots.chars('natasha', 4, 5)",
  servaltraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.serval) g.addChar('serval', 40); g.state.roster.serval.lvl = 40; g.fillTraces('serval', 'cap'); hsrui.openMenu(); hsrui.openChars('serval'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  servaleid: "hsrShots.chars('serval', 4, 5)",
  sampotraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.sampo) g.addChar('sampo', 40); g.state.roster.sampo.lvl = 40; g.fillTraces('sampo', 'cap'); hsrui.openMenu(); hsrui.openChars('sampo'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  sampoeid: "hsrShots.chars('sampo', 4, 5)",
  hooktraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.hook) g.addChar('hook', 40); g.state.roster.hook.lvl = 40; g.fillTraces('hook', 'cap'); hsrui.openMenu(); hsrui.openChars('hook'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  hookeid: "hsrShots.chars('hook', 4, 5)",
  pelatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.pela) g.addChar('pela', 40); g.state.roster.pela.lvl = 40; g.fillTraces('pela', 'cap'); hsrui.openMenu(); hsrui.openChars('pela'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  pelaeid: "hsrShots.chars('pela', 4, 5)",
  ruanmeitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.ruanmei) g.addChar('ruanmei', 40); g.state.roster.ruanmei.lvl = 40; g.fillTraces('ruanmei', 'cap'); hsrui.openMenu(); hsrui.openChars('ruanmei'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  ruanmeieid: "hsrShots.chars('ruanmei', 4, 5)",
  kafkatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.kafka) g.addChar('kafka', 40); g.state.roster.kafka.lvl = 40; g.fillTraces('kafka', 'cap'); hsrui.openMenu(); hsrui.openChars('kafka'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  kafkaeid: "hsrShots.chars('kafka', 4, 5)",
  silverwolftraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.silverwolf) g.addChar('silverwolf', 40); g.state.roster.silverwolf.lvl = 40; g.fillTraces('silverwolf', 'cap'); hsrui.openMenu(); hsrui.openChars('silverwolf'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  silverwolfeid: "hsrShots.chars('silverwolf', 4, 5)",
  bladetraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.blade) g.addChar('blade', 40); g.state.roster.blade.lvl = 40; g.fillTraces('blade', 'cap'); hsrui.openMenu(); hsrui.openChars('blade'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  bladeeid: "hsrShots.chars('blade', 4, 5)",
  lynxtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.lynx) g.addChar('lynx', 40); g.state.roster.lynx.lvl = 40; g.fillTraces('lynx', 'cap'); hsrui.openMenu(); hsrui.openChars('lynx'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  lynxeid: "hsrShots.chars('lynx', 4, 5)",
  lukatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.luka) g.addChar('luka', 40); g.state.roster.luka.lvl = 40; g.fillTraces('luka', 'cap'); hsrui.openMenu(); hsrui.openChars('luka'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  lukaeid: "hsrShots.chars('luka', 4, 5)",
  sushangtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.sushang) g.addChar('sushang', 40); g.state.roster.sushang.lvl = 40; g.fillTraces('sushang', 'cap'); hsrui.openMenu(); hsrui.openChars('sushang'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  sushangeid: "hsrShots.chars('sushang', 4, 5)",
  xueyitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.xueyi) g.addChar('xueyi', 40); g.state.roster.xueyi.lvl = 40; g.fillTraces('xueyi', 'cap'); hsrui.openMenu(); hsrui.openChars('xueyi'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  xueyieid: "hsrShots.chars('xueyi', 4, 5)",
  tingyuntraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.tingyun) g.addChar('tingyun', 40); g.state.roster.tingyun.lvl = 40; g.fillTraces('tingyun', 'cap'); hsrui.openMenu(); hsrui.openChars('tingyun'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  tingyuneid: "hsrShots.chars('tingyun', 4, 5)",
  hanyatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.hanya) g.addChar('hanya', 40); g.state.roster.hanya.lvl = 40; g.fillTraces('hanya', 'cap'); hsrui.openMenu(); hsrui.openChars('hanya'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  hanyaeid: "hsrShots.chars('hanya', 4, 5)",
  qingquetraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.qingque) g.addChar('qingque', 40); g.state.roster.qingque.lvl = 40; g.fillTraces('qingque', 'cap'); hsrui.openMenu(); hsrui.openChars('qingque'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  qingqueeid: "hsrShots.chars('qingque', 4, 5)",
  yukongtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yukong) g.addChar('yukong', 40); g.state.roster.yukong.lvl = 40; g.fillTraces('yukong', 'cap'); hsrui.openMenu(); hsrui.openChars('yukong'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yukongeid: "hsrShots.chars('yukong', 4, 5)",
  guinaifentraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.guinaifen) g.addChar('guinaifen', 40); g.state.roster.guinaifen.lvl = 40; g.fillTraces('guinaifen', 'cap'); hsrui.openMenu(); hsrui.openChars('guinaifen'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  guinaifeneid: "hsrShots.chars('guinaifen', 4, 5)",
  jingyuantraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.jingyuan) g.addChar('jingyuan', 40); g.state.roster.jingyuan.lvl = 40; g.fillTraces('jingyuan', 'cap'); hsrui.openMenu(); hsrui.openChars('jingyuan'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  jingyuaneid: "hsrShots.chars('jingyuan', 4, 5)",
  luochatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.luocha) g.addChar('luocha', 40); g.state.roster.luocha.lvl = 40; g.fillTraces('luocha', 'cap'); hsrui.openMenu(); hsrui.openChars('luocha'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  luochaeid: "hsrShots.chars('luocha', 4, 5)",
  imbibitortraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.imbibitor) g.addChar('imbibitor', 40); g.state.roster.imbibitor.lvl = 40; g.fillTraces('imbibitor', 'cap'); hsrui.openMenu(); hsrui.openChars('imbibitor'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  imbibitoreid: "hsrShots.chars('imbibitor', 4, 5)",
  fuxuantraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.fuxuan) g.addChar('fuxuan', 40); g.state.roster.fuxuan.lvl = 40; g.fillTraces('fuxuan', 'cap'); hsrui.openMenu(); hsrui.openChars('fuxuan'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  fuxuaneid: "hsrShots.chars('fuxuan', 4, 5)",
  jingliutraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.jingliu) g.addChar('jingliu', 40); g.state.roster.jingliu.lvl = 40; g.fillTraces('jingliu', 'cap'); hsrui.openMenu(); hsrui.openChars('jingliu'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  jingliueid: "hsrShots.chars('jingliu', 4, 5)",
  topaztraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.topaz) g.addChar('topaz', 40); g.state.roster.topaz.lvl = 40; g.fillTraces('topaz', 'cap'); hsrui.openMenu(); hsrui.openChars('topaz'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  topazeid: "hsrShots.chars('topaz', 4, 5)",
  huohuotraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.huohuo) g.addChar('huohuo', 40); g.state.roster.huohuo.lvl = 40; g.fillTraces('huohuo', 'cap'); hsrui.openMenu(); hsrui.openChars('huohuo'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  huohuoeid: "hsrShots.chars('huohuo', 4, 5)",
  argentitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.argenti) g.addChar('argenti', 40); g.state.roster.argenti.lvl = 40; g.fillTraces('argenti', 'cap'); hsrui.openMenu(); hsrui.openChars('argenti'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  argentieid: "hsrShots.chars('argenti', 4, 5)",
  ratiotraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.ratio) g.addChar('ratio', 40); g.state.roster.ratio.lvl = 40; g.fillTraces('ratio', 'cap'); hsrui.openMenu(); hsrui.openChars('ratio'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  ratioeid: "hsrShots.chars('ratio', 4, 5)",
  miyabitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.miyabi) g.addChar('miyabi', 40); g.state.roster.miyabi.lvl = 40; g.fillTraces('miyabi', 'cap'); hsrui.openMenu(); hsrui.openChars('miyabi'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  miyabieid: "hsrShots.chars('miyabi', 4, 5)",
  yanagitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yanagi) g.addChar('yanagi', 40); g.state.roster.yanagi.lvl = 40; g.fillTraces('yanagi', 'cap'); hsrui.openMenu(); hsrui.openChars('yanagi'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yanagieid: "hsrShots.chars('yanagi', 4, 5)",
  billytraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.billy) g.addChar('billy', 40); g.state.roster.billy.lvl = 40; g.fillTraces('billy', 'cap'); hsrui.openMenu(); hsrui.openChars('billy'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  billyeid: "hsrShots.chars('billy', 4, 5)",
  nicoletraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.nicole) g.addChar('nicole', 40); g.state.roster.nicole.lvl = 40; g.fillTraces('nicole', 'cap'); hsrui.openMenu(); hsrui.openChars('nicole'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  nicoleeid: "hsrShots.chars('nicole', 4, 5)",
  anbytraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.anby) g.addChar('anby', 40); g.state.roster.anby.lvl = 40; g.fillTraces('anby', 'cap'); hsrui.openMenu(); hsrui.openChars('anby'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  anbyeid: "hsrShots.chars('anby', 4, 5)",
  phrolovatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.phrolova) g.addChar('phrolova', 40); g.state.roster.phrolova.lvl = 40; g.fillTraces('phrolova', 'cap'); hsrui.openMenu(); hsrui.openChars('phrolova'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a4'; hsrShots.pump(2); return hsrShots.shot(); })()",
  phrolovaeid: "hsrShots.chars('phrolova', 4, 5)",
  scartraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.scar) g.addChar('scar', 40); g.state.roster.scar.lvl = 40; g.fillTraces('scar', 'cap'); hsrui.openMenu(); hsrui.openChars('scar'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  scareid: "hsrShots.chars('scar', 4, 5)",
  kazumatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.kazuma) g.addChar('kazuma', 40); g.state.roster.kazuma.lvl = 40; g.fillTraces('kazuma', 'cap'); hsrui.openMenu(); hsrui.openChars('kazuma'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a4'; hsrShots.pump(2); return hsrShots.shot(); })()",
  kazumaeid: "hsrShots.chars('kazuma', 4, 5)",
  aquatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.aqua) g.addChar('aqua', 40); g.state.roster.aqua.lvl = 40; g.fillTraces('aqua', 'cap'); hsrui.openMenu(); hsrui.openChars('aqua'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  aquaeid: "hsrShots.chars('aqua', 4, 5)",
  megumintraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.megumin) g.addChar('megumin', 40); g.state.roster.megumin.lvl = 40; g.fillTraces('megumin', 'cap'); hsrui.openMenu(); hsrui.openChars('megumin'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  megumineid: "hsrShots.chars('megumin', 4, 5)",
  darknesstraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.darkness) g.addChar('darkness', 40); g.state.roster.darkness.lvl = 40; g.fillTraces('darkness', 'cap'); hsrui.openMenu(); hsrui.openChars('darkness'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  darknesseid: "hsrShots.chars('darkness', 4, 5)",
  yutraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yu) g.addChar('yu', 40); g.state.roster.yu.lvl = 40; g.fillTraces('yu', 'cap'); hsrui.openMenu(); hsrui.openChars('yu'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yueid: "hsrShots.chars('yu', 4, 5)",
  yosuketraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yosuke) g.addChar('yosuke', 40); g.state.roster.yosuke.lvl = 40; g.fillTraces('yosuke', 'cap'); hsrui.openMenu(); hsrui.openChars('yosuke'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yosukeeid: "hsrShots.chars('yosuke', 4, 5)",
  chietraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.chie) g.addChar('chie', 40); g.state.roster.chie.lvl = 40; g.fillTraces('chie', 'cap'); hsrui.openMenu(); hsrui.openChars('chie'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  chieeid: "hsrShots.chars('chie', 4, 5)",
  yukikotraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.yukiko) g.addChar('yukiko', 40); g.state.roster.yukiko.lvl = 40; g.fillTraces('yukiko', 'cap'); hsrui.openMenu(); hsrui.openChars('yukiko'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  yukikoeid: "hsrShots.chars('yukiko', 4, 5)",
  kanjitraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.kanji) g.addChar('kanji', 40); g.state.roster.kanji.lvl = 40; g.fillTraces('kanji', 'cap'); hsrui.openMenu(); hsrui.openChars('kanji'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  kanjieid: "hsrShots.chars('kanji', 4, 5)",
  risetraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.rise) g.addChar('rise', 40); g.state.roster.rise.lvl = 40; g.fillTraces('rise', 'cap'); hsrui.openMenu(); hsrui.openChars('rise'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  riseeid: "hsrShots.chars('rise', 4, 5)",
  makototraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.makoto) g.addChar('makoto', 40); g.state.roster.makoto.lvl = 40; g.fillTraces('makoto', 'cap'); hsrui.openMenu(); hsrui.openChars('makoto'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  makotoeid: "hsrShots.chars('makoto', 4, 5)",
  amandatraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.amanda) g.addChar('amanda', 40); g.state.roster.amanda.lvl = 40; g.fillTraces('amanda', 'cap'); hsrui.openMenu(); hsrui.openChars('amanda'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  amandaeid: "hsrShots.chars('amanda', 4, 5)",
  talleahtraces: "(() => { const g = hsrShots.fresh('express'); if (!g.state.roster.talleah) g.addChar('talleah', 40); g.state.roster.talleah.lvl = 40; g.fillTraces('talleah', 'cap'); hsrui.openMenu(); hsrui.openChars('talleah'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  talleaheid: "hsrShots.chars('talleah', 4, 5)",
  danhengtraces: "(() => { const g = hsrShots.fresh('express'); g.fillTraces('danheng', 'cap'); hsrui.openMenu(); hsrui.openChars('danheng'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a6'; hsrShots.pump(2); return hsrShots.shot(); })()",
  danhengeid: "hsrShots.chars('danheng', 4, 3)",
  marchtraces: "(() => { const g = hsrShots.fresh('express'); g.fillTraces('march', 'cap'); hsrui.openMenu(); hsrui.openChars('march'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a4'; hsrShots.pump(2); return hsrShots.shot(); })()",
  marcheid4: "hsrShots.chars('march', 4, 3)",
  traileid1: "(() => { const g = hsrShots.fresh('express'); g.state.roster.trail.eid = 2; g.state.inv.items.shadow_dest = 1; hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 4; s.star = 0; s.starFocus = true; hsrShots.pump(2); return hsrShots.shot(); })()",
  traileid6: "(() => { const g = hsrShots.fresh('express'); g.state.roster.trail.eid = 2; g.state.inv.items.shadow_dest = 1; hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 4; s.star = 5; s.starFocus = true; hsrShots.pump(2); return hsrShots.shot(); })()",
  trailskills: "(() => { const g = hsrShots.fresh('express'); g.fillTraces('trail', 'cap'); g.state.roster.trail.eid = 3; hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  trailtraces: "(() => { const g = hsrShots.fresh('express'); g.fillTraces('trail', 'cap'); hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a6'; hsrShots.pump(2); return hsrShots.shot(); })()",
  echophantylia: "hsrShots.battle(['phantylia:40', 'lotus_ab:38'], 'sim', null, true)",
  echophantylia2: "hsrShots.battle(['phantylia2:40', 'lotus_de:38', 'lotus_de:38'], 'sim', null, true)",
  echoswarm: "hsrShots.battle(['skaracabaz_e2:40', 'gnawsting:38', 'juvsting:38'], 'sim', null, true)",
  chartraces: "(() => { const g = hsrShots.fresh('express'); const k = 'himeko'; if (!g.state.roster[k]) g.addChar(k, 52); g.state.roster[k].lvl = 52; g.fillTraces(k, 'cap'); const t = g.traceOf(k); t.lv.skill = Math.max(1, t.lv.skill - 1); t.on = t.on.slice(0, -2); g.state.credits = 99999; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier < 3)) g.state.inv.items[m] = 9;  hsrui.openMenu(); hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'skill'; hsrShots.pump(2); return hsrShots.shot(); })()",
  chartracesstat: "(() => { const g = hsrShots.fresh('express'); const k = 'seele'; if (!g.state.roster[k]) g.addChar(k, 64); g.state.roster[k].lvl = 64; g.fillTraces(k, 'cap'); const t = g.traceOf(k); t.lv.skill = Math.max(1, t.lv.skill - 1); t.on = t.on.slice(0, -2); g.state.credits = 99999; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier < 3)) g.state.inv.items[m] = 9;  hsrui.openMenu(); hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 's6'; hsrShots.pump(2); return hsrShots.shot(); })()",
  chartracesbonus: "(() => { const g = hsrShots.fresh('express'); const k = 'gepard'; if (!g.state.roster[k]) g.addChar(k, 44); g.state.roster[k].lvl = 44; g.fillTraces(k, 'cap'); const t = g.traceOf(k); t.lv.skill = Math.max(1, t.lv.skill - 1); t.on = t.on.slice(0, -2); g.state.credits = 99999; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier < 3)) g.state.inv.items[m] = 9;  hsrui.openMenu(); hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a4'; hsrShots.pump(2); return hsrShots.shot(); })()",
  chartracestrail: "(() => { const g = hsrShots.fresh('express'); const k = 'trail'; if (!g.state.roster[k]) g.addChar(k, 34); g.state.roster[k].lvl = 34; g.fillTraces(k, 'cap'); const t = g.traceOf(k); t.lv.skill = Math.max(1, t.lv.skill - 1); t.on = t.on.slice(0, -2); g.state.credits = 99999; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier < 3)) g.state.inv.items[m] = 9;  hsrui.openMenu(); hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = 'a2'; hsrShots.pump(2); return hsrShots.shot(); })()",
  chartracesnew: "(() => { const g = hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openChars('trail'); const s = hsrui.top(); s.sec = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  charactions: "(() => { const g = hsrShots.fresh('express'); hsrui.openMenu(); hsrui.openChars('trail'); hsrui.top().openActions(); hsrShots.pump(2); return hsrShots.shot(); })()",
  invmats: "(() => { const g = hsrShots.fresh('express'); for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat')) g.state.inv.items[m] = 3 + m.length; hsrui.openMenu(); hsrui.openInventory(2); hsrui.top().sel = 4; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_mat: "(() => { const g = hsrShots.fresh('express'); let n = 3; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier)) g.state.inv.items[m] = (n = (n * 7 + 5) % 41); hsrui.openSynth(); const s = hsrui.top(); s.sel = 3; s.qty = 4; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_swap: "(() => { const g = hsrShots.fresh('express'); let n = 3; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier)) g.state.inv.items[m] = (n = (n * 7 + 5) % 41); hsrui.openSynth(null, 2); const s = hsrui.top(); s.sel = 7; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_swapsrc: "(() => { const g = hsrShots.fresh('express'); let n = 3; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier)) g.state.inv.items[m] = (n = (n * 7 + 5) % 41); hsrui.openSynth(null, 2); const s = hsrui.top(); s.sel = 7; s.autoAdd(); hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_pick: "(() => { const g = hsrShots.fresh('express'); let n = 3; for (const m of Object.keys(Hsr98.ITEMS).filter(m => Hsr98.ITEMS[m].kind === 'mat' && Hsr98.ITEMS[m].tier)) g.state.inv.items[m] = (n = (n * 7 + 5) % 41); hsrui.openSynth(null, 2); const s = hsrui.top(); s.sel = 7; s.openPicker(); hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_lock: "(() => { hsrShots.fresh('express'); hsrui.openSynth(null, 3); hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_food: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.inv.items, { metal: 14, basic: 22, phlog: 9, seed: 31, water: 18, gas: 6, mech: 3, rice: 12, particle: 2, herbs: 5, soup: 4, coffee: 7, pie: 1 }); g.recipeSync(); hsrui.openSynth(null, 0); g.events.length = 0; hsrui.toasts = []; const s = hsrui.top(); s.sel = 1; s.qty = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_foodlock: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.inv.items, { metal: 14, basic: 22, phlog: 9, seed: 31, water: 18, gas: 6, mech: 3, rice: 12, particle: 2, herbs: 5, soup: 4, coffee: 7, pie: 1 }); g.recipeSync(); g.state.recipes = {}; delete g.state.inv.items.spark; hsrui.openSynth(null, 0); g.events.length = 0; hsrui.toasts = []; const s = hsrui.top(); s.sel = s.rows().findIndex(r => r.to === 'spark'); hsrShots.pump(2); return hsrShots.shot(); })()",
  inv_synmat: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.inv.items, { metal: 14, basic: 22, phlog: 9, seed: 31, water: 18, gas: 6, mech: 3, rice: 12, particle: 2, herbs: 5, soup: 4, coffee: 7, pie: 1 }); g.recipeSync(); hsrui.openInventory(2); g.events.length = 0; hsrui.toasts = []; const s = hsrui.top(); s.sel = hsrui.invEntries(2).findIndex(e => e.id === 'herbs'); hsrShots.pump(2); return hsrShots.shot(); })()",
  simdrops: "(() => { const g = hsrShots.fresh('express'); hsrui.openCalyx(() => {}); const s = hsrui.top(); s.sel = Math.max(0, g.calyxList().findIndex(x => x.c.id === 'cx_hunt')); s.tier = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  simecho: "(() => { const g = hsrShots.fresh('express'); g.state.flags.express_intro = true; g.echoClaim(); hsrui.openCalyx(() => {}); const s = hsrui.top(); s.sel = Math.max(0, g.calyxList().findIndex(x => x.c.id === 'cx_echo_doom')); hsrShots.pump(2); return hsrShots.shot(); })()",
  traceback: "(() => { const g = hsrShots.fresh('express'); g.state.trBack = { shadow_dest: 1, hunt1: 5, tracks: 2, echo_doom: 4 }; hsrui.openMenu(); hsrui.openChars('trail'); hsrShots.pump(2); return hsrShots.shot(); })()",
  coneart: '(() => { hsrShots.coneArt(); return new Promise(r => setTimeout(r, 400)).then(() => hsrShots.coneArt()); })()',
  foes1: 'hsrShots.foeSheet(0)',
  foes2: 'hsrShots.foeSheet(1)',
  foes3: 'hsrShots.foeSheet(2)',
  foes4: 'hsrShots.foeSheet(3)',
  foeicons: 'hsrShots.foeIcons()',
  bgs: 'hsrShots.bgs()',
  zoom: 'hsrShots.zoom(' + JSON.stringify(process.env.ZOOM || 'trail,danheng') + ')',
  office: "hsrShots.fieldAt('hs_office', 13, 9)",
  control: "hsrShots.fieldAt('hs_control', 23, 20)",
  suterm: 'hsrShots.suTerm(0)',
  supath: 'hsrShots.suTerm(1)',
  fhmirror: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.placePlayer(5, 5); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()",
  fhnear: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.placePlayer(+(process.env.FH_X || 4), 4); g.player.dir = 'up'; hsrShots.pump(30); return hsrShots.shot(); })()".replace('process.env.FH_X || 4', String(+(process.env.FH_X || 4))),
  fhhall: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 6; n++) g.fh().st[n] = { clear: true, stars: [true, n !== 5, n % 3 !== 0], best: 14 - n }; g.fhClaim(1); hsrui.openFh(); hsrui.top().sel = +(process.env.FH_STAGE || 7); hsrShots.pump(8); return hsrShots.shot(); })()".replace('process.env.FH_STAGE || 7', String(+(process.env.FH_STAGE || 7))),
  fhteam: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 10; n++) g.fh().st[n] = { clear: true, stars: [true, true, true], best: 14 }; hsrui.openFh(); hsrui.openFhTeam(14); hsrShots.pump(6); return hsrShots.shot(); })()",
  fhteam1: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.fh().st[1] = g.fh().st[2] = { clear: true, stars: [true, true, true], best: 15 }; hsrui.openFh(); hsrui.openFhTeam(3); hsrShots.pump(6); return hsrShots.shot(); })()",
  fhrun: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 6; n++) g.fh().st[n] = { clear: true, stars: [true, true, true], best: 14 }; g.fhBegin(7); g.fhRun().used = 4; g.fhRun().done[0] = [0]; hsrui.openFhRun(); hsrShots.pump(6); return hsrShots.shot(); })()",
  fhbattle: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 3; n++) g.fh().st[n] = { clear: true, stars: [true, true, true], best: 14 }; g.fhBegin(4); g.fhFight(); hsrui.drainGameEvents(); hsrui.bt.auto = false; hsrShots.pump(" + (+(process.env.FRAMES || 50)) + "); return hsrShots.shot(); })()",
  fhwin: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.fhBegin(1); const b = g.fhFight(); hsrui.drainGameEvents(); hsrui.bt.auto = true; for (let i = 0; i < 3000 && !hsrui.bt.result; i++) hsrui.update(0.1); hsrShots.pump(2); return hsrShots.shot(); })()",
  fhclear: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; for (let n = 1; n <= 7; n++) g.fh().st[n] = { clear: true, stars: [true, true, n !== 4], best: 13 }; hsrui.openFhClear({ n: 7, left: 13, used: 7, down: 0, stars: [true, true, true], fresh: [true, false, true], first: true, got: ['x'] }); hsrShots.pump(60); return hsrShots.shot(); })()",
  fhshop: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.state.inv.items.lucent = 460; hsrui.openFhShop(); hsrui.top().sel = +(process.env.FH_SEL || 2); hsrShots.pump(4); return hsrShots.shot(); })()".replace('process.env.FH_SEL || 2', String(+(process.env.FH_SEL || 2))),
  fhjokes: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.state.inv.items.feather = 1440; g.state.inv.items.resin = 1; hsrui.openFhShop(); hsrui.top().tab = 1; hsrui.top().sel = 1; hsrui.top().qty = 3; hsrShots.pump(4); return hsrShots.shot(); })()",
  guide_story: "(() => { const g = hsrShots.fresh('express'); const ms = g.missionsState(); Hsr98.TRAIL_MISSIONS.forEach((m, i) => { if (m.ch === 'prologue' || m.ch === 'winter' || (m.ch === 'dawn' && i % 3)) ms.done[m.id] = 1; }); g.state.quests.su_beta = 'done'; hsrui.openIpg('trail'); const s = hsrui.top(); s.act = 1; s.focus = 'cards'; s.card = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_prologue: "(() => { const g = hsrShots.fresh('express'); const ms = g.missionsState(); Hsr98.TRAIL_MISSIONS.forEach((m, i) => { if (m.ch === 'prologue' || m.ch === 'winter' || (m.ch === 'dawn' && i % 3)) ms.done[m.id] = 1; }); g.state.quests.su_beta = 'done'; hsrui.openIpg('trail'); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_chapter: "(() => { const g = hsrShots.fresh('express'); const ms = g.missionsState(); Hsr98.TRAIL_MISSIONS.forEach((m, i) => { if (m.ch === 'prologue' || m.ch === 'winter' || (m.ch === 'dawn' && i % 3)) ms.done[m.id] = 1; }); g.state.quests.su_beta = 'done'; hsrui.openIpg('trail'); hsrui.openGuideChapter('winter', 'Раздел I'); hsrui.top().sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_rules: "(() => { const g = hsrShots.fresh('express'); hsrui.openIpg('trail'); hsrui.openGuideRules(4); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_locked: "(() => { const g = hsrShots.fresh('express'); hsrui.openIpg(0); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 3; s.focus = 'rows'; s.row = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index_echo: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 6; s.focus = 'rows'; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index_orn: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index_target: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.state.power = 126; g.state.guide = { target: g.state.party[0] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'rows'; s.trow = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_sets: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.state.power = 126; g.state.guide = { target: 'march' in g.state.roster ? 'march' : g.state.party[1] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'rows'; s.trow = hsrui.guideTargetItems(g.guideTarget()).all.length - 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_none: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.state.power = 126; g.state.guide = { target: null }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_pick: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.state.power = 126; g.state.guide = { target: null }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; hsrui.openGuideTargetPick(s); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index_cavern: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.state.power = 126; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 5; s.focus = 'rows'; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_su: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { su_open: true, fh_met: true, su_clear_1: true }); g.state.suPaths = ['preservation', 'destruction', 'hunt']; hsrui.openIpg('cosmic'); hsrui.top().wsel = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_su_locked: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { su_open: true, fh_met: true, su_clear_1: true }); g.state.suPaths = ['preservation', 'destruction', 'hunt']; hsrui.openIpg('cosmic'); hsrui.top().wsel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_fh: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { su_open: true, fh_met: true, su_clear_1: true }); g.state.suPaths = ['preservation', 'destruction', 'hunt']; const F = g.fh(); for (let n = 1; n <= 7; n++) F.st[n] = { clear: true, stars: [true, true, n < 6], best: 1 }; F.got = [1, 2, 3, 4]; hsrui.openIpg('treasure'); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_daily: "(() => { const g = hsrShots.fresh('express'); g.state.flags.su_open = true; delete g.state.daily; const d = g.dailySync(); d.prog.power = 70; d.prog.contact = 1; d.got.login = true; d.pts = 100; d.claimed = [0]; d.prog[d.pick[4]] = 1; hsrui.openIpg('daily'); const s = hsrui.top(); s.dcard = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_daily_full: "(() => { const g = hsrShots.fresh('express'); g.state.flags.su_open = true; delete g.state.daily; const d = g.dailySync(); for (const id of d.pick) { d.prog[id] = 999; d.got[id] = true; } d.pts = 500; d.claimed = [0, 1, 2, 3, 4]; hsrui.openIpg('daily'); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_daily_steps: "(() => { const g = hsrShots.fresh('express'); g.state.flags.su_open = true; delete g.state.daily; const d = g.dailySync(); d.got.login = true; d.prog.contact = 1; d.got.contact = true; d.pts = 300; d.claimed = [0]; hsrui.openIpg('daily'); const s = hsrui.top(); s.dfocus = 'steps'; s.dstep = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_relic: "(() => { const g = hsrShots.fresh('express'); g.state.tl.lvl = 42; Object.assign(g.state.inv.items, { remains: 960, resin: 1 }); g.recipeSync(); g.events.length = 0; hsrui.openSynth(null, 3); Object.assign(hsrui.top(), { rsel: 3, rslot: 2, rfocus: 'slot' }); hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_relicplanar: "(() => { const g = hsrShots.fresh('express'); g.state.tl.lvl = 42; Object.assign(g.state.inv.items, { remains: 960, resin: 1 }); g.recipeSync(); g.events.length = 0; hsrui.openSynth(null, 3); Object.assign(hsrui.top(), { rsel: 12, rslot: 1, rfocus: 'grid' }); hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_craft: "(() => { const g = hsrShots.fresh('express'); g.state.tl.lvl = 42; Object.assign(g.state.inv.items, { remains: 960, resin: 1 }); g.recipeSync(); g.events.length = 0; hsrui.openSynth(null, 3, { resin: true }); const s = hsrui.top(); Object.assign(s, { rsel: 1, rslot: 2, rfocus: 'slot' }); hsrui.openRelicCraft(s); hsrui.top().sel = 4; hsrShots.pump(2); return hsrShots.shot(); })()",
  synth_crafted: "(() => { const g = hsrShots.fresh('express'); g.state.tl.lvl = 42; Object.assign(g.state.inv.items, { remains: 960, resin: 1 }); g.recipeSync(); g.events.length = 0; hsrui.openSynth(null, 3); const rel = g.craftRelic('musketeer', 'body', 'critD'); hsrui.openRelicResult(rel); hsrShots.pump(2); return hsrShots.shot(); })()",
  mail_fuelv: "(() => { const g = hsrShots.fresh('express'); g.state.mail = {}; g.mailSync(); hsrui.openMail(); const s = hsrui.top(); s.select(g.mailbox().findIndex(x => x.m.id === 'fuelv_gift')); hsrShots.pump(2); return hsrShots.shot(); })()",
  inv_fuelv: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.inv.items, { fuelv: 100, remains: 300 }); g.events.length = 0; hsrui.openInventory(3); const s = hsrui.top(); s.sel = hsrui.invEntries(3).findIndex(e => e.id === 'fuelv'); hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_calyx: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, cor_h3: true, ending: true }); g.powerSync(); g.state.power = 510; g.state.powerRes = 120; g.state.inv.items.fuelv = 100; hsrui.openDomain('cx_exp', () => {}); const s = hsrui.top(); s.tier = 2; s.n = 6; hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_crimson: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, cor_h3: true, ending: true }); g.powerSync(); g.state.power = 35; g.state.powerRes = 400; g.state.inv.items.fuelv = 100; hsrui.openDomain('cx_hunt', () => {}); const s = hsrui.top(); s.tier = 3; s.n = 8; hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_shadow: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, cor_h3: true, ending: true }); g.powerSync(); g.state.power = 420; g.state.inv.items.fuelv = 100; hsrui.openDomain('cx_spike', () => {}); const s = hsrui.top(); s.tier = 3; s.n = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_cavern: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, cor_h3: true, ending: true }); g.powerSync(); g.state.power = 20; g.state.powerRes = 0; g.setPowerAuto(false); hsrui.openDomain('cx_fist', () => {}); const s = hsrui.top(); s.tier = 1; s.n = 4; hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_echo: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true, cor_h3: true, ending: true }); g.powerSync(); g.state.power = 300; g.state.flags.swamp_branch = true; g.echoClaim(); hsrui.openDomain('cx_echo_coco', () => {}); hsrui.top().tier = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  domain_locked: "(() => { const g = hsrShots.fresh('express'); g.powerSync(); g.state.power = 300; hsrui.openDomain('cx_providence', () => {}); hsrShots.pump(2); return hsrShots.shot(); })()",
  sim_list: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fled = true; hsrui.openCalyx(() => {}); hsrui.top().sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  battle_waves: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.powerSync(); g.state.power = 600; const settle = () => { hsrui.bt.queue.length = 0; hsrui.bt.cur = null; hsrui.bt.intro = 0; }; const fin = (w, wave) => { if (wave != null) g.battle.wave = wave; g.battle.finish(w); settle(); hsrui.updateBattle(0.016); }; hsrui.openDomain('cx_exp', () => {}); hsrui.top().n = 6; hsrui.top().key('ok'); hsrShots.pump(40); return hsrShots.shot(); })()",
  series_next: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.powerSync(); g.state.power = 600; const settle = () => { hsrui.bt.queue.length = 0; hsrui.bt.cur = null; hsrui.bt.intro = 0; }; const fin = (w, wave) => { if (wave != null) g.battle.wave = wave; g.battle.finish(w); settle(); hsrui.updateBattle(0.016); }; hsrui.openDomain('cx_spike', () => {}); hsrui.top().tier = 1; hsrui.top().n = 3; hsrui.top().key('ok'); settle(); fin(true); hsrui.bt.nextT = 2.4; hsrShots.pump(1, 0); return hsrShots.shot(); })()",
  series_total: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.powerSync(); g.state.power = 600; const settle = () => { hsrui.bt.queue.length = 0; hsrui.bt.cur = null; hsrui.bt.intro = 0; }; const fin = (w, wave) => { if (wave != null) g.battle.wave = wave; g.battle.finish(w); settle(); hsrui.updateBattle(0.016); }; hsrui.openDomain('cx_spike', () => {}); hsrui.top().tier = 1; hsrui.top().n = 3; hsrui.top().key('ok'); settle(); fin(true); hsrui.battleKey('ok'); settle(); fin(true); hsrui.battleKey('ok'); settle(); fin(true); hsrShots.pump(1, 0); return hsrShots.shot(); })()",
  win_again: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.powerSync(); g.state.power = 600; const settle = () => { hsrui.bt.queue.length = 0; hsrui.bt.cur = null; hsrui.bt.intro = 0; }; const fin = (w, wave) => { if (wave != null) g.battle.wave = wave; g.battle.finish(w); settle(); hsrui.updateBattle(0.016); }; hsrui.openDomain('cx_hunt', () => {}); hsrui.top().tier = 1; hsrui.top().n = 4; hsrui.top().key('ok'); settle(); fin(true); hsrShots.pump(1, 0); return hsrShots.shot(); })()",
  lose_waves: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.powerSync(); g.state.power = 600; const settle = () => { hsrui.bt.queue.length = 0; hsrui.bt.cur = null; hsrui.bt.intro = 0; }; const fin = (w, wave) => { if (wave != null) g.battle.wave = wave; g.battle.finish(w); settle(); hsrui.updateBattle(0.016); }; hsrui.openDomain('cx_hunt', () => {}); hsrui.top().n = 8; hsrui.top().key('ok'); settle(); fin(false, 3); hsrShots.pump(1, 0); return hsrShots.shot(); })()",
  quick_farm: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, ending: true }); g.powerSync(); g.state.power = 510; g.state.inv.items.fuelv = 100; hsrui.openDomain('cx_spike', () => {}); hsrui.top().tier = 3; hsrui.openQuickFarm('cx_spike', 3); hsrShots.pump(2); return hsrShots.shot(); })()",
  quick_got: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, ending: true }); g.powerSync(); g.state.power = 510; g.state.inv.items.fuelv = 100; hsrui.openDomain('cx_hunt', () => {}); hsrui.top().tier = 2; hsrui.openQuickFarm('cx_hunt', 2); hsrui.top().n = 6; hsrui.top().key('ok'); g.events.length = 0; hsrui.toasts = []; hsrShots.pump(2); return hsrShots.shot(); })()",
  quick_power: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, ending: true }); g.powerSync(); g.state.power = 510; g.state.inv.items.fuelv = 100; g.state.power = 40; hsrui.openDomain('cx_exp', () => {}); hsrui.openQuickFarm('cx_exp', 0); hsrui.top().n = 8; hsrShots.pump(2); return hsrShots.shot(); })()",
  quick_target: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, ending: true }); g.powerSync(); g.state.power = 510; g.state.inv.items.fuelv = 100; const k = g.state.party[0], path = Hsr98.CHARS[g.kitOf(k)].path, pc = Hsr98.CALYX.find(x => x.reward === 'path' && x.path === path && g.calyxOpen(x)); g.setGuideTarget(k); for (const n of g.targetRowNeeds(pc.id)) g.state.inv.items[n.id] = Hsr98.ITEMS[n.id].tier === 1 ? n.need - 1 : n.need; hsrui.openQuickFarm(pc.id, 0); hsrui.top().n = 10; hsrui.top().key('ok'); g.events.length = 0; hsrui.toasts = []; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_index_quick: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.state.guide = { target: g.state.party[0] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 3; s.focus = 'rows'; s.row = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_shadow_quick: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.state.guide = { target: g.state.party[0] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 4; s.focus = 'rows'; s.row = 1; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_btn: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.state.guide = { target: g.state.party[0] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'pick'; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_quick: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.state.guide = { target: g.state.party[0] }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'rows'; s.trow = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_done: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; const k = g.state.party[0]; g.state.guide = { target: k }; g.state.credits = 1e8; for (const n of g.targetNeeds(k)) if (n.id !== 'credits') g.state.inv.items[n.id] = (g.state.inv.items[n.id] || 0) + n.miss; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; hsrui.toasts = []; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_view: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 3; s.focus = 'rows'; s.row = 0; s.key(null, 'KeyL'); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_pick_warp: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.addChar('seele', 30); delete g.state.roster.kafka; delete g.state.roster.blade; hsrui.openIpg('index'); hsrui.top().cat = 0; hsrui.openGuideTargetPick(hsrui.top()); const pk = hsrui.top(); pk.sel = g.guideTargets().indexOf('kafka'); hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_warp: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.addChar('seele', 30); delete g.state.roster.kafka; delete g.state.roster.blade; g.setGuideTarget('kafka'); hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'rows'; s.trow = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  chars_target: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true, fissures_intro: true, cor_done: true }); g.powerSync(); g.state.power = 126; g.state.inv.items.fuelv = 100; g.addChar('seele', 30); g.setGuideTarget('seele'); hsrui.openChars(); hsrui.top().sec = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  guide_target_rec: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.inv.items.fuelv = 100; g.state.guide = { target: g.state.party[0], recOnly: true }; hsrui.openIpg('index'); const s = hsrui.top(); s.cat = 0; s.focus = 'rows'; s.trow = 0; hsrShots.pump(2); return hsrShots.shot(); })()",
  traces_quick: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.inv.items.fuelv = 100; const k = g.state.party[0]; for (const m of Object.keys(g.state.inv.items)) if (Hsr98.ITEMS[m] && Hsr98.ITEMS[m].mat === 'path') g.state.inv.items[m] = 0; hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = Hsr98.traceNodes(g.kitOf(k)).map(n => g.traceNode(k, n.id)).find(st => st && st.cost && Object.keys(st.cost.items).some(m => Hsr98.ITEMS[m].mat === 'path')).node.id; hsrShots.pump(2); return hsrShots.shot(); })()",
  traces_ask: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true, rivet_intro: true, rivet_done: true }); g.state.inv.items.fuelv = 100; const k = g.state.party[0]; for (const m of Object.keys(g.state.inv.items)) if (Hsr98.ITEMS[m] && Hsr98.ITEMS[m].mat === 'path') g.state.inv.items[m] = 0; hsrui.openChars(k); const s = hsrui.top(); s.sec = 1; s.trFocus = true; s.trSel = Hsr98.traceNodes(g.kitOf(k)).map(n => g.traceNode(k, n.id)).find(st => st && st.cost && Object.keys(st.cost.items).some(m => Hsr98.ITEMS[m].mat === 'path')).node.id; s.key(null, 'KeyR'); hsrShots.pump(2); return hsrShots.shot(); })()",
  flow_series: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { express_intro: true, fled: true, mine_done: true }); g.powerSync(); g.state.power = 600; for (const k of g.state.party) g.state.roster[k].lvl = 70; hsrui.openDomain('cx_spike', () => {}); hsrui.top().n = 2; hsrui.top().key('ok'); hsrui.bt.auto = true; hsrui.bt.autoSticky = true; for (let i = 0; i < 80 && !(hsrui.bt.result && hsrui.bt.result.series && !hsrui.bt.result.series.more); i++) hsrShots.pump(100); return hsrShots.shot(); })()",
  guide_target_pick_all: "(() => { const g = hsrShots.fresh('express'); g.state.flags.express_intro = true; for (const k of Object.keys(g.state.roster)) if (!g.state.party.includes(k)) delete g.state.roster[k]; hsrui.openIpg('index'); hsrui.top().cat = 0; hsrui.openGuideTargetPick(hsrui.top()); const pk = hsrui.top(); pk.sel = g.guideTargets().indexOf('gepard'); hsrShots.pump(2); return hsrShots.shot(); })()",
  inv_salvage: "(() => { const g = hsrShots.fresh('express'); g.state.tl.lvl = 42; Object.assign(g.state.inv.items, { remains: 960, resin: 1 }); g.recipeSync(); g.events.length = 0; for (let i = 0; i < 9; i++) g.rollRelic(6 + i * 4); hsrui.openInventory(5); hsrui.openSalvage(); hsrShots.pump(2); return hsrShots.shot(); })()",
  fhmeet: "hsrShots.dialog('fh_meet', +(process.env.FRAMES || 40))".replace('process.env.FRAMES || 40', String(+(process.env.FRAMES || 40))),
  fhchat: "(() => { const g = hsrShots.fresh('express'); g.state.chats = null; for (let i = 0; i < 6; i++) for (const id of g.chatSync()) if (id !== 'fh_call') g.chatAuto(id, true); g.events.length = 0; hsrui.openChats('messenger'); hsrShots.pump(90); return hsrShots.shot(); })()",
  supathlock: 'hsrShots.suTerm(1, 2)',
  suteam: 'hsrShots.suTerm(2)',
  sufield: 'hsrShots.suField(0)',
  suportal: 'hsrShots.suField(1)',
  surespite: 'hsrShots.suField(2)',
  suframe: 'hsrShots.suField(3)',
  suevent: 'hsrShots.suEvent()',
  suaeon: 'hsrShots.suAeon()',
  subless: 'hsrShots.suBless()',
  subless2: 'hsrShots.suBless(true)',
  sucurio: 'hsrShots.suCurio()',
  sushop: 'hsrShots.suShop()',
  suenh: 'hsrShots.suEnh()',
  suend: 'hsrShots.suEnd(true)',
  suendfail: 'hsrShots.suEnd(false)',
  surun: 'hsrShots.suRun(0)',
  surun2: 'hsrShots.suRun(1)',
  subattle: 'hsrShots.suBattle(0)',
  sures: 'hsrShots.suBattle(1)',
  sulose: 'hsrShots.suBattle(2)',
  suicons: 'hsrShots.suIcons()',
  glyphs: 'hsrShots.glyphs()',
  questhud: 'hsrShots.quest(0)',
  questmission: 'hsrShots.quest(1)',
  questnav: 'hsrShots.quest(2)'
};
for (const id of ['trail', 'blade', 'clara', 'seele', 'danheng', 'topaz', 'himeko', 'herta', 'jingyuan', 'bronya', 'asta', 'ruanmei', 'kafka', 'silverwolf', 'welt', 'march', 'gepard', 'fuxuan', 'natasha', 'bailu', 'luocha']) SCENES['hdhero_' + id] = 'hsrShots.hdHero(' + JSON.stringify(id) + ')';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const PAGE = `(() => {
  const H = Hsr98, ui = window.hsrui;
  ui.running = false;
  Math.random = H.makeRandom(11);
  const pump = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) ui.update(dt); ui.render(); };
  const shot = () => { ui.render(); return ui.canvas.toDataURL('image/png'); };
  const FLAGS = ['asc_note', 'chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro', 'jarilo_arrive', 'plains_met', 'belobog_intro', 'sampo_met', 'events_note', 'ks_note'];
  const fresh = (map, party) => {
    const st = H.newState();
    Object.assign(st, { name: 'Стелла', gender: 'f', map, x: null, y: null, jade: 1600, credits: 25480, power: 142, tp: 4, obj: 'Найти Броню в Белобоге' });
    for (const f of FLAGS) st.flags[f] = true;
    for (const id of Object.keys(H.CHARS)) if (id !== 'trail_p') st.roster[id] = { lvl: id === 'trail' ? 32 : 28, exp: 420, eid: id === 'march' ? 2 : 0, cone: null, relics: {}, hp: null, energy: 0 };
    for (const id of party || []) if (!st.roster[id]) st.roster[id] = { lvl: 28, exp: 420, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.party = party || ['trail', 'march', 'danheng', 'himeko'];
    st.inv.items = { medkit: 4, soup: 2, pie: 1, revive: 1, coffee: 3, hotpot: 1, fuel: 2, exp1: 6, exp2: 2, exp3: 1, pass: 3, fuse: 1, hook_badge: 1, geo_core: 1, serval_pick: 1, thermos: 3, sbiten: 2, spark: 1 };
    st.pendingTechs = [];
    const g = new H.Game({ state: st, seed: 7 });
    for (let i = 0; i < 6; i++) for (const id of g.chatSync()) g.chatAuto(id, true);
    g.events.length = 0; ui.chatNote = null;
    for (const id of Object.keys(H.CONES)) g.addCone(id);
    g.addCone('swordplay');
    for (let i = 0; i < 20; i++) g.rollRelic(30);
    const coneFor = { trail: 'underthesky', march: 'trend', danheng: 'swordplay', himeko: 'milkyway', arlan: 'collapsing', seele: 'arrows', bronya: 'butthebattle', gepard: 'moment', natasha: 'postop', serval: 'geniuses' };
    for (const [k, id] of Object.entries(coneFor)) { const c = g.state.inv.cones.find(x => x.id === id); if (c) g.equipCone(k, c.uid); }
    for (const k of st.party) g.autoEquip(k);
    g.state.roster.march.hp = Math.round(g.charStats('march').hp * 0.42);
    ui.game = g; ui.screens = []; ui.dlg = null; ui.toasts = []; ui.particles = [];
    ui.enterField(); ui.banner = null;
    return g;
  };
  window.hsrShots = {
    pump, shot, fresh,
    hdHero(id) {
      const s = hsrShots.hd(id, 18), A = s.arena, h = A.hero, TS = 32;
      A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }];
      h.x = h.px = 29.5 * TS; h.y = h.py = 23 * TS; h.picks[10] = 0;
      const spots = [[60, -70], [100, -40], [-40, -90], [130, -100], [-90, -50], [20, -140]];
      for (const [dx, dy] of spots) { const u = A.spawnFoe(dx === 130 ? 'trampler' : 'reaver', 'n'); u.x = u.px = h.x + dx; u.y = u.py = h.y + dy; u.spd = 0; u.hp = u.hpMax = 1e6; }
      const t = A.foes()[0];
      h.en = h.enMax;
      A.cmd({ t: 'cast', slot: 'q', x: t.x, y: t.y, id: t.uid }); pump(8);
      h.en = h.enMax;
      A.cmd({ t: 'cast', slot: 'r', x: t.x, y: t.y, id: t.uid }); pump(5);
      return shot();
    },
    hdBoss(id, th, o = {}) {
      const s = hsrShots.hd(o.hero || 'trail', o.lvl || 16, th), A = s.arena, h = A.hero, TS = 32, HD = Hsr98.HD;
      A.wave = o.wave || 10; A.phase = 'wave'; A.sched = [{ t: 1e9, done: false, ids: [], rift: 'n' }];
      h.x = h.px = 29.5 * TS; h.y = h.py = 23.5 * TS; h.picks[10] = 0;
      const b = A.spawnFoe(id, 'n', o.big ? { big: true } : {});
      b.x = b.px = 30 * TS; b.y = b.py = 20.5 * TS; b.gapT = 99; b.tgt = h.uid;
      (o.escort || []).forEach((k, i) => { const u = A.spawnFoe(k, 'n'); u.x = u.px = (27 + i * 2) * TS; u.y = u.py = 17.5 * TS; });
      if (o.phase2) b.hp = b.hpMax * 0.49;
      pump(o.pre || 10);
      const AI = HD.FOE_AI[id];
      if (o.move) { b.act = null; AI.moves[o.move](A, b, h); }
      pump(+(window.HDP || o.post || 18));
      return shot();
    },
    hdThreat(key) {
      const s = hsrShots.hd('himeko', 9, [key, key === 'legion' ? 'silvermane' : 'legion']), A = s.arena, h = A.hero;
      A.wave = 7; h.x = h.px = 29.5 * 32; h.y = h.py = 14 * 32;
      A.cmd({ t: 'early' });
      pump(+(window.HDP || 330));
      return shot();
    },
    hdMeta() {
      const g = fresh('express_lab', ['trail']), HD = Hsr98.HD;
      Object.assign(g.state.flags, { lab_found: true, lab_sw: true });
      const run = (hero, diff, o) => { g.hdNew({ hero, diff, seed: 3 + g.hd().hist.length, threats: o.th }); const A = g.hdArena(); A.wave = o.wave; Object.assign(A.stats, o.stats); A.base.hp = o.base; if (o.win) A.over = 'win'; A.hero.deaths = o.deaths || 0; A.hero.lvl = o.lvl; g.hdFinish(A, !o.win); };
      run('himeko', 'normal', { th: ['legion', 'winter'], wave: 20, win: true, base: 2810, lvl: 20, stats: { time: 1488, kills: 402, raid: 3240, bossMin: 52 } });
      run('march', 'normal', { th: ['silvermane', 'automaton'], wave: 17, base: 0, lvl: 19, deaths: 1, stats: { time: 1210, kills: 280, tfell: 2 } });
      run('seele', 'easy', { th: ['automaton', 'legion'], wave: 20, win: true, base: 3420, lvl: 20, stats: { time: 1395, kills: 390, tfell: 1 } });
      g.hd().asc.got.push(1, 2);
      ui.openHdHub();
      return g;
    },
    hdGear() {
      const s = hsrShots.hd('himeko', 9), A = s.arena, h = A.hero, HD = Hsr98.HD;
      h.gold = 20000; h.x = h.px = A.M.shop[0] * 32; h.y = h.py = A.M.shop[1] * 32 + 48;
      HD.buyItem(A, h, 'cone', { cone: 'geniuses' }); HD.upgrade(A, h, 'cone');
      for (const slot of ['head', 'hands', 'body']) HD.buyItem(A, h, 'relic', { set: 'firesmith', slot });
      HD.upgrade(A, h, 0); HD.upgrade(A, h, 0); HD.upgrade(A, h, 1);
      HD.buyItem(A, h, 'grenade'); HD.buyItem(A, h, 'garrison');
      for (let i = 0; i < 3; i++) HD.buyItem(A, h, 'medkit');
      h.gold = 2350; A.events.length = 0;
      return s;
    },
    hdShop(tab, sel) {
      const s = hsrShots.hdGear();
      s.shop = { sel, slot: -1, tab }; s.pomSay(['Пом-Пом всё разложил по полочкам.']);
      pump(12);
      return shot();
    },
    hd(hero, lvl, threats) {
      const g = fresh('express_lab', ['trail']);
      Object.assign(g.state.flags, { lab_found: true, lab_sw: true });
      g.hdNew({ hero, seed: 11, threats: threats || ['legion', 'silvermane'] });
      ui.openHdHub(); ui.openHdArena();
      const s = ui.top(), A = s.arena, h = A.hero;
      if (lvl) { A.giveExp(h, [...Array(lvl - 1).keys()].reduce((n, l) => n + Hsr98.HD.expNext(l + 1), 0)); for (const sl of ['q', 'e', 't', 'r', 'q', 'q', 'e', 't', 'q', 'e', 't', 'r', 'e', 't']) A.up(h, sl); h.en = h.enMax; h.gold = 1850; }
      A.events.length = 0;
      return s;
    },
    cwSetupItems(g) {
      const r = hsrShots.cwSetupMix(g);
      r.board.on[0].items = [{ uid: 9001, id: 'chainsaw', sp: false }, { uid: 9002, id: 'starChase', sp: true }];
      r.board.on[3].items = [{ uid: 9003, id: 'codexEvo', sp: false }, { uid: 9004, id: 'em_express', sp: false }, { uid: 9005, id: 'knife', sp: false }];
      r.board.off[1].items = [{ uid: 9006, id: 'railgun', sp: false }];
      r.inv = [];
      for (const id of ['star', 'skates', 'antiSat', 'red', 'trash', 'keyP', 'boxAdv', 'contract4', 'furnace', 'gem', 'em_section6']) g.cwInvAdd(r, id);
      return r;
    },
    cwSetupMix(g) {
      const r = g.cwNew({ tier: 2 });
      for (const z of ['on', 'off', 'bench']) r.board[z].fill(null);
      r.envPick = null;
      const put = (z, i, id, star) => { r.board[z][i] = { uid: ++r.uid, id, star }; r.pool[id] -= Math.pow(3, star - 1); };
      put('on', 0, 'kazuma', 2); put('on', 1, 'aqua', 1); put('on', 2, 'chie', 2); put('on', 3, 'herta', 2);
      put('off', 0, 'megumin', 1); put('off', 1, 'asta', 2); put('off', 2, 'ruanmei', 1); put('off', 3, 'yukiko', 1); put('off', 4, 'rise', 1);
      put('bench', 0, 'march', 1); put('bench', 1, 'pela', 1);
      Object.assign(r, { lvl: 9, exp: 20, gold: 34, streak: 3, hp: 76, node: 2 });
      g.cwRollShop(r);
      return r;
    },
    cwSetup(g, tier) {
      const r = g.cwNew({ tier: tier || 0 });
      for (const z of ['on', 'off', 'bench']) r.board[z].fill(null);
      r.envPick = null;
      const put = (z, i, id, star) => { r.board[z][i] = { uid: ++r.uid, id, star }; r.pool[id] -= Math.pow(3, star - 1); };
      put('on', 0, 'qingque', 2); put('on', 1, 'imbibitor', 1); put('on', 2, 'danheng', 1); put('on', 3, 'sushang', 1);
      put('off', 0, 'tingyun', 2); put('off', 1, 'yukong', 1);
      put('bench', 0, 'march', 1); put('bench', 1, 'pela', 1); put('bench', 2, 'lynx', 1);
      Object.assign(r, { lvl: 6, exp: 9, gold: 23, streak: 2, hp: 82, node: 2 });
      g.cwRollShop(r);
      return r;
    },
    title(sec) { ui.game = null; ui.mode = 'title'; ui.screens = []; pump(40); if (sec != null) ui.t = sec; return shot(); },
    field(map) { fresh(map); pump(30); return shot(); },
    fieldAt(map, x, y) { const g = fresh(map); g.placePlayer(x, y); g.player.dir = 'up'; pump(30); return shot(); },
    lfScene(kind) {
      const g = fresh('lf_cloud', ['trail', 'march', 'danheng', 'himeko']), at = ch => g.map.marks[ch][0];
      if (kind === 'panel') { const [x, y] = at('Г'); Object.assign(g.state.flags, { lf_mara_win: true, lf_t_panel: true }); g.placePlayer(x, y - 1); g.player.dir = 'down'; pump(5); g.interact(); pump(5); }
      if (kind === 'hall') { const [x, y] = at('о'); g.state.flags.lf_t_voices = true; g.placePlayer(x + 12, y - 2); g.player.dir = 'down'; pump(10); }
      if (kind === 'bridge') { Object.assign(g.state.flags, { lf_mara_win: true }); g.lfState().cargo['lf_cloud:u'] = 2; g.lfState().cargo['lf_cloud:l'] = 2; g.loadMap('lf_cloud', null, { silent: true }); g.placePlayer(19, 58); pump(20); }
      if (kind === 'chasm') { g.state.flags.lf_mara_win = true; g.placePlayer(19, 56); pump(20); }
      if (kind === 'shifter') { const [x, y] = at('И'); Object.assign(g.state.flags, { lf_mara_win: true, lf_t_walk2: true }); g.placePlayer(x + 1, y - 1); g.player.dir = 'down'; pump(10); }
      return shot();
    },
    navScene(step, x, y, dir, flags, cargo, scan) {
      const g = fresh('lf_navalia', ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, { lf_diting: true, lf_ting_found: true, lf_nav_clues: step !== 'clues' }, flags || {});
      Object.assign(g.state.quests, { lf_q4: 'done', lf_q5: step });
      for (const [k, v] of Object.entries(cargo || {})) g.lfState().cargo['lf_navalia:' + k] = v;
      g.loadMap('lf_navalia', null, { x, y, silent: true });
      g.player.dir = dir || 'down';
      pump(8);
      if (scan) g.ditingScan();
      pump(8);
      return shot();
    },
    sanScene(quests, x, y, dir, flags) {
      const g = fresh('lf_sanctum', ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, flags);
      Object.assign(g.state.quests, quests);
      g.loadMap('lf_sanctum', null, { x, y, silent: true });
      g.player.dir = dir;
      pump(10);
      return shot();
    },
    lfMapScene(map, quests, x, y, dir, flags) {
      const g = fresh(map, ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, flags);
      Object.assign(g.state.quests, quests);
      g.loadMap(map, null, { x, y, silent: true });
      g.player.dir = dir;
      pump(10);
      return shot();
    },
    lfPuzzle(ui, id, turns) {
      fresh('lf_divination', ['trail']);
      const s = hsrui.game;
      s.pending = { type: 'ui', ui, id };
      hsrui.openUi(s.pending);
      if (turns) hsrui.top().key('right', 'ArrowRight');
      pump(10);
      return shot();
    },
    lfGuest(map, quests, x, y, dir, flags, who) {
      const g = fresh(map, ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, flags);
      Object.assign(g.state.quests, quests);
      g.setGuest([who], { solo: true });
      g.loadMap(map, null, { x, y, silent: true });
      g.player.dir = dir;
      pump(10);
      return shot();
    },
    lfSea(quests, x, y, dir, flags, lit) {
      const base = { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_terrace_done: true, lf_scale_in: true, lf_rainhall_win: true, lf_rainhall_done: true, lf_sea_open: true };
      const g = fresh('lf_scale', ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, base, flags);
      Object.assign(g.state.quests, { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'done' }, quests);
      g.lfState().sconce = lit || {};
      g.loadMap('lf_scale', null, { x, y, silent: true });
      g.player.dir = dir;
      pump(10);
      return shot();
    },
    lfEnd(map, step, x, y, dir, flags) {
      const base = { lf_al_arrive: true, lf_r_arrive: true, lf_al_stairs: true, lf_disciple_win: true, lf_al_camp: true, lf_fx_back: true, lf_fx_lift: true, lf_al_t_dis: true, lf_al_t_duty: true, lf_mist_in: true, lf_cr_1: true, lf_cr_2: true, lf_cr_3: true, lf_furnace_off: true, lf_danshu_win: true, lf_reveal: true, lf_legion_win: true, lf_terrace_done: true, lf_scale_in: true, lf_rainhall_win: true, lf_rainhall_done: true, lf_sea_open: true, lf_roots_in: true, lf_phantylia_win: true, lf_phantylia_end: true, lf_phantylia_done: true, lf_seat_open: true, lf_fan: true, lf_alley_open: true, lf_gifts_on: step !== 'fuxuan' && step !== 'astrum' && step !== 'yanming' };
      const g = fresh(map, ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, base, flags);
      Object.assign(g.state.quests, { lf_q10: 'done', lf_dh3: 'done', lf_dh4: 'done', lf_q11: 'done', lf_dh5: 'done', lf_q12: step });
      g.loadMap(map, null, { x, y, silent: true });
      g.script = null; g.pending = null;
      g.player.dir = dir;
      pump(10);
      return shot();
    },
    lfWaveBattle(id, map, wave) {
      fresh('lf_cloud', ['trail', 'march', 'danheng', 'himeko']);
      const g = hsrui.game, b = g.startBattle({ encId: id, fromScript: true });
      ui.drainGameEvents();
      ui.bt.auto = false;
      for (let i = 0; i < 900 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur) && !b.over; i++) ui.update(1 / 10);
      for (let w = 0; w < wave; w++) { for (const e of b.enemies) { e.dead = true; e.hp = 0; } b.cleanup(); }
      ui.pullEvents();
      for (let i = 0; i < 120 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur) && !b.over; i++) ui.update(1 / 10);
      pump(4);
      return shot();
    },
    lfDeerBattle() {
      fresh('lf_cloud', ['trail', 'march', 'danheng', 'himeko']);
      const g = hsrui.game, b = g.startBattle({ encId: 'lf_deer2', fromScript: true });
      ui.drainGameEvents();
      ui.bt.auto = false;
      for (let i = 0; i < 900 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur) && !b.over; i++) ui.update(1 / 10);
      b.spawnFoe('twig_wind', 41, b.enemies[0]);
      b.spawnFoe('twig_fruit', 41, b.enemies[0]);
      ui.pullEvents();
      for (let i = 0; i < 60; i++) ui.update(1 / 10);
      pump(4);
      return shot();
    },
    lfPhotoFlow() {
      const g = fresh('lf_sanctum', ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, { lf_s_arrive: true, lf_bailu_win: true });
      Object.assign(g.state.quests, { lf_q5: 'done', lf_q6: 'plaza' });
      g.placePlayer(22, 22);
      g.runScript('lf_s_center');
      pump(8);
      const chat = hsrui.top();
      chat.key('back', 'Escape');
      pump(2);
      if (hsrui.top() === chat) chat.key('back', 'Escape');
      pump(10);
      return shot();
    },
    lfPhoto() {
      const g = fresh('lf_sanctum', ['trail', 'march', 'danheng', 'himeko']);
      Object.assign(g.state.flags, { lf_q6_msg: true });
      g.chatSync();
      g.chatAuto('lf_photo');
      hsrui.openChats('qingque');
      pump(20);
      return shot();
    },
    lfSay(map, script, n, party) {
      const g = fresh(map, party || ['trail', 'march', 'danheng', 'himeko']);
      g.runScript(script);
      pump(3);
      for (let i = 0; i < n; i++) { if (g.pending) g.resume(0); pump(2); }
      pump(6);
      return shot();
    },
    lfFoeBattle(id) {
      fresh('lf_cloud', ['trail', 'march', 'danheng', 'himeko']);
      const g = hsrui.game, b = g.startBattle({ encId: id, fromScript: true });
      ui.drainGameEvents();
      ui.bt.auto = false;
      for (let i = 0; i < 900 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur) && !b.over; i++) ui.update(1 / 10);
      pump(6);
      return shot();
    },
    lfDominated() {
      fresh('lf_cloud', ['trail', 'march', 'danheng', 'himeko']);
      const g = hsrui.game, b = g.startBattle({ encId: 'lf_kafka', fromScript: true });
      ui.drainGameEvents();
      ui.bt.auto = false;
      for (let i = 0; i < 900 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur) && !b.over; i++) ui.update(1 / 10);
      b.echoSelfFx(b.enemies[0], H.ENEMIES.kafka_b.skills[4].fx[0]);
      ui.pullEvents();
      pump(4);
      return shot();
    },
    lfBattle(wave, full) {
      const g = fresh('lf_cloud', ['trail', 'march', 'natasha', 'hook']);
      const b = g.startBattle({ encId: 'lf_phantylia', fromScript: true });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur;
      const wait = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) ui.update(1 / 10); };
      wait();
      while (b.wave + 1 < wave && !b.over) { b.enemies.forEach(e => { if (e.data.boss) { e.hp = 0; b.onZero(e, b.allies[0]); } }); b.cleanup(); ui.pullEvents(); wait(); }
      if (full) b.lfGauge = 120;
      wait();
      pump(6);
      return shot();
    },
    fullMap(map, flags) {
      const g = fresh(map), m = g.map, c = ui.ctx;
      Object.assign(g.state.flags, flags);
      const cv = document.createElement('canvas'); cv.width = m.w * 32; cv.height = m.h * 32;
      const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
      const saved = ui.ctx; ui.ctx = cx;
      const cam = ui.camera; ui.camera = () => [0, 0];
      const W0 = cv.width, H0 = cv.height;
      if (H.Gfx.drawMap) H.Gfx.drawMap(cx, m, 0, 0, ui.t, W0, H0); else for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) H.Gfx.drawTile(cx, m.def.theme, m.tiles[y][x], x, y, x * 32, y * 32);
      for (const e of m.ents) if (g.visible(e)) ui.drawEnt(cx, e, (e.kind === 'enemy' ? e.fx : e.x) * 32, (e.kind === 'enemy' ? e.fy : e.y) * 32);
      ui.ctx = saved; ui.camera = cam;
      c.fillStyle = '#000'; c.fillRect(0, 0, 640, 480);
      const s = Math.min(640 / cv.width, 480 / cv.height);
      c.imageSmoothingEnabled = s >= 1 ? false : true;
      c.drawImage(cv, 0, 0, cv.width * s, cv.height * s);
      return ui.canvas.toDataURL('image/png');
    },
    cg(id) { const g = fresh('express'); g.cg = id; pump(20); return shot(); },
    cine(id, i, t, gender) {
      const g = fresh('express');
      if (gender) g.state.gender = gender;
      const p = new H.Cine.Player(ui, id);
      p.i = Math.min(i, p.shots.length - 1); p.t = t; p.T = t + i * 3;
      p.draw(ui.ctx);
      return ui.canvas.toDataURL('image/png');
    },
    nav(map, kind, zoom, obj) {
      const g = fresh(map);
      g.state.obj = obj || 'Прогуляться по Белобогу: заглянуть в мастерскую «Незимье» (юго-восток)';
      g.state.anchors = Object.keys(H.MAPS).filter(id => H.mapLayout(id).anchors.length && id !== 'u_rivet').map(id => id + ':0');
      ui.openNav(null);
      const s = ui.top();
      if (zoom) s.zoom = Math.min(5, s.zoom + zoom);
      if (kind) { const i = s.points().findIndex(p => p.kind === kind || (kind === 'goalmark' && p.goal)); if (i >= 0) { s.sel = i; s.detail = kind !== 'goalmark'; } }
      s.snap = true; pump(2); return shot();
    },
    navArea(map, area) { const g = fresh(map); g.state.obj = 'Найти Олега в Большой шахте (южный выход)'; for (const f of ['fled', 'underworld']) g.state.flags[f] = true; ui.openNav(null, { area }); pump(2); return shot(); },
    starMap(map, flags) { const g = fresh(map || 'express'); Object.assign(g.state.flags, flags); g.state.obj = 'Прогуляться по Белобогу: заглянуть в мастерскую «Незимье» (юго-восток)'; ui.openStarMap(null); pump(2); return shot(); },
    hudEnergy(charge) {
      const g = fresh('j_plains'), r = g.state.roster;
      r.trail.energy = 120; r.march.energy = 30; r.danheng.energy = 75; r.himeko.energy = 0;
      g.placePlayer(9, 12); pump(30);
      if (charge) { g.useItem('spark', 'himeko'); g.useItem('sbiten'); pump(12); }
      return shot();
    },
    useEnergy(id) { const g = fresh('express'); g.state.roster.danheng.energy = 100; g.state.roster.march.energy = 42; ui.openMenu(); ui.openInventory(0); ui.useItemFlow(id); ui.top().sel = 1; pump(2); return shot(); },
    hudMap(map, x, y, obj) { const g = fresh(map); if (obj) g.state.obj = obj; if (x != null) { g.placePlayer(x, y); g.player.dir = 'right'; } pump(30); return shot(); },
    foeSheet(page) {
      const c = ui.ctx, G = H.Gfx, ids = Object.keys(H.ENEMIES).slice(page * 8, page * 8 + 8);
      const gr = c.createLinearGradient(0, 0, 0, 480); gr.addColorStop(0, '#20243e'); gr.addColorStop(1, '#3a3e5e');
      c.fillStyle = gr; c.fillRect(0, 0, 640, 480);
      ids.forEach((id, i) => {
        const d = H.ENEMIES[id], cx = 80 + (i % 4) * 160, base = i < 4 ? 200 : 440, size = d.boss ? 200 : d.elite ? 140 : 104;
        const s = Math.min(size, 170);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, base - 4, s * 0.3, 7, 0, 0, Math.PI * 2); c.fill();
        G.drawEnemy(c, d, cx, base - 6, s, { t: 0.3 });
        G.foeIcon(c, d, cx - 76, base + 4, 28);
        G.fieldEnemy(c, d, cx + 30, base - 2, 0.3, !!d.elite);
        ui.text(id, cx - 44, base + 12, { size: 10 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    bgs() {
      const c = ui.ctx, G = H.Gfx, ids = ['station', 'station2', 'express', 'snow', 'city', 'under', 'mine', 'rivet', 'ice', 'hill', 'sim', 'stellaron'];
      c.fillStyle = '#000'; c.fillRect(0, 0, 640, 480);
      c.imageSmoothingEnabled = true;
      ids.forEach((id, i) => { const x = (i % 3) * 213, y = Math.floor(i / 3) * 120; c.drawImage(G.bgCanvas(id, 640, 480), x, y, 212, 119); ui.text(id, x + 4, y + 4, { size: 10 }); });
      return ui.canvas.toDataURL('image/png');
    },
    foeIcons() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      Object.keys(H.ENEMIES).forEach((id, i) => {
        const d = H.ENEMIES[id], x = 10 + (i % 7) * 90, y = 10 + Math.floor(i / 7) * 110;
        G.foeIcon(c, d, x, y, 64);
        G.foeIcon(c, d, x + 66, y, 20, { round: true });
        G.foeIcon(c, d, x + 66, y + 24, 20);
        ui.text(id.slice(0, 11), x + 32, y + 68, { align: 'center', size: 9 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    foe(id) {
      const c = ui.ctx, G = H.Gfx, d = H.ENEMIES[id];
      c.fillStyle = '#2a2e48'; c.fillRect(0, 0, 640, 480);
      c.fillStyle = '#3a3e58'; c.fillRect(0, 300, 640, 180);
      const size = d.boss ? 200 : d.elite ? 140 : 104;
      G.drawEnemy(c, d, 170, 300, size);
      G.drawEnemy(c, d, 420, 300, size * 2 > 400 ? 400 : size * 2);
      G.fieldEnemy(c, d, 40, 380, ui.t, !!(d.elite || d.boss));
      c.save(); c.beginPath(); c.rect(100, 360, 34, 34); c.clip(); G.drawEnemy(c, d, 117, 396, 40); c.restore();
      ui.text(d.name, 20, 20, { size: 14, bold: true });
      return ui.canvas.toDataURL('image/png');
    },
    dialog(script, frames) { const g = fresh('express'); g.runScript(script); pump(frames || 40); return shot(); },
    skipRecap(script) { const g = fresh('express'); g.runScript(script); pump(60); ui.openSkip(); pump(2); return shot(); },
    skipping(script) { const g = fresh('express'); g.runScript(script); pump(60); ui.openSkip(); ui.top().key('ok', 'Enter'); pump(3); return shot(); },
    archiveStory() { const g = fresh('express'); g.state.recaps = ['Сосуд', 'Пробуждение', 'Первый бой', 'Аста у главного пульта', 'Арлан в Зоне хранения', 'Химико', 'Герта', 'Звёздный экспресс', 'Курс на Ярило-VI', 'Снежная равнина', 'Человек в сугробе', 'Снимок планеты', 'Город Сохранения', 'Аудиенция у Коколии']; ui.openBank(null); const s = ui.top(); s.tab = 4; s.sel = 6; pump(2); return shot(); },
    battleCmd(enemies, bg, party) { const g = fresh('j_plains', party); g.startBattle({ enemies, lvl: 20, bg, music: 'battle' }); ui.drainGameEvents(); pump(160); ui.battleKey(null, 'KeyT'); pump(1); return shot(); },
    menu() { fresh('j_belobog'); ui.openMenu(); ui.top().sel = 3; pump(2); return shot(); },
    missions(tab, sel, track) {
      const g = fresh('u_boulder');
      for (const m of H.TRAIL_MISSIONS.slice(0, 17)) for (const f of m.done.split('|')) g.state.flags[f] = true;
      g.state.missions.done = {}; for (const m of H.TRAIL_MISSIONS.slice(0, 17)) g.state.missions.done[m.id] = 1;
      g.state.obj = 'Найдите Сервал в мастерской «Незимье»';
      g.setQuest('hook_treasure', 'talk'); g.setQuest('hook_foreman', 'ask'); g.state.flags.hf_q_cook = true;
      if (track) g.trackMission(track);
      g.events.length = 0; ui.toasts = [];
      const s = ui.openMission(); s.tab = tab || 0; if (sel) s.selId = sel; pump(2); return shot();
    },
    questAt(map, quest, step, x, y, flags) {
      const g = fresh(map);
      for (const m of H.TRAIL_MISSIONS) for (const f of m.done.split('|')) g.state.flags[f] = true;
      for (const f of (flags || '').split(',').filter(Boolean)) g.state.flags[f] = true;
      g.state.quests[quest] = step; g.trackMission(quest); g.loadMap(map, null, { x, y, silent: true });
      g.player.dir = 'right'; ui.enterField(); ui.banner = null; pump(30); return shot();
    },
    phoneRail() { fresh('j_belobog'); ui.openMenu(); const s = ui.top(); s.toRail(2); pump(2); return shot(); },
    eventsNotice() { const g = fresh('express'); delete g.state.flags.events_note; pump(3); return shot(); },
    events(id, open, got, pick, lvl, will, outfits) {
      const g = fresh('express'), now = new Date(2026, 8, 29, 22, 47, 13).getTime(), hour = 3600000;
      if (outfits) g.state.outfits.push(...outfits);
      const all = got.filter(Boolean).length === H.COMET_GIFT.length;
      g.state.comet = { start: now - Math.max(0, open - 1) * hour - 1213000, done: all ? now - 5393000 : null, got: got.slice() };
      g.clock = () => now;
      if (lvl) g.setTrailLevel(lvl);
      g.state.will = (will || []).slice();
      ui.openEvents(id); ui.top().pick = pick || 0; pump(2); return shot();
    },
    mail(mode) {
      const g = fresh('express');
      g.state.mail = {}; g.mailSync();
      ui.openMail();
      const s = ui.top();
      if (mode === 1) { g.claimMail(H.MAIL[0].id); }
      if (mode === 2) { g.claimAllMail(); g.deleteReadMail(); for (const m of H.MAIL) g.readMail(m.id); g.deleteReadMail(); s.sel = 0; }
      if (mode === 3) { g.claimAllMail(); for (const m of H.MAIL) g.readMail(m.id); s.askDelete(); }
      if (mode === 4) s.select(g.mailbox().findIndex(x => x.m.id === 'v12_heroes'));
      if (mode === 5) s.select(g.mailbox().findIndex(x => x.m.id === 'v14_hares'));
      if (mode === 6 || mode === 7) s.select(g.mailbox().findIndex(x => x.m.id === 'v15_supply'));
      if (mode === 7) s.claim();
      if (mode === 8 || mode === 9) s.select(g.mailbox().findIndex(x => x.m.id === 'v16_guide'));
      if (mode === 9) { pump(1); for (let i = 0; i < 10; i++) s.key('right'); }
      pump(2); return shot();
    },
    chats(mode) {
      const g = fresh('express');
      g.state.chats = null;
      if (mode === 5) { g.state.flags = {}; ui.openChats(null); pump(2); return shot(); }
      if (mode >= 2) for (const f of ['ending', 'underworld', 'moles', 'night_talk', 'rivet_done', 'sampo_city', 'su_beta_done']) g.state.flags[f] = true;
      for (let i = 0; i < 6; i++) for (const id of g.chatSync()) if (mode >= 2 && id !== 'march_album' && id !== 'clara_picnic') g.chatAuto(id, true);
      g.events.length = 0;
      const who = mode === 2 || mode === 3 ? 'march' : mode === 4 ? null : 'herta';
      ui.openChats(who);
      const s = ui.top(), id = s.thread();
      if (mode === 0) { g.chatNext(id); s.wait = 0.4; }
      if (mode === 1) { g.chatNext(id); g.chatNext(id); g.chatPick(id, 1); g.chatNext(id); g.chatNext(id); g.chatNext(id); g.chatNext(id); s.rsel = 1; }
      if (mode === 2 || mode === 3) { g.chatThread(id).picks = [1, 0, 1]; g.chatAuto(id, true); s.scroll = mode === 2 ? 260 : 0; }
      if (mode === 4) s.focus = 'list';
      pump(mode === 0 ? 6 : 2); return shot();
    },
    chatNote() {
      const g = fresh('j_belobog');
      g.state.flags.sampo_city = true;
      pump(20); pump(6); return shot();
    },
    warpBanner(ban, star, opt) { const g = fresh('express'); g.state.inv.items.spass = 4; g.state.inv.items.tape = 10; g.state.inv.items.rtide = 10; g.state.inv.items.ftide = 5; g.state.inv.items.mana = 10; g.state.inv.items.vkey = 10; g.state.inv.items.badge = 11; if (!(opt && opt.unreg)) g.state.flags.con_reg = true; if (!(opt && opt.unsigned)) g.state.flags.velvet_contract = true; if (opt && opt.pity) Object.assign(g.pityOf(ban), opt.pity); if (star) { g.setEvStar(star); g.setConeStar(star); for (const b of ['sig', 'amp', 'conv', 'forge', 'guild', 'wiz', 'mid', 'comp', 'con', 'alley']) g.setStarOf(b, star); } ui.openWarp(() => {}); ui.top().ban = ban; pump(2); return shot(); },
    charSheet(id, extra) {
      if (H.CONTON && H.CONTON.KITS[id]) H.CONTON.register();
      const c = ui.ctx, G = H.Gfx, look = Object.assign({}, G.lookOf(id, null), extra || {});
      const gr = c.createLinearGradient(0, 0, 0, 480); gr.addColorStop(0, '#1a1c3a'); gr.addColorStop(1, '#4a4a70');
      c.fillStyle = gr; c.fillRect(0, 0, 640, 480);
      c.imageSmoothingEnabled = false;
      G.drawBust(c, look, 8, 8, 3);
      G.drawFigure(c, look, 300, 470, 4);
      c.drawImage(G.figureCanvas(look, 2), 400, 270);
      ['down', 'left', 'right', 'up'].forEach((d, i) => { const cv = G.spriteCanvas(look, d, 0); c.drawImage(cv, 420 + i * 52, 30, cv.width * 1.5, cv.height * 1.5); });
      [0, 1, 3].forEach((f, i) => { const cv = G.spriteCanvas(look, 'down', f); c.drawImage(cv, 420 + i * 52, 120, cv.width * 1.5, cv.height * 1.5); });
      G.drawPortrait(c, look, 520, 200, 34); G.drawPortrait(c, look, 560, 196, 44);
      return ui.canvas.toDataURL('image/png');
    },
    warpHistEv() {
      const g = fresh('express');
      g.state.jade = 99999;
      for (let i = 0; i < 6; i++) g.warp(10, i % 3 ? 'ev' : 'std');
      ui.openWarp(() => {}); ui.openWarpHistory('ev'); pump(2); return shot();
    },
    inventory(tab) { fresh('express'); ui.openMenu(); ui.openInventory(tab); ui.top().sel = 2; pump(2); return shot(); },
    archive() { const g = fresh('express'); for (const id of ['reaver', 'eliminator', 'flamespawn', 'soldier', 'gepard_b']) g.state.bank.enemies[id] = { seen: 3, kills: 2, contacts: { eager: 1 } }; ui.openBank(null); ui.top().sel = 1; pump(2); return shot(); },
    team() { fresh('express', ['trail', 'march', 'arlan']); ui.openMenu(); ui.openTeam(); ui.top().sel = 1; pump(2); return shot(); },
    info(k, page, top, lvl, end) { const g = fresh('express'); if (end) for (const f of ['jarilo_arrive', 'sampo_met', 'plains_met', 'belobog_intro', 'serval_met', 'fled', 'underworld', 'moles', 'seele_trial', 'rivet_intro', 'rivet_done', 'su_open', 'ending']) g.state.flags[f] = true; if (!g.state.roster[k]) g.debugChar(k, lvl, 0); g.state.roster[k].lvl = lvl; ui.openMenu(); ui.openChars(k); const s = ui.top(); s.sec = 5; s.infoPage = page; s.infoFocus = true; pump(1); s.infoSc.top = top; pump(1); return shot(); },
    chars(k, sec, star) { fresh('express'); ui.openMenu(); ui.openChars(k); const s = ui.top(); s.sec = sec; if (star != null) { s.star = star; s.starFocus = true; } pump(2); return shot(); },
    cones(k) { fresh('express'); ui.openMenu(); ui.openChars(k); ui.openConePick(k); ui.top().sel = 3; pump(2); return shot(); },
    eid(k, n, star, view) {
      const g = fresh('express'); g.state.roster[k].eid = n; delete g.state.roster[k].eidSeen;
      ui.openMenu(); ui.openChars(k); const s = ui.top(); s.sec = 4; if (star != null) { s.star = star; s.starFocus = true; }
      if (view) ui.openEidolonView(k);
      ui.t = 7.3; pump(2); return shot();
    },
    eidAsm(k, from, to, t) {
      const g = fresh('express'); Object.assign(g.state.roster[k], { eid: to, eidSeen: from });
      ui.openMenu(); ui.openChars(k); ui.top().sec = 4;
      pump(1); for (let i = 0; i < Math.round((t + 0.35) * 30); i++) ui.update(1 / 30); ui.render(); return shot();
    },
    eidSheet(n) {
      const E = Hsr98.Eidolons, keys = Object.keys(E.SCENES), cols = 4, cw = 320, ch = 240;
      const cv = document.createElement('canvas'); cv.width = cols * cw; cv.height = Math.ceil(keys.length / cols) * (ch + 14);
      const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height); c.font = '11px Tahoma'; c.fillStyle = '#fff';
      keys.forEach((k, i) => { const p = E.pic(k), x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 14); c.drawImage(n ? p.colorD : p.grayD, x, y + 14); c.fillText(k + ' · ' + E.SCENES[k].title, x + 4, y + 11); });
      return cv.toDataURL('image/png');
    },
    relics(k) { fresh('express'); ui.openMenu(); ui.openChars(k); ui.top().sec = 2; ui.openRelicPick(k, 2); pump(2); return shot(); },
    planarKit(k) {
      const g = fresh('express');
      g.give({ ornament: [{ set: 'station', n: 2, rl: 12 }, { set: 'salsotto', rl: 9 }, { set: 'vonwacq', rl: 6 }] });
      const pick = (set, slot) => g.state.inv.relics.find(r => r.set === set && r.slot === slot && !Object.values(g.state.roster).some(rr => Object.values(rr.relics).includes(r.uid)));
      const plan = { seele: 'station', march: 'salsotto' };
      for (const [who, set] of Object.entries(plan)) { g.autoEquip(who); for (const sl of ['sphere', 'rope']) { const r = pick(set, sl); if (r) g.equipRelic(who, r.uid); } }
      g.debugRelic({ set: 'eagle', slot: 'feet', main: 'spd', subs: ['spd', 'critR'], lvl: 15, roll: 1.2 });
      const feet = g.state.inv.relics[g.state.inv.relics.length - 1];
      g.equipRelic('seele', feet.uid);
      return g;
    },
    planar(k, slot) { this.planarKit(k); ui.openMenu(); ui.openChars(k); const s = ui.top(); s.sec = 2; s.slot = slot; s.slotFocus = true; pump(2); return shot(); },
    planarPick(k, slot) { this.planarKit(k); ui.openMenu(); ui.openChars(k); ui.top().sec = 2; ui.openRelicPick(k, slot); ui.top().sel = 1; pump(2); return shot(); },
    planarIcons() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      const sets = Object.keys(H.RELIC_SETS).concat(['none']);
      sets.forEach((set, j) => {
        const y = 8 + j * 32;
        H.RELIC_SLOTS.forEach((sl, i) => { G.rarityCell(c, 8 + i * 34, y, 30, 30, 4); G.itemIcon(c, 'relic:' + sl.key, 9 + i * 34, y + 1, 28, set); });
        ui.text(set, 220, y + 8, { size: 10 });
        if (set !== 'none' && H.RELIC_SETS[set].planar) { G.itemIcon(c, 'relic:sphere', 330, y - 8, 64, set); G.itemIcon(c, 'relic:rope', 400, y - 8, 64, set); G.itemIcon(c, 'relic:sphere', 470, y, 32, set); G.itemIcon(c, 'relic:rope', 506, y, 32, set); }
      });
      return ui.canvas.toDataURL('image/png');
    },
    anchor() { const g = fresh('hs_base'); const a = g.map.ents.find(e => e.kind === 'anchor'); ui.openAnchor(a, () => {}); pump(2); return shot(); },
    choice() { const g = fresh('express'); g.pending = { type: 'choice', options: [['Кофе, пожалуйста', 'a'], ['Лучше чай', 'b'], ['Ничего не надо', 'c']] }; pump(2); return shot(); },
    tut() { const g = fresh('express'); g.pending = { type: 'tut', text: 'Слабость врага отмечена значками стихий над его полосой здоровья. Бейте нужной стихией, чтобы сбить стойкость и пробить защиту.' }; pump(2); return shot(); },
    warpOne() { fresh('express'); ui.game.state.jade = 16000; ui.openWarp(() => {}); ui.game.state.pity.five = 59; ui.top().pull(1); const s = ui.top().show; s.begin([0]); s.rt = 4; s.fade = 0; pump(1, 0); return shot(); },
    fakeRes(best, n) {
      const P = H.WARP_POOL, out = [];
      for (let i = 0; i < n; i++) {
        const rar = i === 6 ? best : i === 3 && best >= 4 ? 4 : 3, pool = rar === 5 ? P.five : rar === 4 ? P.four : P.three, p = pool[(i * 3) % pool.length];
        out.push(p.startsWith('cone:') ? { rar, kind: 'cone', id: p.slice(5), name: H.CONES[p.slice(5)].name } : { rar, kind: 'char', id: p, name: H.CHARS[p].name, res: ['new', 'eid', 'credits'][i % 3] });
      }
      return out;
    },
    warpHistory(filter, page, empty) {
      const g = fresh('express');
      g.state.jade = 99999;
      if (!empty) for (let i = 0; i < 16; i++) g.warp(i % 4 === 1 ? 1 : 10);
      ui.openWarp(() => {}); ui.openWarpHistory();
      const s = ui.top(); s.filter = filter || 0; s.page = page || 0;
      pump(2);
      return shot();
    },
    archiveWarp() { const g = fresh('express'); g.state.jade = 99999; for (let i = 0; i < 6; i++) g.warp(10); ui.openBank(null); const s = ui.top(); s.tab = 3; s.sel = g.state.warpLog.findIndex(e => e.rar >= 4); pump(2); return shot(); },
    warpShow(res) { fresh('express'); ui.openWarp(() => {}); ui.top().start(res); return ui.top().show; },
    warpCine(best, t) { const s = hsrShots.warpShow(hsrShots.fakeRes(best, 10)); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    warpReveal(id, rar, t, outfit) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; if (outfit) res[0].outfit = outfit; const s = hsrShots.warpShow(res); s.begin([0]); s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    sigShow(res) { fresh('express'); ui.openWarp(() => {}); ui.top().ban = 'sig'; ui.top().start(res); return ui.top().show; },
    sigRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'miyabi', name: H.CHARS.miyabi.name, res: 'new' }; return out; },
    sigCine(best, t) { const s = hsrShots.sigShow(hsrShots.sigRes(best, 10)); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    sigReveal(id, rar, t, hop) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.sigShow(res); s.begin([0]); s.hop = hop ? 0.5 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    convShow(res, ban) { fresh('express'); ui.openWarp(() => {}); ui.top().ban = ban || 'conv'; ui.top().start(res); return ui.top().show; },
    midRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'yu', name: H.CHARS.yu.name, res: 'new' }; if (best >= 4) out[2] = { rar: 4, kind: 'char', id: 'chie', name: H.CHARS.chie.name, res: 'new' }; return out; },
    midCine(best, t) { const s = hsrShots.convShow(hsrShots.midRes(best, 10), 'mid'); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    midReveal(id, rar, t, hop) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.convShow(res, 'mid'); s.begin([0]); s.hop = hop ? 0.35 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    spotRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'amanda', name: H.CHARS.amanda.name, res: 'new' }; if (best >= 4) out[2] = { rar: 4, kind: 'char', id: 'guinaifen', name: H.CHARS.guinaifen.name, res: 'new' }; return out; },
    spotCine(best, t) { const s = hsrShots.convShow(hsrShots.spotRes(best, 10), 'con'); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    spotReveal(id, rar, t) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.convShow(res, 'con'); s.begin([0]); s.hop = 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    spotRack(best) { const s = hsrShots.convShow(hsrShots.spotRes(best || 5, 10), 'con'); s.toRack(); s.rt = 2; s.fade = 0; pump(1, 0); return shot(); },
    midRack(best) { const s = hsrShots.convShow(hsrShots.midRes(best || 5, 10), 'mid'); s.toRack(); s.rt = 2; s.fade = 0; pump(1, 0); return shot(); },
    convRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'phrolova', name: H.CHARS.phrolova.name, res: 'new' }; return out; },
    convCine(best, t) { const s = hsrShots.convShow(hsrShots.convRes(best, 10)); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    convReveal(id, rar, t, hop) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.convShow(res); s.begin([0]); s.hop = hop ? 0.4 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    ksRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'megumin', name: H.CHARS.megumin.name, res: 'new' }; if (best >= 4) out[2] = { rar: 4, kind: 'char', id: 'kazuma', name: H.CHARS.kazuma.name, res: 'new' }; return out; },
    ksCine(best, t) { const s = hsrShots.convShow(hsrShots.ksRes(best, 10), 'guild'); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    ksReveal(id, rar, t, hop) { const tg = { stelle: 'f', caelus: 'm' }[id]; if (tg) id = 'trail'; const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new', gender: tg } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.convShow(res, 'guild'); s.begin([0]); s.hop = hop ? 0.35 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    ksRack(best) { const s = hsrShots.convShow(hsrShots.ksRes(best || 5, 10), 'guild'); s.toRack(); s.rt = 2; s.fade = 0; pump(1, 0); return shot(); },
    convRack(best) { const s = hsrShots.convShow(hsrShots.convRes(best || 5, 10)); s.toRack(); s.rt = 2; s.fade = 0; pump(1, 0); return shot(); },
    sigRack(best) { const s = hsrShots.sigShow(hsrShots.sigRes(best || 5, 10)); s.toRack(); s.rt = 2; s.fade = 0; pump(1, 0); return shot(); },
    warpRack(best) { const s = hsrShots.warpShow(hsrShots.fakeRes(best || 5, 10)); s.toRack(); s.rt = 2.5; s.fade = 0; pump(1, 0); return shot(); },
    defeat() { const g = fresh('j_plains'); g.startBattle({ enemies: ['cocolia2:60'], lvl: 60, bg: 'stellaron', music: 'final', boss: true }); ui.drainGameEvents(); pump(40); for (const a of g.battle.allies) a.hp = 1; ui.bt.auto = true; for (let i = 0; i < 600 && !ui.bt.result; i++) ui.update(1 / 10); pump(5); return shot(); },
    opening() { ui.game = null; ui.mode = 'title'; ui.newGame(); pump(90); return shot(); },
    newName() { fresh('express'); ui.openName(); pump(2); return shot(); },
    saves() { fresh('express'); ui.writeSave(1); ui.openSaves('save'); pump(2); return shot(); },
    calyx() { fresh('express'); ui.openCalyx(() => {}); ui.top().sel = 1; pump(2); return shot(); },
    rumors() { const g = fresh('j_belobog'); g.state.flags.rumor_sword = true; ui.openRumors('sampo_belobog', () => {}); pump(2); return shot(); },
    warp() { fresh('express'); ui.openWarp(() => {}); pump(2); return shot(); },
    warpResult() { fresh('express'); ui.game.state.jade = 16000; ui.openWarp(() => {}); ui.top().pull(10); const s = ui.top().show; s.toRack(); s.rt = 2.5; s.fade = 0; pump(1, 0); return shot(); },
    shop(id) { fresh('u_boulder'); ui.openShop(id, () => {}); ui.top().sel = 5; pump(2); return shot(); },
    battle(enemies, bg, party, boss) {
      const g = fresh('j_plains', party);
      g.startBattle({ enemies, lvl: 20, bg, music: boss ? 'boss' : 'battle', boss: !!boss });
      ui.drainGameEvents();
      pump(160);
      return shot();
    },
    personaSheet() {
      fresh('express');
      const P = H.Personas, ids = Object.keys(P.ART).concat(Object.keys(P.AWAKE));
      ui.push({ full: true, draw(c) { c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480); ids.forEach((id, i) => { const x = 54 + (i % 6) * 106, y = 230 + Math.floor(i / 6) * 236; P.draw(c, id, x, y, 200, { t: 1.3 }); c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.fillText(id, x - 30, y + 4); }); }, key() {} });
      return shot();
    },
    p4Battle(mode) {
      const g = fresh('j_plains', ['yu', 'kanji', 'rise', 'yukiko']);
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'snow', music: 'battle' });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur, wait = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) ui.update(1 / 10); };
      const turnOf = id => { for (let i = 0; i < 30; i++) { wait(); if (b.current && b.current.charId === id) return b.current; ui.doAct('basic'); } return null; };
      for (const e of b.enemies) e.base.hp = e.maxHp = e.hp = e.dHp = e.hp * 6;
      if (mode === 'persona') { turnOf('yu'); ui.battleKey('down', 'ArrowDown'); wait(); ui.update(0.05); return shot(); }
      if (mode === 'stitch') { turnOf('kanji'); b.sp = 4; ui.bt.target = b.living[1]; ui.pickAct('skill'); ui.confirmAct(); turnOf('rise'); b.sp = 4; ui.bt.target = b.living[0]; ui.pickAct('skill'); ui.confirmAct(); wait(); return shot(); }
      turnOf('yu'); wait();
      b.living.forEach((e, i) => { if (i) { e.broken = true; e.tough = e.dTough = 0; } else e.tough = 1; });
      b.setSkill(b.current, 1); ui.bt.target = b.living[0]; ui.doAct('basic');
      if (mode === 'onemore') { for (let i = 0; i < 60 && !ui.bt.oneMore; i++) ui.update(1 / 20); for (let i = 0; i < 6; i++) ui.update(1 / 20); return shot(); }
      wait();
      if (mode === 'aoaask') { ui.update(0.05); return shot(); }
      ui.subKey('ok', 'Enter');
      for (let i = 0; i < 80 && !ui.bt.aoa; i++) ui.update(1 / 20);
      for (let i = 0; i < 12; i++) ui.update(1 / 20);
      return shot();
    },
    ccBattle(mode) {
      H.CONTON.register();
      const g = fresh('j_plains', ['makoto', 'amanda', 'talleah', 'natasha']);
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'snow', music: 'battle' });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur, wait = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) ui.update(1 / 10); };
      const turnOf = id => { for (let i = 0; i < 30; i++) { wait(); if (b.current && b.current.charId === id) return b.current; ui.doAct('basic'); } return null; };
      const until = (fn, n) => { for (let i = 0; i < (n || 300) && !fn(); i++) ui.update(1 / 30); };
      const of = id => b.allies.find(a => a.charId === id), cc = () => ui.bt.cc || {};
      for (const e of b.enemies) e.hp = e.maxHp = e.dHp = e.hp * 8;
      const mk = of('makoto'), am = of('amanda'), tl = of('talleah'), na = of('natasha');
      wait();
      if (mode === 'mk') { turnOf('makoto'); b.sp = 4; ui.bt.target = b.living[1]; ui.pickAct('skill'); ui.confirmAct(); until(() => cc().steals && cc().steals.length); pump(3); return shot(); }
      if (mode === 'portal' || mode === 'heist') {
        turnOf('makoto'); b.setShiny(mk, 3); mk.energy = mk.maxEnergy; ui.pullEvents(); ui.doUlt(mk); wait(); pump(20);
        if (mode === 'portal') return shot();
        for (let i = 0; i < 400 && !(cc().cut && cc().cut.kind === 'heist'); i++) { if (idle()) ui.doAct('basic'); ui.update(1 / 10); }
        until(() => cc().cut && cc().cut.t > 0.36, 40);
        ui.render(); return shot();
      }
      if (mode === 'am') { na.hp = na.dHp = Math.round(na.maxHp * 0.2); b.contonHurt(na); ui.pullEvents(); until(() => cc().cut && cc().cut.kind === 'call' && cc().cut.t > 0.42); return shot(); }
      if (mode === 'am2') {
        b.transform(am, true); for (const a of b.allies) b.cocoon(am, a, 0.45, 60, 3); ui.pullEvents(); wait();
        b.hit(b.living[0], na, 0, { raw: na.shield + 1 }); b.cleanup(); ui.pullEvents();
        until(() => cc().burst && cc().burst.t > 0.3); return shot();
      }
      if (mode === 'tl') { turnOf('talleah'); b.sp = 4; ui.bt.target = b.living[1]; ui.pickAct('skill'); ui.confirmAct(); until(() => cc().gyn && cc().gyn.shotT > 0 && cc().gyn.shotT < 0.32, 600); return shot(); }
      if (mode === 'squad') { turnOf('talleah'); tl.energy = tl.maxEnergy; ui.doUlt(tl); until(() => cc().gyn && cc().gyn.shotT > 0 && cc().gyn.shotT < 0.32 && cc().gyn.u.flags.squad > 0, 900); return shot(); }
      if (mode === 'capsule') { tl.hp = 1; b.hit(b.living[0], tl, 0, { raw: 99 }); ui.pullEvents(); until(() => tl.dAway === 'capsule' && cc().gyn); pump(14); return shot(); }
      if (mode === 'clap') { b.applause(mk); ui.pullEvents(); until(() => cc().clap && cc().clap.t > 0.32); return shot(); }
      return shot();
    },
    haresBattle(mode) {
      const g = fresh('j_plains', ['billy', 'nicole', 'anby', 'natasha']);
      g.startBattle({ enemies: ['gunner:20', 'gunner:20', 'gunner:20'], lvl: 20, bg: 'snow', music: 'battle' });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur, wait = () => { for (let i = 0; i < 900 && !idle() && !ui.chainOpen() && !b.over; i++) ui.update(1 / 10); };
      const turnOf = id => { for (let i = 0; i < 30; i++) { wait(); if (ui.chainOpen()) { ui.chainPick(null); continue; } if (b.current && b.current.charId === id) return b.current; ui.doAct('basic'); } return null; };
      const of = id => b.allies.find(a => a.charId === id);
      for (const e of b.enemies) { e.hp = e.maxHp = e.dHp = e.hp * 8; e.tough = e.maxTough = 200; }
      wait();
      if (mode === 'field') { turnOf('nicole'); b.sp = 4; ui.bt.target = b.living[1]; ui.pickAct('skill'); ui.confirmAct(); wait(); pump(20); return shot(); }
      if (mode === 'chain') {
        turnOf('anby');
        for (const e of b.enemies) { e.tough = 1; e.broken = false; }
        ui.bt.target = b.living[1]; ui.pickAct('basic'); ui.confirmAct(); wait(); pump(20); return shot();
      }
      if (mode === 'pips') {
        b.setSteady(of('billy'), 2); b.setStar(of('billy'), 1); b.setSeries(of('anby'), 3); of('nicole').flags.caseShots = 1;
        b.push({ t: 'case', u: of('nicole'), v: 1 }); ui.pullEvents(); wait(); pump(20); return shot();
      }
      return shot();
    },
    battlePlay(enemies, bg, party, keys, boss) {
      const g = fresh('j_plains', party);
      g.startBattle({ enemies, lvl: 20, bg, music: boss ? 'boss' : 'battle', boss: !!boss });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur;
      const wait = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) ui.update(1 / 10); };
      for (const k of keys) {
        wait();
        if (k === ' ') ui.battleKey('ok', 'Space');
        else if (k === '>') ui.battleKey('right', 'ArrowRight');
        else if (k === '^') ui.battleKey('up', 'ArrowUp');
        else if (k === 'v') ui.battleKey('down', 'ArrowDown');
        else ui.battleKey(null, 'Key' + k);
      }
      wait();
      pump(30);
      return shot();
    },
    ultShot(id, beat, t, aim, outfit) {
      const key = id === 'trail_p' ? 'trail' : id, party = [key, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => k !== key)].slice(0, 4);
      const g = fresh('j_plains', party);
      if (outfit) g.debugOutfit(outfit, true);
      if (id === 'trail_p') g.state.mcPath = 'trail_p';
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'station', music: 'battle' });
      ui.drainGameEvents();
      pump(40);
      const b = g.battle, u = b.allies[0];
      const lay = [...ui.enemyLayout()].map(([e, p]) => ({ u: e, x: p.x / 2, y: p.y / 2, s: p.s / 2 }));
      const ab = H.CHARS[id].ult, support = ['allies', 'self'].includes(ab.target);
      const foes = aim === 'none' || (!aim && support) ? [] : aim === 'one' || (!aim && ab.target === 'single') ? lay.slice(1, 2) : lay;
      const sh = new H.Ults.Show(ui, u, { foes, allies: ab.target === 'self' ? [u] : b.allies, bg: 'station' });
      sh.i = Math.min(beat, sh.beats.length - 1); sh.t = t; sh.T = t + sh.i;
      ui.hits = [];
      sh.draw(ui.ctx);
      return ui.canvas.toDataURL('image/png');
    },
    skinShot(id, t, aim, outfit) {
      const party = [id, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => k !== id)].slice(0, 4);
      const g = fresh('j_plains', party);
      g.debugOutfit(outfit, true);
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'station', music: 'battle' });
      ui.drainGameEvents();
      pump(40);
      const b = g.battle, u = b.allies[0];
      const lay = [...ui.enemyLayout()].map(([e, p]) => ({ u: e, x: p.x / 2, y: p.y / 2, s: p.s / 2 }));
      const foes = aim === 'none' ? [] : aim === 'one' ? lay.slice(1, 2) : lay;
      const sh = new H.SkillShow(ui, u, { foes, bg: 'station' });
      sh.t = t; sh.T = t;
      ui.hits = [];
      sh.draw(ui.ctx);
      return ui.canvas.toDataURL('image/png');
    },
    fusShot(id, beat, t, aim, outfit) {
      const f = H.FUSIONS[id], keys = f.members.map(k => k === 'trail_p' ? 'trail' : k), party = [...keys, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => !keys.includes(k))].slice(0, 4);
      const g = fresh('j_plains', party);
      if (outfit) g.debugOutfit(outfit, true);
      if (f.members.includes('trail_p')) g.state.mcPath = 'trail_p';
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'station', music: 'battle' });
      ui.drainGameEvents();
      pump(40);
      const b = g.battle, mem = f.members.map(k => b.allies.find(a => a.charId === k));
      const lay = [...ui.enemyLayout()].map(([e, p]) => ({ u: e, x: p.x / 2, y: p.y / 2, s: p.s / 2 }));
      const foes = aim === 'none' ? [] : aim === 'one' || (!aim && f.target === 'single') ? lay.slice(1, 2) : lay;
      const sh = new H.Fusions.Show(ui, mem, { id, foes, allies: b.allies, bg: 'station' });
      sh.i = Math.min(beat, sh.beats.length - 1); sh.t = t; sh.T = t + sh.i;
      ui.hits = [];
      sh.draw(ui.ctx);
      return ui.canvas.toDataURL('image/png');
    },
    fusLive(sec) {
      const g = fresh('j_plains', ['march', 'danheng', 'himeko', 'natasha']);
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'station', music: 'battle' });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle;
      for (let i = 0; i < 300 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 30);
      for (const a of b.allies) a.energy = a.maxEnergy;
      ui.battleKey(null, 'KeyR'); ui.battleKey('ok', 'Enter');
      for (let i = 0; i < Math.round(sec * 30); i++) ui.update(1 / 30);
      return shot();
    },
    ultLive(id, sec) {
      const key = id === 'trail_p' ? 'trail' : id, party = [key, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => k !== key)].slice(0, 4);
      const g = fresh('j_plains', party);
      if (id === 'trail_p') g.state.mcPath = 'trail_p';
      g.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'station', music: 'battle' });
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle;
      for (let i = 0; i < 300 && !(b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) ui.update(1 / 30);
      b.allies[0].energy = b.allies[0].maxEnergy;
      ui.battleKey(null, 'Digit1');
      for (let i = 0; i < Math.round(sec * 30); i++) ui.update(1 / 30);
      return shot();
    },
    battleUlt(enemies, bg, party) {
      const g = fresh('j_plains', party);
      for (const k of party) g.state.roster[k].energy = 200;
      g.startBattle({ enemies, lvl: 20, bg, music: 'battle' });
      ui.drainGameEvents();
      pump(160);
      return shot();
    },
    result() {
      const g = fresh('j_plains', ['trail', 'march', 'arlan', 'himeko']);
      g.startBattle({ enemies: ['reaver:5', 'eliminator:5'], lvl: 5, bg: 'snow', music: 'battle' });
      ui.drainGameEvents();
      pump(40);
      ui.bt.auto = true;
      for (let i = 0; i < 400 && !ui.bt.result; i++) ui.update(1 / 10);
      pump(10);
      return shot();
    },
    sprites() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#39406a'; c.fillRect(0, 0, 640, 480);
      const ids = Object.keys(H.CHARS).concat(['pompom', 'kafka', 'silverwolf', 'cocolia', 'oleg', 'clara', 'svarog', 'guard']);
      ids.forEach((id, i) => {
        const look = G.lookOf(id, null), x = 8 + (i % 13) * 48, y = 20 + Math.floor(i / 13) * 150;
        ['down', 'left', 'right'].forEach((d, j) => G.drawSprite(c, look, d, 0, x, y + 16 + j * 46));
        ui.text(id.slice(0, 7), x + 16, y + 150 - 14, { align: 'center', size: 9 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    portraits() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      const ids = Object.keys(H.CHARS).concat(['pompom', 'kafka', 'silverwolf', 'cocolia', 'oleg', 'clara', 'svarog']);
      ids.forEach((id, i) => {
        const x = 6 + (i % 8) * 79, y = 6 + Math.floor(i / 8) * 118;
        G.drawPortrait(c, G.lookOf(id, null), x, y, 72);
        ui.text(id, x + 36, y + 76, { align: 'center', size: 10 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    busts(page) {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#3a3f5c'; c.fillRect(0, 0, 640, 480);
      const ids = ['trail', 'trail_f', 'march', 'danheng', 'himeko', 'welt', 'natasha', 'serval', 'asta', 'arlan', 'herta', 'gepard', 'bronya', 'seele', 'sampo', 'hook', 'pela', 'kafka', 'silverwolf', 'cocolia', 'clara', 'oleg', 'pompom', 'svarog', 'guard', 'miner', 'scientist', 'townswoman'];
      const list = ids.slice(page * 12, page * 12 + 12);
      list.forEach((id, i) => {
        const x = 8 + (i % 4) * 158, y = 6 + Math.floor(i / 4) * 158;
        const look = id === 'trail_f' ? G.trailLook('f') : G.lookOf(id, null);
        G.drawBust(c, look, x, y, 2);
        G.drawPortrait(c, look, x + 130, y + 2, 24);
        ui.text(id, x + 4, y + 132, { size: 11 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    figures(page) {
      const c = ui.ctx, G = H.Gfx;
      const gr = c.createLinearGradient(0, 0, 0, 480); gr.addColorStop(0, '#1a1c3a'); gr.addColorStop(1, '#4a4a70');
      c.fillStyle = gr; c.fillRect(0, 0, 640, 480);
      const ids = ['trail', 'trail_f', 'march', 'danheng', 'himeko', 'welt', 'natasha', 'serval', 'asta', 'arlan', 'herta', 'gepard', 'bronya', 'seele', 'sampo', 'hook', 'pela', 'kafka', 'silverwolf', 'cocolia'];
      const list = ids.slice(page * 10, page * 10 + 10);
      list.forEach((id, i) => {
        const x = 66 + (i % 5) * 126, y = 226 + Math.floor(i / 5) * 238;
        const look = id === 'trail_f' ? G.trailLook('f') : G.lookOf(id, null);
        G.drawFigure(c, look, x, y, 2);
        ui.text(id, x, y - 2, { size: 10, align: 'center' });
      });
      return ui.canvas.toDataURL('image/png');
    },
    zoom(ids) {
      const c = ui.ctx, G = H.Gfx, list = ids.split(',');
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#3a3f5c'; c.fillRect(0, 0, 640, 480);
      const w = Math.floor(624 / list.length);
      list.forEach((id, i) => {
        const [name, kind] = id.split(':');
        const look = name === 'trail_f' ? G.trailLook('f') : G.lookOf(name, null);
        if (kind === 'fig') { const cv = G.figureCanvas(look), s = Math.min(Math.floor(w / 48), 4); c.drawImage(cv, 8 + i * w, 8, 48 * s, 96 * s); }
        else { const s = Math.min(w / 64, 7); c.drawImage(G.bustCanvas(look, 64), 8 + i * w, 8, 64 * s, 64 * s); }
      });
      return ui.canvas.toDataURL('image/png');
    },
    suKit(world, path, extra) {
      const g = fresh('hs_office', ['trail', 'march', 'danheng', 'natasha']);
      for (const f of ['su_open', 'su_beta_done', 'su_clear_1', 'first_gepard']) g.state.flags[f] = true;
      g.state.suPaths = Object.keys(H.SU.PATHS);
      if (world) {
        g.suStart(world, path || 'remembrance', g.state.party);
        if (extra !== false) {
          for (const id of ['r_alienation', 'r_hardship', 'r_fuli', 'p_sentinel', 'h_edge', 'e_suspiria']) g.suAddBless(id);
          g.state.su.bless[2].lvl = 2;
          for (const id of ['c_cheese', 'c_coin', 'c_wax_remembrance']) g.suAddCurio(id);
          g.state.su.frag = 236;
          g.state.su.hp.march = Math.round(g.suHpOf('march').max * 0.35);
          g.state.su.en.trail = 60;
        }
        ui.drainGameEvents(); ui.banner = null; ui.toasts = [];
      }
      return g;
    },
    suTerm(step, psel) {
      const g = this.suKit(0);
      g.state.suPaths = ['preservation', 'remembrance', 'elation', 'hunt'];
      g.state.suClaims = [{ world: 1, sets: [{ set: 'vonwacq', rl: 3 }] }];
      ui.openSuTerminal(() => {});
      const s = ui.top();
      s.wsel = 1; s.step = step; s.psel = psel != null ? psel : 1;
      pump(2); return shot();
    },
    suField(kind) {
      const g = this.suKit(2);
      if (kind === 1) { g.state.su.dom.cleared = true; for (const e of g.map.ents) if (e.kind === 'enemy') e.dead = true; const p = g.map.ents.find(e => e.kind === 'portal' && e.def.slot === 1); g.placePlayer(p.x + 3, p.y); g.player.dir = 'left'; }
      else if (kind === 2) { g.suEnter('respite'); const h = g.map.ents.find(e => e.kind === 'npc'); g.placePlayer(h.x, h.y + 2); g.player.dir = 'up'; }
      else if (kind === 3) { g.state.su.d = 3; g.suEnter('event'); const f = g.map.ents.find(e => e.kind === 'su_frame'); g.placePlayer(f.x, f.y + 2); g.player.dir = 'up'; }
      else { const e = g.map.ents.find(x => x.kind === 'enemy' && x.ch === '1'); g.placePlayer(e.x, e.y + 3); g.player.dir = 'up'; }
      ui.banner = null; ui.toasts = [];
      pump(30); return shot();
    },
    suEvent() {
      const g = this.suKit(2);
      Object.assign(g.state.su.dom, { type: 'event', layout: 'su_event', cleared: false, event: 'robot' });
      g.loadMap('su_event', 's', { silent: true });
      g.runScript('su_ev_robot');
      ui.toasts = []; pump(60); return shot();
    },
    suAeon() {
      const g = this.suKit(2);
      g.state.suPaths = ['preservation', 'remembrance'];
      g.runScript('su_aeon_hunt');
      ui.toasts = []; pump(80); return shot();
    },
    suBless(two) {
      const g = this.suKit(2);
      if (two) g.suAddCurio('c_dice');
      g.pending = { type: 'ui', ui: 'su_bless', opts: ['r_independence', 'h_victory', 'a_dew'], why: 'Победа в бою' };
      ui.toasts = []; pump(2);
      ui.top().sel = 1;
      if (two) ui.top().picks = [0];
      pump(2); return shot();
    },
    suCurio() {
      const g = this.suKit(2);
      g.pending = { type: 'ui', ui: 'su_curio', opts: ['c_gown', 'c_fruit', 'c_coin'], why: 'Награда за элиту' };
      ui.toasts = []; pump(2); ui.top().sel = 1; pump(20); return shot();
    },
    suShop() {
      const g = this.suKit(2);
      g.suEnter('respite');
      g.state.su.hp.danheng = 0;
      g.pending = { type: 'ui', ui: 'su_shop' };
      ui.toasts = []; ui.banner = null; pump(2); ui.top().sel = 1; pump(2); return shot();
    },
    suEnh() {
      const g = this.suKit(2);
      g.state.su.frag = 420;
      g.pending = { type: 'ui', ui: 'su_enhance' };
      ui.toasts = []; pump(2); ui.top().sel = 1; pump(2); return shot();
    },
    suEnd(win) {
      const g = this.suKit(2);
      for (const t of ['combat', 'event', 'elite', 'respite', 'combat']) g.state.su.log.push(t);
      if (win) g.suComplete(); else g.suFail();
      ui.toasts = []; pump(3); return shot();
    },
    suRun(tab) {
      const g = this.suKit(2);
      g.state.su.log.push('event', 'combat', 'elite');
      g.state.su.d = 3;
      ui.openSuRun(); ui.top().tab = tab; ui.top().sel = 1;
      ui.toasts = []; pump(2); return shot();
    },
    suBattle(kind) {
      const g = this.suKit(2);
      if (kind === 2) { for (const k of g.state.su.team) g.state.su.hp[k] = 1; g.state.su.dom.groups[1].lvl = 90; }
      g.encounter(g.map.ents.find(e => e.kind === 'enemy' && e.ch === '1'), kind === 2 ? 'enemy' : 'player');
      ui.drainGameEvents();
      ui.bt.auto = false;
      const b = g.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur;
      for (let i = 0; i < 400 && !idle() && !b.over; i++) ui.update(1 / 10);
      if (kind === 0) { b.su.res.energy = 70; pump(30); return shot(); }
      ui.bt.auto = true;
      for (let i = 0; i < 3000 && !ui.bt.result; i++) ui.update(1 / 10);
      pump(5); return shot();
    },
    quest(kind) {
      const g = fresh('hs_control');
      g.state.obj = 'Отправиться на Ярило-VI';
      g.chatSync(); g.chatAuto('herta_test');
      g.placePlayer(17, 10); g.player.dir = 'up';
      ui.toasts = []; ui.banner = null;
      if (kind === 1) ui.openMission();
      if (kind === 2) ui.openNav(null, { area: 'hs_office', quest: 'su_beta' });
      pump(kind ? 2 : 30); ui.toasts = []; return shot();
    },
    suIcons() {
      const c = ui.ctx, G = H.Gfx, SU = H.SU;
      c.fillStyle = '#140c2e'; c.fillRect(0, 0, 640, 480);
      SU.CURIOS.forEach((cu, i) => { const x = 8 + (i % 12) * 52, y = 8 + Math.floor(i / 12) * 60; G.rarityCell(c, x, y, 48, 48, cu.bad ? 1 : 4); G.curioIcon(c, cu.id, x + 8, y + 6, 32); ui.text(cu.id.slice(2, 10), x + 24, y + 49, { align: 'center', size: 8 }); });
      Object.values(SU.EVENTS).forEach((ev, i) => { const x = 8 + (i % 7) * 90, y = 140 + Math.floor(i / 7) * 92; c.fillStyle = '#2a1a50'; c.fillRect(x, y, 80, 80); G.suEventIcon(c, ev.art, x + 8, y + 4, 64); ui.text(ev.art, x + 40, y + 68, { align: 'center', size: 9 }); });
      Object.keys(SU.PATHS).forEach((p, i) => { G.pathIcon(c, p, 10 + i * 60, 340, 40, SU.PATHS[p].col); G.pathIcon(c, p, 10 + i * 60, 388, 16); ui.text(p.slice(0, 9), 30 + i * 60, 408, { align: 'center', size: 9 }); });
      ['su_portal', 'su_frame', 'su_heal', 'su_tp'].forEach((k, i) => G.drawObject(c, k, 470 + i * 40, 420, { col: '#ff6a5a' }, 1));
      G.itemIcon(c, 'frag', 440, 340, 32);
      return ui.canvas.toDataURL('image/png');
    },
    glyphs(bg) {
      const c = ui.ctx, G = H.Gfx, paths = Object.keys(H.PATHS).concat(Object.keys(H.SU.PATHS).filter(p => !H.PATHS[p]));
      c.fillStyle = bg || '#20243a'; c.fillRect(0, 0, 640, 480);
      c.fillStyle = '#f2e6c8'; c.fillRect(0, 404, 640, 76);
      H.ELEMENT_KEYS.forEach((e, i) => {
        const x = 30 + i * 88;
        [4, 5, 6, 7, 9, 12].forEach((r, j) => G.elemIcon(c, e, x + (j % 3) * 26, 24 + Math.floor(j / 3) * 34, r));
        G.elemIcon(c, e, x + 26, 132, 24);
        G.elemIcon(c, e, x + (i % 2 ? 0 : 26), 430, 7);
        G.elemIcon(c, e, x + 26, 456, 9);
        ui.text(H.ELEMENTS[e].short, x + 26, 160, { align: 'center', size: 9 });
      });
      paths.forEach((p, i) => {
        const x = 8 + i * 70, col = (H.SU.PATHS[p] || {}).col;
        [11, 12, 14, 16, 20].forEach((s, j) => G.pathIcon(c, p, x + (j % 3) * 22, 176 + Math.floor(j / 3) * 24, s));
        G.pathIcon(c, p, x, 228, 32, col);
        G.pathIcon(c, p, x + 34, 228, 28, '#ffffff');
        G.pathIcon(c, p, x, 268, 64, col);
        ui.text(p.slice(0, 9), x + 32, 334, { align: 'center', size: 9 });
        G.pathIcon(c, p, x + 4, 412, 14, '#7a5a2a');
        G.pathIcon(c, p, x + 24, 412, 24, '#3a2a14');
      });
      return ui.canvas.toDataURL('image/png');
    },
    iconGroups() {
      const I = H.ITEMS, lines = (mat, keys) => keys.map(l => [l, [1, 2, 3].map(t => l + t)]), byKind = k => Object.keys(I).filter(id => I[id].kind === k);
      return {
        path: lines('path', ['dest', 'hunt', 'erud', 'harm', 'nihil', 'pres', 'abund', 'memo', 'elat']),
        foe: lines('foe', ['core', 'legion', 'silver', 'ancient', 'scion', 'artifex']),
        echo: [['echo', ['echo_doom', 'echo_lament', 'echo_ochema', 'echo_borehole']], ['5star', ['tracks', 'shadow_dest', 'shadow_pres']], ['synth', ['remains', 'resin']]],
        syn: [['syn2', H.SYN_MATS.slice(0, 5)], ['syn2b', H.SYN_MATS.slice(5, 6)], ['syn3', H.SYN_MATS.slice(6)]],
        food: [['food1', byKind('food').slice(0, 5)], ['food2', byKind('food').slice(5, 10)], ['food3', byKind('food').slice(10)]],
        exp: [['exp', ['exp1', 'exp2', 'exp3']], ['rcp1', byKind('recipe').slice(0, 6)], ['rcp2', byKind('recipe').slice(6)]]
      };
    },
    sheetCanvas(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.fillStyle = '#20243a'; c.fillRect(0, 0, w, h); return [cv, c]; },
    sheetOut(cv, gray) {
      if (!gray) return cv.toDataURL('image/png');
      const [g2, c2] = this.sheetCanvas(cv.width, cv.height); c2.filter = 'grayscale(1)'; c2.drawImage(cv, 0, 0); return g2.toDataURL('image/png');
    },
    sheetLabel(c, s, x, y, col) { c.fillStyle = col || '#e8e0c8'; c.font = '10px Tahoma, sans-serif'; c.textBaseline = 'top'; c.fillText(s, x, y); },
    relicSheet(kind, gray) {
      const G = H.Gfx, sizes = [18, 32, 40, 64];
      const slots = H.RELIC_SLOTS.filter(s => s.kind === kind), sets = (kind === 'cavern' ? H.CAVERN_SETS : H.PLANAR_SETS).concat(['none']);
      const bw = sizes.reduce((a, s) => a + s + 8, 0) + 6, rh = 76;
      const [cv, c] = this.sheetCanvas(130 + slots.length * bw, 24 + sets.length * rh);
      slots.forEach((sl, i) => this.sheetLabel(c, sl.name, 130 + i * bw, 6));
      sets.forEach((set, j) => {
        const y = 24 + j * rh, d = H.RELIC_SETS[set];
        this.sheetLabel(c, set, 6, y + 4);
        if (d) this.sheetLabel(c, d.name.slice(0, 20), 6, y + 18, '#9aa0c0');
        slots.forEach((sl, i) => {
          let x = 130 + i * bw;
          for (const s of sizes) { G.rarityCell(c, x - 2, y - 2 + 66 - s, s + 4, s + 4, 4); G.itemIcon(c, 'relic:' + sl.key, x, y + 66 - s, s, set); x += s + 8; }
          if (d && d.pieces && d.pieces[sl.key]) this.sheetLabel(c, d.pieces[sl.key].slice(0, 28), 130 + i * bw, y + 66, '#9aa0c0');
        });
      });
      return this.sheetOut(cv, gray);
    },
    itemSheet(group, gray) {
      const G = H.Gfx, sizes = [18, 32, 40, 64], rows = this.iconGroups()[group];
      const per = Math.max(...rows.map(r => r[1].length)), bw = sizes.reduce((a, s) => a + s + 8, 0) + 10, rh = 92;
      const [cv, c] = this.sheetCanvas(70 + per * bw, 10 + rows.length * rh);
      rows.forEach(([label, ids], j) => {
        const y = 10 + j * rh;
        this.sheetLabel(c, label, 6, y + 4);
        ids.forEach((id, i) => {
          let x = 70 + i * bw;
          const rar = (H.ITEMS[id] && H.ITEMS[id].rar) || 3;
          for (const s of sizes) { G.rarityCell(c, x - 2, y - 2 + 66 - s, s + 4, s + 4, rar); G.itemIcon(c, id, x, y + 66 - s, s); x += s + 8; }
          G.itemSilhouette(c, id, x - 26, y + 70, 18);
          this.sheetLabel(c, (H.ITEMS[id] ? H.ITEMS[id].name : id).slice(0, 30), 70 + i * bw, y + 70, '#9aa0c0');
        });
      });
      return this.sheetOut(cv, gray);
    },
    iconCheck() {
      const G = H.Gfx, mask = c => { const d = c.getContext('2d').getImageData(0, 0, 32, 32).data, m = new Uint8Array(1024); for (let i = 0; i < 1024; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0; return m; };
      const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < 1024; k++) { i += a[k] & b[k]; u += a[k] | b[k]; } return u ? i / u : 1; };
      const area = m => m.reduce((a, v) => a + v, 0);
      const box = m => { let x0 = 32, y0 = 32, x1 = -1, y1 = -1; for (let k = 0; k < 1024; k++) if (m[k]) { const x = k % 32, y = k >> 5; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x1 - x0 + 1, y1 - y0 + 1]; };
      const rep = { relicPairs: [], relicMissing: [], tiers: [], small: [], foodPairs: [] };
      for (const sl of H.RELIC_SLOTS) {
        const sets = sl.kind === 'cavern' ? H.CAVERN_SETS : H.PLANAR_SETS, lim = sl.key === 'feet' ? 0.9 : sl.key === 'sphere' ? 0.92 : 0.85;
        for (const s of sets) if (!(G.RELIC_PIECE[s] && G.RELIC_PIECE[s][sl.key])) rep.relicMissing.push(s + ':' + sl.key);
        const ms = sets.map(s => mask(G.itemCanvas('relic:' + sl.key, s, 32)));
        for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) { const v = iou(ms[i], ms[j]); if (v > lim) rep.relicPairs.push([sl.key, sets[i], sets[j], +v.toFixed(2)]); }
      }
      const groups = this.iconGroups();
      for (const [line, ids] of groups.path.concat(groups.foe)) { const a = ids.map(id => area(mask(G.itemCanvas(id, null, 32)))); rep.tiers.push([line, a, +(a[2] / Math.max(1, a[0])).toFixed(2)]); }
      for (const id of Object.keys(H.ITEMS)) { const b = box(mask(G.itemCanvas(id, null, 32))); if (b[0] < 22 && b[1] < 22) rep.small.push([id, b]); }
      const food = Object.keys(H.ITEMS).filter(id => H.ITEMS[id].kind === 'food'), fm = food.map(id => mask(G.itemCanvas(id, null, 32)));
      for (let i = 0; i < food.length; i++) for (let j = i + 1; j < food.length; j++) { const v = iou(fm[i], fm[j]); if (v > 0.85) rep.foodPairs.push([food[i], food[j], +v.toFixed(2)]); }
      return 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(rep, null, 1))));
    },
    icons() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      const ids = Object.keys(H.ITEMS).concat(['jade', 'credits', 'power', 'tp', 'relic:head', 'relic:hands', 'relic:body', 'relic:feet']);
      ids.forEach((id, i) => {
        const x = 8 + (i % 12) * 52, y = 8 + Math.floor(i / 12) * 64;
        G.rarityCell(c, x, y, 48, 48, (H.ITEMS[id] && H.ITEMS[id].rar) || 3);
        G.itemIcon(c, id, x + 8, y + 6, 32, 'firesmith');
        ui.text(id.replace('relic:', 'r:').slice(0, 9), x + 24, y + 50, { align: 'center', size: 9 });
      });
      Object.keys(H.PATHS).forEach((p, i) => { G.pathIcon(c, p, 10 + i * 40, 150, 24); G.pathIcon(c, p, 10 + i * 40, 180, 16, '#ffffff'); });
      Object.keys(G.STAT_ART).forEach((st, i) => { G.statIcon(c, st, 300 + i * 24, 150, 16); G.statIcon(c, st, 300 + i * 24, 172, 12, '#ffe8a0'); });
      Object.keys(G.MENU_ART).forEach((m, i) => { G.menuIcon(c, m, 10 + (i % 8) * 70, 210 + Math.floor(i / 8) * 60, 32); ui.text(m, 26 + (i % 8) * 70, 244 + Math.floor(i / 8) * 60, { align: 'center', size: 9 }); });
      Object.keys(H.ELEMENTS).forEach((e, i) => G.elemIcon(c, e, 20 + i * 30, 420, 10));
      return ui.canvas.toDataURL('image/png');
    },
    ascIcons() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      Object.keys(H.ASC.shadows).forEach((id, i) => {
        const x = 8 + (i % 5) * 126, y = 6 + Math.floor(i / 5) * 156;
        G.rarityCell(c, x, y, 120, 120, H.ITEMS[id].rar);
        G.itemIcon(c, id, x + 12, y + 12, 96);
        G.itemIcon(c, id, x, y + 122, 32);
        ui.text(id.slice(4), x + 36, y + 130, { size: 10 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    matIcons() {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      Object.keys(H.ITEMS).filter(id => H.ITEMS[id].kind === 'mat').forEach((id, i) => {
        const x = 6 + (i % 9) * 70, y = 6 + Math.floor(i / 9) * 78;
        G.rarityCell(c, x, y, 64, 64, H.ITEMS[id].rar);
        G.itemIcon(c, id, x, y, 64);
        ui.text(id, x + 32, y + 66, { align: 'center', size: 9 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    coneArt(big) {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      if (big) { big.forEach((id, i) => { G.drawConeCard(c, id, 8 + i * 158, 40, 150, 212, { sup: 3 }); ui.text(id, 83 + i * 158, 256, { align: 'center', size: 10 }); }); return ui.canvas.toDataURL('image/png'); }
      Object.keys(H.CONES).forEach((id, i) => {
        const x = 4 + (i % 13) * 49, y = 4 + Math.floor(i / 13) * 74;
        G.drawConeCard(c, id, x, y, 44, 62, { sup: 1 });
        ui.text(id.slice(0, 8), x + 22, y + 63, { align: 'center', size: 8 });
      });
      return ui.canvas.toDataURL('image/png');
    },
    coneCards(id) {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      [[14, 20], [20, 28], [40, 56], [44, 62], [56, 78], [90, 126], [166, 230]].reduce((x, [w, h]) => { G.drawConeCard(c, id, x, 470 - h, w, h, { sup: 2 }); ui.text(w + '×' + h, x + w / 2, 466 - h - 12, { align: 'center', size: 9 }); return x + w + 12; }, 8);
      G.drawConeCard(c, id, 8, 8, 166, 230, { info: false });
      return ui.canvas.toDataURL('image/png');
    },
    coneView(id, sup, art) {
      const g = fresh('express'); g.state.inv.cones.push({ uid: 'shot_' + id, id, sup: sup || 1 });
      ui.openMenu(); ui.openInventory(4); ui.openConeView(id, 'shot_' + id); if (art) ui.top().art = true; pump(2);
      return new Promise(r => setTimeout(r, 300)).then(() => { pump(2); return shot(); });
    }
  };
  return true;
})()`;

async function open() {
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hsr-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1100,900', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws = null, target = null;
  const close = async () => {
    try {
      const info = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(info.webSocketDebuggerUrl);
      await new Promise(resolve => {
        bws.onopen = () => bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        bws.onclose = resolve;
        bws.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    } catch {}
    try { if (ws) ws.close(); } catch {}
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    server.kill();
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }, 500);
  };
  try {
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch {}
    }
    if (!target) throw new Error('Edge did not start');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  } catch (e) {
    await close();
    throw e;
  }
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const load = async () => {
    for (let i = 0; i < 60; i++) {
      try { if ((await (await fetch(`http://127.0.0.1:${sport}/hsr98.html`)).status) === 200) break; } catch {}
      await sleep(250);
    }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/hsr98.html` });
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      try { if (await ev('typeof hsrui === "object" && !!hsrui.canvas')) break; } catch {}
    }
    await ev(PAGE);
  };
  return { ev, load, close, errors };
}

async function main() {
  const out = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'hsr98-shots'));
  const names = (process.argv[3] || Object.keys(SCENES).join(',')).split(',');
  const warpScene = n => {
    if (n.startsWith('warpc')) { const [b, t] = n.slice(5).split('_'); return 'hsrShots.warpCine(' + (+b) + ',' + (+t) + ')'; }
    if (n.startsWith('warpv_')) { const [, id, rar, t] = n.split('_'); return 'hsrShots.warpReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ',' + JSON.stringify(process.env.OUTFIT || '') + ')'; }
    if (n.startsWith('sigc')) { const [b, t] = n.slice(4).split('_'); return 'hsrShots.sigCine(' + (+b) + ',' + (+t) + ')'; }
    if (n.startsWith('sigv_')) { const [, id, rar, t, h] = n.split('_'); return 'hsrShots.sigReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ',' + (h === 'h') + ')'; }
    if (n.startsWith('midc')) { const [b, tt] = n.slice(4).split('_'); return 'hsrShots.midCine(' + (+b) + ',' + (+tt) + ')'; }
    if (n.startsWith('conebig_')) return 'hsrShots.coneArt(' + JSON.stringify(n.slice(8).split('-')) + ')';
    if (n.startsWith('conecard_')) return 'hsrShots.coneCards(' + JSON.stringify(n.slice(9)) + ')';
    if (n.startsWith('coneviewart_')) return 'hsrShots.coneView(' + JSON.stringify(n.slice(12)) + ', 1, true)';
    if (n.startsWith('coneview_')) { const m = n.slice(9).match(/^(.+?)(?:_(\d))?$/); return 'hsrShots.coneView(' + JSON.stringify(m[1]) + ',' + (+m[2] || 1) + ')'; }
    if (n.startsWith('midv_')) { const [, id, rar, tt, h] = n.split('_'); return 'hsrShots.midReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+tt) + ',' + (h === 'h') + ')'; }
    if (n.startsWith('spotc')) { const [b, tt] = n.slice(5).split('_'); return 'hsrShots.spotCine(' + (+b) + ',' + (+tt) + ')'; }
    if (n.startsWith('spotv_')) { const m = n.match(/^spotv_(.+)_(\d)_([\d.]+)$/); return 'hsrShots.spotReveal(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ')'; }
    if (n.startsWith('spotrack')) return 'hsrShots.spotRack(' + (+n.slice(8) || 5) + ')';
    if (n.startsWith('midrack')) return 'hsrShots.midRack(' + (+n.slice(7) || 5) + ')';
    if (n.startsWith('convc')) { const [b, t] = n.slice(5).split('_'); return 'hsrShots.convCine(' + (+b) + ',' + (+t) + ')'; }
    if (n.startsWith('convv_')) { const [, id, rar, t, h] = n.split('_'); return 'hsrShots.convReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ',' + (h === 'h') + ')'; }
    if (n.startsWith('ksc')) { const [b, t] = n.slice(3).split('_'); return 'hsrShots.ksCine(' + (+b) + ',' + (+t) + ')'; }
    if (n.startsWith('ksv_')) { const [, id, rar, t, h] = n.split('_'); return 'hsrShots.ksReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ',' + (h === 'h') + ')'; }
    if (n.startsWith('ksrack')) return 'hsrShots.ksRack(' + (+n.slice(6) || 5) + ')';
    if (n.startsWith('convrack')) return 'hsrShots.convRack(' + (+n.slice(8) || 5) + ')';
    if (n.startsWith('sigrack')) return 'hsrShots.sigRack(' + (+n.slice(7) || 5) + ')';
    if (n.startsWith('warprack')) return 'hsrShots.warpRack(' + (+n.slice(8) || 5) + ')';
    if (n.startsWith('title_')) return 'hsrShots.title(' + (+n.slice(6)) + ')';
    if (n.startsWith('starmap')) return 'hsrShots.starMap(' + JSON.stringify(n.slice(8) || 'express') + ')';
    if (n.startsWith('navarea_')) { const [, map, area] = n.match(/^navarea_(.+?)__(.+)$/); return 'hsrShots.navArea(' + JSON.stringify(map) + ',' + JSON.stringify(area) + ')'; }
    if (n.startsWith('navz_')) return 'hsrShots.nav(' + JSON.stringify(n.slice(5)) + ', null, 2)';
    if (n.startsWith('nav_')) { const [map, kind] = n.slice(4).split('__'); return 'hsrShots.nav(' + JSON.stringify(map) + ',' + JSON.stringify(kind || null) + ')'; }
    if (n.startsWith('hud_')) return 'hsrShots.hudMap(' + JSON.stringify(n.slice(4)) + ", null, null, 'Прогуляться по Белобогу: заглянуть в мастерскую «Незимье» (юго-восток)')";
    if (n.startsWith('cine_')) { const m = n.match(/^cine_(c_[a-z0-9_]+?)_(\d+)_([\d.]+)(?:_([mf]))?$/); return m ? 'hsrShots.cine(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ')' : null; }
    if (n.startsWith('skin_')) { const m = n.match(/^skin_([a-z]+)_([\d.]+)(?:_(all|one|none))?$/); return m ? 'hsrShots.skinShot(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + JSON.stringify(m[3] || '') + ',' + JSON.stringify(process.env.OUTFIT || '') + ')' : null; }
    if (n.startsWith('ult_')) { const m = n.match(/^ult_([a-z]+(?:_p)?)_(\d)_([\d.]+)(?:_(all|one|none))?$/); return m ? 'hsrShots.ultShot(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ',' + JSON.stringify(process.env.OUTFIT || '') + ')' : null; }
    if (n.startsWith('fus_')) { const m = n.match(/^fus_(f_[a-z0-9]+)_(\d)_([\d.]+)(?:_(all|one|none))?$/); return m ? 'hsrShots.fusShot(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ',' + JSON.stringify(process.env.OUTFIT || '') + ')' : null; }
    if (n.startsWith('fuslive_')) { const m = n.match(/^fuslive_([\d.]+)$/); return m ? 'hsrShots.fusLive(' + m[1] + ')' : null; }
    if (n.startsWith('ultlive_')) { const m = n.match(/^ultlive_([a-z]+(?:_p)?)_([\d.]+)$/); return m ? 'hsrShots.ultLive(' + JSON.stringify(m[1]) + ',' + m[2] + ')' : null; }
    if (n.startsWith('info_')) { const m = n.match(/^info_([a-z_]+?)_(\d)_(\d+)_(\d+)(_end)?$/); return m ? 'hsrShots.info(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + m[4] + ',' + !!m[5] + ')' : null; }
    if (n.startsWith('at_')) { const [, map, x, y] = n.match(/^at_(.+)_(\d+)_(\d+)$/); return 'hsrShots.fieldAt(' + JSON.stringify(map) + ',' + (+x) + ',' + (+y) + ')'; }
    return null;
  };
  const eidScene = n => {
    let m;
    if ((m = n.match(/^eid_([a-z_]+?)_(\d)(?:_(\d))?$/))) return 'hsrShots.eid(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + (m[3] != null ? m[3] : 'null') + ')';
    if ((m = n.match(/^eidv_([a-z_]+?)_(\d)$/))) return 'hsrShots.eid(' + JSON.stringify(m[1]) + ',' + m[2] + ', null, true)';
    if ((m = n.match(/^eida_([a-z_]+?)_(\d)_(\d)_([\d.]+)$/))) return 'hsrShots.eidAsm(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + m[4] + ')';
    if ((m = n.match(/^eidsheet(g?)$/))) return 'hsrShots.eidSheet(' + (m[1] ? 0 : 1) + ')';
    return null;
  };
  const sceneOf = n => SCENES[n] || warpScene(n) || (n.startsWith('map_') ? "hsrShots.field('" + n.slice(4) + "')" : n.startsWith('full_') ? "hsrShots.fullMap('" + n.slice(5) + "')" : n.startsWith('foe_') ? "hsrShots.foe('" + n.slice(4) + "')" : n.startsWith('cg_') ? "hsrShots.cg('" + n.slice(3) + "')" : n.startsWith('dlg_') ? "hsrShots.dialog('" + n.slice(4) + "', 60)" : n.startsWith('skip_') ? "hsrShots.skipRecap('" + n.slice(5) + "')" : eidScene(n));
  for (const n of names) if (!sceneOf(n)) throw new Error('unknown scene "' + n + '", use: ' + Object.keys(SCENES).join(',') + ', map_<id>, full_<id>, foe_<id>, warpc<3|4|5>_<sec>, warpv_<id>_<rar>_<sec>, warprack<rar>, at_<map>_<x>_<y>, nav_<map>[__<kind>], navz_<map>, navarea_<map>__<area>, starmap[_<map>], hud_<map>');
  fs.mkdirSync(out, { recursive: true });
  const b = await open();
  try {
    await b.load();
    for (const n of names) {
      const url = await b.ev(sceneOf(n));
      const ext = url.startsWith('data:application/json') ? '.json' : '.png';
      fs.writeFileSync(path.join(out, n + ext), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
      console.log(n + ext);
    }
    if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
  } finally {
    await b.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
