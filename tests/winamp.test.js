const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

function createMockElement(tag = 'div', id = '') {
  const children = [];
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: tag.toUpperCase(),
    id,
    dataset: {},
    style: {},
    value: '',
    disabled: false,
    offsetWidth: 200,
    clientWidth: 0,
    width: 176,
    height: 36,
    getContext: () => ({
      fillStyle: '',
      fillRect: () => {},
      clearRect: () => {}
    }),
    get className() { return Array.from(classes).join(' '); },
    set className(val) {
      classes.clear();
      (val || '').split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, force) => {
        const on = typeof force === 'boolean' ? force : !classes.has(c);
        if (on) classes.add(c);
        else classes.delete(c);
        return on;
      }
    },
    children,
    innerHTML: '',
    textContent: '',
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    querySelector: (selector) => el.querySelectorAll(selector)[0] || null,
    querySelectorAll: (selector) => {
      const results = [];
      const walk = (node) => {
        const match = selector.startsWith('#') ? node.id === selector.slice(1) : node.classList.contains(selector.slice(1));
        if (match) results.push(node);
        node.children.forEach(walk);
      };
      walk(el);
      return results;
    },
    addEventListener: (evt, fn) => {
      (listeners[evt] = listeners[evt] || []).push(fn);
    },
    click: () => (listeners.click || []).forEach(fn => fn({ type: 'click', target: el }))
  };
  return el;
}

global.document = {
  createElement: (tag) => createMockElement(tag),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = global;
window.requestAnimationFrame = (fn) => setTimeout(fn, 16);
window.cancelAnimationFrame = (id) => clearTimeout(id);

global.Audio = class {
  constructor() {
    this.currentTime = 0;
    this.duration = 200;
    this.volume = 1;
    this.muted = false;
    this.paused = true;
    this.src = '';
    this.listeners = {};
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  addEventListener(evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
  }
};

const node = () => ({ connect: () => {} });
global.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }
  createAnalyser() {
    return { ...node(), fftSize: 256, frequencyBinCount: 128, getByteFrequencyData: (a) => a.fill(128), getByteTimeDomainData: (a) => a.fill(128) };
  }
  createGain() { return { ...node(), gain: { value: 1 } }; }
  createStereoPanner() { return { ...node(), pan: { value: 0 } }; }
  createBiquadFilter() { return { ...node(), frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0 } }; }
  createMediaElementSource() { return node(); }
  resume() { return Promise.resolve(); }
};

global.Icons = { winamp: '<svg></svg>' };

const vfsRoot = { type: 'folder', children: { 'My Computer': { type: 'folder', children: { 'C:': { type: 'folder', children: { 'Program Files': { type: 'folder', children: { Winamp: { type: 'folder', children: {} } } } } } } } } };
window.vfs = {
  resolvePath: (parts) => parts.reduce((n, p) => (n && n.children ? n.children[p] : null), vfsRoot),
  list(parts) {
    const dir = this.resolvePath(parts);
    return dir && dir.children ? Object.keys(dir.children).map(key => ({ key, ...dir.children[key] })) : [];
  },
  createFolder(parts, name) {
    this.resolvePath(parts).children[name] = { type: 'folder', name, children: {} };
    return true;
  },
  writeFile(parts, name, content) {
    this.resolvePath(parts).children[name] = { type: 'file', name, icon: 'winamp', app: 'winamp', content };
    return true;
  }
};

let lastMenu = null;
window.contextMenu = { show: (x, y, items) => { lastMenu = items; } };

