const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Backup (MSBACKUP) ---');

const storage = new Map();
const localStorage = {
  get length() { return storage.size; },
  key: i => [...storage.keys()][i] ?? null,
  getItem: k => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: k => storage.delete(k),
  clear: () => storage.clear()
};
const dropped = [];
const indexedDB = {
  databases: async () => [],
  deleteDatabase: name => {
    dropped.push(name);
    const r = {};
    setTimeout(() => r.onsuccess && r.onsuccess(), 0);
    return r;
  }
};
const gameManager = { catalog: { hsr98: { title: 'Honkai: Star Rail 98', icon: 'hsr98' }, fallout: { title: 'Fallout', icon: 'fallout' } } };
const ctx = { console, setTimeout, clearTimeout, btoa, atob, Blob, Uint8Array, Float32Array, DataView, ArrayBuffer, Date, Map, Set, Promise, JSON, Storage: function Storage() {}, localStorage, indexedDB };
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.gameManager = gameManager;
vm.createContext(ctx);
for (const f of ['backup-catalog.js', 'backup-store.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', f), 'utf8'), ctx, { filename: f });

const cat = ctx.BackupCatalog, store = ctx.BackupStore;

const expected = {
  win98_vfs_data: 'files', win98_game_state: 'steam', win98_steam: 'steam', win98_registry_data: 'settings', win98_controls_mmsys: 'settings',
  win98_bounds_app_ie: 'desktop', win98_start_menu: 'desktop', win98_outlook_v2: 'outlook', win98_icq_contacts_v2: 'icq',
  win98_netscape_bookmarks: 'netscape', win98_kovcheg_hits_v1: 'sites', win98_clippy98_guestbook: 'sites', win98_emuland_downloads_v1: 'sites',
  blizzard98_poll_v1: 'sites', youvid98: 'sites', win98_clippy_talk: 'clippy', win98_emuland_states_v1: 'emulator', b204_prefs: 'blender204',
  win98_minesweeper_scores: 'builtin', office_games_scores_tetris: 'office', 'hsr98.save.1': 'game_hsr98', 'hsr98.options': 'game_hsr98',
  'mc98.world.abc': 'game_mc98', 'doom98-save-3': 'game_doom', 'cop98-save-quick': 'game_cop98', stalker_save: 'game_stalker',
  'stalker98-save-auto': 'game_stalker98', falloutzp_save_quick_meta: 'game_falloutzp', sammax101_saves: 'game_sammax',
  sammax202_settings: 'game_sammax202', fallout98_prefs: 'game_fallout', anotherwar_settings: 'game_anotherwar', fo2_quicksave: 'game_fallout2',
  win98_homm1_save_v1: 'game_homm1', 'win98.bugs.sent': 'bugreports', 'tekken3-98-save': 'game_tekken3', 'midnight-stats': 'game_neon-racer', win98_ashroad98_state_v2: 'ashroad'
};
for (const [key, comp] of Object.entries(expected)) assert.equal(cat.componentOfKey(key), comp, key);
assert.equal(cat.componentOfKey('something_unknown'), 'other', 'unknown keys go to Other');
assert.equal(cat.componentOfDb('fallout98'), 'game_fallout');
assert.equal(cat.componentOfDb('anotherwar98'), 'game_anotherwar');
assert.equal(cat.componentOfDb('win98_bugs'), 'bugreports');
assert.ok(cat.components.every(c => cat.groups.some(g => g.id === c.group)), 'every component sits in a group');
assert.equal(new Set(cat.components.map(c => c.id)).size, cat.components.length, 'component ids are unique');
assert.equal(cat.nameOf(cat.byId('game_hsr98'), true), 'Honkai: Star Rail 98 — сохранения', 'game names come from the Steam catalog');
console.log('✓ storage keys map to components');

