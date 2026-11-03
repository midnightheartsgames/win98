import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

SPANS = [
    (7.2, 10.3), (10.5, 15.8), (16.05, 18.25), (20.7, 24.35), (25.0, 33.1),
    (50.6, 62.6), (63.4, 64.2), (64.3, 73.1), (73.5, 78.9), (79.1, 84.9), (89.6, 96.9)
]


def smooth(v):
    return np.convolve(v, np.array([0.25, 0.5, 0.25]), mode='same')


def analyse(a, sr):
    voice = band(a, sr, 120, 3800)
    fr, hop = frames(voice, sr)
    env = np.sqrt((fr ** 2).mean(1) + 1e-12)
    n = len(env)
    t = np.arange(n) / RATE
    mask = np.zeros(n)
    for s, e in SPANS:
        mask[(t >= s) & (t < e)] = 1
    db = 20 * np.log10(env)
    lo, hi = np.percentile(db[mask > 0.5], [25, 98])
    jaw = smooth(np.clip((db - lo) / (hi - lo), 0, 1) * mask)
    win = np.hanning(hop)
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    sel = (freqs > 200) & (freqs < 3600)
    cen = np.zeros(n)
    for i in range(n):
        sp = np.abs(np.fft.rfft(fr[i] * win))[sel]
        cen[i] = (freqs[sel] * sp).sum() / max(1e-9, sp.sum())
    talk = jaw > 0.12
    rnd = smooth(np.clip((1400 - cen) / 800, 0, 1) * talk)
    wide = smooth(np.clip((cen - 1500) / 900, 0, 1) * talk)
    return jaw, rnd, wide, mask


def field(name, v, last):
    body = " +\n      ".join("'%s'" % c for c in chunks(encode(v)))
    return "    %s: %s%s" % (name, body, '' if last else ',')


def main():
    wav, out = sys.argv[1], sys.argv[2]
    a, sr = load(wav)
    jaw, rnd, wide, mask = analyse(a, sr)
    lines = ["(function () {", "  window.DemoVoice = {", "    RATE: %d," % RATE]
    lines.append(field('JAW', jaw, False))
    lines.append(field('ROUND', rnd, False))
    lines.append(field('WIDE', wide, True))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(jaw), 'speech', int(mask.sum()), 'mean jaw', round(float(jaw[mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
