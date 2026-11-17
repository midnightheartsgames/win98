import importlib.util
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

ATLAS = 256
CLIPS = {'idle': (30, True), 'run': (12, True), 'attack': (10, False), 'death': (16, False)}
TAU = 2 * math.pi


def up(d):
    return (0, d, 0)


def fwd_up(f, u):
    return (0, u, -f)


ORB_BONES = [
    ('root', None, (0, 0, 0.6), (0, 0, 0.95)),
    ('core', 'root', (0, 0, 0.95), (0, 0, 1.15)),
    ('shell.1', 'root', (0, 0, 0.95), (0, 0.25, 0.95)),
    ('shell.2', 'root', (0, 0, 0.95), (0, 0.25, 0.951)),
    ('shell.3', 'root', (0, 0, 0.95), (0, 0.25, 0.952)),
    ('shell.4', 'root', (0, 0, 0.95), (0, 0.25, 0.953))
]


def orb_mesh(mid, anti):
    names = [b[0] for b in ORB_BONES]
    if anti:
        spec = {
            'core': ('stars', (18, 18, 74), (232, 236, 255)),
            'plate': ('fade', (46, 48, 60), (150, 152, 172)),
            'void': ('fade', (30, 30, 110), (60, 60, 180)),
            'glow': ('glow', (255, 176, 64), (255, 250, 214)),
            'horn': ('fade', (60, 62, 76), (170, 172, 190))
        }
    else:
        spec = {
            'core': ('stars', (20, 20, 88), (232, 236, 255)),
            'plate': ('fade', (150, 150, 182), (255, 255, 255)),
            'void': ('fade', (36, 36, 154), (90, 90, 230)),
            'glow': ('glow', (60, 60, 200), (200, 210, 255)),
            'horn': ('fade', (150, 150, 182), (255, 255, 255))
        }
    img, regions = L.paint_cells(np.random.default_rng(len(mid)), mid, spec)
    b = L.Builder(regions, ATLAS, names)
    b.sphere((0, 0, 0.95), 0.25, (1, 1, 1), 'core', 'core', segs=12, rings=8)
    count = 4 if anti else 3
    span = 1.25 if anti else 1.5
    for k in range(count):
        a = 0.35 + k * TAU / count
        bone = 'shell.%d' % (k + 1)
        b.arc((0, 0, 0.95), 0.29, 0.36, a + 0.2, a + span - 0.25, 0.05, bone, 'void', steps=5)
        b.arc((0, 0, 0.95), 0.37, 0.5, a, a + span, 0.16, bone, 'plate', steps=6, bulge=0.05)
    if anti:
        b.cone((-0.2, 0, 1.32), (-0.4, 0.02, 1.72), 0.07, 'root', 'horn', sides=6)
        b.cone((0, 0, 0.5), (0, 0, 0.3), 0.06, 'root', 'horn', sides=6)
        b.sphere((-0.12, 0.22, 0.9), 0.07, (1, 0.6, 1.3), 'core', 'glow', segs=8, rings=5)
    return img, b.finish(mid, names)


def orb_pose(name, t):
    p = {}
    for k in range(4):
        if name == 'idle':
            p['shell.%d' % (k + 1)] = (0, 0.22 * math.sin(TAU * t + k * 1.7), 0)
        elif name == 'run':
            p['shell.%d' % (k + 1)] = (0, 0.3 * math.sin(TAU * t + k), 0)
        elif name == 'attack':
            p['shell.%d' % (k + 1)] = (0, 2.2 * math.sin(math.pi * t) * (1 if k % 2 else -1), 0)
        else:
            k2 = min(1, t * 1.6)
            p['shell.%d' % (k + 1)] = (0.9 * k2 * (1 if k % 2 else -1), 0.8 * k2 * (k - 1.5), 0)
    if name == 'idle':
        p['core'] = (0, 0.1 * math.sin(TAU * t), 0)
    elif name == 'run':
        p['root'] = (-0.25, 0, 0)
    elif name == 'attack':
        p['root'] = (-0.5 * math.sin(math.pi * t), 0, 0)
    else:
        p['root'] = (0.6 * min(1, t * 1.4), 0, 0.3 * min(1, t * 1.4))
    return p


def orb_move(name, t):
    if name == 'idle':
        return up(0.07 * math.sin(TAU * t))
    if name == 'run':
        return up(0.05 * math.sin(TAU * t))
    if name == 'attack':
        return fwd_up(0.45 * math.sin(math.pi * t), 0)
    return up(-0.7 * min(1, t * 1.5) ** 2)


S = 1.22


def scaled(p):
    return (p[0] * S, p[1] * S, p[2] * S)


