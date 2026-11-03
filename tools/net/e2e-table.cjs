const fs = require('fs');
const path = require('path');
const { startStack, openPage, intoGame, sleep } = require('./e2e.cjs');

const NAMES = ['Kaia', 'Finlay', 'Mio'];
const consent = async p => {
  await p.ev('hsrui.top().sel=hsrui.top().items().findIndex(it=>it.id==="coop");1');
  await p.key('Enter');
  await p.until('!!hsrui.top().netConsent', 'consent');
  await p.key('ArrowLeft');
  await p.key('Enter');
  await p.until('Net98.state==="online"&&!!Net98.friends', 'link');
};
const pick = (p, id) => p.ev('hsrui.top().sel=hsrui.top().rows().findIndex(r=>r.id===' + JSON.stringify(id) + ');1');
const pickItem = (p, id) => p.ev('hsrui.top().sel=hsrui.top().items().findIndex(r=>r.id===' + JSON.stringify(id) + ');1');
const pasteEvent = (p, text) => p.ev('(()=>{const box=new DataTransfer();box.setData("text/plain",' + JSON.stringify(text) + ');document.body.dispatchEvent(new ClipboardEvent("paste",{clipboardData:box,bubbles:true,cancelable:true}));return 1;})()');
const clickAt = async (p, x, y) => {
  const at = await p.ev('(()=>{const r=hsrui.canvas.getBoundingClientRect();return {x:r.left+' + x + '*r.width/640,y:r.top+' + y + '*r.height/480};})()');
  for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 });
};

