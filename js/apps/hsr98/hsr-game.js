(function (H) {
  'use strict';
  const T = H.TUNING;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const ATTACK_TECHS = new Set(['freezeAll', 'fireAoe', 'elecAoe', 'slowAll', 'stunOne', 'burnAll', 'delayAll', 'defDownAll', 'fireVuln', 'weaken', 'claraBait']);
  const MAX_LVL = 80;
  const TL_MAX = 70;
  const TL_QUEST_EXP = { trail: 200, comp: 300, adv: 150 };
  const SQUADS = 12;

  function questToken(t, quests) {
    const [id, step] = t.slice(1).split('='), st = quests && quests[id];
    return step ? st === step : !!st && st !== 'done';
  }

  function cond(expr, flags, quests, items) {
    if (!expr) return true;
    const test = t => (t[0] === '?' ? questToken(t, quests) : t[0] === '$' ? !!(items && items[t.slice(1)]) : !!flags[t]);
    return String(expr).split('|').some(part => part.split('&').every(t => {
      t = t.trim();
      if (!t) return true;
      return t[0] === '!' ? !test(t.slice(1)) : test(t);
    }));
  }

  const BANNER_STATE = {
    std: { pity: 'pity' },
    ev: { pity: 'pityEv', n: 'warpNEv', star: 'evStar' },
    cone: { pity: 'pityCone', n: 'warpNCone', star: 'coneStar', off: true },
    sig: { pity: 'pitySig', n: 'warpNSig', star: 'sigStar', off: true },
    amp: { pity: 'pityAmp', n: 'warpNAmp', star: 'ampStar', off: true },
    conv: { pity: 'pityConv', n: 'warpNConv', star: 'convStar', off: true },
    forge: { pity: 'pityForge', n: 'warpNForge', star: 'forgeStar', off: true },
    guild: { pity: 'pityGuild', n: 'warpNGuild', star: 'guildStar', off: true },
    wiz: { pity: 'pityWiz', n: 'warpNWiz', star: 'wizStar', off: true },
    mid: { pity: 'pityMid', n: 'warpNMid', star: 'midStar', off: true },
    comp: { pity: 'pityComp', n: 'warpNComp', star: 'compStar', off: true },
    con: { pity: 'pityCon', n: 'warpNCon', star: 'conStar', off: true },
    alley: { pity: 'pityAlley', n: 'warpNAlley', star: 'alleyStar', off: true }
  };

  function newState() {
    return {
      v: 1, trv: 1, xpv: 1, name: 'Келус', gender: 'm', mcPath: 'trail',
      roster: { trail: { lvl: 1, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 } },
      party: ['trail'],
      inv: { items: {}, cones: [], relics: [] }, uid: 1,
      credits: 500, jade: 0, starlight: 0, embers: 0, shop: { hour: null, bought: {}, back: null, intro: false }, outfits: [], pets: [], pet: null, petLog: {}, power: T.powerMax, powerAt: null, powerRes: 0, powerBuy: { hour: null, n: 0 }, tp: T.tpStart,
      flags: {}, map: 'hs_base', x: null, y: null, dir: 'down',
      anchors: [], lastAnchor: null, opened: {}, broken: {},
      rumors: [], bank: { enemies: {}, fusions: [] }, pity: { five: 0, four: 0 }, pityEv: { five: 0, four: 0 }, pityCone: { five: 0, four: 0, guar5: false, guar4: false }, pitySig: { five: 0, four: 0, guar5: false, guar4: false }, pityAmp: { five: 0, four: 0, guar5: false, guar4: false }, pityConv: { five: 0, four: 0, guar5: false, guar4: false }, pityForge: { five: 0, four: 0, guar5: false, guar4: false }, pityGuild: { five: 0, four: 0, guar5: false, guar4: false }, pityWiz: { five: 0, four: 0, guar5: false, guar4: false }, pityMid: { five: 0, four: 0, guar5: false, guar4: false }, pityCon: { five: 0, four: 0, guar5: false, guar4: false }, pityAlley: { five: 0, four: 0, guar5: false, guar4: false }, pityComp: { five: 0, four: 0, guar5: false, guar4: false },
      time: 0, obj: 'Прийти в себя', recaps: [], nextAtk: 0, nextCrit: 0, pendingTechs: [], warpLog: [], warpN: 0, warpNEv: 0, warpNCone: 0, warpNSig: 0, warpNAmp: 0, warpNConv: 0, warpNForge: 0, warpNGuild: 0, warpNWiz: 0, warpNMid: 0, warpNComp: 0, warpNCon: 0, warpNAlley: 0, conStar: 'makoto', alleyStar: 'makoto', warpBatch: 0, warpBan: null, evStar: 'ruanmei', coneStar: 'ruanmei', sigStar: 'miyabi', ampStar: 'miyabi', convStar: 'phrolova', forgeStar: 'phrolova', guildStar: 'aqua', wizStar: 'aqua', echoClaims: 0,
      comet: { start: null, done: null, got: [] }, will: [], mail: {}, record: null,
      quests: {}, missions: { done: {}, track: null, seen: {} }, su: null, suPaths: [], suClaims: [], squads: [], squad: 0
    };
  }

  const DAY_RESET_H = 4;
  const POWER_HOUR = 3600000;
  const COMET_STEP = 3600000;
  const COMET_REST = 5 * 3600000;
  const dayKey = ms => { const d = new Date(ms - DAY_RESET_H * 3600000); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function nextReset(ms) {
    const d = new Date(ms);
    d.setHours(DAY_RESET_H, 0, 0, 0);
    if (d.getTime() <= ms) d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  const JARILO_STEPS = [
    {
      maps: ['j_plains'],
      fix(s, f) {
        if (f.plains_met) Object.assign(f, { calyx_seen: true, drift_seen: true });
        else if (f.jarilo_arrive) { delete f.sampo_met; s.obj = 'Поищите следы цивилизации в Снежных полях'; }
      }
    },
    {
      maps: ['j_belobog'],
      fix(s, f) {
        if (f.belobog_intro) Object.assign(f, { fort_in: true, fort_audience: true });
        if (f.serval_met) Object.assign(f, { serval_in: true, serval_fix: true, mf_workshop: true });
        if (f.fled) Object.assign(f, { alley_seen: true, monument_seen: true, evn_free: true, hotel_in: true, hotel_rest: true, knock: true, pela_tour: true });
        else if (f.belobog_intro) s.obj = f.serval_met ? 'Посетите Монумент вечнозимья' : 'Загляните в мастерскую «Незимье»';
      }
    },
    {
      maps: ['u_boulder'],
      fix(s, f) {
        if (f.underworld) f.lost_world = true;
        if (f.club || f.moles) Object.assign(f, { hide_meet: true, hide_go: true, hide_p: true, hide_k: true, hide_j: true, hide_h: true, hide_done: true, club: true });
        if (f.moles) Object.assign(f, { ring_done: true, rule8_out: true });
        if (f.seele_trial) Object.assign(f, { blade_1: true, blade_2: true });
        if (f.mine_done) f.night_greet = true;
        if (f.night_talk) Object.assign(f, { night_key: true, night_dream: true, night_walk: true });
        if (f.rivet_done) Object.assign(f, { rust_back: true, rust_natasha: true, rust_done: true });
        if (f.returned) Object.assign(f, { fw_greet: true, fw_key: true, fw_sleep: true, fw_wake: true });
      }
    },
    {
      maps: ['u_mine'],
      fix(s, f) {
        if (f.mine_done) Object.assign(f, { mine_in: true, mine_ramp: true, mine_peak: true, mine_elaine: true, mine_lift: true, mine_stand: true, mine_search: true, mine_pin: true, mine_wheel: true, mine_cart: true, mine_wolf: true, mine_ledge: true });
      }
    },
    {
      maps: ['u_rivet'],
      fix(s, f) {
        if (f.rivet_intro) Object.assign(f, { riv_in: true, riv_view: true, riv_foe: true, riv_rest: true, riv_shop: true, riv_market: true, riv_crates: true, riv_eric: true, riv_side: true, riv_stairs: true, riv_hill: true, riv_front: true, riv_ice: true, riv_play: true, riv_sound: true, riv_found: true, riv_clara: true });
        else if (f.night_talk) s.obj = 'Отправляйтесь в Заклёпкоград за припасами (северный выход)';
      }
    },
    {
      maps: ['u_settle'],
      fix(s, f) {
        if (f.rivet_done) Object.assign(f, { rot_guide: true, rot_in: true, rot_camp: true, rot_gate: true, rot_c1: true, rot_c2: true, rot_c3: true, rot_gate1: true, rot_g2walk: true, rot_timmy: true, rot_store: true, rot_blaze: true, rot_chase: true, rot_lost: true, rot_found: true, rot_fix: true, rot_gate2: true, rot_end: true });
        else if (f.rust_done) s.obj = 'Найдите проводника, которого выделил Дикий Огонь';
        if (s.map === 'u_rivet') { s.x = null; s.y = null; }
      }
    },
    {
      maps: ['j_restricted'],
      fix(s, f) {
        if (f.finale_open) Object.assign(f, { ret_city: true, ret_hid: true, ret_told: true, ret_plan: true, ret_gepard: true });
        else if (f.returned) { f.ret_city = true; s.obj = 'Проберитесь в мастерскую «Незимье», не попадаясь патрулям'; }
        if (f.fissures_intro) Object.assign(f, { rz_in: true, rz_pass: true, rz_view: true, rz_t1: true, rz_t2: true, rz_guard: true, rz_dunn: true, rz_hubopen: true, rz_hub: true, rz_grizzly: true, rz_ew: true, rz_bridge: true, rz_gepard: true });
        else if (f.finale_open) s.obj = 'Идите вместе с Сервал в Запретную зону Среброгривых Стражей (юг района)';
      }
    },
    {
      maps: ['j_fissures'],
      fix(s, f) {
        if (f.everwinter_intro) Object.assign(f, { cor_deeper: true, cor_globe: true, cor_gate: true, cor_h0: true, cor_h1: true, cor_bridge: true, cor_ew: true, cor_h2: true, cor_h3: true, cor_hubs: true, cor_after_gate: true, cor_hall: true, cor_guard: true, cor_inner: true, cor_done: true });
        else if (f.fissures_intro) s.obj = 'Углубитесь в Коридор исчезающего эха';
      }
    },
    {
      maps: ['j_everwinter'],
      fix(s, f) {
        if (f.ending) Object.assign(f, { everwinter_intro: true, dawn_r1: true, dawn_stairs: true, dawn_top: true, dawn_summit: true, dawn_done: true, ret_wake: true, ret_mem1: true, ret_mem2: true, ret_mem3: true, ret_mem4: true, swamp_in: true, swamp_told: true, swamp_mine: true, swamp_camp: true, swamp_branch: true, swamp_back: true, swamp_done: true, time_meet: true, cable_open: true, time_gepard: true, time_crowd: true, crowned: true, time_done: true, gal_in: true, gal_monument: true, gal_ws: true, gal_sleep: true, gal_meet: true, jarilo_done: true });
        else if (f.everwinter_intro) s.obj = 'Найдите следы Брони и Коколии (тропа вверх по холму)';
      }
    },
    {
      maps: [],
      fix(s) {
        const widened = ['j_florist', 'j_hotel', 'j_fort', 'u_boulder', 'u_settle'];
        if (widened.includes(s.map)) { s.x = null; s.y = null; }
        if (s.lastAnchor && widened.includes(s.lastAnchor.map)) s.lastAnchor = { map: s.lastAnchor.map, x: null, y: null };
      }
    },
    {
      maps: [],
      fix(s, f) { restoreFestivalObjective(s, f); }
    }
  ];

  const FESTIVAL_STAGES = [
    ['fm2_done', 'fm_sleep'], ['fm_pl_talk', 'fm_pl_bronya'], ['fm_pl_view', 'fm_pl_view'], ['fm_pillars', 'fm_kyle'],
    ['fm2_fight', 'fm_rv_topaz'], ['fm_svarog', 'fm_rv_svarog'], ['fm_rv_road', 'fm_rv_road'], ['fm_bomb2', 'fm_rv_bomb2'],
    ['fm_bomb1', 'fm_rv_bomb1'], ['fm_rivet_in', 'fm_gepard'], ['fm_decide', 'fm_decide'], ['fm_seele_o', 'fm_o_seele'],
    ['fm_ow3&fm_uw3', 'fm_tie'], ['fm_ow3', 'fm_ow'], ['fm_uw3', 'fm_uw'], ['fm_ask', 'fm_letter2'], ['fm1_done', 'fm_mine2'],
    ['fm_mine1', 'fm_mine1'], ['fm_numby', 'fm_numby'], ['fm_mine_in', 'fm_mine_in'], ['fm_gate', 'fm_gate'], ['fm_seele', 'fm_seele'],
    ['fm_museum', 'fm_museum'], ['fm_fort1', 'fm_fort1'], ['fm0_done', 'fm_stroll'], ['fm_city', 'fm_city'], ['fm_topaz', 'fm_topaz'],
    ['fm_board', 'fm_m2'], ['fm_hm', 'fm_hm'], ['fm_dh', 'fm_dh'], ['fm_m1', 'fm_m1']
  ];
  const scriptObjective = name => (H.SCRIPTS[name].find(st => st && st.obj) || {}).obj;
  function restoreFestivalObjective(s, f) {
    const reached = FESTIVAL_STAGES.findIndex(([cond]) => cond.split('&').every(k => f[k]));
    if (reached < 0) return;
    const savedStage = FESTIVAL_STAGES.findIndex(([, name]) => scriptObjective(name) === s.obj);
    if (savedStage > reached) s.obj = scriptObjective(FESTIVAL_STAGES[reached][1]);
  }

  function markFloor(def, x, y) {
    if (!def.car && !def.zone && !def.land) return def.floor || '.';
    const seen = {};
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const ch = (def.rows[y + dy] || '')[x + dx], t = ch && H.TILES[ch];
      if (t && !t.solid && t.kind !== 'door') seen[ch] = (seen[ch] || 0) + 1;
    }
    let best = def.floor || '.', most = 0;
    for (const [ch, n] of Object.entries(seen)) if (n > most) { best = ch; most = n; }
    return best;
  }

  const layouts = new Map();
  function mapLayout(id) {
    let L = layouts.get(id);
    if (L) return L;
    const def = H.MAPS[id];
    const w = Math.max(...def.rows.map(r => r.length)), h = def.rows.length;
    const tiles = [], marks = {}, chests = [], anchors = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const ch = def.rows[y][x] || '#';
        if (H.TILES[ch]) { row.push(ch); continue; }
        row.push(def.marks[ch] && def.marks[ch].tile ? def.marks[ch].tile : markFloor(def, x, y));
        (marks[ch] = marks[ch] || []).push([x, y]);
        if (/[0-9]/.test(ch)) continue;
        const mk = def.marks[ch];
        if (mk ? mk.type === 'anchor' : ch === 'a') anchors.push({ x, y, key: id + ':' + anchors.length, name: def.anchors[anchors.length] || 'Якорь' });
        else if (!mk && ch === 'c') chests.push({ x, y, key: id + ':' + chests.length, def: def.chests[chests.length] || {} });
      }
      tiles.push(row);
    }
    L = { id, def, w, h, tiles, marks, chests, anchors };
    layouts.set(id, L);
    return L;
  }

  function centreOf(pts) {
    const x = pts.reduce((a, p) => a + p[0], 0) / pts.length, y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return [Math.round(x * 2) / 2, Math.round(y * 2) / 2];
  }

  let objIndex = null;
  function objAt(text) {
    if (!objIndex) {
      objIndex = new Map();
      for (const steps of Object.values(H.SCRIPTS)) for (const st of steps) if (st && st.obj && st.at) objIndex.set(st.obj, st.at);
    }
    return objIndex.get(text) || null;
  }

  function scriptEntries(steps) {
    const out = [];
    for (const st of steps) {
      if (typeof st === 'string') { if (st[0] !== '#') break; continue; }
      if (st.if !== undefined && st.jump) out.push(steps.indexOf('#' + st.jump));
    }
    return out;
  }

  let recapIndex = null;
  function recapSteps() {
    if (!recapIndex) {
      recapIndex = new Map();
      for (const [name, steps] of Object.entries(H.SCRIPTS)) steps.forEach((st, i) => { if (st && st.recap) recapIndex.set(st.recap, { script: name, at: i, step: st }); });
    }
    return recapIndex;
  }

  const TERMINALS = { warp: 'Звёздный прыжок', calyx: 'Симулятор', nav: 'Навигационный пульт', su: 'Виртуальная вселенная' };
  function npcRole(mk) {
    for (const st of H.SCRIPTS[mk.script] || []) {
      if (!st || !st.ui) continue;
      if (st.ui === 'shop' && H.SHOPS[st.id]) return { kind: 'shop', name: H.SHOPS[st.id].name, shop: st.id };
      if (st.ui === 'rumor') return { kind: 'rumor', name: 'Слухи', rumor: st.who };
      if (TERMINALS[st.ui]) return { kind: st.ui, name: TERMINALS[st.ui] };
    }
    return null;
  }

  const WARP_LOG = 1000;
  const GLOW = { dup: { 4: 8, 5: 40 }, max: { 4: 20, 5: 100 }, cone: { 3: ['embers', 20], 4: ['starlight', 8], 5: ['starlight', 40] } };
  const charGlow = (res, rar) => (res === 'eid' ? GLOW.dup[rar] : res === 'max' ? GLOW.max[rar] : 0) || 0;
  const RENAMED_FLAGS = { bronya_met: 'plains_met', jailed: 'fled' };

  class Game {
    constructor(opts = {}) {
      this.rng = H.makeRandom(opts.seed || ((Date.now() & 0xffffff) + 7));
      this.state = opts.state ? Object.assign(newState(), JSON.parse(JSON.stringify(opts.state))) : newState();
      this.clock = opts.clock || null;
      this.events = [];
      this.fixPower();
      this.fixWarpLog();
      this.fixGlow(!!opts.state && !opts.state.shop);
      this.fixFlags();
      this.fixStation(!!opts.state);
      this.fixJarilo(!!opts.state);
      this.fixStoryJoins();
      this.fixTrailLevel();
      this.fixExpScale(!!opts.state && !opts.state.xpv);
      this.fixRecaps(!!opts.state && !Array.isArray(opts.state.recaps));
      if (this.fixMissions) this.fixMissions(!!opts.state && !opts.state.missions);
      if (this.fixConductor) this.fixConductor();
      if (this.fixTraces) this.fixTraces(!!opts.state && !opts.state.trv);
      if (this.fixOutfitTiers) this.fixOutfitTiers(!!opts.state && !opts.state.otv);
      this.mailSync();
      this.pending = null;
      this.script = null;
      this.scriptQueue = [];
      this.skipping = false;
      this.battle = null;
      this.battleCtx = null;
      this.cg = null;
      this.player = { x: 0, y: 0, fx: 0, fy: 0, dir: 'down', moving: false, prog: 0, ox: 0, oy: 0, step: 0 };
      this.attackAnim = 0;
      this.loadMap(this.state.map, null, { x: this.state.x, y: this.state.y, silent: !opts.fresh });
      if (opts.fresh) this.runScript('opening');
    }

    static get newState() { return newState; }
    cond(expr) { return cond(expr, this.state.flags, this.state.quests, this.state.inv.items); }
    emit(e) { this.events.push(e); }
    toast(text) { this.emit({ t: 'toast', text }); }
    kitOf(key) { return key === 'trail' ? this.state.mcPath : key; }
    fill(text) {
      const f = this.state.gender === 'f';
      return String(text).replace(/\{name\}/g, this.state.name).replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, a, b) => (f ? b : a));
    }

    fixFlags() {
      const f = this.state.flags;
      for (const [was, now] of Object.entries(RENAMED_FLAGS)) if (f[was]) { f[now] = true; delete f[was]; }
    }

    fixStation(loaded) {
      const s = this.state, f = s.flags;
      if (!loaded) { s.hsv = 2; return; }
      if (s.hsv >= 2) return;
      s.hsv = 2;
      if (f.express_intro) f.doom = true;
      if (f.intro) for (const k of ['kafka_go', 'kafka_hall', 'kafka_route', 'kafka_room', 'kafka_hack', 'kafka_curio', 'chaos']) f[k] = true;
      if (f.doom) Object.assign(f, { lift: true, storm: true, moment: true, supply_in: true, hs_power: true, hs_bridge: true, herta_met: true });
      else if (f.intro) {
        delete f.asta_met; delete f.hs_power;
        Object.assign(f, { lift: true, arlan_met: true, storm: true });
        s.map = 'hs_control';
        s.obj = 'Расспросить Асту о положении на станции (главный пульт)';
      }
      if (/^hs_/.test(s.map)) { s.x = null; s.y = null; }
    }

    fixJarilo(loaded) {
      const s = this.state;
      if (!loaded) { s.jv = JARILO_STEPS.length + 1; return; }
      for (let v = s.jv || 1; v <= JARILO_STEPS.length; v++) {
        const step = JARILO_STEPS[v - 1];
        for (const id of step.maps) this.rebuiltMap(id);
        step.fix(s, s.flags);
      }
      s.jv = JARILO_STEPS.length + 1;
    }

    rebuiltMap(id) {
      const s = this.state, pre = id + ':', def = H.MAPS[id];
      const opened = Object.keys(s.opened).filter(k => k.startsWith(pre) && s.opened[k]);
      for (const k of opened) delete s.opened[k];
      for (let i = 0; i < Math.min(opened.length, def.chests.length); i++) s.opened[pre + i] = true;
      for (const k of Object.keys(s.broken)) if (k.startsWith(pre)) delete s.broken[k];
      const had = s.anchors.some(k => k.startsWith(pre));
      s.anchors = s.anchors.filter(k => !k.startsWith(pre));
      if (had) def.anchors.forEach((n, i) => s.anchors.push(pre + i));
      if (s.lastAnchor && s.lastAnchor.map === id) s.lastAnchor = { map: id, x: null, y: null };
      if (s.map === id) { s.x = null; s.y = null; }
    }

    setGuest(keys, o) {
      const s = this.state;
      if (!keys) {
        const g = s.guest;
        if (!g) return;
        for (const k of g.added) delete s.roster[k];
        s.party = g.party.filter(k => s.roster[k]);
        if (!s.party.length) s.party = [Object.keys(s.roster)[0]];
        delete s.guest;
        return;
      }
      const g = s.guest || (s.guest = { party: s.party.slice(), added: [] });
      for (const k of keys) {
        if (s.roster[k]) continue;
        s.roster[k] = { lvl: o.lvl || Math.max(1, this.avgLevel()), exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0, guest: true };
        g.added.push(k);
      }
      if (o.solo) s.party = keys.slice();
      else if (o.add) s.party = s.party.concat(keys.filter(k => !s.party.includes(k))).slice(0, 4);
      else {
        const rest = g.party.filter(k => !keys.includes(k));
        s.party = rest.slice(0, Math.max(0, 4 - keys.length)).concat(keys);
      }
    }

    fixStoryJoins() {
      const s = this.state;
      if (s.flags.arlan_met && !s.roster.arlan) this.addChar('arlan', this.avgLevel());
    }

    fixRecaps(old) {
      const s = this.state;
      if (!old) return;
      for (const [id, r] of recapSteps()) {
        const steps = H.SCRIPTS[r.script];
        const end = Math.min(steps.length, ...scriptEntries(steps).filter(i => i > r.at));
        if (steps.slice(r.at + 1, end).some(st => st && st.flag && s.flags[st.flag]) && !s.recaps.includes(id)) s.recaps.push(id);
      }
    }

    noteRecap(id) {
      if (!this.state.recaps.includes(id)) this.state.recaps.push(id);
    }

    recapLog() {
      const idx = recapSteps();
      return this.state.recaps.filter(id => idx.has(id)).map(id => ({ id, title: this.fill(id), text: this.fill(idx.get(id).step.text) }));
    }

    skipInfo() {
      const sc = this.script, p = this.pending;
      if (!sc || !sc.recap || !p || p.type !== 'say') return null;
      return { title: this.fill(sc.recap.recap), text: this.fill(sc.recap.text) };
    }

    skip() {
      if (!this.skipInfo()) return false;
      this.skipping = true;
      this.pending = null;
      this.advanceScript();
      return true;
    }

    loadMap(id, atMark, opts = {}) {
      const def = H.MAPS[id];
      const w = Math.max(...def.rows.map(r => r.length)), h = def.rows.length;
      const tiles = [], ents = [];
      let chestI = 0, anchorI = 0;
      const marks = {};
      for (let y = 0; y < h; y++) {
        const row = [];
        for (let x = 0; x < w; x++) {
          const ch = def.rows[y][x] || '#';
          if (H.TILES[ch]) { row.push(ch); continue; }
          row.push(def.marks[ch] && def.marks[ch].tile ? def.marks[ch].tile : markFloor(def, x, y));
          (marks[ch] = marks[ch] || []).push([x, y]);
          const mk = def.marks[ch];
          if (/[0-9]/.test(ch)) {
            const g = def.su ? this.suGroup(ch) : def.enemies[ch];
            if (!g) continue;
            ents.push({ kind: 'enemy', x, y, fx: x, fy: y, hx: x, hy: y, ch, def: g, ox: x, oy: y, prog: 1, t: this.rng() * 1.5, dir: 'down' });
          } else if (mk) {
            if (mk.type === 'spawn') continue;
            if (mk.visitor != null) {
              const who = this.visitorAt ? this.visitorAt(mk.visitor) : null;
              if (who) ents.push({ kind: 'npc', x, y, ch, def: Object.assign({}, mk, { who, visit: true }), dir: mk.dir || 'down' });
              continue;
            }
            if (mk.type === 'anchor') { ents.push({ kind: 'anchor', x, y, idx: anchorI, name: def.anchors[anchorI] || 'Якорь', key: id + ':' + anchorI }); anchorI++; continue; }
            ents.push({ kind: mk.type, x, y, ch, def: mk, dir: mk.dir || 'down' });
          } else if (ch === 'a') {
            ents.push({ kind: 'anchor', x, y, idx: anchorI, name: def.anchors[anchorI] || 'Якорь', key: id + ':' + anchorI });
            anchorI++;
          } else if (ch === 'c') {
            ents.push({ kind: 'chest', x, y, idx: chestI, def: def.chests[chestI] || {}, key: id + ':' + chestI });
            chestI++;
          } else if (ch === 'd') {
            ents.push({ kind: 'destr', x, y, key: (def.su ? 'su' + (this.state.su ? this.state.su.d : 0) : id) + ':' + x + ',' + y });
          }
        }
        tiles.push(row);
      }
      this.map = { id, def, w, h, tiles, ents, marks };
      this.state.map = id;
      let pos = null;
      if (atMark && marks[atMark]) pos = marks[atMark][0];
      else if (opts.x != null) pos = [opts.x, opts.y];
      else if (marks.v) pos = marks.v[0];
      else if (marks.s && def.marks.s && def.marks.s.type === 'spawn') pos = marks.s[0];
      else if (marks.a) pos = marks.a[0];
      else {
        const ex = Object.keys(def.marks).find(k => def.marks[k].type === 'exit' && marks[k]);
        pos = ex ? marks[ex][0] : [1, 1];
      }
      pos = this.freeNear(pos[0], pos[1]);
      this.placePlayer(pos[0], pos[1]);
      this.lastExitTile = atMark ? pos[0] + ',' + pos[1] : null;
      if (!opts.silent) {
        this.emit({ t: 'map', id, name: def.name, music: this.mapMusic(def) });
        for (const oe of def.onEnter || []) {
          if (oe.if && !this.cond(oe.if)) continue;
          if (oe.unless && this.state.flags[oe.unless]) continue;
          this.runScript(oe.script);
          break;
        }
      }
    }

    placePlayer(x, y) {
      const p = this.player;
      p.x = p.fx = p.ox = x; p.y = p.fy = p.oy = y; p.moving = false; p.prog = 0;
      this.state.x = x; this.state.y = y;
    }

    freeNear(x, y) {
      if (!this.blocked(x, y, true)) return [x, y];
      for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (!this.blocked(x + dx, y + dy, true)) return [x + dx, y + dy];
      }
      return [x, y];
    }

    visible(e) {
      const s = this.state;
      switch (e.kind) {
        case 'npc': return this.npcShown(e.def);
        case 'enemy': return !e.dead && this.cond(e.def.if) && !(e.def.unique && s.flags['k_' + e.def.unique]);
        case 'chest': case 'prop': case 'trigger': case 'lever': return this.cond(e.def.if);
        case 'destr': return !s.broken[e.key];
        case 'gate': return !s.flags[e.def.flag] && !(e.def.open && this.cond(e.def.open));
        case 'portal': return !!this.suPortal(e.def.slot);
        case 'su_heal': case 'su_tp': return !(s.su && s.su.dom && s.su.dom.used[e.x + ',' + e.y]);
        case 'exit': return true;
        default: return true;
      }
    }

    entAt(x, y, filter) {
      for (const e of this.map.ents) {
        if (e.kind === 'enemy') { if (Math.round(e.fx) === x && Math.round(e.fy) === y && this.visible(e) && (!filter || filter(e))) return e; continue; }
        if (e.x === x && e.y === y && this.visible(e) && (!filter || filter(e))) return e;
      }
      return null;
    }

    solidEnt(e) {
      if (e.kind === 'span') return !this.marvelDone(e.def.group);
      if (e.kind === 'rbridge') return !this.rbridgeOn(e.def.color);
      if (e.kind === 'gbridge') return !this.gbridgeOn(e.def.arm);
      return ['npc', 'chest', 'anchor', 'destr', 'gate', 'lever', 'prop', 'su_frame', 'su_heal', 'su_tp'].includes(e.kind);
    }

    gbridgeOn(arm) { return (arm === 'ew') === !!this.state.flags[this.map.def.gearFlag || 'gear_ew']; }

    rbridgeOn(color) { const f = this.state.flags; return color === 'blue' ? !!f.rb_blue : !!f.hs_bridge && !f.rb_blue; }

    marvelDone(group) { return !!this.state.flags['mv_' + this.map.id + '_' + group]; }

    marvelLit(e) { return !!(this.state.marvel && this.state.marvel[this.map.id + ':' + e.x + ',' + e.y]); }

    stepMarvel(e) {
      if (this.marvelLit(e) || this.marvelDone(e.def.group)) return;
      (this.state.marvel || (this.state.marvel = {}))[this.map.id + ':' + e.x + ',' + e.y] = true;
      this.emit({ t: 'sfx', id: 'select' });
      const all = this.map.ents.filter(o => o.kind === 'marvel' && o.def.group === e.def.group);
      if (all.every(o => this.marvelLit(o))) {
        this.state.flags['mv_' + this.map.id + '_' + e.def.group] = true;
        this.toast('Неземной материал засветился целиком и стал дорогой.');
        this.emit({ t: 'sfx', id: 'anchor' });
      }
    }

    blocked(x, y, forSpawn) {
      const m = this.map;
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
      const t = H.TILES[m.tiles[y][x]];
      if (t && t.solid) return true;
      for (const e of m.ents) {
        if (e.kind === 'enemy') { if (forSpawn && e.x === x && e.y === y && this.visible(e)) return true; continue; }
        if (e.x === x && e.y === y && this.visible(e) && (this.solidEnt(e) || (forSpawn && e.kind === 'trigger'))) return true;
      }
      return false;
    }

    busy() { return !!(this.pending || this.battle || this.script); }

    update(dt, input = {}) {
      const s = this.state;
      s.time += dt;
      this.powerSync();
      if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt);
      if (this.updatePet && !this.battle) this.updatePet(dt);
      if (this.pending && this.pending.type === 'walk') { this.walkStep(dt); return; }
      if (this.battle || this.pending) return;
      if (this.script) { this.advanceScript(); return; }
      this.movePlayer(dt, input);
      this.updateTram(dt);
      this.updateBarks(dt);
      this.updateEnemies(dt);
      this.updateWanderers(dt);
    }

    updateTram(dt) {
      const d = this.map.def.tram;
      if (!d) { this.tram = null; return; }
      const t = this.tram && this.tram.map === this.map.id ? this.tram : (this.tram = { map: this.map.id, y: d.y0, dir: 1, wait: d.pause });
      if (t.wait > 0) t.wait -= dt;
      else {
        t.y += t.dir * d.speed * dt;
        const end = t.dir > 0 ? d.y1 - d.len + 1 : d.y0;
        if ((t.dir > 0 && t.y >= end) || (t.dir < 0 && t.y <= end)) { t.y = end; t.dir = -t.dir; t.wait = d.pause; }
      }
      const p = this.player;
      if (p.moving || p.x < d.x || p.x > d.x + 1 || p.y < Math.floor(t.y) || p.y > Math.ceil(t.y) + d.len - 1) return;
      for (const side of [d.x - 1, d.x + 2, d.x - 2, d.x + 3]) {
        if (!this.blocked(side, p.y)) { this.placePlayer(side, p.y); break; }
      }
      this.emit({ t: 'sfx', id: 'hit' });
      this.toast(this.fill('Трамвай Динь-Динь звенит: «Ты вообще умеешь переходить улицу? Совсем {слепой|слепая}?»'));
    }

    updateBarks(dt) {
      const p = this.player, b = this.bark;
      if (b && b.map === this.map.id) {
        b.t += dt;
        if (b.t >= 2.6) { b.t = 0; b.i++; }
        if (b.i < b.lines.length && Math.hypot(b.src.x - p.x, b.src.y - p.y) < 6) return;
        this.bark = null;
      } else if (b) this.bark = null;
      const seen = this.barkSeen || (this.barkSeen = {});
      for (const e of this.map.ents) {
        if (e.kind !== 'npc' || !e.def.bark || !this.visible(e) || Math.hypot(e.x - p.x, e.y - p.y) > 2.5) continue;
        const key = this.map.id + ':' + e.x + ',' + e.y;
        if (seen[key] && this.state.time - seen[key] < 25) continue;
        seen[key] = this.state.time;
        const lines = e.def.bark.map(l => { const i = l.indexOf('|'), m = l.slice(0, i), at = m && this.map.marks[m] ? this.map.marks[m][0] : [e.x, e.y]; return { x: at[0], y: at[1], text: this.fill(l.slice(i + 1)) }; });
        this.bark = { map: this.map.id, src: e, lines, i: 0, t: 0 };
        return;
      }
    }

    findieTarget() {
      const p = this.player;
      let best = null, bd = Infinity;
      for (const e of this.map.ents) {
        if (!e.def || !e.def.findie || !this.visible(e)) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bd) { bd = d; best = { x: e.x, y: e.y, dist: d }; }
      }
      return best;
    }

    npcWalk(st) {
      const e = this.map.ents.find(x => x.kind === 'npc' && x.ch === st.walk);
      if (!e) return false;
      const home = st.to === 'home', [tx, ty] = home ? this.map.marks[st.walk][0] : this.walkGoal(e);
      const path = [];
      let x = e.x, y = e.y;
      while (y !== ty) { y += Math.sign(ty - y); path.push([x, y]); }
      while (x !== tx) { x += Math.sign(tx - x); path.push([x, y]); }
      const w = { type: 'walk', ent: e, path, home };
      Object.assign(e, { fx: e.x, fy: e.y, ox: e.x, oy: e.y, prog: 1 });
      if (!path.length || this.skipping) { this.walkEnd(w); return false; }
      this.pending = w;
      return true;
    }

    walkGoal(e) {
      const p = this.player, near = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => !this.blocked(x, y));
      near.sort((a, b) => Math.abs(a[0] - e.x) + Math.abs(a[1] - e.y) - Math.abs(b[0] - e.x) - Math.abs(b[1] - e.y));
      return near[0] || [e.x, e.y];
    }

    walkStep(dt) {
      const w = this.pending, e = w.ent;
      if (e.prog >= 1) {
        if (!w.path.length) { this.walkEnd(w); this.pending = null; this.advanceScript(); return; }
        const [nx, ny] = w.path.shift();
        e.dir = nx > e.x ? 'right' : nx < e.x ? 'left' : ny > e.y ? 'down' : 'up';
        e.ox = e.x; e.oy = e.y; e.x = nx; e.y = ny; e.prog = 0;
      }
      e.prog = Math.min(1, e.prog + dt * 5);
      e.fx = e.ox + (e.x - e.ox) * e.prog; e.fy = e.oy + (e.y - e.oy) * e.prog;
    }

    walkEnd(w) {
      const e = w.ent, p = this.player, last = w.path[w.path.length - 1];
      if (last) { e.x = last[0]; e.y = last[1]; }
      w.path = [];
      Object.assign(e, { fx: e.x, fy: e.y, ox: e.x, oy: e.y, prog: 1 });
      if (w.home) { e.dir = e.def.dir || 'down'; return; }
      const dx = p.x - e.x, dy = p.y - e.y;
      e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      p.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[e.dir];
    }

    barkLine() { const b = this.bark; return b && b.map === this.map.id && b.i < b.lines.length ? b.lines[b.i] : null; }

    updateWanderers(dt) {
      const p = this.player;
      for (const e of this.map.ents) {
        if (e.kind !== 'npc' || !e.def.wander || !this.visible(e)) continue;
        if (e.hx == null) Object.assign(e, { hx: e.x, hy: e.y, fx: e.x, fy: e.y, ox: e.x, oy: e.y, prog: 1, t: 1 + this.rng() * 2 });
        if (e.prog < 1) {
          e.prog = Math.min(1, e.prog + dt * 2.2);
          e.fx = e.ox + (e.x - e.ox) * e.prog; e.fy = e.oy + (e.y - e.oy) * e.prog;
          continue;
        }
        e.t -= dt;
        if (e.t > 0) continue;
        e.t = 0.8 + this.rng() * 2.4;
        if (Math.abs(e.x - p.x) + Math.abs(e.y - p.y) <= 1) continue;
        const [dx, dy] = this.rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        const nx = e.x + dx, ny = e.y + dy;
        e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        if (Math.abs(nx - e.hx) > e.def.wander || Math.abs(ny - e.hy) > e.def.wander) continue;
        if (this.blocked(nx, ny) || (nx === p.x && ny === p.y)) continue;
        if (this.map.ents.some(o => (o.kind === 'exit' || o.kind === 'trigger') && o.x === nx && o.y === ny)) continue;
        e.ox = e.x; e.oy = e.y; e.x = nx; e.y = ny; e.prog = 0;
      }
    }

    movePlayer(dt, input) {
      const p = this.player;
      const speed = (input.walk ? 3.2 : 5.5) * (this.speedMul ? this.speedMul() : 1);
      if (p.moving) {
        p.prog += dt * speed;
        if (p.prog >= 1) {
          p.prog = 1; p.moving = false;
          p.fx = p.x; p.fy = p.y;
          this.state.x = p.x; this.state.y = p.y;
          this.onStep();
          if (this.battle || this.script || this.pending) return;
        } else {
          p.fx = p.ox + (p.x - p.ox) * p.prog;
          p.fy = p.oy + (p.y - p.oy) * p.prog;
          return;
        }
      }
      if (input.dir) {
        p.dir = input.dir;
        this.state.dir = input.dir;
        const [dx, dy] = DIRS[input.dir];
        const nx = p.x + dx, ny = p.y + dy;
        if (!this.blocked(nx, ny)) {
          p.ox = p.x; p.oy = p.y; p.x = nx; p.y = ny; p.moving = true; p.prog = 0; p.step++;
        } else {
          const ex = this.entAt(nx, ny, e => e.kind === 'exit');
          if (ex) this.useExit(ex);
        }
      }
    }

    onStep() {
      const p = this.player;
      const key = p.x + ',' + p.y;
      if (this.lastExitTile && this.lastExitTile !== key) this.lastExitTile = null;
      for (const a of this.map.ents) {
        if (a.kind === 'anchor' && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) <= 2) this.unlockAnchor(a);
      }
      const here = this.map.ents.filter(e => e.x === p.x && e.y === p.y && this.visible(e));
      for (const e of here) if (e.kind === 'marvel') this.stepMarvel(e);
      for (const e of here) {
        if (e.kind === 'portal') { this.suNext(e.def.slot); return; }
        if (e.kind === 'exit' && this.lastExitTile !== key) { this.useExit(e); return; }
        if (e.kind === 'trigger') {
          if (e.def.once && this.state.flags[e.def.once]) continue;
          if (e.def.if && !this.cond(e.def.if)) continue;
          this.runScript(e.def.script);
          return;
        }
      }
      const en = this.entAt(p.x, p.y, e => e.kind === 'enemy');
      if (en) this.encounter(en, null);
    }

    useExit(e) {
      if (e.def.lift) { this.openLift(e); return; }
      if (e.def.need && !this.cond(e.def.need)) {
        this.toast(e.def.lockText || 'Проход закрыт.');
        this.emit({ t: 'sfx', id: 'deny' });
        return;
      }
      this.emit({ t: 'sfx', id: 'door' });
      const dest = this.exitDest(e.def);
      this.loadMap(dest.to, dest.at);
    }

    exitDest(mk) { return mk.alt && this.cond(mk.alt.if) ? mk.alt : mk; }

    unlockAnchor(a) {
      if (this.state.anchors.includes(a.key)) return;
      this.state.anchors.push(a.key);
      this.toast('Якорь пространства активирован: ' + a.name);
      this.emit({ t: 'sfx', id: 'anchor' });
    }

    updateEnemies(dt) {
      const p = this.player;
      for (const e of this.map.ents) {
        if (e.kind !== 'enemy' || !this.visible(e)) continue;
        if (e.prog < 1) {
          e.prog = Math.min(1, e.prog + dt * (e.chase ? 3.4 : 1.6));
          e.fx = e.ox + (e.x - e.ox) * e.prog;
          e.fy = e.oy + (e.y - e.oy) * e.prog;
          if (e.prog >= 1 && e.x === p.x && e.y === p.y) { this.encounter(e, 'enemy'); return; }
          continue;
        }
        e.t -= dt;
        if (e.t > 0) continue;
        const dist = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
        e.chase = dist <= 4 && Math.abs(e.x - e.hx) + Math.abs(e.y - e.hy) <= 6;
        e.t = e.chase ? 0.35 : 1 + this.rng() * 1.6;
        let dx = 0, dy = 0;
        if (e.chase) {
          if (Math.abs(p.x - e.x) > Math.abs(p.y - e.y)) dx = Math.sign(p.x - e.x); else dy = Math.sign(p.y - e.y);
          if (dist === 1 && !p.moving) { e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; this.encounter(e, 'enemy'); return; }
        } else {
          const d = this.rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]);
          dx = d[0]; dy = d[1];
          if (Math.abs(e.x + dx - e.hx) > 2 || Math.abs(e.y + dy - e.hy) > 2) { dx = Math.sign(e.hx - e.x); dy = dx ? 0 : Math.sign(e.hy - e.y); }
        }
        if (!dx && !dy) continue;
        const nx = e.x + dx, ny = e.y + dy;
        e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        if (this.blocked(nx, ny) || this.map.ents.some(o => o !== e && o.kind === 'enemy' && this.visible(o) && o.x === nx && o.y === ny)) continue;
        const onTrigger = this.map.ents.some(o => (o.kind === 'exit' || o.kind === 'trigger') && o.x === nx && o.y === ny);
        if (onTrigger) continue;
        e.ox = e.x; e.oy = e.y; e.x = nx; e.y = ny; e.prog = 0;
      }
    }

    front() {
      const p = this.player;
      const [dx, dy] = DIRS[p.dir];
      return [p.x + dx, p.y + dy];
    }

    interact(opts = {}) {
      if (this.busy() || this.player.moving) return false;
      const [fx, fy] = this.front();
      const e = this.entAt(fx, fy, x => x.kind !== 'enemy' && x.kind !== 'trigger' && x.kind !== 'exit' && x.kind !== 'marvel' && x.kind !== 'span' && x.kind !== 'rbridge' && x.kind !== 'gbridge');
      if (!e) return this.petTouch ? this.petTouch(fx, fy) : false;
      switch (e.kind) {
        case 'npc':
          if (e.def.dir !== 'fixed') e.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[this.player.dir];
          if (e.def.visit && this.visitorTalk) this.visitorTalk(e.def.who);
          else if (e.def.script) this.runScript(e.def.script);
          else this.say(e.def.name ? e.def.who + '=' + e.def.name : e.def.who, e.def.text || '...');
          return true;
        case 'chest': return this.openChest(e);
        case 'anchor':
          this.unlockAnchor(e);
          this.state.lastAnchor = { map: this.map.id, x: this.player.x, y: this.player.y };
          this.pending = { type: 'ui', ui: 'anchor', anchor: e };
          return true;
        case 'lever':
          if (this.state.flags[e.def.flag]) { this.toast('Рубильник уже включён.'); return true; }
          this.emit({ t: 'sfx', id: 'lever' });
          this.runScript(e.def.script);
          return true;
        case 'destr': this.breakDestr(e); return true;
        case 'gate':
          if (e.def.script) { this.runScript(e.def.script); return true; }
          this.toast(e.def.text || 'Переборка обесточена.');
          return true;
        case 'prop':
          if (e.def.calyx) { this.pending = { type: 'ui', ui: 'calyx', only: [].concat(e.def.calyx) }; return true; }
          if (e.def.doc) { this.state.flags['doc_' + e.def.doc] = true; this.pending = { type: 'ui', ui: 'doc', doc: e.def.doc }; return true; }
          if (!e.def.script) return false;
          this.runScript(opts.shift && e.def.shift ? e.def.shift : e.def.script);
          return true;
        case 'su_frame': {
          const dom = this.state.su && this.state.su.dom, ev = dom && H.SU.EVENTS[dom.event];
          if (!ev || dom.cleared) { this.toast('Рама пуста.'); return true; }
          this.emit({ t: 'sfx', id: 'select' });
          this.runScript(ev.script);
          return true;
        }
        case 'su_heal': case 'su_tp': return this.suUseObject(e);
      }
      return false;
    }

    say(spk, text) { this.script = { steps: [spk + '|' + text], pc: 0, labels: {} }; this.advanceScript(); }

    openChest(e) {
      if (this.state.opened[e.key]) { this.toast('Пусто.'); return true; }
      this.state.opened[e.key] = true;
      this.emit({ t: 'sfx', id: 'chest' });
      const got = this.give(e.def);
      this.toast('Сундук: ' + got.join(', '));
      return true;
    }

    breakDestr(e) {
      this.state.broken[e.key] = true;
      this.emit({ t: 'sfx', id: 'break' });
      this.emit({ t: 'burst', x: e.x, y: e.y });
      if (this.map.def.su && this.state.su) {
        const n = H.SU.TUN.fragDestr;
        this.state.su.frag += n;
        this.toast('+' + n + ' космических фрагментов');
        return;
      }
      this.state.tp = Math.min(T.tpMax, this.state.tp + 1);
      this.state.credits += 20;
      const extra = this.synDestr ? this.synDestr() : '';
      this.toast('+1 очко техники, +20 кредитов' + (extra ? ', ' + extra : ''));
    }

    attack() {
      if (this.busy()) return false;
      this.attackAnim = 0.25;
      this.emit({ t: 'sfx', id: 'swing' });
      const p = this.player;
      const [fx, fy] = this.front();
      const d = this.entAt(fx, fy, e => e.kind === 'destr');
      if (d) { this.breakDestr(d); return true; }
      const targets = [[p.x, p.y], [fx, fy], [fx + (fx - p.x), fy + (fy - p.y)]];
      for (const [x, y] of targets) {
        const e = this.map.ents.find(o => o.kind === 'enemy' && this.visible(o) && Math.abs(o.fx - x) < 0.6 && Math.abs(o.fy - y) < 0.6);
        if (e) { this.encounter(e, 'player'); return true; }
      }
      return false;
    }

    technique() {
      if (this.busy()) return false;
      const s = this.state;
      const key = s.party[0];
      const kit = H.CHARS[this.kitOf(key)];
      if (s.pendingTechs.includes(this.kitOf(key))) { this.toast('Техника уже подготовлена.'); return false; }
      if (s.tp <= 0) { this.toast('Нет очков техники. Разбивайте ящики (F) или выпейте кофе.'); this.emit({ t: 'sfx', id: 'deny' }); return false; }
      s.tp--;
      s.pendingTechs.push(this.kitOf(key));
      this.emit({ t: 'sfx', id: 'tech' });
      this.toast('Техника: ' + kit.tech.name + ' — ' + kit.tech.text);
      if (ATTACK_TECHS.has(kit.tech.fx)) return this.attack();
      return true;
    }

    setLeader(i) {
      const s = this.state;
      if (i <= 0 || i >= s.party.length) return;
      const k = s.party.splice(i, 1)[0];
      s.party.unshift(k);
      this.emit({ t: 'sfx', id: 'select' });
    }

    encounter(e, ambush) {
      if (this.battle) return;
      if (this.map.def.su && this.state.su) { this.suEncounter(e, ambush); return; }
      const g = e.def;
      this.startBattle({ enemies: g.g.map(id => id + ':' + g.lvl), lvl: g.lvl, ambush, ent: e, bg: this.map.def.theme, music: this.battleTheme() });
    }

    partySpecs(trials) {
      const s = this.state;
      let keys = s.party.slice(0, 4);
      if (trials && trials.length) {
        keys = keys.filter(k => !trials.includes(this.kitOf(k)));
        while (keys.length + trials.length > 4) keys.pop();
      }
      const specs = keys.map(k => {
        const r = s.roster[k];
        const st = this.charStats(k);
        return { key: k, charId: this.kitOf(k), name: k === 'trail' ? s.name : undefined, lvl: r.lvl, stats: st, hp: r.hp == null ? st.hp : Math.min(r.hp, st.hp), energy: r.energy || 0, cone: this.coneEffect(k), sets: this.planarSets(k), tr: this.traceSpec ? this.traceSpec(k) : null, eid: r.eid || 0 };
      });
      if (trials) {
        const avg = Math.max(1, Math.round(specs.reduce((a, b) => a + b.lvl, 0) / Math.max(1, specs.length)));
        for (const t of trials) {
          const lvl = Math.max(avg, 1);
          const st = this.baseStats(t, lvl, 0);
          specs.push({ key: 'trial:' + t, charId: t, lvl, stats: st, hp: st.hp, energy: Math.round(H.CHARS[t].energy * 0.5), trial: true, tr: this.traceTrialSpec ? this.traceTrialSpec(t, lvl) : null, eid: 0 });
        }
      }
      if (specs.length && specs.every(p => p.hp <= 0)) for (const p of specs) p.hp = Math.max(1, Math.round(p.stats.hp * 0.3));
      return specs;
    }

    startBattle(o) {
      const s = this.state;
      const enc = o.encId ? H.ENCOUNTERS[o.encId] : null;
      const trials = enc && enc.trials ? enc.trials : null;
      const party = o.party || (o.su ? this.suPartySpecs() : this.partySpecs(trials));
      const techs = o.techs || s.pendingTechs.map(c => ({ charId: c, fx: H.CHARS[c].tech.fx })).filter(t => party.some(p => p.charId === t.charId));
      if (!o.techs) s.pendingTechs = [];
      const opts = {
        party, seed: o.seed || this.rng.int(1e9) + 1,
        enemies: enc ? enc.enemies : o.enemies, waves: enc ? enc.waves : o.waves,
        lvl: o.lvl || 1, boss: enc ? !!enc.boss : !!o.boss, noFlee: enc ? !!enc.noFlee : !!o.noFlee,
        ambush: o.ambush, leader: 0, techs, nextAtk: s.nextAtk, nextCrit: s.nextCrit,
        rumorKind: !!s.flags.rumor_kind, noContact: !!o.noContact || !!o.su,
        su: o.su ? this.suBattleOpts() : null, foeHp: o.foeHp || 1, foeAtk: o.foeAtk || 1, fh: o.fh || null, endAt: enc ? enc.endAt || 0 : 0, hpStart: enc ? enc.hpStart || 0 : 0, allyBuff: enc ? enc.allyBuff || null : null, field: enc ? enc.field || null : null
      };
      s.nextAtk = 0;
      s.nextCrit = 0;
      this.battle = new H.Battle(opts);
      this.battleCtx = { o, enc, encId: o.encId, ent: o.ent || null, bg: (enc && enc.bg) || o.bg || this.map.def.theme, music: (enc && enc.music) || o.music || this.battleTheme(), fromScript: !!o.fromScript, calyx: o.calyx || null, opts };
      for (const e of this.battle.waves.flat()) {
        const id = String(e).split(':')[0];
        const b = s.bank.enemies[id] || (s.bank.enemies[id] = { seen: 0, kills: 0, contacts: {} });
        b.seen++;
      }
      this.emit({ t: 'battle', bg: this.battleCtx.bg, music: this.battleCtx.music, boss: opts.boss });
      return this.battle;
    }

    endBattle() {
      const b = this.battle, ctx = this.battleCtx, s = this.state;
      if (!b || !b.over) return null;
      const r = b.result;
      const out = { win: r.win, fled: r.fled, lines: [], levelUps: [] };
      if (ctx.o && ctx.o.su && this.state.su) return this.suEndBattle(b, ctx, out);
      if (ctx.o && ctx.o.fh) return this.fhEndBattle(b, ctx, out);
      for (const a of r.allies) {
        if (a.trial || !s.roster[a.key]) continue;
        s.roster[a.key].hp = a.hp;
        s.roster[a.key].energy = a.energy;
      }
      this.battle = null;
      if (r.fled) {
        if (ctx.ent) { ctx.ent.t = 2.5; ctx.ent.chase = false; this.bumpBack(ctx.ent); }
        this.battleCtx = null;
        out.lines.push('Вы отступили.');
        return out;
      }
      if (!r.win) {
        this.battleCtx = Object.assign(ctx, { lost: true });
        out.lost = true;
        out.fromScript = !!ctx.fromScript;
        return out;
      }
      const rw = r.reward;
      for (const f of r.fusions) if (!s.bank.fusions.includes(f)) { s.bank.fusions.push(f); out.lines.push('Новое слияние в Архиве: ' + H.FUSIONS[f].name); }
      for (const c of rw.contacts) { const e = s.bank.enemies[c.id]; if (e) e.contacts[c.mood] = (e.contacts[c.mood] || 0) + 1; }
      for (const u of b.enemies) if (u.dead && s.bank.enemies[u.id]) s.bank.enemies[u.id].kills++;
      let jade = rw.jade;
      if (ctx.encId && H.ENCOUNTERS[ctx.encId].boss) {
        const fk = 'first_' + ctx.encId;
        if (s.flags[fk]) jade = 0; else s.flags[fk] = true;
      }
      if (ctx.calyx) jade = 0;
      s.credits += rw.credits;
      s.jade += jade;
      out.exp = H.charExp(rw.exp, this.avgLevel());
      out.tlExp = rw.exp;
      out.credits = rw.credits;
      out.jade = jade;
      for (const k of s.party.slice(0, 4)) {
        const ups = this.addExp(k, H.charExp(rw.exp, s.roster[k].lvl));
        if (ups) out.levelUps.push({ key: k, lvl: s.roster[k].lvl });
      }
      for (const k of Object.keys(s.roster)) if (!s.party.slice(0, 4).includes(k)) this.addExp(k, H.charExp(rw.exp * 0.3, s.roster[k].lvl));
      this.addTrailExp(rw.exp);
      const got = [];
      for (const d of [...rw.drops, ...rw.gifts]) got.push(...this.give(this.dropToGive(d, b.opts.lvl)));
      if (ctx.calyx) got.push(...this.calyxReward(ctx.calyx));
      if (this.traceBattleLoot) got.push(...this.traceBattleLoot(b, ctx));
      if (ctx.ent && ctx.ent.def.loot) got.push(...this.give(ctx.ent.def.loot));
      out.items = got;
      if (ctx.ent) {
        ctx.ent.dead = true;
        if (ctx.ent.def.unique) s.flags['k_' + ctx.ent.def.unique] = true;
      }
      this.battleCtx = null;
      return out;
    }

    bumpBack(e) {
      const p = this.player;
      const dx = Math.sign(e.x - p.x), dy = Math.sign(e.y - p.y);
      const nx = e.x + (dx || 0), ny = e.y + (dy || (dx ? 0 : 1));
      if (!this.blocked(nx, ny)) { e.x = e.fx = e.ox = nx; e.y = e.fy = e.oy = ny; e.prog = 1; }
    }

    retryBattle() {
      const ctx = this.battleCtx;
      if (!ctx || !ctx.lost || (ctx.o.su && this.state.su && !this.state.su.tut)) return false;
      if (ctx.o.fh) return this.fhRetry();
      if (ctx.o.su && this.state.su) { this.state.su.hp = JSON.parse(JSON.stringify(ctx.o.suHp)); this.state.su.en = JSON.parse(JSON.stringify(ctx.o.suEn)); }
      else for (const k of Object.keys(this.state.roster)) { this.state.roster[k].hp = null; }
      this.battleCtx = null;
      this.startBattle(ctx.o);
      return true;
    }

    giveUpBattle() {
      const ctx = this.battleCtx;
      if (ctx && ctx.o && ctx.o.su && this.state.su) return this.suFail();
      if (ctx && ctx.o && ctx.o.fh) return this.fhAbort();
      this.battleCtx = null;
      this.rest();
      const la = this.state.lastAnchor;
      if (ctx && ctx.fromScript) return this.retryBattleFrom(ctx);
      if (la) this.loadMap(la.map, null, { x: la.x, y: la.y });
      else this.loadMap(this.state.map, null, { x: this.player.x, y: this.player.y, silent: true });
      this.toast('Команда отдохнула у якоря пространства.');
      return true;
    }

    retryBattleFrom(ctx) { this.startBattle(ctx.o); return true; }

    dropToGive(d, lvl) {
      if (d === 'relic') return { relic: 1, lvl };
      if (d === 'jadeSmall') return { jade: 5 };
      if (d === 'credits') return { credits: 40 * (lvl || 1) };
      if (H.ITEMS[d]) return { items: { [d]: 1 } };
      return {};
    }

    give(g) {
      const s = this.state, out = [];
      if (!g) return out;
      if (g.jade) { s.jade += g.jade; out.push(g.jade + ' нефрита'); }
      if (g.credits) { s.credits += g.credits; out.push(H.fmt(g.credits) + ' кредитов'); }
      for (const [id, n] of Object.entries(g.items || {})) { s.inv.items[id] = (s.inv.items[id] || 0) + n; out.push(H.ITEMS[id].name + (n > 1 ? ' ×' + n : '')); }
      if (g.cone) { this.addCone(g.cone); out.push('конус «' + H.CONES[g.cone].name + '»'); }
      for (const id of [].concat(g.outfit || [])) if (H.OUTFITS && H.OUTFITS[id]) { if (!s.outfits.includes(id)) s.outfits.push(id); out.push('наряд «' + H.OUTFITS[id].name + '»'); }
      for (let i = 0; i < (g.relic || 0); i++) { const r = this.rollRelic(g.lvl || this.avgLevel(), g.sets); out.push('реликвия «' + H.RELIC_SETS[r.set].name + '» (' + H.RELIC_SLOTS.find(x => x.key === r.slot).name + ')'); }
      for (const o of [].concat(g.ornament || [])) {
        for (let i = 0; i < (o.n || 1); i++) for (const sl of H.PLANAR_SLOTS) this.rollPlanar(o.set, o.rl, sl.key);
        out.push('украшения «' + H.RELIC_SETS[o.set].name + '»' + ((o.n || 1) > 1 ? ' ×' + o.n : ''));
      }
      return out;
    }

    take(g) {
      const s = this.state;
      if (g.credits) s.credits = Math.max(0, s.credits - g.credits);
      for (const [id, n] of Object.entries(g.items || {})) {
        s.inv.items[id] = Math.max(0, (s.inv.items[id] || 0) - n);
        if (!s.inv.items[id]) delete s.inv.items[id];
      }
    }

    avgLevel() {
      const s = this.state, ks = s.party.slice(0, 4);
      return Math.round(ks.reduce((a, k) => a + s.roster[k].lvl, 0) / ks.length);
    }

    addExp(key, n) {
      const r = this.state.roster[key];
      if (!r || n <= 0) return false;
      r.exp += n;
      let up = false;
      while (r.lvl < MAX_LVL && r.exp >= H.expToNext(r.lvl)) { r.exp -= H.expToNext(r.lvl); r.lvl++; up = true; }
      if (r.lvl >= MAX_LVL) r.exp = 0;
      return up;
    }

    fixTrailLevel() {
      const s = this.state, tr = s.roster.trail;
      if (s.tl && s.tl.lvl) return;
      const lvl = H.clamp((tr && tr.lvl) || 1, 1, TL_MAX);
      s.tl = { lvl, exp: lvl >= TL_MAX ? 0 : (tr && tr.exp) || 0 };
    }

    fixExpScale(old) {
      if (!old) return;
      for (const r of Object.values(this.state.roster)) if (r && r.exp > 0) r.exp = Math.min(H.charExp(r.exp, r.lvl), H.expToNext(r.lvl) - 1);
    }

    trailLevel() { return this.state.tl.lvl; }

    addTrailExp(n) {
      const tl = this.state.tl, from = tl.lvl;
      if (n <= 0 || tl.lvl >= TL_MAX) return false;
      tl.exp += Math.round(n);
      while (tl.lvl < TL_MAX && tl.exp >= H.tlExpToNext(tl.lvl)) { tl.exp -= H.tlExpToNext(tl.lvl); tl.lvl++; }
      if (tl.lvl >= TL_MAX) tl.exp = 0;
      if (tl.lvl === from) return false;
      this.emit({ t: 'tl', from, lvl: tl.lvl });
      return true;
    }

    setTrailLevel(lvl) {
      this.state.tl = { lvl: H.clamp(Math.round(lvl) || 1, 1, TL_MAX), exp: 0 };
      return this.state.tl.lvl;
    }

    baseStats(kitId, lvl, eid) {
      const c = H.CHARS[kitId];
      const e = 1 + 0.04 * (H.TRACES && H.TRACES[kitId] && H.TRACES[kitId].eidFx ? 0 : Math.min(6, eid || 0));
      return {
        hp: Math.round(H.statAt(c.base.hp, lvl) * e), atk: Math.round(H.statAt(c.base.atk, lvl) * e), def: Math.round(H.statAt(c.base.def, lvl) * e), spd: c.base.spd,
        critR: 0.05, critD: 0.5, breakE: 0, ehr: 0, res: 0, healP: 0, err: 0, dmgP: 0, ultP: 0
      };
    }

    charStats(key) {
      const s = this.state, r = s.roster[key], kitId = this.kitOf(key), c = H.CHARS[kitId];
      const st = this.baseStats(kitId, r.lvl, r.eid);
      const pct = { hpP: 0, atkP: 0, defP: 0 }, flat = { hpF: 0, atkF: 0, defF: 0 };
      const addStat = (k, v) => {
        if (k in pct) pct[k] += v;
        else if (k in flat) flat[k] += v;
        else st[k] = (st[k] || 0) + v;
      };
      const cone = r.cone ? s.inv.cones.find(x => x.uid === r.cone) : null;
      if (cone) {
        const cd = H.CONES[cone.id], g = H.grow(r.lvl);
        flat.hpF += Math.round(cd.stats.hp * g); flat.atkF += Math.round(cd.stats.atk * g); flat.defF += Math.round(cd.stats.def * g);
        if (cd.path === c.path) for (const [k, v] of Object.entries(cd.bonus)) addStat(k, cd.p ? H.coneParam(cone.id, v, cone.sup) : v * H.coneLegacyMul(cone.sup));
      }
      const sets = {};
      for (const uid of Object.values(r.relics || {})) {
        const rel = s.inv.relics.find(x => x.uid === uid);
        if (!rel) continue;
        addStat(rel.main, rel.mv);
        for (const [k, v] of rel.subs) addStat(k, v);
        sets[rel.set] = (sets[rel.set] || 0) + 1;
      }
      for (const [set, n] of Object.entries(sets)) if (n >= 2) for (const [k, v] of Object.entries(H.RELIC_SETS[set].bonus)) addStat(k, v * (n >= 4 ? 2 : 1));
      if (this.traceStats) for (const [k, v] of this.traceStats(key)) addStat(k, v);
      st.hp = Math.round(st.hp * (1 + pct.hpP) + flat.hpF);
      st.atk = Math.round(st.atk * (1 + pct.atkP) + flat.atkF);
      st.def = Math.round(st.def * (1 + pct.defP) + flat.defF);
      st.spd = Math.round((st.spd + (st.spdF || 0)) * 10) / 10;
      return st;
    }

    coneEffect(key) {
      const r = this.state.roster[key], cn = r && r.cone ? this.state.inv.cones.find(x => x.uid === r.cone) : null, d = cn && H.CONES[cn.id];
      return d && d.fx && d.path === H.CHARS[this.kitOf(key)].path ? { id: cn.id, fx: d.fx, sup: cn.sup || 1 } : null;
    }

    addChar(id, lvl) {
      const s = this.state;
      if (id === 'trail_p') id = 'trail';
      if (s.roster[id]) {
        const r = s.roster[id], rar = (H.CHARS[id] || {}).rarity;
        const res = r.eid < 6 ? 'eid' : 'max';
        if (res === 'eid') { if (r.eidSeen == null) r.eidSeen = r.eid; r.eid++; }
        s.starlight += charGlow(res, rar);
        return res;
      }
      s.roster[id] = { lvl: Math.max(1, lvl || 1), exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
      return 'new';
    }

    addCone(id) {
      const s = this.state;
      const same = s.inv.cones.find(c => c.id === id && (c.sup || 1) < 5);
      if (same) { same.sup = (same.sup || 1) + 1; return same; }
      const c = { uid: s.uid++, id, sup: 1 };
      s.inv.cones.push(c);
      return c;
    }

    rollRelic(lvl, sets) {
      const rng = this.rng;
      const set = rng.pick(sets && sets.length ? sets : H.CAVERN_SETS);
      const slot = rng.pick(H.CAVERN_SLOTS);
      return this.makeRelic(set, slot, Math.min(15, Math.floor((lvl || 1) / 3)), lvl);
    }

    rollPlanar(set, rl, slotKey) {
      const slot = H.PLANAR_SLOTS.find(x => x.key === slotKey) || this.rng.pick(H.PLANAR_SLOTS);
      const r = H.clamp(Math.round(rl) || 0, 0, 15);
      return this.makeRelic(set, slot, r, Math.max(1, r * 3));
    }

    makeRelic(set, slot, rl, lvl) {
      const s = this.state, rng = this.rng;
      const main = rng.pick(slot.mains);
      const subs = [];
      const pool = Object.keys(H.STAT_ROLL).filter(k => k !== main);
      const n = 2 + (rng() < 0.5 ? 1 : 0) + (rl >= 8 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const k = pool.splice(rng.int(pool.length), 1)[0];
        subs.push([k, this.relicSub(k, rl, lvl, 0.8 + rng() * 0.4)]);
      }
      const rel = { uid: s.uid++, set, slot: slot.key, main, mv: this.relicMain(main, rl), subs, lvl: rl };
      s.inv.relics.push(rel);
      return rel;
    }

    relicName(rel) {
      const set = H.RELIC_SETS[rel.set], slot = H.RELIC_SLOTS.find(x => x.key === rel.slot);
      return set.pieces ? set.pieces[rel.slot] : set.name + ': ' + slot.name.toLowerCase();
    }

    setCounts(key) {
      const s = this.state, out = {};
      for (const uid of Object.values(s.roster[key].relics || {})) {
        const rel = s.inv.relics.find(x => x.uid === uid);
        if (rel) out[rel.set] = (out[rel.set] || 0) + 1;
      }
      return out;
    }

    planarSets(key) {
      const out = {};
      for (const [set, n] of Object.entries(this.setCounts(key))) if (H.RELIC_SETS[set].planar && n >= 2) out[set] = true;
      return out;
    }

    setCondOn(key, set, st) {
      const c = H.RELIC_SETS[set].cond;
      if (!c) return false;
      return ((st || this.charStats(key))[c.s] || 0) >= c.v - 1e-9;
    }

    relicMain(main, rl) {
      const d = H.MAIN_VALUE[main];
      return Math.round((d[0] + d[1] * rl) * 1000) / 1000;
    }

    relicSub(k, rl, lvl, roll) {
      const [b, isFlat] = H.STAT_ROLL[k];
      const v = b * roll * (1 + rl * 0.08);
      return isFlat ? Math.round(v * (1 + (lvl || 1) * 0.05)) : Math.round(v * 1000) / 1000;
    }

    equipCone(key, uid) {
      const s = this.state;
      for (const r of Object.values(s.roster)) if (r.cone === uid) r.cone = null;
      s.roster[key].cone = uid;
      this.clampHp(key);
    }

    equipRelic(key, uid) {
      const s = this.state;
      const rel = s.inv.relics.find(x => x.uid === uid);
      if (!rel) return;
      for (const r of Object.values(s.roster)) for (const [sl, u] of Object.entries(r.relics)) if (u === uid) delete r.relics[sl];
      s.roster[key].relics[rel.slot] = uid;
      this.clampHp(key);
    }

    unequipRelic(key, slot) { delete this.state.roster[key].relics[slot]; this.clampHp(key); }

    sellRelic(uid) {
      const s = this.state;
      for (const r of Object.values(s.roster)) for (const [sl, u] of Object.entries(r.relics)) if (u === uid) return false;
      const i = s.inv.relics.findIndex(x => x.uid === uid);
      if (i < 0) return false;
      s.inv.relics.splice(i, 1);
      s.credits += 150;
      return true;
    }

    autoEquip(key) {
      const s = this.state;
      const score = rel => {
        const w = { atkP: 3, critR: 4, critD: 2.5, spd: 1.2, atkF: 0.05, hpP: 1, defP: 1, hpF: 0.02, defF: 0.03, breakE: 1.5, ehr: 1.2, res: 0.5, healP: 1, err: 2 };
        const kit = H.CHARS[this.kitOf(key)], path = kit.path;
        w[kit.elem + 'P'] = 3.2;
        if (path === 'preservation') { w.defP = 3.5; w.defF = 0.08; w.atkP = 1; w[kit.elem + 'P'] = 0.6; }
        if (path === 'abundance') { w.hpP = 3.5; w.healP = 3; w.atkP = 0.8; w[kit.elem + 'P'] = 0.6; w.err = 3; }
        if (path === 'harmony') w.err = 3.5;
        if (path === 'elation') { w.spd = 2; w.ehr = 1.5; }
        let v = (w[rel.main] || 0.5) * rel.mv * (rel.main.endsWith('F') ? 1 : 30);
        for (const [k, x] of rel.subs) v += (w[k] || 0.3) * x * (k.endsWith('F') ? 1 : 30) * 0.4;
        return v;
      };
      for (const sl of H.RELIC_SLOTS) {
        const used = new Set();
        for (const [k, r] of Object.entries(s.roster)) if (k !== key) for (const u of Object.values(r.relics)) used.add(u);
        const cands = s.inv.relics.filter(r => r.slot === sl.key && !used.has(r.uid));
        if (!cands.length) continue;
        cands.sort((a, b) => score(b) - score(a));
        s.roster[key].relics[sl.key] = cands[0].uid;
      }
      this.clampHp(key);
    }

    clampHp(key) {
      const r = this.state.roster[key];
      if (r.hp != null) r.hp = Math.min(r.hp, this.charStats(key).hp);
    }

    setParty(list) {
      const s = this.state;
      const clean = [...new Set(list)].filter(k => s.roster[k]).slice(0, 4);
      if (!clean.length) return false;
      s.party = clean;
      return true;
    }

    squadOf(i) {
      const s = this.state;
      if (i === s.squad) return s.party;
      return ((s.squads || [])[i] || []).filter(k => s.roster[k]);
    }

    setSquad(i) {
      const s = this.state;
      if (i === s.squad) return true;
      if (s.guest || s.su || !(i >= 0 && i < SQUADS)) return false;
      const next = this.squadOf(i);
      if (!next.length) return false;
      if (!Array.isArray(s.squads)) s.squads = [];
      s.squads[s.squad] = s.party.slice();
      s.squads[i] = [];
      s.party = next.slice(0, 4);
      s.squad = i;
      return true;
    }

    startSquad(i, key) {
      const s = this.state;
      if (!s.roster[key] || this.squadOf(i).length) return false;
      if (s.guest || s.su || !(i >= 0 && i < SQUADS)) return false;
      if (!Array.isArray(s.squads)) s.squads = [];
      s.squads[i] = [key];
      return this.setSquad(i);
    }

    isFav(key) { const r = this.state.roster[key]; return !!(r && r.fav); }

    toggleFav(key) {
      const r = this.state.roster[key];
      if (!r) return false;
      if (r.fav) delete r.fav; else r.fav = true;
      return !!r.fav;
    }

    rest() {
      for (const r of Object.values(this.state.roster)) r.hp = null;
      this.state.tp = Math.max(this.state.tp, T.tpStart);
    }

    energyOf(key) {
      const r = this.state.roster[key], su = this.state.su;
      if (su && su.team.includes(key)) return { cur: Math.round(su.en[key] || 0), max: H.CHARS[this.kitOf(key)].energy };
      return { cur: r ? Math.round(r.energy || 0) : 0, max: H.CHARS[this.kitOf(key)].energy };
    }

    canCharge(key) {
      const r = this.state.roster[key];
      if (!r || (r.hp != null && r.hp <= 0)) return false;
      const e = this.energyOf(key);
      return e.cur < e.max;
    }

    charge(key, f) {
      const e = this.energyOf(key);
      this.state.roster[key].energy = Math.min(e.max, Math.round(e.cur + e.max * f));
    }

    useItem(id, key) {
      const s = this.state, it = H.ITEMS[id];
      if (!it || !(s.inv.items[id] > 0) || !it.use) return false;
      const u = it.use;
      const hpOf = k => { const r = s.roster[k]; const mx = this.charStats(k).hp; return { r, mx, cur: r.hp == null ? mx : r.hp }; };
      if (u.heal) { const { r, mx, cur } = hpOf(key); if (cur <= 0 || cur >= mx) return false; r.hp = Math.min(mx, Math.round(cur + mx * u.heal)); }
      else if (u.healAll) { for (const k of s.party) { const { r, mx, cur } = hpOf(k); if (cur > 0) r.hp = Math.min(mx, Math.round(cur + mx * u.healAll)); } }
      else if (u.revive) { const { r, mx, cur } = hpOf(key); if (cur > 0) return false; r.hp = Math.round(mx * u.revive); }
      else if (u.tp) { if (s.tp >= T.tpMax) return false; s.tp = Math.min(T.tpMax, s.tp + u.tp); }
      else if (u.nextAtk) s.nextAtk = u.nextAtk;
      else if (u.nextCrit) s.nextCrit = u.nextCrit;
      else if (u.power) { this.powerSync(); if (s.power + u.power > T.powerTop) return false; s.power += u.power; }
      else if (u.energy) { if (!this.canCharge(key)) return false; this.charge(key, u.energy); }
      else if (u.energyAll) { const ks = s.party.slice(0, 4).filter(k => this.canCharge(k)); if (!ks.length) return false; for (const k of ks) this.charge(k, u.energyAll); }
      else if (u.exp) { const r = s.roster[key]; if (!r || r.lvl >= MAX_LVL) return false; this.addExp(key, u.exp); }
      else return false;
      s.inv.items[id]--;
      if (!s.inv.items[id]) delete s.inv.items[id];
      return true;
    }

    shopList(id) {
      const s = this.state, list = H.SHOPS[id].items.slice();
      if (id === 'belobog' && s.flags.rumor_sword) list.push('cone:sword_rumor:3500');
      if (id === 'boulder' && s.flags.rumor_milkyway) list.push('cone:milkyway:15000');
      const disc = id === 'express' && s.flags.rumor_discount ? 0.8 : 1;
      const stockLeft = e => { const p = e.split(':'); return p[2] && H.ITEMS[p[0]] ? +p[2] - ((s.shopStock || {})[id + ':' + p[0]] || 0) : null; };
      return list.filter(e => stockLeft(e) !== 0 && !(stockLeft(e) < 0)).map(e => {
        const p = e.split(':');
        if (p[0] === 'cone') return { kind: 'cone', id: p[1], name: 'Конус «' + H.CONES[p[1]].name + '»', price: Math.round(+p[2] * disc), text: H.CONES[p[1]].text + ' Путь: ' + H.PATHS[H.CONES[p[1]].path].name + '.' };
        if (p[0] === 'relic') {
          const set = H.RELIC_SETS[p[1]], slot = H.RELIC_SLOTS.find(x => x.key === p[2]);
          return { kind: 'relic', id: 'relic:' + p[2], set: p[1], slot: p[2], name: set.name + ': ' + slot.name.toLowerCase(), price: Math.round(+p[3] * disc), text: 'Реликвия уровня команды со случайными характеристиками. Комплект: 2 шт. ' + Object.entries(set.bonus).map(([k, v]) => H.STAT_NAMES[k] + ' +' + Math.round(v * 100) + '%').join(', ') + ', 4 шт. бонус ×2.' };
        }
        const it = H.ITEMS[p[0]], left = stockLeft(e);
        return { kind: 'item', id: p[0], name: it.name, price: Math.round((p[1] ? +p[1] : it.price) * disc), text: it.text + (left != null ? ' В наличии: ' + left + '.' : ''), left };
      });
    }

    buy(shopId, idx, n = 1) {
      const e = this.shopList(shopId)[idx];
      if (!e || (e.left != null && n > e.left)) return false;
      const cost = e.price * n;
      if (this.state.credits < cost) return false;
      this.state.credits -= cost;
      if (e.kind === 'cone') this.addCone(e.id);
      else if (e.kind === 'relic') this.makeRelic(e.set, H.RELIC_SLOTS.find(x => x.key === e.slot), Math.min(15, Math.floor(this.avgLevel() / 3)), this.avgLevel());
      else this.state.inv.items[e.id] = (this.state.inv.items[e.id] || 0) + n;
      if (e.left != null) { const st = this.state.shopStock || (this.state.shopStock = {}); st[shopId + ':' + e.id] = (st[shopId + ':' + e.id] || 0) + n; }
      return true;
    }

    debugChar(id, lvl, eid) {
      const s = this.state, key = id === 'trail_p' ? 'trail' : id;
      if (!H.CHARS[key]) return null;
      const fresh = !s.roster[key];
      if (fresh) s.roster[key] = { lvl: 1, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
      const r = s.roster[key], was = r.eid;
      r.lvl = H.clamp(Math.round(lvl) || 1, 1, MAX_LVL);
      r.exp = 0;
      r.eid = H.clamp(Math.round(eid) || 0, 0, 6);
      if (r.eid > was && r.eidSeen == null) r.eidSeen = was;
      if (r.eidSeen != null && r.eidSeen >= r.eid) delete r.eidSeen;
      r.hp = null;
      return fresh ? 'new' : 'set';
    }

    debugCone(id, sup, n) {
      const s = this.state, out = [];
      if (!H.CONES[id]) return out;
      for (let i = 0; i < Math.max(1, n || 1); i++) {
        const cn = { uid: s.uid++, id, sup: H.clamp(Math.round(sup) || 1, 1, 5) };
        s.inv.cones.push(cn);
        out.push(cn);
      }
      return out;
    }

    debugRelic(o) {
      const s = this.state, slot = H.RELIC_SLOTS.find(x => x.key === o.slot), set = H.RELIC_SETS[o.set];
      if (!set || !slot || !slot.mains.includes(o.main) || !!set.planar !== (slot.kind === 'planar')) return null;
      const rl = H.clamp(Math.round(o.lvl) || 0, 0, 15);
      const keys = [...new Set(o.subs || [])].filter(k => H.STAT_ROLL[k] && k !== o.main).slice(0, 4);
      const subs = keys.map(k => [k, this.relicSub(k, rl, Math.max(1, rl * 3), o.roll || 1)]);
      const rel = { uid: s.uid++, set: o.set, slot: slot.key, main: o.main, mv: this.relicMain(o.main, rl), subs, lvl: rl };
      s.inv.relics.push(rel);
      return rel;
    }

    debugPower(big) {
      const s = this.powerSync(), was = s.power;
      s.power = big ? T.powerTop : Math.min(T.powerTop, was < T.powerMax ? T.powerMax : was + T.powerMax);
      return s.power - was;
    }

    grantDebugJade() {
      this.state.jade += T.debugJade;
      this.toast('Отладка (F7): +' + H.fmt(T.debugJade) + ' звёздного нефрита. Всего: ' + H.fmt(this.state.jade));
      return this.state.jade;
    }

    rumorsFor(who) { return H.RUMORS.filter(r => r.who === who); }

    buyRumor(id) {
      const s = this.state, r = H.RUMORS.find(x => x.id === id);
      if (!r || s.flags[id] || s.credits < r.cost) return false;
      s.credits -= r.cost;
      s.flags[id] = true;
      s.rumors.push(id);
      if (r.give) this.give(r.give);
      return true;
    }

    pityOf(ban) { const s = this.state, k = BANNER_STATE[ban]; return (k && s[k.pity]) || s.pity; }

    defaultBanner() {
      const it = this.state.inv.items, last = this.state.warpBan;
      if (last && H.BANNERS[last] && it[H.BANNERS[last].pass]) return last;
      if (it.tape) return last === 'amp' ? 'amp' : 'sig';
      if (it.rtide || it.ftide) return it.rtide && !(last === 'forge' && it.ftide) ? 'conv' : 'forge';
      if (it.badge) return last === 'alley' ? 'alley' : 'con';
      if (it.vkey) return last === 'comp' ? 'comp' : 'mid';
      if (it.mana) return last === 'wiz' ? 'wiz' : 'guild';
      if (it.spass) return last === 'cone' ? 'cone' : 'ev';
      if (it.pass) return 'std';
      return this.state.warpBan || 'ev';
    }

    evStar() { const s = this.state; return H.BANNERS.ev.stars[s.evStar] ? s.evStar : Object.keys(H.BANNERS.ev.stars)[0]; }

    setEvStar(id) {
      if (!H.BANNERS.ev.stars[id]) return false;
      this.state.evStar = id;
      return true;
    }

    coneStar() { const s = this.state; return H.BANNERS.cone.stars[s.coneStar] ? s.coneStar : Object.keys(H.BANNERS.cone.stars)[0]; }

    starOf(ban) {
      const B = H.BANNERS[ban], id = B && B.stars ? this.state[BANNER_STATE[ban].star] : null;
      return !B || !B.stars ? null : B.stars[id] ? id : Object.keys(B.stars)[0];
    }

    setStarOf(ban, id) {
      const B = H.BANNERS[ban];
      if (!B || !B.stars || !B.stars[id]) return false;
      this.state[BANNER_STATE[ban].star] = id;
      return true;
    }

    setConeStar(id) {
      if (!H.BANNERS.cone.stars[id]) return false;
      this.state.coneStar = id;
      return true;
    }

    bannerOf(ban) {
      const B = H.BANNERS[ban];
      if (ban === 'cone' || ban === 'amp' || ban === 'forge' || ban === 'comp' || ban === 'wiz' || ban === 'alley') {
        const id = this.starOf(ban), S = B.stars[id], forge = ban === 'forge';
        return Object.assign({}, B, S, { star: id, five: 'cone:' + S.cone, pity5: T.conePity5, rate5: T.coneRate5, featRate: forge ? T.forgeFeatured : T.coneFeatured, featRate4: forge ? T.forgeFeatured4 : ban === 'wiz' ? T.wizFeatured4 : null });
      }
      if (ban === 'sig' || ban === 'conv' || ban === 'guild' || ban === 'mid' || ban === 'con') {
        const id = this.starOf(ban);
        return Object.assign({}, B, B.stars[id], { star: id, five: id, featRate: ban === 'conv' ? T.convFeatured : ban === 'guild' ? T.guildFeatured : ban === 'mid' ? T.midFeatured : ban === 'con' ? T.conFeatured : T.sigFeatured });
      }
      if (ban !== 'ev') return B;
      const id = this.evStar();
      return Object.assign({}, B, H.BANNERS.ev.stars[id], { star: id, five: id });
    }

    featuredPick(pity, key, rate, feat, pool) {
      if (pity[key] || this.rng() < rate) { pity[key] = false; return { pick: this.rng.pick(feat), off: false }; }
      pity[key] = true;
      return { pick: this.rng.pick(pool.filter(p => !feat.includes(p))), off: true };
    }

    partyPick(pity, B) {
      if (pity.guar5 || this.rng() < B.featRate) { pity.guar5 = false; return { pick: B.five, off: false }; }
      pity.guar5 = true;
      const cone = B.five.startsWith('cone:'), party = Object.entries(B.stars).map(([id, S]) => (cone ? 'cone:' + S.cone : id)).filter(p => p !== B.five), std = H.WARP_POOL.five.filter(p => p.startsWith('cone:') === cone);
      return { pick: this.rng.pick(this.rng() < T.guildParty ? party : std), off: true };
    }

    warpPick(rar, B, pity) {
      if (rar === 4 && !B.party && this.rng() < T.kazumaCameo) return { pick: 'kazuma', off: false, cameo: true };
      if (B.featRate) {
        if (rar === 5 && B.party) return this.partyPick(pity, B);
        if (rar === 5) return this.featuredPick(pity, 'guar5', B.featRate, [B.five], H.WARP_POOL.five.filter(p => p.startsWith('cone:') === B.five.startsWith('cone:')));
        if (rar === 4) return this.featuredPick(pity, 'guar4', B.featRate4 != null ? B.featRate4 : B.featRate, B.four, H.WARP_POOL.four.concat(B.extra4 || []));
      }
      return { pick: rar === 5 ? B.five || this.rng.pick(H.WARP_POOL.five) : rar === 4 ? this.rng.pick(B.four || H.WARP_POOL.four) : this.rng.pick(H.WARP_POOL.three), off: false };
    }

    warp(n, ban = 'std') {
      const s = this.state, B = this.bannerOf(ban), pity = this.pityOf(ban);
      const passes = s.inv.items[B.pass] || 0;
      const fromPass = Math.min(passes, n), fromJade = (n - fromPass) * T.warpCost;
      if (fromJade > s.jade) return null;
      if (fromPass) { s.inv.items[B.pass] -= fromPass; if (!s.inv.items[B.pass]) delete s.inv.items[B.pass]; }
      s.jade -= fromJade;
      s.warpBan = ban;
      const res = [], batch = ++s.warpBatch, at = Date.now();
      for (let i = 0; i < n; i++) {
        pity.five++; pity.four++;
        const p5 = pity.five, p4 = pity.four;
        let rar = 3;
        if (pity.five >= (B.pity5 || T.pity5) || this.rng() < (B.rate5 || T.rate5)) { rar = 5; pity.five = 0; pity.four = 0; }
        else if (pity.four >= T.pity4 || this.rng() < T.rate4) { rar = 4; pity.four = 0; }
        const { pick, off, cameo } = this.warpPick(rar, B, pity);
        const r = { rar, pick };
        if (off) r.off = true;
        if (cameo) r.cameo = true;
        if (pick.startsWith('cone:')) {
          const id = pick.slice(5), [cur, n] = GLOW.cone[rar];
          r.sup = this.addCone(id).sup || 1; r.kind = 'cone'; r.id = id; r.name = H.CONES[id].name;
          s[cur] += n; r.glow = { cur, n };
        } else {
          r.kind = 'char'; r.id = pick; r.name = H.CHARS[pick].name; r.res = this.addChar(pick, Math.max(1, this.avgLevel() - 3));
          const n = charGlow(r.res, H.CHARS[pick].rarity);
          if (n) r.glow = { cur: 'starlight', n };
        }
        res.push(r);
        const e = { n: ++s.warpN, kind: r.kind, id: r.id, rar, at, batch, pity: rar === 5 ? p5 : rar === 4 ? p4 : 0 };
        if (r.kind === 'char') e.res = r.res; else e.sup = r.sup;
        if (r.glow) e.glow = r.glow.n;
        if (cameo) e.cameo = true;
        const bs = BANNER_STATE[ban];
        if (bs && bs.n) { e.ban = ban; e.star = B.star; s[bs.n]++; if (bs.off && off) e.off = true; }
        s.warpLog.unshift(e);
      }
      s.warpLog.length = Math.min(s.warpLog.length, WARP_LOG);
      return res;
    }

    warpStats(ban) {
      const s = this.state, log = ban ? s.warpLog.filter(e => (e.ban || 'std') === ban) : s.warpLog, five = log.filter(e => e.rar === 5);
      const bs = BANNER_STATE[ban], counted = Object.values(BANNER_STATE).filter(x => x.n).reduce((a, x) => a + (s[x.n] || 0), 0);
      const total = ban === 'std' ? s.warpN - counted : bs && bs.n ? s[bs.n] || 0 : s.warpN;
      return { total, five: five.length, four: log.filter(e => e.rar === 4).length, last5: five[0] || null };
    }

    fixGlow(old) {
      const s = this.state;
      if (!old) return;
      const back = { starlight: 0, embers: 0 };
      for (const e of s.warpLog) {
        if (typeof e !== 'object' || e.glow) continue;
        if (e.kind === 'cone' && GLOW.cone[e.rar]) back[GLOW.cone[e.rar][0]] += GLOW.cone[e.rar][1];
        else if (e.kind === 'char') back.starlight += charGlow(e.res, e.rar);
      }
      s.starlight += back.starlight;
      s.embers += back.embers;
      s.shop.back = back.starlight || back.embers ? back : null;
    }

    fixWarpLog() {
      const s = this.state;
      if (!s.warpLog.some(e => typeof e === 'string')) return;
      const byName = {};
      for (const [id, d] of Object.entries(H.CONES)) byName[d.name] = ['cone', id];
      for (const [id, d] of Object.entries(H.CHARS)) byName[d.name] = ['char', id];
      const old = s.warpLog.filter(e => typeof e === 'string').reverse().map(str => {
        const m = /^(.*) (★+)$/.exec(str), hit = m && byName[m[1]];
        return hit ? { kind: hit[0], id: hit[1], rar: m[2].length, at: 0, batch: 0, pity: 0 } : null;
      }).filter(Boolean);
      old.forEach((e, i) => { e.n = i + 1; });
      s.warpLog = old.reverse();
      s.warpN = Math.max(s.warpN || 0, old.length);
    }

    now() { return this.clock ? this.clock() : Date.now(); }

    fixPower() {
      const s = this.state;
      delete s.powerAcc;
      if (typeof s.powerAt !== 'number') s.powerAt = this.now();
      s.powerRes = Math.max(0, Math.min(T.powerReserveMax, +s.powerRes || 0));
      if (!s.powerBuy || typeof s.powerBuy !== 'object') s.powerBuy = { hour: null, n: 0 };
    }

    powerSync() {
      const s = this.state, step = T.powerRegenSec * 1000, now = this.now();
      if (typeof s.powerAt !== 'number' || !(s.powerAt <= now)) { s.powerAt = now; return s; }
      const n = Math.floor((now - s.powerAt) / step);
      if (n <= 0) return s;
      s.powerAt += n * step;
      const fill = Math.max(0, Math.min(n, T.powerMax - s.power));
      s.power += fill;
      s.powerRes = Math.min(T.powerReserveMax, s.powerRes + n - fill);
      return s;
    }

    powerBought() {
      const b = this.state.powerBuy, hour = Math.floor(this.now() / POWER_HOUR);
      if (b.hour !== hour) { b.hour = hour; b.n = 0; }
      return b.n;
    }

    powerJadeCost(k) {
      const from = this.powerBought(), list = T.powerJade;
      if (!(k > 0) || from + k > list.length) return null;
      return list.slice(from, from + k).reduce((a, v) => a + v, 0);
    }

    powerInfo() {
      const s = this.powerSync(), step = T.powerRegenSec * 1000, now = this.now();
      const next = step - (now - s.powerAt), gain = n => (n <= 0 ? 0 : next + (n - 1) * step);
      const toFull = Math.max(0, T.powerMax - s.power), toRes = T.powerReserveMax - s.powerRes;
      return {
        cur: s.power, max: T.powerMax, res: s.powerRes, resMax: T.powerReserveMax, top: T.powerTop, room: Math.max(0, T.powerTop - s.power),
        next, full: gain(toFull), resFull: toRes <= 0 ? 0 : gain(toFull + toRes), filling: toFull > 0 ? 'cur' : toRes > 0 ? 'res' : null,
        fuel: s.inv.items.fuel || 0, bought: this.powerBought(), buyMax: T.powerJade.length, jadeNext: this.powerJadeCost(1)
      };
    }

    powerFromReserve(n) {
      const s = this.powerSync();
      n = Math.min(Math.floor(n), s.powerRes, T.powerTop - s.power);
      if (!(n > 0)) return 0;
      s.powerRes -= n;
      s.power += n;
      return n;
    }

    powerFromFuel(k) {
      const s = this.powerSync(), have = s.inv.items.fuel || 0;
      k = Math.floor(k);
      if (!(k > 0) || k > have || s.power + k * T.powerPack > T.powerTop) return 0;
      s.inv.items.fuel = have - k;
      if (!s.inv.items.fuel) delete s.inv.items.fuel;
      s.power += k * T.powerPack;
      return k * T.powerPack;
    }

    powerFromJade(k) {
      const s = this.powerSync();
      k = Math.floor(k);
      const cost = this.powerJadeCost(k);
      if (cost == null || s.jade < cost || s.power + k * T.powerPack > T.powerTop) return 0;
      s.jade -= cost;
      s.powerBuy.n += k;
      s.power += k * T.powerPack;
      return k * T.powerPack;
    }
    nextDay() { return nextReset(this.now()); }
    eventsOpen() { return !!this.state.flags.express_intro; }

    cometTick() {
      const c = this.state.comet, now = this.now();
      if (!this.eventsOpen()) return c;
      if (!Array.isArray(c.got)) c.got = [];
      if (typeof c.start !== 'number' || c.start > now) { c.start = now; delete c.days; delete c.last; }
      if (!H.COMET_GIFT.every((n, i) => c.got[i])) { c.done = null; return c; }
      if (typeof c.done !== 'number' || c.done > now) c.done = now;
      if (now >= c.done + COMET_REST) { c.start = c.done + COMET_REST; c.done = null; c.got = []; }
      return c;
    }

    cometAllGot() { const c = this.cometTick(); return H.COMET_GIFT.every((n, i) => c.got[i]); }

    cometOpen() {
      const c = this.cometTick();
      return typeof c.start === 'number' ? Math.min(H.COMET_GIFT.length, Math.floor((this.now() - c.start) / COMET_STEP) + 1) : 0;
    }

    cometOpensAt(i) { const c = this.cometTick(); return typeof c.start === 'number' ? c.start + i * COMET_STEP : null; }

    cometRenewAt() { const c = this.cometTick(); return typeof c.done === 'number' ? c.done + COMET_REST : null; }

    cometReady(i) { return i < this.cometOpen() && !this.state.comet.got[i]; }

    claimComet(i) {
      if (!this.cometReady(i)) return null;
      this.state.comet.got[i] = true;
      const got = this.give({ items: { spass: H.COMET_GIFT[i] } });
      this.cometTick();
      return got;
    }

    willReady(i) {
      const w = H.TRAIL_WILL[i];
      return !!w && this.eventsOpen() && this.trailLevel() >= w.lvl && !this.state.will.includes(w.lvl);
    }

    claimWill(i) {
      if (!this.willReady(i)) return null;
      this.state.will.push(H.TRAIL_WILL[i].lvl);
      return this.give(this.willGive(i));
    }

    willOwned(i) { const id = H.TRAIL_WILL[i].give.outfit; return !!id && !!H.OUTFITS && this.ownsOutfit(id); }

    willGive(i) {
      const g = H.TRAIL_WILL[i].give;
      if (!this.willOwned(i)) return g;
      const { outfit, ...rest } = g;
      return Object.assign(rest, { jade: (g.jade || 0) + H.OUTFITS[outfit].price });
    }

    claimEvent(id) {
      const out = [];
      if (id === 'comet') H.COMET_GIFT.forEach((n, i) => out.push(...(this.claimComet(i) || [])));
      else H.TRAIL_WILL.forEach((w, i) => out.push(...(this.claimWill(i) || [])));
      return out;
    }

    eventReady(id) { return id === 'comet' ? H.COMET_GIFT.some((n, i) => this.cometReady(i)) : H.TRAIL_WILL.some((w, i) => this.willReady(i)); }

    mailSync() {
      const at = this.now();
      for (const m of H.MAIL) if (!this.state.mail[m.id] && (!m.need || this.cond(m.need))) this.state.mail[m.id] = { at };
    }

    mailbox() { this.mailSync(); return H.MAIL.map(m => ({ m, st: this.state.mail[m.id] })).filter(x => x.st && !x.st.del).sort((a, b) => b.st.at - a.st.at); }

    readMail(id) {
      const st = this.state.mail[id], m = H.MAIL.find(x => x.id === id);
      if (!st) return;
      st.read = true;
      if (m && m.quest && !this.state.quests[m.quest]) this.setQuest(m.quest, 'talk');
    }

    setQuest(id, step) {
      const q = H.QUESTS[id];
      if (!q || this.state.quests[id] === step) return;
      this.state.quests[id] = step;
      if (this.missionNew) this.missionNew(id);
      if (step === 'done') this.addTrailExp(TL_QUEST_EXP[q.type || 'comp'] || 0);
      this.emit({ t: 'quest', id, step, type: q.type || 'comp', name: q.name, text: step === 'done' ? 'Миссия выполнена' : this.questStep(id).text });
    }

    questTick(id) {
      const q = H.QUESTS[id], st = this.state.quests[id];
      if (!q || !st || st === 'done') return;
      this.emit({ t: 'quest', id, step: st, type: q.type || 'comp', name: q.name, text: this.questStep(id).text });
    }

    questStep(id) {
      const q = H.QUESTS[id], st = this.state.quests[id], step = (q && q.steps[st]) || {}, f = this.state.flags;
      const count = step.count ? ' (' + step.count.filter(k => f[k]).length + '/' + step.count.length + ')' : '';
      const at = step.ats ? ((step.ats.find(([k]) => !f[k]) || [])[1] || null) : step.at || null;
      return { text: (step.text || '') + count, desc: step.desc || q.desc || '', at };
    }

    questList() {
      return Object.entries(this.state.quests).filter(([id, st]) => H.QUESTS[id] && st !== 'done').map(([id, st]) => {
        const q = H.QUESTS[id], step = this.questStep(id);
        return { id, name: q.name, giver: q.giver, type: q.type || 'comp', step: st, text: step.text, desc: step.desc, at: step.at };
      });
    }

    questTarget() {
      const list = this.questList(), tr = this.missionTracked ? this.missionTracked() : null;
      const q = (tr && list.find(x => x.id === tr.id && x.at)) || list.find(x => x.at);
      if (!q) return null;
      const [map, ch] = q.at.split(':'), L = mapLayout(map), pts = ch && L.marks[ch];
      const [x, y] = pts ? centreOf(pts) : [null, null];
      return { map, mark: ch || null, x, y, quest: q.id };
    }

    claimMail(id) {
      const st = this.state.mail[id], m = H.MAIL.find(x => x.id === id);
      if (!st || !m || st.del || st.got || !m.give) return null;
      st.got = true; st.read = true;
      return this.give(m.give);
    }

    claimAllMail() { const out = []; for (const { m } of this.mailbox()) out.push(...(this.claimMail(m.id) || [])); return out; }

    deleteReadMail() {
      let n = 0;
      for (const { m, st } of this.mailbox()) if (st.read && (st.got || !m.give)) { st.del = true; n++; }
      return n;
    }

    mailNew(x) { return !x.st.read || !!(x.m.give && !x.st.got); }

    alerts() { return { events: this.eventsOpen() && (this.eventReady('comet') || this.eventReady('will')), mail: this.mailbox().some(x => this.mailNew(x)), chat: this.chatAlert(), missions: !!(this.missionAlert && this.missionAlert()), chars: Object.keys(this.state.roster).some(k => this.eidNew(k) > 0) }; }

    eidNew(key) {
      const r = this.state.roster[key];
      return r && r.eidSeen != null ? Math.max(0, r.eid - r.eidSeen) : 0;
    }

    seeEid(key) {
      const r = this.state.roster[key];
      if (r) delete r.eidSeen;
    }

    calyxOpen(c) {
      const s = this.state;
      return (!c.need || this.cond(c.need)) && (!c.owns || Object.keys(s.roster).some(k => !s.roster[k].guest && H.CHARS[this.kitOf(k)].path === c.owns));
    }

    calyxList() {
      return H.CALYX.map(c => ({ c, open: this.calyxOpen(c) }));
    }

    tiersOpen() { return H.CALYX_TIERS.map(t => !t.need || this.cond(t.need)); }

    startCalyx(id, tier) {
      const s = this.state, c = H.CALYX.find(x => x.id === id), t = H.CALYX_TIERS[tier];
      if (!c || !t || !this.calyxOpen(c) || (t.need && !this.cond(t.need))) return false;
      if (s.power < c.cost) return false;
      if (c.waves) {
        const lv = id => id + ':' + (t.lvl + (H.ENEMIES[id].boss ? 2 : 0));
        this.startBattle({ waves: c.waves.map(w => w.map(lv)), lvl: t.lvl, boss: true, noFlee: false, bg: 'sim', music: c.music || 'boss', calyx: { id, tier, cost: c.cost }, noContact: true });
        return true;
      }
      let enemies;
      if (c.boss) enemies = [c.boss + ':' + (t.lvl + 2)].concat((c.adds || []).map(a => a + ':' + t.lvl));
      else {
        enemies = [];
        const n = 3;
        for (let i = 0; i < n; i++) enemies.push(this.rng.pick(c.pool) + ':' + t.lvl);
        if (c.elite) enemies[0] = this.rng.pick(c.elite) + ':' + t.lvl;
      }
      this.startBattle({ enemies, lvl: t.lvl, boss: !!c.boss, noFlee: false, bg: 'sim', music: c.music || (c.boss ? 'boss' : 'battle'), calyx: { id, tier, cost: c.cost }, noContact: true });
      return true;
    }

    calyxReward(cx) {
      const s = this.state, c = H.CALYX.find(x => x.id === cx.id), tier = cx.tier;
      if (c.reward === 'echo' && this.echoClaim && !this.echoClaim()) return [];
      s.power = Math.max(0, s.power - cx.cost);
      const mats = this.traceCalyx ? this.traceCalyx(c, tier) : [];
      const lvl = H.CALYX_TIERS[tier].lvl;
      switch (c.reward) {
        case 'exp': return this.give({ items: tier >= 2 ? { exp2: 2 + tier, exp1: 2 } : { exp1: 3 + tier * 2 } }).concat(mats);
        case 'credits': return this.give({ credits: T.treasure ? T.treasure[tier] : 1500 + 1500 * tier }).concat(mats);
        case 'path': return mats;
        case 'relic': return this.give({ relic: 2 + (this.rng() < 0.5 ? 1 : 0), lvl: lvl + 6, sets: c.sets });
        case 'echo': { const g = this.give({ relic: 3, lvl: lvl + 9, jade: 40 }).concat(mats); return this.fhEchoLucent ? g.concat(this.fhEchoLucent()) : g; }
      }
      return [];
    }

    destinations() {
      const s = this.state, out = [];
      if (s.su) return out;
      for (const d of H.DESTINATIONS) out.push({ kind: 'map', map: d.map, at: d.at, name: d.name, ok: this.cond(d.need) });
      for (const key of s.anchors) {
        const [map, i] = key.split(':');
        const md = H.MAPS[map];
        const dest = H.DESTINATIONS.find(d => d.map === map);
        if (dest && !this.cond(dest.need) && map !== this.map.id) continue;
        out.push({ kind: 'anchor', key, map, idx: +i, name: md.name.split(': ').pop() + ' — ' + md.anchors[+i], ok: true });
      }
      return out.filter(d => d.ok);
    }

    areaOf(mapId) {
      const car = H.expressArea(mapId);
      if (car) return { world: this.expressWorld(), area: car, group: null };
      for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) if (a.map === mapId) return { world: w, area: a, group: gr };
      return null;
    }

    mapMusic(def) { return (def.car && this.state.record) || def.music; }

    expressWorld() { return H.WORLDS.slice().reverse().find(w => w.express && this.cond(w.express)) || H.WORLDS[0]; }

    currentWorld() { const a = this.areaOf(this.map.id); return a ? a.world : H.WORLDS[0]; }

    battleTheme() { return (this.map && this.currentWorld().battle) || 'battle'; }

    worldOpen(w) { return w.open !== null && this.cond(w.open); }

    areaOpen(a) { return a.map === this.map.id || this.cond(a.open); }

    objTarget() {
      const at = objAt(this.state.obj);
      if (!at) return null;
      const [map, ch] = at.split(':'), L = mapLayout(map), pts = ch && L.marks[ch];
      const [x, y] = pts ? centreOf(pts) : [null, null];
      return { map, mark: ch || null, x, y };
    }

    routeExit(fromMap, toMap) {
      if (fromMap === toMap) return null;
      const prev = { [fromMap]: null }, q = [fromMap];
      while (q.length) {
        const id = q.shift();
        for (const [ch, mk] of Object.entries(H.MAPS[id].marks)) {
          if (mk.type !== 'exit') continue;
          for (const to of mk.lift ? mk.lift.map(l => l[0]) : [this.exitDest(mk).to]) {
            if (!H.MAPS[to] || to in prev) continue;
            prev[to] = [id, ch];
            if (to === toMap) {
              let step = to;
              while (prev[step][0] !== fromMap) step = prev[step][0];
              return prev[step][1];
            }
            q.push(to);
          }
        }
      }
      return null;
    }

    chestCount(mapId) {
      const s = this.state, list = mapLayout(mapId).chests.filter(c => this.cond(c.def.if));
      return { got: list.filter(c => s.opened[c.key]).length, total: list.length };
    }

    npcShown(mk) { return this.cond(mk.if) && !(mk.ifNotParty && this.state.party.includes(mk.ifNotParty) && !(mk.always && this.cond(mk.always))); }

    navPoints(mapId) {
      const L = mapLayout(mapId), def = L.def, s = this.state, pts = [];
      for (const a of L.anchors) pts.push({ kind: 'anchor', map: mapId, x: a.x, y: a.y, key: a.key, name: a.name, on: s.anchors.includes(a.key) });
      for (const d of H.DESTINATIONS) {
        if (d.map !== mapId || !L.marks[d.at]) continue;
        const [x, y] = L.marks[d.at][0], near = pts.find(p => p.kind === 'anchor' && Math.abs(p.x - x) + Math.abs(p.y - y) <= 3);
        if (near) near.landing = d.at;
        else pts.push({ kind: 'landing', map: mapId, x, y, at: d.at, name: 'Точка высадки' });
      }
      for (const [ch, mk] of Object.entries(def.marks)) {
        const at = L.marks[ch];
        if (!at) continue;
        const [x, y] = centreOf(at);
        if (mk.type === 'exit') pts.push({ kind: 'exit', map: mapId, x, y, ch, to: this.exitDest(mk).to, locked: !!(mk.need && !this.cond(mk.need)), lockText: mk.lockText || '' });
        else if ((mk.type === 'npc' || mk.type === 'prop') && mk.script && this.npcShown(mk)) {
          const role = npcRole(mk);
          if (role) pts.push(Object.assign({ map: mapId, x, y, ch, who: mk.name || (H.SPEAKERS[mk.who] || {}).name || '' }, role));
        }
      }
      const goal = this.objTarget();
      if (goal && goal.map === mapId && goal.mark) {
        const hit = pts.find(p => p.ch === goal.mark);
        if (hit) hit.goal = true;
        else pts.push({ kind: 'goal', map: mapId, x: goal.x, y: goal.y, ch: goal.mark, name: 'Цель миссии Освоения', goal: true });
      } else if (goal && goal.map !== mapId) {
        const ch = this.routeExit(mapId, goal.map), hit = ch && pts.find(p => p.kind === 'exit' && p.ch === ch);
        if (hit) hit.route = true;
      }
      const qt = this.questTarget();
      if (qt && qt.map === mapId && qt.mark) {
        const hit = pts.find(p => p.ch === qt.mark);
        if (hit) hit.quest = qt.quest;
        else pts.push({ kind: 'quest', map: mapId, x: qt.x, y: qt.y, ch: qt.mark, name: 'Цель миссии', quest: qt.quest });
      } else if (qt && qt.map !== mapId) {
        const ch = this.routeExit(mapId, qt.map), hit = ch && pts.find(p => p.kind === 'exit' && p.ch === ch);
        if (hit) hit.questRoute = qt.quest;
      }
      return pts.sort((a, b) => a.x - b.x || a.y - b.y);
    }

    teleportFor(p) {
      const list = this.destinations();
      let d = null;
      if (p.kind === 'anchor') d = list.find(x => x.kind === 'anchor' && x.key === p.key) || (p.landing && list.find(x => x.kind === 'map' && x.map === p.map && x.at === p.landing)) || null;
      else if (p.kind === 'landing') d = list.find(x => x.kind === 'map' && x.map === p.map && x.at === p.at) || null;
      else return { ok: false, dest: null, why: '' };
      if (d) return { ok: true, dest: d, why: '' };
      if (p.kind === 'anchor' && !p.on && !p.landing) return { ok: false, dest: null, why: 'Якорь ещё не активирован. Подойдите к нему, чтобы открыть телепорт.' };
      return { ok: false, dest: null, why: 'Сейчас сюда не переместиться.' };
    }

    travel(d) {
      if (d.kind === 'anchor') {
        this.loadMap(d.map, null, {});
        const a = this.map.ents.find(e => e.kind === 'anchor' && e.key === d.key);
        if (a) { const [x, y] = this.freeNear(a.x, a.y + 1); this.placePlayer(x, y); this.player.dir = 'up'; }
      } else this.loadMap(d.map, d.at);
      this.emit({ t: 'sfx', id: 'warp' });
    }

    setPath(p) {
      const r = this.state.roster.trail, was = this.state.mcPath;
      if (r && was !== p) { r.eidBy = r.eidBy || {}; r.eidBy[was] = r.eid || 0; r.eid = r.eidBy[p] || 0; delete r.eidSeen; }
      this.state.mcPath = p;
      this.clampHp('trail');
    }

    runScript(name) {
      const steps = H.SCRIPTS[name] || (H.SU && H.SU.SCRIPTS && H.SU.SCRIPTS[name]);
      if (!steps) return;
      if (this.script) { this.scriptQueue.push(name); return; }
      const labels = {};
      steps.forEach((st, i) => { if (typeof st === 'string' && st[0] === '#') labels[st.slice(1)] = i; });
      this.script = { name, steps, pc: 0, labels };
      this.skipping = false;
      this.advanceScript();
    }

    advanceScript() {
      const s = this.state;
      let guard = 0;
      while (this.script && !this.pending && !this.battle && guard++ < 500) {
        const sc = this.script;
        if (sc.pc >= sc.steps.length) {
          this.script = null;
          this.skipping = false;
          if (this.scriptQueue.length) this.runScript(this.scriptQueue.shift());
          else if (s.su) this.suFlush();
          continue;
        }
        const st = sc.steps[sc.pc++];
        if (typeof st === 'string' || st.one) {
          const line = typeof st === 'string' ? st : st.one[Math.floor(this.rng() * st.one.length)];
          if (line[0] === '#' || this.skipping) continue;
          const i = line.indexOf('|'), head = line.slice(0, i), eq = head.indexOf('=');
          this.pending = { type: 'say', spk: eq < 0 ? head : head.slice(0, eq), name: eq < 0 ? null : this.fill(head.slice(eq + 1)), text: this.fill(line.slice(i + 1)) };
          return;
        }
        if (st.recap) { this.skipping = false; sc.recap = st; this.noteRecap(st.recap); continue; }
        if (st.suIf !== undefined && st.jump) { if (this.suCond(st.suIf)) sc.pc = sc.labels[st.jump]; continue; }
        if (st.if !== undefined && st.jump) { if (this.cond(st.if)) sc.pc = sc.labels[st.jump]; continue; }
        if (st.rnd) { sc.pc = sc.labels[st.rnd[Math.floor(this.rng() * st.rnd.length)]]; continue; }
        if (st.party && st.jump) { const ids = [].concat(st.party), pool = st.lead || st.solo ? s.party.slice(0, 1) : s.party; if ((!st.solo || s.party.length === 1) && pool.some(id => ids.includes(id))) sc.pc = sc.labels[st.jump]; continue; }
        if (st.day) {
          const k = dayKey(this.now()), days = s.days || (s.days = {});
          if (st.jump) { if (days[st.day] && days[st.day] !== k) sc.pc = sc.labels[st.jump]; } else days[st.day] = k;
          continue;
        }
        if (st.su === 'start') { this.suStart(st.world || 1, st.path || 'preservation', s.party, { tut: !!st.tut }); continue; }
        if (st.su) { if (this.suOp(st)) return; continue; }
        if (st.quest) { if (st.tick) this.questTick(st.quest); else this.setQuest(st.quest, st.step); continue; }
        if (st.lines) { if (this[st.lines]) this.spliceSteps(this[st.lines](st.arg)); continue; }
        if (st.jump) { sc.pc = sc.labels[st.jump]; continue; }
        if (st.end) { sc.pc = sc.steps.length; continue; }
        if (st.flag) { s.flags[st.flag] = true; if (this.missionTick) this.missionTick(); continue; }
        if (st.unflag) { delete s.flags[st.unflag]; continue; }
        if (st.obj) { s.obj = st.obj; this.emit({ t: 'obj', text: st.obj }); continue; }
        if (st.join) {
          const res = this.addChar(st.join, Math.max(1, this.avgLevel()));
          if (res === 'new' && s.party.length < 4) s.party.push(st.join);
          this.emit({ t: 'join', id: st.join });
          this.toast(H.CHARS[st.join].name + ' присоединяется к команде!');
          continue;
        }
        if (st.guest !== undefined) { this.setGuest(st.guest, st); continue; }
        if (st.give) { const got = this.give(st.give); if (got.length) this.toast('Получено: ' + got.join(', ')); continue; }
        if (st.take) { this.take(st.take); continue; }
        if (st.heal) { this.rest(); continue; }
        if (st.path) { this.setPath(st.path); continue; }
        if (st.cg !== undefined) { this.cg = st.cg; continue; }
        if (st.goto) { this.loadMap(st.goto[0], st.goto[1], { silent: true }); this.emit({ t: 'map', id: st.goto[0], name: H.MAPS[st.goto[0]].name, music: this.mapMusic(H.MAPS[st.goto[0]]) }); continue; }
        if (st.script) {
          const steps = H.SCRIPTS[st.script] || H.SU.SCRIPTS[st.script];
          const labels = {};
          steps.forEach((x, i) => { if (typeof x === 'string' && x[0] === '#') labels[x.slice(1)] = i; });
          this.script = { name: st.script, steps, pc: 0, labels };
          this.skipping = false;
          continue;
        }
        if (st.save) { this.emit({ t: 'autosave' }); continue; }
        if (st.battle) {
          this.skipping = false;
          this.startBattle({ encId: st.battle, fromScript: true });
          return;
        }
        if (st.sfx) { if (!this.skipping) this.emit({ t: 'sfx', id: st.sfx }); continue; }
        if (st.music) { this.emit({ t: 'music', id: st.music }); continue; }
        if (st.record !== undefined) { this.state.record = st.record; this.emit({ t: 'music', id: this.mapMusic(this.map.def) }); if (st.note) this.toast(this.fill(st.note)); continue; }
        if (st.choice) { this.pending = { type: 'choice', title: st.title, options: st.choice.filter(o => !o[2] || this.cond(o[2])).map(o => [this.fill(o[0]), o[1]]) }; return; }
        if (st.lift) { this.emit({ t: 'sfx', id: 'door' }); this.loadMap(st.lift[0], st.lift[1]); continue; }
        if (st.walk) { if (this.npcWalk(st)) return; continue; }
        if (st.rate) { this.pending = { type: 'choice', title: 'Навести пистолет', options: s.party.map(id => [/^trail/.test(id) ? s.name : H.CHARS[id].name, '@rate:' + id]) }; return; }
        if (st.menu) {
          const asked = sc.asked || (sc.asked = new Set());
          const opts = st.menu.filter(o => !asked.has(o[1]) && (!o[2] || this.cond(o[2]))).concat(st.exit ? [st.exit] : []);
          this.pending = { type: 'choice', menu: true, options: opts.map(o => [this.fill(o[0]), o[1]]) };
          return;
        }
        if (st.cine) { if (this.skipping) continue; this.pending = { type: 'cine', id: st.cine }; return; }
        if (st.magflow) { this.pending = { type: 'ui', ui: 'magflow', id: st.magflow, fail: st.fail }; return; }
        if (st.carts) { this.pending = { type: 'ui', ui: 'carts', id: st.carts, fail: st.fail }; return; }
        if (st.ui) { this.pending = Object.assign({ type: 'ui' }, st); return; }
        if (st.tut) { this.pending = { type: 'tut', text: st.tut }; return; }
        if (st.credits) { this.skipping = false; this.pending = { type: 'credits', id: st.credits === true ? null : st.credits }; return; }
      }
    }

    resume(val) {
      const p = this.pending;
      this.pending = null;
      if (p && p.type === 'walk') this.walkEnd(p);
      if (p && p.type === 'choice' && this.script) {
        const opt = p.options[val] || p.options[0];
        if (p.menu) (this.script.asked || (this.script.asked = new Set())).add(opt[1]);
        if (opt[1].startsWith('@rate:')) this.spliceSteps(this.rateLines ? this.rateLines(opt[1].slice(6)) : []);
        else this.script.pc = this.script.labels[opt[1]];
      }
      if (p && p.type === 'ui' && p.ui === 'name' && val) {
        this.state.name = val.name;
        this.state.gender = val.gender;
      }
      if (p && p.type === 'ui' && /^su_(bless|curio|end|enhance)$/.test(p.ui)) this.suResolve(p, val);
      if (p && p.type === 'ui' && (p.ui === 'magflow' || p.ui === 'carts')) {
        if (val) this.state.flags[p.id] = true;
        else if (this.script) this.script.pc = p.fail && this.script.labels[p.fail] !== undefined ? this.script.labels[p.fail] : this.script.steps.length;
      }
      if (this.script) this.advanceScript();
    }

    spliceSteps(lines) {
      const sc = this.script;
      sc.steps = sc.steps.slice(0, sc.pc).concat(lines, sc.steps.slice(sc.pc));
      sc.labels = {};
      sc.steps.forEach((st, i) => { if (typeof st === 'string' && st[0] === '#') sc.labels[st.slice(1)] = i; });
    }

    openLift(e) {
      const here = this.map.id, steps = [], opts = [];
      e.def.lift.filter(l => l[0] !== here).forEach(([map, at, need, lockText], i) => {
        const open = !need || this.cond(need), name = H.MAPS[map].name.split(': ').pop();
        opts.push([open ? name : name + ' (закрыто)', 'l' + i]);
        steps.push('#l' + i);
        if (open) steps.push({ lift: [map, at] }, { end: true });
        else steps.push('|' + (lockText || 'Этот маршрут лифта закрыт.'), { end: true });
      });
      opts.push(['Остаться здесь', 'stay']);
      steps.unshift({ choice: opts, title: 'Космический лифт' });
      steps.push('#stay', { end: true });
      const labels = {};
      steps.forEach((st, i) => { if (typeof st === 'string' && st[0] === '#') labels[st.slice(1)] = i; });
      this.lastExitTile = e.x + ',' + e.y;
      this.script = { name: 'lift', steps, pc: 0, labels };
      this.skipping = false;
      this.advanceScript();
    }

    afterBattle() {
      if (this.script && !this.pending) this.advanceScript();
    }

    serialize() {
      const s = this.state;
      s.x = this.player.x; s.y = this.player.y; s.dir = this.player.dir; s.map = this.map.id;
      return JSON.parse(JSON.stringify(s));
    }

    summary() {
      const s = this.state;
      const h = Math.floor(s.time / 3600), m = Math.floor(s.time / 60) % 60;
      return { name: s.name, lvl: this.avgLevel(), where: H.MAPS[s.map].name, time: h + ':' + String(m).padStart(2, '0'), obj: s.obj };
    }
  }

  Object.assign(H, { Game, GLOW, charGlow, cond, newState, mapLayout, scriptEntries, dayKey, MAX_LVL, TL_MAX, TL_QUEST_EXP, SQUADS, ATTACK_TECHS });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
