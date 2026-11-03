(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;
  const Rig = window.YouVidRig;

  const ID = 'S1egaStrad4';
  const DURATION = 204.43;
  const TRACK = window.SiegaTrack || { voice: '', arms: { L: [], R: [] } };
  const VOICE = K.envelope(TRACK.voice, 20);
  const motionAt = Rig.motion((window.YouVidMotion || {})[ID]);

  const GAME = [125.15, 128.117];
  const CALL = [186.017, 193.233];
  const SPIN = [[24.79, 0], [24.833, 4.6], [24.9, 12.7], [25.0, 35], [25.1, 58.6], [25.3, 96.2], [25.5, 133.6], [25.6, 165.1], [25.7, 176.2], [25.77, 180], [28.05, 180]];
  const WORLD = ['p', 'hLw', 'eLw', 'hRw', 'eRw', 'fLw', 'kLw', 'fRw', 'kRw'];

  const SHOTS = [
    { t: 0, shirt: 'grey', pitch: 0.17, lift: 1.287, chair: [0.067, -0.343, 0], chairKeys: [[1, 0.067, 0.000, -0.343], [7.4, 0.075, 0.001, -0.327], [8, -0.001, 0.025, -0.415], [8.5, -0.040, 0.041, -0.513], [9, -0.041, 0.063, -0.583], [11, -0.132, 0.100, -0.802], [13, 0.060, 0.089, -0.665], [14, 0.074, 0.083, -0.665], [14.8, 0.164, 0.061, -0.570]], ledPx: [1040, 545], key: 1.61, bg: 1.33 },
    { t: 14.967, shirt: 'white', pitch: 0.17, lift: 1.239, chair: [-0.107, -0.530, 0], ledPx: [950, 490], key: 0.71, bg: 0.69 },
    { t: 22.767, shirt: 'black', pitch: 0.17, lift: 1.230, chair: [-0.010, -0.400, 0], ledPx: [1100, 600], key: 1.00, bg: 0.70 },
    { t: 28.05, shirt: 'black', pitch: 0.17, lift: 1.247, chair: [0.043, -0.459, 0], ledPx: [1000, 480], key: 1.23, bg: 0.90 },
    { t: 39.267, shirt: 'black', pitch: 0.17, lift: 1.222, chair: [0.139, -0.574, 0], key: 1.30, bg: 0.91 },
    { t: 43.833, shirt: 'black', pitch: 0.17, lift: 1.275, chair: [0.070, -0.341, 0], pillow: [-0.04, 0.6, 0.06], key: 1.60, bg: 1.27 },
    { t: 53.583, shirt: 'black', pitch: 0.17, lift: 1.237, chair: [-0.064, -0.522, 0], chairKeys: [[56, -0.064, 0.000, -0.522], [59, -0.064, -0.004, -0.546], [60.2, -0.064, 0.000, -0.546], [62.5, 0.028, 0.039, -0.667], [64, -0.002, 0.029, -0.638]], ledPx: [960, 530], key: 1.09, bg: 1.03 },
    { t: 69.283, shirt: 'grey', pitch: 0.17, lift: 1.245, chair: [0.089, -0.583, 0], ledPx: [1060, 560], key: 0.97, bg: 0.70 },
    { t: 82.233, shirt: 'grey', pitch: 0.17, lift: 1.287, chair: [0.067, -0.343, 0], chairKeys: [[83.233, 0.067, 0.000, -0.343], [89.633, 0.075, 0.001, -0.327], [90.233, -0.001, 0.025, -0.415], [90.733, -0.040, 0.041, -0.513], [91.233, -0.041, 0.063, -0.583], [93.233, -0.132, 0.100, -0.802], [95.233, 0.060, 0.089, -0.665], [96.233, 0.074, 0.083, -0.665], [97.033, 0.164, 0.061, -0.570]], ledPx: [1040, 545], key: 1.24, bg: 1.26 },
    { t: 102.9, shirt: 'black', pitch: 0.17, lift: 1.250, chair: [0.050, -0.420, 0], ledPx: [1080, 520], key: 1.11, bg: 0.75 },
    { t: 111.75, shirt: 'black', pitch: 0.17, lift: 1.278, chair: [0.028, -0.352, 0], chairKeys: [[113, 0.028, 0.000, -0.352], [116.8, 0.028, 0.000, -0.352], [118.6, 0.206, 0.087, -0.696], [120, 0.206, 0.087, -0.696]], pillow: [-0.06, 0.6, 0.08], ledPx: [1080, 560], key: 1.41, bg: 1.19 },
    { t: 125.15, kind: 'game' },
    { t: 128.117, shirt: 'black', pitch: 0.17, lift: 1.233, chair: [0.082, -0.520, 0], chairKeys: [[130, 0.082, 0.000, -0.520], [136, 0.065, 0.011, -0.569], [141, 0.039, 0.012, -0.557]], ledPx: [1010, 510], key: 0.99, bg: 0.72 },
    { t: 143.9, shirt: 'black', pitch: 0.17, lift: 1.275, chair: [0.040, -0.444, 0], ledPx: [1070, 560], key: 1.49, bg: 0.90 },
    { t: 152.233, shirt: 'white', pitch: 0.17, lift: 1.291, chair: [0.091, -0.442, 0], ledPx: [1040, 540], key: 1.23, bg: 0.94 },
    { t: 159.717, shirt: 'bulka', pitch: 0.17, lift: 1.220, chair: [0.090, -0.420, 0], ledPx: [1100, 480], key: 1.17, bg: 0.72 },
    { t: 173.833, shirt: 'bulka', pitch: 0.17, lift: 1.280, chair: [0.000, -0.380, 0], ledPx: [1040, 470], key: 1.06, bg: 0.90 },
    { t: 186.017, shirt: 'bulka', pitch: 0.17, lift: 1.217, chair: [0.098, -0.358, 0], ledPx: [1000, 500], key: 0.77, bg: 0.82, call: true },
    { t: 193.233, shirt: 'bulka', pitch: 0.17, lift: 1.297, chair: [0.090, -0.349, 0], chairKeys: [[194, 0.090, 0.000, -0.349], [196.4, 0.080, 0.000, -0.358], [197, 0.540, 0.076, -0.661], [198, 0.673, 0.086, -0.734], [199, 0.578, 0.085, -0.710], [201.2, 0.450, 0.083, -0.670], [203, 0.350, 0.081, -0.626], [204, 0.319, 0.080, -0.654]], pillow: [-0.05, 0.6, 0.05], key: 1.29, bg: 0.91 }
  ];

  const RAMP = 0.22;
  const KEYS = { L: [0.2, -0.3, 0.36], R: [-0.2, -0.3, 0.36] };

  const FACE = [
    [0, 'open', 'flat', 'shut', 'm'], [0.5, 'open', 'flat', 'talk', 'm'], [1, 'down', 'flat', 'talk', 'd'], [1.5, 'down', 'furrow', 'talk', 'd'],
    [2, 'open', 'furrow', 'shut', 'm'], [2.5, 'down', 'flat', 'round', 'd'], [3, 'open', 'furrow', 'teeth', 'm'],
    [3.5, 'open', 'furrow', 'talk', 'm'], [4, 'down', 'flat', 'shut', 'd'], [5.5, 'down', 'furrow', 'talk', 'd'], [6, 'down', 'flat', 'shut', 'd'],
    [6.5, 'down', 'flat', 'shut', 'l'], [7, 'squint', 'furrow', 'teeth', 'l'], [7.5, 'shut', 'furrow', 'teeth', 'd'],
    [8.5, 'down', 'furrow', 'teeth', 'd'], [9, 'down', 'furrow', 'open', 'd'], [9.5, 'squint', 'furrow', 'open', 'd'],
    [10.5, 'down', 'furrow', 'shut', 'd'], [11, 'down', 'furrow', 'talk', 'd'], [11.5, 'down', 'furrow', 'round', 'd'],
    [12, 'down', 'flat', 'shut', 'd'], [12.5, 'down', 'flat', 'talk', 'm'], [13, 'open', 'furrow', 'open', 'm'],
    [13.5, 'open', 'furrow', 'round', 'm'], [14, 'open', 'furrow', 'teeth', 'm'], [14.5, 'open', 'furrow', 'open', 'm'],
    [15, 'half', 'flat', 'talk', 'd'], [15.5, 'shut', 'furrow', 'talk', 'd'], [16, 'open', 'furrow', 'round', 'm'],
    [16.5, 'open', 'flat', 'talk', 'c'], [17, 'open', 'up', 'talk', 'c'], [17.5, 'open', 'flat', 'shut', 'm'], [18, 'open', 'furrow', 'round', 'm'],
    [18.5, 'open', 'furrow', 'teeth', 'm'], [19, 'open', 'furrow', 'talk', 'm'], [19.5, 'open', 'furrow', 'talk', 'r'],
    [20, 'down', 'flat', 'shut', 'd'], [20.5, 'open', 'furrow', 'round', 'm'], [21, 'open', 'furrow', 'teeth', 'c'],
    [21.5, 'half', 'flat', 'round', 'd'], [22, 'down', 'flat', 'shut', 'd'], [22.5, 'open', 'flat', 'round', 'c'],
    [23, 'squint', 'furrow', 'teeth', 'm'], [23.5, 'squint', 'furrow', 'teeth', 'd'], [24.5, 'wide', 'furrow', 'open', 'c'],
    [25, 'squint', 'furrow', 'open', 'd'], [25.5, 'half', 'furrow', 'open', 'd'], [26, 'open', 'furrow', 'talk', 'm'],
    [26.5, 'open', 'furrow', 'round', 'm'], [27, 'open', 'furrow', 'teeth', 'm'], [27.5, 'down', 'flat', 'talk', 'd'],
    [28, 'open', 'furrow', 'teeth', 'm'], [28.5, 'squint', 'sad', 'grin', 'd'], [29.5, 'shut', 'sad', 'teeth', 'd'],
    [30, 'half', 'sad', 'teeth', 'd'], [30.5, 'shut', 'furrow', 'talk', 'd'], [31, 'open', 'furrow', 'round', 'm'],
    [31.5, 'half', 'flat', 'talk', 'd'], [32, 'open', 'sad', 'teeth', 'm'], [32.5, 'half', 'flat', 'talk', 'd'], [33, 'wide', 'up', 'talk', 'c'],
    [33.5, 'open', 'furrow', 'teeth', 'm'], [34, 'down', 'sad', 'shut', 'd'], [34.5, 'open', 'flat', 'open', 'm'], [35, 'down', 'flat', 'round', 'd'],
    [35.5, 'wide', 'up', 'open', 'c'], [36, 'wide', 'up', 'round', 'm'], [36.5, 'open', 'flat', 'round', 'r'], [37, 'open', 'sad', 'teeth', 'm'],
    [37.5, 'wide', 'sad', 'open', 'c'], [38, 'half', 'sad', 'teeth', 'd'], [38.5, 'down', 'flat', 'round', 'd'], [39, 'open', 'up', 'round', 'm'],
    [39.5, 'down', 'sad', 'shut', 'd'], [40, 'down', 'furrow', 'open', 'd'], [40.5, 'open', 'sad', 'teeth', 'm'], [41, 'down', 'sad', 'shut', 'd'],
    [41.5, 'half', 'flat', 'talk', 'd'], [42, 'open', 'furrow', 'talk', 'c'], [42.5, 'open', 'flat', 'open', 'c'],
    [43, 'squint', 'furrow', 'teeth', 'm'], [43.5, 'open', 'flat', 'round', 'c'], [44, 'down', 'sad', 'shut', 'd'],
    [44.5, 'squint', 'sad', 'teeth', 'd'], [45, 'squint', 'furrow', 'teeth', 'd'], [45.5, 'shut', 'furrow', 'open', 'd'],
    [46, 'down', 'sad', 'teeth', 'd'], [46.5, 'down', 'sad', 'talk', 'd'], [47.5, 'down', 'sad', 'round', 'd'], [48, 'down', 'furrow', 'talk', 'd'],
    [48.5, 'down', 'sad', 'shut', 'd'], [49, 'down', 'furrow', 'talk', 'd'], [49.5, 'down', 'furrow', 'round', 'd'],
    [50.5, 'open', 'furrow', 'teeth', 'm'], [51, 'down', 'furrow', 'round', 'd'], [51.5, 'open', 'sad', 'talk', 'c'],
    [52, 'squint', 'furrow', 'open', 'c'], [52.5, 'squint', 'furrow', 'open', 'l'], [53, 'squint', 'furrow', 'teeth', 'd'],
    [53.5, 'half', 'flat', 'talk', 'd'], [54, 'down', 'flat', 'shut', 'm'], [54.5, 'half', 'flat', 'talk', 'm'], [55, 'down', 'flat', 'talk', 'd'],
    [55.5, 'half', 'flat', 'talk', 'd'], [56, 'down', 'flat', 'shut', 'd'], [56.5, 'half', 'flat', 'talk', 'd'], [57, 'half', 'flat', 'talk', 'l'],
    [57.5, 'shut', 'sad', 'open', 'c'], [58.5, 'shut', 'sad', 'shut', 'd'], [59, 'squint', 'flat', 'grin', 'c'], [60, 'squint', 'flat', 'grin', 'd'],
    [60.5, 'shut', 'flat', 'grin', 'd'], [63, 'down', 'flat', 'shut', 'd'], [63.5, 'open', 'furrow', 'teeth', 'm'], [64, 'open', 'sad', 'teeth', 'd'],
    [64.5, 'half', 'flat', 'round', 'c'], [65, 'half', 'sad', 'teeth', 'd'], [65.5, 'down', 'sad', 'talk', 'd'], [66, 'half', 'flat', 'talk', 'd'],
    [66.5, 'down', 'flat', 'talk', 'd'], [67, 'half', 'flat', 'round', 'd'], [67.5, 'down', 'flat', 'talk', 'd'],
    [68, 'down', 'furrow', 'teeth', 'd'], [68.5, 'half', 'flat', 'teeth', 'd'], [69, 'half', 'furrow', 'teeth', 'd'],
    [69.5, 'half', 'flat', 'shut', 'm'], [70, 'half', 'flat', 'open', 'm'], [70.5, 'squint', 'furrow', 'round', 'm'],
    [71, 'squint', 'sad', 'open', 'm'], [71.5, 'down', 'furrow', 'talk', 'd'], [72, 'half', 'furrow', 'round', 'd'],
    [72.5, 'down', 'flat', 'round', 'd'], [73, 'squint', 'furrow', 'open', 'm'], [73.5, 'squint', 'furrow', 'open', 'd'],
    [74, 'squint', 'furrow', 'teeth', 'd'], [74.5, 'shut', 'furrow', 'teeth', 'd'], [75, 'squint', 'furrow', 'open', 'd'],
    [75.5, 'squint', 'furrow', 'round', 'd'], [76, 'squint', 'furrow', 'teeth', 'm'], [76.5, 'open', 'furrow', 'round', 'm'],
    [77, 'squint', 'furrow', 'teeth', 'd'], [77.5, 'open', 'furrow', 'round', 'm'], [78, 'open', 'sad', 'teeth', 'm'],
    [78.5, 'squint', 'furrow', 'teeth', 'm'], [79, 'down', 'furrow', 'round', 'l'], [79.5, 'open', 'up', 'round', 'l'],
    [80, 'open', 'sad', 'shut', 'l'], [80.5, 'open', 'furrow', 'open', 'm'], [81, 'open', 'furrow', 'round', 'm'], [81.5, 'open', 'sad', 'shut', 'c'],
    [82, 'open', 'sad', 'talk', 'c'], [82.5, 'open', 'flat', 'shut', 'm'], [83, 'open', 'furrow', 'open', 'm'], [83.5, 'down', 'flat', 'talk', 'd'],
    [84, 'half', 'furrow', 'open', 'd'], [84.5, 'open', 'furrow', 'talk', 'm'], [85.5, 'open', 'furrow', 'shut', 'm'],
    [86.5, 'down', 'flat', 'talk', 'd'], [87, 'down', 'flat', 'shut', 'd'], [88, 'down', 'furrow', 'shut', 'd'], [88.5, 'down', 'flat', 'shut', 'd'],
    [89, 'squint', 'flat', 'grin', 'l'], [89.5, 'shut', 'furrow', 'teeth', 'd'], [90, 'shut', 'furrow', 'open', 'd'],
    [90.5, 'squint', 'furrow', 'open', 'd'], [91, 'down', 'furrow', 'teeth', 'd'], [91.5, 'down', 'furrow', 'shut', 'd'],
    [92.5, 'squint', 'furrow', 'open', 'd'], [93, 'down', 'furrow', 'shut', 'd'], [93.5, 'down', 'furrow', 'talk', 'd'],
    [94, 'down', 'furrow', 'round', 'd'], [94.5, 'down', 'flat', 'shut', 'd'], [95, 'down', 'flat', 'talk', 'm'],
    [95.5, 'open', 'furrow', 'open', 'm'], [96, 'down', 'furrow', 'shut', 'd'], [96.5, 'open', 'furrow', 'teeth', 'm'],
    [97, 'down', 'flat', 'shut', 'd'], [97.5, 'down', 'furrow', 'talk', 'd'], [98, 'open', 'flat', 'teeth', 'm'],
    [98.5, 'shut', 'furrow', 'teeth', 'd'], [99, 'squint', 'furrow', 'teeth', 'd'], [99.5, 'shut', 'furrow', 'open', 'd'],
    [100, 'squint', 'furrow', 'open', 'd'], [100.5, 'open', 'furrow', 'teeth', 'm'], [101, 'open', 'furrow', 'talk', 'm'],
    [101.5, 'down', 'flat', 'talk', 'd'], [102.5, 'down', 'furrow', 'talk', 'd'], [103, 'shut', 'sad', 'teeth', 'd'],
    [103.5, 'shut', 'furrow', 'teeth', 'd'], [104.5, 'down', 'furrow', 'shut', 'd'], [105, 'down', 'furrow', 'teeth', 'd'],
    [106, 'shut', 'furrow', 'teeth', 'd'], [106.5, 'down', 'furrow', 'shut', 'd'], [109.5, 'squint', 'furrow', 'teeth', 'd'],
    [110.5, 'squint', 'furrow', 'round', 'd'], [111, 'open', 'furrow', 'teeth', 'm'], [112, 'down', 'flat', 'shut', 'm'],
    [112.5, 'half', 'flat', 'shut', 'd'], [113, 'down', 'flat', 'shut', 'd'], [114, 'open', 'furrow', 'shut', 'm'],
    [114.5, 'down', 'flat', 'shut', 'd'], [115.5, 'down', 'furrow', 'shut', 'd'], [116.5, 'down', 'furrow', 'open', 'd'],
    [117, 'squint', 'furrow', 'teeth', 'd'], [117.5, 'squint', 'furrow', 'open', 'd'], [118.5, 'open', 'furrow', 'talk', 'c'],
    [119, 'down', 'furrow', 'round', 'd'], [119.5, 'open', 'furrow', 'talk', 'm'], [120, 'down', 'flat', 'round', 'd'],
    [120.5, 'squint', 'furrow', 'teeth', 'm'], [121, 'open', 'flat', 'teeth', 'm'], [121.5, 'half', 'flat', 'round', 'd'],
    [122, 'open', 'furrow', 'talk', 'm'], [122.5, 'open', 'flat', 'shut', 'm'], [123, 'squint', 'furrow', 'open', 'm'],
    [123.5, 'open', 'flat', 'shut', 'm'], [124, 'down', 'sad', 'shut', 'd'], [124.5, 'down', 'flat', 'shut', 'd'],
    [128.5, 'open', 'furrow', 'teeth', 'm'], [129, 'squint', 'furrow', 'teeth', 'd'], [129.5, 'down', 'sad', 'shut', 'd'],
    [130, 'squint', 'furrow', 'teeth', 'd'], [130.5, 'open', 'furrow', 'teeth', 'l'], [131.5, 'open', 'furrow', 'round', 'l'],
    [132, 'down', 'furrow', 'talk', 'd'], [132.5, 'squint', 'furrow', 'round', 'm'], [133, 'open', 'furrow', 'round', 'm'],
    [133.5, 'open', 'furrow', 'teeth', 'm'], [134, 'down', 'furrow', 'teeth', 'd'], [134.5, 'half', 'sad', 'shut', 'd'],
    [135, 'open', 'furrow', 'teeth', 'l'], [135.5, 'down', 'furrow', 'round', 'd'], [136, 'down', 'furrow', 'teeth', 'd'],
    [136.5, 'squint', 'furrow', 'teeth', 'd'], [137, 'down', 'furrow', 'teeth', 'd'], [138, 'open', 'flat', 'talk', 'l'],
    [138.5, 'open', 'flat', 'teeth', 'd'], [139, 'down', 'flat', 'shut', 'd'], [139.5, 'open', 'furrow', 'teeth', 'c'],
    [140, 'half', 'flat', 'talk', 'm'], [140.5, 'half', 'flat', 'round', 'd'], [141, 'open', 'flat', 'talk', 'm'],
    [141.5, 'open', 'flat', 'shut', 'c'], [142, 'down', 'flat', 'talk', 'd'], [142.5, 'open', 'furrow', 'shut', 'm'],
    [143, 'open', 'flat', 'round', 'c'], [143.5, 'open', 'furrow', 'talk', 'm'], [144, 'half', 'flat', 'teeth', 'l'],
    [144.5, 'squint', 'flat', 'grin', 'd'], [145, 'shut', 'furrow', 'teeth', 'd'], [145.5, 'squint', 'furrow', 'teeth', 'd'],
    [146, 'squint', 'sad', 'open', 'm'], [146.5, 'open', 'sad', 'teeth', 'm'], [147, 'open', 'sad', 'teeth', 'c'],
    [147.5, 'open', 'sad', 'open', 'm'], [148, 'open', 'sad', 'round', 'm'], [148.5, 'open', 'sad', 'talk', 'd'], [149, 'down', 'sad', 'round', 'd'],
    [149.5, 'down', 'sad', 'open', 'd'], [150, 'down', 'furrow', 'round', 'd'], [150.5, 'down', 'furrow', 'open', 'd'],
    [151, 'down', 'furrow', 'talk', 'd'], [151.5, 'open', 'furrow', 'talk', 'm'], [152, 'down', 'furrow', 'talk', 'd'],
    [152.5, 'down', 'flat', 'talk', 'd'], [153, 'down', 'flat', 'round', 'd'], [153.5, 'open', 'furrow', 'round', 'm'],
    [154, 'open', 'sad', 'teeth', 'm'], [154.5, 'down', 'sad', 'shut', 'd'], [155, 'squint', 'furrow', 'open', 'd'],
    [155.5, 'down', 'sad', 'teeth', 'd'], [156, 'open', 'flat', 'round', 'd'], [156.5, 'down', 'sad', 'shut', 'd'],
    [157, 'down', 'furrow', 'open', 'd'], [157.5, 'open', 'sad', 'shut', 'c'], [158, 'open', 'furrow', 'round', 'm'],
    [158.5, 'down', 'furrow', 'teeth', 'd'], [159, 'open', 'sad', 'round', 'm'], [159.5, 'open', 'sad', 'teeth', 'c'],
    [160, 'half', 'flat', 'talk', 'd'], [160.5, 'down', 'flat', 'talk', 'd'], [161, 'open', 'flat', 'talk', 'c'],
    [161.5, 'open', 'flat', 'teeth', 'c'], [162, 'open', 'flat', 'talk', 'c'], [162.5, 'open', 'sad', 'teeth', 'c'],
    [163, 'squint', 'furrow', 'open', 'm'], [163.5, 'shut', 'furrow', 'teeth', 'd'], [164.5, 'down', 'furrow', 'teeth', 'd'],
    [165, 'shut', 'furrow', 'teeth', 'd'], [165.5, 'down', 'furrow', 'shut', 'd'], [167.5, 'down', 'furrow', 'open', 'd'],
    [168.5, 'open', 'furrow', 'open', 'c'], [169, 'open', 'furrow', 'shut', 'c'], [169.5, 'squint', 'furrow', 'talk', 'c'],
    [170, 'open', 'furrow', 'teeth', 'c'], [170.5, 'open', 'furrow', 'talk', 'm'], [171, 'open', 'furrow', 'teeth', 'm'],
    [171.5, 'open', 'furrow', 'open', 'c'], [172, 'open', 'flat', 'teeth', 'c'], [172.5, 'squint', 'furrow', 'teeth', 'm'],
    [173, 'down', 'furrow', 'round', 'd'], [173.5, 'open', 'flat', 'teeth', 'c'], [174, 'down', 'flat', 'talk', 'd'],
    [174.5, 'shut', 'sad', 'shut', 'd'], [175, 'squint', 'sad', 'smile', 'd'], [175.5, 'squint', 'furrow', 'teeth', 'd'],
    [176, 'open', 'furrow', 'teeth', 'm'], [176.5, 'open', 'sad', 'round', 'm'], [177, 'half', 'flat', 'shut', 'l'],
    [177.5, 'squint', 'furrow', 'round', 'd'], [178, 'wide', 'furrow', 'open', 'c'], [178.5, 'half', 'flat', 'round', 'd'],
    [179, 'open', 'flat', 'round', 'm'], [179.5, 'open', 'sad', 'round', 'm'], [180, 'open', 'flat', 'shut', 'l'],
    [180.5, 'open', 'sad', 'teeth', 'm'], [181, 'open', 'sad', 'round', 'm'], [181.5, 'open', 'furrow', 'teeth', 'm'],
    [182, 'squint', 'furrow', 'teeth', 'd'], [182.5, 'down', 'sad', 'shut', 'd'], [183, 'open', 'sad', 'round', 'm'],
    [183.5, 'down', 'flat', 'shut', 'd'], [184, 'down', 'furrow', 'teeth', 'd'], [184.5, 'down', 'furrow', 'round', 'd'],
    [185, 'open', 'furrow', 'teeth', 'c'], [185.5, 'open', 'flat', 'shut', 'c'], [186, 'half', 'flat', 'talk', 'd'],
    [186.5, 'open', 'flat', 'round', 'c'], [187, 'half', 'flat', 'teeth', 'c'], [187.5, 'squint', 'furrow', 'teeth', 'c'],
    [188, 'half', 'furrow', 'shut', 'd'], [188.5, 'half', 'flat', 'talk', 'c'], [189, 'half', 'flat', 'round', 'd'],
    [189.5, 'down', 'furrow', 'open', 'd'], [190.5, 'down', 'furrow', 'round', 'd'], [191, 'squint', 'furrow', 'open', 'd'],
    [191.5, 'squint', 'furrow', 'round', 'd'], [192, 'shut', 'flat', 'talk', 'd'], [192.5, 'shut', 'flat', 'shut', 'd'],
    [193, 'squint', 'furrow', 'open', 'd'], [193.5, 'down', 'flat', 'shut', 'm'], [194, 'down', 'flat', 'shut', 'd'],
    [194.5, 'shut', 'flat', 'shut', 'd'], [195.5, 'down', 'flat', 'shut', 'd'], [196, 'down', 'furrow', 'shut', 'd'],
    [197, 'down', 'furrow', 'teeth', 'd'], [197.5, 'shut', 'furrow', 'teeth', 'd'], [199.5, 'down', 'furrow', 'teeth', 'd'],
    [200, 'down', 'furrow', 'shut', 'd'], [201, 'open', 'furrow', 'teeth', 'd'], [201.5, 'down', 'sad', 'teeth', 'd'],
    [202, 'open', 'sad', 'talk', 'm'], [202.5, 'down', 'furrow', 'open', 'd'], [203, 'down', 'furrow', 'shut', 'd'],
    [203.5, 'open', 'furrow', 'open', 'm'], [204, 'wide', 'up', 'round', 'c']
  ];

  const GRIPS = [
    [0, 'open', 'open'], [1.5, 'open', 'claw'], [3, 'open', 'fist'], [3.5, 'claw', 'fist'], [4, 'claw', 'claw'], [7, 'open', 'open'],
    [9.5, 'fist', 'open'], [10, 'open', 'open'], [44, 'claw', 'claw'], [45, 'fist', 'fist'], [46, 'open', 'open'], [61, 'fist', 'fist'],
    [61.5, 'open', 'open'], [83.5, 'open', 'claw'], [85.5, 'claw', 'fist'], [86, 'claw', 'claw'], [89.5, 'open', 'open'], [100.5, 'claw', 'open'],
    [101, 'open', 'open'], [104.5, 'fist', 'fist'], [105, 'open', 'open'], [105.5, 'fist', 'fist'], [106, 'claw', 'open'], [107, 'claw', 'claw'],
    [108.5, 'open', 'open'], [115.5, 'open', 'fist'], [116.5, 'open', 'open'], [139.5, 'fist', 'open'], [140.5, 'open', 'open'],
    [145, 'open', 'fist'], [146, 'open', 'open'], [164.5, 'claw', 'open'], [165.5, 'open', 'claw'], [167, 'open', 'open'], [169.5, 'claw', 'claw'],
    [170.5, 'open', 'open'], [197, 'fist', 'fist'], [197.5, 'open', 'open'], [198, 'claw', 'claw'], [199, 'open', 'open'], [199.5, 'claw', 'claw'],
    [201, 'open', 'open']
  ];

  const PHONES = [
    [0, 'on', 'R'], [106, 'hand', 'L'], [108.5, 'on', 'R'], [165.5, 'hand', 'R'], [170, 'on', 'R'], [197.5, 'hand', 'R'], [200, 'on', 'R']
  ];

  function shotAt(t) {
    let i = 0;
    for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
    return Object.assign({ index: i, end: i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION }, SHOTS[i]);
  }

  function restPose(shot) {
    const c = shot.chair;
    return {
      p: [c[0], 0.6, c[1] - 0.1],
      up: [0, 1, 0],
      fwd: [0, 0, 1],
      sp: [0.12, 0, 0],
      nk: [-0.1, 0, 0],
      hL: KEYS.L,
      hR: KEYS.R,
      fL: [0.14, -0.55, 0.45],
      fR: [-0.14, -0.55, 0.45]
    };
  }

  function pick(list, t) {
    let v = list[0];
    for (let i = 0; i < list.length && list[i][0] <= t; i++) v = list[i];
    return v;
  }

  function visibility(spans, t) {
    let best = 0;
    spans.forEach(([a, b]) => {
      const k = Math.min(clamp((t - a + RAMP) / RAMP, 0, 1), clamp((b - t + RAMP) / RAMP, 0, 1));
      best = Math.max(best, k);
    });
    return ease(best);
  }

  function mouthOf(base, v) {
    if (base === 'smile' || base === 'grin') return v > 0.4 ? 'grin' : base;
    if (base === 'teeth') return v > 0.82 ? 'open' : 'teeth';
    if (base === 'round') return v > 0.08 ? 'round' : 'shut';
    if (v < 0.1) return 'shut';
    if (v < 0.34) return 'talk';
    return 'open';
  }

  function blinkAt(t) {
    const k = (t * 0.29 + Math.sin(t * 0.7) * 0.4) % 1;
    return k > 0.965;
  }

  function faceAt(t) {
    const f = pick(FACE, t);
    const v = VOICE(t);
    let eyes = f[1];
    if ((eyes === 'open' || eyes === 'wide') && blinkAt(t)) eyes = 'shut';
    return { eyes, brows: f[2], mouth: mouthOf(f[3], v), gaze: f[4] };
  }

  function armsFor(pose, t) {
    const m0 = Rig.solve(pose, window.SiegaCast.D);
    const { M4 } = window.P3D;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const vis = visibility(TRACK.arms[s] || [], t);
      const kb = M4.point(m0.chest, KEYS[s]);
      const kbPole = M4.point(m0.chest, [k * 0.45, -0.2, -0.25]);
      const hw = pose['h' + s + 'w'], ew = pose['e' + s + 'w'];
      pose['h' + s + 'w'] = hw ? kb.map((v, i) => lerp(v, hw[i], vis)) : kb;
      pose['e' + s + 'w'] = ew ? kbPole.map((v, i) => lerp(v, ew[i], vis)) : kbPole;
    });
  }

  function poseAt(t, shot) {
    const pose = restPose(shot);
    const mv = motionAt(t);
    if (mv) {
      Rig.applyMotion(pose, mv);
      WORLD.forEach(k => { if (pose[k]) pose[k] = [pose[k][0], pose[k][1] + shot.lift, pose[k][2]]; });
    }
    armsFor(pose, t);
    const g = pick(GRIPS, t), ph = pick(PHONES, t);
    pose.shirt = shot.shirt;
    pose.gL = g[1];
    pose.gR = g[2];
    pose.phones = ph[1];
    pose.phonesHand = ph[2];
    Object.assign(pose, faceAt(t));
    return pose;
  }

  function chairAt(shot, t) {
    const c = shot.chair;
    const keys = shot.chairKeys;
    if (!keys) return [c[0], 0, c[1], c[2] || 0];
    let v = keys[0];
    if (t >= keys[keys.length - 1][0]) v = keys[keys.length - 1];
    else if (t > keys[0][0]) {
      for (let i = 1; i < keys.length; i++) {
        if (t < keys[i][0]) {
          const a = keys[i - 1], b = keys[i];
          const k = ease((t - a[0]) / (b[0] - a[0]));
          v = [t, lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)];
          break;
        }
      }
    }
    return [v[1], v[2], v[3], c[2] || 0];
  }

  function cameraOf(shot) {
    const a = shot.pitch || 0.2, y = shot.yaw || 0;
    const h = shot.lift;
    return { eye: [0, h, 0], at: [-Math.sin(y) * Math.cos(a), h - Math.sin(a), -Math.cos(y) * Math.cos(a)], fov: shot.fov || 46, roll: 0 };
  }

  function spinAt(t) {
    if (t < SPIN[0][0] || t >= SPIN[SPIN.length - 1][0]) return 0;
    for (let i = 1; i < SPIN.length; i++) {
      if (t < SPIN[i][0]) {
        const [a, va] = SPIN[i - 1], [b, vb] = SPIN[i];
        return (va + (vb - va) * (t - a) / (b - a)) * Math.PI / 180;
      }
    }
    return 0;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const shot = shotAt(tt);
    if (shot.kind === 'game') return { t: tt, kind: 'game', shot, k: (tt - GAME[0]) / (GAME[1] - GAME[0]) };
    const camera = cameraOf(shot);
    camera.roll = spinAt(tt);
    return {
      t: tt,
      kind: shot.call ? 'call' : 'cam',
      shot,
      camera,
      chair: chairAt(shot, tt),
      pose: poseAt(tt, shot),
      call: shot.call ? { seconds: Math.floor(tt - CALL[0]) } : null
    };
  }

  window.SiegaScript = { ID, DURATION, VOICE, SHOTS, GAME, CALL, SPIN, stage, shotAt, chairAt, faceAt };
})();
