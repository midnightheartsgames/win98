(function (FO) {
  'use strict';

  const W = 640;
  const H = 480;
  const PANEL_Y = 290;
  const HOLE = [126, 14, 388, 200];
  const HR_FRAME = { art: 'ART\\INTRFACE\\HR_ALLTLK.FRM', dy: 5 };
  const DONE_OPTION = 650;
  const REPLY = [140, 229, 372, 56];
  const OPTIONS = [135, PANEL_Y + 44, 380, 112];
  const REACTION_MOOD = { 49: 'G', 50: 'N', 51: 'B' };

  class DialogScreen extends FO.Win {
    constructor(play, d) {
      super(play);
      this.d = d;
      this.history = [];
      this.lastReply = null;
      this.hoverOpt = -1;
      this.optRects = [];
      this.head = d.head;
      this.bg = d.bg === undefined ? FO.DIALOG_BG : d.bg;
      const line = this.head >= 0 ? play.g.art.lists[FO.ART.HEAD][this.head] : '';
      this.headName = line ? line.split(',')[0].trim().toUpperCase() : '';
      this.mood = d.mood === 1 ? 'G' : d.mood === 7 ? 'B' : 'N';
      this.anim = null;
      this.headTime = 0;
      this.lip = null;
      this.replyScroll = 0;
      this.overBar = true;
      this.savedCam = null;
      this.notice = null;
      this.lastNotice = null;
      this.button({ id: 'barter', x: 592, y: PANEL_Y + 40, w: 14, h: 14, up: -1, down: 96, baked: true, sound: 'ib2', onClick: () => this.barter() });
      this.button({ id: 'about', x: 592, y: PANEL_Y + 116, w: 14, h: 14, up: -1, down: 96, baked: true, sound: 'ib2', onClick: () => this.p.say(FO.tr(this.p.g, 'Nothing comes to mind.')) });
      this.button({ id: 'review', x: 13, y: PANEL_Y + 154, w: 51, h: 29, up: -1, down: 98, baked: true, onClick: () => this.p.openModal(new FO.ReviewScreen(this.p, this.history)) });
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll([103, 99, 96, 98, 102, 87, 88, 89, 90, 91, 92, 93, 94, 100, 101].map(FO.IFACE));
      await g.art.loadPath(HR_FRAME.art);
      if (this.head >= 0) {
        await g.art.loadAll([FO.fid(FO.ART.BACKGROUND, this.bg)]);
        const sets = ['G', 'N', 'B'];
        const files = [];
        for (const m of sets) {
          for (const s of ['F1', 'F2', 'F3', 'P']) files.push(m + s);
        }
        files.push('GN', 'NG', 'NB', 'BN');
        await Promise.all(files.map(s => g.art.loadPath(this.headPath(s))));
        this.startFidget();
      } else if (this.d.npc && this.d.npc.tile >= 0) {
        this.savedCam = [this.p.cx, this.p.cy];
      }
    }

    leave() {
      this.stopSpeech();
      if (this.savedCam) [this.p.cx, this.p.cy] = this.savedCam;
    }

    stopSpeech() {
      if (this.lip && this.g.audio) this.g.audio.stopSpeech();
      this.lip = null;
    }

    async startSpeech(audio) {
      const g = this.g;
      this.stopSpeech();
      if (!g.audio || !audio || this.head < 0 || !this.headName) return;
      const lip = { index: 0, phoneme: 0, data: null, voice: null, ended: false };
      this.lip = lip;
      const [data, voice] = await Promise.all([FO.loadLip(g, this.headName, audio), g.audio.speech(this.headName, audio, FO.LIP_VOLUME)]);
      if (this.lip !== lip) return;
      if (!voice) {
        this.lip = null;
        return;
      }
      lip.data = data;
      lip.voice = voice;
      lip.phoneme = data && data.phonemes.length ? data.phonemes[0] : 0;
    }

    headPath(suffix) {
      return 'ART\\HEADS\\' + this.headName + suffix + '.FRM';
    }

    headFrm(suffix) {
      return this.g.art.getPath(this.headPath(suffix)) || null;
    }

    startFidget() {
      const n = 1 + Math.floor(Math.random() * 3);
      let frm = this.headFrm(this.mood + 'F' + n) || this.headFrm(this.mood + 'F1');
      if (!frm) frm = this.headFrm('NF1');
      this.anim = { frm, frame: 0, loop: false, kind: 'fidget', wait: 2 + Math.random() * 4 };
    }

    react(reaction) {
      const target = REACTION_MOOD[reaction];
      if (!target || target === this.mood || this.head < 0) return;
      const pair = this.mood + target;
      const path = pair === 'GB' ? 'GN' : pair === 'BG' ? 'BN' : pair;
      const frm = this.headFrm(path);
      const next = pair === 'GB' ? 'N' : pair === 'BG' ? 'N' : target;
      this.mood = next;
      if (frm) this.anim = { frm, frame: 0, loop: false, kind: 'transition', wait: 0 };
    }

    origin() {
      return FO.screenOrigin(this.g.scr, this.g);
    }

    frame() {
      const scr = this.g.scr;
      return (scr.w > W || scr.h > H) && FO.frameOfArt(this.g, HR_FRAME.art) ? HR_FRAME : { art: 103, dy: 0 };
    }

    update(dt) {
      const d = this.p.sc.dialog;
      if (!d) {
        this.close();
        return;
      }
      if (d.node.reply !== this.lastReply) {
        this.lastReply = d.node.reply;
        this.replyScroll = 0;
        if (d.node.reply) {
          const name = d.npc ? this.g.protos.name(d.npc.pid) : '';
          this.history.push({ who: name, text: this.spoken(d) });
          this.startSpeech(d.node.audio);
        } else {
          this.stopSpeech();
        }
        if (d.reaction !== undefined) {
          this.react(d.reaction);
          d.reaction = undefined;
        }
      }
      if (this.notice !== this.lastNotice) this.lastNotice = this.notice;
      if (this.head >= 0) this.updateHead(dt);
    }

    updateLips() {
      const lip = this.lip;
      const audio = this.g.audio;
      if (!lip.voice) return true;
      const talk = this.headFrm(this.mood + 'P');
      if (audio.speechDone() || lip.ended) {
        if (lip.ended) audio.stopSpeech();
        this.lip = null;
        this.anim = { frm: talk, frame: 0, loop: false, kind: 'fidget', wait: 3 + Math.random() * 5 };
        return true;
      }
      const phoneme = lip.data ? FO.lipStep(lip, audio.speechBytes()) : 0;
      this.anim = { frm: talk, frame: FO.PHONEME_FRAMES[phoneme] | 0, kind: 'talk', wait: 0 };
      return true;
    }

    updateHead(dt) {
      if (this.lip && this.updateLips()) return;
      const a = this.anim;
      if (!a || !a.frm) return;
      this.headTime += dt;
      const step = 0.1;
      if (this.headTime < step) return;
      this.headTime = 0;
      const n = a.frm.dirs[0].frames.length;
      if (a.kind === 'talk') {
        this.startFidget();
        return;
      }
      if (a.frame < n - 1) {
        a.frame++;
        return;
      }
      if (a.kind === 'transition') {
        this.startFidget();
        return;
      }
      a.wait -= step;
      if (a.wait <= 0) {
        this.startFidget();
        this.anim.wait = 3 + Math.random() * 5;
      }
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = this.origin();
      this.x = ox;
      this.y = oy;
      const d = this.p.sc.dialog;
      const frame = this.frame();
      const hy = oy + HOLE[1] + frame.dy;
      if (this.head >= 0) {
        scr.rect(ox + HOLE[0], hy, HOLE[2], HOLE[3], 0);
        const back = FO.frameOfArt(g, FO.fid(FO.ART.BACKGROUND, this.bg));
        if (back) this.copyBack(scr, back, ox + HOLE[0], hy);
        const a = this.anim;
        if (a && a.frm) this.drawHead(scr, a, ox, hy - HOLE[1]);
      } else if (d && d.npc && d.npc.tile >= 0) {
        this.p.cx = FO.hexLeft(d.npc.tile) + 16;
        this.p.cy = FO.hexTop(d.npc.tile) + 8 - 50;
        const v = this.p.view();
        v.x = Math.round(this.p.cx - HOLE[2] / 2);
        v.y = Math.round(this.p.cy - HOLE[3] / 2);
        this.holeView = this.holeView || new FO.Screen(HOLE[2], HOLE[3]);
        FO.drawMap(this.holeView, v);
        scr.blitScaled(this.holeView, [0, 0, HOLE[2], HOLE[3]], [ox + HOLE[0], hy, HOLE[2], HOLE[3]]);
      }
      FO.blitArt(g, scr, frame.art, ox, oy);
      FO.blitArt(g, scr, 99, ox, oy + PANEL_Y);
      this.drawButtons(scr);
      if (!d) return;
      this.drawReply(scr, d, ox, oy);
      this.drawOptions(scr, d, ox, oy);
    }

    copyBack(scr, f, x, y) {
      const w = Math.min(f.w, HOLE[2]);
      for (let j = 0; j < Math.min(f.h, HOLE[3]); j++) {
        const dy = y + j;
        if (dy >= 0 && dy < scr.h) scr.px.set(f.px.subarray(j * f.w, j * f.w + w), dy * scr.w + x);
      }
    }

    drawHead(scr, a, ox, oy) {
      const dir = a.frm.dirs[0];
      const index = Math.min(a.frame, dir.frames.length - 1);
      const f = dir.frames[index];
      let shift = 0;
      for (let k = 0; k <= index; k++) shift += dir.frames[k].ox | 0;
      const x = Math.trunc((HOLE[2] - f.w) / 2) + dir.sx + shift;
      let row = HOLE[3] - f.h + dir.sy;
      if (row * W + x <= 0) row = HOLE[3] - f.h;
      scr.blit(f, ox + HOLE[0] + x, oy + HOLE[1] + row);
    }

    drawReply(scr, d, ox, oy) {
      const g = this.g;
      const font = g.fonts[101];
      const lines = font.wrap(this.notice || this.spoken(d), REPLY[2]);
      const rows = Math.floor(REPLY[3] / 10);
      const start = Math.min(this.replyScroll, Math.max(0, lines.length - rows));
      const col = this.color('green');
      lines.slice(start, start + rows).forEach((l, i) => g.text(l, ox + REPLY[0], oy + REPLY[1] + i * 10, col, 101));
    }

    spoken(d) {
      return FO.speakerText(d.node.reply || '', FO.isFemale(d.npc));
    }

    optionText(d, o) {
      return FO.speakerText(o.text, FO.isFemale(d.npc));
    }

    options(d) {
      if (d.node.message || (!d.node.options.length && d.node.reply)) return [{ text: this.p.text(DONE_OPTION), done: true }];
      return d.node.options;
    }

    drawOptions(scr, d, ox, oy) {
      const g = this.g;
      const font = g.fonts[101];
      let y = oy + OPTIONS[1];
      const x = ox + OPTIONS[0];
      this.optRects = [];
      const m = g.mouse;
      this.hoverOpt = -1;
      this.options(d).forEach((o, i) => {
        const lines = font.wrap(this.optionText(d, o), OPTIONS[2] - 14);
        const h = lines.length * 10;
        const hover = m.inside && m.x >= x && m.x < x + OPTIONS[2] && m.y >= y && m.y < y + h + 2;
        if (hover) this.hoverOpt = i;
        const col = hover ? this.color('yellow') : this.color('green');
        lines.forEach((l, j) => g.text((j ? '  ' : '- ') + l, x, y + j * 10, col, 101));
        this.optRects.push([x, y, OPTIONS[2], h + 2, i]);
        y += h + 5;
      });
    }

    choose(i) {
      const d = this.p.sc.dialog;
      if (!d || !d.waiting) return;
      const opts = this.options(d);
      const o = opts[i];
      if (!o) return;
      if (o.done) {
        this.p.sc.resumeDialog(-1);
        return;
      }
      this.history.push({ who: this.p.w.dude.name || 'You', text: this.optionText(d, o), player: true });
      this.p.sc.resumeDialog(i);
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      for (const [x, y, w, h, i] of this.optRects) {
        if (m.x >= x && m.x < x + w && m.y >= y && m.y < y + h) {
          this.choose(i);
          return;
        }
      }
      const [ox, oy] = this.origin();
      if (m.x >= ox + REPLY[0] && m.x < ox + REPLY[0] + REPLY[2] && m.y >= oy + REPLY[1] && m.y < oy + REPLY[1] + REPLY[3]) {
        this.replyScroll += m.y < oy + REPLY[1] + REPLY[3] / 2 ? -1 : 1;
        this.replyScroll = Math.max(0, this.replyScroll);
      }
    }

    keyDown(e) {
      const n = /^Digit([1-9])$/.exec(e.code) || /^Numpad([1-9])$/.exec(e.code);
      if (n) {
        this.choose(+n[1] - 1);
        return true;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        const d = this.p.sc.dialog;
        if (d && this.options(d).length === 1) this.choose(0);
        return true;
      }
      return super.keyDown(e) || true;
    }

    barter() {
      const d = this.p.sc.dialog;
      if (!d || !d.npc) return;
      this.p.openBarter(d.npc, d.barter | 0);
    }

    cursor() {
      return 267;
    }
  }

  class ReviewScreen extends FO.Win {
    constructor(play, history) {
      super(play);
      this.history = history;
      this.scroll = 0;
      this.overBar = true;
      this.button({ id: 'up', x: 476, y: 154, up: 89, down: 90, baked: true, sound: 'ib2', key: 'ArrowUp', onClick: () => { this.scroll = Math.max(0, this.scroll - 5); } });
      this.button({ id: 'down', x: 476, y: 192, up: 87, down: 88, baked: true, sound: 'ib2', key: 'ArrowDown', onClick: () => { this.scroll += 5; } });
      this.button({ id: 'done', x: 500, y: 398, up: 91, down: 92, baked: true, key: ['Escape', 'Enter'], onClick: () => this.close() });
    }

    lines() {
      const font = this.g.fonts[101];
      const out = [];
      for (const h of this.history) {
        out.push({ text: h.who + ':', color: h.player ? 'yellow' : 'light' });
        for (const l of font.wrap(h.text, 360)) out.push({ text: '  ' + l, color: h.player ? 'yellow' : 'green' });
      }
      return out;
    }

    draw(scr) {
      [this.x, this.y] = FO.screenOrigin(this.g.scr, this.g);
      this.blit(scr, 102, 0, 0);
      this.drawButtons(scr);
      const lines = this.lines();
      const rows = 33;
      this.scroll = Math.min(this.scroll, Math.max(0, lines.length - rows));
      lines.slice(this.scroll, this.scroll + rows).forEach((l, i) => this.text(l.text, 92, 84 + i * 10, this.color(l.color), 101));
    }
  }

  FO.DialogScreen = DialogScreen;
  FO.ReviewScreen = ReviewScreen;
})(globalThis.FO = globalThis.FO || {});
