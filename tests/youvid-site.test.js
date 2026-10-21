const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };
global.window = {
  addEventListener: () => {},
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) }
};

const root = path.join(__dirname, '..');
const load = (rel) => eval(fs.readFileSync(path.join(root, rel), 'utf8'));
const FILES = [
  'js/apps/poligon/p3d.js',
  'js/apps/poligon/figure.js',
  'js/apps/youvid/kit.js',
  'js/apps/youvid/zoo.js',
  'js/apps/youvid/hayato-cast.js',
  'js/apps/youvid/hayato-sets.js',
  'js/apps/youvid/hayato-ui.js',
  'js/apps/youvid/hayato-script.js',
  'js/apps/youvid/hayato-script-a.js',
  'js/apps/youvid/hayato-script-b.js',
  'js/apps/youvid/hayato.js',
  'js/apps/youvid/rig.js',
  'js/apps/youvid/vlad-cast.js',
  'js/apps/youvid/vlad-room.js',
  'js/apps/youvid/vlad-motion.js',
  'js/apps/youvid/vlad-script.js',
  'js/apps/youvid/vlad.js',
  'js/apps/youvid/nice-cast.js',
  'js/apps/youvid/nice-room.js',
  'js/apps/youvid/nice-overlay.js',
  'js/apps/youvid/nice-motion.js',
  'js/apps/youvid/nice.js',
  'js/apps/youvid/slay-street.js',
  'js/apps/youvid/slay-cast.js',
  'js/apps/youvid/slay-motion.js',
  'js/apps/youvid/slay-script.js',
  'js/apps/youvid/slay.js',
  'js/apps/youvid/linging-yard.js',
  'js/apps/youvid/linging-cast.js',
  'js/apps/youvid/linging-script.js',
  'js/apps/youvid/linging.js',
  'js/apps/youvid/konosuba-world.js',
  'js/apps/youvid/konosuba-critters.js',
  'js/apps/youvid/konosuba-cast.js',
  'js/apps/youvid/konosuba-script.js',
  'js/apps/youvid/konosuba.js',
  'js/apps/youvid/otpusk-world.js',
  'js/apps/youvid/otpusk-cast.js',
  'js/apps/youvid/otpusk-beats.js',
  'js/apps/youvid/otpusk-voice.js',
  'js/apps/youvid/otpusk-motion.js',
  'js/apps/youvid/otpusk-script.js',
  'js/apps/youvid/otpusk.js',
  'js/apps/youvid/pamparam-world.js',
  'js/apps/youvid/pamparam-cast.js',
  'js/apps/youvid/pamparam-script.js',
  'js/apps/youvid/pamparam.js',
  'js/apps/youvid/roman-world.js',
  'js/apps/youvid/roman-cast.js',
  'js/apps/youvid/roman-script.js',
  'js/apps/youvid/roman.js',
  'js/apps/youvid/sparkle-world.js',
  'js/apps/youvid/sparkle-cast.js',
  'js/apps/youvid/sparkle-script.js',
  'js/apps/youvid/sparkle.js',
  'js/apps/youvid/stray-set.js',
  'js/apps/youvid/stray-script.js',
  'js/apps/youvid/stray.js',
  'js/apps/youvid/osudil-script.js',
  'js/apps/youvid/osudil.js',
  'js/apps/youvid/trek-script.js',
  'js/apps/youvid/trek.js',
  'js/apps/youvid/klee-faces.js',
  'js/apps/youvid/klee-textures.js',
  'js/apps/youvid/klee-cast.js',
  'js/apps/youvid/klee-foes.js',
  'js/apps/youvid/klee-world.js',
  'js/apps/youvid/klee-cards.js',
  'js/apps/youvid/klee-script.js',
  'js/apps/youvid/klee.js',
  'js/apps/youvid/nope-world.js',
  'js/apps/youvid/nope-cast.js',
  'js/apps/youvid/nope-script.js',
  'js/apps/youvid/nope.js',
  'js/apps/youvid/keanu-art.js',
  'js/apps/youvid/keanu-script.js',
  'js/apps/youvid/keanu.js',
  'js/apps/youvid-site.js'
];
FILES.forEach(load);
load('js/apps/ie.js');
const CLIP_FILES = FILES.filter(f => f.startsWith('js/apps/youvid/') && !['kit.js', 'rig.js'].some(n => f.endsWith('/' + n)));

const site = window.youvidSite;
const clips = window.youvidClips;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const finite = (v) => v.every(Number.isFinite);

test('IE routes youvid.com to the site before the video archive keys', () => {
  const ie = window.appIE;
  assert.strictEqual(ie.identifyPageKey('http://www.youvid.com'), 'youvid');
  assert.strictEqual(ie.identifyPageKey('http://www.youvid.com/watch?v=jNQXAC9IVRw'), 'youvid');
  assert.strictEqual(ie.identifyPageKey('http://www.youvid.com/user/Hayato_me'), 'youvid');
  assert.ok(ie.getPageTitle('youvid').includes('YouVid'));
  assert.ok(ie.performSearch('youvid').some(r => r.url === 'http://www.youvid.com'));
});

test('every video is registered once with its mp3 soundtrack and real duration', () => {
  CLIP_FILES.forEach(load);
  assert.strictEqual(clips.length, site.videos.length);
  site.videos.forEach(v => assert.ok(clips.some(c => c.id === v.id), `clip for ${v.id}`));
  const zoo = clips.find(c => c.id === 'jNQXAC9IVRw');
  const hay = clips.find(c => c.id === 'hArMoNy_hsr');
  const vlad = clips.find(c => c.id === 'i9AyI356ye4');
  assert.ok(zoo && hay && vlad);
  assert.ok(Math.abs(zoo.duration - 19.06) < 0.1);
  assert.ok(Math.abs(hay.duration - 774.74) < 0.1);
  assert.ok(Math.abs(vlad.duration - 91.6) < 0.1);
  clips.forEach(c => assert.ok(fs.existsSync(path.join(root, c.audio)), c.audio));
  assert.strictEqual(zoo.aspect, 4 / 3);
  assert.strictEqual(hay.aspect, 16 / 9);
  assert.strictEqual(vlad.aspect, 16 / 9);
});

test('channels follow the real channel data', () => {
  const j = site.channels.jawed, h = site.channels.Hayato_me;
  assert.strictEqual(j.name, 'jawed');
  assert.strictEqual(h.name, 'Hayato');
  assert.strictEqual(h.about, 'Просчитался , но где?');
  assert.strictEqual(h.site, 't.me/Kishlak_Hayato');
  assert.strictEqual(j.subs, 2147);
  assert.strictEqual(h.subs, 6590);
  assert.deepStrictEqual(site.videosOf(j).map(v => v.title), ['Me at the zoo']);
  assert.deepStrictEqual(site.videosOf(h).map(v => v.title), ['Смогу ли Я пройти ХСР только ГАРМОНИСТАМИ']);
  const e = site.channels.EbatoriyaPlanet;
  assert.strictEqual(e.name, 'Планета Ебатории');
  assert.strictEqual(e.about, 'Ебатория всех впускает, но никого и никогда не выпускает.');
  assert.strictEqual(e.subs, 3660);
  assert.strictEqual(e.joined, '1 декабря 1999');
  assert.ok(site.videosOf(e).some(v => v.title === 'Влад Савельев ложится спать'));
  const newest = site.videos.slice().sort((a, b) => b.order - a.order)[0];
  assert.strictEqual(site.sorted('mr')[0].id, newest.id);
  assert.strictEqual(new Set(site.videos.map(v => v.order)).size, site.videos.length, 'video order values are unique');
  site.videos.forEach(v => site.thumbs(v).forEach(f => assert.ok(fs.existsSync(path.join(root, f)), f)));
  Object.values(site.channels).forEach(ch => {
    assert.ok(fs.existsSync(path.join(root, site.avatar(ch))), ch.user);
    assert.ok(fs.existsSync(path.join(root, site.banner(ch))), ch.user);
  });
});

