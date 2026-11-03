import argparse
import json
import math
import os
import re
import sys

import numpy as np
from PIL import Image

PAGE = 2048
LEVELS = 4
SHELF_SLACK = 1.3
CLAY_LINEAR = 0.8


def linear_to_srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


CLAY_SRGB = float(linear_to_srgb(np.array(CLAY_LINEAR)))


def convert(path):
    z = np.load(path)
    color, data = z['color'], z['data']
    mask = data[:, :, 3] >= 0.5
    alpha = np.maximum(color[:, :, 3], 1e-4)[:, :, None]
    rgb = np.clip(color[:, :, :3] / alpha, 0, 1)
    rgb = linear_to_srgb(rgb)
    shade = linear_to_srgb(z['clay'] / np.maximum(z['color'][:, :, 3], 1e-4)) / CLAY_SRGB
    u = (data[:, :, 0] / np.maximum(data[:, :, 3], 1e-4)) % 1.0
    v = (data[:, :, 1] / np.maximum(data[:, :, 3], 1e-4)) % 1.0
    ch = np.clip(np.round(data[:, :, 2] / np.maximum(data[:, :, 3], 1e-4)) - 1, 0, 3)
    depth = z['depth'] / np.maximum(data[:, :, 3], 1e-4)
    ox, oy, w, h = (int(i) for i in z['rect'])
    sox, soy, sw, sh = (int(i) for i in z['shadow_rect'])
    return {
        'rgb': rgb, 'mask': mask, 'shade': shade, 'u': u, 'v': v, 'ch': ch, 'depth': depth,
        'ox': ox, 'oy': oy, 'w': w, 'h': h,
        'shadow': np.clip(z['shadow'], 0, 1), 'sox': sox, 'soy': soy, 'sw': sw, 'sh': sh
    }


def encode(s, d_min, d_max):
    h, w = s['mask'].shape
    color = np.zeros((h, w, 4), dtype=np.uint8)
    data = np.zeros((h, w, 4), dtype=np.uint8)
    m = s['mask']
    color[m, 0:3] = np.round(s['rgb'][m] * 255)
    color[m, 3] = 255
    data[m, 0] = np.floor(s['u'][m] * 256).clip(0, 255)
    data[m, 1] = np.floor(s['v'][m] * 256).clip(0, 255)
    shade = np.round(s['shade'][m] * 40).clip(0, 63).astype(np.uint8)
    data[m, 2] = (shade << 2) | s['ch'][m].astype(np.uint8)
    data[m, 3] = np.round((s['depth'][m] - d_min) / max(d_max - d_min, 1e-6) * 255).clip(0, 255)
    return color, data


def reduce_sprite(s, f):
    ox, oy = s['ox'], s['oy']
    nx = math.floor(ox / f)
    ny = math.floor(oy / f)
    px = ox - nx * f
    py = oy - ny * f
    h, w = s['mask'].shape
    nw = math.ceil((px + w) / f)
    nh = math.ceil((py + h) / f)
    out = {
        'rgb': np.zeros((nh, nw, 3), np.float32), 'mask': np.zeros((nh, nw), bool), 'shade': np.zeros((nh, nw), np.float32),
        'u': np.zeros((nh, nw), np.float32), 'v': np.zeros((nh, nw), np.float32), 'ch': np.zeros((nh, nw), np.float32),
        'depth': np.zeros((nh, nw), np.float32), 'ox': nx, 'oy': ny, 'w': nw, 'h': nh
    }
    for j in range(nh):
        y0, y1 = max(0, j * f - py), min(h, (j + 1) * f - py)
        if y1 <= y0:
            continue
        for i in range(nw):
            x0, x1 = max(0, i * f - px), min(w, (i + 1) * f - px)
            if x1 <= x0:
                continue
            block = s['mask'][y0:y1, x0:x1]
            count = int(block.sum())
            if count * 2 < f * f:
                continue
            ys, xs = np.nonzero(block)
            ys = ys + y0
            xs = xs + x0
            near = int(np.argmin(s['depth'][ys, xs]))
            out['mask'][j, i] = True
            out['rgb'][j, i] = s['rgb'][ys, xs].mean(axis=0)
            out['shade'][j, i] = s['shade'][ys, xs].mean()
            out['u'][j, i] = s['u'][ys[near], xs[near]]
            out['v'][j, i] = s['v'][ys[near], xs[near]]
            out['ch'][j, i] = s['ch'][ys[near], xs[near]]
            out['depth'][j, i] = s['depth'][ys[near], xs[near]]
    return out