def ranger_bones(heroes):
    return [(n, par, scaled(h), scaled(tl)) for n, par, h, tl in heroes.BONES[:17]]


def ranger_spec(kind):
    gold = (255, 196, 74)
    if kind == 'distorter':
        return {
            'armor': ('trim', (214, 214, 226), (122, 82, 216)),
            'armor2': ('fade', (156, 156, 182), (244, 244, 250)),
            'dark': ('flat', (94, 94, 122), None),
            'boot': ('flat', (34, 34, 44), None),
            'cloth': ('fade', (74, 42, 154), (122, 82, 216)),
            'visor': ('eyes', (214, 214, 226), (220, 190, 255)),
            'blade': ('fade', (122, 82, 216), (244, 238, 255)),
            'leaf': ('fade', (166, 136, 232), (252, 246, 255))
        }
    spec = {
        'armor': ('trim', (60, 61, 78) if kind == 'reaver' else (69, 71, 94), gold),
        'armor2': ('fade', (60, 62, 80), (162, 166, 188)),
        'dark': ('flat', (36, 36, 46), None),
        'boot': ('flat', (17, 17, 23), None),
        'cloth': ('fade', (72, 40, 142), (116, 72, 204)),
        'visor': ('eyes' if kind == 'reaver' else 'eye1', (40, 40, 52), (255, 224, 96)),
        'blade': ('fade', (60, 30, 120), (200, 120, 255)),
        'cannon': ('trim', (102, 106, 134), gold),
        'crystal': ('fade', (42, 44, 156), (164, 182, 255))
    }
    return spec


def ranger_mesh(mid, kind, names):
    img, regions = L.paint_cells(np.random.default_rng(len(mid) * 7), mid, ranger_spec(kind))
    b = L.Builder(regions, ATLAS, names)

    def P(x, y, z):
        return (x * S, y * S, z * S)

    def R(r):
        return r * S

    b.tube(P(0, 0, 0.84), P(0, 0, 1.06), R(0.15), R(0.16), 'root', 'dark', sides=10, squash=0.8)
    b.tube(P(0, 0, 1.04), P(0, 0, 1.24), R(0.15), R(0.18), 'spine', 'armor', sides=10, squash=0.75, blend='root')
    b.tube(P(0, 0, 1.22), P(0, 0, 1.46), R(0.2), R(0.15), 'chest', 'armor', sides=10, squash=0.72, blend='spine')
    b.box(P(0, 0.1, 1.33), (R(0.28), R(0.07), R(0.2)), 'chest', 'armor2', rot=(0.15, 0, 0))
    b.tube(P(0, 0, 1.02), P(0, 0, 0.64), R(0.17), R(0.25), 'root', 'cloth', sides=10, squash=0.8, cap=False)
    b.tube(P(0, 0, 1.44), P(0, 0, 1.55), R(0.055), R(0.05), 'neck', 'dark', sides=8)
    b.sphere(P(0, 0.01, 1.64), R(0.12), (1, 1.05, 1.12), 'head', 'armor2', face_region='visor', segs=10, rings=8)
    if kind == 'reaver':
        for s in (1, -1):
            b.cone(P(0.07 * s, -0.01, 1.71), P(0.17 * s, -0.05, 1.96), R(0.035), 'head', 'armor2')
    elif kind == 'eliminator':
        b.box(P(0, -0.01, 1.77), (R(0.03), R(0.22), R(0.08)), 'head', 'armor2')
        b.cone(P(0, -0.1, 1.74), P(0, -0.28, 1.8), R(0.04), 'head', 'armor2')
    else:
        for s in (1, -1):
            b.box(P(0.09 * s, 0, 1.76), (R(0.03), R(0.05), R(0.14)), 'head', 'armor', rot=(0, 0.4 * s, 0))
    for s, side in ((1, 'L'), (-1, 'R')):
        b.sphere(P(0.22 * s, 0, 1.42), R(0.09), (1.25, 1.15, 0.8), 'upperarm.' + side, 'armor', segs=8, rings=6)
        b.tube(P(0.19 * s, 0, 1.4), P(0.23 * s, 0, 1.14), R(0.06), R(0.055), 'upperarm.' + side, 'armor2', sides=8)
        b.tube(P(0.23 * s, 0, 1.14), P(0.26 * s, 0, 0.92), R(0.055), R(0.05), 'forearm.' + side, 'armor', sides=8)
        b.box(P(0.265 * s, 0.01, 0.86), (R(0.08), R(0.09), R(0.11)), 'hand.' + side, 'dark')
        b.tube(P(0.1 * s, 0, 0.94), P(0.11 * s, 0, 0.5), R(0.085), R(0.065), 'thigh.' + side, 'dark', sides=8, blend='root')
        b.tube(P(0.11 * s, 0, 0.5), P(0.11 * s, 0, 0.12), R(0.068), R(0.055), 'shin.' + side, 'armor', sides=8)
        b.box(P(0.11 * s, 0.06, 0.5), (R(0.1), R(0.06), R(0.12)), 'shin.' + side, 'armor2')
        b.box(P(0.11 * s, 0.06, 0.06), (R(0.11), R(0.26), R(0.12)), 'foot.' + side, 'boot')
    if kind == 'reaver':
        for s, side in ((1, 'L'), (-1, 'R')):
            pts = [P(0.27 * s, 0.04, 0.84), P(0.3 * s, 0.24, 0.74), P(0.31 * s, 0.48, 0.76), P(0.29 * s, 0.7, 0.9)]
            b.chain(pts, [R(0.018), R(0.03), R(0.026), 0.0], ['hand.' + side] * 4, 'blade', sides=6, squash=3.2)
    elif kind == 'eliminator':
        b.tube(P(-0.24, 0, 1.14), P(-0.3, 0.02, 0.48), R(0.13), R(0.1), 'forearm.R', 'cannon', sides=10)
        b.tube(P(-0.3, 0.02, 0.48), P(-0.31, 0.02, 0.36), R(0.075), R(0.075), 'forearm.R', 'dark', sides=8)
        for k, (dx, dy, dz) in enumerate([(-0.26, 0.08, -0.1), (-0.2, -0.12, -0.18), (-0.28, 0.02, 0.1), (0.08, 0.2, -0.12)]):
            base = P(-0.3, 0.02, 0.9 - 0.1 * k)
            b.cone(base, (base[0] + dx * S, base[1] + dy * S, base[2] + dz * S), R(0.07), 'forearm.R', 'crystal', sides=5)
    else:
        b.box(P(0, -0.17, 1.02), (R(0.42), R(0.03), R(0.78)), 'chest', 'cloth', rot=(-0.1, 0, 0))
        for s in (1, -1):
            b.box(P(0.46 * s, 0.05, 1.78), (R(0.14), R(0.03), R(0.24)), 'root', 'leaf', rot=(0, 0.5 * s, 0))
            for k in range(3):
                base = P((0.27 + 0.015 * k) * s, 0.06, 0.82)
                b.cone(base, P((0.28 + 0.06 * (k - 1)) * s, 0.24, 0.72 - 0.03 * k), R(0.022), 'hand.' + ('L' if s > 0 else 'R'), 'blade', sides=5)
    return img, b.finish(mid, names)


