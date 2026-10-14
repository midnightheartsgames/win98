(function (L) {
  'use strict';
  const D = L.DATA, M = L.Models;
  const { shade, mix, rgba, mk, crisp, star, TAU, PI } = M;

  const G = {
    lance: k => { k.line(3, 13, 13, 3, '#ffe0ff', 2); k.poly([13, 3, 9, 4, 12, 7], '#ffffff'); k.circ(4, 12, 2, '#ff80ff'); },
    sheep: k => { k.blob(8, 9, 5, 4, '#ffffff'); k.blob(12, 7, 2.5, 2.2, '#f0e0e0'); k.rect(5, 12, 1.5, 3, '#503030'); k.rect(10, 12, 1.5, 3, '#503030'); k.rect(12, 6, 1, 1, '#000'); },
    pix: k => { k.circ(8, 8, 3, '#ffe0ff'); k.ell(5, 6, 3, 1.5, '#c0f0ff'); k.ell(11, 6, 3, 1.5, '#c0f0ff'); k.circ(8, 8, 1.3, '#ffffff'); },
    grow: k => { k.poly([8, 1, 11, 7, 15, 8, 11, 10, 8, 15, 5, 10, 1, 8, 5, 7], '#80ff80'); k.circ(8, 8, 2.5, '#e0ffe0'); },
    gun: k => { k.rect(2, 7, 9, 4, '#8a8a9a'); k.rect(10, 8, 5, 2, '#c0c0d0'); k.rect(3, 6, 3, 1.5, '#ff60a0'); k.rect(4, 11, 2, 3, '#303038'); },
    zap: k => { k.poly([9, 1, 4, 9, 8, 9, 6, 15, 13, 6, 9, 6, 11, 1], '#80e0ff'); },
    chomp: k => { k.ell(8, 10, 6, 3, '#e04040'); for (let i = 0; i < 5; i++) k.poly([3 + i * 2.5, 8, 5 + i * 2.5, 8, 4 + i * 2.5, 5], '#ffffff'); },
    rocket: k => { k.poly([2, 12, 11, 3, 14, 2, 13, 5, 4, 14], '#e04040'); k.poly([2, 12, 4, 14, 1, 15], '#ffe060'); k.circ(10, 6, 1.2, '#ffffff'); },
    silence: k => { k.line(3, 13, 12, 4, '#f0f0f0', 3); k.poly([12, 4, 14, 2, 13, 6], '#ffe060'); k.circ(4, 12, 2, '#ffd040'); },
    courage: k => { k.poly([8, 1, 14, 4, 13, 10, 8, 15, 3, 10, 2, 4], '#f0d060'); k.poly([8, 3, 12, 5, 11, 10, 8, 13], '#fff0a0'); },
    spin: k => { k.ctx.strokeStyle = '#e0f0ff'; k.ctx.lineWidth = 2; k.ctx.beginPath(); k.ctx.arc(8, 8, 5, 0.3, 5.5); k.ctx.stroke(); k.poly([12, 3, 15, 5, 12, 7], '#ffffff'); },
    bigsword: k => { k.poly([8, 0, 10, 3, 10, 11, 6, 11, 6, 3], '#f0f8ff'); k.rect(4, 11, 8, 1.5, '#ffd040'); k.rect(7, 12, 2, 4, '#6a4a2a'); },
    fire: k => { k.poly([8, 1, 12, 7, 11, 13, 8, 15, 5, 13, 4, 8, 6, 9], '#ff6020'); k.poly([8, 6, 10, 10, 8, 14, 6, 11], '#ffe060'); },
    cone: k => { k.poly([2, 8, 15, 2, 15, 14], '#ff8030'); k.poly([2, 8, 12, 5, 12, 11], '#ffe060'); },
    flameShield: k => { k.circ(8, 8, 6, '#ff6020'); k.circ(8, 8, 4, '#ffb040'); k.circ(8, 8, 2, '#fff0c0'); },
    bear: k => { k.blob(8, 10, 5, 5, '#7a5030'); k.circ(4, 4, 2.5, '#7a5030'); k.circ(12, 4, 2.5, '#7a5030'); k.blob(8, 6, 4, 3.5, '#7a5030'); k.rect(6, 5, 1, 1, '#ff4020'); k.rect(10, 5, 1, 1, '#ff4020'); },
    focus: k => { k.circ(8, 8, 6, '#c0f0ff'); k.circ(8, 8, 4, '#3a6ac8'); k.circ(8, 8, 1.5, '#ffffff'); },
    volley: k => { for (let i = -2; i <= 2; i++) k.line(2, 8, 14, 8 + i * 3, '#c0f0ff', 1.2); },
    hawk: k => { k.poly([1, 7, 8, 5, 15, 7, 9, 9, 8, 13, 7, 9], '#a0c0e0'); k.rect(8, 5, 1, 1, '#000'); },
    crystal: k => { k.poly([1, 15, 10, 4, 15, 1, 12, 6, 3, 15], '#a0e0ff'); k.poly([10, 4, 15, 1, 12, 6], '#ffffff'); },
    alpha: k => { k.line(2, 14, 14, 2, '#c0ffb0', 2); k.line(2, 2, 14, 14, '#80ff60', 2); k.circ(8, 8, 2, '#ffffff'); },
    meditate: k => { k.circ(8, 4, 2.5, '#f0d0a0'); k.poly([3, 14, 13, 14, 11, 8, 5, 8], '#d8b050'); k.ctx.strokeStyle = '#80ff60'; k.ctx.lineWidth = 1; k.ctx.beginPath(); k.ctx.arc(8, 8, 7, 0, 6.3); k.ctx.stroke(); },
    wuju: k => { k.line(3, 13, 13, 3, '#e0ffe0', 2); k.poly([13, 3, 15, 1, 14, 5], '#ffe060'); k.circ(5, 5, 2, '#ffe060'); },
    highlander: k => { k.poly([2, 14, 8, 2, 14, 14, 8, 10], '#80ff60'); k.poly([5, 12, 8, 5, 11, 12, 8, 10], '#e0ffe0'); },
    rock: k => { k.blob(8, 9, 6, 5, '#9a7a58'); k.blob(6, 7, 2.5, 2, '#c0a080'); },
    clap: k => { k.blob(4, 8, 3, 4, '#9a7a58'); k.blob(12, 8, 3, 4, '#9a7a58'); k.line(8, 2, 8, 14, '#ffff80', 1.5); },
    slam: k => { k.ell(8, 12, 7, 2.5, '#b08a60'); k.blob(8, 6, 4, 4, '#9a7a58'); k.line(2, 10, 1, 14, '#ffe080', 1); k.line(14, 10, 15, 14, '#ffe080', 1); },
    charge: k => { k.blob(10, 8, 5, 5, '#9a7a58'); for (let i = 0; i < 3; i++) k.line(1, 5 + i * 3, 5, 5 + i * 3, '#ffffff', 1); },
    dart: k => { k.line(2, 14, 13, 3, '#a07a40', 1.5); k.poly([13, 3, 10, 4, 12, 6], '#80ff40'); },
    run: k => { k.poly([3, 14, 7, 8, 5, 4, 9, 2, 11, 6, 14, 7, 10, 9, 12, 14, 9, 14, 8, 10], '#e8c080'); },
    poison: k => { k.blob(8, 9, 5, 5, '#60c030'); k.circ(6, 7, 1.5, '#c0ff80'); k.circ(8, 3, 1.5, '#60c030'); },
    shroom: k => { k.rect(7, 9, 3, 6, '#e8e0c0'); k.ell(8, 8, 7, 4.5, '#6a9a3a'); k.circ(5, 7, 1.3, '#c0e080'); k.circ(11, 7, 1.3, '#c0e080'); },
    orb: k => { k.circ(8, 8, 5, '#3080ff'); k.circ(7, 7, 2.5, '#a0e0ff'); },
    prison: k => { k.ctx.strokeStyle = '#60c0ff'; k.ctx.lineWidth = 1.5; k.ctx.beginPath(); k.ctx.arc(8, 8, 6, 0, 6.3); k.ctx.stroke(); k.line(8, 2, 8, 14, '#60c0ff', 1); k.line(2, 8, 14, 8, '#60c0ff', 1); },
    flux: k => { k.circ(4, 11, 2.5, '#a060ff'); k.circ(12, 5, 2.5, '#a060ff'); k.line(4, 11, 12, 5, '#e0c0ff', 1); k.circ(12, 12, 1.8, '#a060ff'); },
    power: k => { k.circ(8, 8, 6, '#1a3a8a'); k.poly([8, 2, 10, 7, 14, 8, 10, 9, 8, 14, 6, 9, 2, 8, 6, 7], '#60ffff'); },
    horns: k => { k.poly([3, 3, 7, 9, 5, 10], '#f0e8d8'); k.poly([13, 3, 9, 9, 11, 10], '#f0e8d8'); k.blob(8, 11, 4, 3.5, '#7a5a8a'); },
    headbutt: k => { k.blob(6, 9, 4, 3.5, '#7a5a8a'); k.poly([8, 6, 12, 3, 10, 8], '#f0e8d8'); k.line(11, 11, 15, 13, '#ffffff', 1); },
    roar: k => { k.blob(5, 8, 3.5, 3.5, '#7a5a8a'); for (let r = 4; r <= 10; r += 3) { k.ctx.strokeStyle = '#80ff80'; k.ctx.lineWidth = 1; k.ctx.beginPath(); k.ctx.arc(6, 8, r, -0.8, 0.8); k.ctx.stroke(); } },
    will: k => { k.poly([8, 1, 14, 4, 13, 11, 8, 15, 3, 11, 2, 4], '#8060a0'); k.poly([5, 5, 11, 5, 8, 12], '#ffd040'); }
  };
  const ABIL_GLYPH = {
    lulu: ['lance', 'sheep', 'pix', 'grow'], jinx: ['gun', 'zap', 'chomp', 'rocket'], garen: ['silence', 'courage', 'spin', 'bigsword'],
    annie: ['fire', 'cone', 'flameShield', 'bear'], ashe: ['focus', 'volley', 'hawk', 'crystal'], masteryi: ['alpha', 'meditate', 'wuju', 'highlander'],
    malphite: ['rock', 'clap', 'slam', 'charge'], teemo: ['dart', 'run', 'poison', 'shroom'], ryze: ['orb', 'prison', 'flux', 'power'], alistar: ['horns', 'headbutt', 'roar', 'will']
  };
  const SPELL_GLYPH = {
    flash: k => { k.poly([8, 1, 10, 6, 15, 8, 10, 10, 8, 15, 6, 10, 1, 8, 6, 6], '#ffe060'); k.circ(8, 8, 2, '#ffffff'); },
    heal: k => { k.rect(6, 2, 4, 12, '#60ff60'); k.rect(2, 6, 12, 4, '#60ff60'); k.rect(7, 3, 2, 10, '#d0ffd0'); },
    ignite: k => G.fire(k),
    ghost: k => { k.poly([4, 14, 4, 6, 8, 2, 12, 6, 12, 14, 10, 12, 8, 14, 6, 12], '#d0f0ff'); k.rect(6, 6, 1.5, 2, '#203040'); k.rect(9, 6, 1.5, 2, '#203040'); },
    exhaust: k => { k.ctx.strokeStyle = '#ffa040'; k.ctx.lineWidth = 2; k.ctx.beginPath(); k.ctx.arc(8, 8, 5, 0, 4.8); k.ctx.stroke(); k.circ(8, 8, 1.5, '#ffe0a0'); },
    barrier: k => { k.circ(8, 8, 6, '#ffff80'); k.circ(8, 8, 4.5, '#806020'); k.circ(8, 8, 3, '#ffff80'); },
    smite: k => { k.poly([10, 1, 5, 8, 8, 8, 5, 15, 12, 6, 9, 6], '#ffd040'); }
  };

  function bevel(ctx, s, light, dark) {
    ctx.fillStyle = dark; ctx.fillRect(0, s - 1, s, 1); ctx.fillRect(s - 1, 0, 1, s);
    ctx.fillStyle = light; ctx.fillRect(0, 0, s, 1); ctx.fillRect(0, 0, 1, s);
  }
  function glowBg(ctx, s, c1, c2) {
    ctx.fillStyle = c2; ctx.fillRect(0, 0, s, s);
    const g = ctx.createRadialGradient(s * 0.42, s * 0.38, 0, s * 0.5, s * 0.5, s * 0.78);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < s; i += 3) ctx.fillRect(0, i, s, 1);
  }
  function glyphIcon(s, draw, c1, c2) {
    const cv = mk(s, s), ctx = cv.getContext('2d');
    glowBg(ctx, s, c1, c2);
    const g = mk(s, s), gc = g.getContext('2d'), m = Math.max(1, Math.round(s * 0.06)), sc = (s - m * 2) / 16;
    gc.translate(m, m); gc.scale(sc, sc);
    draw(L.GFX.K(gc));
    crisp(g, [16, 8, 8]);
    ctx.drawImage(g, 0, 0);
    bevel(ctx, s, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.55)');
    return cv;
  }
  function abilityIcon(cid, slot, s) { const col = D.CHAMPS[cid].color; return glyphIcon(s, G[ABIL_GLYPH[cid][slot]], shade(col, 0.95), shade(col, 0.22)); }
  function spellIcon(id, s) { return glyphIcon(s, SPELL_GLYPH[id], shade(D.SPELLS[id].color, 0.62), '#0c0c16'); }

  function sword(k, o) {
    k.at(o.x == null ? 7 : o.x, o.y == null ? 25 : o.y, o.a == null ? -PI / 4 : o.a, () => {
      const len = o.len || 26, w = o.w || 2;
      k.path(c => { c.moveTo(3, -w); c.lineTo(len - w * 1.8, -w * 0.9); c.lineTo(len, 0); c.lineTo(len - w * 1.8, w * 0.9); c.lineTo(3, w); c.closePath(); }, o.blade);
      k.line(4.5, 0, len - w * 2.2, 0, o.edge, Math.max(0.5, w * 0.28));
      if (o.drip) for (let i = 0; i < 3; i++) k.path(c => { c.moveTo(8 + i * 5, w * 0.6); c.lineTo(9.2 + i * 5, w * 0.6); c.quadraticCurveTo(9.4 + i * 5, w + 2.4 + i, 8.6 + i * 5, w + 3 + i * 0.8); c.quadraticCurveTo(7.8 + i * 5, w + 2.4 + i, 8 + i * 5, w * 0.6); c.closePath(); }, o.drip, { sh: 0.3 });
      if (o.wings) { k.path(c => { c.moveTo(3.4, -w); c.quadraticCurveTo(1, -w - 7, 6, -w - 9); c.quadraticCurveTo(5, -w - 5, 7.4, -w - 3.2); c.quadraticCurveTo(5.6, -w - 2.4, 5, -w); c.closePath(); }, o.wings); k.path(c => { c.moveTo(3.4, w); c.quadraticCurveTo(1, w + 7, 6, w + 9); c.quadraticCurveTo(5, w + 5, 7.4, w + 3.2); c.quadraticCurveTo(5.6, w + 2.4, 5, w); c.closePath(); }, o.wings); }
      else k.path(c => { c.moveTo(1.6, -w - 3); c.quadraticCurveTo(3.4, -w - 1, 3.2, -w); c.lineTo(3.2, w); c.quadraticCurveTo(3.4, w + 1, 1.6, w + 3); c.lineTo(3.8, w + 3.2); c.quadraticCurveTo(4.8, 0, 3.8, -w - 3.2); c.closePath(); }, o.guard, { sh: 0.4 });
      k.path(c => c.rect(-4.4, -1.1, 6.2, 2.2), o.grip, { sh: 0.4 });
      if (k.px >= 1) for (let i = 0; i < 3; i++) k.line(-3.6 + i * 1.8, -1, -2.8 + i * 1.8, 1, shade(o.grip, 0.6), 0.35);
      k.circ(-5, 0, 1.7, o.pommel, { sh: 0.4 });
      if (o.gem) { k.circ(2.6, 0, 1.7, o.gem, { sh: 0.4 }); k.glow(2.6, 0, 4, o.gem, 0.55); }
      if (o.skull) { k.circ(2.4, 0, 2.3, '#e8e0d0', { sh: 0.4 }); k.dot(3, -0.8, 0.5, '#20101a'); k.dot(3, 0.8, 0.5, '#20101a'); }
    });
  }
  function potion(k, col, light) {
    k.path(c => { c.moveTo(12.5, 9); c.lineTo(19.5, 9); c.lineTo(19.5, 13); c.quadraticCurveTo(27, 16, 27, 22.4); c.quadraticCurveTo(27, 29.4, 16, 29.4); c.quadraticCurveTo(5, 29.4, 5, 22.4); c.quadraticCurveTo(5, 16, 12.5, 13); c.closePath(); }, '#cfe2ea', { sh: 0.7 });
    k.path(c => { c.moveTo(6.4, 20.6); c.quadraticCurveTo(16, 17.4, 25.6, 20.6); c.quadraticCurveTo(26.4, 28.2, 16, 28.2); c.quadraticCurveTo(5.6, 28.2, 6.4, 20.6); c.closePath(); }, col, { sh: 0.8 });
    k.path(c => c.rect(11.4, 4.4, 9.2, 5.2), '#a06a36', { sh: 0.6 });
    k.path(c => c.rect(10.6, 8.6, 10.8, 1.6), '#6a4a2a', { sh: 0.3 });
    k.flat(c => c.ellipse(10.4, 21, 1.4, 3.4, 0.3, 0, TAU), rgba('#ffffff', 0.75));
    k.dot(18.4, 23.4, 1, light); k.dot(21, 21.6, 0.7, light); k.dot(15.6, 25.4, 0.6, light);
    k.glow(16, 23, 9, col, 0.3);
  }
  function wardIcon(k, col, light) {
    k.seg(16, 29, 16, 14, 1.8, 1.4, '#8a5a2a');
    k.path(c => { c.moveTo(16, 3); c.quadraticCurveTo(24, 6, 23.4, 12.6); c.quadraticCurveTo(22, 17.4, 16, 17.6); c.quadraticCurveTo(10, 17.4, 8.6, 12.6); c.quadraticCurveTo(8, 6, 16, 3); c.closePath(); }, col);
    k.ell(16, 11, 4.2, 3, '#fbf8f4', { sh: 0.3 }); k.circ(16.6, 11, 2, shade(col, 0.5), { sh: 0.2 }); k.dot(16.8, 11, 0.9, '#101010'); k.dot(15.6, 10, 0.6, '#ffffff');
    k.poly([8.6, 12, 3, 8, 5, 14, 9.4, 15], light); k.poly([23.4, 12, 29, 8, 27, 14, 22.6, 15], light);
    k.glow(16, 11, 10, col, 0.45);
  }
  function ring(k, band, gemCol) {
    k.path(c => { c.arc(16, 19.4, 9.2, 0, TAU); c.arc(16, 19.4, 6, 0, TAU, true); }, band, { sh: 0.7 });
    k.poly([11, 11.4, 21, 11.4, 23, 8, 9, 8], band, { sh: 0.4 });
    k.path(c => { c.moveTo(16, 1.6); c.lineTo(21.6, 6.2); c.lineTo(16, 11.4); c.lineTo(10.4, 6.2); c.closePath(); }, gemCol, { sh: 0.6 });
    k.flat(c => { c.moveTo(16, 2.6); c.lineTo(19, 6.2); c.lineTo(16, 6.2); c.closePath(); }, rgba('#ffffff', 0.7));
    k.glow(16, 6.4, 7, gemCol, 0.55);
  }
  function roundShield(k, wood, rim, gold) {
    k.circ(16, 16.4, 12.6, rim, { sh: 0.9 });
    k.circ(16, 16.4, 10.4, wood, { sh: 0.8 });
    for (let i = -2; i <= 2; i++) k.line(16 + i * 4, 7, 16 + i * 4, 25.8, shade(wood, 0.62), 0.6);
    k.circ(16, 16.4, 3.8, gold, { sh: 0.5 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; k.dot(16 + Math.cos(a) * 11.5, 16.4 + Math.sin(a) * 11.5, 0.7, shade(rim, 0.6)); }
  }
  function book(k, cover, trim, rune) {
    k.path(c => { c.moveTo(10, 28.6); c.lineTo(26.6, 25.4); c.lineTo(27.2, 27.2); c.lineTo(10.6, 30.4); c.closePath(); }, '#efe4c8', { sh: 0.3 });
    k.path(c => { c.moveTo(6.4, 7); c.lineTo(23.4, 4); c.lineTo(26.6, 25.4); c.lineTo(9.6, 28.6); c.closePath(); }, cover, { sh: 0.9 });
    k.path(c => { c.moveTo(6.4, 7); c.lineTo(9.2, 6.5); c.lineTo(12.4, 28); c.lineTo(9.6, 28.6); c.closePath(); }, shade(cover, 0.7), { sh: 0.3 });
    for (const [x, y] of [[23.4, 4], [26.6, 25.4]]) k.circ(x, y, 1.8, trim, { sh: 0.3 });
    k.path(c => star(c, 18, 16.4, 5, 6, 0.45), rune, { sh: 0.4 });
    k.glow(18, 16.4, 9, rune, 0.6);
  }
  function tunic(k, col, dark) {
    k.path(c => { c.moveTo(9, 5.4); c.lineTo(13, 4.4); c.quadraticCurveTo(16, 8, 19, 4.4); c.lineTo(23, 5.4); c.lineTo(28, 12); c.lineTo(24, 14.4); c.lineTo(23.4, 28); c.lineTo(8.6, 28); c.lineTo(8, 14.4); c.lineTo(4, 12); c.closePath(); }, col, { sh: 0.9 });
    k.line(16, 8, 16, 21, dark, 0.9);
    for (let i = 0; i < 4; i++) { k.line(14.2, 9.4 + i * 3, 17.8, 10.6 + i * 3, shade(dark, 1.3), 0.5); }
    k.path(c => c.rect(8.6, 21.4, 14.8, 2.4), dark, { sh: 0.3 });
    k.path(c => c.rect(14.6, 21, 2.8, 3.2), '#c8a040', { sh: 0.3 });
  }
  function cloak(k, col, glow) {
    k.path(c => { c.moveTo(16, 2.6); c.quadraticCurveTo(25.6, 3.4, 24.4, 13); c.lineTo(28.6, 28.6); c.quadraticCurveTo(22, 25.4, 16, 28); c.quadraticCurveTo(10, 25.4, 3.4, 28.6); c.lineTo(7.6, 13); c.quadraticCurveTo(6.4, 3.4, 16, 2.6); c.closePath(); }, col, { sh: 1 });
    k.path(c => { c.moveTo(16, 5.6); c.quadraticCurveTo(22.2, 6.4, 21.6, 13); c.quadraticCurveTo(16, 16.6, 10.4, 13); c.quadraticCurveTo(9.8, 6.4, 16, 5.6); c.closePath(); }, '#160c22', { sh: 0.3 });
    k.dot(14, 11, 0.9, glow); k.dot(18, 11, 0.9, glow); k.glow(16, 11, 5, glow, 0.6);
    k.path(c => star(c, 16, 21, 3, 4, 0.35), glow, { sh: 0.2 }); k.glow(16, 21, 6, glow, 0.4);
  }
  function gem(k, col, light) {
    k.poly([16, 2.4, 26, 11, 21.4, 29, 10.6, 29, 6, 11], col, { sh: 0.9 });
    k.poly([16, 2.4, 20.4, 11, 16, 29, 11.6, 11], mix(col, light, 0.45), { flat: true, noInk: true });
    k.line(6, 11, 26, 11, shade(col, 0.6), 0.5); k.line(16, 2.4, 16, 29, shade(col, 0.7), 0.4);
    k.flat(c => { c.moveTo(12, 6.4); c.lineTo(14.6, 4.4); c.lineTo(13, 9); c.closePath(); }, rgba('#ffffff', 0.8));
    k.glow(15, 12, 9, light, 0.45);
  }
  function glove(k, col, trim) {
    k.path(c => { c.moveTo(8, 29); c.lineTo(8.6, 17); c.quadraticCurveTo(7.4, 9, 11, 6.4); c.lineTo(22, 5.6); c.quadraticCurveTo(26, 7.4, 25.4, 13); c.lineTo(24.4, 17.4); c.lineTo(23.4, 29); c.closePath(); }, col, { sh: 0.9 });
    for (let i = 0; i < 4; i++) k.path(c => c.ellipse(12.2 + i * 3.6, 6.8, 1.9, 2.8, 0, 0, TAU), shade(col, 1.08), { sh: 0.4 });
    k.path(c => { c.moveTo(8.6, 17); c.quadraticCurveTo(3.4, 16, 4, 11); c.quadraticCurveTo(6.4, 10, 9.4, 13); c.closePath(); }, col, { sh: 0.4 });
    k.path(c => c.rect(7.4, 22, 17, 5.4), trim, { sh: 0.5 });
    for (let i = 0; i < 4; i++) k.circ(10 + i * 4, 24.6, 0.9, '#e8e0d0', { sh: 0.2 });
  }
  function bootArt(k, col, trim, kind) {
    k.path(c => { c.moveTo(10, 4); c.lineTo(19.4, 4); c.lineTo(19.8, 17.6); c.quadraticCurveTo(27.4, 18.4, 28.6, 23.6); c.lineTo(28.6, 26.6); c.lineTo(8, 26.6); c.lineTo(8.6, 17); c.closePath(); }, col, { sh: 0.9 });
    k.path(c => c.rect(7.6, 25.2, 21.4, 3), '#2a1a10', { sh: 0.3 });
    k.path(c => c.rect(9, 3, 11.4, 4.2), trim, { sh: 0.5 });
    if (kind === 'claws') for (let i = 0; i < 3; i++) k.poly([27, 20.4 + i * 2.2, 31, 19.4 + i * 2.6, 27.6, 22 + i * 2.2], '#e8e0d0', { sh: 0.2 });
    if (kind === 'curl') { k.path(c => { c.moveTo(24, 19); c.quadraticCurveTo(31.4, 19, 30.4, 13.4); c.quadraticCurveTo(29, 11.6, 27.6, 13.4); c.quadraticCurveTo(28.4, 16.4, 24.6, 17.8); c.closePath(); }, col, { sh: 0.4 }); k.path(c => star(c, 14.6, 13, 2.6, 5, 0.45), '#ffe070', { sh: 0.2 }); k.glow(14.6, 13, 5, '#c080ff', 0.5); }
    if (kind === 'tabi') { k.line(24.4, 20.4, 26.4, 26, shade(col, 0.5), 0.8); k.path(c => c.rect(10.4, 8.8, 7.6, 8), trim, { sh: 0.4 }); for (let i = 0; i < 3; i++) k.line(10.8, 10.6 + i * 2.4, 17.6, 10.6 + i * 2.4, shade(trim, 0.6), 0.4); }
    if (kind === 'wing') { k.path(c => { c.moveTo(9.4, 8); c.quadraticCurveTo(2, 4, 1.6, 10.4); c.quadraticCurveTo(4, 9.4, 3.4, 13.4); c.quadraticCurveTo(6.4, 11.4, 9, 13.4); c.closePath(); }, '#f0f4ff', { sh: 0.3 }); }
    if (kind === 'ionian') { k.circ(14.6, 13, 3.2, trim, { sh: 0.3 }); k.path(c => { c.arc(14.6, 13, 2, 0.2, PI + 0.2); c.arc(13.6, 13.2, 1, PI + 0.2, 0.2, true); c.closePath(); }, col, { flat: true, noInk: true }); }
  }
  function pickaxe(k) {
    k.seg(7, 28, 21, 9.4, 1.4, 1.2, '#8a5a2a');
    k.path(c => { c.moveTo(11, 6.4); c.quadraticCurveTo(19, 1.4, 29.4, 8.6); c.lineTo(27.6, 11); c.quadraticCurveTo(21, 7, 15.4, 10.6); c.lineTo(13.4, 12.6); c.quadraticCurveTo(12.4, 9.4, 8.4, 9.6); c.closePath(); }, '#a8b2c0', { sh: 0.7 });
    k.circ(20.4, 8.6, 2, '#6a6a74', { sh: 0.3 });
  }
  function staffArt(k, wood, orb, light, wings) {
    k.seg(6.4, 29, 19.4, 11.4, 1.2, 1.5, wood);
    if (wings) { k.path(c => { c.moveTo(19, 11); c.quadraticCurveTo(8, 8, 6, 1.6); c.quadraticCurveTo(10, 5, 12.4, 3.6); c.quadraticCurveTo(14, 7.4, 18.4, 8.4); c.closePath(); }, '#f4f8ff', { sh: 0.4 }); k.path(c => { c.moveTo(23, 13.4); c.quadraticCurveTo(28, 21, 31, 22.6); c.quadraticCurveTo(26.6, 22.6, 27, 25); c.quadraticCurveTo(23.4, 21, 21, 16.6); c.closePath(); }, '#f4f8ff', { sh: 0.4 }); }
    k.poly([16.6, 12, 17.4, 6.4, 19.6, 10.4], '#e8c050', { sh: 0.2 }); k.poly([20.4, 15.4, 26, 14.6, 22, 12.4], '#e8c050', { sh: 0.2 });
    k.circ(21.4, 9.4, 5.6, orb, { sh: 0.8 });
    k.flat(c => c.ellipse(19.6, 7.6, 1.8, 1.2, -0.6, 0, TAU), rgba('#ffffff', 0.8));
    k.glow(21.4, 9.4, 11, light, 0.65);
  }
  function wand(k) {
    k.seg(6, 28, 17.4, 15, 1.2, 1.5, '#7a3a1e');
    k.path(c => c.rect(15.4, 14, 4, 2.4), '#e8c050', { sh: 0.3 });
    k.poly([17.4, 14.4, 18.4, 7.4, 25.4, 3.4, 23.4, 10.4], '#ff6a2a', { sh: 0.5 });
    k.poly([20, 8, 24.4, 5, 22.6, 9.4], '#ffd070', { flat: true, noInk: true });
    for (let i = 0; i < 3; i++) k.poly([24 + i * 1.6, 3.6 + i * 1.8, 27 + i * 1.4, 0.8 + i * 2.6, 25.6 + i * 1.4, 5 + i * 2], '#ffb040', { flat: true, noInk: true });
    k.glow(22.4, 8, 10, '#ff7a30', 0.7);
  }
  function chainmail(k) {
    k.path(c => { c.moveTo(9, 5); c.lineTo(13, 4); c.quadraticCurveTo(16, 7, 19, 4); c.lineTo(23, 5); c.lineTo(28.4, 13); c.lineTo(24.2, 15); c.lineTo(24, 28.4); c.lineTo(8, 28.4); c.lineTo(7.8, 15); c.lineTo(3.6, 13); c.closePath(); }, '#9aa2b0', { sh: 0.9 });
    const c = k.ctx; c.save(); c.strokeStyle = '#5a6270'; c.lineWidth = 0.45;
    for (let y = 8; y < 28; y += 2.2) for (let x = 9 + ((y / 2.2) % 2) * 1.1; x < 24; x += 2.2) { c.beginPath(); c.arc(x, y, 0.9, 0, TAU); c.stroke(); }
    c.restore();
    k.path(c2 => c2.rect(7.8, 25.6, 16.2, 2.8), '#6a4a2a', { sh: 0.3 });
  }
  function beltArt(k) {
    k.path(c => { c.moveTo(2, 12); c.quadraticCurveTo(16, 8.4, 30, 12); c.lineTo(30, 21); c.quadraticCurveTo(16, 17.4, 2, 21); c.closePath(); }, '#8a5a30', { sh: 0.9 });
    k.line(3, 14, 29, 14, '#c8a070', 0.4); k.line(3, 19, 29, 19, '#c8a070', 0.4);
    k.path(c => c.rect(10.6, 8.4, 10.8, 14.6), '#e8c050', { sh: 0.8 });
    k.path(c => c.rect(13.2, 11, 5.6, 9.4), '#6a4a1e', { sh: 0.3 });
    k.seg(16, 12.4, 16, 19, 0.6, 0.6, '#c8c8d0');
  }
  function vampArt(k) {
    k.seg(7, 29, 18, 12, 1.1, 1.3, '#4a2a2a');
    k.path(c => { c.moveTo(18.4, 12); c.quadraticCurveTo(10, 10, 6, 3.4); c.quadraticCurveTo(9.4, 5.4, 11.4, 4.4); c.quadraticCurveTo(12.6, 7.6, 16, 8.4); c.closePath(); }, '#5a1a2a', { sh: 0.4 });
    k.path(c => { c.moveTo(21.6, 15); c.quadraticCurveTo(24, 23.4, 29.6, 26); c.quadraticCurveTo(26.4, 26.6, 26.4, 28.4); c.quadraticCurveTo(23.4, 25.4, 21, 20.6); c.closePath(); }, '#5a1a2a', { sh: 0.4 });
    k.path(c => { c.moveTo(20.4, 4); c.lineTo(25, 9.4); c.lineTo(20.4, 15.4); c.lineTo(15.8, 9.4); c.closePath(); }, '#d0202a', { sh: 0.6 });
    k.glow(20.4, 9.4, 8, '#ff3040', 0.6);
  }
  function sheenArt(k) {
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; k.poly([16 + Math.cos(a - 0.12) * 8, 16 + Math.sin(a - 0.12) * 8, 16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15, 16 + Math.cos(a + 0.12) * 8, 16 + Math.sin(a + 0.12) * 8], '#bfe8ff', { flat: true, noInk: true }); }
    k.circ(16, 16, 8.4, '#c8a040', { sh: 0.6 });
    k.circ(16, 16, 6.2, '#3a8ae8', { sh: 0.7 });
    k.flat(c => c.ellipse(14, 13.6, 2.2, 1.4, -0.6, 0, TAU), rgba('#ffffff', 0.85));
    k.glow(16, 16, 13, '#80c8ff', 0.6);
  }
  function hammerArt(k, head, light, ice) {
    k.seg(7, 28.6, 19.6, 12.6, 1.3, 1.3, ice ? '#6a8aa8' : '#6a4a2a');
    k.at(21, 10.6, -PI / 4, () => {
      k.path(c => { c.moveTo(-7, -4.4); c.lineTo(7, -4.4); c.lineTo(8.4, -2); c.lineTo(8.4, 2); c.lineTo(7, 4.4); c.lineTo(-7, 4.4); c.lineTo(-8.4, 2); c.lineTo(-8.4, -2); c.closePath(); }, head, { sh: 0.8 });
      k.path(c => c.rect(-2, -4.8, 4, 9.6), shade(head, 0.8), { sh: 0.3 });
      if (ice) for (let i = 0; i < 4; i++) k.poly([-7 + i * 4, 4.4, -5.6 + i * 4, 8 + (i % 2) * 1.6, -4.2 + i * 4, 4.4], light, { sh: 0.2 });
    });
    k.glow(21, 10.6, 10, light, ice ? 0.55 : 0.3);
  }
  function zealArt(k) {
    k.path(c => { c.moveTo(6, 27); c.lineTo(7, 15); c.quadraticCurveTo(8, 11, 13, 10.4); c.lineTo(22, 10.4); c.quadraticCurveTo(26, 12, 25.4, 16); c.lineTo(24.4, 27); c.closePath(); }, '#e8b830', { sh: 0.9 });
    for (let i = 0; i < 3; i++) k.poly([10 + i * 5, 11, 12 + i * 5, 1.4 + i * 0.6, 14.4 + i * 5, 11], '#e8ecf4', { sh: 0.4 });
    k.path(c => c.rect(6, 20, 18.6, 4), '#a86a18', { sh: 0.4 });
    k.circ(15.4, 16, 2.2, '#ff5a3a', { sh: 0.3 }); k.glow(15.4, 16, 5, '#ffa030', 0.5);
  }
  function trinityArt(k) {
    k.path(c => { c.moveTo(16, 2.4); c.lineTo(29.6, 27); c.lineTo(2.4, 27); c.closePath(); c.moveTo(16, 10); c.lineTo(8.6, 23.4); c.lineTo(23.4, 23.4); c.closePath(); }, '#e8c050', { sh: 0.8 });
    for (const [x, y, col] of [[16, 4.6, '#ff3a4a'], [4.8, 25.4, '#3a7aff'], [27.2, 25.4, '#ffe040']]) { k.circ(x, y, 3.2, col, { sh: 0.5 }); k.glow(x, y, 6.4, col, 0.6); }
    k.path(c => star(c, 16, 19, 3, 3, 0.4), '#fff4c0', { sh: 0.2 });
  }
  function hatArt(k) {
    k.path(c => { c.moveTo(1.6, 24.4); c.quadraticCurveTo(16, 18.4, 30.4, 24.4); c.quadraticCurveTo(16, 30.4, 1.6, 24.4); c.closePath(); }, '#5a2a9a', { sh: 0.6 });
    k.path(c => { c.moveTo(7.6, 23.4); c.quadraticCurveTo(9.4, 12, 14, 7); c.quadraticCurveTo(18, 1, 26, 4); c.quadraticCurveTo(21, 5.4, 20, 10.4); c.quadraticCurveTo(22.4, 17, 24.4, 23.4); c.quadraticCurveTo(16, 21, 7.6, 23.4); c.closePath(); }, '#6a34b0', { sh: 1 });
    k.path(c => { c.moveTo(8.6, 20.6); c.quadraticCurveTo(16, 18.4, 23.6, 20.6); c.lineTo(24.2, 22.6); c.quadraticCurveTo(16, 20.6, 8, 22.6); c.closePath(); }, '#e8c050', { sh: 0.3 });
    k.path(c => star(c, 16, 14, 2.6, 5, 0.45), '#ffe070', { sh: 0.2 }); k.glow(16, 14, 5, '#c080ff', 0.5);
    k.circ(26, 4, 1.6, '#ffe070', { sh: 0.2 });
  }
  function hourglass(k) {
    k.path(c => c.rect(6, 2.6, 20, 3.6), '#e8c050', { sh: 0.5 }); k.path(c => c.rect(6, 25.8, 20, 3.6), '#e8c050', { sh: 0.5 });
    k.seg(8, 6, 8, 25.8, 0.9, 0.9, '#c89a3a'); k.seg(24, 6, 24, 25.8, 0.9, 0.9, '#c89a3a');
    k.path(c => { c.moveTo(9.6, 6.2); c.lineTo(22.4, 6.2); c.quadraticCurveTo(22, 12.6, 16.6, 16); c.quadraticCurveTo(22, 19.4, 22.4, 25.8); c.lineTo(9.6, 25.8); c.quadraticCurveTo(10, 19.4, 15.4, 16); c.quadraticCurveTo(10, 12.6, 9.6, 6.2); c.closePath(); }, '#d8ecf4', { sh: 0.6 });
    k.path(c => { c.moveTo(12, 10); c.lineTo(20, 10); c.quadraticCurveTo(19, 13.4, 16, 15.6); c.quadraticCurveTo(13, 13.4, 12, 10); c.closePath(); }, '#ffd040', { flat: true, noInk: true });
    k.path(c => { c.moveTo(10.6, 25); c.quadraticCurveTo(16, 19, 21.4, 25); c.closePath(); }, '#ffd040', { flat: true, noInk: true });
    k.line(16, 16, 16, 22, '#ffd040', 0.5);
    k.glow(16, 16, 10, '#ffe070', 0.4);
  }
  function crystalStaff(k) {
    k.seg(6, 29, 17.4, 14.4, 1.1, 1.3, '#8aa8c8');
    k.path(c => { c.moveTo(17, 14.6); c.lineTo(16.4, 6.4); c.lineTo(21, 1.4); c.lineTo(27.6, 4.4); c.lineTo(26.6, 11); c.lineTo(20.4, 15.6); c.closePath(); }, '#9ae0ff', { sh: 0.7 });
    k.poly([18, 8, 21, 2.6, 22.6, 12.6], '#e8faff', { flat: true, noInk: true });
    for (const [x, y] of [[12, 22], [15, 17], [9, 25]]) k.poly([x - 2.4, y, x, y - 1.2, x + 0.6, y + 1.8], '#c8f0ff', { sh: 0.2 });
    k.glow(22, 8, 11, '#80e0ff', 0.6);
  }
  function capeArt(k, col, fire) {
    k.path(c => { c.moveTo(9.4, 5); c.lineTo(22.6, 5); c.quadraticCurveTo(27, 16, 29, 29); c.quadraticCurveTo(22, 26, 16, 29); c.quadraticCurveTo(10, 26, 3, 29); c.quadraticCurveTo(5, 16, 9.4, 5); c.closePath(); }, col, { sh: 1 });
    k.path(c => c.rect(8.4, 3.4, 15.2, 3.6), '#e8c050', { sh: 0.4 }); k.circ(16, 5.2, 1.8, '#ff4a2a', { sh: 0.3 });
    if (fire) { for (let i = 0; i < 5; i++) k.poly([5 + i * 5.4, 29, 7.4 + i * 5.4, 19 - (i % 2) * 4, 10 + i * 5.4, 29], i % 2 ? '#ffd040' : '#ff7a20', { flat: true, noInk: true }); k.glow(16, 24, 14, '#ff7020', 0.55); }
  }
  function spikyPlate(k, col, spike) {
    k.path(c => { c.moveTo(8, 6); c.quadraticCurveTo(16, 3.4, 24, 6); c.lineTo(26.6, 12); c.lineTo(24.4, 27.4); c.quadraticCurveTo(16, 30, 7.6, 27.4); c.lineTo(5.4, 12); c.closePath(); }, col, { sh: 1 });
    for (const [x, y, a] of [[6, 10, PI], [26, 10, 0], [10, 16, -2.4], [22, 16, -0.7], [16, 12, -PI / 2], [11, 24, -2.6], [21, 24, -0.5]]) k.poly([x + Math.cos(a + 1.6) * 1.4, y + Math.sin(a + 1.6) * 1.4, x + Math.cos(a) * 4.6, y + Math.sin(a) * 4.6, x + Math.cos(a - 1.6) * 1.4, y + Math.sin(a - 1.6) * 1.4], spike, { sh: 0.2 });
  }
  function heavyArmor(k, col, heart) {
    k.path(c => { c.moveTo(4, 9); c.quadraticCurveTo(7, 3.6, 12, 4.6); c.quadraticCurveTo(16, 7, 20, 4.6); c.quadraticCurveTo(25, 3.6, 28, 9); c.lineTo(26, 15); c.lineTo(25, 28.4); c.lineTo(7, 28.4); c.lineTo(6, 15); c.closePath(); }, col, { sh: 1 });
    k.path(c => { c.moveTo(4, 9); c.quadraticCurveTo(3, 15, 7.6, 16.4); c.lineTo(9.6, 9.6); c.closePath(); }, shade(col, 1.15), { sh: 0.4 }); k.path(c => { c.moveTo(28, 9); c.quadraticCurveTo(29, 15, 24.4, 16.4); c.lineTo(22.4, 9.6); c.closePath(); }, shade(col, 1.15), { sh: 0.4 });
    k.path(c => { c.moveTo(16, 24.4); c.bezierCurveTo(8.6, 18.4, 11, 11.4, 16, 14.8); c.bezierCurveTo(21, 11.4, 23.4, 18.4, 16, 24.4); c.closePath(); }, heart, { sh: 0.5 });
    k.glow(16, 18, 8, heart, 0.55);
  }
  function veil(k) {
    k.path(c => { c.moveTo(16, 2.4); c.quadraticCurveTo(28, 4, 27, 16); c.quadraticCurveTo(28.4, 24, 30.4, 29.4); c.quadraticCurveTo(24, 25.4, 20, 29.4); c.quadraticCurveTo(16, 25, 12, 29.4); c.quadraticCurveTo(8, 25.4, 1.6, 29.4); c.quadraticCurveTo(3.6, 24, 5, 16); c.quadraticCurveTo(4, 4, 16, 2.4); c.closePath(); }, '#2aa0a0', { sh: 1 });
    k.path(c => { c.moveTo(16, 6.4); c.quadraticCurveTo(22.4, 7.4, 22, 14.4); c.quadraticCurveTo(21, 21, 16, 22.4); c.quadraticCurveTo(11, 21, 10, 14.4); c.quadraticCurveTo(9.6, 7.4, 16, 6.4); c.closePath(); }, '#eef4f4', { sh: 0.6 });
    k.path(c => { c.moveTo(11.6, 12.6); c.quadraticCurveTo(13.6, 11.4, 15, 13.4); c.quadraticCurveTo(13.4, 14.6, 11.6, 12.6); c.closePath(); }, '#102828', { flat: true, noInk: true });
    k.path(c => { c.moveTo(20.4, 12.6); c.quadraticCurveTo(18.4, 11.4, 17, 13.4); c.quadraticCurveTo(18.6, 14.6, 20.4, 12.6); c.closePath(); }, '#102828', { flat: true, noInk: true });
    k.glow(16, 14, 10, '#60f0f0', 0.4);
  }
  function iceHeart(k) {
    k.path(c => { c.moveTo(16, 29); c.bezierCurveTo(1.4, 18.4, 3.4, 3.4, 16, 9.4); c.bezierCurveTo(28.6, 3.4, 30.6, 18.4, 16, 29); c.closePath(); }, '#6ac8f4', { sh: 1 });
    k.poly([16, 9.4, 11, 15, 16, 26, 21, 15], '#bfeaff', { flat: true, noInk: true });
    k.line(8, 12, 24, 12, 'rgba(255,255,255,0.5)', 0.4);
    for (const [x, y] of [[9, 7], [24, 6], [27, 17], [5, 17]]) k.path(c => star(c, x, y, 1.8, 4, 0.3), '#ffffff', { flat: true, noInk: true });
    k.glow(16, 17, 12, '#a0e8ff', 0.6);
  }
  function angel(k) {
    k.path(c => { c.moveTo(15, 14); c.quadraticCurveTo(4, 12, 1.4, 3.4); c.quadraticCurveTo(5, 6, 7, 5); c.quadraticCurveTo(8, 9, 10.4, 9.4); c.quadraticCurveTo(10.6, 12, 15, 12.4); c.closePath(); }, '#f4f8ff', { sh: 0.5 });
    k.path(c => { c.moveTo(17, 14); c.quadraticCurveTo(28, 12, 30.6, 3.4); c.quadraticCurveTo(27, 6, 25, 5); c.quadraticCurveTo(24, 9, 21.6, 9.4); c.quadraticCurveTo(21.4, 12, 17, 12.4); c.closePath(); }, '#f4f8ff', { sh: 0.5 });
    k.path(c => { c.moveTo(9.4, 9.4); c.lineTo(22.6, 9.4); c.lineTo(22.6, 18); c.quadraticCurveTo(22, 25.4, 16, 29.4); c.quadraticCurveTo(10, 25.4, 9.4, 18); c.closePath(); }, '#e8c050', { sh: 0.8 });
    k.path(c => { c.moveTo(12, 12); c.lineTo(20, 12); c.lineTo(20, 18); c.quadraticCurveTo(19.4, 22.6, 16, 25.4); c.quadraticCurveTo(12.6, 22.6, 12, 18); c.closePath(); }, '#fff4d0', { sh: 0.3 });
    k.path(c => star(c, 16, 17.4, 2.6, 4, 0.35), '#e8a030', { sh: 0.2 });
    k.glow(16, 16, 12, '#fff0b0', 0.45);
  }
  function ghostBlade(k) {
    k.path(c => { c.arc(20, 11, 8.4, 0.8, 4.4); c.arc(22.6, 9, 6.4, 4.4, 0.8, true); c.closePath(); }, '#8a7aff', { sh: 0.6 });
    sword(k, { len: 19, w: 1.9, blade: '#d8d0ff', edge: '#ffffff', guard: '#6a5ab0', grip: '#2a2040', pommel: '#6a5ab0', x: 9, y: 24 });
    k.glow(16, 14, 12, '#a090ff', 0.55);
  }

  const CAT_BG = { cons: ['#2a4a52', '#081216'], start: ['#6a5230', '#140e06'], basic: ['#3e4656', '#0c0e14'], attack: ['#7a2e1e', '#180604'], magic: ['#4a2e86', '#0a0616'], defense: ['#2e6a44', '#06140c'], boots: ['#6a4a30', '#140c06'] };
  const IT = {
    hpPot: k => potion(k, '#e02830', '#ff9a9a'), manaPot: k => potion(k, '#2a5ae0', '#9ac0ff'),
    ward: k => wardIcon(k, '#38c050', '#c0ffc0'), visionWard: k => wardIcon(k, '#d03aa8', '#ffc0f0'),
    doranBlade: k => sword(k, { len: 22, w: 2.4, blade: '#d8dce4', edge: '#ffffff', guard: '#c8a040', grip: '#6a3a1a', pommel: '#e03040', x: 8, y: 24, gem: '#e03040' }),
    doranRing: k => ring(k, '#e8c050', '#4a8aff'),
    doranShield: k => roundShield(k, '#9a6a36', '#c8ccd4', '#e8c050'),
    longSword: k => sword(k, { len: 26, w: 1.7, blade: '#c8d0dc', edge: '#ffffff', guard: '#9aa0aa', grip: '#5a3a20', pommel: '#9aa0aa' }),
    tome: k => book(k, '#5a2aa8', '#e8c050', '#d090ff'),
    clothArmor: k => tunic(k, '#a87a4e', '#5a3a1e'),
    nullMantle: k => cloak(k, '#6a3aa8', '#c090ff'),
    ruby: k => gem(k, '#d82838', '#ffa0a8'), sapphire: k => gem(k, '#2a5ae0', '#a0c8ff'),
    dagger: k => sword(k, { len: 16, w: 1.9, blade: '#d0d8e0', edge: '#ffffff', guard: '#8a8a94', grip: '#3a2a1a', pommel: '#8a8a94', x: 10, y: 22 }),
    brawler: k => glove(k, '#a86a32', '#5a3a1e'),
    boots: k => bootArt(k, '#8a5a30', '#6a4020', null),
    bfSword: k => sword(k, { len: 29, w: 3.4, blade: '#dce4ee', edge: '#ffffff', guard: '#c8a040', grip: '#4a3020', pommel: '#c8a040', x: 5.6, y: 26.4 }),
    pickaxe: k => pickaxe(k),
    rod: k => staffArt(k, '#6a4a2a', '#9a4aff', '#e0b0ff', false),
    blastingWand: k => wand(k),
    chainVest: k => chainmail(k),
    giantsBelt: k => beltArt(k),
    vampScepter: k => vampArt(k),
    sheen: k => sheenArt(k),
    phage: k => hammerArt(k, '#b82a2a', '#ff8070', false),
    zeal: k => zealArt(k),
    berserkers: k => bootArt(k, '#b02a2a', '#6a1818', 'claws'),
    sorcShoes: k => bootArt(k, '#6a2aa8', '#3a1a6a', 'curl'),
    tabi: k => bootArt(k, '#3a3a46', '#8a8a96', 'tabi'),
    mercs: k => bootArt(k, '#6a7a92', '#3a4a5c', 'wing'),
    ionian: k => bootArt(k, '#2a6ab0', '#e8c050', 'ionian'),
    infinityEdge: k => sword(k, { len: 29, w: 3.6, blade: '#f0d470', edge: '#fff8d8', guard: '#c89030', grip: '#3a2a1a', pommel: '#c89030', x: 5.6, y: 26.4, gem: '#ff3040' }),
    bloodthirster: k => sword(k, { len: 28, w: 3, blade: '#c82030', edge: '#ff8a8a', guard: '#3a1a1a', grip: '#2a1010', pommel: '#8a1a1a', x: 6, y: 26, wings: '#4a1a24', drip: '#e01020' }),
    phantomDancer: k => ghostBlade(k),
    trinity: k => trinityArt(k),
    frozenMallet: k => hammerArt(k, '#8ad4f4', '#e8faff', true),
    deathcap: k => hatArt(k),
    zhonya: k => hourglass(k),
    archangel: k => staffArt(k, '#8a9ab8', '#3a8aff', '#a0d8ff', true),
    lichBane: k => sword(k, { len: 27, w: 2.6, blade: '#8a5ad8', edge: '#e0c8ff', guard: '#3a2a4a', grip: '#2a1a30', pommel: '#6a4a8a', x: 6, y: 26, skull: true }),
    rylai: k => crystalStaff(k),
    sunfire: k => capeArt(k, '#c8401a', true),
    thornmail: k => spikyPlate(k, '#3a8a3a', '#d8e0c0'),
    warmog: k => heavyArmor(k, '#3a9a5a', '#e02838'),
    banshee: k => veil(k),
    frozenHeart: k => iceHeart(k),
    guardianAngel: k => angel(k)
  };
  function itemIcon(id, s) {
    const it = D.ITEMS[id] || { cat: 'basic', cost: 0 }, bgc = CAT_BG[it.cat] || CAT_BG.basic;
    const cv = mk(s, s), ctx = cv.getContext('2d');
    glowBg(ctx, s, bgc[0], bgc[1]);
    const g = mk(s, s), gc = g.getContext('2d'), px = s / 32;
    gc.scale(px, px);
    const k = M.kit(gc, px, px >= 0.9);
    (IT[id] || (kk => gem(kk, '#888888', '#cccccc')))(k);
    gc.setTransform(1, 0, 0, 1, 0, 0);
    crisp(g, [14, 8, 6]);
    M.paintGlows(gc, k.glows);
    ctx.drawImage(g, 0, 0);
    const legendary = it.cost >= 2500;
    bevel(ctx, s, legendary ? 'rgba(255,220,120,0.7)' : 'rgba(255,255,255,0.3)', legendary ? 'rgba(120,80,20,0.9)' : 'rgba(0,0,0,0.6)');
    return cv;
  }

  const BUFF_GLYPH = { blue: ['orb', '#2a5aff'], red: ['fire', '#c82a10'], baron: ['will', '#7a2ac8'], dragon: ['fire', '#e07020'], regen: ['heal', '#b02a2a'], excited: ['zap', '#e04a8a'], highlander: ['highlander', '#3a9a2a'], whimsy: ['pix', '#c050c0'], wildGrowth: ['grow', '#2a8a3a'], desperate: ['power', '#1a4aa8'], buff: ['courage', '#6a6a3a'] };
  function buffIcon(key, s) { const b = BUFF_GLYPH[key] || BUFF_GLYPH.buff; return glyphIcon(s, G[b[0]] || SPELL_GLYPH[b[0]], shade(b[1], 1.2), shade(b[1], 0.3)); }

  const STAT_GLYPH = {
    ad: k => { k.line(3, 13, 12, 4, '#f0e0c0', 2); k.poly([12, 4, 14, 2, 13, 6], '#ffffff'); k.line(2.4, 10.6, 5.4, 13.6, '#ffb060', 2); },
    ap: k => { k.poly([8, 1, 10, 6, 15, 7, 11, 10, 12, 15, 8, 12, 4, 15, 5, 10, 1, 7, 6, 6], '#c080ff'); },
    armor: k => { k.poly([3, 3, 13, 3, 13, 8, 8, 15, 3, 8], '#e0c060'); k.poly([5, 5, 11, 5, 11, 8, 8, 12, 5, 8], '#fff0b0'); },
    mr: k => { k.poly([3, 3, 13, 3, 13, 8, 8, 15, 3, 8], '#60b0ff'); k.poly([8, 5, 10, 8, 8, 11, 6, 8], '#e0f4ff'); },
    asp: k => { k.line(3, 12, 11, 4, '#ffe080', 1.6); k.line(6, 14, 14, 6, '#ffe080', 1.6); k.poly([11, 4, 13, 2, 12, 5], '#ffffff'); k.poly([14, 6, 15, 3, 13, 5], '#ffffff'); },
    msFlat: k => { k.poly([5, 2, 10, 2, 10, 9, 14, 10, 14, 14, 4, 14], '#e0e0e0'); },
    crit: k => { k.poly([8, 1, 9.4, 6, 15, 4, 10.6, 8, 15, 12, 9.4, 10, 8, 15, 6.6, 10, 1, 12, 5.4, 8, 1, 4, 6.6, 6], '#ff8060'); },
    cdr: k => { k.rect(4, 2, 8, 1.6, '#c0a060'); k.rect(4, 12.4, 8, 1.6, '#c0a060'); k.poly([5, 3.6, 11, 3.6, 8, 8], '#80e0ff'); k.poly([8, 8, 11, 12.4, 5, 12.4], '#80e0ff'); }
  };
  function statIcon(key, s) {
    const g = mk(s, s), gc = g.getContext('2d'), sc = s / 16;
    gc.scale(sc, sc); STAT_GLYPH[key](L.GFX.K(gc)); crisp(g, [10, 8, 6]);
    return g;
  }

  function chest(s, open, glowCol) {
    const cv = mk(s, s), ctx = cv.getContext('2d'), px = s / 64;
    ctx.scale(px, px);
    const k = M.kit(ctx, px, true), gem = glowCol || '#40d0ff';
    if (open) {
      k.path(c => { c.moveTo(10, 30); c.lineTo(54, 30); c.lineTo(50, 12); c.quadraticCurveTo(32, 4, 14, 12); c.closePath(); }, '#3a4a6a', { sh: 1.4 });
      k.path(c => { c.moveTo(14, 12); c.quadraticCurveTo(32, 4, 50, 12); c.lineTo(48, 15); c.quadraticCurveTo(32, 8, 16, 15); c.closePath(); }, '#e8c050', { sh: 0.6 });
      k.path(c => { c.moveTo(8.6, 35); c.lineTo(55.4, 35); c.lineTo(52, 27.6); c.lineTo(12, 27.6); c.closePath(); }, '#d8faff', { flat: true, noInk: true });
      k.path(c => { c.moveTo(14, 33.6); c.lineTo(50, 33.6); c.lineTo(48, 29.4); c.lineTo(16, 29.4); c.closePath(); }, '#ffffff', { flat: true, noInk: true });
      for (let i = 0; i < 5; i++) k.glow(16 + i * 8, 22 - (i % 2) * 5, 9, gem, 0.55);
      k.glow(32, 30, 30, gem, 0.95);
    }
    k.path(c => { c.moveTo(8, 34); c.lineTo(56, 34); c.lineTo(53, 58); c.lineTo(11, 58); c.closePath(); }, '#2e3e5e', { sh: 1.6 });
    for (const x of [14, 50]) k.path(c => c.rect(x - 3, 34, 6, 24), '#e8c050', { sh: 0.6 });
    k.path(c => c.rect(8, 34, 48, 5), '#e8c050', { sh: 0.6 });
    k.path(c => c.rect(10.4, 53, 43.2, 5), '#c89a3a', { sh: 0.5 });
    if (!open) {
      k.path(c => { c.moveTo(6, 35); c.lineTo(58, 35); c.lineTo(56, 22); c.quadraticCurveTo(32, 12, 8, 22); c.closePath(); }, '#3a4c70', { sh: 1.4 });
      k.path(c => { c.moveTo(8, 22); c.quadraticCurveTo(32, 12, 56, 22); c.lineTo(56.6, 26); c.quadraticCurveTo(32, 16, 7.4, 26); c.closePath(); }, '#e8c050', { sh: 0.6 });
      for (const x of [14, 50]) k.path(c => { c.moveTo(x - 3, 19.6); c.lineTo(x + 3, 18.6); c.lineTo(x + 3, 35); c.lineTo(x - 3, 35); c.closePath(); }, '#e8c050', { sh: 0.5 });
    }
    k.path(c => { c.moveTo(32, 32); c.lineTo(39, 39); c.lineTo(32, 48); c.lineTo(25, 39); c.closePath(); }, '#e8c050', { sh: 0.6 });
    k.path(c => { c.moveTo(32, 34.6); c.lineTo(36.4, 39.2); c.lineTo(32, 45); c.lineTo(27.6, 39.2); c.closePath(); }, gem, { sh: 0.5 });
    k.glow(32, 39.6, 12, gem, open ? 1 : 0.75);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const out = mk(s, s); out.getContext('2d').drawImage(cv, 0, 0); crisp(out, [10, 8, 18]);
    const oc = out.getContext('2d'); M.paintGlows(oc, k.glows);
    return out;
  }
  function rarityGem(s, col) {
    const cv = mk(s, s), ctx = cv.getContext('2d'), c = s / 2;
    ctx.fillStyle = '#0a0a10'; ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(s, c); ctx.lineTo(c, s); ctx.lineTo(0, c); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(c, 1.5); ctx.lineTo(s - 1.5, c); ctx.lineTo(c, s - 1.5); ctx.lineTo(1.5, c); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(c, 1.5); ctx.lineTo(c, c); ctx.lineTo(1.5, c); ctx.closePath(); ctx.fill();
    return cv;
  }

  const cache = new Map();
  const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
  L.Icons = {
    item: (id, s) => memo(`i|${id}|${s}`, () => itemIcon(id, s)),
    ability: (cid, slot, s) => memo(`a|${cid}|${slot}|${s}`, () => abilityIcon(cid, slot, s)),
    spell: (id, s) => memo(`s|${id}|${s}`, () => spellIcon(id, s)),
    buff: (key, s) => memo(`b|${key}|${s}`, () => buffIcon(key, s)),
    stat: (key, s) => memo(`t|${key}|${s}`, () => statIcon(key, s)),
    chest: (s, open, col) => memo(`c|${s}|${open ? 1 : 0}|${col || ''}`, () => chest(s, open, col)),
    rarity: (s, col) => memo(`r|${s}|${col}`, () => rarityGem(s, col)),
    ITEMS_DRAWN: IT
  };
})(globalThis.LoL98 = globalThis.LoL98 || {});
