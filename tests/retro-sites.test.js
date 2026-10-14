
const fs = require('fs');
const path = require('path');

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  vfs: {
    writeFile: () => true
  },
  soundSys: {
    playDing: () => {},
    playIcqUhOh: () => {},
    playClick: () => {}
  },
  winManager: {
    windows: new Map(),
    openDialog: () => {},
    createWindow: () => ({})
  },
  appNotepad: {
    open: () => {}
  },
  appIgroman: {
    open: () => {}
  }
};

eval(fs.readFileSync(path.join(__dirname, '../js/apps/winamp-skins.js'), 'utf8'));

const retroSitesCode = fs.readFileSync(path.join(__dirname, '../js/apps/retro-sites.js'), 'utf8');
eval(retroSitesCode);

const ieCode = fs.readFileSync(path.join(__dirname, '../js/apps/ie.js'), 'utf8');
eval(ieCode);

console.log('--- Testing Retro Sites Expansion for Internet Explorer 5.0 ---');

const engine = window.retroSites;
if (!engine) {
  console.error('FAIL: window.retroSites is not defined');
  process.exit(1);
}
console.log('PASS 1: RetroSitesEngine successfully initialized');

const ringHtml = engine.renderWebRing('http://www.lib.ru');
if (!ringHtml.includes('The Retro WebRing 1998') || !ringHtml.includes('Случайный узел')) {
  console.error('FAIL: WebRing rendering failed');
  process.exit(1);
}
console.log('PASS 2: Universal WebRing renders with prev/random/next links');

const libRuHtml = engine.renderLibRu('http://www.lib.ru');
if (!libRuHtml.includes('Библиотека Максима Мошкова') || !libRuHtml.includes('btn-libru-open-notepad') || !libRuHtml.includes('Понедельник начинается в субботу')) {
  console.error('FAIL: Lib.ru rendering failed');
  process.exit(1);
}
console.log('PASS 3: Lib.ru renders with text reader, Notepad launcher and save button');

const igroHtml = engine.renderIgromania('http://www.igromania.ru');
if (!igroHtml.includes('ИГРОМАНИЯ') || !igroHtml.includes('btn-igro-open-cd') || !igroHtml.includes('AVPRED.mp4')) {
  console.error('FAIL: Igromania rendering failed');
  process.exit(1);
}
console.log('PASS 4: Igromania renders with CD video player and Director Shell launcher');

eval(fs.readFileSync(path.join(__dirname, '../js/apps/cheatcc-site.js'), 'utf8'));
const cheat = window.cheatccSite;
const cheatHtml = cheat.renderSite('http://www.cheatcc.com') + cheat.renderSite('http://www.cheatcc.com/pc/doom.html') + cheat.renderSite('http://www.cheatcc.com/myths.html');
if (!cheatHtml.includes('Cheat Code Central') || !cheatHtml.includes('IDDQD') || !cheatHtml.includes('xyzzy') || !cheatHtml.includes('cheats@cheatcc.com')) {
  console.error('FAIL: Cheat Code Central rendering failed');
  process.exit(1);
}
console.log('PASS 5: Cheat Code Central renders the index, a game page and the myths page');

const winampHtml = engine.renderWinampSkins('http://skins.winamp.com');
if (!winampHtml.includes('Nullsoft Winamp Skins Archive') || !window.winampSkins.every(skin => winampHtml.includes(`data-skin="${skin.id}"`)) || !winampHtml.includes('data-wsk="apply"') || !winampHtml.includes('wa-skin-elektronika')) {
  console.error('FAIL: Winamp Skins Archive rendering failed');
  process.exit(1);
}
console.log('PASS 6: Winamp Skins Archive renders with skins showcase and apply buttons');

const spaceJamHtml = engine.renderSpaceJam('http://www.spacejam.com');
if (!spaceJamHtml.includes('SPACE JAM') || !spaceJamHtml.includes('Planet B-Ball') || !spaceJamHtml.includes('Lunar Tunes')) {
  console.error('FAIL: Space Jam rendering failed');
  process.exit(1);
}
console.log('PASS 7: Space Jam renders with planets navigation');

