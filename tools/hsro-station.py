import importlib.util
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

SHEET = 1024
SHEET_H = 512
BIG = 256
SMALL = 128

WHITE = (226, 230, 238)
GOLD = (216, 191, 114)
NAVY = (46, 56, 96)
DARK = (70, 74, 96)
SPACE = (12, 16, 44)
CYAN = (150, 230, 255)


def c3(col):
    return np.array(col, dtype=np.float32) / 255


def base(rng, w, h, col, grad=(0.92, 1.04), grain=0.03):
    g = np.linspace(grad[1], grad[0], h).reshape(h, 1, 1)
    return np.clip(c3(col).reshape(1, 1, 3) * g + L.noise(rng, h, w, grain)[..., None], 0, 1)


def put(t, x, y, w, h, col):
    t[max(0, y):y + h, max(0, x):x + w] = c3(col) if not isinstance(col, np.ndarray) else col


def shade(t, x, y, w, h, k):
    t[max(0, y):y + h, max(0, x):x + w] *= k


def stars(rng, t, n, x0=0, y0=0, w=None, h=None):
    h = h or t.shape[0]
    w = w or t.shape[1]
    for _ in range(n):
        sx, sy = x0 + rng.integers(0, w - 1), y0 + rng.integers(0, h - 1)
        k = 1 if rng.random() < 0.8 else 2
        t[sy:sy + k, sx:sx + k] = c3((230, 236, 255)) * (0.6 + 0.4 * rng.random())


def nebula(t, x0, y0, w, h, cx, cy, rx, ry, col, k):
    yy, xx = np.mgrid[0:h, 0:w]
    neb = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2))[..., None]
    t[y0:y0 + h, x0:x0 + w] = np.clip(t[y0:y0 + h, x0:x0 + w] + neb * c3(col) * k, 0, 1)


def wall_cell(rng, windows):
    w = h = BIG
    t = base(rng, w, h, WHITE)
    put(t, 0, 0, w, 12, NAVY)
    put(t, 0, 12, w, 3, GOLD)
    put(t, 0, h - 22, w, 22, DARK)
    put(t, 0, h - 25, w, 3, GOLD)
    for x in (0, 1, 127, 128):
        shade(t, x, 15, 1, h - 40, 0.78)
    shade(t, 0, int(h * 0.68), w, 2, 0.8)
    put(t, 0, int(h * 0.74), w, 2, GOLD)
    if windows:
        y0, y1 = int(h * 0.2), int(h * 0.62)
        put(t, 8, y0 - 4, w - 16, y1 - y0 + 8, GOLD)
        put(t, 12, y0, w - 24, y1 - y0, SPACE)
        stars(rng, t, 90, 12, y0, w - 24, y1 - y0)
        nebula(t, 12, y0, w - 24, y1 - y0, 160, 40, 60, 26, (90, 60, 200), 0.5)
        nebula(t, 12, y0, w - 24, y1 - y0, 60, 70, 40, 18, (60, 140, 220), 0.35)
        put(t, 126, y0, 4, y1 - y0, GOLD)
        shade(t, 12, y0, w - 24, 6, 0.6)
    else:
        for x in (40, 168):
            put(t, x, int(h * 0.3), 48, 4, CYAN)
            put(t, x - 2, int(h * 0.3) - 2, 52, 1, GOLD)
        for x in (0, 128):
            shade(t, x + 10, int(h * 0.36), 108, int(h * 0.28), 0.95)
            shade(t, x + 10, int(h * 0.36), 108, 2, 0.82)
    return t


def floor_cell(rng):
    w = h = BIG
    t = base(rng, w, h, (168, 174, 188), grad=(0.98, 1.02))
    for ty in (0, 1):
        for tx in (0, 1):
            if (tx + ty) % 2:
                shade(t, tx * 128, ty * 128, 128, 128, 0.94)
            shade(t, tx * 128 + 10, ty * 128 + 10, 108, 2, 0.86)
            shade(t, tx * 128 + 10, ty * 128 + 116, 108, 2, 1.06)
            for cx, cy in ((6, 6), (118, 6), (6, 118), (118, 118)):
                put(t, tx * 128 + cx, ty * 128 + cy, 4, 4, GOLD)
    for k in (0, 1, 126, 127, 128, 129, 254, 255):
        shade(t, 0, k, w, 1, 0.68)
        shade(t, k, 0, 1, h, 0.68)
    put(t, 0, 62, w, 4, (120, 200, 230))
    return t


