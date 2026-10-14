import importlib
import json
import os
import sys
import numpy as np
from scipy.optimize import least_squares
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, torso, rodrigues, theta_of
from fit import pick, load_pose, TORSO_KP, KP_W

cfg = importlib.import_module(sys.argv[1])
spec = json.loads(sys.argv[2])
times = spec['times']
fov = spec['fov']
cam0 = spec['cam']
pose0 = spec['pose']
marks = spec.get('marks', [])
prior = spec['prior']
frames, scale = load_pose(cfg.CLIP)
kps = []
for t in times:
    f = min(frames, key=lambda f: abs(f['t'] - t))
    kps.append(pick(f, scale))
th0 = theta_of(pose0['p'], pose0['up'], pose0['fwd'])
n = len(times)
lo_t, hi_t = cfg.BOUNDS


def unpack(v):
    cam = Cam(v[0:3], v[3:6], fov)
    ths = [v[6 + 12 * i: 18 + 12 * i] for i in range(n)]
    return cam, ths


def res(v):
    cam, ths = unpack(v)
    out = []
    for kp, th in zip(kps, ths):
        T = torso(th, cfg.D)
        for i, name in TORSO_KP.items():
            c = kp[i][2]
            w = KP_W[i] * (c if c > 0.3 else 0.0)
            out.extend((cam.project(T['pts'][name]) - kp[i][:2]) / 12.0 * w)
        if prior.get('contact', True):
            out.extend(cfg.contact(th, dict(prior, sink=-prior.get('sink', 0.05), kind=prior.get('kind', 'lie'))))
        out.append((th[2] - prior['z']) / 0.15 * 0.5)
        if 'x' in prior:
            out.append((th[0] - prior['x']) / 0.08)
        R = rodrigues(th[3:6])
        if prior.get('fwd'):
            fe = np.array(prior['fwd'], float)
            out.extend((R[:, 2] - fe / np.linalg.norm(fe)) * prior.get('wf', 2.0))
        if prior.get('up'):
            ue = np.array(prior['up'], float)
            out.extend((R[:, 1] - ue / np.linalg.norm(ue)) * prior.get('wu', 1.5))
        out.extend(th[6:12] * 0.6)
    for wp, px, w in marks:
        out.extend((cam.project(wp) - np.array(px)) / 12.0 * w)
    out.append((v[4] - cam0[4]) * 0.5)
    return np.array(out)


v0 = np.concatenate([np.array(cam0, float)] + [th0.copy() for _ in range(n)])
lo = np.concatenate([np.array(spec.get('eyeLo', [-2.5, 0.3, 0.6]) + [-2, -0.5, -1.5])] + [lo_t for _ in range(n)])
hi = np.concatenate([np.array(spec.get('eyeHi', [1.5, 2.0, 3.2]) + [2, 2, 2])] + [hi_t for _ in range(n)])
r = least_squares(res, np.clip(v0, lo + 1e-6, hi - 1e-6), bounds=(lo, hi), max_nfev=2000)
cam, ths = unpack(r.x)
print('cost', round(r.cost, 2), 'eye', np.round(r.x[0:3], 3).tolist(), 'at', np.round(r.x[3:6], 3).tolist(), 'fov', fov)
for t, th, kp in zip(times, ths, kps):
    T = torso(th, cfg.D)
    R = rodrigues(th[3:6])
    errs = [np.linalg.norm(cam.project(T['pts'][nm]) - kp[i][:2]) for i, nm in TORSO_KP.items() if kp[i][2] > 0.3]
    print(f'  t={t} p={np.round(th[0:3], 2).tolist()} up={np.round(R[:, 1], 2).tolist()} fwd={np.round(R[:, 2], 2).tolist()} kp err med {np.median(errs):.0f}px')
for wp, px, w in marks:
    print('  mark', wp, px, np.round(cam.project(wp), 0).tolist())
