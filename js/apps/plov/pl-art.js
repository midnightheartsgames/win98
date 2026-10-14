(function (P) {
  'use strict';
  const O = P.Orn;
  const { rng } = P;
  const K = 2;
  const TAU = Math.PI * 2;
  const INK = '#3b2417';
  const LW = 1.1;

  function mk(w, h, ax, ay, draw) {
    const c = O.canvas(w * K, h * K);
    const ctx = c.getContext('2d');
    ctx.scale(K, K);
    ctx.translate(ax, ay);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    draw(ctx);
    return { c, w, h, ax, ay };
  }

  function blit(ctx, s, x, y, opts) {
    if (!s) return;
    const sc = (opts && opts.scale) || 1;
    if (opts && opts.flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-sc, sc);
      ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
      ctx.restore();
      return;
    }
    ctx.drawImage(s.c, x - s.ax * sc, y - s.ay * sc, s.w * sc, s.h * sc);
  }

  const cache = new Map();
  const CACHE_MAX = 900;
  function cached(key, make) {
    let v = cache.get(key);
    if (v) { cache.delete(key); cache.set(key, v); return v; }
    v = make();
    cache.set(key, v);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return v;
  }

  function finish(ctx, fill, line, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line !== null) { ctx.strokeStyle = line || INK; ctx.lineWidth = lw || LW; ctx.stroke(); }
  }
  function ell(ctx, x, y, rx, ry, fill, line, lw) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU); finish(ctx, fill, line, lw); }
  function rrect(ctx, x, y, w, h, r, fill, line, lw) {
    const q = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + q, y);
    ctx.arcTo(x + w, y, x + w, y + h, q);
    ctx.arcTo(x + w, y + h, x, y + h, q);
    ctx.arcTo(x, y + h, x, y, q);
    ctx.arcTo(x, y, x + w, y, q);
    ctx.closePath();
    finish(ctx, fill, line, lw);
  }
  function poly(ctx, pts, fill, line, lw) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    finish(ctx, fill, line, lw);
  }
  function limb(ctx, pts, w, fill, line) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    if (line !== null) { ctx.strokeStyle = line || INK; ctx.lineWidth = w + LW * 2; ctx.stroke(); }
    ctx.strokeStyle = fill;
    ctx.lineWidth = w;
    ctx.stroke();
  }
  function clipDo(ctx, clipPath, fn) {
    ctx.save();
    clipPath();
    ctx.clip();
    fn();
    ctx.restore();
  }

  const SKINS = ['#f2cfae', '#e8b88e', '#d9a077', '#c68a5c', '#b07550', '#f6dcc2'];
  const HAIRS = ['#2a2226', '#3a261c', '#4a3022', '#1c1a1e', '#5a3a26'];
  const SHIRTS = ['#f2f0e8', '#8fb8e0', '#e8d890', '#c8e0c0', '#e0a0a0', '#b0a0d8', '#f0c090'];
  const DARKS = ['#3a3a48', '#2e3a5a', '#4a3a30', '#3a4a3a', '#2a2a30', '#5a4a3a'];
  const SCARVES = ['#d8385a', '#e8a020', '#2a9a6a', '#7a3aa8', '#1f6fb8', '#e86a30'];
  const TEES = ['#e84040', '#2f7ae0', '#30b060', '#f0c020', '#e060b0', '#ff8a2a', '#20b0c0'];

  const lookMemo = new Map();

  function lookFor(L) {
    const key = L.type + ':' + L.seed + ':' + (L.kid ? 1 : 0) + ':' + L.idx;
    if (lookMemo.has(key)) return lookMemo.get(key);
    const r = rng(L.seed ^ 0x9e3779b9);
    const pk = a => a[Math.floor(r() * a.length)];
    const D = {
      key, scale: 1, skin: pk(SKINS), hair: pk(HAIRS), hairStyle: 'short', hat: null, hatCol: null,
      top: pk(SHIRTS), topKind: 'shirt', bottom: pk(DARKS), shoes: '#2a2224', eye: '#2a1a14',
      beard: null, mustache: false, glasses: false, acc: [], female: false, pattern: null, sash: null, trim: null
    };
    const t = L.type;
    if (t === 'neighbor') {
      D.female = r() < 0.45;
      if (D.female) {
        D.hairStyle = 'long'; D.hat = 'kerchief'; D.hatCol = pk(SCARVES); D.topKind = 'dress'; D.pattern = 'atlas'; D.top = pk(['#e0306a', '#2f9e5a', '#2b3d9a', '#e8a020']);
      } else {
        D.hat = r() < 0.55 ? 'doppi' : null; D.mustache = r() < 0.4;
        D.topKind = r() < 0.3 ? 'vest' : 'shirt';
      }
    } else if (t === 'elder') {
      D.hair = '#d8d4cc'; D.hat = 'doppi'; D.beard = '#eeeae2'; D.topKind = 'chapan'; D.pattern = 'chapan'; D.sash = pk(['#e8c860', '#c8382a', '#2a8a5a']); D.top = pk(['#233a8c', '#2e6f5a', '#5e2a5a']);
      D.skin = pk(['#d9a077', '#c68a5c', '#e8b88e']); D.acc.push('cane');
    } else if (t === 'student') {
      D.female = r() < 0.4;
      D.hairStyle = D.female ? 'ponytail' : pk(['short', 'spiky']);
      D.topKind = 'tee'; D.top = pk(TEES); D.bottom = pk(['#3a5a9a', '#2e3e6a', '#4a4a50']);
      D.shoes = '#f0f0f0'; D.glasses = r() < 0.35; D.acc.push('backpack'); D.bag = pk(['#e84a2a', '#2a6ae8', '#3a3a3a', '#8a3ab8']);
    } else if (t === 'worker') {
      D.hat = r() < 0.6 ? 'helmet' : 'cap'; D.hatCol = D.hat === 'helmet' ? '#f5c518' : pk(['#2a5aa8', '#c8382a', '#3a3a3a']);
      D.topKind = 'overalls'; D.top = pk(['#f08a24', '#2f6ab8', '#4a7a3a']); D.bottom = D.top; D.mustache = r() < 0.6;
      D.shoes = '#4a3222';
    } else if (t === 'family') {
      if (L.kid) {
        D.scale = 0.74; D.hairStyle = pk(['short', 'curly', 'pigtails']); D.female = D.hairStyle === 'pigtails';
        D.topKind = 'tee'; D.top = pk(TEES); D.bottom = pk(['#3a5a9a', '#e0a0c0', '#4a4a50']); D.shoes = pk(['#e84040', '#2a6ae8', '#f0f0f0']);
        D.hat = !D.female && r() < 0.5 ? 'doppi' : null;
        D.kid = true;
      } else if (L.idx === 0) {
        D.female = true; D.hairStyle = 'long'; D.hat = 'kerchief'; D.hatCol = pk(SCARVES); D.topKind = 'dress'; D.pattern = 'atlas'; D.top = pk(['#e0306a', '#2b3d9a', '#2f9e5a']);
      } else {
        D.hat = r() < 0.6 ? 'doppi' : null; D.mustache = r() < 0.5; D.topKind = 'shirt';
      }
    } else if (t === 'tourist') {
      D.skin = pk(['#f6dcc2', '#f2cfae', '#f0c8a8']); D.hair = pk(['#d8b060', '#b8703a', '#e0c890', '#5a3a26']);
      D.hat = 'panama'; D.hatCol = pk(['#f0e0b0', '#e8e8e0', '#d8c090']); D.topKind = 'hawaii'; D.top = pk(['#30a0c0', '#e85a3a', '#f0c020', '#6ac050']);
      D.bottom = pk(['#d8c8a0', '#8a9a6a', '#c0b090']); D.shorts = true; D.acc.push('camera'); D.shoes = '#8a6a4a';
      D.female = r() < 0.4; if (D.female) D.hairStyle = 'long';
    } else if (t === 'business') {
      D.hairStyle = 'slick'; D.topKind = 'suit'; D.top = pk(['#2a2a38', '#3a3a4a', '#2a3450', '#4a3a3a']); D.bottom = D.top; D.tie = pk(['#c8282a', '#2a5ac8', '#e8a020']);
      D.shoes = '#16161a'; D.acc.push('phone'); D.glasses = r() < 0.25;
    } else if (t === 'critic') {
      D.hat = 'beret'; D.hatCol = '#7a1f3a'; D.glasses = true; D.topKind = 'coat'; D.top = '#5a4a6a'; D.bottom = '#2e2a3a'; D.mustache = true;
      D.scarf = '#e8c048'; D.acc.push('notebook'); D.skin = pk(['#f2cfae', '#e8b88e']); D.hair = '#4a4a4a';
    } else if (t === 'courier') {
      D.hat = 'doppi'; D.topKind = 'vest'; D.top = '#1e1e24'; D.shirtUnder = '#f4f0e8'; D.sash = '#d8283a'; D.mustache = true; D.acc.push('flower');
    }
    D.skinShade = O.shade(D.skin, -0.18);
    D.hairShade = O.shade(D.hair, -0.25);
    D.topShade = O.shade(D.top, -0.22);
    D.armL = D.armR = { sleeve: D.topKind === 'tee' || D.topKind === 'hawaii' || D.topKind === 'overalls' ? 'short' : 'long', col: D.topKind === 'overalls' ? D.skin : D.topKind === 'vest' ? (D.shirtUnder || D.top) : D.top, hand: D.skin };
    if (D.topKind === 'overalls') D.armL = D.armR = { sleeve: 'short', col: '#e8e2d4', hand: D.skin };
    if (D.topKind === 'vest') D.armL = D.armR = { sleeve: 'long', col: D.shirtUnder || '#f2f0e8', hand: D.skin };
    lookMemo.set(key, D);
    if (lookMemo.size > 400) lookMemo.delete(lookMemo.keys().next().value);
    return D;
  }

  const HAYATO = {
    key: 'hayato', hayato: true, scale: 1.06,
    skin: '#9c6444', skinShade: '#7c4a30', hair: '#efeee9', hairShade: '#bfc0ca', streak: '#3b2a24', eye: '#d8338a',
    hairStyle: 'hayato', hat: 'toque', top: '#e6dfcc', topShade: '#c7bb9f', topKind: 'apron', bottom: '#2f52b4', shoes: '#1c1c22',
    armR: { sleeve: 'long', col: '#e6dfcc', trim: '#2d56c8', hand: '#26262c', gauntlet: true },
    armL: { sleeve: 'short', col: '#1f1f26', hand: '#efe8d6', band: '#2d56c8', skin: true },
    acc: [], female: false
  };

  let patternCache = new Map();
  function fabric(D, ctx) {
    if (!D.pattern) return D.top;
    const key = D.pattern + D.key;
    let c = patternCache.get(key);
    if (!c) {
      const seed = P.hash(D.key);
      if (D.pattern === 'atlas') c = O.ikat(seed, 40, 64, [D.top, '#ffd23f', '#f7f0e0', O.shade(D.top, -0.35), '#2f9e5a', D.top], { kind: 'flame', feather: 0.09, tileH: 32, bg: D.top });
      else c = O.ikat(seed, 36, 36, O.PALETTES.chapan, { kind: 'stripe', feather: 0.04, tileW: 36, tileH: 36 });
      patternCache.set(key, c);
      if (patternCache.size > 120) patternCache.delete(patternCache.keys().next().value);
    }
    const pat = O.patternOf(ctx, c);
    if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(0.5));
    return pat;
  }

  function face(ctx, D, pose, x0, headY) {
    const ex = pose.expr || 'ok';
    const hy = headY === undefined ? -40 + (pose.dy || 0) : headY;
    const big = D.hayato || pose.hd;
    const eyeY = hy + 0.6;
    const sx = x0 || 0;
    const eyes = (dxs) => {
      for (const dx of dxs) {
        const x = sx + dx;
        if (ex === 'happy') {
          ctx.beginPath(); ctx.arc(x, eyeY + 0.8, big ? 1.8 : 1.5, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
        } else if (ex === 'blink') {
          ctx.beginPath(); ctx.moveTo(x - (big ? 2 : 1.5), eyeY + 0.5); ctx.quadraticCurveTo(x, eyeY + 1.4, x + (big ? 2 : 1.5), eyeY + 0.5); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
        } else if (big) {
          const iris = D.hayato ? D.eye : O.shade(D.eye, 0.25);
          ell(ctx, x, eyeY, 1.9, 2.5, '#fff', null);
          ell(ctx, x, eyeY + 0.3, 1.5, 2.1, iris, null);
          ell(ctx, x, eyeY + 0.6, 0.8, 1.2, D.hayato ? '#3a0a24' : '#120806', null);
          ell(ctx, x - 0.6, eyeY - 0.8, 0.55, 0.55, '#fff', null);
          if (pose.hd) ell(ctx, x + 0.6, eyeY + 1.2, 0.3, 0.3, 'rgba(255,255,255,0.8)', null);
          ctx.beginPath(); ctx.moveTo(x - 2.3, eyeY - 2.3); ctx.lineTo(x + 2.2, eyeY - 2.6); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
        } else {
          ell(ctx, x, eyeY, 1.15, 1.6, D.eye, null);
          ell(ctx, x - 0.35, eyeY - 0.6, 0.4, 0.4, '#fff', null);
        }
      }
    };
    const brows = (dxs, ang) => {
      ctx.strokeStyle = D.hair === '#efeee9' ? '#9a9aa4' : O.shade(D.hair, -0.1);
      ctx.lineWidth = 1;
      for (const dx of dxs) {
        const x = sx + dx, s = dx < 0 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(x - 1.6, hy - 3 + ang * s * -1); ctx.lineTo(x + 1.6, hy - 3 + ang * s); ctx.stroke();
      }
    };
    return { eyes, brows, ex, hy, eyeY };
  }

  function mouth(ctx, x, y, ex, wide) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    if (ex === 'happy') {
      ctx.beginPath(); ctx.moveTo(x - 2.2 * wide, y - 0.4); ctx.quadraticCurveTo(x, y + 3.2, x + 2.2 * wide, y - 0.4); ctx.closePath();
      ctx.fillStyle = '#8a2a2a'; ctx.fill(); ctx.stroke();
    } else if (ex === 'angry') {
      ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.quadraticCurveTo(x, y - 1.2, x + 2, y + 1); ctx.stroke();
    } else if (ex === 'eat') {
      ell(ctx, x, y + 0.4, 1.2, 1.3, '#7a2222', INK, 0.9);
    } else if (ex === 'impatient') {
      ctx.beginPath(); ctx.moveTo(x - 1.8, y + 0.5); ctx.lineTo(x + 1.8, y + 0.2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x - 1.6, y); ctx.quadraticCurveTo(x, y + 1.4, x + 1.6, y); ctx.stroke();
    }
  }

  function hatFront(ctx, D, hy, back) {
    const h = D.hat;
    if (!h) return;
    if (h === 'toque') {
      const top = hy - 9;
      ctx.beginPath();
      ctx.moveTo(-8.4, top + 3);
      ctx.bezierCurveTo(-13, top - 3, -9, top - 12, -4, top - 10);
      ctx.bezierCurveTo(-3, top - 16, 4, top - 16, 5, top - 10);
      ctx.bezierCurveTo(10, top - 12, 13, top - 3, 8.4, top + 3);
      ctx.closePath();
      finish(ctx, '#fbfbf6', INK);
      clipDo(ctx, () => { ctx.beginPath(); ctx.moveTo(-8.4, top + 3); ctx.bezierCurveTo(-13, top - 3, -9, top - 12, -4, top - 10); ctx.bezierCurveTo(-3, top - 16, 4, top - 16, 5, top - 10); ctx.bezierCurveTo(10, top - 12, 13, top - 3, 8.4, top + 3); ctx.closePath(); }, () => {
        ell(ctx, 6, top - 4, 6, 9, '#dde2ec', null);
        ctx.strokeStyle = '#c6ccd8'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(-3, top + 2); ctx.quadraticCurveTo(-4, top - 5, -1.5, top - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2.5, top + 2); ctx.quadraticCurveTo(3.5, top - 5, 1.5, top - 11); ctx.stroke();
      });
      rrect(ctx, -9, top + 1, 18, 5.4, 1.4, '#f4f5f1', INK);
      ctx.fillStyle = '#2d56c8';
      ctx.fillRect(-8.3, top + 4.2, 16.6, 1.1);
      return;
    }
    if (h === 'doppi') {
      const w = 7.6;
      poly(ctx, [[-w, hy - 5], [-w + 1.2, hy - 10.5], [w - 1.2, hy - 10.5], [w, hy - 5]], '#16161a', INK);
      clipDo(ctx, () => { ctx.beginPath(); ctx.moveTo(-w, hy - 5); ctx.lineTo(-w + 1.2, hy - 10.5); ctx.lineTo(w - 1.2, hy - 10.5); ctx.lineTo(w, hy - 5); ctx.closePath(); }, () => {
        O.chust(ctx, -w, hy - 10.5, w * 2, 5.5, 1);
      });
      ctx.strokeStyle = INK; ctx.lineWidth = LW;
      ctx.beginPath(); ctx.moveTo(-w, hy - 5); ctx.lineTo(-w + 1.2, hy - 10.5); ctx.lineTo(w - 1.2, hy - 10.5); ctx.lineTo(w, hy - 5); ctx.closePath(); ctx.stroke();
      return;
    }
    if (h === 'kerchief') {
      ctx.beginPath();
      ctx.moveTo(-10.4, hy + 3);
      ctx.quadraticCurveTo(-11.5, hy - 11, 0, hy - 11.5);
      ctx.quadraticCurveTo(11.5, hy - 11, 10.4, hy + 3);
      ctx.quadraticCurveTo(8.5, hy - 5, 0, hy - 6);
      ctx.quadraticCurveTo(-8.5, hy - 5, -10.4, hy + 3);
      ctx.closePath();
      finish(ctx, D.hatCol, INK);
      ctx.fillStyle = O.shade(D.hatCol, 0.45);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-6 + i * 3, hy - 8.4 + Math.abs(i - 2) * 0.6, 0.6, 0, TAU); ctx.fill(); }
      if (back) {
        poly(ctx, [[-5, hy + 2], [0, hy + 12], [5, hy + 2]], D.hatCol, INK);
      }
      return;
    }
    if (h === 'helmet') {
      ctx.beginPath(); ctx.ellipse(0, hy - 4.5, 10, 8, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK);
      rrect(ctx, -11.5, hy - 5, 23, 2.6, 1.2, O.shade(D.hatCol, -0.12), INK);
      ctx.fillStyle = O.shade(D.hatCol, 0.4); ctx.fillRect(-1, hy - 12, 2, 6.5);
      return;
    }
    if (h === 'cap') {
      ctx.beginPath(); ctx.ellipse(0, hy - 4, 9.4, 7.5, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK);
      if (!back) ell(ctx, 0, hy - 3.6, 8, 2.2, O.shade(D.hatCol, -0.2), INK);
      return;
    }
    if (h === 'panama') {
      ell(ctx, 0, hy - 5, 14, 3.6, D.hatCol, INK);
      ctx.beginPath(); ctx.ellipse(0, hy - 7, 8.6, 6.5, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-8.4, hy - 8, 16.8, 1.8);
      return;
    }
    if (h === 'beret') {
      ell(ctx, 1.5, hy - 8, 10.5, 4.6, D.hatCol, INK);
      ell(ctx, 1.5, hy - 12.2, 1, 1.4, D.hatCol, INK);
    }
  }

  function hairFront(ctx, D, hy, layer) {
    const s = D.hairStyle, c = D.hair, cs = D.hairShade;
    if (layer === 'back') {
      if (s === 'long') { rrect(ctx, -10.5, hy - 6, 21, 20, 6, cs, INK); }
      if (s === 'ponytail') { ell(ctx, 8, hy + 3, 3, 6, c, INK); }
      if (s === 'pigtails') { ell(ctx, -10.5, hy + 3, 3, 4, c, INK); ell(ctx, 10.5, hy + 3, 3, 4, c, INK); }
      return;
    }
    if (s === 'hayato') {
      ctx.beginPath();
      ctx.moveTo(-10, hy + 2.5);
      ctx.bezierCurveTo(-11.2, hy - 9, -4, hy - 12.4, 1, hy - 11.6);
      ctx.bezierCurveTo(8, hy - 11, 11.6, hy - 5, 10.2, hy + 3.5);
      ctx.lineTo(8.4, hy + 0.6);
      ctx.lineTo(7.2, hy - 3.2);
      ctx.lineTo(3.6, hy - 1.4);
      ctx.lineTo(2.2, hy - 4.6);
      ctx.lineTo(-1.2, hy - 2.2);
      ctx.lineTo(-3.6, hy + 1.8);
      ctx.lineTo(-6.4, hy - 1.6);
      ctx.lineTo(-8.4, hy + 3.4);
      ctx.closePath();
      finish(ctx, c, INK);
      ctx.beginPath();
      ctx.moveTo(-6.6, hy - 8.8);
      ctx.quadraticCurveTo(-8.8, hy - 3, -6.4, hy - 1.6);
      ctx.lineTo(-3.6, hy + 1.8);
      ctx.quadraticCurveTo(-4.8, hy - 4.2, -3.2, hy - 9.6);
      ctx.closePath();
      finish(ctx, D.streak, INK, 0.8);
      ctx.strokeStyle = cs; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(2, hy - 9.8); ctx.quadraticCurveTo(4.5, hy - 6, 3.6, hy - 1.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6.6, hy - 8.4); ctx.quadraticCurveTo(8.2, hy - 5, 7.4, hy - 3.4); ctx.stroke();
      return;
    }
    if (s === 'short' || s === 'slick' || s === 'spiky' || s === 'curly' || s === 'long' || s === 'ponytail' || s === 'pigtails') {
      if (D.hat === 'kerchief' || D.hat === 'helmet' || D.hat === 'cap' || D.hat === 'panama') {
        if (D.hat !== 'kerchief') { ctx.fillStyle = c; ctx.fillRect(-9.2, hy - 4.5, 2.4, 5); ctx.fillRect(6.8, hy - 4.5, 2.4, 5); }
        return;
      }
      ctx.beginPath();
      if (s === 'spiky') {
        ctx.moveTo(-9.8, hy);
        for (let i = 0; i <= 6; i++) { const x = -9 + i * 3; ctx.lineTo(x, hy - 10 - (i % 2 ? 3 : 0)); }
        ctx.lineTo(9.8, hy);
        ctx.quadraticCurveTo(5, hy - 6, 0, hy - 5.2);
        ctx.quadraticCurveTo(-5, hy - 6, -9.8, hy);
      } else if (s === 'curly') {
        for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; ctx.moveTo(Math.cos(a) * 8.5 + 3, hy - 3 + Math.sin(a) * 8); ctx.arc(Math.cos(a) * 8.5, hy - 3 + Math.sin(a) * 8, 3, 0, TAU); }
      } else {
        ctx.moveTo(-9.9, hy + 1.2);
        ctx.bezierCurveTo(-10.6, hy - 10.5, 10.6, hy - 10.5, 9.9, hy + 1.2);
        if (s === 'slick') { ctx.quadraticCurveTo(6, hy - 6.8, -2, hy - 6.2); ctx.quadraticCurveTo(-7, hy - 5, -9.9, hy + 1.2); }
        else { ctx.quadraticCurveTo(7, hy - 4.8, 2, hy - 5.8); ctx.quadraticCurveTo(-4, hy - 3.6, -9.9, hy + 1.2); }
      }
      finish(ctx, c, INK);
    }
  }

  function beardFront(ctx, D, hy) {
    if (D.beard) {
      ctx.beginPath();
      ctx.moveTo(-8.2, hy + 1);
      ctx.quadraticCurveTo(-8.8, hy + 9.4, 0, hy + 12.6);
      ctx.quadraticCurveTo(8.8, hy + 9.4, 8.2, hy + 1);
      ctx.quadraticCurveTo(6.4, hy + 5.6, 2.8, hy + 7.4);
      ctx.quadraticCurveTo(0, hy + 8.4, -2.8, hy + 7.4);
      ctx.quadraticCurveTo(-6.4, hy + 5.6, -8.2, hy + 1);
      ctx.closePath();
      finish(ctx, D.beard, INK);
      ctx.strokeStyle = O.shade(D.beard, -0.18); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(-3.6, hy + 9); ctx.quadraticCurveTo(-2.4, hy + 11, -1, hy + 11.6); ctx.moveTo(3.6, hy + 9); ctx.quadraticCurveTo(2.4, hy + 11, 1, hy + 11.6); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, hy + 3.9);
      ctx.quadraticCurveTo(-2.6, hy + 3.2, -4.8, hy + 5.6);
      ctx.quadraticCurveTo(-2.4, hy + 5.4, 0, hy + 4.9);
      ctx.quadraticCurveTo(2.4, hy + 5.4, 4.8, hy + 5.6);
      ctx.quadraticCurveTo(2.6, hy + 3.2, 0, hy + 3.9);
      ctx.closePath();
      finish(ctx, D.beard, INK, 0.7);
    } else if (D.mustache) {
      ctx.fillStyle = O.shade(D.hair, -0.1);
      ctx.beginPath(); ctx.ellipse(-1.6, hy + 4.2, 2, 0.9, 0.2, 0, TAU); ctx.ellipse(1.6, hy + 4.2, 2, 0.9, -0.2, 0, TAU); ctx.fill();
    }
  }

  function legColor(D) { return D.bottom; }

  function drawFront(ctx, D, pose, back) {
    const f = pose.frame | 0;
    const act = pose.act;
    const walk = act === 'walk';
    const bob = walk && f % 2 === 1 ? -1 : 0;
    const hy = -40 + bob;
    const legC = legColor(D), legS = O.shade(legC, -0.25);
    const armN = back ? { l: D.armL, r: D.armR } : { l: D.armR, r: D.armL };
    const sitx = act === 'sitx';
    if (sitx) {
      ell(ctx, 0, -3.5, 11.5, 4.2, legC, INK);
      ctx.strokeStyle = legS; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-6, -4.5); ctx.quadraticCurveTo(0, -1.6, 6, -4.5); ctx.stroke();
      ell(ctx, -9.6, -2.2, 2.8, 1.8, D.shoes, INK);
      ell(ctx, 9.6, -2.2, 2.8, 1.8, D.shoes, INK);
    }
    const hipY = sitx ? -6 : -15 + bob;
    const shY = sitx ? -21 : -29 + bob;
    const hyy = sitx ? -31 : hy;
    const HY = hyy;
    if (!sitx) {
      const lift = walk ? (f === 1 ? [2.4, 0] : f === 3 ? [0, 2.4] : [0, 0]) : [0, 0];
      const longRobe = D.topKind === 'chapan' || D.topKind === 'dress' || D.topKind === 'coat';
      const legTop = longRobe ? (D.topKind === 'dress' ? -4 : -8) : hipY + 1;
      if (!D.shorts) {
        limb(ctx, [[-3.5, legTop], [-3.6, -2.6 - lift[0]]], 5.2, legC);
        limb(ctx, [[3.5, legTop], [3.6, -2.6 - lift[1]]], 5.2, legC);
      } else {
        limb(ctx, [[-3.5, legTop], [-3.6, -8]], 5.6, legC);
        limb(ctx, [[3.5, legTop], [3.6, -8]], 5.6, legC);
        limb(ctx, [[-3.6, -8], [-3.6, -2.6 - lift[0]]], 3.6, D.skin);
        limb(ctx, [[3.6, -8], [3.6, -2.6 - lift[1]]], 3.6, D.skin);
      }
      if (D.hayato) {
        const kx = back ? 3.6 : -3.6;
        rrect(ctx, kx - 2.6, -10.2 - (back ? lift[1] : lift[0]) * 0.6, 5.2, 3.8, 1.4, '#b8bcc8', INK, 0.8);
        limb(ctx, [[-3.6, -6 - lift[0]], [-3.6, -2.6 - lift[0]]], 5.6, D.shoes);
        limb(ctx, [[3.6, -6 - lift[1]], [3.6, -2.6 - lift[1]]], 5.6, D.shoes);
      }
      ell(ctx, -3.8, -1.4 - lift[0], 3.2, 1.9, D.shoes, INK);
      ell(ctx, 3.8, -1.4 - lift[1], 3.2, 1.9, D.shoes, INK);
      if (D.hayato || D.shoes === '#f0f0f0') {
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(-6.6, -0.6 - lift[0], 5.6, 0.9);
        ctx.fillRect(1, -0.6 - lift[1], 5.6, 0.9);
      }
    }
    if (!back) hairFront(ctx, D, HY, 'back');
    if (back && (D.acc.includes('backpack'))) { }
    const tw = D.kid ? 13 : 15.5;
    const torso = () => {
      ctx.beginPath();
      if (D.topKind === 'dress') {
        ctx.moveTo(-tw / 2, shY + 1.5);
        ctx.quadraticCurveTo(-tw / 2 - 0.5, shY - 0.5, -tw / 2 + 3, shY - 1);
        ctx.lineTo(tw / 2 - 3, shY - 1);
        ctx.quadraticCurveTo(tw / 2 + 0.5, shY - 0.5, tw / 2, shY + 1.5);
        ctx.lineTo(tw / 2 + 3.5, sitx ? hipY : -3.2);
        ctx.lineTo(-tw / 2 - 3.5, sitx ? hipY : -3.2);
      } else if (D.topKind === 'chapan' || D.topKind === 'coat') {
        ctx.moveTo(-tw / 2, shY + 1.5);
        ctx.quadraticCurveTo(-tw / 2, shY - 1, -tw / 2 + 3, shY - 1);
        ctx.lineTo(tw / 2 - 3, shY - 1);
        ctx.quadraticCurveTo(tw / 2, shY - 1, tw / 2, shY + 1.5);
        ctx.lineTo(tw / 2 + 2, sitx ? hipY : -7.5);
        ctx.lineTo(-tw / 2 - 2, sitx ? hipY : -7.5);
      } else {
        ctx.moveTo(-tw / 2, shY + 1.5);
        ctx.quadraticCurveTo(-tw / 2, shY - 1, -tw / 2 + 3, shY - 1);
        ctx.lineTo(tw / 2 - 3, shY - 1);
        ctx.quadraticCurveTo(tw / 2, shY - 1, tw / 2, shY + 1.5);
        ctx.lineTo(tw / 2 - 0.8, hipY + 1.5);
        ctx.lineTo(-tw / 2 + 0.8, hipY + 1.5);
      }
      ctx.closePath();
    };
    const fillTop = D.pattern ? fabric(D, ctx) : D.top;
    torso();
    finish(ctx, fillTop, INK);
    clipDo(ctx, torso, () => {
      ctx.fillStyle = 'rgba(40,20,10,0.16)';
      ctx.fillRect(tw / 2 - 4, shY - 2, 8, 40);
      if (D.topKind === 'suit' && !back) {
        poly(ctx, [[-2.6, shY - 1], [0, shY + 5], [2.6, shY - 1]], '#f4f4f0', null);
        poly(ctx, [[-0.9, shY + 0.6], [0, shY + 9], [0.9, shY + 0.6]], D.tie, null);
        ctx.strokeStyle = O.shade(D.top, -0.35); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-2.6, shY - 1); ctx.lineTo(-0.6, shY + 9); ctx.moveTo(2.6, shY - 1); ctx.lineTo(0.6, shY + 9); ctx.stroke();
      }
      if (D.topKind === 'overalls' && !back) {
        ctx.fillStyle = '#e8e2d4'; ctx.fillRect(-tw / 2, shY - 2, tw, 5);
        ctx.fillStyle = D.top; ctx.fillRect(-4.5, shY + 1, 9, 20);
        ctx.fillRect(-4.6, shY - 2, 2, 4); ctx.fillRect(2.6, shY - 2, 2, 4);
        ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(-3.6, shY + 2, 0.8, 0, TAU); ctx.arc(3.6, shY + 2, 0.8, 0, TAU); ctx.fill();
      }
      if (D.topKind === 'vest' && !back) {
        ctx.fillStyle = D.shirtUnder || '#f2f0e8'; ctx.fillRect(-2.4, shY - 2, 4.8, 20);
      }
      if (D.topKind === 'hawaii') {
        const r = rng(P.hash(D.key));
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#fff6d0' : O.shade(D.top, -0.3); ctx.beginPath(); ctx.arc(-tw / 2 + r() * tw, shY + r() * 14, 1.1, 0, TAU); ctx.fill(); }
      }
      if (D.topKind === 'chapan') {
        ctx.fillStyle = D.sash;
        ctx.fillRect(-tw / 2 - 3, hipY - 1, tw + 6, 3.2);
        if (!back) { ctx.strokeStyle = O.shade(D.top === '#233a8c' ? '#233a8c' : '#1a2a5a', -0.2); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, shY); ctx.lineTo(0, -7.5); ctx.stroke(); }
      }
      if (D.topKind === 'coat' && D.scarf && !back) {
        ctx.fillStyle = D.scarf; ctx.fillRect(-4, shY - 1.5, 8, 3.2); ctx.fillRect(1.5, shY, 2.6, 9);
      }
      if (D.topKind === 'apron') {
        if (!back) {
          ctx.fillStyle = D.armR.col;
          ctx.fillRect(-tw / 2 - 1, shY - 2, tw + 2, 40);
          ctx.fillStyle = '#2d56c8';
          ctx.fillRect(-tw / 2 - 1, hipY - 0.6, 2.4, 3);
          ctx.fillStyle = '#1f1f26';
          poly(ctx, [[-3, shY - 1.5], [0, shY + 3.2], [3, shY - 1.5]], '#1f1f26', null);
        } else {
          ctx.fillStyle = D.armR.col;
          ctx.fillRect(-tw / 2 - 1, shY - 2, tw + 2, 40);
          ctx.fillStyle = '#c7bb9f';
          ctx.fillRect(tw / 2 - 3, shY - 2, 4, 40);
        }
      }
    });
    if (D.topKind === 'apron') {
      if (!back) {
        ctx.beginPath();
        ctx.moveTo(-5.2, shY + 2.2);
        ctx.lineTo(5.2, shY + 2.2);
        ctx.lineTo(6.2, hipY + 1);
        ctx.lineTo(7.6, -7.2);
        ctx.quadraticCurveTo(0, -5.6, -7.6, -7.2);
        ctx.lineTo(-6.2, hipY + 1);
        ctx.closePath();
        finish(ctx, '#f8f7f2', INK);
        ctx.strokeStyle = '#d6d3c8'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-6.4, hipY + 1.6); ctx.lineTo(6.4, hipY + 1.6); ctx.stroke();
        rrect(ctx, -3.2, hipY + 3.4, 6.4, 3.4, 0.8, '#f0eee6', '#cfccc0', 0.7);
        ctx.strokeStyle = '#f8f7f2'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-5, shY + 2.2); ctx.lineTo(-3.4, shY - 1.2); ctx.moveTo(5, shY + 2.2); ctx.lineTo(3.4, shY - 1.2); ctx.stroke();
        rrect(ctx, 1.3, shY + 3.4, 3.2, 4.2, 0.6, '#ffffff', INK, 0.6);
        ctx.fillStyle = '#2d56c8'; ctx.fillRect(1.6, shY + 3.7, 2.6, 1.1);
      } else {
        ctx.strokeStyle = '#f8f7f2'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-6.4, hipY + 1.4); ctx.lineTo(6.4, hipY + 1.4); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-6.4, hipY + 0.6); ctx.lineTo(6.4, hipY + 0.6); ctx.moveTo(-6.4, hipY + 2.2); ctx.lineTo(6.4, hipY + 2.2); ctx.stroke();
        ell(ctx, -1.8, hipY + 1.4, 1.8, 1.2, '#f8f7f2', INK, 0.7);
        ell(ctx, 1.8, hipY + 1.4, 1.8, 1.2, '#f8f7f2', INK, 0.7);
        ctx.strokeStyle = '#f8f7f2'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-3.4, shY - 1.2); ctx.lineTo(0, shY + 1.4); ctx.lineTo(3.4, shY - 1.2); ctx.stroke();
      }
    }
    if (back && D.acc.includes('backpack')) rrect(ctx, -6.5, shY + 1, 13, 12, 3, D.bag, INK);
    if (!back && D.acc.includes('backpack')) { ctx.strokeStyle = D.bag; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-4.8, shY - 0.6); ctx.lineTo(-5.4, shY + 9); ctx.moveTo(4.8, shY - 0.6); ctx.lineTo(5.4, shY + 9); ctx.stroke(); }
    if (!back && D.acc.includes('camera')) { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-3.5, shY - 0.5); ctx.lineTo(0, shY + 6); ctx.lineTo(3.5, shY - 0.5); ctx.stroke(); rrect(ctx, -3.4, shY + 5, 6.8, 4.4, 1, '#2a2a2e', INK, 0.8); ell(ctx, 0, shY + 7.2, 1.5, 1.5, '#6a8ab0', INK, 0.6); }
    if (!back && D.acc.includes('flower')) { ell(ctx, -4, shY + 3, 1.6, 1.6, '#e83a5a', INK, 0.6); ell(ctx, -4, shY + 3, 0.6, 0.6, '#ffd23f', null); }
    const arms = () => {
      const sw = walk ? (f === 1 ? 1.6 : f === 3 ? -1.6 : 0) : 0;
      const aa = pose.arm || act;
      const carry = aa === 'carry' || aa === 'serve';
      const work = aa === 'work';
      let lh = [-tw / 2 - 1.2, hipY + 1.5 - sw], rh = [tw / 2 + 1.2, hipY + 1.5 + sw];
      let le = [-tw / 2 - 1.4, shY + 6.5 - sw * 0.5], re = [tw / 2 + 1.4, shY + 6.5 + sw * 0.5];
      if (carry && !back) { lh = [-6.2, shY + 7.5]; rh = [6.2, shY + 7.5]; le = [-tw / 2 - 1.2, shY + 6]; re = [tw / 2 + 1.2, shY + 6]; }
      if (work) {
        const up = f % 2 === 0 ? -2 : 1.5;
        if (back) { lh = [-4.2, shY + 5 + up]; rh = [4.2, shY + 5 - up]; le = [-tw / 2 - 1, shY + 5]; re = [tw / 2 + 1, shY + 5]; }
        else { lh = [-5.6, shY + 7 + up]; rh = [5.6, shY + 7 - up]; le = [-tw / 2 - 1.2, shY + 6]; re = [tw / 2 + 1.2, shY + 6]; }
      }
      if (sitx && !carry && !work) { lh = [-7, -6]; rh = [7, -6]; le = [-tw / 2 - 1.2, shY + 6]; re = [tw / 2 + 1.2, shY + 6]; }
      if (aa === 'eat' && !back) { const k = f % 2; rh = k ? [2.4, HY + 5] : [5.2, shY + 5]; re = [tw / 2 + 1.6, shY + 5]; }
      if (aa === 'drink' && !back) { rh = [2.8, HY + 5.5]; re = [tw / 2 + 1.6, shY + 5]; }
      if (aa === 'phone' && !back) { rh = [8.2, HY + 1]; re = [tw / 2 + 2.6, shY + 3]; }
      if (aa === 'raise' && !back) { const wv = f % 2 ? 1.2 : -0.6; rh = [tw / 2 + 2.4 + wv, HY - 11]; re = [tw / 2 + 4.2, shY - 3]; }
      const drawArm = (sx, e, hnd, A) => {
        const sh = [sx, shY + 0.8];
        const sleeve = A.col;
        if (A.sleeve === 'short') {
          const mid = [(sh[0] + e[0]) / 2, (sh[1] + e[1]) / 2];
          limb(ctx, [sh, mid], 4.2, sleeve);
          limb(ctx, [mid, e, hnd], 3.2, A.skin ? D.skin : D.skin);
          if (A.band) { ctx.strokeStyle = A.band; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(mid[0], mid[1] + 0.6); ctx.lineTo(mid[0] + (e[0] - mid[0]) * 0.3, mid[1] + (e[1] - mid[1]) * 0.3 + 0.6); ctx.stroke(); ctx.fillStyle = '#e8c048'; ctx.fillRect(mid[0] - 0.5, mid[1] + 0.6, 1, 1); }
        } else {
          limb(ctx, [sh, e, hnd], 4.1, sleeve);
          if (A.trim) { const t = [e[0] + (hnd[0] - e[0]) * 0.72, e[1] + (hnd[1] - e[1]) * 0.72]; ctx.strokeStyle = A.trim; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] + (hnd[0] - e[0]) * 0.12, t[1] + (hnd[1] - e[1]) * 0.12); ctx.stroke(); }
        }
        if (A.gauntlet) { ell(ctx, hnd[0], hnd[1], 2.5, 2.4, A.hand, INK, 0.9); ctx.fillStyle = '#6a6a78'; ctx.fillRect(hnd[0] - 1.2, hnd[1] - 1.3, 2.4, 0.8); }
        else ell(ctx, hnd[0], hnd[1], 2.1, 2.1, A.hand, INK, 0.9);
      };
      if (D.acc.includes('cane') && !sitx && !back) {
        limb(ctx, [[lh[0] - 0.6, lh[1] - 1], [lh[0] - 2.2, -0.6]], 1.7, '#8a5a2a');
        ctx.beginPath(); ctx.moveTo(lh[0] - 0.6, lh[1] - 1); ctx.quadraticCurveTo(lh[0] + 1, lh[1] - 4.4, lh[0] + 3, lh[1] - 2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.7; ctx.stroke();
      }
      drawArm(-tw / 2 + 1.2, le, lh, armN.l);
      drawArm(tw / 2 - 1.2, re, rh, armN.r);
      if (aa === 'phone' && !back) { rrect(ctx, 6.6, HY - 3.2, 2.6, 6, 0.8, '#2a2a30', INK, 0.7); ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(8.2, HY - 3.2); ctx.lineTo(8.6, HY - 6.4); ctx.stroke(); }
      if (aa === 'drink' && !back) { ell(ctx, 2.8, HY + 4.3, 2.2, 1.4, '#f4f0e6', INK, 0.7); ctx.fillStyle = '#2d5fb8'; ctx.fillRect(1.6, HY + 4.3, 2.4, 0.6); }
      if (D.acc.includes('notebook') && !back && aa !== 'eat') { rrect(ctx, -tw / 2 - 3.6, hipY - 2, 4.6, 5.8, 0.6, '#e8e0c8', INK, 0.7); }
    };
    const headDraw = () => {
      ctx.fillStyle = D.skin;
      rrect(ctx, -2.4, HY + 6.5, 4.8, 4.2, 1, D.skinShade, null);
      if (D.hayato && !back) poly(ctx, [[-4.2, HY + 8.4], [-3.4, HY + 11], [3.4, HY + 11], [4.2, HY + 8.4], [2.2, HY + 7.2], [-2.2, HY + 7.2]], '#1f1f26', INK, 0.8);
      ell(ctx, 0, HY, 9.6, 9.2, D.skin, INK);
      clipDo(ctx, () => { ctx.beginPath(); ctx.ellipse(0, HY, 9.6, 9.2, 0, 0, TAU); }, () => {
        ell(ctx, 5.5, HY + 2, 6, 9, D.skinShade, null);
        ctx.globalAlpha = 0.35; ell(ctx, 6, HY + 1, 6.5, 9, D.skin, null); ctx.globalAlpha = 1;
      });
      if (!back) {
        ell(ctx, -9.4, HY + 1, 1.6, 2.2, D.skin, INK, 0.9);
        ell(ctx, 9.4, HY + 1, 1.6, 2.2, D.skin, INK, 0.9);
      }
      if (back && D.hayato) {
        ctx.beginPath();
        ctx.moveTo(-9.9, HY + 1);
        ctx.bezierCurveTo(-10.9, HY - 9.6, 10.9, HY - 9.6, 9.9, HY + 1);
        ctx.lineTo(9.2, HY + 5.8); ctx.lineTo(6.8, HY + 4.2); ctx.lineTo(5.2, HY + 7.8); ctx.lineTo(2.6, HY + 5.4); ctx.lineTo(0.3, HY + 8.6);
        ctx.lineTo(-2.2, HY + 5.6); ctx.lineTo(-4.8, HY + 7.8); ctx.lineTo(-6.8, HY + 4.4); ctx.lineTo(-9.2, HY + 6);
        ctx.closePath();
        finish(ctx, D.hair, INK);
        ctx.strokeStyle = D.hairShade; ctx.lineWidth = 0.8;
        const tips = [[-7.6, 5.2], [-4.8, 7.2], [-2.2, 5.2], [0.3, 8], [2.6, 5], [5.2, 7.2], [7.8, 5.2]];
        tips.forEach(([x, y], i) => { if (i % 2) return; ctx.beginPath(); ctx.moveTo(x * 0.4, HY - 6); ctx.quadraticCurveTo(x * 0.9, HY, x, HY + y - 1); ctx.stroke(); });
        ctx.beginPath(); ctx.moveTo(-8.6, HY - 1); ctx.quadraticCurveTo(-9.8, HY + 3, -8.2, HY + 5.4); ctx.moveTo(8.6, HY - 1); ctx.quadraticCurveTo(9.8, HY + 3, 8.2, HY + 5.4); ctx.stroke();
        hatFront(ctx, D, HY, true);
        return;
      }
      if (back) {
        ctx.beginPath(); ctx.ellipse(0, HY - 0.6, 9.9, 9.4, 0, 0, TAU);
        finish(ctx, D.hat === 'kerchief' ? D.hatCol : D.hair, INK);
        if (D.beard) { ctx.fillStyle = D.beard; ctx.beginPath(); ctx.ellipse(0, HY + 8, 6, 2.2, 0, 0, TAU); ctx.fill(); }
        hatFront(ctx, D, HY, true);
        return;
      }
      const F = face(ctx, D, pose, 0, HY);
      const angry = F.ex === 'angry';
      if (angry) { ctx.globalAlpha = 0.35; ell(ctx, 0, HY + 1, 8.6, 8, '#e0302a', null); ctx.globalAlpha = 1; }
      F.eyes([-3.5, 3.5]);
      if (angry) F.brows([-3.5, 3.5], 1.2);
      else if (F.ex === 'impatient') F.brows([-3.5, 3.5], -0.6);
      else if (!D.hayato && D.hairStyle !== 'hayato') F.brows([-3.5, 3.5], 0);
      if (D.glasses) {
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(-3.5, F.eyeY, 2.4, 0, TAU); ctx.moveTo(5.9, F.eyeY); ctx.arc(3.5, F.eyeY, 2.4, 0, TAU); ctx.moveTo(-1.1, F.eyeY); ctx.lineTo(1.1, F.eyeY); ctx.stroke();
      }
      if (D.hayato) {
        rrect(ctx, -2.1, HY + 2.2, 4.2, 1.7, 0.6, '#f3e2c4', INK, 0.6);
        ctx.fillStyle = '#c8a878'; ctx.fillRect(-0.9, HY + 2.8, 0.6, 0.6); ctx.fillRect(0.4, HY + 2.8, 0.6, 0.6);
      } else if (pose.hd) {
        ctx.strokeStyle = D.skinShade; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(-0.4, HY + 1.6); ctx.quadraticCurveTo(0.9, HY + 3.2, -0.2, HY + 3.6); ctx.stroke();
      }
      if (D.kid || F.ex === 'happy') { ctx.globalAlpha = 0.4; ell(ctx, -5.6, HY + 3.6, 1.8, 1.1, '#f06a6a', null); ell(ctx, 5.6, HY + 3.6, 1.8, 1.1, '#f06a6a', null); ctx.globalAlpha = 1; }
      mouth(ctx, 0, HY + 5.2, F.ex, 1);
      beardFront(ctx, D, HY);
      hairFront(ctx, D, HY, 'front');
      hatFront(ctx, D, HY, false);
    };
    if (back) { arms(); headDraw(); }
    else { headDraw(); arms(); }
  }

  function drawSide(ctx, D, pose) {
    const f = pose.frame | 0;
    const act = pose.act;
    const walk = act === 'walk';
    const bob = walk && f % 2 === 1 ? -1 : 0;
    const sit = act === 'sit', sitx = act === 'sitx';
    const legC = legColor(D), legS = O.shade(legC, -0.3);
    const near = D.armN || D.armR, far = D.armF || D.armL;
    const hipY = sit ? -13 : sitx ? -5.5 : -15 + bob;
    const shY = sit ? -27 : sitx ? -20 : -29 + bob;
    const HY = sit ? -37.5 : sitx ? -30.5 : -40 + bob;
    const longRobe = D.topKind === 'chapan' || D.topKind === 'dress' || D.topKind === 'coat';
    const tw = D.kid ? 10 : 11;
    const armFarDraw = () => {
      const sw = walk ? (f === 1 ? -3 : f === 3 ? 3 : 0) : 0;
      const hand = sit || sitx ? [5, hipY - 3] : [sw * 0.8 - 1, hipY + 1];
      const elbow = [sw * 0.4 - 0.5, shY + 7];
      limb(ctx, [[-0.5, shY + 1], elbow, hand], 3.6, O.shade(far.sleeve === 'short' ? D.skin : far.col, -0.2));
      ell(ctx, hand[0], hand[1], 1.9, 1.9, O.shade(far.hand, -0.2), INK, 0.8);
    };
    if (sit) {
      limb(ctx, [[0, hipY], [9, hipY], [9.5, -2.6]], 5.2, legS);
      limb(ctx, [[0, hipY + 0.5], [8.4, hipY + 0.5], [8.2, -2.4]], 5.2, legC);
      ell(ctx, 10.6, -1.5, 3.4, 1.8, D.shoes, INK);
    } else if (sitx) {
      ell(ctx, 3, -3.2, 9, 3.8, legC, INK);
      ell(ctx, 10, -2, 2.8, 1.8, D.shoes, INK);
    } else {
      const sw = walk ? [[4, -3], [0, 0], [-4, 3], [0, 0]][f] : [0, 0];
      const legTop = longRobe ? (D.topKind === 'dress' ? -4 : -8) : hipY + 1;
      const knee = walk && f % 2 === 0 ? 0 : 1;
      limb(ctx, [[0, legTop], [sw[1] * 0.6, -8 + knee], [sw[1], -2.6]], 5, legS);
      ell(ctx, sw[1] + 1.2, -1.5, 3.3, 1.8, O.shade(D.shoes, -0.1), INK);
      limb(ctx, [[0, legTop], [sw[0] * 0.6, -8], [sw[0], -2.6]], 5.2, legC);
      if (D.shorts) limb(ctx, [[sw[0] * 0.6, -8], [sw[0], -2.6]], 3.6, D.skin);
      if (D.hayato) { limb(ctx, [[sw[0] * 0.8, -6.2], [sw[0], -2.6]], 5.6, D.shoes); rrect(ctx, sw[0] * 0.6 - 0.6, -10.6, 4.2, 3.8, 1.3, '#b8bcc8', INK, 0.8); }
      ell(ctx, sw[0] + 1.2, -1.5, 3.4, 1.9, D.shoes, INK);
      if (D.hayato || D.shoes === '#f0f0f0') { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(sw[0] - 2, -0.4, 6.4, 0.9); }
    }
    armFarDraw();
    if (D.acc.includes('backpack')) rrect(ctx, -tw / 2 - 5, shY + 1, 6, 11, 2.4, D.bag, INK);
    const torso = () => {
      ctx.beginPath();
      if (D.topKind === 'dress' && !sit && !sitx) {
        ctx.moveTo(-tw / 2, shY); ctx.lineTo(tw / 2, shY); ctx.lineTo(tw / 2 + 3, -3.2); ctx.lineTo(-tw / 2 - 3, -3.2);
      } else if ((D.topKind === 'chapan' || D.topKind === 'coat') && !sit && !sitx) {
        ctx.moveTo(-tw / 2, shY); ctx.lineTo(tw / 2, shY); ctx.lineTo(tw / 2 + 1.5, -7.5); ctx.lineTo(-tw / 2 - 1.5, -7.5);
      } else if (longRobe && (sit || sitx)) {
        ctx.moveTo(-tw / 2, shY); ctx.lineTo(tw / 2, shY); ctx.lineTo(tw / 2 + 5, hipY + 2); ctx.lineTo(-tw / 2, hipY + 2);
      } else {
        ctx.moveTo(-tw / 2, shY + 0.5); ctx.quadraticCurveTo(-tw / 2, shY - 1, -tw / 2 + 2.5, shY - 1); ctx.lineTo(tw / 2 - 2.5, shY - 1); ctx.quadraticCurveTo(tw / 2, shY - 1, tw / 2, shY + 0.5);
        ctx.lineTo(tw / 2 - 0.5, hipY + 1.5); ctx.lineTo(-tw / 2 + 0.5, hipY + 1.5);
      }
      ctx.closePath();
    };
    torso();
    finish(ctx, D.pattern ? fabric(D, ctx) : D.top, INK);
    clipDo(ctx, torso, () => {
      ctx.fillStyle = 'rgba(40,20,10,0.16)'; ctx.fillRect(-tw / 2 - 4, shY - 2, 5, 40);
      if (D.topKind === 'suit') { ctx.fillStyle = '#f4f4f0'; ctx.fillRect(tw / 2 - 2.2, shY - 1, 2.2, 5); ctx.fillStyle = D.tie; ctx.fillRect(tw / 2 - 1.6, shY + 1, 1.4, 8); }
      if (D.topKind === 'chapan') { ctx.fillStyle = D.sash; ctx.fillRect(-tw, hipY - 1, tw * 2, 3.2); }
      if (D.topKind === 'overalls') { ctx.fillStyle = '#e8e2d4'; ctx.fillRect(-tw, shY - 2, tw * 2, 4); }
      if (D.topKind === 'apron') {
        ctx.fillStyle = D.armR.col; ctx.fillRect(-tw, shY - 2, tw * 2, 40);
        ctx.fillStyle = '#f8f7f2'; ctx.fillRect(tw / 2 - 3.2, shY + 2, 4, 40);
        ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(tw / 2 - 3.2, shY + 2); ctx.lineTo(tw / 2 - 3.2, 0); ctx.stroke();
        ctx.fillStyle = '#f8f7f2'; ctx.fillRect(-tw, hipY, tw * 2, 1.6);
      }
    });
    if (D.topKind === 'apron' && !sit && !sitx) {
      ctx.beginPath(); ctx.moveTo(tw / 2 - 1, shY + 2); ctx.lineTo(tw / 2 + 1.4, hipY + 1); ctx.lineTo(tw / 2 + 2.6, -7.2); ctx.lineTo(tw / 2 - 3.6, -7.2); ctx.lineTo(tw / 2 - 3.4, shY + 2); ctx.closePath();
      finish(ctx, '#f8f7f2', INK, 0.9);
    }
    if (D.acc.includes('camera')) { rrect(ctx, tw / 2 - 1, shY + 5, 3.4, 4, 0.8, '#2a2a2e', INK, 0.7); }
    const sw = walk ? (f === 1 ? 3 : f === 3 ? -3 : 0) : 0;
    const aa = pose.arm || act;
    let hand = [sw * 0.8 + 1, hipY + 1], elbow = [sw * 0.4 + 0.5, shY + 7];
    const carry = aa === 'carry' || aa === 'serve';
    if (carry) { hand = [10, shY + 7]; elbow = [4, shY + 8]; }
    if (aa === 'work') { const up = f % 2 === 0 ? -2 : 1.5; hand = [9, shY + 6 + up]; elbow = [4, shY + 8]; }
    if ((sit || sitx) && !carry && aa !== 'work') { hand = [7, hipY - 3.5]; elbow = [2.5, shY + 7.5]; }
    if (aa === 'eat') { const k = f % 2; hand = k ? [6.4, HY + 4.5] : [8, hipY - 5]; elbow = [3.4, shY + 6.5]; }
    if (aa === 'drink') { hand = [6.4, HY + 4.8]; elbow = [3.4, shY + 6.5]; }
    if (aa === 'phone') { hand = [5.2, HY + 2]; elbow = [1.5, shY + 3.5]; }
    if (aa === 'raise') { const wv = f % 2 ? 1 : -0.5; hand = [12.4 + wv, HY - 8]; elbow = [8.6, shY - 1]; }
    if (D.acc.includes('cane') && !sit && !sitx) {
      limb(ctx, [[hand[0] + 1.2, hand[1] - 1], [hand[0] + 3.4, -0.6]], 1.7, '#8a5a2a');
      ctx.beginPath(); ctx.moveTo(hand[0] + 1.2, hand[1] - 1); ctx.quadraticCurveTo(hand[0] - 0.4, hand[1] - 4.6, hand[0] - 2.4, hand[1] - 2.2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.7; ctx.stroke();
    }
    const A = near;
    const sh = [0.5, shY + 1];
    if (A.sleeve === 'short') {
      const mid = [(sh[0] + elbow[0]) / 2, (sh[1] + elbow[1]) / 2];
      limb(ctx, [sh, mid], 4.2, A.col);
      limb(ctx, [mid, elbow, hand], 3.3, D.skin);
      if (A.band) { ctx.strokeStyle = A.band; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(mid[0], mid[1] + 0.4); ctx.lineTo(mid[0] + (elbow[0] - mid[0]) * 0.35, mid[1] + (elbow[1] - mid[1]) * 0.35 + 0.4); ctx.stroke(); }
    } else {
      limb(ctx, [sh, elbow, hand], 4.1, A.col);
      if (A.trim) { ctx.strokeStyle = A.trim; ctx.lineWidth = 4.2; const t = [elbow[0] + (hand[0] - elbow[0]) * 0.72, elbow[1] + (hand[1] - elbow[1]) * 0.72]; ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] + (hand[0] - elbow[0]) * 0.12, t[1] + (hand[1] - elbow[1]) * 0.12); ctx.stroke(); }
    }
    ell(ctx, hand[0], hand[1], A.gauntlet ? 2.4 : 2, A.gauntlet ? 2.3 : 2, A.hand, INK, 0.9);
    if (aa === 'phone') { rrect(ctx, 4.6, HY - 2, 2.4, 6, 0.8, '#2a2a30', INK, 0.7); }
    if (aa === 'drink') { ell(ctx, 7, HY + 3.6, 2, 1.3, '#f4f0e6', INK, 0.7); }
    ctx.fillStyle = D.skinShade;
    ctx.fillRect(-1.8, HY + 6.5, 4, 4);
    if (D.hayato) poly(ctx, [[-3, HY + 7.6], [-2.4, HY + 10.4], [3.4, HY + 10.4], [3.8, HY + 7.6]], '#1f1f26', INK, 0.7);
    if (D.hairStyle === 'long' && D.hat !== 'kerchief') rrect(ctx, -9.4, HY - 5, 9, 17, 4, D.hairShade, INK);
    if (D.hairStyle === 'ponytail') ell(ctx, -10.5, HY + 1, 3, 5.5, D.hair, INK);
    ell(ctx, 0.5, HY, 9.3, 9.2, D.skin, INK);
    ctx.beginPath(); ctx.moveTo(9.4, HY + 0.4); ctx.lineTo(10.6, HY + 2.2); ctx.lineTo(9.2, HY + 2.8); ctx.fillStyle = D.skin; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
    const ex = pose.expr || 'ok';
    if (ex === 'angry') { ctx.globalAlpha = 0.35; ell(ctx, 3, HY + 1, 7, 7.4, '#e0302a', null); ctx.globalAlpha = 1; }
    const eyX = 5.2, eyY = HY + 0.6;
    if (ex === 'happy') { ctx.beginPath(); ctx.arc(eyX, eyY + 0.8, 1.5, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke(); }
    else if (ex === 'blink') { ctx.beginPath(); ctx.moveTo(eyX - 1.5, eyY + 0.5); ctx.quadraticCurveTo(eyX, eyY + 1.3, eyX + 1.4, eyY + 0.5); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); }
    else if (D.hayato || pose.hd) { ell(ctx, eyX, eyY, 1.5, 2.4, '#fff', null); ell(ctx, eyX + 0.3, eyY + 0.3, 1.2, 2, D.hayato ? D.eye : O.shade(D.eye, 0.25), null); ell(ctx, eyX + 0.4, eyY + 0.6, 0.6, 1.1, D.hayato ? '#3a0a24' : '#120806', null); ell(ctx, eyX, eyY - 0.8, 0.5, 0.5, '#fff', null); }
    else { ell(ctx, eyX, eyY, 1.05, 1.55, D.eye, null); ell(ctx, eyX - 0.3, eyY - 0.6, 0.35, 0.35, '#fff', null); }
    if (ex === 'angry') { ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(eyX - 2, eyY - 3.6); ctx.lineTo(eyX + 1.6, eyY - 2.4); ctx.stroke(); }
    if (D.glasses) { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(eyX + 0.4, eyY, 2.3, 0, TAU); ctx.moveTo(eyX - 1.9, eyY); ctx.lineTo(-1, eyY - 0.5); ctx.stroke(); }
    if (D.hayato) { rrect(ctx, 7.6, HY + 1.8, 2.6, 1.5, 0.5, '#f3e2c4', INK, 0.5); }
    mouth(ctx, 7.2, HY + 5.2, ex, 0.6);
    if (D.beard) {
      ctx.beginPath(); ctx.moveTo(-2, HY + 2); ctx.quadraticCurveTo(0, HY + 11, 6, HY + 11.8); ctx.quadraticCurveTo(9.8, HY + 9, 8.8, HY + 6.6); ctx.quadraticCurveTo(5, HY + 6.8, 2, HY + 3); ctx.closePath();
      finish(ctx, D.beard, INK);
      ctx.beginPath(); ctx.moveTo(5.4, HY + 3.9); ctx.quadraticCurveTo(8.6, HY + 3.6, 9.8, HY + 5.4); ctx.quadraticCurveTo(7.6, HY + 5.2, 5.4, HY + 4.9); ctx.closePath();
      finish(ctx, D.beard, INK, 0.6);
    } else if (D.mustache) { ctx.fillStyle = O.shade(D.hair, -0.1); ctx.beginPath(); ctx.ellipse(7.8, HY + 4.3, 1.9, 0.9, -0.2, 0, TAU); ctx.fill(); }
    ell(ctx, -1.2, HY + 1.2, 1.7, 2.3, D.skin, INK, 0.8);
    sideHair(ctx, D, HY);
    sideHat(ctx, D, HY);
  }

  function sideHair(ctx, D, HY) {
    const s = D.hairStyle, c = D.hair;
    if (D.hat === 'kerchief' || D.hat === 'helmet' || D.hat === 'cap' || D.hat === 'panama') return;
    if (D.hat === 'doppi' && s === 'short') {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-8.6, HY - 4); ctx.quadraticCurveTo(-9.8, HY + 3, -6, HY + 5); ctx.lineTo(-3.6, HY + 3.6); ctx.lineTo(-3, HY - 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
      return;
    }
    ctx.beginPath();
    if (s === 'hayato') {
      ctx.moveTo(-9.4, HY + 4);
      ctx.bezierCurveTo(-11.5, HY - 7, -2, HY - 12.5, 5, HY - 11);
      ctx.bezierCurveTo(10, HY - 9.5, 12.4, HY - 4, 11, HY + 1.4);
      ctx.lineTo(9.2, HY - 2.2);
      ctx.lineTo(7.4, HY + 0.2);
      ctx.lineTo(6.4, HY - 3.4);
      ctx.lineTo(3.6, HY - 1.2);
      ctx.lineTo(2, HY - 4.2);
      ctx.lineTo(-1, HY + 1);
      ctx.lineTo(-3.8, HY + 6.6);
      ctx.lineTo(-6.8, HY + 5.2);
      ctx.closePath();
      finish(ctx, c, INK);
      ctx.beginPath(); ctx.moveTo(6.8, HY - 9); ctx.quadraticCurveTo(9.8, HY - 5, 9.2, HY - 2.2); ctx.lineTo(7.4, HY + 0.2); ctx.quadraticCurveTo(8, HY - 5, 5, HY - 9.6); ctx.closePath();
      finish(ctx, D.streak, INK, 0.7);
      return;
    }
    if (s === 'curly') {
      for (let i = 0; i < 6; i++) { const a = Math.PI * 0.9 + i / 5 * Math.PI * 1.1; ctx.moveTo(Math.cos(a) * 8 + 3, HY - 2 + Math.sin(a) * 8); ctx.arc(Math.cos(a) * 8, HY - 2 + Math.sin(a) * 8, 3, 0, TAU); }
      finish(ctx, c, INK);
      return;
    }
    ctx.moveTo(-9.2, HY + 3.4);
    ctx.bezierCurveTo(-11, HY - 9, 7, HY - 13, 10, HY - 3);
    if (s === 'spiky') { ctx.lineTo(7, HY - 4); ctx.lineTo(5, HY - 1.6); ctx.lineTo(3, HY - 4.4); }
    else { ctx.quadraticCurveTo(6, HY - 5.4, 2.4, HY - 4.8); }
    ctx.lineTo(-2.2, HY + 1);
    ctx.lineTo(-4.4, HY + 5.6);
    ctx.closePath();
    finish(ctx, c, INK);
  }

  function sideHat(ctx, D, HY) {
    const h = D.hat;
    if (!h) return;
    if (h === 'toque') {
      const top = HY - 9;
      ctx.beginPath();
      ctx.moveTo(-7.8, top + 3);
      ctx.bezierCurveTo(-12, top - 3, -8, top - 13, -2, top - 11);
      ctx.bezierCurveTo(0, top - 16, 8, top - 15, 8, top - 9);
      ctx.bezierCurveTo(13, top - 8, 12.6, top, 9, top + 3);
      ctx.closePath();
      finish(ctx, '#fbfbf6', INK);
      ctx.strokeStyle = '#c6ccd8'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(1, top + 2); ctx.quadraticCurveTo(0, top - 5, 2.5, top - 11); ctx.stroke();
      rrect(ctx, -8.4, top + 1, 17.6, 5.4, 1.4, '#f4f5f1', INK);
      ctx.fillStyle = '#2d56c8'; ctx.fillRect(-7.7, top + 4.2, 16.2, 1.1);
      return;
    }
    if (h === 'doppi') {
      poly(ctx, [[-8.2, HY - 4.6], [-7, HY - 10.4], [7.4, HY - 10.4], [8.8, HY - 4.6]], '#16161a', INK);
      clipDo(ctx, () => { ctx.beginPath(); ctx.moveTo(-8.2, HY - 4.6); ctx.lineTo(-7, HY - 10.4); ctx.lineTo(7.4, HY - 10.4); ctx.lineTo(8.8, HY - 4.6); ctx.closePath(); }, () => O.chust(ctx, -8.2, HY - 10.4, 17, 5.8, 1));
      return;
    }
    if (h === 'kerchief') {
      ctx.beginPath();
      ctx.moveTo(-9.8, HY + 5);
      ctx.bezierCurveTo(-12, HY - 10, 8, HY - 14, 10.2, HY - 1);
      ctx.quadraticCurveTo(6, HY - 5, 3, HY - 4.4);
      ctx.quadraticCurveTo(-2, HY - 2, -3, HY + 6);
      ctx.closePath();
      finish(ctx, D.hatCol, INK);
      poly(ctx, [[-9, HY + 3], [-12.5, HY + 11], [-6, HY + 7]], D.hatCol, INK);
      return;
    }
    if (h === 'helmet') { ctx.beginPath(); ctx.ellipse(0.5, HY - 4.5, 10, 8, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK); rrect(ctx, -10, HY - 5, 23, 2.6, 1.2, O.shade(D.hatCol, -0.12), INK); return; }
    if (h === 'cap') { ctx.beginPath(); ctx.ellipse(0.5, HY - 4, 9.4, 7.5, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK); poly(ctx, [[7, HY - 5], [14, HY - 3.6], [14, HY - 2.4], [7, HY - 3]], O.shade(D.hatCol, -0.2), INK); return; }
    if (h === 'panama') { ell(ctx, 0.5, HY - 5, 14, 3.4, D.hatCol, INK); ctx.beginPath(); ctx.ellipse(0.5, HY - 7, 8.4, 6.4, 0, Math.PI, TAU); ctx.closePath(); finish(ctx, D.hatCol, INK); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-7.9, HY - 8, 16.8, 1.8); return; }
    if (h === 'beret') { ell(ctx, 0, HY - 8, 10.5, 4.4, D.hatCol, INK); ell(ctx, 0, HY - 12, 1, 1.4, D.hatCol, INK); }
  }

  function paint(ctx, D, pose) {
    const flip = pose.dir === 'left';
    if (pose.dir === 'down') drawFront(ctx, D, pose, false);
    else if (pose.dir === 'up') drawFront(ctx, D, pose, true);
    else {
      const Dm = D.hayato ? Object.assign({}, D, flip ? { armN: D.armL, armF: D.armR } : { armN: D.armR, armF: D.armL }) : D;
      if (flip) ctx.scale(-1, 1);
      drawSide(ctx, Dm, pose);
    }
  }

  function charSprite(D, pose) {
    const dir = pose.dir === 'left' ? 'right' : pose.dir;
    const flip = pose.dir === 'left';
    const sc = pose.s || 1;
    const key = D.key + '|' + dir + '|' + (flip ? 'L' : 'R') + '|' + pose.act + '|' + (pose.arm || '') + '|' + (pose.frame | 0) + '|' + (pose.expr || 'ok') + '|' + sc;
    const s = cached(key, () => mk(48 * sc, 76 * sc, 24 * sc, 70 * sc, ctx => {
      ctx.scale(D.scale * sc, D.scale * sc);
      paint(ctx, D, pose);
    }));
    return { s, flip: false };
  }

  function drawChar(ctx, D, pose, x, y) {
    const { s } = charSprite(D, pose);
    blit(ctx, s, x, y);
  }

  function drawCharHD(ctx, D, pose, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(D.scale * s, D.scale * s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    paint(ctx, D, Object.assign({}, pose, { hd: true }));
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, ry, a) {
    ctx.fillStyle = 'rgba(40,20,5,' + (a || 0.22) + ')';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  }

  function heart(ctx, x, y, r, fill, frac) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.9);
      ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
      ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = '#5a2a2a'; ctx.fill();
    if (frac > 0) {
      ctx.save();
      path(); ctx.clip();
      ctx.fillStyle = fill;
      ctx.fillRect(x - r * 1.7, y - r * 1.4, r * 3.4 * frac, r * 2.6);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.5, y - r * 0.4, r * 0.35, r * 0.22, -0.6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    path();
    ctx.strokeStyle = '#2a1010'; ctx.lineWidth = 0.9; ctx.stroke();
  }

  function coin(ctx, x, y, r) {
    ell(ctx, x, y, r, r, '#f2c230', '#8a5a10', 0.9);
    ell(ctx, x, y, r * 0.62, r * 0.62, null, '#c8901a', 0.7);
    ctx.fillStyle = '#fff4b0'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, TAU); ctx.fill();
  }

  function star(ctx, x, y, r, fill, line) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    finish(ctx, fill, line || '#6a3a08', 1);
  }

  P.Art = { K, INK, TAU, mk, blit, cached, ell, rrect, poly, limb, finish, clipDo, lookFor, HAYATO, charSprite, drawChar, drawCharHD, shadow, heart, coin, star };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
