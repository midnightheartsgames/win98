(function (S) {
  'use strict';
  const VERSION = 10, DB_NAME = 'sims98', DB_STORE = 'saves', BACKUP = '.bak', SIM_FIELDS = 49;
  const SEATED_STATES = new Set(['align', 'sitDown', 'sit', 'standUp', 'leave']);
  const MIGRATIONS = {
    1: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        doors: null,
        sims: file.state.sims.map(r => {
          const out = r.slice();
          out[23] = null;
          if (SEATED_STATES.has(out[5])) {
            out[5] = 'idle';
            out[20] = null;
          }
          out[9] = 0;
          if (Array.isArray(out[21]) && out[21].length === 3) out[21] = null;
          if (Array.isArray(out[25]) && out[25].length === 3) out[25] = null;
          out.push(0, null, null, null, [], 0, '', 0);
          return out;
        })
      })
    }),
    2: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        sims: file.state.sims.map(r => r.concat([r[33] ? [] : null]))
      })
    }),
    3: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        sims: file.state.sims.map(r => r.concat([null, 0, null]))
      })
    }),
    4: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        sims: file.state.sims.map(r => r.concat([null]))
      })
    }),
    5: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        rels: null,
        party: null,
        family: null,
        sims: file.state.sims.map(r => r.concat([null]))
      })
    }),
    6: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        kitchen: null,
        sims: file.state.sims.map(r => r.concat([null]))
      })
    }),
    7: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        funds: null,
        garden: null,
        fish: null,
        spots: null,
        art: null,
        sims: file.state.sims.map(r => r.concat([null, null]))
      })
    }),
    8: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, {
        sims: file.state.sims.map(r => r.concat([null]))
      })
    }),
    9: file => Object.assign({}, file, {
      state: Object.assign({}, file.state, { upkeep: null, service: null, purse: null, opps: null })
    })
  };
  const SLOTS = [{ key: 'quick', name: 'Быстрое сохранение', fixed: true }];
  for (let i = 1; i <= 10; i++) SLOTS.push({ key: 'slot' + i, name: 'Слот ' + i });
  for (let i = 1; i <= 3; i++) SLOTS.push({ key: 'auto' + i, name: 'Автосохранение ' + i, fixed: true, auto: true });

  const lotIndex = lot => (lot ? lot.index : -1);

  const lotOf = (world, i) => {
    if (i === -1) return null;
    if (!world.lots[i]) throw new Error('в файле неизвестный участок ' + i);
    return world.lots[i];
  };

  const itemOf = (lot, i) => {
    const item = lot && lot.house.items[i];
    if (!item) throw new Error('в файле неизвестный предмет ' + i);
    return item;
  };

  const packOrder = order => {
    if (!order) return null;
    if (order.item) return [lotIndex(order.lot), order.lot.house.items.indexOf(order.item), order.run ? 1 : 0, order.pose || 'sit'];
    return [order.x, order.z, order.floor || 0, lotIndex(order.lot), lotIndex(order.enter), order.run ? 1 : 0, order.car === false ? 1 : 0];
  };

  const unpackOrder = (world, r) => {
    if (!r) return null;
    if (r.length === 4) {
      const lot = lotOf(world, r[0]);
      return { item: itemOf(lot, r[1]), lot, run: !!r[2], pose: r[3] };
    }
    const order = { x: r[0], z: r[1], floor: r[2], lot: lotOf(world, r[3]), enter: lotOf(world, r[4]), run: !!r[5] };
    if (r[6]) order.car = false;
    return order;
  };

  const packPath = path => path && path.map(w => [w.x, w.z, w.floor, w.slope || 0, w.coarse ? 1 : 0]);

  const unpackPath = r => r && r.map(w => {
    const point = { x: w[0], z: w[1], floor: w[2], slope: w[3] };
    if (w[4]) point.coarse = true;
    return point;
  });

  const packSeat = seat => {
    if (!seat) return null;
    const p = seat.place;
    return [lotIndex(seat.lot), seat.lot.house.items.indexOf(seat.item), seat.slot, p.x, p.z, p.y, p.yaw, p.fx, p.fz, seat.backX, seat.backZ, seat.pose];
  };

  const unpackSeat = (world, r) => {
    if (!r) return null;
    const lot = lotOf(world, r[0]);
    return { lot, item: itemOf(lot, r[1]), slot: r[2], place: { x: r[3], z: r[4], y: r[5], yaw: r[6], fx: r[7], fz: r[8], pose: r[11] }, backX: r[9], backZ: r[10], pose: r[11] };
  };

  const packAfter = after => after && [after.line, packOrder(after.goal), after.run ? 1 : 0];

  const unpackAfter = (world, r) => r && { line: r[0], goal: unpackOrder(world, r[1]), run: !!r[2] };

  const packSim = s => [
    s.x, s.z, s.y, s.floor, s.yaw, s.state, s.clip, s.phase, s.timer, s.seatW,
    lotIndex(s.lot), lotIndex(s.inside), s.live ? 1 : 0, s.dayIndex, s.reserved, s.run ? 1 : 0, s.wait, s.stuck, s.wp, s.note,
    packPath(s.path), packOrder(s.order), packOrder(s.goal), packSeat(s.seat), packAfter(s.after), packOrder(s.then),
    s.trip && [s.trip.points, s.trip.i],
    s.car && [s.car.line, s.car.i, s.car.x, s.car.z, s.car.y, s.car.dx, s.car.dz, s.car.wait],
    s.slopeFrom && [s.slopeFrom.len, s.slopeFrom.y],
    packAfter(s.keepAfter),
    s.ghost,
    s.wantUp ? 1 : 0,
    s.useClip,
    s.needs && S.NEED_ORDER.map(need => s.needs[need]),
    s.act,
    s.queue,
    s.thinkLeft,
    s.failText,
    s.failLeft,
    S.Moods.pack(s),
    S.Traits.pack(s),
    s.hold,
    s.holdClip,
    S.Wishes.pack(s),
    S.Social.packSim(s),
    S.Skills.pack(s),
    S.Econ.pack(s),
    S.Art.packSim(s),
    S.Jobs.pack(s)
  ];

  const unpackSim = (world, r) => {
    if (!Array.isArray(r) || r.length !== SIM_FIELDS) throw new Error('повреждена запись жителя');
    if (![r[0], r[1], r[2], r[4], r[7]].every(Number.isFinite)) throw new Error('в записи жителя не число');
    if (!S.Sim.STATE_NAMES[r[5]] || !S.Clips.LIST[r[6]]) throw new Error('неизвестное состояние жителя: ' + r[5] + ', ' + r[6]);
    return {
      x: r[0], z: r[1], y: r[2], floor: r[3], yaw: r[4], state: r[5], clip: r[6], phase: r[7], timer: r[8], seatW: r[9],
      lot: lotOf(world, r[10]), inside: lotOf(world, r[11]), live: !!r[12], dayIndex: r[13], reserved: r[14], run: !!r[15], wait: r[16], stuck: r[17], wp: r[18], note: r[19],
      path: unpackPath(r[20]), order: unpackOrder(world, r[21]), goal: unpackOrder(world, r[22]), seat: unpackSeat(world, r[23]), after: unpackAfter(world, r[24]), then: unpackOrder(world, r[25]),
      trip: r[26] && { points: r[26][0], i: r[26][1] },
      car: r[27] && { line: r[27][0], i: r[27][1], x: r[27][2], z: r[27][3], y: r[27][4], dx: r[27][5], dz: r[27][6], wait: r[27][7] },
      slopeFrom: r[28] && { len: r[28][0], y: r[28][1] },
      keepAfter: unpackAfter(world, r[29]),
      ghost: r[30],
      wantUp: !!r[31],
      useClip: r[32],
      needs: r[33] ? Object.fromEntries(S.NEED_ORDER.map((need, i) => [need, r[33][i]])) : null,
      act: r[34],
      queue: r[35],
      thinkLeft: r[36],
      failText: r[37],
      failLeft: r[38],
      moods: S.Moods.unpack(r[39]),
      traitPack: r[40] === null ? null : S.Traits.unpack(r[40]),
      hold: Number.isFinite(r[41]) ? r[41] : 0,
      holdClip: r[42] && S.Clips.LIST[r[42]] ? r[42] : null,
      wishPack: S.Wishes.unpack(r[43]),
      socialPack: S.Social.unpackSim(world, r[44]),
      skillPack: S.Skills.unpack(r[45]),
      bagPack: S.Econ.unpack(r[46]),
      novel: S.Art.unpackSim(r[47]),
      jobPack: S.Jobs.unpack(r[48]),
      blend: 1
    };
  };

  const state = game => {
    const w = game.world;
    return {
      clock: w.clock, day: w.day, tickLeft: w.tickLeft, levelsLeft: w.levelsLeft, rs: w.rng.rs, focus: [w.focusX, w.focusZ],
      doors: w.doors.map(d => (d.open ? '1' : '0')).join(''),
      sims: w.sims.map(packSim),
      rels: S.Rel.pack(w),
      party: S.Social.packParty(w),
      family: w.family.map(s => w.sims.indexOf(s)),
      socialDay: w.socialDay,
      kitchen: S.Food.pack(w),
      funds: w.funds,
      garden: S.Garden.pack(w),
      fish: S.Fish.pack(w),
      spots: S.Collect.pack(w),
      art: S.Art.pack(w),
      upkeep: S.Upkeep.pack(w),
      service: S.Services.pack(w),
      purse: S.Econ.packWorld(w),
      opps: S.Opps.pack(w)
    };
  };

  const migrate = (file, table = MIGRATIONS, target = VERSION) => {
    if (!file || !Number.isInteger(file.version)) throw new Error('это не файл сохранения');
    if (file.version > target) throw new Error('файл записан более новой версией игры');
    let out = file;
    while (out.version < target) {
      const up = table[out.version];
      if (!up) throw new Error('нет перехода с версии ' + out.version);
      out = Object.assign(up(out), { version: out.version + 1 });
    }
    return out;
  };

  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

  const encode = file => pipe(new TextEncoder().encode(JSON.stringify(file)), new CompressionStream('gzip'));

  const unzip = async bytes => {
    try {
      return JSON.parse(new TextDecoder().decode(await pipe(bytes, new DecompressionStream('gzip'))));
    } catch (e) {
      throw new Error('файл повреждён');
    }
  };

  const decode = async bytes => migrate(await unzip(bytes));

  const memoryStore = () => {
    const map = new Map();
    return {
      map,
      get: async key => map.get(key),
      replace: async (key, record) => {
        if (map.has(key)) map.set(key + BACKUP, Object.assign({}, map.get(key), { key: key + BACKUP }));
        map.set(key, record);
      },
      close() {}
    };
  };

  const openStore = () => new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(DB_STORE, { keyPath: 'key' });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      resolve({
        get: key => new Promise((done, fail) => {
          const ask = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
          ask.onsuccess = () => done(ask.result);
          ask.onerror = () => fail(ask.error);
        }),
        replace: (key, record) => new Promise((done, fail) => {
          const tx = db.transaction(DB_STORE, 'readwrite'), store = tx.objectStore(DB_STORE), old = store.get(key);
          old.onsuccess = () => {
            if (old.result) store.put(Object.assign({}, old.result, { key: key + BACKUP }));
            store.put(record);
          };
          tx.oncomplete = () => done();
          tx.onerror = () => fail(tx.error);
          tx.onabort = () => fail(tx.error);
        }),
        close: () => db.close()
      });
    };
  });

  S.Save = {
    VERSION, SLOTS, BACKUP, state, migrate, encode, decode, memoryStore, openStore,

    file(game, view) {
      return { version: VERSION, seed: game.seed, active: game.world.sims.indexOf(game.active), speed: game.speed || game.lastSpeed, freeWill: game.freeWill, view: view || null, state: state(game) };
    },

    apply(game, file) {
      const w = game.world, st = file.state;
      if (file.seed !== game.seed) throw new Error('файл другого города');
      if (!st || !Array.isArray(st.sims) || st.sims.length !== w.sims.length) throw new Error('в файле другое число жителей');
      if (st.doors !== null && (typeof st.doors !== 'string' || st.doors.length !== w.doors.length)) throw new Error('в файле другое число дверей');
      if (!w.sims[file.active]) throw new Error('в файле неизвестный активный сим');
      if (![st.clock, st.day, st.tickLeft, st.levelsLeft, st.rs].every(Number.isFinite)) throw new Error('повреждено время города');
      const fields = st.sims.map(r => unpackSim(w, r));
      const rels = st.rels ? S.Rel.unpack(w, st.rels) : null, party = S.Social.unpackParty(w, st.party), kitchen = S.Food.unpack(w, st.kitchen);
      if (st.funds !== null && st.funds !== undefined && !Number.isFinite(st.funds)) throw new Error('повреждены деньги семьи');
      const garden = S.Garden.unpack(w, st.garden), fish = S.Fish.unpack(w, st.fish), spots = S.Collect.unpack(w, st.spots), art = S.Art.unpack(w, st.art);
      const upkeep = S.Upkeep.unpack(w, st.upkeep), service = S.Services.unpack(w, st.service), purse = S.Econ.unpackWorld(st.purse), opps = S.Opps.unpack(w, st.opps);
      if (st.family !== null && st.family !== undefined && !(Array.isArray(st.family) && st.family.length && st.family.length <= S.Social.FAMILY_LIMIT && st.family.every(i => Number.isInteger(i) && w.sims[i]))) throw new Error('повреждён состав семьи');
      S.Social.restoreFamily(w, st.family || null);
      for (const lot of w.lots) {
        for (const item of lot.house.items) {
          if (item.takers) item.takers = {};
        }
      }
      w.sims.forEach((sim, i) => {
        if (!fields[i].needs && sim.needs) fields[i].needs = S.Acts.newNeeds();
        if (!fields[i].moods && fields[i].needs) fields[i].moods = [];
        fields[i].held = [];
        fields[i].face = 0;
        fields[i].bubble = null;
        fields[i].bubbleLeft = 0;
        const wishes = fields[i].wishPack, social = fields[i].socialPack, skill = fields[i].skillPack, bag = fields[i].bagPack, jobs = fields[i].jobPack;
        delete fields[i].jobPack;
        if (jobs) Object.assign(fields[i], jobs);
        else Object.assign(fields[i], { job: null, side: null, school: null, pension: 0, lastJob: null });
        delete fields[i].wishPack;
        delete fields[i].socialPack;
        delete fields[i].skillPack;
        delete fields[i].bagPack;
        fields[i].skill = skill || (fields[i].needs ? S.Skills.fresh() : null);
        fields[i].bag = bag || (fields[i].needs ? [] : null);
        if (social) Object.assign(fields[i], social);
        if (wishes) Object.assign(fields[i], wishes);
        else if (sim.wish) Object.assign(fields[i], { wish: S.Wishes.fresh(), happy: 0, dream: null, rewards: [] });
        const pack = fields[i].traitPack;
        delete fields[i].traitPack;
        if (pack) {
          fields[i].traits = pack.traits;
          fields[i].knows = pack.knows;
          fields[i].traitState = pack.traitState;
        } else {
          fields[i].knows = sim.knows ? {} : null;
          fields[i].traitState = {};
        }
        Object.assign(sim, fields[i]);
        if (sim.seat) (sim.seat.item.takers = sim.seat.item.takers || {})[sim.seat.slot] = sim.id;
      });
      w.doors.forEach((door, i) => {
        door.open = st.doors !== null && st.doors[i] === '1';
        w.changed.add(door);
      });
      w.clock = st.clock;
      w.day = st.day;
      w.tickLeft = st.tickLeft;
      w.levelsLeft = st.levelsLeft;
      w.rng.rs = st.rs;
      [w.focusX, w.focusZ] = st.focus;
      S.Food.apply(w, kitchen);
      w.funds = Number.isFinite(st.funds) ? st.funds : S.Sample.MONEY;
      S.Garden.apply(w, garden);
      S.Fish.apply(w, fish);
      S.Collect.apply(w, spots);
      S.Art.apply(w, art);
      S.Upkeep.apply(w, upkeep);
      S.Services.apply(w, service);
      w.familyBag = purse ? purse.bag : [];
      w.coupons = purse ? purse.coupons : [];
      S.Opps.apply(w, opps);
      if (rels) {
        S.Rel.apply(w, rels);
        w.party = party;
        w.socialDay = Number.isFinite(st.socialDay) ? st.socialDay : w.day;
      } else {
        S.Social.seed(w);
      }
      w.live = w.sims.filter(s => s.live);
      w.cars.length = 0;
      for (const sim of w.sims) {
        if (sim.car) w.cars.push(sim);
      }
      w.taken.clear();
      game.active = w.sims[file.active];
      game.left = 0;
      game.events.length = 0;
      game.speed = 0;
      game.lastSpeed = file.speed || 1;
      if (file.freeWill !== undefined) game.freeWill = file.freeWill;
      for (const sim of w.family) S.Moods.step(w, sim, 0);
    },

    async write(store, key, file, when) {
      const bytes = await encode(file), record = { key, version: file.version, when, day: file.state.day, clock: file.state.clock, size: bytes.length, bytes };
      await store.replace(key, record);
      return record;
    },

    async load(store, key, game) {
      const reasons = [];
      for (const name of [key, key + BACKUP]) {
        const record = await store.get(name);
        if (!record) continue;
        try {
          const file = await decode(record.bytes);
          S.Save.apply(game, file);
          return { file, record, fromBackup: name !== key, reason: reasons[0] || '' };
        } catch (e) {
          reasons.push(e.message);
        }
      }
      throw new Error(reasons[0] || 'файла нет');
    },

    list(store) {
      return Promise.all(SLOTS.map(async slot => Object.assign({}, slot, { record: (await store.get(slot.key)) || null, backup: !!(await store.get(slot.key + BACKUP)) })));
    },

    async nextAuto(store) {
      let best = null, oldest = Infinity;
      for (const slot of SLOTS) {
        if (!slot.auto) continue;
        const record = await store.get(slot.key);
        if (!record) return slot;
        if (record.when < oldest) {
          oldest = record.when;
          best = slot;
        }
      }
      return best;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