def reduce_shadow(a, ox, oy, f):
    nx = math.floor(ox / f)
    ny = math.floor(oy / f)
    px = ox - nx * f
    py = oy - ny * f
    h, w = a.shape
    nw = math.ceil((px + w) / f)
    nh = math.ceil((py + h) / f)
    pad = np.zeros((nh * f, nw * f), np.float32)
    pad[py:py + h, px:px + w] = a
    return pad.reshape(nh, f, nw, f).mean(axis=(1, 3)), nx, ny


class Shelves:
    def __init__(self):
        self.pages = []

    def place(self, w, h):
        for index, shelves in enumerate(self.pages):
            for s in shelves:
                if h <= s['h'] and s['h'] <= h * SHELF_SLACK + 2 and s['x'] + w <= PAGE:
                    spot = (index, s['x'], s['y'])
                    s['x'] += w
                    return spot
            bottom = shelves[-1]['y'] + shelves[-1]['h'] if shelves else 0
            if bottom + h <= PAGE:
                shelves.append({'y': bottom, 'h': h, 'x': w})
                return index, 0, bottom
        self.pages.append([{'y': 0, 'h': h, 'x': w}])
        return len(self.pages) - 1, 0, 0


def save_png(array, path):
    mode = 'L' if array.ndim == 2 else 'RGBA'
    Image.fromarray(array, mode).save(path, optimize=True, compress_level=9)


