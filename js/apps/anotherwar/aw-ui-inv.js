(function (AW) {
  'use strict';

  const el = (t, c, p, s) => AW.el(t, c, p, s);
  const I = AW.Items;
  const T = k => (AW.TEXT && AW.TEXT[k]) || '';
  const CELL = 47;
  const PACK = [220, 47];
  const GROUND = [12, 35];
  const BELT = [13, 403];
  const DOLL = [95, 200];
  const DOLL_RECT = [0, 20, 214, 440];
  const DOLL_CLASS = { KNIFE: 'knife', PISTOL: 'pistol', RIFLE: 'rifle', ARIFLE: 'arifle', FLAMER: 'arifle', MPISTOL: 'mpistol', HEAVY: 'heavy' };
  const SLOT_OF_GRAB = { 3: 'helm', 4: 'torso', 5: 'pants', 6: 'boots', 7: 'waist', 8: 'neck', 9: 'helm', 10: 'armor', 11: 'hands', 12: 'goggles' };
  const dollCache = new Map();

  function framePixels(bmp, f) {
    const c = document.createElement('canvas');
    c.width = f[2];
    c.height = f[3];
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
    return g.getImageData(0, 0, f[2], f[3]).data;
  }

  function dollPixels(key) {
    let p = dollCache.get(key);
    if (p) return p;
    const f = AW.Assets.frame(key, 0, 0);
    const deep = AW.Assets.gfxMeta(key).depth;
    p = Promise.all([AW.Assets.bitmap('gfx/' + key + '.webp'), deep ? AW.Assets.bitmap('gfx/' + key + '.z.webp') : null]).then(([rgb, zmap]) => {
      const zc = zmap ? framePixels(zmap, f) : null;
      const z = new Uint16Array(f[2] * f[3]);
      if (zc) for (let i = 0; i < z.length; i++) z[i] = zc[i * 4] << 8 | zc[i * 4 + 1];
      return { f, rgba: framePixels(rgb, f), z };
    });
    dollCache.set(key, p);
    p.catch(() => dollCache.delete(key));
    return p;
  }

  function composeDoll(canvas, layers) {
    const W = DOLL_RECT[2], H = DOLL_RECT[3];
    const g = canvas.getContext('2d');
    const out = g.createImageData(W, H);
    const o = out.data;
    const depth = new Int32Array(W * H).fill(-1);
    const owner = new Int8Array(W * H).fill(-1);
    layers.forEach((L, li) => {
      const f = L.f, fw = f[2], src = L.rgba;
      const ox = DOLL[0] - f[4] - DOLL_RECT[0], oy = DOLL[1] - f[5] - DOLL_RECT[1];
      for (let y = 0; y < f[3]; y++) {
        const Y = oy + y;
        if (Y < 0 || Y >= H) continue;
        for (let x = 0; x < fw; x++) {
          const X = ox + x;
          if (X < 0 || X >= W) continue;
          const s = y * fw + x, a = src[s * 4 + 3], d = Y * W + X;
          if (!a || L.z[s] < depth[d]) continue;
          const k = d * 4, da = o[k + 3] * (255 - a) / 255, na = a + da;
          o[k] = (src[s * 4] * a + o[k] * da) / na;
          o[k + 1] = (src[s * 4 + 1] * a + o[k + 1] * da) / na;
          o[k + 2] = (src[s * 4 + 2] * a + o[k + 2] * da) / na;
          o[k + 3] = na;
          if (a >= 128) { depth[d] = L.z[s]; owner[d] = li; }
        }
      }
    });
    g.putImageData(out, 0, 0);
    return owner;
  }

  function heroLooks(a) {
    if (a.id === 'Johann') return { head: 'fleja', torso: 'fleja', pants: '', boots: '', belt: '' };
    const race = { strongman: 'hero1', thief: 'hero3', intel: 'hero2' }[a.cls] || 'hero1';
    return { head: race, torso: 'hero1', pants: 'hero1', boots: 'hero1', belt: 'parciany' };
  }

  function wearSkin(it) {
    const s = String(it.wearINV || '').trim();
    if (!s || /^--/.test(s)) return '';
    return s.toLowerCase();
  }

  AW.InvUI = {
    open(ui, o) {
      const game = ui.game, W = game.W;
      if (!W || !W.hero) return;
      if (ui.screen && ui.screen.kind === 'inv') {
        if (o.tab) AW.InvUI.setTab(ui.screen, o.tab);
        return;
      }
      if (ui.screen) return;
      const h = W.hero;
      h.stopWalk();
      h.seq.reset();
      const scr = { kind: 'inv', ui, game, W, who: o.who && o.who.team === 1 ? o.who : h, tab: o.tab || 'pack', left: o.trade ? 'trade' : 'doll', trade: o.trade || null };
      ui.screen = scr;
      ui.screenPause = true;
      ui.tip('');
      ui.setCursor('CURSOR');
      scr.el = el('div', 'aw-inv', ui.layer);
      scr.el.addEventListener('mousedown', ev => ev.stopPropagation());
      scr.el.addEventListener('contextmenu', ev => ev.preventDefault());
      scr.el.addEventListener('mousemove', ev => AW.InvUI.hover(scr, ui.toStage(ev)));
      scr.onKey = ev => AW.InvUI.onKey(scr, ev);
      ui.audio.play('menu/page-turnover2');
      ui.audio.loop(scr.fan = { snd: 'locations/wentylator4_loop', vol: 40, global: true, active: 1 });
      AW.InvUI.build(scr);
    },

    close(ui) {
      const scr = ui.screen;
      if (!scr) return;
      if (scr.close) { scr.close(); return; }
      if (scr.kind !== 'inv') return;
      if (scr.drag) AW.InvUI.cancelDrag(scr);
      if (scr.fan) ui.audio.stopLoop(scr.fan);
      if (scr.statCommit) scr.statCommit();
      scr.el.remove();
      ui.screen = null;
      ui.screenPause = false;
      ui.tip('');
      if (scr.trade) scr.W.closeTrade();
      ui.audio.play('menu/page-turnover1');
      if (scr.W.hero) scr.W.hero.idle();
    },

    onKey(scr, ev) {
      const k = ev.code;
      if (k === 'Escape' || (k === 'KeyI' && scr.tab === 'pack') || (k === 'KeyS' && scr.tab === 'stat') || (k === 'KeyN' && scr.tab === 'diary') || (k === 'KeyM' && scr.tab === 'map')) { AW.InvUI.close(scr.ui); return true; }
      if (k === 'KeyI') { AW.InvUI.setTab(scr, 'pack'); return true; }
      if (k === 'KeyS') { AW.InvUI.setTab(scr, 'stat'); return true; }
      if (k === 'KeyN') { AW.InvUI.setTab(scr, 'diary'); return true; }
      if (k === 'KeyM') { AW.InvUI.setTab(scr, 'map'); return true; }
      return true;
    },

    setTab(scr, tab) {
      if (tab === 'diary' && !scr.W.flag('diary') && !scr.W.state.notes.length) return;
      if (scr.statCommit && tab !== 'stat') { scr.statCommit(); scr.statCommit = null; }
      scr.tab = tab;
      scr.ui.audio.play('menu/page-turnover2');
      AW.InvUI.build(scr);
    },

    build(scr) {
      const E = scr.el;
      E.innerHTML = '';
      const who = scr.who;
      AW.spr('gui/inventory/invpanel-sk1', 0, 0, E, 214, 471);
      const leftKey = scr.left === 'doll' ? 'gui/inventory/invzakpostac-sk1' : 'gui/inventory/invzakziemia-sk1';
      AW.spr(leftKey, 0, 0, E, 0, 0);
      const topKey = { pack: 'invzakplecak', stat: 'invzakstat', diary: 'invzakdziennik', map: 'invzakmapa' }[scr.tab];
      AW.spr('gui/inventory/' + topKey + '-sk1', 0, 0, E, 214, 0);
      const bgKey = scr.tab === 'pack' ? 'invtloplecak' + Math.max(3, Math.min(9, who.inv.rows)) : { stat: 'invtlostat', diary: 'invtlodziennik', map: 'invtlomapa' }[scr.tab];
      AW.spr('gui/inventory/' + bgKey + '-sk1', 0, 0, E, 214, 47);
      const tabs = [['pack', 'Pack', 272], ['stat', 'Statistics', 370], ['diary', 'Diary', 468], ['map', 'Map', 567]];
      const tabAreas = { pack: [220, 3, 319, 21], stat: [320, 3, 417, 21], diary: [418, 3, 515, 21], map: [516, 3, 626, 21] };
      for (const [id, key, cx] of tabs) {
        const t = el('div', 'aw-tab' + (scr.tab === id ? ' on' : ''), E, { left: (cx - 50) + 'px', top: '6px', width: '100px' });
        t.textContent = T(key) || key;
        const a = tabAreas[id];
        const hit = el('div', 'aw-btnarea aw-hit', E, { left: a[0] + 'px', top: a[1] + 'px', width: (a[2] - a[0]) + 'px', height: (a[3] - a[1]) + 'px' });
        if (id === 'diary' && !scr.W.flag('diary') && !scr.W.state.notes.length) t.classList.add('off');
        hit.addEventListener('mousedown', ev => { ev.stopPropagation(); AW.InvUI.setTab(scr, id); });
      }
      const lt = el('div', 'aw-tab' + (scr.left === 'doll' ? ' on' : ''), E, { left: '8px', top: '6px', width: '100px' });
      lt.textContent = who === scr.W.hero ? who.name : who.name;
      const rt = el('div', 'aw-tab' + (scr.left !== 'doll' ? ' on' : ''), E, { left: '107px', top: '6px', width: '100px' });
      rt.textContent = scr.trade ? scr.trade.name : (T('Ground') || 'Земля');
      const h1 = el('div', 'aw-btnarea aw-hit', E, { left: '4px', top: '3px', width: '99px', height: '18px' });
      h1.addEventListener('mousedown', ev => { ev.stopPropagation(); scr.left = 'doll'; AW.InvUI.build(scr); });
      const h2 = el('div', 'aw-btnarea aw-hit', E, { left: '104px', top: '3px', width: '109px', height: '18px' });
      h2.addEventListener('mousedown', ev => { ev.stopPropagation(); scr.left = scr.trade ? 'trade' : 'ground'; AW.InvUI.build(scr); });
      AW.InvUI.buildTeam(scr);
      scr.fanEl = AW.spr('gui/inventory/wiatrak', 0, 0, E, 589, 487);
      scr.fanT = 0;
      AW.InvUI.buildButtons(scr);
      if (scr.left === 'doll') AW.InvUI.buildDoll(scr);
      else AW.InvUI.buildGround(scr);
      scr.content = el('div', 'aw-inv-content', E);
      if (scr.tab === 'pack') AW.InvUI.buildPack(scr);
      else if (scr.tab === 'stat') AW.StatUI.build(scr);
      else if (scr.tab === 'diary') AW.StatUI.diary(scr);
      else if (scr.tab === 'map') AW.StatUI.map(scr);
      scr.descEl = el('div', 'aw-desc', E);
      if (!scr.fanTimer) scr.fanTimer = setInterval(() => {
        if (!scr.el.isConnected) { clearInterval(scr.fanTimer); return; }
        scr.fanT++;
        AW.setSpr(scr.fanEl, 'gui/inventory/wiatrak', 0, scr.fanT % 35);
      }, 50);
    },

    buildButtons(scr) {
      const acts = [
        [697, 482, 746, 506, 'PanInventory', () => AW.InvUI.setTab(scr, 'pack')],
        [747, 483, 797, 508, 'PanStatictics', () => AW.InvUI.setTab(scr, 'stat')],
        [700, 508, 749, 534, 'PanMap', () => AW.InvUI.setTab(scr, 'map')],
        [746, 508, 796, 533, 'PanOptions', () => { AW.InvUI.close(scr.ui); AW.MenuUI.options(scr.ui); }],
        [698, 533, 747, 559, 'PanSaveGame', () => { AW.InvUI.close(scr.ui); AW.MenuUI.saveLoad(scr.ui, false); }],
        [742, 533, 793, 559, 'PanLoadGame', () => { AW.InvUI.close(scr.ui); AW.MenuUI.saveLoad(scr.ui, true); }],
        [747, 569, 796, 596, 'PanExit', () => AW.InvUI.close(scr.ui)]
      ];
      for (const a of acts) {
        const d = el('div', 'aw-btnarea aw-hit', scr.el, { left: a[0] + 'px', top: a[1] + 'px', width: (a[2] - a[0]) + 'px', height: (a[3] - a[1]) + 'px' });
        d.addEventListener('mousedown', ev => { ev.stopPropagation(); scr.ui.audio.play('menu/click1'); a[5](); });
        d.addEventListener('mouseenter', () => { scr.btnTip = T(a[4]); });
        d.addEventListener('mouseleave', () => { scr.btnTip = ''; });
      }
    },

    buildTeam(scr) {
      const W = scr.W;
      const team = [W.hero].concat(W.teamMembers());
      team.forEach((m, i) => {
        const x = 230 + i * 70;
        const key = m === W.hero ? 'gui/inventory/zygmunt' + ({ strongman: 'strongman', thief: 'thief', intel: 'inteligent' }[m.cls] || 'strongman') : 'gui/inventory/johann';
        const p = AW.spr(key, 0, 0, scr.el, x, 490, { cls: 'aw-hit' });
        if (m !== scr.who) p.style.opacity = '0.5';
        const hp = el('div', 'aw-team-hp', scr.el, { left: x + 'px', top: '574px', width: '70px' });
        hp.textContent = Math.floor(m.hp) + '/' + Math.floor(m.hpMax);
        p.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          if (scr.trade) return;
          if (scr.statCommit) { scr.statCommit(); scr.statCommit = null; }
          scr.who = m;
          AW.InvUI.build(scr);
        });
      });
    },

    itemEl(parent, it, x, y, kind, opts) {
      const ic = AW.Assets.itemIcon(it, kind || 'inv');
      if (!ic) return null;
      const d = AW.spr(ic.key, ic.anim, 0, parent, x, y, Object.assign({ cls: 'aw-item' }, opts || {}));
      d._item = it;
      if (I.isAmmo(it) || it.amount > 1 || I.isMoney(it)) {
        const a = el('div', 'aw-amount', d);
        a.textContent = String(it.amount);
      }
      if (I.isWeapon(it) && it.link && !I.isGrenade(it) && !I.isMine(it)) {
        const a = el('div', 'aw-amount', d);
        a.textContent = it.link.amount + '/' + it.link.maxamount;
      }
      return d;
    },

    buildPack(scr) {
      const C0 = scr.content, who = scr.who, inv = who.inv;
      const w = el('div', 'aw-weight', C0);
      const kg = inv.weight(), max = who.maxWeight();
      w.textContent = AW.label('WagaEkwipunku', 'Вес снаряжения') + ': ' + kg + '/' + max;
      if (kg > max) {
        const o = el('span', 'aw-red', w);
        o.textContent = '   ' + (T('PackPrzeciazenie') || 'Перегрузка!');
      }
      const grid = el('div', 'aw-grid aw-hit', C0, { left: PACK[0] + 'px', top: PACK[1] + 'px', width: (12 * CELL) + 'px', height: (inv.rows * CELL) + 'px' });
      grid.dataset.zone = 'pack';
      for (const p of inv.pack) {
        const sz = I.maskSize(p.item);
        const x = PACK[0] + p.x * CELL, y = PACK[1] + p.y * CELL;
        const d = AW.InvUI.itemEl(C0, p.item, x, y, 'inv', { centerBox: [sz[0] * CELL, sz[1] * CELL] });
        if (d) AW.InvUI.bindItem(scr, d, p.item, 'pack');
      }
      if (scr.trade) {
        const m = el('div', 'aw-trade-cash', C0);
        m.textContent = 'У вас: ' + scr.W.hero.inv.cash() + ' фр.   У торговца: ' + scr.trade.inv.cash() + ' фр.';
      }
    },

    buildDoll(scr) {
      const E = scr.el, who = scr.who, wear = who.inv.wear;
      const looks = heroLooks(who);
      const weapon = who.inv.hand && I.isWeapon(who.inv.hand) ? who.inv.hand : null;
      const wc = weapon ? DOLL_CLASS[I.wclass(weapon)] || 'empty' : 'empty';
      const layers = [];
      const add = (part, skin, item) => {
        if (!skin) return;
        let key = 'gui/wear/' + wc + '.' + part + '.' + skin;
        if (!AW.Assets.gfxMeta(key)) key = 'gui/wear/empty.' + part + '.' + skin;
        if (AW.Assets.gfxMeta(key)) layers.push({ key, item: item || null });
      };
      add('head', looks.head, null);
      add('torso', wear.torso ? wearSkin(wear.torso) || looks.torso : looks.torso, wear.torso);
      add('pants', wear.pants ? wearSkin(wear.pants) || looks.pants : looks.pants, wear.pants);
      add('boots', wear.boots ? wearSkin(wear.boots) || looks.boots : looks.boots, wear.boots);
      add('belt', wear.waist ? wearSkin(wear.waist) || looks.belt : looks.belt, wear.waist);
      if (wear.neck) add('wisior', wearSkin(wear.neck), wear.neck);
      if (wear.helm) add('helm', wearSkin(wear.helm), wear.helm);
      if (wear.armor) add('armor', wearSkin(wear.armor), wear.armor);
      if (wear.hands) add('hands', wearSkin(wear.hands), wear.hands);
      if (wear.goggles) add('goggles', wearSkin(wear.goggles), wear.goggles);
      if (weapon) add('weapon', String(weapon.name || '').toLowerCase(), weapon);
      const canvas = el('canvas', 'aw-dollcanvas', E, { left: DOLL_RECT[0] + 'px', top: DOLL_RECT[1] + 'px' });
      canvas.width = DOLL_RECT[2];
      canvas.height = DOLL_RECT[3];
      const doll = scr.doll = { layers, owner: null };
      Promise.all(layers.map(L => dollPixels(L.key))).then(px => {
        if (canvas.isConnected) doll.owner = composeDoll(canvas, px);
      }).catch(() => {});
      const box = el('div', 'aw-doll aw-hit', E, { left: '20px', top: '39px', width: '185px', height: '339px' });
      box.dataset.zone = 'doll';
      box.addEventListener('mousemove', ev => {
        scr.hoverItem = AW.InvUI.dollItemAt(scr, scr.ui.toStage(ev));
        scr.hoverFrom = 'wear';
      });
      box.addEventListener('mouseleave', () => { scr.hoverItem = null; });
      box.addEventListener('mousedown', ev => {
        const it = AW.InvUI.dollItemAt(scr, scr.ui.toStage(ev));
        if (!it) return;
        ev.stopPropagation();
        if (ev.button === 2) AW.InvUI.useItem(scr, it, 'wear');
        else if (ev.button === 0) AW.InvUI.startDrag(scr, it, 'wear', ev);
      });
      const onDoll = new Set(layers.map(L => L.item));
      const eq = el('div', 'aw-eqlist', E);
      const slots = [['hand', who.inv.hand]].concat(Object.keys(wear).map(k => [k, wear[k]]));
      let y = 0;
      for (const [slot, it] of slots) {
        if (!it || onDoll.has(it)) continue;
        const r = el('div', 'aw-eqrow aw-hit', eq, { top: y + 'px' });
        r.textContent = (slot === 'hand' ? 'Рука' : (I.SLOT_NAMES[slot] || slot)) + ': ' + I.displayName(it);
        r.addEventListener('mousedown', ev => { ev.stopPropagation(); AW.InvUI.startDrag(scr, it, 'wear', ev); });
        r.addEventListener('mouseenter', () => { scr.hoverItem = it; });
        r.addEventListener('mouseleave', () => { if (scr.hoverItem === it) scr.hoverItem = null; });
        y += 13;
      }
      const belt = el('div', 'aw-grid aw-hit', E, { left: BELT[0] + 'px', top: BELT[1] + 'px', width: (4 * CELL) + 'px', height: (2 * CELL) + 'px' });
      belt.dataset.zone = 'belt';
      for (let n = 0; n < 7; n++) {
        const it = who.inv.belt[n];
        if (!it) continue;
        const i = n % 4, row = Math.floor(n / 4);
        const d = AW.InvUI.itemEl(E, it, BELT[0] + i * CELL, BELT[1] + row * CELL, 'inv', { centerBox: [CELL, CELL] });
        if (d) AW.InvUI.bindItem(scr, d, it, 'belt');
      }
    },

    dollItemAt(scr, p) {
      const d = scr.doll;
      if (!d || !d.owner) return null;
      const x = Math.floor(p.x) - DOLL_RECT[0], y = Math.floor(p.y) - DOLL_RECT[1];
      if (x < 0 || y < 0 || x >= DOLL_RECT[2] || y >= DOLL_RECT[3]) return null;
      const li = d.owner[y * DOLL_RECT[2] + x];
      return li >= 0 ? d.layers[li].item : null;
    },

    groundItems(scr) {
      const W = scr.W, h = scr.who;
      return W.ground.filter(g => AW.dist(g.x, g.y, h.x, h.y) < 110);
    },

    buildGround(scr) {
      const E = scr.el;
      const box = el('div', 'aw-grid aw-hit', E, { left: GROUND[0] + 'px', top: GROUND[1] + 'px', width: (4 * CELL) + 'px', height: (11 * CELL) + 'px' });
      box.dataset.zone = scr.trade ? 'trade' : 'ground';
      const items = scr.trade ? scr.trade.inv.all().filter(it => !I.isMoney(it)) : AW.InvUI.groundItems(scr).map(g => g.item);
      const occ = new Uint8Array(4 * 11);
      for (const it of items) {
        const sz = I.maskSize(it);
        let placed = false;
        for (let y = 0; y < 11 && !placed; y++) {
          for (let x = 0; x < 4 && !placed; x++) {
            let ok = x + sz[0] <= 4 && y + sz[1] <= 11;
            for (let yy = 0; ok && yy < sz[1]; yy++) for (let xx = 0; ok && xx < sz[0]; xx++) if (occ[(y + yy) * 4 + x + xx]) ok = false;
            if (!ok) continue;
            for (let yy = 0; yy < sz[1]; yy++) for (let xx = 0; xx < sz[0]; xx++) occ[(y + yy) * 4 + x + xx] = 1;
            const d = AW.InvUI.itemEl(E, it, GROUND[0] + x * CELL, GROUND[1] + y * CELL, 'inv', { centerBox: [sz[0] * CELL, sz[1] * CELL] });
            if (d) AW.InvUI.bindItem(scr, d, it, scr.trade ? 'trade' : 'ground');
            placed = true;
          }
        }
      }
    },

    bindItem(scr, d, it, from) {
      d.classList.add('aw-hit');
      d.addEventListener('mousedown', ev => {
        ev.stopPropagation();
        if (ev.button === 2) { AW.InvUI.useItem(scr, it, from); return; }
        if (ev.button === 0) AW.InvUI.startDrag(scr, it, from, ev);
      });
      d.addEventListener('mouseenter', () => { scr.hoverItem = it; scr.hoverFrom = from; });
      d.addEventListener('mouseleave', () => { if (scr.hoverItem === it) scr.hoverItem = null; });
    },

    hover(scr, p) {
      const ui = scr.ui;
      if (scr.drag) {
        scr.drag.el.style.left = (p.x - scr.drag.ox) + 'px';
        scr.drag.el.style.top = (p.y - scr.drag.oy) + 'px';
      }
      const it = scr.drag ? null : scr.hoverItem;
      AW.InvUI.describe(scr, it, p);
      ui.tip(scr.btnTip || '');
    },

    describe(scr, it, p) {
      const d = scr.descEl;
      if (!it) { d.style.display = 'none'; scr.descFor = null; return; }
      if (scr.descFor !== it) {
        scr.descFor = it;
        d.innerHTML = '';
        const c = AW.windowCanvas(10, 10);
        d.appendChild(c);
        const body = el('div', 'aw-desc-body', d);
        const ic = AW.Assets.itemIcon(it, 'inv');
        if (ic) AW.spr(ic.key, ic.anim, 0, body, 0, 0, { cls: 'aw-desc-icon' });
        const txt = el('div', 'aw-desc-text', body);
        el('div', 'aw-desc-name', txt).textContent = I.displayName(it);
        for (const line of AW.InvUI.itemLines(scr, it)) el('div', 'aw-desc-line', txt).textContent = line;
        requestAnimationFrame(() => {
          const w = body.offsetWidth + 20, h = body.offsetHeight + 20;
          const nc = AW.windowCanvas(w, h);
          d.replaceChild(nc, d.firstChild);
          d.style.width = w + 'px';
          d.style.height = h + 'px';
          AW.InvUI.placeDesc(scr, p);
        });
      }
      d.style.display = 'block';
      AW.InvUI.placeDesc(scr, p);
    },

    placeDesc(scr, p) {
      const d = scr.descEl;
      const w = d.offsetWidth || 200, h = d.offsetHeight || 80;
      let x = p.x + 22, y = p.y + 22;
      if (x + w > 800) x = p.x - w - 4;
      if (y + h > 600) y = p.y - h - 4;
      d.style.left = Math.max(0, x) + 'px';
      d.style.top = Math.max(0, y) + 'px';
    },

    itemLines(scr, it) {
      const out = [];
      const who = scr.who;
      if (it.ruDesc) out.push(String(it.ruDesc).replace(/\{[\d.]+\}/g, ' ').replace(/[~^]/g, ' ').replace(/\s+/g, ' ').trim());
      if (I.isWeapon(it) && !I.isGrenade(it) && !I.isMine(it)) {
        out.push(AW.label('InvKlasaBroni', 'Класс оружия') + ': ' + (AW.Rules.SKILLS[AW.Rules.WCLASS_SKILL[I.wclass(it)] || 'fist'] || {}).name);
        if (it.maxdur) out.push(AW.label('InvDurability', 'Прочность') + ': ' + Math.floor(it.dur) + '/' + Math.floor(it.maxdur));
        if (it.speed) out.push(AW.label('ICechaSpeed', 'Скорострельность') + ': ' + it.speed);
        if (it.link) out.push('Заряжено: ' + I.displayName(it.link) + ' (' + it.link.amount + ')');
      }
      if (I.isGrenade(it) || I.isMine(it)) out.push('Сила взрыва: ' + it.damage + ', радиус: ' + it.area + ' м');
      if (I.isAmmo(it)) {
        const d = AW.Rules.AMMO_DMG[it.sub];
        if (d) out.push('Урон: ' + d[0] + '-' + d[1]);
        out.push('Патронов: ' + it.amount + '/' + it.maxamount);
      }
      if (I.isHealth(it) && it.amount) {
        if (it.name === 'tools' || it.name === 'weaponkit') out.push((T('InvPlusDur') || 'Починка оружия: +') + it.amount);
        else out.push((T('InvCure') || 'Здоровье: +') + it.amount);
      }
      for (const [k, v] of I.effects(it)) {
        const nm = AW.Rules.STAT_NAMES[k] || { tohit: 'Попадание', tomiss: 'Уклонение', toroll: 'Бросок', dmg: 'Урон' }[k] || k;
        out.push(nm + ': ' + (v > 0 ? '+' : '') + v);
      }
      for (const b of I.buffs(it)) out.push((AW.Rules.STAT_NAMES[b.stat] || b.stat) + ' ' + (b.v > 0 ? '+' : '') + b.v + ' на ' + b.t + ' с');
      const req = I.requirements(it);
      if (req.length) {
        out.push('Требуется: ' + req.map(([s, v]) => (s === 'lev' ? 'уровень' : (AW.Rules.STAT_NAMES[s] || s).toLowerCase()) + ' ' + v).join(', '));
        if (!I.canUse(it, who)) out.push('Вы пока не можете этим пользоваться');
      }
      out.push(AW.label('InvWeight', 'Вес') + ': ' + (it.weight || 0) + ' кг');
      if (scr.trade) {
        const W = scr.W;
        const buy = scr.hoverFrom === 'trade';
        const p = buy ? I.buyPrice(it, W.hero.stat('cha'), scr.trade.stat('cha')) : I.sellPrice(it, W.hero.stat('cha'), scr.trade.stat('cha'));
        out.push((buy ? 'Цена: ' : 'Вам заплатят: ') + p + ' фр.');
      } else if (it.price) out.push(AW.label('InvPrice', 'Цена') + ': ' + I.value(it) + ' фр.');
      return out;
    },

    startDrag(scr, it, from, ev) {
      if (scr.drag) return;
      const ic = AW.Assets.itemIcon(it, 'inv');
      if (!ic) return;
      const p = scr.ui.toStage(ev);
      const f = ic.f;
      const d = AW.spr(ic.key, ic.anim, 0, scr.el, 0, 0, { cls: 'aw-drag' });
      scr.drag = { it, from, el: d, ox: Math.min(22, f[2] / 2), oy: Math.min(22, f[3] / 2) };
      d.style.left = (p.x - scr.drag.ox) + 'px';
      d.style.top = (p.y - scr.drag.oy) + 'px';
      scr.ui.audio.play('icons/take-item');
      scr.ui.drag = {
        move: () => {},
        drop: (pt) => AW.InvUI.drop(scr, pt)
      };
    },

    cancelDrag(scr) {
      if (scr.drag) scr.drag.el.remove();
      scr.drag = null;
      scr.ui.drag = null;
    },

    zoneAt(scr, p) {
      if (p.x >= PACK[0] && p.y >= PACK[1] && p.x < PACK[0] + 12 * CELL && p.y < PACK[1] + scr.who.inv.rows * CELL && scr.tab === 'pack') return 'pack';
      if (scr.left === 'doll') {
        if (p.x >= BELT[0] && p.y >= BELT[1] && p.x < BELT[0] + 4 * CELL && p.y < BELT[1] + 2 * CELL) return 'belt';
        if (p.x >= 20 && p.y >= 39 && p.x < 205 && p.y < 378) return 'doll';
      } else if (p.x >= GROUND[0] && p.y >= GROUND[1] && p.x < GROUND[0] + 4 * CELL && p.y < GROUND[1] + 11 * CELL) return scr.trade ? 'trade' : 'ground';
      if (p.y < 471 && p.x >= 214 && !scr.trade && p.y > 47 && scr.tab !== 'pack') return 'pack';
      return '';
    },

    drop(scr, p) {
      const d = scr.drag;
      if (!d) return;
      AW.InvUI.cancelDrag(scr);
      const zone = AW.InvUI.zoneAt(scr, p);
      const it = d.it, from = d.from;
      const who = scr.who, inv = who.inv, W = scr.W;
      let ok = false;
      const target = AW.InvUI.itemAtPoint(scr, p);
      if (target && target !== it && zone === 'pack') ok = AW.InvUI.combine(scr, it, target, from);
      if (!ok) {
        if (zone === 'pack') {
          const cx = Math.floor((p.x - d.ox + 10 - PACK[0]) / CELL), cy = Math.floor((p.y - d.oy + 10 - PACK[1]) / CELL);
          ok = AW.InvUI.toPack(scr, it, from, cx, cy);
        } else if (zone === 'belt') {
          const i = Math.floor((p.x - BELT[0]) / CELL) + Math.floor((p.y - BELT[1]) / CELL) * 4;
          ok = AW.InvUI.toBelt(scr, it, from, Math.min(6, i));
        } else if (zone === 'doll') ok = AW.InvUI.toDoll(scr, it, from);
        else if (zone === 'ground') ok = AW.InvUI.toGround(scr, it, from);
        else if (zone === 'trade') ok = AW.InvUI.sell(scr, it, from);
      }
      scr.ui.audio.play(ok ? 'icons/drop-item' : 'menu/click7');
      if (ok) W.hero.inv === inv;
      AW.InvUI.build(scr);
    },

    itemAtPoint(scr, p) {
      const inv = scr.who.inv;
      const cx = Math.floor((p.x - PACK[0]) / CELL), cy = Math.floor((p.y - PACK[1]) / CELL);
      for (const e of inv.pack) {
        for (const c of I.mask(e.item)) if (e.x + c[0] === cx && e.y + c[1] === cy) return e.item;
      }
      return null;
    },

    takeFrom(scr, it, from) {
      const W = scr.W, inv = scr.who.inv;
      if (from === 'ground') {
        const g = W.ground.find(x => x.item === it);
        if (g) W.ground.splice(W.ground.indexOf(g), 1);
        return true;
      }
      if (from === 'trade') return false;
      return inv.remove(it);
    },

    putBack(scr, it, from) {
      const W = scr.W, inv = scr.who.inv;
      if (from === 'ground') { W.dropItemAt(it, scr.who.x, scr.who.y); return; }
      if (!inv.add(it)) W.dropItemAt(it, scr.who.x, scr.who.y);
    },

    toPack(scr, it, from, cx, cy) {
      const inv = scr.who.inv;
      if (from === 'trade') return AW.InvUI.buy(scr, it, cx, cy);
      if (from === 'pack') return inv.placeAt(it, Math.max(0, cx), Math.max(0, cy));
      if (!inv.fits(it, Math.max(0, cx), Math.max(0, cy)) && !inv.findPlace(it)) { AW.InvUI.full(scr); return false; }
      if (from === 'wear') {
        if (it === inv.hand) { inv.hand = null; scr.who.fight = 0; }
        else for (const k of Object.keys(inv.wear)) if (inv.wear[k] === it) delete inv.wear[k];
      } else AW.InvUI.takeFrom(scr, it, from);
      if (I.isMoney(it)) { inv.add(it); return true; }
      if (inv.fits(it, Math.max(0, cx), Math.max(0, cy))) { inv.pack.push({ item: it, x: Math.max(0, cx), y: Math.max(0, cy) }); return true; }
      if (inv.add(it)) return true;
      AW.InvUI.putBack(scr, it, 'ground');
      return false;
    },

    full(scr) {
      scr.W.message(AW.TEXT.dupa1 || 'Здесь нет места!', 'red');
      scr.ui.audio.play(scr.who.id === 'Johann' ? 'waves/johann/inv/' + AW.random(2) : 'waves/hero/inv/' + AW.random(2));
    },

    toBelt(scr, it, from, slot) {
      const inv = scr.who.inv;
      if (from === 'trade') return false;
      if (it.grab !== 2) { scr.W.message('Это на пояс не повесишь', 'red'); return false; }
      if (!I.canUse(it, scr.who)) { AW.InvUI.noReq(scr, it); return false; }
      if (from === 'ground') AW.InvUI.takeFrom(scr, it, from);
      else if (from === 'wear') return false;
      const r = inv.toBelt(it, slot);
      if (typeof r === 'string') {
        const uid = r.slice(5);
        const prev = inv.all().find(x => x.uid === uid);
        if (prev) inv.remove(prev);
      }
      return !!r;
    },

    noReq(scr, it) {
      const lines = I.requirements(it).filter(([s, v]) => (s === 'lev' ? scr.who.level : scr.who.stat(s)) < v).map(([s, v]) => (s === 'lev' ? 'уровень' : AW.Rules.STAT_NAMES[s] || s) + ': ' + v);
      scr.W.message((AW.TEXT.REQBrak || 'Не хватает') + ' ' + lines.join(', '), 'red');
    },

    toDoll(scr, it, from) {
      const who = scr.who, inv = who.inv, W = scr.W;
      if (from === 'trade') return false;
      if (I.isHealth(it)) return AW.InvUI.useItem(scr, it, from);
      if (I.isAmmo(it)) return AW.InvUI.loadAmmo(scr, it, from);
      if (!I.canUse(it, who)) { AW.InvUI.noReq(scr, it); return false; }
      if (it.grab === 1 || (I.isWeapon(it) && !I.isGrenade(it) && !I.isMine(it)) || it.name === 'kufel') {
        if (!AW.InvUI.takeFrom(scr, it, from) && from !== 'wear') return false;
        const old = inv.hand;
        inv.hand = it;
        if (old && old !== it && !inv.add(old)) W.dropItemAt(old, who.x, who.y);
        who.idle();
        return true;
      }
      const slot = SLOT_OF_GRAB[it.grab];
      if (!slot) { scr.W.message('Это нельзя надеть', 'red'); return false; }
      if (!AW.InvUI.takeFrom(scr, it, from) && from !== 'wear') return false;
      const old = inv.wear[slot];
      inv.wear[slot] = it;
      if (old && old !== it && !inv.add(old)) W.dropItemAt(old, who.x, who.y);
      W.playSound(it.snd.pick || 'item/kurtka', who.x, who.y, 80);
      return true;
    },

    toGround(scr, it, from) {
      const who = scr.who, inv = who.inv, W = scr.W;
      if (from === 'ground' || from === 'trade') return false;
      if (it.subAdventure || (it.sub === 'ADVENTURE' && !I.isMoney(it) && !/^(wiadro|decha|kamien)/.test(it.name))) {
        W.message('Это мне еще пригодится', 'yellow');
        return false;
      }
      if (from === 'wear') {
        if (it === inv.hand) inv.hand = null;
        else for (const k of Object.keys(inv.wear)) if (inv.wear[k] === it) delete inv.wear[k];
      } else inv.remove(it);
      W.dropItemAt(it, who.x + AW.random(-15, 15), who.y + AW.random(-8, 8));
      W.playSound(it.snd.drop || 'icons/drop-item', who.x, who.y, 80);
      return true;
    },

    combine(scr, it, target, from) {
      if (I.isAmmo(it) && I.isWeapon(target) && I.ammoFits(target, it)) {
        const old = target.link;
        AW.InvUI.takeFrom(scr, it, from);
        target.link = it;
        target.jammed = 0;
        if (old && old.amount > 0 && !scr.who.inv.add(old)) scr.W.dropItemAt(old, scr.who.x, scr.who.y);
        scr.W.playSound('weapons/load', scr.who.x, scr.who.y, 80);
        return true;
      }
      if (I.isHealth(it) && (it.name === 'tools' || it.name === 'weaponkit') && I.isWeapon(target)) {
        const prev = scr.who.inv.hand;
        scr.who.inv.hand = target;
        const ok = scr.W.useHealth(scr.who, it);
        scr.who.inv.hand = prev;
        return ok;
      }
      return false;
    },

    loadAmmo(scr, it, from) {
      const w = scr.who.inv.hand;
      if (!w || !I.ammoFits(w, it)) { scr.W.message('Эти патроны не подходят', 'red'); return false; }
      return AW.InvUI.combine(scr, it, w, from);
    },

    useItem(scr, it, from) {
      const who = scr.who, W = scr.W, inv = who.inv;
      if (from === 'trade') return false;
      if (I.isHealth(it)) {
        if (from === 'ground') { AW.InvUI.takeFrom(scr, it, from); if (!inv.add(it)) { W.dropItemAt(it, who.x, who.y); return false; } }
        const ok = W.useHealth(who, it);
        AW.InvUI.build(scr);
        return ok;
      }
      if (I.isAmmo(it)) { const ok = AW.InvUI.loadAmmo(scr, it, from); AW.InvUI.build(scr); return ok; }
      if (from === 'wear') {
        const ok = AW.InvUI.toPack(scr, it, from, 0, 0);
        AW.InvUI.build(scr);
        return ok;
      }
      if (from === 'ground') {
        const ok = AW.InvUI.toPack(scr, it, from, 0, 0);
        AW.InvUI.build(scr);
        return ok;
      }
      if (it.grab >= 1 && it.grab !== 2) {
        const ok = AW.InvUI.toDoll(scr, it, from);
        AW.InvUI.build(scr);
        return ok;
      }
      if (it.grab === 2) {
        const i = inv.belt.indexOf(null);
        const ok = i >= 0 && AW.InvUI.toBelt(scr, it, from, i);
        AW.InvUI.build(scr);
        return ok;
      }
      return false;
    },

    buy(scr, it, cx, cy) {
      const W = scr.W, h = W.hero, tr = scr.trade;
      const price = I.buyPrice(it, h.stat('cha'), tr.stat('cha'));
      if (h.inv.cash() < price) { W.message('Не хватает денег: нужно ' + price + ' фр.', 'red'); return false; }
      const place = h.inv.fits(it, Math.max(0, cx), Math.max(0, cy)) ? [Math.max(0, cx), Math.max(0, cy)] : h.inv.findPlace(it);
      if (!place) { AW.InvUI.full(scr); return false; }
      tr.inv.remove(it);
      h.inv.pack.push({ item: it, x: place[0], y: place[1] });
      h.inv.changeCash(-price);
      tr.inv.changeCash(price);
      W.playSound('item/coin-putoff', h.x, h.y, 80);
      W.message('Куплено: ' + I.displayName(it) + ' (' + price + ' фр.)', '');
      return true;
    },

    sell(scr, it, from) {
      const W = scr.W, h = W.hero, tr = scr.trade;
      if (from === 'trade' || I.isMoney(it)) return false;
      if (it.sub === 'ADVENTURE') { W.message('Это не продается', 'yellow'); return false; }
      const price = I.sellPrice(it, h.stat('cha'), tr.stat('cha'));
      if (tr.inv.cash() < price) { W.message('У торговца нет столько денег', 'red'); return false; }
      if (from === 'wear') {
        if (it === h.inv.hand) h.inv.hand = null;
        else for (const k of Object.keys(h.inv.wear)) if (h.inv.wear[k] === it) delete h.inv.wear[k];
      } else if (!AW.InvUI.takeFrom(scr, it, from)) return false;
      if (!tr.inv.add(it)) { tr.inv.rows = Math.min(9, tr.inv.rows + 1); tr.inv.add(it); }
      h.inv.changeCash(price);
      tr.inv.changeCash(-price);
      W.playSound('item/coin-take', h.x, h.y, 80);
      W.message('Продано: ' + I.displayName(it) + ' (' + price + ' фр.)', '');
      if (AW.Scripts.onSell) AW.Scripts.onSell(W, it, tr);
      return true;
    },

    useFromBelt(game, h, i) {
      const W = game.W;
      const it = h.inv.belt[i];
      if (!it) return;
      if (I.isAmmo(it)) {
        const w = h.weapon();
        if (!w || !I.ammoFits(w, it)) { W.message('Эти патроны не подходят', 'red'); return; }
        h.inv.belt[i] = null;
        const old = w.link;
        w.link = it;
        w.jammed = 0;
        if (old && old.amount > 0) h.inv.belt[i] = old;
        W.playSound('weapons/load', h.x, h.y, 80);
        W.message((AW.TEXT.MsgPrzeladowanie || 'Перезарядка') + ' (' + h.name + ')', '');
        h.cooldown = Math.max(h.cooldown, 1.2 - h.stat('spd') * 0.05);
        return;
      }
      if (I.isHealth(it)) { W.useHealth(h, it); return; }
      if (I.isGrenade(it)) {
        if (!h.fight) { W.setFight(h, 1); if (!h.fight) return; }
        const wp = game.worldPoint(game.ui.mouse);
        h.inv.belt[i] = null;
        AW.Combat.throwGrenade(h, it, wp.x, wp.y);
        W.message((AW.TEXT.MsgUzyto || 'Использовано: ') + I.displayName(it), '');
        return;
      }
      if (I.isMine(it)) {
        h.inv.belt[i] = null;
        W.mines.push({ x: h.x, y: h.y + 4, area: it.area || 3, damage: it.damage || 30, team: 1, owner: h });
        W.playSound('weapons/mina-stawianie', h.x, h.y, 90);
      }
    }
  };
})(globalThis.AW = globalThis.AW || {});
