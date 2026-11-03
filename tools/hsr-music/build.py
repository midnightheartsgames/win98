import site, sys, os, json
sys.path.append(site.getusersitepackages())
sys.path.append(os.path.join(sys.argv[4] if len(sys.argv) > 4 else '.', 'Lib', 'site-packages'))
import numpy as np, librosa, mido
S = sys.argv[1]
OUT = sys.argv[2]
CFG = json.load(open(sys.argv[3]))
base = os.path.join(S, 'stems', 'htdemucs_ft')
sr = 22050
BPM = CFG['bpm']
PHASE = CFG['phase']
SPB = 60 / BPM
SL = SPB / 4
LOOP_START_BAR = CFG['loopStartBar']
LOOP_END_BAR = CFG['loopEndBar']
TOTAL = LOOP_END_BAR * 16
st = {n: librosa.load(os.path.join(base, n + '.wav'), sr=sr, mono=True)[0] for n in ['drums', 'bass', 'other', 'vocals']}
notes = json.load(open(os.path.join(S, 'notes.json')))
slot = lambda t: int(round((t - PHASE) / SL))

def clean(items, low, high, min_amp, mono=False, max_len=None):
    out = []
    for s, e, p, a in items:
        if p < low or p > high or a < min_amp:
            continue
        a0, b0 = slot(s), max(slot(s) + 1, slot(e))
        if a0 < 0 or a0 >= TOTAL:
            continue
        if max_len:
            b0 = min(b0, a0 + max_len)
        out.append([a0, min(b0, TOTAL), p, a])
    out.sort()
    merged = {}
    for a0, b0, p, a in out:
        k = (a0, p)
        if k in merged:
            merged[k][1] = max(merged[k][1], b0); merged[k][3] = max(merged[k][3], a)
        else:
            merged[k] = [a0, b0, p, a]
    res = sorted(merged.values())
    if mono:
        by = {}
        for n in res:
            if n[0] not in by or n[3] > by[n[0]][3]:
                by[n[0]] = n
        res = [by[k] for k in sorted(by)]
        for i in range(len(res) - 1):
            res[i][1] = min(res[i][1], res[i + 1][0])
    return res

def legato(part, gap=2):
    part = sorted(part)
    last = {}
    for n in part:
        prev = last.get(n[2])
        if prev is not None and 0 < n[0] - prev[1] <= gap and n[3] < 0.5:
            prev[1] = n[0]
        last[n[2]] = n
    return part

def thin_semitones(part):
    by = {}
    for n in part:
        by.setdefault(n[0], []).append(n)
    keep = []
    for k, ns in by.items():
        ns.sort(key=lambda x: -x[3])
        chosen = []
        for n in ns:
            if all(abs(n[2] - c[2]) > 1 for c in chosen) and len(chosen) < 4:
                chosen.append(n)
        keep += chosen
    return sorted(keep)

bass = clean(notes['bass'], 26, 47, 0.25, mono=True)
mid = thin_semitones(legato(clean(notes['other'], CFG.get('midLow', 40), 68, 0.28)))
lead = thin_semitones(legato(clean(notes['other'], 69, 92, 0.3), gap=1))
voc = legato(clean(notes['vocals'], 50, 80, 0.32, mono=True), gap=3)
print('notes bass', len(bass), 'mid', len(mid), 'lead', len(lead), 'voice', len(voc))

def band(y, lo, hi):
    S_ = np.abs(librosa.stft(y, n_fft=1024, hop_length=256))
    f = librosa.fft_frequencies(sr=sr, n_fft=1024)
    return S_[(f >= lo) & (f < hi)].sum(axis=0)

def drum_hits(lo, hi, thresh, key, vmin, vmax):
    env = band(st['drums'], lo, hi)
    d = np.maximum(0, np.diff(env, prepend=env[0]))
    d = d / (d.max() + 1e-9)
    hits = {}
    t = librosa.frames_to_time(np.arange(len(d)), sr=sr, hop_length=256)
    from scipy.signal import find_peaks
    pk, pr = find_peaks(d, height=thresh, distance=int(0.09 * sr / 256))
    for i in pk:
        s = slot(t[i])
        if 0 <= s < TOTAL:
            hits[s] = max(hits.get(s, 0), float(d[i]))
    return [[s, s + 1, key, vmin + (vmax - vmin) * min(1, v / 0.7)] for s, v in sorted(hits.items())]

