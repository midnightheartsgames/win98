import io
import json
import os
import re
import shutil
import struct
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'content', 'Legion Arena')
DATA = os.path.join(SRC, 'data')
DST = os.path.join(ROOT, 'content', 'legion')

UNITS = {
    'peasant': ('WHITEPEASANT', 'WesternPeasant'),
    'tunicmilitia': ('TUNICMILITIA', 'TunicMilitia'),
    'togamilitia': ('TOGAMILITIA', 'TogaMilitia'),
    'auxilia': ('AUXILIA', 'Auxilliary'),
    'celticwarriors': ('CELTICWARRIORS', 'CelticLightWarrior'),
    'javelinmen': ('JAVELINMEN', 'Javelinmen'),
    'shieldjav': ('SHIELDEDJAVELINMEN', 'ShieldJavelinmen'),
    'velites': ('VELITES', 'Velites'),
    'westarchers': ('WESTERNARCHERS', 'WesternArchers'),
    'auxarchers': ('AUXILIARYARCHERS', 'AuxilliaryArcher'),
    'levyspear': ('WESTERNLEVYSPEARMEN', 'WesternLevySpearmen'),
    'hastati': ('HASTATI', 'Hastati'),
    'legionary': ('LEGIONARY', 'Legionary'),
    'praetorian': ('PRAETORIAN', 'Praetorian'),
    'fanatic': ('NAKEDFANATIC', 'NakedFanatic'),
    'westlc': ('WESTERNLC', 'WesternLightCavalry'),
    'westnobles': ('WESTERNNOBLES', 'WesternNoble'),
    'auxcav': ('AUXILIARYCAVALRY', 'AuxilliaryCavalry'),
    'celtnobles': ('CELTICNOBLES', 'CelticNoble'),
    'elephant': ('ELEPHANT', 'Elephant'),
    'legate': ('ROMANLEGATE', 'RomanLegate'),
    'gallicgeneral': ('GALLICGENERAL', 'CelticGeneral'),
    'celtveterans': ('CELTICVETERANS', 'CelticVeteran'),
    'princeps': ('PRINCEPE', 'Princepe'),
    'triarii': ('TRIARI', 'Triari'),
}

