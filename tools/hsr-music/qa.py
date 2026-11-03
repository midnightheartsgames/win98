import site, sys, os
sys.path.append(site.getusersitepackages())
import numpy as np, librosa
S = sys.argv[1]
SR = 22050
orig, _ = librosa.load(os.path.join(S, 'song.wav'), sr=SR, mono=True)
pcm = np.frombuffer(open(sys.argv[2], 'rb').read(), dtype=np.int16).astype(np.float32) / 32768
n = min(len(orig), len(pcm))
A, B = orig[:n], pcm[:n]
print('rms orig', round(20 * np.log10(np.sqrt(np.mean(A ** 2))), 1), 'render', round(20 * np.log10(np.sqrt(np.mean(B ** 2)) + 1e-9), 1), 'peak render', round(float(np.abs(B).max()), 2))
hop = 512
half = int(2 * 60 / float(sys.argv[3]) * SR / hop)
ca = librosa.feature.chroma_cqt(y=A, sr=SR, hop_length=hop)
cb = librosa.feature.chroma_cqt(y=B, sr=SR, hop_length=hop)
vals = []
for i in range(0, min(ca.shape[1], cb.shape[1]) - half, half):
    x, y = ca[:, i:i + half].mean(axis=1), cb[:, i:i + half].mean(axis=1)
    vals.append(float(np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y) + 1e-9)))
print('chroma cosine per half bar mean', round(float(np.mean(vals)), 3), 'p20', round(float(np.percentile(vals, 20)), 3))
bar = int(4 * 60 / float(sys.argv[3]) * SR)
la = [np.sqrt(np.mean(A[i:i + bar] ** 2)) for i in range(0, n - bar, bar)]
lb = [np.sqrt(np.mean(B[i:i + bar] ** 2)) for i in range(0, n - bar, bar)]
print('bar loudness corr', round(float(np.corrcoef(20 * np.log10(np.array(la) + 1e-6), 20 * np.log10(np.array(lb) + 1e-6))[0, 1]), 3))
sa = np.abs(librosa.stft(A, n_fft=2048)); sb = np.abs(librosa.stft(B, n_fft=2048))
f = librosa.fft_frequencies(sr=SR, n_fft=2048)
for lo, hi in [(20, 120), (120, 500), (500, 2000), (2000, 8000)]:
    m = (f >= lo) & (f < hi)
    print('band', lo, hi, 'orig', round(20 * np.log10(sa[m].mean()), 1), 'render', round(20 * np.log10(sb[m].mean() + 1e-9), 1))
print('bars rendered dB', [int(20 * np.log10(v + 1e-6)) for v in lb][:44])
print('bars original dB', [int(20 * np.log10(v + 1e-6)) for v in la][:44])