GATE = CFG.get('drumGate', 1)
kick = drum_hits(25, 120, 0.22 * GATE, 35, 70, 118)
snare = drum_hits(180, 2500, 0.3 * GATE, 38, 58, 104)
hat = drum_hits(6000, 11000, 0.2 * GATE, 42, 36, 74)
print('drums kick', len(kick), 'snare', len(snare), 'hat', len(hat))

def curve(y, floor=46):
    hop = int(SL * sr)
    out = []
    peak = 1e-9
    vals = []
    for i in range(TOTAL):
        a = int((PHASE + i * SL) * sr)
        seg = y[a:a + hop]
        v = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0
        vals.append(v)
        peak = max(peak, v)
    ref = np.percentile(vals, 96) + 1e-9
    last = None
    for i, v in enumerate(vals):
        db = 20 * np.log10(max(v, 1e-6) / ref)
        c = int(np.clip(127 + db * 3.2, floor, 127))
        if last is None or abs(c - last) >= 6:
            out.append((i, c)); last = c
    return out

PPQ = 480
TK = PPQ // 4
mid_file = mido.MidiFile(type=1, ticks_per_beat=PPQ)
tempo = mido.MidiTrack()
mid_file.tracks.append(tempo)
tempo.append(mido.MetaMessage('track_name', name=CFG['name'], time=0))
tempo.append(mido.MetaMessage('set_tempo', tempo=int(round(60e6 / BPM)), time=0))
tempo.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
tempo.append(mido.MetaMessage('marker', text='loopStart', time=LOOP_START_BAR * 16 * TK))
tempo.append(mido.MetaMessage('marker', text='loopEnd', time=(LOOP_END_BAR - LOOP_START_BAR) * 16 * TK))

def add(name, ch, prog, level, part, stem=None, pan=64, bright=None, vel=(56, 118), drum=False):
    tr = mido.MidiTrack(); mid_file.tracks.append(tr)
    tr.append(mido.MetaMessage('track_name', name=name, time=0))
    ev = []
    if not drum:
        ev.append((0, 0, mido.Message('program_change', channel=ch, program=prog, time=0)))
    ev.append((0, 0, mido.Message('control_change', channel=ch, control=7, value=level, time=0)))
    ev.append((0, 0, mido.Message('control_change', channel=ch, control=10, value=pan, time=0)))
    if bright:
        ev.append((0, 0, mido.Message('control_change', channel=ch, control=74, value=bright, time=0)))
    if stem is not None:
        for i, c in curve(stem):
            ev.append((i * TK, 1, mido.Message('control_change', channel=ch, control=11, value=c, time=0)))
    for a0, b0, p, a in part:
        v = int(a) if drum else int(vel[0] + (vel[1] - vel[0]) * min(1, a / 0.8))
        ev.append((a0 * TK, 2, mido.Message('note_on', channel=ch, note=p, velocity=max(1, min(127, v)), time=0)))
        ev.append((b0 * TK - (TK // 8 if not drum else 0), 0, mido.Message('note_off', channel=ch, note=p, velocity=0, time=0)))
    ev.sort(key=lambda x: (x[0], x[1]))
    t = 0
    for at, _, m in ev:
        at = max(at, t)
        tr.append(m.copy(time=at - t)); t = at
    tr.append(mido.MetaMessage('end_of_track', time=0))

PARTS = {'bass': [38, 110], 'pluck': [46, 120], 'lead': [81, 112], 'voice': [52, 98], 'drums': [0, 96]}
PARTS.update(CFG.get('parts', {}))
add('Bass', 0, PARTS['bass'][0], PARTS['bass'][1], bass, st['bass'], vel=(70, 118))
add('Pluck', 1, PARTS['pluck'][0], PARTS['pluck'][1], mid, st['other'], pan=56, vel=(58, 112))
add('Lead', 2, PARTS['lead'][0], PARTS['lead'][1], lead, st['other'], pan=72, bright=86, vel=(58, 108))
add('Voice', 3, PARTS['voice'][0], PARTS['voice'][1], voc, st['vocals'], pan=64, vel=(60, 104))
add('Drums', 9, 0, PARTS['drums'][1], sorted(kick + snare + hat), None, drum=True)
tempo.append(mido.MetaMessage('end_of_track', time=0))
mid_file.save(OUT)
print('saved', OUT, os.path.getsize(OUT), 'loop', round(LOOP_START_BAR * 16 * SL, 2), round(LOOP_END_BAR * 16 * SL, 2))