def ranger_pose(heroes, kind):
    def pose(name, t):
        s = math.sin(TAU * t)
        if name == 'idle':
            p = {'chest': (0.04 * s, 0, 0), 'head': (0.03 * math.sin(TAU * t + 1), 0.05 * s, 0), 'upperarm.L': (0.1, 0.12, 0), 'upperarm.R': (0.1, -0.12, 0), 'forearm.L': (0.3, 0, 0), 'forearm.R': (0.3, 0, 0)}
            if kind == 'eliminator':
                p['upperarm.R'] = (0.5, -0.15, 0)
                p['forearm.R'] = (0.6, 0, 0)
            return p
        if name == 'attack' and kind == 'eliminator':
            k = math.sin(min(1, t * 2.2) * math.pi / 2)
            kick = math.exp(-((t - 0.5) / 0.12) ** 2)
            return {'upperarm.R': (1.45 * k - 0.35 * kick, -0.1, 0), 'forearm.R': (0.05, 0, 0), 'chest': (0.1 * kick, 0, -0.25 * k), 'spine': (0.06 * kick, 0, 0)}
        if name == 'attack' and kind == 'distorter':
            k = math.sin(t * math.pi)
            return {'upperarm.L': (2.0 * k, 0.2, 0), 'upperarm.R': (2.0 * k, -0.2, 0), 'forearm.L': (0.4 * k, 0, 0), 'forearm.R': (0.4 * k, 0, 0), 'spine': (-0.15 * k, 0, 0)}
        if name == 'attack':
            p = heroes.pose('attack', t)
            p['upperarm.L'] = (1.4 * math.sin(min(1, max(0, t - 0.25) * 1.6) * math.pi), 0.2, 0)
            p['forearm.L'] = (0.5, 0, 0)
            return p
        return heroes.pose(name, t)
    return pose


def ranger_move(name, t):
    return (0, -0.95 * min(1, t * 1.4), 0) if name == 'death' else (0, 0, 0)


