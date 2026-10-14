import json
import os
import subprocess
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, theta_of
import fit
import export

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
CLIP = 'eXtr3meSlay'
OUT_JS = os.path.join(ROOT, 'js', 'apps', 'youvid', 'slay-motion.js')
CAM_JSON = os.path.join(HERE, f'{CLIP}-cam.json')
MAX_ERR = 26


def dims(d, sm, hm):
    out = dict(d)
    out['shoulderMark'] = sm
    out['hipMark'] = hm
    return out


PEOPLE = {
    'boy': dims(dict(hipX=0.085, hipY=-0.045, thigh=0.41, shin=0.4, chestY=0.11, neckY=0.29, shX=0.175, shY=0.2, upper=0.265, fore=0.225, headY=0.135, head=0.105), (0.165, 0.245), (0.095, -0.085, 0.03)),
    'dad': dims(dict(hipX=0.1, hipY=-0.05, thigh=0.5, shin=0.49, chestY=0.13, neckY=0.34, shX=0.215, shY=0.235, upper=0.31, fore=0.27, headY=0.16, head=0.113), (0.2, 0.29), (0.11, -0.1, 0.03)),
    'girl': dims(dict(hipX=0.075, hipY=-0.04, thigh=0.37, shin=0.36, chestY=0.1, neckY=0.25, shX=0.15, shY=0.175, upper=0.235, fore=0.205, headY=0.125, head=0.096), (0.14, 0.215), (0.085, -0.075, 0.03))
}

STAND = {'boy': 0.925, 'dad': 1.11, 'girl': 0.84}

FITS = [
    ('boy', 0.3, 1.9, 'big', [(0.3, dict(kind='stand', z=-0.25, zs=0.12, fwd=(0, 0, 1), up=(0, 1, 0), look=0.25)), (0.62, dict(kind='stand', z=0.35, zs=0.5, fwd=(0, 0, 1), up=(0, 1, 0), look=0.25))], (1.05, -0.25)),
    ('dad', 1.9, 4.21, 'big', dict(kind='stand', z=2.7, zs=1.5, fwd=(0.95, 0, -0.3), up=(0, 1, 0), look=0.15), (-3.2, 2.7)),
    ('girl', 1.9, 4.21, 'second', dict(kind='stand', z=2.1, zs=1.5, fwd=(0.95, 0, -0.2), up=(0, 1, 0), look=0.1), (-3.2, 2.1)),
    ('boy', 4.21, 8.1, 'big', dict(kind='stand', z=0.55, zs=0.5, fwd=None, up=(0, 1, 0), look=0.35), (0.75, 0.55))
]


class TimedCam:
    def __init__(self, cams):
        self.cams = cams
        self.cur = None

    def at(self, t):
        best = min(self.cams.keys(), key=lambda k: abs(k - t))
        self.cur = self.cams[best]

    def project(self, p):
        return self.cur.project(p)

    def ray(self, px, py):
        return self.cur.ray(px, py)

    @property
    def eye(self):
        return self.cur.eye


def cam_segments():
    data = json.load(open(CAM_JSON))
    segs = []
    for s in data['shots']:
        tr = np.array([r for r in s['track'] if r[0] < s['t1'] - 0.06])
        ts = tr[:, 0]
        vals = export.smooth(tr[:, 1:], 1.2)
        keep = export.reduce(ts, vals, 0.0025)
        body = ''.join(export.tcode(ts[i] - s['t0']) + ''.join(export.enc(v) for v in vals[i]) for i in keep)
        segs.append({'t0': s['t0'], 't1': s['t1'], 'data': body})
        print('cam', s['t0'], len(ts), '->', len(keep))
    return segs


def person_segments(fit_path, t_shift=0.0):
    out = json.load(open(fit_path))
    segs = []
    for seg in out:
        fr = seg['frames']
        if len(fr) < 2:
            continue
        ts = np.array([f['t'] for f in fr])
        vals = export.smooth(np.array([export.channels(f) for f in fr]), 0.8)
        keep = export.reduce(ts, vals, 0.012)
        body = ''.join(export.tcode(ts[i] - seg['t0']) + ''.join(export.enc(v) for v in vals[i]) for i in keep)
        segs.append({'t0': seg['t0'], 't1': seg['t1'], 'data': body})
        print('person', seg['t0'], len(fr), '->', len(keep))
    return segs


