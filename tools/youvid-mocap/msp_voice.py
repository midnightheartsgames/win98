import sys
import numpy as np
from meet_voice import load, band, frames, encode, chunks, RATE

SPY = [
    (27.8, 28.35), (29.15, 29.8), (35.9, 37.95), (39.6, 43.95), (44.7, 45.25), (46.2, 47.9), (48.9, 49.9),
    (56.6, 67.2), (70.05, 70.75), (71.2, 73.3), (78.2, 88.3), (93.2, 95.4), (107.25, 108.85),
    (121.8, 126.2), (136.2, 143.2)
]
RED_SPY = [(171.85, 173.05), (187.7, 190.6)]
SOLDIER = [
    (4.1, 5.4), (8.4, 9.85), (10.05, 11.3), (13.8, 15.25), (16.0, 17.15), (17.65, 18.3), (38.0, 38.55),
    (145.85, 147.55), (148.2, 149.6), (150.45, 152.85), (156.95, 159.0), (159.3, 160.3), (160.75, 162.1), (167.1, 171.35)
]
SCOUT = [(11.25, 12.45), (25.1, 27.65), (38.5, 39.45), (50.0, 55.9), (67.15, 69.3), (90.0, 91.55), (143.9, 145.3), (166.15, 167.15)]
HEAVY = [(20.05, 20.7), (162.9, 165.15)]


def smooth(v):
    return np.convolve(v, np.array([0.25, 0.5, 0.25]), mode='same')


def gate(n, spans):
    t = np.arange(n) / RATE
    mask = np.zeros(n)
    for s, e in spans:
        mask[(t >= s) & (t < e)] = 1
    return mask


def level_of(db, mask):
    lo, hi = np.percentile(db[mask > 0.5], [25, 98])
    return np.clip((db - lo) / (hi - lo), 0, 1)


def analyse(a, sr):
    voice = band(a, sr, 120, 3800)
    fr, hop = frames(voice, sr)
    env = np.sqrt((fr ** 2).mean(1) + 1e-12)
    n = len(env)
    db = 20 * np.log10(env)
    masks = {k: gate(n, v) for k, v in (('spy', SPY), ('red', RED_SPY), ('soldier', SOLDIER), ('scout', SCOUT), ('heavy', HEAVY))}
    spies = np.clip(masks['spy'] + masks['red'], 0, 1)
    out = {}
    for k in ('spy', 'red'):
        out[k] = smooth(level_of(db, spies) * masks[k])
    for k in ('soldier', 'scout', 'heavy'):
        out[k] = smooth(level_of(db, masks[k]) * masks[k])
    win = np.hanning(hop)
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    sel = (freqs > 200) & (freqs < 3600)
    cen = np.zeros(n)
    for i in range(n):
        sp = np.abs(np.fft.rfft(fr[i] * win))[sel]
        cen[i] = (freqs[sel] * sp).sum() / max(1e-9, sp.sum())
    talk = (out['spy'] + out['red']) > 0.12
    out['round'] = smooth(np.clip((1400 - cen) / 800, 0, 1) * talk)
    out['wide'] = smooth(np.clip((cen - 1500) / 900, 0, 1) * talk)
    return out, spies


def field(name, v, last):
    body = " +\n      ".join("'%s'" % c for c in chunks(encode(v)))
    return "    %s: %s%s" % (name, body, '' if last else ',')


def main():
    wav, out = sys.argv[1], sys.argv[2]
    a, sr = load(wav)
    ch, mask = analyse(a, sr)
    lines = ["(function () {", "  window.MspVoice = {", "    RATE: %d," % RATE]
    names = [('JAW', 'spy'), ('RED', 'red'), ('ROUND', 'round'), ('WIDE', 'wide'), ('SOLDIER', 'soldier'), ('SCOUT', 'scout'), ('HEAVY', 'heavy')]
    for i, (name, key) in enumerate(names):
        lines.append(field(name, ch[key], i == len(names) - 1))
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', len(ch['spy']), 'spy speech', int(mask.sum()), 'mean jaw', round(float(ch['spy'][mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