def metal_cell(rng):
    w = h = BIG
    t = base(rng, w, h, (124, 132, 156))
    for k in (0, 128):
        shade(t, 0, k, w, 3, 0.65)
        shade(t, k, 0, 3, h, 0.65)
        shade(t, 0, k + 3, w, 2, 1.12)
        shade(t, k + 3, 0, 2, h, 1.12)
    for ty in (0, 128):
        for tx in (0, 128):
            for cx, cy in ((12, 12), (112, 12), (12, 112), (112, 112)):
                put(t, tx + cx, ty + cy, 4, 4, (90, 96, 116))
                put(t, tx + cx, ty + cy, 2, 2, (190, 196, 214))
    put(t, 0, 60, w, 8, NAVY)
    put(t, 0, 63, w, 2, CYAN)
    return t


def gold_cell(rng):
    t = base(rng, SMALL, SMALL, GOLD, grad=(0.85, 1.08))
    for x in range(8, SMALL, 20):
        shade(t, x, 0, 3, SMALL, 0.8)
        shade(t, x + 3, 0, 1, SMALL, 1.15)
    put(t, 0, 0, SMALL, 8, (150, 124, 60))
    put(t, 0, SMALL - 10, SMALL, 10, (150, 124, 60))
    put(t, 0, 60, SMALL, 6, NAVY)
    put(t, 0, 62, SMALL, 2, CYAN)
    return t


def crate_cell(rng):
    t = base(rng, SMALL, SMALL, (58, 90, 154))
    for i in range(SMALL):
        for d in (-3, -2, -1, 0, 1, 2, 3):
            j = i + d
            if 0 <= j < SMALL:
                t[i, j] *= 0.82
                t[i, SMALL - 1 - j] *= 0.82
    put(t, 0, 0, SMALL, 10, GOLD)
    put(t, 0, SMALL - 10, SMALL, 10, GOLD)
    put(t, 0, 0, 10, SMALL, GOLD)
    put(t, SMALL - 10, 0, 10, SMALL, GOLD)
    put(t, 40, 52, 48, 24, (232, 236, 244))
    put(t, 46, 60, 36, 3, NAVY)
    put(t, 46, 66, 24, 3, NAVY)
    return t


def desk_cell(rng):
    t = base(rng, SMALL, SMALL, (210, 214, 226))
    put(t, 0, 0, SMALL, 10, (60, 70, 104))
    put(t, 0, 10, SMALL, 3, GOLD)
    put(t, 0, SMALL - 16, SMALL, 16, DARK)
    for x in (4, 66):
        shade(t, x, 22, 58, 80, 0.92)
        put(t, x + 24, 56, 10, 3, GOLD)
    return t


def desktop_cell(rng):
    t = base(rng, SMALL, SMALL, (44, 52, 86), grad=(0.96, 1.04))
    put(t, 0, 0, SMALL, 5, GOLD)
    put(t, 0, SMALL - 5, SMALL, 5, GOLD)
    for x, y, a in ((14, 20, 0), (70, 64, 1), (30, 80, 2)):
        put(t, x, y, 30, 22, (236, 236, 240))
        for k in range(3):
            put(t, x + 4, y + 5 + k * 5, 20 - k * 4, 2, (120, 130, 160))
    put(t, 76, 14, 38, 26, CYAN)
    shade(t, 78, 16, 34, 22, 0.75)
    return t


def machine_cell(rng):
    t = base(rng, SMALL, SMALL, (58, 68, 92))
    put(t, 0, 0, SMALL, 6, GOLD)
    for x, y, w, h in ((10, 16, 50, 34), (68, 16, 50, 34)):
        put(t, x - 2, y - 2, w + 4, h + 4, (30, 34, 50))
        put(t, x, y, w, h, (60, 170, 220))
        for k in range(4):
            put(t, x + 4, y + 5 + k * 7, int(w * (0.4 + 0.12 * k)), 2, CYAN)
    for i, col in enumerate(((255, 90, 90), (255, 210, 80), (110, 230, 140), (120, 200, 255))):
        put(t, 14 + i * 26, 66, 12, 8, col)
    for i in range(6):
        put(t, 12 + i * 18, 86, 12, 12, (90, 100, 124))
        put(t, 14 + i * 18, 88, 8, 4, (150, 160, 184))
    put(t, 0, SMALL - 14, SMALL, 14, (40, 44, 60))
    return t


