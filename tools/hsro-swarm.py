import importlib.util
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

TAU = 2 * math.pi
CLIPS = {'idle': (30, True), 'run': (12, True), 'attack': (10, False), 'death': (16, False)}


def eyes_style(col, n=2, size=6):
    def style(sub, rng, a, b):
        h, w = sub.shape[:2]
        spots = (0.36, 0.64) if n == 2 else (0.3, 0.5, 0.7)
        for u in spots:
            cx = int(u * w)
            sub[h // 2 - size // 2:h // 2 + size // 2 + 2, cx - size:cx + size, :3] = L.rgb(col)
            sub[h // 2:h // 2 + 2, cx - 2:cx + 2, :3] = 1.0
    return style


def veins_style(col):
    def style(sub, rng, a, b):
        h, w = sub.shape[:2]
        for k in range(5):
            x0, y = int(rng.integers(0, w)), 0
            while y < h:
                x0 = int(np.clip(x0 + rng.integers(-2, 3), 0, w - 2))
                sub[y, x0:x0 + 2, :3] = L.rgb(col)
                y += 1
    return style


def bands_style(col):
    def style(sub, rng, a, b):
        h = sub.shape[0]
        for k in range(4, h, 14):
            sub[k:k + 4, :, :3] = L.rgb(col)
    return style


def stripes_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    for i in range(h):
        for j in range(w):
            if ((i + j) // 8) % 2:
                sub[i, j, :3] = L.rgb((30, 30, 36))


def export(out_dir, mid, bones, mesh, pose, move, clips=None):
    clips_spec = clips or CLIPS
    rig = L.build_rig(mid + '_rig', bones)
    clips_out = L.animate(rig, mid, {n: (lambda n: lambda t: pose(n, t))(n) for n in clips_spec}, clips_spec, move)
    img, ob = mesh
    L.bind(ob, rig)
    meta = L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, clips=clips_out, fps=L.FPS)
    ob.hide_set(True)
    rig.hide_set(True)
    return meta


def sting_bones(k):
    def P(x, y, z):
        return (x * k, y * k, z * k)
    bones = [
        ('root', None, P(0, -0.05, 0.75), P(0, -0.05, 1.05)),
        ('head', 'root', P(0, 0.15, 1.08), P(0, 0.38, 1.1)),
        ('abd.1', 'root', P(0, -0.15, 1.05), P(0, -0.45, 0.95)),
        ('abd.2', 'abd.1', P(0, -0.45, 0.95), P(0, -0.7, 0.78))
    ]
    for s, side in ((1, 'L'), (-1, 'R')):
        bones.append(('wing.' + side + '1', 'root', P(0.08 * s, -0.02, 1.2), P(0.55 * s, -0.1, 1.55)))
        bones.append(('wing.' + side + '2', 'root', P(0.08 * s, -0.12, 1.18), P(0.5 * s, -0.3, 1.35)))
        bones.append(('claw.' + side, 'root', P(0.1 * s, 0.15, 0.98), P(0.18 * s, 0.4, 0.85)))
    return bones


def sting_mesh(mid, gnaw):
    k = 1.25 if gnaw else 1.0
    bones = sting_bones(k)
    names = [b[0] for b in bones]
    if gnaw:
        spec = {
            'shell': ('fade', (74, 68, 114), (168, 154, 214)),
            'dark': ('fade', (24, 20, 44), (60, 54, 96)),
            'face': (eyes_style((240, 140, 240)), (122, 108, 174), None),
            'wing': (veins_style((90, 208, 240)), (140, 134, 180), None),
            'band': (bands_style((74, 68, 114)), (168, 154, 214), None),
            'glow': ('glow', (156, 86, 170), (244, 204, 244)),
            'spike': ('fade', (62, 66, 82), (124, 132, 150))
        }
    else:
        spec = {
            'shell': ('fade', (90, 85, 98), (180, 176, 184)),
            'dark': ('fade', (30, 26, 36), (62, 54, 68)),
            'face': (eyes_style((216, 48, 62)), (142, 137, 146), None),
            'wing': (veins_style((230, 162, 200)), (182, 90, 142), None),
            'band': (bands_style((90, 85, 98)), (200, 196, 204), None),
            'glow': ('glow', (138, 38, 50), (255, 120, 120)),
            'spike': ('fade', (90, 85, 98), (232, 230, 236))
        }
    img, regions = L.paint_cells(np.random.default_rng(21 if gnaw else 22), mid, spec)
    b = L.Builder(regions, 256, names)

    def P(x, y, z):
        return (x * k, y * k, z * k)

    b.sphere(P(0, 0, 1.06), 0.17 * k, (1, 1.2, 0.95), 'root', 'shell', segs=10, rings=8)
    b.sphere(P(0, 0.27, 1.1), 0.12 * k, (1, 1.05, 0.95), 'head', 'shell', face_region='face', segs=10, rings=8, front_y=0.3)
    for s in (1, -1):
        b.cone(P(0.05 * s, 0.35, 1.05), P(0.015 * s, 0.47, 0.97), 0.025 * k * (1.4 if gnaw else 1), 'head', 'dark', sides=5)
        b.cone(P(0.06 * s, 0.32, 1.17), P(0.12 * s, 0.4, 1.3), 0.012 * k, 'head', 'dark', sides=4)
    b.chain([P(0, -0.12, 1.05), P(0, -0.32, 1.0), P(0, -0.5, 0.92)], [0.12 * k, 0.16 * k, 0.12 * k], ['abd.1', 'abd.1', ('abd.1', 'abd.2')], 'band', sides=10)
    b.chain([P(0, -0.5, 0.92), P(0, -0.66, 0.8), P(0, -0.74, 0.66)], [0.12 * k, 0.08 * k, 0.03 * k], [('abd.2', 'abd.1'), 'abd.2', 'abd.2'], 'band', sides=10)
    b.cone(P(0, -0.74, 0.66), P(0, -0.66, 0.4), 0.035 * k, 'abd.2', 'glow', sides=6)
    if gnaw:
        for y in (-0.25, -0.4, -0.55):
            for s in (1, -1):
                b.sphere(P(0.11 * s, y, 0.98 - 0.12 * (y + 0.25)), 0.045 * k, (1, 1, 1), 'abd.1' if y > -0.45 else 'abd.2', 'glow', segs=6, rings=4)
        for y in (0.06, -0.06):
            for s in (1, -1):
                b.cone(P(0.07 * s, y, 1.2), P(0.14 * s, y - 0.06, 1.38), 0.035 * k, 'root', 'spike', sides=5)
    for s, side in ((1, 'L'), (-1, 'R')):
        b.chain([P(0.08 * s, -0.02, 1.2), P(0.3 * s, -0.08, 1.4), P(0.55 * s, -0.1, 1.55)], [0.07 * k, 0.1 * k, 0.0], ['wing.' + side + '1'] * 3, 'wing', sides=6, squash=0.12)
        b.chain([P(0.08 * s, -0.12, 1.18), P(0.28 * s, -0.22, 1.28), P(0.5 * s, -0.3, 1.35)], [0.05 * k, 0.07 * k, 0.0], ['wing.' + side + '2'] * 3, 'wing', sides=6, squash=0.12)
        b.chain([P(0.1 * s, 0.15, 0.98), P(0.16 * s, 0.3, 0.92), P(0.18 * s, 0.42, 0.84)], [0.03 * k, 0.025 * k, 0.0], ['claw.' + side] * 3, 'dark', sides=5)
        for y in (0.05, -0.08):
            b.chain([P(0.08 * s, y, 0.95), P(0.16 * s, y, 0.82), P(0.14 * s, y + 0.03, 0.66)], [0.018 * k, 0.014 * k, 0.0], ['root'] * 3, 'dark', sides=4)
    return img, b.finish(mid, names)


def sting_pose(name, t):
    flap = math.sin(TAU * t * (6 if name == 'idle' else 3))
    p = {}
    for s, side in ((1, 'L'), (-1, 'R')):
        p['wing.' + side + '1'] = (0, 1, 0, -0.5 * s * flap)
        p['wing.' + side + '2'] = (0, 1, 0, -0.4 * s * math.sin(TAU * t * (6 if name == 'idle' else 3) + 0.6))
    if name == 'idle':
        p['abd.1'] = (1, 0, 0, 0.08 * math.sin(TAU * t))
        p['claw.L'] = (1, 0, 0, 0.15 * math.sin(TAU * t))
        p['claw.R'] = (1, 0, 0, -0.15 * math.sin(TAU * t))
    elif name == 'run':
        p['root'] = (1, 0, 0, -0.25)
        p['abd.1'] = (1, 0, 0, -0.2)
    elif name == 'attack':
        k = math.sin(t * math.pi)
        p['abd.1'] = (1, 0, 0, 1.0 * k)
        p['abd.2'] = (1, 0, 0, 0.8 * k)
        p['root'] = (1, 0, 0, -0.35 * k)
        p['claw.L'] = (1, 0, 0, 0.6 * k)
        p['claw.R'] = (1, 0, 0, 0.6 * k)
    else:
        k = min(1, t * 1.5)
        for s, side in ((1, 'L'), (-1, 'R')):
            p['wing.' + side + '1'] = (0, 1, 0, 0.9 * s * k)
            p['wing.' + side + '2'] = (0, 1, 0, 0.8 * s * k)
        p['root'] = (0, 1, 0, 2.6 * k)
    return p


def sting_move(name, t):
    if name == 'idle':
        return (0, 0.06 * math.sin(TAU * t), 0)
    if name == 'run':
        return (0, 0.04 * math.sin(TAU * t), 0)
    if name == 'attack':
        return (0, 0, -0.35 * math.sin(math.pi * t))
    return (0, -0.6 * min(1, t * 1.5) ** 2, 0)


SKARA_BONES = [
    ('root', None, (0, -0.4, 1.6), (0, 0.5, 1.6)),
    ('head', 'root', (0, 0.9, 1.7), (0, 1.6, 1.6)),
    ('abd', 'root', (0, -0.6, 1.6), (0, -2.2, 1.2)),
    ('wing.L1', 'root', (0.4, 0.1, 2.2), (2.8, -0.4, 3.0)),
    ('wing.R1', 'root', (-0.4, 0.1, 2.2), (-2.8, -0.4, 3.0)),
    ('wing.L2', 'root', (0.4, -0.4, 2.1), (2.4, -1.4, 2.4)),
    ('wing.R2', 'root', (-0.4, -0.4, 2.1), (-2.4, -1.4, 2.4))
]
SKARA_BONES += [('leg.%s%d' % (side, i + 1), 'root', (0.6 * s, y, 1.3), (1.5 * s, y + 0.3 - 0.3 * i, 0.05)) for i, y in enumerate((0.6, 0.0, -0.6)) for s, side in ((1, 'L'), (-1, 'R'))]


def skara_mesh(mid):
    names = [b[0] for b in SKARA_BONES]
    spec = {
        'shell': ('seams', (28, 40, 82), None),
        'dark': ('fade', (8, 12, 28), (44, 58, 104)),
        'gold': ('fade', (140, 100, 30), (255, 240, 160)),
        'face': (eyes_style((64, 224, 208), 3, 7), (20, 28, 58), None),
        'teal': ('glow', (40, 160, 150), (208, 255, 248)),
        'violet': ('glow', (90, 50, 180), (220, 200, 255)),
        'wing': (veins_style((160, 216, 255)), (74, 122, 184), None),
        'band': (bands_style((224, 176, 64)), (24, 34, 72), None)
    }
    img, regions = L.paint_cells(np.random.default_rng(31), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, 0, 1.6), 0.9, (1, 1.3, 0.75), 'root', 'shell', segs=14, rings=10)
    b.sphere((0, 0.1, 1.75), 0.92, (1.05, 1.25, 0.7), 'root', 'dark', segs=14, rings=8, cut=0.2, cut_below=True)
    b.sphere((0, 1.1, 1.72), 0.48, (1, 1, 0.8), 'head', 'shell', face_region='face', segs=12, rings=8, front_y=0.3)
    b.cone((0, 1.3, 2.0), (0, 1.9, 2.8), 0.14, 'head', 'gold', sides=6)
    for s in (1, -1):
        b.chain([(0.25 * s, 1.4, 1.55), (0.35 * s, 1.85, 1.5), (0.12 * s, 2.15, 1.4)], [0.08, 0.06, 0.0], ['head'] * 3, 'gold', sides=6)
        b.sphere((0.55 * s, 0.4, 1.95), 0.08, (1, 1, 1), 'root', 'teal', segs=6, rings=4)
        b.sphere((0.6 * s, -0.3, 1.85), 0.07, (1, 1, 1), 'root', 'violet', segs=6, rings=4)
    b.chain([(0, -0.6, 1.6), (0, -1.3, 1.5), (0, -1.9, 1.3), (0, -2.4, 1.05)], [0.75, 0.72, 0.5, 0.15], ['abd', 'abd', 'abd', 'abd'], 'band', sides=12)
    b.cone((0, -2.4, 1.05), (0, -3.0, 1.1), 0.12, 'abd', 'teal', sides=6)
    for s, side in ((1, 'L'), (-1, 'R')):
        b.chain([(0.4 * s, 0.1, 2.2), (1.6 * s, -0.1, 2.7), (2.8 * s, -0.4, 3.0)], [0.6, 0.75, 0.0], ['wing.' + side + '1'] * 3, 'wing', sides=6, squash=0.08)
        b.chain([(0.4 * s, -0.4, 2.1), (1.4 * s, -0.9, 2.3), (2.4 * s, -1.4, 2.4)], [0.45, 0.55, 0.0], ['wing.' + side + '2'] * 3, 'wing', sides=6, squash=0.08)
        for i, y in enumerate((0.6, 0.0, -0.6)):
            bone = 'leg.%s%d' % (side, i + 1)
            foot = (1.5 * s, y + 0.3 - 0.3 * i, 0.05)
            knee = (1.25 * s, y + 0.15 - 0.15 * i, 1.4)
            b.chain([(0.6 * s, y, 1.3), knee, foot], [0.11, 0.08, 0.03], [bone] * 3, 'gold', sides=6)
    return img, b.finish(mid, names)


def skara_pose(name, t):
    s = math.sin(TAU * t)
    p = {}
    if name == 'idle':
        for side, sg in (('L', 1), ('R', -1)):
            p['wing.' + side + '1'] = (0, 1, 0, -0.12 * sg * s)
            p['wing.' + side + '2'] = (0, 1, 0, -0.1 * sg * math.sin(TAU * t + 0.5))
        p['head'] = (0, 0, 1, 0.1 * s)
        p['abd'] = (1, 0, 0, 0.05 * s)
    elif name == 'run':
        for i in range(1, 4):
            ph = s * (1 if i % 2 else -1)
            p['leg.L%d' % i] = (1, 0, 0, 0.35 * ph)
            p['leg.R%d' % i] = (1, 0, 0, -0.35 * ph)
        for side, sg in (('L', 1), ('R', -1)):
            p['wing.' + side + '1'] = (0, 1, 0, -0.35 * sg * math.sin(2 * TAU * t))
    elif name == 'attack':
        k = math.sin(t * math.pi)
        p['root'] = (1, 0, 0, 0.3 * k)
        p['head'] = (1, 0, 0, -0.6 * k)
        p['leg.L1'] = (1, 0, 0, 0.8 * k)
        p['leg.R1'] = (1, 0, 0, 0.8 * k)
        for side, sg in (('L', 1), ('R', -1)):
            p['wing.' + side + '1'] = (0, 1, 0, -0.5 * sg * k)
            p['wing.' + side + '2'] = (0, 1, 0, -0.4 * sg * k)
    else:
        k = min(1, t * 1.4)
        p['root'] = (0, 1, 0, 0.5 * k)
        for side, sg in (('L', 1), ('R', -1)):
            p['wing.' + side + '1'] = (0, 1, 0, 0.7 * sg * k)
            p['wing.' + side + '2'] = (0, 1, 0, 0.6 * sg * k)
            for i in range(1, 4):
                p['leg.%s%d' % (side, i)] = (0, 1, 0, -0.9 * sg * k)
    return p


def skara_move(name, t):
    if name == 'death':
        return (0, 0, -1.1 * min(1, t * 1.4) ** 2)
    if name == 'run':
        return (0, 0, 0.05 * abs(math.sin(TAU * t)))
    return (0, 0, 0)


DOOM_BONES = [
    ('root', None, (0, -1.2, 2.4), (0, 0, 2.6)),
    ('chest', 'root', (0, 0, 2.6), (0, 1.3, 3.0)),
    ('neck', 'chest', (0, 1.3, 3.0), (0, 2.0, 3.2)),
    ('head', 'neck', (0, 2.0, 3.2), (0, 3.0, 3.0)),
    ('tail.1', 'root', (0, -1.8, 2.4), (0, -3.2, 2.0)),
    ('tail.2', 'tail.1', (0, -3.2, 2.0), (0, -4.6, 1.4))
]
DOOM_BONES += [b for s, side in ((1, 'L'), (-1, 'R')) for b in (
    ('arm.%s.u' % side, 'chest', (1.2 * s, 1.0, 2.9), (1.5 * s, 1.3, 1.4)),
    ('arm.%s.l' % side, 'arm.%s.u' % side, (1.5 * s, 1.3, 1.4), (1.4 * s, 1.6, 0.1)),
    ('leg.%s.u' % side, 'root', (0.9 * s, -1.4, 2.2), (1.0 * s, -1.2, 1.1)),
    ('leg.%s.l' % side, 'leg.%s.u' % side, (1.0 * s, -1.2, 1.1), (1.0 * s, -1.5, 0.1)))]


def doom_veins(sub, rng, a, b):
    h, w = sub.shape[:2]
    for k in range(6):
        x0 = int(rng.integers(0, w))
        for y in range(h):
            x0 = int(np.clip(x0 + rng.integers(-1, 2), 1, w - 3))
            sub[y, x0:x0 + 2, :3] = L.rgb((160, 96, 255))
            sub[y, x0 - 1:x0, :3] = L.rgb((90, 50, 160))


def doom_mesh(mid):
    names = [b[0] for b in DOOM_BONES]
    spec = {
        'body': (doom_veins, (35, 26, 58), None),
        'dark': ('fade', (18, 12, 32), (50, 38, 80)),
        'armor': ('seams', (226, 226, 238), None),
        'horn': ('fade', (106, 106, 138), (240, 240, 250)),
        'face': (eyes_style((255, 224, 255), 2, 8), (35, 26, 58), None),
        'glow': ('glow', (120, 60, 220), (240, 220, 255)),
        'claw': ('fade', (90, 90, 120), (226, 226, 238))
    }
    img, regions = L.paint_cells(np.random.default_rng(41), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, -1.2, 2.4), 1.0, (1, 1.2, 0.8), 'root', 'body', segs=14, rings=10)
    b.sphere((0, 0.6, 2.8), 1.35, (1.1, 1.0, 0.85), 'chest', 'body', segs=16, rings=10)
    b.sphere((0, 0.5, 3.1), 1.38, (1.12, 0.95, 0.8), 'chest', 'armor', segs=16, rings=10, cut=0.25, cut_below=True)
    b.sphere((0, -1.2, 2.6), 1.02, (1.02, 1.15, 0.75), 'root', 'armor', segs=12, rings=8, cut=0.3, cut_below=True)
    for i, y in enumerate((-1.6, -0.9, -0.1, 0.6)):
        bone = 'root' if y < -0.5 else 'chest'
        b.cone((0, y, 3.3 + 0.25 * i), (0, y - 0.4, 4.2 + 0.25 * i), 0.2, bone, 'horn', sides=6)
    b.tube((0, 1.3, 3.0), (0, 2.05, 3.2), 0.6, 0.5, 'neck', 'body', sides=12, blend='chest')
    b.sphere((0, 2.45, 3.1), 0.65, (0.95, 1.15, 0.72), 'head', 'body', face_region='face', segs=12, rings=8, front_y=0.25)
    b.box((0, 2.8, 2.72), (0.8, 0.8, 0.24), 'head', 'dark', rot=(0.2, 0, 0))
    for s in (1, -1):
        b.chain([(0.35 * s, 2.3, 3.5), (0.9 * s, 2.0, 4.3), (1.4 * s, 1.4, 4.9), (1.6 * s, 0.9, 5.4)], [0.22, 0.17, 0.1, 0.0], ['head'] * 4, 'horn', sides=8)
        b.chain([(0.25 * s, 2.7, 3.4), (0.45 * s, 3.0, 3.9), (0.4 * s, 3.1, 4.25)], [0.1, 0.07, 0.0], ['head'] * 3, 'horn', sides=6)
        b.sphere((0.28 * s, 2.98, 3.2), 0.09, (1, 1, 0.7), 'head', 'glow', segs=6, rings=4)
        side = 'L' if s > 0 else 'R'
        b.sphere((1.25 * s, 1.0, 3.0), 0.6, (1.1, 1, 0.9), 'arm.%s.u' % side, 'armor', segs=10, rings=8)
        b.tube((1.2 * s, 1.0, 2.9), (1.5 * s, 1.3, 1.4), 0.5, 0.4, 'arm.%s.u' % side, 'body', sides=12, blend='chest')
        b.tube((1.5 * s, 1.3, 1.4), (1.4 * s, 1.6, 0.25), 0.4, 0.34, 'arm.%s.l' % side, 'armor', sides=12)
        for k in range(3):
            b.cone((1.4 * s + 0.18 * (k - 1), 1.75, 0.2), (1.4 * s + 0.24 * (k - 1), 2.3, 0.05), 0.09, 'arm.%s.l' % side, 'claw', sides=5)
        b.tube((0.9 * s, -1.4, 2.2), (1.0 * s, -1.2, 1.1), 0.42, 0.32, 'leg.%s.u' % side, 'body', sides=10, blend='root')
        b.tube((1.0 * s, -1.2, 1.1), (1.0 * s, -1.5, 0.2), 0.3, 0.26, 'leg.%s.l' % side, 'dark', sides=10)
        b.box((1.0 * s, -1.35, 0.1), (0.6, 0.8, 0.2), 'leg.%s.l' % side, 'claw')
        b.cone((1.55 * s, 0.5, 2.6), (2.5 * s, 0.2, 3.1), 0.18, 'chest', 'horn', sides=6)
    b.chain([(0, -1.8, 2.4), (0, -2.6, 2.2), (0, -3.2, 2.0)], [0.45, 0.35, 0.3], ['tail.1', 'tail.1', ('tail.1', 'tail.2')], 'body', sides=10)
    b.chain([(0, -3.2, 2.0), (0, -4.0, 1.7), (0, -4.6, 1.4), (0, -5.2, 1.3)], [0.3, 0.22, 0.12, 0.0], [('tail.2', 'tail.1'), 'tail.2', 'tail.2', 'tail.2'], 'body', sides=10)
    for y, z in ((-2.6, 2.6), (-3.6, 2.15), (-4.6, 1.75)):
        b.cone((0, y, z - 0.1), (0, y - 0.25, z + 0.4), 0.12, 'tail.1' if y > -3.2 else 'tail.2', 'horn', sides=5)
    return img, b.finish(mid, names)


