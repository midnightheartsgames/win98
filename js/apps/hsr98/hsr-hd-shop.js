(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN, R = HD.RELIC, TS = 32, N = HD.N;
  const P = v => Math.round(v * 100) + '%';
  const SLOT_KINDS = H.RELIC_SLOTS.map(s => s.key);
  const circle = (x, y, r) => ({ shape: 'circle', x, y, r });
  const allies = (A, u, r) => A.unitsIn(circle(u.x, u.y, r), 'ally');

  const CONES = {
    collapsing: { v: { a: [1, 0.2] }, tpl: 'Урон Атаки и Навыка +{a}.', st: [['dmg_basic', 'a'], ['dmg_q', 'a']] },
    underthesky: { v: { a: [1, 0.16], b: [2, 0.12] }, tpl: 'Урон атаки +{a}; после добивания шанс крита +{b} на 9 с.', st: [['atk', 'a']], onKill(A, u) { A.addFx(u, { n: 'Под голубым небом', k: 'crit', v: this.V.b, t: 9 }); } },
    sword_rumor: { v: { a: [1, 0.12], b: [2, 0.24] }, tpl: 'Шанс крита +{a}, урон Навыка и Абсолютной техники +{b}.', st: [['crit', 'a'], ['dmg_q', 'b'], ['dmg_r', 'b']] },
    dragontrial: { v: { a: [1, 0.16], b: [2, 0.24] }, tpl: 'Урон атаки +{a}, урон по пробитым +{b}.', st: [['atk', 'a'], ['dmgBroken', 'b']] },
    cccstandee: { v: { a: [1, 0.16], b: [2, 0.24] }, tpl: 'Урон атаки +{a}, урон по врагам с НР выше 80% +{b}.', st: [['atk', 'a']], dmgMul(A, u, t) { return t.hp > t.hpMax * 0.8 ? 1 + this.V.b : 1; } },
    woof: { v: { a: [1, 0.1], b: [2, 0.16] }, tpl: 'Урон атаки +{a}, урон по горящим и кровоточащим +{b}.', st: [['atk', 'a']], dmgMul(A, u, t) { return t.fx.some(f => f.n === 'Горение' || f.n === 'Кровотечение') ? 1 + this.V.b : 1; } },
    unreachable: { v: { a: [1, 0.18], b: [2, 0.18], c: [3, 0.24] }, tpl: 'Шанс крита +{a}, макс. НР +{b}; после полученного удара или траты НР урон +{c} до следующей атаки.', st: [['crit', 'a'], ['hpP', 'b']],
      onLose(A, u) { A.addFx(u, { n: 'Недоступная сторона', k: 'dmg', v: this.V.c, t: 99 }); }, onHit(A, u, t, o) { if (o.basic || o.kind === 'q' || o.kind === 'r') u.fx = u.fx.filter(f => f.n !== 'Недоступная сторона'); } },
    brighter: { v: { a: [1, 0.18], b: [4, 0.18], c: [5, 0.06] }, tpl: 'Шанс крита +{a}; каждая Атака даёт «Зов дракона» на 6 с, до 2: урон атаки +{b} и восстановление энергии +{c} за уровень.', st: [['crit', 'a']],
      onHit(A, u, t, o) { if (!o.basic) return; A.addFx(u, { n: 'Зов дракона', k: 'atk', v: this.V.b, t: 6, max: 2 }); A.addFx(u, { n: 'Зов дракона: энергия', k: 'enRegenP', v: this.V.c, t: 6, max: 2 }); } },
    ownsword: { v: { a: [1, 0.2], b: [3, 0.14], c: [4, 0.12] }, tpl: 'Крит. урон +{a}; потеря НР даёт «Лунное затмение», до 3: следующая атака +{b} за уровень, на трёх уровнях игнорирует {c} брони.', st: [['critD', 'a']],
      onLose(A, u) { u.tal.eclipse = Math.min(3, (u.tal.eclipse || 0) + 1); },
      dmgMul(A, u) { return 1 + this.V.b * (u.tal.eclipse || 0); }, penBonus(A, u) { return u.tal.eclipse >= 3 ? this.V.c : 0; },
      onHit(A, u, t, o) { if (o.basic || o.kind === 'q' || o.kind === 'r') u.tal.eclipse = 0; } },
    arrows: { v: { a: [1, 0.12] }, tpl: 'В начале волны шанс крита +{a} на 9 с.', onWave(A, u) { A.addFx(u, { n: 'Стрелы', k: 'crit', v: this.V.a, t: 9 }); } },
    swordplay: { v: { a: [1, 0.08] }, tpl: 'Каждая атака по той же цели +{a} урона, до 5; смена цели сбрасывает.',
      dmgMul(A, u, t) { return 1 + this.V.a * Math.min(5, u.tal.spN || 0) * (u.tal.spT === t.uid ? 1 : 0); }, onHit(A, u, t) { if (u.tal.spT === t.uid) u.tal.spN = (u.tal.spN || 0) + 1; else { u.tal.spT = t.uid; u.tal.spN = 1; } } },
    battery: { v: { a: [1, 0.15], b: [2, 0.12] }, tpl: 'Урон стихии героя +{a}; после бонус-атаки восстановление энергии +{b} на 6 с.', stE: 'a', onHit(A, u, t, o) { if (o.kind === 'bonus') A.addFx(u, { n: 'Трек без названия', k: 'enRegenP', v: this.V.b, t: 6 }); } },
    river: { v: { a: [1, 0.08], b: [2, 0.12] }, tpl: 'Скорость атаки +{a}, урон +{b}; пропадает при полученном ударе и возвращается через 3 с.',
      tick(A, u) { if (A.time - (u.tal.riverHit || -9) >= 3) { A.addFx(u, { n: 'Весенние потоки', k: 'aspd', v: this.V.a, t: 0.5 }); A.addFx(u, { n: 'Весенние потоки: урон', k: 'dmg', v: this.V.b, t: 0.5 }); } },
      onHurt(A, u) { u.tal.riverHit = A.time; u.fx = u.fx.filter(f => !/^Весенние потоки/.test(f.n)); } },
    night: { v: { a: [1, 0.18], b: [3, 0.06], c: [4, 0.12] }, tpl: 'Шанс крита +{a}; за каждые 10% прибавки к скорости атаки урон Атаки и Навыка +{b}, крит. урон Абсолютной техники +{c}, до 6 раз.', st: [['crit', 'a']],
      tick(A, u) { const n = Math.min(6, Math.floor((u.agi + 100 * A.sum(u, 'aspd')) / 10)); A.addFx(u, { n: 'В ночи', k: 'dmg_basic', v: this.V.b * n, t: 0.5 }); A.addFx(u, { n: 'В ночи: навык', k: 'dmg_q', v: this.V.b * n, t: 0.5 }); u.tal.nightR = this.V.c * n; },
      critDBonus(A, u, t, o) { return o.kind === 'r' ? u.tal.nightR || 0 : 0; } },
    shrine: { v: { a: [1, 0.36], b: [2, 0.18] }, tpl: 'Крит. урон +{a}; после Навыка или Абсолютной техники урон стихии героя +{b} на 6 с, до 2 раз.', st: [['critD', 'a']],
      onCast(A, u, slot) { if (slot === 'q' || slot === 'r') A.addFx(u, { n: 'Сто процентов дыни', k: 'dmgE_' + u.elem, v: this.V.b, t: 6, max: 2 }); } },
    blissful: { v: { a: [1, 0.18], b: [2, 0.3], c: [3, 0.12] }, tpl: 'Шанс крита +{a}, урон бонус-атак +{b}; бонус-атака вешает «Приручение», до 2: крит. урон по цели +{c} за уровень.', st: [['crit', 'a'], ['dmg_bonus', 'b']],
      onHit(A, u, t, o) { if (o.kind === 'bonus' && !t.dead) A.addFx(t, { n: 'Приручение', k: 'tame', v: this.V.c, t: 15, max: 2 }); }, critDBonus(A, u, t) { return A.sum(t, 'tame'); } },
    baptism: { v: { a: [1, 0.2], b: [2, 0.08], c: [4, 0.36], d: [5, 0.24] }, tpl: 'Крит. урон +{a} и ещё +{b} за каждое ослабление цели, до 3; Абсолютная техника даёт «Дискуссию» на 6 с: урон +{c}, бонус-атаки игнорируют {d} брони.', st: [['critD', 'a']],
      critDBonus(A, u, t) { return this.V.b * Math.min(3, HD.debuffs(t).length); },
      onCast(A, u, slot) { if (slot === 'r') { A.addFx(u, { n: 'Дискуссия', k: 'dmg', v: this.V.c, t: 6 }); u.tal.discuss = A.time + 6; } },
      penBonus(A, u, t, o) { return o.kind === 'bonus' && u.tal.discuss > A.time ? this.V.d : 0; } },
    databank: { v: { a: [1, 0.28] }, tpl: 'Урон Абсолютной техники +{a}.', st: [['dmg_r', 'a']] },
    geniuses: { v: { a: [1, 0.16], b: [2, 0.24] }, tpl: 'Урон атаки +{a}; после добивания крит. урон +{b} на 9 с.', st: [['atk', 'a']], onKill(A, u) { A.addFx(u, { n: 'Отдых гениев', k: 'critD', v: this.V.b, t: 9 }); } },
    starlight: { v: { a: [1, 0.16], b: [2, 0.2], c: [3, 0.16] }, tpl: 'Урон атаки +{a}, урон Атаки +{b}; после Абсолютной техники урон стихии героя +{c} на 6 с.', st: [['atk', 'a'], ['dmg_basic', 'b']],
      onCast(A, u, slot) { if (slot === 'r') A.addFx(u, { n: 'Звёздные рыцари', k: 'dmgE_' + u.elem, v: this.V.c, t: 6 }); } },
    breakfast: { v: { a: [1, 0.12], b: [2, 0.04] }, tpl: 'Урон +{a}; каждое добивание даёт урон атаки +{b} до конца волны, до 3 раз.', st: [['dmg', 'a']], onKill(A, u) { A.addFx(u, { n: 'Важность завтрака', k: 'atk', v: this.V.b, t: 9999, max: 3 }); }, onWaveEnd(A, u) { u.fx = u.fx.filter(f => f.n !== 'Важность завтрака'); } },
    milkyway: { v: { a: [2, 0.09], b: [1, 0.3] }, tpl: 'Урон атаки +{a} за каждого врага в 300, до 5; пробитие врага даёт урон +{b} на 3 с.',
      tick(A, u) { const n = Math.min(5, A.unitsIn(circle(u.x, u.y, 300), 'foe').length); A.addFx(u, { n: 'Ночь на Млечном Пути', k: 'atk', v: this.V.a * n, t: 0.5 }); },
      onAnyBreak(A, u) { A.addFx(u, { n: 'Ночь на Млечном Пути: пробитие', k: 'dmg', v: this.V.b, t: 3 }); } },
    beforedawn: { v: { a: [1, 0.36], b: [2, 0.18], c: [3, 0.48] }, tpl: 'Крит. урон +{a}, урон Навыка и Абсолютной техники +{b}; после них «Спящее тело»: следующая бонус-атака +{c}.', st: [['critD', 'a'], ['dmg_q', 'b'], ['dmg_r', 'b']],
      onCast(A, u, slot) { if (slot === 'q' || slot === 'r') u.tal.sleep = true; }, dmgMul(A, u, t, o) { return o.kind === 'bonus' && u.tal.sleep ? 1 + this.V.c : 1; }, onHit(A, u, t, o) { if (o.kind === 'bonus') u.tal.sleep = false; } },
    gaze: { v: { a: [1, 0.36], b: [2, 0.0006] }, tpl: 'Крит. урон +{a}; урон Абсолютной техники растёт с макс. энергией героя, до +65%.', st: [['critD', 'a']], tick(A, u) { A.addFx(u, { n: 'Остановись, мгновенье', k: 'dmg_r', v: Math.min(0.65, this.V.b * u.enMax), t: 0.5 }); } },
    chorus: { v: { a: [1, 0.08] }, tpl: 'В начале волны урон атаки союзников в 300 +{a} до конца волны.', onWave(A, u) { for (const v of allies(A, u, 300)) A.addFx(v, { n: 'Хор', k: 'atk', v: this.V.a, t: 9999 }); }, onWaveEnd(A, u) { for (const v of A.units) v.fx = v.fx.filter(f => f.n !== 'Хор'); } },
    memories: { v: { a: [1, 0.28], b: [2, 4] }, tpl: 'Эффект пробития +{a}; атака даёт ещё {b} энергии, не чаще раза в 3 с.', st: [['breakEff', 'a']], raw: ['b'],
      onHit(A, u, t, o) { if ((o.basic || o.kind === 'q') && A.time - (u.tal.memAt || -9) >= 3) { u.tal.memAt = A.time; u.en = Math.min(u.enMax, u.en + this.V.b); } } },
    cccbadge: { v: { a: [1, 0.08], b: [2, 10] }, tpl: 'Восстановление энергии +{a}; в начале волны +{b}% энергии.', st: [['enRegenP', 'a']], raw: ['b'], onWave(A, u) { u.en = Math.min(u.enMax, u.en + u.enMax * this.V.b / 100); } },
    pastfuture: { v: { a: [1, 0.16] }, tpl: 'После Навыка следующий удар героя, турели или призыва в 300 сильнее на {a}.',
      onCast(A, u, slot) { if (slot === 'q') for (const v of allies(A, u, 300)) A.addFx(v, { n: 'Прошлое и будущее', k: 'dmg', v: this.V.a, t: 6 }); },
      onAllyAttack(A, u, src) { src.fx = src.fx.filter(f => f.n !== 'Прошлое и будущее'); } },
    butthebattle: { v: { a: [1, 0.1], b: [2, 0.3] }, tpl: 'Восстановление энергии +{a}; Абсолютная техника возвращает 15% энергии раз в две; после Навыка урон союзников в 300 +{b} на 3 с.', st: [['enRegenP', 'a']],
      onCast(A, u, slot) {
        if (slot === 'r') { u.tal.bbN = (u.tal.bbN || 0) + 1; if (u.tal.bbN % 2) u.en = Math.min(u.enMax, u.en + u.enMax * 0.15); }
        if (slot === 'q') for (const v of allies(A, u, 300)) A.addFx(v, { n: 'Битва не окончена', k: 'dmg', v: this.V.b, t: 3 });
      } },
    mirror: { v: { a: [1, 0.6], b: [2, 0.24] }, tpl: 'Эффект пробития +{a}; после Абсолютной техники урон союзников +{b} на 9 с; в начале волны +10% энергии.', st: [['breakEff', 'a']],
      onCast(A, u, slot) { if (slot === 'r') for (const v of allies(A, u, 400)) A.addFx(v, { n: 'Отражение прошлой меня', k: 'dmg', v: this.V.b, t: 9 }); }, onWave(A, u) { u.en = Math.min(u.enMax, u.en + u.enMax * 0.1); } },
    void: { v: { a: [1, 0.2] }, tpl: 'В начале волны шанс эффекта +{a} на 9 с.', onWave(A, u) { A.addFx(u, { n: 'Пустота', k: 'ehr', v: this.V.a, t: 9 }); } },
    goodnight: { v: { a: [1, 0.12] }, tpl: '+{a} урона за каждое ослабление на цели, до 3; действует и на периодический урон.', dmgMul(A, u, t) { return 1 + this.V.a * Math.min(3, HD.debuffs(t).length); } },
    junesday: { v: { a: [1, 0.16], b: [2, 0.24] }, tpl: 'Шанс эффекта +{a}, урон бонус-атак +{b}.', st: [['ehr', 'a'], ['dmg_bonus', 'b']] },
    cccgorilla: { v: { a: [1, 0.16], b: [2, 0.12] }, tpl: 'Шанс эффекта +{a}; первая элита или босс волны «Под присмотром»: урон по ней +{b} на 9 с.', st: [['ehr', 'a']],
      onWave(A, u) { u.tal.watched = false; },
      tick(A, u) { if (u.tal.watched) return; const big = A.foes().filter(f => f.elite || f.kind === 'boss').sort((a, b) => b.hp - a.hp)[0]; if (big) { u.tal.watched = true; A.addFx(big, { n: 'Под присмотром', k: 'vuln', v: this.V.b, t: 9, deb: true }); } } },
    vault: { v: { a: [1, 0.16], b: [2, 0.12] }, tpl: 'Шанс эффекта +{a}; после Навыка или Абсолютной техники задетые враги получают +{b} урона на 6 с, герой +3 энергии за каждого, до 15.', st: [['ehr', 'a']],
      preCast(A, u, slot) { u.tal.vaultOn = slot === 'q' || slot === 'r'; u.tal.vaultN = 0; },
      onHit(A, u, t, o) { if (!u.tal.vaultOn || (o.kind !== 'q' && o.kind !== 'r')) return; A.addFx(t, { n: 'Как купить солнце', k: 'vuln', v: this.V.b, t: 6, deb: true }); if (u.tal.vaultN < 5) { u.tal.vaultN++; u.en = Math.min(u.enMax, u.en + 3); } },
      onCast(A, u) { u.tal.vaultOn = false; } },
    fermata: { v: { a: [1, 0.16], b: [2, 0.16] }, tpl: 'Эффект пробития +{a}, урон по врагам с Шоком или Порывом ветра +{b}.', st: [['breakEff', 'a']], dmgMul(A, u, t) { return t.fx.some(f => f.n === 'Шок' || f.n === 'Порыв ветра') ? 1 + this.V.b : 1; } },
    patience: { v: { a: [2, 0.24], b: [3, 0.048] }, tpl: 'Урон +{a}; каждая атака +{b} скорости атаки, до 3; удар по врагу без «Паутинки» вешает её: Шок 60% урона атаки раз в 3 с на 3 с.', st: [['dmg', 'a']],
      onHit(A, u, t, o) {
        if (o.kind === 'dot' || o.kind === 'break') return;
        if (o.basic || o.kind === 'q' || o.kind === 'r') A.addFx(u, { n: 'Просто надо подождать', k: 'aspd', v: this.V.b, t: 9, max: 3 });
        if (!t.dead && !t.fx.some(f => f.n === 'Паутинка')) A.addFx(t, { n: 'Паутинка', k: 'dot', v: 0, dps: 0.2 * A.atkOf(u), elem: 'elec', t: 3, src: u });
      } },
    rain: { v: { a: [1, 0.24], b: [5, 0.12], c: [3, 0.12] }, tpl: 'Шанс эффекта +{a}; по врагу с тремя ослаблениями шанс крита +{b}; Атака, Навык или Абсолютная техника вешают «Эфирный код»: получаемый урон +{c} на 3 с.', st: [['ehr', 'a']],
      critBonus(A, u, t) { return HD.debuffs(t).length >= 3 ? this.V.b : 0; },
      onHit(A, u, t, o) { if ((o.basic || o.kind === 'q' || o.kind === 'r') && !t.dead) A.addFx(t, { n: 'Эфирный код', k: 'vuln', v: this.V.c, t: 3, deb: true }); } },
    amber: { v: { a: [1, 0.16], b: [3, 0.16] }, tpl: 'Броня +{a}; при НР ниже 50% ещё +{b}.', st: [['armorP', 'a']], tick(A, u) { if (u.hp < u.hpMax * 0.5) A.addFx(u, { n: 'Янтарь', k: 'armor', v: u.armor0 * this.V.b, t: 0.5 }); } },
    trend: { v: { a: [1, 0.16], b: [3, 0.2] }, tpl: 'Броня +{a}; враг, ударивший героя, загорается на 6 с.', st: [['armorP', 'a']],
      onHurt(A, u, f) { if (!f.dead) A.addFx(f, { n: 'Горение', k: 'dot', v: 0, dps: this.V.b * A.armorOf(u) * TUN.defDmgK / 3, elem: 'fire', t: 6, src: u }); } },
    wildfire: { v: { a: [1, 0.3], b: [2, 0.08] }, tpl: 'В начале волны союзники получают на {b} меньше урона 15 с и восстанавливают {a} недостающего НР.',
      onWave(A, u) { for (const v of allies(A, u, 400)) { A.addFx(v, { n: 'Мы Дикий Огонь', k: 'dr', v: this.V.b, t: 15 }); A.heal(u, v, (v.hpMax - v.hp) * this.V.a); } } },
    moment: { v: { a: [2, 0.24], b: [4, 0.24], c: [3, 0.24] }, tpl: 'Броня +{a}, шанс эффекта +{b}; враги чаще бьют героя; полученный удар даёт ещё +{c} брони на 3 с.', st: [['armorP', 'a'], ['ehr', 'b'], ['aggroP', 'half']],
      onHurt(A, u) { A.addFx(u, { n: 'Момент победы', k: 'armor', v: u.armor0 * this.V.c, t: 3 }); } },
    shuteyes: { v: { a: [1, 0.24], b: [4, 0.12], c: [2, 0.09], d: [3, 0.8] }, tpl: 'Макс. НР +{a}, восстановление энергии +{b}; потеря НР даёт урон союзников +{c} на 6 с; в начале волны союзники восстанавливают {d} потерянного НР.', st: [['hpP', 'a'], ['enRegenP', 'b']],
      onLose(A, u) { for (const v of allies(A, u, 400)) A.addFx(v, { n: 'Она закрыла глаза', k: 'dmg', v: this.V.c, t: 6 }); },
      onWave(A, u) { for (const v of allies(A, u, 400)) A.heal(u, v, (v.hpMax - v.hp) * this.V.d); } },
    cornucopia: { v: { a: [1, 0.12] }, tpl: 'После Навыка или Абсолютной техники исходящее лечение +{a} на 6 с.', preCast(A, u, slot) { if (slot === 'q' || slot === 'r') A.addFx(u, { n: 'Рог изобилия', k: 'healP', v: this.V.a, t: 6 }); } },
    postop: { v: { a: [1, 0.08], b: [2, 0.12] }, tpl: 'Восстановление энергии +{a}, лечение Абсолютной техники +{b}.', st: [['enRegenP', 'a']], preCast(A, u, slot) { if (slot === 'r') A.addFx(u, { n: 'Беседа после операции', k: 'healP', v: this.V.b, t: 0.05 }); } },
    amagiinn: { v: { a: [1, 0.12], b: [2, 0.24] }, tpl: 'Исходящее лечение +{a}, периодический урон героя +{b}.', st: [['healP', 'a']], dmgMul(A, u, t, o) { return o.kind === 'dot' ? 1 + this.V.b : 1; } },
    quid: { v: {}, tpl: 'Каждые 3 с +2% энергии, пока энергии меньше половины.', tick(A, u) { if (A.time - (u.tal.quid || 0) >= 3) { u.tal.quid = A.time; if (u.en < u.enMax * 0.5) u.en += u.enMax * 0.02; } } },
    hagoromo: { v: { a: [1, 0.18], b: [2, 0.18], c: [3, 0.18] }, tpl: 'Макс. НР +{a}, исходящее лечение +{b}; вылеченный союзник получает сопротивление эффектам +{c} на 6 с.', st: [['hpP', 'a'], ['healP', 'b']],
      onHeal(A, u, t) { A.addFx(t, { n: 'Номер на бис', k: 'res', v: this.V.c, t: 6 }); } },
    coffin: { v: { a: [1, 0.24], b: [2, 0.12] }, tpl: 'Урон атаки +{a}; каждый задетый атакой враг даёт 3 энергии, до 3 за атаку; после Абсолютной техники скорость передвижения союзников +12% на 3 с.', st: [['atk', 'a']],
      onHit(A, u, t, o) { if (!(o.basic || o.kind === 'q' || o.kind === 'r')) return; if (u.tal.coffT !== A.tick) { u.tal.coffT = A.tick; u.tal.coffN = 0; } if (u.tal.coffN < 3) { u.tal.coffN++; u.en = Math.min(u.enMax, u.en + 3); } },
      onCast(A, u, slot) { if (slot === 'r') for (const v of allies(A, u, 300)) A.addFx(v, { n: 'Эхо из гроба', k: 'mspd', v: 0.12, t: 3 }); } },
    fright: { v: { a: [1, 0.12], b: [2, 0.1], c: [3, 0.024] }, tpl: 'Восстановление энергии +{a}; после Абсолютной техники самый раненый союзник лечится на {b} макс. НР; лечение даёт цели урон атаки +{c} на 6 с, до 5 раз.', st: [['enRegenP', 'a']],
      onCast(A, u, slot) { if (slot !== 'r') return; const v = allies(A, u, 600).filter(x => x.hp < x.hpMax).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0]; if (v) A.heal(u, v, v.hpMax * this.V.b); },
      onHeal(A, u, t) { A.addFx(t, { n: 'Ночь страха', k: 'atk', v: this.V.c, t: 6, max: 5 }); } }
  };

  function coneVals(id, sup) {
    const d = CONES[id], out = {};
    for (const [k, [n, b]] of Object.entries(d.v)) {
      const p1 = H.coneParam(id, n, 1), ps = H.coneParam(id, n, sup);
      out[k] = p1 ? b * ps / p1 : b;
    }
    out.half = 0.5;
    return out;
  }

  function coneText(id, sup) {
    const d = CONES[id], V = coneVals(id, sup);
    return d.tpl.replace(/\{(\w)\}/g, (m, k) => ((d.raw || []).includes(k) ? String(Math.round(V[k])) : P(V[k])));
  }

  function coneStats(id) {
    const s = H.CONES[id].stats;
    return { atkFlat: s.atk / 2, hp: s.hp * 2, armor: s.def / 10 };
  }

  const SET_MODS = {
    station: { two: { tick(A, u) { if (A.sum(u, 'aspd') + u.agi / 100 >= 0.4) A.addFx(u, { n: 'Станция: темп', k: 'atk', v: 0.12, t: 0.5 }); } } },
    vonwacq: { two: { onWave(A, u) { if (A.sum(u, 'aspd') + u.agi / 100 >= 0.4) for (const s of ['q', 'e', 'r']) u.cd[s] *= 0.6; } } },
    salsotto: { two: { dmgMul(A, u, t, o) { return (o.kind === 'r' || o.kind === 'bonus') && TUN.critC + A.sum(u, 'crit') >= 0.5 ? 1.15 : 1; } } },
    passerby: { four: { onWave(A, u) { u.en = Math.min(u.enMax, u.en + 100); }, onRespawn(A, u) { u.en = Math.min(u.enMax, u.en + 100); } } },
    musketeer: { four: { st: [['aspd', 0.06], ['dmg_basic', 0.1]] } },
    knight: { four: { st: [['shieldP', 0.2]] } },
    thief: { four: { st: [['breakEff', 0.16]], onAnyBreak(A, u, f, src) { if (src === u) u.en = Math.min(u.enMax, u.en + 3); } } },
    firesmith: { four: { st: [['dmg_q', 0.12]], onCast(A, u, slot) { if (slot === 'r') u.tal.smith = true; }, dmgMul(A, u, t, o) { return u.tal.smith && (o.elem || u.elem) === 'fire' ? 1.12 : 1; }, onHit(A, u, t, o) { if ((o.elem || u.elem) === 'fire' && o.kind !== 'r') u.tal.smith = false; } } },
    glacial: { four: { onCast(A, u, slot) { if (slot === 'r') A.addFx(u, { n: 'Охотник ледникового леса', k: 'critD', v: 0.25, t: 6 }); } } },
    thunder: { four: { onCast(A, u, slot) { if (slot === 'q') A.addFx(u, { n: 'Бэнд испепеляющего грома', k: 'atk', v: 0.2, t: 3 }); } } },
    eagle: { four: { onCast(A, u, slot) { if (slot === 'r') { u.cd.q *= 0.75; u.cd.e *= 0.75; } } } },
    genius: { four: { penBonus(A, u, t) { return 0.1 + ((t.weak || []).includes('quant') || t.fx.some(f => f.k === 'weakAdd' && f.elem === 'quant') ? 0.1 : 0); } } },
    wastelander: { four: { critBonus(A, u, t) { return HD.debuffs(t).length ? 0.1 : 0; }, critDBonus(A, u, t) { return t.fx.some(f => /Заточение/.test(f.n)) ? 0.2 : 0; } } },
    champion: { four: { onHit(A, u, t, o) { if (o.kind !== 'dot') A.addFx(u, { n: 'Чемпион уличного бокса', k: 'atk', v: 0.05, t: 6, max: 5 }); }, onHurt(A, u) { A.addFx(u, { n: 'Чемпион уличного бокса', k: 'atk', v: 0.05, t: 6, max: 5 }); } } }
  };

  const relicLvl = it => it.up || 0;
  const relicCount = h => { const c = {}; for (const it of h.items) if (it && it.id === 'relic') c[it.set] = (c[it.set] || 0) + 1; return c; };

  function equip(A, h, fresh) {
    const E = { attr: 0, hp: 0, hpP: 0, armor: 0, armorP: 0, fx: [], mods: [] };
    const spd = HD.heroStats(h.key, h.lvl).spd;
    const addSt = (k, v) => { if (k === 'hpP') E.hpP += v; else if (k === 'armorP') E.armorP += v; else if (k === 'armor') E.armor += v; else if (k === 'hp') E.hp += v; else E.fx.push([k, v]); };
    for (const it of h.items) {
      if (!it || it.id !== 'relic') continue;
      const l = relicLvl(it);
      E.attr += R.main[0] + R.main[1] * l;
      if (it.slot === 'body') { const [k, v] = R.body[it.set]; addSt(k, v * (1 + l / 3)); continue; }
      const sl = R.slot[it.slot], v = sl.v[0] + sl.v[1] * l;
      if (sl.k === 'mspdPx') E.fx.push(['mspd', v / spd]);
      else if (sl.k === 'elemDmg') E.fx.push(['dmgE_' + H.CHARS[h.key].elem, v]);
      else addSt(sl.k, v);
    }
    const cnt = relicCount(h);
    for (const [set, n] of Object.entries(cnt)) {
      const planar = H.RELIC_SETS[set].planar, M = SET_MODS[set] || {};
      if (n >= 2) { for (const [k, v] of R.two[set] || []) addSt(k, v); if (M.two) E.mods.push(Object.assign({ eq: true }, M.two)); }
      if (!planar && n >= 4 && M.four) { for (const [k, v] of M.four.st || []) addSt(k, v); E.mods.push(Object.assign({ eq: true }, M.four)); }
    }
    for (const it of h.items) if (it && HD.DEVICES[it.id]) {
      if (it.id === 'findie') E.fx.push(['goldP', 0.2]);
      if (it.id === 'gold_watch') E.mods.push({ eq: true, onBreakStart(A2, u) { A2.giveGold(u, 60, 'watch'); } });
    }
    if (h.cone && CONES[h.cone.id]) {
      const cs = coneStats(h.cone.id), d = CONES[h.cone.id], V = coneVals(h.cone.id, h.cone.sup);
      E.fx.push(['atkFlat', cs.atkFlat]); E.hp += cs.hp; E.armor += cs.armor;
      for (const [k, vk] of d.st || []) addSt(k, V[vk]);
      if (d.stE) E.fx.push(['dmgE_' + H.CHARS[h.key].elem, V[d.stE]]);
      const M = Object.assign({ eq: true, V }, d);
      delete M.st; delete M.v; delete M.tpl;
      E.mods.push(M);
    }
    h.eq = E;
    h.mods = [HD.KITS[h.key]].concat(E.mods);
    A.heroStatsApply(h, !!fresh);
    h.fx = h.fx.filter(f => !f.eq);
    E.fx.forEach(([k, v], i) => h.fx.push({ n: 'eq' + i + k, k, v, t: Infinity, eq: true, tickT: 1 }));
  }

  const itemPrice = it => (it.id === 'relic' ? R.price : HD.DEVICES[it.id] ? HD.DEVICES[it.id].price : HD.SUPPLIES[it.id].price);
  const slotFree = h => h.items.indexOf(null);

  function deny(A, why) { A.emit({ t: 'deny', why }); return false; }

  function pay(A, h, cost) { h.gold -= cost; A.stats.spent += cost; }

  function buyItem(A, h, id, o = {}) {
    if (h.dead) return deny(A, '');
    if (!A.nearShop(h)) return deny(A, 'Лавка на площади. F: возврат');
    const fresh = { at: A.breakNo, phase: A.phase };
    if (id === 'relic') {
      const set = o.set, slot = o.slot, S = H.RELIC_SETS[set];
      if (!S || !S.pieces[slot]) return deny(A, '');
      if (h.items.some(it => it && it.id === 'relic' && it.slot === slot)) return deny(A, 'Эта часть уже надета');
      if (h.gold < R.price) return deny(A, 'Мало золота');
      const i = slotFree(h);
      if (i < 0) return deny(A, 'Инвентарь полон: продайте предмет (Delete)');
      pay(A, h, R.price);
      h.items[i] = Object.assign({ id: 'relic', set, slot, up: 0, paid: R.price }, fresh);
      equip(A, h);
      A.emit({ t: 'buy', id: 'relic', i, cost: R.price });
      return true;
    }
    if (id === 'cone') {
      const C = H.CONES[o.cone];
      if (!C || !CONES[o.cone]) return deny(A, '');
      if (C.path !== H.CHARS[h.key].path) return deny(A, 'Конус чужого Пути');
      if (h.cone && h.cone.id === o.cone) return deny(A, 'Этот конус уже в ячейке');
      const cost = HD.CONE_PRICE[C.rarity], back = h.cone ? sellValue(A, h.cone) : 0;
      if (h.gold + back < cost) return deny(A, 'Мало золота');
      h.gold += back;
      pay(A, h, cost);
      h.cone = Object.assign({ id: o.cone, sup: 1, paid: cost }, fresh);
      equip(A, h);
      A.emit({ t: 'buy', id: 'cone', cost });
      return true;
    }
    const S = HD.SUPPLIES[id], D = HD.DEVICES[id];
    if (!S && !D) return deny(A, '');
    const price = (S || D).price;
    if (h.gold < price) return deny(A, 'Мало золота');
    let i = -1;
    if (S) i = h.items.findIndex(it => it && it.id === id && it.n < S.stack);
    if (D && h.items.some(it => it && it.id === id)) return deny(A, 'Такое устройство уже есть');
    if (i < 0) i = slotFree(h);
    if (i < 0) return deny(A, 'Инвентарь полон: продайте предмет (Delete)');
    pay(A, h, price);
    if (h.items[i]) { h.items[i].n++; h.items[i].paid += price; }
    else h.items[i] = Object.assign({ id, n: 1, paid: price }, D && D.charges ? { ch: D.charges } : {}, fresh);
    if (D) equip(A, h);
    A.emit({ t: 'buy', id, i, cost: price });
    return true;
  }

  function grantItem(A, h, id, o = {}) {
    if (id === 'cone') { if (!CONES[o.cone]) return false; h.cone = { id: o.cone, sup: Math.max(1, Math.min(5, o.sup || 1)), paid: 0 }; equip(A, h); return true; }
    if (id === 'relic') {
      if (!H.RELIC_SETS[o.set] || !H.RELIC_SETS[o.set].pieces[o.slot]) return false;
      h.items = h.items.map(it => (it && it.id === 'relic' && it.slot === o.slot ? null : it));
      const i = slotFree(h);
      if (i < 0) return false;
      h.items[i] = { id: 'relic', set: o.set, slot: o.slot, up: Math.max(0, Math.min(5, o.up || 0)), paid: 0 };
      equip(A, h);
      return true;
    }
    const S = HD.SUPPLIES[id], D = HD.DEVICES[id];
    if (!S && !D) return false;
    if (D && h.items.some(it => it && it.id === id)) return false;
    let i = S ? h.items.findIndex(it => it && it.id === id && it.n < S.stack) : -1;
    if (i >= 0) { h.items[i].n++; return true; }
    i = slotFree(h);
    if (i < 0) return false;
    h.items[i] = Object.assign({ id, n: 1, paid: 0 }, D && D.charges ? { ch: D.charges } : {});
    equip(A, h);
    return true;
  }

  function upgradeCost(it) { return it.id === 'relic' ? R.up[relicLvl(it)] : null; }

  function upgrade(A, h, i) {
    const it = i === 'cone' ? h.cone : h.items[i];
    if (!it) return deny(A, '');
    if (!A.nearShop(h)) return deny(A, 'Лавка на площади. F: возврат');
    let cost;
    if (i === 'cone') { if (it.sup >= 5) return deny(A, 'Наложение уже S5'); cost = Math.round(HD.CONE_PRICE[H.CONES[it.id].rarity] * 0.5); }
    else { if (it.id !== 'relic') return deny(A, 'Улучшаются только реликвии'); if (relicLvl(it) >= 5) return deny(A, 'Реликвия уже +15'); cost = upgradeCost(it); }
    if (h.gold < cost) return deny(A, 'Мало золота');
    pay(A, h, cost);
    if (i === 'cone') it.sup++; else it.up = relicLvl(it) + 1;
    it.paid = (it.paid || 0) + cost;
    equip(A, h);
    A.emit({ t: 'upgrade', i, cost });
    return true;
  }

  function sellValue(A, it) {
    const fresh = it.at === A.breakNo && it.phase === 'break' && A.phase === 'break';
    const full = fresh || (HD.DEVICES[it.id] && HD.DEVICES[it.id].fullSell);
    const paid = it.paid != null ? it.paid : itemPrice(it) * (it.n || 1);
    return Math.round(paid * (full ? 1 : TUN.sell));
  }

  function sellItem(A, h, i) {
    const it = h.items[i];
    if (!it || !A.nearShop(h)) return deny(A, it ? 'Продать можно только у лавки' : '');
    const v = sellValue(A, it);
    h.items[i] = null;
    h.gold += v; A.stats.spent -= Math.min(A.stats.spent, v);
    if (it.id === 'relic' || HD.DEVICES[it.id]) equip(A, h);
    A.emit({ t: 'sell', id: it.id, v });
    return true;
  }

  function channel(A, h, t, fn, text) {
    h.chan = { t, fn };
    h.path = null; h.moveDir = null; h.forced = null;
    A.emit({ t: 'msg', text });
  }

  function useDevice(A, h, it, aim) {
    const D = HD.DEVICES[it.id];
    if (D.passive) return deny(A, 'Работает само');
    if (it.id === 'grenade') {
      if (!it.ch) return deny(A, 'Гранаты кончились до перерыва');
      const t = aim && aim.x != null ? aim : A.nearestFoe(h.x, h.y, D.range);
      if (!t) return deny(A, 'Нет цели рядом');
      let x = t.x, y = t.y; const d = N.hypot(x - h.x, y - h.y);
      if (d > D.range) { x = h.x + (x - h.x) / d * D.range; y = h.y + (y - h.y) / d * D.range; }
      it.ch--;
      A.addArea({ shape: 'circle', x, y, r: 72, side: 'foe', delay: 0.4, kind: 'blast', elem: 'phys', onFire(A2, a) {
        for (const v of A2.unitsIn(a, 'foe')) { A2.hit(h, v, { m: 1.2, kind: 'item', type: 'weapon', elem: 'phys', tough: 10 }); if (!v.dead) A2.addFx(v, { n: 'Оглушение', k: 'stun', v: 1, t: 1 }); }
        A2.emit({ t: 'fx', kind: 'boom', x: a.x, y: a.y, r: 72, elem: 'phys' });
      } });
      return true;
    }
    if (it.cdT > A.time) return deny(A, 'Перезарядка');
    if (it.id === 'anchor') {
      const tur = A.turrets.filter(t => !t.dead).sort((a, b) => N.hypot(a.x - (aim && aim.x != null ? aim.x : h.x), a.y - (aim && aim.y != null ? aim.y : h.y)) - N.hypot(b.x - (aim && aim.x != null ? aim.x : h.x), b.y - (aim && aim.y != null ? aim.y : h.y)))[0];
      const S = A.M.spawn, to = aim && aim.x != null && tur ? { x: tur.x, y: tur.y + 34 } : { x: S[0] * TS + 16, y: S[1] * TS + 16 };
      it.cdT = A.time + D.cd;
      channel(A, h, D.chan, () => { h.x = h.px = to.x; h.y = h.py = to.y; A.collide(h); A.emit({ t: 'msg', text: 'Якорь сработал', p: h.pl }); }, 'Якорь: канал 1,5 с');
      return true;
    }
    if (it.id === 'garrison') { it.cdT = A.time + D.cd; A.addFx(h, { n: 'Щит Гарнизона', k: 'shield', v: h.hpMax * 0.25, t: 5 }); return true; }
    if (it.id === 'rz_key') {
      const t = aim && aim.id != null ? A.byId(aim.id) : A.nearestFoe(h.x, h.y, D.range);
      if (!t || t.side !== 'foe' || N.hypot(t.x - h.x, t.y - h.y) > D.range + t.r) return deny(A, 'Нет цели рядом');
      it.cdT = A.time + D.cd;
      t.fx = t.fx.filter(f => f.deb || f.k === 'stun' || f.k === 'slow' || f.k === 'dot' || f.k === 'vuln');
      A.addFx(t, { n: 'Взлом', k: 'armor', v: -0.3 * t.armor, t: 6, deb: true });
      A.emit({ t: 'fx', kind: 'bolt', x: t.x, y: t.y, r: 30, elem: 'quant' });
      return true;
    }
    if (it.id === 'probe') {
      const s = A.units.filter(v => !v.dead && (v.kind === 'turret' || v.kind === 'base') && A.gap(h, v) <= 120).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
      if (!s) return deny(A, 'Подойдите к турели или базе');
      it.cdT = A.time + D.cd;
      channel(A, h, D.chan, () => A.heal(h, s, s.hpMax * 0.15), 'Зонд: канал 2 с');
      return true;
    }
    return false;
  }

  function useItem(A, h, i, aim) {
    const it = h.items[i];
    if (!it || h.dead) return deny(A, '');
    if (it.id === 'relic') return deny(A, 'Реликвия работает сама');
    if (HD.DEVICES[it.id]) { const ok = useDevice(A, h, it, aim); if (ok) A.emit({ t: 'use', id: it.id }); return ok; }
    const S = HD.SUPPLIES[it.id];
    if (S.passive) return deny(A, 'Срабатывает сама при гибели');
    if (S.counter && !A.nearShop(h)) return deny(A, 'Только у прилавка');
    const u = S.use;
    if (u.hot) A.addFx(h, { n: 'Аптечка', k: 'hot', v: 0, hps: h.hpMax * u.hot / u.t, src: h, t: u.t });
    if (u.energy) h.en = Math.min(h.enMax, h.en + h.enMax * u.energy);
    if (u.mspd) A.addFx(h, { n: 'Кофе', k: 'mspd', v: u.mspd, t: u.t });
    if (u.base) { A.heal(h, A.base, A.base.hpMax * u.base); for (const t of A.turrets) if (!t.dead) A.heal(h, t, t.hpMax * u.towers); }
    it.n--;
    if (it.paid) it.paid = Math.round(it.paid * it.n / (it.n + 1));
    if (it.n <= 0) h.items[i] = null;
    A.emit({ t: 'use', id: it.id });
    return true;
  }

  function setInfo(h) {
    const c = relicCount(h);
    return Object.keys(c).map(set => ({ set, n: c[set], two: c[set] >= 2, four: !H.RELIC_SETS[set].planar && c[set] >= 4 }));
  }

  function relicText(it, lvl) {
    const l = lvl == null ? relicLvl(it) : lvl, main = R.main[0] + R.main[1] * l;
    if (it.slot === 'body') { const [k, v] = R.body[it.set]; return 'Основной атрибут +' + main + ', ' + R.stat[k] + ' +' + (k === 'armor' ? Math.round(v * (1 + l / 3) * 10) / 10 : P(v * (1 + l / 3))); }
    const sl = R.slot[it.slot], v = sl.v[0] + sl.v[1] * l;
    const val = sl.k === 'elemDmg' || sl.k === 'enRegenP' ? P(v) : String(Math.round(v * 10) / 10);
    return 'Основной атрибут +' + main + ', ' + R.stat[sl.k] + ' +' + val;
  }

  const devName = id => HD.DEVICES[id].name || H.ITEMS[id].name;
  const itemName = it => (it.id === 'relic' ? H.RELIC_SETS[it.set].pieces[it.slot] : HD.DEVICES[it.id] ? devName(it.id) : H.ITEMS[it.id].name);
  const conesFor = path => Object.keys(CONES).filter(id => H.CONES[id].path === path).sort((a, b) => H.CONES[a].rarity - H.CONES[b].rarity);

  Object.assign(HD, { CONE_MODE: CONES, SET_MODS, equip, grantItem, buyItem, sellItem, useItem, upgrade, upgradeCost, sellValue, coneVals, coneText, coneStats, relicCount, setInfo, relicText, itemName, devName, conesFor, SLOT_KINDS });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
