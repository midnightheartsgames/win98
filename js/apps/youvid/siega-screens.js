(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, mesh, textCanvas } = K;

  const FW = 480;
  const FH = 270;
  const WIN = { x: 42, y: 8.25, w: 400, h: 256, bar: 15 };

  const CHAT = [
    ['[союзникам]: ', 'Rocket_Mama (Свен) и Башня Тьмы дали друг'],
    ['', 'другу пять!'],
    ['q7731 [bnTM] ', '(Акс) выкупается в игру!'],
    ['Моя форма Супер-Саян', ': нарезчик, ку, ты легенда'],
    ['Снайпер_Петрович ', '(Снайпер) выкупается в игру!']
  ];

  const STATS = [['Физ. защита', '54%'], ['Сопр. магии', '33%'], ['Сопр. эффектам', '0.0%'], ['Уклонение', '0%'], ['Восст. здоровья', '7.95']];

  function groundTex(ctx, w, h) {
    const g = rand(77);
    ctx.fillStyle = '#625e57';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) {
      const x = g() * w, y = g() * h, r = 3 + g() * 18;
      ctx.fillStyle = g() < 0.5 ? `rgba(36,34,30,${0.06 + g() * 0.1})` : `rgba(150,146,136,${0.05 + g() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.4 + g() * 0.6), g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      let x = g() * w, y = g() * h;
      ctx.strokeStyle = `rgba(28,26,24,${0.35 + g() * 0.3})`;
      ctx.lineWidth = 1 + g() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (g() - 0.5) * 60;
        y += (g() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const cx = w * 0.45, cy = h * 0.3;
    for (let i = 0; i < 60; i++) {
      const a = g() * PI * 2, d = g() * w * 0.17;
      const x = cx + C(a) * d * 1.3, y = cy + S(a) * d * 0.7;
      const sw = 26 + g() * 30, sh = 18 + g() * 22;
      ctx.fillStyle = `rgb(${120 + g() * 40},${116 + g() * 40},${106 + g() * 36})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((g() - 0.5) * 0.5);
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.strokeStyle = 'rgba(40,38,34,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    }
  }

  function buildGround(b) {
    b.quad([-6, 0, -6], [6, 0, -6], [6, 0, 6], [-6, 0, 6], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function buildRing(b) {
    const n = 56;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, r) => [S(a) * r, 0, C(a) * r];
      b.quad(p(a0, 0.8), p(a1, 0.8), p(a1, 0.9), p(a0, 0.9), [0.55, 0.55, 0.55, 1]);
      b.quad(p(a0, 0.9), p(a1, 0.9), p(a1, 1.0), p(a0, 1.0), [1, 1, 1, 1]);
      b.quad(p(a0, 1.0), p(a1, 1.0), p(a1, 1.1), p(a0, 1.1), [0.5, 0.5, 0.5, 1]);
    }
  }

  function buildDisc(b) {
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.tri([0, 0, 0], [S(a0), 0, C(a0)], [S(a1), 0, C(a1)], [[1, 1, 1, 1], [0.25, 0.25, 0.25, 1], [0.25, 0.25, 0.25, 1]]);
    }
  }

  function buildUnit(b, col, big) {
    const s = big ? 1.25 : 1;
    b.at(0, 0.16 * s, 0, h => h.prism(8, 0.1 * s, 0.08 * s, -0.16 * s, 0.13 * s, 0.1 * s, 0.14 * s, col, { capBottom: true }));
    b.at(0, 0.38 * s, 0.02 * s, h => h.ellipsoid(0.075 * s, 0.08 * s, 0.075 * s, 8, 5, shade(col, 1.15)));
    [-1, 1].forEach(k => b.at(k * 0.16 * s, 0.22 * s, 0, h => h.box(0.06 * s, 0.2 * s, 0.06 * s, shade(col, 0.85))));
    if (big) {
      b.at(0.2 * s, 0.25 * s, 0.1, h => h.box(0.04, 0.04, 0.42, 0xb8b8bc));
      b.at(0, 0.3 * s, -0.12 * s, h => h.box(0.26 * s, 0.24 * s, 0.03, shade(col, 0.6)));
    }
  }

  function buildRocks(b) {
    const g = rand(5);
    for (let i = 0; i < 14; i++) {
      const a = g() * PI * 2, d = 1.25 + g() * 0.5;
      b.push(M4.translate(S(a) * d, 0.04, C(a) * d), M4.rotY(g() * PI));
      b.box(0.12 + g() * 0.18, 0.06 + g() * 0.1, 0.1 + g() * 0.14, shade(0x4a4844, 0.8 + g() * 0.5));
      b.pop();
    }
  }

  function lineTex(prefix, text) {
    return (ctx, w, h) => {
      ctx.font = '11px Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(prefix + text, 1.2, h / 2 + 1.2);
      ctx.fillStyle = prefix ? '#9c9ca0' : '#f2f2f2';
      ctx.fillText(prefix, 0, h / 2);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillText(text, ctx.measureText(prefix).width, h / 2);
    };
  }

  function deadTex(ctx, w, h) {
    ctx.fillStyle = 'rgba(70,70,72,0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2f2f2';
    ctx.font = '17px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Вы мертвы', w / 2, h / 2 + 1);
  }

  function barTex(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '10px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Свен', 23, 7);
    ctx.fillStyle = '#ececec';
    ctx.fillText('Свен', 22, 6);
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(16, 13, 64, 7);
    ctx.fillStyle = '#d6d6d6';
    ctx.fillRect(17, 14, 44, 5);
    for (let i = 1; i < 8; i++) {
      ctx.fillStyle = '#0c0c0c';
      ctx.fillRect(17 + i * 8, 14, 1, 5);
    }
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(82, 11, 15, 11);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('25', 84, 17);
    ctx.fillStyle = '#8c8c8c';
    ctx.beginPath();
    ctx.arc(9, 15, 6, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(7, 12, 4, 6);
  }

  function statsTex(ctx, w, h) {
    ctx.font = '9px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    STATS.forEach(([name, val], i) => {
      const y = 7 + i * 12;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(name, 1, y + 1);
      ctx.fillStyle = '#b8b8b8';
      ctx.fillText(name, 0, y);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText(val, 74, y);
    });
  }

  function cursorTex(ctx, w, h) {
    ctx.fillStyle = '#f4f4f4';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(2, 24);
    ctx.lineTo(8, 18);
    ctx.lineTo(13, 28);
    ctx.lineTo(17, 26);
    ctx.lineTo(12, 16);
    ctx.lineTo(20, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function callBackTex(ctx, w, h) {
    ctx.fillStyle = '#8b8b8d';
    ctx.fillRect(0, 0, w, h);
    const sx = w / FW, sy = h / FH;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect((WIN.x + 2) * sx, (WIN.y + 4) * sy, WIN.w * sx, WIN.h * sy);
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(WIN.x * sx, WIN.y * sy, WIN.w * sx, WIN.h * sy);
    [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([col, i]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc((WIN.x + 12 + i * 14) * sx, (WIN.y + 7) * sy, 3.7 * sx, 0, PI * 2);
      ctx.fill();
    });
  }

  function callButtonsTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cy = h * 0.42, r = h * 0.3;
    [[w * 0.25, 'rgba(78,74,70,0.9)', 'cam'], [w * 0.5, '#ff3b30', 'end'], [w * 0.75, 'rgba(78,74,70,0.9)', 'mic']].forEach(([x, col, kind]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = r * 0.14;
      ctx.lineCap = 'round';
      if (kind === 'cam') {
        ctx.strokeRect(x - r * 0.42, cy - r * 0.26, r * 0.84, r * 0.56);
        ctx.beginPath();
        ctx.arc(x, cy + r * 0.02, r * 0.16, 0, PI * 2);
        ctx.stroke();
      } else if (kind === 'end') {
        ctx.beginPath();
        ctx.arc(x, cy + r * 0.45, r * 0.62, PI * 1.18, PI * 1.82);
        ctx.lineWidth = r * 0.22;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, cy - r * 0.4);
        ctx.lineTo(x, cy + r * 0.05);
        ctx.lineWidth = r * 0.24;
        ctx.stroke();
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.arc(x, cy - r * 0.05, r * 0.3, 0.1, PI - 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, cy + r * 0.25);
        ctx.lineTo(x, cy + r * 0.42);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.45, cy - r * 0.5);
        ctx.lineTo(x + r * 0.45, cy + r * 0.5);
        ctx.stroke();
      }
    });
  }

  function timerTex(sec) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f2f2f2';
      ctx.font = `${Math.round(h * 0.62)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`00:00:0${clamp(sec, 0, 9)}`, w / 2, h / 2);
    };
  }

  function build(r) {
    const timers = {};
    return {
      ground: mesh(r, buildGround),
      groundTex: r.texture(1024, groundTex),
      ring: mesh(r, buildRing),
      disc: mesh(r, buildDisc),
      hero: mesh(r, b => buildUnit(b, 0x6a6a70, true)),
      foe: mesh(r, b => buildUnit(b, 0x3c3c40, false)),
      rocks: mesh(r, buildRocks),
      lines: CHAT.map(([prefix, text]) => r.texture(1024, textCanvas(340, 16, lineTex(prefix, text)), { height: 64, clamp: true })),
      dead: r.texture(256, textCanvas(112, 24, deadTex), { height: 64, clamp: true }),
      bar: r.texture(256, textCanvas(100, 24, barTex), { height: 64, clamp: true }),
      stats: r.texture(256, textCanvas(100, 62, statsTex), { height: 160, clamp: true }),
      cursor: r.texture(32, cursorTex, { clamp: true }),
      callBack: r.texture(1024, callBackTex, { height: 576, clamp: true }),
      callButtons: r.texture(512, callButtonsTex, { height: 128, clamp: true }),
      timer: (sec) => {
        if (!timers[sec]) timers[sec] = r.texture(128, timerTex(sec), { height: 32, clamp: true });
        return timers[sec];
      }
    };
  }

  const GAME_ENV = {
    sunDir: [0.3, -1, -0.4],
    sunColor: [0.62, 0.62, 0.62],
    ambTop: [0.5, 0.5, 0.5],
    ambBottom: [0.3, 0.3, 0.3],
    fogColor: [0.1, 0.1, 0.1],
    fogNear: 30,
    fogFar: 60
  };

  const GAME_CAM = [
    [0, [-0.6, 0, 2.3]],
    [0.33, [-0.58, 0, 2.22]],
    [0.75, [0.3, 0, 0.55]],
    [3.0, [0.4, 0, 0.42]]
  ];
  const camAt = K.keys(GAME_CAM);

  const PUFFS = [[1.2, -0.3, 0.3, 0.35], [1.5, -0.2, 0.4, 0.45], [1.85, -0.25, 0.42, 0.5], [2.2, -0.1, 0.5, 0.62], [2.5, -0.05, 0.55, 0.72], [2.75, 0.0, 0.55, 0.8]];
  const SMOKE = [[0.6, -0.9, -0.6], [0.7, 0.8, -0.4], [0.75, 0.2, 0.1], [0.9, -0.5, 0.2]];

  function project(r, p) {
    const m = r.viewProj;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [(x / w * 0.5 + 0.5) * FW, (0.5 - y / w * 0.5) * FH];
  }

  function drawGame(r, G, ov, st, cam) {
    const dt = st.t - 125.15;
    const target = camAt(dt);
    const camera = {
      eye: [target[0], 4.2, target[2] + 2.3], at: target, fov: 42, near: 0.1, far: 40,
      grade: [1, 1, 1, 1], colorM: cam.colorM, colorAdd: cam.colorAdd, fx: cam.fx
    };
    r.begin(GAME_ENV, camera);
    r.draw(G.ground, null, { texture: G.groundTex });
    r.draw(G.rocks, M4.translate(0, 0, -1.0));
    const pulse = 0.94 + 0.06 * S(dt * 11);
    r.draw(G.disc, M4.chain(M4.translate(0, 0.012, -1.0), M4.scale(0.9, 1, 0.9)), { additive: true, alpha: 0.22, noFog: true });
    r.draw(G.ring, M4.chain(M4.translate(0, 0.02, -1.0), M4.scale(pulse, 1, pulse)), { additive: true, alpha: 0.9, noFog: true });
    const hero = [-0.3, 0, -0.3];
    r.draw(G.hero, M4.chain(M4.translate(hero[0], 0, hero[2]), M4.rotY(0.6 + dt * 0.4)));
    r.draw(G.foe, M4.chain(M4.translate(0.35, 0, -1.25), M4.rotY(-2.2 + dt)));
    r.draw(G.foe, M4.chain(M4.translate(0.15, 0, -0.7), M4.rotY(2.6)));
    r.draw(G.foe, M4.chain(M4.translate(-0.55, 0, -1.3), M4.rotY(2.0 - dt)));
    r.draw(G.hero, M4.chain(M4.translate(-0.95, 0.06, 2.6), M4.rotZ(1.5)), { tint: [0.55, 0.55, 0.55] });
    SMOKE.forEach(([t0, x, z]) => {
      const k = clamp((dt - t0) / 1.2, 0, 1);
      if (k <= 0 || k >= 1) return;
      const s = 0.5 + k * 0.6;
      r.draw(G.disc, M4.chain(M4.translate(x, 0.3, z - 1.0), M4.scale(s, 1, s)), { additive: true, alpha: 0.28 * S(k * PI), noFog: true });
    });
    PUFFS.forEach(([t0, x, z, size]) => {
      const k = (dt - t0) / 0.6;
      if (k < 0 || k > 1) return;
      const s = size * (0.5 + k * 0.8);
      r.draw(G.disc, M4.chain(M4.translate(x, 0.1 + k * 0.1, z), M4.scale(s, 1, s)), { additive: true, alpha: 0.85 * (1 - k * 0.8), noFog: true });
    });
    const label = project(r, [hero[0], 0.75, hero[2]]);
    const corpse = project(r, [-0.95, 0.3, 2.6]);
    ov.begin();
    if (dt < 0.45) ov.rect(corpse[0] - 20, corpse[1] - 12, 40, 3, { flat: [0.75, 0.75, 0.75, 1] });
    if (dt > 0.5) ov.rect(label[0] - 30, label[1] - 16, 80, 19, { texture: G.bar });
    const up = dt > 2.35 ? 16.5 : 0;
    if (dt < 0.62) {
      ov.rect(-62, 135, 340, 16, { texture: G.lines[0] });
      ov.rect(-2, 149, 340, 16, { texture: G.lines[1] });
    }
    ov.rect(-12, 165 - up, 340, 16, { texture: G.lines[2] });
    ov.rect(18, 181 - up, 340, 16, { texture: G.lines[3] });
    ov.rect(0, 182 - up, 15, 14, { flat: [0.32, 0.32, 0.34, 1] });
    if (dt > 2.35) ov.rect(-22, 181, 340, 16, { texture: G.lines[4] });
    if (dt < 2.3) ov.rect(184, 198, 112, 24, { texture: G.dead });
    if (dt > 1.7 && dt < 2.3) ov.rect(64, 4, 100, 62, { texture: G.stats });
    const cx = dt < 1.2 ? 420 - dt * 30 : 380 + 30 * S(dt * 1.7), cy = dt < 1.2 ? 40 + dt * 20 : 60 + 25 * C(dt * 1.3);
    ov.rect(cx, cy, 12, 12, { texture: G.cursor });
  }

  function drawCallBack(r, G, ov) {
    ov.rect(0, 0, FW, FH, { texture: G.callBack });
  }

  function drawCallFront(r, G, ov, st) {
    const bw = 172, bh = 40;
    ov.rect(FW / 2 - bw / 2, 217, bw, bh, { texture: G.callButtons });
    ov.rect(FW / 2 - 32, 252, 64, 14, { texture: G.timer(st.call.seconds) });
  }

  window.SiegaScreens = { WIN, CHAT, STATS, build, drawGame, drawCallBack, drawCallFront };
})();
