const fs = require('fs');
const path = require('path');
const { startStack, openPage, intoGame, sleep, CDP_PORT } = require('./e2e.cjs');

async function systemPage(api, url) {
  const { browserContextId } = await api.send('Target.createBrowserContext', {});
  const { targetId } = await api.send('Target.createTarget', { url: 'about:blank', browserContextId, width: 1024, height: 768 });
  const ws = new WebSocket('ws://127.0.0.1:' + CDP_PORT + '/devtools/page/' + targetId);
  await new Promise(resolve => { ws.onopen = resolve; });
  let id = 0;
  const wait = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(String((m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description) || m.params.exceptionDetails.text).slice(0, 400));
    if (m.method === 'Runtime.consoleAPICalled' && /ensureIntegrity/.test(JSON.stringify(m.params.args))) errors.push(JSON.stringify(m.params.args).slice(0, 400));
  };
  const send = (method, params) => new Promise(resolve => { const i = ++id; wait.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const page = {
    name: 'system', errors, send,
    ev: async code => {
      const r = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error('system: ' + code.slice(0, 90) + ': ' + JSON.stringify(r.result.exceptionDetails).slice(0, 500));
      return r.result.result ? r.result.result.value : undefined;
    },
    until: async (code, what, ms = 60000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await page.ev(code).catch(() => false)) return;
        await sleep(150);
      }
      throw new Error('system: timed out waiting for ' + what);
    },
    shot: async file => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    }
  };
  await send('Page.navigate', { url });
  return page;
}

const SYSTEM_READY = '!!window.appExplorer&&!!window.vfs&&!!window.appDialUp&&!!window.winManager&&!!window.Net98Shell&&!!window.taskbar&&document.readyState==="complete"';
const DESKTOP_READY = '(()=>{const b=document.getElementById("boot-screen"),p=document.getElementById("bios-post-screen");return (!b||b.style.display==="none")&&(!p||!p.classList.contains("active"));})()';
const itemNamed = name => 'window.vfs.list(appExplorer.currentPath).find(i=>i.key===' + JSON.stringify(name) + ')';
const openNamed = name => 'appExplorer.openItem(winManager.windows.get("app_explorer"),' + itemNamed(name) + ');1';