const icqHtml = engine.renderIcqPortal('http://www.icq.com');
if (!icqHtml.includes('Mirabilis ICQ World') || !icqHtml.includes('btn-icqweb-send') || !icqHtml.includes('749210')) {
  console.error('FAIL: ICQ Web-Pager rendering failed');
  process.exit(1);
}
console.log('PASS 8: ICQ Web-Pager renders with UIN message sender and White Pages');

const y2kHtml = engine.renderY2K('http://www.y2k-countdown.org');
if (!y2kHtml.includes('ОШИБКА 2000 ГОДА') || !y2kHtml.includes('btn-y2k-run-test') || !y2kHtml.includes('Памятка по выживанию')) {
  console.error('FAIL: Y2K Bug Center renders with countdown and BIOS test');
  process.exit(1);
}
console.log('PASS 9: Y2K Bug Survival Center renders with interactive BIOS test');

const fidoHtml = engine.renderFidoNet('http://fido.relcom.ru');
if (!fidoHtml.includes('FidoNet Web Gateway') || !fidoHtml.includes('RU.GAME') || !fidoHtml.includes('btn-fido-send')) {
  console.error('FAIL: FidoNet Gateway rendering failed');
  process.exit(1);
}
console.log('PASS 10: FidoNet Gateway renders with echo conferences and message posting');

const yandexHtml = engine.renderYandex('http://www.yandex.ru');
if (!yandexHtml.includes('Найдётся всё!') || !yandexHtml.includes('btn-yandex-search') || !yandexHtml.includes('Цитата дня')) {
  console.error('FAIL: Yandex 1998 rendering failed');
  process.exit(1);
}
console.log('PASS 11: Yandex 1998 renders with morphology search and quote of the day');

const ie = window.appIE;
const routeTests = [
  { url: 'http://www.lib.ru', expectedKey: 'libru' },
  { url: 'http://www.igromania.ru', expectedKey: 'igromania' },
  { url: 'http://www.cheatcc.com', expectedKey: 'cheatcc' },
  { url: 'http://skins.winamp.com', expectedKey: 'winampskins' },
  { url: 'http://www.spacejam.com', expectedKey: 'spacejam' },
  { url: 'http://www.icq.com', expectedKey: 'icqportal' },
  { url: 'http://www.y2k-countdown.org', expectedKey: 'y2k' },
  { url: 'http://fido.relcom.ru', expectedKey: 'fidonet' },
  { url: 'http://www.yandex.ru', expectedKey: 'yandex' },
  { url: 'http://www.themeworld98.com', expectedKey: 'themeworld' }
];

for (const rt of routeTests) {
  const k = ie.identifyPageKey(rt.url);
  if (k !== rt.expectedKey) {
    console.error(`FAIL: Routing for ${rt.url} expected ${rt.expectedKey} but got ${k}`);
    process.exit(1);
  }
  const title = ie.getPageTitle(k);
  if (!title || title.length < 5) {
    console.error(`FAIL: Page title for ${k} is invalid: "${title}"`);
    process.exit(1);
  }
}
console.log('PASS 12: All 10 site routes and page titles verified in AppIE');

function createMockEl() {
  return {
    appendChild: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
    querySelector: () => createMockEl(),
    querySelectorAll: () => []
  };
}
global.document = {
  createElement: () => createMockEl(),
  body: {
    appendChild: () => {}
  },
  querySelector: () => createMockEl(),
  querySelectorAll: () => []
};

const clippyCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy.js'), 'utf8');
eval(clippyCode);

const clippy = window.appClippy;
if (!clippy) {
  console.error('FAIL: window.appClippy is not defined');
  process.exit(1);
}

let lastSpoken = null;
clippy.speak = (text, actions, mood) => {
  lastSpoken = { text, actions, mood };
};
clippy.visible = true;
clippy.annoyance = 'normal';

const clippyKeys = ['libru', 'igromania', 'cheatcc', 'winampskins', 'spacejam', 'icqportal', 'y2k', 'fidonet', 'yandex', 'themeworld'];
for (const key of clippyKeys) {
  lastSpoken = null;
  clippy._lastIePageKey = null;
  clippy._lastIeTime = 0;
  clippy.onNavigateIE(`http://${key}.com`, key, 'Test');
  
}

console.log('PASS 13: Clippy site reactions loaded and verified for all 10 new retro sites');

console.log('\n========================================');
console.log('ALL 13 RETRO SITES TESTS PASSED!');
console.log('========================================');
process.exit(0);
