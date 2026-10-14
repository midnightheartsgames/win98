(function (FO) {
  'use strict';

  const MAX = 32767;
  const MIN_DB = -10000;
  const MUSIC_SCALE = Math.fround(0.94);
  const PATH = { MUSIC: 'SOUND\\MUSIC\\', SFX: 'SOUND\\SFX\\', SPEECH: 'SOUND\\SPEECH\\' };
  const UI_NAMES = { down: 'ib1p1xx1', up: 'ib1lu1x1', called: 'icsxxxx1' };
  const CACHE_LIMIT = 160;
  const FAR_VOLUME = 0x2AAA;
  const FALLOFF = 0x5554;
  const MAX_EFFECTS = 4;
  const SPEECH_SCALE = Math.fround(0.69);
  const LIP_VERSION = 2;
  const BYTES_PER_SAMPLE = 2;
  const EFFECTS = 'RAOFHOCLNU';
  const ACTIONS = 'OCLNU';
  const HIT = 'H';
  const NO_MATERIAL_DAMAGE = [3, 5, 6];
  const MATERIAL_LETTERS = 'MMMWSSSF';
  const STATE = { LOADED: 0, PLAYING: 1, DONE: 2 };
  const CHAR_EXTRA = { KNOCKDOWN: 1, PASS_OUT: 2, DIE: 3, CONTACT: 4 };

  FO.SFX_PATH = PATH.SFX;

  FO.volumeGain = function (v) {
    const vol = Math.min(MAX, v | 0);
    const db = vol > 0 ? Math.trunc(Math.max(MIN_DB, Math.min(0, -1000 * Math.log2(MAX / vol)))) : MIN_DB;
    return Math.pow(10, db / 2000);
  };

  FO.uiSound = function (g, name) {
    if (g && g.audio) g.audio.sfx(UI_NAMES[name] || name);
  };

  FO.SFX_EXTRA = CHAR_EXTRA;
  FO.PHONEME_FRAMES = [0, 3, 1, 1, 3, 1, 1, 1, 7, 8, 7, 3, 1, 8, 1, 7, 7, 6, 6, 2, 2, 2, 2, 4, 4, 5, 5, 2, 2, 2, 2, 2, 6, 2, 2, 5, 8, 2, 2, 2, 2, 8];
  FO.LIP_VOLUME = Math.trunc(MAX * SPEECH_SCALE);

  FO.loadLip = async function (g, head, name) {
    const path = PATH.SPEECH + String(head).toUpperCase() + '\\' + String(name).toUpperCase() + '.LIP';
    if (!g.data.has(path)) return null;
    const lip = FO.readLip(await g.data.get(path));
    return lip.version === LIP_VERSION && lip.markers.length ? lip : null;
  };

  FO.lipStep = function (lip, pos) {
    const { phonemes, markers } = lip.data;
    const count = markers.length;
    let i = lip.index;
    while (i < count && pos > markers[i].pos) {
      lip.phoneme = phonemes[i];
      i++;
      if (i >= count) {
        i = 0;
        lip.phoneme = phonemes[0];
        lip.ended = true;
        break;
      }
    }
    lip.index = i;
    return lip.phoneme;
  };
  FO.SFX_OPEN = { OPEN: 0, CLOSE: 1, LOCKED: 2 };
  FO.SFX_WEAPON = { READY: 0, ATTACK: 1, OUT_OF_AMMO: 2, FLY: 3, HIT: 4 };

  FO.reloadSound = (g, weapon) => FO.uiSound(g, FO.sfxWeapon(g, FO.SFX_WEAPON.READY, weapon, FO.HIT_MODE.RIGHT_PRIMARY, null));

  const cstr = s => {
    const end = s.indexOf('\0');
    return (end < 0 ? s : s.slice(0, end)).toUpperCase();
  };
  const chr = n => String.fromCharCode(n & 0xFF);
  const protoOf = (g, o) => o.proto || (g.protos ? g.protos.get(o.pid) : null);

  FO.sfxArt = function (g, obj, anim, extra) {
    if (!obj || !g.art) return null;
    const type = FO.fidType(obj.fid);
    const index = FO.fidIndex(obj.fid);
    const base = type === FO.ART.CRITTER ? (g.art.critters[index] || {}).name : FO.lstName((g.art.lists[type] || [])[index]);
    if (!base) return null;
    const code = FO.critterSuffix(anim, anim === FO.ANIM.TAKE_OUT ? extra : FO.fidWeapon(obj.fid));
    if (!code) return null;
    let first = code[0];
    if (anim === FO.ANIM.FALL_BACK || anim === FO.ANIM.FALL_FRONT) {
      if (extra === CHAR_EXTRA.PASS_OUT) first = 'Y';
      else if (extra === CHAR_EXTRA.DIE) first = 'Z';
    } else if ((anim === FO.ANIM.PUNCH || anim === FO.ANIM.KICK) && extra === CHAR_EXTRA.CONTACT) {
      first = 'Z';
    }
    return cstr(base + first + code[1]);
  };

  FO.sfxWeapon = function (g, effect, weapon, hitMode, target) {
    const p = weapon ? protoOf(g, weapon) : null;
    const id = p && p.sub === FO.ITEM.WEAPON ? chr(p.sound2) : '\0';
    const letter = EFFECTS[effect] || '';
    const digit = effect === 0 || effect === 2 || hitMode === 0 || hitMode === 2 || hitMode === 4 ? 1 : 2;
    let material = 'X';
    if (letter === HIT && target && !NO_MATERIAL_DAMAGE.includes(FO.damageType(weapon))) {
      const type = FO.fidType(target.fid);
      const tp = type === FO.ART.ITEM || type === FO.ART.SCENERY || type === FO.ART.WALL ? protoOf(g, target) : null;
      const m = tp ? tp.material : -1;
      material = MATERIAL_LETTERS[m] || 'F';
    }
    return cstr('W' + letter + id + digit + material + 'XX1');
  };

  FO.sfxOpen = function (g, obj, action) {
    const p = protoOf(g, obj);
    const a = ACTIONS[action] || '';
    if (FO.fidType(obj.fid) === FO.ART.SCENERY) return cstr('S' + a + 'DOORS' + (p ? chr(p.sound) : 'A'));
    return cstr('I' + a + 'CNTNR' + chr(p ? p.sound : 0));
  };

  FO.sfxScenery = (type, action, name) => cstr('S' + (type ? 'P' : 'A') + (ACTIONS[action] || '') + String(name).padStart(4) + '1');
  FO.sfxAmbient = name => cstr('A' + String(name).padStart(6) + '1');
  FO.sfxItem = name => cstr('N' + String(name).padStart(6) + '1');

  FO.sfxPickup = function (g, item) {
    const name = FO.lstName((g.art.lists[FO.fidType(item.fid)] || [])[FO.fidIndex(item.fid)]);
    return name && name.length >= 4 ? cstr(name.slice(0, -4)) : null;
  };

  class Sound {
    constructor(g) {
      this.g = g;
      this.ctx = null;
      this.buffers = new Map();
      this.music = null;
      this.musicName = '';
      this.musicToken = null;
      this.voice = null;
      this.voiceToken = null;
      this.effects = 0;
    }

    context() {
      if (this.ctx || this.closed) return this.ctx;
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.buses = {};
      for (const name of ['music', 'sfx', 'speech']) {
        this.buses[name] = ctx.createGain();
        this.buses[name].connect(this.master);
      }
      this.apply();
      return ctx;
    }

    resume() {
      const ctx = this.context();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    close() {
      this.closed = true;
      this.stopMusic();
      this.stopSpeech();
      if (this.ctx && this.ctx.close) this.ctx.close();
      this.ctx = null;
      this.buffers.clear();
    }

    pref(key) {
      return FO.prefValue(this.g.prefs, key);
    }

    apply() {
      if (!this.ctx) return;
      this.master.gain.value = FO.volumeGain(this.pref('masterVolume'));
      this.buses.music.gain.value = FO.volumeGain(Math.trunc(this.pref('musicVolume') * MUSIC_SCALE));
      this.buses.sfx.gain.value = FO.volumeGain(this.pref('soundVolume'));
      this.buses.speech.gain.value = FO.volumeGain(this.pref('speechVolume'));
    }

    toBuffer(u8, stereo) {
      const dec = FO.decodeAcm(u8);
      const ch = stereo ? 2 : 1;
      const frames = Math.floor(dec.samples.length / ch);
      if (!frames) return null;
      const buf = this.ctx.createBuffer(ch, frames, dec.rate);
      for (let c = 0; c < ch; c++) {
        const out = buf.getChannelData(c);
        for (let i = 0; i < frames; i++) out[i] = dec.samples[i * ch + c] / 32768;
      }
      return buf;
    }

    cached(path) {
      const hit = this.buffers.get(path);
      if (hit) {
        this.buffers.delete(path);
        this.buffers.set(path, hit);
        return hit;
      }
      const job = this.g.data.get(path).then(u8 => this.toBuffer(u8, false)).catch(() => null);
      this.buffers.set(path, job);
      while (this.buffers.size > CACHE_LIMIT) this.buffers.delete(this.buffers.keys().next().value);
      return job;
    }

    start(buf, bus, volume, loop, offset) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = !!loop;
      const gain = ctx.createGain();
      gain.gain.value = volume === undefined ? 1 : FO.volumeGain(volume);
      src.connect(gain);
      gain.connect(bus);
      const from = offset || 0;
      src.start(0, from);
      return { src, gain, at: ctx.currentTime - from, duration: buf.duration, rate: buf.sampleRate, paused: false, offset: 0 };
    }

    playPcm(pcm, rate, channels) {
      if (!this.context()) return null;
      const frames = Math.floor(pcm.length / channels);
      if (!frames) return null;
      const buf = this.ctx.createBuffer(channels, frames, rate);
      for (let c = 0; c < channels; c++) {
        const out = buf.getChannelData(c);
        for (let i = 0; i < frames; i++) out[i] = pcm[i * channels + c] / 32768;
      }
      return this.start(buf, this.buses.music, MAX, false);
    }

    stopPcm(voice) {
      if (voice) voice.src.stop();
    }

    pauseMusic() {
      const m = this.music;
      if (!m || m.paused || !this.ctx) return;
      m.offset = (this.ctx.currentTime - m.at) % m.duration;
      m.src.stop();
      m.paused = true;
    }

    resumeMusic() {
      const m = this.music;
      if (!m || !m.paused) return;
      this.music = this.start(m.src.buffer, this.buses.music, MAX, m.src.loop, m.offset);
    }

    async playMusic(name, loop, onEnd) {
      this.stopMusic();
      const token = {};
      this.musicToken = token;
      const path = PATH.MUSIC + String(name).toUpperCase() + '.ACM';
      if (!this.context() || !this.g.data.has(path)) return null;
      const u8 = await this.g.data.get(path);
      if (this.musicToken !== token) return null;
      const buf = this.toBuffer(u8, true);
      if (!buf || this.musicToken !== token) return null;
      const m = this.start(buf, this.buses.music, MAX, loop !== false);
      this.music = m;
      this.musicName = String(name).toUpperCase();
      if (onEnd) m.src.onended = () => {
        if (this.music === m && !m.paused) onEnd();
      };
      return m;
    }

    stopMusic() {
      this.musicToken = null;
      this.musicName = '';
      const m = this.music;
      if (!m) return;
      this.music = null;
      if (!m.paused) m.src.stop();
    }

    sfxPath(name, obj) {
      const find = n => {
        const path = PATH.SFX + n + '.ACM';
        return this.g.data.has(path) ? path : null;
      };
      const up = String(name).toUpperCase();
      const direct = find(up);
      if (direct) return direct;
      if (obj && FO.fidType(obj.fid) === FO.ART.CRITTER && (up[0] === 'H' || up[0] === 'N') && 'AFM'.includes(up[1] || '-')) {
        const sex = up[1] === 'A' ? (FO.statValue(obj, FO.STAT.GENDER) ? 'F' : 'M') : up[1];
        const alias = find('H' + sex + 'XXXX' + up.slice(6));
        if (alias) return alias;
        if (sex === 'F') {
          const male = find('HMXXXX' + up.slice(6));
          if (male) return male;
        }
      }
      if (up.startsWith('MALIEU') || up.startsWith('MAMTN2')) return find('MAMTNT' + up.slice(6));
      return null;
    }

    load(name, obj, volume) {
      if (!name || !this.context() || this.effects >= MAX_EFFECTS) return null;
      const path = this.sfxPath(name, obj);
      if (!path) return null;
      this.effects++;
      return { path, job: this.cached(path), volume: volume === undefined ? MAX : volume, state: STATE.LOADED, voice: null };
    }

    play(h) {
      if (!h || h.state !== STATE.LOADED) return;
      h.state = STATE.PLAYING;
      h.job.then(buf => {
        if (h.state !== STATE.PLAYING) return;
        if (!buf) {
          this.release(h);
          return;
        }
        h.voice = this.start(buf, this.buses.sfx, h.volume, false);
        h.voice.src.onended = () => this.release(h);
      });
    }

    free(h) {
      if (h && h.state === STATE.LOADED) this.release(h);
    }

    release(h) {
      if (h.state === STATE.DONE) return;
      h.state = STATE.DONE;
      this.effects--;
    }

    sfx(name, volume, obj) {
      const h = this.load(name, obj, volume);
      this.play(h);
      return h;
    }

    async loadSpeech(head, name) {
      const path = PATH.SPEECH + String(head).toUpperCase() + '\\' + String(name).toUpperCase() + '.ACM';
      if (!this.context() || !this.g.data.has(path)) return null;
      return this.toBuffer(await this.g.data.get(path), false);
    }

    playSpeech(buf, volume) {
      this.stopSpeech();
      if (!buf || !this.context()) return null;
      this.voice = this.start(buf, this.buses.speech, volume === undefined ? MAX : volume, false);
      return this.voice;
    }

    async speech(head, name, volume) {
      this.stopSpeech();
      const token = {};
      this.voiceToken = token;
      const buf = await this.loadSpeech(head, name);
      if (!buf || this.voiceToken !== token) return null;
      this.playSpeech(buf, volume);
      this.voiceToken = token;
      return this.voice;
    }

    stopSpeech() {
      this.voiceToken = null;
      if (!this.voice) return;
      this.voice.src.stop();
      this.voice = null;
    }

    speechTime() {
      return this.voice && this.ctx ? this.ctx.currentTime - this.voice.at : -1;
    }

    speechDone() {
      return !this.voice || this.speechTime() >= this.voice.duration;
    }

    speechBytes() {
      return this.voice ? Math.trunc(this.speechTime() * this.voice.rate) * BYTES_PER_SAMPLE : 0;
    }
  }

  FO.Sound = Sound;

  FO.sfxVolume = function (play, obj) {
    if (!obj || !play) return MAX;
    const type = FO.fidType(obj.fid);
    if (type !== FO.ART.ITEM && type !== FO.ART.CRITTER && type !== FO.ART.SCENERY) return MAX;
    let owner = obj;
    while (owner.owner) owner = owner.owner;
    const dude = play.w.dude;
    if (owner.tile < 0 || !dude || dude.tile < 0 || (play.onScreen && play.onScreen(owner))) return MAX;
    const dist = FO.objDist(owner, dude);
    const pe = FO.statValue(dude, FO.STAT.PE);
    if (dist <= pe) return MAX;
    if (dist >= 2 * pe) return FAR_VOLUME;
    return MAX - Math.trunc((dist - pe) * FALLOFF / pe);
  };

  FO.loadSfx = function (g, name, obj) {
    if (!g || !g.audio || !name) return null;
    return g.audio.load(name, obj, FO.sfxVolume(g.play, obj));
  };

  FO.playSfxAt = function (g, name, obj) {
    const h = FO.loadSfx(g, name, obj);
    if (h) g.audio.play(h);
    return h;
  };
})(globalThis.FO = globalThis.FO || {});
