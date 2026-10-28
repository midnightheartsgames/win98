(function (K) {
  'use strict';

  const UNDER = 1.6, CONE = Math.cos(60 * Math.PI / 180), DAY = 60, NIGHT = 25, HIDE = 6, FEEL = 2.5, LIGHT = 14;
  const LOUD = Object.freeze({ still: 0, crawl: 2, crouch: 3, walk: 7, run: 15, sprint: 22, chair: 6, fight: 30 });

  const chest = who => {
    const mv = who.mv;
    if (mv.chest !== undefined) return [mv.pos[0], mv.pos[1] + mv.chest, mv.pos[2]];
    return [mv.pos[0], mv.pos[1] + (mv.crawl ? 0.35 : mv.crouch ? 0.9 : mv.chair ? 1.0 : 1.3), mv.pos[2]];
  };

  const eyeOf = who => [who.mv.pos[0], who.mv.pos[1] + (who.mv.eye || K.METRICS.eyeStand), who.mv.pos[2]];

  function lit(W, at) {
    for (const L of K.Places.LANDMARKS) for (const g of L.lights) {
      const x = g.ax !== undefined ? g.ax : L.at[0] + (g.dx || 0), z = g.az !== undefined ? g.az : L.at[1] + (g.dz || 0);
      if (Math.hypot(at[0] - x, at[2] - z) < LIGHT + g.size) return true;
    }
    return false;
  }

  function cover(W, who) {
    const mv = who.mv, F = W.flora, bush = !!(F && F.bushAt && F.bushAt(mv.pos[0], mv.pos[2], UNDER));
    if ((mv.crouch || mv.crawl) && bush) return 'hidden';
    if (bush) return 'bush';
    if (mv.crawl) return 'low';
    if (mv.crouch) return 'crouch';
    return 'open';
  }

  const weather = (W, target, wx) => wx ? K.Weather.sight(wx, K.Weather.mistAt(W.terrain, wx, target.mv.pos[0], target.mv.pos[2])) : 1;

  function range(W, target, hour, wx) {
    const D = K.daylight(hour === undefined ? 12 : hour), base = (DAY + (NIGHT - DAY) * D.night) * weather(W, target, wx);
    const torch = !!(target.fight && target.fight.torch && !target.fight.down);
    const lightUp = D.night > 0.3 && (torch || lit(W, target.mv.pos)) ? DAY * weather(W, target, wx) : base, c = torch ? 'open' : cover(W, target);
    if (c === 'hidden') return HIDE;
    return lightUp * (c === 'bush' ? 0.7 : c === 'low' ? 0.6 : c === 'crouch' ? 0.8 : 1);
  }

  function clear(W, a, b) {
    const d = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(2, Math.ceil(d / 1.5)), T = W.terrain, F = W.flora;
    for (let i = 1; i < n; i++) {
      const s = i / n, x = a[0] + (b[0] - a[0]) * s, y = a[1] + (b[1] - a[1]) * s, z = a[2] + (b[2] - a[2]) * s;
      if (T.heightAt(x, z) > y) return false;
      for (const bx of W.near(x, z, 0.5)) {
        const dx = x - bx.x, dz = z - bx.z, u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
        if (Math.abs(u) <= bx.hw && Math.abs(v) <= bx.hd && y >= bx.y0 && y <= bx.y1) return false;
      }
    }
    if (F) {
      const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, ux = b[0] - a[0], uz = b[2] - a[2], uu = ux * ux + uz * uz || 1e-9;
      let hit = false;
      F.trunksNear(mx, mz, d / 2 + 0.5, t => {
        if (hit) return;
        const px = F.trees.X[t] - a[0], pz = F.trees.Z[t] - a[2], s = Math.max(0, Math.min(1, (px * ux + pz * uz) / uu));
        if (s > 0.02 && s < 0.98 && Math.hypot(px - ux * s, pz - uz * s) < F.trees.RAD[t] + 0.06) hit = true;
      });
      if (hit) return false;
    }
    return true;
  }

  function sees(who, target, W, hour, wx) {
    const a = eyeOf(who), b = chest(target), dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz);
    if (d < FEEL) return true;
    if (d > range(W, target, hour, wx)) return false;
    const yaw = who.mv.yaw, fx = Math.sin(yaw), fz = -Math.cos(yaw);
    if ((dx * fx + dz * fz) / d < CONE) return false;
    return clear(W, a, b);
  }

  function loudness(who) {
    const mv = who.mv, L = mv.limit, F = who.fight;
    if (F && (F.act || F.draw)) return LOUD.fight * (F.act ? 1 : 0.15);
    if (mv.chair) return mv.speed > 0.3 ? LOUD.chair : 0;
    if (mv.speed < 0.2) return LOUD.still;
    const base = mv.crawl ? LOUD.crawl : mv.crouch ? LOUD.crouch : mv.walk || mv.speed < 2.2 ? LOUD.walk : mv.sprinting ? LOUD.sprint : LOUD.run;
    return base * (L && L.loud ? 1.6 : 1) * (mv.crutchOn ? 1.3 : 1);
  }

  const hears = (who, target, wx) => Math.hypot(target.mv.pos[0] - who.mv.pos[0], target.mv.pos[2] - who.mv.pos[2]) < loudness(target) * (wx ? K.Weather.hearing(wx) : 1);

  K.Senses = { CONE, DAY, NIGHT, HIDE, LOUD, cover, range, clear, sees, loudness, hears, chest, eyeOf };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
