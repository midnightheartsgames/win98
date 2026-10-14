(function (D) {
  'use strict';
  const { BASES, BASE_LIST, AFFIXES, UNIQUES, SETS, SET_ITEMS, RUNEWORDS, RARE_A, RARE_B, COL, CLASSES, SKILLS, MELEE } = D;

  let uidSeq = 1;
  const newUid = () => (Date.now() % 100000000) * 1000 + (uidSeq++ % 1000);
  const GI = { m: 0, f: 1, n: 2, pl: 3 };

  function typeMatch(b, types) {
    for (const t of types) {
      if (t === b.type) return true;
      if (t === 'weapon' && b.cat === 'weapon') return true;
      if (t === 'armor' && b.cat === 'armor') return true;
      if (t === 'melee' && b.cat === 'weapon' && MELEE.includes(b.type)) return true;
      if (t === 'charm' && b.cat === 'charm') return true;
    }
    return false;
  }

  function rollRange(rng, v) {
    if (typeof v === 'number') return v;
    if (Array.isArray(v) && Array.isArray(v[0])) return [rng.int(v[0][0], v[0][1]), rng.int(v[1][0], v[1][1])];
    if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') return rng.int(Math.min(v[0], v[1]), Math.max(v[0], v[1]));
    return v;
  }

  function addStat(stats, k, v) {
    if (Array.isArray(v)) {
      const cur = stats[k];
      stats[k] = cur ? [cur[0] + v[0], cur[1] + v[1]] : v.slice();
    } else if (typeof v === 'number') stats[k] = (stats[k] || 0) + v;
    else stats[k] = v;
  }

  function makeItem(baseId, o) {
    const b = BASES[baseId];
    if (!b) throw new Error('no base ' + baseId);
    o = o || {};
    const it = { uid: newUid(), base: baseId, q: 'normal', ilvl: o.ilvl || b.qlvl || 1, idf: true, stats: {}, sockets: 0, socketed: [] };
    if (b.def) it.def = o.rng ? o.rng.int(b.def[0], b.def[1]) : b.def[1];
    if (b.dur) { it.maxDur = b.dur; it.dur = b.dur; }
    if (b.qty) it.qty = o.qty !== undefined ? o.qty : b.qty;
    if (b.maxQty) it.qty = o.qty !== undefined ? o.qty : (b.type === 'quiver' ? b.maxQty : b.type === 'key' ? 6 : b.type === 'tome' ? 5 : 1);
    if (o.qty !== undefined) it.qty = o.qty;
    return it;
  }

  function eligibleAffixes(b, ilvl, kind, used) {
    return AFFIXES.filter(a => a.kind === kind && a.lvl <= ilvl && typeMatch(b, a.types) && !used.has(a.group) && (!b.charm || a.types.includes('charm') || a.types.includes('armor') || a.types.includes('ring')));
  }

  function applyAffix(it, a, rng, mul) {
    for (const k in a.stats) {
      let v = rollRange(rng, a.stats[k]);
      if (mul && mul < 1) {
        if (Array.isArray(v)) v = [Math.max(1, Math.round(v[0] * mul)), Math.max(1, Math.round(v[1] * mul))];
        else if (typeof v === 'number' && !k.startsWith('cls:')) v = Math.max(1, Math.round(v * mul));
      }
      addStat(it.stats, k, v);
    }
  }

  function applyMagic(it, rng) {
    const b = BASES[it.base];
    const used = new Set();
    const roll = rng.next();
    const wantPre = roll < 0.66, wantSuf = roll > 0.33 || !wantPre;
    it.pre = null; it.suf = null;
    if (wantPre) {
      const list = eligibleAffixes(b, it.ilvl, 'pre', used);
      if (list.length) { const a = rng.pick(list); applyAffix(it, a, rng, b.charm); used.add(a.group); it.pre = AFFIXES.indexOf(a); }
    }
    if (wantSuf || it.pre === null) {
      const list = eligibleAffixes(b, it.ilvl, 'suf', used);
      if (list.length) { const a = rng.pick(list); applyAffix(it, a, rng, b.charm); used.add(a.group); it.suf = AFFIXES.indexOf(a); }
    }
    it.q = 'magic';
  }

  function applyRare(it, rng, count) {
    const b = BASES[it.base];
    const used = new Set();
    const n = count || rng.int(3, it.ilvl > 30 ? 6 : 5);
    let np = 0, ns = 0;
    it.affixes = [];
    for (let i = 0; i < n * 3 && np + ns < n; i++) {
      const kind = np >= 3 ? 'suf' : ns >= 3 ? 'pre' : rng.chance(0.5) ? 'pre' : 'suf';
      const list = eligibleAffixes(b, it.ilvl, kind, used).filter(a => !(a.group === 'cls' && a.stats[Object.keys(a.stats)[0]][0] > 1));
      if (!list.length) continue;
      const a = rng.pick(list);
      applyAffix(it, a, rng, b.charm);
      used.add(a.group);
      it.affixes.push(AFFIXES.indexOf(a));
      if (kind === 'pre') np++; else ns++;
    }
    const cat = rareCat(b);
    it.rname = rng.pick(RARE_A[cat]) + ' ' + rng.pick(RARE_B);
    it.q = 'rare';
  }

  function rareCat(b) {
    if (b.cat === 'weapon') return 'weapon';
    if (b.type === 'helm' || b.type === 'circlet') return 'helm';
    if (b.type === 'gloves') return 'gloves';
    if (b.type === 'boots') return 'boots';
    if (b.type === 'belt') return 'belt';
    if (b.type === 'ring') return 'ring';
    if (b.type === 'amulet') return 'amulet';
    if (b.cat === 'charm') return 'charm';
    return 'armor';
  }

  function makeUnique(it, u, rng) {
    it.q = 'unique';
    it.uniq = u.id;
    it.stats = {};
    const s = u.stats;
    for (const k in s) {
      const v = s[k];
      if (k.endsWith('Dmg') && Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') it.stats[k] = v.slice();
      else if (k === 'aura') it.stats[k] = v;
      else it.stats[k] = rollRange(rng, v);
    }
    if (it.maxDur) { it.maxDur = Math.round(it.maxDur * 1.5); it.dur = it.maxDur; }
  }

  function makeSet(it, si, rng) {
    it.q = 'set';
    it.setItem = si.id;
    it.stats = {};
    for (const k in si.stats) {
      const v = si.stats[k];
      if (k.endsWith('Dmg') && Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') it.stats[k] = v.slice();
      else it.stats[k] = rollRange(rng, v);
    }
  }

  function baseWeight(b, ilvl) {
    const near = 1 - Math.abs(ilvl - b.qlvl) / (ilvl + 20);
    return Math.max(0.15, near) * (b.cat === 'weapon' ? 1 : b.cat === 'armor' ? 1.1 : 1);
  }

  function pickBase(rng, ilvl, filter) {
    const list = BASE_LIST.filter(b => (b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel' || b.cat === 'charm') && b.qlvl <= ilvl && (!filter || filter(b)));
    if (!list.length) return BASES.short_sword;
    return rng.weighted(list, b => (b.cat === 'jewel' ? 0.35 : b.cat === 'charm' ? 0.25 : 1) * baseWeight(b, ilvl));
  }

  function rollQuality(rng, ilvl, mf, bonus) {
    mf = mf || 0; bonus = bonus || 1;
    const mfU = mf * 250 / (mf + 250), mfS = mf * 500 / (mf + 500), mfR = mf * 600 / (mf + 600);
    const u = 0.004 * bonus * (1 + mfU / 100) * (1 + ilvl / 100);
    const s = 0.007 * bonus * (1 + mfS / 100);
    const r = 0.045 * Math.pow(bonus, 0.8) * (1 + mfR / 100);
    const m = Math.min(0.85, 0.26 * Math.pow(bonus, 0.6) * (1 + mf / 100));
    const x = rng.next();
    if (x < u) return 'unique';
    if (x < u + s) return 'set';
    if (x < u + s + r) return 'rare';
    if (x < u + s + r + m) return 'magic';
    if (x < u + s + r + m + 0.08) return 'superior';
    return 'normal';
  }

  function finishQuality(it, q, rng) {
    const b = BASES[it.base];
    if (b.cat === 'jewel' && (q === 'normal' || q === 'superior')) q = 'magic';
    if (b.cat === 'charm' && q !== 'unique' && q !== 'magic') q = 'magic';
    if (q === 'unique') {
      const cands = UNIQUES.filter(u => u.base === it.base && u.lvl <= it.ilvl);
      if (cands.length) { makeUnique(it, rng.pick(cands), rng); it.idf = false; return it; }
      q = b.cat === 'charm' ? 'magic' : 'rare';
    }
    if (q === 'set') {
      const cands = Object.values(SET_ITEMS).filter(s => s.base === it.base && s.lvl <= it.ilvl);
      if (cands.length) { makeSet(it, rng.pick(cands), rng); it.idf = false; return it; }
      q = b.cat === 'charm' ? 'magic' : 'rare';
    }
    if (q === 'rare' && b.cat === 'charm') q = 'magic';
    if (q === 'rare') { applyRare(it, rng); it.idf = false; return it; }
    if (q === 'magic') { applyMagic(it, rng); it.idf = false; return it; }
    if (q === 'superior' && (b.cat === 'weapon' || b.cat === 'armor')) {
      it.q = 'superior';
      if (b.cat === 'weapon') it.stats.ed = rng.int(5, 15); else it.stats.edef = rng.int(5, 15);
      if (it.maxDur) { it.maxDur += Math.round(it.maxDur * rng.int(5, 15) / 100); it.dur = it.maxDur; }
    }
    if ((it.q === 'normal' || it.q === 'superior') && b.sock && rng.chance(0.12)) {
      it.sockets = rng.int(1, Math.min(b.sock, it.ilvl < 25 ? 3 : it.ilvl < 40 ? 4 : 6));
      if (it.q === 'normal') it.q = 'socketed';
    }
    return it;
  }

  function rollItem(rng, ilvl, o) {
    o = o || {};
    const b = o.base ? BASES[o.base] : pickBase(rng, ilvl, o.filter);
    const it = makeItem(b.id, { ilvl, rng });
    if (b.qty) it.qty = rng.int(Math.floor(b.qty * 0.5), b.qty);
    const q = o.quality || rollQuality(rng, ilvl, o.mf, o.bonus);
    return finishQuality(it, q, rng);
  }

  function rollSpecial(rng, ilvl) {
    const pool = UNIQUES.map(u => ({ u })).concat(Object.values(SET_ITEMS).map(si => ({ si }))).filter(x => (x.u || x.si).lvl <= ilvl && BASES[(x.u || x.si).base].cat !== 'charm');
    if (!pool.length) return rollItem(rng, ilvl, { quality: 'rare' });
    const pick = rng.weighted(pool, x => 1 + (x.u || x.si).lvl / Math.max(1, ilvl));
    const def = pick.u || pick.si;
    const it = makeItem(def.base, { ilvl, rng });
    if (pick.u) makeUnique(it, def, rng); else makeSet(it, def, rng);
    it.idf = false;
    return it;
  }

  function gemOrRune(rng, ilvl) {
    const runes = D.RUNE_IDS.filter(id => BASES[id].qlvl <= ilvl + 6);
    if (!runes.length || rng.chance(0.55)) {
      const grades = [[0, 1], [1, 6], [2, 14], [3, 24], [4, 36]].filter(g => g[1] <= ilvl);
      const g = rng.weighted(grades, x => 1 / (1 + x[0] * 0.8));
      const t = rng.pick(D.GEM_TYPES);
      return makeItem(t.id + g[0]);
    }
    const r = rng.weighted(runes, id => Math.pow(0.62, BASES[id].rank));
    return makeItem(r);
  }

  function potionFor(rng, ilvl, kind) {
    const tier = ilvl < 6 ? 1 : ilvl < 14 ? 2 : ilvl < 30 ? 3 : ilvl < 50 ? 4 : 5;
    const t = Math.max(1, Math.min(5, tier + (rng.chance(0.25) ? -1 : 0)));
    if (kind === 'r' || (!kind && rng.chance(0.05))) return makeItem(ilvl > 30 && rng.chance(0.3) ? 'rv2' : 'rv1');
    const k = kind || (rng.chance(0.55) ? 'hp' : 'mp');
    return makeItem(k + t);
  }

  function baseOf(it) { return BASES[it.base]; }

  function prefixName(it) {
    if (it.pre === null || it.pre === undefined) return '';
    const a = AFFIXES[it.pre];
    return a.names[GI[baseOf(it).g] || 0];
  }

  const SUP = D.adjForms('Превосходн', 'y');

  function itemName(it) {
    const b = baseOf(it);
    if (it.q === 'unique') return D.UNIQUE_MAP[it.uniq].name;
    if (it.q === 'set') return SET_ITEMS[it.setItem].name;
    if (it.q === 'rare' || it.q === 'crafted') return it.rname;
    if (it.q === 'runeword') return it.rw ? RUNEWORDS.find(r => r.id === it.rw).name : b.name;
    if (it.q === 'magic') {
      const p = prefixName(it);
      const s = it.suf !== null && it.suf !== undefined ? ' ' + AFFIXES[it.suf].name : '';
      const bn = p ? b.name[0].toLowerCase() + b.name.slice(1) : b.name;
      return (p ? p + ' ' : '') + bn + s;
    }
    if (it.q === 'superior') return SUP[GI[b.g] || 0] + ' ' + b.name[0].toLowerCase() + b.name.slice(1);
    if (b.type === 'quiver' || b.type === 'key' || b.type === 'tome') return b.name;
    return b.name;
  }

  function shortName(it) {
    const b = baseOf(it);
    if (!it.idf && it.q !== 'normal' && it.q !== 'superior' && it.q !== 'socketed') return b.name;
    return itemName(it);
  }

  function nameColor(it) {
    const b = baseOf(it);
    if (b.type === 'quest' || b.type === 'questweapon') return COL.gold;
    if (b.type === 'rune') return COL.orange;
    if (it.q === 'socketed' || (it.sockets && (it.q === 'normal' || it.q === 'superior'))) return COL.gray;
    return D.QUALITY_COLOR[it.q] || COL.white;
  }

  function reqs(it) {
    const b = baseOf(it);
    let lvl = 1;
    if (it.q === 'unique') lvl = D.UNIQUE_MAP[it.uniq].req;
    else if (it.q === 'set') lvl = SET_ITEMS[it.setItem].req;
    else if (it.q === 'magic' || it.q === 'rare' || it.q === 'crafted') {
      const list = it.q === 'magic' ? [it.pre, it.suf] : it.affixes || [];
      for (const i of list) if (i !== null && i !== undefined) lvl = Math.max(lvl, Math.floor(AFFIXES[i].lvl * 0.8) + 1);
    }
    for (const s of it.socketed || []) lvl = Math.max(lvl, baseOf(s).qlvl);
    if (it.rw) {
      const rw = RUNEWORDS.find(r => r.id === it.rw);
      for (const r of rw.runes) lvl = Math.max(lvl, BASES['r_' + r].qlvl);
    }
    if (b.type === 'gem' || b.type === 'rune') lvl = b.qlvl;
    let str = b.str || 0, dex = b.dex || 0;
    const rp = (it.stats.reqPct || 0) + socketStat(it, 'reqPct');
    if (rp) { str = Math.ceil(str * (1 + rp / 100)); dex = Math.ceil(dex * (1 + rp / 100)); }
    return { lvl, str, dex, cls: b.cls || null };
  }

  function socketStat(it, key) {
    let v = 0;
    const b = baseOf(it);
    const slot = b.cat === 'weapon' ? 'sw' : b.type === 'shield' ? 'ss' : 'sa';
    for (const s of it.socketed || []) { const sb = baseOf(s); if (sb[slot] && typeof sb[slot][key] === 'number') v += sb[slot][key]; }
    return v;
  }

  function effectiveStats(it) {
    const out = {};
    if (it.maxDur && it.dur <= 0) return out;
    for (const k in it.stats) addStat(out, k, it.stats[k]);
    const b = baseOf(it);
    const slot = b.cat === 'weapon' ? 'sw' : b.type === 'shield' ? 'ss' : 'sa';
    for (const s of it.socketed || []) {
      const sb = baseOf(s);
      const src = sb[slot];
      if (!src) continue;
      for (const k in src) addStat(out, k, Array.isArray(src[k]) ? src[k].slice() : src[k]);
    }
    return out;
  }

  function weaponDamage(it) {
    const b = baseOf(it);
    if (!b.dmg) return null;
    const s = effectiveStats(it);
    const ed = s.ed || 0;
    const broken = it.maxDur && it.dur <= 0;
    const k = broken ? 0.5 : 1 + ed / 100;
    let mn = Math.floor(b.dmg[0] * k) + (s.mindmg || 0);
    let mx = Math.floor(b.dmg[1] * k) + (s.maxdmg || 0);
    if (mx < mn) mx = mn;
    let t = null;
    if (b.tdmg) t = [Math.floor(b.tdmg[0] * k) + (s.mindmg || 0), Math.max(Math.floor(b.tdmg[1] * k) + (s.maxdmg || 0), Math.floor(b.tdmg[0] * k))];
    return { min: mn, max: mx, t };
  }

  function armorDefense(it) {
    const b = baseOf(it);
    if (!b.def) return 0;
    const s = effectiveStats(it);
    const broken = it.maxDur && it.dur <= 0;
    return Math.floor(it.def * (1 + (s.edef || 0) / 100) * (broken ? 0.5 : 1)) + (s.def || 0);
  }

  function statText(k, v) {
    const n = Array.isArray(v) ? v : null;
    const sgn = x => (x >= 0 ? '+' : '') + x;
    if (k.startsWith('cls:')) { const c = CLASSES[k.slice(4)]; return sgn(v) + ' к навыкам класса «' + c.name + '»'; }
    if (k.startsWith('tree:')) { const [, c, t] = k.split(':'); return sgn(v) + ' к навыкам «' + CLASSES[c].trees[+t] + '» (' + CLASSES[c].name + ')'; }
    if (k.startsWith('sk:')) { const s = SKILLS[k.slice(3)]; return s ? sgn(v) + ' к навыку «' + s.name + '» (' + CLASSES[s.cls].name + ')' : ''; }
    switch (k) {
      case 'str': return sgn(v) + ' к силе';
      case 'dex': return sgn(v) + ' к ловкости';
      case 'vit': return sgn(v) + ' к живучести';
      case 'ene': return sgn(v) + ' к энергии';
      case 'life': return sgn(v) + ' к жизни';
      case 'mana': return sgn(v) + ' к мане';
      case 'manaPct': return 'Максимум маны +' + v + '%';
      case 'ar': return sgn(v) + ' к рейтингу атаки';
      case 'arPct': return sgn(v) + '% к рейтингу атаки';
      case 'ed': return sgn(v) + '% к урону';
      case 'mindmg': return sgn(v) + ' к минимальному урону';
      case 'maxdmg': return sgn(v) + ' к максимальному урону';
      case 'def': return sgn(v) + ' к защите';
      case 'edef': return sgn(v) + '% к защите';
      case 'resF': return 'Сопротивление огню ' + sgn(v) + '%';
      case 'resC': return 'Сопротивление холоду ' + sgn(v) + '%';
      case 'resL': return 'Сопротивление молнии ' + sgn(v) + '%';
      case 'resP': return 'Сопротивление яду ' + sgn(v) + '%';
      case 'resAll': return 'Все сопротивления ' + sgn(v);
      case 'fireDmg': return 'Урон огнём: ' + n[0] + '-' + n[1];
      case 'coldDmg': return 'Урон холодом: ' + n[0] + '-' + n[1];
      case 'lightDmg': return 'Урон молнией: ' + n[0] + '-' + n[1];
      case 'magicDmg': return 'Магический урон: ' + n[0] + '-' + n[1];
      case 'poisonDmg': return '+' + v + ' урона ядом за 3 сек.';
      case 'll': return v + '% урона возвращается жизнью';
      case 'ml': return v + '% урона возвращается маной';
      case 'ias': return sgn(v) + '% к скорости атаки';
      case 'fcr': return sgn(v) + '% к скорости заклинаний';
      case 'fhr': return sgn(v) + '% к восстановлению после удара';
      case 'frw': return sgn(v) + '% к скорости бега и ходьбы';
      case 'mf': return sgn(v) + '% к шансу найти магический предмет';
      case 'gf': return sgn(v) + '% золота с чудовищ';
      case 'regen': return 'Восстановление жизни ' + sgn(v);
      case 'manaRegen': return 'Восстановление маны +' + v + '%';
      case 'thorns': return 'Атакующий получает ' + v + ' урона';
      case 'block': return sgn(v) + '% к шансу блока';
      case 'dr': return 'Получаемый урон снижен на ' + v;
      case 'mdr': return 'Магический урон снижен на ' + v;
      case 'lr': return sgn(v) + ' к радиусу света';
      case 'kb': return 'Отбрасывает цель';
      case 'cb': return v + '% шанс сокрушительного удара';
      case 'ow': return v + '% шанс нанести открытую рану';
      case 'dstrike': return v + '% шанс смертельного удара';
      case 'mak': return '+' + v + ' к мане за каждое убийство';
      case 'lak': return '+' + v + ' к жизни за каждое убийство';
      case 'undead': return '+' + v + '% урона по нежити';
      case 'itd': return 'Игнорирует защиту цели';
      case 'itdPct': return '-' + v + '% к защите цели';
      case 'flee': return 'Удар обращает врага в бегство (' + v + '%)';
      case 'freeze': return 'Замораживает цель на ' + v + ' сек.';
      case 'cbf': return 'Не может быть заморожен';
      case 'hfd': return 'Заморозка вдвое короче';
      case 'allSkills': return sgn(v) + ' ко всем навыкам';
      case 'pierce': return v + '% шанс пробить насквозь';
      case 'repl': return 'Восполняет количество';
      case 'stamina': return sgn(v) + ' к выносливости';
      case 'reqPct': return 'Требования ' + v + '%';
      case 'vendor': return 'Торговцы снижают цены на ' + v + '%';
      case 'aura': return '';
      case 'auraLvl': return '';
      default: return '';
    }
  }

  const STAT_ORDER = ['allSkills', 'cls:', 'tree:', 'sk:', 'ias', 'fcr', 'fhr', 'frw', 'ed', 'mindmg', 'maxdmg', 'fireDmg', 'coldDmg', 'lightDmg', 'magicDmg', 'poisonDmg', 'ar', 'arPct', 'itd', 'itdPct', 'cb', 'dstrike', 'ow', 'll', 'ml', 'undead', 'kb', 'freeze', 'flee', 'pierce', 'edef', 'def', 'block', 'str', 'dex', 'vit', 'ene', 'life', 'mana', 'manaPct', 'stamina', 'resAll', 'resF', 'resC', 'resL', 'resP', 'dr', 'mdr', 'thorns', 'regen', 'manaRegen', 'lak', 'mak', 'mf', 'gf', 'lr', 'cbf', 'hfd', 'repl', 'reqPct', 'vendor'];
  function statRank(k) {
    for (let i = 0; i < STAT_ORDER.length; i++) if (k === STAT_ORDER[i] || (STAT_ORDER[i].endsWith(':') && k.startsWith(STAT_ORDER[i]))) return i;
    return 99;
  }

  function statLines(stats) {
    const keys = Object.keys(stats).sort((a, b) => statRank(a) - statRank(b));
    const out = [];
    if (stats.aura) out.push('Аура «' + SKILLS[stats.aura].name + '» ' + (stats.auraLvl || 1) + '-го уровня при ношении');
    for (const k of keys) {
      const t = statText(k, stats[k]);
      if (t) out.push(t);
    }
    return out;
  }

  const SPEED_NAMES = [[-25, 'Очень быстрая'], [-5, 'Быстрая'], [5, 'Обычная'], [15, 'Медленная'], [99, 'Очень медленная']];

  function describe(it, ctx) {
    ctx = ctx || {};
    const b = baseOf(it);
    const L = [];
    const col = nameColor(it);
    const ident = it.idf || it.q === 'normal' || it.q === 'superior' || it.q === 'socketed' || it.q === 'runeword';
    if (!ident) L.push({ t: b.name, c: col });
    else {
      L.push({ t: itemName(it), c: col });
      if (it.q === 'unique' || it.q === 'set' || it.q === 'rare' || it.q === 'crafted' || it.q === 'runeword') L.push({ t: b.name, c: col });
    }
    if (it.q === 'runeword') L.push({ t: "'" + RUNEWORDS.find(r => r.id === it.rw).runes.map(r => BASES['r_' + r].runeName).join('') + "'", c: COL.gold });
    if (b.type === 'gem' || b.type === 'rune') {
      L.push({ t: 'Можно вставить в гнездо', c: COL.white });
      L.push({ t: '', c: COL.white });
      const f = (lbl, src) => { const ls = statLines(src); if (ls.length) L.push({ t: lbl + ': ' + ls.join(', '), c: COL.white }); };
      f('Оружие', b.sw); f('Броня', b.sa); f('Щит', b.ss);
      L.push({ t: 'Требуется уровень: ' + b.qlvl, c: ctx.level !== undefined && ctx.level < b.qlvl ? COL.red : COL.white });
      return L;
    }
    if (b.cat === 'misc') {
      if (b.heal) L.push({ t: 'Восстанавливает ' + b.heal + ' жизни', c: COL.white });
      if (b.mana && b.type === 'mpot') L.push({ t: 'Восстанавливает ' + b.mana + ' маны', c: COL.white });
      if (b.rejuv) L.push({ t: 'Восстанавливает ' + Math.round(b.rejuv * 100) + '% жизни и маны', c: COL.white });
      if (b.type === 'tome') L.push({ t: 'Количество: ' + it.qty, c: COL.white });
      if (b.type === 'key' || b.type === 'quiver') L.push({ t: 'Количество: ' + it.qty + ' из ' + b.maxQty, c: COL.white });
      if (b.type === 'scroll' || b.type === 'tome') L.push({ t: 'Правый щелчок — прочитать', c: COL.dim });
      if (b.type === 'hpot' || b.type === 'mpot' || b.type === 'rpot') L.push({ t: 'Правый щелчок — выпить', c: COL.dim });
      if (b.type === 'quest' && b.id === 'q_scroll2') L.push({ t: 'Порядок камней: ' + (ctx.cairn || []).map(i => D.CAIRN_RUNES[i]).join(' '), c: COL.white });
      if (b.type === 'quest' && b.id === 'q_tome') L.push({ t: 'Правый щелчок — прочитать', c: COL.dim });
      if (b.dmg) L.push({ t: 'Урон одной рукой: ' + b.dmg[0] + '-' + b.dmg[1], c: COL.white });
      if (b.type === 'questweapon') L.push({ t: 'Урон одной рукой: 2-8', c: COL.white });
      return L;
    }
    if (b.cat === 'weapon') {
      const d = weaponDamage(it);
      const s = effectiveStats(it);
      const blue = (s.ed || s.mindmg || s.maxdmg) ? COL.blue : COL.white;
      if (d.t) L.push({ t: 'Урон при броске: ' + d.t[0] + '-' + d.t[1], c: blue });
      L.push({ t: (b.hands === 2 ? 'Урон двумя руками: ' : 'Урон одной рукой: ') + d.min + '-' + d.max, c: blue });
    }
    if (b.def) {
      const s = effectiveStats(it);
      L.push({ t: 'Защита: ' + armorDefense(it), c: (s.edef || s.def) ? COL.blue : COL.white });
      if (b.block) L.push({ t: 'Шанс блока: ' + (b.block + (s.block || 0)) + '%', c: s.block ? COL.blue : COL.white });
    }
    if (it.maxDur) L.push({ t: 'Прочность: ' + it.dur + ' из ' + it.maxDur, c: it.dur <= 0 ? COL.red : COL.white });
    if (b.qty) L.push({ t: 'Количество: ' + it.qty + ' из ' + b.qty, c: COL.white });
    if (b.cls) L.push({ t: '(Только для класса «' + CLASSES[b.cls].name + '»)', c: ctx.cls && ctx.cls !== b.cls ? COL.red : COL.white });
    const r = reqs(it);
    if (r.dex) L.push({ t: 'Требуется ловкость: ' + r.dex, c: ctx.dex !== undefined && ctx.dex < r.dex ? COL.red : COL.white });
    if (r.str) L.push({ t: 'Требуется сила: ' + r.str, c: ctx.str !== undefined && ctx.str < r.str ? COL.red : COL.white });
    if (r.lvl > 1) L.push({ t: 'Требуется уровень: ' + r.lvl, c: ctx.level !== undefined && ctx.level < r.lvl ? COL.red : COL.white });
    if (b.cat === 'weapon') {
      const sn = SPEED_NAMES.find(x => b.wsm <= x[0]);
      L.push({ t: 'Скорость атаки: ' + sn[1], c: COL.white });
    }
    if (!ident) { L.push({ t: 'Не опознано', c: COL.red }); return L; }
    const own = Object.assign({}, it.stats);
    delete own.ed; delete own.edef;
    if (b.cat === 'weapon') { delete own.mindmg; delete own.maxdmg; }
    if (b.cat === 'armor') delete own.def;
    const edl = [];
    if (it.stats.ed && b.cat === 'weapon') edl.push('+' + it.stats.ed + '% к урону');
    if (it.stats.edef && b.cat === 'armor') edl.push('+' + it.stats.edef + '% к защите');
    if (it.stats.def && b.cat === 'armor') edl.push('+' + it.stats.def + ' к защите');
    if (b.cat === 'weapon' && it.stats.mindmg) edl.push('+' + it.stats.mindmg + ' к минимальному урону');
    if (b.cat === 'weapon' && it.stats.maxdmg) edl.push('+' + it.stats.maxdmg + ' к максимальному урону');
    const lines = edl.concat(statLines(own));
    const sock = {};
    const slot = b.cat === 'weapon' ? 'sw' : b.type === 'shield' ? 'ss' : 'sa';
    for (const s of it.socketed || []) { const src = baseOf(s)[slot]; if (src) for (const k in src) addStat(sock, k, Array.isArray(src[k]) ? src[k].slice() : src[k]); }
    const sl = statLines(sock);
    for (const t of lines.concat(sl)) L.push({ t, c: COL.blue });
    if (it.sockets) L.push({ t: 'Гнёзда (' + it.sockets + ')' + (it.socketed.length ? ' — занято ' + it.socketed.length : ''), c: COL.blue });
    if (it.q === 'set') {
      const si = SET_ITEMS[it.setItem];
      const set = SETS.find(s => s.id === si.set);
      const worn = ctx.setCount ? ctx.setCount(set.id) : 0;
      for (const n in si.part) { const ls = statLines(si.part[n]); for (const t of ls) L.push({ t: t + ' (' + n + ' предмета)', c: worn >= +n ? COL.green : COL.dark }); }
      L.push({ t: '', c: COL.white });
      L.push({ t: set.name, c: COL.gold });
      for (const x of set.items) L.push({ t: x.name, c: ctx.hasSetItem && ctx.hasSetItem(x.id) ? COL.green : COL.red });
      for (const n in set.bonus) { const ls = statLines(set.bonus[n]); for (const t of ls) L.push({ t: t + (+n === set.items.length ? ' (полный комплект)' : ' (' + n + ' предмета)'), c: worn >= +n ? COL.gold : COL.dark }); }
    }
    return L;
  }

  function baseValue(b) {
    let v = 40 + b.qlvl * b.qlvl * 4;
    if (b.dmg) v += (b.dmg[0] + b.dmg[1]) * 3;
    if (b.def) v += b.def[1] * 3;
    if (b.cost) v = b.cost;
    return v;
  }

  function value(it) {
    const b = baseOf(it);
    let v = baseValue(b);
    if (b.type === 'tome') return b.cost + (it.qty || 0) * (b.spell === 'tp' ? 100 : 80);
    if (b.type === 'key') return b.cost * (it.qty || 1);
    if (b.type === 'quiver') return Math.round(b.cost * (it.qty || 0) / b.maxQty) + 5;
    if (b.cat === 'misc') return v;
    const mul = { normal: 1, socketed: 1.4, superior: 1.5, magic: 3, rare: 7, set: 9, unique: 12, runeword: 15, crafted: 8 }[it.q] || 1;
    v = v * mul + Object.keys(it.stats).length * 60 * (it.ilvl / 10 + 1);
    if (b.cat === 'jewel') v *= 1.6;
    if (b.qty && b.qty > 0) v = v * (0.3 + 0.7 * (it.qty || 0) / b.qty);
    return Math.round(v);
  }

  function sellPrice(it, clvl) {
    const b = baseOf(it);
    if (b.type === 'quest' || b.type === 'questweapon') return 0;
    return Math.max(1, Math.min(Math.floor(value(it) / 4), 5000 + clvl * 2000));
  }

  function buyPrice(it, discount) { return Math.max(1, Math.round(value(it) * (1 - (discount || 0) / 100))); }

  function repairCost(it) {
    if (!it.maxDur && !(baseOf(it).qty)) return 0;
    let c = 0;
    if (it.maxDur) c += Math.ceil((it.maxDur - it.dur) / it.maxDur * value(it) * 0.25);
    const b = baseOf(it);
    if (b.qty && it.qty < b.qty) c += Math.ceil((b.qty - it.qty) * 2);
    return c;
  }

  function canSocket(it, gem) {
    const gb = baseOf(gem);
    if (gb.type !== 'gem' && gb.type !== 'rune') return false;
    return it.sockets > (it.socketed || []).length;
  }

  function socketInto(it, gem) {
    it.socketed = it.socketed || [];
    it.socketed.push(gem);
    const b = baseOf(it);
    if (it.socketed.length === it.sockets && (it.q === 'socketed' || it.q === 'normal' || it.q === 'superior')) {
      const runes = it.socketed.map(s => baseOf(s).rune);
      if (runes.every(Boolean)) {
        const rw = RUNEWORDS.find(r => r.runes.length === runes.length && r.runes.every((x, i) => x === runes[i]) && r.types.includes(b.type));
        if (rw) {
          it.q = 'runeword';
          it.rw = rw.id;
          for (const k in rw.stats) addStat(it.stats, k, Array.isArray(rw.stats[k]) ? rw.stats[k].slice() : rw.stats[k]);
          return rw;
        }
      }
    }
    return null;
  }

  function imbue(it, rng, clvl) {
    it.ilvl = Math.max(it.ilvl, clvl + 4);
    applyRare(it, rng);
    it.idf = true;
    it.sockets = 0;
    it.socketed = [];
    return it;
  }

  class Grid {
    constructor(w, h) { this.w = w; this.h = h; this.items = []; }
    fits(it, x, y, ignore) {
      const b = baseOf(it);
      if (x < 0 || y < 0 || x + b.w > this.w || y + b.h > this.h) return false;
      for (const o of this.items) {
        if (o === ignore) continue;
        const ob = baseOf(o);
        if (x < o.x + ob.w && x + b.w > o.x && y < o.y + ob.h && y + b.h > o.y) return false;
      }
      return true;
    }
    overlaps(it, x, y) {
      const b = baseOf(it);
      return this.items.filter(o => { const ob = baseOf(o); return x < o.x + ob.w && x + b.w > o.x && y < o.y + ob.h && y + b.h > o.y; });
    }
    at(x, y) {
      for (const o of this.items) { const ob = baseOf(o); if (x >= o.x && x < o.x + ob.w && y >= o.y && y < o.y + ob.h) return o; }
      return null;
    }
    spot(it) {
      const b = baseOf(it);
      for (let x = 0; x <= this.w - b.w; x++) for (let y = 0; y <= this.h - b.h; y++) if (this.fits(it, x, y)) return { x, y };
      return null;
    }
    add(it, x, y) {
      if (x === undefined) { const s = this.spot(it); if (!s) return false; x = s.x; y = s.y; }
      if (!this.fits(it, x, y)) return false;
      it.x = x; it.y = y;
      this.items.push(it);
      return true;
    }
    remove(it) { const i = this.items.indexOf(it); if (i >= 0) this.items.splice(i, 1); return i >= 0; }
  }

  function serialize(it) {
    const o = Object.assign({}, it);
    if (o.socketed) o.socketed = o.socketed.map(serialize);
    return o;
  }

  function deserialize(o) {
    const it = Object.assign({}, o);
    it.socketed = (o.socketed || []).map(deserialize);
    it.stats = Object.assign({}, o.stats || {});
    if (!BASES[it.base]) return null;
    return it;
  }

  function isStackable(b) { return b.type === 'key' || b.type === 'quiver'; }

  Object.assign(D, {
    makeItem, rollItem, rollSpecial, rollQuality, finishQuality, gemOrRune, potionFor, itemName, shortName, nameColor, reqs, effectiveStats, weaponDamage, armorDefense,
    statText, statLines, describe, value, sellPrice, buyPrice, repairCost, canSocket, socketInto, imbue, Grid, serialize, deserialize, baseOf, typeMatch,
    isStackable, addStat, applyMagic, applyRare, makeUnique, makeSet, pickBase
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
