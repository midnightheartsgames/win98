# Field themes of HSR 98: recording to MIDI

Turns a recording in `content/music` into a MIDI file for `H.Midi.Player`. Used for *Cumulus Formations*, *Anthropic Domain*, *Warden of Jade*, *Ave Astra et Viator*, *Into the Breach*, *Hunter's Intuition*, *Fabulous Foresight*, *Upon the Firmament*, *Into the Desolate*, *Lustrous Moonlight*, *Exquisite Ingenuity*, *Deerstalker*, *Evanescent Dreams*, *Erstwhile Resonance*, *Gleaming Clash*, the three parts of *Pedujara* (*Demiseless Existence*, *Ephemeral Cycle*, *Even Immortality Ends*), *Paean of Indulgence*, *Serene Stroll*, *Timeline Astral Express* (the Express theme: piano only, so bass, voice and drums have level 0) *Embers* (Belobog: loop from bar 1, bar 0 is the intro), *Streets Abuzz* (the Underworld: 80 BPM in triplets, built on a 120 BPM grid of sixteenths), *Eternal Freeze* (Outlying Snow Plains), *Dense Floe* (Corridor of Fading Echoes, `drumGate` 0.45), *Cold Iron, Warming Sun* (Pillars of Creation), *Faded Sun* (Great Mine), *Ghost From the Past* (Rivet Town and its outskirts), *Lingering Heat* (the orphanage hill; no drums, 70.45 BPM), *Everwinter* (Everwinter Hill, 136 BPM) and *Fate* (Path Space, 130 BPM, bass on the `sub` patch 39). The recordings are sources only: `content/music/*.mp4` stays out of git and out of the releases.

Work folder `W` is any empty folder outside the project.

1. `ffmpeg -i "content/music/<track>.mp4" -vn -ac 2 -ar 44100 W/song.wav`
2. Make a venv with system packages: `python -m venv --system-site-packages W/venv`. Inside it: `pip install --no-deps demucs basic-pitch`, `pip install sphn dora-search einops julius openunmix pyyaml tqdm treetable retrying omegaconf submitit cloudpickle mido pretty_midi mir_eval resampy scikit-learn`. Demucs imports `lameenc`, which has no wheel here: put a one-line `lameenc.py` with a dummy `Encoder` into the venv site-packages.
3. Stems, about 3 minutes on the CPU for 90 s: `W/venv/Scripts/python -m demucs -n htdemucs_ft -d cpu --filename "{stem}.wav" -o W/stems W/song.wav`
4. Notes: `W/venv/Scripts/python tools/hsr-music/notes.py W` writes `W/notes.json`.
5. Tempo, sixteenth grid and loop candidates: `python -I tools/hsr-music/probe.py W [bpm]` prints them and writes `W/roll.png`. Pick a loop from `whole phrases` and write `W/config.json`: `{ "name": "...", "bpm": 117.45, "phase": 0.1, "loopStartBar": 2, "loopEndBar": 43, "parts": { "bass": [38, 110] } }`. `parts` is optional: `[GM program, level]` for `bass`, `pluck`, `lead`, `voice`, and `[0, level]` for `drums`. `midLow` is optional too: the lowest key of the pluck part, 40 by default. `drumGate` scales the drum hit thresholds (1 by default): lower it when the drum stem is steady but the hits come out sparse.
6. Build: `python tools/hsr-music/build.py W "content/music/<track>.mid" W/config.json W/venv`.
7. Check with the real synth: `node tools/hsr-music/render.cjs "content/music/<track>.mid" W/render.pcm 92` (headless Edge, OfflineAudioContext), then `python tools/hsr-music/qa.py W W/render.pcm <bpm>`. *Cumulus Formations* gives chroma cosine 0.94 and -24.8 dB RMS. The other tracks of the game render at about -25 dB.
8. Add the track to `TRACKS` in `hsr-audio.js` with a fallback and set `music` on the map.

## Original themes: score to MIDI

The themes of `HSR-MUSIC.md` are written from scratch, without any recording. Each one is a score in `tools/hsr-music/scores/<id>.json` that builds `content/music/hsr98-<id>.mid`.

1. Build: `node tools/hsr-music/compose.cjs tools/hsr-music/scores/<id>.json`. It prints the length, the loop in seconds and the notes per part.
2. Render with the real synth: `node tools/hsr-music/render.cjs content/music/hsr98-<id>.mid W/<id>.pcm <loop end + 15> 44100`. Besides the PCM it prints the RMS of the loop, the peak and the level step at the loop seam. Aim for about -25 dB RMS, a peak below -1 dBFS and a seam step within 3 dB.
3. Preview for the author: `ffmpeg -f s16le -ar 44100 -ac 1 -i W/<id>.pcm -b:a 192k content/music/preview/hsr98-<id>.mp3`. The preview folder stays out of git.

Score fields:

- `bpm`, `time` (`[4, 4]`, `[6, 8]`), `seed` (velocity jitter), optional `swing` (part of a sixteenth that late sixteenths are delayed by) and `jitter`.
- `parts`: `{ ch, prog, vol, pan, rev, vel, gate, bright }` per part, or `{ drums: true }` for channel 10. `vol`, `pan`, `rev` and `bright` become CC 7, 10, 91 and 74.
- `sections`: `bars`, `chords` and one entry per part. `form` lists the sections in order and `loop` is `[first, end)` as indexes into `form`.
- `chords`: bars split by `|`, chords in a bar share it evenly unless they carry `:steps` (`A7sus4:8 A7:8`); `%` repeats the last chord. Symbols: `Dm9`, `Bbmaj7`, `A7sus4`, `Ebmaj7#11`, `Em7b5`, `C#7b9`, `Gm7/C`, `Asus4`, `C5`.
- A note line: bars split by `|`, tokens `D5:4` (note and length in sixteenths), `[C4 E4 G4]:8` (chord), `.:4` (rest), `_:4` (tie), `!` and `?` for an accent or a soft note. Every bar must add up to the bar length. An object `{ line, shift, vel }` transposes or changes the velocity of a line.
- Patterns follow the chords: `{ type: 'pad', voices, center }`, `{ type: 'chord', rhythm, voices, center, len }`, `{ type: 'arp', rhythm, voices, center, octaves, order }` (`up`, `down`, `updown` or a list of indexes) and `{ type: 'bass', rhythm, seq, low }` (`seq` tokens `1` bass note, `r` root, `3`, `5`, `7`, `8` octave). Rhythm strings repeat per sixteenth: `x` hit, `X` accent, `o` soft, `-` hold, `.` rest.
- Drums: `{ kick: 'x...x...', hat: 'x.x.x.x.' }` with the names of `DRUMS` in `compose.cjs`; `once` replaces the first bar and `fill` the last bar of the section.
- `expr` in a section sets CC 11 per part at its start (127 by default), a pair `[from, to]` ramps it beat by beat.

The synth plays GM 8–15 as bells and mallets, 24–28 as plucked strings and 72, 74–79 as flutes; no recording-based MIDI file uses these programs. Drum keys 39, 54 and 70 are a clap, a tambourine and a shaker. To set the balance, render single parts with the others at `vol` 0: the melody should sit a few dB above the loudest accompaniment part.
