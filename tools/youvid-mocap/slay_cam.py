import json
import os
import sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.join(HERE, '..', '..', 'content', 'video', 'Теперь я extremely slay, меньше волос.mp4')
POSE = os.path.join(HERE, 'eXtr3meSlay-pose.json')
W, H = 960, 540
FOV = float(os.environ.get('YV_FOV', 44))
SHOTS = [(0.3, 1.9, [(0.0, 0.0, 0.4, 1.0), (0.87, 0.0, 1.0, 1.0)]), (1.9, 4.21, None), (4.21, 8.1, None)]
STEP = 1 / 30


def intrinsics():
    f = (H / 2) / np.tan(np.radians(FOV) / 2)
    return np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1.0]])


def boxes_at(frames, t, sx, sy):
    f = min(frames, key=lambda q: abs(q['t'] - t))
    out = []
    for p in f['people']:
        if p['conf'] < 0.25:
            continue
        b = p['box']
        out.append((b[0] * sx, b[1] * sy, b[2] * sx, b[3] * sy))
    return out


def mask_for(boxes, keep):
    m = np.full((H, W), 255, np.uint8)
    if keep:
        m[:] = 0
        for x0, y0, x1, y1 in keep:
            m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = 255
    for x0, y0, x1, y1 in boxes:
        pad = 0.08 * (x1 - x0)
        cv2.rectangle(m, (int(x0 - pad), int(y0 - pad)), (int(x1 + pad), H), 0, -1)
    return m


def gl_ypr(R):
    C = np.diag([1.0, -1.0, -1.0])
    M = (C @ R @ C).T
    return rot_to_ypr(M)


def rot_to_ypr(R):
    yaw = np.arctan2(R[0, 2], R[2, 2])
    pitch = np.arcsin(np.clip(-R[1, 2], -1, 1))
    roll = np.arctan2(R[1, 0], R[1, 1])
    return yaw, pitch, roll


def track(cap, frames, t0, t1, keep, fps, sx, sy):
    K = intrinsics()
    Ki = np.linalg.inv(K)
    i0 = int(round(t0 * fps)) + 1
    i1 = int(round(t1 * fps)) - 1
    cap.set(cv2.CAP_PROP_POS_FRAMES, i0)
    prev = None
    acc = np.eye(3)
    out = []
    next_t = t0
    for i in range(i0, i1 + 1):
        ok, img = cap.read()
        if not ok:
            break
        t = i / fps
        g = cv2.cvtColor(cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        if prev is not None:
            m = mask_for(boxes_at(frames, t, sx, sy), keep)
            p0 = cv2.goodFeaturesToTrack(prev, 400, 0.01, 8, mask=m)
            if p0 is not None and len(p0) >= 12:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None, winSize=(21, 21), maxLevel=3)
                good = st.ravel() == 1
                a, b = p0[good].reshape(-1, 2), p1[good].reshape(-1, 2)
                if len(a) >= 12:
                    Hm, inl = cv2.findHomography(a, b, cv2.RANSAC, 2.0)
                    if Hm is not None:
                        R = Ki @ Hm @ K
                        U, _, Vt = np.linalg.svd(R)
                        R = U @ Vt
                        if np.linalg.det(R) < 0:
                            R = -R
                        acc = R @ acc
        if prev is not None and t < t0 + 1e-6:
            acc = np.eye(3)
        prev = g
        if t >= next_t - 1e-6:
            yaw, pitch, roll = gl_ypr(acc)
            out.append([round(t, 4), round(float(yaw), 5), round(float(pitch), 5), round(float(roll), 5)])
            next_t += STEP
    return out


def main():
    pose = json.load(open(POSE))
    sx, sy = W / pose['w'], H / pose['h']
    cap = cv2.VideoCapture(VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS)
    res = []
    for t0, t1, keep in SHOTS:
        tr = track(cap, pose['frames'], t0, t1, keep, fps, sx, sy)
        res.append({'t0': t0, 't1': t1, 'track': tr})
        last = tr[-1] if tr else None
        print(f'{t0:.2f}-{t1:.2f}: {len(tr)} samples, end yaw/pitch/roll {last[1:] if last else None}')
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'eXtr3meSlay-cam.json')
    json.dump({'fov': FOV, 'shots': res}, open(out, 'w'))
    print(out)


if __name__ == '__main__':
    main()