test('every page renders and routes resolve', () => {
  const pages = {
    'http://www.youvid.com': 'Избранное видео',
    'http://www.youvid.com/watch?v=jNQXAC9IVRw': 'Me at the zoo',
    'http://www.youvid.com/watch?v=hArMoNy_hsr': 'ГАРМОНИСТАМИ',
    'http://www.youvid.com/watch?v=i9AyI356ye4': 'Влад Савельев ложится спать',
    'http://www.youvid.com/watch?v=Sav3lOtpusk': 'тотальное неуважение',
    'http://www.youvid.com/watch?v=pAmPaRam98': 'Пампарам-пампарам,приветствую смотрящих',
    'http://www.youvid.com/watch?v=wAk3UpR0mAn': 'WAKE UP ROMAN',
    'http://www.youvid.com/watch?v=Str3yHarmon1': 'Стрей Не Оценил Губную Гармошку',
    'http://www.youvid.com/watch?v=Str3yOsud1l': 'Стрей Осудил Наполовину',
    'http://www.youvid.com/watch?v=Str3yTr3k98': 'Стрей Перепутал Трэк',
    'http://www.youvid.com/user/streyosuzhdaet': 'СТРЕЙ ОСУЖДАЕТ',
    'http://www.youvid.com/results?search_query=%D0%BF%D0%B0%D0%BC%D0%BF%D0%B0%D1%80%D0%B0%D0%BC': 'Пампарам-пампарам,приветствую смотрящих',
    'http://www.youvid.com/user/ebatoriyaplanet': 'Ебатория всех впускает',
    'http://www.youvid.com/browse?c=people': 'Влад Савельев ложится спать',
    'http://www.youvid.com/watch?v=vEryN1ceGdN': 'verynicegoodnice',
    'http://www.youvid.com/browse?c=music': 'verynicegoodnice',
    'http://www.youvid.com/results?search_query=%D0%BA%D0%B0%D1%80%D0%B0%D0%BE%D0%BA%D0%B5': 'verynicegoodnice',
    'http://www.youvid.com/results?search_query=%D0%BE%D0%B4%D0%B5%D1%8F%D0%BB%D0%BE': 'Влад Савельев ложится спать',
    'http://www.youvid.com/watch?v=nope': 'Видео не найдено',
    'http://www.youvid.com/user/jawed': 'Канал jawed',
    'http://www.youvid.com/user/hayato_me': 'Просчитался , но где?',
    'http://www.youvid.com/browse?s=mp': 'Популярные видео',
    'http://www.youvid.com/browse?c=pets': 'пока нет видео',
    'http://www.youvid.com/channels': 'Каналы',
    'http://www.youvid.com/categories': 'Гаджеты и игры',
    'http://www.youvid.com/results?search_query=%D0%B7%D0%BE%D0%BE%D0%BF%D0%B0%D1%80%D0%BA': 'Me at the zoo',
    'http://www.youvid.com/results?search_query=hayato': 'ГАРМОНИСТАМИ',
    'http://www.youvid.com/results?search_query=qqqq': 'Ничего не найдено',
    'http://www.youvid.com/login': 'Вход и регистрация',
    'http://www.youvid.com/subscriptions': 'Войдите',
    'http://www.youvid.com/nowhere': 'Страница не найдена'
  };
  Object.entries(pages).forEach(([url, text]) => {
    const html = site.renderSite(url);
    assert.ok(html.includes(text), `${url} shows ${text}`);
    assert.ok(html.includes('yv-logo'), url);
  });
  const watch = site.renderSite('http://www.youvid.com/watch?v=hArMoNy_hsr');
  assert.ok(watch.includes('height="270"'), '16:9 video is letterboxed');
  assert.ok(watch.includes(encodeURI(clips[1].audio)));
  const bed = site.renderSite('http://www.youvid.com/watch?v=i9AyI356ye4');
  assert.ok(bed.includes('height="270"') && bed.includes(encodeURI(clips[2].audio)));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('yv-theme-quilt'));
  assert.ok(window.appIE.performSearch('влад савельев').some(r => r.url === 'http://www.youvid.com'));
});

test('account state: login, rating, favorites, subscriptions and comments persist', () => {
  localStorage.store = {};
  site.state = site.loadState();
  site.saveState({ user: 'tester98' });
  const v = site.video('jNQXAC9IVRw');
  const before = site.rating(v);
  site.saveState({ rated: { jNQXAC9IVRw: 1 } });
  const after = site.rating(v);
  assert.strictEqual(after.count, before.count + 1);
  assert.ok(after.avg < before.avg);
  site.saveState({ subs: ['Hayato_me'], favorites: ['hArMoNy_hsr'] });
  site.countView('jNQXAC9IVRw');
  assert.strictEqual(site.views(v), v.views + 1);
  site.saveState({ comments: { jNQXAC9IVRw: [{ user: 'tester98', when: 'только что', text: '<b>слоны</b>' }] } });
  const html = site.renderSite('http://www.youvid.com/watch?v=jNQXAC9IVRw');
  assert.ok(html.includes('&lt;b&gt;слоны&lt;/b&gt;'), 'comments are escaped');
  assert.ok(html.includes('Отписаться') === false);
  assert.ok(site.renderSite('http://www.youvid.com/user/Hayato_me').includes('Отписаться'));
  assert.ok(site.renderSite('http://www.youvid.com/favorites').includes('ГАРМОНИСТАМИ'));
  assert.ok(site.renderSite('http://www.youvid.com/subscriptions').includes('Hayato'));
  const again = new site.constructor();
  assert.strictEqual(again.state.user, 'tester98');
  assert.deepStrictEqual(again.state.subs, ['Hayato_me']);
  localStorage.store = {};
  site.state = site.loadState();
});

test('Me at the zoo keeps the original beats: two head turns and hand gestures', () => {
  const zoo = clips.find(c => c.id === 'jNQXAC9IVRw');
  for (let t = 0; t < zoo.duration; t += 0.1) {
    const st = zoo.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at), `camera ${t}`);
    assert.ok(finite(st.head) && st.head[1] > 1.2 && st.head[1] < 1.9, `head ${t}`);
  }
  const yaw = (t) => zoo.stage(t).pose.neck[1] + zoo.stage(t).pose.ry + zoo.stage(t).pose.spine[1];
  assert.ok(yaw(4.3) > 1.5 && yaw(15.5) > 1.5, 'looks back at the elephants');
  assert.ok(Math.abs(yaw(1)) < 0.3 && Math.abs(yaw(10)) < 0.3, 'faces the camera while talking');
  assert.strictEqual(zoo.stage(7.5).arm.kind, 'pinch');
  assert.strictEqual(zoo.stage(10.8).arm.kind, 'flat');
  assert.strictEqual(zoo.stage(1).arm, null);
  assert.strictEqual(zoo.voiceAt(0.2), 0);
  let loud = 0;
  for (let t = 5; t < 12; t += 0.04) loud = Math.max(loud, zoo.voiceAt(t));
  assert.ok(loud > 0.5, 'speech drives the mouth');
});

test('Hayato video shot list covers the whole timeline in order', () => {
  const hay = clips.find(c => c.id === 'hArMoNy_hsr');
  const shots = hay.shots;
  assert.ok(shots.length > 500, `${shots.length} shots`);
  assert.strictEqual(shots[0].start, 0);
  assert.strictEqual(shots[shots.length - 1].end, hay.duration);
  for (let i = 1; i < shots.length; i++) {
    assert.ok(shots[i].start > shots[i - 1].start, `shot ${i} at ${shots[i].start}`);
    assert.strictEqual(shots[i - 1].end, shots[i].start);
  }
  const scenes = new Set(shots.map(s => s.scene));
  ['room', 'cls', 'board', 'battle', 'walk', 'ult', 'face', 'menu', 'warp', 'pompom', 'meme', 'chat', 'dmg', 'sponsor', 'editor', 'black'].forEach(k => assert.ok(scenes.has(k), k));
  const at = (t) => hay.shotAt(t);
  assert.strictEqual(at(27).scene, 'room');
  assert.strictEqual(at(41).scene, 'cls');
  assert.strictEqual(at(62).o.title, 'ПРАВИЛА');
  assert.strictEqual(at(186).o.desk, true);
  assert.strictEqual(at(222).scene, 'sponsor');
  assert.strictEqual(at(461.2).o.skill, 'Звёздное благословение');
  assert.strictEqual(at(522.2).o.skill, 'Марш Белобога');
  assert.strictEqual(at(745.5).o.qr, 'finger');
  assert.strictEqual(at(770).scene, 'black');
  assert.ok(hay.voiceAt(60) >= 0 && hay.voiceAt(9999) === 0);
});

test('Влад Савельев ложится спать follows the original cuts, outfit changes and lines', () => {
  const vlad = clips.find(c => c.id === 'i9AyI356ye4');
  const S = window.VladScript;
  assert.deepStrictEqual(vlad.cuts, [0, 9.7, 20.03, 24.27, 33.77, 40.37, 42.13, 60.83, 66.97, 76.77, 81.33, 87.9]);
  for (let i = 1; i < S.TRACK.length; i++) assert.ok(S.TRACK[i].t > S.TRACK[i - 1].t, `pose key ${i} at ${S.TRACK[i].t}`);
  for (let t = 0; t <= vlad.duration; t += 0.05) {
    const st = vlad.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at), `camera ${t}`);
    const m = window.VladCast.solve(st.pose);
    Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.2, `joint at ${t}`));
  }
  const at = (t) => vlad.stage(t);
  assert.strictEqual(at(5).shot.index, 0);
  assert.strictEqual(at(30).pose.wear, 'hoodie');
  assert.strictEqual(at(58).pose.wear, 'tee');
  assert.ok(at(20).pose.phone && !at(70).pose.phone);
  assert.strictEqual(at(60).blanket, null);
  assert.ok(at(70).blanket && at(85).blanket);
  assert.ok(at(58).hoodie && !at(20).hoodie);
  assert.strictEqual(at(10).fade, 1);
  assert.ok(at(91.2).fade < 0.02);
  assert.ok(vlad.voiceAt(1.0) > 0.3 && vlad.voiceAt(15) === 0);
  let shouts = 0;
  for (let t = 67; t < 75; t += 0.05) if (vlad.voiceAt(t) > 0.5 && vlad.voiceAt(t - 0.05) <= 0.5) shouts++;
  assert.ok(shouts >= 4, `${shouts} shouts of «Почти!»`);
});

