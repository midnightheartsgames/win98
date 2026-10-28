import argparse
import json
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'content', 'aayla98')
FILES_JS = os.path.join(ROOT, 'js', 'apps', 'aayla98', 'ay-files.js')
SIZES = {'bust': (280, 400), 'bg': (640, 480), 'cg': (640, 480), 'still': (320, 240)}


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a PNG: ' + path)
    return struct.unpack('>II', head[16:24])


def scan():
    files = {}
    for kind in SIZES:
        folder = os.path.join(CONTENT, kind)
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if name.lower().endswith('.png'):
                w, h = png_size(os.path.join(folder, name))
                want = SIZES[kind]
                if (w, h) != want:
                    raise ValueError('%s/%s is %dx%d, must be %dx%d' % (kind, name, w, h, want[0], want[1]))
                files['%s/%s' % (kind, name)] = [w, h]
    return files


def write_files(files):
    body = json.dumps(files, ensure_ascii=False, sort_keys=True)
    src = "(function (A) {\n  'use strict';\n  A.Art = A.Art || {};\n  A.Art.FILES = %s;\n})(globalThis.Aayla98 = globalThis.Aayla98 || {});\n" % body
    with open(FILES_JS, 'w', encoding='utf-8', newline='\n') as f:
        f.write(src)


def fit(img, size, crop):
    from PIL import Image
    img = img.convert('RGBA')
    if crop:
        x0, y0, x1, y1 = (float(v) for v in crop.split(','))
        img = img.crop((round(x0 * img.width), round(y0 * img.height), round(x1 * img.width), round(y1 * img.height)))
    w, h = size
    want = w / h
    if img.width / img.height > want:
        nw = round(img.height * want)
        left = (img.width - nw) >> 1
        img = img.crop((left, 0, left + nw, img.height))
    else:
        nh = round(img.width / want)
        top = (img.height - nh) >> 1
        img = img.crop((0, top, img.width, top + nh))
    return img.resize((w, h), Image.LANCZOS)


def quantize(img, colors, dither, sepia):
    from PIL import Image, ImageOps
    alpha = img.getchannel('A')
    rgb = img.convert('RGB')
    if sepia:
        grey = ImageOps.grayscale(rgb)
        rgb = ImageOps.colorize(grey, '#1a120a', '#f0dcb0', mid='#8a6a42')
    method = Image.Dither.FLOYDSTEINBERG if dither == 'floyd' else Image.Dither.NONE
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=method).convert('RGBA')
    q.putalpha(alpha.point(lambda v: 255 if v >= 128 else 0))
    return q


def main():
    ap = argparse.ArgumentParser(description='Fit an image to an Aayla98 picture slot and refresh ay-files.js')
    ap.add_argument('kind', nargs='?', choices=sorted(SIZES))
    ap.add_argument('name', nargs='?', help='file name without .png, for example aayla_padawan_smile or temple_garden_day')
    ap.add_argument('src', nargs='?', help='source image')
    ap.add_argument('--crop', help='x0,y0,x1,y1 in 0..1 of the source')
    ap.add_argument('--colors', type=int, default=256)
    ap.add_argument('--dither', choices=['none', 'floyd'], default='none')
    ap.add_argument('--scan', action='store_true', help='only rescan content/aayla98 and rewrite ay-files.js')
    a = ap.parse_args()
    if not a.scan:
        if not (a.kind and a.name and a.src):
            ap.error('kind, name and src are required unless --scan')
        from PIL import Image
        img = quantize(fit(Image.open(a.src), SIZES[a.kind], a.crop), max(2, min(256, a.colors)), a.dither, a.kind == 'still')
        out = os.path.join(CONTENT, a.kind, a.name + '.png')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img.save(out, optimize=True)
        print(out)
    files = scan()
    write_files(files)
    print('%d pictures in ay-files.js' % len(files))


if __name__ == '__main__':
    sys.exit(main())
