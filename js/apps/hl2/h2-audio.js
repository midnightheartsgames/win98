(function (H) {
  'use strict';

  const R = {
    pistol: [{ n: 1, f: 2200, q: 0.8, d: 0.11, v: 0.55 }, { t: 'square', f0: 220, f1: 60, d: 0.07, v: 0.25 }],
    magnum: [{ n: 1, f: 1200, q: 0.7, d: 0.35, v: 0.9 }, { t: 'sawtooth', f0: 120, f1: 40, d: 0.25, v: 0.4 }],
    smg: [{ n: 1, f: 2600, q: 1, d: 0.07, v: 0.4 }, { t: 'square', f0: 260, f1: 90, d: 0.05, v: 0.18 }],
    ar2: [{ n: 1, f: 3200, q: 2, d: 0.08, v: 0.35 }, { t: 'sawtooth', f0: 900, f1: 200, d: 0.09, v: 0.22 }],
    shotgun: [{ n: 1, f: 900, q: 0.6, d: 0.3, v: 0.9 }, { t: 'square', f0: 110, f1: 40, d: 0.18, v: 0.35 }],
    shotgun_double: [{ n: 1, f: 800, q: 0.6, d: 0.45, v: 1 }, { t: 'square', f0: 90, f1: 30, d: 0.3, v: 0.45 }],
    crossbow: [{ n: 1, f: 4000, q: 3, d: 0.12, v: 0.35 }, { t: 'triangle', f0: 900, f1: 300, d: 0.1, v: 0.2 }],
    smg_gl: [{ n: 1, f: 600, q: 1, d: 0.2, v: 0.6 }, { t: 'sine', f0: 200, f1: 80, d: 0.15, v: 0.3 }],
    ar2_ball: [{ t: 'sawtooth', f0: 200, f1: 1600, d: 0.35, v: 0.35 }, { n: 1, f: 3000, q: 4, d: 0.3, v: 0.3 }],
    rpg: [{ n: 1, f: 500, q: 0.5, d: 0.8, v: 0.7, a: 0.02 }, { t: 'sawtooth', f0: 80, f1: 50, d: 0.6, v: 0.25 }],
    tau: [{ t: 'sawtooth', f0: 1800, f1: 400, d: 0.15, v: 0.3 }, { n: 1, f: 5000, q: 3, d: 0.1, v: 0.25 }],
    airboat_gun: [{ t: 'square', f0: 1400, f1: 500, d: 0.04, v: 0.18 }, { n: 1, f: 4000, q: 3, d: 0.04, v: 0.15 }],
    overheat: [{ t: 'square', f0: 900, f1: 300, d: 0.5, v: 0.2 }],
    explode: [{ n: 1, f: 300, q: 0.5, d: 1.4, v: 1.2, a: 0.005 }, { t: 'sine', f0: 90, f1: 30, d: 0.9, v: 0.7 }, { n: 1, f: 1600, q: 0.6, d: 0.25, v: 0.4 }],
    crowbar_swing: [{ n: 1, f: 1200, q: 1.5, d: 0.18, v: 0.25, a: 0.06 }],
    crowbar_hit: [{ t: 'triangle', f0: 1800, f1: 1400, d: 0.25, v: 0.3 }, { n: 1, f: 3000, q: 2, d: 0.08, v: 0.3 }],
    crowbar_flesh: [{ n: 1, f: 400, q: 1, d: 0.12, v: 0.5 }, { t: 'sine', f0: 140, f1: 60, d: 0.1, v: 0.3 }],
    stunstick: [{ n: 1, f: 3500, q: 4, d: 0.2, v: 0.3 }, { t: 'square', f0: 120, f1: 110, d: 0.2, v: 0.12 }],
    empty: [{ t: 'square', f0: 1800, f1: 1800, d: 0.03, v: 0.15 }],
    draw: [{ n: 1, f: 2500, q: 3, d: 0.06, v: 0.15 }, { t: 'square', f0: 700, f1: 500, d: 0.04, v: 0.08, delay: 0.1 }],
    shell: [{ t: 'square', f0: 900, f1: 600, d: 0.05, v: 0.15 }, { n: 1, f: 2000, q: 3, d: 0.05, v: 0.15 }],
    zoom: [{ t: 'sine', f0: 600, f1: 1200, d: 0.1, v: 0.1 }],
    throw: [{ n: 1, f: 900, q: 1, d: 0.2, v: 0.25, a: 0.05 }],
    grenade_bounce: [{ t: 'triangle', f0: 1300, f1: 900, d: 0.08, v: 0.25 }],
    ricochet: [{ t: 'sine', f0: 3200, f1: 1600, d: 0.25, v: 0.12 }],
    impact_metal: [{ t: 'triangle', f0: 700, f1: 500, d: 0.3, v: 0.35 }, { n: 1, f: 2400, q: 2, d: 0.08, v: 0.3 }],
    impact_wood: [{ n: 1, f: 500, q: 1.5, d: 0.14, v: 0.45 }, { t: 'sine', f0: 160, f1: 100, d: 0.1, v: 0.3 }],
    impact_concrete: [{ n: 1, f: 700, q: 1, d: 0.12, v: 0.4 }],
    impact_plastic: [{ n: 1, f: 900, q: 2, d: 0.1, v: 0.35 }, { t: 'sine', f0: 300, f1: 200, d: 0.08, v: 0.2 }],
    impact_glass: [{ t: 'sine', f0: 3000, f1: 2800, d: 0.15, v: 0.2 }],
    impact_flesh: [{ n: 1, f: 300, q: 1, d: 0.12, v: 0.4 }],
    impact_rubber: [{ t: 'sine', f0: 200, f1: 120, d: 0.1, v: 0.35 }],
    impact_cloth: [{ n: 1, f: 300, q: 0.8, d: 0.1, v: 0.3 }],
    impact_energy: [{ t: 'sawtooth', f0: 800, f1: 1600, d: 0.1, v: 0.2 }],
    break_wood: [{ n: 1, f: 600, q: 1, d: 0.35, v: 0.7 }, { n: 1, f: 1600, q: 2, d: 0.15, v: 0.4, delay: 0.05 }],
    break_glass: [{ n: 1, f: 5000, q: 1, d: 0.5, v: 0.5 }, { t: 'sine', f0: 3400, f1: 2600, d: 0.3, v: 0.15 }],
    break_melon: [{ n: 1, f: 400, q: 1, d: 0.25, v: 0.6 }],
    gg_dry: [{ t: 'sawtooth', f0: 300, f1: 160, d: 0.15, v: 0.2 }],
    gg_punt: [{ n: 1, f: 1600, q: 1, d: 0.2, v: 0.6 }, { t: 'sawtooth', f0: 500, f1: 90, d: 0.2, v: 0.35 }],
    gg_deny: [{ t: 'square', f0: 220, f1: 200, d: 0.2, v: 0.15 }],
    gg_pickup: [{ t: 'sawtooth', f0: 120, f1: 400, d: 0.25, v: 0.25 }],
    gg_launch: [{ n: 1, f: 1400, q: 1, d: 0.3, v: 0.7 }, { t: 'sawtooth', f0: 700, f1: 80, d: 0.3, v: 0.4 }],
    gg_drop: [{ t: 'sawtooth', f0: 400, f1: 120, d: 0.2, v: 0.2 }],
    pickup: [{ t: 'square', f0: 1200, f1: 1200, d: 0.05, v: 0.12 }, { t: 'square', f0: 1600, f1: 1600, d: 0.05, v: 0.12, delay: 0.06 }],
    pickup_health: [{ t: 'sine', f0: 600, f1: 900, d: 0.25, v: 0.25 }],
    pickup_battery: [{ t: 'sine', f0: 400, f1: 1400, d: 0.35, v: 0.22 }],
    pickup_prop: [{ n: 1, f: 800, q: 2, d: 0.06, v: 0.15 }],
    drop_prop: [{ n: 1, f: 500, q: 2, d: 0.06, v: 0.15 }],
    suit: [{ t: 'sine', f0: 440, f1: 440, d: 0.15, v: 0.2 }, { t: 'sine', f0: 660, f1: 660, d: 0.15, v: 0.2, delay: 0.15 }, { t: 'sine', f0: 880, f1: 880, d: 0.3, v: 0.2, delay: 0.3 }],
    hev_beep: [{ t: 'sine', f0: 1000, f1: 1000, d: 0.08, v: 0.18 }, { t: 'sine', f0: 800, f1: 800, d: 0.1, v: 0.18, delay: 0.1 }],
    cache: [{ t: 'triangle', f0: 523, f1: 523, d: 0.15, v: 0.2 }, { t: 'triangle', f0: 659, f1: 659, d: 0.15, v: 0.2, delay: 0.12 }, { t: 'triangle', f0: 784, f1: 784, d: 0.3, v: 0.2, delay: 0.24 }],
    use_deny: [{ t: 'square', f0: 180, f1: 170, d: 0.18, v: 0.12 }],
    button: [{ t: 'square', f0: 1100, f1: 1100, d: 0.05, v: 0.15 }, { n: 1, f: 2000, q: 3, d: 0.05, v: 0.15 }],
    door: [{ n: 1, f: 300, q: 1, d: 0.9, v: 0.35, a: 0.1 }, { t: 'sawtooth', f0: 70, f1: 60, d: 0.8, v: 0.08 }],
    door_locked: [{ n: 1, f: 600, q: 3, d: 0.15, v: 0.3 }, { n: 1, f: 600, q: 3, d: 0.15, v: 0.3, delay: 0.18 }],
    field: [{ t: 'sawtooth', f0: 90, f1: 40, d: 0.6, v: 0.2 }, { n: 1, f: 2500, q: 5, d: 0.5, v: 0.15 }],
    flashlight: [{ t: 'square', f0: 2000, f1: 2000, d: 0.02, v: 0.1 }],
    jump: [{ n: 1, f: 400, q: 1, d: 0.06, v: 0.08 }],
    land: [{ n: 1, f: 250, q: 1, d: 0.1, v: 0.3 }],
    step_concrete: [{ n: 1, f: 900, q: 1.5, d: 0.05, v: 0.14 }],
    step_tile: [{ n: 1, f: 1500, q: 2, d: 0.05, v: 0.14 }],
    step_metal: [{ t: 'triangle', f0: 500, f1: 400, d: 0.08, v: 0.08 }, { n: 1, f: 1800, q: 2, d: 0.05, v: 0.1 }],
    step_wood: [{ n: 1, f: 450, q: 2, d: 0.07, v: 0.16 }],
    step_dirt: [{ n: 1, f: 600, q: 0.7, d: 0.07, v: 0.12 }],
    step_sand: [{ n: 1, f: 1200, q: 0.5, d: 0.1, v: 0.1 }],
    step_water: [{ n: 1, f: 800, q: 0.6, d: 0.18, v: 0.18 }],
    pain: [{ n: 1, f: 700, q: 1, d: 0.1, v: 0.25 }],
    pain_big: [{ n: 1, f: 400, q: 0.8, d: 0.2, v: 0.4 }],
    pain_npc: [{ t: 'sawtooth', f0: 300, f1: 200, d: 0.15, v: 0.15 }],
    flatline: [{ t: 'sine', f0: 1000, f1: 1000, d: 1.8, v: 0.2 }],
    radio: [{ n: 1, f: 2500, q: 2, d: 0.15, v: 0.2 }, { t: 'square', f0: 1300, f1: 1300, d: 0.05, v: 0.08, delay: 0.16 }],
    radio_die: [{ t: 'square', f0: 900, f1: 900, d: 0.9, v: 0.1 }],
    zombie_alert: [{ t: 'sawtooth', f0: 110, f1: 80, d: 0.9, v: 0.3, a: 0.1 }, { n: 1, f: 300, q: 2, d: 0.8, v: 0.15 }],
    zombie_moan: [{ t: 'sawtooth', f0: 90, f1: 70, d: 1.2, v: 0.22, a: 0.2 }],
    zombie_hit: [{ n: 1, f: 350, q: 1, d: 0.15, v: 0.5 }],
    zombie_throw: [{ t: 'sawtooth', f0: 140, f1: 90, d: 0.4, v: 0.3 }],
    zombie_die: [{ t: 'sawtooth', f0: 100, f1: 50, d: 0.8, v: 0.3 }],
    fastzombie_alert: [{ t: 'sawtooth', f0: 400, f1: 900, d: 0.7, v: 0.3 }, { n: 1, f: 2000, q: 2, d: 0.7, v: 0.2 }],
    fastzombie_moan: [{ t: 'sawtooth', f0: 300, f1: 200, d: 0.5, v: 0.15 }],
    fastzombie_leap: [{ t: 'sawtooth', f0: 500, f1: 1100, d: 0.5, v: 0.3 }],
    antlion_alert: [{ n: 1, f: 2400, q: 6, d: 0.3, v: 0.2 }],
    antlion_hit: [{ n: 1, f: 1200, q: 2, d: 0.1, v: 0.3 }],
    antlion_fly: [{ t: 'sawtooth', f0: 160, f1: 170, d: 0.6, v: 0.15 }],
    antlion_die: [{ n: 1, f: 1500, q: 3, d: 0.3, v: 0.3 }],
    crab_alert: [{ t: 'sawtooth', f0: 900, f1: 1500, d: 0.3, v: 0.12 }],
    crab_leap: [{ t: 'sawtooth', f0: 700, f1: 1400, d: 0.35, v: 0.22 }],
    crab_bite: [{ n: 1, f: 1500, q: 3, d: 0.1, v: 0.3 }],
    manhack: [{ t: 'sawtooth', f0: 300, f1: 320, d: 0.8, v: 0.1 }],
    manhack_cut: [{ n: 1, f: 3500, q: 3, d: 0.12, v: 0.3 }],
    manhack_die: [{ n: 1, f: 2000, q: 1, d: 0.3, v: 0.4 }],
    scanner_photo: [{ t: 'sine', f0: 1600, f1: 400, d: 0.3, v: 0.2 }],
    scanner_die: [{ n: 1, f: 1500, q: 1, d: 0.4, v: 0.4 }],
    barnacle_grab: [{ t: 'sawtooth', f0: 80, f1: 60, d: 0.5, v: 0.3 }],
    barnacle_bite: [{ n: 1, f: 400, q: 2, d: 0.2, v: 0.4 }],
    turret_tip: [{ t: 'square', f0: 1200, f1: 400, d: 0.6, v: 0.2 }],
    turret_die: [{ t: 'square', f0: 800, f1: 100, d: 0.8, v: 0.2 }],
    roller_shock: [{ n: 1, f: 4000, q: 4, d: 0.25, v: 0.35 }, { t: 'square', f0: 60, f1: 60, d: 0.2, v: 0.2 }],
    roller_die: [{ n: 1, f: 3000, q: 1, d: 0.4, v: 0.4 }],
    guard_roar: [{ t: 'sawtooth', f0: 70, f1: 40, d: 1.3, v: 0.5, a: 0.1 }, { n: 1, f: 300, q: 1, d: 1.2, v: 0.3 }],
    guard_impact: [{ n: 1, f: 200, q: 0.7, d: 0.5, v: 0.8 }, { t: 'sine', f0: 60, f1: 30, d: 0.4, v: 0.5 }],
    guard_die: [{ t: 'sawtooth', f0: 90, f1: 20, d: 2, v: 0.5 }],
    chopper_warn: [{ t: 'square', f0: 1500, f1: 1500, d: 0.3, v: 0.12 }],
    bomb_drop: [{ t: 'sine', f0: 1200, f1: 300, d: 0.8, v: 0.15 }],
    strider_charge: [{ t: 'sawtooth', f0: 200, f1: 1600, d: 1.7, v: 0.3 }],
    strider_cannon: [{ n: 1, f: 2000, q: 0.5, d: 1, v: 0.9 }, { t: 'sine', f0: 60, f1: 20, d: 1, v: 0.7 }],
    strider_die: [{ t: 'sawtooth', f0: 300, f1: 30, d: 2.5, v: 0.5 }],
    dropship_drop: [{ n: 1, f: 200, q: 1, d: 0.5, v: 0.5 }],
    vort_zap: [{ n: 1, f: 3000, q: 1, d: 0.35, v: 0.5 }, { t: 'sawtooth', f0: 100, f1: 90, d: 0.3, v: 0.3 }],
    dog_happy: [{ t: 'square', f0: 600, f1: 900, d: 0.12, v: 0.12 }, { t: 'square', f0: 900, f1: 1200, d: 0.12, v: 0.12, delay: 0.14 }],
    vehicle_in: [{ n: 1, f: 500, q: 1, d: 0.2, v: 0.3 }],
    vehicle_out: [{ n: 1, f: 500, q: 1, d: 0.2, v: 0.3 }],
    vehicle_crash: [{ n: 1, f: 300, q: 0.6, d: 0.4, v: 0.8 }, { t: 'triangle', f0: 400, f1: 200, d: 0.3, v: 0.3 }],
    vehicle_land: [{ n: 1, f: 200, q: 0.6, d: 0.3, v: 0.6 }],
    vehicle_hit: [{ n: 1, f: 350, q: 1, d: 0.2, v: 0.6 }],
    bolt_hit: [{ t: 'triangle', f0: 2000, f1: 1500, d: 0.2, v: 0.2 }],
    ball_bounce: [{ t: 'sawtooth', f0: 600, f1: 1200, d: 0.15, v: 0.25 }],
    ball_explode: [{ n: 1, f: 3000, q: 1, d: 0.6, v: 0.6 }, { t: 'sawtooth', f0: 1200, f1: 100, d: 0.5, v: 0.3 }],
    bugbait_splat: [{ n: 1, f: 700, q: 1, d: 0.2, v: 0.4 }],
    bugbait_squeeze: [{ n: 1, f: 500, q: 2, d: 0.3, v: 0.3 }],
    charger_start: [{ t: 'sine', f0: 300, f1: 600, d: 0.2, v: 0.15 }],
    charger_stop: [{ t: 'sine', f0: 600, f1: 300, d: 0.2, v: 0.15 }],
    squad: [{ t: 'square', f0: 800, f1: 800, d: 0.06, v: 0.1 }],
    teleport: [{ t: 'sawtooth', f0: 100, f1: 2400, d: 2, v: 0.3 }, { n: 1, f: 3000, q: 1, d: 2, v: 0.25 }],
    alarm: [{ t: 'square', f0: 900, f1: 600, d: 0.5, v: 0.2 }, { t: 'square', f0: 900, f1: 600, d: 0.5, v: 0.2, delay: 0.55 }],
    siren: [{ t: 'sawtooth', f0: 400, f1: 900, d: 1.5, v: 0.15 }, { t: 'sawtooth', f0: 900, f1: 400, d: 1.5, v: 0.15, delay: 1.5 }],
    thunder: [{ n: 1, f: 200, q: 0.5, d: 2.5, v: 0.8, a: 0.1 }],
    train: [{ n: 1, f: 250, q: 0.6, d: 3, v: 0.4, a: 0.5 }, { t: 'sawtooth', f0: 55, f1: 50, d: 3, v: 0.1, a: 0.5 }],
    crash: [{ n: 1, f: 500, q: 0.6, d: 1.2, v: 1 }, { t: 'triangle', f0: 300, f1: 100, d: 0.8, v: 0.4 }],
    gman: [{ t: 'sine', f0: 60, f1: 55, d: 3, v: 0.2, a: 0.8 }],
    breencast: [{ t: 'square', f0: 60, f1: 60, d: 0.2, v: 0.05 }]
  };

  const MUSIC = {
    city: { bpm: 70, root: 45, scale: [0, 3, 7, 10, 12], pad: true, drums: false, bass: true },
    action: { bpm: 138, root: 40, scale: [0, 3, 5, 7, 10], pad: false, drums: true, bass: true, lead: true },
    tension: { bpm: 90, root: 38, scale: [0, 1, 5, 6, 10], pad: true, drums: false, bass: true },
    ravenholm: { bpm: 60, root: 36, scale: [0, 1, 6, 7], pad: true, drums: false, bass: false, bell: true },
    coast: { bpm: 100, root: 43, scale: [0, 2, 7, 9, 12], pad: true, drums: true, bass: true },
    finale: { bpm: 150, root: 38, scale: [0, 3, 7, 8, 10], pad: true, drums: true, bass: true, lead: true },
    lab: { bpm: 80, root: 48, scale: [0, 4, 7, 11], pad: true, drums: false, bass: false, bell: true }
  };

  class Audio98 {
    constructor() {
      this.ctx = null;
      this.vol = 0.8;
      this.musicVol = 0.5;
      this.listener = { pos: { x: 0, y: 0, z: 0 }, yaw: 0 };
      this.loops = {};
      this.music = null;
      this.noiseBuf = null;
      this.lastPlay = {};
    }
    init() {
      if (this.ctx) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.35;
      this.musicGain.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVolume(v, m) {
      this.vol = v; this.musicVol = m;
      if (this.master) this.master.gain.value = v;
      if (this.musicGain) this.musicGain.gain.value = m * 0.35;
    }
    spatial(pos) {
      if (!pos) return { g: 1, pan: 0 };
      const L = this.listener;
      const dx = pos.x - L.pos.x, dy = pos.y - L.pos.y, dz = pos.z - L.pos.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const g = 1 / (1 + d * 0.09);
      const r = H.rightOf(L.yaw);
      const pan = d > 0.5 ? H.clamp((dx * r.x + dz * r.z) / d, -1, 1) * 0.8 : 0;
      return { g: d > 70 ? 0 : g, pan };
    }
    play(name, pos, vol = 1) {
      if (!this.ctx) return;
      const rec = R[name];
      if (!rec) return;
      const now = this.ctx.currentTime;
      if (this.lastPlay[name] && now - this.lastPlay[name] < 0.025) return;
      this.lastPlay[name] = now;
      const sp = this.spatial(pos);
      const g0 = vol * sp.g;
      if (g0 < 0.01) return;
      const out = this.ctx.createGain();
      out.gain.value = g0;
      if (this.ctx.createStereoPanner) {
        const p = this.ctx.createStereoPanner();
        p.pan.value = sp.pan;
        out.connect(p);
        p.connect(this.master);
      } else out.connect(this.master);
      for (const l of rec) this.layer(l, out, now + (l.delay || 0));
    }
    layer(l, out, t0) {
      const c = this.ctx;
      const g = c.createGain();
      const a = l.a || 0.004;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(l.v, t0 + a);
      g.gain.exponentialRampToValueAtTime(0.0005, t0 + a + l.d);
      g.connect(out);
      if (l.n) {
        const s = c.createBufferSource();
        s.buffer = this.noiseBuf;
        s.playbackRate.value = 0.7 + Math.random() * 0.6;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = l.f * (0.9 + Math.random() * 0.2);
        f.Q.value = l.q || 1;
        s.connect(f);
        f.connect(g);
        s.start(t0, Math.random() * 1.5);
        s.stop(t0 + a + l.d + 0.05);
      } else {
        const o = c.createOscillator();
        o.type = l.t;
        o.frequency.setValueAtTime(l.f0, t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, l.f1), t0 + a + l.d);
        o.connect(g);
        o.start(t0);
        o.stop(t0 + a + l.d + 0.05);
      }
    }
    loop(name, vol, pitch = 1, pos = null) {
      if (!this.ctx) return;
      let L = this.loops[name];
      const sp = this.spatial(pos);
      const target = vol * sp.g;
      if (!L) {
        if (target < 0.005) return;
        const c = this.ctx;
        const g = c.createGain();
        g.gain.value = 0;
        g.connect(this.master);
        const nodes = [];
        const add = (type, f, v) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; const og = c.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(); nodes.push({ o, base: f }); };
        const addNoise = (f, q, v) => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const og = c.createGain(); og.gain.value = v; s.connect(fl); fl.connect(og); og.connect(g); s.start(); nodes.push({ o: s, noise: true, filter: fl, base: f }); };
        if (name === 'airboat') { add('sawtooth', 55, 0.25); add('square', 110, 0.08); addNoise(400, 0.8, 0.5); }
        else if (name === 'buggy') { add('sawtooth', 45, 0.3); add('square', 90, 0.1); addNoise(300, 1, 0.3); }
        else if (name === 'chopper') { add('square', 18, 0.5); addNoise(150, 0.7, 0.6); }
        else if (name === 'gghum') { add('sawtooth', 120, 0.25); add('sine', 240, 0.15); }
        else if (name === 'charger') { add('sine', 500, 0.3); }
        else if (name === 'wind') { addNoise(500, 0.4, 0.4); }
        else if (name === 'fire') { addNoise(900, 0.5, 0.4); }
        else if (name === 'strider') { add('sawtooth', 35, 0.3); addNoise(120, 1, 0.3); }
        else if (name === 'reactor') { add('sawtooth', 50, 0.3); add('sine', 100, 0.3); addNoise(800, 3, 0.2); }
        else { add('sine', 100, 0.2); }
        L = this.loops[name] = { g, nodes };
      }
      L.g.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
      for (const n of L.nodes) {
        if (n.noise) n.filter.frequency.setTargetAtTime(n.base * pitch, this.ctx.currentTime, 0.1);
        else n.o.frequency.setTargetAtTime(n.base * pitch, this.ctx.currentTime, 0.1);
      }
    }
    stopLoops() {
      for (const k of Object.keys(this.loops)) {
        const L = this.loops[k];
        L.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        for (const n of L.nodes) { try { n.o.stop(this.ctx.currentTime + 0.3); } catch (e) { } }
      }
      this.loops = {};
    }
    playMusic(name) {
      if (!this.ctx) return;
      if (this.music && this.music.name === name) return;
      this.stopMusic();
      const spec = MUSIC[name];
      if (!spec) return;
      this.music = { name, spec, step: 0, next: this.ctx.currentTime + 0.1, bars: 0 };
    }
    stopMusic() { this.music = null; }
    tick() {
      if (!this.ctx || !this.music) return;
      const m = this.music, s = m.spec, c = this.ctx;
      const stepDur = 60 / s.bpm / 2;
      while (m.next < c.currentTime + 0.25) {
        const t = m.next, st = m.step;
        const note = k => 440 * Math.pow(2, (s.root + k - 69) / 12);
        const blip = (type, f, d, v, dest = this.musicGain) => {
          const o = c.createOscillator(); o.type = type; o.frequency.value = f;
          const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + d);
          o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.05);
        };
        const hit = (f, q, d, v) => {
          const src = c.createBufferSource(); src.buffer = this.noiseBuf;
          const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
          const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d);
          src.connect(fl); fl.connect(g); g.connect(this.musicGain); src.start(t, Math.random()); src.stop(t + d + 0.05);
        };
        const bar = Math.floor(st / 16);
        const chord = s.scale[(bar * 3) % s.scale.length];
        if (s.pad && st % 16 === 0) { blip('triangle', note(chord), stepDur * 16, 0.12); blip('sine', note(chord + 7), stepDur * 16, 0.08); blip('sine', note(chord + 12 + s.scale[1]), stepDur * 16, 0.05); }
        if (s.bass && st % 4 === 0) blip('sawtooth', note(chord - 12), stepDur * 3, 0.14);
        if (s.drums) {
          if (st % 4 === 0) { blip('sine', 90, 0.18, 0.5); }
          if (st % 8 === 4) hit(1800, 0.8, 0.12, 0.35);
          if (st % 2 === 1) hit(7000, 1.5, 0.04, 0.12);
        }
        if (s.lead && st % 3 === 0 && (bar % 4) > 1) blip('square', note(12 + s.scale[(st * 7 + bar) % s.scale.length]), stepDur * 1.5, 0.05);
        if (s.bell && st % 12 === 0) blip('sine', note(24 + s.scale[(st / 12 + bar) % s.scale.length | 0]), stepDur * 8, 0.07);
        m.step++;
        m.next += stepDur;
      }
    }
    destroy() {
      this.stopLoops();
      this.stopMusic();
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
    }
  }

  H.Audio98 = Audio98;
  H.SOUNDS = R;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