WEAVER_BONES = [
    ('root', None, (0, 0, 0.7), (0, 0, 0.95)),
    ('body', 'root', (0, 0, 0.95), (0, 0, 1.34)),
    ('head', 'body', (0, 0, 1.34), (0, 0, 1.6)),
    ('arm.L', 'body', (0.15, 0, 1.28), (0.3, 0.02, 1.22)),
    ('fore.L', 'arm.L', (0.3, 0.02, 1.22), (0.42, 0.04, 1.4)),
    ('arm.R', 'body', (-0.15, 0, 1.28), (-0.3, 0.02, 1.22)),
    ('fore.R', 'arm.R', (-0.3, 0.02, 1.22), (-0.42, 0.04, 1.4)),
    ('leg.L', 'root', (0.07, 0, 0.86), (0.12, 0, 0.36)),
    ('leg.R', 'root', (-0.07, 0, 0.86), (-0.12, 0, 0.36))
]


def weaver_mesh(mid):
    names = [b[0] for b in WEAVER_BONES]
    spec = {
        'robe': ('fade', (36, 38, 90), (110, 114, 200)),
        'gold': ('fade', (142, 96, 64), (248, 234, 208)),
        'goldl': ('fade', (194, 156, 116), (255, 244, 220)),
        'mask': ('mask', (228, 201, 160), (40, 30, 30)),
        'face': ('mask', (228, 201, 160), (40, 30, 30)),
        'band': ('trim', (62, 64, 132), (255, 220, 140))
    }
    img, regions = L.paint_cells(np.random.default_rng(31), mid, spec)
    b = L.Builder(regions, ATLAS, names)
    b.tube((0, 0, 0.9), (0, 0, 1.32), 0.16, 0.13, 'body', 'robe', sides=10, squash=0.8, blend='root')
    b.tube((0, 0, 1.18), (0, 0, 1.3), 0.15, 0.14, 'body', 'band', sides=10, squash=0.82)
    b.tube((0, 0, 1.3), (0, 0, 1.38), 0.12, 0.07, 'body', 'gold', sides=10, squash=0.8)
    b.sphere((0, 0.01, 1.47), 0.11, (1, 0.9, 1.25), 'head', 'mask', face_region='face', segs=10, rings=8)
    b.sphere((0, -0.035, 1.5), 0.125, (1.05, 0.9, 1.25), 'head', 'robe', segs=10, rings=6, cut=-0.06, cut_below=True)
    for s, side in ((1, 'L'), (-1, 'R')):
        b.cone((0.08 * s, 0, 1.5), (0.25 * s, -0.03, 1.66), 0.035, 'head', 'goldl', sides=5)
        b.cone((0.07 * s, 0, 1.42), (0.2 * s, -0.02, 1.4), 0.025, 'head', 'gold', sides=5)
        b.tube((0.15 * s, 0, 1.28), (0.3 * s, 0.02, 1.22), 0.045, 0.05, 'arm.' + side, 'robe', sides=8)
        b.tube((0.3 * s, 0.02, 1.22), (0.42 * s, 0.04, 1.4), 0.05, 0.085, 'fore.' + side, 'robe', sides=8)
        b.tube((0.415 * s, 0.04, 1.38), (0.43 * s, 0.045, 1.42), 0.09, 0.09, 'fore.' + side, 'band', sides=8)
        for k in range(4):
            a = -0.5 + k * 0.33
            tip = (0.43 * s + 0.16 * math.sin(a) * s, 0.06 + 0.05 * (k - 1.5), 1.42 + 0.16 * math.cos(a))
            b.cone((0.43 * s, 0.05, 1.43), tip, 0.022, 'fore.' + side, 'goldl', sides=4)
        pts = [(0.07 * s, 0, 0.88), (0.1 * s, 0.02, 0.62), (0.12 * s, 0, 0.4), (0.14 * s, 0.03, 0.18)]
        b.chain(pts, [0.035, 0.03, 0.02, 0.0], ['leg.' + side] * 4, 'gold', sides=6, squash=1.6)
    for k in range(7):
        a = k * TAU / 7 + 0.2
        b.box((0.19 * math.cos(a), 0.19 * math.sin(a), 0.8), (0.12, 0.02, 0.34), 'root', 'gold' if k % 2 else 'goldl', rot=(0.5, 0, a - math.pi / 2))
    return img, b.finish(mid, names)


