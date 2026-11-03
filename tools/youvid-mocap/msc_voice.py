import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

SCOUT = [
    (36.35, 38.35), (38.55, 40.25), (43.45, 44.05), (44.45, 46.65), (46.9, 49.2), (49.2, 49.9),
    (50.35, 51.35), (51.4, 53.4), (53.4, 54.6), (57.35, 58.0), (59.0, 63.25), (64.4, 65.3),
    (65.3, 65.85), (65.85, 68.4), (68.4, 70.2)
]
HEAVY = [(55.45, 57.1), (63.3, 64.2)]


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
    scout, heavy = gate(n, SCOUT), gate(n, HEAVY)
    lo, hi = np.percentile(db[scout > 0.5], [25, 98])
    level = np.clip((db - lo) / (hi - lo), 0, 1)
    jaw = smooth(level * scout)
    hjaw = smooth(level * heavy)
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
    return jaw, rnd, wide, hjaw, scout


def field(name, v, last):
    body = " +\n      ".join("'%s'" % c for c in chunks(encode(v)))
    return "    %s: %s%s" % (name, body, '' if last else ',')


def main():
    wav, out = sys.argv[1], sys.argv[2]
    a, sr = load(wav)
    jaw, rnd, wide, hjaw, mask = analyse(a, sr)
    lines = ["(function () {", "  window.MscVoice = {", "    RATE: %d," % RATE]
    lines.append(field('JAW', jaw, False))
    lines.append(field('ROUND', rnd, False))
    lines.append(field('WIDE', wide, False))
    lines.append(field('HEAVY', hjaw, True))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(jaw), 'speech', int(mask.sum()), 'mean jaw', round(float(jaw[mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
