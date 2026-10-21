(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, keys } = K;
  const { M4, V3 } = window.P3D;
  const Cast = window.KonosubaCast;

  const DURATION = 90.14;
  const CUTS = [
    0, 9.76, 14.64, 19.52, 24.4, 29.28, 34.16, 36.83, 39.04,
    46.67, 54.05, 59.06, 63.56, 66.36, 68.86, 72.03, 78.54, 83.54
  ];

  const VOICE = K.envelope('0000000000019fuLztruwqhimhpOyuttvCshfggJxxuvuzrknigRFwtusssnnlkjMwusvonihpimQBxstsunlkkiLHvstuxsjpskwJAywvuukjihhVxyxvwonmsolHDzwxyzsolkjFJBvtulppnErvUCxwuvukhkjjTAtsutmmkstjDAvwvrzskhhhALtrrrsttssprxwrvspqypmohuWCBxxxxrozolKCzxxwwoljkkPAAsrsrfduidQJDttrGnllpsODzCBzBwoDsryODCyyzzronnqVBwutrkecxggOEBCpsAuponkJFIrwvyqnryqsSBBwvzBumb7eSFDBzrsohvmfAOFzAzyCtqkbaWIAAyyxqpBuqUIEzzzDAtrppHRAtrqpgcktkDVHAvxsGtbuf8QECyzyvqpBrpxPDzzxAxrmnlmQBsssqogeyjmTPFFBABplmjcRGHCxvwthrrlAJCztrtwkihiuKysonotd9xjbSLGxvuErekqsIOAxsyxqijukmOEvxxywljihfVGCyvuskeokfNHBwwvyslormpUNFDCyutqHsqSGCABAzuqqplGJuuvspf9fvfCZHGPNxQCDErvULGKGGGAyAvtQMEDBBEBxussGNDrssqpilypEWMFzuptjhqaaSNEzEDGxqKzsSFExAAEGvtpnpPGtppppgcEkyVIxyFCFAhivqVGDKEFAwuGGuFPGBCAEEvtrhlVIEDAqslevniISLGFGGFzrrmzXMIFECAxyHAAYMGFDCGFAzxvJJutspnjgoxjEQFBIrtGyromfTCyBBAAtrEwsIKFBAAFEztrpyOHAwtswlizkeRHtDBBvrpqnkLCxwCCCxpCspLDCxyxCzroopxSAvqqsqieyiqUCqyCDIsfnt9LICyxByuqyzsFNFBBCCCtrsrqUIBArptrhuheMLICDCBxqnlkpVGyABzsqpEsrSKCzAyIAstoqMCywvrumisuzNTyutsKZPHtppWGNFEDHGGMHEXLGFDCFGACCDAWDtpmpprpBwHXKEDDCMJBDwgTOGFFFDCDHEEQMGBCAEGDEFCDNBwvrqvusJsoVLEBtuIIFwodxOGCAwyAABIyGKHBzDsExupqpQICBwACAzPwpMxwGNKLNJHJBFTIDBCDDBzIAzTFADAyCBCAzxTwutstrtryywNRBxOFJMJHGAtXOJIJJGJHOIIOJJEFFJGIEwpOxsvokiKNLIFRTJDBAvFICEFxVNIFFDGCCOHHWFGBCCGHBBDDHSBwrnqussExfULLGqpsAzCCCTPJEFBBFEKNCMPHBBByzxyAEESKIFCCECFLCAWDyGGGHCzsnkTOJJIIEDCCSFyCFDCDCKHFRHyAuvyusuwvCvpTHBwAqyFuECnhWBCAAAFwrKusKDEzwyECvqppJDDytrtshiCmoQIArrsvohhc9WApyzzAyoErpRGzxzxzzupmmQyyzvvxthnsjlTOGBrryxsutvTKDwDEHxuBGzHRIEytzDztpfgQBxwusmgbzliWKIEHFIxhekeISJBAzyvpuEstQCABBzCtpqpoZEuwomklhzkfQyuzrsBIzzBzBSFBzAADwtEvqRHDABzCCttqsJJGwuttrjrnhJTJGGGCynlwecQxrDDCCuoAsoRKzzzxzvolljNCwutttmgkohCZMDCvsJvCAmuWQHFHGCCtzxtUFGEDxyzsvumGQEJCzsl9523nBqvxzyuk59fnAHOHBszJIGztxGGJHEIDBzxyrc42221222bikVICzrtnsqrof77651000000000000', 20);

  const ENVS = {
    meadow: { exposure: 1.0, sunDir: [0.35, -0.75, -0.55], sunColor: [0.4, 0.38, 0.32], ambTop: [0.74, 0.774, 0.774], ambBottom: [0.533, 0.585, 0.516], fogColor: [0.62, 0.84, 0.56], fogNear: 25, fogFar: 160 },
    porch: { exposure: 1.0, sunDir: [0.55, -0.7, -0.45], sunColor: [0.46, 0.42, 0.34], ambTop: [0.688, 0.688, 0.705], ambBottom: [0.516, 0.482, 0.447], fogColor: [0.8, 0.82, 0.8], fogNear: 25, fogFar: 90 },
    hall: { exposure: 1.0, sunDir: [-0.55, -0.7, -0.4], sunColor: [0.42, 0.38, 0.3], ambTop: [0.705, 0.688, 0.688], ambBottom: [0.516, 0.473, 0.43], fogColor: [0.3, 0.24, 0.2], fogNear: 20, fogFar: 60 },
    sofa: { exposure: 1.0, sunDir: [-0.4, -0.6, -0.65], sunColor: [0.4, 0.34, 0.3], ambTop: [0.688, 0.654, 0.671], ambBottom: [0.482, 0.396, 0.413], fogColor: [0.12, 0.08, 0.08], fogNear: 15, fogFar: 50 },
    yard: { exposure: 1.0, sunDir: [-0.45, -0.72, -0.5], sunColor: [0.42, 0.4, 0.34], ambTop: [0.74, 0.757, 0.774], ambBottom: [0.533, 0.533, 0.482], fogColor: [0.78, 0.88, 0.92], fogNear: 30, fogFar: 120 },
    bath: { exposure: 1.0, sunDir: [-0.3, -0.8, -0.5], sunColor: [0.36, 0.34, 0.28], ambTop: [0.74, 0.705, 0.654], ambBottom: [0.55, 0.516, 0.447], fogColor: [0.86, 0.84, 0.76], fogNear: 18, fogFar: 60 },
    water: { exposure: 1.0, sunDir: [-0.2, -0.9, -0.3], sunColor: [0.34, 0.34, 0.26], ambTop: [0.74, 0.74, 0.705], ambBottom: [0.516, 0.533, 0.43], fogColor: [0.58, 0.64, 0.4], fogNear: 0.8, fogFar: 4.5 },
    sky: { exposure: 1.0, sunDir: [-0.5, -0.5, -0.7], sunColor: [0.4, 0.38, 0.34], ambTop: [0.757, 0.774, 0.791], ambBottom: [0.568, 0.602, 0.602], fogColor: [0.7, 0.92, 0.88], fogNear: 40, fogFar: 140 }
  };

  const hop = (x) => {
    const f = x - Math.floor(x);
    return { f, h: 4 * f * (1 - f), land: f < 0.12 ? 1 - f / 0.12 : f > 0.92 ? (f - 0.92) / 0.08 : 0 };
  };

  function armsDown(who) {
    const w = who === 'kazuma' ? 0.21 : 0.19;
    return { hL: [w, -0.25, 0.03], eL: [0.25, 0, -1], hR: [-w, -0.25, 0.03], eR: [-0.25, 0, -1] };
  }

  function stand(who, o) {
    return Object.assign({ pos: [0, Cast.standY(who), 0], yaw: 0, eyes: 'open', mouth: 'smile' }, Cast.standLegs(who), armsDown(who), o || {});
  }

  function at(who, x, z, o) {
    const p = stand(who, o);
    p.pos = [x, p.pos[1] + (o && o.dy || 0), z];
    return p;
  }

  function blinkAt(t, list) {
    return list.some(b => t >= b && t < b + 0.14);
  }

  function slapCycle(t, period) {
    const f = K.frac(t / period);
    let wag;
    if (f < 0.55) wag = lerp(0.1, -0.95, ease(f / 0.55));
    else if (f < 0.66) wag = lerp(-0.95, 0.22, ease((f - 0.55) / 0.11));
    else wag = lerp(0.22, 0.1, ease((f - 0.66) / 0.34));
    const hit = f > 0.6 && f < 0.86 ? Math.sin(PI * (f - 0.6) / 0.26) : 0;
    return { wag, hit };
  }

  function tailToFace(who, pose, scale, grip) {
    const m = Cast.solve(who, pose);
    const face = V3.add(m.pts.head, M4.dir(m.head, [0, -0.01, 0.105]));
    const fwd = M4.dir(m.head, [0, 0, 1]), left = M4.dir(m.head, [1, 0, 0]);
    const out = V3.norm(V3.add(V3.add(V3.mul(fwd, C(grip.a)), V3.mul(left, S(grip.a))), [0, grip.e, 0]));
    const body = V3.add(face, V3.mul(out, grip.dist));
    const pos = V3.sub(body, [0, 0.085 * scale, 0]);
    const root = V3.add(pos, [0, 0.092 * scale, 0]);
    const d = V3.sub(face, root);
    const len = V3.len(d);
    const yaw = Math.atan2(-d[0], -d[2]);
    const pitch = Math.asin(clamp(d[1] / len, -1, 1));
    const stretch = clamp((len / scale - 0.1) / 0.31, 0.75, 1.2);
    const side = V3.norm([C(yaw), 0, -S(yaw)]);
    const p1 = V3.add(body, V3.mul(side, 0.11 * scale)), p2 = V3.sub(body, V3.mul(side, 0.11 * scale));
    const L = m.pts.shoulderL, R = m.pts.shoulderR;
    const swap = V3.len(V3.sub(p1, L)) + V3.len(V3.sub(p2, R)) > V3.len(V3.sub(p2, L)) + V3.len(V3.sub(p1, R));
    const hL = swap ? p2 : p1, hR = swap ? p1 : p2;
    const hands = {
      hLw: hL, hRw: hR,
      eLw: V3.add(V3.lerp(L, hL, 0.5), V3.add(V3.mul(left, 0.3), [0, -0.3, 0])),
      eRw: V3.add(V3.lerp(R, hR, 0.5), V3.add(V3.mul(left, -0.3), [0, -0.3, 0]))
    };
    return { pos, yaw, pitch, stretch, hands };
  }


  function walkLegs(who, phase, stride) {
    const D = Cast.DIMS[who];
    const L = (D.thigh + D.shin) * 0.985;
    const sw = (stride || 0.2);
    const s = S(phase), c = C(phase);
    return {
      fL: [0.07, D.hipY - L + Math.max(0, c) * 0.07, s * sw],
      kL: [0.03, 0, 1],
      fR: [-0.07, D.hipY - L + Math.max(0, -c) * 0.07, -s * sw],
      kR: [-0.03, 0, 1],
      hL: [0.18, -0.24, -s * 0.12],
      eL: [0.2, 0, -1],
      hR: [-0.18, -0.24, s * 0.12],
      eR: [-0.2, 0, -1]
    };
  }

  function shot0(t) {
    const walk = t * 2.1;
    const hp = hop((t - 0.55) / 1.36);
    const land = hp.land;
    return {
      env: ENVS.meadow, set: 'meadow',
      world: { grassScroll: [-t * 0.12, 0] },
      camera: { eye: [-0.05, 0.13, 2.3], at: [-0.05, 0.52, 0], fov: 30 },
      cast: [],
      chomusuke: { pos: [-0.69, 0, 0.0], yaw: -PI / 2, scale: 1.4, walk: true, phase: walk * PI, ground: 0, head: [0.08, 0, 0] },
      tadpole: {
        pos: [-0.16, hp.h * 0.13, 0.0], yaw: -PI / 2 - 0.08, pitch: (hp.f < 0.5 ? -0.12 : 0.18) * hp.h,
        scale: 1.15, squash: 1 + hp.h * 0.06 - land * 0.12, lift: 0.75 + hp.h * 0.35 - land * 0.25, wag: S(t * 6) * 0.25, ground: 0
      },
      toads: []
    };
  }

  function shot1(t) {
    const think = 1 - ease((t - 12.15) / 0.35);
    const scratch = ease((t - 12.15) / 0.35) * (1 - ease((t - 13.45) / 0.3));
    const raise = ease((t - 13.45) / 0.35);
    const scr = S(t * 18) * 0.012 * scratch;
    const wave = S((t - 13.8) * 7) * 0.03 * raise;
    const hL = [
      lerp(lerp(0.04, 0.1, scratch), 0.25, raise),
      lerp(lerp(0.2, 0.48, scratch), 0.38, raise) + scr,
      lerp(lerp(0.2, 0.0, scratch), 0.12, raise)
    ];
    hL[0] += wave;
    const eL = [lerp(0.4, 1, raise), lerp(-0.6, -1, raise), lerp(-0.2, -0.1, raise)];
    const closed = t > 12.2;
    const th = hop((t - 9.5) / 1.18);
    const hopX = 0.34 + S(t * 0.9) * 0.04;
    return {
      env: ENVS.porch, set: 'porch',
      camera: { eye: [-0.15, 0.4, 1.55], at: [-0.15, 0.42, 0], fov: 36 },
      cast: [{
        who: 'kazuma',
        pose: {
          pos: [-0.55, 0.28, -0.25], yaw: 0.08, lean: 0.2,
          sp: [0.18, 0.04, 0], nk: [lerp(0.18, 0.06, 1 - think), lerp(-0.08, 0.04, 1 - think), lerp(0.08, -0.04, 1 - think) + raise * 0.05],
          eyes: closed ? 'shut' : blinkAt(t, [10.9]) ? 'shut' : 'open', mouth: closed ? (raise > 0.5 ? 'smile' : 'pout') : 'shut', gaze: [0.2, 0.3],
          fLw: [-0.36, 0.07, 0.1], kLw: [-0.15, 1.2, 0.5], fRw: [-0.74, 0.07, 0.08], kRw: [-0.95, 1.2, 0.5],
          hL, eL, wL: [0, 0, 0],
          hRw: [-0.72, 0.42, 0.18], eRw: [-0.95, 0.6, -0.3]
        }
      }],
      chomusuke: { pos: [0.1, 0, 0.12], yaw: -0.5, scale: 0.95, ground: 0, head: [0.1, 0.25, 0] },
      tadpole: { pos: [hopX + 0.05, th.h * 0.12, 0.2], yaw: -PI / 2 + 0.25, pitch: (th.f < 0.5 ? -0.15 : 0.2) * th.h, scale: 0.62, squash: 1 - th.land * 0.12, lift: 0.7 + th.h * 0.5, ground: 0 },
      toads: []
    };
  }

  function shot2(t) {
    const th = hop((t - 14.5) / 0.95);
    return {
      env: ENVS.hall, set: 'hall',
      camera: { eye: [0.7, 1.55, 1.3], at: [-0.2, 0.45, -0.6], fov: 46 },
      cast: [{
        who: 'aqua',
        pose: at('aqua', 0.68, 0.5, { yaw: -0.95, sp: [0.12, 0.05, 0], nk: [0.32, 0.1, 0], eyes: blinkAt(t, [17.4]) ? 'shut' : 'open', mouth: 'o', gaze: [-0.6, 0.4] })
      }],
      chomusuke: { pos: [-1.3, 0, -1.4], yaw: 0.55, scale: 1.9, ground: 0, head: [-0.25, 0.1, 0.05] },
      tadpole: { pos: [-1.7, 0.02 + th.h * 0.3, -0.35], yaw: 0.75, pitch: -0.1 * th.h, scale: 1.75, squash: 1 - th.land * 0.14 + th.h * 0.05, lift: 0.35 + th.h * 0.3, ground: 0 },
      toads: []
    };
  }

  function shot3(t) {
    const tt = t - 19.52;
    const hp = hop(tt / 0.62);
    const thud = hp.land;
    const twitch = Math.exp(-K.frac(tt / 0.62) * 9);
    return {
      env: ENVS.sofa, set: 'sofa',
      camera: { eye: [0.1, 0.7, 1.25], at: [0.1, 0.45, 0.1], fov: 42 },
      cast: [{
        who: 'aqua',
        pose: {
          pos: [-0.05, 0.22, 0.25], up: [-0.5, 0.78, -0.35], fwd: [0.1, 0.1, 0.96],
          sp: [-0.1 - twitch * 0.04, 0, 0.05], nk: [0.12 - twitch * 0.08, -0.25 + twitch * 0.08, 0.32 - twitch * 0.06],
          eyes: twitch > 0.55 ? 'shut' : 'annoyed', mouth: 'grit',
          fLw: [0.6, 0.12, 0.5], kLw: [0.4, 0.9, 0.6], fRw: [0.66, 0.12, 0.35], kRw: [0.45, 0.9, 0.45],
          hRw: [0.12, 0.32 + twitch * 0.02, 0.44], eRw: [-0.2, 0.3, 0.5], hLw: [0.22, 0.24, 0.32], eLw: [0.1, 0.4, 0.1]
        }
      }],
      chomusuke: null,
      tadpole: { hold: { who: 'aqua', at: 'chest', off: [0.2, 0.17 + hp.h * 0.13, 0.06], yaw: 0.55, pitch: -0.1 + (hp.f < 0.5 ? -0.15 : 0.15) * hp.h }, scale: 0.95, squash: 1 - thud * 0.16 + hp.h * 0.06, wag: S(tt * 9) * 0.35, lift: 0.5 + hp.h * 0.5 },
      toads: []
    };
  }

  function shot4(t) {
    const sway = S((t - 24.4) * 2.2);
    return {
      env: ENVS.yard, set: 'gate',
      camera: { eye: [0.3, 0.95, 2.45], at: [0.3, 0.88, 0], fov: 38 },
      cast: [
        {
          who: 'megumin',
          pose: at('megumin', 0.2, -0.2, {
            yaw: 0.8, nk: [-0.06, 0.2, 0.05], eyes: blinkAt(t, [26.2]) ? 'shut' : 'open', mouth: 'open', gaze: [0.5, 0.1],
            hR: [-0.2, -0.26, 0.04], eR: [-0.2, 0, -1], hL: [0.18, 0.02, 0.2], eL: [0.6, -0.4, -0.2],
            holdCat: { off: [-0.22, -0.42, 0.06], yaw: 0.6, pitch: -0.15, roll: 0.2, scale: 1.1, head: [0.2, 0, 0] }
          })
        },
        {
          who: 'aqua',
          pose: at('aqua', 0.52, 0.0, {
            yaw: 1.35, lean: -0.12, sp: [-0.18, 0, 0], nk: [-0.3, 0, 0.05],
            eyes: 'shut', mouth: 'open',
            hLw: [0.9, 1.5 + sway * 0.015, 0.06], eLw: [0.72, 1.42, 0.3], hRw: [0.9, 1.47 + sway * 0.015, -0.12], eRw: [0.72, 1.42, -0.3]
          })
        }
      ],
      chomusuke: null,
      tadpole: { hold: { who: 'aqua', off: [0, 0.02, 0.07], yaw: PI * 0.5, pitch: -0.25 }, scale: 1.0, wag: sway * 0.8, lift: -0.6 + sway * 0.3 },
      toads: []
    };
  }

  function shot5(t) {
    const sl = slapCycle(t - 29.28, 1.1);
    const pose = at('megumin', 0.42, 0.08, {
      yaw: -1.15, sp: [0, 0.2, 0], nk: [-0.05 + sl.hit * 0.06, 0.45 + sl.hit * 0.22, 0.1 + sl.hit * 0.1],
      eyes: sl.hit > 0.3 ? 'shut' : 'annoyed', mouth: sl.hit > 0.3 ? 'grit' : 'flat', gaze: [-0.3, -0.1]
    });
    const g = tailToFace('megumin', pose, 1.0, { a: -0.25, e: -0.55, dist: 0.36 });
    Object.assign(pose, g.hands);
    return {
      env: ENVS.yard, set: 'mansion',
      camera: { eye: [0.0, 1.22, 1.5], at: [0.0, 1.24, 0], fov: 38 },
      cast: [
        {
          who: 'aqua',
          pose: at('aqua', -0.95, -1.15, {
            yaw: 0.15, eyes: 'half', mouth: 'flat', nk: [0.04, 0, 0.03],
            hL: [0.06, -0.06, 0.2], eL: [0.3, -0.2, -0.5], hR: [-0.06, -0.08, 0.2], eR: [-0.3, -0.2, -0.5],
            holdCat: { off: [0, -0.02, 0.16], scale: 1.05, head: [0.1, 0, 0] }
          })
        },
        { who: 'megumin', pose }
      ],
      chomusuke: null,
      tadpole: { pos: g.pos, yaw: g.yaw, pitch: g.pitch, scale: 1.0, stretch: g.stretch, wag: sl.wag, lift: 0 },
      toads: []
    };
  }

  function shot6(t) {
    const br = S((t - 34.16) * 2.2) * 0.004;
    return {
      env: ENVS.sky, set: 'sky',
      camera: { eye: [0.0, 1.38, 1.05], at: [0.0, 1.32, 0], fov: 36 },
      cast: [{
        who: 'darkness',
        pose: at('darkness', 0.18, 0, { yaw: -0.08, dy: br, nk: [0.02, 0.05, -0.02], eyes: blinkAt(t, [35.3]) ? 'shut' : 'open', mouth: 'o', gaze: [-0.15, 0] })
      }],
      chomusuke: null,
      tadpole: null,
      toads: []
    };
  }

  function shot7(t) {
    const sl = slapCycle(t - 36.83, 0.95);
    const pose = at('darkness', 0.3, 0.05, {
      yaw: -0.5, nk: [0.12 - sl.hit * 0.05, 0.15 - sl.hit * 0.18, 0.25 + sl.hit * 0.12], eyes: 'shut', mouth: 'happy', blush: true
    });
    const g = tailToFace('darkness', pose, 1.05, { a: -0.2, e: -0.5, dist: 0.4 });
    Object.assign(pose, g.hands);
    return {
      env: ENVS.yard, set: 'mansion',
      camera: { eye: [0.0, 1.25, 1.5], at: [0.0, 1.25, 0], fov: 38 },
      cast: [
        {
          who: 'aqua',
          pose: at('aqua', -1.0, -1.15, {
            yaw: 0.12, eyes: 'half', mouth: 'flat',
            hL: [0.06, -0.06, 0.2], eL: [0.3, -0.2, -0.5], hR: [-0.06, -0.08, 0.2], eR: [-0.3, -0.2, -0.5],
            holdCat: { off: [0, -0.02, 0.16], scale: 1.05, head: [0.1, 0, 0] }
          })
        },
        { who: 'megumin', pose: at('megumin', -0.58, -1.2, { yaw: 0.05, eyes: 'half', mouth: 'flat' }) },
        { who: 'darkness', pose }
      ],
      chomusuke: null,
      tadpole: { pos: g.pos, yaw: g.yaw, pitch: g.pitch, scale: 1.05, stretch: g.stretch, wag: sl.wag, lift: 0 },
      toads: []
    };
  }

  function shot8(t) {
    const tt = t - 39.04;
    const hp8 = hop(tt / 1.05);
    const xs = keys([[0, -0.3], [2.5, 0.0], [5, -0.2], [7.6, 0.05]])(tt);
    return {
      env: ENVS.bath, set: 'bath',
      camera: { eye: [0.05, 0.5, 2.3], at: [0.05, 0.72, 0], fov: 40 },
      cast: [
        {
          who: 'megumin',
          pose: {
            pos: [-0.95, 0.42, -0.55], yaw: 0.25, lean: 0.25, sp: [0.25, 0, 0], nk: [-0.1, 0, 0],
            eyes: blinkAt(tt, [3.2]) ? 'shut' : 'open', mouth: 'open',
            fLw: [-0.88, 0.07, -0.32], kLw: [-0.85, 0.65, 0.2], fRw: [-1.05, 0.07, -0.33], kRw: [-1.05, 0.65, 0.2],
            hLw: [-0.86, 0.5, -0.22], eLw: [-0.75, 0.55, -0.4], hRw: [-1.0, 0.5, -0.22], eRw: [-1.15, 0.55, -0.4]
          }
        },
        {
          who: 'aqua',
          pose: {
            pos: [-0.68, Cast.standY('aqua') - 0.08, -0.85], yaw: 0.3, lean: 0.55, sp: [0.25, 0, 0], nk: [-0.35, 0, 0],
            eyes: 'open', mouth: 'open',
            fLw: [-0.56, 0.07, -0.78], kLw: [-0.5, 0.5, 0], fRw: [-0.78, 0.07, -0.82], kRw: [-0.8, 0.5, 0],
            hLw: [-0.52, 0.6, -0.55], eLw: [-0.45, 0.9, -0.6], hRw: [-0.72, 0.6, -0.55], eRw: [-0.8, 0.9, -0.6]
          }
        },
        {
          who: 'kazuma',
          pose: {
            pos: [-0.12, 0.45, -0.62], yaw: 0.1, lean: 0.3, sp: [0.3, 0, 0], nk: [-0.2, 0, 0],
            eyes: 'open', mouth: 'open',
            fLw: [0.12, 0.07, -0.45], kLw: [0.2, 0.6, 0.2], fRw: [-0.36, 0.07, -0.45], kRw: [-0.45, 0.6, 0.2],
            hLw: [0.04, 0.32, -0.28], eLw: [0.15, 0.5, -0.3], hRw: [-0.24, 0.32, -0.28], eRw: [-0.35, 0.5, -0.3]
          }
        },
        {
          who: 'darkness',
          pose: at('darkness', 0.55, -0.85, {
            yaw: -0.25, lean: 0.12, nk: [0.25, 0.1, 0.05], eyes: 'open', mouth: 'smile', gaze: [-0.2, 0.4],
            hR: [-0.12, -0.12, 0.12], eR: [-0.4, -0.2, -0.6], hL: [0.18, -0.1, 0.05], eL: [0.5, 0, -0.4]
          })
        }
      ],
      chomusuke: { pos: [-0.5, 0.22, -0.55], yaw: 0.1, scale: 1.25, ground: 0.22, sit: 0.6 },
      tadpole: { pos: [xs, 0.02 + hp8.h * 0.24, 0.35], yaw: -0.2 + S(tt * 1.3) * 0.5, pitch: -0.15 * hp8.h, scale: 1.0, squash: 1 - hp8.land * 0.15, lift: 0.6 + hp8.h * 0.6, foam: true, foamY: 0.02 },
      toads: []
    };
  }

  function shot9(t) {
    const tt = t - 46.67;
    return {
      env: ENVS.water, set: 'water',
      camera: { eye: [0.0, 0.7, 0.9], at: [0.0, -0.2, -0.05], fov: 40 },
      cast: [],
      chomusuke: null,
      tadpole: { pos: [0.08, -0.12 + S(tt * 1.4) * 0.008, 0], yaw: -PI / 2 + 0.1, pitch: 0.05, scale: 1.25, tint: [1.4, 1.36, 1.5], wag: S(tt * 2.2) * 0.25, lift: 0.75, swim: true },
      toads: []
    };
  }

  function shot10(t) {
    const tt = t - 54.05;
    const kneel = (who, x, z, o) => Object.assign({
      pos: [x, Cast.standY(who) - 0.32, z], yaw: 0, lean: 0.35, sp: [0.12, 0, 0], nk: [-0.05, 0, 0], mouth: 'flat', gaze: [0, 0.4],
      fLw: [x + 0.1, 0.07, z + 0.15], kLw: [x + 0.1, 0.6, z + 0.7], fRw: [x - 0.1, 0.07, z + 0.15], kRw: [x - 0.1, 0.6, z + 0.7],
      hL: [0.12, -0.32, 0.25], eL: [0.4, 0, -0.5], hR: [-0.12, -0.32, 0.25], eR: [-0.4, 0, -0.5]
    }, o || {});
    return {
      env: ENVS.bath, set: 'bathLookup',
      camera: { eye: [0.12, 0.62, 0.62], at: [0.12, 1.02, -0.4], fov: 52 },
      cast: [
        { who: 'megumin', pose: kneel('megumin', -0.45, -0.42, { yaw: 0.25, roll: -0.1, nk: [-0.05, 0.1, -0.12], eyes: 'half', mouth: 'pout', holdCat: { off: [0.02, -0.12, 0.2], pitch: -0.4, scale: 1.25, head: [0.5, 0, 0] } }) },
        { who: 'aqua', pose: kneel('aqua', -0.1, -0.62, { dy: 0.12, yaw: 0.1, nk: [-0.02, 0, 0.05], eyes: blinkAt(tt, [2.6]) ? 'shut' : 'open', mouth: 'o', gaze: [0, 0.5], hL: [0.12, -0.2, 0.3], hR: [-0.12, -0.2, 0.3] }) },
        { who: 'kazuma', pose: kneel('kazuma', 0.36, -0.45, { yaw: -0.15, roll: 0.06, nk: [0.0, -0.08, 0.15], eyes: 'half', mouth: 'flat' }) },
        { who: 'darkness', pose: at('darkness', 0.78, -0.8, { yaw: -0.35, lean: 0.2, sp: [0.12, 0, 0], nk: [0.02, 0.1, 0.05], eyes: 'worry', mouth: 'pout', gaze: [0, 0.5], hR: [-0.15, -0.15, 0.15], eR: [-0.5, 0, -0.5], hL: [0.15, -0.15, 0.15], eL: [0.5, 0, -0.5] }) }
      ],
      chomusuke: null,
      tadpole: null,
      toads: []
    };
  }

  function shot11(t) {
    const tt = t - 59.06;
    const ph = tt * 2.0 * PI;
    const walker = (who, x, z, off, extra) => {
      const p = Object.assign({ pos: [x, Cast.standY(who, 0.985), z], yaw: PI / 2, eyes: 'open', mouth: 'smile' }, walkLegs(who, ph + off, 0.2), extra || {});
      p.pos[1] += Math.abs(S(ph + off)) * 0.012;
      return p;
    };
    return {
      env: ENVS.meadow, set: 'meadow',
      world: { grassScroll: [tt * 0.35, 0] },
      camera: { eye: [0.35, 0.35, 4.6], at: [0.35, 1.0, 0], fov: 34 },
      cast: [
        { who: 'darkness', pose: walker('darkness', 0.0, 0, 0) },
        { who: 'megumin', pose: walker('megumin', 0.42, 0.05, PI * 0.5, { hat: true, cloak: true }) },
        { who: 'aqua', pose: walker('aqua', 0.86, 0, PI) },
        { who: 'kazuma', pose: walker('kazuma', 1.3, 0.04, PI * 1.5) }
      ],
      chomusuke: { pos: [-0.42, 0, 0.12], yaw: PI / 2, scale: 1.0, walk: true, phase: tt * 4.2 * PI, ground: 0 },
      tadpole: (() => { const h = hop(tt / 0.8); return { pos: [-0.88, h.h * 0.08, 0.1], yaw: PI / 2, scale: 0.85, squash: 1 - h.land * 0.12, lift: 0.8 + h.h * 0.3, ground: 0 }; })(),
      toads: []
    };
  }

  function shot12(t) {
    const tt = t - 63.56;
    return {
      env: ENVS.meadow, set: 'bowl',
      world: { bowl: [-0.18, 0, 0.04] },
      camera: { eye: [0.02, 0.85, 0.8], at: [0.02, 0.02, -0.08], fov: 38 },
      cast: [],
      chomusuke: { pos: [0.34, 0, -0.12], yaw: -0.5, scale: 1.25, ground: 0, head: [-0.45, 0.15, 0] },
      tadpole: { pos: [-0.17, 0.06, 0.06], yaw: 0.75, pitch: 0.1, roll: -0.25, scale: 1.05, wag: 0.5 + S(tt * 3) * 0.15, lift: -0.3 },
      toads: []
    };
  }

  function shot13(t) {
    const tt = t - 66.36;
    const h = hop(tt / 0.62);
    return {
      env: ENVS.meadow, set: 'field',
      camera: { eye: [0.0, 2.3, 10.5], at: [0.0, 0.9, -1.5], fov: 34 },
      cast: [],
      chomusuke: null,
      tadpole: { pos: [-0.35, h.h * 0.12, -1.0], yaw: PI / 2 - 0.4, scale: 0.9, squash: 1 - h.land * 0.12, lift: 0.8, ground: 0 },
      toads: [
        { kind: 'pink', pos: [-1.75, 0, -1.4], yaw: 0.08, scale: 2.4, ground: 0 },
        { kind: 'green', pos: [1.05, 0, -1.4], yaw: -0.1, scale: 2.45, ground: 0 }
      ]
    };
  }

  function shot14(t) {
    const tt = t - 68.86;
    const w = S(tt * 6.0);
    const w2 = S(tt * 5.2 + 1);
    return {
      env: ENVS.sky, set: 'sky',
      camera: { eye: [0.05, 0.85, 1.95], at: [0.05, 1.3, 0], fov: 42 },
      cast: [
        { who: 'darkness', pose: at('darkness', -0.62, 0.0, { yaw: 0.22, eyes: 'open', mouth: 'open', nk: [-0.1, 0.1, 0.05], hR: [-0.32, -0.02 + w2 * 0.02, 0.18], eR: [-0.5, -0.3, 0.2], wR: [0, 0, 0.3 + w2 * 0.25] }) },
        { who: 'kazuma', pose: at('kazuma', -0.22, -0.05, { yaw: 0.05, eyes: 'open', mouth: 'happy', nk: [-0.15, 0, 0], hR: [-0.3 + w * 0.06, 0.62, 0.0], eR: [-0.5, 0.1, -0.2], wR: [0, 0, w * 0.3] }) },
        { who: 'megumin', pose: at('megumin', 0.18, 0.05, { yaw: -0.05, eyes: 'open', mouth: 'smile', hat: true, cloak: true, nk: [-0.08, 0, 0], hL: [0.06, -0.06, 0.17], eL: [0.4, -0.3, -0.4], hR: [-0.05, -0.08, 0.17], eR: [-0.4, -0.3, -0.4], holdCat: { off: [0, -0.03, 0.14], scale: 1.0, head: [0.1, 0, 0] } }) },
        { who: 'aqua', pose: at('aqua', 0.6, 0.0, { yaw: -0.18, eyes: 'open', mouth: 'happy', nk: [-0.12, -0.05, 0], hR: [-0.32 + w2 * 0.05, 0.6, 0.02], eR: [-0.5, 0.1, -0.2], wR: [0, 0, w2 * 0.3] }) }
      ],
      chomusuke: null,
      tadpole: null,
      toads: []
    };
  }

  function shot15(t) {
    const tt = t - 72.03;
    const talk = VOICE(t) > 0.35 && tt < 4.6;
    const point = ease((tt - 0.6) / 0.4) * (1 - ease((tt - 2.2) / 0.4));
    const turn = ease((tt - 4.1) / 0.5);
    return {
      env: ENVS.sky, set: 'sky',
      camera: { eye: [0.08, 1.38, 1.15], at: [0.08, 1.3, 0], fov: 36 },
      cast: [
        { who: 'darkness', pose: at('darkness', -0.68, -0.05, { yaw: 0.2, eyes: 'open', mouth: 'smile' }) },
        {
          who: 'kazuma',
          pose: at('kazuma', -0.12, 0, {
            yaw: 0.1 - turn * 0.15, nk: [-0.05 + turn * 0.05, -turn * 0.35, -turn * 0.1], eyes: turn > 0.3 ? 'shut' : 'open', mouth: turn > 0.3 ? 'happy' : (talk || (tt > 0.4 && tt < 2.0) ? 'happy' : 'smile'),
            hL: [lerp(0.19, 0.12, point), lerp(-0.25, 0.12, point), lerp(0.03, 0.2, point)], eL: [0.4, -0.4, -0.6]
          })
        },
        {
          who: 'megumin',
          pose: at('megumin', 0.3, 0.02, {
            yaw: -0.08 + turn * 0.1, nk: [0.04, turn * 0.45, 0.04], eyes: blinkAt(tt, [1.6, 4.1]) ? 'shut' : 'open', mouth: 'smile', hat: true, cloak: true, gaze: [lerp(-0.2, -0.8, turn), 0],
            hL: [0.06, -0.06, 0.17], eL: [0.4, -0.3, -0.4], hR: [-0.05, -0.08, 0.17], eR: [-0.4, -0.3, -0.4],
            holdCat: { off: [0, -0.03, 0.14], scale: 1.0, head: [0.1, 0, 0] }
          })
        },
        { who: 'aqua', pose: at('aqua', 0.78, -0.05, { yaw: -0.25, eyes: 'open', mouth: 'happy', hR: [-0.25, 0.58, 0.05], eR: [-0.6, 0.3, -0.1] }) }
      ],
      chomusuke: null,
      tadpole: null,
      toads: []
    };
  }

  function shot16(t) {
    const shake = K.wobble(t * 3, 0.004, 19);
    return {
      env: ENVS.sky, set: 'sky',
      camera: { eye: [-0.07 + shake[0], 1.36 + shake[1], 0.42], at: [-0.15, 1.34, 0], up: [-0.12, 0.99, 0], fov: 32 },
      cast: [{ who: 'aqua', pose: at('aqua', 0.0, 0, { yaw: -0.35, nk: [0.05, -0.1, 0.12], eyes: 'terror', mouth: 'scream' }) }],
      chomusuke: null,
      tadpole: null,
      toads: []
    };
  }

  function shot17(t) {
    const tt = t - 83.54;
    const run = tt * 2.6 * PI;
    const runner = (who, x, z, off, extra) => Object.assign({ pos: [x + tt * 0.6, Cast.standY(who, 0.97) + Math.abs(S(run + off)) * 0.04, z - tt * 0.3], yaw: 2.2, lean: 0.25, eyes: 'shock', mouth: 'open' }, walkLegs(who, run + off, 0.34), extra || {});
    const flail = S(tt * 9) * 0.1;
    const sway = S(tt * 3) * 0.03;
    const aquaAt = [1.55 + sway, 2.05, -0.7];
    return {
      env: ENVS.meadow, set: 'field',
      camera: { eye: [-0.2, 0.8, 3.4], at: [0.0, 0.8, -0.5], up: [0.3, 0.95, 0], fov: 50 },
      cast: [
        {
          who: 'aqua',
          pose: {
            pos: aquaAt, up: [0.1, -0.99, 0.05], fwd: [-0.2, 0, 1], eyes: 'terror', mouth: 'scream',
            hL: [0.3, 0.15 + flail, 0.1], eL: [0.5, 0, 0], hR: [-0.3, 0.15 - flail, 0.1], eR: [-0.5, 0, 0],
            fL: [0.1, -0.72, 0.1 + flail], kL: [0, 0, 1], fR: [-0.1, -0.7, 0.2 - flail], kR: [0, 0, 1]
          }
        },
        { who: 'darkness', pose: runner('darkness', 4.6, -4.4, 0) },
        { who: 'megumin', pose: runner('megumin', 5.3, -4.8, 1.2, { hat: true, cloak: true }) },
        { who: 'kazuma', pose: runner('kazuma', 6.0, -5.2, 2.4) }
      ],
      chomusuke: null,
      tadpole: { pos: [1.05, 0, 1.45], yaw: PI * 0.72, scale: 1.2, lift: 1.1, wag: S(tt * 4) * 0.4, ground: 0 },
      toads: [
        { kind: 'green', pos: [-1.75, 1.35, -0.65], yaw: PI / 2 - 0.1, pitch: 1.05, roll: 0.15, scale: 1.3, arms: [[0.35, 0.5, 0.65], [-0.3, 0.6, 0.7]], legs: [[[0.55, -0.1, -0.7], [0.75, -0.45, -1.35]], [[-0.45, 0.0, -0.75], [-0.55, -0.4, -1.4]]], tongueAt: { who: 'aqua', off: [0, -0.3, 0] }, tongueBow: [0, 0.35, 0] },
        { kind: 'pink', pos: [-0.25, 0, 1.55], yaw: PI + 0.6, pitch: -0.3, scale: 1.0, armsW: [[aquaAt[0] - 0.25, 1.45, -0.3], [0.45, 0.6, 1.1]], ground: 0 }
      ]
    };
  }

  const SHOTS = [shot0, shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot8, shot9, shot10, shot11, shot12, shot13, shot14, shot15, shot16, shot17];

  function shotIndexAt(t) {
    let idx = 0;
    for (let i = 1; i < CUTS.length; i++) if (t >= CUTS[i]) idx = i;
    return idx;
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, DURATION);
    const shot = shotIndexAt(t);
    const fade = t < 1.0 ? lerp(0.0, 1, ease(t / 1.0)) : t > 89.3 ? lerp(1, 0.0, ease((t - 89.3) / 0.84)) : 1;
    const st = SHOTS[shot](t);
    return Object.assign({ t, shot, fade }, st);
  }

  window.KonosubaScript = { DURATION, CUTS, VOICE, stage };
})();
