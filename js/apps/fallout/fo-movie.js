(function (FO) {
  'use strict';

  const CUTS = 'ART\\CUTS\\';
  const FLAG = { FADE_OUT: 1, FADE_IN: 2, STOP_MUSIC: 4, PAUSE_MUSIC: 8 };
  const FORCED_SUBTITLES = [6, 11, 12];
  const SUBTITLE = { FONT: 101, WIDTH: 600 };
  const FADE_MS = 700;
  const MOVIE_W = 640;
  const MOVIE_H = 480;

  FO.MOVIE_FLAGS = FLAG;
  FO.SCRIPT_MOVIE_FLAGS = [11, 11, 11, 9, 9, 11, 9, 9, 11, 11, 9, 11, 11, 9];
  FO.FADE_MS = FADE_MS;

  FO.FADE_TINT = { BLACK: 0, WHITE: 252 };

  FO.fade = function (g, target, tint) {
    if (!g.colors) return Promise.resolve();
    if (tint !== undefined) g.colors.fadeTint = tint;
    else if (target < g.colors.fade) g.colors.fadeTint = FO.FADE_TINT.BLACK;
    return new Promise(resolve => g.colors.fadeTo(target, FADE_MS, resolve));
  };

  FO.dip = g => FO.fade(g, 0).then(() => FO.fade(g, 1));

  class MovieScreen {
    constructor(g, index, flags, done) {
      this.g = g;
      this.index = index;
      this.flags = flags | 0;
      this.done = done || null;
      this.name = FO.EXE.movies[index] || '';
      this.lut = new Uint32Array(256);
      this.lut.fill(0xFF000000);
      this.mve = null;
      this.voice = null;
      this.subs = [];
      this.sub = '';
      this.started = 0;
      this.finished = false;
      this.paletteVersion = -1;
      this.pauses = true;
      this.overBar = true;
      this.noCursor = true;
      this.host = null;
      this.text = null;
      this.mask = null;
    }

    async enter() {
      const g = this.g;
      const path = CUTS + this.name + '.MVE';
      if (!this.name || !g.data.has(path)) {
        this.finish();
        return;
      }
      if (this.flags & FLAG.FADE_OUT) await FO.fade(g, 0);
      if (g.audio) {
        if (this.flags & FLAG.STOP_MUSIC) g.audio.stopMusic();
        else if (this.flags & FLAG.PAUSE_MUSIC) g.audio.pauseMusic();
      }
      g.lut = this.lut;
      g.paint = (out, w, h) => this.paint(out, w, h);
      const u8 = await g.data.get(path);
      if (this.finished) return;
      this.mve = new FO.Mve(u8);
      const pcm = this.mve.decodeAudio(FO.EXE.mveDelta);
      await this.loadSubtitles();
      if (this.finished) return;
      if (g.audio && pcm.length && this.mve.audio.rate) this.voice = g.audio.playPcm(pcm, this.mve.audio.rate, this.mve.audio.channels);
      this.started = performance.now();
      this.mve.next();
    }

    async loadSubtitles() {
      const g = this.g;
      const on = FORCED_SUBTITLES.includes(this.index) || !!FO.prefValue(g.prefs, 'subtitles');
      const path = FO.textPath('CUTS\\' + this.name + '.SVE');
      if (!on || !g.data.has(path)) return;
      this.subs = FO.readSve(await g.data.text(path));
    }

    time() {
      const a = this.g.audio;
      if (this.voice && a && a.ctx && a.ctx.state === 'running') return a.ctx.currentTime - this.voice.at;
      return (performance.now() - this.started) / 1000;
    }

    update() {
      const mve = this.mve;
      if (!mve || this.finished) return;
      const t = this.time();
      const frameSec = mve.frameUs / 1e6;
      while (!mve.ended && mve.frames * frameSec <= t) mve.next();
      for (const s of this.subs) if (s.frame <= mve.frames) this.sub = s.text;
      const audioDone = !this.voice || t >= this.voice.duration;
      if (mve.ended && audioDone && t >= mve.frames * frameSec) this.finish();
    }

    rebuildLut() {
      const pal = this.mve.palette;
      const colors = this.g.colors;
      const curve = c => (colors && colors.gamma !== 1 ? Math.min(63, Math.round(Math.pow(c >> 2, colors.gamma))) << 2 : c);
      for (let i = 0; i < 256; i++) this.lut[i] = 0xFF000000 | (curve(pal[i * 3 + 2]) << 16) | (curve(pal[i * 3 + 1]) << 8) | curve(pal[i * 3]);
      this.paletteVersion = this.mve.paletteVersion;
    }

    draw(scr) {
      scr.fill(0);
      const mve = this.mve;
      if (!mve || !mve.front) return;
      if (mve.paletteVersion !== this.paletteVersion) this.rebuildLut();
      const hires = scr.w > MOVIE_W || scr.h > MOVIE_H;
      const rect = FO.scaleRect(scr.w, scr.h, mve.w, mve.h, hires ? FO.screenPref(this.g.prefs, 'scaling') : FO.SCALE.NONE);
      scr.blitScaled({ w: mve.w, h: mve.h, px: mve.front }, [0, 0, mve.w, mve.h], rect);
      const top = rect[1] + rect[3];
      this.place = { ox: (scr.w - MOVIE_W) >> 1, top, bottom: Math.max(top, (scr.h + MOVIE_H) >> 1) };
    }

    subtitleMask() {
      const f = this.g.fonts && this.g.fonts[SUBTITLE.FONT];
      if (!f || !this.sub) return null;
      if (this.text === this.sub) return this.mask;
      const lines = f.wrap(this.sub, SUBTITLE.WIDTH);
      const lh = f.height + f.lineGap;
      const mask = new FO.Screen(MOVIE_W, Math.max(1, lines.length * lh));
      lines.forEach((l, i) => f.levels(mask, l, (MOVIE_W - f.width(l)) >> 1, i * lh));
      this.text = this.sub;
      this.mask = mask;
      return mask;
    }

    paint(out, w, h) {
      const mask = this.subtitleMask();
      if (!mask || !this.place) return;
      const { ox, top, bottom } = this.place;
      const y0 = Math.min(top + ((bottom - top - mask.h) >> 1), h - mask.h);
      for (let y = 0; y < mask.h; y++) {
        const dy = y0 + y;
        if (dy < 0 || dy >= h) continue;
        for (let x = 0; x < mask.w; x++) {
          const v = mask.px[y * mask.w + x];
          const dx = ox + x;
          if (!v || dx < 0 || dx >= w) continue;
          const c = Math.round(255 * v / FO.FONT_LEVELS);
          out[dy * w + dx] = 0xFF000000 | (c << 16) | (c << 8) | c;
        }
      }
    }

    skip() {
      if (this.mve) this.finish();
    }

    keyDown() {
      this.skip();
      return true;
    }

    mouseDown() {}

    mouseUp() {
      this.skip();
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      const g = this.g;
      if (this.voice && g.audio) g.audio.stopPcm(this.voice);
      this.voice = null;
      if (g.lut === this.lut) g.lut = null;
      g.paint = null;
      if (g.colors) g.colors.setFade(0);
      if (g.audio && (this.flags & FLAG.PAUSE_MUSIC)) g.audio.resumeMusic();
      if (this.host) this.host.closeModal(this);
      const after = this.flags & FLAG.FADE_IN ? FO.fade(g, 1) : Promise.resolve();
      after.then(() => {
        if (this.done) this.done();
      });
    }

    leave() {
      if (!this.finished) this.finish();
    }
  }

  FO.MovieScreen = MovieScreen;

  FO.playMovieMode = function (g, index, flags) {
    return new Promise(resolve => g.setMode(new MovieScreen(g, index, flags, resolve)));
  };
})(globalThis.FO = globalThis.FO || {});
