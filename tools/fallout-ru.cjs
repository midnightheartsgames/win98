const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GAME = path.join(ROOT, 'content', 'Fallout');
const RU = path.join(ROOT, 'content', 'fallout-ru');
const MODULES = ['fo-core', 'fo-dat', 'fo-formats', 'fo-files', 'fo-exe', 'fo-gen', 'fo-hex', 'fo-art', 'fo-proto', 'fo-map', 'fo-vm', 'fo-text'];
const GROUPS = ['DIALOG', 'GAME'];
const PUSH = { INT: 0xC001, FLOAT: 0xA001, STRING: 0x9001 };
const OP = { REPLY: 'gsay_reply', OPTION: 'gsay_option', IQ_OPTION: 'giq_option', MESSAGE: 'gsay_message', STR: 'message_str', FLOAT: 'float_msg', DISPLAY: 'display_msg' };
const ROLE = { PLAYER: 'P', NPC: 'N', FLOAT: 'F', DISPLAY: 'D', TEXT: 'S' };
const FORMAT = /%[-+0#]*\d*(?:\.\d+)?[sdcxXu]|%%/g;
const GENDER_FORM = /~([^~|]*)\|([^~]*)~/g;
const SPEAKER_FORM = /`([^`|]*)\|([^`]*)`/g;
const SUFFIX_FORM = /([А-Яа-яЁё]+)~([^~|]*)\|([^~]*)~/g;
const BAD_FEMALE_SUFFIX = /(ёлла|[ыиоь]йая|[ыо]йа)$/;
const ALLOWED = /[ -~А-яЁё«»—–…“”„‘’]/;
const LATIN_NAMES = /Interplay Productions|Interplay|MacPlay|Black Isle|Fallout/g;
const GENDER = { MALE: 0, FEMALE: 1 };
const STAT_GENDER = 34;
const CRITTER = 1;

let FO = null;
function engine() {
  if (!FO) {
    for (const m of MODULES) require(path.join(ROOT, 'js', 'apps', 'fallout', m + '.js'));
    FO = globalThis.FO;
  }
  return FO;
}

let dataJob = null;
function data() {
  if (!dataJob) dataJob = engine().Data.open(engine().nodeSource(GAME), engine().LOOSE);
  return dataJob;
}

function ruFile(group, name) {
  return path.join(RU, 'TEXT', group, name + '.txt');
}

function readRu(group, name) {
  const file = ruFile(group, name);
  if (!fs.existsSync(file)) return null;
  return engine().readOverlay(engine().utf8(fs.readFileSync(file)));
}

async function englishFiles(group) {
  const D = await data();
  const re = new RegExp('^TEXT\\\\ENGLISH\\\\' + group + '\\\\(.+)\\.MSG$');
  return D.list(re).map(k => re.exec(k)[1]);
}

async function english(group, name) {
  const D = await data();
  return engine().readMsg(await D.text('TEXT\\ENGLISH\\' + group + '\\' + name + '.MSG'));
}

function words(text) {
  return (String(text).match(/[A-Za-z0-9']+/g) || []).length;
}

async function scriptNames() {
  const D = await data();
  return engine().readScriptsLst(await D.text('SCRIPTS\\SCRIPTS.LST')).map(e => e.name.replace(/\.[^.]*$/, '').toUpperCase());
}

function instructions(prog, from, to) {
  const u8 = prog.bytes;
  const out = [];
  let ip = from;
  while (ip + 1 < to) {
    const op = (u8[ip] << 8) | u8[ip + 1];
    ip += 2;
    if (op === PUSH.INT || op === PUSH.FLOAT || op === PUSH.STRING) {
      out.push({ push: op === PUSH.INT ? ((u8[ip] << 24) | (u8[ip + 1] << 16) | (u8[ip + 2] << 8) | u8[ip + 3]) : null });
      ip += 4;
    } else {
      const sig = FO.OPCODES[op];
      out.push({ op: sig ? sig[0] : '' });
    }
  }
  return out;
}

function pushedBefore(list, at, count) {
  const vals = [];
  for (let i = at - count; i < at; i++) {
    if (i < 0 || !('push' in list[i])) return null;
    vals.push(list[i].push);
  }
  return vals;
}

async function roles() {
  const D = await data();
  engine();
  const names = await scriptNames();
  const out = {};
  const add = (list, id, role) => {
    const name = names[list - 1];
    if (!name || id === null) return;
    const m = out[name] || (out[name] = new Map());
    if (!m.has(id)) m.set(id, new Set());
    m.get(id).add(role);
  };
  for (const name of new Set(names)) {
    const key = 'SCRIPTS\\' + name + '.INT';
    if (!D.has(key)) continue;
    const prog = FO.readInt(await D.get(key));
    const bodies = [...new Set(prog.procs.map(p => p.body))].sort((a, b) => a - b);
    for (let b = 0; b < bodies.length; b++) {
      const list = instructions(prog, bodies[b], b + 1 < bodies.length ? bodies[b + 1] : prog.bytes.length);
      list.forEach((ins, i) => {
        if (ins.op === OP.REPLY) {
          const v = pushedBefore(list, i, 2);
          if (v) add(v[0], v[1], ROLE.NPC);
        } else if (ins.op === OP.MESSAGE) {
          const v = pushedBefore(list, i, 3);
          if (v) add(v[0], v[1], ROLE.NPC);
        } else if (ins.op === OP.OPTION) {
          const v = pushedBefore(list, i, 4);
          if (v) add(v[0], v[1], ROLE.PLAYER);
        } else if (ins.op === OP.IQ_OPTION) {
          const v = pushedBefore(list, i, 5);
          if (v) add(v[1], v[2], ROLE.PLAYER);
        } else if (ins.op === OP.STR) {
          const v = pushedBefore(list, i, 2);
          if (!v) return;
          let role = ROLE.TEXT;
          for (let j = i + 1; j < Math.min(list.length, i + 4); j++) {
            if (list[j].op === OP.FLOAT) role = ROLE.FLOAT;
            else if (list[j].op === OP.DISPLAY) role = ROLE.DISPLAY;
            else continue;
            break;
          }
          add(v[0], v[1], role);
        }
      });
    }
  }
  return out;
}

async function speakers() {
  const D = await data();
  engine();
  const names = await scriptNames();
  const protos = new FO.Protos(D);
  await protos.init();
  const out = {};
  for (const k of D.list(/^MAPS\\.*\.MAP$/)) {
    const m = FO.readMap(await D.get(k), protos);
    const byId = new Map();
    for (const group of m.scripts) for (const e of group) byId.set(e.sid, e);
    const walk = o => {
      const e = o.sid !== -1 ? byId.get(o.sid) : null;
      const index = e ? e.index : o.scriptIndex;
      const name = index >= 0 ? names[index] : null;
      if (name && FO.pidType(o.pid) === CRITTER) {
        const p = protos.get(o.pid);
        const s = out[name] || (out[name] = { male: 0, female: 0, who: new Set(), maps: new Set() });
        if (p && p.base[STAT_GENDER] === GENDER.FEMALE) s.female++;
        else s.male++;
        s.who.add(protos.name(o.pid));
        s.maps.add(k.slice(5, -4));
      }
      for (const it of o.inventory || []) walk(it.obj);
    };
    m.objects.forEach(l => l.forEach(walk));
  }
  return out;
}

function formats(text) {
  return String(text).match(FORMAT) || [];
}

function edgeSpaces(text) {
  return [/^ /.test(text), / $/.test(text)].join();
}

function edgesMatch(english, russian) {
  const attached = /^ /.test(english) && /^[.,!?;:]/.test(russian);
  return edgeSpaces(attached ? ' ' + russian : russian) === edgeSpaces(english);
}

function plain(text) {
  return String(text).replace(SPEAKER_FORM, '$1$2').replace(GENDER_FORM, '$1$2');
}

async function check() {
  const problems = [];
  for (const group of GROUPS) {
    const known = new Set(await englishFiles(group));
    const dir = path.join(RU, 'TEXT', group);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const name = f.replace(/\.txt$/, '');
      if (!/\.txt$/.test(f) || !known.has(name)) {
        problems.push(group + '/' + f + ': no English file');
        continue;
      }
      const en = await english(group, name);
      const raw = engine().utf8(fs.readFileSync(path.join(dir, f)));
      raw.split('\n').forEach((line, n) => {
        if (line.replace(/\r$/, '') && !/^\d+( .*)?\r?$/.test(line)) problems.push(group + '/' + name + ':' + (n + 1) + ': not an "id text" line');
      });
      const ru = engine().readOverlay(raw);
      for (const [id, text] of ru) {
        const where = group + '/' + name + ' ' + id;
        const e = en.get(id);
        if (!e) {
          problems.push(where + ': no such English message');
          continue;
        }
        if (/[{}]/.test(text)) problems.push(where + ': braces');
        for (const m of text.matchAll(GENDER_FORM)) if (m[1] === m[2]) problems.push(where + ': same text in both gender forms');
        for (const m of text.matchAll(SPEAKER_FORM)) if (m[1] === m[2]) problems.push(where + ': same text in both speaker forms');
        for (const m of text.matchAll(SUFFIX_FORM)) if (BAD_FEMALE_SUFFIX.test(m[1] + m[3])) problems.push(where + ': broken female ending ' + m[0]);
        const odd = [...text].filter(ch => !ALLOWED.test(ch));
        if (odd.length) problems.push(where + ': unexpected characters ' + odd.join(''));
        if (formats(e.text).join(' ') !== formats(text).join(' ')) problems.push(where + ': format ' + formats(e.text).join(' ') + ' became ' + formats(text).join(' '));
        if (!edgesMatch(e.text, text)) problems.push(where + ': leading or trailing space differs from English');
        if (/[~|`]/.test(text.replace(SPEAKER_FORM, '').replace(GENDER_FORM, ''))) problems.push(where + ': broken ~player~ or `speaker` form');
        if (/[a-z]/i.test(plain(text).replace(FORMAT, '').replace(LATIN_NAMES, ''))) problems.push(where + ': Latin letters');
      }
    }
  }
  return problems;
}

async function status(top) {
  const rows = [];
  const total = {};
  for (const group of GROUPS) {
    const t = total[group] = { files: 0, done: 0, entries: 0, translated: 0, words: 0, wordsDone: 0 };
    for (const name of await englishFiles(group)) {
      const en = await english(group, name);
      const ru = readRu(group, name) || new Map();
      let n = 0;
      let d = 0;
      let w = 0;
      let wd = 0;
      for (const [id, m] of en) {
        if (!m.text.trim()) continue;
        n++;
        w += words(m.text);
        if (ru.has(id)) {
          d++;
          wd += words(m.text);
        }
      }
      t.files++;
      t.entries += n;
      t.translated += d;
      t.words += w;
      t.wordsDone += wd;
      if (d === n) t.done++;
      else rows.push([group + '/' + name, w - wd, n - d]);
    }
  }
  return { total, left: rows.sort((a, b) => b[1] - a[1]).slice(0, top) };
}

async function dump(sub, from, to) {
  const [group, name] = sub.toUpperCase().split('/');
  const en = await english(group, name);
  const ru = readRu(group, name) || new Map();
  const lines = [];
  if (group === 'DIALOG') {
    const sp = (await speakers())[name];
    if (sp) lines.push('# speakers: male ' + sp.male + ', female ' + sp.female + '; ' + [...sp.who].join(', ') + '; maps ' + [...sp.maps].join(' '));
  }
  const r = group === 'DIALOG' ? ((await roles())[name] || new Map()) : new Map();
  for (const [id, m] of en) {
    if (!m.text.trim() || id < from || id > to) continue;
    const tag = r.has(id) ? [...r.get(id)].sort().join('') : '-';
    lines.push(id + ' ' + tag + (m.audio ? '*' : '') + ' ' + m.text + (ru.has(id) ? '\n    = ' + ru.get(id) : ''));
  }
  return lines.join('\n');
}

async function fonts() {
  const D = await data();
  const R = await engine().Data.open(engine().nodeSource(GAME), engine().LOOSE, { src: engine().nodeSource(RU, ''), files: engine().RU });
  const out = { en: {}, ru: {} };
  for (const n of [0, 1, 2, 3, 4]) {
    out.en[100 + n] = new FO.Font(FO.readAaf(await D.get('FONT' + n + '.AAF')));
    out.ru[100 + n] = new FO.Font(FO.readAaf(await R.get('FONT' + n + '.AAF')));
  }
  return out;
}

async function widths(sub, from, to, fontId) {
  const [group, name] = sub.toUpperCase().split('/');
  const en = await english(group, name);
  const ru = readRu(group, name) || new Map();
  const f = await fonts();
  const lines = [];
  for (const [id, m] of en) {
    if (id < from || id > to || !m.text.trim()) continue;
    const r = ru.has(id) ? ru.get(id) : '';
    lines.push([id, f.en[fontId].width(m.text), r ? f.ru[fontId].width(r) : '-', m.text + ' | ' + r].join(' '));
  }
  return lines.join('\n');
}

module.exports = { roles, speakers, check, status, english, englishFiles, readRu, formats, fonts };

if (require.main === module) {
  const [cmd, a, b, c] = process.argv.slice(2);
  (async () => {
    if (cmd === 'dump') console.log(await dump(a, b ? +b : -Infinity, c ? +c : Infinity));
    else if (cmd === 'widths') console.log(await widths(a, +b, +c, +(process.argv[6] || 101)));
    else if (cmd === 'status') {
      const s = await status(a ? +a : 30);
      for (const [g, t] of Object.entries(s.total)) console.log(g + ': files ' + t.done + '/' + t.files + ', messages ' + t.translated + '/' + t.entries + ', words ' + t.wordsDone + '/' + t.words);
      for (const r of s.left) console.log('  ' + r[0] + ': ' + r[1] + ' words, ' + r[2] + ' messages left');
    } else if (cmd === 'check') {
      const p = await check();
      console.log(p.length ? p.join('\n') : 'ok');
      process.exitCode = p.length ? 1 : 0;
    } else console.log('usage: node tools/fallout-ru.cjs dump GROUP/NAME [from] [to] | status [top] | check');
  })();
}
