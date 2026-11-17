import importlib.util
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

TAU = 2 * math.pi
CLIPS = {'idle': (30, True), 'run': (12, True)}


def extras_spec():
    return {
        'white': ('fade', (214, 218, 228), (252, 252, 255)),
        'red': ('flat', (210, 50, 60), None),
        'navy': ('fade', (24, 30, 58), (60, 72, 120)),
        'gold': ('fade', (150, 124, 60), (240, 218, 140)),
        'black': ('flat', (24, 22, 30), None),
        'yellow': ('fade', (200, 150, 30), (255, 214, 70)),
        'glass': ('fade', (150, 200, 230), (220, 240, 255)),
        'band': ('flat', (60, 60, 70), None)
    }


def extra_mesh(name, regions, bones):
    b = L.Builder(regions, 128, bones)
    if name == 'part_cap_nurse':
        b.box((0, 0.02, 1.77), (0.17, 0.12, 0.06), 'head', 'white', rot=(-0.25, 0, 0))
        b.box((0, 0.08, 1.79), (0.05, 0.012, 0.014), 'head', 'red', rot=(-0.25, 0, 0))
        b.box((0, 0.08, 1.79), (0.014, 0.012, 0.05), 'head', 'red', rot=(-0.25, 0, 0))
    elif name == 'part_cap_guard':
        b.tube((0, 0, 1.69), (0, 0, 1.79), 0.125, 0.135, 'head', 'navy', sides=12)
        b.tube((0, 0, 1.79), (0, 0, 1.81), 0.135, 0.0, 'head', 'navy', sides=12)
        b.box((0, 0.13, 1.7), (0.2, 0.09, 0.015), 'head', 'black', rot=(0.25, 0, 0))
        b.box((0, 0.13, 1.745), (0.1, 0.012, 0.03), 'head', 'gold')
    elif name == 'part_helmet_work':
        b.sphere((0, 0, 1.69), 0.135, (1, 1.05, 0.95), 'head', 'yellow', segs=12, rings=8, cut=0.0, cut_below=True)
        b.tube((0, 0.01, 1.69), (0, 0.01, 1.705), 0.17, 0.17, 'head', 'yellow', sides=12)
        b.box((0, 0, 1.82), (0.03, 0.2, 0.02), 'head', 'band')
    else:
        for s in (1, -1):
            b.box((0.045 * s, 0.128, 1.648), (0.05, 0.006, 0.034), 'head', 'glass')
            b.box((0.045 * s, 0.13, 1.666), (0.054, 0.008, 0.006), 'head', 'black')
            b.box((0.095 * s, 0.07, 1.655), (0.006, 0.11, 0.006), 'head', 'black')
        b.box((0, 0.13, 1.66), (0.04, 0.006, 0.006), 'head', 'black')
    return b.finish(name, bones)


EXTRAS = ['part_cap_nurse', 'part_cap_guard', 'part_helmet_work', 'part_glasses']

DOG_BONES = [
    ('root', None, (0, -0.2, 0.42), (0, 0.15, 0.42)),
    ('head', 'root', (0, 0.18, 0.46), (0, 0.42, 0.52)),
    ('tail', 'root', (0, -0.3, 0.5), (0, -0.38, 0.68)),
    ('leg.fl', 'root', (0.1, 0.12, 0.32), (0.1, 0.12, 0.03)),
    ('leg.fr', 'root', (-0.1, 0.12, 0.32), (-0.1, 0.12, 0.03)),
    ('leg.bl', 'root', (0.1, -0.2, 0.32), (0.1, -0.2, 0.03)),
    ('leg.br', 'root', (-0.1, -0.2, 0.32), (-0.1, -0.2, 0.03))
]


