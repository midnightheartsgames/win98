import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

SPANS = [
    (14.3, 17.95), (18.7, 31.25), (31.35, 33.3), (34.4, 35.2), (36.5, 39.7),
    (46.8, 56.8), (66.4, 73.3), (81.6, 83.4)
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
    lines = ["(function () {", "  window.MtsVoice = {", "    RATE: %d," % RATE]
    lines.append(field('JAW', jaw, False))
    lines.append(field('ROUND', rnd, False))
    lines.append(field('WIDE', wide, True))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(jaw), 'speech', int(mask.sum()), 'mean jaw', round(float(jaw[mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
