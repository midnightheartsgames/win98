(function () {
  const K = window.YouVidKit;
  const { S, C, clamp, lerp, ease, envelope, keys } = K;

  const ID = 'n0p3Av1Eng1';
  const DURATION = 9.06;
  const CUTS = [0];

  const VOICE = envelope(
    '0'.repeat(105) + '89CZy93' + '0'.repeat(70),
    20
  );

  const SFX = envelope(
    '0'.repeat(92) + '1fnyBZUx68' + '0'.repeat(80),
    20
  );

  const PATH = keys([
    [0.00, [-6.20, 1.35, -6.00, 0.92]],
    [1.38, [-5.95, 1.35, -5.85, 0.92]],
    [1.52, [-5.45, 1.34, -5.65, 0.90]],
    [2.07, [-2.62, 1.14, -4.00, 0.86]],
    [2.41, [-0.95, 1.04, -2.90, 0.82]],
    [2.72, [0.24, 0.92, -2.00, 0.78]],
    [3.12, [1.14, 0.86, -1.10, 0.70]],
    [3.60, [1.46, 0.78, 0.15, 0.42]],
    [3.89, [1.34, 0.77, 0.58, 0.05]],
    [4.21, [0.76, 0.77, 0.92, -0.42]],
    [4.52, [0.42, 0.77, 1.05, -0.58]],
    [7.53, [0.40, 0.77, 1.05, -0.58]],
    [7.62, [0.34, 0.77, 1.05, -0.58]],
    [7.66, [0.11, 0.77, 1.05, -0.58]],
    [7.70, [-0.37, 0.77, 1.05, -0.58]],
    [7.79, [-0.75, 0.77, 1.05, -0.58]],
    [7.82, [-1.18, 0.77, 1.05, -0.58]],
    [7.85, [-1.72, 0.77, 1.05, -0.58]],
    [9.06, [-1.85, 0.77, 1.05, -0.58]]
  ]);

  const HAT_LIFT = keys([
    [0.00, 0.0],
    [4.64, 0.0],
    [5.02, 0.262],
    [5.55, 0.276],
    [6.35, 0.268],
    [7.85, 0.268],
    [9.06, 0.268]
  ]);

  const NECK_STRETCH = keys([
    [0.00, 0.0],
    [5.88, 0.0],
    [6.42, 0.268],
    [7.85, 0.268],
    [9.06, 0.268]
  ]);

  function stage(t) {
    const tc = clamp(t, 0, DURATION);
    const voice = VOICE(tc);
    const sfx = SFX(tc);
    const visible = tc >= 1.38 && tc <= 7.84;

    let act = 'walk';
    if (tc < 1.38) act = 'intro';
    else if (tc < 3.85) act = 'walk';
    else if (tc < 4.55) act = 'turn';
    else if (tc < 5.15) act = 'hat_lift';
    else if (tc < 5.88) act = 'nope';
    else if (tc < 6.48) act = 'stretch';
    else if (tc < 7.53) act = 'hold';
    else if (tc <= 7.84) act = 'exit';
    else act = 'outro';

    const [px, py, pz, yaw] = PATH(tc);
    const hatLift = HAT_LIFT(tc);
    const neckStretch = NECK_STRETCH(tc);

    const walkBlend = tc < 4.35 ? 1.0 : 0.42;
    const ph = tc * 5.92;
    const sw = S(ph);
    const cw = C(ph);

    const bob = (tc < 4.4 ? Math.abs(cw) * 0.024 : S(ph * 2) * 0.005);

    const fwd = [S(yaw), 0, C(yaw)];
    const standBlend = ease((tc - 3.95) / 0.55);

    const sp = [
      lerp(0.06, 0.02, standBlend),
      sw * 0.08 * walkBlend,
      sw * 0.025 * walkBlend
    ];

    const nk = [
      lerp(-0.02, 0.03, standBlend) + voice * 0.06,
      lerp(0.0, 0.24, standBlend),
      lerp(0.0, -0.02, standBlend)
    ];

    const mix = (a, b) => a.map((v, i) => lerp(v, b[i], standBlend));
    const jog = Math.abs(cw) * 0.035 * walkBlend;
    const sway = sw * 0.025 * walkBlend;

    const hR = mix([-0.15 + sway, 0.13 + jog, 0.27], [-0.20, 0.0, 0.22]);
    const eR = mix([-0.7, -0.15, -0.55], [-0.6, -0.1, -0.6]);
    const wR = mix([2.2, -0.2, 0.0], [-0.15, -0.15, 0.0]);

    const hL = mix([0.09 + sway, 0.07 + jog, 0.28], [0.27, -0.12, 0.05]);
    const eL = mix([0.7, -0.15, -0.55], [0.4, 0.0, -0.8]);

    const strideZ = 0.22 * walkBlend;
    const liftY = 0.09 * walkBlend;
    const fL = [0.12, -0.75 + Math.max(0, sw) * liftY, sw * strideZ];
    const fR = [-0.12, -0.75 + Math.max(0, -sw) * liftY, -sw * strideZ];
    const kL = [0.14, -0.35, 0.75];
    const kR = [-0.14, -0.35, 0.75];

    const pose = {
      p: [px, py + bob, pz],
      up: [0, 1, 0],
      fwd,
      sp,
      nk,
      hL,
      eL,
      hR,
      eR,
      wR,
      fL,
      fR,
      kL,
      kR,
      hatLift,
      neckStretch
    };

    const face = voice > 0.35 ? 'nope' : (voice > 0.10 ? 'open' : 'shut');

    const camera = {
      eye: [0, 1.42, 2.8],
      at: [0, 1.42, -2.5],
      fov: 42
    };

    return {
      act,
      visible,
      voice,
      sfx,
      hatLift,
      neckStretch,
      face,
      pose,
      camera
    };
  }

  window.NopeScript = { ID, DURATION, CUTS, VOICE, SFX, stage };
})();
