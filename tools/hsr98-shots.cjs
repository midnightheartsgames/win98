const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SCENES = {
  title: 'hsrShots.title()',
  express: "hsrShots.field('express')",
  expguests: "(() => { const g = hsrShots.fresh('express'); Object.assign(g.state.flags, { asta_met: true, arlan_met: true, serval_met: true, underworld: true, moles: true }); hsrui.openBook('guests'); hsrShots.pump(2); return hsrShots.shot(); })()",
  expphotos: "(() => { const g = hsrShots.fresh('express_cabin'); g.state.flags.underworld = true; hsrui.openBook('photos'); hsrui.top().sel = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  expnav: "(() => { hsrShots.fresh('express'); hsrui.openNav(); hsrShots.pump(4); return hsrShots.shot(); })()",
  plains: "hsrShots.field('j_plains')",
  belobog: "hsrShots.field('j_belobog')",
  station: "hsrShots.field('hs_storage')",
  dialog: "hsrShots.dialog('himeko_talk', 40)",
  menu: 'hsrShots.menu()',
  phonerail: 'hsrShots.phoneRail()',
  evnotice: 'hsrShots.eventsNotice()',
  events: "hsrShots.events('comet', 3, [true], 1)",
  events7: "hsrShots.events('comet', 7, [true, true, true, false, true], 6)",
  eventsdone: "hsrShots.events('comet', 7, [true, true, true, true, true, true, true], 0)",
  will: "hsrShots.events('will', 0, [], 1, 18, [5])",
  willdone: "hsrShots.events('will', 0, [], 3, 40, [5, 15, 25])",
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
  warpmid: "hsrShots.warpBanner('mid')",
  warpmidkanji: "hsrShots.warpBanner('mid', 'kanji')",
  warpmidrise: "hsrShots.warpBanner('mid', 'rise')",
  warpcomp: "hsrShots.warpBanner('comp')",
  warpcomprise: "hsrShots.warpBanner('comp', 'rise')",
  warpmidc: "hsrShots.warpBanner('mid', 'rise', { unsigned: true })",
  warpmidguar: "hsrShots.warpBanner('mid', 'rise', { pity: { five: 55, guar5: true } })",
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
  debugchars: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); hsrui.debugState.ch.i = 13; hsrui.debugState.ch.eid = 2; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugcones: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 1, row: 1 }); hsrui.debugState.cn.i = 1; hsrui.debugState.cn.sup = 3; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugult: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); hsrui.debugState.sc.id = 'seele'; hsrui.t = 1.6; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugfus: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 1 }); Object.assign(hsrui.debugState.sc, { kind: 1, id: 'f_landau' }); hsrui.t = 3.1; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugfusview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 1, id: 'f_wings' }); hsrui.openDebugShow(hsrui.debugState, false); for (let i = 0; i < 30; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugwarp: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 3 }); Object.assign(hsrui.debugState.sc, { kind: 2, id: 'ruanmei', cut: 1 }); hsrui.t = 2.4; hsrShots.pump(1); return hsrShots.shot(); })()",
  debugeid: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 4, row: 2 }); Object.assign(hsrui.debugState.sc, { kind: 3, id: 'pela', stage: 2 }); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugeidview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 3, id: 'himeko', stage: 3 }); hsrui.openDebugEidolon(hsrui.debugState, false); hsrShots.pump(2); return hsrShots.shot(); })()",
  debugeidasm: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 3, id: 'himeko', stage: 1 }); hsrui.openDebugEidolon(hsrui.debugState, true); for (let i = 0; i < 26; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugultview: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 0, id: 'himeko' }); hsrui.openDebugShow(hsrui.debugState, false); for (let i = 0; i < 30; i++) hsrui.update(0.05); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugcard: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState.sc, { kind: 2, id: 'seele', cut: 1 }); const v = hsrui.openDebugShow(hsrui.debugState, false); v.stop(); hsrShots.pump(1); return hsrShots.shot(); })()",
  debugrelics: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 2, row: 3 }); Object.assign(hsrui.debugState.rl, { set: 8, slot: 2, main: 'critD' }); hsrui.debugState.rl.subs = ['critR', '', 'atkP', 'spd']; hsrShots.pump(2); return hsrShots.shot(); })()",
  debugitems: "(() => { hsrShots.fresh('express'); hsrui.debugState = null; hsrui.openDebug(); Object.assign(hsrui.debugState, { tab: 3, row: 4 }); hsrui.debugState.it.i = 12; hsrShots.pump(2); hsrui.debugForm(hsrui.debugState).acts[0].fn(); hsrShots.pump(2); return hsrShots.shot(); })()",
  missions: 'hsrShots.missions(0)',
  missionstrail: 'hsrShots.missions(1)',
  missionscomp: "hsrShots.missions(2, 'hook_foreman')",
  missionsadv: 'hsrShots.missions(3)',
  missionstrack: "hsrShots.missions(0, 'hook_treasure', 'hook_treasure')",
  hudhook: "hsrShots.questAt('u_boulder', 'hook_treasure', 'talk', 30, 6)",
  campfight: "hsrShots.questAt('u_camp', 'hook_foreman', 'mine', 2, 8)",
  campask: "hsrShots.questAt('u_camp', 'hook_foreman', 'ask', 14, 8)",
  campcrates: "hsrShots.questAt('u_camp', 'hook_foreman', 'crates', 26, 11)",
  campauction: "hsrShots.questAt('u_camp', 'hook_gift', 'buyers', 18, 6, 'hg_camp,hg_lady1,hg_wallet_ask')",
  rivetdig: "hsrShots.questAt('u_rivet', 'hook_treasure', 'findie', 22, 7)",
  rivetjunk: "hsrShots.questAt('u_rivet', 'hook_treasure', 'drill', 33, 7)",
  boulderhook: "hsrShots.questAt('u_boulder', 'hook_foreman', 'fersman', 14, 6)",
  mission: "(() => { const g = hsrShots.fresh('j_belobog'); g.state.obj = 'Прогуляться по Белобогу: заглянуть в мастерскую «Нейвервинтер» (юго-восток)'; hsrui.openMission(); hsrShots.pump(2); return hsrShots.shot(); })()",
  items: 'hsrShots.inventory(0)',
  hudenergy: 'hsrShots.hudEnergy(0)',
  hudcharge: 'hsrShots.hudEnergy(1)',
  useenergy: "hsrShots.useEnergy('thermos')",
  invcones: 'hsrShots.inventory(3)',
  invrelics: 'hsrShots.inventory(4)',
  archive: 'hsrShots.archive()',
  team: 'hsrShots.team()',
  char: "hsrShots.chars('arlan', 0)",
  charseele: "hsrShots.chars('seele', 0)",
  charruan: "hsrShots.chars('ruanmei', 0)",
  skillsruan: "hsrShots.chars('ruanmei', 3)",
  charcone: "hsrShots.chars('himeko', 1)",
  charrelic: "hsrShots.chars('march', 2)",
  charplanar: "hsrShots.planar('seele', 4)",
  charplanar2: "hsrShots.planar('march', 5)",
  relicsplanar: "hsrShots.planarPick('seele', 4)",
  planaricons: 'hsrShots.planarIcons()',
  invplanar: "(() => { hsrShots.fresh('express'); hsrui.game.give({ ornament: [{ set: 'station', rl: 12 }, { set: 'vonwacq', rl: 6 }, { set: 'salsotto', rl: 9 }] }); hsrui.openMenu(); hsrui.openInventory(4); const rel = hsrui.invEntries(4).findIndex(e => e.rel && e.rel.slot === 'sphere'); hsrui.top().sel = Math.max(0, rel); hsrShots.pump(2); return hsrShots.shot(); })()",
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
  skipping: "hsrShots.skipping('final_start')",
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
  coneart: 'hsrShots.coneArt()',
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
  fhcraft: "(() => { const g = hsrShots.fresh('express'); g.state.flags.fh_met = true; g.state.inv.items.resin = 1; hsrui.openFhShop(); hsrui.top().tab = 1; hsrui.openFhCraft(); Object.assign(hsrui.top(), { col: 2, set: 1, slot: 2, main: 4 }); hsrShots.pump(4); return hsrShots.shot(); })()",
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
  questhud: 'hsrShots.quest(0)',
  questmission: 'hsrShots.quest(1)',
  questnav: 'hsrShots.quest(2)'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const PAGE = `(() => {
  const H = Hsr98, ui = window.hsrui;
  ui.running = false;
  Math.random = H.makeRandom(11);
  const pump = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) ui.update(dt); ui.render(); };
  const shot = () => { ui.render(); return ui.canvas.toDataURL('image/png'); };
  const FLAGS = ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro', 'jarilo_arrive', 'plains_met', 'belobog_intro', 'sampo_met', 'events_note'];
  const fresh = (map, party) => {
    const st = H.newState();
    Object.assign(st, { name: 'Стелла', gender: 'f', map, x: null, y: null, jade: 1600, credits: 25480, power: 142, tp: 4, obj: 'Найти Броню в Белобоге' });
    for (const f of FLAGS) st.flags[f] = true;
    for (const id of Object.keys(H.CHARS)) if (id !== 'trail_p') st.roster[id] = { lvl: id === 'trail' ? 32 : 28, exp: 420, eid: id === 'march' ? 2 : 0, cone: null, relics: {}, hp: null, energy: 0 };
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
    title(sec) { ui.game = null; ui.mode = 'title'; ui.screens = []; pump(40); if (sec != null) ui.t = sec; return shot(); },
    field(map) { fresh(map); pump(30); return shot(); },
    fieldAt(map, x, y) { const g = fresh(map); g.placePlayer(x, y); g.player.dir = 'up'; pump(30); return shot(); },
    fullMap(map) {
      const g = fresh(map), m = g.map, c = ui.ctx;
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
      g.state.obj = obj || 'Прогуляться по Белобогу: заглянуть в мастерскую «Нейвервинтер» (юго-восток)';
      g.state.anchors = Object.keys(H.MAPS).filter(id => H.mapLayout(id).anchors.length && id !== 'u_rivet').map(id => id + ':0');
      ui.openNav(null);
      const s = ui.top();
      if (zoom) s.zoom = Math.min(5, s.zoom + zoom);
      if (kind) { const i = s.points().findIndex(p => p.kind === kind || (kind === 'goalmark' && p.goal)); if (i >= 0) { s.sel = i; s.detail = kind !== 'goalmark'; } }
      s.snap = true; pump(2); return shot();
    },
    navArea(map, area) { const g = fresh(map); g.state.obj = 'Найти Олега в Великой шахте (восточный выход)'; for (const f of ['fled', 'underworld']) g.state.flags[f] = true; ui.openNav(null, { area }); pump(2); return shot(); },
    starMap(map) { const g = fresh(map || 'express'); g.state.obj = 'Прогуляться по Белобогу: заглянуть в мастерскую «Нейвервинтер» (юго-восток)'; ui.openStarMap(null); pump(2); return shot(); },
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
      for (const m of H.TRAIL_MISSIONS.slice(0, 16)) for (const f of m.done.split('|')) g.state.flags[f] = true;
      g.state.missions.done = {}; for (const m of H.TRAIL_MISSIONS.slice(0, 16)) g.state.missions.done[m.id] = 1;
      g.state.obj = 'Найти Сервал в мастерской «Нейвервинтер» (Белобог, юго-восток)';
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
    events(id, days, got, pick, lvl, will) {
      const g = fresh('express');
      g.state.comet = { days, last: days ? '2026-9-29' : null, got: got.slice() };
      g.clock = () => new Date(2026, 8, 29, 22, 47, 13).getTime();
      if (lvl) g.state.roster.trail.lvl = lvl;
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
    warpBanner(ban, star, opt) { const g = fresh('express'); g.state.inv.items.spass = 4; g.state.inv.items.tape = 10; g.state.inv.items.rtide = 10; g.state.inv.items.ftide = 5; g.state.inv.items.mana = 10; g.state.inv.items.vkey = 10; if (!(opt && opt.unsigned)) g.state.flags.velvet_contract = true; if (opt && opt.pity) Object.assign(g.pityOf(ban), opt.pity); if (star) { g.setEvStar(star); g.setConeStar(star); for (const b of ['sig', 'amp', 'conv', 'forge', 'guild', 'wiz', 'mid', 'comp']) g.setStarOf(b, star); } ui.openWarp(() => {}); ui.top().ban = ban; pump(2); return shot(); },
    charSheet(id, extra) {
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
    warpReveal(id, rar, t) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.warpShow(res); s.begin([0]); s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    sigShow(res) { fresh('express'); ui.openWarp(() => {}); ui.top().ban = 'sig'; ui.top().start(res); return ui.top().show; },
    sigRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'miyabi', name: H.CHARS.miyabi.name, res: 'new' }; return out; },
    sigCine(best, t) { const s = hsrShots.sigShow(hsrShots.sigRes(best, 10)); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    sigReveal(id, rar, t, hop) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.sigShow(res); s.begin([0]); s.hop = hop ? 0.5 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
    convShow(res, ban) { fresh('express'); ui.openWarp(() => {}); ui.top().ban = ban || 'conv'; ui.top().start(res); return ui.top().show; },
    midRes(best, n) { const out = hsrShots.fakeRes(best, n); if (best === 5) out[6] = { rar: 5, kind: 'char', id: 'yu', name: H.CHARS.yu.name, res: 'new' }; if (best >= 4) out[2] = { rar: 4, kind: 'char', id: 'chie', name: H.CHARS.chie.name, res: 'new' }; return out; },
    midCine(best, t) { const s = hsrShots.convShow(hsrShots.midRes(best, 10), 'mid'); s.t = t; s.cue = 1e9; pump(1, 0); return shot(); },
    midReveal(id, rar, t, hop) { const res = [H.CHARS[id] ? { rar, kind: 'char', id, name: H.CHARS[id].name, res: 'new' } : { rar, kind: 'cone', id, name: H.CONES[id].name }]; const s = hsrShots.convShow(res, 'mid'); s.begin([0]); s.hop = hop ? 0.35 : 0; s.rt = t; s.fade = 0; pump(1, 0); return shot(); },
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
    ultShot(id, beat, t, aim) {
      const key = id === 'trail_p' ? 'trail' : id, party = [key, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => k !== key)].slice(0, 4);
      const g = fresh('j_plains', party);
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
    fusShot(id, beat, t, aim) {
      const f = H.FUSIONS[id], keys = f.members.map(k => k === 'trail_p' ? 'trail' : k), party = [...keys, ...['march', 'himeko', 'danheng', 'natasha'].filter(k => !keys.includes(k))].slice(0, 4);
      const g = fresh('j_plains', party);
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
    coneArt(big) {
      const c = ui.ctx, G = H.Gfx;
      c.fillStyle = '#20243a'; c.fillRect(0, 0, 640, 480);
      Object.keys(H.CONES).forEach((id, i) => {
        const x = 4 + (i % 12) * 53, y = 4 + Math.floor(i / 12) * 84;
        G.drawConeCard(c, id, x, y, 48, 68, { sup: 1 });
        ui.text(id.slice(0, 9), x + 24, y + 70, { align: 'center', size: 9 });
      });
      (big || ['mirror', 'night', 'milkyway', 'goodnight']).forEach((id, i) => G.drawConeCard(c, id, 8 + i * 158, 256, 116, 164, { scale: 2, sup: 3 }));
      return ui.canvas.toDataURL('image/png');
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
    if (n.startsWith('warpv_')) { const [, id, rar, t] = n.split('_'); return 'hsrShots.warpReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ')'; }
    if (n.startsWith('sigc')) { const [b, t] = n.slice(4).split('_'); return 'hsrShots.sigCine(' + (+b) + ',' + (+t) + ')'; }
    if (n.startsWith('sigv_')) { const [, id, rar, t, h] = n.split('_'); return 'hsrShots.sigReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+t) + ',' + (h === 'h') + ')'; }
    if (n.startsWith('midc')) { const [b, tt] = n.slice(4).split('_'); return 'hsrShots.midCine(' + (+b) + ',' + (+tt) + ')'; }
    if (n.startsWith('conebig_')) return 'hsrShots.coneArt(' + JSON.stringify(n.slice(8).split('-')) + ')';
    if (n.startsWith('midv_')) { const [, id, rar, tt, h] = n.split('_'); return 'hsrShots.midReveal(' + JSON.stringify(id) + ',' + (+rar) + ',' + (+tt) + ',' + (h === 'h') + ')'; }
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
    if (n.startsWith('hud_')) return 'hsrShots.hudMap(' + JSON.stringify(n.slice(4)) + ", null, null, 'Прогуляться по Белобогу: заглянуть в мастерскую «Нейвервинтер» (юго-восток)')";
    if (n.startsWith('cine_')) { const m = n.match(/^cine_(c_[a-z0-9]+)_(\d+)_([\d.]+)(?:_([mf]))?$/); return m ? 'hsrShots.cine(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ')' : null; }
    if (n.startsWith('ult_')) { const m = n.match(/^ult_([a-z]+(?:_p)?)_(\d)_([\d.]+)(?:_(all|one|none))?$/); return m ? 'hsrShots.ultShot(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ')' : null; }
    if (n.startsWith('fus_')) { const m = n.match(/^fus_(f_[a-z0-9]+)_(\d)_([\d.]+)(?:_(all|one|none))?$/); return m ? 'hsrShots.fusShot(' + JSON.stringify(m[1]) + ',' + m[2] + ',' + m[3] + ',' + JSON.stringify(m[4] || '') + ')' : null; }
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
      fs.writeFileSync(path.join(out, n + '.png'), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
      console.log(n + '.png');
    }
    if (b.errors.length) console.log('page errors:\n' + b.errors.join('\n'));
  } finally {
    await b.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
