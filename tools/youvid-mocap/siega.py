import json
import os
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, W, H, theta_of
import rig
import fit

CLIP = 'S1egaStrad4'
HERE = os.path.dirname(os.path.abspath(__file__))
D = dict(hipX=0.13, hipY=-0.05, thigh=0.46, shin=0.45, chestY=0.13, neckY=0.33, shX=0.23, shY=0.235, upper=0.3, fore=0.27, headY=0.155, head=0.112, shoulderMark=(0.23, 0.28), hipMark=(0.16, -0.1, 0.05))
FOV = 46
MAX_ERR = 26
BOUNDS = (np.array([-1.0, -1.7, -1.8, -10, -10, -10, -0.45, -0.7, -0.6, -0.9, -1.25, -0.7]), np.array([1.0, 0.4, -0.1, 10, 10, 10, 1.0, 0.7, 0.6, 0.9, 1.25, 0.7]))

SHOTS = json.load(open(os.path.join(HERE, 'siega-shots.json'), encoding='utf-8'))
CUR = {}


def cam_of(shot):
    a = shot.get('pitch', 0.17)
    y = shot.get('yaw', 0.0)
    return Cam([0, 0, 0], [-np.sin(y) * np.cos(a), -np.sin(a), -np.cos(y) * np.cos(a)], shot.get('fov', FOV))


def seat_at(shot, t):
    keys = shot.get('seatKeys')
    if not keys:
        return shot.get('seat', [0.0, -0.62, -0.62])
    if t <= keys[0][0]:
        return keys[0][1:]
    for (a, *va), (b, *vb) in zip(keys, keys[1:]):
        if t < b:
            k = (t - a) / (b - a)
            return [x + (y - x) * k for x, y in zip(va, vb)]
    return keys[-1][1:]


def kind_of(shot, name, t):
    seat = seat_at(shot, t)
    weak = 4.0 if os.environ.get('YV_WEAK') else 1.0
    base = dict(kind='sit', z=seat[2], zs=shot.get('zs', 0.18) * weak, fwd=(0, 0.05, 1), up=(0, 1, 0), look=0.35, hy=seat[1], hs=shot.get('hs', 0.12) * weak)
    if name == 'stand':
        base.update(kind='stand', z=seat[2] + 0.15, zs=0.4, up=None, look=0.25, hy=seat[1] + 0.3, hs=0.5)
    return base


def segments():
    out = []
    lo, hi = [float(x) for x in os.environ.get('YV_RANGE', '0,1e9').split(',')]
    for i, s in enumerate(SHOTS):
        if s.get('skip'):
            continue
        t0 = s['t']
        t1 = SHOTS[i + 1]['t'] if i + 1 < len(SHOTS) else 204.43
        if t1 <= lo or t0 >= hi:
            continue
        kinds = []
        t = t0
        while t < t1:
            name = next((n for a, b, n in s.get('acts', []) if a <= t < b), 'sit')
            kinds.append((t, kind_of(s, name, t)))
            t = round(t + 0.25, 3)
        seat = seat_at(s, t0)
        guess = theta_of([seat[0], seat[1], seat[2]], [0, 1, 0], [0, 0, 1], [0.15, 0, 0], [0.1, 0, 0])
        out.append((t0, t1, cam_of(s), kinds, guess))
    return out


SEGMENTS = segments()


def load_pose(clip):
    frames = []
    w = h = None
    for line in open(os.path.join(HERE, f'{clip}-pose.jsonl'), encoding='utf-8'):
        f = json.loads(line)
        w, h = f['w'], f['h']
        frames.append(f)
    frames.sort(key=lambda f: f['t'])
    return frames, np.array([W / w, H / h, 1.0])


SPIN = [(24.79, 0.0), (24.833, 4.6), (24.9, 12.7), (25.0, 35.0), (25.1, 58.6), (25.3, 96.2), (25.5, 133.6), (25.6, 165.1), (25.7, 176.2), (25.77, 180.0), (28.05, 180.0)]
CALL = (186.017, 193.233)
CALL_BOX = (112.0, 62.0, 1178.0, 705.0)


def spin_deg(t):
    if t < SPIN[0][0] or t >= SPIN[-1][0]:
        return 0.0
    for (a, va), (b, vb) in zip(SPIN, SPIN[1:]):
        if a <= t < b:
            return va + (vb - va) * (t - a) / (b - a)
    return 0.0


def unspin(kp, t):
    deg = spin_deg(t)
    if deg == 0.0:
        return kp
    a = -np.radians(deg)
    c, s = np.cos(a), np.sin(a)
    out = kp.copy()
    dx, dy = kp[:, 0] - W / 2, kp[:, 1] - H / 2
    out[:, 0] = W / 2 + dx * c - dy * s
    out[:, 1] = H / 2 + dx * s + dy * c
    return out


def uncall(kp, frame):
    if not (CALL[0] <= frame['t'] < CALL[1]):
        return kp
    x0, y0, x1, y1 = CALL_BOX
    kx, ky = frame['w'] / (x1 - x0), frame['h'] / (y1 - y0)
    out = kp.copy()
    out[:, 0] = W / 2 + (kp[:, 0] / (W / frame['w']) - (x0 + x1) / 2) * kx * (W / frame['w'])
    out[:, 1] = (kp[:, 1] / (H / frame['h']) - y0) * ky * (H / frame['h'])
    return out


def pick(frame, scale):
    best = None
    for p in frame['people']:
        b = p['box']
        score = (b[2] - b[0]) * (b[3] - b[1]) * p['conf']
        if best is None or score > best[0]:
            best = (score, p)
    if best is None:
        return None
    kp = np.array(best[1]['kp']) * scale
    CUR['t'] = frame['t']
    CUR['shot'] = next((x for x in reversed(SHOTS) if x['t'] <= frame['t'] + 1e-6 and not x.get('skip')), None)
    kp = uncall(unspin(kp, frame['t']), frame)
    kp[11:17, 2] = 0.0
    for i in (7, 8, 9, 10):
        if kp[i][1] > H * 0.985 or kp[i][2] < 0.35:
            kp[i][2] = 0.0
    for side, idx in (('L', (7, 9)), ('R', (8, 10))):
        if any(a <= frame['t'] < b for a, b in OFF[side]):
            kp[list(idx), 2] = 0.0
    return kp


OFF = {side: [span for s in SHOTS for span in s.get('off' + side, [])] for side in ('L', 'R')}


def contact(th, seg):
    return [(th[1] - seg['hy']) / seg['hs'] * 0.8]


def violation(q):
    v = max(0.0, q[2] + 0.12) * 8
    shot = CUR.get('shot')
    if shot is not None:
        seat = seat_at(shot, CUR['t'])
        back = seat[2] - 0.17 - max(0.0, q[1] - seat[1]) * 0.21
        v += max(0.0, back - q[2]) * 6
    return v


def leg_default(seg, hip, Rp, k):
    km = hip + np.array([k * 0.06, -0.04, 0.42])
    return km, km + np.array([k * 0.03, -0.43, 0.04])


def leg_need(seg):
    return 2.0


def leg_fix(seg, conf, kn, an):
    return an


def torso(theta, dims):
    out = rig.torso(theta, dims)
    ph, Rn = out['head']
    R = dims['head']
    out['pts']['nose'] = ph + Rn @ np.array([0.0, -0.28 * R, 1.06 * R])
    return out


fit.load_pose = load_pose
fit.pick = pick
fit.torso = torso

if __name__ == '__main__':
    fit.run(sys.modules[__name__], os.environ.get('YV_FIT') or os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))
