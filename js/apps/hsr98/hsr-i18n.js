(function (H) {
  'use strict';

  const CYR_RE = /[\u0400-\u04FF]/;
  const NUM_RE = /[+−-]?\d+(?:[.,]\d+)?%?/g;
  const CACHE = new Map();
  const OBJ_RU_TO_EN = new Map();
  const OBJ_EN_TO_RU = new Map();
  let curLang = 'ru';
  let restoreList = null;
  let objMapped = false;

  H.EN = H.EN || {
    DICT: Object.create(null),
    TPL: Object.create(null),
    PATTERNS: [],
    WORDS: Object.create(null),
    SKILL_TERMS: null,
    OVERLAYS: []
  };

  function getLang() {
    return curLang;
  }

  function isEn() {
    return curLang === 'en';
  }

  function t(ru, en) {
    return curLang === 'en' ? en : ru;
  }

  function registerTpl(k, v) {
    if (typeof k !== 'string' || typeof v !== 'string') return;
    if (k.includes('{0}')) {
      H.EN.TPL[k] = v;
      return;
    }
    if (!/\d/.test(k)) return;
    const ruNums = [];
    const tplKey = k.replace(NUM_RE, m => {
      const idx = ruNums.length;
      ruNums.push(m.replace(/(\d),(\d)/g, '$1.$2'));
      return '{' + idx + '}';
    });
    if (!ruNums.length || H.EN.TPL[tplKey] !== undefined) return;
    const enNums = [];
    v.replace(NUM_RE, m => {
      enNums.push(m.replace(/(\d),(\d)/g, '$1.$2'));
      return m;
    });
    if (ruNums.length !== enNums.length) return;
    if (ruNums.every((n, i) => n === enNums[i])) {
      let idx = 0;
      H.EN.TPL[tplKey] = v.replace(NUM_RE, () => '{' + (idx++) + '}');
    } else if (new Set(ruNums).size === ruNums.length && enNums.every(n => ruNums.includes(n))) {
      H.EN.TPL[tplKey] = v.replace(NUM_RE, m => '{' + ruNums.indexOf(m.replace(/(\d),(\d)/g, '$1.$2')) + '}');
    }
  }

  function addEnDict(map) {
    if (!map) return;
    for (const k of Object.keys(map)) {
      const v = map[k];
      H.EN.DICT[k] = v;
      registerTpl(k, v);
      if (typeof k === 'string' && typeof v === 'string' && k.includes('\n')) {
        const kLines = k.split('\n').map(x => x.trim()).filter(Boolean);
        const vLines = v.split('\n').map(x => x.trim()).filter(Boolean);
        if (kLines.length > 1 && kLines.length === vLines.length) {
          for (let i = 0; i < kLines.length; i++) {
            if (H.EN.DICT[kLines[i]] === undefined) {
              H.EN.DICT[kLines[i]] = vLines[i];
              registerTpl(kLines[i], vLines[i]);
            }
          }
        }
      }
    }
    objMapped = false;
    CACHE.clear();
  }

  function addEnPatterns(list) {
    if (!Array.isArray(list)) return;
    for (const item of list) H.EN.PATTERNS.push(item);
    objMapped = false;
    CACHE.clear();
  }

  function addEnWords(map) {
    if (!map) return;
    for (const k of Object.keys(map)) H.EN.WORDS[k.toLowerCase()] = map[k];
    objMapped = false;
    CACHE.clear();
  }

  function addEnOverlay(fn) {
    if (typeof fn === 'function') H.EN.OVERLAYS.push(fn);
  }

  function fallbackTranslate(s) {
    return s;
  }

  function resolveGenderTemplate(s) {
    if (!s.includes('{')) return s;
    const gMap = {
      'Келус|Стелла': '{Caelus|Stelle}',
      'он|она': '{he|she}',
      'Он|Она': '{He|She}',
      'его|её': '{his|her}',
      'Его|Её': '{His|Her}',
      'ему|ей': '{him|her}',
      'им|ей': '{him|her}',
      'ним|ней': '{him|her}',
      'парень|девушка': '{guy|girl}',
      'парня|девушку': '{guy|girl}',
      'парню|девушке': '{guy|girl}',
      'братец|сестрица': '{brother|sister}',
      'брат|сестра': '{brother|sister}',
      'друг|подруга': '{friend|friend}',
      'герой|героиня': '{hero|heroine}',
      'господин|госпожа': '{master|mistress}',
      'чужак|чужачка': '{stranger|stranger}',
      'новичок|новенькая': '{rookie|rookie}'
    };
    return s.replace(/([а-яА-ЯёЁ]*)\{([^{}|]*)\|([^{}|]*)\}/g, (m, stem, a, b) => {
      const pair = a + '|' + b;
      if (!stem && gMap[pair]) return gMap[pair];
      if (!stem && CYR_RE.test(a) && a.length > 3) return '{' + tr(a) + '|' + tr(b) + '}';
      return stem + a;
    });
  }

  function trCore(s) {
    if (!s || !CYR_RE.test(s)) return s;
    const dict = H.EN.DICT;
    if (dict[s] !== undefined) return dict[s];

    if (s.includes('{')) {
      const resolved = resolveGenderTemplate(s);
      if (resolved !== s) {
        if (dict[resolved] !== undefined) return dict[resolved];
        s = resolved;
      }
    }

    const low0 = s[0].toLowerCase() + s.slice(1);
    if (s[0] !== low0[0] && dict[low0] !== undefined) {
      const r = dict[low0];
      return r ? r[0].toUpperCase() + r.slice(1) : r;
    }
    const up0 = s[0].toUpperCase() + s.slice(1);
    if (s[0] !== up0[0] && dict[up0] !== undefined) {
      const r = dict[up0];
      return r ? r[0].toLowerCase() + r.slice(1) : r;
    }

    if (/\d/.test(s) && H.EN.TPL) {
      const nums = [];
      const tplKey = s.replace(NUM_RE, m => {
        const idx = nums.length;
        nums.push(m.replace(/(\d),(\d)/g, '$1.$2'));
        return '{' + idx + '}';
      });
      if (nums.length && H.EN.TPL[tplKey] !== undefined) {
        return H.EN.TPL[tplKey].replace(/\{(\d+)\}/g, (_, i) => nums[+i] ?? '');
      }
    }

    if (s.startsWith('«') && s.endsWith('»') && !s.slice(1, -1).includes('«') && !s.slice(1, -1).includes('»')) {
      const inner = tr(s.slice(1, -1));
      if (!CYR_RE.test(inner)) return '"' + inner + '"';
    }
    if (s.startsWith('[') && s.endsWith(']') && !s.slice(1, -1).includes('[')) {
      const inner = tr(s.slice(1, -1));
      if (!CYR_RE.test(inner)) return '[' + inner + ']';
    }
    if (s.startsWith('(') && s.endsWith(')') && !s.slice(1, -1).includes('(')) {
      const inner = tr(s.slice(1, -1));
      if (!CYR_RE.test(inner)) return '(' + inner + ')';
    }
    if (s.startsWith('— ') && s.endsWith(' —')) {
      const inner = tr(s.slice(2, -2));
      if (!CYR_RE.test(inner)) return '— ' + inner + ' —';
    }

    const prefixFmt = s.match(/^([\^>~#]\s*)([\s\S]+)$/);
    if (prefixFmt && CYR_RE.test(prefixFmt[2])) {
      const inner = tr(prefixFmt[2]);
      if (!CYR_RE.test(inner)) return prefixFmt[1] + inner;
    }

    if (s.includes('|') && s[0] !== '{') {
      const pipeIdx = s.indexOf('|');
      const head = s.slice(0, pipeIdx);
      const body = s.slice(pipeIdx + 1);
      if (body && !head.includes('{') && (head.length <= 2 || /^[a-z0-9_@?]+$/i.test(head) || head.includes('='))) {
        const eq = head.indexOf('=');
        const nextHead = eq < 0 ? head : head.slice(0, eq + 1) + tr(head.slice(eq + 1));
        const nextBody = CYR_RE.test(body) ? tr(body) : body;
        if (!CYR_RE.test(nextBody) && (eq < 0 || !CYR_RE.test(nextHead))) {
          return nextHead + '|' + nextBody;
        }
      }
    }

    const bullet = s.match(/^([•·▶◆★☆✦✧✓✗▲▼+-]\s+|\d+[.)]\s+)([\s\S]+)$/);
    if (bullet) {
      const inner = tr(bullet[2]);
      if (!CYR_RE.test(inner)) return bullet[1] + inner;
    }

    for (const [re, rep] of H.EN.PATTERNS) {
      if (re.test(s)) {
        const next = typeof rep === 'function' ? s.replace(re, rep) : s.replace(re, rep);
        if (next !== s) return CYR_RE.test(next) ? tr(next) : next.replace(/(\d),(\d)/g, '$1.$2');
      }
    }

    const sentParts = s.split(/(?<!\b(?:крит|макс|мин|ур|ед|сопр|восст|физ|огн|лёд|лед|элк|втр|квн|мнм|осн|сосед|отск|пасс|абс|сек|х))\.\s+(?=[А-ЯЁA-Z«"\[])/i);
    if (sentParts.length > 1 && sentParts.every(p => p.length > 0)) {
      const joined = sentParts.map((p, i) => tr(i < sentParts.length - 1 ? p + '.' : p)).join(' ');
      if (!CYR_RE.test(joined)) return joined;
    }

    const seps = [' · ', ' — ', ' / ', ' | ', '; ', ': ', ', ', ' + '];
    for (const sep of seps) {
      if (s.includes(sep)) {
        const parts = s.split(sep);
        if (parts.length > 1 && parts.every(p => p.length > 0)) {
          const tParts = parts.map(p => tr(p));
          const joined = tParts.join(sep);
          if (joined !== s && !CYR_RE.test(joined)) return joined;
        }
      }
    }

    const paren = s.match(/^(.+?)\s*\(([^()]+)\)(.*)$/);
    if (paren && (CYR_RE.test(paren[1]) || CYR_RE.test(paren[2]))) {
      const p1 = tr(paren[1]), p2 = tr(paren[2]), p3 = paren[3] ? tr(paren[3]) : '';
      const joined = p1 + ' (' + p2 + ')' + p3;
      if (!CYR_RE.test(joined)) return joined;
    }

    if (s.includes('«')) {
      const qReplaced = s.replace(/«([^»]+)»/g, (_, q) => '"' + tr(q) + '"');
      if (qReplaced !== s && !CYR_RE.test(qReplaced)) return qReplaced;
    }

    const trailPunct = s.match(/^([\s\S]+?)([.!?:;…]+)$/);
    if (trailPunct && dict[trailPunct[1]] !== undefined) {
      return dict[trailPunct[1]] + trailPunct[2];
    }

    return fallbackTranslate(s);
  }

  function tr(str) {
    if (typeof str !== 'string' || !str) return String(str ?? '');
    if (!CYR_RE.test(str)) return H.EN.DICT[str] !== undefined ? H.EN.DICT[str] : str;
    const hit = CACHE.get(str);
    if (hit !== undefined) return hit;
    if (H.EN.DICT[str] !== undefined) {
      const exact = H.EN.DICT[str];
      CACHE.set(str, exact);
      return exact;
    }
    if (str.includes('\n')) {
      const ml = str.split('\n').map(line => tr(line)).join('\n');
      CACHE.set(str, ml);
      return ml;
    }
    const m = str.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const core = m ? m[2] : str;
    const res = ((m ? m[1] : '') + (H.EN.DICT[core] !== undefined ? H.EN.DICT[core] : trCore(core)) + (m ? m[3] : '')).replace(/(\d),(\d)/g, '$1.$2');
    if (CACHE.size > 25000) CACHE.clear();
    CACHE.set(str, res);
    return res;
  }

  function buffName(name) {
    return curLang === 'en' ? tr(name) : String(name ?? '');
  }

  const EXTRA_OBJS = [
    'Прийти в себя',
    'Поищите следы цивилизации в Снежных полях',
    'Посетите Монумент вечнозимья',
    'Загляните в мастерскую «Незимье»',
    'Отправляйтесь в Заклёпкоград за припасами (северный выход)',
    'Найдите проводника, которого выделил Дикий Огонь',
    'Проберитесь в мастерскую «Незимье», не попадаясь патрулям',
    'Идите вместе с Сервал в Запретную зону Среброгривых Стражей (юг района)',
    'Углубитесь в Коридор исчезающего эха',
    'Найдите следы Брони и Коколии (тропа вверх по холму)',
    'Расспросить Асту о положении на станции (главный пульт)'
  ];

  function registerObjPair(ruText) {
    if (!ruText || !CYR_RE.test(ruText)) return;
    const enText = tr(ruText);
    if (enText && enText !== ruText) {
      OBJ_RU_TO_EN.set(ruText, enText);
      OBJ_EN_TO_RU.set(enText, ruText);
    }
  }

  function ensureObjMap() {
    if (objMapped) return;
    objMapped = true;
    for (const o of EXTRA_OBJS) registerObjPair(o);
    if (H.SCRIPTS) {
      for (const k of Object.getOwnPropertyNames(H.SCRIPTS)) {
        const steps = H.SCRIPTS[k];
        if (!Array.isArray(steps)) continue;
        for (const st of steps) {
          if (st && typeof st === 'object' && st.obj) registerObjPair(st.obj);
        }
      }
    }
  }

  function objAlt(text) {
    if (!text) return null;
    ensureObjMap();
    return OBJ_RU_TO_EN.get(text) || OBJ_EN_TO_RU.get(text) || null;
  }

  function recordSet(list, obj, key, nextVal) {
    if (!obj || obj[key] === nextVal) return;
    list.push({ obj, key, val: obj[key] });
    obj[key] = nextVal;
  }

  function translateScriptLine(line) {
    if (typeof line !== 'string' || !line || line[0] === '#') return line;
    const i = line.indexOf('|');
    if (i < 0) return CYR_RE.test(line) ? tr(line) : line;
    const head = line.slice(0, i), body = line.slice(i + 1);
    const eq = head.indexOf('=');
    const nextHead = eq < 0 ? head : head.slice(0, eq + 1) + tr(head.slice(eq + 1));
    const nextBody = CYR_RE.test(body) ? tr(body) : body;
    return nextHead + '|' + nextBody;
  }

  function overlayScripts(scriptsObj, list) {
    if (!scriptsObj) return;
    for (const name of Object.getOwnPropertyNames(scriptsObj)) {
      const steps = scriptsObj[name];
      if (!Array.isArray(steps)) continue;
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        if (typeof st === 'string') {
          if (st[0] !== '#' && CYR_RE.test(st)) recordSet(list, steps, i, translateScriptLine(st));
          continue;
        }
        if (!st || typeof st !== 'object') continue;
        for (const k of ['obj', 'recap', 'text', 'title', 'tut', 'note', 'lockText', 'why']) {
          if (typeof st[k] === 'string' && CYR_RE.test(st[k])) {
            if (k === 'obj') registerObjPair(st[k]);
            recordSet(list, st, k, tr(st[k]));
          }
        }
        if (Array.isArray(st.lift) && typeof st.lift[1] === 'string' && CYR_RE.test(st.lift[1])) {
          recordSet(list, st.lift, 1, tr(st.lift[1]));
        }
        if (Array.isArray(st.one)) {
          for (let j = 0; j < st.one.length; j++) {
            if (typeof st.one[j] === 'string' && CYR_RE.test(st.one[j])) recordSet(list, st.one, j, translateScriptLine(st.one[j]));
          }
        }
        if (Array.isArray(st.choice)) {
          for (const opt of st.choice) {
            if (Array.isArray(opt) && typeof opt[0] === 'string' && CYR_RE.test(opt[0])) recordSet(list, opt, 0, tr(opt[0]));
          }
        }
        if (Array.isArray(st.menu)) {
          for (const opt of st.menu) {
            if (Array.isArray(opt) && typeof opt[0] === 'string' && CYR_RE.test(opt[0])) recordSet(list, opt, 0, tr(opt[0]));
          }
        }
        if (Array.isArray(st.exit) && typeof st.exit[0] === 'string' && CYR_RE.test(st.exit[0])) {
          recordSet(list, st.exit, 0, tr(st.exit[0]));
        }
      }
    }
  }

  function overlayMaps(mapsObj, list) {
    if (!mapsObj) return;
    for (const id of Object.getOwnPropertyNames(mapsObj)) {
      const m = mapsObj[id];
      if (!m || typeof m !== 'object') continue;
      if (typeof m.name === 'string' && CYR_RE.test(m.name)) recordSet(list, m, 'name', tr(m.name));
      if (typeof m.sub === 'string' && CYR_RE.test(m.sub)) recordSet(list, m, 'sub', tr(m.sub));
      if (Array.isArray(m.anchors)) {
        for (let i = 0; i < m.anchors.length; i++) {
          if (typeof m.anchors[i] === 'string' && CYR_RE.test(m.anchors[i])) recordSet(list, m.anchors, i, tr(m.anchors[i]));
        }
      }
      if (m.mate && typeof m.mate === 'object') {
        const mates = Array.isArray(m.mate) ? m.mate : [m.mate];
        for (const mt of mates) {
          if (!mt || typeof mt !== 'object') continue;
          for (const k of ['name', 'label', 'hint']) {
            if (typeof mt[k] === 'string' && CYR_RE.test(mt[k])) recordSet(list, mt, k, tr(mt[k]));
          }
        }
      }
      if (m.marks && typeof m.marks === 'object') {
        for (const ch of Object.getOwnPropertyNames(m.marks)) {
          const mk = m.marks[ch];
          if (!mk || typeof mk !== 'object') continue;
          for (const k of ['name', 'label', 'hint', 'lockText', 'text', 'title']) {
            if (typeof mk[k] === 'string' && CYR_RE.test(mk[k])) recordSet(list, mk, k, tr(mk[k]));
          }
          if (Array.isArray(mk.bark)) {
            for (let j = 0; j < mk.bark.length; j++) {
              if (typeof mk.bark[j] === 'string' && CYR_RE.test(mk.bark[j])) recordSet(list, mk.bark, j, translateScriptLine(mk.bark[j]));
            }
          }
          if (Array.isArray(mk.lift)) {
            for (const lf of mk.lift) {
              if (Array.isArray(lf) && typeof lf[3] === 'string' && CYR_RE.test(lf[3])) recordSet(list, lf, 3, tr(lf[3]));
            }
          }
        }
      }
    }
  }

  function cleanTraceDesc(s) {
    return s.replace(/\s*[—–]\s*/g, ', ');
  }

  function cleanEidName(s) {
    const clean = s.replace(/\s*[—–]\s*/g, ': ');
    if (clean.length <= 28) return clean;
    const cut = clean.slice(0, 28).replace(/\s+\S*$/, '');
    return cut.length >= 10 ? cut : clean.slice(0, 28).trimEnd();
  }

  function overlayTraces(tracesObj, list) {
    if (!tracesObj) return;
    for (const id of Object.getOwnPropertyNames(tracesObj)) {
      const tObj = tracesObj[id];
      if (!tObj || typeof tObj !== 'object') continue;
      if (Array.isArray(tObj.bonus)) {
        for (const b of tObj.bonus) {
          if (!Array.isArray(b)) continue;
          if (typeof b[0] === 'string' && CYR_RE.test(b[0])) recordSet(list, b, 0, tr(b[0]));
          if (typeof b[1] === 'string' && CYR_RE.test(b[1])) recordSet(list, b, 1, cleanTraceDesc(tr(b[1])));
        }
      }
      if (Array.isArray(tObj.eid)) {
        for (const e of tObj.eid) {
          if (!Array.isArray(e)) continue;
          if (typeof e[0] === 'string' && CYR_RE.test(e[0])) recordSet(list, e, 0, cleanEidName(tr(e[0])));
          if (typeof e[1] === 'string' && CYR_RE.test(e[1])) recordSet(list, e, 1, cleanTraceDesc(tr(e[1])));
        }
      }
    }
  }

  function overlayCine(cineObj, list) {
    if (!cineObj || !cineObj.CINES) return;
    for (const id of Object.getOwnPropertyNames(cineObj.CINES)) {
      const def = cineObj.CINES[id];
      if (!def || !Array.isArray(def.shots)) continue;
      for (const sh of def.shots) {
        if (!sh || !Array.isArray(sh.sub)) continue;
        for (const sb of sh.sub) {
          if (Array.isArray(sb) && typeof sb[1] === 'string' && CYR_RE.test(sb[1])) {
            recordSet(list, sb, 1, translateScriptLine(sb[1]));
          }
        }
      }
    }
  }

  const SKIP_OBJ_KEYS = new Set([
    'fx', 'rows', 'look', 'base', 'curves', 'at', 'goto',
    'CINES', 'TERMS'
  ]);

  function walkOverlay(node, list, seen, inEnemies) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const v = node[i];
        if (typeof v === 'string') {
          if (CYR_RE.test(v)) recordSet(list, node, i, tr(v));
        } else if (v && typeof v === 'object') {
          walkOverlay(v, list, seen, false);
        }
      }
      return;
    }
    for (const k of Object.getOwnPropertyNames(node)) {
      if (SKIP_OBJ_KEYS.has(k)) continue;
      if (inEnemies && k === 'skills') continue;
      if (k === 'SCRIPTS') { overlayScripts(node[k], list); continue; }
      if (k === 'MAPS') { overlayMaps(node[k], list); continue; }
      const desc = Object.getOwnPropertyDescriptor(node, k);
      if (!desc || !('value' in desc)) continue;
      const v = desc.value;
      if (typeof v === 'string') {
        if (CYR_RE.test(v) && desc.writable) recordSet(list, node, k, tr(v));
      } else if (v && typeof v === 'object') {
        walkOverlay(v, list, seen, false);
      }
    }
  }

  const DATA_TABLES = [
    'ELEMENTS', 'PATHS', 'STAT_NAMES', 'DOT_NAME',
    'CHARS', 'CONES', 'RELIC_SETS', 'RELIC_SLOTS', 'CAVERN_SLOTS', 'PLANAR_SLOTS',
    'ITEMS', 'ENEMIES', 'FUSIONS', 'UNHOLY', 'CONTACT',
    'INABA', 'FOURS', 'CONTON', 'HARES', 'FIVES', 'LAB', 'ENCOUNTERS',
    'BANNERS', 'CONTON_BANNER', 'KONOSUBA', 'SHOPS', 'RUMORS', 'QUESTS',
    'MISSION_TYPES', 'MISSION_CHAPTERS', 'TRAIL_MISSIONS',
    'MAIL', 'SPEAKERS', 'WORLDS', 'DESTINATIONS', 'EXPRESS_CARS', 'EXPRESS_AREA', 'EXPRESS_AREAS', 'CHAT',
    'DOCS', 'DB_AEONS', 'DB_FACTIONS', 'DB_TERMS', 'BOOK_WORLDS', 'BOOK_SERIES', 'FOE_LORE', 'INFO',
    'OUTFITS', 'OUTFIT_TIER', 'OUTFIT_CUTS', 'PETS', 'PHONE_SKINS', 'PROMOS',
    'RELIC_CRAFT', 'RECIPE_CHEST', 'SUPPLY', 'PASS', 'PASS_RULES', 'PASS_MISSIONS', 'CONTRACTS', 'CONTRACT_PERIODS',
    'RECORDS', 'RECORD_ALBUMS', 'RECORD_PARTS', 'GUESTS', 'PHOTOS', 'NET', 'RATE', 'FRIEND_TEXT',
    'GUIDE_INDEX', 'GUIDE_DAILY', 'GUIDE_TUTORIALS', 'GUIDE_SECTIONS', 'GUIDE_ACTS', 'GUIDE_RULES',
    'DAILY_TASKS', 'VELVET', 'TL_REWARDS', 'EVENT_TABS', 'CREDIT_CLIPS', 'ELATION_HELP', 'ELATION_CUTS',
    'CALYX', 'CALYX_TIERS', 'TRACE_ABILITIES', 'TRACE_PATH_LINES', 'TRACE_FOE_LINES', 'TRACE_ECHOES', 'TRACE_STAT_TITLE',
    'ASC', 'SU', 'FH', 'PF', 'CW', 'CW_UI', 'RANGE', 'LF_FIELD',
    'POM_FACTS', 'POM_OUTFITS',
    'ROOM_ZONES', 'ROOM_THEMES', 'ROOM_BUILDS', 'ROOM_DECOR', 'ROOM_SLOTS', 'ROOM_TROPHIES', 'ROOM_CREW', 'ROOM_CARDS', 'ROOM_LOGS', 'ROOM_REWARDS',
    'TUTORIAL_CATS', 'TUTORIAL_CHAPTERS', 'TUTORIAL_TOPICS', 'TUTORIAL_ENTRIES',
    'TRAINING_GROUPS', 'TRAINING_PUZZLES', 'TRAINING_TRIALS',
    'SkillsInfo', 'TRAIL_WILL',
    'HD', 'UI_CONST', 'Magflow', 'Carts', 'Cine', 'Ults', 'Fusions', 'WarpIntro',
    'SignalKit', 'ConveneKit', 'ExplosionKit', 'Personas', 'MidnightKit', 'SpotKit',
    'Eidolons', 'InabaScenes', 'FoursScenes', 'FivesScenes', 'LabScenes'
  ];

  function overlayBrand(list) {
    if (!H.BRAND) return;
    if (H.BRAND.standalone) {
      const ed = globalThis.Hsr98Standalone === 'apk'
        ? 'Portable Edition · Android APK'
        : globalThis.Hsr98Standalone === 'pc'
          ? 'Jarilo-VI Edition · PC'
          : 'Jarilo-VI Edition';
      recordSet(list, H.BRAND, 'edition', ed);
      recordSet(list, H.BRAND, 'team', 'Star Rail 98 Team');
      recordSet(list, H.BRAND, 'disc', 'v' + H.BUILD_VERSION + ' · Midnight Hearts fan project');
      if (Array.isArray(H.BRAND.credits)) {
        const cr = ['STAR RAIL 98', '', ed, '', 'Midnight Hearts fan project', 'World and characters belong to HoYoverse', '', 'Combat mechanics inspired by the original'];
        for (let i = 0; i < cr.length; i++) recordSet(list, H.BRAND.credits, i, cr[i]);
      }
    } else {
      recordSet(list, H.BRAND, 'edition', 'Jarilo-VI Edition · PC CD-ROM');
      recordSet(list, H.BRAND, 'team', 'Honkai: Star Rail 98 Team');
      if (Array.isArray(H.BRAND.credits)) {
        const cr = ['HONKAI: STAR RAIL 98', '', 'Jarilo-VI Edition', '', 'Story based on Honkai: Star Rail', '(c) miHoYo / HoYoverse', '', 'Combat mechanics — Honkai: Star Rail'];
        for (let i = 0; i < cr.length; i++) recordSet(list, H.BRAND.credits, i, cr[i]);
      }
    }
  }

  function applyDataLang(lang) {
    ensureObjMap();
    if (restoreList) {
      for (let i = restoreList.length - 1; i >= 0; i--) {
        const item = restoreList[i];
        item.obj[item.key] = item.val;
      }
      restoreList = null;
      if (H.coneInit && H.CONES) H.coneInit(H.CONES);
    }
    if (lang !== 'en') {
      if (H.resetGameCaches) H.resetGameCaches();
      return;
    }
    const list = [];
    const seen = new Set();
    overlayScripts(H.SCRIPTS, list);
    overlayMaps(H.MAPS, list);
    overlayTraces(H.TRACES, list);
    overlayCine(H.Cine, list);
    if (H.ENEMIES) {
      for (const id of Object.getOwnPropertyNames(H.ENEMIES)) {
        walkOverlay(H.ENEMIES[id], list, seen, true);
      }
    }
    for (const tbl of DATA_TABLES) {
      if (tbl === 'ENEMIES' || !H[tbl]) continue;
      if (typeof H[tbl] === 'object') walkOverlay(H[tbl], list, seen, false);
    }
    if (H.BD && H.BD.TIER) {
      walkOverlay(H.BD.TIER, list, seen, false);
    }
    if (H.SkillsInfo && H.EN.SKILL_TERMS) recordSet(list, H.SkillsInfo, 'TERMS', H.EN.SKILL_TERMS);
    overlayBrand(list);
    for (const fn of H.EN.OVERLAYS) fn(list, recordSet, tr);
    if (H.coneInit && H.CONES) H.coneInit(H.CONES);
    restoreList = list;
    if (H.resetGameCaches) H.resetGameCaches();
  }

  function syncSaveLang(state) {
    if (!state) return;
    ensureObjMap();
    if (curLang === 'en') {
      if (state.name === 'Келус') state.name = 'Caelus';
      else if (state.name === 'Стелла') state.name = 'Stelle';
      else if (state.name === 'Первопроходец') state.name = 'Trailblazer';
      if (state.obj) {
        if (!OBJ_RU_TO_EN.has(state.obj) && CYR_RE.test(state.obj)) registerObjPair(state.obj);
        if (OBJ_RU_TO_EN.has(state.obj)) state.obj = OBJ_RU_TO_EN.get(state.obj);
        else if (CYR_RE.test(state.obj)) state.obj = tr(state.obj);
      }
    } else {
      if (state.name === 'Caelus') state.name = 'Келус';
      else if (state.name === 'Stelle') state.name = 'Стелла';
      else if (state.name === 'Trailblazer') state.name = 'Первопроходец';
      if (state.obj && OBJ_EN_TO_RU.has(state.obj)) {
        state.obj = OBJ_EN_TO_RU.get(state.obj);
      }
    }
  }

  function setLang(lang, ctx) {
    const next = lang === 'en' ? 'en' : 'ru';
    if (curLang === next && ((next === 'en' && restoreList) || (next === 'ru' && !restoreList))) {
      if (ctx && ctx.game) syncSaveLang(ctx.game.state);
      return curLang;
    }
    curLang = next;
    CACHE.clear();
    applyDataLang(next);
    const g = (ctx && ctx.game) || (typeof window !== 'undefined' && window.hsrui && window.hsrui.game) || null;
    const ui = (ctx && ctx.ui) || (typeof window !== 'undefined' && window.hsrui) || null;
    if (g && g.state) {
      syncSaveLang(g.state);
      if (g.map && H.MAPS && H.MAPS[g.map.id]) {
        g.map = g.buildMap ? g.buildMap(g.map.id) : g.map;
      }
    }
    if (ui) {
      if (ui.banner && g && g.map && g.map.def) ui.banner.text = g.map.def.name;
      if (ui.dlg) ui.dlg = null;
    }
    return curLang;
  }

  function syncUiLang(ui) {
    if (!ui || !ui.options) return;
    if (!ui.options.lang) ui.options.lang = 'ru';
    if (ui.options.lang === 'en') setLang('en', { ui, game: ui.game });
    else if (curLang !== 'ru') setLang('ru', { ui, game: ui.game });
  }

  function wrapHelpers() {
    if (H.SkillsInfo && H.SkillsInfo.buildNode && !H.SkillsInfo._i18nWrapped) {
      H.SkillsInfo._i18nWrapped = true;
      const buildNode0 = H.SkillsInfo.buildNode;
      H.SkillsInfo.buildNode = function (g, charKey, kitId, nodeId, lvPreview) {
        const res = buildNode0.call(this, g, charKey, kitId, nodeId, lvPreview);
        if (!res || !isEn()) return res;
        if (res.cat) {
          res.cat = Object.assign({}, res.cat, {
            badge: tr(res.cat.badge),
            wheel: tr(res.cat.wheel),
            short: tr(res.cat.short),
            key: tr(res.cat.key)
          });
        }
        if (Array.isArray(res.forms)) {
          res.forms = res.forms.map(f => Object.assign({}, f, {
            pill: f.pill ? tr(f.pill) : f.pill,
            badge: f.badge ? tr(f.badge) : f.badge,
            title: f.title ? tr(f.title) : f.title,
            tag: f.tag ? tr(f.tag) : f.tag,
            full: f.full ? tr(f.full) : f.full,
            short: f.short ? tr(f.short) : f.short,
            stats: Array.isArray(f.stats) ? f.stats.map(pair => [tr(pair[0]), tr(String(pair[1]))]) : f.stats,
            extras: Array.isArray(f.extras) ? f.extras.map(ex => Object.assign({}, ex, {
              kind: ex.kind ? tr(ex.kind) : ex.kind,
              title: ex.title ? tr(ex.title) : ex.title,
              tag: ex.tag ? tr(ex.tag) : ex.tag,
              text: ex.text ? tr(ex.text) : ex.text
            })) : f.extras
          }));
        }
        return res;
      };
    }
    if (H.traceDescribeFx && !H._traceDescWrapped) {
      H._traceDescWrapped = true;
      const descFx0 = H.traceDescribeFx;
      const descAb0 = H.traceDescribeAb;
      H.traceDescribeFx = function (ab) {
        const s = descFx0.apply(this, arguments);
        return isEn() ? tr(s) : s;
      };
      if (descAb0) {
        H.traceDescribeAb = function (kitId, id, lv) {
          const s = descAb0.apply(this, arguments);
          return isEn() ? tr(s) : s;
        };
      }
      if (H.traceNodes) {
        const nodes0 = H.traceNodes;
        H.traceNodes = function (kitId) {
          const list = nodes0.apply(this, arguments);
          if (!isEn() || !Array.isArray(list)) return list;
          return list.map(n => Object.assign({}, n, {
            title: n.title ? tr(n.title) : n.title,
            text: n.text ? tr(n.text) : n.text
          }));
        };
      }
    }
    if (H.infoLock && !H._infoLockWrapped) {
      H._infoLockWrapped = true;
      const infoLock0 = H.infoLock;
      H.infoLock = function () {
        const s = infoLock0.apply(this, arguments);
        if (!s || !isEn()) return s;
        return s
          .replace(/^Откроется /, 'Unlocks ')
          .replace(/на ур\. (\d+)/g, 'at Lv. $1')
          .replace(/с Эйдолоном ([IVX]+)/g, 'at Eidolon $1')
          .replace(/когда (.+?) будет в отряде/g, (_, name) => 'when ' + tr(name) + ' joins the party')
          .replace(/позже по сюжету/g, 'later in the story');
      };
    }
    if (H.BD && !H.BD._i18nWrapped) {
      H.BD._i18nWrapped = true;
      for (const fnName of ['statText', 'buffText', 'rightOf', 'foeTag', 'allyTag']) {
        const fn0 = H.BD[fnName];
        if (typeof fn0 === 'function') {
          H.BD[fnName] = function () {
            const s = fn0.apply(this, arguments);
            return isEn() && typeof s === 'string' ? tr(s).replace(/(\d),(\d)/g, '$1.$2') : s;
          };
        }
      }
      const foeSkill0 = H.BD.foeSkill;
      if (typeof foeSkill0 === 'function') {
        H.BD.foeSkill = function () {
          const r = foeSkill0.apply(this, arguments);
          if (!r || !isEn()) return r;
          return {
            name: r.name ? tr(r.name) : r.name,
            tag: r.tag ? tr(r.tag) : r.tag,
            text: r.text ? tr(r.text).replace(/(\d),(\d)/g, '$1.$2') : r.text,
            warn: r.warn ? tr(r.warn) : r.warn
          };
        };
      }
      const statuses0 = H.BD.statuses;
      const trStatuses = out => {
        if (!out) return out;
        for (const g of ['buff', 'debuff', 'other']) {
          if (!Array.isArray(out[g])) continue;
          for (const item of out[g]) {
            if (item.name) item.name = tr(item.name);
            if (item.text) item.text = tr(item.text).replace(/(\d),(\d)/g, '$1.$2');
            if (item.right) item.right = tr(item.right).replace(/(\d),(\d)/g, '$1.$2');
          }
        }
        return out;
      };
      const trStatRow = r => {
        if (!r) return r;
        if (r.label) r.label = tr(r.label);
        if (typeof r.text === 'string') r.text = r.text.replace(/(\d),(\d)/g, '$1.$2');
        if (typeof r.plus === 'string') r.plus = r.plus.replace(/(\d),(\d)/g, '$1.$2');
        return r;
      };
      if (typeof statuses0 === 'function') {
        H.BD.statuses = function () {
          const out = statuses0.apply(this, arguments);
          return isEn() ? trStatuses(out) : out;
        };
      }
      const allyStats0 = H.BD.allyStats;
      if (typeof allyStats0 === 'function') {
        H.BD.allyStats = function () {
          const out = allyStats0.apply(this, arguments);
          if (!out || !isEn()) return out;
          if (Array.isArray(out.all)) out.all.forEach(trStatRow);
          return out;
        };
      }
      const contactOf0 = H.BD.contactOf;
      if (typeof contactOf0 === 'function') {
        H.BD.contactOf = function () {
          const ct = contactOf0.apply(this, arguments);
          if (!ct || !isEn()) return ct;
          if (ct.family) ct.family = tr(ct.family);
          if (Array.isArray(ct.mood)) ct.mood = ct.mood.map(tr);
          if (Array.isArray(ct.known)) ct.known = ct.known.map(tr);
          if (Array.isArray(ct.hint)) ct.hint = ct.hint.map(tr);
          return ct;
        };
      }
      const model0 = H.BD.model;
      if (typeof model0 === 'function') {
        H.BD.model = function () {
          const m = model0.apply(this, arguments);
          if (!m || !isEn()) return m;
          if (m.name) m.name = tr(m.name);
          if (m.owner) m.owner = tr(m.owner);
          if (m.statuses) trStatuses(m.statuses);
          if (m.spd) trStatRow(m.spd);
          if (m.effRes) trStatRow(m.effRes);
          if (m.stats && Array.isArray(m.stats.all)) m.stats.all.forEach(trStatRow);
          if (m.contact) {
            if (m.contact.family) m.contact.family = tr(m.contact.family);
            if (Array.isArray(m.contact.mood)) m.contact.mood = m.contact.mood.map(tr);
            if (Array.isArray(m.contact.known)) m.contact.known = m.contact.known.map(tr);
            if (Array.isArray(m.contact.hint)) m.contact.hint = m.contact.hint.map(tr);
          }
          return m;
        };
      }
      const pct0 = H.BD.pct;
      if (typeof pct0 === 'function') {
        H.BD.pct = function () {
          const s = pct0.apply(this, arguments);
          return isEn() && typeof s === 'string' ? s.replace(/(\d),(\d)/g, '$1.$2') : s;
        };
      }
    }
  }

  wrapHelpers();

  Object.assign(H, {
    getLang,
    isEn,
    t,
    tr,
    buffName,
    objAlt,
    setLang,
    syncSaveLang,
    syncUiLang,
    addEnDict,
    addEnPatterns,
    addEnWords,
    addEnOverlay
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
