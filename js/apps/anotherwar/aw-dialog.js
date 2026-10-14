(function (AW) {
  'use strict';

  AW.DLG = AW.DLG || {};

  AW.DialogCtx = class {
    constructor(world) { this.w = world; }
    get hero() { return this.w.hero; }
    get cls() { return this.w.hero ? this.w.hero.cls : ''; }
    note(id) { return this.w.hasNote(id); }
    has(name) { return this.w.teamHas(name); }
    cash(n) { return this.w.hero && this.w.hero.inv.cash() >= n; }
    stat(s) { return this.w.hero ? this.w.hero.stat(s) : 0; }
    test(s, fixed) { const h = this.w.hero; return !!h && AW.Rules.testStat(h.stat(s), h.toRoll(), fixed); }
    testInt(n) { return this.test('int', n); }
    testStr(n) { return this.test('str', n); }
    testAgi(n) { return this.test('agi', n); }
    testCha(n) { return this.test('cha', n); }
    testLuc(n) { return this.test('lck', n); }
    testSpe(n) { return this.test('spd', n); }
    testEnd(n) { return this.test('end', n); }
    team(id) { return this.w.inTeam(id); }
    quest(id) { return this.w.questState(id); }
    flag(k) { return this.w.flag(k); }
    level() { return this.w.levelId; }
    light(kg) { return this.w.hero && this.w.hero.inv.weight() < kg; }
    actor(id) { return this.w.actor(id); }
    gone(id) { const a = this.w.actor(id); return !a || !a.visible; }
  };

  AW.Dialog = class {
    constructor(world, name, npc) {
      this.w = world;
      this.name = String(name || '').toLowerCase();
      this.def = AW.DLG[this.name] || null;
      this.npc = npc || null;
      this.ctx = new AW.DialogCtx(world);
      this.node = null;
      this.closed = false;
      this.state = world.dialogState(this.name);
      this.history = [];
    }

    valid() { return !!this.def; }

    start() {
      if (!this.def) { this.closed = true; return; }
      const id = this.state.start || this.def.start || 'START';
      this.goto(id);
    }

    goto(id) {
      if (!id || id === 'END' || !this.def.n[id]) {
        const endNode = this.def.n[id];
        if (endNode && endNode.p) this.w.runPlay(endNode.p, this.npc);
        this.close();
        return;
      }
      this.node = { id, def: this.def.n[id] };
      const d = this.node.def;
      if (d.p) this.w.runPlay(d.p, this.npc);
      if (this.closed) return;
      const text = typeof d.t === 'function' ? d.t(this.ctx) : (d.t || '');
      this.node.text = text;
      this.node.answers = this.visibleAnswers();
      this.history.push({ who: 'npc', text });
      if (!text && !this.node.answers.length) { this.close(); return; }
      if (!this.node.answers.length) this.node.answers.push({ i: -1, text: '...' });
      if (this.onChange) this.onChange();
    }

    count(ai) { return this.state.counts[this.node.id + '_' + ai] || 0; }

    visibleAnswers() {
      const out = [];
      const list = this.node.def.a || [];
      for (let i = 0; i < list.length; i++) {
        const an = list[i];
        if (an.max && this.count(i) >= an.max) continue;
        if (an.if && !an.if(this.ctx)) continue;
        const text = typeof an.t === 'function' ? an.t(this.ctx) : an.t;
        out.push({ i, text });
      }
      return out;
    }

    choose(visibleIndex) {
      if (this.closed || !this.node) return;
      const v = this.node.answers[visibleIndex];
      if (!v) return;
      if (v.i < 0) { this.close(); return; }
      const an = this.node.def.a[v.i];
      if (this.node.id === 'START' && this.def.n.START2) this.state.start = 'START2';
      const k = this.node.id + '_' + v.i;
      this.state.counts[k] = (this.state.counts[k] || 0) + 1;
      this.history.push({ who: 'hero', text: v.text });
      let to = an.to, play = an.p;
      if (an.alt) {
        for (const alt of an.alt) {
          if (!alt.if || alt.if(this.ctx)) { to = alt.to; play = alt.p; break; }
        }
      }
      if (play) this.w.runPlay(play, this.npc);
      if (this.closed) return;
      this.goto(to);
    }

    close() {
      if (this.closed) return;
      this.closed = true;
      this.node = null;
      if (this.onClose) this.onClose();
    }
  };
})(globalThis.AW = globalThis.AW || {});
