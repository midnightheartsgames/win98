const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); } };
global.window = {
  addEventListener: () => {},
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) }
};

const load = (rel) => eval(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
load('js/apps/poligon/p3d.js');
load('js/apps/poligon/figure.js');
load('js/apps/poligon/clip-never-gonna.js');
load('js/apps/poligon/clip-paranoia.js');
load('js/apps/poligon/clip-vladik.js');
load('js/apps/poligon/clip-tarakan.js');
load('js/apps/poligon/clip-neck-hurts.js');
load('js/apps/poligon/clip-war-song.js');
load('js/apps/poligon-site.js');
load('js/apps/ie.js');

const site = window.poligonSite;
const clip = window.poligonClips[0];
const clips = window.poligonClips;
const shown = site.clips();
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const finite = (v) => v.every(Number.isFinite);

test('IE routes poligon3d.ru to the site', () => {
  const ie = window.appIE;
  assert.strictEqual(ie.identifyPageKey('http://www.poligon3d.ru'), 'poligon');
  assert.strictEqual(ie.identifyPageKey('http://www.poligon3d.ru/clip/never-gonna-give-you-up'), 'poligon');
  assert.ok(ie.getPageTitle('poligon').includes('ПОЛИГОН'));
  assert.ok(ie.performSearch('клип').some(r => r.url === 'http://www.poligon3d.ru'));
});

test('clips are registered once, numbered, with their mp3 soundtracks', () => {
  load('js/apps/poligon/clip-never-gonna.js');
  load('js/apps/poligon/clip-paranoia.js');
  load('js/apps/poligon/clip-vladik.js');
  load('js/apps/poligon/clip-tarakan.js');
  load('js/apps/poligon/clip-neck-hurts.js');
  load('js/apps/poligon/clip-war-song.js');
  assert.deepStrictEqual(clips.map(c => c.number), [1, 2, 3, 4, 5, 6]);
  clips.forEach(c => {
    const mp3 = path.join(__dirname, '..', c.audio);
    assert.ok(fs.existsSync(mp3), mp3);
  });
  assert.ok(Math.abs(clips[0].duration - 213.09) < 0.5);
  assert.ok(Math.abs(clips[1].duration - 224.05) < 0.5);
  assert.ok(Math.abs(clips[2].duration - 218.36) < 0.5);
  assert.ok(Math.abs(clips[3].duration - 257.6) < 0.5);
  assert.ok(Math.abs(clips[4].duration - 185.78) < 0.5);
  assert.ok(Math.abs(clips[5].duration - 164.0) < 0.05);
});

test('War Song follows the cut list of the episode and ends with the Sam and Max lines', () => {
  const c = clips[5];
  assert.strictEqual(c.id, 'war-song');
  assert.strictEqual(c.artist, 'Sam & Max');
  assert.strictEqual(c.bpm, 120);
  assert.strictEqual(c.shots.length, 43);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(3), 'deskMax');
  assert.strictEqual(cam(10), 'maxClose');
  assert.strictEqual(cam(25), 'shelfSign');
  assert.strictEqual(cam(37), 'nutcracker');
  assert.strictEqual(cam(53), 'seal');
  assert.strictEqual(c.shotAt(74).scene, 'stage');
  assert.strictEqual(cam(80), 'peepers');
  assert.strictEqual(cam(92), 'pool');
  assert.strictEqual(c.shotAt(103).scene, 'flag');
  assert.strictEqual(cam(118), 'iris');
  assert.strictEqual(cam(140), 'march');
  assert.strictEqual(cam(156), 'exit');
  assert.strictEqual(cam(162), 'final');
  assert.strictEqual(cam(163.6), 'maxEnd');
  const ids = (t) => c.stage(t, c.shotAt(t)).cast.filter(a => !a.hidden).map(a => a.id);
  assert.ok(ids(19.5).includes('sam') && ids(19.5).includes('max'));
  assert.ok(ids(42).includes('superball') && ids(42).length >= 3);
  assert.ok(ids(162.3).includes('sam') && ids(162.3).includes('max'));
  assert.deepStrictEqual(c.lines.map(l => l.who), ['sam', 'max']);
  assert.strictEqual(c.lineAt(162.3).who, 'sam');
  assert.strictEqual(c.lineAt(163.5).who, 'max');
  assert.strictEqual(c.lineAt(150), null);
  assert.ok(c.mouthFor('sam', 162.3) > 0.2 && c.mouthFor('max', 162.3) === 0);
  assert.ok(c.mouthFor('max', 163.5) > 0.2 && c.mouthFor('sam', 163.5) === 0);
  const maxEnd = c.stage(163.5, c.shotAt(163.5)).cast.find(a => a.id === 'max');
  assert.ok(maxEnd.pose.mouth > 0.2);
  let solo = 0, chorus = 0;
  for (let t = 28.5; t < 36; t += 0.1) if (c.mouthFor('superball', t) > 0.3) solo++;
  for (let t = 40; t < 46; t += 0.1) if (c.mouthFor('agent', t) > 0.3) chorus++;
  assert.ok(solo > 25, `Superball sings the verse (${solo})`);
  assert.ok(chorus > 15, `agents sing the chorus (${chorus})`);
  assert.strictEqual(c.mouthFor('agent', 30), 0);
  assert.strictEqual(c.mouthFor('superball', 2), 0);
  const src = fs.readFileSync(path.join(__dirname, '../js/apps/poligon/clip-war-song.js'), 'utf8');
  assert.ok(!/good for you|strengthens the economy|incumbent|midstream|joys of war|wondrous|klaxon|fighter drones/i.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
});

test('Neck Hurts remake follows the source cut list with an original DJ heroine', () => {
  const c = clips[4];
  assert.strictEqual(c.id, 'neck-hurts');
  assert.strictEqual(Math.round(c.bpm), 126);
  assert.strictEqual(c.shotAt(1).scene, 'club');
  assert.strictEqual(c.shotAt(4).scene, 'hud');
  assert.strictEqual(c.shotAt(18).scene, 'room');
  assert.strictEqual(c.shotAt(23).scene, 'torii');
  assert.strictEqual(c.shotAt(50).scene, 'stage');
  assert.strictEqual(c.shotAt(58).scene, 'vhs');
  assert.strictEqual(c.shotAt(80).scene, 'street');
  assert.strictEqual(c.shotAt(175).loc, 'hall');
  assert.strictEqual(c.shotAt(184).scene, 'title');
  ['eat1', 'eat2', 'deck1', 'deck2', 'deck3', 'strips', 'mix'].forEach(l => assert.ok(c.shots.some(s => s.layout === l), l));
  const st = c.stage(50.3, c.shotAt(50.3));
  assert.ok(st.cast.some(a => a.id === 'melon' && !a.hidden));
  const src = fs.readFileSync(path.join(__dirname, '../js/apps/poligon/clip-neck-hurts.js'), 'utf8');
  assert.ok(!/miyabi|hoshimi|zenless|hoyo|section 6|bangboo|katana|famas/i.test(src));
});

test('visual-kei clip keeps the story beats and censors the worm', () => {
  const c = clips[3];
  assert.strictEqual(c.shotAt(38).cam, 'slam');
  assert.strictEqual(c.shotAt(66).cam, 'deadGiant');
  const censored = c.stage(101.5, c.shotAt(101.5));
  assert.ok(censored.bugs.some(bg => bg.kind === 'worm' && bg.censor));
  assert.ok(c.shots.some(s => s.strobe));
  const st = c.stage(12, c.shotAt(12));
  assert.ok(st.camera.fx && st.camera.fx.grain > 0);
  const src = fs.readFileSync(path.join(__dirname, '../js/apps/poligon/clip-tarakan.js'), 'utf8');
  assert.ok(!/kyo|dir en grey|diru/i.test(src));
  assert.ok(!/хуй|пизд|ебан|срут/i.test(src));
});

test('FunCover follows the song sections on the bar grid', () => {
  const c = clips[2];
  const at = (t) => c.shotAt(t);
  assert.strictEqual(at(12).cam, 'sofa');
  assert.strictEqual(at(52.9).cam, 'kart');
  assert.strictEqual(at(69).cam, 'mega');
  assert.strictEqual(at(142.5).cam, 'mega');
  assert.strictEqual(at(202).cam, 'row');
  assert.ok(c.voiceAt(2) === 0 && c.voiceAt(215) === 0);
  const src = fs.readFileSync(path.join(__dirname, '../js/apps/poligon/clip-vladik.js'), 'utf8');
  assert.ok(!/yordle|kiryu|majima|maxima|selga|baldur|don simon/i.test(src));
  assert.ok(Object.keys(c.looks).includes('vladik'));
});

test('shot lists cover each song in order', () => {
  clips.forEach(c => {
    const shots = c.shots;
    assert.strictEqual(shots[0].start, 0);
    assert.strictEqual(shots[shots.length - 1].end, c.duration);
    for (let i = 1; i < shots.length; i++) {
      assert.ok(shots[i].start > shots[i - 1].start, `${c.id} shot ${i} starts after shot ${i - 1}`);
      assert.strictEqual(shots[i - 1].end, shots[i].start);
    }
    c.locations.forEach(l => assert.ok(shots.some(s => s.loc === l.id), `${c.id} ${l.id}`));
  });
  assert.strictEqual(clip.shotAt(0).index, 0);
  assert.strictEqual(clip.shotAt(60.9).loc, 'arcade');
  assert.strictEqual(clip.shotAt(52).loc, 'bar');
  assert.strictEqual(clip.shotAt(999).index, clip.shots.length - 1);
});

test('every moment has a finite camera and finite poses', () => {
  clips.forEach(clip => {
  for (let t = 0; t < clip.duration; t += 0.13) {
    const shot = clip.shotAt(t);
    const st = clip.stage(t, shot);
    assert.ok(finite(st.camera.eye) && finite(st.camera.at), `camera at ${t.toFixed(2)} (${shot.loc}/${shot.cam})`);
    const dist = Math.hypot(st.camera.eye[0] - st.camera.at[0], st.camera.eye[1] - st.camera.at[1], st.camera.eye[2] - st.camera.at[2]);
    assert.ok(dist > 0.05, `camera looks somewhere at ${t.toFixed(2)}`);
    st.cast.forEach(a => {
      const f = st.focus[a.id];
      assert.ok(finite(f.head) && finite(f.hips), `${a.id} at ${t.toFixed(2)}`);
      const lift = a.pose.lift || 0;
      const tall = a.look === 'robot' ? 3.2 : 2.2;
      if (a.pose.ground !== false && a.pose.pivot === undefined) assert.ok(f.head[1] - lift > 0.6 && f.head[1] - lift < tall, `${clip.id} ${a.id} head height ${f.head[1].toFixed(2)} at ${t.toFixed(2)}`);
    });
    const shadowOnly = shot.cam.startsWith('shadow') && st.cast.some(a => a.shadow);
    const propsOnly = (st.cast.length === 0 && shot.scene === 'ident') || (st.bugs && st.bugs.length > 0) || shot.emptyOk;
    assert.ok(shadowOnly || propsOnly || st.cast.some(a => !a.hidden), `${clip.id} someone on screen at ${t.toFixed(2)}`);
  }
  });
});

test('PARANOIA uses the original band only and no lyrics on screen', () => {
  const c = clips[1];
  assert.deepStrictEqual(c.members.map(m => m.name), ['ЛЁВА', 'БО', 'МИРО', 'РЫЖИЙ', 'ТЕО', 'НИКО']);
  const src = fs.readFileSync(path.join(__dirname, '../js/apps/poligon/clip-paranoia.js'), 'utf8');
  assert.ok(!/(ezreal|kayn|aphelios|sett|yone|k'?sante|riot|league of legends)/i.test(src));
  assert.ok(src.includes("voxelWord(stageMesh, opts.word || 'PARANOIA'"));
  assert.ok(c.shots.some(s => s.overlay === 'rec' && s.grade));
});

test('singer lips move only while the vocal is on', () => {
  assert.strictEqual(clip.voiceAt(5), 0);
  assert.strictEqual(clip.voiceAt(210), 0);
  let open = 0;
  for (let t = 20; t < 60; t += 0.1) if (clip.voiceAt(t) > 0.3) open++;
  assert.ok(open > 40, `mouth opens in the first verse (${open})`);
});

test('fade in at start and fade out at the end', () => {
  assert.strictEqual(clip.fadeAt(0), 1);
  assert.strictEqual(clip.fadeAt(100), 0);
  assert.ok(clip.fadeAt(212.5) > 0.9);
});

test('page renders player, colored timeline and clip list', () => {
  const html = site.renderSite('http://www.poligon3d.ru');
  assert.ok(html.includes('pg-canvas'));
  assert.strictEqual((html.match(/class="pg-seg"/g) || []).length, clip.shots.length);
  clip.locations.forEach(l => assert.ok(html.includes(`data-loc="${l.id}"`), l.id));
  clips.forEach(c => assert.strictEqual(html.includes(`data-url="http://www.poligon3d.ru/clip/${c.id}"`), !c.hidden, c.id));
  assert.deepStrictEqual(shown.map(c => c.id), clips.filter(c => !c.hidden).map(c => c.id));
  clips.filter(c => c.hidden).forEach(c => assert.strictEqual(site.parseUrl(`http://www.poligon3d.ru/clip/${c.id}`), clip.id));
  const html2 = site.renderSite('http://www.poligon3d.ru/clip/heartsteel-paranoia');
  assert.ok(html2.includes('pg-row-on') && html2.includes(encodeURI(clips[1].audio)));
  assert.strictEqual((html2.match(/class="pg-seg"/g) || []).length, clips[1].shots.length);
  assert.ok(html.includes(encodeURI(clip.audio)));
  assert.strictEqual(site.parseUrl('http://www.poligon3d.ru/clip/unknown'), clip.id);
});

const clippySource = fs.readFileSync(path.join(__dirname, '..', 'js/apps/clippy.js'), 'utf8');
const AppClippy = eval(`${clippySource.replace('window.appClippy = new AppClippy();', '')}; AppClippy`);
const makeClippy = () => {
  const c = Object.create(AppClippy.prototype);
  c.spoken = [];
  c.opened = [];
  c.visible = true;
  c.annoyance = 'normal';
  c.activeAccessories = new Set();
  c.beat = null;
  c.charEl = {
    classList: { add: () => {}, remove: () => {} },
    style: { setProperty: (k, v) => { c.beat = v; }, removeProperty: () => { c.beat = null; } }
  };
  c.setAccessory = (name, on) => { if (on) c.activeAccessories.add(name); else c.activeAccessories.delete(name); };
  c.speak = (text, actions = [], mood = '') => c.spoken.push({ text, actions, mood });
  c.openInIE = (url) => c.opened.push(url);
  return c;
};
const fakePlayer = (c, state = 'paused') => ({
  clip: c,
  state,
  plays: 0,
  jumps: [],
  play() { this.plays++; this.state = 'playing'; },
  jumpTo(loc) { this.jumps.push(loc); }
});
const press = (reaction, label) => {
  const a = reaction.actions.find(x => x.text.includes(label));
  assert.ok(a, `no action "${label}"`);
  a.action();
};

test('Clippy greets every clip with its own line and can start it', () => {
  const texts = new Set();
  shown.forEach(c => {
    const clippy = makeClippy();
    site.player = fakePlayer(c);
    const r = clippy.poligonReaction();
    assert.ok(r && r.text && r.mood, c.id);
    assert.ok(r.text.includes(clippy.plural(c.shots.length - 1, 'склейка', 'склейки', 'склеек')), c.id);
    texts.add(r.text);
    press(r, 'Смотреть вместе');
    assert.strictEqual(site.player.plays, 1);
    assert.strictEqual(clippy.beat, `${(60 / c.bpm).toFixed(3)}s`);
    assert.ok(clippy.activeAccessories.has('headphones'));
    press(r, 'Другой клип');
    const menu = clippy.spoken[clippy.spoken.length - 1];
    assert.strictEqual(menu.actions.length, shown.length - 1);
    menu.actions[0].action();
    assert.ok(clippy.opened[0].startsWith('http://www.poligon3d.ru/clip/') && !clippy.opened[0].endsWith(c.id));
  });
  assert.strictEqual(texts.size, shown.length);
  site.player = null;
});

test('Clippy jumps to a random set, explains a missing 3D card and stays quiet without a player', () => {
  const clippy = makeClippy();
  site.player = fakePlayer(clip, 'playing');
  const r = clippy.poligonReaction();
  assert.ok(!r.actions.some(a => a.text.includes('Смотреть вместе')));
  press(r, 'Случайная сцена');
  assert.ok(clip.locations.some(l => l.id === site.player.jumps[0]));
  site.player = fakePlayer(clip, 'broken');
  const broken = clippy.poligonReaction();
  assert.ok(broken.text.includes('WebGL'));
  press(broken, '3D-ускоритель');
  assert.strictEqual(clippy.opened[0], 'http://www.3dfx-zone.com');
  site.player = null;
  assert.strictEqual(clippy.poligonReaction(), null);
  assert.ok(clippySource.includes("'poligon': () => this.poligonReaction()"));
});

test('Clippy stops dancing when the clip stops and offers the next clip at the end', () => {
  const clippy = makeClippy();
  const last = shown[shown.length - 1];
  site.player = fakePlayer(last, 'playing');
  clippy.syncListening();
  assert.ok(clippy.activeAccessories.has('headphones'));
  site.player.state = 'paused';
  clippy.syncListening();
  assert.ok(!clippy.activeAccessories.has('headphones'));
  assert.strictEqual(clippy.beat, null);
  clippy.onPoligonClipEnded(last);
  const end = clippy.spoken[0];
  press(end, 'Ещё раз');
  assert.strictEqual(site.player.plays, 1);
  press(end, 'Дальше');
  assert.strictEqual(clippy.opened[0], `http://www.poligon3d.ru/clip/${shown[0].id}`);
  const quiet = makeClippy();
  quiet.annoyance = 'quiet';
  quiet.onPoligonClipEnded(clip);
  assert.strictEqual(quiet.spoken.length, 0);
  site.player = null;
});

test('Clippy counts cuts and sets in correct Russian plural forms', () => {
  const c = makeClippy();
  const forms = ['склейка', 'склейки', 'склеек'];
  assert.strictEqual(c.plural(1, ...forms), '1 склейка');
  assert.strictEqual(c.plural(122, ...forms), '122 склейки');
  assert.strictEqual(c.plural(97, ...forms), '97 склеек');
  assert.strictEqual(c.plural(112, ...forms), '112 склеек');
  assert.strictEqual(c.plural(21, ...forms), '21 склейка');
});

test('player tells Clippy about the end of a clip once', () => {
  const el = () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, hidden: false, textContent: '', setAttribute() {}, pause() {}, lastChild: {} });
  const els = {};
  const root = { classList: el().classList, querySelector: (sel) => (els[sel] = els[sel] || el()), querySelectorAll: () => [] };
  global.cancelAnimationFrame = global.cancelAnimationFrame || (() => {});
  const ended = [];
  window.appClippy = { onPoligonClipEnded: (c) => ended.push(c.id) };
  const player = new window.PoligonPlayer(root, clip);
  player.state = 'playing';
  player.finish();
  player.finish();
  assert.deepStrictEqual(ended, [clip.id]);
  delete window.appClippy;
});

test('player volume slider sets the clip volume, mutes and remembers the level', () => {
  const html = site.renderSite('http://www.poligon3d.ru');
  assert.ok(html.includes('class="pg-vol-track') && html.includes('role="slider"') && html.includes('class="win-button pg-mute"'));
  const handlers = {};
  const el = (sel) => ({
    classList: { on: new Set(), add() {}, remove() {}, toggle(c, v) { if (v) this.on.add(c); else this.on.delete(c); } },
    style: { props: {}, setProperty(k, v) { this.props[k] = v; } },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(type, fn) { handlers[`${sel} ${type}`] = fn; },
    getBoundingClientRect: () => ({ left: 100, width: 64 }),
    hidden: false,
    textContent: '',
    innerHTML: ''
  });
  const els = {};
  const root = { classList: el('root').classList, querySelector: (sel) => (els[sel] = els[sel] || el(sel)), querySelectorAll: () => [] };
  window.webGif = (name) => `<gif ${name}>`;
  site.sound = { volume: 0.8, muted: false };
  const player = new window.PoligonPlayer(root, clip, site);
  player.bind();
  player.applySound();
  const audio = els['.pg-audio'];
  const track = els['.pg-vol-track'];
  const mute = els['.pg-mute'];
  assert.strictEqual(audio.volume, 0.8);
  assert.strictEqual(track.style.props['--pg-vol'], '80%');
  handlers['.pg-vol-track pointerdown']({ clientX: 100 + 16 });
  assert.strictEqual(audio.volume, 0.25);
  assert.strictEqual(track.attrs['aria-valuenow'], '25');
  handlers['.pg-vol-track keydown']({ key: 'ArrowRight', preventDefault() {} });
  assert.strictEqual(audio.volume, 0.3);
  handlers['.pg-mute click']();
  assert.strictEqual(audio.muted, true);
  assert.ok(mute.innerHTML.includes('mute') && track.classList.on.has('pg-vol-off'));
  handlers['.pg-vol-track keydown']({ key: 'End', preventDefault() {} });
  assert.ok(audio.volume === 1 && audio.muted === false);
  assert.deepStrictEqual(JSON.parse(localStorage.getItem('poligon3d')), { volume: 1, muted: false });
  handlers['.pg-vol-track keydown']({ key: 'Home', preventDefault() {} });
  handlers['.pg-mute click']();
  assert.ok(audio.volume === 0.8 && audio.muted === false);
  localStorage.setItem('poligon3d', JSON.stringify({ volume: 0.35, muted: true }));
  assert.deepStrictEqual(site.loadSound(), { volume: 0.35, muted: true });
  localStorage.setItem('poligon3d', '{"volume":7}');
  assert.deepStrictEqual(site.loadSound(), { volume: 0.8, muted: false });
  delete window.webGif;
});

test('no comments in the new sources', () => {
  ['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js', 'js/apps/poligon/clip-never-gonna.js', 'js/apps/poligon/clip-paranoia.js', 'js/apps/poligon/clip-vladik.js', 'js/apps/poligon/clip-tarakan.js', 'js/apps/poligon/clip-neck-hurts.js', 'js/apps/poligon/clip-war-song.js', 'js/apps/poligon-site.js', 'css/apps/poligon-site.css'].forEach(rel => {
    const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    assert.ok(!/\/\*[\s\S]*?\*\//.test(src), `${rel} has a block comment`);
    assert.ok(!/(^|[^:'"])\/\/\s/m.test(src), `${rel} has a line comment`);
  });
});

console.log(`poligon-site: ${passed} tests passed`);
