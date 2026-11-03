import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

MEDIC = [
    (23.3, 30.0), (30.0, 35.3), (36.75, 40.25), (42.1, 43.8), (44.3, 45.9), (47.25, 47.85), (48.95, 52.35), (53.25, 55.2),
    (59.9, 62.2), (64.0, 64.62), (65.6, 66.1), (67.0, 67.98), (68.6, 69.8), (70.75, 73.5), (85.6, 87.68), (88.85, 90.15),
    (92.7, 93.65), (94.38, 97.25), (97.7, 98.8), (101.5, 103.8), (104.22, 105.3), (126.12, 126.78), (128.9, 131.78),
    (180.22, 182.42), (225.0, 228.7), (237.78, 238.55)
]
HEAVY = [(57.05, 59.05), (90.42, 92.06), (98.8, 101.5), (106.45, 107.2), (122.85, 125.36), (176.55, 179.8), (200.25, 203.82), (204.25, 206.36)]
SCOUT = [(13.48, 15.12), (18.12, 18.82), (168.22, 169.72), (173.55, 174.35), (228.9, 230.05), (230.95, 236.0)]
DEMO = [(7.33, 8.6), (149.55, 151.05)]
SPY = [(65.1, 65.66)]


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
    masks = {k: gate(n, v) for k, v in (('medic', MEDIC), ('heavy', HEAVY), ('scout', SCOUT), ('demo', DEMO), ('spy', SPY))}
    lo, hi = np.percentile(db[masks['medic'] > 0.5], [25, 98])
    level = np.clip((db - lo) / (hi - lo), 0, 1)
    jaws = {k: smooth(level * m) for k, m in masks.items()}
    win = np.hanning(hop)
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    sel = (freqs > 200) & (freqs < 3600)
    cen = np.zeros(n)
    for i in range(n):
        sp = np.abs(np.fft.rfft(fr[i] * win))[sel]
        cen[i] = (freqs[sel] * sp).sum() / max(1e-9, sp.sum())
    talk = jaws['medic'] > 0.12
    rnd = smooth(np.clip((1400 - cen) / 800, 0, 1) * talk)
    wide = smooth(np.clip((cen - 1500) / 900, 0, 1) * talk)
    return jaws, rnd, wide, masks['medic']


def field(name, v, last):
    body = " +\n      ".join("'%s'" % c for c in chunks(encode(v)))
    return "    %s: %s%s" % (name, body, '' if last else ',')


def main():
    wav, out = sys.argv[1], sys.argv[2]
    a, sr = load(wav)
    jaws, rnd, wide, mask = analyse(a, sr)
    lines = ["(function () {", "  window.MedVoice = {", "    RATE: %d," % RATE]
    lines.append(field('JAW', jaws['medic'], False))
    lines.append(field('ROUND', rnd, False))
    lines.append(field('WIDE', wide, False))
    lines.append(field('HEAVY', jaws['heavy'], False))
    lines.append(field('SCOUT', jaws['scout'], False))
    lines.append(field('DEMO', jaws['demo'], False))
    lines.append(field('SPY', jaws['spy'], True))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(mask), 'speech', int(mask.sum()), 'mean jaw', round(float(jaws['medic'][mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