def weaver_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'arm.L': (0, 0.15 * s, 0), 'arm.R': (0, -0.15 * s, 0), 'fore.L': (0.1 * s, 0, 0), 'fore.R': (-0.1 * s, 0, 0), 'leg.L': (0.12 * s, 0, 0), 'leg.R': (-0.12 * s, 0, 0), 'head': (0.05 * s, 0, 0)}
    if name == 'run':
        return {'root': (-0.35, 0, 0), 'leg.L': (-0.5 + 0.15 * s, 0, 0), 'leg.R': (-0.5 - 0.15 * s, 0, 0), 'arm.L': (0, 0.3, 0), 'arm.R': (0, -0.3, 0), 'head': (0.3, 0, 0)}
    if name == 'attack':
        k = math.sin(t * math.pi)
        return {'body': (-0.3 * k, 0, 0), 'fore.L': (-1.2 * k, 0, 0), 'fore.R': (-1.2 * k, 0, 0), 'arm.L': (0, 0, 0.6 * k), 'arm.R': (0, 0, -0.6 * k), 'leg.L': (0.3 * k, 0, 0), 'leg.R': (0.3 * k, 0, 0)}
    k = min(1, t * 1.5)
    return {'root': (1.2 * k, 0, 0.2 * k), 'head': (0.5 * k, 0, 0), 'arm.L': (0, 0.6 * k, 0), 'arm.R': (0, -0.6 * k, 0), 'leg.L': (0.4 * k, 0, 0), 'leg.R': (0.2 * k, 0, 0)}


def floater_move(drop):
    def move(name, t):
        if name == 'idle':
            return up(0.08 * math.sin(TAU * t))
        if name == 'run':
            return up(0.05 * math.sin(TAU * t))
        if name == 'attack':
            return fwd_up(0.3 * math.sin(math.pi * t), 0)
        return up(-drop * min(1, t * 1.5) ** 2)
    return move


SPAWN_BONES = [
    ('root', None, (0, 0, 0.6), (0, 0, 0.9)),
    ('core', 'root', (0, 0, 0.9), (0, 0, 1.1)),
    ('wing.L', 'root', (0.1, 0, 1.0), (0.4, 0, 1.3)),
    ('wing.R', 'root', (-0.1, 0, 1.0), (-0.4, 0, 1.3)),
    ('tail', 'root', (0, 0, 0.82), (0, 0, 0.45))
]


def spawn_mesh(mid):
    names = [b[0] for b in SPAWN_BONES]
    spec = {
        'core': ('glow', (156, 10, 20), (255, 210, 150)),
        'shell': ('fade', (106, 26, 44), (184, 40, 58)),
        'wing': ('fade', (106, 26, 44), (255, 154, 64)),
        'pink': ('fade', (255, 98, 200), (255, 200, 240)),
        'ember': ('glow', (255, 120, 40), (255, 240, 180))
    }
    img, regions = L.paint_cells(np.random.default_rng(57), mid, spec)
    b = L.Builder(regions, ATLAS, names)
    b.sphere((0, 0, 0.95), 0.16, (1, 1, 1), 'core', 'core', segs=12, rings=8)
    b.arc((0, 0, 0.95), 0.17, 0.24, 0.1, math.pi - 0.1, 0.12, 'core', 'shell', steps=8, bulge=0.02)
    b.arc((0, 0, 1.08), 0.13, 0.18, 0.4, math.pi - 0.4, 0.06, 'core', 'ember', steps=5)
    for s, side in ((1, 'L'), (-1, 'R')):
        bone = 'wing.' + side
        b.chain([(0.1 * s, 0, 1.0), (0.28 * s, 0, 1.2), (0.46 * s, 0.02, 1.44), (0.6 * s, 0, 1.66)], [0.03, 0.04, 0.03, 0.0], [bone] * 4, 'wing', sides=6, squash=3.6)
        b.chain([(0.12 * s, 0, 0.92), (0.26 * s, 0, 0.86), (0.42 * s, 0, 0.94)], [0.025, 0.03, 0.0], [bone] * 3, 'wing', sides=6, squash=3.0)
        b.cone((0.52 * s, 0.01, 1.52), (0.7 * s, 0, 1.74), 0.03, bone, 'pink', sides=5)
        b.cone((0.3 * s, 0, 1.26), (0.42 * s, -0.04, 1.2), 0.03, bone, 'shell', sides=5)
    b.chain([(0, 0, 0.8), (0, 0, 0.62), (0.02, 0, 0.44), (0, 0, 0.26)], [0.06, 0.045, 0.025, 0.0], ['tail'] * 4, 'shell', sides=8)
    return img, b.finish(mid, names)


def spawn_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'wing.L': (0.18 * s, 0, 0), 'wing.R': (-0.18 * s, 0, 0), 'tail': (0.15 * math.sin(TAU * t + 1), 0, 0.1 * s), 'core': (0, 0.3 * s, 0)}
    if name == 'run':
        return {'root': (-0.3, 0, 0), 'wing.L': (0.35 * s, 0, 0), 'wing.R': (-0.35 * s, 0, 0), 'tail': (0.5, 0, 0)}
    if name == 'attack':
        k = math.sin(t * math.pi)
        return {'wing.L': (-0.5 * k, 0, 0.6 * k), 'wing.R': (0.5 * k, 0, -0.6 * k), 'root': (-0.4 * k, 0, 0), 'tail': (0.6 * k, 0, 0)}
    k = min(1, t * 1.5)
    return {'wing.L': (-0.8 * k, 0, 0), 'wing.R': (0.8 * k, 0, 0), 'root': (0.9 * k, 0, 0.3 * k), 'tail': (-0.4 * k, 0, 0)}


