(function (A) {
  'use strict';
  const F = () => A.Font;
  const BOX = { x: 12, y: 348, w: 616, h: 124 };
  const TEXT = { x: 30, y: 368, w: 580, line: 18, lines: 3 };
  const INK = '#f4ecd8', NARR = '#dccb9e', THOUGHT = '#b8cce0', SHADOW = '#05030a', GOLD = '#f4bf6a';
  const READ_KEY = 'aayla98_album';

  const mix = (a, b, f) => {
    const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map(s => Math.round(((p >> s) & 255) * (1 - f) + ((q >> s) & 255) * f));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };

  const bevel = (g, x, y, w, h, fill, light, dark) => {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
    g.fillStyle = light;
    g.fillRect(x, y, w, 2);
    g.fillRect(x, y, 2, h);
    g.fillStyle = dark;
    g.fillRect(x, y + h - 2, w, 2);
    g.fillRect(x + w - 2, y, 2, h);
    g.fillStyle = '#000';
    g.fillRect(x - 1, y - 1, w + 2, 1);
    g.fillRect(x - 1, y + h, w + 2, 1);
    g.fillRect(x - 1, y, 1, h);
    g.fillRect(x + w, y, 1, h);
  };

  A.UIKit = { bevel, mix, INK, NARR, SHADOW, GOLD };

  A.VN = class {
    constructor(ui) {
      this.ui = ui;
      this.sound = new A.Audio(ui);
      this.cps = 45;
      this.cache = new Map();
      this.read = new Set();
      try {
        const saved = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
        (saved.read || []).forEach(id => this.read.add(id));
      } catch (e) { }
      this.program = A.Script.build();
      this.startLabel = A.Scripts.pro.start;
      this.load(A.newState());
    }

    restart() {
      this.load(A.newState());
      this.advance();
    }

    load(S) {
      this.state = S;
      const snap = S.scene;
      this.story = new A.Script.Story(this.program, S, snap ? snap.pc.label : this.startLabel);
      if (snap) this.story.restore(snap);
      this.log = [];
      this.line = null;
      this.choice = null;
      this.ended = false;
      this.backlog = null;
      this.hidden = false;
      this.auto = false;
      this.autoWait = 0;
      this.t = 0;
      this.extra = null;
    }

    idle() {
      this.line = null;
      this.choice = null;
      this.ended = false;
      this.extra = null;
    }

    active() {
      return !!(this.line || this.choice || this.ended || this.backlog);
    }

    person(who, name) {
      if (who === '-') return A.NARRATOR;
      if (who === 'mem') return { name: 'Память', plate: '#8a6a2a', pitch: 520 };
      if (A.CAST[who]) return A.CAST[who];
      const self = A.Script.thinker(who);
      if (self) return { name: A.CAST[self].name + ', про себя', plate: A.CAST[self].plate, pitch: A.CAST[self].pitch, thought: true };
      return { name: name || '', plate: '#6a6a7a', pitch: 420 };
    }

    setLine(who, text, id, name) {
      const person = this.person(who, name);
      this.line = { who, name: person.name, pitch: person.pitch, plate: person.plate, thought: !!person.thought, text, id, lines: F().wrap('text', text, TEXT.w), shown: 0 };
      this.line.total = this.line.lines.join('').length;
      this.log.push({ name: person.name, text });
      if (this.log.length > 200) this.log.shift();
      this.autoWait = 0;
    }

    showLines(list, opts, done) {
      this.extra = { list: list.slice(), i: 0, opts: opts || {}, done };
      this.nextExtra();
    }

    nextExtra() {
      const x = this.extra;
      if (x.i >= x.list.length) {
        this.extra = null;
        this.line = null;
        if (x.done) x.done();
        return;
      }
      const [who, text] = x.list[x.i];
      this.setLine(who, text, `${x.opts.id || 'field'}.${x.i + 1}`, x.opts.name);
      x.i++;
    }

    runLabel(label) {
      this.extra = null;
      this.ended = false;
      this.story.jump(label);
      this.advance();
    }

    advance() {
      if (this.extra) { this.nextExtra(); return; }
      const e = this.story.next();
      if (e.type === 'credits') {
        this.line = null;
        this.choice = null;
        if (this.ui.startCredits) this.ui.startCredits();
        else this.ended = true;
        return;
      }
      if (e.type === 'end') {
        this.line = null;
        if (this.ui.storyEnd) { this.ui.storyEnd(); return; }
        this.ended = true;
        return;
      }
      if (e.type === 'map' || e.type === 'field' || e.type === 'battle' || e.type === 'forget' || e.type === 'flight') {
        this.line = null;
        this.choice = null;
        if (e.type === 'map' && this.ui.enterField) this.ui.enterField(e.id, e.at);
        if (e.type === 'field' && this.ui.resumeField) this.ui.resumeField();
        if (e.type === 'battle' && this.ui.scriptBattle) this.ui.scriptBattle(e.group, e.advantage);
        if (e.type === 'forget' && this.ui.startForget) this.ui.startForget();
        if (e.type === 'flight' && this.ui.startFlight) this.ui.startFlight(e.id, e.label);
        return;
      }
      if (e.type === 'say') {
        this.setLine(e.who, e.text, e.id);
        return;
      }
      if (e.type === 'chapter') {
        this.line = null;
        if (this.ui.startChapter) this.ui.startChapter(e.id, e.label);
        else this.advance();
        return;
      }
      if (e.type === 'recall') {
        const m = A.Memory.get(e.id);
        this.sound.sfx('heal');
        this.setLine('mem', `Обрывок памяти «${m.title}». Вернулось: ${A.Memory.reward(m)}.`, 'mem.' + e.id);
        return;
      }
      if (e.type === 'memory') {
        this.line = null;
        if (e.what === 'palace') {
          if (this.ui.openPalace) this.ui.openPalace(() => this.advance());
          else this.advance();
          return;
        }
        const list = e.what === 'stark' ? [['mem', 'Пустое место в памяти занял рассказ ветеранов о войне Старка.']]
          : e.ids.map(id => ['mem', `Обрывок «${A.Memory.get(id).title}» вернулся бледным. Умение придёт в главе 3: ${A.Memory.reward(A.Memory.get(id))}.`]);
        if (!list.length) { this.advance(); return; }
        this.sound.sfx('heal');
        this.showLines(list, { id: 'mem.' + e.what }, () => this.advance());
        return;
      }
      if (e.type === 'cover') {
        this.line = null;
        if (this.ui.openDossier) this.ui.openDossier(() => this.advance());
        else this.advance();
        return;
      }
      if (e.type === 'respite') {
        this.line = null;
        if (this.ui.startRespite) this.ui.startRespite(e.id);
        else this.advance();
        return;
      }
      if (e.type === 'return') {
        this.line = null;
        const go = () => (e.ui === 'respite' && this.ui.resumeRespite ? this.ui.resumeRespite() : this.advance());
        if (e.bond && this.ui.bondCard) this.ui.bondCard(e.bond, e.rank, go);
        else go();
        return;
      }
      this.line = null;
      this.choice = { stage: 'words', lekku: e.lekku, options: e.options, index: 0, picked: -1, timer: e.timer || 0, left: e.timer || 0 };
    }

    markRead(id) {
      if (this.read.has(id)) return;
      this.read.add(id);
      try { localStorage.setItem(READ_KEY, JSON.stringify({ read: [...this.read] })); } catch (e) { }
    }

    finishLine() {
      const l = this.line;
      if (!l) return;
      l.shown = l.total;
      this.markRead(l.id);
    }

    proceed() {
      if (this.ended) { this.restart(); return; }
      if (this.choice) { this.pick(this.choice.index); return; }
      const l = this.line;
      if (!l) return;
      if (l.shown < l.total) { this.finishLine(); return; }
      this.sound.click();
      this.advance();
    }

    rows() {
      const c = this.choice;
      if (!c) return [];
      if (c.stage === 'words') return c.options.map(o => o.text);
      return ['Спокойно: спрятать чувство', 'Показать чувство', ...c.lekku.gestures.map(gs => 'Жест ' + A.LEKKU[gs].replace(/^жест /, ''))];
    }

    pick(i) {
      const c = this.choice;
      if (!c || i < 0 || i >= this.rows().length) return;
      this.sound.click();
      if (c.stage === 'words') {
        c.picked = i;
        if (c.lekku) {
          c.stage = 'lekku';
          c.index = 0;
          return;
        }
        this.log.push({ name: '', text: '> ' + c.options[i].text });
        this.choice = null;
        this.story.choose(i);
        this.advance();
        return;
      }
      const pose = i === 0 ? 'calm' : i === 1 ? 'show' : c.lekku.gestures[i - 2];
      this.log.push({ name: '', text: '> ' + c.options[c.picked].text });
      this.choice = null;
      this.story.choose(c.picked, pose);
      this.advance();
    }

    update(dt) {
      this.t += dt;
      const c = this.choice;
      if (c && c.timer && c.stage === 'words' && !this.backlog) {
        c.left = Math.max(0, c.left - dt);
        if (c.left <= 0) this.pick(c.options.length - 1);
      }
      const l = this.line;
      const held = this.ui.held ? this.ui.held() : this.ui.keys;
      const skip = (held.has('ControlLeft') || held.has('ControlRight')) && !this.backlog;
      this.skipping = skip;
      if (l && l.shown < l.total) {
        if (skip && this.read.has(l.id)) l.shown = l.total;
        else {
          const before = Math.floor(l.shown);
          l.shown = Math.min(l.total, l.shown + this.cps * dt);
          const after = Math.floor(l.shown), flat = l.lines.join('');
          for (let k = before; k < after; k++) if (k % 2 === 0 && flat[k] !== ' ') this.sound.blip(l.pitch);
        }
        if (l.shown >= l.total) this.markRead(l.id);
        return;
      }
      if (l && skip && this.read.has(l.id)) {
        this.autoWait += dt;
        if (this.autoWait > 0.06) this.advance();
        return;
      }
      if (l && this.auto && !this.backlog) {
        this.autoWait += dt;
        if (this.autoWait > 0.8 + l.total * 0.03) this.advance();
      }
    }

    key(code) {
      if (!this.active()) return false;
      if (this.backlog) {
        if (code === 'Escape' || code === 'Backspace' || code === 'Enter') this.backlog = null;
        else if (code === 'ArrowUp' || code === 'KeyW') this.scroll(1);
        else if (code === 'ArrowDown' || code === 'KeyS') this.scroll(-1);
        return true;
      }
      if (this.hidden) {
        this.hidden = false;
        return true;
      }
      if (code === 'Escape') return false;
      if (this.choice) {
        const n = this.rows().length;
        if (code === 'ArrowUp' || code === 'KeyW') this.choice.index = (this.choice.index + n - 1) % n;
        else if (code === 'ArrowDown' || code === 'KeyS') this.choice.index = (this.choice.index + 1) % n;
        else if (code === 'Enter' || code === 'Space') this.pick(this.choice.index);
        else if (code === 'Backspace') this.openLog();
        return true;
      }
      if (code === 'Enter' || code === 'Space') this.proceed();
      else if (code === 'Backspace') this.openLog();
      else if (code === 'KeyA') this.auto = !this.auto;
      else if (code === 'KeyH') this.hidden = true;
      return true;
    }

    openLog() {
      this.backlog = { off: 0 };
    }

    scroll(d) {
      if (!this.backlog) return;
      this.backlog.off = Math.max(0, Math.min(Math.max(0, this.logLines().length - 20), this.backlog.off + d));
    }

    wheel(dy) {
      if (this.backlog) {
        if (dy > 0 && this.backlog.off === 0) this.backlog = null;
        else this.scroll(dy < 0 ? 1 : -1);
      } else if (dy < 0) this.openLog();
    }

    optionAt(x, y) {
      const box = this.choiceBox();
      if (!box) return -1;
      if (x < box.x || x > box.x + box.w) return -1;
      const i = Math.floor((y - box.y - 30) / 22);
      return i >= 0 && i < this.rows().length ? i : -1;
    }

    hover(x, y) {
      const i = this.optionAt(x, y);
      if (i >= 0) this.choice.index = i;
    }

    click(x, y, button) {
      if (this.backlog) { this.backlog = null; return; }
      if (this.hidden) { this.hidden = false; return; }
      if (button === 2) { this.openLog(); return; }
      if (this.choice) {
        const i = this.optionAt(x, y);
        if (i >= 0) this.pick(i);
        return;
      }
      this.proceed();
    }

    choiceBox() {
      if (!this.choice) return null;
      const rows = this.rows();
      const w = Math.max(320, ...rows.map(r => F().measure('text', r) + 48), F().measure('bold', this.choiceTitle()) + 40);
      const h = 38 + rows.length * 22;
      return { x: Math.round(320 - w / 2), y: Math.max(40, 336 - h), w: Math.round(w), h };
    }

    choiceTitle() {
      const c = this.choice;
      if (!c) return '';
      if (c.stage === 'lekku') return 'Лекку: что они покажут';
      return c.lekku ? `Ответ (${A.CAST[c.lekku.who].name} читает лекку)` : 'Ответ';
    }

    logLines() {
      const out = [];
      for (const e of this.log) {
        const head = e.name ? e.name + ': ' : '';
        F().wrap('text', head + e.text, 560).forEach(l => out.push(l));
      }
      return out;
    }

    box(g) {
      const l = this.line;
      bevel(g, BOX.x, BOX.y, BOX.w, BOX.h, 'rgba(14,10,26,0.9)', '#d8b884', '#4a3020');
      g.fillStyle = 'rgba(255,255,255,0.03)';
      for (let y = BOX.y + 3; y < BOX.y + BOX.h - 2; y += 2) g.fillRect(BOX.x + 2, y, BOX.w - 4, 1);
      if (!l) return;
      if (l.name) {
        const w = F().measure('bold', l.name) + 20;
        bevel(g, BOX.x + 10, BOX.y - 20, w, 20, l.plate, mix(l.plate, '#ffffff', 0.45), mix(l.plate, '#000000', 0.55));
        F().draw(g, 'bold', l.name, BOX.x + 20, BOX.y - 18, '#ffffff', SHADOW);
      }
      let left = Math.floor(l.shown);
      const color = l.who === '-' ? NARR : l.thought ? THOUGHT : INK;
      l.lines.slice(0, TEXT.lines).forEach((ln, i) => {
        if (left <= 0) return;
        const part = ln.slice(0, left);
        left -= ln.length;
        F().draw(g, 'text', part, TEXT.x, TEXT.y + i * TEXT.line, color, SHADOW);
      });
      if (l.shown >= l.total && Math.floor(this.t * 2) % 2 === 0) {
        g.fillStyle = GOLD;
        const x = BOX.x + BOX.w - 24, y = BOX.y + BOX.h - 18;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 10, y);
        g.lineTo(x + 5, y + 6);
        g.closePath();
        g.fill();
      }
    }

    choicePanel(g) {
      const b = this.choiceBox(), rows = this.rows();
      bevel(g, b.x, b.y, b.w, b.h, 'rgba(20,14,32,0.95)', '#d8b884', '#4a3020');
      const title = this.choiceTitle();
      F().draw(g, 'bold', title, b.x + 14, b.y + 8, GOLD, SHADOW);
      if (this.choice.timer && this.choice.stage === 'words') {
        const k = this.choice.left / this.choice.timer, w = b.w - 28;
        g.fillStyle = '#2a1a1a';
        g.fillRect(b.x + 14, b.y + 24, w, 3);
        g.fillStyle = k < 0.4 ? '#ff6a4a' : '#f4bf6a';
        g.fillRect(b.x + 14, b.y + 24, Math.round(w * k), 3);
      }
      rows.forEach((r, i) => {
        const y = b.y + 30 + i * 22, on = i === this.choice.index;
        if (on) {
          g.fillStyle = GOLD;
          g.fillRect(b.x + 8, y, b.w - 16, 20);
        }
        F().draw(g, 'text', r, b.x + 24, y + 2, on ? '#1c1840' : INK, on ? null : SHADOW);
      });
    }

    logPanel(g) {
      g.fillStyle = 'rgba(6,4,12,0.92)';
      g.fillRect(0, 0, A.W, A.H);
      F().draw(g, 'bold', 'Журнал реплик', 40, 20, GOLD, SHADOW);
      const lines = this.logLines(), n = 20, end = lines.length - this.backlog.off, start = Math.max(0, end - n);
      lines.slice(start, end).forEach((l, i) => F().draw(g, 'text', l, 40, 50 + i * 19, l.startsWith('> ') ? '#a0c8f0' : INK, SHADOW));
      F().draw(g, 'text', 'Стрелки и колесо: листать. Backspace, Esc или Enter: назад', 40, 450, '#9a8a70');
    }

    draw(g) {
      const vn = this.story.vn;
      if (vn.bg) A.Art.drawBg(g, vn.bg, vn.time);
      else if (!this.ui.field) {
        g.fillStyle = '#0c0a14';
        g.fillRect(0, 0, A.W, A.H);
      }
      if (vn.still) A.Art.drawStill(g, vn.still);
      else if (vn.cg) A.Art.drawCg(g, vn.cg);
      else {
        const speaker = this.line && (A.Script.thinker(this.line.who) || this.line.who);
        for (const [who, b] of Object.entries(vn.busts)) A.Art.drawBust(g, who, b, speaker && speaker !== '-' && speaker !== who, this.t);
      }
      if (this.hidden || !this.active()) return;
      this.box(g);
      if (this.choice) this.choicePanel(g);
      const marks = [this.auto ? 'АВТО' : '', this.skipping ? 'ПРОПУСК' : ''].filter(Boolean).join(' · ');
      if (marks) F().draw(g, 'bold', marks, A.W - 20 - F().measure('bold', marks), 12, GOLD, SHADOW);
      if (this.ended) {
        bevel(g, 170, 180, 300, 80, 'rgba(20,14,32,0.95)', '#d8b884', '#4a3020');
        F().draw(g, 'bold', 'Конец сцены', 320 - F().measure('bold', 'Конец сцены') / 2, 196, GOLD, SHADOW);
        const t = 'Enter: начать сначала';
        F().draw(g, 'text', t, 320 - F().measure('text', t) / 2, 224, INK, SHADOW);
      }
      if (this.backlog) this.logPanel(g);
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
