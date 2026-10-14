import os
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, torso, theta_of
import fit

CLIP = 'i9AyI356ye4'
D = dict(hipX=0.13, hipY=-0.05, thigh=0.46, shin=0.45, chestY=0.13, neckY=0.34, shX=0.24, shY=0.235, upper=0.31, fore=0.27, headY=0.155, head=0.11, shoulderMark=(0.22, 0.295), hipMark=(0.16, -0.1, 0.05))
TOP = 0.47
MAX_ERR = 22
BOUNDS = (np.array([-1.2, TOP - 0.2, 0.05, -10, -10, -10, -0.7, -0.7, -0.7, -0.6, -1.1, -0.55]), np.array([1.3, 1.4, 1.0, 10, 10, 10, 0.7, 0.7, 0.7, 0.75, 1.1, 0.55]))

MAIN = Cam([-0.26, 1.03, 2.66], [0.08, 0.71, 0.45], 32)
CAMA = Cam([-0.452, 1.356, 1.724], [0.001, 0.7, 0.814], 58)
CAMC = Cam([-0.29, 1.05, 1.81], [-0.27, 0.7, 0.46], 44)

CHEST = [(-0.17, 0.32, 0.26, 0.07), (-0.06, 0.35, 0.29, 0.09), (0.05, 0.35, 0.28, 0.07), (0.14, 0.335, 0.25, 0.03), (0.22, 0.31, 0.22, 0.0)]
PELV = [(-0.17, 0.17, 0.14, -0.01), (-0.09, 0.275, 0.215, -0.03), (-0.01, 0.3, 0.235, -0.02)]
ANG = np.linspace(0, 2 * np.pi, 16, endpoint=False)


def ring_pts(rings):
    pts = []
    for y, rx_, rz_, cz in rings:
        for a in ANG:
            pts.append([np.sin(a) * rx_, y, cz + np.cos(a) * rz_])
    return np.array(pts)


CHEST_PTS = ring_pts(CHEST)
PELV_PTS = ring_pts(PELV)

SIT = dict(kind='sit', z=0.72, zs=0.1, sink=-0.1, fwd=(0, 0.1, 1), up=None)
BACK = dict(kind='lie', z=0.58, zs=0.07, sink=-0.07, fwd=(0, 1, 0), up=(-1, 0, 0))
ROLL = dict(kind='lie', z=0.58, zs=0.07, sink=-0.07, fwd=(0, 0.6, 0.8), up=(-1, 0, 0))
FALL = dict(kind='lie', z=0.55, zs=0.2, sink=-0.05, fwd=(0.15, 0.55, 0.8), up=None)
SIDEA = dict(kind='lie', z=0.78, zs=0.1, sink=-0.2, fwd=(0.1, -0.1, 0.98), up=(0.75, 0.65, -0.05))
BACKC = dict(kind='lie', z=0.6, zs=0.1, sink=-0.07, fwd=(0.3, 0.9, 0.3), up=(-0.8, 0.4, -0.4))

SEGMENTS = [
    (0.0, 9.7, CAMA, [(0.0, SIDEA)], theta_of([0.21, TOP, 0.7], [0.82, 0.57, -0.04], [0.18, -0.2, 0.96])),
    (9.7, 20.03, MAIN, [(9.7, SIT), (10.9, FALL), (11.9, BACK)], theta_of([-0.07, TOP + 0.17, 0.66], [0, 1, -0.1], [0, 0.1, 1], [0.1, 0, 0])),
    (26.2, 40.37, CAMC, [(26.2, BACKC)], theta_of([-0.22, TOP + 0.05, 0.58], [-0.8, 0.4, -0.4], [0.3, 0.9, 0.3])),
    (42.13, 60.83, MAIN, [(42.13, BACK), (43.8, ROLL), (47.5, FALL), (50.0, SIT)], theta_of([0.0, TOP + 0.24, 0.42], [-1, 0, 0], [0, 1, 0])),
    (60.83, 63.8, MAIN, [(60.83, SIT), (61.3, FALL), (62.9, BACK)], theta_of([0.38, TOP + 0.17, 0.66], [0, 1, -0.1], [0, 0.1, 1], [0.1, 0, 0])),
]


def lowest(th):
    T = torso(th, D)
    p, Rp = T['pelvis']
    pc, Rc = T['chest']
    fz = np.clip((abs(Rc[1, 2]) - 0.35) / 0.5, 0, 1)
    fx = np.clip((abs(Rc[1, 0]) - 0.35) / 0.5, 0, 1)
    spread = np.array([1 + 0.15 * fz - 0.35 * fx, 1.0, 1 - 0.4 * fz + 0.12 * fx])
    ys = np.concatenate([((PELV_PTS * spread) @ Rp.T + p)[:, 1], ((CHEST_PTS * spread) @ Rc.T + pc)[:, 1]])
    return ys.min()


def contact(th, seg):
    return [(lowest(th) - TOP - seg['sink']) * 6.0]


def violation(q):
    v = 0.0
    if -1.05 < q[0] < 1.05 and -0.05 < q[2] < 0.95:
        v += max(0.0, TOP + 0.02 - q[1]) * 10
    v += max(0.0, 0.03 - q[1]) * 10
    v += max(0.0, q[2] - 1.35) * 5
    v += max(0.0, 0.0 - q[2]) * 5
    return v


def leg_default(seg, hip, Rp, k):
    if seg['kind'] == 'sit':
        km = hip + np.array([k * 0.06, -0.05, 0.44])
        return km, km + np.array([k * 0.02, -0.42, 0.06])
    return hip + Rp @ np.array([k * 0.04, -0.42, 0.12]), hip + Rp @ np.array([k * 0.06, -0.86, 0.05])


def leg_need(seg):
    return 0.3 if seg['kind'] == 'sit' else 0.55


def leg_fix(seg, conf, kn, an):
    if seg['kind'] == 'sit' and conf <= 0.3:
        v = an - kn
        an = kn + np.array([v[0] * 0.3, -abs(v[1]) - 0.2, v[2] * 0.3])
        an = kn + (an - kn) / np.linalg.norm(an - kn) * D['shin']
    return an


if __name__ == '__main__':
    fit.run(sys.modules[__name__], os.environ.get('YV_FIT') or os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))
