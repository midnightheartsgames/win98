import json
import os
import sys
import numpy as np
from scipy.optimize import least_squares
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import W, H, torso, rodrigues, lift

HERE = os.path.dirname(os.path.abspath(__file__))
TORSO_KP = {0: 'nose', 1: 'eyeL', 2: 'eyeR', 3: 'earL', 4: 'earR', 5: 'shoulderL', 6: 'shoulderR', 11: 'hipL', 12: 'hipR'}
KP_W = {0: 0.6, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 1.0, 6: 1.0, 11: 0.8, 12: 0.8}


def pose_path(clip):
    return os.path.join(HERE, f'{clip}-pose.json')


def load_pose(clip):
    data = json.load(open(pose_path(clip)))
    scale = np.array([W / data['w'], H / data['h'], 1.0])
    return data['frames'], scale


def pick(frame, scale):
    best = None
    for p in frame['people']:
        b = p['box']
        score = (b[2] - b[0]) * (b[3] - b[1]) * p['conf']
        if best is None or score > best[0]:
            best = (score, p)
    if best is None:
        return None
    return np.array(best[1]['kp']) * scale


def fit_torso(cfg, cam, kp, prev, smooth, seg):
    lo, hi = cfg.BOUNDS
    reg = np.array([0, 0, 0, 0, 0, 0] + list(seg.get('spReg', (2.0, 2.0, 2.0))) + list(seg.get('neckReg', (2.5, 1.6, 2.5))))

    def res(th):
        T = torso(th, cfg.D)
        out = []
        for i, name in TORSO_KP.items():
            c = kp[i][2]
            w = KP_W[i] * (c if c > 0.3 else 0.0)
            e = (cam.project(T['pts'][name]) - kp[i][:2]) / 12.0
            out.extend(e * w)
        out.extend((th - prev) * smooth)
        out.extend(th * reg * 0.15)
        out.extend(cfg.contact(th, seg))
        out.append((th[2] - seg['z']) / seg['zs'] * 0.8)
        R = rodrigues(th[3:6])
        if seg['fwd'] is not None:
            fe = np.array(seg['fwd'], float)
            out.extend((R[:, 2] - fe / np.linalg.norm(fe)) * 5.0)
        if seg['up'] is not None:
            ue = np.array(seg['up'], float)
            out.extend((R[:, 1] - ue / np.linalg.norm(ue)) * 3.0)
        if seg['kind'] == 'lie':
            out.extend(th[6:9] * 2.5)
        ph, Rn = T['head']
        look = cam.eye - ph
        look = look / np.linalg.norm(look)
        out.extend((Rn[:, 2] - look) * seg.get('look', 0.9 if seg['kind'] == 'sit' else 0.3))
        return np.array(out)

    x0 = np.clip(prev, lo + 1e-6, hi - 1e-6)
    r = least_squares(res, x0, bounds=(lo, hi), max_nfev=300, loss='soft_l1', f_scale=1.5)
    T = torso(r.x, cfg.D)
    errs = [np.linalg.norm(cam.project(T['pts'][name]) - kp[i][:2]) for i, name in TORSO_KP.items() if kp[i][2] > 0.3]
    return r.x, float(np.median(errs)) if errs else 99.0


def limb(cam, root, kp, i_mid, i_end, l1, l2, prev_mid, prev_end, default_mid, default_end, need, violation):
    c1, c2 = kp[i_mid][2], kp[i_end][2]
    if c1 > need:
        mid, ok = lift(cam, root, kp[i_mid][:2], l1, prev=prev_mid, prefer=default_mid, violation=violation)
    else:
        mid = prev_mid if prev_mid is not None else default_mid
        v = mid - root
        mid = root + v / max(1e-6, np.linalg.norm(v)) * l1
    if c2 > need:
        end, ok = lift(cam, mid, kp[i_end][:2], l2, prev=prev_end, prefer=default_end, violation=violation)
    else:
        end = prev_end if prev_end is not None else default_end
        v = end - mid
        end = mid + v / max(1e-6, np.linalg.norm(v)) * l2
    return mid, end, min(c1, c2)


def run(cfg, fit_path):
    D = cfg.D
    frames, scale = load_pose(cfg.CLIP)
    out = []
    for t0, t1, cam, kinds, guess in cfg.SEGMENTS:
        prev = guess.copy()
        prevL = {}
        recs = []
        for f in frames:
            t = f['t']
            if t < t0 - 1e-6 or t >= t1 - 1e-6:
                continue
            kp = pick(f, scale)
            if kp is None:
                continue
            seg = kinds if isinstance(kinds, dict) else [k for tk, k in kinds if tk <= t + 1e-6][-1]
            smooth = np.array([1.5, 1.5, 1.5, 0.8, 0.8, 0.8, 0.6, 0.6, 0.6, 0.4, 0.4, 0.4]) * (3.0 if not recs else 1.0) * seg.get('smooth', 1.0)
            th, err = fit_torso(cfg, cam, kp, prev, smooth, seg)
            if err > cfg.MAX_ERR:
                continue
            T = torso(th, D)
            p, Rp = T['pelvis']
            pc, Rc = T['chest']
            rec = {'t': t, 'th': th.tolist(), 'err': err}
            for k, s, ie, iw, ik_, ia in ((1, 'L', 7, 9, 13, 15), (-1, 'R', 8, 10, 14, 16)):
                sh = T['pts']['joint' + s]
                dm = sh + Rc @ np.array([k * 0.08, -0.3, 0.05])
                de = sh + Rc @ np.array([k * 0.1, -0.5, 0.2])
                el, wr, cA = limb(cam, sh, kp, ie, iw, D['upper'], D['fore'], prevL.get('el' + s), prevL.get('wr' + s), dm, de, 0.3, cfg.violation)
                hip = p + Rp @ np.array([k * D['hipX'], D['hipY'], 0])
                km, ka = cfg.leg_default(seg, hip, Rp, k)
                kn, an, cL = limb(cam, hip, kp, ik_, ia, D['thigh'], D['shin'], prevL.get('kn' + s), prevL.get('an' + s), km, ka, cfg.leg_need(seg), cfg.violation)
                an = cfg.leg_fix(seg, kp[ia][2], kn, an)
                prevL.update({'el' + s: el, 'wr' + s: wr, 'kn' + s: kn, 'an' + s: an})
                rec.update({'el' + s: el.tolist(), 'wr' + s: wr.tolist(), 'kn' + s: kn.tolist(), 'an' + s: an.tolist(), 'cA' + s: cA, 'cL' + s: cL})
            recs.append(rec)
            prev = th
        out.append({'t0': t0, 't1': t1, 'frames': recs})
        errs = [r['err'] for r in recs]
        print(f'{t0:6.2f}-{t1:6.2f} frames {len(recs)} err median px {np.median(errs):.1f} max {np.max(errs):.1f}')
    json.dump(out, open(fit_path, 'w'))
    print(fit_path)
