const fs = require('fs');
const path = require('path');
const { startStack, openPage, intoGame, sleep } = require('./e2e.cjs');

const NAMES = ['Kaia', 'Finlay', 'Mio'];
const LEADS = ['kafka', 'clara', 'bronya'];
const SAVE_KEY = 'Object.keys(localStorage).find(k=>k.endsWith("auto")&&k.includes("hsr"))';

const dress = (p, i) => p.ev('(g=>{window.__e2e.stopBot=true;g.state.name=' + JSON.stringify(NAMES[i]) + ';g.state.flags.express_intro=true;g.state.flags.doom=true;g.eventsOpen=()=>false;g.ascNoteDue=()=>false;g.script=null;g.pending=null;g.addChar(' + JSON.stringify(LEADS[i]) + ',40);g.state.party=[' + JSON.stringify(LEADS[i]) + '].concat(g.state.party);hsrui.screens=[];return 1;})(hsrui.game)');
const toExpress = (p, x, y) => p.ev('(g=>{g.loadMap("express",null,{silent:true});g.placePlayer(' + x + ',' + y + ');g.script=null;g.pending=null;hsrui.dlg=null;hsrui.screens=[];hsrui.enterField();return 1;})(hsrui.game)');
const consent = async p => {
  await p.ev('hsrui.openFriends(0);1');
  await p.until('!!hsrui.top().netConsent', 'consent');
  await p.key('ArrowLeft');
  await p.key('Enter');
  await p.until('Net98.state==="online"&&!!Net98.friends', 'link');
};
const befriend = async (a, b) => {
  const uidB = await b.ev('Net98.uid()'), uidA = await a.ev('Net98.uid()');
  await a.ev('Net98.send("req",{uid:' + JSON.stringify(uidB) + '});1');
  await b.until('Net98.friends.in.some(r=>r.uid===' + JSON.stringify(uidA) + ')', 'a request');
  await b.ev('Net98.send("answer",{uid:' + JSON.stringify(uidA) + ',yes:true});1');
  await a.until('Net98.friends.list.some(r=>r.uid===' + JSON.stringify(uidB) + ')', 'a friend');
};
const clearScript = p => p.ev('(g=>{g.script=null;g.pending=null;hsrui.dlg=null;return 1;})(hsrui.game)');

