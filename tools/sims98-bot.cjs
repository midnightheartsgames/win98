const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const LOGIC = ['ts-core', 'ts-data', 'ts-camera', 'ts-terrain', 'ts-placeholder', 'ts-style', 'ts-dummy', 'ts-house', 'ts-house-mesh', 'ts-body', 'ts-clips', 'ts-nav', 'ts-sim', 'ts-skin', 'ts-objects', 'ts-ads', 'ts-social', 'ts-skills', 'ts-food', 'ts-econ', 'ts-fish', 'ts-garden', 'ts-collect', 'ts-art-craft', 'ts-jobs', 'ts-upkeep', 'ts-services', 'ts-opps', 'ts-moodlets', 'ts-traits', 'ts-wishes', 'ts-acts', 'ts-sample', 'ts-town', 'ts-game', 'ts-save', 'ts-sprite-index'];
for (const f of LOGIC) require(path.join(ROOT, 'js/apps/sims98', f + '.js'));
const S = globalThis.Sims98;
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/sims98/models/sample.json'), 'utf8'));

const options = () => {
  const out = {};
  for (const a of process.argv.slice(3)) {
    const m = a.match(/^--([a-z]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
};

const crc = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return buf => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

const chunk = (type, data) => {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]), tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc(body));
  return Buffer.concat([head, body, tail]);
};

const writePng = (file, w, h, rgb) => {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
};

const inputFor = (rng, game) => {
  const w = game.world, who = Math.floor(S.roll(rng) * 5), r = S.roll(rng), run = S.roll(rng) < 0.2, lotIndex = Math.floor(S.roll(rng) * w.lots.length);
  if (r < 0.35) return { who, kind: 'door', lot: lotIndex, run };
  if (r < 0.5) return { who, kind: 'use', slot: Math.floor(S.roll(rng) * 1000), run };
  if (r < 0.65) return { who, kind: 'upstairs', run };
  if (r < 0.8) return { who, kind: 'enter', slot: Math.floor(S.roll(rng) * 1000), run };
  return { who, kind: 'land', x: Math.floor(S.roll(rng) * S.METRICS.town), z: Math.floor(S.roll(rng) * S.METRICS.town), run };
};

const giveInput = (game, input) => {
  const w = game.world, sim = w.sims[input.who], main = w.lots[0], run = input.run;
  game.active = sim;
  if (input.kind === 'door') {
    const lot = w.lots[input.lot];
    S.Acts.add(w, sim, S.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, run }, true));
  } else if (input.kind === 'use') {
    const allowed = item => S.objectOf(item).ads.filter(id => S.adAllowed(S.ADS[id], sim.age));
    const items = main.house.items.filter(i => S.objectOf(i) && allowed(i).length), item = items[input.slot % items.length], ads = allowed(item);
    S.Acts.add(w, sim, S.Acts.adAct(ads[input.slot % ads.length], main, item));
  } else if (input.kind === 'upstairs') {
    S.Acts.add(w, sim, S.Acts.goAct({ x: main.x + 14.5, z: main.z + 6.5, floor: 1, lot: main, run }));
  } else if (input.kind === 'enter') {
    const closed = w.lots.filter(l => l.closed), lot = closed[input.slot % closed.length];
    S.Acts.add(w, sim, S.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: lot, run }, true));
  } else {
    S.Acts.add(w, sim, S.Acts.goAct(S.Town.goalAt(w, input.x + 0.5, input.z + 0.5, 0, run), true));
  }
};

const soakSeed = async (seed, days) => {
  const game = new S.Game(doc, seed), world = game.world, rng = { rs: (seed * 131 + 7) >>> 0 }, half = Math.ceil(days / 2) + 1, moving = new Set(['move', 'trip', 'drive']);
  const report = { seed, days, steps: 0, stuck: [], outAtNight: [], actStuck: [], staleRoute: [], carLost: [], badNeeds: [], fails: {}, accidents: 0, unreachable: 0, worstStepMs: 0, slowSteps: 0, roundTrip: null };
  const last = world.sims.map(s => [s.x, s.z]), still = world.sims.map(() => 0), nights = world.sims.map(() => 0), notes = world.sims.map(() => ''), lastAct = world.sims.map(() => null), actHours = world.sims.map(() => 0);
  let copy = null, lastHour = -1;
  S.Jobs.join(world, world.family[0], 'business', true);
  S.Jobs.join(world, world.family[1], 'crime', true);
  game.setSpeed(3);
  const started = performance.now();
  while (world.day <= days) {
    const fx = game.active.x, fz = game.active.z, t = performance.now();
    game.fixed(fx, fz);
    if (copy) copy.fixed(fx, fz);
    const took = performance.now() - t;
    if (took > 8) report.slowSteps++;
    if (took > report.worstStepMs) {
      report.worstStepMs = took;
      report.worstStepAt = world.day + ' ' + Math.round(world.clock);
    }
    report.steps++;
    for (const event of game.events.splice(0)) {
      if (event.type !== 'fail') continue;
      if (/туалет/.test(event.text)) report.accidents++;
      else report.fails[event.text] = (report.fails[event.text] || 0) + 1;
    }
    if (copy) copy.events.length = 0;
    const hour = world.day * 24 + Math.floor(world.clock / 60);
    if (hour === lastHour) continue;
    lastHour = hour;
    const input = inputFor(rng, game);
    giveInput(game, input);
    if (copy) giveInput(copy, input);
    world.sims.forEach((sim, i) => {
      if (!Number.isFinite(sim.x + sim.z + sim.y + sim.yaw)) throw new Error('broken numbers: ' + sim.id + ' on day ' + world.day);
      if (sim.car && !sim.after) report.carLost.push([sim.id, sim.state, world.day]);
      if (sim.note && notes[i] !== sim.note) report.unreachable++;
      notes[i] = sim.note;
      const same = moving.has(sim.state) && sim.x === last[i][0] && sim.z === last[i][1];
      still[i] = same ? still[i] + 1 : 0;
      if (still[i] === 2) report.stuck.push([sim.id, sim.state, world.day, Math.round(sim.x), Math.round(sim.z)]);
      last[i][0] = sim.x;
      last[i][1] = sim.z;
      if (!sim.needs) return;
      if (sim.state === 'idle' && sim.path) report.staleRoute.push([sim.id, world.day, Math.round(sim.x), Math.round(sim.z)]);
      if (S.NEED_ORDER.some(need => !(sim.needs[need] >= 0 && sim.needs[need] <= 100))) report.badNeeds.push([sim.id, world.day]);
      actHours[i] = sim.act && sim.act === lastAct[i] ? actHours[i] + 1 : 0;
      lastAct[i] = sim.act;
      if (actHours[i] === 12) report.actStuck.push([sim.id, sim.act.ad || 'go', sim.act.phase, sim.state, world.day, Math.round(sim.x), Math.round(sim.z), ['order', 'path', 'car', 'trip', 'wantUp', 'inside', 'seat'].filter(k => sim[k]).join()]);
    });
    if (hour % 24 === 3) {
      world.sims.forEach((sim, i) => {
        if (!sim.free) return;
        nights[i] = sim.inside === sim.home ? 0 : nights[i] + 1;
        if (nights[i] === 2) report.outAtNight.push([sim.id, sim.state, world.day, Math.round(sim.x), Math.round(sim.z)]);
      });
    }
    if (!copy && world.day === half) {
      const file = await S.Save.decode(await S.Save.encode(S.Save.file(game, null)));
      copy = new S.Game(doc, seed);
      S.Save.apply(copy, file);
      copy.setSpeed(game.speed);
    }
  }
  report.seconds = +((performance.now() - started) / 1000).toFixed(1);
  report.worstStepMs = +report.worstStepMs.toFixed(2);
  report.hash = game.hash();
  report.roundTrip = copy ? copy.hash() === report.hash : null;
  const t = performance.now(), file = S.Save.file(game, null), json = JSON.stringify(file).length, packMs = performance.now() - t, bytes = await S.Save.encode(file);
  report.saveJson = json;
  report.saveGzip = bytes.length;
  report.packMs = +packMs.toFixed(2);
  report.states = {};
  for (const sim of world.sims) {
    const key = sim.inside ? 'inside' : sim.state;
    report.states[key] = (report.states[key] || 0) + 1;
  }
  report.heapMb = Math.round(process.memoryUsage().heapUsed / 1048576);
  return report;
};

