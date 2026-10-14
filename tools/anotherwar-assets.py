import os, re, sys, json, zlib, struct, glob, shutil, subprocess, io
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'content', 'Another War')
DST = os.path.join(ROOT, 'content', 'anotherwar')

LEVELS = ['StoryRoom', 'A_Death', 'AKT1', 'A01_Rynek', 'A02_CafeRene', 'A03_Lochy', 'A04_cmentarz', 'A05_Church',
          'A06_Antyk', 'A07_Przedzamcze', 'A08_KryptaMala', 'A09_Katakumby', 'A11_Las', 'A12_LasNE', 'A12_LasNW',
          'A12_LasSE', 'A12_LasSW']

SKINS = {
    'head': ['hero1', 'fleja', 'kapral1', 'mutze1', 'mutze2', 'oficer', 'tajniak', 'wiesniak1', 'wiesniak2', 'wiesniak3',
             'beret', 'brodacz', 'bogart', 'rene', 'general', 'kelnerka', 'pianista', 'alfons', 'szczur', 'mumia'],
    'torso': ['hero1', 'hero2', 'fleja', 'kapral1', 'kapral2', 'oficer', 'partisan1', 'partisan2', 'straznik', 'tajniak',
              'wiesniak1', 'wiesniak2', 'wiesniak3', 'bogart', 'rene', 'general', 'kelnerka', 'pianista'],
    'legs': ['hero1', 'kapral1', 'oficer', 'partisan1', 'wiesniak1', 'wiesniak2', 'wiesniak3', 'pierre', 'kowal', 'bogart',
             'pianista'],
    'weapon': ['bayonet', 'parabellum', 'waltherppk', 'waltherppks', 'mauser', 'mauser98kb', 'strzelba', 'strzelbas',
               'sztucer', 'sztucers', 'mug', 'granat1'],
}
WCLASSES = {'empty', 'knife', 'pistol', 'rifle', 'mug'}

BACKGROUNDS = ['rynek', 'knajpa', 'knajpawinieta', 'lochy', 'cmentarz', 'church', 'antyk', 'przedzamcze', 'krypta',
               'katakumby', 'lasdomek', 'las1pro', 'las2pro', 'las3pro', 'las4pro', 'actTLO']

MUSIC = ['MENU', 'Act1', 'cementary', 'cementary2', 'restaurant', 'prison-slow', 'prison-battle', 'city', 'werble-akcja',
         'battle2', 'battle3-akcja', 'battle4', 'france-fin']


def log(*a):
    print(*a, flush=True)


def ensure(p):
    os.makedirs(p, exist_ok=True)
    return p


def rgb565(v):
    r = (v >> 11) & 31
    g = (v >> 5) & 63
    b = v & 31
    return np.dstack([(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)]).astype(np.uint8)


def read_text(path):
    raw = open(path, 'rb').read()
    return raw.decode('cp1251', errors='replace').replace('\r\n', '\n')


def parse_itx(path):
    out = {}
    txt = read_text(path)
    for m in re.finditer(r'^\s*([^\s=]+)\s*=\s*\[\[(.*?)\]\]', txt, re.M | re.S):
        out[m.group(1)] = m.group(2)
    return out


def load_texts():
    base = os.path.join(SRC, 'text', 'Russian')
    glob_t = {}
    per_level = {}
    for f in os.listdir(base):
        if not f.lower().endswith('.itx'):
            continue
        d = parse_itx(os.path.join(base, f))
        name = f[:-4].lower()
        if re.match(r'^[abcd]\d', name):
            per_level[name] = d
        else:
            glob_t.update(d)
    return glob_t, per_level


def bgz_load(path):
    d = open(path, 'rb').read()
    t = d[20]
    w, h = struct.unpack_from('<HH', d, 22)
    zs = struct.unpack_from('<f', d, 26)[0]
    if t == 1:
        pal = np.frombuffer(d[30:798], np.uint8).reshape(256, 3)
        idx = np.frombuffer(d[798:798 + w * h], np.uint8).reshape(h, w)
        z = np.frombuffer(d[798 + w * h:798 + 2 * w * h], np.uint8).reshape(h, w)
        rgb = pal[idx]
    else:
        v = np.frombuffer(d[30:30 + 2 * w * h], '<u2').reshape(h, w)
        z = np.frombuffer(d[30 + 2 * w * h:30 + 3 * w * h], np.uint8).reshape(h, w)
        rgb = rgb565(v)
    return rgb, z, zs


def do_backgrounds():
    out = ensure(os.path.join(DST, 'bg'))
    meta = {}
    for name in BACKGROUNDS:
        rgb, z, zs = bgz_load(os.path.join(SRC, 'graphic', 'Tla', name + '.bgz'))
        h, w = z.shape
        Image.fromarray(rgb).save(os.path.join(out, name + '.webp'), 'WEBP', quality=90, method=6)
        Image.fromarray(z, 'L').save(os.path.join(out, name + '_h.png'), 'PNG', optimize=True)
        meta[name] = {'w': w, 'h': h, 'zscale': round(zs, 3)}
        log('bg', name, w, h, zs)
    return meta