async function main() {
  const shots = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || path.join(__dirname, '..', '..', 'dist', 'visit-shots');
  fs.mkdirSync(shots, { recursive: true });
  const stack = await startStack({ speed: 1 });
  const report = { steps: [], ok: false };
  const log = t => { report.steps.push(t); console.log(t); };
  const pages = [];
  try {
    for (let i = 0; i < NAMES.length; i++) {
      pages.push(await openPage(stack.api, stack.base + '/hsr98.html', NAMES[i]));
      await intoGame(pages[i], i, stack.netUrl);
      await dress(pages[i], i);
    }
    const [host, guest, late] = pages;
    const shot = async (p, name) => { await sleep(150); await p.shot(path.join(shots, 'visit-' + name + '.png')); };
    for (const p of pages) await consent(p);
    await befriend(host, guest);
    await befriend(host, late);
    log('friends');
    await host.until('!!hsrui.netExpressText', 'the Express is published', 30000);
    await guest.until('Net98.friends.list[0].expr===true', 'the row knows the Express', 30000);
    const uidHost = await host.ev('Net98.uid()');
    await host.ev('hsrui.screens=[];1');
    await toExpress(host, 18, 6);
    await guest.ev('hsrui.screens=[];hsrui.openFriends(0);hsrui.top().sel=1;1');
    await shot(guest, '01-friends-row');

    await guest.ev('hsrui.writeSave("auto");1');
    await guest.key('KeyG');
    await guest.until('!!hsrui.game.guest', 'the guest game');
    const savedAtEntry = await guest.ev('localStorage.getItem(' + SAVE_KEY + ')');
    await sleep(300);
    await shot(guest, '02-first-note');
    await guest.key('Enter');
    await guest.key('Enter');
    await clearScript(guest);
    await sleep(3000);
    await shot(guest, '03-guest-express');
    log('in the Express of the host');
    await host.until('Net98.room&&Net98.room.peers.size===1', 'the host sees a guest');
    await sleep(300);
    await shot(host, '04-host-sees-guest');
    await guest.until('[...Net98.room.peers.values()].some(p=>p.host&&p.m==="express")', 'the guest sees the host');
    await shot(guest, '05-guest-sees-host');
    await guest.ev('hsrui.held=["ArrowUp"];1');
    await sleep(400);
    await guest.ev('hsrui.held=[];1');
    await sleep(400);
    const seenAt = await host.ev('[...Net98.room.peers.values()][0].y');
    const realAt = await guest.ev('hsrui.game.player.y');
    if (seenAt !== realAt) throw new Error('the host sees the guest at ' + seenAt + ', the guest is at ' + realAt);
    log('the host sees the guest walk, y ' + seenAt);

    await guest.key('KeyT');
    await shot(guest, '06-phrases');
    await guest.key('Digit4');
    await host.until('[...Net98.room.peers.values()][0].say', 'a phrase reaches the host');
    await sleep(100);
    await shot(host, '07-host-hears');
    await sleep(1100);
    await host.key('KeyT');
    await host.key('Digit7');
    await guest.until('[...Net98.room.peers.values()].some(p=>p.say)', 'a phrase reaches the guest');
    await shot(guest, '08-guest-hears');
    log('phrases both ways');

    await guest.ev('(g=>{const e=g.map.ents.find(x=>x.def&&x.def.who==="pompom");g.placePlayer(e.x,e.y+1);g.player.dir="up";return 1;})(hsrui.game)');
    await guest.key('Enter');
    await sleep(500);
    await shot(guest, '09-pompom');
    await clearScript(guest);
    await guest.ev('(g=>{const e=g.map.ents.find(x=>x.def&&x.def.script==="warp_terminal");g.placePlayer(e.x,e.y+1);g.player.dir="up";return 1;})(hsrui.game)');
    await guest.key('Enter');
    await sleep(200);
    await shot(guest, '10-terminal');

    await guest.ev('hsrui.game.runScript("exp_guestbook");1');
    await guest.until('!!hsrui.game.pending', 'the book line');
    await guest.key('Enter');
    await guest.key('Enter');
    await guest.until('hsrui.screens.length===1', 'the guest book');
    await shot(guest, '11-book-guest');
    await guest.key('KeyR');
    await guest.until('!!hsrui.top().visitSign', 'the entry list');
    await shot(guest, '12-sign');
    await guest.key('Enter');
    await host.until('Net98.book&&Net98.book.length===1', 'the entry reaches the host');
    await sleep(200);
    await shot(guest, '13-book-signed');
    log('an entry in the book');
    await host.ev('hsrui.game.script=null;hsrui.game.pending=null;hsrui.openBook("guests",null);1');
    await sleep(100);
    await shot(host, '14-book-host');
    await host.key('KeyR');
    await host.until('!!hsrui.top().guestEntries', 'the host list');
    await shot(host, '15-host-entries');
    await host.ev('hsrui.screens=[];1');
    await guest.ev('hsrui.screens=[];hsrui.game.script=null;hsrui.game.pending=null;hsrui.dlg=null;1');

    const creditsBefore = await guest.ev('hsrui.homeGame.state.credits');
    const hostBefore = await host.ev('hsrui.game.state.credits');
    await guest.until('Net98.gifts.length===1', 'the gift after 30 s', 45000);
    await host.until('hsrui.game.state.credits===' + (hostBefore + 2000), 'the host is paid at once', 5000);
    const during = await guest.ev('hsrui.homeGame.state.credits');
    if (during !== creditsBefore) throw new Error('a gift landed during the visit');
    log('the gift waits during the visit');

    await guest.key('Escape');
    await shot(guest, '16-visit-menu');
    await guest.ev('hsrui.top().sel=hsrui.top().rows().findIndex(r=>r.id==="home");1');
    await guest.key('Enter');
    await guest.until('!hsrui.game.guest', 'home');
    const savedAfter = await guest.ev('hsrui.game.state.netGifts?null:localStorage.getItem(' + SAVE_KEY + ')');
    if (savedAfter !== null && savedAfter !== savedAtEntry) throw new Error('the save changed during the visit');
    await guest.until('hsrui.game.state.credits===' + (creditsBefore + 2000), 'the gift at home', 5000);
    const twice = await guest.ev('(()=>{const s=JSON.parse(localStorage.getItem(' + SAVE_KEY + ')).state;return JSON.stringify([s.credits,s.netGifts.length]);})()');
    log('home, gift credited once and saved: ' + twice);
    await sleep(200);
    await shot(guest, '17-home-gift');

    await host.ev('Net98.disconnect("off");1');
    await sleep(400);
    await late.ev('hsrui.screens=[];1');
    await late.until('Net98.friends.list.find(r=>r.uid===' + JSON.stringify(uidHost) + ').on===false', 'the host is away');
    await late.ev('hsrui.visitGo(Net98.friends.list.find(r=>r.uid===' + JSON.stringify(uidHost) + '));1');
    await late.until('!!hsrui.game.guest', 'a visit without the host');
    await late.key('Enter');
    await late.key('Enter');
    await clearScript(late);
    await late.ev('(g=>{g.placePlayer(19,7);g.player.dir="right";return 1;})(hsrui.game)');
    await sleep(3000);
    await shot(late, '18-echo');
    await late.key('Enter');
    await sleep(300);
    await shot(late, '19-echo-signature');
    await clearScript(late);
    log('the echo of a host away');
    await late.until('Net98.gifts.length===1', 'the gift of the visitor', 45000);

    await late.ev('Net98.disconnect("offline");1');
    await sleep(600);
    await shot(late, '20-lost-link');
    await late.ev('hsrui.visitLostT=20;1');
    await late.until('!!hsrui.top()&&hsrui.top().visitLost', 'the way home is offered');
    await shot(late, '21-lost-offer');
    await late.key('Escape');
    await late.ev('Net98.connect();1');
    await late.until('Net98.state==="online"&&!!Net98.room', 'the visit comes back');
    log('the link came back into the same visit');
    await late.ev('Net98.disconnect("offline");hsrui.visitLostT=20;hsrui.visitLostAsked=false;1');
    await late.until('!!hsrui.top()&&hsrui.top().visitLost', 'the way home again');
    await late.key('Enter');
    await late.until('!hsrui.game.guest', 'home after a lost link');
    log('a lost link goes home');

    const paid = await host.ev('hsrui.game.state.credits');
    await host.ev('Net98.connect();1');
    await host.until('Net98.state==="online"&&hsrui.game.state.credits===' + (paid + 2000), 'the host paid at the next login', 15000);
    await sleep(200);
    await shot(host, '22-host-back');
    log('the gift of a host away came at the next login');

    report.errors = pages.flatMap(p => p.errors.map(e => p.name + ': ' + e));
    report.ok = !report.errors.length;
  } catch (err) {
    report.failure = String(err && err.stack || err);
    report.errors = pages.flatMap(p => p.errors.map(e => p.name + ': ' + e));
  }
  console.log(JSON.stringify(report, null, 1));
  await stack.stop();
  process.exit(report.ok ? 0 : 1);
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
