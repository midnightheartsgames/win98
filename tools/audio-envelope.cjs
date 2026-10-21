const { spawnSync } = require('node:child_process');

const file = process.argv[2];
const rate = Number(process.argv[3] || 20);
const sampleRate = 8000;
const step = sampleRate / rate;
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(sampleRate), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const pcm = decoded.stdout;
const levels = [];
for (let i = 0; i + step <= pcm.length / 2; i += step) {
  let sum = 0;
  for (let j = 0; j < step; j++) {
    const v = pcm.readInt16LE((i + j) * 2) / 32768;
    sum += v * v;
  }
  levels.push(Math.sqrt(sum / step));
}
const peak = Math.max(...levels);
console.log(levels.length / rate);
console.log(levels.map(v => alphabet[Math.min(61, Math.round(Math.pow(v / peak, 0.7) * 61))]).join(''));