MAPS = {
    'plains1': dict(bmf='plains1', macro='Plains1', sky='Plains1-Skyline-&', trees=['Generic-Oak-Trees-&-@', 'Plains1-trees-&@'], detail='Plains1-ground1', rock='Plains1-rock', grass='plains1-GRASS', tuft='plains1-tuft-&-@', txt='Plains1', forest=(0.78, 0.08)),
    'plains2': dict(bmf='plains2', macro='Plains2', sky='Plains1-Skyline-&', trees=['Generic-Oak-Trees-&-@', 'Plains1-trees-&@'], detail='Plains2-ground1', rock='Plains2-rocky', grass='plains2-GRASS', tuft='plains2-tuft-&-@', txt='Plains2', forest=(0.8, 0.07)),
    'snowy1': dict(bmf='snowy1', macro='Snowy1', sky='Snowy1-sky-&', trees=['Snowy1-trees-&@', 'Snowy1-trees2-&@'], detail='Snowy1-ground1', rock='Snowy1-ground3', grass=None, tuft='Snowy1-tuft-&', txt='Snowy1', forest=(0.72, 0.1)),
    'snowy2': dict(bmf='snowy2', macro='Snowy2', sky='Snowy1-sky-&', trees=['Snowy2-trees-&-@'], detail='Snowy2-ground1', rock='Snowy2-rock', grass=None, tuft='Snowy2-tuft-&-@', txt='Snowy2', forest=(0.72, 0.1)),
    'farmland': dict(bmf='farmland', macro='Farmland', sky='Plains1-Skyline-&', trees=['Farmland-trees-&@', 'Generic-Oak-Trees-&-@'], detail='Farmland-ground1', rock='Plains1-rock', grass='farmland-GRASS', tuft='plains1-tuft-&-@', wheat='Farmland-wheat-&-@', txt='Farmland', forest=(0.78, 0.08)),
    'marshland': dict(bmf='marshland', macro='Marshland', sky='Marshland-skyline&', trees=['Generic-Oak-Trees-&-@', 'Plains1-trees-&@'], detail='Marshland-ground1', rock='Marshland-ground3', grass='marshland-GRASS', tuft='marshland-tuft-&-@', txt='Marshland', forest=(0.7, 0.12)),
    'river': dict(bmf='river', macro='River', sky='River-skyline&', trees=['River2-trees-&@', 'Generic-Oak-Trees-&-@'], detail='River-grass1', rock='River-rock', grass='plains1-GRASS', tuft='plains1-tuft-&-@', txt='River', forest=(0.8, 0.07)),
    'river2': dict(bmf='river2', macro='River2', sky='River2-sky-&', trees=['River2-trees-&@', 'Plains1-trees-&@'], detail='River2-Ground', rock='River2-rock', grass='river2-GRASS', tuft='river2-tuft-&-@', txt='River2', forest=(0.78, 0.08)),
    'plateau': dict(bmf='plateau', macro='Plateau', sky='Plateau-Skyline&', trees=['Canyon-flora-@&', 'Generic-Oak-Trees-&-@'], detail='Plateau-grass1', rock='Plateau-rocks', grass='MediumArid1-GRASS', tuft='plains1-tuft-&-@', txt='plateau', forest=(0.75, 0.09)),
    'mediumplains1': dict(bmf='MediumPlains1', macro='MediumPlains1', sky='Canyon-Skyline&', trees=['Generic-Oak-Trees-&-@', 'Plains1-trees-&@', 'Farmland-trees-&@'], detail='Canyon-grass1', rock='Plains1-rock', grass='MediumPlains1-GRASS', tuft='plains1-tuft-&-@', txt='MediumPlains1', forest=(0.8, 0.07)),
    'mediumfarmlands': dict(bmf='MediumFarmlands', macro='MediumFarmlands', sky='MediumFarmlands-Skyline&', trees=['MediumFarmland-trees-&@', 'Farmland-trees-&@', 'Generic-Oak-Trees-&-@'], detail='Canyon-grass1', rock='Plains1-rock', grass='MediumFarmlands-GRASS', tuft='plains1-tuft-&-@', wheat='Farmland-wheat-&-@', txt='MediumFarmlands', forest=(0.76, 0.09)),
    'mediumarid1': dict(bmf='MediumArid1', macro='MediumArid1', sky='MediumArid1-Skyline&', trees=['Canyon-flora-@&', 'Generic-Oak-Trees-&-@'], detail='Plateau-grass2', rock='MediumArid1-rocky', grass='MediumArid1-GRASS', tuft='plains1-tuft-&-@', txt='MediumArid1', forest=(0.72, 0.1)),
    'mediumriver1': dict(bmf='MediumRiver1', macro='MediumRiver1', sky='Plains1-Skyline-&', trees=['Plains1-trees-&@', 'Generic-Oak-Trees-&-@'], detail='MediumCoastal1-ground', rock='River2-rock', grass='MediumRiver1-GRASS', tuft='plains1-tuft-&-@', txt='MediumRiver1', forest=(0.78, 0.08)),
    'mediumcoastal1': dict(bmf='MediumCoastal1', macro='MediumCoastal1', sky='MediumCoastal1-Skyline&', trees=['Plains1-trees-&@', 'Generic-Oak-Trees-&-@', 'Canyon-flora-@&'], detail='MediumCoastal1-ground', rock='MediumCoastal1-rockyground', grass='MediumCoastal1-GRASS', tuft='plains1-tuft-&-@', txt='MediumCoastal1', forest=(0.78, 0.08)),
    'mediumcoastalnight': dict(bmf='MediumCoastalNight', macro='MediumCoastalNight', sky='MediumCoastalNight-Skyline&', trees=['MediumCoastalNight-Trees-&-@', 'Canyon-flora-@&'], detail='MediumCoastal1-ground', rock='MediumCoastal1-rockyground', grass='MediumCoastalNight-GRASS', tuft='plains1-tuft-&-@', txt='MediumCoastalNight', forest=(0.74, 0.1)),
    'mediumsnowy1': dict(bmf='Medium-Snowy1', macro='MEDIUM-SNOWY1', sky='Snowy1-sky-&', trees=['Snowy2-trees-&-@', 'Snowy1-trees-&@'], detail='Snowy2-ground1', rock='Medium-Snowy1-cliffs', grass=None, tuft='Snowy2-tuft-&-@', txt='Medium-Snowy1', forest=(0.72, 0.1)),
    'canyon': dict(bmf='canyon', macro='Canyon', sky='Canyon-Skyline&', trees=['Canyon-flora-@&', 'Generic-Oak-Trees-&-@'], detail='Canyon-grass1', rock='Canyon-cliff', grass=None, tuft='Canyon-tuft-&-@', txt='Canyon', forest=(0.75, 0.09)),
    'bay': dict(bmf='bay', macro='Bay', sky='Bay-Skyline-&', trees=['Bay-trees1-&-@', 'Generic-Oak-Trees-&-@'], detail='Bay-ground1', rock='Bay-rocks', grass='Bay-GRASS', tuft='Bay-tuft-&-@', txt='Bay', forest=(0.78, 0.08)),
    'beach': dict(bmf='beach', macro='Beach', sky='Beach-Skyline&', trees=['Generic-Oak-Trees-&-@', 'Canyon-flora-@&'], detail='Beach-sand', rock='Beach-rock', grass='Beach-GRASS', tuft='Beach-tuft-&-@', txt='Beach', forest=(0.78, 0.08)),
}