def tank_cell(rng):
    t = base(rng, SMALL, SMALL, (70, 170, 130), grad=(0.75, 1.0))
    x = np.linspace(-1, 1, SMALL)
    t *= (1.15 - 0.35 * x ** 2).reshape(1, SMALL, 1)
    put(t, 18, 0, 6, SMALL, (200, 255, 230))
    for _ in range(22):
        bx, by, r = rng.integers(10, SMALL - 10), rng.integers(20, SMALL - 20), rng.integers(2, 5)
        yy, xx = np.mgrid[0:SMALL, 0:SMALL]
        ring = np.abs(np.hypot(xx - bx, yy - by) - r) < 0.9
        t[ring] = c3((220, 255, 240))
    put(t, 0, 0, SMALL, 14, (150, 156, 176))
    put(t, 0, 14, SMALL, 3, GOLD)
    put(t, 0, SMALL - 14, SMALL, 14, (150, 156, 176))
    put(t, 0, SMALL - 17, SMALL, 3, GOLD)
    return np.clip(t, 0, 1)


def planter_cell(rng):
    t = base(rng, SMALL, SMALL, (112, 80, 50))
    for x in range(0, SMALL, 16):
        shade(t, x, 0, 2, SMALL, 0.7)
    put(t, 0, 0, SMALL, 8, GOLD)
    put(t, 0, SMALL - 8, SMALL, 8, (70, 50, 32))
    return t


def soil_cell(rng):
    t = base(rng, SMALL, SMALL, (60, 42, 28), grain=0.08)
    yy, xx = np.mgrid[0:SMALL, 0:SMALL]
    for _ in range(14):
        cx, cy, r = rng.integers(0, SMALL), rng.integers(0, SMALL), rng.integers(10, 22)
        leaf = ((xx - cx) / r) ** 2 + ((yy - cy) / (r * 0.55)) ** 2 < 1
        g = 0.75 + 0.35 * rng.random()
        t[leaf] = c3((70, 160, 70)) * g
        mid = leaf & (np.abs(yy - cy) < 1)
        t[mid] = c3((150, 220, 120))
    return t


def shelf_cell(rng):
    t = base(rng, SMALL, SMALL, (90, 70, 56))
    put(t, 0, 0, SMALL, 6, (60, 46, 36))
    cols = [(200, 80, 80), (80, 140, 210), (230, 200, 90), (110, 190, 120), (180, 120, 200), (230, 236, 244)]
    for row in range(3):
        y = 10 + row * 40
        put(t, 4, y, SMALL - 8, 32, (40, 30, 26))
        x = 8
        while x < SMALL - 14:
            bw = int(rng.integers(6, 14))
            bh = int(rng.integers(18, 30))
            put(t, x, y + 32 - bh, bw, bh, cols[int(rng.integers(0, len(cols)))])
            x += bw + 2
        put(t, 0, y + 32, SMALL, 4, (130, 104, 80))
    return t


def cabinet_cell(rng):
    t = base(rng, SMALL, SMALL, (200, 204, 216))
    for row in range(3):
        for col in range(2):
            x, y = 6 + col * 60, 8 + row * 38
            shade(t, x, y, 56, 34, 0.93)
            shade(t, x, y, 56, 2, 1.08)
            shade(t, x, y + 32, 56, 2, 0.75)
            put(t, x + 20, y + 15, 16, 4, GOLD)
    put(t, 0, 0, SMALL, 4, GOLD)
    return t


def bed_cell(rng):
    t = base(rng, SMALL, SMALL, (90, 110, 160))
    for y in range(0, SMALL, 12):
        shade(t, 0, y, SMALL, 2, 0.88)
    put(t, 8, 6, SMALL - 16, 30, (236, 238, 244))
    shade(t, 8, 30, SMALL - 16, 6, 0.85)
    put(t, 0, 44, SMALL, 6, GOLD)
    return t


