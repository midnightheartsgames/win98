(function (H) {
  'use strict';

  const KITS = {
    theherta: {
      name: 'Великая Герта', short: 'Вел. Герта', showEnhanced: true, path: 'erudition', elem: 'ice', rarity: 5, energy: 220, faction: 'herta',
      base: { hp: 158, atk: 92, def: 59, spd: 99 },
      look: { mood: 'blank', skin: '#f8e4da', hair: '#bcb0a8', hairHi: '#dcd0c8', tips: '#a494c8', tipsFade: true, tipsAt: 46, tipsBand: false, eye: '#8a5ad8', eye2: '#c0a0f0', bangs: 'sweep', sides: 'long', back: 'long', crown: 'smooth', gloss: true, body: 'tallf', coat: 'offcoat', coatLen: 4, top: '#1c1826', trim: '#b8b0d8', inner: '#1c1826', lining: '#1c1826', sleeve: '#1c1826', collar: 'bare', lower: '#f2eff6', petti: '#dcd8e8', low: 'skirt', skirtLen: 7, shoes: '#16121e', bootsTo: 'calf', tailsTo: 'ankle', tailsLining: '#a48ce0', acc: ['thhat:#1c1826', 'choker:#2a2438', 'tassel:#8a5ae8', 'thcorset:#b8b0d8', 'tails:#1c1826', 'stockings:#8a8894', 'thlace:#f2eff6', 'boots:#16121e', 'bootcuff:#2a2438', 'garter:#1c1826', 'thkeys:#e8c860'] },
      basic: { name: 'Понимаешь?', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Открытие разума', target: 'blast', text: 'три удара по 70%: цель, затем с соседями, затем с их соседями. Цели +1 Интерпретация.', fx: [{ k: 'thStrike', m: 0.7, tough: 5 }] },
      enhanced: { name: 'У меня появилась безумная идея', short: 'Безумная идея', target: 'blast', text: 'тратит Вдохновение. Три удара по 80%, затем по всем 40% плюс бонус от Интерпретации цели. Сброс.', fx: [{ k: 'thStrike', m: 0.8, end: 0.4, tough: 5, enh: true }] },
      ult: { name: 'Говорила ведь, что это магия', short: 'Это магия', target: 'all', text: 'делит Интерпретацию, урон всем 200%, атака +80%. Ход сразу, +1 Вдохн.', fx: [{ k: 'thRedo' }, { k: 'thBurst', m: 2.0, tough: 20 }, { k: 'buff', s: 'atkP', v: 0.8, turns: 3, who: 'self', name: 'Это магия' }, { k: 'thInspire' }, { k: 'advance', who: 'self', v: 1 }] },
      talent: 'Враги копят Интерпретацию (до 42, +8% за стак). В начале волны один получает 25.',
      tech: { name: 'Взглянем на кое-что хорошее', text: 'В следующем бою атака +60% на 2 хода.', fx: 'thTech' },
      contact: [{ name: 'Предложить новую аксиому', tag: 'science' }, { name: 'Посмотреть свысока', tag: 'silent' }]
    },
    tribbie: {
      name: 'Трибби', path: 'harmony', elem: 'quant', rarity: 5, energy: 120, faction: 'amphoreus',
      base: { hp: 143, atk: 71, def: 89, spd: 96 },
      look: { mood: 'smile', skin: '#fbe6da', hair: '#d8242c', hairHi: '#f25a50', eye: '#5a6ae0', eye2: '#b0b8ff', bangs: 'blunt', sides: 'jaw', back: 'short', earLen: 6, crown: 'smooth', gloss: true, body: 'small', coat: 'dress', top: '#f4ead4', trim: '#d8b048', inner: '#f4ead4', sleeve: '#f4ead4', gloves: '#34323e', collar: 'scoop', lower: '#f4ead4', petti: '#c8302a', low: 'skirt', skirtLen: 7, shoes: '#20202c', bootsTo: 'calf', acc: ['elfears', 'trbob:#d8242c', 'headband:#1c1c28', 'trtuft:#d8242c', 'trflowers:#fffdf4', 'trwings:#e8d490', 'trarm:#fbf6e8', 'trdress:#d8b048', 'socks:#e8e4dc', 'boots:#20202c', 'trboot:#c4c8d8', 'wingheel:#f4f0f8'] },
      basic: { name: 'Сотня ракет', target: 'blast', text: 'урон 30% макс. HP по цели, 15% по соседям.', fx: [{ k: 'dmg', m: 0, hpM: 0.3, adj: 0, adjHp: 0.15 }] },
      skill: { name: 'А куда делись подарки?', target: 'self', text: 'Освящение 3 хода: пробитие всех сопротивлений у всех союзников +24%.', fx: [{ k: 'trNum', v: 0.24 }] },
      ult: { name: 'Догадайся, кто тут живёт', short: 'Кто тут живёт', target: 'all', text: 'урон всем 30% HP. Зона 2 хода: враги +30% урона, союзники бьют ещё 12% HP.', fx: [{ k: 'trZone', vuln: 0.3, add: 0.12 }, { k: 'dmg', m: 0, hpM: 0.3, tough: 20 }] },
      talent: 'После ульты союзника бонус-атака всем 18% макс. HP. Раз на союзника, сброс её ультой.',
      tech: { name: 'Если вы счастливы, хлопайте в ладоши', text: 'В начале боя Освящение на 3 хода.', fx: 'trTech' },
      contact: [{ name: 'Спеть втроём', tag: 'sing' }, { name: 'Спросить, где подарки', tag: 'kind' }]
    }
  };

  const CONES = {
    undeniable: {
      name: 'Навстречу неоспоримому', path: 'erudition', rarity: 5, ref: 23037, stats: { hp: 43.2, atk: 28.8, def: 21 }, skill: 'Игра разума', sig: 'theherta',
      tpl: 'Крит. шанс владельца повышается на #1%. Когда владелец использует абсолютную технику, урон его навыка и абсолютной техники повышается на #2% на #3 хода. Если техника израсходовала #4 ед. энергии и больше, отряд получает 1 очко навыка.', p: [[0.12, 0.6, 3, 140], [0.14, 0.7, 3, 140], [0.16, 0.8, 3, 140], [0.18, 0.9, 3, 140], [0.2, 1, 3, 140]], bonus: { critR: 1 }, fx: 'undeniable',
      desc: '- Письма Гильдии разобраны.\n- Виртуальная вселенная работает без сбоев...\n- Собрание сочинений переиздано.\n- Ш-ш-ш. Не побеспокойте госпожу Герту...\nВ высокой башне на краю вселенной куклы методично выполняют свои поручения в ожидании её появления.\nВремя мимолётно. Бесчисленные личности метеорами рассекают ночное небо истории и, на мгновение вспыхивая, угасают навсегда.\n- Госпожа Герта давно не появлялась...\n- Она всё ещё размышляет?..\n- Хм, хватит ли нескольких новых аксиом, чтобы всё закончить?\nОна потягивается, отрывается от расчётов, и в голову приходит свежая мысль...\n- Нет ничего неопровержимого. Я докопаюсь до сути!'
    },
    timeflower: {
      name: 'Если бы время было цветком', path: 'harmony', rarity: 5, ref: 23038, stats: { hp: 57.6, atk: 24, def: 18 }, skill: 'Стремление', sig: 'tribbie',
      tpl: 'Крит. урон владельца повышается на #1%. После бонус-атаки владелец восстанавливает #2 ед. энергии и получает статус Предсказание на #3 хода. Пока он есть, крит. урон всех союзников повышается на #4%. В начале боя владелец восстанавливает #5 ед. энергии и получает Предсказание на #3 хода.', p: [[0.36, 12, 2, 0.48, 21], [0.42, 12, 2, 0.6, 21], [0.48, 12, 2, 0.72, 21], [0.54, 12, 2, 0.84, 21], [0.6, 12, 2, 0.96, 21]], bonus: { critD: 1 }, fx: 'timeflower',
      desc: '- Мамочка, я хочу, чтобы ты мне ещё одну сказку рассказала!\n- Доченька, хочешь послушать историю про время?\n- А что такое «время»?\n- Время похоже на цветок.\n- Как одуванчики, которые растут в поле?\n- Да, совсем как одуванчики. Время растёт, набухает, а затем приносит плоды. Его лепестки мы называем мгновениями.\n- А что потом?\n- Потом оно распадается на тысячи семян, которые разлетаются повсюду...\n- И становятся «будущим»... Да, мамочка?\n- И угадай, что с ним происходит позже?\n- Из таких семян вырастают новые цветочки, и получается целое море цветов?\nМать не успела ответить - солнечный свет коснулся личика дочки, пробудив ту ото сна, и нежный силуэт исчез.\nДевочка открыла глаза...\n- Если бы время было цветком... - пробормотала она.\n- Оно бы непременно стало морем цветов, - спокойно договорила девочка.\n- Непременно! - уже увереннее воскликнула она, завершая свой шедевр.'
    }
  };

  const T = H.TUNING, FX = ['thStrike', 'thRedo', 'thBurst', 'thInspire', 'trNum', 'trZone'];
  const { alive } = H.battleStat;
  const big = u => !!(u.data && (u.data.boss || u.data.elite));
  const mate = (b, id) => b.allies.find(a => a.charId === id && alive(a)) || null;
  const cf = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);
  const bon = (b, u, id) => !b.hasBonus || b.hasBonus(u, id);
  const eid = (b, u, n) => !!b.eidOn && b.eidOn(u, n);
  const stacks = e => e.flags.th || 0;
  const MIND = 'Игра разума', NUM = 'Освящение', ZONE = 'Догадайся, кто тут живёт', LAMB = 'Агнец за стеной...', GLASS = 'Стеклянный шар с крыльями!', PRESAGE = 'Предсказание', BUSY = 'Трибби и её заботы';
  const dropName = (u, name) => { if (u.buffs) u.buffs = u.buffs.filter(b => b.name !== name); };
  const P = H.Battle.prototype, base = {};
  for (const k of ['fivesStart', 'fivesWave', 'fivesTech', 'fivesFx', 'fivesPreview', 'fivesAbility', 'fivesDmg', 'fivesHit', 'fivesAfter', 'fivesUlt', 'fivesTurn', 'fivesAuto', 'fivesVuln']) base[k] = P[k];

  Object.assign(P, {
    thErudites() { return this.allies.filter(a => a.path === 'erudition').length; },

    thAdd(h, e, n) {
      if (!alive(e) || e.side !== 'enemy') return 0;
      const before = stacks(e), got = Math.min(T.thCap, before + n) - before;
      e.flags.th = before + got;
      if (got > 0 && bon(this, h, 'a6')) h.flags.thAnswer = Math.min(T.thAnswer, (h.flags.thAnswer || 0) + got);
      return got;
    },

    thSweep(h) {
      for (const e of this.living) if (!e.flags.thSeen) { e.flags.thSeen = true; this.thAdd(h, e, 1); }
    },

    thWaveIn(h) {
      this.thSweep(h);
      const bigs = this.living.filter(big), pick = this.rng.pick(bigs.length ? bigs : this.living);
      if (!pick) return;
      this.thAdd(h, pick, T.thWave);
      this.push({ t: 'status', u: pick, text: 'Интерпретация +' + T.thWave, debuff: true });
    },

    thEnter(h) {
      h.flags.thInsp = eid(this, h, 2) ? 1 : 0;
      h.flags.thAnswer = 0;
      const team = this.thErudites();
      if (team >= 2 && bon(this, h, 'a4')) for (const a of this.allies) a.buffs.push({ s: 'critD', v: T.thCritD, turns: 999, name: 'Письмо из-за горизонта событий', perm: true });
      if (eid(this, h, 4)) for (const a of this.allies) if (a.path === 'erudition') a.buffs.push({ s: 'spdP', v: T.thE4Spd, turns: 999, name: 'Шестнадцатый ключ', perm: true });
      if (eid(this, h, 6)) h.buffs.push({ s: 'resPen', v: T.thE6Pen, turns: 999, name: 'Ответ, словно сладкая приманка', perm: true });
      this.thWaveIn(h);
    },

    thWaves(main) {
      const out = [[main]];
      let cur = [main];
      for (let i = 0; i < 2; i++) {
        const next = new Set(cur);
        for (const t of cur) for (const a of this.adjacent(this.living, t)) next.add(a);
        cur = [...next];
        out.push(cur);
      }
      return out;
    },

    thCount(h, main, plus) {
      const own = Math.min(T.thCap, stacks(main) + plus);
      if (!eid(this, h, 1)) return own;
      return own + T.thE1Share * this.adjacent(this.living, main).reduce((a, t) => Math.max(a, stacks(t)), own);
    },

    thEnd(h, f, t, main, count) {
      const k = (this.thErudites() >= 2 ? 2 : 1) * (this.traceTalent ? this.traceTalent(h) : 1) * count;
      return f.end + (t === main ? T.thBonusMain : T.thBonusOther) * k;
    },

    thExtra(h, count) { return count >= T.thCap && bon(this, h, 'a2') ? T.thFull : 0; },

    thStrike(f, src, R, hitSet, kind) {
      const main = R.main;
      if (!main) return;
      const waves = this.thWaves(main);
      this.thAdd(src, main, 1);
      const count = f.enh ? this.thCount(src, main, 0) : 0, extra = f.enh ? this.thExtra(src, count) : 0;
      if (f.enh) src.flags.thInsp = Math.max(0, (src.flags.thInsp || 0) - 1);
      for (const list of waves) for (const t of list) {
        if (!alive(t)) continue;
        this.hit(src, t, f.m, { kind, tough: f.tough, extraBonus: extra, main: t === main });
        hitSet.add(t);
      }
      if (!f.enh) return;
      for (const t of this.living.slice()) {
        if (!alive(t)) continue;
        this.hit(src, t, this.thEnd(src, f, t, main, count), { kind, tough: f.tough, extraBonus: extra, main: t === main });
        hitSet.add(t);
      }
      if (alive(main)) main.flags.th = eid(this, src, 1) ? T.thE1Reset : 1;
      if (eid(this, src, 2)) src.flags.advanceAfter = (src.flags.advanceAfter || 0) + T.thE2Advance;
    },

    thUltM(h, f) {
      const answer = bon(this, h, 'a6') ? (h.flags.thAnswer || 0) * T.thAnswerM : 0, e6 = eid(this, h, 6) ? T.thE6Ult[Math.min(3, this.living.length)] || 0 : 0;
      return f.m + answer + e6;
    },

    thRedo() {
      const list = this.living.slice(), vals = list.map(stacks).sort((a, b) => b - a);
      list.sort((a, b) => Number(big(b)) - Number(big(a)));
      list.forEach((e, i) => { e.flags.th = vals[i]; });
    },

    thAttacked(h, u, hits) {
      if (!hits.length) return;
      const live = hits.filter(alive);
      if (bon(this, h, 'a2')) {
        for (const t of live) this.thAdd(h, t, 1);
        const floor = bon(this, h, 'a4') && this.thErudites() >= 2 ? T.thMinTargets : 0;
        h.energy = Math.min(h.maxEnergy, h.energy + T.thEnergy * Math.min(T.thEnergyMax, Math.max(hits.length, floor)));
      }
      if (bon(this, h, 'a4') && live.length) {
        const top = live.reduce((a, b) => (stacks(b) > stacks(a) ? b : a));
        this.thAdd(h, top, (u.owner || u).path === 'erudition' ? 3 : 1);
      }
    },

    trTeam() { return [...this.allies, ...this.summons]; },

    trNumOn(tr, v) {
      tr.flags.trNum = T.trNumTurns;
      tr.flags.trNumV = v;
      this.trNumSync(tr);
      this.push({ t: 'status', u: tr, text: NUM });
    },

    trNumSync(tr) {
      const on = alive(tr) && tr.flags.trNum > 0;
      for (const a of this.trTeam()) {
        dropName(a, NUM);
        if (!on || !a.buffs) continue;
        a.buffs.push({ s: 'resPen', v: tr.flags.trNumV, turns: 999, name: NUM, perm: true });
        if (eid(this, tr, 4)) a.buffs.push({ s: 'defIgnore', v: T.trE4Def, turns: 999, name: NUM, perm: true });
      }
    },

    trZoneOn(tr) { return !!tr && alive(tr) && tr.flags.trZone > 0; },

    trZoneOpen(tr, f) {
      this.trGlassOff(tr);
      tr.flags.trZone = T.trZoneTurns;
      tr.flags.trVuln = f.vuln;
      tr.flags.trAdd = f.add;
      tr.flags.trUsed = {};
      if (bon(this, tr, 'a4')) {
        const add = Math.round(this.allies.filter(alive).reduce((a, x) => a + x.maxHp, 0) * T.trHpShare);
        tr.maxHp += add;
        tr.hp += add;
        tr.buffs.push({ s: 'survival', v: 0, turns: 999, name: GLASS, hpAdd: add, perm: true });
        this.push({ t: 'heal', u: tr, v: add, hp: tr.hp });
      }
      this.push({ t: 'status', u: tr, text: 'Зона' });
    },

    trGlassOff(tr) {
      const b = tr.buffs.find(x => x.name === GLASS);
      if (b) this.dropHp(tr, b);
      dropName(tr, GLASS);
    },

    trZoneAdd(tr, t, n, total) {
      const m = tr.flags.trAdd * (eid(this, tr, 2) ? T.trE2Add : 1), times = n + (eid(this, tr, 2) ? 1 : 0);
      const prev = this.acting;
      this.acting = tr;
      for (let i = 0; i < times && alive(t); i++) this.hit(tr, t, 0, { hpM: m, kind: 'add', tough: 0, label: 'Зона' });
      if (eid(this, tr, 1) && total > 0 && alive(t)) this.hit(tr, t, 0, { raw: total * T.trE1True, kind: 'add', tough: 0, label: 'Истинный урон' });
      this.acting = prev;
    },

    trAttacked(tr, u, hits, total) {
      if (!hits.length) return;
      if (u !== tr && bon(this, tr, 'a6')) this.gainEnergy(tr, T.trAllyEnergy * hits.length);
      if (!this.trZoneOn(tr)) return;
      const live = hits.filter(alive);
      if (!live.length) return;
      this.trZoneAdd(tr, live.reduce((a, b) => (b.hp > a.hp ? b : a)), hits.length, total);
    },

    trFollow(tr) {
      if (this.over || !alive(tr) || !this.living.length) return;
      const prev = this.acting, e6 = eid(this, tr, 6) ? T.trE6Bonus : 0, m = T.trFollowHp * (this.traceTalent ? this.traceTalent(tr) : 1), list = this.living.slice();
      this.acting = tr;
      this.push({ t: 'act', u: tr, name: BUSY, kind: 'follow' });
      for (const t of list) if (alive(t)) this.hit(tr, t, 0, { hpM: m, kind: 'follow', tough: 5, label: BUSY, extraBonus: e6 });
      this.gainEnergy(tr, T.trFollowEnergy);
      if (bon(this, tr, 'a2')) {
        tr.flags.trLamb = tr.buffs.some(b => b.name === LAMB) ? Math.min(T.trLambMax, (tr.flags.trLamb || 0) + 1) : 1;
        this.addBuff(tr, { s: 'dmgP', v: T.trLamb * tr.flags.trLamb, turns: T.trLambTurns, name: LAMB }, true);
      }
      if (this.su) this.bless('follow', { u: tr, hits: list });
      this.acting = prev;
      this.cleanup();
    },

    tfPresage(u) {
      u.flags.tfPresage = cf(u, 'timeflower', 3);
      const v = cf(u, 'timeflower', 4);
      for (const a of this.allies) { dropName(a, PRESAGE); a.buffs.push({ s: 'critD', v, turns: 999, name: PRESAGE, perm: true }); }
      this.push({ t: 'status', u, text: PRESAGE });
    },

    fivesStart() {
      base.fivesStart.call(this);
      const h = mate(this, 'theherta'), tr = mate(this, 'tribbie');
      if (h) this.thEnter(h);
      if (tr) {
        tr.flags.trUsed = {};
        if (bon(this, tr, 'a6')) this.gainEnergy(tr, T.trStartEnergy);
      }
      for (const a of this.allies) {
        const n = cf(a, 'timeflower', 5);
        if (n && alive(a)) { this.gainEnergy(a, n); this.tfPresage(a); }
      }
    },

    fivesWave() {
      base.fivesWave.call(this);
      const h = mate(this, 'theherta');
      if (h) this.thWaveIn(h);
    },

    fivesTech(fx, src) {
      if (fx === 'thTech') { this.addBuff(src, { s: 'atkP', v: T.thTechAtk, turns: 2, name: 'Взглянем на кое-что хорошее' }); return true; }
      if (fx === 'trTech') { this.trNumOn(src, this.abilityFor(src, 'skill').ab.fx[0].v); return true; }
      return base.fivesTech.call(this, fx, src);
    },

    fivesFx(f, actor, src, R, hitSet, kind) {
      switch (f.k) {
        case 'thStrike': this.thStrike(f, src, R, hitSet, kind); return true;
        case 'thRedo': this.thRedo(); return true;
        case 'thBurst':
          for (const t of this.living.slice()) { if (!alive(t)) continue; this.hit(src, t, this.thUltM(src, f), { kind, tough: f.tough, main: true }); hitSet.add(t); }
          return true;
        case 'thInspire':
          src.flags.thInsp = Math.min(T.thInsp, (src.flags.thInsp || 0) + (eid(this, src, 2) ? 2 : 1));
          this.push({ t: 'status', u: src, text: 'Вдохновение ' + src.flags.thInsp });
          return true;
        case 'trNum': this.trNumOn(src, f.v); return true;
        case 'trZone': this.trZoneOpen(src, f); return true;
      }
      return base.fivesFx.call(this, f, actor, src, R, hitSet, kind);
    },

    fivesPreview(f, src, actor, R, addHit, k) {
      if (f.k === 'thStrike' && R.main) {
        const count = f.enh ? this.thCount(src, R.main, 1) : 0, extra = f.enh ? this.thExtra(src, count) : 0;
        for (const list of this.thWaves(R.main)) for (const t of list) addHit(src, t, f.m, { kind: k, tough: f.tough, extraBonus: extra });
        if (f.enh) for (const t of this.living) addHit(src, t, this.thEnd(src, f, t, R.main, count), { kind: k, tough: f.tough, extraBonus: extra });
      }
      if (f.k === 'thBurst') for (const t of this.living) addHit(src, t, this.thUltM(src, f), { kind: k, tough: f.tough });
      base.fivesPreview.call(this, f, src, actor, R, addHit, k);
    },

    fivesAbility(u, kind) {
      if (kind === 'skill' && u.charId === 'theherta' && (u.flags.thInsp || 0) > 0) return { ab: u.kit.enhanced, kind: 'skill' };
      return base.fivesAbility.call(this, u, kind);
    },

    fivesDmg(src, tgt, o) {
      const p = cf(src, 'undeniable', 2);
      return base.fivesDmg.call(this, src, tgt, o) + (p && (o.kind === 'ult' || (o.kind === 'skill' && src.buffs.some(b => b.name === MIND))) ? p : 0);
    },

    fivesVuln(src, tgt, o) {
      const tr = tgt.side === 'enemy' ? mate(this, 'tribbie') : null;
      return base.fivesVuln.call(this, src, tgt, o) + (this.trZoneOn(tr) ? tr.flags.trVuln : 0);
    },

    fivesHit(src, tgt, o, dmg, before) {
      if (tgt && tgt.charId === 'tribbie' && !alive(tgt)) { tgt.flags.trNum = 0; tgt.flags.trZone = 0; this.trNumSync(tgt); this.trGlassOff(tgt); }
      if (src && src.side === 'ally' && tgt && tgt.side === 'enemy' && !o.isDot && o.kind !== 'add') {
        if (this.trActN !== this.actN) { this.trActN = this.actN; this.trDealt = 0; }
        this.trDealt += dmg;
      }
      if (src && tgt && tgt.side === 'enemy' && !alive(tgt) && stacks(tgt) > 0) {
        const n = stacks(tgt), rest = this.living.filter(e => e !== tgt && alive(e)), bigs = rest.filter(big), to = this.rng.pick(bigs.length ? bigs : rest);
        tgt.flags.th = 0;
        if (to) to.flags.th = Math.min(T.thCap, stacks(to) + n);
      }
      base.fivesHit.call(this, src, tgt, o, dmg, before);
      const h = src && src.side === 'ally' ? mate(this, 'theherta') : null;
      if (h && tgt && tgt.side === 'enemy' && o.kind === 'follow' && !o.isDot && tgt.flags.thAct !== this.actN) {
        tgt.flags.thAct = this.actN;
        this.thAttacked(h, src, [tgt]);
      }
      const tr = src && src.side === 'ally' && o.kind === 'follow' && !o.isDot ? mate(this, 'tribbie') : null;
      if (tr && tgt && tgt.side === 'enemy') this.trAttacked(tr, src, [tgt], dmg);
      if (src && o.kind === 'follow' && cf(src, 'timeflower', 2) && src.flags.tfAct !== this.actN) {
        src.flags.tfAct = this.actN;
        this.gainEnergy(src, cf(src, 'timeflower', 2));
        this.tfPresage(src);
      }
    },

    fivesAfter(u, kind, hits) {
      base.fivesAfter.call(this, u, kind, hits);
      const h = kind === 'contact' ? null : mate(this, 'theherta'), tr = kind === 'contact' ? null : mate(this, 'tribbie');
      if (h) this.thAttacked(h, u, hits);
      if (tr) this.trAttacked(tr, u, hits, this.trActN === this.actN ? this.trDealt : 0);
    },

    fivesUlt(u) {
      base.fivesUlt.call(this, u);
      const tr = mate(this, 'tribbie');
      const used = tr ? tr.flags.trUsed || (tr.flags.trUsed = {}) : null;
      if (tr && u !== tr && !used[u.key]) { used[u.key] = true; this.trFollow(tr); }
      if (tr && u === tr && eid(this, tr, 6)) this.trFollow(tr);
      const p = cf(u, 'undeniable', 2);
      if (!p || this.over) return;
      this.addBuff(u, { s: 'mind', v: 0, turns: cf(u, 'undeniable', 3), name: MIND }, true);
      if ((u.kit.ult.cost || u.maxEnergy) >= cf(u, 'undeniable', 4) && this.sp < T.spMax) { this.sp++; this.push({ t: 'status', u, text: MIND + ': +1 очко навыка' }); }
    },

    fivesTurn(u) {
      base.fivesTurn.call(this, u);
      const h = mate(this, 'theherta');
      if (h) this.thSweep(h);
      if (u.charId === 'tribbie') {
        if (u.flags.trNum > 0 && --u.flags.trNum === 0) this.trNumSync(u);
        if (u.flags.trZone > 0 && --u.flags.trZone === 0) this.trGlassOff(u);
      }
      if (u.flags && u.flags.tfPresage > 0 && --u.flags.tfPresage === 0) for (const a of this.allies) dropName(a, PRESAGE);
      const num = mate(this, 'tribbie');
      if (num && num.flags.trNum > 0) this.trNumSync(num);
    },

    fivesAuto(u) {
      if (u.charId === 'tribbie') {
        if (this.sp >= 1 && (u.flags.trNum || 0) <= 1) return this.act('skill', u);
        return this.act('basic', this.autoTarget(u));
      }
      if (u.charId !== 'theherta') return base.fivesAuto.call(this, u);
      const tgt = this.autoTarget(u), top = this.living.reduce((a, b) => (stacks(b) > stacks(a) ? b : a));
      if ((u.flags.thInsp || 0) > 0 && this.sp >= 1) return this.act('skill', top);
      return this.act(this.sp >= 3 ? 'skill' : 'basic', tgt);
    }
  });

  for (const [id, kit] of Object.entries(KITS)) H.labPut(H.CHARS, id, kit);
  for (const [id, cone] of Object.entries(CONES)) H.labPut(H.CONES, id, cone, cone.sig);
  H.coneInit(CONES);

  H.LAB = { KITS, CONES, FX, IDS: Object.keys(KITS), CONE_IDS: Object.keys(CONES) };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
