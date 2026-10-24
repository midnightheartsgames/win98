const assert = require('assert');
const fs = require('fs');
const path = require('path');

let language = 'en';
global.window = {
  i18n: { getLanguage: () => language },
  vfs: null,
  gameManager: { catalog: { sims3: { id: 'sims3', title: 'The Sims 3', developer: 'Maxis (2000) / Win 98 Edition', targetExe: 'SIMS3.EXE', folder: 'Sims3' } } }
};
global.Icons = {};

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', 'file-properties.js'), 'utf8');
new Function(source)();
const props = window.appFileProperties;

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('PASS: ' + name);
}

check('MS-DOS names follow the 8.3 rules of the reference dialogs', () => {
  assert.strictEqual(props.dosName('Sheep.exe', false), 'SHEEP.EXE');
  assert.strictEqual(props.dosName('Outlook Express.lnk', false), 'OUTLOO~1.LNK');
  assert.strictEqual(props.dosName('AUTOEXEC.BAT', false), 'AUTOEXEC.BAT');
  assert.strictEqual(props.dosName('My Documents', true), 'MYDOCU~1');
});

check('size line shows KB, exact bytes and the 8 KB cluster usage', () => {
  assert.strictEqual(props.sizeLine(317792, props.usedBytes(317792)), '310KB (317,792 bytes), 319,488 bytes used');
  assert.strictEqual(props.sizeLine(538, props.usedBytes(538)), '538 bytes (538 bytes), 8,192 bytes used');
  assert.strictEqual(props.sizeLine(0, props.usedBytes(0)), '0 bytes (0 bytes), 0 bytes used');
});

check('dates are written out in full and the access date has no time', () => {
  const stamp = new Date(2016, 1, 16, 1, 54, 27);
  assert.strictEqual(props.formatDate(stamp, true), 'Tuesday, February 16, 2016 1:54:27 AM');
  assert.strictEqual(props.formatDate(stamp, false), 'Tuesday, February 16, 2016');
});

check('dates are stable for the same file and created never follows modified', () => {
  const a = props.datesFor('NOTES.TXT', null);
  const b = props.datesFor('NOTES.TXT', null);
  assert.strictEqual(a.modified.getTime(), b.modified.getTime());
  assert.ok(a.created.getTime() <= a.modified.getTime());
  assert.strictEqual(props.parseDate('04/12/1998 14:22').getFullYear(), 1998);
  assert.strictEqual(props.parseDate('24.07.98 15:29').getMonth(), 6);
});

check('Russian wording is used when the language is Russian', () => {
  language = 'ru';
  assert.strictEqual(props.titleFor('Блокнот'), 'Свойства: Блокнот');
  assert.strictEqual(props.sizeLine(1024, 8192).replace(/\s/g, ' '), '1 КБ (1 024 байт), занято 8 192 байт');
  language = 'en';
  assert.strictEqual(props.titleFor('Paint'), 'Paint Properties');
});

check('shortcut targets come from the known table, the catalog or a fallback', () => {
  assert.strictEqual(props.targetFor('outlook', 'Outlook Express'), '"C:\\Program Files\\Outlook Express\\MSIMN.EXE"');
  assert.strictEqual(props.targetFor('notepad', 'Notepad'), 'C:\\WINDOWS\\NOTEPAD.EXE');
  assert.strictEqual(props.targetFor('sims3', 'The Sims 3'), 'C:\\Games\\Sims3\\SIMS3.EXE');
  assert.strictEqual(props.targetFor('unknown', 'Some Tool'), '"C:\\Program Files\\Some Tool\\SOMETOOL.EXE"');
});

check('VFS shortcut targets are turned into drive paths', () => {
  assert.strictEqual(props.normalizeTarget('My Computer\\C:\\Games\\Sims3\\SIMS3.EXE'), 'C:\\Games\\Sims3\\SIMS3.EXE');
  assert.strictEqual(props.normalizeTarget('Desktop\\notes.txt'), 'C:\\WINDOWS\\Desktop\\notes.txt');
  assert.strictEqual(props.normalizeTarget('notepad.exe readme.txt'), 'notepad.exe readme.txt');
  assert.strictEqual(props.locationFor(['Desktop']), 'C:\\WINDOWS\\Desktop');
  assert.strictEqual(props.locationFor(['My Computer', 'C:']), 'C:\\');
});

check('version information uses the catalog for games and Microslop for the rest', () => {
  const game = props.versionInfo('SIMS3.EXE', 'sims3');
  assert.strictEqual(game.items[0][1], 'Maxis');
  assert.strictEqual(game.copyright, 'Copyright © Maxis 2000');
  assert.strictEqual(game.items.length, 8);
  const system = props.versionInfo('CALC.EXE', 'calculator');
  assert.strictEqual(system.items[0][1], 'Microslop Corp.');
  assert.strictEqual(system.version, '4.10.1998');
});

check('hidden desktop icons are recognised for files and for stored shortcuts', () => {
  props.iconProps = { paint: { attributes: { hidden: true } } };
  assert.strictEqual(props.isHidden({ id: 'paint' }), true);
  assert.strictEqual(props.isHidden({ id: 'calc' }), false);
  assert.strictEqual(props.isHidden({ isFile: true, fileData: { attributes: { hidden: true } } }), true);
  assert.strictEqual(props.isHidden({ isFile: true, fileData: {} }), false);
});

console.log(`ALL ${passed} FILE PROPERTIES TESTS PASSED`);
