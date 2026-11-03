import json
import os
import subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
POSE = os.path.join(HERE, 'Vl4dNaCTC98-pose.jsonl')
AUDIO = os.path.join(ROOT, 'content', 'YouVid', 'Влад Савельев на СТС, но он реально на СТС.mp3')
OUT = os.path.join(ROOT, 'js', 'apps', 'youvid', 'sts-track.js')
ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
RATE = 20
SUNG = [(28.56, 29.96), (30.0, 33.88), (33.88, 37.36), (37.52, 41.14), (41.14, 44.3), (44.3, 46.7)]

TRACKS = [
    ('stream', 0.0, 1.69, ('big',), 30),
    ('street', 1.68, 1.97, ('big',)),
    ('bend', 1.96, 2.2, ('big',)),
    ('crocs', 2.2, 2.57, ('big',)),
    ('clips', 2.56, 3.39, ('big',)),
    ('horns', 4.7, 5.39, ('big',)),
    ('bed', 5.38, 8.79, ('big',), 30),
    ('beach', 16.85, 20.07, ('big',)),
    ('juice', 27.13, 30.64, ('big',)),
    ('greece', 30.63, 34.32, ('big',), 30),
    ('towel', 38.27, 41.84, ('x', 0.6), 30),
    ('studio', 42.13, 45.1, ('big',)),
    ('bra', 45.1, 50.09, ('big',), 30),
    ('ginger', 23.43, 27.14, ('x', 0.1)),
    ('stripe', 23.43, 27.14, ('x', 0.31)),
    ('specs', 23.43, 27.14, ('x', 0.47)),
    ('longhair', 23.43, 27.14, ('x', 0.61)),
    ('zip', 23.43, 27.14, ('x', 0.89)),
]


def load():
    rows = {}
    for line in open(POSE, encoding='utf-8'):
        d = json.loads(line)
        people = []
        for p in d['people']:
            kp = np.array(p['kp'], dtype=np.float64)
            kp[:, 0] /= d['w']
            kp[:, 1] /= d['h']
            box = np.array(p['box'], dtype=np.float64) / [d['w'], d['h'], d['w'], d['h']]
            people.append((kp, box))
        rows[round(d['t'], 3)] = (d['t'], people)
    return sorted(rows.values(), key=lambda r: r[0])


def anchor(kp, box):
    if kp[0, 2] > 0.4:
        return kp[0, 0]
    return (box[0] + box[2]) / 2


def pick(rows, t0, t1, sel, fps):
    out = []
    cur = sel[1] if sel[0] == 'x' else None
    for t, people in rows:
        if t < t0 - 1e-6 or t >= t1 or abs(t * fps - round(t * fps)) > 0.02:
            continue
        if not people:
            out.append((t, None))
            continue
        if sel[0] == 'big':
            kp, box = max(people, key=lambda p: (p[1][2] - p[1][0]) * (p[1][3] - p[1][1]))
        else:
            kp, box = min(people, key=lambda p: abs(anchor(*p) - cur))
            if abs(anchor(kp, box) - cur) > 0.09:
                out.append((t, None))
                continue
            cur = cur * 0.6 + anchor(kp, box) * 0.4
        out.append((t, kp))
    return out


def smooth(frames):
    n = len(frames)
    data = np.zeros((n, 17, 3))
    for i, (t, kp) in enumerate(frames):
        if kp is not None:
            data[i] = kp
    out = np.zeros_like(data)
    weights = [1, 2, 3, 2, 1]
    for i in range(n):
        for k in range(17):
            acc = np.zeros(2)
            wsum = 0.0
            csum = 0.0
            for j, w in zip(range(i - 2, i + 3), weights):
                if 0 <= j < n and data[j, k, 2] > 0.25:
                    ww = w * data[j, k, 2] ** 2
                    acc += ww * data[j, k, :2]
                    wsum += ww
                    csum += w * data[j, k, 2]
            if wsum > 0:
                out[i, k, :2] = acc / wsum
                out[i, k, 2] = data[i, k, 2] if data[i, k, 2] > 0.25 else min(0.3, csum / 9)
    for k in range(17):
        good = [i for i in range(n) if out[i, k, 2] > 0.25]
        for i in range(n):
            if out[i, k, 2] > 0.25 or not good:
                continue
            before = [g for g in good if g < i]
            after = [g for g in good if g > i]
            if before and after:
                a, b = before[-1], after[0]
                u = (i - a) / (b - a)
                out[i, k, :2] = out[a, k, :2] * (1 - u) + out[b, k, :2] * u
            else:
                out[i, k, :2] = out[(before or after)[-1 if before else 0], k, :2]
            out[i, k, 2] = 0.1
    return out


