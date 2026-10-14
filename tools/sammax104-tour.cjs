const steps = [];
const e = (code, shot) => { steps.push(['eval', code]); if (shot) steps.push(['shot', shot, '.smx-cv']); };
const cv = name => steps.push(['shot', name, '.smx-cv']);
const esc = () => steps.push(['key', 'Escape', 'Escape', 27]);

e(`(() => {
  const CITY = ['office', 'street', 'bosco', 'sybil'];
  const room = () => smx.g.roomId;
  const toStreet = () => { if (room() === 'office') T.act('use', 'edoor'); else if (room() === 'bosco') T.act('use', 'exit'); else if (room() === 'sybil') T.act('use', 'door'); };
  const toLawn = () => { if (room() === 'warroom') T.act('use', 'door'); if (room() === 'oval') T.act('use', 'exit'); };
  T.go = to => {
    if (room() === to) return T.info();
    if (CITY.includes(to)) {
      if (!CITY.includes(room())) { toLawn(); T.mapTo('street'); } else toStreet();
      if (to !== 'street') T.act('use', to + 'door');
      return T.info();
    }
    if (CITY.includes(room())) { toStreet(); T.mapTo('lawn'); }
    if (to === 'lawn') { toLawn(); return T.info(); }
    if (room() === 'lawn') T.act('use', 'door');
    if (to === 'warroom' && room() === 'oval') T.act('use', 'wardoor');
    if (to === 'oval' && room() === 'warroom') T.act('use', 'door');
    return T.info();
  };
  T.top = id => {
    const g = smx.g;
    if (g.has(id)) return T.act('use', 'cuestand', id);
    for (let i = 0; i < 6 && g.f.cards[0] !== id; i++) T.act('use', 'cuestand');
    return g.f.cards.join(',');
  };
  T.ask = topic => { T.act('talk', 'lincoln'); T.ch('issues'); T.ch(topic); if (smx.g.dialog) { T.bye(); T.bye(); } return T.info(); };
  T.panelPt = value => {
    const d = smx.g.drive;
    for (let y = 0; y < 200; y += 2) for (let x = 0; x < 320; x += 2) if (d.hit(x, y) === value) return T.pt(x + 3, y + 3);
    return null;
  };
  T.poll = () => JSON.stringify(SamMax.EP104.poll(smx.g));
  return 'tour helpers';
})()`);
steps.push(['sleep', 500]);
cv('00_title');
steps.push(['move', 'T.titlePt(0)'], ['sleep', 200]);
cv('01_title_hover');
steps.push(['click', 'T.titlePt(0)']);
e('T.step(110)', '02_card');
e('T.until(g => g.closeup && g.closeup.kind === "tv4", 2000); T.step(60)', '03_tv_laws');
e('T.idle()', '04_commish');
steps.push(['move', 'T.optPt(0)'], ['eval', 'smx.draw(); T.info()']);
cv('05_commish_hover');
steps.push(['click', 'T.optPt(0)']);
e('T.step(60)', '06_phone');
e('T.idle(); smx.g.choose("bye"); T.until(g => g.f.closetOpen, 3000); T.step(40)', '07_feed_leonard');
e('T.idle()');
steps.push(['key', '3', 'Digit3', 51], ['move', 'T.hotPt("glove")'], ['eval', 'smx.draw(); T.info()']);
cv('08_hover_glove');
steps.push(['click', 'T.hotPt("glove")']);
e('T.idle() + " glove=" + smx.g.has("glove")');
e('T.act("look", "leocloset"); T.act("look", "mrbear"); smx.g.perform("use", "tv"); T.step(90)', '09_tv_hugs');
e('T.idle()');
steps.push(['key', 'i', 'KeyI', 73], ['eval', 'smx.draw(); T.info()']);
cv('10_inventory');
steps.push(['key', 'i', 'KeyI', 73]);
esc();
e('smx.draw(); "menu=" + JSON.stringify(smx.menu && smx.menu.kind)', '11_menu');
esc();
e('"saved=" + smx.saveSlot("tour") + " slots=" + Object.keys(smx.saves()).join(",")');
e('T.act("use", "edoor")', '12_street');
e('T.act("talk", "hugh"); T.ch("prism")', '13_hugh');
e('T.bye(); T.mapTo("lawn")', '14_lawn');
e('T.act("use", "door")', '15_superball');
e('T.ch("duty"); T.ch("boss"); T.bye(); T.act("look", "payphone"); T.act("talk", "jimmy"); T.ch("lobby")', '16_jimmy');
e('T.bye(); T.go("office"); T.act("use", "phone"); T.ch("wh")', '17_call');
e('T.ch("baby"); T.ch("hold"); T.go("lawn")', '18_booth');
e('smx.g.perform("use", "door"); T.until(g => g.roomId === "oval" && g.fade < 0.1, 3000); T.step(120)', '19_oval');
e('T.idle(); T.act("talk", "chuckles"); T.ch("mob")', '20_chuckles');
e('T.ch("leave"); T.bye(); T.act("use", "pres", "glove"); smx.g.perform("use", "wardoor"); T.until(g => g.actors.chuckles.act === "grab", 3000); T.step(20)', '21_thrown_out');
e('T.until(g => g.roomId === "lawn" && g.actors.whizzer.room === "lawn", 4000); T.step(50)', '22_whizzer');
e('T.idle(); T.act("use", "door"); T.act("talk", "pres"); T.ch("ready")', '23_interp');
e('T.ch("love"); smx.g.choose("drink"); T.until(g => g.f.globeOpen, 3000); T.step(90)', '24_soda');
e('T.idle()', '25_interp2');
e('smx.g.choose("war"); T.until(g => g.actors.chuckles.act === "grab", 4000); T.step(30)', '26_escort');
e('T.idle(); smx.g.perform("use", "pres", "glove"); T.until(g => g.actors.max.act === "punch", 4000); T.step(4)', '27_punch');
e('T.until(g => g.f.puppetDown && !g.fx.flash, 2000); T.step(60)', '28_puppet');
e('T.until(g => g.closeup && g.closeup.kind === "memorial", 9000); T.step(70)', '29_memorial');
e('T.step(40)', '30_memorial_up');
e('T.idle()', '31_election');
e('T.act("use", "headfloor"); T.act("use", "exit")', '32_stage');
e('T.act("talk", "lincoln")', '33_debate');
e('T.ch("max"); T.bye(); T.top("wrongs"); T.ask("school"); T.act("use", "nofeed"); T.top("nofeed"); T.ask("poor"); T.poll()', '34_two_blunders');
e('T.go("street"); T.act("use", "posters"); T.act("talk", "hugh"); T.ch("trick"); T.idle()', '35_hugh_gone');
e('T.act("use", "delivery"); T.until(g => g.actors.hugh.visible, 900); T.idle(); T.go("lawn"); T.top("poster"); T.ask("tax"); T.top("delivery"); T.ask("waste"); T.poll()', '36_one_point');
e('T.ask("family"); T.act("use", "flyers"); smx.g.perform("use", "lincoln", "roach"); T.until(g => g.actors.lincoln.act === "point", 3000); T.step(30)', '37_record');
e('T.idle(); T.go("sybil"); T.act("talk", "sybil"); T.ch("you"); T.bye(); smx.g.perform("use", "sybil", "flyer"); T.until(g => g.actors.sybil.act === "swoon", 3000); T.step(20)', '38_smitten');
e('T.idle(); T.go("office"); T.act("use", "closetin", "head")', '39_closet_head');
e('T.act("use", "phone", "roach")', '40_bugcall');
steps.push(['move', 'T.optPt(smx.g.optionIds().indexOf("iam"))'], ['eval', 'smx.draw(); T.info()']);
cv('41_bugcall_hover');
e('T.ch("chains"); T.ch("iam"); T.ch("day"); T.ch("steps"); smx.g.choose("now"); T.until(g => g.roomId === "lawn" && g.actors.sybil.act === "swoon", 5000); T.step(20)', '42_scandal');
e('T.until(g => g.actors.lincoln.act === "rage", 9000); T.step(30)', '43_rage');
e('T.idle()', '44_wreck');
e('smx.g.perform("use", "door"); T.until(g => g.roomId === "oval" && g.fade < 0.1, 3000); T.step(150)', '45_president_max');
e('T.idle(); T.act("talk", "specs"); T.ch("rush")', '46_governors');
e('T.ch("war"); T.bye(); T.act("use", "ribbon"); T.act("use", "superball", "ribbon")', '47_title');
e('T.ch(smx.g.optionIds()[0]); T.act("use", "calendar")', '48_calendar');
steps.push(['click', 'T.panelPt(8)'], ['eval', 'T.step(3)'], ['move', 'T.panelPt(26)'], ['eval', 'T.step(3)']);
cv('49_calendar_hover');
steps.push(['click', 'T.panelPt(26)'], ['eval', 'T.step(3) + " today=" + smx.g.f.today'], ['click', 'T.panelPt(0)']);
e('T.idle(); T.act("talk", "superball"); smx.g.choose("vac"); T.until(g => g.actors.superball.act === "salute", 3000); T.step(20)', '50_day_off');
e('T.idle(); T.act("use", "budget")', '51_budget');
esc();
e('T.idle(); T.go("bosco"); T.act("talk", "bosco"); T.ch("sell")', '52_bosco');
e('T.bye(); T.go("sybil"); T.act("talk", "sybil"); smx.g.choose("how"); T.until(g => g.actors.sybil.act === "scan", 3000); T.step(15)', '53_carbon');
e('T.idle(); T.bye(); T.go("oval"); T.act("use", "budget")', '54_budget_sybil');
steps.push(['click', 'T.panelPt(3)']);
e('T.idle(); T.go("sybil")', '55_sybil_gone');
e('T.act("use", "dater"); T.go("bosco"); T.act("use", "weenies", "dater")', '56_weenies');
e('T.go("oval"); T.act("use", "budget")', '57_budget_bosco');
steps.push(['click', 'T.panelPt(4)']);
e('T.idle(); T.go("bosco")', '58_serum');
e('T.go("oval"); smx.g.perform("use", "whizzer", "serum"); T.until(g => g.actors.specs.act === "attack", 5000); T.step(30)', '59_truth');
e('T.until(g => g.closeup && g.closeup.kind === "warsong", 9000); T.until(g => g.closeup.clock > 5.5, 9000)', '60_warsong');
for (const [at, name] of [[31, 'war'], [41, 'couch'], [52, 'seal'], [66, 'star'], [73, 'stage'], [79.5, 'poster'], [90.5, 'pool'], [102.5, 'rise'], [109, 'flag'], [124, 'lie'], [131.5, 'economy'], [137, 'march'], [158.2, 'thumb']]) {
  e(`T.until(g => !g.closeup || g.closeup.clock > ${at}, 9000) + ' t=' + (smx.g.closeup ? smx.g.closeup.clock.toFixed(2) : '-')`, '61_warsong_' + name);
}
e('T.idle(); T.act("use", "wardoor")', '62_warroom');
e('smx.g.perform("use", "periscope"); T.until(g => g.closeup && g.closeup.kind === "periscope" && g.fade < 0.1, 3000); T.step(40)', '63_periscope');
e('T.idle(); T.act("look", "manual"); T.act("use", "console"); T.step(30)', '64_target');
e('T.idle()');
steps.push(['click', 'T.panelPt(3)'], ['eval', 'T.step(10)']);
cv('65_kremlin');
steps.push(['click', 'T.panelPt(1)'], ['eval', 'T.step(10)'], ['move', 'T.panelPt("fire")'], ['eval', 'T.step(2)']);
cv('66_antarctica');
steps.push(['click', 'T.panelPt("fire")']);
e('T.until(g => g.closeup && g.closeup.kind === "launch" && g.fade < 0.1, 4000); T.step(45)', '67_launch');
e('T.until(g => g.closeup && g.closeup.kind === "impact" && g.closeup.phase === "hit", 6000); T.step(20)', '68_penguins');
e('T.idle(); T.act("use", "console"); T.idle(); smx.g.drive.pick("fire"); T.until(g => g.closeup && g.closeup.kind === "impact" && g.closeup.phase === "hit", 9000); T.step(18)', '69_intercept');
e('T.idle(); T.go("bosco")', '70_bosco_shot');
e('T.act("use", "salesign")', '71_beacon');
e('T.go("street"); T.act("use", "desoto"); smx.g.drive.choose("chase"); T.until(g => g.mode === "drive" && !g.busy, 6000); T.step(40)', '72_chase');
steps.push(['loop', 'smx.g.f.beaconOn || smx.g.mode !== "drive"', `(() => {
  const g = smx.g, d = g.drive, PZ = SamMax.driveMath.PLAYER_Z;
  if (!d || d.kind !== 'abe' || d.paused) return null;
  if (g.busy) return T.pt(160, 150);
  const danger = d.wrecks.filter(w => w.z < PZ + 10 && w.z > PZ - 1);
  const free = [-1, 0, 1].filter(l => !danger.some(w => Math.abs(w.x - l) < 0.75));
  if (free.length && !free.includes(d.lane)) { const to = free.sort((a, b) => Math.abs(a - d.lane) - Math.abs(b - d.lane))[0]; d.steer(to > d.lane ? 1 : -1); }
  if (d.abe.z > 17.5) return null;
  const b = d.abeBox();
  return T.pt(Math.round((b.x0 + b.x1) / 2), Math.round(Math.max(30, (b.y0 + b.y1) / 2)));
})()`, 'T.step(2)', 6000]);
e('T.step(30)', '73_beacon_on');
e('T.until(g => g.mode === "room", 6000); T.idle(); T.go("warroom"); T.act("use", "console"); T.idle(); T.step(20)', '74_target_lincoln');
steps.push(['click', 'T.panelPt("fire")']);
e('T.until(g => g.closeup && g.closeup.kind === "impact" && g.fade < 0.1, 9000); T.step(70)', '75_lincoln');
e('T.until(g => g.closeup && g.closeup.phase === "hit", 9000); T.step(12)', '76_hit');
e('T.until(g => g.closeup && g.closeup.phase === "rubble", 9000); T.step(50)', '77_rubble');
e('T.until(g => g.roomId === "office" && g.fade < 0.1, 9000); T.step(60)', '78_closet');
e('T.until(g => g.closeup && g.closeup.kind === "tv4", 9000); T.step(40)', '79_president_max_tv');
e('T.until(g => g.ended, 9000); T.step(120)', '80_credits');
steps.push(['click', 'T.pt(160, 100)'], ['sleep', 300]);
e('"screen=" + smx.screen + " load=" + smx.loadSlot("tour") + " " + T.info()', '81_loaded');
e(`(() => { const a = smx.audio, bad = []; for (const id of ['title4', 'lawn', 'oval', 'campaign', 'bosco4', 'warroom', 'warsong', 'abechase', 'credits4']) { try { a.music(id); for (let i = 0; i < 60; i++) a.update(); } catch (err) { bad.push('music ' + id + ': ' + err.message); } } for (const id of ['dial', 'busy', 'beep', 'scan', 'boo', 'klaxon', 'missile', 'stomp', 'laser', 'burp', 'fizz', 'fanfare', 'stamp', 'rip']) { try { a.sfx(id); } catch (err) { bad.push('sfx ' + id + ': ' + err.message); } } const all = smx.saves(); delete all.tour; localStorage.setItem(smx.ep.SAVE_KEY, JSON.stringify(all)); return 'audio ' + (a.ctx ? a.ctx.state : 'none') + ' failed=' + !!smx.soundFailed + ' problems=' + bad.join('; '); })()`);

e(`(() => { window.__draws = 0; const d = smx.draw.bind(smx); smx.draw = () => { window.__draws++; d(); }; smx.audio.resume(); return 'real time check, context ' + (smx.audio.ctx && smx.audio.ctx.state); })()`);
for (const id of ['title4', 'lawn', 'oval', 'campaign', 'bosco4', 'warroom', 'warsong', 'abechase', 'credits4']) {
  e(`(() => { smx.audio.music('${id}'); window.__d0 = window.__draws; window.__s0 = smx.audio.step; return 'music ${id}'; })()`);
  steps.push(['sleep', 1500]);
  e(`'${id}: draws=' + (window.__draws - window.__d0) + ' theme=' + smx.audio.theme + ' steps=' + smx.audio.step + ' failed=' + !!smx.soundFailed`);
}

module.exports = { page: 'sammax104.html', size: '1100,800', steps };
