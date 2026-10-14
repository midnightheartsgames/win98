import argparse
import base64
import io
import os
import struct
import sys
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXE = os.path.join(ROOT, 'content', 'blender2.04-windows', 'Blender.exe')
OUT = os.path.join(ROOT, 'js', 'apps', 'blender204', 'b2-assets.js')

FONT_SOURCES = {
    'helv8': 'https://gitlab.freedesktop.org/xorg/font/adobe-75dpi/-/raw/master/helvR08.bdf',
    'helv10': 'https://gitlab.freedesktop.org/xorg/font/adobe-75dpi/-/raw/master/helvR10.bdf',
    'helv12': 'https://gitlab.freedesktop.org/xorg/font/adobe-75dpi/-/raw/master/helvR12.bdf',
    'helvb12': 'https://gitlab.freedesktop.org/xorg/font/adobe-75dpi/-/raw/master/helvB12.bdf',
    'scr12': 'https://gitlab.freedesktop.org/xorg/font/misc-misc/-/raw/master/6x12.bdf',
    'scr15': 'https://gitlab.freedesktop.org/xorg/font/misc-misc/-/raw/master/7x14.bdf',
}


def find_splash_and_icons(data):
    tga_at = None
    for start in range(len(data) - 3):
        if data[start] == 0xFF and data[start + 1] == 0xD8 and data[start + 2] == 0xFF:
            end = data.find(b'\xff\xd9', start)
            if end < 0:
                continue
            try:
                img = Image.open(io.BytesIO(data[start:end + 2]))
                img.load()
            except Exception:
                continue
            if img.size == (500, 269):
                tga_at = end + 2
                return data[start:end + 2], tga_at
    raise SystemExit('splash not found')


def decode_tga(data, at):
    length = struct.unpack_from('<I', data, at + 2)[0]
    p = at + 6
    id_len, _, kind = data[p], data[p + 1], data[p + 2]
    if kind != 10:
        raise SystemExit('unexpected tga type %d' % kind)
    w, h, bpp, desc = struct.unpack_from('<HHBB', data, p + 12)
    q = p + 18 + id_len
    pixels = []
    total = w * h
    while len(pixels) < total:
        c = data[q]
        q += 1
        n = (c & 0x7F) + 1
        if c & 0x80:
            b, g, r = data[q], data[q + 1], data[q + 2]
            q += 3
            pixels.extend([(r, g, b)] * n)
        else:
            for _ in range(n):
                b, g, r = data[q], data[q + 1], data[q + 2]
                q += 3
                pixels.append((r, g, b))
    img = Image.new('RGB', (w, h))
    img.putdata(pixels[:total])
    if not desc & 0x20:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
    return img, length


def ensure_bdf(cache, name):
    path = os.path.join(cache, name + '.bdf')
    if not os.path.exists(path):
        os.makedirs(cache, exist_ok=True)
        print('download', FONT_SOURCES[name])
        urllib.request.urlretrieve(FONT_SOURCES[name], path)
    return path


def load_bdf(path):
    glyphs = {}
    ascent = descent = 0
    cur = None
    rows = None
    for line in open(path, encoding='latin-1'):
        parts = line.split()
        if not parts:
            continue
        key = parts[0]
        if key == 'FONT_ASCENT':
            ascent = int(parts[1])
        elif key == 'FONT_DESCENT':
            descent = int(parts[1])
        elif key == 'STARTCHAR':
            cur = {}
        elif key == 'ENCODING':
            cur['code'] = int(parts[1])
        elif key == 'DWIDTH':
            cur['adv'] = int(parts[1])
        elif key == 'BBX':
            cur['w'], cur['h'], cur['x'], cur['y'] = map(int, parts[1:5])
        elif key == 'BITMAP':
            rows = []
        elif key == 'ENDCHAR':
            cur['rows'] = rows
            rows = None
            if 32 <= cur['code'] < 256:
                glyphs[cur['code']] = cur
        elif rows is not None:
            rows.append(parts[0])
    return ascent, descent, glyphs


