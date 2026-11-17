import importlib.util
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_art_lib', os.path.join(HERE, 'hsro-art-lib.py'))
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)

SHEET = 512
CELL = 128
TAU = 2 * math.pi
YY, XX = np.mgrid[0:CELL, 0:CELL].astype(np.float32)
CX = CY = (CELL - 1) / 2


def radius():
    return np.hypot(XX - CX, YY - CY)


def angle():
    return np.arctan2(YY - CY, XX - CX)


def glow(r0):
    return np.exp(-(radius() / r0) ** 2)


def segment(x0, y0, x1, y1, width):
    dx, dy = x1 - x0, y1 - y0
    t = np.clip(((XX - x0) * dx + (YY - y0) * dy) / max(1e-6, dx * dx + dy * dy), 0, 1)
    d = np.hypot(XX - (x0 + t * dx), YY - (y0 + t * dy))
    return np.clip(1 - d / width, 0, 1)


def polyline(pts, width):
    out = np.zeros((CELL, CELL), dtype=np.float32)
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        out = np.maximum(out, segment(x0, y0, x1, y1, width))
    return out


def star4(cx, cy, size, thin):
    d1 = np.abs(XX - cx) / size + np.abs(YY - cy) / (size * thin)
    d2 = np.abs(XX - cx) / (size * thin) + np.abs(YY - cy) / size
    return np.clip(1 - np.minimum(d1, d2), 0, 1)


def phys(rng):
    a = glow(10) * 0.9
    for k in range(8):
        ang = k * TAU / 8 + 0.2
        ln = 56 if k % 2 == 0 else 36
        a = np.maximum(a, segment(CX, CY, CX + math.cos(ang) * ln, CY + math.sin(ang) * ln, 5 if k % 2 == 0 else 3) ** 1.5)
    a = np.maximum(a, segment(20, 100, 108, 28, 4) * 0.9)
    return a


def fire(rng):
    t = np.clip((112 - YY) / 98, 0, 1)
    off = 6 * np.sin(t * 5.5) * t
    width = 36 * np.sin(np.pi * np.clip(t * 0.92 + 0.08, 0, 1)) ** 0.75 * (1 - 0.35 * t)
    outer = np.clip(1 - np.abs(XX - CX - off) / np.maximum(width, 1e-3), 0, 1) ** 0.8 * (YY < 112)
    inner = np.clip(1 - np.abs(XX - CX - off * 0.6) / np.maximum(width * 0.45, 1e-3), 0, 1) * np.clip(1 - t * 1.4, 0, 1) * (YY < 112)
    flick = 0.8 + 0.2 * np.sin(XX * 0.3 + YY * 0.15)
    return np.clip(np.maximum(outer * flick, inner), 0, 1)


def ice(rng):
    a = glow(8)
    for k in range(6):
        ang = k * TAU / 6
        ex, ey = CX + math.cos(ang) * 56, CY + math.sin(ang) * 56
        a = np.maximum(a, segment(CX, CY, ex, ey, 3.5))
        for f in (0.45, 0.7):
            bx, by = CX + math.cos(ang) * 56 * f, CY + math.sin(ang) * 56 * f
            for s in (1, -1):
                a = np.maximum(a, segment(bx, by, bx + math.cos(ang + s * 0.8) * 14, by + math.sin(ang + s * 0.8) * 14, 2.5))
    hexa = np.clip(1 - np.abs(radius() - 14) / 2.5, 0, 1)
    return np.maximum(a, hexa)


def elec(rng):
    a = glow(9)
    for k in range(4):
        ang = k * TAU / 4 + rng.uniform(-0.3, 0.3)
        pts = [(CX, CY)]
        for i in range(1, 6):
            r = i * 11
            j = rng.uniform(-0.45, 0.45)
            pts.append((CX + math.cos(ang + j) * r, CY + math.sin(ang + j) * r))
        a = np.maximum(a, polyline(pts, 3.2))
    return a


def wind(rng):
    r, th = radius(), angle()
    a = np.zeros((CELL, CELL), dtype=np.float32)
    for k in range(3):
        target = 10 + ((th + k * TAU / 3) % TAU) / TAU * 48
        band = np.clip(1 - np.abs(r - target) / 4.5, 0, 1)
        fade = ((th + k * TAU / 3) % TAU) / TAU
        a = np.maximum(a, band * (0.3 + 0.7 * fade))
    return a


def quant(rng):
    a = glow(14) * 0.8
    for k, (s, rot) in enumerate(((44, 0.0), (32, 0.785), (20, 0.3))):
        c, sn = math.cos(rot), math.sin(rot)
        u = (XX - CX) * c + (YY - CY) * sn
        v = -(XX - CX) * sn + (YY - CY) * c
        edge = np.clip(1 - np.abs(np.maximum(np.abs(u), np.abs(v)) - s) / 2.5, 0, 1)
        a = np.maximum(a, edge * (1 - 0.2 * k))
    return a


