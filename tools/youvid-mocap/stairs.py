import json
import os
import subprocess
import sys
import tempfile
import numpy as np
from scipy.optimize import least_squares
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Cam, torso, rodrigues, theta_of, W, H
import fit
import export

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
CLIP = 'St41rsD4nc3'
POSE = os.path.join(HERE, f'{CLIP}-pose.jsonl')
OUT_JS = os.path.join(ROOT, 'js', 'apps', 'youvid', 'stairs-motion.js')
SRC_W, SRC_H = 1280, 720
STAND = 1.0
FIT = os.environ.get('YV_FIT', os.path.join(tempfile.gettempdir(), f'youvid-fit-{CLIP}.json'))

D = dict(hipX=0.088, hipY=-0.05, thigh=0.46, shin=0.45, chestY=0.13, neckY=0.335, shX=0.168, shY=0.262, upper=0.3, fore=0.27, headY=0.135, head=0.1, shoulderMark=(0.18, 0.25), hipMark=(0.1, -0.08, 0.02))
BOUNDS = (np.array([-4.0, -2.0, -45.0, -10, -10, -10, -0.7, -0.9, -0.7, -0.9, -1.2, -0.6]), np.array([4.0, 16.0, 10.0, 10, 10, 10, 0.7, 0.9, 0.7, 0.9, 1.2, 0.6]))

PROFILE = json.loads(subprocess.run(['node', os.path.join(HERE, 'stairs-profile.cjs')], capture_output=True, text=True, check=True).stdout)
SEGS = PROFILE['SEGS']
RISE, RUN, HALF, CHEEK = PROFILE['RISE'], PROFILE['RUN'], PROFILE['HALF'], PROFILE['CHEEK']


def seg_at(s):
    for g in SEGS:
        if s < g['s1']:
            return g
    return SEGS[-1]


def step_y(s):
    if s < 0:
        return 0.0
    g = seg_at(s)
    if g['kind'] == 'land':
        return g['y0']
    i = min(g['n'] - 1, int(np.floor((s - g['s0']) / RUN)))
    return g['y0'] + (i + 1) * RISE


def pitch_y(s):
    if s <= 0:
        return 0.0
    g = seg_at(s)
    if g['kind'] == 'land':
        return g['y0']
    return g['y0'] + (g['y1'] - g['y0']) * (s - g['s0']) / (g['s1'] - g['s0'])


def ground(p, smooth=False):
    s = -p[2]
    if abs(p[0]) <= HALF + 0.3:
        return pitch_y(s) + RISE * 0.5 if smooth else step_y(s)
    if p[0] < 0:
        return max(0.0, pitch_y(s) - 0.55)
    return pitch_y(s) + 0.25


LINES = [(-1e9, 0.0, 0.0, 0.0)] + [(g['s0'], g['s1'], g['y0'] + RISE * 0.5 * (g['kind'] == 'flight'), (g['y1'] - g['y0']) / (g['s1'] - g['s0'])) for g in SEGS]


def ray_hit(o, d):
    best = None
    for s0, s1, base, slope in LINES:
        a = base - slope * s0
        den = d[1] + slope * d[2]
        if abs(den) < 1e-9:
            continue
        t = (a - slope * o[2] - o[1]) / den
        if t <= 0.05:
            continue
        s = -(o[2] + d[2] * t)
        if s < s0 - 1e-6 or s > s1 + 1e-6:
            continue
        if best is None or t < best:
            best = t
    return None if best is None else o + d * best


def load_rows():
    rows = [json.loads(line) for line in open(POSE)]
    return rows


def pick(row):
    ppl = [p for p in row['p'] if p['conf'] > 0.35]
    if not ppl:
        return None
    best = max(ppl, key=lambda p: (p['box'][2] - p['box'][0]) * (p['box'][3] - p['box'][1]) * p['conf'])
    kp = np.array(best['kp'], float)
    kp[:, 0] *= W / SRC_W
    kp[:, 1] *= H / SRC_H
    return kp


