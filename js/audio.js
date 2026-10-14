class SystemMixer {
  constructor(win) {
    this.level = 1;
    this.buses = new Set();
    this.routed = new WeakSet();
    this.requested = new WeakMap();
    this.mediaRefs = new WeakMap();
    this.media = new Set();
    this.spoken = new WeakMap();
    this.doc = win.document;
    this.hookAudioContext(win);
    this.hookMedia(win);
    this.hookSpeech(win);
  }

  static descriptor(proto, key) {
    for (let p = proto; p; p = Object.getPrototypeOf(p)) {
      const d = Object.getOwnPropertyDescriptor(p, key);
      if (d) return d;
    }
    return null;
  }

  hookAudioContext(win) {
    const Native = win.AudioContext || win.webkitAudioContext;
    const destination = Native && SystemMixer.descriptor(Native.prototype, 'destination');
    if (!destination || !destination.get) return;
    const mixer = this;
    const buses = new WeakMap();
    class MixedAudioContext extends Native {
      constructor(...args) {
        super(...args);
        const bus = this.createGain();
        bus.gain.value = mixer.level;
        bus.connect(destination.get.call(this));
        buses.set(this, bus);
        mixer.buses.add(bus);
      }

      get destination() {
        return buses.get(this) || destination.get.call(this);
      }

      createMediaElementSource(el) {
        const node = super.createMediaElementSource(el);
        mixer.routed.add(el);
        mixer.track(el);
        return node;
      }

      close() {
        mixer.buses.delete(buses.get(this));
        return super.close();
      }
    }
    win.AudioContext = MixedAudioContext;
    if (win.webkitAudioContext) win.webkitAudioContext = MixedAudioContext;
  }

  hookMedia(win) {
    const proto = win.HTMLMediaElement && win.HTMLMediaElement.prototype;
    const volume = proto && SystemMixer.descriptor(proto, 'volume');
    if (!volume || !volume.get || !volume.set) return;
    const mixer = this;
    this.nativeVolume = volume;
    Object.defineProperty(proto, 'volume', {
      configurable: true,
      enumerable: volume.enumerable,
      get() {
        return mixer.requested.has(this) ? mixer.requested.get(this) : volume.get.call(this);
      },
      set(value) {
        const v = Number(value);
        if (!(v >= 0 && v <= 1)) {
          volume.set.call(this, value);
          return;
        }
        mixer.requested.set(this, v);
        mixer.track(this);
      }
    });
    const play = proto.play;
    proto.play = function (...args) {
      mixer.track(this);
      return play.apply(this, args);
    };
    if (this.doc) {
      this.doc.addEventListener('play', (e) => {
        if (e.target instanceof win.HTMLMediaElement) mixer.track(e.target);
      }, true);
    }
  }

  hookSpeech(win) {
    const synth = win.speechSynthesis;
    if (!synth || typeof synth.speak !== 'function') return;
    const speak = synth.speak;
    const mixer = this;
    synth.speak = function (utterance) {
      if (utterance) {
        if (!mixer.spoken.has(utterance)) mixer.spoken.set(utterance, utterance.volume);
        utterance.volume = mixer.spoken.get(utterance) * mixer.level;
      }
      return speak.call(this, utterance);
    };
  }

  track(el) {
    if (!this.nativeVolume) return;
    if (!this.mediaRefs.has(el)) {
      if (!this.requested.has(el)) this.requested.set(el, this.nativeVolume.get.call(el));
      const ref = new WeakRef(el);
      this.mediaRefs.set(el, ref);
      this.media.add(ref);
    }
    const target = this.requested.get(el) * (this.routed.has(el) ? 1 : this.level);
    if (this.nativeVolume.get.call(el) !== target) this.nativeVolume.set.call(el, target);
  }

  setLevel(level) {
    this.level = level;
    this.buses.forEach(bus => {
      const now = bus.context.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(level, now, 0.015);
    });
    this.media.forEach(ref => {
      const el = ref.deref();
      if (el) this.track(el);
      else this.media.delete(ref);
    });
    if (this.doc) this.doc.querySelectorAll('audio, video').forEach(el => this.track(el));
  }
}

class RetroAudio {
  static STORAGE_KEY = 'win98_volume';