ANIM_SLOTS = 19


def ci(dirn, name):
    low = {f.lower(): f for f in os.listdir(dirn)}
    key = name.lower()
    if key not in low:
        raise FileNotFoundError(os.path.join(dirn, name))
    return os.path.join(dirn, low[key])


def ensure(path):
    os.makedirs(path, exist_ok=True)
    return path


def read_xam(path):
    b = open(path, 'rb').read()
    tri_count, vert_count = struct.unpack_from('<2i', b, 0)
    slots = struct.unpack_from('<%di' % ANIM_SLOTS, b, 8)
    idx = np.frombuffer(b[136:136 + 6 * tri_count], dtype='<u2').reshape(tri_count, 3)
    name_start = b.rfind(b'\x00', 0, len(b) - 1) + 1
    name = b[name_start:]
    p = 136 + 6 * tri_count
    frames = []
    table = []
    uv = None
    for ticks in slots:
        if ticks == 0:
            table.append((0, 0, 0))
            continue
        end = b.find(name, p)
        size = end + len(name) - p
        n = (size - 4 * vert_count - 2 - len(name)) // (8 * vert_count)
        pos = np.frombuffer(b[p:p + n * vert_count * 6], dtype='<i2').reshape(n, vert_count, 3)
        uv_off = p + n * vert_count * 8
        uv = np.frombuffer(b[uv_off:uv_off + 4 * vert_count], dtype='<u2').reshape(vert_count, 2)
        table.append((sum(len(f) for f in frames), n, ticks))
        frames.append(pos)
        p = end + len(name)
    return dict(V=vert_count, T=tri_count, idx=idx, uv=uv, frames=np.concatenate(frames, axis=0), table=table, tex=name[:-1].decode('latin1'))


def write_lgm(model, path):
    V, T = model['V'], model['T']
    F = len(model['frames'])
    head = bytearray(b'LGM1')
    head += struct.pack('<4H', V, T, F, ANIM_SLOTS)
    for start, count, ticks in model['table']:
        head += struct.pack('<3H', start, count, ticks)
    while len(head) % 4:
        head += b'\x00'
    body = model['idx'].astype('<u2').tobytes() + model['uv'].astype('<u2').tobytes()
    if len(body) % 4:
        body += b'\x00' * (4 - len(body) % 4)
    body += model['frames'].astype('<i2').tobytes()
    open(path, 'wb').write(bytes(head) + body)
    return F


def dds_image(name):
    return Image.open(ci(os.path.join(DATA, 'Battle', 'Textures'), name + '.dds'))


