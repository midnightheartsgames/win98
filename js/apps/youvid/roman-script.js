(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'wAk3UpR0mAn';
  const DURATION = 14.58;
  const CUTS = [0, 2.13, 2.83, 4.33, 5.77, 7.53, 10.95, 14.25];

  const VOICE = K.envelope('00000002500001b996400001851000022060066400005643200000000000000005ioopllkgcfmonlheddd866310332658eb67110000765412000079888cb876b612000000067976200000000000000051000101100500000000000000000008aa5100000chggd98531000000000yYWWXTUJbf00000007vLQVRGsOLJc00002xLLI0ath1gy60000NTQLMMFue00RVYVTMCCCra', 20);

  const ENV_BED = {
    exposure: 1.04,
    sunDir: [-0.55, -0.48, -0.68],
    sunColor: [0.58, 0.52, 0.48],
    ambTop: [0.98, 0.94, 0.92],
    ambBottom: [0.68, 0.62, 0.58],
    fogColor: [0.88, 0.82, 0.78],
    fogNear: 12,
    fogFar: 36,
    points: [
      { pos: [1.1, 1.5, 0.25], color: [0.35, 0.34, 0.32] }
    ]
  };

  const ENV_DEPOT = {
    exposure: 1.1,
    sunDir: [0.35, -0.78, -0.52],
    sunColor: [0.5, 0.48, 0.36],
    ambTop: [0.8, 0.78, 0.62],
    ambBottom: [0.46, 0.44, 0.34],
    fogColor: [0.16, 0.16, 0.12],
    fogNear: 6,
    fogFar: 22,
    points: [
      { pos: [0.1, 2.1, 0.2], color: [0.38, 0.34, 0.24] }
    ]
  };

  const STAND_LEGS = {
    fL: [0.1, -0.68, 0.02],
    kL: [0.12, -0.32, 0.18],
    fR: [-0.1, -0.68, 0.02],
    kR: [-0.12, -0.32, 0.18]
  };

  const SIT_LEGS = {
    fL: [0.18, -0.46, 0.32],
    kL: [0.2, -0.05, 0.45],
    fR: [-0.18, -0.46, 0.32],
    kR: [-0.2, -0.05, 0.45]
  };

  const NIKO_LEGS = {
    fL: [0.15, -0.82, 0.04],
    kL: [0.16, -0.35, 0.22],
    fR: [-0.15, -0.82, -0.04],
    kR: [-0.16, -0.35, 0.18]
  };

  function shotIndexAt(t) {
    let idx = 0;
    for (let i = 1; i < CUTS.length; i++) {
      if (t >= CUTS[i]) idx = i;
    }
    return idx;
  }

  function blinkAt(t, lid0, lid1) {
    return [clamp(lid0, 0, 1), clamp(lid1, 0, 1)];
  }

  function stageBedroom(t, shot, v) {
    if (shot === 0) {
      const openK = t < 0.35 ? 0 : t < 0.72 ? ease((t - 0.35) / 0.37) * 0.55 : t < 1.38 ? lerp(0.55, 0.68, ease((t - 0.72) / 0.66)) : lerp(0.68, 0, ease((t - 1.38) / 0.52));
      const pan = ease(clamp((t - 0.3) / 1.65, 0, 1));
      const reach = ease(clamp((t - 0.55) / 1.15, 0, 1));
      const grab = t >= 1.48;
      const pull = ease(clamp((t - 1.52) / 0.48, 0, 1));
      const hx = lerp(0.18, 0.58, reach) - pull * 0.16;
      const hy = lerp(0.66, 0.74, S(reach * PI)) - pull * 0.04;
      const hz = lerp(0.32, 0.18, reach) + pull * 0.12;
      return {
        t,
        shot,
        set: 'bedroom',
        env: ENV_BED,
        blur: 0.92,
        fade: openK > 0.02 ? 1 : 0,
        eyelids: blinkAt(t, 1 - openK, 1 - openK),
        phoneOnDesk: !grab,
        pov: {
          kind: 'reach',
          pos: [hx, hy, hz],
          yaw: lerp(-0.18, -0.42, reach),
          pitch: lerp(-1.15, -1.42, reach),
          roll: 0.15,
          hasPhone: grab
        },
        camera: {
          eye: [-0.18 + pan * 0.14, 0.86 + pan * 0.02, 0.44 - pan * 0.04],
          at: [lerp(0.15, 0.62, pan), lerp(0.84, 0.74, pan), lerp(-0.35, 0.16, pan)],
          up: [S(0.08 * (1 - pan)), C(0.08 * (1 - pan)), 0],
          fov: 46
        },
        cast: []
      };
    }

    if (shot === 1) {
      const u = clamp((t - 2.13) / 0.7, 0, 1);
      const openK = t < 2.38 ? ease((t - 2.13) / 0.25) : 1;
      const tap = t > 2.28 && t < 2.58 ? S(((t - 2.28) / 0.3) * PI) : 0;
      const lit = t >= 2.42;
      const lookUp = ease(clamp((t - 2.52) / 0.31, 0, 1));
      const camera = {
        eye: [-0.08, 0.92 + lookUp * 0.06, 0.38],
        at: [lerp(0.28, 0.02, lookUp), lerp(0.82, 1.12, lookUp), lerp(0.06, -0.22, lookUp)],
        up: [0, 1, 0],
        fov: 44
      };
      const tohruPose = Object.assign({
        pos: [0.02, 0.88, -0.24],
        yaw: 0.04,
        lean: 0.06,
        roll: 0,
        sp: [0.05, 0, 0],
        nk: [0.04, 0, 0],
        hL: [0.08, 0.06, 0.18],
        hR: [-0.08, 0.06, 0.18],
        eL: [0.24, -0.06, 0.06],
        eR: [-0.24, -0.06, 0.06],
        gL: 'clasp',
        gR: 'clasp',
        eyes: 'open',
        mouth: 'smile'
      }, STAND_LEGS);
      return {
        t,
        shot,
        set: 'bedroom',
        env: ENV_BED,
        blur: 0.85,
        fade: 1,
        eyelids: blinkAt(t, 1 - openK, 1 - openK),
        phoneOnDesk: false,
        pov: {
          kind: 'holdPhone',
          off: [lerp(0.04, 0.09, lookUp), lerp(-0.02, -0.14, lookUp), 0.34],
          rz: 0.24,
          ry: -0.2,
          rx: 0.12,
          scale: 1.55,
          lit,
          tap
        },
        camera,
        cast: [{ who: 'tohru', pose: tohruPose }]
      };
    }

    if (shot === 2) {
      const u = clamp((t - 2.83) / 1.5, 0, 1);
      const lift = ease(clamp((t - 3.05) / 1.15, 0, 1));
      const sway = S(t * 2.4) * 0.025;
      const hy = lerp(0.05, 0.22, lift);
      const hz = lerp(0.18, 0.32, lift);
      const tohruPose = Object.assign({
        pos: [0.0, 0.88, -0.22],
        yaw: sway * 0.6,
        lean: lerp(0.04, 0.1, lift),
        roll: sway,
        sp: [0.06 + lift * 0.04, 0, sway * 0.5],
        nk: [0.04, 0, -sway * 0.8],
        hL: [0.065, hy, hz],
        hR: [-0.065, hy, hz],
        eL: [0.22, -0.04, 0.08],
        eR: [-0.22, -0.04, 0.08],
        gL: 'glasses',
        gR: 'glasses',
        eyes: t > 3.65 && t < 3.82 ? 'happy' : 'open',
        mouth: v > 0.32 ? 'smileOpen' : 'smile',
        glasses: {
          pos: [0.0, lerp(1.06, 1.16, lift), lerp(-0.02, 0.16, lift)],
          yaw: 0,
          pitch: lerp(0.18, 0.04, lift),
          roll: sway * 0.4,
          scale: 1.15
        }
      }, STAND_LEGS);
      return {
        t,
        shot,
        set: 'bedroom',
        env: ENV_BED,
        blur: lerp(0.82, 0.58, u),
        fade: 1,
        eyelids: [0, 0],
        phoneOnDesk: false,
        camera: {
          eye: [0.0, 1.16, 0.36 - u * 0.03],
          at: [0.0, 1.15, -0.22],
          up: [0, 1, 0],
          fov: 40
        },
        cast: [{ who: 'tohru', pose: tohruPose }]
      };
    }

    if (shot === 3) {
      const u = clamp((t - 4.33) / 1.44, 0, 1);
      const putOn = ease(clamp((t - 4.55) / 1.12, 0, 1));
      const blink = t > 5.56 ? ease((t - 5.56) / 0.2) : 0;
      const tohruPose = Object.assign({
        pos: [0.0, 0.88, -0.22],
        yaw: 0,
        lean: 0.12 + putOn * 0.06,
        roll: 0,
        sp: [0.08 + putOn * 0.04, 0, 0],
        nk: [-0.04, 0, 0],
        hL: [lerp(0.068, 0.082, putOn), lerp(0.22, 0.26, putOn), lerp(0.32, 0.52, putOn)],
        hR: [lerp(-0.068, -0.082, putOn), lerp(0.22, 0.26, putOn), lerp(0.32, 0.52, putOn)],
        eL: [0.24, 0.02, 0.16],
        eR: [-0.24, 0.02, 0.16],
        gL: 'glasses',
        gR: 'glasses',
        eyes: 'open',
        mouth: 'smile',
        glasses: {
          pos: [0.0, lerp(1.14, 1.155, putOn), lerp(0.14, 0.315, putOn)],
          yaw: 0,
          pitch: lerp(0.05, 0.0, putOn),
          roll: 0,
          scale: lerp(1.18, 1.45, putOn)
        }
      }, STAND_LEGS);
      return {
        t,
        shot,
        set: 'bedroom',
        env: ENV_BED,
        blur: lerp(0.62, 0.18, putOn),
        fade: 1,
        eyelids: [blink * 0.95, blink * 0.95],
        phoneOnDesk: false,
        camera: {
          eye: [0.0, 1.155, 0.36],
          at: [0.0, 1.06, -0.22],
          up: [0, 1, 0],
          fov: 42
        },
        cast: [{ who: 'tohru', pose: tohruPose }]
      };
    }

    if (shot === 4) {
      const u = clamp((t - 5.77) / 1.76, 0, 1);
      const openIn = t < 6.08 ? ease((t - 5.77) / 0.31) : 1;
      const closeOut = t > 7.36 ? ease((t - 7.36) / 0.17) : 0;
      const lid = Math.max(1 - openIn, closeOut);
      const zoom = ease(clamp((t - 6.1) / 1.35, 0, 1));
      const tilt = S((t - 5.77) * 2.2) * 0.04;
      const tohruPose = Object.assign({
        pos: [0.0, 0.88, -0.22],
        yaw: 0,
        lean: lerp(0.14, 0.06, u),
        roll: 0,
        sp: [0.06, 0, tilt * 0.5],
        nk: [0.02, 0, tilt],
        hL: [lerp(0.08, 0.055, u), lerp(0.22, 0.1, u), lerp(0.42, 0.18, u)],
        hR: [lerp(-0.08, -0.055, u), lerp(0.22, 0.1, u), lerp(0.42, 0.18, u)],
        eL: [0.22, -0.04, 0.08],
        eR: [-0.22, -0.04, 0.08],
        gL: 'clasp',
        gR: 'clasp',
        eyes: t > 6.85 ? 'wide' : 'open',
        mouth: v > 0.25 ? 'smileOpen' : 'smile'
      }, STAND_LEGS);
      return {
        t,
        shot,
        set: 'bedroom',
        env: ENV_BED,
        blur: 0,
        fade: t >= 7.51 ? 0 : 1,
        eyelids: [lid, lid],
        phoneOnDesk: false,
        camera: {
          eye: [0.0, lerp(1.16, 1.24, zoom), lerp(0.35, 0.22, zoom)],
          at: [0.0, lerp(1.16, 1.24, zoom), -0.22],
          up: [0, 1, 0],
          fov: lerp(40, 32, zoom)
        },
        cast: [{ who: 'tohru', pose: tohruPose }]
      };
    }

    const u = clamp((t - 7.53) / 3.42, 0, 1);
    const openIn = t < 7.72 ? ease((t - 7.53) / 0.19) : 1;
    const lookPhone = ease(clamp((t - 9.35) / 0.68, 0, 1));
    const smileHappy = t > 8.15 && t < 9.15;
    const sway = S(t * 2.1) * 0.03;
    const tohruPose = Object.assign({
      pos: [0.0, 0.88, -0.22],
      yaw: sway * 0.5,
      lean: 0.05,
      roll: sway * 0.6,
      sp: [0.05, 0, sway * 0.5],
      nk: [0.03, 0, -sway],
      hL: [0.048, 0.12, 0.18],
      hR: [-0.048, 0.12, 0.18],
      eL: [0.22, -0.04, 0.08],
      eR: [-0.22, -0.04, 0.08],
      gL: 'clasp',
      gR: 'clasp',
      eyes: smileHappy ? 'happy' : 'open',
      mouth: smileHappy || v > 0.22 ? 'smileOpen' : 'smile'
    }, STAND_LEGS);

    const camera = {
      eye: [lerp(0.0, 0.06, lookPhone), lerp(1.16, 1.02, lookPhone), lerp(0.36, 0.4, lookPhone)],
      at: [lerp(0.0, 0.24, lookPhone), lerp(1.15, 0.84, lookPhone), lerp(-0.22, 0.08, lookPhone)],
      up: [0, 1, 0],
      fov: lerp(40, 38, lookPhone)
    };

    return {
      t,
      shot,
      set: 'bedroom',
      env: ENV_BED,
      blur: 0,
      fade: 1,
      eyelids: [1 - openIn, 1 - openIn],
      phoneOnDesk: false,
      pov: lookPhone > 0.05 ? {
        kind: 'holdPhone',
        off: [lerp(0.11, 0.025, lookPhone), lerp(-0.16, -0.01, lookPhone), lerp(0.36, 0.29, lookPhone)],
        rz: lerp(0.32, 0.24, lookPhone),
        ry: lerp(-0.22, -0.14, lookPhone),
        rx: 0.1,
        scale: 1.68,
        lit: true,
        tap: 0
      } : null,
      camera,
      cast: [{ who: 'tohru', pose: tohruPose }]
    };
  }

  function romanDepotPose(dt, v) {
    const wake = ease(clamp((dt - 0.85) / 0.55, 0, 1));
    const talk = clamp((dt - 1.6) / 0.5, 0, 1);
    const sway = talk > 0 ? S(dt * 3.1) * 0.05 : 0;
    const gesture = talk * (0.5 + 0.5 * S(dt * 5.2));
    const mouth = dt > 1.72 && v > 0.22 ? (v > 0.55 ? 'wide' : 'open') : 'shut';
    return Object.assign({
      pos: [0.1, 0.5, -0.12],
      yaw: lerp(-0.1, -0.34, wake) + sway,
      lean: 0,
      roll: sway * 0.5,
      sp: [lerp(0.62, 0.06, wake), lerp(0, -0.1, wake), sway],
      nk: [lerp(0.72, 0.02, wake), lerp(0, -0.16, wake), sway * 0.6],
      hLw: [lerp(0.2, 0.3, wake), lerp(0.77, 0.79 + gesture * 0.12, wake), lerp(0.3, 0.24, wake)],
      hRw: [lerp(-0.1, -0.04, wake), lerp(0.77, 0.78 + gesture * 0.1, wake), lerp(0.3, 0.2, wake)],
      eL: [0.45, -0.1, 0.0],
      eR: [-0.45, -0.1, 0.0],
      gL: wake > 0.5 ? 'open' : 'relax',
      gR: wake > 0.5 ? 'open' : 'relax',
      eyes: dt < 0.9 ? 'shut' : dt < 1.5 ? 'wide' : 'open',
      mouth
    }, SIT_LEGS);
  }

  function nikoDepotPose(dt, v) {
    const reach = ease(clamp((dt - 0.9) / 0.5, 0, 1)) * (1 - ease(clamp((dt - 2.3) / 0.5, 0, 1)));
    const mouth = dt < 1.72 && v > 0.2 ? (v > 0.52 ? 'wide' : 'open') : 'shut';
    return Object.assign({
      pos: [-0.55, 0.5, 0.05],
      yaw: 1.3,
      lean: 0,
      roll: 0,
      sp: [0.5, -0.15, 0],
      nk: [-0.1, 0.1, 0],
      hL: [0.26, -0.18, 0.12],
      hRw: [lerp(-0.45, -0.22, reach), lerp(0.5, 0.68, reach), lerp(0.2, 0.3, reach)],
      eL: [0.42, -0.1, -0.08],
      eR: [-0.42, -0.1, 0.1],
      gL: 'relax',
      gR: reach > 0.3 ? 'open' : 'relax',
      eyes: 'open',
      mouth
    }, NIKO_LEGS);
  }

  function stageDepot(t, shot, v) {
    if (shot === 6) {
      const dt = t - 10.95;
      return {
        t,
        shot,
        set: 'depot',
        env: ENV_DEPOT,
        blur: 0,
        fade: 1,
        eyelids: [0, 0],
        subtitle: 'sub1',
        camera: {
          eye: [-0.1 + dt * 0.006, 0.92, 0.66 - dt * 0.01],
          at: [-0.06 + dt * 0.004, 0.86, 0],
          up: [0, 1, 0],
          fov: 42
        },
        cast: [
          { who: 'roman', pose: romanDepotPose(dt, v) },
          { who: 'niko', pose: nikoDepotPose(dt, v) }
        ]
      };
    }

    const dt = t - 14.25;
    const nikoPose = Object.assign({
      pos: [-1.0, 0.6, 0.18],
      yaw: 0.92,
      lean: 0,
      roll: 0,
      sp: [0.04, 0, 0],
      nk: [0.1, 0.1 + dt * 0.2, 0],
      hL: [0.22, -0.18, 0.08],
      hR: [-0.22, -0.18, 0.08],
      eL: [0.42, -0.1, -0.08],
      eR: [-0.42, -0.1, -0.08],
      gL: 'relax',
      gR: 'relax',
      eyes: 'open',
      mouth: v > 0.25 ? 'open' : 'shut'
    }, NIKO_LEGS);

    return {
      t,
      shot,
      set: 'depot',
      env: ENV_DEPOT,
      blur: 0,
      fade: 1,
      eyelids: [0, 0],
      subtitle: 'sub1',
      camera: {
        eye: [-0.3, 1.05, 0.21],
        at: [-1.0, 1.0, -0.06],
        up: [0, 1, 0],
        fov: 46
      },
      cast: [
        { who: 'niko', pose: nikoPose }
      ]
    };
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, DURATION);
    const shot = shotIndexAt(t);
    const v = VOICE(t);
    if (shot <= 5) return stageBedroom(t, shot, v);
    return stageDepot(t, shot, v);
  }

  window.RomanScript = { ID, DURATION, CUTS, VOICE, stage, shotIndexAt };
})();
