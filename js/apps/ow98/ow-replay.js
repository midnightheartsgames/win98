(function (O) {
  'use strict';
  const KEEP = 16;

  function snapHero(h) {
    const v = h.vis;
    return {
      id: h.id, heroId: h.heroId, skin: h.skin, team: h.team, name: h.name, alive: h.alive, deadT: h.deadT,
      x: h.pos.x, y: h.pos.y, z: h.pos.z, yaw: h.yaw, pitch: h.pitch, hp: h.hp, maxHp: h.maxHp, armor: h.armor, shield: h.shield, temp: h.temp,
      eyeH: h.eyeH, h: h.h, r: h.r, crouch: h.crouch, groundY: h.groundY, ultOn: h.ultOn, lastHurt: h.lastHurt, lastAttacker: h.lastAttacker,
      vis: { pose: v.pose, poseT: v.poseT, item: v.item, shotT: v.shotT, shot2T: v.shot2T, act: v.act, actT: v.actT, moving: v.moving, air: v.air, pitch: v.pitch, weapon: v.weapon, crouch: v.crouch, shield: v.shield, scope: v.scope, side: v.side, fly: v.fly, descent: v.descent, sprint: v.sprint, wallride: v.wallride, song: v.song, amp: v.amp, volley: v.volley, breath: v.breath, beams: v.beams ? v.beams.map(b => Object.assign({}, b)) : [] },
      st: { stun: h.st.stun || 0, knock: h.st.knock || 0, harmony: h.st.harmony || 0, discord: h.st.discord || 0, boost: h.st.boost || 0, phase: h.st.phase || 0, revealed: h.st.revealed || 0 },
      k: { recalling: h.k.recalling || 0, pull: h.k.pull ? { id: h.k.pull.id } : null, marks: h.k.marks ? Object.assign({}, h.k.marks) : null },
      ammo: h.ammo, maxAmmo: h.maxAmmo, ult: h.ult
    };
  }

  class Replay {
    constructor(g) {
      this.frames = [];
      this.best = null;
      this.pending = null;
      this.fxIdx = 0;
      this.evIdx = 0;
      this.lastFx = null;
      this.score = {};
      this.g = g;
    }

    record(g) {
      if (g.tickN % 2) return;
      const fx = g.fx.filter(f => f.t > (this.lastT || -1));
      const snd = g.events.filter(e => e.type === 'snd' && e.t > (this.lastT || -1)).map(e => ({ id: e.id, x: e.x, y: e.y, z: e.z, h: e.h, big: e.big, hero: e.hero, fan: e.fan, alt: e.alt, song: e.song, n: e.n, good: e.good }));
      const kills = g.events.filter(e => e.type === 'kill' && e.t > (this.lastT || -1));
      this.lastT = g.t;
      const f = {
        t: g.t,
        heroes: g.heroes.map(snapHero),
        proj: g.proj.map(p => ({ kind: p.kind, pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, vel: { x: p.vel.x, y: p.vel.y, z: p.vel.z }, team: p.team, owner: p.owner, stuckTo: p.stuckTo })),
        deploy: g.deploy.map(d => ({ kind: d.kind, pos: { x: d.pos.x, y: d.pos.y, z: d.pos.z }, yaw: d.yaw, pitch: d.pitch, level: d.level, age: d.age, build: d.build, sprung: d.sprung, spin: d.spin, shotT: d.shotT, team: d.team })),
        barriers: g.barriers.map(b => Object.assign({}, b, { ref: null })),
        payload: g.obj && g.obj.pos && g.obj.type !== 'assault' && g.map.payload ? { x: g.obj.pos.x, y: g.obj.pos.y, z: g.obj.pos.z, yaw: g.obj.pos.yaw } : null,
        pickups: g.pickups.map(p => ({ x: p.x, y: p.y, z: p.z, big: p.big, t: p.t })),
        fx: fx.map(x => Object.assign({}, x)), snd, worldVer: g.worldVer
      };
      this.frames.push(f);
      while (this.frames.length && g.t - this.frames[0].t > KEEP) this.frames.shift();
      for (const k of kills) this.onKill(g, k);
      for (const e of g.events) {
        if (e.t <= (this.prevEvT || -1)) continue;
        if (e.type === 'rez') this.bump(g, e.src, 90, e.t);
        else if (e.type === 'ult') this.bump(g, e.h, 15, e.t);
        else if (e.type === 'pinned') this.bump(g, e.src, 10, e.t);
      }
      this.prevEvT = g.t;
      if (this.pending && g.t >= this.pending.until) {
        const p = this.pending;
        if (!this.best || p.score > this.best.score) {
          this.best = { heroId: p.heroId, hid: p.hid, score: p.score, name: p.name, frames: this.frames.filter(fr => fr.t >= p.from && fr.t <= p.until) };
        }
        this.pending = null;
      }
    }

    bump(g, hid, pts, t) {
      const sc = this.score[hid] = (this.score[hid] || []).filter(x => t - x.t < 9);
      sc.push({ t, pts });
      this.consider(g, hid, t);
    }

    onKill(g, k) {
      if (k.killer < 0) return;
      const killer = g.heroes[k.killer];
      if (!killer) return;
      const ult = !!killer.ultOn || ['deadeye', 'pulsebomb', 'tire', 'shatter', 'wholehog', 'visor', 'rage', 'turret'].includes(k.icon);
      this.bump(g, k.killer, 100 + (ult ? 25 : 0) + (k.crit ? 10 : 0) + (k.env ? 40 : 0), k.t);
    }

    consider(g, hid, t) {
      const sc = this.score[hid] || [];
      const pts = sc.reduce((a, x) => a + x.pts, 0);
      const n = sc.length;
      const score = pts * (1 + (n - 1) * 0.35);
      const h = g.heroes[hid];
      if (!h) return;
      const first = sc.length ? sc[0].t : t;
      const from = Math.max(first - 3.5, t - 11);
      if (this.pending && this.pending.hid === hid) {
        if (score > this.pending.score) { this.pending.score = score; this.pending.until = Math.min(t + 2.5, this.pending.from + 13); }
        return;
      }
      if (this.pending && score <= this.pending.score) return;
      if (this.best && score <= this.best.score) return;
      this.pending = { hid, heroId: h.heroId, name: h.name, score, from, until: t + 2.5 };
    }

    finalize() {
      if (this.pending) {
        const p = this.pending;
        if (!this.best || p.score > this.best.score) this.best = { heroId: p.heroId, hid: p.hid, score: p.score, name: p.name, frames: this.frames.filter(fr => fr.t >= p.from) };
        this.pending = null;
      }
      return this.best;
    }

    killcam(victimId, killerId, secs = 4.5) {
      const end = this.frames.length ? this.frames[this.frames.length - 1].t : 0;
      const frames = this.frames.filter(f => f.t >= end - secs);
      return { frames, hid: killerId, victim: victimId };
    }
  }

  function lerp(a, b, f) { return a + (b - a) * f; }
  function lerpAng(a, b, f) { return a + O.angDiff(a, b) * f; }

  O.replayScene = function (clip, t) {
    const fr = clip.frames;
    if (!fr.length) return null;
    const t0 = fr[0].t + t;
    let i = 0;
    while (i < fr.length - 1 && fr[i + 1].t < t0) i++;
    const a = fr[i], b = fr[Math.min(fr.length - 1, i + 1)];
    const f = b.t > a.t ? Math.max(0, Math.min(1, (t0 - a.t) / (b.t - a.t))) : 0;
    const heroes = a.heroes.map(ha => {
      const hb = b.heroes.find(x => x.id === ha.id) || ha;
      const jump = Math.hypot(hb.x - ha.x, hb.z - ha.z) > 4;
      const k = jump ? 0 : f;
      return {
        id: ha.id, heroId: ha.heroId, skin: ha.skin, team: ha.team, name: ha.name, alive: ha.alive, deadT: ha.deadT,
        pos: { x: lerp(ha.x, hb.x, k), y: lerp(ha.y, hb.y, k), z: lerp(ha.z, hb.z, k) }, yaw: lerpAng(ha.yaw, hb.yaw, k), pitch: lerp(ha.pitch, hb.pitch, k),
        hp: ha.hp, maxHp: ha.maxHp, armor: ha.armor, maxArmor: 0, shield: ha.shield, maxShield: 0, temp: ha.temp, packArmor: 0,
        eyeH: ha.eyeH, h: ha.h, r: ha.r, crouch: ha.crouch, groundY: ha.groundY, ultOn: ha.ultOn, lastHurt: ha.lastHurt, lastAttacker: ha.lastAttacker,
        vis: ha.vis, st: ha.st, k: ha.k, ammo: ha.ammo, maxAmmo: ha.maxAmmo, def: ha.heroId ? O.HEROES[ha.heroId] : null, ult: ha.ult, aux: {}, cd: {}, inp: {}
      };
    });
    return { t: t0, frame: a, heroes, proj: a.proj, deploy: a.deploy, barriers: a.barriers, payload: a.payload, pickups: a.pickups, idx: i };
  };

  O.Replay = Replay;
})(globalThis.Ow98 = globalThis.Ow98 || {});
