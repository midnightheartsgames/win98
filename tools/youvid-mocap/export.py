import json
import os
import sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import rodrigues

ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
ZERO = 1922
SCALE = 600


def enc(v):
    c = int(round(v * SCALE)) + ZERO
    c = max(0, min(3843, c))
    return ALPHA[c // 62] + ALPHA[c % 62]


def tcode(dt):
    c = max(0, min(3843, int(round(dt * 30))))
    return ALPHA[c // 62] + ALPHA[c % 62]


def channels(rec):
    th = np.array(rec['th'])
    R = rodrigues(th[3:6])
    up, fwd = R[:, 1], R[:, 2]
    vals = list(th[0:3]) + list(up) + list(fwd) + list(th[6:9]) + list(th[9:12])
    for k in ('wrL', 'elL', 'wrR', 'elR', 'anL', 'knL', 'anR', 'knR'):
        vals += rec[k]
    return np.array(vals)


def hermite(ts, ps, t):
    i = np.searchsorted(ts, t) - 1
    i = max(0, min(len(ts) - 2, i))
    t0, t1 = ts[i], ts[i + 1]
    h = t1 - t0
    u = (t - t0) / h
    def tan(j):
        a, b = max(0, j - 1), min(len(ts) - 1, j + 1)
        return (ps[b] - ps[a]) / (ts[b] - ts[a])
    m0, m1 = tan(i) * h, tan(i + 1) * h
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * ps[i] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * ps[i + 1] + (u3 - u2) * m1


def reduce(ts, vals, tol):
    keep = [0, len(ts) - 1]
    while True:
        kt = np.array([ts[i] for i in sorted(keep)])
        kv = np.array([vals[i] for i in sorted(keep)])
        worst, wi = 0, -1
        for i in range(len(ts)):
            if i in keep:
                continue
            e = np.max(np.abs(hermite(kt, kv, ts[i]) - vals[i]))
            if e > worst:
                worst, wi = e, i
        if worst <= tol or wi < 0:
            return sorted(keep)
        keep.append(wi)


def smooth(vals, sigma):
    if sigma <= 0:
        return vals
    n = len(vals)
    out = np.zeros_like(vals)
    r = int(3 * sigma) + 1
    for i in range(n):
        w = np.array([np.exp(-0.5 * (k / sigma) ** 2) for k in range(-r, r + 1)])
        idx = np.clip(np.arange(i - r, i + r + 1), 0, n - 1)
        out[i] = (w[:, None] * vals[idx]).sum(0) / w.sum()
    return out


def main():
    fit = json.load(open(sys.argv[1]))
    clip = sys.argv[3]
    tol = float(sys.argv[4]) if len(sys.argv) > 4 else 0.012
    sigma = float(sys.argv[5]) if len(sys.argv) > 5 else 0.8
    segs = []
    total = 0
    for seg in fit:
        fr = seg['frames']
        if len(fr) < 2:
            continue
        ts = np.array([f['t'] for f in fr])
        vals = smooth(np.array([channels(f) for f in fr]), sigma)
        keep = reduce(ts, vals, tol)
        total += len(keep)
        data = ''.join(tcode(ts[i] - seg['t0']) + ''.join(enc(v) for v in vals[i]) for i in keep)
        segs.append(f"      {{ t0: {seg['t0']}, t1: {seg['t1']}, data: '{data}' }}")
        print(seg['t0'], len(fr), '->', len(keep))
    js = "(function () {\n  window.YouVidMotion = window.YouVidMotion || {};\n  window.YouVidMotion['" + clip + "'] = {\n    channels: 39,\n    segs: [\n" + ',\n'.join(segs) + "\n    ]\n  };\n})();\n"
    open(sys.argv[2], 'w', encoding='utf-8', newline='\n').write(js)
    print('keys', total, 'bytes', len(js))


if __name__ == '__main__':
    main()
