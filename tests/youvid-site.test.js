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
  'js/apps/youvid/konop-art.js',
  'js/apps/youvid/konop-world.js',
  'js/apps/youvid/konop-cast.js',
  'js/apps/youvid/konop-foes.js',
  'js/apps/youvid/konop-fx.js',
  'js/apps/youvid/konop-shots.js',
  'js/apps/youvid/konop-act1.js',
  'js/apps/youvid/konop-act2.js',
  'js/apps/youvid/konop-act3.js',
  'js/apps/youvid/konop-script.js',
  'js/apps/youvid/konop.js',
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
  'js/apps/youvid/podskochil-script.js',
  'js/apps/youvid/podskochil.js',
  'js/apps/youvid/ultra-script.js',
  'js/apps/youvid/ultra.js',
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
  'js/apps/youvid/siega-room.js',
  'js/apps/youvid/siega-cast.js',
  'js/apps/youvid/siega-track.js',
  'js/apps/youvid/siega-motion.js',
  'js/apps/youvid/siega-screens.js',
  'js/apps/youvid/siega-script.js',
  'js/apps/youvid/siega.js',
  'js/apps/youvid/ozon-art.js',
  'js/apps/youvid/ozon-world.js',
  'js/apps/youvid/ozon-cast.js',
  'js/apps/youvid/ozon-overlay.js',
  'js/apps/youvid/ozon-script.js',
  'js/apps/youvid/ozon.js',
  'js/apps/youvid/yegud-cast.js',
  'js/apps/youvid/yegud-office.js',
  'js/apps/youvid/yegud-script.js',
  'js/apps/youvid/yegud.js',
  'js/apps/youvid/kafka-art.js',
  'js/apps/youvid/kafka-cast.js',
  'js/apps/youvid/kafka-world.js',
  'js/apps/youvid/kafka-fx.js',
  'js/apps/youvid/kafka-shots.js',
  'js/apps/youvid/kafka-act1.js',
  'js/apps/youvid/kafka-act2.js',
  'js/apps/youvid/kafka-act3.js',
  'js/apps/youvid/kafka-script.js',
  'js/apps/youvid/kafka.js',
  'js/apps/youvid/hogw-set.js',
  'js/apps/youvid/hogw-cast.js',
  'js/apps/youvid/hogw-props.js',
  'js/apps/youvid/hogw-track.js',
  'js/apps/youvid/hogw-script.js',
  'js/apps/youvid/hogw.js',
  'js/apps/youvid/kart-script.js',
  'js/apps/youvid/kart-vlad.js',
  'js/apps/youvid/kart-sets.js',
  'js/apps/youvid/kart-anime.js',
  'js/apps/youvid/kart.js',
  'js/apps/youvid/fab-cast.js',
  'js/apps/youvid/fab-art.js',
  'js/apps/youvid/fab-pose.js',
  'js/apps/youvid/fab-world.js',
  'js/apps/youvid/fab-voice.js',
  'js/apps/youvid/fab-script-1.js',
  'js/apps/youvid/fab-script-2.js',
  'js/apps/youvid/fab-script-3.js',
  'js/apps/youvid/fab-script-4.js',
  'js/apps/youvid/fab-script-5.js',
  'js/apps/youvid/fab-script.js',
  'js/apps/youvid/fab.js',
  'js/apps/youvid/mth-fx.js',
  'js/apps/youvid/mth-art.js',
  'js/apps/youvid/mth-heavy.js',
  'js/apps/youvid/mth-props.js',
  'js/apps/youvid/mth-sets.js',
  'js/apps/youvid/mth-voice.js',
  'js/apps/youvid/mth-script.js',
  'js/apps/youvid/mth.js',
  'js/apps/youvid/mts-voice.js',
  'js/apps/youvid/mts-art.js',
  'js/apps/youvid/mts-soldier.js',
  'js/apps/youvid/mts-props.js',
  'js/apps/youvid/mts-sets.js',
  'js/apps/youvid/mts-script.js',
  'js/apps/youvid/mts.js',
  'js/apps/youvid/mte-voice.js',
  'js/apps/youvid/mte-engineer.js',
  'js/apps/youvid/mte-art.js',
  'js/apps/youvid/mte-props.js',
  'js/apps/youvid/mte-sets.js',
  'js/apps/youvid/mte-script.js',
  'js/apps/youvid/mte.js',
  'js/apps/youvid/mtd-voice.js',
  'js/apps/youvid/mtd-demoman.js',
  'js/apps/youvid/mtd-art.js',
  'js/apps/youvid/mtd-props.js',
  'js/apps/youvid/mtd-sets.js',
  'js/apps/youvid/mtd-script.js',
  'js/apps/youvid/mtd.js',
  'js/apps/youvid/msc-voice.js',
  'js/apps/youvid/msc-scout.js',
  'js/apps/youvid/msc-art.js',
  'js/apps/youvid/msc-props.js',
  'js/apps/youvid/msc-sets.js',
  'js/apps/youvid/msc-shots.js',
  'js/apps/youvid/msc-act.js',
  'js/apps/youvid/msc-talk.js',
  'js/apps/youvid/msc-script.js',
  'js/apps/youvid/msc.js',
  'js/apps/youvid/msp-voice.js',
  'js/apps/youvid/msp-spy.js',
  'js/apps/youvid/msp-art.js',
  'js/apps/youvid/msp-props.js',
  'js/apps/youvid/msp-sets.js',
  'js/apps/youvid/msp-shots.js',
  'js/apps/youvid/msp-act1.js',
  'js/apps/youvid/msp-act2.js',
  'js/apps/youvid/msp-act3.js',
  'js/apps/youvid/msp-act4.js',
  'js/apps/youvid/msp-script.js',
  'js/apps/youvid/msp.js',
  'js/apps/youvid/msn-voice.js',
  'js/apps/youvid/msn-sniper.js',
  'js/apps/youvid/msn-art.js',
  'js/apps/youvid/msn-props.js',
  'js/apps/youvid/msn-sets.js',
  'js/apps/youvid/msn-shots.js',
  'js/apps/youvid/msn-act1.js',
  'js/apps/youvid/msn-act2.js',
  'js/apps/youvid/msn-script.js',
  'js/apps/youvid/msn.js',
  'js/apps/youvid/mpy-voice.js',
  'js/apps/youvid/mpy-pyro.js',
  'js/apps/youvid/mpy-heads.js',
  'js/apps/youvid/mpy-baby.js',
  'js/apps/youvid/mpy-art.js',
  'js/apps/youvid/mpy-props.js',
  'js/apps/youvid/mpy-sets.js',
  'js/apps/youvid/mpy-shots.js',
  'js/apps/youvid/mpy-real.js',
  'js/apps/youvid/mpy-land.js',
  'js/apps/youvid/mpy-script.js',
  'js/apps/youvid/mpy.js',
  'js/apps/youvid/mtm-voice.js',
  'js/apps/youvid/mtm-medic.js',
  'js/apps/youvid/mtm-art.js',
  'js/apps/youvid/mtm-props.js',
  'js/apps/youvid/mtm-sets.js',
  'js/apps/youvid/mtm-shots.js',
  'js/apps/youvid/mtm-act1.js',
  'js/apps/youvid/mtm-act2.js',
  'js/apps/youvid/mtm-act3.js',
  'js/apps/youvid/mtm-act4.js',
  'js/apps/youvid/mtm-script.js',
  'js/apps/youvid/mtm.js',
  'js/apps/youvid/grub-cast.js',
  'js/apps/youvid/grub-world.js',
  'js/apps/youvid/grub-ui.js',
  'js/apps/youvid/grub-script.js',
  'js/apps/youvid/grub.js',
  'js/apps/youvid/kalam-art.js',
  'js/apps/youvid/kalam-cast.js',
  'js/apps/youvid/kalam-sets.js',
  'js/apps/youvid/kalam-script.js',
  'js/apps/youvid/kalam.js',
  'js/apps/youvid/sts-art.js',
  'js/apps/youvid/sts-world.js',
  'js/apps/youvid/sts-cast.js',
  'js/apps/youvid/sts-track.js',
  'js/apps/youvid/sts-script.js',
  'js/apps/youvid/sts.js',
  'js/apps/youvid/vaz-art.js',
  'js/apps/youvid/vaz-diner.js',
  'js/apps/youvid/vaz-cast.js',
  'js/apps/youvid/vaz-script.js',
  'js/apps/youvid/vaz.js',
  'js/apps/youvid/buff-art.js',
  'js/apps/youvid/buff-cast.js',
  'js/apps/youvid/buff-hall.js',
  'js/apps/youvid/buff-script.js',
  'js/apps/youvid/buff.js',
  'js/apps/youvid/mukbang-room.js',
  'js/apps/youvid/mukbang-cast.js',
  'js/apps/youvid/mukbang-motion.js',
  'js/apps/youvid/mukbang-script.js',
  'js/apps/youvid/mukbang.js',
  'js/apps/youvid/nag-fx.js',
  'js/apps/youvid/nag-art.js',
  'js/apps/youvid/nag-cast.js',
  'js/apps/youvid/nag-world.js',
  'js/apps/youvid/nag-shots.js',
  'js/apps/youvid/nag-act1.js',
  'js/apps/youvid/nag-act2.js',
  'js/apps/youvid/nag-script.js',
  'js/apps/youvid/nag.js',
  'js/apps/youvid/bb-art.js',
  'js/apps/youvid/bb-faces.js',
  'js/apps/youvid/bb-cast.js',
  'js/apps/youvid/bb-sets.js',
  'js/apps/youvid/bb-shots.js',
  'js/apps/youvid/bb-script.js',
  'js/apps/youvid/bb.js',
  'js/apps/youvid/saira-art.js',
  'js/apps/youvid/saira-props.js',
  'js/apps/youvid/saira-hands.js',
  'js/apps/youvid/saira-sets.js',
  'js/apps/youvid/saira-track.js',
  'js/apps/youvid/saira-script.js',
  'js/apps/youvid/saira.js',
  'js/apps/youvid/stairs-art.js',
  'js/apps/youvid/stairs-world.js',
  'js/apps/youvid/stairs-cast.js',
  'js/apps/youvid/stairs-motion.js',
  'js/apps/youvid/stairs-script.js',
  'js/apps/youvid/stairs.js',
  'js/apps/youvid/parad-track.js',
  'js/apps/youvid/parad-cam.js',
  'js/apps/youvid/parad-art.js',
  'js/apps/youvid/parad-world.js',
  'js/apps/youvid/parad-cast.js',
  'js/apps/youvid/parad-gun.js',
  'js/apps/youvid/parad-script.js',
  'js/apps/youvid/parad.js',
  'js/apps/youvid/down-track.js',
  'js/apps/youvid/down-cam.js',
  'js/apps/youvid/down-art.js',
  'js/apps/youvid/down-world.js',
  'js/apps/youvid/down-cast.js',
  'js/apps/youvid/down-gun.js',
  'js/apps/youvid/down-script.js',
  'js/apps/youvid/down.js',
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
  assert.strictEqual(ie.identifyPageKey('http://www.youvid.com/user/jawed'), 'youvid');
  assert.ok(ie.getPageTitle('youvid').includes('YouVid'));
  assert.ok(ie.performSearch('youvid').some(r => r.url === 'http://www.youvid.com'));
});

test('every video is registered once with its mp3 soundtrack and real duration', () => {
  CLIP_FILES.forEach(load);
  assert.strictEqual(clips.length, site.videos.length);
  site.videos.forEach(v => assert.ok(clips.some(c => c.id === v.id), `clip for ${v.id}`));
  const zoo = clips.find(c => c.id === 'jNQXAC9IVRw');
  const vlad = clips.find(c => c.id === 'i9AyI356ye4');
  assert.ok(zoo && vlad);
  assert.ok(Math.abs(zoo.duration - 19.06) < 0.1);
  assert.ok(Math.abs(vlad.duration - 91.6) < 0.1);
  clips.forEach(c => assert.ok(fs.existsSync(path.join(root, c.audio)), c.audio));
  assert.strictEqual(zoo.aspect, 4 / 3);
  assert.strictEqual(vlad.aspect, 16 / 9);
});

test('channels follow the real channel data', () => {
  const j = site.channels.jawed;
  assert.strictEqual(j.name, 'jawed');
  assert.strictEqual(j.subs, 2147);
  assert.deepStrictEqual(site.videosOf(j).map(v => v.title), ['Me at the zoo']);
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
    'http://www.youvid.com/user/nobody98': 'Канал не найден',
    'http://www.youvid.com/browse?s=mp': 'Популярные видео',
    'http://www.youvid.com/browse?c=pets': 'пока нет видео',
    'http://www.youvid.com/channels': 'Каналы',
    'http://www.youvid.com/categories': 'Гаджеты и игры',
    'http://www.youvid.com/results?search_query=%D0%B7%D0%BE%D0%BE%D0%BF%D0%B0%D1%80%D0%BA': 'Me at the zoo',
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
  const bed = site.renderSite('http://www.youvid.com/watch?v=i9AyI356ye4');
  assert.ok(bed.includes('height="270"'), '16:9 video is letterboxed');
  assert.ok(bed.includes(encodeURI(clips.find(c => c.id === 'i9AyI356ye4').audio)));
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
  site.saveState({ subs: ['EbatoriyaPlanet'], favorites: ['i9AyI356ye4'] });
  site.countView('jNQXAC9IVRw');
  assert.strictEqual(site.views(v), v.views + 1);
  site.saveState({ comments: { jNQXAC9IVRw: [{ user: 'tester98', when: 'только что', text: '<b>слоны</b>' }] } });
  const html = site.renderSite('http://www.youvid.com/watch?v=jNQXAC9IVRw');
  assert.ok(html.includes('&lt;b&gt;слоны&lt;/b&gt;'), 'comments are escaped');
  assert.ok(html.includes('Отписаться') === false);
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Отписаться'));
  assert.ok(site.renderSite('http://www.youvid.com/favorites').includes('Влад Савельев ложится спать'));
  assert.ok(site.renderSite('http://www.youvid.com/subscriptions').includes('Планета Ебатории'));
  const again = new site.constructor();
  assert.strictEqual(again.state.user, 'tester98');
  assert.deepStrictEqual(again.state.subs, ['EbatoriyaPlanet']);
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
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['N4gat0r0Op1', 'k0n0SuBaOp1', 'k0n0SuBa3Ed']);
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
  const memes = site.videosOf(ch);
  ['cAtsBG3r34L', 'H4rryG3rm4n', 'k3An4uH0rnY', 'n0p3Av1Eng1'].forEach(id => assert.ok(memes.some(x => x.id === id), id));
  assert.deepStrictEqual(memes.map(x => x.id).slice(-2), ['k3An4uH0rnY', 'n0p3Av1Eng1']);
  for (let i = 1; i < memes.length; i++) assert.ok(memes[i - 1].order > memes[i].order, 'memes/ytp lists newest first');
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
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id).sort(), ['Str3yHarmon1', 'Str3yOsud1l', 'Str3yP0dsk0', 'Str3yTr3k98', 'Str3yUltr498']);
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
  openPage('http://www.youvid.com/user/EbatoriyaPlanet', 'tester');
  const clippy = makeClippy();
  const r = clippy.youvidReaction();
  assert.ok(r.text.includes('Ебатория всех впускает'));
  press(r, 'Подписаться');
  assert.strictEqual(clicked.pop(), '.yv-sub[data-channel="EbatoriyaPlanet"]');
  press(r, 'Смотреть видео канала');
  assert.strictEqual(clippy.opened[0], clippy.youvidWatchUrl(site, site.videosOf(site.channels.EbatoriyaPlanet)[0]));
  press(r, 'А у тебя есть канал');
  assert.ok(clippy.spoken[clippy.spoken.length - 1].text.includes('Rocky'));
  site.saveState({ subs: ['EbatoriyaPlanet'] });
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
  assert.strictEqual(clippy.opened[0], 'http://www.youvid.com/watch?v=i9AyI356ye4');
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

test('Стрей Подскочил keeps the StreyOsuzhdaet channel, chair jump, condemnation shout, headset hand and cover stills', () => {
  const clip = clips.find(c => c.id === 'Str3yP0dsk0');
  const v = site.video('Str3yP0dsk0');
  const S = window.PodskochilScript;
  const ch = site.channels.StreyOsuzhdaet;
  assert.ok(clip && v && S && ch && window.StraySet);
  assert.ok(Math.abs(clip.duration - 24.22) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Стрей Подскочил.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(v.channel, 'StreyOsuzhdaet');
  assert.strictEqual(v.title, 'Стрей Подскочил');
  assert.strictEqual(v.category, 'people');
  assert.strictEqual(v.chapters.length, 8);
  assert.ok(site.videosOf(ch).some(x => x.id === 'Str3yP0dsk0'));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.pose.p) && Number.isFinite(st.pose.yaw) && Number.isFinite(st.pose.pitch) && Number.isFinite(st.pose.roll), `pose ${t}`);
    assert.ok(st.chat >= 0 && st.chat <= 1, `chat ${t}`);
    assert.strictEqual(st.pose.face.split('|').length, 5);
  }
  assert.ok(clip.stage(7.0).pose.p[1] > clip.stage(1.0).pose.p[1] + 0.1, 'bolts up out of the chair around 7s');
  assert.ok(clip.stage(4.35).pose.p[2] > clip.stage(1.0).pose.p[2] + 0.1, 'leans toward the monitor at 4.35s');
  assert.strictEqual(clip.stage(6.8).face.mouth, 'gasp');
  assert.strictEqual(clip.stage(9.6).face.mouth, 'round');
  assert.strictEqual(clip.stage(11.0).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(9.6).face.eyes, 'pop');
  assert.strictEqual(clip.stage(9.6).face.gaze, -1);
  assert.ok(clip.stage(6.9).pose.hand && clip.stage(19.3).pose.hand && !clip.stage(2.0).pose.hand && !clip.stage(12.0).pose.hand);
  assert.ok(clip.stage(7.0).grade[0] > clip.stage(1.5).grade[0], 'monitor flashes brighter during the jump');
  assert.ok(clip.voiceAt(5.8) > 0.5 && clip.voiceAt(9.6) > 0.5 && clip.voiceAt(22.6) > 0.2);
  assert.ok(clip.stage(23.0).chat > clip.stage(1.0).chat);
  assert.ok(S.CHAT.some(l => l[2].includes('ПОДСКОЧИЛ KEKW')));
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Str3yP0dsk0-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Str3yP0dsk0').includes('Стрей Подскочил'));
  assert.ok(site.renderSite('http://www.youvid.com/user/StreyOsuzhdaet').includes('Стрей Подскочил'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Стрей Подскочил'));
  assert.ok(window.appIE.performSearch('стрей подскочил').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('подпрыгнул').some(r => r.url === 'http://www.youvid.com'));
});

test('Стрей Ультра Гипер Осуждает keeps the StreyOsuzhdaet channel, double condemnation salvo, monitor glow, live chat and cover stills', () => {
  const clip = clips.find(c => c.id === 'Str3yUltr498');
  const v = site.video('Str3yUltr498');
  const S = window.UltraScript;
  const ch = site.channels.StreyOsuzhdaet;
  assert.ok(clip && v && S && ch && window.StraySet);
  assert.ok(Math.abs(clip.duration - 15.95) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Стрей Ультра Гипер Осуждает.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(v.channel, 'StreyOsuzhdaet');
  assert.strictEqual(v.title, 'Стрей Ультра Гипер Осуждает');
  assert.strictEqual(v.category, 'people');
  assert.strictEqual(v.chapters.length, 7);
  assert.ok(site.videosOf(ch).some(x => x.id === 'Str3yUltr498'));
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.pose.p) && Number.isFinite(st.pose.yaw) && Number.isFinite(st.pose.pitch) && Number.isFinite(st.pose.roll), `pose ${t}`);
    assert.ok(st.chat >= 0 && st.chat <= 1, `chat ${t}`);
    assert.strictEqual(st.pose.face.split('|').length, 5);
  }
  assert.strictEqual(clip.stage(3.9).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(4.8).face.mouth, 'round');
  assert.strictEqual(clip.stage(9.9).face.mouth, 'teeth');
  assert.strictEqual(clip.stage(12.2).face.mouth, 'round');
  assert.strictEqual(clip.stage(9.8).face.eyes, 'pop');
  assert.strictEqual(clip.stage(15.5).face.gaze, -1);
  assert.ok(clip.stage(10.0).grade[0] > clip.stage(7.5).grade[0], 'monitor brightens during the second condemnation salvo');
  assert.ok(clip.voiceAt(4.30) > 0.5 && clip.voiceAt(5.30) > 0.5 && clip.voiceAt(9.40) > 0.5);
  assert.ok(clip.stage(15.0).chat > clip.stage(1.0).chat);
  assert.ok(S.CHAT.some(l => l[2].includes('УЛЬТРА ГИПЕР ОСУЖДЕНИЕ KEKW')));
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Str3yUltr498-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Str3yUltr498').includes('Стрей Ультра Гипер Осуждает'));
  assert.ok(site.renderSite('http://www.youvid.com/user/StreyOsuzhdaet').includes('Стрей Ультра Гипер Осуждает'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Стрей Ультра Гипер Осуждает'));
  assert.ok(window.appIE.performSearch('ультра гипер').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('сверхосуждение').some(r => r.url === 'http://www.youvid.com'));
});

