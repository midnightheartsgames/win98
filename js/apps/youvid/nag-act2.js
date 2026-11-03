(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, ease } = K;
  const A = window.NagArt;
  const Sh = window.NagShots;
  const { seg, L5, ramp, look, who, headOf, faceCam, layer, walkLegs, NF, SF, tags, CREDITS } = Sh;

  const CLASS_CAM = look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40);
  const ART_CAM = look([0.3, 1.35, 2.4], [-0.4, 1.2, -4], 46);

  function easyTag(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.02);
    const ink = '#3a7ac8';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 0, 78, 11);
    ctx.fillRect(0, 14, 112, 22);
    ctx.fillRect(0, 39, 86, 20);
    ctx.fillRect(2, 63, 128, 9);
    ctx.fillRect(2, 75, 128, 9);
    A.solid(ctx, 'オープニングテーマ', 43, 6, 8, ink, { font: A.JP, weight: 700 });
    A.solid(ctx, '『EASY LOVE』', 56, 26, 15, ink, { font: A.JP, weight: 900 });
    A.solid(ctx, '上坂すみれ', 43, 50, 15, ink, { font: A.JP, weight: 900 });
    ctx.fillRect(2, 87, 128, 9);
    ctx.fillRect(2, 99, 60, 9);
    [['作詞：上坂すみれ、森月キャス', 67], ['作曲：丸山真由子', 79], ['編曲：日比野裕史 × 渡辺徹', 91], ['(キングレコード)', 103]].forEach(([line, yy]) => {
      A.solid(ctx, line, 6, yy, 7, ink, { font: A.JP, weight: 700, align: 'left' });
    });
    ctx.restore();
  }

  function kimo(t, lt) {
    const shades = (lt > 0.4 && lt < 0.6) || (lt > 1.55 && lt < 1.75);
    const sen = who('senpai', { p: [-0.05, 0.97, 0], yaw: 0.1, nk: [0.06, 0.08, 0.04], lens: shades ? 'pink' : 'clear', face: lt > 1.0 ? SF.annoyed : SF.flat });
    const nag = who('nagatoro', { p: [0.52, 0.87, -0.15], yaw: -0.35, nk: [0.05, -0.2, -0.12], hL: [0.12, 0.44, 0.04], hR: [-0.12, 0.44, 0.04], eL: [0.8, 0.3, 0], eR: [-0.8, 0.3, 0], handL: 'open', handR: 'open', face: Object.assign({}, NF.laugh, { eyes: 'squeeze' }) });
    return {
      bg: '#04defb',
      layers: [
        layer({ camera: CLASS_CAM, set: 'classroom', env: 'room', lut: ramp('#04a8e0', '#30e8fc') }),
        layer({ camera: look([0.22, 1.32, 1.45], [0.22, 1.25, 0], 34), cast: [Object.assign(sen, { lut: L5('#3a2a6a', '#a090e0', '#c8b8f0', '#f0ecfa', '#faf7fb') }), Object.assign(nag, { lut: L5('#6a1040', '#f080b0', '#f8a8c8', '#fbd8e8', '#ffffff') })], rim: { color: '#ffffff', px: 4 }, ink: { color: '#3a2a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        const g = A.rng(41);
        for (let k = 0; k < 14; k++) {
          const x = 30 + g() * 580, y = 30 + g() * 300;
          const big = k % 3 === 0;
          A.sfx(ctx, 'キモ', x, y, big ? 34 : 18, big ? '#30e090' : '#ffffff', { vertical: g() > 0.5, outline: big ? '#ffffff' : null, outlineW: 4, seed: i.f + k });
        }
        if (lt > 0.95 && lt < 1.15) A.loops(ctx, 60, 60, 520, 260, { color: '#7a40d0', width: 3, seed: i.f, turns: 3, drift: 0.6 });
        easyTag(ctx, 40, 150);
      }
    };
  }

  function faceDoodle(t, lt) {
    const rise = ease(seg(lt, 0, 0.25));
    const nag = who('nagatoro', { yaw: 0.05, nk: [0.0, 0.08, 0.06], face: Object.assign({}, lt > 0.8 ? NF.sly : NF.happy, { whiskers: true }) });
    const cam = faceCam(nag, 0.66, { off: [0, lerp(0.32, -0.05, rise), 0], fov: 30 });
    return {
      bg: '#f485f5',
      layers: [
        layer({ camera: ART_CAM, set: 'artroom', env: 'room', lut: ramp('#d060d0', '#fcb8fc') }),
        layer({ camera: cam, cast: [nag], lut: L5('#0a2a6a', '#239aeb', '#60b8f0', '#d8f0fb', '#f8f5fb'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a2a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        if (lt > 0.6) A.star(ctx, 450, 80, 20, { color: '#ffffff', width: 3, seed: i.f });
        if (lt > 0.3) A.stroke(ctx, [[140, 60], [150, 120], [130, 170]], { color: '#40e060', width: 5, seed: i.f });
        easyTag(ctx, 40, 150);
      }
    };
  }

  function jumpUp(t, lt) {
    const k = ease(seg(lt, 0.05, 0.38));
    const nag = who('nagatoro', { p: [0, 0.87 + k * 1.4, 0], yaw: 0, hL: [0.3, 0.45, 0.05], hR: [-0.3, 0.45, 0.05], eL: [0.8, 0, 0], eR: [-0.8, 0, 0], handL: 'spread', handR: 'spread', fL: [0.1, -0.7, -0.15], fR: [-0.1, -0.75, 0.1], face: NF.laugh });
    return {
      bg: '#f485f5',
      layers: [
        layer({ camera: ART_CAM, set: 'artroom', env: 'room', lut: ramp('#d060d0', '#fcb8fc') }),
        layer({ camera: look([0, 1.15, 1.9], [0, 1.15, 0], 36), cast: [nag], lut: L5('#0a2a6a', '#239aeb', '#60b8f0', '#d8f0fb', '#f8f5fb'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a2a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        A.burst(ctx, 320, 240, 30, 230, 30, { color: '#40e060', width: 3, seed: i.f });
        const g = A.rng(i.f + 3);
        for (let q = 0; q < 18; q++) {
          const x = g() * 640, y = 60 + g() * 300;
          const c = ['#f8e040', '#40e8f0', '#ff5ac8'][q % 3];
          if (q % 2) A.heart(ctx, x, y, 8 + g() * 10, { color: c, width: 2.5, seed: q }); else A.star(ctx, x, y, 7 + g() * 6, { color: c, width: 2, seed: q });
        }
        easyTag(ctx, 40, 150);
      }
    };
  }

  function ringText(ctx, cx, cy, rx, ry, text, color, rot) {
    ctx.save();
    ctx.font = `900 16px ${A.HEAVY}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = [...text];
    chars.forEach((ch, k) => {
      const a = rot + (k / chars.length) * PI * 2;
      ctx.save();
      ctx.translate(cx + C(a) * rx, cy + S(a) * ry);
      ctx.rotate(a + PI / 2);
      ctx.scale(1, 0.7);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function kissBlow(t, lt) {
    const drop = seg(lt, 0.3, 0.52);
    const land = lt > 0.52 && lt < 0.72;
    const kiss = lt > 1.0;
    const out = seg(lt, 1.35, 1.6);
    const p = lt < 0.3 ? [0, 3.5, 0] : lt < 0.52 ? [0, lerp(3.2, 0.62, ease(drop)), 0] : land ? [0, lerp(0.62, 0.87, seg(lt, 0.52, 0.72)), 0] : [0, 0.87, 0];
    const camW = look([0, 1.25, 3.1], [0, 1.05, 0], 38);
    const camC = look([0.2, 1.22, 1.55], [0.15, 1.12, 0], 38);
    const kc = ease(seg(lt, 0.78, 1.05));
    const cam = { eye: V3.lerp(camW.eye, camC.eye, kc), at: V3.lerp(camW.at, camC.at, kc), fov: 38, up: [0, 1, 0] };
    const nag = who('nagatoro', {
      p, yaw: kiss ? -0.2 : 0, sp: land ? [0.3, 0, 0] : [0.02, 0.1, 0], nk: [0.02, kiss ? 0.12 : 0, kiss ? -0.1 : 0],
      hR: kiss ? V3.lerp([-0.03, 0.27, 0.17], [-0.12, 0.3, 0.38], out) : [-0.16, -0.25, 0.08], eR: [-0.6, -0.6, 0], handR: kiss ? (out > 0.3 ? 'open' : 'pinch') : 'relaxed',
      hL: kiss ? [0.12, -0.12, -0.02] : [0.16, -0.25, 0.08],
      fL: land ? [0.14, -0.55, 0.2] : [0.1, -0.84, 0.05], fR: land ? [-0.14, -0.55, 0.15] : [-0.1, -0.84, -0.02],
      face: kiss ? NF.kiss : lt > 0.8 ? NF.smug : NF.happy
    });
    return {
      bg: '#f485f4',
      layers: [
        layer({ camera: cam, set: 'artroom', env: 'room', props: [{ kind: 'pedestal', pos: [-0.95, 0, -0.5] }, { kind: 'bustCurl', pos: [-0.95, 1.0, -0.5], yaw: 0.5, scale: 1.4 }, { kind: 'pedestal', pos: [0.95, 0, -0.5] }, { kind: 'bustBeard', pos: [0.95, 1.0, -0.5], yaw: -0.5, scale: 1.4 }], lut: ramp('#c050c0', '#fcc0fc') }),
        layer({ camera: cam, cast: lt < 0.3 ? [] : [nag], lut: L5('#0a2a6a', '#2a7ae0', '#70b0f0', '#e0f0fb', '#f9f6fb'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#0a2a6a', px: 1 } })
      ],
      back: (ctx, i) => {
        if (lt > 0.1 && lt < 0.7) ringText(ctx, 320, 330, 210, 46, 'IJIRANAIDE NAGATORO SAN ', '#30e8d0', lt * 1.5);
      },
      front: (ctx, i) => {
        A.stroke(ctx, [[80, 120], [112, 116], [140, 122]], { color: '#f8f040', width: 4, seed: i.f });
        A.stroke(ctx, [[500, 124], [530, 118], [556, 126]], { color: '#f8f040', width: 4, seed: i.f + 1 });
        if (lt > 0.78 && lt < 1.0) {
          const g = A.rng(i.f);
          for (let q = 0; q < 16; q++) A.heart(ctx, g() * 640, g() * 360, 8 + g() * 10, { color: ['#ff5ac8', '#f8e040', '#40e8f0'][q % 3], width: 2.5, seed: q });
        }
        if (kiss) {
          A.hand(ctx, 'CHU', 420, 110, 36, '#ff3aa0', { seed: 7, rot: -0.2, k: seg(lt, 1.0, 1.3) });
          if (out > 0.2) {
            A.heart(ctx, 130, 140, 54, { fill: '#ff5ac8', dots: '#ffb0e0', seed: 2 });
            A.heart(ctx, 520, 230, 46, { fill: '#ff5ac8', dots: '#ffb0e0', seed: 3 });
            A.heart(ctx, 470, 90, 10, { fill: '#ff3a8a', seed: 4 });
          }
        }
        easyTag(ctx, 40, 150);
      }
    };
  }

  function senpaiDoki(t, lt) {
    const sen = who('senpai', { yaw: 0.35, nk: [0.12, 0.25, 0.1], face: SF.shock });
    return {
      bg: '#f629e4',
      layers: [layer({ camera: faceCam(sen, 0.44, { off: [0.02, -0.05, 0], yaw: 0.3, fov: 32 }), cast: [sen], lut: L5('#2a1a6a', '#8a6af0', '#3fc8f7', '#a0f4fb', '#e8fcff'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#2a1a6a', px: 1 } })],
      back: (ctx, i) => {
        for (let k = 0; k < 6; k++) A.zigzag(ctx, 0, 30 + k * 60, 640, 50 + k * 60, 14, 22, { color: k % 2 ? '#30e8f8' : '#4040e0', width: 3, seed: i.f + k });
      },
      front: (ctx, i) => {
        A.stroke(ctx, [[250, 140], [320, 130], [330, 175], [255, 180], [250, 140]], { color: '#f8f040', width: 4, seed: i.f });
        A.stroke(ctx, [[360, 128], [430, 125], [432, 168], [362, 172], [360, 128]], { color: '#f8f040', width: 4, seed: i.f + 1 });
        A.sfx(ctx, 'ドキ', 90, 280, 50, '#f8f040', { outline: '#ff3aa0', outlineW: 5, seed: i.f });
        A.sfx(ctx, 'ドキ', 560, 120, 44, '#f8f040', { vertical: true, outline: '#ff3aa0', outlineW: 5, seed: i.f + 2 });
        tags(ctx, [[22, 250, 'チーフプロデューサー', CREDITS.chief]], '#d01040');
      }
    };
  }

  function friends(t, lt) {
    const b = S(lt * 12) * 0.03;
    const cast = [
      who('gamo', { p: [-0.36, 0.83, 0.05], yaw: 0.25, nk: [0.05 + b, 0.15, 0.08], face: Object.assign({}, NF.laugh, { eyes: 'open' }) }),
      who('yoshi', { p: [0.02, 0.89, -0.15], yaw: 0.05, nk: [0.02, -0.05, -0.1], hR: [-0.02, 0.21, 0.16], handR: 'fist', face: NF.sly }),
      who('sakura', { p: [0.38, 0.86, -0.25], yaw: -0.3, nk: [0.05, -0.15, -0.08], face: NF.soft })
    ];
    return {
      bg: '#05eacb',
      layers: [layer({ camera: look([0.02, 1.27, 0.98], [0.02, 1.24, 0], 36), cast, lut: L5('#6a0010', '#fa5669', '#fa8090', '#fbcad0', '#fbf3f6'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#6a0010', px: 1 } })],
      back: (ctx, i) => A.scrawl(ctx, 0, 0, 640, 360, { color: '#ffffff', width: 3, seed: i.f, n: 3, steps: 6 }),
      front: (ctx, i) => {
        [[150, 165], [205, 165], [325, 150], [378, 150], [500, 170], [545, 170]].forEach(([x, y], k) => {
          ctx.save();
          ctx.strokeStyle = '#f8f040';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x + S(i.f + k) * 2, y, 18, 0, PI * 2);
          ctx.stroke();
          ctx.restore();
        });
        A.hand(ctx, 'NIGHT', 470, 60, 60, '#b060f0', { seed: 3, ghost: 4, k: seg(lt, 0.05, 0.6) });
        tags(ctx, [[22, 250, 'チーフプロデューサー', CREDITS.chief]], '#d01040');
      }
    };
  }

  function redSmirk(t, lt) {
    const nag = who('nagatoro', { yaw: -0.1, nk: [0.05, -0.05, 0.04], face: Object.assign({}, lt > 0.3 ? NF.grin : NF.sly, { blush: 1 }) });
    return {
      bg: '#a00825',
      layers: [layer({ camera: faceCam(nag, lerp(0.34, 0.31, seg(lt, 0, 1.1)), { off: [0, -0.06, 0], yaw: -0.05, fov: 32 }), cast: [nag], lut: L5('#300010', '#730936', '#c02040', '#fb6e6f', '#ffd0d0') })],
      back: (ctx, i) => A.scrawl(ctx, 0, 0, 60, 360, { color: '#80f040', width: 5, seed: i.f, n: 2, steps: 6 }),
      front: (ctx, i) => {
        if (lt > 0.15) A.heart(ctx, 60, 200, 34, { fill: '#ff3aa0', dots: '#ff9ad0', seed: 1 });
        if (lt > 0.3) A.sfx(ctx, 'ニヤ', 100, 40, 40, '#f8f040', { outline: '#a00825', outlineW: 3, seed: i.f });
        if (lt > 0.45) A.sfx(ctx, 'ドキ', 580, 200, 52, '#ff3aa0', { vertical: true, outline: '#ffffff', outlineW: 4, seed: i.f + 1 });
        if (lt > 0.5) A.zigzag(ctx, 180, 40, 470, 30, 8, 14, { color: '#f8f040', width: 3, seed: i.f });
        tags(ctx, [[22, 250, 'チーフプロデューサー', CREDITS.chief]], '#d01040');
      }
    };
  }

  function eyeClose(t, lt) {
    const nag = who('nagatoro', { hiFace: true, nk: [0, 0, 0], face: { eyes: 'open', mouth: 'smile', brows: 'normal', gaze: [0.05, -0.05] } });
    const h = headOf(nag);
    const R = window.NagCast.DIMS.nagatoro.head;
    const eyeP = V3.add(h, window.NagCast.hp(R, 0.38, -0.2, 1));
    const lut = [[0, '#2a102a'], [0.035, '#2a102a'], [0.06, '#693f64'], [0.29, '#693f64'], [0.33, '#d0407a'], [0.48, '#e05090'], [0.52, '#e0b8ce'], [0.79, '#e8c8da'], [0.83, '#f9f3f7'], [1, '#ffffff']];
    const dz = lerp(0.105, 0.098, seg(lt, 0, 1.2));
    return {
      bg: '#e9ccdc',
      layers: [layer({ camera: look(V3.add(eyeP, [0.004, -0.004, dz]), V3.add(eyeP, [0, -0.002, 0]), 30), cast: [nag], lut })],
      front: (ctx, i) => {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#20204a';
        ctx.beginPath();
        ctx.ellipse(318, 210, 24, 30, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillRect(290, 236, 56, 40);
        ctx.strokeStyle = '#8090c0';
        ctx.lineWidth = 2;
        ctx.strokeRect(300, 204, 15, 9);
        ctx.strokeRect(321, 204, 15, 9);
        ctx.restore();
        if (lt > 0.5) {
          const k = seg(lt, 0.5, 1.0);
          A.stroke(ctx, [[320 - 140 * k, 150], [320 + 140 * k, 150]], { color: '#40e8f0', width: 2, seed: i.f });
          A.stroke(ctx, [[320, 150 - 90 * k], [320, 150 + 90 * k]], { color: '#40e8f0', width: 2, seed: i.f + 1 });
          A.sparkle(ctx, 320, 150, 10 + k * 8, { color: '#ffffff' });
        }
        A.stroke(ctx, [[400, 330], [430, 318], [450, 332], [480, 316], [500, 330]], { color: '#ffffff', width: 2, seed: i.f });
      }
    };
  }

  function petals(ctx, lt, n, seed) {
    const g = A.rng(seed || 61);
    for (let q = 0; q < n; q++) {
      const x0 = g() * 700 - 30, y0 = g() * 360, sp = 20 + g() * 40;
      const x = ((x0 + lt * sp) % 700) - 30, y = (y0 + S(lt * 2 + q) * 14 + lt * 10) % 370;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(lt * 2 + q);
      ctx.fillStyle = q % 3 ? 'rgba(220,120,240,0.85)' : 'rgba(255,200,250,0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5 + (q % 3), 3, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const GREY = L5('#0a1424', '#25364f', '#596275', '#848595', '#c8ccd8');

  function walkLight(t, lt) {
    const lg = walkLegs(lt * 0.8, 0.2, 0.06);
    const sway = S(lt * 2) * 0.1;
    const nag = who('nagatoro', { p: [lerp(-0.45, 0.0, lt / 2.34), 0.86 + lg.bob, lerp(0, -0.7, lt / 2.34)], yaw: PI - 0.45, fL: lg.fL, fR: lg.fR, nk: [0, sway * 0.3, 0], hL: [0.18, -0.3, 0.02 + sway * 0.2], hR: [-0.18, -0.3, 0.02 - sway * 0.2], face: NF.calm });
    return {
      bg: '#10213a',
      layers: [layer({ camera: look([-0.75, 1.0, 1.95], [0.15, 0.82, -0.3], 34), cast: [nag], env: 'side', lut: GREY })],
      back: (ctx) => {
        const k = seg(lt, 0, 2.3);
        const g = ctx.createRadialGradient(620, 150, 10, 620, 150, 260 + k * 160);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(230,236,250,0.8)');
        g.addColorStop(1, 'rgba(120,130,160,0)');
        ctx.fillStyle = '#16243c';
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 640, 360);
      },
      front: (ctx, i) => {
        petals(ctx, lt, 26, 61);
        tags(ctx, [[505, 110, 'プロデューサー', CREDITS.prod]], '#d020a0');
      },
      post: lt > 2.2 ? { fill: ['#ffffff', seg(lt, 2.2, 2.34)] } : null
    };
  }

  function eyesOpen(t, lt) {
    const st = lt < 0.3 ? 'calm' : lt < 0.5 ? 'half' : 'glow';
    const nag = who('nagatoro', { yaw: 0, nk: [0.04, 0, 0], face: { eyes: st, mouth: 'flat', brows: 'normal', noBrows: false } });
    const lut = [[0, '#000308'], [0.035, '#000308'], [0.06, '#0c1220'], [0.29, '#121a2a'], [0.33, '#5a6478'], [0.48, '#6a7488'], [0.52, '#9aa2b2'], [0.8, '#bcc2ce'], [0.84, '#3a9af0'], [0.93, '#70c8ff'], [0.96, '#f8fbff'], [1, '#ffffff']];
    return {
      bg: '#000109',
      layers: [layer({ camera: faceCam(nag, 0.4, { off: [0, -0.03, 0], fov: 30 }), cast: [nag], env: 'side', lut })],
      front: (ctx, i) => {
        const g = ctx.createRadialGradient(470, 190, 4, 470, 190, 220);
        const a = lt < 0.3 ? 1 : lt < 0.7 ? 0.85 : 0.65;
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.4, `rgba(240,244,255,${a * 0.6})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 640, 360);
        petals(ctx, lt, 6, 71);
      },
      post: lt > 1.4 ? { fill: ['#ffffff', seg(lt, 1.4, 1.57)] } : null
    };
  }

  function pastel(t, lt) {
    const nag = who('nagatoro', { yaw: 0.15, nk: [0.06, 0.1, -0.05], glasses: true, face: Object.assign({}, NF.soft, { mouth: 'flat' }) });
    const fade = lt < 0.35 ? 1 - seg(lt, 0, 0.35) * 0.75 : lt > 1.0 ? 0.25 + seg(lt, 1.0, 1.4) * 0.75 : 0.25;
    return {
      bg: '#e4f3fc',
      layers: [layer({ camera: faceCam(nag, 0.85, { off: [0.04, -0.12, 0], yaw: 0.1, fov: 32 }), cast: [nag], lut: L5('#7aa0d0', '#5ab5ea', '#9ccdf0', '#cce5fa', '#f9fafc') })],
      back: (ctx) => {
        [[120, 80, '#f8d8f0'], [520, 90, '#fff2c8'], [300, 300, '#d8f0ff'], [560, 300, '#f0d8f8']].forEach(([x, y, c]) => {
          const g = ctx.createRadialGradient(x, y, 10, x, y, 180);
          g.addColorStop(0, c);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 640, 360);
        });
      },
      post: { fill: ['#ffffff', fade] }
    };
  }

  function dance(t, lt) {
    const sw = S(lt * 14);
    const nag = who('nagatoro', { p: [-0.5, 0.87, 0], yaw: 0.35, sp: [0.05, 0.3 * sw, 0.15], nk: [0.05, 0.2, 0.2 * sw], hL: [0.45, 0.3, 0.2], hR: [0.1, 0.2, 0.42], eL: [0.6, -0.4, 0], eR: [-0.3, -0.6, 0.2], handL: 'open', handR: 'open', fL: [0.2, -0.78, 0.15], fR: [-0.05, -0.84, -0.05], face: Object.assign({}, NF.laugh, { eyes: 'squeeze' }) });
    const sen = who('senpai', { p: [0.62, 0.97, 1.35], yaw: PI + 0.7, face: SF.flat });
    const lut = L5('#3a3000', '#7a6a10', '#c8b800', '#eadd03', '#fffbe0');
    return {
      bg: '#0043fc',
      layers: [
        layer({ camera: look([-0.3, 1.0, 2.4], [-0.32, 0.92, 0], 34), cast: [nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#3a3000', px: 1 } }),
        layer({ camera: look([-0.3, 1.0, 2.4], [-0.32, 0.92, 0], 34), cast: [sen], lut, rim: { color: '#ffffff', px: 4 } })
      ],
      front: (ctx, i) => {
        A.hand(ctx, '草', 70, 210, 30, '#ffffff', { seed: 1, font: A.JP });
        A.hand(ctx, '草', 300, 300, 26, '#ffffff', { seed: 2, font: A.JP });
        [[60, 300], [110, 320], [230, 250], [290, 330], [140, 270]].forEach(([x, y], k) => A.hand(ctx, 'w', x, y, 26 + (k % 2) * 8, '#f8f060', { seed: i.f + k }));
        A.wave(ctx, 150, 90, 260, 70, 6, 3, { color: '#ffffff', width: 2.5, seed: i.f });
        A.stroke(ctx, [[130, 140], [125, 170]], { color: '#ffffff', width: 2.5, seed: i.f });
        tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0');
      }
    };
  }

  function bigType(text1, text2, bg, slide) {
    return (t, lt) => ({
      bg,
      front: (ctx, i) => {
        const dx = -slide * lt * 60;
        A.solid(ctx, text1, 255 + dx, 92, 232, '#ffffff', {});
        A.solid(ctx, text2, 250 + dx, 285, 232, '#ffffff', {});
        tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0');
      }
    });
  }

  function easyRows(t, lt) {
    return {
      bg: '#f9b0fd',
      front: (ctx, i) => {
        const off = (lt * 60) % 40;
        for (let r = -1; r < 10; r++) {
          const y = r * 40 - off + 20;
          const center = r === 4;
          A.solid(ctx, 'EASY LOVE', 240, y, 36, '#fcd8fe', center ? {} : { ghost: 1.5 });
        }
        A.solid(ctx, 'EASY LOVE', 240, 4 * 40 - off + 20, 36, '#ffffff', {});
        tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0');
      }
    };
  }

  function nightDate(t, lt) {
    return {
      bg: '#20e1cf',
      front: (ctx, i) => {
        for (let r = -2; r < 6; r++) A.solid(ctx, 'NIGHT DATE', 360 + r * 40, 200 + r * 70 - lt * 40, 70, '#5af8f0', { rot: -0.42, ghost: 2 });
        A.solid(ctx, 'NIGHT DATE', 360, 200 - lt * 40, 92, '#ffffff', { rot: -0.42 });
        tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0');
      }
    };
  }

  function yarashi(t, lt) {
    const nag = who('nagatoro', { p: [0.35, 0.87, -0.6], yaw: -0.2, nk: [0.05, -0.1, 0.1 + S(lt * 12) * 0.05], hL: [0.04, 0.12, 0.15], hR: [-0.04, 0.12, 0.15], eL: [0.6, -0.6, 0.1], eR: [-0.6, -0.6, 0.1], handL: 'fist', handR: 'fist', face: NF.laugh });
    const sen = who('senpai', { p: [-0.5, 0.97, 0.75], yaw: PI - 0.4, face: SF.flat });
    const lut = L5('#0a4a10', '#08ea53', '#60f080', '#c0f8c8', '#f4fbf5');
    return {
      bg: '#fb6301',
      layers: [layer({ camera: look([0.15, 1.2, 1.9], [0.2, 1.05, 0], 36), cast: [sen, nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#0a4a10', px: 1 } })],
      front: (ctx, i) => {
        A.hand(ctx, 'やらしー', 350, 60, 22, '#ffffff', { seed: 1, font: A.JP, rot: -0.1 });
        A.hand(ctx, 'キモー', 560, 120, 22, '#ffffff', { seed: 2, font: A.JP, rot: 0.3 });
        A.hand(ctx, 'くさー', 520, 220, 20, '#ffffff', { seed: 3, font: A.JP, rot: 0.6 });
        A.hand(ctx, 'キモー', 300, 250, 18, '#ffffff', { seed: 4, font: A.JP, rot: -0.4 });
        A.catFace(ctx, 585, 285, 22, '#ffffff', i.f);
        tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0');
      }
    };
  }

  function annoyed(t, lt) {
    const sen = who('senpai', { nk: [0.03, S(lt * 9) * 0.12, 0], face: SF.annoyed });
    return {
      bg: '#fcdd01',
      layers: [layer({ camera: faceCam(sen, 0.46, { off: [0, -0.05, 0], fov: 32 }), cast: [sen], lut: L5('#0a2a6a', '#2174e9', '#6aa0f0', '#c7e5f9', '#f8f9fb'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a2a6a', px: 1 } })],
      back: (ctx, i) => A.scrawl(ctx, 60, 0, 520, 80, { color: '#ffffff', width: 3, seed: i.f, n: 2, steps: 6 }),
      front: (ctx) => tags(ctx, [[14, 14, '原作協力', CREDITS.coop]], '#1a40d0')
    };
  }

  function devilGrin(t, lt) {
    const nag = who('nagatoro', { yaw: -0.5, nk: [0.1, -0.2, 0.12], face: Object.assign({}, lt > 0.45 ? NF.grin : NF.sly, { eyes: 'smug', brows: 'devil' }) });
    return {
      bg: '#01f3fc',
      layers: [layer({ camera: faceCam(nag, 0.36, { off: [0.05, -0.04, 0], yaw: -0.35, fov: 32 }), cast: [nag], lut: L5('#4a0030', '#b21475', '#d02a9a', '#fa2cc6', '#fbe5f7') })],
      front: (ctx, i) => {
        A.devilHeart(ctx, 545, 130, 30, '#b21475', 5 + (i.f % 3));
        A.zigzag(ctx, 470, 10, 520, 120, 10, 6, { color: '#b21475', width: 3, seed: i.f });
        A.zigzag(ctx, 590, 230, 620, 340, 8, 6, { color: '#b21475', width: 3, seed: i.f + 1 });
        tags(ctx, [[140, 280, '制作統括', CREDITS.exec], [470, 255, 'アニメーションプロデューサー', CREDITS.anim]], '#b01070');
      }
    };
  }

  function reading(t, lt) {
    const push = lt > 0.25;
    const sen = who('senpai', { p: [0, 0.6, 0], yaw: 0.1, sp: [0.25, 0, 0], nk: [0.32, 0.05, 0], fL: [0.12, -0.5, 0.4], fR: [-0.12, -0.5, 0.4], kL: [0, 0.3, 1], kR: [0, 0.3, 1], hL: [0.06, -0.02, 0.32], hR: push ? [-0.05, 0.37, 0.15] : [-0.06, -0.02, 0.32], eL: [0.6, -0.6, -0.2], eR: [-0.6, -0.6, -0.2], handL: 'cup', handR: push ? 'point' : 'cup', face: { eyes: 'half', mouth: 'flat', gaze: [0, -0.8], blush: 0.6 } });
    sen.carry = [{ kind: 'cover', at: (m) => M4.chain(m.chest, M4.translate(0.0, -0.02, 0.34), M4.rotX(-1.0)), tex: { key: 'magCover', w: 384, h: 512, draw: magCover } }];
    return {
      bg: '#fcfa02',
      layers: [layer({ camera: look([0.12, 1.22, 1.0], [0.0, 1.02, 0], 36), cast: [sen], lut: L5('#0a2a2a', '#197083', '#2aae63', '#34c556', '#f5f8e8'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#0a2a2a', px: 1 } })],
      front: (ctx, i) => {
        [[80, 80], [520, 60], [580, 180], [70, 220], [560, 290]].forEach(([x, y], k) => A.sfx(ctx, 'ドキ', x, y, 30, '#2050c0', { outline: '#ffffff', outlineW: 4, seed: i.f + k, rot: (k - 2) * 0.15 }));
        if (lt > 0.65) for (let k = 0; k < 5; k++) A.stroke(ctx, [[450 + k * 20, 20], [440 + k * 22, 340]], { color: '#2050c0', width: 4, seed: i.f + k });
        tags(ctx, [[140, 280, '制作統括', CREDITS.exec], [470, 255, 'アニメーションプロデューサー', CREDITS.anim]], '#b01070');
      }
    };
  }

  function magCover(ctx, w, h) {
    ctx.fillStyle = '#36d0b4';
    ctx.fillRect(0, 0, w, h);
    A.magazine(ctx, w / 2, h / 2, w, h, { rot: 0 });
  }

  function magazineHold(t, lt) {
    const sh = S(lt * 30) * 0.004;
    const sen = who('senpai', { p: [0, 0.97, 0], hLw: [0.13, 1.18 + sh, 0.42], hRw: [-0.13, 1.18 - sh, 0.42], eL: [0.6, -0.6, 0], eR: [-0.6, -0.6, 0], handL: 'cup', handR: 'cup', wL: [0, -1.2, 0], wR: [0, -1.2, 0], hide: { head: true, hairBack: true, torso: true, pelvis: true, legs: true, upper: true }, face: SF.flat });
    return {
      bg: '#d02be0',
      layers: [
        layer({ camera: look([0.02, 1.2, 0.95], [0, 1.2, 0.42], 38, -0.05), props: [{ kind: 'cover', pos: [0, 1.2 + sh, 0.43], yaw: 0, roll: -0.05, scale: 1.0, tex: { key: 'magCover', w: 384, h: 512, draw: magCover } }] }),
        layer({ camera: look([0.02, 1.2, 0.95], [0, 1.2, 0.42], 38, -0.05), cast: [sen], lut: L5('#3a1060', '#7a40c0', '#a070e0', '#c899f5', '#f0e0ff') })
      ]
    };
  }

  function dreamy(t, lt) {
    const startle = lt > 0.95 && lt < 1.72;
    const k = seg(lt, 0.95, 1.1);
    const sen = who('senpai', {
      yaw: 0.25, sp: [startle ? -0.12 : 0.05, 0, 0], nk: [startle ? -0.1 : 0.1, startle ? 0.3 : 0.15, startle ? 0 : 0.12],
      hL: startle ? [0.35, 0.35, 0.2] : [0.08, 0.0, 0.25], hR: startle ? [-0.35, 0.35, 0.2] : [-0.08, 0.0, 0.25], eL: [0.6, -0.5, 0], eR: [-0.6, -0.5, 0],
      handL: startle ? 'spread' : 'cup', handR: startle ? 'spread' : 'cup',
      face: startle ? SF.shock : SF.dreamy
    });
    if (!startle) sen.carry = [{ kind: 'cover', at: (m) => M4.chain(m.chest, M4.translate(0, 0.0, 0.27), M4.rotX(-1.2)), tex: { key: 'magCover', w: 384, h: 512, draw: magCover } }];
    const props = [{ kind: 'door', pos: [0.75, 0, -0.5], yaw: -0.25 }];
    if (startle) props.push({ kind: 'cover', pos: [-0.3 + k * 0.1, 1.55 + k * 0.25, 0.1], yaw: 0.4, roll: 1.2 * k, tex: { key: 'magCover', w: 384, h: 512, draw: magCover } });
    return {
      bg: '#13fcd6',
      layers: [layer({ camera: look([0.15, 1.38, 1.15], [0.18, 1.32, 0], 36), cast: [sen], props, lut: L5('#4a0040', '#f50abb', '#f070d0', '#f8e4f4', '#f8f6fa'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#4a0040', px: 1 } })],
      back: (ctx, i) => {
        A.wave(ctx, 0, 60, 640, 90, 16, 3, { color: '#c050d0', width: 2.5, seed: 1, phase: lt * 3 });
        A.wave(ctx, 0, 290, 640, 260, 16, 3, { color: '#c050d0', width: 2.5, seed: 2, phase: -lt * 3 });
        const g = A.rng(5);
        for (let q = 0; q < 20; q++) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(g() * 640, (g() * 360 - lt * 30 * (1 + g())) % 380, 3 + g() * 4, 0, PI * 2);
          ctx.stroke();
        }
      },
      front: (ctx) => tags(ctx, [[300, 300, 'アニメーション制作', CREDITS.studio]], '#b01070')
    };
  }

  function turnBack(t, lt) {
    const turn = ease(seg(lt, 0.1, 0.5));
    const sh = S(lt * 60) * 0.01;
    const sen = who('senpai', { yaw: PI - 0.3, nk: [0.0, lerp(0.0, -1.1, turn) + sh, sh], face: Object.assign({}, SF.shock, { gaze: [-0.9, 0] }) });
    return {
      bg: '#fcd212',
      layers: [layer({ camera: look([0.32, 1.5, -0.38], [0.0, 1.47, 0.04], 36), cast: [sen], lut: L5('#0a3a6a', '#0ad4fb', '#38acf6', '#d8f4fc', '#f7f9fa'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#f020a0', px: 1.5 }, wob: 0.8 })],
      front: (ctx, i) => {
        A.sfx(ctx, 'ゾク', 520, 60, 40, '#20c8f0', { ghost: 3, seed: i.f, rot: 0.2 });
        A.sfx(ctx, 'ガク', 470, 180, 38, '#20c8f0', { ghost: 3, seed: i.f + 1, rot: -0.2 });
        A.sfx(ctx, 'ブル', 580, 260, 36, '#20c8f0', { ghost: 3, seed: i.f + 2, rot: 0.1 });
        A.sfx(ctx, 'ガク', 60, 280, 34, '#20c8f0', { ghost: 3, seed: i.f + 3, rot: 0.3 });
        A.zigzag(ctx, 20, 20, 30, 340, 6, 18, { color: '#f020a0', width: 2, seed: i.f });
      }
    };
  }

  function doorEye(t, lt) {
    const nag = who('nagatoro', { p: [0.0, 0.87, -0.35], yaw: 0, nk: [0.05, 0, 0], face: { eyes: 'creep', mouth: 'flat', brows: 'devil', shade: true } });
    const h = headOf(nag);
    const lut = [[0, '#0a0030'], [0.035, '#0a0030'], [0.06, '#13004f'], [0.29, '#1d005a'], [0.33, '#24006c'], [0.48, '#2a0078'], [0.52, '#3a0098'], [0.79, '#4500ad'], [0.82, '#e01020'], [0.9, '#e01020'], [0.93, '#b8e9e9'], [1, '#b8e9e9']];
    return {
      bg: '#1d005a',
      layers: [layer({ camera: look(V3.add(h, [0.04, -0.02, 0.5]), V3.add(h, [0.04, -0.03, 0]), 32), cast: [nag], props: [{ kind: 'door', pos: [0.0, 0.0, -0.2], yaw: 0 }], env: 'dark', lut })],
      back: (ctx) => {
        ctx.fillStyle = '#d000b0';
        ctx.fillRect(560, 0, 80, 360);
      },
      front: (ctx, i) => {
        for (let k = 0; k < 9; k++) A.stroke(ctx, [[150 + k * 30, 0], [148 + k * 31, 120 + (k % 3) * 20]], { color: '#4a1a8a', width: 2, seed: k });
        A.sfx(ctx, 'ゴゴゴゴ', 320, 300, 56, '#e01020', { seed: i.f, spacing: 1.3 });
      }
    };
  }

  function terror(t, lt) {
    const sh = S(lt * 70) * 0.012;
    const sen = who('senpai', { yaw: 0.45, nk: [0.1, 0.3 + sh, -0.15], face: SF.terror });
    return {
      bg: '#c20200',
      layers: [layer({ camera: faceCam(sen, 0.44, { off: [0.04, -0.05, 0], yaw: 0.4, fov: 32, roll: 0.12 }), cast: [sen], lut: L5('#000a4a', '#061289', '#052cdf', '#d8e0f8', '#ffffff') })],
      front: (ctx, i) => {
        A.solid(ctx, '!', 70, 250, 120, '#f8e020', { rot: -0.3, outline: '#20a040', outlineW: 4 });
        A.solid(ctx, '?', 570, 90, 110, '#f8e020', { rot: 0.3, outline: '#20a040', outlineW: 4 });
        A.burst(ctx, 330, 180, 160, 400, 24, { color: '#ff6040', width: 2, seed: i.f });
      }
    };
  }

  function devilGreen(t, lt) {
    const nag = who('nagatoro', { yaw: -0.35, nk: [0.12, -0.15, 0.1], face: Object.assign({}, NF.devil, { mouth: 'smirk', shade: false }) });
    return {
      bg: '#8c00c8',
      layers: [layer({ camera: faceCam(nag, 0.46, { off: [0.04, -0.07, 0], yaw: -0.25, fov: 32 }), cast: [nag], lut: L5('#0a3a0a', '#22ae20', '#3a8a3a', '#83f981', '#e0ffe0') })],
      front: (ctx, i) => {
        A.wing(ctx, 150, 120, 80, true, '#f060c0', 3 + (i.f % 2));
        A.wing(ctx, 470, 150, 70, false, '#f060c0', 5 + (i.f % 2));
        A.stroke(ctx, [[540, 300], [560, 260], [540, 220], [570, 190]], { color: '#f060c0', width: 3, seed: i.f });
      }
    };
  }

  function tackle(t, lt) {
    const fl = S(lt * 18);
    const sen = who('senpai', { p: [0.1, 0.9, 0], yaw: 0.2, up: [0.45, 0.89, 0], sp: [-0.2, 0, 0.1], nk: [-0.2, 0.2, 0.2], hL: [0.45, 0.4 + fl * 0.1, 0.1], hR: [-0.4, 0.45 - fl * 0.1, 0.15], eL: [0.6, -0.4, 0], eR: [-0.6, -0.4, 0], handL: 'spread', handR: 'spread', fL: [0.2, -0.8, 0.25], fR: [-0.1, -0.84, -0.1], face: SF.shutYell });
    const nag = who('nagatoro', { p: [-0.2, 0.75, 0.15], yaw: 0.9, up: [0.35, 0.9, 0.2], sp: [0.3, 0, 0], nk: [-0.2, 0.3, 0.2], hLw: [0.22, 1.0, 0.1], hRw: [0.1, 1.05, -0.15], handL: 'relaxed', handR: 'relaxed', fL: [0.1, -0.7, -0.3], fR: [-0.12, -0.6, -0.4], face: NF.laugh });
    const props = [];
    const g = A.rng(9);
    for (let q = 0; q < 5; q++) props.push({ kind: 'paper', pos: [-1 + g() * 2, 0.6 + g() * 1.4 + lt * 0.2, -0.6 + g() * 0.5], yaw: g() * 3, roll: g() * 3 + lt * 2, pitch: g() });
    return {
      bg: '#05cdf9',
      layers: [layer({ camera: look([0.15, 1.15, 1.7], [0.0, 1.05, 0], 38, -0.32), cast: [Object.assign(sen, { lut: L5('#4a0a4a', '#af1baa', '#d070d0', '#f9e2f8', '#ffffff') }), Object.assign(nag, { lut: L5('#6a1040', '#c02a90', '#f070c0', '#f898ea', '#fde8fa') })], props, rim: { color: '#ffffff', px: 3 }, ink: { color: '#4a0a4a', px: 1 } })],
      back: (ctx, i) => {
        const gg = A.rng(17);
        for (let q = 0; q < 12; q++) A.hand(ctx, ['イジらないで', 'ながとろ', 'センパイ', 'キモ'][q % 4], gg() * 640, gg() * 360, 12 + gg() * 8, '#0890b8', { seed: q, font: A.JP, rot: gg() - 0.5 });
      },
      front: (ctx, i) => {
        A.heart(ctx, 90, 70, 10, { color: '#ffffff', width: 2, seed: i.f });
        A.heart(ctx, 560, 300, 12, { color: '#ffffff', width: 2, seed: i.f + 1 });
      }
    };
  }

  function marker(ctx, text, x, y, size, fill, opt) {
    const o = opt || {};
    A.solid(ctx, text, x + size * 0.06, y + size * 0.08, size, o.shadow || '#1a1a2a', { font: A.JP, weight: 900, skew: -0.15, rot: o.rot });
    A.solid(ctx, text, x, y, size, fill, { font: A.JP, weight: 900, skew: -0.15, rot: o.rot, outline: o.edge || '#1a1a2a', outlineW: size * 0.08 });
    A.solid(ctx, text, x, y, size, fill, { font: A.JP, weight: 900, skew: -0.15, rot: o.rot });
    ctx.save();
    ctx.globalAlpha = 0.6;
    A.hatch(ctx, x - size * 1.6, y - size * 0.45, size * 3.2, size * 0.35, { color: o.hi || '#ffffff', gap: 6, width: 2, angle: 1.1 });
    ctx.restore();
  }

  function sprinkle(ctx, chars, color, seed) {
    const g = A.rng(seed);
    for (let q = 0; q < 22; q++) A.solid(ctx, chars[q % chars.length], g() * 640, g() * 360, 14 + g() * 18, color, { font: A.JP, weight: 900, rot: g() * 2 - 1 });
  }

  function kanaCard(text, bg, fill, sprinkleCol, opts) {
    return (t, lt) => ({
      bg,
      front: (ctx, i) => {
        sprinkle(ctx, 'イジらないで長瀞さん', sprinkleCol, 7 + (i.f % 2));
        const o = opts || {};
        const sc = 1 + (1 - seg(lt, 0, 0.12)) * 0.25;
        marker(ctx, text, 320 + (o.dx || 0), 185, (o.size || 150) * sc, fill, { edge: o.edge, hi: o.hi, rot: o.rot || -0.04 });
        if (o.ruby) o.ruby.forEach(([s, x, y]) => A.solid(ctx, s, x, y, 26, fill, { font: A.JP, weight: 900, outline: '#1a1a2a', outlineW: 3 }));
      }
    });
  }

  function logoShot(t, lt) {
    const k = seg(lt, 0, 0.4);
    return {
      bg: '#00f7fd',
      front: (ctx, i) => {
        if (k < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          sprinkle(ctx, 'イジらないで長瀞さん', '#40c8f0', 11);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = ease(k);
        ctx.translate(320, 180);
        const s = lerp(1.15, 1, ease(k));
        ctx.scale(s, s);
        ctx.translate(-320, -180);
        A.logo(ctx, 640, 360, {});
        ctx.restore();
      }
    };
  }

  function headPat(t, lt) {
    const wave = lt > 0.55;
    const rub = S(lt * 22) * 0.04;
    const sen = who('senpai', { p: [-0.12, 0.97, 0], yaw: 0.3, sp: [0.12, 0, 0.1], nk: [0.2, 0.25, 0.2], hL: wave ? [0.12, 0.42, 0.06] : [0.15, -0.3, 0.05], hR: wave ? [-0.12, 0.42, 0.06] : [-0.15, -0.3, 0.05], eL: [0.8, 0.2, 0], eR: [-0.8, 0.2, 0], handL: 'open', handR: 'open', face: SF.shutYell });
    const sh = headOf(sen);
    const nag = who('nagatoro', { p: [0.3, 0.87, -0.15], yaw: -0.5, nk: [0.05, -0.15, -0.1], hLw: wave ? [0.45, 1.85, 0.0] : [sh[0] + rub, sh[1] + 0.12, sh[2] - 0.02], eL: [0.5, 0.2, 0.3], handL: 'open', hR: [-0.12, -0.1, 0.1], face: NF.happy });
    const lut = L5('#6a0050', '#e807c9', '#f060d0', '#fae7f8', '#ffffff');
    return {
      bg: '#04f3c4',
      layers: [layer({ camera: look([0.1, 1.42, 1.0], [0.08, 1.38, 0], 36), cast: [sen, nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#6a0050', px: 1 } })],
      front: (ctx, i) => {
        if (!wave) A.loops(ctx, 240, 20, 120, 110, { color: '#f8e040', width: 3, seed: i.f, turns: 3 });
        A.hand(ctx, 'Baka', 110, 260, 46, '#f8e868', { seed: 1, ghost: 4, rot: -0.1 });
        A.hand(ctx, 'Baka', 500, 300, 40, '#f8e868', { seed: 2, ghost: 4, rot: 0.2 });
        if (wave) {
          [[80, 60], [560, 50], [600, 160]].forEach(([x, y], k) => A.loops(ctx, x - 20, y - 15, 40, 30, { color: '#f8e040', width: 2, seed: k + i.f, turns: 2 }));
          A.sparkle(ctx, 500, 120, 9, { color: '#f8e040' });
        }
        tags(ctx, [[250, 270, '監督', CREDITS.director]], '#a010a0');
      }
    };
  }

  function poke(t, lt) {
    const tap = Math.abs(S(lt * 18));
    const sen = who('senpai', { p: [0.3, 0.97, 0], yaw: -0.35, nk: [0.05, -0.1, -0.1], face: Object.assign({}, SF.squeeze, { mouth: 'grit' }) });
    const sh = headOf(sen);
    const nag = who('nagatoro', { p: [-0.45, 0.87, 0.15], yaw: 0.5, sp: [0.05, 0.2, 0], nk: [0.0, 0.15, 0.1], hRw: [sh[0] - 0.13 + tap * 0.02, sh[1] - 0.02, sh[2] + 0.1], eR: [-0.4, -0.6, 0.2], handR: 'point', hL: [0.12, -0.05, 0.12], face: NF.grinOpen });
    const lut = L5('#0a4a10', '#4cd112', '#80e050', '#e2fadd', '#f8fff4');
    return {
      bg: '#fc9902',
      layers: [layer({ camera: look([-0.05, 1.4, 1.1], [0.0, 1.33, 0], 36), cast: [sen, nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#0a4a10', px: 1 } })],
      front: (ctx, i) => {
        [[160, 120], [250, 60], [420, 90], [520, 160]].forEach(([x, y], k) => A.sfx(ctx, 'ペシ', x, y, 26, '#8a40e0', { seed: i.f + k, rot: (k - 1.5) * 0.3, ghost: 2.5 }));
        A.sparkle(ctx, 600, 250, 10, { color: '#ffffff' });
        tags(ctx, [[250, 270, '監督', CREDITS.director]], '#a010a0');
      }
    };
  }

  function heartbeat(t, lt) {
    const sen = who('senpai', { yaw: -0.4, nk: [0.06, -0.3, -0.06], face: Object.assign({}, SF.shy, { gaze: [0.8, 0.1] }) });
    return {
      bg: '#fd2d90',
      layers: [layer({ camera: faceCam(sen, 0.5, { off: [0.07, -0.06, 0], yaw: -0.25, fov: 32 }), cast: [sen], lut: L5('#1a2a6a', '#39a3e1', '#6862bb', '#c8eef4', '#e7f7f9'), rim: { color: '#ffffff', px: 3 } })],
      front: (ctx, i) => {
        if (lt > 0.12 && lt < 0.55) A.ecg(ctx, 20, 640, 190, 50, '#ffffff', 3);
        if (lt > 0.6) {
          A.confetti(ctx, 14, '#ff9ad0', i.f, [0, 0, 300, 360]);
          const g = A.rng(i.f);
          for (let q = 0; q < 8; q++) {
            ctx.strokeStyle = '#40d8e8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(380 + g() * 240, g() * 360, 4 + g() * 5, 0, PI * 2);
            ctx.stroke();
          }
        }
      }
    };
  }

  function heartsGrin(t, lt) {
    const nag = who('nagatoro', { yaw: -0.15, nk: [0.05, -0.1, 0.15], face: Object.assign({}, NF.grinOpen, { eyes: 'wide', mouth: lt > 0.2 ? 'laugh' : 'grin' }) });
    return {
      bg: '#06f322',
      layers: [layer({ camera: faceCam(nag, 0.42, { off: [0.02, -0.04, 0], yaw: -0.1, fov: 32 }), cast: [nag], lut: L5('#3a0a6a', '#943ade', '#c060f0', '#fa83fc', '#faf5fb') })],
      back: (ctx, i) => {
        for (let y = 0; y < 380; y += 26) for (let x = (y / 26) % 2 * 13; x < 660; x += 26) A.heart(ctx, x, y, 7, { color: '#d8f040', width: 1.5, seed: x + y });
      },
      front: (ctx, i) => {
        A.heart(ctx, 80, 160, 18, { color: '#ff70d0', width: 3, seed: i.f });
        A.heart(ctx, 590, 120, 14, { color: '#ff70d0', width: 3, seed: i.f + 1 });
        A.star(ctx, 60, 60, 12, { color: '#ffffff', seed: i.f });
      }
    };
  }

  function bigIjira(t, lt) {
    return {
      bg: '#33e7fd',
      front: (ctx) => {
        A.solid(ctx, 'IJIRA', 320, 70, 150, '#ffffff', { track: 8 });
        if (lt > 0.04) A.solid(ctx, 'NAIDE', 320 + (1 - seg(lt, 0.04, 0.1)) * 400, 260, 150, '#ffffff', { track: 8 });
      }
    };
  }

  function bigNaga(t, lt) {
    return {
      bg: '#07fd36',
      front: (ctx) => {
        const k = seg(lt, 0, 0.12);
        A.solid(ctx, 'NAGA', lerp(-200, 290, ease(k)), 80, 170, '#ffffff', { track: 6 });
        if (lt > 0.12) A.solid(ctx, 'TORO', lerp(700, 330, ease(seg(lt, 0.12, 0.2))), 270, 170, '#ffffff', { track: 6 });
      }
    };
  }

  function bigSan(t, lt) {
    return {
      bg: '#fc5e90',
      front: (ctx) => A.solid(ctx, 'SAN', 320, 180, 110, '#ffffff', { track: 14 })
    };
  }

  function finale(t, lt) {
    const sil = lt < 0.08;
    const sen = who('senpai', { p: [-0.28, 0.97, 0], yaw: 0.45, up: [-0.12, 1, 0], nk: [-0.02, 0.35, 0.05], hL: [0.17, -0.3, 0.02], hR: [-0.17, -0.3, 0.02], face: Object.assign({}, SF.shy, { gaze: [0.7, -0.2] }) });
    const nag = who('nagatoro', { p: [0.12, 0.89, 0.1], yaw: -0.75, sp: [0.12, -0.15, 0.08], nk: [0.08, 0.1, 0.12], hLw: [-0.17, 1.18, 0.18], eL: [0.5, -0.6, 0.2], handL: 'point', hR: [-0.12, -0.15, -0.05], face: NF.grin });
    const blue = [0.25, 0.65, 0.92, 1];
    const fade = seg(lt, 0.08, 0.3);
    return {
      bg: '#f9fbfa',
      layers: [layer({ camera: look([1.45, 1.05, 4.6], [1.45, 0.92, 0], 30), cast: [Object.assign(sen, sil ? { flat: blue } : {}), Object.assign(nag, sil ? { flat: blue } : {})] })],
      back: (ctx) => {
        [[120, 260, '#f8e080'], [90, 120, '#f8b0d8'], [470, 120, '#a8dcf8'], [560, 260, '#c8f0f8'], [300, 320, '#f8d0e0'], [250, 60, '#c0e8ff']].forEach(([x, y, c], k) => {
          const g = ctx.createRadialGradient(x, y, 6, x, y, 120 + k * 10);
          g.addColorStop(0, c);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = fade * 0.85;
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 640, 360);
        });
        ctx.globalAlpha = 1;
      },
      front: (ctx) => {
        A.solid(ctx, 'IJIRANAIDE, NAGATORO SAN', 420, 160, 17, '#3aa0e0', { font: '"Arial", sans-serif', weight: 900, track: 3 });
        if (lt > 0.16) {
          A.solid(ctx, '製作', 420, 225, 8, '#3a7ad8', { font: A.JP, weight: 700 });
          A.solid(ctx, '『イジらないで、長瀞さん』製作委員会', 420, 238, 10, '#3a7ad8', { font: A.JP, weight: 700 });
        }
      }
    };
  }

  window.NagAct2 = { kimo, faceDoodle, jumpUp, kissBlow, senpaiDoki, friends, redSmirk, eyeClose, walkLight, eyesOpen, pastel, dance, bigType, easyRows, nightDate, yarashi, annoyed, devilGrin, reading, magazineHold, dreamy, turnBack, doorEye, terror, devilGreen, tackle, kanaCard, logoShot, headPat, poke, heartbeat, heartsGrin, bigIjira, bigNaga, bigSan, finale };
})();