  constructor(mixer) {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.8;
    this.loadSettings();
    this.mixer = mixer;
    this.mixer.setLevel(this.effectiveGain());
    this.initContext();
  }

  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(RetroAudio.STORAGE_KEY) || 'null');
      if (!saved) return;
      if (typeof saved.volume === 'number' && saved.volume >= 0 && saved.volume <= 1) this.masterVolume = saved.volume;
      this.muted = !!saved.muted;
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem(RetroAudio.STORAGE_KEY, JSON.stringify({ volume: this.masterVolume, muted: this.muted }));
    } catch (e) {}
  }

  initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.destination;
    }
  }

  effectiveGain() {
    return this.muted ? 0 : this.getMasterVolume();
  }

  ensureContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getMasterVolume() {
    return this.masterVolume !== undefined ? this.masterVolume : 0.8;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterVolume === 0) {
      this.setMuted(true);
    } else if (this.muted) {
      this.setMuted(false);
    } else {
      this.syncMedia();
    }
    this.saveSettings();
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  setMuted(val, remember = true) {
    this.muted = !!val;
    this.syncMedia();
    if (remember) this.saveSettings();
    return this.muted;
  }

  syncMedia() {
    this.mixer.setLevel(this.effectiveGain());

    if (window.appFallout2 && window.appFallout2.audio) {
      window.appFallout2.audio.enabled = !this.muted;
      if (window.appFallout2.audio.ambientGain) {
        window.appFallout2.audio.ambientGain.gain.value = this.muted ? 0 : 0.12;
      }
    }

    if (window.taskbar && window.taskbar.updateSpeakerState) {
      window.taskbar.updateSpeakerState();
    }

    document.querySelectorAll('.sndvol-master-mute').forEach(box => {
      box.checked = this.muted;
    });
    if (!this.muted) {
      const level = String(Math.round(this.masterVolume * 100));
      document.querySelectorAll('.sndvol-master-slider').forEach(slider => {
        if (slider.value !== level) slider.value = level;
      });
    }
  }

  // Check if onboard audio hardware is enabled in BIOS
  isHardwareAudioEnabled() {
    if (window.biosEngine && typeof window.biosEngine.isAudioEnabled === 'function') {
      return window.biosEngine.isAudioEnabled();
    }
    return true;
  }

  // PC Speaker Sound Generation (Authentic square wave synthesis)
  playSpeakerBeep(freq = 850, duration = 0.08, type = 'square', volume = 0.08) {
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.005);
      gain.gain.setValueAtTime(volume, now + duration - 0.005);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Speaker beep error:', e);
    }
  }

  // POST Normal Boot Beep (850Hz 90ms square wave)
  playPostBeep() {
    this.playSpeakerBeep(850, 0.09, 'square', 0.1);
  }

  // BIOS Setup Navigation / Keypress Chirp (450Hz 30ms)
  playBiosKeyBeep() {
    this.playSpeakerBeep(450, 0.03, 'square', 0.06);
  }

  // BIOS Setup Input Error / Limit Tone (320Hz 120ms)
  playBiosErrorBeep() {
    this.playSpeakerBeep(320, 0.12, 'square', 0.09);
  }

  // Floppy Drive 3.5" Head Seek / Recalibrate (series of mechanical stepper clicks)
  playFloppySeekSound() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const stepCount = 8;
    for (let i = 0; i < stepCount; i++) {
      const t = now + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + (i % 2) * 40, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.025);
    }
  }

  // System Halted Warning Tone
  playSystemHaltedBeep() {
    this.playSpeakerBeep(220, 0.6, 'sawtooth', 0.15);
  }

  // Win 98 Ambient Startup Chime
  playStartup() {
    if (this.muted || !this.isHardwareAudioEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { freq: 261.63, time: 0.0, dur: 2.2 }, // C4
      { freq: 392.00, time: 0.1, dur: 2.0 }, // G4
      { freq: 523.25, time: 0.3, dur: 2.0 }, // C5
      { freq: 659.25, time: 0.5, dur: 2.2 }, // E5
      { freq: 783.99, time: 0.7, dur: 2.5 }, // G5
      { freq: 1046.50, time: 0.9, dur: 3.0 } // C6
    ];

    const now = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(0.08, now + n.time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // Button / Menu Click (Short snappy mechanical pulse)
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  // Asterisk / Information Ding (Bright 2-tone chime)
  playDing() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [659.25, 987.77].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // System Error / Stop Chord (Classic low abrasive dual-tone alert)
  playError() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [150, 225].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // Minesweeper Explosion (Deep noise rumble + sub-bass drop)
  playExplosion() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
  }

  // Shutdown Chime (Descending peaceful chords)
  playShutdown() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { freq: 783.99, time: 0.0, dur: 1.0 }, // G5
      { freq: 659.25, time: 0.2, dur: 1.0 }, // E5
      { freq: 523.25, time: 0.4, dur: 1.2 }, // C5
      { freq: 392.00, time: 0.6, dur: 1.5 }  // G4
    ];

    const now = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.08, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // Recycle Bin Trash Emptied (Paper crinkle)
  playRecycle() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // Wolfenstein 3D Pistol Gunshot
  playGunshot() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast noise blast
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Punch oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Enemy Alert Shout ("Achtung!")
  playEnemyAlert() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(550, now + 0.08);
    osc.frequency.linearRampToValueAtTime(330, now + 0.22);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Enemy Guard Death Scream
  playEnemyDeath() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Player Pain Grunt
  playPlayerPain() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Sliding Door Open/Close
  playDoor() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Item Pickup Chime
  playItemPickup() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  // LucasArts SCUMM Speech Dialogue Blip
  playTalkBlip(pitch = 300) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch + (Math.random() * 40 - 20), now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // LucasArts iMUSE-style Whimsical Adventure Music Sequencer
  playAdventureMusic() {
    this.stopAdventureMusic();
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // A playful Caribbean-pirate reggae melody progression (F, C, Dm, Bb)
    const melody = [
      { note: 349.23, dur: 0.22 }, // F4
      { note: 440.00, dur: 0.22 }, // A4
      { note: 523.25, dur: 0.45 }, // C5
      { note: 440.00, dur: 0.22 }, // A4
      { note: 392.00, dur: 0.45 }, // G4
      { note: 329.63, dur: 0.22 }, // E4
      { note: 261.63, dur: 0.45 }, // C4
      { note: 293.66, dur: 0.22 }, // D4
      { note: 349.23, dur: 0.22 }, // F4
      { note: 440.00, dur: 0.45 }, // A4
      { note: 392.00, dur: 0.22 }, // G4
      { note: 349.23, dur: 0.22 }, // F4
      { note: 329.63, dur: 0.22 }, // E4
      { note: 293.66, dur: 0.22 }, // D4
      { note: 261.63, dur: 0.45 }  // C4
    ];

    const bass = [
      174.61, 0, 174.61, 0, // F3
      130.81, 0, 130.81, 0, // C3
      146.83, 0, 146.83, 0, // D3
      116.54, 0, 130.81, 0  // Bb2, C3
    ];

    let step = 0;
    const tempo = 220; // ms per eighth note

    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass note (warm marimba/pluck)
      const bFreq = bass[step % bass.length];
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bFreq, now);

        bGain.gain.setValueAtTime(0.09, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bOsc.connect(bGain);
        bGain.connect(this.masterGain);
        bOsc.start(now);
        bOsc.stop(now + 0.2);
      }

      // Melody note (retro square/flute)
      const mItem = melody[step % melody.length];
      if (mItem && (step % 2 === 0)) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(mItem.note, now);

        mGain.gain.setValueAtTime(0.07, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + mItem.dur);

        mOsc.connect(mGain);
        mGain.connect(this.masterGain);
        mOsc.start(now);
        mOsc.stop(now + mItem.dur);
      }

      step++;
    }, tempo);
  }

  stopAdventureMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // Webmaster Dima's Retro 90s MIDI Pop/Eurodance BGSOUND Sequencer
  playDimaMidi() {
    this.stopDimaMidi();
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Upbeat 90s euro-pop melody (Am - F - C - G pattern)
    const melody = [
      { note: 440.00, dur: 0.16 }, // A4
      { note: 523.25, dur: 0.16 }, // C5
      { note: 659.25, dur: 0.28 }, // E5
      { note: 523.25, dur: 0.16 }, // C5
      { note: 349.23, dur: 0.16 }, // F4
      { note: 440.00, dur: 0.16 }, // A4
      { note: 523.25, dur: 0.28 }, // C5
      { note: 440.00, dur: 0.16 }, // A4
      { note: 523.25, dur: 0.16 }, // C5
      { note: 659.25, dur: 0.16 }, // E5
      { note: 783.99, dur: 0.28 }, // G5
      { note: 659.25, dur: 0.16 }, // E5
      { note: 392.00, dur: 0.16 }, // G4
      { note: 493.88, dur: 0.16 }, // B4
      { note: 587.33, dur: 0.28 }, // D5
      { note: 493.88, dur: 0.16 }  // B4
    ];

    const bass = [
      110.00, 110.00, 110.00, 110.00, // A2
      87.31, 87.31, 87.31, 87.31,     // F2
      130.81, 130.81, 130.81, 130.81, // C3
      98.00, 98.00, 98.00, 98.00      // G2
    ];

    let step = 0;
    const tempo = 150; // ms per sixteenth note

    this.dimaMidiTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass synth (punchy saw bass)
      const bFreq = bass[step % bass.length];
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bFreq, now);

        bGain.gain.setValueAtTime(0.06, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        bOsc.connect(bGain);
        bGain.connect(this.masterGain);
        bOsc.start(now);
        bOsc.stop(now + 0.13);
      }

      // Melody synth (bright retro square wave)
      const mItem = melody[step % melody.length];
      if (mItem) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'square';
        mOsc.frequency.setValueAtTime(mItem.note, now);

        mGain.gain.setValueAtTime(0.045, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + mItem.dur);

        mOsc.connect(mGain);
        mGain.connect(this.masterGain);
        mOsc.start(now);
        mOsc.stop(now + mItem.dur);
      }

      step++;
    }, tempo);
  }

  stopDimaMidi() {
    if (this.dimaMidiTimer) {
      clearInterval(this.dimaMidiTimer);
      this.dimaMidiTimer = null;
    }
  }

  // S.T.A.L.K.E.R. Geiger Counter Crackle
  playGeiger(intensity = 3) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const count = Math.min(Math.max(intensity, 1), 8);
    const now = this.ctx.currentTime;

    for (let i = 0; i < count; i++) {
      const clickTime = now + (i * 0.04 + Math.random() * 0.05);
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.003);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3200 + Math.random() * 1200, clickTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.005);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(clickTime);
    }
  }

  // S.T.A.L.K.E.R. PDA Message Beep (Iconic two-tone chime)
  playPDABeep() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const tones = [
      { freq: 1174.66, t: 0, dur: 0.07 }, // D6
      { freq: 1567.98, t: 0.08, dur: 0.12 } // G6
    ];

    tones.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.t);

      gain.gain.setValueAtTime(0.14, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.dur);
    });
  }

  // S.T.A.L.K.E.R. Campfire Guitar Arpeggio (Atmospheric Am acoustic chords)
  playStalkerGuitar() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // A classic melancholic Russian stalker guitar picking pattern
    const notes = [
      { freq: 110.00, time: 0.00, dur: 1.2 }, // A2
      { freq: 220.00, time: 0.20, dur: 0.9 }, // A3
      { freq: 261.63, time: 0.40, dur: 0.9 }, // C4
      { freq: 329.63, time: 0.60, dur: 0.9 }, // E4
      { freq: 261.63, time: 0.85, dur: 0.8 }, // C4
      { freq: 220.00, time: 1.05, dur: 0.8 }, // A3
      { freq: 123.47, time: 1.30, dur: 1.2 }, // B2
      { freq: 246.94, time: 1.50, dur: 0.9 }, // B3
      { freq: 293.66, time: 1.70, dur: 0.9 }, // D4
      { freq: 329.63, time: 1.95, dur: 1.5 }  // E4
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Triangle with subtle harmonic for nylon acoustic string tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.linearRampToValueAtTime(0.12, now + n.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // S.T.A.L.K.E.R. Zone Ambient Drone / Anomaly Hum
  playZoneDrone() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now); // A1
    osc1.frequency.linearRampToValueAtTime(53, now + 1.8);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, now);
    osc2.frequency.linearRampToValueAtTime(112, now + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(160, now + 1.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  }

  // S.T.A.L.K.E.R. Blowout / Emission Siren & Thunder
  playBlowout() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low seismic rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.linearRampToValueAtTime(30, now + 1.5);

    oscGain.gain.setValueAtTime(0.18, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);

    // Warning alert siren pitch
    const siren = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();
    siren.type = 'sawtooth';
    siren.frequency.setValueAtTime(440, now + 0.1);
    siren.frequency.linearRampToValueAtTime(660, now + 0.6);
    siren.frequency.linearRampToValueAtTime(440, now + 1.1);

    const sFilter = this.ctx.createBiquadFilter();
    sFilter.type = 'bandpass';
    sFilter.frequency.setValueAtTime(550, now + 0.1);

    sirenGain.gain.setValueAtTime(0.09, now + 0.1);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    siren.connect(sFilter);
    sFilter.connect(sirenGain);
    sirenGain.connect(this.masterGain);
    siren.start(now + 0.1);
    siren.stop(now + 1.3);
  }

  // Classic ICQ "Uh-Oh!" Alert Sound
  playIcqUhOh() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // "Uh" (lower tone)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(370, now);
    osc1.frequency.linearRampToValueAtTime(320, now + 0.12);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // "-Oh!" (higher tone with friendly inflection)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(540, now + 0.14);
    osc2.frequency.linearRampToValueAtTime(640, now + 0.28);
    osc2.frequency.linearRampToValueAtTime(480, now + 0.42);
    gain2.gain.setValueAtTime(0.15, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.44);
  }

  // Authentic ICQ Message Transmit / Send sound (typewriter clack)
  playIcqSend() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Mechanical key-strike click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);

    // Subtle metallic return bell/spring tap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2200, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain2.gain.setValueAtTime(0.08, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.08);
  }

  // Authentic ICQ Contact Online "Knock-Knock" Sound
  playIcqKnock() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playKnock = (time) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, time);
      osc.frequency.exponentialRampToValueAtTime(140, time + 0.045);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.045);
    };

    playKnock(now);
    playKnock(now + 0.11);
  }

  // ICQ File Transfer Complete Chime
  playIcqFileDone() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.18);
    });
  }

  // Card slide / flip
  playCardFlip() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.08, now);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  // Card place on pile
  playCardPlace() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Solitaire Win Fanfare
  playSolitaireWin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const chords = [
      { f: 523.25, t: 0.0, d: 0.2 }, // C5
      { f: 659.25, t: 0.15, d: 0.2 }, // E5
      { f: 783.99, t: 0.3, d: 0.2 }, // G5
      { f: 1046.5, t: 0.45, d: 0.6 } // C6
    ];
    const now = this.ctx.currentTime;
    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);
      gain.gain.setValueAtTime(0.12, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + c.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + c.t);
      osc.stop(now + c.t + c.d);
    });
  }

  // Pinball Flipper Clack
  playPinballFlipper() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Pinball Bumper Hit
  playPinballBumper() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [880, 1174, 1480];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.15);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Pinball Plunger Release
  playPinballPlunger() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.08);
    osc.frequency.linearRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Pinball: generic short tone sequence ({ f, t, d, to? } notes)
  playPinballTones(notes, type = 'square', vol = 0.08) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d);
      gain.gain.setValueAtTime(vol, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.01);
    });
  }

  // Defrag Mechanical HDD Tick
  playDefragTick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  // Clippy Screen Tap
  playClippyTap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Clippy Gentle Snoring (when sleeping)
  playClippySnore() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.4);
    osc.frequency.linearRampToValueAtTime(100, now + 0.8);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  // Clippy Witty Whistle / Surprise Chirp
  playClippyWhistle() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Clippy Victory Mini-Fanfare
  playClippyVictory() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.1 },
      { f: 659.25, t: 0.1, d: 0.1 },
      { f: 783.99, t: 0.2, d: 0.1 },
      { f: 1046.50, t: 0.3, d: 0.35 }
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.06, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  playClippyWoosh() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playClippyBulb() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [[1318.5, 0], [1760, 0.11]].forEach(([freq, offset]) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + offset;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  playClippyScribble() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 0.5);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const stroke = Math.sin((i / rate) * Math.PI * 14) > 0 ? 1 : 0.15;
      data[i] = (Math.random() * 2 - 1) * stroke;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.5);
  }

  playRockyBark() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.2].forEach((offset, i) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i ? 380 : 440, t);
      osc.frequency.exponentialRampToValueAtTime(170, t + 0.13);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(500, t + 0.13);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // Win 98 Shutdown Sound
  playShutdown() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { freq: 659.25, time: 0.0, dur: 1.2 }, // E5
      { freq: 587.33, time: 0.25, dur: 1.2 }, // D5
      { freq: 493.88, time: 0.5, dur: 1.4 }, // B4
      { freq: 392.00, time: 0.75, dur: 1.8 }, // G4
      { freq: 293.66, time: 1.0, dur: 2.2 }, // D4
      { freq: 261.63, time: 1.25, dur: 2.6 } // C4
    ];

    const now = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(0.08, now + n.time + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // Win 98 Chord Sound (Majestic 4-voice C-major chord)
  playChord() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const freqs = [261.63, 329.63, 392.00, 523.25];
    const now = this.ctx.currentTime;
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  playNewMail() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [[1046.5, 0], [783.99, 0.14], [1318.51, 0.3]].forEach(([f, offset]) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + offset;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // Win 98 Question sound
  playQuestion() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // DirectX Diagnostic Test Tone
  playTestTone(freq = 440, duration = 0.5) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // CD-ROM Tray Eject Sound (Motor whirr + mechanical thud)
  playCdEject() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.15;

    // 1. Motor hum
    const motor = this.ctx.createOscillator();
    const motorGain = this.ctx.createGain();
    motor.type = 'triangle';
    motor.frequency.setValueAtTime(220, now);
    motor.frequency.linearRampToValueAtTime(140, now + 0.45);

    motorGain.gain.setValueAtTime(vol * 0.6, now);
    motorGain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.35);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    motor.connect(motorGain);
    motorGain.connect(this.masterGain);
    motor.start(now);
    motor.stop(now + 0.5);

    // 2. Mechanical latch clack at the end of travel
    const clackTime = now + 0.38;
    const clack = this.ctx.createOscillator();
    const clackGain = this.ctx.createGain();
    clack.type = 'square';
    clack.frequency.setValueAtTime(450, clackTime);
    clack.frequency.exponentialRampToValueAtTime(80, clackTime + 0.08);

    clackGain.gain.setValueAtTime(vol * 0.9, clackTime);
    clackGain.gain.exponentialRampToValueAtTime(0.001, clackTime + 0.09);

    clack.connect(clackGain);
    clackGain.connect(this.masterGain);
    clack.start(clackTime);
    clack.stop(clackTime + 0.1);
  }

  // CD-ROM Spindle Spin-Up & Laser Seek Sound
  playCdSpinUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.14;

    // 1. Initial tray latch chunk
    const chunk = this.ctx.createOscillator();
    const chunkGain = this.ctx.createGain();
    chunk.type = 'sine';
    chunk.frequency.setValueAtTime(160, now);
    chunk.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    chunkGain.gain.setValueAtTime(vol * 0.8, now);
    chunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    chunk.connect(chunkGain);
    chunkGain.connect(this.masterGain);
    chunk.start(now);
    chunk.stop(now + 0.12);

    // 2. Laser seek head stepping (rapid ticks)
    [0.15, 0.22, 0.28, 0.45].forEach((delay) => {
      const t = now + delay;
      const tick = this.ctx.createOscillator();
      const tickGain = this.ctx.createGain();
      tick.type = 'square';
      tick.frequency.setValueAtTime(1400, t);
      tick.frequency.exponentialRampToValueAtTime(300, t + 0.02);
      tickGain.gain.setValueAtTime(vol * 0.4, t);
      tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      tick.connect(tickGain);
      tickGain.connect(this.masterGain);
      tick.start(t);
      tick.stop(t + 0.03);
    });

    // 3. Spindle motor spin up (accelerating whine: 180Hz -> 1400Hz)
    const spin = this.ctx.createOscillator();
    const spinGain = this.ctx.createGain();
    spin.type = 'sawtooth';
    spin.frequency.setValueAtTime(180, now + 0.2);
    spin.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
    spin.frequency.linearRampToValueAtTime(950, now + 1.6);

    // Lowpass filter to simulate enclosure
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 1.2);

    spinGain.gain.setValueAtTime(0.001, now + 0.2);
    spinGain.gain.linearRampToValueAtTime(vol * 0.45, now + 0.7);
    spinGain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

    spin.connect(filter);
    filter.connect(spinGain);
    spinGain.connect(this.masterGain);
    spin.start(now + 0.2);
    spin.stop(now + 1.7);
  }

  // Page Flip Sound for magazine shell
  playPageFlip() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // =========================================================================
  // 56k V.90 MODEM & DIAL-UP AUDIO SYNTHESIZER
  // =========================================================================
  playDialTone() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.stopModemAudio();

    const now = this.ctx.currentTime;
    const vol = 0.12;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(350, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(vol, now);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);

    this.activeModemNodes = [osc1, osc2, gain];
  }

  playDtmfTone(digit, startTime, duration = 0.08) {
    if (this.muted || !this.ctx) return;
    const dtmfFreqs = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '0': [941, 1336], '*': [941, 1209], '#': [941, 1477]
    };
    const freqs = dtmfFreqs[digit] || [697, 1209];
    const vol = 0.14;

    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    o1.type = 'sine';
    o1.frequency.setValueAtTime(freqs[0], startTime);
    o2.type = 'sine';
    o2.frequency.setValueAtTime(freqs[1], startTime);

    g.gain.setValueAtTime(vol, startTime);
    g.gain.setValueAtTime(vol, startTime + duration - 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    o1.connect(g);
    o2.connect(g);
    g.connect(this.masterGain);

    o1.start(startTime);
    o2.start(startTime);
    o1.stop(startTime + duration);
    o2.stop(startTime + duration);
  }

  playRingbackTone(startTime, duration = 1.6) {
    if (this.muted || !this.ctx) return;
    const vol = 0.12;

    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    o1.type = 'sine';
    o1.frequency.setValueAtTime(440, startTime);
    o2.type = 'sine';
    o2.frequency.setValueAtTime(480, startTime);

    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + 0.05);
    g.gain.setValueAtTime(vol, startTime + duration - 0.05);
    g.gain.linearRampToValueAtTime(0.001, startTime + duration);

    o1.connect(g);
    o2.connect(g);
    g.connect(this.masterGain);

    o1.start(startTime);
    o2.start(startTime);
    o1.stop(startTime + duration);
    o2.stop(startTime + duration);
  }

  playModemHandshake(onConnectedCallback = null) {
    if (this.muted) {
      if (onConnectedCallback) setTimeout(onConnectedCallback, 4500);
      return;
    }
    this.ensureContext();
    if (!this.ctx) {
      if (onConnectedCallback) setTimeout(onConnectedCallback, 4500);
      return;
    }
    this.stopModemAudio();

    const now = this.ctx.currentTime;
    const vol = 0.16;

    // 1. V.8 Answering Tone (2100Hz with 15Hz AM)
    const ansOsc = this.ctx.createOscillator();
    const ansGain = this.ctx.createGain();
    const amOsc = this.ctx.createOscillator();
    const amGain = this.ctx.createGain();

    ansOsc.type = 'sine';
    ansOsc.frequency.setValueAtTime(2100, now);

    amOsc.type = 'sine';
    amOsc.frequency.setValueAtTime(15, now);
    amGain.gain.setValueAtTime(0.3, now);

    ansGain.gain.setValueAtTime(0.001, now);
    ansGain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.1);
    ansGain.gain.setValueAtTime(vol * 0.9, now + 1.2);
    ansGain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

    ansOsc.connect(ansGain);
    ansGain.connect(this.masterGain);
    ansOsc.start(now);
    ansOsc.stop(now + 1.35);

    // 2. V.34 Dual chirps & probing tones (t = 1.4s to 2.4s)
    const chirp1 = this.ctx.createOscillator();
    const chirp2 = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();

    chirp1.type = 'sawtooth';
    chirp2.type = 'triangle';

    chirp1.frequency.setValueAtTime(600, now + 1.4);
    chirp1.frequency.exponentialRampToValueAtTime(1800, now + 1.8);
    chirp1.frequency.linearRampToValueAtTime(1200, now + 2.3);

    chirp2.frequency.setValueAtTime(1400, now + 1.4);
    chirp2.frequency.exponentialRampToValueAtTime(2600, now + 1.9);
    chirp2.frequency.linearRampToValueAtTime(800, now + 2.3);

    chirpGain.gain.setValueAtTime(0.001, now + 1.4);
    chirpGain.gain.linearRampToValueAtTime(vol * 0.75, now + 1.45);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 2.35);

    chirp1.connect(chirpGain);
    chirp2.connect(chirpGain);
    chirpGain.connect(this.masterGain);

    chirp1.start(now + 1.4);
    chirp2.start(now + 1.4);
    chirp1.stop(now + 2.35);
    chirp2.stop(now + 2.35);

    // 3. V.90 Constellation Equalizer Noise (Digital static hiss & roar: t = 2.4s to 4.5s)
    const bufferSize = Math.floor(this.ctx.sampleRate * 2.2);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1600, now + 2.4);
    bpf.Q.setValueAtTime(1.2, now + 2.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now + 2.4);
    noiseGain.gain.linearRampToValueAtTime(vol * 1.1, now + 2.5);
    noiseGain.gain.setValueAtTime(vol * 1.1, now + 4.3);
    noiseGain.gain.linearRampToValueAtTime(vol * 0.4, now + 4.45);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.55);

    whiteNoise.connect(bpf);
    bpf.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(now + 2.4);
    whiteNoise.stop(now + 4.55);

    // 4. Relay Click at connect (t = 4.58s)
    setTimeout(() => {
      this.playClick();
      if (onConnectedCallback) onConnectedCallback();
    }, 4580);
  }

  stopModemAudio() {
    if (this.activeModemNodes) {
      this.activeModemNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (e) {}
      });
      this.activeModemNodes = null;
    }
  }

  // =========================================================================
  // KASPERSKY AVP 3.0 VIRUS ALERT (PIG SQUEAL SOUND)
  // =========================================================================
  playAvpPigSqueal() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.28;

    const playSquealBurst = (startTime) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch LFO for chaotic squeal vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      lfo.type = 'sawtooth';
      lfo.frequency.setValueAtTime(36, startTime);
      lfoGain.gain.setValueAtTime(140, startTime);
      lfo.connect(osc.frequency);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1450, startTime);
      osc.frequency.exponentialRampToValueAtTime(550, startTime + 0.22);
      osc.frequency.exponentialRampToValueAtTime(1600, startTime + 0.35);
      osc.frequency.exponentialRampToValueAtTime(420, startTime + 0.48);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.04);
      gain.gain.setValueAtTime(vol * 0.9, startTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      lfo.start(startTime);
      osc.start(startTime);
      lfo.stop(startTime + 0.5);
      osc.stop(startTime + 0.5);
    };

    // Double squeal like authentic AVP
    playSquealBurst(now);
    playSquealBurst(now + 0.55);
  }

  // =========================================================================
  // MICROSLOP PLUS! 98 THEME SOUND SCHEMES
  // =========================================================================
  playPlusSound(themeId, eventType) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = 0.15;

    switch (themeId) {
      case 'space': {
        if (eventType === 'startup') {
          // Cosmic synth sweep
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 1.2);
        } else if (eventType === 'error') {
          // Laser zap
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.25);
        } else if (eventType === 'click') {
          // Sonar beep
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1800, now);
          gain.gain.setValueAtTime(vol * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.08);
        }
        break;
      }
      case 'underwater': {
        if (eventType === 'startup' || eventType === 'click') {
          // Water bubble pop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.09);
          gain.gain.setValueAtTime(vol * 0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.09);
        } else if (eventType === 'error') {
          // Submarine horn
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          gain.gain.setValueAtTime(vol * 0.9, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.6);
        }
        break;
      }
      case 'creatures': {
        if (eventType === 'error' || eventType === 'startup') {
          // Low growl/roar
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.35);
          gain.gain.setValueAtTime(vol * 0.9, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.4);
        } else {
          this.playClick();
        }
        break;
      }
      case 'mystery': {
        if (eventType === 'startup' || eventType === 'error') {
          // Pipe organ minor chord
          const freqs = [293.66, 349.23, 440.00]; // Dm (D4, F4, A4)
          freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(vol * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start(now); osc.stop(now + 0.9);
          });
        } else {
          this.playDing();
        }
        break;
      }
      case 'jungle': {
        if (eventType === 'startup' || eventType === 'error') {
          // Tribal drum hit + bird chirp
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
          gain.gain.setValueAtTime(vol * 1.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.3);
        } else {
          this.playClick();
        }
        break;
      }
      case 'matrix': {
        if (eventType === 'startup') {
          // Matrix phone trace / digital connect tone
          [0, 0.1, 0.2, 0.3].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440 * (i + 1), now + t);
            gain.gain.setValueAtTime(vol * 0.7, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start(now + t); osc.stop(now + t + 0.08);
          });
          // Deep sub-pulse
          const sub = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          sub.type = 'sine';
          sub.frequency.setValueAtTime(110, now + 0.35);
          sub.frequency.exponentialRampToValueAtTime(45, now + 0.9);
          subGain.gain.setValueAtTime(vol * 1.1, now + 0.35);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          sub.connect(subGain); subGain.connect(this.masterGain);
          sub.start(now + 0.35); sub.stop(now + 0.9);
        } else if (eventType === 'click') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2200, now);
          gain.gain.setValueAtTime(vol * 0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.03);
        } else if (eventType === 'error') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.22);
        }
        break;
      }
      case 'cyberpunk': {
        if (eventType === 'startup') {
          [220, 277.18, 329.63, 440].forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(vol * 0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start(now); osc.stop(now + 0.9);
          });
        } else {
          this.playClick();
        }
        break;
      }
      case 'redalert': {
        if (eventType === 'startup' || eventType === 'error') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(587, now + 0.15);
          gain.gain.setValueAtTime(vol * 0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain); gain.connect(this.masterGain);
          osc.start(now); osc.stop(now + 0.35);
        } else {
          this.playClick();
        }
        break;
      }
      default:
        if (eventType === 'click') this.playClick();
        else if (eventType === 'error') this.playError();
        else if (eventType === 'startup') this.playStartup();
        break;
    }
  }

  // =========================================================================
  // CANYON.MID / PASSPORT.MID MIDI CHIPSET SYNTHESIZER
  // =========================================================================
  playCanyonMidi() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.stopMidiPlayback();

    // Iconic Canyon.mid opening motif notes (pitch in Hz, start offset in sec, duration in sec)
    // Tempo: 132 BPM
    const beat = 60 / 132;
    const notes = [
      // Bar 1 - Slap Bass & Lead
      { f: 130.81, t: 0 * beat, d: beat * 0.8, type: 'triangle', vol: 0.15 }, // C3
      { f: 523.25, t: 0 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // C5
      { f: 659.25, t: 0.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // E5
      { f: 783.99, t: 1.0 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // G5
      { f: 880.00, t: 1.5 * beat, d: beat * 0.6, type: 'sawtooth', vol: 0.11 }, // A5
      { f: 130.81, t: 2 * beat, d: beat * 0.8, type: 'triangle', vol: 0.15 }, // C3
      { f: 783.99, t: 2.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // G5
      { f: 659.25, t: 3.0 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // E5
      { f: 587.33, t: 3.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // D5

      // Bar 2 - F Bass & Lead
      { f: 174.61, t: 4 * beat, d: beat * 0.8, type: 'triangle', vol: 0.15 }, // F3
      { f: 523.25, t: 4 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // C5
      { f: 698.46, t: 4.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // F5
      { f: 880.00, t: 5.0 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // A5
      { f: 1046.50, t: 5.5 * beat, d: beat * 0.6, type: 'sawtooth', vol: 0.11 }, // C6
      { f: 174.61, t: 6 * beat, d: beat * 0.8, type: 'triangle', vol: 0.15 }, // F3
      { f: 880.00, t: 6.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // A5
      { f: 698.46, t: 7.0 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // F5
      { f: 587.33, t: 7.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.08 }, // D5

      // Bar 3 - G Bass & Resolution
      { f: 196.00, t: 8 * beat, d: beat * 0.8, type: 'triangle', vol: 0.15 }, // G3
      { f: 783.99, t: 8 * beat, d: beat * 0.8, type: 'sawtooth', vol: 0.09 }, // G5
      { f: 880.00, t: 9 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // A5
      { f: 987.77, t: 9.5 * beat, d: beat * 0.4, type: 'sawtooth', vol: 0.09 }, // B5
      { f: 1046.50, t: 10 * beat, d: beat * 1.5, type: 'sawtooth', vol: 0.12 }, // C6
      { f: 130.81, t: 10 * beat, d: beat * 1.8, type: 'triangle', vol: 0.18 } // C3 root
    ];

    const now = this.ctx.currentTime;
    this.activeMidiNodes = [];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + n.t;

      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(n.vol, start + 0.03);
      gain.gain.setValueAtTime(n.vol, start + n.d - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + n.d);
      this.activeMidiNodes.push(osc, gain);
    });
  }

  stopMidiPlayback() {
    if (this.activeMidiNodes) {
      this.activeMidiNodes.forEach(n => {
        try {
          if (n.stop) n.stop();
          if (n.disconnect) n.disconnect();
        } catch (e) {}
      });
      this.activeMidiNodes = null;
    }
  }

}

window.systemMixer = new SystemMixer(window);
window.soundSys = new RetroAudio(window.systemMixer);

