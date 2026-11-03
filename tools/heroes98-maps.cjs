const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULES = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-contracts', 'he-adventure', 'he-ai', 'he-script', 'he-save', 'he-mapfile', 'he-maps', 'he-rmg', 'he-campaign', 'he-camp1', 'he-camp2', 'he-camp3', 'he-camp4', 'he-camp5', 'he-camp6', 'he-modes'];
for (const m of MODULES) require(path.join(ROOT, 'js/apps/heroes98', m + '.js'));
const H = globalThis.Heroes98;
const OUT = path.join(ROOT, 'content/heroes98/maps');

const missionDoc = (makers, m) => Object.assign(makers[m.id](), { scenes: m.scenes });
const exportMaps = () => {
  fs.mkdirSync(OUT, { recursive: true });
  const makers = Object.assign({}, require('./heroes98-camp1-maps.cjs')(H), require('./heroes98-camp2-maps.cjs')(H), require('./heroes98-camp3-maps.cjs')(H), require('./heroes98-camp4-maps.cjs')(H), require('./heroes98-camp5-maps.cjs')(H), require('./heroes98-camp6-maps.cjs')(H));
  for (const m of ['nabat', 'sol', 'zapoved', 'chasha', 'zhar', 'tysyacha'].flatMap(id => H.Campaign.get(id).missions)) {
    const text = H.MapFile.write(missionDoc(makers, m)), file = path.join(OUT, m.id + '.h98m');
    fs.writeFileSync(file, text);
    console.log(m.id + '.h98m: ' + Math.round(text.length / 1024) + ' KB');
  }
  const scenarios = require('./heroes98-scen-maps.cjs')(H);
  for (const [id, make] of Object.entries(scenarios)) {
    const text = H.MapFile.write(make()), file = path.join(OUT, id + '.h98m');
    fs.writeFileSync(file, text);
    console.log(id + '.h98m: ' + Math.round(text.length / 1024) + ' KB');
  }
  for (const rec of H.Maps.LIST.filter(r => r.make)) {
    const text = H.MapFile.write(H.MapFile.fromMade(rec, rec.make())), file = path.join(OUT, rec.id + '.h98m');
    fs.writeFileSync(file, text);
    console.log(rec.id + '.h98m: ' + Math.round(text.length / 1024) + ' KB');
  }
};

const checkAll = dir => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.h98m')).sort();
  let bad = 0;
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    let doc;
    try {
      doc = H.MapFile.read(text);
    } catch (e) {
      console.log(f + ': does not open: ' + e.message);
      bad++;
      continue;
    }
    const list = H.MapFile.check(doc), errors = H.MapFile.blocking(list), notes = list.length - errors.length, same = H.MapFile.write(doc) === text;
    console.log(f + ': ' + doc.map.w + 'x' + doc.map.h + ', levels ' + doc.map.levels + ', players ' + doc.players.length + ', objects ' + doc.map.objs.length + ', ' + Math.round(text.length / 1024) + ' KB, errors ' + errors.length + ', notes ' + notes + (same ? '' : ', write differs from the file'));
    if (process.argv.includes('--all')) for (const it of list) console.log('  ' + it.level + ': ' + it.text + (it.c != null ? ' (' + it.c + ',' + it.r + ',' + it.l + ')' : ''));
    else for (const it of errors) console.log('  error: ' + it.text + (it.c != null ? ' (' + it.c + ',' + it.r + ',' + it.l + ')' : ''));
    if (errors.length || !same) bad++;
  }
  console.log(files.length + ' maps, ' + bad + ' with problems');
  return bad;
};

if (process.argv[2] === 'export') exportMaps();
else process.exitCode = checkAll(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : OUT) ? 1 : 0;
