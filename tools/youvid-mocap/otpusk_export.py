import json
import os
import sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import rodrigues, torso
from export import enc, tcode, reduce, smooth
from otpusk import D, CLIP

CHANNELS = 29
GAP = 0.45
MAX_LEN = 120


def channels(rec):
    th = np.array(rec['th'])
    T = torso(th, D)
    p, Rp = T['pelvis']
    pc, Rc = T['chest']
    cam = Rc.T @ (-pc)
    fwd = Rc.T @ np.array([0, 0, -1.0])
    up = Rc.T @ np.array([0, 1.0, 0])
    vals = list(cam / 4) + list(fwd) + list(up) + list(th[6:9]) + list(th[9:12])
    for s in ('L', 'R'):
        wr, el, sh = np.array(rec['wr' + s]), np.array(rec['el' + s]), np.array(rec['sh' + s])
        vals += list(Rc.T @ (wr - pc))
        vals += list(Rc.T @ (el - sh))
    vals += [rec['cAL'], rec['cAR']]
    return np.array(vals)


def split(recs):
    out, cur = [], []
    for r in recs:
        if cur and (r['t'] - cur[-1]['t'] > GAP or r['t'] - cur[0]['t'] > MAX_LEN):
            out.append(cur)
            cur = []
        cur.append(r)
    if cur:
        out.append(cur)
    return [c for c in out if len(c) >= 4]


def main():
    recs = sorted([r for path in sys.argv[1].split(',') for r in json.load(open(path))], key=lambda r: r['t'])
    tol = float(sys.argv[3]) if len(sys.argv) > 3 else 0.02
    sigma = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    segs = []
    total = 0
    for fr in split(recs):
        ts = np.array([f['t'] for f in fr])
        vals = np.array([channels(f) for f in fr])
        vals = smooth(vals, sigma)
        keep = reduce(ts, vals, tol)
        total += len(keep)
        t0 = round(ts[0] - 0.05, 2)
        t1 = round(ts[-1] + 0.05, 2)
        data = ''.join(tcode(ts[i] - t0) + ''.join(enc(v) for v in vals[i]) for i in keep)
        segs.append(f"      {{ t0: {t0}, t1: {t1}, data: '{data}' }}")
    js = "(function () {\n  window.YouVidMotion = window.YouVidMotion || {};\n  window.YouVidMotion['" + CLIP + "'] = {\n    channels: " + str(CHANNELS) + ",\n    segs: [\n" + ',\n'.join(segs) + "\n    ]\n  };\n})();\n"
    open(sys.argv[2], 'w', encoding='utf-8', newline='\n').write(js)
    print('segments', len(segs), 'keys', total, 'bytes', len(js))


if __name__ == '__main__':
    main()
