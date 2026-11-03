const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
const page = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
for (const m of page.slice(0, page.indexOf('hsr-gfx.js')).matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)) require(path.join(DIR, m[1] + '.js'));

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; }));
const foes = String(args.foe || 'reaver:10').split(';').map(w => w.split(',').map(s => { const [id, lvl] = s.split(':'); return { id, lvl: +lvl || 10 }; }));
const team = String(args.team || 'trail').split(',');
const lvl = +args.lvl || 70, runs = +args.runs || 100, seed = +args.seed || 1;
for (const w of foes) for (const o of w) if (!H.ENEMIES[o.id]) { console.error('unknown enemy ' + o.id); process.exit(1); }

const g = new H.Game({ seed: 11 });
g.script = null; g.pending = null; g.cg = null; g.events.length = 0;
for (const k of team) if (k !== 'trail' && !g.state.roster[k]) g.debugChar(k, lvl, 0, 0);
g.state.range = { team: { own: true }, own: team, waves: foes, cond: { energy: args.energy === undefined ? 0.5 : +args.energy, cycles: +args.cycles || 0 } };
g.range();
const job = g.rangeBatchStart(runs, seed);
g.rangeBatchStep(job);
const r = g.rangeBatchResult(job);
if (args.json) { console.log(JSON.stringify(r)); process.exit(0); }
console.log('runs ' + r.n + ', seeds ' + r.seed0 + '-' + (r.seed0 + r.n - 1) + ', ' + r.ms + ' ms');
console.log('win ' + r.kinds.win + ', left ' + r.kinds.left + ', lose ' + r.kinds.lose + ', limit ' + r.kinds.limit + ' (' + r.winPct + '%)');
console.log('cycles min ' + r.cycles.min + ', avg ' + r.cycles.avg + ', max ' + r.cycles.max + ', damage per cycle ' + r.perCycle);
for (const o of r.heroes) console.log(o.id.padEnd(12) + ' dmg ' + String(o.dmg).padStart(8) + '  share ' + String(o.share).padStart(3) + '%  down ' + String(o.downPct).padStart(3) + '%');
