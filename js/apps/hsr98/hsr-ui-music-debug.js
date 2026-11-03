(function (H) {
  'use strict';
  const { HGT, C } = H.UI_CONST;
  const PART_ORDER = ['place', 'battle', 'story', 'song'];
  const EVENTS = { id: 'events', name: 'Прыжки событий', col: '#e88ad0' };
  const EXTRA = {
    sim: { name: 'Симуляция', album: 'herta', part: 'place', note: 'Терминалы Тестового вагона: «Рубеж Экспресса», «Валютные войны» и «Полигон».' },
    dungeon: { name: 'Подземелье', album: 'belzerg', part: 'place' },
    title: { name: 'Заставка', album: 'story', part: 'story' },
    final: { name: 'Финал', album: 'story', part: 'story' },
    signal: { name: 'Golden Sign', album: 'events', vars: { label: 'Вокал', list: [['Без вокала', 'signal'], ['Мужской', 'signal', 'm'], ['Женский', 'signal', 'f']] }, note: 'Поиск сигнала: ролик и появление агентов, поёт голос выпавшего агента.' },
    aria: { name: 'Aria of the Soul', album: 'events', note: 'Полуночный канал: ролик и появление героев.' },
    ccc: { name: 'Cosplay Convention Crisis', album: 'events', vars: { label: 'Фрагмент', list: [['Песня целиком', 'ccc'], ['Вступление лобби', 'cccLobby']] }, note: 'Кон-Тон: вступление по кругу на экране баннера, песня во время прыжка.' },
    amanda: { name: 'Тема Аманды', album: 'events', note: 'Кон-Тон: появление Аманды.' },
    makoto: { name: 'Тема Макото', album: 'events', note: 'Кон-Тон: появление Макото.' },
    talleah: { name: 'Тема Таллеи', album: 'events', note: 'Кон-Тон: появление Таллеи.' },
    konosubaEd: { name: 'Ano Hi no Mama no Bokura', album: 'belzerg', note: 'Титры события «Обмен отрядами».' }
  };
  const NOTES = {
    menu: 'Титульный экран и выход в титры.',
    crises: 'Все бои Виртуальной вселенной.'
  };
  const MIDI_INFO = {}, SONG_LEN = {}, USES = new Map();
  let LIST = null;

  const wrapIdx = (i, n) => ((i % n) + n) % n;
  const bare = name => String(name).replace(/^«/, '').replace(/»$/, '');
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const fileName = path => String(path).split('/').pop();
  const uniq = list => [...new Set(list)];
  const groups = () => H.RECORD_ALBUMS.concat([EVENTS]);
  const groupOf = id => groups().find(a => a.id === id) || EVENTS;
  const partName = part => (part === 'song' ? 'Песни' : H.RECORD_PARTS[part]);
  const keysOf = e => uniq([e.key].concat(e.alias, e.vars ? e.vars.list.map(v => v[1]) : []));
  const musicState = st => st.mu || (st.mu = { i: 0, v: 0, play: null });

  function debugMusicList() {
    if (LIST) return LIST;
    const out = [], recs = new Set(H.RECORDS.map(r => r.track));
    for (const rec of H.RECORDS) out.push({ key: rec.track, kind: 'track', rec, name: bare(rec.name), album: rec.album, part: rec.part, alias: [], note: NOTES[rec.track] });
    for (const [key, tr] of Object.entries(H.TRACKS)) {
      if (recs.has(key)) continue;
      const twin = tr.midi && out.find(e => H.TRACKS[e.key].midi === tr.midi);
      if (twin) { twin.alias.push(key); continue; }
      const x = EXTRA[key] || {};
      out.push({ key, kind: 'track', name: x.name || key, album: x.album || 'story', part: x.part || 'story', alias: [], note: x.note });
    }
    const inVars = new Set(Object.values(EXTRA).flatMap(x => (x.vars ? x.vars.list.map(v => v[1]) : [])));
    for (const key of Object.keys(H.SONGS)) {
      const x = EXTRA[key] || {};
      if (inVars.has(key) && !x.vars) continue;
      out.push({ key, kind: 'song', name: x.name || key, album: x.album || EVENTS.id, part: 'song', alias: [], vars: x.vars, note: x.note });
    }
    const order = groups().map(a => a.id);
    LIST = out.sort((a, b) => order.indexOf(a.album) - order.indexOf(b.album) || PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part));
    return LIST;
  }

  const entryOf = key => (key ? debugMusicList().find(e => keysOf(e).includes(key)) || null : null);
  const nameOf = key => { const e = entryOf(key); return e ? e.name : key; };
  const variant = (e, v) => (e.vars ? e.vars.list[wrapIdx(v || 0, e.vars.list.length)] : null);
  const songId = (e, v) => (variant(e, v) || [0, e.key])[1];

  function bossName(enc) {
    const list = enc.waves ? enc.waves[enc.waves.length - 1] : enc.enemies || [];
    const id = String(list[0] || '').split(':')[0];
    return (H.ENEMIES[id] && H.ENEMIES[id].name) || id;
  }

  function playsMusic(v, has, depth) {
    if (!v || typeof v !== 'object' || depth > 8) return false;
    if (Array.isArray(v)) return v.some(x => playsMusic(x, has, depth + 1));
    if (typeof v.music === 'string' && has(v.music)) return true;
    return Object.values(v).some(x => playsMusic(x, has, depth + 1));
  }

  function usesOf(e) {
    if (USES.has(e.key)) return USES.get(e.key);
    const keys = keysOf(e), has = id => keys.includes(id), out = [];
    const add = (label, list) => { if (list.length) out.push(label + (list.length > 3 ? ' (' + list.length + ')' : '') + ': ' + list.join(', ') + '.'); };
    const maps = Object.values(H.MAPS);
    add('Карты', uniq(maps.filter(m => has(m.music)).map(m => m.name)));
    add('Обычные бои', (H.WORLDS || []).filter(w => has(w.battle || 'battle')).map(w => w.name));
    add('Бои на картах', uniq(maps.filter(m => has(m.battleMusic)).map(m => m.name)));
    const fights = [];
    for (const x of Object.values(H.ENCOUNTERS)) {
      if (has(x.music)) fights.push(bossName(x));
      const waves = x.lf && x.lf.waveMusic;
      if (waves) for (const [w, id] of Object.entries(waves)) if (has(id)) fights.push(bossName(x) + ', волна ' + (+w + 1));
    }
    add('Бои', uniq(fights));
    add('Симулятор', (H.CALYX || []).filter(x => has(x.music)).map(x => x.name));
    if (H.HD) add('Рубеж Экспресса', Object.values(H.HD.THREATS).filter(x => has(x.music)).map(x => x.name));
    if (H.CW) add('Валютные войны', Object.values(H.CW.OPPONENTS).filter(x => has(x.music)).map(x => x.short || x.name));
    const halls = H.FH ? H.FH.STAGES.filter(s => s.nodes.flat().some(b => has(b.music || 'order'))).map(s => s.n) : [];
    if (halls.length) out.push('Забытый зал: ' + (halls.length > 1 ? 'этапы ' : 'этап ') + halls.join(', ') + '.');
    if (H.RANGE && H.RANGE.MUSIC.some(([k]) => has(k))) out.push('Полигон: можно выбрать для боя.');
    const cines = Object.values(H.Cine.CINES).filter(x => has(x.music)).length, scenes = Object.values(H.SCRIPTS).filter(s => playsMusic(s, has, 0)).length;
    const shows = [cines ? 'ролики: ' + cines : '', scenes ? 'сцены сюжета: ' + scenes : ''].filter(Boolean).join(', ');
    if (shows) out.push(shows[0].toUpperCase() + shows.slice(1) + '.');
    if (e.note) out.push(e.note);
    if (e.kind === 'track' && !H.TRACKS[e.key].midi) {
      const subs = Object.keys(H.TRACKS).filter(k => H.TRACKS[k].fallback === e.key).map(k => '«' + nameOf(k) + '»');
      if (subs.length) out.push('Замена, если MIDI не загрузится: ' + subs.join(', ') + '.');
    }
    USES.set(e.key, out);
    return out;
  }

  function midiInfo(path) {
    if (!(path in MIDI_INFO)) {
      MIDI_INFO[path] = null;
      H.Midi.load(path).then(s => { MIDI_INFO[path] = { a: s.loopStart, end: s.loopEnd }; }).catch(() => { MIDI_INFO[path] = false; });
    }
    return MIDI_INFO[path];
  }

  function lengthOf(e, v) {
    if (e.kind === 'song') {
      const s = H.SONGS[songId(e, v)], dur = SONG_LEN[s.parts.inst];
      return s.loop ? { a: s.loop[0], end: s.loop[1] } : dur ? { a: 0, end: dur } : false;
    }
    const tr = H.TRACKS[e.key];
    return tr.midi ? midiInfo(tr.midi) : { a: 0, end: tr.mel.length * 30 / tr.bpm };
  }

  function livePos(ui, P) {
    const au = ui.audio, ctx = au.ctx;
    if (!ctx) return null;
    let a, end, t;
    if (P.e.kind === 'song') {
      const L = au.layers, s = H.SONGS[P.id];
      if (!L || L.id !== P.id) return null;
      [a, end] = s.loop || [0, SONG_LEN[s.parts.inst] || 0];
      t = ctx.currentTime - L.t0;
    } else {
      const tr = H.TRACKS[P.id];
      if (au.track !== P.id) return null;
      if (tr.midi) {
        const pl = au.midi;
        if (!pl) return null;
        if (P.pl !== pl) { P.pl = pl; P.at = pl.base; }
        a = pl.song.loopStart; end = pl.song.loopEnd;
      } else { a = 0; end = tr.mel.length * 30 / tr.bpm; }
      t = ctx.currentTime - P.at;
    }
    if (!(end > a)) return { t: Math.max(0, t), a, end, pass: 1 };
    const pass = t < end ? 1 : 2 + Math.floor((t - end) / (end - a));
    return { t: Math.max(0, t < end ? t : a + (t - end) % (end - a)), a, end, pass };
  }

  function recordLine(g, e) {
    if (!e.rec) return [e.kind === 'song' ? 'Пластинки нет: песни фонограф не играет' : 'Пластинки нет: трек звучит только в игре', C.dim];
    const here = (g.state.record || null) === (e.rec.id || null) ? ', стоит в Экспрессе' : '';
    if (!e.rec.need || g.cond(e.rec.need)) return ['Пластинка найдена в пути' + here, C.ok];
    if (g.recordOk(e.rec)) return ['Пластинка выдана отладкой' + here, C.gold];
    return ['Пластинка не найдена, условие ' + e.rec.need, C.sub];
  }

  function sourceLine(e, v) {
    if (e.kind === 'song') {
      const s = H.SONGS[songId(e, v)], voices = Object.keys(s.parts).length - 1;
      return 'MP3 · ' + fileName(s.parts.inst) + (voices ? ' + вокал ×' + voices : '');
    }
    const tr = H.TRACKS[e.key];
    return tr.midi ? 'MIDI · ' + fileName(tr.midi) : 'Чиптюн · ' + tr.bpm + ' BPM · ' + tr.wave;
  }

  function spareLine(e) {
    if (e.kind === 'song') return 'Песня из файла, без замены';
    const tr = H.TRACKS[e.key];
    if (!tr.midi) return 'Звучит без MIDI-файла';
    return tr.mel ? 'Без MIDI: свой чиптюн' : 'Без MIDI: чиптюн «' + nameOf(tr.fallback) + '»';
  }

  function drawDisc(c, cx, cy, r, col, t) {
    c.fillStyle = '#05060e'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#4a4e6a'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#22243a';
    for (let k = r - 5; k > r * 0.42; k -= 5) { c.beginPath(); c.arc(cx, cy, k, 0, Math.PI * 2); c.stroke(); }
    const a = t == null ? -0.9 : t * 2.4;
    c.strokeStyle = 'rgba(200,210,255,0.2)'; c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, r * 0.72, a, a + 0.7); c.stroke();
    c.beginPath(); c.arc(cx, cy, r * 0.72, a + Math.PI, a + Math.PI + 0.7); c.stroke();
    c.lineWidth = 1;
    c.fillStyle = col; c.beginPath(); c.arc(cx, cy, r * 0.32, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(Math.round(cx + Math.cos(a) * r * 0.16) - 1, Math.round(cy + Math.sin(a) * r * 0.16) - 1, 3, 3);
    c.fillStyle = '#05060e'; c.beginPath(); c.arc(cx, cy, 2, 0, Math.PI * 2); c.fill();
  }

  function miniDisc(c, x, y, col, ring) {
    c.fillStyle = '#05060e'; c.beginPath(); c.arc(x + 6, y, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = ring || '#2a2c3e'; c.lineWidth = 1; c.beginPath(); c.arc(x + 6, y, ring ? 5.5 : 4, 0, Math.PI * 2); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(x + 6, y, 2, 0, Math.PI * 2); c.fill();
  }

  Object.assign(H.UI.prototype, {
    debugMusicPlay(st, e) {
      const au = this.audio, M = musicState(st), v = variant(e, M.v), was = M.play && M.play.e;
      if (!M.play) M.play = { prev: { track: au.wanted || null, song: au.wantedSong || null } };
      Object.assign(M.play, { e, pl: null, at: null });
      if (e.kind === 'song') {
        const id = songId(e, M.v), s = H.SONGS[id];
        if (was && was.kind === 'track') { au.stopMusic(); au.music(M.play.prev.track); }
        au.stopSong(0);
        au.song(id, 0);
        if (v && v[2]) au.songVoice(v[2]);
        M.play.id = id;
        if (au.ctx) au.stem(s.parts.inst).then(b => { SONG_LEN[s.parts.inst] = b.duration; }).catch(() => { });
      } else {
        if (au.wantedSong) au.stopSong(0);
        au.stopMusic();
        au.music(e.key);
        M.play.id = e.key;
        if (au.ctx && !H.TRACKS[e.key].midi) M.play.at = au.ctx.currentTime + 0.05;
      }
    },

    debugMusicStop(st) {
      const M = st && st.mu, P = M && M.play, au = this.audio;
      if (!P) return false;
      M.play = null;
      if (P.e.kind === 'song') au.stopSong(0.3);
      else { au.stopMusic(); au.music(P.prev.track); }
      if (P.prev.song) au.song(P.prev.song);
      return true;
    },

    debugMusicForm(st, note) {
      const ui = this, g = this.game, M = musicState(st), list = debugMusicList();
      M.i = wrapIdx(M.i, list.length);
      const e = list[M.i], live = !!(M.play && M.play.e === e), rec = e.rec, own = !!rec && g.recordOk(rec);
      const miss = H.RECORDS.filter(r => !g.recordOk(r));
      const rows = [{ label: 'Трек', value: e.name, col: groupOf(e.album).col, step: d => { M.i = wrapIdx(M.i + d, list.length); M.v = 0; } }];
      if (e.vars) rows.push({ label: e.vars.label, value: variant(e, M.v)[0], step: d => {
        const was = songId(e, M.v);
        M.v = wrapIdx(M.v + d, e.vars.list.length);
        if (!live) return;
        if (songId(e, M.v) === was) ui.audio.songVoice(variant(e, M.v)[2] || 'inst');
        else ui.debugMusicPlay(st, e);
      } });
      const acts = [
        { label: live ? 'Стоп' : 'Слушать', icon: 'disc', view: true, fn: () => { if (live) ui.debugMusicStop(st); else ui.debugMusicPlay(st, e); ui.sfx('select'); } },
        { label: 'Выдать', icon: 'disc', off: own || !rec, fn: () => {
          if (!rec) { st.log = { text: 'у трека «' + e.name + '» нет пластинки', t: ui.t }; ui.sfx('deny'); return; }
          if (g.debugRecord(e.key) !== 'new') { st.log = { text: 'пластинка «' + e.name + '» уже есть', t: ui.t }; ui.sfx('deny'); return; }
          note('пластинка «' + e.name + '» для фонографа');
        } },
        { label: 'Выдать все', icon: 'disc', off: !miss.length, fn: () => {
          if (!miss.length) { st.log = { text: 'все пластинки уже есть', t: ui.t }; ui.sfx('deny'); return; }
          for (const r of miss) g.debugRecord(r.track);
          note('пластинок ' + miss.length + ', в фонографе ' + g.records().length + ' из ' + H.RECORDS.length);
        } }
      ];
      const pick = st.row >= rows.length ? acts[st.row - rows.length] : acts[0];
      return { rows, acts, enter: pick ? pick.label : acts[0].label, foot: 'Пластинки попадают в сохранение, прослушивание нет.' };
    },

    debugMusicCatalog(c, st, x, y, w) {
      const ui = this, g = this.game, M = musicState(st), list = debugMusicList(), rows = [], at = [];
      list.forEach((e, i) => {
        if (!i || list[i - 1].album !== e.album) { rows.push({ head: groupOf(e.album) }); at.push(-1); }
        rows.push({ e }); at.push(i);
      });
      const views = st.views || (st.views = {}), sc = views.music || (views.music = { top: 0, sel: null });
      const playing = M.play ? M.play.e : null, inGame = entryOf(M.play ? M.play.prev.track : ui.audio.wanted);
      const items = rows.map(r => {
        if (r.head) {
          const recs = H.RECORDS.filter(x => x.album === r.head.id);
          return { label: r.head.name.toUpperCase(), col: C.brass, right: recs.length ? recs.filter(x => g.recordOk(x)).length + '/' + recs.length : '', rcol: C.dim };
        }
        const e = r.e, rec = e.rec, found = rec && (!rec.need || g.cond(rec.need));
        const right = !rec ? (e.kind === 'song' ? 'mp3' : 'чиптюн') : found ? 'есть' : g.recordOk(rec) ? 'выдана' : 'нет';
        return {
          label: e.name, col: e === playing ? C.cyan : C.cream, right,
          rcol: !rec ? C.dim : found ? C.ok : g.recordOk(rec) ? C.gold : C.dim,
          icon: (cc, ix, iy) => miniDisc(cc, ix, iy, groupOf(e.album).col, e === playing ? C.cyan : e === inGame ? C.brass : null), iconW: 18
        };
      });
      ui.list(x, y, w, items, at.indexOf(M.i), {
        rowH: 19, max: 19, size: 11, focus: st.row === 0, scroll: sc,
        onClick: k => {
          const i = at[k];
          if (i < 0) return;
          if (M.i === i && st.row === 0) { const e = list[i]; if (M.play && M.play.e === e) ui.debugMusicStop(st); else ui.debugMusicPlay(st, e); ui.sfx('select'); return; }
          M.i = i; M.v = 0; st.row = 0; ui.sfx('select');
        }
      });
    },

    debugMusicPreview(c, st, x, y) {
      const ui = this, g = this.game, M = musicState(st), e = debugMusicList()[M.i], al = groupOf(e.album);
      const P = M.play && M.play.e === e ? M.play : null;
      drawDisc(c, x + 56, y + 56, 42, al.col, P ? ui.t : null);
      const tx = x + 110, tw = 192, names = ui.wrap(e.name, tw, 13, true, true).slice(0, 2);
      names.forEach((l, i) => ui.text(l, tx, y + 14 + i * 16, { size: 13, bold: true, serif: true, col: C.gold }));
      let ty = y + 20 + names.length * 16;
      for (const [text, col] of [[al.name + ' · ' + partName(e.part), al.col], [sourceLine(e, M.v), C.sub], ['Ключ: ' + keysOf(e).join(', '), C.dim], [spareLine(e), C.dim]]) {
        ui.text(ui.clip(text, tw, 10), tx, ty, { size: 10, col });
        ty += 14;
      }
      const [rtext, rcol] = recordLine(g, e);
      ui.text(ui.clip(rtext, 288, 11, true), x + 14, y + 108, { size: 11, bold: true, col: rcol });
      const live = P ? livePos(ui, P) : null, len = live || lengthOf(e, M.v), bx = x + 14, by = y + 130, bw = 288;
      ui.bar(bx, by, bw, 6, live && len.end ? live.t / len.end : 0, live ? C.cyan : C.brass);
      if (len && len.end && len.a > 0.05) { c.fillStyle = C.brassHi; c.fillRect(Math.round(bx + bw * len.a / len.end), by - 3, 1, 12); }
      const left = live ? mmss(live.t) + ' / ' + (len.end ? mmss(len.end) : '?') : len ? 'Длина ' + mmss(len.end) : len === null ? 'Длина: загрузка' : e.kind === 'song' ? 'Длина видна после прослушивания' : 'Длина неизвестна';
      const right = live ? (live.pass > 1 ? 'круг ' + live.pass : 'первый проход') : len && len.a > 0.05 ? 'вступление ' + mmss(len.a) + ', затем петля' : len ? 'по кругу целиком' : '';
      ui.text(left, bx, by + 11, { size: 10, col: live ? C.cyan : C.sub });
      ui.text(right, bx + bw, by + 11, { size: 10, align: 'right', col: C.dim });
      const back = M.play ? M.play.prev : { track: ui.audio.wanted || null, song: ui.audio.wantedSong || null };
      const now = [back.track, back.song].filter(Boolean).map(k => '«' + nameOf(k) + '»').join(' и ') || 'тишина';
      ui.text(ui.clip((M.play ? 'После «Стоп» вернётся: ' : 'Сейчас в игре: ') + now, 288, 10), x + 14, y + 158, { size: 10, col: M.play ? C.cyan : C.sub });
      const cur = H.RECORDS.find(r => (r.id || null) === (g.state.record || null));
      ui.text('Пластинок в фонографе: ' + g.records().length + ' из ' + H.RECORDS.length, x + 14, y + 172, { size: 10, col: C.gold });
      ui.text(ui.clip('В Экспрессе стоит: «' + (cur ? bare(cur.name) : '') + '»', 288, 10), x + 14, y + 186, { size: 10, col: C.gold });
    },

    debugMusicNotes(st, x, y, w) {
      const ui = this, e = debugMusicList()[musicState(st).i], room = Math.max(2, Math.floor((HGT - 50 - y) / 13));
      const uses = usesOf(e), lines = uses.length ? uses.flatMap(u => ui.wrap(u, w, 10)) : ['Нигде, кроме этого меню и фонографа.'];
      ui.text('Где звучит', x, y, { size: 10, bold: true, col: C.sub });
      const shown = lines.length > room - 1 ? lines.slice(0, room - 2).concat([ui.clip(lines[room - 2] + '…', w, 10)]) : lines;
      shown.forEach((l, i) => ui.text(l, x, y + 13 + i * 13, { size: 10, col: C.dim }));
    }
  });

  Object.assign(H, { debugMusicList });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
