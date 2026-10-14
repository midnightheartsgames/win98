import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('tools/avatar98-font.txt', 'utf8').replace(/\r/g, '').split('\n');
const glyphs = {};
let cur = null;
for (const line of src) {
  if (line.startsWith('@')) {
    const name = line.slice(1);
    cur = name === 'SPACE' ? ' ' : name;
    if (glyphs[cur]) throw new Error(`duplicate glyph ${cur}`);
    glyphs[cur] = [];
    continue;
  }
  if (!line.trim() || cur === null) continue;
  glyphs[cur].push(line);
}
for (const [k, rows] of Object.entries(glyphs)) {
  if (rows.length < 7 || rows.length > 8) throw new Error(`glyph ${k}: ${rows.length} rows`);
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w)) throw new Error(`glyph ${k}: ragged rows`);
  while (rows.length < 8) rows.push('.'.repeat(w));
}
writeFileSync('content/avatar98/data/font.json', JSON.stringify({ height: 8, base: 7, glyphs }) + '\n');
console.log(`font: ${Object.keys(glyphs).length} glyphs`);
