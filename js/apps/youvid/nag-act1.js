(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, ease } = K;
  const A = window.NagArt;
  const Sh = window.NagShots;
  const { seg, keyed, L5, ramp, look, who, headOf, faceCam, layer, walkLegs, sitFloor, sitCross, NF, SF, tags, solidBg, CREDITS } = Sh;

  const PINK = L5('#5a0a6a', '#ae09c2', '#ea079d', '#fa9ed1', '#fbe5f4');

  function carryAt(side, off, rot) {
    return (m) => M4.chain(m['hand' + side], M4.translate(off[0], off[1], off[2]), rot || M4.ident());
  }

  function intro(t, lt) {
    const a = lt < 1.25;
    const nag = who('nagatoro', a
      ? Object.assign(sitFloor(), { sp: [0.55, 0, 0], nk: [-0.45, 0.15, 0.1], hLw: [0.07, 0.3, 0.38], hRw: [-0.07, 0.3, 0.38], handL: 'cup', handR: 'cup', face: NF.soft })
      : Object.assign(sitFloor(), { sp: [-0.05, 0.25, -0.15], nk: [0.12, -0.2, 0.25], hR: [-0.03, 0.24, 0.17], eR: [-0.5, -0.6, 0.1], handR: 'relaxed', hLw: [0.12, 0.44, 0.3], handL: 'relaxed', face: NF.laugh }));
    let cam;
    if (a) {
      const ang = lerp(0.9, -0.45, ease(lt / 1.25));
      const rad = lerp(1.1, 0.75, lt / 1.25);
      const c0 = [0, 0.5, 0.25];
      cam = look([c0[0] + S(ang) * rad, 0.62, c0[2] + C(ang) * rad], [0, 0.55, 0.2], 42, lerp(-0.55, 0.35, lt / 1.25));
    } else {
      const k = seg(lt, 1.25, 2.0);
      cam = faceCam(nag, lerp(0.95, 0.8, k), { off: [0.05, -0.12, 0], yaw: 0.25, pitch: 0.15, fov: 34, roll: -0.42 });
    }
    return {
      bg: '#02d2fd',
      layers: lt < 0.08 ? [] : [layer({ camera: cam, cast: [nag], lut: PINK, rim: { color: '#e6fbff', px: 3 }, ink: { color: '#8a10a0', px: 1 } })],
      front: (ctx, i) => {
        A.scrawl(ctx, 0, 0, 640, 360, { color: '#9cf2ff', width: 2.5, seed: i.f, n: 3, steps: 9 });
        A.scrawl(ctx, 40, 20, 560, 320, { color: '#ffffff', width: 3, seed: i.f + 50, n: 2, steps: 8 });
        if (lt > 1.3) {
          A.heart(ctx, 120, 230, 22, { fill: '#ff2aa0', seed: i.f });
          A.heart(ctx, 70, 120, 12, { color: '#ff2aa0', width: 2.5, seed: i.f + 3 });
          A.heart(ctx, 520, 90, 14, { color: '#ff70c0', width: 2.5, seed: i.f + 5 });
          A.heart(ctx, 460, 300, 10, { color: '#ffffff', width: 2, seed: i.f + 7 });
          if (lt > 1.6) A.stroke(ctx, [[150, 170], [190, 150], [215, 175], [245, 140]], { color: '#ff2aa0', width: 6, seed: i.f });
        } else if (lt > 0.08) {
          A.hatch(ctx, 360 + S(lt * 9) * 30, 60, 120, 90, { color: '#8af0e8', gap: 7, width: 2, angle: 0.7 });
          A.star(ctx, 120, 90, 22, { color: '#ffffff', seed: i.f });
        }
        ctx.save();
        ctx.translate(280, 140);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 0, 40, 16);
        ctx.fillRect(0, 20, 84, 34);
        ctx.fillRect(4, 58, 100, 11);
        ctx.fillRect(4, 72, 100, 11);
        A.solid(ctx, '原作', 34, 8, 10, '#2a6ae0', { font: A.JP });
        A.solid(ctx, 'ナナシ', 42, 37, 26, '#2a6ae0', { font: A.JP, weight: 900 });
        A.solid(ctx, '『イジらないで、長瀞さん』', 54, 64, 7, '#2a6ae0', { font: A.JP, weight: 700 });
        A.solid(ctx, '(講談社「マガジンポケット」連載)', 54, 77, 7, '#2a6ae0', { font: A.JP, weight: 700 });
        ctx.restore();
      }
    };
  }

  function ijiranaide(t, lt) {
    const yellow = lt < 0.2;
    return {
      bg: '#000000',
      front: (ctx, i) => {
        A.brush(ctx, 'IJIRANAIDE', 320, 186, 70, yellow ? '#e8d418' : '#c8108c', { seed: i.f, font: A.HAND, fw: 700, dry: 0.7, jitter: 4 });
        if (lt < 0.12) A.stroke(ctx, [[380, -10], [372, 120], [352, 260], [330, 380]], { color: '#e8d418', width: 22, amp: 4, seed: i.f });
      }
    };
  }

  function feet(t, lt) {
    const lg = walkLegs(lt * 1.25 + 0.15, 0.24, 0.1);
    const nag = who('nagatoro', { p: [0, 0.86 + lg.bob, 0], yaw: PI, fL: lg.fL, fR: lg.fR, face: NF.smile });
    const sen = who('senpai', { p: [0.05, 0.97, -5.6], yaw: 0, face: SF.flat, hR: [-0.18, -0.32, 0.04], hL: [0.18, -0.32, 0.04] });
    const lut = L5('#6a0880', '#ad05e0', '#e801ed', '#fba4f8', '#faf0fa');
    return {
      bg: '#fbea06',
      layers: [layer({ camera: look([0, 0.1, 0.8], [0, 0.22, -2.5], 52), cast: [nag, sen], lut, rim: { color: '#ffffff', px: 2 }, ink: { color: '#6a0880', px: 1 } })],
      back: (ctx, i) => {
        A.hatch(ctx, 0, 250, 640, 110, { color: '#fff8a0', gap: 14, width: 3, angle: 1.2 });
        A.scrawl(ctx, 230, 180, 180, 120, { color: '#ffffff', width: 3, seed: i.f, n: 2, steps: 10 });
      },
      front: (ctx, i) => {
        const on = Math.floor(lt * 6) % 2 === 0;
        if (on) A.hand(ctx, 'GO♡', 120, 110, 44, '#ffffff', { seed: i.f, outline: '#f080f0', outlineW: 3 });
        A.stroke(ctx, [[520, 120], [512, 160], [530, 150], [522, 200]], { color: '#30e0f0', width: 6, seed: i.f });
        A.stroke(ctx, [[548, 110], [540, 150], [558, 142], [550, 190]], { color: '#30e0f0', width: 6, seed: i.f + 1 });
        A.stroke(ctx, [[410, 270], [404, 300], [418, 296], [410, 330]], { color: '#30e0f0', width: 5, seed: i.f + 2 });
        A.stroke(ctx, [[430, 266], [424, 296], [438, 292], [430, 326]], { color: '#30e0f0', width: 5, seed: i.f + 3 });
        if (lt > 1.5) A.checker(ctx, 300, 140, 120, 90, 18, '#b8e060', 0.8);
      }
    };
  }

  function faceTurn(t, lt) {
    const turn = ease(seg(lt, 0.5, 0.62));
    const nag = who('nagatoro', { nk: [lerp(0.05, -0.05, turn), lerp(-0.75, 0.0, turn), lerp(-0.1, 0.06, turn)], face: turn > 0.5 ? NF.happy : { eyes: 'open', mouth: 'smile', gaze: [-0.8, 0], blush: 0.3 } });
    const lut = L5('#0a1a6a', '#3a50e8', '#20b8f0', '#41f2fc', '#e8ffff');
    return {
      bg: '#fc0203',
      layers: lt < 0.13 ? [] : [layer({ camera: faceCam(nag, lerp(0.34, 0.3, seg(lt, 0, 1)), { off: [0.03, -0.035, 0], yaw: 0.25, fov: 30 }), cast: [nag], lut, rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a1a6a', px: 1 } })],
      back: (ctx, i) => {
        if (lt < 0.13) { solidBg(ctx, '#2a40e0'); return; }
        A.scrawl(ctx, 470, 0, 170, 360, { color: '#ffffff', width: 4, seed: i.f, n: 3, steps: 8 });
      },
      front: (ctx, i) => {
        if (lt < 0.2) {
          const k = seg(lt, 0, 0.2);
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * PI * 2;
            const rr = 60 + k * 220;
            A.checker(ctx, 320 + C(ang) * rr - 20, 180 + S(ang) * rr * 0.6 - 20, 40, 40, 13, '#90e050', 0.9);
          }
        }
        if (turn > 0.5 && lt < 0.85) {
          A.burst(ctx, 120, 150, 10, 110, 22, { color: '#f8f020', width: 3, seed: i.f });
          A.star(ctx, 560, 80, 12, { color: '#f8f020', seed: i.f });
          A.star(ctx, 600, 200, 9, { color: '#f8f020', seed: i.f + 1 });
        }
      }
    };
  }

  function kanaIji(t, lt) {
    const col = lt > 0.18 && lt < 0.3 ? '#e8d000' : lt > 0.8 && lt < 0.93 ? '#e8ece0' : '#9fe501';
    return {
      bg: '#000000',
      front: (ctx, i) => {
        A.brush(ctx, 'イジ', 330, 180, 205, col, { seed: i.f, dry: 1.2, jitter: 5 });
        if (lt > 0.3 && lt < 0.45) {
          A.stroke(ctx, [[268, -20], [262, 380]], { color: '#9fe501', width: 16, amp: 6, seed: i.f });
          A.stroke(ctx, [[478, -20], [470, 380]], { color: '#9fe501', width: 12, amp: 6, seed: i.f + 1 });
        }
        if (lt > 0.55 && lt < 0.75) A.dots(ctx, 196, 210, 40, 30, 9, 3, '#e8e020');
        if (lt > 0.8 && lt < 0.95) A.scrawl(ctx, 160, 80, 360, 200, { color: '#7a9a30', width: 1.5, seed: i.f, n: 6, steps: 14 });
      }
    };
  }

  function glassesGrin(t, lt) {
    const off = lt > 0.3;
    const grin = lt > 0.42;
    const nag = who('nagatoro', {
      yaw: -0.25,
      nk: [grin ? 0.05 : -0.04, grin ? 0.28 : 0.18, grin ? -0.12 : 0.05],
      sp: [0.05, 0.1, 0],
      glasses: !off,
      hR: off ? keyed([[0.3, [-0.06, 0.26, 0.18]], [0.45, [-0.12, -0.02, 0.2]]], lt) : [-0.11, 0.3, 0.13],
      eR: [-0.6, -0.5, 0],
      handR: off ? 'relaxed' : 'pinch',
      face: grin ? NF.grin : off ? { eyes: 'calm', mouth: 'smile', brows: 'normal', blush: 0.6 } : { eyes: 'soft', mouth: 'smile', brows: 'normal', blush: 0.5 }
    });
    const lut = L5('#3a0870', '#b504fc', '#e050f0', '#faacfc', '#faf9fc');
    return {
      bg: '#d8fd02',
      layers: [layer({ camera: faceCam(nag, lerp(0.5, 0.44, seg(lt, 0, 1.1)), { off: [-0.04, -0.06, 0], yaw: -0.1, fov: 32 }), cast: [nag], lut, rim: { color: '#ffffff', px: 5 }, ink: { color: '#3a0870', px: 1 } })],
      back: (ctx, i) => {
        A.scrawl(ctx, 100, 0, 140, 360, { color: '#ffffff', width: 5, seed: i.f, n: 3, steps: 7 });
        if (lt > 0.12 && lt < 0.3) A.burst(ctx, 560, 60, 20, 200, 22, { color: '#ff7a3a', width: 2, seed: i.f });
        if (lt > 0.55 && lt < 0.75) A.burst(ctx, 110, 120, 10, 160, 26, { color: '#ff3a8a', width: 2, seed: i.f });
        if (lt > 0.6 && lt < 0.8) A.burst(ctx, 60, 90, 6, 90, 20, { color: '#30a0f0', width: 2, seed: i.f + 9 });
        if (lt > 0.8) A.star(ctx, 70, 110, 46, { fill: '#ff6a3a', rot: lt * 2, seed: i.f });
      },
      front: (ctx, i) => {
        if (lt > 0.42 && lt < 0.75) A.confetti(ctx, 10, '#30b0f0', i.f, [20, 20, 200, 320]);
      }
    };
  }

  function kanaRanaide(t, lt) {
    const green = lt > 0.55 && lt < 0.65;
    return {
      bg: '#000000',
      front: (ctx, i) => {
        if (lt < 0.16) {
          A.blobs(ctx, [[150, 140, 40], [260, 210, 30], [380, 120, 34], [500, 220, 44]], '#20b0e0', i.f);
          A.stroke(ctx, [[120, 100], [200, 260], [300, 120], [420, 300], [560, 100]], { color: '#20b0e0', width: 10, seed: i.f, amp: 8 });
          return;
        }
        A.brush(ctx, 'らないで、', 322, 190, 118, green ? '#40c040' : '#9e00cc', { seed: i.f, dry: 1.1, jitter: 4 });
        if (lt < 0.3) A.stroke(ctx, [[60, 300], [320, 190], [600, 60]], { color: '#a010d8', width: 26, amp: 6, seed: i.f });
      }
    };
  }

  function senpaiShock(t, lt) {
    const sh = S(lt * 40) * 0.008;
    const sen = who('senpai', { nk: [0.04, sh * 3, sh * 2], face: Object.assign({}, SF.shock, { mouth: 'wavy', eyes: 'wide' }) });
    const lut = L5('#0a4a10', '#10e924', '#60f070', '#d8f8d8', '#f6fbf5');
    return {
      bg: '#fcba03',
      layers: [layer({ camera: faceCam(sen, lerp(0.38, 0.34, seg(lt, 0, 1.2)), { off: [0, -0.04, 0], fov: 30 }), cast: [sen], lut, rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a4a10', px: 1 } })],
      back: (ctx, i) => {
        A.zigzag(ctx, 20, 40, 60, 320, 18, 9, { color: '#ff2aa0', width: 5, seed: i.f });
        A.zigzag(ctx, 600, 30, 570, 330, 16, 9, { color: '#ff2aa0', width: 5, seed: i.f + 1 });
      },
      front: (ctx, i) => {
        if (lt > 0.18) {
          A.heart(ctx, 95, 250, 46, { fill: '#ff3aa0', seed: i.f });
          A.hatch(ctx, 60, 215, 70, 70, { color: '#ffd0e8', gap: 8, width: 2, angle: 0.4 });
          A.heart(ctx, 545, 300, 26, { fill: '#ff3aa0', seed: i.f + 2 });
          A.stroke(ctx, [[60, 70], [80, 120], [52, 160]], { color: '#c040f0', width: 8, seed: i.f });
        }
        if (lt > 0.3) {
          A.sfx(ctx, 'ドキ', 560, 160, 58, '#ff3aa0', { vertical: true, outline: '#ffffff', seed: i.f });
          A.sfx(ctx, 'ドキ', 80, 170, 46, '#ff3aa0', { vertical: true, outline: '#ffffff', seed: i.f + 4 });
        }
        if (lt > 0.4) A.hand(ctx, 'Senpai', 330, 34, 46, '#f8f040', { seed: 3, k: seg(lt, 0.4, 0.85), outline: '#b8a000', outlineW: 2 });
      }
    };
  }

  function kanaNagatoro(t, lt) {
    const mag = lt > 0.92 && lt < 1.02;
    return {
      bg: '#000000',
      front: (ctx, i) => {
        A.brush(ctx, '長瀞さん', 320, 186, 116, mag ? '#c030b0' : '#05b0cc', { seed: i.f, dry: 1.1, jitter: 4 });
        if (lt < 0.14) A.stroke(ctx, [[200, -20], [185, 160], [175, 380]], { color: '#20c8e0', width: 40, amp: 8, seed: i.f });
      }
    };
  }

  function twoShot(t, lt) {
    const poke = lt > 0.2 && lt < 0.48;
    const pop = lt >= 0.55;
    const nag = who('nagatoro', {
      p: [-0.2, 0.87, 0.05], yaw: 0.55, sp: [0.08, 0.15, -0.1], nk: [0.05, -0.2, -0.15],
      hL: pop ? [0.22, 0.3, 0.32] : poke ? [0.2, 0.3, 0.36] : [0.12, 0.0, 0.14], eL: [0.6, -0.4, -0.2], handL: pop ? 'fist' : poke ? 'point' : 'relaxed',
      face: lt < 0.12 ? NF.smug : NF.grin
    });
    const sen = who('senpai', {
      p: [0.22, 0.97, -0.05], yaw: -0.25, nk: [0.0, lt > 0.3 ? -0.15 : 0.1, lt > 0.3 ? 0.08 : 0],
      lens: lt > 0.1 && lt < 0.2 ? 'pink' : 'clear',
      face: lt < 0.25 ? SF.annoyed : Object.assign({}, SF.yell, { eyes: lt > 0.5 ? 'squeeze' : 'wide' })
    });
    const carry = pop ? [{ kind: 'popsicle', at: carryAt('L', [0, -0.08, 0.02], M4.rotX(-1.2)) }] : [];
    nag.carry = carry;
    const h = headOf(sen), hn = headOf(nag);
    const mid = V3.lerp(h, hn, 0.5);
    return {
      bg: '#fc046c',
      layers: [layer({
        camera: look(V3.add(mid, [0.0, -0.05, 0.62]), V3.add(mid, [0, -0.07, 0]), 32),
        cast: [
          Object.assign(nag, { lut: L5('#10206a', '#2a50d0', '#4a80e0', '#68a1e9', '#e8f4ff') }),
          Object.assign(sen, { lut: L5('#0a4a5a', '#3ad8d0', '#8af0e8', '#d8fbf8', '#ffffff') })
        ],
        rim: { color: '#ffffff', px: 4 }, ink: { color: '#2a2a6a', px: 1 }
      })],
      back: (ctx, i) => {
        if (lt > 0.3) A.burst(ctx, 60, 200, 30, 260, 18, { color: '#f8e040', width: 2, seed: i.f });
        A.scrawl(ctx, 0, 0, 120, 360, { color: '#ff70b0', width: 3, seed: i.f, n: 2, steps: 6 });
      },
      front: (ctx, i) => {
        if (lt > 0.22 && lt < 0.4) A.burst(ctx, 420, 120, 6, 70, 18, { color: '#90f030', width: 4, seed: i.f });
        if (lt > 0.35) {
          A.stroke(ctx, [[520, 60], [560, 100]], { color: '#ff3a70', width: 5, seed: i.f });
          A.stroke(ctx, [[560, 60], [520, 100]], { color: '#ff3a70', width: 5, seed: i.f + 1 });
          A.sparkle(ctx, 470, 50, 12, { color: '#f8f040' });
        }
      }
    };
  }

  const RAINBOW = ['#30d040', '#2050e0', '#1828a8', '#8020d0', '#e0208a', '#e02020', '#f08020', '#d8e020', '#30d040', '#28d060'];

  function kanaTitle(t, lt) {
    const col = RAINBOW[Math.min(RAINBOW.length - 1, Math.floor(lt / 0.125))];
    return {
      bg: '#000000',
      front: (ctx, i) => {
        A.brush(ctx, 'イジらないで、\n長瀞さん', 320, 180, 76, col, { seed: i.f, lh: 1.2, dry: 1, jitter: 4 });
        if (lt < 0.12) A.stroke(ctx, [[520, -10], [508, 200], [512, 380]], { color: '#a8f020', width: 34, amp: 8, seed: i.f });
        if (lt > 0.68 && lt < 0.82) A.stroke(ctx, [[80, 300], [300, 260], [560, 120]], { color: '#e88020', width: 3, seed: i.f });
      }
    };
  }

  function fireworks(t, lt) {
    const tilt = seg(lt, 0, 0.13);
    const bob = S(lt * 14) * 0.02;
    const nag = who('nagatoro', { nk: [0.06 + bob, 0.12, 0.06], sp: [0, 0.05, bob * 0.5], hR: [-0.02, 0.1, 0.13], eR: [-0.5, -0.6, 0.1], handR: 'open', wR: [0, 0.6, 0], face: NF.happy, fL: [0.12, -0.84, 0.05], fR: [-0.1, -0.8, 0.15] });
    const lut = L5('#3a0a6a', '#b20fdf', '#e040d0', '#f988f2', '#f8e9fc');
    const camA = look([0.1, 0.25, 1.4], [0, 0.2, 0], 34);
    const camB = faceCam(nag, 1.0, { off: [0, -0.2, 0], fov: 34 });
    const cam = tilt < 1 ? { eye: V3.lerp(camA.eye, camB.eye, ease(tilt)), at: V3.lerp(camA.at, camB.at, ease(tilt)), fov: 34, up: [0, 1, 0] } : camB;
    return {
      bg: '#0295eb',
      layers: [layer({ camera: cam, cast: [nag], lut, rim: { color: '#ffffff', px: 6 }, ink: { color: '#3a0a6a', px: 1 }, wob: 0.6 })],
      back: (ctx, i) => {
        const beat = Math.floor(lt / 0.17) % 3;
        if (beat !== 1) A.burst(ctx, 510, 70, 8, 90, 26, { color: '#f040e0', width: 3, seed: i.f });
        if (beat !== 0) A.burst(ctx, 560, 230, 8, 70, 22, { color: '#30e0a0', width: 3, seed: i.f + 3 });
        if (beat === 2) A.burst(ctx, 90, 260, 8, 70, 20, { color: '#30e0a0', width: 3, seed: i.f + 5 });
        for (let k = 0; k < 8; k++) A.heart(ctx, 40 + ((k * 83 + i.f * 3) % 560), 30 + ((k * 57) % 300), 6, { fill: k % 2 ? '#30f0d0' : '#f060e0', seed: k });
      }
    };
  }

  function faceFront(t, lt) {
    const open = lt > 0.1;
    const nag = who('nagatoro', { nk: [0.0, 0.0, S(lt * 3) * 0.03], face: Object.assign({}, open ? NF.soft : NF.calm, { circles: lt > 0.16 && lt < 0.3, blush: lt > 0.56 ? 1 : 0.35 }) });
    const lut = L5('#1a2a8a', '#3b6cfb', '#7ab0fb', '#def6fd', '#ffffff');
    return {
      bg: '#fc01bc',
      layers: [layer({ camera: faceCam(nag, lerp(0.4, 0.45, seg(lt, 0, 0.87)), { off: [0, -0.035, 0], fov: 30 }), cast: [nag], lut, rim: { color: '#ffffff', px: 4 }, ink: { color: '#1a2a8a', px: 1 } })],
      back: (ctx, i) => {
        A.scrawl(ctx, 0, 0, 120, 360, { color: '#ffffff', width: 4, seed: i.f, n: 2, steps: 6 });
        A.scrawl(ctx, 520, 0, 120, 360, { color: '#ffffff', width: 4, seed: i.f + 9, n: 2, steps: 6 });
        [[40, 60], [600, 50], [580, 290], [30, 300], [70, 180], [610, 170]].forEach(([x, y], k) => A.star(ctx, x, y, 11, { color: '#f8c020', width: 3, seed: i.f + k, rot: k }));
        if (lt > 0.75) A.burst(ctx, 640, 200, 20, 140, 18, { color: '#f8d020', width: 3, seed: i.f });
      }
    };
  }

  function collagePose(lt) {
    if (lt < 0.97) return { p: [0.3, 0.87, -0.35], yaw: -0.25, sp: [0.05, -0.3, -0.2], nk: [0, -0.15, -0.25], hL: [0.05, 0.05, 0.25], hR: [-0.12, -0.05, 0.2], face: NF.smug };
    if (lt < 1.17) return { p: [0, 0.87, -0.3], yaw: 0, face: NF.laugh, hide: { body: true, head: true, hairBack: true } };
    if (lt < 2.17) return { p: [-0.42, 0.55, 0.2], yaw: 0.4, sp: [0.25, 0.2, 0.1], nk: [-0.3, 0.2, 0.1], fL: [0.15, -0.4, 0.3], fR: [-0.12, -0.42, 0.35], kL: [0.1, 0.6, 1], kR: [-0.1, 0.6, 1], hLw: [-0.1, 1.05, 0.15], hR: [-0.1, 0.1, 0.2], handL: 'relaxed', face: NF.grin };
    if (lt < 2.77) return { p: [0.38, 0.87, 0.0], yaw: -0.5, sp: [0.1, -0.2, 0.15], nk: [0.05, -0.2, 0.2], hR: [-0.02, 0.25, 0.17], handR: 'fist', hL: [0.15, 0.0, 0.2], face: NF.sly };
    if (lt < 3.57) return { p: [-0.36, 0.86, 0.05], yaw: 0.45, sp: [0.05, 0.2, -0.12], nk: [0, 0.3, -0.15], hLw: [-0.12, 1.12, 0.16], hRw: [-0.16, 1.02, 0.18], handL: 'relaxed', handR: 'relaxed', face: NF.wink };
    if (lt < 3.77) return { p: [0.45, 0.8, 0.0], yaw: -0.3, sp: [-0.3, 0, -0.4], nk: [-0.2, 0, -0.3], hL: [0.3, 0.2, 0], hR: [-0.3, 0.2, 0], handL: 'spread', handR: 'spread', face: NF.laugh };
    return { p: [0.42, 0.42, 0.1], yaw: -0.6, sp: [-0.1, -0.2, -0.25], nk: [0.05, -0.3, -0.2], fL: [0.25, -0.28, 0.35], fR: [0.05, -0.32, 0.4], kL: [0.3, 0.8, 0.6], kR: [0.1, 0.8, 0.6], hR: [-0.15, -0.05, 0.25], hL: [0.25, -0.2, 0.05], face: NF.grin };
  }

  function collage(t, lt) {
    const sen = who('senpai', { p: [0, 0.97, 0], yaw: 0.08, nk: [0.04, 0.05, 0], hR: [-0.07, 0.12, 0.11], eR: [-0.6, -0.5, 0.1], handR: 'fist', hL: [0.17, -0.32, 0.04], face: lt > 1.8 && lt < 2.7 ? SF.shy : SF.flat });
    sen.carry = [{ kind: 'bag', at: (m) => M4.chain(m.pelvis, M4.translate(-0.2, -0.02, 0.04), M4.rotY(0.2)) }];
    const nag = who('nagatoro', collagePose(lt));
    const props = [];
    if (lt < 1.07) {
      props.push({ kind: 'desk', pos: [-0.9, 0.2, -0.8], yaw: 0.3 });
      props.push({ kind: 'chair', pos: [0.85, 0.15, -0.9], yaw: -0.2 });
    } else if (lt < 2.27) {
      props.push({ kind: 'easel', pos: [0.95, 0.0, -0.8], yaw: -0.5 });
    } else {
      props.push({ kind: 'bustCurl', pos: [-0.85, 0.62, -0.4], yaw: 0.5, scale: 2.0 });
      props.push({ kind: 'bustBeard', pos: [0.9, 0.65, -0.5], yaw: -0.6, scale: 2.0 });
    }
    const senLut = L5('#7a4a00', '#f0a808', '#f8c850', '#fae8d0', '#faf8f3');
    const nagLut = L5('#5a2a10', '#a86030', '#e09a70', '#f6cdb0', '#fbf5e7');
    return {
      bg: '#01ecfc',
      layers: [layer({
        camera: look([0, 1.12, 2.5], [0, 1.08, 0], 30),
        props,
        cast: [Object.assign(sen, { lut: senLut }), Object.assign(nag, { lut: nagLut })],
        lut: ramp('#123a9a', '#5aaaf0'),
        rim: { color: '#ffffff', px: 3 }, ink: { color: '#6a4a20', px: 1 }
      })],
      front: (ctx, i) => {
        [[150, 60], [470, 40], [560, 120], [600, 300], [80, 300], [380, 330], [230, 30]].forEach(([x, y], k) => A.star(ctx, x, y, 7 + (k % 3) * 2, { color: '#ffffff', width: 2, seed: i.f + k, rot: i.f * 0.3 + k }));
        tags(ctx, [[60, 118, '企画', CREDITS.plan]], '#e0501a');
        tags(ctx, [[505, 228, '制作', CREDITS.make]], '#e0501a');
        const sp = [[1.0, 2.0, 130, 80, -0.3], [2.17, 2.77, 460, 70, -0.15], [2.9, 3.6, 470, 85, -0.1], [3.8, 4.7, 470, 80, -0.12]].find(q => lt >= q[0] && lt < q[1]);
        if (sp) A.hand(ctx, 'SENPAI', sp[2], sp[3], 30, '#ffffff', { seed: 4, rot: sp[4] });
        if ((lt > 0.97 && lt < 1.2) || (lt > 2.15 && lt < 2.32) || (lt > 3.55 && lt < 3.8)) {
          const cx = lt < 1.3 ? 330 : lt < 2.5 ? 420 : 470;
          A.spiral(ctx, cx, 150, 110, 1.6, { color: '#f030c0', width: 6, seed: i.f });
          A.wave(ctx, cx - 120, 250, cx + 80, 210, 10, 3, { color: '#f030c0', width: 5, seed: i.f });
        }
        if (lt > 2.27 && lt < 2.6) {
          A.stroke(ctx, [[95, 155], [125, 150], [150, 158]], { color: '#f8f040', width: 4, seed: i.f });
          A.stroke(ctx, [[505, 150], [535, 146], [560, 152]], { color: '#f8f040', width: 4, seed: i.f });
        }
        if (lt > 3.4 && lt < 3.8) {
          for (let k = 0; k < 6; k++) A.heart(ctx, 290 + k * 14, 32 + (k % 2) * 6, 7, { fill: k % 2 ? '#ff70b0' : '#f8e040', seed: k });
        }
      }
    };
  }

  function greenStand(t, lt) {
    const laugh = lt > 0.55 && lt < 0.85;
    const nag = who('nagatoro', {
      yaw: 0.15, nk: [0.03, laugh ? -0.05 : 0.1, laugh ? 0.18 : -0.08], sp: [0.02, 0.05, 0.02],
      glasses: lt > 0.88,
      hL: [0.09, -0.16, -0.1], hR: lt > 0.2 && lt < 0.55 ? [-0.03, 0.25, 0.16] : [-0.09, -0.16, -0.1], eR: [-0.6, -0.6, 0.1], handR: 'relaxed',
      face: laugh ? NF.laugh : lt > 0.88 ? NF.grin : NF.soft
    });
    return {
      bg: '#01e301',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#00b400', '#3cf03c') }),
        layer({ camera: faceCam(nag, 1.05, { off: [0.12, -0.25, 0], fov: 34, yaw: 0.1 }), cast: [nag], lut: L5('#4a0870', '#c708f4', '#e070f0', '#f8b9fa', '#f9f9fc'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#4a0870', px: 1 } })
      ],
      front: (ctx, i) => {
        tags(ctx, [[505, 120, 'シリーズ構成', CREDITS.series]], '#8020c0');
        if (laugh) A.loops(ctx, 160, 20, 140, 120, { color: '#40e0f0', width: 2.5, seed: i.f, turns: 2 });
        if (lt > 0.6) A.hand(ctx, 'SENPAI', 460, 300, 42, '#ffffff', { seed: 6, k: seg(lt, 0.6, 1.2), rot: -0.05 });
        if (lt > 1.0) A.star(ctx, 600, 70, 9, { color: '#ffffff', seed: i.f });
      }
    };
  }

  function senpaiFacepalm(t, lt) {
    const palm = lt > 0.3;
    const sen = who('senpai', {
      yaw: -0.35, nk: [0.08, -0.2, 0.06],
      lens: lt < 0.15 ? 'stars' : lt < 0.3 ? 'green' : 'clear',
      hL: palm ? [0.03, 0.3, 0.17] : [0.17, -0.3, 0.05], eL: [0.6, -0.6, 0.2], handL: palm ? 'open' : 'relaxed', wL: [0.2, 1.2, 0],
      face: lt < 0.3 ? { eyes: 'open', mouth: 'smirk', blush: 0.3 } : Object.assign({}, SF.shy, { eyes: 'half', gaze: [0.8, -0.2] })
    });
    return {
      bg: '#02e8fa',
      layers: [layer({ camera: faceCam(sen, 0.5, { off: [0.04, -0.06, 0], yaw: -0.3, fov: 32 }), cast: [sen], lut: L5('#5a0050', '#e90cb9', '#f070d0', '#fbdcf5', '#ffffff'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#5a0050', px: 1 } })],
      back: (ctx, i) => {
        A.wave(ctx, 0, 60, 640, 40, 14, 5, { color: '#ffffff', width: 4, seed: i.f, phase: lt * 6 });
        A.wave(ctx, 0, 320, 640, 300, 12, 6, { color: '#ffffff', width: 4, seed: i.f + 1, phase: -lt * 6 });
        A.loops(ctx, 380, 40, 240, 300, { color: '#ffffff', width: 3, seed: i.f, turns: 2 });
      },
      front: (ctx, i) => {
        tags(ctx, [[505, 120, 'シリーズ構成', CREDITS.series]], '#8020c0');
        if (palm) A.hatch(ctx, 170, 150, 60, 40, { color: '#f8a0e0', gap: 6, width: 2, angle: 0.5 });
      }
    };
  }

  function senpaiSqueeze(t, lt) {
    const sen = who('senpai', { nk: [0.06, 0.02, S(lt * 30) * 0.02], face: SF.squeeze });
    return {
      bg: '#f3e204',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#d8c400', '#fbf060') }),
        layer({ camera: faceCam(sen, 0.42, { off: [0, -0.03, 0], fov: 30 }), cast: [sen], lut: L5('#6a0008', '#e90214', '#f06070', '#f9e6e6', '#fcf8f8'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#6a0008', px: 1 } })
      ],
      front: (ctx, i) => {
        A.wave(ctx, 20, 80, 160, 30, 6, 4, { color: '#30d0f0', width: 2, seed: i.f });
        A.wave(ctx, 480, 300, 620, 250, 6, 4, { color: '#f060c0', width: 2, seed: i.f + 1 });
        A.zigzag(ctx, 500, 60, 600, 120, 6, 8, { color: '#a050f0', width: 2, seed: i.f + 2 });
        A.zigzag(ctx, 40, 260, 140, 320, 6, 8, { color: '#30d0f0', width: 2, seed: i.f + 3 });
        tags(ctx, [[22, 8, 'キャラクターデザイン', CREDITS.chara], [508, 268, 'プロップデザイン', CREDITS.prop]], '#d01020');
      }
    };
  }

  function hugReading(t, lt) {
    const sen = who('senpai', { p: [0, 0.55, 0], yaw: 0, sp: [0.45, 0, 0], nk: [0.25, 0, 0], fL: [0.12, -0.48, 0.42], fR: [-0.12, -0.48, 0.42], kL: [0, 0.3, 1], kR: [0, 0.3, 1], hL: [0.08, 0.06, 0.3], hR: [-0.08, 0.06, 0.3], eL: [0.6, -0.6, -0.2], eR: [-0.6, -0.6, -0.2], handL: 'cup', handR: 'cup', face: SF.squeeze });
    sen.carry = [{ kind: 'book', at: (m) => M4.chain(m.chest, M4.translate(0, 0.06, 0.32), M4.rotX(-0.9)) }];
    const bob = S(lt * 18) * 0.012;
    const sh = headOf(sen);
    const ht = V3.add(sh, [0.17, 0.02 + bob, -0.03]);
    const nag = who('nagatoro', { p: [ht[0] - 0.02, ht[1] - 0.36, ht[2] - 0.24], yaw: -0.15, sp: [0.8, 0, 0.05], nk: [-0.5, -0.25, -0.15], hLw: V3.add(sh, [-0.1, -0.2, 0.1]), hRw: V3.add(sh, [0.06, -0.22, 0.12]), eL: [0.5, -0.4, -0.3], eR: [-0.5, -0.4, -0.3], handL: 'relaxed', handR: 'relaxed', face: NF.laugh });
    const lut = L5('#0a3a4a', '#2286ad', '#5ab8d0', '#c8ecf4', '#f5f9fc');
    return {
      bg: '#e8207a',
      layers: [layer({ camera: look([0.2, 1.08, 1.05], [0.05, 0.92, 0], 38, 0.04), cast: [sen, nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#0a3a4a', px: 1 } })],
      back: (ctx, i) => {
        A.burst(ctx, 330, 230, 60, 420, 40, { color: '#f8e020', width: 3, seed: i.f });
        A.burst(ctx, 330, 230, 80, 420, 26, { color: '#ff9ad0', width: 2, seed: i.f + 7 });
      },
      front: (ctx, i) => {
        A.hand(ctx, 'ENERGY', 330, 40, 54, '#40e8f0', { seed: i.f, ghost: 4, spacing: 1.3 });
        if (lt > 0.5 && lt < 0.65) {
          for (let k = 0; k < 8; k++) {
            ctx.fillStyle = k % 2 ? 'rgba(80,220,240,0.6)' : 'rgba(250,120,200,0.6)';
            ctx.fillRect(120 + k * 40, 120 + (k % 3) * 40, 60, 16);
          }
        }
        tags(ctx, [[22, 8, 'キャラクターデザイン', CREDITS.chara], [508, 268, 'プロップデザイン', CREDITS.prop]], '#d01020');
      }
    };
  }

  function senpaiYell(t, lt) {
    const sh = S(lt * 50) * 0.02;
    const sen = who('senpai', { yaw: 0.35, nk: [0.1, 0.25 + sh, sh], face: SF.shutYell });
    return {
      bg: '#fb0992',
      layers: [layer({ camera: faceCam(sen, 0.44, { off: [0.02, -0.06, 0], yaw: 0.25, fov: 32 }), cast: [sen], lut: L5('#7a3a00', '#fcc00b', '#fbd060', '#fbdc95', '#fcf9fa'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#7a3a00', px: 1 } })],
      front: (ctx, i) => {
        A.zigzag(ctx, 20, 30, 220, 60, 10, 10, { color: '#40e0f0', width: 3, seed: i.f });
        A.wave(ctx, 420, 330, 620, 290, 10, 3, { color: '#ff70c0', width: 3, seed: i.f });
      }
    };
  }

  function senpaiPush(t, lt) {
    const sen = who('senpai', { yaw: 0.15, sp: [-0.1, 0, 0], nk: [-0.05, 0.1, 0], hL: [0.45, 0.2, 0.25], hR: [-0.45, 0.2, 0.25], eL: [0.4, -0.8, 0], eR: [-0.4, -0.8, 0], handL: 'spread', handR: 'spread', face: SF.shutYell });
    return {
      bg: '#f80489',
      layers: [layer({ camera: look([0.1, 1.2, 1.8], [0, 1.08, 0], 34), cast: [sen], props: [{ kind: 'bag', pos: [-0.62, 1.05, 0.3], yaw: 0.8, roll: 0.6 }], maskProps: true, lut: L5('#7a3a00', '#fcc00b', '#fbd060', '#fbdc95', '#fcf9fa'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#7a3a00', px: 1 } })],
      front: (ctx, i) => {
        A.burst(ctx, 320, 180, 120, 400, 30, { color: '#ffb0e0', width: 3, seed: i.f });
        ctx.save();
        ctx.strokeStyle = '#30d0e0';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(340, 240, 150, PI * 1.05, PI * 1.95);
        ctx.stroke();
        ctx.restore();
      }
    };
  }

  const CLASS_PH = [
    { t0: 0, set: ramp('#0090a8', '#30e8f4'), nag: L5('#003a6a', '#0060c0', '#20a0e0', '#40c8f0', '#c0f4ff'), sen: L5('#7a3a00', '#f8a010', '#fcc040', '#fde0a0', '#fff8ec'), ink: '#0060c0', bg: '#00cfe1' },
    { t0: 1.11, set: ramp('#00a040', '#40fc80'), nag: L5('#004a20', '#10a050', '#40d080', '#7efcb3', '#e0ffe8'), sen: L5('#6a0050', '#f020a0', '#f060c0', '#fbc8e8', '#fff4fa'), ink: '#008040', bg: '#03f957' },
    { t0: 1.73, set: ramp('#a07000', '#f8e020'), nag: L5('#5a3a00', '#a36d02', '#c79d03', '#e2cd01', '#fbf364'), sen: L5('#000a6a', '#1040e0', '#4070f0', '#c8d8fc', '#f4f8ff'), ink: '#806000', bg: '#e2cd01' },
    { t0: 2.48, set: ramp('#b00058', '#fc5aa8'), nag: L5('#5a0030', '#d0048a', '#e80067', '#fc98cd', '#ffe8f4'), sen: L5('#0a4a10', '#40d020', '#80e060', '#d8f8c8', '#f8fff4'), ink: '#b00058', bg: '#e80067' },
    { t0: 3.07, set: ramp('#7a00a8', '#d070f8'), nag: L5('#3a0060', '#a100c9', '#c401ea', '#f29cfd', '#fce8ff'), sen: L5('#003a4a', '#10b8c8', '#60d8e0', '#d0f8f8', '#f8ffff'), ink: '#7a00a8', bg: '#b601e0' },
    { t0: 3.78, set: ramp('#b85a00', '#f8b040'), nag: L5('#6a2a00', '#d26824', '#e08803', '#facf85', '#fff0d8'), sen: L5('#6a0000', '#e01010', '#f05050', '#fcd0d0', '#fff4f4'), ink: '#b85a00', bg: '#f49e04' }
  ];

  function giantPose(ph, lt) {
    const b = S(lt * 10) * 0.02;
    if (ph === 0) return [who('nagatoro', { p: [0, 0.87, 0], yaw: -0.3, nk: [0.35, 0.25, 0.2], sp: [0.15, 0.1, 0], hL: [0.14, 0.32, 0.2], eL: [0.4, -0.6, 0.1], handL: 'claw', face: NF.smug })];
    if (ph === 1) return [who('nagatoro', { p: [0, 0.87, 0], yaw: -0.35, nk: [0.2 + b, 0.3, 0.25], sp: [0.25, 0.1, 0.1], hR: [-0.02, 0.24, 0.17], handR: 'relaxed', face: NF.laugh })];
    if (ph === 2) return [who('nagatoro', { p: [0, 0.87, 0], yaw: 0.1, nk: [0.05, -0.1, 0.05], face: NF.smug })];
    if (ph === 3) return [who('nagatoro', { p: [0, 0.3, 0], up: [-0.95, 0.3, 0], fwd: [0, 0, 1], nk: [0.1, 0, 0.7 + b], hL: [0.05, 0.36, 0.08], hR: [-0.3, 0.15, 0.15], handL: 'relaxed', face: NF.laugh, fL: [0.1, -0.85, -0.05], fR: [-0.05, -0.86, 0.05] })];
    if (ph === 4) return [who('nagatoro', { p: [0, 0.35, 0], up: [0.9, 0.4, -0.1], fwd: [0, 0, 1], nk: [0.2, 0.2, -0.6 + b], hL: [0.2, 0.3, 0.2], hR: [-0.05, 0.28, 0.17], handR: 'fist', face: NF.laugh, fL: [0.1, -0.86, 0.05], fR: [-0.1, -0.85, -0.05] })];
    return [
      who('gamo', { p: [-0.75, 0.83, 0.1], yaw: 0.35, sp: [0.3, 0, 0], nk: [0.1, 0.1, 0.1], hR: [-0.02, 0.24, 0.17], handR: 'fist', face: Object.assign({}, NF.laugh, { eyes: 'shut' }) }),
      who('yoshi', { p: [-0.1, 0.89, -0.4], yaw: 0.1, sp: [0.2, 0, 0], nk: [0.15 + b, 0, 0.1], face: NF.laugh }),
      who('sakura', { p: [0.65, 0.86, 0.0], yaw: -0.35, sp: [0.25, 0, 0], nk: [0.1, -0.1, -0.1], hL: [0.02, 0.24, 0.17], handL: 'fist', face: Object.assign({}, NF.laugh, { mouth: 'grin' }) })
    ];
  }

  function giantCam(ph) {
    if (ph === 0) return look([0.15, 1.2, 1.25], [0.15, 1.15, 0], 40);
    if (ph === 1) return look([0.2, 1.2, 1.15], [0.05, 1.12, 0], 40);
    if (ph === 2) return look([0.1, 1.3, 0.75], [0.05, 1.27, 0], 40);
    if (ph === 3) return look([0.0, 0.55, 1.4], [0.0, 0.48, 0], 44, 0.05);
    if (ph === 4) return look([0.0, 0.6, 1.4], [0.0, 0.52, 0], 44, -0.05);
    return look([0, 1.15, 1.9], [0, 1.08, 0], 44);
  }

  function senPose(ph, lt) {
    const arms = [[0.38, 0.05, 0.25], [-0.38, 0.05, 0.25]];
    if (ph === 5) return { hL: [0.1, 0.42, 0.04], hR: [-0.1, 0.42, 0.04], eL: [0.8, 0.2, 0], eR: [-0.8, 0.2, 0], handL: 'open', handR: 'open', face: SF.shutYell, nk: [0.2, 0, 0] };
    return { hL: arms[0], hR: arms[1], eL: [0.5, -0.8, -0.2], eR: [-0.5, -0.8, -0.2], handL: 'spread', handR: 'spread', face: ph === 2 ? SF.shock : SF.yell, nk: [-0.05, S(lt * 4) * 0.2, 0] };
  }

  function classroom(t, lt) {
    let ph = 0;
    CLASS_PH.forEach((p, i) => { if (lt >= p.t0) ph = i; });
    const P = CLASS_PH[ph];
    const giants = giantPose(ph, lt);
    const sen = who('senpai', Object.assign({ p: [0, 0.97, 0], yaw: 0 }, senPose(ph, lt)));
    const wipe = seg(lt, 0, 0.2);
    return {
      bg: P.bg,
      layers: [
        layer({ camera: look([2.6, 1.25, 1.8], [-0.6, 1.0, -3.2], 52), set: 'classroom', env: 'room', lut: P.set }),
        layer({ camera: giantCam(ph), cast: giants, lut: P.nag }),
        layer({ camera: look([0, 1.0, 6.8], [0, 0.95, 0], 30), cast: [sen], lut: P.sen, rim: { color: '#ffffff', px: 3 }, ink: { color: '#3a3a3a', px: 1 } })
      ],
      front: (ctx, i) => {
        if (wipe < 1) {
          ctx.save();
          ctx.fillStyle = '#f80489';
          ctx.beginPath();
          ctx.rect(0, 0, 640, 360);
          ctx.arc(330, 300, 60 + wipe * 600, 0, PI * 2, true);
          ctx.fill();
          ctx.restore();
        }
        if (ph === 0) A.catFace(ctx, 520, 150, 26, '#102040', i.f);
        tags(ctx, [[96, 284, '美術監督', CREDITS.art], [470, 284, '色彩設計', CREDITS.color]], P.ink);
        if (ph === 5) {
          [[70, 60, 34], [250, 50, 40], [420, 210, 30], [520, 60, 36], [600, 250, 28]].forEach(([x, y, s], k) => {
            if (lt > 3.85 + k * 0.08) {
              ctx.save();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(x, y, s, 0, PI * 2);
              ctx.stroke();
              ctx.restore();
              A.hand(ctx, 'Pu', x, y, s * 0.9, '#ffffff', { seed: k, ghost: 3 });
            }
          });
        }
      }
    };
  }

  function sketchbook(t, lt) {
    const k = seg(lt, 0.1, 1.2);
    const ang = -PI / 2 + k * PI * 2.1;
    const page = [0, 0.75, 0];
    const hx = page[0] + C(ang) * 0.07, hy = page[2] + S(ang) * 0.055;
    const nag = who('nagatoro', { p: [0.22, 0.87, -0.12], yaw: -0.6, hRw: [hx + 0.02, 0.8, hy + 0.03], eR: [-0.4, -0.7, 0.2], handR: 'pinch', wR: [0.6, 0, 0.2], hide: { head: true, torso: true, pelvis: true, hairBack: true, armL: true, legs: true }, face: NF.smug });
    nag.carry = [{ kind: 'marker', at: carryAt('R', [0.005, -0.06, 0.02], M4.chain(M4.rotX(0.7), M4.rotZ(0.3))) }];
    const lut = L5('#6a0a4a', '#e8148a', '#f070b0', '#f8a0cc', '#fde8f4');
    return {
      bg: '#fbe0f0',
      layers: [layer({
        camera: look([0.05, 1.08, 0.33], [0.02, 0.76, -0.01], 40, -0.12),
        props: [{ kind: 'sketch', pos: page, pitch: -PI / 2, yaw: 0.15, tex: { key: 'senpaiSketch', w: 512, h: 384, draw: senpaiSketch } }],
        cast: [nag], lut, rim: { color: '#ffffff', px: 3 }, ink: { color: '#6a0a4a', px: 1 }
      })],
      front: (ctx, i) => {
        const hp = A.heartPts(330, 190, 70);
        A.stroke(ctx, hp.slice(0, Math.max(2, Math.floor(hp.length * k))), { color: '#e8148a', width: 7, seed: i.f, amp: 2 });
        if (lt > 1.0) A.heart(ctx, 210, 270, 30, { fill: '#e8148a', dots: '#ff9ad0', seed: 4 });
        A.scrawl(ctx, 0, 0, 640, 80, { color: '#70e0e0', width: 2, seed: i.f, n: 2, steps: 8 });
        tags(ctx, [[30, 150, '撮影監督', CREDITS.photo], [30, 210, '編集', CREDITS.edit], [470, 170, 'シーンビジュアルデザイン', CREDITS.scene]], '#d0206a');
      }
    };
  }

  function senpaiSketch(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8d0dc';
    ctx.lineWidth = 2;
    for (let y = 30; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.52, w * 0.17, h * 0.28, 0, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      ctx.moveTo(w * (0.34 + k * 0.04), h * 0.3);
      ctx.lineTo(w * (0.36 + k * 0.035), h * 0.46);
    }
    ctx.stroke();
    ctx.strokeRect(w * 0.37, h * 0.48, w * 0.1, h * 0.08);
    ctx.strokeRect(w * 0.53, h * 0.48, w * 0.1, h * 0.08);
    ctx.beginPath();
    ctx.moveTo(w * 0.47, h * 0.52);
    ctx.lineTo(w * 0.53, h * 0.52);
    ctx.moveTo(w * 0.45, h * 0.7);
    ctx.quadraticCurveTo(w * 0.5, h * 0.66, w * 0.55, h * 0.7);
    ctx.stroke();
    ctx.font = `700 ${Math.round(h * 0.09)}px ${A.HAND}`;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('senpai', w * 0.62, h * 0.88);
  }

  function nailHand(t, lt) {
    const k = seg(lt, 0, 1.0);
    const hx = lerp(-0.35, 0.12, ease(k));
    const nag = who('nagatoro', { p: [hx - 0.05, 0.87, -0.32], yaw: 0.2, hRw: [hx, 1.2 + S(lt * 6) * 0.02, 0.06], eR: [-0.5, -0.5, 0.2], handR: 'spread', wR: [lerp(1.4, 1.1, k), 0.3, -0.2], hide: { head: true, torso: true, pelvis: true, hairBack: true, armL: true, legs: true }, face: NF.smug });
    return {
      bg: '#01fbf2',
      layers: [
        layer({ camera: look([0, 1.25, 0.9], [0.05, 1.18, -1], 42), props: [{ kind: 'bustCurl', pos: [0.52, 0.85, -0.6], yaw: -0.5, scale: 1.6 }, { kind: 'bustBeard', pos: [-0.75, 0.85, -1.1], yaw: 0.5, scale: 1.6 }], lut: ramp('#008a88', '#d8fcfa') }),
        layer({ camera: look([0, 1.25, 0.9], [0.05, 1.18, -1], 42), cast: [nag], lut: L5('#5a1a80', '#c040e0', '#f070c0', '#f8e040', '#ffffff'), rim: { color: '#ffffff', px: 3 }, ink: { color: '#5a1a80', px: 1 } })
      ],
      front: (ctx, i) => {
        if (lt > 0.3 && lt < 0.85) {
          A.stroke(ctx, [[150, 120], [260, 100], [340, 130]], { color: '#40e060', width: 4, seed: i.f });
          A.stroke(ctx, [[140, 200], [250, 230], [330, 200]], { color: '#40e060', width: 4, seed: i.f + 1 });
        }
        if (lt > 0.85) {
          for (let x = 40; x < 640; x += 46) A.wave(ctx, x, 0, x + 10, 360, 8, 5, { color: '#ffffff', width: 3, seed: i.f + x, phase: x });
        }
        tags(ctx, [[30, 150, '撮影監督', CREDITS.photo], [30, 210, '編集', CREDITS.edit], [470, 170, 'シーンビジュアルデザイン', CREDITS.scene]], '#d0206a');
      }
    };
  }

  function profileKiss(t, lt) {
    const nag = who('nagatoro', { yaw: -1.05, nk: [0.12, -0.05, 0.05], face: Object.assign({}, NF.sly, { mouth: lt > 1.15 ? 'kiss' : 'smirk' }) });
    const k = seg(lt, 0.05, 1.3);
    return {
      bg: '#0e003b',
      layers: [layer({ camera: faceCam(nag, 0.6, { off: [-0.04, -0.07, 0], yaw: 0.05, fov: 32 }), cast: [nag], env: 'toon', lut: L5('#1a0030', '#3e0053', '#a00060', '#fb00cd', '#ff9ad8') })],
      back: (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 640, 360);
        g.addColorStop(0, '#0e003b');
        g.addColorStop(0.45, '#3e0053');
        g.addColorStop(0.75, '#c0007a');
        g.addColorStop(1, '#ff8a20');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 640, 360);
      },
      front: (ctx, i) => {
        A.hand(ctx, 'KISS', 300, 300, 62, '#f8a0d8', { seed: 2, k, align: 'left', ghost: 3 });
        if (lt > 1.3) A.heart(ctx, 520, 290, 18, { color: '#f8a0d8', width: 3, seed: i.f });
      }
    };
  }

  function senpaiPow(t, lt) {
    const sen = who('senpai', Object.assign(sitCross(0, 0, 0), { sp: [-0.05, 0, 0], nk: [-0.1, S(lt * 30) * 0.05, 0], hLw: [0.2, 0.42, 0.25], hRw: [-0.2, 0.42, 0.25], handL: 'spread', handR: 'spread', lens: 'glare', hairScale: [1.3, 1.5, 1.3], face: { eyes: 'wide', mouth: 'open', brows: 'worry' } }));
    const k = seg(lt, 0, 1.4);
    return {
      bg: '#fbdff8',
      layers: [
        layer({ camera: look([0, 0.55, 2.2], [0, 0.75, -4], 46), set: 'artroom', env: 'room', lut: ramp('#e090d0', '#fdf0fc') }),
        layer({ camera: look([0, 0.62, 1.35], [0, 0.66, 0], 40), cast: [sen], lut: L5('#0a4a5a', '#0c8ba1', '#40c0d0', '#d0f0f4', '#f7f5fa') })
      ],
      mid: (ctx, i) => {
        const g = A.rng(5);
        const list = [];
        const n = Math.floor(8 + k * 26);
        for (let q = 0; q < n; q++) {
          const a = g() * PI * 2, rr = 90 + g() * 150;
          list.push([340 + C(a) * rr, 120 + S(a) * rr * 0.55, 8 + g() * 12]);
        }
        A.blobs(ctx, list, '#e01030', 9);
      },
      front: (ctx, i) => {
        if (lt > 0.2 && lt < 1.1) {
          A.hand(ctx, 'POW', 110, 130, 74, '#30d0e0', { seed: i.f, ghost: 5, rot: -0.2 });
          A.hand(ctx, 'POW', 540, 170, 60, '#30d0e0', { seed: i.f + 3, ghost: 5, rot: 0.3 });
        }
        A.sparkle(ctx, 300, 60, 14, { color: '#ffffff' });
        A.stroke(ctx, [[420, 110], [470, 60]], { color: '#40d0e0', width: 4, seed: i.f });
      }
    };
  }

  function chuckle(t, lt) {
    const up = lt > 0.55;
    const wig = S(lt * 30) * 0.02;
    const nag = who('nagatoro', {
      yaw: 0.05, nk: [0.04, 0.05, S(lt * 8) * 0.06], sp: [0.05, 0, 0],
      hL: up ? [0.19, 0.18 + wig, 0.24] : [0.13, -0.06, 0.24], hR: up ? [-0.19, 0.18 - wig, 0.24] : [-0.13, -0.06, 0.24],
      eL: [0.6, -0.6, 0], eR: [-0.6, -0.6, 0], handL: 'claw', handR: 'claw', wL: [up ? -1.0 : 0.8, 0, 0], wR: [up ? -1.0 : 0.8, 0, 0],
      face: up ? NF.grin : NF.calm
    });
    return {
      bg: '#03eae3',
      layers: [
        layer({ camera: look([0.4, 1.3, 2.6], [-0.5, 1.2, -4], 46), set: 'artroom', env: 'room', lut: ramp('#00b0a8', '#b0fcf8') }),
        layer({ camera: faceCam(nag, 0.95, { off: [0, -0.15, 0], fov: 34 }), cast: [nag], lut: L5('#6a1040', '#e4648a', '#f0a070', '#faea93', '#fcf1d1'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#6a1040', px: 1 } })
      ],
      front: (ctx, i) => {
        if (up) {
          A.hand(ctx, 'Chuckle', 150, 70, 38, '#a030d0', { seed: i.f, rot: -0.15 });
          if (lt > 0.95) A.hand(ctx, 'Chuckle', 520, 90, 30, '#a030d0', { seed: i.f + 2, rot: 0.6 });
          A.bolt(ctx, 50, 140, 50, 0.3, { color: '#a030d0', width: 4, seed: i.f });
          A.bolt(ctx, 590, 230, 50, -0.4, { color: '#a030d0', width: 4, seed: i.f + 1 });
        } else {
          A.stroke(ctx, [[60, 80], [200, 40], [330, 30]], { color: '#a030d0', width: 3, seed: i.f });
        }
        tags(ctx, [[30, 270, '音響監督', CREDITS.sound], [505, 20, '音響効果', CREDITS.sfx]], '#8020c0');
      }
    };
  }

  function stars(ctx, f) {
    const g = A.rng(77);
    for (let k = 0; k < 90; k++) {
      const x = g() * 640, y = g() * 360, s = 0.6 + g() * 1.6;
      ctx.fillStyle = k % 9 === 0 ? '#f070c0' : k % 7 === 0 ? '#60f080' : '#ffffff';
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(S(f * 0.7 + k));
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function devilFlash(t, lt) {
    const b = lt > 0.25;
    const nag = who('nagatoro', { yaw: b ? 0 : -0.15, nk: [b ? 0.05 : 0.18, b ? 0 : 0.15, b ? 0 : 0.1], sp: [0.05, 0, 0], face: Object.assign({}, NF.devil, { eyes: 'glow', gaze: [0, 0.2] }) });
    const lut = b ? L5('#000008', '#0cb5dc', '#0a2a7a', '#0b094e', '#e02040') : L5('#000010', '#200468', '#390582', '#6715a1', '#40f080');
    return {
      bg: '#00002c',
      layers: [layer({ camera: faceCam(nag, b ? 0.66 : 0.62, { off: [0, -0.1, 0], fov: 32 }), cast: [nag], env: 'dark', lut, rim: { color: b ? '#e020a0' : '#40f040', px: 4 }, ink: { color: b ? '#40f0f0' : '#e020e0', px: 1.5 }, wob: 0.8 })],
      back: (ctx, i) => stars(ctx, i.f),
      front: (ctx) => tags(ctx, [[30, 270, '音響監督', CREDITS.sound], [505, 20, '音響効果', CREDITS.sfx]], '#8020c0')
    };
  }

  function senpaiGrit(t, lt) {
    const sh = S(lt * 34) * 0.012;
    const sen = who('senpai', { yaw: -0.2, nk: [0.32, -0.18 + sh, 0.06], face: Object.assign({}, SF.grit, { gaze: [-0.4, -0.5] }) });
    return {
      bg: '#e8e2a8',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#c8c088', '#f8f4d8') }),
        layer({ camera: faceCam(sen, 0.46, { off: [0, -0.08, 0], yaw: -0.15, pitch: -0.12, fov: 32 }), cast: [sen], lut: L5('#3a1a6a', '#a14ee7', '#83a8e8', '#d8ecf8', '#f3f7f9'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#3a1a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        const g = A.rng(31);
        for (let k = 0; k < 7; k++) {
          const x = 30 + g() * 580, y = ((g() * 360 + lt * 120 * (0.6 + g())) % 380) - 10;
          A.stroke(ctx, [[x, y - 14], [x + 7, y + 4], [x, y + 9], [x - 7, y + 4], [x, y - 14]], { color: '#40c0e0', width: 2.5, seed: k });
        }
        A.hand(ctx, 'KASA KASA', 120, 175, 26, '#a8e0f0', { seed: 8, rot: 0.15 });
        A.hand(ctx, 'KASA KASA', 520, 180, 26, '#a8e0f0', { seed: 9, rot: -0.1 });
        tags(ctx, [[30, 270, '音響監督', CREDITS.sound], [505, 20, '音響効果', CREDITS.sfx]], '#8020c0');
      }
    };
  }

  function yellLaugh(t, lt) {
    const sen = who('senpai', { p: [-0.25, 0.97, 0], yaw: 0.25, nk: [-0.05, 0.25, 0.1], hL: [-0.12, 0.16, 0.17], hR: [0.12, 0.16, 0.2], eL: [0.6, -0.5, 0.2], eR: [-0.6, -0.5, 0.2], handL: 'open', handR: 'open', face: SF.yell });
    const nag = who('nagatoro', { p: [0.42, 0.87, -0.1], yaw: -0.5, nk: [0.12, -0.3, -0.2], face: NF.laugh });
    return {
      bg: '#05cadf',
      layers: [
        layer({ camera: look([0.1, 1.36, 0.95], [0.1, 1.33, 0], 36), cast: [Object.assign(sen, { lut: L5('#5a5000', '#b9ac04', '#dbe404', '#f6f9e6', '#f9fbf5') }), Object.assign(nag, { lut: L5('#5a4000', '#b08a20', '#d8b850', '#f0e090', '#fff8e0') })], rim: { color: '#ffffff', px: 3 } })
      ],
      front: (ctx, i) => {
        [[60, 60], [250, 40], [600, 100], [560, 300], [80, 290]].forEach(([x, y], k) => {
          A.stroke(ctx, [[x - 10, y - 10], [x + 10, y + 10]], { color: '#f8f040', width: 4, seed: i.f + k });
          A.stroke(ctx, [[x + 10, y - 10], [x - 10, y + 10]], { color: '#f8f040', width: 4, seed: i.f + k + 9 });
        });
      }
    };
  }

  function spiralGlasses(t, lt) {
    const sen = who('senpai', { nk: [0.05, 0.1, -0.08], lens: 'spiral', face: SF.shock });
    return {
      bg: '#e8f4f6',
      layers: [layer({ camera: faceCam(sen, 0.34, { off: [0, -0.02, 0], yaw: 0.1, fov: 32, roll: 0.1 }), cast: [sen], lut: L5('#0a4a5a', '#3db8c3', '#3e8799', '#e4ebf4', '#f8f9fa') })]
    };
  }

  function senpaiCry(t, lt) {
    const sh = S(lt * 22) * 0.025;
    const sen = who('senpai', { yaw: 0.25, nk: [0.12, 0.2 + sh, sh], hL: [0.3, 0.26, 0.36], eL: [0.6, -0.4, 0.1], handL: 'spread', wL: [-1.4, 0, 0.3], face: SF.cry });
    return {
      bg: '#5703b3',
      layers: [layer({ camera: faceCam(sen, 0.58, { off: [0.1, -0.08, 0], yaw: 0.15, fov: 34 }), cast: [sen], lut: L5('#0a3a2a', '#11c793', '#80d030', '#e4f404', '#f8fce0'), rim: { color: '#ffffff', px: 4 }, ink: { color: '#0a3a2a', px: 1 }, wob: 0.6 })],
      front: (ctx, i) => {
        if (lt > 0.2 && lt < 0.7) A.mouseFace(ctx, 230, 80, 18, '#ffffff', i.f);
        if (lt > 0.6 && lt < 1.6) A.loops(ctx, 300, 60, 200, 160, { color: '#ffffff', width: 2, seed: i.f, turns: 3 });
        A.zigzag(ctx, 520, 150, 610, 170, 6, 8, { color: '#f8a020', width: 3, seed: i.f });
        A.hand(ctx, '?', 560, 220, 30, '#f8f040', { seed: i.f });
        A.hand(ctx, '?', 590, 250, 22, '#c070f0', { seed: i.f + 1 });
        tags(ctx, [[110, 288, '音楽', CREDITS.music], [495, 288, '音楽制作', CREDITS.label]], '#8020c0');
      }
    };
  }

  function master(t, lt) {
    const nag = who('nagatoro', { yaw: -0.4, nk: [0.03, -0.15 + S(lt * 5) * 0.03, -0.05], face: lt > 0.5 ? NF.grin : NF.smug });
    return {
      bg: '#c50011',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#9a0010', '#d01828') }),
        layer({ camera: faceCam(nag, 0.52, { off: [0.05, -0.08, 0], yaw: -0.2, fov: 32 }), cast: [nag], lut: L5('#200060', '#9b1cf6', '#4070e0', '#0ed0e6', '#e0ffff'), rim: { color: '#ffffff', px: 5 }, ink: { color: '#200060', px: 1 }, wob: 0.6 })
      ],
      front: (ctx, i) => {
        A.hand(ctx, 'MASTER?', 120, 210, 34, '#30d0e0', { seed: 5, rot: -0.3, k: seg(lt, 0.1, 0.5) });
        if (lt > 0.68) A.crown(ctx, 560, 70, 34, '#f8e020', i.f);
        if (lt > 0.8) A.zigzag(ctx, 520, 120, 600, 110, 6, 6, { color: '#f8e020', width: 3, seed: i.f });
        tags(ctx, [[110, 288, '音楽', CREDITS.music], [495, 288, '音楽制作', CREDITS.label]], '#8020c0');
      }
    };
  }

  function gang(t, lt) {
    const b = S(lt * 9) * 0.03;
    const girls = [
      who('gamo', { p: [-0.55, 0.83, 0.15], yaw: 0.35, sp: [0.45, 0.1, 0.1], nk: [-0.2 + b, 0.1, 0.1], face: Object.assign({}, NF.laugh, { eyes: 'open' }) }),
      who('yoshi', { p: [-0.18, 0.89, -0.05], yaw: 0.1, sp: [0.45, 0, 0.05], nk: [-0.15, 0.05, 0.05], hR: [-0.05, 0.3, 0.2], handR: 'point', face: NF.grin }),
      who('sakura', { p: [0.22, 0.86, -0.1], yaw: -0.1, sp: [0.45, 0, -0.05], nk: [-0.15 - b, -0.05, -0.05], face: Object.assign({}, NF.grin, { eyes: 'soft' }) }),
      who('nagatoro', { p: [0.55, 0.87, 0.12], yaw: -0.35, sp: [0.45, -0.1, -0.1], nk: [-0.2, -0.1, -0.1], face: NF.grin })
    ];
    const sen = who('senpai', { p: [0.0, 0.97, 0], face: SF.cry, nk: [0.05, S(lt * 20) * 0.08, 0] });
    return {
      bg: '#1a0a4a',
      layers: [
        layer({ camera: look([0, 0.95, 1.25], [0, 1.35, 0], 62), cast: girls, lut: L5('#100040', '#2302c4', '#9c21e6', '#c427f9', '#ea9efa'), rim: { color: '#40f0f0', px: 1.5 } }),
        layer({ camera: look([0, 1.3, 2.2], [0, 1.77, 0], 30), cast: [sen], lut: L5('#3a2000', '#a06020', '#e0a050', '#f8e0a0', '#fffbe0'), rim: { color: '#ffffff', px: 3 } })
      ],
      back: (ctx, i) => {
        const g = ctx.createLinearGradient(0, 0, 0, 360);
        g.addColorStop(0, '#0a0430');
        g.addColorStop(1, '#4a0a9a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 640, 360);
        ['#30f0f0', '#f040c0', '#f8e020', '#40f060'].forEach((c, k) => {
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          for (let q = 0; q < 4; q++) {
            ctx.strokeRect(10 + k * 9 + q * 22, 10 + k * 7 + q * 14, 60 + q * 30, 40 + q * 18);
          }
        });
      },
      front: (ctx, i) => {
        if (lt > 0.7 && lt < 1.6) A.wave(ctx, 120, 300, 620, 270, 6, 6, { color: '#40f0f0', width: 3, seed: i.f, phase: lt * 8 });
        if (lt > 1.95) {
          A.heart(ctx, 130, 110, 60, { color: '#ff5ac8', width: 4, seed: i.f, dots: '#ff5ac8' });
          A.heart(ctx, 510, 190, 54, { color: '#ff5ac8', width: 4, seed: i.f + 1 });
        }
      }
    };
  }

  const PUPU_LUT = L5('#100a6a', '#391fe6', '#6a8ae0', '#c3dfea', '#f9f7f3');

  function pupupu(t, lt) {
    const wink = lt > 0.3;
    const nag = who('nagatoro', { yaw: -0.3, nk: [0.02, -0.15, 0.12], hR: [-0.02, 0.25, 0.18], eR: [-0.6, -0.6, 0], handR: 'fist', face: Object.assign({}, NF.pupu, wink ? { eyes: 'squeeze' } : {}) });
    return {
      bg: '#f80454',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#c8003a', '#fb2a6a') }),
        layer({ camera: faceCam(nag, 0.5, { off: [0.03, -0.08, 0], yaw: -0.2, fov: 32 }), cast: [nag], lut: PUPU_LUT, rim: { color: '#ffffff', px: 5 }, ink: { color: '#100a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        A.sfx(ctx, 'プププ', 90, 140, 50, '#ff2a6a', { vertical: true, outline: '#ffffff', outlineW: 6, seed: i.f });
        A.sfx(ctx, 'プププ', 560, 110, 46, '#ff2a6a', { vertical: true, outline: '#ffffff', outlineW: 6, seed: i.f + 3 });
      }
    };
  }

  function pointLaugh(t, lt) {
    const nag = who('nagatoro', { yaw: 0, sp: [0.12, 0, 0.05], nk: [0.08, -0.1, 0.18 + S(lt * 16) * 0.06], hR: [-0.2, 0.2, 0.6], eR: [-0.7, -0.4, -0.1], handR: 'point', hL: [0.12, -0.05, 0.12], handL: 'fist', face: NF.laugh });
    return {
      bg: '#f80454',
      layers: [
        layer({ camera: look([0.5, 1.4, 3.8], [-1.5, 1.2, -5], 40), set: 'classroom', env: 'room', lut: ramp('#c8003a', '#fb2a6a') }),
        layer({ camera: faceCam(nag, 0.95, { off: [-0.08, -0.12, 0], yaw: 0.05, fov: 36 }), cast: [nag], lut: PUPU_LUT, rim: { color: '#ffffff', px: 5 }, ink: { color: '#100a6a', px: 1 } })
      ],
      front: (ctx, i) => {
        if (lt > 0.15) A.burst(ctx, 170, 170, 40, 180, 16, { color: '#f8f040', width: 3, seed: i.f });
        if (lt > 0.25) {
          A.sfx(ctx, 'ギャハハ', 560, 170, 46, '#f8f040', { vertical: true, outline: '#c00040', outlineW: 4, seed: i.f });
          for (let k = 0; k < 4; k++) A.wave(ctx, 20 + k * 22, 20, 30 + k * 22, 340, 6, 8, { color: '#f8f040', width: 3, seed: i.f + k, phase: k });
        }
      }
    };
  }

  window.NagAct1 = { intro, ijiranaide, feet, faceTurn, kanaIji, glassesGrin, kanaRanaide, senpaiShock, kanaNagatoro, twoShot, kanaTitle, fireworks, faceFront, collage, greenStand, senpaiFacepalm, senpaiSqueeze, hugReading, senpaiYell, senpaiPush, classroom, sketchbook, nailHand, profileKiss, senpaiPow, chuckle, devilFlash, senpaiGrit, yellLaugh, spiralGlasses, senpaiCry, master, gang, pupupu, pointLaugh };
})();