def stair(x, s, h=STAND):
    return [x, step_y(s) + h, -s]


SHOTS = [
    dict(name='street', t0=23.482, t1=28.403, fov=48, eye0=stair(0.3, 15.6, 1.3), at0=[0.0, 20.0, -27.0], eye1=stair(0.3, 16.2, 1.3), at1=[0.0, 13.5, -24.0], move=True, x=0.1, s=24.5, yaw=0.0),
    dict(name='mcu', t0=28.403, t1=31.49, fov=40, eye0=stair(0.6, 19.6, 1.2), at0=stair(0.2, 22.5, 2.2), x=0.1, s=20.6, yaw=-0.3, upper=True, fixed=True),
    dict(name='side', t0=31.49, t1=33.617, fov=45, eye0=stair(1.2, 9.0, 0.9), at0=[-3.0, step_y(13) + 3.0, -14.0], x=-1.2, s=12.5, yaw=0.6),
    dict(name='high', t0=33.617, t1=36.578, fov=48, eye0=stair(0.3, 9.5, 1.7), at0=[-0.2, 0.5, 4.0], x=-0.4, s=5.3, yaw=np.pi),
    dict(name='wide1', t0=36.578, t1=40.082, fov=46, eye0=stair(0.1, 16.0, 0.8), at0=stair(0.0, 21.0, 1.8), x=0.1, s=19.5, yaw=0.0),
    dict(name='wide2', t0=41.375, t1=43.794, fov=46, eye0=stair(0.1, 15.5, 0.9), at0=stair(0.0, 21.0, 1.6), x=0.0, s=19.0, yaw=0.0),
    dict(name='graffiti', t0=43.794, t1=48.423, fov=45, eye0=stair(0.5, 9.9, 0.9), at0=[-4.6, step_y(11.5) + 3.0, -12.5], x=-1.2, s=11.0, yaw=-0.8, fixed=True),
    dict(name='wide3', t0=48.423, t1=50.759, fov=46, eye0=stair(-0.6, 8.0, 1.0), at0=stair(0.4, 14.0, 1.6), x=0.9, s=11.5, yaw=0.2),
    dict(name='top1', t0=50.759, t1=52.761, fov=42, eye0=stair(-1.3, 10.5, 4.2), at0=stair(-1.3, 10.52, 0.0), up=[0, 0, -1], x=-0.95, s=10.5, yaw=2.4, fixed=True, upW=3.0),
    dict(name='laugh', t0=52.761, t1=55.097, fov=40, eye0=stair(-0.3, 10.6, 1.0), at0=[-4.6, step_y(12) + 3.2, -12.5], x=-1.1, s=11.6, yaw=-0.5, upper=True, fixed=True),
    dict(name='front', t0=56.515, t1=67.234, fov=48, eye0=stair(0.0, 6.0, 1.5), at0=[0.0, 4.35, -14.0], eye1=stair(0.0, 5.6, 1.5), at1=[0.0, 4.35, -13.6], move=True, x=0.0, s=8.0, yaw=0.0, fixed=True, noLegs=True),
    dict(name='spin', t0=67.234, t1=69.403, fov=42, eye0=stair(0.45, 7.0, 0.95), at0=stair(0.1, 8.4, 1.75), x=0.2, s=8.3, yaw=0.0, upper=True, fixed=True),
    dict(name='escape', t0=82.958, t1=87.963, fov=46, eye0=stair(0.5, 4.0, 1.2), at0=stair(0.0, 14.0, 2.0), x=-0.6, s=7.5, yaw=0.3)
]

TORSO_KP = fit.TORSO_KP
KP_W = fit.KP_W


def cam_params(shot):
    v = list(shot['eye0']) + list(shot['at0'])
    if shot.get('move'):
        v += list(shot['eye1']) + list(shot['at1'])
    return np.array(v, float)