test('verynicegoodnice keeps the three sung notes, the stream overlay and the turn to the camera', () => {
  const nice = clips.find(c => c.id === 'vEryN1ceGdN');
  assert.ok(Math.abs(nice.duration - 10) < 0.05 && nice.aspect === 16 / 9);
  assert.strictEqual(site.video('vEryN1ceGdN').channel, 'EbatoriyaPlanet');
  const Cast = window.NiceCast;
  for (let t = 0; t <= nice.duration; t += 0.05) {
    const st = nice.stage(t);
    const m = Cast.solve(st.pose);
    Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.3, `joint at ${t}`));
  }
  const notes = [[1.5, 3.1], [4.4, 6.1], [8.0, 9.2]];
  notes.forEach(([a, b]) => {
    for (let t = a; t < b; t += 0.1) assert.ok(nice.voiceAt(t) > 0.5, `note at ${t}`);
    const st = nice.stage((a + b) / 2);
    const m = Cast.solve(st.pose);
    const mic = Cast.micFrame(m, st.pose);
    const head = m.pts.head;
    const top = [mic.base[0] + mic.dir[0] * 0.06, mic.base[1] + mic.dir[1] * 0.06, mic.base[2] + mic.dir[2] * 0.06];
    assert.ok(Math.hypot(top[0] - head[0], top[1] - head[1], top[2] - head[2]) < 0.28, `mic at the mouth during ${a}`);
    assert.strictEqual(st.pose.mouth, 'wide');
  });
  assert.ok(nice.voiceAt(3.7) < 0.1 && nice.voiceAt(7.5) < 0.1, 'breaths between notes');
  assert.ok(nice.stage(0.5).mask.length > 0 && nice.stage(1.2).mask.length === 0, 'mosaic intro opens');
  assert.notStrictEqual(nice.stage(2).overlay.month, nice.stage(5).overlay.month, 'top-5 list rotates');
  assert.notStrictEqual(nice.stage(3).overlay.top.join(), nice.stage(8).overlay.top.join(), 'top donate changes');
  const end = Cast.solve(nice.stage(9.95).pose);
  const fwd = [end.pelvis[8], end.pelvis[9], end.pelvis[10]];
  const mid = Cast.solve(nice.stage(4).pose);
  assert.ok(fwd[2] > [mid.pelvis[8], mid.pelvis[9], mid.pelvis[10]][2], 'turns to the camera at the end');
  const text = JSON.stringify(window.NiceOverlay.CHAT) + fs.readFileSync(path.join(root, 'js/apps/youvid/nice-overlay.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/apps/youvid/nice-cast.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/apps/youvid/nice-room.js'), 'utf8');
  assert.ok(!/armani|dom perignon|red dead|rockstar|luis alberto|2019/i.test(text), 'real brands, names and dates are replaced');
  assert.ok(!/сука|долбаеб|блять/i.test(text), 'chat profanity is masked');
});

test('Теперь я extremely slay keeps the three shots, both lines and the haircut gestures', () => {
  const slay = clips.find(c => c.id === 'eXtr3meSlay');
  assert.ok(Math.abs(slay.duration - 8.1) < 0.05 && slay.aspect === 16 / 9);
  assert.deepStrictEqual(slay.cuts, [0, 1.9, 4.21]);
  const v = site.video('eXtr3meSlay');
  assert.strictEqual(v.channel, 'MisterBucks');
  assert.strictEqual(v.title, 'Теперь я extremely slay, меньше волос');
  const ch = site.channels.MisterBucks;
  assert.strictEqual(ch.name, 'Мистер Бакс');
  assert.strictEqual(ch.joined, '22 сентября 1999');
  assert.strictEqual(ch.country, 'Великобритания');
  assert.ok(Object.values(site.channels).every(c => c === ch || c.subs < ch.subs), 'the biggest channel on the site');
  const S = window.SlayScript, Cast = window.SlayCast;
  ['cam', 'boy', 'dad', 'girl'].forEach(k => assert.ok(window.YouVidMotion['eXtr3meSlay:' + k], `motion ${k}`));
  for (let t = 0; t <= slay.duration; t += 0.05) {
    const st = slay.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && finite(st.camera.up), `camera ${t}`);
    st.cast.forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.3, `${c.who} joint at ${t}`));
    });
  }
  const who = (t) => slay.stage(t).cast.map(c => c.who).join(' ');
  assert.strictEqual(who(1), 'boy');
  assert.strictEqual(who(3), 'dad girl');
  assert.ok(who(6).startsWith('boy'));
  assert.ok(slay.stage(4.6).cast.find(c => c.who === 'woman').pose.mirrorOnly, 'the passer-by is only seen in the shop window');
  assert.strictEqual(slay.stage(0.2).props.door, 0);
  assert.ok(slay.stage(1.5).props.door > 1.2, 'the door opens as he walks out');
  assert.strictEqual(S.speakerAt(3).who, 'dad');
  assert.strictEqual(S.speakerAt(6).who, 'boy');
  assert.ok(slay.voiceAt(1.0) === 0 && slay.voiceAt(2.4) > 0.3);
  const boy = slay.stage(5.8).cast[0];
  const m = Cast.solve('boy', boy.pose);
  assert.ok(m.pts.wristR[1] > m.pts.head[1] - 0.15, 'the hand runs through the new haircut');
  assert.ok(boy.pose.hairLift > 0.3 && boy.pose.lolli === 'R');
  const page = site.renderSite('http://www.youvid.com/user/MisterBucks');
  assert.ok(page.includes('yv-theme-bucks') && page.includes('Канал для всей семьи'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=eXtr3meSlay').includes('extremely slay'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=entertainment').includes('extremely slay'));
  assert.ok(window.appIE.performSearch('барбершоп').some(r => r.url === 'http://www.youvid.com'));
  const text = ['slay-street.js', 'slay-cast.js', 'slay-script.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n') + JSON.stringify(v);
  assert.ok(!/stylish stag|brewdog|john rose|hidden hearing|american crew|ralph lauren|chupa/i.test(text), 'real brands are replaced');
});

test('yo phone linging keeps the six shots, braid-to-handset transitions, macro close-up and m1s3n channel', () => {
  const ling = clips.find(c => c.id === 'y0Ph0neL1ng');
  assert.ok(ling && Math.abs(ling.duration - 15.79) < 0.05 && ling.aspect === 16 / 9);
  assert.deepStrictEqual(ling.cuts, [0, 2.03, 6.23, 8.03, 8.9, 13.4]);
  const v = site.video('y0Ph0neL1ng');
  assert.strictEqual(v.channel, 'm1s3n');
  assert.strictEqual(v.title, 'yo phone linging');
  assert.strictEqual(v.category, 'comedy');
  const ch = site.channels.m1s3n;
  assert.strictEqual(ch.name, 'm1s3n');
  assert.strictEqual(ch.theme, 'linging');
  assert.strictEqual(ch.subs, 14800);
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['y0Ph0neL1ng']);
  const Cast = window.LingingCast;
  for (let t = 0; t <= ling.duration; t += 0.05) {
    const st = ling.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    const m = Cast.solve(st.pose);
    Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.1 && p[1] < 2.3, `joint at ${t}`));
  }
  assert.strictEqual(ling.stage(1.0).pose.chakram, true);
  assert.strictEqual(ling.stage(1.0).pose.phoneMode, 'none');
  assert.strictEqual(ling.stage(3.0).pose.phoneMode, 'cord');
  assert.strictEqual(ling.stage(4.8).pose.phoneMode, 'ear');
  assert.strictEqual(ling.stage(7.0).pose.chakram, true);
  assert.strictEqual(ling.stage(8.45).shot, 3);
  assert.strictEqual(ling.stage(8.45).pose.eyes, 'wide');
  assert.strictEqual(ling.stage(8.45).pose.mouth, 'open');
  assert.strictEqual(ling.stage(11.4).pose.phoneMode, 'offer');
  assert.strictEqual(ling.stage(12.2).pose.phoneMode, 'drop');
  assert.ok(ling.stage(12.4).pose.dropY > ling.stage(12.0).pose.dropY, 'handset drops downward');
  assert.strictEqual(ling.stage(13.0).pose.gL, 'wave');
  assert.strictEqual(ling.stage(14.5).shot, 5);
  assert.ok(ling.voiceAt(2.8) > 0.3 && ling.voiceAt(15.2) === 0);
  const page = site.renderSite('http://www.youvid.com/user/m1s3n');
  assert.ok(page.includes('yv-theme-linging') && page.includes('Krampus Compliance'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=y0Ph0neL1ng').includes('yo phone linging'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('yo phone linging'));
  assert.ok(window.appIE.performSearch('m1s3n').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('yo phone linging').some(r => r.url === 'http://www.youvid.com'));
});