test('Жизнь и Страдания Сиеги keeps the 19 shots, the spin, the Dota 98 death screen, the video call and the outfit changes on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'S1egaStrad4');
  const v = site.video('S1egaStrad4');
  const S = window.SiegaScript;
  const Cast = window.SiegaCast;
  assert.ok(clip && v && S && Cast && window.SiegaRoom && window.SiegaScreens);
  assert.ok(Math.abs(clip.duration - 204.43) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Жизнь и Страдания Сиеги.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Жизнь и Страдания Сиеги');
  assert.strictEqual(v.category, 'games');
  assert.strictEqual(v.chapters.length, 20);
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'S1egaStrad4'));
  assert.strictEqual(S.SHOTS.length, 19);
  for (let i = 1; i < S.SHOTS.length; i++) assert.ok(S.SHOTS[i].t > S.SHOTS[i - 1].t, `shot ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.25) {
    const st = clip.stage(t);
    if (st.kind === 'game') continue;
    const p = st.pose;
    assert.ok(finite(p.p) && finite(p.up) && finite(p.fwd), `pose ${t}`);
    const m = Cast.solve(p);
    ['head', 'wristL', 'wristR', 'elbowL', 'elbowR', 'ankleL', 'ankleR'].forEach(k => assert.ok(finite(m.pts[k]), `${k} ${t}`));
    assert.ok(m.pts.head[1] > 0.7 && m.pts.head[1] < 2.0, `head height ${t}`);
    assert.ok(Cast.EYES.includes(p.eyes) && Cast.BROWS.includes(p.brows) && Cast.MOUTHS.includes(p.mouth), `face ${t}`);
    assert.ok(['on', 'hand', 'neck', 'off'].includes(p.phones), `phones ${t}`);
  }
  assert.strictEqual(clip.stage(126.5).kind, 'game');
  assert.strictEqual(clip.stage(189).kind, 'call');
  assert.strictEqual(clip.stage(189).call.seconds, 2);
  assert.strictEqual(clip.stage(10).kind, 'cam');
  assert.strictEqual(clip.stage(24.5).camera.roll, 0);
  assert.ok(Math.abs(clip.stage(25.3).camera.roll - 96.2 * Math.PI / 180) < 0.02, 'the picture turns clockwise');
  assert.ok(Math.abs(clip.stage(27).camera.roll - Math.PI) < 1e-6, 'upside down until the cut');
  assert.strictEqual(clip.stage(28.2).camera.roll, 0);
  assert.deepStrictEqual([5, 18, 33, 75, 165, 200].map(t => clip.stage(t).pose.shirt), ['grey', 'white', 'black', 'grey', 'bulka', 'bulka']);
  assert.ok(clip.voiceAt(75) > 0.5, 'the long shout');
  assert.ok(clip.voiceAt(113) < 0.1, 'silence with the head down');
  assert.ok(window.SiegaScreens.CHAT.some(([, text]) => text.includes('(Акс) выкупается в игру!')));
  const src = ['siega-room.js', 'siega-cast.js', 'siega-screens.js', 'siega-script.js', 'siega.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('DIVANRACER') && src.includes('BedBoom') && src.includes('BULKA'));
  assert.ok(!/dxracer|betboom|baker|legion commander|spirit breaker|psntm|supa sayan/i.test(src + JSON.stringify(v)), 'real brands and players are renamed');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/S1egaStrad4-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=S1egaStrad4').includes('Жизнь и Страдания Сиеги'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Жизнь и Страдания Сиеги'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Жизнь и Страдания Сиеги'));
  assert.ok(window.appIE.performSearch('сиега').some(r => r.url === 'http://www.youvid.com'));
});

test('Кладбище телевизоров Озона keeps the 12 shots, stream overlays, camcorder HUD, the wall TV pull and the final laugh on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'Kl4dbTvOz0n');
  const v = site.video('Kl4dbTvOz0n');
  const S = window.OzonScript;
  const Cast = window.OzonCast;
  const Over = window.OzonOverlay;
  assert.ok(clip && v && S && Cast && Over && window.OzonWorld && window.OzonArt);
  assert.ok(Math.abs(clip.duration - 116.1) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Кладбище телевизоров Озона.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.deepStrictEqual(clip.cuts, [0, 13.65, 20.89, 28.86, 39.64, 50.52, 57.29, 65.93, 69.54, 73.24, 93.06, 105.62]);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Кладбище телевизоров Озона');
  assert.strictEqual(v.category, 'comedy');
  assert.strictEqual(v.chapters.length, 14);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'Kl4dbTvOz0n'));
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.cast || []).forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.45, `${c.who} joint at ${t}`));
    });
  }
  assert.deepStrictEqual([5, 16, 25, 35, 45, 53, 60, 67, 71, 80, 98, 110].map(t => clip.stage(t).set), ['old', 'box', 'tree', 'yellow', 'unbox', 'unbox', 'unbox', 'yellow', 'yellow', 'yellow', 'yellow', 'cam']);
  assert.deepStrictEqual([5, 16, 25, 35, 45, 67, 98, 110].map(t => clip.stage(t).overlay), ['goal', 'rec', 'rec', 'yellowA', null, 'yellowB', 'yellowB', 'chat']);
  assert.deepStrictEqual([45, 53, 60].map(t => clip.stage(t).zone), ['box', 'floor', 'bed']);
  assert.strictEqual(clip.stage(35).dress, 'A');
  assert.strictEqual(clip.stage(98).dress, 'C');
  assert.deepStrictEqual(clip.stage(71).cast.map(c => c.who), ['lysy', 'kirya', 'guest']);
  assert.ok(clip.stage(78).wallTv.tilt > 0.3, 'Kirya pulls the TV off the wall');
  assert.strictEqual(clip.stage(82).wallTv.screen, 'blue');
  assert.ok(clip.stage(82).cast.some(c => c.who === 'ozon'));
  assert.ok(clip.stage(88).cast.find(c => c.who === 'kirya').pose.pos[1] < 0.75, 'Kirya lands on the bed');
  assert.ok(clip.stage(95).chairM, 'the office chair flies');
  assert.ok(clip.stage(100.6).flash > 0.4 && clip.stage(99).flash === 0);
  assert.ok(clip.stage(104.8).fade < 0.4 && clip.stage(106).fade === 1);
  assert.strictEqual(clip.stage(110).cast[0].pose.outfit, 'print');
  assert.strictEqual(clip.stage(5).cast[0].pose.outfit, 'hoodie');
  assert.ok(clip.voiceAt(9.6) > 0.3 && clip.voiceAt(30) === 0);
  assert.strictEqual(S.speechAt(76).who, 'kirya');
  assert.strictEqual(S.speechAt(80).who, 'ozon');
  assert.ok(Over.CHAT.every(([, , text]) => !/пизд|бля[тд]|ебн|хуй|говн/i.test(text)));
  const src = ['ozon-art.js', 'ozon-world.js', 'ozon-cast.js', 'ozon-overlay.js', 'ozon-script.js', 'ozon.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('LJ UHD TV') && src.includes('SAMSONG') && src.includes('ДИКИЙ КАНЬОН') && src.includes('OZONI') && src.includes('НОВОГОДНИЙ СТРИМ 2000'));
  assert.ok(!/\bLG\b|samsung|tizen\b|armani|twitch|red dead|kizaru|qiwi|киви/i.test(src + JSON.stringify(v)), 'real brands are renamed');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Kl4dbTvOz0n-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Kl4dbTvOz0n').includes('Кладбище телевизоров Озона'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Кладбище телевизоров Озона'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('Кладбище телевизоров Озона'));
  assert.ok(window.appIE.performSearch('озон').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('кладбище телевизоров').some(r => r.url === 'http://www.youvid.com'));
});

test('YEGUDNAIS keeps both office walks, the headphones and briefcase, blind stripes, colleagues and the door at the end on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'YeGuDNa1s98');
  const v = site.video('YeGuDNa1s98');
  const S = window.YegudScript;
  const Cast = window.YegudCast;
  assert.ok(clip && v && S && Cast && window.YegudOffice);
  assert.ok(Math.abs(clip.duration - 12.95) < 0.02 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/YEGUDNAIS.mp3');
  assert.deepStrictEqual(clip.cuts, [0, 4.94]);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'YEGUDNAIS');
  assert.strictEqual(v.category, 'music');
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'YeGuDNa1s98'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    assert.strictEqual(st.shot, t < 4.94 ? 0 : 1, `shot ${t}`);
    const m = Cast.solve('bateman', st.bateman);
    Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > 0.04 && p[1] < 1.95, `bateman joint at ${t}`));
    assert.ok(m.pts.ankleL[1] < 0.3 && m.pts.ankleR[1] < 0.3, `feet stay low at ${t}`);
    const toCam = [st.camera.eye[0] - st.bateman.p[0], st.camera.eye[2] - st.bateman.p[2]];
    const facing = toCam[0] * st.bateman.fwd[0] + toCam[1] * st.bateman.fwd[2];
    if (t < 4.9) assert.ok(facing > 0.5, `walks toward the camera at ${t}`);
    if (t > 5.0 && t < 12.3) assert.ok(facing < -0.5, `walks away from the camera at ${t}`);
    (st.cast || []).forEach(c => {
      const mc = Cast.solve(c.who, c.pose);
      Object.values(mc.pts).forEach(p => assert.ok(finite(p) && p[1] > 0.03 && p[1] < 1.95, `${c.who} joint at ${t}`));
    });
  }
  assert.ok(Cast.LOOKS.bateman.phones && Cast.LOOKS.bateman.prop === 'briefcase' && Cast.LOOKS.bateman.coat.long);
  assert.strictEqual(clip.stage(2).bateman.case, 'R');
  const low = clip.stage(1.45).bateman.p[1], high = clip.stage(1.69).bateman.p[1];
  assert.ok(low < high - 0.02, 'head bobs down on each heel strike');
  assert.ok(clip.stage(1.0).batemanTint[0] === 1 && clip.stage(4.2).batemanTint[0] < 0.7, 'face walks into the shade before the cut');
  assert.ok(clip.stage(6.55).stripes > 0.9 && clip.stage(8.8).stripes > 0.9, 'blind stripes cross the coat twice');
  assert.strictEqual(clip.stage(2.0).stripes, 0);
  assert.ok(clip.stage(0.2).cast.length >= 3 && clip.stage(3.4).cast.length >= 3, 'colleagues around the first walk');
  assert.ok(clip.stage(10.2).cast.some(c => c.who === 'secretary') && clip.stage(10.2).cast.some(c => c.who === 'seated'));
  assert.ok(clip.stage(12.2).cast.some(c => c.who === 'grinner'));
  assert.ok(clip.stage(5.0).cast.filter(c => c.who === 'redhead').length > 1, 'the passing colleague is motion blurred');
  const end = S.batemanPos(12.95);
  assert.ok(end[0] < -0.4 && end[1] > 9.5, 'reaches the office door');
  assert.ok(clip.voiceAt(1.0) > 0.3 && clip.voiceAt(8.2) < 0.1, 'beat drops out before the second half');
  const src = ['yegud-cast.js', 'yegud-office.js', 'yegud-script.js', 'yegud.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(!/pierce|christian bale|sony|walkman/i.test(src + JSON.stringify(v)), 'no real names or brands on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/YeGuDNa1s98-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=YeGuDNa1s98').includes('YEGUDNAIS'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('YEGUDNAIS'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=music').includes('YEGUDNAIS'));
  assert.ok(window.appIE.performSearch('yegudnais').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('гуд найс').some(r => r.url === 'http://www.youvid.com'));
});

test('Кафка «Ирония драмы» keeps the HSR98 channel, the dub studio cards, the wanted poster, laser hall, clock, lift, black-and-white web, ruins, coin and the HSR98 logo', () => {
  const clip = clips.find(c => c.id === 'K4fkaIr0ny9');
  const v = site.video('K4fkaIr0ny9');
  const Cast = window.KafkaCast;
  const ch = site.channels.HSR98;
  assert.ok(clip && v && window.KafkaScript && Cast && ch);
  assert.ok(Math.abs(clip.duration - 123.78) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, "content/YouVid/Kafka's The Irony of Drama.mp3");
  assert.strictEqual(v.channel, 'HSR98');
  assert.strictEqual(v.title, 'Кафка «Ирония драмы»');
  assert.strictEqual(v.category, 'games');
  assert.ok(site.videosOf(ch).some(x => x.id === 'K4fkaIr0ny9'));
  assert.strictEqual(clip.cuts[0], 0);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.kafka) Object.values(Cast.solveKafka(st.kafka).pts).forEach(p => assert.ok(finite(p) && p[1] > -0.3 && p[1] < 6, `kafka joint at ${t}`));
    st.guards.concat(st.fg).forEach(g => Object.values(Cast.solveGuard(g).pts).forEach(p => assert.ok(finite(p), `guard joint at ${t}`)));
  }
  assert.strictEqual(clip.stage(1).front[0].tex, 'studio');
  assert.strictEqual(clip.stage(7).guards.length, 2);
  assert.ok(clip.stage(16.7).backdrop.some(l => l.tex === 'spiral'));
  assert.ok(clip.stage(27).backdrop.some(l => l.tex === 'posterBack') && clip.stage(27).front.some(l => l.tex === 'posterName'));
  assert.ok(clip.stage(31).lines.length >= 10 && clip.stage(31).guards.length >= 5, 'laser hall');
  assert.ok(clip.stage(38.5).bw && clip.stage(38.5).petals.length > 0, 'black-and-white fall keeps red petals');
  assert.strictEqual(clip.stage(51.6).set, 'clock');
  assert.strictEqual(clip.stage(66).set, 'lift');
  assert.ok(clip.stage(72.6).bw && clip.stage(72.6).shards.length > 20, 'crystal web');
  assert.strictEqual(clip.stage(89.5).set, 'ruins');
  assert.ok(clip.stage(96.25).front.some(l => l.tex === 'cardMcGuffin'));
  assert.ok(clip.stage(103.6).coin);
  assert.ok(clip.stage(110).kafka.umbrella);
  assert.ok(clip.stage(116).front.some(l => l.tex === 'hsr'));
  assert.ok(clip.stage(120).front.some(l => l.tex === 'studio'));
  let loud = 0;
  for (let t = 18.4; t < 25; t += 0.05) loud = Math.max(loud, clip.voiceAt(t));
  assert.ok(loud > 0.3 && clip.voiceAt(1) === 0);
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/K4fkaIr0ny9-${i}.png`))));
  const src = FILES.filter(f => f.includes('/kafka')).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  assert.ok(!/pancakeser|PNK|Ефремов|Павлов/.test(src + JSON.stringify(v)), 'the dub studio and the voice actors are rebranded');
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=K4fkaIr0ny9').includes('Ирония драмы'));
  assert.ok(site.renderSite('http://www.youvid.com/user/HSR98').includes('Ирония драмы'));
  assert.ok(window.appIE.performSearch('кафка').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('kafka').some(r => r.url === 'http://www.youvid.com'));
});

test('Влад Савельев картинки keeps the title card, five slides, five transitions and the thanks card on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'VladK4rt1nk');
  const v = site.video('VladK4rt1nk');
  assert.ok(clip && v);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(clip.aspect, 4 / 3);
  assert.ok(Math.abs(clip.duration - 20.32) < 0.05);
  const S = window.KartScript;
  const one = (t) => clip.stage(t).layers;
  assert.deepStrictEqual([1.0, 5.0, 8.5, 12.0, 15.0, 18.5].map(t => one(t).a), ['title', 'village', 'wall', 'road', 'car', 'anime']);
  assert.deepStrictEqual([3.8, 6.9, 10.1, 13.5, 16.7].map(t => one(t).kind), ['cross', 'wedge', 'arrow', 'iris', 'flip']);
  assert.ok(clip.stage(0.2).title.blue > 0.9 && clip.stage(2.5).title.blue === 0, 'blue intro fades into the dark title card');
  assert.ok(clip.stage(0.4).title.star > 0.5 && clip.stage(2.5).title.star === 0, 'star flare only at the start');
  assert.ok(clip.stage(0.62).title.swing < 0.2 && clip.stage(1.2).title.swing === 1, 'title swings in and settles');
  assert.strictEqual(clip.stage(16.9).thanks.alpha, 0);
  assert.strictEqual(clip.stage(18.5).thanks.alpha, 1);
  assert.ok(clip.stage(20.25).thanks.alpha < 0.2, 'thanks fades out at the end');
  assert.ok(S.crop('village', 6.5).dy > S.crop('village', 4.2).dy, 'first photo pans down');
  assert.ok(S.crop('wall', 9.5).dx < S.crop('wall', 7.5).dx, 'second photo pans left');
  assert.ok(S.crop('anime', 20).zoom > S.crop('anime', 17.2).zoom, 'last picture zooms in');
  assert.ok(S.slide('car').pillar, 'portrait photo keeps the black bars');
  assert.deepStrictEqual(clip.cuts, [4.03, 7.23, 10.47, 13.77, 17.02]);
  assert.strictEqual(v.chapters.length, 6);
  const vlad = window.KartVlad;
  assert.ok(window.KartSets && vlad && window.KartAnime);
  ['sweater', 'hoodie', 'leather', 'winter'].forEach(o => assert.ok(vlad.OUTFITS[o], o));
  const src = ['kart-script.js', 'kart-vlad.js', 'kart-sets.js', 'kart-anime.js', 'kart.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(!/bmw|бмв|windows|microsoft|movie maker|sony|playstation|tsukihime|kohaku/i.test(src + JSON.stringify(v)), 'no real names or brands on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/VladK4rt1nk-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=VladK4rt1nk').includes('Влад Савельев картинки'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Влад Савельев картинки'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Влад Савельев картинки'));
  assert.ok(window.appIE.performSearch('картинки').some(r => r.url === 'http://www.youvid.com'));
});

