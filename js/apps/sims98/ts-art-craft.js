(function (S) {
  'use strict';
  const DAY = 1440, WEEK = 7 * DAY;
  const MULT = [1, 1.3, 1.7, 2.1, 2.6, 3.1, 3.7, 4.4, 5.2, 6.1, 7.2];
  const SIZES = { small: ['Маленькая', 16, 150, 90], medium: ['Средняя', 29, 260, 150], large: ['Большая', 45, 400, 240] };
  const STYLE_ROWS = [
    ['doodle', 'Рисунок', 0, 0.8], ['abstract', 'Абстракция', 1, 1], ['landscape', 'Пейзаж', 2, 1.05], ['stilllife', 'Натюрморт', 3, 1.1],
    ['portrait', 'Портрет', 4, 1.2], ['copy', 'Копия классики', 5, 0.7], ['impression', 'Импрессионизм', 6, 1.25], ['cubism', 'Кубизм', 8, 1.3], ['surreal', 'Сюрреализм', 9, 1.4]
  ];
  const GRADES = ['Набросок', 'Неплохо', 'Хорошая работа', 'Прекрасная работа', 'Шедевр'];
  const GENRE_ROWS = [
    ['tale', 'Сказка', 0, 6, 5.6], ['poems', 'Стихи', 0, 5, 4.7], ['detective', 'Детектив', 1, 8, 8], ['scifi', 'Фантастика', 2, 9, 9.6],
    ['adventure', 'Приключения', 3, 8, 9], ['romance', 'Любовный роман', 4, 8, 9.5], ['humor', 'Юмор', 5, 7, 8.8], ['history', 'Исторический роман', 6, 11, 14.4],
    ['mystic', 'Мистика', 7, 9, 12.4], ['satire', 'Сатира', 8, 8, 11.5], ['science', 'Научно-популярная книга', 9, 10, 15], ['epic', 'Эпопея', 10, 14, 21.9]
  ];
  const SONG_ROWS = [
    ['scales', 'Гаммы', 0], ['limewaltz', 'Лаймовый вальс', 1], ['searoad', 'Дорога к морю', 2], ['fisher', 'Песня рыбака', 3], ['harbor', 'Ночная гавань', 4], ['lighthouse', 'Баллада о маяке', 5],
    ['citrusblues', 'Цитрусовый блюз', 6], ['serenade', 'Серенада', 7], ['storm', 'Шторм над мысом', 8], ['pier', 'Старый причал', 9], ['anthem', 'Гимн Лайм-Харбора', 10]
  ];
  const BIG_SALE = 400;
  const UPGRADE_ROWS = [
    ['fireproof', 'Огнеупорная плита', ['stove'], 2, 60, true, 'На этой плите больше не загорается.'],
    ['pressure', 'Мощный напор', ['shower'], 1, 40, false, 'Душ отмывает в полтора раза быстрее.'],
    ['jacuzzi', 'Гидромассаж', ['bathtub'], 4, 120, true, 'Ванна веселит в полтора раза сильнее.'],
    ['mattress', 'Ортопедический матрас', ['bed', 'small_bed'], 3, 80, false, 'Сон восстанавливает силы на четверть быстрее.'],
    ['picture', 'Чёткая картинка', ['tv'], 2, 60, true, 'Телевизор веселит на треть сильнее.'],
    ['surround', 'Объёмный звук', ['stereo'], 1, 50, true, 'Музыка веселит на треть сильнее.'],
    ['freezer', 'Морозилка', ['fridge'], 4, 100, true, 'Остатки хранятся вдвое дольше.'],
    ['processor', 'Быстрый процессор', ['computer'], 5, 150, true, 'Романы и игры идут на четверть быстрее.']
  ];
  const BOOSTS = { pressure: ['hygiene', 1.5], jacuzzi: ['fun', 1.5], mattress: ['energy', 1.25], picture: ['fun', 1.3], surround: ['fun', 1.3], processor: ['fun', 1.25] };
  const TITLE_WORDS = {
    things: ['Утро', 'Туман', 'Шторм', 'Полдень', 'Чайки', 'Дождь', 'Закат', 'Тишина', 'Прилив', 'Ветер'],
    places: ['над Гаванью', 'у маяка', 'в саду', 'на мысу', 'за окном', 'на площади', 'у моря', 'на холме', 'у причала'],
    still: ['Лаймы и кувшин', 'Яблоки на скатерти', 'Синяя ваза', 'Хлеб и нож', 'Ракушки', 'Старый чайник', 'Цветы в банке'],
    abstract: ['Композиция', 'Красное и серое', 'Синий шум', 'Квадраты', 'Волна', 'Сигнал', 'Узел'],
    classic: ['Девушка у окна', 'Ночное кафе', 'Подсолнухи', 'Звёздное небо', 'Рыбаки на берегу'],
    novel: ['Тайна', 'Письмо', 'Дорога', 'Последний', 'Голос', 'Тень', 'Остров', 'Лето', 'Ключ', 'Сад'],
    novelTail: ['старого маяка', 'с моря', 'на юг', 'рейс', 'из гавани', 'над холмом', 'Чаек', 'в Лайм-Харборе', 'от всех дверей', 'Ормонда']
  };
  const MASTER_FROM = 4, MASTER_STEP = 0.02, MASTER_BONUS = 0.05, PRICEY = 1.15, BRUSH = 1.15, BESTSELLER_LEVEL = 7, BESTSELLER = 0.1, ADVANCE = 6, ROYALTY_WEEKS = 10;
  const TIP_EVERY = 10, TIP_CHANCE = 0.3, TIP_RANGE = 8, STAR_PERK = 1.25, VIRTUOSO_TIPS = 1.5, CONCERT = 150, ARTISTIC = 1.2, MANY_GENRES = 1.15, PROLIFIC = 1.5, BESTSELLER_PERK = 1.15, BESTSELLER_REWARD = 1.25, CREATIVE_TIPS = 1.2;
  const SHOCK_BASE = 0.3, SHOCK_STEP = 0.035, HANDY_COST = 0.5, MECHANIC_TIME = 0.5, GARAGE_COST = 0.5, PROCESSOR = 1.25;

  S.PAINT_SIZES = {};
  for (const [id, [name, base, slow, fast]] of Object.entries(SIZES)) S.PAINT_SIZES[id] = { id, name, base, slow, fast };
  S.PAINT_STYLES = {};
  STYLE_ROWS.forEach(([id, name, level, mult], order) => { S.PAINT_STYLES[id] = { id, name, level, mult, order }; });
  S.GENRES = {};
  GENRE_ROWS.forEach(([id, name, level, hours, royalty], order) => { S.GENRES[id] = { id, name, level, hours, royalty, order }; });
  S.SONGS = {};
  SONG_ROWS.forEach(([id, name, level], order) => { S.SONGS[id] = { id, name, level, order }; });
  S.UPGRADES = {};
  UPGRADE_ROWS.forEach(([id, name, models, level, cost, electric, text], order) => { S.UPGRADES[id] = { id, name, models, level, cost, electric, text, order }; });

  const LOOP = { gain: { fun: 18 } };
  S.ADS.easel_paint.steps = [{ pose: 'front', clip: 'paint', mins: 45, gain: { fun: 40 }, paint: true }];
  S.ADS.paint_canvas = { id: 'paint_canvas', obj: 'easel', name: 'Писать картину', icon: 'paint', mood: 'inspired', age: 'child', player: true, steps: [{ pose: 'front', clip: 'paint', mins: 60, gain: { fun: 24 }, paint: true, rounds: true }] };
  S.ADS.paint_scrap = { id: 'paint_scrap', obj: 'easel', name: 'Снять холст', icon: 'paint', age: 'child', player: true, when: 'canvas', steps: [{ pose: 'front', clip: 'use', mins: 2, scrap: true }] };
  S.ADS.write_novel = { id: 'write_novel', obj: 'computer', name: 'Писать роман', icon: 'scroll', age: 'child', below: { fun: 40 }, when: 'novel', steps: [{ pose: 'sit', clip: 'type', mins: 60, loop: 'keys', gain: { fun: 12 }, write: true, rounds: true }] };
  S.ADS.book_own = { id: 'book_own', name: 'Почитать свою книгу', icon: 'book', mood: 'greatBook', age: 'child', player: true, steps: [{ seat: 'any', clip: 'read', standClip: 'readStand', mins: 45, gain: { fun: 30 } }] };
  S.ADS.guitar_play = { id: 'guitar_play', name: 'Играть на гитаре', icon: 'guitar', age: 'teen', player: true, steps: [Object.assign({ here: true, clip: 'guitar', mins: 30, loop: 'music', guitar: true }, LOOP)] };
  S.ADS.guitar_song = { id: 'guitar_song', name: 'Сыграть песню', icon: 'guitar', age: 'teen', player: true, steps: [{ here: true, clip: 'guitar', mins: 6, loop: 'music', gain: { fun: 10 }, guitar: true, song: true }] };
  S.ADS.guitar_tips = { id: 'guitar_tips', name: 'Играть за чаевые', icon: 'guitar', age: 'teen', player: true, steps: [{ here: true, clip: 'guitar', mins: 60, loop: 'music', gain: { fun: 14 }, guitar: true, tips: true, rounds: true }] };
  S.ADS.upgrade = { id: 'upgrade', objs: [...new Set(UPGRADE_ROWS.flatMap(r => r[2]))], name: 'Улучшить', icon: 'skills', mood: 'fixedIt', age: 'teen', player: true, steps: [{ pose: 'front', clip: 'use', mins: 60, gain: { fun: 8 }, upgrade: true }] };
  S.OBJECTS.easel.ads = ['easel_paint', 'paint_scrap', 'mock_art'];
  S.OBJECTS.computer.ads = ['computer_play', 'computer_chat', 'write_novel', 'work_home', 'tinker'];

  const now = world => world.day * DAY + world.clock;
  const books = n => (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'книги' : 'книг');
  const pick = (world, list) => list[Math.floor(S.roll(world.rng) * list.length)];
  const lvl = (sim, id) => S.Skills.level(sim, id);
  const canvasOf = (lot, item) => (lot.canvases ? lot.canvases[lot.house.items.indexOf(item)] || null : null);

  S.WHEN = S.WHEN || {};
  S.WHEN.canvas = (world, lot, item) => !!canvasOf(lot, item);
  S.WHEN.novel = () => true;

  S.Art = {
    MULT, GRADES, WEEK, ADVANCE, ROYALTY_WEEKS, CONCERT,

    canvasOf,

    paintMins(sim, size) {
      const s = S.PAINT_SIZES[size], level = lvl(sim, 'painting');
      return s.slow + (s.fast - s.slow) * level / 10;
    },

    paintWhy(sim, style) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.child) return 'Рисуют с детского возраста';
      if (lvl(sim, 'painting') < style.level) return 'Нужно рисование ' + style.level;
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.teen && style.id !== 'doodle' && style.id !== 'abstract') return 'Детям пока только рисунки и абстракция';
      return null;
    },

    easelMenu(world, sim, lot, item) {
      const canvas = canvasOf(lot, item);
      if (canvas) {
        const style = S.PAINT_STYLES[canvas.style], size = S.PAINT_SIZES[canvas.size];
        return [{ label: 'Продолжить: ' + style.name.toLowerCase() + ' (' + Math.floor(canvas.done / canvas.need * 100) + ' %)', ad: 'paint_canvas', lot, item, closed: S.AGE_RANK[sim.age] < S.AGE_RANK.child ? 'Рисуют с детского возраста' : null, tip: { title: style.name + ', ' + size.name.toLowerCase(), text: 'Холст начат. Закончить может любой член семьи.' } }];
      }
      const sizes = Object.values(S.PAINT_SIZES).map(size => ({
        label: size.name + '…',
        section: Object.values(S.PAINT_STYLES).map(style => ({ label: style.name, ad: 'paint_canvas', lot, item, canvas: { size: size.id, style: style.id }, closed: S.Art.paintWhy(sim, style), tip: { title: style.name, text: size.name + ' картина, около ' + Math.round(S.Art.paintMins(sim, size.id) / 60 * 10) / 10 + ' ч работы.' } }))
      }));
      return [{ label: 'Начать картину…', section: sizes }];
    },

    paintTick(world, sim, act, dt) {
      const lot = world.lots[act.lot], index = act.item;
      const canvases = lot.canvases || (lot.canvases = {});
      let canvas = canvases[index];
      if (!canvas) {
        const want = act.canvas || { size: 'small', style: Object.values(S.PAINT_STYLES).filter(s => !S.Art.paintWhy(sim, s) && s.id !== 'copy').pop().id };
        canvas = canvases[index] = { size: want.size, style: want.style, done: 0, need: S.Art.paintMins(sim, want.size), by: sim.id };
      }
      let speed = 1;
      if (S.Traits.has(sim, 'artistic')) speed *= ARTISTIC;
      if (S.Skills.has(sim, 'brush')) speed *= BRUSH;
      canvas.done += dt * speed;
      if (canvas.done < canvas.need) return false;
      delete canvases[index];
      S.Art.finishPainting(world, sim, canvas);
      return true;
    },

    title(world, sim, style) {
      if (style === 'portrait') {
        const sitter = pick(world, world.family.filter(s => s !== sim).concat([sim]));
        return sitter.name + ', портрет';
      }
      if (style === 'stilllife') return pick(world, TITLE_WORDS.still);
      if (style === 'abstract' || style === 'cubism' || style === 'doodle') return pick(world, TITLE_WORDS.abstract) + (style === 'doodle' ? '' : ' № ' + (1 + Math.floor(S.roll(world.rng) * 40)));
      if (style === 'copy') return pick(world, TITLE_WORDS.classic) + ', копия';
      return pick(world, TITLE_WORDS.things) + ' ' + pick(world, TITLE_WORDS.places);
    },

    finishPainting(world, sim, canvas) {
      const level = lvl(sim, 'painting'), style = S.PAINT_STYLES[canvas.style], size = S.PAINT_SIZES[canvas.size];
      let master = 0;
      if (level >= MASTER_FROM && style.id !== 'copy') master = MASTER_STEP * (level - MASTER_FROM + 1) + (sim.rewards && sim.rewards.includes('moreCreative') ? MASTER_BONUS : 0) + (S.Skills.has(sim, 'masterpieces') ? MASTER_BONUS : 0);
      const isMaster = S.roll(world.rng) < master, grade = isMaster ? 4 : Math.max(0, Math.min(3, Math.round(level / 2.8 + S.roll(world.rng) - 0.3)));
      const value = Math.max(2, Math.round(size.base * MULT[level] * style.mult * (0.85 + 0.3 * S.roll(world.rng)) * (isMaster ? 3 : 1) * (S.AGE_RANK[sim.age] < S.AGE_RANK.teen ? 0.5 : 1)));
      const it = S.Econ.item('painting', style.id, { q: grade, v: value, n: '«' + S.Art.title(world, sim, style.id) + '»', at: now(world), x: { size: size.id, by: sim.name } });
      if (!S.Econ.give(world, sim, it)) sim.bag.push(it);
      S.Skills.stat(world, sim, 'paintings', 1);
      if (isMaster) S.Skills.stat(world, sim, 'masterpieces', 1);
      if (sim.wish) {
        S.Wishes.bump(sim, 'painting');
        if (isMaster) S.Wishes.bump(sim, 'masterpiece');
        if (style.id === 'portrait') S.Wishes.bump(sim, 'portrait');
      }
      world.events.push({ type: 'art', sim: sim.id, text: sim.name + ' заканчивает картину ' + it.n + ': ' + GRADES[grade].toLowerCase() + ', §' + value });
    },

    scrap(world, sim, act) {
      const lot = world.lots[act.lot];
      if (lot.canvases) delete lot.canvases[act.item];
    },

    paintingLine(it) {
      const size = S.PAINT_SIZES[it.x && it.x.size], style = S.PAINT_STYLES[it.id];
      return [style ? style.name.toLowerCase() : '', size ? size.name.toLowerCase() : '', GRADES[it.q] ? GRADES[it.q].toLowerCase() : ''].filter(Boolean).join(', ');
    },

    sellPainting(world, sim, index) {
      const it = sim.bag[index];
      const price = Math.round(it.v * (S.Skills.has(sim, 'pricey') ? PRICEY : 1));
      S.Econ.take(sim, index);
      S.Econ.earn(world, price, 'Продана картина ' + it.n + ': +§' + price, sim);
      S.Skills.stat(world, sim, 'paintingsSold', 1);
      S.Skills.setStat(world, sim, 'priciest', Math.max(sim.skill.stats.priciest || 0, price));
      S.Moods.add(sim, 'paintingSold', 0, world);
      if (sim.wish) S.Wishes.bump(sim, 'paintingSold');
      if (sim.wish && price >= BIG_SALE) S.Wishes.bump(sim, 'paintingBig');
      if (price >= BIG_SALE && S.News) S.News.add(world, sim.name + (sim.surname ? ' ' + sim.surname : '') + ' продаёт картину за §' + price + '.');
      return price;
    },

    novelWhy(sim, genre) {
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.child) return 'Пишут с детского возраста';
      if (lvl(sim, 'writing') < genre.level) return 'Нужно письмо ' + genre.level;
      return null;
    },

    computerMenu(world, sim, lot, item) {
      if (sim.novel) {
        const g = S.GENRES[sim.novel.genre];
        return [{ label: 'Писать роман: ' + Math.floor(sim.novel.done / sim.novel.need * 100) + ' %', ad: 'write_novel', lot, item, tip: { title: sim.novel.title, text: g.name + '. Сим пишет, пока есть силы, потом можно продолжить.' } }];
      }
      return [{ label: 'Писать роман…', section: Object.values(S.GENRES).map(g => ({ label: g.name, ad: 'write_novel', lot, item, genre: g.id, closed: S.Art.novelWhy(sim, g), tip: { title: g.name, text: 'Около ' + Math.round(S.Art.novelHours(sim, g.id)) + ' ч работы.' } })) }];
    },

    novelHours(sim, genre) {
      return S.GENRES[genre].hours * (1.6 - 0.06 * lvl(sim, 'writing'));
    },

    writeTick(world, sim, act, dt) {
      if (!sim.novel) {
        const options = Object.values(S.GENRES).filter(g => !S.Art.novelWhy(sim, g));
        const g = S.GENRES[act.genre] && !S.Art.novelWhy(sim, S.GENRES[act.genre]) ? S.GENRES[act.genre] : options[options.length - 1];
        if (!g) return false;
        sim.novel = { genre: g.id, done: 0, need: S.Art.novelHours(sim, g.id) * 60, title: pick(world, TITLE_WORDS.novel) + ' ' + pick(world, TITLE_WORDS.novelTail) };
      }
      const lot = world.lots[act.lot], item = lot && lot.house.items[act.item];
      let speed = 1;
      if (item && item.up && item.up.includes('processor')) speed *= PROCESSOR;
      if (S.Skills.has(sim, 'manyGenres')) speed *= MANY_GENRES;
      sim.novel.done += dt * speed;
      if (sim.novel.done < sim.novel.need) return false;
      S.Art.finishNovel(world, sim);
      return true;
    },

    royaltyOf(world, sim, genre) {
      const level = lvl(sim, 'writing');
      return Math.max(1, Math.round(S.GENRES[genre].royalty * MULT[level] * (0.85 + 0.3 * S.roll(world.rng))));
    },

    finishNovel(world, sim) {
      const novel = sim.novel, grade = Math.max(0, Math.min(4, Math.round(lvl(sim, 'writing') / 2.6 + S.roll(world.rng) - 0.3)));
      sim.novel = null;
      const royalty = S.Art.royaltyOf(world, sim, novel.genre);
      const it = S.Econ.item('manuscript', novel.genre, { q: grade, v: 0, n: '«' + novel.title + '»', at: now(world), x: { by: sim.name, r: royalty } });
      if (!S.Econ.give(world, sim, it)) sim.bag.push(it);
      const stats = sim.skill.stats, genres = stats.genres || (stats.genres = []);
      if (!genres.includes(novel.genre)) genres.push(novel.genre);
      S.Skills.setStat(world, sim, 'genresWritten', genres.length);
      S.Skills.stat(world, sim, 'novels', 1);
      S.Moods.add(sim, 'bookDone', 0, world);
      if (sim.wish) S.Wishes.bump(sim, 'novelDone');
      world.events.push({ type: 'art', sim: sim.id, text: sim.name + ' дописывает роман ' + it.n + '. Рукопись в инвентаре, её можно отдать издателю' });
    },

    bookLine(it) {
      const g = S.GENRES[it.id];
      return (g ? g.name.toLowerCase() : '') + (it.k === 'manuscript' && it.x ? ', гонорар §' + it.x.r + ' в неделю' : '');
    },

    publish(world, sim, index) {
      const it = sim.bag[index];
      let weekly = it.x.r;
      const best = lvl(sim, 'writing') >= BESTSELLER_LEVEL && S.roll(world.rng) < BESTSELLER;
      if (best) {
        weekly *= 3;
        S.Skills.stat(world, sim, 'bestsellers', 1);
      }
      if (S.Skills.has(sim, 'bestseller')) weekly = Math.round(weekly * BESTSELLER_PERK);
      if (sim.rewards && sim.rewards.includes('bestseller')) weekly = Math.round(weekly * BESTSELLER_REWARD);
      const advance = Math.round(it.x.r * ADVANCE * (S.Skills.has(sim, 'prolific') ? PROLIFIC : 1));
      world.books = world.books || [];
      world.books.push({ t: it.n, by: sim.id, r: weekly, left: ROYALTY_WEEKS, next: now(world) + WEEK });
      sim.bag[index] = S.Econ.item('book', it.id, { q: it.q, v: 0, n: it.n, at: it.at, x: { by: it.x.by } });
      S.Econ.earn(world, advance, 'Издатель берёт роман ' + it.n + (best ? ', это бестселлер' : '') + ': аванс +§' + advance + ', дальше §' + weekly + ' в неделю', sim);
      S.Skills.stat(world, sim, 'published', 1);
      return advance;
    },

    weekly(world, sim) {
      return (world.books || []).filter(b => b.by === sim.id).reduce((sum, b) => sum + b.r, 0);
    },

    royalties(world) {
      if (!world.books || !world.books.length) return;
      const t = now(world), paid = new Map();
      for (const book of world.books) {
        while (book.left > 0 && book.next <= t) {
          book.left--;
          book.next += WEEK;
          const row = paid.get(book.by) || { sum: 0, n: 0 };
          row.sum += book.r;
          row.n++;
          paid.set(book.by, row);
        }
      }
      world.books = world.books.filter(b => b.left > 0);
      for (const [by, row] of paid) {
        const sim = world.sims.find(s => s.id === by);
        const paid = S.Econ.earn(world, row.sum, 'Гонорар' + (row.n > 1 ? ' за ' + row.n + ' ' + books(row.n) : '') + (sim ? ' (' + sim.name + ')' : '') + ': +§' + row.sum, sim);
        if (paid) world.events[world.events.length - 1].royalty = true;
        if (sim && sim.skill) {
          S.Skills.stat(world, sim, 'royaltiesEarned', row.sum);
          if (sim.wish) S.Wishes.bump(sim, 'royalty');
        }
      }
    },

    selfMenu(world, sim) {
      if (!sim.bag || !sim.bag.some(it => it.k === 'guitar')) return [];
      const why = S.AGE_RANK[sim.age] < S.AGE_RANK.teen ? 'Гитара с подросткового возраста' : null, level = lvl(sim, 'guitar');
      const out = [{ label: 'Играть на гитаре', guitar: 'guitar_play', closed: why }];
      out.push({ label: 'Сыграть песню…', section: Object.values(S.SONGS).map(song => ({ label: song.name, guitar: 'guitar_song', song: song.id, closed: why || (level < song.level ? 'Нужна гитара ' + song.level : null) })) });
      const lot = sim.lot, open = !!lot && lot !== sim.home && !lot.closed;
      out.push({ label: 'Играть за чаевые', guitar: 'guitar_tips', closed: why || (open ? null : 'Чаевые дают в парке и на улице, не дома') });
      return out;
    },

    guitarAct(world, sim, option) {
      const act = S.Acts.adAct(option.guitar, sim.lot || sim.home, null);
      if (option.song) act.song = option.song;
      return act;
    },

    guitarTick(world, sim, act, step, dt) {
      if (!step.tips) return;
      act.tipLeft = (act.tipLeft === undefined ? TIP_EVERY : act.tipLeft) - dt;
      if (act.tipLeft > 0) return;
      act.tipLeft += TIP_EVERY;
      const level = lvl(sim, 'guitar');
      let total = 0;
      for (const other of world.live) {
        if (other === sim || other.inside || other.car || world.family.includes(other) || Math.hypot(other.x - sim.x, other.z - sim.z) > TIP_RANGE) continue;
        if (S.roll(world.rng) >= TIP_CHANCE) continue;
        let tip = 2 + level * 1.5 * (0.5 + S.roll(world.rng));
        if (S.Traits.has(sim, 'virtuoso')) tip *= VIRTUOSO_TIPS;
        if (S.Skills.has(sim, 'square')) tip *= STAR_PERK;
        if (sim.rewards && sim.rewards.includes('moreCreative')) tip *= CREATIVE_TIPS;
        total += Math.round(tip);
      }
      if (!total) return;
      act.tipped = (act.tipped || 0) + total;
      world.funds += total;
      S.Skills.stat(world, sim, 'tips', total);
      if (act.tipped >= CONCERT) S.Skills.setStat(world, sim, 'concert', 1);
    },

    guitarDone(world, sim, act) {
      if (!sim.skill) return;
      if (act.ad === 'guitar_song') {
        S.Skills.stat(world, sim, 'songs', 1);
        const song = S.SONGS[act.song] || S.SONGS.scales, listeners = world.live.filter(o => o !== sim && !o.inside && !o.car && o.lot === sim.lot && Math.hypot(o.x - sim.x, o.z - sim.z) < 7);
        const family = listeners.filter(o => world.family.includes(o));
        for (const o of listeners) {
          if (o.needs) o.needs.fun = Math.min(100, o.needs.fun + 4 + lvl(sim, 'guitar') + (S.Skills.has(sim, 'hundredSongs') ? 4 : 0));
          const rel = S.Rel && world.rels ? S.Rel.get(world, sim, o) : null;
          if (rel) rel.v = S.clamp(rel.v + (1 + lvl(sim, 'guitar') / 5) * (S.Skills.has(sim, 'concert') ? 2 : 1), -100, 100);
        }
        if (sim.wish) {
          if (family.length) S.Wishes.bump(sim, 'songFamily');
          if (listeners.length >= 3) S.Wishes.bump(sim, 'songAll');
        }
        world.events.push({ type: 'art', sim: sim.id, text: sim.name + ' играет «' + song.name + '»' + (listeners.length ? ', слушателей: ' + listeners.length : '') });
      }
      if (act.ad === 'guitar_tips') {
        if (act.tipped) world.events.push({ type: 'money', amount: act.tipped, sim: sim.id, text: 'Чаевые за выступление: +§' + act.tipped });
        else world.events.push({ type: 'art', sim: sim.id, text: sim.name + ': сегодня никто не бросил ни монетки' });
        if (act.tipped && sim.wish) S.Wishes.bump(sim, 'tips');
      }
    },

    upgradesFor(sim, lot, item) {
      const model = S.baseOf(item), level = lvl(sim, 'handiness');
      return Object.values(S.UPGRADES).filter(u => u.models.includes(model)).map(u => {
        const done = !!(item.up && item.up.includes(u.id)), cost = S.Art.upgradeCost(sim, u);
        return { u, cost, closed: done ? 'Уже стоит' : S.AGE_RANK[sim.age] < S.AGE_RANK.teen ? 'Чинят и улучшают подростки и взрослые' : level < u.level ? 'Нужен ремонт ' + u.level : null };
      });
    },

    upgradeCost(sim, u) {
      let cost = u.cost;
      if (S.Traits.has(sim, 'handy')) cost *= HANDY_COST;
      if (S.Skills.has(sim, 'garage')) cost *= GARAGE_COST;
      return Math.round(cost);
    },

    upgradeMenu(world, sim, lot, item) {
      const list = S.Art.upgradesFor(sim, lot, item);
      if (!list.length || lot !== sim.home) return [];
      return [{ label: 'Улучшить…', section: list.map(({ u, cost, closed }) => ({ label: u.name + ' (§' + cost + ')', ad: 'upgrade', lot, item, upgrade: u.id, closed: closed || (world.funds < cost ? 'Не хватает денег' : null), tip: { title: u.name, text: u.text, line: 'Нужен ремонт ' + u.level + ', детали §' + cost } })) }];
    },

    upgradeMins(sim) {
      let k = 1;
      if (S.Traits.has(sim, 'handy')) k *= 0.75;
      if (S.Skills.has(sim, 'mechanic')) k *= MECHANIC_TIME;
      return k;
    },

    upgradeDone(world, sim, act) {
      const lot = world.lots[act.lot], item = lot.house.items[act.item], u = S.UPGRADES[act.upgrade];
      if (!u || (item.up && item.up.includes(u.id))) return;
      if (sim.wish) S.Wishes.bump(sim, 'upgrade_' + u.id);
      const cost = S.Art.upgradeCost(sim, u);
      if (!S.Econ.spend(world, cost)) {
        world.events.push({ type: 'art', sim: sim.id, text: 'На детали не хватило денег: нужно §' + cost });
        return;
      }
      const level = lvl(sim, 'handiness');
      const shock = u.electric && !S.Traits.has(sim, 'handy') && !S.Skills.has(sim, 'noShock') ? Math.max(0, SHOCK_BASE - SHOCK_STEP * level) * (S.Traits.has(sim, 'unlucky') ? 1.5 : 1) : 0;
      if (S.roll(world.rng) < shock) {
        world.funds += cost;
        S.Moods.add(sim, 'shock', 0, world);
        S.Skills.setStat(world, sim, 'noShockRun', 0);
        world.events.push({ type: 'art', sim: sim.id, text: sim.name + ': удар током! «' + u.name + '» не получилось, детали целы' });
        act.failed = true;
        return;
      }
      item.up = (item.up || []).concat([u.id]);
      S.Skills.stat(world, sim, 'upgrades', 1);
      if (u.electric) S.Skills.stat(world, sim, 'noShockRun', 1);
      if (sim.wish) S.Wishes.bump(sim, 'upgrade');
      world.events.push({ type: 'money', amount: -cost, sim: sim.id, text: sim.name + ' ставит «' + u.name + '»: детали −§' + cost });
    },

    boost(world, act, need) {
      if (!act || act.item < 0 || !world.lots[act.lot]) return 1;
      const item = world.lots[act.lot].house.items[act.item];
      if (!item || !item.up) return 1;
      let k = 1;
      for (const id of item.up) {
        const b = BOOSTS[id];
        if (b && b[0] === need) k *= b[1];
      }
      return k;
    },

    fireproof: item => !!(item && item.up && item.up.includes('fireproof')),

    freezer: lot => lot.house.items.some(item => item.up && item.up.includes('freezer')),

    itemMenu(world, sim, it, index) {
      if (it.k === 'painting') return [{ label: 'Продать за §' + Math.round(it.v * (S.Skills.has(sim, 'pricey') ? PRICEY : 1)), bag: index, use: 'sell' }];
      if (it.k === 'manuscript') return [{ label: 'Отдать издателю', bag: index, use: 'publish', tip: { title: it.n, text: 'Аванс §' + Math.round(it.x.r * ADVANCE * (S.Skills.has(sim, 'prolific') ? PROLIFIC : 1)) + ' сразу, потом §' + it.x.r + ' в неделю ' + ROYALTY_WEEKS + ' недель.' } }];
      if (it.k === 'book') return [{ label: 'Почитать', bag: index, use: 'read' }];
      if (it.k === 'guitar') return S.Art.selfMenu(world, sim);
      return [];
    },

    use(world, sim, index, use, option) {
      if (use === 'sell') {
        S.Art.sellPainting(world, sim, index);
        return null;
      }
      if (use === 'publish') {
        S.Art.publish(world, sim, index);
        return null;
      }
      if (use === 'read') return S.Acts.adAct('book_own', sim.home, null);
      if (option && option.guitar) return S.Art.guitarAct(world, sim, option);
      return null;
    },

    pack(world) {
      const canvases = [], upgrades = [];
      for (const lot of world.lots) {
        if (lot.canvases) for (const [i, c] of Object.entries(lot.canvases)) canvases.push([lot.index, +i, c.size, c.style, c.done, c.need, c.by]);
        lot.house.items.forEach((item, i) => { if (item.up && item.up.length) upgrades.push([lot.index, i, item.up.slice()]); });
      }
      return { canvases, upgrades, books: (world.books || []).map(b => [b.t, b.by, b.r, b.left, b.next]) };
    },

    unpack(world, r) {
      if (r === null || r === undefined) return null;
      if (!r || !Array.isArray(r.canvases) || !Array.isArray(r.upgrades) || !Array.isArray(r.books)) throw new Error('повреждено творчество');
      for (const c of r.canvases) {
        if (!Array.isArray(c) || c.length !== 7 || !world.lots[c[0]] || !(c[1] >= 0 && c[1] < world.lots[c[0]].house.items.length) || !S.PAINT_SIZES[c[2]] || !S.PAINT_STYLES[c[3]] || !Number.isFinite(c[4]) || !Number.isFinite(c[5])) throw new Error('повреждён холст');
      }
      for (const u of r.upgrades) {
        if (!Array.isArray(u) || u.length !== 3 || !world.lots[u[0]] || !(u[1] >= 0 && u[1] < world.lots[u[0]].house.items.length) || !Array.isArray(u[2]) || !u[2].every(id => S.UPGRADES[id])) throw new Error('неизвестное улучшение в файле');
      }
      for (const b of r.books) {
        if (!Array.isArray(b) || b.length !== 5 || typeof b[0] !== 'string' || ![b[2], b[3], b[4]].every(Number.isFinite)) throw new Error('повреждены гонорары');
      }
      return r;
    },

    apply(world, r) {
      for (const lot of world.lots) {
        delete lot.canvases;
        for (const item of lot.house.items) delete item.up;
      }
      world.books = [];
      if (!r) return;
      for (const [lotIndex, i, size, style, done, need, by] of r.canvases) {
        const lot = world.lots[lotIndex];
        (lot.canvases || (lot.canvases = {}))[i] = { size, style, done, need, by };
      }
      for (const [lotIndex, i, list] of r.upgrades) world.lots[lotIndex].house.items[i].up = list.slice();
      world.books = r.books.map(b => ({ t: b[0], by: b[1], r: b[2], left: b[3], next: b[4] }));
    },

    packSim(sim) {
      return sim.novel ? [sim.novel.genre, sim.novel.done, sim.novel.need, sim.novel.title] : null;
    },

    unpackSim(r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r) || r.length !== 4 || !S.GENRES[r[0]] || !Number.isFinite(r[1]) || !Number.isFinite(r[2]) || typeof r[3] !== 'string') throw new Error('повреждена рукопись жителя');
      return { genre: r[0], done: r[1], need: r[2], title: r[3] };
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
