(function (A) {
  'use strict';
  const D = A.DUELS = {};

  const end = (b, reason, text, ev) => {
    b.over = 'end';
    b.endReason = reason;
    ev.push({ type: 'duelEnd', reason, text });
  };

  const striking = id => {
    const sk = A.SKILLS[id];
    return !!sk && !!sk.type && sk.target !== 'self' && sk.target !== 'none' && id !== 'talk';
  };

  D.VOS_LINES = [
    [null, 'Эйла, я не пришёл с тобой драться.'],
    [1, 'На Рилоте ты была совсем маленькая. Ты позвала, и я услышал.'],
    [2, 'Толм проверил тебя для Храма, потому что я его попросил.'],
    [4, 'Тебе было десять, когда я взял тебя в падаваны. Ты стояла очень прямо.'],
    [5, 'Видишь камень? Сердце огня. Сиань отдала его мне, чтобы я вернул тебе.'],
    [6, 'Т\'да теперь часть Силы. Ты сама это поняла, не я.'],
    [10, 'На Татуине ты ходила так тихо, что даже я тебя не слышал.'],
    [3, 'Толм учил тебя восемь лет. Он помнит каждый твой урок.'],
    [7, 'Солибус IV. Тайну лоди мы разгадали вдвоём.'],
    [8, 'Ксоман III. Ты прыгала с лодки на лодку, а я ругался.'],
    [9, 'Огден-Минор. Тербисты. Ты тогда меня вытащила.'],
    [null, 'Я не подниму на тебя клинок.']
  ];

  const nextLine = b => {
    const L = D.VOS_LINES;
    while (b.lineAt < L.length) {
      const [frag, text] = L[b.lineAt++];
      if (frag === null || A.Memory.has(b.S, frag)) return { frag, text };
    }
    return { frag: null, text: L[L.length - 1][1] };
  };

  D.cantina = {
    turns: 6,
    plan(b) {
      return b.rnd01() < 0.8 ? { skill: 'vblade', target: 'aayla' } : { skill: 'vdefend' };
    },
    afterAct(b, u, id, ev) {
      if ((b.turns.aayla || 0) >= D.cantina.turns && !b.over) end(b, 'call', 'Зов Каркко: задание важнее мести. Эйла отступает.', ev);
    }
  };

  D.traa = {
    turns: 5,
    start(b) {
      for (const h of b.heroes()) if (h.id !== 'aayla') h.status.rooted = 99;
    },
    plan(b, u) {
      u.cycle++;
      return { skill: ['vines', 'vines', 'hold', 'vines'][(u.cycle - 1) % 4], target: 'aayla' };
    },
    afterAct(b, u, id, ev) {
      if ((b.turns.aayla || 0) >= D.traa.turns && !b.over) end(b, 'retreat', 'Эйла уводит свиту в холмы. Т\'ра Саа не преследует.', ev);
    }
  };

  D.sanctum = {
    lowerFrom: 3,
    lowerAt: 50,
    start(b) {
      b.will = Math.max(0, 100 - 8 * (b.S.memory || []).length);
      b.lineAt = 0;
    },
    plan() {
      return { skill: 'vdefend' };
    },
    commands(b, u, out) {
      if (u.id !== 'aayla') return;
      const ready = (b.turns.aayla || 0) >= D.sanctum.lowerFrom && b.will <= D.sanctum.lowerAt;
      out.unshift({ id: 'lower', name: A.SKILLS.lower.name, menu: 'stance', fp: 0, tempo: 0, enabled: ready, why: ready ? null : 'воля Каркко ещё держит', about: A.SKILLS.lower.about });
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      if (striking(id)) {
        b.will = Math.min(100, b.will + 5);
        b.darkDelta += 2;
      } else b.will = Math.max(0, b.will - 15);
      ev.push({ type: 'will', value: b.will });
      const line = nextLine(b);
      ev.push({ type: 'line', who: 'vos', text: line.text, frag: line.frag });
    },
    perform(b, u, id, ev) {
      if (id !== 'lower') return false;
      end(b, 'lower', 'Эйла опускает клинок.', ev);
      return true;
    }
  };

  D.karkko = {
    threeFrom: 6,
    saluteAt: 0.25,
    start(b) {
      b.three = false;
    },
    plan(b, u) {
      const vos = b.heroes()[0];
      if (!vos) return { skill: 'wait' };
      if (u.key === 'illusion') return { skill: 'dread', target: vos.id };
      if (u.hidden) {
        u.hiddenFor--;
        if (u.hiddenFor <= 0 || !b.enemies().some(e => e.fake)) return { skill: 'reappear', target: vos.id };
        return { skill: 'wait' };
      }
      u.cycle++;
      const step = ['ksaber', 'kbolt', 'ksaber', 'vanish'][(u.cycle - 1) % 4];
      return step === 'vanish' ? { skill: 'vanish' } : { skill: step, target: vos.id };
    },
    act(b, u, a, ev) {
      if (a.skill === 'vanish') {
        u.hidden = true;
        u.hiddenFor = 2;
        const made = [];
        for (const slot of [0, 2]) if (b.freeSlot('front', slot) === slot) made.push(b.addEnemy('illusion', 'front', slot));
        for (const e of made) e.next = u.next + b.delay(e) * 0.4;
        ev.push({ type: 'vanish', who: u.id, illusions: made.map(e => e.id) });
        return true;
      }
      if (a.skill === 'reappear') {
        D.karkko.reveal(b, ev, false);
        b.enemyHit(u, b.unit(a.target), 'kslam', ev);
        return true;
      }
      return false;
    },
    reveal(b, ev, byRead) {
      const k = b.units.find(e => e.key === 'karkko');
      if (k) k.hidden = false;
      for (const e of b.enemies().filter(x => x.fake)) e.gone = 'dispelled';
      ev.push({ type: 'unveil', who: k && k.id, byRead });
    },
    afterAct(b, u, id, ev) {
      if (id === 'read' && b.units.some(e => e.key === 'karkko' && e.hidden)) D.karkko.reveal(b, ev, true);
      if (!b.three && (b.turns.vos || 0) >= D.karkko.threeFrom) {
        b.three = true;
        for (const h of b.heroes()) {
          h.mig = Math.round(h.mig * 1.5);
          h.sta = Math.round(h.sta * 1.5);
        }
        ev.push({ type: 'three' });
      }
    },
    check(b, ev) {
      const k = b.units.find(e => e.key === 'karkko');
      if (!k || b.over) return false;
      if (k.hp > 0 && k.hp <= k.maxhp * D.karkko.saluteAt) {
        k.gone = 'dead';
        k.hp = 0;
        for (const e of b.enemies().filter(x => x.fake)) e.gone = 'dispelled';
        ev.push({ type: 'salute', who: k.id });
        b.over = 'win';
        b.rewards = b.reward();
        ev.push({ type: 'victory', rewards: b.rewards });
        return true;
      }
      return false;
    }
  };

  D.challat = {
    sealFrom: 9,
    acted(b) {
      return (b.turns.tholme || 0) + (b.turns.plo || 0);
    },
    status(b) {
      const left = D.challat.sealFrom - D.challat.acted(b);
      return left > 0 ? 'Квай-Гон выводит мальчиков: ещё ' + left : 'Мальчики вышли. Проход можно закрыть';
    },
    spawn(b, ev, after) {
      const row = b.freeSlot('front') !== null ? 'front' : 'back', slot = b.freeSlot(row);
      if (slot === null) return null;
      const e = b.addEnemy('challat', row, slot);
      e.next = after + b.delay(e) * 0.3;
      ev.push({ type: 'summon', who: null, target: e.id, text: 'новый рой' });
      return e;
    },
    plan(b) {
      const seen = b.heroes().filter(h => !h.hidden);
      if (!seen.length) return { skill: 'wait' };
      return { skill: 'swarmbite', target: seen[Math.floor(b.rnd01() * seen.length)].id };
    },
    commands(b, u, out) {
      const ready = D.challat.acted(b) >= D.challat.sealFrom;
      out.unshift({ id: 'seal', name: A.SKILLS.seal.name, menu: 'force', fp: 0, tempo: 0, enabled: ready, why: ready ? null : 'мальчики ещё в пещере', about: A.SKILLS.seal.about });
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      const n = D.challat.acted(b);
      if (n % 2 === 0 && b.enemies().length < 4) D.challat.spawn(b, ev, u.next);
    },
    perform(b, u, id, ev) {
      if (id !== 'seal') return false;
      end(b, 'seal', 'Толм, Пло Кун и Квай-Гон Силой закрывают проход. Пожиратели остаются в пещере.', ev);
      return true;
    },
    check(b, ev) {
      if (b.over || b.enemies().length || !b.heroes().length) return false;
      const t = Math.max(...b.heroes().map(h => h.next));
      D.challat.spawn(b, ev, t);
      D.challat.spawn(b, ev, t);
      return false;
    }
  };

  const morgukaiPlan = (b, u) => {
    const seen = b.heroes().filter(h => !h.hidden);
    if (!seen.length) return { skill: 'wait' };
    u.cycle++;
    const tgt = u.key === 'tsyr' ? seen.find(h => h.id === 'aayla') || seen[0] : seen[Math.floor(b.rnd01() * seen.length)];
    return { skill: u.cycle % 3 === 0 ? 'staffsweep' : 'staff', target: tgt.id };
  };

  D.night = {
    turns: 5,
    status(b) {
      const left = D.night.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Стража бежит на шум: ещё ' + left : '';
    },
    plan: morgukaiPlan,
    afterAct(b, u, id, ev) {
      if ((b.turns.aayla || 0) >= D.night.turns && !b.over) end(b, 'fled', 'Стража Секура сбегается со всего дома. Моргукаи уходят в окно, мальчик у Цира на плече.', ev);
    }
  };

  D.wastes = {
    turns: 4,
    status(b) {
      const left = D.wastes.turns - (b.turns.aayla || 0);
      return left > 0 ? 'До реки лавы: ещё ' + left : '';
    },
    plan: morgukaiPlan,
    afterAct(b, u, id, ev) {
      if ((b.turns.aayla || 0) >= D.wastes.turns && !b.over) end(b, 'run', 'Вос кричит: «К реке!» Джедаи прорываются к лаве.', ev);
    }
  };

  D.axrx = {
    throwAt: 0.5,
    start(b) {
      b.thrown = false;
    },
    plan(b, u) {
      const a = b.heroes()[0];
      if (!a) return { skill: 'wait' };
      u.cycle++;
      return { skill: ['scalpel', 'inject', 'scalpel', 'shockfield'][(u.cycle - 1) % 4], target: a.id };
    },
    afterAct(b, u, id, ev) {
      const x = b.units.find(e => e.key === 'axrx');
      if (b.thrown || b.over || !x || x.hp <= 0 || x.hp > x.maxhp * D.axrx.throwAt) return;
      b.thrown = true;
      ev.push({ type: 'line', who: 'tholme', text: 'Толм встаёт с пола камеры и швыряет дроида Силой о стену.' });
      b.hurt(x, Math.round(x.maxhp * 0.15), ev);
      if (b.active(x)) {
        x.status.stun = true;
        ev.push({ type: 'status', target: x.id, status: 'stun' });
      }
    }
  };

  D.bok = {
    handAt: 0.3,
    plan(b, u) {
      const a = b.heroes()[0];
      if (!a) return { skill: 'wait' };
      u.cycle++;
      if (u.row === 'back') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
      return { skill: ['staff', 'staff', 'staffsweep'][(u.cycle - 1) % 3], target: a.id };
    },
    check(b, ev) {
      const k = b.units.find(e => e.key === 'bok');
      if (!k || b.over) return false;
      if (k.hp > 0 && k.hp <= k.maxhp * D.bok.handAt) {
        end(b, 'hand', 'Клинок Эйлы проходит под посохом. Правая кисть Бока падает на камни.', ev);
        return true;
      }
      return false;
    }
  };

  const seenHero = b => {
    const seen = b.heroes().filter(h => !h.hidden);
    return seen.length ? seen : null;
  };

  D.arena = {
    turns: 6,
    waveAt: 3,
    wave: [['droideka', 'front', 1], ['geonosian', 'back', 1]],
    start(b) {
      b.waved = false;
    },
    status(b) {
      const left = D.arena.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Дроиды сжимают кольцо: ещё ' + left : '';
    },
    spawn(b, ev) {
      b.waved = true;
      const t = Math.max(...b.heroes().map(h => h.next));
      for (const [type, row, slot] of D.arena.wave) {
        const at = b.freeSlot(row, slot);
        if (at === null) continue;
        const e = b.addEnemy(type, row, at);
        e.next = t + b.delay(e) * 0.4;
        ev.push({ type: 'summon', who: null, target: e.id, text: 'новая волна' });
      }
    },
    check(b, ev) {
      if (b.over || b.waved || b.enemies().length || !b.heroes().length) return false;
      D.arena.spawn(b, ev);
      return false;
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      if (!b.waved && (b.turns.aayla || 0) >= D.arena.waveAt) D.arena.spawn(b, ev);
      if ((b.turns.aayla || 0) >= D.arena.turns) end(b, 'circle', 'Дроиды смыкают кольцо. Выживших джедаев сгоняют в центр арены.', ev);
    }
  };

  D.dianoga = {
    letGoAt: 0.5,
    status() {
      return 'Халин в яме: дианога отпустит её, если её ранить';
    },
    plan(b, u) {
      const seen = seenHero(b);
      if (!seen) return { skill: 'wait' };
      u.cycle++;
      return { skill: ['dgrab', 'dbite', 'dbite'][(u.cycle - 1) % 3], target: seen[Math.floor(b.rnd01() * seen.length)].id };
    },
    check(b, ev) {
      const d = b.units.find(e => e.key === 'dianoga');
      if (!d || b.over || d.hp <= 0 || d.hp > d.maxhp * D.dianoga.letGoAt) return false;
      d.gone = 'fled';
      end(b, 'letgo', 'Дианога выпускает Халин и уходит на дно ямы.', ev);
      return true;
    }
  };

  D.zenex = {
    endAt: 0.3,
    step: 20,
    clear: 40,
    max: 100,
    start(b) {
      b.daze = 0;
      b.spoke = false;
    },
    status(b) {
      return 'Дурман феромонов: ' + b.daze + ' из ' + D.zenex.max;
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      if (u.row === 'back') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'zblaster', target: a.id };
      u.cycle++;
      return { skill: ['zblaster', 'pheromone', 'zshove', 'pheromone'][(u.cycle - 1) % 4], target: a.id };
    },
    act(b, u, a, ev) {
      if (a.skill !== 'pheromone') return false;
      const tgt = b.unit(a.target);
      if (!tgt || !b.active(tgt)) return true;
      if (!b.spoke) {
        b.spoke = true;
        ev.push({ type: 'line', who: 'zenex', text: 'Я не сдамся, милая джедайка. Это ты сдашься мне. Нет гнева, нет ненависти. Только желание.' });
      }
      b.enemyHit(u, tgt, 'pheromone', ev);
      if (!b.active(tgt)) return true;
      const gain = Math.round(D.zenex.step * (tgt.mindguard ? 0.5 : 1) * (tgt.status.calm ? 0.5 : 1));
      b.daze = Math.min(D.zenex.max, b.daze + gain);
      if (b.daze >= D.zenex.max) {
        tgt.status.stun = true;
        b.daze = D.zenex.max / 2;
        ev.push({ type: 'line', who: null, text: 'Дурман накрывает Эйлу. Рука с клинком не слушается.' });
        ev.push({ type: 'status', target: tgt.id, status: 'stun' });
      }
      return true;
    },
    afterAct(b, u, id, ev) {
      if (b.over || u.id !== 'aayla' || (id !== 'focus' && id !== 'calm')) return;
      b.daze = Math.max(0, b.daze - D.zenex.clear);
      ev.push({ type: 'line', who: null, text: 'Эйла дышит ровно. Дурман отступает.' });
    },
    check(b, ev) {
      const z = b.units.find(e => e.key === 'zenex');
      if (!z || b.over || z.hp <= 0 || z.hp > z.maxhp * D.zenex.endAt) return false;
      z.gone = 'dead';
      end(b, 'impale', 'Эйла сбрасывает дурман и вгоняет клинок Зенексу в грудь.', ev);
      return true;
    }
  };

  D.grievous = {
    turns: 6,
    start(b) {
      b.covered = null;
    },
    status(b) {
      const left = D.grievous.turns - (b.turns.aayla || 0), c = b.covered && b.unit(b.covered);
      return (left > 0 ? 'Выстоять: ещё ' + left : '') + (c && b.active(c) ? ' · Эйла прикрывает: ' + c.name : '');
    },
    plan(b, u) {
      const seen = seenHero(b);
      if (!seen) return { skill: 'wait' };
      u.cycle++;
      const step = ['gsabers', 'gspin', 'ggrab', 'gsabers', 'gspin'][(u.cycle - 1) % 5];
      const masters = seen.filter(h => h.id !== 'aayla');
      const tgt = step === 'ggrab' ? seen.find(h => h.id === 'aayla') || seen[0] : masters.length && b.rnd01() < 0.6 ? masters[Math.floor(b.rnd01() * masters.length)] : seen[Math.floor(b.rnd01() * seen.length)];
      return { skill: step, target: tgt.id };
    },
    guard(b, h) {
      const a = b.aayla();
      if (!a || !b.covered || h.id !== b.covered) return h;
      a.guard = true;
      return a;
    },
    act(b, u, a, ev) {
      if (a.skill === 'gspin') {
        for (const h of b.heroes()) if (b.active(h)) b.enemyHit(u, D.grievous.guard(b, h), 'gspin', ev);
        return true;
      }
      const tgt = b.unit(a.target);
      if (!tgt || !b.active(tgt) || !A.SKILLS[a.skill].type) return false;
      const to = D.grievous.guard(b, tgt);
      for (let i = 0; i < (A.SKILLS[a.skill].hits || 1) && b.active(to); i++) b.enemyHit(u, to, a.skill, ev);
      return true;
    },
    commands(b, u, out) {
      if (u.id !== 'aayla') return;
      for (const h of b.heroes().filter(x => x.id !== 'aayla')) out.unshift({ id: 'cover:' + h.id, name: 'Прикрыть: ' + h.name, menu: 'stance', fp: 0, tempo: 0, enabled: true, why: null, about: 'удары Гривуса по ' + h.name + ' примет Эйла, вдвое слабее' });
    },
    perform(b, u, id, ev) {
      if (!id.startsWith('cover:')) return false;
      b.covered = id.slice(6);
      u.guard = true;
      ev.push({ type: 'stance', who: u.id, stance: 'cover' });
      return true;
    },
    afterAct(b, u, id, ev) {
      if (!b.over && (b.turns.aayla || 0) >= D.grievous.turns) D.grievous.finish(b, ev);
    },
    finish(b, ev) {
      b.S.flags.duel_hypori_turns = b.turns.aayla || 0;
      b.S.flags.duel_hypori_kept = b.heroes().filter(h => h.id !== 'aayla').length;
      end(b, 'thrown', 'Гривус хватает Эйлу когтистой ногой и швыряет под потолок.', ev);
    },
    check(b, ev) {
      if (b.over || b.aayla()) return false;
      D.grievous.finish(b, ev);
      return true;
    }
  };

  D.spar = {
    yieldAt: 0.3,
    allowed: ['fists', 'roll', 'guard', 'focus'],
    start(b) {
      const a = b.units.find(x => x.id === 'aayla');
      if (a) {
        a.armed = false;
        a.weapon = 'none';
      }
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      u.cycle++;
      return { skill: ['bpunch', 'bpunch', 'bsweep'][(u.cycle - 1) % 3], target: a.id };
    },
    commands(b, u, out) {
      for (const c of out) if (c.enabled && c.id !== 'flee' && !D.spar.allowed.includes(c.id)) {
        c.enabled = false;
        c.why = 'спарринг: только руки';
      }
    },
    check(b, ev) {
      const bly = b.units.find(e => e.key.startsWith('bly_spar')), a = b.units.find(x => x.id === 'aayla'), flag = b.groupId === 'bly_spar' ? 'duel_spar' : 'duel_' + b.groupId;
      if (b.over || !bly || !a) return false;
      if (bly.hp <= bly.maxhp * D.spar.yieldAt) {
        bly.hp = Math.max(1, bly.hp);
        b.S.flags[flag] = 'won';
        end(b, 'won', 'Блай поднимает руку: «Хватит, генерал. Сдаюсь».', ev);
        return true;
      }
      if (a.hp <= a.maxhp * D.spar.yieldAt) {
        a.hp = Math.max(1, a.hp);
        b.S.flags[flag] = 'lost';
        end(b, 'lost', 'Эйла хлопает ладонью по мату. Блай подаёт ей руку.', ev);
        return true;
      }
      return false;
    }
  };

  const ASK_AURRA = [
    'Аурра смеётся: «Джедаи бросают своих. Тебя тоже бросят, синяя. Вот увидишь».',
    'Аурра кружит вокруг Эйлы: «Твой учитель ушёл к Дуку. Он тебя бросил. Каково это?»',
    'Аурра шипит: «Я убила больше джедаев, чем ты видела. И ни один не смог мне ответить»'
  ];
  const TAUNTS = ['Боишься? Я чую. Мой имплант чует.', 'Кричи, джедайка. Мне нравится, когда кричат.', 'Таких, как я, в галактике больше нет.'];

  D.aurra = {
    asks: [0.6, 0.4, 0.25],
    rageAt: 0.15,
    start(b) {
      const a = b.aayla();
      b.fear = 0;
      b.asked = 0;
      b.antenna = false;
      b.spoke = 0;
      b.lastHp = a ? a.hp : 0;
    },
    status(b) {
      return 'Страх: ' + b.fear + ' из 100' + (b.antenna ? ' · антенна открыта' : '');
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      if (u.row === 'back') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'ashot', target: a.id };
      u.cycle++;
      return { skill: ['asaber', 'ataunt', 'ashot', 'asaber'][(u.cycle - 1) % 4], target: a.id };
    },
    act(b, u, a, ev) {
      const heal = Math.round(u.maxhp * b.fear / 2000);
      if (heal > 0 && u.hp < u.maxhp) {
        u.hp = Math.min(u.maxhp, u.hp + heal);
        ev.push({ type: 'heal', target: u.id, amount: heal, item: null });
      }
      u.mig = Math.round(A.ENEMIES.aurra.mig * (1 + b.fear / 300));
      if (a.skill !== 'ataunt') return false;
      const tgt = b.unit(a.target);
      if (!tgt || !b.active(tgt)) return true;
      ev.push({ type: 'line', who: 'aurra', text: b.spoke ? TAUNTS[b.spoke % TAUNTS.length] : 'Я выпью твой страх, джедайка. Я снюсь вашим падаванам. Я Аурра Синг!' });
      b.spoke++;
      b.enemyHit(u, tgt, 'ataunt', ev);
      b.fear = A.clamp(b.fear + (tgt.mindguard ? 5 : 10), 0, 100);
      return true;
    },
    afterAct(b, u, id, ev) {
      if (b.over || u.id !== 'aayla') return;
      if (id === 'focus') b.fear = Math.max(0, b.fear - 20);
      if (id === 'calm') b.fear = Math.max(0, b.fear - 15);
      const s = b.units.find(e => e.key === 'aurra'), next = D.aurra.asks[b.asked];
      if (!s || !b.active(s) || b.antenna || next === undefined || s.hp > s.maxhp * next) return;
      b.asked++;
      b.ask = { id: 'aurra' + b.asked, who: 'aurra', text: ASK_AURRA[b.asked - 1], options: [
        { id: 'abandon', text: 'Ударить по больному: её бросили' },
        { id: 'calm', text: 'Ответить спокойно' },
        { id: 'anger', text: 'Ответить гневом' }
      ] };
      ev.push({ type: 'ask', who: 'aurra', text: b.ask.text });
    },
    answer(b, q, id, ev) {
      const s = b.units.find(e => e.key === 'aurra');
      if (id === 'abandon') {
        ev.push({ type: 'line', who: 'aayla', text: 'Тебя бросили, Аурра. Учитель, Орден, все. Вот за что ты мстишь.' });
        if (s && b.active(s)) {
          s.rage = true;
          ev.push({ type: 'status', target: s.id, status: 'rage' });
        }
        b.antenna = true;
      } else if (id === 'calm') {
        ev.push({ type: 'line', who: 'aayla', text: 'Твоя ненависть меня не держит. Я тебя не боюсь.' });
        b.fear = Math.max(0, b.fear - 15);
      } else {
        ev.push({ type: 'line', who: 'aayla', text: 'Замолчи! Я заставлю тебя замолчать!' });
        b.darkDelta += 3;
      }
    },
    commands(b, u, out) {
      if (u.id !== 'aayla' || !b.antenna) return;
      const ok = !u.status.saberOff;
      out.unshift({ id: 'antenna', name: A.SKILLS.antenna.name, menu: 'blade', fp: 0, tempo: 0, enabled: ok, why: ok ? null : 'клинок погас', about: A.SKILLS.antenna.about });
    },
    perform(b, u, id, ev) {
      if (id !== 'antenna') return false;
      const s = b.units.find(e => e.key === 'aurra');
      if (s) s.gone = 'ko';
      end(b, 'antenna', 'Клинок Эйлы срезает антенну. Аурра падает на колени и хватается за голову.', ev);
      return true;
    },
    check(b, ev) {
      const a = b.units.find(x => x.id === 'aayla'), s = b.units.find(e => e.key === 'aurra');
      if (b.over || !s || !a) return false;
      if (a.hp < b.lastHp) b.fear = A.clamp(b.fear + Math.round((b.lastHp - a.hp) / a.maxhp * 100), 0, 100);
      b.lastHp = a.hp;
      if (!b.antenna && b.active(s) && s.hp <= s.maxhp * D.aurra.rageAt) {
        b.antenna = true;
        s.rage = true;
        ev.push({ type: 'line', who: 'aurra', text: 'Хватит! Я сама тебя прикончу!' });
      }
      return false;
    }
  };

  D.shonju = {
    grabAt: 0.5,
    lastAt: 0.2,
    start(b) {
      const a = b.units.find(x => x.id === 'aayla');
      b.grabbed = false;
      b.laughed = false;
      if (a) {
        a.armed = false;
        a.weapon = 'none';
      }
    },
    status(b) {
      return b.laughed ? 'Клинок слышит её зов' : 'Клинок у Дуума: только руки и Сила';
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      if (u.row === 'back') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'shwave', target: a.id };
      u.cycle++;
      return { skill: ['shpalm', 'shpalm', 'shwave'][(u.cycle - 1) % 3], target: a.id };
    },
    commands(b, u, out) {
      if (u.id !== 'aayla') return;
      for (const c of out) if (c.enabled && A.SKILLS[c.id] && A.SKILLS[c.id].type === 'blade') {
        c.enabled = false;
        c.why = 'клинок у Дуума';
      }
      if (b.laughed) out.unshift({ id: 'pullsaber', name: A.SKILLS.pullsaber.name, menu: 'force', fp: 0, tempo: 0, enabled: true, why: null, about: A.SKILLS.pullsaber.about });
    },
    grab(b, ev) {
      b.ask = { id: 'lekku', who: 'shonju', text: 'Шон-Джу поднимает Эйлу за лекку: «Я закончу быстро».', options: [
        { id: 'laugh', text: 'Рассмеяться' },
        { id: 'struggle', text: 'Вырываться' },
        { id: 'beg', text: 'Попросить отпустить' }
      ] };
      ev.push({ type: 'ask', who: 'shonju', text: b.ask.text });
    },
    check(b, ev) {
      const s = b.units.find(e => e.key === 'shonju_foe');
      if (!b.over && s && b.laughed && s.hp <= s.maxhp * D.shonju.lastAt) {
        s.gone = 'fled';
        end(b, 'hands', 'Эйла зовёт клинок Силой. Вспышка, и Шон-Джу остаётся без кистей.', ev);
        return true;
      }
      if (b.over || !s || b.grabbed || b.ask || !b.aayla() || s.hp > s.maxhp * D.shonju.grabAt) return false;
      b.grabbed = true;
      ev.push({ type: 'line', who: 'shonju', text: 'Ты выбрала свой путь, джедай. Так иди по нему до конца.' });
      D.shonju.grab(b, ev);
      return false;
    },
    answer(b, q, id, ev) {
      const a = b.aayla(), s = b.units.find(e => e.key === 'shonju_foe');
      if (id === 'laugh') {
        b.laughed = true;
        ev.push({ type: 'line', who: 'aayla', text: 'Быть джедаем значит принять своё место. Я своё приняла.' });
        return;
      }
      ev.push({ type: 'line', who: 'shonju', text: id === 'beg' ? 'Просишь? Джедаи тоже не слушали, когда просил я.' : 'Вырывайся. Мне нравится, когда вырываются.' });
      if (a && s) b.enemyHit(s, a, 'squeeze', ev);
      if (b.aayla()) D.shonju.grab(b, ev);
    },
    perform(b, u, id, ev) {
      if (id !== 'pullsaber') return false;
      const s = b.units.find(e => e.key === 'shonju_foe');
      u.armed = true;
      if (s) s.gone = 'fled';
      end(b, 'hands', 'Клинок прыгает в руку Эйлы. Вспышка, и Шон-Джу остаётся без кистей.', ev);
      return true;
    }
  };

  D.cantina5 = {
    turns: 4,
    status(b) {
      const left = D.cantina5.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Клоны держат зал: ещё ' + left : '';
    },
    afterAct(b, u, id, ev) {
      if (!b.over && (b.turns.aayla || 0) >= D.cantina5.turns) end(b, 'escape', 'Клоны падают один за другим. Эйла прорывается к выходу.', ev);
    }
  };

  D.forest = {
    hurt: 0.4,
    start(b) {
      const a = b.units.find(x => x.id === 'aayla');
      if (a) a.hp = Math.min(a.hp, Math.round(a.maxhp * D.forest.hurt));
    },
    status() {
      return 'Шон-Джу и его ученики вышли из леса';
    },
    check(b, ev) {
      const d = b.units.find(e => e.key === 'sec_droid');
      if (b.over || !d || d.hp > 0) return false;
      for (const e of b.enemies()) e.gone = 'fled';
      end(b, 'sabat', 'Охранный дроид падает. Сабат включает реактивный ранец и уходит над лесом.', ev);
      return true;
    }
  };

  const blowOf = (b, u) => {
    const d = A.ENEMIES[u.key];
    return d.ai === 'shooter' ? d.shot || 'shot' : d.melee || 'stab';
  };

  D.squad6 = {
    turns: 4,
    status(b) {
      const left = D.squad6.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Отряд отходит к храму: ещё ' + left : '';
    },
    plan(b, u) {
      const seen = seenHero(b);
      if (!seen) return { skill: 'wait' };
      if (u.row === 'back' && A.ENEMIES[u.key].ai !== 'shooter') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
      const clones = seen.filter(h => h.key === 'clone_327');
      const tgt = clones.length && b.rnd01() < 0.7 ? clones[Math.floor(b.rnd01() * clones.length)] : seen[Math.floor(b.rnd01() * seen.length)];
      return { skill: blowOf(b, u), target: tgt.id };
    },
    start(b) {
      b.spawned = 0;
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      if ((b.turns.aayla || 0) >= D.squad6.turns) end(b, 'retreat', 'Ногри лезут из-за каждого дерева. Блай командует отход к храму.', ev);
      else if (b.enemies().length < 3) D.horde6.spawn(b, ev, u.next);
    },
    check(b, ev) {
      return D.horde6.check(b, ev);
    }
  };

  D.horde6 = {
    turns: 5,
    spawns: 4,
    start(b) {
      b.spawned = 0;
    },
    status(b) {
      const left = D.horde6.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Ногри лезут из всех проходов: ещё ' + left : '';
    },
    spawn(b, ev, after) {
      if (b.spawned >= D.horde6.spawns) return null;
      const slot = b.freeSlot('front');
      if (slot === null) return null;
      b.spawned++;
      const e = b.addEnemy('noghri', 'front', slot);
      e.next = after + b.delay(e) * 0.4;
      ev.push({ type: 'summon', who: null, target: e.id, text: 'ещё ногри' });
      return e;
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      if ((b.turns.aayla || 0) >= D.horde6.turns) {
        for (const e of b.enemies()) { e.hp = 0; e.gone = 'dead'; }
        end(b, 'vos', 'Из темноты бьёт бластер. Ногри падают один за другим.', ev);
        return;
      }
      if (b.enemies().length < 3) D.horde6.spawn(b, ev, u.next);
    },
    check(b, ev) {
      if (b.over || b.enemies().length || !b.heroes().length || b.spawned >= D.horde6.spawns) return false;
      const t = Math.max(...b.heroes().map(h => h.next));
      D.horde6.spawn(b, ev, t);
      D.horde6.spawn(b, ev, t);
      return false;
    }
  };

  D.endure6 = {
    turns: 6,
    start(b) {
      b.covered = null;
      b.thrown = false;
    },
    status(b) {
      const left = D.endure6.turns - (b.turns.aayla || 0);
      return (left > 0 ? 'Выстоять: ещё ' + left : '') + (b.covered ? ' · Эйла прикрывает Блая' : '');
    },
    plan(b, u) {
      const a = b.aayla(), bly = b.units.find(h => h.id === 'bly' && b.active(h));
      if (!a) return { skill: 'wait' };
      u.cycle++;
      if (!b.thrown && bly) return { skill: 'vthrow', target: bly.id };
      const step = ['vsaber6', 'vsaber6', 'vkick6', 'vthrow'][(u.cycle - 1) % 4];
      if (step === 'vthrow') return bly ? { skill: 'vthrow', target: bly.id } : { skill: 'vsaber6', target: a.id };
      return { skill: step, target: a.id };
    },
    act(b, u, a, ev) {
      if (a.skill !== 'vthrow') return false;
      const bly = b.unit(a.target), aay = b.aayla();
      b.thrown = true;
      if (b.covered === 'bly' && aay) {
        ev.push({ type: 'line', who: null, text: 'Эйла встаёт между Восом и Блаем. Бросок Силы бьёт в неё.' });
        aay.guard = true;
        b.enemyHit(u, aay, 'vthrow', ev);
        return true;
      }
      if (!bly || !b.active(bly)) return true;
      ev.push({ type: 'line', who: 'vos', text: 'Не лезь, клон.' });
      b.enemyHit(u, bly, 'vthrow', ev);
      if (b.active(bly)) {
        bly.status.stun = true;
        bly.knocked = (bly.knocked || 0) + 1;
        ev.push({ type: 'status', target: bly.id, status: 'stun' });
      }
      return true;
    },
    commands(b, u, out) {
      if (u.id !== 'aayla' || b.covered) return;
      if (b.units.some(h => h.id === 'bly' && b.active(h))) out.unshift({ id: 'cover:bly', name: 'Прикрыть: Блай', menu: 'stance', fp: 0, tempo: 0, enabled: true, why: null, about: 'броски Воса в Блая примет Эйла' });
    },
    perform(b, u, id, ev) {
      if (id !== 'cover:bly') return false;
      b.covered = 'bly';
      u.guard = true;
      ev.push({ type: 'stance', who: u.id, stance: 'cover' });
      return true;
    },
    afterAct(b, u, id, ev) {
      if (!b.over && (b.turns.aayla || 0) >= D.endure6.turns) D.endure6.finish(b, ev);
    },
    finish(b, ev) {
      const bly = b.units.find(h => h.id === 'bly');
      b.S.flags.duel_honoghr_turns = b.turns.aayla || 0;
      b.S.flags.duel_honoghr_bly = bly && !bly.knocked && bly.hp > 0 ? 'covered' : 'thrown';
      end(b, 'disarmed', 'Вос выбивает клинок из руки Эйлы. Рукоять катится в мёртвую траву.', ev);
    },
    check(b, ev) {
      if (b.over || b.aayla()) return false;
      D.endure6.finish(b, ev);
      return true;
    }
  };

  D.camp6 = {
    turns: 5,
    status(b) {
      const left = D.camp6.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Клоны-моргукаи в лагере: ещё ' + left : '';
    },
    afterAct(b, u, id, ev) {
      if (!b.over && (b.turns.aayla || 0) >= D.camp6.turns) end(b, 'diversion', 'Клоны-моргукаи уходят в туннели так же быстро, как пришли.', ev);
    }
  };

  const ROSE = ['Бок встаёт. Глаза у него налиты кровью.', 'Бок встаёт снова. С каждым разом он злее.', 'Бок поднимается, шатаясь. Он не сдастся.'];

  D.bokgate = {
    askAt: 0.5,
    rageAt: 0.12,
    steps: [0.75, 0.5, 0.25],
    start(b) {
      b.rose = 0;
      b.taunted = false;
      b.raged = false;
    },
    status(b) {
      return b.raged ? 'Бок в ярости: толкни его в ворота, пока он разбегается' : 'Кортозисная перчатка: клинок бесполезен';
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      if (b.raged) {
        if (u.row === 'front') return { skill: 'retreat' };
        return u.windup ? { skill: 'bcharge', target: a.id } : { skill: 'runup' };
      }
      if (u.row === 'back') return b.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
      u.cycle++;
      return { skill: ['gauntlet', 'staff', 'staffsweep'][(u.cycle - 1) % 3], target: a.id };
    },
    act(b, u, a, ev) {
      if (a.skill === 'retreat') {
        const s = b.freeSlot('back', u.slot);
        if (s !== null) {
          ev.push({ type: 'move', target: u.id, from: [u.row, u.slot], to: ['back', s], how: 'push' });
          u.row = 'back';
          u.slot = s;
        }
        u.windup = false;
        ev.push({ type: 'line', who: 'bok', text: 'Бок отходит к воротам для разбега.' });
        return true;
      }
      if (a.skill === 'runup') {
        u.windup = true;
        ev.push({ type: 'line', who: 'bok', text: 'Бок пригибается для броска. За его спиной гудят лазерные ворота.' });
        return true;
      }
      if (a.skill === 'bcharge') {
        const tgt = b.unit(a.target), s = b.freeSlot('front', u.slot);
        if (s !== null && u.row === 'back') {
          ev.push({ type: 'move', target: u.id, from: [u.row, u.slot], to: ['front', s], how: 'advance' });
          u.row = 'front';
          u.slot = s;
        }
        u.windup = false;
        if (tgt && b.active(tgt)) b.enemyHit(u, tgt, 'bcharge', ev);
        return true;
      }
      return false;
    },
    rage(b, k, ev, text) {
      b.raged = true;
      k.rage = true;
      k.weight = 'medium';
      ev.push({ type: 'status', target: k.id, status: 'rage' });
      ev.push({ type: 'line', who: 'bok', text });
    },
    check(b, ev) {
      const k = b.units.find(e => e.key === 'bok_final');
      if (!k || b.over || !b.active(k)) return false;
      while (b.rose < D.bokgate.steps.length && k.hp <= k.maxhp * D.bokgate.steps[b.rose]) {
        b.rose++;
        k.mig = Math.round(k.mig * 1.12);
        ev.push({ type: 'line', who: 'bok', text: ROSE[b.rose - 1] });
      }
      if (!b.raged && !b.taunted && !b.ask && k.hp <= k.maxhp * D.bokgate.askAt) {
        b.taunted = true;
        b.ask = { id: 'bok', who: 'bok', text: 'Бок хрипит: «Ты забрала мою руку. Опозорила меня. Теперь я тебя убью».', options: [
          { id: 'father', text: 'Сказать, что он разочаровал дух отца' },
          { id: 'yield', text: 'Предложить сдаться' },
          { id: 'silent', text: 'Промолчать' }
        ] };
        ev.push({ type: 'ask', who: 'bok', text: b.ask.text });
        return false;
      }
      if (!b.raged && k.hp <= k.maxhp * D.bokgate.rageAt) D.bokgate.rage(b, k, ev, 'Бок ревёт и бросается вперёд.');
      return false;
    },
    answer(b, q, id, ev) {
      const k = b.units.find(e => e.key === 'bok_final');
      if (id === 'father') {
        ev.push({ type: 'line', who: 'aayla', text: 'Твой отец гордился моргукаями. Ты разочаровал его дух, Бок.' });
        if (k && b.active(k)) D.bokgate.rage(b, k, ev, 'Бок ревёт от ярости.');
        return;
      }
      ev.push({ type: 'line', who: 'aayla', text: id === 'yield' ? 'Моргукаев больше нет. Сдавайся, Бок.' : 'Эйла молчит и ждёт следующего удара.' });
      ev.push({ type: 'line', who: 'bok', text: 'Моргукаи не сдаются.' });
    },
    fall(b, tgt, ev) {
      if (tgt.key !== 'bok_final' || !b.raged) return false;
      tgt.hp = 0;
      tgt.gone = 'dead';
      end(b, 'gate', 'Толчок Силы бросает Бока в лазерные ворота.', ev);
      return true;
    }
  };

  D.VOS_FRAGS = [1, 4, 5, 6, 7, 8, 9];
  D.VOS_MIND = [['mind_medallion', 'Медальон Квиан'], ['mind_sanctum', 'Святилище Каркко'], ['mind_balcony', 'Балкон Пола'], ['mind_kiffu', 'Киффу']];

  D.shadows = {
    start(b) {
      b.lit = {};
    },
    status() {
      return 'Клинок здесь не режет. Свет дают память и связь';
    },
    plan(b, u) {
      const seen = seenHero(b);
      if (!seen) return { skill: 'wait' };
      u.cycle++;
      const a = seen.find(h => h.id === 'aayla') || seen[0];
      if (u.key === 'dark_vos') return { skill: u.cycle % 3 === 0 ? 'despair' : 'vaapad', target: a.id };
      return { skill: u.cycle % 2 ? 'gloom' : 'despair', target: seen[Math.floor(b.rnd01() * seen.length)].id };
    },
    act(b, u, a, ev) {
      if (a.skill !== 'despair') return false;
      const tgt = b.unit(a.target);
      if (!tgt || !b.active(tgt)) return true;
      b.enemyHit(u, tgt, 'despair', ev);
      if (b.active(tgt) && !tgt.mindguard && !tgt.status.calm) {
        tgt.status.fear = 2;
        ev.push({ type: 'status', target: tgt.id, status: 'fear' });
      }
      return true;
    },
    commands(b, u, out) {
      for (const c of out) if (c.enabled && A.SKILLS[c.id] && A.SKILLS[c.id].type) {
        c.enabled = false;
        c.why = 'в памяти клинок не режет';
      }
      const S = b.S;
      if (u.key === 'tholme') {
        out.unshift({ id: 'voice', name: A.SKILLS.tholmelight.name, menu: 'force', fp: 0, tempo: 0, enabled: true, why: null, about: 'свет по всем теням, сила по ступени связи с Толмом: ' + A.Bonds.rank(S, 'tholme') });
        return;
      }
      if (u.id !== 'aayla') return;
      for (const [flag, title] of D.VOS_MIND.slice().reverse()) if (S.flags[flag]) {
        const used = b.lit['mind:' + flag];
        out.unshift({ id: 'mind:' + flag, name: 'Память Воса: ' + title, menu: 'force', fp: 0, tempo: 0, enabled: !used, why: used ? 'уже вспомнила' : null, about: 'то, что Эйла видела в его памяти, бьёт по всем теням сильнее обрывка' });
      }
      for (const n of D.VOS_FRAGS.slice().reverse()) if (A.Memory.has(S, n)) {
        const used = b.lit['frag:' + n];
        out.unshift({ id: 'frag:' + n, name: 'Вспомнить: ' + A.Memory.get(n).title, menu: 'force', fp: 0, tempo: 0, enabled: !used, why: used ? 'уже вспомнила' : null, about: 'обрывок, где есть Вос: свет по всем теням' });
      }
      const rank = A.Bonds.rank(S, 'vos');
      out.unshift({ id: 'bond:vos', name: A.SKILLS.bondlight.name, menu: 'force', fp: 0, tempo: 0, enabled: rank > 0, why: rank > 0 ? null : 'связи нет', about: 'свет по Тёмному Восу, сила по ступени связи: ' + rank });
    },
    perform(b, u, id, ev) {
      const S = b.S, shades = b.enemies();
      const light = (skill, scale, list) => {
        ev.push({ type: 'use', who: u.id, skill, target: list.length === 1 ? list[0].id : 'frontAll' });
        for (const e of list) if (b.active(e)) b.strike(u, e, skill, ev, scale);
      };
      if (id.startsWith('frag:') || id.startsWith('mind:')) {
        b.lit[id] = true;
        light('memlight', id.startsWith('mind:') ? 1.5 : 1, shades);
        return true;
      }
      if (id === 'bond:vos') {
        const t = shades.find(e => e.key === 'dark_vos') || shades[0];
        light('bondlight', 1 + 0.45 * A.Bonds.rank(S, 'vos'), t ? [t] : []);
        return true;
      }
      if (id === 'voice') {
        light('tholmelight', 0.8 + 0.3 * A.Bonds.rank(S, 'tholme'), shades);
        return true;
      }
      return false;
    },
    check(b, ev) {
      const v = b.units.find(e => e.key === 'dark_vos');
      if (!v || b.over || b.active(v)) return false;
      for (const e of b.enemies()) e.gone = 'dispelled';
      end(b, 'light', 'Тёмный Вос рассыпается, как дым. В темноте остаётся только Квинлан.', ev);
      return true;
    }
  };

  D.niango = {
    turns: 5,
    spawns: 4,
    start(b) {
      b.spawned = 0;
    },
    status(b) {
      const left = D.niango.turns - (b.turns.aayla || 0);
      return left > 0 ? 'Бронетехника сепаратистов идёт к Ниянго: ещё ' + left : '';
    },
    afterAct(b, u, id, ev) {
      if (b.over) return;
      if ((b.turns.aayla || 0) >= D.niango.turns) {
        end(b, 'bird', 'Дроиды отходят за грибы. Становится тихо, и над станцией взлетает птица.', ev);
        return;
      }
      if (b.enemies().length < 3 && b.spawned < D.niango.spawns) {
        const slot = b.freeSlot('back');
        if (slot === null) return;
        b.spawned++;
        const e = b.addEnemy('b1_late', 'back', slot);
        e.next = u.next + b.delay(e) * 0.4;
        ev.push({ type: 'summon', who: null, target: e.id, text: 'ещё дроиды' });
      }
    },
    check(b, ev) {
      if (b.over || b.enemies().length || !b.heroes().length || b.spawned >= D.niango.spawns) return false;
      const t = Math.max(...b.heroes().map(h => h.next));
      for (const slot of [0, 2]) {
        b.spawned++;
        const e = b.addEnemy('b1_late', 'back', slot);
        e.next = t + b.delay(e) * 0.4;
        ev.push({ type: 'summon', who: null, target: e.id, text: 'ещё дроиды' });
      }
      return false;
    }
  };

  D.beast = {
    cost: 12,
    riseAt: 0.75,
    miss: 0.08,
    start(b) {
      b.under = false;
    },
    status(b) {
      return b.under ? 'Зверь встал под сталактитами: обрушь своды Силой' : 'Над Зверем висят сталактиты';
    },
    plan(b, u) {
      const a = b.aayla();
      if (!a) return { skill: 'wait' };
      u.cycle++;
      if (u.cycle % 3 === 0 && u.hp <= u.maxhp * D.beast.riseAt) return { skill: 'brise' };
      return { skill: u.cycle % 3 === 1 ? 'bclaw' : 'btentacle', target: a.id };
    },
    act(b, u, a, ev) {
      if (a.skill !== 'brise') {
        b.under = false;
        return false;
      }
      b.under = true;
      ev.push({ type: 'line', who: null, text: 'Зверь встаёт на дыбы под самыми сталактитами.' });
      return true;
    },
    commands(b, u, out) {
      if (u.id !== 'aayla') return;
      const ok = u.fp >= D.beast.cost;
      out.unshift({ id: 'ceiling', name: A.SKILLS.ceiling.name, menu: 'force', fp: D.beast.cost, tempo: 0, enabled: ok, why: ok ? null : 'не хватает Силы', about: A.SKILLS.ceiling.about });
    },
    perform(b, u, id, ev) {
      if (id !== 'ceiling') return false;
      u.fp -= D.beast.cost;
      const k = b.units.find(e => e.key === 'endor_beast');
      if (!k) return true;
      if (b.under) {
        k.hp = 0;
        k.gone = 'dead';
        end(b, 'stalactites', 'Сталактиты рушатся на Зверя. Он больше не встаёт.', ev);
        return true;
      }
      ev.push({ type: 'line', who: null, text: 'Камни бьют по панцирю, но Зверь стоит не под сводом.' });
      b.hurt(k, Math.round(k.maxhp * D.beast.miss), ev);
      return true;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
