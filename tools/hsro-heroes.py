import importlib.util
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

ATLAS = 256

BONES = [
    ('root', None, (0, 0, 0.92), (0, 0, 1.04)),
    ('spine', 'root', (0, 0, 1.04), (0, 0, 1.22)),
    ('chest', 'spine', (0, 0, 1.22), (0, 0, 1.44)),
    ('neck', 'chest', (0, 0, 1.44), (0, 0, 1.52)),
    ('head', 'neck', (0, 0, 1.52), (0, 0, 1.74)),
    ('upperarm.L', 'chest', (0.19, 0, 1.4), (0.23, 0, 1.14)),
    ('forearm.L', 'upperarm.L', (0.23, 0, 1.14), (0.26, 0, 0.9)),
    ('hand.L', 'forearm.L', (0.26, 0, 0.9), (0.27, 0, 0.8)),
    ('upperarm.R', 'chest', (-0.19, 0, 1.4), (-0.23, 0, 1.14)),
    ('forearm.R', 'upperarm.R', (-0.23, 0, 1.14), (-0.26, 0, 0.9)),
    ('hand.R', 'forearm.R', (-0.26, 0, 0.9), (-0.27, 0, 0.8)),
    ('thigh.L', 'root', (0.1, 0, 0.92), (0.11, 0, 0.5)),
    ('shin.L', 'thigh.L', (0.11, 0, 0.5), (0.11, 0, 0.09)),
    ('foot.L', 'shin.L', (0.11, 0, 0.09), (0.11, 0.16, 0.03)),
    ('thigh.R', 'root', (-0.1, 0, 0.92), (-0.11, 0, 0.5)),
    ('shin.R', 'thigh.R', (-0.11, 0, 0.5), (-0.11, 0, 0.09)),
    ('foot.R', 'shin.R', (-0.11, 0, 0.09), (-0.11, 0.16, 0.03)),
    ('tail.1', 'root', (0, -0.12, 0.94), (0, -0.3, 0.86)),
    ('tail.2', 'tail.1', (0, -0.3, 0.86), (0, -0.48, 0.82)),
    ('tail.3', 'tail.2', (0, -0.48, 0.82), (0, -0.64, 0.88))
]
BONE_NAMES = [b[0] for b in BONES]

REGIONS = {
    'skin': (0, 192, 64, 64),
    'face': (64, 192, 64, 64),
    'boots': (192, 192, 64, 64),
    'coat': (0, 96, 128, 96),
    'pants': (128, 128, 64, 64),
    'gloves': (192, 128, 64, 64),
    'gold': (128, 96, 64, 32),
    'accent': (192, 96, 64, 32),
    'scarf': (0, 64, 64, 32),
    'belt': (64, 64, 64, 32),
    'inner': (128, 64, 64, 32),
    'sole': (192, 64, 64, 32),
    'plain': (0, 0, 64, 32)
}

OUTFITS = {
    'human': {'plain': (236, 238, 244), 'coat': (236, 238, 244), 'pants': (52, 54, 76), 'boots': (48, 42, 60), 'gloves': (40, 44, 70), 'gold': (216, 191, 114), 'accent': (120, 96, 210), 'scarf': (236, 238, 244), 'belt': (60, 56, 80), 'inner': (40, 44, 70), 'sole': (30, 28, 40)},
    'coat': {'plain': (248, 248, 250), 'coat': (248, 248, 250), 'pants': (62, 64, 80), 'boots': (52, 40, 36), 'gloves': (250, 250, 250), 'gold': (200, 200, 210), 'accent': (120, 150, 210), 'scarf': (248, 248, 250), 'belt': (62, 64, 80), 'inner': (176, 204, 236), 'sole': (30, 28, 40)},
    'fox': {'plain': (58, 92, 138), 'coat': (58, 92, 138), 'pants': (214, 200, 170), 'boots': (110, 74, 48), 'gloves': (120, 84, 56), 'gold': (226, 190, 96), 'accent': (230, 236, 244), 'scarf': (232, 150, 60), 'belt': (90, 60, 40), 'inner': (236, 232, 222), 'sole': (60, 40, 28)}
}

SKIN_GRAD = (0.9, 1.0)


