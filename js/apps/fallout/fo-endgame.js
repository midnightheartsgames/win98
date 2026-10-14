(function (FO) {
  'use strict';

  const NARRATOR = 'NARRATOR';
  const PAL_DIR = 'ART\\INTRFACE\\';
  const SCREEN_W = 640;
  const SCREEN_H = 480;
  const PAN = { ART: 327, NAME: 'DP', MS_PER_PIXEL: 16 };
  const DEATH = { ART: 309, NAME: 'DEATH', NARRATION: ['NAR_3', 'NAR_4', 'NAR_5', 'NAR_6'] };
  const SLIDE_NAMES = {
    311: 'SEQ2AD', 312: 'SEQ2B', 313: 'SEQ3A', 314: 'SEQ3C', 315: 'SEQ5A', 316: 'SEQ5B', 317: 'SEQ5D', 318: 'SEQ6A',
    319: 'SEQ6B', 320: 'SEQ8ABC', 323: 'SEQ4ABC', 324: 'SEQ4DE', 325: 'SEQ7A', 326: 'SEQ7C'
  };
  const SUB = { WIDTH: 540, FONT: 101, MAX_LINES: 50, CHAR_SEC: 0.08 };
  const WAIT = { HOLD: 500, PLAIN: 3000, GAP: 3000 };
  const GV_ENDGAME = 299;
  const MUSIC = { FIRST: 'MAYBE', AFTER: '10LABONE' };
  const WALK_MOVIES = [8, 9];

  FO.endgameSteps = function (gv) {
    const v = i => gv[i] | 0;
    const s = [{ pan: 1, nar: v(51) ? 'NAR_11' : 'NAR_10' }];
    if (v(13)) s.push({ art: 311, nar: 'NAR_15' });
    else if (v(30)) s.push(v(31) === 2 ? { art: 312, nar: 'NAR_13' } : { art: 311, nar: 'NAR_12' });
    if (v(7)) s.push({ art: 314, nar: 'NAR_18' });
    else if (v(132)) s.push({ art: 313, nar: 'NAR_16' });
    if (v(12)) s.push({ art: 324, nar: 'NAR_23' });
    else {
      const even = v(26) === 2 || v(26) === 0;
      if (v(604)) s.push(even ? { art: 323, nar: 'NAR_21' } : { art: 324, nar: 'NAR_22' });
      else s.push({ art: 323, nar: even ? 'NAR_19' : 'NAR_20' });
    }
    if (v(15)) s.push({ art: 317, nar: 'NAR_27' });
    else if (v(104) === 2 && !v(37)) s.push({ art: 315, nar: 'NAR_24' });
    else if (!v(38)) s.push({ art: 316, nar: 'NAR_25' });
    s.push(v(108) === 2 && v(250) ? { art: 319, nar: 'NAR_29' } : { art: 318, nar: 'NAR_28' });
    if (v(14)) s.push({ art: 326, nar: 'NAR_34' });
    else if (v(606) === 1) s.push({ art: 325, nar: 'NAR_32' });
    if (v(69) < 2) s.push({ art: 320, nar: 'NAR_37' });
    else if (v(114) && v(115) < 8) s.push({ art: 320, nar: 'NAR_35' });
    else s.push({ art: 320, nar: v(115) >= 4 ? 'NAR_36' : 'NAR_35' });
    s.push({ pan: -1, nar: 'NAR_40' });
    return s;
  };

  FO.subtitleTimes = function (lines, seconds) {
    const total = lines.reduce((n, l) => n + l.length, 0);
    const perChar = seconds > 0 && total ? seconds / total : SUB.CHAR_SEC;
    const out = [];
    let end = 0;
    for (const l of lines) {
      end = Math.trunc(end + l.length * perChar * 1000);
      out.push(end);
    }
    return out;
  };

  FO.readNarration = function (text) {
    const out = [];
    for (const raw of String(text).split('\n')) {
      const line = raw.replace(/\r$/, '');
      const at = line.indexOf(':');
      if (at < 0 || out.length >= SUB.MAX_LINES) continue;
      out.push(line.slice(at + 1));
    }
    return out;
  };

  const sleep = (screen, ms) => new Promise(resolve => screen.waits.push({ left: ms, resolve, skippable: false }));

  class NarratedScreen {
    constructor(g) {
      this.g = g;
      this.lut = new Uint32Array(256).fill(0xFF000000);
      this.pal = null;
      this.level = 0;
      this.fadeJob = null;
      this.waits = [];
      this.key = false;
      this.voice = null;
      this.subs = null;
      this.pauses = true;
      this.overBar = true;
      this.noCursor = true;
      this.finished = false;
      this.host = null;
    }

    view(w, h) {
      return FO.scaleRect(w, h, SCREEN_W, SCREEN_H, FO.screenPref(this.g.prefs, 'scaling'));
    }

    async loadPalette(name) {
      const path = PAL_DIR + name + '.PAL';
      this.pal = this.g.data.has(path) ? FO.readPal(await this.g.data.get(path)).rgb : null;
    }

    setLevel(k) {
      this.level = k;
      const pal = this.pal;
      const colors = this.g.colors;
      const curve = c => (colors && colors.gamma !== 1 ? Math.min(63, Math.round(Math.pow(c, colors.gamma))) : c);
      for (let i = 0; i < 256; i++) {
        if (!pal) {
          this.lut[i] = 0xFF000000;
          continue;
        }
        const r = curve(Math.trunc((pal[i * 3] >> 2) * k)) << 2;
        const gr = curve(Math.trunc((pal[i * 3 + 1] >> 2) * k)) << 2;
        const b = curve(Math.trunc((pal[i * 3 + 2] >> 2) * k)) << 2;
        this.lut[i] = 0xFF000000 | (b << 16) | (gr << 8) | r;
      }
    }

    fadeTo(k) {
      return new Promise(resolve => {
        this.fadeJob = { from: this.level, to: k, t: 0, resolve };
      });
    }

    async narrate(name) {
      const g = this.g;
      this.voice = null;
      this.subs = null;
      const audio = g.audio;
      const speechPath = 'SOUND\\SPEECH\\' + NARRATOR + '\\' + name + '.ACM';
      let seconds = 0;
      this.voiceBuffer = audio && g.data.has(speechPath) ? await audio.loadSpeech(NARRATOR, name) : null;
      if (this.voiceBuffer) seconds = Math.ceil(this.voiceBuffer.duration);
      if (FO.prefValue(g.prefs, 'subtitles')) {
        const path = FO.textPath('CUTS\\' + name + '.TXT');
        if (g.data.has(path)) {
          const lines = FO.readNarration(await g.data.text(path));
          if (lines.length) this.subs = { lines, ends: FO.subtitleTimes(lines, seconds), index: 0, start: 0, done: false };
        }
      }
      return !!this.voiceBuffer || !!this.subs;
    }

    startNarration() {
      const audio = this.g.audio;
      if (this.voiceBuffer && audio) this.voice = audio.playSpeech(this.voiceBuffer);
      if (this.subs) this.subs.start = performance.now();
    }

    stopNarration() {
      const audio = this.g.audio;
      if (this.voice && audio) audio.stopSpeech();
      this.voice = null;
      this.voiceBuffer = null;
      this.subs = null;
    }

    narrationDone() {
      const audio = this.g.audio;
      if (this.voice && audio && audio.speechDone()) return true;
      return !!(this.subs && this.subs.done);
    }

    stepSubtitles() {
      const s = this.subs;
      if (!s || !s.start) return;
      if (s.index >= s.lines.length) {
        s.done = true;
        return;
      }
      if (performance.now() - s.start > s.ends[s.index]) s.index++;
    }

    update(dt) {
      const ms = dt * 1000;
      const j = this.fadeJob;
      if (j) {
        j.t += ms;
        const k = Math.min(1, j.t / FO.FADE_MS);
        this.setLevel(j.from + (j.to - j.from) * k);
        if (k >= 1) {
          this.fadeJob = null;
          j.resolve();
        }
      }
      for (const w of this.waits.slice()) {
        w.left -= ms;
        if (w.left <= 0) {
          this.waits.splice(this.waits.indexOf(w), 1);
          w.resolve();
        }
      }
      this.stepSubtitles();
      if (this.tick) this.tick(ms);
    }

    paint(out, w, h) {
      const s = this.subs;
      const f = this.g.fonts && this.g.fonts[SUB.FONT];
      if (!s || !s.start || s.index >= s.lines.length || !f) return;
      const lines = f.wrap(s.lines[s.index], SUB.WIDTH);
      const lh = f.height + f.lineGap;
      const [ox, oy, ow, oh] = this.view(w, h);
      let y = oy + oh - lines.length * lh;
      for (const l of lines) {
        const tw = f.width(l);
        const x = ox + ((ow - tw) >> 1);
        const mask = new FO.Screen(Math.max(1, tw), lh);
        f.levels(mask, l, 0, 0);
        for (let yy = 0; yy < lh; yy++) {
          const dy = y + yy;
          if (dy < 0 || dy >= h) continue;
          for (let xx = 0; xx < tw; xx++) {
            const dx = x + xx;
            if (dx < 0 || dx >= w) continue;
            const c = Math.round(255 * mask.px[yy * mask.w + xx] / FO.FONT_LEVELS);
            out[dy * w + dx] = 0xFF000000 | (c << 16) | (c << 8) | c;
          }
        }
        y += lh;
      }
    }

    attach() {
      const g = this.g;
      g.lut = this.lut;
      g.paint = (out, w, h) => this.paint(out, w, h);
    }

    detach() {
      const g = this.g;
      if (g.lut === this.lut) g.lut = null;
      g.paint = null;
      this.stopNarration();
    }

    keyDown() {
      this.key = true;
      return true;
    }

    mouseDown() {}

    mouseUp() {
      this.key = true;
    }

    takeKey() {
      const k = this.key;
      this.key = false;
      return k;
    }

    leave() {
      this.detach();
    }
  }

  class EndgameScreen extends NarratedScreen {
    constructor(play, done) {
      super(play.g);
      this.p = play;
      this.done = done || null;
      this.steps = FO.endgameSteps(play.sc.gvars);
      this.frm = null;
      this.panX = 0;
    }

    async enter() {
      const g = this.g;
      if (g.audio) g.audio.stopMusic();
      await FO.fade(g, 0);
      this.attach();
      await g.art.loadAll([PAN.ART, ...this.steps.filter(s => s.art).map(s => s.art)].map(FO.IFACE));
      for (const step of this.steps) {
        if (this.finished) return;
        if (step.pan) await this.pan(step.pan, step.nar);
        else await this.slide(step.art, step.nar);
      }
      this.finish();
    }

    async slide(art, nar) {
      this.frm = FO.frameOfArt(this.g, art);
      this.panX = 0;
      await this.loadPalette(SLIDE_NAMES[art]);
      this.setLevel(0);
      const narrated = await this.narrate(nar);
      const timeout = narrated ? Infinity : WAIT.PLAIN;
      await this.fadeTo(1);
      await sleep(this, WAIT.HOLD);
      this.takeKey();
      this.startNarration();
      const started = performance.now();
      let key = false;
      await new Promise(resolve => {
        this.tick = () => {
          key = this.takeKey();
          if (key || this.narrationDone() || performance.now() - started >= timeout) {
            this.tick = null;
            resolve();
          }
        };
      });
      this.stopNarration();
      if (!key) await sleep(this, WAIT.HOLD);
      await this.fadeTo(0);
    }

    async pan(dir, nar) {
      this.frm = FO.frameOfArt(this.g, PAN.ART);
      await this.loadPalette(PAN.NAME);
      this.setLevel(0);
      const width = this.frm ? this.frm.w : SCREEN_W * 2;
      const range = width - SCREEN_W;
      const fade = Math.trunc(range / 4);
      const narrated = await this.narrate(nar);
      let delay = PAN.MS_PER_PIXEL;
      const speechMs = this.voiceBuffer ? Math.ceil(this.voiceBuffer.duration) * 1000 : 0;
      if (speechMs > range * PAN.MS_PER_PIXEL / 2) delay = Math.trunc((Math.trunc(range / 2) * PAN.MS_PER_PIXEL + speechMs) / range);
      let x = dir === 1 ? 0 : range;
      const end = dir === 1 ? range : 0;
      const cue = dir === 1 ? fade : SCREEN_W - fade;
      let acc = delay;
      this.takeKey();
      await new Promise(resolve => {
        this.tick = ms => {
          if (this.takeKey()) {
            this.tick = null;
            resolve();
            return;
          }
          acc += ms;
          while (acc >= delay && x !== end) {
            acc -= delay;
            this.panX = x;
            if (x <= fade) this.setLevel(x / fade);
            else if (x >= SCREEN_W - fade) this.setLevel((SCREEN_W - x) / fade);
            else if (this.level !== 1) this.setLevel(1);
            x += dir;
            if (x === cue && narrated) this.startNarration();
          }
          if (x === end) {
            this.tick = null;
            resolve();
          }
        };
      });
      this.stopNarration();
      await this.fadeTo(0);
    }

    draw(scr) {
      scr.fill(0);
      const f = this.frm;
      if (!f) return;
      scr.blitScaled(f, [this.panX, 0, Math.min(SCREEN_W, f.w - this.panX), Math.min(f.h, SCREEN_H)], this.view(scr.w, scr.h));
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      this.detach();
      const sc = this.p.sc;
      if (sc) sc.gvars[GV_ENDGAME] = 0;
      if (this.host) this.host.closeModal(this);
      FO.fade(this.g, 1).then(() => {
        if (this.done) this.done();
      });
    }
  }

  class DeathScreen extends NarratedScreen {
    constructor(g) {
      super(g);
      this.frm = null;
    }

    async enter() {
      const g = this.g;
      this.attach();
      await g.art.loadAll([FO.IFACE(DEATH.ART)]);
      this.frm = FO.frameOfArt(g, DEATH.ART);
      await this.loadPalette(DEATH.NAME);
      this.setLevel(0);
      await this.fadeTo(1);
      const nar = DEATH.NARRATION[FO.combatRand(1, DEATH.NARRATION.length) - 1];
      const voiced = await this.narrate(nar);
      this.subs = null;
      this.takeKey();
      this.startNarration();
      const started = performance.now();
      const timeout = voiced ? Infinity : WAIT.PLAIN;
      let key = false;
      await new Promise(resolve => {
        this.tick = () => {
          key = this.takeKey();
          if (key || (this.voice && this.g.audio.speechDone()) || performance.now() - started >= timeout) {
            this.tick = null;
            resolve();
          }
        };
      });
      this.stopNarration();
      if (!key) await sleep(this, WAIT.HOLD);
      await this.fadeTo(0);
      this.finish();
    }

    draw(scr) {
      scr.fill(0);
      if (this.frm) scr.blitScaled(this.frm, [0, 0, this.frm.w, this.frm.h], this.view(scr.w, scr.h));
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      this.detach();
      this.g.colors.setFade(0);
      FO.showMainMenu(this.g);
    }
  }

  FO.EndgameScreen = EndgameScreen;
  FO.DeathScreen = DeathScreen;

  FO.endgameMovie = async function (g) {
    const audio = g.audio;
    if (audio) audio.stopMusic();
    await FO.fade(g, 0);
    if (audio) audio.playMusic(MUSIC.FIRST, false, () => audio.playMusic(MUSIC.AFTER, true));
    await new Promise(resolve => setTimeout(resolve, WAIT.GAP));
    const female = g.play && g.play.w ? FO.statValue(g.play.w.dude, FO.STAT.GENDER) : 0;
    await FO.playMovieMode(g, WALK_MOVIES[female ? 1 : 0], 0);
    g.setMode(new FO.CreditsScreen(g, 'CREDITS.TXT', { keepMusic: true, then: () => {
      if (audio) audio.stopMusic();
      FO.showMainMenu(g);
    } }));
  };
})(globalThis.FO = globalThis.FO || {});
