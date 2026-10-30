import json
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'heroes98', 'art')
OUT = os.path.join(ROOT, 'content', 'heroes98')
MANIFEST = os.path.join(ROOT, 'js', 'apps', 'heroes98', 'he-files.js')
MAX_COLORS = 256


def load_spec():
    res = subprocess.run(['node', os.path.join(ROOT, 'tools', 'heroes98-art-list.cjs'), '--json'], capture_output=True, check=True)
    return {e['id']: e for e in json.loads(res.stdout.decode('utf-8'))}


def is_key(r, g, b):
    return r > 110 and b > 110 and g < min(r, b) * 0.55 and abs(r - b) < 90


def hard_alpha(img):
    img = img.convert('RGBA')
    a = img.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    img.putalpha(a)
    return img


def split_mask(img):
    px = img.load()
    mask = Image.new('RGBA', img.size, (0, 0, 0, 0))
    mp = mask.load()
    found = False
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and is_key(r, g, b):
                v = max(r, b)
                mp[x, y] = (v, v, v, 255)
                px[x, y] = (v // 2, v // 2, v // 2, 255)
                found = True
    return img, (mask if found else None)


def pixels(img):
    return img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata()


def served(path, out_root):
    return 'content/heroes98/' + os.path.relpath(path, out_root).replace('\\', '/')


def count_colors(img):
    return len({(r, g, b) for r, g, b, a in pixels(img) if a})


def reduce_colors(img):
    if count_colors(img) <= MAX_COLORS:
        return img, False
    alpha = img.getchannel('A')
    rgb = img.convert('RGB').quantize(colors=MAX_COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out, True


def read_frames(folder, name, count, w, h):
    strip = os.path.join(folder, name + '.png')
    if os.path.exists(strip):
        img = Image.open(strip).convert('RGBA')
        if img.size != (w * count, h):
            return None, '%s: лента %dx%d, нужно %dx%d (%d кадров)' % (name, img.width, img.height, w * count, h, count)
        return [img.crop((i * w, 0, (i + 1) * w, h)) for i in range(count)], None
    frames = []
    for i in range(1, count + 1):
        p = os.path.join(folder, '%s_%d.png' % (name, i))
        if not os.path.exists(p):
            return None, '%s: нет ленты %s.png и кадра %s_%d.png' % (name, name, name, i)
        img = Image.open(p).convert('RGBA')
        if img.size != (w, h):
            return None, '%s_%d: кадр %dx%d, нужно %dx%d' % (name, i, img.width, img.height, w, h)
        frames.append(img)
    return frames, None


def save_sheet(sheet, out_root, eid, team):
    sheet = hard_alpha(sheet)
    mask = None
    if team:
        sheet, mask = split_mask(sheet)
    sheet, reduced = reduce_colors(sheet)
    path = os.path.join(out_root, *eid.split('/')) + '.png'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sheet.save(path, optimize=True)
    entry = {'src': served(path, out_root)}
    if mask:
        mpath = path[:-4] + '.mask.png'
        mask.save(mpath, optimize=True)
        entry['mask'] = served(mpath, out_root)
    return entry, reduced


def build_creature(e, src_root, out_root):
    folder = os.path.join(src_root, *e['id'].split('/'))
    w, h = e['size']
    rows, problems = [], []
    for name, count in e['anims']:
        frames, err = read_frames(folder, name, count, w, h)
        if err:
            problems.append(err)
        rows.append((name, frames or []))
    if problems:
        return None, problems
    cols = max(len(f) for _, f in rows)
    sheet = Image.new('RGBA', (cols * w, len(rows) * h), (0, 0, 0, 0))
    anims = {}
    for r, (name, frames) in enumerate(rows):
        for i, f in enumerate(frames):
            sheet.paste(f, (i * w, r * h))
        anims[name] = [r, len(frames)]
    entry, reduced = save_sheet(sheet, out_root, e['id'], e['team'])
    entry.update({'w': w, 'h': h, 'anchor': e['anchor'], 'anims': anims})
    portrait = os.path.join(folder, 'portrait.png')
    if os.path.exists(portrait):
        img = Image.open(portrait).convert('RGBA')
        if img.size != tuple(e['portrait']):
            problems.append('portrait: %dx%d, нужно %dx%d' % (img.width, img.height, e['portrait'][0], e['portrait'][1]))
        else:
            pe, _ = save_sheet(img, out_root, e['id'] + '.portrait', False)
            entry['portrait'] = pe['src']
    if reduced:
        problems.append('цветов больше %d, лист сведён к палитре' % MAX_COLORS)
    return entry, problems


def build_single(e, src_root, out_root):
    path = os.path.join(src_root, *e['id'].split('/')) + '.png'
    img = Image.open(path).convert('RGBA')
    w, h = e['size']
    if img.height != h or img.width % w:
        return None, ['%dx%d: нужна высота %d и ширина, кратная %d' % (img.width, img.height, h, w)]
    entry, reduced = save_sheet(img, out_root, e['id'], e['team'])
    entry.update({'w': w, 'h': h, 'frames': img.width // w})
    return entry, (['цветов больше %d, сведено к палитре' % MAX_COLORS] if reduced else [])


def build_town(e, src_root, out_root):
    folder = os.path.join(src_root, *e['id'].split('/'))
    w, h = e['size']
    problems, layers = [], {}
    for name in ['background'] + e['layers']:
        p = os.path.join(folder, name + '.png')
        if not os.path.exists(p):
            if name == 'background':
                problems.append('нет background.png')
            continue
        img = Image.open(p).convert('RGBA')
        if img.width % w or img.height != h:
            problems.append('%s: %dx%d, нужно %dx%d или лента кадров такой высоты' % (name, img.width, img.height, w, h))
            continue
        le, reduced = save_sheet(img, out_root, e['id'] + '/' + name, False)
        layers[name] = {'src': le['src'], 'frames': img.width // w}
        if reduced:
            problems.append('%s: сведено к %d цветам' % (name, MAX_COLORS))
    if 'background' not in layers:
        return None, problems
    return {'w': w, 'h': h, 'layers': layers}, problems


def delivered(spec, src_root):
    out = []
    for eid, e in spec.items():
        base = os.path.join(src_root, *eid.split('/'))
        if os.path.isdir(base) or os.path.exists(base + '.png'):
            out.append(e)
    return out


def build(spec, src_root, out_root, manifest_path, write):
    entries, report = {}, []
    for e in delivered(spec, src_root):
        if e['kind'] == 'creature':
            entry, problems = build_creature(e, src_root, out_root)
        elif e['kind'] == 'townScene':
            entry, problems = build_town(e, src_root, out_root)
        else:
            entry, problems = build_single(e, src_root, out_root)
        report.append((e['id'], entry is not None, problems))
        if entry:
            entries[e['id']] = entry
    if write:
        body = json.dumps(entries, ensure_ascii=False, indent=2).replace('\n', '\n  ')
        with open(manifest_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write("(function (H) {\n  'use strict';\n  H.Art = H.Art || {};\n  H.Art.FILES = %s;\n})(globalThis.Heroes98 = globalThis.Heroes98 || {});\n" % body)
    return entries, report


def print_report(report):
    for eid, good, problems in report:
        print(('ok   ' if good else 'FAIL ') + eid)
        for p in problems:
            print('     ' + p)
    print('всего: %d, собрано: %d' % (len(report), sum(1 for r in report if r[1])))


def selftest():
    spec = load_spec()
    tmp = tempfile.mkdtemp(prefix='heroes98-art-')
    try:
        src, out = os.path.join(tmp, 'src'), os.path.join(tmp, 'out')
        unit = spec['unit/militia']
        w, h = unit['size']
        folder = os.path.join(src, 'unit', 'militia')
        os.makedirs(folder)
        for name, count in unit['anims']:
            strip = Image.new('RGBA', (w * count, h), (0, 0, 0, 0))
            d = ImageDraw.Draw(strip)
            for i in range(count):
                x = i * w
                for k in range(600):
                    d.point((x + 20 + k % 50, 20 + k // 50 * 4), fill=(k % 256, (k * 7) % 256, (k * 13) % 256, 255))
                d.rectangle((x + 40, 30 + i, x + 56, 88), fill=(150, 130, 100, 200))
            strip.save(os.path.join(folder, name + '.png'))
        Image.new('RGBA', (64, 64), (120, 100, 80, 255)).save(os.path.join(folder, 'portrait.png'))
        mine = spec['object/goldmine']
        mw, mh = mine['size']
        os.makedirs(os.path.join(src, 'object'))
        img = Image.new('RGBA', (mw * 2, mh), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        for f in range(2):
            d.rectangle((f * mw + 10, 40, f * mw + mw - 10, mh - 6), fill=(110, 90, 60, 255))
            d.rectangle((f * mw + 20, 10, f * mw + 44, 26), fill=(230 - f * 40, 20, 230 - f * 40, 255))
        img.save(os.path.join(src, 'object', 'goldmine.png'))
        manifest = os.path.join(tmp, 'he-files.js')
        entries, report = build(spec, src, out, manifest, True)
        print_report(report)
        m = entries['unit/militia']
        sheet = Image.open(os.path.join(out, 'unit', 'militia.png'))
        cols = max(c for _, c in unit['anims'])
        assert sheet.size == (cols * w, len(unit['anims']) * h), sheet.size
        assert count_colors(sheet.convert('RGBA')) <= MAX_COLORS
        assert set(pixels(sheet.convert('RGBA').getchannel('A'))) <= {0, 255}
        assert m['anims']['idle'] == [0, 6] and m['anchor'] == unit['anchor'] and 'portrait' in m
        g = entries['object/goldmine']
        assert g['frames'] == 2 and 'mask' in g
        mask = Image.open(os.path.join(out, 'object', 'goldmine.mask.png')).convert('RGBA')
        assert mask.getbbox() is not None
        base = Image.open(os.path.join(out, 'object', 'goldmine.png')).convert('RGBA')
        assert not any(a and is_key(r, gg, b) for r, gg, b, a in pixels(base))
        text = open(manifest, encoding='utf-8').read()
        assert 'H.Art.FILES' in text and 'unit/militia' in text
        print('selftest: ok')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'selftest':
        selftest()
        return 0
    spec = load_spec()
    if cmd == 'check':
        tmp = tempfile.mkdtemp(prefix='heroes98-check-')
        try:
            _, report = build(spec, SRC, tmp, None, False)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        print_report(report)
        return 0 if all(r[1] for r in report) else 1
    if cmd == 'build':
        _, report = build(spec, SRC, OUT, MANIFEST, True)
        print_report(report)
        return 0 if all(r[1] for r in report) else 1
    print('usage: python tools/heroes98-art.py check|build|selftest')
    return 2


if __name__ == '__main__':
    sys.exit(main())