def trampler_bones():
    bones = [
        ('root', None, (0, -0.35, 1.4), (0, 0.3, 1.4)),
        ('spine', 'root', (0, 0.3, 1.4), (0, 0.8, 1.5)),
        ('neck', 'spine', (0, 0.8, 1.5), (0, 1.2, 1.65)),
        ('head', 'neck', (0, 1.2, 1.65), (0, 1.75, 1.6)),
        ('tail', 'root', (0, -0.75, 1.45), (0, -1.25, 1.3))
    ]
    for leg, parent, y in (('fl', 'spine', 0.72), ('bl', 'root', -0.6)):
        for s, side in ((1, 'L'), (-1, 'R')):
            bones.append((leg + '.u.' + side, parent, (0.45 * s, y, 1.2), (0.5 * s, y + 0.04, 0.62)))
            bones.append((leg + '.l.' + side, leg + '.u.' + side, (0.5 * s, y + 0.04, 0.62), (0.5 * s, y, 0.06)))
    return bones


TRAMPLER_BONES = trampler_bones()


def trampler_mesh(mid):
    names = [b[0] for b in TRAMPLER_BONES]
    spec = {
        'navy': ('fade', (23, 21, 46), (76, 74, 134)),
        'plate': ('seams', (226, 226, 238), None),
        'plate2': ('fade', (118, 118, 156), (240, 240, 248)),
        'dark': ('flat', (18, 16, 30), None),
        'glow': ('glow', (60, 200, 90), (228, 255, 232)),
        'eye': ('glow', (90, 90, 255), (220, 220, 255))
    }
    img, regions = L.paint_cells(np.random.default_rng(77), mid, spec)
    b = L.Builder(regions, ATLAS, names)
    b.sphere((0, -0.15, 1.42), 0.6, (1.0, 1.45, 0.75), 'root', 'navy', segs=12, rings=8)
    b.sphere((0, 0.62, 1.52), 0.56, (1.08, 0.85, 0.82), 'spine', 'navy', segs=12, rings=8)
    b.sphere((0, -0.1, 1.55), 0.63, (1.05, 1.42, 0.72), 'root', 'plate', segs=12, rings=8, cut=0.05, cut_below=True)
    b.sphere((0, 0.72, 1.62), 0.6, (1.14, 0.72, 0.82), 'spine', 'plate', segs=12, rings=8, cut=0.0, cut_below=True)
    for x, y, h in ((0, -0.55, 2.0), (0, -0.05, 2.06), (0, 0.45, 2.1), (0.35, 0.75, 1.95), (-0.35, 0.75, 1.95)):
        b.cone((x, y, h - 0.1), (x * 1.5, y - 0.18, h + 0.3), 0.09, 'spine' if y > 0.3 else 'root', 'plate2', sides=6)
    b.tube((0, 0.8, 1.5), (0, 1.28, 1.66), 0.26, 0.22, 'neck', 'navy', sides=10, blend='spine')
    b.box((0, 1.47, 1.62), (0.42, 0.58, 0.4), 'head', 'navy')
    b.box((0, 1.62, 1.74), (0.48, 0.42, 0.18), 'head', 'plate2', rot=(-0.25, 0, 0))
    for s in (1, -1):
        b.cone((0.15 * s, 1.5, 1.82), (0.38 * s, 1.85, 2.24), 0.07, 'head', 'plate2', sides=6)
        b.sphere((0.17 * s, 1.76, 1.6), 0.045, (1, 1, 1), 'head', 'glow', segs=6, rings=4)
    b.cone((0, 1.74, 1.6), (0, 2.2, 1.78), 0.07, 'head', 'plate2', sides=6)
    b.chain([(0, -0.75, 1.45), (0, -1.0, 1.38), (0, -1.28, 1.26)], [0.12, 0.08, 0.0], ['tail', 'tail', 'tail'], 'navy', sides=8)
    for n, y in (('fl', 0.72), ('bl', -0.6)):
        for s, side in ((1, 'L'), (-1, 'R')):
            u, lo = n + '.u.' + side, n + '.l.' + side
            b.tube((0.45 * s, y, 1.25), (0.5 * s, y + 0.04, 0.62), 0.24, 0.16, u, 'navy', sides=10, blend='spine' if n == 'fl' else 'root')
            b.tube((0.5 * s, y + 0.04, 0.62), (0.5 * s, y, 0.1), 0.16, 0.12, lo, 'navy', sides=8)
            b.box((0.5 * s, y + 0.15, 0.68), (0.26, 0.08, 0.3), lo, 'plate2')
            b.sphere((0.5 * s, y + 0.16, 0.42), 0.05, (1, 1, 1.6), lo, 'glow', segs=6, rings=4)
            b.box((0.5 * s, y + 0.03, 0.05), (0.3, 0.36, 0.1), lo, 'dark')
    return img, b.finish(mid, names)