def rle(arr):
    flat = arr.flatten()
    out = []
    i = 0
    n = len(flat)
    while i < n:
        v = int(flat[i])
        j = i + 1
        while j < n and flat[j] == v:
            j += 1
        out.append(v)
        out.append(j - i)
        i = j
    return out


LUA_ASSIGN = re.compile(r'^\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\s*=\s*(.+?)\s*$')


def lua_value(s):
    s = s.strip()
    if s.startswith('[['):
        return s[2:s.rfind(']]')]
    if s.startswith('"'):
        return s[1:s.rfind('"')]
    try:
        v = float(s)
        return int(v) if v == int(v) and abs(v) < 1e9 else v
    except ValueError:
        return s


def parse_object(txt):
    fields = {}
    anchor = None
    poly = []
    for ln in txt.split('\n'):
        m = re.match(r'\s*GArea_SetPointA\([^,]+,\s*-2\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)', ln)
        if m:
            anchor = [round(float(m.group(1)), 1), round(float(m.group(2)), 1), round(float(m.group(3)), 3)]
            continue
        m = re.match(r'\s*GArea_AddPointA\([^,]+,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)', ln)
        if m:
            poly.append([round(float(m.group(1)), 1), round(float(m.group(2)), 1), round(float(m.group(3)), 3)])
            continue
        m = LUA_ASSIGN.match(ln)
        if m:
            fields[m.group(2)] = lua_value(m.group(3))
    return fields, anchor, poly


def speech_segments(key_path_base):
    files = []
    base = os.path.join(SRC, 'speech')
    for cand in glob.glob(key_path_base + '*.ogg'):
        files.append(cand)
    return files


def resolve_text(value, gtexts, ltexts, obj, field, tml=None):
    key = obj + '.' + field
    if key in ltexts:
        return ltexts[key]
    if isinstance(value, str) and value.startswith('_'):
        k = value[1:]
        if k in gtexts:
            return gtexts[k]
        if k in ltexts:
            return ltexts[k]
    if tml:
        k = tml + '_' + field
        if k in gtexts:
            return gtexts[k]
    return value