def doom_pose(name, t):
    s = math.sin(TAU * t)
    if name in ('idle', 'idle2'):
        p = {'chest': (1, 0, 0, -0.04 * s), 'neck': (1, 0, 0, 0.05 * s), 'head': (0, 0, 1, 0.08 * math.sin(TAU * t + 1)), 'tail.1': (0, 0, 1, 0.15 * s), 'tail.2': (0, 0, 1, 0.2 * math.sin(TAU * t + 0.8))}
        if name == 'idle2':
            p.update({'root': (1, 0, 0, 0.7), 'chest': (1, 0, 0, 0.1 - 0.04 * s), 'neck': (1, 0, 0, -0.35), 'head': (1, 0, 0, -0.3),
                      'arm.L.u': (1, 0, 0, 0.5), 'arm.R.u': (1, 0, 0, 0.5), 'arm.L.l': (1, 0, 0, 0.8), 'arm.R.l': (1, 0, 0, 0.8),
                      'leg.L.u': (1, 0, 0, -0.7), 'leg.R.u': (1, 0, 0, -0.7), 'leg.L.l': (1, 0, 0, 0.1), 'leg.R.l': (1, 0, 0, 0.1), 'tail.1': (1, 0, 0, -0.5)})
        return p
    if name == 'run':
        a = 0.45 * s
        return {'arm.L.u': (1, 0, 0, -a), 'leg.R.u': (1, 0, 0, a), 'arm.R.u': (1, 0, 0, a), 'leg.L.u': (1, 0, 0, -a),
                'arm.L.l': (1, 0, 0, 0.3 * max(0, s)), 'arm.R.l': (1, 0, 0, 0.3 * max(0, -s)), 'chest': (1, 0, 0, 0.05 * math.sin(2 * TAU * t)), 'tail.1': (0, 0, 1, 0.2 * s)}
    if name == 'attack':
        k = math.sin(min(1, t / 0.6) * math.pi / 2) if t < 0.6 else max(0, 1 - (t - 0.6) / 0.3)
        return {'chest': (1, 0, 0, -0.3 * k), 'arm.R.u': (1, 0, 0, 1.4 * k), 'arm.R.l': (1, 0, 0, 0.5 * k), 'head': (1, 0, 0, 0.3 * k), 'tail.1': (0, 0, 1, 0.6 * k), 'tail.2': (0, 0, 1, 0.8 * k)}
    k = min(1, t * 1.3)
    return {'root': (0, 1, 0, 1.2 * k), 'neck': (1, 0, 0, 0.5 * k), 'head': (1, 0, 0, 0.3 * k), 'arm.L.u': (0, 1, 0, -0.6 * k), 'arm.R.u': (0, 1, 0, 0.4 * k), 'tail.1': (0, 0, 1, 0.6 * k)}


