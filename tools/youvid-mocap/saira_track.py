import json
import os
import subprocess
import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
NAME = 'Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево.'
VIDEO = os.path.join(ROOT, 'content', 'YouVid', NAME + '.mp4')
AUDIO = os.path.join(ROOT, 'content', 'YouVid', NAME + '.mp3')
OUT = os.path.join(ROOT, 'js', 'apps', 'youvid', 'saira-track.js')
ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
W, H = 320, 180
FPS = 10
RATE = 20

SHOTS = [
    ('pa', 13.5, 24.6, (0.342, 0.658), 'R', 6), ('h1', 24.6, 37.967, None, 'R', 8), ('h2', 37.967, 46.5, None, None, 8), ('h3', 46.5, 58.833, None, None, 8),
    ('h4', 58.833, 77.133, None, None, 8), ('h5', 77.133, 83.833, None, 'R', 8), ('pb', 83.833, 89.133, (0.342, 0.658), 'R', 6), ('h6', 89.133, 96.5, None, 'R', 8),
    ('h7', 96.5, 104.467, None, 'R', 8), ('h8', 104.467, 109.1, None, 'R', 8), ('h9', 109.1, 120.367, None, 'R', 8), ('h10', 120.367, 133.867, None, 'R', 8),
    ('h11', 153.1, 178.9, None, None, 8), ('h12', 178.9, 205.433, None, 'R', 8), ('h13', 243.767, 290.767, None, 'R', 8), ('h14', 293.5, 339.433, None, 'R', 8),
    ('pc', 339.433, 348.833, (0.342, 0.658), 'R', 6), ('h15', 360.9, 405.567, None, None, 8), ('h16', 405.567, 430.4, None, 'R', 8), ('h17', 441.433, 476.567, None, None, 8),
    ('h18', 476.567, 516.033, None, None, 8), ('h19', 523.633, 607.5, None, 'R', 8)
]

VLAD = [(12.92, 25.6), (290.5, 293.4), (339.1, 348.7), (430.9, 432.4), (439.85, 441.2)]


def frames():
    cmd = ['ffmpeg', '-v', 'error', '-i', VIDEO, '-an', '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=W * H * 3 * 8)
    i = 0
    while True:
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        yield i / FPS, np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32) / 255
        i += 1