def eyes_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    for u in (0.36, 0.64):
        cx = int(u * w)
        sub[h // 2 - 2:h // 2 + 6, cx - 3:cx + 3, :3] = L.rgb(b)
        sub[h // 2 + 3:h // 2 + 5, cx - 1:cx + 1, :3] = 1.0
    sub[h // 2 - 9:h // 2 - 5, w // 2 - 4:w // 2 + 4, :3] = L.rgb((40, 30, 34))


def visor_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    sub[h // 2 - 6:h // 2 + 10, 8:w - 8, :3] = L.rgb((30, 40, 70))
    for u in (0.38, 0.62):
        cx = int(u * w)
        sub[h // 2:h // 2 + 6, cx - 4:cx + 4, :3] = L.rgb(b)


def bean_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    for u in (0.38, 0.62):
        cx = int(u * w)
        sub[h // 2 - 4:h // 2 + 6, cx - 5:cx + 5, :3] = 1.0
        sub[h // 2 - 1:h // 2 + 4, cx - 2:cx + 2, :3] = L.rgb((30, 20, 20))
    sub[h // 2 - 12:h // 2 - 10, w // 2 - 4:w // 2 + 4, :3] = L.rgb((200, 120, 110))


def dog_mesh(mid):
    names = [b[0] for b in DOG_BONES]
    spec = {
        'fur': ('fade', (222, 218, 210), (252, 250, 246)),
        'face': (eyes_style, (244, 242, 236), (30, 24, 30)),
        'nose': ('flat', (36, 28, 34), None),
        'tongue': ('flat', (230, 120, 130), None),
        'collar': ('fade', (200, 60, 70), (240, 110, 110))
    }
    img, regions = L.paint_cells(np.random.default_rng(3), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, -0.03, 0.44), 0.2, (0.9, 1.5, 0.85), 'root', 'fur', segs=12, rings=8)
    b.sphere((0, 0.22, 0.5), 0.17, (1.05, 1, 0.95), 'root', 'fur', segs=10, rings=6)
    b.sphere((0, 0.33, 0.58), 0.12, (1, 1, 0.95), 'head', 'fur', face_region='face', segs=10, rings=8)
    b.tube((0, 0.42, 0.55), (0, 0.5, 0.54), 0.055, 0.04, 'head', 'fur', sides=8)
    b.sphere((0, 0.51, 0.55), 0.022, (1, 1, 1), 'head', 'nose', segs=6, rings=4)
    b.box((0, 0.46, 0.5), (0.03, 0.04, 0.008), 'head', 'tongue', rot=(0.4, 0, 0))
    for s in (1, -1):
        b.cone((0.065 * s, 0.31, 0.66), (0.09 * s, 0.29, 0.77), 0.04, 'head', 'fur', sides=5)
    b.tube((0, 0.26, 0.46), (0, 0.3, 0.52), 0.12, 0.11, 'root', 'collar', sides=10, cap=False)
    b.chain([(0, -0.3, 0.5), (0, -0.38, 0.64), (0.02, -0.32, 0.74), (0, -0.24, 0.72)], [0.06, 0.07, 0.05, 0.0], ['tail'] * 4, 'fur', sides=8)
    for n, x, y in (('leg.fl', 0.1, 0.12), ('leg.fr', -0.1, 0.12), ('leg.bl', 0.1, -0.2), ('leg.br', -0.1, -0.2)):
        b.tube((x, y, 0.34), (x, y, 0.04), 0.05, 0.042, n, 'fur', sides=8)
        b.box((x, y + 0.02, 0.02), (0.07, 0.09, 0.04), n, 'fur')
    return img, b.finish(mid, names)


def dog_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'head': (0.06 * s, 0, 0.1 * math.sin(TAU * t + 1)), 'tail': (0, 0, 0.5 * math.sin(2 * TAU * t))}
    return {'leg.fl': (0.7 * s, 0, 0), 'leg.br': (0.7 * s, 0, 0), 'leg.fr': (-0.7 * s, 0, 0), 'leg.bl': (-0.7 * s, 0, 0), 'tail': (0, 0, 0.6 * s), 'head': (0.08 * s, 0, 0)}


def dog_move(name, t):
    return (0, 0, 0.04 * abs(math.sin(TAU * t))) if name == 'run' else (0, 0, 0)


ROBOT_BONES = [
    ('root', None, (0, 0, 0.2), (0, 0, 0.5)),
    ('head', 'root', (0, 0, 0.55), (0, 0, 0.8)),
    ('arm.L', 'root', (0.22, 0, 0.45), (0.3, 0, 0.3)),
    ('arm.R', 'root', (-0.22, 0, 0.45), (-0.3, 0, 0.3))
]


def robot_mesh(mid):
    names = [b[0] for b in ROBOT_BONES]
    spec = {
        'white': ('fade', (200, 206, 220), (248, 250, 255)),
        'visor': (visor_style, (236, 240, 248), (122, 216, 255)),
        'dark': ('fade', (40, 48, 80), (80, 90, 130)),
        'glow': ('glow', (90, 200, 240), (235, 252, 255)),
        'gold': ('fade', (150, 124, 60), (240, 218, 140))
    }
    img, regions = L.paint_cells(np.random.default_rng(4), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, 0, 0.36), 0.22, (1, 1, 0.85), 'root', 'white', segs=12, rings=8)
    b.tube((0, 0, 0.2), (0, 0, 0.12), 0.16, 0.1, 'root', 'dark', sides=10)
    b.tube((0, 0, 0.12), (0, 0, 0.08), 0.1, 0.06, 'root', 'glow', sides=10)
    b.tube((0, 0, 0.36), (0, 0, 0.4), 0.225, 0.225, 'root', 'gold', sides=12, cap=False)
    b.sphere((0, 0.01, 0.66), 0.15, (1.1, 1, 0.85), 'head', 'white', face_region='visor', segs=12, rings=8, front_y=0.2)
    b.tube((0.05, 0, 0.78), (0.07, 0, 0.9), 0.012, 0.01, 'head', 'dark', sides=5)
    b.sphere((0.07, 0, 0.91), 0.025, (1, 1, 1), 'head', 'glow', segs=6, rings=4)
    for s, side in ((1, 'L'), (-1, 'R')):
        b.tube((0.22 * s, 0, 0.45), (0.3 * s, 0, 0.3), 0.035, 0.03, 'arm.' + side, 'dark', sides=6)
        b.sphere((0.3 * s, 0, 0.28), 0.045, (1, 1, 1), 'arm.' + side, 'white', segs=6, rings=4)
    return img, b.finish(mid, names)


def robot_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'head': (0, 0, 0.25 * s), 'arm.L': (0.2 * s, 0, 0), 'arm.R': (-0.2 * s, 0, 0)}
    return {'root': (-0.25, 0, 0), 'arm.L': (-0.5, 0, 0), 'arm.R': (-0.5, 0, 0)}


def robot_move(name, t):
    return (0, 0.04 * math.sin(TAU * t), 0)


BEAN_BONES = [
    ('root', None, (0, 0, 0.0), (0, 0, 0.2)),
    ('body', 'root', (0, 0, 0.2), (0, 0, 0.45)),
    ('sprout', 'body', (0, 0, 0.5), (0, 0, 0.7))
]


def bean_mesh(mid):
    names = [b[0] for b in BEAN_BONES]
    spec = {
        'body': ('fade', (46, 32, 30), (110, 84, 76)),
        'face': (bean_style, (90, 66, 60), None),
        'leaf': ('fade', (60, 140, 60), (160, 230, 120)),
        'smoke': ('fade', (120, 110, 120), (220, 214, 224)),
        'foot': ('flat', (34, 24, 22), None)
    }
    img, regions = L.paint_cells(np.random.default_rng(6), mid, spec)
    b = L.Builder(regions, 256, names)
    b.sphere((0, 0, 0.27), 0.25, (1.1, 1, 0.9), 'body', 'body', face_region='face', segs=14, rings=10, front_y=0.3)
    for k, (x, y, z) in enumerate(((0.16, -0.08, 0.42), (-0.17, -0.06, 0.4), (0.0, -0.18, 0.44), (0.1, 0.05, 0.47))):
        b.sphere((x, y, z), 0.09, (1, 1, 0.8), 'body', 'smoke', segs=8, rings=5)
    b.tube((0, 0, 0.48), (0, 0, 0.6), 0.012, 0.01, 'sprout', 'leaf', sides=5)
    for s in (1, -1):
        b.chain([(0, 0, 0.6), (0.07 * s, 0, 0.64), (0.13 * s, 0, 0.62)], [0.012, 0.016, 0.0], ['sprout'] * 3, 'leaf', sides=5, squash=3.2)
    for s in (1, -1):
        b.sphere((0.1 * s, 0.04, 0.04), 0.05, (1, 1.3, 0.6), 'root', 'foot', segs=6, rings=4)
    return img, b.finish(mid, names)


def bean_pose(name, t):
    s = math.sin(TAU * t)
    if name == 'idle':
        return {'body': (0.05 * s, 0, 0.08 * math.sin(TAU * t + 1)), 'sprout': (0, 0, 0.4 * s)}
    return {'body': (-0.2, 0, 0.2 * s), 'sprout': (0.4, 0, 0.6 * s)}


def bean_move(name, t):
    if name == 'run':
        return (0, 0.06 * abs(math.sin(TAU * t)), 0)
    return (0, 0.015 * math.sin(TAU * t), 0)


def export_creature(out_dir, mid, bones, mesh, pose, move):
    rig = L.build_rig(mid + '_rig', bones)
    clips = L.animate(rig, mid, {n: (lambda n: lambda t: pose(n, t))(n) for n in CLIPS}, CLIPS, move)
    img, ob = mesh
    L.bind(ob, rig)
    meta = L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, clips=clips, fps=L.FPS)
    ob.hide_set(True)
    rig.hide_set(True)
    return meta


def build(out_dir, rng, heroes):
    L.reset()
    rig = L.build_rig('npc_rig', heroes.BONES)
    clips = L.animate(rig, 'npc', {n: (lambda n: lambda t: heroes.pose(n, t))(n) for n in heroes.CLIPS}, heroes.CLIPS, heroes.root_move)
    cells = heroes.paint_faces()[1]
    regions = heroes.REGIONS
    atlas = heroes.ATLAS
    body_rng = np.random.default_rng(41)
    metas = []
    for mid, sex in (('npc_coat_f', 'f'), ('npc_coat_m', 'm')):
        img = heroes.paint_body(body_rng, 'coat', mid)
        ob = L.bind(heroes.body_mesh(mid, sex, 'coat'), rig)
        look = {'look': {
            'skin': [L.top_left(regions[r], atlas) for r in ('skin', 'face', 'gloves')],
            'coat': [L.top_left(regions[r], atlas) for r in ('coat', 'plain', 'scarf')],
            'face': L.top_left(regions['face'], atlas), 'faces': 'tex/hero_faces.png', 'cells': cells
        }}
        metas.append(L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, clips=clips, fps=L.FPS, extra=look))
        ob.hide_set(True)
    img, ex_regions = L.paint_cells(np.random.default_rng(8), 'npc_extras', extras_spec(), size=128, step=32)
    for mid in EXTRAS:
        ob = L.bind(extra_mesh(mid, ex_regions, heroes.BONE_NAMES), rig)
        metas.append(L.EXPORT.export_model(mid, ob, out_dir, image=img, rig=rig, tex_name='npc_extras', kind='part'))
        ob.hide_set(True)
    rig.hide_set(True)
    metas.append(export_creature(out_dir, 'npc_peppy', DOG_BONES, dog_mesh('npc_peppy'), dog_pose, dog_move))
    metas.append(export_creature(out_dir, 'npc_robot', ROBOT_BONES, robot_mesh('npc_robot'), robot_pose, robot_move))
    metas.append(export_creature(out_dir, 'npc_creature', BEAN_BONES, bean_mesh('npc_creature'), bean_pose, bean_move))
    return metas