async function main() {
  const shots = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || path.join(__dirname, '..', '..', 'dist', 'shell-shots');
  fs.mkdirSync(shots, { recursive: true });
  const stack = await startStack({ speed: 1 });
  const report = { steps: [], ok: false };
  const log = t => { report.steps.push(t); console.log(t); };
  let friend = null, sys = null;
  try {
    sys = await systemPage(stack.api, stack.base + '/index.html');
    await sys.until(SYSTEM_READY, 'the system', 180000);
    await sys.ev('localStorage.setItem("net98.url",' + JSON.stringify(stack.netUrl) + ');1');
    await sys.until(DESKTOP_READY, 'the desktop', 180000);
    await sleep(2500);
    await sys.ev('(()=>{for(const id of Array.from(winManager.windows.keys()))try{winManager.closeWindow(id);}catch(e){}return 1;})()');
    await sleep(600);
    const shot = async name => { await sleep(250); await sys.shot(path.join(shots, 'shell-' + name + '.png')); };
    if (await sys.ev('Net98.hasConsent()')) throw new Error('a fresh system has no consent');
    if (await sys.ev('Net98.state') !== 'off') throw new Error('no link before consent');

    await sys.ev('appExplorer.open(["Network Neighborhood"],{showTree:true});1');
    await sys.until('winManager.windows.has("app_explorer")', 'Explorer');
    await shot('01-no-consent');
    if (await sys.ev('Net98.state') !== 'off') throw new Error('the folder must not connect');
    log('fresh system: one icon, no socket');
    await sys.ev(openNamed('Подключить Эфирную связь'));
    await sys.until('winManager.windows.has("app_dialup")', 'the modem window');
    await shot('02-modem');
    const fields = await sys.ev('(()=>{const e=winManager.windows.get("app_dialup").element;return {u:e.querySelector("#dialup-user-input").value,uro:e.querySelector("#dialup-user-input").readOnly,p:e.querySelector("#dialup-pass-input").value,pd:e.querySelector("#dialup-pass-input").disabled,ph:e.querySelector("#dialup-phone-input").value,sel:e.querySelector("#dialup-provider-select").value};})()');
    if (!/^7\d{8}$/.test(fields.u) || !fields.uro || fields.p !== '' || !fields.pd || fields.ph !== '098-0098' || fields.sel !== '4') throw new Error('modem fields ' + JSON.stringify(fields));
    log('the modem opened on the real provider');
    await sys.ev('winManager.windows.get("app_dialup").element.querySelector("#btn-dialup-connect").click();1');
    await sleep(300);
    await shot('03-consent');
    await sys.ev('[...document.querySelectorAll(".win-dialog-buttons button")].find(b=>b.textContent==="Подключиться").click();1');
    await sys.until('Net98.hasConsent()', 'consent');
    await sleep(1500);
    await shot('04-dialing');
    await sys.until('appDialUp.state==="connected"', 'the real connection', 90000);
    await sys.until('winManager.windows.has("app_dialup_status")', 'the status window', 5000);
    await sleep(1200);
    await shot('05-status');
    log('dialing connected the real link: ' + await sys.ev('Net98.state'));

    friend = await openPage(stack.api, stack.base + '/hsr98.html', 'Kaia');
    await intoGame(friend, 0, stack.netUrl);
    await friend.ev('(g=>{window.__e2e.stopBot=true;g.state.name="Kaia";g.state.flags.express_intro=true;g.eventsOpen=()=>false;g.ascNoteDue=()=>false;g.script=null;g.pending=null;hsrui.screens=[];hsrui.openFriends(0);return 1;})(hsrui.game)');
    await friend.until('!!hsrui.top().netConsent', 'consent of the friend');
    await friend.key('ArrowLeft');
    await friend.key('Enter');
    await friend.until('Net98.state==="online"&&!!Net98.friends', 'the friend online');
    const uidSys = await sys.ev('Net98.uid()'), uidFriend = await friend.ev('Net98.uid()');
    await friend.ev('Net98.send("card",{card:hsrui.game.netCard()});1');
    await sys.ev('Net98.send("req",{uid:' + JSON.stringify(uidFriend) + '});1');
    await friend.until('Net98.friends.in.length===1', 'a request');
    await friend.ev('Net98.send("answer",{uid:' + JSON.stringify(uidSys) + ',yes:true});hsrui.screens=[];1');
    await sys.until('Net98.friends.list.length===1&&Net98.friends.list[0].on', 'the friend in the list');
    await sys.until('window.vfs.list(["Network Neighborhood"]).some(i=>i.key==="KAIA")', 'the computer of the friend', 15000);
    await sys.ev('appExplorer.open(["Network Neighborhood"],{showTree:true});1');
    await sleep(400);
    await shot('06-network');
    log('a friend came online as a computer');
    await sys.ev(openNamed('KAIA'));
    await sleep(300);
    await shot('07-friend-pc');
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood"]);1');
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood",window.vfs.list(["Network Neighborhood"]).find(i=>/Этот|This/.test(i.comment||"")).key]);1');
    await sleep(300);
    await shot('08-my-pc');
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood","KAIA"]);1');

    await friend.ev('Net98.disconnect("off");1');
    await sys.until('appExplorer.currentPath.length===1&&!window.vfs.list(["Network Neighborhood"]).some(i=>i.key==="KAIA")', 'the computer disappears, the window goes up', 15000);
    await sleep(300);
    await shot('09-friend-gone');
    log('a friend gone: the computer is gone, the window went up');
    await friend.ev('Net98.connect();1');
    await friend.until('Net98.state==="online"', 'the friend back');
    await sys.until('window.vfs.list(["Network Neighborhood"]).some(i=>i.key==="KAIA")', 'the computer is back', 15000);

    await friend.ev('Net98.send("tableNew",{name:"Kaia",diff:"normal",open:true});1');
    await friend.until('!!Net98.table', 'an open table');
    const code = await friend.ev('Net98.table.code');
    await sys.until('(Net98.tables||[]).some(t=>t.code===' + JSON.stringify(code) + ')', 'the table reaches the list', 20000);
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood","Столы Рубежа"]);1');
    await sleep(400);
    await shot('10-tables');
    log('an open table in the folder: ' + code);
    const inKaia = await sys.ev('Object.keys(window.vfs.resolvePath(["Network Neighborhood","KAIA"]).children).join()');
    if (!inKaia.includes('Рубеж')) throw new Error('the friend at a table has no shortcut: ' + inKaia);

    const installed = await sys.ev('gameManager.isInstalled("hsr98")');
    if (installed) throw new Error('a fresh system has the game');
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood","KAIA"]);' + openNamed('Экспресс'));
    await sleep(1200);
    await shot('11-to-steam');
    const steam = await sys.ev('winManager.windows.has("app_ie")&&/steampowered/.test(winManager.windows.get("app_ie").element.querySelector("input[type=text],.ie-address")?winManager.windows.get("app_ie").element.textContent+appIE.currentUrl:"")');
    if (!steam) throw new Error('a shortcut without the game must lead to the Steam site');
    log('no game, no Steam client: the shortcut leads to steampowered.com');
    await sys.ev('winManager.closeWindow("app_ie");1');

    await sys.ev('(()=>{window.__realInstalled=gameManager.isInstalled;gameManager.isInstalled=id=>id==="hsr98"||window.__realInstalled.call(gameManager,id);return 1;})()');
    await friend.ev('Net98.send("invite",{uid:' + JSON.stringify(uidSys) + '});1');
    await sys.until('document.querySelectorAll("#taskbar-tray .un-tray").length===1', 'the invitation in the tray', 8000);
    await sleep(300);
    await shot('12-tray-invite');
    const tip = await sys.ev('document.querySelector("#taskbar-tray .un-tray").title');
    if (tip !== 'Kaia зовёт: Рубеж Экспресса') throw new Error('tray tip: ' + tip);
    log('the invitation shows in the tray');
    await sys.ev('document.querySelector("#taskbar-tray .un-tray").click();1');
    await sleep(800);
    await shot('13-tray-no-save');
    const noSave = await sys.ev('!!document.querySelector(".win-dialog-text")&&[...document.querySelectorAll(".win-dialog-text")].some(e=>/Сначала начните/.test(e.textContent))');
    if (!noSave) throw new Error('no save: the system must say so');
    await sys.ev('[...document.querySelectorAll(".win-dialog-buttons button")].forEach(b=>b.click());1');
    await sys.ev('(u=>{u.newGame();const g=u.game;g.script=null;g.pending=null;g.state.flags.express_intro=true;g.eventsOpen=()=>false;g.ascNoteDue=()=>false;u.writeSave("auto");u.screens=[];return 1;})(appHsr98.ui)');
    await friend.ev('Net98.send("invite",{uid:' + JSON.stringify(uidSys) + '});1');
    await sys.ev('appHsr98.ui.mode="field";appHsr98.ui.netInviteAccept(Net98.activeInvites()[0]||{kind:"table",code:' + JSON.stringify(code) + '});1');
    await sys.until('!!Net98.table&&Net98.table.code===' + JSON.stringify(code), 'a seat at the table', 8000);
    await sleep(400);
    await shot('14-game-at-table');
    log('an invitation leads to the table in the game');
    await sys.ev('appHsr98.ui.screens=[];Net98.send("tableLeave");appHsr98.ui.openFriends(0);1');
    await sys.until('!Net98.table', 'left the table');

    await sys.ev('appDialUp.disconnect();1');
    await sys.until('Net98.state==="modem"', 'the modem switch closes the link', 3000);
    await sleep(400);
    await shot('15-game-modem-off');
    log('the modem switch closes the link and the game says so');
    await sys.ev('appExplorer.navigateTo(winManager.windows.get("app_explorer"),["Network Neighborhood"]);if(winManager.bringToTop)winManager.bringToTop("app_explorer");1');
    await sleep(400);
    await shot('16-network-off');
    const off = await sys.ev('window.vfs.list(["Network Neighborhood"]).map(i=>i.key).join()');
    if (!off.includes('Сеть недоступна') || off.includes('KAIA')) throw new Error('no link: ' + off);

    await sys.ev('localStorage.setItem("net98.url","ws://127.0.0.1:9/api/net");winManager.windows.has("app_dialup")&&winManager.closeWindow("app_dialup");appDialUp.selectEther();appDialUp.open();1');
    await sys.until('winManager.windows.has("app_dialup")', 'the modem again');
    await sys.ev('winManager.windows.get("app_dialup").element.querySelector("#btn-dialup-connect").click();1');
    await sys.until('/Линия занята/.test(winManager.windows.get("app_dialup").element.querySelector("#dialup-status-msg").textContent)', 'a silent server is honest', 60000);
    await shot('17-line-busy');
    const stillOff = await sys.ev('JSON.stringify([window.isOnline,appDialUp.isOnline,Net98.state,winManager.windows.has("app_dialup_status")])');
    if (stillOff !== '[false,false,"modem",false]') throw new Error('after a silent server: ' + stillOff);
    log('a silent server: no connection is reported');

    const stored = await sys.ev('localStorage.getItem(window.vfs.storageKey)');
    if (/KAIA|FILESERVER|MISHA-PC/.test(stored) || stored.includes(uidFriend)) throw new Error('foreign names in the stored VFS');
    log('the stored VFS holds no foreign names');

    await sys.send('Page.reload', {});
    await sleep(1500);
    await sys.until(SYSTEM_READY, 'the system after a reload', 180000);
    await sys.until(DESKTOP_READY, 'the desktop after a reload', 180000);
    await sleep(1500);
    const reloaded = await sys.ev('window.vfs.list(["Network Neighborhood"]).map(i=>i.key).join()');
    const storedAgain = await sys.ev('localStorage.getItem(window.vfs.storageKey)');
    if (reloaded.includes('KAIA') || !reloaded.includes('Сеть недоступна') || /KAIA|FILESERVER|MISHA-PC/.test(storedAgain) || storedAgain.includes(uidFriend)) throw new Error('after a reload: ' + reloaded);
    log('a reload brings no foreign names back: ' + reloaded);
    report.errors = sys.errors.map(e => 'system: ' + e).concat(friend.errors.map(e => 'friend: ' + e));
    report.ok = !report.errors.length;
  } catch (err) {
    report.failure = String(err && err.stack || err);
    report.errors = (sys ? sys.errors : []).concat(friend ? friend.errors : []);
    if (sys) await sys.shot(path.join(shots, 'shell-failure.png')).catch(() => {});
  }
  console.log(JSON.stringify(report, null, 1));
  await stack.stop();
  process.exit(report.ok ? 0 : 1);
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
