(function (S, B) {
  'use strict';

  const rep = (tok, n) => (tok + ' ').repeat(n);
  const perBeat = (chords, beats, len) => chords.map(c => rep(c + ':' + (len || 4), beats || 4)).join('| ');
  const whole = (notes, len) => notes.map(n => n + ':' + (len || 16)).join(' | ');
  const pulse = (notes, n, len) => notes.map(x => rep(x + ':' + (len || 2), n || 8)).join('| ');
  const octaves = notes => notes.map(n => { const o = parseInt(n.slice(-1), 10); const hi = n.slice(0, -1) + (o + 1); return rep(n + ':2 ' + hi + ':2', 4); }).join('| ');
  const off = (chords, beats) => chords.map(c => rep('r:2 ' + c + ':2', beats || 4)).join('| ');
  const ost = pairs => pairs.map(([a, b]) => rep(a + ':1 ' + a + ':1 ' + b + ':1 ' + a + ':1', 4)).join('| ');

  const MAIN_THEME = 'A5:4 E5:12 | A5:4 G5:12 | F#5:12 E5:4 | D5:4 E5:12';
  const MAIN = {
    bpm: 141,
    tracks: [
      { patch: 'brass', seq: 'D4:4 A4:6 D5:2 C5:4 | A4:16 | D4:4 A4:6 D5:2 F#5:4 | E5:16 | F4:4 A4:4 C5:4 F5:4 | E5:8 C#5:4 A4:4 | ' + MAIN_THEME +
        ' | C#5:4 E5:4 F#5:4 D5:4 | B4:4 D5:4 G5:4 F#5:4 | E5:4 A5:4 A5:4 C6:4 | C6:4 G5:4 E5:4 C5:4 | E5:4 G5:4 A5:4 C6:4 | Eb6:4 C6:4 A5:4 F#5:4 | E5:4 G#5:4 B5:4 E6:4 | D6:8 B5:4 A4:4 | ' + MAIN_THEME + ' | A5:16', vol: 1.15 },
      { patch: 'strings', seq: 'r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | A4:4 E4:12 | A4:4 G4:12 | F#4:12 E4:4 | D4:4 E4:12 | A4:16', vol: 1.1 },
      { patch: 'horn', seq: 'r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | E4:16 | D4:16 | C#4:16 | B3:16 | A3:8 B3:8 | B3:8 D4:8 | A3:8 A3:8 | C4:16 | C4:8 A3:8 | F#4:16 | E4:16 | D4:8 E4:8 | E4:16 | D4:16 | C#4:16 | B3:16 | C#4:16' },
      { patch: 'pad', seq: 'Dm:16 | Am:16 | D:16 | A:16 | F:16 | A:16 | Esus4:16 | G6:16 | Dmaj7:16 | Esus4:16 | A:8 Bm:8 | G:8 Bm:8 | A:8 D7:8 | C:16 | C:8 F#dim:8 | F#dim:8 Dmaj7:8 | E:16 | E7:16 | Esus4:16 | G6:16 | Dmaj7:16 | Esus4:16 | A:16', vol: 0.9 },
      { patch: 'bass', seq: 'D2:16 | A1:16 | D2:16 | A1:16 | F1:16 | A1:16 | E1:16 | G1:16 | F#1:16 | E1:16 | A1:8 B1:8 | G1:8 B1:8 | A1:8 D2:8 | C2:16 | C2:8 F#1:8 | F#1:8 D2:8 | E1:16 | E1:16 | E1:16 | G1:16 | F#1:16 | E1:16 | A1:16' },
      { patch: 'timp', seq: 'D2:8 A1:8 | A1:16 | D2:8 A1:8 | A1:4 A1:4 A1:4 A1:4 | F2:16 | A1:4 A1:4 A1:2 A1:2 A1:2 A1:2 | A1:16 | r:16 | r:16 | E2:4 E2:4 E2:8 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | E2:16 | E2:4 E2:4 E2:2 E2:2 E2:2 E2:2 | A1:16 | r:16 | r:16 | E2:16 | A1:16', vol: 0.8 }
    ],
    drums: [{ bars: 6 }, { bars: 1, c: 'x...............' }, { bars: 11 }, { bars: 1, c: 'x...............', s: '....x.......x...' }, { bars: 3, s: '....x.......x...' }, { bars: 1, c: 'x...............' }],
    dvol: 0.8
  };
  B.score('bt_title', MAIN);
  B.score('bt_credits', MAIN);

  B.score('bt_jukebox', {
    bpm: 120,
    tracks: [
      { patch: 'vox', seq: 'r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:16 | r:4 F5:1 E5:1 D5:2 E5:1 F5:1 F#5:3 r:3 | r:2 B4:2 D5:1 C5:1 B4:2 E5:1 D5:1 B4:2 D5:3 B4:1 | r:16 | r:16 | E5:1 F5:3 D5:1 r:1 D5:1 E5:2 F#5:1 r:6 | r:6 D5:2 F5:1 B4:2 C5:1 D5:4 | C5:1 A4:1 r:14 | r:16 | A4:1 B4:3 D5:3 E5:2 F5:2 D5:5 | D5:2 r:11 A4:2 r:1 | G4:1 B4:3 D5:1 B4:2 D5:1 E5:4 F5:1 E5:1 D5:2 | D5:1 C5:1 r:1 A4:2 r:9 F#5:1 r:1 | F5:2 r:1 E5:1 D5:2 E5:1 F5:1 E5:1 F5:1 r:6 | r:2 A4:1 B4:2 D5:4 E5:1 F5:2 D5:1 C5:1 B4:2 | C5:2 r:1 D5:4 F5:2 E5:1 D5:1 F5:2 D5:3 | F5:1 r:3 D5:5 C5:1 A4:2 D5:4', vol: 1.1 },
      { patch: 'chords', seq: 'r:2 Dm7:2 r:2 Dm7:2 r:2 D7:2 r:2 D7:2 | r:2 Dmaj7:2 r:2 Dmaj7:2 r:2 Bm7:2 r:2 Bm7:2 | r:2 Cmaj7:2 r:2 Cmaj7:2 r:2 Gmaj7:2 r:2 Gmaj7:2 | r:2 Dmaj7:2 r:2 Dmaj7:2 r:2 D7:2 r:2 D7:2 | r:2 Cmaj7:2 r:2 Cmaj7:2 r:2 Cmaj7:2 r:2 Cmaj7:2 | r:2 D7:2 r:2 D7:2 r:2 Bm7:2 r:2 Bm7:2 | r:2 Cmaj7:2 r:2 Cmaj7:2 r:2 Am7:2 r:2 Am7:2 | r:2 D7:2 r:2 D7:2 r:2 Asus4:2 r:2 Asus4:2 | r:2 Dsus4:2 r:2 Dsus4:2 r:2 C:2 r:2 C:2 | r:2 Asus4:2 r:2 Asus4:2 r:2 D7:2 r:2 D7:2 | r:2 Dsus4:2 r:2 Dsus4:2 r:2 C:2 r:2 C:2 | r:2 Asus4:2 r:2 Asus4:2 r:2 Asus4:2 r:2 Asus4:2 | r:2 Dsus4:2 r:2 Dsus4:2 r:2 Am7:2 r:2 Am7:2 | r:2 Asus4:2 r:2 Asus4:2 r:2 D7:2 r:2 D7:2 | r:2 D7:2 r:2 D7:2 r:2 Dm7:2 r:2 Dm7:2 | r:2 G7:2 r:2 G7:2 r:2 Gsus4:2 r:2 Gsus4:2 | r:2 Csus4:2 r:2 Csus4:2 r:2 Dm7:2 r:2 Dm7:2 | r:2 Dsus4:2 r:2 Dsus4:2 r:2 Gsus4:2 r:2 Gsus4:2 | r:2 Am7:2 r:2 Am7:2 r:2 Dm7:2 r:2 Dm7:2 | r:2 Dmaj7:2 r:2 Dmaj7:2 r:2 Dmaj7:2 r:2 Dmaj7:2 | r:2 C:2 r:2 C:2 r:2 C:2 r:2 C:2 | r:2 G:2 r:2 G:2 r:2 G:2 r:2 G:2 | r:2 Dm7:2 r:2 Dm7:2 r:2 Gmaj7:2 r:2 Gmaj7:2', vol: 0.9 },
      { patch: 'pad', seq: 'Dm7:8 D7:8 | Dmaj7:8 Bm7:8 | Cmaj7:8 Gmaj7:8 | Dmaj7:8 D7:8 | Cmaj7:8 Cmaj7:8 | D7:8 Bm7:8 | Cmaj7:8 Am7:8 | D7:8 Asus4:8 | Dsus4:8 C:8 | Asus4:8 D7:8 | Dsus4:8 C:8 | Asus4:8 Asus4:8 | Dsus4:8 Am7:8 | Asus4:8 D7:8 | D7:8 Dm7:8 | G7:8 Gsus4:8 | Csus4:8 Dm7:8 | Dsus4:8 Gsus4:8 | Am7:8 Dm7:8 | Dmaj7:8 Dmaj7:8 | C:8 C:8 | G:8 G:8 | Dm7:8 Gmaj7:8', vol: 0.5 },
      { patch: 'synbass', seq: 'B1:2 B1:2 B1:2 B1:2  A1:2 A1:2 A1:2 A1:2 | D2:2 D2:2 D2:2 D2:2  F#1:2 F#1:2 F#1:2 F#1:2 | B1:2 B1:2 B1:2 B1:2  A1:2 A1:2 A1:2 A1:2 | D2:2 D2:2 D2:2 D2:2  F#1:2 F#1:2 F#1:2 F#1:2 | B1:2 B1:2 B1:2 B1:2  A1:2 A1:2 A1:2 A1:2 | D2:2 D2:2 D2:2 D2:2  F#1:2 F#1:2 F#1:2 F#1:2 | B1:2 B1:2 B1:2 B1:2  A1:2 A1:2 A1:2 A1:2 | F#1:2 F#1:2 F#1:2 F#1:2  A1:2 A1:2 A1:2 A1:2 | C2:2 C2:2 C2:2 C2:2  A1:2 A1:2 A1:2 A1:2 | F#1:2 F#1:2 F#1:2 F#1:2  A1:2 A1:2 A1:2 A1:2 | C2:2 C2:2 C2:2 C2:2  A1:2 A1:2 A1:2 A1:2 | F#1:2 F#1:2 F#1:2 F#1:2  A1:2 A1:2 A1:2 A1:2 | C2:2 C2:2 C2:2 C2:2  A1:2 A1:2 A1:2 A1:2 | F#1:2 F#1:2 F#1:2 F#1:2  A1:2 A1:2 A1:2 A1:2 | B1:2 B1:2 B1:2 B1:2  A1:2 A1:2 A1:2 A1:2 | B1:2 B1:2 B1:2 B1:2  D2:2 D2:2 D2:2 D2:2 | E1:2 E1:2 E1:2 E1:2  D2:2 D2:2 D2:2 D2:2 | B1:2 B1:2 B1:2 B1:2  D2:2 D2:2 D2:2 D2:2 | F1:2 F1:2 F1:2 F1:2  D2:2 D2:2 D2:2 D2:2 | D2:2 D2:2 D2:2 D2:2  D2:2 D2:2 D2:2 D2:2 | C2:2 C2:2 C2:2 C2:2  C2:2 C2:2 C2:2 C2:2 | G1:2 G1:2 G1:2 G1:2  G1:2 G1:2 G1:2 G1:2 | G1:2 G1:2 G1:2 G1:2  A1:2 A1:2 A1:2 A1:2' }
    ],
    drums: [{ bars: 6, k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, { bars: 1, k: 'x.......x.x.....', s: '....x.......x.xx', h: 'x.x.x.x.x.x.....' }, { bars: 1, k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', c: 'x...............' }, { bars: 11, k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, { bars: 1, k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', c: 'x...............' }, { bars: 3, k: 'x.......x.x.....', s: '....x.......x...', o: 'x.x.x.x.x.x.x.x.' }]
  });

  B.score('bt_dream', {
    bpm: 76,
    tracks: [
      { patch: 'pad', seq: whole(['Am', 'F', 'Dm', 'E', 'Am', 'F', 'Bb', 'E']), vol: 0.9 },
      { patch: 'bell', seq: 'E5:6 A5:2 G5:4 E5:4 | F5:8 C5:8 | D5:6 F5:2 A5:4 G5:4 | G#5:12 r:4 | E5:6 A5:2 B5:4 C6:4 | A5:8 F5:8 | F5:4 D5:4 Bb4:8 | B4:8 G#4:8', vol: 1.1 },
      { patch: 'strings', seq: whole(['A3', 'A3', 'F3', 'G#3', 'A3', 'C4', 'D4', 'B3']), vol: 0.7 },
      { patch: 'bass', seq: whole(['A2', 'F2', 'D2', 'E2', 'A2', 'F2', 'Bb1', 'E2']), vol: 0.8 }
    ],
    drums: [{ bars: 8, b: 'x.......x.......', v: 0.6 }]
  });

  B.score('bt_lab', {
    bpm: 104,
    tracks: [
      { patch: 'clar', seq: 'F#5:4 A5:4 G5:2 F#5:2 E5:4 | D5:6 F#5:2 B4:8 | B4:4 D5:4 G5:4 F#5:2 E5:2 | E5:12 r:4 | F#5:4 A5:4 D6:4 C#6:2 B5:2 | A5:6 F#5:2 C#5:8 | D5:2 E5:2 G5:4 B5:4 A5:2 G5:2 | A5:8 E5:4 C#5:4' },
      { patch: 'chords', seq: off(['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G', 'A7']), vol: 0.9 },
      { patch: 'bass', seq: 'D3:4 A2:4 D3:4 A2:4 | B2:4 F#2:4 B2:4 F#2:4 | G2:4 D3:4 G2:4 D3:4 | A2:4 E3:4 A2:4 C#3:4 | D3:4 A2:4 D3:4 A2:4 | F#2:4 C#3:4 F#2:4 C#3:4 | G2:4 D3:4 G2:4 B2:4 | A2:4 E3:4 A2:4 G2:4', vol: 0.8 }
    ],
    drums: [{ bars: 8, k: 'x.......x.......', b: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', v: 0.6 }]
  });

  B.score('bt_yard', {
    bpm: 84,
    tracks: [
      { patch: 'pad', seq: whole(['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Db', 'G7']), vol: 0.8 },
      { patch: 'horn', seq: 'G4:8 Ab4:4 G4:4 | Eb4:12 r:4 | F4:4 Ab4:4 C5:4 Bb4:4 | B4:16 | G4:8 C5:4 Eb5:4 | D5:8 C5:8 | Db5:6 C5:2 Ab4:8 | G4:16' },
      { patch: 'synbass', seq: pulse(['C2', 'Ab1', 'F1', 'G1', 'C2', 'Ab1', 'Db2', 'G1']), vol: 0.7 }
    ],
    drums: [{ bars: 8, k: 'x.......x.......', h: '..x...x...x...x.', v: 0.5 }]
  });

  B.score('bt_street86', {
    bpm: 112,
    tracks: [
      { patch: 'lead', seq: 'B4:3 E5:3 G5:2 F#5:4 E5:4 | E5:2 D5:2 C5:4 G4:8 | B4:3 D5:3 G5:2 A5:4 B5:4 | A5:8 F#5:8 | B5:3 A5:3 G5:2 F#5:4 E5:4 | G5:4 E5:4 C5:8 | A4:4 C5:4 E5:4 A5:4 | F#5:8 D#5:8' },
      { patch: 'pad', seq: whole(['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B']), vol: 0.6 },
      { patch: 'synbass', seq: octaves(['E2', 'C2', 'G2', 'D2', 'E2', 'C2', 'A1', 'B1']) },
      { patch: 'pluck', seq: ['E4 G4 B4 E5', 'C4 E4 G4 C5', 'G4 B4 D5 G5', 'D4 F#4 A4 D5', 'E4 G4 B4 E5', 'C4 E4 G4 C5', 'A3 C4 E4 A4', 'B3 D#4 F#4 B4'].map(a => rep(a.split(' ').map(n => n + ':1').join(' '), 4)).join('| '), vol: 0.6 }
    ],
    drums: [{ bars: 8, k: 'x.....x.x.......', s: '....x.......x...', p: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }]
  });

  B.score('bt_edna', {
    bpm: 138, bar: 12,
    tracks: [
      { patch: 'clar', seq: 'D5:4 F5:4 Bb5:4 | A5:6 G5:2 D5:4 | Eb5:4 G5:4 C6:4 | Bb5:8 A5:4 | D6:4 Bb5:4 F5:4 | G5:6 F5:2 Eb5:4 | D5:4 F5:4 C5:4 | Bb4:12' },
      { patch: 'tuba', seq: ['Bb1', 'G1', 'C2', 'F1', 'Bb1', 'Eb2', 'F1', 'F1'].map(n => n + ':4 r:8').join(' | ') },
      { patch: 'chords', seq: ['Bb', 'Gm', 'Cm', 'F7', 'Bb', 'Eb', 'Bb', 'F7'].map(c => 'r:4 ' + c + ':4 ' + c + ':4').join(' | '), vol: 0.8 },
      { patch: 'bell', seq: 'r:12 | r:12 | r:12 | r:8 C6:2 A5:2 | r:12 | r:12 | r:12 | r:8 F5:2 A5:2', vol: 0.7 }
    ],
    drums: [{ bars: 8, b: '....x...x...', v: 0.6 }]
  });

  B.score('bt_square', {
    bpm: 126, grid: 8, swing: true, bar: 8,
    tracks: [
      { patch: 'clar', seq: 'A4:1 C5:1 F5:2 E5:1 F5:1 G5:2 | A5:3 F#5:1 A5:4 | G5:1 A5:1 Bb5:2 A5:1 G5:1 F5:2 | E5:6 C5:2 | A4:1 C5:1 F5:2 E5:1 F5:1 A5:2 | C6:3 A5:1 Eb5:4 | D5:2 F5:2 Bb5:2 A5:1 G5:1 | G5:4 E5:2 C5:2' },
      { patch: 'tuba', seq: 'F2:2 r:2 C2:2 r:2 | D2:2 r:2 A1:2 r:2 | G1:2 r:2 D2:2 r:2 | C2:2 r:2 G1:2 r:2 | F2:2 r:2 C2:2 r:2 | F2:2 r:2 Eb2:2 r:2 | Bb1:2 r:2 F2:2 r:2 | C2:2 r:2 G1:2 r:2' },
      { patch: 'chords', seq: off(['F', 'D7', 'G7', 'C7', 'F', 'F7', 'Bb', 'C7'], 2), vol: 0.9 }
    ],
    drums: [{ bars: 8, k: 'x...x...', b: 'x.x.x.x.', r: '..x...x.', v: 0.7 }]
  });

  B.score('bt_kitchen', {
    bpm: 100, grid: 8, swing: true, bar: 8,
    tracks: [
      { patch: 'mute', seq: 'D5:1 F5:1 A5:2 Ab5:1 G5:1 F5:2 | D5:6 r:2 | G5:1 Bb5:1 D6:2 C#6:1 C6:1 Bb5:2 | A5:6 r:2 | D5:1 F5:1 A5:2 C6:2 Bb5:2 | Bb5:1 A5:1 G5:2 F5:4 | E5:2 G#5:2 B5:2 D6:2 | C#6:6 r:2' },
      { patch: 'bass', seq: 'D2:2 F2:2 A2:2 C3:2 | D3:2 A2:2 F2:2 E2:2 | G2:2 Bb2:2 D3:2 F2:2 | A2:2 C#3:2 E3:2 A2:2 | D2:2 F2:2 A2:2 D3:2 | Bb1:2 D2:2 F2:2 A2:2 | E2:2 G#2:2 B2:2 D3:2 | A2:2 C#3:2 E2:2 C#2:2' },
      { patch: 'chords', seq: off(['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'E7', 'A7'], 2), vol: 0.7 }
    ],
    drums: [{ bars: 8, k: 'x.......', b: 'x.x.x.x.', r: '..x...x.', v: 0.7 }]
  });

  B.score('bt_chase', {
    bpm: 176, grid: 8, swing: true, bar: 8,
    tracks: [
      { patch: 'brass', seq: 'G4:1 Bb4:1 D5:1 G5:1 F#5:2 G5:2 | D5:1 Eb5:1 D5:1 C5:1 Bb4:2 G4:2 | C5:1 Eb5:1 G5:1 C6:1 Bb5:2 G5:2 | F#5:2 A5:2 C6:2 D6:2 | G5:1 G5:1 Bb5:2 A5:1 G5:1 F#5:2 | Eb5:1 G5:1 Bb5:2 Ab5:2 G5:2 | F#5:1 G5:1 A5:1 Bb5:1 C6:2 A5:2 | D6:6 r:2' },
      { patch: 'bass', seq: 'G2:2 D2:2 G2:2 D2:2 | G2:2 D2:2 G2:2 Bb1:2 | C2:2 G1:2 C2:2 G1:2 | D2:2 A1:2 D2:2 F#2:2 | G2:2 D2:2 G2:2 D2:2 | Eb2:2 Bb1:2 Eb2:2 Bb1:2 | D2:2 A1:2 D2:2 A1:2 | D2:2 A1:2 F#1:2 A1:2' },
      { patch: 'chords', seq: ['Gm', 'Gm', 'Cm', 'D7', 'Gm', 'Eb', 'D7', 'D7'].map(c => rep('r:1 ' + c + ':1', 4)).join('| '), vol: 0.8 }
    ],
    drums: [{ bars: 8, k: 'x...x...', s: '..x...x.', h: 'xxxxxxxx', v: 0.8 }]
  });

  B.score('bt_lab31', {
    bpm: 120,
    tracks: [
      { patch: 'bell', seq: 'C5:2 E5:2 G5:2 C6:2 B5:2 G5:2 E5:4 | A5:2 C6:2 E6:2 C6:2 A5:4 r:4 | F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4 | G5:2 B5:2 D6:2 G6:2 F6:4 D6:4 | C6:4 G5:4 E5:4 C5:4 | E5:2 G#5:2 B5:2 E6:2 D6:4 B5:4 | A5:2 F5:2 C5:2 F5:2 A5:4 C6:4 | B5:4 G5:4 D5:4 G4:4', vol: 1.6 },
      { patch: 'horn', seq: 'C3:4 G2:4 C3:4 G2:4 | A2:4 E2:4 A2:4 E2:4 | F2:4 C3:4 F2:4 C3:4 | G2:4 D3:4 G2:4 B2:4 | C3:4 G2:4 C3:4 G2:4 | E2:4 B2:4 E2:4 G#2:4 | F2:4 C3:4 F2:4 A2:4 | G2:4 D3:4 G2:4 F2:4', vol: 1.4 },
      { patch: 'chords', seq: off(['C', 'Am', 'F', 'G', 'C', 'E7', 'F', 'G7']), vol: 0.9 }
    ],
    drums: [{ bars: 8, k: 'x.......x.......', r: '....x.......x...', h: '..x...x...x...x.', v: 0.6 }]
  });

  B.score('bt_night', {
    bpm: 88,
    tracks: [
      { patch: 'pad', seq: whole(['Em', 'Em', 'C', 'C', 'Am', 'Am', 'B', 'B']), vol: 0.7 },
      { patch: 'strings', seq: ['E3 G3 B3 G3', 'E3 G3 B3 G3', 'C3 E3 G3 E3', 'C3 E3 G3 E3', 'A2 C3 E3 C3', 'A2 C3 E3 C3', 'B2 D#3 F#3 D#3', 'B2 D#3 F#3 D#3'].map(a => rep(a.split(' ').map(n => n + ':2').join(' '), 2)).join('| '), vol: 0.8 },
      { patch: 'horn', seq: 'B4:8 C5:4 B4:4 | G4:16 | E5:8 D5:4 C5:4 | B4:16 | A4:8 C5:8 | E5:8 D5:4 C5:4 | B4:8 A4:4 G4:4 | F#4:16' },
      { patch: 'bass', seq: whole(['E2', 'E2', 'C2', 'C2', 'A1', 'A1', 'B1', 'B1']), vol: 0.7 }
    ],
    drums: [{ bars: 8, k: 'x...............', h: '..x...x...x...x.', v: 0.5 }]
  });

  B.score('bt_wagon', {
    bpm: 152,
    tracks: [
      { patch: 'brass', seq: 'D5:6 E5:2 F5:4 A5:4 | Bb5:6 A5:2 F5:8 | G5:6 F5:2 E5:4 C5:4 | C#5:4 E5:4 A5:8 | D6:6 C6:2 A5:4 F5:4 | D6:4 Bb5:4 F5:8 | G5:4 Bb5:4 D6:4 C6:2 Bb5:2 | A5:16' },
      { patch: 'strings', seq: ost([['D4', 'A4'], ['D4', 'F4'], ['C4', 'G4'], ['C#4', 'E4'], ['D4', 'A4'], ['D4', 'F4'], ['D4', 'G4'], ['C#4', 'E4']]), vol: 0.7 },
      { patch: 'synbass', seq: pulse(['D2', 'Bb1', 'C2', 'A1', 'D2', 'Bb1', 'G1', 'A1']) },
      { patch: 'timp', seq: 'D2:16 | r:16 | r:16 | A1:4 A1:4 A1:8 | D2:16 | r:16 | r:16 | A1:4 A1:4 A1:8', vol: 0.8 }
    ],
    drums: [{ bars: 1, k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', c: 'x...............' }, { bars: 7, k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }]
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
