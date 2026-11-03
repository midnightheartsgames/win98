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
load('js/apps/poligon/ccc-cast.js');
load('js/apps/poligon/clip-ccc.js');
load('js/apps/poligon/gk-cast.js');
load('js/apps/poligon/clip-god-knows.js');
load('js/apps/poligon/uts-cast.js');
load('js/apps/poligon/clip-uhn-tiss.js');
load('js/apps/poligon/step-cast.js');
load('js/apps/poligon/clip-step.js');
load('js/apps/poligon/radio-cast.js');
load('js/apps/poligon/clip-radio-star.js');
load('js/apps/poligon/rc-cast.js');
load('js/apps/poligon/clip-romeo.js');
load('js/apps/poligon/hello-cast.js');
load('js/apps/poligon/clip-hello.js');
load('js/apps/poligon/stories.js');
load('js/apps/poligon-site.js');
load('js/apps/ie.js');

const site = window.poligonSite;
const clips = window.poligonClips;
const byId = (id) => clips.find(c => c.id === id);
const clip = byId('never-gonna-give-you-up');
const shown = site.clips();
const first = shown[0];
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
  load('js/apps/poligon/clip-ccc.js');
  load('js/apps/poligon/clip-god-knows.js');
  load('js/apps/poligon/clip-uhn-tiss.js');
  load('js/apps/poligon/clip-step.js');
  load('js/apps/poligon/clip-radio-star.js');
  load('js/apps/poligon/clip-romeo.js');
  load('js/apps/poligon/clip-hello.js');
  assert.deepStrictEqual(clips.map(c => c.number), [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13]);
  assert.strictEqual(clips[0].id, 'video-killed-the-radio-star');
  clips.forEach(c => {
    const mp3 = path.join(__dirname, '..', c.audio);
    assert.ok(fs.existsSync(mp3), mp3);
  });
  const length = (id) => byId(id).duration;
  assert.ok(Math.abs(length('never-gonna-give-you-up') - 213.09) < 0.5);
  assert.ok(Math.abs(length('heartsteel-paranoia') - 224.05) < 0.5);
  assert.ok(Math.abs(length('vladik-v-depressii') - 218.36) < 0.5);
  assert.ok(Math.abs(length('tarakan-i-chervyachok') - 257.6) < 0.5);
  assert.ok(Math.abs(length('neck-hurts') - 185.78) < 0.5);
  assert.ok(Math.abs(length('war-song') - 164.0) < 0.05);
  assert.ok(Math.abs(length('cosplay-convention-crisis') - 180.77) < 0.05);
  assert.ok(Math.abs(length('god-knows') - 241.88) < 0.05);
  assert.ok(Math.abs(length('uhn-tiss') - 263.73) < 0.05);
  assert.ok(Math.abs(length('step') - 133.0) < 0.05);
  assert.ok(Math.abs(length('video-killed-the-radio-star') - 201.22) < 0.05);
  assert.ok(Math.abs(length('romeo-and-cinderella') - 280.38) < 0.05);
  assert.ok(Math.abs(length('hello') - 173.55) < 0.05);
});