async function main() {
  const shots = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || path.join(__dirname, '..', '..', 'dist', 'table-shots');
  fs.mkdirSync(shots, { recursive: true });
  const stack = await startStack({ speed: 1 });
  const report = { steps: [], ok: false };
  const log = t => { report.steps.push(t); console.log(t); };
  const pages = [];
  try {
    for (let i = 0; i < NAMES.length; i++) {
      pages.push(await openPage(stack.api, stack.base + '/hsr98.html', NAMES[i]));
      await intoGame(pages[i], i, stack.netUrl);
      await pages[i].ev('window.__e2e.stopBot=true;(g=>{g.state.name=' + JSON.stringify(NAMES[i]) + ';g.state.flags.express_intro=true;g.profile().avatar=' + JSON.stringify(['kafka', 'clara', 'bronya'][i]) + ';})(hsrui.game);1');
    }
    const [a, b, d] = pages;
    const shot = async (p, name) => { await sleep(150); await p.shot(path.join(shots, 'table-' + name + '.png')); };
    for (const p of pages) await consent(p);
    await sleep(2500);
    await shot(a, '01-no-table');
    log('consent and link');

    await a.key('Enter');
    await a.until('!!Net98.table', 'a table');
    const code = await a.ev('Net98.table.code');
    await pick(a, 'open');
    await a.key('Enter');
    await a.until('Net98.table.open', 'open table');
    await shot(a, '02-host');
    log('table ' + code + ' is open');

    await pick(b, 'list');
    await b.key('Enter');
    await b.until('!!hsrui.top().hdTables&&(Net98.tables||[]).some(t=>t.code===' + JSON.stringify(code) + ')', 'the open table in the list');
    await shot(b, '03-open-tables');
    await b.ev('hsrui.top().sel=Net98.tables.findIndex(t=>t.code===' + JSON.stringify(code) + ');1');
    await b.key('Enter');
    await b.until('!!Net98.table&&hsrui.top().hdTable', 'B at the table');
    log('B sat down from the list');

    await pick(d, 'join');
    await d.key('Enter');
    await d.until('!!hsrui.top().textEntry', 'code entry');
    await pasteEvent(d, 'Стол: ' + code);
    await d.key('Enter');
    await d.until('!!Net98.table&&hsrui.top().hdTable', 'third player');
    log('third player came by a pasted code');
    await a.until('Net98.table.seats.filter(Boolean).length===3', 'three seats');
    await shot(a, '04-lobby-waits');

    await a.key('Digit3');
    await shot(a, '05-lobby-kick');
    await a.key('Digit3');
    await d.until('!Net98.table', 'the third is out');
    await sleep(200);
    await shot(d, '06-kicked');
    await pick(d, 'join');
    await d.key('Enter');
    await d.until('!!hsrui.top().textEntry', 'code entry again');
    await pasteEvent(d, code);
    await d.key('Enter');
    await d.until('!!Net98.table&&hsrui.top().hdTable', 'third player back');
    log('kicked and returned');

    for (const p of [b, d]) { await pick(p, 'ready'); await p.key('Enter'); await p.until('Net98.table.seats[Net98.seat].ready', 'ready'); }
    await a.until('Net98.table.seats.filter(s=>s&&s.ready).length===2', 'all ready');
    await shot(a, '07-lobby-ready');
    await shot(b, '08-lobby-guest');
    await pick(a, 'start');
    await a.key('Enter');
    for (const p of pages) await p.until('!!hsrui.top().draft', 'draft');
    await sleep(1400);
    await a.key('Enter');
    await a.until('hsrui.netSession.takes[0]!=null', 'A took a hero');
    await sleep(300);
    await shot(b, '09-draft-seats');
    log('draft strip shows the take');
    await b.key('Enter');
    await d.key('Enter');
    for (const p of pages) await p.until('!!hsrui.top().arena', 'arena', 40000);
    const keys = await Promise.all(pages.map(p => p.ev('hsrui.netSession.A.heroes.map(h=>h.key).join()')));
    if (new Set(keys).size !== 1) throw new Error('crew differs: ' + keys.join(' / '));
    log('crew ' + keys[0]);
    await sleep(800);
    await shot(a, '10-arena');

    await a.ev('hsrui.mouse={x:360,y:180,t:hsrui.t};hsrui.top().markHere();1');
    await b.until('hsrui.top().marks.length===1', 'the mark reaches B');
    await sleep(100);
    await shot(b, '11-mark');
    log('mark reached the table');
    await a.key('KeyV');
    await shot(a, '12-phrases');
    await a.key('Digit2');
    await b.until('hsrui.top().feed.length===1', 'the phrase reaches B');
    await sleep(100);
    await shot(b, '13-phrase');
    log('phrase reached the table');

    await a.key('Escape');
    await shot(a, '14-menu');
    await a.key('Escape');
    await a.key('KeyP');
    for (const p of pages) await p.until('hsrui.netPaused()', 'pause');
    await sleep(300);
    await shot(a, '15-pause-mine');
    await shot(b, '16-pause-other');
    const tick = await a.ev('hsrui.netSession.A.tick');
    await a.ev('(()=>{const s=hsrui.top();s.card={tab:0,top:0};return 1;})()');
    await shot(a, '17-pause-card');
    await a.ev('hsrui.top().card=null;1');
    await d.key('KeyV');
    await d.key('Digit6');
    await a.until('hsrui.top().feed.length>=1', 'a phrase on pause');
    log('phrase went through the pause');
    await a.ev('(()=>{const s=hsrui.top(),h=s.arena.heroes[s.me];h.dead=true;h.respawn=9;s.watchAlly(1);return 1;})()');
    await sleep(500);
    await shot(a, '19-dead-watch');
    await a.ev('(()=>{const s=hsrui.top(),h=s.arena.heroes[s.me];h.dead=false;return 1;})()');
    await sleep(100);
    await clickAt(a, 320, 108 + 148 - 28);
    await a.until('Net98.table.paused&&Net98.table.paused.resume!=null', 'the button lifts the pause');
    await sleep(200);
    await shot(b, '18-pause-countdown');
    await a.until('!hsrui.netPaused()', 'pause lifted', 8000);
    await a.until('hsrui.netSession.A.tick>' + tick, 'game goes on');
    log('pause, its window and its button');

    await Promise.all(pages.map(p => p.ev('hsrui.netSession.A.over="win";1')));
    for (const p of pages) await p.until('!!hsrui.top().crewResult', 'crew result');
    await sleep(400);
    await shot(a, '20-result');
    await shot(b, '21-result-other');
    log('crew result');
    await pickItem(a, 'friend');
    await a.key('Enter');
    await a.until('Net98.friends.out.length===1', 'friend request');
    await sleep(200);
    await shot(a, '22-result-friend-sent');
    log('«В друзья» from the result');

    await pickItem(d, 'out');
    await d.key('Enter');
    await d.until('!Net98.table', 'the third player left');
    await pickItem(a, 'again');
    await a.key('Enter');
    await a.until('hsrui.top().hdTable&&Net98.table.state==="lobby"', 'A at the table again');
    await b.until('Net98.table.state==="lobby"', 'B sees the lobby');
    await sleep(200);
    await shot(b, '23-result-table-gathers');
    await pickItem(b, 'again');
    await b.key('Enter');
    await b.until('hsrui.top().hdTable', 'B at the table again');
    await pick(b, 'ready');
    await b.key('Enter');
    await a.until('Net98.table.seats.filter(s=>s&&s.ready).length===1', 'B is ready');
    await shot(a, '24-again-lobby');
    await pick(a, 'start');
    await a.key('Enter');
    for (const p of [a, b]) await p.until('!!hsrui.top().draft', 'second draft');
    log('«Ещё партию»: the same table plays again');
    await a.key('Escape');
    await a.key('Escape');
    await a.until('!hsrui.netSession', 'A left the draft');
    await b.key('Escape');
    await b.key('Escape');
    await b.until('!hsrui.netSession', 'B left the draft');

    await a.ev('hsrui.screens=hsrui.screens.filter(s=>s.hub);hsrui.openHdRecords();hsrui.top().tab=1;1');
    await shot(a, '25-records-crew');
    await a.ev('hsrui.screens=hsrui.screens.filter(s=>s.hub);hsrui.openHdTrials();1');
    await shot(a, '26-trials');
    await a.ev('hsrui.screens=hsrui.screens.filter(s=>s.hub);hsrui.openHdRules();hsrui.top().sel=hsrui.top().sel=8;1');
    await shot(a, '27-rules');
    await a.ev('hsrui.screens=hsrui.screens.filter(s=>s.hub);hsrui.openHdHistory();1');
    await shot(a, '28-history');
    await a.ev('hsrui.screens=hsrui.screens.filter(s=>s.hub);1');
    report.solo = await a.ev('hsrui.game.hdRecords("normal").filter(r=>r.crew).length');
    report.crew = await a.ev('hsrui.game.hdCrewRecords("normal").length');
    report.errors = pages.flatMap(p => p.errors.map(e => p.name + ': ' + e));
    report.ok = !report.errors.length && report.solo === 0 && report.crew === 1;
  } catch (err) {
    report.failure = String(err && err.stack || err);
    report.errors = pages.flatMap(p => p.errors.map(e => p.name + ': ' + e));
  }
  console.log(JSON.stringify(report, null, 1));
  await stack.stop();
  process.exit(report.ok ? 0 : 1);
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