def doom_move(name, t):
    if name == 'death':
        return (0, 0, -1.5 * min(1, t * 1.3) ** 2)
    if name == 'run':
        return (0, 0, 0.08 * abs(math.sin(TAU * t)))
    return (0, 0, 0)


WARDEN_BONES = [
    ('root', None, (0, 0, 1.4), (0, 0, 1.8)),
    ('body', 'root', (0, 0, 1.8), (0, 0, 2.5)),
    ('head', 'body', (0, 0, 2.55), (0, 0, 2.95))
]
WARDEN_BONES += [b for s, side in ((1, 'L'), (-1, 'R')) for b in (
    ('arm.%s.u' % side, 'body', (0.85 * s, 0, 2.3), (1.2 * s, 0.1, 1.6)),
    ('arm.%s.l' % side, 'arm.%s.u' % side, (1.2 * s, 0.1, 1.6), (1.3 * s, 0.6, 1.1)),
    ('leg.%s.u' % side, 'root', (0.42 * s, 0, 1.4), (0.5 * s, 0.1, 0.75)),
    ('leg.%s.l' % side, 'leg.%s.u' % side, (0.5 * s, 0.1, 0.75), (0.5 * s, 0, 0.1)))]


def warden_visor(sub, rng, a, b):
    h, w = sub.shape[:2]
    sub[h // 2 - 6:h // 2 + 6, 4:w - 4, :3] = L.rgb((20, 26, 40))
    sub[h // 2 - 3:h // 2 + 3, 8:w - 8, :3] = L.rgb((122, 216, 255))
    sub[h // 2 - 1:h // 2 + 1, 10:w - 10, :3] = 1.0


def warden_mesh(mid):
    names = [b[0] for b in WARDEN_BONES]
    spec = {
        'metal': ('seams', (90, 110, 132), None),
        'dark': ('fade', (30, 36, 48), (70, 82, 100)),
        'white': ('fade', (190, 198, 212), (244, 246, 250)),
        'face': (warden_visor, (90, 110, 132), None),
        'glass': ('glow', (60, 160, 110), (200, 255, 210)),
        'gold': ('fade', (150, 124, 60), (240, 218, 140)),
        'stripe': (stripes_style, (230, 190, 60), None),
        'cyan': ('glow', (60, 150, 210), (220, 245, 255))
    }
    img, regions = L.paint_cells(np.random.default_rng(51), mid, spec)
    b = L.Builder(regions, 256, names)
    b.box((0, 0, 1.45), (0.95, 0.6, 0.4), 'root', 'dark')
    b.sphere((0, 0, 2.15), 0.7, (1.15, 0.85, 0.85), 'body', 'metal', segs=14, rings=10)
    b.box((0, 0.52, 2.15), (0.8, 0.12, 0.7), 'body', 'white', rot=(0.1, 0, 0))
    b.box((0, 0.6, 2.15), (0.5, 0.04, 0.12), 'body', 'stripe', rot=(0.1, 0, 0))
    b.sphere((0, 0.6, 1.92), 0.1, (1, 0.6, 1), 'body', 'cyan', segs=8, rings=5)
    b.tube((0, -0.6, 1.7), (0, -0.6, 2.6), 0.28, 0.28, 'body', 'glass', sides=10)
    for z in (1.7, 2.6):
        b.tube((0, -0.6, z - 0.04), (0, -0.6, z + 0.04), 0.31, 0.31, 'body', 'gold', sides=10)
    b.tube((0, 0, 2.45), (0, 0, 2.6), 0.18, 0.16, 'body', 'dark', sides=8)
    b.sphere((0, 0.04, 2.76), 0.3, (1.15, 1, 0.75), 'head', 'metal', face_region='face', segs=12, rings=8, front_y=0.3)
    b.tube((0.2, -0.05, 2.9), (0.26, -0.1, 3.15), 0.02, 0.015, 'head', 'dark', sides=5)
    b.sphere((0.26, -0.1, 3.17), 0.04, (1, 1, 1), 'head', 'cyan', segs=6, rings=4)
    for s, side in ((1, 'L'), (-1, 'R')):
        u, lo = 'arm.%s.u' % side, 'arm.%s.l' % side
        b.sphere((0.85 * s, 0, 2.3), 0.28, (1.1, 1, 0.9), u, 'white', segs=10, rings=6)
        b.tube((0.85 * s, 0, 2.3), (1.2 * s, 0.1, 1.6), 0.16, 0.14, u, 'metal', sides=10)
        b.sphere((1.2 * s, 0.1, 1.6), 0.17, (1, 1, 1), lo, 'dark', segs=8, rings=5)
        b.tube((1.2 * s, 0.1, 1.6), (1.3 * s, 0.6, 1.1), 0.14, 0.13, lo, 'metal', sides=10)
        b.tube((1.3 * s, 0.6, 1.1), (1.32 * s, 0.68, 1.02), 0.17, 0.17, lo, 'gold', sides=10)
        for k in (1, -1):
            b.cone((1.32 * s + 0.08 * k, 0.68, 1.02), (1.36 * s + 0.12 * k, 1.0, 0.75), 0.06, lo, 'dark', sides=5)
        hu, hl = 'leg.%s.u' % side, 'leg.%s.l' % side
        b.tube((0.42 * s, 0, 1.4), (0.5 * s, 0.1, 0.75), 0.2, 0.17, hu, 'metal', sides=10)
        b.sphere((0.5 * s, 0.14, 0.75), 0.17, (1, 1, 1), hl, 'white', segs=8, rings=5)
        b.tube((0.5 * s, 0.1, 0.75), (0.5 * s, 0, 0.15), 0.16, 0.14, hl, 'metal', sides=10)
        b.box((0.5 * s, 0.1, 0.08), (0.4, 0.62, 0.16), hl, 'stripe')
    return img, b.finish(mid, names)


def warden_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'head': (0, 0, 1, 0.35 * s), 'body': (0, 0, 1, 0.06 * s), 'arm.L.l': (1, 0, 0, 0.1 * s), 'arm.R.l': (1, 0, 0, -0.1 * s)}
    if name == 'run':
        return {'leg.L.u': (1, 0, 0, 0.45 * s), 'leg.R.u': (1, 0, 0, -0.45 * s), 'leg.L.l': (1, 0, 0, -0.3 * max(0, -s)), 'leg.R.l': (1, 0, 0, -0.3 * max(0, s)),
                'arm.L.u': (1, 0, 0, -0.2 * s), 'arm.R.u': (1, 0, 0, 0.2 * s), 'body': (0, 0, 1, 0.1 * s)}
    if name == 'attack':
        k = math.sin(min(1, t / 0.5) * math.pi / 2) if t < 0.5 else max(0, 1 - (t - 0.5) / 0.35)
        return {'arm.R.u': (1, 0, 0, 1.4 * k), 'arm.R.l': (1, 0, 0, 0.5 * k), 'arm.L.u': (1, 0, 0, 0.5 * k), 'body': (0, 0, 1, -0.3 * k)}
    k = min(1, t * 1.4)
    return {'root': (1, 0, 0, 1.2 * k), 'head': (1, 0, 0, 0.3 * k), 'arm.L.u': (0, 1, 0, -0.5 * k), 'arm.R.u': (0, 1, 0, 0.5 * k), 'leg.L.u': (1, 0, 0, -0.6 * k), 'leg.R.u': (1, 0, 0, -0.4 * k)}


def warden_move(name, t):
    if name == 'death':
        return (0, -1.0 * min(1, t * 1.4) ** 1.5, 0)
    if name == 'run':
        return (0, 0.05 * abs(math.sin(TAU * t)), 0)
    return (0, 0, 0)


CULTURE_BONES = [
    ('root', None, (0, 0, 0), (0, 0, 0.6)),
    ('body', 'root', (0, 0, 0.6), (0, 0, 1.6)),
    ('bulb', 'body', (0, 0, 1.6), (0, 0, 2.4))
]
TENDRILS = [(1.3, 0.9), (-1.4, 0.6), (0.9, -1.3), (-0.8, -1.2)]
CULTURE_BONES += [b for i, (x, y) in enumerate(TENDRILS) for b in (
    ('t%d.a' % i, 'body', (x * 0.7, y * 0.7, 1.0), (x * 1.1, y * 1.1, 1.9)),
    ('t%d.b' % i, 't%d.a' % i, (x * 1.1, y * 1.1, 1.9), (x * 1.25, y * 1.25, 2.8)))]


def culture_mesh(mid):
    names = [b[0] for b in CULTURE_BONES]
    spec = {
        'flesh': (veins_style((200, 255, 112)), (42, 74, 42), None),
        'flesh2': ('fade', (30, 56, 30), (100, 150, 70)),
        'glow': ('glow', (120, 200, 60), (240, 255, 200)),
        'vine': ('fade', (40, 80, 40), (150, 210, 100)),
        'bud': ('glow', (200, 120, 200), (255, 230, 255))
    }
    img, regions = L.paint_cells(np.random.default_rng(61), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, 0, 0.7), 1.9, (1, 1, 0.55), 'root', 'flesh', segs=16, rings=10, cut=0.0, cut_below=True)
    for k in range(7):
        a = k * TAU / 7 + 0.3
        r = 1.35 + 0.15 * (k % 2)
        b.sphere((r * math.cos(a), r * math.sin(a), 0.75 + 0.15 * (k % 3)), 0.55 + 0.12 * (k % 3), (1, 1, 0.8), 'body', 'flesh2', segs=10, rings=6)
    b.sphere((0, 0, 1.55), 0.9, (1, 1, 0.8), 'body', 'flesh', segs=12, rings=8)
    b.sphere((0, 0, 2.2), 0.55, (1, 1, 1.15), 'bulb', 'glow', segs=12, rings=8)
    for k in range(5):
        a = k * TAU / 5
        b.cone((0.3 * math.cos(a), 0.3 * math.sin(a), 2.4), (0.75 * math.cos(a), 0.75 * math.sin(a), 2.9), 0.16, 'bulb', 'vine', sides=5)
    for k in range(9):
        a = k * TAU / 9 + 0.7
        b.sphere((1.15 * math.cos(a), 1.15 * math.sin(a), 1.25 + 0.1 * (k % 2)), 0.14, (1, 1, 1), 'body', 'glow', segs=6, rings=4)
    for i, (x, y) in enumerate(TENDRILS):
        a, bb = 't%d.a' % i, 't%d.b' % i
        b.chain([(x * 0.7, y * 0.7, 1.0), (x * 1.1, y * 1.1, 1.9), (x * 1.25, y * 1.25, 2.8)], [0.24, 0.16, 0.07], [a, (bb, a), bb], 'vine', sides=8)
        b.sphere((x * 1.25, y * 1.25, 2.85), 0.16, (1, 1, 1.2), bb, 'bud', segs=8, rings=5)
    return img, b.finish(mid, names)


def culture_pose(name, t):
    s = math.sin(TAU * t)
    p = {}
    for i, (x, y) in enumerate(TENDRILS):
        tang = (-y, x, 0)
        if name == 'death':
            k = min(1, t * 1.3)
            p['t%d.a' % i] = tang + (-0.9 * k,)
            p['t%d.b' % i] = tang + (-0.7 * k,)
        else:
            amp = 0.35 if name == 'run' else 0.2
            p['t%d.a' % i] = tang + (amp * math.sin(TAU * t + i * 1.3),)
            p['t%d.b' % i] = tang + (amp * 1.4 * math.sin(TAU * t + i * 1.3 + 0.7),)
    p['bulb'] = (1, 0, 0, 0.08 * s)
    if name == 'attack':
        k = math.sin(t * math.pi)
        p['t0.a'] = (-1, 0, 0, 1.0 * k)
        p['t0.b'] = (-1, 0, 0, 0.9 * k)
        p['t1.a'] = (-1, 0, 0, 0.8 * k)
        p['t1.b'] = (-1, 0, 0, 0.8 * k)
        p['bulb'] = (1, 0, 0, -0.3 * k)
    if name == 'death':
        p['bulb'] = (1, 0, 0, 0.6 * min(1, t * 1.3))
    return p


def culture_move(name, t):
    if name == 'death':
        return (0, -0.6 * min(1, t * 1.3), 0)
    return (0, 0.05 * math.sin(TAU * t), 0)


def nest_prop(out_dir):
    spec = {
        'shell': (veins_style((120, 140, 70)), (74, 90, 42), None),
        'dark': ('fade', (30, 36, 18), (70, 84, 40)),
        'glow': ('glow', (120, 200, 60), (230, 255, 190)),
        'rib': ('fade', (60, 50, 30), (140, 120, 80))
    }
    img, regions = L.paint_cells(np.random.default_rng(71), 'prop_nest', spec)
    b = L.Builder(regions, 256, [])
    b.sphere((0, 0, 0.1), 0.85, (1, 1, 1.1), None, 'shell', segs=12, rings=8, cut=0.0, cut_below=True)
    b.tube((0, 0, 0.85), (0, 0, 1.0), 0.32, 0.22, None, 'dark', sides=10)
    b.sphere((0, 0, 1.0), 0.22, (1, 1, 0.6), None, 'glow', segs=10, rings=6)
    for k in range(6):
        a = k * TAU / 6
        b.chain([(0.9 * math.cos(a), 0.9 * math.sin(a), 0.0), (0.75 * math.cos(a), 0.75 * math.sin(a), 0.6), (0.3 * math.cos(a), 0.3 * math.sin(a), 0.98)], [0.08, 0.06, 0.04], [None] * 3, 'rib', sides=5)
        b.sphere((0.62 * math.cos(a + 0.5), 0.62 * math.sin(a + 0.5), 0.45), 0.09, (1, 1, 1), None, 'glow', segs=6, rings=4)
    ob = b.finish('prop_nest', [])
    meta = L.EXPORT.export_model('prop_nest', ob, out_dir, image=img)
    ob.hide_set(True)
    return meta


def build(out_dir, rng):
    L.reset()
    metas = []
    for mid, gnaw in (('foe_sting_young', False), ('foe_sting_gnaw', True)):
        metas.append(export(out_dir, mid, sting_bones(1.25 if gnaw else 1.0), sting_mesh(mid, gnaw), sting_pose, sting_move))
    metas.append(export(out_dir, 'boss_keeper', WARDEN_BONES, warden_mesh('boss_keeper'), warden_pose, warden_move))
    metas.append(export(out_dir, 'boss_culture', CULTURE_BONES, culture_mesh('boss_culture'), culture_pose, culture_move))
    metas.append(export(out_dir, 'boss_skaracabaz', SKARA_BONES, skara_mesh('boss_skaracabaz'), skara_pose, skara_move))
    metas.append(export(out_dir, 'boss_doomsday', DOOM_BONES, doom_mesh('boss_doomsday'), doom_pose, doom_move, dict(CLIPS, idle2=(30, True))))
    metas.append(nest_prop(out_dir))
    return metas