const COMMANDS = {
  life(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 5, size = +opts.family || 2, seed = +opts.seed || 1, game = new S.Game(doc, seed), world = game.world, home = world.lots[0], away = world.family.slice(size);
    for (const sim of away) {
      sim.inside = home;
      sim.needs = null;
    }
    world.family = world.family.slice(0, size);
    game.setSpeed(3);
    const report = world.family.map(sim => ({ id: sim.id, low: {}, sum: {}, min: {}, acts: {}, fails: 0, accidents: 0, stuck: 0, moodSum: 0, moodMin: Infinity, moodLow: 0, moodlets: new Set() })), hours = world.family.map(() => 0);
    const lastAct = world.family.map(() => null), sameFor = world.family.map(() => 0);
    let lastHour = -1, samples = 0;
    while (world.day <= days) {
      game.fixed(world.family[0].x, world.family[0].z);
      for (const event of game.events.splice(0)) {
        if (event.type !== 'fail') continue;
        const row = report.find(r => r.id === event.sim);
        if (!row) continue;
        if (/туалет/.test(event.text)) row.accidents++;
        else row.fails++;
      }
      const hour = world.day * 24 + Math.floor(world.clock / 60);
      world.family.forEach((sim, i) => {
        const act = sim.act, name = act ? act.ad || 'go' : null;
        if (act && act !== lastAct[i]) {
          lastAct[i] = act;
          report[i].acts[name] = (report[i].acts[name] || 0) + 1;
          sameFor[i] = 0;
        }
      });
      if (hour === lastHour) continue;
      lastHour = hour;
      samples++;
      world.family.forEach((sim, i) => {
        const row = report[i];
        for (const need of S.NEED_ORDER) {
          const value = sim.needs[need];
          row.sum[need] = (row.sum[need] || 0) + value;
          row.min[need] = Math.min(row.min[need] === undefined ? 100 : row.min[need], Math.round(value));
          if (value < 15) row.low[need] = (row.low[need] || 0) + 1;
        }
        const mood = S.Moods.mood(sim);
        row.moodSum += mood;
        row.moodMin = Math.min(row.moodMin, mood);
        if (mood < 0) row.moodLow++;
        for (const entry of S.Moods.list(sim)) row.moodlets.add(entry.id);
        if (sim.act) sameFor[i]++;
        if (sameFor[i] === 12) {
          row.stuck++;
          row.stuckAt = [sim.act && (sim.act.ad || 'go'), sim.act && sim.act.phase, sim.act && sim.act.left, sim.state, world.day, Math.round(world.clock), Math.round(sim.x), Math.round(sim.z), sim.act && sim.act.with, ['order', 'path', 'car', 'trip', 'wantUp', 'inside', 'seat'].filter(k => sim[k]).join()];
        }
      });
    }
    let bad = 0;
    for (const row of report) {
      const mean = {};
      for (const need of S.NEED_ORDER) mean[need] = Math.round(row.sum[need] / samples);
      for (const need of S.NEED_ORDER) {
        if (mean[need] < 35) bad++;
        if ((row.low[need] || 0) / samples > 0.12) bad++;
      }
      if (row.stuck || row.accidents > days) bad++;
      const mood = { mean: Math.round(row.moodSum / samples), min: row.moodMin, belowZero: +(row.moodLow / samples).toFixed(2), moodlets: row.moodlets.size };
      if (mood.mean < 0 || mood.belowZero > 0.25) bad++;
      console.log(JSON.stringify({ id: row.id, mean, min: row.min, mood, lowHours: row.low, fails: row.fails, accidents: row.accidents, stuck: row.stuck, stuckAt: row.stuckAt, acts: row.acts }));
    }
    console.log('life: ' + days + ' days, family of ' + size + ', problems: ' + bad);
    if (bad) process.exitCode = 1;
  },

  econ(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const SELF_KINDS = new Set(['act', 'go', 'mood', 'moodAt', 'walked']), EASY_NEEDS = new Set(['any', 'met', 'friend']), STALE = 24 * 60;
    const walks = sim => S.Traits.pastimes(sim).map(([id]) => id).filter(id => S.Traits.PASTIME_GO[id]);
    const doable = (goal, sim) => {
      if (goal.kind === 'walked') return walks(sim).length > 0;
      if (goal.kind === 'go' && S.Traits.PASTIME_GO[goal.key]) return walks(sim).includes(goal.key);
      return SELF_KINDS.has(goal.kind) || (goal.kind === 'soc' && EASY_NEEDS.has(S.Social.SOCIALS[goal.key].need) && !S.Social.SOCIALS[goal.key].romance);
    };
    const days = +opts.days || 5, first = +opts.seed || 1, seeds = +opts.seeds || 4, JUDGE_DAYS = 5, PAY_AT = 18 * 60, FLOOR = 1500, PUPIL_FLOOR = 1000;
    const run = seed => {
      const game = new S.Game(doc, seed), world = game.world;
      game.setSpeed(3);
      const rows = world.family.map(sim => ({ id: sim.id, done: 0, offered: 0, fromWishes: 0, byDay: [] }));
      const money = { start: world.funds, min: world.funds, byWeek: [], bills: 0, paid: 0, repo: 0, earned: 0 };
      let lastHour = -1, paidDay = 0;
      while (world.day <= days) {
        game.fixed(world.family[0].x, world.family[0].z);
        for (const e of game.events.splice(0)) {
          if (e.type === 'money' && e.amount > 0) money.earned += e.amount;
          if (e.type === 'service' && /Коллектор забрал/.test(e.text)) money.repo++;
          if (e.type === 'service' && e.mail && /счета/.test(e.text)) money.bills++;
          if (e.type !== 'wish') continue;
          const row = rows.find(r => r.id === e.sim);
          row.done++;
          row.fromWishes += e.points;
        }
        if (world.clock >= PAY_AT && paidDay !== world.day && S.Services.due(world)) {
          paidDay = world.day;
          money.paid += S.Services.payBills(world, world.family[0]);
        }
        money.min = Math.min(money.min, world.funds);
        if (world.clock < 60 && (world.day - 1) % 7 === 0 && money.byWeek.length < (world.day - 1) / 7) money.byWeek.push(Math.round(world.funds));
        const hour = world.day * 24 + Math.floor(world.clock / 60);
        if (hour === lastHour) continue;
        lastHour = hour;
        world.family.forEach((sim, i) => {
          const w = sim.wish;
          while (w.offered.length && w.promised.length < S.Wishes.PROMISE_SLOTS) {
            const index = w.offered.findIndex(e => doable(S.WISHES[e.id].goal, sim));
            if (index < 0) break;
            rows[i].offered++;
            S.Wishes.promise(world, sim, index);
          }
          for (let k = w.promised.length - 1; k >= 0; k--) {
            const entry = w.promised[k];
            entry.botAge = (entry.botAge || 0) + 60;
            if (!doable(S.WISHES[entry.id].goal, sim) || entry.botAge > STALE) S.Wishes.dismiss(world, sim, k, true);
          }
          if (world.clock < 60 && rows[i].byDay.length < world.day) rows[i].byDay.push(Math.round(sim.happy));
        });
      }
      const judged = world.family.map((sim, i) => (days > JUDGE_DAYS ? rows[i].byDay[JUDGE_DAYS - 1] : Math.round(sim.happy)));
      money.end = Math.round(world.funds);
      money.min = Math.round(money.min);
      return { seed, family: world.family, rows, judged, money, mean: judged.reduce((s, v) => s + v, 0) / judged.length };
    };
    let bad = 0;
    const runs = [];
    for (let seed = first; seed < first + seeds; seed++) {
      const r = run(seed);
      runs.push(r);
      const meanOk = days < JUDGE_DAYS || (r.mean >= 3500 && r.mean <= 7500), moneyOk = !r.money.repo && r.money.min >= S.Econ.BROKE_AT;
      if (!meanOk || !moneyOk) bad++;
      if (opts.verbose) for (const [i, sim] of r.family.entries()) console.log(JSON.stringify({ seed, id: r.rows[i].id, happy: Math.round(sim.happy), ['after' + JUDGE_DAYS]: r.judged[i], fromWishes: r.rows[i].fromWishes, wishesDone: r.rows[i].done, promised: r.rows[i].offered, byDay: r.rows[i].byDay }));
      console.log((meanOk && moneyOk ? 'ok   ' : 'BAD  ') + 'seed ' + seed + ' after ' + JUDGE_DAYS + ' days ' + r.family.map((sim, i) => sim.id + ' ' + r.judged[i]).join(', ') + ', mean ' + Math.round(r.mean) + '; money ' + JSON.stringify(r.money));
    }
    const ids = runs[0].family.map(sim => sim.id), each = ids.map((id, i) => Math.round(runs.reduce((n, r) => n + r.judged[i], 0) / runs.length));
    ids.forEach((id, i) => {
      const floor = runs[0].family[i].school ? PUPIL_FLOOR : FLOOR, ok = days < JUDGE_DAYS || (each[i] >= floor && each[i] <= 10000);
      if (!ok) bad++;
      console.log((ok ? 'ok   ' : 'BAD  ') + id.padEnd(8) + 'mean over ' + seeds + ' seeds after ' + JUDGE_DAYS + ' days: ' + each[i] + ' (from ' + floor + ')');
    });
    console.log('econ: ' + days + ' days on seeds ' + first + ' to ' + (first + seeds - 1) + ', family mean after ' + JUDGE_DAYS + ' days ' + runs.map(r => Math.round(r.mean)).join(', ') + ' (target 3 500 to 7 500 on each seed, each sim 1 500 to 10 000 on average, a pupil from 1 000), bills paid every evening, no collector and never broke; out of range: ' + bad);
    if (bad) process.exitCode = 1;
  },

  social(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const hours = +opts.hours || 48, seed = +opts.seed || 1, STEP_MIN = S.SPEEDS[3] / 60;
    const PAIRS = [
      { name: 'friendly with friendly', who: 0, mine: ['friendly', 'goodHumor'], theirs: ['friendly', 'charismatic'], age: 'adult', want: r => r.v >= S.Rel.FRIEND },
      { name: 'mean with grumpy', who: 0, mine: ['meanSpirited', 'hotHeaded'], theirs: ['grumpy', 'hotHeaded'], age: 'adult', want: r => r.v < 0 },
      { name: 'flirty with flirty', who: 0, mine: ['flirty', 'charismatic'], theirs: ['flirty', 'friendly'], age: 'adult', want: r => r.romance },
      { name: 'joker with no humor', who: 0, mine: ['goodHumor'], theirs: ['noHumor'], age: 'adult', want: (r, all) => r.v < all['friendly with friendly'].v },
      { name: 'loner with loner', who: 0, mine: ['loner'], theirs: ['loner'], age: 'adult', want: (r, all) => r.lines < all['friendly with friendly'].lines },
      { name: 'teen with adult', who: 3, mine: ['hopelessRomantic', 'friendly'], theirs: ['flirty', 'friendly'], age: 'adult', want: r => r.romanceLines === 0 && !r.romance },
      { name: 'child with adult', who: 2, mine: ['goodHumor', 'friendly', 'artistic'], theirs: ['flirty', 'friendly'], age: 'adult', want: r => r.romanceLines === 0 && !r.romance },
      { name: 'teen with teen', who: 3, mine: ['hopelessRomantic', 'friendly'], theirs: ['hopelessRomantic', 'friendly'], age: 'teen', want: r => r.lines > 0 && r.adultLines === 0 }
    ];
    const spotNear = (world, sim) => {
      const lot = sim.lot;
      for (let r = 2; r <= 5; r++) {
        for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
          const x = sim.x + dx, z = sim.z + dz;
          if (lot.nav.isFree(sim.floor, Math.floor(x - lot.x), Math.floor(z - lot.z))) return [Math.floor(x) + 0.5, Math.floor(z) + 0.5];
        }
      }
      return [sim.x + 1, sim.z];
    };
    const all = {};
    let bad = 0;
    for (const pair of PAIRS) {
      const game = new S.Game(doc, seed), world = game.world, sim = world.family[pair.who], away = world.lots.find(l => l.kind === 'home' && l !== sim.home);
      for (const s of world.family) {
        if (s === sim) continue;
        Object.assign(s, { x: away.doorOut[0], z: away.doorOut[1], lot: null, inside: away, act: null, queue: [], order: null, path: null, state: 'idle' });
      }
      world.family = [sim];
      sim.traits = pair.mine.slice();
      const other = world.sims.find(s => s.free && s.age === pair.age && !s.car);
      other.traits = pair.theirs.slice();
      const [x, z] = spotNear(world, sim);
      Object.assign(other, { inside: null, live: true, trip: null, car: null, after: null, order: null, path: null, state: 'idle', day: null, hold: 0, x, z, floor: sim.floor, lot: sim.lot });
      other.y = S.Sim.groundY(world, other.floor, other.lot, other.x, other.z);
      if (!world.live.includes(other)) world.live.push(other);
      game.setSpeed(3);
      const sections = {}, lines = [];
      let lastA = null, lastB = null, romanceLines = 0, adultLines = 0;
      const note = (speaker, act) => {
        const row = S.Social.SOCIALS[act.ad];
        sections[row.section] = (sections[row.section] || 0) + 1;
        lines.push((speaker === sim ? '>' : '<') + act.ad);
        if (row.romance) romanceLines++;
        if (row.romance === 'adult') adultLines++;
      };
      for (let passed = 0; passed < hours * 60; passed += STEP_MIN) {
        game.fixed(sim.x, sim.z);
        game.events.length = 0;
        const a = sim.act;
        if (a && a !== lastA && a.ad && S.ADS[a.ad].person && !a.listen && a.with === world.sims.indexOf(other) && a.phase === 'run') {
          lastA = a;
          note(sim, a);
        }
        if (other.line && other.line !== lastB && other.line.with === world.sims.indexOf(sim)) {
          lastB = other.line;
          note(other, other.line);
        }
        if (sim.lot && other.lot !== sim.lot && !other.visit && passed % 60 < STEP_MIN) {
          const [nx, nz] = spotNear(world, sim);
          S.Sim.go(world, other, { x: nx, z: nz, floor: sim.floor, lot: sim.lot, car: false });
        }
      }
      const rel = S.Rel.get(world, sim, other);
      const row = { v: rel ? Math.round(rel.v) : 0, status: rel ? S.Rel.statusOf(world, rel) : 'stranger', romance: !!(rel && rel.f & (S.Rel.F.romance | S.Rel.F.couple)), lines: lines.length, romanceLines, adultLines, sections };
      all[pair.name] = row;
      const good = pair.want(row, all);
      if (!good) bad++;
      console.log(JSON.stringify(Object.assign({ pair: pair.name, ok: good }, row, { first: lines.slice(0, 12).join(' ') })));
    }
    console.log('social: ' + PAIRS.length + ' pairs, ' + hours + ' h each, not as expected: ' + bad);
    if (bad) process.exitCode = 1;
  },

  traits(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const hours = +opts.hours || 60, seed = +opts.seed || 1, only = opts.only ? String(opts.only).split(',') : null, STEP_MIN = S.SPEEDS[3] / 60;
    const nameOf = id => (S.Traits.PASTIME_GO[id] ? 'go:' + S.Traits.PASTIME_GO[id].mood : id);
    const runOne = (traits, partner, runSeed) => {
      const game = new S.Game(doc, runSeed || seed), world = game.world, sim = world.family[0];
      for (const s of world.family) s.traits = [];
      sim.traits = traits.slice();
      if (partner) world.family[1].traits = partner.slice();
      game.setSpeed(3);
      const acts = {}, reacts = {}, moods = new Set(), received = {}, seen = new Set(), me = world.sims.indexOf(sim);
      let last = null, asleep = 0, moodSum = 0, samples = 0;
      for (let passed = 0; passed < hours * 60; passed += STEP_MIN) {
        game.fixed(sim.x, sim.z);
        for (const e of game.events.splice(0)) if (e.type === 'react' && e.sim === sim.id) reacts[e.key] = (reacts[e.key] || 0) + 1;
        if (sim.act && sim.act !== last) {
          last = sim.act;
          const name = sim.act.ad || (sim.act.mood ? 'go:' + sim.act.mood : 'go');
          if (!sim.act.listen) acts[name] = (acts[name] || 0) + 1;
        }
        for (const other of world.family) {
          const a = other.act;
          if (other === sim || !a || a.listen || a.with !== me || a.phase !== 'run' || seen.has(a) || !S.Social.SOCIALS[a.ad]) continue;
          seen.add(a);
          const section = S.Social.SOCIALS[a.ad].section, row = received[section] || (received[section] = { n: 0, win: 0 });
          row.n++;
          row.win += a.win ? 1 : 0;
        }
        if (S.Acts.isAsleep(sim)) asleep += STEP_MIN;
        if (Math.floor(passed / 30) !== Math.floor((passed + STEP_MIN) / 30)) {
          for (const e of S.Moods.list(sim)) moods.add(e.id);
          moodSum += S.Moods.mood(sim);
          samples++;
        }
      }
      return { acts, reacts, moods, asleep, mood: moodSum / Math.max(1, samples), received };
    };
    const bases = { [seed]: runOne([]) }, useless = [];
    const flirtyBases = {};
    const look = (def, runSeed) => {
      const base = bases[runSeed] || (bases[runSeed] = runOne([], null, runSeed)), r = runOne([def.id], null, runSeed), signals = [];
      for (const [ad, factor] of Object.entries(def.likes)) {
        const name = nameOf(ad), mine = r.acts[name] || 0, theirs = base.acts[name] || 0;
        if (factor >= 1.5 && mine > theirs) signals.push('+' + name + ' ' + theirs + '>' + mine);
        if (factor <= 0.5 && theirs > 0 && mine < theirs) signals.push('-' + name + ' ' + theirs + '>' + mine);
      }
      for (const p of def.pastimes || []) {
        const name = nameOf(p);
        if ((r.acts[name] || 0) > (base.acts[name] || 0) && !signals.some(s => s.startsWith('+' + name))) signals.push('pastime ' + name);
      }
      const social = S.Social.TRAIT_SOCIAL[def.id];
      if (social && social.auto) {
        const count = (acts, key) => Object.entries(acts).reduce((n, [id, k]) => n + (S.Social.SOCIALS[id] && (id === key || S.Social.SOCIALS[id].section === key) ? k : 0), 0);
        for (const [key, factor] of Object.entries(social.auto)) {
          const mine = count(r.acts, key), theirs = count(base.acts, key);
          if (factor >= 1.5 && mine > theirs) signals.push('+' + key + ' ' + theirs + '>' + mine);
          if (factor <= 0.5 && theirs > 0 && mine < theirs) signals.push('-' + key + ' ' + theirs + '>' + mine);
        }
      }
      if (social && social.take) {
        const probe = social.take.romance !== undefined, mineRun = probe ? runOne([def.id], ['flirty'], runSeed) : r, baseRun = probe ? (flirtyBases[runSeed] || (flirtyBases[runSeed] = runOne([], ['flirty'], runSeed))) : base;
        for (const [key, bonus] of Object.entries(social.take)) {
          const mine = mineRun.received[key], theirs = baseRun.received[key];
          if (!mine || !theirs || mine.n < 3 || theirs.n < 3) continue;
          const rateMine = mine.win / mine.n, rateTheirs = theirs.win / theirs.n;
          if ((bonus < 0 && rateMine < rateTheirs) || (bonus > 0 && rateMine > rateTheirs)) signals.push('takes ' + key + ' ' + Math.round(rateTheirs * 100) + '%>' + Math.round(rateMine * 100) + '%');
        }
      }
      for (const [key, n] of Object.entries(r.reacts)) signals.push('react ' + key + ' ' + n);
      const own = new Set([def.link, ...(def.ignore || []), ...(def.double || []), ...Object.values(def.swap || {}), ...Object.values(def.after || {}), ...(def.pastimes || []).map(p => (S.ADS[p] && S.ADS[p].mood) || (S.Traits.PASTIME_GO[p] && S.Traits.PASTIME_GO[p].mood))]);
      const fresh = [...r.moods].filter(id => !base.moods.has(id) && (own.has(id) || S.MOODLETS[id].group === 'traits'));
      if (fresh.length) signals.push('moods ' + fresh.slice(0, 3).join(' '));
      if ((def.sleep || (def.needs && def.needs.energy)) && Math.abs(r.asleep - base.asleep) > 30) signals.push('sleep ' + Math.round(base.asleep) + '>' + Math.round(r.asleep));
      if ((def.good || def.plus || def.goodValue) && Math.abs(r.mood - base.mood) > 5) signals.push('mood ' + Math.round(base.mood) + '>' + Math.round(r.mood));
      return signals;
    };
    for (const def of Object.values(S.TRAITS)) {
      if (only && !only.includes(def.id)) continue;
      let signals = look(def, seed);
      if (!signals.length) signals = look(def, seed + 1).map(s => 'seed ' + (seed + 1) + ': ' + s);
      if (!signals.length) useless.push(def.id);
      console.log((signals.length ? 'ok  ' : 'NONE') + ' ' + def.id.padEnd(18) + S.Traits.name(def.id, 'm').padEnd(24) + signals.slice(0, 4).join(', '));
    }
    console.log('traits: ' + hours + ' h each, a second seed for a trait that shows nothing on the first, without a visible difference: ' + (useless.length ? useless.join(', ') : 'none'));
    if (useless.length) process.exitCode = 1;
  },

  skills(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 5, seed = +opts.seed || 1, FREE = 40, BODY = ['hunger', 'bladder', 'hygiene', 'energy'];
    const PRACTICE = { cooking: ['cook_meal', 'stove'], athletic: ['punchbag_hit', 'punchbag'], logic: ['chess_play', 'chess'], charisma: ['mirror_speech', 'bath_sink'] };
    const modelOf = item => (S.KINDS[S.KIND_ID[item.kind]] || {}).model;
    const leisure = act => !!act.ad && Object.entries(S.adGains(S.ADS[act.ad])).filter(([, v]) => v > 0).every(([need]) => need === 'fun' || need === 'social');
    const free = sim => !sim.queue.length && (!sim.act || (sim.act.auto && leisure(sim.act))) && !S.Acts.isAsleep(sim) && BODY.every(n => sim.needs[n] >= FREE);
    const train = (skill, traits, until, from) => {
      const game = new S.Game(doc, from || seed), world = game.world, sim = world.family[0], lot = sim.home, [ad, model] = PRACTICE[skill], item = lot.house.items.find(i => modelOf(i) === model);
      sim.traits = traits.slice();
      game.setSpeed(3);
      const row = { skill, seed: from || seed, traits: traits.join('/') || '-', byDay: [], orders: 0, fails: 0, meals: 0, quality: {}, firstPerfect: null, fires: 0, burnt: 0, cleaned: 0 };
      let day = world.day, moodSum = 0, samples = 0, lastHour = -1, wait = 0;
      while (world.day <= until) {
        game.fixed(sim.x, sim.z);
        for (const e of game.events.splice(0)) {
          if (e.type === 'fail' && e.sim === sim.id) {
            row.fails++;
            wait = world.day * 1440 + world.clock + 30;
          }
          if (e.type === 'meal' && e.sim === sim.id && e.quality !== undefined) {
            row.meals++;
            const name = S.Food.QUALITY[e.quality];
            row.quality[name] = (row.quality[name] || 0) + 1;
            if (e.quality === S.Food.PERFECT_Q && !row.firstPerfect) row.firstPerfect = world.day + ' ' + Math.floor(world.clock / 60) + ':00, cooking ' + S.Skills.level(sim, 'cooking');
          }
          if (e.type === 'fire' && e.start) row.fires++;
          if (e.type === 'fire' && e.burnt) row.burnt++;
          if (e.type === 'fire' && e.cleaned) row.cleaned++;
        }
        if (world.day !== day) {
          row.byDay.push(S.Skills.level(sim, skill));
          day = world.day;
        }
        if (free(sim) && !S.Food.burning(lot) && world.day * 1440 + world.clock >= wait) {
          S.Acts.add(world, sim, S.Acts.adAct(item.burnt ? 'clean_soot' : ad, lot, item));
          row.orders++;
        }
        const hour = world.day * 24 + Math.floor(world.clock / 60);
        if (hour !== lastHour) {
          lastHour = hour;
          moodSum += S.Moods.mood(sim);
          samples++;
        }
      }
      row.level = S.Skills.level(sim, skill);
      row.xp = Math.round(sim.skill.xp[skill] || 0);
      row.mood = Math.round(moodSum / samples);
      row.done = sim.skill.done.slice();
      return row;
    };
    const burn = (alone, traits, detector) => {
      const game = new S.Game(doc, seed), world = game.world, sim = world.family[0], lot = sim.home, stove = lot.house.items.find(i => modelOf(i) === 'stove');
      lot.house.detector = detector;
      if (alone) {
        const away = world.lots.find(l => l.kind === 'home' && l !== lot);
        for (const s of world.family.slice(1)) Object.assign(s, { x: away.doorOut[0], z: away.doorOut[1], lot: null, inside: away, act: null, queue: [], order: null, path: null, state: 'idle' });
        world.family = [sim];
      }
      sim.traits = traits.slice();
      game.setSpeed(3);
      const row = { case: (alone ? 'alone at home' : 'whole family') + (detector ? ', smoke detector' : ', no detector'), traits: traits.join('/') || '-', spread: 0, putOut: [], burnt: [], minutes: 0, fled: false, firemen: 0, cleaned: 0, moods: [] };
      S.Food.ignite(world, lot, stove, sim);
      const start = world.day * 1440 + world.clock;
      while (S.Food.burning(lot) && world.day * 1440 + world.clock - start < 6 * 60) {
        game.fixed(sim.x, sim.z);
        if (sim.act && sim.act.flee) row.fled = true;
        for (const e of game.events.splice(0)) {
          if (e.type === 'service' && /Пожарн/.test(e.text) && /на месте/.test(e.text)) row.firemen++;
          if (e.type !== 'fire') continue;
          if (!e.start && !e.out && !e.burnt && !e.cleaned) row.spread++;
          if (e.out) row.putOut.push(e.text);
          if (e.burnt) row.burnt.push(S.modelName(modelOf(lot.house.items[e.item])));
        }
        for (const m of S.Moods.list(sim)) if ((m.id === 'fire' || m.id === 'burn') && !row.moods.includes(m.id)) row.moods.push(m.id);
      }
      row.minutes = Math.round(world.day * 1440 + world.clock - start);
      row.stillBurning = S.Food.burning(lot);
      const cleanStart = world.day * 1440 + world.clock;
      while (lot.house.items.some(i => i.burnt) && world.day * 1440 + world.clock - cleanStart < 24 * 60) {
        game.fixed(sim.x, sim.z);
        for (const e of game.events.splice(0)) if (e.type === 'fire' && e.cleaned) row.cleaned++;
        const sooty = lot.house.items.find(i => i.burnt);
        if (sooty && free(sim)) S.Acts.add(world, sim, S.Acts.adAct('clean_soot', lot, sooty));
      }
      row.cleanMinutes = Math.round(world.day * 1440 + world.clock - cleanStart);
      row.sootLeft = lot.house.items.filter(i => i.burnt).length;
      return row;
    };
    let bad = 0;
    const check = (good, row, why) => {
      if (!good) bad++;
      console.log((good ? 'ok   ' : 'BAD  ') + why + ' ' + JSON.stringify(row));
    };
    for (const skill of Object.keys(PRACTICE)) {
      const row = train(skill, [], days);
      check(row.level >= 5 && row.level < S.Skills.TOP, row, 'practice ' + skill + ' for ' + days + ' days reaches level 5 to 9:');
    }
    const novices = [0, 1, 2].map(k => train('cooking', ['clumsy'], days, seed + k)), fires = novices.reduce((n, r) => n + r.fires, 0);
    check(fires >= 2, novices.map(r => ({ seed: r.seed, fires: r.fires, byDay: r.byDay })), 'clumsy novices cooking for ' + days + ' days on three seeds start fires:');
    const chef = train('cooking', ['naturalCook'], days);
    check(!!chef.firstPerfect, chef, 'natural cook practising for ' + days + ' days cooks a perfect dish:');
    const family = burn(false, [], false);
    check(!family.stillBurning && family.putOut.length > 0 && family.sootLeft === 0, family, 'the family puts out a kitchen fire:');
    const alone = burn(true, ['coward'], false);
    check(!alone.stillBurning && alone.burnt.length > 0 && alone.fled && alone.sootLeft === 0, alone, 'a coward alone without a smoke detector flees, the kitchen burns, then the soot is cleaned:');
    const saved = burn(true, ['coward'], true);
    check(!saved.stillBurning && saved.fled && saved.firemen >= 1 && saved.burnt.length < alone.burnt.length && saved.minutes < alone.minutes, saved, 'with the smoke detector firefighters come to the coward and the kitchen burns less:');
    console.log('skills: seed ' + seed + ', ' + days + ' days, not as expected: ' + bad);
    if (bad) process.exitCode = 1;
  },

  money(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 21, seed = +opts.seed || 1, FREE = 40, BODY = ['hunger', 'bladder', 'hygiene', 'energy'], WEEK = 7, JOB_HOURS = 35;
    const jobRate = level => S.Jobs.payAt(S.CAREERS.business, Math.max(1, level));
    const leisure = act => !!act.ad && Object.entries(S.adGains(S.ADS[act.ad])).filter(([, v]) => v > 0).every(([need]) => need === 'fun' || need === 'social');
    const free = sim => !sim.queue.length && (!sim.act || (sim.act.auto && leisure(sim.act))) && !S.Acts.isAsleep(sim) && BODY.every(n => sim.needs[n] >= FREE);
    const PATHS = {
      painting: {
        crafting: act => act.ad === 'paint_canvas',
        step(world, sim, lot) {
          const easel = lot.house.items.find(i => S.baseOf(i) === 'easel');
          for (let i = sim.bag.length - 1; i >= 0; i--) if (sim.bag[i].k === 'painting') S.Art.sellPainting(world, sim, i);
          if (!free(sim)) return;
          const styles = Object.values(S.PAINT_STYLES).filter(s => !S.Art.paintWhy(sim, s) && s.id !== 'copy');
          S.Acts.add(world, sim, Object.assign(S.Acts.adAct('paint_canvas', lot, easel), { canvas: { size: 'large', style: styles[styles.length - 1].id } }));
        }
      },
      fishing: {
        crafting: act => act.ad === 'fish_pond' || !!(act.go && act.sell),
        step(world, sim, lot) {
          const pond = lot.house.items.find(i => S.baseOf(i) === 'pond'), shop = world.lots.find(l => l.kind === 'shop');
          if (!free(sim)) return;
          if (sim.bag.filter(S.Econ.sellable).length >= 30) {
            S.Acts.add(world, sim, Object.assign(S.Acts.goAct(S.Town.goalAt(world, shop.doorOut[0], shop.doorOut[1], 0), false), { sell: true }));
            return;
          }
          S.Acts.add(world, sim, S.Acts.adAct('fish_pond', lot, pond));
        }
      },
      writing: {
        future: 0,
        crafting: act => act.ad === 'write_novel',
        step(world, sim, lot) {
          for (let i = sim.bag.length - 1; i >= 0; i--) {
            if (sim.bag[i].k !== 'manuscript') continue;
            S.Art.publish(world, sim, i);
            const book = world.books[world.books.length - 1];
            PATHS.writing.future += book.r * book.left;
          }
          if (!free(sim)) return;
          const computer = lot.house.items.find(i => S.baseOf(i) === 'computer'), open = Object.values(S.GENRES).filter(g => !S.Art.novelWhy(sim, g));
          const best = open.sort((a, b) => b.royalty / b.hours - a.royalty / a.hours)[0];
          S.Acts.add(world, sim, Object.assign(S.Acts.adAct('write_novel', lot, computer), { genre: best.id }));
        }
      }
    };
    let bad = 0;
    for (const [name, path] of Object.entries(opts.path ? { [opts.path]: PATHS[opts.path] } : PATHS)) {
      const game = new S.Game(doc, seed), world = game.world, sim = world.family[0], lot = sim.home, STEP_MIN = S.SPEEDS[3] / 60;
      sim.traits = [];
      game.setSpeed(3);
      const weeks = [];
      let income = 0, mins = 0, day = world.day, lastQuarter = -1;
      while (world.day <= days) {
        game.fixed(sim.x, sim.z);
        for (const e of game.events.splice(0)) if (e.type === 'money' && e.sim === sim.id && e.amount > 0 && !e.royalty) income += e.amount;
        if (path.future) {
          income += path.future;
          path.future = 0;
        }
        if (sim.act && path.crafting(sim.act) && (sim.act.phase === 'run' || sim.act.go)) mins += STEP_MIN;
        const quarter = Math.floor((world.day * 1440 + world.clock) / 15);
        if (quarter !== lastQuarter) {
          lastQuarter = quarter;
          path.step(world, sim, lot);
        }
        if (world.day !== day) {
          day = world.day;
          if ((day - 1) % WEEK === 0) {
            const level = S.Skills.level(sim, name), hours = mins / 60, perHour = hours ? income / hours : 0;
            weeks.push({ level, income: Math.round(income), hours: Math.round(hours), perHour: Math.round(perHour), job: Math.round(jobRate(level)), asJob: Math.round(perHour * JOB_HOURS) });
            income = 0;
            mins = 0;
          }
        }
      }
      const tail = weeks.slice(-2), ratio = tail.reduce((n, w) => n + w.income, 0) / Math.max(1, tail.reduce((n, w) => n + w.hours, 0)) / tail[tail.length - 1].job;
      const ok = ratio >= 0.5 && ratio <= 1.6;
      if (!ok) bad++;
      console.log((ok ? 'ok   ' : 'BAD  ') + name.padEnd(9) + 'per craft hour vs job pay at the same level: ' + ratio.toFixed(2) + ' ' + JSON.stringify(weeks));
    }
    console.log('money: ' + days + ' days of one craft, income per craft hour over the last two weeks (books with all their future royalties) against job pay per hour at the last level (15 at step 1, 180 at step 10); out of range: ' + bad);
    if (bad) process.exitCode = 1;
  },

  async jobs(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 45, seed = +opts.seed || 1, FREE = 45, BODY = ['hunger', 'bladder', 'hygiene', 'energy', 'social'], PAY_AT = 18 * 60;
    const tracks = Object.values(S.CAREERS).flatMap(def => (def.branchAt ? Object.keys(def.branches).map(b => def.id + ':' + b) : [def.id]));
    const HOME = { cooking: ['cook_meal', 'stove'], athletic: ['punchbag_hit', 'punchbag'], logic: ['chess_play', 'chess'], charisma: ['mirror_speech', 'bath_sink'], writing: ['write_novel', 'computer'], painting: ['easel_paint', 'easel'], fishing: ['fish_pond', 'pond'], guitar: ['guitar_play', null], handiness: ['tinker', 'stereo'] };
    const leisure = act => !!act.ad && Object.entries(S.adGains(S.ADS[act.ad])).filter(([, v]) => v > 0).every(([need]) => need === 'fun' || need === 'social');
    const free = sim => !sim.queue.length && (!sim.act || (sim.act.auto && leisure(sim.act))) && !S.Acts.isAsleep(sim) && !sim.inside && BODY.every(n => sim.needs[n] >= FREE);
    const climb = track => {
      const [career, branch] = track.split(':'), game = new S.Game(doc, seed), world = game.world, sim = world.family[0], lot = sim.home, def = S.CAREERS[career];
      sim.traits = [];
      game.setSpeed(3);
      S.Jobs.join(world, sim, career, true);
      if (branch) S.Jobs.setBranch(sim, branch);
      if (career === 'music') sim.bag.push(S.Econ.item('guitar', 'guitar', { v: 120 }));
      const row = { track, top: null, level: 1, steps: [], tones: {}, orders: 0, calls: 0, missed: 0, late: 0, fired: 0, skills: {}, friends: 0, mood: 0 };
      const friendsTop = Math.max(0, ...S.Jobs.reqsFor(def, 10, branch || null).filter(([key]) => key === 'friends').map(([, need]) => need));
      const friendGap = () => friendsTop - S.Rel.friends(world, sim);
      const callee = () => {
        let best = null;
        for (const rel of S.Rel.of(world, sim)) {
          const other = S.Rel.other(world, rel, sim);
          if (!other.free || rel.v >= S.Rel.FRIEND || !(rel.f & S.Rel.F.met) || S.Rel.kinOf(world, sim, other)) continue;
          if (!best || rel.v > best[0]) best = [rel.v, other];
        }
        return best && best[1];
      };
      let callDay = -1, calls = 0;
      const want = () => {
        const out = [];
        for (const [key, need] of S.Jobs.reqsFor(def, 10, branch || null)) {
          if (key === 'friends') continue;
          const id = key.split('|').filter(k => HOME[k]).sort((a, b) => S.Skills.level(sim, b) - S.Skills.level(sim, a))[0];
          if (id && S.Skills.level(sim, id) < need) out.push([id, need - S.Skills.level(sim, id)]);
        }
        return out.sort((a, b) => b[1] - a[1]).map(([id]) => id);
      };
      let lastQuarter = -1, moodSum = 0, samples = 0, paidDay = 0;
      while (world.day <= days && sim.job && sim.job.level < 10) {
        game.fixed(sim.x, sim.z);
        if (world.clock >= PAY_AT && paidDay !== world.day) {
          paidDay = world.day;
          if (S.Services.due(world)) row.paid = (row.paid || 0) + S.Services.payBills(world, sim);
          if (S.Upkeep.brokenItems(lot).length && S.Services.of(world).repair < 0 && !S.Services.onDuty(world, 'repair').length) {
            S.Services.call(world, sim, 'repair');
            row.repairs = (row.repairs || 0) + 1;
          }
        }
        for (const e of game.events.splice(0)) {
          if (e.type === 'service' && /Коллектор забрал/.test(e.text)) row.repo = (row.repo || 0) + 1;
          if (e.type !== 'job' || e.sim !== sim.id) continue;
          if (e.promoted) row.steps.push(world.day);
          if (/Пропущен/.test(e.text)) row.missed++;
          if (/опоздани/.test(e.text)) row.late++;
          if (/Увольнение/.test(e.text)) row.fired++;
        }
        const quarter = Math.floor((world.day * 1440 + world.clock) / 15);
        if (quarter === lastQuarter) continue;
        lastQuarter = quarter;
        moodSum += S.Moods.mood(sim);
        samples++;
        const state = S.Jobs.stateAt(world, sim);
        if (state) {
          const lack = S.Jobs.missing(world, sim, state), odd = Math.floor(world.clock / 60) % 2 === 1;
          const tone = lack.some(([key]) => key === 'friends') ? 'friends' : lack.length ? 'study' : friendGap() > 0 && odd ? 'friends' : sim.needs.energy > 40 && S.Moods.mood(sim) >= 0 ? 'hard' : 'normal';
          S.Jobs.setTone(world, sim, tone);
          row.tones[tone] = (row.tones[tone] || 0) + 1;
          continue;
        }
        if (!free(sim)) continue;
        if (callDay !== world.day) {
          callDay = world.day;
          calls = 0;
        }
        const other = friendGap() > 0 && calls < 3 && world.clock >= 17 * 60 && world.clock < 22 * 60 ? callee() : null;
        if (other) {
          S.Acts.add(world, sim, { ad: 'phone_call', lot: sim.home.index, item: -1, step: 0, phase: 'start', left: 0, phone: 'chat', with: world.sims.indexOf(other) });
          calls++;
          row.calls++;
          continue;
        }
        const skill = want()[0];
        if (!skill) continue;
        const [ad, model] = HOME[skill];
        if (!model) {
          S.Acts.add(world, sim, S.Art.guitarAct(world, sim, { guitar: ad }));
          row.orders++;
          continue;
        }
        const item = lot.house.items.find(i => S.baseOf(i) === model);
        if (!item) continue;
        const act = S.Acts.adAct(ad, lot, item);
        if (ad === 'write_novel') act.genre = Object.values(S.GENRES).filter(g => !S.Art.novelWhy(sim, g)).sort((a, b) => b.level - a.level)[0].id;
        S.Acts.add(world, sim, act);
        row.orders++;
      }
      row.level = sim.job ? sim.job.level : 0;
      row.top = row.level >= 10 ? world.day : null;
      for (const id of Object.keys(S.SKILLS)) if (S.Skills.level(sim, id)) row.skills[id] = S.Skills.level(sim, id);
      row.friends = S.Rel.friends(world, sim);
      row.mood = Math.round(moodSum / Math.max(1, samples));
      return row;
    };
    if (opts.track) {
      console.log(JSON.stringify(climb(opts.track)));
      return;
    }
    const width = Math.min(3, Math.max(1, +opts.jobs || 1)), list = opts.only ? tracks.filter(t => opts.only.split(',').includes(t.split(':')[0]) || opts.only.split(',').includes(t)) : tracks, rows = [];
    const { fork } = require('node:child_process');
    const runOne = track => new Promise((resolve, reject) => {
      const child = fork(__filename, ['jobs', '--track=' + track, '--days=' + days, '--seed=' + seed], { silent: true });
      let out = '';
      child.stdout.on('data', d => { out += d; });
      child.stderr.on('data', d => process.stderr.write(d));
      child.on('exit', code => (code ? reject(new Error(track + ' failed')) : resolve(JSON.parse(out.trim().split('\n').pop()))));
    });
    const queue = list.slice();
    await Promise.all(Array.from({ length: width }, async () => {
      while (queue.length) rows.push(await runOne(queue.shift()));
    }));
    let bad = 0;
    for (const track of list) {
      const row = rows.find(r => r.track === track), good = !!row.top && row.top <= days && !row.fired;
      if (!good) bad++;
      console.log((good ? 'ok   ' : 'BAD  ') + track.padEnd(18) + 'top on day ' + (row.top || '-') + ' ' + JSON.stringify(row));
    }
    console.log('jobs: seed ' + seed + ', ' + list.length + ' career tracks, a traitless adult works and trains, pays the bills and calls the repairman in the evening, the top must come within ' + days + ' days; not reached: ' + bad);
    if (bad) process.exitCode = 1;
  },

  week(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 21, seeds = +opts.seeds || 3, start = S.Sample.MONEY;
    let bad = 0;
    for (let seed = 1; seed <= seeds; seed++) {
      const game = new S.Game(doc, seed), world = game.world, fam = world.family;
      S.Jobs.join(world, fam[0], 'business', true);
      S.Jobs.join(world, fam[1], 'medical', true);
      game.setSpeed(3);
      const first = { bills: 0, burglar: 0, fire: 0, offers: 0, news: 0 }, row = { seed, income: 0, minFunds: world.funds, at7: 0, at21: 0, bills: 0, paid: 0, repo: 0, stolen: 0, arrests: 0, fires: 0, broken: 0, opps: 0, oppsDone: 0, news: 0 };
      let paidDay = 0;
      while (world.day <= days) {
        game.fixed(fam[0].x, fam[0].z);
        for (const e of game.events.splice(0)) {
          if (e.type === 'money' && e.amount > 0) row.income += e.amount;
          if (e.type === 'service' && e.mail && /счета/.test(e.text)) row.bills++;
          if (e.type === 'service' && /Сработала сигнализация/.test(e.text)) { row.burglar = (row.burglar || 0) + 1; if (world.day <= 7) first.burglar++; }
          if (e.type === 'service' && /задерживает вора/.test(e.text)) row.arrests++;
          if (e.type === 'service' && /Украли/.test(e.text)) row.stolen++;
          if (e.type === 'service' && /Коллектор забрал/.test(e.text)) row.repo++;
          if (e.type === 'fire' && e.start) { row.fires++; if (world.day <= 7) first.fire++; }
          if (e.type === 'upkeep' && e.broke) row.broken++;
          if (e.type === 'opp' && e.offer && !e.accepted) { row.opps++; if (world.day <= 7) first.offers++; S.Opps.accept(world); }
          if (e.type === 'opp' && e.done) row.oppsDone++;
          if (e.type === 'ask' && e.kind === 'nanny') S.Services.call(world, fam[1], 'nanny');
        }
        if (world.clock >= 1080 && paidDay !== world.day && S.Services.due(world)) {
          paidDay = world.day;
          row.paid += S.Services.payBills(world, fam[0]);
        }
        row.minFunds = Math.min(row.minFunds, world.funds);
        if (world.day === 8 && !row.at7) {
          row.at7 = world.funds;
          first.bills = row.bills;
          first.news = (world.news || []).length;
        }
      }
      row.at21 = world.funds;
      row.news = (world.news || []).length;
      const week = first.bills > 0 && (first.burglar + first.fire) > 0 && first.offers > 0 && first.news > 0;
      const money = row.minFunds >= start * 0.6 && row.at21 >= start - 6000;
      if (!week || !money) bad++;
      console.log((week && money ? 'ok   ' : 'BAD  ') + 'seed ' + seed + ' first week ' + JSON.stringify(first) + ' ' + JSON.stringify(row));
    }
    console.log('week: ' + seeds + ' seeds, ' + days + ' days, two working adults, bills paid every evening; the first week needs a bill, a burglar or a fire, an offer and a news item, money must stay above 60 % of the start and lose at most §6 000 in three weeks; out of range: ' + bad);
    if (bad) process.exitCode = 1;
  },

  async soak(opts) {
    os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);
    const days = +opts.days || 30, seeds = +opts.seeds || 2;
    for (let seed = 1; seed <= seeds; seed++) {
      const report = await soakSeed(seed, days);
      console.log(JSON.stringify(report));
      if (report.roundTrip !== true || report.stuck.length || report.outAtNight.length || report.actStuck.length || report.staleRoute.length || report.carLost.length || report.badNeeds.length) process.exitCode = 1;
    }
  },

  async savefile(opts) {
    const game = new S.Game(doc, 1), rng = { rs: 11 };
    game.setSpeed(2);
    for (let i = 0; i < 4000; i++) {
      if (i % 700 === 0) giveInput(game, inputFor(rng, game));
      game.fixed(game.active.x, game.active.z);
    }
    fs.writeFileSync(opts.out, await S.Save.encode(S.Save.file(game, null)));
    console.log('save file written: ' + opts.out);
  },

  route(opts) {
    const count = +opts.n || 500, seed = +opts.seed || 1, scene = S.Town.create(doc, seed), world = scene.world, g = world.ground, rng = { rs: seed * 31 };
    const report = { tried: 0, reached: 0, failed: [], slowestPlan: 0, totalMs: 0, detourMax: 0 };
    const land = () => {
      for (;;) {
        const x = Math.floor(S.roll(rng) * S.METRICS.town), z = Math.floor(S.roll(rng) * S.METRICS.town);
        if (g.isFree(0, x, z)) return [x, z];
      }
    };
    const lotDoors = world.lots.map(l => [Math.floor(l.doorOut[0]), Math.floor(l.doorOut[1])]);
    const isle = new Set();
    {
      const stack = [lotDoors[0][0] + lotDoors[0][1] * g.w], seen = new Uint8Array(g.size);
      seen[stack[0]] = 1;
      while (stack.length) {
        const cur = stack.pop(), x = cur % g.w, z = (cur - x) / g.w;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, nz = z + dz;
          if (g.canGo(0, x, z, dx, dz) && !seen[nx + nz * g.w]) {
            seen[nx + nz * g.w] = 1;
            stack.push(nx + nz * g.w);
          }
        }
      }
      for (let i = 0; i < g.size; i++) if (g.free[0][i] && !seen[i]) isle.add(i);
    }
    for (let i = 0; i < count; i++) {
      const a = i % 4 === 0 ? lotDoors[i % lotDoors.length] : land(), b = i % 4 === 1 ? lotDoors[i % lotDoors.length] : land();
      if (isle.has(a[0] + a[1] * g.w) || isle.has(b[0] + b[1] * g.w)) continue;
      const t = performance.now(), plan = g.plan(a[0], a[1], b[0], b[1]), ms = performance.now() - t;
      report.tried++;
      report.totalMs += ms;
      report.slowestPlan = Math.max(report.slowestPlan, ms);
      if (!plan.reached) {
        report.failed.push([a, b]);
        continue;
      }
      report.reached++;
      const line = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (plan.cost && line > 30) report.detourMax = Math.max(report.detourMax, plan.cost / line);
    }
    const walks = +opts.walks || 8, sim = scene.sims[0];
    const trips = [];
    for (let i = 0; i < walks; i++) {
      const target = world.lots[(i * 7 + 3) % world.lots.length];
      S.Sim.order(world, sim, { x: target.doorOut[0], z: target.doorOut[1], floor: 0, lot: target, car: i % 2 === 0 ? false : undefined });
      let t = 0;
      const from = [sim.x, sim.z];
      while (t < 900 && !(sim.state === 'idle' && !sim.order && !sim.path)) {
        S.Sim.stepAll(world, 0.05);
        t += 0.05;
      }
      const line = Math.hypot(from[0] - sim.x, from[1] - sim.z), inTime = t <= line / S.METRICS.walk * 1.7 + 15;
      trips.push({ to: target.id, mode: i % 2 === 0 ? 'пешком' : 'как получится', line: +line.toFixed(1), seconds: +t.toFixed(1), ok: inTime && sim.state === 'idle' && Math.hypot(sim.x - target.doorOut[0], sim.z - target.doorOut[1]) < 1 });
    }
    report.meanMs = +(report.totalMs / Math.max(1, report.tried)).toFixed(3);
    report.slowestPlan = +report.slowestPlan.toFixed(2);
    report.detourMax = +report.detourMax.toFixed(2);
    delete report.totalMs;
    report.failedCount = report.failed.length;
    report.failed = report.failed.slice(0, 5);
    console.log(JSON.stringify(report));
    for (const trip of trips) console.log(JSON.stringify(trip));
    const crossing = trips.filter(t => t.ok).length;
    if (report.failedCount || crossing !== trips.length) process.exitCode = 1;
  },

  heat(opts) {
    const out = opts.out || path.join(ROOT, 'sims98-heat.png'), seed = +opts.seed || 1, scene = S.Town.create(doc, seed), world = scene.world, size = S.METRICS.town;
    const heat = new Float32Array(size * size);
    S.Town.setClock(world, 0);
    const fx = size / 2, fz = size / 2;
    for (let i = 0; i < 24 * 60; i++) {
      S.Town.step(world, 1, fx, fz);
      for (const s of world.sims) {
        if (s.inside) continue;
        const at = Math.floor(s.x) + Math.floor(s.z) * size;
        if (at >= 0 && at < heat.length) heat[at]++;
      }
    }
    const blur = new Float32Array(size * size);
    const R = 3;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        if (!heat[x + z * size]) continue;
        for (let dz = -R; dz <= R; dz++) {
          for (let dx = -R; dx <= R; dx++) {
            const nx = x + dx, nz = z + dz;
            if (nx >= 0 && nz >= 0 && nx < size && nz < size) blur[nx + nz * size] += heat[x + z * size];
          }
        }
      }
    }
    let top = 1;
    for (const v of blur) top = Math.max(top, v);
    const colors = S.Terrain.colors(world.terrain), rgb = Buffer.alloc(size * size * 3);
    for (let i = 0; i < size * size; i++) {
      const k = Math.pow(blur[i] / top, 0.4);
      rgb[i * 3] = Math.min(255, colors[i * 4] * 0.6 * (1 - k) + 255 * k);
      rgb[i * 3 + 1] = colors[i * 4 + 1] * 0.6 * (1 - k) + 60 * k;
      rgb[i * 3 + 2] = colors[i * 4 + 2] * 0.6 * (1 - k);
    }
    for (const lot of world.lots) {
      for (let x = lot.x; x < lot.x + lot.w; x++) {
        for (const z of [lot.z, lot.z + lot.d - 1]) rgb.fill(255, (x + z * size) * 3, (x + z * size) * 3 + 3);
      }
      for (let z = lot.z; z < lot.z + lot.d; z++) {
        for (const x of [lot.x, lot.x + lot.w - 1]) rgb.fill(255, (x + z * size) * 3, (x + z * size) * 3 + 3);
      }
    }
    writePng(out, size, size, rgb);
    let cold = 0;
    for (const lot of world.lots) {
      let sum = 0;
      for (let z = lot.z; z < lot.z + lot.d; z++) {
        for (let x = lot.x; x < lot.x + lot.w; x++) sum += heat[x + z * size];
      }
      if (!sum) cold++;
    }
    console.log('heat map written: ' + out + ', lots without footsteps: ' + cold);
  },

  perf(opts) {
    const people = +opts.people || S.Town.PEOPLE, seed = +opts.seed || 1, scene = S.Town.create(doc, seed), world = scene.world;
    for (let i = world.sims.length; i < people; i++) {
      const base = world.sims[5 + (i % (world.sims.length - 5))], sim = S.Sim.create({ id: 'x' + i, name: base.name, age: base.age, sex: base.sex, hair: base.hair, look: base.look, x: base.x, z: base.z, home: base.home, free: true, hasCar: base.hasCar, day: base.day });
      sim.inside = base.home;
      sim.lot = base.home;
      sim.day = base.day;
      world.sims.push(sim);
    }
    S.Town.setClock(world, 7.5 * 60);
    const fx = world.lots[0].x, fz = world.lots[0].z, frames = [];
    for (let i = 0; i < 3600 * 2; i++) {
      const t = performance.now();
      S.Town.step(world, 1 / 60, fx, fz);
      frames.push(performance.now() - t);
    }
    frames.sort((a, b) => a - b);
    console.log(JSON.stringify({ people: world.sims.length, median: +frames[frames.length >> 1].toFixed(3), p99: +frames[Math.floor(frames.length * 0.99)].toFixed(3), max: +frames[frames.length - 1].toFixed(2), live: world.live.length }));
  }
};

const name = process.argv[2];
if (!COMMANDS[name]) {
  console.error('usage: node tools/sims98-bot.cjs life|soak|traits|social|skills|money|jobs|week|econ|route|heat|perf|savefile [--days=30] [--seeds=2] [--seed=1] [--verbose] [--family=2] [--n=500] [--out=x.png] [--people=160] [--jobs=3] [--only=crime,music]');
  process.exit(1);
}
Promise.resolve(COMMANDS[name](options())).catch(e => {
  console.error(e);
  process.exit(1);
});