def trampler_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'spine': (0.03 * s, 0, 0), 'neck': (0.05 * s, 0, 0), 'head': (0.04 * math.sin(TAU * t + 1), 0, 0.06 * s), 'tail': (0.1 * s, 0, 0.2 * s)}
    if name == 'run':
        a = 0.55 * s
        p = {'spine': (0.06 * math.sin(2 * TAU * t), 0, 0), 'head': (-0.1, 0, 0), 'tail': (0.3, 0, 0.2 * s)}
        for n, sign in (('fl.u.L', 1), ('bl.u.R', 1), ('fl.u.R', -1), ('bl.u.L', -1)):
            p[n] = (a * sign, 0, 0)
            p[n.replace('.u.', '.l.')] = (-0.5 * max(0, -s * sign), 0, 0)
        return p
    if name == 'attack':
        rear = math.sin(min(1, t / 0.55) * math.pi / 2) if t < 0.55 else max(0, 1 - (t - 0.55) / 0.2)
        return {'root': (0.35 * rear, 0, 0), 'spine': (0.25 * rear, 0, 0), 'neck': (-0.2 * rear, 0, 0), 'head': (-0.3 * rear, 0, 0),
                'fl.u.L': (1.0 * rear, 0, 0), 'fl.u.R': (0.9 * rear, 0, 0), 'fl.l.L': (-0.9 * rear, 0, 0), 'fl.l.R': (-0.8 * rear, 0, 0),
                'bl.u.L': (-0.35 * rear, 0, 0), 'bl.u.R': (-0.35 * rear, 0, 0), 'bl.l.L': (0.2 * rear, 0, 0), 'bl.l.R': (0.2 * rear, 0, 0)}
    k = min(1, t * 1.4)
    return {'root': (0, 1.35 * k, 0), 'neck': (-0.3 * k, 0, 0.3 * k), 'head': (-0.2 * k, 0, 0),
            'fl.u.L': (0.6 * k, 0, 0), 'fl.u.R': (0.3 * k, 0, 0), 'bl.u.L': (-0.5 * k, 0, 0), 'bl.u.R': (-0.2 * k, 0, 0), 'tail': (-0.5 * k, 0, 0)}


def trampler_move(name, t):
    if name == 'death':
        return (0, 0, -0.85 * min(1, t * 1.4) ** 1.5)
    if name == 'run':
        return (0, 0, 0.06 * abs(math.sin(TAU * t)))
    return (0, 0, 0)


TROTTER_BONES = [
    ('root', None, (0, -0.2, 0.5), (0, 0.15, 0.5)),
    ('head', 'root', (0, 0.15, 0.55), (0, 0.45, 0.55)),
    ('tail', 'root', (0, -0.38, 0.6), (0, -0.48, 0.72)),
    ('leg.fl', 'root', (0.17, 0.14, 0.38), (0.17, 0.14, 0.04)),
    ('leg.fr', 'root', (-0.17, 0.14, 0.38), (-0.17, 0.14, 0.04)),
    ('leg.bl', 'root', (0.17, -0.25, 0.38), (0.17, -0.25, 0.04)),
    ('leg.br', 'root', (-0.17, -0.25, 0.38), (-0.17, -0.25, 0.04))
]


