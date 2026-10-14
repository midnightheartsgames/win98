(function (N) {
  'use strict';

  const K = N.KIND;
  const UP = [0, 1, 0], ONE3 = [1, 1, 1];

  const M4 = {
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2);
      return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
    },
    look(e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
      return o;
    },
    inv(m) {
      const inv = new Float32Array(16);
      inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
      inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
      inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
      inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
      inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
      inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
      inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
      inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
      inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
      inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
      inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
      inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
      inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
      inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
      inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
      inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
      let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
      det = det ? 1 / det : 0;
      for (let i = 0; i < 16; i++) inv[i] *= det;
      return inv;
    }
  };
  N.M4 = M4;

  const KEYS = [
    [0, '#04060f', '#10142a', '#6070a0', 0.2, '#222c4c', '#121218', '#0e1224'],
    [4.3, '#060a1c', '#1c1c38', '#6070a0', 0.18, '#222c4c', '#121218', '#121630'],
    [5.3, '#28386a', '#d8866a', '#ffae70', 0.55, '#6a6a8a', '#3a3230', '#9a7a86'],
    [7, '#4c7cc8', '#c4d4e4', '#fff0d4', 1.0, '#8aa0c0', '#6a6050', '#b4c4d6'],
    [13, '#3c74d0', '#b4cce6', '#fff8ea', 1.08, '#90a8c8', '#6a6456', '#b6cae0'],
    [18.2, '#4c6cb8', '#e8c0a0', '#ffd8a0', 0.95, '#90a0c0', '#6a5a4a', '#d0b8a8'],
    [20.3, '#44449a', '#ff8a78', '#ff9a6a', 0.75, '#8a70a0', '#5a4040', '#d08898'],
    [21.5, '#24245a', '#a04a70', '#c05a60', 0.35, '#503a60', '#2a2028', '#6a3a5a'],
    [22.6, '#080a1e', '#20183a', '#7080b0', 0.2, '#242a4a', '#121218', '#161430'],
    [24, '#04060f', '#10142a', '#6070a0', 0.2, '#222c4c', '#121218', '#0e1224']
  ];
  const c3 = h => { const v = N.hex(h); return [v[0] / 255, v[1] / 255, v[2] / 255]; };
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const MOON = norm3([0.35, 0.6, -0.4]);
  const CALM = { cloud: 0.4, dark: 0, rain: 0, fog: 0, haze: 0.1, wind: 2.5, windX: 2.5, windZ: 0, gust: 0, wet: 0, puddle: 0, flash: 0, strike: null, rainbow: 0 };

  N.envFor = (clock, wx, draw, interior, mt) => {
    const W = wx || CALM;
    if (interior === 'metro') {
      const k = mt && mt.k !== undefined ? mt.k : 1, tn = mt && mt.tint || [1, 1, 1];
      const tc = (v, kk) => [v[0] * kk * tn[0], v[1] * kk * tn[1], v[2] * kk * tn[2]];
      return {
        skyTop: tc([0.15, 0.145, 0.135], k), skyHor: tc([0.23, 0.22, 0.2], k), sunCol: tc([0.56, 0.53, 0.47], k), sun: [0.14, 0.98, 0.1], sky: tc([0.98, 0.95, 0.88], k), gnd: tc([0.58, 0.55, 0.5], k),
        fog: [0.012, 0.012, 0.014], fogNear: 40, fogFar: 240 * (draw || 1), hfog: [0, 0.05], fogSun: [0, 0, 0, 8], glow: [0, 0, 0], moon: MOON, night: 0.6, el: -1, stars: 0, cloud: 0, dark: 0, haze: 0,
        wind: [0, 0], windK: 0, gust: 0, rain: 0, wet: 0, puddle: 0, flash: [0, 1, 0, 0], bolt: [0, 0, 0, 0.1], rainbow: 0, beam: 0, halo: 1, interior: true, metro: true, metroK: k, grade: [1, 1, 1],
        post: { exposure: 1.04, sat: 1.02, contrast: 1.05, vignette: 0.4, lift: [0, 0, 0.004], gain: [1, 0.985, 0.96], bloom: 0.42, rays: 0, heat: 0, lens: 0, grain: 0.035 }
      };
    }
    if (interior) {
      return {
        skyTop: [0, 0, 0], skyHor: [0, 0, 0], sunCol: [0.2, 0.1, 0.25], sun: [0.3, 1, 0.2], sky: [0.35, 0.22, 0.4], gnd: [0.12, 0.08, 0.14], fog: [0.05, 0.02, 0.06], fogNear: 30, fogFar: 90,
        hfog: [0, 0.05], fogSun: [0, 0, 0, 8], glow: [0, 0, 0], moon: MOON, night: 1, el: -1, stars: 0, cloud: 0, dark: 0, haze: 0, wind: [0, 0], windK: 0, gust: 0,
        rain: 0, wet: 0, puddle: 0, flash: [0, 1, 0, 0], bolt: [0, 0, 0, 0.1], rainbow: 0, beam: 0, halo: 1, interior: true, grade: [1, 1, 1],
        post: { exposure: 1, sat: 1.1, contrast: 1.04, vignette: 0.42, lift: [0, 0, 0.008], gain: [1, 0.97, 1.03], bloom: 0.36, rays: 0, heat: 0, lens: 0, grain: 0.03 }
      };
    }
    const h = (clock / 60) % 24;
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const A = KEYS[i], B = KEYS[i + 1];
    const t = N.clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
    const lerpC = k => mix3(c3(A[k]), c3(B[k]), t);
    let skyTop = lerpC(1), skyHor = lerpC(2), sunCol = lerpC(3), sky = lerpC(5), gnd = lerpC(6), fog = lerpC(7);
    let sunI = N.lerp(A[4], B[4], t);
    const el = h >= 4.6 && h <= 21.8 ? Math.sin((h - 4.6) / 17.2 * Math.PI) * 0.9 : -Math.sin(((h - 21.8 + 24) % 24) / 6.8 * Math.PI) * 0.4;
    const az = (h / 24) * Math.PI * 2 - Math.PI * 0.6;
    const night = N.clamp(1 - (el + 0.15) / 0.35, 0, 1);
    const sun = norm3(el > -0.05 ? [Math.cos(az) * Math.cos(el * 1.2), Math.max(0.08, el), Math.sin(az) * Math.cos(el * 1.2)] : [0.35, 0.6, -0.4]);
    const grey = N.clamp(N.smooth(0.4, 1, W.cloud) * 0.4 + W.dark * 0.42 + W.fog * 0.6, 0, 0.9);
    if (grey > 0) {
      const g = mix3([0.55, 0.57, 0.6], [0.08, 0.08, 0.1], night);
      skyTop = mix3(skyTop, g, grey);
      skyHor = mix3(skyHor, mix3(g, [0.7, 0.72, 0.74], 1 - night), grey);
      fog = mix3(fog, mix3(g, [0.62, 0.64, 0.66], 1 - night), grey);
      sunI *= 1 - grey * 0.75;
      sky = mix3(sky, g, grey * 0.5);
    }
    if (W.fog > 0) {
      const fw = mix3([0.8, 0.81, 0.83], [0.1, 0.1, 0.12], night);
      fog = mix3(fog, fw, W.fog * 0.55);
      skyHor = mix3(skyHor, fw, W.fog * 0.45);
    }
    if (W.rain > 0) {
      skyTop = skyTop.map(v => v * (1 - 0.2 * W.rain));
      skyHor = skyHor.map(v => v * (1 - 0.1 * W.rain));
      fog = fog.map(v => v * (1 - 0.12 * W.rain));
      sky = sky.map(v => v * (1 - 0.1 * W.rain));
    }
    let fogFar = N.lerp(430, 330, night) * (draw || 1);
    fogFar *= 1 - 0.42 * W.rain;
    fogFar = N.lerp(fogFar, 150, W.fog);
    const fogNear = N.lerp(40, 5, Math.max(W.fog, W.rain * 0.45));
    const dayK = 1 - night;
    sky = sky.map(v => v * (0.62 * dayK + 1.35 * night));
    gnd = gnd.map(v => v * (0.7 * dayK + 1.2 * night));
    sunI *= 0.82;
    sunCol = sunCol.map(v => v * sunI);
    const glowK = night * (0.1 + 0.35 * N.smooth(0.3, 1, W.cloud) + 0.55 * W.fog + 0.15 * W.rain);
    const glow = [0.42 * glowK, 0.27 * glowK, 0.13 * glowK];
    fog = [fog[0] + glow[0] * 0.35, fog[1] + glow[1] * 0.35, fog[2] + glow[2] * 0.35];
    const sunUp = N.smooth(-0.05, 0.1, el);
    const fsk = dayK * sunUp * (0.12 + 0.6 * W.fog + 0.3 * W.haze);
    const s = W.strike;
    const flash = s ? norm3([Math.sin(s.a) * 0.75, 0.55, -Math.cos(s.a) * 0.75]).concat([W.flash * (0.55 + 0.45 * night)]) : [0, 1, 0, 0];
    const bolt = s && s.t < 0.32 && s.d > 350 ? [s.a, s.seed, N.clamp(W.flash, 0, 1), N.lerp(0.24, 0.06, N.clamp((s.d - 500) / 3500, 0, 1))] : [0, 0, 0, 0.1];
    const grade = mix3([1.02, 1.0, 0.97], [0.92, 0.95, 1.08], night);
    const cool = W.rain * 0.6 + W.fog * 0.25 + N.smooth(0.5, 1, W.cloud) * 0.2;
    const liftK = W.fog * 0.05 * (dayK * 0.8 + 0.2);
    return {
      skyTop, skyHor, sunCol, sun, sky, gnd, fog, fogNear, fogFar, night, el, moon: MOON,
      stars: night * (1 - grey) * (1 - W.haze * 0.8), cloud: W.cloud, dark: W.dark, haze: W.haze,
      hfog: [0.0002 + W.haze * 0.0006 + W.rain * 0.0025 + W.fog * 0.03, N.lerp(0.035, 0.07, W.fog)],
      fogSun: [sunCol[0] * fsk, sunCol[1] * fsk, sunCol[2] * fsk, N.lerp(8, 3, W.fog)],
      glow, wind: [W.windX, W.windZ], windK: W.wind, gust: W.gust,
      rain: W.rain, wet: W.wet, puddle: W.puddle, flash, bolt,
      rainbow: W.rainbow * N.smooth(0.03, 0.12, el) * (1 - N.smooth(0.45, 0.62, el)) * (1 - W.rain) * dayK,
      beam: N.clamp(night * (0.15 + 0.85 * Math.max(W.fog, W.rain * 0.85, W.haze * 0.35)) + W.fog * 0.3 * dayK, 0, 1),
      halo: 1 + W.fog * 1.8 + W.rain * 0.6,
      grade,
      post: {
        exposure: 1,
        sat: 1.06 - 0.3 * W.rain - 0.22 * W.fog - 0.18 * N.smooth(0.5, 1, W.cloud) - 0.1 * night,
        contrast: 1.04 - 0.12 * W.fog - 0.03 * W.cloud,
        vignette: 0.3 + 0.12 * night + 0.08 * W.rain,
        lift: [liftK, liftK, liftK * 1.08 + night * 0.006],
        gain: [grade[0] * (1 - 0.05 * cool), grade[1] * (1 - 0.01 * cool), grade[2] * (1 + 0.05 * cool)],
        bloom: 0.12 + 0.09 * night + 0.1 * W.fog + 0.06 * W.rain,
        rays: dayK * sunUp * (0.3 + 0.8 * W.haze) * (1 - 0.9 * N.smooth(0.85, 1, W.cloud)) * (1 - 0.8 * W.rain) * (1 - 0.6 * W.fog),
        heat: dayK * N.smooth(10.5, 13, h) * (1 - N.smooth(17, 19, h)) * (1 - N.smooth(0.35, 0.65, W.cloud)) * (1 - W.rain) * (1 - W.fog) * (1 - W.wet),
        lens: N.clamp((W.rain - 0.3) / 0.7, 0, 1),
        grain: 0.02 + 0.02 * night
      }
    };
  };

  const SURF_DEFAULT = [0, 0.4, 0.04, 0.5];
  N.SURFACE = {
    brickpave: [0.85, 0.6, 0.07, 0.9], redgranite: [0.3, 0.35, 0.38, 0.95], balustrade: [0, 0.3, 0.08, 0.6],
    asphalt: [1, 0.75, 0.08, 1], asphalt2: [1, 0.75, 0.08, 1], sidewalk: [0.75, 0.6, 0.06, 0.9], plaza: [0.85, 0.55, 0.08, 0.9], concrete: [0.55, 0.55, 0.05, 0.8],
    paint: [0.9, 0.3, 0.12, 0.9], paintyellow: [0.9, 0.3, 0.12, 0.9], dirt: [0.85, 0.85, 0.02, 0.5], tar: [0.8, 0.5, 0.12, 0.9], granite: [0.35, 0.45, 0.16, 0.9],
    deck: [0.3, 0.6, 0.06, 0.7], gravel: [0.25, 0.65, 0.02, 0.4], grass: [0, 0.5, 0, 0.1], field: [0, 0.45, 0, 0.1], forestfloor: [0, 0.45, 0, 0.1], pitch: [0, 0.5, 0.02, 0.15],
    sand: [0.15, 0.65, 0, 0.3], ballast: [0, 0.55, 0, 0.3], sleepers: [0, 0.55, 0.03, 0.4], curb: [0, 0.55, 0.06, 0.8], track: [0, 0.3, 0.45, 1],
    metal: [0, 0.1, 0.4, 1], roofmetal: [0, 0.1, 0.35, 1], roofgreen: [0, 0.1, 0.32, 1], darkmetal: [0, 0.1, 0.35, 1], metalfence: [0, 0.1, 0.3, 1], slate: [0, 0.4, 0.2, 0.8],
    container: [0, 0.1, 0.3, 1], glass: [0, 0, 0.7, 1], carbody: [0, 0.05, 0.55, 1], carglass: [0, 0, 0.8, 1], rim: [0, 0, 0.6, 1], lamplens: [0, 0, 0.75, 1], gauge: [0, 0, 0.7, 1], mirror: [0, 0, 0.9, 1], chrome: [0, 0, 0.9, 1], trim: [0, 0.15, 0.4, 0.8],
    marble: [0, 0.1, 0.56, 0.8], mgranite: [0, 0.2, 0.36, 0.6], lino: [0, 0.2, 0.3, 0.5], mosaic: [0, 0.1, 0.32, 0.5], autopanel: [0, 0.1, 0.42, 0.6], metromap: [0, 0, 0.25, 0.3],
    tire: [0, 0.3, 0.1, 0.6], water: [0, 0, 0.9, 1], hullpaint: [0, 0.05, 0.4, 1], cranepaint: [0, 0.05, 0.35, 1], white: [0, 0.2, 0.15, 0.7],
    skin: [0, 0.25, 0.1, 0.55], face: [0, 0.25, 0.1, 0.55], cloth: [0, 0.5, 0.02, 0.3], leather: [0, 0.2, 0.42, 0.9], hair: [0, 0.35, 0.18, 0.6], stripes: [0, 0.5, 0.02, 0.3], camo: [0, 0.5, 0.02, 0.3], palms: [0, 0.5, 0.03, 0.3], plaid: [0, 0.45, 0.08, 0.5]
  };

  function compile(gl, vs, fs, name) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error((name || '') + ': ' + gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error((name || '') + ': ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const nm = info.name.replace('[0]', '');
      u[nm] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  N.MAX_LIGHTS = 16;
  const LAMP_OFF = [[214, 214, 206], [124, 18, 16], [42, 58, 140], [140, 32, 28], [84, 150, 84], [206, 206, 200], [214, 128, 40], [214, 128, 40], [168, 168, 158], [92, 94, 96]];

  class Dyn {
    constructor(cap) {
      this.cap = cap;
      this.buf = new ArrayBuffer(cap * 32);
      this.f = new Float32Array(this.buf);
      this.i8 = new Int8Array(this.buf);
      this.u8 = new Uint8Array(this.buf);
      this.u32 = new Uint32Array(this.buf);
      this.idx = new Uint32Array(cap * 2);
      this.nv = 0;
      this.ni = 0;
      this.org = [0, 0, 0];
    }
    reset(org) { this.nv = 0; this.ni = 0; this.org = org || [0, 0, 0]; }
    room(nv, ni) { return this.nv + nv <= this.cap && this.ni + ni <= this.idx.length; }
    add(src, M, paint, bones, G, lampState, dim, look) {
      if (!this.room(src.nv, src.ni)) return;
      if (bones) { this.addRig(src, M, paint, bones, G, lampState, dim, look); return; }
      const base = this.nv, n = src.nv;
      const F = this.f, I8 = this.i8, U32 = this.u32, SF = src.f, SI = src.i8, SU = src.u8;
      const SW = src.u32 && src.u32.buffer === SF.buffer ? src.u32 : (src.u32 = new Uint32Array(SF.buffer));
      const m0 = M[0], m1 = M[1], m2 = M[2], m3 = M[3], m4 = M[4], m5 = M[5], m6 = M[6], m7 = M[7], m8 = M[8], m9 = M[9] - this.org[0], m10 = M[10] - this.org[1], m11 = M[11] - this.org[2];
      const PAINT = K.PAINT, GLASS = K.GLASS, hasLook = !!look;
      const lg = hasLook ? look[0] * 255 | 0 : 0, ld = hasLook ? look[1] : 1, lt = hasLook ? look[2] * 255 | 0 : 0;
      const dk = dim !== undefined && dim < 1 ? dim : 1, plain = dk === 1 && ld === 1;
      const pw = paint ? (paint[0] * dk | 0) | ((paint[1] * dk | 0) << 8) | ((paint[2] * dk | 0) << 16) : -1;
      for (let i = 0; i < n; i++) {
        const o = i * 8, b = o * 4, d = (base + i) * 8, db = d * 4;
        const px = SF[o], py = SF[o + 1], pz = SF[o + 2];
        F[d] = m0 * px + m1 * py + m2 * pz + m9;
        F[d + 1] = m3 * px + m4 * py + m5 * pz + m10;
        F[d + 2] = m6 * px + m7 * py + m8 * pz + m11;
        const nx = SI[b + 12], ny = SI[b + 13], nz = SI[b + 14];
        I8[db + 12] = m0 * nx + m1 * ny + m2 * nz;
        I8[db + 13] = m3 * nx + m4 * ny + m5 * nz;
        I8[db + 14] = m6 * nx + m7 * ny + m8 * nz;
        F[d + 4] = SF[o + 4];
        F[d + 5] = SF[o + 5];
        const w6 = SW[o + 6], w7 = SW[o + 7], kind = (w7 >>> 8) & 255;
        if (kind === PAINT && pw >= 0) {
          const s1 = w7 >>> 24;
          U32[d + 6] = pw | (w6 & 0xff000000);
          U32[d + 7] = (w7 & 0xffff) | ((hasLook ? lg : (w7 >>> 16) & 255) << 16) | ((hasLook && s1 ? s1 * ld | 0 : s1) << 24);
          continue;
        }
        if (kind !== PAINT && kind < 20 && (kind !== GLASS || lt <= ((w7 >>> 16) & 255)) && plain) {
          U32[d + 6] = w6;
          U32[d + 7] = w7;
          continue;
        }
        let k2 = kind, s0 = SU[b + 30], s1 = SU[b + 31], r = SU[b + 24], g = SU[b + 25], bl = SU[b + 26];
        if (k2 === PAINT) { if (hasLook) s0 = lg; }
        else if (k2 >= 20) {
          const on = lampState ? lampState[k2 - 20] : 0;
          if (on > 0) { k2 = K.EMIT; r = Math.min(255, r * on) | 0; g = Math.min(255, g * on) | 0; bl = Math.min(255, bl * on) | 0; }
          else { const off = LAMP_OFF[k2 - 20] || LAMP_OFF[0]; k2 = K.LENS; r = off[0]; g = off[1]; bl = off[2]; }
        } else if (k2 === GLASS && lt > s0) s0 = lt;
        if (hasLook && s1) s1 = s1 * ld | 0;
        if (dk < 1) { r = r * dk | 0; g = g * dk | 0; bl = bl * dk | 0; }
        U32[d + 6] = r | (g << 8) | (bl << 16) | (SU[b + 27] << 24);
        U32[d + 7] = SU[b + 28] | (k2 << 8) | (s0 << 16) | (s1 << 24);
      }
      const I = this.idx, SIx = src.idx, ni = this.ni;
      for (let i = 0; i < src.ni; i++) I[ni + i] = SIx[i] + base;
      this.ni += src.ni;
      this.nv += n;
    }
    addRig(src, M, paint, bones, G, lampState, dim, look) {
      const base = this.nv;
      const F = this.f, I8 = this.i8, U32 = this.u32, SF = src.f, SI = src.i8, SU = src.u8;
      const PAINT = K.PAINT, GLASS = K.GLASS, hasLook = !!look;
      const lg = hasLook ? look[0] * 255 | 0 : 0, ld = hasLook ? look[1] : 1, lt = hasLook ? look[2] * 255 | 0 : 0;
      const dk = dim !== undefined && dim < 1 ? dim : 1, ox = this.org[0], oy = this.org[1], oz = this.org[2];
      for (let i = 0; i < src.nv; i++) {
        const o = i * 8, b = i * 32, d = (base + i) * 8, db = (base + i) * 32;
        let m = M;
        let px = SF[o], py = SF[o + 1], pz = SF[o + 2];
        if (bones) {
          const bi = bones[i];
          m = G[bi];
          const pv = src.piv[bi];
          px -= pv[0]; py -= pv[1]; pz -= pv[2];
        }
        F[d] = m[0] * px + m[1] * py + m[2] * pz + m[9] - ox;
        F[d + 1] = m[3] * px + m[4] * py + m[5] * pz + m[10] - oy;
        F[d + 2] = m[6] * px + m[7] * py + m[8] * pz + m[11] - oz;
        const nx = SI[b + 12], ny = SI[b + 13], nz = SI[b + 14];
        I8[db + 12] = m[0] * nx + m[1] * ny + m[2] * nz;
        I8[db + 13] = m[3] * nx + m[4] * ny + m[5] * nz;
        I8[db + 14] = m[6] * nx + m[7] * ny + m[8] * nz;
        F[d + 4] = SF[o + 4];
        F[d + 5] = SF[o + 5];
        let kind = SU[b + 29], m0 = SU[b + 30], m1 = SU[b + 31];
        let r = SU[b + 24], g = SU[b + 25], bl = SU[b + 26];
        if (kind === PAINT) {
          if (paint) { r = paint[0]; g = paint[1]; bl = paint[2]; }
          if (hasLook) m0 = lg;
        } else if (kind >= 20) {
          const on = lampState ? lampState[kind - 20] : 0;
          if (on > 0) { kind = K.EMIT; r = Math.min(255, r * on) | 0; g = Math.min(255, g * on) | 0; bl = Math.min(255, bl * on) | 0; }
          else { const off = LAMP_OFF[kind - 20] || LAMP_OFF[0]; kind = K.LENS; r = off[0]; g = off[1]; bl = off[2]; }
        } else if (kind === GLASS && lt > m0) m0 = lt;
        if (hasLook && m1) m1 = m1 * ld | 0;
        if (dk < 1) { r = r * dk | 0; g = g * dk | 0; bl = bl * dk | 0; }
        U32[d + 6] = r | (g << 8) | (bl << 16) | (SU[b + 27] << 24);
        U32[d + 7] = SU[b + 28] | (kind << 8) | (m0 << 16) | (m1 << 24);
      }
      const I = this.idx, SIx = src.idx;
      for (let i = 0; i < src.ni; i++) I[this.ni + i] = SIx[i] + base;
      this.ni += src.ni;
      this.nv += src.nv;
    }
  }

  class Sprites {
    constructor(cap) {
      this.cap = cap;
      this.f = new Float32Array(cap * 7);
      this.u8 = new Uint8Array(this.f.buffer);
      this.n = 0;
      this.org = [0, 0, 0];
    }
    reset(org) { this.n = 0; this.org = org || [0, 0, 0]; }
    quad(p0, p1, p2, p3, cell, col, soft) {
      if (this.n + 6 > this.cap) return;
      const u0 = (cell % 4) * 0.25, v0 = Math.floor(cell / 4) * 0.25, u1 = u0 + 0.25, v1 = v0 + 0.25;
      const pts = [p0, p1, p2, p0, p2, p3];
      const uvs = [[u0, v1], [u1, v1], [u1, v0], [u0, v1], [u1, v0], [u0, v0]];
      for (let k = 0; k < 6; k++) {
        const o = this.n++ * 7;
        this.f[o] = pts[k][0] - this.org[0]; this.f[o + 1] = pts[k][1] - this.org[1]; this.f[o + 2] = pts[k][2] - this.org[2];
        this.f[o + 3] = uvs[k][0]; this.f[o + 4] = uvs[k][1];
        const b = o * 4 + 20;
        this.u8[b] = col[0]; this.u8[b + 1] = col[1]; this.u8[b + 2] = col[2]; this.u8[b + 3] = col[3];
        this.f[o + 6] = soft || 0;
      }
    }
    bill(x, y, z, size, cell, col, R, U, rot, soft) {
      const s = size / 2;
      let rx = R[0], ry = R[1], rz = R[2], ux = U[0], uy = U[1], uz = U[2];
      if (rot) {
        const c = Math.cos(rot), sn = Math.sin(rot);
        const nrx = rx * c + ux * sn, nry = ry * c + uy * sn, nrz = rz * c + uz * sn;
        ux = ux * c - rx * sn; uy = uy * c - ry * sn; uz = uz * c - rz * sn;
        rx = nrx; ry = nry; rz = nrz;
      }
      this.quad([x - rx * s - ux * s, y - ry * s - uy * s, z - rz * s - uz * s], [x + rx * s - ux * s, y + ry * s - uy * s, z + rz * s - uz * s], [x + rx * s + ux * s, y + ry * s + uy * s, z + rz * s + uz * s], [x - rx * s + ux * s, y - ry * s + uy * s, z - rz * s + uz * s], cell, col, soft === undefined ? 1.6 / Math.max(0.25, size) : soft);
    }
    ground(x, y, z, sx, sz, yaw, cell, col) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const ax = c * sx, az = s * sx, bx = -s * sz, bz = c * sz;
      this.quad([x - ax - bx, y, z - az - bz], [x + ax - bx, y, z + az - bz], [x + ax + bx, y, z + az + bz], [x - ax + bx, y, z - az + bz], cell, col, 0);
    }
    beam(a, b, w, cell, col, cam) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const vx = cam[0] - a[0], vy = cam[1] - a[1], vz = cam[2] - a[2];
      let px = dy * vz - dz * vy, py = dz * vx - dx * vz, pz = dx * vy - dy * vx;
      const l = Math.hypot(px, py, pz) || 1;
      px = px / l * w; py = py / l * w; pz = pz / l * w;
      this.quad([a[0] - px, a[1] - py, a[2] - pz], [a[0] + px, a[1] + py, a[2] + pz], [b[0] + px, b[1] + py, b[2] + pz], [b[0] - px, b[1] - py, b[2] - pz], cell, col, 0);
    }
  }

  N.FXT = { STAR: 1, JET: 2, TRACER: 3, HIT: 4, BALL: 5, FLAME: 6, RING: 7, BEAM: 8, GLOW: 9 };
  const QI = [0, 1, 2, 0, 2, 3];

  class FxQuads {
    constructor(cap) {
      this.cap = cap;
      this.f = new Float32Array(cap * 10);
      this.u8 = new Uint8Array(this.f.buffer);
      this.n = 0;
      this.org = [0, 0, 0];
    }
    reset(org) { this.n = 0; this.org = org || [0, 0, 0]; }
    quad(P, UV, type, age, seed, aux, col) {
      if (this.n + 6 > this.cap) return;
      const F = this.f, U8 = this.u8;
      for (let j = 0; j < 6; j++) {
        const k = QI[j], p = P[k], uv = UV[k];
        const o = this.n++ * 10;
        F[o] = p[0] - this.org[0]; F[o + 1] = p[1] - this.org[1]; F[o + 2] = p[2] - this.org[2]; F[o + 3] = uv[0]; F[o + 4] = uv[1];
        F[o + 5] = type; F[o + 6] = age; F[o + 7] = seed; F[o + 8] = aux;
        const b = (o + 9) * 4;
        U8[b] = col[0]; U8[b + 1] = col[1]; U8[b + 2] = col[2]; U8[b + 3] = col[3];
      }
    }
    bill(x, y, z, hw, hh, type, age, seed, col, R, U, rot, base) {
      let rx = R[0], ry = R[1], rz = R[2], ux = U[0], uy = U[1], uz = U[2];
      if (rot) {
        const c = Math.cos(rot), sn = Math.sin(rot);
        const nrx = rx * c + ux * sn, nry = ry * c + uy * sn, nrz = rz * c + uz * sn;
        ux = ux * c - rx * sn; uy = uy * c - ry * sn; uz = uz * c - rz * sn;
        rx = nrx; ry = nry; rz = nrz;
      }
      const cy = base ? y + hh : y;
      const P = [[x - rx * hw - ux * hh, cy - ry * hw - uy * hh, z - rz * hw - uz * hh], [x + rx * hw - ux * hh, cy + ry * hw - uy * hh, z + rz * hw - uz * hh], [x + rx * hw + ux * hh, cy + ry * hw + uy * hh, z + rz * hw + uz * hh], [x - rx * hw + ux * hh, cy - ry * hw + uy * hh, z - rz * hw + uz * hh]];
      this.quad(P, base ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]], type, age, seed, 0, col);
    }
    axis(a, b, w0, w1, type, age, seed, col, cam) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const vx = cam[0] - a[0], vy = cam[1] - a[1], vz = cam[2] - a[2];
      let px = dy * vz - dz * vy, py = dz * vx - dx * vz, pz = dx * vy - dy * vx;
      const l = Math.hypot(px, py, pz) || 1;
      px /= l; py /= l; pz /= l;
      this.quad([[a[0] - px * w0, a[1] - py * w0, a[2] - pz * w0], [a[0] + px * w0, a[1] + py * w0, a[2] + pz * w0], [b[0] + px * w1, b[1] + py * w1, b[2] + pz * w1], [b[0] - px * w1, b[1] - py * w1, b[2] - pz * w1]], [[0, -1], [0, 1], [1, 1], [1, -1]], type, age, seed, 0, col);
    }
    flat(x, y, z, r, type, age, seed, col) {
      this.quad([[x - r, y, z - r], [x + r, y, z - r], [x + r, y, z + r], [x - r, y, z + r]], [[-1, -1], [1, -1], [1, 1], [-1, 1]], type, age, seed, 0, col);
    }
  }

  const SHOT = {
    pm: { size: 0.32, speed: 380, len: 5, w: 0.035 },
    shotgun: { size: 0.62, speed: 320, len: 3, w: 0.022 },
    ak: { size: 0.48, speed: 520, len: 9, w: 0.04 },
    svd: { size: 0.72, speed: 700, len: 14, w: 0.05 }
  };
  const shotFx = w => SHOT[w] || (N.WEAPONS[w] && N.WEAPONS[w].fx) || (N.VEH_GUNS[w] && N.VEH_GUNS[w].fx) || SHOT.pm;

  class FX {
    constructor() {
      this.parts = [];
      this.tracers = [];
      this.decals = [];
      this.flashes = [];
      this.shots = [];
      this.hits = [];
      this.balls = [];
      this.rings = [];
      this.waves = [];
      this.ripples = [];
      this.skids = [];
      this.shake = 0;
    }
    add(p) { if (this.parts.length < 1400) this.parts.push(p); }
    skid(ax, az, bx, bz, y, a) {
      const dx = bx - ax, dz = bz - az;
      this.skids.push({ x: (ax + bx) / 2, y, z: (az + bz) / 2, l: Math.hypot(dx, dz) / 2 + 0.06, yaw: Math.atan2(-dx, dz), a, t: 0, life: 40 });
    }
    smoke(x, y, z, dark, size) { this.add({ x, y, z, vx: (Math.random() - 0.5) * 0.6, vy: 1.2 + Math.random(), vz: (Math.random() - 0.5) * 0.6, t: 0, life: 2 + Math.random() * 1.5, s0: size || 0.8, s1: (size || 0.8) * 3.2, cell: 1, col: dark ? [40, 38, 36] : [190, 190, 190], a: dark ? 0.75 : 0.45, rot: Math.random() * 6, lit: true }); }
    explosion(x, y, z, r) {
      for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, e = Math.random() * 1.2, sp = 3 + Math.random() * 9; this.add({ x, y: y + 0.5, z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp + 2, vz: Math.sin(a) * Math.cos(e) * sp, t: 0, life: 0.4 + Math.random() * 0.4, s0: r * 0.45, s1: r * 0.15, cell: 2, col: [255, 230, 190], a: 1, add: true, drag: 3, rot: Math.random() * 6 }); }
      for (let i = 0; i < 16; i++) this.add({ x: x + (Math.random() - 0.5) * r * 0.6, y: y + Math.random() * 2, z: z + (Math.random() - 0.5) * r * 0.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, t: 0, life: 3 + Math.random() * 2, s0: r * 0.5, s1: r * 1.5, cell: 1, col: [50, 46, 42], a: 0.8, rot: Math.random() * 6, drag: 1, lit: true });
      for (let i = 0; i < 28; i++) this.add({ x, y: y + 0.5, z, vx: (Math.random() - 0.5) * 18, vy: Math.random() * 12, vz: (Math.random() - 0.5) * 18, t: 0, life: 0.8 + Math.random() * 0.8, s0: 0.25, s1: 0.1, cell: 11, col: [255, 200, 90], a: 1, add: true, grav: true });
      this.balls.push({ x, y: y + 0.8, z, size: r * 0.62, t: 0, life: 1.7, seed: Math.random(), rise: 1.6 });
      for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28, d = r * (0.25 + Math.random() * 0.3); this.balls.push({ x: x + Math.cos(a) * d, y: y + 0.5 + Math.random() * r * 0.3, z: z + Math.sin(a) * d, size: r * (0.3 + Math.random() * 0.18), t: -0.04 - Math.random() * 0.16, life: 1.2 + Math.random() * 0.5, seed: Math.random(), rise: 2.2 }); }
      this.rings.push({ x, y, z, r: r * 2.4, t: 0, life: 0.6 });
      this.waves.push({ x, y: y + 1, z, t: 0, life: 0.55, s: Math.min(1.4, r / 5) });
      this.flashes.push({ x, y: y + 1.5, z, t: 0, life: 0.5, r: r * 3.2, col: [1.0, 0.6, 0.25], i: 3 });
      this.decals.push({ x, z, s: r * 0.55, cell: 10, t: 0, life: 60, col: [255, 255, 255, 200] });
    }
    blood(x, y, z) {
      for (let i = 0; i < 6; i++) this.add({ x, y, z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, t: 0, life: 0.4 + Math.random() * 0.3, s0: 0.25, s1: 0.1, cell: 4, col: [160, 20, 20], a: 0.9, grav: true });
      if (Math.random() < 0.6) this.decals.push({ x: x + (Math.random() - 0.5), z: z + (Math.random() - 0.5), s: 0.5 + Math.random() * 0.6, cell: 4, t: 0, life: 40, col: [110, 10, 10, 220], rot: Math.random() * 6 });
    }
    sparks(x, y, z, n, col) {
      for (let i = 0; i < n; i++) this.add({ x, y, z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 6, t: 0, life: 0.25 + Math.random() * 0.25, s0: 0.12, s1: 0.04, cell: 11, col: col || [255, 220, 140], a: 1, add: true, grav: true });
    }
    impact(x, y, z) { this.hits.push({ x, y, z, t: 0, life: 0.07, seed: Math.random() }); }
    dust(x, y, z) { this.add({ x, y, z, vx: (Math.random() - 0.5), vy: 0.3, vz: (Math.random() - 0.5), t: 0, life: 0.8, s0: 0.2, s1: 0.8, cell: 1, col: [120, 110, 100], a: 0.5, lit: true }); }
    tire(x, y, z) { this.add({ x, y: y + 0.2, z, vx: (Math.random() - 0.5) * 0.8, vy: 0.5, vz: (Math.random() - 0.5) * 0.8, t: 0, life: 1.4, s0: 0.6, s1: 2.4, cell: 1, col: [210, 210, 210], a: 0.35, rot: Math.random() * 6, lit: true }); }
    spray(x, y, z, vx, vz) { this.add({ x, y: y + 0.25, z, vx: vx * 0.25 + (Math.random() - 0.5), vy: 0.6 + Math.random() * 0.6, vz: vz * 0.25 + (Math.random() - 0.5), t: 0, life: 0.7 + Math.random() * 0.4, s0: 0.5, s1: 1.8, cell: 1, col: [205, 210, 218], a: 0.3, rot: Math.random() * 6, drag: 2, lit: true }); }
    splash(x, y, z, n, k) {
      const m = k || 1;
      for (let i = 0; i < (n || 20); i++) this.add({ x: x + (Math.random() - 0.5) * 0.4 * m, y, z: z + (Math.random() - 0.5) * 0.4 * m, vx: (Math.random() - 0.5) * 5 * m, vy: (3 + Math.random() * 5) * m, vz: (Math.random() - 0.5) * 5 * m, t: 0, life: 0.9, s0: 0.5 * Math.sqrt(m), s1: 0.2, cell: 0, col: [220, 230, 240], a: 0.8, grav: true, lit: true, floor: y - 0.1, kill: true });
      this.ripple(x, y, z, 0.3 * m, 2.6 * m, 1.4);
    }
    drops(x, y, z, vx, vz) {
      for (let i = 0; i < 5; i++) this.add({ x, y: y + 0.05, z, vx: vx * 0.4 + (Math.random() - 0.5) * 1.6, vy: 1.2 + Math.random() * 1.8, vz: vz * 0.4 + (Math.random() - 0.5) * 1.6, t: 0, life: 0.6, s0: 0.16, s1: 0.06, cell: 0, col: [225, 235, 240], a: 0.85, grav: true, lit: true, floor: y - 0.05, kill: true });
      this.ripple(x, y, z, 0.15, 0.9, 0.9);
    }
    bubbles(x, y, z) {
      for (let i = 0; i < 3; i++) this.add({ x: x + (Math.random() - 0.5) * 0.7, y: y + 0.02, z: z + (Math.random() - 0.5) * 0.7, vx: 0, vy: 0.15, vz: 0, t: 0, life: 0.35 + Math.random() * 0.3, s0: 0.08, s1: 0.18, cell: 8, col: [235, 240, 245], a: 0.9, lit: true });
    }
    ripple(x, y, z, r0, r1, life) { if (this.ripples.length < 60) this.ripples.push({ x, y, z, r0, r1, t: 0, life: life || 1.2 }); }
    muzzle(x, y, z, dir, w) {
      const S = shotFx(w);
      const d = dir || [0, 0, -1];
      if (S.air) { for (let i = 0; i < 3; i++) this.add({ x, y, z, vx: d[0] * 1.2 + (Math.random() - 0.5) * 0.3, vy: d[1] * 1.2 + 0.1, vz: d[2] * 1.2 + (Math.random() - 0.5) * 0.3, t: 0, life: 0.35, s0: 0.03, s1: 0.12, cell: 1, col: [220, 220, 216], a: 0.35, drag: 4, lit: true }); return; }
      this.shots.push({ x, y, z, dx: d[0], dy: d[1], dz: d[2], t: 0, life: 0.055 + S.size * 0.03, size: S.size * (0.85 + Math.random() * 0.3), seed: Math.random() });
      if (S.faint) this.flashes.push({ x, y, z, t: 0, life: 0.05, r: 3, col: [1, 0.85, 0.6], i: 0.4 });
      else this.flashes.push({ x, y, z, t: 0, life: 0.07, r: 9 + S.size * 4, col: [1, 0.8, 0.45], i: 1.1 + S.size * 0.6 });
    }
    tracer(a, b, w, k) {
      const S = shotFx(w);
      if (S.air) return;
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const pellet = (k || 0) > 0;
      this.tracers.push({ a, b, t: 0, dist, speed: S.speed * (pellet ? 0.9 + Math.random() * 0.2 : 1), len: Math.min(dist, S.len * (pellet ? 0.6 : 1)), w: S.w * (pellet ? 0.7 : 1), life: dist / S.speed + 0.05, a8: S.faint ? 70 : pellet ? 150 : 255 });
    }
    step(dt) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt;
        if (p.t >= p.life) { this.parts[i] = this.parts[this.parts.length - 1]; this.parts.pop(); continue; }
        if (p.grav) p.vy -= 9.8 * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const fl = p.floor !== undefined ? p.floor : 0.05;
        if (p.grav && p.y < fl) {
          if (p.kill) { this.parts[i] = this.parts[this.parts.length - 1]; this.parts.pop(); continue; }
          p.y = fl; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6;
        }
      }
      for (const arr of [this.tracers, this.decals, this.flashes, this.shots, this.hits, this.balls, this.rings, this.waves, this.ripples]) for (let i = arr.length - 1; i >= 0; i--) { arr[i].t += dt; if (arr[i].t >= arr[i].life) arr.splice(i, 1); }
      let old = 0;
      for (const k of this.skids) { k.t += dt; if (k.t >= k.life) old++; }
      if (this.skids.length - old > 700) old = this.skids.length - 700;
      if (old) this.skids.splice(0, old);
      if (this.decals.length > 120) this.decals.splice(0, this.decals.length - 120);
      if (this.tracers.length > 160) this.tracers.splice(0, this.tracers.length - 160);
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }
  }
  N.FX = FX;

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL2 недоступен');
      this.gl = gl;
      this.hdr = !!gl.getExtension('EXT_color_buffer_float');
      this.quality = opts.quality || 'high';
      const G = N.GLSL;
      const P = {};
      for (const k of Object.keys(G)) P[k] = compile(gl, G[k][0], G[k][1], k);
      this.P = P;
      this.main = P.world;
      this.dyn = new Dyn(260000);
      this.glass = new Dyn(40000);
      this.sprites = new Sprites(60000);
      this.addSprites = new Sprites(60000);
      this.fxq = new FxQuads(12000);
      this.chunks = [];
      this.stats = { draws: 0, tris: 0 };
      this.emptyVao = gl.createVertexArray();
      this.dynVao = this.makeVao(null, null, true);
      this.glassVao = this.makeVao(null, null, true);
      this.sprVao = this.makeSprVao();
      this.addVao = this.makeSprVao();
      this.fxVao = this.makeFxVao();
      this.makeRain();
      this.anisoExt = gl.getExtension('EXT_texture_filter_anisotropic');
      this.rt = null;
      this.drift = [0, 0];
      this.lastT = null;
      this.lastEye = null;
      this.camVel = [0, 0, 0];
      this.plBuf = new Float32Array(64);
      this.pcBuf = new Float32Array(48);
      this.pdBuf = new Float32Array(64);
      this.waveBuf = new Float32Array(16);
    }

    makeVao(data, idx, dynamic) {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      if (data) gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.BYTE, true, 32, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 16);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 32, 24);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, false, 32, 28);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      if (idx) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return { vao, vb, ib, n: idx ? idx.length : 0 };
    }

    makeSprVao() {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 28, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 28, 24);
      gl.bindVertexArray(null);
      return { vao, vb };
    }

    makeFxVao() {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 40, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 40, 36);
      gl.bindVertexArray(null);
      return { vao, vb };
    }

    makeRain() {
      const gl = this.gl;
      this.rainN = 9000;
      const seeds = new Float32Array(this.rainN * 4);
      const rng = N.rng(77);
      for (let i = 0; i < seeds.length; i++) seeds[i] = rng();
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const qb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      const sb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, sb);
      gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.bindVertexArray(null);
      this.rainVao = vao;
    }

    upload(tex, atlas, particles, geo) {
      const gl = this.gl;
      const S = 256;
      const n = tex.layers.length;
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 9, gl.RGBA8, S, S, n);
      for (let i = 0; i < n; i++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, S, S, 1, gl.RGBA, gl.UNSIGNED_BYTE, tex.layers[i]);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
      if (this.anisoExt) gl.texParameterf(gl.TEXTURE_2D_ARRAY, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      const tex2d = (src, mip) => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        if (mip) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };
      this.atlas = tex2d(atlas.canvas, true);
      this.ptex = tex2d(particles, true);
      this.matTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.matTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, N.surfaceTable());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.geo = geo;
      for (const ch of geo.chunks) {
        const d = ch.decal, fm = ch.fmb;
        if (!ch.mb.ni && !(d && d.ni) && !(fm && fm.ni) && !(ch.flora && ch.flora.length)) continue;
        const v = ch.mb.ni ? this.makeVao(new Uint8Array(ch.mb.buf, 0, ch.mb.nv * 32), ch.mb.idx.subarray(0, ch.mb.ni), false) : null;
        const dv = d && d.ni ? this.makeVao(new Uint8Array(d.buf, 0, d.nv * 32), d.idx.subarray(0, d.ni), false) : null;
        const fv = fm && fm.ni ? this.makeVao(new Uint8Array(fm.buf, 0, fm.nv * 32), fm.idx.subarray(0, fm.ni), false) : null;
        this.chunks.push({ ch, v, dv, fv, x0: ch.x0, z0: ch.z0, x1: ch.x1, z1: ch.z1, y1: ch.y1, cx: (ch.x0 + ch.x1) / 2, cz: (ch.z0 + ch.z1) / 2 });
        ch.gpu = v;
        ch.decal = null;
        ch.fmb = null;
      }
      const back = geo.backdrop;
      this.backVao = this.makeVao(new Uint8Array(back.buf, 0, back.nv * 32), back.idx.subarray(0, back.ni), false);
      const inr = geo.interior;
      this.intOrg = [N.INTERIOR_X, 0, 0];
      N.rebaseMesh(inr, this.intOrg);
      this.intVao = this.makeVao(new Uint8Array(inr.buf, 0, inr.nv * 32), inr.idx.subarray(0, inr.ni), false);
      this.metroVaos = [];
      for (const s of (geo.metro && geo.metro.segs) || []) {
        if (!s.mb.ni) continue;
        const org = [Math.round(s.x0), 0, Math.round((s.z0 + s.z1) / 2)];
        N.rebaseMesh(s.mb, org);
        this.metroVaos.push({ org, v: this.makeVao(new Uint8Array(s.mb.buf, 0, s.mb.nv * 32), s.mb.idx.subarray(0, s.mb.ni), false), x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1, y0: s.y0, y1: s.y1 });
        s.mb = null;
      }
      for (const ch of geo.chunks) ch.mb = null;
    }

    updateDetail(cam) {
      const R = this.detailR === undefined ? N.CITY_DETAIL.high.r : this.detailR;
      if (!this.detailer && N.Detail && this.geo) this.detailer = new N.Detail(this.geo);
      const want = [];
      for (const c of this.chunks) {
        const ch = c.ch;
        const dx = Math.max(ch.bx0 - cam.x, 0, cam.x - ch.bx1), dz = Math.max(ch.bz0 - cam.z, 0, cam.z - ch.bz1);
        const d = Math.hypot(dx, dz);
        if (c.det && d > R + 64) { this.freeDetail(c); continue; }
        if (!c.det && ch.blds && d < R) want.push([d, c]);
      }
      if (!want.length || !this.detailer) return;
      want.sort((a, b) => a[0] - b[0]);
      const t0 = performance.now();
      for (const [, c] of want) {
        const mb = this.detailer.chunk(c.ch);
        c.det = { v: mb ? this.makeVao(new Uint8Array(mb.buf, 0, mb.nv * 32), mb.idx.subarray(0, mb.ni), false) : null };
        this.stats.detail = (this.stats.detail || 0) + 1;
        if (performance.now() - t0 > 3) break;
      }
    }

    freeDetail(c) {
      this.freeVao(c.det && c.det.v);
      c.det = null;
    }

    freeVao(v) {
      if (!v) return;
      const gl = this.gl;
      gl.deleteVertexArray(v.vao); gl.deleteBuffer(v.vb); gl.deleteBuffer(v.ib);
    }

    meshVao(mb) {
      return mb && mb.ni ? this.makeVao(new Uint8Array(mb.buf, 0, mb.nv * 32), mb.idx.subarray(0, mb.ni), false) : null;
    }

    updateFlora(cam) {
      const fl = this.geo && this.geo.flora;
      if (!fl) return;
      const R = this.floraR === undefined ? N.FLORA_DETAIL.high.near : this.floraR, GR = this.grassR === undefined ? N.FLORA_DETAIL.high.grass : this.grassR;
      const until = performance.now() + 2.5;
      const dist = ch => Math.hypot(Math.max(ch.bx0 - cam.x, 0, cam.x - ch.bx1), Math.max(ch.bz0 - cam.z, 0, cam.z - ch.bz1));
      let job = this.floraJob;
      if (job && (dist(job.c.ch) > R + 48 || R <= 0)) job = this.floraJob = null;
      if (job && fl.nearStep(job, until)) { job.c.fl = { v: this.meshVao(job.mb) }; job = this.floraJob = null; this.stats.flora = (this.stats.flora || 0) + 1; }
      let best = null, bd = Infinity;
      for (const c of this.chunks) {
        if (!c.ch.flora) continue;
        const d = dist(c.ch);
        if (c.fl && (d > R + 48 || R <= 0)) { this.freeVao(c.fl.v); c.fl = null; continue; }
        if (!c.fl && d < R && d < bd && (!job || job.c !== c)) { bd = d; best = c; }
      }
      if (!job && best && performance.now() < until) {
        const j = fl.nearJob(best.ch);
        j.c = best;
        if (fl.nearStep(j, until)) { best.fl = { v: this.meshVao(j.mb) }; this.stats.flora = (this.stats.flora || 0) + 1; }
        else this.floraJob = j;
      }
      const tiles = this.grassTiles || (this.grassTiles = new Map()), G = fl.G;
      if (this.grassFade !== GR) { for (const t of tiles.values()) this.freeVao(t.v); tiles.clear(); this.grassFade = GR; }
      if (GR <= 0) return;
      for (const [k, t] of tiles) if (Math.hypot(t.x0 + G / 2 - cam.x, t.z0 + G / 2 - cam.z) > GR + G + 24) { this.freeVao(t.v); tiles.delete(k); }
      const r = Math.ceil((GR + G) / G), ix = Math.floor(cam.x / G), iz = Math.floor(cam.z / G), want = [];
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const tx = ix + dx, tz = iz + dz, key = tx + ',' + tz;
        if (tiles.has(key)) continue;
        const d = Math.hypot(Math.max(tx * G - cam.x, 0, cam.x - (tx + 1) * G), Math.max(tz * G - cam.z, 0, cam.z - (tz + 1) * G));
        if (d < GR) want.push([d, tx, tz, key]);
      }
      want.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < want.length; i++) {
        if (i && performance.now() > until) break;
        const [, tx, tz, key] = want[i];
        tiles.set(key, { v: this.meshVao(fl.grass(tx, tz, GR)), x0: tx * G, z0: tz * G });
        this.stats.grass = (this.stats.grass || 0) + 1;
      }
    }

    setPropHidden(p, hidden) {
      const rec = this.geo.brkVerts.get(p);
      if (!rec || !rec.ch.gpu) return false;
      const gl = this.gl, n = rec.v1 - rec.v0;
      let data = null;
      if (hidden) data = new Uint8Array(n * 32);
      else {
        const mb = N.Props.rebuild(this.geo, p, rec.y);
        if (mb.nv !== n) return false;
        data = new Uint8Array(mb.buf, 0, n * 32);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.ch.gpu.vb);
      gl.bufferSubData(gl.ARRAY_BUFFER, rec.v0 * 32, data);
      if (p.type === 'lamp' || p.type === 'globelamp') for (const L of this.geo.lamps) if (L.p === p) L.off = hidden;
      return true;
    }

    resize(w, h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }

    tex2(w, h, fmt, filter) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    fbo(color, depth) {
      const gl = this.gl;
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
      if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      return f;
    }

    freeTargets() {
      const rt = this.rt;
      if (!rt) return;
      const gl = this.gl;
      for (const f of [rt.msaa, rt.res, rt.rays.fbo].concat(rt.bloom.map(b => b.fbo), rt.dof ? [rt.dof.fbo] : [])) gl.deleteFramebuffer(f);
      for (const r of [rt.cRb, rt.dRb]) gl.deleteRenderbuffer(r);
      for (const t of [rt.color, rt.depth, rt.rays.tex].concat(rt.bloom.map(b => b.tex), rt.dof ? [rt.dof.tex] : [])) gl.deleteTexture(t);
      this.rt = null;
    }

    targets(w, h) {
      if (this.rt && this.rt.w === w && this.rt.h === h) return this.rt;
      this.freeTargets();
      const gl = this.gl;
      const fmt = this.hdr ? gl.RGBA16F : gl.RGBA8;
      let samples = Math.min(w * h > 3000000 ? 2 : 4, gl.getParameter(gl.MAX_SAMPLES) || 0);
      const fs = gl.getInternalformatParameter(gl.RENDERBUFFER, fmt, gl.SAMPLES);
      samples = fs && fs.length ? Math.min(samples, fs[0]) : 0;
      const msaa = gl.createFramebuffer();
      const cRb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, cRb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, fmt, w, h);
      const dRb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, dRb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msaa);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cRb);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dRb);
      const okMsaa = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      const color = this.tex2(w, h, fmt, gl.LINEAR);
      const depth = this.tex2(w, h, gl.DEPTH_COMPONENT24, gl.NEAREST);
      const res = this.fbo(color, depth);
      const okRes = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      const bloom = [];
      for (let i = 1; i <= 4; i++) {
        const bw = Math.max(1, w >> i), bh = Math.max(1, h >> i);
        const tex = this.tex2(bw, bh, fmt, gl.LINEAR);
        bloom.push({ w: bw, h: bh, tex, fbo: this.fbo(tex) });
      }
      const rw = Math.max(1, w >> 2), rh = Math.max(1, h >> 2);
      const rtex = this.tex2(rw, rh, fmt, gl.LINEAR);
      const rays = { w: rw, h: rh, tex: rtex, fbo: this.fbo(rtex) };
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.rt = { w, h, samples, msaa, cRb, dRb, color, depth, res, bloom, rays };
      if ((!okMsaa || !okRes) && this.hdr) { this.hdr = false; this.freeTargets(); return this.targets(w, h); }
      return this.rt;
    }

    frustum(vp) {
      const p = [];
      const r = (a, b, c, d) => { const l = Math.hypot(a, b, c); p.push([a / l, b / l, c / l, d / l]); };
      const m = vp;
      r(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
      r(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
      r(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
      r(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
      r(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
      return p;
    }

    boxIn(planes, x0, y0, z0, x1, y1, z1) {
      for (const p of planes) {
        const x = p[0] > 0 ? x1 : x0, y = p[1] > 0 ? y1 : y0, z = p[2] > 0 ? z1 : z0;
        if (p[0] * x + p[1] * y + p[2] * z + p[3] < 0) return false;
      }
      return true;
    }

    packLights(lights) {
      const n = Math.min(N.MAX_LIGHTS, lights.length);
      const pl = this.plBuf, pc = this.pcBuf, pd = this.pdBuf;
      for (let i = 0; i < n; i++) {
        const L = lights[i];
        pl[i * 4] = L.x; pl[i * 4 + 1] = L.y; pl[i * 4 + 2] = L.z; pl[i * 4 + 3] = L.r;
        pc[i * 3] = L.c[0]; pc[i * 3 + 1] = L.c[1]; pc[i * 3 + 2] = L.c[2];
        if (L.d) { pd[i * 4] = L.d[0]; pd[i * 4 + 1] = L.d[1]; pd[i * 4 + 2] = L.d[2]; pd[i * 4 + 3] = L.cos; }
        else { pd[i * 4] = 0; pd[i * 4 + 1] = 0; pd[i * 4 + 2] = 0; pd[i * 4 + 3] = -2; }
      }
      return n;
    }

    setLights(u, n) {
      const gl = this.gl;
      gl.uniform4fv(u.u_pl, this.plBuf);
      gl.uniform3fv(u.u_plc, this.pcBuf);
      if (u.u_pld) gl.uniform4fv(u.u_pld, this.pdBuf);
      gl.uniform1i(u.u_npl, n);
    }

    setFog(u, env, eye) {
      const gl = this.gl;
      gl.uniform3fv(u.u_cam, eye);
      gl.uniform3fv(u.u_fogCol, env.fog);
      gl.uniform4f(u.u_fog, env.fogNear, env.fogFar, env.hfog[0], env.hfog[1]);
      gl.uniform4fv(u.u_fogSun, env.fogSun);
      gl.uniform3fv(u.u_sun, env.sun);
    }

    vpAt(org) {
      if (!org || !org[0] && !org[1] && !org[2]) return this.vp;
      const e = this.eye, t = this.tgt;
      return M4.mul(this.proj, M4.look([e[0] - org[0], e[1] - org[1], e[2] - org[2]], [t[0] - org[0], t[1] - org[1], t[2] - org[2]], [0, 1, 0]));
    }

    origin(u, org) {
      const gl = this.gl;
      const ox = org ? org[0] : 0, oy = org ? org[1] : 0, oz = org ? org[2] : 0;
      if (u.u_eyeL) {
        const e = this.eye;
        gl.uniformMatrix4fv(u.u_vp, false, this.vpEye);
        gl.uniform3f(u.u_eyeL, e[0] - ox, e[1] - oy, e[2] - oz);
      } else gl.uniformMatrix4fv(u.u_vp, false, this.vpAt(org));
      gl.uniform3f(u.u_org, ox, oy, oz);
    }

    setMain(env, eye, vp, nl, time) {
      const gl = this.gl, u = this.main.u;
      gl.useProgram(this.main.p);
      this.origin(u, null);
      this.setFog(u, env, eye);
      gl.uniform3fv(u.u_sunCol, env.sunCol);
      gl.uniform3fv(u.u_sky, env.sky);
      gl.uniform3fv(u.u_gnd, env.gnd);
      gl.uniform3fv(u.u_skyHor, env.skyHor);
      gl.uniform3fv(u.u_skyTop, env.skyTop);
      gl.uniform1f(u.u_night, env.night);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_alpha, 1);
      gl.uniform4f(u.u_rain, env.rain, env.wet, env.puddle, time);
      gl.uniform4fv(u.u_flash, env.flash);
      const wl = Math.hypot(env.wind[0], env.wind[1]) || 1;
      const ws = N.clamp(env.windK / 8, 0, 1.3);
      gl.uniform4f(u.u_wind, env.wind[0] / wl * ws, env.wind[1] / wl * ws, 0.42, 0.18 + 0.22 * (env.gust || 0) * ws);
      gl.uniform2f(u.u_windW, env.wind[0], env.wind[1]);
      if (u.u_push) {
        const pb = this.pushBuf || (this.pushBuf = new Float32Array(16)), pu = this.push || [];
        pb.fill(0);
        for (let i = 0; i < Math.min(4, pu.length); i++) pb.set(pu[i], i * 4);
        gl.uniform4fv(u.u_push, pb);
      }
      this.setLights(u, nl);
      gl.uniform1i(u.u_tex, 0);
      gl.uniform1i(u.u_atlas, 1);
      gl.uniform1i(u.u_mat, 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.matTex);
    }

    drawVao(v, n) {
      const gl = this.gl;
      gl.bindVertexArray(v.vao);
      gl.drawElements(gl.TRIANGLES, n === undefined ? v.n : n, gl.UNSIGNED_INT, 0);
      this.stats.draws++;
      this.stats.tris += (n === undefined ? v.n : n) / 3;
    }

    uploadDyn(v, d) {
      const gl = this.gl;
      gl.bindVertexArray(v.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, v.vb);
      gl.bufferData(gl.ARRAY_BUFFER, d.u8.subarray(0, d.nv * 32), gl.STREAM_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, v.ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.idx.subarray(0, d.ni), gl.STREAM_DRAW);
      v.n = d.ni;
    }

    setSoft(u, soft, W, H, near, far) {
      const gl = this.gl;
      gl.uniform1i(u.u_depth, 3);
      gl.uniform2f(u.u_res, W, H);
      gl.uniform4f(u.u_soft, soft ? 1 : 0, near, far, 0);
    }

    drawSky(env, eye, vp, time) {
      const gl = this.gl, u = this.P.sky.u;
      gl.useProgram(this.P.sky.p);
      gl.uniformMatrix4fv(u.u_ivp, false, M4.inv(vp));
      gl.uniform3fv(u.u_top, env.skyTop);
      gl.uniform3fv(u.u_hor, env.skyHor);
      gl.uniform3fv(u.u_fog, env.fog);
      gl.uniform3fv(u.u_sun, env.sun);
      gl.uniform3fv(u.u_sunCol, env.sunCol);
      gl.uniform3fv(u.u_cam, eye);
      gl.uniform3fv(u.u_moon, env.moon);
      gl.uniform3fv(u.u_glow, env.glow);
      gl.uniform4f(u.u_cloud, env.cloud, env.dark, env.haze, 0);
      gl.uniform2f(u.u_drift, this.drift[0], this.drift[1]);
      gl.uniform1f(u.u_stars, env.stars);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_night, env.night);
      gl.uniform1f(u.u_el, env.el);
      gl.uniform1f(u.u_rainbow, env.rainbow);
      gl.uniform4fv(u.u_flash, env.flash);
      gl.uniform4fv(u.u_bolt, env.bolt);
      gl.depthMask(false);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.depthMask(true);
      this.stats.draws++;
    }

    drawSprites(env, eye, vp, soft, W, H, near, far) {
      const gl = this.gl, u = this.P.sprite.u;
      gl.useProgram(this.P.sprite.p);
      this.origin(u, this.sprites.org);
      this.setFog(u, env, eye);
      this.setSoft(u, soft, W, H, near, far);
      gl.uniform1i(u.u_tex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.ptex);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-2, -2);
      if (this.sprites.n) {
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.uniform1f(u.u_add, 0);
        gl.bindVertexArray(this.sprVao.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sprVao.vb);
        gl.bufferData(gl.ARRAY_BUFFER, this.sprites.f.subarray(0, this.sprites.n * 7), gl.STREAM_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, this.sprites.n);
        this.stats.draws++;
      }
      if (this.addSprites.n) {
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
        gl.uniform1f(u.u_add, 1);
        gl.bindVertexArray(this.addVao.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.addVao.vb);
        gl.bufferData(gl.ARRAY_BUFFER, this.addSprites.f.subarray(0, this.addSprites.n * 7), gl.STREAM_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, this.addSprites.n);
        this.stats.draws++;
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    drawFx(env, eye, vp, soft, W, H, near, far, time) {
      if (!this.fxq.n) return;
      const gl = this.gl, u = this.P.fx.u;
      gl.useProgram(this.P.fx.p);
      this.origin(u, this.fxq.org);
      this.setFog(u, env, eye);
      this.setSoft(u, soft, W, H, near, far);
      gl.uniform3f(u.u_amb, env.sky[0] + env.sunCol[0] * 0.5, env.sky[1] + env.sunCol[1] * 0.5, env.sky[2] + env.sunCol[2] * 0.5);
      gl.uniform1f(u.u_time, time);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.bindVertexArray(this.fxVao.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fxVao.vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.fxq.f.subarray(0, this.fxq.n * 10), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this.fxq.n);
      this.stats.draws++;
    }

    drawRain(env, eye, vp, f, nl, H) {
      const amt = env.interior ? 0 : env.rain;
      if (amt < 0.01) return;
      const gl = this.gl, u = this.P.rain.u;
      gl.useProgram(this.P.rain.p);
      gl.uniformMatrix4fv(u.u_vp, false, vp);
      gl.uniform3fv(u.u_cam, eye);
      gl.uniform3f(u.u_box, 34, 22, 34);
      gl.uniform3f(u.u_vel, env.wind[0] * 0.9, -9.5, env.wind[1] * 0.9);
      gl.uniform3fv(u.u_camVel, this.camVel);
      gl.uniform1f(u.u_time, f.time);
      gl.uniform1f(u.u_len, 0.5);
      gl.uniform1f(u.u_pix, 2 * Math.tan(f.cam.fov / 2) / H);
      gl.uniform1f(u.u_ground, f.ground === undefined ? 0 : f.ground);
      const a = [env.sky[0] * 0.8 + env.skyHor[0] * 0.5 + env.sunCol[0] * 0.15, env.sky[1] * 0.8 + env.skyHor[1] * 0.5 + env.sunCol[1] * 0.15, env.sky[2] * 0.8 + env.skyHor[2] * 0.5 + env.sunCol[2] * 0.15];
      gl.uniform3fv(u.u_amb, a);
      gl.uniform4fv(u.u_flash, env.flash);
      this.setLights(u, nl);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.bindVertexArray(this.rainVao);
      const high = this.quality !== 'low';
      gl.uniform1f(u.u_mode, 0);
      gl.uniform1f(u.u_alpha, 0.34 + 0.2 * amt);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.round(this.rainN * Math.min(1, amt) * (high ? 1 : 0.45)));
      gl.uniform1f(u.u_mode, 1);
      gl.uniform1f(u.u_alpha, 0.9);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.round((high ? 700 : 260) * Math.min(1, amt)));
      this.stats.draws += 2;
    }

    full(prog, fbo, w, h) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog.p);
      return prog.u;
    }

    bloomPass(rt, env, W, H) {
      const gl = this.gl;
      const B = rt.bloom;
      gl.bindVertexArray(this.emptyVao);
      gl.activeTexture(gl.TEXTURE0);
      let u = this.full(this.P.bright, B[0].fbo, B[0].w, B[0].h);
      gl.uniform1i(u.u_src, 0);
      gl.uniform2f(u.u_texel, 1 / W, 1 / H);
      gl.uniform2f(u.u_thr, this.hdr ? 1.0 : 0.82, this.hdr ? 0.5 : 0.25);
      gl.bindTexture(gl.TEXTURE_2D, rt.color);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      for (let i = 1; i < B.length; i++) {
        u = this.full(this.P.down, B[i].fbo, B[i].w, B[i].h);
        gl.uniform1i(u.u_src, 0);
        gl.uniform2f(u.u_texel, 1 / B[i - 1].w, 1 / B[i - 1].h);
        gl.bindTexture(gl.TEXTURE_2D, B[i - 1].tex);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = B.length - 1; i > 0; i--) {
        u = this.full(this.P.up, B[i - 1].fbo, B[i - 1].w, B[i - 1].h);
        gl.uniform1i(u.u_src, 0);
        gl.uniform2f(u.u_texel, 1 / B[i].w, 1 / B[i].h);
        gl.uniform1f(u.u_k, 1);
        gl.bindTexture(gl.TEXTURE_2D, B[i].tex);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gl.disable(gl.BLEND);
      this.stats.draws += B.length * 2;
    }

    raysPass(rt, env, eye, sunUV) {
      const gl = this.gl;
      const u = this.full(this.P.rays, rt.rays.fbo, rt.rays.w, rt.rays.h);
      gl.bindVertexArray(this.emptyVao);
      gl.uniform1i(u.u_src, 0);
      gl.uniform1i(u.u_depth, 1);
      gl.uniform2f(u.u_sunUV, sunUV[0], sunUV[1]);
      gl.uniform1f(u.u_k, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rt.color);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, rt.depth);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.draws++;
    }

    clearTex(fbo, w, h) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    render(f) {
      const gl = this.gl;
      const W = this.canvas.width, H = this.canvas.height;
      const rt = this.targets(W, H);
      const high = this.quality !== 'low';
      this.stats.draws = 0;
      this.stats.tris = 0;
      const env = f.env;
      const cam = f.cam;
      const eye = [cam.x, cam.y, cam.z];
      const near = 0.25, far = Math.max(900, env.fogFar * 3.5);
      const proj = M4.persp(cam.fov, W / H, near, far);
      if (cam.shift) { proj[8] = -cam.shift[0]; proj[9] = -cam.shift[1]; }
      const up = cam.up || UP;
      const view = M4.look(eye, [cam.tx, cam.ty, cam.tz], up);
      const vp = M4.mul(proj, view);
      this.vp = vp;
      this.push = f.push || null;
      this.vpEye = M4.mul(proj, M4.look([0, 0, 0], [cam.tx - eye[0], cam.ty - eye[1], cam.tz - eye[2]], up));
      this.eye = eye;
      this.tgt = [cam.tx, cam.ty, cam.tz];
      this.view = view;
      this.proj = proj;
      const dt = this.lastT === null ? 0 : N.clamp(f.time - this.lastT, 0, 0.1);
      this.lastT = f.time;
      this.drift[0] += env.wind[0] * dt * 0.0011;
      this.drift[1] += env.wind[1] * dt * 0.0011;
      if (this.lastEye && dt > 0) {
        const k = Math.min(1, dt * 8);
        for (let i = 0; i < 3; i++) this.camVel[i] = N.lerp(this.camVel[i], N.clamp((eye[i] - this.lastEye[i]) / dt, -60, 60), k);
      }
      this.lastEye = eye;
      const nl = this.packLights(f.lights);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rt.msaa);
      gl.viewport(0, 0, W, H);
      gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      this.setMain(env, eye, vp, nl, f.time);
      const planes = this.frustum(vp);
      const farD = env.fogFar + 60;
      if (env.interior) {
        const mu = this.main.u;
        this.origin(mu, this.intOrg);
        this.drawVao(this.intVao);
        if (env.metro) for (const s of this.metroVaos) {
          const dx = Math.max(s.x0 - cam.x, 0, cam.x - s.x1), dz = Math.max(s.z0 - cam.z, 0, cam.z - s.z1);
          if (dx * dx + dz * dz > farD * farD || !this.boxIn(planes, s.x0, s.y0, s.z0, s.x1, s.y1, s.z1)) continue;
          this.origin(mu, s.org);
          this.drawVao(s.v);
        }
        this.origin(mu, null);
      } else {
        this.drawVao(this.backVao);
        this.updateDetail(cam);
        this.updateFlora(cam);
        const seen = this.seen || (this.seen = []);
        seen.length = 0;
        for (const c of this.chunks) {
          const dx = Math.max(c.x0 - cam.x, 0, cam.x - c.x1), dz = Math.max(c.z0 - cam.z, 0, cam.z - c.z1);
          if (dx * dx + dz * dz > farD * farD) continue;
          if (!this.boxIn(planes, c.x0, -3, c.z0, c.x1, c.y1 + 2, c.z1)) continue;
          if (c.v) this.drawVao(c.v);
          if (c.det && c.det.v) this.drawVao(c.det.v);
          if (c.fl) { if (c.fl.v) this.drawVao(c.fl.v); }
          else if (c.fv) this.drawVao(c.fv);
          if (c.dv) seen.push(c);
        }
        if (this.grassTiles && this.grassTiles.size) {
          const G = this.geo.flora.G;
          for (const t of this.grassTiles.values()) if (t.v && this.boxIn(planes, t.x0, -3, t.z0, t.x0 + G, 4, t.z0 + G)) this.drawVao(t.v);
        }
        if (seen.length) {
          gl.depthMask(false);
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(-1, -1);
          for (const c of seen) this.drawVao(c.dv);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.depthMask(true);
        }
      }
      if (this.dyn.nv) { this.origin(this.main.u, this.dyn.org); this.uploadDyn(this.dynVao, this.dyn); this.drawVao(this.dynVao); this.origin(this.main.u, null); }
      if (!env.interior) this.drawSky(env, eye, vp, f.time);
      if (high || f.photo && f.photo.dof) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.msaa);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rt.res);
        gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.msaa);
      }
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, rt.depth);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      if (this.glass.nv) {
        gl.useProgram(this.main.p);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        this.origin(this.main.u, this.glass.org);
        this.uploadDyn(this.glassVao, this.glass);
        gl.uniform1f(this.main.u.u_alpha, 0.62);
        this.drawVao(this.glassVao);
        this.origin(this.main.u, null);
      }
      this.drawSprites(env, eye, vp, high, W, H, near, far);
      this.drawFx(env, eye, vp, high, W, H, near, far, f.time);
      this.drawRain(env, eye, vp, f, nl, H);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.msaa);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rt.res);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      const P = env.post;
      let raysK = 0;
      if (high) {
        this.bloomPass(rt, env, W, H);
        const sx = eye[0] + env.sun[0] * 1000, sy = eye[1] + env.sun[1] * 1000, sz = eye[2] + env.sun[2] * 1000;
        const cw = vp[3] * sx + vp[7] * sy + vp[11] * sz + vp[15];
        if (P.rays > 0.01 && cw > 0 && !env.interior) {
          const su = [(vp[0] * sx + vp[4] * sy + vp[8] * sz + vp[12]) / cw * 0.5 + 0.5, (vp[1] * sx + vp[5] * sy + vp[9] * sz + vp[13]) / cw * 0.5 + 0.5];
          if (su[0] > -0.6 && su[0] < 1.6 && su[1] > -0.6 && su[1] < 1.6) { this.raysPass(rt, env, eye, su); raysK = P.rays * 0.9; }
        }
      } else if (!this.cleared) {
        for (const b of rt.bloom) this.clearTex(b.fbo, b.w, b.h);
        this.clearTex(rt.rays.fbo, rt.rays.w, rt.rays.h);
      }
      this.cleared = !high;
      if (!raysK && high) this.clearTex(rt.rays.fbo, rt.rays.w, rt.rays.h);
      const dof = f.photo && f.photo.dof;
      if (dof) this.dofPass(rt, dof, W, H, near, far);
      this.composite(rt, env, f, W, H, near, far, high, raysK, proj, view, cam, dof ? rt.dof.tex : rt.color);
      gl.bindVertexArray(null);
    }

    dofPass(rt, dof, W, H, near, far) {
      const gl = this.gl;
      if (!rt.dof) {
        const tex = this.tex2(W, H, this.hdr ? gl.RGBA16F : gl.RGBA8, gl.LINEAR);
        rt.dof = { tex, fbo: this.fbo(tex) };
      }
      const u = this.full(this.P.dof, rt.dof.fbo, W, H);
      gl.bindVertexArray(this.emptyVao);
      gl.uniform1i(u.u_src, 0);
      gl.uniform1i(u.u_depth, 1);
      gl.uniform2f(u.u_res, W, H);
      gl.uniform2f(u.u_nf, near, far);
      gl.uniform4f(u.u_dof, dof.k, dof.focus, dof.max, dof.step);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rt.color);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, rt.depth);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.draws++;
    }

    composite(rt, env, f, W, H, near, far, high, raysK, proj, view, cam, scene) {
      const gl = this.gl;
      const P = env.post;
      const u = this.full(this.P.comp, null, W, H);
      gl.bindVertexArray(this.emptyVao);
      gl.uniform1i(u.u_scene, 0);
      gl.uniform1i(u.u_depth, 1);
      gl.uniform1i(u.u_bloom, 2);
      gl.uniform1i(u.u_rays, 3);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene || rt.color);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, rt.depth);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, rt.bloom[0].tex);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, rt.rays.tex);
      gl.uniform2f(u.u_res, W, H);
      gl.uniform1f(u.u_time, f.time);
      gl.uniformMatrix4fv(u.u_proj, false, proj);
      gl.uniformMatrix4fv(u.u_iproj, false, M4.inv(proj));
      gl.uniformMatrix4fv(u.u_view, false, view);
      gl.uniform2f(u.u_nf, near, far);
      gl.uniform3fv(u.u_skyHor, env.skyHor);
      gl.uniform3fv(u.u_skyTop, env.skyTop);
      gl.uniform3fv(u.u_sunCol, env.sunCol);
      const rl = 0.25 + env.sky[1] * 0.6 + env.night * 0.05;
      gl.uniform3f(u.u_rainCol, rl * 0.9, rl * 0.95, rl);
      gl.uniform2f(u.u_rainDir, N.clamp(env.wind[0] * 0.08, -0.6, 0.6), 0);
      const outside = !env.interior;
      gl.uniform4f(u.u_feat, high && outside ? 1 : 0, high ? P.bloom : 0, high ? raysK : 0, high && outside ? env.rain * 0.55 : 0);
      const ph = f.photo || null, fm = ph && ph.film && ph.film.id !== 'life' ? ph.film : null;
      gl.uniform4f(u.u_grade, P.exposure * (ph ? ph.ev : 1), P.sat, P.contrast, P.vignette);
      gl.uniform4f(u.u_pf, fm ? 1 : 0, fm && fm.mono ? 1 : 0, fm && fm.vhs ? 1 : 0, 0);
      gl.uniform4f(u.u_pg, fm && fm.sat !== undefined ? fm.sat : 1, fm && fm.con !== undefined ? fm.con : 1, fm ? fm.fade || 0 : 0, fm ? fm.grain || 0 : 0);
      gl.uniform3fv(u.u_pts, fm && fm.sh ? fm.sh : ONE3);
      gl.uniform3fv(u.u_pth, fm && fm.hi ? fm.hi : ONE3);
      gl.uniform1f(u.u_pvig, fm ? fm.vig || 0 : 0);
      gl.uniform3fv(u.u_lift, P.lift);
      gl.uniform3fv(u.u_gain, P.gain);
      gl.uniform4f(u.u_fx, high && outside && !cam.scope ? P.lens : 0, high ? P.heat : 0, env.flash[3] * 0.35, P.grain);
      const wb = this.waveBuf;
      wb.fill(0);
      const tanH = Math.tan(cam.fov / 2);
      let wi = 0;
      for (const w of f.waves || []) {
        if (wi >= 4 || !high) break;
        const m = this.vp;
        const cw = m[3] * w.x + m[7] * w.y + m[11] * w.z + m[15];
        if (cw < 0.5) continue;
        const age = w.t / w.life;
        wb[wi * 4] = (m[0] * w.x + m[4] * w.y + m[8] * w.z + m[12]) / cw * 0.5 + 0.5;
        wb[wi * 4 + 1] = (m[1] * w.x + m[5] * w.y + m[9] * w.z + m[13]) / cw * 0.5 + 0.5;
        wb[wi * 4 + 2] = (2 + 26 * age) / (cw * tanH) * 0.5;
        wb[wi * 4 + 3] = (1 - age) * (1 - age) * w.s;
        wi++;
      }
      gl.uniform4fv(u.u_waves, wb);
      const d = f.death || null;
      gl.uniform4f(u.u_death, d ? d.k : 0, d ? d.tint[0] : 0, d ? d.tint[1] : 0, d ? d.tint[2] : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.draws++;
    }

    project(x, y, z) {
      const m = this.vp;
      if (!m) return null;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
      const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
      const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.1) return null;
      return { x: (cx / cw * 0.5 + 0.5) * this.canvas.width, y: (1 - (cy / cw * 0.5 + 0.5)) * this.canvas.height, d: cw };
    }

    destroy() {
      this.freeTargets();
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  N.surfaceTable = () => {
    const out = new Uint8Array(256 * 4);
    (N.TEX_NAMES || []).forEach((name, i) => {
      if (i >= 256) return;
      const m = N.SURFACE[name] || SURF_DEFAULT;
      out[i * 4] = Math.round(m[0] * 255);
      out[i * 4 + 1] = Math.round(m[1] * 255);
      out[i * 4 + 2] = Math.round(m[2] * 255);
      out[i * 4 + 3] = Math.round(m[3] * 255);
    });
    return out;
  };

  N.rebaseMesh = (mb, org) => {
    const F = mb.f;
    for (let i = 0; i < mb.nv; i++) { const o = i * 8; F[o] -= org[0]; F[o + 1] -= org[1]; F[o + 2] -= org[2]; }
    return mb;
  };

  N.Renderer = Renderer;
  N.Dyn = Dyn;
  N.FxQuads = FxQuads;
  N.Sprites = Sprites;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
