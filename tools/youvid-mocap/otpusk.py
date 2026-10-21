import json
import os
import sys
import tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, W, H, torso, theta_of, rodrigues, to_rotvec, ry
import fit

CLIP = 'Sav3lOtpusk'
D = dict(hipX=0.13, hipY=-0.05, thigh=0.46, shin=0.45, chestY=0.13, neckY=0.34, shX=0.24, shY=0.235, upper=0.31, fore=0.27, headY=0.155, head=0.11, shoulderMark=(0.25, 0.27), hipMark=(0.17, -0.1, 0.05))
FOV = 42
VIDEO_START = 1.66
MAX_ERR = 26
BOUNDS = (np.array([-6, -6, -14, -10, -10, -10, -0.8, -0.8, -0.8, -0.9, -1.3, -0.6]), np.array([6, 6, -0.15, 10, 10, 10, 0.8, 0.8, 0.8, 0.9, 1.3, 0.6]))
CAM = Cam([0, 0, 0], [0, 0, -1], FOV)

STAND = dict(kind='stand', z=-2.0, zs=4.0, fwd=None, up=None, look=0.15, spReg=(3.0, 12.0, 10.0), neckReg=(1.2, 1.2, 2.0), smooth=0.6)

SKIP = [(48.8, 51.6), (77.0, 80.0), (113.0, 115.5), (145.0, 153.0), (271.5, 277.5), (333.0, 336.0), (420.5, 424.5), (503.0, 506.0), (607.0, 610.5), (819.0, 823.5), (833.0, 835.5), (870.5, 874.0), (899.0, 905.0)]


CAM_Y = (0.35, 0.22, 3.0)


def contact(th, seg):
    T = torso(th, D)
    pc, Rc = T['chest']
    cam_y = Rc[:, 1] @ (-pc)
    return [(cam_y - CAM_Y[0]) / CAM_Y[1] * CAM_Y[2]]


def violation(q):
    return 0.0


def leg_default(seg, hip, Rp, k):
    return hip + Rp @ np.array([k * 0.03, -0.46, 0.05]), hip + Rp @ np.array([k * 0.05, -0.9, 0.0])


def leg_need(seg):
    return 0.6


def leg_fix(seg, conf, kn, an):
    return an


def skipped(t):
    return any(a <= t < b for a, b in SKIP)


def pick(frame, scale, prev_box):
    best = None
    for p in frame['people']:
        kp = np.array(p['kp'])
        if kp[5][2] < 0.35 and kp[6][2] < 0.35:
            continue
        b = p['box']
        area = (b[2] - b[0]) * (b[3] - b[1])
        score = area * p['conf']
        if prev_box is not None:
            cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            px, py = (prev_box[0] + prev_box[2]) / 2, (prev_box[1] + prev_box[3]) / 2
            score /= 1 + np.hypot(cx - px, cy - py) / 400
        if best is None or score > best[0]:
            best = (score, p)
    if best is None:
        return None, None
    return np.array(best[1]['kp']) * scale, best[1]['box']


def flipped(th):
    out = th.copy()
    R = rodrigues(th[3:6])
    Rf = R @ ry(np.pi)
    out[3:6] = to_rotvec(Rf)
    return out


def run(out_path):
    frames, scale = load()
    recs = []
    prev = theta_of([0, -0.3, -1.6], [0, 1, 0], [0, 0, 1])
    prevL = {}
    prev_box = None
    last_t = -10
    lo, hi = [float(x) for x in os.environ.get('YV_RANGE', '0,99999').split(',')]
    for f in frames:
        t = f['t'] + VIDEO_START
        if skipped(t) or t < lo or t >= hi:
            continue
        kp, box = pick(f, scale, prev_box if t - last_t < 1.0 else None)
        if kp is None:
            continue
        fresh = t - last_t > 0.6
        seg = dict(STAND)
        guesses = [prev, flipped(prev)]
        if fresh:
            nose = kp[0][2] > 0.5
            guesses = [theta_of([0, -0.3, -1.6], [0, 1, 0], [0, 0, 1] if nose else [0, 0, -1]), theta_of([0, -0.3, -1.6], [0, 1, 0], [0, 0, -1] if nose else [0, 0, 1]), prev]
        smooth = np.array([1.5, 1.5, 1.5, 0.8, 0.8, 0.8, 0.6, 0.6, 0.6, 0.4, 0.4, 0.4]) * (0.05 if fresh else seg['smooth'])
        best = None
        for g in guesses:
            th, err = fit.fit_torso(sys.modules[__name__], CAM, kp, g, smooth, seg)
            if best is None or err < best[1]:
                best = (th, err)
        th, err = best
        if err > MAX_ERR:
            continue
        T = torso(th, D)
        p, Rp = T['pelvis']
        pc, Rc = T['chest']
        rec = {'t': round(t, 3), 'th': th.tolist(), 'err': err}
        for k, s, ie, iw in ((1, 'L', 7, 9), (-1, 'R', 8, 10)):
            sh = T['pts']['joint' + s]
            dm = sh + Rc @ np.array([k * 0.08, -0.3, 0.05])
            de = sh + Rc @ np.array([k * 0.1, -0.55, 0.12])
            el, wr, cA = fit.limb(CAM, sh, kp, ie, iw, D['upper'], D['fore'], None if fresh else prevL.get('el' + s), None if fresh else prevL.get('wr' + s), dm, de, 0.35, violation)
            prevL.update({'el' + s: el, 'wr' + s: wr})
            rec.update({'el' + s: el.tolist(), 'wr' + s: wr.tolist(), 'cA' + s: float(cA), 'sh' + s: sh.tolist()})
        recs.append(rec)
        prev = th
        prev_box = box
        last_t = t
    json.dump(recs, open(out_path, 'w'))
    errs = [r['err'] for r in recs]
    print('frames', len(recs), 'of', len(frames), 'median err', np.median(errs))


def load():
    path = os.environ.get('YV_POSE') or os.path.join(os.path.dirname(os.path.abspath(__file__)), f'{CLIP}-pose.jsonl')
    lines = [json.loads(l) for l in open(path) if l.strip()]
    head, frames = lines[0], lines[1:]
    return frames, np.array([W / head['w'], H / head['h'], 1.0])


if __name__ == '__main__':
    run(os.environ.get('YV_FIT') or os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))
