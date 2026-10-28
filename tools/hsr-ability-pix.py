import argparse
import base64
import io
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'content', 'hsr98', 'abilities')
OUT = os.path.join(ART, 'pix')
MODULE = os.path.join(ROOT, 'js', 'apps', 'hsr98', 'hsr-ability-pix.js')
SIZE = 64
HEROES = ['trail', 'himeko', 'seele', 'blade', 'clara', 'danheng', 'topaz', 'herta', 'jingyuan', 'bronya', 'asta', 'ruanmei', 'kafka', 'silverwolf', 'welt', 'march', 'gepard', 'fuxuan', 'natasha', 'bailu', 'luocha']
SLOTS = ['q', 'e', 't', 'r']


def square(img):
    if img.mode == 'RGBA':
        base = Image.new('RGB', img.size, (0, 0, 0))
        base.paste(img, mask=img.split()[3])
        img = base
    img = img.convert('RGB')
    side = min(img.width, img.height)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))


def shrink(img, colors):
    small = img.resize((SIZE, SIZE), Image.BOX)
    return small.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.NONE).convert('RGB')


def keys_of(names):
    wanted = []
    for name in names:
        if '-' in name:
            wanted.append(name)
        else:
            wanted.extend(name + '-' + s for s in SLOTS)
    return wanted


def build_module():
    rows = []
    for hero in HEROES:
        for slot in SLOTS:
            key = hero + '-' + slot
            path = os.path.join(OUT, key + '.png')
            if not os.path.exists(path):
                continue
            with open(path, 'rb') as fh:
                rows.append("    '" + key + "': 'data:image/png;base64," + base64.b64encode(fh.read()).decode('ascii') + "'")
    body = "(function (H) {\n  'use strict';\n  H.ABIL_PIX = {\n" + ',\n'.join(rows) + "\n  };\n  if (typeof module !== 'undefined') module.exports = H;\n})(globalThis.Hsr98 = globalThis.Hsr98 || {});\n"
    with open(MODULE, 'w', encoding='utf8', newline='\n') as fh:
        fh.write(body)
    return len(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('keys', nargs='*')
    ap.add_argument('--colors', type=int, default=64)
    ap.add_argument('--preview')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    names = keys_of(a.keys) if a.keys else [h + '-' + s for h in HEROES for s in SLOTS]
    missing = []
    for key in names:
        src = os.path.join(ART, key + '.png')
        if not os.path.exists(src):
            missing.append(key)
            continue
        out = shrink(square(Image.open(src)), a.colors)
        buf = io.BytesIO()
        out.save(buf, 'PNG', optimize=True)
        with open(os.path.join(OUT, key + '.png'), 'wb') as fh:
            fh.write(buf.getvalue())
    if missing:
        print('missing:', ', '.join(missing))
    if a.preview:
        sheet = Image.new('RGB', (SIZE * 2 * len(SLOTS), SIZE * 2 * len(HEROES)), (16, 20, 46))
        for j, hero in enumerate(HEROES):
            for i, slot in enumerate(SLOTS):
                path = os.path.join(OUT, hero + '-' + slot + '.png')
                if os.path.exists(path):
                    sheet.paste(Image.open(path).resize((SIZE * 2, SIZE * 2), Image.NEAREST), (i * SIZE * 2, j * SIZE * 2))
        sheet.save(a.preview)
    print('hsr-ability-pix.js:', build_module(), 'icons')


if __name__ == '__main__':
    sys.exit(main())
