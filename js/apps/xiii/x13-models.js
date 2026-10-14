(function (X) {
  'use strict';
  const T = X.Tex, INK = '#1e120c';
  const MD = {};
  X.Models = MD;

  const BONES = [
    { n: 'hips', p: -1, o: [0, 0.98, 0] },
    { n: 'spine', p: 0, o: [0, 0.1, 0] },
    { n: 'head', p: 1, o: [0, 0.4, 0] },
    { n: 'rUA', p: 1, o: [0.2, 0.36, 0] },
    { n: 'rFA', p: 3, o: [0, -0.28, 0] },
    { n: 'rH', p: 4, o: [0, -0.26, 0] },
    { n: 'lUA', p: 1, o: [-0.2, 0.36, 0] },
    { n: 'lFA', p: 6, o: [0, -0.28, 0] },
    { n: 'lH', p: 7, o: [0, -0.26, 0] },
    { n: 'rTh', p: 0, o: [0.1, -0.02, 0] },
    { n: 'rSh', p: 9, o: [0, -0.45, 0] },
    { n: 'rFt', p: 10, o: [0, -0.45, 0] },
    { n: 'lTh', p: 0, o: [-0.1, -0.02, 0] },
    { n: 'lSh', p: 12, o: [0, -0.45, 0] },
    { n: 'lFt', p: 13, o: [0, -0.45, 0] },
    { n: 'gun', p: 5, o: [0, -0.07, -0.015], r: [-Math.PI / 2, 0, 0] }
  ];
  const BI = {};
  BONES.forEach((b, i) => { BI[b.n] = i; });
  MD.BONES = BONES; MD.BI = BI;

  const SKIN = [[0.93, 0.76, 0.62], [0.96, 0.8, 0.68], [0.82, 0.62, 0.46], [0.5, 0.34, 0.24]];
  const HAIR = { blond: [0.88, 0.72, 0.42], brown: [0.36, 0.22, 0.12], slick: [0.12, 0.1, 0.08], short: [0.2, 0.15, 0.1], short_dark: [0.1, 0.08, 0.07], white: [0.86, 0.86, 0.82], red: [0.62, 0.26, 0.1], shaved: [0.25, 0.2, 0.15], bun: [0.72, 0.52, 0.28], bob: [0.3, 0.16, 0.1], long_blond: [0.92, 0.78, 0.48], bald: null };

  const FACES = {
    xiii: { skin: 0, hair: 'blond', brow: 1.1, jaw: 1, stubble: 0.35, eyes: 'hard' },
    sally: { skin: 1, hair: 'bun', female: true, brow: 0.7, eyes: 'soft', lips: '#b83a30', freckles: true },
    hitman: { skin: 0, hair: 'short', brow: 1.3, jaw: 1.1, stubble: 0.6, eyes: 'mean', nose: 1.2 },
    hitman2: { skin: 2, hair: 'short_dark', brow: 1.2, stubble: 0.5, eyes: 'mean', moustache: true },
    killer: { skin: 0, hair: 'slick', glasses: true, brow: 1, jaw: 1.2, eyes: 'hard' },
    guard: { skin: 1, hair: 'short', brow: 1, eyes: 'soft', moustache: true, chubby: true },
    clerk: { skin: 0, hair: 'bald', brow: 0.8, eyes: 'soft', specs: true, wrinkles: 0.5 },
    civ: { skin: 2, hair: 'brown', brow: 0.9, eyes: 'soft' },
    civf: { skin: 1, hair: 'bob', female: true, eyes: 'soft', lips: '#c0302a' },
    agent: { skin: 0, hair: 'short', brow: 1.1, jaw: 1.2, eyes: 'hard' },
    agent2: { skin: 2, hair: 'brown', brow: 1, eyes: 'hard', moustache: true },
    jones: { skin: 3, hair: 'short_dark', female: true, brow: 1, eyes: 'hard', lips: '#6a2a24' },
    mask: { skin: 0, hair: 'slick', mask: true, eyes: 'mean' },
    docker: { skin: 2, hair: 'brown', brow: 1.3, stubble: 0.8, eyes: 'mean', scar: true },
    soldier: { skin: 0, hair: 'short', brow: 1.1, jaw: 1.1, eyes: 'hard', stubble: 0.2 },
    officer: { skin: 0, hair: 'slick', brow: 1.2, eyes: 'mean', moustache: true, wrinkles: 0.3 },
    carrington: { skin: 0, hair: 'white', brow: 1.2, eyes: 'hard', wrinkles: 1, moustache: true, browColor: '#d8d8d0' },
    merc: { skin: 2, hair: 'brown', brow: 1.2, beard: true, eyes: 'mean' },
    merc2: { skin: 0, hair: 'short', brow: 1.1, stubble: 0.7, eyes: 'mean' },
    pguard: { skin: 1, hair: 'short', brow: 1.1, eyes: 'mean', chubby: true, stubble: 0.3 },
    prisoner: { skin: 2, hair: 'shaved', brow: 1.3, stubble: 0.7, eyes: 'mean', scar: true },
    irish: { skin: 1, hair: 'red', brow: 1.4, beard: true, beardColor: '#8a3212', eyes: 'mean', freckles: true, jaw: 1.3 },
    mongoose: { skin: 0, hair: 'bald', glasses: true, brow: 1.2, jaw: 1.25, eyes: 'mean', moustache: true, thin: true },
    kim: { skin: 0, hair: 'long_blond', female: true, eyes: 'soft', lips: '#c83a3a' },
    oldman: { skin: 0, hair: 'white', beard: true, beardColor: '#e0e0da', wrinkles: 1.2, eyes: 'soft' },
    shadow: { skin: 0, hair: 'short', shadow: true, eyes: 'hard' }
  };
  MD.FACES = FACES;
  const FACE_IDS = Object.keys(FACES);

  const PATTERNS = ['white', 'snow', 'woods', 'plaid', 'suit', 'knit', 'jumpsuit', 'vest', 'leather', 'denim', 'medkit', 'ammo', 'doc', 'keytag', 'photo', 'paper', 'tattoo', 'newspaper', 'card', 'metal', 'wood', 'blood', 'hotdog', 'dossier'];

  let atlas = null;
  MD.atlas = function () {
    if (atlas) return atlas;
    if (typeof document === 'undefined') { atlas = { canvas: null, face: {}, pat: {} }; return atlas; }
    const W = 2048, H = 2048, C = 256;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const face = {}, pat = {};
    let i = 0;
    for (const id of FACE_IDS) {
      for (const pain of [false, true]) {
        const cx = (i % 8) * C, cy = Math.floor(i / 8) * C;
        ctx.save(); ctx.translate(cx, cy);
        drawFace(ctx, C, FACES[id], pain, X.rng(X.hash('face' + id)));
        ctx.restore();
        face[id + (pain ? ':pain' : '')] = [cx / W, cy / H, C / W, C / H];
        i++;
      }
    }
    const py = Math.ceil(i / 8) * C;
    const P = 128;
    PATTERNS.forEach((name, k) => {
      const x = (k % 16) * P, y = py + Math.floor(k / 16) * P;
      ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, P, P); ctx.clip();
      drawPattern(ctx, P, name, X.rng(X.hash('pat' + name)));
      ctx.restore();
      pat[name] = [(x + 2) / W, (y + 2) / H, (P - 4) / W, (P - 4) / H];
    });
    atlas = { canvas: cv, face, pat };
    return atlas;
  };

  function drawFace(c, S, f, pain, r) {
    const skin = T.rgb(SKIN[f.skin || 0]);
    const skinD = T.shade(skin, 0.72), skinL = T.shade(skin, 1.08);
    const hc = HAIR[f.hair] ? T.rgb(HAIR[f.hair]) : skin;
    c.fillStyle = f.shadow ? '#1a1a22' : skin; c.fillRect(0, 0, S, S);
    if (f.shadow) { c.fillStyle = '#2a2a34'; c.fillRect(0, 0, S, S * 0.3); c.fillStyle = '#d8d0c0'; c.fillRect(S * 0.36, S * 0.5, S * 0.08, S * 0.02); c.fillRect(S * 0.56, S * 0.5, S * 0.08, S * 0.02); return; }
    const sx = S / 256;
    c.save(); c.scale(sx, sx);
    const g = c.createRadialGradient(128, 150, 20, 128, 150, 150);
    g.addColorStop(0, skinL); g.addColorStop(0.7, skin); g.addColorStop(1, skinD);
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.fillStyle = skinD;
    c.beginPath(); c.ellipse(24, 135, 16, 26, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(232, 135, 16, 26, 0, 0, 7); c.fill();
    T.ink(c, [[18, 118], [30, 125], [30, 150], [20, 158]], 2, INK, 0.7);
    T.ink(c, [[238, 118], [226, 125], [226, 150], [236, 158]], 2, INK, 0.7);
    const jaw = f.jaw || 1;
    c.save(); c.globalAlpha = 0.5;
    T.hatch(c, 40, 150, 32, 60, 1.1, 5, INK, 0.35, 1.2, r);
    T.hatch(c, 184, 150, 32, 60, -1.1, 5, INK, 0.35, 1.2, r);
    c.restore();
    T.ink(c, [[46, 150], [56, 196 * jaw > 230 ? 228 : 196 * jaw], [96, 232], [128, 240], [160, 232], [200, 196 * jaw > 230 ? 228 : 196 * jaw], [210, 150]], 2.2, INK, f.female ? 0.35 : 0.6);
    if (f.chubby) T.ink(c, [[70, 205], [128, 226], [186, 205]], 2, INK, 0.3);
    if (f.stubble) {
      c.save(); c.fillStyle = T.shade(hc, 0.5); c.globalAlpha = 0.45 * f.stubble;
      for (let k = 0; k < 900 * f.stubble; k++) {
        const a = r() * Math.PI, rr = 60 + r() * 50;
        const x = 128 + Math.cos(a) * rr * 0.8, y = 150 + Math.sin(a) * rr * 0.72;
        if (y > 180 || (y > 160 && Math.abs(x - 128) > 40)) c.fillRect(x, y, 1.6, 1.6);
      }
      c.restore();
    }
    if (f.beard) {
      c.fillStyle = f.beardColor || T.rgb(T.hex2(hc).map(v => v * 0.9));
      c.beginPath(); c.moveTo(50, 160); c.quadraticCurveTo(60, 245, 128, 250); c.quadraticCurveTo(196, 245, 206, 160); c.quadraticCurveTo(170, 205, 128, 205); c.quadraticCurveTo(86, 205, 50, 160); c.fill();
      for (let k = 0; k < 60; k++) { const x = 60 + r() * 136, y = 175 + r() * 65; T.ink(c, [[x, y], [x + (r() - 0.5) * 4, y + 8]], 1, INK, 0.4); }
    }
    const top = f.female ? 62 : 58;
    if (HAIR[f.hair]) {
      c.fillStyle = hc;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(256, 0); c.lineTo(256, 120);
      if (f.hair === 'shaved') { c.lineTo(214, 70); c.quadraticCurveTo(128, top - 10, 42, 70); }
      else { c.lineTo(222, 110); c.quadraticCurveTo(210, 60, 170, top + 4); c.quadraticCurveTo(128, top - 6, 86, top + 4); c.quadraticCurveTo(46, 60, 34, 110); }
      c.lineTo(0, 120); c.closePath(); c.fill();
      for (let k = 0; k < 50; k++) { const x = r() * 256, y = r() * (top); T.ink(c, [[x, y], [x + (r() - 0.5) * 20, y + 10 + r() * 14]], 1.2, T.shade(hc, 0.55), 0.6); }
      T.ink(c, [[34, 110], [46, 60], [86, top + 4], [128, top - 6], [170, top + 4], [210, 60], [222, 110]], 2.4, INK, 0.8, r, 1.5);
      if (f.hair === 'long_blond' || f.hair === 'bob') {
        c.fillStyle = hc;
        c.beginPath(); c.moveTo(0, 100); c.lineTo(34, 100); c.quadraticCurveTo(30, 180, 40, f.hair === 'bob' ? 190 : 256); c.lineTo(0, 256); c.fill();
        c.beginPath(); c.moveTo(256, 100); c.lineTo(222, 100); c.quadraticCurveTo(226, 180, 216, f.hair === 'bob' ? 190 : 256); c.lineTo(256, 256); c.fill();
      }
    } else {
      c.save(); c.globalAlpha = 0.25; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(110, 40, 40, 16, -0.3, 0, 7); c.fill(); c.restore();
      T.ink(c, [[70, 90], [100, 86]], 1.2, INK, 0.3);
    }
    const bw = f.brow || 1;
    const bc = f.browColor || (HAIR[f.hair] ? T.shade(hc, 0.55) : '#3a2a20');
    const browY = pain ? 94 : 104;
    const eyeY = 122;
    const mean = f.eyes === 'mean';
    c.fillStyle = bc;
    for (const s of [-1, 1]) {
      c.save(); c.translate(128 + s * 42, browY); c.scale(s, 1);
      c.beginPath();
      if (pain) { c.moveTo(-26, 4); c.quadraticCurveTo(-4, -12, 22, -6); c.lineTo(22, -1); c.quadraticCurveTo(-4, -6, -26, 9); }
      else if (mean) { c.moveTo(-26, -8); c.quadraticCurveTo(0, -6, 24, 6); c.lineTo(22, 12); c.quadraticCurveTo(0, 0, -26, -1 * bw); }
      else { c.moveTo(-26, 0); c.quadraticCurveTo(0, -10, 24, -2); c.lineTo(24, 4 * bw); c.quadraticCurveTo(0, -3, -26, 6 * bw); }
      c.closePath(); c.fill();
      c.restore();
    }
    for (const s of [-1, 1]) {
      const ex = 128 + s * 42;
      if (f.mask) {
        c.fillStyle = '#e8e0d0'; c.beginPath(); c.ellipse(ex, eyeY, 16, 8, 0, 0, 7); c.fill();
        c.fillStyle = '#2a2018'; c.beginPath(); c.arc(ex + s * 2, eyeY, 5, 0, 7); c.fill();
        continue;
      }
      if (pain) {
        if (f.glasses) continue;
        c.fillStyle = '#f4f0e8'; c.beginPath(); c.ellipse(ex, eyeY + 2, 17, 11, 0, 0, 7); c.fill();
        c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(ex + s * 3, eyeY + 6, 3.5, 0, 7); c.fill();
        T.ink(c, [[ex - 19, eyeY - 2], [ex, eyeY - 9], [ex + 19, eyeY - 2]], 3, INK, 0.9);
        T.ink(c, [[ex - 16, eyeY + 11], [ex + 16, eyeY + 11]], 1.4, INK, 0.5);
        continue;
      }
      c.fillStyle = '#f2ece2';
      c.beginPath(); c.moveTo(ex - 18, eyeY); c.quadraticCurveTo(ex, eyeY - (mean ? 9 : 12), ex + 18, eyeY); c.quadraticCurveTo(ex, eyeY + 9, ex - 18, eyeY); c.fill();
      c.fillStyle = f.female ? '#4a6a8a' : '#3a4a5a';
      c.beginPath(); c.arc(ex + s * 1, eyeY + 0.5, 6.5, 0, 7); c.fill();
      c.fillStyle = '#0c0808'; c.beginPath(); c.arc(ex + s * 1, eyeY + 0.5, 3, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(ex + s * 1 - 3, eyeY - 3, 2, 2);
      T.ink(c, [[ex - 20, eyeY + 1], [ex - 8, eyeY - (mean ? 8 : 11)], [ex + 8, eyeY - (mean ? 9 : 11)], [ex + 20, eyeY - 1]], f.female ? 3.6 : 3, INK, 1);
      T.ink(c, [[ex - 14, eyeY + 7], [ex + 12, eyeY + 7]], 1.2, INK, 0.45);
      if (f.female) for (let k = 0; k < 4; k++) T.ink(c, [[ex + s * (8 + k * 3), eyeY - 10 + k], [ex + s * (12 + k * 4), eyeY - 16 + k * 2]], 1.4, INK, 0.9);
      if (f.wrinkles) { T.ink(c, [[ex + s * 20, eyeY - 2], [ex + s * 27, eyeY - 6]], 1.2, INK, 0.5 * f.wrinkles); T.ink(c, [[ex + s * 20, eyeY + 3], [ex + s * 27, eyeY + 5]], 1.2, INK, 0.5 * f.wrinkles); }
    }
    if (f.glasses) {
      c.fillStyle = '#101014';
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(128 + s * 10, eyeY - 12); c.lineTo(128 + s * 66, eyeY - 14); c.quadraticCurveTo(128 + s * 64, eyeY + 16, 128 + s * 40, eyeY + 16); c.quadraticCurveTo(128 + s * 14, eyeY + 14, 128 + s * 10, eyeY - 12); c.fill(); }
      c.fillRect(118, eyeY - 12, 20, 5);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(150, eyeY - 8, 12, 4); c.fillRect(84, eyeY - 8, 12, 4);
    }
    if (f.specs) { c.strokeStyle = '#2a2a2a'; c.lineWidth = 3; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(128 + s * 42, eyeY, 20, 15, 0, 0, 7); c.stroke(); } T.ink(c, [[106, eyeY - 3], [150, eyeY - 3]], 3, '#2a2a2a', 1); }
    if (f.wrinkles) { for (let k = 0; k < 3; k++) T.ink(c, [[96, 78 + k * 7], [128, 75 + k * 7], [160, 78 + k * 7]], 1.3, INK, 0.35 * f.wrinkles); }
    const nk = f.nose || 1;
    if (!f.mask) {
      T.ink(c, [[124, 128], [118, 160 * nk > 175 ? 172 : 160 * nk], [124, 170], [134, 170]], 2.2, INK, 0.75);
      T.ink(c, [[112, 168], [118, 172]], 1.6, INK, 0.6); T.ink(c, [[140, 168], [134, 172]], 1.6, INK, 0.6);
      c.save(); c.globalAlpha = 0.3; T.hatch(c, 128, 132, 12, 34, 0.5, 4, INK, 0.5, 1, r); c.restore();
    }
    if (f.freckles) { c.fillStyle = '#9a5a3a'; c.globalAlpha = 0.5; for (let k = 0; k < 40; k++) c.fillRect(80 + r() * 96, 135 + r() * 25, 2, 2); c.globalAlpha = 1; }
    if (f.scar) { T.ink(c, [[160, 100], [172, 140], [168, 170]], 3, '#8a3a2a', 0.8); for (let k = 0; k < 5; k++) T.ink(c, [[160 + k * 2.5, 110 + k * 12], [172 + k * 2.5, 108 + k * 12]], 1.2, '#8a3a2a', 0.7); }
    const my = 196;
    if (f.mask) {
      c.fillStyle = '#16161a'; c.fillRect(0, 0, 256, eyeY - 16); c.fillRect(0, eyeY + 14, 256, 256 - eyeY - 14); c.fillRect(0, 0, 90, 256); c.fillRect(166, 0, 90, 256);
      c.fillStyle = '#26262c'; for (let k = 0; k < 40; k++) c.fillRect(r() * 256, r() * 256, 3, 3);
    } else if (pain) {
      c.fillStyle = '#3a0e0a';
      c.beginPath(); c.ellipse(128, my + 4, 22, 17, 0, 0, 7); c.fill();
      c.fillStyle = '#f0ece0'; c.fillRect(110, my - 11, 36, 6);
      c.fillStyle = '#a02a20'; c.beginPath(); c.ellipse(128, my + 14, 12, 5, 0, 0, 7); c.fill();
      T.ink(c, [[104, my], [112, my - 14], [128, my - 16], [144, my - 14], [152, my]], 2.4, INK, 0.9);
      T.ink(c, [[106, my + 12], [128, my + 24], [150, my + 12]], 2, INK, 0.7);
    } else {
      if (f.lips) { c.fillStyle = f.lips; c.beginPath(); c.moveTo(104, my); c.quadraticCurveTo(128, my - 10, 152, my); c.quadraticCurveTo(128, my + 12, 104, my); c.fill(); }
      T.ink(c, [[102, my], [116, my - 3], [128, my - 1], [140, my - 3], [154, my]], 2.6, INK, 0.95);
      T.ink(c, [[114, my + 11], [142, my + 11]], 1.6, INK, 0.4);
    }
    if (f.moustache && !f.mask) {
      c.fillStyle = f.hair === 'white' ? '#e0e0da' : (f.hair === 'bald' ? '#2a2018' : T.shade(hc, 0.8));
      c.beginPath(); c.moveTo(100, my - 4); c.quadraticCurveTo(128, my - 26, 156, my - 4); c.quadraticCurveTo(128, my - 12, 100, my - 4); c.fill();
      T.ink(c, [[100, my - 4], [128, my - 20], [156, my - 4]], 1.5, INK, 0.6);
    }
    if (pain) {
      c.fillStyle = '#a0100a';
      c.beginPath(); c.ellipse(96, 84, 22, 16, 0.4, 0, 7); c.fill();
      for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(84 + r() * 40, 80 + r() * 50, 3 + r() * 5, 3 + r() * 8, 0, 0, 7); c.fill(); }
      T.ink(c, [[96, 96], [94, 140], [100, 160]], 5, '#a0100a', 0.8);
    }
    c.restore();
  }

  function drawPattern(c, S, name, r) {
    const fill = (col) => { c.fillStyle = col; c.fillRect(0, 0, S, S); };
    switch (name) {
      case 'white': fill('#ffffff'); break;
      case 'snow': fill('#e8ecf0'); T.blotch(c, S, 14, '#9aa4ae', 0.8, r, 5, 12); T.blotch(c, S, 8, '#5c646c', 0.7, r, 4, 8); break;
      case 'woods': fill('#6a7048'); T.blotch(c, S, 12, '#3c4a2a', 0.9, r, 6, 14); T.blotch(c, S, 10, '#8a7448', 0.8, r, 4, 10); T.blotch(c, S, 6, '#1e2418', 0.8, r, 3, 7); break;
      case 'plaid': fill('#a8281c'); c.fillStyle = 'rgba(20,10,10,0.55)'; for (let i = 0; i < S; i += 32) { c.fillRect(i, 0, 12, S); c.fillRect(0, i, S, 12); } c.fillStyle = 'rgba(240,220,120,0.4)'; for (let i = 16; i < S; i += 32) { c.fillRect(i, 0, 2, S); c.fillRect(0, i, S, 2); } break;
      case 'suit': fill('#ffffff'); c.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < S; i += 10) c.fillRect(i, 0, 1, S); break;
      case 'knit': fill('#ffffff'); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for (let y = 0; y < S; y += 8) for (let x = 0; x < S; x += 8) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4, y + 7); c.lineTo(x + 8, y); c.stroke(); } break;
      case 'jumpsuit': fill('#ffffff'); c.fillStyle = 'rgba(0,0,0,0.6)'; c.font = 'bold 30px sans-serif'; c.fillText('PR-' + (1000 + Math.floor(r() * 8999)), 8, S * 0.6); break;
      case 'vest': fill('#ffffff'); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 4; i++) c.fillRect(10, 12 + i * 30, S - 20, 14); break;
      case 'leather': fill('#ffffff'); T.blotch(c, S, 12, '#000000', 0.12, r, 8, 20); break;
      case 'denim': fill('#ffffff'); T.hatch(c, 0, 0, S, S, 0.7, 4, '#000', 0.12, 1, r); break;
      case 'medkit': fill('#f2f0ea'); c.fillStyle = '#d01e14'; c.fillRect(S * 0.38, S * 0.15, S * 0.24, S * 0.7); c.fillRect(S * 0.15, S * 0.38, S * 0.7, S * 0.24); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(2, 2, S - 4, S - 4); break;
      case 'ammo': fill('#5a6038'); c.fillStyle = '#e8d060'; c.fillRect(S * 0.1, S * 0.35, S * 0.8, S * 0.3); c.fillStyle = INK; c.font = 'bold 26px Impact, sans-serif'; c.textAlign = 'center'; c.fillText('AMMO', S / 2, S * 0.6); break;
      case 'doc': fill('#d8c890'); c.fillStyle = '#b01a10'; c.font = 'bold 24px Impact, sans-serif'; c.save(); c.translate(S / 2, S / 2); c.rotate(-0.3); c.textAlign = 'center'; c.fillText('TOP', 0, -6); c.fillText('SECRET', 0, 20); c.restore(); c.strokeStyle = '#b01a10'; c.lineWidth = 3; c.strokeRect(12, 30, S - 24, S - 60); break;
      case 'keytag': fill('#e8dca0'); c.fillStyle = INK; c.font = 'bold 34px serif'; c.textAlign = 'center'; c.fillText('1313', S / 2, S * 0.62); c.font = 'bold 14px serif'; c.fillText('WINSLOW BANK', S / 2, S * 0.3); break;
      case 'photo': {
        fill('#f4f0e6'); c.fillStyle = '#6a7a8a'; c.fillRect(10, 10, S - 20, S - 36);
        c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(S * 0.35, S * 0.4, 16, 0, 7); c.fill(); c.beginPath(); c.arc(S * 0.65, S * 0.42, 15, 0, 7); c.fill();
        c.fillStyle = '#d8b060'; c.beginPath(); c.arc(S * 0.35, S * 0.33, 16, Math.PI, 0); c.fill(); c.fillStyle = '#e8c870'; c.beginPath(); c.arc(S * 0.65, S * 0.36, 17, Math.PI, 0); c.fill(); c.fillRect(S * 0.53, S * 0.36, 8, 30); c.fillRect(S * 0.73, S * 0.36, 8, 30);
        c.fillStyle = '#2a3a5a'; c.fillRect(S * 0.2, S * 0.55, S * 0.28, S * 0.22); c.fillStyle = '#e8e4d8'; c.fillRect(S * 0.52, S * 0.55, S * 0.26, S * 0.22);
        c.fillStyle = INK; c.font = 'italic 12px serif'; c.fillText('Steve & Kim', 14, S - 10); break;
      }
      case 'paper': fill('#f2eee0'); for (let i = 0; i < 12; i++) { c.fillStyle = '#5a5a6a'; c.fillRect(12, 12 + i * 9, 40 + r() * 60, 2); } break;
      case 'tattoo': { fill(T.rgb(SKIN[0])); c.fillStyle = '#1a2a4a'; c.font = 'bold 56px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('XIII', S / 2, S / 2 + 4); break; }
      case 'newspaper': { fill('#e8e0cc'); c.fillStyle = INK; c.font = 'bold 18px serif'; c.textAlign = 'center'; c.fillText('THE DAILY', S / 2, 22); c.font = 'bold 15px Impact, sans-serif'; c.fillText('SHERIDAN SHOT!', S / 2, 44); for (let i = 0; i < 8; i++) c.fillRect(10 + (i % 2) * 58, 56 + Math.floor(i / 2) * 16, 50, 3); break; }
      case 'card': fill('#e8e8e0'); c.fillStyle = '#1a3a7a'; c.fillRect(0, 0, S, S * 0.3); c.fillStyle = '#d8c060'; c.fillRect(S * 0.1, S * 0.45, S * 0.25, S * 0.2); break;
      case 'metal': fill('#9aa0a6'); T.stipple(c, S, 200, '#000', 0.15, r, 1); break;
      case 'wood': fill('#8a5a30'); for (let i = 0; i < 12; i++) T.wobbleLine(c, 0, r() * S, S, r() * S, 1, '#3a2010', 0.4, r, 3, 5); break;
      case 'blood': fill('#8a0e08'); break;
      case 'hotdog': fill('#e0a860'); c.fillStyle = '#a8401c'; c.fillRect(0, S * 0.35, S, S * 0.3); c.fillStyle = '#e8c020'; for (let x = 0; x < S; x += 16) c.fillRect(x, S * 0.45 + Math.sin(x) * 6, 10, 5); break;
      case 'dossier': fill('#7a5a34'); c.fillStyle = '#e8dcc0'; c.fillRect(12, 20, S - 24, S - 40); c.fillStyle = '#b01a10'; c.font = 'bold 40px Impact, sans-serif'; c.textAlign = 'center'; c.fillText('XX', S / 2, S * 0.62); break;
    }
  }

  const HEAD_R = 0.118, HEAD_SY = 1.16, HEAD_C = [0, 0.15, -0.012];

  function part(m, bone, parts, fn) {
    const s = m.n;
    fn(m);
    parts.push({ bone, start: s, end: m.n });
  }
  function region(pat, u, v) { return [pat[0] + u * pat[2], pat[1] + v * pat[3]]; }
  function setUV(m, from, pat, mode, scale) {
    for (let i = from; i < m.n; i++) {
      const o = i * X.Mesh.STRIDE;
      if (!pat) { m.v[o + 6] = 0; m.v[o + 7] = 0; continue; }
      let u = 0.5, v = 0.5;
      if (mode === 'planar') { u = (m.v[o] * (scale || 2) + 0.5); v = (-m.v[o + 1] * (scale || 2) + 0.5); }
      else if (mode === 'side') { u = (m.v[o + 2] * (scale || 2) + 0.5); v = (-m.v[o + 1] * (scale || 2) + 0.5); }
      u = u - Math.floor(u); v = v - Math.floor(v);
      const q = region(pat, u, v);
      m.v[o + 6] = q[0]; m.v[o + 7] = q[1];
    }
  }
  function limb(m, len, r0, r1, col, sides) {
    X.GL.cyl(m, 0, -len, 0, r1, r0, len, sides || 7, 1, col, true, 0);
  }
  function tbox(m, x0, y0, z0, x1, y1, z1, col, taper) {
    const s = m.n;
    X.GL.box(m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, 0, 1, col);
    if (taper) {
      const cy = (y0 + y1) / 2;
      for (let i = s; i < m.n; i++) {
        const o = i * X.Mesh.STRIDE;
        const k = m.v[o + 1] > cy ? taper[1] : taper[0];
        m.v[o] *= k;
        if (taper[2]) m.v[o + 2] *= (m.v[o + 1] > cy ? taper[3] : taper[2]);
      }
    }
    smoothNormals(m, s);
  }
  function smoothNormals(m, from) {
    const S = X.Mesh.STRIDE, map = new Map();
    for (let i = from; i < m.n; i++) {
      const o = i * S, k = m.v[o].toFixed(3) + ',' + m.v[o + 1].toFixed(3) + ',' + m.v[o + 2].toFixed(3);
      const e = map.get(k) || [0, 0, 0, []];
      e[0] += m.v[o + 3]; e[1] += m.v[o + 4]; e[2] += m.v[o + 5]; e[3].push(o);
      map.set(k, e);
    }
    for (const e of map.values()) {
      const l = Math.hypot(e[0], e[1], e[2]) || 1;
      for (const o of e[3]) { m.v[o + 3] = e[0] / l; m.v[o + 4] = e[1] / l; m.v[o + 5] = e[2] / l; }
    }
  }
  MD.smoothNormals = smoothNormals;

  function headMesh(m, faceReg) {
    const s = m.n;
    X.GL.sphere(m, HEAD_C[0], HEAD_C[1], HEAD_C[2], HEAD_R, 14, 10, 1, [1, 1, 1], HEAD_SY);
    for (let i = s; i < m.n; i++) {
      const o = i * X.Mesh.STRIDE;
      const d = X.vnorm([m.v[o] - HEAD_C[0], (m.v[o + 1] - HEAD_C[1]) / HEAD_SY, m.v[o + 2] - HEAD_C[2]]);
      let a = Math.atan2(d[0], -d[2]);
      let u = 0.5 - a / (Math.PI * 1.05);
      u = X.clamp(u, 0.01, 0.99);
      let v = Math.acos(X.clamp(d[1], -1, 1)) / Math.PI;
      v = X.clamp(v * 1.12 - 0.02, 0.01, 0.99);
      if (m.v[o + 1] < HEAD_C[1] - HEAD_R * 0.85) { m.v[o + 2] -= 0.012; m.v[o + 1] += 0.01; }
      m.v[o + 6] = faceReg[0] + u * faceReg[2];
      m.v[o + 7] = faceReg[1] + v * faceReg[3];
    }
  }

  function hatMesh(m, look, hairCol, pats) {
    const hat = look.hat, hair = look.hair;
    const hc = look.hatColor || [0.2, 0.2, 0.2];
    const s = m.n;
    const cap = (r, sy, dy, col, cut, pz) => {
      const st = m.n;
      X.GL.sphere(m, HEAD_C[0], HEAD_C[1] + dy, HEAD_C[2] + (pz || 0), r, 12, 8, 1, col, sy);
      const cy = HEAD_C[1] + dy - cut;
      for (let i = st; i < m.n; i++) { const o = i * X.Mesh.STRIDE; if (m.v[o + 1] < cy) m.v[o + 1] = cy + (m.v[o + 1] - cy) * 0.05; }
    };
    if (hat === 'beanie') { cap(HEAD_R * 1.1, 1.05, 0.02, hc, 0.01); X.GL.cyl(m, 0, HEAD_C[1] + 0.005, HEAD_C[2], HEAD_R * 1.13, HEAD_R * 1.12, 0.045, 12, 1, hc.map(v => v * 0.85), false, 0); setUV(m, s, pats.knit, 'side', 6); return; }
    if (hat === 'cap') { cap(HEAD_R * 1.07, 0.9, 0.03, hc, 0.0); X.GL.box(m, 0, HEAD_C[1] + 0.03, HEAD_C[2] - HEAD_R - 0.04, 0.085, 0.008, 0.06, 0, 1, hc.map(v => v * 0.8)); setUV(m, s, pats.white); return; }
    if (hat === 'police' || hat === 'officer') {
      X.GL.cyl(m, 0, HEAD_C[1] + 0.04, HEAD_C[2], HEAD_R * 1.06, HEAD_R * 1.25, 0.09, 14, 1, hc, true, 0);
      X.GL.box(m, 0, HEAD_C[1] + 0.045, HEAD_C[2] - HEAD_R - 0.035, 0.09, 0.008, 0.055, 0, 1, [0.08, 0.08, 0.08]);
      X.GL.cyl(m, 0, HEAD_C[1] + 0.06, HEAD_C[2] - HEAD_R * 1.08, 0.02, 0.02, 0.03, 6, 1, [0.9, 0.75, 0.2], true, 0);
      setUV(m, s, pats.white); return;
    }
    if (hat === 'helmet') { cap(HEAD_R * 1.28, 0.95, 0.035, hc, 0.035); X.GL.cyl(m, 0, HEAD_C[1] + 0.0, HEAD_C[2], HEAD_R * 1.34, HEAD_R * 1.3, 0.025, 14, 1, hc.map(v => v * 0.8), false, 0); setUV(m, s, pats.white); return; }
    if (hat === 'beret') { cap(HEAD_R * 1.12, 0.5, 0.08, hc, 0.03, 0.01); setUV(m, s, pats.white); return; }
    if (hat === 'balaclava') { return; }
    if (!hairCol || hair === 'bald') return;
    if (hair === 'shaved') { cap(HEAD_R * 1.015, HEAD_SY * 0.98, 0.012, hairCol, 0.02, 0.004); }
    else { cap(HEAD_R * 1.05, HEAD_SY * 0.95, 0.018, hairCol, 0.0, 0.012); }
    if (hair === 'bun') X.GL.sphere(m, 0, HEAD_C[1] + 0.07, HEAD_C[2] + 0.11, 0.05, 8, 6, 1, hairCol, 1);
    if (hair === 'long_blond') X.GL.box(m, 0, HEAD_C[1] - 0.1, HEAD_C[2] + 0.075, 0.1, 0.13, 0.04, 0, 1, hairCol);
    if (hair === 'bob') X.GL.box(m, 0, HEAD_C[1] - 0.04, HEAD_C[2] + 0.06, 0.12, 0.08, 0.06, 0, 1, hairCol);
    setUV(m, s, pats.white);
    smoothNormals(m, s);
  }

  function gunMesh(m, w, col) {
    const dark = col || [0.16, 0.16, 0.17];
    const wood = [0.42, 0.26, 0.14];
    const b = (x0, y0, z0, x1, y1, z1, c) => X.GL.box(m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, Math.abs(z1 - z0) / 2, 0, 1, c || dark);
    switch (w) {
      case 'beretta': case 'silenced': {
        const steel = [0.56, 0.6, 0.66], grip = [0.16, 0.15, 0.15];
        b(-0.017, 0.012, -0.19, 0.017, 0.048, 0.02, steel);
        b(-0.015, -0.006, -0.17, 0.015, 0.014, 0.0, [0.4, 0.43, 0.48]);
        b(-0.016, -0.11, -0.005, 0.016, 0.0, 0.038, grip);
        b(-0.004, -0.03, -0.06, 0.004, -0.004, -0.02, [0.3, 0.3, 0.32]);
        b(-0.006, 0.048, -0.185, 0.006, 0.056, -0.175, steel);
        if (w === 'silenced') cylZ(m, -0.36, -0.19, 0.018, 0.005, dark);
        break;
      }
      case 'magnum':
        b(-0.015, 0.02, -0.26, 0.015, 0.045, 0.0); cylZ(m, -0.06, 0.01, 0.03, 0.0, [0.3, 0.3, 0.32]); b(-0.016, -0.11, 0.0, 0.016, 0.02, 0.05, wood);
        break;
      case 'shotgun':
        cylZ(m, -0.72, 0.0, 0.018, 0.045, dark); cylZ(m, -0.6, -0.2, 0.022, 0.012, wood); b(-0.022, -0.02, 0.0, 0.022, 0.05, 0.12, dark); b(-0.025, -0.08, 0.1, 0.025, 0.04, 0.42, wood);
        break;
      case 'm16':
        cylZ(m, -0.62, -0.25, 0.012, 0.04, dark); b(-0.025, 0.0, -0.3, 0.025, 0.08, 0.1); b(-0.012, 0.08, -0.12, 0.012, 0.12, 0.02); b(-0.018, -0.14, -0.1, 0.018, 0.0, -0.05); b(-0.016, -0.1, 0.02, 0.016, 0.0, 0.06); b(-0.022, -0.03, 0.1, 0.022, 0.07, 0.38);
        break;
      case 'kalash':
        cylZ(m, -0.62, -0.25, 0.012, 0.04, dark); b(-0.026, 0.0, -0.32, 0.026, 0.075, 0.1); b(-0.024, -0.02, -0.36, 0.024, 0.04, -0.18, wood); b(-0.02, -0.16, -0.12, 0.02, 0.0, -0.05); b(-0.016, -0.1, 0.02, 0.016, 0.0, 0.06, wood); b(-0.022, -0.04, 0.1, 0.022, 0.06, 0.38, wood);
        break;
      case 'sniper':
        cylZ(m, -0.9, -0.2, 0.013, 0.04, dark); b(-0.024, -0.02, -0.25, 0.024, 0.06, 0.1, wood); cylZ(m, -0.25, 0.05, 0.028, 0.1, [0.1, 0.1, 0.1]); b(-0.024, -0.06, 0.1, 0.024, 0.05, 0.45, wood);
        break;
      case 'crossbow': {
        const steel = [0.34, 0.36, 0.4], cord = [0.86, 0.82, 0.7];
        const seg = (x0, z0, x1, z1, y, hw, hy, c) => X.GL.box(m, (x0 + x1) / 2, y, (z0 + z1) / 2, hw, hy, Math.hypot(x1 - x0, z1 - z0) / 2, Math.atan2(x1 - x0, z1 - z0), 1, c);
        b(-0.021, 0.0, -0.5, 0.021, 0.042, 0.1, wood);
        b(-0.025, -0.06, 0.08, 0.025, 0.036, 0.34, wood);
        b(-0.007, 0.042, -0.49, 0.007, 0.049, -0.14, dark);
        b(-0.015, -0.11, -0.02, 0.015, 0.0, 0.05, wood);
        b(-0.004, -0.045, -0.06, 0.004, 0.0, -0.03, dark);
        b(-0.03, 0.012, -0.5, 0.03, 0.05, -0.455, steel);
        const bend = [[0.03, -0.48], [0.085, -0.475], [0.135, -0.462], [0.175, -0.442], [0.2, -0.418]];
        for (const sd of [-1, 1]) {
          for (let i = 0; i < bend.length - 1; i++) seg(sd * bend[i][0], bend[i][1], sd * bend[i + 1][0], bend[i + 1][1], 0.032, 0.007, 0.012 - i * 0.002, steel);
          seg(sd * 0.2, -0.418, sd * 0.006, -0.18, 0.045, 0.0025, 0.0025, cord);
        }
        b(-0.024, -0.012, -0.56, -0.018, 0.03, -0.5, steel); b(0.018, -0.012, -0.56, 0.024, 0.03, -0.5, steel); b(-0.024, -0.018, -0.566, 0.024, -0.008, -0.556, steel);
        b(-0.0035, 0.05, -0.53, 0.0035, 0.057, -0.19, [0.78, 0.72, 0.6]);
        b(-0.006, 0.047, -0.56, 0.006, 0.06, -0.525, [0.62, 0.64, 0.68]);
        b(-0.0015, 0.057, -0.23, 0.0015, 0.075, -0.19, [0.7, 0.12, 0.1]);
        break;
      }
      case 'harpoon':
        cylZ(m, -0.7, 0.0, 0.03, 0.02, [0.3, 0.35, 0.3]); b(-0.016, -0.1, 0.0, 0.016, 0.0, 0.05); cylZ(m, -0.85, -0.7, 0.012, 0.0, [0.8, 0.8, 0.8]);
        break;
      case 'm60':
        cylZ(m, -0.78, -0.3, 0.016, 0.03, dark); b(-0.04, -0.02, -0.34, 0.04, 0.1, 0.12); b(-0.035, -0.06, -0.3, 0.035, -0.02, -0.12, [0.26, 0.28, 0.2]); b(-0.02, -0.12, 0.02, 0.02, 0.0, 0.06); b(-0.026, -0.04, 0.12, 0.026, 0.06, 0.42, dark);
        break;
      case 'bazooka':
        cylZ(m, -0.7, 0.6, 0.075, 0.0, [0.28, 0.34, 0.22]); b(-0.02, -0.14, -0.05, 0.02, -0.07, 0.02);
        break;
    }
  }
  function cylZ(m, z0, z1, r, yOff, col) {
    const s = m.n;
    X.GL.cyl(m, 0, 0, 0, r, r, z1 - z0, 7, 1, col, true, 0);
    for (let i = s; i < m.n; i++) {
      const o = i * X.Mesh.STRIDE;
      const x = m.v[o], y = m.v[o + 1], z = m.v[o + 2];
      m.v[o] = x; m.v[o + 1] = -z + (yOff || 0) + 0.025; m.v[o + 2] = y + z0;
      const nx = m.v[o + 3], ny = m.v[o + 4], nz = m.v[o + 5];
      m.v[o + 3] = nx; m.v[o + 4] = -nz; m.v[o + 5] = ny;
    }
  }
  MD.cylZ = cylZ;
  MD.gunMesh = function (w) { const m = new X.Mesh(256); gunMesh(m, w); return m; };

  const tplCache = {};
  MD.template = function (look, weapon, key) {
    const k = key + '|' + (weapon || '');
    if (tplCache[k]) return tplCache[k];
    const A = MD.atlas();
    const pats = A.pat || {};
    const m = new X.Mesh(1400);
    const parts = [];
    const skinC = SKIN[look.skin || 0];
    const coat = look.coat, shirt = look.shirt || coat, pants = look.pants, shoes = look.shoes || [0.1, 0.08, 0.06];
    const fem = !!look.female;
    const big = look.big || 1;
    const sw = (fem ? 0.9 : 1) * big;
    const camoPat = look.camo === 'snow' ? pats.snow : look.camo === 'woods' ? pats.woods : look.camo === 'plaid' ? pats.plaid : pats.white;
    const coatPat = look.face === 'prisoner' ? pats.jumpsuit : camoPat;
    part(m, 0, parts, mm => { const s = mm.n; tbox(mm, -0.17 * sw, -0.12, -0.11, 0.17 * sw, 0.14, 0.11, pants, [0.95, 1.0]); setUV(mm, s, look.camo === 'snow' || look.camo === 'woods' ? camoPat : pats.white, 'planar', 1.5); });
    part(m, 1, parts, mm => {
      const s = mm.n;
      tbox(mm, -0.2 * sw, 0.0, -0.12 * big, 0.2 * sw, 0.42, 0.12 * big, coat, fem ? [0.82, 0.95, 0.9, 1] : [0.84, 1.12, 0.92, 1.04]);
      setUV(mm, s, coatPat, 'planar', 1.6);
      if (look.tie || look.shirt) {
        const s2 = mm.n;
        X.GL.box(mm, 0, 0.3, -0.118 * big, 0.055, 0.1, 0.012, 0, 1, shirt);
        if (look.tie) X.GL.box(mm, 0, 0.24, -0.128 * big, 0.018, 0.15, 0.006, 0, 1, look.tie);
        setUV(mm, s2, pats.white);
      }
      if (look.vest) { const s3 = mm.n; tbox(mm, -0.215 * sw, 0.06, -0.135 * big, 0.215 * sw, 0.38, 0.135 * big, look.vest, [0.88, 1.08, 0.95, 1.02]); setUV(mm, s3, pats.vest, 'planar', 2); }
    });
    part(m, 2, parts, mm => {
      const s = mm.n;
      X.GL.cyl(mm, 0, -0.02, 0, 0.055, 0.05, 0.09, 8, 1, skinC, false, 0);
      setUV(mm, s, pats.white);
      const faceKey = look.face || 'xiii';
      const reg = (A.face && A.face[faceKey]) || [0, 0, 0.001, 0.001];
      const s2 = mm.n;
      headMesh(mm, reg);
      tplFaceRanges[k] = [s2, mm.n, faceKey];
      hatMesh(mm, look, HAIR[look.hair] || null, pats);
    });
    for (const [ua, fa, h] of [[3, 4, 5], [6, 7, 8]]) {
      part(m, ua, parts, mm => { const s = mm.n; limb(mm, 0.29, 0.068 * big, 0.055 * big, coat, 7); setUV(mm, s, coatPat, 'side', 2); });
      part(m, fa, parts, mm => { const s = mm.n; limb(mm, 0.27, 0.055 * big, 0.045 * big, coat, 7); setUV(mm, s, coatPat, 'side', 2); });
      part(m, h, parts, mm => { const s = mm.n; tbox(mm, -0.035, -0.1, -0.045, 0.035, 0.0, 0.035, look.gloves ? [0.08, 0.08, 0.08] : skinC); setUV(mm, s, pats.white); });
    }
    for (const [th, sh, ft] of [[9, 10, 11], [12, 13, 14]]) {
      part(m, th, parts, mm => { const s = mm.n; limb(mm, 0.45, 0.095 * big, 0.07 * big, pants, 7); setUV(mm, s, look.camo === 'snow' || look.camo === 'woods' ? camoPat : pats.white, 'side', 2); });
      part(m, sh, parts, mm => { const s = mm.n; limb(mm, 0.45, 0.068 * big, 0.052 * big, pants, 7); setUV(mm, s, look.camo === 'snow' || look.camo === 'woods' ? camoPat : pats.white, 'side', 2); });
      part(m, ft, parts, mm => { const s = mm.n; tbox(mm, -0.055, -0.08, -0.19, 0.055, 0.0, 0.06, shoes); setUV(mm, s, pats.white); });
    }
    const gs = m.n;
    if (weapon && weapon !== 'none') part(m, 15, parts, mm => { const s = mm.n; gunMesh(mm, weapon); setUV(mm, s, pats.white); });
    const t = { mesh: m, parts, gunStart: gs, gunEnd: m.n, face: tplFaceRanges[k], tall: look.tall || 1 };
    tplCache[k] = t;
    return t;
  };
  const tplFaceRanges = {};

  MD.setFace = function (tpl, out, faceKey) {
    const A = MD.atlas();
    const fr = tpl.face;
    if (!fr || !A.face) return;
    const from = A.face[fr[2]], to = A.face[faceKey];
    if (!from || !to) return;
    const S = X.Mesh.STRIDE;
    for (let i = fr[0]; i < fr[1]; i++) {
      const o = i * S;
      const u = (tpl.mesh.v[o + 6] - from[0]) / from[2], v = (tpl.mesh.v[o + 7] - from[1]) / from[3];
      out[o + 6] = to[0] + u * to[2]; out[o + 7] = to[1] + v * to[3];
    }
  };

  function eul(m, r) {
    const cy = Math.cos(r[1]), sy = Math.sin(r[1]), cp = Math.cos(r[0]), sp = Math.sin(r[0]), cr = Math.cos(r[2]), sr = Math.sin(r[2]);
    m[0] = cy * cr + sy * sp * sr; m[1] = cp * sr; m[2] = -sy * cr + cy * sp * sr;
    m[3] = -cy * sr + sy * sp * cr; m[4] = cp * cr; m[5] = sy * sr + cy * sp * cr;
    m[6] = sy * cp; m[7] = -sp; m[8] = cy * cp;
  }
  const tmpR = new Float32Array(9);

  MD.skin = function (tpl, pose, root, out, hideGun) {
    const B = BONES.length;
    const mats = MD._mats || (MD._mats = Array.from({ length: B }, () => new Float32Array(12)));
    const k = tpl.tall || 1;
    for (let i = 0; i < B; i++) {
      const b = BONES[i];
      const r = pose.b[i] || ZERO;
      const rr = b.r ? [r[0] + b.r[0], r[1] + b.r[1], r[2] + b.r[2]] : r;
      eul(tmpR, rr);
      const M = mats[i];
      const ox = b.o[0] * k, oy = b.o[1] * k, oz = b.o[2] * k;
      if (b.p < 0) {
        const R = root;
        M[0] = R[0] * tmpR[0] + R[3] * tmpR[1] + R[6] * tmpR[2];
        M[1] = R[1] * tmpR[0] + R[4] * tmpR[1] + R[7] * tmpR[2];
        M[2] = R[2] * tmpR[0] + R[5] * tmpR[1] + R[8] * tmpR[2];
        M[3] = R[0] * tmpR[3] + R[3] * tmpR[4] + R[6] * tmpR[5];
        M[4] = R[1] * tmpR[3] + R[4] * tmpR[4] + R[7] * tmpR[5];
        M[5] = R[2] * tmpR[3] + R[5] * tmpR[4] + R[8] * tmpR[5];
        M[6] = R[0] * tmpR[6] + R[3] * tmpR[7] + R[6] * tmpR[8];
        M[7] = R[1] * tmpR[6] + R[4] * tmpR[7] + R[7] * tmpR[8];
        M[8] = R[2] * tmpR[6] + R[5] * tmpR[7] + R[8] * tmpR[8];
        const px = ox, py = oy + (pose.y || 0), pz = oz + (pose.z || 0);
        M[9] = R[9] + R[0] * px + R[3] * py + R[6] * pz;
        M[10] = R[10] + R[1] * px + R[4] * py + R[7] * pz;
        M[11] = R[11] + R[2] * px + R[5] * py + R[8] * pz;
      } else {
        const P = mats[b.p];
        M[0] = P[0] * tmpR[0] + P[3] * tmpR[1] + P[6] * tmpR[2];
        M[1] = P[1] * tmpR[0] + P[4] * tmpR[1] + P[7] * tmpR[2];
        M[2] = P[2] * tmpR[0] + P[5] * tmpR[1] + P[8] * tmpR[2];
        M[3] = P[0] * tmpR[3] + P[3] * tmpR[4] + P[6] * tmpR[5];
        M[4] = P[1] * tmpR[3] + P[4] * tmpR[4] + P[7] * tmpR[5];
        M[5] = P[2] * tmpR[3] + P[5] * tmpR[4] + P[8] * tmpR[5];
        M[6] = P[0] * tmpR[6] + P[3] * tmpR[7] + P[6] * tmpR[8];
        M[7] = P[1] * tmpR[6] + P[4] * tmpR[7] + P[7] * tmpR[8];
        M[8] = P[2] * tmpR[6] + P[5] * tmpR[7] + P[8] * tmpR[8];
        M[9] = P[9] + P[0] * ox + P[3] * oy + P[6] * oz;
        M[10] = P[10] + P[1] * ox + P[4] * oy + P[7] * oz;
        M[11] = P[11] + P[2] * ox + P[5] * oy + P[8] * oz;
      }
    }
    const S = X.Mesh.STRIDE, src = tpl.mesh.v;
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (const p of tpl.parts) {
      const M = mats[p.bone];
      const hide = hideGun && p.bone === 15;
      for (let i = p.start; i < p.end; i++) {
        const o = i * S;
        const x = src[o], y = src[o + 1], z = src[o + 2];
        if (hide) { out[o] = M[9]; out[o + 1] = M[10]; out[o + 2] = M[11]; continue; }
        const wx = M[0] * x + M[3] * y + M[6] * z + M[9];
        const wy = M[1] * x + M[4] * y + M[7] * z + M[10];
        const wz = M[2] * x + M[5] * y + M[8] * z + M[11];
        out[o] = wx; out[o + 1] = wy; out[o + 2] = wz;
        const nx = src[o + 3], ny = src[o + 4], nz = src[o + 5];
        out[o + 3] = M[0] * nx + M[3] * ny + M[6] * nz;
        out[o + 4] = M[1] * nx + M[4] * ny + M[7] * nz;
        out[o + 5] = M[2] * nx + M[5] * ny + M[8] * nz;
        if (wx < mnx) mnx = wx; if (wy < mny) mny = wy; if (wz < mnz) mnz = wz;
        if (wx > mxx) mxx = wx; if (wy > mxy) mxy = wy; if (wz > mxz) mxz = wz;
      }
    }
    MD.lastBounds = [mnx, mny, mnz, mxx, mxy, mxz];
    MD.lastMats = mats;
    return mats;
  };
  const ZERO = [0, 0, 0];

  MD.rootMatrix = function (pos, yaw, pitch, roll) {
    const R = new Float32Array(12);
    eul(tmpR, [pitch || 0, yaw || 0, roll || 0]);
    R.set(tmpR.subarray(0, 9));
    R[9] = pos[0]; R[10] = pos[1]; R[11] = pos[2];
    return R;
  };
  MD.boneWorld = function (mats, bi, local) {
    const M = mats[bi];
    const x = local[0], y = local[1], z = local[2];
    return [M[0] * x + M[3] * y + M[6] * z + M[9], M[1] * x + M[4] * y + M[7] * z + M[10], M[2] * x + M[5] * y + M[8] * z + M[11]];
  };

  function P(b) { const o = { b: new Array(16) }; for (const k in b) o.b[BI[k]] = b[k]; return o; }
  function blend(a, b, t) {
    const o = { b: new Array(16), y: (a.y || 0) + ((b.y || 0) - (a.y || 0)) * t, z: (a.z || 0) + ((b.z || 0) - (a.z || 0)) * t, pitch: (a.pitch || 0) + ((b.pitch || 0) - (a.pitch || 0)) * t, roll: (a.roll || 0) + ((b.roll || 0) - (a.roll || 0)) * t };
    for (let i = 0; i < 16; i++) {
      const p = a.b[i] || ZERO, q = b.b[i] || ZERO;
      o.b[i] = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    }
    return o;
  }
  function addB(o, name, r) { const i = BI[name]; const p = o.b[i] || ZERO; o.b[i] = [p[0] + r[0], p[1] + r[1], p[2] + r[2]]; }
  MD.blend = blend;

  const POSES = {
    stand: () => P({ rUA: [0.05, 0, 0.1], lUA: [0.05, 0, -0.1], rFA: [0.15, 0, 0], lFA: [0.15, 0, 0] }),
    pistol: () => P({ rUA: [0.3, 0, 0.08], rFA: [0.35, 0, 0], lUA: [0.05, 0, -0.1], lFA: [0.2, 0, 0], rH: [-0.2, 0, 0] }),
    rifle: () => P({ rUA: [0.45, 0, 0.1], rFA: [1.1, 0, 0], lUA: [0.75, 0, 0.35], lFA: [0.9, 0.2, 0], rH: [-0.4, 0, 0], lH: [0, 0, 0] }),
    aim: () => P({ rUA: [1.45, 0, -0.12], rFA: [0.05, 0, 0], lUA: [1.3, 0, 0.42], lFA: [0.3, 0, 0], rH: [0.05, 0, 0], head: [0.05, 0, 0] }),
    aim_rifle: () => P({ rUA: [0.75, 0, 0.3], rFA: [1.25, 0, -0.1], lUA: [1.2, 0, 0.3], lFA: [0.35, 0.3, 0], rH: [-0.5, 0, 0.2], spine: [0, -0.15, 0], head: [0.05, 0.15, 0] }),
    crouch: () => P({ rTh: [1.35, 0, 0.1], lTh: [1.0, 0, -0.1], rSh: [-2.0, 0, 0], lSh: [-1.7, 0, 0], rFt: [0.65, 0, 0], lFt: [0.7, 0, 0], spine: [-0.25, 0, 0], head: [0.2, 0, 0] }),
    kneel: () => Object.assign(P({ rTh: [1.5, 0, 0.1], lTh: [0.1, 0, -0.05], rSh: [-1.55, 0, 0], lSh: [-1.6, 0, 0], rFt: [0.05, 0, 0], lFt: [1.4, 0, 0], spine: [-0.15, 0, 0], head: [0.25, 0, 0], rUA: [0.4, 0, 0.1], lUA: [0.5, 0, -0.1], rFA: [0.6, 0, 0], lFA: [0.8, 0, 0] }), { y: -0.44 }),
    lie: () => Object.assign(P({ head: [0.1, 0.5, 0], rUA: [0.1, 0, 1.0], lUA: [0.3, 0, -0.5], rFA: [0.5, 0, 0], lTh: [0.15, 0, -0.1], rTh: [0.05, 0, 0.15], lSh: [-0.2, 0, 0] }), { pitch: Math.PI / 2, y: 0.15, z: 0 }),
    dead: () => Object.assign(P({ head: [0.25, 0.6, 0], rUA: [0.2, 0, 1.3], lUA: [0.1, 0, -1.2], rFA: [0.4, 0, 0], lFA: [0.6, 0, 0], lTh: [0.2, 0, -0.15], rTh: [0.05, 0, 0.2], lSh: [-0.3, 0, 0] }), { pitch: Math.PI / 2 - 0.02, y: 0.13 }),
    deadf: () => Object.assign(P({ head: [0.1, -0.7, 0], rUA: [2.7, 0, 0.2], lUA: [0.3, 0, -0.9], rFA: [0.4, 0, 0], lFA: [1.0, 0, 0], lTh: [0.1, 0, -0.1], rTh: [0.3, 0, 0.1], rSh: [-0.5, 0, 0] }), { pitch: -Math.PI / 2 + 0.03, y: 0.14 }),
    ko: () => Object.assign(P({ head: [-0.3, 0.8, 0], rUA: [0.6, 0, 0.3], lUA: [1.8, 0, -0.3], rFA: [1.2, 0, 0], lFA: [0.8, 0, 0], rTh: [1.2, 0, 0.2], rSh: [-1.6, 0, 0], lTh: [0.4, 0, -0.1], lSh: [-0.6, 0, 0] }), { roll: Math.PI / 2 - 0.1, y: 0.16 }),
    sit: () => Object.assign(P({ rTh: [1.55, 0, 0.05], lTh: [1.55, 0, -0.05], rSh: [-1.5, 0, 0], lSh: [-1.5, 0, 0], rUA: [0.4, 0, 0.1], lUA: [0.4, 0, -0.1], rFA: [0.9, 0, 0], lFA: [0.9, 0, 0] }), { y: -0.5 }),
    tied: () => Object.assign(P({ rTh: [1.55, 0, 0.1], lTh: [1.55, 0, -0.1], rSh: [-1.5, 0, 0], lSh: [-1.5, 0, 0], rUA: [-0.5, 0, 0.3], lUA: [-0.5, 0, -0.3], rFA: [0.9, 0, 0], lFA: [0.9, 0, 0], head: [0.4, 0, 0.1], spine: [-0.1, 0, 0] }), { y: -0.5 }),
    lean: () => P({ spine: [-0.35, 0, 0], rUA: [0.9, 0, 0.1], lUA: [0.9, 0, -0.1], rFA: [0.8, 0, 0], lFA: [0.8, 0, 0], head: [0.25, 0, 0] }),
    talk: () => P({ rUA: [0.9, 0, 0.35], rFA: [0.9, 0, 0], rH: [0.3, 0, 0], lUA: [0.1, 0, -0.1], lFA: [0.3, 0, 0], head: [0.05, -0.1, 0] }),
    point: () => P({ rUA: [1.5, 0, 0.1], rFA: [0.0, 0, 0], lUA: [0.05, 0, -0.1], lFA: [0.2, 0, 0], head: [0.05, 0, 0] }),
    phone: () => P({ rUA: [0.4, 0, 0.95], rFA: [2.3, 0, 0], rH: [0.2, 0, 0], lUA: [0.05, 0, -0.1], lFA: [0.2, 0, 0], head: [0.05, 0.1, 0.1] }),
    hands_up: () => P({ rUA: [0.2, 0, 2.6], lUA: [0.2, 0, -2.6], rFA: [0.5, 0, 0], lFA: [0.5, 0, 0], head: [0.1, 0, 0] }),
    fall: () => Object.assign(P({ head: [0.6, 0, 0], spine: [0.3, 0, 0], rUA: [2.2, 0, 0.8], lUA: [1.9, 0, -0.9], rFA: [0.4, 0, 0], lFA: [0.5, 0, 0], rTh: [0.4, 0, 0], rSh: [-0.9, 0, 0], lTh: [-0.2, 0, 0] }), { pitch: 0.45 }),
    cower: () => Object.assign(P({ rTh: [1.6, 0, 0.1], lTh: [1.6, 0, -0.1], rSh: [-2.2, 0, 0], lSh: [-2.2, 0, 0], rFt: [0.6, 0, 0], lFt: [0.6, 0, 0], spine: [-0.6, 0, 0], head: [-0.2, 0, 0], rUA: [2.4, 0, -0.3], lUA: [2.4, 0, 0.3], rFA: [1.6, 0, 0], lFA: [1.6, 0, 0] }), { y: -0.55 }),
    think: () => P({ rUA: [0.6, 0, -0.2], rFA: [2.2, 0, 0], lUA: [0.3, 0, 0.3], lFA: [1.6, 0, 0], head: [0.15, 0, 0] }),
    salute: () => P({ rUA: [0.3, 0, 1.5], rFA: [2.4, 0, 0], head: [0, 0, 0] }),
    run: () => P({ spine: [-0.18, 0, 0], rUA: [0.1, 0, 0.1], lUA: [0.1, 0, -0.1], rFA: [1.1, 0, 0], lFA: [1.1, 0, 0] }),
    walk: () => P({ rUA: [0, 0, 0.1], lUA: [0, 0, -0.1], rFA: [0.2, 0, 0], lFA: [0.25, 0, 0] }),
    hostage: () => Object.assign(P({ rUA: [0.3, 0, 0.3], lUA: [0.3, 0, -0.3], rFA: [0.8, 0, 0], lFA: [0.8, 0, 0], head: [-0.3, 0, 0], spine: [0.1, 0, 0], rTh: [0.5, 0, 0], lTh: [0.5, 0, 0], rSh: [-0.8, 0, 0], lSh: [-0.8, 0, 0] }), { y: -0.22 }),
    carried: () => Object.assign(P({ head: [0.6, 0, 0], rUA: [0.3, 0, 0.3], lUA: [0.3, 0, -0.3] }), { pitch: -1.4, y: 1.1 }),
    carrying: () => P({ rUA: [0.9, 0, 0.2], lUA: [0.9, 0, -0.2], rFA: [1.0, 0, 0], lFA: [1.0, 0, 0] })
  };
  MD.POSES = POSES;
  MD.pose = function (name, t) {
    const f = POSES[name] || POSES.stand;
    const p = f();
    if (name === 'walk' || name === 'run') cycle(p, t || 0, name === 'run' ? 1.4 : 0.8, name === 'run');
    if (name === 'talk') { addB(p, 'rUA', [Math.sin((t || 0) * 3) * 0.12, 0, 0]); addB(p, 'rFA', [Math.sin((t || 0) * 4) * 0.2, 0, 0]); }
    return p;
  };

  function cycle(p, ph, amp, run) {
    const s = Math.sin(ph), c = Math.cos(ph);
    addB(p, 'rTh', [s * 0.42 * amp, 0, 0]);
    addB(p, 'lTh', [-s * 0.42 * amp, 0, 0]);
    addB(p, 'rUA', [-s * 0.3 * amp, 0, 0]);
    addB(p, 'lUA', [s * 0.3 * amp, 0, 0]);
    addB(p, 'rSh', [-Math.max(0, -c) * 0.9 * amp - 0.1, 0, 0]);
    addB(p, 'lSh', [-Math.max(0, c) * 0.9 * amp - 0.1, 0, 0]);
    addB(p, 'rFt', [Math.max(0, s) * 0.2, 0, 0]);
    addB(p, 'lFt', [Math.max(0, -s) * 0.2, 0, 0]);
    p.y = (p.y || 0) - Math.abs(Math.sin(ph)) * (run ? 0.05 : 0.025) + (run ? -0.04 : 0);
    addB(p, 'spine', [0, s * 0.08 * amp, 0]);
    addB(p, 'hips', [0, -s * 0.06 * amp, 0]);
  }

  MD.animate = function (ch, time, o) {
    o = o || {};
    const wpn = ch.weapon && ch.weapon !== 'none' ? ch.weapon : null;
    const twoHand = wpn && wpn !== 'beretta' && wpn !== 'silenced' && wpn !== 'magnum';
    const phase = (ch.walkPh || 0);
    if (ch.state === 'dead' || ch.state === 'ko') {
      const dt = time - ch.deathT;
      const kind = ch.state === 'ko' ? 'ko' : ch.deathKind;
      const target = kind === 'ko' ? POSES.ko() : kind === 'front' ? POSES.deadf() : POSES.dead();
      if (dt >= 0.9) return target;
      const start = ch.lastPose || POSES.stand();
      if (kind === 'head' && dt < 0.25) {
        const p = blend(start, POSES.stand(), 0.5);
        addB(p, 'head', [0.9 * (dt / 0.25), 0, 0]);
        addB(p, 'spine', [0.25 * (dt / 0.25), 0, 0]);
        addB(p, 'rUA', [0.4, 0, 0.6 * dt / 0.25]); addB(p, 'lUA', [0.4, 0, -0.6 * dt / 0.25]);
        return p;
      }
      const t0 = kind === 'head' ? 0.25 : 0;
      const k = X.clamp((dt - t0) / (0.9 - t0), 0, 1);
      const e = k * k * (3 - 2 * k);
      const mid = kind === 'ko' ? blend(POSES.stand(), POSES.crouch(), 0.8) : blend(POSES.fall(), POSES.stand(), 0.2);
      if (e < 0.4) return blend(start, mid, e / 0.4);
      return blend(mid, target, (e - 0.4) / 0.6);
    }
    if (ch.state === 'hostage') return POSES.hostage();
    if (ch.carried) return POSES.carried();
    if (ch.pose && POSES[ch.pose]) return MD.pose(ch.pose, time + phase);
    const sp = ch.speed || 0;
    const crouch = ch.crouch > 0.5;
    const aiming = o.aiming;
    let p;
    if (crouch) p = POSES.crouch();
    else if (sp > 0.3) { p = sp > 2.6 ? POSES.run() : POSES.walk(); cycle(p, phase, sp > 2.6 ? 1.3 : Math.min(1, sp / 1.5) * 0.9, sp > 2.6); }
    else { p = POSES.stand(); p.y = Math.sin(time * 1.6 + phase) * 0.006; }
    let arms;
    if (wpn) arms = aiming ? (twoHand ? POSES.aim_rifle() : POSES.aim()) : (twoHand ? POSES.rifle() : POSES.pistol());
    if (arms) for (const n of ['rUA', 'rFA', 'rH', 'lUA', 'lFA', 'lH']) p.b[BI[n]] = arms.b[BI[n]] || ZERO;
    if (arms && aiming) { p.b[BI.spine] = arms.b[BI.spine] || p.b[BI.spine]; }
    if (aiming && o.pitch) addB(p, 'spine', [-o.pitch * 0.5, 0, 0]);
    if (aiming && o.pitch) addB(p, 'head', [-o.pitch * 0.4, 0, 0]);
    if (o.fireT !== undefined && time - o.fireT < 0.12) {
      const k = 1 - (time - o.fireT) / 0.12;
      addB(p, 'rUA', [0.12 * k, 0, 0]); addB(p, 'lUA', [0.1 * k, 0, 0]); addB(p, 'spine', [0.05 * k, 0, 0]);
    }
    if (ch.hitT !== undefined && time - ch.hitT < 0.3) {
      const k = 1 - (time - ch.hitT) / 0.3;
      addB(p, 'spine', [0.3 * k, 0, 0]); addB(p, 'head', [0.3 * k, 0, 0]);
    }
    if (!wpn && sp <= 0.3 && !crouch) { addB(p, 'rUA', [0, 0, Math.sin(time * 1.3 + phase) * 0.02]); }
    return p;
  };

  MD.item = function (kind, w) {
    const m = new X.Mesh(256);
    const A = MD.atlas(); const pats = A.pat || {};
    const box = (x, y, z, hx, hy, hz, c, pat, sc) => { const s = m.n; X.GL.box(m, x, y, z, hx, hy, hz, 0, 1, c); setUV(m, s, pat || pats.white, 'planar', sc || 3); };
    switch (kind) {
      case 'medkit': box(0, 0.1, 0, 0.2, 0.1, 0.14, [1, 1, 1], pats.medkit, 2.4); break;
      case 'food': { const s = m.n; X.GL.cyl(m, -0.12, 0.04, 0, 0.04, 0.04, 0.24, 8, 1, [1, 1, 1], true, 0); setUV(m, s, pats.hotdog, 'side', 3); for (let i = s; i < m.n; i++) { const o = i * 11; const y = m.v[o + 1]; m.v[o + 1] = 0.04 + (m.v[o] + 0.12); m.v[o] = y - 0.16; } break; }
      case 'vest': box(0, 0.05, 0, 0.25, 0.05, 0.3, [0.22, 0.24, 0.2], pats.vest, 2); break;
      case 'helmet': { const s = m.n; X.GL.sphere(m, 0, 0.02, 0, 0.16, 10, 5, 1, [0.3, 0.34, 0.28], 0.7); setUV(m, s, pats.white); break; }
      case 'lockpick': box(0, 0.02, 0, 0.1, 0.02, 0.05, [0.4, 0.2, 0.1], pats.leather); break;
      case 'hook': { const s = m.n; X.GL.cyl(m, 0, 0.0, 0, 0.12, 0.12, 0.05, 10, 1, [0.72, 0.64, 0.4], true, 0); X.GL.box(m, 0, 0.08, 0, 0.02, 0.1, 0.02, 0, 1, [0.4, 0.4, 0.42]); setUV(m, s, pats.white); break; }
      case 'key': box(0, 0.01, 0, 0.08, 0.01, 0.03, [0.9, 0.75, 0.3]); box(0.12, 0.01, 0, 0.05, 0.006, 0.035, [1, 1, 1], pats.keytag, 6); break;
      case 'doc': box(0, 0.015, 0, 0.16, 0.015, 0.22, [1, 1, 1], pats.doc, 2.2); break;
      case 'knives': case 'knife': for (let i = 0; i < 3; i++) { box(-0.06 + i * 0.06, 0.01, 0, 0.012, 0.008, 0.14, [0.8, 0.82, 0.85]); box(-0.06 + i * 0.06, 0.012, 0.16, 0.014, 0.012, 0.05, [0.2, 0.15, 0.1]); } break;
      case 'grenades': { const s = m.n; for (const x of [-0.07, 0.07]) X.GL.sphere(m, x, 0.06, 0, 0.06, 8, 6, 1, [0.25, 0.32, 0.2], 1.25); setUV(m, s, pats.white); break; }
      case 'ammo': box(0, 0.07, 0, 0.14, 0.07, 0.09, [1, 1, 1], pats.ammo, 3); break;
      case 'keycard': box(0, 0.005, 0, 0.05, 0.005, 0.08, [1, 1, 1], pats.card, 8); break;
      case 'photo': box(0, 0.005, 0, 0.08, 0.004, 0.11, [1, 1, 1], pats.photo, 5); break;
      case 'dossier': box(0, 0.02, 0, 0.17, 0.02, 0.23, [1, 1, 1], pats.dossier, 2.2); break;
      case 'weapon': {
        const s = m.n;
        gunMesh(m, w === 'knife' ? null : w === 'grenade' ? null : w);
        if (w === 'knife') { for (let i = 0; i < 3; i++) { X.GL.box(m, -0.06 + i * 0.06, 0.01, 0, 0.012, 0.008, 0.14, 0, 1, [0.8, 0.82, 0.85]); } }
        if (w === 'grenade') X.GL.sphere(m, 0, 0.06, 0, 0.06, 8, 6, 1, [0.25, 0.32, 0.2], 1.25);
        setUV(m, s, pats.white);
        if (w !== 'knife' && w !== 'grenade') {
          for (let i = s; i < m.n; i++) {
            const o = i * 11;
            const x = m.v[o], y = m.v[o + 1];
            m.v[o] = y; m.v[o + 1] = -x + 0.03;
            const nx = m.v[o + 3], ny = m.v[o + 4];
            m.v[o + 3] = ny; m.v[o + 4] = -nx;
          }
        }
        break;
      }
      default: box(0, 0.08, 0, 0.1, 0.08, 0.1, [0.8, 0.7, 0.3]);
    }
    return m;
  };

  MD.object = function (kind) {
    const m = new X.Mesh(256);
    const A = MD.atlas(); const pats = A.pat || {};
    const s = m.n;
    const wood = [0.55, 0.36, 0.2];
    switch (kind) {
      case 'chair':
        X.GL.box(m, 0, 0.45, 0, 0.21, 0.025, 0.21, 0, 1, wood);
        X.GL.box(m, 0, 0.72, 0.19, 0.21, 0.25, 0.02, 0, 1, wood);
        for (const x of [-0.18, 0.18]) for (const z of [-0.18, 0.18]) X.GL.box(m, x, 0.22, z, 0.02, 0.22, 0.02, 0, 1, wood.map(v => v * 0.8));
        break;
      case 'stool':
        X.GL.cyl(m, 0, 0.5, 0, 0.17, 0.17, 0.05, 10, 1, wood, true, 0);
        for (const a of [0, 2.1, 4.2]) X.GL.box(m, Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12, 0.02, 0.25, 0.02, 0, 1, wood);
        break;
      case 'bottle':
        X.GL.cyl(m, 0, 0, 0, 0.038, 0.038, 0.2, 8, 1, [0.2, 0.45, 0.2], true, 0);
        X.GL.cyl(m, 0, 0.2, 0, 0.038, 0.015, 0.06, 8, 1, [0.2, 0.45, 0.2], false, 0);
        X.GL.cyl(m, 0, 0.26, 0, 0.015, 0.015, 0.05, 6, 1, [0.2, 0.45, 0.2], true, 0);
        break;
      case 'ashtray':
        X.GL.cyl(m, 0, 0, 0, 0.09, 0.08, 0.035, 10, 1, [0.55, 0.6, 0.62], true, 0);
        break;
      case 'broom':
        X.GL.cyl(m, 0, 0.18, 0, 0.015, 0.015, 1.25, 6, 1, [0.6, 0.45, 0.25], true, 0);
        X.GL.box(m, 0, 0.09, 0, 0.13, 0.09, 0.04, 0, 1, [0.75, 0.62, 0.3]);
        break;
      case 'shovel':
        X.GL.cyl(m, 0, 0.3, 0, 0.018, 0.018, 1.0, 6, 1, [0.5, 0.36, 0.2], true, 0);
        X.GL.box(m, 0, 0.15, 0, 0.12, 0.15, 0.015, 0, 1, [0.45, 0.46, 0.48]);
        break;
      case 'extinguisher':
        X.GL.cyl(m, 0, 0, 0, 0.08, 0.08, 0.5, 10, 1, [0.8, 0.12, 0.08], true, 0);
        X.GL.box(m, 0, 0.55, 0, 0.02, 0.05, 0.06, 0, 1, [0.2, 0.2, 0.2]);
        break;
      case 'lamp':
        X.GL.cyl(m, 0, 0, 0, 0.08, 0.08, 0.02, 8, 1, [0.3, 0.45, 0.3], true, 0);
        X.GL.cyl(m, 0, 0.02, 0, 0.012, 0.012, 0.3, 5, 1, [0.2, 0.2, 0.2], true, 0);
        X.GL.cyl(m, 0, 0.3, 0, 0.12, 0.05, 0.1, 10, 1, [0.3, 0.45, 0.3], true, 0);
        break;
      default:
        X.GL.box(m, 0, 0.1, 0, 0.1, 0.1, 0.1, 0, 1, [0.6, 0.6, 0.6]);
    }
    setUV(m, s, pats.white);
    return m;
  };

  MD.proj = function (kind) {
    const m = new X.Mesh(64);
    const A = MD.atlas(); const pats = A.pat || {};
    const s = m.n;
    if (kind === 'knife') { X.GL.box(m, 0, 0, -0.08, 0.012, 0.005, 0.1, 0, 1, [0.85, 0.87, 0.9]); X.GL.box(m, 0, 0, 0.06, 0.014, 0.012, 0.05, 0, 1, [0.2, 0.14, 0.1]); }
    else if (kind === 'bolt') { X.GL.box(m, 0, 0, 0, 0.008, 0.008, 0.25, 0, 1, [0.5, 0.35, 0.2]); X.GL.box(m, 0, 0, -0.25, 0.015, 0.015, 0.03, 0, 1, [0.7, 0.7, 0.75]); }
    else if (kind === 'harpoon') { X.GL.box(m, 0, 0, 0, 0.01, 0.01, 0.4, 0, 1, [0.8, 0.8, 0.8]); X.GL.box(m, 0, 0, -0.4, 0.03, 0.01, 0.04, 0, 1, [0.8, 0.8, 0.8]); }
    else if (kind === 'rocket') { X.GL.cyl(m, 0, -0.3, 0, 0.06, 0.06, 0.5, 8, 1, [0.3, 0.35, 0.25], true, 0); X.GL.cyl(m, 0, 0.2, 0, 0.06, 0.0, 0.15, 8, 1, [0.6, 0.2, 0.1], false, 0); }
    else if (kind === 'grenade') { X.GL.sphere(m, 0, 0, 0, 0.055, 8, 6, 1, [0.25, 0.32, 0.2], 1.25); X.GL.box(m, 0, 0.07, 0, 0.012, 0.02, 0.012, 0, 1, [0.4, 0.4, 0.4]); }
    setUV(m, s, pats.white);
    if (kind === 'rocket') for (let i = s; i < m.n; i++) { const o = i * 11; const y = m.v[o + 1], z = m.v[o + 2]; m.v[o + 1] = z; m.v[o + 2] = -y; const ny = m.v[o + 4], nz = m.v[o + 5]; m.v[o + 4] = nz; m.v[o + 5] = -ny; }
    return m;
  };

  MD.comicProp = function (kind) {
    const m = new X.Mesh(64);
    const A = MD.atlas(); const pats = A.pat || {};
    const s = m.n;
    if (kind === 'key') { X.GL.box(m, -0.05, 0, 0, 0.06, 0.006, 0.014, 0, 1, [0.9, 0.75, 0.3]); X.GL.cyl(m, -0.12, -0.006, 0, 0.025, 0.025, 0.012, 10, 1, [0.9, 0.75, 0.3], true, 0); X.GL.box(m, 0.08, 0, 0.0, 0.05, 0.004, 0.032, 0.25, 1, [1, 1, 1]); }
    else if (kind === 'photo') X.GL.box(m, 0, 0, 0, 0.08, 0.003, 0.11, 0, 1, [1, 1, 1]);
    else if (kind === 'newspaper') X.GL.box(m, 0, 0, 0, 0.15, 0.004, 0.2, 0, 1, [1, 1, 1]);
    else if (kind === 'dossier') X.GL.box(m, 0, 0, 0, 0.17, 0.02, 0.23, 0, 1, [1, 1, 1]);
    else if (kind === 'tattoo') {
      m.quadPts([[0.05, -0.022, -0.003], [-0.05, -0.022, -0.003], [-0.05, 0.022, -0.003], [0.05, 0.022, -0.003]], [0, 0, -1], [[0, 1], [1, 1], [1, 0], [0, 0]], [1, 1, 1]);
      for (let i = s; i < m.n; i++) { const o = i * 11; const q = region(pats.tattoo, 0.1 + 0.8 * m.v[o + 6], 0.2 + 0.6 * m.v[o + 7]); m.v[o + 6] = q[0]; m.v[o + 7] = q[1]; }
      return m;
    }
    const pat = kind === 'key' ? pats.keytag : kind === 'photo' ? pats.photo : kind === 'newspaper' ? pats.newspaper : pats.dossier;
    for (let i = s; i < m.n; i++) {
      const o = i * 11;
      const isTag = kind !== 'key' || m.v[o] > 0.02;
      const u = isTag ? (kind === 'key' ? (m.v[o] - 0.03) / 0.1 : m.v[o] / (kind === 'newspaper' ? 0.3 : 0.16) + 0.5) : 0.5;
      const v = isTag ? (kind === 'key' ? m.v[o + 2] / 0.064 + 0.5 : m.v[o + 2] / (kind === 'newspaper' ? 0.4 : 0.22) + 0.5) : 0.5;
      const q = region(isTag ? pat : pats.white, X.clamp(u, 0, 1), X.clamp(v, 0, 1));
      m.v[o + 6] = q[0]; m.v[o + 7] = q[1];
    }
    return m;
  };

  MD.viewmodel = function (w, skin, sleeve, obj) {
    const m = new X.Mesh(512);
    const A = MD.atlas(); const pats = A.pat || {};
    const s = m.n;
    const sk = SKIN[skin || 0], sl = sleeve || [0.2, 0.24, 0.32];
    const hand = (x, y, z, fist, side) => {
      const h0 = m.n;
      tbox(m, x - 0.036, y - 0.04, z - 0.05, x + 0.036, y + 0.035, z + 0.045, sk);
      tbox(m, x - 0.034, y - 0.034, z - 0.075, x + 0.034, y + (fist ? 0.02 : 0.03), z - 0.045, sk);
      tbox(m, x + side * 0.03, y - 0.025, z - 0.035, x + side * 0.05, y + 0.01, z + 0.01, sk);
      smoothNormals(m, h0);
      const s0 = m.n;
      cylZ(m, z + 0.035, z + 0.34, 0.043, 0, sl);
      for (let i = s0; i < m.n; i++) { const o = i * 11; m.v[o] += x + (m.v[o + 2] - z) * 0.12 * side; m.v[o + 1] += y - 0.025 - (m.v[o + 2] - z) * 0.18; }
      const c0 = m.n;
      cylZ(m, z + 0.03, z + 0.07, 0.047, 0, [0.85, 0.82, 0.74]);
      for (let i = c0; i < m.n; i++) { const o = i * 11; m.v[o] += x; m.v[o + 1] += y - 0.025; }
    };
    const parts = { gun: [0, 0], rh: [0, 0], lh: [0, 0] };
    const g0 = m.ni;
    if (obj) {
      const om = MD.object(obj);
      const long = obj === 'broom' || obj === 'shovel';
      m.append(om, X.M4.trs(0.02, long ? -0.5 : -0.12, long ? -0.02 : -0.12, 0, long ? 0.2 : 0.5, 0.25, 1));
    } else if (w && w !== 'fists' && w !== 'knife' && w !== 'grenade') gunMesh(m, w);
    else if (w === 'knife') { X.GL.box(m, 0, 0.0, -0.13, 0.011, 0.007, 0.1, 0, 1, [0.86, 0.88, 0.92]); X.GL.box(m, 0, 0.0, -0.02, 0.015, 0.013, 0.035, 0, 1, [0.22, 0.15, 0.1]); }
    else if (w === 'grenade') X.GL.sphere(m, 0, 0.03, -0.05, 0.05, 8, 6, 1, [0.25, 0.32, 0.2], 1.25);
    parts.gun = [g0, m.ni];
    const ri = m.ni;
    const two = w && w !== 'fists' && w !== 'knife' && w !== 'grenade' && w !== 'beretta' && w !== 'silenced' && w !== 'magnum' && !obj;
    if (w === 'fists') hand(0, 0, 0, true, 1);
    else hand(0, -0.065, 0.035, true, 1);
    parts.rh = [ri, m.ni];
    const l0 = m.ni;
    if (two) hand(-0.01, -0.035, w === 'bazooka' ? -0.25 : -0.3, false, -1);
    else if (w === 'beretta' || w === 'silenced' || w === 'magnum') hand(-0.035, -0.08, 0.05, true, -1);
    else if (w === 'fists') hand(0, 0, 0, true, -1);
    parts.lh = [l0, m.ni];
    setUV(m, s, pats.white);
    return { mesh: m, parts };
  };

  MD.skinColor = i => SKIN[i || 0];
  MD.hairColor = h => HAIR[h];
})(globalThis.XIII = globalThis.XIII || {});
