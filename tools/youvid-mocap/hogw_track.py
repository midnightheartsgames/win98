import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
POSE = os.path.join(HERE, 'H4rryG3rm4n-pose.jsonl')
OUT = os.path.join(ROOT, 'js', 'apps', 'youvid', 'hogw-track.js')

FOV = 52.0
F = 180.0 / math.tan(math.radians(FOV / 2))
ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
RANGES = {'sx': (-1.6, 1.6), 'sy': (-1.6, 1.6), 'd': (0.1, 4.0), 'roll': (-1.4, 1.4)}

SHOTS = [
    ('herm', 0.0, 2.9, 'big'), ('harry', 3.95, 8.85, 'big'), ('volde', 10.75, 17.35, 'big'), ('harry', 18.0, 19.35, 'big'),
    ('volde', 20.25, 21.95, 'big'), ('herm', 22.45, 23.05, 'big'), ('harry', 23.45, 27.7, 'big'), ('volde', 28.7, 29.65, 'big'),
    ('herm', 30.65, 32.7, 'big'), ('harry', 33.0, 35.65, 'big'), ('herm', 36.85, 40.1, 'right'), ('harry', 40.2, 40.9, 'big'),
    ('harry', 43.45, 45.45, 'big'), ('ron', 46.0, 47.2, 'big'), ('harry', 47.3, 48.5, 'right'), ('herm', 48.9, 49.7, 'big'), ('harry', 49.8, 50.5, 'big'),
    ('ron', 50.6, 51.9, 'left'), ('herm', 52.2, 52.7, 'left'), ('harry', 52.9, 54.4, 'right'), ('harry', 54.4, 55.45, 'big'),
    ('herm', 55.85, 58.1, 'big'), ('ron', 58.9, 59.7, 'left'), ('herm', 62.0, 62.7, 'big'), ('ron', 62.8, 63.7, 'big'),
    ('volde', 64.45, 69.3, 'big'), ('harry', 69.9, 74.0, 'big'), ('harry', 74.0, 74.7, 'big'), ('volde', 76.65, 80.0, 'big'),
    ('harry', 80.4, 81.5, 'right'), ('volde', 82.35, 85.7, 'big'), ('harry', 86.15, 88.3, 'right'), ('herm', 88.6, 89.5, 'big'),
    ('harry', 89.7, 90.7, 'big'), ('volde', 91.35, 94.2, 'big'), ('harry', 94.75, 96.7, 'right'), ('volde', 97.25, 100.3, 'big'),
    ('volde', 100.3, 100.9, 'big'), ('harry', 101.5, 102.7, 'big'), ('volde', 103.4, 104.7, 'big'), ('harry', 104.85, 106.9, 'big'),
    ('volde', 107.0, 107.8, 'big'), ('harry', 107.8, 109.3, 'big'), ('volde', 110.15, 111.9, 'big'), ('ron', 112.5, 112.9, 'left'),
    ('harry', 113.0, 114.9, 'big'), ('volde', 115.4, 117.8, 'big'), ('harry', 117.8, 119.1, 'right'), ('herm', 120.45, 121.7, 'left'),
    ('ron', 122.0, 122.5, 'big'), ('ron', 123.3, 124.5, 'big'), ('herm', 125.0, 127.3, 'big'), ('volde', 128.05, 131.9, 'big'),
    ('herm', 132.4, 132.9, 'big'), ('volde', 139.5, 141.3, 'big'), ('ron', 141.9, 142.5, 'big')
]

JS = '''(function () {
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const RANGES = { sx: [-1.6, 1.6], sy: [-1.6, 1.6], d: [0.1, 4.0], roll: [-1.4, 1.4] };
  const RAW = [
%s
  ];

  function decode(str, key) {
    const [lo, hi] = RANGES[key];
    const out = new Float32Array(str.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = lo + ((ALPHA.indexOf(str[i * 2]) * 62 + ALPHA.indexOf(str[i * 2 + 1])) / 3843) * (hi - lo);
    return out;
  }

  const SHOTS = RAW.map(([who, t0, sx, sy, d, roll]) => ({ who, t0, sx: decode(sx, 'sx'), sy: decode(sy, 'sy'), d: decode(d, 'd'), roll: decode(roll, 'roll') }));
  SHOTS.forEach(s => { s.t1 = s.t0 + (s.sx.length - 1) / 10; });

  function find(who, t) {
    return SHOTS.find(s => s.who === who && t >= s.t0 && t <= s.t1) || SHOTS.find(s => s.who === who && t >= s.t0 - 0.35 && t <= s.t1 + 0.35) || null;
  }

  function sample(s, t) {
    const x = Math.max(0, Math.min(s.sx.length - 1.001, (t - s.t0) * 10));
    const i = Math.floor(x), k = x - i;
    const j = Math.min(s.sx.length - 1, i + 1);
    const at = (a) => a[i] + (a[j] - a[i]) * k;
    return { sx: at(s.sx), sy: at(s.sy), d: at(s.d), roll: at(s.roll) };
  }

  window.HogwTrack = { SHOTS, find, sample };
})();
'''