def encode_font(path):
    ascent, descent, glyphs = load_bdf(path)
    out = []
    for code in range(32, 256):
        g = glyphs.get(code)
        if not g:
            out.append('')
            continue
        width_bits = ((g['w'] + 7) // 8) * 8
        bits = []
        for row in g['rows']:
            value = int(row, 16)
            bits.append(format(value, '0%db' % width_bits)[:g['w']])
        packed = ''.join(bits)
        hexed = ''
        for i in range(0, len(packed), 4):
            chunk = packed[i:i + 4].ljust(4, '0')
            hexed += format(int(chunk, 2), 'x')
        out.append('%d,%d,%d,%d,%d,%s' % (g['adv'], g['w'], g['h'], g['x'], g['y'], hexed))
    return {'ascent': ascent, 'descent': descent, 'glyphs': out}


STANDARD_NAMES = {
    32: 'space', 33: 'exclam', 34: 'quotedbl', 35: 'numbersign', 36: 'dollar', 37: 'percent', 38: 'ampersand', 39: 'quoteright',
    40: 'parenleft', 41: 'parenright', 42: 'asterisk', 43: 'plus', 44: 'comma', 45: 'hyphen', 46: 'period', 47: 'slash',
    48: 'zero', 49: 'one', 50: 'two', 51: 'three', 52: 'four', 53: 'five', 54: 'six', 55: 'seven', 56: 'eight', 57: 'nine',
    58: 'colon', 59: 'semicolon', 60: 'less', 61: 'equal', 62: 'greater', 63: 'question', 64: 'at',
    91: 'bracketleft', 92: 'backslash', 93: 'bracketright', 94: 'asciicircum', 95: 'underscore', 96: 'quoteleft',
    123: 'braceleft', 124: 'bar', 125: 'braceright', 126: 'asciitilde',
    161: 'exclamdown', 162: 'cent', 163: 'sterling', 165: 'yen', 167: 'section', 169: 'copyright', 171: 'guillemotleft',
    174: 'registered', 176: 'degree', 177: 'plusminus', 180: 'acute', 181: 'mu', 182: 'paragraph', 183: 'periodcentered',
    187: 'guillemotright', 191: 'questiondown', 192: 'Agrave', 193: 'Aacute', 194: 'Acircumflex', 195: 'Atilde', 196: 'Adieresis',
    197: 'Aring', 198: 'AE', 199: 'Ccedilla', 200: 'Egrave', 201: 'Eacute', 202: 'Ecircumflex', 203: 'Edieresis', 204: 'Igrave',
    205: 'Iacute', 206: 'Icircumflex', 207: 'Idieresis', 209: 'Ntilde', 210: 'Ograve', 211: 'Oacute', 212: 'Ocircumflex',
    213: 'Otilde', 214: 'Odieresis', 215: 'multiply', 216: 'Oslash', 217: 'Ugrave', 218: 'Uacute', 219: 'Ucircumflex', 220: 'Udieresis',
    221: 'Yacute', 223: 'germandbls', 224: 'agrave', 225: 'aacute', 226: 'acircumflex', 227: 'atilde', 228: 'adieresis', 229: 'aring',
    230: 'ae', 231: 'ccedilla', 232: 'egrave', 233: 'eacute', 234: 'ecircumflex', 235: 'edieresis', 236: 'igrave', 237: 'iacute',
    238: 'icircumflex', 239: 'idieresis', 241: 'ntilde', 242: 'ograve', 243: 'oacute', 244: 'ocircumflex', 245: 'otilde',
    246: 'odieresis', 247: 'divide', 248: 'oslash', 249: 'ugrave', 250: 'uacute', 251: 'ucircumflex', 252: 'udieresis', 253: 'yacute', 255: 'ydieresis'
}
for c in range(65, 91):
    STANDARD_NAMES[c] = chr(c)
for c in range(97, 123):
    STANDARD_NAMES[c] = chr(c)

STD_ENC_ACCENTS = {193: 'grave', 194: 'acute', 195: 'circumflex', 196: 'tilde', 197: 'macron', 198: 'breve', 199: 'dotaccent', 200: 'dieresis', 202: 'ring', 203: 'cedilla', 205: 'hungarumlaut', 206: 'ogonek', 207: 'caron'}


def eexec_decrypt(data, r, skip):
    out = bytearray()
    for c in data:
        out.append(c ^ (r >> 8))
        r = ((c + r) * 52845 + 22719) & 0xFFFF
    return bytes(out[skip:])


def find_bfont(data):
    start = data.find(b'%!PS-AdobeFont-1.0: Bfont')
    if start < 0:
        return None
    e = data.find(b'eexec', start)
    p = e + 5
    while data[p] in (10, 13, 32):
        p += 1
    if data[p] == 0x80 and data[p + 1] == 2:
        n = struct.unpack_from('<I', data, p + 2)[0]
        enc = data[p + 6:p + 6 + n]
    else:
        end = data.find(b'cleartomark', p)
        enc = data[p:end]
    return eexec_decrypt(enc, 55665, 4)


def parse_type1(priv):
    lenIV = 4
    subrs = {}
    chars = {}
    pos = 0
    import re
    while True:
        m = re.compile(rb'dup (\d+) (\d+) (RD|-\|) ').search(priv, pos)
        cs = priv.find(b'/CharStrings', pos)
        if not m or (cs >= 0 and m.start() > cs):
            break
        idx, n = int(m.group(1)), int(m.group(2))
        s = m.end()
        subrs[idx] = eexec_decrypt(priv[s:s + n], 4330, lenIV)
        pos = s + n
    cs = priv.find(b'/CharStrings')
    pat = re.compile(rb'/([A-Za-z0-9_.]+) (\d+) (RD|-\|) ')
    p = cs
    while True:
        m = pat.search(priv, p)
        if not m:
            break
        name, n = m.group(1).decode(), int(m.group(2))
        s = m.end()
        chars[name] = eexec_decrypt(priv[s:s + n], 4330, lenIV)
        p = s + n
    return subrs, chars


def run_charstring(cs, subrs, chars, out, state, depth=0):
    stack = state['stack']
    i = 0
    while i < len(cs):
        v = cs[i]
        i += 1
        if v >= 32:
            if v <= 246:
                stack.append(v - 139)
            elif v <= 250:
                stack.append((v - 247) * 256 + cs[i] + 108); i += 1
            elif v <= 254:
                stack.append(-(v - 251) * 256 - cs[i] - 108); i += 1
            else:
                stack.append(struct.unpack('>i', cs[i:i + 4])[0]); i += 4
            continue
        x, y = state['pt']
        if v == 12:
            v2 = cs[i]; i += 1
            if v2 == 12:
                b = stack.pop(); a = stack.pop(); stack.append(a / b)
            elif v2 == 16:
                oth = int(stack.pop()); n_args = int(stack.pop())
                args = [stack.pop() for _ in range(n_args)][::-1]
                if oth == 1:
                    state['flex'] = []
                elif oth == 2:
                    pass
                elif oth == 0:
                    fl = state.get('flex') or []
                    state['flex'] = None
                    pts = fl[1:] if len(fl) >= 7 else fl
                    if len(pts) >= 6:
                        out.append(['C', *pts[0], *pts[1], *pts[2]])
                        out.append(['C', *pts[3], *pts[4], *pts[5]])
                        state['pt'] = list(pts[5])
                    state['ps'] = [state['pt'][1], state['pt'][0]]
                elif oth == 3:
                    state['ps'] = [3]
                else:
                    state['ps'] = args[::-1]
            elif v2 == 17:
                ps = state.get('ps') or []
                stack.append(ps.pop() if ps else 0)
            elif v2 == 33:
                y2 = stack.pop(); x2 = stack.pop(); state['pt'] = [x2, y2]
            elif v2 == 7:
                stack[:] = []
                state['pt'] = [0, 0]
            elif v2 == 6:
                achar = stack.pop(); bchar = stack.pop(); ady = stack.pop(); adx = stack.pop(); asb = stack.pop()
                stack[:] = []
                base = STD_ENC_ACCENTS.get(int(bchar)) or STANDARD_NAMES.get(int(bchar))
                acc = STD_ENC_ACCENTS.get(int(achar)) or STANDARD_NAMES.get(int(achar))
                bs = {'stack': [], 'pt': [0, 0], 'w': 0}
                if base in chars:
                    run_charstring(chars[base], subrs, chars, out, bs, depth + 1)
                as_ = {'stack': [], 'pt': [0, 0], 'w': 0, 'offset': (adx - asb + state.get('sbx', 0), ady)}
                if acc in chars:
                    sub = []
                    run_charstring(chars[acc], subrs, chars, sub, as_, depth + 1)
                    ox, oy = adx - asb, ady
                    for c in sub:
                        if c[0] == 'Z':
                            out.append(c)
                        else:
                            coords = c[1:]
                            out.append([c[0]] + [coords[k] + (ox if k % 2 == 0 else oy) for k in range(len(coords))])
                return 'end'
            else:
                stack[:] = []
            continue
        if v == 13:
            w = stack.pop(); sbx = stack.pop(); stack[:] = []
            state['pt'] = [sbx, 0]; state['w'] = w; state['sbx'] = sbx
        elif v == 21:
            dy = stack.pop(); dx = stack.pop(); stack[:] = []
            np = [x + dx, y + dy]
            if state.get('flex') is not None:
                state['flex'].append(np); state['pt'] = np
            else:
                out.append(['M', *np]); state['pt'] = np
        elif v == 22:
            dx = stack.pop(); stack[:] = []
            np = [x + dx, y]
            if state.get('flex') is not None:
                state['flex'].append(np); state['pt'] = np
            else:
                out.append(['M', *np]); state['pt'] = np
        elif v == 4:
            dy = stack.pop(); stack[:] = []
            np = [x, y + dy]
            if state.get('flex') is not None:
                state['flex'].append(np); state['pt'] = np
            else:
                out.append(['M', *np]); state['pt'] = np
        elif v == 5:
            dy = stack.pop(); dx = stack.pop(); stack[:] = []
            state['pt'] = [x + dx, y + dy]; out.append(['L', *state['pt']])
        elif v == 6:
            dx = stack.pop(); stack[:] = []
            state['pt'] = [x + dx, y]; out.append(['L', *state['pt']])
        elif v == 7:
            dy = stack.pop(); stack[:] = []
            state['pt'] = [x, y + dy]; out.append(['L', *state['pt']])
        elif v == 8:
            a = stack[-6:]; del stack[-6:]; stack[:] = []
            p1 = [x + a[0], y + a[1]]; p2 = [p1[0] + a[2], p1[1] + a[3]]; p3 = [p2[0] + a[4], p2[1] + a[5]]
            out.append(['C', *p1, *p2, *p3]); state['pt'] = p3
        elif v == 30:
            a = stack[-4:]; del stack[-4:]; stack[:] = []
            p1 = [x, y + a[0]]; p2 = [p1[0] + a[1], p1[1] + a[2]]; p3 = [p2[0] + a[3], p2[1]]
            out.append(['C', *p1, *p2, *p3]); state['pt'] = p3
        elif v == 31:
            a = stack[-4:]; del stack[-4:]; stack[:] = []
            p1 = [x + a[0], y]; p2 = [p1[0] + a[1], p1[1] + a[2]]; p3 = [p2[0], p2[1] + a[3]]
            out.append(['C', *p1, *p2, *p3]); state['pt'] = p3
        elif v == 9:
            stack[:] = []; out.append(['Z'])
        elif v == 10:
            n = int(stack.pop())
            if n in subrs and depth < 12:
                r = run_charstring(subrs[n], subrs, chars, out, state, depth + 1)
                if r == 'end':
                    return 'end'
        elif v == 11:
            return None
        elif v == 14:
            stack[:] = []
            return 'end'
        elif v in (1, 3):
            stack[:] = []
    return None


def extract_bfont(data):
    priv = find_bfont(data)
    if not priv:
        return {}
    subrs, chars = parse_type1(priv)
    glyphs = {}
    for code, name in STANDARD_NAMES.items():
        if name not in chars:
            continue
        out = []
        st = {'stack': [], 'pt': [0, 0], 'w': 0, 'flex': None}
        run_charstring(chars[name], subrs, chars, out, st)
        path = []
        for c in out:
            path.append(c[0] + ','.join(str(int(round(v))) for v in c[1:]))
        glyphs[code] = {'w': int(round(st.get('w', 500))), 'p': ' '.join(path)}
    return glyphs


def to_data_url(img, fmt, mime):
    buf = io.BytesIO()
    img.save(buf, fmt, optimize=True)
    return 'data:%s;base64,%s' % (mime, base64.b64encode(buf.getvalue()).decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bdf', default=os.path.join(os.environ.get('TEMP', '/tmp'), 'blender204-bdf'))
    ap.add_argument('--dump', default='')
    args = ap.parse_args()
    data = open(EXE, 'rb').read()
    splash_jpeg, tga_at = find_splash_and_icons(data)
    icons, _ = decode_tga(data, tga_at)
    if args.dump:
        os.makedirs(args.dump, exist_ok=True)
        icons.save(os.path.join(args.dump, 'blenderbuttons.png'))
        open(os.path.join(args.dump, 'splash.jpg'), 'wb').write(splash_jpeg)
    splash_url = 'data:image/jpeg;base64,' + base64.b64encode(splash_jpeg).decode()
    icons_url = to_data_url(icons, 'PNG', 'image/png')
    fonts = {name: encode_font(ensure_bdf(args.bdf, name)) for name in FONT_SOURCES}
    lines = ['(function (B) {', "  'use strict';"]
    lines.append("  B.ASSETS = { icons: '%s', splash: '%s', iconSize: [%d, %d] };" % (icons_url, splash_url, icons.size[0], icons.size[1]))
    lines.append('  B.FONT_DATA = {')
    for name, font in fonts.items():
        glyphs = ','.join("'%s'" % g for g in font['glyphs'])
        lines.append("    %s: { ascent: %d, descent: %d, glyphs: [%s] }," % (name, font['ascent'], font['descent'], glyphs))
    lines.append('  };')
    bfont = extract_bfont(data)
    lines.append('  B.BFONT = {')
    for code in sorted(bfont):
        g = bfont[code]
        lines.append("    %d: [%d, '%s']," % (code, g['w'], g['p']))
    lines.append('  };')
    lines.append('})(globalThis.B204 = globalThis.B204 || {});')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')
    print('wrote', OUT, os.path.getsize(OUT))


if __name__ == '__main__':
    sys.exit(main())
