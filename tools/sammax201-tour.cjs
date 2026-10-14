const steps = [];
const e = (code, shot) => { steps.push(['eval', code]); if (shot) steps.push(['shot', shot, '.smx-cv']); };
const cv = name => steps.push(['shot', name, '.smx-cv']);
const THEMES = ['title21', 'robot21', 'pole21', 'workshop21', 'santa21', 'diner21', 'garage21', 'ring21', 'quiz21', 'demon21', 'past21', 'future21', 'spirit21', 'finale21', 'credits21'];

e(`(() => {
  const E = SamMax.EP201;
  const EDGES = {
    office: { street: () => T.act('use', 'edoor') },
    street: { office: () => T.act('use', 'officedoor'), bosco: () => T.act('use', 'boscodoor'), stinky: () => T.act('use', 'stinkydoor'), garage: () => T.act('use', 'garagedoor'), pole: () => T.fly('pole') },
    bosco: { street: () => T.act('use', 'exit') },
    stinky: { street: () => T.act('use', 'door') },
    garage: { street: () => T.act('use', 'door') },
    pole: { street: () => T.fly('street'), workshop: () => T.act('use', 'workshop'), santa: () => T.act('use', 'topiaryb'), past: () => T.act('use', 'ppast'), stinkyx: () => T.act('use', 'ppresent') },
    workshop: { pole: () => T.act('use', 'door') },
    santa: { pole: () => T.act('use', 'chimney') },
    past: { pole: () => T.act('use', 'portal') },
    stinkyx: { pole: () => T.act('use', 'portal') }
  };
  const allowed = (to) => (to !== 'santa' || smx.g.f.topiary) && (!['past', 'stinkyx'].includes(to) || smx.g.f.demonOut);
  T.fly = to => {
    T.act('use', 'desoto');
    if (!smx.g.dialog || smx.g.dialog.id !== 'trip') return 'FAIL trip ' + T.info();
    smx.g.choose(to);
    return T.idle(40000);
  };
  T.go = to => {
    const from = smx.g.roomId;
    const prev = { [from]: null };
    const q = [from];
    while (q.length) { const cur = q.shift(); for (const next of Object.keys(EDGES[cur])) if (!(next in prev) && allowed(next)) { prev[next] = cur; q.push(next); } }
    const path = [];
    for (let r = to; prev[r]; r = prev[r]) path.unshift(r);
    for (const next of path) EDGES[smx.g.roomId][next]();
    return smx.g.roomId === to ? T.info() : 'FAIL go ' + to + ' ' + T.info();
  };
  T.btnPt = id => { const b = smx.g.drive.buttons().find(q => q.id === id); return T.pt(b.x + 10, b.y + 7); };
  T.quizNext = () => {
    const d = smx.g.drive;
    if (!d || d.kind !== 'quiz' || smx.g.busy || d.over) return null;
    const s = E.quizSolve(d.qn);
    if (d.abe !== s.abe) { const r = d.slot(0, s.abe); return T.pt(r.x + 8, r.y + 6); }
    if (d.sam !== s.sam) { const r = d.slot(1, s.sam); return T.pt(r.x + 8, r.y + 6); }
    return T.btnPt('go');
  };
  T.boxNext = () => {
    const d = smx.g.drive;
    if (!d || d.kind !== 'box' || d.over || d.pause > 0) return null;
    if (d.st === 'wind' && d.me !== 'block') return T.btnPt('block');
    if ((d.st === 'taunt' || d.st === 'stun') && d.me === 'guard') return T.btnPt('punch');
    return null;
  };
  T.raceAim = () => {
    const d = smx.g.drive;
    if (!d || d.kind !== 'race') return null;
    if (d.done) return T.btnPt('again');
    let best = null, bd = Infinity;
    for (const t of d.dolls) if (t.alive) { const k = Math.hypot(t.x - d.car.x, t.y - d.car.y); if (k < bd) { bd = k; best = t; } }
    return best ? T.pt(Math.round(best.x), Math.round(best.y)) : null;
  };
  T.station = st => T.until(g => g.vt.finale && E.planeStation(g.vt.finale) === st && g.vt.finale.phase - Math.floor(g.vt.finale.phase / 2) * 2 < 0.7, 6000);
  T.flags = () => Object.keys(smx.g.f).filter(k => smx.g.f[k] === true).join(',');
  return 'tour helpers';
})()`);
steps.push(['sleep', 500]);
cv('00_title');
steps.push(['move', 'T.titlePt(0)'], ['sleep', 200]);
cv('01_title_hover');
steps.push(['click', 'T.titlePt(0)']);
e('T.step(110)', '02_card');
e('T.until(g => g.roomId === "office" && !g.closeup && g.fade < 0.1 && g.speech.length > 0, 9000); T.step(10)', '03_fish');
e('T.until(g => g.f.introDone, 9000); T.step(8)', '04_laser');
e('T.idle()', '05_office');
steps.push(['key', '4', 'Digit4', 52], ['move', 'T.hotPt("flinthole")'], ['eval', 'smx.draw(); T.info()']);
cv('06_hover_flint');
steps.push(['click', 'T.hotPt("flinthole")']);
e('T.idle()', '07_flint');
e('T.ch("robot"); T.ch("case"); T.bye(); T.act("look", "window")', '08_window_eye');
steps.push(['key', '3', 'Digit3', 51], ['click', 'T.hotPt("closet")']);
e('T.idle()', '09_closet');
e('T.act("look", "jar"); T.act("look", "mrbear"); smx.g.perform("use", "tv"); T.step(70)', '10_tv');
e('T.idle(); T.go("street")', '11_street_robot');
e('T.act("talk", "robot")', '12_robot_face');
e('T.ch("who"); T.ch("from"); T.ch("ask")', '13_robot_questions');
steps.push(['move', 'T.optPt(3)'], ['eval', 'smx.draw(); T.info()']);
cv('14_fools_hover');
steps.push(['click', 'T.optPt(3)']);
e('T.idle()', '15_robot_thinks');
e('T.go("office"); smx.g.perform("use", "window"); T.until(g => g.f.robotDown, 4000); T.step(10)', '16_crash');
e('T.idle(); T.go("street")', '17_wreck');
e('T.act("look", "label"); T.act("talk", "jimmy")', '18_ring_jimmy');
e('T.ch("prize"); T.bye(); T.act("use", "desoto")', '19_trip');
e('smx.g.choose("pole"); T.until(g => g.closeup && g.closeup.kind === "fly21" && g.fade < 0.1, 4000); T.step(40)', '20_fly');
e('T.idle(40000)', '21_pole');
e('T.act("talk", "specs")', '22_poppers');
e('T.ch("why"); T.ch("sleigh"); T.bye(); T.go("workshop")', '23_workshop');
e('T.act("use", "betty"); T.act("use", "maze"); T.act("use", "tags"); smx.g.perform("use", "stairs"); T.step(30)', '24_santa_shoots');
e('T.idle(); T.act("talk", "elfg"); T.ch("job"); T.ch("try")', '25_intern');
e('smx.g.choose("santa"); T.until(g => g.actors.elfg.act === "cry", 4000); T.step(20)', '26_tears');
e('T.idle(); T.bye(); T.act("use", "greenpc")', '27_computer');
e('T.ch("log"); T.ch("wish"); T.bye(); T.go("pole"); smx.g.perform("use", "topiary", "can"); T.until(g => g.f.topiary, 4000); T.step(20)', '28_topiary');
e('T.idle(); T.go("santa")', '29_santa_room');
e('T.act("look", "podium"); T.act("use", "record"); T.go("pole"); T.act("use", "betty", "key"); T.fly("street"); smx.g.perform("use", "ring", "betty"); T.until(g => g.mode === "box21" && g.fade < 0.05, 9000); T.step(10)', '30_ring');
steps.push(['loop', 'smx.g.mode !== "box21"', 'T.boxNext()', 'T.step(3)', 9000]);
e('T.until(g => g.mode === "room", 9000); T.idle() + " war=" + smx.g.has("war")', '31_war');
e('T.go("stinky")', '32_diner');
e('T.act("talk", "stinky"); T.ch("feet"); smx.g.choose("quiz"); T.until(g => g.mode === "quiz21" && g.fade < 0.05, 9000); T.idle()', '33_quiz');
steps.push(['click', 'T.btnPt("max")']);
e('T.step(30)', '34_quiz_hint');
e('T.idle()');
steps.push(['loop', 'smx.g.mode !== "quiz21"', 'T.quizNext()', 'T.step(4); T.idle()', 400]);
e('T.until(g => g.mode === "room", 9000); T.idle() + " pest=" + smx.g.has("pest")', '35_pest');
e('T.go("garage")', '36_garage');
e('T.act("talk", "bob"); T.ch("game"); smx.g.choose("play"); T.until(g => g.mode === "race21" && g.fade < 0.05, 9000); T.idle()', '37_race');
steps.push(['loop', 'smx.g.mode !== "race21"', 'T.raceAim()', 'T.step(2)', 9000]);
e('T.until(g => g.mode === "room", 9000); T.idle() + " death=" + smx.g.has("death")', '38_death');
e('T.go("bosco"); T.act("talk", "bosco")', '39_bosco');
e('T.ch("parcel"); T.ch("wish"); T.bye(); T.act("look", "xray")', '40_xray');
e('T.fly("pole"); T.go("workshop"); T.act("use", "greenpc"); T.ch("send"); T.ch("to_bosco")', '41_gift_menu');
e('T.ch("g_watch"); T.ch("send"); T.ch("to_stinky"); T.ch("g_bath"); T.bye(); T.go("street"); T.go("bosco")', '42_second_parcel');
e('T.go("stinky")', '43_footbath');
e('T.act("use", "sock"); T.fly("pole"); T.go("santa"); smx.g.perform("use", "stuffer", "sock"); T.until(g => g.vt.stuffT, 4000); T.step(20)', '44_stuffer');
e('T.idle(); T.go("workshop"); for (const id of SamMax.EP201.HORSES) if (smx.g.has(id)) T.act("use", "pole", id); T.info()', '45_horsemen');
e('"saved=" + smx.saveSlot("tour") + " " + (smx.g.perform("use", "recplayer", "record") ? "ok" : "fail") + " " + T.until(g => g.dialog && g.dialog.id === "song" && !g.busy, 9000)', '46_song');
steps.push(['move', 'T.optPt(3)'], ['eval', 'smx.draw(); T.info()']);
cv('47_song_hover');
steps.push(['click', 'T.optPt(3)']);
e('T.idle(); T.ch("o1"); T.ch("o2"); smx.g.choose("o0"); T.until(g => g.f.demonOut && g.actors.demon.room === "workshop", 9000); T.step(10)', '48_demon');
e('T.until(g => g.actors.gpres.room === "workshop" && g.speech.length > 0, 20000); T.step(10)', '49_spirits');
e('T.idle(60000); T.go("pole")', '50_portals');
e('smx.g.perform("use", "boiler", "sock"); T.until(g => g.closeup && g.closeup.kind === "future21" && g.fade < 0.1, 9000); T.step(60)', '51_future');
e('T.until(g => g.closeup && g.closeup.stage === 1, 20000); T.step(40)', '52_rescue');
e('T.idle(60000); T.go("stinkyx")', '53_roaches');
e('T.act("talk", "stinky"); T.ch("what"); smx.g.choose("bday"); T.until(g => g.actors.pedro.act === "sing", 9000); T.step(20)', '54_pedro');
e('T.idle(); T.bye(); T.go("pole"); T.act("use", "stand"); T.go("stinkyx"); smx.g.perform("use", "bug", "snow"); T.until(g => g.vt.roachMarch, 9000); T.step(20)', '55_march');
e('T.idle(); T.go("pole"); T.go("past")', '56_past');
e('T.idle(); T.act("use", "hole", "maze"); smx.g.perform("use", "tv"); T.until(g => g.vt.maryIn, 6000); T.step(10)', '57_maze');
e('T.idle(); T.act("use", "maze"); T.go("pole"); T.fly("street"); T.go("office")', '58_ledge');
e('smx.g.perform("use", "window", "mary"); T.until(g => g.vt.maryLedge, 6000); T.step(30)', '59_reunion');
e('T.idle(); T.go("past")', '60_back_to_past');
e('smx.g.perform("use", "yjimmy", "glove"); T.until(g => g.actors.yjimmy.v === "glove", 6000); T.step(20)', '61_glove');
e('T.idle(); T.go("pole"); smx.g.perform("use", "demon", "globe"); T.until(g => g.f.jelly, 20000); T.step(10)', '62_jelly');
e('T.until(g => g.f.santaEvil, 20000); T.step(10)', '63_evil_santa');
e('T.idle(); T.go("workshop")', '64_finale');
e('T.station(SamMax.EP201.FINALE.TRAMP)');
steps.push(['key', '3', 'Digit3', 51]);
e('T.act("use", "switch", "gun"); T.info()', '65_plane_tramp');
e('smx.g.perform("use", "cannon", "gun"); T.until(g => g.vt.finale.anim, 3000); T.step(18)', '66_cannon');
e('T.idle(); T.act("use", "switch", "gun"); T.station(SamMax.EP201.FINALE.POUND)');
e('smx.g.perform("use", "switch", "gun"); T.until(g => g.vt.finale.swing > g.time, 6000); T.step(4)', '67_pounder');
e('T.idle(); smx.g.perform("look", "crate"); T.until(g => g.speech.length > 0, 3000); T.step(10)', '68_crate');
e('T.until(g => g.closeup && g.closeup.kind === "deliver21" && g.fade < 0.1, 60000); T.step(40)', '69_delivery');
e('T.until(g => g.roomId === "office" && g.f.epilogue && g.fade < 0.1, 60000); T.step(60)', '70_epilogue');
e('T.until(g => g.ended, 60000); T.step(140)', '71_credits');
steps.push(['click', 'T.pt(160, 100)'], ['sleep', 300]);
e('"screen=" + smx.screen + " load=" + smx.loadSlot("tour") + " " + T.info() + " " + T.flags()', '72_loaded');
e(`(() => { const a = smx.audio, bad = []; for (const id of ${JSON.stringify(THEMES)}) { try { a.music(id); for (let i = 0; i < 60; i++) a.update(); } catch (err) { bad.push('music ' + id + ': ' + err.message); } } for (const id of ['laser', 'tommy', 'servo', 'wind', 'crash', 'splat', 'whack', 'boing', 'explosion', 'sting', 'megaphone', 'banjo', 'scan', 'crunch', 'sizzle', 'glass', 'slurp', 'laugh', 'cheer', 'bell']) { try { a.sfx(id); } catch (err) { bad.push('sfx ' + id + ': ' + err.message); } } return bad.length ? 'AUDIO FAIL ' + bad.join('; ') : 'audio ok'; })()`);
e(`(() => { window.__draws = 0; const d = smx.draw.bind(smx); smx.draw = () => { window.__draws++; d(); }; smx.audio.resume(); return 'real time check, context ' + (smx.audio.ctx && smx.audio.ctx.state); })()`);
for (const id of THEMES) {
  e(`(() => { smx.audio.music('${id}'); window.__d0 = window.__draws; return 'music ${id}'; })()`);
  steps.push(['sleep', 1200]);
  e(`'${id}: draws=' + (window.__draws - window.__d0) + ' theme=' + smx.audio.theme + ' failed=' + !!smx.soundFailed`);
}

module.exports = { page: 'sammax201.html', size: '1100,800', steps };