test("Cats in Baldur's Gate 3 are too real keeps the camp click, four dialogue shots, every line and answer menu, the scared arch and the look away on memes/ytp", () => {
  const clip = clips.find(c => c.id === 'cAtsBG3r34L');
  const v = site.video('cAtsBG3r34L');
  const S = window.GrubScript;
  const Cast = window.GrubCast;
  assert.ok(clip && v && S && Cast && window.GrubWorld && window.GrubUI);
  assert.ok(Math.abs(clip.duration - 46.43) < 0.02 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, "content/YouVid/Cats in Baldur's Gate 3 are too real.mp3");
  assert.deepStrictEqual(clip.cuts, [0, 2.633, 16.417, 21.3, 36.083]);
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, "Cats in Baldur's Gate 3 are too real");
  assert.strictEqual(v.category, 'games');
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.05) {
    const st = clip.stage(t);
    const shot = clip.cuts.filter(c => t >= c).length - 1;
    assert.strictEqual(st.shot, shot, `shot ${t}`);
    assert.strictEqual(st.kind, shot === 0 ? 'camp' : 'talk', `kind ${t}`);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    const sol = Cast.solve(st.cat);
    const head = Cast.headPoint(sol);
    assert.ok(finite(head) && head[1] > 0.15 && head[1] < 0.5, `head at ${t}`);
    sol.legs.forEach((L, i) => assert.ok(Math.abs(L.paw[13]) < 0.01, `paw ${i} on the ground at ${t}`));
    assert.ok(st.cat.jaw >= 0 && st.cat.jaw <= 1 && st.cat.blink >= 0 && st.cat.blink <= 1, `face at ${t}`);
    if (shot > 0) assert.ok(Array.isArray(st.ui.cursor) && st.ui.cursor.every(Number.isFinite), `cursor at ${t}`);
  }
  const ui = (t) => clip.stage(t).ui;
  assert.ok(ui(5).line.includes("I'm just a Cat") && !ui(5).options);
  assert.deepStrictEqual(ui(9).options, ["I'm not going to hurt you, kitty.", 'Why are you so scared?', '*Leave.*']);
  assert.strictEqual(ui(10).hover, 0);
  assert.strictEqual(ui(11.1).hover, 1);
  assert.ok(ui(12).line.includes('nosy') && !ui(12).options);
  assert.strictEqual(ui(15).options[ui(15).hover], 'May I pet you?');
  assert.ok(ui(17).line.includes("P-please don't"));
  assert.strictEqual(ui(18.8).line, '', 'the line hides before the answers come back');
  assert.strictEqual(ui(20.5).options[ui(20.5).hover], "Do you know what happened to Yenna's mother?");
  assert.ok(ui(25).line.includes('her last life'));
  assert.strictEqual(ui(34.5).line, '');
  assert.deepStrictEqual(ui(35.5).options, ['Is Yenna mistreating you?', '*Leave.*']);
  assert.ok(ui(40).line.includes('best friend'));
  assert.deepStrictEqual(ui(45).options, ['*Leave.*']);
  assert.ok(clip.voiceAt(2.85) > 0.5 && clip.voiceAt(16.8) > 0.5 && clip.voiceAt(9.5) === 0 && clip.voiceAt(45) === 0, 'voice follows the spoken lines');
  assert.ok(clip.stage(2.95).cat.jaw > 0.3 && clip.stage(9.5).cat.jaw === 0, 'the jaw moves only while Grub talks');
  assert.ok(clip.stage(16.45).cat.blink > 0.8 && clip.stage(14).cat.blink === 0);
  assert.ok(clip.stage(18).cat.arch > 0.5 && clip.stage(10).cat.arch === 0, 'scared arch on the pet question');
  const away = clip.stage(30.8).cat.head;
  assert.ok(away[0] < 0 && away[1] < 0, 'looks down and away at the mother line');
  assert.ok(clip.stage(45).cat.head[0] > 1, 'stares straight up at the end');
  assert.ok(clip.stage(40).cat.tail.lift > 1 && clip.stage(10).cat.tail.lift < 0, 'tail is up only in the last shot');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/cAtsBG3r34L-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=cAtsBG3r34L').includes("Cats in Baldur&#39;s Gate 3 are too real"));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('Cats in Baldur&#39;s Gate 3 are too real'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Cats in Baldur&#39;s Gate 3 are too real'));
  assert.ok(window.appIE.performSearch('baldur').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('bg3').some(r => r.url === 'http://www.youvid.com'));
});

test('каламбург keeps the title cards, the office host, the hut, the truck, the cartoon pilot and the radar room with their YTP effects on memes_ytp', () => {
  const clip = clips.find(c => c.id === 'Ka1amBurg98');
  const v = site.video('Ka1amBurg98');
  const S = window.KalamScript;
  const Cast = window.KalamCast;
  assert.ok(clip && v && S && Cast && window.KalamSets && window.KalamArt);
  assert.ok(Math.abs(clip.duration - 121.74) < 0.02 && clip.aspect === 4 / 3);
  assert.strictEqual(clip.audio, 'content/YouVid/каламбург.mp3');
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, 'каламбург');
  assert.strictEqual(v.category, 'comedy');
  assert.ok(site.videosOf(site.channels.memes_ytp).some(x => x.id === 'Ka1amBurg98'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  const kinds = new Set();
  for (let t = 0; t < clip.duration; t += 0.05) {
    const st = clip.stage(t);
    kinds.add(st.kind);
    if (st.camera) assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.cast || []).forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.1 && p[1] < 2.6, `${c.who} joint at ${t}`));
    });
  }
  ['title', 'bobs', 'actor', 'dtb', 'office', 'diner', 'studio', 'hut', 'rzhu', 'truck', 'kras', 'sky', 'radar'].forEach(k => assert.ok(kinds.has(k), k));
  assert.strictEqual(clip.stage(1.5).title, 'adek');
  assert.ok(!clip.stage(9.0).gum && clip.stage(9.8).gum, 'gum packs replace the pirates');
  assert.ok(clip.stage(11.5).pixel && !clip.stage(10.5).pixel, 'the photo is pixelated at the end');
  assert.ok(clip.stage(20.8).big !== undefined && clip.stage(19.95).title === 'cum' && clip.stage(18).title === 'cal');
  assert.ok(clip.stage(24.2).cast.some(c => c.who === 'waiter') && clip.stage(24.2).cast.some(c => c.who === 'host' && c.prop === 'pizza'));
  assert.strictEqual(clip.stage(28.5).cast.filter(c => c.who === 'lady').length, 6);
  assert.strictEqual(clip.stage(34.6).bug, 'mirror');
  assert.ok(clip.stage(37.2).ghost && clip.stage(40.9).sym === 'L' && clip.stage(100.0).sym === 'R');
  assert.deepStrictEqual(clip.stage(44.8).overlays, ['vas']);
  assert.ok(clip.stage(50.1).flip !== undefined && clip.stage(52.0).set.gap > 0);
  [[52.7, 'red'], [54.2, 'purple'], [61.3, 'green'], [101.5, 'psy']].forEach(([t, k]) => assert.deepStrictEqual(Array.from(clip.stage(t).look.colorM), Array.from(S.LOOKS[k].colorM), k));
  assert.ok(clip.stage(58.5).cast[0].pose.sheet === 'hand' && clip.stage(57.4).cast[0].pose.sheet === 'wall');
  assert.ok(clip.stage(68.4).set.vhs < 0.2 && clip.stage(71).set.vhs === 1, 'the tapes fall like dominoes');
  assert.ok(clip.stage(72.1).can > 0 && clip.stage(74.4).curl > 0 && clip.stage(75.5).kind === 'rzhu');
  assert.deepStrictEqual(clip.stage(80.2).overlays, ['caption']);
  assert.ok(clip.stage(79.2).cast[0].flat && clip.stage(83.3).pip, 'red silhouette and the waving inset');
  assert.ok(clip.stage(88).kind === 'truck' && clip.stage(88).bug === null && clip.stage(88).mark);
  assert.ok(clip.stage(92.6).drop < 1 && clip.stage(96.0).swirl > 0);
  assert.ok(clip.stage(99.2).wild && clip.stage(100.3).hands === 'ears' && clip.stage(104).trail.length > 40);
  assert.strictEqual(clip.stage(110.5).screen.kind, 'guy');
  assert.strictEqual(clip.stage(112.3).screen.kind, 'shatter');
  assert.deepStrictEqual(clip.stage(115).overlays, ['krutoe']);
  assert.ok(clip.stage(119).cast[0].pose.bun && clip.stage(120.5).cast.length === 0);
  assert.ok(S.speaking('host', 25) && S.speaking('driver', 89) && S.speaking('pilot', 98) && !S.speaking('host', 45));
  assert.ok(Math.max(...[24.5, 25, 25.5, 26].map(clip.voiceAt)) > 0.3 && clip.voiceAt(121.6) < 0.05);
  const src = ['kalam-art.js', 'kalam-cast.js', 'kalam-sets.js', 'kalam-script.js', 'kalam.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(!/ДТВ|ADEQ|Живчик|КрАЗ|PRIVAT|ЧИЗ|Eggman|Эггман/.test(src + JSON.stringify(v)), 'channel, studio and brand names are rebranded');
  assert.ok(src.includes('ДТБ') && src.includes('ЧИЖ') && src.includes('Живунчик') && src.includes('КрАС') && src.includes('PRIVET TV'));
  assert.ok(!/бля|пизд|хуй/i.test(JSON.stringify(v) + src), 'no profanity on screen or on the page');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Ka1amBurg98-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Ka1amBurg98').includes('каламбург'));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('каламбург'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('каламбург'));
  assert.ok(window.appIE.performSearch('каламбург').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('топинамбур').some(r => r.url === 'http://www.youvid.com'));
});

test('Гарри Поттер, если бы его снимала Валерия Гай Германика в 3D keeps the handheld shots, the owl, the diary tug, the fig instead of the finger and the Школа Хогвартс card on memes/ytp', () => {
  const clip = clips.find(c => c.id === 'H4rryG3rm4n');
  const v = site.video('H4rryG3rm4n');
  const S = window.HogwScript;
  const Cast = window.HogwCast;
  assert.ok(clip && v && S && Cast && window.HogwTrack);
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(clip.aspect, 4 / 3);
  assert.ok(Math.abs(clip.duration - 149.86) < 0.05);
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  for (let i = 1; i < S.SHOTS.length; i++) {
    assert.ok(S.SHOTS[i][0] > S.SHOTS[i - 1][0], `shot ${i} starts after the previous one`);
    assert.ok(S.SHOTS[i - 1][1] <= S.SHOTS[i][0] + 0.01, `shot ${i - 1} ends before the next one`);
  }
  assert.ok(S.SHOTS.length >= 60 && window.HogwTrack.SHOTS.length >= 50, 'the camera follows the original framing');
  const R = window.HogwSet.ROOM;
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    const c = st.camera;
    assert.ok(finite(c.eye) && finite(c.at) && Number.isFinite(c.roll), `camera ${t}`);
    assert.ok(c.eye[0] > R.rear && c.eye[0] < R.front && c.eye[2] > R.win && c.eye[2] < R.cor && c.eye[1] > 0.2 && c.eye[1] < R.h, `camera inside the classroom at ${t}`);
    st.cast.forEach(k => {
      const m = Cast.solve(k.who, k.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 2.4, `${k.who} joint at ${t}`));
    });
  }
  const at = (t) => clip.stage(t);
  const who = (t) => at(t).cast.map(c => c.who);
  const pose = (t, w) => at(t).cast.find(c => c.who === w).pose;
  assert.strictEqual(S.titleAt(1), 1);
  assert.strictEqual(S.titleAt(12), 0);
  assert.strictEqual(S.cardAt(140), 0);
  assert.strictEqual(S.cardAt(147), 1);
  assert.ok(pose(5, 'harry').hat !== false && pose(80, 'harry').hat === false, 'the sorting hat comes off at 1:10');
  assert.ok(!who(5).includes('volde') && who(12).includes('volde'), 'Voldemort walks in at 0:09');
  assert.ok(!who(30).includes('ron') && who(47).includes('ron'), 'Ron joins at the letter');
  assert.ok(at(42).props.some(p => p.item === 'owl' && p.letter), 'Hedwig brings the envelope');
  assert.ok(at(102).props.some(p => p.item === 'diary'), 'the diary is pulled between Harry and Voldemort');
  assert.ok(at(130).cast.find(c => c.who === 'volde').hold.some(h => h.item === 'diary'), 'Voldemort leaves with the diary');
  const hermY = (t) => Cast.solve('herm', pose(t, 'herm')).pts.head[1];
  assert.ok(hermY(137) < hermY(126) - 0.2, 'Hermione cries on the desk');
  assert.ok(pose(113.6, 'harry').gL === 'fig' && pose(113.6, 'harry').gR === 'fig');
  const src = ['hogw-set.js', 'hogw-cast.js', 'hogw-props.js', 'hogw-track.js', 'hogw-script.js', 'hogw.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(!/gR: 'finger'|gL: 'finger'/.test(src), 'no rude finger on screen');
  let talk = 0;
  for (let t = 14.9; t < 16.8; t += 0.05) if (S.mouthOf('volde', t) !== 'shut') talk++;
  assert.ok(talk > 8, 'Voldemort speaks «Может, выйдем?»');
  assert.strictEqual(S.mouthOf('volde', 1.5), 'shut');
  assert.ok(clip.voiceAt(1.5) > 0.2 && clip.voiceAt(148) === 0);
  assert.ok(!/бля|пизд|хуй|сук|ссан|шлюх/i.test(JSON.stringify(v)), 'the page keeps the dialogue clean');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/H4rryG3rm4n-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=H4rryG3rm4n').includes('Валерия Гай Германика'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=H4rryG3rm4n').includes('height="360"'), '4:3 video fills the player');
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('Гарри Поттер'));
  assert.ok(window.appIE.performSearch('хогвартс').some(r => r.url === 'http://www.youvid.com'));
});

test('Влад Савельев на СТС keeps the 21 shots of the intro, the gold logo, the price list, both TV reports with «*Греции» and the bra from the price list on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'Vl4dNaCTC98');
  const v = site.video('Vl4dNaCTC98');
  const S = window.StsScript;
  const Cast = window.StsCast;
  assert.ok(clip && v && S && Cast && window.StsWorld && window.StsArt && window.StsTrack);
  assert.ok(Math.abs(clip.duration - 50.085) < 0.02 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Влад Савельев на СТС, но он реально на СТС.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.deepStrictEqual(clip.cuts, [0, 1.683, 1.966, 2.2, 2.566, 3.383, 5.383, 8.783, 12.383, 16.0, 16.633, 20.066, 21.933, 23.433, 27.133, 30.633, 34.316, 36.683, 38.266, 41.833, 42.133, 45.1]);
  assert.strictEqual(S.SHOTS.length, 21);
  for (let i = 1; i < S.SHOTS.length; i++) assert.ok(S.SHOTS[i].t > S.SHOTS[i - 1].t, `shot ${i}`);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Влад Савельев на СТС, но он реально на СТС');
  assert.strictEqual(v.category, 'comedy');
  assert.strictEqual(v.chapters.length, 16);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    st.cast.forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -2 && p[1] < 2.6, `${c.who} joint at ${t}`));
      assert.ok(Cast.EYES.includes(c.pose.eyes) && Cast.MOUTHS.includes(c.pose.mouth), `${c.who} face at ${t}`);
    });
  }
  const sets = [[0.5, 'stream'], [1.8, 'street'], [2.4, 'clips'], [3.0, 'clips'], [4.2, 'pc'], [6.3, 'vlad'], [10, 'limo'], [14, 'airport'], [17.5, 'beach'], [21, 'ren'], [22.5, 'ren'], [25, 'park'], [28, 'juice'], [32, 'greece'], [35, 'sea'], [37.3, 'sea'], [40, 'towel'], [41.9, 'vladroom'], [43, 'studio'], [47, 'bra']];
  sets.forEach(([t, name]) => assert.strictEqual(clip.stage(t).set, name, `set at ${t}`));
  assert.ok(clip.stage(6.3).vlad, 'the bed fall reuses Vlad from «ложится спать»');
  assert.ok(clip.stage(35).under && !clip.stage(37.3).under, 'under water, then above it');
  assert.deepStrictEqual([0.5, 22, 32, 40, 43].map(t => clip.stage(t).overlay), ['rules', 'ren', 'donate', 'chat', 'greek']);
  assert.ok(clip.stage(22).letterbox > 0 && clip.stage(25).letterbox === 0);
  assert.ok(!clip.stage(43.5).grecii && clip.stage(44.1).grecii, '«*Греции» appears with «России»');
  assert.ok(S.lyricAt(44.1).includes('России') && S.lyricAt(10) === '');
  assert.ok(clip.stage(47).selective && clip.stage(47).cast[0].pose.outfit === 'bra');
  assert.ok(window.StsArt.RULES_LIST.includes('12) надеть лифчик на 5 мин 900р'));
  assert.deepStrictEqual([12.5, 17.5, 28, 32, 40, 47].map(t => clip.stage(t).cast[0].who), ['vlad', 'vlad', 'vlad', 'vlad', 'vlad', 'vlad']);
  assert.deepStrictEqual(clip.stage(25).cast.map(c => c.who), ['ginger', 'stripe', 'specs', 'longhair', 'vlad']);
  assert.deepStrictEqual(clip.stage(10).cast.map(c => c.who), ['party', 'beanie']);
  assert.ok(clip.stage(28).props.pack && clip.stage(2.4).props.croc && clip.stage(3.0).props.things.length === 3);
  assert.ok(clip.voiceAt(10) === 0 && clip.voiceAt(31) > 0.1, 'the song starts after the instrumental intro');
  const src = ['sts-art.js', 'sts-world.js', 'sts-cast.js', 'sts-script.js', 'sts.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('донат-пейджер') && src.includes('стрим-касса') && src.includes('ВидеоЧат 98') && src.includes('Tlife') && src.includes('Р98') && src.includes('ютвид'));
  assert.ok(!/donationalerts|streamlabs|google|tlive|рен ?тв|ren ?tv|youtube|ютуб/i.test(src + JSON.stringify(v)), 'real services and channels are renamed');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Vl4dNaCTC98-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Vl4dNaCTC98').includes('Влад Савельев на СТС'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Влад Савельев на СТС'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('Влад Савельев на СТС'));
  assert.ok(window.appIE.performSearch('стс').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('даёшь молодёжь').some(r => r.url === 'http://www.youvid.com'));
});

test('я мажу жопу вазелином keeps the 13 shots, the greased jukebox, the coin, the long dance take, the dictionary page and the guitar on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'Vaz3l1nD4dy');
  const v = site.video('Vaz3l1nD4dy');
  const S = window.VazScript;
  const Cast = window.VazCast;
  assert.ok(clip && v && S && Cast && window.VazDiner && window.VazArt);
  assert.ok(Math.abs(clip.duration - 47.81) < 0.05 && clip.aspect === 4 / 3);
  assert.strictEqual(clip.audio, 'content/YouVid/я мажу жопу вазелином.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.deepStrictEqual(clip.cuts, [0, 2.033, 4.467, 7.0, 10.533, 13.6, 23.167, 26.767, 30.233, 35.167, 41.433, 45.5, 47.367]);
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'я мажу жопу вазелином');
  assert.strictEqual(v.category, 'comedy');
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'Vaz3l1nD4dy'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.cast || []).forEach(c => {
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 3.4, `${c.who} joint at ${t}`));
    });
  }
  assert.deepStrictEqual([1, 3, 5.5, 8, 12, 18, 25, 28, 32, 37, 40, 43, 46, 47.6].map(t => clip.stage(t).name), ['wide', 'sam', 'stool', 'coin', 'girls', 'take', 'feet', 'nick', 'low', 'betty', 'betty', 'crowd', 'step', 'guitar']);
  const sitting = clip.stage(1).cast.find(c => c.who === 'hugh').pose;
  assert.ok(sitting.p[1] < 0.9 && sitting.glasses === 'shades', 'Hugh sits on the stool in dark glasses');
  assert.strictEqual(clip.stage(3.3).cast[0].pose.prop.kind, 'tube', 'Sam shows the grease he just used');
  assert.ok(clip.stage(7.5).props.some(p => p.kind === 'coin'), 'the coin flies to the jukebox');
  assert.ok(clip.stage(8.1).camera.roll > 0.3, 'the camera rolls after the coin');
  assert.ok(clip.stage(8.6).jukeLit === 0 && clip.stage(9.5).jukeLit === 1, 'the jukebox lights up after the coin drops in');
  assert.deepStrictEqual(clip.stage(11).cast.map(c => c.who).sort(), ['cindy', 'hugh', 'libby']);
  assert.strictEqual(clip.stage(21.9).cast[0].pose.prop.kind, 'history');
  assert.ok(clip.stage(37).page, 'the dictionary page fills the frame');
  assert.ok(clip.stage(40.5).cast.some(c => c.who === 'betty' && c.pose.mouth === 'scream'), 'Betty screams');
  assert.ok(clip.stage(28).cast.some(c => c.who === 'nick') && clip.stage(29.3).cast.some(c => c.who === 'carl'));
  assert.ok(clip.stage(43).cast.some(c => c.who === 'sam'), 'Sam watches from behind the counter');
  assert.ok(clip.stage(47).props.some(p => p.kind === 'guitar') && clip.stage(47.6).props.some(p => p.kind === 'guitar'));
  assert.ok(clip.voiceAt(0.45) > 0.3 && clip.voiceAt(12) === 0, 'dialogue first, then the music without vocals');
  assert.strictEqual(S.talker(3.0), 'sam');
  assert.strictEqual(S.talker(20), 'hugh');
  const src = ['vaz-art.js', 'vaz-diner.js', 'vaz-cast.js', 'vaz-script.js', 'vaz.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('ПЯТАК'), 'the TV channel bug is rebranded');
  assert.ok(!/nickelodeon|никелодеон/i.test(src + JSON.stringify(v)), 'no real TV channel brand');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Vaz3l1nD4dy-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Vaz3l1nD4dy').includes('я мажу жопу вазелином'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Vaz3l1nD4dy').includes('height="360"'), '4:3 video fills the player');
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('я мажу жопу вазелином'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('я мажу жопу вазелином'));
  assert.ok(window.appIE.performSearch('вазелин').some(r => r.url === 'http://www.youvid.com'));
});