def write_js(entries):
    lines = ['(function () {', '  window.YouVidMotion = window.YouVidMotion || {};']
    for key, channels, segs in entries:
        body = ',\n'.join(f"      {{ t0: {s['t0']}, t1: {s['t1']}, data: '{s['data']}' }}" for s in segs)
        lines.append(f"  window.YouVidMotion['{key}'] = {{\n    channels: {channels},\n    segs: [\n{body}\n    ]\n  }};")
    lines.append('})();')
    js = '\n'.join(lines) + '\n'
    open(OUT_JS, 'w', encoding='utf-8', newline='\n').write(js)
    print(OUT_JS, len(js), 'bytes')


def dump_cams(times):
    script = os.path.join(HERE, 'slay-cams.cjs')
    res = subprocess.run(['node', script, json.dumps(times)], capture_output=True, text=True, cwd=ROOT)
    if res.returncode:
        raise SystemExit(res.stderr)
    rows = json.loads(res.stdout)
    return {r['t']: Cam(r['eye'], r['at'], r['fov'], up=r['up']) for r in rows}


def picker(mode, cam):
    def pick(frame, scale):
        cam.at(frame['t'])
        people = [p for p in frame['people'] if p['conf'] > 0.3]
        if not people:
            return None
        area = lambda p: (p['box'][2] - p['box'][0]) * (p['box'][3] - p['box'][1]) * p['conf']
        people.sort(key=area, reverse=True)
        if mode == 'big':
            chosen = people[0]
        else:
            rest = [p for p in people[1:] if (p['box'][0] + p['box'][2]) / 2 > (people[0]['box'][0] + people[0]['box'][2]) / 2 and (p['box'][3] - p['box'][1]) > 500]
            if not rest:
                return None
            chosen = rest[0]
        return np.array(chosen['kp']) * scale
    return pick


class Config:
    def __init__(self, who, seg_kind, cam, t0, t1, guess):
        self.CLIP = CLIP
        self.D = PEOPLE[who]
        self.MAX_ERR = MAX_ERR
        hy = STAND[who]
        self.hy = hy
        self.BOUNDS = (np.array([-12, hy - 0.25, -1.5, -10, -10, -10, -0.6, -0.8, -0.6, -0.8, -1.2, -0.6]), np.array([6, hy + 0.08, 6, 10, 10, 10, 0.6, 0.8, 0.6, 0.8, 1.2, 0.6]))
        self.SEGMENTS = [(t0, t1, cam, seg_kind, guess)]

    def contact(self, th, seg):
        return [(th[1] - self.hy) * 5.0]

    def violation(self, q):
        return max(0.0, 0.03 - q[1]) * 10

    def leg_default(self, seg, hip, Rp, k):
        return hip + np.array([k * 0.02, -self.D['thigh'], 0.03]), hip + np.array([k * 0.03, -self.D['thigh'] - self.D['shin'], 0.0])

    def leg_need(self, seg):
        return 0.6

    def leg_fix(self, seg, conf, kn, an):
        if an[1] < 0.07:
            an = np.array([an[0], 0.07, an[2]])
        return an


def run_people():
    frames, _ = fit.load_pose(CLIP)
    entries = []
    original_pick = fit.pick
    for who, t0, t1, mode, seg, guess_xz in FITS:
        times = [f['t'] for f in frames if t0 - 1e-6 <= f['t'] < t1 - 1e-6]
        cam = TimedCam(dump_cams(times))
        hy = STAND[who]
        first = seg if isinstance(seg, dict) else seg[0][1]
        fwd = first['fwd'] or (0, 0, 1)
        guess = theta_of([guess_xz[0], hy, guess_xz[1]], [0, 1, 0], fwd)
        cfg = Config(who, seg, cam, t0, t1, guess)
        fit.pick = picker(mode, cam)
        path = os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}-{who}-{t0}.json')
        fit.run(cfg, path)
        entries.append((who, path))
    fit.pick = original_pick
    return entries


def main():
    stage = sys.argv[1] if len(sys.argv) > 1 else 'all'
    entries = [(f'{CLIP}:cam', 3, cam_segments())]
    if stage == 'all':
        fits = run_people()
        by = {}
        for who, path in fits:
            by.setdefault(who, []).extend(person_segments(path))
        for who, segs in by.items():
            entries.append((f'{CLIP}:{who}', 39, segs))
    write_js(entries)


if __name__ == '__main__':
    main()
