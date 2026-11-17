import argparse
import importlib.util
import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


EXPORT = load('hsro_export', 'hsro-export.py')
HEROES = load('hsro_heroes', 'hsro-heroes.py')
FOES = load('hsro_foes', 'hsro-foes.py')
STATION = load('hsro_station', 'hsro-station.py')
NPCS = load('hsro_npcs', 'hsro-npcs.py')
SWARM = load('hsro_swarm', 'hsro-swarm.py')
FX = load('hsro_fx', 'hsro-fx.py')
reset = HEROES.L.reset
new_image = HEROES.L.new_image
noise = HEROES.L.noise

FPS = 15
ATLAS = 256

KIT_REGIONS = {
    'panel': (0, 128, 128, 128),
    'trim': (128, 224, 128, 32),
    'dark': (128, 192, 128, 32),
    'space': (128, 128, 128, 64),
    'floor': (0, 0, 128, 128),
    'light': (128, 96, 128, 32),
    'base': (128, 0, 128, 96)
}


def paint_kit(rng):
    px = np.zeros((ATLAS, ATLAS, 4), dtype=np.float32)
    px[..., 3] = 1
    cols = {'panel': (226, 230, 238), 'trim': (216, 191, 114), 'dark': (70, 74, 96), 'space': (12, 16, 44), 'floor': (168, 174, 188), 'light': (150, 230, 255), 'base': (110, 116, 136)}
    for name, (x, y, w, h) in KIT_REGIONS.items():
        base = np.array(cols[name], dtype=np.float32) / 255
        grad = np.linspace(0.86, 1.04, h).reshape(h, 1, 1)
        px[y:y + h, x:x + w, :3] = np.clip(base.reshape(1, 1, 3) * grad + noise(rng, h, w, 0.03)[..., None], 0, 1)
    x, y, w, h = KIT_REGIONS['panel']
    for i in (0, 63, 64, 127):
        px[y + i:y + i + 1, x:x + w, :3] *= 0.72
        px[y:y + h, x + i:x + i + 1, :3] *= 0.72
    px[y + 8:y + 12, x + 8:x + 120, :3] = np.array(cols['trim']) / 255
    x, y, w, h = KIT_REGIONS['floor']
    for i in (0, 1, 62, 63, 64, 65, 126, 127):
        px[y + i, x:x + w, :3] *= 0.7
        px[y:y + h, x + i, :3] *= 0.7
    px[y + 30:y + 34, x + 4:x + 124, :3] = np.array((120, 200, 230)) / 255
    x, y, w, h = KIT_REGIONS['space']
    for _ in range(60):
        sx, sy = rng.integers(0, w), rng.integers(0, h)
        px[y + sy, x + sx, :3] = 1.0
    yy, xx = np.mgrid[0:h, 0:w]
    neb = np.exp(-(((xx - w * 0.7) / 30) ** 2 + ((yy - h * 0.4) / 14) ** 2))
    px[y:y + h, x:x + w, 0] += neb * 0.25
    px[y:y + h, x:x + w, 2] += neb * 0.4
    return new_image('kit_station', ATLAS, np.clip(px, 0, 1))


def kit_object(name, boxes):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('uv')
    for (x0, y0, z0, x1, y1, z1, region) in boxes:
        geom = bmesh.ops.create_cube(bm, size=1.0)
        c = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
        s = (x1 - x0, y1 - y0, z1 - z0)
        for v in geom['verts']:
            v.co = Vector((c[0] + v.co.x * s[0], c[1] + v.co.y * s[1], c[2] + v.co.z * s[2]))
        for f in {f for v in geom['verts'] for f in v.link_faces}:
            n = f.normal
            for loop in f.loops:
                p = loop.vert.co
                if abs(n.z) > 0.5:
                    u, v = (p.x - x0) / s[0], (p.y - y0) / s[1]
                elif abs(n.x) > 0.5:
                    u, v = (p.y - y0) / s[1], (p.z - z0) / s[2]
                else:
                    u, v = (p.x - x0) / s[0], (p.z - z0) / s[2]
                reg = KIT_REGIONS[region]
                loop[uv].uv = ((reg[0] + 1 + u * (reg[2] - 2)) / ATLAS, (reg[1] + 1 + v * (reg[3] - 2)) / ATLAS)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


KIT = {
    'kit_floor': [(-2, -2, -0.1, 2, 2, 0.0, 'floor')],
    'kit_wall': [
        (-2, -0.4, 0, 2, 0, 0.3, 'base'),
        (-2, -0.4, 0.3, 2, 0, 1.0, 'panel'),
        (-2, -0.4, 2.4, 2, 0, 4.0, 'panel'),
        (-2, -0.4, 1.0, -1.2, 0, 2.4, 'panel'),
        (1.2, -0.4, 1.0, 2, 0, 2.4, 'panel'),
        (-1.2, -0.3, 1.0, 1.2, -0.25, 2.4, 'space'),
        (-1.3, -0.42, 0.92, 1.3, 0.04, 1.0, 'trim'),
        (-1.3, -0.42, 2.4, 1.3, 0.04, 2.48, 'trim'),
        (-1.3, -0.42, 1.0, -1.2, 0.04, 2.4, 'trim'),
        (1.2, -0.42, 1.0, 1.3, 0.04, 2.4, 'trim'),
        (-2, -0.42, 3.6, 2, 0.06, 3.7, 'trim')
    ],
    'kit_pillar': [
        (-0.4, -0.4, 0, 0.4, 0.4, 4.0, 'panel'),
        (-0.46, -0.46, 0, 0.46, 0.46, 0.3, 'dark'),
        (-0.46, -0.46, 3.7, 0.46, 0.46, 4.0, 'trim'),
        (-0.44, -0.44, 1.8, 0.44, 0.44, 1.9, 'trim'),
        (-0.1, 0.4, 0.5, 0.1, 0.44, 3.4, 'light')
    ]
}


def build_kit(out_dir, rng):
    reset()
    img = paint_kit(rng)
    metas = []
    for mid, boxes in KIT.items():
        ob = kit_object(mid, boxes)
        metas.append(EXPORT.export_model(mid, ob, out_dir, image=img, tex_name='kit_station'))
    return metas


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(HERE, '..', 'content', 'hsro'))
    args = ap.parse_args(argv)
    out = os.path.abspath(args.out)
    rng = np.random.default_rng(98)
    random.seed(98)
    metas = HEROES.build(out, rng) + FOES.build(out, rng, HEROES) + build_kit(out, rng) + STATION.build(out, rng) + NPCS.build(out, rng, HEROES) + SWARM.build(out, rng)
    FX.build(out, rng)
    for m in metas:
        print('HSRO', m['id'], m['kind'], 'tris', m['tris'], 'verts', m['verts'], 'bones', len(m['bones']), 'clips', ','.join(m['clips']))


if __name__ == '__main__':
    main()
