(function (P) {
  'use strict';
  const O = P.Orn, A = P.Art, I = P.Icons;
  const { rng, TUNE } = P;
  const { K, INK, TAU, ell, rrect, poly, limb, finish, clipDo } = A;
  const WALL_TOP = 44, COUNTER_TOP = 146, COUNTER_FRONT = 160, COUNTER_BOTTOM = 212;

  function wood(ctx, x, y, w, h, base, seed) {
    const r = rng(seed || 3);
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = O.shade(base, -0.18);
    ctx.lineWidth = 0.6;
    for (let i = 0; i < h / 3; i++) {
      const yy = y + r() * h;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 2, x + w * 0.7, yy + (r() - 0.5) * 2, x + w, yy + (r() - 0.5) * 1.5); ctx.stroke();
    }
  }

  function plaster(ctx, x, y, w, h, top, bottom, seed) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const r = rng(seed || 11);
    for (let i = 0; i < w * h / 60; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(120,80,40,0.06)' : 'rgba(255,250,235,0.08)';
      ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * 2, 1 + r() * 1.5);
    }
  }

  function niche(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w * 0.5);
    ctx.quadraticCurveTo(x, y, x + w / 2, y - w * 0.12);
    ctx.quadraticCurveTo(x + w, y, x + w, y + w * 0.5);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    finish(ctx, '#b88a58', '#6a4a2a', 1);
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(60,30,10,0.35)'; ctx.fillRect(x, y - 10, w, 6 + h * 0.25);
    ctx.fillStyle = 'rgba(60,30,10,0.25)'; ctx.fillRect(x, y, 3, h);
    ctx.restore();
    ctx.fillStyle = '#e8d2a8'; ctx.fillRect(x - 1, y + h - 1.5, w + 2, 2.5);
  }

  function chili(ctx, x, y, n, seed) {
    const r = rng(seed);
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + n * 4 + 4); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -1 : 1;
      ctx.save(); ctx.translate(x, y + 4 + i * 4); ctx.rotate(s * (0.5 + r() * 0.3));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 5, 1.6, s * 8, 0.4); ctx.quadraticCurveTo(s * 4, -1.2, 0, 0); ctx.closePath();
      finish(ctx, '#c8201a', '#6a0a08', 0.6);
      ctx.restore();
    }
  }

  function garlicBraid(ctx, x, y, n) {
    ctx.strokeStyle = '#b89a60'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + n * 5); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -2.2 : 2.2;
      ell(ctx, x + s, y + 3 + i * 5, 2.6, 2.4, '#f2ead8', '#8a7a5a', 0.6);
      ctx.strokeStyle = '#d8ccb0'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x + s, y + 1 + i * 5); ctx.lineTo(x + s, y + 5 + i * 5); ctx.stroke();
    }
  }

  function lattice(ctx, x, y, w, h, seed) {
    rrect(ctx, x - 3, y - 3, w + 6, h + 6, 2, '#6a3e22', INK, 1);
    ctx.fillStyle = '#fff3c8';
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,210,120,0.2)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 1.4;
    const c = 9;
    for (let i = -h; i < w + h; i += c) {
      ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + i + h, y); ctx.lineTo(x + i, y + h); ctx.stroke();
    }
    ctx.fillStyle = '#7a4a26';
    for (let i = 0; i < w; i += c) for (let j = 0; j < h; j += c) { O.star8(ctx, x + i + c / 2, y + j + c / 2, 2.4); ctx.fill(); }
    ctx.restore();
  }

  function samovarBody(ctx, cx, base) {
    const gold = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
    gold.addColorStop(0, '#9a5a1a'); gold.addColorStop(0.35, '#f6d070'); gold.addColorStop(0.6, '#d49a3a'); gold.addColorStop(1, '#7a4210');
    rrect(ctx, cx - 11, base - 6, 22, 6, 2, gold, INK);
    poly(ctx, [[cx - 7, base - 6], [cx - 9, base - 12], [cx + 9, base - 12], [cx + 7, base - 6]], gold, INK);
    ctx.beginPath();
    ctx.moveTo(cx - 13, base - 12);
    ctx.bezierCurveTo(cx - 17, base - 30, cx - 15, base - 46, cx - 9, base - 52);
    ctx.lineTo(cx + 9, base - 52);
    ctx.bezierCurveTo(cx + 15, base - 46, cx + 17, base - 30, cx + 13, base - 12);
    ctx.closePath();
    finish(ctx, gold, INK, 1.2);
    ctx.strokeStyle = '#8a5010'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 12 + i * 6, base - 14); ctx.lineTo(cx - 10 + i * 5, base - 50); ctx.stroke(); }
    for (let i = 0; i < 3; i++) A.coin(ctx, cx - 7 + i * 7, base - 36, 2.2);
    rrect(ctx, cx - 7, base - 58, 14, 6, 2, gold, INK);
    rrect(ctx, cx - 3, base - 64, 6, 6, 1, '#6a4a2a', INK, 0.8);
    rrect(ctx, cx - 16, base - 30, 5, 3, 1, gold, INK, 0.8);
    poly(ctx, [[cx - 16, base - 29], [cx - 20, base - 22], [cx - 18, base - 21], [cx - 14, base - 27]], gold, INK, 0.8);
    ctx.fillStyle = 'rgba(255,255,230,0.5)'; ctx.fillRect(cx - 8, base - 48, 2.5, 30);
  }

  function ochag(ctx, s) {
    const x = s.x, w = s.w, cx = x + w / 2;
    rrect(ctx, x + 2, 122, w - 4, COUNTER_BOTTOM - 122, 6, '#b8643a', INK, 1.2);
    const r = rng(77);
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 3, 123, w - 6, COUNTER_BOTTOM - 124); ctx.clip();
    for (let yy = 123, row = 0; yy < COUNTER_BOTTOM; yy += 7, row++) {
      for (let xx = x + (row % 2 ? -6 : 0); xx < x + w; xx += 13) {
        ctx.fillStyle = O.shade('#b8643a', (r() - 0.5) * 0.25);
        ctx.fillRect(xx + 0.5, yy + 0.5, 12, 6);
      }
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx - 20, COUNTER_BOTTOM);
    ctx.lineTo(cx - 20, 184);
    ctx.quadraticCurveTo(cx - 20, 172, cx, 170);
    ctx.quadraticCurveTo(cx + 20, 172, cx + 20, 184);
    ctx.lineTo(cx + 20, COUNTER_BOTTOM);
    ctx.closePath();
    finish(ctx, '#2a1208', INK, 1.2);
    for (let i = 0; i < 3; i++) rrect(ctx, cx - 16 + i * 10, 202, 12, 4, 1.5, '#5a3218', INK, 0.7);
  }

  function kazanPot(ctx, s) {
    const cx = s.x + s.w / 2;
    const g = ctx.createLinearGradient(cx - 50, 0, cx + 50, 0);
    g.addColorStop(0, '#1a1a1e'); g.addColorStop(0.3, '#4a4a52'); g.addColorStop(0.55, '#2a2a30'); g.addColorStop(1, '#101014');
    ctx.beginPath();
    ctx.moveTo(cx - 52, 128);
    ctx.bezierCurveTo(cx - 50, 160, cx - 26, 170, cx, 170);
    ctx.bezierCurveTo(cx + 26, 170, cx + 50, 160, cx + 52, 128);
    ctx.closePath();
    finish(ctx, g, INK, 1.3);
    rrect(ctx, cx - 62, 124, 12, 7, 3, '#2a2a30', INK, 1);
    rrect(ctx, cx + 50, 124, 12, 7, 3, '#2a2a30', INK, 1);
    ell(ctx, cx, 128, 54, 13, '#26262c', INK, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(cx - 30, 148, 5, 12, 0.3, 0, TAU); ctx.fill();
  }

  function tandoorDome(ctx, s) {
    const cx = s.x + s.w / 2;
    const g = ctx.createRadialGradient(cx - 12, 130, 4, cx, 150, 50);
    g.addColorStop(0, '#f0c898'); g.addColorStop(0.6, '#d49a64'); g.addColorStop(1, '#a8683a');
    ctx.beginPath();
    ctx.moveTo(cx - 34, COUNTER_BOTTOM);
    ctx.bezierCurveTo(cx - 38, 150, cx - 30, 108, cx, 104);
    ctx.bezierCurveTo(cx + 30, 108, cx + 38, 150, cx + 34, COUNTER_BOTTOM);
    ctx.closePath();
    finish(ctx, g, INK, 1.3);
    ctx.strokeStyle = 'rgba(120,70,30,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(cx, 150 + i * 14, 32 - i * 0.5, 4, 0, 0, Math.PI); ctx.stroke(); }
    ell(ctx, cx, 112, 15, 5.5, '#3a1a0c', INK, 1.1);
    ell(ctx, cx, 112, 15, 5.5, null, '#e8b27a', 1.4);
    ctx.fillStyle = '#6a3a1a';
    ctx.beginPath(); ctx.ellipse(cx, 178, 13, 10, 0, Math.PI, TAU); ctx.lineTo(cx + 13, 190); ctx.lineTo(cx - 13, 190); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
  }

  function basket(ctx, x, y, w, h, col) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 3, y + h);
    ctx.lineTo(x + 3, y + h);
    ctx.closePath();
    finish(ctx, col || '#c8984a', INK, 1);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(90,50,10,0.45)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < w; i += 3) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + 2, y + h); ctx.stroke(); }
    for (let j = 2; j < h; j += 3.5) { ctx.beginPath(); ctx.moveTo(x, y + j); ctx.lineTo(x + w, y + j); ctx.stroke(); }
    ctx.restore();
    ell(ctx, x + w / 2, y, w / 2, 2.6, O.shade(col || '#c8984a', -0.15), INK, 0.9);
  }

  function board(ctx, x, y, w) {
    rrect(ctx, x, y, w, 12, 3, '#d8a868', INK, 1);
    ctx.strokeStyle = 'rgba(120,70,30,0.35)'; ctx.lineWidth = 0.6;
    for (let i = 2; i < 12; i += 3) { ctx.beginPath(); ctx.moveTo(x + 3, y + i); ctx.lineTo(x + w - 3, y + i); ctx.stroke(); }
    ell(ctx, x + w - 5, y + 3, 1.6, 1.6, '#8a5a2a', null);
  }

  function carrot(ctx, x, y, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, -2.2); ctx.quadraticCurveTo(10, -1.2, 14, 0); ctx.quadraticCurveTo(10, 1.2, 0, 2.2); ctx.closePath();
    finish(ctx, '#f07a1c', '#8a3a08', 0.7);
    ctx.fillStyle = '#3a9a30'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -2.5); ctx.lineTo(-3, 0); ctx.lineTo(-4, 2.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function onion(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.9, '#e8c890', '#8a6a3a', 0.8);
    ctx.strokeStyle = 'rgba(140,100,50,0.5)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.9); ctx.quadraticCurveTo(x - r * 0.6, y, x, y + r * 0.9); ctx.stroke();
  }

  function tomato(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.88, '#e0302a', '#7a1010', 0.8);
    ctx.fillStyle = '#3a9a30'; ctx.beginPath(); ctx.moveTo(x, y - r * 0.9); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r * 0.5, y - r * 0.75 + Math.sin(a) * r * 0.25); } ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.25, r * 0.22, 0, TAU); ctx.fill();
  }

  function stationSign(ctx, x, y, draw) {
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 11); ctx.lineTo(x, y - 18); ctx.lineTo(x + 7, y - 11); ctx.stroke();
    rrect(ctx, x - 11, y - 11, 22, 16, 3, '#f4e6c4', '#6a4a2a', 1);
    ctx.save(); ctx.translate(x, y - 3); draw(ctx); ctx.restore();
  }

  function tileFront(ctx, x0, x1) {
    const t = 13;
    for (let x = x0, i = 0; x < x1; x += t * 2, i++) {
      for (let row = 0; row < 3; row++) {
        const y = COUNTER_FRONT + 2 + row * t;
        if (y + t > COUNTER_BOTTOM - 4) break;
        const tx = x + (row % 2 ? t : 0);
        for (let k = 0; k < 2; k++) {
          const xx = tx + k * t;
          if (xx >= x1) break;
          ctx.fillStyle = (row + k + i) % 2 ? '#2a6ab0' : '#f4ecd6';
          ctx.fillRect(xx, y, t, t);
          ctx.fillStyle = (row + k + i) % 2 ? '#f4ecd6' : '#2a6ab0';
          O.star8(ctx, xx + t / 2, y + t / 2, t * 0.36);
          ctx.fill();
          ctx.fillStyle = '#2aa0a8';
          ctx.beginPath(); ctx.arc(xx + t / 2, y + t / 2, t * 0.12, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 0.5;
    for (let y = COUNTER_FRONT + 2; y < COUNTER_BOTTOM - 4; y += t) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  }

  function stool(ctx, x, y) {
    A.shadow(ctx, x, y + 2, 9, 3);
    limb(ctx, [[x - 6, y - 8], [x - 7, y + 1]], 2, '#8a5a2a');
    limb(ctx, [[x + 6, y - 8], [x + 7, y + 1]], 2, '#8a5a2a');
    limb(ctx, [[x, y - 8], [x, y + 2]], 2, '#7a4a20');
    ell(ctx, x, y - 9, 9, 3.4, '#b87a3a', INK, 1);
    ell(ctx, x, y - 9.6, 7.6, 2.4, '#c88a4a', null);
  }

  function topchanBase(ctx, t) {
    const x = t.x, y = t.y;
    A.shadow(ctx, x, y + 38, 84, 8, 0.25);
    rrect(ctx, x - 80, y + 18, 160, 20, 3, '#6a3a1e', INK, 1.2);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#4a2410'; ctx.fillRect(x - 74 + i * 18.5, y + 22, 3, 14); }
    ctx.fillStyle = '#8a4e28'; ctx.fillRect(x - 79, y + 18, 158, 3);
    rrect(ctx, x - 82, y - 44, 164, 64, 4, '#7a4424', INK, 1.2);
    for (let i = 0; i < 11; i++) {
      const px = x - 76 + i * 15.2;
      rrect(ctx, px, y - 62, 4, 20, 1.5, '#8a5028', INK, 0.7);
    }
    rrect(ctx, x - 82, y - 66, 164, 5, 2, '#6a3a1e', INK, 1);
    const seed = P.hash('kp' + t.id);
    const ik = O.ikat(seed, 160, 12, ['#b3262e', '#e8b64a', '#1f4f8f', '#f3e6c8', '#2a6a3a'], { kind: 'comb', tileW: 16, tileH: 12, feather: 0.1 });
    const pat = O.patternOf(ctx, ik);
    rrect(ctx, x - 78, y - 40, 156, 56, 5, '#c83a3a', INK, 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 77, y - 39, 154, 54); ctx.clip();
    ctx.fillStyle = pat; ctx.translate(x - 77, y - 39); ctx.fillRect(0, 0, 154, 54); ctx.translate(-(x - 77), -(y - 39));
    ctx.restore();
    rrect(ctx, x - 64, y - 30, 128, 38, 4, '#e8d6a8', '#8a6a3a', 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - 76, y - 38, 152, 4);
  }

  function smallTableShadow(ctx, t) { A.shadow(ctx, t.x, t.y + 16, 34, 6, 0.25); }

  function palas(ctx, x, y, w, h) {
    rrect(ctx, x, y, w, h, 3, '#8e2a2a', INK, 1.2);
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 3, y + 3, w - 6, h - 6); ctx.clip();
    const r = rng(41);
    const cols = ['#d88a3a', '#2a4a7a', '#f0dcb0', '#4a2a1a', '#b84a2a'];
    for (let yy = y + 3, i = 0; yy < y + h; yy += 14, i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x + 3, yy, w - 6, 3);
      for (let xx = x + 8; xx < x + w - 6; xx += 16) {
        ctx.fillStyle = cols[(i + 2) % cols.length];
        ctx.beginPath(); ctx.moveTo(xx, yy + 8); ctx.lineTo(xx + 5, yy + 4); ctx.lineTo(xx + 10, yy + 8); ctx.lineTo(xx + 5, yy + 12); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#f0dcb0'; ctx.lineWidth = 1;
    for (let i = x + 4; i < x + w - 3; i += 3) { ctx.beginPath(); ctx.moveTo(i, y + h); ctx.lineTo(i, y + h + 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, y); ctx.lineTo(i, y - 3); ctx.stroke(); }
  }

  function gate(ctx) {
    ctx.fillStyle = '#c8a070';
    ctx.fillRect(0, 44, 18, 496);
    const r = rng(9);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(90,60,30,0.15)'; ctx.fillRect(r() * 16, 44 + r() * 496, 2 + r() * 4, 1 + r() * 2); }
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(14, 44, 4, 496);
    const sky = ctx.createLinearGradient(0, 470, 0, 540);
    sky.addColorStop(0, '#fff2c8'); sky.addColorStop(1, '#f0c888');
    ctx.fillStyle = sky; ctx.fillRect(0, 468, 18, 72);
    const spill = ctx.createLinearGradient(16, 0, 110, 0);
    spill.addColorStop(0, 'rgba(255,236,180,0.6)'); spill.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = spill;
    ctx.beginPath(); ctx.moveTo(16, 470); ctx.lineTo(110, 486); ctx.lineTo(110, 540); ctx.lineTo(16, 540); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, 468); ctx.lineTo(44, 452); ctx.lineTo(44, 528); ctx.lineTo(18, 540); ctx.closePath();
    const dg = ctx.createLinearGradient(18, 0, 44, 0);
    dg.addColorStop(0, '#5a3212'); dg.addColorStop(1, '#8a5428');
    finish(ctx, dg, INK, 1.2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#4a2810';
    for (let i = 0; i < 4; i++) { O.star8(ctx, 31, 470 + i * 16, 4.4); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,220,160,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, 466); ctx.lineTo(24, 536); ctx.moveTo(38, 458); ctx.lineTo(38, 530); ctx.stroke();
    ctx.restore();
    A.ell(ctx, 40, 492, 1.8, 1.8, '#e8c060', INK, 0.6);
    rrect(ctx, 0, 456, 22, 14, 2, '#6a3a1a', INK, 1.2);
    ctx.fillStyle = '#e8c060'; ctx.fillRect(2, 461, 18, 2);
    rrect(ctx, 22, 488, 70, 44, 4, '#5a6a3a', INK, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(25, 491, 64, 38); ctx.clip();
    ctx.strokeStyle = '#8a9a5a'; ctx.lineWidth = 1.2;
    for (let i = 25; i < 92; i += 5) { ctx.beginPath(); ctx.moveTo(i, 491); ctx.lineTo(i, 529); ctx.stroke(); }
    ctx.restore();
  }

  function pomegranateTree(ctx) {
    const x = 761, y = 520;
    A.shadow(ctx, x, y + 6, 30, 7, 0.28);
    rrect(ctx, x - 22, y - 12, 44, 18, 4, '#b8643a', INK, 1.2);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 20, y - 12, 40, 4);
    limb(ctx, [[x, y - 12], [x - 2, y - 40], [x + 4, y - 64]], 5, '#6a4222');
    limb(ctx, [[x - 2, y - 36], [x - 14, y - 52]], 3, '#6a4222');
    const r = rng(19);
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, d = r() * 28;
      ell(ctx, x + Math.cos(a) * d, y - 70 + Math.sin(a) * d * 0.7, 7 + r() * 5, 5 + r() * 4, i % 3 ? '#3a7a2a' : '#2e6a24', null);
    }
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, d = r() * 26;
      ctx.fillStyle = 'rgba(160,220,90,0.35)'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d - 2, y - 74 + Math.sin(a) * d * 0.6, 3, 2, a, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 7; i++) {
      const a = r() * TAU, d = 6 + r() * 20;
      ell(ctx, x + Math.cos(a) * d, y - 66 + Math.sin(a) * d * 0.6, 3.6, 3.4, '#d8283a', '#6a0a10', 0.7);
      ctx.fillStyle = '#e8b030'; ctx.fillRect(x + Math.cos(a) * d - 0.8, y - 70 + Math.sin(a) * d * 0.6, 1.6, 1.4);
    }
  }

  function kitchenWall(ctx, st, seed) {
    plaster(ctx, 16, WALL_TOP, 768, COUNTER_TOP - WALL_TOP + 2, '#eed8ae', '#dcc08e', seed);
    ctx.fillStyle = 'rgba(80,50,20,0.18)';
    ctx.fillRect(16, WALL_TOP + 16, 768, 10);
    wood(ctx, 0, WALL_TOP, 800, 16, '#5a3218', 5);
    O.girih(ctx, 0, WALL_TOP + 3, 800, 10, seed, ['#1f5fa8', '#2aa0a8', '#f4e6c8', '#c8643c', '#123a6a']);
    ctx.fillStyle = '#3a1e0c'; ctx.fillRect(0, WALL_TOP + 14, 800, 3);
    for (let x = 0; x < 800; x += 10) poly(ctx, [[x, WALL_TOP + 17], [x + 5, WALL_TOP + 23], [x + 10, WALL_TOP + 17]], '#6a3a1a', null);
    niche(ctx, 30, 74, 26, 40);
    I.pialaCup(ctx, 37, 111, 0.55, '#cdbb4a'); I.pialaCup(ctx, 49, 111, 0.55, '#a8401a');
    ctx.save(); ctx.translate(43, 102.5); ctx.scale(0.5, 0.5); I.choynak(ctx, true); ctx.restore();
    niche(ctx, 196, 72, 30, 40);
    ctx.save(); ctx.translate(211, 97); O.rishtan(ctx, 0, 0, 11, 5); ctx.restore();
    ell(ctx, 211, 97, 11, 11, null, INK, 1);
    niche(ctx, 262, 72, 24, 40);
    for (let i = 0; i < 3; i++) rrect(ctx, 266 + i * 6, 96 - i * 3, 5, 16 + i * 3, 1.5, ['#d89a3a', '#a86a2a', '#e8c070'][i], INK, 0.7);
    ctx.save(); ctx.translate(551, 82); O.rishtan(ctx, 0, 0, 17, seed ^ 99); ctx.restore();
    ell(ctx, 551, 82, 17, 17, null, INK, 1.2);
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(543, 66); ctx.lineTo(551, 60); ctx.lineTo(559, 66); ctx.stroke();
    chili(ctx, 126, 64, 9, 3);
    garlicBraid(ctx, 178, 62, 6);
    chili(ctx, 598, 64, 8, 8);
    lattice(ctx, 612, 66, 58, 44, seed);
    niche(ctx, 700, 72, 28, 40);
    I.pialaCup(ctx, 708, 111, 0.52, '#a8401a'); I.pialaCup(ctx, 720, 111, 0.52, '#cdbb4a');
    rrect(ctx, 738, 64, 36, 50, 3, '#8a5a2a', INK, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(741, 67, 30, 44); ctx.clip();
    O.suzani(ctx, 756, 89, 20, seed ^ 7, O.PALETTES.madder);
    ctx.restore();
    ctx.fillStyle = '#f2e4c6';
    ctx.fillRect(16, COUNTER_TOP, 768, COUNTER_FRONT - COUNTER_TOP);
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(16, COUNTER_TOP, 768, 2);
    ctx.fillStyle = 'rgba(120,80,40,0.25)'; ctx.fillRect(16, COUNTER_FRONT - 2, 768, 2);
    tileFront(ctx, 16, 784);
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(16, COUNTER_BOTTOM - 5, 768, 5);
    ctx.fillStyle = 'rgba(40,20,5,0.3)'; ctx.fillRect(16, COUNTER_BOTTOM, 768, 5);
  }

  function stationsStatic(ctx, st) {
    const s = id => st[id];
    const base = COUNTER_TOP + 8;
    samovarBody(ctx, 37, base + 2);
    if (s('teaBlack') || s('teaGreen')) {
      rrect(ctx, 60, base - 3, 72, 6, 2, '#c89a4a', INK, 0.9);
    } else {
      ctx.save(); ctx.translate(84, base - 7); ctx.scale(0.7, 0.7); I.choynak(ctx, false); ctx.restore();
    }
    if (s('compote')) rrect(ctx, 138, base - 2, 40, 5, 2, '#a87a4a', INK, 0.8);
    board(ctx, 190, base - 6, 46);
    if (s('prepSalad')) board(ctx, 246, base - 6, 46);
    stationSign(ctx, 213, 118, c => I.food(c, 'veg', 0, -0.5, 17));
    if (s('prepSalad')) stationSign(ctx, 269, 118, c => I.food(c, 'achichuk', 0, -0.5, 17));
    ochag(ctx, s('kazan'));
    kazanPot(ctx, s('kazan'));
    if (s('tandoor')) tandoorDome(ctx, s('tandoor'));
    if (s('stockSamsa')) { basket(ctx, 516, base - 2, 32, 16, '#c8984a'); stationSign(ctx, 532, 118, c => I.food(c, 'samsa', 0, -0.5, 16)); }
    if (s('stockNon')) { basket(ctx, 554, base - 2, 32, 16, '#b8884a'); stationSign(ctx, 570, 118, c => I.food(c, 'non', 0, -0.5, 17)); }
    rrect(ctx, 594, base - 4, 140, 7, 2, '#8a5a2a', INK, 1);
    for (let i = 0; i < 4; i++) rrect(ctx, 598 + i * 34, base - 6, 28, 5, 2, '#e8d6b0', '#8a6a3a', 0.7);
    stationSign(ctx, 666, 124, c => { c.fillStyle = '#5a3a1a'; c.font = 'bold 6px Tahoma, Verdana, sans-serif'; c.textAlign = 'center'; c.fillText('РАЗДАЧА', 0, 2.2); });
    const bx = 762;
    ctx.beginPath(); ctx.moveTo(bx - 14, base - 18); ctx.lineTo(bx + 14, base - 18); ctx.lineTo(bx + 11, base + 8); ctx.lineTo(bx - 11, base + 8); ctx.closePath();
    const zg = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0);
    zg.addColorStop(0, '#8a9098'); zg.addColorStop(0.4, '#d8dce2'); zg.addColorStop(1, '#6a7078');
    finish(ctx, zg, INK, 1);
    ell(ctx, bx, base - 18, 14, 3.4, '#5a6068', INK, 1);
    ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 14, base - 18); ctx.quadraticCurveTo(bx, base - 34, bx + 14, base - 18); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(60,60,70,0.4)'; ctx.beginPath(); ctx.moveTo(bx - 12, base - 10 + i * 6); ctx.lineTo(bx + 12, base - 10 + i * 6); ctx.stroke(); }
  }

  function buildBackground(game) {
    const L = game.level;
    const seed = 1000 + L.n * 17;
    return A.mk(800, 600, 0, 0, ctx => {
      ctx.fillStyle = '#c98a5a';
      ctx.fillRect(0, 0, 800, 600);
      O.basketweave(ctx, 16, 150, 768, 400, seed, { brick: 12 });
      const shade = ctx.createLinearGradient(0, COUNTER_BOTTOM, 0, 330);
      shade.addColorStop(0, 'rgba(60,30,10,0.35)'); shade.addColorStop(1, 'rgba(60,30,10,0)');
      ctx.fillStyle = shade; ctx.fillRect(16, COUNTER_BOTTOM, 768, 120);
      kitchenWall(ctx, game.st, seed);
      stationsStatic(ctx, game.st);
      gate(ctx);
      ctx.fillStyle = '#c8a070'; ctx.fillRect(784, 44, 16, 496);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(784, 44, 3, 496);
      palas(ctx, 26, 236, 72, 250);
      for (const t of game.tables) {
        if (t.kind === 'topchan') topchanBase(ctx, t);
        else { smallTableShadow(ctx, t); for (const s of t.seats) stool(ctx, s.x, s.y + 2); }
      }
      pomegranateTree(ctx);
      O.leafShadows(ctx, 16, COUNTER_BOTTOM, 768, 150, seed ^ 5, 0.16);
      ctx.strokeStyle = 'rgba(70,40,15,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(16, 66); ctx.bezierCurveTo(200, 80, 420, 60, 784, 74); ctx.stroke();
      const r = rng(seed ^ 31);
      for (let i = 0; i < 38; i++) {
        const x = 20 + r() * 760, y = 60 + r() * 22;
        ell(ctx, x, y, 6 + r() * 4, 4 + r() * 3, r() < 0.5 ? '#4a8a30' : '#3a7a26', '#1e4a14', 0.7);
      }
      for (let i = 0; i < 5; i++) {
        const x = 60 + r() * 680, y = 72 + r() * 10;
        for (let k = 0; k < 7; k++) ell(ctx, x + (k % 3) * 3 - 3, y + Math.floor(k / 3) * 3, 1.8, 1.8, '#8a3a8a', '#4a1a4a', 0.4);
      }
    });
  }

  function progressRing(ctx, x, y, r, frac, col) {
    ell(ctx, x, y, r + 2, r + 2, 'rgba(34,18,8,0.82)', INK, 1);
    const f = Math.max(0, Math.min(1, frac));
    if (f > 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
    ell(ctx, x, y, r + 0.6, r + 0.6, null, 'rgba(255,240,210,0.45)', 0.8);
  }

  function bubble(ctx, x, y, w, h, fill, line) {
    rrect(ctx, x - w / 2, y - h, w, h, 5, fill || '#fffaf0', line || '#3b2417', 1.2);
    poly(ctx, [[x - 4, y - 0.5], [x, y + 5], [x + 4, y - 0.5]], fill || '#fffaf0', null);
    ctx.strokeStyle = line || '#3b2417'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x + 4, y); ctx.stroke();
  }

  function steam(ctx, x, y, t, n, spread, alpha) {
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.6 + i / n) % 1;
      const xx = x + Math.sin(t * 2 + i * 1.7) * spread * (0.4 + ph);
      const yy = y - ph * 28;
      ctx.fillStyle = 'rgba(255,255,255,' + (alpha * (1 - ph)).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(xx, yy, 3 + ph * 6, 2.4 + ph * 4, 0, 0, TAU); ctx.fill();
    }
  }

  function smoke(ctx, x, y, t, n, alpha) {
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.4 + i / n) % 1;
      const xx = x + Math.sin(t * 1.3 + i * 2.1) * 10 * ph;
      ctx.fillStyle = 'rgba(40,40,44,' + ((alpha || 0.55) * (1 - ph)).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(xx, y - ph * 40, 5 + ph * 10, 4 + ph * 7, 0, 0, TAU); ctx.fill();
    }
  }

  function fire(ctx, cx, y, w, t, power) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const fx = cx - w / 2 + (i + 0.5) * w / n;
      const h = (8 + Math.sin(t * 9 + i * 1.9) * 3 + Math.sin(t * 13 + i) * 2) * power;
      ctx.beginPath();
      ctx.moveTo(fx - 3, y);
      ctx.quadraticCurveTo(fx - 3.5, y - h * 0.6, fx + Math.sin(t * 7 + i) * 1.5, y - h);
      ctx.quadraticCurveTo(fx + 3.5, y - h * 0.6, fx + 3, y);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? '#ff8a1a' : '#ffb830';
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,230,120,0.8)';
    ctx.beginPath(); ctx.ellipse(cx, y - 2, w * 0.35, 2.5, 0, 0, TAU); ctx.fill();
  }

  function woodBoard(ctx, x, y, w, h, alarm) {
    ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x + 12, y + 1); ctx.lineTo(x + w / 2, y - 9); ctx.lineTo(x + w - 12, y + 1); ctx.stroke();
    ell(ctx, x + w / 2, y - 9.5, 1.8, 1.8, '#d8b060', INK, 0.7);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alarm ? '#9a3020' : '#8e5a34'); g.addColorStop(1, alarm ? '#4a1008' : '#4a2812');
    rrect(ctx, x, y, w, h, 5, g, INK, 1.3);
    const b = ctx.createLinearGradient(0, y, 0, y + h);
    b.addColorStop(0, 'rgba(255,225,180,0.55)'); b.addColorStop(0.45, 'rgba(255,225,180,0)'); b.addColorStop(1, 'rgba(0,0,0,0.45)');
    rrect(ctx, x + 1.6, y + 1.6, w - 3.2, h - 3.2, 3.6, null, b, 1.1);
    for (const [px, py] of [[x + 4.6, y + 4.6], [x + w - 4.6, y + 4.6], [x + 4.6, y + h - 4.6], [x + w - 4.6, y + h - 4.6]]) ell(ctx, px, py, 1.2, 1.2, '#e8c878', '#5a3a14', 0.5);
  }

  function groove(ctx, x0, x1, y, frac, col, t) {
    rrect(ctx, x0, y - 3, x1 - x0, 6, 3, '#24120a', '#120804', 0.8);
    if (frac <= 0) return;
    const w = Math.max(4, (x1 - x0 - 2) * Math.min(1, frac));
    rrect(ctx, x0 + 1, y - 2, w, 4, 2, col, null);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x0 + 2.5, y - 1.5, Math.max(0, w - 3), 0.9);
    if (frac < 1) ell(ctx, x0 + w - 0.5, y, 2.3, 2.3, 'rgba(255,244,200,' + (0.55 + Math.sin(t * 10) * 0.35).toFixed(2) + ')', null);
  }

  function boardNode(ctx, x, y, mode, icon, t, opts) {
    const o = opts || {};
    const r = 11.5;
    const lively = mode === 'need' || mode === 'start' || mode === 'alarm';
    const pulse = lively ? 1 + Math.sin(t * (mode === 'start' ? 4 : 8)) * 0.07 : 1;
    if (mode === 'need' || mode === 'ready' || mode === 'start' || mode === 'alarm') {
      ctx.fillStyle = mode === 'alarm' ? 'rgba(255,80,40,0.35)' : 'rgba(255,215,90,' + (0.28 + (lively ? Math.sin(t * 8) * 0.12 : 0)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, r + 6, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
    const fill = { off: '#3c2614', idle: '#e8d4ac', done: '#f2e2bc', start: '#ffe9a8', need: '#ffd23a', ready: '#ffe9a8', alarm: '#f06048' }[mode];
    ell(ctx, 0, 0, r, r, fill, INK, 1.2);
    ell(ctx, 0, 0, r - 1.8, r - 1.8, null, mode === 'off' ? 'rgba(255,220,170,0.14)' : 'rgba(255,255,255,0.6)', 1);
    ctx.globalAlpha = mode === 'off' ? 0.42 : 1;
    icon(ctx, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();
    if (mode === 'done') I.glyph(ctx, 'check', x + 8.5, y + 7.5, 11);
    if (o.burn !== undefined) {
      const f = P.clamp(o.burn, 0, 1);
      const warn = o.burnT < 5;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(20,8,2,0.75)'; ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.arc(x, y, r + 3.4, 0, TAU); ctx.stroke();
      ctx.strokeStyle = o.ok ? '#5ad04a' : warn ? (Math.floor(t * 6) % 2 ? '#ff3a1a' : '#ffc030') : '#ffb020';
      ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.arc(x, y, r + 3.4, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.stroke();
      ctx.lineCap = 'round';
    }
  }

  function countTag(ctx, x, y, text) {
    ctx.font = 'bold 10px Tahoma, Verdana, sans-serif';
    const w = ctx.measureText(text).width + 8;
    rrect(ctx, x - w / 2, y - 7, w, 13, 6, '#2a150a', '#f4dca0', 1);
    ctx.fillStyle = '#ffe8a0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  const KAZAN_STAGE = { empty: 0, fry: 1, needVeg: 2, zirvak: 3, needRice: 4, steam: 5, ready: 6, burnt: -1 };
  const KAZAN_NODES = ['meat', 'veg', 'rice', 'plov'];

  function kazanBoard(ctx, game, t) {
    const kz = game.st.kazan, cx = kz.x + kz.w / 2;
    const w = 140, h = 30, x = cx - w / 2, y = 62;
    const ph = KAZAN_STAGE[kz.state];
    woodBoard(ctx, x, y, w, h, ph < 0);
    const ny = y + h / 2, nx = i => x + 18 + i * (w - 36) / 3;
    const times = [TUNE.kazan.fry, TUNE.kazan.zirvak, TUNE.kazan.steam].map(v => v * game.kazanMult);
    const cols = ['#f0641c', '#f7a830', '#fff2c8'];
    for (let i = 0; i < 3; i++) {
      const run = i * 2 + 1;
      const frac = ph > run ? 1 : ph === run ? 1 - kz.t / times[i] : 0;
      groove(ctx, nx(i) + 12, nx(i + 1) - 12, ny, frac, cols[i], t);
    }
    for (let i = 0; i < 4; i++) {
      const at = i * 2;
      let mode = ph < 0 ? 'off' : ph > at ? 'done' : ph === at ? (i === 0 ? 'start' : i === 3 ? 'ready' : 'need') : 'off';
      let id = KAZAN_NODES[i];
      if (ph < 0 && i === 0) { mode = 'alarm'; id = 'broom'; }
      const opts = mode === 'need' ? { burn: kz.t / kz.win, burnT: kz.t, ok: i === 1 && game.hero.hands.includes('veg') } : null;
      boardNode(ctx, nx(i), ny, mode, (c, ix, iy) => I.glyph(c, id, ix, iy, 19), t, opts);
    }
    if (ph === 6) countTag(ctx, nx(3) + 11, ny + 10, '×' + kz.portions);
  }

  function tandoorBoard(ctx, game, t) {
    const s = game.st.tandoor, cx = s.x + s.w / 2;
    const w = 66, h = 30, x = cx - w / 2 + 2, y = 68;
    woodBoard(ctx, x, y, w, h, s.state === 'burnt');
    const ny = y + h / 2, n0 = x + 16, n1 = x + w - 16;
    const frac = s.state === 'bake' ? 1 - s.t / game.bakeTime : s.state === 'done' ? 1 : 0;
    groove(ctx, n0 + 12, n1 - 12, ny, frac, '#f7a830', t);
    const load = s.load || game.tandoorLoad();
    const kinds = Object.keys(load);
    const low = ['stockSamsa', 'stockNon'].some(id => game.st[id] && game.st[id].count < 2);
    const m0 = s.state === 'burnt' ? 'alarm' : s.state === 'empty' ? (low ? 'start' : 'idle') : 'done';
    boardNode(ctx, n0, ny, m0, (c, ix, iy) => I.glyph(c, s.state === 'burnt' ? 'broom' : 'dough', ix, iy + 1, 18), t);
    const m1 = s.state === 'done' ? 'need' : 'off';
    boardNode(ctx, n1, ny, m1, (c, ix, iy) => {
      if (kinds.length > 1) { I.food(c, kinds[1], ix + 3.4, iy + 2.6, 14); I.food(c, kinds[0], ix - 3, iy - 1.6, 14); }
      else I.food(c, kinds[0], ix, iy, 18);
    }, t, s.state === 'done' ? { burn: s.t / s.win, burnT: s.t } : null);
  }

  function potLayer(st) {
    return A.cached('kpot|' + st, () => A.mk(108, 30, 54, 15, ctx => {
      ctx.beginPath(); ctx.ellipse(0, 0, 50, 11.5, 0, 0, TAU); ctx.clip();
      if (st === 'empty') {
        ctx.fillStyle = '#1a1a1e'; ctx.fillRect(-52, -14, 104, 30);
        ctx.fillStyle = 'rgba(255,220,120,0.18)'; ctx.beginPath(); ctx.ellipse(-8, 2, 24, 5, 0, 0, TAU); ctx.fill();
      } else if (st === 'fry' || st === 'needVeg') {
        ctx.fillStyle = grad(ctx, 0, -12, 0, 12, ['#8a4a18', '#5a2a0c']); ctx.fillRect(-52, -14, 104, 30);
        const r = rng(4);
        for (let i = 0; i < 14; i++) {
          const x = -38 + r() * 76, y = -6 + r() * 10;
          I.meatChunk(ctx, x, y, 3.8, 2.8, i + 3);
          if (st === 'needVeg') { ctx.fillStyle = 'rgba(90,40,10,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, 3.8, 2.8, 0, 0, TAU); ctx.fill(); }
        }
      } else if (st === 'zirvak' || st === 'needRice') {
        ctx.fillStyle = grad(ctx, 0, -12, 0, 12, ['#e0702a', '#b0400e']); ctx.fillRect(-52, -14, 104, 30);
        const r = rng(6);
        ctx.lineCap = 'round';
        for (let i = 0; i < 34; i++) { const x = -44 + r() * 88, y = -9 + r() * 15, a = r() * Math.PI; ctx.strokeStyle = r() < 0.6 ? '#ff9a3a' : '#ffc848'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 2.2, y - Math.sin(a) * 1.2); ctx.lineTo(x + Math.cos(a) * 2.2, y + Math.sin(a) * 1.2); ctx.stroke(); }
        for (let i = 0; i < 6; i++) { const x = -30 + r() * 60, y = -6 + r() * 10; I.meatChunk(ctx, x, y, 3.4, 2.4, i + 20); }
      } else if (st === 'steam') {
        ctx.fillStyle = '#e8a848'; ctx.fillRect(-52, -14, 104, 30);
      } else if (st === 'ready') {
        ctx.fillStyle = grad(ctx, 0, -12, 0, 12, ['#f4c060', '#d08a30']); ctx.fillRect(-52, -14, 104, 30);
      } else if (st === 'burnt') {
        ctx.fillStyle = '#1a1210'; ctx.fillRect(-52, -14, 104, 30);
        const r = rng(9);
        for (let i = 0; i < 22; i++) { ctx.fillStyle = r() < 0.5 ? '#3a2a20' : '#0a0a0a'; ctx.fillRect(-44 + r() * 88, -8 + r() * 12, 4, 3); }
      }
    }));
  }

  function potContents(ctx, kz, game, t, kcx) {
    const st = kz.state;
    A.blit(ctx, potLayer(st), kcx, 128);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(kcx, 128, 50, 11.5, 0, 0, TAU); ctx.clip();
    if (st === 'fry' || st === 'needVeg') {
      for (let i = 0; i < 7; i++) { const ph = (t * 2 + i / 7) % 1; ctx.fillStyle = 'rgba(255,236,170,' + (0.7 * (1 - ph)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(kcx - 38 + i * 13, 132 - ph * 3, 1.1 + ph * 1.6, 0, TAU); ctx.fill(); }
    } else if (st === 'zirvak' || st === 'needRice') {
      for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i / 5) % 1; ell(ctx, kcx - 30 + i * 15, 128, 1 + ph * 2.4, 0.6 + ph * 1.4, null, 'rgba(255,224,160,' + (1 - ph).toFixed(3) + ')', 0.7); }
    }
    ctx.restore();
    if (st === 'ready') {
      const cap = game.upKazanCap, n = Math.max(0, Math.min(cap, kz.portions));
      const heap = A.cached('kheap|' + n + '|' + cap, () => A.mk(112, 46, 56, 32, c => { const frac = n / cap; I.plovHeap(c, -2, 0, 20 + 22 * frac, 5 + 11 * frac, 8, frac > 0.2); }));
      A.blit(ctx, heap, kcx, 131);
      ctx.strokeStyle = '#26262c'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.ellipse(kcx, 128, 52.4, 12.2, 0, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(kcx, 128, 54, 13, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    }
  }

  function grad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  function drawStations(ctx, game, t) {
    const st = game.st;
    const kz = st.kazan;
    const kcx = kz.x + kz.w / 2;
    const cooking = ['fry', 'zirvak', 'steam', 'needVeg', 'needRice'].includes(kz.state);
    fire(ctx, kcx, 199, 30, t, cooking ? 1 : kz.state === 'ready' ? 0.5 : 0.25);
    potContents(ctx, kz, game, t, kcx);
    if (kz.state === 'steam') {
      const lg = ctx.createLinearGradient(kcx - 50, 0, kcx + 50, 0);
      lg.addColorStop(0, '#5a3818'); lg.addColorStop(0.4, '#a8743e'); lg.addColorStop(1, '#4a2a10');
      ell(ctx, kcx, 127, 51, 12.5, lg, INK, 1.3);
      ell(ctx, kcx, 124.5, 38, 8.4, '#b88450', '#6a4020', 0.9);
      ctx.strokeStyle = 'rgba(60,30,10,0.45)'; ctx.lineWidth = 0.8;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(kcx + i * 12, 117.5); ctx.lineTo(kcx + i * 14, 133); ctx.stroke(); }
      ell(ctx, kcx, 118, 7, 3, '#6a4020', INK, 0.9);
      rrect(ctx, kcx - 3, 111, 6, 7, 2, '#4a2a12', INK, 0.9);
      steam(ctx, kcx - 44, 124, t, 5, 5, 0.6);
      steam(ctx, kcx + 44, 124, t + 0.5, 5, 5, 0.6);
    }
    if (kz.state === 'ready') steam(ctx, kcx, 116, t, 6, 14, 0.5);
    if (kz.state === 'fry' || kz.state === 'needVeg' || kz.state === 'zirvak') steam(ctx, kcx, 120, t * 1.4, 4, 18, 0.3);
    if ((kz.state === 'needVeg' || kz.state === 'needRice') && kz.t < 6) smoke(ctx, kcx + 10, 120, t, 4, 0.45 * (1 - kz.t / 6));
    if (kz.state === 'burnt') smoke(ctx, kcx, 118, t, 7);
    kazanBoard(ctx, game, t);
    steam(ctx, 37, 90, t * 0.7, 3, 3, 0.35);
    for (const id of ['teaBlack', 'teaGreen']) {
      const s = st[id];
      if (!s) continue;
      const cx = s.x + s.w / 2, base = COUNTER_TOP + 8;
      const green = id === 'teaGreen';
      if (s.state === 'empty') {
        I.pialaCup(ctx, cx, base - 1, 0.62, '#eadcc0');
        ctx.globalAlpha = 0.35; ctx.save(); ctx.translate(cx, base - 12); ctx.scale(0.6, 0.6); I.choynak(ctx, green); ctx.restore(); ctx.globalAlpha = 1;
      } else if (s.state === 'brew') {
        ctx.save(); ctx.translate(cx, base - 6); ctx.scale(0.74, 0.74); I.choynak(ctx, green); ctx.restore();
        steam(ctx, cx + 8, base - 13, t, 3, 3, 0.5);
        progressRing(ctx, cx, base - 30, 5.5, 1 - s.t / game.brewTime, '#7ad04a');
      } else {
        if (s.count > 1) { ctx.save(); ctx.translate(cx - 5, base - 9); ctx.scale(0.62, 0.62); I.choynak(ctx, green); ctx.restore(); }
        ctx.save(); ctx.translate(cx + (s.count > 1 ? 4 : 0), base - 5); ctx.scale(0.74, 0.74); I.choynak(ctx, green); ctx.restore();
        steam(ctx, cx + 10, base - 13, t, 2, 2, 0.35);
      }
    }
    if (st.compote) {
      const s = st.compote, cx = s.x + s.w / 2, base = COUNTER_TOP + 8;
      const frac = s.servings / TUNE.compote.servings;
      const jar = () => { ctx.beginPath(); ctx.moveTo(cx - 13, base - 36); ctx.lineTo(cx - 15, base - 4); ctx.quadraticCurveTo(cx - 15, base + 1, cx - 10, base + 1); ctx.lineTo(cx + 10, base + 1); ctx.quadraticCurveTo(cx + 15, base + 1, cx + 15, base - 4); ctx.lineTo(cx + 13, base - 36); ctx.closePath(); };
      jar();
      finish(ctx, 'rgba(220,235,240,0.45)', INK, 1);
      if (frac > 0) {
        const top = base - 2 - 30 * frac;
        ctx.save(); jar(); ctx.clip();
        ctx.fillStyle = grad(ctx, 0, top, 0, base + 2, ['#f06a82', '#d63656', '#9e1a3a']); ctx.fillRect(cx - 16, top, 32, base + 2 - top);
        ctx.fillStyle = 'rgba(255,200,210,0.6)'; ctx.fillRect(cx - 16, top, 32, 1.5);
        const r = rng(12);
        for (let i = 0; i < 9; i++) { const y = top + 3 + r() * (base - top - 4); if (y < base) ell(ctx, cx - 10 + r() * 20, y, 2.3, 2.1, r() < 0.5 ? '#7e1426' : '#f39a2a', 'rgba(60,10,10,0.5)', 0.5); }
        ctx.restore();
      }
      rrect(ctx, cx - 14, base - 40, 28, 5, 2, '#d8d0c0', INK, 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - 10, base - 34, 2, 28);
      countTag(ctx, cx, base - 18, s.servings > 0 ? String(s.servings) : '0');
    }
    const busy = game.hero.busy;
    const chopping = busy && (busy.id === 'prepVeg' || busy.id === 'prepSalad') ? busy.id : null;
    {
      const base = COUNTER_TOP + 8;
      const vx = 213;
      carrot(ctx, vx - 16, base - 4, -0.15); carrot(ctx, vx - 14, base - 1, 0.1);
      onion(ctx, vx + 10, base - 3, 4); onion(ctx, vx + 16, base - 2, 3.4);
      if (chopping === 'prepVeg') { const ph = busy.t / busy.dur; ctx.lineCap = 'round'; for (let i = 0; i < 9 * ph; i++) { ctx.strokeStyle = i % 3 ? '#f07418' : '#f7b92e'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(vx - 7 + i * 2, base - 3); ctx.lineTo(vx - 6 + i * 2, base); ctx.stroke(); } }
      if (st.prepSalad) {
        const sx = 269;
        tomato(ctx, sx - 12, base - 3, 4.4); tomato(ctx, sx - 4, base - 2, 3.8);
        onion(ctx, sx + 10, base - 2, 3.6);
        if (chopping === 'prepSalad') { const ph = busy.t / busy.dur; for (let i = 0; i < 6 * ph; i++) I.tomatoSlice(ctx, sx + 2 + i * 1.8, base - 1, 1.8); }
      }
    }
    if (st.tandoor) {
      const s = st.tandoor, cx = s.x + s.w / 2;
      const glow = s.state === 'bake' || s.state === 'done' ? 1 : 0.5;
      const gg = ctx.createRadialGradient(cx, 112, 1, cx, 112, 16);
      gg.addColorStop(0, 'rgba(255,200,80,' + (0.9 * glow) + ')'); gg.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(cx, 112, 14, 5, 0, 0, TAU); ctx.fill();
      fire(ctx, cx, 190, 20, t + 1, 0.55 * glow + 0.2);
      if (s.state === 'bake' || s.state === 'done') {
        const col = s.state === 'done' ? '#e8a848' : '#f4e0b0';
        for (let i = 0; i < 4; i++) ell(ctx, cx - 9 + i * 6, 111 + (i % 2), 2.6, 1.4, col, INK, 0.5);
      }
      if (s.state === 'done') steam(ctx, cx, 106, t, 3, 4, 0.4);
      if (s.state === 'burnt') smoke(ctx, cx, 108, t, 6);
      tandoorBoard(ctx, game, t);
    }
    for (const id of ['stockSamsa', 'stockNon']) {
      const s = st[id];
      if (!s) continue;
      const cx = s.x + s.w / 2, base = COUNTER_TOP + 7;
      const n = Math.min(s.count, 8);
      const spots = [[-9, 0], [0, 0.6], [9, 0], [-4.5, -4], [4.5, -4], [-9, -7], [0, -8], [9, -7]];
      for (let i = 0; i < n; i++) I.foodAt(ctx, s.item, cx + spots[i][0], base + spots[i][1], 13);
      if (s.count > 0) countTag(ctx, cx + 13, base + 10, String(s.count));
    }
    for (const s of game.stations) {
      if (s.kind !== 'pass' || !s.item) continue;
      I.foodAt(ctx, s.item, s.x + s.w / 2, COUNTER_TOP + 9, s.item === 'plov' ? 24 : 21);
    }
  }

  function tableSprite(t) {
    return A.cached('table|' + t.id, () => A.mk(100, 60, 50, 36, ctx => {
      if (t.kind === 'small') {
        limb(ctx, [[-20, -2], [-21, 14]], 2.4, '#7a4a20');
        limb(ctx, [[20, -2], [21, 14]], 2.4, '#7a4a20');
        rrect(ctx, -27, -16, 54, 8, 2, '#8a5a2a', INK, 1);
        rrect(ctx, -28, -22, 56, 10, 3, '#c89058', INK, 1.1);
        ctx.fillStyle = 'rgba(255,240,210,0.25)'; ctx.fillRect(-24, -21, 48, 2);
      } else {
        rrect(ctx, -36, -8, 72, 12, 2, '#7a4424', INK, 1);
        rrect(ctx, -38, -18, 76, 12, 3, '#a8683a', INK, 1.1);
        ctx.save();
        ctx.beginPath(); ctx.rect(-34, -17, 68, 10); ctx.clip();
        O.suzani(ctx, 0, -12, 22, P.hash('dt' + t.id), O.PALETTES.madder);
        ctx.restore();
        rrect(ctx, -34, -17, 68, 10, 2, null, '#8a4a28', 0.8);
      }
    }));
  }

  const ON_TABLE = { plov: 22, achichuk: 16, samsa: 14, non: 17, teaBlack: 19, teaGreen: 19, compote: 15 };

  function drawTable(ctx, t, game, fit) {
    const g = t.group;
    A.blit(ctx, tableSprite(t), t.x, t.y);
    const topY = t.kind === 'small' ? t.y - 18 : t.y - 13;
    const food = t.food;
    const n = food.length;
    const span = t.kind === 'small' ? 46 : 66;
    const order = food.map((f, i) => i).sort((a, b) => (a % 2) - (b % 2));
    for (const i of order) {
      const f = food[i];
      const x = t.x + (n > 1 ? (i - (n - 1) / 2) * Math.min(16, span / n) : 0);
      const y = topY + 5 + (i % 2) * 2.5;
      if (f.eaten) I.leftoverAt(ctx, f.item, x, y, ON_TABLE[f.item] || 16);
      else I.foodAt(ctx, f.item, x, y, ON_TABLE[f.item] || 16);
    }
    if (t.dirty && !g && !n) {
      I.leftoverAt(ctx, 'plov', t.x - 10, topY + 5, 20);
      I.leftoverAt(ctx, 'achichuk', t.x + 11, topY + 7, 15);
    }
    const px = t.kind === 'small' ? t.x : t.x + 50;
    const py = t.kind === 'small' ? t.y - 4 : t.y + 26;
    const fill = fit === true ? '#2a8a3a' : fit === false ? '#7a4a3a' : '#1f4f9f';
    ctx.save();
    if (fit === false) ctx.globalAlpha = 0.55;
    rrect(ctx, px - 7.5, py - 6.5, 15, 13, 3, fill, '#f4ecd6', 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px - 5.5, py - 5, 11, 1.2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Tahoma, Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(t.n), px, py + 3.4);
    if (fit !== undefined) {
      const cap = t.cap;
      ctx.font = 'bold 8px Tahoma, Verdana, sans-serif';
      const label = '×' + cap;
      rrect(ctx, px + 7, py - 5, 14, 10, 3, fit ? '#e8ffd8' : '#f0d8d0', fit ? '#2a6a2a' : '#8a3a2a', 0.9);
      ctx.fillStyle = fit ? '#1e5a1e' : '#7a2a1a'; ctx.fillText(label, px + 14, py + 2.8);
    }
    ctx.restore();
  }

  P.Scene = { buildBackground, drawStations, drawTable, bubble, progressRing, steam, smoke, fire, countTag, woodBoard, boardNode, KAZAN_STAGE, COUNTER_TOP, COUNTER_BOTTOM };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