test('KONOSUBA 3 - Ending keeps all 18 shots, mansion/bath/meadow sets, giant toads and Crunchyroll channel', () => {
  const kono = clips.find(c => c.id === 'k0n0SuBa3Ed');
  assert.ok(kono && Math.abs(kono.duration - 90.14) < 0.05 && kono.aspect === 16 / 9);
  assert.strictEqual(kono.cuts.length, 18);
  assert.strictEqual(kono.cuts[0], 0);
  for (let i = 1; i < kono.cuts.length; i++) assert.ok(kono.cuts[i] > kono.cuts[i - 1], `cut ${i}`);
  const v = site.video('k0n0SuBa3Ed');
  assert.strictEqual(v.channel, 'Crunchyroll');
  assert.strictEqual(v.title, 'KONOSUBA 3 - Ending');
  assert.strictEqual(v.category, 'film');
  const ch = site.channels.Crunchyroll;
  assert.strictEqual(ch.name, 'Crunchyroll');
  assert.strictEqual(ch.theme, 'crunchy');
  assert.strictEqual(ch.subs, 19400);
  assert.strictEqual(ch.country, 'США');
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['k0n0SuBa3Ed']);
  const Cast = window.KonosubaCast;
  for (let t = 0; t <= kono.duration; t += 0.1) {
    const st = kono.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    st.cast.forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.15 && p[1] < 3.2, `${c.who} joint at ${t}`));
      if (!c.pose.up) ['ankleL', 'ankleR'].forEach(k => assert.ok(m.pts[k][1] >= 0.069, `${c.who} ${k} above floor at ${t}`));
    });
    if (st.tadpole && st.tadpole.ground !== undefined) assert.ok(st.tadpole.pos[1] >= st.tadpole.ground, `tadpole above floor at ${t}`);
  }
  assert.strictEqual(kono.stage(4.5).set, 'meadow');
  assert.ok(kono.stage(4.5).chomusuke && kono.stage(4.5).tadpole);
  assert.strictEqual(kono.stage(12.2).set, 'porch');
  assert.strictEqual(kono.stage(12.2).cast[0].who, 'kazuma');
  assert.strictEqual(kono.stage(17.0).set, 'hall');
  assert.strictEqual(kono.stage(17.0).cast[0].who, 'aqua');
  assert.strictEqual(kono.stage(22.0).set, 'sofa');
  assert.ok(['annoyed', 'shut'].includes(kono.stage(22.0).cast[0].pose.eyes), 'Aqua is annoyed by the hopping tadpole');
  assert.strictEqual(kono.stage(20.6).cast[0].pose.eyes, 'annoyed');
  assert.ok(kono.stage(26.0).cast[0].pose.yaw > 0.5, 'Megumin turns toward Aqua');
  assert.ok(kono.stage(26.0).cast[0].pose.pos[2] < kono.stage(26.0).cast[1].pose.pos[2], 'Megumin stands behind Aqua');
  assert.ok(kono.stage(30.1).tadpole.stretch > 0 && kono.stage(30.1).cast[1].pose.eyes === 'shut', 'tail slaps Megumin');
  assert.ok(kono.stage(37.5).tadpole.stretch > 0 && kono.stage(37.5).cast[2].pose.blush, 'tail slaps Darkness');
  assert.strictEqual(kono.stage(22.0).tadpole.hold.who, 'aqua');
  assert.strictEqual(kono.stage(26.8).set, 'gate');
  assert.deepStrictEqual(kono.stage(26.8).cast.map(c => c.who), ['megumin', 'aqua']);
  assert.strictEqual(kono.stage(31.7).cast[1].who, 'megumin');
  assert.ok(['annoyed', 'shut'].includes(kono.stage(31.7).cast[1].pose.eyes));
  assert.strictEqual(kono.stage(35.5).cast[0].who, 'darkness');
  assert.deepStrictEqual(kono.stage(37.9).cast.map(c => c.who), ['aqua', 'megumin', 'darkness']);
  assert.strictEqual(kono.stage(42.8).set, 'bath');
  assert.strictEqual(kono.stage(42.8).cast.length, 4);
  assert.strictEqual(kono.stage(42.8).tadpole.foam, true);
  assert.strictEqual(kono.stage(50.3).set, 'water');
  assert.strictEqual(kono.stage(50.3).tadpole.swim, true);
  assert.strictEqual(kono.stage(56.5).set, 'bathLookup');
  assert.strictEqual(kono.stage(61.3).set, 'meadow');
  assert.strictEqual(kono.stage(65.0).set, 'bowl');
  assert.strictEqual(kono.stage(67.6).set, 'field');
  assert.strictEqual(kono.stage(67.6).toads.length, 2);
  assert.strictEqual(kono.stage(70.4).cast.length, 4);
  assert.strictEqual(kono.stage(76.5).cast[1].pose.eyes, 'shut');
  assert.strictEqual(kono.stage(81.0).cast[0].who, 'aqua');
  assert.strictEqual(kono.stage(81.0).cast[0].pose.eyes, 'terror');
  assert.strictEqual(kono.stage(81.0).cast[0].pose.mouth, 'scream');
  assert.strictEqual(kono.stage(86.8).toads.length, 2);
  assert.strictEqual(kono.stage(86.8).toads.find(td => td.kind === 'green').tongueAt.who, 'aqua');
  assert.ok(kono.stage(86.8).cast[0].pose.up[1] < 0, 'Aqua hangs upside down from the tongue');
  assert.ok(kono.voiceAt(20.0) > 0.3 && kono.voiceAt(0.2) === 0);
  const page = site.renderSite('http://www.youvid.com/user/Crunchyroll');
  assert.ok(page.includes('yv-theme-crunchy') && page.includes('Официальный канал аниме'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=k0n0SuBa3Ed').includes('KONOSUBA 3 - Ending'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=film').includes('KONOSUBA 3 - Ending'));
  assert.ok(window.appIE.performSearch('konosuba').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('коносуба').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('crunchyroll').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('чомуске').some(r => r.url === 'http://www.youvid.com'));
});

test('every character and foe referenced by the script exists', () => {
  const hay = clips.find(c => c.id === 'hArMoNy_hsr');
  const looks = window.HayatoCast.LOOKS;
  const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    ['who', 'girl'].forEach(k => { if (typeof o[k] === 'string') seen.add(o[k]); });
    (o.party || []).forEach(k => seen.add(k));
    (o.cast || []).forEach(k => seen.add(k));
    if (o.under) walk(o.under);
  };
  hay.shots.forEach(s => walk(s.o));
  seen.forEach(k => assert.ok(looks[k], `look ${k}`));
  Object.keys(window.HayatoCast.GESTURES).forEach(g => assert.strictEqual(typeof window.HayatoCast.GESTURES[g], 'function'));
  hay.shots.forEach(s => {
    const gs = s.o.g ? (Array.isArray(s.o.g) ? s.o.g : [s.o.g]) : [];
    gs.forEach(g => assert.ok(window.HayatoCast.GESTURES[g], `gesture ${g} at ${s.start}`));
    if (s.o.ui) assert.strictEqual(typeof window.HayatoUI[s.o.ui], 'function', `ui ${s.o.ui} at ${s.start}`);
  });
});

