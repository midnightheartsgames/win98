import numpy as np

W, H = 960, 540


def rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def ry(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def rodrigues(v):
    th = np.linalg.norm(v)
    if th < 1e-9:
        return np.eye(3)
    k = v / th
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(th) * K + (1 - np.cos(th)) * K @ K


def to_rotvec(R):
    th = np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1))
    if th < 1e-6:
        return np.zeros(3)
    if np.pi - th < 1e-4:
        w, v = np.linalg.eigh((R + np.eye(3)) / 2)
        axis = v[:, np.argmax(w)]
        return axis * th
    return th / (2 * np.sin(th)) * np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]])


def frame_from(up, fwd):
    y = np.array(up, float)
    y /= np.linalg.norm(y)
    z = np.array(fwd, float) - y * np.dot(fwd, y)
    z /= np.linalg.norm(z)
    x = np.cross(y, z)
    return np.stack([x, y, z], axis=1)


def theta_of(p, up, fwd, sp=(0, 0, 0), nk=(0, 0, 0)):
    return np.concatenate([np.array(p, float), to_rotvec(frame_from(up, fwd)), np.array(sp, float), np.array(nk, float)])


def torso(theta, D):
    p = theta[0:3]
    Rp = rodrigues(theta[3:6])
    sp = theta[6:9]
    nk = theta[9:12]
    Rc = Rp @ ry(sp[1]) @ rx(sp[0]) @ rz(sp[2])
    pc = p + Rp @ np.array([0, D['chestY'], 0])
    Rn = Rc @ ry(nk[1]) @ rx(nk[0]) @ rz(nk[2])
    pn = pc + Rc @ np.array([0, D['neckY'], 0.01])
    ph = pn + Rn @ np.array([0, D['headY'], 0.035])
    out = {'pelvis': (p, Rp), 'chest': (pc, Rc), 'head': (ph, Rn)}
    R = D['head']
    sm, hm = D['shoulderMark'], D['hipMark']
    pts = {}
    for k, side in ((1, 'L'), (-1, 'R')):
        pts['shoulder' + side] = pc + Rc @ np.array([k * sm[0], sm[1], -0.01])
        pts['hip' + side] = p + Rp @ np.array([k * hm[0], hm[1], hm[2]])
        pts['joint' + side] = pc + Rc @ np.array([k * D['shX'], D['shY'], -0.01])
        pts['eye' + side] = ph + Rn @ np.array([k * 0.36 * R, 0.12 * R, 0.93 * R])
        pts['ear' + side] = ph + Rn @ np.array([k * 0.97 * R, -0.05 * R, -0.05 * R])
    pts['nose'] = ph + Rn @ np.array([0, -0.12 * R, 1.08 * R])
    pts['headc'] = ph
    out['pts'] = pts
    return out


class Cam:
    def __init__(self, eye, at, fov, up=(0, 1, 0)):
        self.eye = np.array(eye, float)
        self.at = np.array(at, float)
        self.fov = fov
        z = self.eye - self.at
        z /= np.linalg.norm(z)
        x = np.cross(up, z)
        x /= np.linalg.norm(x)
        y = np.cross(z, x)
        self.x, self.y, self.z = x, y, z
        self.f = 1 / np.tan(np.radians(fov) / 2)

    def project(self, p):
        d = np.asarray(p, float) - self.eye
        cx, cy, cz = d @ self.x, d @ self.y, d @ self.z
        nx = (self.f / (W / H)) * cx / -cz
        ny = self.f * cy / -cz
        return np.array([(nx + 1) / 2 * W, (1 - ny) / 2 * H])

    def ray(self, px, py):
        nx = (px / W) * 2 - 1
        ny = 1 - (py / H) * 2
        d = -self.z + self.x * (nx * (W / H) / self.f) + self.y * (ny / self.f)
        return self.eye.copy(), d / np.linalg.norm(d)


def lift(cam, a, px, length, prev=None, prefer=None, violation=None):
    o, d = cam.ray(px[0], px[1])
    oa = o - a
    b = 2 * np.dot(d, oa)
    c = np.dot(oa, oa) - length * length
    disc = b * b - 4 * c
    if disc < 0:
        lam = -np.dot(oa, d)
        q = o + d * lam
        v = q - a
        return a + v / max(1e-6, np.linalg.norm(v)) * length, False
    r = np.sqrt(disc)
    cands = [o + d * ((-b - r) / 2), o + d * ((-b + r) / 2)]
    ref = prev if prev is not None else prefer
    def score(q):
        return (violation(q) if violation else 0.0) + (np.linalg.norm(q - ref) if ref is not None else 0.0)
    return min(cands, key=score), True
