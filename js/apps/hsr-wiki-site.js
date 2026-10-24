(function () {
  'use strict';

  const HOST = 'http://www.astralwiki98.ru';
  const EDITS_KEY = 'win98_astralwiki_edits_v1';
  const TALK_KEY = 'win98_astralwiki_talk_v1';
  const SPOILER_KEY = 'win98_astralwiki_spoilers_v1';
  const HITS_KEY = 'win98_astralwiki_hits_v1';
  const CHECKS_KEY = 'win98_astralwiki_checks_v1';
  const SAVE_KEY = 'win98_hsr98_save_v3';
  const SITE_DAY = '30.11.2000';
  const BASE_REV = { rev: 'v0.90-base', date: '15.10.2000 09:00', user: 'Archivist_Dan', note: 'Первичная выгрузка карточки из Банка данных Звёздного экспресса (v1.0-v1.5).' };

  const H = () => globalThis.Hsr98;
  const D = () => globalThis.hsrWikiData;

  const STATIONS = [
    ['home', '', 'Заглавная'],
    ['systems', '/systems', 'Космология'],
    ['factions', '/factions', 'Фракции'],
    ['chars', '/chars', 'Персонажи'],
    ['atlas', '/atlas', 'Атлас'],
    ['quests', '/quests', 'Прохождение'],
    ['themes', '/themes', 'Темы'],
    ['artifacts', '/artifacts', 'Предметы'],
    ['recent', '/recent', 'Правки']
  ];

  const CHAR_GROUPS = [
    ['express', 'Звёздный экспресс', ['trail', 'march', 'danheng', 'himeko', 'welt']],
    ['station', 'Станция «Герта» и Общество гениев', ['herta', 'asta', 'arlan', 'ruanmei']],
    ['hunters', 'Охотники за Стелларонами', ['kafka', 'silverwolf', 'blade']],
    ['jarilo', 'Ярило-VI', ['bronya', 'seele', 'gepard', 'serval', 'pela', 'natasha', 'sampo', 'hook', 'clara', 'lynx', 'luka']],
    ['luofu', 'Сяньчжоу «Лофу»', ['bailu', 'yanqing', 'sushang', 'xueyi', 'hanya', 'tingyun', 'qingque', 'yukong', 'guinaifen']],
    ['guests', 'Гости Междумирья', null]
  ];

  const SECTORS = [
    ['hs_', 'Космическая станция «Герта»', 'Станция «Герта»'],
    ['express', 'Звёздный экспресс', 'Экспресс'],
    ['j_', 'Ярило-VI: Надмирье и Снежные равнины', 'Надмирье'],
    ['u_', 'Ярило-VI: Подземье', 'Подземье'],
    ['su_', 'Виртуальная вселенная', 'Виртуальная вселенная'],
    ['ax_', 'Королевство Белзерг: Аксель', 'Белзерг']
  ];

  const DOC_KINDS = [
    ['paper', 'Записки и листовки', 'З'],
    ['book', 'Книги и рукописи', 'К'],
    ['screen', 'Экраны и терминалы', 'Э']
  ];

  const NPC_NAMES = { pompom: 'Пом-Пом', terminal: 'Терминал', guard: 'Патрульный' };

  function normText(s) {
    if (s == null) return '';
    return String(s)
      .replace(/\{name\}/g, playerName())
      .replace(/\{([^|{}]+)\|([^{}]*)\}/g, '$1')
      .replace(/—/g, '-')
      .replace(/★/g, '*')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\bMicrosoft\b/gi, 'Microslop')
      .replace(/\bWindows\b/gi, 'Win');
  }

  function esc(s) {
    return normText(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function A(url, html, cls) {
    return `<a href="#"${cls ? ` class="${cls}"` : ''} data-url="${esc(url)}">${html}</a>`;
  }

  function jump(anchor, html) {
    return `<a href="#" data-aw-jump="${anchor}">${html}</a>`;
  }

  function anchorTag(id) {
    return `<a name="${id}" id="${id}"></a>`;
  }

  function alt(i) {
    return i % 2 ? ' class="hwk-alt"' : '';
  }

  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b > 1 && b < 5) return few;
    return many;
  }

  function stars(n) {
    const r = Math.max(1, Math.min(5, Number(n) || 3));
    return `<span class="hwk-rar hwk-rar-${r}">${'*'.repeat(r)}</span>`;
  }

  function art(spec, w, h) {
    return `<canvas class="hwk-canvas" width="${w}" height="${h}" data-aw-art="${esc(spec)}"></canvas>`;
  }

  function readJson(key, fallback) {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function readSave() {
    const sv = readJson(SAVE_KEY, null);
    return sv && typeof sv === 'object' ? sv : null;
  }

  function playerName() {
    const sv = readSave();
    return (sv && sv.name && String(sv.name).trim()) ? String(sv.name).trim().replace(/—/g, '-') : 'Первопроходец';
  }

  function spoilersOpen() {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(SPOILER_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setSpoilersOpen(on) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
    } catch (e) {}
  }

  function visits() {
    try {
      const n = parseInt(typeof localStorage !== 'undefined' ? localStorage.getItem(HITS_KEY) : '0', 10);
      return 4820 + (Number.isFinite(n) && n > 0 ? n : 0);
    } catch (e) {
      return 4820;
    }
  }

  function bumpVisits() {
    if (site.hitCounted) return;
    site.hitCounted = true;
    try {
      const n = parseInt(localStorage.getItem(HITS_KEY) || '0', 10);
      localStorage.setItem(HITS_KEY, String((Number.isFinite(n) ? n : 0) + 1));
    } catch (e) {}
  }

  function readChecks() {
    const all = readJson(CHECKS_KEY, {});
    return all && typeof all === 'object' ? all : {};
  }

  function setCheck(questId, step, on) {
    const all = readChecks();
    const row = all[questId] && typeof all[questId] === 'object' ? all[questId] : {};
    if (on) row[step] = 1; else delete row[step];
    all[questId] = row;
    writeJson(CHECKS_KEY, all);
  }

  function characterIds() {
    const h = H();
    if (!h || !h.CHARS) return [];
    return Object.keys(h.CHARS).filter(id => id !== 'trail_p');
  }

  function mapIds() {
    const h = H();
    return h && h.MAPS ? Object.keys(h.MAPS) : [];
  }

  function docIds() {
    const h = H();
    return h && h.DOCS ? Object.keys(h.DOCS) : [];
  }

  function questIds() {
    const h = H();
    if (!h) return [];
    const trail = (h.TRAIL_MISSIONS || []).map(m => m.id);
    const side = Object.keys(h.QUESTS || {});
    return [...new Set([...trail, ...side])];
  }

  function coneIds() {
    const h = H();
    return h && h.CONES ? Object.keys(h.CONES) : [];
  }

  function coneArticle(id) {
    const d = D();
    return d && d.cones && d.cones[id] ? d.cones[id] : null;
  }

  function charName(id) {
    const h = H();
    return h && h.CHARS && h.CHARS[id] ? h.CHARS[id].name : String(id);
  }

  function charGroups() {
    const all = characterIds();
    const used = new Set();
    const out = [];
    for (const [key, title, ids] of CHAR_GROUPS) {
      const list = ids ? ids.filter(id => all.includes(id) && !used.has(id)) : all.filter(id => !used.has(id));
      list.forEach(id => used.add(id));
      if (list.length) out.push({ key, title, ids: list });
    }
    return out;
  }

  function sectorOf(id) {
    const s = SECTORS.find(([p]) => id.startsWith(p));
    return s ? s[1] : 'Астральный сектор';
  }

  function resolveWikiTarget(target) {
    const t = String(target || '').trim();
    const [prefix, rest] = t.includes(':') ? t.split(':', 2) : ['', t];
    const h = H(), d = D();
    if (prefix === 'char' && h && h.CHARS[rest]) return `${HOST}/char?id=${rest}`;
    if ((prefix === 'loc' || prefix === 'atlas') && h && h.MAPS[rest]) return `${HOST}/atlas?map=${rest}`;
    if (prefix === 'fac' && d && d.factions.some(f => f.id === rest)) return `${HOST}/faction?id=${rest}`;
    if (prefix === 'world' && d && d.worlds.some(w => w.id === rest)) return `${HOST}/world?id=${rest}`;
    if (prefix === 'sys' && d && d.systems.some(s => s.id === rest)) return `${HOST}/system?id=${rest}`;
    if (prefix === 'theme') return `${HOST}/theme?id=${rest}`;
    if (prefix === 'quest') return `${HOST}/quest?id=${rest}`;
    if (prefix === 'puz' && d && d.puzzles.some(p => p.id === rest)) return `${HOST}/puzzle?id=${rest}`;
    if (prefix === 'doc' && h && h.DOCS && h.DOCS[rest]) return `${HOST}/doc?id=${rest}`;
    if (prefix === 'cone' && h && h.CONES && h.CONES[rest]) return `${HOST}/cone?id=${rest}`;
    if (prefix === 'outfit' && h && h.OUTFITS && h.OUTFITS[rest]) return `${HOST}/outfit?id=${rest}`;
    if (prefix === 'pet' && h && h.PETS && h.PETS[rest]) return `${HOST}/pet?id=${rest}`;
    const low = t.toLowerCase();
    for (const id of characterIds()) {
      const c = h.CHARS[id];
      if (id === low || c.name.toLowerCase() === low || (c.fullName && c.fullName.toLowerCase() === low)) {
        return `${HOST}/char?id=${id}`;
      }
    }
    for (const id of mapIds()) {
      if (id === low || h.MAPS[id].name.toLowerCase() === low) return `${HOST}/atlas?map=${id}`;
    }
    for (const id of coneIds()) {
      if (normText(h.CONES[id].name).toLowerCase() === normText(low)) return `${HOST}/cone?id=${id}`;
    }
    return `${HOST}/search?q=${encodeURIComponent(t)}`;
  }

  function pageLabel(pageId) {
    const h = H(), d = D();
    const [prefix, rest] = String(pageId).includes(':') ? String(pageId).split(':', 2) : ['', pageId];
    if (prefix === 'char' && h.CHARS[rest]) return charName(rest);
    if (prefix === 'atlas' && h.MAPS[rest]) return h.MAPS[rest].name;
    if (prefix === 'doc' && h.DOCS[rest]) return h.DOCS[rest].title;
    if (prefix === 'cone' && h.CONES[rest]) return `«${h.CONES[rest].name}»`;
    if (prefix === 'outfit' && h.OUTFITS && h.OUTFITS[rest]) return `Наряд «${h.OUTFITS[rest].name}»`;
    if (prefix === 'pet' && h.PETS && h.PETS[rest]) return `Питомец ${h.PETS[rest].name}`;
    if (prefix === 'sys') { const s = d.systems.find(x => x.id === rest); if (s) return s.title; }
    if (prefix === 'fac') { const f = d.factions.find(x => x.id === rest); if (f) return f.name; }
    if (prefix === 'world') { const w = d.worlds.find(x => x.id === rest); if (w) return w.name; }
    if (prefix === 'puz') { const p = d.puzzles.find(x => x.id === rest); if (p) return p.title; }
    if (prefix === 'theme') return themeTitle(rest);
    if (prefix === 'quest') return questTitle(rest);
    const st = STATIONS.find(s => s[0] === pageId);
    return st ? st[2] : String(pageId);
  }

  function pageUrl(pageId) {
    const st = STATIONS.find(s => s[0] === pageId);
    if (st) return HOST + st[1];
    return resolveWikiTarget(pageId);
  }

  function formatWikiText(raw) {
    const h = H();
    const safe = esc(raw);
    const linked = safe.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
      const url = resolveWikiTarget(target);
      const text = label || (target.includes(':') ? target.split(':')[1] : target);
      return A(url, text);
    });
    const coded = linked.replace(/`([^`]+)`/g, (_, code) => {
      if (h && h.MAPS && h.MAPS[code]) return A(`${HOST}/atlas?map=${code}`, `<span class="hwk-mono">${code}</span>`);
      return `<span class="hwk-mono">${code}</span>`;
    });
    return coded.replace(/\n/g, '<br>');
  }

  function spoilerBlock(id, title, innerHtml) {
    const open = spoilersOpen();
    return `<div class="hwk-spoiler" data-aw-spoiler-box="${esc(id)}">
      <div class="hwk-spoiler-head">
        Сюжетный архив: ${esc(title)}
        <button type="button" class="hwk-btn" data-aw-spoiler-btn="${esc(id)}">${open ? 'Скрыть' : 'Показать спойлер'}</button>
      </div>
      <div class="hwk-spoiler-body" style="display:${open ? 'block' : 'none'};">${innerHtml}</div>
    </div>`;
  }

  function deriveCharArc(id) {
    const d = D(), h = H();
    if (d && d.themes && d.themes.charArcs && d.themes.charArcs[id]) return d.themes.charArcs[id];
    const c = h && h.CHARS ? h.CHARS[id] : null;
    const inf = h && h.INFO ? h.INFO[id] : null;
    const pathName = c && h.PATHS[c.path] ? h.PATHS[c.path].name : 'Освоение';
    return {
      arcType: `Дуга Пути (${pathName})`,
      lie: `Собственное бремя в мире «${inf ? inf.home : 'Звёздного экспресса'}» приходится нести в одиночку, не полагаясь на чужаков.`,
      truth: `Союз с экипажем Звёздного экспресса позволяет обратить личный опыт (${inf ? inf.faction : pathName}) в общую защиту.`,
      ghostWound: inf && inf.story && inf.story[1] ? inf.story[1].text.split('\n')[0].slice(0, 140) : (inf ? inf.about : ''),
      keyRelation: `Спутники фракции «${inf ? inf.faction : 'Безымянные'}» и экипаж Экспресса.`
    };
  }

  function parseUrl(url) {
    const raw = String(url || HOST).trim();
    let pathPart = '/';
    let queryPart = '';
    const withoutProto = raw.replace(/^https?:\/{2}[^/?#]+/i, '');
    if (withoutProto) {
      const qIdx = withoutProto.indexOf('?');
      if (qIdx >= 0) {
        pathPart = withoutProto.slice(0, qIdx) || '/';
        queryPart = withoutProto.slice(qIdx + 1);
      } else {
        pathPart = withoutProto;
      }
    }
    pathPart = pathPart.replace(/#.*$/, '').toLowerCase().replace(/\/+$/, '') || '/';
    const params = {};
    if (queryPart) {
      for (const pair of queryPart.replace(/#.*$/, '').split('&')) {
        if (!pair) continue;
        const eq = pair.indexOf('=');
        const k = eq >= 0 ? pair.slice(0, eq) : pair;
        const v = eq >= 0 ? pair.slice(eq + 1) : '';
        try {
          params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (e) {
          params[k] = v;
        }
      }
    }
    const mode = ['edit', 'talk', 'history'].includes(params.mode) ? params.mode : 'read';
    const d = D(), h = H();

    if (pathPart === '/' || pathPart === '/index.html' || pathPart === '/main') {
      return { view: 'home', pageId: 'home', mode, params };
    }
    if (pathPart === '/systems') return { view: 'systems', pageId: 'systems', mode, params };
    if (pathPart === '/system') {
      const sys = d && d.systems.find(s => s.id === params.id);
      return sys ? { view: 'system', id: sys.id, pageId: 'sys:' + sys.id, mode, params } : { view: 'missing', raw, params };
    }
    if (pathPart === '/factions') return { view: 'factions', pageId: 'factions', mode, params };
    if (pathPart === '/faction') {
      const fac = d && d.factions.find(f => f.id === params.id);
      return fac ? { view: 'faction', id: fac.id, pageId: 'fac:' + fac.id, mode, params } : { view: 'missing', raw, params };
    }
    if (pathPart === '/world') {
      const w = d && d.worlds.find(x => x.id === params.id);
      return w ? { view: 'world', id: w.id, pageId: 'world:' + w.id, mode, params } : { view: 'missing', raw, params };
    }
    if (pathPart === '/atlas') {
      if (params.map) {
        return h && h.MAPS && h.MAPS[params.map]
          ? { view: 'map', id: params.map, pageId: 'atlas:' + params.map, mode, params }
          : { view: 'missing', raw, params };
      }
      return { view: 'atlas', pageId: 'atlas', mode, params };
    }
    if (pathPart === '/doc') {
      return h && h.DOCS && h.DOCS[params.id]
        ? { view: 'doc', id: params.id, pageId: 'doc:' + params.id, mode, params }
        : { view: 'missing', raw, params };
    }
    if (pathPart === '/chars') return { view: 'chars', pageId: 'chars', mode, params };
    if (pathPart === '/char') {
      const id = params.id === 'trail_p' ? 'trail' : params.id;
      return h && h.CHARS && h.CHARS[id]
        ? { view: 'char', id, pageId: 'char:' + id, mode, params }
        : { view: 'missing', raw, params };
    }
    if (pathPart === '/themes') return { view: 'themes', pageId: 'themes', mode, params };
    if (pathPart === '/theme') {
      const id = params.id || '';
      const ci = d && d.themes.controllingIdeas.find(x => x.id === id);
      const ant = d && d.themes.antagonists.find(x => x.id === id);
      const mot = d && d.themes.motifs.find(x => x.id === id);
      if (ci || ant || mot) return { view: 'theme', id, pageId: 'theme:' + id, mode, params };
      return { view: 'missing', raw, params };
    }
    if (pathPart === '/quests') return { view: 'quests', pageId: 'quests', mode, params };
    if (pathPart === '/quest') {
      const id = params.id || '';
      const tm = h && (h.TRAIL_MISSIONS || []).find(m => m.id === id);
      const q = h && h.QUESTS && h.QUESTS[id];
      return (tm || q) ? { view: 'quest', id, pageId: 'quest:' + id, mode, params } : { view: 'missing', raw, params };
    }
    if (pathPart === '/puzzle') {
      const puz = d && d.puzzles.find(p => p.id === params.id);
      return puz ? { view: 'puzzle', id: puz.id, pageId: 'puz:' + puz.id, mode, params } : { view: 'missing', raw, params };
    }
    if (pathPart === '/artifacts') return { view: 'artifacts', pageId: 'artifacts', mode, params };
    if (pathPart === '/cone') {
      return h && h.CONES && h.CONES[params.id]
        ? { view: 'cone', id: params.id, pageId: 'cone:' + params.id, mode, params }
        : { view: 'missing', raw, params };
    }
    if (pathPart === '/outfit') {
      return h && h.OUTFITS && h.OUTFITS[params.id]
        ? { view: 'outfit', id: params.id, pageId: 'outfit:' + params.id, mode, params }
        : { view: 'missing', raw, params };
    }
    if (pathPart === '/pet') {
      return h && h.PETS && h.PETS[params.id]
        ? { view: 'pet', id: params.id, pageId: 'pet:' + params.id, mode, params }
        : { view: 'missing', raw, params };
    }
    if (pathPart === '/recent') return { view: 'recent', pageId: 'recent', mode, params };
    if (pathPart === '/search') return { view: 'search', pageId: 'search', mode: 'read', params };
    return { view: 'missing', raw, params };
  }

  function basePageUrl(route) {
    switch (route.view) {
      case 'home': return HOST;
      case 'systems': return `${HOST}/systems`;
      case 'system': return `${HOST}/system?id=${route.id}`;
      case 'factions': return `${HOST}/factions`;
      case 'faction': return `${HOST}/faction?id=${route.id}`;
      case 'world': return `${HOST}/world?id=${route.id}`;
      case 'atlas': return `${HOST}/atlas`;
      case 'map': return `${HOST}/atlas?map=${route.id}`;
      case 'doc': return `${HOST}/doc?id=${route.id}`;
      case 'chars': return `${HOST}/chars`;
      case 'char': return `${HOST}/char?id=${route.id}`;
      case 'themes': return `${HOST}/themes`;
      case 'theme': return `${HOST}/theme?id=${route.id}`;
      case 'quests': return `${HOST}/quests`;
      case 'quest': return `${HOST}/quest?id=${route.id}`;
      case 'puzzle': return `${HOST}/puzzle?id=${route.id}`;
      case 'artifacts': return `${HOST}/artifacts`;
      case 'cone': return `${HOST}/cone?id=${route.id}`;
      case 'outfit': return `${HOST}/outfit?id=${route.id}`;
      case 'pet': return `${HOST}/pet?id=${route.id}`;
      case 'recent': return `${HOST}/recent`;
      case 'search': return `${HOST}/search?q=${encodeURIComponent(route.params.q || '')}`;
      default: return HOST;
    }
  }

  function modeUrl(route, mode) {
    const base = basePageUrl(route);
    if (mode === 'read') return base;
    return base.includes('?') ? `${base}&mode=${mode}` : `${base}?mode=${mode}`;
  }

  function themeTitle(id) {
    const t = D().themes;
    const ci = t.controllingIdeas.find(x => x.id === id);
    if (ci) return ci.title;
    const ant = t.antagonists.find(x => x.id === id);
    if (ant) return ant.name;
    const mot = t.motifs.find(x => x.id === id);
    return mot ? mot.name : id;
  }

  function questTitle(id) {
    const h = H();
    const tm = (h.TRAIL_MISSIONS || []).find(m => m.id === id);
    const q = h.QUESTS && h.QUESTS[id];
    return (tm || q) ? (tm || q).name : id;
  }

  function getPageTitle(url) {
    const r = parseUrl(url);
    const h = H(), d = D();
    switch (r.view) {
      case 'home': return 'АстралВики 98: Свободная энциклопедия Honkai: Star Rail 98';
      case 'systems': return 'Космология, Эоны и Системы - АстралВики 98';
      case 'system': return `${d.systems.find(x => x.id === r.id).title} - АстралВики 98`;
      case 'factions': return 'Фракции, Миры и Бортовой архив - АстралВики 98';
      case 'faction': return `${d.factions.find(x => x.id === r.id).name} - АстралВики 98`;
      case 'world': return `${d.worlds.find(x => x.id === r.id).name} - АстралВики 98`;
      case 'atlas': return `Атлас локаций и Читальный зал (${mapIds().length} карт и ${docIds().length} документа) - АстралВики 98`;
      case 'map': return `Карта: ${h.MAPS[r.id].name} - АстралВики 98`;
      case 'doc': return `Документ: ${h.DOCS[r.id].title} - АстралВики 98`;
      case 'chars': return `Архив судеб: все ${characterIds().length} персонажа HSR 98 - АстралВики 98`;
      case 'char': return `${h.CHARS[r.id].fullName || h.CHARS[r.id].name}: досье и лор - АстралВики 98`;
      case 'themes': return 'Тематика, Управляющие идеи, Антагонисты и Мотивы - АстралВики 98';
      case 'theme': return `Тематический разбор: ${themeTitle(r.id)} - АстралВики 98`;
      case 'quests': return 'Полное прохождение, Квесты и Секреты - АстралВики 98';
      case 'quest': return `Миссия: ${questTitle(r.id)} - АстралВики 98`;
      case 'puzzle': return `${d.puzzles.find(x => x.id === r.id).title} - АстралВики 98`;
      case 'artifacts': return 'Реликвии, Конусы, Слияния, Наряды и Диковины - АстралВики 98';
      case 'cone': return `Световой конус «${h.CONES[r.id].name}» - АстралВики 98`;
      case 'outfit': return `Наряд «${h.OUTFITS[r.id].name}» (${h.CHARS[h.OUTFITS[r.id].char].name}) - АстралВики 98`;
      case 'pet': return `Питомец ${h.PETS[r.id].name}: паспорт и привычки - АстралВики 98`;
      case 'recent': return 'Свежие правки и Алфавитный указатель - АстралВики 98';
      case 'search': return `Поиск: ${r.params.q || ''} - АстралВики 98`;
      default: return 'Страница не найдена - АстралВики 98';
    }
  }

  function readEdits() {
    return readJson(EDITS_KEY, {});
  }

  function getCustomNote(pageId) {
    const edits = readEdits();
    return edits[pageId] || null;
  }

  function saveCustomNote(pageId, author, text) {
    const cleanText = normText(text || '').trim();
    const cleanAuthor = normText(author || 'Безымянный_Гость').trim() || 'Безымянный_Гость';
    if (!cleanText) return null;
    const edits = readEdits();
    const entry = {
      pageId,
      author: cleanAuthor.slice(0, 32),
      text: cleanText.slice(0, 4000),
      date: SITE_DAY
    };
    edits[pageId] = entry;
    writeJson(EDITS_KEY, edits);
    return entry;
  }

  function clearCustomNote(pageId) {
    const edits = readEdits();
    delete edits[pageId];
    writeJson(EDITS_KEY, edits);
  }

  function readTalk(pageId) {
    const all = readJson(TALK_KEY, {});
    const userItems = Array.isArray(all[pageId]) ? all[pageId] : [];
    const seedItems = (D() && D().talkSeed && D().talkSeed[pageId]) || [];
    return [...userItems, ...seedItems];
  }

  function addTalkPost(pageId, author, text) {
    const cleanAuthor = normText(author || '').trim();
    const cleanText = normText(text || '').trim();
    if (!cleanAuthor || !cleanText) return null;
    const all = readJson(TALK_KEY, {});
    const list = Array.isArray(all[pageId]) ? all[pageId] : [];
    const post = { user: cleanAuthor.slice(0, 32), date: SITE_DAY, text: cleanText.slice(0, 1500) };
    list.unshift(post);
    all[pageId] = list;
    writeJson(TALK_KEY, all);
    return post;
  }

  function lastEdit(pageId) {
    const custom = getCustomNote(pageId);
    if (custom) return { date: custom.date, user: custom.author };
    const art = String(pageId).startsWith('cone:') ? coneArticle(String(pageId).slice(5)) : null;
    if (art && art.by) return { date: art.date, user: art.by };
    const rev = (D().revisions || []).find(r => r.page === pageId);
    return rev || BASE_REV;
  }

  function totalArticleCount() {
    const d = D();
    return characterIds().length + mapIds().length + docIds().length + questIds().length + coneIds().length + outfitIds().length + petIds().length +
      (d ? d.systems.length + d.factions.length + d.worlds.length + d.puzzles.length + d.themes.controllingIdeas.length + d.themes.antagonists.length + d.themes.motifs.length : 0);
  }

  function navSectionFor(view) {
    if (view === 'home') return 'home';
    if (view === 'systems' || view === 'system') return 'systems';
    if (view === 'factions' || view === 'faction' || view === 'world') return 'factions';
    if (view === 'atlas' || view === 'map' || view === 'doc') return 'atlas';
    if (view === 'chars' || view === 'char') return 'chars';
    if (view === 'themes' || view === 'theme') return 'themes';
    if (view === 'quests' || view === 'quest' || view === 'puzzle') return 'quests';
    if (view === 'artifacts' || view === 'cone' || view === 'outfit' || view === 'pet') return 'artifacts';
    if (view === 'recent') return 'recent';
    return '';
  }

  function head(title, from) {
    return `<h1 class="hwk-h1">${esc(title)}</h1>
      <div class="hwk-from">${from || "Материал из АстралВики '98, свободной энциклопедии по Honkai: Star Rail 98"}</div>`;
  }

  function section(id, title) {
    return `${anchorTag(id)}<h2 class="hwk-h2">${esc(title)}</h2>`;
  }

  function toc(items) {
    return `<div class="hwk-toc"><b>Содержание</b><ol>${items.map(([id, t]) => `<li>${jump(id, esc(t))}</li>`).join('')}</ol></div>`;
  }

  function jumpbar(items) {
    return `<div class="hwk-jumpbar">Перейти: ${items.map(([id, t]) => `[${jump(id, esc(t))}]`).join(' ')}</div>`;
  }

  function topLink() {
    return `<div class="hwk-top">${jump('hwk-top', '▲ наверх')}</div>`;
  }

  function rewardText(rw) {
    if (!rw || typeof rw !== 'object') return '';
    const h = H();
    const out = [];
    if (rw.credits) out.push(`${rw.credits} кредитов`);
    if (rw.jade) out.push(`${rw.jade} звёздного нефрита`);
    if (rw.relic) out.push(`реликвия x${rw.relic}`);
    if (rw.cone) out.push(`Световой конус «${h.CONES && h.CONES[rw.cone] ? h.CONES[rw.cone].name : rw.cone}»`);
    for (const [id, n] of Object.entries(rw.items || {})) {
      out.push(`${h.ITEMS && h.ITEMS[id] ? h.ITEMS[id].name : id} x${n}`);
    }
    return out.join(', ');
  }

  function mapEntities(id) {
    const h = H();
    const m = h.MAPS[id];
    const rows = m.rows || [];
    const tiles = h.TILES || {};
    const ents = [];
    const seenFoe = new Set();
    let anchorI = 0, chestI = 0;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (tiles[ch]) continue;
        const mk = m.marks ? m.marks[ch] : null;
        if (/[0-9]/.test(ch)) {
          if (seenFoe.has(ch)) continue;
          seenFoe.add(ch);
          ents.push({ kind: 'foe', x, y, ch, def: m.su ? null : (m.enemies || {})[ch] || null });
          continue;
        }
        if (mk) {
          if (mk.type === 'anchor') { ents.push({ kind: 'anchor', x, y, name: (m.anchors || [])[anchorI++] || 'Якорь' }); continue; }
          if (mk.doc) { ents.push({ kind: 'doc', x, y, ch, def: mk }); continue; }
          ents.push({ kind: mk.type, x, y, ch, def: mk });
          continue;
        }
        if (ch === 'a') ents.push({ kind: 'anchor', x, y, name: (m.anchors || [])[anchorI++] || 'Якорь' });
        else if (ch === 'c') ents.push({ kind: 'chest', x, y, def: (m.chests || [])[chestI++] || {} });
        else if (ch === 'd') ents.push({ kind: 'destr', x, y });
      }
    });
    return ents;
  }

  function mapStats(id) {
    const ents = mapEntities(id);
    const count = k => ents.filter(e => e.kind === k).length;
    const foes = ents.filter(e => e.kind === 'foe');
    return {
      ents,
      chests: count('chest'),
      docs: count('doc'),
      npcs: count('npc'),
      anchors: count('anchor'),
      exits: count('exit'),
      foes: foes.length,
      trotters: foes.filter(e => e.def && (e.def.g || []).includes('trotter')).length,
      docList: ents.filter(e => e.kind === 'doc').map(e => e.def.doc)
    };
  }

  function mapSize(m) {
    const rows = m.rows || [];
    return { w: Math.max(0, ...rows.map(r => r.length)), h: rows.length };
  }

  function spawnPoint(id) {
    const h = H();
    const m = h.MAPS[id];
    const rows = m.rows || [];
    const spawnChars = Object.keys(m.marks || {}).filter(k => m.marks[k].type === 'spawn');
    for (const want of [...spawnChars, 'a']) {
      for (let y = 0; y < rows.length; y++) {
        const x = rows[y].indexOf(want);
        if (x >= 0) return [x, y];
      }
    }
    return null;
  }

  const ASCII_SYMBOL = { chest: ['$', 'chest'], foe: ['!', 'foe'], npc: ['@', 'npc'], anchor: ['+', 'anchor'], exit: ['>', 'exit'], doc: ['?', 'doc'], spawn: ['&', 'spawn'] };

  function asciiGrid(id) {
    const h = H();
    const m = h.MAPS[id];
    const tiles = h.TILES || {};
    const rows = (m.rows || []).map(r => r.split('').map(ch => (tiles[ch] ? ch : (m.floor || '.'))));
    for (const e of mapEntities(id)) {
      if (!rows[e.y]) continue;
      rows[e.y][e.x] = ASCII_SYMBOL[e.kind] ? ASCII_SYMBOL[e.kind][0] : (e.kind === 'destr' ? '.' : 'o');
    }
    const spawn = spawnPoint(id);
    if (spawn && rows[spawn[1]]) rows[spawn[1]][spawn[0]] = '&';
    return rows;
  }

  function renderAsciiMap(m) {
    const h = H();
    const id = Object.keys(h.MAPS).find(k => h.MAPS[k] === m);
    if (!id) return (m.rows || []).join('\n');
    return asciiGrid(id).map(r => r.join('')).join('\n');
  }

  function asciiHtml(id) {
    const cls = {};
    for (const [sym, c] of Object.values(ASCII_SYMBOL)) cls[sym] = c;
    cls.o = 'other';
    return asciiGrid(id).map(r => r.map(ch => (cls[ch] ? `<span class="hwk-ma-${cls[ch]}">${esc(ch)}</span>` : esc(ch))).join('')).join('\n');
  }

  function npcLabel(mk) {
    const h = H();
    if (mk.name) return mk.name;
    if (mk.label) return mk.label;
    if (mk.who && h.CHARS[mk.who]) return h.CHARS[mk.who].name;
    if (mk.visitor != null) return 'Гость вагона (по очереди)';
    return NPC_NAMES[mk.who] || 'Житель';
  }

  function docPlaces(docId) {
    const h = H();
    return mapIds().filter(mid => Object.values(h.MAPS[mid].marks || {}).some(mk => mk.doc === docId));
  }

  function describeAbility(ab) {
    if (!ab) return 'Базовое боевое умение.';
    if (ab.desc || ab.text) return ab.desc || ab.text;
    const tMap = {
      single: 'Одиночная цель',
      blast: 'Цель и соседи',
      all: 'Все враги',
      bounce: 'Отскок по врагам',
      ally: 'Один союзник',
      allies: 'Весь отряд',
      self: 'На себя'
    };
    const parts = [tMap[ab.target] || 'Боевое действие'];
    for (const fx of (ab.fx || [])) {
      if (fx.k === 'dmg' && fx.m) {
        parts.push(`урон ${Math.round(fx.m * 100)}% АТК${fx.adj ? ` (${Math.round(fx.adj * 100)}% соседям)` : ''}`);
      } else if (fx.k === 'heal') {
        parts.push(`лечение ${Math.round((fx.m || 0.1) * 100)}% HP + ${fx.flat || 0}`);
      } else if (fx.k === 'shield') {
        parts.push(`щит ${Math.round((fx.m || 0.2) * 100)}% ЗАЩ + ${fx.flat || 0} на ${fx.turns || 2} х.`);
      } else if (fx.k === 'buff') {
        parts.push(`усиление «${fx.name || fx.s || 'Бонус'}» (${fx.turns || 2} х.)`);
      } else if (fx.k === 'debuff') {
        parts.push(`ослабление «${fx.name || fx.s || 'Эффект'}» (${fx.turns || 2} х.)`);
      } else if (fx.k === 'dot') {
        parts.push(`периодический урон (${fx.type || 'эффект'}, ${fx.turns || 2} х.)`);
      } else if (fx.k === 'freeze') {
        parts.push(`шанс заморозки ${Math.round((fx.chance || 0.5) * 100)}%`);
      } else if (fx.k === 'imprison') {
        parts.push('Заключение врагов');
      } else if (fx.k === 'cleanse') {
        parts.push('снятие ослабления');
      } else if (fx.k === 'dispel') {
        parts.push('снятие усиления с цели');
      } else if (fx.k === 'taunt') {
        parts.push('провокация врагов');
      } else if (fx.k === 'advance') {
        parts.push(`продвижение хода на ${Math.round((fx.v || 0.3) * 100)}%`);
      }
    }
    return parts.join(': ');
  }

  function describeRelicTwo(r, h) {
    if (r.short) return r.short;
    if (r.bonus && h && h.STAT_NAMES) {
      return Object.entries(r.bonus).map(([k, v]) => `${h.STAT_NAMES[k] || k} +${Math.round(v * 100)}%`).join(', ');
    }
    return 'Стандартный бонус комплекта';
  }

  function describeRelicFour(r) {
    if (r.text) return r.text;
    return r.planar ? 'Планарный комплект из 2 частей (Сфера + Вязь)' : 'Усиление профильной характеристики при полном комплекте (4 ч.)';
  }

  function renderUserAmendmentBox(pageId, route) {
    const note = getCustomNote(pageId);
    if (!note) return '';
    return `<div class="hwk-amend">
      <div class="hwk-amend-h">Пользовательское дополнение к статье (автор: ${esc(note.author)}, ${esc(note.date)})</div>
      <div class="hwk-p">${formatWikiText(note.text)}</div>
      <div class="hwk-small">${A(modeUrl(route, 'edit'), 'Изменить дополнение')} | <a href="#" data-aw-reset-page="${esc(pageId)}">Сбросить к архивной версии</a></div>
    </div>`;
  }

  function renderModeView(route, title, defaultWikiSource) {
    const pageId = route.pageId;
    if (route.mode === 'edit') {
      const existing = getCustomNote(pageId);
      const val = existing ? existing.text : defaultWikiSource;
      const usr = existing ? existing.author : playerName();
      return `${head(`Правка: ${title}`, 'Вы правите дополнение к статье. Архивный текст статьи остаётся нетронутым.')}
        <div class="hwk-form">
          <textarea class="hwk-textarea" rows="14" data-aw-edit-text>${esc(val)}</textarea>
          <p>Подпись архивиста: <input type="text" class="hwk-input" data-aw-edit-user value="${esc(usr)}" size="24"></p>
          <button type="button" class="hwk-btn hwk-btn-hi" data-aw-save-edit="${esc(pageId)}">Сохранить</button>
          <button type="button" class="hwk-btn" data-aw-reset-page="${esc(pageId)}">Сбросить к архивной версии</button>
          ${A(modeUrl(route, 'read'), 'Отменить и вернуться к статье')}
        </div>
        <table class="hwk-table hwk-help">
          <tr><th width="42%">Разметка</th><th>Что получится</th></tr>
          <tr><td class="hwk-mono">[[char:march|Март 7]]</td><td>ссылка на досье персонажа</td></tr>
          <tr class="hwk-alt"><td class="hwk-mono">[[atlas:j_belobog|Белобог]]</td><td>ссылка на карту из Атласа</td></tr>
          <tr><td class="hwk-mono">[[sys:paths_aeons|Эоны]]</td><td>ссылка на трактат о мироздании</td></tr>
          <tr class="hwk-alt"><td class="hwk-mono">[[Кафка]]</td><td>поиск по Архиву, если точной статьи нет</td></tr>
        </table>
        <p class="hwk-small">Правка хранится в вашем браузере и видна только на этом компьютере.</p>`;
    }
    if (route.mode === 'talk') {
      const posts = readTalk(pageId);
      return `${head(`Обсуждение: ${title}`, `Страница обсуждения статьи. Реплик: ${posts.length}.`)}
        ${posts.length ? posts.map(p => `<table class="hwk-talk"><tr>
          <td class="hwk-talk-who"><b>${esc(p.user)}</b><br>${esc(p.date)}</td>
          <td>${formatWikiText(p.text)}</td>
        </tr></table>`).join('') : '<p class="hwk-p">Здесь пока никто не писал. Начните обсуждение первым.</p>'}
        ${anchorTag('hwk-reply')}<h2 class="hwk-h2">Добавить реплику</h2>
        <div class="hwk-form">
          <p>Ваш позывной: <input type="text" class="hwk-input" data-aw-talk-user value="${esc(playerName())}" size="26"></p>
          <textarea class="hwk-textarea" rows="5" data-aw-talk-text></textarea>
          <p><button type="button" class="hwk-btn hwk-btn-hi" data-aw-talk-send="${esc(pageId)}">Отправить реплику</button></p>
        </div>`;
    }
    if (route.mode === 'history') {
      const custom = getCustomNote(pageId);
      const seeded = (D().revisions || []).filter(r => r.page === pageId);
      return `${head(`История правок: ${title}`, 'Все версии этой страницы, от новых к старым.')}
        <ul class="hwk-rc">
          ${custom ? `<li><b>${esc(custom.date)}</b> . . <b>${esc(custom.author)}</b> . . пользовательское дополнение (${custom.text.length} симв.), хранится в вашем браузере</li>` : ''}
          ${seeded.map(r => `<li><span class="hwk-mono">${esc(r.rev)}</span> <b>${esc(r.date)}</b> . . ${esc(r.user)} . . <i>${esc(r.note)}</i></li>`).join('')}
          <li><span class="hwk-mono">${BASE_REV.rev}</span> <b>${BASE_REV.date}</b> . . ${BASE_REV.user} . . <i>${BASE_REV.note}</i></li>
        </ul>
        <p class="hwk-small">${A(modeUrl(route, 'read'), '&lt;&lt; Вернуться к статье')}</p>`;
    }
    return '';
  }

  function renderSaveSyncBox() {
    const sv = readSave();
    const h = H();
    const gm = globalThis.gameManager;
    const installed = gm && typeof gm.isInstalled === 'function' && gm.isInstalled('hsr98');
    const play = installed
      ? '<button type="button" class="hwk-btn hwk-btn-hi" data-aw-launch="1">Запустить игру</button>'
      : `${A('http://hsr.hoyoverse.com/download', 'Скачать с hsr.hoyoverse.com', 'hwk-btn hwk-btn-hi')} <button type="button" class="hwk-btn" data-aw-steam="hsr98">Открыть в Steam</button>`;
    if (!sv) {
      return `<div class="hwk-panel hwk-sync">
        <div class="hwk-panel-h">Бортовой журнал STARRAIL.EXE</div>
        <div class="hwk-panel-b">
          Сохранение игры на этом компьютере не найдено. Игра бесплатна.
          <div style="margin-top:5px;">${play}</div>
        </div>
      </div>`;
    }
    const charsOwned = Object.keys(sv.chars || {}).filter(k => k !== 'trail_p').length;
    const chestsFound = Object.keys(sv.chests || {}).length;
    const questsDone = Object.values(sv.quests || {}).filter(v => v === 2).length;
    return `<div class="hwk-panel hwk-sync">
      <div class="hwk-panel-h">Бортовой журнал синхронизирован: ${esc(sv.name || 'Первопроходец')}</div>
      <div class="hwk-panel-b">
        Уровень Освоения: <b>${esc(sv.tl || 1)} / ${h.TL_MAX || 70}</b><br>
        Спутников в отряде: <b>${charsOwned}</b> из ${characterIds().length}<br>
        Миссий закрыто: <b>${questsDone}</b><br>
        Сундуков открыто: <b>${chestsFound}</b>
        <div style="margin-top:5px;">${installed ? '<button type="button" class="hwk-btn hwk-btn-hi" data-aw-launch="1">В игру</button>' : '<button type="button" class="hwk-btn" data-aw-steam="hsr98">В Steam</button>'}</div>
      </div>
    </div>`;
  }

  function didYouKnow() {
    const h = H();
    const out = [];
    const rate = h.RATE && h.RATE.silverwolf;
    if (rate && rate[0] != null) out.push(`...Оценивающий пистолет на станции «Герта» выдаёт ${A(`${HOST}/char?id=silverwolf`, 'Серебряному Волку')} ${rate[0]} баллов? ${A(`${HOST}/puzzle?id=puz_appraisal`, 'Вся таблица показаний')}.`);
    const rumor = (h.RUMORS || [])[0];
    if (rumor) out.push(`...слух «${esc(rumor.title)}» у Сампо стоит ${rumor.cost} кредитов и меняет товар в магазине? ${A(`${HOST}/quests`, 'Прейскурант слухов')}.`);
    const guest = (h.GUESTS || []).find(g => g[1] === 'Герта');
    if (guest) out.push(`...${esc(guest[1])} оставила в Гостевой книге Экспресса запись «${esc(guest[2])}»? ${A(`${HOST}/factions`, 'Вся книга')}.`);
    const lib = docIds().length;
    out.push(`...в игре можно прочитать ${lib} записок, книг и экранов, и все они собраны в нашем ${A(`${HOST}/atlas`, 'Читальном зале')}?`);
    return out;
  }

  function renderHome(route) {
    const h = H(), d = D();
    const total = totalArticleCount();
    const revs = d.revisions.slice(0, 5);
    return `
      <table class="hwk-cols"><tr>
        <td>
          <div class="hwk-welcome">
            <div class="hwk-welcome-h">Добро пожаловать в АстралВики '98!</div>
            <p class="hwk-p">Мы собираем всё, что известно о мире <b>Honkai: Star Rail 98</b> (версия 1.6): устройство Вселенной, фракции и миры, судьбы ${characterIds().length} персонажей, ${mapIds().length} карт с отметками сундуков и записок, тексты всех ${docIds().length} документов и решения загадок. Любой читатель может дополнить статью или оставить реплику в обсуждении.</p>
            <p class="hwk-small">Сейчас в Архиве <b>${total}</b> статей. Официальный сайт игры: ${A('http://hsr.hoyoverse.com', 'hsr.hoyoverse.com')}. Замеры урона и сборки: ${A('http://www.kovcheg98.ru/hsr98/', '«Ковчег»')}.</p>
          </div>

          <div class="hwk-feature">
            <div class="hwk-feature-h">Избранная статья: Великая ложь Белобога</div>
            <div class="hwk-feature-b">
              <table class="hwk-cols"><tr>
                <td width="80">${art('foe:cocolia', 72, 72)}</td>
                <td>
                  <p class="hwk-p">Семьсот лет назад первая хранительница Алиса Рэнд просила Стелларон защитить последний город Ярило-VI от Легиона Антиматерии. Ответом стала Вечная мерзлота. Восемнадцать поколений правителей скрывали, что стужа и Фрагментум приходят из одного источника, пока ${A(`${HOST}/theme?id=ci_belobog`, 'спор спасительной лжи Коколии и открытой солидарности Брони и Зеле')} не решился у Двигателя созидания.</p>
                  <div class="hwk-small">${A(`${HOST}/theme?id=ci_belobog`, 'Читать разбор главы')} | ${A(`${HOST}/world?id=w_belobog_over`, 'Хронология Надмирья')} | ${A(`${HOST}/world?id=w_belobog_under`, 'Быт Подземья')}</div>
                </td>
              </tr></table>
            </div>
          </div>

          <h2 class="hwk-h2">Знаете ли вы, что...</h2>
          <ul class="hwk-dyk">${didYouKnow().map(x => `<li>${x}</li>`).join('')}</ul>

          <h2 class="hwk-h2">С чего начать</h2>
          <table class="hwk-table">
            <tr><th width="34%">Если вы хотите</th><th>Откройте</th></tr>
            <tr><td>понять, кто такие Эоны и что такое Стелларон</td><td>${A(`${HOST}/system?id=paths_aeons`, 'Эоны и Пути')}, ${A(`${HOST}/system?id=stellaron_fragmentum`, 'Стеллароны и Фрагментум')}</td></tr>
            <tr class="hwk-alt"><td>прочитать биографию героя</td><td>${A(`${HOST}/chars`, 'Персонажи')}: все ${characterIds().length} досье с историями и репликами</td></tr>
            <tr><td>найти сундук или записку на карте</td><td>${A(`${HOST}/atlas`, 'Атлас')}: ${mapIds().length} карт по секторам</td></tr>
            <tr class="hwk-alt"><td>пройти застрявшую миссию</td><td>${A(`${HOST}/quests`, 'Прохождение')}: главы, поручения и ${d.puzzles.length} загадок</td></tr>
            <tr><td>разобраться, о чём сюжет</td><td>${A(`${HOST}/themes`, 'Темы и мотивы')}: тезис главы против довода антагониста</td></tr>
            <tr class="hwk-alt"><td>выбрать Световой конус или реликвии</td><td>${A(`${HOST}/artifacts`, 'Предметы')}: ${Object.keys(h.CONES || {}).length} конусов, ${Object.keys(h.RELIC_SETS || {}).length} наборов реликвий</td></tr>
          </table>
        </td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          ${renderSaveSyncBox()}
          <div class="hwk-panel">
            <div class="hwk-panel-h">Свежие правки</div>
            <div class="hwk-panel-b">
              ${revs.map(r => `<div style="margin-bottom:4px;"><b>${esc(r.date.split(' ')[0])}</b> ${A(pageUrl(r.page), esc(pageLabel(r.page)))} <span class="hwk-dim">(${esc(r.user)})</span></div>`).join('')}
              <div>${A(`${HOST}/recent`, 'Все правки &gt;&gt;')}</div>
            </div>
          </div>
          <div class="hwk-panel">
            <div class="hwk-panel-h">Персонажи по мирам</div>
            <div class="hwk-panel-b">
              ${charGroups().map(g => `<b>${esc(g.title)}:</b> ${g.ids.map(id => A(`${HOST}/char?id=${id}`, esc(charName(id)))).join(', ')}`).join('<br>')}
            </div>
          </div>
          <div class="hwk-panel">
            <div class="hwk-panel-h">О сайте</div>
            <div class="hwk-panel-b">
              Движок: UseModWiki 0.94 (Perl 5.005)<br>
              Кодировка: Win-1251<br>
              Кураторы: Archivist_Dan, Serval_Rock99, Pela_Protocol, Welt_Mecha<br>
              Вы посетитель номер <span class="hwk-counter">${visits()}</span>
            </div>
          </div>
        </td>
      </tr></table>
      ${renderUserAmendmentBox('home', route)}`;
  }

  function renderSystemsHub(route) {
    const d = D(), h = H();
    const suPaths = h && h.SU && h.SU.PATHS ? Object.entries(h.SU.PATHS) : [];
    const blessings = (h && h.SU && h.SU.BLESSINGS) || [];
    const curios = (h && h.SU && h.SU.CURIOS) || [];
    return `
      ${head('Космология, Эоны и Системы мироздания')}
      <p class="hwk-lead">Трактаты Архива об устройстве Вселенной: Пути и Эоны, Стеллароны, Серебряная колея, сдвиги частот между мирами, Световые конусы. Ниже собран полный справочник Виртуальной вселенной.</p>
      <h2 class="hwk-h2">Трактаты</h2>
      <table class="hwk-tract">
        ${d.systems.map(s => `<tr>
          <td width="44">${art(s.art, 36, 36)}</td>
          <td><b>${A(`${HOST}/system?id=${s.id}`, esc(s.title))}</b><br><span class="hwk-small">${esc(s.summary)}</span></td>
          <td class="hwk-tract-d">${esc(s.cat)}<br>${esc(s.updated)}<br>${esc(s.author)}</td>
        </tr>`).join('')}
      </table>

      ${section('su', 'Справочник Виртуальной вселенной')}
      ${jumpbar([['su-paths', 'Пути'], ['su-bless', `Благословения (${blessings.length})`], ['su-curios', `Диковины (${curios.length})`]])}
      ${anchorTag('su-paths')}<h3 class="hwk-h3">Пути симуляции и их Резонанс</h3>
      <table class="hwk-table">
        <tr><th>Путь</th><th>Эон</th><th>Базовое усиление</th><th>Резонанс Пути (от 3 благословений)</th></tr>
        ${suPaths.map(([, p], i) => `<tr${alt(i)}><td><b>${esc(p.name)}</b></td><td>${esc(p.aeon)}</td><td>${esc(p.buffText)}</td><td>${esc(p.res)}</td></tr>`).join('')}
      </table>
      ${anchorTag('su-bless')}<h3 class="hwk-h3">Благословения по Путям</h3>
      <div class="hwk-small" style="margin-bottom:6px;">${suPaths.map(([k, p]) => `[${jump(`su-b-${k}`, esc(p.name))}]`).join(' ')}</div>
      ${suPaths.map(([k, p]) => {
        const list = blessings.filter(b => b.path === k);
        if (!list.length) return '';
        return `${anchorTag(`su-b-${k}`)}<table class="hwk-table">
          <tr><th colspan="3">${esc(p.name)}: ${list.length} благословений</th></tr>
          <tr><th width="28%">Благословение</th><th>Базовый эффект</th><th>Усиленный эффект</th></tr>
          ${list.map((b, i) => `<tr${alt(i)}><td><b>${esc(b.name)}</b> ${stars(b.rar + 2)}</td><td>${esc(b.text[0])}</td><td>${esc(b.text[1] || b.text[0])}</td></tr>`).join('')}
        </table>`;
      }).join('')}
      ${topLink()}
      ${anchorTag('su-curios')}<h3 class="hwk-h3">Диковины симуляции</h3>
      <table class="hwk-table">
        <tr><th width="30%">Диковина</th><th>Свойство</th></tr>
        ${curios.map((c, i) => `<tr${alt(i)}><td><b>${esc(c.name)}</b></td><td>${esc(c.text)}</td></tr>`).join('')}
      </table>
      ${renderUserAmendmentBox('systems', route)}`;
  }

  function storyHtml(text) {
    return String(text || '').split('\n').map(line => (line.startsWith('#') ? `<b>${esc(line.slice(1).trim())}</b>` : esc(line))).join('<br>');
  }

  function treatiseBody(paragraphs) {
    return paragraphs.map((p, i) => {
      const html = formatWikiText(p);
      if (i > 0) return `<p>${html}</p>`;
      const m = html.match(/^([А-ЯЁA-Z])/);
      return m ? `<p class="hwk-first"><span class="hwk-drop">${m[1]}</span>${html.slice(1)}</p>` : `<p class="hwk-first">${html}</p>`;
    }).join('');
  }

  function renderSystemArticle(route) {
    const d = D();
    const s = d.systems.find(x => x.id === route.id);
    return `
      ${head(s.title)}
      <table class="hwk-cols"><tr>
        <td class="hwk-treatise">${treatiseBody(s.body)}</td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">${esc(s.title)}</th></tr>
            <tr><td colspan="2" class="hwk-pic">${art(s.art, 96, 96)}</td></tr>
            <tr><td class="hwk-k">Раздел</td><td>${esc(s.cat)}</td></tr>
            <tr><td class="hwk-k">Куратор</td><td>${esc(s.author)}</td></tr>
            <tr><td class="hwk-k">Редакция</td><td>${esc(s.updated)}</td></tr>
          </table>
          <div class="hwk-panel">
            <div class="hwk-panel-h">Другие трактаты</div>
            <div class="hwk-panel-b"><ul>${d.systems.filter(x => x.id !== s.id).map(x => `<li>${A(`${HOST}/system?id=${x.id}`, esc(x.title.split(':')[0]))}</li>`).join('')}</ul></div>
          </div>
        </td>
      </tr></table>
      <h2 class="hwk-h2">${esc(s.tableTitle)}</h2>
      <table class="hwk-table">
        <tr>${s.tableHeaders.map(th => `<th>${esc(th)}</th>`).join('')}</tr>
        ${s.tableRows.map((row, i) => `<tr${alt(i)}>${row.map((cell, j) => `<td>${j === 0 ? `<b>${formatWikiText(cell)}</b>` : formatWikiText(cell)}</td>`).join('')}</tr>`).join('')}
      </table>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderFactionsHub(route) {
    const d = D(), h = H();
    const guests = (h && h.GUESTS) || [];
    const photos = (h && h.PHOTOS) || [];
    const records = (h && h.RECORDS) || [];
    const photoRows = [];
    for (let i = 0; i < photos.length; i += 3) photoRows.push(photos.slice(i, i + 3));
    return `
      ${head('Фракции, миры и бортовой архив Экспресса')}
      ${jumpbar([['f-fac', 'Фракции'], ['f-worlds', 'Миры'], ['f-guest', 'Гостевая книга'], ['f-photo', 'Фотостена'], ['f-rec', 'Фонотека']])}
      ${section('f-fac', `Фракции и ордена (${d.factions.length})`)}
      <table class="hwk-table">
        ${d.factions.map((f, i) => `<tr${alt(i)}>
          <td width="52" align="center">${art(`fig:${f.members[0] || 'trail'}`, 44, 44)}</td>
          <td><b>${A(`${HOST}/faction?id=${f.id}`, esc(f.name))}</b><br>${esc(f.goal)}</td>
          <td width="34%" class="hwk-small">База: ${esc(f.world)}<br>Путь: ${esc(f.path)}<br>Во главе: ${esc(f.leader)}</td>
        </tr>`).join('')}
      </table>

      ${section('f-worlds', `Миры и уклад (${d.worlds.length})`)}
      <table class="hwk-table">
        <tr><th width="24%">Мир</th><th width="18%">Деньги</th><th>Обычаи</th><th width="26%">Табу</th></tr>
        ${d.worlds.map((w, i) => `<tr${alt(i)}>
          <td><b>${A(`${HOST}/world?id=${w.id}`, esc(w.name))}</b></td>
          <td>${esc(w.currency)}</td>
          <td>${esc(w.customs)}</td>
          <td>${esc(w.taboos)}</td>
        </tr>`).join('')}
      </table>
      ${topLink()}

      ${section('f-guest', `Гостевая книга Звёздного экспресса (${guests.length})`)}
      <p class="hwk-small">Записи из книги Пом-Пом в Общем вагоне. Каждая появляется в игре после определённого события; код события указан справа.</p>
      ${guests.map((g, i) => `<div class="hwk-guest">
        <div class="hwk-guest-h">Запись ${i + 1}: <b>${esc(g[1])}</b> <span style="float:right;" class="hwk-mono">${esc(g[0])}</span></div>
        <div class="hwk-guest-b">${esc(g[2])}</div>
      </div>`).join('')}
      ${topLink()}

      ${section('f-photo', `Фотостена в каюте Март 7 (${photos.length})`)}
      <table class="hwk-photos">
        ${photoRows.map(row => `<tr>${row.map(p => `<td>
          <div class="hwk-photo-cast">${(p[3] || []).map(cid => (h.CHARS[cid] ? art(`fig:${cid}`, 32, 32) : '')).join(' ')}</div>
          ${esc(p[2])}<br>
          <span class="hwk-small">В кадре: ${(p[3] || []).map(cid => (h.CHARS[cid] ? A(`${HOST}/char?id=${cid}`, esc(h.CHARS[cid].name)) : esc(cid))).join(', ')}</span>
        </td>`).join('')}${'<td class="hwk-empty"></td>'.repeat(3 - row.length)}</tr>`).join('')}
      </table>

      ${section('f-rec', `Фонотека фонографа (${records.length})`)}
      <div class="hwk-playlist">
        ${records.map((rec, i) => `<div>${String(i + 1).padStart(2, '0')}. ${esc(rec.name || rec.track)} <span>${esc(rec.text || '')}</span></div>`).join('')}
      </div>
      ${renderUserAmendmentBox('factions', route)}`;
  }

  function renderFactionArticle(route) {
    const f = D().factions.find(x => x.id === route.id);
    const h = H();
    const members = f.members.filter(cid => h.CHARS[cid]);
    return `
      ${head(`Фракция: ${f.name}`)}
      <table class="hwk-cols"><tr>
        <td>
          <p class="hwk-lead">${formatWikiText(f.body)}</p>
          <table class="hwk-table">
            <tr><td width="24%"><b>Цели</b></td><td>${esc(f.goal)}</td></tr>
            <tr class="hwk-alt"><td><b>Ресурсы и опора</b></td><td>${esc(f.resources)}</td></tr>
            <tr><td><b>Методы</b></td><td>${esc(f.methods)}</td></tr>
            <tr class="hwk-alt"><td><b>Отношения с другими</b></td><td>${esc(f.relations)}</td></tr>
          </table>
        </td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">${esc(f.name)}</th></tr>
            <tr><td colspan="2" class="hwk-pic">${art(`fig:${f.members[0] || 'trail'}`, 96, 96)}</td></tr>
            <tr><td class="hwk-k">База</td><td>${esc(f.world)}</td></tr>
            <tr><td class="hwk-k">Путь</td><td>${esc(f.path)}</td></tr>
            <tr><td class="hwk-k">Во главе</td><td>${esc(f.leader)}</td></tr>
          </table>
        </td>
      </tr></table>
      ${members.length ? `<h2 class="hwk-h2">Представители в игре</h2>${galleryTable(members)}` : ''}
      <p class="hwk-small">${A(`${HOST}/factions`, '&lt;&lt; Все фракции и миры')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderWorldArticle(route) {
    const w = D().worlds.find(x => x.id === route.id);
    const h = H();
    return `
      ${head(`Мир и уклад: ${w.name}`)}
      <table class="hwk-cols"><tr>
        <td><p class="hwk-lead">${formatWikiText(w.body)}</p></td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">Паспорт мира</th></tr>
            <tr><td class="hwk-k">Регион</td><td>${esc(w.region)}</td></tr>
            <tr><td class="hwk-k">Деньги</td><td>${esc(w.currency)}</td></tr>
            <tr><td class="hwk-k">Иерархия</td><td>${esc(w.hierarchy)}</td></tr>
          </table>
        </td>
      </tr></table>
      ${w.maps.some(mid => h.MAPS[mid]) ? `<h2 class="hwk-h2">Карты в Атласе</h2>
        <table class="hwk-gallery"><tr>${w.maps.filter(mid => h.MAPS[mid]).slice(0, 5).map(mid => `<td>${A(`${HOST}/atlas?map=${mid}`, `<canvas class="hwk-canvas" width="96" height="64" data-aw-map="${esc(mid)}"></canvas>`)}<span class="hwk-gname">${A(`${HOST}/atlas?map=${mid}`, esc(h.MAPS[mid].name))}</span></td>`).join('')}</tr></table>
        ${w.maps.filter(mid => h.MAPS[mid]).length > 5 ? `<p class="hwk-small">Ещё: ${w.maps.filter(mid => h.MAPS[mid]).slice(5).map(mid => A(`${HOST}/atlas?map=${mid}`, esc(h.MAPS[mid].name))).join(', ')}</p>` : ''}` : ''}
      <h2 class="hwk-h2">Обычаи и запреты</h2>
      <table class="hwk-table">
        <tr><th width="50%">Как здесь живут</th><th>Чего здесь не делают</th></tr>
        <tr><td>${esc(w.customs)}</td><td>${esc(w.taboos)}</td></tr>
      </table>
      <h2 class="hwk-h2">Хронология</h2>
      <table class="hwk-timeline">
        ${w.timeline.map(row => `<tr><td class="hwk-tl-era">${esc(row[0])}</td><td class="hwk-tl-dot">■</td><td class="hwk-tl-text">${esc(row[1])}</td></tr>`).join('')}
      </table>
      <p class="hwk-small">${A(`${HOST}/factions`, '&lt;&lt; Все фракции и миры')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderAtlasHub(route) {
    const h = H();
    const mIds = mapIds();
    const dIds = docIds();
    const sectors = SECTORS.map(([prefix, title, short]) => ({ prefix, title, short, ids: mIds.filter(id => id.startsWith(prefix)) })).filter(s => s.ids.length);
    const rest = mIds.filter(id => !SECTORS.some(([p]) => id.startsWith(p)));
    if (rest.length) sectors.push({ prefix: 'x', title: 'Прочие сектора', short: 'Прочее', ids: rest });
    const shelf = {};
    return `
      ${head(`Атлас локаций и Читальный зал`)}
      <p class="hwk-lead">Все ${mIds.length} карт игры по секторам: размер в клетках, сундуки, записки, Пространственные якоря, жители и вражеские патрули. Во второй части собраны полные тексты ${dIds.length} документов, которые можно прочитать в игре.</p>
      ${jumpbar([...sectors.map((s, i) => [`at-s${i}`, s.short]), ['at-lib', 'Читальный зал']])}
      ${sectors.map((s, i) => `${anchorTag(`at-s${i}`)}<div class="hwk-group-h">${esc(s.title)} <span>(${s.ids.length})</span></div>
        <table class="hwk-table">
          <tr><th width="70">Схема</th><th>Локация</th><th>Клеток</th><th>Сундуки</th><th>Записки</th><th>Якоря</th><th>Жители / патрули</th></tr>
          ${s.ids.map((id, j) => {
            const m = h.MAPS[id];
            const st = mapStats(id);
            const sz = mapSize(m);
            return `<tr${alt(j)}>
              <td><canvas class="hwk-canvas" width="64" height="40" data-aw-map="${esc(id)}"></canvas></td>
              <td><b>${A(`${HOST}/atlas?map=${id}`, esc(m.name))}</b><br><span class="hwk-mono hwk-dim">${esc(id)}</span></td>
              <td class="hwk-num">${sz.w}x${sz.h}</td>
              <td class="hwk-num">${st.chests}</td>
              <td class="hwk-num">${st.docs}</td>
              <td class="hwk-num">${st.anchors}</td>
              <td class="hwk-num">${st.npcs} / ${st.foes}</td>
            </tr>`;
          }).join('')}
        </table>`).join('')}
      ${topLink()}

      ${section('at-lib', `Читальный зал (${dIds.length})`)}
      <p class="hwk-small">Каждому документу присвоен библиотечный шифр: буква раздела и номер на полке.</p>
      ${DOC_KINDS.map(([kind, title, letter]) => {
        const ids = dIds.filter(id => (h.DOCS[id].kind || 'paper') === kind);
        if (!ids.length) return '';
        return `<div class="hwk-group-h">${esc(title)} <span>(${ids.length})</span></div>
          <table class="hwk-table">
            <tr><th width="60">Шифр</th><th>Документ</th><th width="34%">Где найти</th></tr>
            ${ids.map((id, j) => {
              shelf[kind] = (shelf[kind] || 0) + 1;
              const doc = h.DOCS[id];
              const places = docPlaces(id);
              return `<tr${alt(j)}>
                <td class="hwk-shelf">${letter}-${String(shelf[kind]).padStart(3, '0')}</td>
                <td><b>${A(`${HOST}/doc?id=${id}`, esc(doc.title))}</b><br><span class="hwk-small">${esc(doc.sub || '')}</span></td>
                <td class="hwk-small">${places.length ? places.map(mid => A(`${HOST}/atlas?map=${mid}`, esc(h.MAPS[mid].name))).join(', ') : 'выдаётся по сюжету'}</td>
              </tr>`;
            }).join('')}
          </table>`;
      }).join('')}
      ${renderUserAmendmentBox('atlas', route)}`;
  }

  function foeGroupText(def) {
    const h = H();
    if (!def) return 'Случайная группа симуляции';
    const names = (def.g || []).map(fid => (h.ENEMIES && h.ENEMIES[fid] ? h.ENEMIES[fid].name : fid));
    return `${names.join(', ')}${def.lvl ? ` (ур. ${def.lvl})` : ''}`;
  }

  function renderMapArticle(route) {
    const h = H();
    const id = route.id;
    const m = h.MAPS[id];
    const st = mapStats(id);
    const sz = mapSize(m);
    const ents = st.ents;
    const spawn = spawnPoint(id);
    const exits = ents.filter(e => e.kind === 'exit' && e.def.to);
    const exitTargets = [...new Set(exits.map(e => e.def.to))].filter(t => h.MAPS[t]);
    const npcs = ents.filter(e => e.kind === 'npc');
    const foes = ents.filter(e => e.kind === 'foe');
    const chests = ents.filter(e => e.kind === 'chest');
    const anchors = ents.filter(e => e.kind === 'anchor');
    const missions = [...(h.TRAIL_MISSIONS || []).filter(q => q.area === id).map(q => q.id), ...Object.keys(h.QUESTS || {}).filter(k => h.QUESTS[k].area === id)];
    const cell = Math.max(2, Math.min(8, Math.floor(300 / Math.max(sz.w, sz.h * 1.2, 1))));
    const sections = [['m-scheme', 'Текстовая схема']];
    if (exitTargets.length) sections.push(['m-exits', 'Переходы']);
    if (anchors.length) sections.push(['m-anchors', 'Якоря']);
    if (npcs.length) sections.push(['m-npc', 'Жители']);
    if (foes.length) sections.push(['m-foes', 'Патрули']);
    if (chests.length) sections.push(['m-chests', 'Сундуки']);
    if (st.docList.length) sections.push(['m-docs', 'Записки']);
    return `
      ${head(`Локация: ${m.name}`, `Сектор: ${esc(sectorOf(id))}. Код карты в игре: <span class="hwk-mono">${esc(id)}</span>.`)}
      <table class="hwk-cols"><tr>
        <td>
          <div class="hwk-map-wrap">
            <canvas class="hwk-canvas" width="${sz.w * cell}" height="${sz.h * cell}" data-aw-map="${esc(id)}"></canvas>
            <div class="hwk-legend">
              <span class="hwk-sw" style="background-color:#ffcc00;"></span>сундук
              <span class="hwk-sw" style="background-color:#ffffff;"></span>записка
              <span class="hwk-sw" style="background-color:#33ff33;"></span>якорь
              <span class="hwk-sw" style="background-color:#66ccff;"></span>житель
              <span class="hwk-sw" style="background-color:#ff3333;"></span>патруль
              <span class="hwk-sw" style="background-color:#ff9900;"></span>переход
              <span class="hwk-sw" style="background-color:#ff66ff;"></span>точка входа
            </div>
          </div>
          <div style="margin-top:10px;">${toc(sections)}</div>
        </td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">${esc(m.name)}</th></tr>
            <tr><td class="hwk-k">Сектор</td><td>${esc(sectorOf(id))}</td></tr>
            <tr><td class="hwk-k">Размер</td><td>${sz.w} x ${sz.h} клеток</td></tr>
            <tr><td class="hwk-k">Точка входа</td><td>${spawn ? `X ${spawn[0]}, Y ${spawn[1]}` : 'по переходу'}</td></tr>
            <tr><td class="hwk-k">Сундуков</td><td><b>${st.chests}</b></td></tr>
            <tr><td class="hwk-k">Записок</td><td><b>${st.docs}</b></td></tr>
            <tr><td class="hwk-k">Якорей</td><td>${st.anchors}</td></tr>
            <tr><td class="hwk-k">Жителей</td><td>${st.npcs}</td></tr>
            <tr><td class="hwk-k">Патрулей</td><td>${st.foes}${st.trotters ? ` (свинок-копилок: ${st.trotters})` : ''}</td></tr>
            ${m.safe ? '<tr><td class="hwk-k">Безопасно</td><td>да, бои не начинаются</td></tr>' : ''}
          </table>
          ${missions.length ? `<div class="hwk-panel"><div class="hwk-panel-h">Миссии здесь</div><div class="hwk-panel-b"><ul>${missions.map(q => `<li>${A(`${HOST}/quest?id=${q}`, esc(questTitle(q)))}</li>`).join('')}</ul></div></div>` : ''}
        </td>
      </tr></table>

      ${section('m-scheme', 'Текстовая схема')}
      <p class="hwk-small">Условные знаки: <b>$</b> сундук, <b>?</b> записка, <b>+</b> якорь, <b>@</b> житель, <b>!</b> патруль, <b>&gt;</b> переход, <b>&amp;</b> точка входа, <b>#</b> стена.</p>
      <div class="hwk-map-ascii">${asciiHtml(id)}</div>

      ${exitTargets.length ? `${section('m-exits', 'Переходы в соседние локации')}
        <ul>${exitTargets.map(t => `<li>${A(`${HOST}/atlas?map=${t}`, esc(h.MAPS[t].name))} <span class="hwk-small hwk-dim">(${exits.filter(e => e.def.to === t).map(e => `X ${e.x}, Y ${e.y}`).join('; ')})</span></li>`).join('')}</ul>` : ''}

      ${anchors.length ? `${section('m-anchors', 'Пространственные якоря')}
        <ul>${anchors.map(a => `<li><b>${esc(a.name)}</b> <span class="hwk-small hwk-dim">(X ${a.x}, Y ${a.y})</span></li>`).join('')}</ul>` : ''}

      ${npcs.length ? `${section('m-npc', `Жители (${npcs.length})`)}
        <table class="hwk-table">
          <tr><th width="34%">Кто</th><th width="18%">Где</th><th>Что говорит или делает</th></tr>
          ${npcs.map((e, i) => `<tr${alt(i)}>
            <td><b>${e.def.who && h.CHARS[e.def.who] ? A(`${HOST}/char?id=${e.def.who}`, esc(npcLabel(e.def))) : esc(npcLabel(e.def))}</b>${e.def.if ? '<br><span class="hwk-small hwk-dim">появляется не всегда</span>' : ''}</td>
            <td class="hwk-mono">X ${e.x}, Y ${e.y}</td>
            <td>${e.def.text ? `«${esc(e.def.text)}»` : '<span class="hwk-dim">разговор по сюжету</span>'}</td>
          </tr>`).join('')}
        </table>` : ''}

      ${foes.length ? `${section('m-foes', `Вражеские патрули (${foes.length})`)}
        <table class="hwk-table">
          <tr><th width="18%">Где</th><th>Состав отряда</th></tr>
          ${foes.map((e, i) => `<tr${alt(i)}><td class="hwk-mono">X ${e.x}, Y ${e.y}</td><td>${esc(foeGroupText(e.def))}${e.def && e.def.if ? ' <span class="hwk-small hwk-dim">(после события)</span>' : ''}</td></tr>`).join('')}
        </table>` : ''}

      ${chests.length ? `${section('m-chests', `Сундуки (${chests.length})`)}
        <table class="hwk-table">
          <tr><th width="18%">Где</th><th>Содержимое</th></tr>
          ${chests.map((e, i) => `<tr${alt(i)}><td class="hwk-mono">X ${e.x}, Y ${e.y}</td><td>${esc(rewardText(e.def) || 'мелочь')}</td></tr>`).join('')}
        </table>` : ''}

      ${st.docList.length ? `${section('m-docs', `Записки на этой карте (${st.docList.length})`)}
        <ul>${st.docList.filter(did => h.DOCS[did]).map(did => `<li>${A(`${HOST}/doc?id=${did}`, `<b>${esc(h.DOCS[did].title)}</b>`)}: ${esc(h.DOCS[did].sub || '')}</li>`).join('')}</ul>` : ''}
      <p class="hwk-small">${A(`${HOST}/atlas`, '&lt;&lt; Вернуться в Атлас')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderDocArticle(route) {
    const h = H();
    const doc = h.DOCS[route.id];
    const kind = doc.kind || 'paper';
    const places = docPlaces(route.id);
    const text = `<div class="hwk-doc-pre">${esc(doc.text || '')}</div>`;
    let sheet;
    if (kind === 'book') {
      sheet = `<div class="hwk-book"><div class="hwk-book-page">
        <div class="hwk-book-title">${esc(doc.title)}</div>
        <div class="hwk-book-sub">${esc(doc.sub || '')}</div>
        ${text}
      </div></div>`;
    } else if (kind === 'screen') {
      sheet = `<div class="hwk-screen"><div class="hwk-screen-glass">
        <div class="hwk-doc-pre">&gt; ${esc(doc.sub || doc.title)}</div><br>
        ${text}
      </div><div class="hwk-screen-cap">${esc(doc.title)}</div></div>`;
    } else {
      sheet = `<div class="hwk-paper">
        <div class="hwk-paper-h">${esc(doc.title)}</div>
        ${text}
      </div>`;
    }
    const neighbours = places.length ? mapStats(places[0]).docList.filter(did => did !== route.id && h.DOCS[did]) : [];
    const kindTitle = (DOC_KINDS.find(k => k[0] === kind) || DOC_KINDS[0])[1];
    return `
      ${head(doc.title, `${esc(kindTitle)}. ${esc(doc.sub || '')}`)}
      <div class="hwk-found"><b>Где найти:</b> ${places.length ? places.map(mid => A(`${HOST}/atlas?map=${mid}`, esc(h.MAPS[mid].name))).join(', ') : 'документ выдаётся по сюжету, на карте его нет'}</div>
      ${sheet}
      ${neighbours.length ? `<p class="hwk-small"><b>Рядом лежат:</b> ${neighbours.map(did => A(`${HOST}/doc?id=${did}`, esc(h.DOCS[did].title))).join(', ')}</p>` : ''}
      <p class="hwk-small">${A(`${HOST}/atlas`, '&lt;&lt; В Читальный зал')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function galleryTable(ids) {
    const h = H();
    const rows = [];
    for (let i = 0; i < ids.length; i += 5) rows.push(ids.slice(i, i + 5));
    return `<table class="hwk-gallery">${rows.map(row => `<tr>${row.map(id => {
      const c = h.CHARS[id];
      return `<td>
        ${A(`${HOST}/char?id=${id}`, art(`fig:${id}`, 56, 56))}
        <span class="hwk-gname">${A(`${HOST}/char?id=${id}`, esc(c.name))}</span>
        ${stars(c.rarity)}<br>
        ${esc(h.PATHS[c.path] ? h.PATHS[c.path].name : c.path)}, ${esc(h.ELEMENTS[c.elem] ? h.ELEMENTS[c.elem].name : c.elem)}
      </td>`;
    }).join('')}${'<td class="hwk-empty"></td>'.repeat(5 - row.length)}</tr>`).join('')}</table>`;
  }

  function renderCharsHub(route) {
    const h = H();
    const filterPath = route.params.path || '';
    const filterElem = route.params.elem || '';
    const asTable = route.params.view === 'table';
    const allIds = characterIds();
    const ids = allIds.filter(id => {
      const c = h.CHARS[id];
      if (filterPath && c.path !== filterPath) return false;
      if (filterElem && c.elem !== filterElem) return false;
      return true;
    });
    const filterLink = (key, val, label, on) => A(`${HOST}/chars?${key}=${val}`, esc(label), on ? 'is-on' : '');
    const filters = `<div class="hwk-filter">
      <b>Путь:</b> ${A(`${HOST}/chars`, 'все', !filterPath && !filterElem && !asTable ? 'is-on' : '')} ${Object.entries(h.PATHS).map(([k, p]) => filterLink('path', k, p.name, filterPath === k)).join(' ')}<br>
      <b>Стихия:</b> ${Object.entries(h.ELEMENTS).map(([k, el]) => filterLink('elem', k, el.name, filterElem === k)).join(' ')}<br>
      <b>Вид:</b> ${A(`${HOST}/chars`, 'галерея', !asTable ? 'is-on' : '')} ${A(`${HOST}/chars?view=table`, 'сводная таблица', asTable ? 'is-on' : '')}
    </div>`;
    let body;
    if (asTable) {
      body = `<table class="hwk-table">
        <tr><th></th><th>Имя</th><th>Путь и стихия</th><th>Фракция</th><th>Аркан</th><th>Дуга</th></tr>
        ${ids.map((id, i) => {
          const c = h.CHARS[id];
          const inf = (h.INFO && h.INFO[id]) || {};
          const arcana = h.VELVET && typeof h.VELVET.arcanaName === 'function' && typeof h.VELVET.arcanaOf === 'function' ? h.VELVET.arcanaName(h.VELVET.arcanaOf(id)) : '-';
          return `<tr${alt(i)}>
            <td width="36">${art(`fig:${id}`, 32, 32)}</td>
            <td><b>${A(`${HOST}/char?id=${id}`, esc(c.fullName || c.name))}</b> ${stars(c.rarity)}</td>
            <td>${esc(h.PATHS[c.path].name)}<br>${esc(h.ELEMENTS[c.elem].name)}</td>
            <td class="hwk-small">${esc(inf.faction || '-')}</td>
            <td>${esc(arcana)}</td>
            <td class="hwk-small">${esc(deriveCharArc(id).arcType)}</td>
          </tr>`;
        }).join('')}
      </table>`;
    } else if (filterPath || filterElem) {
      body = ids.length ? galleryTable(ids) : '<p class="hwk-p">Таких персонажей в игре нет.</p>';
    } else {
      const groups = charGroups();
      body = `${jumpbar(groups.map(g => [`c-${g.key}`, g.title]))}${groups.map(g => `${anchorTag(`c-${g.key}`)}<div class="hwk-group-h">${esc(g.title)} <span>(${g.ids.length})</span></div>${galleryTable(g.ids)}`).join('')}`;
    }
    return `
      ${head(`Персонажи: все ${allIds.length} ${plural(allIds.length, 'герой', 'героя', 'героев')}`)}
      ${filters}
      <p class="hwk-small">Показано: <b>${ids.length}</b> из ${allIds.length}.</p>
      ${body}
      ${renderUserAmendmentBox('chars', route)}`;
  }

  function renderCharArticle(route) {
    const h = H();
    const id = route.id;
    const c = h.CHARS[id];
    const base = c.base || { hp: 120, atk: 70, def: 55, spd: 100 };
    const inf = (h.INFO && h.INFO[id]) || { full: c.fullName || c.name, faction: '', home: '', about: '', story: [], voice: [], battle: [], intro: [], extra: [] };
    const arc = deriveCharArc(id);
    const rate = h.RATE && h.RATE[id] ? (h.RATE[id][0] == null ? 'Оценка недействительна (сбой датчика)' : `${h.RATE[id][0]} баллов`) : 'Не измерялся';
    const arcana = h.VELVET && typeof h.VELVET.arcanaName === 'function' && typeof h.VELVET.arcanaOf === 'function' ? h.VELVET.arcanaName(h.VELVET.arcanaOf(id)) : 'Шут';
    const eidScene = h.Eidolons && h.Eidolons.SCENES ? h.Eidolons.SCENES[id] : null;
    const outfits = Object.values(h.OUTFITS || {}).filter(o => o.char === id);
    const sigCones = coneIds().filter(cid => h.CONES[cid].sig === id);
    const fusions = Object.values(h.FUSIONS || {}).filter(f => (f.members || []).includes(id));
    const story = inf.story || [];
    const sections = [['s-arc', 'Дуга персонажа']];
    if (inf.intro && inf.intro.length) sections.push(['s-intro', 'Интервью в вагоне']);
    if (inf.extra && inf.extra.length) sections.push(['s-extra', 'Дополнительные сведения']);
    if (story.length) sections.push(['s-story', 'Истории персонажа']);
    if (eidScene) sections.push(['s-eid', 'Картина Эйдолона']);
    sections.push(['s-kit', 'Умения в бою']);
    if ((inf.voice || []).length) sections.push(['s-voice', 'Мнения о спутниках']);
    if ((inf.battle || []).length) sections.push(['s-battle', 'Боевые реплики']);

    return `
      ${head(inf.full || c.fullName || c.name)}
      <table class="hwk-cols"><tr>
        <td>
          <p class="hwk-lead"><b>${esc(c.name)}</b>${inf.aka ? ` (${esc(inf.aka)})` : ''}: ${esc(inf.about || c.title || '')}</p>
          ${toc(sections)}
          ${section('s-arc', 'Дуга персонажа')}
          <p class="hwk-small">Тип дуги: <b>${esc(arc.arcType)}</b></p>
          <table class="hwk-table">
            <tr><td width="30%"><b>Во что верит в начале</b></td><td>${formatWikiText(arc.lie)}</td></tr>
            <tr class="hwk-alt"><td><b>К чему приходит</b></td><td>${formatWikiText(arc.truth)}</td></tr>
            <tr><td><b>Рана из прошлого</b></td><td>${formatWikiText(arc.ghostWound)}</td></tr>
            <tr class="hwk-alt"><td><b>Главные связи</b></td><td>${formatWikiText(arc.keyRelation)}</td></tr>
          </table>
        </td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">${esc(c.fullName || c.name)}</th></tr>
            <tr><td colspan="2" class="hwk-pic">${art(`fig:${id}`, 112, 112)}</td></tr>
            <tr><td class="hwk-k">Редкость</td><td>${stars(c.rarity)}</td></tr>
            <tr><td class="hwk-k">Путь</td><td><b>${esc(h.PATHS[c.path].name)}</b></td></tr>
            <tr><td class="hwk-k">Стихия</td><td><b>${esc(h.ELEMENTS[c.elem].name)}</b></td></tr>
            <tr><td class="hwk-k">Фракция</td><td>${esc(inf.faction || '-')}</td></tr>
            <tr><td class="hwk-k">Родина</td><td>${esc(inf.home || '-')}</td></tr>
            <tr><td class="hwk-k">Аркан</td><td>${esc(arcana)}</td></tr>
            <tr><td class="hwk-k">Оценивающий пистолет</td><td>${esc(rate)}</td></tr>
            <tr><td class="hwk-k">Ур. 1</td><td class="hwk-mono">HP ${base.hp}<br>АТК ${base.atk}<br>ЗАЩ ${base.def}<br>СКР ${base.spd}</td></tr>
            ${sigCones.length ? `<tr><td class="hwk-k">Свой конус</td><td>${sigCones.map(cid => A(`${HOST}/cone?id=${cid}`, `«${esc(h.CONES[cid].name)}»`)).join('<br>')}</td></tr>` : ''}
          </table>
        </td>
      </tr></table>

      ${(inf.intro && inf.intro.length) ? `${section('s-intro', 'Интервью в вагоне')}
        ${inf.intro.map(it => `<p class="hwk-p"><b>${esc(it.q)}</b></p>
          <p class="hwk-quote">«${esc(it.a)}»</p>
          <p class="hwk-small" style="margin:-4px 0 10px 18px;">${esc(it.by)} на полях: ${esc(it.note)}</p>`).join('')}` : ''}

      ${(inf.extra && inf.extra.length) ? `${section('s-extra', 'Дополнительные сведения')}
        ${inf.extra.map(ex => `<h3 class="hwk-h3">${esc(ex.h)}</h3><p class="hwk-p">${storyHtml(ex.text)}</p>`).join('')}` : ''}

      ${story.length ? `${section('s-story', `Истории персонажа (${story.length})`)}
        ${story.map((st, idx) => {
          const req = st.need && st.need.lvl ? `открывается на ${st.need.lvl} уровне` : 'открыта сразу';
          const bodyHtml = `<div class="hwk-p">${storyHtml(st.text)}</div>`;
          if (idx >= 2) return spoilerBlock(`story_${id}_${idx}`, `История ${idx + 1}, ${req}`, bodyHtml);
          return `<h3 class="hwk-h3">История ${idx + 1} <span class="hwk-dim">(${esc(req)})</span></h3><div class="hwk-story">${bodyHtml}</div>`;
        }).join('')}` : ''}

      ${eidScene ? `${section('s-eid', `Картина Эйдолона: «${eidScene.sub || eidScene.title || c.name}»`)}
        <table class="hwk-cols"><tr>
          <td width="160">${art(`eid:${id}`, 150, 112)}</td>
          <td>
            <table class="hwk-table" style="margin-top:0;">
              ${eidScene.frags.map((fr, idx) => `<tr${alt(idx)}><td width="34" class="hwk-mono"><b>E${idx + 1}</b></td><td><b>${esc(fr[0])}</b><br>${esc(fr[1])}</td></tr>`).join('')}
            </table>
          </td>
        </tr></table>` : ''}

      ${section('s-kit', 'Умения в бою')}
      <table class="hwk-table">
        <tr><th width="20%">Умение</th><th width="26%">Название</th><th>Что делает</th></tr>
        <tr><td>Базовая атака</td><td><b>${esc(c.basic ? c.basic.name : '-')}</b></td><td>${esc(describeAbility(c.basic))}</td></tr>
        <tr class="hwk-alt"><td>Навык</td><td><b>${esc(c.skill ? c.skill.name : '-')}</b></td><td>${esc(describeAbility(c.skill))}</td></tr>
        <tr><td>Абсолютная техника</td><td><b>${esc(c.ult ? c.ult.name : '-')}</b></td><td>${esc(describeAbility(c.ult))}</td></tr>
        ${c.talent ? `<tr class="hwk-alt"><td>Талант</td><td><b>Пассивный дар</b></td><td>${esc(c.talent)}</td></tr>` : ''}
        ${c.tech ? `<tr><td>Техника</td><td><b>${esc(c.tech.name || 'Техника')}</b></td><td>${esc(c.tech.text || '')}</td></tr>` : ''}
        ${id === 'trail' && h.CHARS.trail_p ? `<tr class="hwk-alt"><td>Второй Путь: Сохранение</td><td><b>${esc(h.CHARS.trail_p.ult.name)}</b></td><td>Навык: ${esc(describeAbility(h.CHARS.trail_p.skill))}. Техника: ${esc(describeAbility(h.CHARS.trail_p.ult))}</td></tr>` : ''}
      </table>
      ${fusions.length ? `<p class="hwk-small"><b>Слияния:</b> ${fusions.map(f => `«${esc(f.name)}» с ${(f.members || []).filter(m => m !== id).map(m => A(`${HOST}/char?id=${m}`, esc(charName(m)))).join(' и ')} (${esc(f.text || '')})`).join('; ')}</p>` : ''}
      ${outfits.length ? `<p class="hwk-small"><b>Наряды:</b> ${Object.keys(h.OUTFITS || {}).filter(oid => h.OUTFITS[oid].char === id).map(oid => `${outfitLink(oid)}, ${h.OUTFITS[oid].price} звёздного нефрита${h.OUTFITS[oid].giftNote ? ` или даром ${esc(h.OUTFITS[oid].giftNote)}` : ''}`).join('; ')}.</p>` : ''}

      ${(inf.voice || []).length ? `${section('s-voice', `Мнения о спутниках (${inf.voice.length})`)}
        <table class="hwk-table">
          ${inf.voice.map((v, i) => `<tr${alt(i)}><td width="28%"><b>${esc(v.t)}</b></td><td>«${esc(v.text)}»</td></tr>`).join('')}
        </table>` : ''}

      ${(inf.battle || []).length ? `${section('s-battle', `Боевые реплики (${inf.battle.length})`)}
        <table class="hwk-table">
          ${inf.battle.map((b, i) => `<tr${alt(i)}><td width="28%">${esc(b.t)}</td><td>«${esc(b.text)}»</td></tr>`).join('')}
        </table>` : ''}
      ${topLink()}
      <p class="hwk-small">${A(`${HOST}/chars`, `&lt;&lt; Ко всем ${characterIds().length} персонажам`)}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function debateTable(ci, withLink) {
    return `<table class="hwk-debate">
      <tr><th class="hwk-thesis">Тезис главы</th><th class="hwk-anti">Довод антагониста${ci.antagonist ? `: ${esc(ci.antagonist)}` : ''}</th></tr>
      <tr><td class="hwk-thesis">${esc(ci.controllingIdea)}</td><td class="hwk-anti">${esc(ci.counterIdea)}</td></tr>
      <tr><td colspan="2" class="hwk-proof"><b>Проверка делом:</b> ${esc(ci.proofScene)}${withLink ? ` ${A(`${HOST}/theme?id=${ci.id}`, 'Читать разбор &gt;&gt;')}` : ''}</td></tr>
    </table>`;
  }

  function renderThemesHub(route) {
    const t = D().themes;
    const h = H();
    return `
      ${head('Темы, управляющие идеи, антагонисты и мотивы')}
      <p class="hwk-lead">Каждая глава Honkai: Star Rail 98 спорит сама с собой. Герои отстаивают тезис главы, антагонист предлагает свой довод, а финальная сцена проверяет, кто прав. Ниже эти споры разобраны по главам, а также собраны сквозные символы и дуги персонажей.</p>
      ${jumpbar([['t-ci', 'Главы'], ['t-ant', 'Антагонисты'], ['t-mot', 'Мотивы'], ['t-arc', 'Дуги']])}
      ${section('t-ci', `Спор каждой главы (${t.controllingIdeas.length})`)}
      ${t.controllingIdeas.map(ci => `<h3 class="hwk-h3">${A(`${HOST}/theme?id=${ci.id}`, esc(ci.title))} <span class="hwk-dim">(${esc(ci.act)})</span></h3>${debateTable(ci, false)}`).join('')}
      ${topLink()}
      ${section('t-ant', `Антагонисты (${t.antagonists.length})`)}
      <table class="hwk-table">
        <tr><th width="20%">Антагонист</th><th width="26%">Роль</th><th>Почему считает себя правым</th></tr>
        ${t.antagonists.map((a, i) => `<tr${alt(i)}>
          <td><b>${A(`${HOST}/theme?id=${a.id}`, esc(a.name))}</b></td>
          <td>${esc(a.role)}</td>
          <td>${esc(a.whySheBelievesSheIsRight)}</td>
        </tr>`).join('')}
      </table>
      ${section('t-mot', `Сквозные мотивы (${t.motifs.length})`)}
      <table class="hwk-table">
        <tr><th width="24%">Мотив</th><th>Что он значит</th></tr>
        ${t.motifs.map((m, i) => `<tr${alt(i)}><td><b>${A(`${HOST}/theme?id=${m.id}`, esc(m.name))}</b><br><span class="hwk-small">${esc(m.symbol)}</span></td><td>${esc(m.meaning)}</td></tr>`).join('')}
      </table>
      ${topLink()}
      ${section('t-arc', 'Дуги персонажей')}
      <table class="hwk-table">
        <tr><th width="16%">Герой</th><th width="18%">Тип дуги</th><th>Во что верит в начале</th><th>К чему приходит</th></tr>
        ${Object.entries(t.charArcs).map(([cid, arc], i) => `<tr${alt(i)}>
          <td><b>${h && h.CHARS[cid] ? A(`${HOST}/char?id=${cid}`, esc(h.CHARS[cid].name)) : esc(cid)}</b></td>
          <td class="hwk-small">${esc(arc.arcType)}</td>
          <td>${formatWikiText(arc.lie)}</td>
          <td>${formatWikiText(arc.truth)}</td>
        </tr>`).join('')}
      </table>
      ${renderUserAmendmentBox('themes', route)}`;
  }

  function renderThemeArticle(route) {
    const t = D().themes;
    const ci = t.controllingIdeas.find(x => x.id === route.id);
    const ant = t.antagonists.find(x => x.id === route.id);
    const mot = t.motifs.find(x => x.id === route.id);
    const back = `<p class="hwk-small">${A(`${HOST}/themes`, '&lt;&lt; Ко всем темам и мотивам')}</p>`;

    if (ci) {
      return `
        ${head(`Разбор главы: «${ci.title}»`, `${esc(ci.act)}. Ценность, о которой спорит глава: ${esc(ci.value || '-')}.`)}
        ${debateTable(ci, false)}
        <h2 class="hwk-h2">Разбор</h2>
        <p class="hwk-p">${esc(ci.summary)}</p>
        ${back}
        ${renderUserAmendmentBox(route.pageId, route)}`;
    }
    if (ant) {
      return `
        ${head(`Антагонист: ${ant.name}`)}
        <table class="hwk-cols"><tr>
          <td>
            <p class="hwk-lead"><b>Какой тезис проверяет:</b> ${esc(ant.thesisTested)}</p>
            <h2 class="hwk-h2">Почему считает себя правым</h2>
            <p class="hwk-p">${esc(ant.whySheBelievesSheIsRight)}</p>
            <h2 class="hwk-h2">Куда бьёт</h2>
            <p class="hwk-p">${esc(ant.pressureOnHero)}</p>
            <h2 class="hwk-h2">Чем заканчивается</h2>
            <p class="hwk-p">${esc(ant.downfall)}</p>
          </td>
          <td class="hwk-gap"></td>
          <td class="hwk-side">
            <table class="hwk-infobox">
              <tr><th>${esc(ant.name)}</th></tr>
              <tr><td class="hwk-pic">${art(ant.art, 96, 96)}</td></tr>
              <tr><td>${esc(ant.role)}</td></tr>
            </table>
          </td>
        </tr></table>
        ${back}
        ${renderUserAmendmentBox(route.pageId, route)}`;
    }
    return `
      ${head(`Мотив: ${mot.name}`, `Символ: ${esc(mot.symbol)}`)}
      <table class="hwk-ladder">
        <tr><td class="hwk-step">Первое появление</td><td>${formatWikiText(mot.firstSeen)}</td></tr>
        <tr><td class="hwk-step">Как меняется</td><td>${formatWikiText(mot.transformations)}</td></tr>
        <tr><td class="hwk-step">Кульминация</td><td>${formatWikiText(mot.climax)}</td></tr>
        <tr><td class="hwk-step">Итог</td><td><b>${esc(mot.meaning)}</b></td></tr>
      </table>
      ${back}
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderQuestsHub(route) {
    const h = H(), d = D();
    const chapters = Object.entries((h && h.MISSION_CHAPTERS) || {});
    const trail = (h && h.TRAIL_MISSIONS) || [];
    const quests = h && h.QUESTS ? Object.entries(h.QUESTS) : [];
    const rumors = (h && h.RUMORS) || [];
    const placed = new Set();
    const areaName = item => (item.area && h.MAPS && h.MAPS[item.area] ? A(`${HOST}/atlas?map=${item.area}`, esc(h.MAPS[item.area].name)) : '');
    const chapterBlocks = chapters.map(([chId, ch], ci) => {
      const items = [
        ...trail.filter(m => m.ch === chId).map(m => [m.id, m]),
        ...quests.filter(([, q]) => q.ch === chId)
      ];
      if (!items.length) return '';
      items.forEach(([qid]) => placed.add(qid));
      return `${anchorTag(`q-ch${ci}`)}<div class="hwk-group-h">${esc(ch.label)}: «${esc(ch.name)}» <span>(${items.length})</span></div>
        <table class="hwk-table">
          ${items.map(([qid, q], i) => `<tr${alt(i)}>
            <td width="30%"><b>${A(`${HOST}/quest?id=${qid}`, esc(q.name))}</b>${q.giver ? `<br><span class="hwk-small">выдаёт: ${esc(q.giver)}</span>` : ''}</td>
            <td>${esc(q.desc || '')}</td>
            <td width="22%" class="hwk-small">${areaName(q)}</td>
          </tr>`).join('')}
        </table>`;
    }).join('');
    const loose = quests.filter(([qid]) => !placed.has(qid));
    return `
      ${head('Прохождение, поручения и загадки')}
      <p class="hwk-lead">Здесь собраны все главы Освоения с миссиями, поручения компаньонов и приключения, решения загадок и прейскурант слухов Сампо.</p>
      ${jumpbar([['q-puz', 'Загадки'], ['q-ch', 'Миссии по главам'], ['q-rum', 'Слухи Сампо']])}
      ${section('q-puz', `Загадки и секреты (${d.puzzles.length})`)}
      <ol class="hwk-faq">
        ${d.puzzles.map(p => `<li><b>${A(`${HOST}/puzzle?id=${p.id}`, esc(p.title))}</b><br>${esc(p.summary)}<br><span class="hwk-small">Где: ${esc(p.zone.replace(/`/g, ''))}. Награда: ${esc(p.reward)}.</span></li>`).join('')}
      </ol>
      ${topLink()}
      ${section('q-ch', `Миссии по главам (${trail.length + quests.length})`)}
      <div class="hwk-small" style="margin-bottom:6px;">${chapters.map(([, ch], ci) => `[${jump(`q-ch${ci}`, esc(ch.name))}]`).join(' ')}</div>
      ${chapterBlocks}
      ${loose.length ? `<div class="hwk-group-h">Прочие поручения <span>(${loose.length})</span></div>
        <table class="hwk-table">${loose.map(([qid, q], i) => `<tr${alt(i)}><td width="30%"><b>${A(`${HOST}/quest?id=${qid}`, esc(q.name))}</b></td><td>${esc(q.desc || '')}</td><td width="22%" class="hwk-small">${areaName(q)}</td></tr>`).join('')}</table>` : ''}
      ${topLink()}
      ${section('q-rum', `Прейскурант слухов Сампо Коски (${rumors.length})`)}
      <p class="hwk-small">Сампо продаёт слухи за кредиты. Каждый слух что-то меняет в мире, это указано под текстом.</p>
      <table class="hwk-price">
        ${rumors.map(r => `<tr>
          <td><b>«${esc(r.title)}»</b> <span class="hwk-small">(${r.who === 'sampo_belobog' ? 'Сампо в Надмирье' : 'Сампо в Подземье'})</span><br>${esc(r.text)}<br><span class="hwk-small">В игре: ${esc(r.effect)}</span></td>
          <td class="hwk-cost">${r.cost} кр.</td>
        </tr>`).join('')}
      </table>
      ${renderUserAmendmentBox('quests', route)}`;
  }

  function renderQuestArticle(route) {
    const h = H();
    const id = route.id;
    const tm = (h.TRAIL_MISSIONS || []).find(m => m.id === id);
    const q = h.QUESTS && h.QUESTS[id];
    const item = tm || q;
    const rawSteps = item.steps;
    const steps = Array.isArray(rawSteps)
      ? rawSteps
      : (rawSteps && typeof rawSteps === 'object'
        ? Object.entries(rawSteps).map(([k, v]) => Object.assign({ key: k }, typeof v === 'object' ? v : { text: String(v) }))
        : []);
    const ch = h.MISSION_CHAPTERS && h.MISSION_CHAPTERS[item.ch];
    const area = item.area && h.MAPS[item.area] ? A(`${HOST}/atlas?map=${item.area}`, esc(h.MAPS[item.area].name)) : 'по маршруту миссии';
    const checks = readChecks()[id] || {};
    const sv = readSave();
    const doneInSave = sv && sv.quests && sv.quests[id] === 2;
    const reward = rewardText(item.reward);
    return `
      ${head(item.name, ch ? `${esc(ch.label)}: «${esc(ch.name)}»` : 'Поручение')}
      ${doneInSave ? `<p class="hwk-done">■ В вашем сохранении (${esc(sv.name || 'Первопроходец')}) эта миссия уже выполнена.</p>` : ''}
      <table class="hwk-cols"><tr>
        <td>
          <p class="hwk-lead">${esc(item.desc || 'Сюжетное поручение Первопроходца.')}</p>
          ${steps.length ? `<h2 class="hwk-h2">Что нужно сделать</h2>
            <p class="hwk-small">Отмечайте пройденные шаги галочкой. Отметки хранятся в вашем браузере.</p>
            <table class="hwk-check">
              ${steps.map((st, i) => {
                const mapId = st.at ? st.at.split(':')[0] : '';
                const key = st.key || String(i);
                return `<tr>
                  <td class="hwk-box"><input type="checkbox" data-aw-check="${esc(id)}" data-aw-step="${esc(key)}"${checks[key] ? ' checked' : ''}></td>
                  <td>${esc(st.text || st.title || `Шаг ${i + 1}`)}${mapId && h.MAPS[mapId] ? `<br><span class="hwk-small">Где: ${A(`${HOST}/atlas?map=${mapId}`, esc(h.MAPS[mapId].name))}</span>` : ''}</td>
                </tr>`;
              }).join('')}
            </table>` : '<p class="hwk-small">Эта миссия проходит одним событием, без отдельных шагов.</p>'}
        </td>
        <td class="hwk-gap"></td>
        <td class="hwk-side">
          <table class="hwk-infobox">
            <tr><th colspan="2">Карточка миссии</th></tr>
            ${item.face && h.CHARS[item.face] ? `<tr><td colspan="2" class="hwk-pic">${A(`${HOST}/char?id=${item.face}`, art(`fig:${item.face}`, 64, 64))}</td></tr>` : ''}
            <tr><td class="hwk-k">Код</td><td class="hwk-mono">${esc(id)}</td></tr>
            ${item.giver ? `<tr><td class="hwk-k">Выдаёт</td><td>${esc(item.giver)}</td></tr>` : ''}
            <tr><td class="hwk-k">Место</td><td>${area}</td></tr>
            ${reward ? `<tr><td class="hwk-k">Награда</td><td>${esc(reward)}</td></tr>` : ''}
          </table>
        </td>
      </tr></table>
      <p class="hwk-small">${A(`${HOST}/quests`, '&lt;&lt; Ко всем миссиям и загадкам')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderPuzzleArticle(route) {
    const p = D().puzzles.find(x => x.id === route.id);
    const h = H();
    let extraTable = '';
    if (p.id === 'puz_appraisal' && h && h.RATE) {
      const rows = characterIds().map(cid => {
        const r = h.RATE[cid];
        const score = !r || r[0] == null ? 'Оценка недействительна' : String(r[0]);
        return { cid, name: h.CHARS[cid].fullName || h.CHARS[cid].name, score };
      });
      extraTable = `<h2 class="hwk-h2">Полная таблица показаний Оценивающего пистолета (${rows.length} героев)</h2>
        <table class="hwk-table">
          <tr><th>Персонаж</th><th width="22%">Показание</th><th width="30%">Примечание</th></tr>
          ${rows.map((r, i) => `<tr${alt(i)}>
            <td><b>${A(`${HOST}/char?id=${r.cid}`, esc(r.name))}</b></td>
            <td class="hwk-num">${esc(r.score)}</td>
            <td class="hwk-small">${r.score.includes('недействительна') ? 'датчик сбоит' : (parseInt(r.score, 10) >= 90 ? 'высший балл' : (parseInt(r.score, 10) <= 10 ? 'странно низкий балл' : 'обычный разброс'))}</td>
          </tr>`).join('')}
        </table>`;
    }
    return `
      ${head(`Загадка: ${p.title}`, `Где: ${esc(p.zone.replace(/`/g, ''))}`)}
      <p class="hwk-lead">${esc(p.summary)}</p>
      <p class="hwk-p"><b>Награда:</b> ${esc(p.reward)}</p>
      <h2 class="hwk-h2">Решение по шагам</h2>
      <p class="hwk-small">Ответы закрашены, чтобы не испортить удовольствие. Наведите мышь или выделите текст, чтобы прочитать шаг. <button type="button" class="hwk-btn" data-aw-ink="1">Показать все ответы</button></p>
      <ol class="hwk-faq" data-aw-ink-list="1">
        ${p.steps.map(st => `<li><span class="hwk-ink">${formatWikiText(st)}</span></li>`).join('')}
      </ol>
      ${extraTable}
      <p class="hwk-small">${A(`${HOST}/quests`, '&lt;&lt; Ко всем загадкам')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function renderArtifactsHub(route) {
    const h = H();
    const cones = Object.entries(h.CONES || {});
    const relics = Object.entries(h.RELIC_SETS || {});
    const fusions = Object.entries(h.FUSIONS || {});
    const outfits = Object.entries(h.OUTFITS || {});
    const pets = Object.entries(h.PETS || {});
    const items = Object.entries(h.ITEMS || {});
    const conePaths = Object.keys(h.PATHS).filter(k => cones.some(([, c]) => c.path === k));
    const itemKinds = [...new Set(items.map(([, it]) => it.kind || 'other'))];
    const KIND_NAMES = { food: 'Еда и лекарства', key: 'Ключевые предметы', exp: 'Материалы опыта', other: 'Прочее' };
    return `
      ${head('Каталог предметов: конусы, реликвии, слияния, наряды')}
      ${jumpbar([['a-cones', `Конусы (${cones.length})`], ['a-relics', `Реликвии (${relics.length})`], ['a-fus', `Слияния (${fusions.length})`], ['a-out', `Наряды (${outfits.length + pets.length})`], ['a-items', `Предметы (${items.length})`]])}

      ${section('a-cones', `Световые конусы (${cones.length})`)}
      <p class="hwk-p">У каждого конуса есть своя статья в Зале конусов: картина, история с таблички, умение на всех наложениях и места, где конус можно получить. Нажмите на название.</p>
      <div class="hwk-small" style="margin-bottom:6px;">По Путям: ${conePaths.map(k => `[${jump(`a-c-${k}`, esc(h.PATHS[k].name))}]`).join(' ')}</div>
      ${conePaths.map(k => `${anchorTag(`a-c-${k}`)}<table class="hwk-table">
        <tr><th colspan="3">Путь ${esc(h.PATHS[k].name)}</th></tr>
        <tr><th width="32%">Конус</th><th width="18%">HP / АТК / ЗАЩ</th><th>Эффект</th></tr>
        ${coneHall(k).map((cid, i) => {
          const c = h.CONES[cid];
          const st = c.stats || { hp: 0, atk: 0, def: 0 };
          return `<tr${alt(i)}><td>${A(`${HOST}/cone?id=${cid}`, art(`cone:${cid}`, 20, 28))} <b>${A(`${HOST}/cone?id=${cid}`, esc(c.name))}</b> ${stars(c.rarity)}</td><td class="hwk-num">${Math.round(st.hp)} / ${Math.round(st.atk)} / ${Math.round(st.def)}</td><td>${esc(c.text || '')}</td></tr>`;
        }).join('')}
      </table>`).join('')}
      ${topLink()}

      ${section('a-relics', `Наборы реликвий (${relics.length})`)}
      <table class="hwk-table">
        <tr><th width="30%">Набор</th><th width="18%">Вид</th><th>Бонус</th></tr>
        ${relics.sort((a, b) => Number(!!a[1].planar) - Number(!!b[1].planar)).map(([, r], i) => `<tr${alt(i)}>
          <td><b>${esc(r.name)}</b></td>
          <td class="hwk-small">${r.planar ? 'планарное украшение, 2 ч.' : 'пещерная реликвия, 4 ч.'}</td>
          <td>${esc(describeRelicTwo(r, h))}${r.text && r.text !== describeRelicTwo(r, h) ? `<br><span class="hwk-small">${esc(describeRelicFour(r))}</span>` : ''}</td>
        </tr>`).join('')}
      </table>

      ${section('a-fus', `Слияния (${fusions.length})`)}
      <table class="hwk-table">
        <tr><th width="28%">Слияние</th><th width="28%">Кто участвует</th><th>Что происходит</th></tr>
        ${fusions.map(([, f], i) => `<tr${alt(i)}>
          <td><b>«${esc(f.name)}»</b></td>
          <td>${(f.members || []).map(cid => (h.CHARS[cid] ? A(`${HOST}/char?id=${cid}`, esc(h.CHARS[cid].name)) : esc(cid))).join(' + ')}</td>
          <td>${esc(f.text || '')}</td>
        </tr>`).join('')}
      </table>
      ${topLink()}

      ${section('a-out', `Наряды и питомцы (${outfits.length + pets.length})`)}
      <table class="hwk-table">
        <tr><th width="14%"></th><th width="26%">Наряд</th><th>Описание</th><th width="16%">Цена</th></tr>
        ${outfits.map(([oid, o], i) => `<tr${alt(i)}>
          <td align="center">${outfitLink(oid, art(`dressbust:${oid}`, 40, 40))}</td>
          <td><b>${outfitLink(oid)}</b> ${stars(o.rarity)}<br>${h.CHARS[o.char] ? A(`${HOST}/char?id=${o.char}`, esc(h.CHARS[o.char].name)) : esc(o.char)}</td>
          <td>${esc(o.text)}</td>
          <td class="hwk-small">${o.price} нефрита${o.giftNote ? `<br>или даром ${esc(o.giftNote)}` : ''}</td>
        </tr>`).join('')}
        ${pets.map(([pid, pt]) => `<tr>
          <td align="center">${petLink(pid, art(`pet:${pid}:front-sit`, 40, 40))}</td>
          <td><b>Питомец: ${petLink(pid)}</b></td>
          <td>${esc(pt.text || '')}</td>
          <td class="hwk-small">${pt.price ? `${pt.price} нефрита` : ''}</td>
        </tr>`).join('')}
      </table>

      ${section('a-items', `Предметы (${items.length})`)}
      ${itemKinds.map(k => `<h3 class="hwk-h3">${esc(KIND_NAMES[k] || k)}</h3>
        <table class="hwk-price">
          ${items.filter(([, it]) => (it.kind || 'other') === k).map(([, it]) => `<tr><td><b>${esc(it.name)}</b>: ${esc(it.text || '')}</td><td class="hwk-cost">${it.price ? `${it.price} кр.` : ''}</td></tr>`).join('')}
        </table>`).join('')}
      ${topLink()}
      ${renderUserAmendmentBox('artifacts', route)}`;
  }

  const CONE_LEVELS = [1, 20, 40, 60, 80];

  function coneHall(path) {
    const h = H();
    return coneIds().filter(id => h.CONES[id].path === path).sort((a, b) => h.CONES[b].rarity - h.CONES[a].rarity);
  }

  function coneNum(v, pct) {
    return String(Math.round((pct ? v * 100 : v) * 1000) / 1000).replace('.', ',');
  }

  function coneEffectHtml(id) {
    const c = H().CONES[id];
    if (!c.tpl || !c.p) return esc(c.text || '');
    return esc(c.tpl).replace(/#(\d)(%?)/g, (m, n, pct) => {
      const vals = c.p.map(row => row[n - 1]);
      if (vals.every(v => v === vals[0])) return coneNum(vals[0], pct) + pct;
      return `<b class="hwk-cone-hot">${vals.map(v => coneNum(v, pct)).join('/')}${pct}</b>`;
    });
  }

  function coneLink(id) {
    const h = H();
    return h.CONES[id] ? A(`${HOST}/cone?id=${id}`, `«${esc(h.CONES[id].name)}»`) : esc(id);
  }

  function charLink(id) {
    const h = H();
    return h.CHARS[id] ? A(`${HOST}/char?id=${id}`, esc(h.CHARS[id].name)) : esc(id);
  }

  function coneSources(id) {
    const h = H();
    const tag = `cone:${id}`;
    const out = [];
    const passName = k => (h.ITEMS && h.ITEMS[k] ? h.ITEMS[k].name : k);
    const pool = h.WARP_POOL || {};
    const std = h.BANNERS && h.BANNERS.std;
    for (const [tier, rar] of [['five', 5], ['four', 4], ['three', 3]]) {
      if ((pool[tier] || []).includes(tag)) out.push(`<b>${esc(std ? std.kind : 'Стандартный прыжок')} «${esc(std ? std.name : 'Путь Первопроходцев')}»</b>: всегда в списке наград ${rar}*. Билет: ${esc(passName(std ? std.pass : 'pass'))}.`);
    }
    for (const b of Object.values(h.BANNERS || {})) {
      const stars = Object.entries(b.stars || {});
      const title = b.kind === b.name ? esc(b.name) : `${esc(b.kind)} «${esc(b.name)}»`;
      for (const [star, v] of stars) {
        if (v.cone === id) out.push(`<b>${title}</b>: главная награда, пока баннер посвящён герою ${charLink(star)}. Билет: ${esc(passName(b.pass))}.`);
      }
      const with4 = stars.filter(([, v]) => (v.four || []).includes(tag));
      if (with4.length) {
        const heads = with4.map(([star, v]) => (v.cone ? coneLink(v.cone) : charLink(star)));
        out.push(`<b>${title}</b>: 4* с повышенным шансом рядом с ${heads.join(', ')}. Билет: ${esc(passName(b.pass))}.`);
      }
    }
    for (const sh of Object.values(h.SHOPS || {})) {
      for (const it of sh.items || []) {
        const p = String(it).split(':');
        if (p[0] === 'cone' && p[1] === id) out.push(`<b>${esc(sh.name)}</b>: ${esc(p[2])} кредитов.`);
      }
    }
    for (const row of (h.SUPPLY && h.SUPPLY.starlight) || []) {
      if (row.cone === id) out.push(`<b>Снабжение, лавка Звёздного света</b>: ${row.price} звёздного света${row.limit ? `, ${row.limit} шт. до обновления лавки` : ''}.`);
    }
    const fh = h.FH && h.FH.SHOP;
    for (const sh of Object.values(fh || {})) {
      for (const row of sh.rows || []) {
        if (row.cone === id) out.push(`<b>Зал забвения, «${esc(sh.name)}»</b>: ${row.price} ед. «${esc(passName(sh.cur))}».`);
      }
    }
    for (const [lvl, row] of Object.entries(h.TL_REWARDS || {})) {
      if (row && row.cone === id) out.push(`<b>Пом-Пом, награды Уровня Освоения</b>: выдаётся на ${lvl} уровне.`);
    }
    for (const qid of questIds()) {
      const tm = (h.TRAIL_MISSIONS || []).find(m => m.id === qid);
      const q = tm || (h.QUESTS && h.QUESTS[qid]);
      if (q && q.reward && q.reward.cone === id) out.push(`<b>Миссия ${A(`${HOST}/quest?id=${qid}`, `«${esc(q.name)}»`)}</b>: награда за прохождение.`);
    }
    const note = coneArticle(id);
    for (const x of (note && note.extra) || []) out.push(formatWikiText(x));
    return out;
  }

  function renderConeArticle(route) {
    const h = H();
    const id = route.id;
    const c = h.CONES[id];
    const a = coneArticle(id) || {};
    const pathName = h.PATHS[c.path].name;
    const hall = coneHall(c.path);
    const at = hall.indexOf(id);
    const prev = hall[at - 1], next = hall[at + 1];
    const holders = characterIds().filter(cid => h.CHARS[cid].path === c.path)
      .sort((x, y) => Number(y === c.sig) - Number(x === c.sig) || h.CHARS[y].rarity - h.CHARS[x].rarity);
    const sources = coneSources(id);
    const story = String(c.desc || '').split('\n').filter(Boolean);
    const label = [
      ['Путь', `${art(`path:${c.path}`, 16, 16)} ${esc(pathName)}`],
      ['Редкость', stars(c.rarity)],
      ['Умение', `«${esc(c.skill || '-')}»`],
      c.sig ? ['Чей конус', charLink(c.sig)] : null,
      a.collab ? ['Коллекция', `коллаборация «${esc(a.collab)}»`] : null,
      c.ref ? ['Инв. №', `<span class="hwk-mono">${esc(c.ref)}</span>`] : null
    ].filter(Boolean);
    const thumb = cid => A(`${HOST}/cone?id=${cid}`, art(`cone:${cid}`, 40, 56));
    return `
      ${head(`«${c.name}»`, `Световой конус. Зал Пути ${esc(pathName)}, витрина ${at + 1} из ${hall.length}. Материал из АстралВики '98`)}
      <table class="hwk-cols"><tr>
        <td class="hwk-cone-wall">
          <div class="hwk-cone-frame hwk-cone-f${c.rarity}">${art(`cone:${id}`, 320, 448)}</div>
          <table class="hwk-cone-label">
            <tr><th colspan="2">«${esc(c.name)}»</th></tr>
            ${label.map(([k, v]) => `<tr><td class="hwk-k">${k}</td><td>${v}</td></tr>`).join('')}
          </table>
        </td>
        <td class="hwk-gap"></td>
        <td>
          <p class="hwk-lead"><b>«${esc(c.name)}»</b>: Световой конус ${c.rarity}* Пути ${esc(pathName)}${c.sig ? `, сигнатурный конус героя ${charLink(c.sig)}` : ''}.${a.who ? ` На картине: ${formatWikiText(a.who)}.` : ''}</p>
          <div class="hwk-cone-plaque">
            <div class="hwk-cone-plaque-h">Табличка под картиной</div>
            ${story.map(line => `<p>${esc(line)}</p>`).join('')}
          </div>
          ${a.scene ? `${section('c-scene', 'Что нарисовано')}<p class="hwk-p">${formatWikiText(a.scene)}</p>` : ''}
          ${a.memory ? `${section('c-memory', 'Чья это память')}<p class="hwk-p">${formatWikiText(a.memory)}</p>` : ''}
        </td>
      </tr></table>

      ${section('c-skill', `Умение «${c.skill || c.name}»`)}
      <p class="hwk-cone-skill">${coneEffectHtml(id)}</p>
      <p class="hwk-small">Числа через косую черту: значения на наложениях S1/S2/S3/S4/S5. Копия того же конуса сливается с первым экземпляром, у которого наложение ниже S5. Умение работает, только если конус надет на героя Пути ${esc(pathName)}. Герою другого Пути конус даёт лишь HP, атаку и защиту.</p>

      ${section('c-stats', 'Характеристики по уровню владельца')}
      <table class="hwk-table hwk-cone-stats">
        <tr><th>Уровень героя</th>${CONE_LEVELS.map(l => `<th>${l}</th>`).join('')}</tr>
        ${[['hp', 'HP'], ['atk', 'Атака'], ['def', 'Защита']].map(([k, n], i) => `<tr${alt(i)}><td><b>${n}</b></td>${CONE_LEVELS.map(l => `<td class="hwk-num">${h.coneStats(id, l)[k]}</td>`).join('')}</tr>`).join('')}
      </table>

      ${section('c-who', 'Кому подходит')}
      <p class="hwk-small">Герои Пути ${esc(pathName)}: ${holders.map(cid => `${charLink(cid)}${cid === c.sig ? ' <b>(сигнатурный)</b>' : ''}`).join(', ') || 'пока нет'}.</p>
      ${(a.tips || []).length ? `<ul class="hwk-cone-list">${a.tips.map(t => `<li>${formatWikiText(t)}</li>`).join('')}</ul>` : ''}

      ${section('c-get', 'Где получить')}
      ${sources.length ? `<ul class="hwk-cone-list">${sources.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p class="hwk-p">В нынешней сборке конус получить нельзя.</p>'}

      ${a.theme ? `${section('c-theme', 'Тема')}<p class="hwk-p">${formatWikiText(a.theme)}</p>` : ''}
      ${(a.trivia || []).length ? `${section('c-dyk', 'Знаете ли вы')}<ul class="hwk-cone-list">${a.trivia.map(t => `<li>${formatWikiText(t)}</li>`).join('')}</ul>` : ''}

      <table class="hwk-cone-nav"><tr>
        <td width="33%">${prev ? `${thumb(prev)}<br>&lt;&lt; ${coneLink(prev)}` : '<span class="hwk-dim">Первая витрина зала</span>'}</td>
        <td width="34%" align="center">${A(`${HOST}/artifacts`, `Все конусы Пути ${esc(pathName)}`)}<br><span class="hwk-small">${hall.length} ${plural(hall.length, 'витрина', 'витрины', 'витрин')}</span></td>
        <td width="33%" align="right">${next ? `${thumb(next)}<br>${coneLink(next)} &gt;&gt;` : '<span class="hwk-dim">Последняя витрина зала</span>'}</td>
      </tr></table>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function outfitIds() {
    const h = H();
    return h && h.OUTFITS ? Object.keys(h.OUTFITS) : [];
  }

  function petIds() {
    const h = H();
    return h && h.PETS ? Object.keys(h.PETS) : [];
  }

  function webSafe(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return '#999999';
    const n = parseInt(m[1], 16);
    return '#' + [16, 8, 0].map(s => (Math.round(((n >> s) & 255) / 51) * 3).toString(16).repeat(2)).join('');
  }

  function outfitLink(id, html) {
    return A(`${HOST}/outfit?id=${id}`, html || `«${esc(H().OUTFITS[id].name)}»`);
  }

  function petLink(id, html) {
    return A(`${HOST}/pet?id=${id}`, html || esc(H().PETS[id].name));
  }

  function outfitTag(id) {
    const h = H(), o = h.OUTFITS[id];
    return `<div class="hwk-tag">
      <div class="hwk-tag-hole"></div>
      <div class="hwk-tag-h">Ателье «Снабжение»</div>
      <table class="hwk-tag-t">
        <tr><td class="hwk-tag-k">Арт.</td><td class="hwk-mono">${esc(id)}</td></tr>
        <tr><td class="hwk-tag-k">Модель</td><td><b>«${esc(o.name)}»</b></td></tr>
        <tr><td class="hwk-tag-k">Для</td><td>${A(`${HOST}/char?id=${o.char}`, esc(h.CHARS[o.char].name))}</td></tr>
        <tr><td class="hwk-tag-k">Класс</td><td>${stars(o.rarity)}</td></tr>
        <tr><td class="hwk-tag-k">Вид</td><td>${esc(o.kind || 'Особый наряд')}</td></tr>
        <tr><td class="hwk-tag-k">Цена</td><td><b>${o.price}</b> звёздного нефрита</td></tr>
        ${o.giftNote ? `<tr><td class="hwk-tag-k">Даром</td><td>${esc(o.giftNote)}</td></tr>` : ''}
        <tr><td class="hwk-tag-k">Катсцены</td><td>${o.cuts ? 'свои: абсолютная техника, Навык, Слияния, прыжок; своя картина эйдолонов' : 'обычные, меняется только облик'}</td></tr>
        <tr><td class="hwk-tag-k">В бою</td><td>характеристик не меняет</td></tr>
      </table>
    </div>`;
  }

  function renderOutfitArticle(route) {
    const h = H(), id = route.id, o = h.OUTFITS[id];
    const w = (D().outfits || {})[id] || {};
    const c = h.CHARS[o.char];
    const owner = A(`${HOST}/char?id=${o.char}`, esc(c.name));
    const trail = o.char === 'trail';
    const ids = outfitIds(), at = ids.indexOf(id);
    const prev = ids[(at + ids.length - 1) % ids.length], next = ids[(at + 1) % ids.length];
    const before = trail ? `${art('fig:trail', 64, 128)} ${art('figf:trail', 64, 128)}` : art(`fig:${o.char}`, 96, 192);
    const cut = w.cut || [];
    const howGet = w.howGet || [];
    const trivia = w.trivia || [];
    const sections = [];
    const cines = w.cines || [];
    if (cut.length) sections.push(['o-cut', 'Выкройка']);
    if (cines.length) sections.push(['o-cines', 'Катсцены облика']);
    if (w.origin) sections.push(['o-origin', 'Откуда наряд']);
    if (w.theme) sections.push(['o-theme', 'Что наряд говорит о герое']);
    sections.push(['o-get', 'Как получить']);
    if (trivia.length) sections.push(['o-more', 'Мелочи']);
    const rackCell = (oid, side) => `${outfitLink(oid, art(`dressbust:${oid}`, 40, 40))}<br>${side === 'l' ? '&lt;&lt; ' : ''}${outfitLink(oid)}${side === 'r' ? ' &gt;&gt;' : ''}`;
    return `
      ${head(`«${o.name}»`, `${esc(o.kind || 'Особый наряд')} ${stars(o.rarity)} для героя ${owner}. Статья раздела «Гардероб» АстралВики '98.`)}
      <table class="hwk-fit"><tr>
        <td class="hwk-fit-cell">${before}<div class="hwk-fit-cap">Обычный наряд</div></td>
        <td class="hwk-fit-arrow">&gt;&gt;</td>
        <td class="hwk-fit-cell">${art(`dress:${id}:${trail ? 'mf' : 'm'}`, 228, 288)}<div class="hwk-fit-cap">«${esc(o.name)}»${trail ? ', Келус и Стелла' : ''}</div></td>
        <td class="hwk-fit-tagcell">${outfitTag(id)}</td>
      </tr></table>
      <p class="hwk-lead"><span class="hwk-small">Витрина Снабжения:</span> ${esc(o.text)}</p>
      ${toc(sections)}
      ${cut.length ? `${section('o-cut', `Выкройка (${cut.length} ${plural(cut.length, 'деталь', 'детали', 'деталей')})`)}
        <table class="hwk-pattern">
          ${cut.map(([part, desc], i) => `<tr><td class="hwk-pat-n">${String(i + 1).padStart(2, '0')}</td><td class="hwk-pat-k">${esc(part)}</td><td>${esc(desc)}</td></tr>`).join('')}
        </table>` : ''}
      ${cines.length ? `${section('o-cines', 'Катсцены облика')}
        <table class="hwk-pattern">
          ${cines.map(([part, desc], i) => `<tr><td class="hwk-pat-n">${String(i + 1).padStart(2, '0')}</td><td class="hwk-pat-k">${esc(part)}</td><td>${esc(desc)}</td></tr>`).join('')}
        </table>` : ''}
      ${w.origin ? `${section('o-origin', 'Откуда наряд')}<p class="hwk-p">${formatWikiText(w.origin)}</p>` : ''}
      ${w.theme ? `${section('o-theme', 'Что наряд говорит о герое')}
        <div class="hwk-essay">${formatWikiText(w.theme)}</div>
        <p class="hwk-small">Дуга героя подробно разобрана в статье ${owner}: <b>${esc(deriveCharArc(o.char).arcType)}</b>.</p>` : ''}
      ${section('o-get', 'Как получить')}
      <ol class="hwk-steps">
        ${howGet.map(s => `<li>${formatWikiText(s)}</li>`).join('')}
        <li>Надеть наряд можно в меню героя: Персонажи, раздел «Наряды». Наряд виден в меню, на карте и в бою.</li>
      </ol>
      ${trivia.length ? `${section('o-more', 'Мелочи')}<ul class="hwk-notes">${trivia.map(t => `<li>${formatWikiText(t)}</li>`).join('')}</ul>` : ''}
      <table class="hwk-rack"><tr>
        <td width="33%">${rackCell(prev, 'l')}</td>
        <td width="34%" align="center">Гардероб: ${at + 1} из ${ids.length}<br>${A(`${HOST}/artifacts`, 'Все наряды и питомцы в каталоге')}</td>
        <td width="33%" align="right">${rackCell(next, 'r')}</td>
      </tr></table>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  const PET_POSES = [
    ['front-sit', 'Сидит', null],
    ['front-groom', 'Умывается', null],
    ['front-yawn', 'Зевает', null],
    ['front-squint', 'Чихает огнём', 'fire'],
    ['side-fly', 'Догоняет отряд', 'fly'],
    ['side-hiss', 'Шипит', null],
    ['front-sleep', 'Спит', null]
  ];

  function petMood(pt, cid, tune) {
    const out = [];
    if ((pt.likes || []).includes(cid)) out.push('Когда герой ведёт отряд, иногда мурлычет и ластится к нему.');
    if ((pt.fears || []).includes(cid)) out.push('Держится на два шага позади, шипит и не даётся гладить.');
    if ((pt.lazy || []).includes(cid)) out.push(`Засыпает уже через ${tune.lazySleep} с без движения, а не через ${tune.sleepAfter} с.`);
    return out.length ? out.join(' ') : 'Ведёт себя как с любым лидером.';
  }

  function renderPetArticle(route) {
    const h = H(), id = route.id, pt = h.PETS[id];
    const w = (D().pets || {})[id] || {};
    const tune = h.PET_TUNE || { sleepAfter: 24, lazySleep: 9, flyFrom: 3, lost: 9, actMin: 3.5, actRand: 4.5 };
    const L = pt.look || {};
    const ids = petIds(), no = String(ids.indexOf(id) + 1).padStart(3, '0');
    const swatch = (col, label) => `<span class="hwk-swatch" style="background-color:${webSafe(col)};">&nbsp;&nbsp;&nbsp;</span>${label ? ` ${esc(label)}` : ''}`;
    const home = pt.home && h.MAPS && h.MAPS[pt.home] ? A(`${HOST}/atlas?map=${pt.home}`, esc(h.MAPS[pt.home].name)) : 'нет';
    const owner = w.owner && h.CHARS[w.owner] ? A(`${HOST}/char?id=${w.owner}`, esc(h.CHARS[w.owner].name)) : 'экипаж Экспресса';
    const crew = [...new Set([...(pt.likes || []), ...(pt.fears || []), ...(pt.lazy || []), ...Object.keys(pt.leader || {})])].filter(cid => h.CHARS[cid]);
    const poses = PET_POSES.filter(p => !p[2] || pt[p[2]]);
    const field = (k, v) => `<tr><td class="hwk-pp-k">${k}</td><td class="hwk-pp-v">${v}</td></tr>`;
    const sections = [['p-album', 'Фотоальбом'], ['p-habits', 'Привычки'], ['p-crew', 'Кого любит и кого боится'], ['p-day', 'Распорядок'], ['p-voice', 'Голос']];
    if (w.origin) sections.push(['p-origin', 'Откуда она']);
    if (w.theme) sections.push(['p-theme', 'Зачем отряду кошка']);
    sections.push(['p-care', 'Как завести']);
    if ((w.trivia || []).length) sections.push(['p-more', 'Мелочи']);
    const day = [
      ['Идёт за лидером', 'Ступает по его следам на шаг позади.'],
      ['Отстала', pt.fly ? `Если отстала на ${tune.flyFrom} шага и больше, взлетает и догоняет на крыльях.` : 'Ускоряет шаг и догоняет.'],
      ['Потерялась', `Дальше ${tune.lost} шагов от лидера (телепорт, другая карта) просто появляется рядом снова.`],
      ['Стоянка', `Каждые ${tune.actMin}-${tune.actMin + tune.actRand} с чем-нибудь занята: умывается, зевает, оглядывается, отходит на шаг-другой${pt.fire ? ', чихает огнём' : ''}.`],
      ['Сон', `После ${tune.sleepAfter} с без движения сворачивается клубком. Просыпается, когда отряд пойдёт или её погладят.`]
    ];
    return `
      ${head(`Питомец: ${pt.name}`, "Паспорт питомца Звёздного экспресса. Статья раздела «Гардероб» АстралВики '98.")}
      <table class="hwk-passport">
        <tr><th colspan="2">ПАСПОРТ ПИТОМЦА № ${no}</th></tr>
        <tr>
          <td class="hwk-pp-photo">${art(`pet:${id}:front-sit`, 108, 108)}<div class="hwk-small">фото 3x4</div></td>
          <td>
            <table class="hwk-pp-fields">
              ${field('Кличка', `<b>${esc(pt.name)}</b>`)}
              ${field('Вид', esc(w.species || pt.kind))}
              ${field('Окрас', `${swatch(L.fur, 'шерсть')} &nbsp; ${swatch(L.wing, 'крылья')}`)}
              ${field('Глаза', swatch(L.eye, w.eyes || ''))}
              ${field('Приметы', `${swatch(L.mark, '')} ${esc(w.marks || '')}`)}
              ${field('Хозяйка', owner)}
              ${field('Живёт', home)}
              ${field('Летает', pt.fly ? 'да' : 'нет')}
              ${field('Огонь', pt.fire ? 'чихает огнём' : 'нет')}
              ${field('Цена', `${pt.price} звёздного нефрита`)}
            </table>
          </td>
        </tr>
        <tr><td colspan="2" class="hwk-pp-foot"><span class="hwk-stamp">ДОПУСК НА ЭКСПРЕСС ВЫДАН</span> В бою и в характеристиках отряда ничего не меняет.</td></tr>
      </table>
      <p class="hwk-lead">${esc(pt.text)}</p>
      ${toc(sections)}
      ${section('p-album', 'Фотоальбом')}
      <div class="hwk-album-main">${art(`petstage:${id}`, 458, 180)}<div class="hwk-small">Гостиная особняка Казумы, витрина Снабжения.</div></div>
      <table class="hwk-album"><tr>
        ${poses.map(([spec, cap]) => `<td>${art(`pet:${id}:${spec}`, 72, 72)}<br>${esc(cap)}</td>`).join('')}
      </tr></table>
      ${section('p-habits', 'Привычки')}
      <ul class="hwk-notes">${(pt.habits || []).map(hb => `<li>${esc(hb)}</li>`).join('')}</ul>
      ${section('p-crew', 'Кого любит и кого боится')}
      <p class="hwk-small">Кошка смотрит только на лидера, то есть на первого героя в команде.</p>
      <table class="hwk-table">
        <tr><th width="20%">Лидер</th><th width="36%">Как ведёт себя ${esc(pt.name)}</th><th>Что говорит лидер</th></tr>
        ${crew.map((cid, i) => `<tr${alt(i)}>
          <td>${A(`${HOST}/char?id=${cid}`, art(`fig:${cid}`, 32, 32))} <b>${A(`${HOST}/char?id=${cid}`, esc(h.CHARS[cid].name))}</b></td>
          <td>${esc(petMood(pt, cid, tune))}</td>
          <td class="hwk-small">${((pt.leader || {})[cid] || []).map(l => esc(l)).join('<br>') || 'Молчит.'}</td>
        </tr>`).join('')}
      </table>
      <p class="hwk-small">Каждое третье поглаживание вызывает реплику лидера, если она у него есть.</p>
      ${section('p-day', 'Распорядок')}
      <table class="hwk-ladder">${day.map(([k, v]) => `<tr><td class="hwk-step">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
      ${section('p-voice', 'Голос')}
      <table class="hwk-table">
        <tr><td width="22%"><b>Мурлычет</b></td><td>${(pt.purr || []).map(s => `«${esc(s)}»`).join(' ')}</td></tr>
        <tr class="hwk-alt"><td><b>Шипит</b></td><td>${(pt.hiss || []).map(s => `«${esc(s)}»`).join(' ')}</td></tr>
        <tr><td><b>Спросонья</b></td><td>${(pt.sleepy || []).map(s => `«${esc(s)}»`).join(' ')}</td></tr>
      </table>
      ${w.origin ? `${section('p-origin', 'Откуда она')}<p class="hwk-p">${formatWikiText(w.origin)}</p>` : ''}
      ${w.theme ? `${section('p-theme', 'Зачем отряду кошка')}<div class="hwk-essay">${formatWikiText(w.theme)}</div>` : ''}
      ${w.spoiler ? spoilerBlock(`pet_${id}`, w.spoiler.title, `<p class="hwk-p">${formatWikiText(w.spoiler.text)}</p>`) : ''}
      ${section('p-care', 'Как завести')}
      <ol class="hwk-steps">${(w.care || []).map(s => `<li>${formatWikiText(s)}</li>`).join('')}</ol>
      ${(w.notes || []).length ? `<ul class="hwk-notes">${w.notes.map(s => `<li>${formatWikiText(s)}</li>`).join('')}</ul>` : ''}
      ${(w.trivia || []).length ? `${section('p-more', 'Мелочи')}<ul class="hwk-notes">${w.trivia.map(t => `<li>${formatWikiText(t)}</li>`).join('')}</ul>` : ''}
      <p class="hwk-small">${A(`${HOST}/artifacts`, '&lt;&lt; Все наряды и питомцы в каталоге')}</p>
      ${renderUserAmendmentBox(route.pageId, route)}`;
  }

  function indexEntries() {
    const h = H(), d = D();
    const out = [];
    for (const id of characterIds()) out.push([h.CHARS[id].name, `${HOST}/char?id=${id}`, 'персонаж']);
    for (const id of mapIds()) out.push([h.MAPS[id].name, `${HOST}/atlas?map=${id}`, 'карта']);
    for (const id of docIds()) out.push([h.DOCS[id].title, `${HOST}/doc?id=${id}`, 'документ']);
    for (const id of coneIds()) out.push([h.CONES[id].name, `${HOST}/cone?id=${id}`, 'световой конус']);
    for (const id of outfitIds()) out.push([h.OUTFITS[id].name, `${HOST}/outfit?id=${id}`, 'наряд']);
    for (const id of petIds()) out.push([h.PETS[id].name, `${HOST}/pet?id=${id}`, 'питомец']);
    for (const s of d.systems) out.push([s.title, `${HOST}/system?id=${s.id}`, 'трактат']);
    for (const f of d.factions) out.push([f.name, `${HOST}/faction?id=${f.id}`, 'фракция']);
    for (const w of d.worlds) out.push([w.name, `${HOST}/world?id=${w.id}`, 'мир']);
    for (const p of d.puzzles) out.push([p.title, `${HOST}/puzzle?id=${p.id}`, 'загадка']);
    for (const c of d.themes.controllingIdeas) out.push([c.title, `${HOST}/theme?id=${c.id}`, 'разбор главы']);
    for (const a of d.themes.antagonists) out.push([a.name, `${HOST}/theme?id=${a.id}`, 'антагонист']);
    for (const m of d.themes.motifs) out.push([m.name, `${HOST}/theme?id=${m.id}`, 'мотив']);
    return out.map(([t, u, k]) => [normText(t).replace(/^[«"'(]+/, ''), u, k]).sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }

  function renderRecentAndIndex(route) {
    const d = D();
    const edits = Object.values(readEdits());
    const days = [];
    for (const r of d.revisions) {
      const day = r.date.split(' ')[0];
      let g = days.find(x => x.day === day);
      if (!g) { g = { day, items: [] }; days.push(g); }
      g.items.push(r);
    }
    const entries = indexEntries();
    const letters = [];
    for (const e of entries) {
      const L = e[0].charAt(0).toUpperCase();
      let g = letters.find(x => x.L === L);
      if (!g) { g = { L, items: [] }; letters.push(g); }
      g.items.push(e);
    }
    return `
      ${head('Свежие правки и указатель статей')}
      ${jumpbar([['r-rc', 'Свежие правки'], ['r-idx', `Указатель (${entries.length})`]])}
      ${section('r-rc', 'Свежие правки')}
      ${edits.length ? `<div class="hwk-rc-day">Ваши правки на этом компьютере</div>
        <ul class="hwk-rc">${edits.map(e => `<li>${A(pageUrl(e.pageId), esc(pageLabel(e.pageId)))} . . <b>${esc(e.author)}</b> . . ${esc(e.date)} . . <i>${esc(e.text.slice(0, 100))}</i></li>`).join('')}</ul>` : '<p class="hwk-small">Своих правок у вас пока нет. Откройте любую статью и нажмите «Править текст этой страницы» внизу.</p>'}
      ${days.map(g => `<div class="hwk-rc-day">${esc(g.day)}</div>
        <ul class="hwk-rc">${g.items.map(r => `<li><span class="hwk-mono">${esc(r.date.split(' ')[1] || '')}</span> ${A(pageUrl(r.page), esc(pageLabel(r.page)))} . . <b>${esc(r.user)}</b> . . <i>${esc(r.note)}</i></li>`).join('')}</ul>`).join('')}
      ${section('r-idx', `Указатель всех статей (${entries.length})`)}
      <div class="hwk-letters">${letters.map((g, i) => jump(`r-l${i}`, esc(g.L))).join(' | ')}</div>
      <div class="hwk-index">
        ${letters.map((g, i) => `${anchorTag(`r-l${i}`)}<div class="hwk-letter">${esc(g.L)}</div>
          ${g.items.map(e => `${A(e[1], esc(e[0]))} <span class="hwk-small hwk-dim">${e[2]}</span>`).join('<br>')}`).join('')}
      </div>
      ${topLink()}`;
  }

  function searchArticles(query) {
    const q = normText(query || '').trim().toLowerCase();
    if (!q) return [];
    const results = [];
    const h = H(), d = D();

    for (const s of (d ? d.systems : [])) {
      const hay = `${s.title} ${s.summary} ${s.body.join(' ')}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Космология: ${s.title}`, url: `${HOST}/system?id=${s.id}`, snippet: s.summary });
    }
    for (const f of (d ? d.factions : [])) {
      const hay = `${f.name} ${f.world} ${f.goal} ${f.body}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Фракция: ${f.name}`, url: `${HOST}/faction?id=${f.id}`, snippet: f.goal });
    }
    for (const w of (d ? d.worlds : [])) {
      const hay = `${w.name} ${w.customs} ${w.body}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Мир: ${w.name}`, url: `${HOST}/world?id=${w.id}`, snippet: w.customs });
    }
    for (const id of characterIds()) {
      const c = h.CHARS[id];
      const inf = (h.INFO && h.INFO[id]) || {};
      const hay = `${id} ${c.name} ${c.fullName || ''} ${inf.aka || ''} ${inf.faction || ''} ${inf.home || ''} ${inf.about || ''}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Персонаж: ${c.fullName || c.name}`, url: `${HOST}/char?id=${id}`, snippet: inf.about || `${h.PATHS[c.path].name} / ${h.ELEMENTS[c.elem].name}` });
    }
    for (const ci of (d ? d.themes.controllingIdeas : [])) {
      const hay = `${ci.title} ${ci.act} ${ci.controllingIdea} ${ci.summary}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Тематика: ${ci.title}`, url: `${HOST}/theme?id=${ci.id}`, snippet: ci.controllingIdea });
    }
    for (const a of (d ? d.themes.antagonists : [])) {
      const hay = `${a.name} ${a.role} ${a.whySheBelievesSheIsRight}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Антагонист: ${a.name}`, url: `${HOST}/theme?id=${a.id}`, snippet: a.whySheBelievesSheIsRight });
    }
    for (const m of (d ? d.themes.motifs : [])) {
      const hay = `${m.name} ${m.symbol} ${m.meaning}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Мотив: ${m.name}`, url: `${HOST}/theme?id=${m.id}`, snippet: m.meaning });
    }
    for (const p of (d ? d.puzzles : [])) {
      const hay = `${p.title} ${p.zone} ${p.summary} ${p.steps.join(' ')}`.toLowerCase();
      if (hay.includes(q)) results.push({ title: `Загадка: ${p.title}`, url: `${HOST}/puzzle?id=${p.id}`, snippet: p.summary });
    }
    for (const id of mapIds()) {
      const m = h.MAPS[id];
      if (`${id} ${m.name} ${sectorOf(id)}`.toLowerCase().includes(q)) {
        results.push({ title: `Карта локации: ${m.name}`, url: `${HOST}/atlas?map=${id}`, snippet: `Сектор: ${sectorOf(id)}` });
      }
    }
    for (const id of coneIds()) {
      const c = h.CONES[id];
      const a = coneArticle(id) || {};
      const hay = `${id} ${c.name} ${c.skill || ''} ${c.text || ''} ${c.desc || ''} ${a.who || ''} ${a.scene || ''} ${a.memory || ''}`.toLowerCase();
      if (normText(hay).includes(q)) results.push({ title: `Световой конус: ${c.name}`, url: `${HOST}/cone?id=${id}`, snippet: a.who || c.text || '' });
    }
    for (const id of docIds()) {
      const doc = h.DOCS[id];
      const txt = doc.text || '';
      if (`${id} ${doc.title} ${doc.sub || ''} ${txt}`.toLowerCase().includes(q)) {
        results.push({ title: `Документ: ${doc.title}`, url: `${HOST}/doc?id=${id}`, snippet: doc.sub || txt.slice(0, 120) });
      }
    }
    for (const id of outfitIds()) {
      const o = h.OUTFITS[id], w = (d && d.outfits && d.outfits[id]) || {};
      const hay = `${id} ${o.name} ${h.CHARS[o.char] ? h.CHARS[o.char].name : ''} ${o.text} ${(w.cut || []).map(x => x.join(' ')).join(' ')} ${w.origin || ''}`.toLowerCase();
      if (normText(hay).includes(q)) results.push({ title: `Наряд: «${o.name}»`, url: `${HOST}/outfit?id=${id}`, snippet: o.text });
    }
    for (const id of petIds()) {
      const pt = h.PETS[id], w = (d && d.pets && d.pets[id]) || {};
      const hay = `${id} ${pt.name} ${pt.kind} ${pt.text} ${(pt.habits || []).join(' ')} ${w.species || ''} ${w.origin || ''}`.toLowerCase();
      if (normText(hay).includes(q)) results.push({ title: `Питомец: ${pt.name}`, url: `${HOST}/pet?id=${id}`, snippet: pt.text });
    }
    return results.slice(0, 40);
  }

  function renderSearchView(route) {
    const q = route.params.q || '';
    const res = searchArticles(q);
    return `
      ${head(`Поиск: «${q}»`, `Найдено страниц: ${res.length}${res.length >= 40 ? ' (показаны первые 40)' : ''}`)}
      ${res.length ? `<ol class="hwk-results">
        ${res.map(r => {
          const [kind, ...rest] = r.title.split(': ');
          return `<li><span class="hwk-kind">${esc(kind)}</span> <b>${A(r.url, esc(rest.join(': ') || kind))}</b><br>
            ${esc(r.snippet)}<br>
            <span class="hwk-url">${esc(r.url)}</span></li>`;
        }).join('')}
      </ol>` : `<div class="hwk-nopage">
        <p class="hwk-p">По запросу <b>«${esc(q)}»</b> ничего не нашлось.</p>
        <p class="hwk-p">Попробуйте имя персонажа (Броня, Кафка, Сюэи), термин (Стелларон, Эон, Фрагментум) или название места. Все статьи перечислены в ${A(`${HOST}/recent`, 'указателе')}.</p>
      </div>`}`;
  }

  function renderMissing(route) {
    const tail = String(route.raw || '').replace(/^https?:\/{2}[^/]+/i, '') || '/';
    const guess = tail.replace(/[/?=&_.-]+/g, ' ').trim().split(' ').pop() || '';
    return `
      ${head('Такой страницы ещё нет')}
      <div class="hwk-nopage">
        <p class="hwk-p">Страницы <span class="hwk-mono">${esc(tail)}</span> в Архиве нет. Возможно, адрес набран с ошибкой или статья ещё не написана.</p>
        <ul>
          ${guess ? `<li>${A(`${HOST}/search?q=${encodeURIComponent(guess)}`, `Поискать «${esc(guess)}» по Архиву`)}</li>` : ''}
          <li>${A(`${HOST}/recent`, 'Открыть указатель всех статей')}</li>
          <li>${A(HOST, 'Вернуться на заглавную страницу')}</li>
        </ul>
      </div>`;
  }

  function randomUrl() {
    const cIds = characterIds();
    const sysIds = (D().systems || []).map(s => s.id);
    const puzIds = (D().puzzles || []).map(p => p.id);
    const pool = [
      ...cIds.map(id => `${HOST}/char?id=${id}`),
      ...sysIds.map(id => `${HOST}/system?id=${id}`),
      ...puzIds.map(id => `${HOST}/puzzle?id=${id}`),
      ...coneIds().map(id => `${HOST}/cone?id=${id}`),
      ...outfitIds().map(id => `${HOST}/outfit?id=${id}`),
      ...petIds().map(id => `${HOST}/pet?id=${id}`)
    ];
    return pool[Math.floor(Math.random() * pool.length)] || HOST;
  }

  function expressSvg() {
    const cars = [0, 1, 2].map(c => {
      const cx = -c * 118;
      const windows = [0, 1, 2, 3, 4, 5].map(k => `<rect x="${cx - 102 + k * 18}" y="-16" width="10" height="8" fill="#ffcc66"/>`).join('');
      return `<rect x="${cx - 110}" y="-26" width="112" height="30" fill="#000033"/>
        <rect x="${cx - 110}" y="-26" width="112" height="6" fill="#333366"/>
        ${windows}
        <rect x="${cx - 110}" y="-4" width="112" height="6" fill="#990033"/>
        <rect x="${cx - 110}" y="2" width="112" height="2" fill="#cc9933"/>
        <rect x="${cx - 103}" y="2" width="14" height="12" fill="#000000"/><rect x="${cx - 98}" y="6" width="4" height="4" fill="#666666"/>
        <rect x="${cx - 29}" y="2" width="14" height="12" fill="#000000"/><rect x="${cx - 24}" y="6" width="4" height="4" fill="#666666"/>`;
    }).join('');
    return `<g transform="translate(716 69) scale(0.62)">
      ${cars}
      <polygon points="0,-30 30,-30 48,-14 52,6 0,6" fill="#000033"/>
      <rect x="0" y="-10" width="40" height="6" fill="#990033"/>
      <rect x="0" y="2" width="52" height="2" fill="#cc9933"/>
      <rect x="8" y="-44" width="10" height="16" fill="#000033"/>
      <rect x="6" y="-46" width="14" height="3" fill="#cc9933"/>
      <rect x="46" y="-9" width="6" height="6" fill="#ccffff"/>
      <rect x="10" y="2" width="14" height="12" fill="#000000"/><rect x="15" y="6" width="4" height="4" fill="#666666"/>
    </g>`;
  }

  function mastheadSvg() {
    const stars = [[402, 14, '#ffffff'], [455, 30, '#9999cc'], [520, 12, '#ffcc66'], [588, 24, '#ffffff'], [640, 9, '#9999cc'], [700, 18, '#ffffff'], [744, 34, '#ffcc66'], [366, 36, '#6666cc'], [612, 40, '#6666cc'], [480, 46, '#ffffff']]
      .map(([x, y, c]) => `<rect x="${x}" y="${y}" width="2" height="2" fill="${c}"/>`).join('');
    const sleepers = [];
    for (let x = 4; x < 756; x += 12) sleepers.push(`<rect x="${x}" y="76" width="3" height="10" fill="#663300"/>`);
    return `<svg width="756" height="86" viewBox="0 0 756 86" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect width="756" height="86" fill="#330066"/>
      ${stars}
      ${sleepers.join('')}
      <rect x="0" y="78" width="756" height="2" fill="#cccccc"/>
      <rect x="0" y="83" width="756" height="2" fill="#999999"/>
      ${expressSvg()}
      <text x="18" y="44" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-weight="bold" fill="#990033">АстралВики <tspan fill="#000033">'98</tspan></text>
      <text x="16" y="42" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-weight="bold" fill="#ffcc66">АстралВики <tspan fill="#ffffff">'98</tspan></text>
      <text x="18" y="62" font-family="Verdana, Tahoma, sans-serif" font-size="11" fill="#ccccff">свободная энциклопедия по Honkai: Star Rail 98, которую пишут сами пассажиры</text>
      <text x="748" y="14" text-anchor="end" font-family="Verdana, Tahoma, sans-serif" font-size="9" fill="#9999cc">статей в Архиве: ${totalArticleCount()}</text>
    </svg>`;
  }

  function railNav(curSec) {
    return `<table class="hwk-rail-t"><tr>${STATIONS.map(([key, path, label]) => `<td class="hwk-stn${curSec === key ? ' is-here' : ''}">
      <span class="hwk-stn-post"></span>
      ${A(HOST + path, esc(label), 'hwk-plate')}
    </td>`).join('')}</tr></table>`;
  }

  function footerHtml(route, title) {
    const ring = `<div class="hwk-ring">Кольцо сайтов «Серебряная колея»: [${A('http://hsr.hoyoverse.com', '&lt;&lt; hsr.hoyoverse.com')}] [${A(randomUrl(), 'случайная статья')}] [${A('http://www.kovcheg98.ru/hsr98/', 'kovcheg98.ru &gt;&gt;')}]</div>`;
    const buttons = `<div class="hwk-buttons">
      <span class="hwk-b88 hwk-b88-ie"><span>Internet<br>Explorer 5.0</span></span>
      <span class="hwk-b88 hwk-b88-cp"><span>Кодировка<br>Win-1251</span></span>
      <span class="hwk-b88 hwk-b88-perl"><span>Powered by<br>Perl CGI</span></span>
      ${A('http://hsr.hoyoverse.com', '<span>HSR 98<br>играть даром</span>', 'hwk-b88 hwk-b88-hsr')}
    </div>`;
    const optim = '<div class="hwk-optim">АстралВики \'98 (www.astralwiki98.ru) делают поклонники игры, официальный сайт: hsr.hoyoverse.com. Лучше всего смотреть в Microslop Internet Explorer 5.0 при 800x600, Win 98 SE.</div>';
    if (route.view === 'missing' || route.view === 'search') return `<hr>${ring}${buttons}${optim}`;
    const last = lastEdit(route.pageId);
    const talkCount = readTalk(route.pageId).length;
    return `<hr>
      <div class="hwk-foot-act">
        ${A(modeUrl(route, 'edit'), 'Править текст этой страницы')} |
        ${A(modeUrl(route, 'talk'), `Обсуждение (${talkCount})`)} |
        ${A(modeUrl(route, 'history'), 'Другие версии')} |
        <a href="#" data-aw-export="1" data-aw-export-title="${esc(title)}">Сохранить в Блокнот</a> |
        ${A(`${HOST}/recent`, 'Указатель')}
      </div>
      <div>Последнее изменение: ${esc(last.date)} (${esc(last.user)})</div>
      ${ring}${buttons}${optim}`;
  }

  function renderSite(url) {
    const route = parseUrl(url);
    const curSec = navSectionFor(route.view);
    const title = getPageTitle(url).replace(/ - АстралВики 98$/, '');
    const spOpen = spoilersOpen();
    const talkCount = route.pageId && route.view !== 'search' ? readTalk(route.pageId).length : 0;

    let bodyHtml = '';
    if (route.view === 'missing') {
      bodyHtml = renderMissing(route);
    } else if (route.mode !== 'read') {
      bodyHtml = renderModeView(route, title, `Дополнение архивиста к странице «${title}»:\nСм. также [[char:trail|Первопроходец]] и [[sys:paths_aeons|Эоны и Пути]].`);
    } else {
      switch (route.view) {
        case 'home': bodyHtml = renderHome(route); break;
        case 'systems': bodyHtml = renderSystemsHub(route); break;
        case 'system': bodyHtml = renderSystemArticle(route); break;
        case 'factions': bodyHtml = renderFactionsHub(route); break;
        case 'faction': bodyHtml = renderFactionArticle(route); break;
        case 'world': bodyHtml = renderWorldArticle(route); break;
        case 'atlas': bodyHtml = renderAtlasHub(route); break;
        case 'map': bodyHtml = renderMapArticle(route); break;
        case 'doc': bodyHtml = renderDocArticle(route); break;
        case 'chars': bodyHtml = renderCharsHub(route); break;
        case 'char': bodyHtml = renderCharArticle(route); break;
        case 'themes': bodyHtml = renderThemesHub(route); break;
        case 'theme': bodyHtml = renderThemeArticle(route); break;
        case 'quests': bodyHtml = renderQuestsHub(route); break;
        case 'quest': bodyHtml = renderQuestArticle(route); break;
        case 'puzzle': bodyHtml = renderPuzzleArticle(route); break;
        case 'artifacts': bodyHtml = renderArtifactsHub(route); break;
        case 'cone': bodyHtml = renderConeArticle(route); break;
        case 'outfit': bodyHtml = renderOutfitArticle(route); break;
        case 'pet': bodyHtml = renderPetArticle(route); break;
        case 'recent': bodyHtml = renderRecentAndIndex(route); break;
        case 'search': bodyHtml = renderSearchView(route); break;
        default: bodyHtml = renderMissing(route);
      }
    }

    const station = STATIONS.find(s => s[0] === curSec);
    const showCrumbs = route.view !== 'missing' && route.view !== 'home' && route.view !== 'search';
    const crumbs = showCrumbs ? `<tr><td class="hwk-crumbs">
      <span class="hwk-modes">
        ${A(modeUrl(route, 'read'), 'Статья', route.mode === 'read' ? 'is-active' : '')}
        ${A(modeUrl(route, 'edit'), 'Править', route.mode === 'edit' ? 'is-active' : '')}
        ${A(modeUrl(route, 'talk'), `Обсуждение (${talkCount})`, route.mode === 'talk' ? 'is-active' : '')}
        ${A(modeUrl(route, 'history'), 'История', route.mode === 'history' ? 'is-active' : '')}
      </span>
      ${A(HOST, 'АстралВики')}${station && station[0] !== 'home' && basePageUrl(route) !== HOST + station[1] ? ` &gt; ${A(HOST + station[1], esc(station[2]))}` : ''} &gt; <b>${esc(title)}</b>
    </td></tr>` : '';

    return `<div class="hwk-root">${anchorTag('hwk-top')}
      <table class="hwk-page" cellspacing="0" cellpadding="0">
        <tr><td class="hwk-mast">${A(HOST, mastheadSvg())}</td></tr>
        <tr><td class="hwk-rail">${railNav(curSec)}</td></tr>
        <tr><td class="hwk-tools">
          <span style="float:right;">Спойлеры сюжета: <button type="button" class="hwk-btn${spOpen ? ' hwk-btn-hi' : ''}" data-aw-toggle-spoilers="1">${spOpen ? 'открыты' : 'скрыты'}</button></span>
          Поиск по Архиву: <input type="text" class="hwk-input" size="26" data-aw-search-input value="${esc(route.params && route.params.q ? route.params.q : '')}">
          <button type="button" class="hwk-btn hwk-btn-hi" data-aw-search-btn="1">Найти</button>
          <button type="button" class="hwk-btn" data-aw-random="1">Случайная статья</button>
        </td></tr>
        ${crumbs}
        <tr><td class="hwk-body">${bodyHtml}</td></tr>
        <tr><td class="hwk-foot">${footerHtml(route, title)}</td></tr>
      </table>
    </div>`;
  }

  function paintWardrobe(cv, spec) {
    const h = H();
    const g = cv.getContext('2d');
    if (!h || !h.Gfx || !g) return;
    const G = h.Gfx;
    const [kind, id, arg] = spec.split(':');
    const fit = src => { g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, cv.width, cv.height); };
    if (kind === 'dressbust' && h.OUTFITS[id]) fit(G.bustCanvas(h.outfitLook(id, 'm'), cv.width));
    else if (kind === 'dress' && h.OUTFITS[id]) paintDress(g, cv, id, arg);
    else if (kind === 'pet' && h.PETS && h.PETS[id] && h.petCanvas) {
      const [view, pose] = String(arg || 'front-sit').split('-');
      fit(h.petCanvas(id, view, pose, 0));
    } else if (kind === 'petstage' && h.PETS && h.PETS[id]) paintPetStage(g, cv, id);
  }

  function paintDress(g, cv, id, sex) {
    const h = H(), G = h.Gfx;
    const sc = typeof h.outfitShowcase === 'function' ? h.outfitShowcase(id) : null;
    if (sc && sc.width) {
      const k = Math.max(cv.width / sc.width, cv.height / sc.height);
      g.imageSmoothingEnabled = true;
      g.drawImage(sc, (cv.width - sc.width * k) / 2, cv.height - sc.height * k, sc.width * k, sc.height * k);
    }
    const scale = Math.max(1, Math.floor(cv.height * 0.72 / (G.FIG_H || 96)));
    const foot = cv.height - 10;
    const looks = sex === 'mf' ? [h.outfitLook(id, 'm'), h.outfitLook(id, 'f')] : [h.outfitLook(id, 'm')];
    looks.forEach((look, i) => {
      const x = looks.length > 1 ? cv.width * (i ? 0.7 : 0.3) : cv.width / 2;
      g.globalAlpha = 0.3;
      g.fillStyle = '#000000';
      g.beginPath();
      g.ellipse(x, foot, 12 * scale, 3 * scale, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      G.drawFigure(g, look, x, foot, scale);
    });
  }

  function paintPetStage(g, cv, id) {
    const h = H();
    const stage = typeof h.petStage === 'function' ? h.petStage(id) : null;
    if (stage && stage.width) {
      g.imageSmoothingEnabled = false;
      g.drawImage(stage, 0, 0, cv.width, cv.height);
    }
    if (!h.petCanvas) return;
    const pc = h.petCanvas(id, 'front', 'sit', 0);
    const scale = Math.max(2, Math.floor(cv.height / 45));
    const size = (pc.width || 18) * scale;
    const ground = Math.round(cv.height * 0.87);
    const x = Math.round(cv.width * 0.42);
    g.globalAlpha = 0.3;
    g.fillStyle = '#000000';
    g.beginPath();
    g.ellipse(x, ground + 2, size * 0.36, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = false;
    g.drawImage(pc, x - size / 2, ground + Math.round(scale * 1.5) - size, size, size);
  }

  function paintArt(cv) {
    if (!cv || !cv.getContext) return;
    const g = cv.getContext('2d');
    if (g) {
      g.fillStyle = '#000033';
      g.fillRect(0, 0, cv.width, cv.height);
    }
    if (/^(dress|dressbust|pet|petstage):/.test(cv.dataset.awArt || '')) {
      cv.dataset.art = cv.dataset.awArt;
      try {
        paintWardrobe(cv, cv.dataset.awArt);
      } catch (e) {}
      return;
    }
    if (cv.dataset.awArt && cv.dataset.awArt.startsWith('cone:')) {
      cv.dataset.art = cv.dataset.awArt;
      paintCone(cv, cv.dataset.awArt.slice(5));
      return;
    }
    if (window.hsrSite && typeof window.hsrSite.paintArt === 'function' && cv.dataset.awArt) {
      let spec = cv.dataset.awArt;
      const aliases = {
        'still:meadow': 'still:jarilo',
        'item:cone_exp2': 'item:exp2',
        'foe:cocolia': 'foe:cocolia1',
        'foe:svarog': 'foe:svarog_b'
      };
      if (aliases[spec]) spec = aliases[spec];
      if (spec.startsWith('fig:') && cv.width === cv.height) {
        const parts = spec.split(':');
        spec = `bust:${parts[1]}:${cv.width}`;
      }
      cv.dataset.art = spec;
      try {
        window.hsrSite.paintArt(cv);
      } catch (e) {}
    }
  }

  function paintCone(cv, id) {
    const h = H();
    if (!h || !h.Gfx || !h.CONES || !h.CONES[id]) return;
    const g = cv.getContext('2d');
    if (!g) return;
    const draw = src => { g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, cv.width, cv.height); };
    const pix = h.CONE_PIX && h.CONE_PIX[id];
    if (pix && typeof Image !== 'undefined') {
      const im = new Image();
      im.onload = () => draw(im);
      im.src = pix;
      if (im.complete && im.naturalWidth) draw(im);
      return;
    }
    try {
      draw(h.Gfx.coneArt(id, cv.width, cv.height));
    } catch (e) {}
  }

  const TILE_COLORS = {
    wall: '#000033', floor: '#cccc99', floor2: '#cccc99', floor3: '#999966', floor4: '#cccccc', floor5: '#999999',
    road: '#999999', rail: '#996633', bridge: '#996633', chasm: '#003366', tree: '#336633', crate: '#996633',
    pipe: '#666666', console: '#336699', house: '#663333', window: '#336699', housedoor: '#663333', door: '#cc9966',
    rock: '#666666', lamp: '#ffff99', fence: '#663300', gate: '#663300', statue: '#999999', table: '#996633',
    crystal: '#99ccff', stairs: '#cccccc', shelf: '#663300', block: '#333366', marvel: '#cc99ff'
  };

  const ENT_COLORS = { chest: '#ffcc00', doc: '#ffffff', anchor: '#33ff33', npc: '#66ccff', foe: '#ff3333', exit: '#ff9900' };

  function paintMap(cv) {
    if (!cv || !cv.getContext) return;
    const h = H();
    const id = cv.dataset.awMap;
    const m = h && h.MAPS ? h.MAPS[id] : null;
    if (!m) return;
    const g = cv.getContext('2d');
    const rows = m.rows || [];
    const sz = mapSize(m);
    const rh = sz.h || 1;
    const rw = sz.w || 1;
    const tiles = h.TILES || {};
    g.fillStyle = '#000033';
    g.fillRect(0, 0, cv.width, cv.height);
    const cell = Math.max(1, Math.min(Math.floor(cv.width / rw), Math.floor(cv.height / rh)));
    const ox = Math.floor((cv.width - cell * rw) / 2);
    const oy = Math.floor((cv.height - cell * rh) / 2);
    const floorKind = tiles[m.floor || '.'] ? tiles[m.floor || '.'].kind : 'floor';
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        const ch = rows[y][x] || '#';
        const kind = tiles[ch] ? tiles[ch].kind : floorKind;
        g.fillStyle = TILE_COLORS[kind] || '#cccc99';
        g.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
    const dot = Math.max(2, cell);
    for (const e of mapEntities(id)) {
      const col = ENT_COLORS[e.kind];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(ox + e.x * cell - (dot - cell) / 2, oy + e.y * cell - (dot - cell) / 2, dot, dot);
    }
    const sp = spawnPoint(id);
    if (sp) {
      g.fillStyle = '#ff66ff';
      g.fillRect(ox + sp[0] * cell - (dot - cell) / 2, oy + sp[1] * cell - (dot - cell) / 2, dot, dot);
    }
  }

  function scrollToAnchor(container, anchor) {
    const target = container.querySelector(`[id="${anchor}"]`);
    if (!target || !target.getBoundingClientRect) return;
    const frame = (container.closest && container.closest('.ie-content-frame')) || container;
    const top = target.getBoundingClientRect().top - frame.getBoundingClientRect().top;
    frame.scrollTop += top - 4;
  }

  function attachEvents(win, container, ie) {
    const nav = (u) => {
      if (ie && typeof ie.navigate === 'function') ie.navigate(win, u);
      else if (window.appIE && typeof window.appIE.navigate === 'function') window.appIE.navigate(win, u);
    };
    const rerender = () => {
      const cur = (ie && ie.currentUrl) || HOST;
      if (ie && typeof ie.renderPage === 'function') ie.renderPage(win, cur);
    };

    if (!ie || !ie.currentUrl || parseUrl(ie.currentUrl).view === 'home') bumpVisits();

    container.querySelectorAll('canvas[data-aw-art]').forEach(cv => paintArt(cv));
    container.querySelectorAll('canvas[data-aw-map]').forEach(cv => paintMap(cv));

    const searchInput = container.querySelector('[data-aw-search-input]');
    const searchBtn = container.querySelector('[data-aw-search-btn]');
    const doSearch = () => {
      const q = searchInput ? searchInput.value.trim() : '';
      nav(`${HOST}/search?q=${encodeURIComponent(q)}`);
    };
    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
      });
    }

    container.querySelectorAll('[data-aw-jump]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        scrollToAnchor(container, a.dataset.awJump);
      });
    });

    container.querySelectorAll('[data-aw-random]').forEach(btn => {
      btn.addEventListener('click', () => nav(randomUrl()));
    });

    container.querySelectorAll('[data-aw-toggle-spoilers]').forEach(btn => {
      btn.addEventListener('click', () => {
        setSpoilersOpen(!spoilersOpen());
        rerender();
      });
    });

    container.querySelectorAll('[data-aw-spoiler-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.awSpoilerBtn;
        const box = container.querySelector(`[data-aw-spoiler-box="${id}"]`);
        if (!box) return;
        const body = box.querySelector('.hwk-spoiler-body');
        if (!body) return;
        const hidden = body.style.display === 'none';
        body.style.display = hidden ? 'block' : 'none';
        btn.textContent = hidden ? 'Скрыть' : 'Показать спойлер';
      });
    });

    container.querySelectorAll('[data-aw-ink]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-aw-ink-list] .hwk-ink').forEach(s => s.classList.remove('hwk-ink'));
        btn.disabled = true;
      });
    });

    container.querySelectorAll('[data-aw-check]').forEach(box => {
      box.addEventListener('change', () => setCheck(box.dataset.awCheck, box.dataset.awStep, box.checked));
    });

    container.querySelectorAll('[data-aw-save-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.dataset.awSaveEdit;
        const userEl = container.querySelector('[data-aw-edit-user]');
        const textEl = container.querySelector('[data-aw-edit-text]');
        saveCustomNote(pageId, userEl ? userEl.value : '', textEl ? textEl.value : '');
        const route = parseUrl((ie && ie.currentUrl) || HOST);
        nav(modeUrl(route, 'read'));
      });
    });

    container.querySelectorAll('[data-aw-reset-page]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        clearCustomNote(btn.dataset.awResetPage);
        const route = parseUrl((ie && ie.currentUrl) || HOST);
        nav(modeUrl(route, 'read'));
      });
    });

    container.querySelectorAll('[data-aw-talk-send]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.dataset.awTalkSend;
        const userEl = container.querySelector('[data-aw-talk-user]');
        const textEl = container.querySelector('[data-aw-talk-text]');
        if (addTalkPost(pageId, userEl ? userEl.value : '', textEl ? textEl.value : '')) {
          rerender();
        }
      });
    });

    container.querySelectorAll('[data-aw-export]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const title = btn.dataset.awExportTitle || 'AstralWiki';
        const bodyEl = container.querySelector('.hwk-body');
        const txt = bodyEl ? bodyEl.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : title;
        if (window.appNotepad && typeof window.appNotepad.open === 'function') {
          window.appNotepad.open(`${title}.txt`, `${title}\nИсточник: ${HOST}\n\n${txt}`);
        }
      });
    });

    container.querySelectorAll('[data-aw-steam]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (window.gameManager && typeof window.gameManager.showInSteam === 'function') {
          window.gameManager.showInSteam(btn.dataset.awSteam || 'hsr98');
        }
      });
    });

    container.querySelectorAll('[data-aw-launch]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const gm = window.gameManager;
        if (gm && gm.catalog && gm.catalog.hsr98 && typeof gm.catalog.hsr98.launch === 'function') {
          gm.catalog.hsr98.launch();
        }
      });
    });
  }

  const site = {
    host: HOST,
    editsKey: EDITS_KEY,
    talkKey: TALK_KEY,
    spoilerKey: SPOILER_KEY,
    hitsKey: HITS_KEY,
    checksKey: CHECKS_KEY,
    hitCounted: false,
    esc,
    normText,
    parseUrl,
    getPageTitle,
    renderSite,
    attachEvents,
    paintArt,
    paintMap,
    characterIds,
    mapIds,
    docIds,
    questIds,
    coneIds,
    outfitIds,
    petIds,
    coneHall,
    coneSources,
    coneEffectHtml,
    charGroups,
    formatWikiText,
    deriveCharArc,
    mapEntities,
    mapStats,
    renderAsciiMap,
    docPlaces,
    searchArticles,
    saveCustomNote,
    clearCustomNote,
    getCustomNote,
    readTalk,
    addTalkPost,
    readChecks,
    setCheck,
    visits,
    spoilersOpen,
    setSpoilersOpen
  };

  window.hsrWikiSite = site;
})();