test('Савельев берет отпуск follows the walk, the selfies, the leaf and the chapters', () => {
  const clip = clips.find(c => c.id === 'Sav3lOtpusk');
  const v = site.video('Sav3lOtpusk');
  const S = window.OtpuskScript;
  assert.ok(clip && v);
  assert.ok(Math.abs(clip.duration - 905) < 0.5 && clip.aspect === 16 / 9);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Савельев берет отпуск тли тотальное неуважение');
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'Sav3lOtpusk'));
  assert.strictEqual(v.chapters[0][0], 0);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  v.chapters.forEach(([t, title]) => assert.ok(t < clip.duration && title.length > 3));
  const beats = window.OtpuskBeats;
  ['PLACE', 'ACT', 'CAM', 'OPARMS'].forEach(k => beats[k].forEach((row, i) => i && assert.ok(row[0] >= beats[k][i - 1][0], `${k} key ${i} at ${row[0]}`)));
  for (let t = 0; t <= clip.duration; t += 0.25) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && finite(st.camera.up), `camera ${t}`);
    assert.ok(st.camera.eye[1] > 0.04 && st.camera.eye[1] < 8, `camera height ${t}`);
    Object.values(st.m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.4, `joint at ${t}`));
    assert.ok(Math.abs(st.pose.p[0]) < 200 && Math.abs(st.pose.p[2]) < 20, `place ${t}`);
  }
  assert.strictEqual(clip.stage(50).op.mood, 'grin');
  assert.strictEqual(clip.stage(822.5).op.mood, 'tongue');
  assert.strictEqual(clip.stage(300).op, null);
  assert.ok(clip.stage(790).pose.leaf && !clip.stage(700).pose.leaf);
  assert.ok(clip.stage(600).props.some(p => p.bag === 'khaki') && !clip.stage(300).props.some(p => p.bag));
  assert.ok(clip.stage(765).opArms.some(a => a.leaf));
  assert.ok(clip.voiceAt(92.8) > 0.2, 'Vlad says he has to go');
  assert.strictEqual(clip.voiceAt(106.5), 0, 'Vlad keeps his mouth shut while the operator talks');
  assert.ok(S.OPV(106.5) > 0.2);
  assert.ok(S.SEGS.length > 20, 'mocap segments');
  const html = site.renderSite('http://www.youvid.com/watch?v=Sav3lOtpusk');
  assert.strictEqual((html.match(/class="yv-chap"/g) || []).length, v.chapters.length);
  assert.strictEqual((html.match(/class="yv-tick"/g) || []).length, v.chapters.length - 1);
  assert.ok(html.includes('Содержание'));
  assert.ok(!site.renderSite('http://www.youvid.com/watch?v=i9AyI356ye4').includes('yv-chap-list'));
  const marks = v.chapters.map(() => ({ on: false, attrs: {}, classList: { toggle(c, on) { this.owner.on = on; } }, setAttribute(k, x) { this.attrs[k] = x; }, removeAttribute(k) { delete this.attrs[k]; } }));
  marks.forEach(m => { m.classList.owner = m; });
  const fake = { meta: v, chapButtons: marks };
  window.YouVidPlayer.prototype.paintChapter.call(fake, 370);
  const now = v.chapters.reduce((a, c, i) => (370 >= c[0] ? i : a), 0);
  marks.forEach((m, i) => assert.strictEqual(m.on, i === now));
  assert.strictEqual(marks[now].attrs['aria-current'], 'true');
});

test('Стрей Не Оценил Губную Гармошку keeps the webcam close-ups, headset fix, shout, grimace and live chat on StreyOsuzhdaet', () => {
  const clip = clips.find(c => c.id === 'Str3yHarmon1');
  const v = site.video('Str3yHarmon1');
  const S = window.StrayScript;
  assert.ok(clip && v && S && window.StraySet);
  assert.ok(Math.abs(clip.duration - 23.24) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.channel, 'StreyOsuzhdaet');
  assert.strictEqual(v.title, 'Стрей Не Оценил Губную Гармошку');
  assert.strictEqual(v.category, 'people');
  assert.ok(site.videosOf(site.channels.StreyOsuzhdaet).some(x => x.id === 'Str3yHarmon1'));
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.pose.p) && Number.isFinite(st.pose.yaw) && Number.isFinite(st.pose.pitch) && Number.isFinite(st.pose.roll), `pose ${t}`);
    assert.ok(st.chat >= 0 && st.chat <= 1, `chat ${t}`);
    assert.strictEqual(st.pose.face.split('|').length, 5);
  }
  assert.ok(clip.stage(12.6).pose.p[2] > clip.stage(0.5).pose.p[2] + 0.3, 'leans into the camera');
  assert.ok(clip.stage(4.4).pose.hand && !clip.stage(1).pose.hand && !clip.stage(7).pose.hand, 'hand fixes the headset only around 4s');
  assert.strictEqual(clip.stage(19.5).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(2.3).face.eyes, 'shut');
  assert.strictEqual(clip.stage(18.0).face.eyes, 'wide');
  assert.ok(clip.voiceAt(12.5) > 0.4);
  assert.ok(clip.stage(22.5).chat > clip.stage(1).chat);
  assert.ok(window.StraySet.CHAT.some(l => l[2].includes('Реклама пошла')));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Стрей Не Оценил Губную Гармошку'));
  assert.ok(window.appIE.performSearch('стрей').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('губная гармошка').some(r => r.url === 'http://www.youvid.com'));
});

test('Стрей Осудил Наполовину keeps the interrupted condemnation, half-condemnation laugh, monitor glances and live chat on StreyOsuzhdaet', () => {
  const clip = clips.find(c => c.id === 'Str3yOsud1l');
  const v = site.video('Str3yOsud1l');
  const S = window.OsudilScript;
  assert.ok(clip && v && S && window.StraySet);
  assert.ok(Math.abs(clip.duration - 31.3) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.channel, 'StreyOsuzhdaet');
  assert.strictEqual(v.title, 'Стрей Осудил Наполовину');
  assert.strictEqual(v.category, 'people');
  assert.ok(site.videosOf(site.channels.StreyOsuzhdaet).some(x => x.id === 'Str3yOsud1l'));
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.pose.p) && Number.isFinite(st.pose.yaw) && Number.isFinite(st.pose.pitch) && Number.isFinite(st.pose.roll), `pose ${t}`);
    assert.ok(st.chat >= 0 && st.chat <= 1, `chat ${t}`);
    assert.strictEqual(st.pose.face.split('|').length, 5);
  }
  assert.strictEqual(clip.stage(9.3).face.mouth, 'round');
  assert.strictEqual(clip.stage(15.6).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(7.2).face.gaze, -1);
  assert.ok(clip.stage(15.6).pose.p[2] > clip.stage(7.2).pose.p[2] + 0.1, 'leans closer on half-condemnation');
  assert.ok(clip.stage(15.6).pose.hand && !clip.stage(2.0).pose.hand && !clip.stage(20.0).pose.hand);
  assert.ok(clip.voiceAt(9.2) > 0.35 && clip.voiceAt(15.3) > 0.35);
  assert.ok(clip.stage(30.0).chat > clip.stage(1.0).chat);
  assert.ok(window.StraySet.CHAT.some(l => l[2].includes('вот наполовину его прошёл')));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Стрей Осудил Наполовину'));
  assert.ok(window.appIE.performSearch('осудил наполовину').some(r => r.url === 'http://www.youvid.com'));
});

test('nope.avi lives on the memes/ytp channel with its own avatar, banner and cover', () => {
  const ch = site.channels.memes_ytp;
  const v = site.video('n0p3Av1Eng1');
  assert.ok(ch && v);
  assert.strictEqual(ch.name, 'memes/ytp');
  assert.strictEqual(ch.theme, 'ytp');
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['k3An4uH0rnY', 'n0p3Av1Eng1']);
  assert.ok(!site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'n0p3Av1Eng1'));
  assert.ok(fs.existsSync(path.join(root, 'content/YouVid/avatars/memes_ytp.png')));
  assert.ok(fs.existsSync(path.join(root, 'content/YouVid/banners/memes_ytp.png')));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('yv-theme-ytp'));
  assert.ok(site.renderSite('http://www.youvid.com/channels').includes('memes/ytp'));
});

