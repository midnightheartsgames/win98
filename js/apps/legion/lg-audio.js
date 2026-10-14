(function (L) {
  'use strict';

  const GROUPS = {
    hit: ['hit1a', 'hit1b', 'hit1c', 'hit1d', 'hit1e', 'hit1f', 'hit1g', 'hit1h', 'hit2a', 'hit2b', 'hit2e', 'hit3a', 'hit3b', 'hit3c'],
    heavy: ['bigswordhit', 'bigswordhit2', 'hit2a', 'hit2e'],
    die: ['die1a', 'die1b', 'die1c', 'die1d', 'die1e', 'die1f', 'die1g'],
    cavdie: ['cavdie1a', 'cavdie1b', 'cavdie1c', 'cavdie1d', 'cavdie1e'],
    missile: ['missilehit1', 'missilehit2', 'missilehit3', 'missilehit4'],
    missilecav: ['missilehitcav1', 'missilehitcav2', 'missilehitcav3', 'missilehitcav4'],
    volley: ['arrowfire1'],
    select: ['selected1c', 'selected2c', 'selected3c'],
    received: ['received1c', 'received2c', 'received3c'],
    birds: ['bird1', 'bird2', 'bird3'],
    crows: ['crow1', 'crow2', 'crow3']
  };

  const TRACKS = { menu: 'frontend.mp3', deploy: 'deployment.mp3', battle: 'inbattle.mp3', won: 'battlewon.mp3', lost: 'battlelost.mp3' };

  class Audio {
    constructor() {
      this.vol = { music: 0.6, sfx: 0.85, voice: 0.8 };
      this.ctx = null;
      this.buffers = new Map();
      this.loading = new Map();
      this.recent = new Map();
      this.track = null;
      this.trackName = null;
      this.loops = new Map();
      this.enabled = true;
    }

    init() {
      if (this.ctx) return;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.load('tick');
      } catch (e) {
        this.ctx = null;
      }
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
      if (this.track && this.track.paused && this.wantPlay) this.track.play().catch(() => { });
    }

    setVolumes(v) {
      Object.assign(this.vol, v);
      if (this.track) this.track.volume = this.trackVol();
      for (const l of this.loops.values()) l.gain.gain.value = l.base * this.vol.sfx;
    }

    trackVol() {
      return L.clamp(this.vol.music * (this.trackName === 'won' || this.trackName === 'lost' ? 0.9 : 0.55), 0, 1);
    }

    music(name) {
      if (this.trackName === name && this.track) return;
      this.stopMusic();
      if (!name || typeof window === 'undefined') return;
      const a = new window.Audio(L.ASSET_ROOT + 'audio/music/' + TRACKS[name]);
      a.loop = name !== 'won' && name !== 'lost';
      this.track = a;
      this.trackName = name;
      a.volume = this.trackVol();
      this.wantPlay = true;
      a.play().catch(() => { });
    }

    stopMusic() {
      if (this.track) {
        this.track.pause();
        this.track.src = '';
      }
      this.track = null;
      this.trackName = null;
      this.wantPlay = false;
    }

    load(name) {
      if (this.buffers.has(name)) return Promise.resolve(this.buffers.get(name));
      if (this.loading.has(name)) return this.loading.get(name);
      if (!this.ctx) return Promise.resolve(null);
      const p = fetch(L.ASSET_ROOT + 'audio/sfx/' + name + '.mp3')
        .then(r => r.arrayBuffer())
        .then(b => this.ctx.decodeAudioData(b))
        .then(buf => { this.buffers.set(name, buf); return buf; })
        .catch(() => null);
      this.loading.set(name, p);
      return p;
    }

    preload(list) {
      this.init();
      for (const n of list) {
        const g = GROUPS[n];
        if (g) g.forEach(x => this.load(x));
        else this.load(n);
      }
    }

    pick(name) {
      const g = GROUPS[name];
      return g ? g[Math.floor(Math.random() * g.length)] : name;
    }

    play(name, o) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      o = o || {};
      const now = this.ctx.currentTime;
      const gap = o.gap == null ? 0.05 : o.gap;
      const last = this.recent.get(name) || 0;
      if (now - last < gap) return;
      this.recent.set(name, now);
      const file = this.pick(name);
      const buf = this.buffers.get(file);
      const vol = (o.vol == null ? 1 : o.vol) * (o.voice ? this.vol.voice : this.vol.sfx);
      if (vol <= 0.01) return;
      if (!buf) { this.load(file); return; }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = o.rate || (0.94 + Math.random() * 0.12);
      const g = this.ctx.createGain();
      g.gain.value = vol;
      let node = g;
      if (this.ctx.createStereoPanner && o.pan) {
        const p = this.ctx.createStereoPanner();
        p.pan.value = L.clamp(o.pan, -1, 1);
        g.connect(p);
        node = p;
      }
      node.connect(this.master);
      src.connect(g);
      src.start();
    }

    ui(name) {
      this.play(name || 'tick', { gap: 0.03, vol: 0.7, rate: 1 });
    }

    loop(name, base) {
      this.init();
      if (!this.ctx || this.loops.has(name)) return;
      const entry = { base, gain: this.ctx.createGain(), src: null };
      entry.gain.gain.value = 0;
      entry.gain.connect(this.master);
      this.loops.set(name, entry);
      this.load(name).then(buf => {
        if (!buf || !this.loops.has(name)) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(entry.gain);
        src.start();
        entry.src = src;
      });
    }

    loopLevel(name, level) {
      const e = this.loops.get(name);
      if (!e || !this.ctx) return;
      const target = L.clamp(level, 0, 1) * e.base * this.vol.sfx;
      e.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }

    stopLoops() {
      for (const e of this.loops.values()) {
        try { if (e.src) e.src.stop(); } catch (err) { }
        e.gain.disconnect();
      }
      this.loops.clear();
    }

    destroy() {
      this.stopMusic();
      this.stopLoops();
      if (this.ctx) this.ctx.close().catch(() => { });
      this.ctx = null;
    }
  }

  L.Audio = Audio;
})(globalThis.Legion = globalThis.Legion || {});
