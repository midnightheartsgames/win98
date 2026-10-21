const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let passed = 0;

function check(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  }
  passed++;
  console.log('PASS ' + passed + ': ' + msg);
}

const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const writtenFiles = [];
const openedNotepad = [];
const dialogs = [];

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: global.localStorage,
  webGif: (name) => `<svg class="web-gif" data-gif="${name}"></svg>`,
  vfs: {
    writeFile: (folder, file, content) => {
      writtenFiles.push({ folder, file, content });
      return true;
    }
  },
  soundSys: {
    playDing: () => {},
    playIcqUhOh: () => {},
    playClick: () => {}
  },
  winManager: {
    windows: new Map(),
    openDialog: (opts) => {
      dialogs.push(opts);
    },
    createWindow: () => ({})
  },
  appNotepad: {
    open: (title, content, folder) => {
      openedNotepad.push({ title, content, folder });
    }
  }
};

const cssCode = fs.readFileSync(path.join(root, 'css/apps/krovatka-site.css'), 'utf8');
const siteCode = fs.readFileSync(path.join(root, 'js/apps/krovatka-site.js'), 'utf8');
const ieCode = fs.readFileSync(path.join(root, 'js/apps/ie.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

check(indexHtml.includes('css/apps/krovatka-site.css') && indexHtml.includes('js/apps/krovatka-site.js'), 'index.html links krovatka-site.css and krovatka-site.js');

function hasNoComments(code) {
  const strippedUrls = code.replace(/(https?|ftp):\/\//gi, '');
  return !/\/\/|\/\*|<!--/.test(strippedUrls);
}

function hasNoActualComments(code) {
  const stripped = code
    .replace(/(https?|ftp):\/\//gi, 'URL')
    .replace(/\^https\?:\\\/\\\/+/g, 'REGEX')
    .replace(/3ADVANCED SOFTWORKS \/\/ Progressive/g, 'TITLE')
    .replace(/Optimized for IE 5\.0 \/\/ 800x600/g, 'SNIPPET')
    .replace(/\/\*\?:/g, 'CHARS');
  return !/\/\/|\/\*|<!--/.test(stripped);
}

check(hasNoComments(cssCode), 'krovatka-site.css has zero comments');
check(hasNoComments(siteCode), 'krovatka-site.js has zero comments');
check(hasNoActualComments(ieCode), 'ie.js has zero comments');
check(hasNoComments(indexHtml), 'index.html has zero comments');

check(!/border-radius|linear-gradient|radial-gradient|rgba\(|transition:|blur\(|box-shadow/i.test(cssCode), 'krovatka-site.css uses strict Web 1.0 styling only');
check(!/Microsoft|MICROSOFT|\bWindows\b/.test(siteCode + '\n' + cssCode), 'krovatka-site files use Microslop and Win naming only');
check(!/[\u{1F300}-\u{1FAFF}]/u.test(siteCode), 'krovatka-site.js contains zero raw Unicode emojis');

eval(siteCode);
eval(ieCode);

const site = window.krovatkaSite;
const ie = window.appIE;

check(Boolean(site && ie), 'window.krovatkaSite and window.appIE are initialized');

const axes = site.THEMATIC_AXES;
check(Array.isArray(axes) && axes.length === 4, 'THEMATIC_AXES defines 4 thematic axes');
const axisIds = new Set(axes.map((a) => a.id));
check(axes.every((a) => a.id && a.code && a.title && a.premise && a.counterPremise && a.controllingIdea && a.motif), 'every thematic axis has id, code, title, premise, counterPremise, controllingIdea, and motif');

const rooms = site.ROOMS;
const expectedRoomIds = ['general', 'tech', 'flirt', 'night', 'music', 'games', 'lit', 'fido'];
check(rooms.length === 8 && expectedRoomIds.every((id) => rooms.some((r) => r.id === id)), 'all 8 chat rooms are defined');
check(rooms.every((r) => r.label && r.fullTitle && r.topic && r.moderator && r.peakHours && axisIds.has(r.axisId) && r.atmosphere && r.history && r.customs && r.landmarks && r.currentState && Array.isArray(r.users) && r.users.length >= 4), 'every room has full worldbuilding passport fields');

const users = site.USERS;
check(users.length >= 26, `directory has ${users.length} regulars (>= 26)`);
const validArcTypes = new Set(['change-positive', 'change-negative', 'flat']);
check(users.every((u) => u.nick && u.realName && u.age && u.city && u.role && u.occupation && u.modem && u.isp && u.contact && u.room && axisIds.has(u.themeAxis) && validArcTypes.has(u.arcType) && u.ghostWound && u.lie && u.truth && u.motif && Array.isArray(u.bio) && u.bio.length >= 2 && Array.isArray(u.replies) && u.replies.length >= 3 && Array.isArray(u.whisperReplies) && u.whisperReplies.length >= 2), 'every regular has complete worldbuilding and theme-craft character profile');

let totalSeedMessages = 0;
for (const roomId of expectedRoomIds) {
  const msgs = site.getRoomMessages(roomId);
  check(Array.isArray(msgs) && msgs.length >= 12, `room "${roomId}" has ${msgs.length} seed messages (>= 12)`);
  totalSeedMessages += msgs.length;
  const beats = site.ROOM_BEATS[roomId];
  check(Array.isArray(beats) && beats.length >= 6, `room "${roomId}" has ${beats.length} continuation beats (>= 6)`);
}
check(totalSeedMessages >= 96, `total seed messages across rooms is ${totalSeedMessages} (>= 96)`);

const generalSeeds = site.getRoomMessages('general');
check(generalSeeds.some((m) => m.user === 'Kitten98' && m.text.includes('Всем приветик в этом чате')), 'classic Kitten98 greeting is preserved in general room');
const techSeeds = site.getRoomMessages('tech');
check(techSeeds.some((m) => m.user === 'Overclocker' && m.text.includes('Celeron 300A')), 'classic Overclocker Celeron 300A line is preserved in tech room');
const flirtSeeds = site.getRoomMessages('flirt');
check(flirtSeeds.some((m) => m.user === 'Romantic98' && m.text.includes('Девушки из Москвы, кто хочет погулять на Арбате')), 'classic Romantic98 line is preserved in flirt room');

check(site.SYSTEMS.length === 4 && site.FACTIONS.length === 6 && site.BAN_LOG.length === 5 && Object.keys(site.ZHURFIX_CITIES).length === 3, 'worldbuilding systems, factions, ban log, and zhurfix cities are populated');

const testUrls = [
  'http://chat.krovatka98.ru',
  'http://chat.krovatka98.ru/room?id=night',
  'http://chat.krovatka98.ru/users?nick=Doc_03_Night',
  'http://chat.krovatka98.ru/user?nick=Admin_Dimon',
  'http://chat.krovatka98.ru/zhurfix?city=spb',
  'http://chat.krovatka98.ru/world'
];
for (const u of testUrls) {
  check(ie.identifyPageKey(u) === 'chat', `AppIE routes ${u} to chat page key`);
}

const mainHtml = ie.renderChat('http://chat.krovatka98.ru');
const requiredHooks = [
  'krovatka-container',
  'krovatka-header',
  'krovatka-logo',
  'krovatka-stats',
  'krovatka-tabs',
  'krovatka-tab',
  'id="krovatka-stream"',
  'id="krovatka-nick"',
  'id="krovatka-msg"',
  'id="btn-krovatka-send"',
  'krovatka-footer',
  'admin@krovatka98.ru'
];
for (const hook of requiredHooks) {
  check(mainHtml.includes(hook), `main chat view includes required hook: ${hook}`);
}

site.showRoomPassport = true;
for (const roomId of expectedRoomIds) {
  const roomObj = site.getRoom(roomId);
  const rHtml = ie.renderChat(`http://chat.krovatka98.ru/room?id=${roomId}`);
  check(rHtml.includes(roomObj.label) && rHtml.includes(roomObj.moderator) && rHtml.includes(roomObj.history), `room view for "${roomId}" renders room label, moderator, and history`);
}

const usersHtml = ie.renderChat('http://chat.krovatka98.ru/users?nick=Kitten98&arc=change-positive');
check(usersHtml.includes('Екатерина Лебедева') && usersHtml.includes('Ложь персонажа (The Lie)') && usersHtml.includes('Правда (The Truth)') && usersHtml.includes('Призрак / Рана прошлого (Ghost Wound)'), 'users view renders character dossier with Lie, Truth, and Ghost/Wound');

const zhurfixHtml = ie.renderChat('http://chat.krovatka98.ru/zhurfix?city=spb');
check(zhurfixHtml.includes('Гостиного двора') && zhurfixHtml.includes('SweetGirl') && zhurfixHtml.includes('btn-krovatka-zhurfix-add'), 'zhurfix view renders St. Petersburg meetup details and RSVP form');

const worldHtml = ie.renderChat('http://chat.krovatka98.ru/world');
check(worldHtml.includes('Экранная маска против смелости быть собой') && worldHtml.includes('ПОТОКОВЫЙ ШЛЮЗ CGI-CHAT') && worldHtml.includes('Штрафной журнал Admin_Dimon') && worldHtml.includes('MMM_Golden_98'), 'world view renders thematic axes, server systems, and Admin_Dimon ban tribunal');

const initialMsgs = site.getRoomMessages('night');
const initialCount = initialMsgs.length;
initialMsgs.push({ time: '03:55', user: 'Странник98', color: '#008000', text: 'Проверка ночного эфира' });
site.saveRoomMessages('night', initialMsgs);
check(site.getRoomMessages('night').length === initialCount + 1, 'saveRoomMessages persists new message to room history');

const stepped = site.stepRoomBeat('night');
check(stepped && site.getRoomMessages('night').length === initialCount + 2, 'stepRoomBeat appends a continuation beat into the room');

const addressedReply = site.pickContextualReply('general', 'Странник98', 'Admin_Dimon, привет, как смена?', 'Admin_Dimon', false);
check(addressedReply && addressedReply.user === 'Admin_Dimon' && !addressedReply.whisper, 'addressing a regular by nick triggers a reply from that regular');

const whisperReply = site.pickContextualReply('night', 'Странник98', 'Не спится сегодня', 'Doc_03_Night', true);
check(whisperReply && whisperReply.user === 'Doc_03_Night' && whisperReply.whisper === true && whisperReply.target === 'Странник98', 'whisper target triggers a private whisper reply from that regular');

const beforeRsvp = site.getZhurfixRsvps().filter((r) => r.city === 'nsk').length;
site.addZhurfixRsvp('nsk', 'Странник98', 'Термос с облепихой и болванки', 'Буду в 18:10 у ступеней ГПНТБ');
check(site.getZhurfixRsvps().filter((r) => r.city === 'nsk').length === beforeRsvp + 1, 'addZhurfixRsvp persists new meetup participant');

const beforeAppeals = site.getBanAppeals().length;
site.addBanAppeal('PK_Cheater', 'games', 'Извините, нечаянно, больше не буду!');
const afterAppeals = site.getBanAppeals();
check(afterAppeals.length === beforeAppeals + 1 && afterAppeals[0].reply.includes('Admin_Dimon'), 'addBanAppeal records appeal and generates Admin_Dimon verdict');

writtenFiles.length = 0;
openedNotepad.length = 0;
site.saveRoomLogToVfs('fido', true);
site.saveUserDossierToVfs('Fido_Ded_5020', true);
site.saveZhurfixMemoToVfs('msk', true);
site.saveCodexToVfs(true);
check(writtenFiles.length === 4 && openedNotepad.length === 4, 'all 4 VFS/Notepad export actions write .TXT files and open Notepad');

console.log('\n========================================');
console.log(`ALL ${passed} KROVATKA '98 TESTS PASSED!`);
console.log('========================================');