(async () => {
  const value = { name: 'Vault', bytes: new Uint8Array([1, 2, 250]), floats: new Float32Array([1.5]), at: new Date(5), tags: new Set(['a']), map: new Map([['k', 1]]), blob: new Blob(['hi'], { type: 'text/plain' }) };
  const packed = JSON.parse(JSON.stringify(await store.pack(value)));
  const back = store.unpack(packed);
  assert.deepEqual([...back.bytes], [1, 2, 250]);
  assert.equal(back.floats[0], 1.5);
  assert.equal(back.at.getTime(), 5);
  assert.ok(back.tags.has('a') && back.map.get('k') === 1);
  assert.equal(await back.blob.text(), 'hi');
  assert.equal(back.blob.type, 'text/plain');
  console.log('✓ binary database values survive JSON');

  storage.set('hsr98.save.1', '{"summary":{"lvl":80}}');
  storage.set('doom98-save-0', '{"lvl":"E1M1"}');
  storage.set('win98_vfs_data', '{"root":1}');
  const snap = await store.snapshot(['game_hsr98', 'game_doom'], 'Тест');
  assert.deepEqual(Object.keys(snap.data.ls).sort(), ['doom98-save-0', 'hsr98.save.1']);
  assert.deepEqual([...snap.components].sort(), ['game_doom', 'game_hsr98']);
  const file = store.fromFileText(store.toFileText(snap));
  assert.equal(file.data.ls['hsr98.save.1'], '{"summary":{"lvl":80}}');
  assert.equal(store.fromFileText('not json'), null);
  assert.equal(store.fromFileText('{"format":"Other"}'), null);
  const hsr = store.fromFileText(JSON.stringify({ format: 'StarRail98-saves', version: 1, slots: { 1: { summary: { lvl: 80 }, state: {} } } }));
  assert.deepEqual([...hsr.components], ['game_hsr98'], 'a Star Rail 98 transfer file opens as a backup');
  assert.equal(JSON.parse(hsr.data.ls['hsr98.save.1']).summary.lvl, 80);
  console.log('✓ backup files and Star Rail 98 transfer files open');

  storage.set('hsr98.save.1', '{"broken":1}');
  storage.set('hsr98.save.2', '{"extra":1}');
  const res = await store.restore(snap, ['game_hsr98']);
  assert.ok(res.ok);
  assert.equal(storage.get('hsr98.save.1'), '{"summary":{"lvl":80}}', 'restore writes the archived block');
  assert.ok(!storage.has('hsr98.save.2'), 'restore replaces the whole component');
  assert.equal(storage.get('win98_vfs_data'), '{"root":1}', 'restore leaves other components alone');
  assert.ok(storage.has('win98_backup_pending'));
  const report = await store.applyPending();
  assert.equal(report.kind, 'restore');
  assert.ok(!storage.has('win98_backup_pending'));
  assert.deepEqual([...store.takeReport().components], ['game_hsr98']);
  console.log('✓ restore replaces only the chosen components');

  await store.wipe(['game_doom']);
  assert.ok(!storage.has('doom98-save-0') && storage.has('hsr98.save.1'), 'deleting one program keeps the rest');
  await store.applyPending();
  store.takeReport();
  await store.wipe(null, { dropArchives: false });
  assert.deepEqual([...storage.keys()], ['win98_backup_pending'], 'a full reset clears everything');
  await store.applyPending();
  assert.ok(!dropped.includes(store.ARCHIVE_DB), 'a full reset keeps the backup storage by default');
  await store.wipe(null, { dropArchives: true });
  await store.applyPending();
  assert.ok(dropped.includes(store.ARCHIVE_DB), 'the reset can drop the backup storage too');
  console.log('✓ reset and per-program delete');

  const src = ['index.html', 'js/taskbar.js', 'js/apps/dialogs.js', 'js/apps/explorer.js', 'js/filesystem.js'].map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n');
  assert.ok(/backup-store\.js/.test(src) && /data-action="msbackup"/.test(src) && /'MSBACKUP\.EXE'/.test(src) && /appBackup\.open\('restore'\)/.test(src), 'the program is installed in the shell');
  assert.ok(!/appSysTools\.openBackup/.test(src), 'drive properties open the real backup program');
  for (const f of ['backup.js', 'backup-store.js', 'backup-catalog.js']) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', f), 'utf8');
    assert.ok(!/Microsoft|Windows/.test(code), f + ' uses the project names');
    assert.ok(!/^\s*\/\/|\/\*[\s*]/m.test(code), f + ' has no comments');
  }
  console.log('backup: all checks passed');
})().catch(e => { console.error(e); process.exit(1); });
