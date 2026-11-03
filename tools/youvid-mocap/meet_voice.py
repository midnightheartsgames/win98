import sys
import wave
import numpy as np

ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
RATE = 20
CLIPS = {
    'heavy': ('MeetVoice', [
        (10.9, 13.1), (15.6, 18.2), (18.8, 26.5), (28.8, 34.2), (35.5, 41.1),
        (42.5, 49.2), (52.2, 58.4), (61.4, 64.3), (65.9, 76.8), (78.3, 79.9)
    ]),
    'engineer': ('EngVoice', [
        (8.25, 9.3), (9.5, 12.3), (13.85, 16.0), (16.4, 19.8), (21.0, 23.6), (30.8, 31.45),
        (32.8, 38.7), (40.55, 41.3), (43.4, 45.6), (46.6, 48.4), (49.9, 51.1), (53.75, 55.35),
        (56.75, 61.1), (61.8, 64.05), (64.6, 66.35), (67.4, 68.8)
    ])
}


def load(path):
    w = wave.open(path)
    sr = w.getframerate()
    ch = w.getnchannels()
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return a.reshape(-1, ch).mean(1), sr


def band(a, sr, lo, hi):
    spec = np.fft.rfft(a)
    f = np.fft.rfftfreq(len(a), 1 / sr)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(a)).astype(np.float32)


def frames(a, sr):
    hop = sr // RATE
    n = len(a) // hop
    return a[:n * hop].reshape(n, hop), hop


def encode(v):
    q = np.clip(np.round(v * (len(ALPHA) - 1)), 0, len(ALPHA) - 1).astype(int)
    return ''.join(ALPHA[i] for i in q)


def chunks(s, width=120):
    return [s[i:i + width] for i in range(0, len(s), width)]


def beats(path):
    import librosa
    y, sr = librosa.load(path, sr=22050, mono=True)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
    return librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=256, units='time')[1]


def main():
    wav, out = sys.argv[1], sys.argv[2]
    name, spans = CLIPS[sys.argv[3] if len(sys.argv) > 3 else 'heavy']
    a, sr = load(wav)
    voice = band(a, sr, 120, 3800)
    fr, hop = frames(voice, sr)
    env = np.sqrt((fr ** 2).mean(1) + 1e-12)
    n = len(env)
    t = np.arange(n) / RATE
    mask = np.zeros(n)
    for s, e in spans:
        mask[(t >= s) & (t < e)] = 1
    db = 20 * np.log10(env)
    lo, hi = np.percentile(db[mask > 0.5], [25, 98])
    jaw = np.clip((db - lo) / (hi - lo), 0, 1) * mask
    jaw = np.convolve(jaw, np.array([0.25, 0.5, 0.25]), mode='same')
    win = np.hanning(hop)
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    sel = (freqs > 200) & (freqs < 3600)
    cen = np.zeros(n)
    for i in range(n):
        sp = np.abs(np.fft.rfft(fr[i] * win))[sel]
        cen[i] = (freqs[sel] * sp).sum() / max(1e-9, sp.sum())
    rnd = np.clip((1400 - cen) / 800, 0, 1) * (jaw > 0.12)
    rnd = np.convolve(rnd, np.array([0.25, 0.5, 0.25]), mode='same')
    lines = ["(function () {", "  window.%s = {" % name, "    RATE: %d," % RATE, "    JAW: ''"]
    lines[-1] = "    JAW: " + " +\n      ".join("'%s'" % c for c in chunks(encode(jaw))) + ","
    lines.append("    ROUND: " + " +\n      ".join("'%s'" % c for c in chunks(encode(rnd))))
    if len(sys.argv) > 4:
        lines[-1] += ","
        lines.append("    BEATS: [" + ",\n      ".join(", ".join("%.2f" % b for b in row) for row in np.array_split(beats(sys.argv[4]), 12)) + "]")
    lines += ["  };", "})();", ""]
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('frames', n, 'speech', int(mask.sum()), 'mean jaw', round(float(jaw[mask > 0.5].mean()), 3))


if __name__ == '__main__':
    main()