def do_levels(bgmeta):
    gtexts, per_level = load_texts()
    out = ensure(os.path.join(DST, 'data', 'levels'))
    speech_dir = os.path.join(SRC, 'speech')
    for lev in LEVELS:
        folder = os.path.join(SRC, 'levels', lev)
        ltexts = per_level.get(lev.lower(), {})
        data = {'id': lev, 'humans': [], 'areas': [], 'gfx': [], 'items': [], 'sounds': [], 'quests': []}
        for f in sorted(os.listdir(folder)):
            path = os.path.join(folder, f)
            base, ext = os.path.splitext(f)
            ext = ext.lower()
            if ext == '.map':
                d = open(path, 'rb').read()
                w, h = struct.unpack_from('<II', d, 0)
                grid = np.frombuffer(d[8:8 + w * h], np.uint8).reshape(h, w)
                data['map'] = {'w': w, 'h': h, 'rle': rle(grid)}
                continue
            if ext in ('.scr',):
                continue
            fields, anchor, poly = parse_object(read_text(path))
            if ext == '.clevel':
                gfx = str(fields.get('gfxObj', ''))
                bg = os.path.splitext(os.path.basename(gfx))[0] if gfx else ''
                data.update({
                    'name': fields.get('name', ''),
                    'bg': bg,
                    'zscale': fields.get('zscale', 10),
                    'music': fields.get('music', ''),
                    'battlemusic': fields.get('battlemusic', ''),
                    'safe': int(fields.get('issafe', 0) or 0),
                    'camera': [fields.get('x', 0), fields.get('y', 0)],
                })
                for k2, v2 in bgmeta.items():
                    if k2.lower() == bg.lower():
                        data['bg'] = k2
                        data['bgw'] = v2['w']
                        data['bgh'] = v2['h']
                continue
            if ext == '.chuman':
                tml = fields.get('tml', '')
                name = resolve_text(fields.get('txtName', ''), gtexts, ltexts, base, 'txtName', tml)
                desc = resolve_text(fields.get('txtDesc', ''), gtexts, ltexts, base, 'txtDesc', tml)
                h = {'id': base, 'tml': tml, 'x': round(float(fields.get('x', 0)), 1), 'y': round(float(fields.get('y', 0)), 1),
                     'ang': round(float(fields.get('ang', 0) or 0), 3), 'active': int(fields.get('active', 0) or 0),
                     'name': name, 'desc': desc, 'dlg': str(fields.get('dlgDesc', '') or ''), 'icon': fields.get('icon', 'Talk'),
                     'race': fields.get('race', ''), 'script': fields.get('script', ''), 'enemy': int(fields.get('enemy', 0) or 0),
                     'wmode': int(fields.get('wmode', 0) or 0), 'z': fields.get('z', 15)}
                for k in ('hitpoints', 'maxhitpoints', 'strength', 'agility', 'endurance', 'inteligence', 'charisma', 'luck',
                          'speed', 'level', 'experience', 'armorclass', 'team'):
                    if k in fields and fields[k] != '':
                        h[k] = fields[k]
                data['humans'].append(h)
                continue
            if ext == '.carea':
                txtName = resolve_text(fields.get('txtName', ''), gtexts, ltexts, base, 'txtName')
                txtDesc = resolve_text(fields.get('txtDesc', ''), gtexts, ltexts, base, 'txtDesc')
                dlg = str(fields.get('dlgDesc', '') or '')
                a = {'id': base, 'anchor': anchor, 'poly': [[p[0], p[1], p[2]] for p in poly], 'name': txtName, 'desc': txtDesc,
                     'dlg': dlg, 'icon': str(fields.get('icon', 'Zoom')), 'active': int(fields.get('active', 0) or 0),
                     'safe': int(fields.get('issafe', 0) or 0), 'ord': int(fields.get('ord', 2) or 2)}
                spk = os.path.join(speech_dir, lev.lower(), base + '-txtDesc')
                segs = sorted(os.path.basename(p)[:-4] for p in glob.glob(spk + '*.ogg'))
                if segs:
                    a['voice'] = lev.lower() + '/' + base + '-txtDesc'
                data['areas'].append(a)
                continue
            if ext == '.cgfx':
                data['gfx'].append({'id': base, 'obj': str(fields.get('gfxObj', '')), 'x': round(float(fields.get('x', 0)), 1),
                                    'y': round(float(fields.get('y', 0)), 1), 'frm': fields.get('frm', 0),
                                    'active': int(fields.get('active', 0) or 0)})
                continue
            if ext in ('.citem', '.chealth', '.cweapon', '.cammo', '.cwear'):
                data['items'].append({'id': base, 'cls': ext[1:], 'tml': fields.get('tml', ''), 'obj': str(fields.get('gfxObj', '')),
                                      'x': round(float(fields.get('x', 0)), 1), 'y': round(float(fields.get('y', 0)), 1),
                                      'active': int(fields.get('active', 1) or 0)})
                continue
            if ext == '.csound':
                data['sounds'].append({'id': base, 'snd': str(fields.get('sndObj', '')), 'x': round(float(fields.get('x', 0)), 1),
                                       'y': round(float(fields.get('y', 0)), 1), 'interval': fields.get('interval', 0),
                                       'vol': fields.get('vol', 100), 'mode': fields.get('mode', 0), 'rnd': fields.get('rnd_shift', 0),
                                       'active': int(fields.get('active', 0) or 0)})
                continue
            if ext == '.cquest':
                data['quests'].append({'id': base, 'x': fields.get('x', 0), 'y': fields.get('y', 0)})
                continue
        json.dump(data, open(os.path.join(out, lev + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        log('level', lev, len(data['humans']), 'humans', len(data['areas']), 'areas')


def parse_tml(path):
    txt = open(path, 'rb').read().decode('cp1250', errors='replace').replace('\r\n', '\n')
    out = {}
    for m in re.finditer(r'^\s*([A-Za-z_]\w*)\s*=\s*\[\[(.*?)\]\],', txt, re.M | re.S):
        out[m.group(1)] = m.group(2)
    for m in re.finditer(r'^\s*([A-Za-z_]\w*)\s*=\s*\{([^{}\n]*)\},', txt, re.M):
        out[m.group(1)] = [x for x in re.findall(r'\[\[(.*?)\]\]', m.group(2), re.S) if x != '']
    return out


def split_gender(s):
    m = re.match(r'^([MFNP])@(.*)$', s or '', re.I)
    if m:
        return m.group(2), m.group(1).upper()
    return s, 'M'


def do_templates():
    gtexts, _ = load_texts()
    base = os.path.join(SRC, 'logic', 'Templates')
    out = {'humans': {}, 'items': {}}
    for f in glob.glob(os.path.join(base, 'cHuman', '*.tml')):
        name = os.path.basename(f)[:-4]
        out['humans'][name] = parse_tml(f)
    for cls in ('cItem', 'cHealth', 'cWeapon', 'cAmmo', 'cWear'):
        for f in glob.glob(os.path.join(base, cls, '*.tml')):
            name = os.path.basename(f)[:-4]
            t = parse_tml(f)
            t['_class'] = cls
            nm = t.get('txtName', '')
            ds = t.get('txtDesc', '')
            if nm.startswith('_'):
                nm = gtexts.get(nm[1:], nm)
            if ds.startswith('_'):
                ds = gtexts.get(ds[1:], ds)
            nm, gender = split_gender(nm)
            t['ruName'] = nm
            t['ruDesc'] = ds
            t['gender'] = gender
            out['items'][cls + '/' + name] = t
    pre = open(os.path.join(base, 'prepost.lua'), 'rb').read().decode('cp1250', errors='replace')
    tables = {}
    for tname in ('DPrefix', 'DPostfix'):
        m = re.search(tname + r'\s*=\s*\{(.*?)\n\s*\}', pre, re.S)
        rows = []
        for r in re.findall(r'\{\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*\}', m.group(1)):
            key, mk, fk, nk, pk, eff = r
            rows.append({'key': key, 'M': gtexts.get(mk, ''), 'F': gtexts.get(fk, ''), 'N': gtexts.get(nk, ''),
                         'P': gtexts.get(pk, ''), 'eff': eff})
        tables[tname] = rows
    out['prefix'] = tables['DPrefix']
    out['postfix'] = tables['DPostfix']
    trees = open(os.path.join(base, 'trees.lua'), 'rb').read().decode('cp1250', errors='replace')
    out['treesLua'] = trees
    json.dump(out, open(os.path.join(ensure(os.path.join(DST, 'data')), 'templates.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    log('templates', len(out['humans']), 'humans', len(out['items']), 'items')


def parse_sp8(path):
    d = open(path, 'rb').read()
    pal = d[0x14:0x314]
    ndir = struct.unpack_from('<I', d, 0x314)[0]
    p = 0x318
    dirs = []
    for i in range(ndir):
        size = struct.unpack_from('<I', d, p + 16)[0]
        name = d[p + 20:p + 70].split(b'\0')[0].decode()
        fps, cnt = struct.unpack_from('<HH', d, p + 70)
        q = p + 74
        frames = []
        for k in range(cnt):
            w, h, ox, oy, a, b, c, fl, poff, z, psz = struct.unpack_from('<HHiiBBBfIII', d, q)
            frames.append((w, h, ox, oy, poff, psz, b | (c << 8), fl))
            q += 31
        dirs.append((name, fps, frames))
        p += size
    return np.frombuffer(pal, np.uint8).reshape(256, 3), dirs


def parse_inf(path):
    txt = open(path, 'rb').read().decode('cp1250', errors='replace')
    offs = {}
    for m in re.finditer(r'GFX_ASetOffset\(\s*-?\d+\s*,\s*"(\w+)"\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)', txt):
        offs[m.group(1).upper()] = [int(m.group(2)), int(m.group(3))]
    fps = None
    m = re.search(r'GFX_SetFPS\(\s*-?\d+\s*,\s*(\d+)', txt)
    if m:
        fps = int(m.group(1))
    return offs, fps


def pack(sizes, maxw=2048):
    area = sum((w + 1) * (h + 1) for w, h in sizes)
    width = 256
    while width * width < area and width < maxw:
        width *= 2
    widest = max(w for w, h in sizes) + 1
    width = max(width, widest)
    x = y = rowh = 0
    pos = []
    for w, h in sizes:
        if x + w > width:
            x = 0
            y += rowh + 1
            rowh = 0
        pos.append((x, y))
        x += w + 1
        rowh = max(rowh, h)
    return width, y + rowh, pos


def do_anims():
    anim_dir = os.path.join(SRC, 'anim')
    out = ensure(os.path.join(DST, 'anim'))
    infs = {}
    for f in os.listdir(anim_dir):
        if f.lower().endswith('.inf'):
            offs, fps = parse_inf(os.path.join(anim_dir, f))
            infs[f[:-4].lower()] = {'off': offs, 'fps': fps}
    pck = open(os.path.join(SRC, 'animdata.pck'), 'rb')
    index = {}
    total = 0
    for f in sorted(os.listdir(anim_dir)):
        low = f.lower()
        if not low.endswith('.sp8'):
            continue
        m = re.match(r'(.+?)_(.+?)_(head|torso|legs|weapon)_(.+)\.sp8$', low)
        if not m:
            continue
        anim, wc, part, skin = m.groups()
        if wc not in WCLASSES or skin not in SKINS[part]:
            continue
        key = anim + '_' + wc + '_' + part + '_' + skin
        pal, dirs = parse_sp8(os.path.join(anim_dir, f))
        trans = np.all(pal == np.array([219, 255, 209], np.uint8), axis=1)
        frames = []
        for dname, fps, frs in dirs:
            for fr in frs:
                frames.append((dname, fr))
        if not frames:
            continue
        sizes = [(fr[0], fr[1]) for _, fr in frames]
        W, H, pos = pack(sizes)
        img = np.zeros((H, W, 4), np.uint8)
        meta = {'fps': dirs[0][1], 'd': {}}
        for (dname, fr), (px, py) in zip(frames, pos):
            w, h, ox, oy, poff, psz, zbase, zf = fr
            pck.seek(poff)
            dec = zlib.decompress(pck.read(psz))
            idx = np.frombuffer(dec[:w * h], np.uint8).reshape(h, w)
            if len(dec) >= 2 * w * h:
                zp = np.frombuffer(dec[w * h:2 * w * h], np.uint8).reshape(h, w).astype(np.int32)
            else:
                zp = np.zeros((h, w), np.int32)
            rgba = np.zeros((h, w, 4), np.uint8)
            rgba[:, :, :3] = pal[idx]
            zq = (zp // 32) * 32 + 16
            rgba[:, :, 3] = np.where(trans[idx], 0, 1 + (zq * 254) // 255).astype(np.uint8)
            img[py:py + h, px:px + w] = rgba
            meta['d'].setdefault(dname.upper(), []).append([px, py, w, h, ox, oy, zbase, round(float(zf), 4)])
        Image.fromarray(img).save(os.path.join(out, key + '.webp'), 'WEBP', lossless=True, quality=80, method=4, exact=True)
        total += os.path.getsize(os.path.join(out, key + '.webp'))
        meta['w'] = W
        meta['h'] = H
        index[key] = meta
    offsets = {}
    for k, v in infs.items():
        offsets[k] = v
    json.dump({'sheets': index, 'inf': offsets}, open(os.path.join(ensure(os.path.join(DST, 'data')), 'anims.json'), 'w'),
              separators=(',', ':'))
    log('anims', len(index), 'sheets', round(total / 1e6, 1), 'MB')


def parse_spx(path):
    d = open(path, 'rb').read()
    nanim = struct.unpack_from('<I', d, 0x14)[0]
    p = 0x18
    anims = []
    for a in range(nanim):
        size = struct.unpack_from('<I', d, p + 16)[0]
        name = d[p + 20:p + 52].split(b'\0')[0].decode('cp1250', 'replace')
        fps, cnt = struct.unpack_from('<HH', d, p + 70)
        q = p + 74
        frames = []
        for k in range(cnt):
            ssize = struct.unpack_from('<I', d, q + 16)[0]
            w, h, hx, hy = struct.unpack_from('<HHii', d, q + 36)
            frames.append({'w': w, 'h': h, 'hx': hx, 'hy': hy, 'off': q + 48, 'size': ssize - 48})
            q += ssize
        anims.append({'name': name, 'fps': fps, 'frames': frames})
        p += size
    return d, anims


def spx_frame(d, f, mode):
    w, h = f['w'], f['h']
    n = w * h
    raw = d[f['off']:f['off'] + f['size']]
    bpp = f['size'] // max(1, n)
    if bpp >= 3:
        stride = bpp
        arr = np.frombuffer(raw[:n * stride], np.uint8).reshape(h, w, stride)
        v = arr[:, :, 0].astype(np.uint16) | (arr[:, :, 1].astype(np.uint16) << 8)
        return np.dstack([rgb565(v), arr[:, :, 2]])
    v = np.frombuffer(raw[:n * 2], '<u2').reshape(h, w)
    rgb = rgb565(v)
    if mode == 'add':
        a = np.full((h, w), 255, np.uint8)
    elif mode == 'key':
        a = np.where(v == 0, 0, 255).astype(np.uint8)
    else:
        a = np.full((h, w), 255, np.uint8)
    return np.dstack([rgb, a])


def spx_depth(d, f):
    w, h = f['w'], f['h']
    n = w * h
    bpp = f['size'] // max(1, n)
    if bpp < 5:
        return np.zeros((h, w), np.uint16)
    arr = np.frombuffer(d[f['off']:f['off'] + n * bpp], np.uint8).reshape(h, w, bpp)
    return arr[:, :, 3].astype(np.uint16) | (arr[:, :, 4].astype(np.uint16) << 8)


def convert_spx(rel, dst_key, mode='alpha', lossy=False, depth=False):
    path = os.path.join(SRC, 'graphic', rel)
    d, anims = parse_spx(path)
    frames = []
    for ai, a in enumerate(anims):
        for fi, f in enumerate(a['frames']):
            frames.append((ai, f))
    sizes = [(f['w'], f['h']) for _, f in frames]
    W, H, pos = pack(sizes, 4096)
    img = np.zeros((H, W, 4), np.uint8)
    zimg = np.zeros((H, W, 4), np.uint8)
    zimg[:, :, 3] = 255
    meta = {'anims': [], 'w': W, 'h': H, 'mode': mode}
    for a in anims:
        meta['anims'].append({'name': a['name'], 'fps': a['fps'], 'f': []})
    for (ai, f), (px, py) in zip(frames, pos):
        img[py:py + f['h'], px:px + f['w']] = spx_frame(d, f, mode)
        if depth:
            z = spx_depth(d, f)
            zimg[py:py + f['h'], px:px + f['w'], 0] = z >> 8
            zimg[py:py + f['h'], px:px + f['w'], 1] = z & 255
        meta['anims'][ai]['f'].append([px, py, f['w'], f['h'], f['hx'], f['hy']])
    outp = os.path.join(DST, 'gfx', dst_key + '.webp')
    ensure(os.path.dirname(outp))
    if lossy:
        Image.fromarray(img).save(outp, 'WEBP', quality=88, method=6)
    else:
        Image.fromarray(img).save(outp, 'WEBP', lossless=True, quality=80, method=4)
    if depth:
        Image.fromarray(zimg).save(os.path.join(DST, 'gfx', dst_key + '.z.webp'), 'WEBP', lossless=True, quality=100, method=4)
        meta['depth'] = 1
    return meta


GUI_LIST = [
    ('GUI/Panel/dol-sk1.spx', 'opaque'), ('GUI/Panel/gora-sk1.spx', 'opaque'), ('GUI/Panel/buttons-sk1.spx', 'alpha'),
    ('GUI/Panel/hp-sk1.spx', 'alpha'), ('GUI/Panel/paskimale-sk1.spx', 'alpha'), ('GUI/Panel/pasekbroni-sk1.spx', 'alpha'),
    ('GUI/Panel/podpasek-sk1.spx', 'alpha'), ('GUI/Panel/messscroll-sk1.spx', 'alpha'), ('GUI/Panel/spskills.spx', 'alpha'),
    ('GUI/Panel/spskillsglowa.spx', 'alpha'), ('GUI/Panel/johann.spx', 'alpha'), ('GUI/Panel/zygmuntstrongman.spx', 'alpha'),
    ('GUI/Panel/zygmuntthief.spx', 'alpha'), ('GUI/Panel/zygmuntinteligent.spx', 'alpha'),
    ('GUI/Inventory/invpanel-sk1.spx', 'opaque'), ('GUI/Inventory/invtlostat-sk1.spx', 'opaque'),
    ('GUI/Inventory/invtlodziennik-sk1.spx', 'opaque'), ('GUI/Inventory/invtlomapa-sk1.spx', 'opaque'),
    ('GUI/Inventory/invtloplecak3-sk1.spx', 'opaque'), ('GUI/Inventory/invtloplecak4-sk1.spx', 'opaque'),
    ('GUI/Inventory/invtloplecak5-sk1.spx', 'opaque'), ('GUI/Inventory/invtloplecak6-sk1.spx', 'opaque'),
    ('GUI/Inventory/invtloplecak7-sk1.spx', 'opaque'), ('GUI/Inventory/invtloplecak8-sk1.spx', 'opaque'),
    ('GUI/Inventory/invtloplecak9-sk1.spx', 'opaque'), ('GUI/Inventory/invzakdziennik-sk1.spx', 'alpha'),
    ('GUI/Inventory/invzakmapa-sk1.spx', 'alpha'), ('GUI/Inventory/invzakplecak-sk1.spx', 'alpha'),
    ('GUI/Inventory/invzakpostac-sk1.spx', 'alpha'), ('GUI/Inventory/invzakstat-sk1.spx', 'alpha'),
    ('GUI/Inventory/invzakziemia-sk1.spx', 'alpha'), ('GUI/Inventory/potwierdz-sk1.spx', 'alpha'),
    ('GUI/Inventory/statplus.spx', 'alpha'), ('GUI/Inventory/statminus.spx', 'alpha'),
    ('GUI/Inventory/johann.spx', 'alpha'), ('GUI/Inventory/zygmuntstrongman.spx', 'alpha'),
    ('GUI/Inventory/zygmuntthief.spx', 'alpha'), ('GUI/Inventory/zygmuntinteligent.spx', 'alpha'),
    ('GUI/LOADSAVE/loadsave-sk1.spx', 'opaque'), ('GUI/LOADSAVE/gradient.spx', 'opaque'), ('GUI/LOADSAVE/exit.spx', 'alpha'),
    ('GUI/OPTIONS/options-sk1.spx', 'opaque'), ('GUI/OPTIONS/checkbox.spx', 'alpha'), ('GUI/OPTIONS/suwak.spx', 'alpha'),
    ('GUI/OPTIONS/exit.spx', 'alpha'),
    ('GUI/SELECT/karta.spx', 'opaque'), ('GUI/SELECT/pasek.spx', 'alpha'), ('GUI/SELECT/plus1.spx', 'alpha'),
    ('GUI/SELECT/plus2.spx', 'alpha'), ('GUI/SELECT/minus1.spx', 'alpha'), ('GUI/SELECT/minus2.spx', 'alpha'),
    ('GUI/SELECT/ok1.spx', 'alpha'), ('GUI/SELECT/ok2.spx', 'alpha'), ('GUI/SELECT/rog1.spx', 'alpha'),
    ('GUI/SELECT/rog2.spx', 'alpha'), ('GUI/SELECT/strongman.spx', 'alpha'), ('GUI/SELECT/thief.spx', 'alpha'),
    ('GUI/SELECT/inteligent.spx', 'alpha'),
    ('GUI/Menu/PANELGLOWNY.spx', 'opaque'), ('GUI/Menu/BUTTONZAPALONY.spx', 'alpha'), ('GUI/Menu/BUTTONZGASZONY.spx', 'alpha'),
    ('GUI/Menu/dinks.spx', 'alpha'), ('GUI/Menu/credits.spx', 'alpha'),
    ('GUI/POPUP/act1.spx', 'opaque'), ('GUI/POPUP/act2.spx', 'opaque'),
    ('GUI/kursor.spx', 'alpha'), ('GUI/window-sk1.spx', 'alpha'), ('GUI/windowred-sk1.spx', 'alpha'),
    ('GUI/scroll-sk1.spx', 'alpha'), ('GUI/cienhuman.spx', 'alpha'), ('GUI/ciengranat.spx', 'alpha'),
    ('GUI/znacznik.spx', 'alpha'), ('GUI/marker_hero.spx', 'alpha'), ('GUI/marker_npc.spx', 'alpha'),
    ('GUI/sp_pyt.spx', 'alpha'), ('GUI/sp_wyk.spx', 'alpha'), ('GUI/spdymekb.spx', 'alpha'), ('GUI/spdymekf.spx', 'alpha'),
    ('GUI/skillsp.spx', 'alpha'), ('GUI/pineza.spx', 'alpha'), ('GUI/loading.spx', 'opaque'), ('GUI/cutscene.spx', 'opaque'),
    ('GUI/Inventory/wiatrak.spx', 'alpha'), ('GUI/ciezarowka.spx', 'alpha'),
] + [('Tla/MAPY/' + n + '.spx', 'alpha') for n in (
    'rynek', 'knajpa', 'lochy', 'cmentarz', 'church', 'antyk', 'przedzamcze', 'krypta', 'katakumby', 'lasdomek',
    'las1pro', 'las2pro', 'las3pro', 'las4pro', 'aregion', 'europe')]

FX_LIST = [
    ('FX/glowylatarni.spx', 'add'), ('FX/dympeta.spx', 'alpha'), ('FX/popiolka1.spx', 'alpha'), ('FX/popiolka2.spx', 'alpha'),
    ('FX/popiolka3.spx', 'alpha'), ('FX/parawodna.spx', 'add'), ('FX/lamapanafta.spx', 'add'), ('FX/flash.spx', 'alpha'),
    ('FX/krew.spx', 'alpha'), ('FX/krew1.spx', 'alpha'), ('FX/krew2.spx', 'alpha'), ('FX/krew3.spx', 'alpha'),
    ('FX/hitkrew.spx', 'alpha'), ('FX/granat1.spx', 'alpha'), ('FX/grdym3.spx', 'alpha'), ('FX/grdym4.spx', 'add'),
    ('FX/dymziemia.spx', 'add'), ('FX/dymziemia2.spx', 'add'), ('FX/dymek.spx', 'add'), ('FX/dymek2.spx', 'add'),
    ('FX/dymek3.spx', 'add'), ('FX/ogien.spx', 'alpha'), ('FX/death.spx', 'alpha'), ('FX/2.spx', 'alpha'), ('FX/1.spx', 'add'),
    ('FX/wleb.spx', 'alpha'), ('FX/pck.spx', 'alpha'), ('FX/pck-weapon.spx', 'alpha'), ('FX/furysmall.spx', 'alpha'),
    ('FX/furybig.spx', 'alpha'),
    ('Sceneria/A01/fontanna.spx', 'alpha'), ('Sceneria/A01/ciezarowka.spx', 'alpha'), ('Sceneria/A03/drzwi.spx', 'opaque'),
    ('Sceneria/A03/krata.spx', 'opaque'), ('Sceneria/A03/kumpel.spx', 'opaque'), ('Sceneria/A03/winkodol.spx', 'opaque'),
    ('Sceneria/A05/churchbezdziury.spx', 'opaque'), ('Sceneria/kratawdol.spx', 'opaque'),
    ('Sceneria/ogniki/ognik.spx', 'alpha'), ('Sceneria/ogniki/ogienek.spx', 'alpha'),
    ('Sceneria/ogniki/plomyczek.spx', 'alpha'), ('Sceneria/ogniki/pomyk.spx', 'alpha'),
]


def do_gfx():
    meta = {}
    for rel, mode in GUI_LIST + FX_LIST:
        path = os.path.join(SRC, 'graphic', rel)
        if not os.path.exists(path):
            alt = [p for p in glob.glob(os.path.join(os.path.dirname(path), '*')) if os.path.basename(p).lower() == os.path.basename(path).lower()]
            if not alt:
                log('missing', rel)
                continue
            rel = os.path.relpath(alt[0], os.path.join(SRC, 'graphic')).replace('\\', '/')
        key = os.path.splitext(rel)[0].lower().replace('\\', '/')
        lossy = mode == 'opaque' and ('ciezarowka' not in key)
        meta[key] = convert_spx(rel, key, mode, lossy)
    convert_wear(meta)
    for f in glob.glob(os.path.join(SRC, 'graphic', 'Przedmioty', '*.spx')):
        rel = os.path.relpath(f, os.path.join(SRC, 'graphic')).replace('\\', '/')
        key = os.path.splitext(rel)[0].lower()
        try:
            meta[key] = convert_spx(rel, key, 'alpha')
        except Exception as e:
            log('item fail', rel, e)
    for f in glob.glob(os.path.join(SRC, 'graphic', 'Sceneria', '*.spx')):
        rel = os.path.relpath(f, os.path.join(SRC, 'graphic')).replace('\\', '/')
        key = os.path.splitext(rel)[0].lower()
        if key in meta:
            continue
        if os.path.getsize(f) > 4_000_000:
            continue
        try:
            meta[key] = convert_spx(rel, key, 'alpha')
        except Exception as e:
            log('scenery fail', rel, e)
    json.dump(meta, open(os.path.join(ensure(os.path.join(DST, 'data')), 'gfx.json'), 'w'), separators=(',', ':'))
    total = sum(os.path.getsize(p) for p in glob.glob(os.path.join(DST, 'gfx', '**', '*.webp'), recursive=True))
    log('gfx', len(meta), round(total / 1e6, 1), 'MB')


def convert_wear(meta):
    for f in glob.glob(os.path.join(SRC, 'graphic', 'GUI', 'WEAR', '*.spx')):
        rel = os.path.relpath(f, os.path.join(SRC, 'graphic')).replace('\\', '/')
        key = os.path.splitext(rel)[0].lower()
        meta[key] = convert_spx(rel, key, 'alpha', depth=True)


def do_wear():
    path = os.path.join(DST, 'data', 'gfx.json')
    meta = json.load(open(path))
    convert_wear(meta)
    json.dump(meta, open(path, 'w'), separators=(',', ':'))
    log('wear', sum(1 for k in meta if k.startswith('gui/wear/')))


def ffmpeg(src, dst, args):
    ensure(os.path.dirname(dst))
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src] + args + [dst], capture_output=True)
    if r.returncode != 0:
        log('audio skip', os.path.relpath(src, SRC))
        if os.path.exists(dst):
            os.remove(dst)
        return False
    return True


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path],
                       capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 3)
    except ValueError:
        return 0


def do_audio():
    music_out = ensure(os.path.join(DST, 'music'))
    for m in MUSIC:
        src = os.path.join(SRC, 'music', m + '.ogg')
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(music_out, m.lower() + '.ogg'))
    sound_out = ensure(os.path.join(DST, 'sound'))
    durs = {}
    for f in glob.glob(os.path.join(SRC, 'sound', '**', '*'), recursive=True):
        if os.path.isdir(f):
            continue
        rel = os.path.relpath(f, os.path.join(SRC, 'sound')).replace('\\', '/')
        base, ext = os.path.splitext(rel)
        if ext.lower() not in ('.wav', '.mp3'):
            continue
        if base.lower().startswith('jingle/') and 'jingle3' not in base.lower() and 'jingle1' not in base.lower():
            continue
        dst = os.path.join(sound_out, base.lower() + '.ogg')
        if not os.path.exists(dst) and not ffmpeg(f, dst, ['-c:a', 'libvorbis', '-q:a', '3']):
            continue
        durs['sound/' + base.lower()] = duration(dst)
    for f in glob.glob(os.path.join(SRC, 'Waves', '**', '*'), recursive=True):
        if os.path.isdir(f):
            continue
        rel = os.path.relpath(f, os.path.join(SRC, 'Waves')).replace('\\', '/')
        base, ext = os.path.splitext(rel)
        if ext.lower() not in ('.wav', '.mp3', '.ogg'):
            continue
        if not (rel.lower().startswith('hero/') or rel.lower().startswith('johann/')):
            continue
        dst = os.path.join(sound_out, 'waves', base.lower() + '.ogg')
        if not os.path.exists(dst) and not ffmpeg(f, dst, ['-c:a', 'libvorbis', '-q:a', '3']):
            continue
        durs['sound/waves/' + base.lower()] = duration(dst)
    speech_out = ensure(os.path.join(DST, 'speech'))
    keep_dirs = {'a01_rynek', 'a02_caferene', 'a03_lochy', 'a04_cmentarz', 'a05_church', 'a06_antyk', 'a07_przedzamcze',
                 'a08_kryptamala', 'a09_katakumby'}
    top_prefix = ('rozm', 'wart', 'siedz', 'gadka', 'intro', 'death', 'kryp', 'cos', 'przed', 'jeszcze', 'akak', 'wylaz',
                  'maly', 'a01_', 'a03_', 'a05_', 'a09_', 'antyk', 'bosswait', 'nieStrzelac'.lower(), 'nowywpis', 'dupa', 'lolo',
                  'kiszka', 'zamkniete', 'dlaczego')
    for f in glob.glob(os.path.join(SRC, 'speech', '**', '*.ogg'), recursive=True):
        rel = os.path.relpath(f, os.path.join(SRC, 'speech')).replace('\\', '/')
        low = rel.lower()
        parts = low.split('/')
        if len(parts) > 1 and parts[0] not in keep_dirs:
            continue
        if len(parts) == 1 and not low.startswith(top_prefix):
            continue
        dst = os.path.join(speech_out, low)
        ensure(os.path.dirname(dst))
        shutil.copyfile(f, dst)
        durs['speech/' + low[:-4]] = duration(dst)
    json.dump(durs, open(os.path.join(ensure(os.path.join(DST, 'data')), 'audio.json'), 'w'), separators=(',', ':'))
    log('audio', len(durs))


def do_texts():
    gtexts, per_level = load_texts()
    out = {'global': gtexts, 'levels': {k: v for k, v in per_level.items() if k.startswith('a')}}
    notes = read_text(os.path.join(SRC, 'text', 'Russian', 'notes.txt'))
    out['notesRaw'] = notes
    for f in ('itemdesc.txt', 'statdesc.txt', 'help.txt'):
        out[f.split('.')[0] + 'Raw'] = read_text(os.path.join(SRC, 'text', 'Russian', f))
    json.dump(out, open(os.path.join(ensure(os.path.join(DST, 'data')), 'texts-original.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    log('texts', len(gtexts))


if __name__ == '__main__':
    stages = sys.argv[1:] or ['bg', 'levels', 'templates', 'texts', 'gfx', 'anims', 'audio']
    bgmeta = None
    if 'bg' in stages:
        bgmeta = do_backgrounds()
        json.dump(bgmeta, open(os.path.join(ensure(os.path.join(DST, 'data')), 'backgrounds.json'), 'w'), separators=(',', ':'))
    if 'levels' in stages:
        if bgmeta is None:
            bgmeta = json.load(open(os.path.join(DST, 'data', 'backgrounds.json')))
        do_levels(bgmeta)
    if 'templates' in stages:
        do_templates()
    if 'texts' in stages:
        do_texts()
    if 'gfx' in stages:
        do_gfx()
    if 'wear' in stages:
        do_wear()
    if 'anims' in stages:
        do_anims()
    if 'audio' in stages:
        do_audio()
