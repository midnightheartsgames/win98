class EmuAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.currentSong = null;
    this.stepIndex = 0;
    this.timer = null;
  }

  ensureContext() {
    if (this.muted) return null;
    if (typeof window !== 'undefined' && window.soundSys && window.soundSys.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        try {
          this.ctx = new Ctx();
        } catch (e) {
          this.ctx = null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      try { this.ctx.resume(); } catch (e) {}
    }
    return this.ctx;
  }

  tone(freq, duration = 0.08, type = 'square', gainVal = 0.05, slideTo = null) {
    const ctx = this.ensureContext();
    if (!ctx || !freq || freq <= 0) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo && slideTo > 0) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (e) {}
  }

  delayTone(ms, freq, duration, type, gainVal, slideTo = null) {
    const t = setTimeout(() => this.tone(freq, duration, type, gainVal, slideTo), ms);
    if (t && typeof t.unref === 'function') t.unref();
  }

  sfx(kind) {
    switch (kind) {
      case 'jump':
        this.tone(210, 0.14, 'square', 0.05, 620);
        break;
      case 'shoot':
        this.tone(760, 0.06, 'square', 0.04, 170);
        break;
      case 'coin':
      case 'ring':
        this.tone(987.77, 0.07, 'square', 0.05);
        this.delayTone(65, 1318.5, 0.16, 'square', 0.05);
        break;
      case 'bumper':
        this.tone(523.25, 0.05, 'triangle', 0.06, 1046.5);
        this.delayTone(45, 783.99, 0.08, 'square', 0.04);
        break;
      case 'spindash':
        [260, 340, 440, 580].forEach((n, i) => {
          this.delayTone(i * 28, n, 0.05, 'sawtooth', 0.045, n * 1.25);
        });
        break;
      case 'tongue':
        this.tone(320, 0.09, 'triangle', 0.06, 740);
        this.delayTone(60, 580, 0.07, 'square', 0.04, 280);
        break;
      case 'harpoon':
        this.tone(880, 0.05, 'sawtooth', 0.06, 220);
        this.delayTone(45, 540, 0.11, 'square', 0.05, 1200);
        break;
      case 'uppercut':
        this.tone(180, 0.08, 'sawtooth', 0.07, 640);
        this.delayTone(50, 95, 0.18, 'sawtooth', 0.08, 38);
        break;
      case 'brickBreak':
        this.tone(140, 0.07, 'sawtooth', 0.06, 52);
        this.delayTone(40, 110, 0.08, 'square', 0.05, 42);
        break;
      case 'powerup':
      case 'stageClear':
        [330, 392, 659, 523, 587, 784].forEach((n, i) => {
          this.delayTone(i * 48, n, 0.07, 'square', 0.045);
        });
        break;
      case 'hit':
        this.tone(160, 0.09, 'sawtooth', 0.06, 55);
        break;
      case 'explosion':
        this.tone(115, 0.22, 'sawtooth', 0.07, 30);
        this.delayTone(55, 80, 0.18, 'square', 0.05, 25);
        break;
      case 'lineClear':
        [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
          this.delayTone(i * 52, n, 0.08, 'square', 0.05);
        });
        break;
      case 'cheat':
        [440, 554.37, 659.25, 880, 1108.73].forEach((n, i) => {
          this.delayTone(i * 52, n, 0.08, 'triangle', 0.06);
        });
        break;
      case 'fatality':
        [196, 185, 174.61, 146.83, 110].forEach((n, i) => {
          this.delayTone(i * 105, n, 0.16, 'sawtooth', 0.07);
        });
        break;
    }
  }

  getSongData(romId) {
    const songs = {
      battlecity: {
        tempo: 145,
        wave: 'square',
        bassWave: 'triangle',
        notes: [
          262, 294, 330, 262, 294, 330, 349, 392, 0, 330, 349, 392, 440, 392, 349, 330,
          294, 330, 349, 294, 330, 349, 392, 440, 0, 392, 440, 494, 523, 0, 392, 523
        ],
        bass: [
          131, 0, 131, 0, 147, 0, 165, 0, 175, 0, 131, 0, 147, 0, 196, 0,
          147, 0, 147, 0, 165, 0, 196, 0, 220, 0, 196, 0, 131, 196, 131, 0
        ]
      },
      smb: {
        tempo: 130,
        wave: 'square',
        bassWave: 'triangle',
        notes: [
          659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
          523, 0, 0, 392, 0, 0, 330, 0, 0, 440, 0, 494, 0, 466, 440, 0,
          392, 659, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0, 0
        ],
        bass: [
          147, 147, 0, 147, 0, 147, 147, 0, 196, 0, 0, 0, 98, 0, 0, 0,
          131, 0, 0, 98, 0, 0, 82, 0, 0, 110, 0, 123, 0, 117, 110, 0,
          98, 165, 196, 220, 0, 175, 196, 0, 165, 0, 131, 147, 123, 0, 0, 0
        ]
      },
      contra: {
        tempo: 125,
        wave: 'square',
        bassWave: 'sawtooth',
        notes: [
          220, 220, 262, 294, 330, 0, 294, 262, 247, 196, 0, 247, 262, 220, 0, 196,
          220, 220, 262, 294, 349, 330, 294, 262, 294, 330, 392, 349, 330, 294, 220, 0
        ],
        bass: [
          110, 110, 110, 0, 110, 110, 131, 147, 98, 98, 98, 0, 110, 110, 82, 98,
          110, 110, 110, 0, 147, 147, 131, 110, 147, 165, 196, 175, 165, 147, 110, 0
        ]
      },
      chipdale: {
        tempo: 135,
        wave: 'square',
        bassWave: 'triangle',
        notes: [
          392, 440, 494, 523, 587, 523, 494, 440, 392, 0, 494, 587, 659, 587, 523, 392,
          440, 523, 587, 659, 698, 659, 587, 523, 587, 0, 494, 440, 392, 494, 523, 0
        ],
        bass: [
          131, 0, 196, 0, 147, 0, 196, 0, 131, 0, 165, 0, 196, 0, 131, 0,
          175, 0, 220, 0, 147, 0, 196, 0, 165, 0, 147, 0, 131, 196, 131, 0
        ]
      },
      sonic2: {
        tempo: 118,
        wave: 'sawtooth',
        bassWave: 'square',
        notes: [
          330, 392, 440, 494, 523, 494, 440, 392, 349, 440, 523, 587, 659, 587, 523, 440,
          392, 494, 587, 659, 784, 659, 587, 494, 523, 0, 659, 587, 523, 392, 523, 0
        ],
        bass: [
          131, 131, 196, 131, 147, 147, 220, 147, 175, 175, 262, 175, 196, 196, 147, 196,
          165, 165, 247, 165, 196, 196, 147, 196, 131, 196, 262, 196, 131, 98, 131, 0
        ]
      },
      umk3: {
        tempo: 120,
        wave: 'sawtooth',
        bassWave: 'sawtooth',
        notes: [
          220, 220, 262, 220, 294, 220, 330, 294, 262, 262, 330, 262, 392, 262, 330, 294,
          196, 196, 247, 196, 294, 196, 330, 294, 220, 220, 262, 294, 330, 294, 262, 247
        ],
        bass: [
          110, 110, 110, 110, 110, 110, 131, 147, 131, 131, 131, 131, 131, 131, 165, 147,
          98, 98, 98, 98, 98, 98, 123, 147, 110, 110, 131, 147, 165, 147, 131, 123
        ]
      },
      comixzone: {
        tempo: 140,
        wave: 'sawtooth',
        bassWave: 'square',
        notes: [
          165, 165, 196, 220, 0, 165, 247, 220, 196, 165, 147, 165, 196, 220, 196, 147,
          165, 165, 220, 247, 262, 247, 220, 196, 147, 147, 196, 185, 165, 0, 123, 147
        ],
        bass: [
          82, 82, 98, 110, 0, 82, 123, 110, 98, 82, 73, 82, 98, 110, 98, 73,
          82, 82, 110, 123, 131, 123, 110, 98, 73, 73, 98, 92, 82, 0, 62, 73
        ]
      },
      smw: {
        tempo: 132,
        wave: 'triangle',
        bassWave: 'square',
        notes: [
          523, 392, 330, 440, 494, 440, 392, 0, 523, 587, 659, 523, 587, 523, 440, 392,
          349, 440, 523, 698, 659, 587, 523, 0, 392, 494, 587, 659, 523, 0, 392, 523
        ],
        bass: [
          131, 196, 262, 196, 147, 220, 196, 0, 131, 196, 262, 196, 175, 220, 196, 147,
          175, 220, 262, 220, 131, 196, 262, 0, 147, 196, 247, 196, 131, 196, 131, 0
        ]
      },
      tetris: {
        tempo: 138,
        wave: 'square',
        bassWave: 'triangle',
        notes: [
          659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 494, 523, 587,
          659, 523, 440, 440, 0, 587, 698, 880, 784, 698, 659, 0, 523, 659, 587, 523,
          494, 494, 523, 587, 659, 523, 440, 440
        ],
        bass: [
          165, 330, 165, 330, 165, 330, 110, 220, 110, 220, 110, 220, 123, 247, 165, 330,
          110, 220, 110, 220, 0, 147, 294, 147, 294, 147, 131, 262, 131, 262, 131, 262,
          123, 247, 165, 330, 110, 220, 110, 0
        ]
      }
    };
    return songs[romId] || songs.battlecity;
  }

  startMusic(romId) {
    this.stopMusic();
    this.currentSong = romId;
    this.stepIndex = 0;
    if (!this.musicEnabled || this.muted) return;
    const song = this.getSongData(romId);
    this.timer = setInterval(() => {
      if (this.muted || !this.musicEnabled) return;
      const idx = this.stepIndex % song.notes.length;
      const n = song.notes[idx];
      const b = song.bass ? song.bass[idx % song.bass.length] : 0;
      this.stepIndex++;
      const dur = (song.tempo / 1000) * 0.78;
      if (n > 0) {
        this.tone(n, dur, song.wave, 0.024);
      }
      if (b > 0) {
        this.tone(b, dur * 0.9, song.bassWave || 'triangle', 0.016);
      }
    }, song.tempo);
    if (this.timer && typeof this.timer.unref === 'function') this.timer.unref();
  }

  stopMusic() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.emuAudio = new EmuAudioEngine();
}
