import json
import os
import subprocess
import sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import siega

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
AUDIO = os.path.join(ROOT, 'content', 'YouVid', 'Жизнь и Страдания Сиеги.mp3')
OUT = os.path.join(ROOT, 'js', 'apps', 'youvid', 'siega-track.js')
ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
RATE = 20


def voice():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', AUDIO, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = 16000 // RATE
    n = len(a) // hop
    frames = a[:n * hop].reshape(n, hop)
    mag = np.abs(np.fft.rfft(frames * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / 16000)
    band = (freqs >= 250) & (freqs <= 3800)
    db = 20 * np.log10(np.sqrt((mag[:, band] ** 2).mean(1)) + 1e-9)
    lo, hi = np.percentile(db, 18), np.percentile(db, 97)
    v = np.clip((db - lo) / (hi - lo), 0, 1) ** 1.15
    for i in range(1, n):
        v[i] = max(v[i], v[i - 1] * 0.55)
    return ''.join(ALPHA[int(round(x * 61))] for x in v)


def spans(ts, flags, gap=0.2, short=0.2):
    out = []
    start = None
    last = None
    for t, f in zip(ts, flags):
        if f:
            if start is None:
                start = t
            elif last is not None and t - last > gap:
                out.append([start, last])
                start = t
            last = t
        elif start is not None and last is not None and t - last > gap:
            out.append([start, last])
            start = None
    if start is not None:
        out.append([start, last])
    merged = []
    for a, b in out:
        if merged and a - merged[-1][1] <= gap:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [[round(a, 2), round(b + 1 / 15, 2)] for a, b in merged if b - a >= short]


def arms():
    frames, scale = siega.load_pose(siega.CLIP)
    hidden = json.load(open(os.path.join(HERE, 'siega-shots.json'), encoding='utf-8'))
    off = {'L': [], 'R': []}
    for s in hidden:
        for side in ('L', 'R'):
            off[side] += s.get('off' + side, [])
    ts, vis = [], {'L': [], 'R': []}
    for f in frames:
        kp = siega.pick(f, scale)
        t = f['t']
        ts.append(t)
        for side, (ie, iw) in (('L', (7, 9)), ('R', (8, 10))):
            ok = kp is not None and kp[iw][2] > 0 and kp[ie][2] > 0.2
            if any(a <= t < b for a, b in off[side]):
                ok = False
            vis[side].append(ok)
    return {side: spans(ts, vis[side]) for side in ('L', 'R')}


def main():
    data = {'voice': voice(), 'arms': arms()}
    js = "(function () {\n  window.SiegaTrack = {\n    voice: '" + data['voice'] + "',\n    arms: " + json.dumps(data['arms'], separators=(', ', ': ')) + "\n  };\n})();\n"
    open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('voice', len(data['voice']), 'arm spans', {k: len(v) for k, v in data['arms'].items()})


if __name__ == '__main__':
    main()
