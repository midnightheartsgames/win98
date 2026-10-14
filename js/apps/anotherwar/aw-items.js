(function (AW) {
  'use strict';

  const I = AW.Items = {};

  const M = {
    cent25: [[0, 0]], ausweis: [[0, 0], [0, 1], [1, 0], [1, 1]], decha: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1]],
    mapka: [[0, 0], [0, 1], [1, 0], [1, 1]], mapa: [[0, 0], [0, 1], [1, 0], [1, 1]], plakat: [[0, 0], [0, 1]], proof75: [[0, 0], [0, 1]],
    ser: [[0, 0]], skorka: [[0, 0]], sliwowica: [[0, 0], [0, 1]], pfenig: [[0, 0]], uszczelka: [[0, 0], [1, 0]],
    wiadro: [[0, 0], [0, 1]], wiadrowodne: [[0, 0], [0, 1]], winko: [[0, 0], [0, 1]], wodka: [[0, 0], [0, 1]], piwo: [[0, 0], [0, 1]],
    wykrywacz: [[0, 0], [0, 1]], ziemniak: [[0, 0]], whisky: [[0, 0], [0, 1]], wytrych: [[0, 0]], klucz: [[0, 0]],
    bocce: [[0, 0], [1, 0], [0, 1], [1, 1]], szmal: [[0, 0]], kamien: [[0, 0], [1, 0], [0, 1], [1, 1]],
    kamienbig: [[0, 0], [1, 0], [0, 1], [1, 1]], robin: [[0, 0], [1, 0], [0, 1], [1, 1]], nawoz: [[0, 0], [1, 0], [0, 1], [1, 1]],
    skrzynka: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]], jajo: [[0, 0]], podkowa: [[0, 0]],
    skrzynia: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]], centy: [[0, 0]],
    kurtka: [[0, 0], [1, 0], [0, 1], [1, 1], [1, 2]], helm: [[0, 0], [1, 0], [0, 1], [1, 1]], latarka: [[0, 0]], lornetka: [[0, 0]],
    kamizelka: [[0, 0], [1, 0], [0, 1], [1, 1]], kufel: [[0, 0], [0, 1]], pasek: [[0, 0], [1, 0], [0, 1], [1, 1]], rekawiczki: [[0, 0]],
    buty: [[0, 0], [0, 1], [1, 0], [1, 1]], spodnie: [[0, 0], [0, 1], [1, 0], [1, 1], [0, 2], [1, 2]], kaczuszka: [[0, 0]],
    Apteczka: [[0, 0]], Bandaz: [[0, 0]], medkit: [[0, 0], [1, 0], [0, 1], [1, 1]], tools: [[0, 0]], weaponkit: [[0, 0], [0, 1], [1, 0], [1, 1]],
    nalewka: [[0, 0], [0, 1]], kielbasa: [[0, 0], [0, 1], [1, 0], [1, 1]], superwino: [[0, 0], [0, 1]],
    NozKuch: [[0, 0], [1, 0]], NozMys: [[0, 0], [1, 0]], Bagnet: [[0, 0], [1, 0]], Parabellum: [[0, 0], [1, 0]], ParabellumL: [[0, 0], [1, 0]],
    WaltherPPK: [[0, 0], [1, 0]], WaltherPPKS: [[0, 0], [1, 0]], Mauser98k: [[0, 0], [1, 0], [2, 0], [3, 0]], Mauser98kB: [[0, 0], [1, 0], [2, 0], [3, 0]],
    Strzelba: [[0, 0], [1, 0], [2, 0], [3, 0]], StrzelbaS: [[0, 0], [1, 0], [2, 0]], Sztucer: [[0, 0], [1, 0], [2, 0], [3, 0]],
    SztucerS: [[0, 0], [1, 0], [2, 0], [3, 0]], MP40: [[0, 0], [1, 0], [2, 0]], GranatDymny: [[0, 0]], GranatPiechotny: [[0, 0]],
    GranatPancerny: [[0, 0]], MinaPiechotna: [[0, 0]], MinaPancerna: [[0, 0], [0, 1], [1, 0], [1, 1]], mug: [[0, 0], [0, 1]]
  };

  I.mask = function (item) {
    return M[item.name] || M[item.name && item.name.toLowerCase()] || [[0, 0]];
  };
  I.maskSize = function (item) {
    const m = I.mask(item);
    let w = 0, h = 0;
    for (const c of m) { w = Math.max(w, c[0] + 1); h = Math.max(h, c[1] + 1); }
    return [w, h];
  };

  I.SLOTS = ['none', 'hand', 'belt', 'head', 'torso', 'pants', 'boots', 'waist', 'neck', 'helm', 'armor', 'hands', 'goggles'];
  I.SLOT_NAMES = { head: 'Голова', torso: 'Куртка', pants: 'Брюки', boots: 'Ботинки', waist: 'Ремень', neck: 'На шее', helm: 'Головной убор', armor: 'Броня', hands: 'Перчатки', goggles: 'Очки' };
  I.WEAR_SLOTS = ['helm', 'neck', 'torso', 'armor', 'hands', 'waist', 'pants', 'boots', 'goggles'];

  I.WEAPON_GFX = {
    NozKuch: 'bayonet', NozMys: 'bayonet', Bagnet: 'bayonet', Parabellum: 'parabellum', ParabellumL: 'parabellum',
    WaltherPPK: 'waltherppk', WaltherPPKS: 'waltherppks', Mauser98k: 'mauser', Mauser98kB: 'mauser98kb', Mauser98kS: 'mauser',
    Strzelba: 'strzelba', StrzelbaS: 'strzelbas', Sztucer: 'sztucer', SztucerS: 'sztucers', mug: 'mug', Kufel: 'mug'
  };

  I.AMMO_FOR = {
    Mauser98k: ['Mz5'], Mauser98kS: ['Mz5'], Mauser98kB: ['Mz5'], Parabellum: ['Par8'], ParabellumL: ['Par8', 'Par32'],
    WaltherPPK: ['Wal7'], WaltherPPKS: ['Wal7'], TokariewTT33: ['Tet8'], VIS35: ['Vi8'], Strzelba: ['Sho2'], StrzelbaS: ['Sho2'],
    Sztucer: ['Hun1'], SztucerS: ['Hun1'], MP40: ['Shm32']
  };

  let uidSeq = 1;
  I.newUid = function () { return 'it' + (uidSeq++); };
  I.syncUid = function (items) {
    for (const it of items) {
      const n = parseInt(String(it.uid || '').replace(/^it/, ''), 10);
      if (n >= uidSeq) uidSeq = n + 1;
    }
  };

  function pickAffix(table, kit) {
    if (!kit || !kit.length) return '';
    const key = AW.weightedPick(kit);
    if (!key || key === 'nic') return '';
    return table.find(r => r.key === key) ? key : '';
  }

  function applyItemEff(item, eff) {
    for (const part of String(eff || '').split('|')) {
      const m = part.match(/^I(WGT|PRI|DUR|AM|SPD|PST):([*+-])\(?(-?[\d.]+)\)?$/);
      if (!m) continue;
      const v = parseFloat(m[3]);
      const f = { WGT: 'weight', PRI: 'price', DUR: 'maxdur', AM: 'amount', SPD: 'speed', PST: 'packsize' }[m[1]];
      if (item[f] === undefined) continue;
      if (m[2] === '*') item[f] = item[f] * v;
      else item[f] = item[f] + (m[2] === '-' ? -v : v);
    }
  }

  I.create = function (ref, opts) {
    const t = AW.Data.item(ref);
    if (!t) return null;
    const o = opts || {};
    const cls = t._class;
    const it = {
      uid: I.newUid(),
      key: AW.Data.itemKey(ref),
      cls,
      name: t.name || '',
      sub: t.subclass || '',
      ruName: t.ruName || t.name || '',
      ruDesc: t.ruDesc || '',
      gender: t.gender || 'M',
      icon: String(t.gfxObj || '').replace(/\.spx$/i, '').toLowerCase(),
      grab: parseInt(t.grabable || '0', 10) || 0,
      hand: parseInt(t.hand || '0', 10) || 0,
      weight: Math.max(0, AW.evalValue(t.weight, 0)),
      amount: AW.evalValue(t.amount, 1),
      maxamount: AW.evalValue(t.maxamount, 1),
      price: AW.evalValue(t.price, 0),
      speed: AW.evalValue(t.speed, 0),
      maxdur: AW.evalValue(t.durability, 0),
      area: AW.evalValue(t.area, 0),
      damage: AW.evalValue(t.damage, 0) || 0,
      require: t.require || '',
      onuse: t.onuse || '',
      wearINV: t.wearINV || '',
      wearNOR: t.wearNOR || '',
      snd: { pick: t.sndPick || '', drop: t.sndDrop || '', use: t.sndUse || '' },
      prefix: '',
      postfix: '',
      jammed: 0
    };
    if (o.noAffix !== true) {
      it.prefix = AW.random(100) <= 10 ? pickAffix(AW.Data.templates.prefix, t.kit_prefix) : '';
      it.postfix = AW.random(100) <= 25 ? pickAffix(AW.Data.templates.postfix, t.kit_postfix) : '';
      const pre = AW.Data.templates.prefix.find(r => r.key === it.prefix);
      const post = AW.Data.templates.postfix.find(r => r.key === it.postfix);
      if (pre) applyItemEff(it, pre.eff);
      if (post) applyItemEff(it, post.eff);
    }
    it.weight = Math.round(it.weight * 100) / 100;
    it.price = Math.max(0, Math.round(it.price));
    it.amount = Math.round(it.amount);
    it.dur = it.maxdur;
    if (cls === 'cWeapon' && t.kit_child && t.kit_child.length) {
      const child = AW.weightedPick(t.kit_child);
      if (child) it.link = I.create(child.indexOf('.') === 1 ? child : 'a.' + child, { noAffix: true });
    }
    if (o.amount !== undefined) it.amount = o.amount;
    return it;
  };

  I.rerollWeight = function (it) {
    const t = AW.Data.item(it.key);
    if (!t) return;
    const T = AW.Data.templates;
    const w = { weight: Math.max(0, AW.evalValue(t.weight, 0)) };
    for (const r of [T.prefix.find(x => x.key === it.prefix), T.postfix.find(x => x.key === it.postfix)]) if (r) applyItemEff(w, r.eff);
    it.weight = Math.round(w.weight * 100) / 100;
  };

  const FORMULA_MISREAD_BY_V1 = /[*\/]/;
  I.fixV1Weights = function (node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.uid === 'string' && typeof node.key === 'string' && typeof node.weight === 'number') {
      const t = AW.Data.item(node.key);
      if (t && FORMULA_MISREAD_BY_V1.test(String(t.weight || ''))) I.rerollWeight(node);
    }
    for (const v of Object.values(node)) I.fixV1Weights(v);
  };

  I.isWeapon = function (it) { return it && it.cls === 'cWeapon'; };
  I.isAmmo = function (it) { return it && it.cls === 'cAmmo'; };
  I.isHealth = function (it) { return it && it.cls === 'cHealth'; };
  I.isWear = function (it) { return it && it.cls === 'cWear'; };
  I.isGrenade = function (it) { return it && /^Granat/.test(it.name); };
  I.isMine = function (it) { return it && /^Mina/.test(it.name); };
  I.isMoney = function (it) { return it && it.name === 'szmal'; };
  I.stackable = function (it) { return I.isMoney(it); };

  I.affixWord = function (table, key, gender) {
    if (!key) return '';
    const r = table.find(x => x.key === key);
    if (!r) return '';
    return r[gender] || r.M || '';
  };

  I.displayName = function (it) {
    if (!it) return '';
    const T = AW.Data.templates;
    const pre = I.affixWord(T.prefix, it.prefix, it.gender);
    const post = I.affixWord(T.postfix, it.postfix, it.gender);
    let n = it.ruName;
    if (pre) n = pre + ' ' + n.charAt(0).toLowerCase() + n.slice(1);
    if (post) n = n + ' ' + post;
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  I.effects = function (it) {
    const T = AW.Data.templates;
    const out = [];
    const add = function (s) {
      for (const part of String(s || '').split('|')) {
        const m = part.match(/^H(STR|AGI|INT|END|CHA|SPD|LCK|AC|TOHIT|TOMISS|TOROLL|DMG):([+-]?[\d.]+)$/);
        if (m) out.push([m[1].toLowerCase(), parseFloat(m[2])]);
      }
    };
    add(it.onuse);
    const pre = T.prefix.find(r => r.key === it.prefix);
    const post = T.postfix.find(r => r.key === it.postfix);
    if (pre) add(pre.eff);
    if (post) add(post.eff);
    return out;
  };

  I.buffs = function (it) {
    const out = [];
    for (const part of String(it.onuse || '').split('|')) {
      const m = part.match(/^(STR|AGI|INT|END|CHA|SPD|LCK):([+-]?\d+),(\d+)$/);
      if (m) out.push({ stat: m[1].toLowerCase(), v: parseInt(m[2], 10), t: parseInt(m[3], 10) });
    }
    return out;
  };

  I.requirements = function (it) {
    const out = [];
    for (const part of String(it.require || '').split('|')) {
      const m = part.match(/^H(STR|AGI|INT|END|CHA|SPD|LCK|LEV):(\d+)$/);
      if (m) out.push([m[1].toLowerCase(), parseInt(m[2], 10)]);
    }
    return out;
  };

  I.canUse = function (it, actor) {
    for (const [s, v] of I.requirements(it)) {
      const have = s === 'lev' ? actor.level : actor.stat(s);
      if (have < v) return false;
    }
    return true;
  };

  I.wclass = function (it) {
    if (!it) return 'EMPTY';
    if (it.name === 'mug' || it.name === 'Kufel') return 'MUG';
    if (I.isGrenade(it) || I.isMine(it)) return 'EMPTY';
    return it.sub || 'EMPTY';
  };

  I.gfxClass = function (wclass) {
    return { EMPTY: 'empty', KNIFE: 'knife', PISTOL: 'pistol', RIFLE: 'rifle', ARIFLE: 'arifle', MPISTOL: 'mpistol', HEAVY: 'empty', FLAMER: 'arifle', MUG: 'mug' }[wclass] || 'empty';
  };

  I.ammoFits = function (weapon, ammo) {
    if (!weapon || !ammo || !I.isAmmo(ammo)) return false;
    const list = I.AMMO_FOR[weapon.name];
    if (!list) return false;
    const base = ammo.name.replace(/_INF$/, '');
    return list.indexOf(base) >= 0;
  };

  I.value = function (it) {
    let p = it.price || 0;
    if (I.isWeapon(it) && it.maxdur > 0) p = p * (0.35 + 0.65 * Math.max(0, it.dur) / it.maxdur);
    if (I.isMoney(it)) return 0;
    return Math.max(0, Math.round(p));
  };

  I.buyPrice = function (it, heroCha, traderCha) {
    const r = (heroCha - traderCha) * 0.05;
    return Math.max(1, Math.round(I.value(it) * 2 * (1 - r)));
  };
  I.sellPrice = function (it, heroCha, traderCha) {
    const r = (heroCha - traderCha) * 0.05;
    return Math.max(0, Math.round(I.value(it) / 2 * (1 + r)));
  };

  I.Inventory = class {
    constructor(packsize) {
      this.cols = 12;
      this.rows = AW.clamp(packsize || 5, 3, 9);
      this.pack = [];
      this.belt = [null, null, null, null, null, null, null];
      this.hand = null;
      this.wear = {};
    }

    all() {
      const out = this.pack.map(p => p.item);
      for (const b of this.belt) if (b) out.push(b);
      if (this.hand) out.push(this.hand);
      for (const k of Object.keys(this.wear)) if (this.wear[k]) out.push(this.wear[k]);
      return out;
    }

    weight() {
      let w = 0;
      for (const it of this.all()) {
        w += it.weight || 0;
        if (it.link) w += it.link.weight || 0;
      }
      return Math.round(w * 100) / 100;
    }

    occupied(except) {
      const g = new Uint8Array(this.cols * this.rows);
      for (const p of this.pack) {
        if (p.item === except) continue;
        for (const c of I.mask(p.item)) {
          const x = p.x + c[0], y = p.y + c[1];
          if (x < this.cols && y < this.rows) g[y * this.cols + x] = 1;
        }
      }
      return g;
    }

    fits(item, x, y, except) {
      const g = this.occupied(except);
      for (const c of I.mask(item)) {
        const cx = x + c[0], cy = y + c[1];
        if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return false;
        if (g[cy * this.cols + cx]) return false;
      }
      return true;
    }

    findPlace(item) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) if (this.fits(item, x, y)) return [x, y];
      }
      return null;
    }

    add(item) {
      if (!item) return false;
      if (I.isMoney(item)) {
        const cash = this.pack.find(p => I.isMoney(p.item));
        if (cash) { cash.item.amount += item.amount; return true; }
      }
      const pos = this.findPlace(item);
      if (!pos) return false;
      this.pack.push({ item, x: pos[0], y: pos[1] });
      return true;
    }

    placeAt(item, x, y) {
      if (!this.fits(item, x, y, item)) return false;
      this.remove(item);
      this.pack.push({ item, x, y });
      return true;
    }

    remove(item) {
      const i = this.pack.findIndex(p => p.item === item);
      if (i >= 0) { this.pack.splice(i, 1); return true; }
      const b = this.belt.indexOf(item);
      if (b >= 0) { this.belt[b] = null; return true; }
      if (this.hand === item) { this.hand = null; return true; }
      for (const k of Object.keys(this.wear)) if (this.wear[k] === item) { delete this.wear[k]; return true; }
      return false;
    }

    where(item) {
      const p = this.pack.find(x => x.item === item);
      if (p) return { at: 'pack', x: p.x, y: p.y };
      const b = this.belt.indexOf(item);
      if (b >= 0) return { at: 'belt', i: b };
      if (this.hand === item) return { at: 'hand' };
      for (const k of Object.keys(this.wear)) if (this.wear[k] === item) return { at: 'wear', slot: k };
      return null;
    }

    findByName(name) {
      const low = String(name).toLowerCase();
      return this.all().find(it => (it.name || '').toLowerCase() === low || it.key.toLowerCase().endsWith('/' + low) || it.key.toLowerCase() === low) || null;
    }

    has(name) { return !!this.findByName(name); }

    cash() {
      let n = 0;
      for (const it of this.all()) if (I.isMoney(it)) n += it.amount;
      return n;
    }

    changeCash(delta) {
      let cash = this.pack.find(p => I.isMoney(p.item));
      if (!cash) {
        if (delta <= 0) return;
        const it = I.create('cItem/szmal', { noAffix: true, amount: 0 });
        if (!it) return;
        it.amount = 0;
        if (!this.add(it)) {
          this.pack.push({ item: it, x: 0, y: 0 });
        }
        cash = this.pack.find(p => I.isMoney(p.item));
      }
      cash.item.amount = Math.max(0, cash.item.amount + delta);
    }

    toBelt(item, slot) {
      if (!item) return false;
      if (item.grab !== 2) return false;
      const i = slot === undefined ? this.belt.indexOf(null) : slot;
      if (i < 0 || i > 6) return false;
      const prev = this.belt[i];
      this.remove(item);
      this.belt[i] = item;
      if (prev && prev !== item && !this.add(prev)) return 'drop:' + prev.uid;
      return true;
    }

    serialize() {
      return {
        rows: this.rows,
        pack: this.pack.map(p => ({ item: p.item, x: p.x, y: p.y })),
        belt: this.belt.slice(),
        hand: this.hand,
        wear: Object.assign({}, this.wear)
      };
    }

    static load(data) {
      const inv = new I.Inventory(data.rows);
      inv.pack = (data.pack || []).map(p => ({ item: p.item, x: p.x, y: p.y }));
      inv.belt = (data.belt || []).slice(0, 7);
      while (inv.belt.length < 7) inv.belt.push(null);
      inv.hand = data.hand || null;
      inv.wear = data.wear || {};
      I.syncUid(inv.all());
      return inv;
    }
  };

  I.RENE_KIT = ['100:h.A_bandaz', '60:h.A_bandaz', '40:h.A_bandaz', '20:h.A_bandaz', '20:h.A_kartofel', '20:h.A_kartofel', '15:h.A_kielbasa',
    '15:h.A_kielbasa', '15:h.A_kielbasa', '100:h.A_medkit', '100:h.A_tools', '20:h.A_weaponkit', '25:h.A_whisky', '75:h.A_winko',
    '45:h.A_winko', '45:h.A_winko', '100:a.CDIS_Sho2', '60:a.CDIS_Sho2', '40:a.CDIS_Sho2', '50:a.CNOR_Hun1', '45:a.CNOR_Hun1',
    '40:a.CNOR_Hun1', '35:a.CNOR_Hun1', '100:a.CNOR_Mz5', '90:a.CNOR_Mz5', '60:a.CNOR_Mz5', '50:a.CNOR_Mz5', '40:a.CNOR_Mz5',
    '100:a.CNOR_Par8', '50:a.CNOR_Par8', '50:a.CNOR_Par8', '50:a.CNOR_Par8', '25:a.CNOR_Wal7', '40:u.A_buty1', '60:u.A_czapka1',
    '40:u.A_hand1', '40:u.A_helm1', '40:u.A_kurtka1', '20:u.A_kurtka1S', '25:u.A_latarka', '25:u.A_lornetka', '70:u.A_kaczuszka',
    '35:u.A_pasek1', '35:u.A_spodnie1', '10:w.A_granade_CARM', '10:w.A_granade_CARM', '10:w.A_granade_CDIS', '10:w.A_granade_CDIS',
    '20:w.A_granade_CSMO', '20:w.A_granade_CSMO', '50:w.A_M98k', '90:w.A_NozKuch', '40:w.A_NozMys', '100:w.A_Par', '95:w.A_Strze',
    '50:w.A_StrzeS', '25:w.A_Sztu', '20:w.A_SztuS', '20:w.A_SztuS', '25:w.A_Wal', '25:w.A_Wal', '10:w.A_WalS', '10:w.A_WalS'];

  I.rollKit = function (kit, luck) {
    const out = [];
    for (const s of kit) {
      const m = String(s).match(/^(\d+):(.*)$/);
      const p = m ? parseInt(m[1], 10) : 50;
      const ref = m ? m[2] : s;
      if (AW.random(100) < p + ((luck || 6) - 6) * 2) {
        const it = I.create(ref);
        if (it) out.push(it);
      }
    }
    return out;
  };
})(globalThis.AW = globalThis.AW || {});
