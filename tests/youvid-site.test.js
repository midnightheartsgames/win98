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
  assert.ok(ie.favorites.some(([url]) => url === 'http://www.youvid.com'));
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
    assert.ok(fs.existsSync(path.join(root, `content/YouVid/banners/${ch.user}.png`)), ch.user);
  });
});

test('every page renders and routes resolve', () => {
  const pages = {
    'http://www.youvid.com': 'Избранное видео',
    'http://www.youvid.com/watch?v=jNQXAC9IVRw': 'Me at the zoo',
    'http://www.youvid.com/watch?v=hArMoNy_hsr': 'ГАРМОНИСТАМИ',
    'http://www.youvid.com/watch?v=i9AyI356ye4': 'Влад Савельев ложится спать',
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

test('new source files contain zero comments', () => {
  const files = FILES.slice(2).concat(['css/apps/youvid-site.css', 'tools/youvid-shots.cjs', 'tests/youvid-site.test.js']);
  files.forEach(f => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    const stripped = src.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
    assert.ok(!/\/\*[\s\S]*?\*\//.test(stripped), `${f} has a block comment`);
    assert.ok(!/(^|[^:\\])\/\/[^\n]*/m.test(stripped.replace(/https?:\/\/[^\s'"`]*/g, '')), `${f} has a line comment`);
  });
});

console.log(`\n${passed} youvid tests passed`);