def convert_units(manifest):
    units_dir = os.path.join(DATA, 'Battle', 'Units')
    ensure(os.path.join(DST, 'models'))
    ensure(os.path.join(DST, 'tex', 'units'))
    out = {}
    for key, (base, portrait) in UNITS.items():
        lod = None
        for suffix in ('', '_1'):
            try:
                lod = ci(units_dir, 'ANIM_%s%s.XAM' % (base, suffix))
                break
            except FileNotFoundError:
                continue
        model = read_xam(lod)
        frames = write_lgm(model, os.path.join(DST, 'models', key + '.lgm'))
        tex = os.path.splitext(model['tex'])[0]
        variants = 0
        for i, suffix in enumerate(['', '-000', '-001', '-002', '-003', '-004', '-005', '-006']):
            try:
                im = dds_image(tex + suffix).convert('RGB').resize((512, 512), Image.LANCZOS)
            except FileNotFoundError:
                break
            im.save(os.path.join(DST, 'tex', 'units', '%s-%d.jpg' % (key, i)), quality=86)
            variants += 1
        ys = model['frames'][:, :, 1]
        out[key] = dict(model='models/%s.lgm' % key, V=model['V'], T=model['T'], F=frames, variants=variants,
                        anims=[list(t) for t in model['table']], height=int(np.percentile(ys.max(axis=1), 50)), portrait=portrait)
        print('unit', key, model['V'], model['T'], frames, variants)
    manifest['units'] = out


