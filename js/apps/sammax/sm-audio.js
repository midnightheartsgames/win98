(function (S) {
  'use strict';
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6, 9], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], sus: [0, 5, 7, 10], aug: [0, 4, 8, 10] };
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  const SFX = S.SFX || {};
  const STYLES = S.STYLES || {};

  function chord(sym) {
    const m = sym.match(/^([A-G][b#]?)(.*)$/);
    const root = NOTE[m[1]];
    return { root, iv: QUAL[m[2]] || QUAL[''] };
  }

  function noteMidi(s) {
    const m = s.match(/^([A-G][b#]?)(-?\d)$/);
    if (!m) return null;
    return NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  }

  const RIFF = 'F2:4 F2:2 F#2:2 Ab2:2 Bb2:2 B2:2 C#3:2';
  const RIFFM = 'F2:4 F2:2 F#2:2 Ab2:2 A2:2 B2:2 C#3:2';
  const HRIFF = 'F4:4 F4:2 F#4:2 Ab4:2 Bb4:2 B4:2 C#5:2';
  const HRIFFM = 'F4:4 F4:2 F#4:2 Ab4:2 A4:2 B4:2 C#5:2';
  const DOWN = 'C#3:2 E3:2 C#3:2 D#3:2 C#3:2 B2:2 A2:2 G#2:2';
  const DOWNH = 'C#5:2 E5:2 C#5:2 D#5:2 C#5:2 B4:2 A4:2 G#4:2';
  const CALL = 'F3:3 Ab3:2 Bb3 Ab3 Bb3:3 C#3:2 r:4';
  const BAND = { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' };
  const DANCE = { k: 'x...x...x...x...', s: '....x..x....x...', h: 'xxxxxxxxxxxxxxxx' };
  const WAR_SONG = [
    { bars: 2, pad: true, vol: 0.35, chords: 'E7:32', horn: 'C5:2 B4:2 D5:2 E5:10 | E5:2 C5:2 B4:2 C5:2 B4:2 C5:2 D5:4', bass: 'E2:32', drum: { r: 'xxxxxxxxxxxxxxxx' } },
    { bars: 8, pad: true, vol: 0.55, voice: 'croon',
      chords: 'A:16 | A:8 Aaug:8 | A:8 A6:8 | A6:8 A7:8 | D:16 | D:8 Dm:8 | A:16 | A:8 E7:4 F#m:4',
      lead: 'r:13 C3:3 | C3:2 B2:3 A2:11 | r:8 E3:6 D3:2 | C#3:5 E3:9 D3:2 | r:7 C#3 D3 C#3 C#3:3 E3:3 | E3:5 A3:2 r:2 E3:2 F3 E3:4 | r:2 E3:7 r:2 B2 C#3:4 | E3:2 D#3:2 E3 D3 C#3:3 r:7',
      horn: 'A4:8 E5:6 C#5:2 | C#5:16 | C#5:10 E4:4 F#4:2 | E4:4 C#5:4 A4:8 | D5:12 A4:4 | A4:2 D5:4 F5:4 D5:4 A4:2 | E5:12 A4:4 | C#5:4 E5:8 F#4:2 G#4:2',
      bass: 'A1:16 | A1:16 | A1:16 | A1:8 G1:8 | D2:8 A1:8 | D2:16 | A1:16 | A1:8 E2:4 F#2:4' },
    { bars: 8, pad: true, vol: 0.75, voice: 'croon',
      chords: 'A:16 | A:4 Dm:4 Aaug:8 | C#7:4 F#m:8 E:4 | A7:16 | D:16 | D:8 Dm:8 | E7:16 | E:16',
      lead: 'r:9 D3:3 D#3:4 | C#3:3 B2 E3:4 F3 E3:3 D#3 E3:2 F3 | E3:3 r:7 F#3:3 A3:3 | A3:2 r B3:2 C#4:10 B3 | B3:3 r:2 A3:2 A3:4 r C#3 E3:3 | E3:16 | E3:16 | E3:8 r:8',
      horn: 'A4:6 C#5:2 E5:8 | E5:4 D5:4 F5:4 A4:2 C#5:2 | F5:2 C#5:4 F#5:4 A5:2 E5:4 | E5:4 C#5:6 A4:6 | A4:4 D5:12 | C#5:4 D5:12 | D#5:2 E5:12 B4:2 | G#4:4 E5:12',
      bass: 'A1:16 | A1:4 D2:4 A1:8 | C#2:4 F#2:8 E2:4 | A1:8 C#2:4 G1:4 | D2:16 | D2:8 A1:8 | E2:16 | E2:16' },
    { bars: 2, pad: true, vol: 1.1, chords: 'E:16 | F#m:4 F:4 A:4 C#7:4',
      horn: 'E4:6 F4:2 F#4 G4 G#4:2 A4 B4 C5 D5 | A4:2 F4:2 F#4:2 A4:2 E5:4 C5:2 C#5:2',
      bass: 'E2:16 | F#2:4 F2:4 A1:4 C#2:4', drum: { r: 'xxxxxxxxxxxxxxxx' } },
    { bars: 15, voice: 'group', crash: true, comp: 'x.....x...x.....', drum: BAND,
      chords: 'C#7:16 | C#7:8 B:8 | D:16 | A:8 C#7:8 | C#7:16 | C#7:8 B:8 | C#7:8 A:8 | D:16 | A:16 | A:4 E7:4 D7:8 | D7:8 C#dim:4 F#7:4 | D:8 C#7:8 | C#7:16 | C#7:8 B:8 | C#7:8 A:4 D7:4',
      lead: CALL + ' | r:2 C#3:2 D3 C3:2 B2:2 F3:2 F#3 F#3:2 E3:2 | E3:2 F3:2 F3 E3 F3 D3 E3:2 r:6 | r:16 | ' +
        'r C4 F3:2 A3 G3 Bb3:2 A3:2 Bb3:3 D3 C#3:2 | r D#3 Bb3:2 Ab3 C#4:2 A3:2 F#3 Ab3:3 D#4:2 C#4 | C#4:2 r C#4:2 C#4:2 A3:2 C#4 A3:2 C#4 C#4:2 B3 | B3:4 Bb3 Ab3 B3:4 A3:2 r B3:3 | ' +
        'r E3 Ab3:4 E3:3 E3:2 E3:3 A3 C#4 | C#4:4 E4:2 r:2 C4:2 B3:2 Bb3 C4 B3 A3 | A3:4 r:12 | r:16 | ' +
        'E3 F3 F#3:2 Ab3 G3 Bb3:2 A3:2 r:2 F3:2 Bb3:2 | r C#3:2 C#3 F#3:3 A3:2 A3:3 B3:2 D#3:2 | r:2 E3 Bb2 C#3:3 A2:2 r:7',
      horn: HRIFF + ' | ' + DOWNH + ' | F#4:4 r:4 F#4:2 A4:2 r:4 | E4:2 F#4:2 E4:2 r:6 C#4:4 | ' +
        HRIFF + ' | ' + DOWNH + ' | r:16 | F#4:2 F4:2 E4:2 D4:10 | ' +
        'r:16 | r:8 F#4:4 A4:4 | A4:2 B4:2 C5:4 C#5:2 A#4:4 B4:2 | E4:2 F#4:2 G#4:2 A4:4 E4:2 D5:2 C#5:2 | ' +
        HRIFF + ' | ' + DOWNH + ' | F4:2 E4:2 E4:2 A4:2 D5:8',
      bass: RIFF + ' | ' + DOWN + ' | D2:6 A1:2 D2:4 E2:2 F#2:2 | E2:2 F#2:2 E2:2 A1:4 E2:2 E2:2 C#2:2 | ' +
        RIFF + ' | ' + DOWN + ' | F2:4 Ab2:4 A1:8 | F#2:2 F2:2 E2:2 D2:10 | A1:4 B1:4 C2:4 C#2:4 | A1:2 C#2:2 E2:2 D2:10 | A1:2 B1:2 C2:4 C#2:2 A#1:4 B1:2 | E1:2 F#1:2 G#1:2 A1:4 E1:2 D2:2 C#2:2 | ' +
        RIFF + ' | ' + DOWN + ' | F2:2 E2:2 E2:2 A1:2 D2:8' },
    { bars: 8, crash: true, comp: '..x...x...x...x.', drum: DANCE,
      chords: 'Gm:8 D7:8 | D7:8 G:8 | G7:8 C:4 C7:4 | F7:8 Bb:8 | Gm:8 D7:8 | D7:8 G:8 | G7:8 C:4 C7:4 | F7:8 Bb:4 Eb:4',
      horn: 'F4:2 F#4:2 G4:2 E4 G4 Bb4:2 G4:2 F4:2 F#4:2 | F#4:2 F#4:2 F#4:2 G4:2 A4:2 B4:2 C5:2 D5:2 | B4:2 F4:2 D4:2 E4:2 C4:4 Bb4:2 A4:2 | A4:2 F4:2 Eb4:2 D4:2 Bb3:2 D4:2 F#4:2 G4:2 | ' +
        'F4:2 F#4:2 G4:2 E4 G4 Bb4:2 G4:2 F4:2 F#4:2 | F#4:2 F#4:2 F#4:2 G4:2 A4:2 B4:2 C5:2 D5:2 | B4:2 F4:2 D4:2 E4:2 C4:4 Bb4:2 A4:2 | A4:2 F4:2 Eb4:2 D4:2 Bb4:2 Eb5:2 C5:2 Ab4:2',
      bass: 'G1:4 Bb1:4 D2:4 F#1:4 | F#1:4 A1:4 G1:4 B1:4 | F1:4 D2:4 E1:4 C2:2 Bb1:2 | A1:4 F1:4 Bb1:4 D2:4 | G1:4 D2:4 F#1:4 D2:4 | F#1:4 A1:4 G1:4 B1:4 | F1:4 D2:4 E1:4 C2:2 Bb1:2 | A1:4 F1:4 Bb1:4 Eb2:4' },
    { bars: 4, comp: '..x...x...x...x.', drum: DANCE,
      chords: 'Eb:16 | Bb:16 | Bb:8 Eb:8 | Bb:8 G7:8',
      horn: 'F4:4 G4:2 F#4:2 F4:4 Eb4:4 | Bb4:2 C5:2 C5:2 C#5:2 D5:4 Bb4:4 | Bb4:2 F4:2 D4:2 C#4:2 Eb4:4 G4:4 | Bb4:2 C5:2 C#5:2 D5:2 F5:4 B4:4',
      bass: 'Eb2:4 Bb1:4 Eb2:4 G1:4 | Bb1:4 C2:2 C#2:2 D2:4 Bb1:4 | Bb1:4 D2:4 Eb2:4 G1:4 | Bb1:4 C2:2 C#2:2 D2:4 B1:4' },
    { bars: 4, comp: '..x...x...x...x.', drum: DANCE,
      chords: 'F:8 Bb:4 D7:4 | D7:8 G:8 | G7:8 C:4 C7:4 | F7:8 Bb:4 C7:4',
      horn: 'F4:2 C5:2 G4:2 F#4:2 F4:2 A4:2 Bb4:2 D5:2 | F#4:2 F#4:2 F#4:2 G4:2 A4:2 B4:2 C5:2 D5:2 | B4:2 F4:2 D4:2 E4:2 C4:4 Bb4:2 A4:2 | A4:2 F4:2 A4:2 Bb4:2 D5:2 F4:2 E4:4',
      bass: 'C2:4 F1:4 Bb1:4 D2:4 | F#1:4 A1:4 G1:4 B1:4 | F1:4 D2:4 E1:4 C2:2 Bb1:2 | A1:4 F1:4 Bb1:4 E1:4' },
    { bars: 3, comp: 'x...x...x...x...', drum: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      chords: 'Gm7:8 C7:8 | Bb:16 | Bb:8 D7:8',
      horn: 'G4:4 A4:4 Bb4:4 C5:2 A4:2 | D5:2 Bb4:2 F4:4 Bb4:2 C5:2 F4:2 Eb4:2 | D5:2 C5:2 Bb4:2 B4:2 C5:2 F#4:2 C5:2 D5:2',
      bass: 'F1:4 G1:4 A1:4 Bb1:4 | Bb1:8 F1:8 | Bb1:4 C2:4 D2:8' },
    { bars: 3, pad: true, drum: { k: 'x...x...x...x...', c: 'x...............', r: '........xxxxxxxx' },
      chords: 'G:16 | Bb:4 C:12 | F:16', horn: 'G4:16 | Bb4:4 C5:12 | F5:16', bass: 'G1:16 | Bb1:4 C2:12 | F1:16' },
    { bars: 3, voice: 'croon', comp: 'x.......x.......', drum: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      chords: 'A:8 A7:8 | Dm:8 D7:4 G:4 | G7:8 C:8',
      lead: 'r:16 | r:4 G4 A4 B4:2 C5:6 C#5:2 | C#5:4 r:2 A4:2 D#4 B3 A3 F#3 G#3 E3 G3 Bb3',
      horn: 'A4:4 C#5:4 E5:4 G5:4 | D5:4 F5:4 F#5:4 G5:4 | G5:4 B4:4 C5:4 E5:4',
      bass: 'A1:8 C#2:8 | D2:8 D2:4 B1:4 | G1:8 C2:8' },
    { bars: 7, voice: 'group', crash: true, comp: 'x.....x...x.....', drum: BAND,
      chords: 'C#7:16 | D7:8 G7:8 | C:16 | Am:4 Eb:4 C:8 | C#7:16 | D7:8 G7:8 | G7:8 C:8',
      lead: 'r:4 A3 G3:2 A3 B3 C4 A3:6 | r A3 G#3:2 A3 A3:2 r F3:2 D#3:2 r:2 A3:2 | F#3:3 r G#3 F#3 F3 G3:2 A3 G3:3 r:3 | r:4 F#3 r D#4 E4 D4:2 E4 D4:2 C4 E4:2 | ' +
        'E4:2 F4 r Bb3 Ab3 A3:3 C#4:2 B3 Ab3:3 Ab3 | C#4:2 C#4 A3 B3:3 Bb3:2 C#4:2 C4 C#4 A3:2 C4 | A3 C4 C4 D4:2 E4 F3 F#3:2 C4:4 C#4 B3 C4',
      horn: HRIFFM + ' | D5:2 E5:2 F#5:2 G5:4 F#5:4 D5:2 | C5:2 B4:2 A4:2 F#4:2 G4:2 C5:4 C#5:2 | A4:4 C5:4 E5:2 F#5:2 E5:4 | ' +
        HRIFFM + ' | D5:2 E5:2 F#5:2 G5:4 F#5:4 D5:2 | C5:2 B4:2 A4:2 G4:4 C5:6',
      bass: RIFFM + ' | D2:2 E2:2 F#2:2 G2:4 F#2:4 D2:2 | C2:2 B1:2 A1:2 F#1:2 G1:2 C2:4 C#2:2 | A1:4 A1:4 C2:2 E2:2 F#2:2 E2:2 | ' +
        RIFFM + ' | D2:2 E2:2 F#2:2 G2:4 F#2:4 D2:2 | C2:2 B1:2 A1:2 G1:4 C2:6' },
    { bars: 5, voice: 'croon', comp: 'x.......x.......', drum: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      chords: 'A7:8 F:8 | F:8 D7:8 | C:8 F:8 | F:4 Dm:4 C:4 A7:4 | D7:8 G7:8',
      lead: 'r:2 Bb3:2 C4:4 C#4:2 D4:2 C4:2 C4:2 | C4:2 D4:2 C4:2 C4:3 Ab3 B3:2 A3 F#3:3 | C4:2 D#4 E4:3 C4:3 r C4 C#4:2 B3 C4:2 | r:2 C#4:2 C4:2 A3 C4 D#4:2 C4:2 G3:4 | G3 A3:2 G#3:2 G3:3 r:4 F#3 A3 G#3 G3',
      horn: 'r:8 F4:4 A4:4 | F4:4 D4:4 F#4:4 A4:4 | E4:4 G4:4 F4:4 A4:4 | F4:4 D4:4 E4:4 C#4:4 | D4:4 F#4:4 G4:4 B4:4',
      bass: 'A1:4 A1:4 F1:8 | F1:4 D2:4 D#2:4 E2:4 | E2:8 F2:8 | F2:4 D2:4 D#2:2 E2:4 C#2:2 | D2:4 F#1:2 A1:2 B1:2 C2:4 F#1:2' },
    { bars: 8, voice: 'group', crash: true, comp: 'x.....x...x.....', drum: BAND,
      chords: 'C#7:16 | A7:4 D7:12 | G7:8 C:8 | A7:4 D7:4 G7:4 C:4 | C#7:16 | A7:4 D7:12 | D7:4 G7:4 C:8 | C:16',
      lead: 'G#3 F#3:2 r:2 G3:2 A3 G3 F#3 E3 r D4 C#4 G#3:2 | G#3:3 F#3 E3:2 D#3 D#4 C#4 C4 Bb3 A3:4 Ab3 | r:2 G3:4 r D3 E3:2 C3:6 | C3:2 D3:3 r A3:2 G#3 G3:3 r:4 | ' +
        'E3:2 r E3:2 D4:2 B3 Bb3 A3 G3 F3 Ab3 Bb3 A3:2 | A3:2 C#4:2 r C#4:2 r:2 C4 C#4 D4 Bb3:3 A3 | B3 Bb3:2 A3 r F#3 G3:2 F#3 D#3 F3 Bb3 C4:2 C4:2 | C4:4 G3 Ab3 A3:2 r:8',
      horn: HRIFFM + ' | A4:2 C#5:2 E5:2 D5:2 F#5:4 D5:4 | B4:4 G4:4 C5:4 E5:4 | C#5:4 F#4:4 G4:4 C5:4 | ' +
        HRIFFM + ' | A4:2 C#5:2 E5:2 D5:2 F#5:4 D5:4 | C5:4 B4:4 C5:4 E5:4 | G5:4 E5:4 C5:8',
      bass: RIFFM + ' | D2:2 E2:2 F#2:2 G2:4 F#2:6 | C2:2 B1:2 A1:2 F#1:2 G1:4 C2:4 | A1:2 D2:2 F#1:2 G1:2 B1:2 C2:4 F#1:2 | ' +
        RIFFM + ' | D2:2 E2:2 F#2:2 G2:4 F#2:6 | C2:2 B1:2 A1:2 G1:4 C2:4 G1:2 | C2:4 G1:4 C2:8' },
    { bars: 1, pad: true, crash: true, chords: 'C:16', horn: 'C5:16', bass: 'C2:16', drum: { k: 'x...............' } }
  ];

  const THEMES = {
    title: { bpm: 132, style: 'fanfare', prog: ['C7', 'C7', 'F7', 'F7', 'C7', 'A7', 'D7', 'G7'], mel: 'G4 . E4 G4 A4 . G4 . Bb4 . A4 G4 E4 . C4 . F4 . A4 C5 D5 . C5 A4 G4 . E4 . C4 . . . E4 . G4 . A4 . C5 . Db5 . D5 . C5 . A4 . G4 . F4 . D4 . E4 . . .' },
    office: { bpm: 100, style: 'swing', prog: ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Em7', 'A7'], mel: 'A4 . . F4 G4 . . . B4 . A4 G4 E4 . . . C5 . B4 . G4 . E4 . C#5 . . . A4 . . . D5 . C5 A4 F4 . . . B4 . G4 . D4 . F4 . E4 . G4 . B4 . A4 . . . . . . .' },
    street: { bpm: 126, style: 'swing', prog: ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'C7'], mel: 'C5 . A4 C5 . . A4 . Eb5 . D5 C5 A4 . F4 . Ab4 . A4 C5 . . . . D5 C5 A4 G4 F4 . . . Eb5 . . D5 C5 . Bb4 . Ab4 . A4 . F4 . . . C5 . A4 . G4 . F4 . D4 . F4 G4 A4 . . .' },
    bosco: { bpm: 108, style: 'lounge', prog: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7', 'B7', 'Em7', 'E7'], mel: 'E5 . . C5 D5 . . . B4 . . G4 A4 . . . F#5 . . D5 E5 . . . C5 . . A4 B4 . . . A4 . C5 . E5 . D5 . C5 . B4 . A4 . . . G#4 . B4 . D5 . . . . . . . . . . .' },
    sybil: { bpm: 132, style: 'waltz', prog: ['Fmaj7', 'Fmaj7', 'Dm7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'C7'], mel: 'A4 . C5 . . . G4 . A4 . . . F4 . A4 . . . E4 . F4 . . . D4 . F4 . Bb4 . . . A4 . G4 . . . C5 . . . . . G4 . . . . .' },
    drive: { bpm: 160, style: 'surf', prog: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B7'], mel: 'E4 E4 G4 A4 B4 . B4 A4 G4 G4 E4 . . . . . C5 C5 B4 A4 G4 . A4 . B4 . D5 . B4 . . . E4 E4 G4 A4 B4 . B4 A4 G4 G4 E4 . . . . . C5 B4 A4 G4 A4 . . . F#4 . D#4 . B3 . . .' },
    home: { bpm: 72, style: 'creepy', prog: ['Am', 'F', 'Dm', 'E7', 'Am', 'F', 'B7', 'E7'], mel: 'E5 . . . D5 . C5 . B4 . . . A4 . . . D5 . . . C5 . A4 . G#4 . . . . . . . E5 . . . F5 . E5 . D#5 . . . B4 . . . C5 . . . B4 . A4 . G#4 . . . . . . .' },
    studio: { bpm: 140, style: 'fanfare', prog: ['Bb7', 'Eb7', 'Bb7', 'F7', 'Bb7', 'G7', 'C7', 'F7'], mel: 'F4 . Bb4 . D5 . F5 . . . D5 . Bb4 . . . Eb5 . . G5 . . F5 . D5 . Bb4 . C5 . . . D5 . . Bb4 . . G4 . C5 . . A4 . F4 . . . Bb4 . D5 . C5 . A4 . Bb4 . . . . . . .' },
    dream: { bpm: 112, style: 'waltz', dream: true, prog: ['Cm', 'Ab', 'Fm', 'G7', 'Cm', 'Ab', 'Dm7', 'G7'], mel: 'G4 . . Ab4 G4 . Eb4 . . . C4 . F4 . . G4 F4 . D4 . . . B3 . G4 . . Ab4 G4 . Eb5 . . . D5 . C5 . . B4 . . A4 . G4 . F4 . . .' },
    hypno: { bpm: 90, style: 'hypno', prog: ['Am', 'Am', 'Fmaj7', 'Fmaj7', 'Dm7', 'Dm7', 'E7', 'E7'] },
    finale: { bpm: 150, style: 'surf', prog: ['Dm', 'Dm', 'Bb', 'A7', 'Dm', 'Gm', 'A7', 'A7'], mel: 'D5 . A4 . D5 . E5 . F5 . E5 . D5 . A4 . Bb4 . A4 . G4 . F4 . E4 . . . A4 . . . D5 . A4 . D5 . E5 . F5 . G5 . A5 . . . G5 . F5 . E5 . C#5 . E5 . A5 . . . . . . .' },
    credits: { bpm: 116, style: 'swing', prog: ['C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'A7', 'D7', 'G7', 'C7', 'G7'], mel: 'E5 . G5 . E5 . C5 . D5 . Eb5 . E5 . . . A5 . G5 . F5 . D5 . C5 . A4 . G4 . . . C5 . E5 . G5 . A5 . Bb5 . A5 . G5 . E5 . F5 . A5 . G5 . D5 . C5 . . . . . . .' },
    title2: { bpm: 138, style: 'fanfare', prog: ['F', 'Dm7', 'Gm7', 'C7', 'F', 'D7', 'Gm7', 'C7'], mel: 'C5 . F5 . A5 . F5 . G5 . . . E5 . C5 . D5 . F5 . Bb5 . A5 . G5 . . . . . C5 . F5 . A5 . C6 . D6 . C6 . A5 . F5 . G5 . A5 . G5 . E5 . F5 . . . . . . .' },
    warp: { bpm: 104, style: 'swing', prog: ['Ebmaj7', 'Cm7', 'Fm7', 'Bb7', 'Gm7', 'C7', 'Fm7', 'Bb7'], mel: 'G4 . Bb4 . Eb5 . . D5 C5 . Bb4 . . . . . Ab4 . C5 . F5 . . Eb5 D5 . C5 . . . . . Bb4 . D5 . G5 . F5 . Eb5 . C5 . Bb4 . G4 . Ab4 . C5 . Bb4 . . . . . . .' },
    sitcom: { bpm: 150, style: 'country', prog: ['G', 'G', 'C', 'G', 'G', 'D7', 'G', 'D7'], mel: 'D5 . B4 . G4 . B4 D5 E5 . D5 . B4 . . . C5 . E5 . G5 . E5 . D5 . B4 . G4 . . . D5 . B4 . D5 . G5 . F#5 . E5 . D5 . A4 . B4 . A4 . G4 . . . . . . .' },
    cooking: { bpm: 96, style: 'lounge', prog: ['Fmaj7', 'Em7', 'Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7'], mel: 'A5 . . G5 E5 . . . G5 . . F5 D5 . . . F5 . E5 . D5 . C5 . B4 . . . G4 . . . E5 . F5 . G5 . A5 . C6 . . . B5 . . . A5 . G5 . F5 . D5 . C5 . . . . . . .' },
    idol: { bpm: 128, style: 'fanfare', prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm7', 'E7'], mel: 'E5 . . A5 . . G5 . E5 . C5 . D5 . . . C5 . . F5 . . E5 . C5 . A4 . B4 . . . A4 . C5 . E5 . A5 . G5 . F5 . E5 . D5 . C5 . D5 . B4 . G#4 . . . . . . .' },
    quiz: { bpm: 100, style: 'quiz', prog: ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G7', 'G7'], mel: 'C5 . . . Eb5 . . . G5 . . . F5 . Eb5 . Ab5 . . . G5 . . . F5 . . . D5 . . . C5 . . . Eb5 . . . G5 . . . C6 . . . B5 . . . G5 . . . F5 . D5 . B4 . . .' },
    myra: { bpm: 122, style: 'fanfare', prog: ['Bb', 'Gm7', 'Cm7', 'F7', 'Bb', 'Bb7', 'Eb', 'F7'], mel: 'F5 . D5 . Bb4 . D5 . F5 . . . G5 . F5 . Eb5 . C5 . A4 . C5 . F5 . . . . . Bb5 . A5 . G5 . F5 . D5 . Bb4 . C5 . D5 . Eb5 . G5 . F5 . . . . . . .' },
    rats: { bpm: 176, style: 'surf', prog: ['Am', 'Am', 'G', 'G', 'F', 'F', 'E7', 'E7'], mel: 'A4 A4 C5 A4 D5 . C5 A4 G4 G4 B4 G4 D5 . B4 G4 F4 F4 A4 C5 F5 . E5 C5 E5 . G#4 . B4 . E5 . A4 A4 C5 A4 D5 . C5 A4 G4 G4 B4 G4 D5 . B4 G4 F4 A4 C5 F5 E5 D5 C5 B4 A4 . . . E4 . . .' },
    electro: { bpm: 150, style: 'surf', prog: ['Em', 'C', 'Am', 'B7', 'Em', 'C', 'F#7', 'B7'], mel: 'E5 . B4 . E5 . F#5 . G5 . F#5 . E5 . B4 . C5 . B4 . A4 . G4 . F#4 . . . B4 . . . E5 . B4 . E5 . F#5 . G5 . A5 . B5 . . . A5 . G5 . F#5 . D#5 . F#5 . B5 . . . . . . .' },
    credits2: { bpm: 120, style: 'swing', prog: ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'C7'], mel: 'A5 . C6 . A5 . F5 . G5 . Ab5 . A5 . . . D6 . C6 . Bb5 . G5 . F5 . D5 . C5 . . . F5 . A5 . C6 . D6 . Eb6 . D6 . C6 . A5 . Bb5 . D6 . C6 . G5 . F5 . . . . . . .' },
    title3: { bpm: 132, style: 'tango', prog: ['Gm', 'Gm', 'Cm', 'Cm', 'D7', 'D7', 'Gm', 'D7'], mel: 'D5 . . D5 G5 . F#5 . G5 . A5 . Bb5 . . . A5 . . G5 Eb5 . D5 . C5 . . . . . . . C5 . . C5 F#5 . E5 . F#5 . G5 . A5 . . . G5 . F#5 . D5 . A4 . D5 . . . . . . .' },
    playland: { bpm: 144, style: 'fanfare', prog: ['C', 'Am', 'F', 'G7', 'C', 'Am', 'Dm7', 'G7'], mel: 'E5 . G5 . E5 . C5 . D5 . E5 . F5 . . . E5 . C5 . A4 . C5 . D5 . . . . . E5 . G5 . A5 . G5 . F5 . E5 . D5 . C5 . D5 . E5 . C5 . . . . . . .' },
    casino: { bpm: 116, style: 'tango', prog: ['Am', 'Am', 'Dm', 'E7', 'Am', 'F', 'E7', 'E7'], mel: 'E5 . . E5 F5 . E5 . D#5 . E5 . . . . . F5 . . F5 A5 . G#5 . F5 . E5 . . . . . A4 . C5 . E5 . A5 . G#5 . F5 . E5 . D5 . C5 . B4 . G#4 . . . . . . .' },
    mob: { bpm: 156, style: 'tarantella', prog: ['Am', 'E7', 'E7', 'Am', 'Am', 'Dm', 'E7', 'Am'], mel: 'E5 . E5 E5 F5 E5 D5 . B4 . . . B4 . B4 B4 C5 B4 A4 . E5 . . . A4 C5 E5 A5 . E5 F5 E5 D5 C5 . . D5 F5 A5 F5 . D5 C5 B4 G#4 A4 . .' },
    bosco3: { bpm: 152, style: 'waltz', prog: ['C', 'G7', 'G7', 'C', 'C', 'F', 'G7', 'C'], mel: 'E5 . G5 . C6 . B5 . . . G5 . F5 . A5 . D6 . C6 . . . E5 . D5 . F5 . B5 . A5 . G5 . F5 . E5 . G5 . . . . .' },
    factory: { bpm: 120, style: 'industrial', prog: ['Em', 'Em', 'C', 'B7', 'Em', 'G', 'F#7', 'B7'], mel: 'E4 . . . G4 . . . F#4 . . . B3 . . . E4 . . . A4 . G4 . F#4 . . . . . . . E5 . . . D5 . . . C5 . . . B4 . . . A4 . . . F#4 . G4 . B4 . . . . . . .' },
    mobchase: { bpm: 172, style: 'surf', prog: ['Gm', 'Gm', 'Eb', 'D7', 'Gm', 'Cm', 'D7', 'D7'], mel: 'G4 G4 Bb4 G4 D5 . Bb4 G4 G4 G4 Bb4 G4 Eb5 . D5 C5 Bb4 Bb4 D5 Bb4 G5 . F#5 D5 A4 . C5 . D5 . F#5 . G4 G4 Bb4 D5 G5 . F5 Eb5 D5 C5 Bb4 A4 G4 . . . D5 . . . F#4 . . .' },
    credits3: { bpm: 118, style: 'swing', prog: ['Gm7', 'C7', 'Fmaj7', 'Bbmaj7', 'Em7', 'A7', 'Dm7', 'D7'], mel: 'D5 . F5 . A5 . G5 . . . E5 . C5 . . . F5 . A5 . C6 . Bb5 . A5 . F5 . D5 . . . E5 . G5 . Bb5 . A5 . G5 . E5 . C#5 . E5 . D5 . . . . . . .' },
    title4: { bpm: 120, style: 'march', prog: ['C', 'C', 'F', 'G7', 'C', 'Am', 'Dm7', 'G7'], mel: 'G4 . C5 . E5 . G5 . E5 . C5 . G4 . . . A4 . C5 . F5 . A5 . G5 . . . D5 . . . C5 . E5 . G5 . C6 . A5 . . . E5 . . . F5 . A5 . G5 . F5 . E5 . D5 . C5 . . .' },
    lawn: { bpm: 132, style: 'march', prog: ['C', 'G7', 'C', 'G7', 'F', 'C', 'F', 'G7'], mel: 'C5 C5 D5 E5 C5 E5 D5 G4 C5 C5 D5 E5 C5 . B4 . C5 C5 D5 E5 F5 E5 D5 C5 B4 G4 A4 B4 C5 . C5 . A4 . B4 A4 G4 A4 B4 C5 G4 . A4 G4 F4 . E4 G4 A4 . B4 A4 G4 A4 B4 C5 A4 G4 C5 B4 D5 . C5 .' },
    oval: { bpm: 92, style: 'fanfare', prog: ['F', 'Bb', 'F', 'C7', 'Dm', 'Bb', 'C7', 'F'], mel: 'C5 . . F5 . . A5 . Bb5 . A5 . F5 . . . A5 . . F5 . . C5 . E5 . . . G5 . . . F5 . . A5 . . D6 . Bb5 . . . F5 . D5 . E5 . G5 . Bb5 . G5 . F5 . . . . . . .' },
    campaign: { bpm: 104, style: 'march', prog: ['G', 'C', 'G', 'D7', 'G', 'C', 'D7', 'G'], mel: 'D5 . . D5 G5 . . F#5 E5 . . . C5 . . . D5 . . B4 D5 . . G5 F#5 . . . D5 . . . G5 . . G5 B5 . . A5 G5 . E5 . C5 . . . D5 . F#5 . A5 . F#5 . G5 . . . . . . .' },
    bosco4: { bpm: 144, style: 'march', prog: ['E7', 'Am', 'E7', 'Am', 'Dm', 'C', 'E7', 'Am'], mel: 'E5 . B4 C5 D5 . C5 B4 A4 . A4 C5 E5 . D5 C5 B4 . . C5 D5 . E5 . C5 . A4 . A4 . . . . D5 . F5 A5 . G5 F5 E5 . . C5 E5 . D5 C5 B4 . B4 C5 D5 . E5 . C5 . A4 . A4 . . .' },
    warroom: { bpm: 96, style: 'industrial', prog: ['Dm', 'Dm', 'Bb', 'A7', 'Dm', 'Gm', 'A7', 'A7'], mel: 'D4 . . . F4 . . . E4 . . . A3 . . . D4 . . . G4 . F4 . E4 . . . . . . . D5 . . . C5 . . . Bb4 . . . A4 . . . G4 . . . E4 . F4 . A4 . . . . . . .' },
    warsong: { bpm: 120, style: 'song', song: WAR_SONG },
    abechase: { bpm: 168, style: 'surf', prog: ['Am', 'Am', 'F', 'E7', 'Am', 'Dm', 'E7', 'E7'], mel: 'A4 A4 C5 E5 A5 . G5 E5 A4 A4 C5 E5 G5 . E5 C5 F4 F4 A4 C5 F5 . E5 C5 B4 . D5 . E5 . G#5 . A4 A4 C5 E5 A5 . B5 C6 D5 D5 F5 A5 D6 . C6 A5 G#5 . B5 . E5 . G#5 . E5 . . . E4 . . .' },
    credits4: { bpm: 124, style: 'swing', prog: ['Bb6', 'G7', 'Cm7', 'F7', 'Bb6', 'Bb7', 'Eb6', 'F7'], mel: 'Bb4 . D5 F5 . G5 . F5 D5 . B4 . G4 . . . C5 . Eb5 G5 . Bb5 . A5 F5 . . . . . C5 . Bb4 . D5 F5 . Bb5 . D6 C6 . Ab5 . F5 . D5 . Eb5 . G5 . Bb5 . G5 Eb5 D5 . C5 . Bb4 . . .' }
  };

  function songSeq(str, fn) {
    let pos = 0;
    for (const tok of str.split(/[\s|]+/)) {
      if (!tok) continue;
      const k = tok.indexOf(':');
      const len = k < 0 ? 1 : parseInt(tok.slice(k + 1), 10);
      const v = k < 0 ? tok : tok.slice(0, k);
      if (v !== 'r') fn(pos, len, v);
      pos += len;
    }
    return pos;
  }

  function songOf(th) {
    if (th.flat) return th.flat;
    const fl = { lead: [], horn: [], bass: [], chord: [], chordLen: [], part: [], first: [], total: 0 };
    for (const p of th.song) {
      const base = fl.total;
      for (const v of ['lead', 'horn', 'bass']) if (p[v]) songSeq(p[v], (at, len, tok) => { fl[v][base + at] = { m: noteMidi(tok), len }; });
      songSeq(p.chords, (at, len, tok) => { fl.chordLen[base + at] = len; for (let i = 0; i < len; i++) fl.chord[base + at + i] = tok; });
      for (let i = 0; i < p.bars * 16; i++) fl.part[base + i] = p;
      fl.first[base] = true;
      fl.total += p.bars * 16;
    }
    th.flat = fl;
    return fl;
  }

  for (const th of Object.values(THEMES)) {
    if (!th.song) continue;
    const fl = songOf(th);
    th.prog = [];
    for (let s = 0; s < fl.total; s += 16) th.prog.push(fl.chord[s]);
  }

  class Audio {
    constructor() {
      this.ctx = null;
      this.musicVol = 0.5; this.sfxVol = 0.7;
      this.theme = null; this.want = null;
      this.step = 0; this.nextT = 0; this.t0 = 0;
      this.noise = null;
      this.enabled = true;
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.85; this.master.connect(c.destination);
      this.comp = c.createDynamicsCompressor(); this.comp.connect(this.master);
      this.mbus = c.createGain(); this.mbus.gain.value = this.musicVol * 0.55; this.mbus.connect(this.comp);
      this.sbus = c.createGain(); this.sbus.gain.value = this.sfxVol; this.sbus.connect(this.comp);
      this.mfade = c.createGain(); this.mfade.gain.value = 1; this.mfade.connect(this.mbus);
      const len = c.sampleRate;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }

    resume() { if (this.init() && this.ctx.state === 'suspended') this.ctx.resume(); }
    close() { if (this.ctx) { try { this.ctx.close(); } catch (e) { this.ctx = null; } this.ctx = null; } }
    setVolumes(music, sfx) {
      this.musicVol = music; this.sfxVol = sfx;
      if (this.ctx) { this.mbus.gain.value = music * 0.55; this.sbus.gain.value = sfx; }
    }

    osc(type, f, t, dur, peak, dest, o) {
      const c = this.ctx;
      o = o || {};
      const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t);
      if (o.to) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.toT || dur));
      if (o.det) os.detune.value = o.det;
      const gn = c.createGain();
      const a = o.a || 0.005;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(peak, t + a);
      if (o.hold) gn.gain.setValueAtTime(peak, t + a + o.hold);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + a + (o.hold || 0) + dur);
      let node = os;
      if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); os.connect(fl); node = fl; }
      if (o.vib) {
        const lfo = c.createOscillator(); lfo.frequency.value = o.vib; const lg = c.createGain(); lg.gain.value = o.vibD || 6;
        lfo.connect(lg); lg.connect(os.detune); lfo.start(t); lfo.stop(t + a + (o.hold || 0) + dur + 0.05);
      }
      node.connect(gn); gn.connect(dest || this.sbus);
      os.start(t); os.stop(t + a + (o.hold || 0) + dur + 0.05);
    }

    nz(t, dur, peak, type, freq, dest, o) {
      const c = this.ctx;
      o = o || {};
      const s = c.createBufferSource(); s.buffer = this.noise;
      s.playbackRate.value = o.rate || 1;
      const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(freq || 1000, t);
      if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      if (o.q) fl.Q.value = o.q;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(peak, t + (o.a || 0.003));
      if (o.hold) gn.gain.setValueAtTime(peak, t + (o.a || 0.003) + o.hold);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + (o.a || 0.003) + (o.hold || 0) + dur);
      s.connect(fl); fl.connect(gn); gn.connect(dest || this.sbus);
      s.start(t, Math.random() * 0.5); s.stop(t + (o.a || 0.003) + (o.hold || 0) + dur + 0.05);
    }

    sfx(id) {
      if (!this.enabled || !this.init()) return;
      const t = this.ctx.currentTime + 0.01;
      const o = this.osc.bind(this), n = this.nz.bind(this);
      if (SFX[id]) { SFX[id](o, n, t, this); return; }
      switch (id) {
        case 'ring': for (let i = 0; i < 12; i++) { o('sine', i % 2 ? 1250 : 1050, t + i * 0.055, 0.05, 0.12); o('square', i % 2 ? 2500 : 2100, t + i * 0.055, 0.04, 0.02); } break;
        case 'hangup': n(t, 0.05, 0.3, 'bandpass', 1800); o('square', 420, t + 0.06, 0.08, 0.06); break;
        case 'squeak': o('sine', 2100, t, 0.07, 0.12, null, { to: 2900 }); o('sine', 2300, t + 0.1, 0.06, 0.1, null, { to: 3100 }); break;
        case 'drop': o('sine', 150, t, 0.18, 0.4, null, { to: 55 }); n(t, 0.08, 0.2, 'lowpass', 900); break;
        case 'pickup': o('square', 660, t, 0.05, 0.08); o('square', 990, t + 0.06, 0.08, 0.08); break;
        case 'gun': n(t, 0.25, 0.9, 'lowpass', 3000, null, { to: 300 }); o('sine', 140, t, 0.2, 0.7, null, { to: 40 }); n(t + 0.02, 0.4, 0.2, 'bandpass', 800, null, { to: 200 }); break;
        case 'door': o('sawtooth', 180, t, 0.35, 0.05, null, { to: 320, lp: 900 }); o('sine', 90, t + 0.35, 0.15, 0.35, null, { to: 50 }); break;
        case 'click': n(t, 0.02, 0.3, 'highpass', 3000); break;
        case 'vcr': n(t, 0.08, 0.3, 'lowpass', 600); o('square', 80, t + 0.1, 0.4, 0.05, null, { lp: 400 }); n(t + 0.1, 0.5, 0.05, 'bandpass', 1500); break;
        case 'tvon': n(t, 0.5, 0.2, 'highpass', 2500); o('sine', 15600, t, 0.6, 0.02); break;
        case 'pop': o('sine', 900, t, 0.06, 0.3, null, { to: 300 }); n(t, 0.03, 0.2, 'highpass', 2000); break;
        case 'wind': n(t, 1.2, 0.12, 'bandpass', 400, null, { to: 1200, q: 3, a: 0.3 }); break;
        case 'whoosh': n(t, 0.5, 0.25, 'bandpass', 300, null, { to: 2500, q: 2, a: 0.08 }); break;
        case 'bonk': o('triangle', 420, t, 0.25, 0.5, null, { to: 160 }); n(t, 0.05, 0.4, 'lowpass', 2000); o('sine', 70, t, 0.3, 0.5, null, { to: 35 }); break;
        case 'boing': o('sine', 180, t, 0.7, 0.4, null, { to: 700, toT: 0.2, vib: 18, vibD: 300 }); o('triangle', 90, t, 0.4, 0.2, null, { to: 350 }); n(t, 0.05, 0.3, 'lowpass', 1200); break;
        case 'punch': n(t, 0.12, 0.8, 'lowpass', 1400); o('sine', 110, t, 0.15, 0.6, null, { to: 40 }); break;
        case 'spray': n(t, 0.9, 0.2, 'highpass', 4000, null, { a: 0.04 }); break;
        case 'teargas': o('sine', 300, t, 0.08, 0.5, null, { to: 80 }); n(t, 0.05, 0.6, 'lowpass', 2500); n(t + 0.12, 1.4, 0.18, 'highpass', 2500, null, { a: 0.1 }); break;
        case 'flush': n(t, 1.6, 0.25, 'lowpass', 2500, null, { to: 300, a: 0.2 }); o('sine', 200, t + 0.4, 0.9, 0.05, null, { to: 90 }); break;
        case 'cash': o('sine', 2200, t, 0.5, 0.2); o('sine', 3300, t, 0.3, 0.08); n(t + 0.05, 0.2, 0.2, 'bandpass', 3000); break;
        case 'buzzer': o('square', 110, t, 0.6, 0.12, null, { lp: 900, hold: 0.3 }); o('square', 116, t, 0.6, 0.1, null, { lp: 900, hold: 0.3 }); break;
        case 'ding': o('sine', 1320, t, 0.8, 0.25); o('sine', 1980, t, 0.4, 0.08); break;
        case 'gate': o('sawtooth', 120, t, 1.2, 0.05, null, { to: 190, lp: 700, a: 0.1 }); o('sawtooth', 240, t + 0.2, 1.0, 0.03, null, { to: 150, lp: 800 }); break;
        case 'pump': n(t, 0.18, 0.3, 'bandpass', 600, null, { to: 1800, q: 2 }); break;
        case 'flip': o('sine', 200, t, 1.1, 0.25, null, { to: 800, vib: 7, vibD: 400 }); break;
        case 'zap': for (let i = 0; i < 6; i++) o('sawtooth', 200 + Math.random() * 1400, t + i * 0.05, 0.06, 0.12, null, { lp: 3000 }); break;
        case 'crash': n(t, 1.2, 0.8, 'lowpass', 2500, null, { to: 200 }); o('sine', 60, t, 0.6, 0.6, null, { to: 30 }); for (let i = 0; i < 5; i++) o('triangle', 800 + Math.random() * 2000, t + Math.random() * 0.3, 0.2, 0.08); break;
        case 'horn': o('square', 330, t, 0.4, 0.08, null, { lp: 1600, hold: 0.25 }); o('square', 415, t, 0.4, 0.07, null, { lp: 1600, hold: 0.25 }); break;
        case 'siren': o('square', 700, t, 0.9, 0.06, null, { to: 1100, toT: 0.45, lp: 2500 }); break;
        case 'tire': n(t, 0.1, 0.7, 'lowpass', 2500); n(t + 0.1, 0.8, 0.2, 'highpass', 1500); break;
        case 'megaphone': o('square', 900, t, 0.12, 0.05, null, { lp: 2000 }); n(t, 0.2, 0.08, 'bandpass', 2500, null, { q: 5 }); break;
        case 'cymbal': n(t, 1.0, 0.35, 'highpass', 5000); break;
        case 'hypno': o('sine', 300, t, 1.8, 0.12, null, { vib: 5, vibD: 700, a: 0.3 }); o('sine', 453, t, 1.8, 0.08, null, { vib: 3, vibD: 500, a: 0.3 }); break;
        case 'explosion': n(t, 2.2, 1.0, 'lowpass', 1800, null, { to: 80 }); o('sine', 55, t, 1.5, 0.8, null, { to: 25 }); break;
        case 'type': n(t, 0.02, 0.2, 'bandpass', 2500); break;
        case 'thump': o('sine', 110, t, 0.12, 0.3, null, { to: 60 }); break;
        case 'eat': for (let i = 0; i < 4; i++) n(t + i * 0.09, 0.04, 0.15, 'bandpass', 1200 + i * 200); break;
        case 'swell': o('sawtooth', 110, t, 1.4, 0.06, null, { lp: 400, lpTo: 3000, a: 0.8 }); o('sawtooth', 165, t, 1.4, 0.05, null, { lp: 400, lpTo: 3000, a: 0.8 }); break;
        case 'laugh': for (let i = 0; i < 5; i++) o('square', 330 - i * 20, t + i * 0.12, 0.08, 0.04, null, { lp: 1200 }); break;
        case 'laughtrack': for (let i = 0; i < 26; i++) { const k = t + i * 0.07 + Math.random() * 0.05; n(k, 0.07, 0.05 + Math.random() * 0.05, 'bandpass', 500 + Math.random() * 900, null, { q: 4 }); if (i % 3 === 0) o('sawtooth', 200 + Math.random() * 180, k, 0.08, 0.02, null, { lp: 1200 }); } break;
        case 'applause': for (let i = 0; i < 40; i++) n(t + i * 0.04 + Math.random() * 0.03, 0.03, 0.08 + Math.random() * 0.08, 'highpass', 1500 + Math.random() * 2500); break;
        case 'cheer': n(t, 1.4, 0.3, 'bandpass', 900, null, { to: 1600, q: 1.5, a: 0.3 }); for (let i = 0; i < 20; i++) n(t + 0.2 + i * 0.05, 0.03, 0.08, 'highpass', 2500); break;
        case 'moo': o('sawtooth', 130, t, 1.0, 0.16, null, { to: 95, lp: 600, a: 0.12, vib: 4, vibD: 30 }); o('sawtooth', 131, t, 1.0, 0.1, null, { to: 96, lp: 450, a: 0.12 }); break;
        case 'cluck': for (let i = 0; i < 3; i++) o('square', 900 + i * 120, t + i * 0.11, 0.05, 0.07, null, { to: 500, lp: 2500 }); break;
        case 'helium': o('sine', 500, t, 0.45, 0.2, null, { to: 1900, vib: 9, vibD: 90 }); n(t, 0.4, 0.06, 'highpass', 5000, null, { a: 0.05 }); break;
        case 'banjo': [0, 4, 7, 12, 7, 4].forEach((iv, i) => o('square', 392 * Math.pow(2, iv / 12), t + i * 0.09, 0.14, 0.05, null, { lp: 3000 })); break;
        case 'glass': n(t, 0.5, 0.6, 'highpass', 3500, null, { to: 7000 }); for (let i = 0; i < 9; i++) o('sine', 2500 + Math.random() * 3500, t + 0.05 + Math.random() * 0.5, 0.15, 0.06); break;
        case 'sizzle': n(t, 1.8, 0.3, 'highpass', 3000, null, { a: 0.02 }); for (let i = 0; i < 14; i++) o('sawtooth', 90 + Math.random() * 60, t + i * 0.1, 0.08, 0.15, null, { lp: 2500 }); break;
        case 'splash': n(t, 0.6, 0.5, 'lowpass', 2200, null, { to: 400 }); n(t + 0.05, 0.4, 0.2, 'bandpass', 3000, null, { q: 2 }); break;
        case 'shutter': n(t, 0.03, 0.4, 'highpass', 4000); n(t + 0.08, 0.04, 0.3, 'highpass', 3500); o('sawtooth', 300, t + 0.15, 0.5, 0.03, null, { to: 900, lp: 1800 }); break;
        case 'trapdoor': o('square', 180, t, 0.1, 0.2, null, { lp: 900 }); n(t + 0.1, 0.8, 0.25, 'bandpass', 1200, null, { to: 150, q: 2 }); break;
        case 'clang': o('triangle', 620, t, 0.9, 0.2); o('triangle', 931, t, 0.7, 0.12); n(t, 0.05, 0.4, 'highpass', 2000); break;
        case 'chime': [0, 4, 7, 12].forEach((iv, i) => o('sine', 880 * Math.pow(2, iv / 12), t + i * 0.1, 0.5, 0.12)); break;
        case 'sting': o('sawtooth', 220, t, 1.2, 0.08, null, { to: 110, lp: 1400 }); o('sawtooth', 277, t, 1.2, 0.06, null, { to: 138, lp: 1400 }); break;
        case 'bell': o('sine', 1175, t, 1.2, 0.18); o('sine', 1760, t, 0.8, 0.06); break;
        case 'splat': n(t, 0.2, 0.5, 'lowpass', 900, null, { to: 200 }); o('sine', 120, t, 0.15, 0.3, null, { to: 60 }); break;
        case 'engine': for (let i = 0; i < 6; i++) o('sawtooth', 70 + i * 6, t + i * 0.08, 0.1, 0.12, null, { lp: 700 }); break;
        case 'oven': o('sine', 1568, t, 0.6, 0.2); o('sine', 1568, t + 0.3, 0.6, 0.18); break;
        case 'slap': n(t, 0.07, 0.9, 'highpass', 1800); o('sine', 320, t, 0.09, 0.3, null, { to: 110 }); break;
        case 'cap': n(t, 0.05, 0.7, 'highpass', 2600); o('square', 1300, t, 0.04, 0.1, null, { to: 380 }); n(t + 0.05, 0.3, 0.08, 'bandpass', 1200, null, { q: 2 }); break;
        case 'slot': for (let i = 0; i < 18; i++) n(t + i * 0.06, 0.02, 0.18, 'bandpass', 2400 + (i % 3) * 300, null, { q: 6 }); break;
        case 'jackpot': [0, 4, 7, 12, 16].forEach((iv, i) => o('square', 660 * Math.pow(2, iv / 12), t + i * 0.08, 0.22, 0.06, null, { lp: 3000 })); for (let i = 0; i < 14; i++) o('sine', 2800 + Math.random() * 1600, t + 0.45 + i * 0.05, 0.08, 0.05); break;
        case 'chips': for (let i = 0; i < 6; i++) n(t + i * 0.035, 0.02, 0.2, 'bandpass', 3400, null, { q: 3 }); break;
        case 'deal': n(t, 0.05, 0.16, 'highpass', 3000); n(t + 0.13, 0.05, 0.16, 'highpass', 3000); break;
        case 'vacuum': n(t, 2.6, 0.45, 'bandpass', 380, null, { to: 1900, q: 1.2, a: 0.4 }); o('sawtooth', 60, t, 2.6, 0.08, null, { to: 150, lp: 500, a: 0.4 }); break;
        case 'alarm': for (let i = 0; i < 4; i++) o('square', i % 2 ? 880 : 660, t + i * 0.25, 0.22, 0.07, null, { lp: 2000 }); break;
        case 'servo': o('sawtooth', 220, t, 0.35, 0.05, null, { to: 440, lp: 1200 }); o('sawtooth', 440, t + 0.35, 0.2, 0.04, null, { to: 330, lp: 1200 }); break;
        case 'tommy': for (let i = 0; i < 10; i++) { n(t + i * 0.07, 0.05, 0.45, 'lowpass', 2400); o('sine', 120, t + i * 0.07, 0.05, 0.25, null, { to: 50 }); } break;
        case 'crunch': for (let i = 0; i < 7; i++) n(t + i * 0.08, 0.05, 0.3, 'bandpass', 1500 + Math.random() * 1500, null, { q: 2 }); break;
        case 'slurp': n(t, 0.5, 0.22, 'bandpass', 900, null, { to: 2500, q: 5 }); break;
        case 'buzz': o('sawtooth', 180, t, 0.4, 0.05, null, { vib: 30, vibD: 60, lp: 1500 }); break;
        case 'spring': o('sine', 200, t, 0.5, 0.35, null, { to: 900, toT: 0.15, vib: 20, vibD: 400 }); n(t, 0.04, 0.4, 'lowpass', 1500); break;
        case 'whack': o('square', 300, t, 0.06, 0.12, null, { to: 150, lp: 1500 }); n(t, 0.04, 0.3, 'bandpass', 1800); break;
        case 'ratsing': [0, 4, 7].forEach((iv, i) => o('square', 1200 * Math.pow(2, iv / 12), t + i * 0.07, 0.07, 0.04, null, { lp: 3500 })); break;
        case 'hiss': n(t, 1.2, 0.3, 'highpass', 3500, null, { a: 0.05 }); break;
        case 'thud': o('sine', 90, t, 0.25, 0.5, null, { to: 40 }); n(t, 0.1, 0.3, 'lowpass', 600); break;
        case 'mumble': for (let i = 0; i < 3; i++) o('sawtooth', 150 + i * 20, t + i * 0.16, 0.14, 0.05, null, { lp: 500, vib: 8, vibD: 80 }); break;
        case 'dial': for (let i = 0; i < 7; i++) { o('sine', [697, 770, 852, 941][i % 4], t + i * 0.11, 0.07, 0.07); o('sine', [1209, 1336, 1477][i % 3], t + i * 0.11, 0.07, 0.07); } break;
        case 'busy': for (let i = 0; i < 3; i++) { o('sine', 480, t + i * 0.5, 0.22, 0.1, null, { hold: 0.1 }); o('sine', 620, t + i * 0.5, 0.22, 0.08, null, { hold: 0.1 }); } break;
        case 'beep': o('sine', 1000, t, 0.35, 0.12, null, { hold: 0.2 }); break;
        case 'scan': for (let i = 0; i < 6; i++) o('square', 900 + i * 260, t + i * 0.07, 0.05, 0.05, null, { lp: 4000 }); o('sine', 2600, t + 0.46, 0.25, 0.08); break;
        case 'boo': n(t, 1.3, 0.22, 'bandpass', 320, null, { to: 220, q: 2, a: 0.2 }); for (let i = 0; i < 6; i++) o('sawtooth', 150 + Math.random() * 60, t + i * 0.12, 0.5, 0.03, null, { to: 110, lp: 600, a: 0.1 }); break;
        case 'klaxon': for (let i = 0; i < 4; i++) o('sawtooth', 300, t + i * 0.42, 0.34, 0.09, null, { to: 520, toT: 0.3, lp: 1800 }); break;
        case 'missile': n(t, 3.0, 0.7, 'lowpass', 400, null, { to: 2600, a: 0.5 }); o('sawtooth', 50, t, 3.0, 0.2, null, { to: 190, lp: 500, a: 0.5 }); break;
        case 'stomp': o('sine', 70, t, 0.4, 0.8, null, { to: 28 }); n(t, 0.3, 0.5, 'lowpass', 500); break;
        case 'laser': o('sawtooth', 1800, t, 0.5, 0.09, null, { to: 240, lp: 3000 }); o('square', 900, t, 0.5, 0.04, null, { to: 120, vib: 30, vibD: 200 }); break;
        case 'burp': o('sawtooth', 110, t, 0.45, 0.14, null, { to: 70, lp: 500, vib: 22, vibD: 90 }); break;
        case 'fizz': n(t, 0.06, 0.4, 'highpass', 3000); n(t + 0.05, 0.9, 0.12, 'highpass', 5000, null, { a: 0.05 }); break;
        case 'fanfare': [0, 4, 7, 12].forEach((iv, i) => o('sawtooth', 392 * Math.pow(2, iv / 12), t + i * 0.12, i === 3 ? 0.6 : 0.14, 0.06, null, { lp: 2200 })); break;
        case 'stamp': o('sine', 130, t, 0.1, 0.5, null, { to: 60 }); n(t, 0.03, 0.4, 'highpass', 2500); break;
        case 'rip': n(t, 0.25, 0.35, 'highpass', 2200, null, { to: 5000 }); break;
        default: o('square', 440, t, 0.05, 0.03);
      }
    }

    music(id) {
      this.want = id;
    }

    update() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const c = this.ctx;
      if (this.want !== this.theme) {
        const old = this.theme;
        this.theme = this.want;
        const now = c.currentTime;
        if (old) {
          this.mfade.gain.cancelScheduledValues(now);
          this.mfade.gain.setValueAtTime(this.mfade.gain.value, now);
          this.mfade.gain.linearRampToValueAtTime(0.0001, now + 0.35);
          const nf = c.createGain(); nf.gain.value = 0.0001; nf.connect(this.mbus);
          nf.gain.setValueAtTime(0.0001, now + 0.35);
          nf.gain.linearRampToValueAtTime(1, now + 0.8);
          const oldBus = this.mfade;
          setTimeout(() => { try { oldBus.disconnect(); } catch (e) { return; } }, 1500);
          this.mfade = nf;
          this.nextT = now + 0.4;
        } else this.nextT = now + 0.05;
        this.step = 0;
        this.t0 = this.nextT;
      }
      const th = THEMES[this.theme];
      if (!th) return;
      const spb = 60 / th.bpm;
      const eighth = th.song ? spb / 4 : spb / 2;
      if (this.nextT < c.currentTime - 0.25) {
        const late = 2 * Math.ceil((c.currentTime - this.nextT) / (eighth * 2));
        this.step += late;
        this.nextT += late * eighth;
      }
      const end = th.song ? songOf(th).total : Infinity;
      while (this.nextT < c.currentTime + 0.3 && this.step < end) {
        const step = this.step++, at = this.nextT;
        const swing = (th.style === 'swing' || th.style === 'waltz' || (STYLES[th.style] && STYLES[th.style].swing)) ? (step % 2 === 0 ? 1.18 : 0.82) : 1;
        this.nextT += eighth * swing;
        if (th.song) this.playSong(th, step, at, eighth);
        else this.playStep(th, step, at, eighth);
      }
    }

    position() {
      if (!this.ctx || this.ctx.state !== 'running' || !this.theme || this.theme !== this.want) return null;
      return { id: this.theme, t: this.ctx.currentTime - this.t0 };
    }

    playSong(th, step, t, e) {
      const fl = songOf(th);
      const p = fl.part[step];
      const pos = step % 16;
      const bus = this.mfade;
      const o = (type, m, dur, pk, op) => this.osc(type, midiHz(m), t, dur, pk, bus, op);
      const n = (dur, pk, type, f, op) => this.nz(t, dur, pk, type, f, bus, op);
      const sym = fl.chord[step];
      const ch = sym ? chord(sym) : null;
      const lead = fl.lead[step], horn = fl.horn[step], bass = fl.bass[step];
      const k = p.vol || 1;
      if (lead) {
        const d = lead.len * e * 0.94;
        if (p.voice === 'group') {
          o('square', lead.m, d, 0.075, { lp: 2400, a: 0.015, vib: 5, vibD: 9 });
          o('square', lead.m, d, 0.062, { lp: 2400, a: 0.015, det: 12 });
        } else {
          o('square', lead.m, d, 0.1, { lp: 1900, a: 0.03, vib: 5.5, vibD: 16 });
          o('sawtooth', lead.m + 12, d, 0.035, { lp: 1600, a: 0.04, vib: 5.5, vibD: 16 });
        }
      }
      if (horn) {
        const d = horn.len * e;
        if (p.pad) o('sawtooth', horn.m, d, 0.026 * k, { lp: 1300, a: Math.min(0.3, d * 0.35), vib: 4.5, vibD: 7 });
        else o('sawtooth', horn.m, d * 0.88, 0.04 * k, { lp: 2600, a: 0.012 });
      }
      if (bass) o('triangle', bass.m, bass.len * e * (p.pad ? 1 : 0.8), 0.3 * k, { lp: 900, a: p.pad ? 0.05 : 0.006 });
      if (ch && p.pad && fl.chordLen[step]) for (const iv of ch.iv) o('triangle', 60 + ch.root + iv, fl.chordLen[step] * e, 0.018 * k, { a: 0.25 });
      if (ch && p.comp && p.comp[pos] === 'x') for (const iv of ch.iv) o('sawtooth', 60 + ch.root + iv, e * 1.2, 0.02 * k, { lp: 2000 });
      if (p.crash && fl.first[step]) { n(1.4, 0.13, 'highpass', 5000); o('sine', 50, 0.3, 0.4, { to: 34 }); }
      const dr = p.drum;
      if (!dr) return;
      if (dr.k && dr.k[pos] === 'x') o('sine', 52, 0.16, 0.34 * k, { to: 38 });
      if (dr.s && dr.s[pos] === 'x') { n(0.1, 0.13 * k, 'bandpass', 1900); n(0.04, 0.05 * k, 'highpass', 5000); }
      if (dr.h && dr.h[pos] === 'x') n(e * 0.4, 0.02 * k, 'highpass', 8000);
      if (dr.c && dr.c[pos] === 'x') n(1.1, 0.11 * k, 'highpass', 5200);
      if (dr.r && dr.r[pos] === 'x') { n(0.05, 0.05 * k, 'bandpass', 2200); this.nz(t + e / 2, 0.05, 0.04 * k, 'bandpass', 2200, bus); }
    }

    playStep(th, step, t, e) {
      if (STYLES[th.style]) { STYLES[th.style].play(this, th, step, t, e, this.mfade); return; }
      const per = th.style === 'waltz' || th.style === 'tarantella' ? 6 : 8;
      const bar = Math.floor(step / per) % th.prog.length;
      const pos = step % per;
      const ch = chord(th.prog[bar]);
      const nextCh = chord(th.prog[(bar + 1) % th.prog.length]);
      const root = 36 + ch.root;
      const bus = this.mfade;
      const o = (type, m, dur, pk, op) => this.osc(type, midiHz(m), t, dur, pk, bus, op);
      const n = (dur, pk, type, f, op) => this.nz(t, dur, pk, type, f, bus, op);
      const st = th.style;
      const det = th.dream ? (Math.random() - 0.5) * 30 : 0;
      if (st === 'swing') {
        if (pos % 2 === 0) {
          const beat = pos / 2;
          const walk = [root, root + ch.iv[1] + (beat === 1 ? 0 : 0), root + 7, 36 + nextCh.root + (Math.random() < 0.5 ? -1 : 1)];
          o('triangle', walk[beat], e * 1.7, 0.32, { lp: 900 });
          n(e * 0.9, 0.05, 'highpass', 7000);
          if (beat === 0) o('sine', 48, 0.18, 0.2, { to: 40 });
          if (beat === 1 || beat === 3) n(0.05, 0.06, 'highpass', 9000);
        } else {
          n(e * 0.5, 0.025, 'highpass', 8000);
          if (pos === 3 || pos === 7 && Math.random() < 0.5) for (const iv of ch.iv) o('triangle', 60 + ch.root + iv, e * 1.2, 0.06, { det });
        }
      } else if (st === 'lounge') {
        const pat = [1, 0, 0, 1, 1, 0, 1, 0];
        if (pat[pos]) o('triangle', pos === 3 || pos === 4 ? root + 7 : root, e * 1.5, 0.3, { lp: 800 });
        if (pos === 2 || pos === 5 || pos === 7) for (const iv of ch.iv) o('sine', 60 + ch.root + iv, e * 1.4, 0.05);
        if (pos % 3 === 0) n(0.04, 0.05, 'bandpass', 2200, { q: 4 });
        n(e * 0.4, 0.015, 'highpass', 8000);
      } else if (st === 'waltz') {
        if (pos === 0) o('triangle', root, e * 3, 0.3, { lp: 700, det });
        if (pos === 2 || pos === 4) for (const iv of ch.iv) o('sine', 60 + ch.root + iv, e * 1.6, 0.05, { det });
        if (pos === 0) n(0.2, 0.03, 'highpass', 7000);
      } else if (st === 'surf') {
        o('square', pos % 2 ? root + 12 : root, e * 0.9, 0.12, { lp: 700 });
        if (pos % 4 === 0) o('sine', 50, 0.15, 0.35, { to: 38 });
        if (pos % 4 === 2) n(0.1, 0.14, 'bandpass', 1800);
        n(e * 0.5, 0.03, 'highpass', 8000);
      } else if (st === 'creepy') {
        if (pos === 0) for (const iv of ch.iv) { o('sine', 48 + ch.root + iv, e * 7, 0.05, { a: 0.4 }); o('sine', 60 + ch.root + iv, e * 7, 0.03, { a: 0.4 }); }
        if (pos === 0) o('triangle', root - 12, e * 7, 0.25, { a: 0.2 });
        if (pos % 2 === 1) n(0.02, 0.03, 'highpass', 6000);
      } else if (st === 'fanfare') {
        if (pos % 2 === 0) o('triangle', pos === 0 ? root : root + 7, e * 1.6, 0.3, { lp: 900 });
        if (pos === 0 || pos === 3 || pos === 6) for (const iv of ch.iv) o('sawtooth', 60 + ch.root + iv, e * 0.8, 0.035, { lp: 1800 });
        if (pos % 4 === 0) o('sine', 50, 0.15, 0.3, { to: 38 });
        if (pos % 4 === 2) n(0.1, 0.12, 'bandpass', 1800);
        n(e * 0.4, 0.025, 'highpass', 8000);
      } else if (st === 'hypno') {
        const arp = ch.iv.concat([12]);
        o('sine', 60 + ch.root + arp[pos % arp.length], e * 2, 0.08, { vib: 4, vibD: 40 });
        if (pos === 0) o('sine', root, e * 8, 0.2, { a: 0.3 });
      } else if (st === 'country') {
        if (pos % 4 === 0) o('triangle', pos === 0 ? root : root + 7, e * 1.6, 0.32, { lp: 800 });
        if (pos % 4 === 2) { for (const iv of ch.iv) o('square', 60 + ch.root + iv, e * 0.5, 0.022, { lp: 2400 }); n(0.06, 0.1, 'bandpass', 1400); }
        o('square', 72 + ch.root + ch.iv[[0, 1, 2, 1][pos % 4]], e * 0.4, 0.028, { lp: 3400 });
        n(e * 0.3, 0.018, 'highpass', 8000);
      } else if (st === 'quiz') {
        if (pos === 0 || pos === 1) o('sine', 40, 0.22, 0.34, { to: 34 });
        if (pos === 0) for (const iv of ch.iv) o('sawtooth', 60 + ch.root + iv, e * 7, 0.022, { lp: 900, a: 0.3 });
        if (pos % 2 === 1) n(0.02, 0.05, 'highpass', 6500);
        if (pos === 4) o('triangle', root + 12, e * 3, 0.14, { lp: 700 });
      } else if (st === 'tango') {
        const pat = [1, 0, 0, 1, 1, 0, 1, 0];
        if (pat[pos]) o('triangle', pos === 4 || pos === 6 ? root + 7 : root, e * (pos === 0 ? 2.4 : 1.2), 0.32, { lp: 800 });
        if (pos === 0 || pos === 4) for (const iv of ch.iv) o('sawtooth', 60 + ch.root + iv, e * 0.5, 0.03, { lp: 1600 });
        if (pos === 2 || pos === 6) n(0.03, 0.08, 'bandpass', 3200, { q: 6 });
        if (pos === 7) n(0.02, 0.05, 'bandpass', 3600, { q: 6 });
      } else if (st === 'tarantella') {
        if (pos === 0 || pos === 3) o('triangle', pos === 0 ? root : root + 7, e * 1.4, 0.3, { lp: 800 });
        if (pos === 1 || pos === 2 || pos === 4 || pos === 5) for (const iv of ch.iv) o('square', 72 + ch.root + iv, e * 0.3, 0.012, { lp: 3000 });
        if (pos === 0) n(0.06, 0.1, 'bandpass', 1800);
        if (pos === 3) n(0.04, 0.06, 'highpass', 6000);
      } else if (st === 'industrial') {
        if (pos === 0 || pos === 4) o('sine', 55, 0.2, 0.4, { to: 36 });
        if (pos === 2 || pos === 6) { n(0.08, 0.14, 'bandpass', 2600, { q: 9 }); o('triangle', pos === 6 ? 94 : 93, 0.08, 0.03); }
        if (pos === 0 || pos === 3 || pos === 6) o('square', root, e * 1.2, 0.08, { lp: 500 });
        if (pos % 2 === 1) n(0.03, 0.03, 'highpass', 7000);
      } else if (st === 'march') {
        if (pos % 2 === 0) o('triangle', pos % 4 === 0 ? root : root + 7, e * 1.5, 0.32, { lp: 700 });
        else for (const iv of ch.iv) o('square', 60 + ch.root + iv, e * 0.45, 0.02, { lp: 2200 });
        if (pos % 4 === 0) o('sine', 52, 0.14, 0.3, { to: 40 });
        if (pos % 4 === 2) n(0.08, 0.12, 'bandpass', 1900);
        if (pos === 6 || pos === 7) n(0.03, 0.06, 'bandpass', 2400, { q: 3 });
        n(e * 0.3, 0.015, 'highpass', 8000);
      }
      if (th.mel) {
        if (!th.notes) th.notes = th.mel.split(/\s+/).filter(Boolean);
        const idx = step % th.notes.length;
        const tok = th.notes[idx];
        if (tok !== '.') {
          const m = noteMidi(tok);
          if (m) {
            let len = 1;
            while (len < 6 && th.notes[(idx + len) % th.notes.length] === '.') len++;
            const soft = st === 'waltz' || st === 'creepy' || st === 'quiz';
            const lead = st === 'surf' || st === 'country' || st === 'march' ? 'square' : soft ? 'sine' : 'sawtooth';
            o(lead, m, e * len * 0.95, soft ? 0.1 : 0.06, { lp: lead === 'sawtooth' ? 1600 : undefined, a: 0.02, vib: st === 'surf' ? 6 : 5, vibD: st === 'surf' ? 18 : 10, det });
          }
        }
      }
    }
  }

  S.Audio = Audio;
  S.THEMES = THEMES;
  S.SFX = SFX;
  S.STYLES = STYLES;
  S.chord = chord;
  S.midiHz = midiHz;
  S.songOf = songOf;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