test('When you need a buff keeps the 11 vertical shots, the six captions, the ukulele aura and the boss landing on memes/ytp', () => {
  const clip = clips.find(c => c.id === 'n33dAbUfF98');
  const v = site.video('n33dAbUfF98');
  const S = window.BuffScript;
  const Cast = window.BuffCast;
  assert.ok(clip && v && S && Cast && window.BuffHall && window.BuffArt);
  assert.ok(Math.abs(clip.duration - 23.8) < 0.02 && clip.aspect === 4 / 3);
  assert.strictEqual(clip.audio, 'content/YouVid/When you need a buff.mp3');
  assert.deepStrictEqual(clip.cuts, [0, 3.461, 5.547, 6.422, 7.382, 13.721, 15.598, 17.183, 19.06, 21.813, 22.772]);
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, 'When you need a buff');
  assert.strictEqual(v.category, 'comedy');
  assert.ok(site.videosOf(site.channels.memes_ytp).some(x => x.id === 'n33dAbUfF98'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  const who = ['knight', 'bard', 'knight', 'bard', 'bard', 'knight', 'bard', 'knight', 'bard', 'knight', 'boss'];
  for (let t = 0; t < clip.duration; t += 0.05) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    assert.strictEqual(st.who, who[st.shot], `shot ${t}`);
    ['knight', 'bard'].forEach(k => {
      if (!st[k]) return;
      const m = Cast.solve(st[k]);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > 0.03 && p[1] < 2.0, `${k} joint at ${t}`));
      assert.ok(m.pts.ankleL[1] < 0.2 && m.pts.ankleR[1] < 0.2, `${k} stands on the floor at ${t}`);
    });
    if (st.bard && t > 6.7) assert.ok(st.bard.uke && st.bard.gL === 'fret' && st.bard.gR === 'strum', `the bard plays at ${t}`);
    if (st.who === 'boss') assert.ok(st.boss && !st.knight && !st.bard && st.aura === 0, `only the boss in the last shot at ${t}`);
  }
  const line = (t) => (clip.stage(t).caption || { lines: [] }).lines.join(' ');
  assert.strictEqual(line(1.0), 'This boss looks formidable');
  assert.strictEqual(line(2.6), 'Can you help me out?');
  assert.strictEqual(line(4.3), 'Say no more');
  assert.strictEqual(line(14.6), 'What’s this yellow aura?');
  assert.strictEqual(line(16.4), 'It’s a Charisma buff');
  assert.strictEqual(line(18.3), 'What am I supposed to do with that?!');
  [0.3, 3.7, 6.0, 10.0, 20.0, 23.0].forEach(t => assert.strictEqual(line(t), '', `no caption at ${t}`));
  assert.strictEqual(clip.stage(4.3).bard.gR, 'two', 'Say no more with two fingers up');
  assert.ok(clip.stage(7.0).aura === 0 && clip.stage(8.6).aura > 0.2 && clip.stage(10.5).aura > 0.99, 'the aura grows while the bard plays');
  assert.ok(clip.stage(14.6).aura === 1 && clip.stage(22.2).aura === 1, 'the knight glows too');
  const wrist = (t) => Cast.solve(clip.stage(t).bard).pts.wristR[1];
  const strokes = [9.0, 9.1, 9.2, 9.3, 9.4].map(wrist);
  assert.ok(Math.max(...strokes) - Math.min(...strokes) > 0.03, 'the strumming hand follows the beat');
  assert.ok(clip.voiceAt(1.0) > 0 || clip.voiceAt(1.1) > 0 || clip.voiceAt(1.2) > 0, 'the knight mouths his line');
  assert.strictEqual(clip.voiceAt(11), 0, 'only the ukulele between the lines');
  assert.strictEqual(clip.stage(22.0).boss, null);
  assert.ok(clip.stage(22.7).boss, 'the boss falls into the top of the frame');
  assert.ok(clip.stage(23.0).dust > 0.5 && clip.stage(23.7).dust < clip.stage(23.0).dust, 'the dust settles after the landing');
  const src = ['buff-art.js', 'buff-cast.js', 'buff-hall.js', 'buff-script.js', 'buff.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('SINE  TIMORE'), 'the tabard carries an invented motto');
  assert.ok(!/domine|dirige|london|лондон/i.test(src + JSON.stringify(v)), 'no real coat of arms on the tabard');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/n33dAbUfF98-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=n33dAbUfF98').includes('When you need a buff'));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=n33dAbUfF98').includes('height="360"'), 'the vertical frame sits in a 4:3 player with side bars');
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('When you need a buff'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=comedy').includes('When you need a buff'));
  assert.ok(window.appIE.performSearch('бафф').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('бард с укулеле').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(!window.appIE.performSearch('бардак').some(r => r.url === 'http://www.youvid.com'), 'a mess is not a bard');
});

const src2 = () => ['fab-art.js', 'fab-cast.js', 'fab-script-2.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');

