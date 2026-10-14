(function (H) {
  'use strict';
  const T = H.TUNING;
  const { sv, atkOf, alive } = H.battleStat;

  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const FOES = {
    antibaryon: E({ name: 'Антибарион', fam: 'voidranger', shape: 'orb2', col: ['#3a3450', '#ffb040'], hp: 0.7, spd: 83, tough: 10, weak: ['phys', 'quant'], exp: 0.8,
      skills: [{ n: 'Истребление', w: 1, t: 'single', m: 1.0, e: 'imag' }], gift: 'medkit' }),
    distorter: E({ name: 'Скиталец Пустоты: Исказитель', fam: 'voidranger', shape: 'ranger3', col: ['#24223a', '#ff4ad8'], hp: 0.9, spd: 120, weak: ['wind', 'imag'],
      skills: [{ n: 'Приказ Небытия', w: 1, t: 'lock', next: 1, text: 'Исказитель отмечает цель.' }, { n: 'Удар бесследной пустоты', w: 2, t: 'single', m: 1.7, e: 'quant' }], gift: 'exp1' }),
    weaver: E({ name: 'Мнимый ткач', fam: 'spawn', shape: 'weaver', col: ['#2a2418', '#ffd23a'], hp: 0.95, spd: 120, weak: ['phys', 'elec', 'quant'],
      skills: [{ n: 'Луч гимна', w: 3, t: 'single', m: 1.0, e: 'imag' }, { n: 'Эхо гимна', w: 1, t: 'blast', m: 0.8, e: 'imag' }], gift: 'jadeSmall' }),
    guardian: E({ name: 'Тень хранительницы', fam: 'shade', shape: 'guardian', col: ['#2a1a4a', '#c890ff'], elite: true, hp: 4.4, atk: 1.3, spd: 110, tough: 90, weak: ['phys', 'wind', 'quant'], exp: 3.5, credits: 3,
      skills: [{ n: 'Воспоминание молнии', w: 3, t: 'single', m: 1.5, e: 'elec', fx: [{ k: 'dot', type: 'shock', m: 0.4, turns: 2, chance: 0.6 }] }, { n: 'Осуждение молнией', w: 2, t: 'blast', m: 1.0, e: 'elec' }], gift: 'relic' }),
    searing: E({ name: 'Пылающий странник', fam: 'shade', shape: 'prowler2', col: ['#3a0e08', '#ff8040'], elite: true, hp: 4.6, atk: 1.35, spd: 100, tough: 90, weak: ['ice', 'elec', 'imag'], resist: ['fire'], exp: 3.5, credits: 3,
      skills: [{ n: 'Багровый клинок', w: 3, t: 'single', m: 1.5, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.5, turns: 3, chance: 1 }] }, { n: 'Испепеляющий взмах', w: 1, t: 'blast', m: 1.2, e: 'fire' }], gift: 'relic' }),
    bronya_b: E({ name: 'Броня', fam: 'boss', shape: 'bronya', col: ['#2a4a8a', '#9ae8ff'], boss: true, hp: 10, atk: 1.3, spd: 120, tough: 140, weak: ['phys', 'fire', 'imag'], exp: 10, credits: 8,
      skills: [{ n: 'Пуля наездника ветра', t: 'single', m: 1.3, e: 'wind' }, { n: 'Боевое перестроение', t: 'rally' }, { n: 'Скоординированное подкрепление', t: 'summon', summon: ['soldier', 'gunner'], max: 3 },
        { n: 'Огонь на подавление', t: 'single', m: 1.9, e: 'wind', fx: [{ k: 'debuff', s: 'spdP', v: -0.2, turns: 2, chance: 1, name: 'Подавление' }] }],
      pat: [0, 2, 3, 1, 0, 3, 2, 1] })
  };
  for (const [id, e] of Object.entries(FOES)) e.id = id;
  Object.assign(H.ENEMIES, FOES);

  Object.assign(H.ITEMS, {
    lucent: { name: 'Сияющий отсвет', kind: 'key', rar: 4, price: 0, text: 'Отблеск минувших дней, бесценный для Сада воспоминаний. Посланник принимает его в «Пассаже Световых конусов».' },
    feather: { name: 'Нефритовое перо', kind: 'key', rar: 4, price: 0, text: 'Перо, которое Сад воспоминаний отдаёт за редкие воспоминания. Посланник принимает его в лавке «Шутки сбываются».' },
    resin: { name: 'Самомоделирующаяся смола', kind: 'key', rar: 5, price: 0, text: 'Смола принимает форму, которую ей задают. Из неё можно создать реликвию с нужной основной характеристикой (магазин Посланника).' }
  });

  Object.assign(H.CONES, {
    fermata: { name: 'Фермата', path: 'nihility', rarity: 4, stats: { hp: 43, atk: 21, def: 18 }, bonus: { breakE: 0.16 }, fx: 'fermata', shop: true, text: 'Эффект пробития +16%. Урон по врагам с Шоком или Порывом ветра +16%.' },
    quid: { name: 'Равноценный обмен', path: 'abundance', rarity: 4, stats: { hp: 48, atk: 21, def: 15 }, bonus: {}, fx: 'quid', shop: true, text: 'В начале хода владельца случайный союзник с энергией ниже 50% получает 8 энергии.' },
    wildfire: { name: 'Мы — Дикий Огонь', path: 'preservation', rarity: 4, stats: { hp: 43, atk: 21, def: 21 }, bonus: {}, fx: 'wildfire', shop: true, text: 'В начале боя урон по союзникам −8% на 5 ходов, каждый восстанавливает 30% потерянного HP.' },
    river: { name: 'Весенние потоки рек', path: 'hunt', rarity: 4, stats: { hp: 38, atk: 24, def: 15 }, bonus: {}, fx: 'river', shop: true, text: 'Скорость +8% и урон +12%. Пропадает после удара по владельцу и возвращается в конце его следующего хода.' },
    pastfuture: { name: 'Прошлое и будущее', path: 'harmony', rarity: 4, stats: { hp: 43, atk: 21, def: 18 }, bonus: {}, fx: 'pastfuture', shop: true, text: 'После навыка владельца следующий ходящий союзник наносит на 16% больше урона в течение 1 хода.' },
    woof: { name: 'Гав! Время прогулок!', path: 'destruction', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { atkP: 0.1 }, fx: 'woof', shop: true, text: 'Атака +10%. Урон по врагам с Горением или Кровотечением +16%.' },
    breakfast: { name: 'Важность завтрака', path: 'erudition', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { dmgP: 0.12 }, fx: 'breakfast', shop: true, text: 'Урон +12%. За каждого побеждённого владельцем врага атака +4% (до 3 раз).' }
  });

  const TUN = { lvlFrom: [32, 65], lvlTo: [18, 49], hp: [1, 1.15, 1.3, 1.3, 1.4, 3.6, 4.4, 2.2, 2.8, 3.8, 3.6, 3.8, 3.4, 2.4, 2.2], atkRamp: 0.02, energyStart: 0.5, firstCycle: 150, cycle: 100, insignia: 3, shopDays: 42, echoWeek: 3, echoLucent: 10 };
  const lvlOf = L => Math.round(TUN.lvlTo[0] + (L - TUN.lvlFrom[0]) * (TUN.lvlTo[1] - TUN.lvlTo[0]) / (TUN.lvlFrom[1] - TUN.lvlFrom[0]));

  const TURB = [
    { text: 'Урон Ветром всех союзников +50%.', fx: [{ k: 'stat', s: 'windP', v: 0.5 }] },
    { text: 'Ледяной урон всех союзников +50%.', fx: [{ k: 'stat', s: 'iceP', v: 0.5 }] },
    { text: 'Огненный урон всех союзников +50%.', fx: [{ k: 'stat', s: 'fireP', v: 0.5 }] },
    { text: 'Физический урон всех союзников +50%.', fx: [{ k: 'stat', s: 'physP', v: 0.5 }] },
    { text: 'Электрический урон всех союзников +50%.', fx: [{ k: 'stat', s: 'elecP', v: 0.5 }] },
    { text: 'Урон навыков всех союзников +25%. В начале каждого цикла команда получает 2 очка навыка.', fx: [{ k: 'stat', s: 'skillP', v: 0.25 }, { k: 'sp', v: 2 }] },
    { text: 'Урон абсолютных техник всех союзников +25%. В начале каждого цикла все союзники получают 20 энергии.', fx: [{ k: 'stat', s: 'ultP', v: 0.25 }, { k: 'energy', v: 20 }] },
    { text: 'В начале каждого цикла союзник с самой высокой атакой наносит на 60% больше урона в течение 1 хода.', fx: [{ k: 'topAtk', v: 0.6 }] },
    { text: 'В начале каждого цикла следующая атака каждого союзника снимает на 50% больше прочности.', fx: [{ k: 'break', v: 0.5 }] },
    { text: 'В начале каждого цикла шанс крита всех союзников +8%, до 40%.', fx: [{ k: 'crit', v: 0.08, max: 0.4 }] },
    { text: 'В начале каждого цикла союзник с наименьшим HP восстанавливает 60% макс. HP.', fx: [{ k: 'healLow', v: 0.6 }] },
    { text: 'В начале каждого цикла следующая атака каждого союзника наносит на 50% больше урона.', fx: [{ k: 'dmg', v: 0.5 }] },
    { text: 'В начале каждого цикла все союзники получают щит в 25% макс. HP.', fx: [{ k: 'shield', v: 0.25 }] },
    { text: 'В начале каждого цикла шанс крита всех союзников +20% и крит. урон +40% до следующего цикла.', fx: [{ k: 'critBoth', r: 0.2, d: 0.4 }] },
    { text: 'В начале каждого цикла все враги получают на 35% больше урона до своего следующего хода.', fx: [{ k: 'vuln', v: 0.35 }] }
  ];

  const KINDS = {
    one: { budget: 20, goals: [10, 14] },
    pair: { budget: 20, goals: [8, 12] },
    nodes: { budget: 30, goals: [12, 18] }
  };

  const B = (waves, music) => ({ waves, music: music || null });
  const ST = (n, L, kind, nodes) => ({ n, L, get lvl() { return lvlOf(this.L); }, kind, nodes, turb: TURB[n - 1] });
  const STAGES = [
    ST(1, 32, 'one', [[B([['reaver', 'distorter', 'reaver', 'antibaryon'], ['reaver', 'trampler', 'reaver', 'baryon', 'baryon']])]]),
    ST(2, 36, 'one', [[B([['spider', 'hound', 'hound', 'gunner'], ['hound', 'direwolf', 'hound', 'gunner']])]]),
    ST(3, 39, 'one', [[B([['flamespawn', 'shadewalker', 'shadewalker', 'frostspawn'], ['frostspawn', 'iceout', 'frostspawn']])]]),
    ST(4, 42, 'one', [[B([['soldier', 'gunner', 'soldier', 'hound', 'gunner'], ['bronya_b']], 'gepard')]]),
    ST(5, 44, 'one', [[B([['spider', 'beetle', 'beetle', 'spider'], ['grizzly', 'beetle']], 'boss')]]),
    ST(6, 45, 'pair', [[B([['incinerator', 'searing', 'incinerator']]), B([['flamespawn', 'blazeout', 'flamespawn']])]]),
    ST(7, 47, 'pair', [[B([['soldier', 'lieutenant', 'gunner']]), B([['weaver', 'guardian', 'weaver']])]]),
    ST(8, 50, 'pair', [[B([['beetle', 'direwolf', 'hound']]), B([['beetle', 'grizzly', 'hound']], 'boss')]]),
    ST(9, 52, 'pair', [[B([['soldier', 'lieutenant', 'cannoneer']]), B([['reaver', 'trampler', 'eliminator', 'reaver']])]]),
    ST(10, 54, 'pair', [[B([['incinerator', 'guardian', 'shadewalker']]), B([['antibaryon', 'eliminator', 'trampler', 'reaver', 'eliminator']])]]),
    ST(11, 55, 'nodes', [[B([['flamespawn', 'flamespawn', 'flamespawn', 'flamespawn', 'flamespawn'], ['flamespawn', 'blazeout', 'flamespawn']])], [B([['shadewalker', 'spider', 'shadewalker', 'spider', 'shadewalker'], ['frostspawn', 'prowler']])]]),
    ST(12, 57, 'nodes', [[B([['spider', 'hound', 'incinerator', 'spider'], ['incinerator', 'searing', 'incinerator']])], [B([['soldier', 'cannoneer', 'soldier', 'gunner'], ['soldier', 'lieutenant', 'soldier']])]]),
    ST(13, 60, 'nodes', [[B([['vagrant', 'spider', 'spider', 'hound', 'vagrant'], ['vagrant', 'grizzly']], 'boss')], [B([['frostspawn', 'weaver', 'weaver', 'hound'], ['hound', 'iceout', 'spider']])]]),
    ST(14, 63, 'nodes', [[B([['soldier', 'gunner', 'gunner', 'cannoneer', 'soldier'], ['bronya_b']], 'gepard')], [B([['beetle', 'beetle', 'beetle'], ['svarog_b', 'hound']], 'svarog')]]),
    ST(15, 65, 'nodes', [[B([['gunner', 'cannoneer', 'cannoneer', 'soldier'], ['gunner', 'gepard_b', 'cannoneer']], 'gepard')], [B([['shadewalker', 'shadewalker', 'shadewalker'], ['cocolia1']], 'cocolia')]])
  ];
  const REC = [
    [['phys', 'wind', 'imag']], [['ice', 'elec', 'imag']], [['fire', 'wind', 'quant']], [['phys', 'fire', 'imag']], [['fire', 'ice', 'elec']],
    [['ice']], [['phys', 'quant']], [['ice', 'elec']], [['phys']], [['phys', 'wind']],
    [['phys', 'ice', 'quant'], ['fire', 'elec', 'quant']], [['ice', 'elec', 'imag'], ['phys', 'ice', 'quant']], [['fire', 'ice', 'elec'], ['fire', 'wind', 'quant']],
    [['phys', 'fire', 'imag'], ['fire', 'elec', 'wind']], [['phys', 'elec', 'imag'], ['fire', 'elec', 'quant']]
  ];
  for (const st of STAGES) Object.assign(st, { budget: KINDS[st.kind].budget, goals: KINDS[st.kind].goals, rec: REC[st.n - 1] });

  const SERIES = [{ id: 'vestiges', name: 'Наследие Возвышающейся цитадели', world: 'Ярило-VI', text: 'Воспоминания о Ярило-VI: Белобог, Подземье и Холм Вечной Зимы. Пятнадцать этапов, враги от уровня ' + STAGES[0].lvl + ' до ' + STAGES[14].lvl + '.', stages: STAGES }];

  const memoryReward = n => (n <= 5 ? { credits: 2500, items: { lucent: 20, exp2: 5 } } : { credits: 5000, items: { lucent: 40, exp3: 2, exp2: 3 } });
  const INSIGNIA = { jade: 200, credits: 5000, items: { feather: 80 } };

  const SHOP = {
    cones: { name: 'Пассаж Световых конусов', cur: 'lucent', rows: ['fermata', 'quid', 'wildfire', 'river', 'pastfuture', 'woof', 'breakfast'].map(id => ({ cone: id, price: 200 })) },
    jokes: { name: 'Шутки сбываются', cur: 'feather', rows: [
      { item: 'resin', price: 1200, lim: 1 },
      { item: 'exp3', price: 10, lim: 10 },
      { credits: 2500, price: 10, lim: 12 },
      { credits: 1250, price: 10, after: 2 }
    ] }
  };

  H.FH = { TUN, TURB, KINDS, STAGES, SERIES, SHOP, INSIGNIA, memoryReward, lvlOf };

  const cf = (u, fx) => (u && u.cone && u.cone.fx === fx ? 1 + 0.25 * ((u.cone.sup || 1) - 1) : 0);
  const hasDot = (u, types) => u.dots.some(d => types.includes(d.type));
  const boundary = c => TUN.firstCycle + TUN.cycle * (c - 1);

  Object.assign(H.Battle.prototype, {
    memo(on, ctx) {
      if (on === 'start') this.memoStart();
      else if (on === 'tick') this.memoTick(ctx.d);
      else if (on === 'turn') this.memoTurn(ctx.u);
      else if (on === 'endTurn') this.memoEndTurn(ctx.u);
      else if (on === 'hurt') this.memoHurt(ctx.u);
      else if (on === 'down') { if (this.fh) this.fh.down++; }
      else if (on === 'kill') this.memoKill(ctx.src);
      else if (on === 'after') this.memoAfter(ctx.u, ctx.kind);
    },

    memoDmg(src, tgt, o) {
      if (src.side !== 'ally' || tgt.side !== 'enemy') return 0;
      let v = 0;
      const fe = cf(src, 'fermata'), wf = cf(src, 'woof');
      if (fe && hasDot(tgt, ['shock', 'shear'])) v += 0.16 * fe;
      if (wf && hasDot(tgt, ['burn', 'bleed'])) v += 0.16 * wf;
      return v;
    },

    memoStart() {
      const o = this.opts.fh;
      if (o) {
        this.fh = { budget: o.budget, before: o.used || 0, t: 0, cyc: 1, down: 0, out: false, turb: o.turb || null, crit: 0 };
        for (const f of (this.fh.turb ? this.fh.turb.fx : [])) if (f.k === 'stat') for (const a of this.allies) a.buffs.push({ s: f.s, v: f.v, turns: 999, name: 'Турбулентность памяти', perm: true });
        this.fhCycle();
      }
      for (const a of this.livingAllies) {
        const w = cf(a, 'wildfire');
        if (w) for (const b of this.livingAllies) { this.addBuff(b, { s: 'dr', v: 0.08 * w, turns: 5, name: 'Мы — Дикий Огонь' }, true); this.heal(a, b, (b.maxHp - b.hp) * 0.3 * w); }
        const r = cf(a, 'river');
        if (r) this.riverOn(a, r);
      }
    },

    riverOn(a, k) {
      a.flags.river = 'on';
      a.buffs.push({ s: 'spdP', v: 0.08 * k, turns: 999, name: 'Весенние потоки рек', perm: true }, { s: 'dmgP', v: 0.12 * k, turns: 999, name: 'Весенние потоки рек', perm: true });
    },

    memoTick(d) {
      const F = this.fh;
      if (!F || this.over) return;
      F.t += d;
      while (F.t >= boundary(F.cyc) - 1e-9) {
        F.cyc++;
        if (F.before + F.cyc > F.budget) {
          F.out = true;
          this.push({ t: 'text', text: 'Циклы закончились. Воспоминание рассыпается.', warn: true });
          this.finish(false);
          return;
        }
        this.fhCycle();
      }
    },

    fhLeft() { const F = this.fh; return F ? Math.max(0, F.budget - F.before - F.cyc) : 0; },

    fhCycle() {
      const F = this.fh, used = F.before + F.cyc;
      this.push({ t: 'cycle', n: used, left: F.budget - used, budget: F.budget });
      for (const f of (F.turb ? F.turb.fx : [])) {
        const al = this.livingAllies;
        switch (f.k) {
          case 'sp': this.sp = Math.min(T.spMax, this.sp + f.v); this.push({ t: 'text', text: 'Турбулентность памяти: +' + f.v + ' очка навыка' }); break;
          case 'energy': for (const a of al) this.gainEnergy(a, f.v); break;
          case 'topAtk': { const a = al.slice().sort((x, y) => atkOf(y) - atkOf(x))[0]; if (a) this.addBuff(a, { s: 'dmgP', v: f.v, turns: 1, name: 'Турбулентность: урон' }); break; }
          case 'break': for (const a of al) this.addBuff(a, { s: 'breakEff', v: f.v, turns: 1, name: 'Турбулентность: пробитие' }, true); break;
          case 'crit': {
            F.crit = Math.min(f.max, F.crit + f.v);
            for (const a of al) { a.buffs = a.buffs.filter(b => b.name !== 'Турбулентность: крит'); a.buffs.push({ s: 'critR', v: F.crit, turns: 999, name: 'Турбулентность: крит', perm: true }); }
            break;
          }
          case 'healLow': { const a = al.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; if (a) this.heal(null, a, a.maxHp * f.v); break; }
          case 'dmg': for (const a of al) this.addBuff(a, { s: 'dmgP', v: f.v, turns: 1, name: 'Турбулентность: урон' }, true); break;
          case 'shield': for (const a of al) this.giveShield(a, a.maxHp * f.v, 1); break;
          case 'critBoth': for (const a of al) { this.addBuff(a, { s: 'critR', v: f.r, turns: 1, name: 'Турбулентность: крит' }, true); this.addBuff(a, { s: 'critD', v: f.d, turns: 1, name: 'Турбулентность: крит. урон' }, true); } break;
          case 'vuln': for (const e of this.living) this.addBuff(e, { s: 'vuln', v: f.v, turns: 1, name: 'Турбулентность: уязвимость', debuff: true }, true); break;
        }
      }
    },

    memoTurn(u) {
      const q = cf(u, 'quid');
      if (q) {
        const pool = this.livingAllies.filter(a => a !== u && a.energy < a.maxEnergy * 0.5);
        if (pool.length) this.gainEnergy(this.rng.pick(pool), 8 * q);
      }
      const pf = this.pastFuture;
      if (pf && pf.from !== u) {
        this.pastFuture = null;
        this.addBuff(u, { s: 'dmgP', v: pf.v, turns: 1, name: 'Прошлое и будущее' });
      }
    },

    memoEndTurn(u) {
      if (u.flags && u.flags.river === 'off') { const r = cf(u, 'river'); if (r && alive(u)) this.riverOn(u, r); }
    },

    memoHurt(u) {
      if (u.side === 'ally' && u.flags.river === 'on') {
        u.flags.river = 'off';
        u.buffs = u.buffs.filter(b => b.name !== 'Весенние потоки рек');
      }
    },

    memoKill(src) {
      const k = cf(src, 'breakfast');
      if (!k) return;
      src.flags.breakfast = Math.min(3, (src.flags.breakfast || 0) + 1);
      src.buffs = src.buffs.filter(b => b.name !== 'Важность завтрака');
      src.buffs.push({ s: 'atkP', v: 0.04 * k * src.flags.breakfast, turns: 999, name: 'Важность завтрака', perm: true });
    },

    memoAfter(u, kind) {
      const k = cf(u, 'pastfuture');
      if (k && kind === 'skill') this.pastFuture = { from: u, v: 0.16 * k };
    }
  });

  const dayNum = ms => { const d = new Date(ms - 4 * 3600000); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000); };

  Object.assign(H.Game.prototype, {
    fh() {
      const s = this.state;
      if (!s.fh) s.fh = { st: {}, got: [], team: {}, run: null, shop: { per: null, n: {} }, echo: { wk: null, n: 0 } };
      return s.fh;
    },

    fhOpen() { return !!this.state.flags.fh_met; },

    fhStage(n) { return STAGES[n - 1] || null; },

    fhRec(n) { return this.fh().st[n] || null; },

    fhStars(n) { const r = this.fhRec(n); return r ? r.stars.filter(Boolean).length : 0; },

    fhTotal() { return STAGES.reduce((a, st) => a + this.fhStars(st.n), 0); },

    fhUnlocked(n) { return n === 1 || !!(this.fhRec(n - 1) && this.fhRec(n - 1).clear); },

    fhWeak(st, node) { return st.rec[node].slice(); },

    fhTeam(n, node) {
      const F = this.fh(), st = this.fhStage(n), saved = F.team[n] && F.team[n][node];
      const keys = Object.keys(this.state.roster);
      if (saved) return saved.filter(k => keys.includes(k));
      const other = st.nodes.length > 1 ? (node === 0 ? [] : this.fhTeam(n, 0)) : [];
      const base = node === 0 ? this.state.party.slice(0, 4) : this.state.party.slice(4).concat(keys).filter(k => !other.includes(k));
      return [...new Set(base)].filter(k => keys.includes(k) && !other.includes(k)).slice(0, 4);
    },

    fhSetTeam(n, node, list) {
      const F = this.fh(), st = this.fhStage(n);
      if (!st) return false;
      const keys = Object.keys(this.state.roster);
      const clean = [...new Set(list)].filter(k => keys.includes(k)).slice(0, 4);
      const t = F.team[n] || (F.team[n] = st.nodes.map((_, i) => (i === node ? [] : this.fhTeam(n, i))));
      t[node] = clean;
      for (let i = 0; i < t.length; i++) if (i !== node) t[i] = (t[i] || []).filter(k => !clean.includes(k));
      return true;
    },

    fhReady(n) {
      const st = this.fhStage(n);
      return !!st && this.fhUnlocked(n) && st.nodes.every((_, i) => this.fhTeam(n, i).length > 0);
    },

    fhBegin(n) {
      if (!this.fhOpen() || !this.fhReady(n)) return false;
      const st = this.fhStage(n);
      this.fh().run = { n, node: 0, used: 0, down: 0, done: st.nodes.map(() => []) };
      return true;
    },

    fhRun() { return this.fh().run; },

    fhSpecs(keys) {
      return keys.map(k => {
        const r = this.state.roster[k], st = this.charStats(k), kit = H.CHARS[this.kitOf(k)];
        return { key: k, charId: this.kitOf(k), name: k === 'trail' ? this.state.name : undefined, lvl: r.lvl, stats: st, hp: st.hp, energy: Math.round(kit.energy * TUN.energyStart), cone: this.coneEffect(k), sets: this.planarSets(k) };
      });
    },

    fhLeft() {
      const run = this.fhRun(), st = run && this.fhStage(run.n);
      return st ? st.budget - run.used : 0;
    },

    fhFight(bi) {
      const run = this.fhRun();
      if (!run || this.battle) return null;
      const st = this.fhStage(run.n), node = st.nodes[run.node];
      if (bi == null) bi = node.findIndex((_, i) => !run.done[run.node].includes(i));
      if (bi < 0 || run.done[run.node].includes(bi) || !node[bi]) return null;
      const keys = this.fhTeam(run.n, run.node), b = node[bi];
      const techs = keys.map(k => ({ charId: this.kitOf(k), fx: H.CHARS[this.kitOf(k)].tech.fx }));
      return this.startBattle({
        waves: b.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl, party: this.fhSpecs(keys), techs,
        noFlee: true, noContact: true, boss: false, bg: 'memory', music: b.music || 'order',
        foeHp: TUN.hp[st.n - 1], foeAtk: 1 + (st.n - 1) * TUN.atkRamp, fh: { budget: st.budget, used: run.used, turb: st.turb, n: run.n, node: run.node, bi }
      });
    },

    fhEndBattle(b, ctx, out) {
      const r = b.result, run = this.fhRun(), F = b.fh, info = ctx.o.fh;
      this.battle = null;
      out.fh = { n: info.n, node: info.node, bi: info.bi, cyc: F ? F.cyc : 0, down: F ? F.down : 0, out: !!(F && F.out) };
      if (!r.win) {
        this.battleCtx = Object.assign(ctx, { lost: true });
        out.lost = true;
        return out;
      }
      this.battleCtx = null;
      if (!run || run.n !== info.n) return out;
      run.used += F.cyc;
      run.down += F.down;
      run.done[info.node].push(info.bi);
      const st = this.fhStage(run.n);
      if (run.done[run.node].length < st.nodes[run.node].length) { out.fh.next = 'battle'; return out; }
      if (run.node < st.nodes.length - 1) { run.node++; out.fh.next = 'node'; return out; }
      out.fh.next = 'clear';
      out.fh.clear = this.fhClear(run);
      return out;
    },

    fhClear(run) {
      const F = this.fh(), st = this.fhStage(run.n), left = st.budget - run.used;
      const stars = [left >= st.goals[0], left >= st.goals[1], run.down <= 1];
      const rec = F.st[run.n] || (F.st[run.n] = { clear: false, stars: [false, false, false], best: 0 });
      const first = !rec.clear;
      const was = rec.stars.slice();
      rec.clear = true;
      rec.stars = rec.stars.map((v, i) => v || stars[i]);
      rec.best = Math.max(rec.best || 0, left);
      const got = first ? this.give(memoryReward(run.n)) : [];
      F.run = null;
      if (this.state.quests.fh_lights === 'hall') this.setQuest('fh_lights', 'back');
      return { n: run.n, left, used: run.used, down: run.down, stars, fresh: rec.stars.map((v, i) => v && !was[i]), first, got };
    },

    fhRetry() {
      const ctx = this.battleCtx;
      if (!ctx || !ctx.o || !ctx.o.fh) return false;
      this.battleCtx = null;
      this.startBattle(ctx.o);
      return true;
    },

    fhAbort() {
      this.fh().run = null;
      this.battleCtx = null;
      this.battle = null;
      return true;
    },

    fhTiers() {
      const F = this.fh(), total = this.fhTotal(), n = Math.floor(STAGES.length * 3 / TUN.insignia);
      return Array.from({ length: n }, (_, i) => ({ i: i + 1, need: (i + 1) * TUN.insignia, ready: total >= (i + 1) * TUN.insignia, got: F.got.includes(i + 1) }));
    },

    fhClaim(i) {
      const t = this.fhTiers().find(x => x.i === i);
      if (!t || !t.ready || t.got) return null;
      this.fh().got.push(i);
      return this.give(INSIGNIA);
    },

    fhClaimAll() {
      const out = [];
      for (const t of this.fhTiers()) if (t.ready && !t.got) out.push(...this.fhClaim(t.i));
      return out;
    },

    fhAlert() { return this.fhOpen() && this.fhTiers().some(t => t.ready && !t.got); },

    fhShopSync() {
      const S = this.fh().shop, per = Math.floor(dayNum(this.now()) / TUN.shopDays);
      if (S.per !== per) { S.per = per; S.n = {}; }
      return S;
    },

    fhShop(tab) {
      const sh = SHOP[tab], S = this.fhShopSync(), have = this.state.inv.items[sh.cur] || 0;
      return sh.rows.map((row, i) => {
        const bought = S.n[tab + i] || 0, left = row.lim ? row.lim - bought : Infinity;
        const hidden = row.after != null && (S.n[tab + row.after] || 0) < (sh.rows[row.after].lim || 0);
        const name = row.cone ? H.CONES[row.cone].name : row.item ? H.ITEMS[row.item].name : 'Кредиты ×' + H.fmt(row.credits);
        return { i, row, name, price: row.price, cur: sh.cur, left, lim: row.lim || 0, hidden, afford: have >= row.price && left > 0, own: row.cone ? this.fhConeOwned(row.cone) : row.item ? this.state.inv.items[row.item] || 0 : 0 };
      }).filter(r => !r.hidden);
    },

    fhConeOwned(id) { const c = this.state.inv.cones.filter(x => x.id === id); return c.length ? Math.max(...c.map(x => x.sup || 1)) : 0; },

    fhBuy(tab, i, n = 1) {
      const sh = SHOP[tab], row = sh.rows[i], s = this.state, S = this.fhShopSync();
      if (!row) return null;
      const list = this.fhShop(tab).find(r => r.i === i);
      if (!list) return null;
      n = Math.max(1, Math.min(n, list.left));
      const cost = row.price * n;
      if ((s.inv.items[sh.cur] || 0) < cost) return null;
      this.take({ items: { [sh.cur]: cost } });
      S.n[tab + i] = (S.n[tab + i] || 0) + n;
      const out = [];
      for (let k = 0; k < n; k++) {
        if (row.cone) { this.addCone(row.cone); out.push('конус «' + H.CONES[row.cone].name + '»'); }
        else if (row.item) out.push(...this.give({ items: { [row.item]: 1 } }));
        else out.push(...this.give({ credits: row.credits }));
      }
      return out;
    },

    fhCraft(set, slotKey, main) {
      const s = this.state, slot = H.CAVERN_SLOTS.find(x => x.key === slotKey);
      if (!(s.inv.items.resin > 0) || !slot || !H.CAVERN_SETS.includes(set) || !slot.mains.includes(main)) return null;
      this.take({ items: { resin: 1 } });
      const rl = Math.min(15, Math.floor(this.avgLevel() / 3));
      const rel = this.makeRelic(set, slot, rl, this.avgLevel());
      if (rel.main !== main) {
        rel.subs = rel.subs.filter(([k]) => k !== main);
        rel.main = main;
        rel.mv = this.relicMain(main, rl);
      }
      return rel;
    },

    fhEchoLucent() {
      if (!this.fhOpen()) return [];
      const ec = this.fh().echo, wk = Math.floor((dayNum(this.now()) + 3) / 7);
      if (ec.wk !== wk) { ec.wk = wk; ec.n = 0; }
      if (ec.n >= TUN.echoWeek) return [];
      ec.n++;
      return this.give({ items: { lucent: TUN.echoLucent } });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
