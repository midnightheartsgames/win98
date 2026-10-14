const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SCENES = ['perf', 'breakdown', 'presets', 'sheet', 'showroom', 'details', 'liveries', 'finish', 'cabin', 'wheels', 'faces', 'cockpit', 'motion', 'night', 'rain', 'time', 'stats', 'city', 'weather', 'ads', 'festival', 'streets', 'airport', 'zakusala', 'lucavsala', 'market', 'bisumuiza', 'debug', 'photo', 'damage', 'flora'];
const WRECK_SPOT = [1500, -830];
const SMASH = ['lamp', 'bench', 'fence', 'bin', 'citylight', 'stall'];
const LANDMARK_VIEWS = [
  { lm: 'blackheads', d: 47, ty: 14, turn: 0.06 }, { lm: 'roland', d: 13, ty: 3, turn: -0.04 }, { lm: 'tvtower', d: 612, ty: 150, turn: -0.04, fov: 50 },
  { lm: 'tvtower', name: 'tvtower-near', d: 229, ty: 110, turn: -0.04 }, { lm: 'dom', d: 66, ty: 25, turn: 0.06 }, { lm: 'dom', name: 'dom-east', d: 63, ty: 25, turn: -3.14 },
  { lm: 'peter', d: 73, ty: 45, turn: -0.14 }, { lm: 'peter', name: 'peter-side', d: 63, ty: 45, turn: 1.06 }, { lm: 'freedom', d: 55, ty: 18, turn: -0.04 },
  { lm: 'terminal', d: 109, ty: 8, turn: -0.04 }, { lm: 'dzintari', d: 40, ty: 8, turn: -0.04 }, { lm: 'turtle', d: 13, ty: 1.2, turn: -0.04, h: 1.6 },
  { lm: 'castle', d: 49, ty: 12, turn: -0.54 }, { lm: 'powder', d: 41, ty: 12, turn: -0.84 }, { lm: 'academy', d: 112, ty: 40, turn: 0.06 },
  { lm: 'market', d: 139, ty: 8, turn: -0.04 }, { lm: 'station', d: 107, ty: 10, turn: -0.04 }, { lm: 'opera', d: 79, ty: 10, turn: -0.04 },
  { lm: 'latvija', d: 60, ty: 40, turn: -0.74 }, { lm: 'nativity', d: 71, ty: 16, turn: -0.04 }, { lm: 'stjohn', d: 34, ty: 20, turn: -0.34 },
  { lm: 'stjacob', d: 38, ty: 30, turn: -0.24 }, { lm: 'riflemen', d: 20, ty: 4, turn: -0.44 }, { lm: 'occupation', d: 47, ty: 5, turn: -0.04 },
  { lm: 'laima', d: 12, ty: 3, turn: -0.04 }, { lm: 'lighthouse', d: 71, ty: 16, turn: -0.04 }, { lm: 'spilve', d: 140, ty: 14, turn: -0.04 },
  { lm: 'bandstand', d: 109, ty: 10, turn: -0.04 }, { lm: 'blackheads', name: 'blackheads-night', d: 47, ty: 14, turn: 0.06, clock: 22.5 },
  { lm: 'terminal', name: 'terminal-night', d: 109, ty: 8, turn: -0.04, clock: 22.5 }, { lm: 'tvtower', name: 'tvtower-night', d: 229, ty: 110, turn: -0.04, clock: 22.5 }
];
const CITY_VIEWS = [
  { name: 'air-vecriga', x: 120, y: 170, z: 480, tx: 650, ty: 10, tz: -20, fov: 60 },
  { name: 'air-centrs', x: 850, y: 220, z: 150, tx: 1500, ty: 10, tz: -650, fov: 60 },
  { name: 'air-jurmala', x: -2450, y: 140, z: -1350, tx: -2850, ty: 0, tz: -1950, fov: 60 },
  { name: 'air-river', x: 1900, y: 280, z: 1700, tx: 700, ty: 0, tz: 200, fov: 60 },
  { name: 'street-vecriga', road: [652, 82], ahead: 60 },
  { name: 'street-centrs', road: [1500, -830], ahead: 90 },
  { name: 'street-soviet', road: [2900, 150], ahead: 90 },
  { name: 'street-jurmala', road: [-2800, -1870], ahead: 70 }
];
const HUB_SKY = { x: 905, y: 2, z: -1628, tx: 1400, ty: 180, tz: -1700, fov: 70 };
const STREET = { road: [1500, -830], ahead: 90 };
const WEATHER_VIEWS = [
  { name: 'sky-clear', ...HUB_SKY, weather: 'clear', clock: 13 }, { name: 'sky-overcast', ...HUB_SKY, weather: 'overcast', clock: 13 },
  { name: 'sky-downpour', ...HUB_SKY, weather: 'downpour', clock: 13 }, { name: 'sky-storm-flash', ...HUB_SKY, weather: 'storm', clock: 13, strike: true },
  { name: 'sky-sunset', x: 905, y: 2, z: -1628, tx: 1400, ty: 60, tz: -1900, fov: 70, clock: 18.4 }, { name: 'sky-dawn', x: 905, y: 2, z: -1628, sun: true, fov: 70, clock: 6.9 },
  { name: 'sky-night', ...HUB_SKY, clock: 23 }, { name: 'rays-festival', x: 905, y: 2, z: -1628, sun: true, fov: 75, clock: 17.6 },
  { name: 'street-clear', ...STREET, clock: 14 }, { name: 'street-overcast', ...STREET, weather: 'overcast', clock: 14 },
  { name: 'street-downpour', ...STREET, weather: 'downpour', clock: 14 }, { name: 'street-storm-night', ...STREET, weather: 'storm', clock: 22.5, strike: true },
  { name: 'street-fog', ...STREET, weather: 'fog', clock: 8 }, { name: 'street-fog-night', ...STREET, weather: 'fog', clock: 22.5 },
  { name: 'fog-sun', x: 905, y: 2, z: -1628, sun: true, fov: 70, weather: 'fog', clock: 8.5 }, { name: 'fog-tower', x: 1500, y: 4, z: 1300, tx: 1887, ty: 120, tz: 1971, fov: 60, weather: 'fog', clock: 10 },
  { name: 'fog-above', x: 1250, y: 90, z: -650, tx: 1500, ty: 20, tz: -900, fov: 60, weather: 'fog', clock: 9 }
];
const AD_VIEWS = [
  { name: 'ad-bill', ad: 'bill', theme: 'city', i: 3, d: 26, ty: 7 }, { name: 'ad-bill-festival', ad: 'bill', theme: 'fest', i: 1, d: 26, ty: 7 },
  { name: 'ad-bill-night', ad: 'bill', theme: 'city', i: 3, d: 26, ty: 7, clock: 22.5 }, { name: 'ad-trivision', ad: 'tri', i: 3, d: 16, ty: 5, frames: 300 },
  { name: 'ad-shelter', ad: 'shelter', i: 2, d: 9, side: -3, ty: 1.5 }, { name: 'ad-column', ad: 'column', theme: 'centre', i: 2, d: 6, side: 2, ty: 1.6 },
  { name: 'ad-span', ad: 'span', i: 0, d: 30, ty: 6 }, { name: 'ad-span-jurmala', ad: 'span', theme: 'jurmala', i: 0, d: 30, ty: 6 },
  { name: 'ad-hoarding', ad: 'hoard', i: 10, d: 12, side: 6, ty: 1 }, { name: 'ad-roof-night', ad: 'roof', i: 0, d: 60, ty: 2, clock: 22.5 }, { name: 'ad-mural', mural: 0 }
];
const FEST_VIEWS = [
  { name: 'fest-air', x: 1060, y: 95, z: -1520, tx: 880, ty: 0, tz: -1690, fov: 60 }, { name: 'fest-stage', x: 868, y: 2, z: -1690, tx: 868, ty: 9, tz: -1750, fov: 62 },
  { name: 'fest-boulevard', x: 861, y: 2, z: -1612, tx: 870, ty: 6, tz: -1720, fov: 62 }, { name: 'fest-showcase', x: 902, y: 2.4, z: -1630, tx: 913, ty: 1.5, tz: -1660, fov: 58 },
  { name: 'fest-village', x: 868, y: 2, z: -1672, tx: 830, ty: 3, tz: -1682, fov: 62 }, { name: 'fest-food', x: 965, y: 2, z: -1650, tx: 970, ty: 2, tz: -1605, fov: 62 },
  { name: 'fest-letters', x: 910, y: 2, z: -1592, tx: 910, ty: 2.5, tz: -1607, fov: 70 }, { name: 'fest-night-air', x: 1060, y: 95, z: -1520, tx: 880, ty: 0, tz: -1690, fov: 60, clock: 23 },
  { name: 'fest-night-stage', x: 868, y: 2, z: -1690, tx: 868, ty: 12, tz: -1750, fov: 66, clock: 23 }, { name: 'fest-night-boulevard', x: 861, y: 2, z: -1612, tx: 870, ty: 6, tz: -1720, fov: 62, clock: 22.5 }
];
const STREET_VIEWS = [
  { name: 'st-market', x: 2765, y: 5, z: 1790, tx: 2765, ty: 1, tz: 1822, fov: 62 }, { name: 'st-garages', x: 3440, y: 3, z: 1980, tx: 3436, ty: 1.5, tz: 1960, fov: 62 },
  { name: 'st-fountain', x: 470, y: 3, z: -688, tx: 485, ty: 1, tz: -703, fov: 62 }, { name: 'st-parkpath', x: 360, y: 2.2, z: -790, tx: 484, ty: 1, tz: -712, fov: 62 },
  { name: 'st-signpost', x: 97, y: 3, z: -560, tx: 101, ty: 3.5, tz: -586, fov: 55 }, { name: 'st-yardlot', x: 560, y: 4, z: -1200, tx: 580, ty: 0.5, tz: -1196, fov: 62 },
  { name: 'st-playground', x: 802, y: 4, z: -1238, tx: 788, ty: 0.5, tz: -1222, fov: 62 }, { name: 'st-zebra', x: 1318, y: 2.2, z: -1040, tx: 1300, ty: 1, tz: -1056, fov: 62 },
  { name: 'st-zebra-night', x: 1318, y: 2.2, z: -1040, tx: 1300, ty: 1, tz: -1056, fov: 62, clock: 23 }, { name: 'st-old-plaza', x: 588, y: 3, z: 148, tx: 605, ty: 1, tz: 162, fov: 62 },
  { name: 'st-busstop', x: 1110, y: 3, z: -1238, tx: 1096, ty: 2, tz: -1229, fov: 62 }, { name: 'st-soviet-air', x: 2950, y: 70, z: -60, tx: 3050, ty: 0, tz: 40, fov: 60 }
];
const AIRPORT_VIEWS = [
  { name: 'air-top', x: -1850, y: 140, z: 1800, tx: -2000, ty: 0, tz: 1600, fov: 60 }, { name: 'air-side', x: -2120, y: 30, z: 1700, tx: -2000, ty: 0, tz: 1600, fov: 62 },
  { name: 'air-forecourt', x: -1930, y: 2.5, z: 1625, tx: -2010, ty: 3, tz: 1612, fov: 62 }, { name: 'air-apron', x: -2060, y: 3, z: 1745, tx: -2120, ty: 4, tz: 1705, fov: 62 },
  { name: 'air-tu134', x: -1985, y: 3, z: 1680, tx: -1960, ty: 4, tz: 1705, fov: 62 }, { name: 'air-hangars', x: -1905, y: 6, z: 1760, tx: -1800, ty: 8, tz: 1740, fov: 62 },
  { name: 'air-road', x: -1790, y: 2, z: 1590, tx: -1900, ty: 3, tz: 1636, fov: 62 }, { name: 'air-night', x: -1850, y: 40, z: 1640, tx: -1950, ty: 0, tz: 1800, fov: 62, clock: 23 },
  { name: 'air-fog', x: -1960, y: 3, z: 1655, tx: -2000, ty: 6, tz: 1600, fov: 64, weather: 'fog', clock: 8 }
];
const LUC_VIEWS = [
  { name: 'luc-air', x: 1010, y: 170, z: 1840, tx: 820, ty: 0, tz: 1660, fov: 66 }, { name: 'luc-gate', x: 901, y: 2, z: 1817, tx: 880, ty: 3.2, tz: 1793, fov: 66 },
  { name: 'luc-hub', x: 852, y: 5, z: 1730, tx: 836, ty: 1.5, tz: 1711, fov: 70 }, { name: 'luc-memorial', x: 826, y: 2, z: 1723, tx: 765, ty: 3, tz: 1778, fov: 50 },
  { name: 'luc-monument', x: 776, y: 2.2, z: 1768, tx: 765, ty: 3.4, tz: 1778, fov: 60 }, { name: 'luc-approach', x: 765, y: 2, z: 1912, tx: 765, ty: 3, tz: 1778, fov: 40 },
  { name: 'luc-beach', x: 790, y: 2, z: 1530, tx: 740, ty: 1.5, tz: 1496, fov: 66 }, { name: 'luc-pitch', x: 842, y: 40, z: 1700, tx: 862, ty: 0, tz: 1640, fov: 70 },
  { name: 'luc-rotunda', x: 898, y: 3, z: 1660, tx: 919, ty: 2.5, tz: 1638, fov: 62 }, { name: 'luc-garden-air', x: 1060, y: 150, z: 1830, tx: 1230, ty: 0, tz: 2030, fov: 66 },
  { name: 'luc-lane', x: 1160, y: 1.8, z: 1912, tx: 1180, ty: 1.5, tz: 1960, fov: 66 }, { name: 'luc-plot', x: 1172, y: 6, z: 1944, tx: 1190, ty: 1, tz: 1952, fov: 70 },
  { name: 'luc-colony-gate', x: 1098, y: 4, z: 1922, tx: 1078, ty: 1.5, tz: 1902, fov: 70 }, { name: 'luc-street', road: [960, 1972], ahead: 60 },
  { name: 'luc-view', x: 1268, y: 3, z: 1840, tx: 1300, ty: 8, tz: 1846, fov: 66 }, { name: 'luc-ring', road: [1456, 1972], ahead: 50 },
  { name: 'luc-landing', x: 1312, y: 5, z: 2290, tx: 1312, ty: 0, tz: 2316, fov: 70 }, { name: 'luc-monument-night', x: 776, y: 2.2, z: 1768, tx: 765, ty: 3.4, tz: 1778, fov: 60, clock: 22.5 }
];
const ZAK_VIEWS = [
  { name: 'zak-air', x: 1520, y: 130, z: 1120, tx: 1180, ty: 0, tz: 1420, fov: 62 }, { name: 'zak-ltv-river', x: 1480, y: 3, z: 1180, tx: 1150, ty: 20, tz: 1330, fov: 55 },
  { name: 'zak-ltv-front', x: 1265, y: 2.4, z: 1325, tx: 1200, ty: 20, tz: 1350, fov: 64 }, { name: 'zak-ltv-court', x: 1250, y: 2.2, z: 1340, tx: 1185, ty: 6, tz: 1335, fov: 62 },
  { name: 'zak-embankment', road: [1080, 1225], ahead: 60 }, { name: 'zak-tv-air', x: 1700, y: 90, z: 1760, tx: 1887, ty: 10, tz: 1971, fov: 62 },
  { name: 'zak-tv-alley', x: 1812, y: 2, z: 1898, tx: 1887, ty: 25, tz: 1971, fov: 66 }, { name: 'zak-tv-ring', x: 1846, y: 2, z: 1946, tx: 1880, ty: 3, tz: 1932, fov: 66 },
  { name: 'zak-promenade', x: 1690, y: 2, z: 1695, tx: 1760, ty: 2, tz: 1762, fov: 62 }, { name: 'zak-terrace', x: 2050, y: 3, z: 2030, tx: 2095, ty: 1, tz: 2085, fov: 62 },
  { name: 'zak-ltv-night', x: 1265, y: 2.4, z: 1325, tx: 1200, ty: 20, tz: 1350, fov: 64, clock: 22.5 }, { name: 'zak-tv-night', x: 1760, y: 30, z: 1830, tx: 1887, ty: 20, tz: 1971, fov: 64, clock: 22.5 }
];
const MARKET_VIEWS = [
  { name: 'mkt-air', x: 962.2, y: 120, z: 765.2, tx: 1019.4, ty: 0, tz: 480.9, fov: 60 }, { name: 'mkt-front', x: 1080.1, y: 4, z: 584.9, tx: 1067.2, ty: 9, tz: 523.1, fov: 66 },
  { name: 'mkt-promenade', x: 1018.1, y: 2.2, z: 569.7, tx: 1109.8, ty: 3, tz: 505.4, fov: 70 }, { name: 'mkt-gate', x: 888.7, y: 2, z: 538.3, tx: 937.8, ty: 5, tz: 503.9, fov: 66 },
  { name: 'mkt-hall', x: 978.7, y: 1.7, z: 475.2, tx: 1052.5, ty: 4, tz: 423.5, fov: 70 }, { name: 'mkt-cross', x: 1000.5, y: 2, z: 457.5, tx: 1027.2, ty: 1.5, tz: 460.7, fov: 70 },
  { name: 'mkt-door', x: 1022.6, y: 1.6, z: 454.2, tx: 1029.2, ty: 2.5, tz: 463.6, fov: 62 }, { name: 'mkt-north', x: 1095, y: 2, z: 393.7, tx: 1052.5, ty: 7, tz: 423.5, fov: 66 },
  { name: 'mkt-alley', x: 981.7, y: 1.8, z: 496.9, tx: 1063.6, ty: 4, tz: 439.5, fov: 66 }, { name: 'mkt-yard', x: 1011.1, y: 5, z: 364.6, tx: 998.9, ty: 4, tz: 434.2, fov: 66 },
  { name: 'mkt-bus', x: 895.5, y: 3, z: 474.9, tx: 939.7, ty: 3, tz: 443.9, fov: 70 }, { name: 'mkt-kiosks', x: 938.3, y: 2, z: 476.7, tx: 957.6, ty: 1.5, tz: 472.9, fov: 66 },
  { name: 'mkt-shed', x: 981.2, y: 1.8, z: 546.7, tx: 994.2, ty: 1.6, tz: 554.7, fov: 70 }, { name: 'mkt-flowers', x: 1093.1, y: 2.2, z: 404.8, tx: 1137.3, ty: 1, tz: 447.1, fov: 66 },
  { name: 'mkt-cafe', x: 1082.5, y: 2.4, z: 546.6, tx: 1097.5, ty: 1, tz: 547, fov: 70 }, { name: 'mkt-stores', x: 901.4, y: 3, z: 539.1, tx: 953.1, ty: 5, tz: 612.8, fov: 66 },
  { name: 'mkt-night', x: 1080.1, y: 4, z: 584.9, tx: 1067.2, ty: 9, tz: 523.1, fov: 66, clock: 22.5 }, { name: 'mkt-hall-night', x: 978.7, y: 1.7, z: 475.2, tx: 1052.5, ty: 4, tz: 423.5, fov: 70, clock: 22.5 },
  { name: 'mkt-bus-night', x: 895.5, y: 3, z: 474.9, tx: 939.7, ty: 3, tz: 443.9, fov: 70, clock: 22.5 }
];
const BIS_VIEWS = [
  { name: 'bis-air', x: 1700, y: 170, z: 2330, tx: 1500, ty: 0, tz: 2520, fov: 66 }, { name: 'bis-air-east', x: 2080, y: 150, z: 2380, tx: 1860, ty: 0, tz: 2520, fov: 66 },
  { name: 'bis-avenue', road: [900, 2380], ahead: 80 }, { name: 'bis-crossing', x: 1020, y: 3, z: 2452, tx: 1085, ty: 22, tz: 2385, fov: 66 },
  { name: 'bis-junction', x: 1178, y: 4, z: 2522, tx: 1236, ty: 3, tz: 2548, fov: 66 }, { name: 'bis-tram-street', road: [1400, 2476], ahead: 80 },
  { name: 'bis-terminus', x: 1838, y: 2.6, z: 2399, tx: 1862, ty: 2.4, tz: 2428, fov: 66 }, { name: 'bis-loop', x: 1896, y: 24, z: 2478, tx: 1862, ty: 0, tz: 2438, fov: 66 },
  { name: 'bis-gate', x: 1790.5, y: 2, z: 2410, tx: 1792, ty: 4, tz: 2560, fov: 50 }, { name: 'bis-alley', x: 1791.5, y: 1.8, z: 2490, tx: 1792, ty: 4.5, tz: 2580, fov: 60 },
  { name: 'bis-manor', x: 1808, y: 2.2, z: 2549, tx: 1790, ty: 5, tz: 2584, fov: 66 }, { name: 'bis-manor-front', x: 1792, y: 2.2, z: 2546, tx: 1792, ty: 5.2, tz: 2587, fov: 66 },
  { name: 'bis-manor-rear', x: 1806, y: 2.5, z: 2638, tx: 1790, ty: 4.5, tz: 2594, fov: 66 }, { name: 'bis-pond', x: 1862, y: 3, z: 2562, tx: 1795, ty: 5, tz: 2584, fov: 60 },
  { name: 'bis-forest', road: [1620, 2570], ahead: 60 }, { name: 'bis-jump', x: 1436, y: 2.4, z: 2441, tx: 1500, ty: 2, tz: 2431, fov: 62 },
  { name: 'bis-riverside', x: 1566, y: 2.4, z: 2430, tx: 1602, ty: 3, tz: 2403, fov: 62 }, { name: 'bis-dairy', x: 1986.6, y: 2.2, z: 2556.2, tx: 2020.7, ty: 9, tz: 2523.1, fov: 66 },
  { name: 'bis-dairy-gate', x: 1996, y: 2.4, z: 2550, tx: 2022, ty: 3, tz: 2522, fov: 66 }, { name: 'bis-chimney', x: 1230, y: 5, z: 2452, tx: 2030, ty: 60, tz: 2487, fov: 30 },
  { name: 'bis-csdd', x: 921, y: 5, z: 2487, tx: 985, ty: 1.5, tz: 2493, fov: 66 }, { name: 'bis-csdd-air', x: 962, y: 46, z: 2548, tx: 990, ty: 0, tz: 2484, fov: 66 },
  { name: 'bis-khrush', road: [1100, 2667], ahead: 70 }, { name: 'bis-wood', road: [1880, 2545], ahead: 60 },
  { name: 'bis-board', x: 1146, y: 2.2, z: 2513, tx: 1157, ty: 3.6, tz: 2529, fov: 60 }, { name: 'bis-edge', x: 1262, y: 2.4, z: 2642, tx: 1289, ty: 1.2, tz: 2692, fov: 62 },
  { name: 'bis-race-evening', x: 1791, y: 1.8, z: 2470, tx: 1792, ty: 5, tz: 2587, fov: 58, clock: 17.8 }, { name: 'bis-terminus-night', x: 1838, y: 2.6, z: 2399, tx: 1862, ty: 2.4, tz: 2428, fov: 66, clock: 22.5 },
  { name: 'bis-manor-night', x: 1792, y: 2.2, z: 2546, tx: 1792, ty: 5.2, tz: 2587, fov: 66, clock: 22.5 }, { name: 'bis-street-night', road: [1400, 2476], ahead: 80, clock: 22.5 }
];
const FLORA_VIEWS = [
  { name: 'flora-mezaparks', road: [700, -1800], ahead: 70 }, { name: 'flora-bikernieki', road: [3000, -1500], ahead: 70 },
  { name: 'flora-jurmala', road: [-2800, -1800], ahead: 70 }, { name: 'flora-park', x: 470, y: 2, z: -760, tx: 560, ty: 4, tz: -800, fov: 62 },
  { name: 'flora-soviet', road: [2900, 150], ahead: 90 }, { name: 'flora-forest-air', x: 3000, y: 30, z: -1300, tx: 3150, ty: 5, tz: -1600, fov: 60 },
  { name: 'flora-mezaparks-air', x: 700, y: 90, z: -1450, tx: 760, ty: 0, tz: -1800, fov: 60 },
  { name: 'flora-park-sunset', x: 470, y: 2, z: -760, tx: 560, ty: 8, tz: -800, fov: 62, clock: 18.6 },
  { name: 'flora-park-storm', x: 470, y: 2, z: -760, tx: 560, ty: 4, tz: -800, fov: 62, weather: 'storm', clock: 13 },
  { name: 'flora-forest-fog', road: [3000, -1500], ahead: 70, weather: 'fog', clock: 8 }, { name: 'flora-soviet-night', road: [2900, 150], ahead: 90, clock: 22.5 }
];
const FLORA_SPOTS = [
  { name: 'pine', tree: 'pine' }, { name: 'spruce', tree: 'spruce' }, { name: 'birch', tree: 'birch' }, { name: 'linden', tree: 'linden' },
  { name: 'oak', tree: 'oak' }, { name: 'apple', tree: 'apple' }, { name: 'maple', tree: 'maple' }, { name: 'chestnut', tree: 'chestnut', pick: 0.61 },
  { name: 'poplar', tree: 'poplar', ty: 0.4 }, { name: 'willow', tree: 'willow' },
  { name: 'hazel', bush: 'hazel', d: 7 }, { name: 'lilac', bush: 'lilac', d: 7 }, { name: 'jasmine', bush: 'jasmine', d: 7 }, { name: 'juniper', bush: 'juniper', d: 6 },
  { name: 'willow-shrub', bush: 'willow', d: 7 }, { name: 'rose', bush: 'rose', d: 5 }, { name: 'fir', bush: 'fir', d: 6 }, { name: 'sapling', bush: 'sapling', d: 7 },
  { name: 'anthill', bush: 'ant', d: 4, h: 1.2, ty: 0.3 }, { name: 'hedge', type: 'hedge', d: 22, h: 7, ty: 0.3, pick: 0.61, gap: 4 },
  { name: 'boulder', type: 'rock', kind: 'boulder', d: 6, h: 1.4, ty: 0.3 }, { name: 'log', type: 'log', d: 6, h: 1.4, ty: 0.2 }, { name: 'stump', type: 'stump', d: 4, h: 1.2, ty: 0.3 },
  { name: 'pile', type: 'pile', d: 8, h: 1.6, ty: 0.4 }, { name: 'bale', prop: 'bale', d: 9, h: 1.6, ty: 0.4, gap: 3 }
];
const DETAILS = [['uaz469', 3.93], ['gaz21', 3.6], ['e30', 3.7], ['f355', 0.6], ['raf2203', 3.9], ['m5e39', 0.9], ['diablo', 3.75]];
const FACES = ['vaz2105', 'e30', 'sierra', 'r34', 'charger', 'viper', 'f355', 'mclarenf1', 'gaz21', 'p356', 'm300sl', 'uaz469'];
const VIEWS = { front: 3.93, rear: 0.785, side: 0 };
const SHOWROOM = ['vaz2105', 'uaz469', 'e30', 'r34', 'f355', 'charger'];
const COCKPITS = ['vaz2105', 'e30', 'r34', 'charger', 'f355', 'mclarenf1', 'gaz21'];
const WHEELS = ['vaz2105', 'gaz21', 'golf2', 'audi80', 'r34', 'f355', 'g500', 'impreza22b'];
const FLEET = COCKPITS.concat(['diablo', 'uaz469']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const PAGE = `(() => {
  cancelAnimationFrame(fzui.raf);
  const F = Forza;
  const realNow = performance.now.bind(performance);
  const t0 = 100000;
  let seed = 7, clock = 0;
  Math.random = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  performance.now = () => t0 + clock;
  const showroomOf = (id, angle, dist) => {
    const c = F.Cars.get(id);
    fzui.showroom = { id, c1: c.col, c2: c.col2 || c.col, livery: c.livery || 'none', wing: F.Cars.spec(id, {}).wing, cx: 0.5, dist };
    fzui.showT = angle / 0.35;
  };
  const tris = b => b.parts.reduce((a, p) => a + p.ni / 3, 0) + b.ni / 3;
  window.fzShots = {
    async pump(n, dt = 1 / 60) {
      for (let i = 0; i < n; i++) {
        clock += dt * 1000;
        fzui.update(dt);
        if (i % 4 === 3) fzui.render(dt);
        if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));
      }
      return true;
    },
    frame() {
      fzui.hud.banners = []; fzui.hud.toasts = []; fzui.hud.big = null; fzui.locT = 0;
      fzui.render(0);
      const v = fzui.view, cv = document.createElement('canvas');
      cv.width = v.width; cv.height = v.height;
      const x = cv.getContext('2d');
      x.drawImage(v, 0, 0);
      x.drawImage(fzui.hudCv, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/png');
    },
    showroom(id, angle, dist = 1.9) {
      fzui.menus.closeAll();
      showroomOf(id, angle, dist);
      const url = this.frame();
      fzui.showroom = null;
      return url;
    },
    spinning(id, angle, dist) {
      const r = fzui.renderer, draw = r.drawCar;
      r.drawCar = function (car, env, minLod) { return draw.call(this, Object.assign({}, car, { speed: 25 }), env, minLod); };
      try { return this.showroom(id, angle, dist); } finally { r.drawCar = draw; }
    },
    lit(id, angle, dist, popup) {
      const r = fzui.renderer, draw = r.drawCar;
      r.drawCar = function (car, env, minLod) { return draw.call(this, Object.assign({}, car, { lights: 1, popup }), env, minLod); };
      try { return this.showroom(id, angle, dist); } finally { r.drawCar = draw; }
    },
    faces(ids) {
      const cv = document.createElement('canvas');
      cv.width = 1024; cv.height = Math.ceil(ids.length / 2) * 256;
      const x = cv.getContext('2d');
      ids.forEach((id, i) => {
        const car = F.Cars.get(id), sp = F.Cars.spec(id, {}), lay = F.Cluster.layoutOf(car, sp), pal = F.Cluster.paletteOf(car);
        const ox = (i % 2) * 512, oy = Math.floor(i / 2) * 256;
        x.drawImage(F.Cluster.face(car, sp, 'kmh').cv, ox, oy);
        const lcd = F.Tex.canvas(256, 96);
        F.Cluster.lcd(lcd, pal, lay, { odo: 12345.6, clock: '14:35', gear: '3', speed: '128', radio: 'PULSE RĪGA', lamps: lay.lamps.map((l, k) => k % 2 === 0) });
        for (const l of lay.lcd) { const r = F.Cluster.SLOTS[l.k]; x.drawImage(lcd, r[0], r[1], r[2], r[3], ox + l.x - l.w / 2, oy + l.y - l.h / 2, l.w, l.h); }
        lay.lamps.forEach((l, k) => { const r = F.Cluster.LAMP_CELL(k); x.drawImage(lcd, r[0], r[1], r[2], r[3], ox + l.x - 9, oy + l.y - 9, 18, 18); });
        x.fillStyle = '#ff00ff'; x.font = 'bold 12px Arial'; x.fillText(id, ox + 4, oy + 12);
      });
      return cv.toDataURL('image/png');
    },
    sheet(angle) {
      const cars = F.Cars.CARS, cols = 4, cw = 320, ch = 160;
      const cv = document.createElement('canvas');
      cv.width = cols * cw; cv.height = Math.ceil(cars.length / cols) * ch;
      const x = cv.getContext('2d');
      fzui.menus.closeAll();
      cars.forEach((c, i) => {
        showroomOf(c.id, angle, 1.35);
        fzui.render(0);
        const v = fzui.view, sw = v.width * 0.8, sh = sw / 2;
        const dx = (i % cols) * cw, dy = Math.floor(i / cols) * ch;
        x.drawImage(v, (v.width - sw) / 2, (v.height - sh) / 2, sw, sh, dx, dy, cw, ch);
        x.fillStyle = '#ffffff'; x.font = 'bold 12px Arial';
        x.fillText(c.id, dx + 6, dy + 15);
      });
      fzui.showroom = null;
      return cv.toDataURL('image/png');
    },
    liveries(id, angle, c1, c2) {
      const list = F.Tex.LIVERIES, cols = 4, cw = 320, ch = 180;
      const cv = document.createElement('canvas');
      cv.width = cols * cw; cv.height = Math.ceil(list.length / cols) * ch;
      const x = cv.getContext('2d');
      fzui.menus.closeAll();
      list.forEach((lv, i) => {
        showroomOf(id, angle, 1.2);
        Object.assign(fzui.showroom, { c1, c2, livery: lv });
        fzui.render(0);
        const v = fzui.view, sw = v.width * 0.72, sh = sw * ch / cw;
        const dx = (i % cols) * cw, dy = Math.floor(i / cols) * ch;
        x.drawImage(v, (v.width - sw) / 2, (v.height - sh) / 2, sw, sh, dx, dy, cw, ch);
        x.fillStyle = '#ffffff'; x.font = 'bold 12px Arial';
        x.fillText(id + ' / ' + lv, dx + 6, dy + 15);
      });
      fzui.showroom = null;
      return cv.toDataURL('image/png');
    },
    finish(id, angle) {
      const r = fzui.renderer, draw = r.drawCar, cw = 420, ch = 240;
      const cv = document.createElement('canvas');
      cv.width = cw * 3; cv.height = ch;
      const x = cv.getContext('2d');
      fzui.menus.closeAll();
      [['gloss', {}], ['metal', { metal: true }], ['dirt', { dirt: 0.85 }]].forEach(([name, o], i) => {
        r.drawCar = function (car, env, minLod) { return draw.call(this, Object.assign({}, car, o), env, minLod); };
        try {
          showroomOf(id, angle, 1.05);
          fzui.render(0);
        } finally { r.drawCar = draw; }
        const v = fzui.view, sw = v.width * 0.62, sh = sw * ch / cw;
        x.drawImage(v, (v.width - sw) / 2, (v.height - sh) / 2, sw, sh, i * cw, 0, cw, ch);
        x.fillStyle = '#ffffff'; x.font = 'bold 13px Arial';
        x.fillText(id + ' / ' + name, i * cw + 6, 16);
      });
      fzui.showroom = null;
      return cv.toDataURL('image/png');
    },
    paintShop() {
      const g = fzui.game;
      fzui.menus.closeAll();
      fzui.menus.push(fzui.menus.paint(g.entry.uid));
      fzui.render(0);
      return true;
    },
    start(ids) {
      const p = F.Profile.newProfile('shots');
      Object.assign(p.settings, { gfx: 'ultra', traffic: 0, mirror: true, cam: 'chase', res: 0, dither: false });
      p.clock = 15.5; p.weather = 'clear';
      ids.forEach((id, i) => { const c = F.Cars.get(id); p.cars.push({ uid: 900 + i, id, up: {}, c1: c.col, c2: c.col2 || c.col, livery: c.livery || 'none', odo: 0 }); });
      fzui.startGame(p, false);
      this.ids = ids;
      return true;
    },
    car(id, o) {
      const g = fzui.game, h = F.MAP.HUB;
      g.setCar(900 + this.ids.indexOf(id));
      g.clock = o.clock || 15.5;
      const az = (g.clock / 24) * Math.PI * 2 + 0.8;
      g.veh.place(h.x, h.z, o.sun === undefined ? h.yaw : Math.atan2(Math.cos(az), -Math.sin(az)) + o.sun, fzui.world);
      g.setWeather(o.weather || 'clear', true);
      g.lightsOn = !!o.lights;
      const r = fzui.renderer;
      g.settings.gfx = o.gfx || 'ultra';
      r.setGfx(g.settings.gfx);
      r.cabinShadow = o.noCabin ? function () { this.cabinOn = false; } : Object.getPrototypeOf(r).cabinShadow;
      fzui.camMode = o.cam || 'chase';
      fzui.keys = Object.assign(o.back ? { back: true } : o.drive ? { up: true } : {}, o.rev ? { down: true } : {});
      fzui.camPos = null;
      fzui.particles = [];
      return g.veh.spec.id;
    },
    async look(o) {
      const g = fzui.game, w = fzui.world;
      let { x, y, z, tx, ty, tz } = o;
      if (o.road) {
        const nr = w.nearestRoad(o.road[0], o.road[1], 300);
        x = nr.x + nr.rx * nr.e.hw * 0.45; z = nr.z + nr.rz * nr.e.hw * 0.45; y = nr.y + 1.5;
        tx = x + nr.tx * o.ahead; tz = z + nr.tz * o.ahead; ty = y + 2;
      } else if (o.ad) {
        const s = w.ads.filter(a => a.kind === o.ad && (!o.theme || a.theme === o.theme))[o.i || 0];
        if (!s) return null;
        const fx = Math.sin(s.yaw), fz = -Math.cos(s.yaw), rx = Math.cos(s.yaw), rz = Math.sin(s.yaw);
        x = s.x + fx * o.d + rx * (o.side || 0); z = s.z + fz * o.d + rz * (o.side || 0); y = 0;
        tx = s.x; tz = s.z; ty = s.y + (o.ty || 4);
      } else if (o.mural !== undefined) {
        const m = fzui.scene.murals[o.mural], nr = w.nearestRoad(m.x, m.z, 200);
        x = nr.x; z = nr.z; y = 0; tx = m.x; tz = m.z; ty = m.y;
      }
      y = Math.max(y, w.groundY(x, z) + 1.5);
      g.clock = o.clock || 14.5;
      g.setWeather(o.weather || 'clear', true);
      if (o.sun) {
        const env = F.skyEnv(g.clock, g.weather, 900);
        tx = x + env.sunDir[0] * 100; ty = y + env.sunDir[1] * 100; tz = z + env.sunDir[2] * 100;
      }
      const nr = w.nearestRoad(x - (tx - x) * 0.3, z - (tz - z) * 0.3, 400);
      if (nr) g.veh.place(nr.x, nr.z, 0, w);
      fzui.camMode = 'chase';
      fzui.keys = {};
      fzui.bolts = [];
      fzui.camera = () => ({ x, y, z, tx, ty, tz, fov: o.fov || 60, near: 0.4, far: 4000 });
      try {
        await this.pump(o.frames || 160);
        if (o.strike) { g.strike(true); fzui.handleEvents(g.drain()); await this.pump(3); }
        return this.frame();
      } finally { delete fzui.camera; }
    },
    async view(o) {
      const g = fzui.game, w = fzui.world;
      let { x, y, z, tx, ty, tz } = o;
      if (o.lm) {
        const lm = fzui.scene.landmarks.find(l => l.type === o.lm);
        if (!lm) return null;
        const yaw = (lm.src ? lm.src.yaw || 0 : 0) + (o.turn || 0);
        x = lm.x + Math.sin(yaw) * o.d; z = lm.z - Math.cos(yaw) * o.d;
        y = Math.max(w.groundY(x, z), F.WATER_Y) + (o.h || 1.8);
        tx = lm.x; tz = lm.z; ty = lm.y + o.ty;
      } else if (o.road) {
        const nr = w.nearestRoad(o.road[0], o.road[1], 300);
        if (!nr) return null;
        const side = nr.e.hw * 0.45;
        x = nr.x + nr.rx * side; z = nr.z + nr.rz * side; y = nr.y + 1.5;
        tx = x + nr.tx * o.ahead; tz = z + nr.tz * o.ahead; ty = y + 2;
      }
      g.clock = o.clock || 14.5;
      g.setWeather('clear', true);
      const nr = w.nearestRoad(x - (tx - x) * 0.3, z - (tz - z) * 0.3, 400);
      if (nr) g.veh.place(nr.x, nr.z, 0, w);
      fzui.camMode = 'chase';
      fzui.keys = {};
      fzui.camera = () => ({ x, y, z, tx, ty, tz, fov: o.fov || 60, near: 0.4, far: 4000 });
      try {
        await this.pump(o.frames || 160);
        return this.frame();
      } finally { delete fzui.camera; }
    },
    floraSpot(spec) {
      const w = fzui.world, F = Forza;
      const lonely = (x, z, r) => !w.trees.some(t => Math.abs(t.x - x) < r && Math.abs(t.z - z) < r && Math.hypot(t.x - x, t.z - z) < r && (t.x !== x || t.z !== z));
      let list;
      if (spec.tree) list = w.trees.filter(t => t.kind === spec.tree && !t.street);
      else if (spec.bush) list = w.flora.filter(f => f.type === 'bush' && f.kind === spec.bush);
      else if (spec.type) list = w.flora.filter(f => f.type === spec.type && (!spec.kind || f.kind === spec.kind));
      else list = w.props.filter(p => p.type === spec.prop);
      list = list.filter(o => lonely(o.x, o.z, spec.gap || 7));
      if (!list.length) return null;
      const o = list[Math.floor(list.length * (spec.pick || 0.37))];
      const H = spec.tree ? F.Trees.inst(o.x, o.z, o.s, F.TREE[o.kind]).H : (o.h || 1.5), D = spec.d || Math.max(4, H * 1.6);
      let best = null;
      for (let a = 0; a < 16; a++) {
        const ang = a / 16 * Math.PI * 2, x = o.x + Math.cos(ang) * D, z = o.z + Math.sin(ang) * D, oi = w.oi(x, z);
        let score = oi < 0 || w.occ[oi] === 3 || w.occ[oi] === 2 ? -20 : 0;
        for (let k = 1; k < 10; k++) if (!lonely(o.x + (x - o.x) * k / 10, o.z + (z - o.z) * k / 10, 2.2)) score -= 1;
        if (!best || score > best.s) best = { s: score, x, z };
      }
      return { x: best.x, y: w.groundY(best.x, best.z) + (spec.h || 1.7), z: best.z, tx: o.x, ty: o.y + H * (spec.ty || 0.45), tz: o.z, fov: 55, frames: 60 };
    },
    async bushRun() {
      const w = fzui.world, g = fzui.game;
      const cand = w.flora.filter(f => f.type === 'bush' && (f.kind === 'hazel' || f.kind === 'lilac') && f.w > 2.8 && !w.props.some(p => Math.abs(p.x - f.x) < 30 && Math.abs(p.z - f.z) < 30)).map(f => ({ f, nr: w.nearestRoad(f.x, f.z, 30) })).filter(q => q.nr && q.nr.d > 6 && q.nr.d < 14 && !w.trees.some(t => Math.hypot(t.x - (q.f.x + q.nr.x) / 2, t.z - (q.f.z + q.nr.z) / 2) < 3));
      const { f, nr } = cand[Math.floor(cand.length / 3)], dx = f.x - nr.x, dz = f.z - nr.z, L = Math.hypot(dx, dz), yaw = Math.atan2(dx / L, -dz / L);
      g.clock = 14.5;
      g.veh.place(f.x - dx / L * 22, f.z - dz / L * 22, yaw, w);
      g.veh.vx = Math.sin(yaw) * 17; g.veh.vz = -Math.cos(yaw) * 17;
      for (const wl of g.veh.wheels) wl.w = 17 / 0.3;
      fzui.keys = { up: true }; fzui.camMode = 'chase'; fzui.camPos = null; fzui.particles = [];
      for (let i = 0; i < 60 && !fzui.particles.some(p => p.leaf); i++) await this.pump(2);
      await this.pump(6);
      fzui.keys = {};
      return this.frame();
    },
    meshes() {
      const rows = F.Cars.CARS.map(c => { const g = F.Models.carGeo(c.id); return [tris(g.lods[0]), tris(g.lods[1]), tris(g.lods[2]), tris(F.Models.buildWheel(c, { kind: 'sharp' })), tris(g.cockpit.batch), tris(g.cockpit.wheel)]; });
      const col = k => rows.map(r => r[k]);
      const body = col(0);
      return { bodyMin: Math.min(...body), bodyAvg: Math.round(body.reduce((a, b) => a + b, 0) / body.length), bodyMax: Math.max(...body), lod1Max: Math.max(...col(1)), lod2Max: Math.max(...col(2)), wheelMax: Math.max(...col(3)), cockpit: rows[0][4], steeringWheel: rows[0][5] };
    },
    skins() {
      const r = fzui.renderer, gl = r.gl, ms = [];
      for (const c of F.Cars.CARS) {
        const m = r.carMesh(c.id);
        for (const lv of ['none', 'rally']) {
          const key = c.id + '|' + lv, old = r.skins.get(key);
          if (old) { gl.deleteTexture(old.tex); if (old.mask) gl.deleteTexture(old.mask); r.skins.delete(key); }
          const t1 = realNow();
          r.carSkin(c.id, lv, m.geo.skin);
          gl.finish();
          ms.push(realNow() - t1);
        }
      }
      const traffic = F.Traffic.MODELS.reduce((a, id) => a + r.carSkin(id, 'none', r.carMesh(id).geo.skin).bytes, 0);
      const firstMs = +ms.shift().toFixed(2);
      return { firstMs, avgMs: +(ms.reduce((a, v) => a + v, 0) / ms.length).toFixed(2), maxMs: +Math.max(...ms).toFixed(2), trafficMB: +(traffic / 1048576).toFixed(1) };
    },
    async breakdown(kind, gfx) {
      const r = fzui.renderer, gl = r.gl, g = fzui.game, acc = {};
      g.settings.gfx = gfx;
      r.setGfx(gfx);
      await this.stats(kind === 'cockpit' ? 'traffic' : kind);
      if (kind === 'cockpit') { fzui.camMode = 'cockpit'; await this.pump(20); }
      const wrap = (obj, names, tag) => names.filter(n => typeof obj[n] === 'function').map(n => {
        const fn = obj[n];
        obj[n] = function (...args) { const a = realNow(); try { return fn.apply(this, args); } finally { acc[tag + n] = (acc[tag + n] || 0) + realNow() - a; } };
        return () => { obj[n] = fn; };
      });
      const undo = wrap(r, ['shadowPass', 'cabinShadow', 'beginFrame', 'drawSky', 'setWorldUniforms', 'envCube', 'drawWorld', 'drawCar', 'flushGlass', 'flushSprites', 'drawCockpit', 'endFrame'], 'r.')
        .concat(wrap(fzui, ['drawDynamic', 'spritesFor', 'updateCluster', 'renderMirror', 'carState', 'localLights', 'drawDisplayCars', 'drawHorizon'], 'ui.'))
        .concat(wrap(fzui.hud, ['draw'], 'hud.'));
      const N = 60, a = realNow();
      for (let i = 0; i < N; i++) { fzui.render(1 / 60); gl.finish(); }
      const total = (realNow() - a) / N;
      undo.forEach(f => f());
      const out = { kind, gfx, total: +total.toFixed(3) };
      for (const k of Object.keys(acc).sort((x, y) => acc[y] - acc[x])) out[k] = +(acc[k] / N).toFixed(3);
      return out;
    },
    async perf(kind, gfx) {
      const r = fzui.renderer, gl = r.gl, g = fzui.game;
      g.settings.gfx = gfx;
      r.setGfx(gfx);
      await this.stats(kind === 'cockpit' ? 'traffic' : kind);
      if (kind === 'cockpit') { fzui.camMode = 'cockpit'; await this.pump(20); }
      const reps = [], cpus = [];
      for (let k = 0; k < 15; k++) {
        let cpu = 0;
        const a = realNow();
        for (let i = 0; i < 20; i++) {
          const c = realNow();
          fzui.render(1 / 60);
          cpu += realNow() - c;
          gl.finish();
        }
        reps.push((realNow() - a) / 20);
        cpus.push(cpu / 20);
      }
      reps.sort((x, y) => x - y);
      cpus.sort((x, y) => x - y);
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return { kind, gfx, ms: +reps[7].toFixed(2), p25: +reps[3].toFixed(2), best: +reps[0].toFixed(2), cpu: +cpus[7].toFixed(2), draws: r.stats.draws, tris: Math.round(r.stats.tris), gpu: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '' };
    },
    wreckAt(id, spot, o = {}) {
      const g = fzui.game, w = fzui.world;
      g.setCar(900 + this.ids.indexOf(id));
      const nr = w.nearestRoad(spot[0], spot[1], 300);
      g.veh.place(nr.x, nr.z, Math.atan2(nr.tx, -nr.tz), w);
      g.clock = o.clock || 15.5;
      g.setWeather('clear', true);
      g.repairCool = 1e9;
      g.lightsOn = !!o.lights;
      fzui.camMode = o.cam || 'chase';
      fzui.keys = {};
      fzui.camPos = null;
      fzui.particles = [];
      g.debugDamage('repair');
      for (const k of o.hits || []) g.debugDamage(k);
      fzui.handleEvents(g.drain());
      const d = g.veh.dmg;
      return F.DMG.PARTS.map((p, i) => d.st[i] ? p + ':' + d.st[i] : '').filter(Boolean).join(' ') + ' · motor ' + Math.round(d.hp * 100) + '%';
    },
    orbit(d, ang, h, ty = 0.6) {
      const v = fzui.game.veh, a = v.yaw + ang;
      const cam = { x: v.x + Math.sin(a) * d, y: v.y + h, z: v.z - Math.cos(a) * d, tx: v.x, ty: v.y + ty, tz: v.z, fov: 50, near: 0.2, far: 3000 };
      fzui.camera = () => cam;
      return true;
    },
    free() { delete fzui.camera; return true; },
    smashSetup(type, spot) {
      const g = fzui.game, w = fzui.world, v = g.veh;
      let best = null, bd = Infinity;
      for (const p of w.props) {
        if (p.type !== type || !p.col_ || p.col_.broken) continue;
        const nr = w.nearestRoad(p.x, p.z, 10);
        if (!nr || nr.d < nr.e.hw + 0.5) continue;
        const d = Math.hypot(p.x - spot[0], p.z - spot[1]);
        if (d < bd) { bd = d; best = { p, nr }; }
      }
      if (!best) return null;
      const { p, nr } = best;
      const ux = nr.tx, uz = nr.tz, nx = (p.x - nr.x) / (nr.d || 1), nz = (p.z - nr.z) / (nr.d || 1);
      const sx = p.x - ux * 22 - nx * 3.2, sz = p.z - uz * 22 - nz * 3.2, dl = Math.hypot(p.x - sx, p.z - sz), dx = (p.x - sx) / dl, dz = (p.z - sz) / dl;
      const yaw = Math.atan2(dx, -dz);
      v.place(sx, sz, yaw, w);
      v.vx = dx * 17; v.vz = dz * 17;
      for (const wl of v.wheels) wl.w = 17 / v.spec.wr;
      this.spot = { x: p.x, y: p.y, z: p.z, nx, nz, ux, uz };
      delete fzui.camera;
      fzui.camMode = 'far';
      fzui.keys = { up: true };
      fzui.camPos = null;
      return [type, Math.round(p.x), Math.round(p.z)];
    },
    spotCam() {
      const s = this.spot;
      const cam = { x: s.x - s.nx * 11 - s.ux * 3, y: s.y + 3.2, z: s.z - s.nz * 11 - s.uz * 3, tx: s.x + s.ux * 6, ty: s.y + 0.6, tz: s.z + s.uz * 6, fov: 62, near: 0.3, far: 3000 };
      fzui.camera = () => cam;
      return true;
    },
    parkedSetup(spot) {
      const g = fzui.game, w = fzui.world, v = g.veh;
      let best = null, bd = Infinity;
      for (const p of w.parked) {
        if (p.lot === 'fest') continue;
        const d = Math.hypot(p.x - spot[0], p.z - spot[1]);
        if (d < bd) { bd = d; best = p; }
      }
      const fx = Math.sin(best.yaw), fz = -Math.cos(best.yaw), rx = -fz, rz = fx;
      v.place(best.x - fx * 11, best.z - fz * 11, best.yaw, w);
      v.vx = fx * 14; v.vz = fz * 14;
      for (const wl of v.wheels) wl.w = 14 / v.spec.wr;
      this.spot = { x: best.x, y: best.y, z: best.z, nx: -rx, nz: -rz, ux: -fx, uz: -fz };
      delete fzui.camera;
      fzui.camMode = 'far';
      fzui.keys = { up: true };
      fzui.camPos = null;
      return best.id;
    },
    async stats(kind) {
      const g = fzui.game, r = fzui.renderer;
      if (kind === 'race') {
        g.setCar(1);
        fzui.beginEvent('vecriga');
      } else {
        if (g.race) fzui.quitEvent();
        g.settings.traffic = 1;
        g.traffic.density = 1;
        for (let k = 0; k < 600 && g.traffic.cars.length < g.traffic.max; k++) g.traffic.spawn(g.veh.x, g.veh.z, 25, 320);
      }
      fzui.camMode = 'chase'; fzui.camPos = null; fzui.keys = {};
      await this.pump(160);
      fzui.render(1 / 60);
      const s = { draws: r.stats.draws, tris: Math.round(r.stats.tris), chunks: r.stats.chunks };
      const a = realNow();
      for (let i = 0; i < 10; i++) fzui.render(1 / 60);
      s.cpuSubmitMs = +((realNow() - a) / 10).toFixed(1);
      s.rivals = g.race ? g.race.rivals.length : 0;
      s.traffic = g.traffic.cars.length;
      s.trafficNear = g.traffic.cars.filter(t => Math.hypot(t.x - g.veh.x, t.z - g.veh.z) <= 600).length;
      return s;
    }
  };
  return true;
})()`;

async function open() {
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fz-edge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--window-size=1280,800', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws = null, target = null;
  const close = async () => {
    try {
      const info = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(info.webSocketDebuggerUrl);
      await new Promise(resolve => {
        bws.onopen = () => bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        bws.onclose = resolve;
        bws.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    } catch {}
    try { if (ws) ws.close(); } catch {}
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    server.kill();
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }, 500);
  };
  try {
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch {}
    }
    if (!target) throw new Error('Edge did not start');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  } catch (e) {
    await close();
    throw e;
  }
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const load = async () => {
    for (let i = 0; i < 60; i++) {
      try { if ((await (await fetch(`http://127.0.0.1:${sport}/forza.html`)).status) === 200) break; } catch {}
      await sleep(250);
    }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/forza.html` });
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      try { if (await ev('typeof fzui === "object"')) break; } catch {}
    }
    for (let i = 0; i < 400; i++) {
      const mode = await ev(`(async () => { for (let k = 0; k < 20 && fzui.mode === 'loading' && !fzui.glError; k++) { fzui.update(0.05); await new Promise(r => setTimeout(r, 0)); } return fzui.mode; })()`);
      if (mode !== 'loading') break;
    }
    const gl = await ev('fzui.glError || ""');
    if (gl) throw new Error('WebGL: ' + gl);
    if (await ev('fzui.mode') !== 'title') throw new Error('the game did not finish loading');
    await ev(PAGE);
  };
  const capture = async () => 'data:image/png;base64,' + (await send('Page.captureScreenshot', { format: 'png' })).data;
  return { ev, load, close, errors, capture };
}

async function main() {
  const out = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'forza-shots'));
  const scenes = (process.argv[3] || SCENES.join(',')).split(',');
  for (const s of scenes) if (!SCENES.includes(s)) throw new Error('unknown scene "' + s + '", use: ' + SCENES.join(','));
  fs.mkdirSync(out, { recursive: true });
  const b = await open();
  try {
    await b.load();
    const save = (name, url) => {
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
      console.log(name + '.png');
    };
    const world = async (name, id, o, frames) => {
      await b.ev(`fzShots.car('${id}', ${JSON.stringify(o)})`);
      await b.ev(`fzShots.pump(${frames})`);
      save(name, await b.ev('fzShots.frame()'));
    };
    if (scenes.includes('sheet')) for (const [view, angle] of Object.entries(VIEWS)) save('sheet-' + view, await b.ev(`fzShots.sheet(${angle})`));
    if (scenes.includes('showroom')) for (const id of SHOWROOM) for (const view of ['front', 'rear']) save(`showroom-${id}-${view}`, await b.ev(`fzShots.showroom('${id}', ${VIEWS[view]})`));
    if (scenes.includes('details')) for (const [id, angle] of DETAILS) save('detail-' + id, await b.ev(`fzShots.showroom('${id}', ${angle}, 1.05)`));
    if (scenes.includes('details')) for (const [id, popup] of [['diablo', 1], ['f355', 0.5], ['charger', 1]]) save('detail-lit-' + id, await b.ev(`fzShots.lit('${id}', 3.75, 1.1, ${popup})`));
    if (scenes.includes('liveries')) for (const [id, angle, c1, c2] of [['e30', 3.6, '#1a2f6e', '#e8e6dc'], ['r34', 0.7, '#e8e6dc', '#b7282e'], ['vaz2105', 3.2, '#6f9fc8', '#141416']]) save('liveries-' + id, await b.ev(`fzShots.liveries('${id}', ${angle}, '${c1}', '${c2}')`));
    if (scenes.includes('finish')) for (const [id, angle] of [['e30', 3.7], ['r34', 0.8], ['vaz2105', 3.4]]) save('finish-' + id, await b.ev(`fzShots.finish('${id}', ${angle})`));
    if (scenes.includes('faces')) save('faces', await b.ev(`fzShots.faces(${JSON.stringify(FACES)})`));
    if (scenes.includes('wheels')) {
      for (const id of WHEELS) save('wheel-' + id, await b.ev(`fzShots.showroom('${id}', 3.45, 0.85)`));
      for (const id of ['r34', 'vaz2105']) save('wheel-' + id + '-spinning', await b.ev(`fzShots.spinning('${id}', 3.45, 0.85)`));
    }
    if (scenes.some(s => ['perf', 'breakdown', 'presets', 'liveries', 'cabin', 'cockpit', 'motion', 'night', 'rain', 'time', 'stats', 'city', 'weather', 'ads', 'festival', 'streets', 'airport', 'zakusala', 'lucavsala', 'market', 'bisumuiza', 'debug', 'photo', 'damage', 'flora'].includes(s))) {
      await b.ev(`fzShots.start(${JSON.stringify(FLEET)})`);
      await b.ev('fzShots.pump(120)');
    }
    if (scenes.includes('city')) {
      for (const v of LANDMARK_VIEWS) {
        const url = await b.ev(`fzShots.view(${JSON.stringify(v)})`);
        if (url) save('lm-' + (v.name || v.lm), url);
      }
      save('lm-atlas', await b.ev("Forza.Tex.paint('lmatlas').toDataURL()"));
      for (const v of CITY_VIEWS) {
        const url = await b.ev(`fzShots.view(${JSON.stringify(v)})`);
        if (url) save('city-' + v.name, url);
      }
      await b.ev('fzui.menus.closeAll(), fzui.menus.push(fzui.menus.mapScreen()), fzShots.pump(8)');
      save('city-map', await b.capture());
      await b.ev('fzui.menus.closeAll(), true');
    }
    for (const [scene, list] of [['weather', WEATHER_VIEWS], ['ads', AD_VIEWS], ['festival', FEST_VIEWS], ['streets', STREET_VIEWS], ['airport', AIRPORT_VIEWS], ['zakusala', ZAK_VIEWS], ['lucavsala', LUC_VIEWS], ['market', MARKET_VIEWS], ['bisumuiza', BIS_VIEWS]]) {
      if (!scenes.includes(scene)) continue;
      if (scene === 'ads') save('ad-atlas', await b.ev("Forza.Tex.paint('adatlas').toDataURL()"));
      if (scene === 'market') save('mkt-atlas', await b.ev("Forza.Tex.paint('mkt').toDataURL()"));
      if (scene === 'bisumuiza') save('bis-atlas', await b.ev("Forza.Tex.paint('bis').toDataURL()"));
      if (scene === 'streets') { save('st-atlas', await b.ev("Forza.Tex.paint('street').toDataURL()")); save('st-boards', await b.ev("Forza.Tex.paint('dirboards').toDataURL()")); }
      for (const v of list) {
        const url = await b.ev(`fzShots.look(${JSON.stringify(v)})`);
        if (url) save(v.name, url);
      }
      if (scene === 'festival') {
        await b.ev("(() => { const g = fzui.game, h = Forza.MAP.HUB; g.veh.place(h.x, h.z, h.yaw, fzui.world); g.clock = 15.5; g.setWeather('clear', true); fzui.camMode = 'chase'; fzui.camPos = null; fzui.keys = {}; return true; })()");
        await b.ev('fzShots.pump(150)');
        save('fest-spawn', await b.ev('fzShots.frame()'));
      }
      if (scene === 'bisumuiza') {
        await b.ev('fzui.menus.closeAll(), fzui.menus.push(fzui.menus.mapScreen()), fzShots.pump(8)');
        save('bis-map', await b.capture());
        await b.ev('fzui.menus.closeAll(), true');
      }
      await b.ev("fzui.game.setWeather('clear', true), true");
    }
    if (scenes.includes('flora')) {
      for (const name of ['flora', 'florafar']) save(name + '-atlas', await b.ev(`(() => { const im = Forza.Tex.paint('${name}'), c = document.createElement('canvas'), t = document.createElement('canvas'); c.width = t.width = im.width; c.height = t.height = im.height; t.getContext('2d').putImageData(im, 0, 0); const x = c.getContext('2d'); x.fillStyle = '#7a8a9a'; x.fillRect(0, 0, c.width, c.height); x.drawImage(t, 0, 0); return c.toDataURL('image/png'); })()`));
      await b.ev("fzShots.car('e30', {})");
      for (const v of FLORA_VIEWS) {
        const url = await b.ev(`fzShots.look(${JSON.stringify(v)})`);
        if (url) save(v.name, url);
      }
      for (const spec of FLORA_SPOTS) {
        const v = await b.ev(`fzShots.floraSpot(${JSON.stringify(spec)})`);
        if (v) save('flora-' + spec.name, await b.ev(`fzShots.look(${JSON.stringify(v)})`));
      }
      save('flora-bush-hit', await b.ev('fzShots.bushRun()'));
      await b.ev("fzui.game.setWeather('clear', true), true");
    }
    if (scenes.includes('debug')) {
      await b.ev("fzShots.car('e30', {}), fzui.menus.closeAll(), fzui.toggleDebug(), fzShots.pump(8)");
      save('debug-panel', await b.capture());
      const res = await b.ev("(() => { const g = fzui.game, c0 = g.profile.credits, l0 = g.profile.level, btn = t => [...document.querySelectorAll('.fz-dbg-btn')].find(e => e.textContent === t); btn('+100,000').click(); btn('+1 уровень').click(); btn('Гроза').click(); return [g.profile.credits - c0, g.profile.level - l0, g.weather]; })()");
      await b.ev('fzShots.pump(8)');
      save('debug-storm', await b.capture());
      const tp = await b.ev("(() => { const it = [...document.querySelectorAll('.fz-dbg-item')][1], name = it.textContent; it.click(); return [name, fzui.menus.open, Math.round(fzui.game.veh.x), Math.round(fzui.game.veh.z)]; })()");
      console.log('debug: credits +' + res[0] + ', levels +' + res[1] + ', weather ' + res[2] + '; teleport to ' + tp[0] + ' -> ' + tp[2] + ',' + tp[3] + (tp[1] ? ' (panel still open)' : ''));
      await b.ev("fzui.game.setWeather('clear', true), fzui.menus.closeAll(), true");
    }
    if (scenes.includes('photo')) {
      const key = code => b.ev(`fzui.menus.key({ code: '${code}', preventDefault() {} }), true`);
      await b.ev("fzShots.car('e30', { clock: 17.6 }), fzui.menus.closeAll(), fzShots.pump(60).then(() => { fzui.openPhoto(); return fzShots.pump(12); })");
      save('photo-mode', await b.capture());
      await b.ev("(() => { const ph = fzui.photo; Object.assign(ph.o, { ap: 1.4, aspect: '3:2' }); ph.fl = 85; ph.dist = 12; ph.refreshRows(); return fzShots.pump(12); })()");
      save('photo-dof', await b.capture());
      await b.ev("(() => { const ph = fzui.photo; Object.assign(ph.o, { ap: 0, aspect: '4:3', filter: 'sepia', grain: 30, date: 'on', caption: 'full', logo: 'on', frame: 'instant' }); ph.fl = 28; ph.dist = 8; ph.refreshRows(); return fzShots.pump(8); })()");
      await key('Space');
      const ph = await b.ev("(async () => { const p = fzui.game.profile, last = p.photos[p.photos.length - 1], img = new Image(); img.src = Forza.Photo.readPhoto(last); await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv.getContext('2d').drawImage(img, 0, 0); return { url: cv.toDataURL('image/png'), file: last.file, size: [last.w, last.hgt], hunt: p.photoLm || [] }; })()");
      save('photo-print', ph.url);
      await b.ev('fzShots.pump(30)');
      await key('KeyG');
      await b.ev('fzShots.pump(6)');
      save('photo-album', await b.capture());
      await key('KeyE');
      await b.ev('fzShots.pump(6)');
      save('photo-hunt', await b.capture());
      console.log('photo: ' + ph.file + ' ' + ph.size.join('x') + ', photo hunt ' + (ph.hunt.join(', ') || 'none'));
      await b.ev('fzui.menus.closeAll(), true');
    }
    if (scenes.includes('damage')) {
      const spot = JSON.stringify(WRECK_SPOT);
      const shot = async (name, frames) => { await b.ev(`fzShots.pump(${frames})`); save(name, await b.ev('fzShots.frame()')); };
      for (const id of ['e30', 'vaz2105', 'r34']) {
        console.log('damage ' + id + ': ' + await b.ev(`fzShots.wreckAt('${id}', ${spot}, { hits: ['front', 'left', 'rear', 'front'] })`));
        await b.ev('fzShots.pump(50)');
        for (const [view, ang, d, h] of [['front', -0.7, 5.6, 1.6], ['rear', -2.4, 5.6, 1.6], ['side', -1.57, 5.2, 1.1]]) {
          await b.ev(`fzShots.orbit(${d}, ${ang}, ${h})`);
          await shot(`damage-${id}-${view}`, 4);
        }
        await b.ev('fzShots.free()');
      }
      await b.ev(`fzShots.wreckAt('e30', ${spot}, { cam: 'cockpit', hits: ['front', 'front', 'front'] })`);
      await shot('damage-cockpit-cracked', 20);
      await b.ev('fzui.game.veh.dmg.anim.hood = 0.95, true');
      await shot('damage-cockpit-hood', 1);
      await b.ev(`fzShots.wreckAt('e30', ${spot}, { clock: 22.5, lights: true, hits: ['front'] })`);
      await b.ev('fzShots.orbit(7, -0.25, 1.4)');
      await shot('damage-night-headlight', 30);
      await b.ev('fzShots.free()');
      for (const type of SMASH) {
        await b.ev(`fzShots.wreckAt('e30', ${spot}, {})`);
        const s = await b.ev(`fzShots.smashSetup('${type}', ${spot})`);
        if (!s) { console.log('smash: no ' + type); continue; }
        await shot(`smash-${type}-1`, 70);
        await shot(`smash-${type}-2`, 10);
        await b.ev('fzui.keys = { down: true }, true');
        await shot(`smash-${type}-3`, 22);
        await b.ev('fzui.keys = {}, fzShots.spotCam()');
        await shot(`smash-${type}-4`, 200);
        console.log('smash ' + s.join(' ') + ': rubble ' + await b.ev('fzui.rubble.list.length + " bodies, " + fzui.rubble.list.filter(x => x.sleep).length + " at rest"'));
        await b.ev('fzShots.free()');
      }
      await b.ev(`fzShots.wreckAt('vaz2105', ${spot}, {})`);
      console.log('parked: ' + await b.ev(`fzShots.parkedSetup(${spot})`));
      await shot('damage-parked-1', 40);
      await b.ev('fzui.keys = {}, fzShots.spotCam()');
      await shot('damage-parked-2', 90);
      await b.ev('fzShots.free()');
      await b.ev(`fzShots.wreckAt('r34', ${spot}, { clock: 19.4, hits: ['front', 'fire'] })`);
      await b.ev('fzShots.orbit(7.5, -0.8, 2.2)');
      await shot('damage-fire', 200);
      await shot('damage-explosion', 352);
      await shot('damage-burnt', 40);
      await b.ev('fzShots.free(), fzui.game.repairCool = 0, true');
    }
    if (scenes.includes('cockpit')) {
      for (const id of COCKPITS) {
        await world('chase-' + id, id, {}, 40);
        await world('cockpit-' + id, id, { cam: 'cockpit' }, 12);
      }
      await world('hood-r34', 'r34', { cam: 'hood' }, 12);
      await world('cockpit-back-vaz2105', 'vaz2105', { cam: 'cockpit', back: true }, 12);
      await world('cockpit-back-f355', 'f355', { cam: 'cockpit', back: true }, 12);
    }
    if (scenes.includes('motion')) await world('motion-chase-e30', 'e30', { drive: true }, 150);
    if (scenes.includes('night')) {
      const night = { clock: 22.5, lights: true };
      await world('night-chase-e30', 'e30', night, 40);
      await world('night-front-e30', 'e30', { ...night, back: true }, 40);
      await world('night-cockpit-e30', 'e30', { ...night, cam: 'cockpit' }, 12);
      await world('night-front-diablo', 'diablo', { ...night, back: true }, 40);
      await world('night-front-charger', 'charger', { ...night, back: true }, 40);
      await world('night-reverse-e30', 'e30', { ...night, rev: true }, 90);
      await world('night-chase-uaz469', 'uaz469', night, 40);
    }
    if (scenes.includes('presets')) {
      for (const gfx of ['retro', 'high', 'ultra']) {
        await world('preset-' + gfx + '-chase', 'e30', { gfx }, 40);
        await world('preset-' + gfx + '-rain', 'e30', { gfx, weather: 'downpour', cam: 'cockpit' }, 40);
        await world('preset-' + gfx + '-night', 'f355', { gfx, clock: 22.5, lights: true, back: true }, 40);
      }
    }
    if (scenes.includes('cabin')) {
      await world('cabin-sun-e30', 'e30', { cam: 'cockpit', clock: 16.5, sun: 1.9 }, 12);
      await world('cabin-sun-vaz2105', 'vaz2105', { cam: 'cockpit', clock: 11, sun: 2.6 }, 12);
      await world('cabin-nosun-vaz2105', 'vaz2105', { cam: 'cockpit', clock: 11, sun: 2.6, noCabin: true }, 12);
      await world('cabin-glare-e30', 'e30', { cam: 'cockpit', clock: 18.2, sun: 0 }, 12);
      await world('cabin-rain-e30', 'e30', { cam: 'cockpit', weather: 'downpour' }, 70);
      await world('cabin-rain-r34', 'r34', { cam: 'cockpit', weather: 'downpour' }, 95);
    }
    if (scenes.includes('rain')) {
      await world('rain-chase-e30', 'e30', { weather: 'downpour' }, 40);
      await world('rain-cockpit-e30', 'e30', { weather: 'downpour', cam: 'cockpit' }, 12);
    }
    if (scenes.includes('time')) {
      const shot = async (name, expr, frames) => { await b.ev(expr); await b.ev(`fzShots.pump(${frames})`); save(name, await b.capture()); };
      await b.ev("fzShots.car('e30', { clock: 23.5 }), fzui.menus.closeAll(), fzui.menus.push(fzui.menus.hub()), true");
      await shot('time-hub', 'true', 8);
      await shot('time-open', "document.querySelector('.t-weather').click(), true", 8);
      await shot('time-dawn', "document.querySelector('.fz-tpre').click(), true", 90);
      const dawn = await b.ev('fzui.game.clock');
      await shot('time-applied', "document.querySelector('.fz-tbtns .fz-btn-hot').click(), true", 8);
      const applied = await b.ev('[fzui.game.clock, Forza.Profile.loadProfile().clock, fzui.menus.stack.length]');
      await shot('time-sunset', "document.querySelector('.t-weather').click(), document.querySelectorAll('.fz-tpre')[3].click(), true", 90);
      const sunset = await b.ev('fzui.game.clock');
      await b.ev("fzui.menus.key({ code: 'Escape', preventDefault() {} }), fzShots.pump(4)");
      const cancelled = await b.ev('fzui.game.clock');
      console.log('time: dawn preview ' + dawn + ', applied ' + applied.join('/') + ', sunset preview ' + sunset + ', after Esc ' + cancelled);
      await b.ev('fzui.menus.closeAll(), true');
    }
    if (scenes.includes('liveries')) {
      await b.ev('fzShots.paintShop()');
      save('paint-shop', await b.capture());
      await b.ev('fzui.menus.closeAll(), true');
    }
    if (scenes.includes('perf')) {
      const rows = [];
      for (const gfx of ['ultra', 'high', 'retro']) for (const kind of ['race', 'traffic', 'cockpit']) rows.push(await b.ev(`fzShots.perf('${kind}', '${gfx}')`));
      fs.writeFileSync(path.join(out, 'perf.json'), JSON.stringify(rows, null, 2));
      for (const s of rows) console.log(s.gfx.padEnd(6), s.kind.padEnd(8), s.ms + ' ms (p25 ' + s.p25 + ', best ' + s.best + ', js ' + s.cpu + ')', s.draws + ' draws', s.tris + ' tris');
      if (rows[0]) console.log('renderer: ' + rows[0].gpu);
    }
    if (scenes.includes('breakdown')) {
      const rows = [];
      for (const gfx of ['high', 'retro']) for (const kind of ['race', 'traffic']) rows.push(await b.ev(`fzShots.breakdown('${kind}', '${gfx}')`));
      fs.writeFileSync(path.join(out, 'breakdown.json'), JSON.stringify(rows, null, 2));
      for (const s of rows) console.log(JSON.stringify(s));
    }
    if (scenes.includes('stats')) {
      const stats = { date: new Date().toISOString(), meshes: await b.ev('fzShots.meshes()'), skins: await b.ev('fzShots.skins()') };
      stats.race = await b.ev("fzShots.stats('race')");
      save('stats-race', await b.ev('fzShots.frame()'));
      stats.traffic = await b.ev("fzShots.stats('traffic')");
      save('stats-traffic', await b.ev('fzShots.frame()'));
      fs.writeFileSync(path.join(out, 'stats.json'), JSON.stringify(stats, null, 2) + '\n');
      console.log(JSON.stringify(stats));
    }
    console.log('saved to ' + out);
    if (b.errors.length) {
      console.log('page errors:\n' + b.errors.join('\n'));
      process.exitCode = 1;
    }
  } finally {
    await b.close();
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { open };