def paint_body(rng, outfit, name):
    px = L.canvas(ATLAS)
    cols = OUTFITS[outfit]
    for region, rect in REGIONS.items():
        if region in ('skin', 'face') or (outfit == 'coat' and region == 'gloves'):
            L.fill_region(px, rng, rect, (250, 250, 250), grad=SKIN_GRAD, grain=0.015)
        else:
            L.fill_region(px, rng, rect, cols[region])
    x, y, w, h = REGIONS['coat']
    px[y:y + h, x + w // 2 - 1:x + w // 2 + 1, :3] *= 0.78
    if outfit == 'coat':
        for k in (20, 76):
            px[y + 24:y + 26, x + k:x + k + 30, :3] *= 0.8
            px[y + 24:y + 50, x + k:x + k + 1, :3] *= 0.85
            px[y + 24:y + 50, x + k + 30:x + k + 31, :3] *= 0.85
        px[y + 60:y + 62, x + 96:x + 116, :3] = L.rgb((90, 120, 190))
        return L.new_image(name, ATLAS, px)
    for k in range(6, w, 20):
        px[y + 8:y + h - 14, x + k:x + k + 1, :3] *= 0.9
    px[y + h - 10:y + h - 4, x:x + w, :3] = L.rgb(cols['gold'])
    px[y + 4:y + 8, x:x + w, :3] = L.rgb(cols['gold'])
    if outfit == 'human':
        px[y + 30:y + 44, x + 20:x + 34, :3] = L.rgb(cols['accent'])
        px[y + 32:y + 42, x + 22:x + 32, :3] = L.rgb((216, 191, 114))
    else:
        px[y + 40:y + 52, x + 8:x + 120, :3] = L.rgb(cols['accent'])
        px[y + 44:y + 48, x + 8:x + 120, :3] = L.rgb((60, 160, 200))
        for k in range(10, w, 16):
            px[y + 14:y + 22, x + k:x + k + 6, :3] = L.rgb((40, 64, 100))
    x, y, w, h = REGIONS['boots']
    px[y + h - 10:y + h - 6, x:x + w, :3] = L.rgb(cols['gold'])
    x, y, w, h = REGIONS['belt']
    px[y + 10:y + 22, x + 26:x + 38, :3] = L.rgb(cols['gold'])
    x, y, w, h = REGIONS['scarf']
    for k in range(0, w, 8):
        px[y:y + h, x + k:x + k + 3, :3] *= 0.88
    return L.new_image(name, ATLAS, px)


FACES = [
    {'iris': (82, 54, 140), 'shape': 'round', 'brow': 0, 'mouth': 'smile'},
    {'iris': (40, 120, 150), 'shape': 'narrow', 'brow': 1, 'mouth': 'flat'},
    {'iris': (150, 70, 60), 'shape': 'sleepy', 'brow': 0, 'mouth': 'small'},
    {'iris': (60, 110, 60), 'shape': 'sharp', 'brow': 2, 'mouth': 'flat'},
    {'iris': (196, 150, 50), 'shape': 'round', 'brow': 1, 'mouth': 'open'},
    {'iris': (70, 80, 110), 'shape': 'calm', 'brow': 0, 'mouth': 'smile'}
]


def paint_faces():
    w, h = 256, 128
    px = np.zeros((h, w, 4), dtype=np.float32)
    cells = []
    for i, f in enumerate(FACES):
        cx, cy = (i % 4) * 64, (1 - i // 4) * 64
        cells.append(L.top_left((cx, cy, 64, 64), w, h))
        iris = L.rgb(f['iris'])
        for side, ex in ((-1, cx + 19), (1, cx + 45)):
            top = {'round': 41, 'narrow': 38, 'sleepy': 37, 'sharp': 39, 'calm': 39}[f['shape']]
            bot = {'round': 29, 'narrow': 33, 'sleepy': 32, 'sharp': 31, 'calm': 31}[f['shape']]
            px[cy + bot:cy + top, ex - 6:ex + 6] = (0.98, 0.98, 1.0, 1)
            px[cy + bot:cy + top - 1, ex - 4:ex + 4] = (*iris, 1)
            px[cy + bot + 2:cy + top - 3, ex - 2:ex + 2] = (0.1, 0.07, 0.14, 1)
            px[cy + top - 3:cy + top - 1, ex - 2 + side:ex + side] = (1, 1, 1, 1)
            px[cy + top - 1:cy + top + 1, ex - 7:ex + 7] = (0.18, 0.12, 0.14, 1)
            if f['shape'] == 'sharp':
                px[cy + top - 2:cy + top, ex + 3 * side:ex + 7 * side if side > 0 else ex + 3 * side + 1] = (0.18, 0.12, 0.14, 1)
            by = cy + top + 4 + f['brow']
            px[by:by + 2, ex - 7:ex + 6] = (0.25, 0.17, 0.18, 0.9)
        mx = cx + 32
        mouth = {'smile': [(26, -6, 6)], 'flat': [(25, -5, 5)], 'small': [(25, -3, 3)], 'open': [(24, -4, 4), (23, -3, 3)]}[f['mouth']]
        for my, a, b in mouth:
            px[cy + my - 1:cy + my + 1, mx + a:mx + b] = (0.62, 0.32, 0.36, 1)
        if f['mouth'] == 'smile':
            px[cy + 26:cy + 28, mx - 7:mx - 5] = (0.62, 0.32, 0.36, 1)
            px[cy + 26:cy + 28, mx + 5:mx + 7] = (0.62, 0.32, 0.36, 1)
        px[cy + 20:cy + 23, cx + 10:cx + 16] = (0.95, 0.55, 0.55, 0.35)
        px[cy + 20:cy + 23, cx + 48:cx + 54] = (0.95, 0.55, 0.55, 0.35)
    return L.new_image('hero_faces', w, px, height=h), cells


def body_mesh(name, sex, outfit):
    b = L.Builder(REGIONS, ATLAS, BONE_NAMES)
    male = sex == 'm'
    sh = 1.12 if male else 1.0
    b.tube((0, 0, 0.88), (0, 0, 1.04), 0.16 if not male else 0.145, 0.14, 'root', 'pants', squash=0.75)
    b.tube((0, 0, 1.04), (0, 0, 1.24), 0.13 if not male else 0.145, 0.15 * sh, 'spine', 'coat', squash=0.72, blend='root')
    b.tube((0, 0, 1.24), (0, 0, 1.45), 0.16 * sh, 0.17 * sh, 'chest', 'coat', squash=0.7, blend='spine')
    if not male:
        for s in (1, -1):
            b.sphere((0.06 * s, 0.07, 1.33), 0.055, (1.0, 0.75, 0.8), 'chest', 'plain', segs=8, rings=5)
    b.box((0, 0.112, 1.425), (0.07, 0.012, 0.035), 'chest', 'inner')
    b.tube((0, 0, 1.0), (0, 0, 1.06), 0.165 if not male else 0.15, 0.16 if not male else 0.15, 'root', 'belt', sides=10)
    if outfit == 'coat':
        b.tube((0, 0, 1.02), (0, 0, 0.5), 0.17 if not male else 0.16, 0.24, 'root', 'coat', sides=12, squash=0.8, cap=False)
        b.box((0, 0.1, 1.37), (0.085, 0.012, 0.13), 'chest', 'inner')
        for s in (1, -1):
            b.box((0.045 * s, 0.108, 1.38), (0.03, 0.01, 0.12), 'chest', 'coat', rot=(0, 0, 0.35 * s))
    elif outfit == 'human':
        b.tube((0, 0, 0.8), (0, 0, 1.0), 0.21, 0.165, 'root', 'coat', squash=0.8, cap=False)
        for s, sfx in ((1, 'L'), (-1, 'R')):
            b.box((0.2 * s * sh, 0, 1.435), (0.09 * sh, 0.11, 0.03), 'chest', 'gold')
            b.box((0.07 * s, 0.1, 1.35), (0.06, 0.02, 0.16), 'chest', 'gold', rot=(0, 0.25 * s, 0))
    else:
        b.tube((0, 0, 0.94), (0, 0, 1.02), 0.175, 0.16, 'root', 'coat', squash=0.78, cap=False)
        b.tube((0, 0, 1.4), (0, 0, 1.5), 0.13, 0.09, 'chest', 'scarf', sides=10, squash=0.85, bone1='neck')
        b.box((0.02, 0.1, 1.3), (0.06, 0.03, 0.18), 'chest', 'scarf', rot=(0.2, 0, 0.15))
        for s, sfx in ((1, 'L'), (-1, 'R')):
            b.box((0.2 * s * sh, 0, 1.43), (0.09 * sh, 0.11, 0.035), 'chest', 'accent')
    b.tube((0, 0, 1.43), (0, 0, 1.55), 0.052, 0.05, 'neck', 'skin', sides=8)
    b.tube((0, 0, 1.4), (0, 0, 1.47), 0.085, 0.07, 'chest', 'inner' if outfit == 'fox' else 'coat', sides=10, cap=False)
    b.sphere((0, 0.012, 1.64), 0.11, (1.0 if not male else 1.04, 1.04, 1.12), 'head', 'skin', face_region='face', segs=12, rings=8)
    b.box((0, 0.112, 1.618), (0.012, 0.014, 0.026), 'head', 'skin', rot=(0.35, 0, 0))
    for s in (1, -1):
        b.sphere((0.108 * s, 0.0, 1.63), 0.022, (0.5, 1.0, 1.3), 'head', 'skin', segs=6, rings=4)
    for s, sfx in ((1, 'L'), (-1, 'R')):
        ua, ub = (0.19 * s * sh, 0, 1.42), (0.23 * s * sh, 0, 1.14)
        b.tube(ua, ub, 0.058 * sh, 0.048, 'upperarm.' + sfx, 'coat', sides=10)
        b.tube(ub, (0.26 * s, 0, 0.93), 0.047, 0.038, 'forearm.' + sfx, 'coat', sides=10, blend='upperarm.' + sfx)
        b.tube((0.255 * s, 0, 0.96), (0.26 * s, 0, 0.92), 0.05, 0.05, 'forearm.' + sfx, 'coat' if outfit == 'coat' else 'gold', sides=10, cap=False)
        b.box((0.266 * s, 0.005, 0.855), (0.045, 0.075, 0.1), 'hand.' + sfx, 'gloves')
        b.box((0.255 * s, 0.045, 0.88), (0.025, 0.03, 0.05), 'hand.' + sfx, 'gloves', rot=(0.4, 0, 0))
        hip = 0.1 if not male else 0.095
        b.tube((hip * s, 0, 0.94), (0.11 * s, 0, 0.5), 0.08 if not male else 0.075, 0.058, 'thigh.' + sfx, 'pants', sides=10)
        b.tube((0.11 * s, 0, 0.5), (0.11 * s, 0, 0.12), 0.06, 0.047, 'shin.' + sfx, 'pants' if outfit == 'coat' else 'boots', sides=10, blend='thigh.' + sfx)
        if outfit != 'coat':
            b.tube((0.11 * s, 0, 0.36), (0.11 * s, 0, 0.42), 0.064, 0.066, 'shin.' + sfx, 'gold' if outfit == 'human' else 'boots', sides=10, cap=False)
        b.box((0.11 * s, 0.05, 0.045), (0.095, 0.23, 0.09), 'foot.' + sfx, 'boots')
        b.box((0.11 * s, 0.05, 0.004), (0.1, 0.24, 0.012), 'foot.' + sfx, 'sole')
    return b.finish(name, BONE_NAMES)


def paint_hair(rng):
    size = 128
    px = L.canvas(size, fill=0.9)
    for i in range(size):
        px[:, i, :3] *= 0.86 + 0.14 * (0.5 + 0.5 * math.sin(i * 0.9))
    px[..., :3] = np.clip(px[..., :3] + L.noise(rng, size, size, 0.05)[..., None], 0, 1)
    px[96:128, 0:64, :3] = 1.0
    px[96:128, 64:128, :3] = (1.0, 0.86, 0.86)
    return L.new_image('hero_hair', size, px)


HAIR_REGIONS = {'hair': (0, 0, 128, 96), 'light': (0, 96, 64, 32), 'inner': (64, 96, 64, 32)}


def cap(b, scale=(1.05, 1.1, 1.13), cut=-0.015, segs=12):
    b.sphere((0, -0.012, 1.655), 0.122, scale, 'head', 'hair', segs=segs, rings=8, cut=cut)


def hair_mesh(i):
    b = L.Builder(HAIR_REGIONS, 128, BONE_NAMES)
    if i == 0:
        cap(b, cut=0.0)
        b.box((0, 0.105, 1.73), (0.18, 0.04, 0.05), 'head', 'hair', rot=(0.35, 0, 0))
    elif i == 1:
        cap(b)
        for s in (1, -1):
            b.tube((0.1 * s, 0.0, 1.7), (0.11 * s, 0.02, 1.52), 0.05, 0.035, 'head', 'hair', sides=8, squash=0.7)
        b.tube((0, -0.06, 1.7), (0, -0.07, 1.52), 0.11, 0.09, 'head', 'hair', sides=10, squash=0.6)
        b.box((0, 0.11, 1.72), (0.2, 0.04, 0.06), 'head', 'hair', rot=(0.3, 0, 0))
    elif i == 2:
        cap(b)
        b.sphere((0, -0.13, 1.7), 0.04, (1, 1, 1), 'head', 'hair', segs=8, rings=5)
        b.tube((0, -0.15, 1.69), (0, -0.2, 1.35), 0.045, 0.02, 'head', 'hair', sides=8)
        b.box((0, 0.105, 1.73), (0.19, 0.04, 0.05), 'head', 'hair', rot=(0.35, 0, 0))
    elif i == 3:
        cap(b)
        b.tube((0, -0.08, 1.68), (0, -0.1, 1.2), 0.12, 0.1, 'head', 'hair', sides=10, squash=0.45)
        for s in (1, -1):
            b.tube((0.105 * s, 0.03, 1.68), (0.12 * s, 0.04, 1.42), 0.035, 0.025, 'head', 'hair', sides=6)
        b.box((0, 0.11, 1.72), (0.2, 0.04, 0.06), 'head', 'hair', rot=(0.3, 0, 0))
    elif i == 4:
        cap(b)
        for s in (1, -1):
            b.sphere((0.12 * s, -0.04, 1.72), 0.035, (1, 1, 1), 'head', 'hair', segs=6, rings=4)
            b.tube((0.14 * s, -0.05, 1.71), (0.17 * s, -0.08, 1.38), 0.04, 0.018, 'head', 'hair', sides=8)
        b.box((0, 0.105, 1.73), (0.19, 0.04, 0.05), 'head', 'hair', rot=(0.35, 0, 0))
    elif i == 5:
        cap(b)
        b.sphere((0, -0.09, 1.78), 0.06, (1, 1, 0.9), 'head', 'hair', segs=10, rings=6)
        b.box((0, 0.105, 1.73), (0.19, 0.04, 0.05), 'head', 'hair', rot=(0.35, 0, 0))
    elif i == 6:
        cap(b, cut=0.0)
        for k, (x, y, z) in enumerate([(0, 0.06, 1.79), (0.07, 0.0, 1.79), (-0.07, 0.0, 1.79), (0, -0.07, 1.77), (0.06, 0.07, 1.75), (-0.06, 0.07, 1.75)]):
            b.cone((x * 0.6, y * 0.6, z - 0.05), (x * 1.8, y * 1.8 + 0.02, z + 0.07), 0.035, 'head', 'hair', sides=5)
    else:
        cap(b)
        b.box((0.05, 0.11, 1.7), (0.17, 0.04, 0.1), 'head', 'hair', rot=(0.3, 0, -0.35))
        b.tube((0, -0.09, 1.68), (0, -0.11, 1.5), 0.09, 0.06, 'head', 'hair', sides=8, squash=0.6)
    return b.finish('part_hair%d' % i, BONE_NAMES)


def ears_mesh(i):
    b = L.Builder(HAIR_REGIONS, 128, BONE_NAMES)
    for s in (1, -1):
        base = (0.07 * s, -0.01, 1.74)
        if i == 0:
            b.tube(base, (0.1 * s, -0.01, 1.92), 0.045, 0.0, 'head', 'hair', sides=6, squash=0.45)
            b.tube((0.07 * s, 0.006, 1.75), (0.095 * s, 0.006, 1.88), 0.028, 0.0, 'head', 'inner', sides=5, squash=0.3)
        elif i == 1:
            b.tube(base, (0.11 * s, -0.01, 1.86), 0.05, 0.025, 'head', 'hair', sides=8, squash=0.5)
            b.sphere((0.11 * s, -0.01, 1.86), 0.026, (1, 0.5, 1), 'head', 'hair', segs=6, rings=4)
        else:
            b.tube(base, (0.1 * s, -0.01, 1.86), 0.045, 0.03, 'head', 'hair', sides=6, squash=0.45)
            b.tube((0.1 * s, -0.01, 1.86), (0.13 * s, 0.04, 1.83), 0.03, 0.0, 'head', 'hair', sides=6, squash=0.45)
    return b.finish('part_ears%d' % i, BONE_NAMES)


TAIL_BONES = [('root', 'tail.1', 0.5), 'tail.1', ('tail.1', 'tail.2', 0.5), 'tail.2', ('tail.2', 'tail.3', 0.5), 'tail.3']


def tail_mesh(i):
    b = L.Builder(HAIR_REGIONS, 128, BONE_NAMES)
    pts = [(0, -0.1, 0.95), (0, -0.22, 0.89), (0, -0.33, 0.85), (0, -0.45, 0.83), (0, -0.56, 0.84), (0, -0.66, 0.89)]
    radii = {0: [0.03, 0.07, 0.09, 0.09, 0.07, 0.0], 1: [0.025, 0.035, 0.04, 0.04, 0.035, 0.0], 2: [0.03, 0.045, 0.06, 0.08, 0.1, 0.0]}[i]
    b.chain(pts, radii, TAIL_BONES, 'hair', sides=8)
    if i != 1:
        b.cone((0, -0.6, 0.875), (0, -0.7, 0.9), radii[4] * 0.8, 'tail.3', 'light', sides=8)
    return b.finish('part_tail%d' % i, BONE_NAMES)


WEAPON_REGIONS = {'wood': (0, 0, 32, 64), 'metal': (32, 0, 32, 64), 'gold': (64, 0, 32, 32), 'gem': (64, 32, 32, 32), 'leather': (96, 0, 32, 32), 'paper': (96, 32, 32, 32), 'cloth': (0, 64, 64, 64), 'glow': (64, 64, 64, 64)}
WEAPON_COLORS = {'wood': (150, 100, 60), 'metal': (200, 206, 220), 'gold': (226, 190, 96), 'gem': (140, 90, 220), 'leather': (90, 50, 40), 'paper': (236, 226, 200), 'cloth': (60, 120, 90), 'glow': (150, 230, 255)}


def paint_weapons(rng):
    px = L.canvas(128)
    for region, rect in WEAPON_REGIONS.items():
        L.fill_region(px, rng, rect, WEAPON_COLORS[region])
    x, y, w, h = WEAPON_REGIONS['paper']
    for k in range(4, h, 5):
        px[y + k, x + 4:x + w - 4, :3] *= 0.8
    return L.new_image('hero_weapons', 128, px)


def weapon_mesh(path, tier):
    b = L.Builder(WEAPON_REGIONS, 128, BONE_NAMES)
    hr, gx, gy, gz = 'hand.R', -0.27, 0.03, 0.84
    if path == 'destruction':
        d = (0, 0.42, -0.9)
        def along(t):
            return (gx + d[0] * t, gy + d[1] * t, gz + d[2] * t)
        if tier == 1:
            b.tube(along(-0.08), along(0.15), 0.018, 0.02, hr, 'leather', sides=6)
            b.tube(along(0.15), along(0.72), 0.022, 0.045, hr, 'wood', sides=8)
        elif tier == 2:
            b.tube(along(-0.1), along(0.06), 0.017, 0.017, hr, 'leather', sides=6)
            b.box(along(0.08), (0.16, 0.03, 0.03), hr, 'gold', rot=(0.44, 0, 0))
            b.box(along(0.48), (0.06, 0.012, 0.8), hr, 'metal', rot=(0.44, 0, 0))
        else:
            b.tube(along(-0.25), along(0.25), 0.02, 0.02, hr, 'leather', sides=6)
            b.box(along(0.3), (0.2, 0.04, 0.05), hr, 'gold', rot=(0.44, 0, 0))
            b.box(along(0.75), (0.12, 0.018, 0.9), hr, 'metal', rot=(0.44, 0, 0))
            b.box(along(0.75), (0.02, 0.022, 0.8), hr, 'gem', rot=(0.44, 0, 0))
    elif path == 'abundance':
        top = 1.5 if tier > 1 else 1.18
        b.tube((gx, gy, 0.5 if tier > 1 else 0.74), (gx, gy, top), 0.017, 0.017, hr, 'wood' if tier < 3 else 'gold', sides=6)
        if tier == 1:
            for k in range(5):
                a = k * 2 * math.pi / 5
                b.box((gx + 0.04 * math.cos(a), gy + 0.04 * math.sin(a), top + 0.02), (0.05, 0.02, 0.03), hr, 'cloth', rot=(0, 0, a))
            b.sphere((gx, gy, top + 0.03), 0.025, (1, 1, 1), hr, 'gold', segs=6, rings=4)
        elif tier == 2:
            b.tube((gx, gy, top), (gx, gy, top + 0.12), 0.05, 0.02, hr, 'cloth', sides=8)
            b.sphere((gx, gy, top + 0.14), 0.035, (1, 1, 1), hr, 'glow', segs=8, rings=5)
        else:
            b.tube((gx, gy, top), (gx, gy, top + 0.05), 0.03, 0.06, hr, 'gold', sides=8)
            b.tube((gx, gy, top + 0.05), (gx, gy, top + 0.17), 0.06, 0.06, hr, 'glow', sides=8)
            b.tube((gx, gy, top + 0.17), (gx, gy, top + 0.22), 0.06, 0.02, hr, 'gold', sides=8)
    else:
        lh = 'hand.L'
        if tier == 1:
            b.box((0.3, 0.02, 0.8), (0.04, 0.16, 0.2), lh, 'leather')
            b.box((0.3, 0.02, 0.8), (0.036, 0.15, 0.19), lh, 'paper')
        elif tier == 2:
            b.sphere((0.31, 0.12, 0.9), 0.06, (1, 1, 1), lh, 'gem', segs=10, rings=6)
            b.tube((0.31, 0.12, 0.83), (0.31, 0.12, 0.85), 0.04, 0.03, lh, 'gold', sides=8)
        else:
            b.sphere((0.31, 0.1, 0.9), 0.05, (1, 1, 1), lh, 'glow', segs=10, rings=6)
            for k in range(8):
                a = k * 2 * math.pi / 8
                b.box((0.31 + 0.11 * math.cos(a), 0.1, 0.9 + 0.11 * math.sin(a)), (0.03, 0.012, 0.06), lh, 'gold', rot=(0, -a, 0))
    return b.finish('part_w_%s%d' % (path[0], tier), BONE_NAMES)


CLIPS = {'idle': (30, True), 'run': (12, True), 'attack': (10, False), 'cast': (15, True), 'death': (16, False)}


def pose(name, t):
    s = math.sin(t * 2 * math.pi)
    tail = {'tail.1': (0.12 * s, 0, 0.18 * math.sin(t * 2 * math.pi + 0.4)), 'tail.2': (0.1 * s, 0, 0.22 * math.sin(t * 2 * math.pi + 1.0)), 'tail.3': (0.1 * s, 0, 0.26 * math.sin(t * 2 * math.pi + 1.6))}
    if name == 'idle':
        return dict({'chest': (0.03 * s, 0, 0), 'upperarm.L': (0, 0.08, 0), 'upperarm.R': (0, -0.08, 0), 'head': (0.02 * math.sin(t * 2 * math.pi + 1), 0, 0)}, **tail)
    if name == 'run':
        p = {
            'thigh.L': (0.7 * s, 0, 0), 'thigh.R': (-0.7 * s, 0, 0),
            'shin.L': (-0.6 * max(0, -math.sin(t * 2 * math.pi + 0.6)) - 0.15, 0, 0), 'shin.R': (-0.6 * max(0, math.sin(t * 2 * math.pi + 0.6)) - 0.15, 0, 0),
            'upperarm.L': (-0.55 * s, 0.12, 0), 'upperarm.R': (0.55 * s, -0.12, 0),
            'forearm.L': (0.7, 0, 0), 'forearm.R': (0.7, 0, 0), 'spine': (0.12, 0, 0), 'root': (0, 0, 0.08 * s),
            'tail.1': (-0.25, 0, 0.3 * s), 'tail.2': (-0.1, 0, 0.3 * math.sin(t * 2 * math.pi + 0.8)), 'tail.3': (0.1, 0, 0.3 * math.sin(t * 2 * math.pi + 1.6))
        }
        return p
    if name == 'attack':
        return dict({
            'upperarm.R': (2.2 * math.sin(min(1, t * 1.6) * math.pi) * (1 if t < 0.32 else 0.7), -0.2, 0),
            'forearm.R': (0.6 + 0.6 * math.sin(t * math.pi), 0, 0), 'chest': (0, 0, -0.35 * math.sin(t * math.pi)), 'spine': (0.1 * math.sin(t * math.pi), 0, 0)
        }, **tail)
    if name == 'cast':
        return dict({
            'upperarm.L': (1.3 + 0.08 * math.sin(t * 4 * math.pi), 0.25, 0), 'upperarm.R': (1.3 + 0.08 * math.sin(t * 4 * math.pi + 1), -0.25, 0),
            'forearm.L': (0.3, 0, 0), 'forearm.R': (0.3, 0, 0), 'chest': (-0.08, 0, 0)
        }, **tail)
    k = min(1, t * 2)
    return {
        'root': (min(1, t * 1.4) * 1.5, 0, 0), 'spine': (0.15 * k, 0, 0), 'head': (0.25 * min(1, t * 1.5), 0, 0),
        'upperarm.L': (0.6 * k, 0.5, 0), 'upperarm.R': (0.6 * k, -0.5, 0),
        'thigh.L': (-0.4 * k, 0, 0), 'thigh.R': (-0.25 * k, 0, 0), 'shin.L': (-0.3 * k, 0, 0), 'tail.1': (-0.6 * k, 0, 0)
    }


def root_move(name, t):
    return (0, -0.8 * min(1, t * 1.4), 0) if name == 'death' else (0, 0, 0)


BODIES = [('hero_human_f', 'f', 'human'), ('hero_human_m', 'm', 'human'), ('hero_fox_f', 'f', 'fox'), ('hero_fox_m', 'm', 'fox')]


def build(out_dir, rng):
    L.reset()
    rig = L.build_rig('hero_rig', BONES)
    clips = L.animate(rig, 'hero', {n: (lambda n: lambda t: pose(n, t))(n) for n in CLIPS}, CLIPS, root_move)
    faces_img, face_cells = paint_faces()
    faces_tex = L.EXPORT.save_texture(faces_img, out_dir, 'hero_faces')
    metas = []
    for mid, sex, outfit in BODIES:
        img = paint_body(rng, outfit, mid)
        ob = L.bind(body_mesh(mid, sex, outfit), rig)
        look = {'look': {'skin': [L.top_left(REGIONS['skin'], ATLAS), L.top_left(REGIONS['face'], ATLAS)], 'face': L.top_left(REGIONS['face'], ATLAS), 'faces': faces_tex, 'cells': face_cells}}
        metas.append(L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, clips=clips, fps=L.FPS, extra=look))
        ob.hide_set(True)
    hair = paint_hair(rng)
    weapons = paint_weapons(rng)
    parts = [(hair_mesh(i), hair, 'hero_hair') for i in range(8)]
    parts += [(ears_mesh(i), hair, 'hero_hair') for i in range(3)]
    parts += [(tail_mesh(i), hair, 'hero_hair') for i in range(3)]
    parts += [(weapon_mesh(p, t), weapons, 'hero_weapons') for p in ('destruction', 'abundance', 'erudition') for t in (1, 2, 3)]
    for ob, img, tex in parts:
        L.bind(ob, rig)
        metas.append(L.EXPORT.export_model(ob.name, ob, out_dir, image=img, rig=rig, tex_name=tex, kind='part'))
    return metas
