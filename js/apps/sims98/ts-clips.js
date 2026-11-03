(function (S) {
  'use strict';
  const B = S.Body.B, COUNT = S.Body.COUNT;
  const RAD = Math.PI / 180;
  const ROOT = -1;
  const AXIS = { x: 0, y: 1, z: 2 };

  const channel = (bone, axis, keys, unit) => ({
    bone: bone === ROOT ? ROOT : B[bone], axis: AXIS[axis],
    keys: keys.map(([t, v]) => [t, v * (unit === undefined ? RAD : unit)])
  });

  const shift = (keys, by) => keys.map(([t, v]) => [(t + by) % 1, v]).sort((a, b) => a[0] - b[0]);

  const both = (name, axis, keys, sign) => [
    channel(name + 'L', axis, keys),
    channel(name + 'R', axis, shift(sign === undefined ? keys : keys.map(([t, v]) => [t, v * sign]), 0.5))
  ];

  const rest = [
    channel('foreL', 'x', [[0, -10]]), channel('foreR', 'x', [[0, -10]]),
    channel('armL', 'z', [[0, 4]]), channel('armR', 'z', [[0, -4]])
  ];

  const WALK_LEG = {
    thigh: [[0, -24], [0.125, -15], [0.25, 0], [0.375, 9], [0.5, 19], [0.625, 13], [0.75, -11], [0.875, -26]],
    shin: [[0, 10], [0.125, 14], [0.25, 6], [0.375, 10], [0.5, 12], [0.625, 44], [0.75, 62], [0.875, 26]],
    foot: [[0, -11], [0.125, 1], [0.25, -6], [0.375, -12], [0.5, -1], [0.625, 12], [0.75, -15], [0.875, -12]],
    toe: [[0, 0], [0.25, 0], [0.375, -10], [0.5, -30], [0.625, -8], [0.75, 0]]
  };

  const RUN_LEG = {
    thigh: [[0, -30], [0.125, -20], [0.25, 8], [0.375, 24], [0.5, 22], [0.625, 2], [0.75, -38], [0.875, -46]],
    shin: [[0, 22], [0.125, 44], [0.25, 30], [0.375, 28], [0.5, 66], [0.625, 104], [0.75, 92], [0.875, 42]],
    foot: [[0, -2], [0.125, -22], [0.25, -8], [0.375, -2], [0.5, 6], [0.625, 0], [0.75, -10], [0.875, -8]],
    toe: [[0, 0], [0.125, 0], [0.25, -26], [0.375, -10], [0.5, 0]]
  };

  const UP_LEG = {
    thigh: [[0, -62], [0.125, -48], [0.25, -30], [0.375, -10], [0.5, 4], [0.625, -18], [0.75, -58], [0.875, -72]],
    shin: [[0, 82], [0.125, 62], [0.25, 36], [0.375, 12], [0.5, 12], [0.625, 66], [0.75, 98], [0.875, 96]],
    foot: [[0, -14], [0.25, -2], [0.375, 2], [0.5, 12], [0.625, 22], [0.75, 4], [0.875, -12]]
  };

  const DOWN_LEG = {
    thigh: [[0, -8], [0.125, -14], [0.25, -30], [0.375, -44], [0.5, -40], [0.625, -22], [0.75, -6], [0.875, -6]],
    shin: [[0, 20], [0.125, 10], [0.25, 14], [0.375, 36], [0.5, 52], [0.625, 66], [0.75, 42], [0.875, 26]],
    foot: [[0, -18], [0.25, -20], [0.5, 2], [0.625, 14], [0.75, -6], [0.875, -22]]
  };

  const gait = (leg, opts) => [
    ...both('thigh', 'x', leg.thigh), ...both('shin', 'x', leg.shin), ...both('foot', 'x', leg.foot), ...(leg.toe ? both('toe', 'x', leg.toe) : []),
    channel('armL', 'x', opts.swing.map(([t, v]) => [t, v])),
    channel('armR', 'x', shift(opts.swing, 0.5)),
    channel('foreL', 'x', opts.fore.map(([t, v]) => [t, v])),
    channel('foreR', 'x', shift(opts.fore, 0.5)),
    channel('armL', 'z', [[0, opts.out]]), channel('armR', 'z', [[0, -opts.out]]),
    channel('spine', 'x', [[0, opts.lean]]),
    channel('chest', 'y', [[0, -opts.twist], [0.25, 0], [0.5, opts.twist], [0.75, 0]]),
    channel('hips', 'y', [[0, opts.twist * 0.7], [0.25, 0], [0.5, -opts.twist * 0.7], [0.75, 0]]),
    channel('hips', 'z', [[0, 0], [0.25, -opts.roll], [0.5, 0], [0.75, opts.roll]]),
    channel('head', 'x', [[0, -opts.lean * 0.6]]),
    channel(ROOT, 'y', opts.bob, 1)
  ];

  const SEAT_LEGS = [
    channel('thighL', 'x', [[0, -75]]), channel('thighR', 'x', [[0, -75]]),
    channel('shinL', 'x', [[0, 75]]), channel('shinR', 'x', [[0, 75]]),
    channel('thighL', 'z', [[0, 2]]), channel('thighR', 'z', [[0, -2]])
  ];

  const breath = [channel('chest', 'x', [[0, -0.8], [0.25, 0.8], [0.5, -0.8], [0.75, 0.8]])];

  const hands = (armX, foreX, out) => [
    channel('armL', 'x', [[0, armX]]), channel('armR', 'x', [[0, armX]]),
    channel('foreL', 'x', [[0, foreX]]), channel('foreR', 'x', [[0, foreX]]),
    channel('armL', 'z', [[0, out]]), channel('armR', 'z', [[0, -out]])
  ];

  const LIE_BACK = [
    channel('hips', 'x', [[0, -90]]),
    channel('armL', 'x', [[0, 2]]), channel('armR', 'x', [[0, 2]]),
    channel('foreL', 'x', [[0, -12]]), channel('foreR', 'x', [[0, -12]]),
    channel('armL', 'z', [[0, 8]]), channel('armR', 'z', [[0, -8]]),
    channel('head', 'x', [[0, 8]]),
    channel('chest', 'x', [[0, -1.4], [0.5, 1.4]])
  ];

  const LIST = {
    use: {
      loop: true, seconds: 2,
      channels: [
        channel('armL', 'x', [[0, -46], [0.5, -52]]), channel('armR', 'x', [[0, -52], [0.5, -46]]),
        channel('foreL', 'x', [[0, -44], [0.5, -56]]), channel('foreR', 'x', [[0, -56], [0.5, -44]]),
        channel('armL', 'z', [[0, 6]]), channel('armR', 'z', [[0, -6]]),
        channel('spine', 'x', [[0, 5]]), channel('head', 'x', [[0, 10]]), ...breath
      ]
    },
    cook: {
      loop: true, seconds: 1.4,
      channels: [
        channel('armL', 'x', [[0, -38]]), channel('foreL', 'x', [[0, -62]]), channel('armL', 'z', [[0, 6]]),
        channel('armR', 'x', [[0, -56], [0.25, -48], [0.5, -56], [0.75, -64]]), channel('armR', 'z', [[0, -14], [0.25, -4], [0.5, 6], [0.75, -4]]), channel('foreR', 'x', [[0, -42]]),
        channel('spine', 'x', [[0, 6]]), channel('head', 'x', [[0, 12]]), ...breath
      ]
    },
    eatStand: {
      loop: true, seconds: 2.4,
      channels: [
        channel('armL', 'x', [[0, -36]]), channel('foreL', 'x', [[0, -68]]), channel('armL', 'z', [[0, 8]]),
        channel('armR', 'x', [[0, -26], [0.4, -40], [0.6, -40], [1, -26]]), channel('foreR', 'x', [[0, -56], [0.4, -128], [0.6, -128], [1, -56]]), channel('armR', 'z', [[0, -6]]),
        channel('head', 'x', [[0, 6], [0.5, 2]]), ...breath
      ]
    },
    eat: {
      loop: true, seconds: 2.4,
      channels: [
        ...SEAT_LEGS,
        channel('armL', 'x', [[0, -40]]), channel('foreL', 'x', [[0, -50]]), channel('armL', 'z', [[0, 8]]),
        channel('armR', 'x', [[0, -34], [0.4, -46], [0.6, -46], [1, -34]]), channel('foreR', 'x', [[0, -52], [0.4, -128], [0.6, -128], [1, -52]]), channel('armR', 'z', [[0, -6]]),
        channel('spine', 'x', [[0, 6]]), channel('head', 'x', [[0, 8], [0.5, 2]]), ...breath
      ]
    },
    wash: {
      loop: true, seconds: 1.2,
      channels: [
        channel('armL', 'x', [[0, -38], [0.5, -44]]), channel('armR', 'x', [[0, -44], [0.5, -38]]),
        channel('foreL', 'x', [[0, -34], [0.5, -40]]), channel('foreR', 'x', [[0, -40], [0.5, -34]]),
        channel('armL', 'z', [[0, 3]]), channel('armR', 'z', [[0, -3]]),
        channel('spine', 'x', [[0, 14]]), channel('head', 'x', [[0, 10]])
      ]
    },
    shower: {
      loop: true, seconds: 1.6,
      channels: [
        channel('armL', 'x', [[0, -150], [0.5, -138]]), channel('armR', 'x', [[0, -138], [0.5, -150]]),
        channel('foreL', 'x', [[0, -70], [0.5, -56]]), channel('foreR', 'x', [[0, -56], [0.5, -70]]),
        channel('armL', 'z', [[0, 14]]), channel('armR', 'z', [[0, -14]]),
        channel('head', 'x', [[0, -10]]), channel('head', 'y', [[0, -6], [0.5, 6]])
      ]
    },
    watch: {
      loop: true, seconds: 6,
      channels: [...SEAT_LEGS, channel('spine', 'x', [[0, -3]]), channel('head', 'y', [[0, -3], [0.5, 3]]), ...hands(-24, -46, 7), ...breath]
    },
    read: {
      loop: true, seconds: 5,
      channels: [...SEAT_LEGS, channel('spine', 'x', [[0, 4]]), channel('head', 'x', [[0, 16]]), channel('head', 'y', [[0, -4], [0.5, 4]]), ...hands(-36, -82, 9), ...breath]
    },
    readStand: {
      loop: true, seconds: 5,
      channels: [channel('head', 'x', [[0, 18]]), channel('head', 'y', [[0, -4], [0.5, 4]]), ...hands(-30, -86, 8), ...breath]
    },
    type: {
      loop: true, seconds: 0.8,
      channels: [
        ...SEAT_LEGS,
        channel('armL', 'x', [[0, -34], [0.5, -38]]), channel('armR', 'x', [[0, -38], [0.5, -34]]),
        channel('foreL', 'x', [[0, -56], [0.5, -50]]), channel('foreR', 'x', [[0, -50], [0.5, -56]]),
        channel('armL', 'z', [[0, 6]]), channel('armR', 'z', [[0, -6]]),
        channel('spine', 'x', [[0, 6]]), channel('head', 'x', [[0, 6]])
      ]
    },
    dance: {
      loop: true, seconds: 1.4,
      channels: [
        channel('hips', 'z', [[0, 6], [0.5, -6]]), channel('spine', 'z', [[0, -4], [0.5, 4]]), channel('head', 'z', [[0, -5], [0.5, 5]]),
        channel('armL', 'x', [[0, -60], [0.5, -30]]), channel('armR', 'x', [[0, -30], [0.5, -60]]),
        channel('foreL', 'x', [[0, -90], [0.5, -60]]), channel('foreR', 'x', [[0, -60], [0.5, -90]]),
        channel('armL', 'z', [[0, 14]]), channel('armR', 'z', [[0, -14]]),
        channel('thighL', 'x', [[0, -12], [0.5, 0]]), channel('shinL', 'x', [[0, 18], [0.5, 2]]),
        channel('thighR', 'x', [[0, 0], [0.5, -12]]), channel('shinR', 'x', [[0, 2], [0.5, 18]]),
        channel(ROOT, 'y', [[0, -0.01], [0.25, -0.03], [0.5, -0.01], [0.75, -0.03]], 1)
      ]
    },
    talk: {
      loop: true, seconds: 2.6,
      channels: [
        channel('armL', 'x', [[0, -8]]), channel('foreL', 'x', [[0, -14]]), channel('armL', 'z', [[0, 4]]),
        channel('armR', 'x', [[0, -30], [0.3, -48], [0.6, -22], [1, -30]]), channel('foreR', 'x', [[0, -70], [0.3, -96], [0.6, -60], [1, -70]]), channel('armR', 'z', [[0, -10]]),
        channel('head', 'x', [[0, 2], [0.25, -3], [0.5, 3], [0.75, -2]]), channel('head', 'y', [[0, -4], [0.5, 4]]), ...breath
      ]
    },
    fish: {
      loop: true, seconds: 3,
      channels: [
        channel('armL', 'x', [[0, -38]]), channel('foreL', 'x', [[0, -52]]), channel('armL', 'z', [[0, 10]]),
        channel('armR', 'x', [[0, -44]]), channel('foreR', 'x', [[0, -46], [0.8, -46], [0.86, -58], [0.94, -46]]), channel('armR', 'z', [[0, -8]]),
        channel('spine', 'x', [[0, 4]]), channel('head', 'x', [[0, 10], [0.5, 12]]), ...breath
      ]
    },
    guitar: {
      loop: true, seconds: 0.8,
      channels: [
        channel('armL', 'x', [[0, -48]]), channel('armL', 'z', [[0, 22]]), channel('foreL', 'x', [[0, -36]]), channel('handL', 'z', [[0, 10], [0.5, 4]]),
        channel('armR', 'x', [[0, -18]]), channel('armR', 'z', [[0, -10]]), channel('foreR', 'x', [[0, -72], [0.5, -92]]),
        channel('head', 'x', [[0, 12]]), channel('head', 'z', [[0, 3], [0.5, -3]]), channel('chest', 'y', [[0, -4], [0.5, 4]])
      ]
    },
    dig: {
      loop: true, seconds: 1.6,
      channels: [
        channel('spine', 'x', [[0, 30]]), channel('chest', 'x', [[0, 8]]), channel('head', 'x', [[0, 10]]),
        channel('armL', 'x', [[0, -54], [0.5, -66]]), channel('armR', 'x', [[0, -66], [0.5, -54]]),
        channel('foreL', 'x', [[0, -24], [0.5, -34]]), channel('foreR', 'x', [[0, -34], [0.5, -24]]),
        channel('armL', 'z', [[0, 6]]), channel('armR', 'z', [[0, -6]])
      ]
    },
    pick: {
      loop: true, seconds: 1.4,
      channels: [
        channel('spine', 'x', [[0, 36], [0.5, 42]]), channel('chest', 'x', [[0, 8]]), channel('head', 'x', [[0, 16]]),
        channel('armR', 'x', [[0, -64], [0.5, -76]]), channel('foreR', 'x', [[0, -18]]), channel('armR', 'z', [[0, -4]]),
        channel('armL', 'x', [[0, -28]]), channel('foreL', 'x', [[0, -40]]), channel('armL', 'z', [[0, 8]])
      ]
    },
    paint: {
      loop: true, seconds: 1.8,
      channels: [
        channel('armL', 'x', [[0, -30]]), channel('foreL', 'x', [[0, -64]]), channel('armL', 'z', [[0, 10]]),
        channel('armR', 'x', [[0, -76], [0.25, -62], [0.5, -84], [0.75, -66]]), channel('armR', 'z', [[0, -18], [0.5, 6]]), channel('foreR', 'x', [[0, -32]]),
        channel('head', 'x', [[0, -2]]), ...breath
      ]
    },
    punch: {
      loop: true, seconds: 0.9,
      channels: [
        channel('armL', 'x', [[0, -86], [0.5, -40]]), channel('armR', 'x', [[0, -40], [0.5, -86]]),
        channel('foreL', 'x', [[0, -14], [0.5, -112]]), channel('foreR', 'x', [[0, -112], [0.5, -14]]),
        channel('armL', 'z', [[0, 6]]), channel('armR', 'z', [[0, -6]]),
        channel('chest', 'y', [[0, -12], [0.5, 12]]), channel('spine', 'x', [[0, 6]])
      ]
    },
    shrug: {
      loop: true, seconds: 1.5,
      channels: [
        channel('armL', 'z', [[0, 4], [0.4, 26], [0.8, 4]]), channel('armR', 'z', [[0, -4], [0.4, -26], [0.8, -4]]),
        channel('foreL', 'x', [[0, -10], [0.4, -70], [0.8, -10]]), channel('foreR', 'x', [[0, -10], [0.4, -70], [0.8, -10]]),
        channel('head', 'z', [[0, 0], [0.4, 8], [0.8, 0]])
      ]
    },
    wave: {
      loop: true, seconds: 1,
      channels: [
        channel('armR', 'z', [[0, -140], [0.5, -168]]), channel('armR', 'x', [[0, -10]]), channel('foreR', 'x', [[0, -30], [0.5, -10]]),
        channel('armL', 'z', [[0, 4]]), channel('foreL', 'x', [[0, -10]]),
        channel('head', 'y', [[0, -6]]), channel('head', 'x', [[0, -4]]), ...breath
      ]
    },
    cry: {
      loop: true, seconds: 1.4,
      channels: [
        channel('armL', 'x', [[0, -100]]), channel('armR', 'x', [[0, -100]]), channel('foreL', 'x', [[0, -112]]), channel('foreR', 'x', [[0, -112]]),
        channel('armL', 'z', [[0, 12]]), channel('armR', 'z', [[0, -12]]),
        channel('head', 'x', [[0, 20], [0.5, 24]]), channel('spine', 'x', [[0, 4], [0.25, 9], [0.5, 4], [0.75, 9]]), channel('chest', 'x', [[0, 2], [0.5, 6]])
      ]
    },
    laugh: {
      loop: true, seconds: 0.8,
      channels: [
        channel('head', 'x', [[0, -14], [0.5, -6]]), channel('chest', 'x', [[0, -5], [0.5, 2]]),
        channel('armL', 'x', [[0, -24]]), channel('armR', 'x', [[0, -24]]), channel('foreL', 'x', [[0, -64]]), channel('foreR', 'x', [[0, -64]]),
        channel('armL', 'z', [[0, 10]]), channel('armR', 'z', [[0, -10]]),
        channel(ROOT, 'y', [[0, 0], [0.5, -0.02]], 1)
      ]
    },
    stumble: {
      loop: false, seconds: 1.2,
      channels: [
        channel('spine', 'x', [[0, 0], [0.3, 34], [0.7, 18], [1, 0]]), channel('head', 'x', [[0, 0], [0.3, -16], [1, 0]]),
        channel('armL', 'x', [[0, -6], [0.3, -84], [0.7, -40], [1, -8]]), channel('armR', 'x', [[0, -6], [0.3, -58], [0.7, -92], [1, -8]]),
        channel('armL', 'z', [[0, 4], [0.3, 42], [1, 4]]), channel('armR', 'z', [[0, -4], [0.3, -42], [1, -4]]),
        channel('thighL', 'x', [[0, 0], [0.3, -32], [0.7, -10], [1, 0]]), channel('shinL', 'x', [[0, 0], [0.3, 42], [0.7, 12], [1, 0]]),
        channel(ROOT, 'y', [[0, 0], [0.3, -0.08], [0.7, -0.04], [1, 0]], 1)
      ]
    },
    exercise: {
      loop: true, seconds: 1,
      channels: [
        channel('armL', 'z', [[0, 10], [0.5, 160]]), channel('armR', 'z', [[0, -10], [0.5, -160]]),
        channel('foreL', 'x', [[0, -8]]), channel('foreR', 'x', [[0, -8]]),
        channel('thighL', 'z', [[0, 2], [0.5, 14]]), channel('thighR', 'z', [[0, -2], [0.5, -14]]),
        channel(ROOT, 'y', [[0, 0], [0.25, 0.06], [0.5, 0], [0.75, 0.06]], 1)
      ]
    },
    grumble: {
      loop: true, seconds: 2.2,
      channels: [
        channel('armL', 'x', [[0, -32]]), channel('foreL', 'x', [[0, -104]]), channel('armL', 'z', [[0, 18]]),
        channel('armR', 'x', [[0, -32]]), channel('foreR', 'x', [[0, -104]]), channel('armR', 'z', [[0, -18]]),
        channel('head', 'x', [[0, 6], [0.5, 10]]), channel('head', 'y', [[0, -9], [0.25, 9], [0.5, -9], [0.75, 9]]), ...breath
      ]
    },
    think: {
      loop: true, seconds: 3,
      channels: [
        channel('armR', 'x', [[0, -70]]), channel('foreR', 'x', [[0, -140]]), channel('armR', 'z', [[0, -6]]),
        channel('armL', 'x', [[0, -12]]), channel('foreL', 'x', [[0, -48]]), channel('armL', 'z', [[0, 6]]),
        channel('head', 'x', [[0, 9], [0.5, 12]]), channel('head', 'z', [[0, 6]]), ...breath
      ]
    },
    lieDown: {
      loop: false, seconds: 1,
      channels: [
        channel('hips', 'x', [[0, 0], [1, -90]]),
        channel('head', 'x', [[0, 0], [1, 8]]),
        channel('foreL', 'x', [[0, -10], [1, -12]]), channel('foreR', 'x', [[0, -10], [1, -12]]),
        channel('armL', 'z', [[0, 4], [1, 8]]), channel('armR', 'z', [[0, -4], [1, -8]])
      ]
    },
    sleep: { loop: true, seconds: 5, channels: LIE_BACK },
    sleepFloor: { loop: true, seconds: 5, channels: LIE_BACK },
    getUp: {
      loop: false, seconds: 1,
      channels: [
        channel('hips', 'x', [[0, -90], [1, 0]]),
        channel('head', 'x', [[0, 8], [1, 0]]),
        channel('foreL', 'x', [[0, -12], [1, -10]]), channel('foreR', 'x', [[0, -12], [1, -10]]),
        channel('armL', 'z', [[0, 8], [1, 4]]), channel('armR', 'z', [[0, -8], [1, -4]])
      ]
    },
    idle: {
      loop: true, seconds: 5,
      channels: [
        ...rest,
        channel(ROOT, 'y', [[0, 0], [0.5, -0.004]], 1),
        channel(ROOT, 'x', [[0, -0.006], [0.5, 0.006]], 1),
        channel('hips', 'z', [[0, 0.8], [0.5, -0.8]]),
        channel('spine', 'z', [[0, -0.6], [0.5, 0.6]]),
        channel('chest', 'x', [[0, -0.8], [0.25, 0.8], [0.5, -0.8], [0.75, 0.8]]),
        channel('head', 'y', [[0, -5], [0.35, 7], [0.7, -3]]),
        channel('head', 'x', [[0, 1.5], [0.5, -1.5]]),
        channel('thighL', 'z', [[0, 1.5]]), channel('thighR', 'z', [[0, -1.5]]),
        channel('footL', 'z', [[0, -1.5]]), channel('footR', 'z', [[0, 1.5]])
      ]
    },
    walk: {
      loop: true, stride: 1.24,
      channels: gait(WALK_LEG, {
        swing: [[0, 16], [0.25, 2], [0.5, -16], [0.75, -2]], fore: [[0, -12], [0.25, -18], [0.5, -32], [0.75, -18]], out: 4, lean: 2.5, twist: 5, roll: 1.6,
        bob: [[0, -0.028], [0.25, 0.006], [0.5, -0.028], [0.75, 0.006]]
      })
    },
    run: {
      loop: true, stride: 2.3,
      channels: gait(RUN_LEG, {
        swing: [[0, 32], [0.25, 8], [0.5, -40], [0.75, -8]], fore: [[0, -72], [0.25, -82], [0.5, -98], [0.75, -82]], out: 7, lean: 11, twist: 9, roll: 2,
        bob: [[0, -0.045], [0.125, -0.055], [0.25, -0.03], [0.375, 0.012], [0.5, -0.045], [0.625, -0.055], [0.75, -0.03], [0.875, 0.012]]
      })
    },
    stairsUp: {
      loop: true, stride: 2 / 3,
      channels: gait(UP_LEG, {
        swing: [[0, 10], [0.5, -10]], fore: [[0, -18], [0.5, -26]], out: 4, lean: 8, twist: 4, roll: 1.2,
        bob: [[0, -0.1], [0.25, -0.05], [0.5, -0.1], [0.75, -0.05]]
      })
    },
    stairsDown: {
      loop: true, stride: 2 / 3,
      channels: gait(DOWN_LEG, {
        swing: [[0, 8], [0.5, -8]], fore: [[0, -16], [0.5, -22]], out: 5, lean: 3, twist: 3, roll: 1.2,
        bob: [[0, -0.05], [0.25, -0.1], [0.5, -0.05], [0.75, -0.1]]
      })
    },
    sitDown: {
      loop: false, seconds: 0.8,
      channels: [
        channel('thighL', 'x', [[0, 0], [1, -75]]), channel('thighR', 'x', [[0, 0], [1, -75]]),
        channel('shinL', 'x', [[0, 0], [1, 75]]), channel('shinR', 'x', [[0, 0], [1, 75]]),
        channel('spine', 'x', [[0, 0], [0.45, 26], [1, 2]]),
        channel('head', 'x', [[0, 0], [0.45, -14], [1, 0]]),
        channel('armL', 'x', [[0, 0], [0.5, -22], [1, -24]]), channel('armR', 'x', [[0, 0], [0.5, -22], [1, -24]]),
        channel('foreL', 'x', [[0, -10], [1, -46]]), channel('foreR', 'x', [[0, -10], [1, -46]]),
        channel('armL', 'z', [[0, 4], [1, 7]]), channel('armR', 'z', [[0, -4], [1, -7]])
      ]
    },
    sit: {
      loop: true, seconds: 6,
      channels: [
        channel('thighL', 'x', [[0, -75]]), channel('thighR', 'x', [[0, -75]]),
        channel('shinL', 'x', [[0, 75]]), channel('shinR', 'x', [[0, 75]]),
        channel('thighL', 'z', [[0, 2]]), channel('thighR', 'z', [[0, -2]]),
        channel('spine', 'x', [[0, 2]]),
        channel('chest', 'x', [[0, -0.8], [0.25, 0.8], [0.5, -0.8], [0.75, 0.8]]),
        channel('head', 'y', [[0, -7], [0.4, 9], [0.75, -2]]),
        channel('armL', 'x', [[0, -24]]), channel('armR', 'x', [[0, -24]]),
        channel('foreL', 'x', [[0, -46]]), channel('foreR', 'x', [[0, -46]]),
        channel('armL', 'z', [[0, 7]]), channel('armR', 'z', [[0, -7]])
      ]
    },
    hug: {
      loop: true, seconds: 2.4,
      channels: [
        channel('armL', 'x', [[0, -72], [0.5, -76]]), channel('armR', 'x', [[0, -72], [0.5, -76]]),
        channel('armL', 'z', [[0, -18]]), channel('armR', 'z', [[0, 18]]),
        channel('foreL', 'x', [[0, -58]]), channel('foreR', 'x', [[0, -58]]),
        channel('spine', 'x', [[0, 8]]), channel('head', 'y', [[0, 14]]), channel('head', 'x', [[0, 4]]),
        channel('chest', 'y', [[0, -3], [0.5, 3]])
      ]
    },
    kiss: {
      loop: true, seconds: 2.2,
      channels: [
        channel('armL', 'x', [[0, -58]]), channel('armR', 'x', [[0, -58]]), channel('armL', 'z', [[0, -10]]), channel('armR', 'z', [[0, 10]]),
        channel('foreL', 'x', [[0, -44]]), channel('foreR', 'x', [[0, -44]]),
        channel('spine', 'x', [[0, 9], [0.5, 11]]), channel('head', 'x', [[0, 5]]), channel('head', 'z', [[0, 12]]), ...breath
      ]
    },
    handshake: {
      loop: true, seconds: 1,
      channels: [
        channel('armR', 'x', [[0, -34]]), channel('armR', 'z', [[0, -6]]), channel('foreR', 'x', [[0, -40], [0.25, -52], [0.5, -40], [0.75, -52]]),
        channel('armL', 'z', [[0, 4]]), channel('foreL', 'x', [[0, -10]]), channel('head', 'x', [[0, 3]]), ...breath
      ]
    },
    highFive: {
      loop: true, seconds: 1.2,
      channels: [
        channel('armR', 'z', [[0, -150]]), channel('armR', 'x', [[0, -20], [0.3, -40], [0.6, -20]]), channel('foreR', 'x', [[0, -10]]),
        channel('armL', 'z', [[0, 4]]), channel('foreL', 'x', [[0, -10]]), channel('head', 'x', [[0, -6]]),
        channel(ROOT, 'y', [[0, 0], [0.3, 0.02], [0.6, 0]], 1)
      ]
    },
    blush: {
      loop: true, seconds: 1.8,
      channels: [
        channel('armL', 'x', [[0, -80]]), channel('armR', 'x', [[0, -80]]), channel('armL', 'z', [[0, 8]]), channel('armR', 'z', [[0, -8]]),
        channel('foreL', 'x', [[0, -130]]), channel('foreR', 'x', [[0, -130]]),
        channel('head', 'x', [[0, 14]]), channel('head', 'z', [[0, 8], [0.5, 4]]), channel('hips', 'y', [[0, -6], [0.5, 6]])
      ]
    },
    flirt: {
      loop: true, seconds: 2,
      channels: [
        channel('armL', 'z', [[0, 30]]), channel('armL', 'x', [[0, 10]]), channel('foreL', 'x', [[0, -90]]),
        channel('armR', 'x', [[0, -40]]), channel('foreR', 'x', [[0, -100], [0.5, -84]]), channel('armR', 'z', [[0, -10]]),
        channel('head', 'z', [[0, 10], [0.5, 4]]), channel('hips', 'z', [[0, 6]]), ...breath
      ]
    },
    fistShake: {
      loop: true, seconds: 0.8,
      channels: [
        channel('armR', 'x', [[0, -90]]), channel('armR', 'z', [[0, -20]]), channel('foreR', 'x', [[0, -100], [0.25, -70], [0.5, -100], [0.75, -70]]),
        channel('armL', 'z', [[0, 10]]), channel('foreL', 'x', [[0, -30]]), channel('spine', 'x', [[0, 6]]), channel('head', 'x', [[0, -4]])
      ]
    },
    point: {
      loop: true, seconds: 1.4,
      channels: [
        channel('armR', 'x', [[0, -78], [0.5, -86]]), channel('foreR', 'x', [[0, -6]]), channel('armR', 'z', [[0, -4]]),
        channel('armL', 'z', [[0, 28]]), channel('foreL', 'x', [[0, -90]]), channel('head', 'x', [[0, 2]]), channel('spine', 'x', [[0, 4]])
      ]
    },
    scare: {
      loop: true, seconds: 1.1,
      channels: [
        channel('armL', 'x', [[0, -110]]), channel('armR', 'x', [[0, -110]]), channel('armL', 'z', [[0, 30]]), channel('armR', 'z', [[0, -30]]),
        channel('foreL', 'x', [[0, -30]]), channel('foreR', 'x', [[0, -30]]), channel('spine', 'x', [[0, 10]]),
        channel(ROOT, 'y', [[0, 0], [0.3, 0.04], [0.6, 0]], 1)
      ]
    },
    slap: {
      loop: true, seconds: 0.9,
      channels: [
        channel('armR', 'x', [[0, -60]]), channel('armR', 'z', [[0, -60], [0.35, 10], [1, -60]]), channel('foreR', 'x', [[0, -20]]),
        channel('chest', 'y', [[0, -14], [0.35, 12], [1, -14]]), channel('armL', 'z', [[0, 6]])
      ]
    },
    shove: {
      loop: true, seconds: 1,
      channels: [
        channel('armL', 'x', [[0, -40], [0.4, -84], [1, -40]]), channel('armR', 'x', [[0, -40], [0.4, -84], [1, -40]]),
        channel('foreL', 'x', [[0, -80], [0.4, -8], [1, -80]]), channel('foreR', 'x', [[0, -80], [0.4, -8], [1, -80]]),
        channel('spine', 'x', [[0, 0], [0.4, 10], [1, 0]])
      ]
    },
    tickle: {
      loop: true, seconds: 0.6,
      channels: [
        channel('armL', 'x', [[0, -64]]), channel('armR', 'x', [[0, -64]]),
        channel('foreL', 'x', [[0, -50], [0.25, -70], [0.5, -50], [0.75, -70]]), channel('foreR', 'x', [[0, -70], [0.25, -50], [0.5, -70], [0.75, -50]]),
        channel('spine', 'x', [[0, 12]]), channel('head', 'x', [[0, -4]])
      ]
    },
    bow: {
      loop: true, seconds: 2,
      channels: [
        channel('spine', 'x', [[0, 0], [0.4, 32], [0.7, 30], [1, 0]]), channel('head', 'x', [[0, 0], [0.4, 10], [1, 0]]),
        channel('armL', 'x', [[0, -20]]), channel('armR', 'x', [[0, -20]]), channel('armL', 'z', [[0, -14]]), channel('armR', 'z', [[0, 14]]),
        channel('foreL', 'x', [[0, -60]]), channel('foreR', 'x', [[0, -60]])
      ]
    },
    peck: {
      loop: true, seconds: 1.6,
      channels: [
        channel('armL', 'x', [[0, 18]]), channel('armR', 'x', [[0, 18]]), channel('armL', 'z', [[0, -6]]), channel('armR', 'z', [[0, 6]]),
        channel('foreL', 'x', [[0, -20]]), channel('foreR', 'x', [[0, -20]]),
        channel('spine', 'x', [[0, 6], [0.5, 12], [1, 6]]), channel('head', 'x', [[0, 2], [0.5, 6]]), channel('head', 'z', [[0, 6]])
      ]
    },
    phone: {
      loop: true, seconds: 3,
      channels: [
        channel('armR', 'x', [[0, -20]]), channel('armR', 'z', [[0, -32]]), channel('foreR', 'x', [[0, -150]]),
        channel('armL', 'z', [[0, 6]]), channel('foreL', 'x', [[0, -24]]), channel('head', 'z', [[0, 10]]), channel('head', 'y', [[0, -6], [0.5, 6]]),
        channel('hips', 'z', [[0, -3], [0.5, 3]]), ...breath
      ]
    },
    standUp: {
      loop: false, seconds: 0.7,
      channels: [
        channel('thighL', 'x', [[0, -75], [1, 0]]), channel('thighR', 'x', [[0, -75], [1, 0]]),
        channel('shinL', 'x', [[0, 75], [1, 0]]), channel('shinR', 'x', [[0, 75], [1, 0]]),
        channel('spine', 'x', [[0, 2], [0.4, 30], [1, 0]]),
        channel('head', 'x', [[0, 0], [0.4, -16], [1, 0]]),
        channel('armL', 'x', [[0, -24], [0.5, -16], [1, 0]]), channel('armR', 'x', [[0, -24], [0.5, -16], [1, 0]]),
        channel('foreL', 'x', [[0, -46], [1, -10]]), channel('foreR', 'x', [[0, -46], [1, -10]]),
        channel('armL', 'z', [[0, 7], [1, 4]]), channel('armR', 'z', [[0, -7], [1, -4]])
      ]
    }
  };

  const hermite = (keys, t, loop) => {
    const n = keys.length;
    if (n === 1) return keys[0][1];
    let i = 0;
    if (loop) {
      if (t < keys[0][0]) i = n - 1;
      else {
        while (i < n - 1 && t >= keys[i + 1][0]) i++;
      }
    } else {
      if (t <= keys[0][0]) return keys[0][1];
      if (t >= keys[n - 1][0]) return keys[n - 1][1];
      while (t >= keys[i + 1][0]) i++;
    }
    const j = loop ? (i + 1) % n : i + 1;
    const span = keys[j][0] - keys[i][0] + (j <= i ? 1 : 0), p0 = keys[i], p1 = keys[j];
    let u = (t - p0[0]) / span;
    if (u < 0) u += 1 / span;
    const slope = at => {
      const a = loop ? keys[(at + n - 1) % n] : keys[Math.max(at - 1, 0)], b = loop ? keys[(at + 1) % n] : keys[Math.min(at + 1, n - 1)];
      const dt = b[0] - a[0] + (b[0] <= a[0] && loop ? 1 : 0);
      return dt > 0 ? (b[1] - a[1]) / dt : 0;
    };
    const m0 = slope(i) * span, m1 = slope(j) * span, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p0[1] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1[1] + (u3 - u2) * m1;
  };

  S.Clips = {
    LIST,

    sample(name, t, rot, root) {
      const clip = LIST[name], at = clip.loop ? ((t % 1) + 1) % 1 : S.clamp(t, 0, 1);
      rot.fill(0);
      root[0] = 0;
      root[1] = 0;
      root[2] = 0;
      for (const c of clip.channels) {
        const v = hermite(c.keys, at, clip.loop);
        if (c.bone === ROOT) root[c.axis] = v;
        else rot[c.bone * 3 + c.axis] = v;
      }
    },

    blend(fromRot, fromRoot, rot, root, w) {
      for (let i = 0; i < COUNT * 3; i++) rot[i] = fromRot[i] + (rot[i] - fromRot[i]) * w;
      for (let k = 0; k < 3; k++) root[k] = fromRoot[k] + (root[k] - fromRoot[k]) * w;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
