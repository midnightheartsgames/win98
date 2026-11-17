(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const proto = H.UI.prototype;
  const base = { writeSave: proto.writeSave, destroy: proto.destroy, update: proto.update, syncPending: proto.syncPending, fieldKey: proto.fieldKey, openSkip: proto.openSkip, openMenu: proto.openMenu, drawChatNotice: proto.drawChatNotice, visitGo: proto.visitGo, netInviteAccept: proto.netInviteAccept, drawNetNotice: proto.drawNetNotice };
  const CARD_S = { beat: 1.2, battle: 1.5 };
  const BLOCKED_KEYS = /^(KeyM|KeyF|KeyE|Digit[1-4])$/;

  Object.assign(proto, {
    replayWhy() {
      const g = this.game, n = globalThis.Net98;
      if (!g || this.mode !== 'field') return 'Сначала закончите бой';
      if (g.guest) return 'Атлас недоступен в гостях.';
      if (g.replay) return 'Воспоминание уже идёт';
      if (g.state.su) return 'Сначала выйдите из Вселенной';
      if (n && n.table) return 'Атлас недоступен в гостях.';
      if (g.busy() || g.cg || this.dlg) return 'Сначала закончите сцену';
      return null;
    },

    replayBegin(nodeId, beatId, back) {
      const why = this.replayWhy();
      if (why) { this.toast(why); this.sfx('deny'); return false; }
      const home = this.game, g = H.replayGame(home, nodeId, beatId || null);
      if (!g) { this.toast('Здесь пока нечего пересматривать'); this.sfx('deny'); return false; }
      this.replayHome = home;
      this.replayBack = back || null;
      this.replayCardS = null;
      this.screens = [];
      this.dlg = null;
      this.game = g;
      g.replayNext();
      this.enterField();
      this.banner = null;
      this.sfx('confirm');
      return true;
    },

    replayEnd(opts = {}) {
      const home = this.replayHome;
      if (!home) return false;
      const fresh = this.game && this.game.replay ? this.game.replayFresh() : [];
      const node = this.game && this.game.replay ? this.game.replay.node : null;
      const back = this.replayBack;
      for (const id of fresh) if (!home.state.recaps.includes(id)) home.state.recaps.push(id);
      this.game = home;
      this.replayHome = null;
      this.replayBack = null;
      this.screens = [];
      this.dlg = null;
      if (opts.quiet) return true;
      this.enterField();
      for (const id of fresh) this.toast('Открыт эпизод «' + home.fill(id) + '».');
      if (fresh.length) this.writeSave('auto');
      if (back) back(node, fresh);
      return true;
    },

    writeSave(slot) {
      if (this.game && this.game.replay) return false;
      return base.writeSave.call(this, slot);
    },

    destroy() {
      if (this.replayHome) this.replayEnd({ quiet: true });
      return base.destroy.call(this);
    },

    visitGo(row) {
      if (this.game && this.game.replay) { this.toast('Сначала закончите воспоминание'); this.sfx('deny'); return false; }
      return base.visitGo ? base.visitGo.call(this, row) : false;
    },

    netInviteAccept(inv) {
      if (this.game && this.game.replay) { this.toast('Сначала закончите воспоминание'); this.sfx('deny'); return; }
      return base.netInviteAccept ? base.netInviteAccept.call(this, inv) : undefined;
    },

    drawNetNotice(c) {
      if (this.game && this.game.replay) return;
      return base.drawNetNotice ? base.drawNetNotice.call(this, c) : undefined;
    },

    update(dt) {
      const held = this.netNote && this.game && this.game.replay ? this.netNote : null, left = held ? held.t : 0;
      base.update.call(this, dt);
      if (held) { held.t = left; if (!this.netNote) this.netNote = held; }
      const g = this.game;
      if (!g || !g.replay || this.mode !== 'field' || this.screens.length || this.dlg) return;
      if (!g.replayIdle()) return;
      const map = g.map && g.map.id;
      if (!g.replayNext()) { this.replayEnd(); return; }
      if (g.map && g.map.id !== map) this.audio.music(g.mapMusic(g.map.def));
    },

    syncPending(dt) {
      const p = this.game && this.game.pending;
      if (p && p.type === 'replayCard') { this.dlg = null; if (!this.top()) this.openReplayCard(p); return; }
      return base.syncPending.call(this, dt);
    },

    openReplayCard(p) {
      const ui = this, g = this.game, R = g.replay;
      const done = () => { if (ui.top() === scr) { ui.screens.pop(); ui.finishPending(); } };
      const title = p.kind === 'battle' ? 'Бой' : g.fill(p.id);
      const sub = p.kind === 'battle' ? H.replayEncounterName(p.enc) || 'Сражение' : p.fresh ? 'Новый эпизод' : 'Эпизод ' + p.n + ' из ' + p.total;
      const note = p.kind === 'battle' ? 'В воспоминании бой пропускается' : R && H.ATLAS ? (g.atlasNode(R.node) || {}).name || '' : '';
      const scr = this.push({
        t: 0,
        tick(dt) { this.t += dt; if (this.t >= CARD_S[p.kind]) done(); },
        draw(c) {
          const a = Math.min(1, this.t / 0.2, (CARD_S[p.kind] - this.t) / 0.2), w = 360, h = 84, x = W / 2 - w / 2, y = HGT / 2 - h / 2 - 40;
          c.save();
          c.globalAlpha = Math.max(0, a);
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { top: '#1c2458', bottom: '#0a0e30', alpha: 0.96 });
          G.menuIcon(c, p.kind === 'battle' ? 'foes' : 'archive', x + 16, y + 26, 32);
          ui.text(sub, x + 60, y + 14, { size: 10, col: p.fresh ? C.ok : C.sub });
          ui.text(ui.fitText(title, 16, w - 76, true), x + 60, y + 30, { size: 16, bold: true, serif: true, col: C.gold });
          ui.text(ui.fitText(note, 10, w - 76), x + 60, y + 56, { size: 10, col: C.dim });
          c.restore();
          ui.hit(ui.left, 0, ui.vw, HGT, () => done());
        },
        key() { done(); }
      });
    },

    openSkip() {
      if (!this.game || !this.game.replay) return base.openSkip.call(this);
      this.openReplayPause();
    },

    openMenu() {
      if (this.game && this.game.replay) { this.openReplayPause(); return; }
      return base.openMenu.call(this);
    },

    fieldKey(k, code) {
      const g = this.game;
      if (g && g.replay) {
        const talking = g.pending && g.pending.type === 'say';
        if (!talking && (k === 'back' || code === 'Tab')) { this.openReplayPause(); return; }
        if (!talking && BLOCKED_KEYS.test(code || '')) return;
      }
      return base.fieldKey.call(this, k, code);
    },

    openReplayPause() {
      const ui = this, g = this.game, R = g.replay, cur = R.cur;
      const known = cur && R.known.has(cur);
      const info = known ? H.ATLAS && g.atlasBeats([cur])[0] : null;
      const lines = this.wrap(info ? g.fill(info.text) : cur ? 'Эпизод ещё не встречался: пересказ появится после просмотра.' : '', 436, 12);
      const node = g.atlasNode(R.node) || { name: '' };
      const skip = () => { ui.screens.pop(); ui.sfx('confirm'); ui.dlg = null; if (g.skipInfo()) g.skip(); else { g.script = null; g.pending = null; } ui.drainGameEvents(); };
      const leave = () => { ui.screens.pop(); ui.sfx('cancel'); ui.replayEnd(); };
      const stay = () => ui.pop();
      const acts = [['Пропустить эпизод', skip], ['Вернуться в атлас', leave], ['Смотреть дальше', stay]];
      this.push({
        sel: 2,
        draw(c) {
          const w = 480, h = 150 + lines.length * 17, x = W / 2 - w / 2, y = Math.round(HGT / 2 - h / 2 - 30);
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title: 'Воспоминание' });
          G.menuIcon(c, 'archive', x + 18, y + 18, 32);
          ui.text(ui.fitText(node.name, 10, w - 80), x + 60, y + 18, { size: 10, col: C.sub });
          ui.text(ui.fitText(cur ? g.fill(cur) : '', 15, w - 80, true), x + 60, y + 31, { size: 15, bold: true, serif: true, col: C.gold });
          c.fillStyle = C.brassDk; c.fillRect(x + 18, y + 58, w - 36, 1);
          lines.forEach((l, i) => ui.text(l, x + 22, y + 68 + i * 17, { size: 12, col: known ? C.cream : C.dim }));
          const ny = y + 76 + lines.length * 17;
          ui.text('Воспоминание ничего не меняет в прохождении.', W / 2, ny, { align: 'center', size: 10, col: C.dim });
          acts.forEach(([label, fn], i) => ui.button(W / 2 - 222 + i * 150, ny + 22, 140, 24, label, fn, { active: this.sel === i, size: 10 }));
          ui.hints([['←→', 'выбор'], ['Enter', 'да'], ['Esc', 'смотреть дальше']], W / 2, ny + 56, { align: 'center' });
        },
        key(k) {
          if (k === 'left' || k === 'up') { this.sel = (this.sel + 2) % 3; ui.sfx('select'); return; }
          if (k === 'right' || k === 'down') { this.sel = (this.sel + 1) % 3; ui.sfx('select'); return; }
          if (k === 'ok') return acts[this.sel][1]();
          if (k === 'back') stay();
        }
      });
    },

    drawChatNotice(c) {
      base.drawChatNotice.call(this, c);
      const g = this.game;
      if (!g || !g.replay || this.screens.length) return;
      const R = g.replay, label = 'Воспоминание' + (R.n ? ' · ' + R.n + '/' + Math.max(R.total, R.n + R.queue.length) : '');
      const w = Math.round(this.measure(label, 11, true) + 34), x = this.left + 12, y = 12;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 20);
      c.fillStyle = C.brass; c.fillRect(x, y, w, 1); c.fillRect(x, y + 19, w, 1);
      G.menuIcon(c, 'archive', x + 6, y + 3, 14, C.brassHi);
      this.text(label, x + 26, y + 4, { size: 11, bold: true, col: C.gold });
      this.hit(x, y, w, 20, () => this.openReplayPause());
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