def cam_at(shot, v, t):
    u = np.clip((t - shot['t0']) / (shot['t1'] - shot['t0']), 0, 1)
    eye, at = v[0:3], v[3:6]
    if shot.get('move'):
        eye = eye + (v[6:9] - eye) * u
        at = at + (v[9:12] - at) * u
    return Cam(eye, at, shot['fov'], up=tuple(shot.get('up', (0, 1, 0))))


def planted(kp):
    best = None
    for i in (15, 16):
        if kp[i][2] > 0.45 and (best is None or kp[i][1] > kp[best][1]):
            best = i
    return best


def body_terms(th, kp, cam, shot, smooth_ground):
    out = []
    T = torso(th, D)
    for i, name in TORSO_KP.items():
        c = kp[i][2]
        w = KP_W[i] * (c if c > 0.3 else 0.0)
        out.extend((cam.project(T['pts'][name]) - kp[i][:2]) / 12.0 * w)
    p, Rp = T['pelvis']
    a = planted(kp) if not shot.get('upper') else None
    if a is not None:
        o, d = cam.ray(kp[a][0], kp[a][1])
        A = ray_hit(o, d)
        if A is not None:
            k = 1 if a == 15 else -1
            hip = p + Rp @ np.array([k * D['hipX'], D['hipY'], 0])
            dist = np.linalg.norm(A - hip)
            out.append(max(0.0, dist - 0.95) * 4.0)
            out.append(max(0.0, 0.5 - dist) * 4.0)
            out.append(max(0.0, A[1] + 0.45 - hip[1]) * 3.0)
        else:
            out.extend([3.0, 0.0, 0.0])
    out.append((p[1] - ground(p, smooth_ground) - STAND) * (0.6 if a is not None else 1.5))
    R = rodrigues(th[3:6])
    out.extend((R[:, 1] - np.array([0, 1, 0])) * shot.get('upW', 0.6))
    out.extend(th[6:12] * 0.25)
    out.append(max(0.0, abs(p[0]) - (HALF - 0.25)) * 3.0)
    return out


def guess_theta(shot):
    fwd = [np.sin(shot['yaw']), 0, np.cos(shot['yaw'])]
    return theta_of(stair(shot['x'], shot['s']), [0, 1, 0], fwd)


def calibrate(shot, rows):
    sel = [(r['t'], pick(r)) for r in rows if shot['t0'] <= r['t'] < shot['t1']]
    sel = [(t, kp) for t, kp in sel if kp is not None and np.mean(kp[5:7, 2]) > 0.5]
    if not sel:
        return cam_params(shot), []
    idx = np.linspace(0, len(sel) - 1, min(6, len(sel))).round().astype(int)
    sel = [sel[i] for i in sorted(set(idx))]
    c0 = cam_params(shot)
    if shot.get('fixed'):
        return c0, sel
    nc = len(c0)
    th0 = guess_theta(shot)
    v0 = np.concatenate([c0] + [th0.copy() for _ in sel])
    lo_c, hi_c = c0 - 3.0, c0 + 3.0
    for i in shot.get('lock', []):
        lo_c[i], hi_c[i] = c0[i] - 1e-4, c0[i] + 1e-4
    lo = np.concatenate([lo_c] + [BOUNDS[0] for _ in sel])
    hi = np.concatenate([hi_c] + [BOUNDS[1] for _ in sel])

    def res(v):
        out = []
        for i, (t, kp) in enumerate(sel):
            cam = cam_at(shot, v[:nc], t)
            th = v[nc + 12 * i: nc + 12 * i + 12]
            out.extend(body_terms(th, kp, cam, shot, True))
            e = cam.eye
            out.append(max(0.0, ground(e, True) + 0.25 - e[1]) * 5.0)
        out.extend((v[:nc] - c0) * 0.04)
        if shot.get('move'):
            out.extend((v[6:9] - v[0:3]) * 0.05)
        return np.array(out)

    r = least_squares(res, np.clip(v0, lo + 1e-6, hi - 1e-6), bounds=(lo, hi), max_nfev=200, loss='soft_l1', f_scale=1.5)
    return r.x[:nc], sel


