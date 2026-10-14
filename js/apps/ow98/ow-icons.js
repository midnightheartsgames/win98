(function (O) {
  'use strict';
  const PI = Math.PI;
  const G = {};

  function poly(x, pts) { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); }
  function circ(x, cx, cy, r, stroke) { x.beginPath(); x.arc(cx, cy, r, 0, PI * 2); if (stroke) x.stroke(); else x.fill(); }
  function line(x, pts, w) { x.lineWidth = w || 3; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
  function arrow(x, x0, y0, x1, y1, w) { line(x, [[x0, y0], [x1, y1]], w); const a = Math.atan2(y1 - y0, x1 - x0); poly(x, [[x1 + Math.cos(a) * 6, y1 + Math.sin(a) * 6], [x1 + Math.cos(a + 2.4) * 8, y1 + Math.sin(a + 2.4) * 8], [x1 + Math.cos(a - 2.4) * 8, y1 + Math.sin(a - 2.4) * 8]]); }

  G.revolver = x => { poly(x, [[4, 12], [26, 12], [26, 17], [12, 17], [10, 26], [5, 26], [7, 17], [4, 17]]); circ(x, 14, 15, 4); };
  G.fan = x => { for (let i = 0; i < 3; i++) { x.save(); x.translate(16, 20); x.rotate(-0.5 + i * 0.5); poly(x, [[-2, -16], [2, -16], [2, 0], [-2, 0]]); x.restore(); } circ(x, 16, 22, 5); };
  G.roll = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 16, 9, 0.3, PI * 1.7); x.stroke(); poly(x, [[24, 8], [28, 16], [20, 16]]); };
  G.flash = x => { poly(x, [[16, 3], [19, 13], [29, 16], [19, 19], [16, 29], [13, 19], [3, 16], [13, 13]]); };
  G.deadeye = x => { x.lineWidth = 3; circ(x, 16, 16, 10, true); line(x, [[16, 2], [16, 10]]); line(x, [[16, 22], [16, 30]]); line(x, [[2, 16], [10, 16]]); line(x, [[22, 16], [30, 16]]); circ(x, 16, 16, 3); };
  G.rifle = x => { poly(x, [[2, 13], [28, 13], [30, 16], [28, 18], [14, 18], [12, 24], [8, 24], [9, 18], [2, 18]]); };
  G.helix = x => { for (let i = 0; i < 3; i++) poly(x, [[4 + i * 4, 22 - i * 7], [22 + i * 4, 18 - i * 7], [24 + i * 4, 20 - i * 7], [6 + i * 4, 25 - i * 7]]); };
  G.sprint = x => { for (let i = 0; i < 3; i++) poly(x, [[4 + i * 8, 8], [12 + i * 8, 16], [4 + i * 8, 24], [8 + i * 8, 24], [16 + i * 8, 16], [8 + i * 8, 8]]); };
  G.field = x => { x.lineWidth = 2; circ(x, 16, 16, 12, true); poly(x, [[13, 8], [19, 8], [19, 13], [24, 13], [24, 19], [19, 19], [19, 24], [13, 24], [13, 19], [8, 19], [8, 13], [13, 13]]); };
  G.visor = x => { poly(x, [[2, 12], [30, 12], [26, 20], [6, 20]]); x.globalCompositeOperation = 'destination-out'; poly(x, [[6, 14], [26, 14], [24, 18], [8, 18]]); x.globalCompositeOperation = 'source-over'; };
  G.pistols = x => { for (const dx of [0, 10]) poly(x, [[2 + dx, 10 + dx * 0.4], [18 + dx, 10 + dx * 0.4], [18 + dx, 14 + dx * 0.4], [9 + dx, 14 + dx * 0.4], [8 + dx, 20 + dx * 0.4], [4 + dx, 20 + dx * 0.4], [5 + dx, 14 + dx * 0.4], [2 + dx, 14 + dx * 0.4]]); };
  G.blink = x => { poly(x, [[4, 8], [16, 16], [4, 24]]); poly(x, [[14, 8], [26, 16], [14, 24]]); x.fillRect(26, 8, 3, 16); };
  G.recall = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 16, 10, -0.5, PI * 1.5); x.stroke(); poly(x, [[4, 6], [12, 6], [8, 12]]); line(x, [[16, 10], [16, 16], [21, 19]], 2); };
  G.pulsebomb = x => { circ(x, 16, 16, 9); x.lineWidth = 2; circ(x, 16, 16, 13, true); line(x, [[16, 1], [16, 5]]); };
  G.frag = x => { circ(x, 14, 18, 9); x.fillRect(17, 6, 5, 6); line(x, [[20, 6], [25, 2]], 2); };
  G.mine = x => { poly(x, [[4, 24], [8, 12], [24, 12], [28, 24]]); circ(x, 16, 10, 3); };
  G.trap = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 22, 11, PI, PI * 2); x.stroke(); for (let i = 0; i < 6; i++) poly(x, [[7 + i * 3.6, 22], [8.8 + i * 3.6, 14], [10.6 + i * 3.6, 22]]); };
  G.tire = x => { x.lineWidth = 4; circ(x, 16, 16, 10, true); circ(x, 16, 16, 4); };
  G.mayhem = x => { for (const [a, b] of [[10, 12], [22, 12], [16, 22]]) circ(x, a, b, 5); };
  G.rivet = x => { poly(x, [[3, 12], [22, 12], [22, 20], [3, 20]]); poly(x, [[22, 14], [30, 15], [30, 17], [22, 18]]); x.fillRect(8, 20, 5, 7); };
  G.hammer = x => { poly(x, [[6, 6], [22, 6], [22, 14], [6, 14]]); x.fillRect(12, 14, 4, 16); };
  G.turret = x => { poly(x, [[10, 8], [22, 8], [22, 16], [10, 16]]); x.fillRect(22, 10, 8, 3); line(x, [[16, 16], [8, 28]], 2); line(x, [[16, 16], [24, 28]], 2); line(x, [[16, 16], [16, 28]], 2); };
  G.armor = x => { poly(x, [[16, 3], [27, 7], [26, 18], [16, 29], [6, 18], [5, 7]]); };
  G.molten = x => { poly(x, [[16, 2], [22, 12], [20, 12], [26, 22], [16, 30], [6, 22], [12, 12], [10, 12]]); };
  G.sniper = x => { poly(x, [[1, 14], [30, 14], [30, 17], [16, 17], [14, 22], [10, 22], [11, 17], [1, 17]]); x.fillRect(12, 10, 10, 3); };
  G.grapple = x => { line(x, [[4, 28], [22, 10]], 2); poly(x, [[22, 4], [28, 10], [22, 16], [19, 10]]); };
  G.venom = x => { poly(x, [[16, 4], [24, 16], [16, 28], [8, 16]]); x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 3); x.globalCompositeOperation = 'source-over'; };
  G.infra = x => { poly(x, [[2, 16], [16, 7], [30, 16], [16, 25]]); x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 5); x.globalCompositeOperation = 'source-over'; circ(x, 16, 16, 2.5); };
  G.rhammer = x => { poly(x, [[4, 4], [20, 4], [20, 14], [4, 14]]); x.fillRect(10, 14, 4, 16); poly(x, [[20, 6], [26, 5], [26, 13], [20, 12]]); };
  G.barrier = x => { poly(x, [[4, 6], [28, 6], [26, 26], [6, 26]]); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 3; i++) x.fillRect(8 + i * 6, 10, 3, 12); x.globalCompositeOperation = 'source-over'; };
  G.charge = x => { poly(x, [[4, 10], [18, 10], [18, 5], [29, 16], [18, 27], [18, 22], [4, 22]]); };
  G.strike = x => { poly(x, [[4, 26], [14, 6], [18, 14], [28, 4], [20, 28]]); };
  G.shatter = x => { x.fillRect(12, 2, 8, 12); x.fillRect(15, 14, 2, 8); poly(x, [[2, 30], [10, 22], [16, 26], [22, 22], [30, 30]]); };
  G.scrapgun = x => { poly(x, [[2, 11], [24, 11], [28, 13], [28, 19], [24, 21], [12, 21], [10, 27], [5, 27], [6, 21], [2, 21]]); };
  G.hook = x => { x.lineWidth = 3; x.beginPath(); x.arc(18, 20, 7, -0.3, PI + 0.5); x.stroke(); line(x, [[24, 18], [24, 4]], 3); poly(x, [[11, 22], [7, 16], [13, 18]]); };
  G.breather = x => { circ(x, 16, 16, 12); x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 8); x.globalCompositeOperation = 'source-over'; poly(x, [[14, 8], [18, 8], [18, 14], [24, 14], [24, 18], [18, 18], [18, 24], [14, 24], [14, 18], [8, 18], [8, 14], [14, 14]]); };
  G.wholehog = x => { G.scrapgun(x); for (let i = 0; i < 3; i++) x.fillRect(28, 8 + i * 6, 3, 2); };
  G.tesla = x => { poly(x, [[4, 18], [12, 8], [14, 15], [22, 6], [20, 17], [28, 14], [16, 28], [18, 20]]); };
  G.jumppack = x => { poly(x, [[8, 4], [24, 4], [24, 18], [8, 18]]); poly(x, [[10, 18], [14, 18], [12, 28]]); poly(x, [[18, 18], [22, 18], [20, 28]]); };
  G.bubble = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 22, 12, PI, PI * 2); x.stroke(); x.fillRect(12, 22, 8, 4); };
  G.rage = x => { poly(x, [[4, 28], [8, 10], [14, 18], [16, 4], [18, 18], [24, 10], [28, 28]]); };
  G.amp = x => { poly(x, [[4, 10], [16, 10], [22, 5], [22, 27], [16, 22], [4, 22]]); };
  G.soundwave = x => { x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(4, 16, 8 + i * 7, -0.7, 0.7); x.stroke(); } };
  G.crossfade = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 16, 10, 0, PI); x.stroke(); poly(x, [[4, 16], [2, 10], [9, 12]]); x.beginPath(); x.arc(16, 16, 10, PI, PI * 2); x.stroke(); };
  G.ampitup = x => { for (let i = 0; i < 4; i++) x.fillRect(4 + i * 7, 26 - i * 6 - 4, 5, i * 6 + 4); };
  G.soundbarrier = x => { poly(x, [[16, 3], [27, 8], [26, 19], [16, 29], [6, 19], [5, 8]]); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 4; i++) x.fillRect(9 + i * 4, 20 - i * 3, 2.5, 3 + i * 3); x.globalCompositeOperation = 'source-over'; };
  G.wallride = x => { x.fillRect(24, 2, 4, 28); circ(x, 12, 12, 5); poly(x, [[8, 18], [16, 18], [20, 28], [4, 28]]); };
  G.staff = x => { line(x, [[6, 28], [24, 6]], 3); poly(x, [[22, 2], [30, 4], [28, 12], [24, 8]]); };
  G.blaster = x => { poly(x, [[4, 12], [24, 12], [24, 17], [12, 17], [11, 24], [6, 24], [7, 17], [4, 17]]); };
  G.angel = x => { poly(x, [[16, 10], [30, 4], [26, 14], [30, 20], [16, 18], [2, 20], [6, 14], [2, 4]]); circ(x, 16, 24, 4); };
  G.descent = x => { poly(x, [[16, 6], [30, 12], [16, 16], [2, 12]]); line(x, [[16, 18], [16, 28]], 2); poly(x, [[12, 25], [20, 25], [16, 30]]); };
  G.rez = x => { poly(x, [[14, 4], [18, 4], [18, 12], [26, 12], [26, 16], [18, 16], [18, 28], [14, 28], [14, 16], [6, 16], [6, 12], [14, 12]]); x.lineWidth = 2; x.beginPath(); x.ellipse(16, 6, 9, 3, 0, 0, PI * 2); x.stroke(); };
  G.orb = x => { circ(x, 16, 16, 10); x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 6); x.globalCompositeOperation = 'source-over'; circ(x, 16, 16, 3); };
  G.harmony = x => { circ(x, 16, 16, 10); x.globalCompositeOperation = 'destination-out'; poly(x, [[14, 9], [18, 9], [18, 14], [23, 14], [23, 18], [18, 18], [18, 23], [14, 23], [14, 18], [9, 18], [9, 14], [14, 14]]); x.globalCompositeOperation = 'source-over'; };
  G.discord = x => { circ(x, 16, 16, 10); x.globalCompositeOperation = 'destination-out'; x.fillRect(9, 14, 14, 4); x.globalCompositeOperation = 'source-over'; };
  G.trans = x => { x.lineWidth = 2; circ(x, 16, 16, 12, true); circ(x, 16, 16, 7, true); circ(x, 16, 16, 3); };
  G.melee = x => { poly(x, [[6, 10], [20, 10], [24, 14], [24, 22], [8, 22], [6, 18]]); x.fillRect(4, 12, 4, 6); };
  G.skull = x => { circ(x, 16, 13, 10); x.fillRect(10, 18, 12, 8); x.globalCompositeOperation = 'destination-out'; circ(x, 12, 13, 3); circ(x, 20, 13, 3); x.fillRect(14, 22, 1.5, 4); x.fillRect(17, 22, 1.5, 4); x.globalCompositeOperation = 'source-over'; };
  G.fall = x => { arrow(x, 16, 4, 16, 24, 3); x.fillRect(4, 28, 24, 3); };
  G.lock = x => { x.lineWidth = 3; x.beginPath(); x.arc(16, 13, 6, PI, PI * 2); x.stroke(); x.fillRect(8, 13, 16, 13); };
  G.payload = x => { poly(x, [[4, 12], [28, 12], [28, 22], [4, 22]]); circ(x, 10, 25, 3); circ(x, 22, 25, 3); x.fillRect(10, 6, 12, 6); };
  G.heal = x => { poly(x, [[13, 4], [19, 4], [19, 13], [28, 13], [28, 19], [19, 19], [19, 28], [13, 28], [13, 19], [4, 19], [4, 13], [13, 13]]); };
  G.star = x => { poly(x, Array.from({ length: 10 }, (_, i) => { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 6 : 14; return [16 + Math.cos(a) * r, 17 + Math.sin(a) * r]; })); };
  G.turretIcon = G.turret;
  G.cSkin = x => { poly(x, [[10, 5], [13, 5], [16, 9], [19, 5], [22, 5], [30, 11], [26, 17], [23, 14], [23, 29], [9, 29], [9, 14], [6, 17], [2, 11]]); };
  G.cEmote = x => { x.lineWidth = 3; circ(x, 16, 16, 12, true); circ(x, 11.5, 13, 2.2); circ(x, 20.5, 13, 2.2); x.beginPath(); x.arc(16, 17, 6.5, 0.35, PI - 0.35); x.stroke(); };
  G.cPose = x => { circ(x, 16, 6, 3.6); line(x, [[16, 10], [16, 20]], 3.4); line(x, [[16, 13], [8, 4]], 3); line(x, [[16, 13], [24, 4]], 3); line(x, [[16, 20], [10, 29]], 3.2); line(x, [[16, 20], [22, 29]], 3.2); };
  G.cVoice = x => { circ(x, 16, 8, 5); x.fillRect(11, 8, 10, 8); circ(x, 16, 16, 5); x.lineWidth = 2.5; x.beginPath(); x.arc(16, 15, 8.5, 0.15, PI - 0.15); x.stroke(); line(x, [[16, 23.5], [16, 28]], 2.5); line(x, [[10, 28.5], [22, 28.5]], 2.5); };
  G.cSpray = x => { x.fillRect(9, 12, 13, 17); x.fillRect(12, 7, 7, 5); x.fillRect(18, 7.5, 5, 2.5); circ(x, 26, 5, 1.6); circ(x, 28.5, 9, 1.3); circ(x, 25, 1.8, 1.1); x.globalCompositeOperation = 'destination-out'; x.fillRect(11, 17, 9, 2); x.fillRect(11, 22, 9, 2); x.globalCompositeOperation = 'source-over'; };
  G.cIntro = x => { x.fillRect(4, 13, 24, 15); poly(x, [[4, 7], [26, 3], [27, 9], [5, 13]]); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 3; i++) poly(x, [[9 + i * 6, 6.5], [12 + i * 6, 6], [10 + i * 6, 11], [7 + i * 6, 11.5]]); poly(x, [[13, 16], [21, 20.5], [13, 25]]); x.globalCompositeOperation = 'source-over'; };
  G.cIcon = x => { x.lineWidth = 2.5; x.strokeRect(4, 4, 24, 24); circ(x, 16, 13, 4.5); x.beginPath(); x.arc(16, 27, 8, PI, PI * 2); x.fill(); };
  G.coin = x => { circ(x, 16, 16, 12); x.globalCompositeOperation = 'destination-out'; x.lineWidth = 2; circ(x, 16, 16, 9, true); x.lineWidth = 3; x.beginPath(); x.arc(16, 16, 4.5, 0.7, PI * 2 - 0.7); x.stroke(); x.globalCompositeOperation = 'source-over'; };
  G.check = x => { line(x, [[6, 17], [13, 24], [26, 9]], 4.5); };
  G.owlogo = x => { x.lineWidth = 5; x.beginPath(); x.arc(16, 17, 10.5, -PI / 2 + 0.55, PI * 1.5 - 0.55); x.stroke(); poly(x, [[13.5, 2], [18.5, 2], [17.5, 18], [14.5, 18]]); poly(x, [[9, 25], [13, 21], [16, 28], [12, 30]]); poly(x, [[23, 25], [19, 21], [16, 28], [20, 30]]); };
  G.diamond = x => { poly(x, [[16, 2], [28, 14], [16, 30], [4, 14]]); x.globalCompositeOperation = 'destination-out'; line(x, [[4, 14], [28, 14]], 1.5); line(x, [[10, 14], [16, 30], [22, 14]], 1.5); x.globalCompositeOperation = 'source-over'; };
  G.bolt = x => { poly(x, [[19, 2], [7, 18], [15, 18], [12, 30], [25, 13], [17, 13], [21, 2]]); };
  G.crown = x => { poly(x, [[4, 25], [4, 9], [10, 16], [16, 5], [22, 16], [28, 9], [28, 25]]); x.fillRect(4, 26, 24, 3); x.globalCompositeOperation = 'destination-out'; circ(x, 10, 21, 2); circ(x, 16, 20, 2.4); circ(x, 22, 21, 2); x.globalCompositeOperation = 'source-over'; };
  G.sakura = x => { for (let i = 0; i < 5; i++) { x.save(); x.translate(16, 16); x.rotate(i * PI * 2 / 5); x.beginPath(); x.ellipse(0, -8, 5, 7.5, 0, 0, PI * 2); x.fill(); x.restore(); } x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 3); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * PI * 2 / 5; poly(x, [[16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12], [16 + Math.cos(a - 0.2) * 16, 16 + Math.sin(a - 0.2) * 16], [16 + Math.cos(a + 0.2) * 16, 16 + Math.sin(a + 0.2) * 16]]); } x.globalCompositeOperation = 'source-over'; circ(x, 16, 16, 1.6); };
  G.snow = x => { for (let i = 0; i < 3; i++) { x.save(); x.translate(16, 16); x.rotate(i * PI / 3); line(x, [[0, -13], [0, 13]], 2.6); for (const sy of [-1, 1]) { line(x, [[-4, sy * 12], [0, sy * 8], [4, sy * 12]], 2); } x.restore(); } circ(x, 16, 16, 3); };
  G.palm = x => { x.lineWidth = 3.5; x.beginPath(); x.moveTo(13, 30); x.quadraticCurveTo(16, 20, 17, 11); x.stroke(); for (const [a, b, c, d] of [[17, 11, 3, 13], [17, 11, 29, 14], [17, 11, 8, 4], [17, 11, 26, 4]]) { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c) / 2, Math.min(b, d) - 6, c, d); x.quadraticCurveTo((a + c) / 2, Math.min(b, d) - 1, a, b + 2); x.fill(); } circ(x, 15, 13, 2); };
  G.lighthouse = x => { poly(x, [[12, 29], [20, 29], [18.5, 11], [13.5, 11]]); x.fillRect(12.5, 6, 7, 5); poly(x, [[11.5, 6], [16, 1.5], [20.5, 6]]); poly(x, [[20, 7], [31, 3], [31, 11]]); poly(x, [[12, 7], [1, 3], [1, 11]]); x.globalCompositeOperation = 'destination-out'; x.fillRect(12.5, 16, 7, 2.5); x.fillRect(12, 22, 8, 2.5); x.globalCompositeOperation = 'source-over'; };
  G.gear = x => { circ(x, 16, 16, 9.5); for (let i = 0; i < 8; i++) { x.save(); x.translate(16, 16); x.rotate(i * PI / 4); x.fillRect(-2.6, -14, 5.2, 6); x.restore(); } x.globalCompositeOperation = 'destination-out'; circ(x, 16, 16, 4); x.globalCompositeOperation = 'source-over'; };
  G.heart = x => { x.beginPath(); x.moveTo(16, 28); x.bezierCurveTo(1, 18, 4, 3, 16, 10); x.bezierCurveTo(28, 3, 31, 18, 16, 28); x.fill(); };
  G.wave = x => { x.lineWidth = 3.4; for (const y of [11, 19, 27]) { x.beginPath(); x.moveTo(2, y); x.bezierCurveTo(7, y - 7, 11, y - 7, 16, y); x.bezierCurveTo(21, y + 7 - 14, 25, y - 7, 30, y); x.stroke(); } };
  G.moon = x => { circ(x, 15, 16, 12); x.globalCompositeOperation = 'destination-out'; circ(x, 22, 11, 10); x.globalCompositeOperation = 'source-over'; circ(x, 25, 22, 1.2); circ(x, 27, 15, 0.9); };
  G.sun = x => { circ(x, 16, 16, 7); for (let i = 0; i < 8; i++) { const a = i * PI / 4; poly(x, [[16 + Math.cos(a - 0.22) * 9.5, 16 + Math.sin(a - 0.22) * 9.5], [16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15], [16 + Math.cos(a + 0.22) * 9.5, 16 + Math.sin(a + 0.22) * 9.5]]); } };
  G.notes = x => { x.beginPath(); x.ellipse(9, 25, 4.2, 3.2, -0.4, 0, PI * 2); x.fill(); x.beginPath(); x.ellipse(23, 22, 4.2, 3.2, -0.4, 0, PI * 2); x.fill(); x.fillRect(11.5, 7, 2.5, 18); x.fillRect(25.5, 4, 2.5, 18); poly(x, [[11.5, 7], [28, 4], [28, 9], [11.5, 12]]); };
  G.orbIcon = x => { circ(x, 16, 16, 11); x.globalCompositeOperation = 'destination-out'; x.lineWidth = 2; circ(x, 16, 16, 8, true); x.globalCompositeOperation = 'source-over'; circ(x, 13, 13, 2.5); };
  G.lootbox = x => { x.fillRect(4, 13, 24, 16); poly(x, [[2, 7], [30, 7], [30, 12], [2, 12]]); x.globalCompositeOperation = 'destination-out'; x.lineWidth = 2.5; circ(x, 16, 20, 4.5, true); x.fillRect(15, 14, 2, 5); x.fillRect(2, 12, 28, 1.2); x.globalCompositeOperation = 'source-over'; };
  G.shield = x => G.defense(x);
  G.cross = x => G.heal(x);
  G.flame = x => G.molten(x);

  const PICON = [
    ['owlogo', '#f99e1a', '#a04a00', '#ffffff'], ['diamond', '#3a7bd5', '#132c62', '#c8ecff'], ['star', '#f0c030', '#8a5a00', '#fff8d0'], ['shield', '#6a7a92', '#262e3c', '#e8f0fa'],
    ['skull', '#44444e', '#121216', '#f0f0e8'], ['cross', '#e84848', '#7a0c0c', '#ffffff'], ['bolt', '#6a4ad8', '#22145e', '#ffe060'], ['crown', '#9a2e9a', '#3a0c3a', '#ffd040'],
    ['sakura', '#f7b5c8', '#b0506e', '#fff4f8'], ['snow', '#8ac4f0', '#22507e', '#ffffff'], ['palm', '#3ab0a0', '#0c5650', '#fff2b8'], ['lighthouse', '#2a4a7a', '#0c1830', '#fff0b0'],
    ['gear', '#a8763e', '#4a2a0c', '#f8e0b8'], ['heart', '#ff6a8a', '#98183a', '#ffffff'], ['flame', '#ff7a20', '#801800', '#ffe060'], ['wave', '#30a0e0', '#083464', '#e0f6ff'],
    ['moon', '#2c2c62', '#08081e', '#f4f0c0'], ['sun', '#ffb030', '#c84808', '#fff8c8'], ['notes', '#4ec04e', '#145414', '#ffffff'], ['orbIcon', '#c8ccd4', '#5a606a', '#2e2e38']
  ];
  O.PLAYER_ICON_ART = PICON;

  O.playerIconArt = function (i, size) {
    const s = size || 64;
    const c = O.Tex.canvas(s, s);
    if (!c) return null;
    const x = c.getContext('2d');
    const [glyph, c0, c1, fg] = PICON[i % PICON.length];
    const k = s / 64;
    x.save(); x.scale(k, k);
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    x.fillStyle = g;
    x.beginPath(); x.moveTo(8, 2); x.lineTo(56, 2); x.lineTo(62, 8); x.lineTo(62, 56); x.lineTo(56, 62); x.lineTo(8, 62); x.lineTo(2, 56); x.lineTo(2, 8); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(6, 4, 52, 3);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(6, 57, 52, 3);
    for (let y = 8; y < 56; y += 4) { x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(4, y, 56, 1); }
    x.restore();
    O.drawIcon(x, glyph, s / 2 + s * 0.02, s / 2 + s * 0.03, s * 0.66, 'rgba(0,0,0,0.45)');
    O.drawIcon(x, glyph, s / 2, s / 2, s * 0.66, fg);
    return c;
  };
  const picCache = new Map();
  O.playerIconURL = function (i, size) {
    const key = i + ':' + size;
    if (picCache.has(key)) return picCache.get(key);
    const c = O.playerIconArt(i, size);
    const url = c ? c.toDataURL() : '';
    picCache.set(key, url);
    return url;
  };
  G.offense = x => { poly(x, [[4, 22], [20, 6], [26, 6], [26, 12], [10, 28]]); poly(x, [[4, 28], [2, 22], [10, 28]]); };
  G.defense = x => { poly(x, [[16, 3], [28, 8], [26, 20], [16, 29], [6, 20], [4, 8]]); };
  G.tank = x => { poly(x, [[4, 6], [28, 6], [28, 16], [16, 28], [4, 16]]); };
  G.support = x => { G.heal(x); };

  O.drawIcon = function (ctx, id, x, y, size, color) {
    const f = G[id] || G[O.HEROES[id] ? O.HEROES[id].role : 'star'] || G.star;
    ctx.save();
    ctx.translate(x - size / 2, y - size / 2);
    ctx.scale(size / 32, size / 32);
    ctx.fillStyle = color || '#fff';
    ctx.strokeStyle = color || '#fff';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    f(ctx);
    ctx.restore();
  };
  O.hasIcon = id => !!G[id];

  const iconCache = new Map();
  const canCache = new Map();
  O.iconCanvas = function (id, size, color) {
    const key = id + ':' + size + ':' + color;
    let c = canCache.get(key);
    if (c) return c;
    c = O.Tex.canvas(size, size);
    if (!c) return null;
    O.drawIcon(c.getContext('2d'), id, size / 2, size / 2, size * 0.9, color || '#fff');
    canCache.set(key, c);
    return c;
  };
  O.iconURL = function (id, size, color) {
    const key = id + ':' + size + ':' + color;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = O.Tex.canvas(size, size);
    if (!c) return '';
    const x = c.getContext('2d');
    O.drawIcon(x, id, size / 2, size / 2, size * 0.9, color || '#fff');
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