def head(p):
    kp = p['kp']
    pts = [(kp[i][0], kp[i][1]) for i in (1, 2, 3, 4) if kp[i][2] > 0.35]
    if len(pts) < 2:
        return None
    cx = sum(x for x, y in pts) / len(pts)
    cy = sum(y for x, y in pts) / len(pts)
    face = None
    if kp[0][2] > 0.4 and kp[1][2] > 0.4 and kp[2][2] > 0.4:
        mid = (kp[1][0] + kp[2][0]) / 2
        dist = math.dist(kp[1][:2], kp[2][:2])
        face = math.asin(max(-1, min(1, (kp[0][0] - mid) / max(dist, 1) * 1.1)))
    elif kp[0][2] > 0.4 and (kp[3][2] > 0.45) != (kp[4][2] > 0.45):
        e = 3 if kp[3][2] > kp[4][2] else 4
        face = 1.3 if kp[0][0] > kp[e][0] else -1.3
    fk = max(0.45, math.cos(face)) if face is not None else 1.0
    ppm = []
    if kp[3][2] > 0.45 and kp[4][2] > 0.45:
        ppm.append(math.dist(kp[3][:2], kp[4][:2]) / 0.15 / fk)
    if kp[1][2] > 0.45 and kp[2][2] > 0.45:
        ppm.append(math.dist(kp[1][:2], kp[2][:2]) / 0.068 / fk)
    for e, o in ((3, 4), (4, 3)):
        if kp[0][2] > 0.6 and kp[e][2] > 0.8 and kp[o][2] < 0.3:
            ppm.append(math.dist(kp[0][:2], kp[e][:2]) / 0.125)
    sh = None
    if kp[5][2] > 0.45 and kp[6][2] > 0.45:
        sh = math.dist(kp[5][:2], kp[6][:2]) / 0.37
    roll = None
    if kp[1][2] > 0.45 and kp[2][2] > 0.45:
        dx, dy = kp[1][0] - kp[2][0], kp[1][1] - kp[2][1]
        if abs(dx) > 1e-3:
            if dx < 0:
                dx, dy = -dx, -dy
            roll = math.atan2(dy, dx)
    if kp[3][2] > 0.45 and kp[4][2] > 0.45 and roll is None:
        dx, dy = kp[3][0] - kp[4][0], kp[3][1] - kp[4][1]
        if dx < 0:
            dx, dy = -dx, -dy
        roll = math.atan2(dy, dx)
    area = (p['box'][2] - p['box'][0]) * (p['box'][3] - p['box'][1])
    return {'face': face, 'cx': cx, 'cy': cy, 'ppm': max(ppm) if ppm else None, 'sh': sh, 'roll': roll, 'area': area, 'conf': p['conf']}


def pick(hs, rule):
    hs = [h for h in hs if h and h['conf'] > 0.3]
    if not hs:
        return None
    if rule in ('left', 'right'):
        big = [h for h in hs if h['area'] > 0.15 * max(x['area'] for x in hs)]
        return (min if rule == 'left' else max)(big, key=lambda h: h['cx'])
    return max(hs, key=lambda h: h['area'] * h['conf'])


def medfilt(v, k):
    out = []
    for i in range(len(v)):
        w = [x for x in v[max(0, i - k):i + k + 1] if x is not None]
        out.append(float(np.median(w)) if w else None)
    return out


def fill(v):
    idx = [i for i, x in enumerate(v) if x is not None]
    if not idx:
        return None
    out = []
    for i in range(len(v)):
        if v[i] is not None:
            out.append(v[i])
            continue
        lo = max([j for j in idx if j < i], default=None)
        hi = min([j for j in idx if j > i], default=None)
        if lo is None:
            out.append(v[hi])
        elif hi is None:
            out.append(v[lo])
        else:
            k = (i - lo) / (hi - lo)
            out.append(v[lo] * (1 - k) + v[hi] * k)
    return out


def smooth(v):
    if not v:
        return v
    return [float(np.mean(v[max(0, i - 1):i + 2])) for i in range(len(v))]


def enc(vals, key):
    lo, hi = RANGES[key]
    out = ''
    for v in vals:
        q = int(round((min(hi, max(lo, v)) - lo) / (hi - lo) * 3843))
        out += ALPHA[q // 62] + ALPHA[q % 62]
    return out


def tracks():
    rows = [json.loads(line) for line in open(POSE, encoding='utf-8')]
    by_t = {round(r['t'] * 10): r for r in rows}
    out = []
    for who, t0, t1, rule in SHOTS:
        ts = [i / 10 for i in range(int(math.ceil(t0 * 10)), int(math.floor(t1 * 10)) + 1)]
        sx, sy, ds, rl, fc = [], [], [], [], []
        for t in ts:
            r = by_t.get(round(t * 10))
            h = pick([head(p) for p in r['p']], rule) if r else None
            if not h:
                sx.append(None)
                sy.append(None)
                ds.append(None)
                rl.append(None)
                continue
            sx.append((h['cx'] - 240) / 240)
            sy.append((180 - h['cy']) / 180)
            ppm = h['ppm'] if h['ppm'] else h['sh']
            ds.append(F / ppm if ppm else None)
            rl.append(h['roll'])
            if h['face'] is not None:
                fc.append(h['face'])
        sx, sy, ds, rl = medfilt(sx, 1), medfilt(sy, 1), medfilt(ds, 2), medfilt(rl, 2)
        sx, sy, ds, rl = smooth(fill(sx)), smooth(fill(sy)), smooth(fill(ds)), smooth(fill(rl))
        out.append({'who': who, 't0': ts[0] if ts else t0, 'sx': sx, 'sy': sy, 'd': ds, 'roll': rl, 'face': float(np.median(fc)) if fc else None})
    return out


def main():
    out = tracks()
    lines = []
    for s in out:
        if not s['sx']:
            continue
        lines.append("    ['%s', %.1f, '%s', '%s', '%s', '%s']" % (s['who'], s['t0'], enc(s['sx'], 'sx'), enc(s['sy'], 'sy'), enc(s['d'], 'd'), enc(s['roll'], 'roll')))
        print('%-6s %6.2f face %s d %.2f' % (s['who'], s['t0'], '%+.2f' % s['face'] if s['face'] is not None else '  -  ', np.median(s['d'])))
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        f.write(JS % ',\n'.join(lines))


if __name__ == '__main__':
    main()