def fit_shot(shot, rows, cv):
    recs = []
    prev = None
    prevL = {}
    th0 = guess_theta(shot)
    for r in rows:
        t = r['t']
        if t < shot['t0'] - 1e-6 or t >= shot['t1'] - 1e-6:
            continue
        kp = pick(r)
        if kp is None or np.mean(kp[5:7, 2]) < 0.3:
            continue
        cam = cam_at(shot, cv, t)
        start = prev if prev is not None else th0
        smooth = np.array([1.2, 1.2, 1.2, 0.7, 0.7, 0.7, 0.5, 0.5, 0.5, 0.35, 0.35, 0.35]) * (0.0 if prev is None else 1.0)

        def res(th):
            out = body_terms(th, kp, cam, shot, False)
            out.extend((th - start) * smooth)
            return np.array(out)

        if prev is None:
            best = None
            for yaw in np.linspace(0, 2 * np.pi, 8, endpoint=False):
                g = th0.copy()
                g[3:6] = theta_of([0, 0, 0], [0, 1, 0], [np.sin(yaw), 0, np.cos(yaw)])[3:6]
                rr = least_squares(res, np.clip(g, BOUNDS[0] + 1e-6, BOUNDS[1] - 1e-6), bounds=BOUNDS, max_nfev=300, loss='soft_l1', f_scale=1.5)
                if best is None or rr.cost < best.cost:
                    best = rr
            th = best.x
        else:
            th = least_squares(res, np.clip(start, BOUNDS[0] + 1e-6, BOUNDS[1] - 1e-6), bounds=BOUNDS, max_nfev=300, loss='soft_l1', f_scale=1.5).x
        T = torso(th, D)
        errs = [np.linalg.norm(cam.project(T['pts'][nm]) - kp[i][:2]) for i, nm in TORSO_KP.items() if kp[i][2] > 0.3]
        err = float(np.median(errs)) if errs else 99.0
        if err > 30:
            continue
        p, Rp = T['pelvis']
        pc, Rc = T['chest']
        rec = {'t': t, 'th': th.tolist(), 'err': err}

        def violation(q):
            return max(0.0, ground(q) + 0.07 - q[1]) * 10.0 + max(0.0, q[1] - p[1] - 0.25) * 6.0

        for k, s, ie, iw, ik_, ia in ((1, 'L', 7, 9, 13, 15), (-1, 'R', 8, 10, 14, 16)):
            sh = T['pts']['joint' + s]
            dm = sh + Rc @ np.array([k * 0.06, -0.3, 0.02])
            de = sh + Rc @ np.array([k * 0.08, -0.56, 0.06])
            el, wr, cA = fit.limb(cam, sh, kp, ie, iw, D['upper'], D['fore'], prevL.get('el' + s), prevL.get('wr' + s), dm, de, 0.3, violation)
            hip = p + Rp @ np.array([k * D['hipX'], D['hipY'], 0])
            km = hip + Rp @ np.array([k * 0.02, -D['thigh'], 0.04])
            ka = hip + Rp @ np.array([k * 0.03, -D['thigh'] - D['shin'], 0.0])
            need = 2.0 if shot.get('upper') or shot.get('noLegs') else 0.45
            if need > 1:
                kn, an = km, ka
            else:
                kn, an, cL = fit.limb(cam, hip, kp, ik_, ia, D['thigh'], D['shin'], prevL.get('kn' + s), prevL.get('an' + s), km, ka, need, violation)
            g = ground(an) + 0.085
            if an[1] < g:
                an = np.array([an[0], g, an[2]])
            prevL.update({'el' + s: el, 'wr' + s: wr, 'kn' + s: kn, 'an' + s: an})
            rec.update({'el' + s: el.tolist(), 'wr' + s: wr.tolist(), 'kn' + s: kn.tolist(), 'an' + s: an.tolist()})
        recs.append(rec)
        prev = th
    return recs


