(function (H) {
  'use strict';
  const T = H.TUNING;
  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const alive = u => u && !u.dead && !u.gone && u.hp > 0;

  const FOES = {
    phantylia: E({ name: 'Фантилия Неумирающая', fam: 'boss', shape: 'phantylia', col: ['#2a3a2a', '#9af0b0'], boss: true, hp: 11, atk: 1.9, spd: 120, tough: 160, weak: ['elec', 'wind', 'imag'], resist: ['phys', 'fire', 'ice', 'quant'], exp: 14, credits: 12, noContact: true,
      skills: [{ n: 'Аччата: Формирующий ветер', t: 'single', m: 1.5, e: 'wind' }, { n: 'Очищающий взмах', t: 'all', m: 0.9, e: 'wind' }, { n: 'Сплетение корней', t: 'single', m: 1.4, e: 'wind', fx: [{ k: 'delay', v: 0.3 }] }, { n: 'Буйное цветение', t: 'summon', summon: ['lotus_ab'], max: 2 }],
      pat: [0, 3, 1, 2, 0, 1, 3, 2] }),
    phantylia2: E({ name: 'Фантилия Неумирающая', fam: 'boss', shape: 'phantylia', col: ['#1e1630', '#c08aff'], boss: true, hp: 14, atk: 2.1, spd: 120, tough: 180, weak: ['elec', 'wind', 'imag'], resist: ['phys', 'fire', 'ice', 'quant'], exp: 16, credits: 14, noContact: true, phase2: true,
      skills: [{ n: 'Аччата: Ревущий гром', t: 'single', m: 1.8, e: 'elec' }, { n: 'Кальпа нисходит', t: 'lock', next: 2, text: 'Фантилия захватила цель! Лотосы Разрушения расцветают. Пробейте или уничтожьте их!' }, { n: 'Звездопад, лунный плач', t: 'all', m: 1.3, e: 'elec', lockBonus: 1.3 }, { n: 'Сплетение корней', t: 'single', m: 1.4, e: 'imag', fx: [{ k: 'delay', v: 0.3 }] }],
      pat: [0, 3, 1, 0, 3, 1] }),
    lotus_ab: E({ name: 'Лотос Изобилия', fam: 'lotus', shape: 'lotus_ab', col: ['#2a5a3a', '#ffb0d0'], hp: 1.1, atk: 0.6, spd: 90, tough: 20, weak: ['wind', 'imag'], exp: 0.5, credits: 0.5, noContact: true, deathSp: 2,
      skills: [{ n: 'Сансара', t: 'self', fx: [{ k: 'spDrain', v: 1, self: true }] }, { n: 'Восстановление', t: 'self', fx: [{ k: 'healSelf', m: 0.5, self: true }] }],
      pat: [0, 1] }),
    lotus_de: E({ name: 'Лотос Разрушения', fam: 'lotus', shape: 'lotus_de', col: ['#3a0e1a', '#ff4a6a'], hp: 2.4, atk: 0.9, spd: 96, tough: 60, weak: ['elec', 'quant', 'imag'], exp: 0.8, credits: 0.8, noContact: true, havoc: true, deathEnergy: 10,
      skills: [{ n: 'Чёрная сеть праны', t: 'single', m: 0.8, e: 'elec', fx: [{ k: 'debuff', s: 'dmgDealtDown', v: 0.15, turns: 2, chance: 1, name: 'Высасывание праны' }] }, { n: 'Опустошение', t: 'havoc', m: 0.3, e: 'elec' }],
      pat: [0] }),
    skaracabaz_e: E({ name: 'Скаракабаз (синтетический)', fam: 'boss', shape: 'swarmking', col: ['#141c3a', '#40e0d0'], boss: true, hp: 11, atk: 1.9, spd: 104, tough: 180, weak: ['phys', 'ice', 'imag'], resist: ['quant'], exp: 14, credits: 12, noContact: true,
      skills: [{ n: 'Пушка Короля роя', t: 'single', m: 1.6, e: 'quant' }, { n: 'Ядовитое сияние', t: 'single', m: 1.4, e: 'quant', fx: [{ k: 'delay', v: 0.2 }] }, { n: 'Луч пиролиза', t: 'blast', m: 1.8, e: 'quant' }, { n: 'Панцирь порождённого потомства', t: 'self', fx: [{ k: 'multiply', self: true }] }, { n: 'Нашествие', t: 'summon', summon: ['gnawsting'], max: 3 }],
      pat: [0, 3, 1, 4, 2, 3, 0, 1] }),
    skaracabaz_e2: E({ name: 'Скаракабаз (синтетический)', fam: 'boss', shape: 'swarmking', col: ['#141c3a', '#40e0d0'], boss: true, hp: 15, atk: 2.0, spd: 104, tough: 200, weak: ['phys', 'ice', 'imag'], resist: ['quant'], exp: 16, credits: 14, noContact: true, phase2: true,
      skills: [{ n: 'Пушка Короля роя', t: 'single', m: 1.6, e: 'quant' }, { n: 'Ядовитое сияние', t: 'single', m: 1.4, e: 'quant', fx: [{ k: 'delay', v: 0.2 }] }, { n: 'Панцирь взращённой беды', t: 'charge', next: 3, text: 'Скаракабаз копит рой в панцире! Пробейте его, пока он размножается!', fx: [{ k: 'multiply', self: true }] }, { n: 'Яйцо коллапсирующей звезды', t: 'all', m: 2.2, e: 'quant' }],
      pat: [0, 1, 2, 0, 1, 2] })
  };
  for (const [id, e] of Object.entries(FOES)) e.id = id;
  Object.assign(H.ENEMIES, FOES);

  const ECHOES = [
    { id: 'cx_echo_ochema', name: 'Эхо войны: Семя бессмертия', cost: 30, boss: 'phantylia', waves: [['phantylia', 'lotus_ab'], ['phantylia2', 'lotus_de', 'lotus_de']], music: 'boss', need: 'express_intro', reward: 'echo', mat: 'echo_ochema', text: 'Фантилия Неумирающая по записям Экспресса о Лофу. Покаяние вечного ложного тела, три реликвии и 40 нефрита за победу. Награды Эха войны: три в час.' },
    { id: 'cx_echo_borehole', name: 'Эхо войны: Старые кошмары червоточины', cost: 30, boss: 'skaracabaz_e', waves: [['skaracabaz_e', 'gnawsting'], ['skaracabaz_e2', 'juvsting']], music: 'boss', need: 'first_sec_boss', reward: 'echo', mat: 'echo_borehole', text: 'Скаракабаз из Изолированной зоны, без срока жизни клона. Прошлые бедствия червоточины, три реликвии и 40 нефрита за победу. Награды Эха войны: три в час.' }
  ];
  for (const c of ECHOES) if (!H.CALYX.some(x => x.id === c.id)) H.CALYX.push(c);
  if (H.TRACE_FIRST_CLEAR) H.TRACE_FIRST_CLEAR.sec_boss = 'echo_borehole';
  H.ITEMS.echo_ochema.text = 'Продвинутый материал для Следов. Эхо войны: Семя бессмертия.';
  H.ITEMS.echo_borehole.text = 'Продвинутый материал для Следов. Эхо войны: Старые кошмары червоточины.';
  for (const id of ['echo_doom', 'echo_lament']) { const c = H.CALYX.find(x => x.mat === id); if (c) H.ITEMS[id].text = 'Продвинутый материал для Следов. ' + c.name + '.'; }

  if (T.multiplyRed == null) T.multiplyRed = 0.3;

  const baseOnZero = H.Battle.prototype.onZero, basePick = H.Battle.prototype.pickSkill;

  Object.assign(H.Battle.prototype, {
    pickSkill(u) {
      const d = u.data;
      if (d && d.havoc && this.living.some(e => e !== u && e.lockTarget && alive(e.lockTarget))) return d.skills.find(s => s.t === 'havoc');
      return basePick.call(this, u);
    },

    onZero(tgt, src) {
      baseOnZero.call(this, tgt, src);
      if (tgt.side !== 'enemy' || alive(tgt) || tgt.flags.echoDead) return;
      const d = tgt.data || {};
      tgt.flags.echoDead = true;
      if (d.boss && d.shape === 'phantylia') for (const e of this.living) if (e.data.fam === 'lotus') { e.dead = true; e.rewarded = true; this.push({ t: 'kill', u: e }); }
      if (d.deathSp) { this.sp = Math.min(T.spMax, this.sp + d.deathSp); this.push({ t: 'text', text: 'Мокша: лотос возвращает ' + d.deathSp + ' очка навыка.' }); }
      if (d.deathEnergy) {
        for (const a of this.livingAllies) this.gainEnergy(a, d.deathEnergy);
        const boss = this.living.find(e => e.data.boss);
        if (boss) this.hit(tgt, boss, 0, { raw: boss.maxHp * 0.04, e: 'imag', label: 'Распад лотоса' });
      }
    },

    echoSelfFx(u, f) {
      if (f.k === 'spDrain') { this.sp = Math.max(0, this.sp - f.v); this.push({ t: 'text', text: 'Сансара: команда теряет очко навыка.', warn: true }); return true; }
      if (f.k === 'healSelf') { const v = Math.round(u.maxHp * f.m); u.hp = Math.min(u.maxHp, u.hp + v); this.push({ t: 'heal', u, v }); return true; }
      if (f.k === 'multiply') {
        u.flags.multiply = true;
        this.addBuff(u, { s: 'vuln', v: -T.multiplyRed, turns: 99, name: 'Размножение' }, true);
        this.push({ t: 'text', text: u.name + ' размножается: урон по нему ниже, каждый удар выпускает жука. Пробейте его!', warn: true });
        return true;
      }
      return false;
    },

    echoTurn(u) {
      if (!u.flags.multiply) return;
      u.flags.multiply = false;
      u.buffs = u.buffs.filter(b => b.name !== 'Размножение');
    },

    echoSkill(u, sk, hitOne) {
      if (sk.t !== 'havoc') return false;
      const boss = this.living.find(e => e !== u && e.lockTarget && alive(e.lockTarget));
      const t = boss ? boss.lockTarget : this.pickTarget(u);
      if (t) this.hit(u, t, 0, { raw: t.maxHp * sk.m, e: sk.e, label: sk.n });
      return true;
    },

    echoHit(src, tgt) {
      if (!tgt.flags.multiply || src.side !== 'ally' || !alive(tgt)) return;
      if (this.living.length >= 4) return;
      this.spawnFoe('gnawsting', Math.max(1, tgt.lvl - 2), tgt);
    },

    echoBreak(tgt) {
      if (!tgt.flags.multiply) return;
      this.echoTurn(tgt);
      for (const e of this.living) if (e !== tgt && !e.broken && e.data.fam === 'swarm') { e.tough = 0; this.doBreak(this.allies.find(alive) || tgt, e, 'imag'); }
      this.push({ t: 'text', text: 'Панцирь треснул: рой оглушён.' });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
