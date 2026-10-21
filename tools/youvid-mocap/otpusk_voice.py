import json
import sys
import wave
import numpy as np

ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
RATE = 20


def load(path):
    w = wave.open(path)
    sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return a, sr


def rms(a, sr):
    hop = sr // RATE
    n = len(a) // hop
    frames = a[:n * hop].reshape(n, hop)
    return np.sqrt((frames ** 2).mean(1) + 1e-12)


def band(a, sr):
    spec = np.fft.rfft(a)
    f = np.fft.rfftfreq(len(a), 1 / sr)
    spec[(f < 120) | (f > 3800)] = 0
    return np.fft.irfft(spec, len(a)).astype(np.float32)


def encode(v):
    q = np.clip(np.round(v * (len(ALPHA) - 1)), 0, len(ALPHA) - 1).astype(int)
    return ''.join(ALPHA[i] for i in q)


def track(env, mask):
    db = 20 * np.log10(env)
    lo, hi = np.percentile(db[mask > 0.5], [20, 97]) if (mask > 0.5).any() else (-60, -10)
    v = np.clip((db - lo) / (hi - lo), 0, 1) * mask
    k = np.ones(3) / 3
    return np.convolve(v, k, mode='same')


def main():
    wav, turns_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
    a, sr = load(wav)
    env = rms(band(a, sr), sr)
    n = len(env)
    turns = json.load(open(turns_path, encoding='utf-8'))
    masks = {'vlad': np.zeros(n), 'op': np.zeros(n)}
    t = np.arange(n) / RATE
    for s, e, who in turns:
        sel = (t >= s - 0.05) & (t < e + 0.05)
        masks[who][sel] = 1
    vlad = encode(track(env, masks['vlad']))
    op = encode(track(env, masks['op']))
    js = "(function () {\n  window.OtpuskVoice = {\n    vlad: '" + vlad + "',\n    op: '" + op + "'\n  };\n})();\n"
    open(out, 'w', encoding='utf-8', newline='\n').write(js)
    print('frames', n, 'vlad on', int(masks['vlad'].sum()), 'op on', int(masks['op'].sum()))


if __name__ == '__main__':
    main()