test('Team Fabulous 2 lives on the kitty0706 channel with the dark-stage intro, the RED spawn timer gags, the BLU dinner, the guitar Engineer and the kart', () => {
  const clip = clips.find(c => c.id === 'T3amFabu1s2');
  const v = site.video('T3amFabu1s2');
  const S = window.FabScript;
  const Cast = window.FabCast;
  assert.ok(clip && v && S && Cast && window.FabWorld && window.FabArt && window.FabPose && window.FabScript1);
  assert.strictEqual(clip.audio, 'content/YouVid/Team Fabulous 2.mp3');
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - S.PARTS[S.PARTS.length - 1].TO) < 1e-6 && clip.duration >= 241 && clip.duration <= 1040.5);
  assert.strictEqual(v.channel, 'kitty0706');
  assert.strictEqual(v.category, 'film');
  const ch = site.channels.kitty0706;
  assert.ok(ch && ch.name === 'kitty0706' && ch.joined === '14 апреля 1999' && ch.country === 'США' && ch.theme === 'fab');
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['T3amFabu1s2']);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  assert.ok(clip.cuts.length >= 100, 'stage 1 keeps the original cutting rhythm');
  for (let t = 0; t < clip.duration; t += 0.2) {
    const st = clip.stage(t);
    if (st.set) {
      assert.ok(window.FabWorld.BUILD[st.set], `set ${st.set} at ${t}`);
      assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    }
    (st.actors || []).forEach(a => {
      assert.ok(Cast.D[a.cls], `class ${a.cls} at ${t}`);
      const m = Cast.solve(a.cls, a.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p) && p[1] > -0.05 && p[1] < 14, `${a.cls} joint at ${t}`));
    });
    (st.cards || []).forEach(c => assert.ok(!c.tex || window.FabArt.DRAW[c.tex], `card ${c.tex} at ${t}`));
    (st.props || []).forEach(p => assert.ok(Cast.PROPS[p.kind] || Cast.GUNS[p.kind], `prop ${p.kind} at ${t}`));
  }
  assert.ok(clip.stage(5).actors.some(a => a.cls === 'engineer' && a.hat === 'cowboy' && a.gun === 'guitar'), 'the intro guitarist on the dark stage');
  assert.strictEqual(clip.stage(13).cards[0].tex, 'presents');
  assert.strictEqual(clip.stage(19).cards[0].tex, 'production');
  assert.strictEqual(clip.stage(25).cards[0].tex, 'logo');
  assert.ok(clip.stage(53).cards.some(c => c.tex === 'created'));
  assert.strictEqual(clip.stage(58).hud.timer, '59');
  assert.strictEqual(clip.stage(76.5).hud.timer, 'FISH');
  assert.strictEqual(clip.stage(86.5).hud.timer, '3.1459');
  assert.strictEqual(clip.stage(88.5).hud.team, 'blu');
  assert.strictEqual(clip.stage(100).hud.timer, 'OK');
  assert.ok(clip.stage(62).hud.bubbles.length >= 1 && clip.stage(66).hud.chat[0].includes('has left the game'));
  assert.ok(clip.stage(91).actors.some(a => a.hat === 'eyeball') && clip.stage(98.5).props.some(p => p.kind === 'ration'));
  assert.ok(clip.stage(96.3).props.some(p => p.kind === 'sandwiches') && clip.stage(97).props.some(p => p.kind === 'pizza'));
  const hero = clip.stage(154).actors[0];
  assert.ok(hero.cls === 'engineer' && hero.team === 'blu' && hero.hat === 'cowboy' && hero.robot && hero.gun === 'guitar');
  assert.ok(clip.stage(178).actors.some(a => a.hat === 'lights') && clip.stage(189).props.some(p => p.kind === 'sentry'));
  assert.ok(clip.stage(227).cards.some(c => c.tex === 'raceHud') && clip.stage(228).cards.some(c => c.tex === 'banana'));
  assert.ok(clip.stage(232).props.some(p => p.kind === 'kart') && clip.stage(234).props.some(p => p.kind === 'banana'));
  assert.ok(clip.voiceAt(124) > 0.1 && clip.voiceAt(8) === 0, 'mouths follow the voice track');
  if (window.FabScript2 && clip.duration >= 480) {
    assert.ok(clip.cuts.length >= 170, 'stage 2 keeps its cuts');
    assert.ok(clip.stage(242).cards.some(c => c.tex === 'sub_sandwich'));
    assert.ok(clip.stage(250).props.some(p => p.tex === 'vanSide') && clip.stage(263.5).actors.some(a => a.itemR === 'banana'));
    assert.ok(clip.stage(265).actors.some(a => a.itemL === 'boot'));
    assert.ok(clip.stage(280).props.some(p => p.kind === 'mushroomRed'));
    assert.ok(clip.stage(303).props.some(p => p.tex === 'polaroid'), 'a harmless kangaroo photo on the chest');
    assert.ok(clip.stage(343).cards.some(c => c.tex === 'killcam'));
    assert.ok(clip.stage(334).actors.some(a => a.hat === 'lights'));
    assert.ok(clip.stage(381).actors.some(a => a.drawOpts && a.drawOpts.additive), 'the uber glow');
    assert.ok(clip.stage(403).actors.some(a => a.hat === 'cowboy' && a.gun === 'guitar'));
    assert.ok(clip.stage(438).props.filter(p => p.tex && p.tex.startsWith('pin')).length === 3, 'three notes on the board');
    assert.ok(clip.stage(450).cards[0].live === 'cartoon');
    assert.ok(clip.stage(471).props.some(p => p.kind === 'cowboyHat'), 'the hero loses his hat');
    assert.strictEqual(clip.stage(479.8).cards[0].tex, 'intermission');
    assert.ok(!/RUNFROMTHEMINGES|4CHAN|fuzzymanboob|I.M Gay|fatty|Elliot/i.test(src2()), 'stage 2 replacements');
  }
  if (window.FabScript3 && clip.duration >= 720) {
    assert.ok(clip.cuts.length >= 250, 'stage 3 keeps its cuts');
    assert.strictEqual(clip.stage(481).cards[0].tex, 'intermission');
    assert.ok(clip.stage(486).cards.some(c => c.tex === 'dashB'), 'own console menu');
    assert.ok(clip.stage(490).cards.some(c => c.live === 'stopwatch' && c.top) && clip.stage(490).post.tv, 'the stopwatch over the TV');
    assert.ok(clip.stage(495).cards.some(c => c.live === 'gameTimer') && clip.stage(501.2).cards.some(c => c.tex === 'gameTitle'));
    assert.ok(clip.stage(504).actors.filter(a => /^civ/.test(a.look)).length >= 6, 'the mall crowd');
    assert.ok(clip.stage(514).cards.some(c => c.tex === 'sw30') && clip.stage(518).cards.some(c => c.tex === 'previously'));
    assert.ok(clip.stage(522).actors.every(a => a.drawOpts && a.drawOpts.flat), 'recap silhouettes');
    assert.ok(clip.stage(535).cards.some(c => c.tex === 'scroll') && clip.stage(541).cards.some(c => c.tex === 'impFace'));
    assert.ok(clip.stage(552.8).actors.some(a => a.look === 'assassin') && clip.stage(552.8).props.some(p => p.kind === 'fencePlank'), 'the leap with a plank');
    assert.ok(clip.stage(568.5).actors.some(a => a.itemL === 'hiddenBlade'));
    assert.ok(clip.stage(574).props.some(p => p.tex === 'engiMask'), 'the paper mask');
    assert.strictEqual(clip.stage(592.8).cards[0].live, 'checklist');
    assert.ok(clip.stage(594).cards.some(c => c.tex === 'moonDisc'), 'our own moon');
    assert.ok(clip.stage(615).props.some(p => p.kind === 'sentry3') && clip.stage(625.5).actors.some(a => a.look === 'sam' && a.hat === 'nvgDown'));
    assert.ok(clip.stage(640).props.some(p => p.kind === 'dragonBody') && clip.stage(639).actors.some(a => a.look === 'knight' && a.itemR === 'longsword'));
    assert.ok(clip.stage(658).actors.some(a => a.hat === 'hatstack') && clip.stage(670.8).props.some(p => p.tex === 'freeHats'));
    assert.ok(clip.stage(684).cards.some(c => c.tex === 'photoScore') && clip.stage(688.5).actors.some(a => a.itemR === 'sodaCup'));
    assert.ok(clip.stage(703).actors.some(a => a.hat === 'hardlights') && clip.stage(714.5).actors.some(a => a.look === 'drake' && a.itemR === 'pistol'));
    assert.ok(Math.abs(clip.stage(717).cards[0].u - 8.5) < 1, 'the list runs on');
    const s3 = ['fab-script-3.js', 'fab-art.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
    assert.ok(!/bourne|ludlum|damon|\bpsn\b|call of duty|ethan mars|ao oni|\bsopa\b|fetish|adultswim|\btits\b|\brape\b/i.test(s3), 'stage 3 replacements');
  }
  if (window.FabScript4 && clip.duration >= 960) {
    assert.ok(clip.cuts.length >= 340, 'stage 4 keeps its cuts');
    assert.ok(clip.stage(723).cards.some(c => c.live === 'checklist' && Math.floor(c.u) === 13), 'the renamed trio on the list');
    assert.ok(clip.stage(727.5).cards.some(c => c.tex === 'iris') && clip.stage(733).cards.some(c => c.tex === 'photoKill'));
    assert.ok(clip.stage(740).actors.some(a => a.hat === 'ctlHelmet'), 'control helmets');
    assert.ok(clip.stage(746).actors.some(a => a.hat === 'fedoraPress') && clip.stage(750).props.some(p => p.kind === 'robotSpider'));
    assert.ok(clip.stage(770.5).cards.some(c => c.tex === 'impHearts'));
    assert.ok(clip.stage(780.5).props.some(p => p.kind === 'moon' && p.tex === 'moonFace'), 'our own moon in 3D');
    assert.ok(clip.stage(785).cards.some(c => c.tex === 'bulletHole'));
    assert.ok(clip.stage(817).props.some(p => p.kind === 'laptop' && p.tex === 'laptopScreen'), 'a generic laptop');
    assert.ok(clip.stage(828).actors.some(a => a.hat === 'goggles'), 'the bald hero');
    assert.ok(clip.stage(839).actors.some(a => a.gun === 'eguitar') && clip.stage(839).props.filter(p => p.kind === 'speaker').length === 6);
    assert.ok(clip.stage(847).actors.some(a => a.cls === 'sniper') && clip.stage(847).actors.some(a => a.hat === 'cowboy'));
    assert.ok(clip.stage(857).props.some(p => p.tex === 'flammable') && clip.stage(864).props.some(p => p.kind === 'guitarHalfA'));
    assert.ok(clip.stage(904.5).cards.some(c => c.tex === 'impCry') && clip.stage(893).cards.some(c => c.tex === 'halftone'));
    assert.ok(clip.stage(918).fx.some(f => f.tex === 'blackHole'));
    assert.ok(clip.stage(930).cards.some(c => c.tex === 'someTime') && clip.stage(945).props.some(p => p.tex === 'lessons'));
    const s4 = fs.readFileSync(path.join(root, 'js/apps/youvid/fab-script-4.js'), 'utf8');
    assert.ok(!/edd|santa destroy|zelda|majora|deus ex|sly cooper/i.test(s4), 'stage 4 replacements');
  }
  const src = ['fab-cast.js', 'fab-art.js', 'fab-pose.js', 'fab-world.js', 'fab-script-1.js', 'fab-script-2.js', 'fab-script-3.js', 'fab-script-4.js', 'fab-script-5.js', 'fab-script.js', 'fab.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(!/mario|nintendo|minge|mw3|santa destroy|skyrim|playstation/i.test(src + JSON.stringify([v, ch])), 'no real brands on screen');
  assert.ok(!/fuck|shit|fag/i.test(src + JSON.stringify([v, ch])), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/T3amFabu1s2-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=T3amFabu1s2').includes('Team Fabulous 2'));
  assert.ok(site.renderSite('http://www.youvid.com/user/kitty0706').includes('yv-theme-fab'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=film').includes('Team Fabulous 2'));
  assert.ok(window.appIE.performSearch('team fabulous').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('kitty0706').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Heavy lives on the new Valve channel with the title card, the box, the long take, the laugh, the bullet, the battle, the team and The Orange Box', () => {
  const clip = clips.find(c => c.id === 'M33tTh3H3vy');
  const v = site.video('M33tTh3H3vy');
  const S = window.MeetScript;
  assert.ok(clip && v && S && window.MeetHeavy && window.MeetFx && window.MeetProps && window.MeetSets && window.MeetArt && window.MeetVoice);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Heavy.mp3');
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 88.84) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ch = site.channels.Valve;
  assert.ok(ch && ch.name === 'Valve' && ch.joined === '13 ноября 1999' && ch.country === 'США' && ch.theme === 'valve' && ch.site === 'www.valvesoftware.com');
  assert.ok(site.videosOf(ch).some(x => x.id === 'M33tTh3H3vy'));
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.heavy) Object.values(st.heavy.m.pts).forEach(p => assert.ok(finite(p), `heavy joint at ${t}`));
    if (st.face) Object.values(st.face).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `face at ${t}`));
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  ['black', 'title', 'box', 'intro', 'laughA', 'laughB', 'laughC', 'touched', 'outsmart', 'battleA', 'flash', 'battleB', 'endA', 'endB', 'endC', 'logoA', 'logoB', 'orange'].forEach(k => assert.ok(shots.has(k), k));
  assert.strictEqual(clip.stage(2).cards[0].tex, 'title');
  assert.ok(clip.stage(6).props.some(p => p.kind === 'box'), 'the gun comes out of the box');
  assert.ok(clip.stage(64.8).props.some(p => p.kind === 'round'), 'the bullet');
  assert.ok(clip.stage(67.5).heavy.gun.fire, 'Sasha fires');
  assert.ok(clip.stage(72).actors.length >= 8 && clip.stage(72).actors.every(a => a.team === 'blu'));
  assert.ok(clip.stage(82).actors.length === 8 && clip.stage(82).actors.every(a => a.team === 'red'));
  assert.ok(clip.stage(83.5).logo.emblem === 0 && clip.stage(84.5).logo.emblem === 1, 'the emblem lands at 83.9');
  assert.strictEqual(clip.stage(87).cards[0].tex, 'orange');
  assert.ok(clip.voiceAt(11.5) > 0.1 && clip.voiceAt(3) === 0 && clip.voiceAt(48.2) > 0.2, 'lips follow the voice');
  const laugh = clip.stage(37).face;
  assert.ok(laugh.smile > 0.8 && laugh.lidU < 0.3, 'the laugh squints');
  assert.ok(clip.stage(47.5).face.browDown > 0.9, 'who touched my gun');
  const src = ['mth-fx.js', 'mth-art.js', 'mth-heavy.js', 'mth-props.js', 'mth-sets.js', 'mth-script.js', 'mth.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('© 1999 Valve Corporation') && !/2007/.test(src), 'dates on screen are 1999');
  assert.ok(!/fuck|shit/i.test(src + JSON.stringify([v, ch])), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3H3vy-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3H3vy').includes('Meet the Heavy'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('yv-theme-valve'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Heavy'));
  assert.ok(window.appIE.performSearch('meet the heavy').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('пулемётчик').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Soldier lives on the Valve channel with the BLU intro, the title card, the lecture to the helmets, the battle, the grenades, the rocket jump, the zoo line, the heads on the gate, the team and The Orange Box', () => {
  const clip = clips.find(c => c.id === 'M33tTh3S0ld');
  const v = site.video('M33tTh3S0ld');
  const S = window.MtsScript;
  assert.ok(clip && v && S && window.MeetSoldier && window.MtsProps && window.MtsSets && window.MtsArt && window.MtsVoice && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Soldier.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 86.84) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ch = site.channels.Valve;
  const ids = site.videosOf(ch).map(x => x.id);
  assert.ok(ids.includes('M33tTh3S0ld') && ids.includes('M33tTh3H3vy'));
  assert.ok(ids.indexOf('M33tTh3S0ld') < ids.indexOf('M33tTh3H3vy'), 'the newer video comes first on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.sol) Object.values(st.sol.m.pts).forEach(p => assert.ok(finite(p), `soldier joint at ${t}`));
    if (st.face) Object.values(st.face).forEach(x => assert.ok(Number.isFinite(x), `face at ${t}`));
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  ['black', 'pyro', 'crates', 'hill', 'heavyRun', 'title', 'speech', 'charge', 'alley', 'crouch', 'boom', 'run', 'fire', 'reload', 'heavyPost', 'wide', 'grenades', 'away', 'flash', 'pipe', 'tank', 'jump', 'land', 'fire2', 'spy', 'speech2', 'reveal', 'close', 'lineupA', 'lineupB', 'lineupC', 'logo', 'poke', 'orange'].forEach(k => assert.ok(shots.has(k), k));
  assert.strictEqual(clip.stage(12).cards[0].tex, 'title');
  assert.ok(clip.stage(2.5).actors.some(a => a.cls === 'pyro' && a.team === 'blu' && a.gun === 'flamer'), 'BLU Pyro opens the video');
  assert.ok(clip.stage(20).heads.length === 9 && clip.stage(75).heads.length === 9, 'nine heads in helmets on the gate');
  assert.ok(clip.stage(32).sol.weapon.kind === 'shovel' && clip.stage(34.5).sol.weapon.kind === 'shotgun' && clip.stage(40).sol.weapon.kind === 'launcher');
  assert.ok(clip.stage(50.5).sol.grenades.every(g => g.M && g.tether), 'the grenades stay tied to the strap');
  assert.ok(clip.stage(60.6).sol.m.pts.pelvis[1] > 3, 'the rocket jump lifts him off the pipe');
  assert.ok(clip.stage(80).actors.length === 8 && clip.stage(80).actors.every(a => a.team === 'red'));
  assert.ok(clip.stage(79.9).logo.emblem === 0 && clip.stage(81).logo.emblem === 1, 'the emblem lands at 80.3');
  assert.ok(clip.stage(82.5).fallen, 'the fallen head in the last gag');
  assert.strictEqual(clip.stage(84).cards[0].tex, 'orange');
  assert.ok(clip.stage(86.8).fade < 0.1, 'The Orange Box fades out');
  assert.ok(clip.voiceAt(15) > 0.1 && clip.voiceAt(5) === 0 && clip.voiceAt(70.5) > 0.1 && clip.voiceAt(82.2) > 0.1, 'lips follow the voice');
  assert.ok(clip.stage(28.5).face.smile > 0.8, 'he laughs at the ring of honor');
  assert.ok(clip.stage(32).face.jaw > 0.8, 'the charge scream');
  const src = ['mts-art.js', 'mts-soldier.js', 'mts-props.js', 'mts-sets.js', 'mts-script.js', 'mts.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && !/2007/.test(src), 'title card text, dates on screen are 1999');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify([v, ch])), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3S0ld-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3S0ld').includes('Meet the Soldier'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Soldier'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Soldier'));
  assert.ok(window.appIE.performSearch('meet the soldier').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('сунь-цзы').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Engineer plays the guitar by the truck on the Valve channel: the title card, the beer, the sentries, the kill counter, the BLU attack, the team and The Orange Box', () => {
  const clip = clips.find(c => c.id === 'M33tTh3Eng1');
  const v = site.video('M33tTh3Eng1');
  const S = window.EngScript;
  assert.ok(clip && v && S && window.MeetEngineer && window.EngProps && window.EngSets && window.EngArt && window.EngVoice && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Engineer.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 86.93) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const valveIds = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(valveIds.indexOf('M33tTh3Eng1') < valveIds.indexOf('M33tTh3S0ld'), 'the Engineer comes after the Soldier on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.eng) Object.values(st.eng.m.pts).forEach(p => assert.ok(finite(p), `engineer joint at ${t}`));
    if (st.face) Object.values(st.face).forEach(x => assert.ok(Number.isFinite(x), `face at ${t}`));
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  ['black', 'title', 'play', 'talkA', 'wide1', 'low', 'sentry1', 'talkB', 'sentry2', 'talkC', 'wide2', 'talkD', 'wide3', 'ecu', 'battle1', 'battle2', 'sil', 'endA', 'endB', 'endC', 'logoA', 'logoB', 'orange'].forEach(k => assert.ok(shots.has(k), k));
  assert.strictEqual(clip.stage(2.5).kind, 'title');
  assert.ok(clip.stage(6).eng.guitar && clip.stage(6).eng.hands.R.pose === 'strum', 'he strums the guitar');
  assert.ok(clip.stage(27).eng.bottle !== S.PLACES.bottle && clip.stage(27).face.round > 0.5, 'a sip of Blu Streak');
  assert.strictEqual(clip.stage(23.4).eng.hands.R.pose, 'wave');
  assert.ok(S.counterValue(6) === 209 && Math.round(S.counterValue(31)) === 210 && Math.round(S.counterValue(58)) === 214, 'the kill counter ticks');
  assert.ok(clip.stage(38.9).flashes.length && clip.stage(42.5).flashes.length && clip.stage(62.25).flashes.length, 'the sentries fire');
  assert.ok(clip.stage(48.8).rockets.length > 0, 'rockets over the truck');
  assert.ok(clip.stage(70.5).actors.every(a => a.team === 'blu') && clip.stage(76).actors.every(a => a.flat), 'BLU attack, then silhouettes');
  const team = clip.stage(80);
  assert.ok(team.eng.wrench && team.heavy && team.actors.length === 7 && team.actors.every(a => a.team === 'red' && a.cls !== 'engineer'), 'the team lineup with our own Engineer');
  assert.ok(clip.stage(81.5).logo.emblem === 0 && clip.stage(82.5).logo.emblem === 1, 'the emblem lands at 82.0');
  assert.strictEqual(clip.stage(85).tex, 'orange');
  assert.ok(clip.voiceAt(10.3) > 0.1 && clip.voiceAt(3) === 0 && clip.voiceAt(50.5) > 0.1, 'lips follow the voice');
  assert.ok(S.beatPhase(10).i > 0, 'strums follow the guitar beats');
  const src = ['mte-engineer.js', 'mte-art.js', 'mte-props.js', 'mte-sets.js', 'mte-script.js', 'mte.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && !/2007/.test(src), 'title card text, dates on screen are 1999');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3Eng1-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3Eng1').includes('Meet the Engineer'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Engineer'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Engineer'));
  assert.ok(window.appIE.performSearch('meet the engineer').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('турель').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Demoman jumps out of the burning tunnel on the Valve channel: the title card, the workbench and the bottle, the grenades rolling to the sentry, the sticky trap at the door, the gibs under the radio tower, the team and The Orange Box', () => {
  const clip = clips.find(c => c.id === 'M33tTh3D3mo');
  const v = site.video('M33tTh3D3mo');
  const S = window.DemoScript;
  assert.ok(clip && v && S && window.MeetDemoman && window.DemoProps && window.DemoSets && window.DemoArt && window.DemoVoice && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Demoman.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 105.16) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3D3mo') >= 0 && ids.indexOf('M33tTh3D3mo') < ids.indexOf('M33tTh3Eng1'), 'the Demoman comes after the Engineer on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.demo) Object.values(st.demo.m.pts).forEach(p => assert.ok(finite(p), `demoman joint at ${t}`));
    if (st.face) Object.values(st.face).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `face at ${t}`));
    if (st.bluHeavy) Object.values(st.bluHeavy.m.pts).forEach(p => assert.ok(finite(p), `blu heavy at ${t}`));
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  assert.strictEqual(clip.stage(2.5).kind, 'title');
  assert.ok(clip.stage(5.3).fires.length > 0 && clip.stage(8).booms.length > 0, 'the fire chases him out of the tunnel');
  assert.ok(clip.stage(12).bench && clip.stage(12).bottle, 'the workbench and the bottle');
  assert.ok(clip.stage(40).face.round > 0.5, 'a swig from the bottle');
  assert.strictEqual(clip.stage(17).demo.gun.kind, 'launcher');
  assert.strictEqual(clip.stage(79.6).pov.M.length, 16, 'the sticky launcher in his hand');
  assert.ok(clip.stage(38).sentry.team === 'blu' && clip.stage(41.6).sentryFire, 'the BLU sentry fires');
  assert.ok(clip.stage(46.5).pipes.length === 3 && clip.stage(49).sentry.broken, 'the grenades roll to the sentry and it goes up');
  assert.ok(clip.stage(70).bluHeavy && clip.stage(84.5).bluHeavy.face.browUp > 0.5, 'the BLU Heavy grins, then worries');
  assert.ok(clip.stage(85.7).stickies.length >= 3, 'stickies on the door');
  assert.ok(clip.stage(88).booms.length > 0 && clip.stage(90).gibs.length > 0, 'the trap goes off and the gibs rain down');
  const team = clip.stage(97.8);
  assert.ok(team.kind === 'lineup' && team.heavy && team.actors.every(a => a.team === 'red' && a.cls !== 'demo'), 'the team lineup with our own Demoman');
  assert.ok(clip.stage(99.9).logo.emblem === 0 && clip.stage(100.5).logo.emblem === 1, 'the emblem lands at 100.3');
  assert.strictEqual(clip.stage(103).tex, 'orange');
  assert.ok(clip.stage(105.1).fade < 0.2, 'The Orange Box fades out');
  assert.ok(clip.voiceAt(12) > 0.1 && clip.voiceAt(3) === 0 && clip.voiceAt(55) > 0.1 && clip.voiceAt(94) > 0.1, 'lips follow the voice');
  assert.ok(clip.stage(96.3).face.jaw > 0.9, 'in hell!');
  const src = ['mtd-demoman.js', 'mtd-art.js', 'mtd-props.js', 'mtd-sets.js', 'mtd-script.js', 'mtd.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && src.includes('nerfing without notice') && !/2007|2008/.test(src), 'title card and disclaimer text, dates on screen are 1999');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3D3mo-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3D3mo').includes('Meet the Demoman'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Demoman'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Demoman'));
  assert.ok(window.appIE.performSearch('meet the demoman').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('подрывник').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Scout runs from the RED respawn to his own poster on the Valve channel: the gate, BLU in the windows, the rail yard, the double jump, the hangar, the talk, the BLU Heavy with the sandwich, the bat, the team, the sandwich at the end and the cards', () => {
  const clip = clips.find(c => c.id === 'M33tTh3Sc0t');
  const v = site.video('M33tTh3Sc0t');
  const S = window.MscScript;
  assert.ok(clip && v && S && window.MeetScout && window.MscProps && window.MscSets && window.MscArt && window.MscVoice && window.MscShots && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Scout.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 94.73) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3Sc0t') >= 0 && ids.indexOf('M33tTh3Sc0t') < ids.indexOf('M33tTh3Eng1'), 'the Scout comes after the Engineer on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.scout) Object.values(st.scout.m.pts).forEach(p => assert.ok(finite(p), `scout joint at ${t}`));
    if (st.heavy) Object.values(st.heavy.m.pts).forEach(p => assert.ok(finite(p), `heavy joint at ${t}`));
    [st.face, st.heavyFace].forEach(f => { if (f) Object.values(f).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `face at ${t}`)); });
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  assert.ok(S.doorY(2) < 0.05 && S.doorY(5.1) > 1.2, 'the respawn gate rises');
  assert.ok(clip.stage(7.2).actors.some(a => a.team === 'blu' && a.cls === 'sniper'), 'the BLU Sniper in the window');
  assert.ok(clip.stage(10).props.some(p => p.kind === 'sentry'), 'the sentry on the ledge');
  assert.ok(clip.stage(23.5).scout.m.pts.pelvis[1] > 3, 'the double jump over the roof');
  assert.ok(clip.stage(26.9).flashes.length > 0 && clip.stage(26.9).scout.gun, 'the scattergun fires in the hangar');
  assert.strictEqual(clip.stage(36.2).scout.hands.L.pose, 'flat', 'praying hands before the talk');
  assert.ok(clip.stage(42).heavy && clip.stage(42).props.some(p => p.kind === 'sandwich'), 'the BLU Heavy eats his sandwich');
  assert.ok(clip.stage(52).scout.bat && clip.stage(52).heavyFace.jaw > 0.5, 'the bat at his throat');
  assert.strictEqual(clip.stage(54.5).scout.hands.R.pose, 'fist', 'the flex');
  assert.ok(clip.stage(64).scout.bat, 'the bat swing');
  const team = clip.stage(71);
  assert.ok(team.kind === 'lineup' && team.heavy && team.scout.bat && team.actors.every(a => a.team === 'red' && a.cls !== 'scout'), 'the team lineup with our own Scout');
  assert.ok(clip.stage(73.3).logo.emblem === 0 && clip.stage(74.0).logo.emblem === 1, 'the emblem lands at 73.6');
  const end = clip.stage(80);
  assert.ok(end.heavy && end.props.some(p => p.kind === 'sandwich') && clip.stage(77.2).fade > 0.5, 'the Scout sits on the Heavy with his sandwich');
  assert.strictEqual(clip.stage(86).cards[0].tex, 'retail');
  assert.strictEqual(clip.stage(90).cards[0].tex, 'boxes');
  assert.strictEqual(clip.stage(92.5).cards[0].tex, 'valve');
  assert.ok(clip.voiceAt(37.5) > 0.1 && clip.voiceAt(5) === 0 && clip.voiceAt(60.3) > 0.1, 'lips follow the voice');
  const src = ['msc-scout.js', 'msc-art.js', 'msc-props.js', 'msc-sets.js', 'msc-shots.js', 'msc-act.js', 'msc-talk.js', 'msc-script.js', 'msc.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && src.includes('© 1999 Valve Corporation') && !/2007|2008/.test(src), 'poster text, dates on screen are 1999');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3Sc0t-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3Sc0t').includes('Meet the Scout'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Scout'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Scout'));
  assert.ok(window.appIE.performSearch('meet the scout').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('сила природы').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Sniper drives his van through the desert on the Valve channel: the bobblehead, the title card, the mirror with the BLU photos, the scope, the call to his dad, the tower, the coffee, the Spy and the kukri, the casing against the sun, the team, the call home and the cards', () => {
  const clip = clips.find(c => c.id === 'M33tTh3Sn1p');
  const v = site.video('M33tTh3Sn1p');
  const S = window.MsnScript;
  assert.ok(clip && v && S && window.MeetSniper && window.MsnProps && window.MsnSets && window.MsnArt && window.MsnVoice && window.MsnShots && window.MsnAct1 && window.MsnAct2 && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Sniper.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 100.07) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3Sn1p') >= 0 && ids.indexOf('M33tTh3Sn1p') < ids.indexOf('M33tTh3Sc0t'), 'the Sniper comes after the Scout on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.sniper) Object.values(st.sniper.m.pts).forEach(p => assert.ok(finite(p), `sniper joint at ${t}`));
    if (st.heavy) Object.values(st.heavy.m.pts).forEach(p => assert.ok(finite(p), `heavy joint at ${t}`));
    [st.face, st.heavyFace].forEach(f => { if (f) Object.values(f).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `face at ${t}`)); });
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
    (st.props || []).forEach(p => { if (p.M) assert.ok(Array.from(p.M).every(Number.isFinite), `${p.kind} at ${t}`); });
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  assert.ok(clip.stage(3.6).props.some(p => p.kind === 'van') && clip.stage(0.9).fade > 0, 'the van drives past the camera');
  assert.ok(Math.abs(clip.stage(8.8).props.find(p => p.kind === 'bobble').nod[2]) > 0.1 && clip.stage(8.6).props.some(p => p.kind === 'hand'), 'a finger flicks the bobblehead');
  assert.strictEqual(clip.stage(12).cards[0].tex, 'title');
  assert.ok(clip.stage(15).sniper && clip.stage(15).props.some(p => p.kind === 'wheel'), 'he drives the van');
  assert.ok(clip.stage(24).mirror && clip.stage(24).sniper.opts.noHat && clip.stage(24).props.some(p => p.kind === 'toothbrush'), 'teeth in front of the mirror without the hat');
  assert.ok(clip.stage(29.2).scope && clip.stage(29.2).heavy && clip.stage(29.6).fx.blood.length > 0, 'the BLU Heavy laughs in the scope');
  assert.ok(clip.stage(38.5).props.some(p => p.kind === 'handset') && clip.stage(38.5).props.some(p => p.kind === 'cord'), 'the call to his dad');
  assert.ok(clip.stage(50).sniper.m.pts.pelvis[1] > 5, 'he climbs the tower');
  assert.ok(clip.stage(57).props.some(p => p.kind === 'mug') && clip.stage(57).props.filter(p => p.kind === 'jar').length >= 2, 'coffee and the jars in the hut');
  assert.ok(clip.stage(62).actors.some(a => a.cls === 'spy' && a.team === 'blu') && clip.stage(62).props.some(p => p.kind === 'kukri' && p.bloody), 'the Spy with the kukri');
  assert.ok(clip.stage(71.5).sniper.kukri && clip.stage(71.5).actors.some(a => a.cls === 'spy'), 'the kukri over the Spy');
  assert.ok(clip.stage(72.5).actors.some(a => a.cls === 'medic') && clip.stage(72.5).fx.beams.length > 0, 'the BLU Medic heals in the scope');
  assert.ok(clip.stage(74.2).actors.some(a => a.cls === 'soldier') && clip.stage(75.2).actors.some(a => a.cls === 'pyro'), 'the Soldier and the Pyro in the scope');
  assert.ok(clip.stage(76).props.some(p => p.kind === 'casing') && clip.stage(79.1).white > 0, 'the casing flies, the shot flashes');
  const team = clip.stage(81);
  assert.ok(team.kind === 'lineup' && team.heavy && team.sniper.rifle && team.actors.every(a => a.team === 'red' && a.cls !== 'sniper'), 'the team lineup with our own Sniper');
  assert.ok(clip.stage(84.0).logo.emblem === 0 && clip.stage(84.6).logo.emblem === 1, 'the emblem lands at 84.2');
  assert.ok(clip.stage(88).set === 'town' && clip.stage(88).props.some(p => p.kind === 'phoneBox'), 'the call home at the end');
  assert.strictEqual(clip.stage(91).cards[0].tex, 'retail');
  assert.strictEqual(clip.stage(95).cards[0].tex, 'boxes');
  assert.strictEqual(clip.stage(98).cards[0].tex, 'valve');
  assert.strictEqual(clip.stage(99.6).kind, 'black');
  assert.ok(clip.voiceAt(15) > 0.1 && clip.voiceAt(5) === 0 && clip.voiceAt(88.5) > 0.1, 'lips follow the voice');
  const src = ['msn-sniper.js', 'msn-art.js', 'msn-props.js', 'msn-sets.js', 'msn-shots.js', 'msn-act1.js', 'msn-act2.js', 'msn-script.js', 'msn.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && !/2007|2008/.test(src) && !window.MsnArt.DRAW.valve && window.MscArt.DRAW.valve, 'poster text, the Valve card with 1999 comes from the Scout');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3Sn1p-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3Sn1p').includes('Meet the Sniper'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Sniper'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Sniper'));
  assert.ok(window.appIE.performSearch('meet the sniper').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('кукри').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Spy raises the alarm in the BLU base on the Valve channel: the bell, the code 1111, the Heavy through the door, the BLU Spy with the Sniper, the photos, the sapped sentry, the hut, the Medic double, the shot, the RED Spy behind them, the team and the cards', () => {
  const clip = clips.find(c => c.id === 'M33tTh3Sp1y');
  const v = site.video('M33tTh3Sp1y');
  const S = window.MspScript;
  assert.ok(clip && v && S && window.MeetSpy && window.MspProps && window.MspSets && window.MspArt && window.MspVoice && window.MspShots && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Spy.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 199.8) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3Sp1y') >= 0 && ids.indexOf('M33tTh3Sp1y') < ids.indexOf('M33tTh3Sc0t'), 'the Spy comes after the Scout on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  const checkStage = (st, t) => {
    if (st.kind !== '3d' && st.kind !== 'lineup') return;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    (st.heroes || []).forEach(h => {
      Object.values(h.st.m.pts).forEach(p => assert.ok(finite(p), `${h.who} joint at ${t}`));
      Object.values(h.face || {}).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `${h.who} face at ${t}`));
    });
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
    if (st.dissolve) checkStage(st.dissolve.to, t);
  };
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    checkStage(st, t);
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  const kinds = (st) => (st.props || []).map(p => p.kind);
  const who = (st) => (st.heroes || []).map(h => h.who + ':' + (h.team || 'blu'));
  const guests = (st) => (st.actors || []).map(a => a.cls + ':' + a.team).concat(who(st));
  assert.ok(kinds(clip.stage(1.0)).includes('bell'), 'the alarm bell rings');
  assert.strictEqual(clip.stage(2.0).shot, 'signs');
  assert.strictEqual(clip.stage(16.3).shot, 'keypad', 'the Soldier types the code');
  assert.ok(clip.stage(22.1).door.M && clip.stage(22.1).door.debris.length > 0, 'the Heavy breaks the door');
  assert.ok(kinds(clip.stage(25)).includes('briefcase') && who(clip.stage(25)).includes('scout:blu'), 'the Scout leans on the briefcase');
  const entry = clip.stage(29.5);
  assert.ok(who(entry).includes('spy:blu') && guests(entry).includes('sniper:blu'), 'the BLU Spy brings the Sniper');
  assert.strictEqual(clip.stage(32).cards[0].tex, 'title');
  assert.ok(kinds(clip.stage(49)).includes('knife'), 'the knife in his back');
  assert.ok(/^photo/.test(clip.stage(75.5).cards[0].tex), 'the photos');
  assert.ok(clip.stage(91.8).heroes.some(h => h.who === 'spy' && h.cig), 'the cigarette is lit');
  const sap = clip.stage(101.8);
  assert.ok(sap.sparks.length > 0 && kinds(sap).includes('sentry') && kinds(sap).includes('sapper'), 'the sentry is sapped');
  assert.ok(guests(clip.stage(115.8)).includes('sniper:blu'), 'the BLU Sniper in his hut');
  assert.ok(guests(clip.stage(126.2)).includes('medic:blu'), 'the BLU Medic');
  assert.ok(clip.stage(142.9).heroes.some(h => h.who === 'spy' && h.opts && h.opts.noHead) && clip.stage(142.9).blood.length > 0, 'the Soldier shoots');
  const reveal = clip.stage(172.5);
  assert.ok(who(reveal).includes('spy:red') && kinds(reveal).includes('knife') && who(clip.stage(168.5)).includes('scout:blu'), 'the Scout was the RED Spy');
  const team = clip.stage(173.4);
  assert.ok(team.kind === 'lineup' && who(team).includes('spy:red') && who(team).includes('heavy:red') && team.actors.every(a => a.team === 'red' && a.cls !== 'spy'), 'the team lineup with our own Spy');
  assert.ok(clip.stage(176.3).logo.emblem === 0 && clip.stage(176.7).logo.emblem === 1, 'the emblem lands at 176.56');
  assert.ok(who(clip.stage(188)).includes('spy:red') && kinds(clip.stage(188)).includes('photo'), 'the RED Spy keeps the photo');
  assert.strictEqual(clip.stage(194).cards[0].tex, 'retail');
  assert.strictEqual(clip.stage(198).cards[0].tex, 'valve');
  assert.ok(clip.voiceAt(37) > 0.1 && clip.voiceAt(5) === 0 && clip.voiceAt(189) > 0.05, 'lips follow the voice');
  const src = ['msp-spy.js', 'msp-art.js', 'msp-props.js', 'msp-sets.js', 'msp-shots.js', 'msp-act1.js', 'msp-act2.js', 'msp-act3.js', 'msp-act4.js', 'msp-script.js', 'msp.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && !/2008|2009/.test(src), 'title card text, dates on screen are 1999');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3Sp1y-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3Sp1y').includes('Meet the Spy'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Spy'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Spy'));
  assert.ok(window.appIE.performSearch('meet the spy').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('шпион').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Pyro on the Valve channel: the burnt title, the three interviews, the pilot light, the fire, Pyroland through the mask with rainbows, lollipops and cherubs, the real fire in between, the team, the helmet and the Source Filmmaker card', () => {
  const clip = clips.find(c => c.id === 'M33tTh3Pyr0');
  const v = site.video('M33tTh3Pyr0');
  const S = window.MpyScript;
  assert.ok(clip && v && S && window.MeetPyro && window.MpyProps && window.MpySets && window.MpyArt && window.MpyVoice && window.MpyShots && window.MpyHeads && window.MpyBaby && window.MpyReal && window.MpyLand && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Pyro.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 151.37) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3Pyr0') >= 0 && ids.indexOf('M33tTh3Pyr0') < ids.indexOf('M33tTh3Sc0t'), 'the Pyro closes the series, so it comes first on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  const joints = (m, label, t) => Object.values(m.pts).forEach(p => assert.ok(finite(p), `${label} joint at ${t}`));
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    if (st.pyro) joints(st.pyro.m, 'pyro', t);
    if (st.heavy) joints(st.heavy.m, 'heavy', t);
    if (st.scout) joints(st.scout.m, 'scout', t);
    if (st.demo) joints(st.demo.m, 'demoman', t);
    if (st.soldier) joints(st.soldier.m, 'soldier', t);
    (st.babies || []).forEach(b => assert.ok(Array.from(b.st.head).every(Number.isFinite), `${b.kind} cherub at ${t}`));
    (st.guests || []).forEach(g => assert.ok(Array.from(g.H).every(Number.isFinite), `${g.kind} head at ${t}`));
    [st.heavyFace, st.scoutFace].forEach(f => { if (f) Object.values(f).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `face at ${t}`)); });
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
    (st.rainbows || []).forEach(rb => rb.pts.forEach(p => assert.ok(finite(p), `rainbow at ${t}`)));
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  assert.strictEqual(clip.stage(3).cards[0].tex, 'title');
  assert.ok(clip.stage(5.9).burn && clip.stage(5.9).burn.r > clip.stage(5.2).burn.r, 'the title burns from the letters');
  assert.ok(clip.stage(8.5).pyro.weapon.kind === 'flamer' && clip.stage(8.5).props.some(p => p.kind === 'glasses'), 'the walk past the broken glasses');
  assert.ok(clip.stage(15).heavy && clip.stage(12.6).heavyFace.jaw > 0.2, 'the Heavy speaks in the dark');
  assert.ok(clip.stage(29.5).scout && clip.stage(29.5).scout.hands.R.pose === 'grip', 'the Scout pulls at the microphone');
  assert.ok(clip.stage(34).pilots.length > 0 && clip.stage(34).props.some(p => p.kind === 'flamer'), 'the pilot light at the door');
  assert.ok(clip.stage(40).guests[0].kind === 'spy' && clip.stage(40).guests[0].team === 'red' && clip.stage(40).props.some(p => p.kind === 'cig'), 'the Spy smokes');
  assert.ok(clip.stage(46).streams.length > 0 && clip.stage(46).fires.length > 4, 'the town burns');
  assert.ok(clip.stage(54.5).lens && clip.stage(54.5).land, 'Pyroland through the lenses');
  assert.ok(clip.stage(57).land && clip.stage(57).pyro.weapon.kind === 'rainblower' && clip.stage(57).rainbows.length > 0, 'the rainbow over the valley');
  assert.ok(clip.stage(64).babies.some(b => b.kind === 'heavy'), 'the Heavy cherub on the cookie path');
  assert.strictEqual(clip.stage(66.5).pyro.weapon.kind, 'lolli');
  assert.ok(!clip.stage(76).land && clip.stage(76).heavy.team === 'blu' && clip.stage(76).pyro.weapon.kind === 'axe', 'what really happened to the BLU Heavy');
  assert.ok(clip.stage(86).babies.some(b => b.kind === 'scout') && clip.stage(86).bubbles.length > 10, 'the Scout cherub in the bubbles');
  assert.ok(clip.stage(88.8).babies.some(b => b.kind === 'medic') && clip.stage(88.8).props.some(p => p.kind === 'gift'), 'the Medic in the present');
  assert.ok(clip.stage(99).props.some(p => p.kind === 'balloonicorn') && clip.stage(99).babies.some(b => b.kind === 'spy'), 'the town square');
  assert.ok(clip.stage(108.8).demo && !clip.stage(108.8).land && clip.stage(113).guests[0].kind === 'sniper', 'the BLU team burns');
  const team = clip.stage(120.3);
  assert.ok(team.kind === 'lineup' && team.pyro && team.engineer && team.heavy && team.actors.every(a => a.team === 'red' && a.cls !== 'pyro' && a.cls !== 'engineer'), 'the team with our own Pyro and Engineer');
  assert.ok(clip.stage(121.9).logo.emblem === 0 && clip.stage(122.5).logo.emblem === 1, 'the emblem lands at 122.2');
  assert.ok(clip.stage(125).land && clip.stage(130).soldier && clip.stage(133.5).helmetProp && clip.stage(137.6).fade > 0.3, 'the helmet falls in the burnt town');
  assert.strictEqual(clip.stage(144).cards[0].tex, 'sfm');
  assert.strictEqual(clip.stage(150).kind, 'black');
  assert.ok(clip.voiceAt(12.6) > 0.1 && clip.voiceAt(3) === 0 && clip.voiceAt(39) > 0.1, 'lips follow the voices');
  const src = ['mpy-pyro.js', 'mpy-heads.js', 'mpy-baby.js', 'mpy-art.js', 'mpy-props.js', 'mpy-sets.js', 'mpy-shots.js', 'mpy-real.js', 'mpy-land.js', 'mpy-script.js', 'mpy.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && src.includes('OPTICAL MASK') && src.includes('source') && !/2007|2008|2012/.test(src), 'title and card texts, no real years on screen');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3Pyr0-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3Pyr0').includes('Meet the Pyro'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Pyro'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Pyro'));
  assert.ok(window.appIE.performSearch('meet the pyro').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('поджигатель').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('пироленд').some(r => r.url === 'http://www.youvid.com'));
});