def portrait_cell(rng):
    t = base(rng, SMALL, SMALL, GOLD, grad=(0.8, 1.1))
    sky = base(rng, SMALL - 24, SMALL - 24, (110, 70, 160), grad=(0.6, 1.3))
    t[12:SMALL - 12, 12:SMALL - 12] = sky
    yy, xx = np.mgrid[0:SMALL, 0:SMALL]
    head = ((xx - 64) / 16) ** 2 + ((yy - 52) / 18) ** 2 < 1
    body = (np.abs(xx - 64) < 26 - (yy - 74) * 0.0) & (yy > 72) & (yy < SMALL - 12) & (np.abs(xx - 64) < 14 + (yy - 72) * 0.6)
    hair = ((xx - 64) / 22) ** 2 + ((yy - 50) / 26) ** 2 < 1
    t[hair] = c3((90, 60, 110))
    t[head] = c3((240, 214, 196))
    t[body] = c3((236, 236, 244))
    shade(t, 12, 12, SMALL - 24, 3, 0.6)
    return t


def core_cell(rng):
    t = np.zeros((SMALL, SMALL, 3), dtype=np.float32)
    yy, xx = np.mgrid[0:SMALL, 0:SMALL]
    d = np.hypot(xx - 64, yy - 64) / 64
    glow = np.clip(1 - d, 0, 1) ** 1.3
    t[:] = c3((60, 44, 110)) * (1 - glow[..., None]) + c3((235, 200, 255)) * glow[..., None]
    for r in (0.45, 0.7, 0.9):
        t[np.abs(d - r) < 0.025] = c3((255, 220, 140))
    return np.clip(t + L.noise(rng, SMALL, SMALL, 0.03)[..., None], 0, 1)


def hull_cell(rng):
    t = base(rng, SMALL, SMALL, (58, 90, 138))
    for k in (0, 64):
        shade(t, 0, k, SMALL, 2, 0.7)
        shade(t, k, 0, 2, SMALL, 0.7)
    for y in (6, 70):
        for x in range(6, SMALL, 16):
            put(t, x, y, 3, 3, (150, 170, 200))
    put(t, 0, 92, SMALL, 10, (236, 238, 244))
    put(t, 0, 102, SMALL, 3, GOLD)
    return t


def rail_cell(rng):
    t = base(rng, SMALL, SMALL, (28, 34, 64))
    for x in (30, 94):
        put(t, x, 0, 6, SMALL, (170, 180, 210))
        put(t, x + 1, 0, 2, SMALL, (240, 244, 255))
    for y in range(8, SMALL, 32):
        put(t, 10, y, SMALL - 20, 6, (60, 70, 100))
        put(t, 62, y + 1, 4, 4, CYAN)
    return t


def space_cell(rng):
    t = base(rng, SMALL, SMALL, SPACE, grad=(0.9, 1.1), grain=0.01)
    stars(rng, t, 70)
    nebula(t, 0, 0, SMALL, SMALL, 80, 50, 30, 20, (110, 60, 200), 0.4)
    return t


BIG_CELLS = [('floor', floor_cell), ('wall', lambda r: wall_cell(r, False)), ('window', lambda r: wall_cell(r, True)), ('metal', metal_cell)]
SMALL_CELLS = [
    ('gold', gold_cell), ('crate', crate_cell), ('desk', desk_cell), ('desktop', desktop_cell),
    ('machine', machine_cell), ('tank', tank_cell), ('planter', planter_cell), ('soil', soil_cell),
    ('shelf', shelf_cell), ('cabinet', cabinet_cell), ('bed', bed_cell), ('portrait', portrait_cell),
    ('core', core_cell), ('hull', hull_cell), ('rail', rail_cell), ('space', space_cell)
]