test('Video Killed The Radio Star opens the clip list and follows the cut list of the 1979 video', () => {
  const c = byId('video-killed-the-radio-star');
  assert.strictEqual(first.id, c.id);
  assert.strictEqual(site.parseUrl('http://www.poligon3d.ru'), c.id);
  assert.strictEqual(c.number, 11);
  assert.strictEqual(Math.round(c.bpm), 131);
  assert.strictEqual(c.shots.length, 60);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(5), 'moonRise');
  assert.strictEqual(cam(22), 'radio');
  assert.strictEqual(cam(35), 'face1');
  assert.strictEqual(cam(54), 'boom1');
  assert.strictEqual(cam(65), 'future');
  assert.strictEqual(cam(68), 'reels');
  assert.strictEqual(cam(95), 'singerClose');
  assert.strictEqual(cam(120), 'climb');
  assert.strictEqual(cam(127.5), 'twinsClose');
  assert.strictEqual(cam(150), 'tvLong');
  assert.strictEqual(cam(161), 'flyUp');
  assert.strictEqual(cam(164), 'breach');
  assert.strictEqual(cam(198), 'finale');
  const st = (t) => c.stage(t, c.shotAt(t));
  assert.strictEqual(st(22).poster.mode, 'left');
  assert.ok(st(22).poster.alpha > 0.9 && st(22).cast[0].form === 'rsGirl');
  assert.strictEqual(st(50.5).poster.mode, 'duet');
  assert.strictEqual(st(40).poster.mode, 'right');
  assert.ok(st(30).glow > 0.9 && st(45).glow > 0.9 && !st(40).glow, 'the radio glows orange');
  assert.ok(st(53.8).boom && !st(56).radio, 'the radio explodes');
  assert.strictEqual(st(65).cast[0].form, 'rsSilver');
  assert.deepStrictEqual(st(185).cast.map(a => a.form), ['rsKeysSilver', 'rsSingerStudio', 'rsSynth', 'rsSilver']);
  assert.ok(st(185).cast.find(a => a.id === 'singer').props.some(p => p.id === 'rsBass'));
  assert.ok(st(87).tv === 'twins' && st(109.5).tv === 'wheel');
  assert.ok(st(150).poster.alpha > 0.9 && st(155).swap > 0.9, 'the poster face flashes over the TV, then the keys take the screen');
  assert.strictEqual(st(164).area, 'breach');
  const silverY = (t) => st(t).cast.find(a => a.id === 'silver').pose.y;
  assert.ok(silverY(75) > silverY(77), 'the woman sinks into the tube');
  assert.ok(silverY(163) > 3, 'the woman flies out of the tube');
  assert.ok(c.flashAt(53.42) > 0.9 && c.flashAt(100) === 0, 'white flash on the explosion');
  assert.ok(c.whiteAt(199.2) > 0.99 && c.whiteAt(190) === 0 && c.fadeAt(201.2) > 0.9);
  let solo = 0, choir = 0;
  for (let t = 18.6; t < 28.6; t += 0.1) if (c.mouthFor('singer', t) > 0.2) solo++;
  for (let t = 126.9; t < 133.3; t += 0.1) if (c.mouthFor('twin', t) > 0.2) choir++;
  assert.ok(solo > 50, `the singer sings the first verse (${solo})`);
  assert.ok(choir > 30, `the twins sing the chorus (${choir})`);
  assert.strictEqual(c.mouthFor('singer', 10), 0);
  assert.strictEqual(c.mouthFor('twin', 22), 0);
  assert.strictEqual(c.mouthFor('singer', 115), 0);
  const src = ['clip-radio-star.js', 'radio-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/wireless|fifty.two|second symphony|abandoned studio|pictures came|put the blame/i.test(src));
  assert.ok(!/\btrevor\b|\bhorn\b|\bdownes\b|\bzimmer\b/i.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
  assert.strictEqual((src.match(/Buggles/g) || []).length, 2);
});

test('Video Killed The Radio Star moves its cast smoothly from frame to frame', () => {
  const c = byId('video-killed-the-radio-star');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  let prev = null, prevShot = -1;
  for (let t = 0; t < c.duration; t += 1 / 60) {
    const shot = c.shotAt(t);
    const cur = {};
    c.stage(t, shot).cast.forEach(a => { cur[a.id] = a; });
    if (prev && shot.index === prevShot) {
      Object.keys(cur).forEach(id => {
        const a = cur[id], b = prev[id];
        if (!b) return;
        joints.forEach(j => [0, 1, 2].forEach(k => {
          const d = Math.abs(a.pose[j][k] - b.pose[j][k]);
          if (d > worst.d) worst = { d, at: `${id}.${j} ${t.toFixed(2)}` };
        }));
        assert.ok(Math.abs(a.pose.ry - b.pose.ry) < 0.2, `${id} turns too fast at ${t.toFixed(2)}`);
        const moved = Math.hypot(a.hips[0] - b.hips[0], a.hips[1] - b.hips[1], a.hips[2] - b.hips[2]);
        assert.ok(moved < 0.04, `${id} hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
      });
    }
    prev = cur;
    prevShot = shot.index;
  }
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
});

test('Cosplay Convention Crisis cuts on the 130 BPM grid and follows the song sections', () => {
  const c = clips.find(x => x.id === 'cosplay-convention-crisis');
  assert.strictEqual(c.bpm, 130);
  assert.strictEqual(c.shots.length, 75);
  const camLoc = {};
  c.shots.forEach(s => { assert.ok(!camLoc[s.cam] || camLoc[s.cam] === s.loc, `camera ${s.cam} used in two places`); camLoc[s.cam] = s.loc; });
  c.shots.slice(1).forEach(s => {
    const n = Math.round(((s.start - 0.026) * 130) / 60);
    assert.ok(Math.abs(s.start - (0.026 + (n * 60) / 130)) < 0.002, `shot ${s.index} on a beat`);
  });
  const at = (t) => c.shotAt(t);
  assert.strictEqual(at(16).loc, 'bus');
  assert.strictEqual(at(46).cam, 'amandaSheet');
  assert.strictEqual(at(69).cam, 'redflash');
  assert.strictEqual(at(80).cam, 'moths');
  assert.strictEqual(at(97).scene, 'disco');
  assert.strictEqual(at(120).cam, 'tube');
  assert.strictEqual(at(134).cam, 'corners');
  assert.strictEqual(at(150).loc, 'stage');
  assert.strictEqual(at(170).cam, 'one');
  assert.strictEqual(at(176).cam, 'coda');
  const ids = (t) => c.stage(t).cast.filter(a => !a.hidden).map(a => a.id);
  ['amanda', 'makoto', 'talleah'].forEach(id => assert.ok(ids(57).includes(id), id));
  assert.ok(ids(70).includes('makoto') && ids(70).includes('talleah'));
  assert.strictEqual(c.stage(82).cast.find(a => a.id === 'amanda').form, 'amandaPink');
  assert.strictEqual(c.stage(119.5).cast.find(a => a.id === 'talleah').pose.ground, false);
  const lit = (t) => c.stage(t).cast.filter(a => !a.sil).map(a => a.id);
  assert.strictEqual(lit(6.0).length, 1);
  assert.strictEqual(lit(166).length, 0);
  assert.ok(c.stage(166).cast.every(a => a.glow));
  assert.strictEqual(lit(172.8).length, 3);
  assert.ok(c.stage(172.8).fx.polaroid > 0.9);
  const hallAt = (t) => c.stage(t);
  assert.strictEqual(hallAt(69.7).cast.find(a => a.id === 'g1').pose.ground, false);
  assert.ok(hallAt(69.25).bolts.some(b => b.from === 'makoto' && b.to === 'g1'));
  assert.strictEqual(hallAt(68.5).cast.find(a => a.id === 'makoto').form, 'makotoSchool');
  assert.strictEqual(hallAt(69.0).cast.find(a => a.id === 'makoto').form, 'makotoCat');
  assert.strictEqual(hallAt(126.5).cast.find(a => a.id === 'talleah').form, 'talleahKnight');
  assert.strictEqual(hallAt(127.4).cast.find(a => a.id === 'talleah').form, 'talleahWitch');
  assert.strictEqual(hallAt(129.0).cast.find(a => a.id === 'talleah').form, 'talleahRanger');
  assert.ok(hallAt(125.3).sideDoor > 1);
  assert.ok(hallAt(80.9).moths.cocoon > 0.8);
  assert.strictEqual(hallAt(103.2).hall.mood, 'dark');
  assert.ok(c.stage(75).camera.grade && c.stage(75).camera.fx.grain > 0);
  assert.strictEqual(c.stage(93.2).treasure.at, 'pedestal');
  assert.strictEqual(c.stage(93.9).treasure.at, 'makoto');
  assert.ok(c.stage(95.2).portal.k > 0.5);
  assert.ok(c.stage(95.9).cast.find(a => a.id === 'makoto').hidden);
  assert.ok(c.stage(97).cast.filter(a => a.base).length >= 12);
  assert.ok(c.stage(118.1).iris > 0.5);
  assert.strictEqual(c.stage(119).tubeState.liquid, 1);
  assert.strictEqual(c.stage(119).cast.find(a => a.id === 'talleah').pose.face, 'sleep');
  assert.ok(c.stage(123.4).fx.squeeze > 0.5);
  assert.ok(c.stage(116).cast.filter(a => a.form === 'gynoid').length >= 15);
  assert.strictEqual(c.stage(152.2).bolts.length, 3);
  assert.ok(c.stage(154).fireworks.length >= 3);
  assert.ok(c.stage(157).cast.filter(a => ['amanda', 'makoto', 'talleah'].includes(a.id)).every(a => a.pose.z > -5));
  assert.ok(c.mouthFor('trio', 157) > 0);
  assert.strictEqual(c.mouthFor('trio', 30), 0);
  assert.strictEqual(c.mouthFor('trio', 170), 0);
  assert.ok(c.voiceAt(1) === 0 && c.voiceAt(30) > 0.3);
  const src = ['clip-ccc.js', 'ccc-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/steal your heart|tear you apart|space girl|sweet surprises|convention center|childhood friend|temptress|laid eyes/i.test(src));
  assert.ok(!/green lantern|starfire|lum|samus|magneto|captain america|phoenix|teen titans|deadpool|harley|thanos|daft punk|bowser/i.test(src));
  assert.ok(!/microsoft|windows|fuck|shit/i.test(src));
});

test('God knows follows the cut list of the concert scene, plays to the drum hits and sings on the vocal', () => {
  const c = clips.find(x => x.id === 'god-knows');
  assert.strictEqual(c.number, 8);
  assert.strictEqual(Math.round(c.bpm), 150);
  assert.strictEqual(c.shots.length, 62);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(0.5), 'back');
  assert.strictEqual(cam(5), 'wide');
  assert.strictEqual(cam(20), 'profile');
  assert.strictEqual(cam(66), 'kyon');
  assert.strictEqual(cam(106), 'shout');
  assert.strictEqual(cam(143), 'yukiLow2');
  assert.strictEqual(cam(178), 'smile');
  assert.strictEqual(cam(195), 'arms');
  assert.strictEqual(c.shotAt(205).loc, 'rain');
  assert.strictEqual(cam(235), 'school');
  const st = (t) => c.stage(t, c.shotAt(t));
  const cast = (t) => st(t).cast;
  const band = cast(5);
  assert.deepStrictEqual(['haruhi', 'yuki', 'mizuki', 'mai'].map(id => band.find(a => a.id === id).form), ['haruhiBunny', 'yukiWitch', 'mizukiBass', 'maiDrums']);
  assert.ok(band.find(a => a.id === 'haruhi').props.some(p => p.id === 'gtrHaruhi'));
  assert.ok(band.find(a => a.id === 'yuki').props.some(p => p.id === 'gtrYuki'));
  assert.ok(band.find(a => a.id === 'mizuki').props.some(p => p.id === 'bass'));
  assert.ok(cast(0.5).find(a => a.id === 'haruhi').pose.ry > 3, 'Haruhi faces the drummer for the count-in');
  const mai = band.find(a => a.id === 'mai');
  assert.strictEqual(mai.sticks.length, 2);
  mai.sticks.forEach(s => assert.ok(finite(s.hand) && finite(s.tip)));
  const wristR = (t) => cast(t).find(a => a.id === 'haruhi').pose.elR[0];
  const seen = new Set();
  for (let t = 20; t < 20.4; t += 0.05) seen.add(wristR(t).toFixed(2));
  assert.ok(seen.size > 3, 'Haruhi strums');
  assert.strictEqual(c.mouthFor('haruhi', 10), 0);
  assert.strictEqual(c.mouthFor('yuki', 20), 0);
  let open = 0;
  for (let t = 16.2; t < 28.5; t += 0.1) if (c.mouthFor('haruhi', t) > 0.2) open++;
  assert.ok(open > 50, `Haruhi sings the first verse (${open})`);
  assert.strictEqual(cast(106).find(a => a.id === 'haruhi').pose.face, 'shout');
  assert.strictEqual(cast(106).find(a => a.id === 'yuki').pose.face, 'blank');
  assert.ok(['smile', 'beam', 'say', 'sing', 'wink'].includes(cast(176.6).find(a => a.id === 'haruhi').pose.face));
  const kyon = cast(195).find(a => a.id === 'kyon');
  assert.ok(kyon.props.some(p => p.id === 'finger'));
  assert.ok(cast(186).filter(a => !a.hidden).length >= 8);
  assert.ok(c.shots.filter(s => s.loc === 'rain').every(s => s.emptyOk || s.cam === 'stalls'));
  assert.ok(c.energyAt(70) > c.energyAt(20) && c.energyAt(165) < c.energyAt(178));
  const src = ['clip-god-knows.js', 'gk-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/kawaita|kakenukete|yami no naka|ikutsu mo|kokoro de/i.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
});

test('God knows moves the band and the crowd smoothly from frame to frame', () => {
  const c = clips.find(x => x.id === 'god-knows');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  [[1, 8], [28.5, 36], [140, 149], [183, 186]].forEach(([t0, t1]) => {
    let prev = null, prevShot = -1;
    for (let t = t0; t < t1; t += 1 / 60) {
      const shot = c.shotAt(t);
      const cur = {};
      c.stage(t, shot).cast.forEach(a => { cur[a.id] = a; });
      if (prev && shot.index === prevShot) {
        Object.keys(cur).forEach(id => {
          const a = cur[id], b = prev[id];
          if (!b) return;
          joints.forEach(j => [0, 1, 2].forEach(k => {
            const d = Math.abs((a.pose[j] || [0, 0, 0])[k] - (b.pose[j] || [0, 0, 0])[k]);
            if (d > worst.d) worst = { d, at: `${id}.${j} ${t.toFixed(2)}` };
          }));
          const moved = Math.hypot(a.hips[0] - b.hips[0], a.hips[1] - b.hips[1], a.hips[2] - b.hips[2]);
          assert.ok(moved < 0.02, `${id} hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
        });
      }
      prev = cur;
      prevShot = shot.index;
    }
  });
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
});