test('Meet the Medic on the Valve channel: the battle without a medic, the title card, the surgery with Archimedes, the heart from the fridge with the Spy head, the coat and the medigun, the ÜberCharge, the pile, the team, the waiting room and the free to play cards', () => {
  const clip = clips.find(c => c.id === 'M33tTh3M3d1');
  const v = site.video('M33tTh3M3d1');
  const S = window.MedScript;
  assert.ok(clip && v && S && window.MeetMedic && window.MedProps && window.MedSets && window.MedArt && window.MedVoice && window.MedShots && window.MeetFx);
  assert.strictEqual(clip.audio, 'content/YouVid/Meet the Medic.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(clip.aspect, 16 / 9);
  assert.ok(Math.abs(clip.duration - 249.17) < 0.05);
  assert.strictEqual(v.channel, 'Valve');
  assert.strictEqual(v.category, 'games');
  const ids = site.videosOf(site.channels.Valve).map(x => x.id);
  assert.ok(ids.indexOf('M33tTh3M3d1') > ids.indexOf('M33tTh3Pyr0') && ids.indexOf('M33tTh3M3d1') < ids.indexOf('M33tTh3Sc0t'), 'the Medic comes between the Pyro and the Scout on the channel');
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters[v.chapters.length - 1][0] < clip.duration);
  const shots = new Set();
  const heroes = ['medic', 'heavy', 'scout', 'demo', 'engineer'];
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    shots.add(st.shot);
    if (st.kind !== '3d' && st.kind !== 'lineup') continue;
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    heroes.forEach(k => {
      const h = st[k];
      if (!h) return;
      Object.values(h.m.pts).forEach(p => assert.ok(finite(p), `${k} joint at ${t}`));
      if (h.face) Object.values(h.face).forEach(x => assert.ok(Array.isArray(x) ? finite(x) : Number.isFinite(x), `${k} face at ${t}`));
    });
    (st.actors || []).forEach(a => Object.values(window.FabCast.solve(a.cls, a.pose).pts).forEach(p => assert.ok(finite(p), `${a.cls} at ${t}`)));
  }
  S.SHOTS.forEach(([t0, name]) => assert.ok(shots.has(name) || clip.stage(t0 + 0.02).shot === name, name));
  assert.ok(clip.stage(5.5).booms.length > 0 && clip.stage(7.5).demo, 'the explosion behind the ridge and the Demoman charging');
  assert.ok(clip.stage(12).scout && clip.stage(14.2).items.some(i => i.kind === 'bomb'), 'the Scout crawls under the bombs');
  assert.ok(clip.stage(18).crack > 0 && clip.stage(18).doves.length === 1, 'the dead Scout, the cracked lens and the dove');
  assert.strictEqual(clip.stage(20).cards[0].tex, 'title');
  const op = clip.stage(30);
  assert.ok(op.heavy.cavity && op.medic.outfit === 'lab' && op.beams.length > 0, 'the open chest under the medigun beam');
  assert.ok(clip.stage(43).doves.some(d => d.inChest), 'Archimedes in the chest');
  assert.strictEqual(clip.stage(57).medic.blood, 2, 'the heart bursts over the Medic');
  assert.ok(clip.stage(65.4).spy.face.jaw > 0.05, 'the Spy head in the fridge asks to be killed');
  assert.ok(clip.stage(72).hearts.some(h => h.big && h.uber !== undefined), 'the Mega Baboon heart with the ubercharger');
  assert.ok(clip.stage(79).heavy.glow > 0.5, 'the heart glows inside the chest');
  assert.ok(!clip.stage(123).heavy.cavity, 'the chest heals');
  const coat = clip.stage(145);
  assert.ok(coat.medic.outfit === 'coat' && coat.medic.gun && coat.medic.pack, 'the coat, the medigun and the backpack');
  assert.ok(clip.stage(184.8).medic.pack.lit && !clip.stage(183.3).medic.pack.lit, 'UBERCHARGE READY lights up');
  assert.ok(clip.stage(196).heavy.metal === 1 && clip.stage(196).heavy.eyes > 0, 'the ubercharged Heavy');
  assert.ok(clip.stage(216).actors.filter(a => a.team === 'blu').length >= 20, 'the pile of BLU');
  const team = clip.stage(220.6);
  assert.ok(team.kind === 'lineup' && team.medic.saw && team.demo && team.actors.every(a => a.team === 'red' && a.cls !== 'medic' && a.cls !== 'demo'), 'the team with our own Medic and Demoman');
  assert.ok(clip.stage(222.2).logo.emblem === 0 && clip.stage(222.6).logo.emblem === 1, 'the emblem lands at 222.5');
  const wait = clip.stage(226);
  assert.ok(wait.set === 'waiting' && wait.engineer.guitar && wait.setOpts.serving === 1 && clip.stage(230).setOpts.serving === 2, 'the waiting room and the ticket numbers');
  assert.ok(clip.stage(231.8).scout && clip.stage(231.8).setOpts.doorsOpen > 0.5, 'the Scout comes out of the surgery');
  assert.strictEqual(clip.stage(241).cards[0].tex, 'quote1');
  assert.strictEqual(clip.stage(244).cards[1].tex, 'quote3');
  assert.strictEqual(clip.stage(247).cards[1].tex, 'f2pUrl');
  assert.ok(clip.voiceAt(25) > 0.1 && clip.voiceAt(3) === 0 && clip.voiceAt(130) > 0.1, 'lips follow the voice');
  assert.ok(window.MedShots.heavyV(91) > 0.1, 'should I be awake for this?');
  const src = ['mtm-medic.js', 'mtm-art.js', 'mtm-props.js', 'mtm-sets.js', 'mtm-shots.js', 'mtm-act1.js', 'mtm-act2.js', 'mtm-act3.js', 'mtm-act4.js', 'mtm-script.js', 'mtm.js'].map(n => fs.readFileSync(path.join(root, 'js/apps/youvid', n), 'utf8')).join('\n');
  assert.ok(src.includes('COPYRIGHT LOLOLOL') && src.includes('A Valve Picture') && src.includes('Forever.') && !/(2007|2011|2012)/.test(src), 'title card and end cards, no years on screen');
  assert.ok(!/fuck|shit|crap/i.test(src + JSON.stringify(v)), 'no profanity on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/M33tTh3M3d1-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=M33tTh3M3d1').includes('Meet the Medic'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Valve').includes('Meet the Medic'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Meet the Medic'));
  assert.ok(window.appIE.performSearch('meet the medic').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('медиган').some(r => r.url === 'http://www.youvid.com'));
});