eval(fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/apps/winamp-skins.js'), 'utf8'));

const createdWindows = new Map();
const mockIds = [
  'root', 'lcd', 'state', 'timer', 'kbps', 'khz', 'mono', 'stereo', 'viz_box', 'viz', 'ticker_wrap', 'ticker',
  'shade_state', 'shade_time', 'shade_title', 'seek', 'vol', 'bal', 'btn_prev', 'btn_play', 'btn_pause', 'btn_stop',
  'btn_next', 'btn_eject', 'btn_shuf', 'btn_rep', 'btn_eq', 'btn_pl', 'eq_panel', 'eq_on', 'eq_presets', 'eq_reset',
  'eq_curve', 'pl_panel', 'pl_summary', 'pl_list', 'pl_add', 'pl_add_url', 'pl_del', 'pl_clear', 'file_in'
];
window.winManager = {
  windows: createdWindows,
  createWindow: (options) => {
    const winEl = createMockElement('div', options.id);
    mockIds.forEach(suffix => winEl.appendChild(createMockElement('div', `${options.id}_${suffix}`)));
    ['pre', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(band => {
      const slider = createMockElement('input');
      slider.className = 'wa-eq-slider eq-slider';
      slider.dataset.band = String(band);
      winEl.appendChild(slider);
    });
    const winObj = { id: options.id, title: options.title, element: winEl, isMinimized: false, onClose: options.onClose, options };
    createdWindows.set(options.id, winObj);
    return winObj;
  },
  bringToTop: () => {},
  restoreWindow: (id) => { createdWindows.get(id).isMinimized = false; },
  closeWindow: (id) => {
    const w = createdWindows.get(id);
    if (w && w.onClose) w.onClose();
    createdWindows.delete(id);
  },
  openDialog: (opts) => { window.lastDialog = opts; },
  openPromptDialog: (opts) => { window.lastPrompt = opts; }
};

window.soundSys = {
  muted: false,
  masterVolume: 0.8,
  playCanyonMidi() { this.canyonPlayed = true; },
  playPassportMidi() { this.passportPlayed = true; },
  stopMidiPlayback() { this.midiStopped = true; }
};

eval(fs.readFileSync(path.join(__dirname, '../js/apps/winamp.js'), 'utf8'));
const wa = window.appWinamp;
const WinampClass = wa.constructor;
const byId = (suffix) => createdWindows.get('app_winamp').element.querySelector(`#app_winamp_${suffix}`);
const key = (k, extra = {}) => wa.handleKey({ key: k, target: {}, preventDefault() {}, stopPropagation() {}, ...extra });

console.log('--- Testing WinAmp 98 Pro ---');

assert.doesNotThrow(() => wa.open());
const winObj = createdWindows.get('app_winamp');
assert.ok(winObj, 'window is created');
assert.equal(winObj.title, 'WinAmp 98 Pro');
assert.equal(winObj.options.height, 'auto', 'window height follows its panels');
assert.equal(winObj.options.maximizable, false);
assert.ok(winObj.element.classList.contains('winamp-window'));
assert.ok(winObj.element.classList.contains('wa-skin-classic'), 'base skin class is on the window');
assert.ok(wa.buildHTML('app_winamp').includes('data-wa="eq-presets"'));
console.log('PASS 1. Player window opens with skinned chrome and auto height');

assert.equal(wa.playlist[0].artist, 'Nullsoft');
assert.equal(wa.trackLabel(wa.playlist[0]), "Nullsoft - Winamp Intro (It really whips the llama's ass!)");
assert.ok(!wa.trackLabel(wa.playlist[1]).startsWith('Harry Enfield - Harry Enfield'), 'artist is not duplicated');
console.log('PASS 2. Playlist labels show artist once');

wa.play(1);
wa.audio.currentTime = 50;
const srcBefore = wa.audio.src;
assert.equal(wa.open(), winObj, 'open() reuses the window');
assert.equal(wa.audio.src, srcBefore, 'reopening does not restart the track');
assert.equal(wa.audio.currentTime, 50);
console.log('PASS 3. Reopening the player keeps the current track playing');

wa.pause();
assert.equal(wa.isPlaying, false);
assert.equal(wa.isPaused, true);
assert.ok(byId('lcd').classList.contains('is-paused'));
wa.pressPlay();
assert.equal(wa.isPlaying, true);
assert.equal(wa.audio.currentTime, 50, 'play after pause resumes from the same position');
wa.stop();
assert.equal(wa.isPlaying, false);
assert.equal(wa.isPaused, false);
assert.equal(wa.audio.currentTime, 0);
assert.ok(byId('lcd').classList.contains('is-stopped'));
console.log('PASS 4. Pause resumes in place, stop rewinds');

const lenBefore = wa.playlist.length;
wa.open('CustomSong.mp3', 'content/music/CustomSong.mp3');
assert.equal(wa.playlist.length, lenBefore + 1);
assert.equal(wa.playlist[wa.playlist.length - 1].title, 'CustomSong');
assert.equal(wa.currentTrackIndex, wa.playlist.length - 1);
assert.equal(wa.isPlaying, true);
console.log('PASS 5. Opening an audio file adds and plays it');

window.soundSys.canyonPlayed = false;
wa.open('canyon.mid', '[Standard MIDI File: Canyon.mid]');
assert.ok(window.soundSys.canyonPlayed);
assert.equal(wa.playlist[wa.currentTrackIndex].duration, 'MIDI');
assert.equal(byId('kbps').textContent, 'MIDI');
wa.stop();
assert.ok(window.soundSys.midiStopped);
console.log('PASS 6. MIDI tracks use the SoundBlaster synthesizer');

const rock = WinampClass.EQ_PRESETS.find(p => p.name === 'Rock');
wa.applyPreset(rock);
assert.deepEqual(wa.eqNodes.map(n => n.gain.value), rock.gains);
wa.preamp = 6;
wa.applyEq();
assert.ok(Math.abs(wa.preampNode.gain.value - Math.pow(10, 6 / 20)) < 1e-9, 'preamp drives a gain node');
wa.toggleEqEnabled();
assert.deepEqual(wa.eqNodes.map(n => n.gain.value), new Array(10).fill(0), 'EQ off bypasses the bands');
assert.equal(wa.preampNode.gain.value, 1);
wa.toggleEqEnabled();
assert.deepEqual(wa.eqNodes.map(n => n.gain.value), rock.gains, 'EQ on restores the bands');
wa.resetEq();
assert.equal(wa.preamp, 0);
assert.deepEqual(wa.eqGains, new Array(10).fill(0));
wa.showPresetMenu(0, 0);
assert.ok(lastMenu.find(item => item.label === 'Flat').checked, 'current preset is checked');
console.log('PASS 7. Equalizer presets, preamp and ON/OFF drive the audio graph');

assert.deepEqual(wa.getInstalledSkinIds(), ['classic']);
assert.equal(wa.installSkin('zone'), true);
const skinFiles = window.vfs.list(WinampClass.SKINS_PATH);
assert.equal(skinFiles.length, 1);
assert.equal(skinFiles[0].name, 'Zone98_Dosimeter.wsz');
assert.deepEqual(wa.getInstalledSkinIds(), ['classic', 'zone']);
wa.setSkin('matrix');
assert.ok(winObj.element.classList.contains('wa-skin-matrix'));
assert.ok(!winObj.element.classList.contains('wa-skin-classic'), 'previous skin class is removed');
assert.ok(wa.isSkinInstalled('matrix'), 'applying a skin installs its .wsz');
wa.showSkinsMenu(0, 0);
assert.deepEqual(lastMenu.filter(i => i.label && i.action && i.checked !== undefined).map(i => i.label), ['Nullsoft Base Skin', 'The Matrix Digital Rain', 'Зона 98 Дозиметр']);
assert.ok(lastMenu.find(i => i.label === 'The Matrix Digital Rain').checked);
wa.play(0);
wa.audio.currentTime = 2;
wa.open('Zone98_Dosimeter.wsz', skinFiles[0].content);
assert.ok(winObj.element.classList.contains('wa-skin-zone'), 'double-clicking a .wsz applies it');
assert.equal(wa.audio.currentTime, 2, 'applying a skin does not restart playback');
window.lastDialog = null;
wa.open('broken.wsz', 'garbage');
assert.ok(window.lastDialog && window.lastDialog.icon === 'error', 'broken skin shows an error');
wa.setSkin('does-not-exist');
assert.equal(wa.currentSkin, 'classic');
console.log('PASS 8. Skins install as .wsz files, apply by menu or file, and fall back safely');

wa.play(0);
key('b');
assert.equal(wa.currentTrackIndex, 1, 'B plays the next track');
key('z');
assert.equal(wa.currentTrackIndex, 0, 'Z plays the previous track');
key('c');
assert.equal(wa.isPaused, true, 'C pauses');
key('c');
assert.equal(wa.isPlaying, true, 'C again resumes');
key('v');
assert.equal(wa.isPlaying, false, 'V stops');
const volBefore = wa.volume;
key('ArrowUp');
assert.ok(wa.volume > volBefore, 'Up raises the volume');
assert.equal(byId('vol').value, Math.round(wa.volume * 100));
key('g', { altKey: true });
assert.equal(wa.isEqOpen, true, 'Alt+G opens the equalizer');
assert.ok(byId('root').classList.contains('is-eq-open'));
key('w', { altKey: true });
assert.ok(byId('root').classList.contains('is-shaded'), 'Alt+W switches to windowshade');
key('w', { altKey: true });
key('u', { ctrlKey: true });
assert.ok(window.lastPrompt, 'Ctrl+U asks for a URL');
window.lastPrompt.onOk('http://radio.example.test/live');
assert.equal(wa.playlist[wa.currentTrackIndex].duration, 'LIVE');
console.log('PASS 9. Keyboard shortcuts drive transport, volume, panels and URL entry');

wa.showMainMenu(0, 0);
assert.ok(lastMenu.find(i => i.label === window.t('winamp.menuEq')).checked);
assert.ok(lastMenu.find(i => i.label === window.t('winamp.menuSkins')));
console.log('PASS 10. Main menu reflects panel and option state');

wa.play(1);
const playingSrc = wa.playlist[1].src;
wa.selectTrack(0);
wa.removeSelected();
assert.equal(wa.playlist[wa.currentTrackIndex].src, playingSrc);
assert.equal(wa.currentTrackIndex, 0, 'removing a track above the current one keeps the current track');
wa.clearPlaylist();
assert.equal(wa.playlist.length, 0);
assert.doesNotThrow(() => { wa.play(); wa.next(); wa.prev(); wa.removeSelected(); key('x'); });
assert.equal(wa.isPlaying, false);
console.log('PASS 11. Playlist remove and clear keep the player consistent');

wa.setVolume(0.35);
wa.setSkin('gold');
const restored = new WinampClass();
assert.equal(restored.volume, 0.35);
assert.equal(restored.currentSkin, 'gold');
assert.equal(restored.isEqOpen, true);
console.log('PASS 12. Volume, skin and panels persist between sessions');

window.i18n.setLanguage('ru');
assert.equal(window.t('winamp.menuSkins'), 'Скины...');
window.i18n.setLanguage('en');
assert.equal(window.t('winamp.menuSkins'), 'Skins...');
console.log('PASS 13. Russian and English strings exist');

window.winManager.closeWindow('app_winamp');
assert.equal(createdWindows.has('app_winamp'), false);
assert.equal(wa.isPlaying, false);
assert.equal(wa.win, null);
console.log('PASS 14. Closing the window stops playback');

console.log('\n========================================');
console.log('ALL 14 WINAMP 98 PRO TESTS PASSED!');
console.log('========================================\n');