def channels(rec, origin):
    th = np.array(rec['th'])
    R = rodrigues(th[3:6])
    vals = list(th[0:3] - origin) + list(R[:, 1]) + list(R[:, 2]) + list(th[6:9]) + list(th[9:12])
    for k in ('wrL', 'elL', 'wrR', 'elR', 'anL', 'knL', 'anR', 'knR'):
        vals += list(np.array(rec[k]) - origin)
    return np.array(vals)


def segment(shot, recs):
    ts = np.array([r['t'] for r in recs])
    origin = np.round(np.mean([np.array(r['th'][0:3]) for r in recs], axis=0), 3)
    vals = export.smooth(np.array([channels(r, origin) for r in recs]), 0.7)
    keep = export.reduce(ts, vals, 0.01)
    data = ''.join(export.tcode(ts[i] - shot['t0']) + ''.join(export.enc(v) for v in vals[i]) for i in keep)
    return {'t0': shot['t0'], 't1': shot['t1'], 'o': origin.tolist(), 'data': data, 'n': len(keep)}


def main():
    rows = load_rows()
    only = sys.argv[1:] or None
    old = {}
    if os.path.exists(FIT):
        old = json.load(open(FIT))
    out = dict(old)
    for shot in SHOTS:
        if only and shot['name'] not in only:
            continue
        cv, sel = calibrate(shot, rows)
        recs = fit_shot(shot, rows, cv)
        errs = [r['err'] for r in recs]
        hts = [r['th'][1] - step_y(-r['th'][2]) for r in recs]
        ss = [-r['th'][2] for r in recs]
        print(f"{shot['name']:9s} cam eye {np.round(cv[0:3], 2).tolist()} at {np.round(cv[3:6], 2).tolist()} frames {len(recs)} err med {np.median(errs) if errs else -1:.1f} hip-above {np.median(hts) if hts else -1:.2f} s {min(ss) if ss else -1:.1f}..{max(ss) if ss else -1:.1f}")
        cam = {'t0': shot['t0'], 't1': shot['t1'], 'fov': shot['fov'], 'eye0': np.round(cv[0:3], 3).tolist(), 'at0': np.round(cv[3:6], 3).tolist(), 'up': list(shot.get('up', (0, 1, 0)))}
        if shot.get('move'):
            cam['eye1'] = np.round(cv[6:9], 3).tolist()
            cam['at1'] = np.round(cv[9:12], 3).tolist()
        out[shot['name']] = {'cam': cam, 'recs': recs}
    json.dump(out, open(FIT, 'w'))
    segs, cams = [], {}
    for shot in SHOTS:
        e = out.get(shot['name'])
        if not e:
            continue
        cams[shot['name']] = e['cam']
        if len(e['recs']) >= 2:
            segs.append(segment(shot, e['recs']))
    lines = ['(function () {', '  window.YouVidMotion = window.YouVidMotion || {};']
    body = ',\n'.join(f"      {{ t0: {s['t0']}, t1: {s['t1']}, o: [{', '.join(str(v) for v in s['o'])}], data: '{s['data']}' }}" for s in segs)
    lines.append(f"  window.YouVidMotion['{CLIP}:joker'] = {{\n    channels: 39,\n    segs: [\n{body}\n    ]\n  }};")
    lines.append(f"  window.YouVidMotion['{CLIP}:cams'] = {json.dumps(cams, separators=(', ', ': '))};")
    lines.append('})();')
    js = '\n'.join(lines) + '\n'
    open(OUT_JS, 'w', encoding='utf-8', newline='\n').write(js)
    print(OUT_JS, len(js), 'bytes', sum(s['n'] for s in segs), 'keys')


if __name__ == '__main__':
    main()
