class FerrumSite {
  constructor() {
    this.baseUrl = 'http://www.ferrum98.ru';
    this.issueDate = '25.11.1998';
    this.issueDay = 'Среда, 25 ноября 1998 г.';
    this.issueNumber = 47;
    this.usdRate = 20.60;
    this.mmvbRate = 17.88;
    this.hitsBase = 1184300;
    this.storageKeys = {
      comments: 'win98_ferrum_comments_v1',
      poll: 'win98_ferrum_poll_v1',
      threads: 'win98_ferrum_threads_v1',
      bench: 'win98_ferrum_bench_v1',
      jumpers: 'win98_ferrum_jumpers_v1',
      rig: 'win98_ferrum_rig_v1',
      encoding: 'win98_ferrum_enc_v1',
      hits: 'win98_ferrum_hits_v1'
    };
    this.bannerIndex = 0;
    this.lastStatusMsg = '';
    this.statusPath = '';
    this.hitCounted = false;
    this.chipCheckCode = 'SL32A';
    const d = (typeof window !== 'undefined' && window.ferrumData) || {};
    this.data = d;
    this.categories = d.categories || [];
    this.banners = d.banners || [];
    this.articles = d.articles || [];
    this.benchCpus = d.benchCpus || [];
    this.benchGpus = d.benchGpus || [];
    this.priceCatalog = d.priceCatalog || [];
    this.chipDatabase = d.chipDatabase || [];
    this.seedThreads = d.seedThreads || [];
    this.areas = d.areas || [];
    this.lab = d.lab || {};
    this.slotTitles = {
      cpu: 'Процессоры',
      mb: 'Системные платы',
      ram: 'Память SDRAM',
      video: 'Видеоплаты и 3D-ускорители',
      hdd: 'Винчестеры',
      extra: 'Звук и модемы'
    };
    this.navItems = [
      { id: 'home', jp: 'JP1', label: 'Сводка', path: '' },
      { id: 'news', jp: 'JP2', label: 'Протоколы', path: '/news' },
      { id: 'bench', jp: 'JP3', label: 'Стенд FPS', path: '/bench' },
      { id: 'jumpers', jp: 'JP4', label: 'Перемычки', path: '/jumpers' },
      { id: 'prices', jp: 'JP5', label: 'Прайс', path: '/prices' },
      { id: 'forum', jp: 'JP6', label: 'Эха', path: '/forum' },
      { id: 'about', jp: 'JP7', label: 'О цехе', path: '/about' }
    ];
  }

  esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  rich(text) {
    return this.esc(text).replace(/`([^`]+)`/g, '<tt class="ferrum-tt">$1</tt>');
  }

  plain(text) {
    return String(text == null ? '' : text).replace(/`/g, '');
  }

  gif(name, scale = 1) {
    return typeof window !== 'undefined' && typeof window.webGif === 'function' ? window.webGif(name, scale) : '';
  }

  sound(method) {
    if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[method] === 'function') {
      window.soundSys[method]();
    }
  }

  readJson(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  writeJson(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {}
  }

  getEncoding() {
    const saved = this.readJson(this.storageKeys.encoding, 'win1251');
    return ['win1251', 'koi8r', 'translit'].includes(saved) ? saved : 'win1251';
  }

  setEncoding(enc) {
    const valid = ['win1251', 'koi8r', 'translit'].includes(enc) ? enc : 'win1251';
    this.writeJson(this.storageKeys.encoding, valid);
    return valid;
  }

  toTranslit(str) {
    const map = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': "'", 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
      'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': "'", 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    return String(str).replace(/[А-Яа-яЁё]/g, ch => (map[ch] !== undefined ? map[ch] : ch));
  }

  encodeHtml(html) {
    if (this.getEncoding() !== 'translit') return html;
    return String(html).replace(/>([^<]+)</g, (full, text) => `>${this.toTranslit(text)}<`);
  }

  rub(usd) {
    return Math.round(Number(usd || 0) * this.usdRate);
  }

  url(path = '') {
    return `${this.baseUrl}${path}`;
  }

  link(path, text, cls = 'ferrum-link') {
    return `<a class="${cls}" data-url="${this.esc(this.url(path))}">${text}</a>`;
  }

  categoryOf(id) {
    return this.categories.find(c => c.id === id) || null;
  }

  shortDate(date) {
    return String(date || '').slice(0, 5);
  }

  fidoDate(date) {
    const m = String(date || '').match(/^(\d{2})\.(\d{2})\.\d{2}(\d{2})\s+(\d{2}:\d{2})/);
    if (!m) return this.esc(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${m[1]} ${months[Number(m[2]) - 1]} ${m[3]}  ${m[4]}:00`;
  }

  getArticles(cat = 'all') {
    if (!cat || cat === 'all') return this.articles.slice();
    return this.articles.filter(a => a.cat === cat);
  }

  getArticle(id) {
    return this.articles.find(a => a.id === id) || null;
  }

  protocolNo(article) {
    const idx = this.articles.findIndex(a => a.id === article.id);
    return `${this.issueNumber}-${String(idx + 1).padStart(2, '0')}`;
  }

  getComments(articleId) {
    const all = this.readJson(this.storageKeys.comments, {});
    const userList = Array.isArray(all[articleId]) ? all[articleId] : [];
    const seeds = (this.data.commentSeeds || {})[articleId] || [];
    return seeds.concat(userList);
  }

  addComment(articleId, author, text) {
    const cleanAuthor = String(author || '').trim() || 'Читатель_Стенда';
    const cleanText = String(text || '').trim();
    if (!cleanText) return null;
    const all = this.readJson(this.storageKeys.comments, {});
    if (!Array.isArray(all[articleId])) all[articleId] = [];
    const entry = {
      author: cleanAuthor.slice(0, 40),
      date: '25.11.1998 19:55',
      text: cleanText.slice(0, 600),
      reply: this.buildEngineerReply(cleanText)
    };
    all[articleId].push(entry);
    this.writeJson(this.storageKeys.comments, all);
    this.sound('playDing');
    return entry;
  }

  buildEngineerReply(text) {
    const low = String(text || '').toLowerCase();
    if (low.includes('cih') || low.includes('чернобыл') || low.includes('bios') || low.includes('биос')) {
      return 'Инж. Воробьёв: Напоминаю, что антивирусный монитор в памяти Win 98 можно обойти, а разомкнутую перемычку JP1 (+12V Vpp / WE#) не пробьёт ни один полиморфный код.';
    }
    if (low.includes('celeron') || low.includes('300a') || low.includes('450') || low.includes('b21') || low.includes('разгон')) {
      return 'Инж. Воробьёв: Главное при разгоне Celeron 300A до 450 МГц — убедиться, что делитель PCI стоит на 1/3 (33.3 МГц), а радиатор посажен на пасту КПТ-8.';
    }
    if (low.includes('voodoo') || low.includes('tnt') || low.includes('3dfx') || low.includes('nvidia')) {
      return 'Инж. Воробьёв: Для старых игр на API Glide держите Voodoo2, а если берёте одну плату в слот AGP 2x под 32-битный цвет — смотрите на Riva TNT с дополнительным вентилятором.';
    }
    if (low.includes('бп') || low.includes('fsp') || low.includes('пульсац') || low.includes('конденсатор') || low.includes('230w') || low.includes('atx')) {
      return 'Инж. Воробьёв: Вскрывайте блок питания до включения в сеть: если вместо входного дросселя стоят проволочные перемычки, а блок весит меньше килограмма — не ставьте его в машину с жёстким диском IBM.';
    }
    if (low.includes('i740') || low.includes('dime') || low.includes('aperture') || low.includes('agp')) {
      return 'Инж. Воробьёв: Ускоритель Intel740 хранит все текстуры в системной SDRAM, поэтому без 64 МБ PC100 и окна AGP Aperture Size = 64MB в BIOS вы упрётесь в своп на диск.';
    }
    if (low.includes('пельтье') || low.includes('тэмо') || low.includes('конденсат') || low.includes('роса')) {
      return 'Инж. Воробьёв: Модуль Пельтье без герметизации гнезда Slot 1 неопреном и нейтральным герметиком за полчаса соберёт капли конденсата прямо на контактах шины.';
    }
    if (low.includes('teac') || low.includes('532') || low.includes('болванк') || low.includes('underrun') || low.includes('cd-r')) {
      return 'Инж. Воробьёв: Для кривых штамповок с Горбушки лучше честного 32-скоростного Teac CD-532E со стеклянной линзой ничего нет, а при прожиге CD-R на 4x держите буфер рекордера полным.';
    }
    if (low.includes('cyrix') || low.includes('mii') || low.includes('fpu') || low.includes('83 мгц')) {
      return 'Инж. Воробьёв: PR-рейтинг Cyrix MII-300 справедлив только в офисной целочисленной нагрузке; в Quake II неконвейеризованный сопроцессор FPU и шина PCI 41.6 МГц станут узким местом.';
    }
    if (low.includes('trinitron') || low.includes('монитор') || low.includes('sony') || low.includes('viewsonic') || low.includes('апертур')) {
      return 'Инж. Воробьёв: Перед покупкой 17-дюймовой трубки обязательно прогоните сетку Nokia Monitor Test на 1024x768 при 85 Гц — сведение лучей по углам покажет состояние строчного трансформатора.';
    }
    if (low.includes('ps2rate') || low.includes('мышь') || low.includes('mitsumi') || low.includes('logitech') || low.includes('шарик')) {
      return 'Инж. Воробьёв: Пересадка мыши с COM1 (40 Гц) на порт PS/2 с разгоном опроса до 100–200 Гц через PS2Rate убирает ступенчатость прицела лучше любого коврика.';
    }
    if (low.includes('2000') || low.includes('y2k') || low.includes('rtc') || low.includes('70h') || low.includes('cmos')) {
      return 'Инж. Воробьёв: Не платите мошенникам за сертификаты Проблемы-2000: проверьте регистр века 32h в часах MC146818A через штатный DEBUG.EXE за две минуты.';
    }
    if (low.includes('vcache') || low.includes('swap') || low.includes('своп') || low.includes('fat32') || low.includes('system.ini')) {
      return 'Инж. Воробьёв: Ограничьте аппетит VCACHE строкой MaxFileCache=16384 в SYSTEM.INI и зафиксируйте постоянный файл подкачки WIN386.SWP на 128 МБ — треск головок винчестера прекратится.';
    }
    return 'Инж. Воробьёв: Замечание занесено в лабораторный журнал стенда #1 от 25.11.1998.';
  }

  getPollState() {
    const def = {
      voted: null,
      counts: { cel300a: 184, voodoo2: 142, rivatnt: 119, abitbh6: 96, k62_350: 63 }
    };
    const saved = this.readJson(this.storageKeys.poll, null);
    if (!saved || typeof saved !== 'object' || !saved.counts) return def;
    return {
      voted: saved.voted || null,
      counts: Object.assign({}, def.counts, saved.counts)
    };
  }

  votePoll(optionId) {
    const state = this.getPollState();
    if (!Object.prototype.hasOwnProperty.call(state.counts, optionId)) return state;
    state.counts[optionId] = (state.counts[optionId] || 0) + 1;
    state.voted = optionId;
    this.writeJson(this.storageKeys.poll, state);
    this.sound('playDing');
    return state;
  }

  getHits() {
    const local = Number(this.readJson(this.storageKeys.hits, 0)) || 0;
    return this.hitsBase + local;
  }

  countHit() {
    if (this.hitCounted) return;
    this.hitCounted = true;
    const local = Number(this.readJson(this.storageKeys.hits, 0)) || 0;
    this.writeJson(this.storageKeys.hits, local + 1);
  }

  getBenchState() {
    const def = { cpu: 'cel300a_450', gpu: 'tnt', mode: '800x600x16', runs: 0 };
    const saved = this.readJson(this.storageKeys.bench, null);
    if (!saved || typeof saved !== 'object') return def;
    return Object.assign({}, def, saved);
  }

  setBenchState(patch) {
    const next = Object.assign({}, this.getBenchState(), patch || {});
    this.writeJson(this.storageKeys.bench, next);
    return next;
  }

  computeBenchmark(state = this.getBenchState()) {
    const cpu = this.benchCpus.find(c => c.id === state.cpu) || this.benchCpus[4];
    const gpu = this.benchGpus.find(g => g.id === state.gpu) || this.benchGpus[4];
    const mode = state.mode || '800x600x16';
    const is32 = mode.endsWith('x32');
    const resScale = mode.startsWith('640x480') ? 1.32 : mode.startsWith('1024x768') ? 0.64 : 1.0;

    let q2Fps = gpu.q2_16 * resScale * (0.45 + 0.55 * cpu.score);
    let unrealFps = gpu.unreal * resScale * (0.52 + 0.48 * cpu.score);
    let mark3d = Math.round(gpu.mark99 * (0.40 + 0.60 * cpu.score));
    let warning = '';

    if (is32 && !gpu.supports32) {
      q2Fps = 0;
      unrealFps = 0;
      mark3d = 0;
      warning = `АППАРАТНОЕ ОГРАНИЧЕНИЕ: Ускоритель ${gpu.name} поддерживает кадровый буфер только 16 бит (65536 цветов). Режим 32-бит TrueColor на чипах 3dfx и S3 Virge недоступен!`;
    } else if (is32 && gpu.supports32) {
      const pen = gpu.penalty32 || 0.75;
      q2Fps = q2Fps * pen;
      unrealFps = unrealFps * (pen * 0.95);
      mark3d = Math.round(mark3d * pen);
    }

    if (!warning && cpu.id === 'cel266' && (gpu.id === 'voodoo2_sli' || gpu.id === 'voodoo3_3000')) {
      warning = 'УЗКОЕ МЕСТО СТЕНДА: Бескэшевый Celeron 266 (Covington) без кэша L2 не успевает готовить треугольники для мощного 3D-ускорителя!';
    }

    const totalUsd = cpu.usd + gpu.usd;
    const totalWatts = +(cpu.watts + gpu.watts).toFixed(1);
    const fpsPer100Usd = q2Fps > 0 ? +((q2Fps / totalUsd) * 100).toFixed(1) : 0;

    return {
      cpu,
      gpu,
      mode,
      is32,
      q2Fps: +q2Fps.toFixed(1),
      unrealFps: +unrealFps.toFixed(1),
      mark3d,
      refQ2: 52.1,
      refUnreal: 44.0,
      refMark: 2780,
      totalUsd,
      totalRub: this.rub(totalUsd),
      totalWatts,
      tempC: Math.round(cpu.temp + (gpu.watts * 0.35)),
      fpsPer100Usd,
      warning
    };
  }

  getJumperState() {
    const def = {
      fsb: 100,
      mult: 4.5,
      b21Taped: true,
      vcore: '2.00',
      jp1Protected: true,
      closeBo31337: true,
      closeNb12345: true,
      unbindNetbios139: true
    };
    const saved = this.readJson(this.storageKeys.jumpers, null);
    if (!saved || typeof saved !== 'object') return def;
    return Object.assign({}, def, saved);
  }

  setJumperState(patch) {
    const next = Object.assign({}, this.getJumperState(), patch || {});
    this.writeJson(this.storageKeys.jumpers, next);
    return next;
  }

  evaluateJumpers(st = this.getJumperState()) {
    const fsb = Number(st.fsb) || 100;
    const mult = Number(st.mult) || 4.5;
    const b21Taped = Boolean(st.b21Taped);
    const effectiveFsb = (fsb >= 100 && !b21Taped) ? 66.6 : fsb;
    const cpuMhz = Math.round(effectiveFsb * mult);
    const pciDiv = effectiveFsb >= 133 ? 4 : effectiveFsb >= 100 ? 3 : 2;
    const pciMhz = +(effectiveFsb / pciDiv).toFixed(1);
    const agpRatio = effectiveFsb >= 100 ? (2 / 3) : 1;
    const agpMhz = +(effectiveFsb * agpRatio).toFixed(1);

    let busStatus = 'Шины в штатном режиме: PCI 33.3 МГц, AGP 66.6 МГц. Можно работать.';
    let busDanger = false;
    if (fsb >= 100 && !b21Taped) {
      busStatus = 'КОНТАКТ B21 НЕ ИЗОЛИРОВАН: плата прочитала BSEL#=0 с процессора Celeron и сбросила шину на 66.6 МГц.';
      busDanger = true;
    } else if (pciMhz > 38.5) {
      busStatus = `ОПАСНО ДЛЯ ДАННЫХ: шина PCI разогнана до ${pciMhz} МГц, контроллер UltraDMA/33 может разрушить таблицу FAT32 на винчестере.`;
      busDanger = true;
    } else if (agpMhz > 76.0) {
      busStatus = `Внимание: шина AGP работает на ${agpMhz} МГц. Платы Matrox G200 и старые i740 могут зависать в 3D.`;
    }

    const secIssues = [];
    if (!st.jp1Protected) secIssues.push('Джампер JP1 в положении Write Enable (+12V): микросхема Flash BIOS открыта для вируса Win95.CIH (Чернобыль).');
    if (!st.closeBo31337) secIssues.push('Порт UDP 31337 слушает сервер трояна Back Orifice v1.20.');
    if (!st.closeNb12345) secIssues.push('Порт TCP 12345 слушает сервер трояна NetBus 1.70.');
    if (!st.unbindNetbios139) secIssues.push('Порт TCP 139 (NetBIOS) привязан к контроллеру удалённого доступа: общие папки видны из сети провайдера.');

    return {
      effectiveFsb,
      cpuMhz,
      pciDiv,
      pciMhz,
      agpMhz,
      busStatus,
      busDanger,
      secIssues,
      isSecure: secIssues.length === 0
    };
  }

  getRigState() {
    const def = {
      cpu: 'cpu_cel300a',
      mb: 'mb_abit_bh6',
      ram: 'ram_64_sec_gh',
      video: 'vid_tnt_asus',
      hdd: 'hdd_ibm_101',
      extra: 'snd_sblive_usr',
      market: 'mit'
    };
    const saved = this.readJson(this.storageKeys.rig, null);
    if (!saved || typeof saved !== 'object') return def;
    return Object.assign({}, def, saved);
  }

  setRigState(patch) {
    const next = Object.assign({}, this.getRigState(), patch || {});
    this.writeJson(this.storageKeys.rig, next);
    return next;
  }

  calculateRig(rig = this.getRigState()) {
    const slots = ['cpu', 'mb', 'ram', 'video', 'hdd', 'extra'];
    const market = rig.market === 'sav' ? 'sav' : 'mit';
    const items = slots.map(slot => {
      const found = this.priceCatalog.find(p => p.id === rig[slot] && p.slot === slot);
      return found || this.priceCatalog.find(p => p.slot === slot);
    }).filter(Boolean);
    const totalUsd = items.reduce((sum, item) => sum + (market === 'sav' ? item.sav : item.mit), 0);
    const totalRub = this.rub(totalUsd);
    return { market, items, totalUsd, totalRub };
  }

  getThreads(cat = 'all') {
    const custom = this.readJson(this.storageKeys.threads, []);
    const map = new Map();
    this.seedThreads.forEach(t => map.set(t.id, JSON.parse(JSON.stringify(t))));
    if (Array.isArray(custom)) {
      custom.forEach(t => {
        if (!t || !t.id) return;
        if (map.has(t.id)) {
          const base = map.get(t.id);
          if (Array.isArray(t.extraPosts)) base.posts = base.posts.concat(t.extraPosts);
        } else if (Array.isArray(t.posts)) {
          map.set(t.id, t);
        }
      });
    }
    const list = Array.from(map.values());
    if (!cat || cat === 'all') return list;
    return list.filter(t => t.cat === cat);
  }

  getThread(id) {
    return this.getThreads('all').find(t => t.id === id) || null;
  }

  addThreadReply(threadId, author, text) {
    const cleanAuthor = String(author || '').trim() || 'Гость_Стенда';
    const cleanText = String(text || '').trim();
    if (!cleanText) return null;
    const custom = this.readJson(this.storageKeys.threads, []);
    const post = {
      author: cleanAuthor.slice(0, 40),
      role: 'Участник конференции',
      date: '25.11.1998 20:05',
      text: cleanText.slice(0, 700)
    };
    const autoPost = {
      author: 'Инж. Воробьёв (Стенд #1)',
      role: 'Модератор лаборатории',
      date: '25.11.1998 20:06',
      text: this.buildEngineerReply(cleanText).replace('Инж. Воробьёв: ', '')
    };
    let record = custom.find(t => t && t.id === threadId);
    if (!record) {
      record = { id: threadId, extraPosts: [] };
      custom.push(record);
    }
    if (Array.isArray(record.posts)) {
      record.posts.push(post, autoPost);
    } else {
      if (!Array.isArray(record.extraPosts)) record.extraPosts = [];
      record.extraPosts.push(post, autoPost);
    }
    this.writeJson(this.storageKeys.threads, custom);
    this.sound('playDing');
    return post;
  }

  createThread(cat, title, author, text) {
    const cleanTitle = String(title || '').trim();
    const cleanText = String(text || '').trim();
    const cleanAuthor = String(author || '').trim() || 'Инженер_Гость';
    if (!cleanTitle || !cleanText) return null;
    const id = 'user_' + Date.now();
    const custom = this.readJson(this.storageKeys.threads, []);
    const newThread = {
      id,
      cat: ['oc', 'video', 'bios', 'sec', 'market'].includes(cat) ? cat : 'oc',
      title: cleanTitle.slice(0, 100),
      author: cleanAuthor.slice(0, 40),
      date: '25.11.1998 20:10',
      posts: [
        {
          author: cleanAuthor.slice(0, 40),
          role: 'Автор темы',
          date: '25.11.1998 20:10',
          text: cleanText.slice(0, 700)
        },
        {
          author: 'Мастер_Паяльник',
          role: 'Дежурный по конференции',
          date: '25.11.1998 20:11',
          text: `Тема принята в протокол от 25.11.1998. ${this.buildEngineerReply(cleanTitle + ' ' + cleanText).replace('Инж. Воробьёв: ', '')}`
        }
      ]
    };
    custom.unshift(newThread);
    this.writeJson(this.storageKeys.threads, custom);
    this.sound('playDing');
    return newThread;
  }

  articleText(article) {
    const a = typeof article === 'string' ? this.getArticle(article) : article;
    if (!a) return '';
    return [
      '========================================================================',
      'ИСПЫТАТЕЛЬНАЯ ЛАБОРАТОРИЯ «ЖЕЛЕЗНЫЙ ЦЕХ \'98» (HTTP://WWW.FERRUM98.RU)',
      `Протокол № ${this.protocolNo(a)} от ${a.date}`,
      `Тема: ${a.title}`,
      '========================================================================',
      '',
      `Объект испытаний : ${a.specs.unit}`,
      `Тестовый стенд   : ${a.specs.stand}`,
      `Режим и частоты  : ${a.specs.clocks}`,
      `Рыночная цена    : ${a.specs.price}`,
      `Вердикт цеха     : ${a.specs.verdict}`,
      '',
      '--- СХЕМА / ТЕЛЕМЕТРИЯ ---',
      a.schematic.join('\r\n'),
      '',
      '--- ПОЛНЫЙ ОТЧЁТ ЛАБОРАТОРИИ ---',
      ...a.body.map(p => this.plain(p) + '\r\n'),
      `Протокол составил: ${a.byline || 'Инж. С. Воробьёв, стенд #1'}`,
      '========================================================================',
      'Документ подготовлен для чтения в Блокноте Win 98 (кодировка Win-1251).'
    ].join('\r\n');
  }

  benchmarkReportText(state = this.getBenchState()) {
    const res = this.computeBenchmark(state);
    return [
      '========================================================================',
      'ПРОТОКОЛ ИСПЫТАНИЙ ТЕСТОВОГО СТЕНДА «ЖЕЛЕЗНЫЙ ЦЕХ \'98» ОТ 25.11.1998',
      '========================================================================',
      `Процессор        : ${res.cpu.name}`,
      `3D-ускоритель    : ${res.gpu.name}`,
      `Режим экрана     : ${res.mode}`,
      'ОС и драйверы    : Win 98 RUS + Microslop DirectX 6.0',
      '------------------------------------------------------------------------',
      `Quake II v3.19 (demo1.dm2) : ${res.q2Fps} кадр/с (эталон PII-350/V2: ${res.refQ2})`,
      `Unreal (Castle Flyby)      : ${res.unrealFps} кадр/с (эталон PII-350/V2: ${res.refUnreal})`,
      `3DMark 99 (3D Marks)       : ${res.mark3d} очков (эталон PII-350/V2: ${res.refMark})`,
      `Тепловыделение связки      : ${res.totalWatts} Вт (расчётная t° радиатора: ${res.tempC}°C)`,
      `Стоимость комплекта        : $${res.totalUsd} у.е. (${res.totalRub} руб. по курсу 20.60)`,
      `Индекс отдачи (FPS/$100)   : ${res.fpsPer100Usd} кадр/с на 100 у.е.`,
      res.warning ? `ПРИМЕЧАНИЕ СТЕНДА: ${res.warning}` : 'ПРИМЕЧАНИЕ СТЕНДА: Конфликтов прерываний и ограничений буфера не выявлено.',
      '========================================================================'
    ].join('\r\n');
  }

  jumperMemoText(st = this.getJumperState()) {
    const ev = this.evaluateJumpers(st);
    return [
      '========================================================================',
      'ПАМЯТКА ПО КОНФИГУРАЦИИ ПЕРЕМЫЧЕК И ЗАЩИТЕ WIN 98 ОТ 25.11.1998',
      'Сервер испытательной лаборатории «Железный Цех \'98» (www.ferrum98.ru)',
      '========================================================================',
      '',
      '[1] АППАРАТНАЯ КОНФИГУРАЦИЯ SLOT 1 И ШИН 440BX:',
      `  Заданная шина FSB       : ${st.fsb} МГц (эффективная: ${ev.effectiveFsb} МГц)`,
      `  Контакт B21 (BSEL#)     : ${st.b21Taped ? 'ИЗОЛИРОВАН скотчем/лаком (принудительно 100 МГц)' : 'ОТКРЫТ (заводской режим)'}`,
      `  Итоговая частота ЦП     : ${ev.cpuMhz} МГц (множитель x${st.mult}, Vcore ${st.vcore} В)`,
      `  Частота шины PCI        : ${ev.pciMhz} МГц (делитель 1/${ev.pciDiv})`,
      `  Частота шины AGP        : ${ev.agpMhz} МГц`,
      `  Диагноз шинного стенда  : ${ev.busStatus}`,
      '',
      '[2] ЗАЩИТА ОТ ВИРУСА WIN95.CIH (ЧЕРНОБЫЛЬ) И ТРОЯНОВ DIAL-UP:',
      `  Джампер Flash BIOS JP1  : ${st.jp1Protected ? '2-3 Write Protect (ЗАЩИЩЕНО от перезаписи Boot-блока)' : '1-2 Write Enable (УЯЗВИМО ДЛЯ CIH v1.4!)'}`,
      `  Порт UDP 31337 (BO)     : ${st.closeBo31337 ? 'Проверен / Закрыт' : 'ОТКРЫТ (риск Back Orifice!)'}`,
      `  Порт TCP 12345 (NetBus) : ${st.closeNb12345 ? 'Проверен / Закрыт' : 'ОТКРЫТ (риск NetBus!)'}`,
      `  Порт TCP 139 (NetBIOS)  : ${st.unbindNetbios139 ? 'Отвязан от Контроллера удалённого доступа' : 'Светит общими папками в сеть провайдера!'}`,
      '',
      '[3] КОМАНДЫ ДЛЯ БЫСТРОЙ ПРОВЕРКИ В СЕАНСЕ MS-DOS:',
      '  netstat -an',
      '  regedit -> HKEY_LOCAL_MACHINE\\Software\\Microslop\\Win\\CurrentVersion\\RunServices',
      '========================================================================'
    ].join('\r\n');
  }

  priceInvoiceText(rig = this.getRigState()) {
    const calc = this.calculateRig(rig);
    const marketName = calc.market === 'sav' ? 'Савёловский радиорынок' : 'Митинский радиорынок';
    const lines = calc.items.map((item, idx) => {
      const usd = calc.market === 'sav' ? item.sav : item.mit;
      return `${idx + 1}. ${item.name} — $${usd} у.е. (${this.rub(usd)} руб.) [Гар: ${item.war}]`;
    });
    return [
      '========================================================================',
      'КОМПЛЕКТОВОЧНАЯ ВЕДОМОСТЬ (СМЕТА ПК) НА 25 НОЯБРЯ 1998 ГОДА',
      'Испытательная лаборатория «Железный Цех \'98» (http://www.ferrum98.ru)',
      `База цен: ${marketName} | Наличный курс: 1 у.е. = ${this.usdRate.toFixed(2)} руб. (ММВБ: ${this.mmvbRate})`,
      '========================================================================',
      '',
      ...lines,
      '',
      '------------------------------------------------------------------------',
      `ИТОГО В УСЛОВНЫХ ЕДИНИЦАХ : $${calc.totalUsd} у.е.`,
      `ИТОГО В РУБЛЯХ (НАЛИЧНЫМИ): ${calc.totalRub} руб. 00 коп.`,
      '========================================================================',
      'Памятка: При получении памяти SDRAM PC100 требуйте проверки при CAS=2!'
    ].join('\r\n');
  }

  saveTextToVfs(fileName, content) {
    const cleanName = String(fileName || 'FERRUM_REPORT.TXT');
    if (typeof window !== 'undefined' && window.vfs && typeof window.vfs.writeFile === 'function') {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], cleanName, content);
    }
    this.sound('playDing');
    this.lastStatusMsg = `Файл ${cleanName} записан в папку «Мои документы» (C:\\My Documents).`;
    return cleanName;
  }

  openInNotepad(title, content) {
    if (typeof window !== 'undefined' && window.appNotepad && typeof window.appNotepad.open === 'function') {
      window.appNotepad.open(title, content);
    }
    this.sound('playClick');
    this.lastStatusMsg = `Файл ${title} открыт в Блокноте.`;
    return true;
  }

  parseUrl(url) {
    const raw = String(url || this.baseUrl).trim();
    const noProto = raw.replace(/^https?:\/{2}/i, '');
    const slashIdx = noProto.indexOf('/');
    const pathAndQuery = slashIdx >= 0 ? noProto.slice(slashIdx) : '/';
    const [rawPath, rawQuery = ''] = pathAndQuery.split('#')[0].split('?');
    const path = (rawPath || '/').replace(/\/+$/, '') || '/';
    const params = {};
    if (rawQuery) {
      rawQuery.split('&').forEach(pair => {
        if (!pair) return;
        const [k, v = ''] = pair.split('=');
        try {
          params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (e) {
          params[k] = v;
        }
      });
    }

    if (path === '/' || path === '/index.html' || path === '/home') return { page: 'home', path, params };
    if (path === '/news') return { page: 'news', path, cat: params.cat || 'all', params };
    if (path === '/article' || path.startsWith('/article/')) {
      return { page: 'article', path, id: params.id || path.slice('/article/'.length), params };
    }
    if (path === '/bench' || path === '/benchmarks') return { page: 'bench', path, params };
    if (path === '/jumpers' || path === '/dip' || path === '/security') return { page: 'jumpers', path, params };
    if (path === '/prices' || path === '/price') return { page: 'prices', path, params };
    if (path === '/forum' || path === '/conf') return { page: 'forum', path, cat: params.cat || 'all', params };
    if (path === '/thread' || path.startsWith('/thread/')) {
      return { page: 'thread', path, id: params.id || path.slice('/thread/'.length), params };
    }
    if (path === '/about' || path === '/lab') return { page: 'about', path, params };
    return { page: 'notfound', path, params };
  }

  renderMastSvg() {
    const traces = [
      'M0 18 H96 L112 34 H128',
      'M0 100 H40 L56 84 H120',
      'M572 12 H600',
      'M560 96 H610 L626 80 H640',
      'M736 30 V70 L720 86 H690',
      'M128 8 H560',
      'M520 100 H560'
    ].map(d => `<path d="${d}" stroke="#14753f" stroke-width="3" fill="none"/>`).join('');
    const vias = [[128, 34], [120, 84], [600, 12], [640, 80], [690, 86], [560, 8], [560, 100], [96, 60]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#d4a93c"/><circle cx="${x}" cy="${y}" r="1.4" fill="#06301b"/>`).join('');
    const legs = [];
    for (let i = 0; i < 16; i++) {
      const x = 604 + i * 7.6;
      legs.push(`<rect x="${x.toFixed(1)}" y="14" width="3.6" height="7" fill="#c9c9c9"/>`);
      legs.push(`<rect x="${x.toFixed(1)}" y="79" width="3.6" height="7" fill="#c9c9c9"/>`);
    }
    return `
      <svg class="ferrum-mast-svg" width="760" height="104" viewBox="0 0 760 104" xmlns="http://www.w3.org/2000/svg">
        <rect width="760" height="104" fill="#0b5a32"/>
        ${traces}
        ${vias}
        <circle cx="16" cy="16" r="8" fill="#d4a93c"/><circle cx="16" cy="16" r="4.5" fill="#1a1a1a"/>
        <circle cx="48" cy="54" r="22" fill="#26408c" stroke="#c9c9c9" stroke-width="2"/>
        <path d="M34 54 H62 M48 40 V68" stroke="#7d8fc9" stroke-width="2"/>
        <text x="26" y="92" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">C12 1000uF</text>
        <rect x="140" y="16" width="420" height="74" fill="none" stroke="#f4f4e8" stroke-width="1.5"/>
        <rect x="140" y="16" width="10" height="10" fill="#f4f4e8"/>
        <text x="153" y="26" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">U1</text>
        <text x="350" y="56" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="33" fill="#f4f4e8">ЖЕЛЕЗНЫЙ ЦЕХ '98</text>
        <text x="350" y="78" text-anchor="middle" font-family="Courier New, monospace" font-size="11" fill="#f4f4e8">FERRUM-98 REV 1.02 • ИСПЫТАТЕЛЬНАЯ ЛАБОРАТОРИЯ ЖЕЛЕЗА • МОСКВА</text>
        ${legs.join('')}
        <rect x="598" y="21" width="128" height="58" fill="#1a1a1a"/>
        <path d="M598 42 A8 8 0 0 1 598 58" fill="#0b5a32"/>
        <rect x="612" y="30" width="104" height="40" fill="#f4f4e8"/>
        <text x="664" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#000000">FERRUM BIOS</text>
        <text x="664" y="56" text-anchor="middle" font-family="Courier New, monospace" font-size="10" fill="#000000">25-11-1998</text>
        <text x="664" y="66" text-anchor="middle" font-family="Courier New, monospace" font-size="9" fill="#000000">28F010 JP1=2-3</text>
        <text x="598" y="100" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">U7 BIOS DIP-32</text>
        <rect x="70" y="72" width="36" height="12" fill="#c9c9c9" stroke="#808080"/>
        <text x="88" y="81" text-anchor="middle" font-family="Courier New, monospace" font-size="7" fill="#000000">14.318</text>
        <circle cx="748" cy="96" r="3" fill="#33ff66"/>
        <text x="704" y="99" font-family="Courier New, monospace" font-size="8" fill="#f4f4e8">PWR LED</text>
      </svg>
    `;
  }

  renderFingersSvg() {
    const taped = Boolean(this.getJumperState().b21Taped);
    const fingers = [];
    let n = 0;
    for (let x = 14; x < 744; x += 9) {
      if (x > 300 && x < 324) continue;
      n++;
      const isB21 = n === 21;
      fingers.push(`<rect x="${x}" y="8" width="6" height="16" fill="${isB21 && taped ? '#f2d22e' : '#d4a93c'}"/>`);
    }
    const b21x = 14 + 20 * 9;
    return `
      <svg class="ferrum-fingers-svg" width="760" height="26" viewBox="0 0 760 26" xmlns="http://www.w3.org/2000/svg">
        <rect width="760" height="26" fill="#0b5a32"/>
        <rect x="300" y="6" width="24" height="20" fill="#d8d8cc"/>
        ${fingers.join('')}
        <text x="${b21x + 12}" y="7" font-family="Courier New, monospace" font-size="8" fill="#f4f4e8">B21${taped ? ' (скотч)' : ''}</text>
      </svg>
    `;
  }

  renderNav(activePage) {
    return `
      <table class="ferrum-nav" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-nav-tag">JP-NAV<br>ПОСТАВЬ<br>ПЕРЕМЫЧКУ</td>
          ${this.navItems.map(item => {
            const active = item.id === activePage;
            return `
              <td class="ferrum-nav-cell">
                <a class="ferrum-jp${active ? ' is-active' : ''}" data-url="${this.esc(this.url(item.path))}">
                  <span class="ferrum-jp-no">${item.jp}</span>
                  <span class="ferrum-jp-pins"><span class="ferrum-pin"></span><span class="ferrum-pin"></span>${active ? '<span class="ferrum-cap"></span>' : ''}</span>
                  <span class="ferrum-jp-label">${this.esc(item.label)}</span>
                </a>
              </td>
            `;
          }).join('')}
        </tr>
      </table>
    `;
  }

  renderTopLine() {
    const enc = this.getEncoding();
    const encBtn = (id, label) => `<button type="button" class="ferrum-enc${enc === id ? ' is-active' : ''}" data-ferrum-enc="${id}">${label}</button>`;
    return `
      <table class="ferrum-topline" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td>POST <span class="ferrum-post">00</span> Стенд #1 онлайн: Celeron 300A @ 450 МГц, 37.4°C, +5V 4.98</td>
          <td class="ferrum-topline-enc">${encBtn('win1251', 'WIN')}${encBtn('koi8r', 'KOI')}${encBtn('translit', 'LAT')}</td>
        </tr>
      </table>
    `;
  }

  renderAdRow() {
    const idx = this.bannerIndex % this.banners.length;
    const banner = this.banners[idx];
    return `
      <table class="ferrum-adrow" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-adrow-ad">
            <div class="ferrum-banner ferrum-bn-${idx}" data-url="${this.esc(banner.url)}">
              <div class="ferrum-bn-tag">${this.esc(banner.tag)}</div>
              <div class="ferrum-bn-title">${this.esc(banner.title)}</div>
              <div class="ferrum-bn-sub">${this.esc(banner.sub)}</div>
            </div>
            <div class="ferrum-bn-net">Ferrum BannerNet, баннер ${idx + 1} из ${this.banners.length} <button type="button" class="ferrum-mini-btn" id="btn-ferrum-next-banner">Следующий</button></div>
          </td>
          <td class="ferrum-adrow-issue">
            <b>${this.issueDay}</b><br>
            Выпуск #${this.issueNumber}, обновлено в 19:40<br>
            Наличные на рынках: <b>1 у.е. = ${this.usdRate.toFixed(2)} руб.</b><br>
            ММВБ: ${this.mmvbRate} руб./$
          </td>
        </tr>
      </table>
    `;
  }

  renderStatus(route) {
    if (!this.lastStatusMsg || this.statusPath !== this.lastUrl) return '';
    return `<div class="ferrum-status"><b>Протокол стенда:</b> ${this.esc(this.lastStatusMsg)}</div>`;
  }

  renderHome() {
    const lead = this.articles.find(a => a.isLead) || this.articles[0];
    const feed = this.articles.filter(a => a !== lead);
    const poll = this.getPollState();
    const totalVotes = Object.values(poll.counts).reduce((a, b) => a + b, 0) || 1;
    const catalogRow = id => this.priceCatalog.find(p => p.id === id);
    const indexRows = [
      ['cpu_cel300a', 'Celeron 300A OEM'],
      ['mb_abit_bh6', 'ABIT BH6'],
      ['ram_64_sec_gh', '64 МБ PC100 SEC -GH'],
      ['vid_tnt_asus', 'ASUS V3400 TNT'],
      ['vid_voodoo2_12', 'Monster 3D II 12 МБ']
    ].map(([id, label]) => ({ label, item: catalogRow(id) })).filter(r => r.item);
    const leadCat = this.categoryOf(lead.cat);
    const threads = this.getThreads('all').slice(0, 5);

    return `
      <table class="ferrum-home-top" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-lead">
            <div class="ferrum-kicker">Главное за неделю. ${lead.date}, ${this.esc(leadCat ? leadCat.title : '')}</div>
            <a class="ferrum-lead-title" data-url="${this.esc(this.url('/article?id=' + lead.id))}">${this.esc(lead.title)}</a>
            <p class="ferrum-lead-text">${this.esc(lead.lead)}</p>
            <table class="ferrum-passport-mini" cellspacing="0" cellpadding="0">
              <tr><th>Объект</th><td>${this.esc(lead.specs.unit)}</td></tr>
              <tr><th>Частоты</th><td>${this.esc(lead.specs.clocks)}</td></tr>
              <tr><th>Вердикт</th><td>${this.esc(lead.specs.verdict)}</td></tr>
            </table>
            <div class="ferrum-lead-links">
              ${this.link('/article?id=' + lead.id, 'Читать протокол')} |
              ${this.link('/bench', 'Сравнить Voodoo2, TNT и Voodoo3 на стенде')} |
              ${this.link('/thread?id=' + lead.threadId, 'Обсудить в эхе')}
            </div>
          </td>
          <td class="ferrum-cal-cell">
            <div class="ferrum-cal">
              <div class="ferrum-cal-month">Ноябрь 1998</div>
              <div class="ferrum-cal-day">26</div>
              <div class="ferrum-cal-wd">четверг, завтра</div>
              <div class="ferrum-cal-note">В этот день срабатывает <b>Win95.CIH v1.4</b>. Он стирает Flash BIOS, и плата больше не включается.</div>
            </div>
            <table class="ferrum-threat" width="100%" cellspacing="0" cellpadding="0">
              <tr><th>Угроза</th><th>Что спасает</th></tr>
              <tr><td>Win95.CIH</td><td>${this.link('/jumpers', 'Перемычка JP1')}</td></tr>
              <tr><td>Back Orifice</td><td>${this.link('/article?id=back-orifice-netstat', 'netstat -an')}, порт UDP 31337</td></tr>
              <tr><td>NetBus 1.70</td><td>${this.link('/jumpers', 'Проверка порта 12345')}</td></tr>
              <tr><td>Гроза на линии</td><td>${this.link('/article?id=modem-ats-zener', 'Варистор и S10=250')}</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <h2 class="ferrum-h2">Журнал испытаний</h2>
      <table class="ferrum-journal" width="100%" cellspacing="0" cellpadding="0">
        ${feed.map(a => {
          const c = this.categoryOf(a.cat);
          return `
            <tr>
              <td class="ferrum-journal-date">${this.shortDate(a.date)}${a.isNew ? '<br><span class="ferrum-new">NEW</span>' : ''}</td>
              <td class="ferrum-journal-cat">${this.esc(c ? c.short : a.cat)}</td>
              <td>
                ${this.link('/article?id=' + a.id, this.esc(a.title))}
                <div class="ferrum-journal-lead">${this.esc(a.lead)}</div>
              </td>
            </tr>
          `;
        }).join('')}
      </table>
      <div class="ferrum-more">${this.link('/news', 'Все протоколы с файлами .TXT')}</div>

      <table class="ferrum-home-bottom" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-hb-cell">
            <h3 class="ferrum-h3">Индекс цен Митино</h3>
            <table class="ferrum-index" width="100%" cellspacing="0" cellpadding="0">
              ${indexRows.map(r => `<tr><td>${this.esc(r.label)}</td><td class="ferrum-num">$${r.item.mit}</td><td class="ferrum-num">${this.rub(r.item.mit)} р.</td></tr>`).join('')}
            </table>
            <div class="ferrum-small">Курс 20.60. ${this.link('/prices', 'Весь прайс и смета')}</div>
          </td>
          <td class="ferrum-hb-cell">
            <h3 class="ferrum-h3">Опрос недели</h3>
            <div class="ferrum-small">Какая железка осени дала больше всего за доллар?</div>
            ${(this.data.pollOptions || []).map(opt => {
              const count = poll.counts[opt.id] || 0;
              const pct = Math.round((count / totalVotes) * 100);
              return `
                <label class="ferrum-poll-row">
                  <input type="radio" name="ferrum-poll-choice" value="${opt.id}" ${poll.voted === opt.id ? 'checked' : ''}>
                  ${this.esc(opt.label)} <span class="ferrum-small">${pct}% (${count})</span>
                  <span class="ferrum-poll-bar"><span class="ferrum-poll-fill" style="width:${pct}%;"></span></span>
                </label>
              `;
            }).join('')}
            <button type="button" class="ferrum-btn" id="btn-ferrum-poll-vote">Голосовать</button>
          </td>
          <td class="ferrum-hb-cell">
            <h3 class="ferrum-h3">Свежее в эхе</h3>
            ${threads.map(t => `
              <div class="ferrum-hb-thread">
                ${this.link('/thread?id=' + t.id, this.esc(t.title))}
                <span class="ferrum-small">${t.posts.length} письм.</span>
              </div>
            `).join('')}
            <div class="ferrum-small">${this.link('/forum', 'Вся эха FERRUM.98')}</div>
          </td>
        </tr>
      </table>
    `;
  }

  renderNewsList(cat = 'all') {
    const active = this.categoryOf(cat) ? cat : 'all';
    const groups = this.categories.filter(c => c.id !== 'all' && (active === 'all' || c.id === active));
    return `
      <h1 class="ferrum-h1">Архив протоколов испытаний</h1>
      <p class="ferrum-intro">${this.articles.length} протоколов за ноябрь 1998 года. Каждый протокол лежит на сервере текстовым файлом: его можно открыть в Блокноте или сохранить в «Мои документы» и прочитать без модема.</p>
      <div class="ferrum-rubrics">
        ${this.categories.map(c => {
          const count = c.id === 'all' ? this.articles.length : this.getArticles(c.id).length;
          const isOn = c.id === active;
          const path = c.id === 'all' ? '/news' : `/news?cat=${c.id}`;
          return `<a class="ferrum-rubric${isOn ? ' is-active' : ''}" data-url="${this.esc(this.url(path))}">${isOn ? '(*)' : '( )'} ${this.esc(c.title)} (${count})</a>`;
        }).join('')}
      </div>
      ${groups.map(g => {
        const list = this.getArticles(g.id);
        if (!list.length) return '';
        return `
          <h2 class="ferrum-h2">${this.esc(g.title)}</h2>
          <table class="ferrum-files" width="100%" cellspacing="0" cellpadding="0">
            <tr><th>Дата</th><th>Файл</th><th>Протокол</th><th></th></tr>
            ${list.map(a => {
              const kb = Math.max(1, Math.ceil(this.articleText(a).length / 1024));
              return `
                <tr>
                  <td class="ferrum-files-date">${a.date}</td>
                  <td class="ferrum-files-name">${this.esc(a.file)}<br><span class="ferrum-small">${kb} КБ</span></td>
                  <td>
                    ${a.isNew ? '<span class="ferrum-new">NEW</span> ' : ''}${this.link('/article?id=' + a.id, this.esc(a.title))}
                    <div class="ferrum-small">Стенд: ${this.esc(a.specs.unit)}</div>
                  </td>
                  <td class="ferrum-files-act">
                    <button type="button" class="ferrum-mini-btn" data-ferrum-notepad-art="${a.id}">В Блокнот</button>
                    <button type="button" class="ferrum-mini-btn" data-ferrum-save-art="${a.id}">Сохранить</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </table>
        `;
      }).join('')}
    `;
  }

  renderArticle(id) {
    const a = this.getArticle(id);
    if (!a) return null;
    const cat = this.categoryOf(a.cat);
    const idx = this.articles.findIndex(x => x.id === a.id);
    const newer = idx > 0 ? this.articles[idx - 1] : null;
    const older = idx >= 0 && idx < this.articles.length - 1 ? this.articles[idx + 1] : null;
    const comments = this.getComments(a.id);
    const byline = a.byline || 'Инж. С. Воробьёв, стенд #1';

    return `
      <div class="ferrum-crumbs">${this.link('', 'Сводка')} &gt; ${this.link(`/news?cat=${a.cat}`, this.esc(cat ? cat.title : a.cat))} &gt; ${this.esc(a.file)}</div>
      <table class="ferrum-protohead" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-protohead-cell"><span class="ferrum-small">Протокол №</span><br><b>${this.protocolNo(a)}</b></td>
          <td class="ferrum-protohead-cell"><span class="ferrum-small">Дата</span><br><b>${a.date}</b></td>
          <td class="ferrum-protohead-cell"><span class="ferrum-small">Рубрика</span><br><b>${this.esc(cat ? cat.title : a.cat)}</b></td>
          <td class="ferrum-protohead-cell"><span class="ferrum-small">Составил</span><br><b>${this.esc(byline)}</b></td>
          <td class="ferrum-protohead-stamp"><div class="ferrum-stamp">ЦЕХ '98<br>ОТК<br>ПРОВЕРЕНО</div></td>
        </tr>
      </table>

      <h1 class="ferrum-article-title">${this.esc(a.title)}</h1>
      <p class="ferrum-article-lead">${this.esc(a.lead)}</p>

      <table class="ferrum-passport" width="100%" cellspacing="0" cellpadding="0">
        <tr><th>Объект испытаний</th><td>${this.esc(a.specs.unit)}</td></tr>
        <tr><th>Конфигурация стенда</th><td>${this.esc(a.specs.stand)}</td></tr>
        <tr><th>Частоты и режим</th><td>${this.esc(a.specs.clocks)}</td></tr>
        <tr><th>Цена на 25.11.98</th><td>${this.esc(a.specs.price)}</td></tr>
        <tr class="is-verdict"><th>Вердикт цеха</th><td>${this.esc(a.specs.verdict)}</td></tr>
      </table>

      <pre class="ferrum-schematic">${this.esc(a.schematic.join('\n'))}</pre>

      <div class="ferrum-article-body">
        ${a.body.map(p => `<p>${this.rich(p)}</p>`).join('')}
        <p class="ferrum-sign">Протокол составил: ${this.esc(byline)}.</p>
      </div>

      <div class="ferrum-filebar">
        Файл протокола <b>${this.esc(a.file)}</b>:
        <button type="button" class="ferrum-btn" data-ferrum-notepad-art="${a.id}">Открыть в Блокноте</button>
        <button type="button" class="ferrum-btn" data-ferrum-save-art="${a.id}">Сохранить в Мои документы</button>
      </div>

      <table class="ferrum-prevnext" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>${newer ? `Новее:<br>${this.link('/article?id=' + newer.id, '&lt;&lt; ' + this.esc(newer.title))}` : 'Это самый свежий протокол выпуска.'}</td>
          <td class="ferrum-right">${older ? `Старше:<br>${this.link('/article?id=' + older.id, this.esc(older.title) + ' &gt;&gt;')}` : 'Дальше протоколов нет.'}</td>
        </tr>
      </table>

      <h2 class="ferrum-h2">Замечания к протоколу (${comments.length})</h2>
      <ol class="ferrum-remarks">
        ${comments.map(c => `
          <li>
            <b>${this.esc(c.author)}</b>, <span class="ferrum-small">${this.esc(c.date)}</span><br>
            ${this.esc(c.text)}
            ${c.reply ? `<div class="ferrum-remark-reply">${this.esc(c.reply)}</div>` : ''}
          </li>
        `).join('')}
      </ol>
      <table class="ferrum-form" cellspacing="0" cellpadding="0">
        <tr><td colspan="2"><b>Добавить замечание.</b> Укажите ревизию платы, неделю выпуска чипа или свой замер.</td></tr>
        <tr><td>Позывной:</td><td><input type="text" class="ferrum-input" id="ferrum-comment-author" value="Инженер_МСК" size="24"></td></tr>
        <tr><td>Текст:</td><td><textarea class="ferrum-textarea" id="ferrum-comment-text" rows="4" cols="56"></textarea></td></tr>
        <tr><td></td><td><button type="button" class="ferrum-btn" id="btn-ferrum-add-comment" data-article-id="${a.id}">Занести в протокол</button></td></tr>
      </table>
    `;
  }

  renderConsole(res) {
    const lines = [
      'Quake II v3.19 x86 Oct 17 1998 Win32 RELEASE',
      `${res.cpu.name}`,
      `${res.gpu.name}`,
      `]vid_mode ${res.mode}`,
      ']timedemo 1',
      ']map demo1.dm2'
    ];
    if (res.warning && res.q2Fps === 0) {
      lines.push('ERROR: 32-bit framebuffer not supported by this board');
    } else {
      lines.push(`demo1.dm2: ${res.q2Fps} fps`);
      lines.push(`Unreal, Castle Flyby: ${res.unrealFps} fps`);
      lines.push(`3DMark 99: ${res.mark3d} 3DMarks`);
    }
    lines.push(']_');
    return lines.map(l => this.esc(l)).join('\n');
  }

  renderBench() {
    const st = this.getBenchState();
    const res = this.computeBenchmark(st);
    const modes = [
      { id: '640x480x16', name: '640×480, 16 бит' },
      { id: '800x600x16', name: '800×600, 16 бит (режим стенда)' },
      { id: '1024x768x16', name: '1024×768, 16 бит' },
      { id: '800x600x32', name: '800×600, 32 бита (только TNT и G200)' }
    ];
    const bar = (value, max, cls) => {
      const pct = Math.min(100, Math.round((value / max) * 100));
      return `<span class="ferrum-meter"><span class="ferrum-meter-fill ${cls}" style="width:${pct}%;"></span></span>`;
    };

    return `
      <h1 class="ferrum-h1">Стенд FPS: прогон timedemo на вашей связке</h1>
      <p class="ferrum-intro">Выберите процессор, 3D-ускоритель и режим экрана. Стенд пересчитает Quake II v3.19 (demo1.dm2), Unreal и 3DMark 99 и сравнит с эталоном лаборатории: Pentium II 350 и Voodoo2 12 МБ в 800×600.</p>

      <table class="ferrum-rig" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="ferrum-rig-title">FERRUM BENCH 1.0, стенд #1</td></tr>
        <tr>
          <td class="ferrum-rig-controls">
            <table class="ferrum-rig-form" cellspacing="0" cellpadding="0">
              <tr><td>Процессор</td><td><select class="ferrum-select" id="ferrum-bench-cpu">
                ${this.benchCpus.map(c => `<option value="${c.id}" ${c.id === st.cpu ? 'selected' : ''}>${this.esc(c.name)} — $${c.usd}</option>`).join('')}
              </select></td></tr>
              <tr><td>3D-ускоритель</td><td><select class="ferrum-select" id="ferrum-bench-gpu">
                ${this.benchGpus.map(g => `<option value="${g.id}" ${g.id === st.gpu ? 'selected' : ''}>${this.esc(g.name)} — $${g.usd}</option>`).join('')}
              </select></td></tr>
              <tr><td>Режим экрана</td><td><select class="ferrum-select" id="ferrum-bench-mode">
                ${modes.map(m => `<option value="${m.id}" ${m.id === st.mode ? 'selected' : ''}>${this.esc(m.name)}</option>`).join('')}
              </select>
              <button type="button" class="ferrum-btn ferrum-run" id="btn-ferrum-run-bench">Запустить прогон #${(st.runs || 0) + 1}</button></td></tr>
            </table>
          </td>
        </tr>
        <tr><td class="ferrum-rig-console"><pre class="ferrum-q2con">${this.renderConsole(res)}</pre></td></tr>
      </table>

      ${res.warning ? `<div class="ferrum-warn"><b>Стенд сообщает.</b> ${this.esc(res.warning)}</div>` : ''}

      <table class="ferrum-scores" width="100%" cellspacing="0" cellpadding="0">
        <tr><th>Тест</th><th>Ваша связка</th><th>Эталон PII-350 + Voodoo2</th></tr>
        <tr>
          <td>Quake II, demo1.dm2</td>
          <td>${bar(res.q2Fps, 95, res.q2Fps >= res.refQ2 ? 'is-up' : 'is-down')} <b>${res.q2Fps}</b> кадр/с</td>
          <td>${bar(res.refQ2, 95, 'is-ref')} ${res.refQ2} кадр/с</td>
        </tr>
        <tr>
          <td>Unreal, Castle Flyby</td>
          <td>${bar(res.unrealFps, 75, res.unrealFps >= res.refUnreal ? 'is-up' : 'is-down')} <b>${res.unrealFps}</b> кадр/с</td>
          <td>${bar(res.refUnreal, 75, 'is-ref')} ${res.refUnreal} кадр/с</td>
        </tr>
        <tr>
          <td>3DMark 99</td>
          <td>${bar(res.mark3d, 4800, res.mark3d >= res.refMark ? 'is-up' : 'is-down')} <b>${res.mark3d}</b></td>
          <td>${bar(res.refMark, 4800, 'is-ref')} ${res.refMark}</td>
        </tr>
      </table>

      <table class="ferrum-rigpass" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td><span class="ferrum-small">Тепло связки</span><br><b>${res.totalWatts} Вт</b></td>
          <td><span class="ferrum-small">Радиатор ЦП</span><br><b>${res.tempC}°C</b></td>
          <td><span class="ferrum-small">Цена связки</span><br><b>$${res.totalUsd}</b> (${res.totalRub} руб.)</td>
          <td><span class="ferrum-small">Отдача</span><br><b>${res.fpsPer100Usd}</b> кадр/с на $100</td>
        </tr>
      </table>

      <div class="ferrum-filebar">
        Протокол прогона <b>FERRUM_BENCH_98.TXT</b>:
        <button type="button" class="ferrum-btn" id="btn-ferrum-bench-notepad">Открыть в Блокноте</button>
        <button type="button" class="ferrum-btn" id="btn-ferrum-bench-save">Сохранить в Мои документы</button>
      </div>
      <p class="ferrum-small">Как считаем: цифры видеоплат сняты на эталонном процессоре, вклад процессора пересчитан по его индексу на стенде #1. Voodoo3 на стенде нет: строка посчитана по частотам с COMDEX и помечена как оценка.</p>
    `;
  }

  renderBoardSvg(st, ev) {
    const fingers = [];
    for (let i = 0; i < 30; i++) {
      const x = 28 + i * 11;
      const isB21 = i === 20;
      const fill = isB21 ? (st.b21Taped ? '#f2d22e' : '#ffcc66') : '#d4a93c';
      fingers.push(`<rect x="${x}" y="118" width="7" height="22" fill="${fill}" ${isB21 ? 'stroke="#cc0000" stroke-width="2"' : ''}/>`);
    }
    const b21x = 28 + 20 * 11;
    const capY = st.jp1Protected ? 168 : 152;
    return `
      <svg class="ferrum-board-svg" width="440" height="250" viewBox="0 0 440 250" xmlns="http://www.w3.org/2000/svg">
        <rect width="440" height="250" fill="#0b5a32"/>
        <rect x="20" y="16" width="350" height="128" fill="#3d8f5c" stroke="#f4f4e8"/>
        <rect x="150" y="34" width="70" height="56" fill="#2a2a2a"/>
        <rect x="166" y="46" width="38" height="32" fill="#8a8a8a"/>
        <text x="185" y="102" text-anchor="middle" font-family="Courier New, monospace" font-size="10" fill="#f4f4e8">Celeron 300A SL32A</text>
        <text x="28" y="30" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">КАРТРИДЖ SEPP, СТОРОНА B</text>
        <text x="28" y="112" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">B1</text>
        ${fingers.join('')}
        <g class="ferrum-hot" data-ferrum-toggle="b21">
          <rect x="${b21x - 6}" y="112" width="19" height="32" fill="#000000" fill-opacity="0"/>
          <text x="${b21x + 3}" y="160" text-anchor="middle" font-family="Courier New, monospace" font-size="10" font-weight="bold" fill="${st.b21Taped ? '#f2d22e' : '#ff6666'}">B21</text>
          <text x="${b21x + 3}" y="172" text-anchor="middle" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">${st.b21Taped ? 'скотч' : 'на GND'}</text>
        </g>
        <rect x="14" y="140" width="362" height="10" fill="#4a3220"/>
        <text x="20" y="196" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">J5 SLOT1   FSB ${st.fsb} -&gt; ${ev.effectiveFsb} МГц   ЦП ${ev.cpuMhz} МГц</text>
        <text x="20" y="210" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">PCI ${ev.pciMhz} МГц (1/${ev.pciDiv})   AGP ${ev.agpMhz} МГц   Vcore ${this.esc(st.vcore)} В</text>
        <rect x="384" y="20" width="44" height="96" fill="#1a1a1a"/>
        <rect x="388" y="30" width="36" height="40" fill="#f4f4e8"/>
        <text x="406" y="48" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#000000">BIOS</text>
        <text x="406" y="60" text-anchor="middle" font-family="Courier New, monospace" font-size="7" fill="#000000">28F010</text>
        <text x="380" y="130" font-family="Courier New, monospace" font-size="9" fill="#f4f4e8">U7</text>
        <g class="ferrum-hot" data-ferrum-toggle="jp1">
          <rect x="392" y="140" width="34" height="56" fill="#000000" fill-opacity="0"/>
          <rect x="402" y="148" width="8" height="8" fill="#d4a93c"/>
          <rect x="402" y="164" width="8" height="8" fill="#d4a93c"/>
          <rect x="402" y="180" width="8" height="8" fill="#d4a93c"/>
          <rect x="398" y="${capY}" width="16" height="24" fill="${st.jp1Protected ? '#111111' : '#cc0000'}" stroke="#f4f4e8"/>
          <text x="416" y="155" font-family="Courier New, monospace" font-size="8" fill="#f4f4e8">1</text>
          <text x="416" y="171" font-family="Courier New, monospace" font-size="8" fill="#f4f4e8">2</text>
          <text x="416" y="187" font-family="Courier New, monospace" font-size="8" fill="#f4f4e8">3</text>
          <text x="396" y="210" font-family="Courier New, monospace" font-size="9" font-weight="bold" fill="${st.jp1Protected ? '#f4f4e8' : '#ff6666'}">JP1</text>
        </g>
        <text x="20" y="236" font-family="Courier New, monospace" font-size="9" fill="#f2d22e">Щёлкните по B21 или JP1, чтобы заклеить контакт или переставить перемычку.</text>
      </svg>
    `;
  }

  renderNetstat(st) {
    const rows = ['  TCP    195.2.81.47:1031   194.87.13.98:80    ESTABLISHED'];
    if (!st.unbindNetbios139) rows.push('  TCP    0.0.0.0:139        0.0.0.0:0          LISTENING');
    if (!st.closeNb12345) rows.push('  TCP    0.0.0.0:12345      0.0.0.0:0          LISTENING');
    if (!st.closeBo31337) rows.push('  UDP    0.0.0.0:31337      *:*');
    return [
      'C:\\WIN98>netstat -an',
      '',
      'Active Connections',
      '',
      '  Proto  Local Address      Foreign Address    State',
      ...rows,
      '',
      'C:\\WIN98>_'
    ].map(l => this.esc(l)).join('\n');
  }

  renderJumpers() {
    const st = this.getJumperState();
    const ev = this.evaluateJumpers(st);
    const fsbOptions = [66.6, 75, 83.3, 100, 112, 133.3];
    return `
      <h1 class="ferrum-h1">Монтажный стол: пин B21, перемычка JP1 и порты троянов</h1>
      <p class="ferrum-intro">Слева — плата на 440BX с картриджем Celeron 300A. Справа — сеанс MS-DOS на той же машине при открытом дозвоне. Меняйте перемычки и смотрите, что скажет стенд. Памятку по итогам можно унести в Блокнот.</p>
      <table class="ferrum-bench-desk" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-desk-board">${this.renderBoardSvg(st, ev)}</td>
          <td class="ferrum-desk-side">
            <h3 class="ferrum-h3">Плата и картридж</h3>
            <table class="ferrum-jmp-form" width="100%" cellspacing="0" cellpadding="0">
              <tr><td>Шина FSB</td><td><select class="ferrum-select" id="ferrum-jmp-fsb">
                ${fsbOptions.map(f => `<option value="${f}" ${Number(st.fsb) === f ? 'selected' : ''}>${f} МГц</option>`).join('')}
              </select></td></tr>
              <tr><td>Множитель</td><td><select class="ferrum-select" id="ferrum-jmp-mult">
                <option value="4.0" ${Number(st.mult) === 4.0 ? 'selected' : ''}>x4.0 (Celeron 266)</option>
                <option value="4.5" ${Number(st.mult) === 4.5 ? 'selected' : ''}>x4.5 (Celeron 300A)</option>
                <option value="5.0" ${Number(st.mult) === 5.0 ? 'selected' : ''}>x5.0 (Celeron 333)</option>
              </select></td></tr>
              <tr><td>Vcore</td><td><select class="ferrum-select" id="ferrum-jmp-vcore">
                <option value="2.00" ${st.vcore === '2.00' ? 'selected' : ''}>2.00 В, номинал</option>
                <option value="2.10" ${st.vcore === '2.10' ? 'selected' : ''}>2.10 В, для 450 МГц</option>
                <option value="2.20" ${st.vcore === '2.20' ? 'selected' : ''}>2.20 В, для 504 МГц</option>
              </select></td></tr>
              <tr><td colspan="2"><label><input type="checkbox" id="ferrum-jmp-b21" ${st.b21Taped ? 'checked' : ''}> Заклеить контакт B21 скотчем или цапонлаком</label></td></tr>
              <tr><td colspan="2"><label><input type="checkbox" id="ferrum-jmp-jp1" ${st.jp1Protected ? 'checked' : ''}> JP1 в положении 2-3: запись в BIOS запрещена</label></td></tr>
            </table>
            <div class="${ev.busDanger ? 'ferrum-warn' : 'ferrum-ok'}"><b>Диагноз.</b> ${this.esc(ev.busStatus)}</div>
          </td>
        </tr>
        <tr>
          <td class="ferrum-desk-board">
            <table class="ferrum-dos" width="100%" cellspacing="0" cellpadding="0">
              <tr><td class="ferrum-dos-title">Сеанс MS-DOS</td></tr>
              <tr><td><pre class="ferrum-dos-screen">${this.renderNetstat(st)}</pre></td></tr>
            </table>
          </td>
          <td class="ferrum-desk-side">
            <h3 class="ferrum-h3">Дозвон и трояны</h3>
            <div class="ferrum-dos-checks">
              <label><input type="checkbox" id="ferrum-sec-bo" ${st.closeBo31337 ? 'checked' : ''}> Вычистить Back Orifice (UDP 31337)</label><br>
              <label><input type="checkbox" id="ferrum-sec-nb" ${st.closeNb12345 ? 'checked' : ''}> Вычистить NetBus (TCP 12345)</label><br>
              <label><input type="checkbox" id="ferrum-sec-netbios" ${st.unbindNetbios139 ? 'checked' : ''}> Отвязать NetBIOS (TCP 139) от удалённого доступа</label>
            </div>
            ${ev.isSecure
              ? '<div class="ferrum-ok"><b>Защита в норме.</b> BIOS закрыт перемычкой JP1, порты троянов и NetBIOS закрыты.</div>'
              : `<div class="ferrum-warn"><b>Найдено уязвимостей: ${ev.secIssues.length}.</b><ul>${ev.secIssues.map(i => `<li>${this.esc(i)}</li>`).join('')}</ul></div>`}
            <div class="ferrum-memo">
              Памятка <b>HARDEN_WIN98_NOV98.TXT</b><br>
              <button type="button" class="ferrum-btn" id="btn-ferrum-jmp-notepad">Открыть в Блокноте</button>
              <button type="button" class="ferrum-btn" id="btn-ferrum-jmp-save">Сохранить</button>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  renderPrices() {
    const rig = this.getRigState();
    const calc = this.calculateRig(rig);
    const chip = this.chipDatabase.find(c => c.code === this.chipCheckCode) || this.chipDatabase[0];
    const market = calc.market;
    const slots = Object.keys(this.slotTitles);
    const stampOf = note => (/^ХИТ/.test(note) ? 'ХИТ' : /^ВЫБОР ЦЕХА/.test(note) ? 'ВЫБОР ЦЕХА' : '');
    const cleanNote = note => String(note).replace(/^(ХИТ!|ВЫБОР ЦЕХА:)\s?/, '');

    return `
      <h1 class="ferrum-h1">Прайс Савёловского и Митинского радиорынков на 25.11.1998</h1>
      <table class="ferrum-markets" cellspacing="0" cellpadding="0">
        <tr>
          <td class="${market === 'mit' ? 'is-on' : ''}"><label><input type="radio" name="ferrum-rig-market" value="mit" ${market === 'mit' ? 'checked' : ''}> Митино, Пятницкое ш.</label></td>
          <td class="${market === 'sav' ? 'is-on' : ''}"><label><input type="radio" name="ferrum-rig-market" value="sav" ${market === 'sav' ? 'checked' : ''}> Савёловский, Сущёвский Вал</label></td>
          <td class="ferrum-markets-rate">Наличные: 1 у.е. = ${this.usdRate.toFixed(2)} руб. ММВБ: ${this.mmvbRate}. Безнал +4%.</td>
        </tr>
      </table>

      <table class="ferrum-pricelist" width="100%" cellspacing="0" cellpadding="0">
        <tr><th>Наименование</th><th>Гар.</th><th>Савёл.</th><th>Митино</th><th>Руб.</th><th>Заметка цеха</th></tr>
        ${slots.map(slot => `
          <tr class="ferrum-pl-group"><td colspan="6">${this.esc(this.slotTitles[slot])}</td></tr>
          ${this.priceCatalog.filter(p => p.slot === slot).map(item => {
            const stamp = stampOf(item.note);
            const usd = market === 'sav' ? item.sav : item.mit;
            return `
              <tr class="${stamp ? 'is-hit' : ''}">
                <td>${this.esc(item.name)}</td>
                <td class="ferrum-pl-war">${this.esc(item.war)}</td>
                <td class="ferrum-num${market === 'sav' ? ' is-cur' : ''}">$${item.sav}</td>
                <td class="ferrum-num${market === 'mit' ? ' is-cur' : ''}">$${item.mit}</td>
                <td class="ferrum-num">${this.rub(usd)}</td>
                <td>${stamp ? `<span class="ferrum-hit">${stamp}</span> ` : ''}${this.esc(cleanNote(item.note))}</td>
              </tr>
            `;
          }).join('')}
        `).join('')}
      </table>

      <table class="ferrum-price-tools" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-receipt-cell">
            <div class="ferrum-receipt">
              <div class="ferrum-receipt-head">ТОВАРНЫЙ ЧЕК (смета)<br>${market === 'sav' ? 'Савёловский рынок' : 'Митинский рынок'}, 25.11.1998</div>
              <table width="100%" cellspacing="0" cellpadding="0">
                ${slots.map(slot => {
                  const item = calc.items.find(i => i.slot === slot);
                  return `
                    <tr>
                      <td class="ferrum-receipt-slot">${this.esc(this.slotTitles[slot])}</td>
                      <td class="ferrum-num">$${item ? (market === 'sav' ? item.sav : item.mit) : 0}</td>
                    </tr>
                    <tr><td colspan="2"><select class="ferrum-select ferrum-rig-select" data-slot="${slot}">
                      ${this.priceCatalog.filter(p => p.slot === slot).map(o => `<option value="${o.id}" ${rig[slot] === o.id ? 'selected' : ''}>${this.esc(o.name)}</option>`).join('')}
                    </select></td></tr>
                  `;
                }).join('')}
                <tr class="ferrum-receipt-total"><td>ИТОГО</td><td class="ferrum-num">$${calc.totalUsd}</td></tr>
                <tr class="ferrum-receipt-total"><td>в рублях</td><td class="ferrum-num">${calc.totalRub} руб. 00 коп.</td></tr>
              </table>
              <div class="ferrum-receipt-foot">Продавец ______ М.П.</div>
            </div>
            <button type="button" class="ferrum-btn" id="btn-ferrum-rig-notepad">Смету в Блокнот</button>
            <button type="button" class="ferrum-btn" id="btn-ferrum-rig-save">Сохранить SMETA_25_11_98.TXT</button>
          </td>
          <td class="ferrum-loupe-cell">
            <h3 class="ferrum-h3">Лупа покупателя</h3>
            <p class="ferrum-small">Перепишите код с крышки процессора или чипа памяти и выберите его в списке.</p>
            <select class="ferrum-select" id="ferrum-chip-select">
              ${this.chipDatabase.map(c => `<option value="${this.esc(c.code)}" ${c.code === chip.code ? 'selected' : ''}>${this.esc(c.code)}</option>`).join('')}
            </select>
            <div class="ferrum-loupe">
              <div class="ferrum-loupe-x">×10</div>
              <div class="ferrum-loupe-code">${this.esc(chip.code)}</div>
              <div class="ferrum-loupe-part">${this.esc(chip.part)}</div>
            </div>
            <div class="${chip.isFake ? 'ferrum-verdict is-fake' : 'ferrum-verdict'}">${this.esc(chip.status)}</div>
            <p class="ferrum-small"><b>Происхождение:</b> ${this.esc(chip.origin)}</p>
            <p class="ferrum-small">${this.rich(chip.details)}</p>
          </td>
        </tr>
      </table>
    `;
  }

  areaOf(cat) {
    return this.areas.find(a => a.id === cat) || this.areas[0] || { id: 'all', tag: 'FERRUM.ALL', title: '' };
  }

  nodeOf(author) {
    const nodes = this.data.nodes || {};
    return nodes[author] || 'web';
  }

  renderForum(cat = 'all') {
    const area = this.areaOf(cat);
    const threads = this.getThreads(area.id);
    return `
      <h1 class="ferrum-h1">Эха FERRUM.98: веб-гейт в FidoNet</h1>
      <p class="ferrum-intro">Конференция сайта связана с эхой FERRUM.98. Письма с сайта уходят в сеть ночью через узел 2:5020/9898, ответы фидошников приходят сюда утром. Дежурный инженер отвечает сразу.</p>
      <div class="ferrum-golded">
        <table class="ferrum-gd-areas" width="100%" cellspacing="0" cellpadding="0">
          <tr class="ferrum-gd-head"><td>Область</td><td>Описание</td><td class="ferrum-num">Писем</td></tr>
          ${this.areas.map(a => {
            const count = this.getThreads(a.id).reduce((s, t) => s + t.posts.length, 0);
            const path = a.id === 'all' ? '/forum' : `/forum?cat=${a.id}`;
            return `
              <tr class="${a.id === area.id ? 'is-cur' : ''}">
                <td><a class="ferrum-gd-link" data-url="${this.esc(this.url(path))}">${a.id === area.id ? '&gt;' : '&nbsp;'} ${this.esc(a.tag)}</a></td>
                <td>${this.esc(a.title)}</td>
                <td class="ferrum-num">${count}</td>
              </tr>
            `;
          }).join('')}
        </table>
        <div class="ferrum-gd-bar">${this.esc(area.tag)}: темы (${threads.length})</div>
        <table class="ferrum-gd-list" width="100%" cellspacing="0" cellpadding="0">
          <tr class="ferrum-gd-head"><td>#</td><td>От кого</td><td>Тема</td><td>Писем</td><td>Последнее</td></tr>
          ${threads.map((t, idx) => `
            <tr>
              <td class="ferrum-num">${idx + 1}</td>
              <td>${this.esc(t.author)}</td>
              <td class="ferrum-gd-subj"><a class="ferrum-gd-link" data-url="${this.esc(this.url('/thread?id=' + t.id))}">${this.esc(t.title)}</a></td>
              <td class="ferrum-num">${t.posts.length}</td>
              <td>${this.fidoDate(t.posts[t.posts.length - 1].date)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <table class="ferrum-editor" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="ferrum-editor-title" colspan="2">Новое письмо в эху</td></tr>
        <tr><td>Область:</td><td>
          <select class="ferrum-select" id="ferrum-newthread-cat">
            ${this.areas.filter(a => a.id !== 'all').map(a => `<option value="${a.id}" ${a.id === area.id ? 'selected' : ''}>${this.esc(a.tag)}, ${this.esc(a.title)}</option>`).join('')}
          </select>
        </td></tr>
        <tr><td>From:</td><td><input type="text" class="ferrum-input" id="ferrum-newthread-author" value="Инженер_98" size="24"> To: All</td></tr>
        <tr><td>Subj:</td><td><input type="text" class="ferrum-input" id="ferrum-newthread-title" size="60"></td></tr>
        <tr><td>Текст:</td><td><textarea class="ferrum-textarea" id="ferrum-newthread-text" rows="5" cols="60"></textarea>
          <div class="ferrum-small">Напишите плату, ревизию, блок питания, версию BIOS и что именно происходит.</div></td></tr>
        <tr><td></td><td><button type="button" class="ferrum-btn" id="btn-ferrum-create-thread">Отправить в эху</button></td></tr>
      </table>
    `;
  }

  renderThread(id) {
    const t = this.getThread(id);
    if (!t) return null;
    const area = this.areaOf(t.cat);
    return `
      <div class="ferrum-crumbs">${this.link('/forum', 'Эха FERRUM.98')} &gt; ${this.link(`/forum?cat=${area.id}`, this.esc(area.tag))}</div>
      <div class="ferrum-golded">
        ${t.posts.map((p, idx) => {
          const node = this.nodeOf(p.author);
          return `
            <div class="ferrum-gd-msg">
              <div class="ferrum-gd-bar">${this.esc(area.tag)} <span class="ferrum-gd-right">Msg ${idx + 1} of ${t.posts.length}</span></div>
              <table class="ferrum-gd-hdr" width="100%" cellspacing="0" cellpadding="0">
                <tr><td class="ferrum-gd-k">From :</td><td><b>${this.esc(p.author)}</b> <span class="ferrum-gd-dim">${node === 'web' ? 'через веб-гейт' : this.esc(node)}</span></td><td class="ferrum-gd-right">${this.fidoDate(p.date)}</td></tr>
                <tr><td class="ferrum-gd-k">To   :</td><td>${idx === 0 ? 'All' : this.esc(t.posts[0].author)}</td><td class="ferrum-gd-right ferrum-gd-dim">${this.esc(p.role || '')}</td></tr>
                <tr><td class="ferrum-gd-k">Subj :</td><td colspan="2">${idx === 0 ? '' : 'Re: '}${this.esc(t.title)}</td></tr>
              </table>
              <div class="ferrum-gd-text">${this.rich(p.text)}</div>
              <div class="ferrum-gd-tear">--- ${node === 'web' ? 'WebGate/Ferrum 1.02' : 'GoldED 2.50'}<br>&nbsp;* Origin: ${node === 'web' ? "Железный Цех '98, веб-гейт (2:5020/9898)" : `${this.esc(p.author)} (${this.esc(node)})`}</div>
            </div>
          `;
        }).join('')}
      </div>
      <table class="ferrum-editor" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="ferrum-editor-title" colspan="2">Ответ в ${this.esc(area.tag)}</td></tr>
        <tr><td>From:</td><td><input type="text" class="ferrum-input" id="ferrum-reply-author" value="Оверклокер_МСК" size="24"> To: ${this.esc(t.author)}</td></tr>
        <tr><td>Subj:</td><td>Re: ${this.esc(t.title)}</td></tr>
        <tr><td>Текст:</td><td><textarea class="ferrum-textarea" id="ferrum-reply-text" rows="5" cols="60"></textarea></td></tr>
        <tr><td></td><td><button type="button" class="ferrum-btn" id="btn-ferrum-send-reply" data-thread-id="${this.esc(t.id)}">Отправить ответ</button></td></tr>
      </table>
    `;
  }

  renderAbout() {
    const lab = this.lab;
    return `
      <h1 class="ferrum-h1">О лаборатории «Железный Цех '98»</h1>
      <p class="ferrum-intro">Независимая испытательная лаборатория. Покупаем железо на рынках сами, гоняем на своих стендах и пишем, что получилось. Адрес: ${this.esc(lab.address || '')}.</p>

      <h2 class="ferrum-h2">Как мы начинались</h2>
      <table class="ferrum-history" width="100%" cellspacing="0" cellpadding="0">
        ${(lab.history || []).map(([when, what]) => `<tr><td class="ferrum-history-when">${this.esc(when)}</td><td>${this.esc(what)}</td></tr>`).join('')}
      </table>

      <h2 class="ferrum-h2">Кто работает в цехе</h2>
      <table class="ferrum-staff" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${(lab.staff || []).map(s => `
            <td class="ferrum-staff-cell">
              <b>${this.esc(s.name)}</b><br>
              <span class="ferrum-small">${this.esc(s.role)}. В конференции: ${this.esc(s.nick)}</span>
              <p>${this.esc(s.text)}</p>
            </td>
          `).join('')}
        </tr>
      </table>

      <h2 class="ferrum-h2">Оборудование</h2>
      <table class="ferrum-equip" width="100%" cellspacing="0" cellpadding="0">
        ${(lab.equipment || []).map(([name, what]) => `<tr><th>${this.esc(name)}</th><td>${this.esc(what)}</td></tr>`).join('')}
      </table>

      <h2 class="ferrum-h2">Правила испытаний</h2>
      <ul class="ferrum-rules">
        ${(lab.method || []).map(m => `<li>${this.esc(m)}</li>`).join('')}
      </ul>

      <h2 class="ferrum-h2">Реклама на сайте</h2>
      <table class="ferrum-equip" width="100%" cellspacing="0" cellpadding="0">
        ${(lab.ads || []).map(([what, price]) => `<tr><th>${this.esc(what)}</th><td>${this.esc(price)}</td></tr>`).join('')}
      </table>

      <p class="ferrum-intro">Пишите на <a class="ferrum-link" href="mailto:lab@ferrum98.ru">lab@ferrum98.ru</a> или в эху ${this.link('/forum', 'FERRUM.98')}. Платы на ремонт принимаем по субботам с 11 до 15.</p>
    `;
  }

  renderNotFound(route) {
    return `
      <div class="ferrum-apache">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(route.path || '/')} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.3 Server at www.ferrum98.ru Port 80</address>
        <p><a class="ferrum-link" data-url="${this.esc(this.baseUrl)}">На главную «Железного Цеха '98»</a></p>
      </div>
    `;
  }

  renderFooter() {
    const webring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const hits = String(this.getHits()).padStart(8, '0');
    return `
      <table class="ferrum-footer" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ferrum-footer-text">
            © 1997–1998 Испытательная лаборатория «Железный Цех '98». Перепечатка с разрешения и со ссылкой на www.ferrum98.ru.<br>
            Почта стенда: <a class="ferrum-link-silk" href="mailto:lab@ferrum98.ru">lab@ferrum98.ru</a>. Лучше всего смотреть в Microslop Internet Explorer 4.0 при 800×600.
            <br><button type="button" class="ferrum-mini-btn" id="btn-ferrum-ask-clippy">Позвать Скрепыша на стенд</button>
          </td>
          <td class="ferrum-footer-btns">
            <span class="ferrum-88"><span class="ferrum-88-top">ЖЕЛЕЗНЫЙ РЕЙТИНГ</span><span class="ferrum-odo">${hits}</span></span>
            <span class="ferrum-88 ferrum-88-ie"><span class="ferrum-88-top">Лучше в</span>IE 4.0</span>
            <span class="ferrum-88 ferrum-88-msk"><span class="ferrum-88-top">Сделано в</span>МОСКВЕ</span>
          </td>
        </tr>
      </table>
      <div class="ferrum-webring">${webring}</div>
    `;
  }

  renderSite(url) {
    this.lastUrl = url || this.baseUrl;
    this.countHit();
    const route = this.parseUrl(this.lastUrl);
    if (this.statusPath && this.statusPath !== this.lastUrl) {
      this.lastStatusMsg = '';
      this.statusPath = '';
    }
    let body = null;
    if (route.page === 'home') body = this.renderHome();
    else if (route.page === 'news') body = this.renderNewsList(route.cat);
    else if (route.page === 'article') body = this.renderArticle(route.id);
    else if (route.page === 'bench') body = this.renderBench();
    else if (route.page === 'jumpers') body = this.renderJumpers();
    else if (route.page === 'prices') body = this.renderPrices();
    else if (route.page === 'forum') body = this.renderForum(route.cat);
    else if (route.page === 'thread') body = this.renderThread(route.id);
    else if (route.page === 'about') body = this.renderAbout();

    if (body === null) {
      return this.encodeHtml(`<div class="ferrum-page ferrum-page-raw">${this.renderNotFound(route)}</div>`);
    }

    const activePage = route.page === 'article' ? 'news' : route.page === 'thread' ? 'forum' : route.page;
    return this.encodeHtml(`
      <div class="ferrum-page">
        <div class="ferrum-board">
          ${this.renderTopLine()}
          ${this.renderMastSvg()}
          ${this.renderNav(activePage)}
          ${this.renderFingersSvg()}
          ${this.renderAdRow()}
          <div class="ferrum-body ferrum-body-${route.page}">
            ${this.renderStatus(route)}
            ${body}
          </div>
          ${this.renderFooter()}
        </div>
      </div>
    `);
  }

  setStatus(msg) {
    this.lastStatusMsg = msg;
    this.statusPath = this.lastUrl || this.baseUrl;
  }

  rerender(win, contentFrame, targetUrl) {
    if (targetUrl && typeof window !== 'undefined' && window.appIE && typeof window.appIE.navigate === 'function') {
      window.appIE.navigate(win, targetUrl);
      return;
    }
    if (!contentFrame) return;
    const top = contentFrame.scrollTop || 0;
    contentFrame.innerHTML = this.renderSite(this.lastUrl || this.baseUrl);
    this.bindEvents(win, contentFrame);
    if (typeof contentFrame.querySelectorAll === 'function') {
      contentFrame.querySelectorAll('a[data-url]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const u = a.getAttribute('data-url');
          if (u && window.appIE) window.appIE.navigate(win, u);
        });
      });
    }
    contentFrame.scrollTop = top;
  }

  attachEvents(win, contentFrame) {
    this.bindEvents(win, contentFrame);
  }

  bindEvents(win, contentFrame) {
    if (!contentFrame || typeof contentFrame.querySelector !== 'function') return;

    const q = sel => contentFrame.querySelector(sel);
    const qa = sel => Array.from(contentFrame.querySelectorAll(sel) || []);
    const after = msg => {
      if (msg) this.setStatus(msg);
      this.rerender(win, contentFrame);
    };

    qa('[data-ferrum-enc]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setEncoding(btn.getAttribute('data-ferrum-enc'));
        this.sound('playClick');
        after();
      });
    });

    const nextBannerBtn = q('#btn-ferrum-next-banner');
    if (nextBannerBtn) {
      nextBannerBtn.addEventListener('click', () => {
        this.bannerIndex = (this.bannerIndex + 1) % this.banners.length;
        this.sound('playClick');
        after();
      });
    }

    qa('.ferrum-banner[data-url], button[data-url]').forEach(el => {
      el.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        const target = el.getAttribute('data-url');
        if (target && window.appIE) window.appIE.navigate(win, target);
      });
    });

    const voteBtn = q('#btn-ferrum-poll-vote');
    if (voteBtn) {
      voteBtn.addEventListener('click', () => {
        const checked = q('input[name="ferrum-poll-choice"]:checked');
        if (!checked) return;
        this.votePoll(checked.value);
        after('Голос учтён. Спасибо!');
      });
    }

    qa('[data-ferrum-notepad-art]').forEach(btn => {
      btn.addEventListener('click', () => {
        const art = this.getArticle(btn.getAttribute('data-ferrum-notepad-art'));
        if (!art) return;
        this.openInNotepad(art.file, this.articleText(art));
        after(this.lastStatusMsg);
      });
    });

    qa('[data-ferrum-save-art]').forEach(btn => {
      btn.addEventListener('click', () => {
        const art = this.getArticle(btn.getAttribute('data-ferrum-save-art'));
        if (!art) return;
        this.saveTextToVfs(art.file, this.articleText(art));
        after(this.lastStatusMsg);
      });
    });

    const addCommentBtn = q('#btn-ferrum-add-comment');
    if (addCommentBtn) {
      addCommentBtn.addEventListener('click', () => {
        const artId = addCommentBtn.getAttribute('data-article-id');
        const authorEl = q('#ferrum-comment-author');
        const textEl = q('#ferrum-comment-text');
        if (!textEl || !textEl.value.trim()) return;
        this.addComment(artId, authorEl ? authorEl.value : '', textEl.value);
        after('Замечание занесено в протокол, инженер стенда ответил.');
      });
    }

    const benchCpu = q('#ferrum-bench-cpu');
    const benchGpu = q('#ferrum-bench-gpu');
    const benchMode = q('#ferrum-bench-mode');
    [benchCpu, benchGpu, benchMode].filter(Boolean).forEach(sel => {
      sel.addEventListener('change', () => {
        this.setBenchState({
          cpu: benchCpu ? benchCpu.value : 'cel300a_450',
          gpu: benchGpu ? benchGpu.value : 'tnt',
          mode: benchMode ? benchMode.value : '800x600x16'
        });
        this.sound('playClick');
        after();
      });
    });

    const runBenchBtn = q('#btn-ferrum-run-bench');
    if (runBenchBtn) {
      runBenchBtn.addEventListener('click', () => {
        const cur = this.getBenchState();
        const next = this.setBenchState({ runs: (cur.runs || 0) + 1 });
        const res = this.computeBenchmark(next);
        this.sound('playDing');
        after(`Прогон #${next.runs} завершён: ${res.q2Fps} кадр/с в Quake II, ${res.mark3d} очков в 3DMark 99.`);
      });
    }

    const benchNotepadBtn = q('#btn-ferrum-bench-notepad');
    if (benchNotepadBtn) {
      benchNotepadBtn.addEventListener('click', () => {
        this.openInNotepad('FERRUM_BENCH_98.TXT', this.benchmarkReportText());
        after(this.lastStatusMsg);
      });
    }

    const benchSaveBtn = q('#btn-ferrum-bench-save');
    if (benchSaveBtn) {
      benchSaveBtn.addEventListener('click', () => {
        this.saveTextToVfs('FERRUM_BENCH_98.TXT', this.benchmarkReportText());
        after(this.lastStatusMsg);
      });
    }

    const jmpFsb = q('#ferrum-jmp-fsb');
    const jmpMult = q('#ferrum-jmp-mult');
    const jmpVcore = q('#ferrum-jmp-vcore');
    const jmpB21 = q('#ferrum-jmp-b21');
    const jmpJp1 = q('#ferrum-jmp-jp1');
    const secBo = q('#ferrum-sec-bo');
    const secNb = q('#ferrum-sec-nb');
    const secNetbios = q('#ferrum-sec-netbios');

    const updateJumpers = () => {
      this.setJumperState({
        fsb: jmpFsb ? Number(jmpFsb.value) : 100,
        mult: jmpMult ? Number(jmpMult.value) : 4.5,
        vcore: jmpVcore ? jmpVcore.value : '2.00',
        b21Taped: jmpB21 ? Boolean(jmpB21.checked) : true,
        jp1Protected: jmpJp1 ? Boolean(jmpJp1.checked) : true,
        closeBo31337: secBo ? Boolean(secBo.checked) : true,
        closeNb12345: secNb ? Boolean(secNb.checked) : true,
        unbindNetbios139: secNetbios ? Boolean(secNetbios.checked) : true
      });
      this.sound('playClick');
      after();
    };

    [jmpFsb, jmpMult, jmpVcore, jmpB21, jmpJp1, secBo, secNb, secNetbios].filter(Boolean).forEach(el => {
      el.addEventListener('change', updateJumpers);
    });

    qa('[data-ferrum-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const which = el.getAttribute('data-ferrum-toggle');
        const st = this.getJumperState();
        if (which === 'b21') this.setJumperState({ b21Taped: !st.b21Taped });
        if (which === 'jp1') this.setJumperState({ jp1Protected: !st.jp1Protected });
        this.sound('playClick');
        after();
      });
    });

    const jmpNotepadBtn = q('#btn-ferrum-jmp-notepad');
    if (jmpNotepadBtn) {
      jmpNotepadBtn.addEventListener('click', () => {
        this.openInNotepad('HARDEN_WIN98_NOV98.TXT', this.jumperMemoText());
        after(this.lastStatusMsg);
      });
    }

    const jmpSaveBtn = q('#btn-ferrum-jmp-save');
    if (jmpSaveBtn) {
      jmpSaveBtn.addEventListener('click', () => {
        this.saveTextToVfs('HARDEN_WIN98_NOV98.TXT', this.jumperMemoText());
        after(this.lastStatusMsg);
      });
    }

    qa('.ferrum-rig-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const slot = sel.getAttribute('data-slot');
        if (!slot) return;
        this.setRigState({ [slot]: sel.value });
        this.sound('playClick');
        after();
      });
    });

    qa('input[name="ferrum-rig-market"]').forEach(rad => {
      rad.addEventListener('change', () => {
        if (!rad.checked) return;
        this.setRigState({ market: rad.value });
        this.sound('playClick');
        after();
      });
    });

    const rigNotepadBtn = q('#btn-ferrum-rig-notepad');
    if (rigNotepadBtn) {
      rigNotepadBtn.addEventListener('click', () => {
        this.openInNotepad('SMETA_25_11_98.TXT', this.priceInvoiceText());
        after(this.lastStatusMsg);
      });
    }

    const rigSaveBtn = q('#btn-ferrum-rig-save');
    if (rigSaveBtn) {
      rigSaveBtn.addEventListener('click', () => {
        this.saveTextToVfs('SMETA_25_11_98.TXT', this.priceInvoiceText());
        after(this.lastStatusMsg);
      });
    }

    const chipSelect = q('#ferrum-chip-select');
    if (chipSelect) {
      chipSelect.addEventListener('change', () => {
        this.chipCheckCode = chipSelect.value;
        this.sound('playClick');
        after();
      });
    }

    const createThreadBtn = q('#btn-ferrum-create-thread');
    if (createThreadBtn) {
      createThreadBtn.addEventListener('click', () => {
        const catEl = q('#ferrum-newthread-cat');
        const authorEl = q('#ferrum-newthread-author');
        const titleEl = q('#ferrum-newthread-title');
        const textEl = q('#ferrum-newthread-text');
        if (!titleEl || !textEl || !titleEl.value.trim() || !textEl.value.trim()) return;
        const created = this.createThread(
          catEl ? catEl.value : 'oc',
          titleEl.value,
          authorEl ? authorEl.value : 'Инженер_98',
          textEl.value
        );
        if (created) {
          const target = `${this.baseUrl}/thread?id=${created.id}`;
          this.lastStatusMsg = 'Письмо ушло в эху, дежурный ответил.';
          this.statusPath = target;
          this.rerender(win, contentFrame, target);
        }
      });
    }

    const replyBtn = q('#btn-ferrum-send-reply');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => {
        const threadId = replyBtn.getAttribute('data-thread-id');
        const authorEl = q('#ferrum-reply-author');
        const textEl = q('#ferrum-reply-text');
        if (!threadId || !textEl || !textEl.value.trim()) return;
        this.addThreadReply(threadId, authorEl ? authorEl.value : '', textEl.value);
        after('Ответ ушёл в эху, дежурный инженер дописал своё.');
      });
    }

    const clippyBtn = q('#btn-ferrum-ask-clippy');
    if (clippyBtn) {
      clippyBtn.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy.speak(
            '<strong>Железный Цех \'98</strong>! Завтра 26-е: поставьте перемычку JP1 в положение 2-3, чтобы CIH не стёр BIOS. А заклеенный контакт B21 выведет Celeron 300A на шину 100 МГц.',
            [
              { text: '• Открыть монтажный стол', action: () => window.appClippy.openInIE(`${this.baseUrl}/jumpers`) },
              { text: '• Открыть стенд FPS', action: () => window.appClippy.openInIE(`${this.baseUrl}/bench`) }
            ],
            '[!]'
          );
        }
      });
    }
  }
}

window.ferrumSite = new FerrumSite();
