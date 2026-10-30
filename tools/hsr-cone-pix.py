import argparse
import base64
import io
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'content', 'hsr98', 'cones')
MODULE = os.path.join(ROOT, 'js', 'apps', 'hsr98', 'hsr-cone-pix.js')
W, H = 160, 224
NAME = 'CONE_PIX'


def fit(img, crop):
    img = img.convert('RGB')
    if crop:
        x0, y0, x1, y1 = (float(v) for v in crop.split(','))
        img = img.crop((round(x0 * img.width), round(y0 * img.height), round(x1 * img.width), round(y1 * img.height)))
    want = W / H
    if img.width / img.height > want:
        nw = round(img.height * want)
        left = (img.width - nw) // 2
        img = img.crop((left, 0, left + nw, img.height))
    else:
        nh = round(img.width / want)
        top = (img.height - nh) // 2
        img = img.crop((0, top, img.width, top + nh))
    return img


def grid_of(img):
    import numpy as np
    from collections import Counter
    a = np.asarray(img).astype(int)
    out = []
    for axis in (1, 0):
        d = np.abs(np.diff(a, axis=axis)).sum(axis=2).sum(axis=1 - axis)
        edges = np.where(d > d.mean() * 1.5)[0] + 1
        if len(edges) < 8:
            return None
        period = Counter(np.diff(edges)).most_common(1)[0][0]
        if period < 2:
            return None
        phase = Counter(edges % period).most_common(1)[0][0]
        out.append((int(period), int(phase)))
    return out


def native(img):
    g = grid_of(img)
    if not g:
        return img
    (px, ox), (py, oy) = g
    xs = list(range(ox + px // 2 if ox else px // 2, img.width, px))
    ys = list(range(oy + py // 2 if oy else py // 2, img.height, py))
    small = Image.new('RGB', (len(xs), len(ys)))
    src, dst = img.load(), small.load()
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            dst[i, j] = src[x, y]
    return small


def trim(img):
    src = img.load()
    def same(a, b):
        return sum(abs(p - q) for p, q in zip(a, b)) < 24
    edge = src[0, 0]
    x0, y0, x1, y1 = 0, 0, img.width, img.height
    while x0 < x1 - 1 and all(same(src[x0, y], edge) for y in range(y0, y1, max(1, (y1 - y0) // 40))):
        x0 += 1
    while x1 - 1 > x0 and all(same(src[x1 - 1, y], edge) for y in range(y0, y1, max(1, (y1 - y0) // 40))):
        x1 -= 1
    while y0 < y1 - 1 and all(same(src[x, y0], edge) for x in range(x0, x1, max(1, (x1 - x0) // 40))):
        y0 += 1
    while y1 - 1 > y0 and all(same(src[x, y1 - 1], edge) for x in range(x0, x1, max(1, (x1 - x0) // 40))):
        y1 -= 1
    return img.crop((x0, y0, x1, y1))


def pixel_fit(img, colors):
    small = trim(native(img))
    if small.width >= W and small.height >= H:
        k = min(small.width / W, small.height / H)
        if k > 1.25:
            small = small.resize((round(small.width / k), round(small.height / k)), Image.NEAREST)
        left, top = (small.width - W) // 2, (small.height - H) // 2
        small = small.crop((left, top, left + W, top + H))
    else:
        small = fit(small, None).resize((W, H), Image.NEAREST)
    if len(small.getcolors(1 << 16) or []) <= max(colors, 128):
        return small
    return small.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.NONE).convert('RGB')


def pixelate(img, colors, cell):
    small = img.resize((W // cell, H // cell), Image.LANCZOS) if cell > 1 else img.resize((W, H), Image.LANCZOS)
    small = small.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    return small.resize((W, H), Image.NEAREST) if cell > 1 else small


def build_module():
    keys = sorted(f[:-4] for f in os.listdir(ART) if f.endswith('.png'))
    rows = []
    for k in keys:
        with open(os.path.join(ART, k + '.png'), 'rb') as fh:
            rows.append("    '" + k + "': 'data:image/png;base64," + base64.b64encode(fh.read()).decode('ascii') + "'")
    body = "(function (H) {\n  'use strict';\n  H." + NAME + " = {\n" + ',\n'.join(rows) + "\n  };\n  if (typeof module !== 'undefined') module.exports = H;\n})(globalThis.Hsr98 = globalThis.Hsr98 || {});\n"
    with open(MODULE, 'w', encoding='utf8', newline='\n') as fh:
        fh.write(body)
    return keys


def main():
    global ART, MODULE, W, H, NAME
    ap = argparse.ArgumentParser()
    ap.add_argument('--phone', action='store_true', help='phone wallpaper: 268x464, content/hsr98/phone, hsr-phone-pix.js')
    ap.add_argument('key', nargs='?')
    ap.add_argument('image', nargs='?')
    ap.add_argument('--colors', type=int, default=48)
    ap.add_argument('--cell', type=int, default=1)
    ap.add_argument('--crop')
    ap.add_argument('--preview')
    ap.add_argument('--pixel', action='store_true', help='source is already pixel art: sample its grid, trim the border, crop 160x224')
    a = ap.parse_args()
    if a.phone:
        ART = os.path.join(ROOT, 'content', 'hsr98', 'phone')
        MODULE = os.path.join(ROOT, 'js', 'apps', 'hsr98', 'hsr-phone-pix.js')
        W, H = 268, 464
        NAME = 'PHONE_PIX'
    os.makedirs(ART, exist_ok=True)
    if a.key and a.image:
        src = Image.open(a.image).convert('RGB')
        out = pixel_fit(src, a.colors) if a.pixel else pixelate(fit(src, a.crop), a.colors, a.cell)
        buf = io.BytesIO()
        out.save(buf, 'PNG', optimize=True)
        with open(os.path.join(ART, a.key + '.png'), 'wb') as fh:
            fh.write(buf.getvalue())
        if a.preview:
            out.resize((W * 2, H * 2), Image.NEAREST).save(a.preview)
        print(a.key, len(buf.getvalue()), 'bytes')
    keys = build_module()
    print(os.path.basename(MODULE) + ':', len(keys), 'pictures')


if __name__ == '__main__':
    sys.exit(main())
