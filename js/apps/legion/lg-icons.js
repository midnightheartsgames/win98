(function (L) {
  'use strict';

  const METALS = {
    iron: ['#e4e0d8', '#8c877f', '#34322e'],
    bronze: ['#f8d394', '#b67c38', '#55320e'],
    silver: ['#ffffff', '#c2c7cf', '#555a62'],
    gold: ['#fff5bd', '#e8b73c', '#744d06']
  };

  const FIELDS = {
    att: ['#8e2a1b', '#3e0c06'],
    def: ['#2d4f8e', '#0e1c3c'],
    hp: ['#2f7050', '#0d2a1b'],
    mo: ['#643488', '#220e30'],
    shot: ['#6f6220', '#262006'],
    cmd: ['#3a322a', '#0d0b09'],
    form: ['#3d5261', '#121b22'],
    iron: ['#3b3631', '#11100e'],
    silverf: ['#a7acb4', '#474b52'],
    mars: ['#962a1c', '#3a0b05'],
    phobos: ['#4b4458', '#15121b'],
    hercules: ['#8a5320', '#2e1805'],
    apollo: ['#b3701c', '#3f2204'],
    minerva: ['#56662a', '#1b2208'],
    diana: ['#44607e', '#111c2a'],
    mercury: ['#2c6e6a', '#0b2422'],
    pluto: ['#3c2244', '#0e0712']
  };

  const f1 = v => Math.round(v * 10) / 10;

  const starPath = (cx, cy, ro, ri, n, rot) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || -Math.PI / 2) + i * Math.PI / n;
      const r = i % 2 ? ri : ro;
      d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * r) + ' ' + f1(cy + Math.sin(a) * r);
    }
    return d + 'Z';
  };

  const leafRing = (r, from, to, n, rx, ry, fill) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const a = from + (to - from) * t;
      const side = i % 2 ? 1 : -1;
      const rr = r + side * 2.6;
      const x = 32 + Math.cos(a) * rr, y = 32 + Math.sin(a) * rr;
      const tilt = (a * 180 / Math.PI) + 90 + (to > from ? 1 : -1) * side * 28;
      out += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + f1(tilt) + ' ' + f1(x) + ' ' + f1(y) + ')"' + (fill ? ' fill="' + fill + '"' : '') + '/>';
    }
    return out;
  };

  const arc = (r, from, to) => {
    const x0 = 32 + Math.cos(from) * r, y0 = 32 + Math.sin(from) * r;
    const x1 = 32 + Math.cos(to) * r, y1 = 32 + Math.sin(to) * r;
    const large = Math.abs(to - from) > Math.PI ? 1 : 0;
    const sweep = to > from ? 1 : 0;
    return 'M' + f1(x0) + ' ' + f1(y0) + 'A' + r + ' ' + r + ' 0 ' + large + ' ' + sweep + ' ' + f1(x1) + ' ' + f1(y1);
  };

  const rays = (cx, cy, r0, r1, n, half) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n - Math.PI / 2;
      d += 'M' + f1(cx + Math.cos(a - half) * r0) + ' ' + f1(cy + Math.sin(a - half) * r0) + 'L' + f1(cx + Math.cos(a) * r1) + ' ' + f1(cy + Math.sin(a) * r1) + 'L' + f1(cx + Math.cos(a + half) * r0) + ' ' + f1(cy + Math.sin(a + half) * r0) + 'Z';
    }
    return d;
  };

  const beads = (r, n, rad, fill) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n;
      out += '<circle cx="' + f1(32 + Math.cos(a) * r) + '" cy="' + f1(32 + Math.sin(a) * r) + '" r="' + rad + '" fill="' + fill + '"/>';
    }
    return out;
  };

  const rot = (deg, inner, cx, cy) => '<g transform="rotate(' + deg + ' ' + (cx == null ? 32 : cx) + ' ' + (cy == null ? 32 : cy) + ')">' + inner + '</g>';
  const place = (x, y, s, inner) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ') translate(-32 -32)">' + inner + '</g>';
  const line = (d, w) => '<path d="' + d + '" fill="none" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const dline = (d, w, op) => '<path d="' + d + '" fill="none" stroke="#D" stroke-width="' + (w || 1.3) + '" stroke-linecap="round"' + (op ? ' opacity="' + op + '"' : '') + '/>';

  const SWORD = '<path d="M32 4L37.5 12V39H26.5V12Z"/><rect x="19" y="38.5" width="26" height="6" rx="3"/><rect x="28.5" y="44" width="7" height="10.5" rx="1.5"/><circle cx="32" cy="58" r="4.5"/>';
  const SWORD_D = dline('M32 13V36') + dline('M28.5 48H35.5M28.5 51.5H35.5', 1.2);
  const SPEAR = '<path d="M32 3L38.5 15.5L33.8 22H30.2L25.5 15.5Z"/><rect x="30.2" y="21" width="3.6" height="36" rx="1.2"/><path d="M30.2 56H33.8L32.9 62H31.1Z"/>';
  const ARROW = '<path d="M32 2L38.5 14H25.5Z"/><rect x="30.6" y="13" width="2.8" height="40"/><path d="M30.6 46L24.5 55V61.5L30.6 54ZM33.4 46L39.5 55V61.5L33.4 54Z"/>';
  const SHIELD = '<path d="M17 10.5Q32 5 47 10.5V53.5Q32 59 17 53.5Z"/>';
  const SHIELD_D = dline('M20.5 13.5Q32 9.5 43.5 13.5V50.5Q32 55 20.5 50.5Z', 1.1) + dline('M32 11.5V26M32 38V52.5', 1.5) + '<circle cx="32" cy="32" r="5.5" fill="none" stroke="#D" stroke-width="1.8"/><circle cx="30.8" cy="30.8" r="2" fill="#L" opacity=".75"/>';
  const HORSE = '<path d="M40 3L44 11C50 18 54 28 54.5 40L55 62H25L28 50C26 45 24 43.5 20 46L13 47.5C9.5 48 7.5 44.5 9 41.5L15.5 31C20 22 26 15 33 11.5Z"/><path d="M45 12L51.5 10L48 16.5ZM49 19.5L55.5 18.5L51.5 24.5ZM52 27.5L58 27.5L53.5 33ZM53.5 36L59 37L54.5 41.5Z"/>';
  const HORSE_D = '<circle cx="30" cy="22.5" r="2.1" fill="#D"/><circle cx="13.5" cy="41.5" r="1.4" fill="#D"/>' + dline('M17 34.5L30.5 29.5L38.5 33M30.5 29.5L32.5 41', 1.3);
  const HELMET = '<path d="M13 38C13 22 23 13 35 13C46 13 53 21 53 31L58 35.5L54 38H13Z"/><path d="M13.5 35L7 45.5H19L21 38Z"/><path d="M35 37H46L45 50Q40 55.5 34.5 50Z"/><path d="M16 21C15 4 47 1 53 16C48 13.5 43 12.5 37 12.5C27 12.5 20 15 18.5 22Z"/>';
  const HELMET_D = dline('M14 33.5H52', 1.4) + dline('M22.5 12L24 16.5M28.5 8.5L29.5 13M35 7V12M41.5 8L40.5 12.5', 1.1) + '<circle cx="40" cy="43.5" r="1.4" fill="#D"/>';
  const ROUND = '<circle cx="32" cy="32" r="23"/>';
  const ROUND_D = '<circle cx="32" cy="32" r="18.5" fill="none" stroke="#D" stroke-width="1.3"/><circle cx="32" cy="32" r="6" fill="none" stroke="#D" stroke-width="1.8"/><circle cx="30.5" cy="30.5" r="2.2" fill="#L" opacity=".75"/>';
  const CUIRASS = '<path d="M18 9L26 7Q32 12.5 38 7L46 9L50.5 19L48 33Q46.5 44 48.5 50.5Q32 56 15.5 50.5Q17.5 44 16 33L13.5 19Z"/><path d="M15.5 50H20.5V59.5H15.5ZM22.5 52H27.5V61H22.5ZM29.5 53H34.5V62H29.5ZM36.5 52H41.5V61H36.5ZM43.5 50H48.5V59.5H43.5Z"/>';
  const CUIRASS_D = dline('M22 22Q27 28.5 31.5 23.5M42 22Q37 28.5 32.5 23.5', 1.6) + dline('M32 27.5V47', 1.3) + dline('M25 36Q32 38.5 39 36M25.5 42.5Q32 45 38.5 42.5', 1.3);
  const EAGLE = '<path d="M30.5 30.5L14 28.5L6 20.5H12.5L5 13.5L12.5 14L8.5 6L16.5 10.5L22.5 14.5L31 22.5Z"/><path d="M33.5 30.5L50 28.5L58 20.5H51.5L59 13.5L51.5 14L55.5 6L47.5 10.5L41.5 14.5L33 22.5Z"/><ellipse cx="32" cy="33" rx="6.8" ry="10.5"/><circle cx="32" cy="20.5" r="5.2"/><path d="M36 18.5L42 21L36 23.5Z"/><path d="M26.5 40L32 50.5L37.5 40Z"/><rect x="19" y="48" width="26" height="4.6" rx="2.2"/><rect x="30.2" y="52" width="3.6" height="10.5" rx="1"/>';
  const EAGLE_D = '<circle cx="33.6" cy="19.6" r="1.2" fill="#D"/>' + dline('M13.5 24L25.5 26.5M12 17.5L25 21.5M50.5 24L38.5 26.5M52 17.5L39 21.5', 1.1) + dline('M28.5 35Q32 38 35.5 35M29 40Q32 43 35 40', 1.1);
  const BANNER = '<path d="M32 1.5L35.8 8.5H28.2Z"/><rect x="11" y="8.5" width="42" height="4.2" rx="2.1"/><rect x="30" y="8" width="4" height="54.5" rx="1.5"/><path d="M15 12H49V42L46 46.5L43 42L40 46.5L37 42L34 46.5L31 42L28 46.5L25 42L22 46.5L19 42L16 46.5L15 42Z"/>' + line('M12 12.5V20.5M52 12.5V20.5', 2) + '<circle cx="12" cy="22" r="2"/><circle cx="52" cy="22" r="2"/>';
  const BANNER_D = '<rect x="18.5" y="15.5" width="27" height="23" fill="none" stroke="#D" stroke-width="1.2"/>' + '<path d="' + starPath(32, 27, 7, 3, 5) + '" fill="#D" opacity=".85"/>';
  const TARGET = '<circle cx="32" cy="32" r="22.5" fill="none" stroke-width="5"/><circle cx="32" cy="32" r="12.5" fill="none" stroke-width="5"/><circle cx="32" cy="32" r="4.6"/>';
  const HOURGLASS = '<rect x="12" y="5" width="40" height="6" rx="2.4"/><rect x="12" y="53" width="40" height="6" rx="2.4"/><rect x="14" y="10" width="3.6" height="44"/><rect x="46.4" y="10" width="3.6" height="44"/><path d="M20.5 11H43.5C43.5 22 35.5 27 34 32C35.5 37 43.5 42 43.5 53H20.5C20.5 42 28.5 37 30 32C28.5 27 20.5 22 20.5 11Z"/>';
  const HOURGLASS_D = '<path d="M23.5 13.5H40.5C40 21 33.8 26 32.4 30.8H31.6C30.2 26 24 21 23.5 13.5Z" fill="#D" opacity=".55"/><path d="M24 50.5C25 44.5 29.8 41.5 32 37C34.2 41.5 39 44.5 40 50.5Z" fill="#L" opacity=".8"/>';
  const SCROLL = '<rect x="9" y="7" width="46" height="8" rx="4"/><rect x="9" y="49" width="46" height="8" rx="4"/><rect x="14" y="12" width="36" height="40"/>';
  const SCROLL_D = dline('M19 21H45M19 27H45M19 33H40M19 39H44M19 45H36', 1.5, 0.9) + '<circle cx="10.5" cy="11" r="1.6" fill="#L"/><circle cx="53.5" cy="11" r="1.6" fill="#L"/><circle cx="10.5" cy="53" r="1.6" fill="#L"/><circle cx="53.5" cy="53" r="1.6" fill="#L"/>';
  const SOLDIER = '<path d="M24.5 12.5C24.5 6 28 3 32 3C36 3 39.5 6 39.5 12.5Z"/><path d="M27 4.5Q32 -1.5 37 4.5Z"/><circle cx="32" cy="15.5" r="6"/><path d="M20 25.5Q20 22 24 22H40Q44 22 44 25.5L46.5 41H41.5L40 32V61H33.5V45H30.5V61H24V32L22.5 41H17.5Z"/>';
  const BOW = line('M22.5 5C31.5 13.5 34 23.5 34 32C34 40.5 31.5 50.5 22.5 59', 5) + line('M22.5 5Q18 4.5 16.5 9M22.5 59Q18 59.5 16.5 55', 3) + line('M17.5 9.5V54.5', 1.5) + '<rect x="11" y="30.7" width="40" height="2.6"/><path d="M60 32L49.5 26.5V37.5Z"/><path d="M12 32L5.5 25.5H10.5L16 31ZM12 32L5.5 38.5H10.5L16 33Z"/>';

  const G = {
    sword: { b: SWORD, d: SWORD_D },
    swords: { b: rot(38, SWORD) + rot(-38, SWORD), d: rot(38, SWORD_D) + rot(-38, SWORD_D) },
    clash: { b: rot(38, SWORD) + rot(-38, SWORD), d: rot(38, SWORD_D) + rot(-38, SWORD_D) + '<path d="' + starPath(32, 25, 10.5, 3.6, 8) + '" fill="#L"/>' },
    feint: { b: rot(-35, SWORD, 36, 36) + line('M12 46C8 30 16 14 32 10', 4) + '<path d="M28 3.5L40.5 9L30 17.5Z"/>', d: rot(-35, SWORD_D, 36, 36) },
    pilum: { b: '<path d="M32 2L34.8 9.5H29.2Z"/><rect x="31" y="9" width="2" height="21.5"/><path d="M29 30H35L36 34.5H28Z"/><rect x="30" y="34" width="4" height="27" rx="1.5"/>', d: dline('M30 40H34M30 44H34', 1) },
    sarissa: { b: rot(45, '<path d="M32 -1L36.5 9.5L33.5 13H30.5L27.5 9.5Z"/><rect x="30.6" y="12" width="2.8" height="54" rx="1"/><path d="M30.6 64H33.4L32.6 68H31.4Z"/>'), d: '' },
    javelin: { b: rot(45, '<path d="M32 1L35.8 10.5L33.4 13H30.6L28.2 10.5Z"/><rect x="30.6" y="12" width="2.8" height="46" rx="1.2"/>') + line('M3 49L10 42M13 60L20 53M7.5 57L13 51.5', 3), d: '' },
    shield: { b: SHIELD, d: SHIELD_D },
    roundshield: { b: ROUND, d: ROUND_D },
    helmet: { b: HELMET, d: HELMET_D },
    officerhelm: {
      b: '<path d="M17 42C17 28 23 20 32 20C41 20 47 28 47 42Z"/><rect x="14" y="39" width="36" height="5" rx="2.5"/><path d="M16.5 43H23V55Q19.5 58 16.5 54Z"/><path d="M47.5 43H41V55Q44.5 58 47.5 54Z"/><path d="M5 27C5 7 59 7 59 27H50C48 18 16 18 14 27Z"/>',
      d: dline('M11.5 22L14 17M19.5 17.5L21 12.8M27.5 15.8V11M36.5 15.8V11M44.5 17.5L43 12.8M52.5 22L50 17', 1.1) + dline('M15 41.5H49', 1.1) + dline('M32 22V38', 1.2, 0.8)
    },
    cuirass: { b: CUIRASS, d: CUIRASS_D },
    cuirassStar: { b: CUIRASS, d: CUIRASS_D.replace(dline('M32 27.5V47', 1.3), '') + '<path d="' + starPath(32, 37, 8.5, 3.6, 5) + '" fill="#L"/>' },
    scale: {
      b: CUIRASS,
      d: (() => {
        let s = '';
        for (let r = 0; r < 6; r++) {
          const y = 15 + r * 6;
          const x0 = r % 2 ? 19 : 16, x1 = r % 2 ? 43 : 46;
          for (let x = x0; x <= x1; x += 6) s += 'M' + x + ' ' + y + 'q3 4.5 6 0';
        }
        return dline(s, 1.1);
      })()
    },
    sandal: {
      b: '<path d="M6 50.5Q6 46 11 46H53Q59 46 59 50.5Q59 54.5 54 54.5H11Q6 54.5 6 50.5Z"/><path d="M11 46.5L11.5 16Q12 11 17 11H24Q27.5 11 27.5 15L27 29Q35.5 32.5 44 37.5L54.5 46.5Z"/>',
      d: dline('M11.5 20H27.5M11.5 26.5H27', 1.6) + '<path d="M15 31L19.5 35.5L15 40ZM21.5 32L25.5 37L21.5 41.5ZM28.5 36L33 40L27.5 42.5ZM36 39L40.5 43L35 44.5Z" fill="#D" opacity=".8"/>' + '<circle cx="14" cy="50.5" r="1.1" fill="#L"/><circle cx="21" cy="50.5" r="1.1" fill="#L"/><circle cx="28" cy="50.5" r="1.1" fill="#L"/><circle cx="35" cy="50.5" r="1.1" fill="#L"/><circle cx="42" cy="50.5" r="1.1" fill="#L"/><circle cx="49" cy="50.5" r="1.1" fill="#L"/>'
    },
    banner: { b: BANNER, d: BANNER_D },
    eagle: { b: EAGLE, d: EAGLE_D },
    bow: { b: BOW, d: '' },
    arrow: { b: rot(45, ARROW), d: '' },
    arrows: { b: rot(-24, ARROW, 32, 58) + ARROW + rot(24, ARROW, 32, 58), d: '', sc: 0.95 },
    target: { b: TARGET, d: '' },
    marks: { b: TARGET + rot(45, '<rect x="30.8" y="-6" width="2.4" height="36"/><path d="M30.8 -6L26 -14V-18L30.8 -12ZM33.2 -6L38 -14V-18L33.2 -12Z"/>'), d: '' },
    reticle: { b: '<circle cx="32" cy="32" r="18" fill="none" stroke-width="4"/>' + line('M32 4V19M32 45V60M4 32H19M45 32H60', 4) + '<circle cx="32" cy="32" r="4"/>', d: '' },
    horse: { b: HORSE, d: HORSE_D },
    horsearmor: { b: HORSE + '<path d="M33 11.5C33 5 38 1 43 1.5C40 4 39.5 7 41 10Z"/>', d: HORSE_D + dline('M21 26L33 20L42 23', 1.3) },
    elephant: {
      b: '<path d="M48 16C46 9 38 6 31 7C22 8 16 14 15 22C14.5 28 16 32 16 36C16 42 14 47 11 51C9 54 9.5 58 13 58.5C16 59 18 56.5 19 53.5C20.5 49 22.5 45 25 42L29 46L32 38C37 39.5 42 38.5 46 35C50 31 50 23 48 16Z"/><path d="M34 13C43 8.5 55 14 56.5 26C58 38 50 45 43 42C45.5 35 45 23 34 13Z"/>',
      d: '<path d="M24.5 38.5C20.5 42 17 43.2 12.5 42.6C16.5 46 22.5 45.2 27 41.2Z" fill="#L"/><circle cx="26.5" cy="21" r="1.9" fill="#D"/>' + dline('M38.5 16C45.5 16.5 51 22 51.5 30', 1.3) + dline('M15.5 40.5H19.5M14.5 45.5H18M13 50.5H16', 1.1)
    },
    horseshoe: {
      b: '<path d="M13 10C8 28 11 52 32 57C53 52 56 28 51 10H41C44 26 42.5 45 32 47.5C21.5 45 20 26 23 10Z"/><rect x="11.5" y="6.5" width="13" height="4.5" rx="1.8"/><rect x="39.5" y="6.5" width="13" height="4.5" rx="1.8"/>',
      d: '<circle cx="17.5" cy="21" r="1.4" fill="#D"/><circle cx="17.8" cy="32" r="1.4" fill="#D"/><circle cx="21.5" cy="42.5" r="1.4" fill="#D"/><circle cx="46.5" cy="21" r="1.4" fill="#D"/><circle cx="46.2" cy="32" r="1.4" fill="#D"/><circle cx="42.5" cy="42.5" r="1.4" fill="#D"/>'
    },
    flame: {
      b: '<path d="M32 3C35 13 47 20 47 37C47 50 40 58.5 32 59.5C24 58.5 17 50 17 38C17 30 20.5 24.5 25 20C25 27 27 31 30.5 33C28.5 25 29 13 32 3Z"/><path d="M17.5 36C13 32 12 25 14 19C16 26 19 29 22 30Z"/><path d="M46.5 34C50.5 30 51.5 24 50 18.5C48 24 45 27 42.5 28Z"/>',
      d: '<path d="M32 30C34 36 40 40 40 47C40 52.5 36 56 32 56.5C28 56 24 52.5 24 47.5C24 43 27 40 29 38C29.5 42 30.5 44 32.5 45C31 40 31 35 32 30Z" fill="#L" opacity=".6"/>'
    },
    heart: { b: '<path d="M32 56C20 46 8 38 8 24C8 14 16 8 24 8C28 8 31 11 32 14C33 11 36 8 40 8C48 8 56 14 56 24C56 38 44 46 32 56Z"/>', d: '<path d="M17 18C15 21 15 25 16.5 28" fill="none" stroke="#L" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' },
    star: { b: '<path d="' + starPath(32, 33.5, 27, 11.5, 5) + '"/>', d: '' },
    burst: { b: '<path d="' + starPath(32, 32, 28, 12.5, 8, -Math.PI / 2 + 0.2) + '"/>', d: '<path d="' + starPath(32, 32, 12, 6, 8, -Math.PI / 2 + 0.2) + '" fill="#L" opacity=".6"/>' },
    laurel: {
      b: line(arc(21, Math.PI * 0.58, Math.PI * 1.36), 2) + line(arc(21, Math.PI * 0.42, -Math.PI * 0.36), 2) + leafRing(21, Math.PI * 0.6, Math.PI * 1.38, 9, 5.2, 2.3) + leafRing(21, Math.PI * 0.4, -Math.PI * 0.38, 9, 5.2, 2.3) + '<circle cx="32" cy="53.5" r="3"/>' + line('M30 55L25 61.5M34 55L39 61.5', 2.6),
      d: ''
    },
    hourglass: { b: HOURGLASS, d: HOURGLASS_D },
    scroll: { b: SCROLL, d: SCROLL_D },
    tree: { b: '<circle cx="32" cy="21" r="14"/><circle cx="19.5" cy="30" r="10.5"/><circle cx="44.5" cy="30" r="10.5"/><circle cx="32" cy="34" r="11.5"/><path d="M28.5 40H35.5L37.5 60.5H26.5Z"/>', d: dline('M24 26Q27 22 31 23M36 16Q39 15 41 17.5', 1.3, 0.7) },
    oak: {
      b: '<path d="M30.5 59C29.5 51 29.5 46 30.5 40.5C25 41.5 22 39 22.5 35.5C19 36 16 33.5 17 30C13.5 29 12.5 25.5 15 23C12 20.5 13 16.5 17 16C16.5 12 20 9.5 23.5 11C24.5 7 29 5.5 31.5 8C34 5.5 38.5 7 39.5 11C43 9.5 46.5 12 46 16C50 16.5 51 20.5 48 23C50.5 25.5 49.5 29 46 30C47 33.5 44 36 40.5 35.5C41 39 38 41.5 33 40.5C34 46 34 51 33.5 59Z"/><path d="M42 47C42 43 46 40.5 49.5 41.2C53 42 55 45 54 48.5Z"/><ellipse cx="47.5" cy="51.5" rx="4.4" ry="5.6" transform="rotate(-28 47.5 51.5)"/>',
      d: dline('M31.8 56V13M31.8 21L22.5 17.5M31.8 21L41 17.5M31.8 28.5L19.5 26.5M31.8 28.5L44 26.5M31.8 35L25 34.5M31.8 35L38.5 34.5', 1.15) + dline('M44 45.5L53 44.5', 1, 0.8)
    },
    mask: {
      b: '<path d="M16 20C16 10 23.5 5 32 5C40.5 5 48 10 48 20V35C48 48 40.5 58 32 58C23.5 58 16 48 16 35Z"/>',
      d: '<path d="M20 26Q25.5 20 29.5 26.5Q25 31 20 26ZM44 26Q38.5 20 34.5 26.5Q39 31 44 26Z" fill="#D"/><ellipse cx="32" cy="45" rx="5" ry="7" fill="#D"/>' + dline('M19 18Q24.5 13.5 29 17.5M35 17.5Q39.5 13.5 45 18', 1.7) + dline('M32 29V37', 1.3, 0.7)
    },
    club: {
      b: '<path d="M13 55L19.5 61L42 33C48 28 55 21 53.5 12.5C52 5.5 44 4 39.5 9C33.5 16.5 29 25 13 55Z"/><circle cx="51.5" cy="20" r="3.4"/><circle cx="36.5" cy="14" r="3.2"/><circle cx="44" cy="29" r="2.8"/><circle cx="29.5" cy="27" r="2.6"/><circle cx="37" cy="37" r="2.2"/>',
      d: dline('M18.5 55L43 18', 1.2, 0.6)
    },
    sun: { b: '<circle cx="32" cy="32" r="12.5"/><path d="' + rays(32, 32, 15, 28, 12, 0.13) + '"/>', d: '<circle cx="32" cy="32" r="8.5" fill="none" stroke="#D" stroke-width="1.3"/><circle cx="29.5" cy="29.5" r="3" fill="#L" opacity=".7"/>' },
    moon: { b: '<path d="M41 7A26 26 0 1 0 41 57A25.5 25.5 0 0 1 41 7Z"/><path d="' + starPath(47.5, 32, 7.5, 3, 5) + '"/>', d: '' },
    owl: {
      b: '<path d="M17 23C17 13 23.5 9 32 9C40.5 9 47 13 47 23V44C47 53.5 40.5 58.5 32 58.5C23.5 58.5 17 53.5 17 44Z"/><path d="M17.5 18L13 5L25.5 11.5Z"/><path d="M46.5 18L51 5L38.5 11.5Z"/><path d="M24 57.5H30V62H24ZM34 57.5H40V62H34Z"/>',
      d: '<circle cx="25" cy="23" r="6.5" fill="#D"/><circle cx="39" cy="23" r="6.5" fill="#D"/><circle cx="25" cy="23" r="3" fill="#L"/><circle cx="39" cy="23" r="3" fill="#L"/><path d="M32 27L29.5 31.5L32 35.5L34.5 31.5Z" fill="#D"/>' + dline('M24 40Q26 43 28 40M30 44.5Q32 47.5 34 44.5M36 40Q38 43 40 40M27 49Q29 52 31 49M33 49Q35 52 37 49', 1.2) + dline('M18.5 32Q20 44.5 26 52M45.5 32Q44 44.5 38 52', 1.4)
    },
    wing: {
      b: '<path d="M8 47C11 27 28 11 57 8C52 13.5 47 17 41.5 19.5C49.5 19 54 20.5 56.5 23C49 27.5 42 29.5 35.5 30C43.5 31 48 33 50.5 36.5C40 41 26 44.5 8 47Z"/>',
      d: dline('M14 43C24 34 36 24 52 12M14.5 44C26 38 38 33 51 25M15 45C27 42 37 39 47 36', 1.2, 0.8)
    },
    bident: { b: '<rect x="30" y="24" width="4" height="37.5" rx="1.5"/><path d="M18 16H23V22Q23 27 28 27H36Q41 27 41 22V16H46V23Q46 33 36 33H28Q18 33 18 23Z"/><path d="M18 17L20.5 3.5L23 17ZM41 17L43.5 3.5L46 17Z"/>', d: '' },
    mars: { b: '<g transform="translate(4 -2)">' + rot(40, SPEAR) + '</g><circle cx="25" cy="39" r="15"/>', d: '<circle cx="25" cy="39" r="11.2" fill="none" stroke="#D" stroke-width="1.2"/><circle cx="25" cy="39" r="4.4" fill="none" stroke="#D" stroke-width="1.6"/><circle cx="23.8" cy="37.8" r="1.6" fill="#L"/>' },
    falx: {
      b: '<path d="M20.5 36C20 21 30 9 49.5 4L51.5 8.2C37.5 14 29.5 24 27.5 36Z"/><rect x="17.5" y="33.5" width="13" height="4" rx="1.6"/><rect x="21.4" y="37" width="5.2" height="21" rx="2"/><circle cx="24" cy="59.5" r="3.2"/>',
      d: dline('M23.5 33C24.5 22 32 13.5 46 7.5', 1.1, 0.8) + dline('M21.4 42H26.6M21.4 46H26.6M21.4 50H26.6', 1)
    },
    wedge: {
      b: [[32, 12], [25, 22], [39, 22], [18, 32], [32, 32], [46, 32], [11, 42], [25, 42], [39, 42], [53, 42]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3.6"/>').join('') + '<rect x="10" y="51" width="44" height="3.5" rx="1.7"/>',
      d: ''
    },
    evade: { b: line('M10 50C10 29 25 15.5 45 17', 5) + '<path d="M41 7.5L56 17.5L41 27Z"/>' + '<rect x="24" y="44" width="34" height="5" rx="2.5"/><path d="M58 46.5L50 41V52Z"/>', d: '' },
    ranks: { b: place(15, 36, 0.56, SOLDIER) + place(49, 36, 0.56, SOLDIER) + place(32, 30, 0.62, SOLDIER) + '<rect x="6" y="55" width="52" height="4" rx="2"/>', d: '' },
    spearwall: { b: '<g transform="translate(-13 4)">' + rot(35, SPEAR) + '</g>' + '<g transform="translate(0 2)">' + rot(35, SPEAR) + '</g>' + '<g transform="translate(13 0)">' + rot(35, SPEAR) + '</g>' + '<rect x="6" y="54" width="52" height="5" rx="2.5"/>', d: '', sc: 0.94 },
    missileshield: { b: SHIELD + line('M27 28L10 11M38 36L55 17', 2.6) + '<path d="M12.3 8.7L15.7 16.7L10.4 11.4ZM7.7 13.3L15.7 16.7L10.4 11.4Z"/><path d="M57.4 19.1L49.7 23L54.7 17.4ZM52.6 14.9L49.7 23L54.7 17.4Z"/>', d: SHIELD_D },
    lock: { b: line('M22 28V20C22 13 26.5 8.5 32 8.5C37.5 8.5 42 13 42 20V28', 5.5) + '<rect x="15" y="27" width="34" height="28" rx="4"/>', d: '<circle cx="32" cy="38" r="3.6" fill="#D"/><path d="M30.4 40H33.6L34.6 48.5H29.4Z" fill="#D"/>' },
    plus: { b: '<path d="M27 10H37V27H54V37H37V54H27V37H10V27H27Z"/>', d: '' },
    chevron: { b: '<path d="M32 7L55 30L47.5 37.5L32 22L16.5 37.5L9 30Z"/><path d="M32 27L55 50L47.5 57.5L32 42L16.5 57.5L9 50Z"/>', d: '' },
    quill: {
      b: '<path d="M53 5C40 7.5 26 18 20 34C18 40 16 46 14 52L12 58.5L16.5 54C20.5 50 24 47 30 44C44 38 53 24 53 5Z"/>',
      d: dline('M50.5 8.5C40 20 28 36 15 55', 1.4) + dline('M44 20L38 17M40 27L32 25M35 34L27 33M29 40L23 40', 1, 0.7)
    },
    cross: { b: '<path d="M14 7.5L32 25.5L50 7.5L56.5 14L38.5 32L56.5 50L50 56.5L32 38.5L14 56.5L7.5 50L25.5 32L7.5 14Z"/>', d: '' },
    tent: { b: '<path d="M32 7L59 55H5Z"/><rect x="30.5" y="2" width="3" height="8"/>', d: '<path d="M32 21L42 55H22Z" fill="#D" opacity=".85"/>' + dline('M32 9L12 50M32 9L52 50', 1, 0.6) },
    soldier: { b: SOLDIER, d: dline('M24.5 33H39.5', 1.2, 0.8) },
    book: { b: '<path d="M8 12Q20 8 31 13V56Q20 51 8 55Z"/><path d="M56 12Q44 8 33 13V56Q44 51 56 55Z"/>', d: dline('M13 20Q19 18 26 21M13 27Q19 25 26 28M13 34Q19 32 26 35M38 21Q45 18 51 20M38 28Q45 25 51 27M38 35Q45 32 51 34', 1.2) },
    medal: { b: '<circle cx="32" cy="38" r="17"/><path d="M22 4H31L34 22H26ZM42 4H33L30 22H38Z"/>', d: '<circle cx="32" cy="38" r="12.5" fill="none" stroke="#D" stroke-width="1.3"/><path d="' + starPath(32, 38.5, 8, 3.4, 5) + '" fill="#L"/>' }
  };

  const SKILL_GLYPH = {
    swordsman: ['sword'], gmswords: ['sword', 'star'], feint: ['feint'], bighit: ['burst'], block: ['shield'], dodge: ['evade'], parry: ['clash'],
    hardiness: ['oak'], officers: ['officerhelm'], honourguard: ['laurel'], frenzy: ['flame'], missiledef: ['missileshield'], standfirm: ['spearwall'],
    ridedown: ['horseshoe'], anticav: ['horse', 'target'], antiinf: ['helmet', 'target'], antiele: ['elephant', 'target'], cavdef: ['horse', 'roundshield'],
    infdef: ['helmet', 'roundshield'], marksman: ['marks'], gmmarks: ['marks', 'star'], vulner: ['reticle'], skirmish: ['tree', 'arrow'], throwers: ['javelin'],
    drill: ['ranks'], wedge: ['wedge'], quick: ['hourglass'], strategist: ['scroll'], leadership: ['eagle']
  };

  const EQUIP_GLYPH = {
    weapon: () => ['sword'], armour: () => ['cuirass'], helmet: () => ['helmet'], boots: () => ['sandal'], banner: () => ['banner'],
    ammo: i => [['arrows', 'javelin', 'pilum'][i] || 'arrows'],
    bows: i => (i === 1 ? ['arrow', 'burst'] : ['bow']),
    relic: i => [['bow'], ['banner'], ['falx'], ['scale'], ['horsearmor'], ['sarissa'], ['cuirassStar']][i] || ['star']
  };

  const FAVOUR_GLYPH = { mars: 'mars', phobos: 'mask', hercules: 'club', apollo: 'sun', minerva: 'owl', diana: 'moon', mercury: 'wing', pluto: 'bident' };

  const STAT_GLYPH = {
    hp: 'heart', mo: 'banner', speed: 'wing', hit: 'sword', dm: 'burst', ar: 'shield', ag: 'evade', cc: 'mask', sa: 'missileshield', crit: 'star',
    tr: 'horseshoe', ta: 'spearwall', oc: 'scroll', sh: 'target', sd: 'arrow', shots: 'arrows', range: 'bow', op: 'scroll', og: 'hourglass', lr: 'eagle', pierce: 'burst'
  };

  const CLASS_GLYPH = { Skirmisher: 'javelin', LightInf: 'roundshield', HeavyInf: 'shield', Archer: 'bow', LightCav: 'horse', HeavyCav: 'horsearmor', Elephant: 'elephant', Leader: 'eagle' };

  const OBJECTIVE_GLYPH = { kill: 'swords', rout: 'mask', survive: 'hourglass', time: 'hourglass', killGeneral: 'target', keepGeneral: 'eagle', losses: 'heart', destroy: 'shield' };

  const cache = new Map();

  const esc = s => String(s).replace(/"/g, '&quot;');

  const glyphDefs = (name, id) => {
    const g = G[name];
    if (!g) throw new Error('icon ' + name);
    return '<g id="' + id + '" stroke-width="0">' + g.b + '</g>';
  };

  const detail = (name, m) => {
    const g = G[name];
    return g.d ? g.d.replace(/#D/g, m[2]).replace(/#L/g, m[0]) : '';
  };

  const grad = (id, stops, x2, y2) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0.85 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops.map(([o, c]) => '<stop offset="' + o + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';

  const relief = (name, m, pre, scale, cx, cy) => {
    const g = G[name];
    const s = (scale || 1) * (g.sc || 1);
    const body = pre + 'b';
    const defs = glyphDefs(name, body) + grad(pre + 'm', [[0, m[0]], [0.42, m[1]], [1, m[2]]]);
    const inner =
      '<use href="#' + body + '" fill="#000" stroke="#000" fill-opacity=".55" stroke-opacity=".55" transform="translate(1.6 2.2)"/>' +
      '<use href="#' + body + '" fill="' + m[0] + '" stroke="' + m[0] + '" transform="translate(-0.9 -0.9)"/>' +
      '<use href="#' + body + '" fill="url(#' + pre + 'm)" stroke="url(#' + pre + 'm)"/>' + detail(name, m);
    return { defs, body: '<g transform="translate(' + (cx == null ? 32 : cx) + ' ' + (cy == null ? 32 : cy) + ') scale(' + s + ') translate(-32 -32)">' + inner + '</g>' };
  };

  const flat = (name, color, pre, scale, cx, cy, outline) => {
    const g = G[name];
    const s = (scale || 1) * (g.sc || 1);
    const body = pre + 'b';
    const defs = glyphDefs(name, body);
    const sh = outline || 'rgba(0,0,0,.7)';
    const d = g.d ? g.d.replace(/#D/g, 'rgba(0,0,0,.55)').replace(/#L/g, 'rgba(255,255,255,.5)') : '';
    const inner = '<use href="#' + body + '" fill="' + sh + '" stroke="' + sh + '" transform="translate(1.8 2.2)"/><use href="#' + body + '" fill="' + color + '" stroke="' + color + '"/>' + d;
    return { defs, body: '<g transform="translate(' + (cx == null ? 32 : cx) + ' ' + (cy == null ? 32 : cy) + ') scale(' + s + ') translate(-32 -32)">' + inner + '</g>' };
  };

  const wrap = (defs, body) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>' + defs + '</defs>' + body + '</svg>';

  const badgeParts = (name, m, field) => {
    const r = relief(name, m, 'k', 0.3, 48.5, 48.5);
    const defs = r.defs + grad('kf', [[0, field[0]], [1, field[1]]], 0, 1) + grad('kr', [[0, m[0]], [0.5, m[1]], [1, m[2]]]);
    const body = '<circle cx="48.5" cy="48.5" r="13.6" fill="' + m[2] + '"/><circle cx="48.5" cy="48.5" r="12.6" fill="url(#kr)"/><circle cx="48.5" cy="48.5" r="10" fill="url(#kf)"/>' + r.body;
    return { defs, body };
  };

  const disc = (glyph, o) => {
    const m = METALS[o.metal || 'bronze'];
    const field = FIELDS[o.field || 'iron'];
    const r = relief(glyph, m, 'g', o.scale || 0.64);
    let defs = r.defs +
      '<radialGradient id="rim" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="' + m[0] + '"/><stop offset="0.5" stop-color="' + m[1] + '"/><stop offset="1" stop-color="' + m[2] + '"/></radialGradient>' +
      '<radialGradient id="fld" cx="0.42" cy="0.32" r="0.75"><stop offset="0" stop-color="' + field[0] + '"/><stop offset="1" stop-color="' + field[1] + '"/></radialGradient>' +
      '<linearGradient id="gls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>';
    let body = '<circle cx="32" cy="32" r="31.4" fill="' + m[2] + '"/><circle cx="32" cy="32" r="30.2" fill="url(#rim)"/>';
    if (o.beads) body += beads(27.2, 22, 1.25, m[0]);
    body += '<circle cx="32" cy="32" r="24.6" fill="#000" opacity=".6"/><circle cx="32" cy="32" r="23.6" fill="url(#fld)"/>';
    body += r.body;
    body += '<circle cx="32" cy="32" r="23.6" fill="url(#gls)"/>';
    if (o.laurel) {
      const lm = METALS.gold;
      body += '<g fill="' + lm[1] + '" stroke="' + lm[2] + '" stroke-width=".5">' + leafRing(27.3, Math.PI * 0.62, Math.PI * 1.2, 5, 4.3, 1.9) + leafRing(27.3, Math.PI * 0.38, -Math.PI * 0.2, 5, 4.3, 1.9) + '</g>';
    }
    if (o.badge) {
      const bp = badgeParts(o.badge, m, field);
      defs += bp.defs;
      body += bp.body;
    }
    return wrap(defs, body);
  };

  const tile = (glyph, o) => {
    const frame = METALS[o.frame || 'bronze'];
    const m = METALS[o.metal || 'bronze'];
    const field = FIELDS[o.field || 'iron'];
    const r = relief(glyph, m, 'g', o.scale || 0.7);
    let defs = r.defs + grad('rim', [[0, frame[0]], [0.45, frame[1]], [1, frame[2]]]) + grad('fld', [[0, field[0]], [1, field[1]]], 0.3, 1);
    let body = '<rect x="1.5" y="1.5" width="61" height="61" rx="9" fill="' + frame[2] + '"/><rect x="2.8" y="2.8" width="58.4" height="58.4" rx="8" fill="url(#rim)"/>' +
      '<rect x="7.4" y="7.4" width="49.2" height="49.2" rx="4.4" fill="#000" opacity=".62"/><rect x="8.3" y="8.3" width="47.4" height="47.4" rx="3.8" fill="url(#fld)"/>' +
      [[5.6, 5.6], [58.4, 5.6], [5.6, 58.4], [58.4, 58.4]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="1.7" fill="' + frame[0] + '"/>').join('');
    if (o.gem) body += '<path d="M32 1.5L36.5 6L32 10.5L27.5 6Z" fill="#c8302a" stroke="' + frame[2] + '" stroke-width=".8"/>';
    body += r.body;
    if (o.badge) {
      const bp = badgeParts(o.badge, m, field);
      defs += bp.defs;
      body += bp.body;
    }
    return wrap(defs, body);
  };

  const coin = (glyph, o) => {
    const m = METALS[o.metal || 'gold'];
    const field = FIELDS[o.field || 'iron'];
    const r = relief(glyph, m, 'g', o.scale || 0.62);
    const defs = r.defs +
      '<radialGradient id="rim" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="' + m[0] + '"/><stop offset="0.55" stop-color="' + m[1] + '"/><stop offset="1" stop-color="' + m[2] + '"/></radialGradient>' +
      '<radialGradient id="fld" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="' + field[0] + '"/><stop offset="1" stop-color="' + field[1] + '"/></radialGradient>';
    const body = '<circle cx="32" cy="32" r="31" fill="' + m[2] + '"/><circle cx="32" cy="32" r="29.6" fill="url(#rim)"/>' + beads(26.4, 26, 1.1, m[2]) +
      '<circle cx="32" cy="32" r="23.2" fill="' + m[2] + '"/><circle cx="32" cy="32" r="22.4" fill="url(#fld)"/>' + r.body;
    return wrap(defs, body);
  };

  const plain = (glyph, o) => {
    const r = flat(glyph, o.color || '#e9ddbf', 'g', o.scale || 1, null, null, o.outline);
    let defs = r.defs, body = r.body;
    if (o.badge) {
      const b = flat(o.badge, o.color || '#e9ddbf', 'k', 0.34, 49, 49, o.outline);
      defs += b.defs;
      body += '<circle cx="49" cy="49" r="13" fill="' + (o.badgeBg || '#1a140e') + '"/>' + b.body;
    }
    return wrap(defs, body);
  };

  const metalGlyph = (glyph, o) => {
    const m = METALS[o.metal || 'bronze'];
    const r = relief(glyph, m, 'g', o.scale || 0.94);
    return wrap(r.defs, r.body);
  };

  const RENDER = { disc, tile, coin, plain, metal: metalGlyph };

  const svgOf = (kind, glyph, o) => {
    const key = kind + '|' + glyph + '|' + JSON.stringify(o || {});
    let s = cache.get(key);
    if (!s) {
      s = RENDER[kind](glyph, o || {});
      cache.set(key, s);
    }
    return s;
  };

  const url = (kind, glyph, o) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(kind, glyph, o));

  const skillMetal = (id, tier) => {
    const n = L.SKILLS[id].tiers.length;
    if (!tier) return { metal: 'iron' };
    if (n === 1) return { metal: 'gold', beads: true };
    const step = n === 3 ? tier + 1 : tier;
    if (step >= 4) return { metal: 'gold', beads: true, laurel: true };
    return { metal: ['bronze', 'bronze', 'silver', 'gold'][step] };
  };

  const I = {};

  I.GLYPHS = G;
  I.SKILL_GLYPH = SKILL_GLYPH;
  I.EQUIP_GLYPH = EQUIP_GLYPH;
  I.FAVOUR_GLYPH = FAVOUR_GLYPH;
  I.STAT_GLYPH = STAT_GLYPH;
  I.CLASS_GLYPH = CLASS_GLYPH;
  I.OBJECTIVE_GLYPH = OBJECTIVE_GLYPH;
  I.svg = svgOf;
  I.url = url;

  I.skill = (id, tier) => {
    const [glyph, badge] = SKILL_GLYPH[id];
    const sk = L.SKILLS[id];
    return url('disc', glyph, Object.assign({ field: tier ? sk.cat : 'iron', badge }, skillMetal(id, tier)));
  };

  I.equip = (slot, index, tier) => {
    const [glyph, badge] = EQUIP_GLYPH[slot](index);
    if (slot === 'relic') return url('tile', glyph, { frame: 'gold', metal: tier ? 'gold' : 'iron', gem: true, badge });
    const e = L.EQUIP[slot];
    if (e.flat) return url('tile', glyph, { metal: tier ? 'silver' : 'iron', badge });
    const metal = !tier ? 'iron' : tier <= 2 ? 'bronze' : tier === 3 ? 'silver' : 'gold';
    return url('tile', glyph, { metal, badge });
  };

  I.favour = k => url('coin', FAVOUR_GLYPH[k], { metal: 'gold', field: k });
  I.stat = (k, color) => url('plain', STAT_GLYPH[k] || 'star', { color: color || '#e3d3ae' });
  I.cls = (type, color) => url('plain', CLASS_GLYPH[type] || 'soldier', { color: color || '#e3d3ae' });
  I.objective = (type, color) => url('plain', OBJECTIVE_GLYPH[type] || 'star', { color: color || '#f1d68c' });
  I.glory = () => url('metal', 'star', { metal: 'gold' });
  I.denarii = () => url('coin', 'cross', { metal: 'silver', field: 'silverf', scale: 0.42 });
  I.medal = i => url('disc', 'eagle', { metal: ['bronze', 'silver', 'gold'][i], field: ['hp', 'def', 'att'][i], beads: i > 0, laurel: i === 2, scale: 0.7 });
  I.defeat = () => url('disc', 'cross', { metal: 'iron', field: 'iron', scale: 0.5 });
  I.ui = (glyph, o) => url(o && o.kind ? o.kind : 'plain', glyph, o || {});

  I.img = (src, size, cls, alt) => {
    const el = document.createElement('img');
    el.src = src;
    el.alt = alt || '';
    el.draggable = false;
    el.className = 'lga-ico' + (cls ? ' ' + cls : '');
    if (size) { el.width = size; el.height = size; }
    return el;
  };

  I.html = (src, size, cls) => '<img class="lga-ico' + (cls ? ' ' + cls : '') + '" src="' + esc(src) + '" width="' + size + '" height="' + size + '" alt="">';

  L.Icons = I;
})(globalThis.Legion = globalThis.Legion || {});