test('Uhn Tiss follows the cut list of the club video and stages the stall gag for all ages', () => {
  const c = clips.find(x => x.id === 'uhn-tiss');
  assert.strictEqual(c.number, 9);
  assert.strictEqual(c.bpm, 135);
  assert.strictEqual(c.shots.length, 151);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(1), 'lipsIntro');
  assert.strictEqual(cam(3), 'sign');
  assert.strictEqual(cam(46), 'close1');
  assert.strictEqual(cam(60), 'drums1');
  assert.strictEqual(cam(85), 'peek1');
  assert.strictEqual(cam(102), 'creamFace');
  assert.strictEqual(cam(138), 'clerk2');
  assert.strictEqual(cam(172), 'lips1');
  assert.strictEqual(cam(200), 'swap');
  assert.strictEqual(cam(211), 'dogEye');
  assert.strictEqual(cam(229), 'tongue');
  assert.strictEqual(cam(259), 'carpet');
  assert.strictEqual(c.shotAt(259).scene, 'street');
  assert.ok(c.shots.filter(s => s.loc === 'stall').length > 50);
  const st = (t) => c.stage(t, c.shotAt(t));
  const ids = (t) => st(t).cast.map(a => a.id);
  ['hero', 'guitar', 'bass', 'dj', 'drum'].forEach(id => assert.ok(ids(50.5).includes(id), id));
  assert.deepStrictEqual(['hero', 'guitar', 'bass', 'dj', 'drum'].map(id => st(50.5).cast.find(a => a.id === id).form), ['utsHero', 'utsGuitar', 'utsBass', 'utsDj', 'utsDrum']);
  assert.ok(st(61.8).cast.find(a => a.id === 'guitar').props.some(p => p.id === 'utsArrow'));
  assert.strictEqual(st(61.8).cast.find(a => a.id === 'drum').sticks.length, 2);
  const peek = st(85.3).cast.find(a => a.id === 'hero');
  assert.ok(peek.head[0] < 1.0 && Math.hypot(peek.head[1] - 1.12, peek.head[2] + 0.75) < 0.12, 'the hero peeks from his own side of the partition');
  assert.strictEqual(st(196.2).cast.find(a => a.id === 'hero').pose.face, 'kiss');
  assert.ok(st(115.2).hole && st(115.2).cast[0].id === 'girl');
  assert.strictEqual(st(138.5).cast.find(a => a.id === 'clerk').form, 'utsClerkHero');
  assert.ok(st(172).macro === 'lips' && st(172).cast.length === 0);
  const swap = c.swapState;
  assert.ok(swap(1.5).girl && !swap(1.5).dog);
  assert.ok(!swap(4.6).girl && swap(4.6).dog.z < 0.75);
  assert.strictEqual(swap(6.5).door, 0);
  assert.ok(st(200.5).cast.some(a => a.id === 'girl'));
  assert.strictEqual(st(203).dogs.length, 1);
  assert.strictEqual(st(259).dogs.length, 1);
  let open = 0;
  for (let t = 46; t < 60; t += 0.1) if (c.mouthFor('hero', t) > 0.2) open++;
  assert.ok(open > 60, `the hero sings the first verse (${open})`);
  assert.strictEqual(c.mouthFor('hero', 20), 0);
  assert.ok(c.mouthFor('girl', 1.0) > 0 || c.mouthFor('girl', 1.4) > 0);
  assert.strictEqual(c.mouthFor('girl', 50), 0);
  assert.ok(c.flashAt(43.1) > 0.5 && c.flashAt(80) === 0);
  assert.ok(c.energyAt(180) > c.energyAt(10));
  const src = ['clip-uhn-tiss.js', 'uts-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/jimmy pop|evil jared|lupus thunder|q-ball|willie the new guy/i.test(src));
  assert.ok(!/wiper room|viper room|regret|superman/i.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
  assert.strictEqual((src.match(/Bloodhound Gang/g) || []).length, 2);
});

test('Uhn Tiss moves the band, the regulars and the dog smoothly from frame to frame', () => {
  const c = clips.find(x => x.id === 'uhn-tiss');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  [[45, 62], [84, 90], [123, 130], [196, 206], [241.8, 250]].forEach(([t0, t1]) => {
    let prev = null, prevShot = -1;
    for (let t = t0; t < t1; t += 1 / 60) {
      const shot = c.shotAt(t);
      const cur = {};
      c.stage(t, shot).cast.forEach(a => { cur[a.id] = a; });
      if (prev && shot.index === prevShot) {
        Object.keys(cur).forEach(id => {
          const a = cur[id], b = prev[id];
          if (!b) return;
          joints.forEach(j => [0, 1, 2].forEach(k => {
            const d = Math.abs((a.pose[j] || [0, 0, 0])[k] - (b.pose[j] || [0, 0, 0])[k]);
            if (d > worst.d) worst = { d, at: `${id}.${j} ${t.toFixed(2)}` };
          }));
          assert.ok(Math.abs(a.pose.ry - b.pose.ry) < 0.2, `${id} turns too fast at ${t.toFixed(2)}`);
          const moved = Math.hypot(a.hips[0] - b.hips[0], a.hips[1] - b.hips[1], a.hips[2] - b.hips[2]);
          assert.ok(moved < 0.04, `${id} hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
        });
      }
      prev = cur;
      prevShot = shot.index;
    }
  });
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
  let last = null;
  for (let ts = 2.8; ts < 6.5; ts += 1 / 60) {
    const d = c.swapState(ts).dog;
    if (d && last) assert.ok(Math.hypot(d.x - last.x, d.z - last.z) < 0.05 && Math.abs(d.walk - last.walk) < 0.1, `the dog jumps at ${ts.toFixed(2)}`);
    last = d;
  }
});

test('Step! follows the cut list of the live video and keeps Mio alone on the candy stage', () => {
  const c = clips.find(x => x.id === 'step');
  assert.strictEqual(c.number, 10);
  assert.strictEqual(c.bpm, 106);
  assert.strictEqual(c.shots.length, 61);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(1), 'open');
  assert.strictEqual(cam(5), 'point');
  assert.strictEqual(cam(15), 'fingers');
  assert.strictEqual(cam(30.8), 'title');
  assert.strictEqual(cam(46.6), 'screen1');
  assert.strictEqual(cam(60.5), 'arena1');
  assert.strictEqual(cam(85), 'topDown');
  assert.strictEqual(cam(88), 'tPose');
  assert.strictEqual(cam(94.5), 'salute');
  assert.strictEqual(cam(103), 'pushScreen');
  assert.strictEqual(cam(110), 'arena3');
  assert.strictEqual(cam(130), 'bye');
  const st = (t) => c.stage(t, c.shotAt(t));
  assert.deepStrictEqual(st(20).cast.map(a => a.form), ['mioStep']);
  assert.ok(st(1).up < 0.01 && st(3.2).up > 0.99, 'the stage lights come on after the dark intro');
  assert.strictEqual(st(33).screen, 'sky');
  assert.ok(st(33).title > 0.9 && !st(50).title, 'the title letters stay on the sky screen');
  assert.strictEqual(st(46.6).screen, 'live');
  assert.strictEqual(st(101).screen, 'orange');
  assert.strictEqual(st(103.5).screen, 'live');
  assert.strictEqual(st(64).light, 'night');
  assert.strictEqual(st(64.8).light, 'day');
  assert.strictEqual(st(90).light, 'night');
  assert.strictEqual(st(60.5).light, 'arena');
  assert.ok(c.flashAt(41.85) > 0.95 && c.flashAt(105) > 0.95 && c.flashAt(60) === 0 && c.flashAt(130) > 0.4);
  assert.strictEqual(c.moveAt(15), 'fingers');
  assert.strictEqual(c.moveAt(88), 'tPose');
  assert.strictEqual(c.moveAt(94), 'salute');
  assert.strictEqual(c.moveAt(128), 'bye');
  const r0 = c.rootAt(26), r1 = c.rootAt(28);
  assert.ok(Math.hypot(r1.x - r0.x, r1.z - r0.z) > 1.5, 'she walks down the floor');
  assert.ok(Math.abs(c.rootAt(38.6).ry - Math.PI * 2) < 0.01, 'she spins once under the sky screen');
  assert.ok(st(51.5).cast[0].pose.face.startsWith('happy'));
  assert.ok(st(128).cast[0].pose.face.startsWith('wink'));
  let open = 0;
  for (let t = 12.8; t < 21; t += 0.1) if (c.mouthFor('mio', t) > 0.2) open++;
  assert.ok(open > 50, `Mio sings the first verse (${open})`);
  assert.strictEqual(c.mouthFor('mio', 5), 0);
  assert.strictEqual(c.mouthFor('mio', 84), 0);
  assert.ok(c.energyAt(35) > c.energyAt(15) && c.energyAt(90) < c.energyAt(110));
  const src = ['clip-step.js', 'step-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/精一杯|目一杯/.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
});

test('Step! dances smoothly from frame to frame', () => {
  const c = clips.find(x => x.id === 'step');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  let prev = null, prevShot = -1;
  for (let t = 0; t < c.duration; t += 1 / 60) {
    const shot = c.shotAt(t);
    const a = c.stage(t, shot).cast[0];
    if (prev && shot.index === prevShot) {
      joints.forEach(j => [0, 1, 2].forEach(k => {
        const d = Math.abs(a.pose[j][k] - prev.pose[j][k]);
        if (d > worst.d) worst = { d, at: `${j} ${t.toFixed(2)}` };
      }));
      assert.ok(Math.abs(a.pose.ry - prev.pose.ry) < 0.2, `Mio turns too fast at ${t.toFixed(2)}`);
      const moved = Math.hypot(a.hips[0] - prev.hips[0], a.hips[1] - prev.hips[1], a.hips[2] - prev.hips[2]);
      assert.ok(moved < 0.04, `Mio's hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
    }
    prev = a;
    prevShot = shot.index;
  }
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
});

test('Romeo and Cinderella follows the cut list of the PV and changes outfits like the module edit', () => {
  const c = byId('romeo-and-cinderella');
  assert.strictEqual(c.number, 12);
  assert.strictEqual(c.bpm, 170);
  assert.strictEqual(c.shots.length, 118);
  const cam = (t) => c.shotAt(t).cam;
  assert.strictEqual(cam(0.5), 'glassOpen');
  assert.strictEqual(cam(15), 'title');
  assert.strictEqual(cam(42), 'shh');
  assert.strictEqual(cam(100), 'townPan');
  assert.strictEqual(cam(192), 'kneelSwap');
  assert.strictEqual(cam(270), 'topSpin');
  assert.strictEqual(cam(279), 'finale');
  const form = (t) => c.costumeAt(t).form;
  [[8, 'mikuScarlet'], [12, 'mikuSundress'], [30, 'mikuBride'], [60, 'mikuBlack'], [75, 'mikuSleek'], [85, 'mikuAppend'], [100, 'mikuSuit'], [120, 'mikuSanta'],
    [145, 'mikuSundress'], [160, 'mikuGothic'], [170, 'mikuPunk'], [185, 'mikuGothic'], [200, 'mikuMint'], [230, 'mikuAppend'], [240, 'mikuPunk'], [260, 'mikuScarlet']]
    .forEach(([t, f]) => assert.strictEqual(form(t), f, `outfit at ${t}`));
  assert.strictEqual(new Set(c.costumes.map(x => x[1])).size, 11);
  const mid = c.costumeAt(51.1);
  assert.ok(mid.prev === 'mikuBride' && mid.form === 'mikuBlack' && mid.mix > 0.3 && mid.mix < 0.7, 'the bride dissolves into the black dress');
  assert.strictEqual(c.costumeAt(109.8).prev, null, 'the Santa coat comes on a hard cut');
  const st = (t) => c.stage(t, c.shotAt(t));
  assert.deepStrictEqual(st(26).cast.map(a => a.id), ['miku']);
  assert.ok(st(15).title > 0.9 && !st(25).title, 'the title card shows only over the tower');
  assert.ok(st(48).glass > 0.9 && st(26).glass < 0.5, 'the rose window glows in the wide shots');
  assert.ok(st(195).cast[0].head[1] < 1.15 && st(26).cast[0].head[1] > 1.35, 'Miku kneels in the bridge');
  const sing = st(8.6);
  const toHead = Math.hypot(...[0, 1, 2].map(i => sing.mic.top[i] - sing.cast[0].head[i]));
  assert.ok(toHead < 0.35, `the rose microphone sits at her mouth (${toHead.toFixed(2)})`);
  const staff = st(15);
  assert.ok(staff.mic.bottom[1] < 0.05, 'the stand rests on the floor');
  assert.strictEqual(c.moveAt(42), 'shh');
  assert.ok(Math.abs(c.rootAt(39.9).ry - Math.PI * 2) < 0.01, 'the bride spins once');
  assert.ok(c.rootAt(278.2).z < -2, 'Miku walks back to the clock at the end');
  assert.ok(c.fadeAt(279) === 1 && c.fadeAt(270) === 0);
  let open = 0;
  for (let t = 24.5; t < 34; t += 0.1) if (c.mouthFor('miku', t) > 0.2) open++;
  assert.ok(open > 40, `Miku sings the first verse (${open})`);
  assert.strictEqual(c.mouthFor('miku', 16), 0);
  assert.strictEqual(c.mouthFor('miku', 100), 0);
  const src = ['clip-romeo.js', 'rc-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/higeki|tsuredashite|garasu no kutsu|ookami|watashi no koi/i.test(src));
  assert.ok(!/悲劇|連れ出して|ガラスの靴|狼/.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
});

test('Romeo and Cinderella moves Miku, her twin tails and the stand smoothly', () => {
  const c = byId('romeo-and-cinderella');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  let prev = null, prevShot = -1;
  for (let t = 0; t < c.duration; t += 1 / 60) {
    const shot = c.shotAt(t);
    const a = c.stage(t, shot).cast[0];
    if (prev && shot.index === prevShot) {
      joints.forEach(j => [0, 1, 2].forEach(k => {
        const d = Math.abs(a.pose[j][k] - prev.pose[j][k]);
        if (d > worst.d) worst = { d, at: `${j} ${t.toFixed(2)}` };
      }));
      assert.ok(Math.abs(a.pose.ry - prev.pose.ry) < 0.2, `Miku turns too fast at ${t.toFixed(2)}`);
      const moved = Math.hypot(a.hips[0] - prev.hips[0], a.hips[1] - prev.hips[1], a.hips[2] - prev.hips[2]);
      assert.ok(moved < 0.04, `Miku's hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
    }
    prev = a;
    prevShot = shot.index;
  }
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
  [[38.4, 40.2], [140.8, 141.7], [190.4, 192.6], [254.5, 256], [268.9, 273]].forEach(([a, b]) => {
    let last = null;
    for (let t = a; t < b; t += 1 / 60) {
      const tails = c.tailsAt(t);
      [tails[0], tails[1]].forEach(pts => pts.forEach(p => assert.ok(finite(p) && p[1] > 0.005, `tail point at ${t.toFixed(2)}`)));
      for (let k = 1; k < tails[0].length; k++) {
        const seg = Math.hypot(...[0, 1, 2].map(i => tails[0][k][i] - tails[0][k - 1][i]));
        assert.ok(seg < 0.12, `tail segment stretches at ${t.toFixed(2)}`);
      }
      if (last && c.shotAt(t).index === c.shotAt(t - 1 / 60).index) {
        const tip = tails[0][tails[0].length - 1], was = last[0][last[0].length - 1];
        assert.ok(Math.hypot(tip[0] - was[0], tip[1] - was[1], tip[2] - was[2]) < 0.2, `tail tip jumps at ${t.toFixed(2)}`);
      }
      last = tails;
    }
  });
});

test('Hello follows the cut list of the video with an original cast and no tour card', () => {
  const c = byId('hello');
  assert.strictEqual(c.number, 13);
  assert.strictEqual(c.artist, 'Kalifarniya');
  assert.strictEqual(c.bpm, 102);
  assert.strictEqual(c.shots.length, 61);
  const cam = (t) => c.shotAt(t).cam;
  [[2, 'name'], [6, 'ident'], [12, 'leanCar'], [20, 'hood1'], [25, 'rear1'], [35, 'chin'], [48, 'selfie'], [58, 'walkIn'], [64, 'line1'], [72, 'air1'], [78, 'standUp1'],
    [97, 'frame'], [100, 'selfieCam'], [121, 'photo'], [128, 'hands'], [134, 'run'], [148, 'whip'], [153, 'couple1'], [158, 'couple2'], [163, 'finale'], [170, 'air3']]
    .forEach(([t, name]) => assert.strictEqual(cam(t), name, `shot at ${t}`));
  assert.deepStrictEqual(new Set(c.shots.map(s => s.scene)), new Set(['ident', 'steppe', 'canyon', 'field', 'air']));
  const st = (t) => c.stage(t, c.shotAt(t));
  const ids = (t) => st(t).cast.map(a => a.id).sort();
  assert.deepStrictEqual(ids(64), ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'girl', 'singer']);
  assert.deepStrictEqual(ids(20), ['girl', 'singer']);
  assert.ok(st(20).cast.every(a => a.pose.ground === false), 'both ride seated in the convertible');
  const girl = (t) => st(t).cast.find(a => a.id === 'girl');
  assert.ok(girl(78).head[1] > girl(20).head[1] + 0.4, 'she stands up in the car');
  assert.ok(st(10.4).title > 0.9 && !st(13).title && !st(20).title, 'the title shows only over the opening shot');
  assert.ok(st(97).frame && st(97).cast.some(a => a.id === 'girl' && a.root[2] < -10), 'the couple dances far away inside the gold frame');
  assert.ok(st(134).silhouette && st(158).silhouette && !st(64).silhouette);
  assert.strictEqual(st(72).cast.length, 0);
  assert.ok(st(72).car && st(170).car && st(20).car, 'the convertible drives through the canyon and is seen from above');
  assert.ok(st(100).cast.find(a => a.id === 'girl').props.some(p => p.id === 'khInstant'), 'she takes the selfie with an instant camera');
  assert.ok(st(48).cast.find(a => a.id === 'singer').props.some(p => p.id === 'khPhone'));
  const ry = (t) => girl(t).pose.ry;
  assert.ok(Math.abs(ry(154.2) - ry(152.8) - Math.PI * 2) < 0.2, 'she twirls once under his arm');
  assert.ok(c.flashAt(99.6) > 0.9 && c.flashAt(50) === 0);
  assert.ok(c.fadeAt(173) > 0.9 && c.fadeAt(100) === 0);
  let sung = 0, along = 0;
  for (let t = 18.8; t < 30; t += 0.1) if (c.mouthFor('singer', t) > 0.2) sung++;
  for (let t = 101; t < 103.5; t += 0.1) if (c.mouthFor('girl', t) > 0.2) along++;
  assert.ok(sung > 50, `he sings the first verse (${sung})`);
  assert.ok(along > 5, `she sings along in the car (${along})`);
  assert.strictEqual(c.mouthFor('singer', 12), 0);
  assert.strictEqual(c.mouthFor('girl', 64), 0);
  assert.strictEqual(c.mouthFor('dancer', 64), 0);
  const src = ['clip-hello.js', 'hello-cast.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/apps/poligon', f), 'utf8')).join(' ');
  assert.ok(!/tour|kali zone|kerege|chrysler|sebring/i.test(src));
  assert.ok(!/microsoft|windows/i.test(src));
});

test('Hello moves the dancers, the couple and the car crew smoothly', () => {
  const c = byId('hello');
  const joints = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];
  let worst = { d: 0 };
  let prev = null, prevShot = -1;
  for (let t = 0; t < c.duration; t += 1 / 60) {
    const shot = c.shotAt(t);
    const cur = {};
    c.stage(t, shot).cast.forEach(a => { cur[a.id] = a; });
    if (prev && shot.index === prevShot) {
      Object.keys(cur).forEach(id => {
        const a = cur[id], p = prev[id];
        if (!p) return;
        joints.forEach(j => [0, 1, 2].forEach(k => {
          const d = Math.abs(a.pose[j][k] - p.pose[j][k]);
          if (d > worst.d) worst = { d, at: `${id} ${j} ${t.toFixed(2)}` };
        }));
        assert.ok(Math.abs(a.pose.ry - p.pose.ry) < 0.2, `${id} turns too fast at ${t.toFixed(2)}`);
        const moved = Math.hypot(a.hips[0] - p.hips[0], a.hips[1] - p.hips[1], a.hips[2] - p.hips[2]);
        assert.ok(moved < 0.04, `${id} hips jump ${moved.toFixed(3)} m at ${t.toFixed(2)}`);
      });
    }
    prev = cur;
    prevShot = shot.index;
  }
  assert.ok(worst.d < 0.25, `joint jumps ${worst.d.toFixed(2)} rad in one frame (${worst.at})`);
});

test('War Song follows the cut list of the episode and ends with the Sam and Max lines', () => {
  const c = byId('war-song');
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
  const c = byId('neck-hurts');
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
  const c = byId('tarakan-i-chervyachok');
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
  const c = byId('vladik-v-depressii');
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
  const c = byId('heartsteel-paranoia');
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
  assert.strictEqual((html.match(/class="pg-seg"/g) || []).length, first.shots.length);
  first.locations.forEach(l => assert.ok(html.includes(`data-loc="${l.id}"`), l.id));
  clips.forEach(c => assert.strictEqual(html.includes(`data-url="http://www.poligon3d.ru/clip/${c.id}"`), !c.hidden, c.id));
  assert.deepStrictEqual(shown.map(c => c.id), clips.filter(c => !c.hidden).map(c => c.id));
  clips.filter(c => c.hidden).forEach(c => assert.strictEqual(site.parseUrl(`http://www.poligon3d.ru/clip/${c.id}`), first.id));
  const paranoia = byId('heartsteel-paranoia');
  const html2 = site.renderSite('http://www.poligon3d.ru/clip/heartsteel-paranoia');
  assert.ok(html2.includes('pg-row-on') && html2.includes(encodeURI(paranoia.audio)));
  assert.strictEqual((html2.match(/class="pg-seg"/g) || []).length, paranoia.shots.length);
  assert.ok(html.includes(encodeURI(first.audio)));
  assert.strictEqual(site.parseUrl('http://www.poligon3d.ru/clip/unknown'), first.id);
  const rows = html.match(/<td class="pg-num">\d+<\/td>\s*<td><a data-url="[^"]+"/g);
  assert.ok(rows[0].includes('>1<') && rows[0].includes('/clip/video-killed-the-radio-star'), 'the new clip heads the list as number 1');
});

const stories = window.poligonStories;

test('clip stories tell the history of the original and give two to five facts', () => {
  ['video-killed-the-radio-star', 'never-gonna-give-you-up', 'heartsteel-paranoia', 'war-song', 'god-knows', 'uhn-tiss', 'step', 'romeo-and-cinderella', 'hello'].forEach(id => assert.ok(stories[id], `${id} has its story`));
  Object.entries(stories).forEach(([id, s]) => {
    const c = shown.find(x => x.id === id);
    assert.ok(c, `${id} is a shown clip`);
    assert.ok(s.history.length >= 1 && s.history.every(p => typeof p === 'string' && p.length > 60), `${id} history`);
    assert.ok(s.facts.length >= 2 && s.facts.length <= 5, `${id} has ${s.facts.length} facts`);
    s.facts.forEach(f => {
      assert.ok(typeof f.text === 'string' && f.text.length > 30, `${id} fact text`);
      if ('at' in f) assert.ok(typeof f.at === 'number' && f.at >= 0 && f.at < c.duration, `${id} moment ${f.at}`);
    });
    assert.ok(!/microsoft|windows/i.test(JSON.stringify(s)), `${id} naming`);
  });
});

test('story block follows the clip title block and links facts to moments of the clip', () => {
  const c = byId('video-killed-the-radio-star');
  const html = site.renderSite(`http://www.poligon3d.ru/clip/${c.id}`);
  const pos = (cls) => html.indexOf(`class="${cls}"`);
  assert.ok(pos('pg-info') > 0 && pos('pg-info') < pos('pg-story') && pos('pg-story') < pos('pg-list'), 'narrow order: title block, story, clip list');
  assert.ok(html.includes('<h2>История оригинала</h2>') && html.includes('<h3>Знаете ли вы?</h3>'));
  const s = stories[c.id];
  assert.strictEqual((html.match(/<li>/g) || []).length, s.facts.length);
  assert.strictEqual((html.match(/class="pg-at"/g) || []).length, s.facts.filter(f => 'at' in f).length);
  assert.ok(html.includes('data-at="176.3"') && html.includes('&#9658; 2:56'), 'the Zimmer fact jumps to the synth player');
  const bare = shown.find(x => !stories[x.id]);
  if (bare) assert.ok(!site.renderSite(`http://www.poligon3d.ru/clip/${bare.id}`).includes('class="pg-story"'), `${bare.id} has no story yet`);
  const css = fs.readFileSync(path.join(__dirname, '../css/apps/poligon-site.css'), 'utf8');
  const wide = css.slice(css.indexOf('@container (min-width: 900px)'));
  assert.ok(/\.pg-story \{\s*grid-column: 2 \/ 4;\s*grid-row: 2 \/ 4;/.test(wide) && /\.pg-list \{\s*grid-column: 1;/.test(wide), 'wide pages put the story beside the clip list');
});

test('a fact moment plays the clip from that moment and brings the player into view', () => {
  const clicks = {};
  const btn = { dataset: { at: '176.3' }, addEventListener: (type, fn) => { clicks[type] = fn; } };
  const el = () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, hidden: false, textContent: '', setAttribute() {}, addEventListener() {}, getBoundingClientRect: () => ({ top: -500, bottom: -20 }), scrollIntoView(o) { this.scrolled = o; }, focus(o) { this.focused = o; } });
  const els = {};
  const root = { classList: el().classList, parentElement: { getBoundingClientRect: () => ({ top: 0, bottom: 600 }) }, querySelector: (sel) => (els[sel] = els[sel] || el()), querySelectorAll: (sel) => (sel === '.pg-at' ? [btn] : []) };
  const player = new window.PoligonPlayer(root, byId('video-killed-the-radio-star'));
  const calls = [];
  player.seek = (t) => calls.push(['seek', t]);
  player.play = () => calls.push(['play']);
  player.bind();
  clicks.click();
  assert.deepStrictEqual(calls, [['seek', 176.3], ['play']]);
  assert.deepStrictEqual(els['.pg-viewport'].scrolled, { block: 'start' });
  assert.deepStrictEqual(els['.pg-viewport'].focused, { preventScroll: true });
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
  ['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js', 'js/apps/poligon/clip-never-gonna.js', 'js/apps/poligon/clip-paranoia.js', 'js/apps/poligon/clip-vladik.js', 'js/apps/poligon/clip-tarakan.js', 'js/apps/poligon/clip-neck-hurts.js', 'js/apps/poligon/clip-war-song.js', 'js/apps/poligon/ccc-cast.js', 'js/apps/poligon/clip-ccc.js', 'js/apps/poligon/gk-cast.js', 'js/apps/poligon/clip-god-knows.js', 'js/apps/poligon/uts-cast.js', 'js/apps/poligon/clip-uhn-tiss.js', 'js/apps/poligon/step-cast.js', 'js/apps/poligon/clip-step.js', 'js/apps/poligon/radio-cast.js', 'js/apps/poligon/clip-radio-star.js', 'js/apps/poligon/rc-cast.js', 'js/apps/poligon/clip-romeo.js', 'js/apps/poligon/hello-cast.js', 'js/apps/poligon/clip-hello.js', 'js/apps/poligon/stories.js', 'js/apps/poligon-site.js', 'css/apps/poligon-site.css'].forEach(rel => {
    const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    assert.ok(!/\/\*[\s\S]*?\*\//.test(src), `${rel} has a block comment`);
    assert.ok(!/(^|[^:'"])\/\/\s/m.test(src), `${rel} has a line comment`);
  });
});

console.log(`poligon-site: ${passed} tests passed`);