def imag(rng):
    halo = np.clip(1 - np.abs(radius() - 40) / 4, 0, 1)
    a = np.maximum(glow(12), halo * 0.9)
    for k in range(6):
        ang = k * TAU / 6 + 0.3
        a = np.maximum(a, star4(CX + math.cos(ang) * 40, CY + math.sin(ang) * 40, 13, 0.18))
    return np.maximum(a, star4(CX, CY, 34, 0.12))


def heal(rng):
    a = glow(16) * 0.6
    cross = np.maximum(np.clip(1 - np.maximum(np.abs(XX - CX) / 9, np.abs(YY - CY) / 30), 0, 1), np.clip(1 - np.maximum(np.abs(XX - CX) / 30, np.abs(YY - CY) / 9), 0, 1))
    a = np.maximum(a, np.clip(cross * 3, 0, 1))
    for cx, cy in ((26, 30), (100, 40), (30, 96), (98, 100)):
        a = np.maximum(a, star4(cx, cy, 9, 0.25))
    return a


def soft(rng):
    return glow(30)


def ring(rng):
    r = radius()
    a = np.clip(1 - np.abs(r - 58) / 3.5, 0, 1)
    a = np.maximum(a, np.clip(1 - np.abs(r - 48) / 1.5, 0, 1) * 0.7)
    th = angle()
    ticks = (np.abs(((th / TAU) * 24) % 1 - 0.5) < 0.12) & (r > 48) & (r < 58)
    a = np.maximum(a, ticks.astype(np.float32) * 0.8)
    return a


def disc(rng):
    r = radius()
    a = np.where(r < 60, 0.35 + 0.15 * (np.sin(r * 0.5) > 0.6), 0.0).astype(np.float32)
    return np.maximum(a, np.clip(1 - np.abs(r - 60) / 3, 0, 1))


def shards(rng):
    a = glow(8) * 0.7
    for k in range(9):
        ang = k * TAU / 9 + rng.uniform(-0.2, 0.2)
        r0, r1 = rng.uniform(12, 22), rng.uniform(40, 60)
        x0, y0 = CX + math.cos(ang) * r0, CY + math.sin(ang) * r0
        x1, y1 = CX + math.cos(ang) * r1, CY + math.sin(ang) * r1
        a = np.maximum(a, segment(x0, y0, x1, y1, 6) ** 0.7 * np.clip(1 - np.hypot(XX - x1, YY - y1) / 60, 0.3, 1))
    return a


def sparkle(rng):
    a = np.zeros((CELL, CELL), dtype=np.float32)
    for _ in range(9):
        a = np.maximum(a, star4(rng.uniform(16, 112), rng.uniform(16, 112), rng.uniform(6, 14), 0.2))
    return a


def beam(rng):
    side = np.exp(-((XX - CX) / 18) ** 2)
    up = np.clip(YY / CELL, 0, 1) ** 0.6
    return side * up


def vortex(rng):
    r, th = radius(), angle()
    arms = 0.5 + 0.5 * np.cos(3 * th + r * 0.12)
    a = arms * np.clip(1 - r / 62, 0, 1) ** 0.8
    return np.maximum(a, glow(10))


def field(rng):
    a = np.full((CELL, CELL), 0.28, dtype=np.float32)
    a[::8, :] = 0.75
    hexes = (np.abs(np.sin(XX * 0.2) * np.sin(YY * 0.2 + XX * 0.1)) > 0.92)
    a[hexes] = 0.6
    a[:6, :] = 1
    a[-6:, :] = 1
    return a


CELLS = [('phys', phys), ('fire', fire), ('ice', ice), ('elec', elec), ('wind', wind), ('quant', quant), ('imag', imag), ('heal', heal),
         ('glow', soft), ('ring', ring), ('disc', disc), ('shards', shards), ('sparkle', sparkle), ('beam', beam), ('vortex', vortex), ('field', field)]


def build(out_dir, rng):
    fx_rng = np.random.default_rng(91)
    top = np.zeros((SHEET, SHEET, 4), dtype=np.float32)
    cells = {}
    per = SHEET // CELL
    for i, (name, fn) in enumerate(CELLS):
        x, y = (i % per) * CELL, (i // per) * CELL
        a = np.clip(fn(fx_rng), 0, 1)
        top[y:y + CELL, x:x + CELL, :3] = (0.75 + 0.25 * a)[..., None]
        top[y:y + CELL, x:x + CELL, 3] = a
        cells[name] = [x, y, CELL, CELL]
    img = L.new_image('fx_station', SHEET, np.flipud(top))
    tex = L.EXPORT.save_texture(img, out_dir, 'fx_station')
    meta = {'sheet': tex, 'cells': cells}
    with open(os.path.join(out_dir, 'fx.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    return meta
