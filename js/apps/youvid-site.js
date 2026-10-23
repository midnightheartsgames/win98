class YouVidPlayer {
  constructor(root, clip, meta, site) {
    this.root = root;
    this.clip = clip;
    this.meta = meta;
    this.site = site;
    this.screen = root.querySelector('.yv-screen');
    this.canvas = root.querySelector('.yv-canvas');
    this.audio = root.querySelector('.yv-audio');
    this.big = root.querySelector('.yv-big');
    this.endEl = root.querySelector('.yv-end');
    this.msg = root.querySelector('.yv-msg');
    this.pp = root.querySelector('.yv-pp');
    this.seekEl = root.querySelector('.yv-seek');
    this.played = root.querySelector('.yv-played');
    this.buffered = root.querySelector('.yv-buffered');
    this.knob = root.querySelector('.yv-knob');
    this.timeEl = root.querySelector('.yv-time');
    this.muteBtn = root.querySelector('.yv-mute');
    this.loopBtn = root.querySelector('.yv-loop');
    this.curEl = root.querySelector('.yv-cur');
    this.bars = [...root.querySelectorAll('.yv-bar-step')];
    this.state = 'loading';
    this.time = 0;
    this.silent = false;
    this.clockBase = 0;
    this.clockStart = 0;
    this.raf = 0;
    this.volume = site.state.volume === undefined ? 7 : Math.min(10, site.state.volume);
    this.looping = Boolean(site.state && site.state.loop);
    this.counted = false;
  }

  start(autoplay) {
    this.showMessage('Загрузка…');
    this.bind();
    this.paintVolume();
    this.paintLoop();
    this.updateTime();
    setTimeout(() => {
      if (!this.root.isConnected) return;
      try {
        this.renderer = new window.P3D.Renderer(this.canvas);
        this.scene = this.clip.create(this.renderer);
        this.scene.warm();
      } catch (e) {
        this.state = 'broken';
        this.root.classList.add('yv-broken');
        this.showMessage('Видео не может быть показано: браузер не дал доступ к 3D-ускорителю (WebGL).');
        this.pp.disabled = true;
        this.big.hidden = true;
        return;
      }
      this.hideMessage();
      this.state = 'paused';
      this.drawFrame(0);
      if (autoplay) this.play(true);
    }, 30);
    this.watch = setInterval(() => {
      if (!this.root.isConnected) this.destroy();
      else this.paintBuffered();
    }, 700);
  }

  bind() {
    const toggle = () => this.toggle();
    this.pp.addEventListener('click', toggle);
    this.big.addEventListener('click', toggle);
    this.canvas.addEventListener('click', toggle);
    this.screen.addEventListener('keydown', (e) => this.onKey(e));
    this.seekEl.addEventListener('keydown', (e) => this.onKey(e));
    const seekFromEvent = (e) => {
      const r = this.seekEl.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      this.seek(k * this.clip.duration);
    };
    this.seekEl.addEventListener('pointerdown', (e) => {
      if (this.state === 'loading' || this.state === 'broken') return;
      seekFromEvent(e);
      const move = (ev) => seekFromEvent(ev);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    this.muteBtn.addEventListener('click', () => this.setVolume(this.volume > 0 ? 0 : 7));
    if (this.loopBtn) this.loopBtn.addEventListener('click', () => this.setLoop(!this.looping));
    this.bars.forEach((b, i) => b.addEventListener('click', () => this.setVolume(i + 1)));
    this.root.querySelector('.yv-stop').addEventListener('click', () => this.stop());
    this.root.querySelector('.yv-size-normal').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
    });
    this.root.querySelector('.yv-size-full').addEventListener('click', () => {
      if (!document.fullscreenElement && this.screen.requestFullscreen) this.screen.requestFullscreen().catch(() => {});
    });
    this.root.querySelector('.yv-replay').addEventListener('click', () => {
      this.time = 0;
      this.play();
    });
    this.root.querySelectorAll('.yv-end-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.classList.add('yv-end-item-hover'));
      item.addEventListener('mouseleave', () => item.classList.remove('yv-end-item-hover'));
      item.addEventListener('focus', () => item.classList.add('yv-end-item-hover'));
      item.addEventListener('blur', () => item.classList.remove('yv-end-item-hover'));
    });
    this.audio.addEventListener('ended', () => this.finish());
    this.audio.addEventListener('waiting', () => { if (this.state === 'playing') this.showMessage('Загрузка…'); });
    this.audio.addEventListener('playing', () => this.hideMessage());
  }

  onKey(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target !== this.screen && e.target !== this.seekEl) return;
      e.preventDefault();
      this.toggle();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.seek(this.currentTime() + (e.key === 'ArrowLeft' ? -5 : 5));
    }
  }

  currentTime() {
    if (this.state !== 'playing') return this.time;
    if (this.silent) return this.clockBase + (performance.now() - this.clockStart) / 1000;
    return this.audio.currentTime;
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else this.play();
  }

  outputVolume() {
    return Math.max(0, Math.min(1, this.volume / 10));
  }

  play(auto) {
    if (this.state === 'broken' || this.state === 'loading') return;
    if (this.state === 'ended' || this.time >= this.clip.duration - 0.05) this.time = 0;
    this.state = 'playing';
    this.root.classList.add('yv-playing');
    this.root.classList.remove('yv-ended');
    this.endEl.hidden = true;
    this.big.hidden = true;
    this.pp.classList.add('yv-pp-pause');
    this.pp.setAttribute('aria-label', 'Пауза');
    this.audio.volume = this.outputVolume();
    if (!this.counted) {
      this.counted = true;
      this.site.countView(this.meta.id);
    }
    if (this.silent) {
      this.clockBase = this.time;
      this.clockStart = performance.now();
    } else {
      try {
        this.audio.currentTime = this.time;
      } catch (e) {}
      const p = this.audio.play();
      if (p && p.catch) {
        p.catch((err) => {
          if (auto && err && err.name === 'NotAllowedError') this.pause();
          else this.goSilent();
        });
      }
    }
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.loop());
  }

  goSilent() {
    if (this.state !== 'playing') return;
    this.silent = true;
    this.clockBase = this.time;
    this.clockStart = performance.now();
    this.showMessage('Звук не загрузился. Видео идёт без звука.');
  }

  pause() {
    if (this.state !== 'playing') return;
    this.time = this.currentTime();
    this.state = 'paused';
    this.root.classList.remove('yv-playing');
    this.audio.pause();
    cancelAnimationFrame(this.raf);
    this.pp.classList.remove('yv-pp-pause');
    this.pp.setAttribute('aria-label', 'Смотреть');
    this.big.hidden = false;
    this.drawFrame(this.time);
    this.updateTime();
  }

  stop() {
    if (this.state === 'loading' || this.state === 'broken') return;
    if (this.state === 'playing') this.pause();
    this.state = 'paused';
    this.root.classList.remove('yv-ended');
    this.endEl.hidden = true;
    this.big.hidden = false;
    this.time = 0;
    this.drawFrame(0);
    this.updateTime();
  }

  finish() {
    if (this.state === 'ended') return;
    if (this.looping) {
      this.time = 0;
      if (this.updateTime) this.updateTime();
      this.play();
      return;
    }
    this.time = this.clip.duration;
    this.state = 'ended';
    this.root.classList.remove('yv-playing');
    this.root.classList.add('yv-ended');
    cancelAnimationFrame(this.raf);
    this.audio.pause();
    this.pp.classList.remove('yv-pp-pause');
    this.pp.setAttribute('aria-label', 'Смотреть');
    this.endEl.hidden = false;
    this.updateTime();
    if (window.appClippy && window.appClippy.onYouVidEnded) window.appClippy.onYouVidEnded(this.meta);
  }

  seek(t) {
    const tt = Math.max(0, Math.min(this.clip.duration - 0.05, t));
    if (this.state === 'playing') {
      if (this.silent) {
        this.clockBase = tt;
        this.clockStart = performance.now();
      } else {
        try {
          this.audio.currentTime = tt;
        } catch (e) {}
      }
      return;
    }
    if (this.state === 'ended') {
      this.state = 'paused';
      this.root.classList.remove('yv-ended');
      this.endEl.hidden = true;
      this.big.hidden = false;
    }
    this.time = tt;
    this.drawFrame(tt);
    this.updateTime();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(10, v));
    this.site.saveState({ volume: this.volume });
    this.audio.volume = this.outputVolume();
    this.paintVolume();
  }

  paintVolume() {
    this.bars.forEach((b, i) => b.classList.toggle('yv-bar-on', i < this.volume));
    this.muteBtn.classList.toggle('yv-muted', this.volume === 0);
    if (window.webGif) this.muteBtn.innerHTML = window.webGif(this.volume === 0 ? 'mute' : 'speaker');
    this.muteBtn.setAttribute('aria-label', this.volume === 0 ? 'Включить звук' : 'Выключить звук');
  }

  setLoop(on) {
    this.looping = Boolean(on);
    this.site.saveState({ loop: this.looping });
    this.paintLoop();
  }

  paintLoop() {
    if (!this.loopBtn) return;
    this.loopBtn.classList.toggle('yv-loop-on', this.looping);
    this.loopBtn.setAttribute('aria-pressed', this.looping ? 'true' : 'false');
    const label = this.looping ? 'Выключить повтор' : 'Повторять видео';
    this.loopBtn.setAttribute('aria-label', label);
    this.loopBtn.setAttribute('title', label);
  }

  paintBuffered() {
    const b = this.audio.buffered;
    let end = 0;
    try {
      for (let i = 0; i < b.length; i++) end = Math.max(end, b.end(i));
    } catch (e) {}
    this.buffered.style.width = `${Math.min(100, (end / this.clip.duration) * 100)}%`;
  }

  loop() {
    if (!this.root.isConnected) {
      this.destroy();
      return;
    }
    if (this.state !== 'playing') return;
    const t = this.currentTime();
    if (t >= this.clip.duration) {
      this.finish();
      return;
    }
    this.time = t;
    this.drawFrame(t);
    const now = performance.now();
    if (!this.lastUi || now - this.lastUi > 250) {
      this.lastUi = now;
      this.updateTime();
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }

  drawFrame(t) {
    if (this.scene) this.scene.render(t);
  }

  updateTime() {
    const t = Math.min(this.time, this.clip.duration);
    const k = (t / this.clip.duration) * 100;
    this.curEl.textContent = YouVidPlayer.fmt(t);
    this.played.style.width = `${k}%`;
    this.knob.style.left = `${k}%`;
    this.seekEl.setAttribute('aria-valuenow', String(Math.round(t)));
    this.seekEl.setAttribute('aria-valuetext', YouVidPlayer.fmt(t));
    this.paintChapter(t);
  }

  paintChapter(t) {
    const list = this.meta && this.meta.chapters;
    if (!list) return;
    if (!this.chapButtons) {
      const page = this.root.closest('.yv-cols') || this.root.parentElement;
      this.chapButtons = page ? [...page.querySelectorAll('.yv-chap')] : [];
    }
    let now = 0;
    list.forEach(([start], i) => { if (t >= start) now = i; });
    this.chapButtons.forEach((b, i) => {
      const on = i === now;
      b.classList.toggle('yv-chap-now', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }

  showMessage(text) {
    this.msg.textContent = text;
    this.msg.hidden = false;
  }

  hideMessage() {
    if (this.state === 'broken' || this.silent) return;
    this.msg.hidden = true;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearInterval(this.watch);
    this.state = 'broken';
    try {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch (e) {}
    if (this.renderer) this.renderer.dispose();
    this.renderer = null;
    if (this.site.player === this) this.site.player = null;
  }

  static fmt(t) {
    const s = Math.max(0, Math.floor(t));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
}

class YouVidSite {
  constructor() {
    this.baseUrl = 'http://www.youvid.com';
    this.player = null;
    this.storeKey = 'youvid98';
    this.channels = {
      jawed: {
        user: 'jawed',
        name: 'jawed',
        joined: '23 апреля 1999',
        lastSeen: '3 месяца назад',
        country: 'США',
        subs: 2147,
        about: '',
        site: '',
        theme: 'day'
      },
      Hayato_me: {
        user: 'Hayato_me',
        name: 'Hayato',
        joined: '9 июля 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 6590,
        about: 'Просчитался , но где?',
        site: 't.me/Kishlak_Hayato',
        theme: 'night'
      },
      EbatoriyaPlanet: {
        user: 'EbatoriyaPlanet',
        name: 'Планета Ебатории',
        joined: '1 декабря 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 3660,
        about: 'Ебатория всех впускает, но никого и никогда не выпускает.',
        site: '',
        theme: 'quilt'
      },
      MisterBucks: {
        user: 'MisterBucks',
        name: 'Мистер Бакс',
        joined: '22 сентября 1999',
        lastSeen: 'сегодня',
        country: 'Великобритания',
        subs: 25200,
        about: 'Канал для всей семьи. Family friendly content.',
        site: '',
        theme: 'bucks'
      },
      m1s3n: {
        user: 'm1s3n',
        name: 'm1s3n',
        joined: '14 ноября 1999',
        lastSeen: 'сегодня',
        country: 'Япония',
        subs: 14800,
        about: 'Оператор линии Krampus Compliance. Если звонит косичка — возьми трубку.',
        site: '',
        theme: 'linging'
      },
      Crunchyroll: {
        user: 'Crunchyroll',
        name: 'Crunchyroll',
        joined: '14 мая 1999',
        lastSeen: 'сегодня',
        country: 'США',
        subs: 19400,
        about: 'Официальный канал аниме: опенинги, эндинги и серии прямо в окне браузера.',
        site: '',
        theme: 'crunchy'
      },
      HSR98: {
        user: 'HSR98',
        name: 'HSR98',
        joined: '26 апреля 1999',
        lastSeen: 'сегодня',
        country: 'Пенакония',
        subs: 24100,
        about: 'Официальный канал Honkai: Star Rail 98. Трейлеры персонажей, хроники Звёздного экспресса и представления Недотёп в масках.',
        site: 'hsr.hoyoverse.com',
        avatarFile: 'content/YouVid/avatars/hsr98.png',
        bannerFile: 'content/YouVid/banners/HSR98.svg',
        theme: 'hsr'
      },
      StreyOsuzhdaet: {
        user: 'StreyOsuzhdaet',
        name: 'СТРЕЙ ОСУЖДАЕТ',
        joined: '18 октября 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 18300,
        about: 'Хроники максимального осуждения: перепутанные треки, донаты на тысячу, усатый вердикт и лучшая реакция чата.',
        site: '',
        theme: 'osuzhdaet'
      },
      memes_ytp: {
        user: 'memes_ytp',
        name: 'memes/ytp',
        joined: '5 ноября 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 7340,
        about: 'Мемы и поуп. Нарезки, склейки и короткие ролики, которые не стоит объяснять.',
        site: '',
        theme: 'ytp'
      }
    };
    this.videos = [
      {
        id: 'jNQXAC9IVRw',
        title: 'Me at the zoo',
        channel: 'jawed',
        added: '23 апреля 1999',
        order: 1,
        category: 'film',
        description: 'Ну вот, мы в зоопарке, прямо перед слонами.',
        tags: ['me', 'at', 'the', 'zoo', 'jawed', 'слоны'],
        views: 61804,
        rating: 4.5,
        ratings: 1377,
        favorited: 529,
        honors: 4,
        links: 63,
        comments: [
          { user: 'elephant_fan84', when: '3 дня назад', text: 'Хоботы и правда очень, очень, очень длинные.' },
          { user: 'Vasya1999', when: '1 неделю назад', text: 'Видео прямо в окне браузера, без RealPlayer и скачивания .avi. Как вы это сделали?' },
          { user: 'zoo_keeper', when: '2 недели назад', text: 'Слоны в кадре молодцы, отработали на пять звёзд.' },
          { user: 'modem_56k', when: '1 месяц назад', text: 'Друг прислал ссылку по ICQ. Слоны что надо.' }
        ]
      },
      {
        id: 'hArMoNy_hsr',
        title: 'Смогу ли Я пройти ХСР только ГАРМОНИСТАМИ',
        channel: 'Hayato_me',
        added: '5 дней назад',
        order: 2,
        category: 'games',
        description: 'Челлендж: прохожу Honkai: Star Rail отрядом только из персонажей Пути Гармонии. Правила, крутки, бои и Виртуальная вселенная.\nTelegram: t.me/Kishlak_Hayato',
        tags: ['хср', 'honkai', 'star rail', 'гармония', 'челлендж', 'hayato'],
        views: 23418,
        rating: 5,
        ratings: 412,
        favorited: 188,
        honors: 2,
        links: 7,
        comments: [
          { user: 'minmax_harmony', when: '2 часа назад', text: 'Броня снова тащит за всех, классика.' },
          { user: 'kishlak_resident', when: '5 часов назад', text: 'Жду вторую часть с боссом. Арчера всё-таки крутим?' },
          { user: 'ruan_mei_enjoyer', when: '1 день назад', text: 'Звёздное благословение Асты посреди боя — лучший момент.' },
          { user: 'trailblazer777', when: '3 дня назад', text: 'Правила жёсткие, но честные. Лайк за мягкую комнату.' }
        ]
      },
      {
        id: 'i9AyI356ye4',
        title: 'Влад Савельев ложится спать',
        channel: 'EbatoriyaPlanet',
        added: '2 дня назад',
        order: 3,
        category: 'people',
        description: 'Влад готовится ко сну: ищет жену, рассказывает про булочку, снимает толстовку и с нескольких попыток накрывается одеялом.',
        tags: ['влад', 'савельев', 'сон', 'одеяло', 'булочка', 'почти'],
        views: 31846,
        rating: 4.5,
        ratings: 714,
        favorited: 243,
        honors: 3,
        links: 19,
        comments: [
          { user: 'odeyalo_master', when: '3 часа назад', text: 'Накрыться одеялом с четвёртого «Почти!» — это почти олимпийский норматив.' },
          { user: 'nochnoy_dozor', when: '9 часов назад', text: 'Смотрел ночью тихо, чтобы не разбудить родителей. На четвёртом «Почти!» не выдержал и засмеялся в подушку.' },
          { user: 'bulochka_s_makom', when: '1 день назад', text: 'А булочка была с маком или с изюмом? Вопрос серьёзный.' },
          { user: 'Pchelka_Maya', when: '1 день назад', text: 'Влад, жена найдётся! Главное, не ложись на краю.' },
          { user: 'son_v_ruku', when: '2 дня назад', text: 'Лучше любой колыбельной. Досмотрел и сам пошёл спать.' }
        ]
      },
      {
        id: 'vEryN1ceGdN',
        title: 'verynicegoodnice',
        channel: 'EbatoriyaPlanet',
        added: '5 часов назад',
        order: 4,
        category: 'music',
        description: 'Вери найс по прайсу стрима: караоке без фонограммы, три длинные ноты и финальный взгляд в камеру.',
        tags: ['вери найс', 'гуд найс', 'караоке', 'стрим', 'донат', 'beginner'],
        views: 4812,
        rating: 5,
        ratings: 233,
        favorited: 91,
        honors: 1,
        links: 12,
        comments: [
          { user: 'karaoke_king', when: '1 час назад', text: 'Десять секунд, а ноту держит дольше, чем мой модем держит соединение.' },
          { user: 'Zhuchka_55', when: '2 часа назад', text: 'Задонатила 55 рублей, а поёт он только за тысячу. Коплю на вери найс.' },
          { user: 'sosed_snizu', when: '4 часа назад', text: 'Слышали через потолок. Very nice, good nice. Соседи снизу согласны.' },
          { user: 'beginner_forever', when: '5 часов назад', text: 'It\'s beginner — это только начало. Ждём полную версию.' }
        ]
      },
      {
        id: 'eXtr3meSlay',
        title: 'Теперь я extremely slay, меньше волос',
        channel: 'MisterBucks',
        added: '1 час назад',
        order: 5,
        category: 'entertainment',
        description: 'Сходил в барбершоп и вышел совсем другим человеком. Папа с сестрой ждали на улице и не сразу поверили, что это я. Короче по бокам, чёлка набок, леденец за смелость.',
        tags: ['стрижка', 'барбершоп', 'slay', 'причёска', 'леденец', 'мистер бакс'],
        views: 154377,
        rating: 4.5,
        ratings: 2963,
        favorited: 1108,
        honors: 6,
        links: 41,
        comments: [
          { user: 'slay_detector', when: '12 минут назад', text: 'Уровень slay: extremely. Проверено, подтверждаю.' },
          { user: 'barber_dima', when: '25 минут назад', text: 'Виски коротко, верх оставили, чёлку набок. Мастеру респект, классика.' },
          { user: 'papa_tozhe_v_shoke', when: '40 минут назад', text: 'Папа так удивился, будто это его самого постригли.' },
          { user: 'ledenec_98', when: '50 минут назад', text: 'Леденец за стрижку — вот это я понимаю сервис. Мне в парикмахерской только «не вертись» говорят.' },
          { user: 'modem_33600', when: '1 час назад', text: 'Восемь секунд видео грузилось минут десять. Оно того стоило.' }
        ]
      },
      {
        id: 'y0Ph0neL1ng',
        title: 'yo phone linging',
        channel: 'm1s3n',
        added: '20 минут назад',
        order: 6,
        category: 'comedy',
        description: 'Диалинь медитирует на золотом кольце в солнечном дворике, но прямо посреди тишины у неё звонит косичка. Yo phone linging, big boy, come pick up your phone!',
        tags: ['yo phone linging', 'm1s3n', 'диалинь', 'dialyn', 'телефон', 'звонит', 'рингтон'],
        views: 94210,
        rating: 5,
        ratings: 1842,
        favorited: 764,
        honors: 5,
        links: 38,
        comments: [
          { user: 'ringtone_3310', when: '5 минут назад', text: 'Сидел за компом, услышал звук и побежал в коридор искать трубку домашнего телефона.' },
          { user: 'panda_operator', when: '8 минут назад', text: 'Вот это я понимаю гарнитура: вытянула телефонную трубку прямо из собственной косички.' },
          { user: 'glazok_door98', when: '12 минут назад', text: 'Кадр на 0:08 прямо в дверной глазок — чуть со стула не упал, когда она приблизилась вплотную.' },
          { user: 'big_boy_line', when: '15 минут назад', text: 'Когда перестал брать трубку с незнакомых номеров, и оператор пришёл лично к твоей двери.' },
          { user: 'chakram_zen', when: '18 минут назад', text: 'В начале такая спокойная медитация под сосной, а через две секунды уже: АЛЛО, ВОЗЬМИ ТРУБКУ.' }
        ]
      },
      {
        id: 'k0n0SuBa3Ed',
        title: 'KONOSUBA 3 - Ending',
        channel: 'Crunchyroll',
        added: '10 минут назад',
        order: 7,
        category: 'film',
        description: 'Эндинг третьего сезона KONOSUBA («Ano Hi no Mama no Bokura»): Чомуске и фиолетовый головастик гигантской жабы проводят день в особняке с Казумой, Аквой, Мегумин и Даркнесс, принимают ванну и возвращаются на луг к родителям-жабам.',
        tags: ['konosuba', 'коносуба', 'crunchyroll', 'аниме', 'эндинг', 'аква', 'мегумин', 'казума', 'даркнесс', 'чомуске'],
        views: 118540,
        rating: 5,
        ratings: 2410,
        favorited: 985,
        honors: 5,
        links: 47,
        comments: [
          { user: 'crimson_demon99', when: '2 минуты назад', text: 'Такая спокойная, тёплая песня про день с головастиком, а на последних секундах — классическая Аква и гигантские жабы.' },
          { user: 'chomusuke_wing', when: '4 минуты назад', text: 'Чомуске всю серию присматривала за головастиком лучше всех остальных в особняке.' },
          { user: 'useless_goddess', when: '6 минут назад', text: 'Кадр на 1:20 с лицом Аквы, когда из травы вышли две огромные жабы — в рамочку и на рабочий стол.' },
          { user: 'axel_adventurer', when: '8 минут назад', text: 'Казума и Мегумин так мило переглянулись на прощание, пока за спиной начиналась катастрофа.' },
          { user: 'toad_slime_enjoyer', when: '9 минут назад', text: 'Головастик вырос на казённых харчах и сдал тётю Акву родителям. Счастливый финал!' }
        ]
      },
      {
        id: 'Sav3lOtpusk',
        title: 'Савельев берет отпуск тли тотальное неуважение',
        channel: 'EbatoriyaPlanet',
        added: '40 минут назад',
        order: 8,
        category: 'people',
        description: 'Влад уезжает и ждёт такси. Друг с камерой не отпускает его ни на шаг: зовёт остаться в поместье, клянётся в вечной дружбе, вспоминает клетчатую сумку и предлагает лимузин, бигфут и вертолётное такси. Влад просит оставить его в покое.\nПятнадцать минут пешком по району, камера снимает всё в розовом цвете.',
        tags: ['влад', 'савельев', 'отпуск', 'такси', 'поместье', 'кленовый лист', 'неуважение'],
        views: 12937,
        rating: 4.5,
        ratings: 388,
        favorited: 141,
        honors: 2,
        links: 23,
        chapters: [
          [0, 'Погоня по газону'],
          [52, 'Деловой человек на проводе'],
          [90, 'Вид сверху'],
          [116, 'Системник на совести'],
          [145, 'Прощальные объятия'],
          [166, 'Полдороги и клетчатая сумка'],
          [244, '«Я просто хочу потусить»'],
          [331, 'Розовый негатив'],
          [362, 'Приглашение в поместье'],
          [450, 'Сумки на асфальте'],
          [580, 'Три часа на такси'],
          [622, 'Взгляд в небо'],
          [660, '«Я как банный лист»'],
          [712, 'Лимузин, бигфут или вертолёт'],
          [760, 'Кленовый лист'],
          [782, 'Сердце навеки'],
          [846, 'Сто раз «нет»'],
          [871, '«Дай мне одному побыть»']
        ],
        comments: [
          { user: 'taxi_dispetcher', when: '5 минут назад', text: 'Такси так и не приехало, зато лимузин, бигфут и вертолёт предложили. Вот это сервис!' },
          { user: 'pomestie_98', when: '12 минут назад', text: 'Приглашение остаться в поместье ещё в силе? Спрашиваю для друга.' },
          { user: 'klenovyi_list', when: '20 минут назад', text: 'Кленовый лист на пузе на 12:50 — лучший орден, какой я видел в этом году.' },
          { user: 'vezhlivost_ne_porok', when: '31 минуту назад', text: 'Человек раз десять попросил дать ему побыть одному. Название не врёт: неуважение тотальное.' },
          { user: 'modem_14400', when: '38 минут назад', text: 'Пятнадцать минут видео качал всю ночь. Влад так и не уехал, а я так и не уснул.' }
        ]
      },
      {
        id: 'pAmPaRam98',
        title: 'Пампарам-пампарам,приветствую смотрящих',
        channel: 'EbatoriyaPlanet',
        added: '5 минут назад',
        order: 9,
        category: 'people',
        description: 'Широкий проход по оконному цеху под басы: руки в карманах кожанки, два «Пам-парам» и торжественное «Приветствую смотрящих!» у стойки со стеклопакетами.',
        tags: ['пампарам', 'приветствую', 'смотрящих', 'широкий', 'цех', 'окна', 'кожанка'],
        views: 42190,
        rating: 5,
        ratings: 918,
        favorited: 412,
        honors: 4,
        links: 31,
        comments: [
          { user: 'okonnyi_ceh98', when: '1 минуту назад', text: 'Идёт по цеху шире, чем наши двухстворчатые рамы на паллете. Уважаю.' },
          { user: 'subwoofer_20w', when: '2 минуты назад', text: 'На первых секундах колонки чуть со стола не уехали от басов, а потом так вежливо: «Приветствую смотрящих!»' },
          { user: 'denim_jacket', when: '3 минуты назад', text: 'Руки в карманах, шаг вразвалочку, взгляд строго по курсу. Начальник смены явно не рискнул спросить пропуск.' },
          { user: 'zritel_s_modema', when: '4 минуты назад', text: 'И вам здравствуйте! Приятно, когда с тобой здороваются прямо с экрана.' },
          { user: 'pvh_profil', when: '5 минут назад', text: 'Два «пам-парам» по дороге от верстака до готовых стеклопакетов — лучший обход производства.' }
        ]
      },
      {
        id: 'wAk3UpR0mAn',
        title: 'WAKE UP ROMAN',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 10,
        category: 'comedy',
        description: 'Утреннее пробуждение глазами сонного человека: тянется рука к телефону на тумбочке, горничная-дракон Тору заботливо надевает очки прямо на камеру, на экране уже 10:24 воскресенья — и тут же реальность таксопарка в Либерти-Сити, где Нико Беллик будит спящего за столом кузена Романа.',
        tags: ['wake up roman', 'roman', 'роман', 'нико', 'тору', 'tohru', 'будильник', 'утро', 'очки', 'проснись'],
        views: 58340,
        rating: 5,
        ratings: 1245,
        favorited: 534,
        honors: 4,
        links: 29,
        comments: [
          { user: 'bowling_cousin', when: '1 минуту назад', text: 'Сначала тебе надевают очки в светлой спальне, а через секунду кузен уже кричит над ухом в таксопарке. Жизненно.' },
          { user: 'liberty_cab98', when: '2 минуты назад', text: 'Когда поставил будильник на 7:00, моргнул один раз — а на экране уже 10:24 и смена в депо началась три часа назад.' },
          { user: 'glasses_hd', when: '3 минуты назад', text: 'Момент с надеванием очков от первого лица сделан отлично: картинка сразу стала чёткой, жаль только реальность вместе с ней вернулась.' },
          { user: 'tohru_maid99', when: '4 минуты назад', text: 'Переход от улыбки Тору к «Roman! Are you sleeping?!» — лучший контраст на всём сайте.' },
          { user: 'sonnyi_roman', when: '5 минут назад', text: '«Huh! No! No way!» — мой стандартный ответ каждое утро понедельника.' }
        ]
      },
      {
        id: 'sPaRkL3Mono',
        title: 'Sparkle Trailer - Monodrama',
        channel: 'HSR98',
        added: 'только что',
        order: 11,
        category: 'games',
        description: 'Трейлер персонажа Искорка (Sparkle): «Монодрама» из Honkai: Star Rail. Театр снов Пенаконии, школьный класс, алый занавес, маски кицунэ, золотые рыбки и русская рулетка от Недотёпы в маске.\nОфициальный сайт: hsr.hoyoverse.com',
        tags: ['sparkle', 'monodrama', 'искорка', 'монодрама', 'hsr98', 'хср', 'honkai', 'star rail', 'пенакония', 'penacony'],
        views: 184620,
        rating: 5,
        ratings: 4120,
        favorited: 1890,
        honors: 7,
        links: 84,
        chapters: [
          [0, 'Пролог: Часы Пенаконии'],
          [11, 'Акт I: Тихая ученица'],
          [24, 'Акт II: Выход на алую сцену'],
          [34, 'Танец золотых рыбок и кендамы'],
          [44, 'Шесть масок и один курок'],
          [56, 'Искорка: «Монодрама»'],
          [72, 'Акт III: Калейдоскоп тысячи лиц'],
          [95, 'Финальный выстрел'],
          [105, 'Поклон под золотым занавесом']
        ],
        comments: [
          { user: 'masked_fool_98', when: '1 минуту назад', text: 'Переходы между школьной партой, красным театром и калейдоскопом масок на 1:12 — чистое искусство Радости! Аха одобряет.' },
          { user: 'penacony_dreamer', when: '2 минуты назад', text: 'Когда на 0:56 выскочила карточка «SPARKLE — MONODRAMA» под дроп музыки, у меня мурашки побежали даже через ЭЛТ-монитор.' },
          { user: 'mono_quantum', when: '3 минуты назад', text: 'Отдаю все свои Звёздные нефриты без остатка. Лучший трейлер на канале HSR98!' },
          { user: 'kitsune_kendama', when: '4 минуты назад', text: 'Сцена с револьвером, веером и золотыми рыбками вокруг тории выглядит так, будто 3dfx Voodoo разогнали до предела.' },
          { user: 'aha_laughs', when: '5 минут назад', text: '«Ты думал, что смотришь спектакль? Нет, ты уже на сцене!» — пересматриваю уже пятый раз подряд.' }
        ]
      },
      {
        id: 'Str3yHarmon1',
        title: 'Стрей Не Оценил Губную Гармошку',
        channel: 'StreyOsuzhdaet',
        added: 'только что',
        order: 12,
        category: 'people',
        description: 'Стример в игровом кресле перед веб-камерой: наушники, неоновые соты на стене, чат справа и очень красноречивое лицо. Сначала он поправляет гарнитуру, потом косится в монитор, подаётся вперёд и под конец показывает все зубы.',
        tags: ['стрей', 'stray', 'гармошка', 'губная гармошка', 'стример', 'стрим', 'чат', 'реакция', 'усатый'],
        views: 37460,
        rating: 5,
        ratings: 861,
        favorited: 297,
        honors: 3,
        links: 22,
        chapters: [
          [0, 'Взгляд в камеру'],
          [3, 'Поправляет гарнитуру'],
          [8, 'Что там на мониторе?'],
          [10, 'Крик'],
          [12, 'Нос к самому экрану'],
          [14, 'Стример объясняет'],
          [18, 'Все зубы'],
          [20, 'Итог']
        ],
        comments: [
          { user: 'chat_pokazal_sabku', when: '1 минуту назад', text: 'На 12-й секунде он так приблизился к камере, что я увидел пору на носу. Гармошку, видимо, тоже.' },
          { user: 'usatyi_malchik', when: '2 минуты назад', text: 'В чате ровно пять раз написали «усатый», и все пять — на моём мониторе.' },
          { user: 'headset_red_led', when: '3 минуты назад', text: 'Красный огонёк на правом ухе горит с самого начала. Гарнитуру он всё равно поправил — на всякий случай.' },
          { user: 'reklama_poshla', when: '4 минуты назад', text: '«Реклама пошла» — лучший комментарий на сайте, правда, в самом видео его не слышно.' },
          { user: 'zubastyi_stream', when: '5 минут назад', text: 'На 0:19 улыбка такая, что экран ЭЛТ слегка нагрелся.' }
        ]
      },
      {
        id: 'Str3yOsud1l',
        title: 'Стрей Осудил Наполовину',
        channel: 'StreyOsuzhdaet',
        added: 'только что',
        order: 13,
        category: 'people',
        description: 'Стример пытается осудить провокационный донат, но сломанный алерт обрывает его ровно на слове «О-су...». После второй попытки и пищащей цензуры рождается легендарный вердикт: «Я осудил тебя наполовину! Не одобряю максимально! Клоун.»',
        tags: ['стрей', 'stray', 'осудил', 'наполовину', 'осуждаю', 'алерт', 'стример', 'реакция', 'усатый', 'клоун'],
        views: 42180,
        rating: 5,
        ratings: 948,
        favorited: 342,
        honors: 4,
        links: 27,
        chapters: [
          [0, 'Сломали алерт'],
          [6, 'Крик из доната'],
          [9, 'Первое «О-су...»'],
          [12, 'Вторая попытка'],
          [14, 'Осудил наполовину!'],
          [17, 'Пик-пик-пик'],
          [26, 'Провокатор и клоун']
        ],
        comments: [
          { user: 'polovina_osuzhdeniya', when: '1 минуту назад', text: 'Когда алерт обрубил звук ровно на «О-су...», я чуть чаем монитор не залил. Пятьдесят процентов осуждения засчитано!' },
          { user: 'FantoM_Dota', when: '2 минуты назад', text: 'Вот наполовину его прошёл — и донат наполовину осудил, идеальный баланс.' },
          { user: 'd3ad_ins1de', when: '3 минуты назад', text: 'ДАРЮ САБКУ ЗА АСУЖДЕНИЯ! Даже сломанный алерт не остановит усатого стража порядка.' },
          { user: 'pik_pik_alert', when: '4 минуты назад', text: 'На 0:18 такой сосредоточенный взгляд в левый монитор под пищание алерта, будто он морзянку расшифровывает.' },
          { user: 'maksimalno_ne_odobryayu', when: '5 минут назад', text: '«Не одобряю максимально! Клоун.» — записываю в золотой цитатник Планеты Ебатории.' }
        ]
      },
      {
        id: 'kL33T4T4T4a',
        title: '«Та-та-та!» Кли (Пиро)',
        channel: 'HSR98',
        added: 'только что',
        order: 14,
        category: 'games',
        description: 'Демо-ролик Кли, Искрящегося Рыцаря-Пиро: белые титры с вопросами про «самого сильного воина Мондштадта», площадь с Путешественником, карточка «Ускользающее Солнце», прыг-скок среди хиличурлов и слаймов, взрывы в траве, строгая Джинн, коридор штаба и закат с горящей поляной.\nВ Honkai: Star Rail 98 пиро-героев встречают так же громко.',
        tags: ['кли', 'klee', 'пиро', 'та-та-та', 'ускользающее солнце', 'прыг-скок', 'взрыв', 'мондштадт', 'hsr98', 'хср', 'honkai', 'star rail'],
        views: 213480,
        rating: 5,
        ratings: 5316,
        favorited: 2204,
        honors: 9,
        links: 97,
        chapters: [
          [0, 'Тишина перед взрывом'],
          [4.5, 'Титры: «Легендарная девочка в красном»'],
          [14, 'Кли на каменной площади'],
          [20.8, 'Решётчатая дверь и Путешественник'],
          [24.4, 'Карточка «Ускользающее Солнце»'],
          [27.8, 'Прыг-скок: взрывное веселье'],
          [38.6, 'Вспышки и огненные слаймы'],
          [46.3, 'Рыцарь Джинн'],
          [52.4, 'Коридор штаба'],
          [62.6, 'Крупный план'],
          [66.3, 'Каменный страж'],
          [70.7, 'Ночной бой и руины'],
          [77.9, 'Закат над лугом'],
          [90.7, 'Улыбка Кли']
        ],
        comments: [
          { user: 'dodoco_fan_98', when: '1 минуту назад', text: 'Та-та-та-та-та! У меня на мониторе тоже что-то загорелось, но это, кажется, перегрелся ЭЛТ.' },
          { user: 'strongest_knight', when: '2 минуты назад', text: 'На титрах написали «самый сильный воин Мондштадта», а Джинн в кадре даже бровью не повела. Железные нервы.' },
          { user: 'pyro_enjoyer', when: '3 минуты назад', text: 'Карточка «Ускользающее Солнце» с печатью «Кли» и прыгающей девочкой — лучшее оформление на всём канале HSR98.' },
          { user: 'trava_gorit', when: '4 минуты назад', text: 'Сначала подожгла траву, потом поляну, потом закат. Последовательность не нарушена.' },
          { user: 'rybka_vkusnaya', when: '5 минут назад', text: '«Рыбка такааая вкусная!» — вот ради чего я включаю этот ролик на повтор.' }
        ]
       },
      {
        id: 'Str3yTr3k98',
        title: 'Стрей Перепутал Трэк',
        channel: 'StreyOsuzhdaet',
        added: 'только что',
        order: 15,
        category: 'music',
        description: 'Катос присылает донат на тысячу с ремиксом «Маленькой страны», но вместо обычного припева внезапно вступает детский хор с совершенно другим текстом. Стрей отпивает из белой кружки, открывает окно на мониторе, в ужасе слушает куплет, вырубает трек и зачитывает оправдание донатера: «Я не этот трек думал, это не то!» Вердикт — осуждаю максимально!',
        tags: ['стрей', 'stray', 'перепутал', 'трэк', 'трек', 'катос', 'осуждает', 'осуждаю', 'маленькая страна', 'донат', 'стрим'],
        views: 68420,
        rating: 5,
        ratings: 1640,
        favorited: 612,
        honors: 5,
        links: 39,
        chapters: [
          [0, 'Глоток из кружки'],
          [3, 'Вступает детский хор'],
          [5, 'Свет монитора и шок'],
          [14, '«Что за песня?»'],
          [16, 'Второй куплет'],
          [21, 'Вырубает трек: «Катос!»'],
          [26, '«Я не этот трек думал, это не то!»'],
          [30, '«Спасибо за 1000!»'],
          [33.7, '«Осуждаю максимально!»']
        ],
        comments: [
          { user: 'katos_1000', when: '1 минуту назад', text: 'Я правда другой ремикс хотел скинуть! Название было такое же, кто же знал, что там хор с таким куплетом.' },
          { user: 'belya_kruzhka', when: '2 минуты назад', text: 'Спокойно попил чайку на 0:02, открыл окно на мониторе — и лицо озарилось светом чистого непонимания.' },
          { user: 'malenkaya_strana98', when: '3 минуты назад', text: 'По первым нотам думал, сейчас будет классика эстрады, а на пятой секунде весь чат улетел в стратосферу.' },
          { user: 'osuzhdayu_max', when: '4 минуты назад', text: '«Я не этот трек думал, это не то!» — лучшее оправдание в истории донатов за тысячу рублей.' },
          { user: 'usatyi_verdikt', when: '5 минут назад', text: 'Ладонь ко лбу на 0:29 и финальное «Осуждаю максимально!» — золотой фонд канала СТРЕЙ ОСУЖДАЕТ.' }
        ]
      },
      {
        id: 'n0p3Av1Eng1',
        title: 'nope.avi',
        channel: 'memes_ytp',
        added: 'только что',
        order: 16,
        category: 'comedy',
        description: 'Девять секунд, которые лучше любого длинного ответа. Инженер BLU идёт по двору шахты, поворачивается к камере, и каска взлетает над головой. Шея послушно тянется следом, звучит спокойное «Nope.» — и Инженер уходит за кадр, не меняя выражения лица.\nПодходит как ответ на «ты придёшь?», «ты точно всё проверил?» и «может, ещё раз?». Сохраняйте в закладки и пользуйтесь.',
        tags: ['nope.avi', 'nope', 'ноуп', 'инженер', 'engineer', 'tf2', 'team fortress', 'каска', 'шея', 'мем', 'ytp', 'memes'],
        views: 194820,
        rating: 5,
        ratings: 4820,
        favorited: 1930,
        honors: 8,
        links: 84,
        chapters: [
          [0, 'Двор шахты'],
          [2, 'Выход Инженера'],
          [4, 'Поворот к камере'],
          [5, 'Каска взлетает'],
          [6, '«Nope.»'],
          [7, 'Уход за кадр']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'Отправил это боссу вместо ответа на письмо. Пока жду реакции.' },
          { user: 'zakladka98', when: '2 минуты назад', text: 'На 0:05 каска улетает, на 0:06 шея догоняет. Идеальный монтаж без единой лишней секунды.' },
          { user: 'blu_engineer_fan', when: '3 минуты назад', text: 'Он даже не торопится. Просто сказал «Nope.» и пошёл по делам.' },
          { user: 'nopenopenope', when: '4 минуты назад', text: 'Теперь это мой статус на все приглашения до конца года.' },
          { user: 'shahta_dvor', when: '5 минут назад', text: 'Nope.' }
        ]
      },
      {
        id: 'k3An4uH0rnY',
        title: 'Keanu Reeves is Extremely Horny',
        channel: 'memes_ytp',
        added: 'только что',
        order: 17,
        category: 'comedy',
        description: 'Двадцать три секунды рекламного ролика, у которого кто-то заменил субтитры. Мужчина на залитой солнцем улице делает странные движения, герой в кожаной куртке уверенно смотрит в камеру, а белые подписи под кадром превращают каждую фразу в совсем другое предложение.\nМонтаж собран из шести планов: улица, крупный план, офис с синим монитором, окна с граффити, неоновый город и финальный взгляд.\nСубтитры нарочно перевраны. Громкость — на ваше усмотрение.',
        tags: ['keanu reeves', 'киану ривз', 'ytp', 'мем', 'субтитры', 'cyberpunk', 'киберпанк', 'джонни', 'нарезка', 'memes'],
        views: 276410,
        rating: 4.5,
        ratings: 6120,
        favorited: 2740,
        honors: 11,
        links: 126,
        chapters: [
          [0, 'Улица'],
          [4, 'Крупный план'],
          [7, 'Офис'],
          [10, 'Окна с граффити'],
          [12, 'Неоновый город'],
          [15, 'Взгляд в камеру'],
          [21, 'Финальная подпись']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'Субтитры на 0:05 — лучшее, что я видел за этот месяц.' },
          { user: 'zakladka98', when: '2 минуты назад', text: 'Он так серьёзно смотрит в камеру, что хочется верить каждой подписи.' },
          { user: 'nopenopenope', when: '3 минуты назад', text: 'Смотрел без звука, потом со звуком, потом снова без звука.' },
          { user: 'neon_gorod', when: '4 минуты назад', text: 'Неоновый город на 0:12 вообще не при чём, но так даже смешнее.' },
          { user: 'shahta_dvor', when: '5 минут назад', text: 'Белый шрифт на чёрном — классика жанра.' }
        ]
      },
      {
        id: 'Str3yP0dsk0',
        title: 'Стрей Подскочил',
        channel: 'StreyOsuzhdaet',
        added: 'только что',
        order: 18,
        category: 'people',
        description: 'На стриме играет безобидный с виду донатный трек, но на четвёртой секунде до Стрея доходит смысл строчек. Он резко подаётся к монитору, вырубает запись и буквально подпрыгивает в кресле до потолка, после чего выдаёт серию громогласных «Я осуждаю, осуждаю, осуждаю! Такое не буду слушать!» и выносит окончательный вердикт: «Максимально не одобряю».',
        tags: ['стрей', 'stray', 'подскочил', 'подпрыгнул', 'осуждает', 'осуждаю', 'донат', 'стрим', 'стример', 'реакция', 'усатый', 'кресло'],
        views: 81450,
        rating: 5,
        ratings: 2180,
        favorited: 890,
        honors: 6,
        links: 48,
        chapters: [
          [0, 'Тишина перед бурей'],
          [3.5, 'Вслушивается в донат'],
          [4.4, '«Я осуждаю максимально, такой движ!»'],
          [6.7, 'Стрей подскочил с кресла'],
          [9.2, '«Я осуждаю, осуждаю, осуждаю!»'],
          [13.3, '«Такое не буду слушать!»'],
          [19.0, 'Рука у гарнитуры'],
          [21.3, '«Максимально не одобряю»']
        ],
        comments: [
          { user: 'kreslo_kosmonavta', when: '1 минуту назад', text: 'На 0:07 он так взлетел со стула, что у меня на мгновение показалась вся спинка игрового кресла целиком.' },
          { user: 'osuzhdayu_x3', when: '2 минуты назад', text: 'Три «осуждаю» подряд на 0:09 — это тройная страховка канала от любых проверок.' },
          { user: 'donat_snayper', when: '3 минуты назад', text: 'Первые три секунды сидел спокойно, а потом как дошло — спринт до кнопки паузы за долю секунды.' },
          { user: 'usatyi_prygun', when: '4 минуты назад', text: 'Если бы в комнате был низкий потолок, наушники бы точно оставили вмятину в побелке.' },
          { user: 'verdikt_98', when: '5 минут назад', text: 'Финальное «Максимально не одобряю» спокойным голосом после такого прыжка — чистое мастерство.' }
        ]
      },
      {
        id: 'Str3yUltr498',
        title: 'Стрей Ультра Гипер Осуждает',
        channel: 'StreyOsuzhdaet',
        added: 'только что',
        order: 19,
        category: 'people',
        description: 'После дерзкого высказывания на стриме Стрей переходит на новый уровень осуждения: сначала громогласно выдаёт «Осуждаю! Максимальное осуждение!», а через секунду разгоняется до «Осуждаю максимально! Просто сверхосуждение, ультра-гипер!», сопровождая вердикт фирменной мимикой и пристальным взглядом в монитор.',
        tags: ['стрей', 'stray', 'ультра', 'гипер', 'сверхосуждение', 'осуждает', 'осуждаю', 'максимальное', 'стрим', 'стример', 'реакция', 'усатый'],
        views: 94200,
        rating: 5,
        ratings: 2640,
        favorited: 1120,
        honors: 7,
        links: 59,
        chapters: [
          [0, 'Слушает высказывание на стриме'],
          [2.8, 'Набирает воздух для вердикта'],
          [3.5, '«Осуждаю! Максимальное осуждение!»'],
          [6.8, '«За такие высказывания — осуждать»'],
          [9.3, '«Осуждаю максимально!»'],
          [11.5, '«Просто сверхосуждение, ультра-гипер!»'],
          [14.2, 'Контрольный взгляд в монитор']
        ],
        comments: [
          { user: 'sverh_osuzhdenie', when: '1 минуту назад', text: 'Когда обычного «осуждаю» уже недостаточно, в ход идёт ультра-гипер-сверхосуждение.' },
          { user: 'vovapain_98', when: '2 минуты назад', text: 'На 0:10 такая экспрессия и мимика, что монитор сам начал светиться ярче.' },
          { user: 'strahovka_max', when: '3 минуты назад', text: 'Канал защищён от любых проверок на триста лет вперёд после такой комбинации слов.' },
          { user: 'usatyi_verdikt', when: '4 минуты назад', text: 'Сначала максимальное осуждение на 0:04, потом второй залп на 0:09 — двойной щит стримера.' },
          { user: 'chat_osuzhdaet', when: '5 минут назад', text: 'Финальный поворот головы к монитору на 0:14 — проверяет, все ли в чате успели написать ОСУЖДАЮ.' }
        ]
      }
    ];
    this.categories = [
      ['autos', 'Авто и транспорт'],
      ['comedy', 'Комедия'],
      ['entertainment', 'Развлечения'],
      ['film', 'Кино и анимация'],
      ['games', 'Гаджеты и игры'],
      ['howto', 'Хобби'],
      ['music', 'Музыка'],
      ['news', 'Новости и блоги'],
      ['people', 'Люди'],
      ['pets', 'Питомцы и животные'],
      ['sports', 'Спорт'],
      ['travel', 'Путешествия и места']
    ];
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.storeKey) || '{}');
      return Object.assign({ user: '', rated: {}, favorites: [], subs: [], comments: {}, views: {} }, raw);
    } catch (e) {
      return { user: '', rated: {}, favorites: [], subs: [], comments: {}, views: {} };
    }
  }

  saveState(patch) {
    Object.assign(this.state, patch || {});
    try {
      localStorage.setItem(this.storeKey, JSON.stringify(this.state));
    } catch (e) {}
  }

  esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  num(n) {
    return Math.round(n).toLocaleString('ru-RU');
  }

  clipFor(id) {
    return (window.youvidClips || []).find(c => c.id === id || c.video === id) || null;
  }

  video(id) {
    return this.videos.find(v => v.id === id) || null;
  }

  duration(v) {
    const clip = this.clipFor(v.id);
    return clip ? clip.duration : 0;
  }

  views(v) {
    return v.views + (this.state.views[v.id] || 0);
  }

  countView(id) {
    const views = Object.assign({}, this.state.views);
    views[id] = (views[id] || 0) + 1;
    this.saveState({ views });
  }

  thumbs(v) {
    return [1, 2, 3].map(i => `content/YouVid/thumbs/${v.id}-${i}.png`);
  }

  avatar(ch) {
    return ch.avatarFile || `content/YouVid/avatars/${ch.user}.png`;
  }

  banner(ch) {
    return ch.bannerFile || `content/YouVid/banners/${ch.user}.png`;
  }

  pageTitle(url) {
    const r = this.route(url);
    if (r.page === 'watch') {
      const v = this.video(r.params.v);
      if (v) return `YouVid - ${v.title}`;
    }
    if (r.page === 'user') {
      const key = Object.keys(this.channels).find(k => k.toLowerCase() === String(r.user).toLowerCase());
      if (key) return `YouVid - Канал ${this.channels[key].name}`;
    }
    const titles = { browse: r.params.c ? `Категория: ${this.categoryName(r.params.c)}` : 'Видео', channels: 'Каналы', categories: 'Категории', results: `Результаты поиска: ${r.params.search_query || ''}`, login: 'Вход', subscriptions: 'Мои подписки', favorites: 'Избранное', missing: 'Страница не найдена' };
    return titles[r.page] ? `YouVid - ${titles[r.page]}` : 'YouVid - Покажи себя';
  }

  route(url) {
    const raw = String(url || this.baseUrl);
    const m = raw.match(/^[a-z]+:\/\/[^/]+(\/[^?#]*)?(\?[^#]*)?/i);
    const pathName = ((m && m[1]) || '/').replace(/\/+$/, '') || '/';
    const params = {};
    ((m && m[2]) || '').replace(/^\?/, '').split('&').filter(Boolean).forEach(pair => {
      const [k, v] = pair.split('=');
      try {
        params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v || '';
      }
    });
    const user = pathName.match(/^\/user\/([^/]+)/i);
    if (user) return { page: 'user', user: user[1], params };
    const known = { '/': 'home', '/watch': 'watch', '/browse': 'browse', '/channels': 'channels', '/categories': 'categories', '/results': 'results', '/login': 'login', '/signup': 'login', '/subscriptions': 'subscriptions', '/favorites': 'favorites' };
    return { page: known[pathName.toLowerCase()] || 'missing', params, pathName };
  }

  renderSite(url) {
    this.lastUrl = url;
    this.state = this.loadState();
    const r = this.route(url);
    let body = '';
    let tab = '';
    if (r.page === 'home') { body = this.renderHome(); tab = 'home'; }
    else if (r.page === 'watch') { body = this.renderWatch(r.params.v); tab = 'videos'; }
    else if (r.page === 'user') { body = this.renderUser(r.user); tab = 'channels'; }
    else if (r.page === 'browse') { body = this.renderBrowse(r.params.s || 'mr', r.params.c); tab = 'videos'; }
    else if (r.page === 'channels') { body = this.renderChannels(); tab = 'channels'; }
    else if (r.page === 'categories') { body = this.renderCategories(); tab = 'categories'; }
    else if (r.page === 'results') { body = this.renderResults(r.params.search_query || ''); tab = 'videos'; }
    else if (r.page === 'login') { body = this.renderLogin(r.params.next || ''); }
    else if (r.page === 'subscriptions') { body = this.renderSubscriptions(); }
    else if (r.page === 'favorites') { body = this.renderFavorites(); }
    else body = this.renderMissing();
    const q = r.page === 'results' ? r.params.search_query || '' : '';
    return `
      <div class="yv-root">
        <div class="yv-page">
          ${this.renderHeader(tab, q, r)}
          <div class="yv-body">${body}</div>
          ${this.renderFooter()}
        </div>
      </div>`;
  }

  subnav(tab, r) {
    const b = this.baseUrl;
    const sorts = [['mr', 'Новые'], ['mp', 'Популярные'], ['tr', 'С высшим рейтингом'], ['md', 'Обсуждаемые'], ['tf', 'Любимые']];
    let items;
    if (tab === 'videos') {
      const cur = r.page === 'browse' && !r.params.c ? (r.params.s || 'mr') : '';
      items = sorts.map(([s, label]) => [label, `${b}/browse?s=${s}`, s === cur]);
    } else if (tab === 'channels') items = [['Все каналы', `${b}/channels`, r.page === 'channels'], ['Мои подписки', `${b}/subscriptions`, r.page === 'subscriptions']];
    else if (tab === 'categories') items = [['Все категории', `${b}/categories`, !r.params.c]].concat(r.params.c ? [[this.categoryName(r.params.c), '', true]] : []);
    else items = sorts.slice(0, 3).map(([s, label]) => [label, `${b}/browse?s=${s}`, false]);
    return items.map(([label, url, on]) => on ? `<b>${this.esc(label)}</b>` : `<a data-url="${url}">${this.esc(label)}</a>`).join('<span class="yv-sep">|</span>');
  }

  renderHeader(tab, q, r) {
    const u = this.state.user;
    const account = u
      ? `Привет, <b>${this.esc(u)}</b> | <a data-url="${this.baseUrl}/subscriptions">Мои подписки</a> | <a data-url="${this.baseUrl}/favorites">Избранное</a> | <a href="#" class="yv-logout">Выйти</a>`
      : `<a data-url="${this.baseUrl}/signup"><b>Регистрация</b></a> | <a data-url="${this.baseUrl}/login">Вход</a>`;
    const tabs = [['home', 'Главная', '/'], ['videos', 'Видео', '/browse'], ['channels', 'Каналы', '/channels'], ['categories', 'Категории', '/categories']];
    if (r && r.page === 'browse' && r.params.c) tab = 'categories';
    return `
      <div class="yv-top">
        <a class="yv-logo" data-url="${this.baseUrl}" aria-label="YouVid, на главную"><span class="yv-logo-you">You</span><span class="yv-logo-vid">Vid</span><span class="yv-logo-tm">™</span></a>
        <span class="yv-slogan">Покажи себя</span>
        <div class="yv-account">${account}</div>
        <form class="yv-search" role="search">
          <label class="yv-search-label" for="yv-q">Поиск</label>
          <input id="yv-q" class="yv-q" type="text" value="${this.esc(q)}" maxlength="80">
          <button type="submit" class="yv-btn">Искать</button>
        </form>
      </div>
      <div class="yv-tabs" role="navigation">
        ${tabs.map(([id, label, href]) => `<a class="yv-tab${tab === id ? ' yv-tab-on' : ''}" data-url="${this.baseUrl}${href}">${label}</a>`).join('')}
      </div>
      <div class="yv-subnav">${this.subnav(tab, r || { page: 'home', params: {} })}</div>`;
  }

  renderFooter() {
    return `
      <div class="yv-foot">
        <div><a data-url="${this.baseUrl}">Главная</a> | <a data-url="${this.baseUrl}/browse">Видео</a> | <a data-url="${this.baseUrl}/channels">Каналы</a> | <a data-url="${this.baseUrl}/categories">Категории</a></div>
        <div class="yv-copy">© 1999 YouVid, Inc. · <a href="mailto:feedback@youvid.com">feedback@youvid.com</a></div>
      </div>`;
  }

  stars(rating, cls) {
    let out = '';
    for (let i = 1; i <= 5; i++) {
      const k = rating >= i ? 'full' : rating >= i - 0.5 ? 'half' : 'empty';
      out += `<span class="yv-star yv-star-${k}"></span>`;
    }
    return `<span class="yv-stars ${cls || ''}" role="img" aria-label="Рейтинг ${rating.toFixed(1)} из 5">${out}</span>`;
  }

  gif(name) {
    return window.webGif ? window.webGif(name) : '';
  }

  starKind(avg, i) {
    return avg >= i - 0.25 ? 'yv-star-full' : avg >= i - 0.75 ? 'yv-star-half' : 'yv-star-empty';
  }

  rating(v) {
    const mine = this.state.rated[v.id];
    if (!mine) return { avg: v.rating, count: v.ratings };
    const count = v.ratings + 1;
    return { avg: (v.rating * v.ratings + mine) / count, count };
  }

  commentsOf(v) {
    return (this.state.comments[v.id] || []).concat(v.comments);
  }

  thumb(v, big) {
    const t = this.thumbs(v);
    const d = YouVidPlayer.fmt(this.duration(v));
    return `<a class="yv-thumb${big ? ' yv-thumb-big' : ''}" data-url="${this.baseUrl}/watch?v=${v.id}" data-thumbs="${t.join('|')}" aria-label="${this.esc(v.title)}, ${d}"><img src="${encodeURI(t[1])}" alt=""></a>`;
  }

  endThumb(v) {
    const t = this.thumbs(v);
    const d = YouVidPlayer.fmt(this.duration(v));
    const title = this.esc(v.title);
    return `<a class="yv-thumb yv-end-item" data-url="${this.baseUrl}/watch?v=${v.id}" data-thumbs="${t.join('|')}" data-title="${title}" title="${title}" aria-label="${title}, ${d}"><img src="${encodeURI(t[1])}" alt=""><span class="yv-end-item-len">${d}</span><span class="yv-end-item-title">${title}</span></a>`;
  }

  videoRow(v, withDesc) {
    const ch = this.channels[v.channel];
    const r = this.rating(v);
    return `
      <div class="yv-row">
        ${this.thumb(v)}
        <div class="yv-row-info">
          <a class="yv-title" data-url="${this.baseUrl}/watch?v=${v.id}">${this.esc(v.title)}</a>
          <div class="yv-len">${YouVidPlayer.fmt(this.duration(v))}</div>
          ${withDesc ? `<div class="yv-desc">${this.esc(v.description.split('\n')[0])}</div>` : ''}
          <div class="yv-meta">Теги: ${v.tags.map(t => `<a data-url="${this.baseUrl}/results?search_query=${encodeURIComponent(t)}">${this.esc(t)}</a>`).join(' ')}</div>
          <div class="yv-meta">Добавлено: ${this.esc(v.added)} &nbsp; Категория: <a data-url="${this.baseUrl}/browse?c=${v.category}">${this.esc(this.categoryName(v.category))}</a></div>
          <div class="yv-meta">От: <a data-url="${this.baseUrl}/user/${ch.user}">${this.esc(ch.name)}</a></div>
          <div class="yv-meta">Просмотров: ${this.num(this.views(v))}</div>
          <div class="yv-meta">${this.stars(r.avg)}</div>
          <div class="yv-meta">${this.num(r.count)} оценок</div>
        </div>
      </div>`;
  }

  categoryName(id) {
    const c = this.categories.find(x => x[0] === id);
    return c ? c[1] : id;
  }

  box(title, inner, extra) {
    return `<div class="yv-box ${extra || ''}"><div class="yv-box-head">${title}</div><div class="yv-box-body">${inner}</div></div>`;
  }

  loginBox() {
    if (this.state.user) {
      return this.box('Ваш аккаунт', `<p>Вы вошли как <b>${this.esc(this.state.user)}</b>.</p><p><a data-url="${this.baseUrl}/subscriptions">Мои подписки</a> (${this.state.subs.length})<br><a data-url="${this.baseUrl}/favorites">Избранное</a> (${this.state.favorites.length})</p>`);
    }
    return this.box('Вход для участников', this.loginForm(''), 'yv-login-box');
  }

  loginForm(next) {
    return `
      <form class="yv-login" data-next="${this.esc(next)}">
        <label class="yv-login-row"><span>Имя:</span><input type="text" class="yv-login-user" maxlength="20" autocomplete="off"></label>
        <label class="yv-login-row"><span>Пароль:</span><input type="password" class="yv-login-pass" maxlength="20"></label>
        <div class="yv-login-row"><span></span><button type="submit" class="yv-btn">Войти</button></div>
        <div class="yv-login-err" role="alert" hidden></div>
        <div class="yv-note">Нового имени ещё нет в базе? Аккаунт создастся при входе.</div>
      </form>`;
  }

  renderHome() {
    const list = this.videos.slice().sort((a, b) => b.order - a.order).slice(0, 6);
    const channels = Object.values(this.channels).map(ch => `
      <div class="yv-ch-mini">
        <a data-url="${this.baseUrl}/user/${ch.user}"><img class="yv-ava-s" src="${this.avatar(ch)}" alt=""></a>
        <div><a data-url="${this.baseUrl}/user/${ch.user}"><b>${this.esc(ch.name)}</b></a><br>${this.videosOf(ch).length} видео | ${this.subsLabel(ch)}</div>
      </div>`).join('');
    const intro = `
      <dl class="yv-intro">
        <dt><a data-url="${this.baseUrl}/browse">Смотрите</a></dt><dd>Тысячи роликов, которые снимают люди со всего мира, прямо в браузере.</dd>
        <dt><a data-url="${this.baseUrl}/channels">Находите</a></dt><dd>Подписывайтесь на каналы и не пропускайте новые видео.</dd>
        <dt><a data-url="${this.baseUrl}/categories">Делитесь</a></dt><dd>Отправляйте ссылки друзьям и вставляйте плеер на свои страницы.</dd>
      </dl>`;
    return `
      <div class="yv-cols">
        <div class="yv-main">
          ${this.box(`Избранное видео <a class="yv-box-more" data-url="${this.baseUrl}/browse">Все видео</a>`, list.map(v => this.videoRow(v, true)).join('') + `<div class="yv-box-foot"><a data-url="${this.baseUrl}/browse">Все видео</a></div>`, 'yv-box-grey')}
        </div>
        <div class="yv-side">
          ${this.box('Покажи себя на YouVid', intro)}
          ${this.loginBox()}
          ${this.box('Что нового', `<p><b>Видео в 3D.</b> Плеер YouVid рисует картинку на вашем 3D-ускорителе, а звук идёт из оригинальной записи.</p><p><b>Каналы авторов.</b> У каждого автора своя страница с подписчиками и комментариями.</p>`)}
          ${this.box('Активные каналы', channels)}
        </div>
      </div>`;
  }

  videosOf(ch) {
    return this.videos.filter(v => v.channel === ch.user).sort((a, b) => b.order - a.order);
  }

  subsCount(ch) {
    return `<span class="yv-subs" data-channel="${ch.user}">${this.num(ch.subs + (this.state.subs.includes(ch.user) ? 1 : 0))}</span>`;
  }

  subsLabel(ch) {
    return `${this.subsCount(ch)} подписчиков`;
  }

  subscribeButton(ch) {
    const on = this.state.subs.includes(ch.user);
    return `<button type="button" class="yv-sub${on ? ' yv-sub-on' : ''}" data-channel="${ch.user}" data-name="${this.esc(ch.name)}">${on ? 'Отписаться' : '+ Подписаться'}</button>`;
  }

  renderWatch(id) {
    const v = this.video(id);
    if (!v) {
      return `<div class="yv-missing"><h1>Видео не найдено</h1><p>Такого видео нет или автор его удалил. Посмотрите <a data-url="${this.baseUrl}/browse">другие видео</a>.</p></div>`;
    }
    const ch = this.channels[v.channel];
    const clip = this.clipFor(v.id);
    const aspect = clip && clip.aspect ? clip.aspect : 4 / 3;
    const ch_ = Math.round(480 / aspect);
    const r = this.rating(v);
    const mine = this.state.rated[v.id] || 0;
    const fav = this.state.favorites.includes(v.id);
    const loopOn = Boolean(this.state.loop);
    const loopLabel = loopOn ? 'Выключить повтор' : 'Повторять видео';
    const url = `${this.baseUrl}/watch?v=${v.id}`;
    const embed = `<object width="425" height="350"><param name="movie" value="${this.baseUrl}/v/${v.id}"></object>`;
    const related = this.videos.filter(x => x.id !== v.id);
    const comments = this.commentsOf(v);
    const others = related.slice(0, 4).map(x => this.endThumb(x)).join('');
    return `
      <h1 class="yv-h1">${this.esc(v.title)}</h1>
      <div class="yv-cols">
        <div class="yv-main yv-watch-main">
          <div class="yv-player" data-video="${v.id}">
            <div class="yv-screen" tabindex="0" aria-label="Видео ${this.esc(v.title)}. Пробел: смотреть или пауза, стрелки: перемотка на 5 секунд">
              <canvas class="yv-canvas" width="480" height="${ch_}" style="top:${(((360 - ch_) / 2 / 360) * 100).toFixed(3)}%"></canvas>
              <button type="button" class="yv-big" aria-label="Смотреть"><span class="yv-big-tri"></span></button>
              <div class="yv-end" hidden>
                ${others ? `<div class="yv-end-more"><div class="yv-end-title">Другие видео</div><div class="yv-end-grid">${others}</div></div>` : ''}
                <button type="button" class="yv-btn yv-replay"><span class="yv-replay-ico" aria-hidden="true">&#8635;</span> Повторить видео</button>
              </div>
              <div class="yv-msg" role="status" hidden></div>
              <audio class="yv-audio" preload="auto" src="${clip ? encodeURI(clip.audio) : ''}"></audio>
            </div>
            <div class="yv-bar">
              <div class="yv-seek" tabindex="0" role="slider" aria-label="Перемотка" aria-valuemin="0" aria-valuemax="${Math.round(this.duration(v))}" aria-valuenow="0">
                <span class="yv-buffered"></span><span class="yv-played"></span>${this.chapterTicks(v)}<span class="yv-knob"></span>
              </div>
              <div class="yv-bar-row">
                <button type="button" class="yv-pp" aria-label="Смотреть"></button>
                <button type="button" class="yv-stop" aria-label="Стоп"></button>
                <span class="yv-time"><span class="yv-cur">00:00</span> / <b>${YouVidPlayer.fmt(this.duration(v))}</b></span>
                <span class="yv-bar-gap"></span>
                <button type="button" class="yv-loop${loopOn ? ' yv-loop-on' : ''}" aria-label="${loopLabel}" aria-pressed="${loopOn ? 'true' : 'false'}" title="${loopLabel}"><svg class="yv-loop-ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 8V5c0-1.1.9-2 2-2h7V1l4 3-4 3V5H4v3H2zm12 0v3c0 1.1-.9 2-2 2H5v2l-4-3 4-3v2h7V8h2z"/></svg></button>
                <button type="button" class="yv-mute" aria-label="Выключить звук">${this.gif('speaker')}</button>
                <span class="yv-vol">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<button type="button" class="yv-bar-step" style="height:${2 + i}px" aria-label="Громкость ${i} из 10"></button>`).join('')}</span>
                <span class="yv-size-label">Размер:</span>
                <button type="button" class="yv-size-normal" aria-label="Обычный размер"></button>
                <button type="button" class="yv-size-full" aria-label="На весь экран"></button>
              </div>
            </div>
          </div>
          <div class="yv-under">
            <div class="yv-rate">
              <div class="yv-rate-label">${mine ? `Ваша оценка: ${mine} из 5` : 'Оцените видео:'}</div>
              <div class="yv-rate-stars" data-video="${v.id}" role="group" aria-label="Оценка, средняя ${r.avg.toFixed(1)} из 5">
                ${[1, 2, 3, 4, 5].map(i => `<button type="button" class="yv-rate-btn" data-rate="${i}" aria-label="Поставить ${i} из 5"><span class="yv-star ${mine ? (i <= mine ? 'yv-star-full' : 'yv-star-empty') : this.starKind(r.avg, i)}"></span></button>`).join('')}
              </div>
              <div class="yv-rate-total">${this.num(r.count)} оценок</div>
              <div class="yv-rate-hint" role="status">${this.state.user ? '' : `<a data-url="${this.baseUrl}/login?next=${encodeURIComponent(url)}">Войдите</a>, чтобы оценить видео.`}</div>
            </div>
            <div class="yv-actions">
              <button type="button" class="yv-link-btn yv-fav" data-video="${v.id}">${this.gif('folder')}<span>${fav ? 'Убрать из избранного' : 'В избранное'}</span></button>
              <button type="button" class="yv-link-btn yv-share">${this.gif('mail')}<span>Поделиться</span></button>
              <button type="button" class="yv-link-btn yv-flag">${this.gif('warn')}<span>Пожаловаться</span></button>
              <div class="yv-action-note" role="status"></div>
            </div>
            <dl class="yv-stats">
              <dt>Просмотров:</dt><dd>${this.num(this.views(v))}</dd>
              <dt>Комментариев:</dt><dd>${this.num(comments.length)}</dd>
              <dt>В избранном:</dt><dd>${this.num(v.favorited + (fav ? 1 : 0))}</dd>
              <dt>Награды:</dt><dd>${this.num(v.honors)}</dd>
              <dt>Ссылок на видео:</dt><dd>${this.num(v.links)}</dd>
            </dl>
          </div>
          ${this.renderComments(v, comments)}
        </div>
        <div class="yv-side">
          ${this.box('Об этом видео', `
            <div class="yv-about-date">Добавлено: <b>${this.esc(v.added)}</b></div>
            <div class="yv-about-top">
              <div>От: <a data-url="${this.baseUrl}/user/${ch.user}"><b>${this.esc(ch.name)}</b></a></div>
              <div class="yv-sub-wrap">${this.subscribeButton(ch)}<div class="yv-sub-to">${this.state.subs.includes(ch.user) ? 'от' : 'на'} ${this.esc(ch.name)}</div></div>
            </div>
            <p class="yv-about-desc">${this.esc(v.description).replace(/\n/g, '<br>')}</p>
            ${this.renderChapters(v)}
            <div>Категория: <a data-url="${this.baseUrl}/browse?c=${v.category}">${this.esc(this.categoryName(v.category))}</a></div>
            <div>Теги: ${v.tags.map(t => `<a data-url="${this.baseUrl}/results?search_query=${encodeURIComponent(t)}">${this.esc(t)}</a>`).join(' ')}</div>
            <label class="yv-field"><span>URL</span><input type="text" class="yv-url" readonly value="${this.esc(url)}"></label>
            <label class="yv-field"><span>Код</span><input type="text" class="yv-embed" readonly value="${this.esc(embed)}"></label>`, 'yv-box-round')}
          ${this.box('Ещё видео', `
            <div class="yv-more-tabs"><b>Похожие</b> | <a data-url="${this.baseUrl}/user/${ch.user}">Видео канала ${this.esc(ch.name)}</a></div>
            <div class="yv-more-count">Показано ${related.length + 1} из ${this.videos.length}</div>
            ${[v].concat(related).map(x => `
              <div class="yv-mini${x.id === v.id ? ' yv-mini-now' : ''}">
                ${this.thumb(x)}
                <div><a class="yv-mini-title" data-url="${this.baseUrl}/watch?v=${x.id}">${this.esc(x.title)}</a><br><b>${YouVidPlayer.fmt(this.duration(x))}</b><br><span class="yv-label">От:</span> <a data-url="${this.baseUrl}/user/${x.channel}">${this.esc(this.channels[x.channel].name)}</a><br><span class="yv-label">Просмотров:</span> ${this.num(this.views(x))}${x.id === v.id ? '<br><b>&laquo; Сейчас идёт</b>' : ''}</div>
              </div>`).join('')}`)}
        </div>
      </div>`;
  }

  chapterTicks(v) {
    const total = this.duration(v);
    if (!v.chapters || !total) return '';
    return v.chapters.slice(1).map(([t]) => `<span class="yv-tick" style="left:${((t / total) * 100).toFixed(2)}%"></span>`).join('');
  }

  renderChapters(v) {
    if (!v.chapters || !v.chapters.length) return '';
    return `
            <div class="yv-chapters">
              <div class="yv-chapters-head">Содержание <span class="yv-chapters-count">(${v.chapters.length})</span></div>
              <ol class="yv-chap-list">
                ${v.chapters.map(([t, title], i) => `<li><button type="button" class="yv-chap" data-t="${t}" data-i="${i}"><span class="yv-chap-time">${YouVidPlayer.fmt(t)}</span><span class="yv-chap-title">${this.esc(title)}</span></button></li>`).join('')}
              </ol>
            </div>`;
  }

  renderComments(v, comments) {
    const form = this.state.user
      ? `<form class="yv-comment-form" data-video="${v.id}">
          <label for="yv-comment-text">Ваш комментарий (${this.esc(this.state.user)}):</label>
          <textarea id="yv-comment-text" class="yv-comment-text" rows="3" maxlength="500"></textarea>
          <button type="submit" class="yv-btn">Отправить комментарий</button>
          <span class="yv-comment-err" role="alert"></span>
        </form>`
      : `<p class="yv-note"><a data-url="${this.baseUrl}/login?next=${encodeURIComponent(`${this.baseUrl}/watch?v=${v.id}`)}">Войдите</a> или <a data-url="${this.baseUrl}/signup">зарегистрируйтесь</a>, чтобы оставить комментарий.</p>`;
    const list = comments.map(c => `
      <div class="yv-comment">
        <div class="yv-comment-head"><a data-url="${this.baseUrl}/results?search_query=${encodeURIComponent(c.user)}">${this.esc(c.user)}</a> (${this.esc(c.when)})</div>
        <div>${this.esc(c.text)}</div>
      </div>`).join('');
    return this.box(`Комментарии (${this.num(comments.length)})`, form + list, 'yv-comments');
  }

  renderUser(user) {
    const key = Object.keys(this.channels).find(k => k.toLowerCase() === String(user).toLowerCase());
    const ch = key && this.channels[key];
    if (!ch) return `<div class="yv-missing"><h1>Канал не найден</h1><p>Пользователя «${this.esc(user)}» нет на YouVid. <a data-url="${this.baseUrl}/channels">Все каналы</a>.</p></div>`;
    const vids = this.videosOf(ch);
    const channelViews = vids.reduce((a, v) => a + this.views(v), 0);
    return `
      <div class="yv-channel yv-theme-${ch.theme}">
        <div class="yv-banner"><img src="${this.banner(ch)}" alt=""></div>
        <div class="yv-channel-title">Канал ${this.esc(ch.name)}</div>
        <div class="yv-cols">
          <div class="yv-side yv-side-left">
            ${this.box('Профиль', `
              <img class="yv-ava" src="${this.avatar(ch)}" alt="${this.esc(ch.name)}">
              ${this.subscribeButton(ch)}
              <dl class="yv-profile">
                <dt>Имя:</dt><dd>${this.esc(ch.name)}</dd>
                <dt>Канал:</dt><dd>@${this.esc(ch.user)}</dd>
                <dt>На сайте с:</dt><dd>${this.esc(ch.joined)}</dd>
                <dt>Был на сайте:</dt><dd>${this.esc(ch.lastSeen)}</dd>
                <dt>Просмотров:</dt><dd>${this.num(channelViews)}</dd>
                <dt>Подписчиков:</dt><dd>${this.subsCount(ch)}</dd>
                <dt>Страна:</dt><dd>${this.esc(ch.country)}</dd>
                ${ch.site ? `<dt>Сайт:</dt><dd>${this.esc(ch.site)}</dd>` : ''}
              </dl>
              ${ch.about ? `<p class="yv-about-me">${this.esc(ch.about)}</p>` : ''}`)}
          </div>
          <div class="yv-main">
            ${this.box(`Видео (${vids.length})`, vids.map(v => this.videoRow(v, true)).join('') || '<p>Автор ещё не загрузил видео.</p>')}
          </div>
        </div>
      </div>`;
  }

  sorted(s) {
    const list = this.videos.slice();
    const by = {
      mr: (a, b) => b.order - a.order,
      mp: (a, b) => this.views(b) - this.views(a),
      tr: (a, b) => this.rating(b).avg - this.rating(a).avg,
      md: (a, b) => this.commentsOf(b).length - this.commentsOf(a).length,
      tf: (a, b) => b.favorited - a.favorited
    };
    return list.sort(by[s] || by.mr);
  }

  renderBrowse(s, c) {
    const titles = { mr: 'Новые видео', mp: 'Популярные видео', tr: 'С высшим рейтингом', md: 'Обсуждаемые', tf: 'Любимые' };
    let list = this.sorted(s);
    let title = titles[s] || titles.mr;
    if (c) {
      list = list.filter(v => v.category === c);
      title = `Категория: ${this.categoryName(c)}`;
    }
    const grid = list.map(v => {
      const r = this.rating(v);
      return `
        <div class="yv-cell">
          ${this.thumb(v)}
          <a class="yv-title" data-url="${this.baseUrl}/watch?v=${v.id}">${this.esc(v.title)}</a>
          <div class="yv-meta">${YouVidPlayer.fmt(this.duration(v))}</div>
          <div class="yv-meta">От: <a data-url="${this.baseUrl}/user/${v.channel}">${this.esc(this.channels[v.channel].name)}</a></div>
          <div class="yv-meta">Просмотров: ${this.num(this.views(v))}</div>
          ${this.stars(r.avg, 'yv-stars-small')}
        </div>`;
    }).join('');
    const empty = `<p class="yv-empty">В этой категории пока нет видео. Загляните в <a data-url="${this.baseUrl}/categories">другие категории</a>.</p>`;
    return this.box(title, list.length ? `<div class="yv-grid">${grid}</div>` : empty);
  }

  renderChannels() {
    const rows = Object.values(this.channels).sort((a, b) => b.subs - a.subs).map(ch => `
      <div class="yv-ch-row">
        <a data-url="${this.baseUrl}/user/${ch.user}"><img class="yv-ava" src="${this.avatar(ch)}" alt=""></a>
        <div>
          <a class="yv-title" data-url="${this.baseUrl}/user/${ch.user}">${this.esc(ch.name)}</a>
          <div class="yv-meta">${this.subsLabel(ch)} | Видео: ${this.videosOf(ch).length}</div>
          ${ch.about ? `<div class="yv-meta">${this.esc(ch.about)}</div>` : ''}
        </div>
        ${this.subscribeButton(ch)}
      </div>`).join('');
    return this.box('Каналы', rows);
  }

  renderCategories() {
    const rows = this.categories.map(([id, name]) => {
      const n = this.videos.filter(v => v.category === id).length;
      return `<li><a data-url="${this.baseUrl}/browse?c=${id}">${this.esc(name)}</a> <span class="yv-count">(${n})</span></li>`;
    }).join('');
    return this.box('Категории', `<ul class="yv-cats">${rows}</ul>`);
  }

  search(q) {
    const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return this.videos.filter(v => {
      const ch = this.channels[v.channel];
      const hay = [v.title, v.description, v.tags.join(' '), ch.name, ch.user, this.categoryName(v.category)].join(' ').toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }

  renderResults(q) {
    const found = this.search(q);
    const head = `Результаты поиска «${this.esc(q)}»`;
    if (!q.trim()) return this.box('Поиск', '<p class="yv-empty">Введите слово в поле поиска вверху страницы: название видео, тег или имя автора.</p>');
    if (!found.length) return this.box(head, `<p class="yv-empty">Ничего не найдено. Попробуйте другое слово или посмотрите <a data-url="${this.baseUrl}/browse">все видео</a>.</p>`);
    return this.box(`${head}: ${found.length}`, found.map(v => this.videoRow(v, true)).join(''));
  }

  renderLogin(next) {
    if (this.state.user) return this.box('Вход', `<p>Вы уже вошли как <b>${this.esc(this.state.user)}</b>. <a data-url="${this.baseUrl}">На главную</a></p>`);
    return `<div class="yv-login-page">${this.box('Вход и регистрация', this.loginForm(next))}</div>`;
  }

  renderSubscriptions() {
    if (!this.state.user) return this.box('Мои подписки', `<p class="yv-empty"><a data-url="${this.baseUrl}/login?next=${encodeURIComponent(this.baseUrl + '/subscriptions')}">Войдите</a>, чтобы видеть подписки.</p>`);
    const list = this.state.subs.map(u => this.channels[u]).filter(Boolean);
    if (!list.length) return this.box('Мои подписки', `<p class="yv-empty">Вы ещё ни на кого не подписаны. Откройте <a data-url="${this.baseUrl}/channels">каналы</a> и нажмите «Подписаться».</p>`);
    const vids = this.videos.filter(v => this.state.subs.includes(v.channel));
    return this.box('Мои подписки', `<p>${list.map(ch => `<a data-url="${this.baseUrl}/user/${ch.user}"><b>${this.esc(ch.name)}</b></a>`).join(', ')}</p>${vids.map(v => this.videoRow(v, false)).join('')}`);
  }

  renderFavorites() {
    if (!this.state.user) return this.box('Избранное', `<p class="yv-empty"><a data-url="${this.baseUrl}/login?next=${encodeURIComponent(this.baseUrl + '/favorites')}">Войдите</a>, чтобы видеть избранное.</p>`);
    const vids = this.state.favorites.map(id => this.video(id)).filter(Boolean);
    if (!vids.length) return this.box('Избранное', '<p class="yv-empty">Здесь пока пусто. Под плеером есть кнопка «В избранное».</p>');
    return this.box('Избранное', vids.map(v => this.videoRow(v, false)).join(''));
  }

  renderMissing() {
    return `<div class="yv-missing"><h1>Страница не найдена</h1><p>Проверьте адрес или начните с <a data-url="${this.baseUrl}">главной страницы</a>.</p></div>`;
  }

  go(win, url) {
    if (window.appIE && win) window.appIE.navigate(win, url);
  }

  requireLogin(win, next) {
    this.go(win, `${this.baseUrl}/login?next=${encodeURIComponent(next)}`);
  }

  attachEvents(win, container) {
    if (this.player) this.player.destroy();
    this.player = null;
    const root = container.querySelector('.yv-root');
    if (!root) return;
    const here = this.lastUrl || this.baseUrl;
    const search = root.querySelector('.yv-search');
    search.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = root.querySelector('.yv-q').value.trim();
      this.go(win, `${this.baseUrl}/results?search_query=${encodeURIComponent(q)}`);
    });
    const logout = root.querySelector('.yv-logout');
    if (logout) logout.addEventListener('click', (e) => {
      e.preventDefault();
      this.saveState({ user: '' });
      this.go(win, here);
    });
    root.querySelectorAll('.yv-login').forEach(form => form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('.yv-login-user').value.trim();
      const err = form.querySelector('.yv-login-err');
      if (!/^[A-Za-z0-9_Ѐ-ӿ]{3,20}$/.test(name)) {
        err.hidden = false;
        err.textContent = 'Имя пользователя: от 3 до 20 букв, цифр или знаков подчёркивания.';
        return;
      }
      if (!form.querySelector('.yv-login-pass').value) {
        err.hidden = false;
        err.textContent = 'Введите пароль.';
        return;
      }
      this.saveState({ user: name });
      this.go(win, form.dataset.next || (this.route(here).page === 'login' ? this.baseUrl : here));
    }));
    root.querySelectorAll('.yv-sub').forEach(btn => btn.addEventListener('click', () => {
      if (!this.state.user) {
        this.requireLogin(win, here);
        return;
      }
      const id = btn.dataset.channel;
      const on = !this.state.subs.includes(id);
      this.saveState({ subs: on ? this.state.subs.concat([id]) : this.state.subs.filter(x => x !== id) });
      const ch = this.channels[id];
      root.querySelectorAll(`.yv-sub[data-channel="${id}"]`).forEach(b => {
        b.classList.toggle('yv-sub-on', on);
        b.textContent = on ? 'Отписаться' : '+ Подписаться';
        const to = b.parentElement.querySelector('.yv-sub-to');
        if (to) to.textContent = `${on ? 'от' : 'на'} ${ch.name}`;
      });
      root.querySelectorAll(`.yv-subs[data-channel="${id}"]`).forEach(el => { el.textContent = this.num(ch.subs + (on ? 1 : 0)); });
    }));
    root.querySelectorAll('.yv-thumb[data-thumbs]').forEach(a => {
      const list = a.dataset.thumbs.split('|');
      const img = a.querySelector('img');
      let timer = 0;
      a.addEventListener('mouseenter', () => {
        let i = 0;
        clearInterval(timer);
        timer = setInterval(() => {
          i = (i + 1) % list.length;
          img.src = encodeURI(list[i]);
        }, 650);
      });
      a.addEventListener('mouseleave', () => {
        clearInterval(timer);
        img.src = encodeURI(list[1]);
      });
    });
    this.attachWatch(win, root, here);
  }

  attachWatch(win, root, here) {
    const playerEl = root.querySelector('.yv-player');
    if (!playerEl) return;
    const v = this.video(playerEl.dataset.video);
    const clip = this.clipFor(v.id);
    if (clip) {
      this.player = new YouVidPlayer(playerEl, clip, v, this);
      this.player.start(true);
    }
    const showAvg = () => {
      const mine = this.state.rated[v.id];
      if (mine) {
        this.paintRate(root, mine);
        return;
      }
      const r = this.rating(v);
      root.querySelectorAll('.yv-rate-btn .yv-star').forEach((st, i) => { st.className = `yv-star ${this.starKind(r.avg, i + 1)}`; });
    };
    root.querySelectorAll('.yv-rate-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => this.paintRate(root, +btn.dataset.rate));
      btn.addEventListener('focus', () => this.paintRate(root, +btn.dataset.rate));
      btn.addEventListener('mouseleave', showAvg);
      btn.addEventListener('blur', showAvg);
      btn.addEventListener('click', () => {
        const hint = root.querySelector('.yv-rate-hint');
        if (!this.state.user) {
          hint.innerHTML = `<b>Сначала войдите.</b> <a href="#" class="yv-go-login">Вход</a>`;
          hint.querySelector('.yv-go-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.requireLogin(win, here);
          });
          return;
        }
        const rated = Object.assign({}, this.state.rated, { [v.id]: +btn.dataset.rate });
        this.saveState({ rated });
        showAvg();
        root.querySelector('.yv-rate-label').textContent = `Ваша оценка: ${rated[v.id]} из 5`;
        root.querySelector('.yv-rate-total').textContent = `${this.num(this.rating(v).count)} оценок`;
        hint.textContent = 'Спасибо, оценка сохранена.';
      });
    });
    const fav = root.querySelector('.yv-fav');
    fav.addEventListener('click', () => {
      if (!this.state.user) {
        root.querySelector('.yv-action-note').textContent = 'Войдите, чтобы добавлять видео в избранное.';
        return;
      }
      const on = this.state.favorites.includes(v.id);
      const favorites = on ? this.state.favorites.filter(x => x !== v.id) : this.state.favorites.concat([v.id]);
      this.saveState({ favorites });
      fav.querySelector('span').textContent = on ? 'В избранное' : 'Убрать из избранного';
      root.querySelector('.yv-action-note').textContent = on ? 'Видео убрано из избранного.' : 'Видео добавлено в избранное.';
    });
    root.querySelector('.yv-share').addEventListener('click', () => {
      const field = root.querySelector('.yv-url');
      field.focus();
      field.select();
      root.querySelector('.yv-action-note').textContent = 'Ссылка выделена в поле URL справа: скопируйте её и отправьте друзьям.';
    });
    root.querySelector('.yv-flag').addEventListener('click', () => {
      root.querySelector('.yv-action-note').textContent = 'Спасибо. Модераторы YouVid проверят это видео.';
    });
    root.querySelectorAll('.yv-url, .yv-embed').forEach(f => f.addEventListener('focus', () => f.select()));
    root.querySelectorAll('.yv-chap').forEach(btn => btn.addEventListener('click', () => {
      const p = this.player;
      if (!p || p.state === 'broken') return;
      p.seek(+btn.dataset.t);
      if (p.state !== 'playing' && p.state !== 'loading') p.play();
      p.updateTime();
    }));
    this.attachWatchComments(root, v);
  }

  attachWatchComments(root, v) {
    const form = root.querySelector('.yv-comment-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.querySelector('.yv-comment-text').value.trim();
      if (!text) {
        form.querySelector('.yv-comment-err').textContent = 'Комментарий пустой: напишите хотя бы пару слов.';
        return;
      }
      const comments = Object.assign({}, this.state.comments);
      comments[v.id] = [{ user: this.state.user, when: 'только что', text }].concat(comments[v.id] || []);
      this.saveState({ comments });
      root.querySelector('.yv-comments').outerHTML = this.renderComments(v, this.commentsOf(v));
      this.attachWatchComments(root, v);
      if (window.appClippy && window.appClippy.onYouVidComment) window.appClippy.onYouVidComment(v, text);
    });
  }

  paintRate(root, n) {
    root.querySelectorAll('.yv-rate-btn').forEach(b => {
      const on = +b.dataset.rate <= n;
      b.querySelector('.yv-star').className = `yv-star ${on ? 'yv-star-full' : 'yv-star-empty'}`;
    });
  }
}

window.YouVidPlayer = YouVidPlayer;
window.youvidSite = new YouVidSite();
