(function (H) {
  'use strict';
  const T = H.TUNING;
  const { atkOf, alive } = H.battleStat;

  const STEADY = 'С колена';
  const STAR = 'Команда Звёздных рыцарей';
  const FIELD = 'Энергетическое поле';
  const CHAIN = 'Цепочка атак';

  const KITS = {
    billy: {
      name: 'Билли', fullName: 'Билли Кид', path: 'erudition', elem: 'phys', rarity: 4, energy: 120, faction: 'hares',
      base: { hp: 128, atk: 86, def: 50, spd: 104 },
      look: { face: 'visor', skin: '#2a2c34', hair: '#e2e0dc', hairHi: '#ffffff', eye: '#f2c840', eye2: '#fff0a0', bangs: 'neat', sides: 'none', back: 'short', crown: 'spiky', body: 'tall', sex: 'm', legGap: 3, coat: 'kid', top: '#c8282e', inner: '#22242c', trim: '#f4f4f6', collar: 'high', lower: '#30323c', low: 'pants', shoes: '#1e1e24', gloves: '#26282e', acc: ['tallspikes', 'chainbelt:#1c1c22', 'holster:#6a4c3a', 'pantseam:#22242c', 'kneeskull:#d8dce4', 'soles:#f0f0f2', 'sneakers:#e8e8ec', 'revolvers:#2a2c34'] },
      basic: { name: 'Огонь из всех стволов', target: 'bounce', text: '3 выстрела по случайным врагам, по ' + Math.round(T.billyShot * 100) + '% атаки.', fx: [{ k: 'dmg', m: T.billyShot, hits: 3, tough: 5 }] },
      skill: { name: 'Время ликвидации', target: 'all', text: 'физический урон ' + Math.round(T.billySkill * 100) + '% всем врагам. Сбрасывает «С колена».', fx: [{ k: 'dmg', m: T.billySkill, tough: 10 }] },
      ult: { name: 'Сияние звёздного света', target: 'all', text: 'физический урон ' + Math.round(T.billyUlt * 100) + '% всем врагам. Заряды Звёздных рыцарей усиливают удар.', fx: [{ k: 'dmg', m: T.billyUlt, tough: 20 }] },
      talent: 'Базовые атаки подряд: «С колена», урон +25% за уровень (до 2). Навык и пропуск хода сбрасывают.',
      link: { name: STAR, text: 'Со следом цепочка атак или доп. атака союзника даёт заряд (до 2), абс. техника +50% за заряд.' },
      tech: { name: 'Кара звёздного света', text: 'Удар по всем врагам в начале боя, Билли начинает с 1 уровнем «С колена».', fx: 'billyTech' },
      contact: [{ name: 'Поза Звёздного рыцаря', tag: 'joke' }, { name: 'Ни с места, детка', tag: 'threat' }]
    },
    nicole: {
      name: 'Николь', fullName: 'Николь Демара', path: 'nihility', elem: 'quant', rarity: 4, energy: 110, faction: 'hares',
      base: { hp: 144, atk: 70, def: 63, spd: 103 },
      look: { skin: '#fae0d4', hair: '#f2a0b2', hairHi: '#ffc8d4', eye: '#8ac83a', eye2: '#c4e878', bangs: 'sidepart', sides: 'long', back: 'twinwave', crown: 'smooth', gloss: true, body: 'f', coat: 'gyaru', top: '#1e1e24', inner: '#f4f4f6', trim: '#f4f4f6', collar: 'bare', lower: '#26262e', low: 'shorts', shoes: '#1c1c22', bootsTo: 'calf', cuff: '#f4f4f6', acc: ['twintails', 'tiebows:#1c1c22', 'hairclip:#e8c030', 'earring:#e0b030', 'choker:#1c1c22', 'detsleeves:#1e1e24', 'furhem:#f2f0ec', 'ringbelt:#2a2a30', 'bunnybag:#a8d23a', 'stocking1:#22222a', 'rips:#fae0d4', 'garter2:#2a2a30', 'socks:#22222a', 'boots:#1c1c22', 'mechcase:#2e2e34'] },
      basic: { name: 'Коварное комбо', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      enhanced: { name: 'Творю что хочу', target: 'blast', text: 'квантовый урон по площади, продлевает поле на ход.', fx: [{ k: 'dmg', m: T.caseHit, adj: T.caseAdj }, { k: 'caseShot' }] },
      skill: { name: 'Сахарная пуля с начинкой', target: 'blast', text: 'Энергетическое поле на 2 хода Николь: защита врагов −' + Math.round(T.fieldDef * 100) + '%, все враги считаются соседями цели. Урон по площади.', fx: [{ k: 'field', turns: T.fieldTurns }, { k: 'dmg', m: T.nicoleSkill, adj: T.nicoleSkillAdj }, { k: 'caseLoad' }] },
      ult: { name: 'Эфирная граната', target: 'all', text: 'поле на 2 хода, квантовый урон ' + Math.round(T.nicoleUlt * 100) + '% всем. Союзникам +10 энергии, следующему в очереди ещё +20.', fx: [{ k: 'field', turns: T.fieldTurns }, { k: 'dmg', m: T.nicoleUlt }, { k: 'nicoleEnergy' }, { k: 'caseLoad' }] },
      talent: 'После навыка и абс. техники 2 базовые атаки бьют по площади и продлевают поле на ход.',
      link: { name: 'У хитрого зайца три норы', text: 'Со следом враги в поле получают квантовый урон +' + Math.round(T.fieldQuant * 100) + '%.' },
      tech: { name: 'Шкатулка с сюрпризом', text: 'Бой начинается с энергетическим полем на 1 ход.', fx: 'nicoleTech' },
      contact: [{ name: 'Предложить сделку', tag: 'bribe' }, { name: 'Резвая зайка', tag: 'cute' }]
    },
    anby: {
      name: 'Энби', fullName: 'Энби Демара', path: 'hunt', elem: 'elec', rarity: 4, energy: 120, faction: 'hares',
      base: { hp: 134, atk: 79, def: 54, spd: 108 },
      look: { skin: '#fae4d8', hair: '#e2e4ec', hairHi: '#ffffff', eye: '#d8702a', eye2: '#f4a860', bangs: 'wisp', sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, body: 'petite', coat: 'volt', top: '#a6d63c', inner: '#1c1e22', trim: '#a6d63c', sleeve: '#22242a', collar: 'bare', lower: '#1c1c22', low: 'skirt', skirtLen: 7, shoes: '#a6d63c', gloves: '#1e2024', acc: ['headphones:#1e2024', 'choker:#1c1e22', 'stockings:#22242a', 'stockband:#d8402a', 'garter2:#2a2c32', 'tagbelt:#2a2c32', 'soles:#e8e8ee', 'voltblade:#30323a'] },
      basic: { name: 'Турборазряд', target: 'single', text: 'урон молнией 100%, +1 к Серии.', fx: [{ k: 'dmg', m: 1.0, tough: 10 }, { k: 'series' }] },
      enhanced: { name: 'Гром', target: 'single', text: 'урон молнией ' + Math.round(T.thunder * 100) + '%, сильный удар по стойкости. Серия обнуляется.', fx: [{ k: 'dmg', m: T.thunder, tough: 25 }, { k: 'seriesReset' }] },
      skill: { name: 'Удар молнии', target: 'single', text: 'урон молнией ' + Math.round(T.anbySkill * 100) + '%. После Серии 3 стойкость +64%. Серия обнуляется.', fx: [{ k: 'dmg', m: T.anbySkill, tough: 25, volt: true }, { k: 'seriesReset' }] },
      ult: { name: 'Овердрайв', target: 'single', text: 'урон молнией ' + Math.round(T.anbyUlt * 100) + '% и огромный удар по стойкости. Серия сразу 3.', fx: [{ k: 'dmg', m: T.anbyUlt, tough: 45 }, { k: 'seriesFull' }] },
      talent: 'Серия 1-2-3, затем «Гром». Пока Энби в отряде, любое пробитие открывает Цепочку атак.',
      link: { name: 'Параллельный контур', text: 'Со следом союзник, ударивший Цепочкой атак, получает +10 энергии.' },
      tech: { name: 'Разрядная дуга', text: 'Удар молнией по всем врагам в начале боя.', fx: 'anbyTech' },
      contact: [{ name: 'Пересказать фильм', tag: 'weird' }, { name: 'Цель определена', tag: 'silent' }]
    }
  };

  const FUSIONS = {
    f_hares: { name: '«Хитрые зайцы» в деле', members: ['nicole', 'anby', 'billy'], target: 'all', text: 'Поле Николь, молния Энби и залп Билли по всем врагам. Билли получает 2 заряда.', fx: [{ k: 'field', turns: T.fieldTurns, statOf: 'nicole' }, { k: 'dmg', m: 1.4, e: 'elec', tough: 20, statOf: 'anby' }, { k: 'dmg', m: 1.4, e: 'phys', tough: 10, statOf: 'billy' }, { k: 'starFull' }] },
    f_starknight: { name: 'Главная тема «Звёздного рыцаря»', members: ['billy', 'anby'], target: 'all', text: 'Энби включает главную тему, Билли бьёт «Миражом звёздного света» по всем. Серия Энби сразу 3.', fx: [{ k: 'dmg', m: 1.6, e: 'phys', tough: 10, statOf: 'billy' }, { k: 'dmg', m: 1.0, e: 'elec', tough: 20, statOf: 'anby' }, { k: 'seriesFull' }] },
    f_katana: { name: 'Катана в залог', members: ['nicole', 'miyabi'], target: 'all', text: 'Николь возвращает катану: поле стягивает врагов, Мияби бьёт льдом по всем, +3 Изморози.', fx: [{ k: 'field', turns: T.fieldTurns, statOf: 'nicole' }, { k: 'dmg', m: 2.0, e: 'ice', tough: 20, charged: true, statOf: 'miyabi' }, { k: 'frost', v: 3, who: 'member:miyabi' }] }
  };

  const CONES = {
    starlight: {
      name: 'Звёздные рыцари не проигрывают', path: 'erudition', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Финальная серия', sig: 'billy',
      tpl: 'Атака владельца повышается на #1%, урон базовой атаки на #2%. После абсолютной техники физический урон владельца повышается на #3% на 2 хода.', p: [[0.16, 0.2, 0.16], [0.2, 0.25, 0.2], [0.24, 0.3, 0.24], [0.28, 0.35, 0.28], [0.32, 0.4, 0.32]], bonus: { atkP: 1 }, fx: 'starlight',
      desc: 'На экране Звёздный рыцарь поднимается в последний раз. Музыка, титры, реклама лапши.\nБилли не двигается. На коленях у него два револьвера, рядом тряпка и банка масла.\n«Видели? Он встал. Звёздные рыцари не проигрывают».\nСчёт за обслуживание лежит на полу. Его можно оплатить и завтра.'
    },
    vault: {
      name: 'Как купить солнце', path: 'nihility', rarity: 4, own: true, stats: { hp: 43.2, atk: 19.2, def: 18 }, skill: 'Сегодня за счёт заведения', sig: 'nicole',
      tpl: 'Шанс эффекта владельца повышается на #1%. После навыка или абсолютной техники задетые враги получают на #2% больше урона 2 хода, а владелец восстанавливает #3 энергии.', p: [[0.16, 0.12, 3], [0.2, 0.15, 3.75], [0.24, 0.18, 4.5], [0.28, 0.21, 5.25], [0.32, 0.24, 6]], bonus: { ehr: 1 }, fx: 'vault',
      desc: 'Денни, которые они собирали всем приютом, не хватило бы даже на половину костюма.\nТогда Николь сказала, что они купят солнце.\nОна встала у окна с маленьким зеркальцем, и солнечный зайчик лёг на подушку её подруги.\n«Сколько с тебя? Нисколько. Сегодня за счёт заведения».'
    },
    battery: {
      name: 'Трек без названия', path: 'hunt', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Своя тема', sig: 'anby',
      tpl: 'Урон молнией владельца повышается на #1%. После Цепочки атак или бонус-атаки восстановление энергии владельца повышается на #2% на 2 хода.', p: [[0.15, 0.12], [0.1875, 0.15], [0.225, 0.18], [0.2625, 0.21], [0.3, 0.24]], bonus: { elecP: 1 }, fx: 'battery',
      desc: 'Фильм закончился, титры отыграли, а мелодия в наушниках осталась.\nЭнби сама придумала её по дороге: шаги, ветер, сирена где-то далеко.\nНа крыше агентства она достаёт маркер и пишет на кассете своё имя.\n«В кино у героя всегда есть своя тема. Значит, у меня тоже будет».'
    }
  };

  const FX = ['field', 'caseLoad', 'caseShot', 'nicoleEnergy', 'series', 'seriesReset', 'seriesFull', 'starFull'];
  const IDS = Object.keys(KITS);

  const coneK = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);
  const ally = (b, id) => b.allies.find(a => a.charId === id && alive(a)) || null;
  const free = a => alive(a) && !a.flags.away && !a.frozen && !(a.flags.collapse > 0) && !a.swallowed && !a.caged;

  Object.assign(H.Battle.prototype, {
    haresStart() {
      this.field = null;
      this.chainQ = [];
      this.chainUsed = null;
      this.chainCur = null;
      this.chainResume = null;
      this.nicoleNext = null;
      for (const a of this.allies) {
        if (a.charId === 'billy') { a.flags.steady = 0; a.flags.star = 0; }
        if (a.charId === 'nicole') a.flags.caseShots = 0;
        if (a.charId === 'anby') a.flags.series = 0;
      }
    },

    hareLink(u) {
      return !!u && this.allies.some(a => a !== u && a.kit && (a.elem === u.elem || a.kit.faction === 'hares'));
    },

    setSteady(u, v) {
      if (!u || u.charId !== 'billy') return;
      const before = u.flags.steady || 0;
      u.flags.steady = Math.max(0, Math.min(T.steadyMax, v));
      if (u.flags.steady !== before) this.push({ t: 'steady', u, v: u.flags.steady, text: u.flags.steady ? STEADY + ' ' + u.flags.steady : STEADY + ': сброс' });
    },

    setStar(u, v) {
      if (!u || u.charId !== 'billy') return;
      const before = u.flags.star || 0;
      u.flags.star = Math.max(0, Math.min(T.starMax, v));
      if (u.flags.star > before) this.push({ t: 'star', u, v: u.flags.star, text: 'Звёздный рыцарь ' + u.flags.star });
      else if (u.flags.star !== before) this.push({ t: 'star', u, v: u.flags.star });
    },

    setSeries(u, v) {
      if (!u || u.charId !== 'anby') return;
      u.flags.series = Math.max(0, Math.min(T.seriesMax, v));
      this.push({ t: 'series', u, v: u.flags.series });
    },

    fieldOn() { return !!this.field && alive(this.field.src) && this.field.turns > 0; },

    setField(src, turns) {
      if (!alive(src)) return;
      const n = Math.min(T.fieldMax, turns + (this.current === src ? 1 : 0));
      const cur = this.field && this.field.src === src ? this.field.turns : 0;
      this.field = { src, turns: Math.max(cur, n) };
      this.push({ t: 'field', on: true, src, turns: this.field.turns, text: FIELD });
    },

    endField() {
      if (!this.field) return;
      this.field = null;
      this.push({ t: 'field', on: false });
    },

    fieldK(src) { return Object.assign({ def: T.fieldDef, quant: T.fieldQuant }, (this.kitFx && src && this.kitFx(src, 'fieldK')) || {}); },

    haresDef(t) { return t && t.side === 'enemy' && this.fieldOn() ? this.fieldK(this.field.src).def : 0; },

    haresAdj(list, t) {
      if (!t || t.side !== 'enemy' || !this.fieldOn()) return null;
      return list.filter(x => x !== t);
    },

    voltMul(u) {
      if (!u || u.charId !== 'anby') return 1;
      const up = (this.kitFx && this.kitFx(u, 'voltUp')) || 0;
      return ((u.flags.series || 0) >= T.seriesMax ? 1 + T.voltTough * (this.traceTalent ? this.traceTalent(u) : 1) : 1) * (1 + up);
    },

    haresDmg(src, tgt, o) {
      if (src.side !== 'ally') return 0;
      let v = 0;
      const e = o.e || src.elem;
      if (src.charId === 'billy' && !o.isDot) {
        v += T.steadyStep * (this.traceTalent ? this.traceTalent(src) : 1) * (src.flags.steady || 0);
        if (o.kind === 'ult') v += T.starTeam * (src.flags.star || 0);
      }
      if (o.kind === 'basic') v += coneK(src, 'starlight', 2);
      if (e === 'quant' && tgt.side === 'enemy' && this.fieldOn() && this.hareLink(this.field.src)) v += this.fieldK(this.field.src).quant;
      return v;
    },

    haresFollow(u, kind) {
      if (!u || u.side !== 'ally') return;
      const bl = ally(this, 'billy');
      if (bl && (bl !== u || kind === 'chain') && this.hareLink(bl) && (!this.hasBonus || this.hasBonus(bl, 'a2'))) { this.setStar(bl, (bl.flags.star || 0) + 1); if (this.kitFx) this.kitFx(bl, 'starGain'); }
      const bt = coneK(u, 'battery', 2);
      if (bt) this.addBuff(u, { s: 'err', v: bt, turns: 2, name: 'Своя тема' }, true);
    },

    haresHurt(tgt, dmg) {
      if (tgt.charId === 'billy' && tgt.side === 'ally' && (tgt.flags.steady || 0) > 0 && dmg >= tgt.maxHp * T.steadyKnock && !(this.kitFx && this.kitFx(tgt, 'steadyHold'))) { this.setSteady(tgt, 0); if (this.kitFx) this.kitFx(tgt, 'knocked'); }
    },

    haresSkip(u) { if (u.charId === 'billy') this.setSteady(u, 0); },

    haresTurn(u) {
      const n = this.nicoleNext;
      if (n && u !== n.src && u.side === 'ally') {
        this.nicoleNext = null;
        this.gainEnergy(u, n.v);
        this.push({ t: 'status', u, text: 'Энергия +' + n.v, col: '#c88aff' });
      }
    },

    haresEnd(u) {
      if (this.field && this.field.src === u && --this.field.turns <= 0) this.endField();
    },

    haresAbility(u, kind) {
      if (kind !== 'basic') return null;
      if (u.charId === 'nicole' && (u.flags.caseShots || 0) > 0) return { ab: u.kit.enhanced, kind: 'enhanced' };
      if (u.charId === 'anby' && (u.flags.series || 0) >= T.seriesMax) return { ab: u.kit.enhanced, kind: 'enhanced' };
      return null;
    },

    haresTech(fx, src) {
      switch (fx) {
        case 'billyTech':
          for (const e of this.living.slice()) this.hit(src, e, T.billyTechHit, { e: 'phys', tough: 10 });
          this.setSteady(src, 1);
          return true;
        case 'nicoleTech': this.setField(src, 1); return true;
        case 'anbyTech':
          for (const e of this.living.slice()) this.hit(src, e, 0.5, { e: 'elec', tough: 10 });
          return true;
      }
      return false;
    },

    haresFx(f, actor, src, R, hitSet) {
      switch (f.k) {
        case 'field': this.setField(src, (f.turns || T.fieldTurns) + ((this.kitFx && this.kitFx(src, 'fieldTurns', this.actKind)) || 0)); return true;
        case 'caseLoad': if (src.charId === 'nicole') { const n = T.caseShots + ((this.kitFx && this.kitFx(src, 'caseExtra')) || 0); src.flags.caseShots = n; this.push({ t: 'case', u: src, v: n }); } return true;
        case 'caseShot':
          if (src.charId === 'nicole') { src.flags.caseShots = Math.max(0, (src.flags.caseShots || 0) - 1); this.push({ t: 'case', u: src, v: src.flags.caseShots }); if (this.kitFx) this.kitFx(src, 'caseFired', R); }
          if (this.fieldOn() && T.caseExtend > 0) { this.field.turns = Math.min(T.fieldMax, this.field.turns + T.caseExtend); this.push({ t: 'field', on: true, src: this.field.src, turns: this.field.turns }); }
          return true;
        case 'nicoleEnergy':
          for (const a of this.livingAllies) if (a !== src) this.gainEnergy(a, T.nicoleEnergy);
          this.nicoleNext = { src, v: T.nicoleNext };
          this.push({ t: 'status', u: src, text: 'Энергия отряду +' + T.nicoleEnergy, col: '#c88aff' });
          return true;
        case 'series': this.setSeries(src, (src.flags.series || 0) + 1); return true;
        case 'seriesReset': this.setSeries(src, 0); return true;
        case 'seriesFull': { const an = ally(this, 'anby'); if (an) this.setSeries(an, T.seriesMax); return true; }
        case 'starFull': { const bl = ally(this, 'billy'); if (bl) this.setStar(bl, T.starMax); return true; }
      }
      return false;
    },

    haresAfter(u, kind, hits) {
      if (u.charId === 'billy') {
        if (kind === 'basic') this.setSteady(u, (u.flags.steady || 0) + 1);
        else if (kind === 'skill') this.setSteady(u, 0);
        else if (kind === 'ult') this.setStar(u, 0);
      }
      const sl = coneK(u, 'starlight', 3);
      if (sl && kind === 'ult') this.addBuff(u, { s: 'physP', v: sl, turns: 2, name: 'Финальная серия' });
      const vt = coneK(u, 'vault', 2);
      if (vt && (kind === 'skill' || kind === 'ult') && hits.length) {
        for (const t of hits) if (alive(t)) this.addBuff(t, { s: 'vuln', v: vt, turns: 2, name: 'Сегодня за счёт заведения', debuff: true });
        this.gainEnergy(u, coneK(u, 'vault', 3));
      }
    },

    anbyOn() { return this.allies.some(a => a.charId === 'anby' && alive(a) && !a.flags.away); },

    haresBreak(src, tgt) {
      if (!src || src.side !== 'ally' || tgt.side !== 'enemy' || !this.anbyOn()) return;
      this.chainQ.push({ tgt, by: src });
    },

    chainCands(c) {
      const used = this.chainUsed || new Set();
      return this.livingAllies.filter(a => free(a) && a !== c.by && !used.has(a));
    },

    nextChain() {
      while (this.chainQ.length) {
        const c = this.chainQ[0];
        if (alive(c.tgt) && !this.over) {
          const cands = this.chainCands(c);
          if (cands.length) { this.chainCur = { tgt: c.tgt, by: c.by, cands }; return true; }
        }
        this.chainQ.shift();
      }
      this.chainCur = null;
      return false;
    },

    haresHold(resume) {
      if (this.over || !this.chainQ || !this.chainQ.length) return false;
      if (!this.chainUsed) this.chainUsed = new Set();
      if (!this.nextChain()) { this.chainUsed = null; return false; }
      this.chainResume = resume;
      this.phase = 'chain';
      this.push({ t: 'chainAsk', u: this.chainCur.tgt, by: this.chainCur.by, cands: this.chainCur.cands.slice() });
      return true;
    },

    chainReady() { return this.phase === 'chain' && !!this.chainCur; },

    chain(pick) {
      if (!this.chainReady()) return false;
      const c = this.chainCur;
      this.chainQ.shift();
      this.chainCur = null;
      if (pick && c.cands.includes(pick) && free(pick) && alive(c.tgt)) this.chainHit(pick, c.tgt);
      else this.push({ t: 'chainSkip', u: c.tgt });
      if (!this.over && this.nextChain()) {
        this.push({ t: 'chainAsk', u: this.chainCur.tgt, by: this.chainCur.by, cands: this.chainCur.cands.slice() });
        return true;
      }
      const resume = this.chainResume;
      this.chainResume = null;
      this.chainQ = [];
      this.chainUsed = null;
      this.push({ t: 'chainEnd' });
      if (this.over) return true;
      this.phase = 'run';
      if (resume) resume();
      return true;
    },

    chainHit(p, t) {
      const prev = this.acting, prevKind = this.actKind;
      this.acting = p;
      this.actKind = null;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      this.chainUsed.add(p);
      this.push({ t: 'act', u: p, name: CHAIN, kind: 'chain', on: t });
      const o = { e: p.elem, kind: 'follow', label: CHAIN };
      const near = this.adjacent(this.living, t);
      this.hit(p, t, T.chainAtk, Object.assign({}, o, { tough: 0 }));
      for (const a of near) if (alive(a)) this.hit(p, a, T.chainAdj, Object.assign({}, o, { tough: T.chainTough }));
      const an = ally(this, 'anby');
      if (an && this.hareLink(an) && (!this.hasBonus || this.hasBonus(an, 'a2'))) this.gainEnergy(p, T.chainEnergy);
      if (an && this.kitFx) this.kitFx(an, 'chained', p);
      if (this.su) this.bless('follow', { u: p, hits: [t, ...near] });
      this.acting = prev;
      this.actKind = prevKind;
      this.cleanup();
      this.followUps();
    },

    chainAuto() {
      const c = this.chainCur;
      if (!c || !c.cands.length) return null;
      return c.cands.reduce((a, b) => (atkOf(b) > atkOf(a) ? b : a));
    },

    haresAuto(u) {
      const tgt = this.autoTarget(u);
      switch (u.charId) {
        case 'billy': {
          if ((u.flags.steady || 0) >= T.steadyMax && this.sp >= 1 && this.living.length >= 2) return this.act('skill', tgt);
          return this.act('basic', tgt);
        }
        case 'nicole': {
          const big = this.living.reduce((a, b) => (b.hp > a.hp ? b : a));
          if (!this.fieldOn() && this.sp >= 1) return this.act('skill', big);
          if ((u.flags.caseShots || 0) > 0) return this.act('basic', big);
          if (this.field && this.field.turns <= 1 && this.sp >= 2) return this.act('skill', big);
          return this.act('basic', tgt);
        }
        case 'anby': {
          const t = this.living.filter(e => !e.broken && e.tough > 0 && e.weak.includes('elec')).sort((a, b) => a.tough - b.tough)[0] || tgt;
          if ((u.flags.series || 0) >= T.seriesMax && this.sp >= 2 && t && !t.broken) return this.act('skill', t);
          return this.act('basic', t);
        }
      }
      return null;
    }
  });

  function register() {
    Object.assign(H.CHARS, KITS);
    Object.assign(H.FUSIONS, FUSIONS);
    Object.assign(H.CONES, CONES);
    H.coneInit(CONES);
  }

  const MAIL = {
    id: 'v14_hares', from: 'Экипаж Звёздного экспресса', title: 'Хитрые зайцы на связи', give: { items: { tape: 10 } }, text: [
      'Уважаемый Первопроходец!',
      'Телевизор в офисе Герты поймал новый канал. Агентство деликатных поручений «Хитрые зайцы» из Нью-Эриду обещает: «Найдём кота или отомстим, была бы цена».',
      'В Поиске сигнала на обоих баннерах выделенного канала теперь избранные агенты A: Билли Кид, Николь Демара и Энби Демара. Их амплификаторы ждут на канале амплификаторов.',
      'Во вложении 10 шифрокопий.'
    ]
  };

  register();
  if (!H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);
  H.HARES = { KITS, FUSIONS, CONES, FX, IDS, MAIL, register };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