def cmd_build(args):
    os.makedirs(args.out, exist_ok=True)
    for old in os.listdir(args.out):
        if old.endswith('.png'):
            os.remove(os.path.join(args.out, old))
    names = {}
    for file in sorted(os.listdir(args.bake)):
        m = re.fullmatch(r'(\w+)-(\d)\.npz', file)
        if m:
            names.setdefault(m.group(1), {})[int(m.group(2))] = os.path.join(args.bake, file)
    packed = []
    shadows = []
    index = {}
    live_area = 0
    for name, turns in names.items():
        entry = {'near': {}, 'half': {}, 'levels': {}, 'shadow': {}}
        index[name] = entry
        for turn, path in sorted(turns.items()):
            s = convert(path)
            d_min = float(s['depth'][s['mask']].min())
            d_max = float(s['depth'][s['mask']].max())
            color, data = encode(s, d_min, d_max)
            save_png(color, os.path.join(args.out, f'{name}-{turn}.color.png'))
            save_png(data, os.path.join(args.out, f'{name}-{turn}.data.png'))
            entry['near'][turn] = [s['ox'], s['oy'], s['w'], s['h'], round(d_min, 5), round(d_max - d_min, 5)]
            live_area += s['w'] * s['h']
            for level in range(1, LEVELS + 1):
                r = reduce_sprite(s, 2 ** level)
                c, d = encode(r, d_min, d_max)
                if level == 1:
                    save_png(c, os.path.join(args.out, f'{name}-{turn}.half.color.png'))
                    save_png(d, os.path.join(args.out, f'{name}-{turn}.half.data.png'))
                    entry['half'][turn] = [int(r['ox']), int(r['oy']), int(r['w']), int(r['h'])]
                    live_area += int(r['w']) * int(r['h'])
                else:
                    packed.append((name, turn, level, r['ox'], r['oy'], c, d))
                f = 2 ** (level - 1)
                a, ax, ay = reduce_shadow(s['shadow'], s['sox'], s['soy'], f)
                shadows.append((name, turn, level, ax, ay, np.round(a * 255).astype(np.uint8)))
            print('sprite', name, turn, s['w'], s['h'], flush=True)
    packed.sort(key=lambda p: -p[5].shape[0])
    shelves = Shelves()
    pages_color = []
    pages_data = []
    for name, turn, level, ox, oy, c, d in packed:
        h, w = c.shape[:2]
        page, x, y = shelves.place(w, h)
        while len(pages_color) <= page:
            pages_color.append(np.zeros((PAGE, PAGE, 4), np.uint8))
            pages_data.append(np.zeros((PAGE, PAGE, 4), np.uint8))
        pages_color[page][y:y + h, x:x + w] = c
        pages_data[page][y:y + h, x:x + w] = d
        index[name]['levels'].setdefault(turn, {})[level] = [page, x, y, w, h, int(ox), int(oy)]
    shadows.sort(key=lambda p: -p[5].shape[0])
    shelves = Shelves()
    pages_shadow = []
    for name, turn, level, ox, oy, a in shadows:
        h, w = a.shape
        page, x, y = shelves.place(w, h)
        while len(pages_shadow) <= page:
            pages_shadow.append(np.zeros((PAGE, PAGE), np.uint8))
        pages_shadow[page][y:y + h, x:x + w] = a
        index[name]['shadow'].setdefault(turn, {})[level] = [page, x, y, w, h, int(ox), int(oy)]
    for i, (c, d) in enumerate(zip(pages_color, pages_data)):
        save_png(c, os.path.join(args.out, f'pack-{i}.color.png'))
        save_png(d, os.path.join(args.out, f'pack-{i}.data.png'))
    for i, a in enumerate(pages_shadow):
        save_png(a, os.path.join(args.out, f'shadow-{i}.png'))
    root = os.path.relpath(args.out, args.root).replace(os.sep, '/') + '/'
    size_of = lambda name: os.path.getsize(os.path.join(args.out, name))
    pack_bytes = sum(size_of(f'pack-{i}.{part}.png') for i in range(len(pages_color)) for part in ('color', 'data'))
    pack_bytes += sum(size_of(f'shadow-{i}.png') for i in range(len(pages_shadow)))
    doc = {'root': root, 'page': PAGE, 'pages': len(pages_color), 'shadowPages': len(pages_shadow), 'packBytes': pack_bytes, 'liveArea': live_area, 'kinds': {}}
    for name, e in index.items():
        doc['kinds'][name] = {
            'bytes': sum(size_of(f'{name}-{t}.{part}.png') for t in e['near'] for part in ('color', 'data', 'half.color', 'half.data')),
            'near': [e['near'][t] for t in sorted(e['near'])],
            'half': [e['half'][t] for t in sorted(e['half'])],
            'levels': [[e['levels'][t][lv] for lv in range(2, LEVELS + 1)] for t in sorted(e['levels'])],
            'shadow': [[e['shadow'][t][lv] for lv in range(1, LEVELS + 1)] for t in sorted(e['shadow'])]
        }
    text = "(function (S) {\n  'use strict';\n  S.SPRITE_INDEX = " + json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + ";\n})(globalThis.Sims98 = globalThis.Sims98 || {});\n"
    with open(args.index, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    total = sum(os.path.getsize(os.path.join(args.out, x)) for x in os.listdir(args.out))
    print('pages', len(pages_color), 'shadow pages', len(pages_shadow), 'bytes', total, 'live area', live_area)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--bake', default='src/sims98/bake')
    p.add_argument('--out', default='content/sims98/sprites/sample')
    p.add_argument('--index', default='js/apps/sims98/ts-sprite-index.js')
    p.add_argument('--root', default='.')
    cmd_build(p.parse_args())


main()
