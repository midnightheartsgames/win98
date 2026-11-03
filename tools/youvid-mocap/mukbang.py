import math
import os
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, theta_of
import rig
import fit

CLIP = 'Str4nnInTr0'
D = dict(hipX=0.13, hipY=-0.05, thigh=0.5, shin=0.48, chestY=0.13, neckY=0.33, shX=0.235, shY=0.235, upper=0.31, fore=0.27, headY=0.15, head=0.105, shoulderMark=(0.215, 0.27), hipMark=(0.16, -0.1, 0.05))
EYE_H = 1.379
PITCH = math.radians(25.5)
FOV = 44.5
MAX_ERR = 26
SEAT = (-0.03, 0.62, -1.32)
BOUNDS = (np.array([-0.6, 0.35, -1.6, -10, -10, -10, -0.45, -0.7, -0.6, -0.9, -1.25, -0.7]), np.array([0.6, 1.2, -0.6, 10, 10, 10, 1.0, 0.7, 0.6, 0.9, 1.25, 0.7]))
CAM = Cam([0, EYE_H, 0], [0, EYE_H - math.sin(PITCH), -math.cos(PITCH)], FOV)
SPANS = [(6.8, 27.7), (44.7, 58.58)]


def kind_at(t):
    z = SEAT[2] + 0.06 if t < 7.4 or 44.7 <= t < 45.6 else SEAT[2]
    return dict(kind='sit', z=z, zs=0.09, fwd=(0, 0.05, 1), up=(0, 1, 0), look=0.35, hy=SEAT[1], hs=0.05, spReg=(7.0, 2.0, 3.0), neckReg=(0.8, 1.0, 1.6))


def segments():
    out = []
    lo, hi = [float(x) for x in os.environ.get('YV_RANGE', '0,1e9').split(',')]
    for t0, t1 in SPANS:
        if t1 <= lo or t0 >= hi:
            continue
        kinds = []
        t = t0
        while t < t1:
            kinds.append((t, kind_at(t)))
            t = round(t + 0.25, 3)
        guess = theta_of(list(SEAT), [0, 1, 0], [0, 0, 1], [0.15, 0, 0], [0.05, 0, 0])
        out.append((t0, t1, CAM, kinds, guess))
    return out


SEGMENTS = segments()


def pick(frame, scale):
    best = None
    for p in frame['people']:
        b = p['box']
        if b[0] > 1080:
            continue
        score = (b[2] - b[0]) * (b[3] - b[1]) * p['conf']
        if best is None or score > best[0]:
            best = (score, p)
    if best is None:
        return None
    kp = np.array(best[1]['kp']) * scale
    kp[11:17, 2] = 0.0
    for i in (7, 8, 9, 10):
        if kp[i][2] < 0.35:
            kp[i][2] = 0.0
    return kp


def contact(th, seg):
    return [(th[1] - seg['hy']) / seg['hs'] * 0.8]


def violation(q):
    v = max(0.0, 0.79 - q[1]) * 6 if q[2] > -0.95 and abs(q[0] + 0.05) < 0.33 else 0.0
    v += max(0.0, q[2] + 0.62) * 8
    v += max(0.0, -1.42 - q[2]) * 6
    return v


def elbow_violation(q):
    v = max(0.0, q[2] + 1.08) * 12
    v += max(0.0, -1.5 - q[2]) * 6
    v += max(0.0, 0.62 - q[1]) * 6
    return v


def limb(cam, root, kp, i_mid, i_end, l1, l2, prev_mid, prev_end, default_mid, default_end, need, violation):
    mid_rule = elbow_violation if i_mid in (7, 8) else violation
    c1, c2 = kp[i_mid][2], kp[i_end][2]
    if c1 > need:
        mid, _ = rig.lift(cam, root, kp[i_mid][:2], l1, prev=prev_mid, prefer=default_mid, violation=mid_rule)
    else:
        mid = prev_mid if prev_mid is not None else default_mid
        v = mid - root
        mid = root + v / max(1e-6, np.linalg.norm(v)) * l1
    if c2 > need:
        end, _ = rig.lift(cam, mid, kp[i_end][:2], l2, prev=prev_end, prefer=default_end, violation=violation)
    else:
        end = prev_end if prev_end is not None else default_end
        v = end - mid
        end = mid + v / max(1e-6, np.linalg.norm(v)) * l2
    return mid, end, min(c1, c2)


def leg_default(seg, hip, Rp, k):
    km = hip + np.array([k * 0.08, 0.02, 0.48])
    return km, np.array([km[0] + k * 0.03, 0.08, km[2] + 0.06])


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


fit.pick = pick
fit.torso = torso
fit.limb = limb

if __name__ == '__main__':
    fit.run(sys.modules[__name__], os.environ.get('YV_FIT') or os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))
