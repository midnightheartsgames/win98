(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cast = window.HogwCast;
  const Track = window.HogwTrack;

  const ID = 'H4rryG3rm4n';
  const DURATION = 149.86;
  const FOV = 52;
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const SPEECH = [
    [0.00, 'herm', '002226553333336rFx9aEZIbAFHscegpaj98bjhhjaoe96430487669pa8imikg643enixmb'],
    [4.35, 'herm', 'fhc94iZvevl9tcmflBi99zwzuptcaim9fjbaxCKDnf778dDPsf'],
    [11.25, 'herm', '4224iTn8mmv9bie8gjdcqyDnela9523e986'],
    [13.20, 'herm', 'cAVVZODILJjahmjZRCmipZGyngc'],
    [14.75, 'volde', 'kca5849dGZPoZldZZZZI641643224hRQnebdiZYByKz'],
    [17.10, 'harry', '1112213866aks8588973aoovtf64'],
    [18.85, 'volde', '654332233knnXIdg78mgca4XNtHOBdnPXKmceHC226CTf96YQxpouKvd8'],
    [21.90, 'harry', '2111111124877a5gC653oKxme6hueh9643xKz'],
    [24.10, 'harry', '43222211142cauzpZmFsc95gHkqa7iZGGe6'],
    [25.90, 'harry', '321122122638ZLrgf8wZkkcjdgcr865bmb1523353alp8cFBf'],
    [28.30, 'volde', 'fba63322211137cde85BZYErobcef5eoggia73giACmDqFi9j8553jpjkl87542265bc933'],
    [32.10, 'harry', '4222358caikdag9ikbduAGf857fHj77sjaab437zKm986a875hmb6'],
    [34.90, 'herm', '775333ezZQZsZTjFkoe9JFVHZkeUJIVyoFjuPPubJZZZpiunh99blALYBlc87ewmhhxbb'],
    [38.40, 'harry', 'lsyzh79FBxifoleg74bkfbb55tsj'],
    [39.90, 'harry', '33211111pqgnmjld8o98p86aNAtINc8642'],
    [43.45, 'harry', '28rZZMZEplcdd8Om7987ZQtafustLsqu'],
    [45.15, 'herm', '85nfysuAVCyxrDHKyrCrDkmdbyyKzrjbmpx'],
    [47.80, 'ron', '224tSxmb9ILysGaKliRsmZlmlLZsk'],
    [49.50, 'herm', 'XyuSRVCEwl'],
    [51.80, 'ron', 'ld9ZAEKlrCyZrmZIPEdhTyBGFmjrmomfvktnkTkelBMw'],
    [53.90, 'herm', 'MwxqYBiHyFDZSrb7ehfa73oxnkyCUvyLmXCpmhmBKutvnenhFnWusSkuadBOF'],
    [56.90, 'ron', 'FZZLCXIoehrUZTulFLvGOzhduEb6EKIDmtwCqccjZUnmnRlwK'],
    [59.35, 'ron', 'UQPyeDDMMHjNxrfdOrT'],
    [60.20, 'herm', 'rTXNQAD6334999798NZUOJvsCSPJMuAJR'],
    [61.80, 'herm', 'RIxeiKfbeZQypptDVMynALSvjk'],
    [63.00, 'volde', 'jkwEmcakdxHLMtqHKzneltyniYWNIquLiQqecHZyrAmtCtKqhhZZFtmJ'],
    [65.85, 'volde', 'aa44hZZpcKwZCyCrhuUMeeClb9rAqZIoKLCbabJGIgdtBmticb53gsJecc64'],
    [69.65, 'harry', '233jgjtkbq77nCyneaf9bb68eelsJCfz'],
    [71.30, 'volde', 'Exmc8335j'],
    [71.90, 'harry', 'acb8c64nDfakfib5dlme76dkhjmg87ddia7'],
    [73.75, 'harry', '321543af88sAjifcejb6uCb7ce9bkhb7'],
    [75.35, 'harry', '5eBOwvrJ'],
    [77.65, 'volde', 'RsqZKPBrh95ezZKnZShZtIjbZCvHXBi9CDw'],
    [79.50, 'harry', '5427a69dc6fGwAobif7jkdbk6e56e5eNyg9jK'],
    [81.40, 'ron', 'ouDLUGF'],
    [82.00, 'harry', 'RPKKAzEDzSCqhaieimDf99kb543glb7'],
    [83.60, 'volde', '4iGJDngZGoKDUCmshmibSPfcdnba5aphi'],
    [85.15, 'harry', 'hidnjjbhlbhje9DnqVj8wzCp95'],
    [87.00, 'harry', '249q74xEHejciBw7bAryDndazJC32dj864xMogimdcukpk9wAhijbjnw85gHFPJhfgC'],
    [90.55, 'volde', 'bLQxBBECtjlutVToWCzMJGZMriKAZqNJhia27LtumiwnTGSSSNJRICqfei'],
    [93.65, 'harry', '4322jkveiQILnbfffoq7c543hrxzi955BKh867uWrpq9633kPJSfG'],
    [96.30, 'harry', 'e7743hpskQQqysBtojovUuilwArvlivZwmrumBja9'],
    [98.45, 'volde', '56hcegk99mlhb76eZZgoQAf9532fXzpZSy'],
    [100.30, 'harry', 'l9785qCrClcZitRrnlzcNRoFfcQGkcWBhaFGvbce7'],
    [102.30, 'harry', '7535eblGDDnifa6DJ3dg86eKQCg'],
    [103.60, 'harry', 'gahVSItpfgice5fkAQPHBnda'],
    [104.70, 'volde', 'da7742gskgCZRmEmIwd9emdUOFKlcjoc8aHGVAoc8'],
    [106.75, 'harry', 'gdjOnCFkGzPwpmJkna5dUApknioKSjwkasEnri8aqg'],
    [114.65, 'herm', 'j8944aa75eok'],
    [117.80, 'volde', '31111111nUZZUKssieZHXKs'],
    [119.25, 'herm', '45aowFHMPPJOQTUxGNMQFvYGZSGzxritvJKyngbik9joGWpfmojvCekHqblhbboqOie'],
    [122.85, 'ron', '4xFEoBZIkwiaHwfogjCSRIJuhjrNjfasIlb8'],
    [124.70, 'herm', '622223mnjug9FOxeFBDIHlmmmahbc9c7sEnngetph533b4fmlc'],
    [127.70, 'harry', '6aee89jc9bc542334222'],
    [128.70, 'volde', '11133jsWear8jgRHkdrOFDgkdQqamrZSjaa96444699b'],
    [130.85, 'volde', 'b78aegkmld943'],
    [131.40, 'ron', '4333blsvmgl8732225446fyo'],
    [132.80, 'harry', '2222222nypebhb5a86jd95'],
    [133.95, 'herm', '221123322348ZftdpjzEdcc86gha44839'],
    [136.50, 'herm', '11cDfehtEd5uhzZAeja7rxd8f5xh653nc']
  ];

  function speechAt(t) {
    for (const [t0, who, str] of SPEECH) {
      const x = (t - t0) * 20;
      if (x < 0 || x >= str.length - 1) continue;
      const i = Math.floor(x);
      const a = Math.max(0, ALPHA.indexOf(str[i])) / 61, b = Math.max(0, ALPHA.indexOf(str[i + 1])) / 61;
      return { who, v: lerp(a, b, x - i) };
    }
    return { who: '', v: 0 };
  }

  function VOICE(t) {
    return speechAt(t).v;
  }

  function mouthOf(who, t) {
    const s = speechAt(t);
    if (s.who !== who) return 'shut';
    return s.v < 0.14 ? 'shut' : s.v < 0.55 ? 'open' : 'wide';
  }

  function blink(t, seed) {
    const p = 2.9 + (seed % 5) * 0.41;
    return ((t + seed * 0.73) % p) < 0.13;
  }

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h * 0.5;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h * 0.5;
    return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }

  function track(keys) {
    const full = [];
    let cur = {};
    keys.forEach(([t, v]) => {
      cur = Object.assign({}, cur, v);
      full.push([t, cur]);
    });
    const num = (x) => typeof x === 'number';
    return (t) => {
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      const n = full.length;
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const out = {};
      Object.keys(a).forEach(key => {
        const va = a[key], vb = b[key];
        if (num(va) && num(vb)) {
          const vz = num(z[key]) ? z[key] : va, vc = num(c[key]) ? c[key] : vb;
          out[key] = hermite(vz, va, vb, vc, i - 2 >= 0 ? t0 : t1 - 1, t1, t2, i + 1 < n ? t3 : t2 + 1, t);
        } else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && num(va[0])) {
          const za = Array.isArray(z[key]) && z[key].length === va.length ? z[key] : va;
          const cb = Array.isArray(c[key]) && c[key].length === vb.length ? c[key] : vb;
          out[key] = va.map((x, j) => hermite(za[j], x, vb[j], cb[j], i - 2 >= 0 ? t0 : t1 - 1, t1, t2, i + 1 < n ? t3 : t2 + 1, t));
        } else {
          out[key] = va;
        }
      });
      Object.keys(b).forEach(key => { if (!(key in out)) out[key] = b[key]; });
      return out;
    };
  }

  function W(base, yaw, v) {
    const c = C(yaw), s = S(yaw);
    return [base[0] + v[0] * c + v[2] * s, base[1] + v[1], base[2] - v[0] * s + v[2] * c];
  }

  const SEAT = {
    harry: [-2.6, -2.25],
    herm: [-2.6, -0.25],
    reader: [-1.2, 0.35],
    hermBack: [-2.6, 1.75]
  };

  const HAND = {
    desk: [[0.15, 0.25, 0.4], [-0.15, 0.25, 0.4]],
    lap: [[0.13, 0.04, 0.3], [-0.13, 0.04, 0.3]],
    side: [[0.22, -0.18, 0.04], [-0.22, -0.18, 0.04]],
    hold: [[0.11, 0.42, 0.36], [-0.11, 0.42, 0.36]],
    read: [[0.13, 0.3, 0.4], [-0.13, 0.3, 0.4]],
    knees: [[0.16, -0.02, 0.36], [-0.16, -0.02, 0.36]]
  };

  const HARRY = track([
    [0, { mode: 'sit', at: SEAT.harry, yaw: PI / 2, bend: 0.06, twist: 0.1, look: 'herm', nko: [0, 0, 0], hL: HAND.desk[0], hR: HAND.desk[1], gL: 'relax', gR: 'relax', hatOff: 0 }],
    [3.6, { look: 'herm', nko: [0.05, 0, 0] }],
    [6.5, { look: 'herm', nko: [0.0, -0.1, 0.05] }],
    [6.9, { look: 'cam', nko: [0, 0, 0] }],
    [8.6, { look: 'cam', nko: [0.1, 0, 0] }],
    [10.2, { look: 'volde', nko: [0, 0, 0] }],
    [17.6, { look: 'volde', nko: [0, 0.15, 0] }],
    [19.0, { look: 'cam', nko: [0, 0.1, 0] }],
    [23.5, { look: 'volde', nko: [0, 0.25, 0.05] }],
    [25.0, { look: 'cam', nko: [-0.05, 0.1, 0] }],
    [26.3, { look: 'volde', nko: [0, 0.3, 0] }],
    [27.6, { look: 'cam', nko: [0, 0, 0] }],
    [33.2, { look: 'herm', nko: [0, -0.1, 0] }],
    [34.2, { look: 'cam', nko: [0, 0, 0] }],
    [37.0, { look: 'herm', nko: [0, 0, 0] }],
    [39.6, { look: 'cam', nko: [-0.05, 0, -0.15] }],
    [41.0, { look: 'owl', nko: [0, 0, 0] }],
    [43.0, { look: 'letter', nko: [0.05, 0, 0], hL: [0.12, 0.36, 0.36], hR: [-0.12, 0.34, 0.38], gL: 'grip', gR: 'grip' }],
    [44.3, { look: 'cam', nko: [0, 0, 0] }],
    [44.9, { look: 'letter', hL: [0.13, 0.33, 0.38], hR: [-0.11, 0.31, 0.4] }],
    [47.4, { look: 'letter', nko: [0.05, 0, 0] }],
    [49.4, { look: 'herm', nko: [0, 0, 0] }],
    [49.9, { look: 'cam', nko: [0, 0, 0] }],
    [50.7, { look: 'letter', nko: [0, 0, 0] }],
    [53.2, { look: 'letter', nko: [0.1, 0.05, 0] }],
    [55.0, { look: 'letter', nko: [0.15, 0, 0] }],
    [58.6, { look: 'ron', nko: [0, 0, 0] }],
    [60.2, { look: 'herm', nko: [0, 0, 0], hL: HAND.desk[0], hR: HAND.desk[1], gL: 'relax', gR: 'relax' }],
    [64.0, { look: 'volde' }],
    [69.95, { look: 'volde', hatOff: 0 }],
    [70.55, { hatOff: 1, nko: [-0.15, 0.1, 0] }],
    [71.2, { look: 'volde', nko: [0, 0, 0], hR: [-0.32, 0.3, 0.42], gR: 'open' }],
    [72.8, { hR: [-0.3, 0.28, 0.46], gR: 'open' }],
    [73.3, { hR: [-0.22, 0.56, 0.36], gR: 'grip', look: 'volde' }],
    [74.2, { hR: [-0.18, 0.62, 0.42], nko: [0, 0.1, 0] }],
    [76.0, { hR: [-0.16, 0.4, 0.4] }],
    [80.4, { look: 'volde', hR: [-0.14, 0.44, 0.36] }],
    [85.9, { look: 'diary', hL: [0.12, 0.37, 0.33], hR: [-0.12, 0.37, 0.33], gL: 'grip', gR: 'grip', nko: [0.12, 0, 0] }],
    [90.2, { look: 'cam', nko: [0, 0, 0] }],
    [90.8, { look: 'volde' }],
    [94.6, { look: 'diary', nko: [0.12, 0, 0] }],
    [96.2, { look: 'cam', nko: [0, 0, 0] }],
    [97.0, { look: 'volde' }],
    [100.5, { look: 'volde', bend: -0.12, hL: [0.13, 0.36, 0.5], hR: [-0.13, 0.36, 0.5], twist: 0.0, gL: 'grip', gR: 'grip' }],
    [101.2, { bend: -0.3, hL: [0.12, 0.38, 0.58], hR: [-0.12, 0.38, 0.58], look: 'cam' }],
    [102.0, { bend: -0.05, hL: [0.12, 0.36, 0.44], hR: [-0.12, 0.36, 0.44], look: 'volde' }],
    [103.0, { bend: -0.25, hL: [0.12, 0.38, 0.56], hR: [-0.12, 0.38, 0.56] }],
    [105.0, { bend: -0.1, hL: [0.12, 0.38, 0.46], hR: [-0.12, 0.38, 0.46], look: 'cam' }],
    [106.4, { bend: -0.28, hL: [0.12, 0.4, 0.58], hR: [-0.12, 0.4, 0.58], look: 'volde' }],
    [107.5, { bend: 0.06, hL: HAND.desk[0], hR: HAND.desk[1], gL: 'relax', gR: 'relax' }],
    [108.6, { look: 'volde', hR: [-0.25, 0.36, 0.42], gR: 'open' }],
    [109.4, { hR: HAND.desk[1], gR: 'relax' }],
    [112.9, { look: 'volde', hR: [-0.2, 0.6, 0.14], gR: 'fig', nko: [0, 0, 0.1] }],
    [113.5, { hR: [-0.21, 0.68, 0.12], gR: 'fig', hL: [0.16, 0.5, 0.26], gL: 'fig' }],
    [114.6, { hR: [-0.19, 0.65, 0.14], hL: [0.17, 0.52, 0.25] }],
    [115.3, { hL: [0.2, 0.7, 0.44], hR: [-0.08, 0.6, 0.46], fig: 1 }],
    [118.2, { fig: 1 }],
    [118.4, { fig: 0 }],
    [119.3, { hR: HAND.desk[1], hL: HAND.desk[0], gR: 'relax', gL: 'relax', look: 'herm' }],
    [127.5, { look: 'volde' }],
    [133.0, { look: 'herm' }]
  ]);

  const HERM = track([
    [0, { mode: 'sit', at: SEAT.herm, yaw: 2.05, bend: 0.06, twist: -0.1, look: 'harry', nko: [0, 0, 0], hL: [0.14, 0.27, 0.42], hR: [-0.1, 0.3, 0.4], gL: 'relax', gR: 'grip', pencil: 1 }],
    [1.0, { hR: [-0.12, 0.36, 0.36] }],
    [2.4, { hR: [-0.1, 0.3, 0.4] }],
    [9.0, { look: 'volde', nko: [0, 0, 0] }],
    [13.0, { look: 'harry' }],
    [22.0, { look: 'volde' }],
    [24.0, { look: 'harry' }],
    [30.4, { look: 'harry', nko: [-0.05, 0, 0] }],
    [32.6, { look: 'harry', yaw: 2.05 }],
    [35.4, { look: 'front', yaw: 1.62, twist: 0, nko: [0, 0, 0] }],
    [36.4, { look: 'front', yaw: 1.62 }],
    [37.0, { look: [-1.9, 1.15, -2.2], yaw: 1.9, twist: -0.35 }],
    [39.4, { look: 'harry' }],
    [40.0, { look: 'owl' }],
    [45.0, { look: 'harry', yaw: 2.05, twist: -0.1, pencil: 0 }],
    [48.3, { mode: 'sit', at: SEAT.herm }],
    [48.55, { mode: 'stand', at: [-2.45, -0.62], yaw: 2.8, look: 'letter', bend: 0.1, hL: HAND.side[0], hR: HAND.side[1], gR: 'relax' }],
    [49.05, { at: [-2.35, -1.1], yaw: 3.0, bend: 0.3, hR: [-0.2, 0.32, 0.5], gR: 'open', look: 'letter' }],
    [49.7, { at: [-2.35, -1.12], bend: 0.35, hR: [-0.18, 0.3, 0.58], hL: [0.18, 0.3, 0.2] }],
    [50.4, { at: [-2.2, -0.6], yaw: 2.5, bend: 0.05, hR: HAND.side[1], hL: HAND.side[0], gR: 'relax', look: 'harry' }],
    [51.7, { at: [-1.75, 1.85], yaw: 3.3, look: 'harry' }],
    [53.0, { at: [-2.05, 1.55], yaw: 3.25, look: 'harry' }],
    [55.6, { at: [-2.15, 1.45], yaw: 3.1, look: 'ron', hR: [-0.18, 0.12, 0.2], hL: [0.22, -0.08, 0.1] }],
    [57.0, { look: 'cam', hR: [-0.25, 0.25, 0.25], gR: 'open' }],
    [58.0, { look: 'ron', hR: HAND.side[1], gR: 'relax' }],
    [59.9, { at: [-2.3, -0.75], yaw: 3.3, bend: 0.2, look: 'ron', hR: [-0.15, 0.45, 0.45], hL: [0.15, 0.45, 0.45], gR: 'open', gL: 'open' }],
    [60.8, { at: [-2.45, -1.05], bend: 0.3, hR: [-0.1, 0.5, 0.55], hL: [0.2, 0.55, 0.5], gR: 'fist', gL: 'open' }],
    [61.4, { at: [-2.35, -0.9], bend: 0.15, hR: [-0.2, 0.4, 0.4], hL: [0.18, 0.45, 0.5] }],
    [62.0, { at: [-2.4, -0.85], yaw: 3.4, bend: 0.0, look: 'ron', hR: [-0.25, 0.2, 0.25], hL: [0.22, 0.05, 0.12], gR: 'open', gL: 'relax' }],
    [63.5, { at: [-2.1, -0.4], yaw: 2.6, look: 'volde', hR: HAND.side[1], hL: HAND.side[0], gR: 'relax' }],
    [65.0, { mode: 'stand', at: [-1.7, 1.6], yaw: 3.1, look: 'volde' }],
    [88.4, { mode: 'stand', at: [-1.75, 1.75], yaw: 4.4, look: 'harry', walk: 1 }],
    [89.6, { at: [-2.45, 1.2], yaw: 3.9, walk: 0 }],
    [92.0, { at: [-2.5, 1.1] }],
    [106.8, { at: [-2.5, 1.1], look: 'volde' }],
    [112.0, { mode: 'sit', at: SEAT.hermBack, yaw: 1.85, bend: 0.06, look: 'volde', hL: HAND.desk[0], hR: HAND.desk[1] }],
    [116.0, { look: 'harry', smile: 1 }],
    [118.5, { smile: 0 }],
    [119.2, { look: 'harry', nko: [0, 0, 0] }],
    [121.2, { look: 'cam' }],
    [124.6, { look: 'ron', nko: [-0.15, 0, 0] }],
    [127.3, { look: 'ron' }],
    [131.8, { look: 'desk', nko: [0.2, 0, 0], sad: 1 }],
    [133.2, { mode: 'cry', at: SEAT.hermBack, yaw: 1.65, look: 'desk', bend: 0.0, sad: 1 }]
  ]);

  const RON = track([
    [0, { mode: 'hide', at: [-1.2, -1.0], yaw: -1.2, bend: 0, crouch: 0, twist: 0, look: 'harry', nko: [0, 0, 0], hL: HAND.side[0], hR: HAND.side[1], gL: 'relax', gR: 'relax' }],
    [45.55, { mode: 'stand', at: [-1.65, -0.9], yaw: -1.9, bend: 0.5, look: 'letter', hL: HAND.knees[0], hR: HAND.knees[1] }],
    [46.3, { at: [-2.2, -1.4], yaw: 2.4, bend: 0.55, look: 'letter', hL: [0.18, 0.05, 0.4], hR: [-0.18, 0.1, 0.4] }],
    [47.2, { at: [-2.42, -1.62], yaw: 2.6, bend: 0.7, crouch: 0.2, twist: 0, look: 'letter' }],
    [48.0, { look: 'cam', nko: [-0.1, 0, 0] }],
    [48.6, { look: 'letter', nko: [0, 0, 0] }],
    [50.3, { at: [-2.4, -1.55], yaw: 2.7, bend: 0.85, twist: 0.2, hR: [-0.05, 0.25, 0.75], gR: 'open', look: 'letter' }],
    [51.6, { at: [-2.42, -1.62], yaw: 2.6, bend: 0.7, crouch: 0.2, twist: 0, hR: [-0.18, 0.1, 0.4], gR: 'relax' }],
    [55.6, { look: 'herm' }],
    [57.2, { look: 'cam', nko: [-0.2, 0, 0], bend: 0.65 }],
    [58.4, { look: 'harry', nko: [0, 0, 0], bend: 0.7 }],
    [59.9, { at: [-2.55, -1.3], yaw: -0.3, bend: 0.35, crouch: 0, look: 'herm', hL: [0.2, 0.3, 0.3], hR: [-0.2, 0.3, 0.3], gL: 'open', gR: 'open' }],
    [61.0, { at: [-2.6, -1.4], yaw: -0.2, bend: 0.4, twist: 0.3 }],
    [62.0, { at: [-2.55, -1.35], yaw: 0.1, bend: 0.5, look: 'herm', hL: [0.25, 0.5, 0.2], hR: [-0.2, 0.2, 0.4] }],
    [63.6, { at: [-2.85, -1.6], yaw: -1.4, bend: 0.4, look: 'harry', hL: HAND.side[0], hR: HAND.side[1], gL: 'relax', gR: 'relax' }],
    [69.6, { at: [-3.05, -2.0], yaw: -1.55, bend: 0.1, look: 'volde', hR: [-0.12, 0.55, 0.42], gR: 'grip' }],
    [70.4, { hR: [-0.25, 0.9, 0.2], gR: 'grip' }],
    [71.2, { hR: HAND.side[1], gR: 'relax' }],
    [79.5, { at: [-3.1, -1.95], yaw: -1.45, bend: 0.25, look: 'harry' }],
    [85.9, { at: [-2.48, -1.65], yaw: 2.6, bend: 0.8, crouch: 0.3, twist: 0, look: 'diary', hL: [0.18, 0.05, 0.4], hR: [-0.18, 0.1, 0.4] }],
    [96.7, { look: 'volde', bend: 0.4, crouch: 0 }],
    [97.0, { mode: 'hide', at: [-3.55, -1.15], yaw: 0.9, bend: 0.05, crouch: 0, hL: HAND.side[0], hR: HAND.side[1] }],
    [111.6, { mode: 'stand', at: [-3.55, -1.15], yaw: 0.9, bend: 0.05, look: 'harry' }],
    [119.0, { at: [-2.2, 2.4], yaw: 3.9, look: 'herm' }],
    [122.0, { at: [-2.25, 2.35], yaw: 4.2, look: 'harry', hR: [-0.2, 0.3, 0.3], gR: 'open' }],
    [124.6, { look: 'herm', hR: HAND.side[1], gR: 'relax' }],
    [133.2, { at: [-3.05, 2.05], yaw: 2.0, bend: 0.35, look: 'herm', hL: [0.12, 0.42, 0.45], gL: 'open', pat: 1 }],
    [141.5, { mode: 'perch', at: [-2.1, 0.25], yaw: 0.0, bend: 0.05, look: 'cam', pat: 0, hL: [0.3, 0.45, 0.2], hR: [-0.3, 0.45, 0.2], gL: 'open', gR: 'open' }],
    [142.1, { hL: [0.34, 0.6, 0.25], hR: [-0.36, 0.55, 0.18] }],
    [142.4, { mode: 'stand', at: [-3.05, 2.05], yaw: 2.0, bend: 0.35, look: 'herm', hL: [0.12, 0.42, 0.45], hR: HAND.side[1], gL: 'open', gR: 'relax', pat: 1 }]
  ]);

  const VOLDE = track([
    [0, { mode: 'hide', at: [-3.4, 1.4], yaw: 3.0, bend: 0.05, twist: 0, look: 'harry', nko: [0, 0, 0], hL: HAND.side[0], hR: HAND.side[1], gL: 'relax', gR: 'relax', diary: 0 }],
    [9.2, { mode: 'stand', at: [-3.35, 0.9], yaw: 3.0, walk: 1 }],
    [10.6, { at: [-3.15, -1.1], yaw: 2.62, walk: 0, look: 'harry', nko: [0.15, 0, 0.3] }],
    [13.5, { nko: [0.1, -0.1, 0.4] }],
    [16.5, { nko: [0.05, 0, 0.25] }],
    [20.2, { nko: [0.1, 0.05, 0.15] }],
    [28.6, { nko: [0.0, 0, 0.35] }],
    [31.0, { mode: 'hide', at: [-3.45, 1.1], nko: [0, 0, 0.1] }],
    [63.6, { mode: 'stand', at: [-3.4, -0.4], yaw: 2.4 }],
    [64.4, { at: [-3.35, -0.5], yaw: 2.4, look: 'harry', nko: [0, 0.3, 0] }],
    [66.0, { look: 'harry' }],
    [67.6, { look: 'cam', nko: [0, -0.2, 0] }],
    [68.6, { look: 'harry', nko: [0, 0, 0] }],
    [76.6, { at: [-3.45, 0.25], yaw: 2.9, look: 'harry', nko: [0, 0, 0.05] }],
    [77.9, { hR: [-0.22, 0.45, 0.3], gR: 'point' }],
    [78.6, { hR: [-0.18, 0.62, 0.32], gR: 'point' }],
    [79.4, { hR: HAND.side[1], gR: 'relax' }],
    [83.5, { nko: [0, 0.3, 0] }],
    [85.0, { nko: [0, 0, 0] }],
    [91.3, { at: [-3.45, 0.3], yaw: 2.9, look: 'ceil', nko: [-0.2, 0, 0] }],
    [93.0, { look: 'harry', nko: [0, 0, 0] }],
    [96.9, { at: [-3.6, 0.9], yaw: 2.6, walk: 1 }],
    [97.8, { at: [-3.3, -0.55], yaw: 2.75, walk: 0, smile: 1 }],
    [100.0, { at: [-3.25, -0.75], smile: 0 }],
    [100.6, { at: [-1.62, -2.2], yaw: 4.71, bend: 0.4, hL: [0.12, 0.36, 0.52], hR: [-0.12, 0.36, 0.52], gL: 'grip', gR: 'grip', look: 'diary' }],
    [101.4, { at: [-1.55, -2.2], bend: 0.2 }],
    [102.3, { at: [-1.62, -2.2], bend: 0.38 }],
    [103.4, { at: [-1.5, -2.2], bend: 0.15, look: 'harry' }],
    [105.0, { at: [-1.6, -2.2], bend: 0.32 }],
    [106.4, { at: [-1.45, -2.2], bend: 0.1 }],
    [107.6, { at: [-1.4, -2.15], bend: 0.05, hL: HAND.side[0], hR: [-0.2, 0.0, 0.2], gL: 'relax', gR: 'grip', diary: 1, look: 'harry' }],
    [110.0, { at: [-1.75, -1.4], yaw: 0.9, look: 'front' }],
    [111.9, { at: [-2.2, -0.9], yaw: 1.6 }],
    [115.2, { at: [-2.75, -1.72], yaw: 2.5, bend: 0.5, look: 'harry', nko: [0, 0, 0] }],
    [117.8, { at: [-2.95, -1.4], bend: 0.3 }],
    [119.2, { at: [-2.95, -1.4], bend: 0.05, look: 'harry' }],
    [125.0, { at: [-3.0, -0.8], yaw: 0.2, bend: 0.05, look: 'front', walk: 1 }],
    [127.6, { at: [-3.15, 2.4], yaw: 0.05, walk: 0, look: 'diary', nko: [0.0, 0, 0], hR: [-0.1, 0.44, 0.32], gR: 'grip' }],
    [129.5, { look: 'diary', nko: [0.08, 0.2, 0] }],
    [130.8, { look: 'harry', nko: [0, 0, 0] }],
    [131.6, { look: 'diary', nko: [0.08, 0, 0] }]
  ]);

  const READER = track([
    [0, { mode: 'sit', at: SEAT.reader, yaw: PI / 2, bend: 0.12, twist: 0, look: 'book', nko: [0.1, 0, 0], hL: [0.12, 0.33, 0.36], hR: [-0.12, 0.33, 0.36], gL: 'grip', gR: 'grip' }],
    [38.0, { look: 'harry', nko: [0, 0, 0] }],
    [39.3, { look: 'book', nko: [0.1, 0, 0] }],
    [62.5, { look: 'herm', nko: [0, 0, 0] }],
    [64.0, { look: 'book', nko: [0.1, 0, 0] }]
  ]);

  const TRACKS = { harry: HARRY, herm: HERM, ron: RON, volde: VOLDE, reader: READER };
  const SEEDS = { harry: 1, herm: 2, ron: 3, volde: 4, reader: 5 };

  function pelvisHeight(who) {
    const D = Cast.BODY[who];
    return D.thigh + D.shin + 0.06;
  }

  function bodyPose(who, k, t) {
    const yaw = k.yaw;
    const base = [k.at[0], 0, k.at[1]];
    const pose = { stand: k.mode !== 'sit' && k.mode !== 'cry' && k.mode !== 'perch' };
    let p;
    if (k.mode === 'sit' || k.mode === 'cry') {
      p = [k.at[0], 0.55, k.at[1]];
      pose.fLw = W(p, yaw, [0.13, -0.47, 0.46]);
      pose.fRw = W(p, yaw, [-0.13, -0.47, 0.46]);
      pose.kLw = W(p, yaw, [0.2, 0.3, 1.0]);
      pose.kRw = W(p, yaw, [-0.2, 0.3, 1.0]);
    } else if (k.mode === 'perch') {
      p = [k.at[0], 0.82, k.at[1]];
      pose.fLw = W(p, yaw, [0.16, -0.74, 0.36]);
      pose.fRw = W(p, yaw, [-0.16, -0.74, 0.3]);
      pose.kLw = W(p, yaw, [0.22, 0.3, 1.0]);
      pose.kRw = W(p, yaw, [-0.22, 0.3, 1.0]);
    } else {
      const ph = t * 6.2;
      const walk = clamp(k.walk || 0, 0, 1);
      const bob = walk * Math.abs(C(ph)) * 0.025;
      p = [k.at[0], pelvisHeight(who) - k.bend * 0.12 - (k.crouch || 0) + bob, k.at[1]];
      const stride = 0.22 * walk;
      pose.fLw = W(base, yaw, [0.12, 0.08 + Math.max(0, S(ph)) * 0.08 * walk, S(ph) * stride + 0.02]);
      pose.fRw = W(base, yaw, [-0.12, 0.08 + Math.max(0, -S(ph)) * 0.08 * walk, -S(ph) * stride + 0.02]);
      pose.kLw = W(base, yaw, [0.15, 0.5, 1.2]);
      pose.kRw = W(base, yaw, [-0.15, 0.5, 1.2]);
    }
    pose.p = p;
    pose.fwd = [S(yaw), 0, C(yaw)];
    pose.up = [0, 1, 0];
    const breathe = S(t * 1.7 + SEEDS[who]) * 0.012;
    pose.sp = [k.bend + breathe, k.twist || 0, k.tilt || 0];
    if (k.mode === 'cry') pose.sp = [1.05 + S(t * 7.5) * 0.03, 0, 0.05];
    pose.hLw = W(p, yaw, k.hL);
    pose.hRw = W(p, yaw, k.hR);
    pose.eLw = W(p, yaw, [0.55, 0.05, -0.25]);
    pose.eRw = W(p, yaw, [-0.55, 0.05, -0.25]);
    if (k.mode === 'cry') {
      pose.hLw = W(p, yaw, [0.16, 0.24, 0.48]);
      pose.hRw = W(p, yaw, [-0.12, 0.24, 0.5]);
      pose.eLw = W(p, yaw, [0.5, 0.2, 0.3]);
      pose.eRw = W(p, yaw, [-0.5, 0.2, 0.3]);
    }
    pose.gL = k.gL;
    pose.gR = k.gR;
    return pose;
  }

  function chestAxes(m) {
    const c = m.chest;
    return { x: [c[0], c[1], c[2]], y: [c[4], c[5], c[6]], z: [c[8], c[9], c[10]] };
  }

  function lookAngles(m, target) {
    const neck = M4.point(m.neck, [0, 0.12, 0.04]);
    const d = V3.norm(V3.sub(target, neck));
    const a = chestAxes(m);
    const lx = V3.dot(d, a.x), ly = V3.dot(d, a.y), lz = V3.dot(d, a.z);
    const yaw = Math.atan2(lx, lz);
    const pitch = -Math.atan2(ly, Math.hypot(lx, lz));
    return [clamp(pitch * 0.6, -0.32, 0.6), clamp(yaw, -1.25, 1.25)];
  }

  function targetOf(name, cast, cam, who) {
    if (Array.isArray(name)) return name;
    const at = (w) => cast[w] && cast[w].m ? cast[w].m.pts.head : null;
    if (name === 'cam') return cam ? cam.eye : null;
    if (name === 'front') {
      const k = cast[who].k;
      return [k.at[0] + S(k.yaw) * 3, 1.2, k.at[1] + C(k.yaw) * 3];
    }
    if (name === 'desk' || name === 'book') {
      const k = cast[who].k;
      return [k.at[0] + S(k.yaw) * 0.45, 0.8, k.at[1] + C(k.yaw) * 0.45];
    }
    if (name === 'ceil') {
      const k = cast[who].k;
      return [k.at[0] + S(k.yaw) * 1.2, 3.0, k.at[1] + C(k.yaw) * 1.2];
    }
    if (name === 'diary' && cast.volde && !cast.volde.hidden && cast.volde.k.diary > 0.5 && cast.volde.m) return cast.volde.m.pts.wristR;
    if (name === 'letter' || name === 'diary') {
      const h = cast.harry && cast.harry.m;
      if (!h) return null;
      return V3.lerp(h.pts.wristL, h.pts.wristR, 0.5);
    }
    if (name === 'owl') return OWL(cast.t);
    return at(name);
  }

  function owlPos(t) {
    const u = clamp((t - 40.9) / 0.6, 0, 1);
    const bob = S(t * 9) * 0.04 + S(t * 4.1) * 0.03;
    return [lerp(-1.4, -2.05, ease(u)) + S(t * 3) * 0.04, 1.62 + bob + (1 - ease(u)) * 0.25, -2.72];
  }

  function OWL(t) {
    return owlPos(t);
  }

  function solveCast(t, cam) {
    const cast = { t };
    Object.keys(TRACKS).forEach(who => {
      const k = TRACKS[who](t);
      cast[who] = { k, hidden: k.mode === 'hide' };
    });
    const order = ['harry', 'herm', 'ron', 'volde', 'reader'];
    order.forEach(who => {
      const c = cast[who];
      if (c.hidden) return;
      c.pose = bodyPose(who, c.k, t);
      c.pose.nk = [0, 0, 0];
      c.m = Cast.solve(who, c.pose);
    });
    order.forEach(who => {
      const c = cast[who];
      if (c.hidden) return;
      const tgt = targetOf(c.k.look, cast, cam, who);
      const base = tgt ? lookAngles(c.m, tgt) : [0, 0];
      const o = c.k.nko || [0, 0, 0];
      c.pose.nk = [base[0] + o[0], base[1] + o[1], o[2]];
      if (c.k.mode === 'cry') c.pose.nk = [0.55, 0.0, 0.15];
      c.m = Cast.solve(who, c.pose);
      const eyes = blink(t, SEEDS[who]) ? 'shut' : (c.k.mode === 'cry' || c.k.sad ? 'half' : 'open');
      c.pose.eyes = eyes;
      c.pose.mouth = c.k.smile ? 'smile' : mouthOf(who, t);
    });
    if (!cast.harry.hidden) {
      const off = clamp(cast.harry.k.hatOff, 0, 1);
      cast.harry.pose.hat = off < 0.999;
      if (off > 0.001) {
        const hm = Cast.hatMatrix(cast.harry.m, {});
        cast.harry.pose.hatM = M4.chain(M4.translate(-0.25 * off, 0.45 * off, -0.1 * off), hm, M4.rotX(-0.9 * off), M4.rotZ(0.6 * off));
      }
    }
    return cast;
  }

  const SHOTS = [
    [0.0, 2.95, 'herm', { az: 2.53, el: -0.05 }],
    [3.95, 8.85, 'harry', { az: 0.48, el: -0.08 }],
    [9.4, 10.75, 'legs', {}],
    [10.75, 17.4, 'volde', { az: 2.52, el: -0.62, rollK: 0.55 }],
    [18.0, 19.4, 'harry', { az: 0.51, el: -0.18 }],
    [20.25, 22.0, 'volde', { az: 2.50, el: -0.55, rollK: 0.6 }],
    [22.45, 23.1, 'herm', { az: 2.96, el: -0.05 }],
    [23.45, 27.75, 'harry', { az: 1.11, el: -0.45, rollK: 0.8 }],
    [28.7, 29.7, 'volde', { az: 2.62, el: -0.85, rollK: 0.8 }],
    [30.65, 32.75, 'herm', { az: 2.78, el: -0.35 }],
    [33.0, 35.7, 'harry', { az: 0.57, el: -0.12 }],
    [36.85, 40.12, 'herm', { az: 2.15, el: -0.18 }],
    [40.15, 40.95, 'harry', { az: 0.80, el: 0.0, rollK: 1 }],
    [41.3, 42.9, 'owl', {}],
    [43.45, 45.5, 'harry', { az: 1.03, el: -0.35 }],
    [46.0, 47.2, 'ron', { az: 2.70, el: -0.12 }],
    [47.3, 48.5, 'harry', { az: 1.69, el: -0.15 }],
    [48.9, 49.75, 'herm', { az: 2.85, el: 0.05 }],
    [49.8, 50.5, 'harry', { az: 1.03, el: -0.3 }],
    [50.6, 51.9, 'ron', { az: 2.72, el: -0.1 }],
    [52.2, 52.7, 'herm', { az: 3.24, el: -0.05 }],
    [52.9, 54.4, 'harry', { az: 1.70, el: -0.1 }],
    [54.4, 55.45, 'harry', { az: 1.73, el: -0.35 }],
    [55.85, 58.1, 'herm', { az: 3.18, el: -0.25 }],
    [58.9, 59.7, 'ron', { az: 3.70, el: -0.1 }],
    [60.3, 62.0, 'scuffle', {}],
    [62.0, 62.7, 'herm', { az: 3.37, el: -0.5, rollK: 0.8 }],
    [62.8, 63.7, 'ron', { az: 1.54, el: -0.3, rollK: 0.6 }],
    [64.45, 69.3, 'volde', { az: 2.39, el: -0.5, rise: [64.45, 65.4] }],
    [69.9, 74.7, 'harry', { az: 0.59, el: -0.05 }],
    [74.7, 76.0, 'diary', {}],
    [76.65, 80.0, 'volde', { az: 2.55, el: -0.45, rollK: 0.6 }],
    [80.4, 81.5, 'harry', { az: 0.98, el: -0.05 }],
    [82.35, 85.7, 'volde', { az: 2.84, el: -0.4, rollK: 0.6 }],
    [86.15, 88.3, 'harry', { az: 1.66, el: -0.1 }],
    [88.6, 89.5, 'herm', { az: 2.69, el: -0.1 }],
    [89.7, 90.7, 'harry', { az: 1.02, el: -0.2 }],
    [91.35, 94.2, 'volde', { az: 2.62, el: -0.35, rollK: 0.6 }],
    [94.75, 96.7, 'harry', { az: 1.72, el: -0.15 }],
    [97.25, 100.3, 'volde', { az: 2.55, el: -0.45, rollK: 0.6 }],
    [100.3, 101.0, 'volde', { az: 4.5, el: -0.3 }],
    [101.0, 101.5, 'tug', {}],
    [101.5, 102.75, 'harry', { az: 2.0, el: -0.3 }],
    [102.8, 103.35, 'tug', {}],
    [103.4, 104.7, 'volde', { az: 4.6, el: -0.7 }],
    [104.85, 106.9, 'harry', { az: 1.95, el: -0.25 }],
    [107.0, 107.8, 'volde', { az: 4.32, el: -0.3 }],
    [107.8, 109.3, 'harry', { az: 1.9, el: -0.35 }],
    [110.15, 111.9, 'volde', { az: 0.32, el: -0.7 }],
    [112.5, 112.9, 'ron', { az: 2.17, el: -0.1 }],
    [113.0, 114.9, 'harry', { az: 0.78, el: -0.1 }],
    [115.4, 117.8, 'volde', { az: 2.65, el: -0.1 }],
    [117.8, 119.1, 'harry', { az: 0.53, el: -0.1 }],
    [120.45, 121.7, 'herm', { az: 3.08, el: -0.05 }],
    [122.0, 122.5, 'ron', { az: 3.36, el: -0.2 }],
    [123.3, 124.5, 'ron', { az: 3.38, el: -0.35 }],
    [125.0, 127.3, 'herm', { az: 0.94, el: -0.45 }],
    [128.05, 131.9, 'volde', { az: 4.75, el: -0.3 }],
    [132.4, 132.9, 'herm', { az: 1.61, el: -0.3 }],
    [133.5, 138.9, 'cry', {}],
    [139.5, 141.3, 'volde', { az: 4.75, el: -0.2 }],
    [141.9, 142.5, 'ron', { az: 0.15, el: -0.1 }],
    [142.5, 145.4, 'cry', {}]
  ];
  const CUTS = SHOTS.map(s => s[0]);

  function shotIndex(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    return i;
  }

  function aimCamera(eye, target, sx, sy, roll, fov) {
    const d = V3.norm(V3.sub(target, eye));
    const tv = Math.tan((fov * PI) / 360), th = tv * (4 / 3);
    const yawD = Math.atan2(d[0], d[2]);
    const pitD = Math.asin(clamp(d[1], -1, 1));
    const yaw = yawD + Math.atan(sx * th);
    const pit = pitD - Math.atan(sy * tv);
    const f = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
    return { eye, at: V3.add(eye, f), fov, roll };
  }

  function shake(t, amp) {
    const w = K.wobble(t * 2.3, amp, 3.7);
    return w;
  }

  function trackedCamera(t, who, spec, cast) {
    const c = cast[who];
    if (!c || c.hidden) return null;
    const head = c.m.pts.head;
    const tr = Track.find(who, t);
    let f = tr ? Track.sample(tr, t) : { sx: 0, sy: 0.2, d: 0.6, roll: 0 };
    if (spec.fix) f = Object.assign({}, f, spec.fix);
    const az = spec.az, el = spec.el;
    const dist = clamp(f.d, 0.22, 3.2);
    const dir = [S(az) * C(el), S(el), C(az) * C(el)];
    let aim = head;
    if (spec.rise) {
      const u = ease(clamp((t - spec.rise[0]) / (spec.rise[1] - spec.rise[0]), 0, 1));
      aim = V3.lerp(c.m.pts.chest, head, u);
      aim = V3.lerp([aim[0], aim[1] - 0.35, aim[2]], aim, u);
    }
    const eye = V3.add(aim, V3.mul(dir, dist));
    eye[0] = clamp(eye[0], -4.05, 4.05);
    eye[1] = clamp(eye[1], 0.35, 2.9);
    eye[2] = clamp(eye[2], -2.85, 2.85);
    const roll = f.roll * (spec.rollK === undefined ? 0.5 : spec.rollK);
    return aimCamera(eye, aim, f.sx, f.sy, roll, spec.fov || FOV);
  }

  function manualCamera(t, kind, cast) {
    if (kind === 'legs') {
      const v = cast.volde;
      const u = clamp((t - 9.4) / 1.35, 0, 1);
      const ank = V3.lerp(v.m.pts.ankleL, v.m.pts.ankleR, 0.5);
      const pts = [ank, v.m.pts.kneeL, v.m.pts.pelvis, v.m.pts.chest, v.m.pts.head];
      const x = ease(u) * 0.92 * (pts.length - 1);
      const i = Math.min(pts.length - 2, Math.floor(x));
      const aim = V3.lerp(pts[i], pts[i + 1], x - i);
      const toward = V3.norm([-2.45 - ank[0], 0, -1.75 - ank[2]]);
      const near = 0.75 + u * 0.35;
      const eye = [ank[0] + toward[0] * near, 0.38 + u * 0.55, ank[2] + toward[2] * near];
      return aimCamera(eye, aim, 0.0, -0.05 + u * 0.25, -0.1, FOV);
    }
    if (kind === 'owl') {
      const o = owlPos(t);
      return aimCamera([o[0] + 0.04, o[1] + 0.16, o[2] + 0.46], [o[0], o[1] + 0.1, o[2]], 0.05, 0.05, 0.08, FOV);
    }
    if (kind === 'diary') {
      const h = cast.harry.m;
      const M = M4.chain(h.handR, M4.translate(0, -0.1, 0.03), M4.translate(0, 0.02, 0.02));
      const c = M4.point(M, [0, 0, 0.012]);
      const n = V3.norm(M4.dir(M, [0, 0, 1]));
      const eye = V3.add(c, V3.add(V3.mul(n, 0.21), [0, 0.02, 0]));
      return aimCamera(eye, c, 0.05 + S(t * 5) * 0.08, 0.0, 0.25 + S(t * 3) * 0.08, FOV);
    }
    if (kind === 'scuffle') {
      const a = cast.herm.m.pts.head, b = cast.ron.m.pts.head;
      const mid = V3.lerp(a, b, 0.5 + S(t * 3.1) * 0.3);
      const eye = [mid[0] + 0.45, mid[1] - 0.25 + S(t * 4) * 0.1, mid[2] - 0.55];
      return aimCamera(eye, mid, S(t * 5.3) * 0.3, C(t * 4.1) * 0.25, S(t * 2.2) * 0.35, FOV);
    }
    if (kind === 'tug') {
      const h = cast.harry.m, v = cast.volde.m;
      const mid = V3.lerp(V3.lerp(h.pts.wristL, h.pts.wristR, 0.5), V3.lerp(v.pts.wristL, v.pts.wristR, 0.5), 0.5);
      const eye = [mid[0] - 0.05, mid[1] + 0.12, mid[2] + 0.5];
      return aimCamera(eye, mid, S(t * 6) * 0.25, S(t * 4.5) * 0.2, 0.3 + S(t * 3) * 0.2, FOV);
    }
    if (kind === 'cry') {
      const e = cast.herm.m;
      const hd = e.pts.head;
      const close = t < 136.5 ? 0.42 : 0.3;
      const eye = [hd[0] + 0.12, hd[1] + 0.12, hd[2] + close];
      return aimCamera(eye, hd, 0.15 + S(t * 1.3) * 0.1, 0.1 + S(t * 1.7) * 0.06, S(t * 0.9) * 0.1, FOV);
    }
    return null;
  }

  function shotCamera(i, t, cast) {
    const [t0, , who, spec] = SHOTS[i];
    const tt = Math.max(t, t0);
    const cam = ['legs', 'owl', 'diary', 'scuffle', 'tug', 'cry'].includes(who) ? manualCamera(tt, who, cast) : trackedCamera(tt, who, spec, cast);
    return cam || { eye: [-2.3, 1.1, -1.6], at: [-2.6, 1.2, -2.3], fov: FOV, roll: 0 };
  }

  function slerpDir(a, b, u) {
    const d = clamp(V3.dot(a, b), -1, 1);
    const ang = Math.acos(d);
    if (ang < 1e-4) return a;
    const s = Math.sin(ang);
    return V3.add(V3.mul(a, Math.sin((1 - u) * ang) / s), V3.mul(b, Math.sin(u * ang) / s));
  }

  const PANS = new Map();

  function pushOut(eye, cast) {
    let e = eye;
    ['harry', 'herm', 'ron', 'volde', 'reader'].forEach(w => {
      const c = cast[w];
      if (!c || c.hidden || !c.m) return;
      [[c.m.pts.pelvis, c.m.pts.chest, 0.21], [c.m.pts.chest, c.m.pts.head, 0.15]].forEach(([a, b, r]) => {
        const ab = V3.sub(b, a);
        const k = clamp(V3.dot(V3.sub(e, a), ab) / Math.max(1e-6, V3.dot(ab, ab)), 0, 1);
        const q = V3.add(a, V3.mul(ab, k));
        const d = V3.sub(e, q);
        const len = V3.len(d);
        if (len < r) e = V3.add(q, V3.mul(len > 1e-4 ? V3.mul(d, 1 / len) : [0, 0, 1], r));
      });
    });
    return e;
  }

  function cameraAt(t, castA) {
    const i = shotIndex(t);
    const [t0, t1] = SHOTS[i];
    let cam;
    if (t <= t1 || i + 1 >= SHOTS.length) {
      cam = shotCamera(i, Math.min(t, t1), castA);
    } else {
      const n0 = t1, n1 = SHOTS[i + 1][0];
      const u = ease(clamp((t - n0) / Math.max(0.05, n1 - n0), 0, 1));
      if (!PANS.has(i)) PANS.set(i, { a: shotCamera(i, n0, solveCast(n0, null)), b: shotCamera(i + 1, n1, solveCast(n1, null)) });
      const { a, b } = PANS.get(i);
      const fa = V3.norm(V3.sub(a.at, a.eye)), fb = V3.norm(V3.sub(b.at, b.eye));
      const eye = V3.lerp(a.eye, b.eye, u);
      let f = slerpDir(fa, fb, u);
      f = V3.norm(V3.add(f, [0, S(u * PI) * 0.06, 0]));
      cam = { eye, at: V3.add(eye, f), fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll, b.roll, u) };
    }
    const fw = V3.norm(V3.sub(cam.at, cam.eye));
    cam.eye = pushOut(cam.eye, castA);
    cam.at = V3.add(cam.eye, fw);
    const w = shake(t, 0.006);
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    cam.at = V3.add(cam.eye, V3.norm(V3.add(f, [w[0], w[1], w[2] * 0.5])));
    cam.roll += w[2] * 2;
    return cam;
  }

  function propsAt(t, cast) {
    const out = [];
    if (t >= 40.9 && t < 43.1) out.push({ item: 'owl', pos: owlPos(t), rot: [0, 0.15 + S(t * 2.5) * 0.2, S(t * 7) * 0.1], letter: t < 42.95 });
    if (t >= 60.2) out.push({ item: 'letter', pos: [-2.15, 0.765, -2.0], rot: [-PI / 2, 0.4, 0] });
    if (t >= 101.0 && t < 107.6) {
      const h = cast.harry.m, v = cast.volde.m;
      const a = V3.lerp(h.pts.wristL, h.pts.wristR, 0.5), b = V3.lerp(v.pts.wristL, v.pts.wristR, 0.5);
      const mid = V3.lerp(a, b, 0.5 + S(t * 4) * 0.12);
      const dx = b[0] - a[0], dz = b[2] - a[2];
      out.push({ item: 'diary', pos: mid, rot: [0, Math.atan2(dx, dz) + PI / 2, S(t * 9) * 0.2] });
    }
    return out;
  }

  function heldOf(who, k, t) {
    const out = [];
    if (who === 'herm' && k.pencil > 0.5) out.push({ item: 'pencil', hand: 'R', rot: [0.3, 0, 0.6] });
    if (who === 'reader') out.push({ item: 'book', hand: 'both', off: [0, 0.02, 0.02], rot: [-0.55, 0, 0] });
    if (who === 'harry') {
      if (t >= 43.0 && t < 60.2) out.push({ item: 'letter', hand: 'both', off: [0, 0.02, 0.03], rot: [-0.5, 0, 0] });
      if (t >= 73.2 && t < 85.9) out.push({ item: 'diary', hand: 'R', off: [0, 0.02, 0.02], rot: [0, 0, 0] });
      if (t >= 85.9 && t < 100.6) out.push({ item: 'diaryOpen', hand: 'both', off: [0, 0.03, 0.04], rot: [-0.78, PI, 0] });
      if (t >= 100.6 && t < 101.0) out.push({ item: 'diary', hand: 'both', off: [0, 0.02, 0.03], rot: [-0.3, 0, 0] });
    }
    if (who === 'volde' && k.diary > 0.5) out.push({ item: 'diary', hand: 'R', off: [0, 0.0, 0.03], rot: [0.2, 0, 0.3] });
    return out;
  }

  function patOffset(t) {
    return S(t * 9.4) * 0.03;
  }

  function stage(t) {
    const tc = clamp(t, 0, DURATION);
    const pre = solveCast(tc, null);
    const camera = cameraAt(tc, pre);
    const cast = solveCast(tc, camera);
    if (cast.harry.k.fig > 0.5 && !cast.volde.hidden) {
      const vh = cast.volde.m.pts.head;
      const toCam = V3.norm(V3.sub(camera.eye, vh));
      const side = V3.norm(V3.cross(toCam, [0, 1, 0]));
      cast.harry.pose.hLw = V3.add(V3.add(vh, V3.mul(toCam, 0.2)), V3.add(V3.mul(side, -0.12), [0, -0.06 + S(tc * 5) * 0.02, 0]));
      cast.harry.pose.hRw = V3.add(V3.add(vh, V3.mul(toCam, 0.16)), V3.add(V3.mul(side, -0.24), [0, -0.12, 0]));
      cast.harry.m = Cast.solve('harry', cast.harry.pose);
    }
    if (!cast.ron.hidden && cast.ron.k.pat > 0.5) {
      const hm = cast.herm.m;
      const sh = M4.point(hm.chest, [0.0, 0.28, -0.05]);
      cast.ron.pose.hLw = [sh[0], sh[1] + 0.05 + patOffset(tc), sh[2]];
      cast.ron.m = Cast.solve('ron', cast.ron.pose);
    }
    const list = [];
    ['harry', 'herm', 'ron', 'volde', 'reader'].forEach(who => {
      const c = cast[who];
      if (c.hidden) return;
      list.push({ who, pose: c.pose, hold: heldOf(who, c.k, tc) });
    });
    return {
      shot: { index: shotIndex(tc), who: SHOTS[shotIndex(tc)][2] },
      camera,
      cast: list,
      props: propsAt(tc, cast),
      set: {}
    };
  }

  function titleAt(t) {
    return t < 10.7 ? 1 : 0;
  }

  function cardAt(t) {
    return clamp((t - 145.0) / 0.4, 0, 1);
  }

  window.HogwScript = { ID, DURATION, CUTS, SHOTS, SPEECH, VOICE, mouthOf, stage, titleAt, cardAt };
})();