test('Стрей Перепутал Трэк keeps the StreyOsuzhdaet channel, donation readout, hand gesture, mug sip, monitor glow and live chat', () => {
  const clip = clips.find(c => c.id === 'Str3yTr3k98');
  const v = site.video('Str3yTr3k98');
  const S = window.TrekScript;
  const ch = site.channels.StreyOsuzhdaet;
  assert.ok(clip && v && S && ch && window.StraySet);
  assert.strictEqual(ch.name, 'СТРЕЙ ОСУЖДАЕТ');
  assert.strictEqual(ch.theme, 'osuzhdaet');
  assert.strictEqual(ch.subs, 18300);
  assert.ok(Math.abs(clip.duration - 36.18) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.channel, 'StreyOsuzhdaet');
  assert.strictEqual(v.title, 'Стрей Перепутал Трэк');
  assert.strictEqual(v.category, 'music');
  assert.strictEqual(v.chapters.length, 9);
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id).sort(), ['Str3yHarmon1', 'Str3yOsud1l', 'Str3yTr3k98']);
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.pose.p) && Number.isFinite(st.pose.yaw) && Number.isFinite(st.pose.pitch) && Number.isFinite(st.pose.roll), `pose ${t}`);
    assert.ok(st.chat >= 0 && st.chat <= 1, `chat ${t}`);
    assert.strictEqual(st.pose.face.split('|').length, 5);
  }
  assert.strictEqual(clip.stage(21.4).face.mouth, 'round');
  assert.strictEqual(clip.stage(27.0).face.mouth, 'round');
  assert.strictEqual(clip.stage(23.5).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(26.8).face.gaze, -1);
  assert.ok(clip.stage(18.0).pose.hand && !clip.stage(1.0).pose.hand && !clip.stage(25.0).pose.hand);
  assert.ok([6.6, 17.8, 30.3].every(t => clip.stage(t).pose.hand && clip.stage(t).pose.hand.grip), 'hand grips the headset cup');
  assert.ok(!clip.stage(19.5).pose.hand && !clip.stage(22.5).pose.hand, 'no hand during the shocked face and the readout');
  assert.deepStrictEqual([19.5, 18.8].map(t => clip.stage(t).face.mouth), ['gasp', 'gasp']);
  assert.strictEqual(clip.stage(19.5).face.eyes, 'pop');
  assert.strictEqual(clip.stage(19.5).face.brows, 'high');
  assert.strictEqual(clip.stage(8.0).face.eyes, 'pop');
  assert.ok(clip.stage(2.5).pose.mug && !clip.stage(0.5).pose.mug && !clip.stage(10.0).pose.mug);
  assert.ok(clip.stage(6.0).grade[0] > clip.stage(1.0).grade[0], 'monitor brightens when switching windows');
  assert.ok(clip.voiceAt(21.4) > 0.35 && clip.voiceAt(24.4) > 0.35 && clip.voiceAt(34.0) > 0.35);
  assert.ok(clip.stage(35.0).chat > clip.stage(1.0).chat);
  assert.ok(S.CHAT.some(l => l[2].includes('\u041a\u0410\u0422\u041e\u0421 \u041f\u0415\u0420\u0415\u041f\u0423\u0422\u0410\u041b \u0422\u0420\u042d\u041a')));
  assert.ok(site.renderSite('http://www.youvid.com/user/StreyOsuzhdaet').includes('yv-theme-osuzhdaet'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=music').includes('Стрей Перепутал Трэк'));
  assert.ok(window.appIE.performSearch('перепутал трэк').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('стрей осуждает').some(r => r.url === 'http://www.youvid.com'));
});

test('Пампарам-пампарам,приветствую смотрящих keeps the wide workshop walk, bass-boost intro, both пам-парам lines and the greeting wave', () => {
  const clip = clips.find(c => c.id === 'pAmPaRam98');
  const v = site.video('pAmPaRam98');
  const S = window.PamparamScript;
  const Cast = window.PamparamCast;
  assert.ok(clip && v && S && Cast);
  assert.ok(Math.abs(clip.duration - 10.54) < 0.05 && clip.aspect === 16 / 9);
  assert.deepStrictEqual(clip.cuts, [0]);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Пампарам-пампарам,приветствую смотрящих');
  assert.strictEqual(v.category, 'people');
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'pAmPaRam98'));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov) && st.camera.wide > 1.2, `camera ${t}`);
    const m = Cast.solve(st.pose);
    Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.3, `joint at ${t}`));
  }
  assert.ok(clip.stage(0.1).pose.p[0] < -1.4 && clip.stage(8.5).pose.p[0] > 3.4, 'walks across the workshop');
  assert.ok(clip.stage(1.2).bass > 0.5 && clip.stage(7.0).bass === 0, 'bass-boost intro envelope');
  assert.strictEqual(clip.stage(0.4).pose.gL, 'open');
  assert.strictEqual(clip.stage(3.0).pose.gL, 'pocket');
  assert.strictEqual(clip.stage(3.0).pose.gR, 'pocket');
  assert.strictEqual(clip.voiceAt(1.5), 0);
  assert.strictEqual(clip.stage(1.5).pose.mouth, 'shut');
  assert.ok(clip.voiceAt(4.2) > 0.4 && S.speakerAt(4.2).part === 1);
  assert.strictEqual(clip.voiceAt(6.05), 0);
  assert.ok(clip.stage(5.9).pose.nk[1] < -0.15, 'turns head slightly between the two пам-парам lines');
  assert.ok(clip.voiceAt(6.8) > 0.4 && S.speakerAt(6.8).part === 2);
  assert.strictEqual(clip.voiceAt(8.3), 0);
  assert.ok(clip.voiceAt(9.2) > 0.4 && S.speakerAt(9.2).line === 'Приветствую смотрящих');
  const wave = clip.stage(9.2);
  const mw = Cast.solve(wave.pose);
  assert.strictEqual(wave.pose.gL, 'wave');
  assert.strictEqual(wave.pose.gR, 'pocket');
  assert.ok(mw.pts.wristL[1] > mw.pts.shoulderL[1] && mw.pts.wristL[0] > mw.pts.shoulderL[0], 'raises hand to wave at viewers');
  assert.strictEqual(clip.stage(10.3).pose.gL, 'pocket');
  assert.ok(window.appIE.performSearch('пампарам').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('приветствую смотрящих').some(r => r.url === 'http://www.youvid.com'));
});

test('WAKE UP ROMAN keeps the 8 shots, bedroom POV glasses sequence, phone screen and cab depot wakeup on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'wAk3UpR0mAn');
  const v = site.video('wAk3UpR0mAn');
  const S = window.RomanScript;
  const Cast = window.RomanCast;
  assert.ok(clip && v && S && Cast);
  assert.ok(Math.abs(clip.duration - 14.58) < 0.05 && clip.aspect === 16 / 9);
  assert.deepStrictEqual(clip.cuts, [0, 2.13, 2.83, 4.33, 5.77, 7.53, 10.95, 14.25]);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'WAKE UP ROMAN');
  assert.strictEqual(v.category, 'comedy');
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'wAk3UpR0mAn'));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.cast || []).forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.1 && p[1] < 2.4, `${c.who} joint at ${t}`));
    });
  }
  assert.strictEqual(clip.stage(0.1).fade, 0);
  assert.strictEqual(clip.stage(1.0).set, 'bedroom');
  assert.strictEqual(clip.stage(1.0).pov.kind, 'reach');
  assert.strictEqual(clip.stage(1.0).phoneOnDesk, true);
  assert.strictEqual(clip.stage(1.6).pov.hasPhone, true);
  assert.strictEqual(clip.stage(2.5).pov.kind, 'holdPhone');
  assert.strictEqual(clip.stage(2.5).pov.lit, true);
  assert.strictEqual(clip.stage(3.5).cast[0].who, 'tohru');
  assert.ok(clip.stage(3.5).cast[0].pose.glasses && clip.stage(3.5).blur > 0.5);
  assert.ok(clip.stage(5.2).cast[0].pose.glasses.pos[2] > clip.stage(3.5).cast[0].pose.glasses.pos[2], 'glasses move toward the viewer');
  assert.strictEqual(clip.stage(6.5).blur, 0);
  assert.strictEqual(clip.stage(8.5).cast[0].pose.eyes, 'happy');
  assert.strictEqual(clip.stage(10.2).pov.kind, 'holdPhone');
  assert.strictEqual(clip.stage(11.5).set, 'depot');
  assert.deepStrictEqual(clip.stage(11.5).cast.map(c => c.who), ['roman', 'niko']);
  assert.strictEqual(clip.stage(11.5).subtitle, 'sub1');
  assert.strictEqual(clip.stage(11.2).cast[0].pose.eyes, 'shut');
  assert.strictEqual(clip.stage(12.2).cast[0].pose.eyes, 'wide');
  assert.strictEqual(clip.stage(13.2).cast[0].pose.gL, 'open');
  assert.strictEqual(clip.stage(14.4).shot, 7);
  assert.deepStrictEqual(clip.stage(14.4).cast.map(c => c.who), ['niko']);
  assert.ok(clip.voiceAt(11.1) > 0.4 && clip.voiceAt(0.1) === 0);
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=wAk3UpR0mAn').includes('WAKE UP ROMAN'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('WAKE UP ROMAN'));
  assert.ok(window.appIE.performSearch('wake up roman').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('роман').some(r => r.url === 'http://www.youvid.com'));
});

