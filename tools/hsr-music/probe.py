import site, sys, os, json
sys.path.append(site.getusersitepackages())
import numpy as np, librosa
from PIL import Image, ImageDraw

S = sys.argv[1]
base = os.path.join(S, 'stems', 'htdemucs_ft')
sr = 22050
hop = 256
st = {n: librosa.load(os.path.join(base, n + '.wav'), sr=sr, mono=True)[0] for n in ['drums', 'bass', 'other', 'vocals']}
dur = len(st['drums']) / sr
db = lambda y: round(float(20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9)), 1)
print('duration', round(dur, 1), 'rms', {k: db(v) for k, v in st.items()})


def per(y, step=10):
    return [int(db(y[int(t * sr):int((t + step) * sr)])) for t in range(0, int(dur), step)]


for k in st:
    print(k.ljust(7), per(st[k]))

full = st['drums'] + 0.5 * st['bass'] + 0.5 * st['other']
env = librosa.onset.onset_strength(y=full, sr=sr, hop_length=hop)
env = env / (env.max() + 1e-9)
fps = sr / hop


def grid_score(bpm):
    sl = 60 / bpm / 4
    n = int(len(env) / fps / sl)
    best = (0, 0)
    for ph in np.arange(0, 60 / bpm, 0.01):
        at = np.round((ph + np.arange(n) * sl) * fps).astype(int)
        at = at[(at >= 0) & (at < len(env))]
        v = float(env[at].mean())
        if v > best[0]:
            best = (v, float(ph))
    return best


if len(sys.argv) > 2:
    bpm = float(sys.argv[2])
    ph = grid_score(bpm)[1]
else:
    rough = sorted(((grid_score(b)[0], b) for b in np.arange(70, 180, 0.5)), reverse=True)[:6]
    print('tempo rough', [(round(a, 3), float(b)) for a, b in rough])
    scored = []
    for _, b0 in rough[:3]:
        for b in np.arange(b0 - 0.5, b0 + 0.5, 0.05):
            v, ph = grid_score(float(b))
            scored.append((round(v, 4), round(float(b), 2), round(ph, 2)))
    scored.sort(reverse=True)
    print('tempo fine (score, bpm, phase in a beat)', scored[:5])
    bpm = scored[0][1]
    ph = scored[0][2]
spb = 60 / bpm
kick = librosa.onset.onset_strength(y=st['drums'] + st['bass'], sr=sr, hop_length=hop, fmax=200)
kick = kick / (kick.max() + 1e-9)
bars = {}
for k in range(4):
    at = np.round((ph + k * spb + np.arange(int(dur / (spb * 4))) * spb * 4) * fps).astype(int)
    at = at[at < len(kick)]
    bars[k] = round(float(kick[at].mean()), 3)
print('downbeat score per beat offset', bars)
best = max(bars, key=bars.get)
phase = round(ph + best * spb, 3)
if phase >= spb * 2:
    phase = round(phase - spb * 4, 3) if phase - spb * 4 >= 0 else phase
print('bpm', bpm, 'phase', phase, 'bar s', round(spb * 4, 3))

y = st['other'] + st['bass'] + 0.5 * st['vocals']
hop2 = 2048
chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop2)
mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=sr, hop_length=hop2, n_mels=40))
fe = np.vstack([chroma, (mel - mel.mean()) / (mel.std() + 1e-6) * 0.3])
fe = fe / (np.linalg.norm(fe, axis=0, keepdims=True) + 1e-6)
ffps = sr / hop2
barlen = spb * 4
found = []
for bars_n in range(8, int(dur / barlen)):
    lag = int(bars_n * barlen * ffps)
    n = fe.shape[1] - lag
    if n < ffps * 8:
        continue
    sim = (fe[:, :n] * fe[:, lag:lag + n]).sum(axis=0)
    win = int(ffps * 8)
    run = np.convolve(sim, np.ones(win) / win, mode='valid')
    i = int(np.argmax(run))
    found.append((round(float(run[i]), 3), bars_n, round(i / ffps, 1), round(bars_n * barlen, 1)))
found.sort(reverse=True)
print('loop lag (score, bars, start s, lag s)', found[:8])
print('whole phrases (score, bars, start s, lag s)', sorted((f for f in found if f[1] % 4 == 0), key=lambda f: -f[1])[:10])

notes = json.load(open(os.path.join(S, 'notes.json')))
for k in notes:
    arr = np.array(notes[k]) if notes[k] else np.zeros((0, 4))
    if len(arr):
        print(k, 'n', len(arr), 'pitch', int(arr[:, 2].min()), int(np.median(arr[:, 2])), int(arr[:, 2].max()), 'len', round(float(np.median(arr[:, 1] - arr[:, 0])), 2))

W, H = 1600, 700
img = Image.new('RGB', (W, H), (16, 16, 24))
d = ImageDraw.Draw(img)
for p in range(24, 100, 12):
    d.line([(0, H - (p - 24) * H / 76), (W, H - (p - 24) * H / 76)], fill=(50, 50, 70))
for b in range(0, int(dur / barlen) + 1, 4):
    x = (phase + b * barlen) * W / dur
    d.line([(x, 0), (x, H)], fill=(60, 60, 90) if b % 16 else (120, 120, 160))
for k, c in {'other': (120, 220, 200), 'bass': (250, 170, 90), 'vocals': (240, 120, 200)}.items():
    for s, e, p, a in notes.get(k, []):
        yy = H - (p - 24) * H / 76
        d.rectangle([s * W / dur, yy - 3, e * W / dur, yy + 3], fill=tuple(int(x * (0.4 + 0.6 * a)) for x in c))
img.save(os.path.join(S, 'roll.png'))
