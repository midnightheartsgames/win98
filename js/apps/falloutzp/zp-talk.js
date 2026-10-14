(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => Z.esc(s);

  U.startDialogue = function (actor, treeId, node) {
    const g = this.game;
    const tid = treeId || (actor && (typeof actor.dlg === 'function' ? actor.dlg(g) : actor.dlg));
    if (!tid || !Z.DIALOGUES[tid]) { if (actor) g.msg(actor.name + ' не хочет разговаривать.', 'info'); return; }
    const d = new Z.Dialogue(g, tid, actor).start(node);
    if (actor && actor.ai) actor.ai.talking = true;
    if (actor) { g.flags['met_' + (actor.npcId || actor.id)] = true; if (actor.faction) g.flags['met_' + actor.faction] = true; }
    const el = document.createElement('div');
    el.className = 'zp-talk';
    el.innerHTML = '<div class="npc zp-crt"><div class="who"></div><div class="txt"></div></div><div class="opts zp-crt"><div class="list"></div><div class="hint">1-9 / ↑↓ Enter — ответ</div></div>';
    el.addEventListener('mousedown', e => e.stopPropagation());
    const panel = { el, escClose: false };
    let sel = 0;
    this.talk = { d, actor, panel };
    const finish = () => {
      if (actor && actor.ai) actor.ai.talking = false;
      if (actor) { actor.mouth = 0; actor.talkAnim = 0; actor.talkT = 0; }
      this.talk = null;
      this.closePanel(panel);
      this.stopSpeech();
      if (d.pending.includes('trade')) this.openBarter(actor);
      g.ev.emit('dialogueEnd', { actor, tree: tid });
    };
    const mark = () => el.querySelectorAll('.row').forEach((r, i) => r.classList.toggle('sel', i === sel));
    const pick = () => {
      if (!d.options[sel]) return;
      if (this.audio) this.audio.uiSound('click');
      d.choose(sel);
      sel = 0;
      render();
    };
    const render = () => {
      if (d.ended || !d.node) { finish(); return; }
      const lines = d.lines;
      el.querySelector('.who').textContent = (lines[0] && lines[0].who) || (actor ? actor.name : '');
      el.querySelector('.txt').textContent = lines.map(l => l.text).join('\n');
      sel = Z.clamp(sel, 0, d.options.length - 1);
      el.querySelector('.list').innerHTML = d.options.map((o, i) => '<div class="row' + (i === sel ? ' sel' : '') + (o.pass ? '' : ' fail') + '" data-i="' + i + '"><span class="nm">' + (i + 1) + '. ' + esc(o.text) + '</span></div>').join('');
      el.querySelectorAll('.row').forEach(r => {
        r.addEventListener('mouseenter', () => { sel = +r.dataset.i; mark(); });
        r.addEventListener('click', () => { sel = +r.dataset.i; pick(); });
      });
      this.speak(lines.map(l => l.text).join(' '), actor);
    };
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = Math.max(0, sel - 1); mark(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = Math.min(d.options.length - 1, sel + 1); mark(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') { pick(); return true; }
      const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
      if (m && d.options[+m[2] - 1]) { sel = +m[2] - 1; pick(); return true; }
      if (e.code === 'Escape') { const last = d.options.findIndex(o => o.o.to === 'END'); if (last >= 0) { sel = last; pick(); } return true; }
      return false;
    };
    this.openPanel(panel);
    render();
  };

  U.speak = function (text, actor) {
    this.stopSpeech();
    if (actor) actor.talkT = Math.min(12, 1.2 + text.length * 0.055);
    if (!this.settings.tts || typeof speechSynthesis === 'undefined' || !text) return;
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/\[[^\]]*\]/g, ''));
      u.lang = 'ru-RU';
      const voices = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
      const fem = actor && actor.look && actor.look.sex === 'f';
      const pickV = voices.find(v => fem ? /irina|svetlana|elena|female/i.test(v.name) : /pavel|dmitry|male/i.test(v.name)) || voices[0];
      if (pickV) u.voice = pickV;
      u.rate = (actor && actor.voiceRate) || 1.02;
      u.pitch = (actor && actor.voicePitch) || (fem ? 1.15 : 0.9);
      u.volume = this.settings.volume;
      u.onend = () => { if (actor) actor.talkT = 0; };
      speechSynthesis.speak(u);
    } catch (e) {
      this.ttsBroken = true;
    }
  };

  U.stopSpeech = function () {
    try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch (e) { this.ttsBroken = true; }
  };

  U.talkCamera = function (dt) {
    const t = this.talk;
    if (!t || !t.actor) return false;
    const a = t.actor, c = this.cam;
    const sc = (a.look && a.look.scale) || 1;
    const head = a.pose && a.pose.def.index.head !== undefined ? a.pose.bonePos('head') : [a.x, a.y + (a.height || 1.7) * 0.9, a.z];
    const hy = head[1] + 0.07 * sc;
    const fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
    const rx = Math.cos(a.yaw), rz = Math.sin(a.yaw);
    const dist = 0.95 * sc * (a.big ? 1.6 : 1);
    const tx = head[0] + fx * dist + rx * 0.2, tz = head[2] + fz * dist + rz * 0.2;
    const k = Math.min(1, dt * 4);
    c.x = Z.lerp(c.x, tx, k); c.y = Z.lerp(c.y, hy, k); c.z = Z.lerp(c.z, tz, k);
    c.yaw = Z.yawOf(head[0] - c.x, head[2] - c.z);
    c.pitch = Math.atan2(hy - 0.03 - c.y, Math.hypot(head[0] - c.x, head[2] - c.z));
    c.fov = 0.75;
    if (a.talkT > 0) { a.talkT -= dt; a.mouth = 0.08 + Math.abs(Math.sin(this.r.time * 13)) * 0.12; a.talkAnim = 0.6; } else { a.mouth = 0; a.talkAnim = 0; }
    return true;
  };

  U.vendorPrice = function (e, buying, vendor) {
    const g = this.game, p = g.player;
    const base = Z.itemValue(e.id, e.cond);
    const b = p.sheet.skill('barter') / 100;
    const rep = vendor && vendor.faction && g.rep[vendor.faction] ? g.repLevel(vendor.faction).v : 0;
    const repK = 1 - Z.clamp(rep, -3, 3) * 0.033;
    if (buying) return Math.max(1, Math.round(base * Z.lerp(1.6, 1.15, b) * repK));
    return Math.max(0, Math.floor(base * Z.lerp(0.35, 0.8, b) / repK));
  };

  U.openBarter = function (vendor) {
    const g = this.game, p = g.player;
    if (!vendor || !vendor.vendor) { g.msg('С этим человеком не поторгуешь.', 'warn'); return; }
    const V = vendor.vendor;
    g.restockVendor(vendor);
    const basket = { mine: new Map(), theirs: new Map() };
    const el = this.panelEl('zp-xfer zp-barter', '<h2>ТОРГОВЛЯ: ' + esc(vendor.name.toUpperCase()) + '</h2><div class="cols"><div class="col" data-c="0"><div class="hd"></div><div class="list scroll"></div></div><div class="col" data-c="1"><div class="hd"></div><div class="list scroll"></div></div></div><div class="info"></div><div class="deal"><span class="bal"></span><span><span class="btn" data-k="ok">Принять (R)</span><span class="btn" data-k="no">Выход</span></span></div>');
    const panel = { el };
    let side = 1;
    const sel = [0, 0];
    let lists = [[], []];
    const total = () => {
      let give = 0, get = 0;
      for (const [e, n] of basket.mine) give += this.vendorPrice(e, false, vendor) * n;
      for (const [e, n] of basket.theirs) get += this.vendorPrice(e, true, vendor) * n;
      return { give, get, bal: give - get };
    };
    const info = () => {
      const e = lists[side][sel[side]];
      el.querySelector('.info').innerHTML = e ? Z.itemInfoRow(e, g) : '';
      [0, 1].forEach(k => el.querySelectorAll('.col[data-c="' + k + '"] .row').forEach((r, i) => r.classList.toggle('sel', k === side && i === sel[k])));
    };
    const toggle = () => {
      const e = lists[side][sel[side]];
      if (!e) return;
      const bk = side ? basket.theirs : basket.mine;
      if (bk.get(e)) { bk.delete(e); render(); return; }
      if (e.n > 1) this.askQty(Z.item(e.id).name, e.n, n => { bk.set(e, n); render(); });
      else { bk.set(e, 1); render(); }
    };
    const render = () => {
      lists = [Z.sortInv(p.inv.filter(e => !Z.item(e.id).currency && !Z.item(e.id).quest)), Z.sortInv(V.inv)];
      ['ВЫ (' + p.count('talon') + ' т.)', vendor.name.toUpperCase() + ' (' + V.talons + ' т.)'].forEach((h, k) => {
        const colEl = el.querySelector('.col[data-c="' + k + '"]');
        colEl.classList.toggle('active', side === k);
        colEl.querySelector('.hd').textContent = h;
        sel[k] = Z.clamp(sel[k], 0, Math.max(0, lists[k].length - 1));
        const bk = k ? basket.theirs : basket.mine;
        colEl.querySelector('.list').innerHTML = lists[k].map((e, i) => {
          const picked = bk.get(e) || 0;
          const eq = !k && Object.values(p.equip).includes(e);
          return '<div class="row' + (i === sel[k] && side === k ? ' sel' : '') + (picked ? ' pick' : '') + (eq ? ' eq' : '') + '" data-i="' + i + '"><span class="nm">' + Z.iconHTML(e.id, 20) + (picked ? '[' + picked + '] ' : '') + esc(Z.itemLabel(e)) + '</span><span class="price">' + this.vendorPrice(e, k === 1, vendor) + '</span></div>';
        }).join('') || '<div class="dim" style="padding:6px">Пусто</div>';
        colEl.querySelectorAll('.row').forEach(r => {
          r.addEventListener('mouseenter', () => { side = k; sel[k] = +r.dataset.i; info(); });
          r.addEventListener('click', () => { side = k; sel[k] = +r.dataset.i; toggle(); });
        });
      });
      const t = total();
      el.querySelector('.bal').innerHTML = 'Отдаёте: ' + t.give + ' т. · получаете: ' + t.get + ' т. · ' + (t.bal >= 0 ? 'вам доплатят <span class="grn">' + t.bal + '</span>' : 'вы доплачиваете <span class="' + (p.count('talon') >= -t.bal ? '' : 'red') + '">' + (-t.bal) + '</span>');
      info();
    };
    const accept = () => {
      const t = total();
      if (!basket.mine.size && !basket.theirs.size) return;
      if (t.bal < 0 && p.count('talon') < -t.bal) { g.msg('Не хватает талонов.', 'warn'); return; }
      if (t.bal > 0 && V.talons < t.bal) { g.msg(vendor.name + ': «У меня столько талонов нет».', 'warn'); return; }
      for (const [e, n] of basket.mine) {
        const d = Z.item(e.id);
        if (Object.values(p.equip).includes(e)) { if (d.cat === 'weapon') p.equip.weapon = null; else p.unequip(d.slot); }
        if (d.stack) { g.addToInv(V.inv, e.id, n); p.take(e.id, n); } else { V.inv.push(Object.assign({}, e, { n: 1 })); p.removeEntry(e); }
      }
      for (const [e, n] of basket.theirs) {
        const d = Z.item(e.id);
        if (d.stack) { p.give(e.id, n); e.n -= n; if (e.n <= 0) V.inv.splice(V.inv.indexOf(e), 1); }
        else { const ne = p.give(e.id, 1, e.cond); if (e.loaded) ne.loaded = e.loaded; V.inv.splice(V.inv.indexOf(e), 1); }
      }
      if (t.bal > 0) { p.give('talon', t.bal); V.talons -= t.bal; } else if (t.bal < 0) { p.take('talon', -t.bal); V.talons += -t.bal; }
      basket.mine.clear(); basket.theirs.clear();
      g.ev.emit('trade', { vendor: vendor.id, bal: t.bal });
      render();
    };
    el.querySelector('[data-k=ok]').addEventListener('click', accept);
    el.querySelector('[data-k=no]').addEventListener('click', () => this.closePanel(panel));
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel[side] = Math.max(0, sel[side] - 1); info(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel[side] = Math.min(lists[side].length - 1, sel[side] + 1); info(); return true; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { side = 0; render(); return true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Tab') { side = e.code === 'Tab' ? 1 - side : 1; render(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { toggle(); return true; }
      if (e.code === 'KeyR' || e.code === 'Space') { accept(); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  Z.Game.prototype.restockVendor = function (a) {
    const V = a.vendor;
    if (!V) return;
    const day = Math.floor(this.time / 1440 / (V.days || 3));
    if (V.stockDay === day) return;
    V.stockDay = day;
    const R = Z.rng(Z.hashStr(a.id) + day * 31);
    const keep = (V.inv || []).filter(e => e.sold);
    V.inv = keep;
    for (const [id, pr, lo, hi] of V.stock || []) if (R() < pr) this.addToInv(V.inv, id, lo + Math.floor(R() * (hi - lo + 1)), Z.item(id).stack ? undefined : 0.55 + R() * 0.4);
    V.talons = Math.max(V.talons || 0, V.cash || 300);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
