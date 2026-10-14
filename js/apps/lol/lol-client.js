(function (L) {
  'use strict';
  const D = L.DATA, SK = L.SKINS, Art = L.Art, Icons = L.Icons;
  const { CHAMPS, CHAMP_ORDER, SPELL_ORDER } = D;
  const R_ = L.Renderer, W = R_.W, H = R_.H, GOLD = R_.GOLD, GOLD_D = R_.GOLD_D;
  const TAU = Math.PI * 2;

  function lock(c, x, y, s) {
    c.fillStyle = '#0a0a10'; c.fillRect(x - s * 0.55, y - s * 0.1, s * 1.1, s * 0.85);
    c.fillStyle = '#c8a040'; c.fillRect(x - s * 0.45, y, s * 0.9, s * 0.65);
    c.strokeStyle = '#c8a040'; c.lineWidth = Math.max(2, s * 0.14); c.beginPath(); c.arc(x, y - s * 0.02, s * 0.3, Math.PI, 0); c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#2a1a08'; c.fillRect(x - s * 0.06, y + s * 0.18, s * 0.12, s * 0.26);
  }

  Object.assign(L.UI.prototype, {
    saveColl() { try { localStorage.setItem(SK.STORE_KEY, JSON.stringify(this.coll.toJSON())); } catch (_) {} },
    queue(key, fn) { if (this.jobKeys.has(key)) return; this.jobKeys.add(key); this.jobs.push({ key, fn }); },
    runJobs(budget) { const t0 = performance.now(); while (this.jobs.length && performance.now() - t0 < budget) { const j = this.jobs.shift(); this.jobKeys.delete(j.key); j.fn(); } },
    lazySplash(id, w, h, mode) { const key = `${id}|${w}x${h}|${mode || 'wide'}`; if (Art.has('splash', key)) return Art.splash(id, w, h, mode); this.queue('s:' + key, () => Art.splash(id, w, h, mode)); return null; },
    lazyIcon(id, s) { if (Art.has('icon', `${id}|${s}`)) return Art.icon(id, s); this.queue(`i:${id}|${s}`, () => Art.icon(id, s)); return null; },
    rarityOf(id) { const s = SK.get(id); return SK.RARITY[s ? s.def.rarity : 'base']; },
    skinName(id) { const s = SK.get(id); return s ? this.L(s.def.name) : ''; },
    featuredLook() { return this.coll.last || this.coll.lookFor(this.sel.champ); },
    say2(text, color) { this.toast = { text, color: color || GOLD, t: 0 }; },
    fitSize(text, w, size, bold) { let s = size; while (s > 7 && this.R.measure(text, s, bold) > w) s -= 0.5; return s; },

    debugChest() {
      if (!this.coll.addChest(null)) return;
      this.saveColl();
      this.say2(this.S.debugChest);
      this.audio.play('buy');
      if (this.screen !== 'game' || this.endShown) this.openChestOverlay();
    },
    openChestOverlay() { this.chest = { phase: 'ready', t: 0, got: null, from: this.screen }; this.overlay = 'chest'; },
    startChestOpen() {
      const ch = this.chest; if (!ch || ch.phase === 'opening') return;
      if (!this.coll.chests.length) { this.say2(this.S.noChests, '#ff9070'); return; }
      if (this.coll.complete()) { this.say2(this.S.allOwned, '#ffe070'); return; }
      ch.phase = 'opening'; ch.t = 0; ch.got = null;
      this.audio.play('chest_shake');
    },
    updateChest(dt) {
      const ch = this.chest; if (!ch) return;
      ch.t += dt;
      if (ch.phase === 'opening' && ch.t > 1.35) {
        ch.got = this.coll.open(Math.random); this.saveColl();
        ch.phase = 'reveal'; ch.t = 0;
        this.audio.play('chest_open'); setTimeout(() => this.audio && this.audio.play('skin_reveal'), 250);
        if (ch.got) { Art.splash(ch.got.id, 480, 270); this.collSel = { champ: ch.got.cid, skin: ch.got.id }; }
      }
    },
    closeChest() { this.chest = null; this.overlay = null; },

    drawHubBackdrop() {
      const c = this.ctx, look = this.featuredLook(), im = this.assetsReady() ? this.lazySplash(look, W, H, 'hub') : null;
      if (im) {
        const k = (Math.sin(this.t * 0.07) + 1) / 2, z = 1.04 + k * 0.03;
        c.drawImage(im, (W - W * z) / 2 - k * 10, (H - H * z) / 2, W * z, H * z);
      } else this.drawBg(0.5);
      const g = c.createLinearGradient(0, 0, 520, 0); g.addColorStop(0, 'rgba(4,6,14,0.94)'); g.addColorStop(0.55, 'rgba(4,6,14,0.72)'); g.addColorStop(1, 'rgba(4,6,14,0)');
      c.fillStyle = g; c.fillRect(0, 0, 520, H);
      const b = c.createLinearGradient(0, H - 120, 0, H); b.addColorStop(0, 'rgba(4,6,14,0)'); b.addColorStop(1, 'rgba(4,6,14,0.9)');
      c.fillStyle = b; c.fillRect(0, H - 120, W, 120);
      return look;
    },
    drawTitle() {
      const R = this.R, S = this.S, c = this.ctx;
      const look = this.drawHubBackdrop();
      this.logo(196, 78, 0.92);
      R.text(S.subtitle, 196, 176, { align: 'center', size: 14, serif: true, color: '#c8d0e8' });
      const ready = this.assetsReady(), bx = 70;
      R.button(bx, 214, 252, 40, S.play, 'play', { disabled: !ready, size: 14 });
      R.button(bx, 264, 252, 32, S.collection, 'collection', { disabled: !ready });
      const n = this.coll.chests.length;
      if (n && ready) { const pulse = 0.7 + Math.sin(this.t * 5) * 0.3; c.drawImage(Icons.chest(28, false), bx + 214, 266); c.fillStyle = `rgba(255,70,50,${pulse})`; c.beginPath(); c.arc(bx + 243, 270, 8, 0, TAU); c.fill(); R.text(String(n), bx + 243, 274, { align: 'center', size: 10, bold: true }); }
      R.button(bx, 304, 252, 30, S.options, 'options');
      R.button(bx, 342, 252, 30, S.help, 'help');
      if (this.opts.onExit) R.button(bx, 380, 252, 30, S.exit, 'exit');
      R.panel(16, 452, 300, 96, { title: S.profile });
      R.text(this.profile.name, 30, 498, { size: 13, bold: true, color: '#ffe8a0' });
      R.text(`${S.wins}: ${this.profile.wins}   ${S.losses}: ${this.profile.losses}`, 30, 516, { size: 11, color: '#c8c0a8' });
      const lvl = 1 + Math.floor((this.profile.wins * 2 + this.profile.losses) / 3);
      R.text(`${S.level} ${Math.min(30, lvl)}    ${S.skins}: ${this.coll.ownedCount()} / ${this.coll.total()}`, 30, 534, { size: 10, color: '#9aa0b8' });
      const s = SK.get(look), rar = this.rarityOf(look);
      if (s && ready) {
        const name = this.L(s.def.name), w = R.measure(name, 13, true) + 40;
        c.fillStyle = 'rgba(4,6,14,0.7)'; c.fillRect(784 - w, 510, w, 28); c.fillStyle = rar.color; c.fillRect(784 - w, 510, 3, 28);
        c.drawImage(Icons.rarity(12, rar.color), 784 - w + 10, 518);
        R.text(name, 776, 529, { align: 'right', size: 13, bold: true, serif: true, color: '#fff4dc' });
      }
      R.panel(330, 548, 456, 40);
      const k = this.stepI / this.steps.length;
      R.text(ready ? S.patchDone : (k < 0.3 ? S.connecting : S.patching), 344, 566, { size: 10, color: '#c8d0e8' });
      R.bar(344, 572, 424, 8, ready ? 1 : k, '#40a0ff', '#101830');
      R.text('PVP.net 98', 770, 566, { align: 'right', size: 10, bold: true, color: GOLD });
      R.text('Riot Games · 1999 · Win 98 Edition', 16, 592, { size: 9, color: '#6a7088' });
    },

    drawCollection() {
      const R = this.R, S = this.S, c = this.ctx, cs = this.collSel;
      this.drawBg(0.86);
      const hg = c.createLinearGradient(0, 0, 0, 46); hg.addColorStop(0, '#26304a'); hg.addColorStop(1, '#0e1220');
      c.fillStyle = hg; c.fillRect(0, 0, W, 46); c.fillStyle = GOLD_D; c.fillRect(0, 46, W, 2); c.fillStyle = GOLD; c.fillRect(0, 48, W, 1);
      R.button(10, 9, 90, 28, S.back, 'back', { size: 11 });
      R.text(S.collection, 116, 31, { size: 22, bold: true, serif: true, color: GOLD });
      R.text(`${S.skins}: ${this.coll.ownedCount()} / ${this.coll.total()}`, 300, 29, { size: 12, bold: true, color: '#e8dcc0' });
      const n = this.coll.chests.length;
      c.drawImage(Icons.chest(40, false, n ? '#40d0ff' : '#506070'), 512, 3);
      R.text(`× ${n}`, 556, 30, { size: 14, bold: true, color: n ? '#ffe070' : '#8a8a90' });
      R.button(600, 9, 190, 28, S.openChest, 'openChest', { disabled: !n, size: 12, active: n > 0 });
      c.fillStyle = 'rgba(6,8,16,0.8)'; c.fillRect(10, 56, 172, 534); c.strokeStyle = GOLD_D; c.strokeRect(10.5, 56.5, 171, 533);
      CHAMP_ORDER.forEach((cid, i) => {
        const y = 60 + i * 53, on = cs.champ === cid, list = SK.SKINS[cid], owned = list.filter(s => s.rarity === 'base' || this.coll.owns(cid + '.' + s.key)).length;
        const hot = this.hover && this.hover.id === 'collChamp' && this.hover.data === cid;
        c.fillStyle = on ? 'rgba(232,192,96,0.2)' : hot ? 'rgba(80,100,160,0.25)' : 'rgba(0,0,0,0)'; c.fillRect(13, y, 166, 50);
        if (on) { c.fillStyle = GOLD; c.fillRect(13, y, 3, 50); }
        const ic = this.lazyIcon(this.coll.lookFor(cid), 44); c.fillStyle = '#000'; c.fillRect(19, y + 2, 46, 46); if (ic) c.drawImage(ic, 20, y + 3); R.frame(20, y + 3, 44, on ? GOLD : GOLD_D);
        R.text(CHAMPS[cid].name, 72, y + 20, { size: 12, bold: true, color: on ? '#fff' : '#e0d8c8' });
        list.forEach((s, k) => { const id = cid + '.' + s.key, has = this.coll.owns(id); c.fillStyle = has ? SK.RARITY[s.rarity].color : '#2a2a34'; c.fillRect(72 + k * 14, y + 30, 11, 6); c.strokeStyle = '#000'; c.strokeRect(71.5 + k * 14, y + 29.5, 12, 7); });
        R.text(`${owned}/${list.length}`, 172, y + 20, { align: 'right', size: 10, color: '#9aa0b8' });
        R.hit(13, y, 166, 50, 'collChamp', cid);
      });
      const list = SK.SKINS[cs.champ], sid = cs.skin || this.coll.lookFor(cs.champ), sdef = SK.get(sid), owned = this.coll.owns(sid), rar = SK.RARITY[sdef.def.rarity];
      const sx = 192, sy = 56, sw = 596, sh = 335;
      c.fillStyle = '#000'; c.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      const im = this.lazySplash(sid, sw, sh);
      if (im) { if (!owned) c.filter = 'grayscale(0.9) brightness(0.55)'; c.drawImage(im, sx, sy); c.filter = 'none'; }
      else R.text(S.loading, sx + sw / 2, sy + sh / 2, { align: 'center', size: 14, color: '#8a90a8' });
      c.strokeStyle = rar.color; c.lineWidth = 2; c.strokeRect(sx - 1, sy - 1, sw + 2, sh + 2); c.lineWidth = 1;
      const og = c.createLinearGradient(0, sy + sh - 110, 0, sy + sh); og.addColorStop(0, 'rgba(0,0,0,0)'); og.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = og; c.fillRect(sx, sy + sh - 110, sw, 110);
      R.text(this.L(sdef.def.name), sx + 18, sy + sh - 44, { size: 26, bold: true, serif: true, color: '#fff4dc' });
      R.text(`${CHAMPS[cs.champ].name} — ${this.L(CHAMPS[cs.champ].title)}`, sx + 18, sy + sh - 24, { size: 12, serif: true, color: '#d8d0c0' });
      c.drawImage(Icons.rarity(14, rar.color), sx + 18, sy + sh - 17);
      R.text(this.L(rar.name), sx + 38, sy + sh - 6, { size: 11, bold: true, color: rar.color });
      if (!owned) { lock(c, sx + sw / 2, sy + sh / 2 - 30, 44); R.text(S.locked, sx + sw / 2, sy + sh / 2 + 34, { align: 'center', size: 16, bold: true, serif: true, color: '#e8dcc0' }); R.text(S.getInChest, sx + sw / 2, sy + sh / 2 + 54, { align: 'center', size: 11, color: '#b8b0a0' }); }
      else if (this.coll.lookFor(cs.champ) === sid) { c.fillStyle = 'rgba(20,90,40,0.85)'; c.fillRect(sx + sw - 118, sy + 10, 108, 24); c.strokeStyle = '#80e090'; c.strokeRect(sx + sw - 117.5, sy + 10.5, 107, 23); R.text('✓ ' + S.equipped, sx + sw - 64, sy + 27, { align: 'center', size: 12, bold: true, color: '#e8ffe8' }); }
      const tw = 143, th = 80;
      list.forEach((s, k) => {
        const id = cs.champ + '.' + s.key, x = sx + k * (tw + 8), y = 400, has = this.coll.owns(id), on = id === sid, rc = SK.RARITY[s.rarity].color;
        c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, tw + 4, th + 26);
        const t = this.lazySplash(id, tw, th);
        if (t) { if (!has) c.filter = 'grayscale(1) brightness(0.45)'; c.drawImage(t, x, y); c.filter = 'none'; }
        if (!has) lock(c, x + tw / 2, y + th / 2 - 6, 18);
        c.fillStyle = on ? 'rgba(232,192,96,0.28)' : 'rgba(14,16,26,0.95)'; c.fillRect(x, y + th, tw, 22);
        c.fillStyle = rc; c.fillRect(x, y + th, tw, 2);
        R.text(this.L(s.name), x + tw / 2, y + th + 16, { align: 'center', size: 10, bold: on, color: has ? '#f0e8d8' : '#8a8a90' });
        c.strokeStyle = on ? '#ffffff' : rc; c.lineWidth = on ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, tw + 1, th + 23); c.lineWidth = 1;
        R.hit(x, y, tw, th + 22, 'collSkin', id, { custom: { title: this.L(s.name), tag: this.L(SK.RARITY[s.rarity].name), body: has ? '' : S.getInChest } });
      });
      const ay = 516;
      c.fillStyle = 'rgba(6,8,16,0.8)'; c.fillRect(sx, ay, sw, 74); c.strokeStyle = GOLD_D; c.strokeRect(sx + 0.5, ay + 0.5, sw - 1, 73);
      let lx = sx + 14;
      for (const key of ['common', 'epic', 'legendary']) { const r = SK.RARITY[key]; c.drawImage(Icons.rarity(12, r.color), lx, ay + 13); R.text(`${this.L(r.name)} ${r.weight}%`, lx + 17, ay + 23, { size: 10, color: r.color }); lx += 118; }
      const ly = R.wrap(S.chestFromMatch, sx + 14, ay + 42, sw - 230, { size: 10, color: '#b8b0a0', lh: 12 });
      R.text(S.chestDebug, sx + 14, Math.min(ay + 68, ly + 2), { size: 9, color: '#6a7088' });
      if (owned) R.button(sx + sw - 196, ay + 20, 182, 34, this.coll.lookFor(cs.champ) === sid ? S.equipped : S.equip, 'equip', { data: sid, disabled: this.coll.lookFor(cs.champ) === sid, size: 12 });
      else R.button(sx + sw - 196, ay + 20, 182, 34, S.openChest, 'openChest', { disabled: !n, size: 12 });
    },

    drawSelect() {
      const R = this.R, S = this.S, c = this.ctx, sel = this.sel;
      this.drawBg(0.8);
      R.text(S.champSelect, 400, 28, { align: 'center', size: 20, bold: true, serif: true, color: GOLD });
      R.panel(12, 40, 380, 176);
      CHAMP_ORDER.forEach((cid, i) => {
        const x = 26 + (i % 5) * 72, y = 52 + Math.floor(i / 5) * 80, on = sel.champ === cid;
        c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, 68, 68);
        const ic = this.lazyIcon(SK.baseId(cid), 64); if (ic) R.icon(ic, x, y, 64);
        R.frame(x, y, 64, on ? '#ffffff' : GOLD_D); if (on) { c.strokeStyle = GOLD; c.lineWidth = 2; c.strokeRect(x - 3, y - 3, 70, 70); c.lineWidth = 1; }
        R.text(CHAMPS[cid].name, x + 32, y + 76, { align: 'center', size: 9, bold: on, color: on ? '#fff' : '#c8c0a8' });
        R.hit(x, y, 64, 64, 'pick', cid, { text: CHAMPS[cid].name + ' — ' + this.L(CHAMPS[cid].title) });
      });
      R.panel(12, 222, 380, 62, { title: S.role });
      const RL = this.lang === 'ru' ? { any: 'Любая', top: 'Верх', jungle: 'Лес', mid: 'Центр', adc: 'Стрелок', support: 'Поддержка' } : { any: 'Any', top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'Carry', support: 'Support' };
      ['any', 'top', 'jungle', 'mid', 'adc', 'support'].forEach((r, i) => R.button(20 + i * 62, 252, 58, 26, RL[r], 'role', { data: r, active: sel.role === r, size: 9 }));
      R.panel(12, 290, 380, 90, { title: S.spells });
      for (let i = 0; i < 2; i++) { const x = 24 + i * 44, y = 326; c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, 40, 40); R.icon(Icons.spell(sel.spells[i], 36), x, y, 36); R.frame(x, y, 36, sel.spellSlot === i ? '#ffffff' : GOLD_D); R.text('DF'[i], x + 3, y + 11, { size: 10, bold: true, color: '#ffe8a0' }); R.hit(x, y, 36, 36, 'spellSlot', i, { spell: sel.spells[i] }); }
      SPELL_ORDER.forEach((id, i) => { const x = 128 + i * 37, y = 330; R.icon(Icons.spell(id, 30), x, y, 30); R.frame(x, y, 30, sel.spells.includes(id) ? GOLD : '#303030'); R.hit(x, y, 30, 30, 'spellPick', id, { spell: id }); });
      R.panel(12, 386, 380, 58, { title: S.difficulty });
      S.diff.forEach((d, i) => R.button(24 + i * 120, 414, 112, 24, d, 'diff', { data: i, active: sel.diff === i, size: 11 }));
      R.panel(12, 450, 380, 58, { title: S.side });
      R.button(24, 478, 176, 24, S.blue, 'side', { data: 0, active: sel.team === 0 });
      R.button(204, 478, 176, 24, S.red, 'side', { data: 1, active: sel.team === 1 });
      const def = CHAMPS[sel.champ], look = this.coll.lookFor(sel.champ), rar = this.rarityOf(look);
      const sx = 402, sy = 40, sw = 386, sh = 217;
      c.fillStyle = '#000'; c.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      const im = this.lazySplash(look, sw, sh); if (im) c.drawImage(im, sx, sy); else R.text(S.loading, sx + sw / 2, sy + sh / 2, { align: 'center', size: 12, color: '#8a90a8' });
      c.strokeStyle = rar.color; c.lineWidth = 2; c.strokeRect(sx - 1, sy - 1, sw + 2, sh + 2); c.lineWidth = 1;
      const og = c.createLinearGradient(0, sy + sh - 80, 0, sy + sh); og.addColorStop(0, 'rgba(0,0,0,0)'); og.addColorStop(1, 'rgba(0,0,0,0.88)'); c.fillStyle = og; c.fillRect(sx, sy + sh - 80, sw, 80);
      R.text(def.name, sx + 12, sy + sh - 34, { size: 24, bold: true, serif: true, color: GOLD });
      R.text(this.L(def.title) + '   ·   ' + (this.lang === 'ru' ? 'Роли: ' : 'Roles: ') + def.roles.map(r => S.roles[r]).join(', '), sx + 12, sy + sh - 16, { size: 10, color: '#d8d0c0' });
      if (!look.endsWith('.classic')) { const nm = this.skinName(look), w = R.measure(nm, 11, true) + 30; c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(sx + sw - w - 8, sy + 8, w, 22); c.drawImage(Icons.rarity(12, rar.color), sx + sw - w, sy + 13); R.text(nm, sx + sw - 14, sy + 24, { align: 'right', size: 11, bold: true, color: '#fff4dc' }); }
      const pw = this.profile.champ[sel.champ]; if (pw) R.text(`${S.wins}: ${pw.w}  ${S.losses}: ${pw.l}`, sx + sw - 10, sy + sh - 16, { align: 'right', size: 10, color: '#a0c0a0' });
      R.text(S.skin + ':', sx, 276, { size: 11, bold: true, color: '#e8d8a0' });
      const skins = SK.SKINS[sel.champ], tw = 80, th = 45;
      skins.forEach((s, k) => {
        const id = sel.champ + '.' + s.key, x = sx + 42 + k * (tw + 6), y = 266, has = this.coll.owns(id), on = id === look, rc = SK.RARITY[s.rarity].color;
        c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, tw + 4, th + 4);
        const t = this.lazySplash(id, tw, th);
        if (t) { if (!has) c.filter = 'grayscale(1) brightness(0.45)'; c.drawImage(t, x, y); c.filter = 'none'; }
        if (!has) lock(c, x + tw / 2, y + th / 2 - 4, 14);
        c.strokeStyle = on ? '#ffffff' : rc; c.lineWidth = on ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, tw + 1, th + 1); c.lineWidth = 1;
        R.hit(x, y, tw, th, 'skinPick', id, { custom: { title: this.L(s.name), tag: this.L(SK.RARITY[s.rarity].name), body: has ? (on ? S.equipped : S.equip) : S.getInChest } });
      });
      R.panel(402, 322, 386, 196);
      const icons = [-1, 0, 1, 2, 3], cur = this.selAbil == null ? -1 : this.selAbil;
      icons.forEach((s, k) => {
        const x = 416 + k * 48, y = 334;
        c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, 44, 44);
        R.icon(s < 0 ? (this.lazyIcon(look, 40) || this.lazyIcon(SK.baseId(sel.champ), 40)) : Icons.ability(sel.champ, s, 40), x, y, 40);
        R.frame(x, y, 40, cur === s ? '#ffffff' : GOLD_D);
        R.text(s < 0 ? (this.lang === 'ru' ? 'П' : 'P') : 'QWER'[s], x + 3, y + 11, { size: 10, bold: true, color: '#ffe8a0' });
        R.hit(x, y, 40, 40, 'cabil', s);
      });
      const a = cur < 0 ? null : def.abilities[cur];
      const title = a ? `${a.key} — ${this.L(a.name)}` : `${S.passive}: ${this.L(def.passive.name)}`;
      R.text(title, 416, 394, { size: 12, bold: true, color: '#e8d8a0' });
      if (a) R.text(`${S.cooldown}: ${a.cd.join('/')}` + (a.cost[0] ? `   ${S.manaCost}: ${a.cost.join('/')}` : ''), 416, 409, { size: 9, color: '#9ab0d8' });
      R.wrap(a ? this.R.fmtAbility(a, 0) : this.L(def.passive.desc), 416, a ? 425 : 412, 360, { size: 10, color: '#d8d0c0', lh: 13 });
      R.text(this.L(def.lore), 416, 506, { size: 9, color: '#8a8470' });
      R.button(12, 530, 120, 34, S.back, 'back');
      R.button(140, 530, 200, 34, this.lang === 'ru' ? 'Наблюдать за ботами' : 'Spectate bots', 'spectate', { size: 11 });
      R.button(568, 530, 220, 40, S.lockIn + ' — ' + S.start, 'start', { size: 14 });
    },

    drawLoading() {
      const R = this.R, c = this.ctx, g = this.g, S = this.S;
      c.fillStyle = '#05070e'; c.fillRect(0, 0, W, H);
      const gg = c.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, 'rgba(30,50,110,0.35)'); gg.addColorStop(0.5, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(110,30,30,0.35)'); c.fillStyle = gg; c.fillRect(0, 0, W, H);
      R.text(S.loading, 400, 26, { align: 'center', size: 18, bold: true, serif: true, color: GOLD });
      const total = this.loadJobs || 1, done = Math.max(0, total - this.jobs.length), k = Math.min(1, this.loadT / 3) * (done / total);
      for (let t = 0; t < 2; t++) {
        g.champs.filter(ch => ch.team === t).forEach((ch, i) => {
          const x = 26 + i * 152, y = t ? 314 : 40, look = ch.skinId, rar = this.rarityOf(look);
          c.fillStyle = t ? '#2a0e0e' : '#0e1830'; c.fillRect(x - 4, y - 4, 146, 262); c.strokeStyle = ch === this.player ? '#ffe060' : GOLD_D; c.strokeRect(x - 3.5, y - 3.5, 145, 261);
          const im = Art.has('splash', `${look}|138x172|tall`) ? Art.splash(look, 138, 172, 'tall') : null;
          if (im) c.drawImage(im, x, y); else { c.fillStyle = '#10141e'; c.fillRect(x, y, 138, 172); }
          c.fillStyle = rar.color; c.fillRect(x, y + 172, 138, 2);
          const role = S.roles[ch.role] || '', rw = R.measure(role, 9, true) + 10;
          c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x + 3, y + 3, rw, 15); R.text(role, x + 8, y + 14, { size: 9, bold: true, color: '#d8d0c0' });
          R.text(ch.def.name, x + 69, y + 190, { align: 'center', size: 13, bold: true, serif: true, color: GOLD });
          const sn = look.endsWith('.classic') ? this.L(SK.RARITY.base.name) : this.skinName(look);
          R.text(sn, x + 69, y + 204, { align: 'center', size: this.fitSize(sn, 132, 9, false), color: look.endsWith('.classic') ? '#8a8470' : rar.color });
          R.text(ch.name, x + 69, y + 218, { align: 'center', size: 10, color: ch === this.player ? '#ffe060' : '#c8c0a8' });
          R.icon(Icons.spell(ch.spells[0], 20), x + 45, y + 224, 20); R.icon(Icons.spell(ch.spells[1], 20), x + 73, y + 224, 20);
          R.bar(x + 5, y + 248, 128, 4, Math.min(1, k * (0.82 + ((i * 7 + t * 3) % 5) * 0.06)), '#40c040', '#102010');
        });
      }
      R.text(S.helpText[Math.floor(this.t / 3) % S.helpText.length], 400, 592, { align: 'center', size: 10, color: '#8a90a8' });
    },

    drawChest() {
      const R = this.R, S = this.S, c = this.ctx, ch = this.chest; if (!ch) return;
      c.fillStyle = 'rgba(2,3,8,0.82)'; c.fillRect(0, 0, W, H);
      const n = this.coll.chests.length;
      if (ch.phase !== 'reveal') {
        const cx = 400, cy = 270, open = ch.phase === 'opening' && ch.t > 1.02;
        const sh = ch.phase === 'opening' ? Math.min(1, ch.t / 1.2) : 0;
        const rays = ch.phase === 'opening' ? sh : 0.25;
        c.save(); c.translate(cx, cy); c.rotate(this.t * 0.25);
        for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = `rgba(90,200,255,${0.05 + rays * 0.12})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -260); c.lineTo(18, -260); c.closePath(); c.fill(); }
        c.restore();
        const gl = c.createRadialGradient(cx, cy, 0, cx, cy, 150); gl.addColorStop(0, `rgba(80,190,255,${0.25 + rays * 0.4})`); gl.addColorStop(1, 'rgba(80,190,255,0)'); c.fillStyle = gl; c.fillRect(cx - 150, cy - 150, 300, 300);
        const shake = sh * sh * 7, jx = Math.sin(this.t * 60) * shake, jy = Math.cos(this.t * 47) * shake * 0.5, bob = ch.phase === 'ready' ? Math.sin(this.t * 2.2) * 4 : 0;
        c.imageSmoothingEnabled = false;
        c.drawImage(Icons.chest(192, open), cx - 96 + jx, cy - 110 + jy + bob);
        if (ch.phase === 'opening' && ch.t > 1.15) { c.fillStyle = `rgba(255,255,255,${Math.min(1, (ch.t - 1.15) * 5)})`; c.fillRect(0, 0, W, H); }
        R.text(S.chestName, 400, 118, { align: 'center', size: 24, bold: true, serif: true, color: GOLD });
        R.text(S.chestInside, 400, 142, { align: 'center', size: 12, color: '#c8d0e8' });
        if (ch.phase === 'ready') {
          R.text(`${S.chests}: ${n}   ·   ${S.skins}: ${this.coll.ownedCount()} / ${this.coll.total()}`, 400, 418, { align: 'center', size: 11, color: '#9aa0b8' });
          R.button(290, 438, 220, 40, S.openChest, 'chestOpen', { disabled: !n || this.coll.complete(), size: 14, active: n > 0 });
          R.button(330, 488, 140, 30, S.close, 'chestClose', { size: 11 });
          if (this.coll.complete()) R.text(S.allOwned, 400, 540, { align: 'center', size: 12, bold: true, color: '#ffe070' });
        }
        return;
      }
      const got = ch.got;
      if (!got) { R.text(S.allOwned, 400, 280, { align: 'center', size: 18, bold: true, serif: true, color: '#ffe070' }); R.button(330, 320, 140, 32, S.close, 'chestClose'); return; }
      const rar = SK.RARITY[got.def.rarity], e = Math.min(1, ch.t / 0.45), ease = 1 - Math.pow(1 - e, 3);
      c.save(); c.translate(400, 236); c.rotate(-this.t * 0.2);
      for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); c.fillStyle = L.Models.rgba(rar.color, 0.08 + 0.06 * Math.sin(this.t * 2 + i)); c.beginPath(); c.moveTo(0, 0); c.lineTo(-24, -330); c.lineTo(24, -330); c.closePath(); c.fill(); }
      c.restore();
      if (ch.t < 0.3) { c.fillStyle = `rgba(255,255,255,${1 - ch.t / 0.3})`; c.fillRect(0, 0, W, H); }
      const sw = 480 * (0.3 + 0.7 * ease), shh = 270 * (0.3 + 0.7 * ease), x = 400 - sw / 2, y = 236 - shh / 2;
      c.fillStyle = '#000'; c.fillRect(x - 4, y - 4, sw + 8, shh + 8);
      c.imageSmoothingEnabled = true; c.drawImage(Art.splash(got.id, 480, 270), x, y, sw, shh); c.imageSmoothingEnabled = false;
      c.strokeStyle = rar.color; c.lineWidth = 3; c.strokeRect(x - 2.5, y - 2.5, sw + 5, shh + 5); c.lineWidth = 1;
      if (e >= 1) {
        const a = Math.min(1, (ch.t - 0.45) / 0.3);
        c.globalAlpha = a;
        R.text(S.newSkin, 400, 70, { align: 'center', size: 16, bold: true, serif: true, color: '#e8dcc0' });
        c.drawImage(Icons.rarity(16, rar.color), 392, 398);
        R.text(this.L(rar.name), 400, 430, { align: 'center', size: 12, bold: true, color: rar.color });
        R.text(this.L(got.def.name), 400, 460, { align: 'center', size: 26, bold: true, serif: true, color: '#fff4dc' });
        R.text(`${CHAMPS[got.cid].name} — ${this.L(CHAMPS[got.cid].title)}`, 400, 480, { align: 'center', size: 12, color: '#c8c0a8' });
        c.globalAlpha = 1;
        const equipped = this.coll.lookFor(got.cid) === got.id;
        R.button(166, 500, 200, 36, equipped ? S.equipped : S.equip, 'chestEquip', { data: got.id, disabled: equipped, size: 12 });
        R.button(376, 500, 150, 36, `${S.openMore} (${n})`, 'chestNext', { disabled: !n || this.coll.complete(), size: 12 });
        R.button(536, 500, 100, 36, S.done, 'chestClose', { size: 12 });
      }
    },

    drawToast() {
      const t = this.toast; if (!t || t.t > 2.6) return;
      const R = this.R, c = this.ctx, a = Math.min(1, (2.6 - t.t) / 0.5, t.t / 0.15), w = R.measure(t.text, 12, true) + 34;
      c.globalAlpha = a;
      c.fillStyle = 'rgba(8,10,20,0.92)'; c.fillRect(400 - w / 2, 54, w, 28); c.strokeStyle = t.color; c.strokeRect(400 - w / 2 + 0.5, 54.5, w - 1, 27);
      R.text(t.text, 400, 73, { align: 'center', size: 12, bold: true, color: t.color });
      c.globalAlpha = 1;
    },

    clientClick(h) {
      const id = h.id;
      switch (id) {
        case 'collection': this.screen = 'collection'; this.collSel = { champ: this.sel.champ, skin: null }; return true;
        case 'collChamp': this.collSel = { champ: h.data, skin: null }; return true;
        case 'collSkin': this.collSel.skin = h.data; return true;
        case 'equip': case 'chestEquip': if (this.coll.select(h.data)) { this.saveColl(); this.say2(this.S.skinSelected); this.audio.play('buy'); } return true;
        case 'skinPick': if (this.coll.owns(h.data)) { this.coll.select(h.data); this.saveColl(); } else this.say2(this.S.getInChest, '#ffb070'); return true;
        case 'cabil': this.selAbil = h.data; return true;
        case 'openChest': this.openChestOverlay(); return true;
        case 'chestOpen': case 'chestNext': if (id === 'chestNext') this.chest = { phase: 'ready', t: 0, got: null, from: this.chest && this.chest.from }; this.startChestOpen(); return true;
        case 'chestClose': this.closeChest(); return true;
      }
      return false;
    }
  });

})(globalThis.LoL98 = globalThis.LoL98 || {});