def skin(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cr = (r - y) * 0.713 * 255 + 128
    cb = (b - y) * 0.564 * 255 + 128
    m = ((h < 28) | (h > 335)) & (s > 0.10) & (s < 0.48) & (v > 0.42) & (cr > 136) & (cr < 175) & (cb > 85) & (cb < 128)
    m = ndimage.binary_opening(m, np.ones((3, 3)))
    return ndimage.binary_closing(m, np.ones((5, 5)))


def blobs(mask, crop, min_thick):
    x0, x1 = (int(crop[0] * W), int(crop[1] * W)) if crop else (0, W)
    if crop:
        mask = mask.copy()
        mask[:, :x0] = False
        mask[:, x1:] = False
    lab, n = ndimage.label(mask, np.ones((3, 3)))
    if not n:
        return []
    dist = ndimage.distance_transform_edt(mask)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        sub = lab[sl] == i
        area = int(sub.sum())
        if area < 220:
            continue
        thick = float(dist[sl][sub].max())
        if thick < min_thick:
            continue
        ys, xs = np.nonzero(sub)
        ys = ys + sl[0].start
        xs = xs + sl[1].start
        border = (xs <= x0 + 2) | (xs >= x1 - 3) | (ys <= 2) | (ys >= H - 3)
        if border.sum() < 3 and area < 1200:
            continue
        if border.sum() >= 3:
            e = np.array([xs[border].mean(), ys[border].mean()])
        else:
            c = np.array([xs.mean(), ys.mean()])
            pts = np.stack([xs - c[0], ys - c[1]], 1)
            ax = np.linalg.eigh(pts.T @ pts)[1][:, -1]
            proj = pts @ ax
            ends = []
            for sel in (proj <= np.percentile(proj, 6), proj >= np.percentile(proj, 94)):
                p = np.array([xs[sel].mean(), ys[sel].mean()])
                ends.append((min(p[0] - x0, x1 - p[0], p[1] * 1.4, (H - p[1]) * 0.8), p))
            e = min(ends, key=lambda q: q[0])[1]
        d2 = (xs - e[0]) ** 2 + (ys - e[1]) ** 2
        far = d2 >= np.percentile(d2, 97)
        tip = np.array([xs[far].mean(), ys[far].mean()])
        out.append({'tip': tip, 'e': e, 'area': area, 'thick': thick})
    out.sort(key=lambda b: -b['area'])
    return out[:2]


def assign(found, prev, mid, solo):
    if solo and found:
        return {solo: found[0]}
    if len(found) == 2:
        a, b = found
        if prev.get('R') is not None and prev.get('L') is not None:
            keep = np.linalg.norm(a['tip'] - prev['R']) + np.linalg.norm(b['tip'] - prev['L'])
            swap = np.linalg.norm(a['tip'] - prev['L']) + np.linalg.norm(b['tip'] - prev['R'])
            return {'R': a, 'L': b} if keep <= swap else {'R': b, 'L': a}
        ka = a['e'][0] * 0.6 + a['tip'][0] * 0.4
        kb = b['e'][0] * 0.6 + b['tip'][0] * 0.4
        return {'R': a, 'L': b} if ka >= kb else {'R': b, 'L': a}
    if len(found) == 1:
        b = found[0]
        dr = np.linalg.norm(b['tip'] - prev['R']) if prev.get('R') is not None else None
        dl = np.linalg.norm(b['tip'] - prev['L']) if prev.get('L') is not None else None
        if dr is not None and dl is not None:
            return {'R' if dr <= dl else 'L': b}
        side = 'R' if b['e'][0] * 0.6 + b['tip'][0] * 0.4 >= mid else 'L'
        return {side: b}
    return {}


def track_shots():
    spans = {name: (t0, t1, crop, solo, mt) for name, t0, t1, crop, solo, mt in SHOTS}
    rows = {name: [] for name in spans}
    prev = {name: {} for name in spans}
    for t, rgb in frames():
        live = [n for n, sp in spans.items() if sp[0] + 0.04 <= t < sp[1]]
        if not live:
            continue
        name = live[0]
        t0, t1, crop, solo, mt = spans[name]
        mid = W * ((crop[0] + crop[1]) / 2 if crop else 0.5)
        found = blobs(skin(rgb), crop, mt)
        hands = assign(found, prev[name], mid, solo)
        rec = {'t': round(t, 2)}
        for side, b in hands.items():
            prev[name][side] = b['tip']
            rec[side] = {'tip': b['tip'] / [W, H], 'e': b['e'] / [W, H], 'thick': b['thick'] / W}
        rows[name].append(rec)
    return rows


def series(rows, side):
    n = len(rows)
    out = np.full((n, 5), np.nan)
    for i, r in enumerate(rows):
        h = r.get(side)
        if not h:
            continue
        out[i, 0:2] = h['tip']
        out[i, 2:4] = h['e']
        out[i, 4] = h['thick']
    return out


def clean(data):
    n = len(data)
    ok = ~np.isnan(data[:, 0])
    for i in range(1, n - 1):
        if ok[i] and not ok[i - 1] and not ok[i + 1]:
            ok[i] = False
    for i in range(1, n - 1):
        if ok[i - 1] and ok[i + 1] and ok[i]:
            jump = np.linalg.norm(data[i, 0:2] - (data[i - 1, 0:2] + data[i + 1, 0:2]) / 2)
            if jump > 0.18:
                ok[i] = False
    data[~ok] = np.nan
    gap = np.nonzero(~ok)[0]
    idx = np.nonzero(ok)[0]
    for i in gap:
        before = idx[idx < i]
        after = idx[idx > i]
        if len(before) and len(after) and after[0] - before[-1] <= 4:
            a, b = before[-1], after[0]
            u = (i - a) / (b - a)
            data[i, :5] = data[a, :5] * (1 - u) + data[b, :5] * u
    ok = ~np.isnan(data[:, 0])
    sm = data.copy()
    k = [1, 2, 3, 2, 1]
    for i in range(n):
        if not ok[i]:
            continue
        acc, ws = np.zeros(5), 0.0
        for j, w in zip(range(i - 2, i + 3), k):
            if 0 <= j < n and ok[j]:
                acc += w * data[j, :5]
                ws += w
        sm[i, :5] = acc / ws
    return sm


def q(v, lo, hi):
    x = int(np.clip(round((v - lo) / (hi - lo) * 3843), 0, 3843))
    return ALPHA[x // 62] + ALPHA[x % 62]


def encode(data):
    out = []
    for row in data:
        if np.isnan(row[0]):
            out.append('__________')
            continue
        out.append(q(row[0], -0.2, 1.2) + q(row[1], -0.2, 1.2) + q(row[2], -0.2, 1.2) + q(row[3], -0.2, 1.2) + q(row[4], 0, 0.25))
    return ''.join(out)


def envelope(gate_spans, exclude=()):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', AUDIO, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = 16000 // RATE
    n = len(a) // hop
    frames_ = a[:n * hop].reshape(n, hop)
    mag = np.abs(np.fft.rfft(frames_ * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / 16000)
    band = (freqs >= 300) & (freqs <= 3400)
    db = 20 * np.log10(np.sqrt((mag[:, band] ** 2).mean(1)) + 1e-9)
    ts = np.arange(n) / RATE
    gate = np.zeros(n)
    for a0, a1 in gate_spans:
        gate[(ts >= a0) & (ts < a1)] = 1
    for a0, a1 in exclude:
        gate[(ts >= a0) & (ts < a1)] = 0
    lo, hi = np.percentile(db[gate > 0], 10), np.percentile(db[gate > 0], 97)
    v = np.clip((db - lo) / (hi - lo), 0, 1) * gate
    return ''.join(ALPHA[int(round(x * 61))] for x in v)


def words():
    spans = []
    for line in open(os.path.join(HERE, 'S4iraSuP0sm-words.jsonl'), encoding='utf-8'):
        d = json.loads(line)
        for w in d['w']:
            spans.append((w[0] - 0.04, w[1] + 0.04))
    return spans


def main():
    rows = track_shots()
    lines = []
    for name, t0, t1, crop, solo, mt in SHOTS:
        rs = rows[name]
        if not rs:
            continue
        parts = []
        refs = []
        for side in ('R', 'L'):
            data = clean(series(rs, side))
            parts.append(f"{side}: '{encode(data)}'")
            th = data[:, 4][~np.isnan(data[:, 4])]
            refs.append(f"{np.median(th):.4f}" if len(th) else '0.07')
        lines.append(f"    {name}: {{ t0: {rs[0]['t']:.2f}, ref: [{', '.join(refs)}], {', '.join(parts)} }}")
    speech = words()
    src = "(function () {\n"
    src += "  const ALPHA = '" + ALPHA + "';\n"
    src += "  const FPS = " + str(FPS) + ";\n"
    src += "  const HANDS = {\n" + ',\n'.join(lines) + "\n  };\n"
    src += "  const VOICE = '" + envelope(speech) + "';\n"
    src += "  const VLAD = '" + envelope(VLAD) + "';\n"
    src += """
  function pair(s, i, lo, hi) {
    return lo + ((ALPHA.indexOf(s[i]) * 62 + ALPHA.indexOf(s[i + 1])) / 3843) * (hi - lo);
  }

  function sample(str, i) {
    const o = i * 10;
    if (o + 10 > str.length || str[o] === '_') return null;
    return { tip: [pair(str, o, -0.2, 1.2), pair(str, o + 2, -0.2, 1.2)], ent: [pair(str, o + 4, -0.2, 1.2), pair(str, o + 6, -0.2, 1.2)], thick: pair(str, o + 8, 0, 0.25) };
  }

  function hand(shot, side, t) {
    const tr = HANDS[shot];
    if (!tr || !tr[side]) return null;
    const n = tr[side].length / 10;
    const x = (t - tr.t0) * FPS;
    if (x < -0.5 || x > n - 0.5) return null;
    const i = Math.max(0, Math.min(n - 1, Math.floor(x)));
    const j = Math.min(n - 1, i + 1);
    const a = sample(tr[side], i), b = sample(tr[side], j);
    if (!a) return null;
    if (!b) return Object.assign(a, { ref: tr.ref[side === 'R' ? 0 : 1] });
    const u = Math.max(0, Math.min(1, x - i));
    const mix = (p, q) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
    return { tip: mix(a.tip, b.tip), ent: mix(a.ent, b.ent), thick: a.thick + (b.thick - a.thick) * u, ref: tr.ref[side === 'R' ? 0 : 1] };
  }

  function env(str, t) {
    const x = t * 20;
    const i = Math.floor(x);
    if (i < 0 || i >= str.length - 1) return 0;
    const a = ALPHA.indexOf(str[i]) / 61, b = ALPHA.indexOf(str[i + 1]) / 61;
    return a + (b - a) * (x - i);
  }

  window.SairaTrack = { shots: Object.keys(HANDS), hand, voice: (t) => env(VOICE, t), vlad: (t) => env(VLAD, t) };
})();
"""
    open(OUT, 'w', encoding='utf-8', newline='').write(src)


if __name__ == '__main__':
    main()
