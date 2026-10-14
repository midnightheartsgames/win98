const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };

const store = {};
const sandbox = {
  window: {},
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  },
  console
};
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/apps/stalker.js'), 'utf8'), sandbox);
const app = sandbox.window.appStalker;
ok(app && app.nodes, 'app and story nodes exist');

const nodes = app.nodes;
const ids = Object.keys(nodes);
const endingIds = app.endings.map(e => e.id);
ok(endingIds.length === 7, 'seven endings');
ok(nodes.prologue && nodes.prologue.isCheckpoint, 'prologue is the first checkpoint');

for (const id of ids) {
  const n = nodes[id];
  if (n.ending) {
    ok(endingIds.includes(n.ending), `${id}: ending id is listed`);
    ok(!n.choices, `${id}: ending nodes get their menu from the engine`);
    if (n.back) ok(nodes[n.back] && n.backText, `${id}: back target exists`);
    continue;
  }
  ok(Array.isArray(n.choices) && n.choices.length > 0, `${id}: has choices`);
  ok(n.choices.length <= 9, `${id}: fits the 1-9 keys`);
  for (const c of n.choices) ok(nodes[c.next], `${id}: target ${c.next} exists`);
  if (n.art) ok(app.arts[n.art] && app.artTitles[n.art], `${id}: art ${n.art} exists`);
}

const flagKeys = Object.keys(app.freshFlags());
const seen = new Set();
const reachedEndings = new Set();
const reachedNodes = new Set();
const queue = [{ id: 'prologue', s: app.freshFlags() }];
while (queue.length) {
  const { id, s } = queue.shift();
  const key = id + JSON.stringify(flagKeys.map(k => s[k]));
  if (seen.has(key)) continue;
  seen.add(key);
  reachedNodes.add(id);
  const n = nodes[id];
  const text = typeof n.text === 'function' ? n.text(s) : n.text;
  ok(typeof text === 'string' && text.length > 0, `${id}: text renders`);
  if (typeof n.objective === 'function') ok(n.objective(s).length > 0, `${id}: objective renders`);
  if (n.ending) {
    reachedEndings.add(n.ending);
    continue;
  }
  const open = n.choices.filter(c => !c.condition || c.condition(s));
  ok(open.length > 0, `${id}: no dead end for ${JSON.stringify(s)}`);
  for (const c of open) {
    const next = Object.assign({}, s);
    if (c.action) c.action(next, app);
    queue.push({ id: c.next, s: next });
  }
}
for (const e of endingIds) ok(reachedEndings.has(e), `ending ${e} is reachable`);
for (const id of ids) ok(reachedNodes.has(id), `node ${id} is reachable`);

const doctorFirst = (() => {
  let s = app.freshFlags();
  const path1 = ['bar_after_x16', 0, 'guide_at_cordon', 0, 'doctor_agroprom_meeting', 0];
  for (let i = 0; i < path1.length; i += 2) {
    const c = nodes[path1[i]].choices[path1[i + 1]];
    if (c.action) c.action(s, app);
  }
  return s;
})();
ok(doctorFirst.metDoctor && nodes.pripyat_street_fight.choices[0].condition(doctorFirst), 'Doctor path opens the hotel stash');
ok(!nodes.pripyat_street_fight.choices[0].condition(app.freshFlags()), 'hotel stash stays closed without the Doctor');

const allText = [];
const collect = (s) => { if (s) allText.push(String(s).replace(/<[^>]+>/g, '')); };
for (const id of ids) {
  const n = nodes[id];
  for (const flags of [app.freshFlags(), Object.assign(app.freshFlags(), { metDoctor: true, rescuedKruglov: true, hasDecoder: true })]) {
    collect(typeof n.text === 'function' ? n.text(flags) : n.text);
    collect(typeof n.objective === 'function' ? n.objective(flags) : n.objective);
  }
  collect(n.location);
  collect(n.backText);
  (n.choices || []).forEach(c => { collect(c.text); collect(c.tag); });
}
app.endings.forEach(e => { collect(e.title); collect(e.desc); });
const joined = allText.join('\n');
ok(!/[—–]/.test(joined), 'no em or en dashes in game text');
ok(!/Microsoft|Windows/.test(joined), 'Microslop naming rule');
ok(!/[a-zа-яё]{2,}wide|срыр/i.test(joined), 'no corrupted words left');

const src = fs.readFileSync(path.join(ROOT, 'js/apps/stalker.js'), 'utf8');
ok(!/\/\/|\/\*/.test(src.replace(/https?:\/\//g, '').replace(/String\.raw`[\s\S]*?`/g, '')), 'no comments in stalker.js');
ok(!/[—–]/.test(src), 'no dashes in stalker.js at all');

for (const key of Object.keys(app.arts)) {
  const lines = app.art(key).split('\n');
  const w = lines[0].length;
  ok(lines.every(l => l.length === w), `art ${key}: frame is aligned`);
  ok(w <= 64, `art ${key}: ${w} columns fit the screen`);
}

for (const [key, cmd] of Object.entries(app.fkeys)) ok(app.commands[cmd], `${key} maps to command ${cmd}`);

console.log(`stalker-quest: ${checks} checks passed, ${reachedNodes.size} nodes, ${seen.size} states`);
