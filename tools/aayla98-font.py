import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'aayla98-font.txt')
FACES = [('text', 'tahoma.ttf', 12), ('bold', 'tahomabd.ttf', 12)]
CHARS = [chr(c) for c in range(32, 127)] + [chr(c) for c in range(0x410, 0x450)] + list('ЁёАаЕеКкМмОоРрСсТтХхУу«»—–…№‘’“”·×')


def glyphs(path, size):
    font = ImageFont.truetype(path, size)
    asc, desc = font.getmetrics()
    h = asc + desc
    seen = set()
    rows_out = []
    for ch in CHARS:
        if ch in seen:
            continue
        seen.add(ch)
        adv = int(round(font.getlength(ch)))
        img = Image.new('1', (adv + 12, h), 0)
        d = ImageDraw.Draw(img)
        d.fontmode = '1'
        d.text((6, 0), ch, font=font, fill=1, anchor='la')
        px = img.load()
        cols = [x for x in range(img.width) if any(px[x, y] for y in range(h))]
        if not cols:
            rows_out.append((ch, adv, 0, []))
            continue
        x0, x1 = cols[0], cols[-1]
        rows = [''.join('#' if px[x, y] else '.' for x in range(x0, x1 + 1)) for y in range(h)]
        rows_out.append((ch, adv, x0 - 6, rows))
    return asc, h, rows_out


def main():
    fonts_dir = os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts')
    lines = []
    for name, file, size in FACES:
        asc, h, items = glyphs(os.path.join(fonts_dir, file), size)
        lines.append('[%s asc=%d h=%d]' % (name, asc, h))
        for ch, adv, off, rows in items:
            lines.append('@U+%04X %d %d' % (ord(ch), adv, off))
            lines.extend(rows)
        lines.append('')
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print(OUT, len(lines))


if __name__ == '__main__':
    sys.exit(main())