def pair(v):
    q = int(np.clip(round((v + 0.5) / 2 * 3843), 0, 3843))
    return ALPHA[q // 62] + ALPHA[q % 62]


def encode(data):
    parts = []
    for frame in data:
        for x, y, c in frame:
            parts.append(pair(x) + pair(y) + ALPHA[int(np.clip(round(c * 61), 0, 61))])
    return ''.join(parts)


def voice():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', AUDIO, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = 16000 // RATE
    n = len(a) // hop
    frames = a[:n * hop].reshape(n, hop)
    mag = np.abs(np.fft.rfft(frames * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / 16000)
    band = (freqs >= 300) & (freqs <= 3400)
    db = 20 * np.log10(np.sqrt((mag[:, band] ** 2).mean(1)) + 1e-9)
    ts = np.arange(n) / RATE
    gate = np.zeros(n)
    for a0, a1 in SUNG:
        gate[(ts >= a0) & (ts < a1)] = 1
    lo, hi = np.percentile(db[gate > 0], 10), np.percentile(db[gate > 0], 97)
    v = np.clip((db - lo) / (hi - lo), 0, 1) * gate
    return ''.join(ALPHA[int(round(x * 61))] for x in v)


def main():
    rows = load()
    lines = []
    for spec in TRACKS:
        name, t0, t1, sel = spec[:4]
        fps = spec[4] if len(spec) > 4 else 12
        frames = pick(rows, t0, t1, sel, fps)
        data = smooth(frames)
        lines.append(f"    {name}: [{frames[0][0]:.3f}, {fps}, '{encode(data)}']")
    src = "(function () {\n"
    src += "  const ALPHA = '" + ALPHA + "';\n"
    src += "  const TRACKS = {\n" + ',\n'.join(lines) + "\n  };\n"
    src += "  const VOICE = '" + voice() + "';\n"
    src += """
  function pair(s, i) {
    return ALPHA.indexOf(s[i]) * 62 + ALPHA.indexOf(s[i + 1]);
  }

  function frameAt(str, i) {
    const out = [];
    for (let k = 0; k < 17; k++) {
      const o = (i * 17 + k) * 5;
      out.push([(pair(str, o) / 3843) * 2 - 0.5, (pair(str, o + 2) / 3843) * 2 - 0.5, ALPHA.indexOf(str[o + 4]) / 61]);
    }
    return out;
  }

  function at(name, t) {
    const tr = TRACKS[name];
    if (!tr) return null;
    const n = tr[2].length / 85;
    const x = Math.max(0, Math.min(n - 1, (t - tr[0]) * tr[1]));
    const i = Math.min(n - 2, Math.floor(x));
    if (n < 2) return frameAt(tr[2], 0);
    const a = frameAt(tr[2], i), b = frameAt(tr[2], i + 1);
    const u = x - i;
    return a.map((p, k) => [p[0] + (b[k][0] - p[0]) * u, p[1] + (b[k][1] - p[1]) * u, Math.min(p[2], b[k][2])]);
  }

  function voice(t) {
    const x = t * 20;
    const i = Math.floor(x);
    if (i < 0 || i >= VOICE.length - 1) return 0;
    const a = ALPHA.indexOf(VOICE[i]) / 61, b = ALPHA.indexOf(VOICE[i + 1]) / 61;
    return a + (b - a) * (x - i);
  }

  window.StsTrack = { names: Object.keys(TRACKS), at, voice };
})();
"""
    open(OUT, 'w', encoding='utf-8', newline='').write(src)
    print(OUT, len(src))


main()
