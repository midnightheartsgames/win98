(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN, T = H.TUNING, DT = HD.DT, tr = HD.tr, ei = HD.ei;
  const ARC_Q = Math.PI * 2 / 3;
  const P = v => Math.round(v * 100) + '%';
  const ultType = (u, l) => (l >= 3 ? 'divine' : u.atkType);
  const closestTo = (list, x, y) => list.reduce((b, v) => (!b || Math.hypot(v.x - x, v.y - y) < Math.hypot(b.x - x, b.y - y) ? v : b), null);
  const circle = (x, y, r) => ({ shape: 'circle', x, y, r });
  const hpK = u => u.hpMax * TUN.hpDmgK;
  const tk = (A, u) => (u.abil.t ? A.lvlK('t', u.abil.t) : 0);
  const near = (A, u, r) => A.unitsIn(circle(u.x, u.y, r), 'foe');
  const lineFrom = (u, x, y, len, w) => ({ shape: 'line', x: u.x, y: u.y, ang: Math.atan2(y - u.y, x - u.x), len, w });

  function burst(A, u, x, y, r, mMain, mOther, o) {
    const hits = A.unitsIn(circle(x, y, r), 'foe'), main = closestTo(hits, x, y);
    for (const v of hits) A.hit(u, v, Object.assign({ m: v === main ? mMain : mOther, tough: v === main ? o.tough : o.tough / 2 }, o));
    return hits;
  }

  const KITS = {};

  KITS.trail = {
    q: {
      cost: 30, cd: 6, aim: 'point', range: 80,
      cast(A, u, k, aim) {
        const arc = tr(u, 0) ? Math.PI : ARC_Q, ang = Math.atan2(aim.y - u.y, aim.x - u.x), cone = { shape: 'cone', x: u.x, y: u.y, r: 80, ang, arc };
        const hits = A.unitsIn(cone, 'foe'), main = closestTo(hits, aim.x, aim.y);
        for (const v of hits) {
          A.hit(u, v, { m: (v === main ? 1.25 * (tr(u, 0) ? 1.25 : 1) : 0.5) * k * TUN.kQ, kind: 'q', tough: v === main ? T.toughSkill : T.toughSkill / 2 });
          A.push(v, u.x, u.y, 40);
        }
        A.emit({ t: 'fx', kind: 'arc', x: u.x, y: u.y, r: 80, ang, arc, elem: u.elem });
        A.face(u, aim.x - u.x, aim.y - u.y);
      }
    },
    e: {
      cost: 40, cd: 24, aim: 'self',
      cast(A, u, k) {
        A.addArea({ shape: 'circle', x: u.x, y: u.y, r: 200, follow: u.uid, side: 'ally', t: 2.95, every: 1, tickT: 0, kind: 'heal', onTick(A2, a) {
          for (const v of A2.unitsIn(a, 'ally')) if (v.kind === 'hero' || v.kind === 'turret' || v.kind === 'base') A2.heal(u, v, v.hpMax * 0.05 * k);
        } });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 200, elem: 'heal' });
      }
    },
    t: {
      buff(A, u, k) { A.addFx(u, { n: 'Талант', k: 'atk', v: 0.2 * k, t: 10, max: ei(u, 1) ? 4 : tr(u, 1) ? 3 : 2 }); },
      onBreak(A, u, k) { KITS.trail.t.buff(A, u, k); },
      onKill(A, u, k) { if (ei(u, 1)) KITS.trail.t.buff(A, u, k); }
    },
    r: {
      cd: 70, aim: 'point', range: 240,
      cast(A, u, k, aim, l) {
        u.tal.rcut = 0;
        A.dash(u, aim.x, aim.y, 240, 0);
        burst(A, u, u.x, u.y, 96, 2.7 * k * TUN.kR * (tr(u, 0) ? 1.25 : 1), 1.62 * k * TUN.kR, { kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        A.emit({ t: 'fx', kind: 'boom', x: u.x, y: u.y, r: 96, elem: u.elem });
      }
    },
    tick(A, u) {
      if (tr(u, 1) && u.abil.t) A.addFx(u, { n: 'Упорство', k: 'armor', v: 4 * u.abil.t, t: 0.5 });
      if (u.tal.rcutPend) { u.cd.r = Math.max(0, u.cd.r - u.tal.rcutPend); u.tal.rcutPend = 0; }
    },
    onKill(A, u, f, o) { if (ei(u, 0) && o && o.kind === 'r' && (u.tal.rcut || 0) < 30) { u.tal.rcut = (u.tal.rcut || 0) + 6; u.tal.rcutPend = (u.tal.rcutPend || 0) + 6; } },
    text: {
      q: k => 'Размах по дуге 120°: цель ' + P(1.25 * k * TUN.kQ) + ', остальные ' + P(0.5 * k * TUN.kQ) + ' урона атаки, отбрасывание.',
      e: k => 'За 3 с лечит героя и союзные постройки в 200 на ' + P(0.15 * k) + ' их НР.',
      t: k => 'Пробитие стойкости: урон атаки +' + P(0.2 * k) + ' на 10 с, до 2 раз.',
      r: k => 'Прыжок в точку, удар по кругу 96: центр ' + P(2.7 * k * TUN.kR) + ', вокруг ' + P(1.62 * k * TUN.kR) + '.'
    },
    tr: [{ name: 'Воля к битве', text: 'Навык и Абсолютная техника бьют основную цель на 25% сильнее, дуга Навыка 180°.' }, { name: 'Упорство', text: 'Каждый уровень Таланта даёт +4 брони, Талант складывается до 3 раз.' }],
    ei: [{ name: 'Падающая звезда', text: 'Каждое добивание Абсолютной техникой сокращает её перезарядку на 6 с, до 30 с.' }, { name: 'Воля к Освоению', text: 'Талант срабатывает и от добиваний, предел 4 уровня.' }]
  };

  KITS.blade = {
    basic(A, u, t, o) {
      const hell = u.fx.find(f => f.n === 'Адский пейзаж');
      u.en = Math.min(u.enMax, u.en + TUN.enHit);
      if (!hell) { A.hit(u, t, o); A.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y, elem: u.elem }); return; }
      const k = u.tal.hellK || 1;
      if (!(tr(u, 0) && u.hp <= u.hpMax * 0.5)) A.spendHp(u, u.hp * 0.03);
      const broken = t.brokenT > 0;
      A.hit(u, t, { amt: (0.4 * A.atkOf(u) + 1.0 * hpK(u)) * k, kind: 'basic', basic: true, tough: T.toughSkill });
      for (const v of A.unitsIn(circle(t.x, t.y, 64), 'foe')) if (v !== t) A.hit(u, v, { amt: (0.16 * A.atkOf(u) + 0.4 * hpK(u)) * k, kind: 'basic', tough: T.toughBasic });
      if (tr(u, 1) && broken) A.heal(u, u, u.hpMax * 0.05);
      A.emit({ t: 'fx', kind: 'ring', x: t.x, y: t.y, r: 64, elem: u.elem });
    },
    q: {
      cost: 0, cd: 18, aim: 'self',
      cast(A, u, k) {
        A.spendHp(u, u.hp * 0.3);
        u.tal.hellK = k;
        A.addFx(u, { n: 'Адский пейзаж', k: 'dmg', v: 0.4 * k, t: 9 });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 40, elem: u.elem });
      }
    },
    e: {
      cost: 0, cd: 14, aim: 'point', range: 180,
      cast(A, u, k, aim) {
        A.spendHp(u, u.hp * 0.2);
        const x0 = u.x, y0 = u.y;
        A.dash(u, aim.x, aim.y, 180, 0);
        const len = Math.hypot(u.x - x0, u.y - y0), zone = { shape: 'line', x: x0, y: y0, ang: Math.atan2(u.y - y0, u.x - x0), len: Math.max(24, len), w: 48 };
        for (const v of A.unitsIn(zone, 'foe')) A.hit(u, v, { amt: 0.4 * hpK(u) * k * TUN.kE, kind: 'e', tough: TUN.toughTech });
        A.emit({ t: 'fx', kind: 'slash', x: u.x, y: u.y, elem: u.elem, big: true });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k, aim, l) {
        if (u.hp > u.hpMax * 0.5) A.spendHp(u, u.hp - u.hpMax * 0.5); else A.heal(u, u, u.hpMax * 0.5 - u.hp);
        const lost = Math.min(u.hpMax * 0.9, u.tal.lost || 0) * TUN.hpDmgK, atk = A.atkOf(u), hp = hpK(u), m = k * TUN.kR;
        const hits = near(A, u, 96), main = closestTo(hits, u.x, u.y);
        for (const v of hits) {
          const amt = v === main ? (0.4 * atk + 1.0 * hp + 1.0 * lost + (ei(u, 0) ? 1.5 * lost : 0)) * m : (0.16 * atk + 0.4 * hp + 0.4 * lost) * m;
          A.hit(u, v, { amt, kind: 'r', tough: v === main ? T.toughUlt : T.toughUlt / 2, type: ultType(u, l) });
        }
        u.tal.lost = 0;
        A.emit({ t: 'fx', kind: 'boom', x: u.x, y: u.y, r: 96, elem: u.elem });
      }
    },
    onLose(A, u, amt) {
      u.tal.lost = Math.min(u.hpMax * 0.9, (u.tal.lost || 0) + amt);
      u.tal.acc = (u.tal.acc || 0) + amt / (u.hpMax * 0.1);
      while (u.tal.acc >= 1) { u.tal.acc -= 1; u.tal.ch = Math.min(5, (u.tal.ch || 0) + 1); }
      const need = ei(u, 1) ? 4 : T.shuhuMax;
      if (u.abil.t && u.tal.ch >= need && !u.tal.busy) {
        u.tal.busy = true; u.tal.ch = 0;
        const k = tk(A, u);
        for (const v of near(A, u, 140)) A.hit(u, v, { amt: (T.shuhuAtk * A.atkOf(u) + (T.shuhuHp + (ei(u, 1) ? 0.5 : 0)) * hpK(u)) * k * TUN.kT, kind: 't', tough: T.toughBasic });
        A.heal(u, u, u.hpMax * T.shuhuHeal * k);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 140, elem: u.elem });
        A.say(u, 'Талант');
        u.tal.busy = false;
      }
    },
    tick(A, u) { if (tr(u, 0) && u.hp <= u.hpMax * 0.5) A.addFx(u, { n: 'Бесконечная жизнь', k: 'healIn', v: 0.5, t: 0.3 }); },
    text: {
      q: k => 'Тратит 30% текущего НР. 9 с: урон +' + P(0.4 * k) + ', Атака становится «Частоколом мечей»: ' + P(0.4 * k) + ' урона атаки и ' + P(1 * k * TUN.hpDmgK) + ' макс. НР, вокруг 64 слабее.',
      e: k => 'Тратит 20% текущего НР, рывок на 180 сквозь врагов: ' + P(0.4 * k * TUN.kE * TUN.hpDmgK) + ' макс. НР всем задетым.',
      t: k => 'Заряд за каждые 10% макс. НР, потерянные или потраченные. На 5 зарядах удар по кругу 140 и лечение на ' + P(T.shuhuHeal * k) + ' макс. НР.',
      r: k => 'НР становится 50%. Удар по кругу 96 от урона атаки, макс. НР и НР, потерянного с прошлой Абсолютной техники; множитель ' + P(k * TUN.kR) + '.'
    },
    tr: [{ name: 'Бесконечная жизнь', text: 'При НР не выше 50% получаемое лечение +50%, Частокол не тратит НР.' }, { name: 'Нескончаемые смерти', text: 'Удар Частоколом по пробитому врагу лечит 5% макс. НР.' }],
    ei: [{ name: 'Порезы в аду жгут сильнее', text: 'Абсолютная техника бьёт цель ещё на 150% НР, потерянного с прошлой Абсолютной техники.' }, { name: 'Перерождение в бесчувственную оболочку', text: 'Дар Шуху срабатывает на 4 зарядах и бьёт ещё на 50% макс. НР.' }]
  };

  function svarog(A, u, f, big) {
    const k = tk(A, u) || A.lvlK('t', 1), mul = 1.0 * k * TUN.kT * (tr(u, 0) ? 1.3 : 1) * (big ? 2 : 1), r = big ? 96 : tr(u, 0) ? 64 : 0;
    const list = r ? A.unitsIn(circle(f.x, f.y, r), 'foe') : [f];
    if (!list.includes(f)) list.push(f);
    for (const v of list) A.hit(u, v, { m: mul, kind: 'bonus', tough: T.toughBasic / 2 });
    A.emit({ t: 'fx', kind: 'svarog', x: f.x, y: f.y, r: r || 24, elem: u.elem });
  }

  KITS.clara = {
    q: {
      cost: 35, cd: 8, aim: 'self',
      cast(A, u, k) {
        for (const v of near(A, u, 160)) {
          const marked = v.fx.some(f => f.n === 'Метка Сварога');
          A.hit(u, v, { m: (marked ? 2.4 : 1.2) * k * TUN.kQ, kind: 'q', tough: T.toughSkill });
          v.fx = v.fx.filter(f => f.n !== 'Метка Сварога');
        }
        A.emit({ t: 'fx', kind: 'svarog', x: u.x, y: u.y, r: 160, elem: u.elem });
      }
    },
    e: {
      cost: 30, cd: 16, aim: 'self',
      cast(A, u, k) {
        for (const v of near(A, u, 120)) A.hit(u, v, { m: 0.6 * k * TUN.kE, kind: 'e', tough: TUN.toughTech });
        for (const v of near(A, u, 160)) { A.addFx(v, { n: 'Небольшая цена победы', k: 'taunt', v: 1, t: 3, src: u }); v.tgt = u.uid; }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 220, elem: u.elem });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k) {
        A.addFx(u, { n: 'Обещание', k: 'dr', v: 0.25 * k, t: 6 });
        A.addFx(u, { n: 'Обещание: внимание', k: 'aggroP', v: 3, t: 6 });
        if (tr(u, 1)) A.addFx(u, { n: 'Под защитой', k: 'ccImmune', v: 1, t: 6 });
        if (ei(u, 0)) A.addFx(u, { n: 'Крепкие объятия', k: 'atk', v: 0.3, t: 6 });
        u.tal.promise = ei(u, 1) ? 3 : 2; u.tal.promiseT = A.time + 6;
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 96, elem: u.elem });
      }
    },
    counter(A, u, f) {
      const last = (u.tal.cnt || (u.tal.cnt = {}))[f.uid] || -9;
      if (A.time - last < 1) return;
      u.tal.cnt[f.uid] = A.time;
      A.addFx(f, { n: 'Метка Сварога', k: 'mark', v: 1, t: 30 });
      const big = u.tal.promise > 0 && A.time < u.tal.promiseT;
      if (big) u.tal.promise--;
      svarog(A, u, f, big);
    },
    onHurt(A, u, f) { if (u.abil.t && !f.dead) KITS.clara.counter(A, u, f); },
    onAllyHurt(A, u, tgt, f) { if (ei(u, 1) && tgt.kind !== 'hero' && !f.dead && Math.hypot(tgt.x - u.x, tgt.y - u.y) <= 300 && A.rng() < 0.5) KITS.clara.counter(A, u, f); },
    tick(A, u) { if (u.abil.t) A.addFx(u, { n: 'Сварог рядом', k: 'dr', v: 0.1 * tk(A, u), t: 0.5 }); },
    text: {
      q: k => 'Сварог бьёт всех врагов в 160: ' + P(1.2 * k * TUN.kQ) + ', врагов с Меткой Сварога ещё на ' + P(1.2 * k * TUN.kQ) + '; Метки снимаются.',
      e: k => 'Удар по кругу 120: ' + P(0.6 * k * TUN.kE) + '; враги в 160 бьют только Клару 3 с.',
      t: k => 'Клара получает на ' + P(0.1 * k) + ' меньше урона. Ударивший её получает Метку, Сварог бьёт в ответ на ' + P(1.0 * k * TUN.kT) + '.',
      r: k => '6 с: получаемый урон −' + P(0.25 * k) + ', агрессия ×4, две усиленные контратаки Сварога по кругу 96.'
    },
    tr: [{ name: 'Месть', text: 'Контратаки Сварога +30% и бьют по кругу 64 вокруг цели.' }, { name: 'Под защитой', text: 'Пока действует Абсолютная техника, Клару нельзя оглушить и заморозить.' }],
    ei: [{ name: 'Крепкие объятия', text: 'После Абсолютной техники урон атаки +30% на 6 с.' }, { name: 'Надёжный спутник', text: 'Когда враг бьёт турель или базу в 300 от Клары, Сварог с шансом 50% отвечает и ставит Метку; Абсолютная техника даёт ещё одну усиленную контратаку.' }]
  };

  KITS.seele = {
    resurge(A, u, k, t) {
      A.addFx(u, { n: 'Усиление', k: 'dmg', v: 0.4 * k, t });
      if (tr(u, 0)) A.addFx(u, { n: 'Рваная рана', k: 'pen', v: 0.3, t });
    },
    q: {
      cost: 30, cd: 7, aim: 'target', range: 200,
      charges: u => (ei(u, 0) ? 2 : 1),
      cast(A, u, k, aim) {
        const t = aim.t;
        A.dash(u, t.x, t.y, 200, u.r + t.r + 2);
        A.hit(u, t, { m: 2.2 * k * TUN.kQ, kind: 'q', tough: T.toughSkill });
        const max = ei(u, 0) ? 2 : undefined;
        A.addFx(u, { n: 'Ускорение', k: 'aspd', v: 0.25 * k, t: 6, max });
        A.addFx(u, { n: 'Ускорение: шаг', k: 'mspd', v: 0.25 * k, t: 6, max });
        A.emit({ t: 'fx', kind: 'slash', x: t.x, y: t.y, elem: u.elem });
      }
    },
    e: {
      cost: 35, cd: 18, aim: 'self',
      cast(A, u, k) {
        A.addFx(u, { n: 'Призрачный шаг', k: 'invis', v: 1, t: 3 });
        u.tal.ghostK = k;
        for (const f of A.units) if (f.side === 'foe' && f.tgt === u.uid) f.tgt = null;
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 40, elem: u.elem });
      }
    },
    t: {
      onKill(A, u, k) {
        if (A.time - (u.tal.resetAt || -9) >= 1.5) { u.tal.resetAt = A.time; u.cd.q = 0; }
        KITS.seele.resurge(A, u, k, 4);
        A.say(u, 'Талант');
      }
    },
    r: {
      cd: 50, aim: 'target', range: 300,
      cast(A, u, k, aim, l) {
        const t = aim.t;
        A.dash(u, t.x, t.y, 300, u.r + t.r + 2);
        const amt = 4.25 * k * TUN.kR * A.atkOf(u);
        A.hit(u, t, { amt, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        KITS.seele.resurge(A, u, u.abil.t ? A.lvlK('t', u.abil.t) : k, 6);
        if (ei(u, 1)) u.tal.vortex = { uid: t.uid, until: A.time + 8, amt: amt * 0.15 };
        A.emit({ t: 'fx', kind: 'slash', x: t.x, y: t.y, elem: u.elem, big: true });
      }
    },
    onHit(A, u, t, o) {
      const inv = u.fx.find(f => f.k === 'invis');
      if (inv) { u.fx.splice(u.fx.indexOf(inv), 1); KITS.seele.resurge(A, u, u.tal.ghostK || 0.6, 4); }
      if (tr(u, 1) && o.basic) u.cd.q = Math.max(0, u.cd.q - 0.6);
      const vx = u.tal.vortex;
      if (vx && !o.vortex && vx.uid === t.uid && A.time < vx.until) A.hit(u, t, { amt: vx.amt, kind: 'bonus', noTough: true, vortex: true, noCrit: true });
    },
    onFoeDie(A, u, f) {
      const vx = u.tal.vortex;
      if (!vx || vx.uid !== f.uid || A.time >= vx.until) return;
      const n = A.nearestFoe(f.x, f.y, 300, x => x !== f);
      if (n) vx.uid = n.uid; else u.tal.vortex = null;
    },
    text: {
      q: k => 'Рывок к цели до 200 и удар ' + P(2.2 * k * TUN.kQ) + '; +' + P(0.25 * k) + ' скорости атаки и передвижения на 6 с.',
      e: k => '3 с невидимости: враги теряют Зеле из целей; первый удар из невидимости даёт Усиление.',
      t: k => 'Добивание сбрасывает перезарядку Навыка и даёт Усиление на 4 с: урон +' + P(0.4 * k) + '.',
      r: k => 'Рывок к цели до 300, удар ' + P(4.25 * k * TUN.kR) + ', Усиление на 6 с.'
    },
    tr: [{ name: 'Рваная рана', text: 'В Усилении Зеле игнорирует 30% брони.' }, { name: 'Рябь на воде', text: 'Каждая Атака сокращает перезарядку Навыка на 0,6 с.' }],
    ei: [{ name: 'Танец бабочки', text: 'Прибавка скорости от Навыка складывается дважды, у Навыка два заряда.' }, { name: 'Дезинтеграция', text: 'Абсолютная техника вешает Вихрь бабочек на 8 с: удары Зеле по цели бьют ещё на 15% урона Абсолютной техники; Вихрь переходит на ближайшего врага, если цель погибла.' }]
  };

  KITS.danheng = {
    basic(A, u, t, o) {
      if (u.tal.pen > 0) { u.tal.pen--; o.pen = 0.36 * (tk(A, u) || 0); }
      A.hit(u, t, o);
      u.en = Math.min(u.enMax, u.en + TUN.enHit);
      if (tr(u, 1) && A.rng() < 0.5) A.addFx(u, { n: 'Тень отчаяния', k: 'aspd', v: 0.2, t: 6 });
      A.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y, elem: u.elem });
    },
    q: {
      cost: 30, cd: 7, aim: 'point', range: 220,
      cast(A, u, k, aim) {
        const zone = lineFrom(u, aim.x, aim.y, 220, 40), hits = A.unitsIn(zone, 'foe').sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        hits.forEach((v, i) => {
          A.hit(u, v, { m: (i ? 0.5 : 2.6) * k * TUN.kQ, kind: 'q', tough: i ? T.toughSkill / 2 : T.toughSkill });
          const slow = (ei(u, 1) ? 0.2 : 0.12) * k * (A.lastCrit ? 2 : 1);
          A.addFx(v, { n: 'Пронзающая буря', k: 'slow', v: slow, t: 6, max: ei(u, 1) ? 3 : undefined });
        });
        if (u.abil.t) u.tal.pen = 2;
        A.face(u, aim.x - u.x, aim.y - u.y);
        A.emit({ t: 'fx', kind: 'line', x: u.x, y: u.y, ang: zone.ang, len: 220, w: 40, elem: u.elem });
      }
    },
    e: {
      cost: 30, cd: 18, aim: 'self',
      cast(A, u, k) {
        A.addFx(u, { n: 'Тихий ветер', k: 'atk', v: 0.4 * k, t: 9 });
        A.addFx(u, { n: 'Тихий ветер: шаг', k: 'mspd', v: 0.2 * k, t: 9 });
        if (u.abil.t) u.tal.pen = 2;
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 48, elem: u.elem });
      }
    },
    t: {},
    r: {
      cd: 55, aim: 'point', range: 320,
      cast(A, u, k, aim, l) {
        const zone = lineFrom(u, aim.x, aim.y, 320, 64);
        let kills = 0;
        for (const v of A.unitsIn(zone, 'foe')) {
          const slowed = v.fx.some(f => f.k === 'slow');
          A.hit(u, v, { m: (4 + (slowed ? 1.2 : 0)) * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
          if (v.dead) kills++;
        }
        if (ei(u, 0) && kills) u.tal.halfR = true;
        A.face(u, aim.x - u.x, aim.y - u.y);
        A.emit({ t: 'fx', kind: 'line', x: u.x, y: u.y, ang: zone.ang, len: 320, w: 64, elem: u.elem, big: true });
      }
    },
    dmgMul(A, u, t, o) { return tr(u, 0) && o.basic && t.fx.some(f => f.k === 'slow') ? 1.4 : 1; },
    tick(A, u) { if (u.tal.halfR) { u.tal.halfR = false; u.cd.r /= 2; } },
    text: {
      q: k => 'Выпад по линии 220: первая цель ' + P(2.6 * k * TUN.kQ) + ', остальные ' + P(0.5 * k * TUN.kQ) + '; замедление ' + P(0.12 * k) + ' на 6 с, крит удваивает.',
      e: k => 'Урон атаки +' + P(0.4 * k) + ' и скорость передвижения +' + P(0.2 * k) + ' на 9 с.',
      t: k => 'После Навыка или Техники две следующие Атаки игнорируют ' + P(0.36 * k) + ' брони.',
      r: k => 'Дракон бьёт по линии 320 перед героем: ' + P(4 * k * TUN.kR) + ', по замедленным ещё +' + P(1.2 * k * TUN.kR) + '.'
    },
    tr: [{ name: 'Резкий ветер', text: 'Атака по замедленным +40%.' }, { name: 'Тень отчаяния', text: 'После Атаки с шансом 50% скорость атаки +20% на 6 с.' }],
    ei: [{ name: 'Парящее солнце и ревущий дракон', text: 'Если Абсолютная техника добивает, её перезарядка сразу уменьшается вдвое.' }, { name: 'Смятенная душа томится в ожидании', text: 'Замедление от Навыка складывается до 3 раз и сильнее на 8%.' }]
  };

  function numbyHit(A, u, k, t, mul) {
    const rise = u.fx.some(f => f.n === 'Поразительный рост!');
    const critD = (rise ? 0.25 : 0) + (ei(u, 0) ? A.sum(t, 'futures') : 0);
    const list = ei(u, 1) && rise ? A.unitsIn(circle(t.x, t.y, 64), 'foe') : [t];
    if (!list.includes(t)) list.push(t);
    for (const v of list) A.hit(u, v, { m: 1.5 * k * mul * (rise ? 1 + A.sum(u, 'rise') : 1), kind: 'bonus', critD, tough: T.toughBasic, elem: 'fire' });
    if (u.fx.some(f => f.n === 'Дотация')) u.en = Math.min(u.enMax, u.en + 15 * (u.tal.dotK || 1));
    if (rise && tr(u, 1)) u.en = Math.min(u.enMax, u.en + 10);
    if (ei(u, 0) && t.uid === u.tal.debt) A.addFx(t, { n: 'Рынок будущего', k: 'futures', v: 0.25, t: 15, max: 2 });
    u.tal.numbyAt = { x: t.x, y: t.y, t: A.time };
    A.emit({ t: 'fx', kind: 'numby', x: t.x, y: t.y, r: 20, elem: 'fire' });
  }

  KITS.topaz = {
    basic(A, u, t, o) {
      o.kind = tr(u, 0) ? 'bonus' : 'basic';
      o.after = (A2, v) => { if (v.uid === u.tal.debt) u.tal.nT = (u.tal.nT == null ? 3 : u.tal.nT) - 0.75; };
      A.shoot(u, t, o);
    },
    q: {
      cost: 25, cd: 6, aim: 'target', range: 260,
      cast(A, u, k, aim) {
        const t = aim.t, old = u.tal.debt != null ? A.byId(u.tal.debt) : null;
        if (old) old.fx = old.fx.filter(f => f.n !== 'Справка о задолженности');
        A.addFx(t, { n: 'Справка о задолженности', k: 'debt', v: 0.5 * k, t: 15 });
        u.tal.debt = t.uid;
        numbyHit(A, u, k, t, TUN.kQ);
      }
    },
    e: {
      cost: 0, cd: 20, aim: 'self',
      cast(A, u, k) {
        u.tal.dotK = k;
        A.addFx(u, { n: 'Дотация', k: 'aspd', v: 0.3 * k, t: 6 });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 40, elem: 'fire' });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k) {
        A.addFx(u, { n: 'Поразительный рост!', k: 'rise', v: 1.5 * k, t: ei(u, 1) ? 14 : 10 });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 80, elem: 'fire' });
      }
    },
    dmgMul(A, u, t, o) {
      if (o.kind !== 'bonus') return 1;
      const d = t.fx.find(f => f.n === 'Справка о задолженности');
      return d ? 1 + d.v : 1;
    },
    tick(A, u) {
      if (!u.abil.t) return;
      const rise = u.fx.some(f => f.n === 'Поразительный рост!');
      if (u.tal.nT == null) u.tal.nT = 3;
      u.tal.nT -= DT * (rise ? 2 : 1);
      if (u.tal.nT > 0) return;
      const d = u.tal.debt != null ? A.byId(u.tal.debt) : null, t = d && d.fx.some(f => f.n === 'Справка о задолженности') ? d : A.nearestFoe(u.x, u.y, 420);
      if (!t) { u.tal.nT = 0; return; }
      u.tal.nT = 3;
      numbyHit(A, u, tk(A, u), t, TUN.kT);
    },
    text: {
      q: k => '«Справка о задолженности» на цель на 15 с: бонус-атаки по ней +' + P(0.5 * k) + '; Счетовод сразу бьёт её на ' + P(1.5 * k * TUN.kQ) + '.',
      e: k => '6 с: каждый удар Счетовода даёт ' + Math.round(15 * k) + ' энергии, скорость атаки +' + P(0.3 * k) + '.',
      t: k => 'Счетовод бьёт должника или ближайшего врага раз в 3 с на ' + P(1.5 * k * TUN.kT) + '. Атака по должнику торопит его на 0,75 с.',
      r: k => '«Поразительный рост!» на 10 с: удары Счетовода +' + P(1.5 * k) + ', крит. урон +25%, интервал вдвое короче.'
    },
    tr: [{ name: 'Перерасход', text: 'Атака Топаз считается бонус-атакой.' }, { name: 'Техническое регулирование', text: 'В «Поразительном росте» каждый удар Счетовода даёт 10 энергии.' }],
    ei: [{ name: 'Рынок будущего', text: 'Каждая бонус-атака по должнику: крит. урон бонус-атак по нему +25%, до 2 раз.' }, { name: 'Механизмы поощрения', text: '«Поразительный рост» на 4 с дольше, удары Счетовода бьют по кругу 64 вокруг цели.' }]
  };

  KITS.himeko = {
    q: {
      cost: 35, cd: 6, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        A.addArea({ shape: 'circle', x: aim.x, y: aim.y, r: 80, side: 'foe', delay: 0.25, kind: 'blast', elem: 'fire', onFire(A2, a) {
          const hits = burst(A2, u, a.x, a.y, 80, 2 * k * TUN.kQ, 0.8 * k * TUN.kQ, { kind: 'q', tough: T.toughSkill });
          if (ei(u, 0) && u.abil.t && hits.length >= 3) KITS.himeko.t.charge(A2, u, tk(A2, u), Math.floor(hits.length / 3));
          A2.emit({ t: 'fx', kind: 'boom', x: a.x, y: a.y, r: 80, elem: 'fire' });
        } });
        A.emit({ t: 'fx', kind: 'throw', x: u.x, y: u.y, tx: aim.x, ty: aim.y, elem: 'fire' });
      }
    },
    e: {
      cost: 30, cd: 18, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        A.addArea({ shape: 'circle', x: aim.x, y: aim.y, r: 160, side: 'foe', t: 6, every: 0.25, kind: 'zone', elem: 'fire', onTick(A2, a) {
          for (const v of A2.unitsIn(a, 'foe')) A2.addFx(v, { n: 'Неполное сгорание', k: 'elemVuln', elem: 'fire', v: 0.2 * k, t: 0.5 });
        } });
      }
    },
    t: {
      charge(A, u, k, n) {
        u.tal.ch = (u.tal.ch || 0) + n;
        if (u.tal.ch < 3) return;
        u.tal.ch = 0;
        for (const v of near(A, u, 220)) A.hit(u, v, { m: 1.4 * k * TUN.kT, kind: 't', tough: T.toughBasic });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 220, elem: 'fire' });
        A.say(u, 'Талант');
      },
      onBreak(A, u, k) { KITS.himeko.t.charge(A, u, k, 1); },
      onKill(A, u, k) { u.tal.kills = (u.tal.kills || 0) + 1; if (u.tal.kills % 5 === 0) KITS.himeko.t.charge(A, u, k, 1); }
    },
    r: {
      cd: 65, aim: 'point', range: 300,
      cast(A, u, k, aim, l) {
        const strike = (x, y, mul) => A.addArea({ shape: 'circle', x, y, r: 200, side: 'foe', delay: 0.5, kind: 'orbit', elem: 'fire', onFire(A2, a) {
          for (const v of A2.unitsIn(a, 'foe')) { A2.hit(u, v, { m: 2.3 * k * TUN.kR * mul, kind: 'r', tough: mul < 1 ? 0 : T.toughUlt, type: ultType(u, l) }); if (v.dead) u.en = Math.min(u.enMax, u.en + 5); }
          A2.emit({ t: 'fx', kind: 'boom', x: a.x, y: a.y, r: 200, elem: 'fire' });
        } });
        strike(aim.x, aim.y, 1);
        if (ei(u, 1)) for (let i = 1; i <= 2; i++) A.later(0.5 * i, () => strike(aim.x + (A.rng() - 0.5) * 120, aim.y + (A.rng() - 0.5) * 120, 0.4));
      }
    },
    burning: v => v.fx.some(f => f.k === 'dot' && f.n === 'Горение'),
    onHit(A, u, t, o) {
      if (tr(u, 0) && o.kind !== 'dot' && o.kind !== 'break' && !t.dead && A.rng() < 0.5) A.addFx(t, { n: 'Горение', k: 'dot', v: 0, dps: 0.3 * A.atkOf(u), elem: 'fire', t: 6, src: u });
    },
    dmgMul(A, u, t) { return tr(u, 1) && KITS.himeko.burning(t) ? 1.2 : 1; },
    onFoeDie(A, u, f) {
      if (!tr(u, 1) || !KITS.himeko.burning(f)) return;
      for (const v of A.unitsIn(circle(f.x, f.y, 64), 'foe')) A.hit(u, v, { m: 0.4, kind: 'bonus', noTough: true, elem: 'fire' });
      A.emit({ t: 'fx', kind: 'boom', x: f.x, y: f.y, r: 64, elem: 'fire' });
    },
    text: {
      q: k => 'Шар в точку, круг 80: центр ' + P(2 * k * TUN.kQ) + ', вокруг ' + P(0.8 * k * TUN.kQ) + '.',
      e: k => 'Область 160 на 6 с: враги получают +' + P(0.2 * k) + ' огненного урона.',
      t: k => 'Заряд за пробитие и за 5 добиваний; на 3 зарядах огненная волна по кругу 220: ' + P(1.4 * k * TUN.kT) + '.',
      r: k => 'Удар с орбиты по кругу 200: ' + P(2.3 * k * TUN.kR) + ', +5 энергии за каждое добивание.'
    },
    tr: [{ name: 'Звёздный огонь', text: 'Любой удар с шансом 50% поджигает на 6 с: 30% урона атаки в секунду.' }, { name: 'Магма', text: 'Урон по горящим +20%; горящий враг при гибели взрывается на 40% по кругу 64.' }],
    ei: [{ name: 'Самоотверженность', text: 'Навык даёт заряд Таланта за каждые 3 задетых врага.' }, { name: 'Освоение!', text: 'Абсолютная техника бьёт ещё 2 раза рядом с точкой, через 0,5 с, каждый раз на 40% урона.' }]
  };

  KITS.herta = {
    q: {
      cost: 30, cd: 5, aim: 'self',
      cast(A, u, k) {
        for (const v of near(A, u, 140)) A.hit(u, v, { m: (1 + (v.hp >= v.hpMax * 0.5 ? 0.2 + (tr(u, 0) ? 0.25 : 0) : 0)) * k * TUN.kQ, kind: 'q', tough: T.toughSkill });
        A.emit({ t: 'fx', kind: 'doll', x: u.x, y: u.y, r: 140, elem: 'ice' });
      }
    },
    e: {
      cost: 30, cd: 16, aim: 'self',
      cast(A, u, k) {
        A.addFx(u, { n: 'Кукла на удачу', k: 'atk', v: 0.4 * k, t: 9 });
        A.addFx(u, { n: 'Кукла на удачу: стойкость', k: 'slowImmune', v: 1, t: 9 });
        u.fx = u.fx.filter(f => f.k !== 'slow');
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 40, elem: 'ice' });
      }
    },
    t: {},
    r: {
      cd: 55, aim: 'self',
      cast(A, u, k, aim, l) {
        for (const v of near(A, u, 260)) {
          const frozen = v.fx.some(f => f.n === 'Заморозка');
          A.hit(u, v, { m: 2 * k * TUN.kR * (tr(u, 1) && frozen ? 1.2 : 1), kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
          if (tr(u, 1) && !v.dead) A.addFx(v, { n: 'Заморозка', k: 'stun', v: 1, t: 1.5 });
        }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 260, elem: 'ice' });
      }
    },
    onFoeHurt(A, u, f, before) {
      if (!u.abil.t || before < f.hpMax * 0.5 || f.hp >= f.hpMax * 0.5 || A.time - (u.tal.dollAt || -9) < 1 || Math.hypot(f.x - u.x, f.y - u.y) > 300) return;
      u.tal.dollAt = A.time;
      for (const v of A.unitsIn(circle(f.x, f.y, 120), 'foe')) A.hit(u, v, { m: 0.4 * tk(A, u) * TUN.kT, kind: 't', tough: T.toughBasic });
      if (ei(u, 1)) A.addFx(u, { n: 'Всегда в погоне за победой', k: 'crit', v: 0.03, t: 9999, max: 10 });
      A.emit({ t: 'fx', kind: 'doll', x: f.x, y: f.y, r: 120, elem: 'ice' });
    },
    onHit(A, u, t, o) {
      if (!ei(u, 0) || !o.basic || t.hp > t.hpMax * 0.5) return;
      for (const v of A.unitsIn(circle(t.x, t.y, 64), 'foe')) A.hit(u, v, { m: 0.4, kind: 'bonus', noTough: true });
    },
    onWaveEnd(A, u) { u.fx = u.fx.filter(f => f.n !== 'Всегда в погоне за победой'); },
    text: {
      q: k => 'Кукла бьёт по кругу 140 вокруг Герты: ' + P(k * TUN.kQ) + ', по врагам с НР не ниже 50% ещё +' + P(0.2 * k * TUN.kQ) + '.',
      e: k => 'Урон атаки +' + P(0.4 * k) + ' на 9 с, замедление на Герту не действует.',
      t: k => 'Враг в 300 падает ниже 50% НР: кукла бьёт лёдом по кругу 120 вокруг него на ' + P(0.4 * k * TUN.kT) + ', раз в секунду.',
      r: k => 'Лёд по кругу 260 вокруг Герты: ' + P(2 * k * TUN.kR) + '.'
    },
    tr: [{ name: 'Эффективность', text: 'Урон Навыка по врагам с НР не ниже 50% ещё +25%.' }, { name: 'Оледенение', text: 'Абсолютная техника замораживает на 1,5 с, её урон по замороженным +20%.' }],
    ei: [{ name: 'Пинаю лежачего', text: 'Атака по врагу с НР не выше 50% бьёт лёдом ещё на 40% по кругу 64.' }, { name: 'Всегда в погоне за победой', text: 'Каждое срабатывание Таланта: шанс крита +3% до конца волны, до 10 раз.' }]
  };

  function salvo(A, u, k) {
    const L = u.tal.lord, n = Math.min(10, L.hits), adj = ei(u, 0) ? 0.5 : 0.25, critD = tr(u, 0) && n >= 6 ? 0.25 : 0;
    L.hits = 3;
    L.t = 6 - 0.3 * Math.max(0, n - 3);
    L.busy = A.time + n * 0.18;
    for (let i = 0; i < n; i++) A.later(0.18 * i, () => {
      if (u.dead) return;
      const list = near(A, u, 260);
      if (!list.length) return;
      const t = list[A.rng.int(list.length)];
      A.hit(u, t, { m: 0.66 * k * TUN.kT, kind: 'bonus', critD, tough: T.toughBasic, elem: 'elec' });
      for (const v of A.unitsIn(circle(t.x, t.y, 72), 'foe')) if (v !== t) A.hit(u, v, { m: 0.66 * k * TUN.kT * adj, kind: 'bonus', noTough: true, elem: 'elec' });
      if (ei(u, 1) && !t.dead) A.addFx(t, { n: 'Слава поражает врагов', k: 'vuln', v: 0.12, t: 3, max: 3 });
      u.tal.lordAt = { x: t.x, y: t.y, t: A.time };
      A.emit({ t: 'fx', kind: 'bolt', x: t.x, y: t.y, r: 30, elem: 'elec' });
    });
  }

  KITS.jingyuan = {
    lord: u => u.tal.lord || (u.tal.lord = { hits: 3, t: 6 }),
    q: {
      cost: 35, cd: 6, aim: 'self',
      cast(A, u, k) {
        for (const v of near(A, u, 140)) A.hit(u, v, { m: k * TUN.kQ, kind: 'q', tough: T.toughSkill });
        const L = KITS.jingyuan.lord(u); L.hits = Math.min(10, L.hits + 2);
        if (tr(u, 1)) A.addFx(u, { n: 'Военный маршал', k: 'crit', v: 0.1, t: 6 });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 140, elem: 'elec' });
      }
    },
    e: {
      cost: 30, cd: 20, aim: 'self',
      cast(A, u, k) {
        const L = KITS.jingyuan.lord(u); L.hits = Math.min(10, L.hits + 3);
        salvo(A, u, tk(A, u) || k);
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k, aim, l) {
        for (const v of near(A, u, 220)) A.hit(u, v, { m: 2 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        const L = KITS.jingyuan.lord(u); L.hits = Math.min(10, L.hits + 3);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 220, elem: 'elec' });
      }
    },
    tick(A, u) {
      if (!u.abil.t) return;
      const L = KITS.jingyuan.lord(u);
      if (L.busy && A.time < L.busy) return;
      L.t -= DT;
      if (L.t > 0) return;
      if (!near(A, u, 260).length) { L.t = 0; return; }
      salvo(A, u, tk(A, u));
    },
    text: {
      q: k => 'Удар по кругу 140: ' + P(k * TUN.kQ) + '; Повелитель молний +2 удара в серии.',
      e: k => 'Следующая серия Повелителя сразу и с +3 ударами.',
      t: k => 'Повелитель бьёт серией раз в 6 с: 3 удара (до 10) по ' + P(0.66 * k * TUN.kT) + ' по случайным врагам в 260; удары сверх трёх торопят серию.',
      r: k => 'Удар по кругу 220: ' + P(2 * k * TUN.kR) + '; Повелитель +3 удара.'
    },
    tr: [{ name: 'Пробитие строя', text: 'Если в серии 6 ударов и больше, их крит. урон +25%.' }, { name: 'Военный маршал', text: 'Навык даёт шанс крита +10% на 6 с.' }],
    ei: [{ name: 'Взмах крушит скалы', text: 'Соседи цели получают 50% урона удара Повелителя вместо 25%.' }, { name: 'Слава поражает врагов', text: 'Каждый удар Повелителя по цели повышает урон по ней на 12% до конца серии, до 3 раз.' }]
  };

  const allies = (A, x, y, r) => A.unitsIn(circle(x, y, r), 'ally');
  const aura = (A, u, r, f) => { for (const v of allies(A, u.x, u.y, r)) A.addFx(v, Object.assign({ t: 0.5 }, f)); };
  const cleanse = u => { u.fx = u.fx.filter(f => !(f.deb || f.k === 'slow' || f.k === 'stun' || f.k === 'weaken')); };
  function bounce(A, u, first, n, r, fn) {
    const done = new Set();
    let cur = first;
    for (let i = 0; i < n && cur; i++) { fn(cur, i); done.add(cur.uid); cur = A.nearestFoe(cur.x, cur.y, r, f => !done.has(f.uid)); }
    return done.size;
  }

  KITS.bronya = {
    basic(A, u, t, o) {
      if (tr(u, 0)) o.crit = 1;
      if (u.abil.t) { const cut = 0.9 * tk(A, u); u.cd.q = Math.max(0, u.cd.q - cut); u.cd.e = Math.max(0, u.cd.e - cut); }
      A.shoot(u, t, o);
    },
    q: {
      cost: 35, cd: 12, aim: 'ally', range: 300,
      cast(A, u, k, aim) {
        const v = aim.t;
        if (v.kind === 'turret') A.addFx(v, { n: 'Боевой приказ', k: 'aspd', v: 0.5 * k, t: 3 });
        else { cleanse(v); A.addFx(v, { n: 'Боевой приказ', k: 'dmg', v: 0.66 * k, t: 3 }); if (v === u) u.tal.resetE = true; }
        if (ei(u, 0) && !u.tal.honed && A.rng() < 0.5) { u.tal.freeQ = true; u.tal.honed = true; } else u.tal.honed = false;
        A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 30, elem: u.elem });
      }
    },
    e: {
      cost: 40, cd: 24, aim: 'point', range: 300,
      cast(A, u, k, aim) {
        A.addArea({ shape: 'circle', x: aim.x, y: aim.y, r: 220, side: 'ally', t: 10, every: 0.25, kind: 'zone', elem: 'wind', onTick(A2, a) {
          for (const v of A2.unitsIn(a, 'ally')) { A2.addFx(v, { n: 'Знамя командира', k: 'atk', v: 0.15 * k, t: 0.5 }); A2.addFx(v, { n: 'Знамя командира: темп', k: 'aspd', v: 0.1 * k, t: 0.5 }); }
        } });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 300)) { A.addFx(v, { n: 'Марш Белобога', k: 'atk', v: 0.55 * k, t: 6 }); A.addFx(v, { n: 'Марш Белобога: крит', k: 'critD', v: 0.3 * k, t: 6 }); }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'wind' });
      }
    },
    tick(A, u) {
      if (u.tal.resetE) { u.tal.resetE = false; u.cd.e = 0; }
      if (u.tal.freeQ) { u.tal.freeQ = false; u.cd.q = 0; }
      if (tr(u, 1)) aura(A, u, 400, { n: 'Военная мощь', k: 'dmg', v: 0.1 });
    },
    onAllyAttack(A, u, src, t) {
      if (!ei(u, 1) || src.kind !== 'turret' || t.dead || !(t.weak || []).includes('wind') || A.time - (u.tal.ambush || -9) < 3) return;
      u.tal.ambush = A.time;
      A.hit(u, t, { m: 0.8, kind: 'bonus', elem: 'wind', tough: T.toughBasic });
    },
    text: {
      q: k => 'Союзник в 300 или сама Броня: снимает ослабления, +' + P(0.66 * k) + ' урона на 3 с, сбрасывает Технику; турель стреляет на ' + P(0.5 * k) + ' быстрее.',
      e: k => 'Знамя в точке на 10 с, круг 220: урон атаки союзников +' + P(0.15 * k) + ', скорость атаки +' + P(0.1 * k) + '.',
      t: k => 'Каждая Атака сокращает перезарядки Навыка и Техники на ' + (Math.round(9 * k) / 10) + ' с.',
      r: k => 'Союзники в 300: урон атаки +' + P(0.55 * k) + ', крит. урон +' + P(0.3 * k) + ' на 6 с.'
    },
    tr: [{ name: 'Приказ', text: 'Атака Брони всегда критическая.' }, { name: 'Военная мощь', text: 'Пока Броня жива, урон союзников в 400 +10%.' }],
    ei: [{ name: 'Оттачивай свои силы', text: 'Навык с шансом 50% не уходит на перезарядку, не два раза подряд.' }, { name: 'Застань врага врасплох', text: 'Когда турель бьёт врага со слабостью к ветру, Броня добивает его бонус-атакой на 80%, раз в 3 с.' }]
  };

  KITS.asta = {
    charge(A, u, t) {
      if (!u.abil.t) return;
      const seen = u.tal.seen || (u.tal.seen = new Set());
      u.tal.lastHit = A.time;
      if (seen.has(t.uid)) return;
      seen.add(t.uid);
      u.tal.ch = Math.min(5, (u.tal.ch || 0) + 1); u.tal.chT = A.time;
    },
    q: {
      cost: 30, cd: 5, aim: 'target', range: 260,
      cast(A, u, k, aim) {
        bounce(A, u, aim.t, ei(u, 0) ? 7 : 5, 140, v => { A.hit(u, v, { m: 0.5 * k * TUN.kQ, kind: 'q', tough: T.toughBasic }); A.emit({ t: 'fx', kind: 'boom', x: v.x, y: v.y, r: 24, elem: 'fire' }); });
      }
    },
    e: {
      cost: 35, cd: 14, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        for (let i = 0; i < 3; i++) A.later(0.5 * i, () => {
          for (const v of A.unitsIn(circle(aim.x, aim.y, 140), 'foe')) A.hit(u, v, { m: 0.6 * k * TUN.kE, kind: 'e', tough: TUN.toughTech / 3 });
          A.emit({ t: 'fx', kind: 'boom', x: aim.x + (A.rng() - 0.5) * 60, y: aim.y + (A.rng() - 0.5) * 60, r: 50, elem: 'fire' });
        });
      }
    },
    t: {},
    r: {
      cd: 55, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 300)) { A.addFx(v, { n: 'Астральное благословение', k: 'aspd', v: 0.5 * k, t: 6 }); A.addFx(v, { n: 'Астральное благословение: шаг', k: 'mspd', v: 0.3 * k, t: 6 }); }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'fire' });
      }
    },
    onHit(A, u, t, o) {
      if (o.kind === 'dot' || o.kind === 'break') return;
      KITS.asta.charge(A, u, t);
      if (tr(u, 0) && o.basic && !t.dead && A.rng() < 0.8) A.addFx(t, { n: 'Горение', k: 'dot', v: 0, dps: 0.5 * A.atkOf(u) / 3, elem: 'fire', t: 9, src: u });
    },
    tick(A, u) {
      if (u.tal.ch && A.time - u.tal.chT >= 3 && !(ei(u, 1) && A.time - (u.tal.lastHit || -9) < 3)) { u.tal.ch = Math.max(0, u.tal.ch - 2); u.tal.chT = A.time; }
      if (u.tal.ch) aura(A, u, 300, { n: 'Заряд', k: 'atk', v: 0.14 * tk(A, u) * u.tal.ch });
      if (tr(u, 1)) aura(A, u, 400, { n: 'Воспламенение', k: 'dmgE_fire', v: 0.18 });
    },
    text: {
      q: k => (5) + ' отскоков по ' + P(0.5 * k * TUN.kQ) + ' урона атаки.',
      e: k => 'Метеоры по кругу 140 в точке: 3 удара по ' + P(0.6 * k * TUN.kE) + ' за 1,5 с.',
      t: k => 'Каждое попадание по новой цели даёт Заряд, до 5: урон атаки союзников в 300 +' + P(0.14 * k) + ' за Заряд. Каждые 3 с уходят 2 Заряда.',
      r: k => 'Союзники в 300: скорость атаки +' + P(0.5 * k) + ', скорость передвижения +' + P(0.3 * k) + ' на 6 с.'
    },
    tr: [{ name: 'Искры', text: 'Атака с шансом 80% поджигает на 9 с: 50% урона Атаки каждые 3 с.' }, { name: 'Воспламенение', text: 'Огненный урон союзников в 400 +18%.' }],
    ei: [{ name: 'Безмолвная песнь звезды', text: 'У Навыка 7 отскоков.' }, { name: 'Уютный сон под звёздами галактики', text: 'Заряды не уходят, пока Аста попадает по врагам.' }]
  };

  const overtone = (A, u, k, t) => {
    const extra = tr(u, 1) ? Math.min(0.36, Math.max(0, Math.floor((A.sum(u, 'breakEff') - 1.2) / 0.1)) * 0.06) : 0;
    for (const v of allies(A, u.x, u.y, 300)) { A.addFx(v, { n: 'Обертон', k: 'dmg', v: 0.32 * k + extra, t }); A.addFx(v, { n: 'Обертон: стойкость', k: 'toughP', v: 0.5 * k, t }); }
  };

  KITS.ruanmei = {
    q: {
      cost: 40, cd: 18, aim: 'self',
      cast(A, u, k) { overtone(A, u, k, 9); A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'ice' }); }
    },
    e: {
      cost: 30, cd: 14, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        overtone(A, u, A.lvlK('q', Math.max(1, u.abil.q)), 6);
        for (const v of A.unitsIn(circle(aim.x, aim.y, 120), 'foe')) {
          A.addFx(v, { n: 'Шёлковая серенада', k: 'slow', v: 0.4 * k, t: 4 });
          A.hit(u, v, { amt: 1, kind: 'e', tough: TUN.toughTech, forceTough: true, noCrit: true });
        }
        A.emit({ t: 'fx', kind: 'ring', x: aim.x, y: aim.y, r: 120, elem: 'ice' });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'point', range: 300,
      cast(A, u, k) {
        const t = ei(u, 1) ? 11 : 8, x = u.x, y = u.y;
        A.addArea({ shape: 'circle', x, y, r: 220, side: 'ally', t, every: 0.25, kind: 'zone', elem: 'ice', onTick(A2, a) {
          for (const v of A2.unitsIn(a, 'ally')) A2.addFx(v, { n: 'Лепестки на воде', k: 'pen', v: 0.25, t: 0.5 });
          for (const f of A2.unitsIn(a, 'foe')) if (f.brokenT > 0) f.rmBloom = A2.time + 7;
        } });
        A.emit({ t: 'fx', kind: 'ring', x, y, r: 220, elem: 'ice' });
      }
    },
    onAnyBreak(A, u, f) {
      if (!u.abil.t) return;
      const k = tk(A, u), mul = 1.2 * (ei(u, 1) ? 3 : 1);
      A.hit(u, f, { amt: H.breakBase(f.lvl) * H.ELEMENTS.ice.coef * mul * k * (1 + A.sum(u, 'breakEff')), type: 'magic', elem: 'ice', kind: 'break', noCrit: true, noTough: true });
    },
    onFoeRecover(A, u, f) {
      if (!f.rmBloom || A.time > f.rmBloom) return;
      f.rmBloom = 0;
      A.addFx(f, { n: 'Лепестки на воде: оцепенение', k: 'stun', v: 1, t: 1 });
      A.hit(u, f, { amt: H.breakBase(f.lvl) * H.ELEMENTS.ice.coef * 0.6, type: 'magic', elem: 'ice', kind: 'break', noCrit: true, noTough: true });
    },
    tick(A, u) {
      if (u.abil.t) { const k = tk(A, u); aura(A, u, 400, { n: 'Струны', k: 'aspd', v: 0.1 * k }); aura(A, u, 400, { n: 'Струны: шаг', k: 'mspd', v: 0.1 * k }); }
      if (tr(u, 0)) aura(A, u, 400, { n: 'Инертное дыхание', k: 'breakEff', v: 0.2 });
      if (ei(u, 0)) aura(A, u, 400, { n: 'Прогулка вдоль тростника', k: 'dmgBroken', v: 0.4 });
    },
    text: {
      q: k => '«Обертон» на 9 с союзникам в 300: урон +' + P(0.32 * k) + ', урон по стойкости +' + P(0.5 * k) + '.',
      e: k => 'Обертон на 6 с и шёлк по кругу 120 в точке: замедление ' + P(0.4 * k) + ' на 4 с и 15 стойкости без учёта слабости.',
      t: k => 'Союзники в 400: скорость атаки и передвижения +' + P(0.1 * k) + '. Пробитие любым союзником: ещё ледяной урон пробития ' + P(1.2 * k) + '.',
      r: k => 'Поле 220 на 8 с: союзники игнорируют 25% брони; пробитый в поле враг после восстановления снова оцепенеет на 1 с.'
    },
    tr: [{ name: 'Инертное дыхание', text: 'Эффект пробития союзников +20%.' }, { name: 'Огни свеч на поверхности воды', text: 'За каждые 10% эффекта пробития сверх 120% Обертон даёт ещё +6% урона, до 36%.' }],
    ei: [{ name: 'Прогулка вдоль тростника', text: 'Урон союзников по пробитым врагам +40%.' }, { name: 'Веер на складках шёлковой ткани', text: 'Поле Абсолютной техники держится на 3 с дольше, урон пробития от Таланта ещё +200%.' }]
  };

  function shock(A, u, v, k) {
    const dps = (0.3 + (ei(u, 1) ? 1.56 : 0)) * k * A.atkOf(u);
    A.addFx(v, { n: 'Шок', k: 'dot', v: 0, dps, elem: 'elec', t: ei(u, 1) ? 9 : 6, src: u, kafka: true });
  }
  function detonate(A, u, v, all, mul) {
    for (const f of v.fx.slice()) if (f.k === 'dot' && (all || f.n === 'Шок') && !v.dead) A.hit(f.src || u, v, { amt: f.dps * mul, type: 'magic', elem: f.elem, kind: 'dot', noCrit: true, noTough: true });
  }

  KITS.kafka = {
    basic(A, u, t, o) {
      u.tal.n = (u.tal.n || 0) + 1;
      if (u.abil.t && u.tal.n % 3 === 0) o.after = (A2, v) => {
        if (v.dead) return;
        const k = tk(A2, u);
        A2.hit(u, v, { m: 1.4 * k * TUN.kT, kind: 'bonus', tough: T.toughBasic });
        if (!v.dead) { shock(A2, u, v, k); if (ei(u, 0)) A2.addFx(v, { n: 'Da Capo', k: 'dotVuln', v: 0.3, t: 6 }); }
      };
      A.shoot(u, t, o);
    },
    q: {
      cost: 35, cd: 6, aim: 'target', range: 260,
      cast(A, u, k, aim) {
        const t = aim.t, hits = A.unitsIn(circle(t.x, t.y, 72), 'foe');
        for (const v of hits) { A.hit(u, v, { m: (v === t ? 1.6 : 0.6) * k * TUN.kQ, kind: 'q', tough: v === t ? T.toughSkill : T.toughSkill / 2 }); detonate(A, u, v, true, 0.75); }
        A.emit({ t: 'fx', kind: 'bolt', x: t.x, y: t.y, r: 72, elem: 'elec' });
      }
    },
    e: {
      cost: 30, cd: 14, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        for (const v of A.unitsIn(circle(aim.x, aim.y, 160), 'foe')) { A.hit(u, v, { m: 0.5 * k * TUN.kE, kind: 'e', tough: TUN.toughTech }); if (!v.dead) shock(A, u, v, tk(A, u) || k); }
        A.emit({ t: 'fx', kind: 'ring', x: aim.x, y: aim.y, r: 160, elem: 'elec' });
      }
    },
    t: {},
    r: {
      cd: 50, aim: 'self',
      cast(A, u, k, aim, l) {
        for (const v of near(A, u, 260)) {
          A.hit(u, v, { m: 0.8 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
          if (!v.dead) { shock(A, u, v, tk(A, u) || k); detonate(A, u, v, tr(u, 0), 1); }
        }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 260, elem: 'elec' });
      }
    },
    onFoeDie(A, u, f) {
      if (!tr(u, 1)) return;
      const s = f.fx.find(x => x.n === 'Шок' && x.kafka);
      const n = s && A.nearestFoe(f.x, f.y, 120, x => x !== f);
      if (n) A.addFx(n, Object.assign({}, s, { t: Math.max(1, s.t) }));
    },
    text: {
      q: k => 'Цель ' + P(1.6 * k * TUN.kQ) + ', вокруг 72: ' + P(0.6 * k * TUN.kQ) + '; периодический урон на задетых сразу срабатывает на 75%.',
      e: k => 'Нити по кругу 160 в точке: ' + P(0.5 * k * TUN.kE) + ' и Шок на 6 с.',
      t: k => 'Каждая третья Атака: бонус-атака на ' + P(1.4 * k * TUN.kT) + ' и Шок на 6 с (' + P(0.3 * k) + ' урона атаки в секунду).',
      r: k => 'Все враги в 260: ' + P(0.8 * k * TUN.kR) + ' и Шок, Шок на них сразу срабатывает.'
    },
    tr: [{ name: 'Пытка', text: 'Абсолютная техника взрывает весь периодический урон, а не только Шок.' }, { name: 'Шипы', text: 'Шок от Таланта и Абсолютной техники при гибели цели переходит на ближайшего врага в 120.' }],
    ei: [{ name: 'Da Capo', text: 'Бонус-атака Таланта повышает получаемый целью периодический урон на 30% на 6 с.' }, { name: 'Leggiero', text: 'Шок бьёт ещё на 156% урона атаки за тик и длится на 3 с дольше.' }]
  };

  const BUGS = [
    { n: 'Баг: урон', k: 'weaken', v: 0.1 },
    { n: 'Баг: броня', k: 'armor', armorP: 0.08 },
    { n: 'Баг: скорость', k: 'slow', v: 0.06 }
  ];
  function bug(A, u, v, k) {
    const b = BUGS[A.rng.int(3)], t = tr(u, 0) ? 12 : 9;
    A.addFx(v, { n: b.n, k: b.k, v: b.armorP ? -b.armorP * v.armor * k : b.v * k, t, deb: true });
  }

  KITS.silverwolf = {
    q: {
      cost: 35, cd: 8, aim: 'target', range: 260,
      cast(A, u, k, aim) {
        const t = aim.t;
        A.hit(u, t, { m: 1.96 * k * TUN.kQ, kind: 'q', tough: T.toughSkill });
        if (t.dead) return;
        A.addFx(t, { n: 'Разрешить изменения?', k: 'weakAdd', v: 0, elem: 'quant', t: 6, deb: true });
        A.addFx(t, { n: 'Разрешить изменения?: сопротивление', k: 'elemVuln', elem: 'quant', v: 0.13 * k, t: 6 });
        if (tr(u, 1) && HD.debuffs(t).length >= 3) A.addFx(t, { n: 'Примечание', k: 'armor', v: -0.15 * t.armor, t: 6, deb: true });
      }
    },
    e: {
      cost: 40, cd: 16, aim: 'point', range: 260,
      cast(A, u, k, aim) {
        for (const v of A.unitsIn(circle(aim.x, aim.y, 140), 'foe')) {
          A.hit(u, v, { m: 0.8 * k * TUN.kE, kind: 'e', tough: 20, forceTough: true });
          if (!v.dead) A.addFx(v, { n: 'Зависание', k: 'stun', v: 1, t: 0.8 });
        }
        A.emit({ t: 'fx', kind: 'ring', x: aim.x, y: aim.y, r: 140, elem: 'quant' });
      }
    },
    t: {},
    r: {
      cd: 50, aim: 'target', range: 300,
      cast(A, u, k, aim, l) {
        const t = aim.t;
        A.hit(u, t, { m: 3.8 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        if (t.dead) return;
        A.addFx(t, { n: 'Пользователь забанен', k: 'armor', v: -0.45 * k * t.armor, t: 9, deb: true });
        if (ei(u, 0)) { const n = Math.min(5, HD.debuffs(t).length); for (let i = 0; i < n && !t.dead; i++) A.hit(u, t, { m: 0.2, kind: 'bonus', noTough: true }); }
        A.emit({ t: 'fx', kind: 'bolt', x: t.x, y: t.y, r: 40, elem: 'quant' });
      }
    },
    onHit(A, u, t, o) {
      if (!u.abil.t || t.dead || o.kind === 'dot' || o.kind === 'break' || o.kind === 'bonus') return;
      if (A.rng() < A.chance(u, t, 0.72 * tk(A, u))) bug(A, u, t, 1);
    },
    onAnyBreak(A, u, f) { if (tr(u, 0) && A.rng() < 0.65) bug(A, u, f, 1); },
    dmgMul(A, u, t) { return ei(u, 1) ? 1 + Math.min(1, 0.2 * HD.debuffs(t).length) : 1; },
    text: {
      q: k => P(1.96 * k * TUN.kQ) + '; цель получает слабость к квантовому урону и +' + P(0.13 * k) + ' квантового урона по ней на 6 с.',
      e: k => 'Взлом по кругу 140 в точке: ' + P(0.8 * k * TUN.kE) + ', 20 стойкости без учёта слабости, враги зависают на 0,8 с.',
      t: k => 'Удар с шансом ' + P(0.72 * k) + ' вносит Баг на 9 с: урон врага −10%, броня −8% или скорость −6%.',
      r: k => P(3.8 * k * TUN.kR) + ' и −' + P(0.45 * k) + ' брони цели на 9 с.'
    },
    tr: [{ name: 'Генерация', text: 'Баги держатся 12 с; каждое пробитие с шансом 65% вносит случайный Баг.' }, { name: 'Примечание', text: 'Если на цели Навыка три ослабления и больше, её броня ещё −15%.' }],
    ei: [{ name: 'Порт перенаправления', text: 'После Абсолютной техники за каждое ослабление на цели ещё удар на 20%, до 5.' }, { name: 'Оверлейная сеть', text: 'Урон Волка по цели +20% за каждое её ослабление, до 100%.' }]
  };

  KITS.welt = {
    q: {
      cost: 30, cd: 5, aim: 'target', range: 260,
      cast(A, u, k, aim) {
        bounce(A, u, aim.t, ei(u, 1) ? 5 : 3, 140, v => {
          A.hit(u, v, { m: 0.72 * k * TUN.kQ, kind: 'q', tough: T.toughBasic });
          if (!v.dead && A.rng() < A.chance(u, v, 0.75)) A.addFx(v, { n: 'Гравитационное ядро', k: 'slow', v: 0.1, t: 6 });
          if (u.tal.legacy > 0) { u.tal.legacy--; if (!v.dead) A.hit(u, v, { m: 0.8, kind: 'bonus', noTough: true }); }
          A.emit({ t: 'fx', kind: 'boom', x: v.x, y: v.y, r: 22, elem: 'imag' });
        });
      }
    },
    e: {
      cost: 35, cd: 14, aim: 'self',
      cast(A, u, k) {
        for (const v of near(A, u, 160)) { A.push(v, u.x, u.y, 64); A.addFx(v, { n: 'Гравитационная тюрьма', k: 'slow', v: 0.3 * k, t: 3 }); }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 160, elem: 'imag' });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'point', range: 300,
      cast(A, u, k, aim, l) {
        A.addArea({ shape: 'circle', x: aim.x, y: aim.y, r: 180, side: 'foe', t: 3, every: 0.1, kind: 'zone', elem: 'imag', onTick(A2, a) {
          for (const v of A2.unitsIn(a, 'foe')) { const d = Math.hypot(v.x - a.x, v.y - a.y); if (d > 12) A2.push(v, 2 * v.x - a.x, 2 * v.y - a.y, Math.min(14, d - 10)); }
        } });
        A.later(3, () => {
          for (const v of A.unitsIn(circle(aim.x, aim.y, 180), 'foe')) {
            A.hit(u, v, { m: 1.5 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
            if (!v.dead) { A.addFx(v, { n: 'Гравитационное заточение', k: 'stun', v: 1, t: 2 }); if (tr(u, 0)) A.addFx(v, { n: 'Возмездие', k: 'vuln', v: 0.12, t: 6, deb: true }); }
          }
          if (ei(u, 0)) u.tal.legacy = 2;
          A.emit({ t: 'fx', kind: 'boom', x: aim.x, y: aim.y, r: 180, elem: 'imag' });
        });
      }
    },
    basic(A, u, t, o) {
      if (u.tal.legacy > 0) { u.tal.legacy--; o.after = (A2, v) => { if (!v.dead) A2.hit(u, v, { m: 0.5, kind: 'bonus', noTough: true }); }; }
      A.shoot(u, t, o);
    },
    onHit(A, u, t, o) {
      if (!u.abil.t || t.dead || o.kind === 'bonus' || o.kind === 'dot' || o.kind === 'break' || !t.fx.some(f => f.k === 'slow')) return;
      A.hit(u, t, { m: 0.6 * tk(A, u), kind: 'bonus', elem: 'imag', noTough: true });
    },
    dmgMul(A, u, t) { return tr(u, 1) && t.brokenT > 0 ? 1.2 : 1; },
    text: {
      q: k => '3 отскока по ' + P(0.72 * k * TUN.kQ) + ', каждый с шансом 75% замедляет на 10% на 6 с.',
      e: k => 'Волна по кругу 160 вокруг Вельта: отбрасывает на 64 и замедляет на ' + P(0.3 * k) + ' на 3 с.',
      t: k => 'Удары по замедленным врагам бьют ещё мнимым уроном на ' + P(0.6 * k) + '.',
      r: k => 'Дыра в точке, круг 180, 3 с тянет врагов к центру, затем ' + P(1.5 * k * TUN.kR) + ' и Заточение на 2 с.'
    },
    tr: [{ name: 'Возмездие', text: 'После Абсолютной техники враги в круге получают +12% урона на 6 с.' }, { name: 'Наказание', text: 'Урон по пробитым +20%.' }],
    ei: [{ name: 'Наследие чести', text: 'После Абсолютной техники две следующие Атаки или Навыки бьют ещё раз: Атака на 50%, Навык на 80%.' }, { name: 'Светлые перспективы', text: 'У Навыка ещё 2 отскока, они тоже замедляют.' }]
  };

  const structures = (A, x, y, r) => allies(A, x, y, r).filter(v => v.kind === 'turret' || v.kind === 'base');
  const wounded = (A, x, y, r, skip) => allies(A, x, y, r).filter(v => v.hp < v.hpMax && !(skip && skip.has(v.uid))).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax);

  function marchShield(A, u, v, k, half) {
    A.addFx(v, { n: 'Защитная дуга', k: 'shield', v: (0.19 * k * u.hpMax + 30) * (half ? 0.5 : 1), t: tr(u, 0) ? 12 : 9, by: 'march' });
  }

  KITS.march = {
    q: {
      cost: 35, cd: 10, aim: 'ally', range: 300,
      cast(A, u, k, aim) {
        const v = aim.t;
        marchShield(A, u, v, k);
        if (tr(u, 0)) for (const s of structures(A, v.x, v.y, 200)) if (s !== v) marchShield(A, u, s, k, true);
        if (v.hp >= v.hpMax * 0.3) for (const f of A.unitsIn(circle(v.x, v.y, 160), 'foe')) { A.addFx(f, { n: 'Защитная дуга: вызов', k: 'taunt', v: 1, t: 3, src: v }); f.tgt = v.uid; }
        A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 40, elem: 'ice' });
      }
    },
    e: {
      cost: 30, cd: 15, aim: 'point', range: 300,
      cast(A, u, k, aim) {
        const zone = lineFrom(u, aim.x, aim.y, 300, 32), hits = A.unitsIn(zone, 'foe').sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)), first = hits[0];
        if (first) {
          A.hit(u, first, { m: 0.5 * k * TUN.kE, kind: 'e', tough: TUN.toughTech });
          A.addFx(first, { n: 'Заморозка', k: 'stun', v: 1, t: 2 });
          for (const f of A.unitsIn(circle(first.x, first.y, 64), 'foe')) if (f !== first) A.addFx(f, { n: 'Заморозка', k: 'stun', v: 1, t: 1 });
        }
        A.emit({ t: 'fx', kind: 'line', x: u.x, y: u.y, ang: zone.ang, len: 300, w: 32, elem: 'ice' });
      }
    },
    t: {},
    r: {
      cd: 50, aim: 'point', range: 300,
      cast(A, u, k, aim, l) {
        for (const v of A.unitsIn(circle(aim.x, aim.y, 180), 'foe')) {
          A.hit(u, v, { m: 1.5 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
          if (!v.dead && A.rng() < A.chance(u, v, 0.5 + (tr(u, 1) ? 0.15 : 0))) { A.addFx(v, { n: 'Заморозка', k: 'stun', v: 1, t: 1.5 }); if (tr(u, 1)) A.addFx(v, { n: 'Ледяные чары', k: 'vuln', v: 0.2, t: 1.5, deb: true }); }
        }
        A.emit({ t: 'fx', kind: 'boom', x: aim.x, y: aim.y, r: 180, elem: 'ice' });
      }
    },
    onAllyHurt(A, u, tgt, f) {
      if (!u.abil.t || f.dead || !tgt.fx.some(x => x.k === 'shield' && x.by === 'march')) return;
      const w = (u.tal.arrows || []).filter(t => A.time - t < 3);
      if (w.length >= 2) { u.tal.arrows = w; return; }
      w.push(A.time); u.tal.arrows = w;
      A.shoot(u, f, { m: tk(A, u) * TUN.kT, kind: 'bonus', tough: T.toughBasic / 2, elem: 'ice' });
    },
    tick(A, u) {
      if (ei(u, 0) && (u.tal.memo == null || A.time - u.tal.memo >= 20)) {
        const v = wounded(A, u.x, u.y, 400)[0];
        if (v) { u.tal.memo = A.time; A.addFx(v, { n: 'Память об этом', k: 'shield', v: u.hpMax * 0.08, t: 9, by: 'march' }); }
      }
      if (ei(u, 1) && A.time - (u.tal.forever || 0) >= 3) {
        u.tal.forever = A.time;
        for (const v of allies(A, u.x, u.y, 2000)) if (v.fx.some(x => x.k === 'shield' && x.by === 'march')) A.heal(u, v, v.hpMax * 0.04);
      }
    },
    text: {
      q: k => 'Щит союзнику на 9 с: ' + P(0.19 * k) + ' макс. НР Март + 30; цель с НР от 30% вызывает на себя врагов в 160 на 3 с.',
      e: k => 'Ледяная стрела по линии 300: первая цель заморожена на 2 с, все в 64 вокруг неё на 1 с.',
      t: k => 'Враг, ударивший союзника под щитом Март, получает ответную стрелу на ' + P(k * TUN.kT) + ', до 2 раз за 3 с.',
      r: k => 'Стрелы по кругу 180 в точке: ' + P(1.5 * k * TUN.kR) + ', шанс 50% заморозить на 1,5 с.'
    },
    tr: [{ name: 'Укрепление', text: 'Щит Навыка держится 12 с и ложится на турели в 200 от цели с половинной силой.' }, { name: 'Ледяные чары', text: 'Шанс заморозки Абсолютной техники +15%; замороженный ею враг получает +20% урона.' }],
    ei: [{ name: 'Память об этом', text: 'Каждые 20 с Март даёт щит на 8% её макс. НР самой раненой союзной цели в 400.' }, { name: 'Вот так, навсегда...', text: 'Союзник под щитом Март восстанавливает 4% макс. НР каждые 3 с.' }]
  };

  KITS.gepard = {
    q: {
      cost: 30, cd: 7, aim: 'target', range: 120,
      cast(A, u, k, aim) {
        const t = aim.t;
        A.hit(u, t, { m: 2 * k * TUN.kQ, kind: 'q', tough: T.toughSkill });
        if (!t.dead && A.rng() < A.chance(u, t, 0.65)) { A.addFx(t, { n: 'Заморозка', k: 'stun', v: 1, t: 2 }); if (ei(u, 0)) A.addFx(t, { n: 'Затяжной холод', k: 'slow', v: 0.2, t: 5 }); }
        A.emit({ t: 'fx', kind: 'slash', x: t.x, y: t.y, elem: 'ice' });
      }
    },
    e: {
      cost: 40, cd: 20, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 220)) A.addFx(v, { n: 'Щит Среброгривых', k: 'shield', v: 0.06 * k * u.hpMax + 30, t: 9 });
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 220, elem: 'ice' });
      }
    },
    t: {},
    r: {
      cd: 55, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 300)) A.addFx(v, { n: 'Несокрушимая стена', k: 'shield', v: 0.15 * k * u.hpMax + 60, t: 9 });
        for (const f of near(A, u, 200)) { A.addFx(f, { n: 'Несокрушимая стена: вызов', k: 'taunt', v: 1, t: 3, src: u }); f.tgt = u.uid; }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'ice' });
      }
    },
    saveAlly(A, u, v) {
      if (v !== u || !u.abil.t || (u.tal.saves || 0) >= (ei(u, 1) ? 2 : 1)) return false;
      u.tal.saves = (u.tal.saves || 0) + 1;
      u.hp = u.hpMax * (ei(u, 1) ? 1 : 0.5 * tk(A, u));
      if (ei(u, 1)) u.en = u.enMax;
      A.emit({ t: 'msg', text: 'Гепард встаёт', x: u.x, y: u.y - 40 });
      A.say(u, 'Талант');
      return true;
    },
    onWave(A, u) { u.tal.saves = 0; },
    tick(A, u) {
      if (tr(u, 0)) A.addFx(u, { n: 'Принципиальность', k: 'aggroP', v: 1, t: 0.5 });
      if (tr(u, 1)) A.addFx(u, { n: 'Боевой дух', k: 'atkFlat', v: 0.35 * (u.armor0 + A.sum(u, 'armor')) * TUN.defDmgK, t: 0.5 });
    },
    text: {
      q: k => P(2 * k * TUN.kQ) + ' и шанс 65% заморозить на 2 с.',
      e: k => 'Щит себе и союзникам в 220 на 9 с: ' + P(0.06 * k) + ' макс. НР Гепарда + 30.',
      t: k => 'Раз за волну смертельный удар не убивает: Гепард встаёт с ' + P(0.5 * k) + ' НР.',
      r: k => 'Щит союзникам в 300 с базой и турелями на 9 с: ' + P(0.15 * k) + ' макс. НР Гепарда + 60; враги в 200 бьют Гепарда 3 с.'
    },
    tr: [{ name: 'Принципиальность', text: 'Агрессия Гепарда ×2.' }, { name: 'Боевой дух', text: 'Урон атаки Гепарда растёт на 35% его брони.' }],
    ei: [{ name: 'Затяжной холод', text: 'После заморозки от Навыка враг замедлен на 20% на 3 с.' }, { name: 'Непоколебимая решимость', text: 'Талант срабатывает дважды за волну; после подъёма Гепард сразу получает всю энергию и полное НР.' }]
  };

  function matrix(A, u, t) {
    u.tal.matrix = Math.max(u.tal.matrix || 0, A.time + t);
    if (tr(u, 1)) A.addFx(u, { n: 'Прорицание Люжэнь', k: 'ccImmune', v: 1, t, once: true });
    A.addArea({ shape: 'circle', x: u.x, y: u.y, r: 320, follow: u.uid, side: 'ally', t, kind: 'zone', elem: 'quant' });
  }

  KITS.fuxuan = {
    basic(A, u, t, o) { delete o.m; o.amt = A.atkOf(u) + 0.5 * hpK(u); A.shoot(u, t, o); },
    q: {
      cost: 40, cd: 20, aim: 'self',
      cast(A, u, k) {
        matrix(A, u, 12);
        for (const v of allies(A, u.x, u.y, 320)) A.addFx(v, { n: 'Знание', k: 'crit', v: 0.12 * k, t: 12 });
      }
    },
    e: {
      cost: 30, cd: 30, aim: 'point', range: 600,
      cast(A, u, k, aim) {
        const s = structures(A, u.x, u.y, 600).sort((a, b) => A.gap({ x: aim.x, y: aim.y }, a) - A.gap({ x: aim.x, y: aim.y }, b))[0];
        if (s) {
          const tx = s.rect ? Math.max(s.rect.x0, Math.min(s.rect.x1, aim.x)) : s.x, ty = s.rect ? s.rect.y0 - 20 : s.y + 30;
          u.x = u.px = tx; u.y = u.py = ty; A.collide(u);
        }
        matrix(A, u, 6);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 60, elem: 'quant' });
      }
    },
    t: {},
    r: {
      cd: 60, aim: 'self',
      cast(A, u, k, aim, l) {
        const extra = ei(u, 1) ? 2 * (u.tal.truth || 0) * TUN.hpDmgK : 0;
        for (const v of near(A, u, 240)) A.hit(u, v, { amt: (1 * hpK(u) * TUN.kR * k + extra) * (1 + A.sum(u, 'atk')), kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        u.tal.truth = 0;
        u.tal.heals = Math.min(2, (u.tal.heals == null ? 1 : u.tal.heals) + 1);
        for (const s of structures(A, u.x, u.y, 400)) A.heal(u, s, u.hpMax * (tr(u, 0) ? 0.15 : 0.05));
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 240, elem: 'quant' });
      }
    },
    redirect(A, u, tgt, dealt) {
      if (!(u.tal.matrix > A.time) || A.gap(u, tgt) > 320) return dealt;
      const part = Math.round(dealt * 0.65);
      if (ei(u, 1)) u.tal.truth = Math.min(u.hpMax * 1.2, (u.tal.truth || 0) + part);
      A.hit(null, u, { amt: part, type: 'divine', kind: 'redirect', noCrit: true, noTough: true });
      return dealt - part;
    },
    saveAlly(A, u, v) {
      if (!ei(u, 0) || v === u || v.kind === 'hero' || !(u.tal.matrix > A.time) || u.tal.omen) return false;
      u.tal.omen = true;
      v.hp = v.hpMax * 0.3;
      A.emit({ t: 'msg', text: 'Зловещее предзнаменование', x: v.x, y: v.y - 40 });
      return true;
    },
    onWave(A, u) { u.tal.omen = false; u.tal.heals = Math.min(2, (u.tal.heals == null ? 0 : u.tal.heals) + 1); },
    tick(A, u) {
      if (!u.abil.t) return;
      const k = tk(A, u);
      aura(A, u, 400, { n: 'Предвидение', k: 'dr', v: 0.18 * k });
      if (u.tal.heals == null) u.tal.heals = 1;
      if (u.tal.heals > 0 && u.hp <= u.hpMax * 0.5) { u.tal.heals--; A.heal(u, u, (u.hpMax - u.hp) * 0.9 * k); }
    },
    text: {
      q: k => '«Матрица предвидения» на 12 с: 65% урона по союзникам в 320 уходит на Фу Сюань; союзники получают шанс крита +' + P(0.12 * k) + '.',
      e: k => 'Перенос к союзной постройке в 600 и Матрица на 6 с.',
      t: k => 'Союзники в 400 получают на ' + P(0.18 * k) + ' меньше урона. Заряд самолечения при 50% НР лечит ' + P(0.9 * k) + ' потерянного.',
      r: k => 'Все враги в 240: ' + P(k * TUN.kR * TUN.hpDmgK) + ' макс. НР; +1 заряд самолечения; постройки в 400 лечатся на 5% её макс. НР.'
    },
    tr: [{ name: 'Прорицание Дуньцзя, метамистика', text: 'Абсолютная техника лечит базу и турели ещё на 10% макс. НР Фу Сюань.' }, { name: 'Прорицание Люжэнь, гексаграмма воды', text: 'Пока действует Матрица, первый контроль по Фу Сюань не срабатывает.' }],
    ei: [{ name: 'Зловещее предзнаменование', text: 'Пока действует Матрица, база и турели не падают: раз за волну остаются с 30% НР.' }, { name: 'Зерно истины', text: 'Матрица копит НР, потерянное союзниками, до 120% макс. НР Фу Сюань; Абсолютная техника бьёт ещё на 200% накопленного.' }]
  };

  KITS.natasha = {
    basic(A, u, t, o) {
      if (ei(u, 1)) {
        delete o.m; o.amt = A.atkOf(u) + 0.4 * hpK(u);
        o.after = (A2, v) => { for (const f of A2.unitsIn(circle(v.x, v.y, 48), 'foe')) if (f !== v) A2.hit(u, f, { amt: o.amt, kind: 'bonus', noTough: true }); };
      }
      A.shoot(u, t, o);
    },
    q: {
      cost: 30, cd: 8, aim: 'ally', range: 400,
      cast(A, u, k, aim) {
        const v = aim.t, list = tr(u, 1) ? allies(A, v.x, v.y, 120) : [v];
        A.heal(u, v, v.hpMax * 0.105 * k + 20);
        for (const w of list) A.addFx(w, { n: 'Любовь и исцеление', k: 'hot', v: 0, hps: (w.hpMax * 0.072 * k + 10) / 3, src: u, t: tr(u, 1) ? 9 : 6 });
        if (tr(u, 0)) { cleanse(v); A.addFx(v, { n: 'Успокоение', k: 'ccImmune', v: 1, t: 2 }); }
        A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 36, elem: 'heal' });
      }
    },
    e: {
      cost: 35, cd: 16, aim: 'point', range: 300,
      cast(A, u, k, aim) {
        A.addArea({ shape: 'circle', x: aim.x, y: aim.y, r: 140, side: 'foe', t: 5, every: 0.25, kind: 'zone', elem: 'phys', onTick(A2, a) {
          for (const f of A2.unitsIn(a, 'foe')) { A2.addFx(f, { n: 'Гипноз', k: 'weaken', v: 0.3 * k, t: 0.5 }); A2.addFx(f, { n: 'Гипноз: сон', k: 'slow', v: 0.2 * k, t: 0.5 }); }
        } });
      }
    },
    t: {},
    r: {
      cd: 45, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 400)) {
          A.heal(u, v, v.hpMax * 0.138 * k + 30);
          if (ei(u, 0) && (v.kind === 'base' || v.hp < v.hpMax * 0.3)) A.addFx(v, { n: 'Клиническое исследование', k: 'hot', v: 0, hps: u.hpMax * 0.06 / 3, src: u, t: 9 });
        }
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 400, elem: 'heal' });
      }
    },
    healMul(A, u, tgt) { return u.abil.t && tgt.hp < tgt.hpMax * 0.3 ? 1 + 0.5 * tk(A, u) : 1; },
    text: {
      q: k => 'Союзник: ' + P(0.105 * k) + ' макс. НР + 20 и регенерация ' + P(0.072 * k) + ' + 10 за 3 с на 6 с.',
      e: k => 'Облако по кругу 140 на 5 с: враги наносят на ' + P(0.3 * k) + ' меньше урона и замедлены на ' + P(0.2 * k) + '.',
      t: k => 'Лечение союзников с НР ниже 30% сильнее на ' + P(0.5 * k) + '.',
      r: k => 'Все союзники в 400 с базой и турелями: ' + P(0.138 * k) + ' макс. НР + 30.'
    },
    tr: [{ name: 'Успокоение', text: 'Навык снимает ослабления и даёт 2 с невосприимчивости к контролю.' }, { name: 'Восстановление', text: 'Регенерация от Навыка длится 9 с и задевает союзников в 120 от цели.' }],
    ei: [{ name: 'Клиническое исследование', text: 'Абсолютная техника даёт союзникам с НР ниже 30% и базе регенерацию 6% макс. НР Наташи за 3 с на 9 с.' }, { name: 'Милосердие лекаря', text: 'Атака бьёт ещё на 40% макс. НР Наташи и задевает врагов в 48 вокруг цели.' }]
  };

  function invig(A, u, v, t) { A.addFx(v, { n: 'Оживление', k: 'invig', v: 0, t, left: tr(u, 0) ? 3 : 2 }); }

  KITS.bailu = {
    q: {
      cost: 30, cd: 7, aim: 'ally', range: 260,
      cast(A, u, k, aim) {
        const first = aim.t.hp < aim.t.hpMax ? aim.t : wounded(A, u.x, u.y, 400)[0];
        if (!first) {
          const f = A.nearestFoe(u.x, u.y, 260);
          if (!f) return false;
          bounce(A, u, f, 3, 140, v => { A.hit(u, v, { m: 0.6 * k * TUN.kQ, kind: 'q', tough: T.toughBasic }); A.emit({ t: 'fx', kind: 'bolt', x: v.x, y: v.y, r: 24, elem: 'elec' }); });
          return;
        }
        const done = new Set();
        let v = first, mul = 1;
        for (let i = 0; i < 3 && v; i++) {
          A.heal(u, v, (v.hpMax * 0.117 * k + 30) * mul);
          if (ei(u, 0)) A.addFx(v, { n: 'Изгнание зла', k: 'dmg', v: 0.1, t: 6, max: 3 });
          A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 30, elem: 'heal' });
          done.add(v.uid); mul *= 0.85;
          v = wounded(A, v.x, v.y, 260, done)[0];
        }
      }
    },
    e: {
      cost: 35, cd: 20, aim: 'self',
      cast(A, u, k) { for (const v of allies(A, u.x, u.y, 300)) invig(A, u, v, 9); A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'heal' }); }
    },
    t: {},
    r: {
      cd: 50, aim: 'self',
      cast(A, u, k) {
        for (const v of allies(A, u.x, u.y, 400)) { A.heal(u, v, v.hpMax * 0.135 * k + 36); invig(A, u, v, 6); }
        A.emit({ t: 'fx', kind: 'bolt', x: u.x, y: u.y, r: 400, elem: 'elec' });
      }
    },
    onAllyHurt(A, u, tgt) {
      if (!u.abil.t || tgt.dead) return;
      const f = tgt.fx.find(x => x.k === 'invig');
      if (!f || f.left <= 0 || A.time - (f.at || -9) < 1) return;
      f.left--; f.at = A.time;
      A.heal(u, tgt, tgt.hpMax * 0.036 * tk(A, u) + 10);
    },
    saveAlly(A, u, v) {
      if (!u.abil.t || (u.tal.saved || 0) >= (ei(u, 1) ? 2 : 1)) return false;
      u.tal.saved = (u.tal.saved || 0) + 1;
      v.hp = v.hpMax * 0.18 * tk(A, u);
      A.emit({ t: 'msg', text: 'Байлу не даёт пасть', x: v.x, y: v.y - 40 });
      return true;
    },
    onWave(A, u) { u.tal.saved = 0; },
    tick(A, u) { if (tr(u, 1)) for (const v of allies(A, u.x, u.y, 2000)) if (v.fx.some(x => x.k === 'invig')) A.addFx(v, { n: 'Водное благословение', k: 'dr', v: 0.1, t: 0.5 }); },
    text: {
      q: k => 'Лечит союзника на ' + P(0.117 * k) + ' макс. НР + 30 и отскакивает ещё на двух раненых, каждый раз на 15% слабее; без раненых молния бьёт трёх врагов по ' + P(0.6 * k * TUN.kQ) + '.',
      e: k => 'Оживление на 9 с себе и союзникам в 300.',
      t: k => 'Союзник с Оживлением при ударе лечится на ' + P(0.036 * k) + ' макс. НР + 10, два раза. Раз за волну Байлу не даёт союзнику пасть и лечит его на ' + P(0.18 * k) + ' НР.',
      r: k => 'Все союзники в 400: ' + P(0.135 * k) + ' макс. НР + 36 и Оживление на 6 с.'
    },
    tr: [{ name: 'Драконья кровь видьядхара', text: 'Оживление лечит три раза вместо двух.' }, { name: 'Водное благословение', text: 'Союзники с Оживлением получают на 10% меньше урона.' }],
    ei: [{ name: 'Изгнание зла', text: 'Каждое лечение Навыка повышает урон цели на 10% на 6 с, до 3 раз.' }, { name: 'Эликсир из саливы дракона', text: 'Талант спасает от гибели два раза за волну.' }]
  };

  function luochaZone(A, u, t) {
    u.tal.zone = Math.max(u.tal.zone || 0, A.time + t);
    A.addArea({ shape: 'circle', x: u.x, y: u.y, r: 220, follow: u.uid, side: 'ally', t, kind: 'zone', elem: 'imag' });
    A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 220, elem: 'imag' });
  }
  function flower(A, u) {
    u.tal.fl = (u.tal.fl || 0) + 1;
    if (u.abil.t && u.tal.fl >= 2) { u.tal.fl = 0; luochaZone(A, u, 9); }
  }
  function prayer(A, u, v, k) {
    A.heal(u, v, 0.25 * k * A.atkOf(u) * TUN.atkHealK);
    if (tr(u, 0)) cleanse(v);
    A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 30, elem: 'heal' });
  }

  KITS.luocha = {
    q: {
      cost: 30, cd: 8, aim: 'ally', range: 400,
      cast(A, u, k, aim) { prayer(A, u, aim.t, k); flower(A, u); }
    },
    e: {
      cost: 40, cd: 30, aim: 'self',
      cast(A, u) { luochaZone(A, u, 6); }
    },
    t: {},
    r: {
      cd: 50, aim: 'self',
      cast(A, u, k, aim, l) {
        for (const v of near(A, u, 240)) {
          const b = v.fx.find(x => !x.deb && (x.k === 'shield' || x.k === 'dmg' || x.k === 'aspd' || x.k === 'mspd' || x.k === 'atk'));
          if (b) v.fx.splice(v.fx.indexOf(b), 1);
          A.hit(u, v, { m: 2 * k * TUN.kR, kind: 'r', tough: T.toughUlt, type: ultType(u, l) });
        }
        flower(A, u);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 240, elem: 'imag' });
      }
    },
    onAllyAttack(A, u, src, t) {
      if (!(u.tal.zone > A.time) || Math.hypot(src.x - u.x, src.y - u.y) > 220) return;
      const k = tk(A, u) || A.lvlK('t', 1);
      A.heal(u, src, 0.06 * k * A.atkOf(u) * TUN.atkHealK + 10);
      if (tr(u, 1)) for (const v of allies(A, u.x, u.y, 220)) if (v !== src) A.heal(u, v, 0.07 * A.atkOf(u) * TUN.atkHealK);
    },
    tick(A, u) {
      if (u.abil.t && A.time - (u.tal.auto || -99) >= 9) {
        const v = allies(A, u.x, u.y, 400).find(x => x.hp < x.hpMax * 0.5);
        if (v) { u.tal.auto = A.time; prayer(A, u, v, tk(A, u)); flower(A, u); }
      }
      if (u.tal.zone > A.time) {
        if (ei(u, 0)) aura(A, u, 220, { n: 'Омовение живых', k: 'atk', v: 0.2 });
        if (ei(u, 1)) for (const f of near(A, u, 220)) A.addFx(f, { n: 'Тяжесть короны', k: 'weaken', v: 0.12, t: 0.5 });
      }
    },
    text: {
      q: k => 'Лечит союзника на ' + P(0.25 * k * TUN.atkHealK) + ' урона атаки; +1 Цветок Бездны.',
      e: k => 'Сразу открывает Зону на 6 с без Цветков.',
      t: k => 'Союзник ниже 50% НР в 400 сам получает Молитву раз в 9 с. На двух Цветках Зона 220 на 9 с: каждая атака союзника лечит его на ' + P(0.06 * k * TUN.atkHealK) + ' урона атаки Лочи + 10.',
      r: k => 'Снимает по одному усилению с врагов в 240 и бьёт их на ' + P(2 * k * TUN.kR) + '; +1 Цветок.'
    },
    tr: [{ name: 'Очищающее воскрешение', text: 'Молитва снимает ослабления.' }, { name: 'Освящённый', text: 'В Зоне каждая атака лечит и остальных союзников в Зоне на 7% урона атаки Лочи.' }],
    ei: [{ name: 'Омовение живых', text: 'В Зоне урон атаки союзников +20%.' }, { name: 'Тяжесть короны', text: 'В Зоне враги наносят на 12% меньше урона.' }]
  };

  Object.assign(HD.KITS, KITS);
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