test('Самое странное начало видео от Влада Савельева keeps the walk around the chair, two greetings, the pause at the window and the mukbang ending on EbatoriyaPlanet', () => {
  const clip = clips.find(c => c.id === 'Str4nnInTr0');
  const v = site.video('Str4nnInTr0');
  const S = window.MukbangScript;
  const Cast = window.MukbangCast;
  assert.ok(clip && v && S && Cast && window.MukbangRoom);
  assert.ok(Math.abs(clip.duration - 58.58) < 0.02 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Самое странное начало видео от Влада Савельева.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.strictEqual(v.channel, 'EbatoriyaPlanet');
  assert.strictEqual(v.title, 'Самое странное начало видео от Влада Савельева');
  assert.strictEqual(v.category, 'people');
  assert.strictEqual(v.chapters.length, 12);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(site.videosOf(site.channels.EbatoriyaPlanet).some(x => x.id === 'Str4nnInTr0'));
  assert.ok(window.YouVidMotion && window.YouVidMotion.Str4nnInTr0, 'seated parts come from the pose capture');
  for (let t = 0; t <= clip.duration; t += 0.1) {
    const st = clip.stage(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    const p = st.pose;
    assert.ok(finite(p.p) && finite(p.fwd) && finite(p.up), `pose ${t}`);
    const m = Cast.solve(p);
    Object.values(m.pts).forEach(q => assert.ok(finite(q) && q[1] > 0 && q[1] < 2.1, `joint at ${t}`));
    assert.ok(m.pts.head[1] > 0.95 && m.pts.head[1] < 1.95, `head height ${t}`);
    assert.ok(Cast.EYES.includes(p.eyes) && Cast.BROWS.includes(p.brows) && Cast.MOUTHS.includes(p.mouth), `face ${t}`);
    ['gL', 'gR'].forEach(g => assert.ok(['open', 'fist', 'spread', 'point', 'rest'].includes(p[g]), `grip ${t}`));
  }
  const at = (t) => clip.stage(t).pose.p;
  assert.ok(at(2.2)[2] < -2.0, 'walks behind the chair');
  assert.ok(at(3.6)[0] > 0.6, 'comes back along the right side');
  assert.ok(at(15)[1] < 0.8 && at(52)[1] < 0.8, 'sits for both greetings');
  assert.ok(at(36)[0] > 1.8 && at(36)[2] < -3 && at(36)[1] > 0.85, 'stands by the window');
  assert.ok(clip.voiceAt(10) === 0 && clip.voiceAt(36) === 0, 'silence before the greeting and by the window');
  assert.ok(clip.voiceAt(20) > 0.3 && clip.voiceAt(53) > 0.3, 'two greetings');
  assert.ok(['talk', 'open', 'wide'].includes(clip.stage(19.0).pose.mouth), 'the mouth moves with the greeting');
  assert.strictEqual(clip.stage(36).pose.mouth, 'shut');
  const src = ['mukbang-room.js', 'mukbang-cast.js', 'mukbang-script.js', 'mukbang.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('Vladdy') && src.includes('K O M R A D Y'));
  assert.ok(!/johnny|adidas/i.test(src + JSON.stringify(v)), 'the shirt print is renamed');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Str4nnInTr0-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=Str4nnInTr0').includes('Самое странное начало видео'));
  assert.ok(site.renderSite('http://www.youvid.com/user/EbatoriyaPlanet').includes('Самое странное начало видео'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=people').includes('Самое странное начало видео'));
  assert.ok(window.appIE.performSearch('мукбанг').some(r => r.url === 'http://www.youvid.com'));
});

test('KONOSUBA - Opening keeps the 71 shots, the Japanese credits, the feather logo, Explosion circles, the Axel cast and the Crunchyroll end card', () => {
  const op = clips.find(c => c.id === 'k0n0SuBaOp1');
  assert.ok(op && Math.abs(op.duration - 99.52) < 0.05 && op.aspect === 16 / 9);
  assert.strictEqual(op.audio, 'content/YouVid/KONOSUBA - Opening.mp3');
  assert.strictEqual(op.cuts.length, 71);
  assert.strictEqual(op.cuts[0], 0);
  for (let i = 1; i < op.cuts.length; i++) assert.ok(op.cuts[i] > op.cuts[i - 1], `cut ${i}`);
  const v = site.video('k0n0SuBaOp1');
  assert.strictEqual(v.title, 'KONOSUBA - Opening');
  assert.strictEqual(v.channel, 'Crunchyroll');
  assert.strictEqual(v.category, 'film');
  v.chapters.forEach((c, i) => assert.ok(c[0] < op.duration && (i === 0 || c[0] > v.chapters[i - 1][0]), `chapter ${c[1]}`));
  const Cast = window.KonopCast;
  const looks = new Set(Object.keys(Cast.LOOKS).concat(Cast.BASE));
  for (let t = 0; t <= op.duration; t += 0.1) {
    const st = op.stage(t);
    const shown = st.replay !== undefined ? op.stage(st.replay) : st;
    assert.ok(finite(shown.camera.eye) && finite(shown.camera.at) && Number.isFinite(shown.camera.fov), `camera ${t}`);
    shown.cast.forEach(c => {
      assert.ok(looks.has(c.who), `look ${c.who} at ${t}`);
      const m = Cast.solve(c.who, c.pose);
      Object.values(m.pts).forEach(p => assert.ok(finite(p), `${c.who} joint at ${t}`));
      if (!c.pose.up) ['ankleL', 'ankleR'].forEach(k => assert.ok(m.pts[k][1] >= 0.069, `${c.who} ${k} above floor at ${t}`));
    });
  }
  assert.strictEqual(op.stage(0.6).set, 'town');
  assert.strictEqual(op.stage(2.4).set, 'gate');
  assert.deepStrictEqual(op.stage(6.6).backdrop.map(l => l.tex), ['ring', 'letterKo']);
  assert.deepStrictEqual([6.9, 7.25, 7.6].map(t => op.stage(t).backdrop[1].tex), ['letterNo', 'letterSu', 'letterBa']);
  assert.strictEqual(op.stage(8.6).cast[0].who, 'kazumaJ');
  assert.strictEqual(op.stage(15.6).logo.glyphs.length, 11);
  assert.deepStrictEqual(op.stage(20).cast.map(c => c.who), ['megumin', 'kazumaJ', 'aqua', 'darkness']);
  assert.strictEqual(op.stage(26.5).set, 'hill');
  assert.ok(op.stage(36.6).cast[0].pose.props.some(p => p.kind === 'bread'), 'Megumin eats bread');
  assert.ok(op.stage(35.0).cast[0].pose.props.filter(p => p.kind === 'mug').length === 6, 'six mugs');
  assert.ok(op.stage(40.6).foes.some(f => f.kind === 'mino'));
  assert.ok(op.stage(46.6).episode > 0 && op.stage(44).episode === 0);
  assert.ok(op.stage(55.6).foes.some(f => f.kind === 'golem'));
  assert.ok(op.stage(60).foes.some(f => f.kind === 'rockBig'));
  assert.ok(op.stage(61.9).foes.find(f => f.kind === 'rockBig').glow > 0.5, 'the grinning rock glows before it blows up');
  assert.strictEqual(op.stage(69.4).circles.length, 5);
  assert.ok(op.stage(70.7).domes.length > 0);
  assert.strictEqual(op.stage(74.5).cast.find(c => c.who === 'aqua').pose.eyes, 'cry');
  assert.ok(op.stage(78.4).cast[0].pose.thumbR, 'Kazuma thumbs up');
  [[80.5, 'wiz'], [81.3, 'bigman'], [81.9, 'chris'], [83.2, 'mitsurugi'], [84.6, 'yunyun'], [85.3, 'luna']].forEach(([t, who]) => assert.strictEqual(op.stage(t).cast[0].who, who, `${who} at ${t}`));
  assert.ok(op.stage(83.2).cast[0].pose.props.some(p => p.kind === 'gram'));
  assert.ok(op.stage(82.6).foes.some(f => f.kind === 'verdia'));
  assert.strictEqual(op.stage(87.5).set, 'finale');
  assert.strictEqual(op.stage(87.5).cast.length, 4);
  assert.ok(op.stage(88).copyright > 0.9);
  assert.ok(Math.abs(op.stage(95).replay - (95 - 36.245)) < 1e-6, 'end card replays the battle');
  const Sh = window.KonopShots;
  assert.strictEqual(Sh.CREDITS.length, 16);
  assert.ok(Sh.creditsAt(51.9).some(c => c.lines.some(l => l[0] === '「fantastic dreamer」')));
  assert.ok(Sh.creditsAt(26).some(c => c.lines[0][0] === '製作'));
  assert.ok(Sh.creditsAt(87).some(c => c.lines.some(l => l[0] === 'このすば製作委員会')));
  assert.strictEqual(Sh.creditsAt(95).length, 0);
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=k0n0SuBaOp1').includes('KONOSUBA - Opening'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Crunchyroll').includes('KONOSUBA - Opening'));
  assert.ok(window.appIE.performSearch('опенинг').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('fantastic dreamer').some(r => r.url === 'http://www.youvid.com'));
});

test('Breaking Bad Remix (Seasons 3-5) keeps the split-screen grid, the strobe cuts, every source shot, the sung lines and the placeboing mark on memes/ytp', () => {
  const clip = clips.find(c => c.id === 'Br3akBadRmx');
  const v = site.video('Br3akBadRmx');
  const S = window.BreakScript;
  const Shots = window.BreakShots;
  const Cast = window.BreakCast;
  assert.ok(clip && v && S && Shots && Cast && window.BreakSets && window.BreakArt && window.BreakFaces);
  assert.ok(Math.abs(clip.duration - 141.36) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Breaking Bad Remix (Seasons 3-5).mp3');
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, 'Breaking Bad Remix (Seasons 3-5)');
  assert.strictEqual(v.category, 'music');
  assert.ok(site.videosOf(site.channels.memes_ytp).some(x => x.id === 'Br3akBadRmx'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  const names = new Set();
  Object.entries(S.TRACKS).forEach(([panel, list]) => {
    assert.ok(S.PANELS[panel], `panel ${panel}`);
    list.forEach(([t, shot], i) => {
      if (i) assert.ok(t > list[i - 1][0], `${panel} events in order at ${t}`);
      if (shot && shot !== 'black') names.add(shot);
    });
  });
  names.forEach(n => assert.ok(Shots.SHOTS[n], `shot ${n}`));
  assert.ok(names.size >= 54, 'every source shot of the remix has its own scene');
  const layout = (t) => clip.stage(t).panels.map(p => p.panel).sort().join(' ');
  assert.strictEqual(layout(3), 'F');
  assert.strictEqual(layout(9), 'L R');
  assert.strictEqual(layout(43), 'BL BR TL TR');
  assert.strictEqual(layout(96), 'B4 T3L T3R');
  assert.strictEqual(layout(121), 'B4L B4R T3');
  assert.strictEqual(layout(130), 'B4L B4R T3L T3R');
  assert.strictEqual(layout(141), 'F');
  for (let t = 0; t < clip.duration; t += 0.1) {
    const area = clip.stage(t).panels.reduce((a, p) => a + p.rect[2] * p.rect[3], 0);
    assert.ok(Math.abs(area - 1) < 1e-6, `the panels tile the frame at ${t}`);
  }
  const shotAt = (panel, t) => S.shotAt(panel, t);
  assert.strictEqual(shotAt('F', 3), 'drive');
  assert.strictEqual(shotAt('F', 16), 'saulOffice');
  assert.strictEqual(shotAt('F', 33), 'jesseJump');
  assert.strictEqual(shotAt('F', 35), 'knock');
  assert.strictEqual(shotAt('F', 49), 'sayName');
  assert.strictEqual(shotAt('L', 67), 'waltSky');
  assert.strictEqual(shotAt('R', 67), 'hankSand');
  assert.strictEqual(shotAt('T3R', 96), 'eladio');
  assert.strictEqual(shotAt('B4', 96), 'granite');
  assert.strictEqual(shotAt('F', 106), 'carMike');
  assert.strictEqual(shotAt('B4L', 121), 'garlic');
  assert.strictEqual(shotAt('F', 140.9), 'black');
  const strobe = [78.8, 78.95, 79.02, 79.12, 79.25, 79.5].map(t => shotAt('L', t));
  assert.deepStrictEqual(strobe, ['black', 'waltTurn', 'black', 'black', 'black', 'black']);
  assert.ok(['waltTurn', 'waltTrees'].includes(shotAt('L', 79.08)));
  assert.strictEqual(S.singer(3), 'hank');
  assert.strictEqual(S.singer(16), 'saul');
  assert.strictEqual(S.singer(37), 'walt');
  assert.strictEqual(S.singer(66.5), 'hank');
  assert.strictEqual(S.singer(70.5), 'walt');
  assert.strictEqual(S.singer(95), 'eladio');
  assert.strictEqual(S.singer(106), 'mike');
  assert.ok([49.2, 49.4, 49.6, 49.8].some(t => clip.voiceAt(t) > 0.3), 'Say my name is sung');
  assert.ok([106.2, 106.4, 106.6].some(t => clip.voiceAt(t) > 0.3), 'Mike sings You are not the guy');
  assert.strictEqual(clip.voiceAt(141), 0);
  const seen = new Set();
  for (let t = 0.05; t < clip.duration; t += 0.25) {
    clip.stage(t).panels.forEach(p => {
      if (p.shot === 'black' || seen.has(p.shot + Math.round(t))) return;
      seen.add(p.shot + Math.round(t));
      const shot = Shots.SHOTS[p.shot];
      const heads = (shot.actors ? shot.actors(t) : []).map(a => {
        assert.ok(Cast.LOOKS[a.look], `look ${a.look}`);
        const m = Cast.solve(a.look, a.pose);
        Object.values(m.pts).forEach(q => assert.ok(finite(q), `${p.shot} joint at ${t}`));
        return [m.head[12], m.head[13], m.head[14]];
      });
      const cam = shot.cam(t, heads);
      assert.ok(finite(cam.eye) && finite(cam.at) && cam.fov >= 8 && cam.fov <= 60, `${p.shot} camera at ${t}`);
    });
  }
  Object.keys(Cast.LOOKS).forEach(id => assert.ok(Cast.HEADS[Cast.LOOKS[id].head], `head for ${id}`));
  const src = ['bb-art.js', 'bb-faces.js', 'bb-cast.js', 'bb-sets.js', 'bb-shots.js', 'bb-script.js', 'bb.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes("'placeboing'"), 'the remix keeps its author mark');
  assert.ok(src.includes('SAUL GOODMAN') && src.includes('555-0149'), 'the office window keeps its decal with an invented phone number');
  assert.ok(!/monster|503-4455/i.test(src), 'no real brand or phone number');
  assert.ok(!/bitch|fuck/i.test(src + JSON.stringify(v)), 'English profanity stays in the audio');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/Br3akBadRmx-${i}.png`))));
  const watch = site.renderSite('http://www.youvid.com/watch?v=Br3akBadRmx');
  assert.ok(watch.includes('Breaking Bad Remix (Seasons 3-5)') && watch.includes('height="270"'));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('Breaking Bad Remix'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=music').includes('Breaking Bad Remix'));
  assert.ok(window.appIE.performSearch('breaking bad').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('во все тяжкие').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('хайзенберг').some(r => r.url === 'http://www.youvid.com'));
});

test("DON'T TOY WITH ME, MISS NAGATORO Opening keeps the 75 shots, the original credits, the recoloured layers and the Crunchyroll end card", () => {
  const op = clips.find(c => c.id === 'N4gat0r0Op1');
  assert.ok(op && Math.abs(op.duration - 99.985) < 0.05 && op.aspect === 16 / 9);
  assert.strictEqual(op.audio, "content/YouVid/DON'T TOY WITH ME, MISS NAGATORO Opening   EASY LOVE.mp3");
  assert.strictEqual(op.cuts.length, 75);
  assert.strictEqual(op.cuts[0], 0);
  for (let i = 1; i < op.cuts.length; i++) assert.ok(op.cuts[i] > op.cuts[i - 1], `cut ${i}`);
  const v = site.video('N4gat0r0Op1');
  assert.strictEqual(v.channel, 'Crunchyroll');
  assert.strictEqual(v.category, 'film');
  assert.ok(v.title.startsWith("DON'T TOY WITH ME, MISS NAGATORO"));
  v.chapters.forEach((c, i) => assert.ok(c[0] < op.duration && (i === 0 || c[0] > v.chapters[i - 1][0]), `chapter ${c[1]}`));
  const Cast = window.NagCast;
  for (let t = 0; t <= op.duration; t += 0.1) {
    op.stage(t).layers.forEach(L => {
      assert.ok(finite(L.camera.eye) && finite(L.camera.at) && Number.isFinite(L.camera.fov), `camera ${t}`);
      L.cast.forEach(c => {
        assert.ok(Cast.CHARS[c.who], `look ${c.who} at ${t}`);
        Object.values(Cast.solve(c.who, c.pose).pts).forEach(p => assert.ok(finite(p), `${c.who} joint at ${t}`));
      });
    });
  }
  const whoAt = (t) => op.stage(t).layers.flatMap(L => L.cast.map(c => c.who)).sort();
  assert.deepStrictEqual(whoAt(0.6), ['nagatoro']);
  assert.strictEqual(op.stage(2.3).layers.length, 0, 'IJIRANAIDE card');
  assert.deepStrictEqual(whoAt(9.6), ['senpai']);
  assert.deepStrictEqual(whoAt(18), ['nagatoro', 'senpai']);
  assert.deepStrictEqual(whoAt(46), ['gamo', 'nagatoro', 'sakura', 'senpai', 'yoshi']);
  assert.strictEqual(op.stage(27).layers[0].set, 'classroom');
  assert.strictEqual(op.stage(53).layers[0].set, 'artroom');
  assert.ok(op.stage(31).layers[0].props.some(p => p.kind === 'sketch'), 'the sketchbook page');
  assert.ok(op.stage(70.5).layers[0].cast[0].carry.some(p => p.kind === 'cover'), 'Senpai reads the magazine');
  assert.strictEqual(op.stage(57.9).layers[0].cast[0].pose.hiFace, true);
  assert.strictEqual(op.stage(76).layers[0].cast[0].pose.face.eyes, 'creep');
  assert.ok(op.stage(63.2).layers[0].cast[0].pose.glasses, 'Nagatoro wears the glasses');
  [[88.35, '#33e7fd'], [88.6, '#07fd36'], [88.8, '#fc5e90']].forEach(([t, bg]) => assert.strictEqual(op.stage(t).bg, bg));
  const end = op.stage(95);
  assert.ok(end.post.blur > 0 && typeof end.over === 'function', 'end card blurs the replay');
  assert.strictEqual(end.bg, op.stage(95 - window.NagScript.REPLAY).bg);
  const Sh = window.NagShots;
  assert.deepStrictEqual(Sh.CREDITS.director, ['花井 宏和']);
  assert.deepStrictEqual(Sh.CREDITS.studio, ['テレコム・アニメーションフィルム']);
  assert.strictEqual(Sh.CREDITS.prod.length, 4);
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=N4gat0r0Op1').includes('MISS NAGATORO'));
  assert.ok(site.renderSite('http://www.youvid.com/user/Crunchyroll').includes('MISS NAGATORO'));
  assert.ok(window.appIE.performSearch('nagatoro').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('нагаторо').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('easy love').some(r => r.url === 'http://www.youvid.com'));
});

test('Я приготовил суп из сайры Влада Савельева keeps the stream intro, the phone clips, the store page, the frying pan, the pours, Vlad in the Santa hat, the cat, the Deluxe soup, the mayo, the microwave and the noodle bowl on Shosum Posum', () => {
  const clip = clips.find(c => c.id === 'S4iraSuP0sm');
  const v = site.video('S4iraSuP0sm');
  const S = window.SairaScript;
  const Hands = window.SairaHands;
  assert.ok(clip && v && S && Hands && window.SairaArt && window.SairaProps && window.SairaSets && window.SairaTrack);
  assert.strictEqual(clip.audio, 'content/YouVid/Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево..mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.ok(Math.abs(clip.duration - 607.55) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.title, 'Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево.');
  assert.strictEqual(v.channel, 'ShosumPosum');
  assert.strictEqual(v.category, 'howto');
  const ch = site.channels.ShosumPosum;
  assert.ok(ch && ch.name === 'Shosum Posum' && ch.theme === 'posum' && ch.country === 'Россия' && /1999$/.test(ch.joined));
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id), ['S4iraSuP0sm']);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters.length >= 20 && v.chapters[v.chapters.length - 1][0] < clip.duration);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  assert.strictEqual(clip.cuts.length, 30);
  const SETS = ['stove', 'table', 'micro', 'phone', 'stream', 'room'];
  const KINDS = ['spoon', 'fork', 'spatula', 'can', 'jar', 'plate', 'pouch', 'soda', 'tomato', 'half', 'tub', 'salad'];
  const rigOk = (rig, t) => {
    assert.ok(finite(rig.wrist) && finite(rig.elbow) && finite(rig.shoulder), `arm at ${t}`);
    rig.bones.forEach(b => assert.ok(finite(b.a) && finite(b.b), `finger at ${t}`));
  };
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = clip.stage(t);
    assert.ok(SETS.includes(st.set), `set ${st.set} at ${t}`);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && finite(st.camera.up) && Number.isFinite(st.camera.fov), `camera ${t}`);
    st.hands.forEach(h => {
      rigOk(h.rig, t);
      (h.props || []).forEach(p => assert.ok(KINDS.includes(p.kind), `prop ${p.kind} at ${t}`));
    });
    (st.props || []).concat(st.handProps || []).forEach(p => assert.ok(KINDS.includes(p.kind), `prop ${p.kind} at ${t}`));
    (st.cast || []).forEach(a => {
      const m = window.StsCast.solve(a.who, a.pose);
      Object.values(m.pts).forEach(q => assert.ok(finite(q), `${a.who} joint at ${t}`));
      (a.hands || []).forEach(rig => rigOk(rig, t));
    });
  }
  const at = (t) => clip.stage(t);
  assert.ok(at(5).set === 'stream' && at(5).overlay === 'stream' && at(5).cast[0].headset, 'the streamer with the price list');
  assert.ok(at(20).portrait && at(86).portrait && at(343).portrait, 'three vertical phone clips of the original');
  assert.ok(at(18).hands.some(h => h.props.some(p => p.kind === 'can' && p.label === 'canVlad')), 'the can goes into the pot');
  assert.strictEqual(at(30).overlay, 'store');
  assert.ok(at(44).hands[0].props[0].open, 'the tasted can is open');
  assert.ok(at(66).fry.layers.some(L => L.tex === 'lumps'), 'tomato sauce on the fish');
  assert.ok(at(100).fry.layers.some(L => L.tex === 'mash'), 'mashed with a spoon');
  assert.ok(at(116).fry.M[13] > 0.08, 'the pan is lifted over the saucepan');
  assert.ok(at(140).cast.some(a => a.who === 'vlad' && a.pose.outfit === 'santa'), 'Vlad in the Santa hat');
  assert.ok(at(146).cat, 'the cat walks over the bed');
  assert.ok(at(168).box.layers.some(L => L.tex === 'soup'), 'the soup is poured into the box');
  assert.ok(at(208).cast[0].pose && at(208).props.some(p => p.kind === 'jar' && p.jarKind === 'pickles'), 'pickled tomatoes');
  assert.ok(at(236).props.some(p => p.kind === 'tub'), 'the tub with the brine');
  assert.ok(at(270).box.chunks.some(c => c.kind === 'half'), 'squashed tomatoes in the box');
  assert.ok(at(350).board.chunks.length >= 10 && at(350).board.onion, 'potato and onion on the board');
  assert.ok(at(385).sauce.chunks.length >= 10, 'Deluxe potatoes in the saucepan');
  assert.ok(at(445).props.some(p => p.kind === 'pouch'), 'the mayo pouch');
  assert.ok(at(462).box.layers.some(L => L.tex === 'creamy'), 'mayo stirred in');
  assert.ok(at(480).hands.some(h => h.props.some(p => p.kind === 'soda')), 'the soda can stays unopened');
  assert.ok(at(505).hands.some(h => h.props.some(p => p.jarKind === 'jarPaste')), 'tomato paste over the noodles');
  assert.ok(at(519).set === 'micro', 'the microwave');
  assert.ok(at(560).bowl.layers.some(L => L.tex === 'redPaste') && at(560).cookie, 'the final bowl in the sunlight');
  assert.ok(clip.voiceAt(30) > 0.1 && clip.voiceAt(236) === 0, 'narration follows the words');
  assert.ok(window.SairaTrack.vlad(431.2) > 0.1 && window.SairaTrack.vlad(436) === 0, 'Vlad talks only in his own clips');
  const src = ['saira-art.js', 'saira-props.js', 'saira-hands.js', 'saira-sets.js', 'saira-script.js', 'saira.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes('Румпель') && src.includes('7 Заливов') && src.includes('РАЗДОЛЬЕ') && src.includes('ЛАПШАК') && src.includes('донат-пейджер'));
  assert.ok(!/mountain dew|доширак|5 морей|штурвал|беринг|слобода|aloma|donationalerts|youtube/i.test(src + JSON.stringify([v, ch])), 'no real brands on screen');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/S4iraSuP0sm-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=S4iraSuP0sm').includes('Я приготовил суп из сайры'));
  const page = site.renderSite('http://www.youvid.com/user/ShosumPosum');
  assert.ok(page.includes('yv-theme-posum') && page.includes('Shosum Posum'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=howto').includes('Я приготовил суп из сайры'));
  assert.ok(window.appIE.performSearch('суп из сайры').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('shosum posum').some(r => r.url === 'http://www.youvid.com'));
});

test('Stairs Dance Complete Scene keeps the JOKER title, the corridor, the lift door, the captured dance on the stairs, the smoke, both detectives and the street on memes/ytp', () => {
  const clip = clips.find(c => c.id === 'St41rsD4nc3');
  const v = site.video('St41rsD4nc3');
  const S = window.StairsScript;
  const W = window.StairsWorld;
  const Cast = window.StairsCast;
  assert.ok(clip && v && S && W && Cast && window.StairsArt);
  assert.ok(Math.abs(clip.duration - 91.72) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(clip.audio, 'content/YouVid/Stairs Dance Complete Scene.mp3');
  assert.strictEqual(v.channel, 'memes_ytp');
  assert.strictEqual(v.title, 'Stairs Dance Complete Scene');
  assert.strictEqual(v.category, 'film');
  assert.ok(site.videosOf(site.channels.memes_ytp).some(x => x.id === 'St41rsD4nc3'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.strictEqual(S.SHOTS.length, S.CUTS.length, 'one scene per source shot');
  S.SHOTS.forEach((sh, i) => {
    assert.ok(Math.abs(sh.t0 - S.CUTS[i]) < 1e-6, `shot ${i} starts at its cut`);
    if (i < S.SHOTS.length - 1) assert.ok(Math.abs(sh.t1 - S.SHOTS[i + 1].t0) < 1e-6, `shot ${i} ends at the next cut`);
  });
  const at = (t) => clip.stage(t);
  assert.ok(at(1).fx.title > 0.9 && at(1).fx.black === 1, 'the title on black');
  assert.ok(at(4.5).fx.title > 0.5 && at(4.5).fx.black === 0, 'the corridor shows through the title');
  assert.strictEqual(at(7).fx.title, 0);
  assert.strictEqual(at(7).set, 'hall');
  assert.strictEqual(at(10.3).set, 'door');
  assert.strictEqual(at(18.5).set, 'lift');
  assert.ok(at(14).actors[0].pose.yaw > 3 && Math.abs(at(18.5).actors[0].pose.yaw - 2 * Math.PI) < 0.05, 'he walks in and turns to the camera');
  assert.ok(at(21).setOpts.door === 0 && at(23).setOpts.door > 0.9, 'the lift door closes');
  for (let t = 23.6; t < 87.9; t += 0.5) assert.strictEqual(at(t).set, 'stairs', `stairs at ${t}`);
  assert.strictEqual(at(90).set, 'avenue');
  assert.ok(at(91.3).setOpts.busX !== undefined && at(89).setOpts.busX === undefined, 'the bus passes in the last second');
  const mot = window.YouVidMotion['St41rsD4nc3:joker'];
  const cams = window.YouVidMotion['St41rsD4nc3:cams'];
  const dance = S.SHOTS.filter(sh => sh.mocap);
  assert.ok(dance.length >= 13, 'the dance shots come from the motion capture');
  dance.forEach(sh => {
    assert.ok(cams[sh.mocap], `camera for ${sh.mocap}`);
    assert.ok(mot.segs.some(g => Math.abs(g.t0 - sh.t0) < 0.01), `motion for ${sh.mocap}`);
  });
  for (let t = 23.6; t < 87.9; t += 0.2) {
    const j = at(t).actors.find(a => a.look === 'joker');
    if (!j) continue;
    const m = Cast.solve('joker', j.pose);
    Object.values(m.pts).forEach(q => assert.ok(finite(q), `joint at ${t}`));
    const sh = S.SHOTS[S.shotAt(t)];
    if (!sh.mocap || ['mcu', 'laugh', 'spin'].includes(sh.mocap)) continue;
    ['ankleL', 'ankleR'].forEach(k => {
      const p = m.pts[k];
      assert.ok(p[1] > W.groundAt(p[0], p[2]) + 0.04, `${k} stays above the steps at ${t.toFixed(1)}`);
    });
  }
  assert.ok(at(71).actors[0].pose.cig && at(72).actors[0].pose.eyes === 'closed', 'the cigarette and closed eyes in the close-up');
  assert.ok(at(76).actors[0].pose.nk[0] < -0.6, 'he tilts his head back to blow the smoke up');
  assert.strictEqual(at(76).fx.smoke, 'cu');
  assert.deepStrictEqual(at(80).actors.map(a => a.look).sort(), ['burke', 'garrity'], 'both detectives at the top');
  assert.ok(at(85).actors.some(a => a.look === 'burke') && at(85).actors.some(a => a.look === 'joker'), 'he runs while the detectives look on');
  for (let t = 0.2; t < clip.duration; t += 0.5) {
    const cam = S.cameraAt(t);
    assert.ok(finite(cam.eye) && finite(cam.at) && cam.fov >= 20 && cam.fov <= 60, `camera at ${t}`);
  }
  const src = ['stairs-art.js', 'stairs-world.js', 'stairs-cast.js', 'stairs-script.js', 'stairs.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes("'JOKER'"), 'the title card');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/St41rsD4nc3-${i}.png`))));
  const watch = site.renderSite('http://www.youvid.com/watch?v=St41rsD4nc3');
  assert.ok(watch.includes('Stairs Dance Complete Scene') && watch.includes('height="270"'));
  assert.ok(site.renderSite('http://www.youvid.com/user/memes_ytp').includes('Stairs Dance Complete Scene'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=film').includes('Stairs Dance Complete Scene'));
  assert.ok(window.appIE.performSearch('джокер').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('stairs dance').some(r => r.url === 'http://www.youvid.com'));
});

test('Парад беды - STALKER keeps the tracked camera, the bolt and the PPSh, the ogres, Flint and the horn, the parade of cars, cans, washers and toilets, the yellow BTR in the field and the barrel ending on Eptable', () => {
  const clip = clips.find(c => c.id === 'P4radB3dy98');
  const v = site.video('P4radB3dy98');
  const S = window.ParadScript;
  const Cam = window.ParadCam;
  assert.ok(clip && v && S && Cam && window.ParadTrack && window.ParadArt && window.ParadWorld && window.ParadCast && window.ParadGun);
  assert.strictEqual(clip.audio, 'content/YouVid/Парад беды - STALKER.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.ok(Math.abs(clip.duration - 103.68) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.title, 'Парад беды - STALKER');
  assert.strictEqual(v.channel, 'Eptable');
  assert.strictEqual(v.category, 'games');
  const ch = site.channels.Eptable;
  assert.ok(ch && ch.name === 'Eptable' && ch.theme === 'eptable' && ch.country === 'Россия' && /1999$/.test(ch.joined));
  assert.ok(site.videosOf(ch).some(x => x.id === 'P4radB3dy98'));
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters.length >= 20 && v.chapters[v.chapters.length - 1][0] < clip.duration);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  const at = (t) => clip.stage(t);
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = at(t);
    assert.ok(['village', 'field', 'yard'].includes(st.set), `set at ${t}`);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    st.things.forEach(x => assert.ok(finite(x.p), `${x.kind} at ${t}`));
    st.actors.forEach(a => assert.ok(finite(a.pos) && Number.isFinite(a.face), `${a.who} at ${t}`));
  }
  assert.ok(Math.abs(Cam.camera(13.05).yaw - Cam.camera(12.9).yaw) > 20, 'the fast turn to the parade comes from the tracked camera');
  assert.strictEqual(at(30).set, 'village');
  assert.strictEqual(at(65).set, 'field');
  assert.strictEqual(at(90).set, 'yard');
  assert.strictEqual(at(5).gun.mode, 'bolt');
  assert.ok(at(8.8).gun.throwK > 0, 'the bolt is thrown');
  assert.ok(at(29).gun.mode === 'gun' && at(28.5).gun.draw < 1, 'the PPSh comes out at 0:28');
  assert.ok(at(40.5).gun.reload > 0 && at(74.5).gun.reload > 0, 'reloads');
  assert.ok([36.8, 36.85, 36.9].some(t => at(t).gun.flash), 'shots at the washing machine');
  assert.strictEqual(at(90).gun.mode, 'none');
  assert.strictEqual(at(100).gun.mode, 'gun');
  assert.strictEqual(at(11).actors.filter(a => a.who === 'ogre').length, 2);
  assert.ok(at(11).actors.some(a => a.who === 'man') && at(11).things.some(x => x.kind === 'horn'), 'Flint and the horn by the house');
  assert.ok(at(14.5).things.some(x => x.kind === 'btr'), 'the BTR hops past');
  assert.ok(at(17).things.filter(x => x.kind === 'can').length >= 2 && at(17).things.filter(x => x.kind === 'car').length >= 2, 'cans and cars');
  assert.ok(at(21).things.filter(x => x.kind === 'washer').length >= 2, 'two washing machines fly close');
  assert.ok(at(23.5).things.filter(x => x.kind === 'toilet').length >= 5, 'the column of toilets');
  assert.ok(at(50.5).things.some(x => x.kind === 'freezer') && at(50.5).things.some(x => x.kind === 'fridge'), 'the attack in the lane');
  const ybtr = at(72.5).things.find(x => x.kind === 'ybtr');
  assert.ok(ybtr && ybtr.pitch > 1.4, 'the yellow BTR stands on end');
  assert.ok(at(81).actors.some(a => a.who === 'man') && at(90).body && at(99).body, 'Flint in the yard, dragged and in the barrel');
  assert.ok(at(95.4).flare > 0.5 && at(103.5).fadeOut > 0.5 && at(78.0).dissolve > 0, 'flare, dissolve and fade');
  assert.ok(at(28.9).hud.hint && at(28).hud.label && at(75).hud.pda, 'the hint, the name label and the PDA message');
  const src = ['parad-art.js', 'parad-world.js', 'parad-cast.js', 'parad-gun.js', 'parad-script.js', 'parad.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  assert.ok(src.includes("'Флинт'") && src.includes("'Одиночка'") && src.includes('выбрать болт (6).') && src.includes('Осторожней! Ты рядом с аномалиями.'));
  assert.ok(!src.includes('В.В.'), 'the name label keeps only the stalker name');
  assert.ok(!/бля|пизд|хуй|ебан/i.test(src + JSON.stringify([v, ch])), 'profanity stays in the audio');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/P4radB3dy98-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=P4radB3dy98').includes('Парад беды'));
  const page = site.renderSite('http://www.youvid.com/user/Eptable');
  assert.ok(page.includes('yv-theme-eptable') && page.includes('Eptable'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Парад беды'));
  assert.ok(window.appIE.performSearch('парад беды').some(r => r.url === 'http://www.youvid.com'));
  assert.ok(window.appIE.performSearch('eptable').some(r => r.url === 'http://www.youvid.com'));
});

test('STALKER - Downgrade Edition Trailer keeps the rating card, the bunker, the ogre in the outhouse, the downgrade captions and blur, the controller, the cut voice, the inventory glitch, the barrel and the vanished sign and plant on Eptable', () => {
  const clip = clips.find(c => c.id === 'D0wngr4d3Ed');
  const v = site.video('D0wngr4d3Ed');
  const S = window.DownScript;
  const Cam = window.DownCam;
  assert.ok(clip && v && S && Cam && window.DownTrack && window.DownArt && window.DownWorld && window.DownCast && window.DownGun);
  assert.strictEqual(clip.audio, 'content/YouVid/STALKER - Downgrade Edition Trailer.mp3');
  assert.ok(fs.existsSync(path.join(root, clip.audio)));
  assert.ok(Math.abs(clip.duration - 73.3) < 0.05 && clip.aspect === 16 / 9);
  assert.strictEqual(v.title, 'STALKER - Downgrade Edition Trailer');
  assert.strictEqual(v.channel, 'Eptable');
  assert.strictEqual(v.category, 'games');
  const ch = site.channels.Eptable;
  assert.deepStrictEqual(site.videosOf(ch).map(x => x.id).sort(), ['D0wngr4d3Ed', 'P4radB3dy98']);
  for (let i = 1; i < v.chapters.length; i++) assert.ok(v.chapters[i][0] > v.chapters[i - 1][0], `chapter ${i}`);
  assert.ok(v.chapters.length >= 20 && v.chapters[v.chapters.length - 1][0] < clip.duration);
  for (let i = 1; i < clip.cuts.length; i++) assert.ok(clip.cuts[i] > clip.cuts[i - 1], `cut ${i}`);
  const at = (t) => clip.stage(t);
  for (let t = 0; t < clip.duration; t += 0.25) {
    const st = at(t);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at) && Number.isFinite(st.camera.fov), `camera ${t}`);
    st.actors.forEach(a => assert.ok(finite(a.pos) && Number.isFinite(a.face), `${a.outfit} at ${t}`));
    st.titles.forEach(x => assert.ok(window.DownArt.TITLES[x.key], `title ${x.key} at ${t}`));
  }
  assert.strictEqual(at(1).set, 'card');
  assert.ok(at(4).fx.letterbox && at(4).madeIn.line1 && at(4.8).madeIn.line2 > 0.5, 'bunker with the made in line');
  assert.ok(at(5.0).morph > 0.5 && at(7.3).ogre && at(9.8).fx.fade === 1, 'the door turns into the outhouse and the ogre comes out');
  assert.ok(at(12).titles.some(x => x.key === 'classic') && at(12).gun.mode === 'pistolSilver');
  assert.strictEqual(at(14.5).actors.filter(a => a.outfit === 'exo').length, 3);
  assert.ok(at(19.0).camera.eye[1] < 1 && at(21).camera.eye[1] > 1.5, 'up the cellar stairs into the field');
  assert.ok(at(22).fx.blur > 0 && at(25).fx.blur === 0 && at(28).fx.blur > 0, 'downgrade is blurry, the original is sharp');
  assert.ok(at(25).titles.some(x => x.key === 'original640') && at(28).titles.some(x => x.key === 'downgrade8k'));
  assert.ok(at(31).gamepad > 0 && at(30.2).gun.reload >= 0 && [31.12, 32.33, 34.3, 34.6].some(t => at(t).gun.flash), 'controller support, reload and shots');
  assert.ok(at(35.8).actors[0].lie && at(35.8).npcLabel, 'the bandit falls with his red label');
  assert.ok(at(38).actors[0].crouch > 0.5 && at(40.5).actors[0].crouch < 0.1 && at(40.5).npcLabel.tex === 'labelShustry', 'Shustry gets up');
  assert.ok(at(42).fps > 300 && at(45).fps < 50 && at(45).fx.lowFps > 0 && at(42).camera.eye[1] > 4, 'rays off on the roof, then thirty frames');
  assert.ok(at(47).gun.sprint > 0.5 && [48.1, 48.2, 48.3].some(t => at(t).gun.flash), 'sprint and fire at the wall');
  assert.strictEqual(at(50).set, 'inv');
  assert.ok(at(51.2).set === 'invModel' && at(51.2).actors[0].tpose && at(51.2).arrow);
  assert.ok(at(53).actors.some(a => a.barrel) && at(54).gun.reach > 0.5, 'the stalker in the barrel');
  assert.ok(at(56.5).alerts > 0.9 && at(57).arrow);
  assert.ok(at(59).letters && !at(62.5).letters && at(62.5).titles.some(x => x.key === 'decom'), 'the sign letters vanish');
  assert.ok(at(66).set === 'plant' && at(70).set === 'factory' && at(70).plantGone && at(71).gun.throwK > 0, 'the plant turns into a shed and a bolt flies');
  assert.ok(at(72.95).fx.fade > 0.5 && at(60.05).fx.flash > 0);
  const src = ['down-art.js', 'down-cam.js', 'down-world.js', 'down-cast.js', 'down-gun.js', 'down-script.js', 'down.js'].map(f => fs.readFileSync(path.join(root, 'js/apps/youvid', f), 'utf8')).join('\n');
  ['Made in Czech Republic', 'by russian outsource', 'DOWNGRADE EDITION 8K', 'ORIGINAL', '640X320', 'CONTROLLER SUPPORT', 'RUSSIAN VOICE ACTING CUT', 'OLD AND NEW BUGS AND GLITCHES', 'DECOMMUNIZATION', 'DEINDUSTRIALIZATION', "'RAYS'", "'Шустрый'", "'Одиночка'", 'Тебе п****.', 'ЧАЭС', 'имени  В.И. Ленина', 'СТОП-ПОВ.'].forEach(s => assert.ok(src.includes(s), s));
  assert.ok(!/pegi|PEGI|RTX|Xbox|XBOX|GSC/.test(src + JSON.stringify(v)), 'real brands are replaced');
  assert.ok(!/бля|пизд|хуй|ебан/i.test(src + JSON.stringify([v, ch])), 'profanity stays in the audio');
  [1, 2, 3].forEach(i => assert.ok(fs.existsSync(path.join(root, `content/YouVid/thumbs/D0wngr4d3Ed-${i}.png`))));
  assert.ok(site.renderSite('http://www.youvid.com/watch?v=D0wngr4d3Ed').includes('Downgrade Edition'));
  const page = site.renderSite('http://www.youvid.com/user/Eptable');
  assert.ok(page.includes('Downgrade Edition') && page.includes('Парад беды'));
  assert.ok(site.renderSite('http://www.youvid.com/browse?c=games').includes('Downgrade Edition'));
  assert.ok(window.appIE.performSearch('downgrade').some(r => r.url === 'http://www.youvid.com'));
});

console.log(`\n${passed} youvid tests passed`);
