import sys, os, json
S = sys.argv[1]
import numpy as np
from basic_pitch.inference import predict, Model
from basic_pitch import ICASSP_2022_MODEL_PATH
import pathlib
model_path = ICASSP_2022_MODEL_PATH
print('model', model_path)
base = os.path.join(S, 'stems', 'htdemucs_ft')
out = {}
model = Model(model_path)
for stem, onset, frame, minlen in [('other', 0.45, 0.28, 90), ('bass', 0.4, 0.25, 90), ('vocals', 0.5, 0.3, 90)]:
    _, midi, notes = predict(os.path.join(base, stem + '.wav'), model, onset_threshold=onset, frame_threshold=frame, minimum_note_length=minlen, multiple_pitch_bends=False, melodia_trick=True)
    out[stem] = [[float(n[0]), float(n[1]), int(n[2]), float(n[3])] for n in notes]
    print(stem, len(out[stem]))
json.dump(out, open(os.path.join(S, 'notes.json'), 'w'))
