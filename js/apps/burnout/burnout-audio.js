/**
 * Burnout: Championship Drag Racing - Procedural Web Audio Engine
 * Generates authentic big-block V8 rumble, supercharger whine, tire screech,
 * Christmas Tree beeps, backfire pops, nitrous hiss, and chute deploy sounds.
 */

class BurnoutAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.engineGain = null;
    this.blowerGain = null;
    this.burnoutGain = null;

    // Engine oscillators
    this.v8Osc1 = null;
    this.v8Osc2 = null;
    this.v8OscSub = null;
    this.camLfo = null;
    this.camLfoGain = null;

    // Supercharger / Blower whine
    this.blowerOsc = null;

    // Tire smoke / Burnout noise
    this.noiseNode = null;
    this.noiseFilter = null;

    this.isPlayingEngine = false;
    this.enabled = true;
    this.currentRpm = 1000;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('BurnoutAudio Web Audio API not supported', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.enabled = !muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.35;
    }
  }

  startEngine() {
    this.ensureContext();
    if (!this.ctx || this.isPlayingEngine) return;

    try {
      const t = this.ctx.currentTime;

      // Master engine sub-mix
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.25, t);
      this.engineGain.connect(this.masterGain);

      // Camshaft Lope LFO for that characteristic lumpy American V8 idle
      this.camLfo = this.ctx.createOscillator();
      this.camLfo.type = 'sine';
      this.camLfo.frequency.setValueAtTime(8, t); // 8 Hz idle lope

      this.camLfoGain = this.ctx.createGain();
      this.camLfoGain.gain.setValueAtTime(10, t);
      this.camLfo.connect(this.camLfoGain);

      // Primary V8 rumble (distorted sawtooth)
      this.v8Osc1 = this.ctx.createOscillator();
      this.v8Osc1.type = 'sawtooth';
      this.v8Osc1.frequency.setValueAtTime(55, t);

      // Connect camshaft lope to pitch
      this.camLfoGain.connect(this.v8Osc1.frequency);

      // Secondary V8 pulse (triangle, half pitch sub-octave)
      this.v8OscSub = this.ctx.createOscillator();
      this.v8OscSub.type = 'triangle';
      this.v8OscSub.frequency.setValueAtTime(27.5, t);

      // Firing pulses harmonic (square with low-pass)
      this.v8Osc2 = this.ctx.createOscillator();
      this.v8Osc2.type = 'square';
      this.v8Osc2.frequency.setValueAtTime(110, t);

      const v8Filter = this.ctx.createBiquadFilter();
      v8Filter.type = 'lowpass';
      v8Filter.frequency.setValueAtTime(600, t);
      v8Filter.Q.setValueAtTime(3, t);

      this.v8Osc1.connect(v8Filter);
      this.v8OscSub.connect(v8Filter);

      const v8Osc2Gain = this.ctx.createGain();
      v8Osc2Gain.gain.setValueAtTime(0.15, t);
      this.v8Osc2.connect(v8Osc2Gain);
      v8Osc2Gain.connect(v8Filter);

      v8Filter.connect(this.engineGain);

      // Supercharger / Blower high pitch whine
      this.blowerGain = this.ctx.createGain();
      this.blowerGain.gain.setValueAtTime(0.02, t);

      this.blowerOsc = this.ctx.createOscillator();
      this.blowerOsc.type = 'sine';
      this.blowerOsc.frequency.setValueAtTime(320, t);
      this.blowerOsc.connect(this.blowerGain);
      this.blowerGain.connect(this.masterGain);

      // Start oscillators
      this.camLfo.start(t);
      this.v8Osc1.start(t);
      this.v8OscSub.start(t);
      this.v8Osc2.start(t);
      this.blowerOsc.start(t);

      // Burnout tire noise generator
      this.initBurnoutNoise();

      this.isPlayingEngine = true;
    } catch (e) {
      console.warn('Failed to start V8 engine sound', e);
    }
  }

  initBurnoutNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.burnoutGain = this.ctx.createGain();
    this.burnoutGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.burnoutGain);
    this.burnoutGain.connect(this.masterGain);

    this.noiseNode.start(this.ctx.currentTime);
  }

  updateEngine(rpm, throttle = 0, isBurnout = false, isNitrous = false) {
    if (!this.isPlayingEngine || !this.ctx) return;
    this.currentRpm = rpm;

    const t = this.ctx.currentTime;
    const safeRpm = Math.max(900, Math.min(9000, rpm));

    // Base firing frequency for 8 cylinders: RPM / 60 * 4 = RPM / 15
    const baseFreq = safeRpm / 16;
    const subFreq = baseFreq * 0.5;
    const harmonicFreq = baseFreq * 2;

    if (this.v8Osc1) {
      this.v8Osc1.frequency.setTargetAtTime(baseFreq, t, 0.03);
    }
    if (this.v8OscSub) {
      this.v8OscSub.frequency.setTargetAtTime(subFreq, t, 0.03);
    }
    if (this.v8Osc2) {
      this.v8Osc2.frequency.setTargetAtTime(harmonicFreq, t, 0.03);
    }

    // Cam lope rate scales with RPM
    if (this.camLfo) {
      const lopeRate = 6 + (safeRpm / 1000) * 2;
      this.camLfo.frequency.setTargetAtTime(lopeRate, t, 0.05);
      // Reduce lope depth as RPM rises
      const lopeDepth = Math.max(0.5, 12 - (safeRpm / 700));
      this.camLfoGain.gain.setTargetAtTime(lopeDepth, t, 0.05);
    }

    // Supercharger whine frequency: 3x engine RPM
    if (this.blowerOsc && this.blowerGain) {
      const blowerFreq = 200 + (safeRpm * 0.35);
      this.blowerOsc.frequency.setTargetAtTime(blowerFreq, t, 0.03);

      const blowerVol = 0.01 + (throttle * 0.06) + (safeRpm / 9000) * 0.05;
      this.blowerGain.gain.setTargetAtTime(blowerVol, t, 0.04);
    }

    // Engine volume dynamics with throttle and nitrous
    if (this.engineGain) {
      let targetVol = 0.2 + (throttle * 0.18) + (safeRpm / 9000) * 0.12;
      if (isNitrous) targetVol += 0.08;
      this.engineGain.gain.setTargetAtTime(targetVol, t, 0.03);
    }

    // Burnout tire screech
    if (this.burnoutGain && this.noiseFilter) {
      const burnoutTarget = isBurnout ? (0.15 + throttle * 0.25) : 0;
      this.burnoutGain.gain.setTargetAtTime(burnoutTarget, t, 0.05);

      if (isBurnout) {
        const screechFreq = 1000 + (safeRpm * 0.18);
        this.noiseFilter.frequency.setTargetAtTime(screechFreq, t, 0.04);
      }
    }
  }

  stopEngine() {
    if (!this.isPlayingEngine || !this.ctx) return;
    try {
      if (this.v8Osc1) this.v8Osc1.stop();
      if (this.v8OscSub) this.v8OscSub.stop();
      if (this.v8Osc2) this.v8Osc2.stop();
      if (this.camLfo) this.camLfo.stop();
      if (this.blowerOsc) this.blowerOsc.stop();
      if (this.noiseNode) this.noiseNode.stop();
    } catch (e) {}

    this.isPlayingEngine = false;
  }

  // Gear Shift Bang / Backfire Pop
  playShiftClunk() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);

      // Backfire pop
      this.playBackfire();
    } catch (e) {}
  }

  playBackfire() {
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
      }

      const pop = this.ctx.createBufferSource();
      pop.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      pop.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      pop.start(t);
    } catch (e) {}
  }

  // Christmas Tree Amber Beep (0.500s countdown)
  playTreeAmber() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t); // Concert A (yellow tone)

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // Christmas Tree Green Beep (GO!)
  playTreeGreen() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t); // High A (Green tone)

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  // Foul / Red Light Buzzer
  playTreeFoul() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t); // Low harsh buzzer

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.6);
    } catch (e) {}
  }

  // Parachute deploy whoosh
  playChuteDeploy() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.6, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const whoosh = this.ctx.createBufferSource();
      whoosh.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.linearRampToValueAtTime(150, t + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

      whoosh.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whoosh.start(t);
    } catch (e) {}
  }

  // Crowd cheer on victory
  playCrowdCheer() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.5, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const crowd = this.ctx.createBufferSource();
      crowd.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, t);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.4);

      crowd.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      crowd.start(t);
    } catch (e) {}
  }

  // Retro button click
  playClick() {
    this.ensureContext();
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }
}

window.BurnoutAudio = BurnoutAudio;

