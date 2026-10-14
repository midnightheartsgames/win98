import os
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, theta_of
import fit

CLIP = 'vEryN1ceGdN'
D = dict(hipX=0.11, hipY=-0.05, thigh=0.46, shin=0.45, chestY=0.13, neckY=0.36, shX=0.21, shY=0.25, upper=0.3, fore=0.27, headY=0.15, head=0.105, shoulderMark=(0.2, 0.3), hipMark=(0.12, -0.1, 0.03))
STAND = 1.0
MAX_ERR = 22
BOUNDS = (np.array([-1.5, 0.5, -1.5, -10, -10, -10, -0.7, -0.7, -0.7, -0.9, -1.2, -0.6]), np.array([1.5, 1.3, 1.5, 10, 10, 10, 0.7, 0.7, 0.7, 0.9, 1.2, 0.6]))

CAM = Cam([0.362, 1.133, 1.576], [0.361, 1.133, 0.576], 44)

UPRIGHT = dict(kind='stand', z=0.0, zs=0.4, fwd=None, up=(0, 1, 0), look=0.0, hy=STAND, neckReg=(0.4, 5.0, 4.0))

SEGMENTS = [
    (0.0, 10.1, CAM, [(0.0, UPRIGHT)], theta_of([0.0, STAND, 0.0], [0, 1, 0], [0, 0, 1])),
]


def contact(th, seg):
    if seg.get('kind') != 'stand':
        return []
    return [(th[1] - seg.get('hy', STAND)) * 4.0]


def violation(q):
    return max(0.0, 0.03 - q[1]) * 10


def leg_default(seg, hip, Rp, k):
    return hip + np.array([k * 0.03, -0.46, 0.05]), hip + np.array([k * 0.05, -0.9, 0.0])


def leg_need(seg):
    return 0.6


def leg_fix(seg, conf, kn, an):
    return an


if __name__ == '__main__':
    fit.run(sys.modules[__name__], os.environ.get('YV_FIT') or os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))
