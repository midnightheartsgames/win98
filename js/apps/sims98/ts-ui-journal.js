(function (S) {
  'use strict';
  const Kit = S.Kit, Font = S.Font, Icons = S.Icons;
  const W = 600, H = 390, PAGE_W = 272, PAGE_H = 330, ROW_H = 30, SLANT = 0.18, LINE = 15;
  const PAPER = '#f2e8cc', RULE = '#b8cbe6', MARGIN = '#e09a8a', INK = '#1f2f6a', SOFT = '#5a6a9a', DONE = '#2f7a2f';
  const WHERE = {
    gems: 'Скалы и склоны, блеск виден издали.', metals: 'Скалы и лес.', space: 'Падают ночью на холмы, редки.',
    butterflies: 'Луга и парк, только днём.', bugs: 'Трава и лес, ночью больше.', seeds: 'Луга и парк. Семена можно и купить в магазине.'
  };
  const SET_ICONS = { gems: 'gem', metals: 'rock', space: 'rock', butterflies: 'butterfly', bugs: 'bug', seeds: 'seed' };
  const STAT_LINES = {
    cooking: s => ['Блюд приготовлено: ' + s.meals, 'На «превосходно» и выше: ' + s.great, 'Рецептов знает: ' + s.recipesKnown + ' из ' + Object.keys(S.RECIPES).length, 'Пожаров на кухне: ' + s.fires],
    athletic: s => ['Тренировок: ' + Math.floor(s.workoutMins / 60) + ' ч ' + Math.floor(s.workoutMins % 60) + ' мин', 'На груше: ' + Math.floor(s.punchMins) + ' мин', 'Пробежки: ' + Math.floor(s.jogTiles) + ' м'],
    logic: (s, sim) => ['Шахматных партий: ' + s.chessGames, 'Побед: ' + s.chessWins, 'Разряд: ' + S.Skills.chessRank(sim)],
    charisma: s => ['Друзей сейчас: ' + s.friendsNow, 'Знакомых: ' + s.peopleMet, 'Репетиций у зеркала: ' + Math.floor(s.mirrorMins) + ' мин'],
    fishing: s => ['Поймано рыб: ' + s.fishCaught, 'Видов: ' + s.fishKinds + ' из ' + Object.keys(S.FISH).length, 'Рекорд: ' + recordText(s)],
    gardening: s => ['Посажено видов: ' + s.plantedKinds + ' из ' + Object.keys(S.PLANTS).length, 'Урожаев собрано: ' + s.harvests, 'Безупречных плодов: ' + s.perfectCrop],
    guitar: s => ['Песен сыграно: ' + s.songs, 'Чаевых: §' + Math.floor(s.tips)],
    handiness: s => ['Улучшений: ' + s.upgrades, 'С отвёрткой: ' + Math.floor(s.tinkerMins / 60) + ' ч'],
    painting: s => ['Картин: ' + s.paintings, 'Шедевров: ' + s.masterpieces, 'Продано: ' + s.paintingsSold + (s.priciest ? ', дороже всех за §' + s.priciest : '')],
    writing: s => ['Романов: ' + s.novels + ', у издателя: ' + s.published, 'Жанров: ' + s.genresWritten + ' из ' + Object.keys(S.GENRES).length, 'Гонораров получено: §' + Math.floor(s.royaltiesEarned)]
  };

  const recordText = s => {
    const records = s.fishRecords || {};
    let best = null;
    for (const [id, w] of Object.entries(records)) if (!best || w > best[1]) best = [id, w];
    return best ? S.FISH[best[0]].name.toLowerCase() + ', ' + String(best[1]).replace('.', ',') + ' кг' : 'пока нет';
  };

  const slanted = (g, face, text, x, y, color) => {
    g.save();
    g.transform(1, 0, -SLANT, 1, Math.round((y + 8) * SLANT), 0);
    Font.draw(g, face, text, x, y, color);
    g.restore();
  };

  class JournalView {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.skill = null;
      this.set = 'gems';
      this.tab = 'skills';
    }

    toggle() {
      this.open = !this.open;
      if (this.open) this.skill = this.pickDefault();
      this.ui.stamp = '';
    }

    sim() {
      return this.ui.selected;
    }

    pickDefault() {
      const list = S.Skills.list(this.sim());
      return list[0] || 'cooking';
    }

    box() {
      const v = this.ui.screen;
      return { x: Math.round((v.sw - W) / 2), y: Math.max(8, Math.round((v.sh - H) / 2) - 40), w: W, h: H };
    }

    rows() {
      if (this.tab === 'collections') return Object.keys(S.Collect.SETS);
      const sim = this.sim(), started = S.Skills.list(sim), rest = Object.keys(S.SKILLS).filter(id => !started.includes(id));
      return started.concat(rest);
    }

    rowAt(px, py) {
      const b = this.box(), x0 = b.x + 22, y0 = b.y + 70;
      if (px < x0 || px >= x0 + PAGE_W - 30) return null;
      const i = Math.floor((py - y0) / ROW_H), list = this.rows();
      return i >= 0 && i < list.length && py >= y0 ? list[i] : null;
    }

    closeAt(px, py) {
      const b = this.box();
      return px >= b.x + b.w - 30 && px < b.x + b.w - 8 && py >= b.y + 8 && py < b.y + 30;
    }

    markAt(px, py) {
      const b = this.box();
      if (px < b.x + b.w - 6 || px >= b.x + b.w + 22) return null;
      if (py >= b.y + 60 && py < b.y + 120) return 'skills';
      if (py >= b.y + 126 && py < b.y + 186) return 'collections';
      return null;
    }

    key() {
      const sim = this.sim(), p = this.ui.pointer;
      return [this.open, this.skill, this.set, this.tab, sim.id, JSON.stringify(sim.skill ? sim.skill.stats.found || null : null), JSON.stringify(sim.skill ? sim.skill.xp : null), sim.skill ? sim.skill.done.length : 0, p ? this.rowAt(p.x, p.y) : ''].join('|');
    }

    click(px, py, button) {
      if (button !== 0 || this.closeAt(px, py)) {
        this.toggle();
        return;
      }
      const mark = this.markAt(px, py);
      if (mark && mark !== this.tab) {
        this.tab = mark;
        this.ui.sound.play('tick');
        this.ui.stamp = '';
        return;
      }
      const row = this.rowAt(px, py);
      if (row) {
        if (this.tab === 'collections') this.set = row;
        else this.skill = row;
        this.ui.sound.play('tick');
      }
      const b = this.box();
      if (!mark && (px < b.x || px >= b.x + b.w || py < b.y || py >= b.y + b.h)) this.toggle();
      this.ui.stamp = '';
    }

    page(g, x, y) {
      g.fillStyle = PAPER;
      g.fillRect(x, y, PAGE_W, PAGE_H);
      g.fillStyle = RULE;
      for (let ly = y + 52; ly < y + PAGE_H - 6; ly += LINE) g.fillRect(x + 4, ly, PAGE_W - 8, 1);
      g.fillStyle = MARGIN;
      g.fillRect(x + 26, y + 4, 1, PAGE_H - 8);
    }

    draw(g) {
      const b = this.box(), sim = this.sim(), pointer = this.ui.pointer, hover = pointer ? this.rowAt(pointer.x, pointer.y) : null;
      Kit.glass(g, b.x, b.y, b.w, b.h, 'deep', 12);
      const left = b.x + 16, right = b.x + b.w / 2 + 6, top = b.y + 44;
      this.page(g, left, top);
      this.page(g, right, top);
      g.fillStyle = '#6a5a3a';
      g.fillRect(b.x + b.w / 2 - 2, top, 4, PAGE_H);
      Font.shadowed(g, 'title', 'Журнал: ' + sim.name, b.x + 18, b.y + 12, '#fff', '#12306e');
      Kit.plate(g, b.x + b.w - 30, b.y + 8, 22, 22, 'normal', 6);
      Icons.centered(g, 'close', b.x + b.w - 19, b.y + 19, 'white');
      [['skills', 'Навыки', 60], ['collections', 'Коллекции', 126]].forEach(([id, name, dy]) => {
        Kit.plate(g, b.x + b.w - 6, b.y + dy, 26, 60, id === this.tab ? 'on' : 'off', 6);
        g.save();
        g.translate(b.x + b.w + 3, b.y + dy + 6);
        g.rotate(Math.PI / 2);
        Font.draw(g, 'small', name, 0, -4, id === this.tab ? INK : '#dde3ee');
        g.restore();
      });
      if (this.tab === 'collections') {
        this.drawSets(g, left, top, right, sim, hover);
        return;
      }
      slanted(g, 'bold', 'Мои навыки', left + 34, top + 10, INK);
      this.rows().forEach((id, i) => {
        const def = S.SKILLS[id], y = top + 26 + i * ROW_H, started = S.Skills.started(sim, id), level = S.Skills.level(sim, id), open = def.stage <= S.Skills.NOW, chosen = id === this.skill;
        if (chosen || hover === id) {
          g.fillStyle = chosen ? 'rgba(80,120,200,0.25)' : 'rgba(80,120,200,0.12)';
          g.fillRect(left + 4, y - 2, PAGE_W - 8, ROW_H - 2);
        }
        Icons.draw(g, def.icon, left + 6, y + 2, started ? 'blue' : 'gray');
        slanted(g, 'smallb', def.name, left + 34, y + 2, started ? INK : SOFT);
        if (started) {
          slanted(g, 'small', 'уровень ' + level, left + 34, y + 14, SOFT);
          Kit.bar(g, left + 150, y + 8, 100, 7, level / S.Skills.TOP, '#4f9a4f');
        } else {
          slanted(g, 'small', open ? 'ещё не начат' : 'появится на этапе ' + def.stage, left + 34, y + 14, SOFT);
        }
      });
      this.drawSkill(g, right, top, sim, this.skill);
    }

    drawSkill(g, x, y, sim, id) {
      const def = S.SKILLS[id], level = S.Skills.level(sim, id), started = S.Skills.started(sim, id), xp = started ? sim.skill.xp[id] : 0, stats = sim.skill ? sim.skill.stats : null;
      let ly = y + 10;
      const line = (text, face, color) => {
        Font.wrap(face || 'small', text, PAGE_W - 44).forEach(part => {
          slanted(g, face || 'small', part, x + 34, ly, color || INK);
          ly += LINE;
        });
      };
      slanted(g, 'bold', def.name + (started ? ', уровень ' + level : ''), x + 34, ly, INK);
      ly += 22;
      if (!started) {
        line(def.stage > S.Skills.NOW ? 'Этот навык появится на этапе ' + def.stage + '.' : 'Ещё не начат. ' + def.text);
        if (def.stage <= S.Skills.NOW && S.AGE_RANK[sim.age] < S.AGE_RANK[def.age]) line('Учиться можно с возраста: ' + (def.age === 'teen' ? 'подросток' : 'ребёнок') + '.', 'small', SOFT);
        return;
      }
      if (level < S.Skills.TOP) {
        const from = S.Skills.LEVEL_XP[level], to = S.Skills.LEVEL_XP[level + 1];
        Kit.bar(g, x + 34, ly + 2, PAGE_W - 60, 8, (xp - from) / (to - from), '#4f9a4f');
        ly += 14;
        line('До ' + (level + 1) + ' уровня: ' + Math.ceil(to - xp) + ' мин практики', 'small', SOFT);
      } else {
        line('Навык освоен полностью.', 'smallb', DONE);
        if (sim.skill.certs.includes(id)) line('Сертификат мастера получен.', 'small', DONE);
      }
      ly += 4;
      if (STAT_LINES[id] && stats) for (const text of STAT_LINES[id](stats, sim)) line(text);
      ly += 4;
      slanted(g, 'smallb', 'Вызовы', x + 34, ly, INK);
      ly += LINE;
      for (const ch of Object.values(S.SKILL_CHALLENGES).filter(c => c.skill === id)) {
        const done = S.Skills.has(sim, ch.id), [have, need] = S.Skills.progress(sim, ch.id);
        Icons.draw(g, done ? 'star' : 'dots', x + 8, ly - 2, done ? 'gold' : 'gray');
        line(ch.name + (done ? ': пройден' : ch.stage > S.Skills.NOW ? ': этап ' + ch.stage : ': ' + Math.floor(have) + ' из ' + need), 'small', done ? DONE : INK);
      }
      const next = this.nextText(sim, id, level);
      if (next) {
        ly += 2;
        line(next, 'small', SOFT);
      }
    }

    drawSets(g, left, top, right, sim, hover) {
      slanted(g, 'bold', 'Мои коллекции', left + 34, top + 10, INK);
      this.rows().forEach((id, i) => {
        const set = S.Collect.SETS[id], y = top + 26 + i * ROW_H, [have, need] = sim.skill ? S.Collect.progress(sim, id) : [0, 1], chosen = id === this.set, done = have >= need;
        if (chosen || hover === id) {
          g.fillStyle = chosen ? 'rgba(80,120,200,0.25)' : 'rgba(80,120,200,0.12)';
          g.fillRect(left + 4, y - 2, PAGE_W - 8, ROW_H - 2);
        }
        Icons.draw(g, SET_ICONS[id], left + 6, y + 2, done ? 'gold' : have ? 'blue' : 'gray');
        slanted(g, 'smallb', set.name, left + 34, y + 2, have ? INK : SOFT);
        slanted(g, 'small', 'собрано ' + have + ' из ' + need, left + 34, y + 14, done ? DONE : SOFT);
        Kit.bar(g, left + 178, y + 8, 72, 7, have / need, done ? '#d8a020' : '#4f9a4f');
      });
      const id = this.set, set = S.Collect.SETS[id], found = (sim.skill && sim.skill.stats.found) || {}, [have, need] = sim.skill ? S.Collect.progress(sim, id) : [0, 1];
      let ly = top + 10;
      const line = (text, face, color) => {
        Font.wrap(face || 'small', text, PAGE_W - 44).forEach(part => {
          slanted(g, face || 'small', part, right + 34, ly, color || INK);
          ly += LINE;
        });
      };
      slanted(g, 'bold', set.name + ': ' + have + ' из ' + need, right + 34, ly, INK);
      ly += 22;
      line('Где искать: ' + WHERE[id], 'small', SOFT);
      line(have >= need ? 'Набор собран: находки этого набора дороже на четверть.' : 'Полный набор сделает находки этого набора дороже на четверть.', 'small', have >= need ? DONE : SOFT);
      ly += 4;
      const members = S.Collect.members(id), half = Math.ceil(members.length / 2);
      members.forEach((m, i) => {
        const name = id === 'seeds' ? S.PLANTS[m].name : S.FINDS[m].name, n = found[m] || 0, col = i < half ? 0 : 1, row = i < half ? i : i - half;
        const x = right + 34 + col * 120, y = ly + row * 13;
        Font.draw(g, 'small', n ? name + (n > 1 ? ' ×' + n : '') : '???', x, y, n ? INK : SOFT);
      });
    }

    nextText(sim, id, level) {
      if (level >= S.Skills.TOP) return '';
      if (id === 'cooking') {
        const fresh = Object.values(S.RECIPES).filter(r => r.level === level + 1).map(r => r.name);
        return fresh.length ? 'На ' + (level + 1) + ' уровне: ' + fresh.join(', ') + '.' : '';
      }
      if (id === 'charisma') {
        const lines = S.Social.ALL.filter(r => r.skill && r.skill[0] === 'charisma' && r.skill[1] > level).map(r => '«' + r.name + '» с ' + r.skill[1] + ' уровня');
        return lines.length ? 'Дальше: ' + lines[0] + '.' : '';
      }
      if (id === 'logic') return 'Чем выше уровень, тем чаще выигрываются партии.';
      if (id === 'athletic') return 'Чем выше уровень, тем легче даются тренировки.';
      if (id === 'fishing') {
        const fresh = Object.values(S.FISH).filter(f => f.level === level + 1 || f.level === level + 2).map(f => f.name.toLowerCase());
        return fresh.length ? 'Скоро клюнут: ' + fresh.join(', ') + '.' : '';
      }
      if (id === 'gardening') {
        const fresh = Object.values(S.PLANTS).filter(p => p.level === level + 1).map(p => p.name.toLowerCase());
        return fresh.length ? 'На ' + (level + 1) + ' уровне: ' + fresh.join(', ') + '.' : 'Чем выше уровень, тем больше и лучше урожай.';
      }
      if (id === 'guitar') {
        const song = Object.values(S.SONGS).find(s => s.level === level + 1);
        return song ? 'На ' + (level + 1) + ' уровне песня «' + song.name + '».' : '';
      }
      if (id === 'handiness') {
        const fresh = Object.values(S.UPGRADES).filter(u => u.level === level + 1).map(u => u.name.toLowerCase());
        return fresh.length ? 'На ' + (level + 1) + ' уровне: ' + fresh.join(', ') + '.' : 'Чем выше уровень, тем реже бьёт током.';
      }
      if (id === 'painting') {
        const style = Object.values(S.PAINT_STYLES).find(s => s.level === level + 1);
        return style ? 'На ' + (level + 1) + ' уровне стиль «' + style.name + '».' : 'Чем выше уровень, тем дороже картины.';
      }
      if (id === 'writing') {
        const genre = Object.values(S.GENRES).find(gn => gn.level === level + 1);
        return genre ? 'На ' + (level + 1) + ' уровне жанр «' + genre.name + '».' : 'Чем выше уровень, тем выше гонорары.';
      }
      return '';
    }
  }

  S.JournalView = JournalView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
