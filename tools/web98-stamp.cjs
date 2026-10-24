'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = path.resolve(__dirname, '..', 'web98-site');
const REF = /(\s(?:src|href)=")((?!https?:|\/\/|data:|#)[^"?#]+\.(?:js|css))(?:\?v=[0-9a-f]*)?(")/g;

const hashes = new Map();
function hashOf(file) {
  if (!hashes.has(file)) hashes.set(file, crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 10));
  return hashes.get(file);
}

function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function stamp(root = SITE) {
  let refs = 0, files = 0;
  for (const page of pages(root)) {
    const html = fs.readFileSync(page, 'utf8');
    const next = html.replace(REF, (all, open, rel, close) => {
      const target = path.resolve(path.dirname(page), rel);
      if (!fs.existsSync(target)) return all;
      refs++;
      return `${open}${rel}?v=${hashOf(target)}${close}`;
    });
    if (next !== html) { fs.writeFileSync(page, next); files++; }
  }
  return { refs, files };
}

if (require.main === module) {
  const r = stamp(process.argv[2] ? path.resolve(process.argv[2]) : SITE);
  console.log(`web98 stamp: ${r.refs} js/css links, ${r.files} pages changed`);
}

module.exports = { stamp };