def build_surfaces(out_dir, rng):
    top = np.zeros((SHEET_H, SHEET, 3), dtype=np.float32)
    cells = {}
    for i, (name, fn) in enumerate(BIG_CELLS):
        x, y = (i % 4) * BIG, (i // 4) * BIG
        top[y:y + BIG, x:x + BIG] = fn(rng)
        cells[name] = [x, y, BIG, BIG]
    per = SHEET // SMALL
    for i, (name, fn) in enumerate(SMALL_CELLS):
        x, y = (i % per) * SMALL, BIG + (i // per) * SMALL
        top[y:y + SMALL, x:x + SMALL] = fn(rng)
        cells[name] = [x, y, SMALL, SMALL]
    px = np.ones((SHEET_H, SHEET, 4), dtype=np.float32)
    px[..., :3] = np.flipud(top)
    img = L.new_image('zone_station', SHEET, px, SHEET_H)
    tex = L.EXPORT.save_texture(img, out_dir, 'zone_station')
    meta = {'sheet': tex, 'cells': cells}
    with open(os.path.join(out_dir, 'surfaces.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    return meta


def prop_spec():
    return {
        'white': ('fade', (190, 196, 210), (246, 248, 252)),
        'gold': ('fade', (150, 124, 60), (240, 218, 140)),
        'dark': ('fade', (40, 44, 64), (84, 90, 116)),
        'screen': (screen_style, (40, 120, 180), (170, 240, 255)),
        'glow': ('glow', (90, 200, 240), (235, 252, 255)),
        'purple': ('glow', (90, 50, 160), (240, 200, 255)),
        'crate': ('trim', (58, 90, 154), GOLD),
        'green': ('glow', (70, 200, 110), (220, 255, 230)),
        'pink': ('glow', (160, 30, 120), (255, 170, 230)),
        'void': ('stars', (14, 8, 30), (255, 140, 230)),
        'wood': ('fade', (90, 60, 36), (150, 108, 66)),
        'relic': ('trim', (120, 70, 40), (255, 220, 120)),
        'glass': ('fade', (110, 190, 230), (220, 245, 255)),
        'goods': (goods_style, (60, 70, 100), None),
        'metal': ('seams', (124, 132, 156), None),
        'sign': (sign_style, (46, 56, 96), GOLD)
    }


def screen_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    sub[..., :3] = c3(a)
    for k in range(6, h - 6, 8):
        n = int(rng.integers(w // 4, w - 10))
        sub[k:k + 2, 6:6 + n, :3] = c3(b)
    sub[:3, :, :3] = c3(GOLD)
    sub[-3:, :, :3] = c3(GOLD)


def goods_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    cols = [(220, 90, 90), (90, 160, 230), (240, 210, 90), (120, 210, 130), (200, 140, 230)]
    for row in range(2):
        y = 6 + row * 30
        sub[y + 22:y + 26, :, :3] = c3((150, 124, 60))
        x = 4
        while x < w - 10:
            bw, bh = int(rng.integers(6, 12)), int(rng.integers(10, 20))
            sub[y + 22 - bh:y + 22, x:x + bw, :3] = c3(cols[int(rng.integers(0, len(cols)))])
            x += bw + 3


def sign_style(sub, rng, a, b):
    h, w = sub.shape[:2]
    sub[:4, :, :3] = c3(b)
    sub[-4:, :, :3] = c3(b)
    for k in range(5):
        sub[h // 2 - 6:h // 2 + 6, 8 + k * 10:14 + k * 10, :3] = c3((240, 240, 250))


def prop_builder(regions):
    return L.Builder(regions, 256, [])


def ring(b, c, r0, r1, depth, region, steps=12):
    b.arc(c, r0, r1, 0, 2 * math.pi, depth, None, region, steps=steps)


def prop_panel(b):
    b.box((0, 0, 0.05), (0.5, 0.4, 0.1), None, 'dark')
    b.tube((0, 0, 0.1), (0, 0, 0.55), 0.09, 0.08, None, 'metal', sides=8)
    b.box((0, 0, 1.05), (0.72, 0.22, 1.1), None, 'dark', rot=(0.12, 0, 0))
    b.box((0, 0.1, 1.1), (0.6, 0.04, 0.75), None, 'screen', rot=(0.12, 0, 0))
    b.box((0, 0, 1.63), (0.78, 0.28, 0.06), None, 'gold', rot=(0.12, 0, 0))
    b.box((0, 0.12, 0.6), (0.6, 0.16, 0.06), None, 'gold')


def prop_crate(b):
    b.box((0, 0, 0.45), (1.1, 1.1, 0.9), None, 'crate')
    b.box((0, 0, 0.45), (1.14, 1.14, 0.1), None, 'gold')
    for x in (-0.5, 0.5):
        for y in (-0.5, 0.5):
            b.box((x, y, 0.45), (0.12, 0.12, 0.92), None, 'metal')


def prop_lift(b):
    b.box((0, 0, 0.05), (3.0, 3.0, 0.1), None, 'gold')
    b.box((0, 0, 0.12), (2.0, 2.0, 0.04), None, 'glow')
    for x in (-1.3, 1.3):
        for y in (-1.3, 1.3):
            b.box((x, y, 1.75), (0.2, 0.2, 3.5), None, 'white')
            b.box((x, y, 3.45), (0.26, 0.26, 0.1), None, 'gold')
            b.box((x, y, 1.75), (0.06, 0.24, 2.6), None, 'glow')
    for y in (-1.3, 1.3):
        b.box((0, y, 3.45), (2.6, 0.12, 0.08), None, 'gold')


def prop_curio(b):
    b.box((0, 0, 0.42), (0.7, 0.7, 0.84), None, 'dark')
    b.box((0, 0, 0.86), (0.8, 0.8, 0.06), None, 'gold')
    b.box((0, 0, 0.04), (0.8, 0.8, 0.08), None, 'gold')
    b.box((0, 0.36, 0.45), (0.4, 0.02, 0.2), None, 'sign')
    b.cone((0, 0, 0.9), (0, 0, 1.38), 0.16, None, 'purple', sides=6)
    b.cone((0, 0, 0.9), (0.12, 0.05, 1.18), 0.08, None, 'purple', sides=5)
    b.cone((0, 0, 0.9), (-0.1, -0.06, 1.14), 0.07, None, 'purple', sides=5)


def prop_capsule(b):
    b.box((0, 0, 0.25), (1.0, 2.2, 0.5), None, 'white')
    b.box((0, 0, 0.5), (1.04, 2.24, 0.06), None, 'gold')
    b.sphere((0, 0, 0.5), 0.5, (0.9, 2.1, 0.55), None, 'glass', segs=12, rings=6, cut=0.0, cut_below=True)
    b.box((0, 1.05, 0.65), (0.6, 0.12, 0.3), None, 'screen')
    b.box((0, 0, 0.04), (1.1, 2.3, 0.08), None, 'dark')


def prop_console(b, vendor):
    b.box((0, 0, 0.45), (0.9, 0.7, 0.9), None, 'goods' if vendor else 'dark')
    b.box((0, 0, 0.92), (1.0, 0.8, 0.08), None, 'gold')
    if vendor:
        for x in (-0.45, 0.45):
            b.box((x, -0.3, 1.5), (0.06, 0.06, 1.1), None, 'white')
        b.box((0, -0.3, 2.08), (1.1, 0.5, 0.06), None, 'gold', rot=(-0.3, 0, 0))
        b.box((0, -0.2, 1.75), (0.9, 0.04, 0.3), None, 'sign')
        b.box((0, 0.05, 1.05), (0.6, 0.3, 0.2), None, 'goods')
    else:
        b.box((0, -0.06, 1.28), (0.8, 0.1, 0.62), None, 'dark', rot=(-0.25, 0, 0))
        b.box((0, 0.0, 1.28), (0.68, 0.04, 0.5), None, 'screen', rot=(-0.25, 0, 0))
        b.tube((0, -0.12, 1.6), (0, -0.12, 1.85), 0.025, 0.02, None, 'gold', sides=6)
        b.sphere((0, -0.12, 1.88), 0.05, (1, 1, 1), None, 'glow', segs=8, rings=5)


def prop_beacon(b):
    b.tube((0, 0, 0), (0, 0, 0.3), 0.55, 0.45, None, 'dark', sides=10)
    b.tube((0, 0, 0.3), (0, 0, 2.0), 0.08, 0.06, None, 'white', sides=8)
    ring(b, (0, 0, 1.2), 0.12, 0.2, 0.04, 'gold', steps=10)
    b.sphere((0, 0, 2.2), 0.22, (1, 1, 1.2), None, 'green', segs=10, rings=6)
    ring(b, (0, 0, 2.2), 0.28, 0.33, 0.04, 'gold', steps=12)


def prop_chest(b):
    b.box((0, 0, 0.35), (1.6, 1.0, 0.7), None, 'relic')
    b.sphere((0, 0, 0.7), 0.5, (1.6, 1.0, 0.5), None, 'relic', segs=12, rings=6, cut=0.0, cut_below=True)
    b.box((0, 0, 0.7), (1.66, 1.06, 0.08), None, 'gold')
    b.box((0, 0.52, 0.58), (0.22, 0.06, 0.3), None, 'gold')
    for x in (-0.7, 0.7):
        b.box((x, 0, 0.5), (0.1, 1.04, 1.0), None, 'gold')


def prop_anchor(b):
    b.tube((0, 0, 0), (0, 0, 0.22), 0.65, 0.55, None, 'dark', sides=12)
    b.tube((0, 0, 0.22), (0, 0, 0.3), 0.4, 0.3, None, 'gold', sides=12)
    b.tube((0, 0, 0.3), (0, 0, 1.6), 0.1, 0.08, None, 'gold', sides=8)
    for a in range(4):
        ang = a * math.pi / 2
        tip = (0.42 * math.cos(ang), 0.42 * math.sin(ang), 1.72)
        b.cone((0, 0, 1.62), tip, 0.05, None, 'gold', sides=5)
    b.sphere((0, 0, 2.1), 0.2, (1, 1, 1.4), None, 'glow', segs=10, rings=8)
    ring(b, (0, 0, 2.1), 0.34, 0.4, 0.04, 'gold', steps=14)
    b.cone((0, 0, 1.75), (0, 0, 2.55), 0.06, None, 'glow', sides=4)


def prop_rift(b):
    b.box((0, 0, 0.1), (2.0, 0.6, 0.2), None, 'dark')
    b.box((0, 0, 1.5), (1.6, 0.18, 2.6), None, 'void')
    for x in (-0.86, 0.86):
        b.box((x, 0, 1.5), (0.14, 0.26, 2.7), None, 'pink')
    b.box((0, 0, 2.85), (1.86, 0.26, 0.14), None, 'pink')
    for k in range(5):
        b.cone((0.6 * math.sin(k * 1.7), 0.05, 0.5 + k * 0.45), (0.8 * math.sin(k * 1.7 + 0.6), 0.2, 0.7 + k * 0.45), 0.06, None, 'pink', sides=4)


def prop_podium(b):
    b.tube((0, 0, 0), (0, 0, 0.12), 1.15, 1.1, None, 'dark', sides=20)
    b.tube((0, 0, 0.12), (0, 0, 0.16), 1.1, 1.06, None, 'white', sides=20)
    b.tube((0, 0, 0.1), (0, 0, 0.17), 1.12, 1.08, None, 'gold', sides=20, cap=False)
    b.tube((0, 0, 0.16), (0, 0, 0.172), 0.6, 0.6, None, 'glow', sides=16)


PROPS = {
    'prop_podium': prop_podium,
    'prop_panel': prop_panel,
    'prop_crate': prop_crate,
    'prop_lift': prop_lift,
    'prop_curio': prop_curio,
    'prop_capsule': prop_capsule,
    'prop_terminal': lambda b: prop_console(b, False),
    'prop_vendor': lambda b: prop_console(b, True),
    'prop_beacon': prop_beacon,
    'prop_chest': prop_chest,
    'prop_anchor': prop_anchor,
    'prop_rift': prop_rift
}


def build(out_dir, rng):
    L.reset()
    build_surfaces(out_dir, rng)
    img, regions = L.paint_cells(np.random.default_rng(5), 'prop_station', prop_spec())
    tex = L.EXPORT.save_texture(img, out_dir, 'prop_station')
    metas = []
    for mid, fn in PROPS.items():
        b = prop_builder(regions)
        fn(b)
        ob = b.finish(mid, [])
        metas.append(L.EXPORT.export_model(mid, ob, out_dir, image=img, tex_name='prop_station'))
        ob.hide_set(True)
    return metas
