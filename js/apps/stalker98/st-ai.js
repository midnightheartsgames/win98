/**
 * S.T.A.L.K.E.R. 98 — actor AI.
 * Humans: faction relations, sight (day/night, flashlight, crouching) and hearing, suspicion, idle behaviours
 * (guard, camp by the fire, patrol, wander, hostage, trader, wounded, assault, goto, follow), combat with cover search,
 * peeking, bursts, reloads, grenades, leashes and barks; the wounded state where a stalker begs for a medkit.
 * Mutants: blind dog packs that circle and bite by turns and flee, leaping pseudodogs, flesh, charging boars and
 * the half-invisible bloodsucker.
 */
(function (S) {
  'use strict';
  const { clamp, wrapAng, lerp } = S;
  const D = S.DATA, IT = D.ITEMS, DT = 1 / 60;
  const T = D.T;

  // ================================================================ barks
  const BARK = {
    spot: { stalker: [T('Контакт!', 'Contact!'), T('Враг!', 'Enemy!'), T('Мочи гадов!', 'Take them down!'), T('Вот они!', 'There they are!')], bandit: [T('Опа, фраер нарисовался!', 'Well, look who\'s here!'), T('Вали его, братва!', 'Waste him, boys!'), T('Щас мы тебя сделаем!', 'We\'ll get you now!'), T('Кто тут у нас?', 'Who do we have here?')], military: [T('Огонь!', 'Open fire!'), T('Противник!', 'Hostile!'), T('Стой, стрелять буду!', 'Halt or I shoot!')], duty: [T('Огонь по врагу!', 'Engage!'), T('Противник!', 'Hostile!')] },
    reload: [T('Перезаряжаю!', 'Reloading!'), T('Прикрой, меняю магазин!', 'Cover me, changing mag!')],
    grenade: [T('Граната!', 'Grenade!'), T('Лови гостинец!', 'Catch this!')],
    wounded: [T('Аптечку... кто-нибудь...', 'A medkit... anyone...'), T('Помогите...', 'Help me...'), T('Братан, помоги...', 'Brother, help...')],
    hurt: [T('А-а-а!', 'Aargh!'), T('Зацепило!', 'I\'m hit!'), T('Ай, гад!', 'Damn you!')],
    kill: [T('Готов.', 'Got him.'), T('Минус один.', 'One down.'), T('Отбегался.', 'He\'s done.')],
    lost: [T('Куда он делся?', 'Where did he go?'), T('Ушёл, гад...', 'He got away...'), T('Проверю там.', 'I\'ll check over there.')],
    dogs: [T('Собаки!', 'Dogs!'), T('Мутанты!', 'Mutants!')],
    greet: [T('Здорово, сталкер.', 'Hey, stalker.'), T('Удачной охоты.', 'Good hunting.'), T('Осторожнее там, на севере.', 'Careful up north.'), T('Привет, Меченый.', 'Hi, Marked One.')],
    joke: [
      T('Встречаются как-то два сталкера. Один другому: «Слышь, а чего ты такой светящийся?» — «Да вот, у Сидоровича колбасу брал...»', 'Two stalkers meet. One says: "Why are you glowing?" — "Bought sausage from Sidorovich..."'),
      T('Идёт сталкер по Зоне, видит — плоть. Плоть видит сталкера. Постояли, посмотрели... и разошлись. Оба новички были.', 'A stalker sees a flesh. The flesh sees the stalker. They stare... and walk away. Both were rookies.'),
      T('Говорят, Сидорович за один артефакт однажды целую бутылку водки отдал. Врут, наверное.', 'They say Sidorovich once paid a whole bottle of vodka for an artifact. Probably a lie.'),
      T('Новичок спрашивает: «А болты зачем?» — «Кидать». — «А если кончатся?» — «Значит, дальше не пойдёшь».', 'Rookie asks: "Why bolts?" — "To throw." — "And if I run out?" — "Then you go no further."'),
      T('Знаете, почему кровосос невидимый? Стесняется он.', 'Know why bloodsuckers are invisible? They\'re shy.')
    ],
    warn: [T('Стой! Дальше прохода нет!', 'Stop! No entry!'), T('Эй, куда прёшь? Назад!', 'Hey, where are you going? Back off!')]
  };
  S.BARK = BARK;
  function bark(g, a, list, force) {
    if (!a.ai || a.hidden) return;
    if (!force && a.ai.barkT > 0) return;
    const L = Array.isArray(list) ? list : (list[a.faction] || list.stalker);
    const d = Math.hypot(a.x - g.player.x, a.z - g.player.z);
    a.ai.barkT = 4 + g.rng() * 5;
    if (d > 40) return;
    g.emit({ t: 'bark', uid: a.uid, text: g.L(L[Math.floor(g.rng() * L.length)]), who: g.L(a.name), x: a.x, y: a.y + 2, z: a.z, voice: a.faction === 'bandit' ? 1 : a.faction === 'military' ? 2 : 0 });
  }
  S.bark = bark;

  // ================================================================ creation
  function genName(g, faction) {
    const r = g.rng, N = D.NAMES, i = Math.floor(r() * N.first.length), j = Math.floor(r() * N.nick.length);
    if (faction === 'military') { const k = Math.floor(r() * N.soldier.length); return { ru: 'Рядовой ' + N.soldier[k], en: 'Private ' + N.soldierEn[k] }; }
    if (faction === 'bandit') return { ru: 'Бандит ' + N.first[i], en: 'Bandit ' + N.firstEn[i] };
    if (faction === 'duty') return { ru: 'Долговец ' + N.first[i] + ' ' + N.nick[j], en: 'Duty ' + N.firstEn[i] + ' ' + N.nickEn[j] };
    return { ru: N.first[i] + ' ' + N.nick[j], en: N.firstEn[i] + ' ' + N.nickEn[j] };
  }
  function newAI(g) {
    return { state: 'idle', t: 0, percT: g.rng() * 0.3, decT: g.rng() * 0.5, target: null, lastSeen: null, seenT: 99, alertT: 0, sus: 0, path: null, pathI: 0, pathT: 0, goal: null,
      cover: null, coverT: 0, peek: false, burst: 0, shootT: 0, reactT: 0, reloadT: 0, barkT: g.rng() * 5, strafe: 1, strafeT: 0, nadeT: 8 + g.rng() * 10, patrolI: 0, wanderT: 0, lookAt: null, attackT: 0, orbit: g.rng() < 0.5 ? 1 : -1, fleeT: 0, jokeT: 20 + g.rng() * 40, stuckT: 0, lastPos: null, warnT: 0 };
  }
  S.makeHuman = function (g, n, idx) {
    const tpl = D.HUMANS[n.tpl] || D.HUMANS.loner, faction = n.faction || tpl.faction, r = g.rng;
    const look = n.look || (n.beh === 'hostage' ? 'hostage' : tpl.look);
    const a = {
      uid: g.nextUid ? g.nextUid() : Math.floor(r() * 1e9), kind: 'human', tpl: n.tpl, src: idx, id: n.id || null, name: n.name || genName(g, faction), faction, look,
      x: n.x, z: n.z, y: n.y != null ? n.y : g.W.groundAt(n.x, n.z, 0.3), vx: 0, vy: 0, vz: 0, r: 0.32, h: 1.8, yaw: n.yaw || 0, ground: true,
      hp: tpl.hp, maxHp: tpl.hp, dead: false, deadT: 0, beh: n.beh || 'guard', home: { x: n.x, z: n.z, yaw: n.yaw || 0, y: n.y }, pathId: n.path || null, group: n.group || null,
      leash: n.leash == null ? 20 : n.leash, dialog: n.dialog || null, trade: n.trade || null, attitude: n.attitude || null, essential: !!n.essential, hidden: !!n.hidden,
      guitar: !!n.guitar, target: n.target || null, acc: tpl.acc, suit: n.suit || tpl.suit, rank: tpl.rank, inv: [], money: Math.floor(tpl.money[0] + r() * (tpl.money[1] - tpl.money[0])),
      weaponUid: null, crouch: 0, wounded: false, ignore: n.beh === 'hostage' || n.beh === 'trader', talk: 0, anim: null
    };
    a.uid = uidOf(g);
    const wid = n.beh === 'hostage' || n.beh === 'trader' ? null : (n.weapon || (tpl.weapons.length ? tpl.weapons[Math.floor(r() * tpl.weapons.length)] : null));
    if (wid) {
      const w = g.mkItem(wid, 0.35 + r() * 0.45); w.mag = IT[wid].mag || 0; a.inv.push(w); a.weaponUid = w.uid;
      if (IT[wid].ammo) { const am = IT[wid].ammo[0]; const k = 1 + Math.floor(r() * 2); for (let i = 0; i < k; i++) { const b = g.mkItem(am); b.n = Math.ceil(IT[am].box * (0.3 + r() * 0.7)); a.inv.push(b); } }
    }
    if (a.suit && n.beh !== 'trader' && r() < 0.35) a.inv.push(g.mkItem(a.suit, 0.25 + r() * 0.4));
    if (n.beh !== 'trader') for (const [id, ch] of tpl.loot) if (r() < ch * g.sk.loot) a.inv.push(g.mkItem(id));
    if (n.beh !== 'trader' && n.beh !== 'hostage' && r() < 0.25) a.inv.push(g.mkItem('pda'));
    if (a.faction === 'bandit' && r() < 0.25 && !a.inv.some(i => IT[i.id].kind === 'grenade')) a.inv.push(g.mkItem('rgd5'));
    if (a.faction === 'military' && r() < 0.5) a.inv.push(g.mkItem('rgd5'));
    if (n.inv) for (const id of n.inv) a.inv.push(g.mkItem(id));
    a.ai = newAI(g);
    return a;
  };
  function uidOf(g) { g._uidc = (g._uidc || 100000) + 1; return g._uidc + Math.floor(g.realT * 1000) * 0; }
  S.makeMutant = function (g, m, idx) {
    const M = D.MUTANTS[m.type];
    const a = {
      uid: uidOf(g), kind: 'mutant', type: m.type, src: idx, id: m.id || null, name: M.name, faction: 'monster', x: m.x, z: m.z, y: g.W.groundAt(m.x, m.z, 0.4), vx: 0, vy: 0, vz: 0,
      r: M.r, h: M.h, yaw: m.yaw || 0, ground: true, hp: M.hp, maxHp: M.hp, dead: false, deadT: 0, home: { x: m.x, z: m.z }, homeR: m.home || 15, group: m.group || null,
      hidden: !!m.hidden, lair: !!m.lair, inv: [], money: 0, anim: null, invis: M.invis ? 1 : 0
    };
    a.ai = newAI(g);
    return a;
  };
  S.reviveActor = function (g, a) { a.ai = newAI(g); if (a.dead) a.deadT = Math.max(a.deadT, 3); g._uidc = Math.max(g._uidc || 100000, a.uid); return a; };

  // ================================================================ geometry
  S.actorHeight = function (a) {
    if (a.kind === 'mutant') return a.h * ((S.MODELS[D.MUTANTS[a.type].model] || {}).scale || 1);
    if (a.dead) return 0.45;
    if (a.wounded) return 0.6;
    if (a.sitting) return 1.2;
    return 1.8 - a.crouch * 0.6;
  };
  S.actorHead = function (a) {
    if (a.kind === 'mutant') { const sc = (S.MODELS[D.MUTANTS[a.type].model] || {}).scale || 1, h = S.actorHeight(a); return [a.x + Math.sin(a.yaw) * a.r * 1.15 * sc, a.y + h * 0.72, a.z + Math.cos(a.yaw) * a.r * 1.15 * sc, 0.2 * sc]; }
    const h = S.actorHeight(a);
    if (a.dead || a.wounded) return [a.x + Math.sin(a.yaw) * 0.7, a.y + 0.25, a.z + Math.cos(a.yaw) * 0.7, 0.14];
    return [a.x, a.y + h - 0.12, a.z, 0.14];
  };
  S.pointLineDist = function (px, py, pz, ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz; let t = l2 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / l2 : 0; t = clamp(t, 0, 1);
    return Math.hypot(px - ax - dx * t, py - ay - dy * t, pz - az - dz * t);
  };
  const eyeOf = a => a.y + (a.kind === 'mutant' ? S.actorHeight(a) * 0.7 : a.sitting ? 1.1 : 1.62 - a.crouch * 0.6);
  const posOf = (g, t) => (t === 'player' ? g.player : t);
  const chestOf = (g, t) => (t === 'player' ? g.player.y + (g.player.crouch > 0.5 ? 0.85 : 1.25) : t.y + S.actorHeight(t) * 0.62);

  // ================================================================ damage & alerts
  S.damageActor = function (g, a, dmg, type, src, dir, pow) {
    if (a.dead) { if (dir && pow) { a.vx += dir[0] * pow * 0.5; a.vz += dir[2] * pow * 0.5; } return; }
    if (a.hidden) return;
    if (a.beh === 'trader') return;
    if (a.essential && src !== 'player') return;
    if (a.kind === 'mutant' && D.MUTANTS[a.type].invis) { a.invis = 0; a.ai.visT = 1.5; }
    a.hp -= dmg; a.ai.hurtT = 0.35; a.flash = 0.15;
    if (dir && pow) { a.vx += dir[0] * pow * 0.6; a.vz += dir[2] * pow * 0.6; }
    const killed = a.hp <= 0;
    if (src === 'player') { g.provoke(a, killed); if (!killed && a.ai.state !== 'combat' && g.attitudeOf(a, 'player') < 0) acquire(g, a, 'player', true); }
    else if (src && typeof src === 'object' && !src.dead && !killed) { if (a.ai.state !== 'combat' || a.ai.target === 'player' === false) acquire(g, a, src, true); }
    if (killed) { die(g, a, src, type); return; }
    if (a.kind === 'human') {
      if (dmg > 8) { bark(g, a, BARK.hurt); g.emit({ t: 'sound', s: a.faction === 'bandit' ? 'hurt_b' : 'hurt_h', x: a.x, y: a.y + 1.6, z: a.z }); }
      if (!a.wounded && !a.essential && a.hp < a.maxHp * 0.25 && a.beh !== 'hostage' && g.rng() < 0.45) {
        a.wounded = true; a.hp = Math.max(a.hp, 6); a.woundT = 60 + g.rng() * 40; a.ai.state = 'wounded'; a.crouch = 0; bark(g, a, BARK.wounded, true);
      }
    } else {
      g.emit({ t: 'sound', s: 'm_hurt_' + a.type, x: a.x, y: a.y + 0.5, z: a.z });
      alertPack(g, a, src);
    }
  };
  function die(g, a, src, type) {
    a.dead = true; a.deadT = 0; a.hp = 0; a.wounded = false; a.crouch = 0; a.sitting = false;
    a.fallDir = g.rng() < 0.5 ? 1 : -1;
    g.emit({ t: 'death', uid: a.uid, x: a.x, y: a.y, z: a.z, kind: a.kind, type: a.type, gib: type === 'explosion' || type === 'strike' });
    g.emit({ t: 'sound', s: a.kind === 'human' ? (a.faction === 'bandit' ? 'die_b' : 'die_h') : 'm_die_' + a.type, x: a.x, y: a.y + 1, z: a.z });
    if (a.kind === 'mutant') {
      const M = D.MUTANTS[a.type];
      if (M.part && g.rng() < 0.7) a.inv.push(g.mkItem(M.part));
      if (src === 'player') { g.stats.mutant++; g.stats.rating += M.xp; }
    } else if (src === 'player') {
      g.stats.human++; g.stats.rating += 15 + (a.rank || 0) * 10;
    } else if (src && typeof src === 'object' && src.kind === 'human' && !src.dead) bark(g, src, BARK.kill);
    if (S.QUESTS && S.QUESTS.onDeath) S.QUESTS.onDeath(g, a, src);
  }
  S.alertActor = function (g, a, x, z, kind) {
    if (a.dead || a.hidden || a.wounded || a.ignore) return;
    const ai = a.ai;
    if (a.kind === 'human') {
      if (kind === 'shot' && g.attitudeOf(a, 'player') >= 0) { ai.lookAt = { x, z, t: 3 }; return; }
      if (ai.state === 'combat') return;
      ai.lastSeen = { x, z }; ai.alertT = 12; ai.state = 'alert'; ai.t = 0; ai.path = null;
    } else {
      if (ai.state === 'hunt') return;
      ai.lastSeen = { x, z }; ai.alertT = 10; ai.state = 'alert'; ai.t = 0; ai.path = null;
    }
  };
  function alertPack(g, a, src) {
    if (!src) return;
    for (const o of g.actors) {
      if (o === a || o.dead || o.hidden || o.kind !== 'mutant') continue;
      if ((a.group && o.group === a.group) || (o.type === a.type && Math.hypot(o.x - a.x, o.z - a.z) < 25)) { if (o.ai.state !== 'hunt') acquire(g, o, src, true); }
    }
  }
  function acquire(g, a, t, instant) {
    const ai = a.ai, fresh = ai.state !== 'combat' && ai.state !== 'hunt';
    ai.target = t; ai.seenT = 0; const p = posOf(g, t); ai.lastSeen = { x: p.x, z: p.z };
    if (a.kind === 'human') {
      if (fresh) { ai.state = 'combat'; ai.reactT = instant ? 0.25 : 0.5 + g.rng() * 0.6; ai.decT = 0; ai.cover = null; bark(g, a, t !== 'player' && t.kind === 'mutant' ? BARK.dogs : BARK.spot); a.sitting = false; }
    } else if (fresh) { ai.state = 'hunt'; ai.attackT = 0.5 + g.rng(); g.emit({ t: 'sound', s: 'm_alert_' + a.type, x: a.x, y: a.y + 0.6, z: a.z }); alertPack(g, a, t); }
  }

  // ================================================================ perception
  function perceive(g, a) {
    const ai = a.ai, p = g.player, day = g.daylight();
    const human = a.kind === 'human', M = human ? null : D.MUTANTS[a.type];
    const baseR = human ? lerp(28, 75, day) : M.sight;
    const ex = a.x, ey = eyeOf(a), ez = a.z;
    let best = null, bd = Infinity;
    const fwdX = Math.sin(a.yaw), fwdZ = Math.cos(a.yaw);
    const check = (t, tx, ty, tz, isPlayer) => {
      const dx = tx - ex, dz = tz - ez, d = Math.hypot(dx, dz);
      let R = baseR;
      if (isPlayer) { if (g.flashlight && day < 0.5) R = Math.max(R, 60); if (p.crouch > 0.5) R *= 0.6; if (p.sprint) R *= 1.2; }
      if (d > R) return;
      const close = d < (human ? 3.5 : 10);
      if (!close && human && ai.state === 'idle') { const dot = (dx * fwdX + dz * fwdZ) / (d || 1); if (dot < -0.1) return; }
      if (!g.W.los(ex, ey, ez, tx, ty, tz)) return;
      if (isPlayer && human && ai.state === 'idle') {
        ai.sus += 0.25 * (0.4 + 2.2 * (1 - d / R)) * (p.crouch > 0.5 ? 0.55 : 1) * (Math.hypot(p.vx, p.vz) > 4 ? 1.5 : 1);
        if (ai.sus < 1 && !close) return;
      }
      if (d < bd) { bd = d; best = t; }
    };
    if (!p.dead && g.attitudeOf(a, 'player') < 0) check('player', p.x, p.y + (p.crouch > 0.5 ? 0.9 : 1.4), p.z, true);
    for (const o of g.actors) {
      if (o === a || o.dead || o.hidden || o.ignore || o.wounded) continue;
      if (Math.abs(o.x - a.x) > baseR || Math.abs(o.z - a.z) > baseR) continue;
      if (g.attitudeOf(a, o) >= 0) continue;
      // idle guards stay put vs targets far outside their leash
      if (human && a.leash > 0 && ai.state === 'idle' && Math.hypot(o.x - a.home.x, o.z - a.home.z) > a.leash + 45) continue;
      check(o, o.x, o.y + S.actorHeight(o) * 0.6, o.z, false);
    }
    ai.sus = Math.max(0, ai.sus - 0.03);
    if (best) {
      if ((ai.state === 'combat' || ai.state === 'hunt') && ai.target !== best && ai.target) {
        const cur = posOf(g, ai.target); if (Math.hypot(cur.x - a.x, cur.z - a.z) > bd + 5 || ai.seenT > 1) acquire(g, a, best);
        else { ai.seenT = 0; ai.lastSeen = { x: cur.x, z: cur.z }; }
      } else if (ai.target === best && (ai.state === 'combat' || ai.state === 'hunt')) { ai.seenT = 0; const q = posOf(g, best); ai.lastSeen = { x: q.x, z: q.z }; }
      else acquire(g, a, best);
      return true;
    }
    return false;
  }
  function targetVisible(g, a) {
    const t = a.ai.target; if (!t) return false;
    if (t !== 'player' && (t.dead || t.hidden || t.wounded)) return false;
    if (t === 'player' && g.player.dead) return false;
    const q = posOf(g, t);
    return g.W.los(a.x, eyeOf(a), a.z, q.x, chestOf(g, t), q.z);
  }

  // ================================================================ movement helpers
  function pathTo(g, a, x, z, maxNodes = 3500) {
    const ai = a.ai;
    ai.path = g.W.findPath(a.x, a.z, x, z, maxNodes); ai.pathI = 0; ai.pathT = 0; ai.goal = { x, z };
    return !!ai.path;
  }
  // steer along the current path; returns true when arrived
  function follow(g, a, speed, faceMove = true) {
    const ai = a.ai;
    if (!ai.path || ai.pathI >= ai.path.length) { a.tvx = 0; a.tvz = 0; return true; }
    const wp = ai.path[ai.pathI], dx = wp[0] - a.x, dz = wp[1] - a.z, d = Math.hypot(dx, dz);
    if (d < (ai.pathI === ai.path.length - 1 ? 0.5 : 0.9)) { ai.pathI++; if (ai.pathI >= ai.path.length) { a.tvx = 0; a.tvz = 0; return true; } return false; }
    a.tvx = dx / d * speed; a.tvz = dz / d * speed;
    if (faceMove) turnTo(a, Math.atan2(dx, dz), 6);
    return false;
  }
  function turnTo(a, yaw, rate) { const d = wrapAng(yaw - a.yaw); a.yaw = wrapAng(a.yaw + clamp(d, -rate * DT, rate * DT)); return Math.abs(d); }
  function moveBody(g, a) {
    // separation from other actors
    let sx = 0, sz = 0;
    for (const o of g.nearby) { if (o === a || o.dead || o.hidden) continue; const dx = a.x - o.x, dz = a.z - o.z, d2 = dx * dx + dz * dz, rr = (a.r + o.r) * 1.1; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); sx += dx / d * (rr - d) * 4; sz += dz / d * (rr - d) * 4; } }
    const p = g.player; { const dx = a.x - p.x, dz = a.z - p.z, d2 = dx * dx + dz * dz, rr = a.r + p.r; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); sx += dx / d * (rr - d) * 6; sz += dz / d * (rr - d) * 6; } }
    const k = Math.min(1, DT * (a.kind === 'mutant' ? 8 : 9));
    a.vx += ((a.tvx || 0) + sx - a.vx) * k; a.vz += ((a.tvz || 0) + sz - a.vz) * k;
    if (a.sitting || a.wounded) { a.vx = a.vz = 0; }
    const oy = a.y;
    g.W.move(a, DT);
    void oy;
    if (a.y < -60) { a.y = g.W.groundAt(a.home.x, a.home.z, 0.3); a.x = a.home.x; a.z = a.home.z; }
    const sp = Math.hypot(a.vx, a.vz);
    a.walk = (a.walk || 0) + sp * DT * (a.kind === 'mutant' ? 2.4 : 2.9);
    // stuck detection -> repath
    const ai = a.ai; ai.stuckT = (ai.stuckT || 0) + DT;
    if (ai.stuckT > 1.2) { const lp = ai.lastPos; if (lp && Math.hypot(lp[0] - a.x, lp[1] - a.z) < 0.3 && Math.hypot(a.tvx || 0, a.tvz || 0) > 0.5) { ai.path = null; ai.blocked = (ai.blocked || 0) + 1; } else ai.blocked = 0; ai.lastPos = [a.x, a.z]; ai.stuckT = 0; }
  }

  // ================================================================ human AI
  function weaponOf(a) { const w = a.weaponUid ? a.inv.find(i => i.uid === a.weaponUid) : null; return w ? { it: w, d: IT[w.id] } : null; }
  function preferRange(w) { if (!w) return [1, 2]; const d = w.d; if (d.pellets) return [5, 12]; if (d.slot === 'pistol') return [7, 16]; if (d.id === 'mp5') return [8, 22]; return [12, 32]; }
  function findCover(g, a, tx, ty, tz) {
    const W = g.W; let best = null, bs = -Infinity;
    const [rmin, rmax] = preferRange(weaponOf(a));
    for (const rad of [3, 6, 10, 14]) for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + rad, x = a.x + Math.cos(ang) * rad, z = a.z + Math.sin(ang) * rad;
      const c = W.cellOf(x, z); if (c < 0 || !W.navOK[c] || W.navCost[c] > 2) continue;
      const y = W.navH[c];
      if (Math.abs(y - a.y) > 3) continue;
      const dt = Math.hypot(tx - x, tz - z); if (dt < 4) continue;
      // covered while crouching, able to shoot when standing
      if (W.los(tx, ty, tz, x, y + 0.9, z)) continue;
      const peek = W.los(tx, ty, tz, x, y + 1.55, z);
      let s = -rad * 0.6 + (peek ? 6 : 0) - Math.abs(dt - (rmin + rmax) / 2) * 0.25;
      if (a.leash > 0 && Math.hypot(x - a.home.x, z - a.home.z) > a.leash) s -= 20;
      if (s > bs) { bs = s; best = { x, z, peek }; }
    }
    return best;
  }
  function humanShoot(g, a, dt) {
    const ai = a.ai, w = weaponOf(a); if (!w) return;
    ai.shootT -= dt;
    if (ai.reloadT > 0) { ai.reloadT -= dt; if (ai.reloadT <= 0) w.it.mag = w.d.mag; return; }
    if (w.it.mag <= 0) { ai.reloadT = w.d.reload * 1.2; bark(g, a, BARK.reload); g.emit({ t: 'sound', s: 'reload_npc', x: a.x, y: a.y + 1.3, z: a.z, vol: 0.7 }); return; }
    if (ai.shootT > 0 || ai.reactT > 0) return;
    const t = ai.target, q = posOf(g, t), ty = chestOf(g, t);
    const ex = a.x, ey = eyeOf(a) - 0.1, ez = a.z;
    const dx = q.x - ex, dy = ty - ey, dz = q.z - ez, d = Math.hypot(dx, dy, dz);
    const yawTo = Math.atan2(dx, dz); if (Math.abs(wrapAng(yawTo - a.yaw)) > 0.35) return;
    const tMove = t === 'player' ? Math.hypot(g.player.vx, g.player.vz) : Math.hypot(t.vx, t.vz);
    const errDeg = ((1.3 - a.acc) * 3.4 / g.sk.acc) + w.d.spread * 0.45 + (tMove > 2 ? 1.4 : 0) + (d > 45 ? 1.2 : 0) + (Math.hypot(a.vx, a.vz) > 1.5 ? 1.6 : 0) + ai.firstShot * 2.5 + (t === 'player' && g.player.crouch > 0.5 ? 0.6 : 0);
    ai.firstShot = Math.max(0, ai.firstShot - 0.35);
    const dir = g.coneDir([dx / d, dy / d, dz / d], errDeg * Math.PI / 180);
    const pellets = w.d.pellets ? 6 : 1;
    for (let k = 0; k < pellets; k++) g.bullet(a, ex, ey, ez, pellets > 1 ? g.coneDir(dir, w.d.spread * 0.9 * Math.PI / 180) : dir, w.d.dmg * 0.7, 0, 1, k === 0);
    w.it.mag--;
    g.emit({ t: 'npcfire', uid: a.uid, w: w.it.id, x: ex + Math.sin(a.yaw) * 0.6, y: ey, z: ez + Math.cos(a.yaw) * 0.6 });
    g.emit({ t: 'sound', s: IT[w.it.id].sound, x: ex, y: ey, z: ez, vol: 1 });
    a.recoil = 1;
    // bursts for automatic weapons
    if (w.d.modes && w.d.modes[0] === 'a') {
      ai.burst--;
      if (ai.burst <= 0) { ai.burst = 2 + Math.floor(g.rng() * 4); ai.shootT = 0.45 + g.rng() * 0.8; }
      else ai.shootT = 60 / w.d.rpm;
    } else ai.shootT = Math.max(60 / w.d.rpm, 0.35 + g.rng() * 0.6 + (pellets > 1 ? 0.5 : 0));
    // others hear it
    // gunfire carries: enemies come for the shooter, friends join against the same target
    if (!ai.noiseT || ai.noiseT <= 0) {
      ai.noiseT = 1;
      for (const o of g.actors) {
        if (o === a || o.dead || o.hidden || o.kind !== 'human' || o.ignore || o.ai.state !== 'idle') continue;
        const d = Math.hypot(o.x - a.x, o.z - a.z); if (d > 70) continue;
        const att = g.attitudeOf(o, a);
        if (att < 0) S.alertActor(g, o, a.x, a.z, 'noise');
        else if (att > 0 && d < 50 && (t === 'player' ? g.attitudeOf(o, 'player') < 0 : g.attitudeOf(o, t) < 0)) { if (g.W.los(o.x, o.y + 1.6, o.z, q.x, ty, q.z)) acquire(g, o, t, false); else S.alertActor(g, o, q.x, q.z, 'noise'); }
      }
    }
  }
  function humanCombat(g, a, dt) {
    const ai = a.ai, t = ai.target;
    if (!t || (t !== 'player' && (t.dead || t.hidden)) || (t === 'player' && g.player.dead)) { ai.state = 'alert'; ai.alertT = 8; ai.target = null; a.crouch = 0; return; }
    if (t !== 'player' && t.wounded) { ai.target = null; ai.state = 'idle'; return; }
    const vis = targetVisible(g, a), q = posOf(g, t);
    if (vis) { ai.seenT = 0; ai.lastSeen = { x: q.x, z: q.z }; } else ai.seenT += dt;
    ai.reactT = Math.max(0, ai.reactT - dt);
    const dist = Math.hypot(q.x - a.x, q.z - a.z), w = weaponOf(a), [rmin, rmax] = preferRange(w);
    // face the target (or the last known position)
    const lx = vis ? q.x : ai.lastSeen.x, lz = vis ? q.z : ai.lastSeen.z;
    ai.decT -= dt; ai.coverT -= dt; ai.nadeT -= dt;
    if (ai.decT <= 0) {
      ai.decT = 0.5 + g.rng() * 0.4;
      const leashOK = (x, z) => a.leash <= 0 ? Math.hypot(x - a.home.x, z - a.home.z) < 1.5 : Math.hypot(x - a.home.x, z - a.home.z) < a.leash + 8;
      if (ai.seenT > 14) { ai.state = 'alert'; ai.alertT = 12; bark(g, a, BARK.lost); a.crouch = 0; ai.path = null; return; }
      if (a.leash > 0 && !leashOK(a.x, a.z)) { pathTo(g, a, a.home.x, a.home.z); ai.cover = null; }
      else if (a.leash <= 0) { ai.path = null; }
      else if (!vis && ai.seenT > 3) {
        // lost sight: grenade or advance on the last known position
        const dl = Math.hypot(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z);
        const nade = a.inv.find(i => IT[i.id] && IT[i.id].kind === 'grenade');
        if (nade && ai.nadeT <= 0 && dl > 8 && dl < 28 && t === 'player') { a.inv.splice(a.inv.indexOf(nade), 1); g.npcThrow(a, ai.lastSeen.x, ai.lastSeen.z, nade.id); bark(g, a, BARK.grenade, true); ai.nadeT = 20; }
        else if (leashOK(ai.lastSeen.x, ai.lastSeen.z)) { pathTo(g, a, ai.lastSeen.x + (g.rng() - 0.5) * 3, ai.lastSeen.z + (g.rng() - 0.5) * 3); ai.cover = null; a.crouch = 0; }
      } else if (vis) {
        const needCover = !ai.cover || ai.coverT <= 0 || (ai.hurtT > 0 && g.rng() < 0.5);
        if (needCover && (dist < rmax * 1.4)) {
          const c = findCover(g, a, q.x, (t === 'player' ? g.player.y : t.y) + 1.5, q.z);
          if (c) { ai.cover = c; ai.coverT = 5 + g.rng() * 5; pathTo(g, a, c.x, c.z, 1500); }
          else { ai.cover = null; ai.coverT = 2; }
        }
        if (!ai.cover) {
          // no cover: close in or back off to preferred range, strafing
          if (dist > rmax && leashOK(q.x, q.z)) pathTo(g, a, q.x, q.z, 2500);
          else if (dist < rmin * 0.6) { const ang = Math.atan2(a.x - q.x, a.z - q.z); const bx = a.x + Math.sin(ang) * 5, bz = a.z + Math.cos(ang) * 5; if (g.W.walkableAt(bx, bz)) pathTo(g, a, bx, bz, 800); }
          else { ai.path = null; ai.strafeT -= 0.5; if (ai.strafeT <= 0) { ai.strafe = -ai.strafe; ai.strafeT = 1 + g.rng() * 2; } }
        }
        // grenade at campers
        const nade = a.inv.find(i => IT[i.id] && IT[i.id].kind === 'grenade');
        if (nade && ai.nadeT <= 0 && dist > 9 && dist < 26 && g.rng() < 0.2) { a.inv.splice(a.inv.indexOf(nade), 1); g.npcThrow(a, q.x, q.z, nade.id); bark(g, a, BARK.grenade, true); ai.nadeT = 25; }
      }
    }
    // movement
    let speed = 3.6;
    const arrived = follow(g, a, speed, false);
    if (!ai.path && !ai.cover && vis && ai.strafe) { const rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw), sx = a.x + rx * ai.strafe * 1.5, sz = a.z + rz * ai.strafe * 1.5; if (g.W.walkableAt(sx, sz)) { a.tvx = rx * ai.strafe * 1.8; a.tvz = rz * ai.strafe * 1.8; } else { ai.strafe = -ai.strafe; a.tvx = a.tvz = 0; } }
    // in cover: crouch-hide, then peek and shoot
    if (ai.cover && arrived) {
      ai.peekT = (ai.peekT || 0) - dt;
      if (ai.peekT <= 0) { ai.peek = !ai.peek; ai.peekT = ai.peek ? 1.8 + g.rng() * 2.2 : 1.0 + g.rng() * 1.6; }
      if (ai.reloadT > 0) ai.peek = false;
      a.crouch = ai.peek ? (ai.cover.peek ? 0 : 1) : 1;
    } else a.crouch = Math.max(0, a.crouch - dt * 3);
    turnTo(a, Math.atan2(lx - a.x, lz - a.z), 5);
    if (vis && (!ai.cover || !arrived || ai.peek)) humanShoot(g, a, dt);
    else if (ai.reloadT > 0) humanShoot(g, a, dt);
  }
  function humanIdle(g, a, dt) {
    const ai = a.ai, W = g.W, p = g.player;
    a.sitting = false; a.talk = Math.max(0, a.talk - dt);
    const toHome = Math.hypot(a.x - a.home.x, a.z - a.home.z);
    const dPl = Math.hypot(a.x - p.x, a.z - p.z);
    switch (a.beh) {
      case 'trader': case 'guard': {
        if (toHome > 1.2) { if (!ai.path || ai.pathT <= 0) { pathTo(g, a, a.home.x, a.home.z, 1500); ai.pathT = 3; } ai.pathT -= dt; follow(g, a, 1.6); }
        else { a.tvx = a.tvz = 0; ai.path = null; let yaw = a.home.yaw; if (dPl < 6 && g.attitudeOf(a, 'player') >= 0 && !p.dead) yaw = Math.atan2(p.x - a.x, p.z - a.z); else if (ai.lookAt && ai.lookAt.t > 0) { yaw = Math.atan2(ai.lookAt.x - a.x, ai.lookAt.z - a.z); ai.lookAt.t -= dt; } else yaw += Math.sin(g.realT * 0.3 + a.uid) * 0.5; turnTo(a, yaw, 2.5); }
        break;
      }
      case 'camp': {
        if (toHome > 1.0) { if (!ai.path) pathTo(g, a, a.home.x, a.home.z, 1500); if (follow(g, a, 1.6)) ai.path = null; }
        else { a.tvx = a.tvz = 0; a.sitting = true; turnTo(a, a.home.yaw, 2); ai.jokeT -= dt; if (ai.jokeT <= 0 && dPl < 12) { ai.jokeT = 40 + g.rng() * 50; bark(g, a, BARK.joke, true); } }
        break;
      }
      case 'patrol': {
        const pts = g.def.paths[a.pathId]; if (!pts) { a.beh = 'guard'; break; }
        if (!ai.path) pathTo(g, a, pts[ai.patrolI % pts.length][0], pts[ai.patrolI % pts.length][1], 1500);
        if (follow(g, a, 1.5)) { ai.patrolI++; ai.path = null; ai.waitT = 1 + g.rng() * 3; }
        if (ai.waitT > 0) { ai.waitT -= dt; a.tvx = a.tvz = 0; }
        break;
      }
      case 'wander': {
        ai.wanderT -= dt;
        if (ai.wanderT <= 0) { ai.wanderT = 8 + g.rng() * 10; const ang = g.rng() * 6.28, r = g.rng() * (a.leash || 10); pathTo(g, a, a.home.x + Math.cos(ang) * r, a.home.z + Math.sin(ang) * r, 1200); }
        if (follow(g, a, 1.4)) ai.path = null;
        break;
      }
      case 'hostage': a.tvx = a.tvz = 0; a.sitting = true; turnTo(a, a.home.yaw, 2); break;
      case 'wounded': a.tvx = a.tvz = 0; if (!a.wounded) { a.wounded = true; a.storyWound = true; } break;
      case 'assault': case 'goto': {
        const tg = a.target || a.goal; if (!tg) { a.beh = 'guard'; break; }
        if (!ai.path || ai.pathT <= 0) { pathTo(g, a, tg[0], tg[1], 6000); ai.pathT = 6; }
        ai.pathT -= dt;
        if (follow(g, a, a.beh === 'assault' ? 3.6 : 2.6) || Math.hypot(a.x - tg[0], a.z - tg[1]) < 3) { a.home = { x: a.x, z: a.z, yaw: a.yaw }; a.beh = a.after || 'guard'; ai.path = null; if (a.onArrive && S.QUESTS && S.QUESTS.onArrive) S.QUESTS.onArrive(g, a); }
        break;
      }
      case 'follow': {
        const d = dPl;
        if (d > 5) { if (!ai.path || ai.pathT <= 0) { pathTo(g, a, p.x, p.z, 3000); ai.pathT = 1.5; } ai.pathT -= dt; follow(g, a, d > 12 ? 3.6 : 2.2); }
        else { a.tvx = a.tvz = 0; ai.path = null; turnTo(a, Math.atan2(p.x - a.x, p.z - a.z), 3); }
        break;
      }
      default: a.tvx = a.tvz = 0;
    }
    // restricted zones: neutral soldiers warn, then open fire
    if (a.attitude === 'neutral' && a.group && S.QUESTS && S.QUESTS.guardZone) S.QUESTS.guardZone(g, a, dt);
    // friendly greeting
    if (dPl < 4 && g.attitudeOf(a, 'player') > 0 && a.beh !== 'camp' && !a.dialog && ai.barkT <= 0 && g.rng() < 0.01) bark(g, a, BARK.greet);
  }
  function humanAlert(g, a, dt) {
    const ai = a.ai; ai.alertT -= dt; a.sitting = false;
    if (ai.alertT <= 0 || !ai.lastSeen) { ai.state = 'idle'; ai.path = null; ai.sus = 0; a.crouch = 0; return; }
    const d = Math.hypot(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z);
    if (a.leash <= 0) { turnTo(a, Math.atan2(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z), 3); a.tvx = a.tvz = 0; return; }
    if (d > 3 && Math.hypot(ai.lastSeen.x - a.home.x, ai.lastSeen.z - a.home.z) < a.leash + 25) { if (!ai.path) pathTo(g, a, ai.lastSeen.x, ai.lastSeen.z, 2500); follow(g, a, 2.4); a.crouch = 0.6; }
    else { a.tvx = a.tvz = 0; turnTo(a, a.yaw + Math.sin(g.realT * 0.8 + a.uid) * 1.5, 1.5); }
  }
  function humanWounded(g, a, dt) {
    a.tvx = a.tvz = 0; a.crouch = 0;
    if (!a.storyWound) {
      a.woundT -= dt;
      if (a.woundT <= 0) { die(g, a, null, 'bleed'); return; }
    }
    if (a.ai.barkT <= 0 && Math.hypot(a.x - g.player.x, a.z - g.player.z) < 14) bark(g, a, BARK.wounded);
  }
  function updateHuman(g, a, dt) {
    const ai = a.ai;
    ai.barkT -= dt; ai.hurtT = Math.max(0, (ai.hurtT || 0) - dt); ai.noiseT = (ai.noiseT || 0) - dt; a.recoil = Math.max(0, (a.recoil || 0) - dt * 6); a.flash = Math.max(0, (a.flash || 0) - dt);
    if (a.wounded) { humanWounded(g, a, dt); return; }
    ai.percT -= dt;
    if (ai.percT <= 0) { ai.percT = 0.25; if (!a.ignore) perceive(g, a); if (ai.firstShot == null) ai.firstShot = 1; }
    if (ai.state === 'combat') humanCombat(g, a, dt);
    else if (ai.state === 'alert') humanAlert(g, a, dt);
    else humanIdle(g, a, dt);
    if (ai.state !== 'combat') { ai.firstShot = 1; if (ai.reloadT > 0) { ai.reloadT -= dt; if (ai.reloadT <= 0) { const w = weaponOf(a); if (w) w.it.mag = w.d.mag; } } }
  }

  // ================================================================ mutant AI
  function updateMutant(g, a, dt) {
    const ai = a.ai, M = D.MUTANTS[a.type];
    ai.hurtT = Math.max(0, (ai.hurtT || 0) - dt); a.flash = Math.max(0, (a.flash || 0) - dt); ai.attackT -= dt; ai.fleeT -= dt;
    a.anim = a.anim || {};
    a.biteT = Math.max(0, (a.biteT || 0) - dt * 3);
    if (M.invis) { ai.visT = Math.max(0, (ai.visT || 0) - dt); a.invis = clamp(a.invis + (ai.visT > 0 || ai.state !== 'hunt' ? -dt * 2 : dt * 1.2), 0, 1); if (ai.state !== 'hunt') a.invis = 0; }
    ai.percT -= dt;
    if (ai.percT <= 0) { ai.percT = 0.3; perceive(g, a); }
    // fleeing
    if (ai.state === 'hunt' && M.flee && a.hp < a.maxHp * M.flee && ai.fleeT < -8) { ai.fleeT = 5 + g.rng() * 3; }
    if (ai.fleeT > 0 && ai.target) {
      const q = posOf(g, ai.target), ang = Math.atan2(a.x - q.x, a.z - q.z);
      a.tvx = Math.sin(ang) * M.speed; a.tvz = Math.cos(ang) * M.speed; turnTo(a, ang, 8); a.running = 1;
      if (ai.fleeT < 0.1) ai.fleeT = -0.1;
      return;
    }
    a.running = 0;
    if (ai.state === 'hunt') {
      const t = ai.target;
      if (!t || (t !== 'player' && (t.dead || t.hidden)) || (t === 'player' && g.player.dead)) { ai.state = 'idle'; ai.target = null; return; }
      const q = posOf(g, t), dx = q.x - a.x, dz = q.z - a.z, d = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
      const vis = g.W.los(a.x, eyeOf(a), a.z, q.x, chestOf(g, t), q.z);
      if (vis) ai.seenT = 0; else ai.seenT += dt;
      if (ai.seenT > 12 || Math.hypot(a.x - a.home.x, a.z - a.home.z) > a.homeR + 90) { ai.state = 'idle'; ai.target = null; ai.path = null; return; }
      const reach = M.reach + (t === 'player' ? g.player.r : t.r);
      // attack
      if (d < reach && ai.attackT <= 0 && Math.abs(wrapAng(ang - a.yaw)) < 0.8) {
        ai.attackT = M.rate * (0.8 + g.rng() * 0.5); a.biteT = 1;
        if (t === 'player') { g.hurtPlayer(M.dmg, 'bite', a); g.player.bleed = Math.min(4, g.player.bleed + M.bleed * (1 - g.prot('tear'))); if (M.charge) { g.player.vx += Math.sin(ang) * 6; g.player.vz += Math.cos(ang) * 6; g.player.vy = 3; } }
        else S.damageActor(g, t, M.dmg * 1.3, 'bite', a, [dx / d, 0, dz / d], M.charge ? 3 : 0);
        g.emit({ t: 'sound', s: 'm_attack_' + a.type, x: a.x, y: a.y + 0.5, z: a.z });
        if (M.pack) { ai.retreatT = 0.7 + g.rng() * 0.5; }
        if (M.charge) { ai.chargeT = 0; ai.passT = 0.8; }
        if (M.invis) ai.visT = 1.2;
      }
      let tx = q.x, tz = q.z, speed = M.speed;
      if (M.pack && t === 'player') {
        // circle the prey and bite by turns
        let biting = 0; for (const o of g.nearby) if (o !== a && o.kind === 'mutant' && !o.dead && o.ai.state === 'hunt' && o.ai.lunge) biting++;
        if (ai.retreatT > 0) { ai.retreatT -= dt; ai.lunge = false; const ra = ang + Math.PI + ai.orbit * 0.6; tx = a.x + Math.sin(ra) * 4; tz = a.z + Math.cos(ra) * 4; }
        else if (d > 7 || ai.lunge) { if (d < 7 && !ai.lunge && biting < 2) ai.lunge = true; if (d > 9) ai.lunge = false; }
        else {
          if (biting < 2 && ai.attackT <= 0 && g.rng() < 0.03) ai.lunge = true;
          const oa = Math.atan2(a.x - q.x, a.z - q.z) + ai.orbit * 0.9;
          tx = q.x + Math.sin(oa) * 4.5; tz = q.z + Math.cos(oa) * 4.5; speed = M.speed * 0.7;
          if (g.rng() < 0.005) ai.orbit = -ai.orbit;
        }
        if (M.leap && ai.lunge && d < 5 && d > 2.5 && a.ground && ai.attackT <= 0.2) { a.vy = 5; a.vx = Math.sin(ang) * 10; a.vz = Math.cos(ang) * 10; a.ground = false; a.leapT = 0.5; }
      } else if (M.charge) {
        ai.passT = (ai.passT || 0) - dt;
        if (ai.passT > 0) { tx = a.x + Math.sin(a.yaw) * 5; tz = a.z + Math.cos(a.yaw) * 5; }
      } else if (M.invis && ai.hurtT > 0 && g.rng() < 0.1) ai.retreatT = 1.2;
      if (M.invis && ai.retreatT > 0) { ai.retreatT -= dt; const ra = ang + Math.PI + 0.7; tx = a.x + Math.sin(ra) * 5; tz = a.z + Math.cos(ra) * 5; }
      // navigate: straight when clear, else A*
      const direct = vis && d < 25 && g.W.walkLine(g.W.cellOf(a.x, a.z), g.W.cellOf(tx, tz));
      if (direct || g.W.cellOf(a.x, a.z) < 0) {
        const mx = tx - a.x, mz = tz - a.z, md = Math.hypot(mx, mz) || 1;
        a.tvx = mx / md * speed * (md < 0.3 ? 0 : 1); a.tvz = mz / md * speed * (md < 0.3 ? 0 : 1); ai.path = null;
        turnTo(a, (M.pack && d < 7 && !ai.lunge) ? ang : Math.atan2(mx, mz), 9);
      } else {
        ai.pathT -= dt;
        if (!ai.path || ai.pathT <= 0) { pathTo(g, a, q.x, q.z, 2500); ai.pathT = 0.8; }
        follow(g, a, speed);
      }
      a.running = 1;
      if (a.leapT > 0) { a.leapT -= dt; a.tvx = a.vx; a.tvz = a.vz; }
      ai.growlT = (ai.growlT || 0) - dt; if (ai.growlT <= 0) { ai.growlT = 2 + g.rng() * 3; g.emit({ t: 'sound', s: 'm_idle_' + a.type, x: a.x, y: a.y + 0.5, z: a.z, vol: 0.8 }); }
      return;
    }
    if (ai.state === 'alert') {
      ai.alertT -= dt;
      if (ai.alertT <= 0 || !ai.lastSeen) { ai.state = 'idle'; ai.path = null; return; }
      if (!ai.path) pathTo(g, a, ai.lastSeen.x, ai.lastSeen.z, 2000);
      if (follow(g, a, M.walk * 1.8)) ai.alertT = Math.min(ai.alertT, 2);
      return;
    }
    // idle: roam around home
    ai.wanderT -= dt;
    if (ai.wanderT <= 0) { ai.wanderT = 6 + g.rng() * 12; if (g.rng() < 0.7) { const ang = g.rng() * 6.28, r = g.rng() * a.homeR; pathTo(g, a, a.home.x + Math.cos(ang) * r, a.home.z + Math.sin(ang) * r, 1000); } else ai.path = null; }
    if (follow(g, a, M.walk)) { a.tvx = a.tvz = 0; ai.path = null; }
    ai.growlT = (ai.growlT || 0) - dt; if (ai.growlT <= 0) { ai.growlT = 6 + g.rng() * 10; if (Math.hypot(a.x - g.player.x, a.z - g.player.z) < 40) g.emit({ t: 'sound', s: 'm_idle_' + a.type, x: a.x, y: a.y + 0.5, z: a.z, vol: 0.6 }); }
  }

  // ================================================================ update all
  S.updateActors = function (g) {
    const p = g.player, dt = DT;
    for (const a of g.actors) {
      if (a.hidden) continue;
      if (a.dead) {
        a.deadT += dt;
        if (a.deadT < 3) { a.tvx = a.tvz = 0; a.vx *= 0.9; a.vz *= 0.9; g.W.move(a, dt); }
        continue;
      }
      const far = Math.abs(a.x - p.x) > 170 || Math.abs(a.z - p.z) > 170;
      // skip far idle actors on most frames
      if (far && a.ai.state === 'idle') { a.ai.farT = (a.ai.farT || 0) - dt; if (a.ai.farT > 0) continue; a.ai.farT = 0.5; }
      g.nearby = g.actors.filter(o => o !== a && Math.abs(o.x - a.x) < 3 && Math.abs(o.z - a.z) < 3);
      const edt = far && a.ai.state === 'idle' ? 0.5 : dt;
      if (a.kind === 'human') updateHuman(g, a, edt); else updateMutant(g, a, edt);
      moveBody(g, a);
      // lethal falls & anomalies are handled elsewhere; keep anim params
      const sp = Math.hypot(a.vx, a.vz);
      a.anim = { walk: a.walk || 0, move: clamp(sp / (a.kind === 'mutant' ? 2 : 1.6), 0, 1), run: clamp((sp - 2.2) / 2, 0, 1), crouch: a.crouch, aim: a.ai.state === 'combat' ? 1 : 0, sit: a.sitting ? 1 : 0, lie: a.wounded ? 1 : 0,
        t: g.realT + (a.uid % 97), recoil: a.recoil || 0, attack: a.biteT || 0, leap: a.leapT > 0 ? 1 : 0, talk: a.talk > 0 ? 1 : 0, guitar: a.guitar && a.sitting, hands: a.beh === 'hostage', look: 0 };
    }
    g.nearby = [];
  };
  S.updateMutant = updateMutant; S.updateHuman = updateHuman; S.acquire = acquire; S.dieActor = die; S.weaponOfActor = weaponOf;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