def extract_sprites(im):
    a = np.asarray(im.convert('RGBA'))[:, :, 3]
    h, w = a.shape
    rects = []
    halves = [(0, w // 2), (w // 2, w)]
    for x0, x1 in halves:
        sub = a[:, x0:x1] > 40
        rows = sub.mean(axis=1)
        valid = (rows > 0.002) & (rows < 0.97)
        solid_rows = np.where(rows >= 0.97)[0]
        limit = solid_rows.min() if len(solid_rows) else h
        ys = np.where(valid[:limit])[0]
        if len(ys) < 8:
            continue
        cols = sub[ys.min():ys.max() + 1].mean(axis=0)
        xs = np.where(cols > 0.002)[0]
        if len(xs) < 4:
            continue
        rects.append([int(x0 + xs.min()), int(ys.min()), int(x0 + xs.max() + 1), int(ys.max() + 1)])
    return rects


def read_heights(bmf):
    b = open(ci(os.path.join(DATA, 'Battle', 'Maps'), bmf + '.bmf'), 'rb').read()
    n0 = struct.unpack_from('<i', b, 4)[0]
    W = int(round(((n0 - 32) / 4) ** 0.5))
    return np.frombuffer(b[40:40 + W * W * 4], dtype='<f4').reshape(W, W).copy(), W


def read_map_txt(name):
    lines = [l.strip() for l in open(ci(os.path.join(DATA, 'Battle', 'Maps'), name + '.txt'), 'r', encoding='latin1').read().splitlines()]
    vals = [l for l in lines if l]
    nums = [[float(x) for x in l.split()] for l in vals]
    return dict(fog=nums[0], fogStart=nums[1][0], fogEnd=nums[2][0], sunDir=nums[3], sun=nums[4], ambient=nums[5], unitDir=nums[6], unitSun=nums[7], unitAmbient=nums[8])


def read_optional(path):
    try:
        return open(path, 'r', encoding='latin1').read()
    except OSError:
        return None


def forest_density(macro, thr, var_min):
    im = macro.convert('RGB').resize((256, 256), Image.BILINEAR)
    a = np.asarray(im).astype(np.float32) / 255
    lum = a.mean(axis=2)
    g = Image.fromarray((lum * 255).astype(np.uint8))
    blur = np.asarray(g.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    var = np.asarray(Image.fromarray((np.abs(lum - blur) * 255 * 4).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    wide = np.asarray(g.filter(ImageFilter.GaussianBlur(24))).astype(np.float32) / 255
    rel = blur / (wide + 1e-3)
    score = np.clip((thr - rel) / 0.12, 0, 1) * np.clip((var - var_min) / 0.08 + 0.5, 0, 1)
    score = np.asarray(Image.fromarray((score * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    return score.clip(0, 255).astype(np.uint8)


def convert_maps(manifest, only=None):
    maps_dir = os.path.join(DATA, 'Battle', 'Maps')
    out = dict(manifest.get('maps', {}))
    for key, cfg in MAPS.items():
        if only and key not in only:
            continue
        d = ensure(os.path.join(DST, 'maps', key))
        h, W = read_heights(cfg['bmf'])
        h.astype('<f4').tofile(os.path.join(d, 'height.bin'))
        macro = dds_image(cfg['macro'])
        macro.convert('RGB').resize((1024, 1024), Image.LANCZOS).save(os.path.join(d, 'macro.jpg'), quality=88)
        ensure(os.path.join(DST, 'ui', 'maps'))
        macro.convert('RGB').resize((256, 256), Image.LANCZOS).save(os.path.join(DST, 'ui', 'maps', key + '.jpg'), quality=85)
        dds_image(cfg['detail']).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(d, 'detail.jpg'), quality=85)
        dds_image(cfg['rock']).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(d, 'rock.jpg'), quality=85)
        dds_image(cfg['sky']).convert('RGB').resize((1024, 512), Image.LANCZOS).save(os.path.join(d, 'sky.jpg'), quality=86)
        sprites = []
        atlas_parts = []
        for tname in cfg['trees']:
            tim = dds_image(tname).convert('RGBA')
            for r in extract_sprites(tim):
                atlas_parts.append(tim.crop(r))
        atlas_w = 1024
        cell_w = atlas_w // max(1, len(atlas_parts))
        atlas = Image.new('RGBA', (atlas_w, 512), (0, 0, 0, 0))
        for i, part in enumerate(atlas_parts):
            pw, ph = part.size
            s = min(cell_w / pw, 512 / ph)
            nw, nh = max(1, int(pw * s)), max(1, int(ph * s))
            part = part.resize((nw, nh), Image.LANCZOS)
            x = i * cell_w + (cell_w - nw) // 2
            atlas.paste(part, (x, 512 - nh))
            sprites.append(dict(u0=x / atlas_w, v0=(512 - nh) / 512, u1=(x + nw) / atlas_w, v1=1.0, aspect=pw / ph))
        atlas = bleed(atlas)
        atlas.save(os.path.join(d, 'trees.webp'), quality=88, method=6)
        if cfg.get('grass'):
            bleed(dds_image(cfg['grass']).convert('RGBA')).save(os.path.join(d, 'grass.webp'), quality=88, method=6)
        try:
            tuft = dds_image(cfg['tuft']).convert('RGBA')
            bleed(tuft).save(os.path.join(d, 'tuft.webp'), quality=88, method=6)
            has_tuft = True
        except FileNotFoundError:
            has_tuft = False
        if cfg.get('wheat'):
            bleed(dds_image(cfg['wheat']).convert('RGBA')).save(os.path.join(d, 'wheat.webp'), quality=88, method=6)
        ggg_path = None
        try:
            ggg_path = ci(maps_dir, cfg['bmf'] + '.ggg')
        except FileNotFoundError:
            pass
        gsize = 0
        if ggg_path:
            g = np.frombuffer(open(ggg_path, 'rb').read(), dtype=np.uint8)
            gsize = int(round(len(g) ** 0.5))
            g.tofile(os.path.join(d, 'grass.bin'))
        forest = forest_density(macro, *cfg['forest'])
        forest.tofile(os.path.join(d, 'forest.bin'))
        light = read_map_txt(cfg['txt'])
        water = read_optional(os.path.join(maps_dir, cfg['txt'] + '-water.txt')) or read_optional(os.path.join(maps_dir, cfg['bmf'].lower() + '-water.txt'))
        lamp = read_optional(os.path.join(maps_dir, cfg['txt'] + '-light.txt'))
        grass_types = read_optional(os.path.join(maps_dir, cfg['txt'] + '-grass.txt'))
        meta = dict(W=W, hmin=float(h.min()), hmax=float(h.max()), light=light, trees=sprites, grass=bool(cfg.get('grass')), tuft=has_tuft,
                    wheat=bool(cfg.get('wheat')), grassMap=gsize, forestMap=256,
                    water=[float(x) for x in re.findall(r'-?\d+\.?\d*', re.sub(r'//[^\n]*', '', water))] if water else None,
                    lamps=[[float(x) for x in l.split()] for l in lamp.splitlines() if l.strip()] if lamp else None,
                    grassTypes=[l.split()[0] for l in grass_types.splitlines() if l.strip()] if grass_types else None)
        json.dump(meta, open(os.path.join(d, 'map.json'), 'w'), indent=1)
        out[key] = dict(W=W, dir='maps/%s/' % key)
        print('map', key, W, len(sprites))
    manifest['maps'] = out


def bleed(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb = a[:, :, :3].copy()
    known = a[:, :, 3] > 8
    for radius in (2, 4, 8, 16, 32):
        if known.all():
            break
        src = np.where(known[:, :, None], rgb, 0)
        blurred = np.stack([np.asarray(Image.fromarray(src[:, :, c].clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) for c in range(3)], axis=2)
        weight = np.asarray(Image.fromarray((known * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255
        update = (~known) & (weight > 0.02)
        rgb[update] = blurred[update] / weight[update][:, None]
        known = known | update
    out = np.concatenate([rgb, a[:, :, 3:4]], axis=2).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def read_rez():
    b = open(os.path.join(SRC, 'Data.REZ'), 'rb').read()
    magic, n = struct.unpack_from('<2i', b, 0)
    names_base = 8 + n * 24 + 4
    files = {}
    for i in range(n):
        name_off, off, size, zero, usize, stamp = struct.unpack_from('<6i', b, 8 + i * 24)
        end = b.index(b'\x00', names_base + name_off)
        name = b[names_base + name_off:end].decode('latin1').replace('\\', '/').lower()
        files[name] = b[off:off + size]
    return files


def pcx(files, name):
    return Image.open(io.BytesIO(files[name.lower()]))


def ui_path(files, folder, name):
    for base in ('data/ui/1600_1200/', 'data/ui/'):
        path = '%s%s/%s.pcx' % (base, folder, name)
        if path in files:
            return path
    return None


def keyed(im):
    rgb = im.convert('RGB')
    a = np.asarray(rgb).astype(np.int32)
    mask = (np.abs(a[:, :, 0] - 255) < 40) & (a[:, :, 1] < 60) & (np.abs(a[:, :, 2] - 255) < 40)
    alpha = np.where(mask, 0, 255).astype(np.uint8)
    out = np.concatenate([np.asarray(rgb), alpha[:, :, None]], axis=2)
    return Image.fromarray(out, 'RGBA')


def convert_ui(manifest):
    files = read_rez()
    ui = ensure(os.path.join(DST, 'ui'))
    for sub in ('portraits', 'cards', 'orders', 'battle', 'misc', 'forms'):
        ensure(os.path.join(ui, sub))
    for key, (base, portrait) in UNITS.items():
        p = keyed(pcx(files, 'data/squads/1600_1200/%s-portrait.pcx' % portrait))
        p.save(os.path.join(ui, 'portraits', key + '.png'), optimize=True)
        c = pcx(files, 'data/squads/1600_1200/%s.pcx' % portrait).convert('RGB')
        w, h = c.size
        c.crop((0, 0, w, h // 2)).save(os.path.join(ui, 'cards', key + '.png'), optimize=True)
    for i in range(8):
        im = keyed(pcx(files, 'data/ui/deploy/order%d.pcx' % i))
        w, h = im.size
        im.crop((0, 0, w, h // 2)).save(os.path.join(ui, 'orders', 'order%d.png' % i), optimize=True)
        im.crop((0, h // 2, w, h)).save(os.path.join(ui, 'orders', 'order%d-on.png' % i), optimize=True)
    for name in ('charge', 'disengage', 'fastforward', 'pause', 'rally', 'retreat', 'halt', 'togglemap'):
        im = keyed(pcx(files, ui_path(files, 'battle', name)))
        w, h = im.size
        im.crop((0, 0, w, h // 2)).save(os.path.join(ui, 'battle', name + '.png'), optimize=True)
        im.crop((0, h // 2, w, h)).save(os.path.join(ui, 'battle', name + '-on.png'), optimize=True)
    for name in ('cohes1', 'cohes2', 'cohes3', 'cohes4', 'terrain0', 'terrain1', 'terrain2', 'selectedunit', 'commandpowermarker'):
        keyed(pcx(files, ui_path(files, 'battle', name))).save(os.path.join(ui, 'battle', name + '.png'), optimize=True)
    two_state = ['buy-squad-button', 'cancel-no-button', 'disband-squad-button', 'equipment-button', 'fight-button', 'health-button', 'history-button',
                 'info-button', 'new-army-button', 'ok-yes-button', 'objective-button', 'promote-squad-button', 'purse-button', 'rename-squad-button',
                 'stats-button', 'cycle-left', 'cycle-right', 'map-info-button', 'army-tab', 'scenario-tab', 'armylist-taskbar', 'fight-taskbar',
                 'profile-taskbar', 'quit-taskbar', 'ranks-taskbar', 'tutorial-taskbar', 'welcome-taskbar', 'design-taskbar', 'load_save',
                 'fight-big', 'armylist-big', 'rankarmy', 'ranksquad', 'credits', 'promote', 'deletesave', 'demote-squad-button']
    for name in two_state:
        path = ui_path(files, 'misc', name)
        if not path:
            continue
        im = keyed(pcx(files, path))
        w, h = im.size
        im.crop((0, 0, w, h // 2)).save(os.path.join(ui, 'misc', name + '.png'), optimize=True)
        im.crop((0, h // 2, w, h)).save(os.path.join(ui, 'misc', name + '-on.png'), optimize=True)
    for name in ('mapwon', 'mapwon_gold', 'mapwon_silver', 'locked', 'star', 'marker', 'roman', 'gaul', 'italian', 'lossicon',
                 'miniskillicon0', 'miniskillicon1', 'miniskillicon2', 'miniskillicon3', 'miniskillicon4', 'miniskillicon5', 'miniskillicon6'):
        keyed(pcx(files, ui_path(files, 'misc', name))).save(os.path.join(ui, 'misc', name + '.png'), optimize=True)
    forms = sorted(n for n in files if n.startswith('data/ui/other rez/1280_1024/form'))
    for n in forms:
        keyed(pcx(files, n)).save(os.path.join(ui, 'forms', os.path.basename(n).replace('.pcx', '.png')), optimize=True)
    manifest['ui'] = True
    print('ui done')


def ffmpeg(src, dst, args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src] + args + [dst], check=True)


def convert_audio(manifest):
    sfx_dir = ensure(os.path.join(DST, 'audio', 'sfx'))
    music_dir = ensure(os.path.join(DST, 'audio', 'music'))
    names = []
    for folder in (os.path.join(DATA, 'Sounds'), os.path.join(DATA, 'Sounds', '_SPEECH'), os.path.join(DATA, 'snd')):
        for f in sorted(os.listdir(folder)):
            if not f.lower().endswith('.wav') or '-old' in f.lower() or f.lower() == 'blank.wav':
                continue
            key = os.path.splitext(f)[0].lower()
            ffmpeg(os.path.join(folder, f), os.path.join(sfx_dir, key + '.mp3'), ['-ac', '1', '-ar', '22050', '-b:a', '64k'])
            names.append(key)
    for f in os.listdir(os.path.join(DATA, 'Music')):
        shutil.copyfile(os.path.join(DATA, 'Music', f), os.path.join(music_dir, f.lower()))
    manifest['sfx'] = names
    print('audio', len(names))


def convert_movies(manifest):
    mdir = ensure(os.path.join(DST, 'video'))
    ffmpeg(os.path.join(DATA, 'Movies', 'arena.bik'), os.path.join(mdir, 'intro.mp4'),
           ['-c:v', 'libx264', '-preset', 'slow', '-crf', '32', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart'])
    ffmpeg(os.path.join(DATA, 'Movies', 'arena.bik'), os.path.join(mdir, 'campaign-map.jpg'), ['-ss', '20', '-frames:v', '1', '-q:v', '2'])
    manifest['video'] = True
    print('video done')


def main():
    args = sys.argv[1:]
    only_maps = [a for a in args if a in MAPS]
    steps = [a for a in args if a not in MAPS] or ['units', 'maps', 'ui', 'audio', 'video']
    ensure(DST)
    mpath = os.path.join(DST, 'manifest.json')
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}
    if 'units' in steps:
        convert_units(manifest)
    if 'maps' in steps:
        convert_maps(manifest, only_maps)
    if 'ui' in steps:
        convert_ui(manifest)
    if 'audio' in steps:
        convert_audio(manifest)
    if 'video' in steps:
        convert_movies(manifest)
    json.dump(manifest, open(mpath, 'w'), indent=1)


if __name__ == '__main__':
    main()