test('Sparkle Trailer - Monodrama keeps the HSR98 channel, 9 chapters, 3 outfits, props and full 124.92s choreography', () => {
  const clip = clips.find(c => c.id === 'sPaRkL3Mono');
  const v = site.video('sPaRkL3Mono');
  const S = window.SparkleScript;
  const Cast = window.SparkleCast;
  const ch = site.channels.HSR98;
  assert.ok(clip && v && S && Cast && ch);
  assert.strictEqual(ch.name, 'HSR98');
  assert.strictEqual(ch.site, 'hsr.hoyoverse.com');
  assert.strictEqual(ch.theme, 'hsr');
  assert.ok(Math.abs(clip.duration - 124.92) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.channel, 'HSR98');
  assert.strictEqual(v.title, 'Sparkle Trailer - Monodrama');
  assert.strictEqual(v.category, 'games');
  assert.strictEqual(v.chapters.length, 9);
  assert.ok(site.videosOf(ch).some(x => x.id === 'sPaRkL3Mono'));
  for (let t = 0; t <= clip.duration; t += 0.25) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.cast || []).forEach(c => {
      const m = Cast.solve(c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.1 && p[1] < 2.4, `joint at ${t}`));
    });
  }
  assert.strictEqual(clip.stage(1.0).banner, 'logoIntro');
  assert.strictEqual(clip.stage(4.5).set, 'penacony');
  assert.strictEqual(clip.stage(4.5).cast[0].pose.mask, 'handR');
  assert.strictEqual(clip.stage(7.5).cast[0].pose.mask, 'face');
  assert.strictEqual(clip.stage(14.0).set, 'classroom');
  assert.strictEqual(clip.stage(14.0).cast[0].pose.outfit, 'school');
  assert.strictEqual(clip.stage(30.0).cast.length, 3);
  assert.strictEqual(clip.stage(36.0).goldfish, true);
  assert.strictEqual(clip.stage(48.0).cast[0].pose.prop, 'gun');
  assert.strictEqual(clip.stage(57.0).banner, 'logoTitle');
  assert.strictEqual(clip.stage(65.8).env.exposure, 0.96);
  assert.strictEqual(clip.stage(80.0).fireworks, true);
  assert.strictEqual(clip.stage(108.0).set, 'curtain');
  assert.strictEqual(clip.stage(121.0).banner, 'logoOutro');
  assert.ok(clip.voiceAt(60.0) > 0.3 && clip.voiceAt(0.2) === 0);
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=sPaRkL3Mono').includes('Sparkle Trailer - Monodrama'));
  assert.ok(site.renderSite('http://www.youvid.com/user/HSR98').includes('yv-theme-hsr'));
  assert.ok(window.appIE.performSearch('sparkle').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('искорка').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('hsr98').some(r => r.url === 'http://www.youvid.com'));
});

test('«Та-та-та!» Кли (Пиро) keeps the HSR98 channel, title cards, plaza, battle, Jean, hall and sunset timeline of 97.22s', () => {
  const clip = clips.find(c => c.id === 'kL33T4T4T4a');
  const v = site.video('kL33T4T4T4a');
  const S = window.KleeScript;
  const Cast = window.KleeCast;
  const Cards = window.KleeCards;
  const ch = site.channels.HSR98;
  assert.ok(clip && v && S && Cast && Cards && ch);
  assert.ok(Math.abs(clip.duration - 97.22) < 0.05 && clip.aspect === 16 / 9);
  assert.ok(fs.existsSync(path.join(root, clip.audio)) && clip.audio === 'content/YouVid/klee.mp3');
  assert.strictEqual(v.channel, 'HSR98');
  assert.strictEqual(v.title, '«Та-та-та!» Кли (Пиро)');
  assert.strictEqual(v.category, 'games');
  assert.strictEqual(v.chapters.length, 14);
  assert.ok(site.videosOf(ch).some(x => x.id === 'kL33T4T4T4a'));
  assert.strictEqual(Cards.CARDS.length, 15);
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.klee) Object.values(Cast.solveKlee(st.klee).pts).forEach(p => assert.ok(finite(p) && p[1] > -0.2 && p[1] < 3.5, `joint at ${t}`));
    st.hilis.forEach(h => assert.ok(finite(h.pos), `hilichurl at ${t}`));
  }
  assert.strictEqual(clip.stage(2).kind, 'black');
  assert.strictEqual(clip.stage(5.5).kind, 'cards');
  assert.strictEqual(clip.stage(13.8).card, 14);
  assert.strictEqual(clip.stage(15).set, 'plaza');
  assert.ok(clip.stage(15).klee && !clip.stage(15).stelle && clip.stage(22).stelle, 'Stelle stands at the lattice door');
  assert.strictEqual(clip.stage(25.8).overlay, 'title');
  assert.strictEqual(clip.stage(32.3).overlay, 'comic');
  assert.ok(clip.stage(29).hilis.length >= 3 && clip.stage(29).flames.length > 0, 'meadow battle with burning grass');
  assert.ok(clip.stage(42.5).slimes.length > 0 && clip.stage(42.5).lake);
  assert.ok(clip.stage(47).jeanLegs && clip.stage(49.5).jean && !clip.stage(49.5).klee);
  assert.strictEqual(clip.stage(54).set, 'hall');
  assert.ok(clip.stage(54).sigil >= 0 && clip.stage(65.5).sigil === -1);
  assert.ok(clip.stage(67.5).golem && clip.stage(67.5).hex);
  assert.strictEqual(clip.stage(71.5).env, 'night');
  assert.strictEqual(clip.stage(70.42).env, 'purple');
  assert.strictEqual(clip.stage(85.5).env, 'sunset');
  assert.strictEqual(clip.stage(93).kind, 'logo');
  assert.ok(clip.stage(61).set === 'hall' && clip.stage(61.5).klee, 'the door opens before Klee pops in');
  assert.ok(clip.voiceAt(49.5) > 0.1 && clip.voiceAt(2) === 0);
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=kL33T4T4T4a').includes('Та-та-та'));
  assert.ok(site.renderSite('http://www.youvid.com/user/HSR98').includes('Та-та-та'));
  assert.ok(window.appIE.performSearch('klee').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('кли').some(r => r.url === 'http://www.youvid.com'));
});

test('on-screen text keeps profanity masked', () => {
  const src = CLIP_FILES.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  assert.ok(!/хуй|пизд|бля[тд]|ебн|говн/i.test(src));
  assert.ok(!/хуй|пизд|бля[тд]|ебн|говн/i.test(JSON.stringify([site.videos, site.channels])));
});

const clippySource = fs.readFileSync(path.join(root, 'js/apps/clippy.js'), 'utf8');
const AppClippy = eval(`${clippySource.replace('window.appClippy = new AppClippy();', '')}; AppClippy`);
const makeClippy = () => {
  const c = Object.create(AppClippy.prototype);
  c.spoken = [];
  c.opened = [];
  c.visible = true;
  c.annoyance = 'normal';
  c.speak = (text, actions = [], mood = '') => c.spoken.push({ text, actions, mood });
  c.openInIE = (url) => c.opened.push(url);
  return c;
};
const pageEls = {};
const clicked = [];
global.document = {
  querySelector: (s) => s === '.yv-root' ? { querySelector: (sel) => (pageEls[sel] = pageEls[sel] || { value: '', focused: false, click() { clicked.push(sel); }, focus() { this.focused = true; } }) } : null
};
const fakePlayer = (state) => ({ state, plays: 0, play() { this.plays++; this.state = 'playing'; } });
const press = (reaction, label) => {
  const a = reaction.actions.find(x => x.text.includes(label));
  assert.ok(a, `no action "${label}"`);
  a.action();
};
const openPage = (url, user) => {
  localStorage.store = {};
  site.renderSite(url);
  site.saveState({ user: user || '' });
};

test('Clippy greets each video with its own line and watches it together', () => {
  const texts = new Set();
  site.videos.forEach(v => {
    openPage(`http://www.youvid.com/watch?v=${v.id}`);
    site.player = fakePlayer('paused');
    const clippy = makeClippy();
    const r = clippy.youvidReaction();
    assert.ok(r && r.mood && r.text.includes(window.YouVidPlayer.fmt(site.duration(v))), v.id);
    texts.add(r.text);
    press(r, 'Смотреть вместе');
    assert.strictEqual(site.player.plays, 1);
    press(r, 'Другое видео');
    const menu = clippy.spoken[clippy.spoken.length - 1];
    assert.strictEqual(menu.actions.length, site.videos.length - 1);
    menu.actions[0].action();
    assert.ok(clippy.opened[0].startsWith('http://www.youvid.com/watch?v=') && !clippy.opened[0].endsWith(v.id));
  });
  assert.strictEqual(texts.size, site.videos.length);
  site.player = fakePlayer('playing');
  assert.ok(!makeClippy().youvidReaction().actions.some(a => a.text.includes('Смотреть вместе')));
  site.player = fakePlayer('broken');
  const broken = makeClippy();
  const r = broken.youvidReaction();
  assert.ok(r.text.includes('WebGL'));
  press(r, '3D-ускоритель');
  assert.strictEqual(broken.opened[0], 'http://www.3dfx-zone.com');
  site.player = null;
  assert.ok(clippySource.includes("'youvid': () => this.youvidReaction()"));
});

