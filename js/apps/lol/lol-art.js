(function (L) {
  'use strict';
  const D = L.DATA, SK = L.SKINS, M = L.Models;
  const { shade, rgba, mk, star, crisp, TAU, PI, clamp } = M;
  const SPRITE_PX = 1.42;

  function lookOf(id) {
    const s = SK.get(id) || SK.get(SK.baseId(String(id).split('.')[0]));
    const base = SK.SKINS[s.cid][0];
    return { id: s.id, cid: s.cid, def: s.def, P: Object.assign({}, base.pal, s.def.pal), parts: Object.assign({}, s.def.parts), fx: Object.assign({ proj: null, aura: null }, s.def.fx), scene: s.def.scene, champ: D.CHAMPS[s.cid] };
  }

  function bbox(cv) {
    const w = cv.width, h = cv.height, p = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? { x0: 0, y0: 0, x1: 0, y1: 0 } : { x0, y0, x1, y1 };
  }
  function flipCv(cv) { const o = mk(cv.width, cv.height), c = o.getContext('2d'); c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(cv, 0, 0); return o; }

  function render(look, pose, px, opt) {
    opt = opt || {};
    const sc = look.champ.scale * px, W = Math.ceil(78 * sc), H = Math.ceil(84 * sc);
    const cv = mk(W, H), ctx = cv.getContext('2d'), ox = W / 2, oy = H - Math.ceil(5 * sc);
    ctx.translate(ox, oy); ctx.scale(sc, sc);
    const k = M.kit(ctx, px * look.champ.scale);
    M.C[look.cid](k, look.P, pose, look.parts);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    crisp(cv, opt.outline);
    M.paintGlows(ctx, k.glows);
    const b = bbox(cv), pad = 2;
    const tw = b.x1 - b.x0 + 1 + pad * 2, th = b.y1 - b.y0 + 1 + pad * 2;
    const out = mk(tw, th); out.getContext('2d').drawImage(cv, b.x0 - pad, b.y0 - pad, tw, th, 0, 0, tw, th);
    const hd = k.anchor.head || [0, -30, 5];
    return { cv: out, ox: ox - (b.x0 - pad), oy: oy - (b.y0 - pad), head: [ox - (b.x0 - pad) + hd[0] * sc, oy - (b.y0 - pad) + hd[1] * sc, hd[2] * sc] };
  }
  function both(f) { const fl = flipCv(f.cv); return [{ cv: f.cv, ox: f.ox, oy: f.oy }, { cv: fl, ox: f.cv.width - f.ox, oy: f.oy }]; }

  const FRAMES = {
    idle: [0, 1, 2, 3].map(f => ({ kind: 'idle', f, breath: Math.sin(f / 4 * TAU) })),
    walk: [0, 1, 2, 3, 4, 5].map(f => ({ kind: 'walk', f, walk: f / 6 })),
    atk: [0, 1, 2].map(f => ({ kind: 'atk', f })),
    cast: [0, 1].map(f => ({ kind: 'cast', f }))
  };
  function spriteSet(id, variant) {
    const look = lookOf(id), set = {};
    for (const name in FRAMES) set[name] = FRAMES[name].map(p => both(render(look, Object.assign({}, p, variant), SPRITE_PX)));
    set.top = set.idle[0][0].oy;
    return set;
  }
  function petSprites(id) {
    const look = lookOf(id), out = { tibbers: null, pix: null };
    if (look.cid === 'annie') {
      const kind = look.parts.bear || 'bear', frames = [];
      for (let f = 0; f < 4; f++) {
        const cv = mk(96, 96), ctx = cv.getContext('2d'); ctx.translate(48, 88); ctx.scale(1.08, 1.08);
        const k = M.kit(ctx, 1.08); M.tibbers(k, look.P, kind, f); ctx.setTransform(1, 0, 0, 1, 0, 0); crisp(cv); M.paintGlows(ctx, k.glows);
        frames.push(both({ cv, ox: 48, oy: 88 }));
      }
      out.tibbers = { frames };
    }
    if (look.cid === 'lulu') {
      const kind = look.parts.pix || 'classic';
      out.pix = [0, 1].map(f => { const cv = mk(24, 20), ctx = cv.getContext('2d'); ctx.translate(12, 10); ctx.scale(1.3, 1.3); const k = M.kit(ctx, 1.3); M.pix(k, kind, f); ctx.setTransform(1, 0, 0, 1, 0, 0); crisp(cv); M.paintGlows(ctx, k.glows); return cv; });
    }
    return out;
  }

  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  const SCENES = {
    rift: { sky: ['#0e2a3a', '#2a5a4a', '#8ab870'], light: '#fff0b0', far: 'hills', farCol: '#1e4a3a', near: 'trees', nearCol: '#12301e', ground: '#3a5a2a', fx: 'motes', fxCol: '#e8ffb0' },
    candy: { sky: ['#ffb0d8', '#ffd8ec', '#fff4e0'], light: '#ffffff', far: 'candyhills', farCol: '#ff9ac8', near: 'lollipops', nearCol: '#ff6fa8', ground: '#fff0f6', fx: 'confetti', fxCol: '#ffffff' },
    swamp: { sky: ['#0a0e14', '#1e3024', '#3a5a3a'], light: '#7aff70', far: 'deadtrees', farCol: '#1a2a1e', near: 'deadtrees', nearCol: '#0e1610', ground: '#1e2a1a', fx: 'fireflies', fxCol: '#9aff70' },
    snow: { sky: ['#0e1a3a', '#3a5a9a', '#b8d8f8'], light: '#e8f6ff', far: 'mountains', farCol: '#8aa8d8', near: 'pines', nearCol: '#1e3a5a', ground: '#e8f4ff', fx: 'snow', fxCol: '#ffffff' },
    city: { sky: ['#140a24', '#3a1e4a', '#8a4a6a'], light: '#ffd080', far: 'skyline', farCol: '#1e1428', near: 'streetlamps', nearCol: '#0e0a14', ground: '#1e1a24', fx: 'rain', fxCol: '#c8b8e8' },
    lanterns: { sky: ['#1a0610', '#5a1020', '#c8402a'], light: '#ffd060', far: 'pagodas', farCol: '#2a0a10', near: 'lanterns', nearCol: '#ff4a30', ground: '#3a1010', fx: 'fireworks', fxCol: '#ffd060' },
    stars: { sky: ['#140a3a', '#4a2a8a', '#e080d0'], light: '#ffe8ff', far: 'moon', farCol: '#ffd8f8', near: 'clouds', nearCol: '#6a4aa8', ground: '#3a2a6a', fx: 'stars', fxCol: '#fff4a0' },
    dusk: { sky: ['#1a0808', '#6a1a14', '#e0602a'], light: '#ffb060', far: 'hills', farCol: '#3a1010', near: 'banners', nearCol: '#1e0808', ground: '#2a1010', fx: 'embers', fxCol: '#ff8040' },
    jungle: { sky: ['#0e1a10', '#2a4a24', '#8aa860'], light: '#fff0a0', far: 'jungle', farCol: '#1e3a1a', near: 'ferns', nearCol: '#0e2410', ground: '#2a3a1a', fx: 'smoke', fxCol: '#d8d8c0' },
    castle: { sky: ['#06040e', '#1e1030', '#4a2a5a'], light: '#c080ff', far: 'castle', farCol: '#120a1c', near: 'graves', nearCol: '#0a0610', ground: '#140e1c', fx: 'embers', fxCol: '#b070ff' },
    graveyard: { sky: ['#080a14', '#1e2440', '#5a6a8a'], light: '#d8e8ff', far: 'moonhill', farCol: '#141a2a', near: 'graves', nearCol: '#0a0e18', ground: '#1a1e2a', fx: 'fireflies', fxCol: '#c0ff90' },
    woods: { sky: ['#1a1024', '#4a3050', '#e08a5a'], light: '#ffc080', far: 'pines', farCol: '#2a1e2a', near: 'trees', nearCol: '#140c14', ground: '#2a2018', fx: 'leaves', fxCol: '#e08a3a' },
    ice: { sky: ['#06142a', '#1e4a7a', '#8ad0f0'], light: '#c8f4ff', far: 'crystals', farCol: '#3a7ab0', near: 'crystals', nearCol: '#1e4a7a', ground: '#bfe4f8', fx: 'snow', fxCol: '#e8faff' },
    forest: { sky: ['#1a3a1a', '#4a7a3a', '#e8e0a0'], light: '#fff8c0', far: 'trees', farCol: '#2a5a2a', near: 'trees', nearCol: '#12301a', ground: '#3a5a24', fx: 'motes', fxCol: '#fff8c0' },
    throne: { sky: ['#140a1e', '#3a1e4a', '#8a5a3a'], light: '#ffe090', far: 'pillars', farCol: '#2a1a30', near: 'banners', nearCol: '#4a1a6a', ground: '#2a1e2a', fx: 'sparkle', fxCol: '#ffe8a0' },
    dojo: { sky: ['#0a0406', '#3a0a10', '#a02020'], light: '#ff6040', far: 'moon', farCol: '#ffb0a0', near: 'rooftops', nearCol: '#0a0608', ground: '#1a0a0c', fx: 'petals', fxCol: '#ff8090' },
    ruins: { sky: ['#1a0e06', '#5a3a1a', '#d08a3a'], light: '#ffb040', far: 'temple', farCol: '#3a2a14', near: 'ferns', nearCol: '#1a2410', ground: '#3a2a14', fx: 'embers', fxCol: '#ffa040' },
    neon: { sky: ['#04040c', '#140a2a', '#3a0a3a'], light: '#ff3a5a', far: 'neonCity', farCol: '#0e0a1c', near: 'grid', nearCol: '#ff2a50', ground: '#0a0612', fx: 'sparks', fxCol: '#ff5a7a' },
    meadow: { sky: ['#3a8ad8', '#8ac8f0', '#e8f8e0'], light: '#fffae0', far: 'rainbow', farCol: '#5aa84a', near: 'clover', nearCol: '#3a8a2a', ground: '#5aa83a', fx: 'motes', fxCol: '#ffe860' },
    factory: { sky: ['#0e0e14', '#2a2a34', '#8a5a3a'], light: '#ffa050', far: 'stacks', farCol: '#1a1a22', near: 'gears', nearCol: '#2a2a32', ground: '#1e1e24', fx: 'sparks', fxCol: '#ffc060' },
    space: { sky: ['#020208', '#0a0a24', '#1e1450'], light: '#a0e0ff', far: 'planet', farCol: '#e08a3a', near: 'none', nearCol: '#000000', ground: '#3a3a4a', fx: 'stars', fxCol: '#ffffff' },
    parade: { sky: ['#0a1440', '#2a3a8a', '#e8a0a0'], light: '#fff0d0', far: 'flags', farCol: '#c8202a', near: 'bunting', nearCol: '#f4f0e8', ground: '#3a3050', fx: 'fireworks', fxCol: '#ffffff' },
    sea: { sky: ['#0a1a2a', '#2a5a7a', '#e8c890'], light: '#ffe0a0', far: 'waves', farCol: '#1e4a6a', near: 'ship', nearCol: '#3a2418', ground: '#5a3a24', fx: 'spray', fxCol: '#e8f8ff' },
    storm: { sky: ['#06060a', '#1a1a2a', '#3a3a4a'], light: '#c0c8ff', far: 'mountains', farCol: '#14141e', near: 'rocks', nearCol: '#0a0a0e', ground: '#1a1a20', fx: 'rain', fxCol: '#a0a8c8' },
    arena: { sky: ['#3a8ad8', '#8ac0f0', '#f8e8c0'], light: '#fff4d0', far: 'stands', farCol: '#c84a2a', near: 'none', nearCol: '#000000', ground: '#d8b070', fx: 'petals', fxCol: '#e02030' },
    volcano: { sky: ['#0a0202', '#3a0a04', '#c8401a'], light: '#ff8030', far: 'volcano', farCol: '#1a0804', near: 'rocks', nearCol: '#0a0404', ground: '#1a0a06', fx: 'embers', fxCol: '#ffb040' }
  };

  function paintScene(ctx, w, h, sc, seed) {
    const R = rng(seed), g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sc.sky[0]); g.addColorStop(0.55, sc.sky[1]); g.addColorStop(1, sc.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const gl = ctx.createRadialGradient(w * 0.62, h * 0.38, 0, w * 0.62, h * 0.38, Math.max(w, h) * 0.7);
    gl.addColorStop(0, rgba(sc.light, 0.38)); gl.addColorStop(1, rgba(sc.light, 0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
    const hz = h * 0.72, u = Math.min(w, h) / 100;
    layer(ctx, sc.far, w, h, hz - 4 * u, u, sc.farCol, R, sc, 0);
    ctx.fillStyle = sc.ground; ctx.fillRect(0, hz + 6 * u, w, h - hz);
    const gg = ctx.createLinearGradient(0, hz, 0, h); gg.addColorStop(0, rgba(sc.ground, 0)); gg.addColorStop(0.2, rgba(shade(sc.ground, 0.9), 1)); gg.addColorStop(1, shade(sc.ground, 0.5));
    ctx.fillStyle = gg; ctx.fillRect(0, hz, w, h - hz);
    layer(ctx, sc.near, w, h, hz + 8 * u, u * 1.5, sc.nearCol, R, sc, 1);
  }
  function tri(ctx, x0, y0, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill(); }
  function layer(ctx, kind, w, h, y, u, col, R, sc, near) {
    ctx.fillStyle = col; ctx.strokeStyle = col;
    const n = Math.ceil(w / (u * 14)) + 2;
    switch (kind) {
      case 'hills': case 'moonhill': case 'candyhills': {
        if (kind === 'moonhill') { ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.22, 9 * u, 0, TAU); ctx.fill(); ctx.fillStyle = col; }
        ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += u * 2) ctx.lineTo(x, y - Math.sin(x / (u * 22) + R() * 0.2) * 7 * u - Math.sin(x / (u * 9)) * 2 * u); ctx.lineTo(w, h); ctx.fill();
        if (kind === 'candyhills') for (let i = 0; i < 6; i++) { const x = R() * w, r = (4 + R() * 4) * u; ctx.fillStyle = ['#ffffff', '#ffd0e8', '#b0f0e0'][i % 3]; ctx.beginPath(); ctx.arc(x, y - 4 * u, r, PI, 0); ctx.fill(); }
        break;
      }
      case 'mountains': case 'volcano': {
        for (let i = 0; i < 6; i++) {
          const x = (i / 5) * w + (R() - 0.5) * 12 * u, hh = (18 + R() * 20) * u, ww = (18 + R() * 12) * u;
          ctx.fillStyle = shade(col, 0.8 + R() * 0.3); tri(ctx, x - ww, y + 6 * u, x, y - hh, x + ww, y + 6 * u);
          if (kind === 'mountains') { ctx.fillStyle = '#f4faff'; tri(ctx, x - ww * 0.28, y - hh * 0.72, x, y - hh, x + ww * 0.28, y - hh * 0.72); }
        }
        if (kind === 'volcano') { const x = w * 0.72; ctx.fillStyle = shade(col, 1.2); tri(ctx, x - 40 * u, y + 6 * u, x - 6 * u, y - 36 * u, x + 36 * u, y + 6 * u); const lg = ctx.createRadialGradient(x - 4 * u, y - 36 * u, 0, x - 4 * u, y - 36 * u, 26 * u); lg.addColorStop(0, 'rgba(255,160,40,0.9)'); lg.addColorStop(1, 'rgba(255,60,10,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x - 4 * u, y - 36 * u, 26 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ff7020'; ctx.lineWidth = u * 1.2; ctx.beginPath(); ctx.moveTo(x - 6 * u, y - 34 * u); ctx.quadraticCurveTo(x - 12 * u, y - 14 * u, x - 20 * u, y + 4 * u); ctx.stroke(); }
        break;
      }
      case 'trees': case 'pines': case 'jungle': {
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * w + (R() - 0.5) * 10 * u, s = (near ? 1.4 : 1) * (0.8 + R() * 0.6), c = shade(col, 0.85 + R() * 0.3);
          ctx.fillStyle = c;
          if (kind === 'pines') { for (let j = 0; j < 3; j++) tri(ctx, x - (9 - j * 2) * u * s, y - j * 7 * u * s, x, y - (14 + j * 7) * u * s, x + (9 - j * 2) * u * s, y - j * 7 * u * s); ctx.fillRect(x - u * s, y, 2 * u * s, 4 * u * s); if (sc.fx === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; tri(ctx, x - 3 * u * s, y - 25 * u * s, x, y - 28 * u * s, x + 3 * u * s, y - 25 * u * s); } }
          else { ctx.fillRect(x - u * s, y - 8 * u * s, 2 * u * s, 12 * u * s); for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(x + (j - 1) * 5 * u * s, y - (14 + (j % 2) * 4) * u * s, (7 + R() * 3) * u * s, 0, TAU); ctx.fill(); } if (kind === 'jungle') { ctx.strokeStyle = shade(c, 0.8); ctx.lineWidth = u * 0.8; ctx.beginPath(); ctx.moveTo(x, y - 20 * u * s); ctx.quadraticCurveTo(x + 6 * u, y - 6 * u, x + 3 * u, y + 2 * u); ctx.stroke(); } }
        }
        break;
      }
      case 'deadtrees': {
        ctx.lineCap = 'round';
        for (let i = 0; i < Math.ceil(n / 2); i++) { const x = R() * w, s = (near ? 1.6 : 1) * (0.8 + R() * 0.6); ctx.lineWidth = 2.4 * u * s; ctx.beginPath(); ctx.moveTo(x, y + 6 * u); ctx.lineTo(x + 2 * u * s, y - 22 * u * s); ctx.stroke(); ctx.lineWidth = 1.2 * u * s; for (let j = 0; j < 4; j++) { const yy = y - (8 + j * 4) * u * s; ctx.beginPath(); ctx.moveTo(x + u * s, yy); ctx.lineTo(x + (j % 2 ? 8 : -8) * u * s, yy - 6 * u * s); ctx.stroke(); } }
        break;
      }
      case 'skyline': case 'neonCity': {
        for (let x = 0; x < w;) { const bw = (8 + R() * 12) * u, bh = (14 + R() * 34) * u; ctx.fillStyle = shade(col, 0.9 + R() * 0.3); ctx.fillRect(x, y - bh, bw, bh + 10 * u); ctx.fillStyle = kind === 'neonCity' ? (R() < 0.5 ? 'rgba(255,60,100,0.8)' : 'rgba(80,220,255,0.8)') : 'rgba(255,220,140,0.75)'; for (let wy = y - bh + 3 * u; wy < y; wy += 4 * u) for (let wx = x + 2 * u; wx < x + bw - 2 * u; wx += 3.4 * u) if (R() < 0.4) ctx.fillRect(wx, wy, 1.4 * u, 1.8 * u); x += bw + R() * 2 * u; }
        break;
      }
      case 'pagodas': case 'rooftops': case 'temple': {
        for (let i = 0; i < 4; i++) { const x = (i + 0.3 + R() * 0.4) / 4 * w, s = (kind === 'rooftops' ? 1.3 : 1) * (0.8 + R() * 0.5); ctx.fillStyle = shade(col, 0.9 + R() * 0.2); for (let j = 0; j < (kind === 'temple' ? 4 : 3); j++) { const ww = (16 - j * 4) * u * s, yy = y - j * 8 * u * s; if (kind === 'temple') ctx.fillRect(x - ww, yy - 8 * u * s, ww * 2, 8 * u * s); else { ctx.beginPath(); ctx.moveTo(x - ww - 3 * u * s, yy - 6 * u * s); ctx.quadraticCurveTo(x, yy - 12 * u * s, x + ww + 3 * u * s, yy - 6 * u * s); ctx.lineTo(x + ww * 0.7, yy); ctx.lineTo(x - ww * 0.7, yy); ctx.fill(); } } }
        break;
      }
      case 'lanterns': {
        for (let i = 0; i < 7; i++) { const x = (i + 0.5) / 7 * w, yy = h * (0.12 + R() * 0.3); ctx.strokeStyle = 'rgba(40,10,10,0.7)'; ctx.lineWidth = u * 0.4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, yy); ctx.stroke(); const lg = ctx.createRadialGradient(x, yy + 4 * u, 0, x, yy + 4 * u, 12 * u); lg.addColorStop(0, 'rgba(255,200,80,0.6)'); lg.addColorStop(1, 'rgba(255,80,40,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, yy + 4 * u, 12 * u, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, yy + 4 * u, 3.4 * u, 4.4 * u, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 2 * u, yy - 0.4 * u, 4 * u, u); ctx.fillRect(x - 2 * u, yy + 8 * u, 4 * u, u); }
        break;
      }
      case 'moon': { const mx = w * 0.72, my = h * 0.26, r = 16 * u; const mg = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 2.6); mg.addColorStop(0, rgba(col, 0.5)); mg.addColorStop(1, rgba(col, 0)); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, r * 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill(); ctx.fillStyle = rgba(shade(col, 0.85), 0.8); ctx.beginPath(); ctx.arc(mx - r * 0.3, my + r * 0.2, r * 0.2, 0, TAU); ctx.arc(mx + r * 0.35, my - r * 0.3, r * 0.14, 0, TAU); ctx.fill(); break; }
      case 'clouds': { for (let i = 0; i < 6; i++) { const x = R() * w, yy = y - R() * 10 * u, s = 1 + R(); ctx.fillStyle = rgba(col, 0.85); for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(x + j * 6 * u * s, yy - (j % 2) * 3 * u * s, 6 * u * s, 0, TAU); ctx.fill(); } } break; }
      case 'banners': { for (let i = 0; i < 5; i++) { const x = (i + 0.5) / 5 * w; ctx.fillStyle = shade(col, 0.9 + R() * 0.2); ctx.fillRect(x - 0.6 * u, y - 60 * u, 1.2 * u, 66 * u); ctx.beginPath(); ctx.moveTo(x, y - 58 * u); ctx.lineTo(x + 12 * u, y - 58 * u); ctx.lineTo(x + 12 * u, y - 30 * u); ctx.lineTo(x + 6 * u, y - 34 * u); ctx.lineTo(x, y - 30 * u); ctx.fill(); } break; }
      case 'castle': { ctx.fillRect(w * 0.45, y - 30 * u, w * 0.5, 36 * u); for (let i = 0; i < 5; i++) { const x = w * (0.45 + i * 0.12), hh = (30 + R() * 30) * u; ctx.fillRect(x, y - hh, 7 * u, hh); tri(ctx, x - 2 * u, y - hh, x + 3.5 * u, y - hh - 12 * u, x + 9 * u, y - hh); ctx.fillStyle = 'rgba(255,200,120,0.6)'; ctx.fillRect(x + 2.6 * u, y - hh + 8 * u, 1.6 * u, 3 * u); ctx.fillStyle = col; } break; }
      case 'graves': { for (let i = 0; i < 7; i++) { const x = R() * w, s = 0.8 + R() * 0.6; ctx.fillStyle = shade(col, 1 + R() * 0.6); ctx.beginPath(); ctx.moveTo(x - 4 * u * s, y + 4 * u); ctx.lineTo(x - 4 * u * s, y - 6 * u * s); ctx.arc(x, y - 6 * u * s, 4 * u * s, PI, 0); ctx.lineTo(x + 4 * u * s, y + 4 * u); ctx.fill(); } break; }
      case 'crystals': { for (let i = 0; i < n; i++) { const x = R() * w, hh = (10 + R() * (near ? 26 : 20)) * u, ww = (2 + R() * 3) * u; ctx.fillStyle = rgba(shade(col, 0.9 + R() * 0.5), near ? 0.95 : 0.8); ctx.beginPath(); ctx.moveTo(x - ww, y + 4 * u); ctx.lineTo(x - ww * 0.7, y - hh * 0.8); ctx.lineTo(x, y - hh); ctx.lineTo(x + ww * 0.8, y - hh * 0.75); ctx.lineTo(x + ww, y + 4 * u); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - ww * 0.5, y - hh * 0.7, ww * 0.35, hh * 0.6); } break; }
      case 'pillars': { for (let i = 0; i < 5; i++) { const x = (i + 0.5) / 5 * w; ctx.fillStyle = shade(col, 1.3); ctx.fillRect(x - 5 * u, y - 70 * u, 10 * u, 76 * u); ctx.fillStyle = shade(col, 1.6); ctx.fillRect(x - 6.5 * u, y - 72 * u, 13 * u, 3 * u); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 1.6 * u, y - 70 * u, 3.4 * u, 76 * u); } break; }
      case 'rainbow': { const cols = ['#ff4a4a', '#ffa030', '#ffe040', '#50d050', '#40a0ff', '#8a5ae0']; ctx.lineWidth = 2.6 * u; cols.forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.55); ctx.beginPath(); ctx.arc(w * 0.3, y + 10 * u, (46 - i * 2.6) * u, PI, TAU); ctx.stroke(); }); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += u * 2) ctx.lineTo(x, y - Math.sin(x / (u * 30)) * 6 * u); ctx.lineTo(w, h); ctx.fill(); break; }
      case 'clover': case 'ferns': { for (let i = 0; i < n * 2; i++) { const x = R() * w, s = 0.8 + R() * 0.8; ctx.fillStyle = shade(col, 0.8 + R() * 0.5); if (kind === 'clover') for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(x + Math.cos(j * 2.1) * 2 * u * s, y - 2 * u + Math.sin(j * 2.1) * 2 * u * s, 2 * u * s, 0, TAU); ctx.fill(); } else { for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.ellipse(x + j * 2.4 * u * s, y - 5 * u * s, 1.4 * u * s, 6 * u * s, j * 0.35, 0, TAU); ctx.fill(); } } } break; }
      case 'stacks': { for (let i = 0; i < 5; i++) { const x = (i + 0.3 + R() * 0.4) / 5 * w, hh = (26 + R() * 30) * u; ctx.fillStyle = shade(col, 1 + R() * 0.4); ctx.fillRect(x - 3 * u, y - hh, 6 * u, hh + 8 * u); ctx.fillStyle = 'rgba(160,150,150,0.35)'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(x + j * 4 * u, y - hh - j * 5 * u, (3 + j) * u, 0, TAU); ctx.fill(); } } break; }
      case 'gears': { for (let i = 0; i < 4; i++) { const x = R() * w, r = (6 + R() * 8) * u; ctx.fillStyle = shade(col, 1 + R() * 0.4); ctx.beginPath(); for (let j = 0; j < 20; j++) { const a = j / 20 * TAU, rr = j % 2 ? r : r * 1.2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill(); ctx.fillStyle = shade(col, 0.6); ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, TAU); ctx.fill(); } break; }
      case 'planet': { const px = w * 0.76, py = h * 0.3, r = 18 * u; const pg = ctx.createRadialGradient(px - r * 0.4, py - r * 0.4, 0, px, py, r); pg.addColorStop(0, shade(col, 1.4)); pg.addColorStop(1, shade(col, 0.5)); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#f0d8a0', 0.8); ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.ellipse(px, py, r * 1.7, r * 0.4, -0.3, 0, TAU); ctx.stroke(); ctx.fillStyle = '#7a7a8a'; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += u * 3) ctx.lineTo(x, y + 6 * u - Math.abs(Math.sin(x / (u * 11))) * 4 * u); ctx.lineTo(w, h); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillStyle = '#5a5a6a'; ctx.beginPath(); ctx.ellipse(R() * w, y + (9 + R() * 12) * u, (3 + R() * 4) * u, (1 + R()) * u, 0, 0, TAU); ctx.fill(); } break; }
      case 'flags': { for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * w, yy = y - (20 + R() * 16) * u; ctx.fillStyle = '#d8d0c0'; ctx.fillRect(x - 0.5 * u, yy, u, 28 * u); for (let j = 0; j < 5; j++) { ctx.fillStyle = j % 2 ? '#f4f0e8' : col; ctx.fillRect(x + 0.5 * u, yy + j * 2 * u, 14 * u, 2 * u); } ctx.fillStyle = '#2a3a8a'; ctx.fillRect(x + 0.5 * u, yy, 6 * u, 6 * u); } break; }
      case 'bunting': { for (let r = 0; r < 2; r++) { const yy = h * (0.08 + r * 0.14); ctx.strokeStyle = 'rgba(40,30,30,0.6)'; ctx.lineWidth = u * 0.4; ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(w / 2, yy + 10 * u, w, yy); ctx.stroke(); for (let i = 0; i < 14; i++) { const x = (i + 0.5) / 14 * w, t = x / w, by = yy + Math.sin(t * PI) * 5 * u; ctx.fillStyle = ['#c8202a', '#f4f0e8', '#2a3a8a'][i % 3]; tri(ctx, x - 2.4 * u, by, x + 2.4 * u, by, x, by + 5 * u); } } break; }
      case 'waves': { for (let r = 0; r < 4; r++) { ctx.fillStyle = shade(col, 0.8 + r * 0.15); ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += u * 2) ctx.lineTo(x, y + r * 4 * u - Math.sin(x / (u * 7) + r * 1.3) * 1.6 * u); ctx.lineTo(w, h); ctx.fill(); } break; }
      case 'ship': { ctx.fillStyle = col; ctx.fillRect(0, y - 2 * u, w, 4 * u); ctx.fillRect(w * 0.08, y - 60 * u, 2.4 * u, 60 * u); ctx.fillStyle = 'rgba(240,230,210,0.85)'; ctx.beginPath(); ctx.moveTo(w * 0.1, y - 56 * u); ctx.quadraticCurveTo(w * 0.1 + 22 * u, y - 44 * u, w * 0.1, y - 30 * u); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,0.8)'; ctx.lineWidth = 0.5 * u; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(w * 0.09, y - 58 * u); ctx.lineTo(w * 0.2 + i * 6 * u, y - 2 * u); ctx.stroke(); } break; }
      case 'rocks': { for (let i = 0; i < n; i++) { const x = R() * w, s = 0.8 + R(); ctx.fillStyle = shade(col, 1 + R() * 0.8); ctx.beginPath(); ctx.moveTo(x - 6 * u * s, y + 4 * u); ctx.lineTo(x - 4 * u * s, y - 4 * u * s); ctx.lineTo(x + 2 * u * s, y - 6 * u * s); ctx.lineTo(x + 6 * u * s, y + 4 * u); ctx.fill(); } break; }
      case 'stands': { for (let r = 0; r < 5; r++) { ctx.fillStyle = shade(col, 0.7 + r * 0.08); ctx.fillRect(0, y - (26 - r * 5) * u, w, 5 * u); for (let x = 0; x < w; x += 2.4 * u) { ctx.fillStyle = ['#2a2a3a', '#e8c8a0', '#c83a2a', '#f4f0e8'][Math.floor(R() * 4)]; ctx.beginPath(); ctx.arc(x + R() * u, y - (27 - r * 5) * u, 0.9 * u, 0, TAU); ctx.fill(); } } ctx.fillStyle = '#f4f0e8'; ctx.fillRect(0, y - 2 * u, w, 3 * u); ctx.fillStyle = '#c8202a'; ctx.fillRect(0, y + u, w, 1.4 * u); break; }
      case 'streetlamps': { for (let i = 0; i < 3; i++) { const x = (i + 0.2) / 3 * w; ctx.fillStyle = col; ctx.fillRect(x - 0.8 * u, y - 40 * u, 1.6 * u, 46 * u); ctx.fillRect(x - 3 * u, y - 42 * u, 6 * u, 3 * u); const lg = ctx.createRadialGradient(x, y - 38 * u, 0, x, y - 38 * u, 16 * u); lg.addColorStop(0, 'rgba(255,220,140,0.7)'); lg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, y - 38 * u, 16 * u, 0, TAU); ctx.fill(); } break; }
      case 'lollipops': { for (let i = 0; i < 5; i++) { const x = (i + 0.3 + R() * 0.4) / 5 * w, hh = (20 + R() * 16) * u, r = (5 + R() * 3) * u; ctx.fillStyle = '#f4f0f0'; ctx.fillRect(x - 0.6 * u, y - hh, 1.2 * u, hh + 6 * u); ctx.fillStyle = ['#ff6fa8', '#8ae0d0', '#ffd060', '#b88aff'][i % 4]; ctx.beginPath(); ctx.arc(x, y - hh, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = u * 0.7; ctx.beginPath(); for (let j = 0; j < 30; j++) { const t = j / 30 * TAU * 2, rr = j / 30 * r; ctx.lineTo(x + Math.cos(t) * rr, y - hh + Math.sin(t) * rr); } ctx.stroke(); } break; }
      case 'grid': { ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = u * 0.3; for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 4 * u, y - 6 * u); ctx.lineTo(w / 2 + i * 22 * u, h); ctx.stroke(); } for (let j = 0; j < 8; j++) { const yy = y - 6 * u + j * j * 1.4 * u; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); } break; }
    }
  }
  function particles(ctx, w, h, sc, seed, amount) {
    const R = rng(seed + 7), n = Math.round((sc.fx === 'stars' ? 70 : 46) * amount), u = Math.min(w, h) / 100;
    for (let i = 0; i < n; i++) {
      const x = R() * w, y = R() * h, s = (0.5 + R()) * u;
      ctx.globalAlpha = 0.45 + R() * 0.5; ctx.fillStyle = sc.fxCol; ctx.strokeStyle = sc.fxCol;
      switch (sc.fx) {
        case 'snow': ctx.beginPath(); ctx.arc(x, y, s * 0.7, 0, TAU); ctx.fill(); break;
        case 'stars': if (R() < 0.2) { ctx.beginPath(); star(ctx, x, y, s * 1.8, 4, 0.3); ctx.fill(); } else ctx.fillRect(x, y, s * 0.5, s * 0.5); break;
        case 'embers': case 'sparks': ctx.fillRect(x, y, s * 0.7, s * (sc.fx === 'sparks' ? 2.2 : 0.7)); break;
        case 'fireflies': case 'motes': { const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4); g.addColorStop(0, rgba(sc.fxCol, 0.9)); g.addColorStop(1, rgba(sc.fxCol, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 2.4, 0, TAU); ctx.fill(); break; }
        case 'confetti': ctx.fillStyle = ['#ff6fa8', '#8ae0d0', '#ffd060', '#ffffff'][i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate(R() * 3); ctx.fillRect(-s * 0.6, -s * 0.3, s * 1.2, s * 0.6); ctx.restore(); break;
        case 'petals': case 'leaves': ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.45, R() * 3, 0, TAU); ctx.fill(); break;
        case 'rain': case 'spray': ctx.lineWidth = s * 0.25; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 0.8, y + s * 4); ctx.stroke(); break;
        case 'smoke': { const g = ctx.createRadialGradient(x, y, 0, x, y, s * 7); g.addColorStop(0, rgba(sc.fxCol, 0.18)); g.addColorStop(1, rgba(sc.fxCol, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 7, 0, TAU); ctx.fill(); break; }
        case 'fireworks': if (i % 12 === 0) { const cx = x, cy = y * 0.5, col = ['#ffd060', '#ff5a5a', '#8ae0ff', '#ffffff'][(i / 12) % 4]; ctx.strokeStyle = col; ctx.lineWidth = u * 0.35; for (let j = 0; j < 14; j++) { const a = j / 14 * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 2 * u, cy + Math.sin(a) * 2 * u); ctx.lineTo(cx + Math.cos(a) * 8 * u, cy + Math.sin(a) * 8 * u); ctx.stroke(); } } break;
        case 'sparkle': ctx.beginPath(); star(ctx, x, y, s * 1.4, 4, 0.25); ctx.fill(); break;
      }
    }
    ctx.globalAlpha = 1;
  }

  const splashPose = { kind: 'splash', f: 0 };
  function figure(look, pose, px) {
    const f = render(look, pose, px, { outline: [10, 6, 12] });
    const rim = mk(f.cv.width, f.cv.height), rc = rim.getContext('2d');
    rc.drawImage(f.cv, 0, 0); rc.globalCompositeOperation = 'source-in'; rc.fillStyle = SCENES[look.scene] ? SCENES[look.scene].light : '#ffffff'; rc.fillRect(0, 0, rim.width, rim.height);
    f.rim = rim;
    return f;
  }
  const figCache = new Map();
  function measure(look) {
    const key = look.id;
    if (!figCache.has(key)) { const f = render(look, splashPose, 2); figCache.set(key, { h: f.oy / 2, w: f.cv.width / 2, head: [(f.head[0] - f.ox) / 2, (f.head[1] - f.oy) / 2, f.head[2] / 2] }); }
    return figCache.get(key);
  }

  function splash(id, w, h, mode) {
    mode = mode || 'wide';
    const look = lookOf(id), sc = SCENES[look.scene] || SCENES.rift, seed = hash(look.id);
    const cv = mk(w, h), ctx = cv.getContext('2d');
    paintScene(ctx, w, h, sc, seed);
    particles(ctx, w, h, sc, seed, 0.5);
    const m = measure(look);
    const target = mode === 'tall' ? h * 0.86 : mode === 'hub' ? h * 1.1 : h * 1.22;
    const px = clamp(Math.min(target / m.h, (mode === 'tall' ? w * 0.96 : w * 0.8) / m.w), 1.5, 12);
    const f = figure(look, splashPose, px);
    const fx = mode === 'tall' ? w * 0.5 : mode === 'hub' ? w * 0.68 : w * 0.6, fy = h * (mode === 'tall' ? 0.97 : mode === 'hub' ? 1.08 : 1.17);
    const sg = ctx.createRadialGradient(fx, fy - 2, 0, fx, fy - 2, f.cv.width * 0.5); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(fx, fy - 2, f.cv.width * 0.5, f.cv.width * 0.12, 0, 0, TAU); ctx.fill();
    const rimOff = Math.max(1, Math.round(px * 0.45));
    ctx.globalAlpha = 0.55; ctx.drawImage(f.rim, Math.round(fx - f.ox - rimOff), Math.round(fy - f.oy - rimOff)); ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(f.cv, Math.round(fx - f.ox), Math.round(fy - f.oy));
    particles(ctx, w, h, sc, seed + 99, 0.35);
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    return cv;
  }
  const BUST = { lulu: [0.78, 0.6, 0.52], teemo: [0.78, 0.6, 0.54], annie: [0.92, 0.56, 0.5], malphite: [1, 0.46, 0.44], alistar: [0.72, 0.6, 0.4], garen: [0.95, 0.53, 0.5], ashe: [0.95, 0.53, 0.5], jinx: [0.98, 0.53, 0.5], masteryi: [0.98, 0.53, 0.5], ryze: [0.95, 0.53, 0.5] };
  function icon(id, size) {
    const look = lookOf(id), sc = SCENES[look.scene] || SCENES.rift, seed = hash(look.id + 'i');
    const cv = mk(size, size), ctx = cv.getContext('2d');
    paintScene(ctx, size * 2.4, size * 2.4, sc, seed);
    const m = measure(look), bz = BUST[look.cid] || [1, 0.53, 0.5];
    const px = clamp(size * 0.34 * bz[0] / m.head[2], 1, 40);
    const f = render(look, { kind: 'idle', f: 0, breath: 0 }, px, { outline: [10, 6, 12] });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(f.cv, Math.round(size * bz[2] - f.head[0]), Math.round(size * bz[1] - f.head[1]));
    const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, size, size);
    return cv;
  }

  function cached(map, key, fn) { if (!map.has(key)) map.set(key, fn()); return map.get(key); }
  const cache = { set: new Map(), pet: new Map(), splash: new Map(), icon: new Map() };
  const Art = {
    SCENES, lookOf,
    sprites: (id, variant) => cached(cache.set, id + (variant ? '#' + JSON.stringify(variant) : ''), () => spriteSet(id, variant)),
    pets: id => cached(cache.pet, id, () => petSprites(id)),
    splash: (id, w, h, mode) => cached(cache.splash, `${id}|${w}x${h}|${mode || 'wide'}`, () => splash(id, w, h, mode)),
    icon: (id, size) => cached(cache.icon, `${id}|${size}`, () => icon(id, size)),
    has: (kind, key) => cache[kind].has(key)
  };
  L.Art = Art;
})(globalThis.LoL98 = globalThis.LoL98 || {});
