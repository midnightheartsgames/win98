(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac, mesh, spherePatch } = K;
  const { Anime, basePose, gesture, LOOKS } = window.HayatoCast;
  const UI = window.HayatoUI;

  const DURATION = 774.74;
  const FW = 480;
  const FH = 270;
  const TW = 1024;
  const TH = 576;

  const SCRIPT = window.HayatoScript;
  const VOICE = K.envelope(SCRIPT.voice, 20);
  const LIST = (window.HayatoScriptA || []).concat(window.HayatoScriptB || []).sort((a, b) => a[0] - b[0]);

  const SHOTS = LIST.map(([start, scene, o], i, all) => ({
    index: i,
    start,
    end: i + 1 < all.length ? all[i + 1][0] : DURATION,
    scene,
    o: o || {}
  }));

  function shotAt(t) {
    let lo = 0, hi = SHOTS.length - 1;
    const tt = clamp(t, 0, DURATION);
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (SHOTS[mid].start <= tt) lo = mid; else hi = mid - 1;
    }
    return SHOTS[lo];
  }

  const ENVS = {
    room: { sunDir: [-0.3, -1, -0.6], sunColor: [0.35, 0.35, 0.36], ambTop: [0.95, 0.95, 0.98], ambBottom: [0.7, 0.7, 0.74], fogColor: [0.9, 0.9, 0.92], fogNear: 30, fogFar: 60 },
    dark: { sunDir: [-0.3, -1, -0.6], sunColor: [0.4, 0.4, 0.5], ambTop: [0.6, 0.62, 0.75], ambBottom: [0.3, 0.3, 0.4], fogColor: [0.08, 0.1, 0.2], fogNear: 30, fogFar: 60 },
    day: { sunDir: [0.6, -1, -0.2], sunColor: [0.55, 0.5, 0.42], ambTop: [0.82, 0.8, 0.74], ambBottom: [0.5, 0.46, 0.4], fogColor: [0.88, 0.86, 0.78], fogNear: 20, fogFar: 50 },
    night: { sunDir: [0.3, -1, -0.3], sunColor: [0.25, 0.22, 0.18], ambTop: [0.38, 0.35, 0.32], ambBottom: [0.2, 0.18, 0.18], fogColor: [0.08, 0.07, 0.07], fogNear: 12, fogFar: 30, points: [{ pos: [0, 2.2, -3.2], color: [1.2, 1.0, 0.75] }] },
    snow: { sunDir: [0.4, -1, -0.3], sunColor: [0.4, 0.44, 0.52], ambTop: [0.62, 0.68, 0.82], ambBottom: [0.4, 0.44, 0.56], fogColor: [0.3, 0.36, 0.5], fogNear: 12, fogFar: 36 },
    yard: { sunDir: [0.4, -1, 0.2], sunColor: [0.5, 0.36, 0.22], ambTop: [0.34, 0.38, 0.56], ambBottom: [0.3, 0.24, 0.24], fogColor: [0.1, 0.12, 0.22], fogNear: 12, fogFar: 34, points: [{ pos: [-4, 2, -8], color: [1.4, 0.7, 0.2] }, { pos: [5, 2, -9], color: [1.2, 0.6, 0.2] }] },
    street: { sunDir: [0.3, -1, 0.4], sunColor: [0.3, 0.3, 0.4], ambTop: [0.36, 0.4, 0.58], ambBottom: [0.26, 0.24, 0.3], fogColor: [0.1, 0.12, 0.2], fogNear: 12, fogFar: 34, points: [{ pos: [0, 3, -9], color: [1, 0.8, 0.5] }] },
    plaza: { sunDir: [0.5, -1, -0.4], sunColor: [0.6, 0.56, 0.48], ambTop: [0.78, 0.8, 0.86], ambBottom: [0.5, 0.48, 0.46], fogColor: [0.74, 0.8, 0.9], fogNear: 18, fogFar: 44 },
    station: { sunDir: [0, -1, -0.2], sunColor: [0.3, 0.34, 0.44], ambTop: [0.6, 0.7, 0.92], ambBottom: [0.3, 0.34, 0.48], fogColor: [0.08, 0.1, 0.2], fogNear: 14, fogFar: 32 },
    space: { sunDir: [0.3, -0.6, -0.8], sunColor: [0.6, 0.62, 0.8], ambTop: [0.6, 0.64, 0.86], ambBottom: [0.3, 0.3, 0.5], fogColor: [0.02, 0.03, 0.1], fogNear: 60, fogFar: 90 },
    gold: { sunDir: [0, -0.4, -1], sunColor: [0.8, 0.7, 0.5], ambTop: [0.9, 0.8, 0.6], ambBottom: [0.5, 0.4, 0.3], fogColor: [0.2, 0.14, 0.06], fogNear: 12, fogFar: 30 },
    studio: { sunDir: [0.4, -0.7, -0.6], sunColor: [0.55, 0.55, 0.55], ambTop: [0.85, 0.85, 0.88], ambBottom: [0.5, 0.5, 0.55], fogColor: [0, 0, 0], fogNear: 50, fogFar: 90 }
  };

  const ARENA = {
    snow: { set: 'snow', tex: 'snow', env: 'snow' },
    yard: { set: 'yard', tex: 'cobble', env: 'yard', crystals: true },
    street: { set: 'street', tex: 'cobble', env: 'street' },
    market: { set: 'street', tex: 'cobble', env: 'street', stalls: true },
    alley: { set: 'street', tex: 'cobble', env: 'street' },
    town: { set: 'plaza', tex: 'cobble', env: 'plaza' },
    plaza: { set: 'plaza', tex: 'cobble', env: 'plaza' },
    mine: { set: 'yard', tex: 'cobble', env: 'yard', crystals: true },
    slum: { set: 'snow', tex: 'snow', env: 'street' },
    station: { set: 'station', tex: 'metal', env: 'station' },
    office: { set: 'station', tex: 'metal', env: 'station' },
    su: { set: 'station', tex: 'metal', env: 'space' },
    gold: { set: null, tex: null, env: 'gold' },
    space: { set: null, tex: null, env: 'space' }
  };

  const PARTY_COLOR = { bronya: '#c8c4d6', asta: '#d24f76', tingyun: '#a0684a', yukong: '#2f8e9c', robin: '#9cc2ea', march: '#f0a0bf', caelus: '#b6b6be', himeko: '#b8342a', archer: '#d8d8d8', firefly: '#9ea6b4', hayato: '#34506e', redscythe: '#c8302a' };

  const FOES = {
    guard: { cast: 'guard' },
    gepard: { cast: 'gepard', scale: 1.05 },
    vagrant: { cast: 'vagrant' },
    fireKnight: { cast: 'guard', tint: [1.4, 0.7, 0.35], scale: 1.25 },
    iceKnight: { cast: 'guard', tint: [0.55, 0.85, 1.4], scale: 1.25 },
    darkGuard: { cast: 'guard', tint: [0.35, 0.35, 0.42] },
    redKnight: { cast: 'guard', tint: [1.3, 0.45, 0.4], scale: 1.4 },
    grizzly: { mesh: 'grizzly', h: 2.6 },
    wolf: { mesh: 'wolf', h: 1.4 },
    flame: { mesh: 'flame', h: 1.8, glow: true },
    crimson: { mesh: 'flame', h: 1.8, glow: true, tint: [1.1, 0.25, 0.35] },
    mantisSmall: { mesh: 'mantis', h: 1.6, scale: 0.5 },
    svarog: { mesh: 'svarog', h: 3.6 },
    mantis: { mesh: 'mantis', h: 3.0 },
    spirit: { mesh: 'spirit', h: 1.3, glow: true },
    mech: { prop: 'mech', h: 2.8 },
    spider: { mesh: 'spiderBot', h: 2.6, scale: 2.4 },
    dog: { prop: 'dog', h: 0.9, lift: 0.6 }
  };

  function camFor(eye, at, fov, t, shake) {
    const w = K.wobble(t, shake === undefined ? 0.01 : shake, 1.7);
    return { eye: V3.add(eye, w), at: V3.add(at, V3.mul(w, 0.5)), fov: fov || 40, near: 0.05, far: 90 };
  }

  function talking(t) {
    const v = VOICE(t);
    return v > 0.35 ? (S(t * 23) > -0.2 ? 'open' : 'talk') : v > 0.15 ? 'talk' : null;
  }

  function hostPose(t, o, x, z, ry, span) {
    const p = basePose(x, z, ry);
    const local = t - span[0];
    const sway = S(t * 1.3) * 0.04;
    p.spine = [0.03 + S(t * 0.9) * 0.015, sway * 0.5, sway * 0.4];
    p.neck = [0.05 + S(t * 1.7) * 0.03, S(t * 0.8) * 0.08 + (o.look || 0), S(t * 1.1) * 0.06 + (o.tilt || 0)];
    p.shL = [0.12, 0, 0.18];
    p.shR = [0.12, 0, 0.18];
    p.elL = [0.45, 0, 0];
    p.elR = [0.45, 0, 0];
    const gs = o.g ? (Array.isArray(o.g) ? o.g : [o.g]) : [];
    if (gs.length) {
      const seg = Math.min(gs.length - 1, Math.floor((local / Math.max(0.1, span[1] - span[0])) * gs.length));
      gesture(p, gs[seg], local);
    }
    const talk = talking(t);
    const blink = frac(t * 0.29 + 0.13) < 0.035;
    p.face = talk ? (o.face === 'happy' ? 'happy' : talk) : blink ? 'blink' : (o.face || 'smile');
    return p;
  }

  function aimAt(head, frame) {
    const F = {
      face: [0, 0.62, 0.0, 30],
      bust: [-0.1, 0.78, 0.02, 34],
      waist: [-0.2, 1.05, 0.03, 36],
      thigh: [-0.32, 1.35, 0.05, 38],
      full: [-0.62, 2.6, 0.08, 38]
    }[frame] || [-0.2, 1.05, 0.03, 36];
    return { at: [head[0] + F[2] * 0, head[1] + F[0], head[2]], dist: F[1], fov: F[3] };
  }

  function project(r, p) {
    const m = r.viewProj;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [(x / w * 0.5 + 0.5) * FW, (0.5 - y / w * 0.5) * FH, w];
  }

  function buildFoes(r) {
    const metal = [0.36, 0.44, 0.7, 0.05];
    const dark = [0.2, 0.22, 0.3, 0.05];
    return {
      grizzly: mesh(r, b => {
        const purple = [0.52, 0.54, 0.86, 0.08];
        const deep = [0.34, 0.35, 0.62, 0.05];
        b.at(0, 1.45, 0, h => h.ellipsoid(0.85, 0.75, 0.65, 12, 8, purple));
        b.at(0, 2.35, 0.3, h => h.ellipsoid(0.5, 0.42, 0.45, 10, 7, purple));
        [-1, 1].forEach(s => b.at(s * 0.32, 2.72, 0.2, h => h.ellipsoid(0.14, 0.14, 0.08, 6, 4, deep)));
        b.at(0, 2.25, 0.7, h => h.ellipsoid(0.2, 0.14, 0.14, 8, 5, deep));
        b.at(0, 2.42, 0.72, h => h.box(0.5, 0.1, 0.05, [1, 0.4, 0.2, 1]));
        [-1, 1].forEach(s => {
          K.tube(b, [[s * 0.8, 1.9, 0.1], [s * 1.05, 1.3, 0.3], [s * 0.95, 0.8, 0.5]], [0.26, 0.22, 0.2], 8, deep);
          b.at(s * 0.95, 0.72, 0.55, h => h.ellipsoid(0.22, 0.16, 0.24, 6, 4, purple));
          b.at(s * 0.45, 0, 0, h => h.prism(8, 0.26, 0.28, 0, 0.3, 0.3, 0.9, deep, { capBottom: true }));
        });
      }),
      spiderBot: mesh(r, b => {
        const shell = [0.42, 0.44, 0.74, 0.02];
        const joint = [0.26, 0.3, 0.38, 0.05];
        b.at(0, 0.7, -0.15, h => h.ellipsoid(0.55, 0.32, 0.65, 10, 7, shell));
        b.at(0, 0.72, 0.5, h => h.ellipsoid(0.3, 0.24, 0.28, 8, 6, shell));
        [-1, 1].forEach(s => b.at(s * 0.11, 0.78, 0.76, h => h.ellipsoid(0.05, 0.05, 0.03, 5, 3, [1, 0.15, 0.15, 1])));
        for (let i = 0; i < 4; i++) [-1, 1].forEach(s => {
          const z = 0.35 - i * 0.28;
          K.tube(b, [[s * 0.35, 0.72, z], [s * 0.85, 1.05, z + 0.05], [s * 1.2, 0, z + 0.1]], [0.06, 0.05, 0.02], 5, joint);
        });
      }),
      wolf: mesh(r, b => {
        b.at(0, 0.9, 0, h => h.box(0.6, 0.5, 1.4, metal));
        b.at(0, 1.1, 0.85, h => h.box(0.4, 0.4, 0.5, metal));
        [[-0.25, 0.5], [0.25, 0.5], [-0.25, -0.5], [0.25, -0.5]].forEach(([x, z]) => b.at(x, 0, z, h => h.box(0.14, 0.7, 0.14, dark, { base: true })));
      }),
      flame: mesh(r, b => {
        const g = rand(3);
        for (let i = 0; i < 7; i++) {
          b.push(M4.translate((g() - 0.5) * 0.6, 0.2, (g() - 0.5) * 0.4), M4.rotZ((g() - 0.5) * 0.8));
          b.prism(4, 0.18, 0.14, 0, 0.02, 0.02, 1.0 + g() * 0.9, [1, 0.5, 0.12, 1], { topColor: [1, 0.9, 0.4, 1] });
          b.pop();
        }
        b.at(0, 1.2, 0, h => h.ellipsoid(0.3, 0.35, 0.3, 8, 5, [1, 0.3, 0.1, 1]));
      }),
      spirit: mesh(r, b => {
        b.at(0, 0.8, 0, h => h.ellipsoid(0.45, 0.5, 0.45, 8, 6, [0.5, 1, 0.7, 1]));
        b.at(0, 0.3, 0, h => h.prism(6, 0.3, 0.3, -0.3, 0.02, 0.02, 0.2, [0.3, 0.9, 0.6, 1]));
      }),
      svarog: mesh(r, b => {
        b.at(0, 2.2, 0, h => h.box(1.8, 1.8, 1.2, [0.24, 0.24, 0.32, 0.05]));
        b.at(0, 3.4, 0.2, h => h.box(0.8, 0.6, 0.7, [0.3, 0.3, 0.4, 0.05]));
        b.at(0, 3.45, 0.56, h => h.box(0.5, 0.1, 0.05, [1, 0.1, 0.2, 1]));
        [-1, 1].forEach(s => {
          b.at(s * 1.3, 2.2, 0.2, h => h.box(0.7, 1.8, 0.8, [0.2, 0.2, 0.28, 0.05]));
          b.at(s * 1.35, 1.1, 0.5, h => h.box(0.6, 0.9, 0.6, [0.3, 0.34, 0.5, 0.05]));
          b.at(s * 0.55, 0, 0, h => h.box(0.6, 1.3, 0.7, [0.18, 0.18, 0.24, 0.05], { base: true }));
        });
      }),
      mantis: mesh(r, b => {
        const green = [0.3, 0.9, 0.6, 0.5];
        b.at(0, 1.6, 0, h => h.ellipsoid(0.6, 0.8, 1.1, 8, 6, [0.18, 0.4, 0.34, 0.1]));
        b.at(0, 2.6, 0.8, h => h.ellipsoid(0.4, 0.4, 0.5, 8, 5, [0.2, 0.5, 0.4, 0.1]));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.5, 2.2, 0.4), M4.rotZ(s * 0.6), M4.rotX(-0.8));
          b.prism(4, 0.14, 0.08, 0, 0.02, 0.02, 1.8, green);
          b.pop();
          for (let i = 0; i < 3; i++) {
            b.push(M4.translate(s * 0.4, 1.2, 0.6 - i * 0.6), M4.rotZ(s * 2.3));
            b.prism(4, 0.08, 0.08, 0, 0.03, 0.03, 1.4, [0.16, 0.3, 0.26, 0.1]);
            b.pop();
          }
          b.push(M4.translate(s * 0.3, 2.3, -0.4), M4.rotZ(s * 0.3), M4.rotX(0.4));
          b.prism(4, 0.3, 0.05, 0, 0.02, 0.02, 1.4, green);
          b.pop();
        });
      })
    };
  }

  function emojiFace(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.fillStyle = '#1a1208';
      ctx.strokeStyle = '#1a1208';
      ctx.lineWidth = 9;
      const eyes = (fn) => [84, 172].forEach((x, i) => fn(x, i));
      if (kind === 'nerd') {
        ctx.lineWidth = 10;
        eyes(x => { ctx.beginPath(); ctx.arc(x, 110, 34, 0, PI * 2); ctx.stroke(); });
        ctx.beginPath();
        ctx.moveTo(118, 110);
        ctx.lineTo(138, 110);
        ctx.stroke();
        eyes(x => { ctx.beginPath(); ctx.arc(x, 112, 12, 0, PI * 2); ctx.fill(); });
        ctx.beginPath();
        ctx.arc(128, 170, 30, 0.1 * PI, 0.9 * PI);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(112, 196, 14, 22);
        ctx.fillRect(130, 196, 14, 22);
      } else if (kind === 'grin' || kind === 'laugh' || kind === 'angry') {
        eyes((x, i) => {
          ctx.beginPath();
          if (kind === 'laugh') ctx.arc(x, 110, 20, PI * 1.1, PI * 1.9);
          else {
            ctx.moveTo(x - 24, 82 + (i ? -8 : 8) * (kind === 'angry' ? -1 : 1));
            ctx.lineTo(x + 24, 82 + (i ? 8 : -8) * (kind === 'angry' ? -1 : 1));
          }
          ctx.stroke();
          if (kind !== 'laugh') { ctx.beginPath(); ctx.arc(x, 112, 11, 0, PI * 2); ctx.fill(); }
        });
        ctx.beginPath();
        ctx.moveTo(62, 150);
        ctx.quadraticCurveTo(128, 250, 194, 150);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(76, 152, 104, 18);
        ctx.fillStyle = '#e0505a';
        ctx.beginPath();
        ctx.ellipse(128, 200, 30, 14, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'bulge' || kind === 'buck') {
        const buck = kind === 'buck';
        eyes(x => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(x, 104, 38, 44, 0, 0, PI * 2);
          ctx.fill();
          ctx.stroke();
          if (buck) {
            ctx.fillStyle = '#3a8ae0';
            ctx.beginPath();
            ctx.arc(x + 6, 110, 18, 0, PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#1a1208';
          ctx.beginPath();
          ctx.arc(x + 6, 110, buck ? 9 : 8, 0, PI * 2);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.moveTo(70, 168);
        ctx.quadraticCurveTo(128, 236, 186, 168);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        if (buck) {
          ctx.fillRect(108, 168, 18, 30);
          ctx.fillRect(130, 168, 18, 30);
        } else {
          ctx.fillRect(80, 170, 96, 14);
          ctx.fillStyle = '#e0505a';
          ctx.beginPath();
          ctx.ellipse(128, 202, 28, 13, 0, 0, PI * 2);
          ctx.fill();
        }
      } else if (kind === 'sad') {
        eyes(x => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(x, 110, 26, 30, 0, 0, PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a1208';
          ctx.beginPath();
          ctx.arc(x, 124, 13, 0, PI * 2);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(128, 206, 30, 1.15 * PI, 1.85 * PI);
        ctx.stroke();
      } else if (kind === 'tongue') {
        eyes(x => { ctx.beginPath(); ctx.ellipse(x, 104, 12, 22, 0, 0, PI * 2); ctx.fill(); });
        ctx.beginPath();
        ctx.arc(128, 150, 50, 0.1 * PI, 0.9 * PI);
        ctx.stroke();
        ctx.fillStyle = '#e0505a';
        ctx.beginPath();
        ctx.ellipse(150, 200, 22, 28, 0.3, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'roll') {
        eyes(x => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(x, 110, 28, 32, 0, 0, PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a1208';
          ctx.beginPath();
          ctx.arc(x, 88, 11, 0, PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(106, 188, 44, 14);
      } else if (kind === 'x') {
        ctx.fillRect(64, 90, 40, 40);
        ctx.fillRect(152, 90, 40, 40);
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(108, 170);
        ctx.lineTo(148, 210);
        ctx.moveTo(148, 170);
        ctx.lineTo(108, 210);
        ctx.stroke();
      } else if (kind === 'pixel') {
        ctx.fillRect(64, 90, 40, 40);
        ctx.fillRect(152, 90, 40, 40);
        ctx.fillRect(84, 180, 88, 20);
        ctx.fillRect(64, 160, 20, 20);
        ctx.fillRect(172, 160, 20, 20);
      } else {
        eyes(x => { ctx.beginPath(); ctx.ellipse(x, 110, 11, 20, 0, 0, PI * 2); ctx.fill(); });
        ctx.beginPath();
        ctx.arc(128, 150, 50, 0.15 * PI, 0.85 * PI);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function cardFace(look) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    window.HayatoCast.faceDrawer(look, 'smile')(c.getContext('2d'), 128, 128);
    return c;
  }

  function cardArt(o) {
    const art = o.art || 'bronya';
    const look = LOOKS[art];
    return (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      const palettes = { jelly: ['#1a2a5a', '#6ac8e8'], horse: ['#0e2a1c', '#4a8a5a'], tea: ['#3a2a4a', '#c8a4d8'] };
      const pal = palettes[art] || ['#1a2250', '#6a8ad8'];
      g.addColorStop(0, pal[0]);
      g.addColorStop(1, pal[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const hex = (n) => '#' + (n & 0xffffff).toString(16).padStart(6, '0');
      if (look) {
        ctx.fillStyle = hex(look.hair);
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.36, w * 0.28, h * 0.22, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = hex(look.skin);
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.4, w * 0.18, h * 0.14, 0, 0, PI * 2);
        ctx.fill();
        ctx.drawImage(cardFace(look), w / 2 - w * 0.18, h * 0.4 - h * 0.14, w * 0.36, h * 0.28);
        ctx.fillStyle = hex(look.top);
        ctx.fillRect(w * 0.24, h * 0.56, w * 0.52, h * 0.44);
      } else if (art === 'jelly') {
        ctx.fillStyle = 'rgba(200,240,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.35, w * 0.3, h * 0.16, 0, PI, 0);
        ctx.fill();
        for (let i = 0; i < 6; i++) ctx.fillRect(w * 0.25 + i * w * 0.1, h * 0.35, 4, h * 0.4);
      } else if (art === 'horse') {
        ctx.fillStyle = '#f2f2ee';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.55, w * 0.28, h * 0.12, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillRect(w * 0.62, h * 0.3, w * 0.1, h * 0.26);
      } else if (art === 'tea') {
        const sky = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.5);
        sky.addColorStop(0, '#f0b070');
        sky.addColorStop(1, '#8a6ab0');
        ctx.fillStyle = sky;
        ctx.fillRect(w * 0.14, h * 0.08, w * 0.72, h * 0.42);
        ctx.strokeStyle = '#4a3050';
        ctx.lineWidth = 6;
        ctx.strokeRect(w * 0.14, h * 0.08, w * 0.72, h * 0.42);
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.08);
        ctx.lineTo(w / 2, h * 0.5);
        ctx.stroke();
        ctx.fillStyle = '#6a4a3a';
        ctx.fillRect(0, h * 0.66, w, h * 0.08);
        ctx.fillStyle = '#f4ece0';
        [[0.28, 0.6], [0.72, 0.6]].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.ellipse(w * cx, h * cy, w * 0.1, h * 0.05, 0, 0, PI);
          ctx.fill();
          ctx.fillRect(w * (cx - 0.1), h * (cy - 0.03), w * 0.2, h * 0.03);
          ctx.beginPath();
          ctx.ellipse(w * cx, h * 0.66, w * 0.14, h * 0.015, 0, 0, PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#e8d8f0';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.58, w * 0.13, h * 0.08, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillRect(w * 0.47, h * 0.47, w * 0.06, h * 0.04);
        ctx.strokeStyle = '#e8d8f0';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(w * 0.62, h * 0.58);
        ctx.lineTo(w * 0.7, h * 0.52);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        [0.26, 0.3, 0.7, 0.74].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(w * x, h * 0.55);
          ctx.quadraticCurveTo(w * (x + 0.03), h * 0.5, w * x, h * 0.45);
          ctx.stroke();
        });
      } else {
        ctx.fillStyle = '#f2e6d8';
        ctx.beginPath();
        ctx.arc(w * 0.35, h * 0.45, w * 0.12, 0, PI * 2);
        ctx.arc(w * 0.65, h * 0.45, w * 0.12, 0, PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = o.gold ? '#f2d06a' : o.purple ? '#b884ff' : '#8ab8ff';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
    };
  }

  function resultLabel(o) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#d8d8e8';
      ctx.font = '26px Arial, sans-serif';
      ctx.fillText('Световой конус', 70, h * 0.62);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.fillText(o.title || '', 70, h * 0.62 + 36);
      ctx.fillStyle = '#f2d06a';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText('★'.repeat(o.stars || 3), 70, h * 0.62 + 88);
      if (o.isNew) {
        ctx.fillStyle = '#f0802a';
        ctx.fillRect(70, h * 0.62 - 40, 90, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Новое', 82, h * 0.62 - 36);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Бонус: Неугасаемый звёздный свет +40', w - 420, h - 60);
    };
  }

  function create(r) {
    const gl = r.gl;
    const X = window.HayatoSets.buildSets(r);
    const T = X.T;
    const foes = buildFoes(r);
    const zoo = (window.youvidClips || []).find(c => c.buildElephant);
    const elephant = zoo ? mesh(r, b => zoo.buildElephant(b, true)) : null;
    const cast = {};
    const castOf = (key) => {
      if (!cast[key]) cast[key] = new Anime(r, LOOKS[key] ? key : 'hayato');
      return cast[key];
    };
    const emoji = {};
    ['nerd', 'grin', 'laugh', 'sad', 'angry', 'tongue', 'roll', 'x', 'pixel', 'smile', 'happy', 'minion', 'bulge', 'buck'].forEach(k => { emoji[k] = r.texture(128, emojiFace(k), { clamp: true, nearest: k === 'pixel' || k === 'x' }); });
    const tex = {};
    const texOf = (key, fn, w, h, opts) => {
      if (!tex[key]) tex[key] = r.texture(w || TW, fn, Object.assign({ height: h || TH, clamp: true }, opts || {}));
      return tex[key];
    };
    const ov = K.overlay(r, FW, FH);
    const chair = mesh(r, b => {
      const g = [0.62, 0.62, 0.64, 0.05];
      b.at(0, 0.45, 0, h => h.box(0.5, 0.05, 0.48, g));
      b.at(0, 0.75, -0.24, h => { h.push(M4.rotX(-0.15)); h.box(0.5, 0.6, 0.04, g); h.pop(); });
      [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]].forEach(([x, z]) => b.at(x, 0, z, h => h.box(0.04, 0.45, 0.04, g, { base: true })));
    });
    const car = mesh(r, b => {
      const w = [0.95, 0.95, 0.97, 0.1];
      b.at(0, 0.45, 0, h => h.box(1.8, 0.5, 4.2, w, { base: true }));
      b.at(0, 0.95, -0.2, h => h.box(1.6, 0.5, 2.0, [0.3, 0.36, 0.45, 0.2], { base: true }));
      [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]].forEach(([x, z]) => b.at(x, 0.35, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.35, 0.35, -0.12, 0.35, 0.35, 0.12, 0x1a1a1a, { capBottom: true }); h.pop(); }));
    });
    const crewmate = mesh(r, b => {
      const o = [0.95, 0.5, 0.12, 0.1];
      b.at(0, 0.9, 0, h => h.ellipsoid(0.5, 0.75, 0.45, 12, 8, o));
      b.at(0, 1.1, 0.35, h => h.ellipsoid(0.32, 0.18, 0.15, 10, 6, [0.6, 0.85, 0.95, 0.5]));
      b.at(0, 0.9, -0.5, h => h.box(0.5, 0.6, 0.25, o));
      [-1, 1].forEach(s2 => b.at(s2 * 0.22, 0, 0, h => h.prism(8, 0.18, 0.18, 0, 0.2, 0.2, 0.4, o)));
    });
    const F = { full: r.frameTexture(false), small: r.frameTexture(false), tiny: r.frameTexture(false), pix: r.frameTexture(true) };

    const uiTex = (spec) => {
      const fn = UI[spec.ui];
      return fn ? texOf(JSON.stringify(spec), fn(spec), spec.w || TW, spec.h || TH) : null;
    };
    const capTex = (c) => {
      const spec = typeof c === 'string' ? { text: c, pos: 'bottom' } : c;
      return texOf('cap:' + JSON.stringify(spec), UI.caption(spec));
    };

    function drawCast(key, pose, opts) {
      const a = castOf(key);
      a.solve(pose);
      a.draw(opts);
      return a;
    }

    function skyDrawer([top, bottom]) {
      return (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, top);
        g.addColorStop(1, bottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const rnd = rand(21);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = `rgba(255, ${190 + Math.floor(rnd() * 50)}, ${150 + Math.floor(rnd() * 60)}, 0.35)`;
          ctx.beginPath();
          ctx.ellipse(rnd() * w, h * (0.2 + rnd() * 0.6), 20 + rnd() * 50, 6 + rnd() * 12, 0, 0, PI * 2);
          ctx.fill();
        }
      };
    }

    function fill(color, a) {
      ov.begin();
      ov.rect(0, 0, FW, FH, { flat: color.concat([a === undefined ? 1 : a]), blend: a !== undefined && a < 1 });
    }

    function grab() {
      r.grab(F.full, 0, 0, FW, FH);
    }

    function blurFull(k) {
      grab();
      ov.begin();
      ov.rect(0, 0, FW / 4, FH / 4, { texture: F.full });
      r.grab(F.small, 0, FH - FH / 4, FW / 4, FH / 4);
      ov.rect(0, 0, FW / 16, FH / 16, { texture: F.small });
      r.grab(F.tiny, 0, FH - FH / 16, FW / 16, FH / 16);
      ov.rect(0, 0, FW, FH, { texture: F.full });
      ov.rect(0, 0, FW, FH, { texture: F.small, blend: true, alpha: k });
      ov.rect(0, 0, FW, FH, { texture: F.tiny, blend: true, alpha: k * 0.6 });
    }

    function clip(x, y, w, h, fn) {
      ov.begin();
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(Math.round(x), Math.round(FH - y - h), Math.round(w), Math.round(h));
      fn();
      gl.disable(gl.SCISSOR_TEST);
    }

    function starDome(camera, texName) {
      r.draw(X.dome, M4.translate(camera.eye[0], camera.eye[1], camera.eye[2]), { texture: T[texName || 'stars'], noFog: true });
    }

    function studio(camera, rect) {
      r.begin(ENVS.studio, camera, rect || null, true);
    }

    function speedLines(t, color, n) {
      const g = rand(Math.floor(t * 20));
      ov.begin();
      for (let i = 0; i < (n || 26); i++) {
        const a = g() * PI * 2;
        const len = 120 + g() * 200;
        r.draw(X.unit, M4.chain(M4.translate(FW / 2 + C(a) * (len * 0.5 + 60), FH / 2 + S(a) * (len * 0.5 + 60), 0), M4.rotZ(a), M4.scale(len, 2 + g() * 3, 1)), { flat: (color || [1, 0.85, 0.95]).concat([0.6]), additive: true, noFog: true });
      }
    }

    function span(sh) {
      return [sh.start, sh.end];
    }

    function chibi(t, mode, big) {
      const k = big ? 1.3 : 1;
      const rect = { x: Math.round(FW * (1 - 0.42 * k)), y: 0, w: Math.round(FW * 0.42 * k), h: FH };
      const p = basePose(0, 0, -0.3);
      p.face = mode === 'eat' ? (frac(t * 1.7) < 0.5 ? 'happy' : 'talk') : mode === 'hug' ? 'calm' : mode === 'pout' ? 'angry' : 'shock';
      if (mode === 'eat') gesture(p, 'blush');
      else if (mode === 'point') gesture(p, 'pointSide');
      else if (mode === 'hug') {
        p.ground = false;
        p.y = -0.4;
        p.hipL = [2.2, 0, 0];
        p.hipR = [2.2, 0, 0];
        p.knL = [2.4, 0, 0];
        p.knR = [2.4, 0, 0];
        gesture(p, 'hands');
      }
      const headScale = 3.0;
      const a = castOf('hayato');
      a.solver.scale = 0.62;
      a.solve(p);
      const sc = Math.hypot(a.m.head[0], a.m.head[1], a.m.head[2]);
      const hp = a.headPoint();
      const d = 2 * 0.118 * headScale * sc;
      const cy = hp[1] + (0.118 * (headScale - 1) - 0.02) * sc;
      const camera = camFor([hp[0], cy + d * 0.12, hp[2] + d * 1.95], [hp[0], cy + d * 0.15, hp[2]], 42, t, 0.002);
      studio(camera, rect);
      a.draw({ headScale });
      a.solver.scale = 1;
    }

    function sceneRoom(t, sh) {
      const o = sh.o;
      const v = o.cam || 'mid';
      const cams = {
        mid: [[0, 1.32, 2.1], [0, 1.22, 0], 34],
        wide: [[0, 1.2, 3.8], [0, 1.0, 0], 38],
        thigh: [[-0.1, 1.2, 2.9], [-0.1, 1.05, 0], 38],
        left: [[0.55, 1.3, 2.3], [0.55, 1.2, 0], 34],
        right: [[-0.6, 1.3, 2.3], [-0.6, 1.2, 0], 34],
        chest: [[o.pan ? -0.3 : 0.16, o.pan ? 1.26 : 1.225, o.pan ? 0.66 : 0.6], [o.pan ? -0.3 : 0.16, o.pan ? 1.24 : 1.205, 0], 44],
        face: [[0, 1.42, 0.8], [0, 1.4, 0], 32],
        desk: [[0, 1.3, 2.3], [0, 1.15, 0], 34],
        deskClose: [[0, 1.36, 1.4], [0, 1.3, 0], 34],
        tvside: [[2.2, 1.45, 1.6], [0.2, 1.45, -1.4], 40],
        tvpush: [[1.5, 1.5, 0.6], [-0.1, 1.55, -2.3], 40],
        tvfull: [[-0.08, 1.54, -0.9], [-0.08, 1.52, -2.3], 44],
        chair: [[0, 1.4, 3.2], [0, 0.7, 0], 38],
        topdown: [[0, 3.4, 0.4], [0, 0.4, 0], 50]
      };
      const frames = { mid: 'waist', thigh: 'thigh', desk: 'waist', deskClose: 'bust', wide: 'full', face: 'face', chest: null, tvside: null, tvpush: null, tvfull: null, chair: null, topdown: null, left: 'waist', right: 'waist', tv: 'thigh' };
      const hxPre = o.hostX !== undefined ? o.hostX : ({ left: 0.95, right: -1.0, thigh: 0.12 }[v] || 0);
      const probe = castOf(o.who || 'hayato');
      probe.solve(basePose(hxPre, 0, 0));
      const hp = probe.headPoint();
      const fr = frames[v];
      let c = cams[v] || cams.mid;
      if (fr) {
        const A = aimAt(hp, fr);
        const off = v === 'tv' || o.tv ? -0.25 : o.qr === 'left' ? -0.12 : 0;
        const headroom = v === 'tv' || o.tv ? 0.035 : 0;
        const far = o.tv && v === 'thigh' ? 1.33 : 1;
        c = [[hp[0] + off, A.at[1] + 0.03 + headroom, A.dist * far], [hp[0] + off, A.at[1] + headroom, 0], A.fov];
      }
      const local = t - sh.start;
      const push = o.push ? local * o.push : v === 'tvpush' ? local * 0.3 : 0;
      const pan = o.pan ? local * 0.05 : 0;
      const eye = v === 'tvpush' ? V3.lerp(c[0], [0.1, 1.55, -0.9], clamp(local / 1.5, 0, 1)) : [c[0][0] - pan, c[0][1], c[0][2] - push];
      const camera = camFor(eye, [c[1][0] - pan, c[1][1], c[1][2]], c[2], t, 0.008);
      const env = o.dark ? (v === 'chest' ? ENVS.room : ENVS.dark) : ENVS.room;
      r.begin(env, camera);
      if (o.dark) {
        fill(o.spot ? [0.04, 0.03, 0.08] : v === 'chest' ? [0.106, 0.118, 0.133] : [0.1, 0.12, 0.22]);
        r.begin(env, camera, null, true);
        if (o.spot) r.draw(X.disc, M4.chain(M4.translate(0, 0.01, 0), M4.rotX(-PI / 2), M4.scale(2.2)), { flat: [0.55, 0.3, 0.9, 0.5], additive: true, noFog: true });
      } else {
        r.draw(X.room.shell, null, { texture: T.quilt });
        r.draw(X.room.floor, null, { texture: T.tiles });
      }
      if (o.tv) {
        r.draw(X.room.tv, M4.translate(1.1, 0, 0));
        const tvTex = o.tv === 'webcam' ? texOf('webcam', UI.webcam(), 256, 160) : texOf('tv:' + (o.tvList || []).join('|'), UI.tvList({ items: o.tvList || [] }), 512, 320);
        if (v === 'tvfull') {
          const hand = castOf('hayato').parts.hands.open;
          r.draw(hand, M4.chain(M4.translate(0.26, 1.47, -1.5), M4.rotZ(0.5), M4.rotX(-0.3), M4.scale(1.4)));
        }
        const screenM = v === 'thigh' ? M4.chain(M4.translate(0.05, 1.35, -2.29), M4.scale(1.35, 1.35, 1), M4.translate(1.2, -1.55, 2.29)) : M4.translate(1.1, 0, 0);
        r.draw(X.room.screen, screenM, { texture: tvTex, tint: o.blurAll ? [0.9, 0.9, 0.9] : [1, 1, 1] });
      }
      if (v === 'desk' || v === 'deskClose' || o.desk) r.draw(X.room.desk, null, { texture: T.wood });
      if (v === 'desk' && o.prop !== 'credit') r.draw(X.unitLit, M4.chain(M4.translate(hp[0], hp[1] - 0.4, hp[2] + 0.45), M4.scale(1.4, 0.1, 1)), { flat: [0.74, 0.58, 0.4, 1] });
      const hx = o.hostX !== undefined ? o.hostX : ({ left: 0.95, right: -1.0, thigh: 0.12 }[v] || 0);
      if (o.chair) r.draw(chair, M4.translate(hx, 0, -0.1));
      const pose = hostPose(t, o, hx, 0, ({ left: -0.3, right: 0.3 }[v] || 0) + (o.turn || 0), span(sh));
      if (o.chair) {
        pose.ground = false;
        pose.y = 0.47 - 0.82;
        pose.hipL = [1.5, 0, 0.1];
        pose.hipR = [1.5, 0, 0.1];
        pose.knL = [1.5, 0, 0];
        pose.knR = [1.5, 0, 0];
      }
      if (v === 'tvfull' || (v === 'tvpush' && local > 1.2)) {
        pose.x = 0.05;
        pose.z = -0.6;
      }
      const host = drawCast(o.who || 'hayato', pose);
      if (o.qr) {
        const hand = host.m.foreR ? M4.point(host.m.foreR, [0, -0.3, 0]) : [0, 1.6, 0];
        let pos;
        const k = clamp(local * 2.5, 0, 1);
        if (o.qr === 'drop') pos = [hand[0], lerp(2.6, hand[1] + 0.14, ease(k)), 0.2];
        else if (o.qr === 'finger') pos = [hand[0], hand[1] + 0.14, 0.2];
        else if (o.qr === 'hang') pos = [hand[0] - 0.05, hand[1] - 0.1 * k, 0.2];
        else pos = [hp[0] - 0.46, hp[1] - 0.25, 0.3];
        const size = o.qr === 'left' ? 0.36 : 0.22;
        r.draw(X.unit, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotZ(S(t * 2) * 0.05), M4.scale(size, size * 1.18, 1)), { texture: texOf('qrcard', qrCard, 256, 300) });
      }
      if (o.prop === 'credit') {
        const k = clamp(local * 3, 0, 1);
        r.draw(X.unit, M4.chain(M4.translate(hp[0] + 0.056, hp[1] - 0.335 + k * 0.03, hp[2] + 0.3), M4.scale(0.4, 0.24, 1)), { texture: texOf('credit', creditSign, 512, 320), noFog: true });
      }
    }

    function qrCard(ctx, w, h) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      ctx.arc(w / 2, 36, 26, 0, PI * 2);
      ctx.fill();
      const g = rand(97);
      const n = 21, s = (w - 40) / n;
      const grad = ctx.createLinearGradient(0, 70, w, h);
      grad.addColorStop(0, '#d04ad8');
      grad.addColorStop(1, '#3a6ae8');
      ctx.fillStyle = grad;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (g() < 0.45 || (i < 7 && j < 7) || (i > n - 8 && j < 7) || (i < 7 && j > n - 8)) ctx.fillRect(20 + i * s, 70 + j * s * 0.85, s, s * 0.85);
      ctx.fillStyle = '#3a6ae8';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('@KISHLAK_HAYATO', w / 2, h - 12);
    }

    function creditSign(ctx, w, h) {
      ctx.fillStyle = '#2aa84a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(90, 60);
      ctx.lineTo(150, 150);
      ctx.lineTo(110, 150);
      ctx.lineTo(110, 280);
      ctx.lineTo(70, 280);
      ctx.lineTo(70, 150);
      ctx.lineTo(30, 150);
      ctx.fill();
      ctx.font = 'bold 54px Arial, sans-serif';
      ctx.fillText('+1,000,000', 180, 120);
      ctx.fillText('social credit', 180, 190);
    }

    function sceneClass(t, sh) {
      const o = sh.o;
      const night = o.cam === 'night';
      const probe = castOf('hayato');
      probe.solve(basePose(0, -1.95, PI));
      const hp = probe.headPoint();
      const camera = camFor([0, hp[1] - 0.2, hp[2] - 1.35], [0, hp[1] - 0.24, hp[2]], 38, t, 0.006);
      r.begin(night ? ENVS.night : ENVS.day, camera);
      r.draw(X.cls.room);
      r.draw(X.cls.windows, null, { texture: T.window, tint: night ? [1.7, 1.7, 1.6] : [1, 1, 1] });
      r.draw(X.cls.lamps);
      r.draw(X.cls.desks);
      r.draw(X.cls.teacher, M4.translate(0, 0, -2.5), { texture: T.desk });
      drawCast('hayato', hostPose(t, o, 0, -1.95, PI, span(sh)));
      if (night) r.draw(X.unitLit, M4.chain(M4.translate(0, hp[1] - 0.55, hp[2] - 0.55), M4.rotX(-0.25), M4.scale(1.6, 0.36, 1)), { flat: [0.2, 0.36, 0.24, 1] });
    }

    function sceneBoard(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const camera = o.wide ? camFor([0.2, 1.28, 2.3], [0.2, 1.24, 0], 44, t, 0.005) : o.close ? camFor([0.4, 1.34, 1.8], [0.4, 1.3, 0], 44, t, 0.005) : camFor([0.24, 1.3, 2.0], [0.24, 1.26, 0], 44, t, 0.005);
      r.begin(ENVS.room, camera);
      r.draw(X.room.shell, null, { texture: T.quilt });
      r.draw(X.room.floor, null, { texture: T.tiles });
      const bm = M4.chain(M4.translate(-0.42, 1.28, -0.3), M4.scale(0.6));
      const on = (x, y, w, h, tx, extra) => r.draw(X.unit, M4.chain(bm, M4.translate(x, y, 0.02), M4.scale(w, h, 1)), Object.assign({ texture: tx }, extra || {}));
      r.draw(X.board.frame, bm);
      r.draw(X.board.cork, bm, { texture: T.cork });
      on(-0.35, 0.72, 1.9, 0.36, texOf('bt:' + o.title, UI.boardTitle({ text: o.title || 'ПРАВИЛА' }), 512, 128), { blend: true });
      if (o.poster) {
        on(-1.15, 0.12, 0.4, 0.55, texOf('poster', UI.note({ text: 'РАЗЫСКИВАЕТСЯ', bg: '#e8d8b0', color: '#6a2a1a', size: 28 }), 256, 340));
        r.draw(X.board.pin, M4.chain(bm, M4.translate(-1.15, 0.37, 0.04)));
      }
      if (o.note) on(-0.2, -0.82, 2.2, 0.16, texOf('bn:' + o.note, UI.note({ text: o.note, bg: '#c98f55', color: '#ffffff', size: 22 }), 1024, 80));
      if (o.pic) {
        const wob = S(t * 2) * 0.02;
        const bg = o.picSepia ? '#a08a6a' : o.picPurple ? '#4a2a7a' : o.picPerson ? '#4a7ad8' : '#e8e4dc';
        const photoKind = o.picPerson ? 'man' : /кот/.test(o.pic) ? 'cat' : null;
        const picTex = photoKind ? texOf('photo:' + photoKind, UI.photo({ kind: photoKind }), 512, 360) : texOf('pic:' + o.pic + bg, UI.note({ text: o.pic, bg, color: '#ffffff', size: 40 }), 512, 360);
        r.draw(X.unit, M4.chain(bm, M4.translate(-0.2, -0.05, 0.02), M4.rotZ(wob), M4.scale(1.2, 0.85, 1)), { texture: picTex });
        r.draw(X.board.pin, M4.chain(bm, M4.translate(-0.2, 0.36, 0.04)));
        if (o.picPerson && !photoKind) {
          const p = basePose(0, 0, 0);
          p.face = 'smile';
          const a = castOf('streamer');
          a.solve(p);
          const m = M4.chain(bm, M4.translate(-0.2, -0.95, 0.05), M4.scale(0.75));
          a.m = Object.fromEntries(Object.entries(a.m).map(([key, v2]) => [key, M4.mul(m, v2)]));
          a.draw({ noLegs: true });
        }
      }
      if (o.jade) {
        r.draw(X.emoji, M4.chain(bm, M4.translate(-0.2, 0, 0.1), M4.rotY(t), M4.scale(0.22, 0.26, 0.22)), { tint: [1, 0.6, 0.95] });
        if (o.ban) {
          r.draw(X.ring, M4.chain(bm, M4.translate(-0.2, 0, 0.2), M4.scale(0.4)), { tint: [1.6, 0.2, 0.2], noFog: true });
          r.draw(X.unit, M4.chain(bm, M4.translate(-0.2, 0, 0.21), M4.rotZ(-PI / 4), M4.scale(0.8, 0.05, 1)), { flat: [0.9, 0.1, 0.1, 1] });
        }
      }
      if (o.girl) {
        const p = basePose(0, 0, 0);
        p.face = local > 0.8 ? 'sad' : 'happy';
        if (local > 0.8) gesture(p, 'facepalm');
        const a = castOf(o.girl);
        a.solve(p);
        const m = M4.chain(bm, M4.translate(-0.2, -0.9, 0.05), M4.scale(0.72));
        a.m = Object.fromEntries(Object.entries(a.m).map(([key, v2]) => [key, M4.mul(m, v2)]));
        a.draw({ noLegs: true });
      }
      if (o.qrNote) on(1.15, -0.72, 0.4, 0.46, texOf('qrcard', qrCard, 256, 300));
      if (o.qrNote) on(0.62, -0.84, 0.4, 0.46, texOf('sudo', UI.note({ text: 'СЮДО СЮДО', bg: '#f2e27a', color: '#6a4a1a', size: 30 }), 256, 128), { blend: true });
      if (o.host !== false) {
        const p = hostPose(t, o, 0.62, 1.0, o.back ? PI - 0.3 : -0.25, span(sh));
        const a = drawCast('hayato', p);
        if (o.staff) {
          const hand = M4.point(a.m.foreR, [0, -0.28, 0]);
          const up = o.g === 'staffUp';
          const tilt = up ? PI / 2 : -0.12;
          r.draw(X.unit, M4.chain(M4.translate(hand[0], hand[1], hand[2] + 0.05), M4.rotZ(tilt), M4.scale(0.045, 1.4, 1)), { flat: [0.12, 0.1, 0.14, 1] });
          r.draw(X.ring, M4.chain(M4.translate(hand[0] - S(tilt) * 0.7, hand[1] + C(tilt) * 0.7, hand[2] + 0.06), M4.scale(0.12)), { tint: [1, 0.85, 0.4], noFog: true });
        }
      }
      if (o.chibi) chibi(t, o.chibi === 'grow' ? 'hug' : o.chibi, o.chibi === 'grow' && local > 0.2);
    }

    function layout(o) {
      const party = o.party || ['asta', 'tingyun', 'bronya', 'yukong'];
      const fl = o.foes || ['guard', 'guard'];
      return {
        party: party.map((k, i) => ({ key: k, x: -2.1 + i * 1.4, z: 1.2 })),
        foes: fl.map((k, i) => ({ key: k, x: (i - (fl.length - 1) / 2) * 2.4 + (o.foeX || 0), z: o.foeZ !== undefined ? o.foeZ : -4.2 - (FOES[k] && FOES[k].mesh === 'svarog' ? 1.2 : 0) }))
      };
    }

    function arenaDraw(camera, arena, tint) {
      const A = ARENA[arena] || ARENA.snow;
      if (A.env === 'space' || A.env === 'gold') starDome(camera);
      if (A.set) r.draw(X[A.set], null, tint ? { texture: T[A.tex], tint } : { texture: T[A.tex] });
      if (A.crystals) r.draw(X.crystals, null, { noFog: true });
      if (A.stalls) r.draw(X.props.stalls);
    }

    function sceneBattle(t, sh) {
      const o = sh.o;
      const lay = layout(o);
      const local = t - sh.start;
      const len = Math.max(0.2, sh.end - sh.start);
      const k = clamp(local / len, 0, 1);
      const actor = lay.party.find(p => p.key === o.who) || lay.party[0] || { key: 'bronya', x: 0, z: 1.2 };
      const target = lay.foes[Math.min(lay.foes.length - 1, o.target || 0)] || { x: 0, z: -4 };
      const boss = lay.foes.find(f => f.key === 'svarog');
      const lead = actor;
      const presets = {
        default: [[lead.x + 0.75, 1.55, lead.z + 2.2], [(lead.x + target.x) / 2 + 0.6, 1.2, -2.5], 50],
        enemy: [[0.6, 1.8, 2.4], [0, 1.6, -4.2], 46],
        wide: [[0, 3.2, 8.5], [0, 0.8, -2.5], 44],
        front: [[0.2, 1.3, -2.2], [0, 1.0, 1.2], 50],
        hero: [[actor.x + 0.5, 1.4, actor.z - 2.2], [actor.x, 1.2, actor.z], 38],
        lowHero: [[actor.x + 0.6, 0.4, actor.z - 1.6], [actor.x, 1.5, actor.z], 48],
        back: [[actor.x + 0.75, 1.55, actor.z + 2.2], [(actor.x + target.x) / 2 + 0.6, 1.2, -2.5], 50],
        low: [[1.6, 0.4, 3.4], [0, 1.8, -3.8], 50],
        side: [[6.0, 1.6, -1.2], [0, 1.2, -1.4], 42],
        duel: [[-1.75, 1.3, 4.5], [-2.0, 1.0, 1.25], 42],
        close: [[actor.x + 0.35, 1.45, actor.z - 1.0], [actor.x, 1.38, actor.z], 34],
        eye: [[0.3, 3.4, -3.2], [0, 3.45, -5.4], 30],
        mech: [[2.2, 2.0, -2.2], [1.2, 1.6, -4.2], 40],
        wing: [[1.2, 2.6, -2.4], [0.3, 2.4, -4.2], 36]
      };
      presets.foeClose = [[target.x + 0.3, 2.0, target.z + 2.6], [target.x, 1.6, target.z], 40];
      const pc = presets[o.cam || 'default'] || presets.default;
      let eye = pc[0], at = pc[1];
      if (o.orbit) {
        const a = o.orbit * k;
        const d = V3.sub(eye, at);
        eye = V3.add(at, [d[0] * C(a) - d[2] * S(a), d[1], d[0] * S(a) + d[2] * C(a)]);
      }
      const hit = o.act === 'attack' || o.act === 'hit' || o.act === 'skill';
      const shake = o.act === 'hit' && k < 0.4 ? 0.05 : 0.012;
      const camera = camFor(eye, at, pc[2], t, shake);
      const A = ARENA[o.arena] || ARENA.snow;
      const env = Object.assign({}, ENVS[A.env]);
      if (o.sky) env.fogColor = [0.5, 0.7, 0.95];
      const night = o.night || lay.foes.some(f => f.key === 'svarog');
      if (night) {
        env.ambTop = [0.3, 0.34, 0.5];
        env.sunColor = [0.2, 0.22, 0.32];
        env.fogColor = [0.06, 0.08, 0.16];
      }
      if (o.gold) env.ambTop = [1.1, 0.9, 0.5];
      r.begin(env, camera);
      if (o.sky) fill([0.45, 0.65, 0.92]);
      if (o.sky) r.begin(env, camera, null, true);
      arenaDraw(camera, o.arena, night ? [0.32, 0.38, 0.55] : null);
      const marks = [];
      const glows = [];
      if (o.city) {
        const g = rand(17);
        for (let i = 0; i < 7; i++) {
          const bx = -10 + i * 2.6, bh = 3 + g() * 4, bw = 2.2;
          r.draw(X.unitLit, M4.chain(M4.translate(bx, bh / 2, -9), M4.scale(bw, bh, 1)), { flat: [0.1, 0.11, 0.18, 1] });
          for (let wy = 0.8; wy < bh - 0.4; wy += 0.9) for (let wx = -0.7; wx <= 0.7; wx += 0.7) {
            if (g() < 0.22) r.draw(X.unitLit, M4.chain(M4.translate(bx + wx, wy, -8.98), M4.scale(0.3, 0.42, 1)), { flat: [1, 0.66, 0.3, 1] });
          }
        }
        [[-6, -4], [-3.2, -2], [2.5, -3]].forEach(([lx, lz]) => {
          r.draw(X.unitLit, M4.chain(M4.translate(lx, 1.2, lz), M4.scale(0.08, 2.4, 1)), { flat: [0.12, 0.12, 0.14, 1] });
          glows.push([lx, 2.45, lz, [1, 0.75, 0.35], 60]);
        });
        for (let s2 = 0; s2 < 5; s2++) r.draw(X.unitLit, M4.chain(M4.translate(-6.5, 0.1 + s2 * 0.22, -1 - s2 * 0.4), M4.rotX(-PI / 2), M4.scale(3, 0.4, 1)), { flat: [0.3, 0.3, 0.36, 1] });
      }
      lay.foes.forEach((f, i) => {
        const kind = FOES[f.key] || FOES.guard;
        const hitK = hit && (o.target === undefined || o.target === i || o.aoe) && k > 0.3 ? S((k - 0.3) * 30) * 0.08 * (1 - k) : 0;
        if (kind.cast) {
          const p = basePose(f.x + hitK, f.z, 0);
          gesture(p, 'guard');
          p.face = 'angry';
          const a = castOf(kind.cast);
          a.solver.scale = kind.scale || 1;
          a.solve(p);
          a.draw({ tint: kind.tint });
          a.solver.scale = 1;
          marks.push(project(r, V3.add(a.headPoint(), [0, 0.4, 0])));
        } else if (kind.prop) {
          r.draw(X.props[kind.prop], M4.chain(M4.translate(f.x + hitK, kind.lift || 0, f.z), M4.rotY(PI / 2 + S(t + i) * 0.1)));
          marks.push(project(r, [f.x, kind.h + 0.3, f.z]));
        } else {
          const bob = kind.glow ? 0.2 + S(t * 3 + i) * 0.1 : 0;
          const kneel = o.kneel && f.key === 'svarog' ? M4.chain(M4.translate(0, -0.8, 0), M4.rotX(0.35)) : M4.ident();
          r.draw(foes[kind.mesh], M4.chain(M4.translate(f.x + hitK, bob, f.z), kneel, M4.rotY(S(t * 0.7 + i) * 0.1), M4.scale(kind.scale || 1), o.hunch && f.key === 'grizzly' ? M4.chain(M4.rotX(0.35), M4.scale(1.35, 0.85, 1.1)) : M4.ident()), Object.assign(kind.glow ? { noFog: true } : {}, kind.tint ? { tint: kind.tint } : {}, o.pale && f.key === 'svarog' ? { tint: [1.6, 1.6, 1.8] } : {}));
          marks.push(project(r, [f.x, kind.h + bob + 0.3, f.z]));
        }
      });
      lay.party.forEach((m, i) => {
        const acting = m.key === actor.key && o.act && o.act !== 'hit' && o.act !== 'enemy' && o.act !== 'charge';
        const p = basePose(m.x, m.z, PI);
        const wep = (LOOKS[m.key] || {}).weapon;
        if (acting && o.act === 'attack') {
          const dash = k < 0.35 ? ease(k / 0.35) : k < 0.7 ? 1 : 1 - ease((k - 0.7) / 0.3);
          p.x = lerp(m.x, target.x + 0.9, dash);
          p.z = lerp(m.z, target.z + 1.4, dash);
          gesture(p, wep === 'bow' ? 'bow' : 'aim', k);
        } else if (acting && (o.act === 'skill' || o.act === 'aim')) {
          gesture(p, wep === 'bow' ? 'bow' : 'aim', k);
          p.face = 'angry';
        } else if (acting && o.act === 'lance') {
          gesture(p, 'cast', k);
          p.weaponPitch = 0;
        } else if (acting && o.act === 'leap') {
          p.ground = false;
          p.y = S(k * PI) * 1.2;
          gesture(p, 'bow', k);
        } else {
          p.spine = [0.05, 0, S(t * 1.5 + i) * 0.03];
          gesture(p, 'guard');
        }
        if (o.down && o.down.includes(m.key)) {
          p.rx = -1.4;
          p.pivot = 0.2;
        }
        if (o.faceCam && m.key === actor.key) {
          p.ry = Math.atan2(camera.eye[0] - p.x, camera.eye[2] - p.z) - 0.6;
          p.face = 'calm';
        }
        const glowOn = o.glow === 'all' || o.glow === m.key;
        const near = V3.len(V3.sub([p.x, 1.2, p.z], camera.eye)) < 1.7 && m.key !== actor.key;
        if (!near && m.key !== o.fgAlly) drawCast(m.key, p, glowOn ? { tint: [1.1, 1.3, 1.7] } : undefined);
        if (o.mech && m.key === 'asta') r.draw(X.telescope, M4.chain(M4.translate(m.x - 0.9, 0, m.z + 0.3), M4.rotY(PI), M4.scale(0.6)));
        if (o.dome === m.key) glows.push([m.x, 0.9, m.z, [1, 0.4, 0.8], 90]);
        if (o.ring === m.key || o.aura) r.draw(X.ring, M4.chain(M4.translate(m.x, 0.05, m.z), M4.rotX(-PI / 2), M4.scale(0.9)), { tint: o.aura || [0.6, 0.8, 1], noFog: true });
        if (o.pillars) r.draw(X.unit, M4.chain(M4.translate(m.x, 2, m.z), M4.scale(0.8, 4, 1)), { flat: [0.5, 0.8, 1, 0.35], additive: true, noFog: true });
      });
      if (o.fgAlly) {
        const f = V3.norm(V3.sub(camera.at, camera.eye));
        const side = V3.norm(V3.cross(f, [0, 1, 0]));
        const spot = V3.add(V3.add(camera.eye, V3.mul(f, o.fgDist || 2.0)), V3.mul(side, -(o.fgSide || 1.03)));
        const facing = V3.add(V3.mul(f, -Math.cos(0.85)), V3.mul(side, Math.sin(0.85)));
        const fp = basePose(spot[0], spot[2], Math.atan2(facing[0], facing[2]));
        fp.face = 'calm';
        gesture(fp, 'rest');
        const ally = castOf(o.fgAlly);
        const keep = ally.solver.scale;
        ally.solver.scale = keep * (o.fgScale || 1.5);
        drawCast(o.fgAlly, fp);
        ally.solver.scale = keep;
      }
      if (o.act === 'skill' || o.act === 'aim') glows.push([actor.x, 1.2, actor.z, [0.6, 0.8, 1], 70 * S(k * PI) + 20]);
      if (o.beam || o.beamFoe) {
        const from = o.beamFoe ? [target.x, 3.3, target.z] : [actor.x, 1.3, actor.z];
        const to = o.beamFoe ? [actor.x, 1.2, actor.z] : [target.x, 1.4, target.z];
        const mid = V3.lerp(from, to, 0.5);
        const d = V3.sub(to, from);
        r.draw(X.unit, M4.chain(M4.translate(...mid), M4.rotY(Math.atan2(d[0], d[2]) + PI / 2), M4.scale(V3.len(d), 0.25, 1)), { flat: o.beamFoe ? [1, 0.55, 0.2, 0.8] : [0.5, 0.8, 1, 0.8], additive: true, noFog: true });
      }
      if (o.orb) r.draw(X.disc, M4.chain(M4.translate(target.x + 1, 2.6, target.z + 0.5), M4.scale(0.8 + S(t * 8) * 0.1)), { flat: [1, 0.35, 0.8, 0.9], additive: true, noFog: true });
      const flashAt = (hit || o.act === 'hit') ? project(r, o.act === 'hit' && !o.who ? [0, 1.2, 1.2] : [target.x, 1.4, target.z]) : null;
      if (o.ghost) {
        const p = basePose(actor.x + 0.4, actor.z - 0.6, PI);
        p.ground = false;
        p.y = 1.0;
        gesture(p, 'cast', local);
        drawCast('seele', p, { flat: [0.6, 0.3, 1, 0.5] });
      }
      if (o.smoke) {
        const g = rand(3);
        for (let i = 0; i < 8; i++) r.draw(X.disc, M4.chain(M4.translate(target.x + (g() - 0.5) * 3, 0.5 + g() * 2, target.z + 1), M4.scale(1 + g())), { flat: [0.7, 0.2, 0.15, 0.3], blend: true, noFog: true });
      }
      if (o.beamSky) r.draw(X.unit, M4.chain(M4.translate(target.x, 5, target.z), M4.rotY(0.4), M4.scale(0.6, 10, 1)), { flat: [0.6, 0.5, 1, 0.8], additive: true, noFog: true });
      glows.forEach(([x, y, z, col, rad]) => {
        const q = project(r, [x, y, z]);
        if (q[2] <= 0.3) return;
        ov.begin();
        ov.rect(q[0] - rad, q[1] - rad, rad * 2, rad * 2, { texture: T.glow, additive: true, alpha: 0.7, tint: col });
      });
      if (o.slashFx) {
        ov.begin();
        r.draw(X.unit, M4.chain(M4.translate(FW * 0.55, FH * 0.45, 0), M4.rotZ(-0.7), M4.scale(FW * 1.1, 16, 1)), { flat: o.slashFx.concat([0.85]), additive: true, noFog: true });
        r.draw(X.unit, M4.chain(M4.translate(FW * 0.55, FH * 0.45, 0), M4.rotZ(-0.7), M4.scale(FW * 1.2, 40, 1)), { flat: o.slashFx.concat([0.35]), additive: true, noFog: true });
      }
      if (flashAt && flashAt[2] > 0) {
        const g = 1 - k;
        const rad = 50 + k * 90;
        ov.begin();
        ov.rect(flashAt[0] - rad, flashAt[1] - rad, rad * 2, rad * 2, { texture: T.glow, additive: true, alpha: 0.9 * g, tint: o.fx || [1, 0.9, 0.6] });
      }
      if (o.dim) fill([0, 0, 0], 0.55);
      if (o.snow) {
        const g = rand(7);
        for (let i = 0; i < 40; i++) {
          const p = [actor.x + (g() - 0.5) * 3, frac(g() - t * 0.2) * 3, actor.z + (g() - 0.5) * 2];
          r.draw(X.disc, M4.chain(M4.translate(...p), M4.scale(0.03)), { flat: [1, 1, 1, 0.9], noFog: true });
        }
      }
      return { marks, boss: !!boss };
    }

    function sceneWalk(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const who = o.who || 'yukong';
      const speed = o.run ? 5 : o.chest || o.portal || o.rest || o.platform ? 0.4 : 1.4;
      const zPos = 2 - local * speed;
      const A = ARENA[o.arena] || ARENA.street;
      const cams = {
        follow: [[0.9, 1.9, zPos + 2.8], [0, 1.1, zPos - 1.2], 50],
        back: [[0.3, 1.6, zPos + 2.0], [0, 1.2, zPos - 2], 46],
        wide: [[3, 3.6, zPos + 7], [0, 0.8, zPos - 2], 46],
        side: [[3.5, 1.4, zPos], [0, 1.1, zPos], 44],
        front: [[0.3, 1.5, zPos - 2.6], [0, 1.3, zPos], 44]
      };
      const c = o.beastNear ? [[0.9, 2.1, zPos + 4.2], [0, 1.1, zPos - 1.2], 50] : o.near ? [[0.6, 1.6, zPos + 1.9], [0, 1.1, zPos - 1.2], 50] : o.mid ? [[0.5, 1.8, zPos + 2.9], [0, 1.1, zPos - 1.2], 50] : o.far ? [[0.2, 2.7, zPos + 5.6], [0, 1.5, zPos - 2], 44] : cams[o.cam || 'follow'];
      const camera = camFor(c[0], c[1], c[2], t, 0.01);
      const env = Object.assign({}, ENVS[A.env]);
      const nightSnow = A.tex === 'snow' && A.env !== 'snow';
      if (o.dark) {
        env.ambTop = [0.12, 0.12, 0.16];
        env.sunColor = [0.05, 0.05, 0.06];
        env.fogColor = [0.02, 0.02, 0.03];
      }
      r.begin(env, camera);
      arenaDraw(camera, o.arena, nightSnow ? [0.35, 0.4, 0.55] : null);
      if (o.neon) for (let i = -3; i <= 3; i++) r.draw(X.unitLit, M4.chain(M4.translate(i * 0.9, 0.02, zPos - 6), M4.rotX(-PI / 2), M4.scale(0.05, 24, 1)), { flat: o.neon.concat([1]), noFog: true });
      if (o.arches) for (let j = 0; j < 6; j++) {
        const az = zPos - 1.5 - j * 3;
        [-1.9, 1.9].forEach(ax => r.draw(X.unitLit, M4.chain(M4.translate(ax, 1.4, az), M4.scale(0.3, 2.8, 1)), { flat: [0.36, 0.26, 0.18, 1] }));
        r.draw(X.unitLit, M4.chain(M4.translate(0, 2.85, az), M4.scale(4.1, 0.3, 1)), { flat: [0.3, 0.22, 0.15, 1] });
      }
      if (o.arches) [-0.45, 0.45].forEach(rx => r.draw(X.unitLit, M4.chain(M4.translate(rx + 1.2, 0.03, zPos - 6), M4.rotX(-PI / 2), M4.scale(0.06, 24, 1)), { flat: [0.55, 0.55, 0.6, 1] }));
      if (o.seele) drawCast('seele', basePose(0.8, zPos - 3.5, 0.3));
      if (o.carts) r.draw(X.props.carts, M4.translate(2.2, 0, zPos - 3));
      if (o.chest) r.draw(X.props.chest, M4.translate(0.3, 0, zPos - 1.8));
      if (o.portal) r.draw(X.props.portal, M4.chain(M4.translate(0, 0.2, zPos - 3), M4.rotY(t * 0.5)), { noFog: true });
      if (o.rest) r.draw(X.props.crystal, M4.chain(M4.translate(0, 2.6 + S(t * 2) * 0.1, zPos), M4.rotY(t)), { noFog: true });
      if (o.platform) r.draw(X.platform, M4.translate(0, 0.02, zPos));
      if (o.beast) {
        const kind = FOES[o.beast] || FOES.mantis;
        if (o.beastNear) {
          const f = V3.norm(V3.sub(camera.at, camera.eye));
          const side = V3.norm(V3.cross(f, [0, 1, 0]));
          const up = V3.cross(side, f);
          const yaw = Math.atan2(f[0], f[2]);
          const at = (d, sx, uy) => V3.add(V3.add(V3.add(camera.eye, V3.mul(f, d)), V3.mul(side, sx)), V3.mul(up, uy));
          const facing = M4.rotY(yaw + PI);
          r.draw(X.orb, M4.chain(M4.translate(...at(1.75, -0.99, -0.05)), facing, M4.scale(0.26, 0.22, 0.24)), { tint: [0.16, 0.2, 0.38] });
          r.draw(X.unitLit, M4.chain(M4.translate(...at(1.47, -0.86, -0.07)), facing, M4.scale(0.22, 0.04, 1)), { flat: [0.3, 0.36, 0.55, 1] });
          r.draw(X.disc, M4.chain(M4.translate(...at(1.46, -0.8, -0.07)), facing, M4.scale(0.06)), { flat: [1, 0.15, 0.15, 1] });
          r.draw(X.crystalBlade, M4.chain(M4.translate(...at(1.5, -0.745, -0.35)), facing, M4.rotZ(-0.4), M4.scale(1.02, 0.85, 1)));
        } else if (kind.mesh) r.draw(foes[kind.mesh], M4.translate(0.5, 0, zPos - (o.near ? 4 : 7)));
        else drawCast('guard', basePose(0.5, zPos - (o.near ? 4 : 7), 0), { tint: kind.tint });
      }
      if (o.miners) [-1.4, 1.3, 2.2].forEach((x, i) => {
        const p = basePose(x, zPos - 1 - i * 0.6, PI + 0.3 * i);
        p.face = 'calm';
        drawCast('miner', p);
      });
      const party = o.party || [who];
      party.forEach((key, i) => {
        const p = basePose(i * 0.8, zPos + i * 1.2, PI);
        const ph = local * (o.run ? 12 : 7) + i;
        const sw = o.run ? 0.9 : 0.45;
        p.hipL = [S(ph) * sw, 0, 0];
        p.hipR = [-S(ph) * sw, 0, 0];
        p.knL = [Math.max(0, -S(ph)) * sw * 1.4, 0, 0];
        p.knR = [Math.max(0, S(ph)) * sw * 1.4, 0, 0];
        p.shL = [-S(ph) * sw * 0.7, 0, 0.12];
        p.shR = [S(ph) * sw * 0.7, 0, 0.12];
        p.spine = [o.run ? 0.25 : 0.05, 0, 0];
        p.face = 'calm';
        if (o.chest && local > 1.5) gesture(p, 'hands');
        const a = drawCast(key, p, o.glow ? { tint: [0.9, 1.2, 1.8] } : undefined);
        if (o.trail && i === 0) {
          for (let g = 1; g <= 3; g++) {
            const q = Object.assign({}, p, { z: p.z + g * 0.5 });
            a.solve(q);
            a.draw({ flat: [0.4, 0.7, 1, 0.3 / g] });
          }
        }
      });
      if (o.tint) {
        grab();
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: F.full, tint: o.tint });
      }
      const hudSpec = { ui: 'walkHud', loc: o.loc, quest: o.quest, topTag: o.topTag, tag: o.tag, banner: o.banner, rewards: o.rewards, sub: o.sub, party: o.cap ? [] : (o.party || ['asta', 'tingyun', 'bronya', 'yukong']).map(k => (LOOKS[k] || {}).name || k) };
      ov.begin();
      ov.rect(0, 0, FW, FH, { texture: uiTex(hudSpec), blend: true });
    }

    function sceneUlt(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const who = o.who || 'asta';
      const v = o.v || 'pose';
      const skyByWho = { asta: [0.22, 0.12, 0.38], bronya: [0.55, 0.72, 0.92], yukong: [0.1, 0.2, 0.5] };
      const sky = o.bg || skyByWho[who] || [0.12, 0.1, 0.3];
      if (v === 'face') return sceneFace(t, { start: sh.start, end: sh.end, o: { who, face: o.face || 'happy', bg: sky, stars: true } });
      if (v === 'boot' || v === 'rays') {
        fill([1, 0.97, 0.9]);
        if (v === 'boot') {
          const camera = camFor([0.4, 0.3, 1.4], [0, 0.4, 0], 40, t, 0.01);
          studio(camera);
          const p = basePose(0, 0, 0.6);
          p.hipR = [0.6 - clamp(local * 3, 0, 1) * 0.6, 0, 0];
          p.knR = [0.4, 0, 0];
          drawCast(who, p, { tint: [0.4, 0.4, 0.45] });
        }
        speedLines(t, [1, 0.9, 0.7], 20);
        if (o.pop) {
          ov.begin();
          ov.rect(FW * 0.3, FH * 0.3, FW * 0.4, FH * 0.3, { texture: capTex({ text: o.pop, size: 120, color: '#ffd65a', stroke: '#5a2a00' }), blend: true });
        }
        return;
      }
      if (v === 'astrolabe') {
        const camera = camFor([0, 2.2, 4.6], [0, 2.6, -4], 50, t, 0.004);
        r.begin(ENVS.space, camera);
        starDome(camera);
        r.draw(X.ring, M4.chain(M4.translate(3.5, 6, -10), M4.rotZ(t * 0.6), M4.scale(5)), { tint: [0.5, 0.8, 1], noFog: true });
        r.draw(X.ring, M4.chain(M4.translate(3.5, 6, -10.1), M4.rotZ(-t * 0.4), M4.scale(3.2)), { noFog: true, tint: [1, 0.9, 0.6] });
        ['asta', 'tingyun', 'bronya', 'yukong'].forEach((k, i) => {
          const p = basePose(-1.5 + i, 0, PI + 0.3);
          p.face = 'calm';
          drawCast(k, p);
        });
        return;
      }
      if (v === 'ghosts') {
        const camera = camFor([0, 0.5, 1.8], [0, 1.6, -2], 58, t, 0.006);
        r.begin(ENVS.snow, camera);
        r.draw(X.snow, null, { texture: T.snow });
        for (let i = 0; i < 5; i++) {
          const p = basePose(-1.8 + i * 0.9, -0.6 - (i % 2) * 0.6, 0);
          gesture(p, 'guard');
          p.weaponPitch = -PI / 2 + 0.1;
          const a = castOf('guard');
          a.solver.scale = 1.4;
          a.solve(p);
          a.draw({ flat: [0.62, 0.82, 0.85, 0.7] });
          a.solver.scale = 1;
        }
        return;
      }
      if (v === 'arrow') {
        fill([0.05, 0.08, 0.25]);
        ov.begin();
        const x = lerp(-FW * 0.3, FW * 1.2, clamp(local / 0.9, 0, 1));
        r.draw(X.unit, M4.chain(M4.translate(x, FH * 0.55 - x * 0.2, 0), M4.rotZ(-0.2), M4.scale(FW * 0.8, 14, 1)), { flat: [0.4, 0.8, 1, 0.9], additive: true, noFog: true });
        r.draw(X.unit, M4.chain(M4.translate(x, FH * 0.55 - x * 0.2, 0), M4.rotZ(-0.2), M4.scale(FW * 0.9, 40, 1)), { flat: [0.2, 0.5, 1, 0.4], additive: true, noFog: true });
        speedLines(t, [0.5, 0.8, 1], 16);
        return;
      }
      if (v === 'gold' && o.bright) {
        fill([1, 0.9, 0.45]);
        ov.begin();
        ov.rect(FW / 2 - 170, FH / 2 - 170, 340, 340, { texture: T.glow, additive: true, alpha: 1, tint: [1, 0.96, 0.7] });
        speedLines(t, [1, 1, 0.8], 30);
        const camera = camFor([0, 1.25, 2.4], [0, 1.1, 0], 44, t, 0.004);
        studio(camera);
        const p = basePose(0, 0, 0);
        p.face = 'smile';
        gesture(p, 'cast', local);
        drawCast(who, p, { tint: [1.7, 1.55, 1.1] });
        return;
      }
      if (v === 'gold') {
        const camera = camFor([0, 1.3, 2.6], [0, 1.15, 0], 44, t, 0.004);
        r.begin(ENVS.gold, camera);
        fill(o.bright ? [1, 0.86, 0.35] : [0.05, 0.04, 0.02]);
        r.begin(ENVS.gold, camera, null, true);
        r.draw(X.ring, M4.chain(M4.translate(0, 1.2, -0.5), M4.rotZ(t), M4.scale(2)), { tint: [1, 0.78, 0.35], noFog: true });
        r.draw(X.ring, M4.chain(M4.translate(0, 1.2, -0.6), M4.rotZ(-t * 0.7), M4.scale(1.4)), { tint: [1, 0.85, 0.45], noFog: true });
        const p = basePose(0, 0, 0);
        p.face = 'smile';
        gesture(p, 'cast', local);
        drawCast(who, p, { tint: o.bright ? [1.6, 1.35, 0.7] : [1.1, 1.2, 1.5] });
        return;
      }
      if (v === 'mech') {
        const camera = camFor([2.5 - local * 0.4, 1.8, 4], [0, 2, 0], 46, t, 0.004);
        r.begin(ENVS.space, camera);
        starDome(camera);
        r.draw(X.telescope, M4.chain(M4.rotY(0.6), M4.scale(1.2)));
        const p = basePose(0.3, 0.6, 0.4);
        p.ground = false;
        p.y = 0.4;
        gesture(p, 'cast', local);
        drawCast(who, p);
        return;
      }
      fill(sky);
      speedLines(t, v === 'ice' ? [0.8, 0.95, 1] : v === 'splash' ? [1, 0.9, 0.5] : [1, 0.85, 0.95]);
      const close = o.close || v === 'lance' && o.close;
      const camera = v === 'sit'
        ? camFor([0.6, 1.8, 1.95], [0, 1.72, 0], 42, t, 0.004)
        : v === 'back' ? camFor([-0.6, 1.5, -1.6], [0, 1.35, 0], 36, t, 0.004)
          : close ? camFor([0.2, 1.4, 0.9], [0, 1.35, 0], 36, t, 0.004)
            : camFor([0.4 - local * 0.1, 1.3, 2.2], [0, 1.1, 0], 38, t, 0.004);
      studio(camera);
      if (v === 'sit') r.draw(X.scopeTube, M4.chain(M4.translate(0.54, 2.62, -0.4), M4.rotZ(2.117), M4.scale(1, 2.12, 1)));
      const p = basePose(0, 0, v === 'back' ? PI : 0);
      p.face = o.face || 'smug';
      if (v === 'sit') {
        p.ground = false;
        p.y = 0.76;
        p.ry = PI / 2 - 0.25;
        p.neck = [0.05, -0.9, 0];
        p.hipL = [1.4, 0, 0];
        p.hipR = [1.3, 0, 0.1];
        p.knL = [1.3, 0, 0];
        p.knR = [1.4, 0, 0];
        p.weapon = false;
        gesture(p, 'hands', local);
        const sitter = castOf(who);
        const keep = sitter.solver.scale;
        sitter.solver.scale = keep * 0.85;
        drawCast(who, p);
        sitter.solver.scale = keep;
        return;
      } else if (v === 'point') gesture(p, 'pointUp', local);
      else if (v === 'lance' || v === 'ice') {
        gesture(p, 'cast', local);
        p.weaponPitch = 0;
      } else if (v === 'cape') {
        p.ry = PI * 0.8;
      } else gesture(p, o.g || 'cast', local);
      drawCast(who, p);
      if (v === 'ice') {
        const g = rand(11);
        for (let i = 0; i < 14; i++) {
          r.draw(X.crystals, M4.chain(M4.translate((g() - 0.5) * 6, -0.5, -2 - g() * 2), M4.scale(0.25)), { tint: [0.5, 0.8, 1.5], noFog: true });
        }
      }
      if (v === 'lance') r.draw(X.ring, M4.chain(M4.translate(0, 1.4, -0.3), M4.scale(0.9 + local * 0.6)), { tint: [0.5, 0.8, 1], noFog: true });
    }

    function sceneFace(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const p = basePose(0, 0, 0);
      p.weapon = false;
      p.face = o.face || 'happy';
      p.neck = [0.05, S(t) * 0.05 + (o.look || 0), o.tilt === undefined ? 0.08 : o.tilt];
      if (o.turn) p.ry = clamp(local - 2.6, 0, 1) * 2.2;
      if (o.spin) p.ry = ease(clamp(local / 1.3, 0, 1)) * PI * 2;
      if (o.g) gesture(p, o.g, local);
      const actor = castOf(o.who || 'march');
      actor.solve(p);
      const head = actor.headPoint();
      if (!o.noBg) {
        if (o.stripes) {
          fill([0.55, 0.75, 0.95]);
          ov.begin();
          for (let i = -4; i < 14; i++) r.draw(X.unit, M4.chain(M4.translate(i * 50 + (t * 20) % 50, FH / 2, 0), M4.rotZ(0.6), M4.scale(24, FH * 2, 1)), { flat: [0.3, 0.5, 0.9, 1] });
        } else if (o.sky) {
          ov.begin();
          ov.rect(0, 0, FW, FH, { texture: texOf('sky:' + o.sky.join(), skyDrawer(o.sky), 256, 256) });
        } else fill(o.bg || [0.95, 0.85, 0.9]);
        if (o.snowBg) {
          ov.begin();
          const g = rand(9);
          for (let i = 0; i < 50; i++) ov.rect(g() * FW, frac(g() + t * 0.1) * FH, 3, 3, { flat: [1, 1, 1, 0.9], blend: true });
        }
      }
      if (o.stars) {
        ov.begin();
        const g = rand(5);
        for (let i = 0; i < 60; i++) ov.rect(g() * FW, g() * FH, 2, 2, { flat: [1, 1, 1, 0.8], blend: true });
      }
      if (o.spot) {
        ov.begin();
        ov.rect(FW * 0.2, FH * 0.1, FW * 0.6, FH * 0.9, { texture: T.glow, additive: true, alpha: 0.5 });
      }
      const dist = (o.eye ? 0.22 : o.g ? 0.95 : 0.62) - local * (o.push || 0.03);
      const tx = o.eye ? 0.04 : (o.dx || 0);
      const aimY = head[1] - (o.g ? 0.12 : 0.02) + (o.eye ? 0.03 : 0);
      const camera = camFor([head[0] + tx, aimY + 0.01, head[2] + dist], [head[0] + tx, aimY, head[2]], o.eye ? 26 : 34, t, 0.004);
      studio(camera);
      actor.draw();
      const a = actor;
      if (o.bubble) r.draw(X.disc, M4.chain(a.m.head, M4.translate(0, -0.1, 0.16), M4.scale(0.08 + S(t * 3) * 0.02)), { flat: [1, 0.55, 0.8, 0.9], blend: true });
      if (o.moon) r.draw(X.emoji, M4.chain(M4.translate(0.02, 1.2, 0.18), M4.scale(0.07)), { tint: [1.3, 1.3, 1.1] });
      if (o.hearts) {
        ov.begin();
        [[0.12, 0.3], [0.2, 0.5]].forEach(([x, y], i) => ov.rect(FW * x, FH * y - S(t * 3 + i) * 6, 40, 40, { texture: capTex({ text: '♥', size: 200, color: '#f06ab0' }), blend: true }));
      }
      if (o.fire) {
        ov.begin();
        const g = rand(Math.floor(t * 10));
        for (let i = 0; i < 26; i++) {
          const rr = 40 + g() * 90;
          ov.rect(g() * FW - rr, g() * FH - rr, rr * 2, rr * 2, { texture: T.glow, additive: true, alpha: 0.75, tint: [1, 0.45 + g() * 0.3, 0.1] });
        }
      }
      if (o.specs) {
        const hdm = a.m.head;
        [-1, 1].forEach(sx => r.draw(X.ring, M4.chain(hdm, M4.translate(sx * 0.045, -0.02, 0.118), M4.scale(0.032)), { tint: [0.9, 0.15, 0.2], noFog: true }));
      }
      if (o.curtains) {
        ov.begin();
        [0, FW - 70].forEach(x => {
          ov.rect(x, 0, 70, FH, { flat: [0.55, 0.05, 0.08, 1] });
          for (let i = 0; i < 5; i++) ov.rect(x + 6 + i * 13, 0, 4, FH, { flat: [0.35, 0.02, 0.05, 1] });
        });
      }
      if (o.instrument) {
        const hl = M4.point(a.m.foreL, [0, -0.25, 0]), hr = M4.point(a.m.foreR, [0, -0.25, 0]);
        r.draw(X.unitLit, M4.chain(M4.translate((hl[0] + hr[0]) / 2, (hl[1] + hr[1]) / 2 + 0.02, Math.max(hl[2], hr[2]) + 0.03), M4.rotZ(0.3), M4.scale(0.05, 0.16, 1)), { flat: [0.16, 0.12, 0.2, 1] });
      }
      if (o.catEmoji) {
        ov.begin();
        ov.rect(FW * 0.64, FH * 0.7, FH * 0.16, FH * 0.16, { texture: texOf('catemoji', UI.catEmoji(), 128, 128), blend: true });
      }
      if (o.chibi) chibi(t, o.chibi);
    }

    function sceneMenu(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      if (o.cone) {
        const camera = camFor([0.9, 0, 3.4], [0.9, 0, 0], 40, t, 0.002);
        r.begin(ENVS.space, camera);
        starDome(camera);
        r.draw(X.card, M4.chain(M4.translate(0.1, 0, 0), M4.rotY(0.35 + S(t * 0.6) * 0.05), M4.rotZ(-0.1), M4.scale(1.3)), { texture: texOf('card:' + (o.art || 'bronya') + 'g', cardArt({ art: o.art || 'bronya', gold: true }), 256, 360) });
      } else if (o.stand) {
        const right = o.purple;
        const zoomK = o.standZoom ? clamp(local / 1.5, 0, 1) : 0;
        const camera = o.standClose ? camFor([-0.079, 1.641, 0.467], [-0.079, 1.636, 0], 40, t, 0.004) : o.standX !== undefined ? camFor([o.standX, 1.3, 3.0], [o.standX, 1.05, 0], 40, t, 0.004) : right ? camFor([-0.35, 1.52, 1.25], [-0.35, 1.48, 0], 40, t, 0.004) : camFor([0.9, 1.3 + zoomK * 0.25, 3.4 - zoomK * 1.6], [0.9, 1.0 + zoomK * 0.35, 0], 40, t, 0.004);
        r.begin(ENVS.space, camera);
        if (o.purple) {
          fill([0.22, 0.12, 0.38]);
          r.begin(ENVS.space, camera, null, true);
        } else if (o.dark) {
          fill([0.02, 0.02, 0.05]);
          r.begin(ENVS.space, camera, null, true);
        } else {
          starDome(camera);
          r.draw(X.platform);
        }
        const p = basePose(0, 0, S(local * 0.5) * 0.1);
        p.face = 'calm';
        gesture(p, o.g || 'rest');
        const mat = o.materialize && local < 0.45;
        drawCast(o.who || 'bronya', p, o.dark ? { flat: [0.05, 0.05, 0.08, 1] } : mat ? { flat: [0.5, 0.8, 1, 0.5] } : o.glow ? { tint: [0.9, 1.2, 1.8] } : undefined);
      } else if ((o.cast && o.ui !== 'banner') || o.lineup) {
        const camera = o.lineup ? camFor([0, 1.35, 3.8], [0, 1.05, 0], 40, t, 0.003) : camFor([0.95, 1.32, 1.6], [0.95, 1.22, 0], 44, t, 0.003);
        r.begin(ENVS.space, camera);
        if (o.lineup) {
          fill([0.86, 0.9, 0.95]);
          r.begin(ENVS.snow, camera, null, true);
          r.draw(X.snow, null, { texture: T.snow });
        } else starDome(camera, 'nebula');
        (o.cast || []).forEach((k, i) => {
          const solo = (o.cast || []).length === 1;
          const p = o.lineup ? basePose(-2.2 + i * 1.45, i === 1 ? 0.6 : i === 2 ? -1 : 0, 0) : solo ? basePose(1.25, 0.2, -0.2) : basePose(0.55 + i * 0.75, -0.35 * i, -0.3 + i * 0.2);
          p.face = o.lineup ? 'smile' : 'smug';
          gesture(p, o.lineup ? 'rest' : ['cast', 'aim', 'rest'][i % 3]);
          drawCast(k, p);
        });
      } else if (o.planets) {
        const camera = camFor([0, 0, 6], [0, 0, 0], 44, t, 0);
        r.begin(ENVS.space, camera);
        starDome(camera, 'nebula');
        [[1.29, 0.24, 0.9, [0.62, 0.36, 0.95]], [1.03, -1.6, 0.36, [0.7, 0.45, 1]]].forEach(([x, y, rad, col], i) => {
          r.draw(X.orb, M4.chain(M4.translate(x, y, 0), M4.rotY(t * 0.3), M4.rotX(0.4), M4.scale(rad)), { tint: col });
          if (o.pick === 1 && i === 0) r.draw(X.ring, M4.chain(M4.translate(x, y, 0.1), M4.scale(rad * 1.5)), { tint: [0.5, 0.8, 1], noFog: true });
        });
      } else if (o.bg3d === 'stars' || o.bg3d === 'swirl') {
        const camera = camFor([0, 0, 5], [0, 0, 0], 50, t, 0);
        r.begin(ENVS.space, camera);
        starDome(camera);
        if (o.bg3d === 'swirl') r.draw(X.ring, M4.chain(M4.rotZ(t), M4.scale(4)), { tint: [0.5, 0.8, 1], noFog: true });
      } else fill(o.bgColor || [0.05, 0.06, 0.14]);
      if (o.blurBg) blurFull(1);
      if (o.dim) fill([0, 0, 0], 0.5);
      const tx = o.ui ? uiTex(o) : null;
      if (tx) {
        ov.begin();
        const s2 = 1 + (o.zoomIn ? local * 0.02 * o.zoomIn : 0);
        if (o.small) ov.rect(FW * 0.05, FH * 0.05, FW * 0.3, FH * 0.15, { texture: tx, blend: true });
        else if (o.half) ov.rect(0, 0, FW * 0.55, FH, { texture: tx, blend: true });
        else if (o.purple && o.ui !== 'results') ov.rect(-FW * 0.12, FH * 0.1, FW * 0.72, FH * 0.8, { texture: tx, blend: true });
        else if (o.panelTilt) r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(-0.07), M4.scale(FW * 0.86 * s2, -FH * 0.86 * s2, 1)), { texture: tx, noFog: true, blend: true });
        else if (o.tilt) r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(0.35), M4.scale(FW * 1.1, -FH * 1.1, 1)), { texture: tx, noFog: true });
        else ov.rect(FW / 2 - (FW * s2) / 2, FH / 2 - (FH * s2) / 2, FW * s2, FH * s2, { texture: tx, blend: true });
      }
      if (o.lightning) {
        ov.begin();
        const g = rand(Math.floor(t * 8));
        for (let i = 0; i < 10; i++) {
          const rr = 40 + g() * 80;
          ov.rect(g() * FW - rr, g() * FH - rr, rr * 2, rr * 2, { texture: T.glow, additive: true, alpha: 0.7, tint: [0.8, 0.75, 0.25] });
        }
      }
      if (o.heart && t > o.heart) {
        ov.begin();
        ov.rect(FW * 0.3, FH * 0.7, 14, 14, { texture: capTex({ text: '♥', size: 200, color: '#e03040' }), blend: true });
      }
    }

    function sceneWarp(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const len = Math.max(0.2, sh.end - sh.start);
      const k = clamp(local / len, 0, 1);
      if (o.v === 'door' || o.v === 'glowdoor') {
        const camera = o.v === 'glowdoor' ? camFor([0, 1.4, 3 - k * 2.5], [0, 1.8, 0], 46, t, 0.004) : camFor([0, 2.6, 3.4 - k * 0.8], [0, 0.6, 0], 46, t, 0.004);
        r.begin(ENVS.gold, camera);
        starDome(camera);
        r.draw(X.door);
        if (o.sweep) r.draw(X.unit, M4.chain(M4.translate(-2 + k * 4, 0.6, 0.6), M4.scale(0.6, 1.2, 1)), { flat: [0.5, 0.85, 1, 0.8], additive: true, noFog: true });
        if (o.v === 'glowdoor') r.draw(X.unit, M4.chain(M4.translate(0, 1.8, 0.35), M4.scale(2.6, 3.4, 1)), { flat: [1, 0.85, 0.5, 0.5 + k * 0.5], additive: true, noFog: true });
      } else if (o.v === 'tunnel') {
        const camera = camFor([0, 0, 0], [0, 0, -5], 70, t, 0);
        r.begin(Object.assign({}, ENVS.space, { fogColor: [0.4, 0.7, 1], fogNear: 4, fogFar: 30 }), camera);
        r.draw(X.tunnel, M4.chain(M4.translate(0, 0, (local * 18) % 9), M4.rotZ(local * 0.6)));
        r.draw(X.disc, M4.chain(M4.translate(0, 0, -20), M4.scale(4 + k * 10)), { flat: [0.7, 0.9, 1, 0.8], additive: true, noFog: true });
      } else if (o.v === 'express') {
        const camera = camFor([0.5, 1.4, 6], [0, 1.2, 0], 44, t, 0.003);
        r.begin(ENVS.space, camera);
        starDome(camera);
        if (o.far) {
          speedLines(t, [0.5, 0.75, 1], 30);
          r.begin(ENVS.space, camera, null, true);
          r.draw(X.disc, M4.chain(M4.translate(0, 1.2, -20), M4.scale(3 + local)), { flat: [0.8, 0.9, 1, 0.8], additive: true, noFog: true });
        }
        const z = o.far ? -60 + local * 25 : -8 + local * 4;
        r.draw(X.express, M4.chain(M4.translate(0, 0, z), M4.scale(o.far ? 0.3 : 1)));
      } else if (o.v === 'fivestar') {
        fill([0, 0, 0]);
        ov.begin();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * PI * 2 - PI / 2;
          const rr = 60 * (1 - k);
          ov.rect(FW / 2 + C(a) * rr - 6, FH / 2 + S(a) * rr - 6, 12, 12, { flat: [1, 0.85, 0.4, 1] });
        }
        ov.rect(FW / 2 - 1, 0, 2, FH, { flat: [1, 0.9, 0.6, 0.6], blend: true });
      } else {
        const camera = camFor([0, 0, 3.2], [0, 0, 0], 40, t, 0);
        r.begin(ENVS.space, camera);
        starDome(camera);
        const result = o.v === 'result';
        const spin = result ? 0 : (1 - ease(Math.min(1, k * 2))) * PI * 3;
        const rays = o.gold ? [1, 0.85, 0.4] : o.purple ? [0.8, 0.5, 1] : [0.5, 0.75, 1];
        if (!result) r.draw(X.disc, M4.scale(2 + S(t * 4) * 0.2), { flat: rays.concat([0.35]), additive: true, noFog: true });
        else r.draw(X.unit, M4.chain(M4.translate(0, -1.3, -0.5), M4.rotX(-1.2), M4.scale(8, 2, 1)), { flat: [1, 1, 1, 0.4], additive: true, noFog: true });
        r.draw(X.card, M4.chain(M4.translate(result ? 0.22 : 0, result ? 0.3 : 0, 0), M4.rotY(spin + 0.25), M4.rotZ(result ? -0.2 : -0.08)), { texture: texOf('card:' + (o.art || '') + (o.gold ? 'g' : o.purple ? 'p' : 'b'), cardArt(o), 256, 360) });
        if (result) {
          ov.begin();
          ov.rect(0, 0, FW, FH, { texture: texOf('res:' + o.title + (o.isNew ? 'n' : ''), resultLabel(o)), blend: true });
        }
      }
    }

    function scenePompom(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const cams = {
        chest: [[0.15, 1.12, 2.1], [0, 1.08, 0], 40],
        door: [[0, 1.05, 2.1], [0, 1.02, 0], 40],
        lamp: [[0, 1.55, 1.2 - local * 0.5], [0, 1.58, 0], 40]
      };
      const c = cams[o.cam || 'door'];
      const camera = camFor(c[0], c[1], c[2], t, 0.004);
      r.begin(ENVS.gold, camera);
      fill(o.purple ? [0.3, 0.14, 0.42] : [0.12, 0.08, 0.06]);
      r.begin(ENVS.gold, camera, null, true);
      if (o.cam === 'door') {
        r.draw(X.door, M4.chain(M4.translate(0, -0.3, -0.6), M4.scale(0.55)), { texture: T.metal, tint: [1.9, 1.7, 1.15] });
      }
      const fling = o.fling ? clamp(local * 2, 0, 1) : 0;
      r.draw(X.pompom, M4.chain(M4.rotY(S(t * 2) * 0.1), M4.scale(1, 1 + fling * 0.05, 1)));
      if (o.cam === 'door') {
        const g = rand(7);
        ov.begin();
        for (let i = 0; i < 14; i++) {
          const left = i % 2 === 0;
          const rr = 40 + g() * 45;
          const px = left ? g() * FW * 0.3 : FW * (0.7 + g() * 0.3);
          ov.rect(px - rr, FH * (0.1 + g() * 0.5) - rr - local * 5, rr * 2, rr * 2, { texture: T.glow, additive: true, alpha: 0.5, tint: [1, 1, 1] });
        }
      }
      if (o.fling || o.cam === 'lamp') {
        const g = rand(3);
        ov.begin();
        for (let i = 0; i < 10; i++) ov.rect(g() * FW - 40, FH * 0.3 + g() * FH * 0.6, 80 + g() * 60, 50 + g() * 40, { texture: T.glow, additive: true, alpha: 0.4 * (o.fling ? fling : 1) });
      }
    }

    function sceneBurst(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const k = clamp(local / Math.max(0.2, sh.end - sh.start), 0, 1);
      fill(o.color || [1, 1, 1]);
      ov.begin();
      if (o.ring) {
        for (let i = 0; i < 3; i++) r.draw(X.ring, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(t * (i + 1)), M4.scale(60 + i * 40 + k * 80)), { tint: [0.9, 0.6, 1], noFog: true });
      }
      if (o.slashes) {
        const g = rand(Math.floor(t * 10));
        for (let i = 0; i < 6; i++) r.draw(X.unit, M4.chain(M4.translate(g() * FW, g() * FH, 0), M4.rotZ(g() * PI), M4.scale(FW * 0.8, 4, 1)), { flat: [1, 1, 1, 0.9], additive: true, noFog: true });
      }
      if (o.star) r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(PI / 4), M4.scale(40 + k * 200, 40 + k * 200, 1)), { flat: [1, 0.95, 0.7, 1 - k], blend: true });
      if (o.band) ov.rect(0, FH * 0.4, FW, FH * 0.2, { flat: [0, 0, 0, 1] });
      if (o.fire) {
        const g = rand(Math.floor(t * 10));
        for (let i = 0; i < 30; i++) {
          const x = g() * FW, y = g() * FH, s2 = 40 + g() * 120;
          ov.rect(x - s2 / 2, y - s2 / 2, s2, s2, { texture: T.glow, additive: true, alpha: 0.6, tint: [1, 0.55 + g() * 0.3, 0.15] });
        }
        if (o.jet && local > 0.7 && local < 1.3) r.draw(X.unit, M4.chain(M4.translate(FW * 0.5, FH * 0.45, 0), M4.rotZ(0.3), M4.scale(90, 20, 1)), { flat: [0.4, 0.42, 0.45, 1] });
      }
      if (o.holo) {
        const camera = camFor([0, 1.1, 3.4], [0, 1.0, 0], 40, t, 0.01);
        studio(camera);
        [-0.5, 0.5].forEach((x, i) => drawCast(i ? 'caelus' : 'seele', basePose(x, 0, 0), { flat: [0.4, 0.8, 1, 0.55] }));
      }
      if (o.shatter) {
        const g = rand(9);
        for (let i = 0; i < 14; i++) r.draw(X.unit, M4.chain(M4.translate(g() * FW, g() * FH + k * 60, 0), M4.rotZ(g() * PI + k), M4.scale(40 + g() * 60, 30 + g() * 50, 1)), { flat: [0.8, 0.9, 1, 0.6], blend: true });
      }
      speedLines(t, [1, 1, 1], 10);
      if (o.text) ov.rect(FW * 0.25, FH * 0.38, FW * 0.5, FH * 0.24, { texture: capTex({ text: o.text, size: 90, color: '#f2d06a', stroke: '#3a2408' }), blend: true });
      if (o.pop) ov.rect(FW * 0.3, FH * 0.3, FW * 0.4, FH * 0.3, { texture: capTex({ text: o.pop, size: 120, color: '#ffd65a', stroke: '#5a2a00' }), blend: true });
    }

    function sceneMeme(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      if (!o.noBg) fill(o.bg || [0.12, 0.14, 0.24]);
      if (o.burst) {
        ov.begin();
        ov.rect(FW / 2 - 150, FH / 2 - 150, 300, 300, { texture: T.glow, additive: true, alpha: 0.9, tint: [1, 1, 1] });
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * PI * 2 + t * 0.6;
          r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(a), M4.translate(FW * 0.5, 0, 0), M4.scale(FW, 18 + (i % 3) * 8, 1)), { flat: i % 2 ? [0.75, 0.88, 1, 0.55] : [1, 1, 1, 0.6], blend: true });
        }
      }
      const camera = camFor([0, 0.2, 4.2 - local * (o.push || 0.15)], [0, 0.2, 0], 36, t, 0.006);
      studio(camera);
      const bob = S(t * 5) * 0.06;
      const spin = S(t * 2.2) * 0.25;
      if (o.card) r.draw(X.unitLit, M4.chain(M4.translate(0, 0.2, -0.6), M4.scale(3.2, 2.6, 1)), { flat: [0.98, 0.98, 0.98, 1] });
      const m = o.m || 'emoji';
      if (m === 'pixel') {
        r.draw(X.unit, M4.chain(M4.translate(0, 0.2 + bob, 0), M4.rotZ(S(t * 3) * 0.08), M4.scale(2.3, 2.3, 1)), { texture: texOf('pixel:' + (o.face || ''), UI.pixelEmoji({ face: o.face }), 24, 24, { nearest: true }), blend: true, noFog: true });
      } else if (m === 'emoji') {
        const mm = M4.chain(M4.translate(0, 0.2 + bob, 0), M4.rotY(spin), M4.rotZ(S(t * 3) * 0.08));
        r.draw(o.hands ? X.emojiHands : X.emoji, mm, m === 'pixel' ? { tint: [1, 0.95, 0.6] } : {});
        r.draw(X.emojiFace, mm, { texture: emoji[m === 'pixel' ? (o.face === 'x' ? 'x' : 'pixel') : (o.face || 'smile')] });
        if (o.goggles) r.draw(X.unit, M4.chain(mm, M4.translate(0, 0.25, 0.95), M4.scale(2.1, 0.18, 1)), { flat: [0.35, 0.35, 0.4, 1] });
        if (o.antlers) [-1, 1].forEach(s2 => r.draw(X.unit, M4.chain(mm, M4.translate(s2 * 0.7, 1.2, 0.2), M4.rotZ(s2 * 0.3), M4.scale(0.25, 0.8, 1)), { flat: [1, 1, 1, 1] }));
        if (o.bat) r.draw(X.unit, M4.chain(mm, M4.translate(1.1, 0.3, 0.3), M4.rotZ(-0.8), M4.scale(0.2, 2.2, 1)), { flat: [0.72, 0.5, 0.3, 1] });
        if (m === 'pixel') r.draw(X.unit, M4.chain(mm, M4.translate(1.1, -0.6, 0.4), M4.scale(0.6, 0.7, 1)), { flat: [0.95, 0.85, 0.55, 1] });
      } else if (m === 'penguin') {
        r.draw(X.penguin, M4.chain(M4.translate(0, -0.2 + bob * 0.5, 1.2 + local * 0.6), M4.rotY(0.3 + spin), M4.scale(1.3)));
      } else if (m === 'penguins') {
        for (let i = 0; i < 24; i++) r.draw(X.penguin, M4.chain(M4.translate((i % 8 - 3.5) * 0.7, -1 + Math.floor(i / 8) * 0.25, -Math.floor(i / 8) * 1.2), M4.rotY(S(t * 3 + i) * 0.4), M4.scale(0.45)));
      } else if (m === 'cat' || m === 'catWhite' || m === 'catBlack') {
        const near = o.close ? 1.6 : 0;
        r.draw(X[m], M4.chain(M4.translate(-0.3, -0.2 + bob * 0.3 - near * 0.3, 0.6 + near), M4.rotY((o.close ? -1.6 : -0.6) + spin * 0.4), M4.scale(1.1)), o.smug ? { tint: [1.1, 0.95, 0.8] } : {});
        if (o.tablet || o.petted) {
          const cam2 = camFor([0.8, 1.2, 2.2], [0.8, 1.1, 0], 38, t, 0.004);
          studio(cam2);
          const p = basePose(0, 0, -0.4);
          p.face = 'talk';
          gesture(p, o.petted ? 'palmUp' : 'pointSide', local);
          drawCast('woman', p);
        }
      } else if (m === 'cats') {
        [-0.37, 0.37].forEach((x, i) => r.draw(X.catWhite, M4.chain(M4.translate(x, -0.2, 0.03), M4.rotY(-PI / 2 + (i ? 0.12 : -0.12)), M4.scale(1.35))));
      } else if (m === 'horse') {
        if (o.close) {
          const mm = M4.chain(M4.translate(0, -1.2 - local * 0.2, 2.2), M4.rotY(-PI / 2), M4.rotZ(-0.6), M4.scale(1.2));
          r.draw(X.horse, mm, o.black ? { tint: [0.3, 0.26, 0.26] } : {});
        } else {
          studio(camFor([-0.5, 0.62, 3.0], [-0.5, 0.58, 0], 36, t, 0.004));
          r.draw(X.unitLit, M4.chain(M4.translate(-0.5, 0.6, -1.4), M4.scale(5, 3.4, 1)), { flat: [0.9, 0.86, 0.76, 1] });
          for (let i = 0; i < 7; i++) r.draw(X.unitLit, M4.chain(M4.translate(-2.3 + i * 0.6, 0.6, -1.3), M4.scale(0.07, 3.2, 1)), { flat: [0.55, 0.56, 0.6, 1] });
          r.draw(X.unitLit, M4.chain(M4.translate(-0.5, 1.55, -1.28), M4.scale(5, 0.1, 1)), { flat: [0.5, 0.5, 0.55, 1] });
          r.draw(X.horseHead, M4.chain(M4.rotY(-PI / 2 + S(t) * 0.05), M4.rotX(S(t * 1.3) * 0.03)), o.black ? { tint: [0.35, 0.3, 0.3] } : {});
        }
      } else if (m === 'dog') {
        r.draw(X.props.dog, M4.chain(M4.translate(0, o.face ? -0.38 : -0.2, o.face ? 2.3 : 1.4), M4.rotY(o.face ? -PI / 2 : o.sad ? -1.9 : -1.3), M4.rotZ(o.sad ? 0.4 : 0), M4.scale(1.3)), o.sad ? { tint: [0.9, 0.75, 0.6] } : {});
      } else if (m === 'pigeon' || m === 'rooster') {
        const walkX = o.tired ? 0 : 1.5 - local * 0.8;
        r.draw(X[m], M4.chain(M4.translate(walkX, -0.1 + (o.tired ? 0 : Math.abs(S(t * 6)) * 0.1), 1.0), M4.rotY(o.tired ? -0.4 : -PI / 2), M4.rotX(o.tired ? 0.3 : 0), M4.scale(1.4)), o.tint ? { tint: o.tint } : {});
      } else if (m === 'svarog') {
        r.draw(foes.svarog, M4.chain(M4.translate(0, -1.1, -0.3), M4.rotY(0.3 + spin * 0.3), M4.scale(0.55)));
      } else if (m === 'rag') {
        const sh2 = S(t * 40) * 0.03;
        r.draw(X.props.rag, M4.chain(M4.translate(sh2, -0.5, 1.4), M4.rotX(0.7), M4.scale(1.3)));
      } else if (m === 'grid') {
        for (let i = 0; i < 9; i++) {
          const mm = M4.chain(M4.translate((i % 3 - 1) * 1.6, (Math.floor(i / 3) - 1) * 1.3 + 0.2, 0), M4.scale(0.55 + local * 0.2 * (i === 4 ? 1 : 0)));
          r.draw(X.emoji, mm, { tint: [0.35, 0.3, 0.28] });
          r.draw(X.emojiFace, mm, { texture: emoji.grin });
        }
      } else if (m === 'trio') {
        const cam2 = camFor([0, 1.3, 3.2], [0, 1.2, 0], 38, t, 0.004);
        studio(cam2);
        [-0.45, 0.45].forEach((x, i) => {
          const p = basePose(x, 0.6, -x * 0.8);
          p.face = 'smug';
          gesture(p, 'hands');
          drawCast('shirtless', p, { tint: [1.1, 0.9, 0.75] });
        });
      } else if (m === 'tumble' || m === 'tpose') {
        const cam2 = m === 'tpose' ? camFor([0, 1.2, 3.4 - local * 1.3], [0, 1.1 + local * 0.1, 0], 40, t, 0.004) : camFor([0, 1.08, 2.55], [0, 1.08, 0], 40, t, 0.004);
        studio(cam2);
        const p = basePose(0, 0, 0);
        p.face = m === 'tpose' ? 'calm' : 'shock';
        if (m === 'tumble') {
          p.ground = false;
          p.y = 0.2;
          p.pivot = 0.9;
          p.rz = (t - 5.0) * PI * 1.6;
        } else gesture(p, 'tpose');
        drawCast(o.who || 'cerydra', p);
      } else if (m === 'thought') {
        r.draw(X.cat, M4.chain(M4.translate(-1.2, -0.6, 0.4), M4.rotY(-0.3), M4.scale(1.1)));
        r.draw(X.disc, M4.chain(M4.translate(1.1, 1.0, 0), M4.scale(1.8, 1.3, 1)), { flat: [0.2, 0.2, 0.24, 1] });
        const cam2 = camFor([-1.3, 1.25, 2.2], [-1.3, 1.1, 0], 36, t, 0.004);
        studio(cam2, { x: Math.round(FW * 0.55), y: Math.round(FH * 0.45), w: Math.round(FW * 0.36), h: Math.round(FH * 0.5) });
        const p = basePose(0, 0, 0);
        p.face = 'happy';
        const a = castOf('cerydra');
        a.solver.scale = 0.6;
        a.solve(p);
        a.draw({ headScale: 1.8 });
        a.solver.scale = 1;
      } else if (m === 'hero') {
        const cam2 = camFor([0, 1.3, 5 - local * 0.4], [0, 1.2, 0], 40, t, 0.01);
        studio(cam2);
        const p = basePose(0, 1 + local * 0.5, 0);
        const ph = local * 7;
        p.hipL = [S(ph) * 0.4, 0, 0];
        p.hipR = [-S(ph) * 0.4, 0, 0];
        p.face = 'calm';
        drawCast('streamer', p, { tint: [0.9, 0.3, 0.3] });
        const g = rand(Math.floor(t * 3));
        for (let i = 0; i < 3; i++) r.draw(X.disc, M4.chain(M4.translate((g() - 0.5) * 6, 1 + g(), -3), M4.scale(1 + g())), { flat: [1, 0.7, 0.3, 0.6], additive: true, noFog: true });
      } else if (m === 'car') {
        const cam2 = camFor([3.5, 1.4, 3.5 - local * 0.3], [0, 0.8, 0], 40, t, 0.01);
        studio(cam2);
        r.draw(X.unitLit, M4.chain(M4.translate(0, 0, -3), M4.rotX(-PI / 2), M4.scale(30, 30, 1)), { flat: [0.3, 0.32, 0.34, 1] });
        r.draw(car, M4.rotY(0.5 + S(t) * 0.2));
        const p = basePose(0.5, 0.2, 0.9);
        p.ground = false;
        p.y = 0.1;
        p.face = 'happy';
        gesture(p, 'peace');
        const a = castOf(o.who || 'capgirl');
        a.solver.scale = 0.9;
        a.solve(p);
        a.draw();
        a.solver.scale = 1;
      } else if (m === 'glass') {
        r.draw(X.cat, M4.chain(M4.translate(0, 0.1, 0.8), M4.rotY(0.4), M4.scale(0.45)), { tint: [1.3, 0.8, 0.45] });
        r.draw(X.disc, M4.chain(M4.translate(0, 0.25, 1.3), M4.scale(1.1, 0.8, 1)), { flat: [0.9, 0.95, 1, 0.25], blend: true });
        r.draw(X.unit, M4.chain(M4.translate(0, -0.6, 1.3), M4.scale(0.05, 1, 1)), { flat: [0.9, 0.95, 1, 0.5], blend: true });
      } else if (m === 'monkeys') {
        for (let i = 0; i < 35; i++) {
          const row = Math.floor(i / 7);
          r.draw(X.monkey, M4.chain(M4.translate((i % 7 - 3) * 0.72 + (row % 2) * 0.3 + S(t * 3 + i) * 0.08, -1.25 + row * 0.5, 0.6 - row * 0.8), M4.rotY(S(t * 1.5 + i) * 0.6), M4.scale(0.7)));
        }
        ['kidboy', 'kidgirl', 'kidboy'].forEach((k, i) => {
          const p = basePose(-1.4 + i * 1.3, -3.6, 0);
          p.face = 'calm';
          drawCast(k, p);
        });
      } else if (m === 'kids') {
        const cam2 = camFor([0.1, 0.8, 1.45], [0, 0.62, 0], 40, t, 0.004);
        studio(cam2);
        ['kidgirl', 'kidboy'].forEach((k, i) => {
          const p = basePose(-0.4 + i * 0.8, 0, PI * 0.85);
          gesture(p, i ? 'waveR' : 'waveL', local);
          drawCast(k, p);
        });
      } else if (m === 'crewmate') {
        r.draw(X.unitLit, M4.chain(M4.translate(0.25, 0.2, 0), M4.scale(2.4, 1.3, 1)), { texture: texOf('crewsign', UI.note({ text: o.sign || '', bg: '#fafafa', color: '#111111', size: 60 }), 512, 280) });
        r.draw(crewmate, M4.chain(M4.translate(-1.1, -0.35, 0.3), M4.rotY(0.5 + S(t) * 0.1), M4.scale(0.55)), { tint: [1.2, 0.4, 0.4] });
      } else if (m === 'wolfgirl') {
        const cam2 = camFor([0, 1.4, 1.6], [0, 1.35, 0], 38, t, 0.004);
        studio(cam2);
        const p = basePose(0, 0, 0);
        p.face = 'blink';
        drawCast('woman', p);
        r.draw(X.props.dog, M4.chain(M4.translate(0.18, 1.3, 0.3), M4.rotY(-2.4), M4.scale(0.6)), { tint: [0.7, 0.7, 0.72] });
      } else if (m === 'werewolf') {
        const s2 = 1 - local * 0.06;
        r.draw(X.props.dog, M4.chain(M4.translate(0, -0.6, 0.5), M4.rotY(-1.2), M4.scale(1.3 * s2)), { tint: [1.5, 1.5, 1.5] });
      } else if (m === 'enigmata') {
        const cam2 = camFor([0, 1.2, 3], [0, 1.1, 0], 38, t, 0.004);
        studio(cam2);
        const p = basePose(0, 0, 0);
        gesture(p, 'present');
        const a = drawCast('streamer', p, { flat: [0.94, 0.94, 0.94, 1] });
        r.draw(X.emoji, M4.chain(a.m.head, M4.scale(0.13)), { tint: [1.2, 0.9, 0.3] });
        r.draw(X.unit, M4.chain(M4.translate(0.55, 1.5, 0.3), M4.rotZ(-0.6), M4.scale(0.1, 0.5, 1)), { flat: [0.2, 0.8, 0.3, 1] });
        r.draw(X.unit, M4.chain(M4.translate(0.35, 1.35, 0.3), M4.rotZ(0.7), M4.scale(0.1, 0.25, 1)), { flat: [0.2, 0.8, 0.3, 1] });
      } else if (m === 'sign') {
        r.draw(X.unit, M4.chain(M4.translate(0, 0.2, 0), M4.rotZ(S(t * 1.5) * 0.02), M4.scale(1.5, 2.1, 1)), { texture: texOf('posterArt', UI.poster(), 384, 540) });
      } else if (m === 'catCalico') {
        r.draw(X.catWhite, M4.chain(M4.translate(-0.2, -0.3, 0.6), M4.rotY(-0.4), M4.scale(1.1)), { tint: [1, 0.85, 0.6] });
      } else if (m === 'person') {
        const p = basePose(0, 0, 0);
        p.face = o.g === 'facepalm' ? 'sad' : 'shock';
        gesture(p, o.g || 'armsUp', local);
        const a = castOf(o.who || 'woman');
        a.solve(p);
        const hd = a.headPoint();
        const cam2 = o.store ? camFor([0, hd[1] + 0.02, 2.6], [0, hd[1] - 0.02, 0], 40, t, 0.006) : camFor([0, hd[1] - 0.35, 2.6], [0, hd[1] - 0.4, 0], 40, t, 0.006);
        studio(cam2);
        a.draw();
        if (o.store) {
          const hl = M4.point(a.m.foreL, [0, -0.28, 0]), hr = M4.point(a.m.foreR, [0, -0.28, 0]);
          r.draw(X.unitLit, M4.chain(M4.translate((hl[0] + hr[0]) / 2, Math.max(hl[1], hr[1]) + 0.08, (hl[2] + hr[2]) / 2 + 0.05), M4.scale(0.45, 0.2, 1)), { flat: [1, 0.55, 0.12, 1] });
          ov.begin();
          ov.rect(FW * 0.3, FH * 0.14, FW * 0.4, FH * 0.2, { texture: texOf('gistore', UI.note({ text: 'Genshin Impact   [Удалить]  [Играть]', bg: '#1c2230', color: '#e8e8f0', size: 34 }), 512, 200) });
        }
      } else if (m === 'sprout') {
        const g = rand(Math.floor(t * 8));
        ov.begin();
        for (let i = 0; i < 20; i++) {
          const rr = 50 + g() * 90;
          ov.rect(g() * FW - rr, g() * FH - rr, rr * 2, rr * 2, { texture: T.glow, additive: true, alpha: 0.7, tint: [1, 0.45 + g() * 0.3, 0.1] });
        }
        const cam3 = camFor([0, 0.1, 1.6], [0, 0.05, 0], 36, t, 0.004);
        studio(cam3);
        [-1, 1].forEach(sx => r.draw(X.disc, M4.chain(M4.translate(sx * 0.15, -0.2, 0.01), M4.rotZ(sx * 0.3), M4.scale(0.32, 0.17, 1)), { flat: [0.95, 0.78, 0.66, 1] }));
        r.draw(X.unit, M4.chain(M4.translate(0, 0.08, 0.02), M4.scale(0.02, 0.3, 1)), { flat: [0.3, 0.6, 0.25, 1] });
        [-1, 1].forEach(sx => r.draw(X.disc, M4.chain(M4.translate(sx * 0.07, 0.24, 0.03), M4.scale(0.14, 0.07, 1)), { flat: [0.4, 0.8, 0.3, 1] }));
        r.draw(X.disc, M4.chain(M4.translate(0, 0.33, 0.04), M4.scale(0.07)), { flat: [1, 0.9, 0.2, 1] });
      } else if (m === 'chibi') {
        const cam2 = camFor([0.9, 1.3, 1.9], [0.9, 1.2, 0], 36, t, 0.004);
        studio(cam2);
        const p = basePose(0, 0, 0);
        p.face = o.face || 'happy';
        gesture(p, o.g || 'peace');
        drawCast(o.who || 'hayato', p);
      }
    }

    function sceneSpin(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      fill([1, 1, 1]);
      ov.begin();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2 + t * 1.5;
        r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(a), M4.translate(FW * 0.5, 0, 0), M4.scale(FW, 50, 1)), { flat: [0.05, 0.05, 0.05, 1] });
      }
      if (o.m === 'handshake') {
        const camera = camFor([0, 1.3, 3.0], [0, 1.2, 0], 38, t, 0.004);
        studio(camera);
        [-0.35, 0.35].forEach((x, i) => {
          const p = basePose(x, 0, i ? -1.2 : 1.2);
          p.shR = [1.2, 0.4, 0.1];
          p.elR = [0.3, 0, 0];
          const a = drawCast('streamer', p, { flat: [0.94, 0.94, 0.94, 1] });
          r.draw(X.emoji, M4.chain(a.m.head, M4.scale(0.13)), { tint: i ? [0.3, 0.35, 0.6] : [1.2, 0.6, 0.2] });
        });
      } else if (o.who) {
        ov.begin();
        ov.rect(FW * 0.27, FH * 0.1, FW * 0.46, FH * 0.8, { flat: (o.bg || [1, 1, 1]).concat([1]) });
        const down = o.slide ? clamp(local * 1.5, 0, 1) * 1.2 : 0;
        const p = basePose(0, 0, 0);
        p.face = o.face || 'shock';
        const a = castOf(o.who);
        a.solve(p);
        const hd = a.headPoint();
        const camera = camFor([0, hd[1] - 0.06 + down, 0.85], [0, hd[1] - 0.08 + down, 0], 34, t, 0.004);
        studio(camera, { x: Math.round(FW * 0.28), y: Math.round(FH * 0.12), w: Math.round(FW * 0.44), h: Math.round(FH * 0.76) });
        a.draw();
      }
      if (o.chibi) chibi(t, o.chibi);
    }

    function sceneText(t, sh) {
      const o = sh.o;
      fill([0, 0, 0]);
      const g = rand(Math.floor(t * 8));
      ov.begin();
      ov.rect(-FW * 0.18 + g() * 3, g() * 3, FW, FH, { texture: capTex({ text: o.text, size: 90, pos: 'center', color: '#e8e8e8', stroke: '#000000' }), blend: true });
      if (o.ghost) {
        const camera = camFor([0, 1.1, 3.4], [0, 1.0, 0], 40, t, 0.02);
        studio(camera, { x: Math.round(FW * 0.62), y: 0, w: Math.round(FW * 0.38), h: FH });
        const p = basePose(0, 0, 0);
        gesture(p, 'armsUp', t);
        drawCast('streamer', p, { flat: [0.95, 0.95, 0.95, 0.6] });
      }
    }

    function sceneElephant(t, sh) {
      const o = sh.o;
      fill([0.7, 0.78, 0.7]);
      const camera = camFor([0, 1.6, 6], [0, 1.6, 0], 44, t, 0.01);
      r.begin(ENVS.day, camera, null, true);
      if (elephant) r.draw(elephant, M4.chain(M4.translate(0.5, 0, -1), M4.rotY(-1.2 + S(t) * 0.1)), { tint: [0.62, 0.58, 0.58] });
      for (let i = 0; i < 4; i++) {
        const p = basePose(-2 + i * 1.1, 2.5, PI);
        const a = castOf('march');
        a.solver.scale = 0.55;
        a.solve(p);
        a.draw({ flat: [0.15, 0.15, 0.2, 1] });
        a.solver.scale = 1;
      }
      r.draw(X.unit, M4.chain(M4.translate(0, 1.5, 1.8), M4.scale(9, 4, 1)), { flat: [0.8, 0.95, 1, 0.15], blend: true, noFog: true });
      if (o.tint) {
        grab();
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: F.full, tint: o.tint });
      }
    }

    function sceneCutscene(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      if (o.v === 'arm') {
        const camera = camFor([0, 1.5, 1.6], [0, 1.2, -2], 46, t, 0.006);
        r.begin(Object.assign({}, ENVS.snow, { ambTop: [0.4, 0.46, 0.62], sunColor: [0.25, 0.28, 0.4], fogColor: [0.22, 0.26, 0.38] }), camera);
        r.draw(X.snow, null, { texture: T.snow, tint: [0.45, 0.5, 0.65] });
        const g = rand(23);
        for (let i = 0; i < 8; i++) {
          const bx = -9 + i * 2.6, bh = 3 + g() * 3.5;
          r.draw(X.unitLit, M4.chain(M4.translate(bx, bh / 2, -7), M4.scale(2.3, bh, 1)), { flat: [0.2, 0.22, 0.32, 1] });
          r.draw(X.unitLit, M4.chain(M4.translate(bx, bh + 0.05, -6.98), M4.scale(2.3, 0.12, 1)), { flat: [0.9, 0.92, 0.98, 1] });
          for (let wy = 0.9; wy < bh - 0.4; wy += 1.0) for (let wx = -0.7; wx <= 0.7; wx += 0.7) if (g() < 0.25) r.draw(X.unitLit, M4.chain(M4.translate(bx + wx, wy, -6.98), M4.scale(0.28, 0.4, 1)), { flat: [1, 0.72, 0.36, 1] });
        }
        r.draw(X.armorFg);
        ['bronya', 'asta', 'tingyun', 'yukong', 'caelus', 'march'].forEach((k, i) => {
          const p = basePose(-0.35 + i * 0.58, -2, 0);
          gesture(p, 'guard');
          drawCast(k, p);
        });
        if (o.streaks) speedLines(t, [0.8, 0.9, 1], 12);
      } else {
        const camera = camFor([1.4, 3.0, -1.5], [0, 2.4, -5.4], 36, t, 0.01);
        r.begin(ENVS.snow, camera);
        r.draw(X.snow, null, { texture: T.snow });
        r.draw(foes.svarog, M4.chain(M4.translate(0, -0.8, -5.4), M4.rotX(0.35)));
        const g = rand(Math.floor(t * 12));
        for (let i = 0; i < 12; i++) r.draw(X.disc, M4.chain(M4.translate((g() - 0.5) * 2, 1.5 + g() * 2, -4.6), M4.scale(0.06)), { flat: [1, 0.8, 0.3, 1], noFog: true });
        if (o.slash) {
          ov.begin();
          ov.rect(-40, FH * 0.3 + local * 80, FW + 80, 10, { flat: [1, 0.6, 0.2, 0.9], additive: true });
        }
      }
    }

    function sceneWall(t, sh) {
      const camera = camFor([0, 3, 8], [0, 1, -8], 46, t, 0.004);
      r.begin(ENVS.plaza, camera);
      fill([0.72, 0.82, 0.95]);
      r.begin(ENVS.plaza, camera, null, true);
      r.draw(X.props.wall);
      ov.begin();
      ov.rect(FW / 2 - 30, FH * 0.3, 60, 60, { texture: T.glow, additive: true });
      r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH * 0.3 + 30, 0), M4.rotZ(PI / 4), M4.scale(26, 26, 1)), { flat: [1, 0.82, 0.3, 1] });
    }

    function sceneChat(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      if (!o.noBg) fill([0.05, 0.07, 0.12]);
      const tx = uiTex({ ui: 'chat', lines: o.lines, bg: o.noBg ? 'rgba(0,0,0,0)' : o.bgColor, top: o.top, wide: o.full });
      const w = FW * (o.full ? 1 : 0.62), h = FH * (o.full ? 1 : 0.5);
      const s = 1 + (o.zoomIn ? local * 0.3 : 0);
      ov.begin();
      r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(o.spin ? local * 6 : 0), M4.scale(w * s, -h * s, 1)), { texture: tx, noFog: true });
    }

    function sceneDmg(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      if (!o.noBg) fill([0.04, 0.05, 0.1]);
      ov.begin();
      ov.rect(0, 0, FW, FH, { texture: texOf('dm:' + o.value + (o.note || '') + (o.label || '') + (o.box ? 'f' : '') + (o.plain ? 'p' : ''), UI.damage({ value: o.value, note: o.note, label: o.label, framed: o.box === 'border', plain: o.plain })), blend: true, alpha: clamp(local * 14, 0, 1) });
      if (o.emoji) {
        const camera = camFor([0, 0.2, 4], [0, 0.2, 0], 36, t, 0.006);
        studio(camera, { x: 0, y: 0, w: Math.round(FW * 0.55), h: FH });
        const mm = M4.chain(M4.translate(0, 0.2 + S(t * 5) * 0.06, 0), M4.rotY(S(t * 2) * 0.2));
        r.draw(o.antlers ? X.emoji : X.emojiHands, mm);
        r.draw(X.emojiFace, mm, { texture: emoji[o.emoji] });
        if (o.antlers) r.draw(X.antlers, mm);
      }
    }

    function sceneSponsor(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const mode = o.mode;
      if (mode === 'apps' || mode === 'logo' || mode === 'blur' || mode === 'coupons' || mode === 'coupon') {
        const camera = camFor([S(local * 0.3) * 0.5, 0.3, 3], [0, 0, 0], 50, t, 0);
        r.begin(ENVS.space, camera);
        fill(mode === 'blur' && o.light ? [0.86, 0.9, 0.96] : [0.05, 0.06, 0.1]);
        r.begin(ENVS.space, camera, null, true);
        if (mode === 'apps') r.draw(X.unit, M4.chain(M4.translate(-0.2, 0, -1), M4.rotX(-0.35), M4.rotZ(0.12), M4.translate(0, local * 0.3 - 0.5, 0), M4.scale(3.0, 5.2, 1)), { texture: texOf('apps4', UI.appGrid({ cols: 4, rows: 9, game: true }), 480, 1044) });
        else r.draw(X.unit, M4.chain(M4.translate(0, 0, -1), M4.rotX(-0.5), M4.rotZ(0.1), M4.translate(0, local * 0.3, 0), M4.scale(7, 4, 1)), { texture: texOf('apps' + (o.dark ? 'd' : ''), UI.appGrid({ light: mode === 'coupons' || mode === 'coupon' || o.light }), TW, TH) });
        if (mode !== 'apps') blurFull(1);
        if (mode === 'logo') {
          ov.begin();
          ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'sponsor', mode: 'logo' }), blend: true, alpha: 0.95 });
          if (o.popcat) {
            ov.begin();
            ov.rect(FW / 2 - 40, FH - 70, 80, 70, { texture: emoji.tongue });
          }
        } else if (mode === 'coupons' || mode === 'coupon') {
          const tx = uiTex({ ui: 'sponsor', mode: 'coupon' });
          ov.begin();
          if (mode === 'coupons') {
            const g = rand(4);
            for (let i = 0; i < 6; i++) ov.rect(g() * FW - 60, (g() * FH + local * 200) % FH - 40, 120, 68, { texture: tx });
          } else {
            const x = lerp(FW, FW * 0.15, ease(clamp(local * 3, 0, 1)));
            ov.rect(x, FH * 0.2, FW * 0.7, FH * 0.6, { texture: tx });
          }
        }
        return;
      }
      fill([0.05, 0.08, 0.18]);
      const tx = uiTex(Object.assign({ ui: 'sponsor' }, o, { mode: undefined }));
      const camera = camFor([S(local * 0.4) * 0.3, 0, 2.2 - local * 0.03], [0, 0, 0], 40, t, 0);
      r.begin(ENVS.space, camera);
      starDome(camera);
      r.draw(X.unit, M4.chain(M4.rotY(S(local * 0.5) * 0.15 + (o.tilt ? 0.35 : 0)), M4.rotX(o.tilt ? -0.2 : 0), M4.translate(0, o.scroll ? local * 0.08 : 0, 0), M4.scale(3.2, 1.8, 1)), { texture: tx });
      if (o.click) {
        ov.begin();
        ov.rect(FW * 0.5 - 12, FH * 0.8 - 12, 24, 24, { texture: T.glow, additive: true });
      }
    }

    function sceneEditor(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      ov.begin();
      ov.rect(0, 0, FW, FH, { texture: texOf('editor', UI.editor()) });
      const zoom = o.v === 'hand' ? local * 0.3 : 0;
      const camera = o.v === 'hand' ? camFor([-0.32 - zoom * 0.3, 1.4, 1.0 - zoom], [-0.32 - zoom * 0.3, 1.38, 0], 40, t, 0) : camFor([0.35, 1.35, 1.6], [0.15, 1.3, 0], 40, t, 0);
      r.begin(Object.assign({}, ENVS.studio, { fogColor: [0.23, 0.23, 0.23] }), camera, { x: 0, y: 0, w: Math.round(FW * 0.75), h: FH - 14 }, true);
      const p = basePose(0, 0, 0);
      p.shL = [0, 0, 1.45];
      p.shR = [0, 0, 1.45];
      p.elL = [0, 0, 0];
      p.elR = [0, 0, 0];
      p.face = 'calm';
      const a = drawCast('hayato', p);
      const head = a.headPoint();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * PI * 2;
        r.draw(X.unit, M4.chain(M4.translate(head[0] + C(ang) * 0.2, head[1] + S(ang) * 0.2, head[2] + 0.1), M4.rotZ(ang), M4.scale(0.4, 0.004, 1)), { flat: [0.2, 0.2, 0.25, 1], noFog: true });
      }
      const hand = M4.point(a.m.foreR, [0, -0.25, 0]);
      r.draw(X.ring, M4.chain(M4.translate(hand[0], hand[1], hand[2] + 0.05), M4.scale(0.12)), { tint: [1, 0.8, 0.3], noFog: true });
    }

    const SCENES = { spin: sceneSpin, text: sceneText, room: sceneRoom, cls: sceneClass, board: sceneBoard, battle: sceneBattle, walk: sceneWalk, ult: sceneUlt, face: sceneFace, menu: sceneMenu, warp: sceneWarp, pompom: scenePompom, burst: sceneBurst, meme: sceneMeme, elephant: sceneElephant, cutscene: sceneCutscene, wall: sceneWall, chat: sceneChat, dmg: sceneDmg, sponsor: sceneSponsor, editor: sceneEditor };

    function hudLayer(t, sh, info) {
      const o = sh.o;
      const local = t - sh.start;
      if (o.hud && sh.scene !== 'battle' && sh.scene !== 'walk') {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'hudFrame', party: ['asta', 'tingyun', 'bronya', 'yukong'].map((k, i) => ({ color: PARTY_COLOR[k], energy: 0.5, hp: 0.8, hpText: [693, 579, 1304, 842][i] })), points: 3 }), blend: true });
      }
      if (sh.scene === 'battle' && o.hud) {
        const party = (o.hudParty || o.party || ['asta', 'tingyun', 'bronya', 'yukong']).map((k, i) => ({ color: PARTY_COLOR[k] || '#aaaaaa', energy: ((i * 37) % 10) / 10, ult: (o.ultReady || []).includes(k), hp: (o.down || []).includes(k) ? 0 : 0.6 + ((i * 13) % 5) / 12, hpText: [693, 579, 1304, 842][i] }));
        const spec = { ui: 'hudFrame', party, boss: o.boss, banner: o.banner, points: 3 };
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex(spec), blend: true });
        if (info && info.marks && !o.boss) info.marks.forEach(([x, y, w]) => {
          if (w <= 0) return;
          ov.rect(x - 22, y - 3, 44, 5, { flat: [0.1, 0.1, 0.12, 0.8], blend: true });
          ov.rect(x - 21, y - 2, 30, 3, { flat: [0.9, 0.3, 0.3, 1] });
        });
      } else if (sh.scene === 'battle' && o.banner) {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'hudFrame', party: [], banner: o.banner, order: 0, points: 0 }), blend: true });
      }
      if (o.total !== undefined || o.alert || o.buffs) {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'battleText', total: o.total, alert: o.alert, buffs: o.buffs }), blend: true });
      }
      if (o.pop && sh.scene === 'battle' && info && info.marks) {
        const [x, y] = info.marks[Math.min(info.marks.length - 1, o.target || 0)] || [FW / 2, FH / 3];
        const up = Math.min(local, 0.6) * 20;
        const big = /Пробитие|Крит/.test(o.pop) || o.pop.length > 3;
        const w = big ? 300 : 170, h = big ? 104 : 62;
        const cx = big ? clamp(x, FW * 0.45, FW * 0.72) : clamp(x, w / 2, FW - w / 2);
        const cy = big ? FH * 0.52 + (o.alert ? 30 : 0) : clamp(y + 50 + (o.alert ? 40 : 0), h, FH * 0.7);
        ov.begin();
        const split = /^(\D+?)\s*(\d+)$/.exec(o.pop);
        if (big && split) {
          const bx = clamp(x, FW * 0.5, FW * 0.66);
          const gy = clamp(y + 40, FH * 0.45, FH * 0.8);
          const burst = clamp(1 - local * 1.2, 0.35, 1);
          ov.rect(bx - 110, gy - 50, 220, 100, { texture: T.glow, additive: true, alpha: 0.45 * burst, tint: [1, 0.5, 0.15] });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * PI * 2 + 0.2;
            const len = 40 + ((i * 37) % 5) * 12 + local * 30;
            r.draw(X.unit, M4.chain(M4.translate(bx, gy, 0), M4.scale(1, 0.45, 1), M4.rotZ(a), M4.translate(0, 30 + len / 2, 0), M4.scale(5, len, 1)), { flat: [1, 0.6, 0.2, 0.55 * burst], blend: true });
          }
          const cap = (text, color) => texOf('pop:' + text + color, UI.caption({ text, size: 110, color, stroke: '#4a1400' }));
          ov.rect(bx - 90, FH * 0.2 - up, 180, 101, { texture: cap(split[1], '#ffc0a8'), blend: true });
          ov.rect(bx - 205, FH * 0.13 - up, 410, 230, { texture: cap(split[2], '#ff9a6a'), blend: true });
        } else {
          if (big) {
            ov.rect(cx - 70, FH * 0.42 - 60, 140, 120, { texture: T.glow, additive: true, alpha: 0.5 * clamp(1 - local * 1.5, 0.2, 1), tint: [1, 0.6, 0.25] });
            ov.rect(cx - 150, FH * 0.42 - 84 - up, 300, 169, { texture: texOf('pop:' + o.pop, UI.caption({ text: o.pop, size: 110, color: '#ffc0a8', stroke: '#4a1400' })), blend: true });
          } else ov.rect(cx - w / 2, cy - h - up, w, h, { texture: capTex({ text: o.pop, size: 110, color: '#ffd65a', stroke: '#5a1a00' }), blend: true });
        }
      }
      if (o.skill) {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: texOf('sk:' + o.skill + (o.skillLow ? 'l' : ''), UI.skillName({ text: o.skill, low: o.skillLow })), blend: true });
      }
      if (o.buff && sh.scene === 'face') {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'battleText', buffs: o.buff }), blend: true });
      }
      if (sh.scene === 'ult' && o.buffs) {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: uiTex({ ui: 'battleText', buffs: o.buffs }), blend: true });
      }
    }

    function frameFx(t, sh, info) {
      const o = sh.o;
      const local = t - sh.start;
      const len = Math.max(0.1, sh.end - sh.start);
      if (o.pixel) {
        grab();
        ov.begin();
        ov.rect(0, 0, FW / 12, FH / 12, { texture: F.full });
        r.grab(F.pix, 0, FH - Math.round(FH / 12), Math.round(FW / 12), Math.round(FH / 12));
        ov.rect(0, 0, FW, FH, { texture: F.pix });
      }
      if (o.zoom) {
        const [cx, cy, s] = o.zoom;
        grab();
        ov.begin();
        ov.rect(cx * FW * (1 - s), cy * FH * (1 - s), FW * s, FH * s, { texture: F.full });
        const zoomed = o.zoomHud ? null : info && info.marks ? Object.assign({}, info, { marks: info.marks.map(([x, y, w]) => [cx * FW * (1 - s) + x * s, cy * FH * (1 - s) + y * s, w]) }) : info;
        if (!o.zoomHud) hudLayer(t, sh, zoomed);
      }
      const mode = o.box || (sh.scene === 'face' && !o.full ? 'square' : null);
      if (mode) {
        grab();
        if (mode === 'border') {
          fill([0, 0, 0]);
          ov.rect(FW * 0.08, FH * 0.08, FW * 0.84, FH * 0.84, { texture: F.full });
        } else if (mode === 'shrink') {
          const s = 1 - ease(clamp(local / len, 0, 1)) * 0.85;
          fill([0, 0, 0]);
          ov.rect(FW * (1 - s) / 2, FH * (1 - s) / 2, FW * s, FH * s, { texture: F.full });
        } else {
          blurFull(1);
          fill([0, 0, 0], 0.25);
          if (mode === 'square' || mode === 'tall' || mode === 'wide') {
            const w = mode === 'square' ? FW * 0.46 : mode === 'wide' ? FW * 0.66 : FH * 0.55;
            const h = mode === 'wide' ? FH * 0.9 : FH * 0.74;
            if (o.frame) {
              ov.begin();
              ov.rect(FW / 2 - w / 2 - 4, FH / 2 - h / 2 - 4, w + 8, h + 8, { flat: o.frame.concat([1]) });
            }
            clip(FW / 2 - w / 2, FH / 2 - h / 2, w, h, () => {
              ov.rect(FW / 2 - (FW * 0.74) / 2, FH / 2 - (FH * 0.74) / 2 * (h / (FH * 0.74)), FW * 0.74 * (h / (FH * 0.74)), h, { texture: F.full });
            });
          } else if (mode === 'corner') {
            ov.begin();
            ov.rect(FW * 0.04, FH * 0.06, FW * 0.42, FH * 0.42, { texture: F.full });
          }
        }
      }
      if (o.blurAll) blurFull(1);
      if (o.grey) {
        grab();
        ov.begin(null, [0.3, 0.3, 0.3, 0.59, 0.59, 0.59, 0.11, 0.11, 0.11]);
        ov.rect(0, 0, FW, FH, { texture: F.full });
      }
      if (o.glitch) {
        grab();
        ov.begin();
        const g = rand(Math.floor(t * 20));
        for (let i = 0; i < 10; i++) {
          const y = g() * FH, h = 4 + g() * 16;
          clip(0, y, FW, h, () => ov.rect((g() - 0.5) * 60, 0, FW, FH, { texture: F.full, tint: [0.7, 0.9, 1.3] }));
        }
      }
      if (o.spinFrame) {
        grab();
        fill([0, 0, 0]);
        ov.begin();
        r.draw(X.unit, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(local * 2), M4.scale(FW * 0.7, -FH * 0.7, 1)), { texture: F.full, noFog: true });
      }
      if (o.fireWash) {
        ov.begin();
        ov.rect(0, 0, FW, FH, { flat: [1, 0.45, 0.08, 0.38], blend: true });
        const g = rand(Math.floor(t * 12));
        for (let i = 0; i < 10; i++) {
          const rr = 60 + g() * 90;
          ov.rect(FW * (0.45 + g() * 0.55) - rr, g() * FH - rr, rr * 2, rr * 2, { texture: T.glow, additive: true, alpha: 0.6, tint: [1, 0.55, 0.15] });
        }
      }
      if (o.flash) {
        const a = clamp(1 - local / o.flash, 0, 1);
        if (a > 0) fill([1, 1, 1], a);
      }
      if (o.fadeIn) {
        const a = clamp(1 - local / o.fadeIn, 0, 1);
        if (a > 0) fill([0, 0, 0], a);
      }
      if (o.fadeOut) {
        const a = clamp((local - (len - o.fadeOut)) / o.fadeOut, 0, 1);
        if (a > 0) fill([0, 0, 0], a);
      }
      if (o.whiteOut) {
        const a = clamp((local - (len - 1.2)) / 1.2, 0, 1);
        if (a > 0) fill([1, 1, 1], a);
      }
    }

    function captions(t, sh) {
      const o = sh.o;
      const local = t - sh.start;
      const mode = o.box || (sh.scene === 'face' && !o.full ? 'square' : null);
      const inset = mode === 'square' ? [FW * 0.27, FH * 0.13, FW * 0.46, FH * 0.74] : mode === 'tall' ? [FW / 2 - FH * 0.275, FH * 0.13, FH * 0.55, FH * 0.74] : [0, 0, FW, FH];
      if (o.cap) {
        (Array.isArray(o.cap) ? o.cap : [o.cap]).forEach(c => {
          const spec = typeof c === 'string' ? { text: c, pos: 'bottom' } : c;
          if (spec.from !== undefined && local < spec.from) return;
          const pop = clamp((local - (spec.from || 0)) * 8, 0, 1);
          const s = 1 + (1 - pop) * 0.3;
          const [x, y, w, hh] = inset;
          ov.begin();
          ov.rect(x + w / 2 - (w * s) / 2, y + hh / 2 - (hh * s) / 2, w * s, hh * s, { texture: capTex(Object.assign({}, spec, inset[2] < FW ? { size: Math.round((spec.size || 64) * 1.4) } : {})), blend: true });
        });
      }
      if (o.sub && sh.scene !== 'walk') {
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: texOf('sub:' + o.sub, UI.subtitle({ text: o.sub })), blend: true });
      }
    }

    function renderShot(t, sh, noBg) {
      const fn = SCENES[sh.scene];
      if (!fn) {
        fill([0, 0, 0]);
        if (sh.scene === 'line') {
          ov.begin();
          ov.rect(0, FH / 2 - 1, FW, 2, { flat: [1, 1, 1, 1] });
        }
        return null;
      }
      const shot = noBg ? { start: sh.start, end: sh.end, scene: sh.scene, o: Object.assign({}, sh.o, { noBg: true }) } : sh;
      return fn(t, shot);
    }

    return {
      warm() {
        ['hayato', 'bronya', 'asta', 'tingyun', 'yukong', 'guard'].forEach(castOf);
        SHOTS.forEach(s => {
          const o = s.o;
          if (o.ui) uiTex(o);
          if (o.cap) (Array.isArray(o.cap) ? o.cap : [o.cap]).forEach(capTex);
          (o.party || []).forEach(castOf);
          if (o.who && LOOKS[o.who]) castOf(o.who);
        });
      },
      render(t) {
        const tt = clamp(t, 0, DURATION);
        const sh = shotAt(tt);
        r.polys = 0;
        r.clear([0, 0, 0]);
        let info = null;
        if (sh.o.under) {
          const u = sh.o.under;
          const ushot = { start: sh.start, end: sh.end, scene: u.scene || 'battle', o: u };
          const uinfo = renderShot(tt, ushot);
          hudLayer(tt, ushot, uinfo);
          blurFull(1);
          info = renderShot(tt, sh, true);
        } else info = renderShot(tt, sh);
        if (!sh.o.zoom || sh.o.zoomHud) hudLayer(tt, sh, info);
        frameFx(tt, sh, info);
        captions(tt, sh);
        return { shot: sh, polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'hArMoNy_hsr',
    audio: 'content/YouVid/Смогу ли Я пройти ХСР только ГАРМОНИСТАМИ.mp3',
    duration: DURATION,
    aspect: 16 / 9,
    shots: SHOTS,
    shotAt,
    voiceAt: VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