test('Clippy rates and drafts a comment only for signed-in viewers', () => {
  openPage('http://www.youvid.com/watch?v=jNQXAC9IVRw');
  const guest = makeClippy();
  press(guest.youvidReaction(), 'Оценить');
  press(guest.spoken[0], 'Войти');
  assert.strictEqual(guest.opened[0], `http://www.youvid.com/login?next=${encodeURIComponent('http://www.youvid.com/watch?v=jNQXAC9IVRw')}`);
  press(guest.youvidReaction(), 'комментарием');
  assert.ok(guest.spoken[1].text.includes('аккаунт'));
  openPage('http://www.youvid.com/watch?v=jNQXAC9IVRw', 'tester');
  const clippy = makeClippy();
  const r = clippy.youvidReaction();
  press(r, 'Оценить');
  assert.strictEqual(clippy.spoken[0].actions.length, 5);
  press(clippy.spoken[0], 'отлично');
  assert.strictEqual(clicked.pop(), '.yv-rate-btn[data-rate="5"]');
  press(r, 'комментарием');
  const field = pageEls['.yv-comment-text'];
  assert.ok(field.focused && field.value.includes('jawed') && field.value.endsWith('С уважением, tester'));
  site.saveState({ rated: { jNQXAC9IVRw: 5 } });
  assert.ok(!clippy.youvidReaction().actions.some(a => a.text.includes('Оценить')));
});

test('Clippy subscribes on channel pages and talks on home and login', () => {
  openPage('http://www.youvid.com/user/Hayato_me', 'tester');
  const clippy = makeClippy();
  const r = clippy.youvidReaction();
  assert.ok(r.text.includes('Просчитался , но где?'));
  press(r, 'Подписаться');
  assert.strictEqual(clicked.pop(), '.yv-sub[data-channel="Hayato_me"]');
  press(r, 'Смотреть видео канала');
  assert.strictEqual(clippy.opened[0], 'http://www.youvid.com/watch?v=hArMoNy_hsr');
  press(r, 'А у тебя есть канал');
  assert.ok(clippy.spoken[clippy.spoken.length - 1].text.includes('Rocky'));
  site.saveState({ subs: ['Hayato_me'] });
  assert.ok(!clippy.youvidReaction().actions.some(a => a.text.includes('Подписаться')));
  openPage('http://www.youvid.com/user/jawed');
  const guest = makeClippy();
  press(guest.youvidReaction(), 'Подписаться');
  press(guest.spoken[0], 'Войти');
  assert.strictEqual(guest.opened[0], `http://www.youvid.com/login?next=${encodeURIComponent('http://www.youvid.com/user/jawed')}`);
  openPage('http://www.youvid.com');
  const home = makeClippy().youvidReaction();
  assert.ok(home.actions.some(a => a.text.includes('Завести аккаунт')));
  openPage('http://www.youvid.com/login');
  assert.ok(makeClippy().youvidReaction().text.includes('Пароль'));
  openPage('http://www.youvid.com/nowhere');
  assert.strictEqual(makeClippy().youvidReaction(), null);
});

test('Clippy reacts to a finished video and to a posted comment', () => {
  openPage('http://www.youvid.com/watch?v=jNQXAC9IVRw', 'tester');
  site.player = fakePlayer('ended');
  const clippy = makeClippy();
  window.appClippy = clippy;
  global.cancelAnimationFrame = () => {};
  const p = Object.create(window.YouVidPlayer.prototype);
  const node = { classList: { add: () => {}, remove: () => {} }, setAttribute: () => {} };
  Object.assign(p, { state: 'playing', clip: clips.find(c => c.id === 'jNQXAC9IVRw'), meta: site.video('jNQXAC9IVRw'), root: node, pp: node, endEl: {}, audio: { pause: () => {} }, updateTime: () => {} });
  p.finish();
  const end = clippy.spoken[0];
  assert.ok(end && end.text.includes('Девятнадцать'));
  press(end, 'Ещё раз');
  assert.strictEqual(site.player.plays, 1);
  press(end, 'Дальше');
  assert.strictEqual(clippy.opened[0], 'http://www.youvid.com/watch?v=hArMoNy_hsr');
  clippy.onYouVidComment(site.video('jNQXAC9IVRw'), 'Здравствуйте, jawed!\nС уважением, tester');
  clippy.onYouVidComment(site.video('jNQXAC9IVRw'), 'класс');
  assert.ok(clippy.spoken[1].text.includes('Письмо ушло') && clippy.spoken[2].text.includes('черновик'));
  const quiet = makeClippy();
  quiet.annoyance = 'quiet';
  quiet.onYouVidEnded(site.video('jNQXAC9IVRw'));
  quiet.onYouVidComment(site.video('jNQXAC9IVRw'), 'класс');
  assert.strictEqual(quiet.spoken.length, 0);
  delete window.appClippy;
  site.player = null;
  localStorage.store = {};
  site.state = site.loadState();
});

test('end-screen renders a 2x2 grid with hover titles, bottom replay button and loop toggle', () => {
  localStorage.store = {};
  site.state = site.loadState();
  const html = site.renderSite('http://www.youvid.com/watch?v=y0Ph0neL1ng');
  const gridIdx = html.indexOf('yv-end-grid');
  const replayIdx = html.indexOf('yv-replay');
  assert.ok(gridIdx > 0 && replayIdx > gridIdx, 'replay button is placed below the 2x2 grid');
  const items = html.match(/class="yv-thumb yv-end-item"/g) || [];
  assert.strictEqual(items.length, 4, 'end-screen shows a 2x2 block of 4 suggested videos');
  assert.ok(html.includes('class="yv-end-item-title">Me at the zoo</span>'), 'suggested video includes hover title');
  const loopIdx = html.indexOf('class="yv-loop');
  const muteIdx = html.indexOf('class="yv-mute"');
  assert.ok(loopIdx > 0 && muteIdx > loopIdx, 'loop icon is placed to the left of volume mute control');
  const p = Object.create(window.YouVidPlayer.prototype);
  const attrs = {};
  const classes = new Set();
  const loopBtn = {
    classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
    setAttribute: (k, v) => { attrs[k] = v; }
  };
  let replayed = 0;
  Object.assign(p, {
    state: 'playing',
    time: 15,
    looping: false,
    site,
    loopBtn,
    clip: clips.find(c => c.id === 'y0Ph0neL1ng'),
    meta: site.video('y0Ph0neL1ng'),
    play() { replayed++; this.state = 'playing'; },
    updateTime() {}
  });
  p.setLoop(true);
  assert.strictEqual(p.looping, true);
  assert.strictEqual(site.state.loop, true);
  assert.ok(classes.has('yv-loop-on'));
  assert.strictEqual(attrs['aria-pressed'], 'true');
  p.finish();
  assert.strictEqual(replayed, 1, 'finish restarts video when looping is enabled');
  assert.strictEqual(p.time, 0);
  assert.strictEqual(p.state, 'playing');
  const htmlLoop = site.renderSite('http://www.youvid.com/watch?v=y0Ph0neL1ng');
  assert.ok(htmlLoop.includes('yv-loop yv-loop-on') && htmlLoop.includes('aria-pressed="true"'));
  localStorage.store = {};
  site.state = site.loadState();
});

test('new source files contain zero comments', () => {
  const files = FILES.slice(2).concat(['css/apps/youvid-site.css', 'tools/youvid-shots.cjs', 'tests/youvid-site.test.js']);
  files.forEach(f => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    const stripped = src.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
    assert.ok(!/\/\*[\s\S]*?\*\//.test(stripped), `${f} has a block comment`);
    assert.ok(!/(^|[^:\\])\/\/[^\n]*/m.test(stripped.replace(/https?:\/\/[^\s'"`]*/g, '')), `${f} has a line comment`);
  });
});

test('Keanu Reeves is Extremely Horny lives on memes/ytp with 15 shots, boxed captions and cover stills', () => {
  const clip = clips.find(c => c.id === 'k3An4uH0rnY');
  const v = site.video('k3An4uH0rnY');
  assert.ok(clip && v);
  assert.ok(Math.abs(clip.duration - 23.1) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Keanu Reeves is Extremely Horny.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.cuts.length, 15);
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, 'Keanu Reeves is Extremely Horny');
  assert.strictEqual(clip.stage(1).shot.boxed, false);
  assert.strictEqual(clip.stage(3).shot.caption, "I'll fuck it");
  assert.strictEqual(clip.stage(6).shot.caption, 'Why do you cum?');
  assert.strictEqual(clip.stage(8.5).shot.caption, 'Dick');
  assert.strictEqual(clip.stage(11).shot.caption, 'Well cum');
  assert.strictEqual(clip.stage(14).shot.caption, 'You can be cum');
  assert.strictEqual(clip.stage(22).shot.caption, 'Getting cock');
  assert.ok(clip.stage(17).zoom > clip.stage(15.5).zoom);
  assert.ok(clip.voiceAt(5) >= 0);
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/k3An4uH0rnY-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=k3An4uH0rnY').includes('Keanu Reeves is Extremely Horny'));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('Keanu Reeves is Extremely Horny'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('Keanu Reeves is Extremely Horny'));
  assert.ok(window.appIE.performSearch('keanu').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('киану').some(r => r.url === 'http://www.youvid.com'));
});

console.log(`\n${passed} youvid tests passed`);