def trotter_mesh(mid):
    names = [b[0] for b in TROTTER_BONES]
    spec = {
        'black': ('fade', (12, 12, 16), (44, 42, 46)),
        'hood': ('trim', (236, 236, 242), (210, 170, 88)),
        'face': ('pigface', (240, 240, 246), (20, 20, 26)),
        'cream': ('fade', (205, 184, 138), (255, 248, 230)),
        'hoof': ('flat', (42, 34, 28), None),
        'gold': ('fade', (142, 108, 44), (240, 214, 144))
    }
    img, regions = L.paint_cells(np.random.default_rng(12), mid, spec)
    b = L.Builder(regions, ATLAS, names)
    b.sphere((0, -0.05, 0.5), 0.3, (1.0, 1.35, 0.95), 'root', 'black', segs=12, rings=8)
    b.sphere((0, -0.02, 0.56), 0.32, (1.04, 1.28, 0.95), 'root', 'hood', segs=12, rings=8, cut=0.0, cut_below=True)
    b.sphere((0, 0.33, 0.56), 0.2, (1, 0.95, 0.95), 'head', 'face', face_region='face', segs=10, rings=8)
    b.tube((0, 0.47, 0.5), (0, 0.56, 0.5), 0.08, 0.075, 'head', 'cream', sides=8)
    for s in (1, -1):
        b.cone((0.1 * s, 0.3, 0.7), (0.18 * s, 0.26, 0.86), 0.05, 'head', 'hood', sides=5)
    b.box((0, -0.05, 0.86), (0.04, 0.2, 0.03), 'root', 'gold')
    for n, (x, y) in (('leg.fl', (0.17, 0.14)), ('leg.fr', (-0.17, 0.14)), ('leg.bl', (0.17, -0.25)), ('leg.br', (-0.17, -0.25))):
        b.tube((x, y, 0.4), (x, y, 0.06), 0.075, 0.06, n, 'cream', sides=8)
        b.box((x, y + 0.01, 0.03), (0.12, 0.13, 0.06), n, 'hoof')
    b.chain([(0, -0.38, 0.6), (0, -0.46, 0.66), (0.02, -0.46, 0.75), (0, -0.42, 0.78)], [0.025, 0.022, 0.018, 0.0], ['tail'] * 4, 'cream', sides=6)
    return img, b.finish(mid, names)


def trotter_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'head': (0.08 * s, 0, 0.06 * math.sin(TAU * t + 1)), 'tail': (0, 0, 0.4 * s)}
    if name == 'run':
        return {'leg.fl': (0.7 * s, 0, 0), 'leg.br': (0.7 * s, 0, 0), 'leg.fr': (-0.7 * s, 0, 0), 'leg.bl': (-0.7 * s, 0, 0), 'root': (0.08 * s, 0, 0), 'tail': (0, 0, 0.6 * s), 'head': (0.1, 0, 0)}
    if name == 'attack':
        k = math.sin(t * math.pi)
        return {'head': (-0.5 * k, 0, 0), 'root': (-0.2 * k, 0, 0), 'leg.bl': (-0.4 * k, 0, 0), 'leg.br': (-0.4 * k, 0, 0)}
    k = min(1, t * 1.5)
    return {'root': (0, 1.5 * k, 0), 'leg.fl': (0.4 * k, 0, 0), 'leg.fr': (-0.3 * k, 0, 0), 'leg.bl': (0.5 * k, 0, 0), 'leg.br': (-0.4 * k, 0, 0), 'head': (0.3 * k, 0, 0)}


def trotter_move(name, t):
    if name == 'run':
        return (0, 0, 0.06 * abs(math.sin(TAU * t)))
    if name == 'attack':
        return (0, 0.25 * math.sin(math.pi * t), 0)
    if name == 'death':
        return (0, 0, -0.18 * min(1, t * 1.5))
    return (0, 0, 0)


def export(out_dir, mid, rig_bones, mesh, pose, move):
    rig = L.build_rig(mid + '_rig', rig_bones)
    clips = L.animate(rig, mid, {n: (lambda n: lambda t: pose(n, t))(n) for n in CLIPS}, CLIPS, move)
    img, ob = mesh
    L.bind(ob, rig)
    meta = L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, clips=clips, fps=L.FPS)
    ob.hide_set(True)
    rig.hide_set(True)
    return meta


def build(out_dir, rng, heroes):
    L.reset()
    metas = []
    for mid, anti in (('foe_baryon', False), ('foe_antibaryon', True)):
        metas.append(export(out_dir, mid, ORB_BONES, orb_mesh(mid, anti), orb_pose, orb_move))
    bones = ranger_bones(heroes)
    names = [b[0] for b in bones]
    for mid, kind in (('foe_reaver', 'reaver'), ('foe_eliminator', 'eliminator'), ('foe_distorter', 'distorter')):
        metas.append(export(out_dir, mid, bones, ranger_mesh(mid, kind, names), ranger_pose(heroes, kind), ranger_move))
    metas.append(export(out_dir, 'foe_weaver', WEAVER_BONES, weaver_mesh('foe_weaver'), weaver_pose, floater_move(0.5)))
    metas.append(export(out_dir, 'foe_flamespawn', SPAWN_BONES, spawn_mesh('foe_flamespawn'), spawn_pose, floater_move(0.55)))
    metas.append(export(out_dir, 'elite_trampler', TRAMPLER_BONES, trampler_mesh('elite_trampler'), trampler_pose, trampler_move))
    metas.append(export(out_dir, 'foe_trotter', TROTTER_BONES, trotter_mesh('foe_trotter'), trotter_pose, trotter_move))
    return metas
