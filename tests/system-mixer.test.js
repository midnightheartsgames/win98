const fs = require('fs');
const path = require('path');
const assert = require('assert');

class FakeParam {
  constructor(v) { this.value = v; }
  cancelScheduledValues() {}
  setTargetAtTime(v) { this.value = v; }
}

class FakeNode {
  constructor(ctx) { this.context = ctx; this.outputs = []; }
  connect(n) { this.outputs.push(n); return n; }
}

class BaseAudioContext {
  constructor() { this.speakers = new FakeNode(this); this.currentTime = 0; this.state = 'running'; }
  createGain() { const g = new FakeNode(this); g.gain = new FakeParam(1); return g; }
  createMediaElementSource(el) { const n = new FakeNode(this); n.el = el; return n; }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
Object.defineProperty(BaseAudioContext.prototype, 'destination', { configurable: true, get() { return this.speakers; } });
class AudioContext extends BaseAudioContext {}

class HTMLMediaElement {
  constructor() { this.v = 1; this.playCount = 0; }
  play() { this.playCount++; return Promise.resolve(); }
}
Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
  configurable: true,
  enumerable: true,
  get() { return this.v; },
  set(x) { if (!(x >= 0 && x <= 1)) throw new RangeError('IndexSizeError'); this.v = x; }
});

const spoken = [];
const docListeners = {};
const domMedia = [];
global.window = {
  AudioContext,
  HTMLMediaElement,
  speechSynthesis: { speak(u) { spoken.push(u.volume); } },
  document: {
    addEventListener(type, fn) { docListeners[type] = fn; },
    querySelectorAll(sel) { return sel === 'audio, video' ? domMedia : []; }
  }
};
global.document = window.document;

eval(fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8'));

const sys = window.soundSys;
const bus = (ctx) => ctx.destination;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('system sounds and game audio contexts share one master bus per context', () => {
  assert.ok(sys.ctx instanceof AudioContext);
  assert.strictEqual(sys.masterGain, sys.ctx.destination);
  assert.ok(near(sys.masterGain.gain.value, 0.8));
  assert.ok(sys.masterGain.outputs.includes(sys.ctx.speakers));
  const game = new window.AudioContext();
  assert.ok(game instanceof AudioContext);
  assert.notStrictEqual(bus(game), game.speakers);
  assert.ok(near(bus(game).gain.value, 0.8));
});

test('changing the master volume reaches every open audio context', () => {
  const a = new window.AudioContext();
  const b = new window.AudioContext();
  sys.setMasterVolume(0.3);
  [sys.ctx, a, b].forEach(c => assert.ok(near(bus(c).gain.value, 0.3)));
  sys.setMuted(true);
  [sys.ctx, a, b].forEach(c => assert.strictEqual(bus(c).gain.value, 0));
  sys.setMuted(false);
  [sys.ctx, a, b].forEach(c => assert.ok(near(bus(c).gain.value, 0.3)));
  sys.setMasterVolume(0.8);
});

test('media elements keep their own volume and follow the master level', () => {
  const sfx = new HTMLMediaElement();
  sfx.volume = 0.5;
  assert.strictEqual(sfx.volume, 0.5);
  assert.ok(near(sfx.v, 0.4));
  const fresh = new HTMLMediaElement();
  fresh.play();
  assert.ok(near(fresh.v, 0.8));
  assert.strictEqual(fresh.volume, 1);
  const page = new HTMLMediaElement();
  domMedia.push(page);
  sys.setMasterVolume(0.5);
  assert.ok(near(sfx.v, 0.25) && near(fresh.v, 0.5) && near(page.v, 0.5));
  sys.setMuted(true);
  assert.ok(sfx.v === 0 && fresh.v === 0 && page.v === 0);
  assert.strictEqual(sfx.volume, 0.5);
  sys.setMuted(false);
  assert.ok(near(sfx.v, 0.25));
  assert.throws(() => { sfx.volume = 2; });
  domMedia.length = 0;
  sys.setMasterVolume(0.8);
});

test('media routed into Web Audio is scaled once, by the context bus', () => {
  const song = new HTMLMediaElement();
  song.volume = 0.6;
  assert.ok(near(song.v, 0.48));
  const ctx = new window.AudioContext();
  ctx.createMediaElementSource(song);
  assert.ok(near(song.v, 0.6));
  sys.setMasterVolume(0.2);
  assert.ok(near(song.v, 0.6));
  assert.ok(near(bus(ctx).gain.value, 0.2));
  sys.setMasterVolume(0.8);
});

test('speech follows the master level without compounding on repeats', () => {
  sys.setMasterVolume(0.5);
  const u = { volume: 0.9 };
  window.speechSynthesis.speak(u);
  window.speechSynthesis.speak(u);
  assert.ok(near(spoken[0], 0.45) && near(spoken[1], 0.45));
  sys.setMasterVolume(0.8);
});

test('games no longer multiply the master volume themselves', () => {
  const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  ['js/apps/diablo/diablo-audio.js', 'js/apps/doom/doom-audio.js', 'js/apps/dota/dota-audio.js', 'js/apps/lol/lol-audio.js', 'js/apps/plov/pl-audio.js', 'js/apps/winamp.js', 'js/apps/youvid-site.js', 'js/apps/poligon-site.js'].forEach(rel => {
    assert.ok(!/getMasterVolume|masterVolume/.test(read(rel)), rel);
  });
});

test('master volume and mute survive a restart, a stopped audio service does not', () => {
  const store = {};
  global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  try {
    sys.setMasterVolume(0.4);
    sys.setMuted(true);
    let next = new sys.constructor(window.systemMixer);
    assert.ok(near(next.getMasterVolume(), 0.4));
    assert.strictEqual(next.muted, true);
    assert.ok(near(window.systemMixer.level, 0));
    sys.setMuted(false);
    sys.setMuted(true, false);
    next = new sys.constructor(window.systemMixer);
    assert.strictEqual(next.muted, false);
    assert.ok(near(window.systemMixer.level, 0.4));
    store[sys.constructor.STORAGE_KEY] = '{broken';
    next = new sys.constructor(window.systemMixer);
    assert.ok(near(next.getMasterVolume(), 0.8));
  } finally {
    delete global.localStorage;
    sys.setMuted(false);
    sys.setMasterVolume(0.8);
  }
});

console.log(`system mixer: ${passed} passed`);
