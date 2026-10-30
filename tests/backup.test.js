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
  win98_homm1_save_v1: 'game_homm1', kirill98_settings: 'game_kirill98', 'win98.bugs.sent': 'bugreports', 'tekken3-98-save': 'game_tekken3', 'midnight-stats': 'game_neon-racer', win98_ashroad98_state_v2: 'ashroad'
};
for (const [key, comp] of Object.entries(expected)) assert.equal(cat.componentOfKey(key), comp, key);
assert.equal(cat.componentOfKey('something_unknown'), 'other', 'unknown keys go to Other');
assert.equal(cat.componentOfDb('fallout98'), 'game_fallout');
assert.equal(cat.componentOfDb('kirill98'), 'game_kirill98');
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

  const phoneFile = (game, keys) => JSON.stringify({ format: 'Parohod98-saves', v: 1, game, version: '1.2', date: '2026-10-30T10:00:00.000Z', keys });
  storage.set('fh_riga_profile_v1', JSON.stringify({ v: 1, name: 'ПК', settings: { gfx: 'ultra', res: 0, draw: 1300, flora: 2, traffic: 1.5 } }));
  const phoneForza = JSON.stringify({ v: 1, name: 'Телефон', credits: 777, cars: [], settings: { gfx: 'retro', res: 360, draw: 600, flora: 0, traffic: 0.5, fps: 30, tsteer: 'tilt', tpreset: 'weak', tpresetV: 2, vol: 0.3 } });
  const forza = store.fromFileText(phoneFile('forza', { fh_riga_profile_v1: phoneForza, gtann_save_1: 'чужая игра' }));
  assert.deepEqual([...forza.components], ['game_forza'], 'a phone file opens as a backup of its game');
  assert.deepEqual(Object.keys(forza.data.ls), ['fh_riga_profile_v1'], 'only the keys of that game');
  const onPc = JSON.parse(forza.data.ls.fh_riga_profile_v1);
  assert.deepEqual([onPc.name, onPc.credits], ['Телефон', 777], 'progress comes from the phone');
  assert.deepEqual([onPc.settings.gfx, onPc.settings.res, onPc.settings.draw, onPc.settings.flora, onPc.settings.traffic], ['ultra', 0, 1300, 2, 1.5], 'graphics stay as they were on the PC');
  assert.equal(onPc.settings.vol, 0.3, 'other settings come with the save');
  for (const key of ['fps', 'tsteer', 'tpreset', 'tpresetV']) assert.ok(!(key in onPc.settings), key + ' stays on the phone');
  storage.delete('fh_riga_profile_v1');
  const fresh = JSON.parse(store.fromFileText(phoneFile('forza', { fh_riga_profile_v1: phoneForza })).data.ls.fh_riga_profile_v1);
  assert.ok(!('gfx' in fresh.settings), 'without a PC profile the game picks its own graphics');
  storage.set('gtann_settings', '{"scale":1,"gfx":"high"}');
  const save = at => JSON.stringify({ v: 1, savedAt: at });
  const gta = store.fromFileText(phoneFile('gtann', { gtann_settings: '{"scale":0.4,"gfx":"low"}', gtann_save_1: save('2026-10-01'), gtann_save_5: save('2026-10-30') }));
  assert.equal(gta.data.ls.gtann_settings, '{"scale":1,"gfx":"high"}', 'GTA keeps the settings of the PC');
  assert.equal(JSON.parse(gta.data.ls.gtann_save_2).savedAt, '2026-10-30', 'the phone auto save takes a free slot, Win 98 has four');
  assert.ok(!('gtann_save_5' in gta.data.ls));
  const full = store.fromFileText(phoneFile('gtann', { gtann_save_1: save('2026-10-03'), gtann_save_2: save('2026-10-01'), gtann_save_3: save('2026-10-04'), gtann_save_4: save('2026-10-05'), gtann_save_5: save('2026-10-30') }));
  assert.equal(JSON.parse(full.data.ls.gtann_save_2).savedAt, '2026-10-30', 'with all four slots busy it replaces the oldest');
  storage.delete('gtann_settings');
  assert.equal(store.fromFileText(phoneFile('forza', { gtann_save_1: 'x' })), null, 'a phone file without keys of its game is refused');
  console.log('✓ save files from the phone open in Win 98');

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
