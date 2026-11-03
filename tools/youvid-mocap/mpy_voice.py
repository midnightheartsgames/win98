import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

SPEAKERS = [
    ('HEAVY', [(11.55, 13.5), (14.2, 15.7), (17.6, 19.6)]),
    ('SCOUT', [(23.55, 26.2), (27.7, 29.4), (30.05, 31.2)]),
    ('SPY', [(37.8, 43.4), (45.5, 50.0)]),
    ('SCREAM', [(100.2, 118.6)]),
    ('SOLDIER', [(128.0, 133.2)])
]


def smooth(v):
    return np.convolve(v, np.array([0.25, 0.5, 0.25]), mode='same')


def gate(n, spans):
    t = np.arange(n) / RATE
    mask = np.zeros(n)
    for s, e in spans:
        mask[(t >= s) & (t < e)] = 1
    return mask


def analyse(a, sr):
    voice = band(a, sr, 120, 3800)
    fr, hop = frames(voice, sr)
    env = np.sqrt((fr ** 2).mean(1) + 1e-12)
    n = len(env)
    db = 20 * np.log10(env)
    out = {}
    talk = np.zeros(n)
    for name, spans in SPEAKERS:
        mask = gate(n, spans)
        lo, hi = np.percentile(db[mask > 0.5], [25, 98])
        out[name] = smooth(np.clip((db - lo) / (hi - lo), 0, 1) * mask)
        talk = np.maximum(talk, out[name])
    win = np.hanning(hop)
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    sel = (freqs > 200) & (freqs < 3600)
    cen = np.zeros(n)
    for i in range(n):
        sp = np.abs(np.fft.rfft(fr[i] * win))[sel]
        cen[i] = (freqs[sel] * sp).sum() / max(1e-9, sp.sum())
    on = talk > 0.12
    out['ROUND'] = smooth(np.clip((1400 - cen) / 800, 0, 1) * on)
    out['WIDE'] = smooth(np.clip((cen - 1500) / 900, 0, 1) * on)
    return out, talk


def field(name, v, last):
    body = " +\n      ".join("'%s'" % c for c in chunks(encode(v)))
    return "    %s: %s%s" % (name, body, '' if last else ',')


def main():
    wav, out = sys.argv[1], sys.argv[2]
    a, sr = load(wav)
    ch, talk = analyse(a, sr)
    names = [s[0] for s in SPEAKERS] + ['ROUND', 'WIDE']
    lines = ["(function () {", "  window.MpyVoice = {", "    RATE: %d," % RATE]
    for i, name in enumerate(names):
        lines.append(field(name, ch[name], i == len(names) - 1))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(talk), 'speech', int((talk > 0.12).sum()))


if __name__ == '__main__':
    main()
