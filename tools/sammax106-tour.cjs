const steps = [];
const e = (code, shot) => { steps.push(['eval', code]); if (shot) steps.push(['shot', shot, '.smx-cv']); };
const cv = name => steps.push(['shot', name, '.smx-cv']);
const THEMES = ['title6', 'moon6', 'shop6', 'blister6', 'sanctum6', 'bliss6', 'show6', 'queen6', 'momma6', 'vice6', 'credits6'];

e(`(() => {
  const E = SamMax.EP106;
  const EDGES = {
    office: { street: () => T.act('use', 'edoor') },
    street: { office: () => T.act('use', 'officedoor'), bosco: () => T.act('use', 'boscodoor'), sybil: () => T.act('use', 'sybildoor'), moon: () => T.fly('moon') },
    bosco: { street: () => T.act('use', 'exit') },
    sybil: { street: () => T.act('use', 'door') },
    moon: { street: () => T.fly('earth'), shop: () => T.act('use', 'shopdoor'), blister: () => T.act('use', 'blisterdoor') },
    shop: { moon: () => T.act('use', 'exit') },
    blister: { moon: () => T.act('use', 'exit'), vest: () => T.act('use', 'lift') },
    vest: { blister: () => T.act('use', 'lift'), sanctum: () => T.act('use', 'door') },
    sanctum: { vest: () => T.act('use', 'door') }
  };
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
    while (q.length) { const cur = q.shift(); for (const next of Object.keys(EDGES[cur])) if (!(next in prev)) { prev[next] = cur; q.push(next); } }
    const path = [];
    for (let r = to; prev[r]; r = prev[r]) path.unshift(r);
    for (const next of path) EDGES[smx.g.roomId][next]();
    return smx.g.roomId === to ? T.info() : 'FAIL go ' + to + ' ' + T.info();
  };
  T.wait = max => {
    let n = 0;
    const d = () => smx.g.drive;
    while (smx.screen === 'game' && (smx.g.busy || smx.g.fade > 0.001 || (d() && d().anim)) && n < (max || 40000)) { smx.step(1 / 30); n++; }
    smx.draw();
    return T.info();
  };
  T.cellPt = i => { const r = smx.g.drive.cellRect(i); return T.pt(r.x + 18, r.y + 18); };
  T.btnPt = id => { const b = smx.g.drive.buttons().find(q => q.id === id); return T.pt(b.x + 10, b.y + 8); };
  T.doomNext = () => {
    const d = smx.g.drive;
    if (!d || d.kind !== 'doom' || smx.g.busy || d.anim || d.over) return null;
    const line = E.doomSolve(d.board);
    return line && line.length ? T.cellPt(line[0]) : null;
  };
  T.seat = seat => T.until(g => g.vt.red && g.vt.red.seat === seat && !g.busy, 3000);
  T.next = () => { T.act('talk', 'hugh'); return T.ch('next'); };
  T.fight = () => { const ft = smx.g.vt.fight; return ft ? 'trap=' + ft.trap + ' bound=' + ft.bound + ' hughIn=' + ft.hughIn + ' lander=' + ft.lander + ' cycle=' + ft.cycle : 'no fight'; };
  T.flags = () => Object.keys(smx.g.f).filter(k => smx.g.f[k] === true).join(',') + ' husk=' + E.husk(smx.g) + ' parts=' + E.parts(smx.g) + ' costume=' + smx.g.actors.max.costume;
  return 'tour helpers';
})()`);
steps.push(['sleep', 500]);
cv('00_title');
steps.push(['move', 'T.titlePt(0)'], ['sleep', 200]);
cv('01_title_hover');
steps.push(['click', 'T.titlePt(0)']);
e('T.step(110)', '02_card');
e('T.until(g => g.roomId === "office" && !g.closeup && g.fade < 0.1 && g.speech.length > 0, 9000); T.step(10)', '03_lids');
e('T.idle()', '04_commish');
steps.push(['move', 'T.optPt(1)'], ['eval', 'smx.draw(); T.info()']);
cv('05_commish_hover');
steps.push(['click', 'T.optPt(1)']);
e('T.step(40)', '06_phone');
e('T.idle(); T.ch("moon"); T.ch("bye")');
steps.push(['key', '3', 'Digit3', 51], ['move', 'T.hotPt("closet")'], ['eval', 'smx.draw(); T.info()']);
cv('07_hover_closet');
steps.push(['click', 'T.hotPt("closet")']);
e('T.idle()', '08_closet');
e('T.act("look", "mrbear"); T.act("look", "leocloset"); T.act("use", "glove")');
e('smx.g.perform("use", "tv"); T.step(70)', '09_tv_hugh');
e('T.idle(); T.act("use", "machine"); T.act("use", "hanger")', '10_hanger');
steps.push(['key', 'i', 'KeyI', 73], ['eval', 'smx.draw(); T.info()']);
cv('11_inventory');
steps.push(['key', 'i', 'KeyI', 73]);
e('T.go("street")', '12_street');
e('T.act("talk", "jimmy")', '13_jimmy');
e('T.ch("what"); T.ch("moon"); T.bye(); T.go("bosco")', '14_momma_bosco');
e('T.act("talk", "bosco"); T.ch("sell"); T.bye(); T.act("look", "late"); T.go("sybil")', '15_queen_sybil');
e('T.act("talk", "sybil"); T.ch("queen"); T.bye(); T.act("look", "plaque"); T.act("look", "fox"); T.act("look", "hockey"); T.go("street"); T.act("use", "desoto")', '16_trip');
e('smx.g.choose("moon"); T.until(g => g.closeup && g.closeup.kind === "fly6" && g.fade < 0.1, 4000); T.step(30)', '17_fly');
e('T.idle(40000)', '18_moon');
e('T.act("talk", "superball")', '19_superball');
e('T.ch("in"); T.ch("level"); T.ch("test"); T.bye() + " uni=" + smx.g.has("uni")');
e('smx.g.walkPlayer(470, 164); T.until(g => !g.actors.sam.path, 3000); T.step(20)', '20_dome');
e('T.go("shop")', '21_shop');
e('T.act("talk", "harry"); T.ch("case"); T.bye(); T.act("use", "casestand")');
e('smx.g.perform("use", "exit"); T.until(g => g.vt.alarmT, 3000); T.step(8)', '22_alarm');
e('T.idle(); T.act("use", "casestand"); T.act("use", "max", "case") + " inMax=" + smx.g.f.caseInMax', '23_swallowed');
e('T.go("bosco"); smx.g.perform("use", "micro", "uni"); T.until(g => g.vt.microT, 3000); T.step(20)', '24_microwave');
e('T.idle() + " red=" + smx.g.f.uniRed');
e('T.go("moon"); T.act("use", "superball", "uni") + " open=" + smx.g.f.blisterOpen', '25_red_horn');
e('T.go("blister")', '26_blister');
e('T.act("talk", "lincoln")', '27_lincoln');
e('T.ch("why"); T.ch("sad"); T.bye(); smx.g.perform("use", "payphone"); T.until(g => g.dialog && g.dialog.id === "call" && !g.busy, 9000)', '28_call');
steps.push(['move', 'T.optPt(1)'], ['eval', 'smx.draw(); T.info()']);
cv('29_call_hover');
e('T.ch("relax"); T.ch("fox"); smx.g.choose("hockey"); T.until(g => g.closeup && g.closeup.mood === "swoon", 3000); T.step(30)', '30_swoon');
e('T.idle() + " gastro=" + smx.g.has("gastro")', '31_talisman');
e('smx.g.walkPlayer(232, 186); T.until(g => !g.actors.sam.path, 3000); T.act("talk", "curt")', '32_cops');
e('T.ch("game"); T.ch("tal"); smx.g.choose("play"); T.until(g => g.mode === "doom" && g.fade < 0.05, 9000); T.wait()', '33_doom');
steps.push(['click', 'T.btnPt("max")']);
e('T.step(24)', '34_doom_hint');
e('T.wait()');
steps.push(['move', 'T.cellPt(0)'], ['eval', 'smx.draw(); T.info()']);
cv('35_doom_hover');
steps.push(['loop', 'smx.g.f.leadGot === true || smx.g.mode !== "doom"', 'T.doomNext()', 'T.step(8)', 900]);
e('smx.draw(); T.info()', '36_doom_lost');
e('T.until(g => g.mode === "room", 9000); T.idle() + " lead=" + smx.g.has("lead")', '37_lead');
e('T.go("moon"); T.act("use", "max", "gastro"); T.act("use", "nozzle", "case")', '38_case_under');
e('smx.g.perform("use", "lander", "hanger"); T.until(g => g.vt.fireT, 9000); T.step(12)', '39_engine');
e('T.idle() + " broken=" + smx.g.f.caseBroken + " key=" + smx.g.has("key")', '40_shards');
e('T.act("use", "spoontal"); "saved=" + smx.saveSlot("tour") + " " + T.go("vest")', '41_vest');
e('T.act("use", "door", "lead")', '42_xray');
e('smx.g.perform("use", "sconce", "spoon"); T.until(g => g.vt.sconceT, 4000); T.step(14)', '43_ball_falls');
e('T.idle() + " open=" + smx.g.f.doorOpen', '44_door_open');
e('smx.g.perform("use", "door"); T.until(g => g.roomId === "sanctum" && g.fade < 0.1 && g.speech.length > 0, 9000); T.step(20)', '45_hugh');
e('T.until(g => g.closeup && g.closeup.kind === "beam6" && g.fade < 0.1, 40000); T.step(60)', '46_beam');
e('T.until(g => g.closeup && g.closeup.kind === "world6" && g.fade < 0.1, 20000); T.step(20)', '47_world_of_hugh');
e('T.until(g => g.actors.maxblue.room === "sanctum", 40000); T.step(20)', '48_three_vices');
e('T.idle(90000) + " " + T.flags()', '49_husk');
e('T.act("talk", "hugh")', '50_hugh_dialog');
e('T.ch("why"); T.bye(); T.act("talk", "max"); T.ch("hint"); T.bye(); T.go("blister")', '51_red_max');
e('T.act("use", "spork", "spoon"); T.seat("car")', '52_spork');
e('smx.g.perform("use", "button", "gun"); T.until(g => g.actors.maxred.upside, 4000); T.step(6)', '53_bonk');
e('T.idle() + " " + T.flags()', '54_hand_back');
e('T.go("street")', '55_bliss_street');
e('smx.g.perform("use", "meter", "spoon"); T.until(g => g.f.jimmyFlown, 4000); T.step(8)', '56_jimmy_flies');
e('T.idle(); T.go("blister"); T.act("talk", "philo"); T.ch("hat"); T.bye() + " hat=" + smx.g.has("hat")', '57_hat');
e('T.go("bosco")', '58_green_max');
e('T.act("talk", "bosco")', '59_bliss_bosco');
e('T.ch("quake"); T.bye(); T.act("use", "maxgreen", "hat"); T.act("use", "maxgreen", "hat") + " " + T.flags()', '60_stomach_back');
e('T.go("office"); if (!smx.g.f.closetOpen) T.act("use", "closet"); T.act("use", "leocloset", "gastro") + " deed=" + smx.g.has("deed")', '61_deed');
e('T.go("sybil")', '62_bliss_sybil');
e('T.act("use", "sybil", "deed"); T.go("bosco"); T.act("use", "bosco", "cad") + " remote=" + smx.g.has("remote")', '63_remote');
e('T.go("moon")', '64_blue_max');
e('smx.g.perform("use", "maxblue", "remote"); T.until(g => g.f.satDown, 9000); T.step(10)', '65_satellite');
e('T.idle(); T.act("use", "maxblue") + " " + T.flags()', '66_whole');
e('T.go("vest"); smx.g.perform("use", "door"); T.until(g => g.roomId === "sanctum" && g.actors.hugh.v === "germ" && g.speech.length > 0, 30000); T.step(20)', '67_germ');
e('T.idle(90000) + " " + T.fight()', '68_wheel');
e('T.act("talk", "max"); T.ch("hint"); T.step(20)', '69_hint_from_crystal');
e('T.idle(); T.bye(); T.act("use", "lspoon", "spoon") + " mtal=" + smx.g.has("mtal")', '70_talisman');
e('T.act("use", "hugh", "mtal"); T.step(40); T.fight()', '71_swap');
e('T.next() + " " + T.fight()', '72_cabinet');
e('T.act("use", "hugh", "mtal"); T.act("use", "cabinet") + " saw=" + smx.g.has("saw")', '73_saw');
e('T.next() + " " + T.fight()', '74_lander');
e('smx.g.perform("use", "hugh", "mtal"); T.until(g => g.vt.fireT, 9000); T.step(10)', '75_burn');
e('T.idle(60000) + " " + T.fight()', '76_tank');
e('T.act("use", "hugh", "mtal"); T.fight()', '77_hugh_in_tank');
e('T.next() + " " + T.fight()');
e('T.act("use", "hugh", "mtal"); T.act("use", "crane", "saw") + " " + T.fight()', '78_lander_down');
e('T.next(); T.act("use", "hugh", "mtal"); T.next() + " " + T.fight()');
e('T.act("use", "hugh", "mtal") + " " + T.fight()', '79_ready');
e('smx.g.perform("use", "fallen", "key"); T.until(g => g.vt.boilT, 9000); T.step(40)', '80_boil');
e('T.until(g => g.vt.drunk, 40000); T.step(30)', '81_drunk');
e('T.until(g => g.closeup && g.closeup.kind === "world6" && g.fade < 0.1, 40000); T.step(30)', '82_world_of_max');
e('T.until(g => g.roomId === "office" && g.fade < 0.1, 60000); T.step(60)', '83_epilogue');
e('T.until(g => g.ended, 60000); T.step(140)', '84_credits');
steps.push(['click', 'T.pt(160, 100)'], ['sleep', 300]);
e('"screen=" + smx.screen + " load=" + smx.loadSlot("tour") + " " + T.info() + " " + T.flags()', '85_loaded');
e(`(() => { const a = smx.audio, bad = []; for (const id of ${JSON.stringify(THEMES)}) { try { a.music(id); for (let i = 0; i < 60; i++) a.update(); } catch (err) { bad.push('music ' + id + ': ' + err.message); } } for (const id of ['stamp', 'beep', 'scan', 'fanfare', 'spring', 'clang', 'slurp', 'cash', 'missile', 'explosion', 'hypno', 'burp', 'oven', 'dial', 'alarm', 'bonk', 'jackpot', 'crunch', 'sizzle', 'glass']) { try { a.sfx(id); } catch (err) { bad.push('sfx ' + id + ': ' + err.message); } } return bad.length ? 'AUDIO FAIL ' + bad.join('; ') : 'audio ok'; })()`);
e(`(() => { window.__draws = 0; const d = smx.draw.bind(smx); smx.draw = () => { window.__draws++; d(); }; smx.audio.resume(); return 'real time check, context ' + (smx.audio.ctx && smx.audio.ctx.state); })()`);
for (const id of THEMES) {
  e(`(() => { smx.audio.music('${id}'); window.__d0 = window.__draws; window.__s0 = smx.audio.step; return 'music ${id}'; })()`);
  steps.push(['sleep', 1200]);
  e(`'${id}: draws=' + (window.__draws - window.__d0) + ' theme=' + smx.audio.theme + ' steps=' + smx.audio.step + ' failed=' + !!smx.soundFailed`);
}

module.exports = { page: 'sammax106.html', size: '1100,800', steps };
