(function (Q) {
  'use strict';
  const M4 = Q.M4;
  const WP = Q.WP;

  class Scene {
    constructor(renderer) {
      this.r = renderer;
      this.anim = new Map();
      this.pose = [];
      this.brass = new Q.MB().cyl([-1.5, 0, 0], [1.5, 0, 0], 0.7, 0.7, 5, [0.85, 0.65, 0.2]).finish();
    }

    setWorld(world) {
      this.world = world;
      this.anim.clear();
      this.flames = world.decos.filter(d => d.kind === 'flame');
      this.statues = world.decos.filter(d => d.kind === 'statue').map(d => ({ d, ch: Q.getCharacter(Q.BOTS[d.model || 'sarge'].look, null, true) }));
    }

    animFor(p) {
      let a = this.anim.get(p.id);
      if (!a) {
        a = { phase: 0, legYaw: p.ps.yaw, onGround: true, landT: 9, deathT: 0, attackT: 9, gestureT: 9, last: p.lastFire, lastG: p.gesture, spawn: p.spawnTime };
        this.anim.set(p.id, a);
      }
      return a;
    }

    update(game, dt) {
      for (const p of game.players) {
        const a = this.animFor(p);
        const v = p.ps.velocity;
        const sp = Math.hypot(v[0], v[1]);
        a.phase = (a.phase + sp * dt / 150) % 1;
        if (p.ps.onGround && !a.onGround) a.landT = 0;
        a.onGround = p.ps.onGround;
        a.landT += dt;
        if (p.lastFire !== a.last) { a.last = p.lastFire; a.attackT = 0; }
        a.attackT += dt;
        if (p.gesture !== a.lastG) { a.lastG = p.gesture; a.gestureT = 0; }
        a.gestureT += dt;
        if (!p.alive) a.deathT += dt; else a.deathT = 0;
        let want = p.ps.yaw;
        a.back = false;
        if (sp > 40 && p.ps.onGround) {
          const mv = Math.atan2(v[1], v[0]);
          const d = Q.angDiff(p.ps.yaw, mv);
          if (Math.abs(d) > 2.2) { a.back = true; want = Q.wrapAng(mv + Math.PI); }
          else want = p.ps.yaw + Q.clamp(d, -0.8, 0.8);
        }
        const dd = Q.angDiff(a.legYaw, want);
        a.legYaw = Q.wrapAng(a.legYaw + dd * Math.min(1, dt * 10));
        if (Math.abs(Q.angDiff(a.legYaw, p.ps.yaw)) > 1.1) a.legYaw = Q.wrapAng(p.ps.yaw - Math.sign(Q.angDiff(a.legYaw, p.ps.yaw)) * 1.1);
      }
    }

    charState(p, pos, a, time) {
      return {
        pos, yaw: p.ps.yaw, legYaw: a.legYaw, pitch: p.ps.pitch, t: time + p.id, phase: a.phase, back: a.back,
        moveSpeed: Math.hypot(p.ps.velocity[0], p.ps.velocity[1]), onGround: p.ps.onGround, crouch: p.ps.ducked,
        landT: a.landT, dead: !p.alive, deathT: a.deathT, deathAnim: p.deathAnim, attackT: a.attackT, gestureT: a.gestureT
      };
    }

    drawCharacter(ch, st, lit, o, weaponWp) {
      Q.poseCharacter(ch, st, this.pose);
      for (const part of this.pose) this.r.drawMesh(part.mesh, part.m, lit, o);
      if (weaponWp && this.pose.weaponMatrix && !st.dead) this.r.drawMesh(Q.weaponMesh(weaponWp), this.pose.weaponMatrix, lit, o);
    }

    draw(game, fx, view, opts) {
      const r = this.r;
      const time = opts.time;
      const cam = r.camera(view);
      const dl = fx ? fx.dynLights(view, game, opts.extraLights) : [];
      r.begin(view);
      r.drawWorld(cam, view, time, dl);
      r.beginModels(cam, dl, view.pos);
      const alpha = opts.alpha === undefined ? 1 : opts.alpha;
      const trans = [];
      if (game && opts.podium) this.drawPodium(game, opts.podium, time);
      if (game) {
        for (const p of game.players) {
          if (p === opts.hide || opts.podium) continue;
          if (!p.alive && p.gibbed) continue;
          const a = this.animFor(p);
          const pos = p.prevOrigin ? Q.vlerp(p.prevOrigin, p.ps.origin, alpha) : p.ps.origin;
          const ch = Q.getCharacter(p.look, game.teamGame ? p.team : null);
          const st = this.charState(p, pos, a, time);
          const lit = r.lightAt([pos[0], pos[1], pos[2] + 10]);
          const inv = p.powerups.invis > game.time;
          const o = {};
          if (p.alive && p.powerups.quad > game.time) o.shell = [0.25, 0.4, 1, 0.55 + 0.2 * Math.sin(time * 9)];
          else if (p.alive && p.powerups.battlesuit > game.time) o.shell = [1, 0.8, 0.2, 0.45];
          else if (p.alive && p.powerups.regen > game.time && Math.sin(time * 6) > 0.3) o.shell = [1, 0.1, 0.1, 0.4];
          if (inv) { trans.push({ ch, st, lit, wp: p.weapon }); continue; }
          if (p.alive && game.time - p.spawnTime < 0.4) o.shell = [0.6, 0.7, 1, 0.6 * (1 - (game.time - p.spawnTime) / 0.4)];
          this.drawCharacter(ch, st, lit, o, p.alive ? p.weapon : 0);
        }
        for (const b of game.bodies) {
          if (b.gibbed) continue;
          const ch = Q.getCharacter(b.look, game.teamGame ? b.team : null);
          const sink = Math.max(0, game.time - b.sinkAt) * 16;
          const st = { pos: [b.pos[0], b.pos[1], b.pos[2] - sink], yaw: b.yaw, legYaw: b.yaw, pitch: 0, t: 0, dead: true, deathT: 5, deathAnim: b.deathAnim, onGround: true };
          this.drawCharacter(ch, st, r.lightAt(b.pos), {}, 0);
        }
        const bob = Math.sin(time * 2.2) * 4;
        const drawItem = (it, isDropped) => {
          if (!it.active) return;
          const def = it.def;
          const mesh = Q.itemMesh(it.key);
          let m = M4.translate(M4.ident(), it.pos[0], it.pos[1], it.pos[2] + (isDropped && it.rest ? 0 : 0) + bob * (isDropped ? 0.5 : 1));
          m = M4.rotZ(m, time * 1.8 + (it.spin || 0));
          const sc = def.type === 'weapon' ? 1.45 : def.type === 'powerup' ? 1.35 : def.type === 'armor' && def.amount > 5 ? 1.25 : 1;
          if (sc !== 1) m = M4.scale(m, sc, sc, sc);
          const lit = r.lightAt(it.pos);
          if (def.type === 'health') { trans.push({ mesh, m, lit, alpha: 0.85 }); return; }
          r.drawMesh(mesh, m, lit, def.type === 'powerup' ? { shell: [def.color[0], def.color[1], def.color[2], 0.3 + 0.15 * Math.sin(time * 5)], inflate: 1.5 } : {});
        };
        for (const it of game.items) drawItem(it, false);
        for (const it of game.dropped) drawItem(it, true);
        for (const m of game.projectiles) {
          if (m.kind !== 'rocket' && m.kind !== 'grenade') continue;
          const dir = Q.vnorm(m.vel);
          const ang = Q.vecToAngles(m.kind === 'rocket' ? dir : [1, 0, 0]);
          let mm = M4.translate(M4.ident(), m.pos[0], m.pos[1], m.pos[2]);
          mm = M4.rotZ(mm, ang.yaw);
          mm = M4.rotY(mm, ang.pitch);
          if (m.kind === 'grenade') mm = M4.rotX(mm, time * 8);
          r.drawMesh(Q.projectileMesh(m.kind), mm, r.lightAt(m.pos), {});
        }
      }
      if (this.statues) {
        for (const s of this.statues) {
          const st = { pos: [s.d.pos[0], s.d.pos[1], s.d.pos[2] + 24 * s.d.scale], yaw: (s.d.yaw || 0) * Q.DEG, legYaw: (s.d.yaw || 0) * Q.DEG, pitch: -0.3, t: 0, onGround: true, gestureT: 0.5 };
          Q.poseCharacter(s.ch, st, this.pose);
          const lit = r.lightAt(s.d.pos);
          for (const part of this.pose) {
            const m = scaleAbout(part.m, s.d.pos, s.d.scale);
            r.drawMesh(part.mesh, m, lit, {});
          }
          if (this.pose.weaponMatrix) r.drawMesh(Q.weaponMesh(WP.RAILGUN), scaleAbout(this.pose.weaponMatrix, s.d.pos, s.d.scale), lit, {});
        }
      }
      if (fx) {
        for (const g of fx.gibs) {
          let m = M4.translate(M4.ident(), g.pos[0], g.pos[1], g.pos[2]);
          m = M4.rotZ(m, g.rot);
          m = M4.rotX(m, g.rot * 0.7);
          r.drawMesh(g.mesh === 'brass' ? this.brass : g.mesh, m, r.lightAt(g.pos), {});
        }
      }
      for (const t of trans) {
        if (t.ch) {
          Q.poseCharacter(t.ch, t.st, this.pose);
          for (const part of this.pose) r.drawMesh(part.mesh, part.m, t.lit, { alpha: 0.12 + 0.05 * Math.sin(time * 7) });
        } else r.drawMesh(t.mesh, t.m, t.lit, { alpha: t.alpha });
      }
      r.endModels();
      if (fx) r.drawSprites(cam, fx.build(view, game, r.decals, time, this.flames));
      return cam;
    }

    drawPodium(game, pod, time) {
      const r = this.r;
      if (!this.podMesh) {
        this.podMesh = [40, 28, 18].map(h => new Q.MB().box(0, 0, h / 2, 44, 44, h, [0.42, 0.36, 0.3], { top: [0.55, 0.48, 0.4] }).box(0, 0, h - 2, 46, 46, 4, [0.6, 0.45, 0.2]).finish());
      }
      const ranks = game.ranking().slice(0, 3);
      const right = Q.angleVectors(pod.yaw, 0).right;
      const offs = [0, -58, 58];
      ranks.forEach((p, i) => {
        const base = Q.vma(pod.spot, offs[i], right);
        const h = [40, 28, 18][i];
        const lit = r.lightAt([base[0], base[1], base[2] + 60]);
        const bl = { amb: lit.amb.map(c => c + 0.15), dcol: lit.dcol, dir: lit.dir };
        r.drawMesh(this.podMesh[i], M4.rotZ(M4.translate(M4.ident(), base[0], base[1], base[2]), pod.yaw), bl, {});
        const ch = Q.getCharacter(p.look, game.teamGame ? p.team : null);
        const yaw = pod.yaw + Math.PI;
        const st = { pos: [base[0], base[1], base[2] + h + 24], yaw, legYaw: yaw, pitch: 0, t: time + i, onGround: true, gestureT: i === 0 ? (time % 3.2) : 9 };
        this.drawCharacter(ch, st, bl, {}, i === 0 ? p.weapon || 5 : p.weapon);
      });
    }

    drawViewWeapon(p, view, st, time) {
      const r = this.r;
      r.clearDepth();
      const aspect = r.cv.width / r.cv.height;
      const fy = 2 * Math.atan(Math.tan(45 * Q.DEG) / Math.max(aspect, 4 / 3) * 0.9);
      const vp = M4.persp(fy, aspect, 1, 400);
      r.beginModels({ vp }, st.dl, [0, 0, 0]);
      let m = new Float32Array([0, 0, -1, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
      const drop = st.drop || 0;
      const kick = st.kick || 0;
      m = M4.translate(m, 21 - kick * 2.5, -8.2 + st.bobX, -9.4 + st.bobY - drop * 14);
      m = M4.rotY(m, -kick * 0.1 + st.swayP + 0.02);
      m = M4.rotZ(m, st.swayY + 0.1);
      m = M4.rotX(m, -0.18);
      if (p.weapon === WP.GAUNTLET && st.firing) m = M4.rotX(m, Math.sin(time * 40) * 0.08);
      m = M4.scale(m, 0.68, 0.68, 0.68);
      const lit = { amb: st.lit.amb.map(c => Math.max(0.32, c)), dcol: st.lit.dcol.map(c => Math.max(0.45, c)), dir: st.lit.dir };
      const o = {};
      if (p.powerups.quad > st.gameTime) o.shell = [0.25, 0.4, 1, 0.35];
      r.drawMesh(Q.weaponMesh(p.weapon), m, lit, o);
      r.endModels();
      return m;
    }

    drawIcon(mesh, x, y, w, h, yaw, o) {
      const r = this.r;
      o = o || {};
      r.viewportRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      r.clearDepth();
      const proj = M4.persp(o.fov || 30 * Q.DEG, w / h, 1, 400);
      const dist = o.dist || 60;
      const vm = M4.view([-dist, 0, o.z || 0], 0, o.pitch || 0, 0);
      const vp = M4.mul(proj, vm);
      r.beginModels({ vp }, [], [-dist, 0, 0]);
      let m = M4.rotZ(M4.ident(), yaw || 0);
      if (o.offset) m = M4.translate(m, o.offset[0], o.offset[1], o.offset[2]);
      if (o.scale) m = M4.scale(m, o.scale, o.scale, o.scale);
      r.drawMesh(mesh, m, { amb: [0.55, 0.52, 0.5], dcol: [0.9, 0.85, 0.8], dir: Q.vnorm([-0.6, 0.4, 0.7]) }, o.draw || {});
      r.endModels();
      r.resetViewport();
    }
  }
  Q.Scene = Scene;

  function scaleAbout(m, p, s) {
    let o = M4.translate(M4.ident(), p[0], p[1], p[2]);
    o = M4.scale(o, s, s, s);
    o = M4.translate(o, -p[0], -p[1], -p[2]);
    return M4.mul(o, m);
  }
})(globalThis.Quake3 = globalThis.Quake3 || {});
