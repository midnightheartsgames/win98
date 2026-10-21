(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const DURATION = 15.79;
  const CUTS = [0, 2.03, 6.23, 8.03, 8.9, 13.4];
  const VOICE = K.envelope('016QNsUHBRpLBuRwvpHKqqowrnpsBxspGCuvqmkjdsEx5pPSUIzmnswtssvung93101jCC5pzDBBEylmovvtzFwjc611111M525LZZJl713HCinA9Zv1oDjEZZZGozLqFKmOAyHwXDnqsSpplAroosFtoqFGrtqnlkEKsktwxwqIekr5NL2mMA8yKTFh6dBHlcAHusCvkntwyrrwwslla411005sG6rFNzloFunn6smuRmkMjuFvc5ntApb3111nEr2rMSKLFxBynfytlkmlljjjiUZHoigfggVZTkmw00000000000000000000', 20);

  const SPEECH = [
    { t0: 0.05, t1: 1.92, text: 'Да-да-да-да-дан-дан-дан-дан-дан~' },
    { t0: 2.45, t1: 3.35, text: 'Yo phone linging!' },
    { t0: 3.63, t1: 4.75, text: 'Yo phone linging!' },
    { t0: 4.82, t1: 6.2, text: 'Big boy, come pick up yo phone!' },
    { t0: 6.25, t1: 7.95, text: 'Да-да-да-да-дан-дан-дан-дан-дан~' },
    { t0: 8.05, t1: 8.88, text: 'Why you not pick up yo phone~' },
    { t0: 9.28, t1: 10.8, text: 'Yo phone linging~' },
    { t0: 10.85, t1: 12.42, text: 'Yo phone going to go to voicemail~' },
    { t0: 12.5, t1: 13.38, text: 'Goodbye~!' }
  ];

  const ENV = {
    exposure: 1.06,
    sunDir: [-0.38, -0.74, -0.55],
    sunColor: [0.76, 0.68, 0.56],
    ambTop: [0.96, 0.98, 1.04],
    ambBottom: [0.68, 0.64, 0.6],
    fogColor: [0.88, 0.84, 0.76],
    fogNear: 40,
    fogFar: 160
  };

  function interpolable(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return true;
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(v => typeof v === 'number');
  }

  function compile(keys) {
    const fields = {};
    keys.forEach(([t, o]) => Object.keys(o).forEach(k => { (fields[k] = fields[k] || []).push([t, o[k]]); }));
    return (t) => {
      const out = {};
      Object.keys(fields).forEach(k => {
        const list = fields[k];
        let i = 0;
        while (i + 1 < list.length && list[i + 1][0] <= t) i++;
        const [t0, v0] = list[i];
        const nx = list[i + 1];
        if (t <= t0 || !nx || !interpolable(v0, nx[1]) || CUTS.some(c => c > t0 && c <= nx[0])) {
          out[k] = v0;
          return;
        }
        const e = ease((t - t0) / (nx[0] - t0));
        out[k] = Array.isArray(v0) ? v0.map((v, j) => lerp(v, nx[1][j], e)) : lerp(v0, nx[1], e);
      });
      return out;
    };
  }

  const CROSS_LEGS = {
    fL: [-0.06, -0.1, 0.2],
    kL: [0.32, -0.05, 0.16],
    fR: [0.06, -0.1, 0.2],
    kR: [-0.32, -0.05, 0.16]
  };

  const STAND_LEGS = {
    fL: [0.1, -0.68, 0.02],
    kL: [0.12, -0.32, 0.18],
    fR: [-0.1, -0.68, 0.02],
    kR: [-0.12, -0.32, 0.18]
  };

  const SALUTE_ARMS = {
    hR: [-0.022, 0.15, 0.17],
    hL: [0.022, 0.16, 0.18],
    eR: [-0.26, 0.02, 0.08],
    eL: [0.26, 0.02, 0.08],
    wR: [0, 0, 0],
    wL: [0, 0, 0],
    gR: 'relax',
    gL: 'wave'
  };

  const HIP_ARMS = {
    hR: [-0.145, -0.05, 0.07],
    hL: [0.145, -0.05, 0.07],
    eR: [-0.32, 0.04, -0.06],
    eL: [0.32, 0.04, -0.06],
    wR: [0, 0, 0],
    wL: [0, 0, 0],
    gR: 'relax',
    gL: 'relax'
  };

  const DIALYN = compile([
    [0.0, Object.assign({
      pos: [0, 0.9, 0], yaw: -2.25, lean: 0, roll: 0,
      sp: [0.04, 0, 0], nk: [-0.06, 0, 0],
      eyes: 'shut', mouth: 'smile', phoneMode: 'none', dropY: 0, chakram: true
    }, CROSS_LEGS, SALUTE_ARMS)],
    [1.98, { yaw: 0.0, nk: [-0.02, 0, 0], eyes: 'shut' }],

    [2.03, Object.assign({
      pos: [0, 0.9, 0], yaw: 0, lean: 0, roll: 0,
      sp: [0.02, 0, 0], nk: [0.02, 0, 0],
      eyes: 'shut', mouth: 'smile', phoneMode: 'none', chakram: false
    }, STAND_LEGS, HIP_ARMS)],
    [2.13, Object.assign({ sp: [0.02, 0, 0], nk: [0.02, 0, 0], eyes: 'shut' }, HIP_ARMS)],
    [2.32, {
      sp: [-0.22, 0, 0], nk: [-0.42, 0, 0],
      hR: [-0.12, 0.24, 0.14], eR: [-0.32, 0.1, 0.04],
      hL: [0.15, -0.02, 0.08], eyes: 'shut', mouth: 'shut'
    }],
    [2.46, {
      sp: [0.03, 0, 0.03], nk: [0.04, -0.04, 0.04],
      hR: [-0.115, 0.31, 0.15], eR: [-0.34, 0.16, 0.06],
      hL: [0.23, 0.2, 0.14], eL: [0.34, 0.02, 0.06],
      gR: 'relax', gL: 'wave',
      phoneMode: 'cord', eyes: 'wide', mouth: 'o'
    }],
    [2.68, {
      hL: [0.18, 0.06, 0.14], gL: 'relax',
      eyes: 'open', mouth: 'smile'
    }],
    [2.82, {
      sp: [0.02, 0, -0.02], nk: [-0.04, 0.05, -0.04],
      hR: [-0.115, 0.31, 0.15], eR: [-0.34, 0.16, 0.06],
      hL: [0.06, 0.12, 0.17], eL: [0.28, 0.08, 0.08],
      wL: [0, 0, 1.35], gL: 'pointSide',
      phoneMode: 'cord', eyes: 'open', mouth: 'smile'
    }],
    [3.32, {
      hR: [-0.115, 0.31, 0.15],
      hL: [0.05, 0.12, 0.17], wL: [0, 0, 1.35], gL: 'pointSide',
      phoneMode: 'cord', eyes: 'open', mouth: 'smile'
    }],
    [3.5, {
      sp: [0.0, 0, -0.05], nk: [-0.08, 0.08, -0.08],
      hR: [-0.16, 0.02, 0.1], eR: [-0.32, -0.04, 0.02],
      hL: [0.15, 0.24, 0.13], wL: [-0.12, -0.3, 0.55], gL: 'relax',
      phoneMode: 'ear', eyes: 'shut', mouth: 'smile'
    }],
    [3.65, {
      sp: [0.02, 0, 0.03], nk: [0.04, -0.04, 0.05],
      hR: [-0.145, -0.05, 0.07], eR: [-0.32, 0.04, -0.06],
      hL: [0.155, 0.26, 0.125], eL: [0.3, 0.04, 0.08], wL: [-0.12, -0.3, 0.55],
      gR: 'relax', gL: 'relax',
      phoneMode: 'ear', eyes: 'wide', mouth: 'o'
    }],
    [4.12, {
      nk: [-0.06, 0.04, -0.06],
      eyes: 'shut', mouth: 'smile'
    }],
    [4.28, {
      nk: [0.02, -0.03, 0.04],
      hR: [-0.145, -0.05, 0.07], gR: 'relax',
      eyes: 'open', mouth: 'open'
    }],
    [4.62, {
      nk: [-0.04, 0.04, -0.06],
      hR: [-0.15, 0.28, 0.14], eR: [-0.28, 0.02, 0.08],
      wR: [0, 0, 0], gR: 'peace',
      eyes: 'squint', mouth: 'smile'
    }],
    [4.82, {
      sp: [0.03, 0, 0.02], nk: [0.02, 0, 0.02],
      hR: [-0.035, 0.14, 0.26], eR: [-0.2, -0.02, 0.08],
      wR: [0, 0, 0], gR: 'pointFwd',
      hL: [0.155, 0.26, 0.125],
      phoneMode: 'ear', eyes: 'open', mouth: 'open'
    }],
    [5.35, {
      nk: [-0.08, 0, 0],
      hR: [-0.03, 0.12, 0.25], gR: 'pointFwd',
      eyes: 'shut', mouth: 'smile'
    }],
    [5.55, {
      nk: [0.03, 0, 0.03],
      hR: [-0.035, 0.15, 0.28], gR: 'pointFwd',
      eyes: 'open', mouth: 'o'
    }],
    [6.18, {
      nk: [0.02, 0, 0.02],
      hR: [-0.035, 0.14, 0.27], gR: 'pointFwd',
      phoneMode: 'ear', eyes: 'open', mouth: 'o'
    }],

    [6.23, Object.assign({
      pos: [0, 0.9, 0], yaw: 2.25, lean: 0, roll: 0,
      sp: [0.04, 0, 0], nk: [-0.06, 0, 0],
      eyes: 'shut', mouth: 'smile', phoneMode: 'none', chakram: true
    }, CROSS_LEGS, SALUTE_ARMS)],
    [8.0, { yaw: 0.0, nk: [-0.02, 0, 0], eyes: 'shut' }],

    [8.03, Object.assign({
      pos: [0, 0.9, 0], yaw: 0.05, lean: 0, roll: -0.08,
      sp: [0.04, 0, -0.04], nk: [0.04, -0.06, -0.1],
      eyes: 'wide', mouth: 'talk', phoneMode: 'none', chakram: false
    }, STAND_LEGS, HIP_ARMS)],
    [8.86, {
      yaw: 0.08, roll: -0.1,
      nk: [0.06, -0.08, -0.12],
      eyes: 'open', mouth: 'smile'
    }],

    [8.9, Object.assign({
      pos: [0, 0.9, 0], yaw: 0, lean: 0, roll: 0,
      sp: [-0.2, 0, 0], nk: [-0.38, 0, 0],
      hR: [-0.145, -0.05, 0.07],
      hL: [0.12, 0.16, 0.14],
      eyes: 'open', mouth: 'o', phoneMode: 'ear', chakram: false
    }, STAND_LEGS)],
    [9.16, {
      sp: [0.02, 0, -0.04], nk: [0.02, -0.04, -0.06],
      hL: [0.155, 0.26, 0.125], eL: [0.3, 0.04, 0.08], wL: [-0.12, -0.3, 0.55],
      gL: 'relax', gR: 'relax',
      phoneMode: 'ear', eyes: 'wide', mouth: 'o'
    }],
    [9.65, {
      sp: [0.02, 0, -0.06], nk: [-0.02, -0.06, -0.08],
      phoneMode: 'ear', eyes: 'open', mouth: 'open'
    }],
    [10.28, {
      nk: [-0.04, -0.06, -0.1],
      phoneMode: 'ear', eyes: 'half', mouth: 'smile'
    }],
    [10.75, {
      nk: [-0.02, -0.04, -0.06],
      hL: [0.155, 0.26, 0.125], gL: 'relax',
      phoneMode: 'ear', eyes: 'half', mouth: 'smile'
    }],
    [10.95, {
      sp: [0.03, 0, -0.05], nk: [0.02, 0.05, 0.08],
      hL: [0.09, 0.22, 0.25], eL: [0.22, 0.02, 0.1],
      wL: [0.35, 0, 0], gL: 'offer',
      phoneMode: 'offer', dropY: 0, eyes: 'open', mouth: 'open'
    }],
    [11.82, {
      hL: [0.09, 0.22, 0.25], wL: [0.35, 0, 0], gL: 'offer',
      phoneMode: 'offer', dropY: 0, eyes: 'open', mouth: 'talk'
    }],
    [11.9, {
      hL: [0.11, 0.22, 0.24], wL: [0.2, 0, 0], gL: 'relax',
      phoneMode: 'drop', dropY: 0.05, eyes: 'open', mouth: 'o'
    }],
    [12.38, {
      hL: [0.12, 0.2, 0.23], wL: [0.1, 0, 0], gL: 'relax',
      phoneMode: 'drop', dropY: 1.0, eyes: 'open', mouth: 'o'
    }],
    [12.48, {
      sp: [0.02, 0, -0.06], nk: [-0.02, -0.04, -0.08],
      hL: [0.14, 0.24, 0.22], eL: [0.2, 0.0, 0.08],
      wL: [0, 0, -0.22], gL: 'wave',
      phoneMode: 'none', eyes: 'half', mouth: 'smirk'
    }],
    [12.72, {
      wL: [0, 0, 0.24], gL: 'wave',
      eyes: 'open', mouth: 'smile'
    }],
    [12.98, {
      wL: [0, 0, -0.24], gL: 'wave',
      eyes: 'open', mouth: 'open'
    }],
    [13.22, {
      wL: [0, 0, 0.22], gL: 'wave',
      eyes: 'open', mouth: 'open'
    }],
    [13.38, {
      wL: [0, 0, -0.16], gL: 'wave',
      eyes: 'open', mouth: 'open'
    }],

    [13.4, Object.assign({
      pos: [0, 0.9, 0], yaw: -2.25, lean: 0, roll: 0,
      sp: [0.04, 0, 0], nk: [-0.06, 0, 0],
      eyes: 'shut', mouth: 'smile', phoneMode: 'none', chakram: true
    }, CROSS_LEGS, SALUTE_ARMS)],
    [15.35, { yaw: 0.0, nk: [-0.04, 0, 0], eyes: 'shut', mouth: 'smile' }],
    [15.79, { yaw: 0.0, nk: [-0.04, 0, 0], eyes: 'shut', mouth: 'smile' }]
  ]);

  function shotIndexAt(t) {
    let idx = 0;
    for (let i = 1; i < CUTS.length; i++) {
      if (t >= CUTS[i]) idx = i;
    }
    return idx;
  }

  function cameraAt(t, shot) {
    if (shot === 0 || shot === 2 || shot === 5) {
      return { eye: [0, 1.14, 1.38], at: [0, 1.08, 0], fov: 46 };
    }
    if (shot === 3) {
      const u = clamp((t - 8.03) / 0.87, 0, 1);
      return {
        eye: [lerp(-0.01, 0.01, u), lerp(1.325, 1.318, u), 0.44],
        at: [0.0, 1.318, 0],
        fov: 32
      };
    }
    return { eye: [0, 1.23, 0.94], at: [0, 1.19, 0], fov: 42 };
  }

  function speechAt(t) {
    const s = SPEECH.find(x => t >= x.t0 && t < x.t1);
    return s ? s.text : '';
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, DURATION);
    const shot = shotIndexAt(t);
    const pose = DIALYN(t);
    const v = VOICE(t);

    if (shot === 1 || shot === 3 || shot === 4) {
      if (pose.mouth !== 'o' && pose.mouth !== 'smirk' && pose.mouth !== 'shut') {
        if (v > 0.58) pose.mouth = 'wide';
        else if (v > 0.38) pose.mouth = 'open';
        else if (v > 0.2) pose.mouth = 'talk';
      }
    }

    return {
      t,
      shot,
      env: ENV,
      camera: cameraAt(t, shot),
      voice: v,
      speech: speechAt(t),
      pose
    };
  }

  window.LingingScript = { DURATION, CUTS, VOICE, SPEECH, stage };
})();
