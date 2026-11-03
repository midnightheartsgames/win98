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
      this.drawFrame(0);
      this.whenGpuReady(() => {
        if (!this.root.isConnected || this.state !== 'loading') return;
        this.hideMessage();
        this.state = 'paused';
        if (autoplay) this.play(true);
      });
    }, 30);
    this.watch = setInterval(() => {
      if (!this.root.isConnected) this.destroy();
      else this.paintBuffered();
    }, 700);
  }

  whenGpuReady(done) {
    const deadline = performance.now() + 20000;
    let last = performance.now();
    let smooth = 0;
    const tick = (now) => {
      if (!this.root.isConnected) return;
      smooth = now - last < 120 ? smooth + 1 : 0;
      last = now;
      if (smooth >= 4 || now > deadline) {
        done();
        return;
      }
      this.drawFrame(0);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
      },
      kitty0706: {
        user: 'kitty0706',
        name: 'kitty0706',
        joined: '14 апреля 1999',
        lastSeen: 'сегодня',
        country: 'США',
        subs: 22870,
        about: 'Мультики про наёмников из Team Fortress 2, собранные в Garry\'s Mod. Почти все голоса мои, на подпевках младший брат.',
        site: '',
        theme: 'fab'
      },
      Valve: {
        user: 'Valve',
        name: 'Valve',
        joined: '13 ноября 1999',
        lastSeen: 'сегодня',
        country: 'США',
        subs: 24950,
        about: 'Valve — компания из Белвью (штат Вашингтон), которая с 1996 года делает игры и технологии для них. Здесь выходят наши трейлеры и ролики.',
        site: 'www.valvesoftware.com',
        theme: 'valve'
      },
      ShosumPosum: {
        user: 'ShosumPosum',
        name: 'Shosum Posum',
        joined: '17 августа 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 4380,
        about: 'Здарова, бандиты! Повторяю легендарные блюда из чужих роликов, пробую при вас и честно говорю, что получилось. Иногда делаю чуть-чуть получше.',
        site: '',
        theme: 'posum'
      },
      Eptable: {
        user: 'Eptable',
        name: 'Eptable',
        joined: '3 октября 1999',
        lastSeen: 'сегодня',
        country: 'Россия',
        subs: 9120,
        about: 'Ролики по «S.T.A.L.K.E.R.»: моды, баги и парады. Болт кидаю метко, стреляю как получится. Кордон после меня уже не тот.',
        site: '',
        theme: 'eptable'
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
        id: 'k0n0SuBaOp1',
        title: 'KONOSUBA - Opening',
        channel: 'Crunchyroll',
        added: 'только что',
        order: 59,
        category: 'film',
        description: 'Опенинг первого сезона KONOSUBA («fantastic dreamer», Machico). Ночной Аксель с высоты, карточки «このすば», Казума в небе со светом в ладони и логотип, который собирается из букв и перьев. Дальше будни отряда: Аква на траве, первые квесты, официантка с шестью кружками, хлеб Мегумин, подземелье с минотавром, ночь у костра и озеро с кувшинками.\nПотом Аква танцует на тёмной воде, отряд бьётся с големом и ухмыляющимся камнем, а Мегумин заканчивает всё одним Взрывом. В конце знакомые лица Акселя и вид на долину с утёса, а после песни заставка канала.\nТитры оригинальные, на японском.',
        tags: ['konosuba', 'коносуба', 'crunchyroll', 'аниме', 'опенинг', 'fantastic dreamer', 'machico', 'аква', 'мегумин', 'казума', 'даркнесс', 'взрыв'],
        views: 246180,
        rating: 5,
        ratings: 5730,
        favorited: 2480,
        honors: 9,
        links: 104,
        chapters: [
          [0, 'Аксель ночью'],
          [6.4, 'このすば'],
          [7.8, 'Казума в небе'],
          [12.3, 'Логотип из перьев'],
          [24.6, 'Вид с холма'],
          [27.9, 'Аква на траве'],
          [31.9, 'Первые квесты'],
          [34.7, 'Гильдия и хлеб'],
          [37.2, 'Даркнесс'],
          [40.0, 'Подземелье и костёр'],
          [41.9, 'Озеро с кувшинками'],
          [44.3, 'Танец Аквы'],
          [51.2, '«fantastic dreamer»'],
          [55.1, 'Голем'],
          [58.7, 'Ухмыляющийся камень'],
          [62.3, 'Полёт'],
          [66.2, 'Взрыв!'],
          [73.1, 'После взрыва'],
          [79.8, 'Жители Акселя'],
          [85.7, 'Вид на долину'],
          [89.5, 'Заставка канала']
        ],
        comments: [
          { user: 'explosion_every_day', when: '1 минуту назад', text: 'Магические круги на 1:09 пересчитал: их пять. Мегумин одна стоит целого отряда магов.' },
          { user: 'useless_goddess', when: '2 минуты назад', text: 'Аква танцует на тёмной воде, а через полминуты уже рыдает в пыли. Всё по канону.' },
          { user: 'crimson_demon99', when: '3 минуты назад', text: 'Камень с глазами на 1:00 улыбается так, будто заранее знает, чем всё кончится.' },
          { user: 'axel_guild_beer', when: '4 минуты назад', text: 'Официантка несёт шесть кружек сразу. Вот это я понимаю сервис в гильдии.' },
          { user: 'modem_33600', when: '5 минут назад', text: 'Полторы минуты грузились всю ночь. Логотип из перьев стоил каждого килобайта.' }
        ]
      },
      {
        id: 'N4gat0r0Op1',
        title: "DON'T TOY WITH ME, MISS NAGATORO Opening | EASY LOVE",
        channel: 'Crunchyroll',
        added: 'только что',
        order: 61,
        category: 'film',
        description: 'Опенинг «Не издевайся, Нагаторо» («EASY LOVE», Сумирэ Уэсака). Нагаторо дразнит семпая в кислотных цветах: шаги к нему через весь кадр, кисточные «イジらないで、長瀞さん», «Senpai» над головой, подружки, класс шести цветов, сердечко в скетчбуке, бюсты в кабинете рисования и хохочущее «Пупупу».\nПотом тихая часть: семпай в отражении глаза, прогулка к свету и пастельный кадр в его очках. Дальше «EASY LOVE», «NIGHT DATE», журнал, глаз за дверью, логотип, а после песни заставка канала.\nТитры оригинальные, на японском.',
        tags: ['nagatoro', 'нагаторо', 'не издевайся нагаторо', 'ijiranaide nagatoro san', 'easy love', 'сумирэ уэсака', 'crunchyroll', 'аниме', 'опенинг', 'семпай', 'senpai'],
        views: 271940,
        rating: 5,
        ratings: 6120,
        favorited: 2950,
        honors: 8,
        links: 96,
        chapters: [
          [0, 'Шаги к семпаю'],
          [9.05, '«Senpai»'],
          [15.7, 'Семпай и Нагаторо'],
          [25.7, 'Класс шести цветов'],
          [30.4, 'Скетчбук'],
          [33.2, 'KISS'],
          [38.1, 'Ночная Нагаторо'],
          [45.0, 'Подружки в неоне'],
          [47.3, 'Пупупу'],
          [48.8, '«EASY LOVE»'],
          [57.4, 'Отражение в глазу'],
          [58.6, 'Прогулка к свету'],
          [64.1, 'EASY LOVE, NIGHT DATE'],
          [69.7, 'Журнал'],
          [75.3, 'Глаз за дверью'],
          [79.4, 'Логотип'],
          [84.4, 'Бака-бака'],
          [88.9, 'Финал'],
          [90.0, 'Заставка канала']
        ],
        comments: [
          { user: 'senpai_artclub', when: '1 минуту назад', text: 'Нарисовал семпая в скетчбуке, а она обвела его сердечком. Кадр на 0:31 пересмотрел раз десять.' },
          { user: 'pupupu_98', when: '2 минуты назад', text: '«Пупупу» на 0:47 и палец прямо в экран. Почему-то кажется, что смеются надо мной.' },
          { user: 'gamo_chan_fan', when: '3 минуты назад', text: 'Подружки хохочут хором, а семпай посередине стоит как в клетке со львами.' },
          { user: 'easy_love_karaoke', when: '4 минуты назад', text: 'EASY LOVE, NIGHT DATE: успел только моргнуть, а надписи уже пролетели. Песня теперь крутится в голове весь вечер.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Пока качалось, семпай успел покраснеть раз двадцать. Мой модем тоже покраснел.' }
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
        id: 'n33dAbUfF98',
        title: 'When you need a buff',
        channel: 'memes_ytp',
        added: 'только что',
        order: 41,
        category: 'comedy',
        description: 'Двадцать четыре секунды из жизни одного отряда. Рыцарь в кольчужном капюшоне смотрит на грозного босса и просит барда помочь. Бард в бархатном берете отвечает «Say no more», достаёт укулеле и играет, и через пару тактов его окутывает золотое сияние. Следом начинает светиться и рыцарь.\nОсталось понять, что это за бафф и как с ним идти в бой. Бард объясняет: плюс к Харизме. Босс отвечает сверху.\nКадр вертикальный, поэтому по краям плеера чёрные поля. Субтитры оригинальные, на английском.',
        tags: ['when you need a buff', 'buff', 'бафф', 'бард', 'bard', 'рыцарь', 'укулеле', 'харизма', 'charisma', 'аура', 'босс', 'мем', 'ytp', 'memes'],
        views: 218430,
        rating: 5,
        ratings: 5210,
        favorited: 2310,
        honors: 9,
        links: 96,
        chapters: [
          [0, 'Босс на горизонте'],
          [2.1, '«Can you help me out?»'],
          [3.5, '«Say no more»'],
          [5.5, 'Рыцарь ждёт'],
          [6.4, 'Укулеле'],
          [8, 'Золотая аура'],
          [13.7, '«What’s this yellow aura?»'],
          [15.6, '«It’s a Charisma buff»'],
          [17.2, '«What am I supposed to do with that?!»'],
          [19.1, 'Бард играет дальше'],
          [22.6, 'Босс прилетел']
        ],
        comments: [
          { user: 'bard_po_vyzovu', when: '1 минуту назад', text: 'Плюс к Харизме перед боссом — классика. Зато рыцарь теперь очень убедительно стоит под ударом.' },
          { user: 'kolchuga_98', when: '2 минуты назад', text: 'На 0:08 бард начинает светиться, на 0:13 уже и рыцарь. Свет в этом зале явно никто не экономит.' },
          { user: 'ytp_collector', when: '3 минуты назад', text: 'Отправил другу, который в каждой игре берёт барда. Он ответил «Say no more» и ушёл за укулеле.' },
          { user: 'zakladka98', when: '4 минуты назад', text: '«What am I supposed to do with that?!» — лучший вопрос к любому баффу.' },
          { user: 'boss_s_neba', when: '5 минут назад', text: 'Последняя секунда объясняет, почему харизма не помогла. Босс просто не стал разговаривать.' }
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
      },
      {
        id: 'S1egaStrad4',
        title: 'Жизнь и Страдания Сиеги',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 20,
        category: 'games',
        description: 'Чёрно-белая хроника одного вечера в Dota 98. Сиега в игровом кресле и больших наушниках проигрывает катку за каткой: мимо хука, бесполезный герой, тридцать минут без шанса на победу. Руки за голову, прыжок из кресла, бой с воздухом, лицо в ладонях и видеозвонок, после которого становится только хуже.\nСобрано из нескольких стримов: серая, белая и две чёрные футболки, одно и то же кресло DIVANRACER.',
        tags: ['сиега', 'дота', 'dota 98', 'стрим', 'стример', 'мимо хука', 'страдания', 'горит', 'наушники', 'ебатория'],
        views: 27640,
        rating: 5,
        ratings: 702,
        favorited: 318,
        honors: 3,
        links: 24,
        chapters: [
          [0, 'Мимо хука'],
          [15, 'Белая футболка'],
          [24.8, 'Мир переворачивается'],
          [28, '«Почему я это проигрываю?»'],
          [43.8, 'Руки за голову'],
          [53.6, '«Не играю в неё никогда в жизни»'],
          [60, 'Прыжок из кресла'],
          [69.3, 'Крик на весь подъезд'],
          [82.2, 'Снова мимо хука'],
          [102.9, 'Бой с воздухом'],
          [111.8, 'Головой вниз'],
          [118, '«Я вот честно...»'],
          [125.2, '«Вы мертвы»'],
          [128.1, '«Я играю на стриме»'],
          [143.9, 'Кабель наушников'],
          [152.2, 'Опять белая футболка'],
          [159.7, 'Футболка BULKA'],
          [174.9, '«Почему я должен сидеть 30 минут?»'],
          [186, 'Видеозвонок'],
          [193.2, 'Наушники в сторону']
        ],
        comments: [
          { user: 'myasnoy_kryuk', when: '1 минуту назад', text: 'Мимо хука — это не промах, это образ жизни. Подписался.' },
          { user: 'perevernutyi_mir', when: '2 минуты назад', text: 'На 0:25 мир перевернулся прямо вместе с ним. У меня после каждой проигранной катки так же.' },
          { user: 'tridcat_minut', when: '3 минуты назад', text: '«Почему я должен сидеть 30 минут?» — я, пока это видео грузилось по модему 33.6.' },
          { user: 'videozvonok98', when: '4 минуты назад', text: 'Кому он звонил на 3:06 в таком состоянии? Надеюсь, не маме.' },
          { user: 'divanracer_fan', when: '5 минут назад', text: 'Кресло DIVANRACER выдержало все прыжки и удары. Вот это реклама.' }
        ]
      },
      {
        id: 'Kl4dbTvOz0n',
        title: 'Кладбище телевизоров Озона',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 21,
        category: 'comedy',
        description: 'Хроника телевизоров Озона. Сначала стрим со сбором «на огромный телек 50 дюймов»: 240 рублей из 40 000 и очень тяжёлый вздох. Потом всё-таки покупка: коробка «LJ UHD TV» на 49 дюймов, белый телевизор у новогодней ёлки и спасибо всем донатерам, ведь 34 тысячи — не дёшево. Дальше танец перед белым экраном, синяя коробка «Samsong Crystal UHD» седьмой серии, распаковка на кровати и 65 дюймов на стене. А потом приходит Кирюха и проверяет, как телевизор снимается с кронштейна.\nВ конце Озон у веб-камеры: то ли смеётся, то ли плачет. Решайте сами.',
        tags: ['озон', 'телевизор', 'телек', 'кладбище', 'кирюха', 'распаковка', 'кронштейн', 'донат', 'стрим', 'ебатория'],
        views: 48210,
        rating: 5,
        ratings: 1174,
        favorited: 503,
        honors: 4,
        links: 33,
        chapters: [
          [0, 'Сбор на огромный телек'],
          [13.6, 'Коробка «LJ» на 49 дюймов'],
          [20.9, 'Телевизор под ёлкой'],
          [28.9, 'Танец перед экраном'],
          [39.6, '«Смарт, какой-то тизер!»'],
          [50.5, 'Распаковка'],
          [57.3, 'Экран на кровати'],
          [65.9, 'Телевизор на стене'],
          [69.5, 'Все смотрят'],
          [73.2, '«Как он снимается?»'],
          [78.7, '«Кирюх, не надо!»'],
          [85.5, 'Полёт на кровать'],
          [93.1, 'Кресло в воздухе'],
          [105.6, 'Смеётся или плачет']
        ],
        comments: [
          { user: 'kronshtein_98', when: '1 минуту назад', text: 'Кронштейн выдержал Кирюху на 1:16. Вот это я понимаю, сделано на века.' },
          { user: 'chek_pokazhu', when: '2 минуты назад', text: 'Сбор на огромный телек: 240 рублей из 40 000. Ничего, я в десять лет так же на велосипед копил.' },
          { user: 'samsong_crystal', when: '3 минуты назад', text: '«Смарт, какой-то тизер, 4К!» — лучший обзор техники, что я слышал. Коротко и по делу.' },
          { user: 'kiryuha_ne_nado', when: '4 минуты назад', text: '«Кирюх, не надо! Кирюх, ты чё делаешь?» — записал на кассету, буду включать соседям.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Пока видео грузилось, у меня бы телевизор два раза успел сломаться. Озону — крепкий кронштейн.' }
        ]
      },
      {
        id: 'YeGuDNa1s98',
        title: 'YEGUDNAIS',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 22,
        category: 'music',
        description: 'Ремикс на наш «verynicegoodnice»: из «вери найс» нарезали бит, и теперь «Ye good nice» играет в наушниках у человека, который с утра идёт через весь офис. Пальто, красный галстук, портфель, провод от плеера под лацканом — и никто из коллег не решается его остановить.\nДва плана: навстречу камере по коридору и со спины мимо кабинок до самой двери кабинета.',
        tags: ['yegudnais', 'ye good nice', 'вери найс', 'гуд найс', 'ремикс', 'офис', 'наушники', 'плеер', 'ебатория'],
        views: 39520,
        rating: 5,
        ratings: 1026,
        favorited: 457,
        honors: 4,
        links: 36,
        chapters: [
          [0, 'Навстречу по коридору'],
          [4.9, 'Мимо кабинок'],
          [9.0, 'Приёмная и дверь кабинета']
        ],
        comments: [
          { user: 'kasseta_c90', when: '1 минуту назад', text: 'Наушники с поролоном и провод через весь пиджак — я так же хожу на работу, только офис у меня поменьше и без жалюзи.' },
          { user: 'zhaluzi_98', when: '2 минуты назад', text: 'На 0:06 полоски от жалюзи бегут по пальто прямо в такт басу. Совпадение? Не думаю.' },
          { user: 'goodnice_fan', when: '3 минуты назад', text: 'Ye good nice! Ye good nice! Поставил на будильник, теперь «вери найс» — гимн понедельника.' },
          { user: 'ofisnyi_plankton', when: '4 минуты назад', text: 'Секретарь за стеклом даже глаз не подняла. Видимо, он так заходит каждое утро.' },
          { user: 'modem_9600', when: '5 минут назад', text: 'Тринадцать секунд грузились полчаса. Досмотрел до двери кабинета и сразу нажал повтор.' }
        ]
      },
      {
        id: 'T3amFabu1s2',
        title: 'Team Fabulous 2',
        channel: 'kitty0706',
        added: 'только что',
        order: 23,
        category: 'film',
        description: 'Вторая часть Team Fabulous. Раунд на самодельной карте kart_cakeway: красные сидят на корточках в респауне и ждут конца подготовки, синие в это время ужинают за столиками со скатертями. Потом ворота открываются, и над трассой «Xenon Cakeway» начинается привычный бардак: пулемёты, огнемёты, турели и Хэви на картинге.\nА где-то в стороне от всего этого сидит инженер в белой ковбойской шляпе и играет на гитаре.\nСобрано в Garry\'s Mod, голоса мои и младшего брата.',
        tags: ['team fabulous', 'team fortress 2', 'tf2', 'garry\'s mod', 'машинима', 'хэви', 'инженер', 'гитара', 'kart_cakeway', 'kitty0706'],
        views: 318470,
        rating: 5,
        ratings: 7480,
        favorited: 3360,
        honors: 14,
        links: 152,
        chapters: [
          [0, 'Гитара в темноте'],
          [11.7, 'kitty0706 представляет'],
          [23.4, 'Team Fabulous 2'],
          [28.8, 'В ролях'],
          [55.1, 'Красный респаун'],
          [86.3, 'Над трассой'],
          [90.0, 'Ужин у синих'],
          [103.3, 'Гараж и конусы'],
          [120.8, 'Бой начался'],
          [145.0, 'Xenon Cakeway в огне'],
          [153.1, 'Инженер с гитарой'],
          [175.0, 'Строим турель'],
          [194.9, 'Шпион'],
          [207.3, 'Два Скаута'],
          [221.0, 'Картинг'],
          [228.4, 'Швабра и банан'],
          [241.3, 'Ты меня помнишь?'],
          [248.3, 'Засада у билборда'],
          [261.1, 'Банан вместо рации'],
          [278.2, 'Снайпер на грибе'],
          [296, 'Фото на память'],
          [309.2, 'Неуязвимый пулемётчик'],
          [323.8, 'Гирлянда и Немезида'],
          [345.2, 'Хэви ждёт медика'],
          [371.1, 'Убер-заряд'],
          [392.1, 'Медик ушёл AFK'],
          [402, 'Гитарист и лучник'],
          [421.5, 'Доска объявлений'],
          [443.8, 'Мультик: коробка с сюрпризом'],
          [468.7, 'Провал в иное измерение'],
          [479.5, 'Антракт: летсплей «Агент Зеро»'],
          [517.3, 'Ранее: план Спанки'],
          [541.8, 'Ночь: прыжок в стог'],
          [580.2, 'Логово и загон'],
          [594.3, 'Инженер у окна RED'],
          [613.2, 'Человек в ПНВ'],
          [638.0, 'Рыцарь и дракон'],
          [662.2, 'Бесплатные шляпы'],
          [680.8, 'Фотограф'],
          [687.5, 'Солдат с газировкой'],
          [699.9, 'Гирлянда против кладоискателя'],
          [715.0, 'Список растёт'],
          [720.0, 'Все, кроме героя'],
          [726.7, 'Инженер видит пленных'],
          [736.3, 'Шлемы контроля'],
          [755.7, 'Армия Спанки'],
          [771.9, 'Воспоминания и падение'],
          [792.2, 'Синий стрелок'],
          [814.5, 'Концерт в казарме BLU'],
          [840.3, 'Шляпа возвращается'],
          [849.3, 'Луна падает'],
          [875.9, 'Спанки злорадствует'],
          [887.1, 'Гитара против луны'],
          [920.5, 'Некоторое время спустя'],
          [944.2, 'Уроки гитары'],
          [960.6, 'Хэви поёт'],
          [982.9, 'Титры'],
          [1033.0, '(C) 1999']
        ],
        comments: [
          { user: 'kart_heavy_69', when: '1 минуту назад', text: 'Хэви приехал шестьдесят девятым и всё равно самый счастливый на трассе.' },
          { user: 'girlyanda_engi', when: '2 минуты назад', text: 'Инженер с гирляндой на голове строит турель лёжа. Новый год у человека круглый год.' },
          { user: 'dinner_unit_k', when: '3 минуты назад', text: 'Синие ужинают при свечах, а красные сидят на корточках в респауне. Вот это классовое неравенство.' },
          { user: 'gitara_v_shlyape', when: '4 минуты назад', text: 'Ковбой в белой шляпе с гитарой — лучший персонаж. Пусть сыграет ещё.' },
          { user: 'modem_56k_kid', when: '5 минут назад', text: 'Качал всю ночь, мама думала, что я сломал телефонную линию. Оно того стоило.' }
        ]
      },
      {
        id: 'M33tTh3H3vy',
        title: 'Meet the Heavy',
        channel: 'Valve',
        added: 'только что',
        order: 78,
        category: 'games',
        description: 'Первый ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Пулемётчик достаёт из коробки свою «Сашу», рассказывает, сколько она весит и во что обходятся двенадцать секунд стрельбы, выясняет, кто трогал его пулемёт, и показывает, что бывает с теми, кто думает его перехитрить.\nTeam Fortress 2 выходит в составе The Orange Box.',
        tags: ['meet the heavy', 'team fortress 2', 'tf2', 'хэви', 'пулемётчик', 'саша', 'пулемёт', 'meet the team', 'the orange box', 'valve'],
        views: 486350,
        rating: 5,
        ratings: 11208,
        favorited: 5124,
        honors: 21,
        links: 318,
        chapters: [
          [0, 'Заставка'],
          [4.99, 'Коробка с надписью FRAGILE'],
          [7.37, 'Я пулемётчик, а это моё оружие'],
          [26.4, 'Двенадцать секунд'],
          [35.8, 'Смех'],
          [40.9, 'Кто трогал Сашу?'],
          [49.5, 'Перехитрить пулю'],
          [65.8, 'Плачь ещё!'],
          [80.5, 'Команда'],
          [85.4, 'The Orange Box']
        ],
        comments: [
          { user: 'sasha_150kg', when: '1 минуту назад', text: 'Сто пятьдесят килограммов и двести долларов за патрон. Теперь считаю, во сколько мне обходится каждая минута в интернете.' },
          { user: 'modem_33600', when: '2 минуты назад', text: 'Качал полтора часа, чтобы посмотреть, как человек полторы минуты гладит пулемёт. Ни секунды не жалею.' },
          { user: 'buterbrod98', when: '3 минуты назад', text: 'На 0:40 он вытирает слёзы от смеха, а на 0:47 уже кричит, кто трогал его пулемёт. Вот это смена настроения.' },
          { user: 'cry_some_more', when: '4 минуты назад', text: 'Учу английский по этому ролику. Пока выучил только «Cry some more».' },
          { user: 'orange_box_99', when: '5 минут назад', text: 'Когда уже выйдет игра? Хочу так же стоять на крыше сарая и смеяться.' }
        ]
      },
      {
        id: 'M33tTh3S0ld',
        title: 'Meet the Soldier',
        channel: 'Valve',
        added: 'только что',
        order: 81,
        category: 'games',
        description: 'Второй ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Солдат читает лекцию отряду в синих касках: Сунь-цзы изобрёл драку, довёл её до совершенства, а на призовые купил по паре каждого зверя, загнал их на лодку и поколотил всех до одного. Между уроками истории — лопата, дробовик, ракетомёт, гранаты, которые никак не отстёгиваются от ремня, ракетный прыжок через полполя и шпион, которому лучше было не подкрадываться.\nTeam Fortress 2 выходит в составе The Orange Box.',
        tags: ['meet the soldier', 'team fortress 2', 'tf2', 'солдат', 'ракетомёт', 'сунь-цзы', 'зоопарк', 'meet the team', 'the orange box', 'valve'],
        views: 512730,
        rating: 5,
        ratings: 11890,
        favorited: 5480,
        honors: 18,
        links: 296,
        chapters: [
          [0, 'Синие'],
          [10.49, 'Заставка'],
          [13.99, 'Сунь-цзы'],
          [31.39, 'В атаку!'],
          [47.29, 'Гранаты'],
          [56.98, 'Ракетный прыжок'],
          [66.52, 'Зоопарк'],
          [73.63, 'Отряд'],
          [77.55, 'Команда'],
          [81.79, 'Если только это не ферма'],
          [83.42, 'The Orange Box']
        ],
        comments: [
          { user: 'sun_tzu_fan', when: '1 минуту назад', text: 'Теперь я знаю, откуда взялось слово «зоопарк». В школе нам этого не рассказывали.' },
          { user: 'ferma_ne_zoo', when: '2 минуты назад', text: 'Он сам себя поправил: «если только это не ферма». Вот это честность.' },
          { user: 'granata_na_remne', when: '3 минуты назад', text: 'На 0:50 он воюет с гранатами на ремне, и они так и не отстегнулись. Как мой рюкзак.' },
          { user: 'raketny_pryzhok', when: '4 минуты назад', text: 'Ракетный прыжок на 1:00 смотрю уже десятый раз. Модем плачет, я тоже.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Качал всю ночь на 28.8. Отряд в синих касках в конце: сначала не понял, а потом как понял.' }
        ]
      },
      {
        id: 'M33tTh3Eng1',
        title: 'Meet the Engineer',
        channel: 'Valve',
        added: 'только что',
        order: 82,
        category: 'games',
        description: 'Третий ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Инженер сидит на ящике с инструментами у старого грузовика, играет на гитаре и объясняет, чем он занимается: решает задачи. Не философские, вроде «что такое красота», а практические. Например, как остановить здоровяка, который идёт устроить тебе неприятности. Ответ: пушка. А если не помогло — больше пушек. Вот хотя бы эта турель на треноге: сам придумал, сам собрал, и лучше бы ей не смотреть в вашу сторону.\nTeam Fortress 2 выходит в составе The Orange Box.',
        tags: ['meet the engineer', 'team fortress 2', 'tf2', 'инженер', 'турель', 'гитара', 'больше пушек', 'meet the team', 'the orange box', 'valve'],
        views: 433610,
        rating: 5,
        ratings: 10470,
        favorited: 4890,
        honors: 16,
        links: 274,
        chapters: [
          [0, 'Заставка'],
          [5.45, 'Гитара у грузовика'],
          [8.28, 'Я инженер'],
          [13.74, 'Что такое красота'],
          [23.85, 'Глоток пива'],
          [32.93, 'Как остановить здоровяка'],
          [38.5, 'Ответ: пушка'],
          [47.79, 'Больше пушек'],
          [54.94, 'Сам придумал, сам собрал'],
          [64.73, 'Лучше не в вашу сторону'],
          [69.68, 'Синие идут в атаку'],
          [78.59, 'Команда'],
          [83.5, 'The Orange Box']
        ],
        comments: [
          { user: 'gitara_i_turel', when: '1 минуту назад', text: 'Сидит, играет на гитаре, а турель работает за него. Вот это я понимаю, инженерный подход.' },
          { user: 'schetchik_209', when: '2 минуты назад', text: 'Следите за счётчиком на ящике: в начале 00209, а к концу набегает ещё десяток. Никто не ушёл обиженным.' },
          { user: 'bolshe_pushek', when: '3 минуты назад', text: '«Если не помогло — больше пушек». Записал на листочек и повесил над монитором.' },
          { user: 'blu_streak_fan', when: '4 минуты назад', text: 'Пиво у него называется «Blu Streak». Наверное, отобрал у синих вместе с грузовиком.' },
          { user: 'modem_14400', when: '5 минут назад', text: 'Качал два дня на 14.4. Песня под гитару того стоила, теперь насвистываю её весь день.' }
        ]
      },
      {
        id: 'M33tTh3D3mo',
        title: 'Meet the Demoman',
        channel: 'Valve',
        added: 'только что',
        order: 83,
        category: 'games',
        description: 'Четвёртый ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Подрывник выскакивает из огненного туннеля, садится за верстак с бутылкой и объясняет, что делает его хорошим подрывником: будь он плохим, его бы здесь не было. Один перепутанный провод, одна лишняя щепотка хлората калия, одно неловкое движение — и бабах. Между глотками — гранатомёт, турель, к которой гранаты подкатываются по земле, липучки на каждом косяке двери и обещание, что синих склеят обратно уже в аду.\nTeam Fortress 2 выходит в составе The Orange Box.',
        tags: ['meet the demoman', 'team fortress 2', 'tf2', 'подрывник', 'демоман', 'гранатомёт', 'липучки', 'шотландец', 'meet the team', 'the orange box', 'valve'],
        views: 468920,
        rating: 5,
        ratings: 10980,
        favorited: 5120,
        honors: 17,
        links: 288,
        chapters: [
          [0, 'Заставка'],
          [4.745, 'Огненный туннель'],
          [10.447, 'Что делает меня хорошим подрывником?'],
          [15.817, 'Вперёд!'],
          [20.729, 'Ни один из вас не выживет'],
          [25.432, 'Один перепутанный провод'],
          [32.342, 'Бабах'],
          [35.339, 'Глоток и турель'],
          [43.456, 'Гранаты по земле'],
          [50.033, 'Шотландский циклоп'],
          [64.185, 'Синие идут'],
          [79.17, 'Липучки'],
          [85.955, 'Бабах у двери'],
          [88.494, 'Склеят вас обратно в аду'],
          [96.861, 'Команда'],
          [101.731, 'The Orange Box']
        ],
        comments: [
          { user: 'xorosh_podryvnik', when: '1 минуту назад', text: 'Будь он плохим подрывником, его бы здесь не было. Железная логика, записал на листочек.' },
          { user: 'lipuchka_98', when: '2 минуты назад', text: 'Синие выходят из двери, а там липучки на каждом косяке. На 1:24 у пулемётчика такое лицо, будто он забыл выключить утюг.' },
          { user: 'turel_ne_spit', when: '3 минуты назад', text: 'Турель стреляла во всё, что бегает. А гранаты не бегают, они катятся. Вот и вся тактика.' },
          { user: 'odin_glaz', when: '4 минуты назад', text: 'Одним глазом попадает лучше, чем я двумя по кнопке «Скачать».' },
          { user: 'modem_9600', when: '5 минут назад', text: 'Качал на 9600 двое суток. «Склеят вас обратно в аду» в самом конце — ради этого стоило.' }
        ]
      },
      {
        id: 'M33tTh3Sc0t',
        title: 'Meet the Scout',
        channel: 'Valve',
        added: 'только что',
        order: 84,
        category: 'games',
        description: 'Пятый ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Ворота респауна поднимаются, синие уже сидят в окнах напротив, и разведчик срывается с места: через двор, через рельсы, двойным прыжком через крышу и сквозь ангар под ракетами. Потом он встаёт перед собственным плакатом и объясняет, с кем вы имеете дело. Трава растёт, птицы летают, солнце светит, а он делает людям больно. Здоровяк с сэндвичем? Пара ударов, бита и «Бонк!». Сила природы, что тут скажешь.\nTeam Fortress 2 выходит отдельной коробкой 9 апреля в Северной Америке и 11 апреля в Европе, а пока его можно найти в The Orange Box.',
        tags: ['meet the scout', 'team fortress 2', 'tf2', 'скаут', 'разведчик', 'бита', 'бонк', 'сила природы', 'meet the team', 'the orange box', 'valve'],
        views: 503470,
        rating: 5,
        ratings: 11640,
        favorited: 5390,
        honors: 19,
        links: 305,
        chapters: [
          [0, 'Ворота респауна'],
          [6.874, 'Синие в окнах'],
          [13.666, 'Вперёд!'],
          [19.083, 'Через рельсы'],
          [22.874, 'Двойной прыжок'],
          [25.874, 'Ангар'],
          [31.416, 'Плакат'],
          [40.333, 'Здоровяк с сэндвичем'],
          [44.499, 'Ты вообще знаешь, кто я?'],
          [53.333, 'Вот это красота'],
          [58.749, 'Трава растёт, птицы летают'],
          [64.166, 'Я сила природы'],
          [65.374, 'Бонк!'],
          [70.208, 'Команда'],
          [77.083, 'Сэндвич'],
          [84.916, 'The Orange Box']
        ],
        comments: [
          { user: 'trava_rastet', when: '1 минуту назад', text: 'Трава растёт, птицы летают, солнце светит, а он делает людям больно. Повесил эту фразу над партой вместо расписания.' },
          { user: 'bonk_bonk_98', when: '2 минуты назад', text: 'На 1:05 он кричит «Бонк!» и бьёт битой. Теперь так здороваюсь с младшим братом, мама не в восторге.' },
          { user: 'chuzhoy_sendvich', when: '3 минуты назад', text: 'Самое обидное в самом конце: пулемётчик лежит, а мелкий сидит на нём и держит его сэндвич.' },
          { user: 'dvoynoy_pryzhok', when: '4 минуты назад', text: 'На 0:23 он прыгает второй раз прямо в воздухе. Учитель физики сказал, что так нельзя, но я видел своими глазами.' },
          { user: 'modem_19200', when: '5 минут назад', text: 'Качал на 19.2 почти сутки. Он бегает быстрее, чем у меня грузится страница с его роликом.' }
        ]
      },
      {
        id: 'M33tTh3Sn1p',
        title: 'Meet the Sniper',
        channel: 'Valve',
        added: 'только что',
        order: 85,
        category: 'games',
        description: 'Шестой ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Снайпер ведёт свой фургон по пустынной трассе и объясняет, чем хороша его работа: она интересная, на свежем воздухе, и голодным не останешься, ведь пока на планете есть хотя бы двое, один захочет смерти другого. Между делом — болванчик на приборной панели, зубная щётка у зеркала с фотографиями синих, прицел, телефонный спор с отцом («я не псих с ружьём, папа, я наёмный убийца!»), вышка над каньоном, кофе из кружки «#1 SNIPER», банки с подозрительно жёлтой жидкостью, шпион, которому стоило постучаться, и правило профессионала: будь вежлив, будь деловит и имей план, как убить всех, кого встретишь.\nTeam Fortress 2 уже продаётся для PC, а ещё его можно найти в The Orange Box.',
        tags: ['meet the sniper', 'team fortress 2', 'tf2', 'снайпер', 'винтовка', 'кукри', 'фургон', 'профессионалы', 'meet the team', 'the orange box', 'valve'],
        views: 497810,
        rating: 5,
        ratings: 11420,
        favorited: 5260,
        honors: 20,
        links: 301,
        chapters: [
          [0, 'Пустынная трасса'],
          [4.833, 'Болванчик на приборной панели'],
          [10.833, 'Заставка'],
          [13.416, 'Хорошая работа, приятель'],
          [23.208, 'Зубная щётка и фотографии'],
          [28.916, 'В прицеле'],
          [35.291, 'Гнездо у окна'],
          [37.499, 'Звонок отцу'],
          [45.666, 'Честно говоря'],
          [49.041, 'Вышка над каньоном'],
          [56.249, 'Кофе и банки'],
          [61.416, 'Шпион и кукри'],
          [65.916, 'Чувства?'],
          [71.208, 'Будь вежлив, будь деловит'],
          [75.624, 'Гильза против солнца'],
          [80.791, 'Команда'],
          [85.749, 'Пап, позови маму'],
          [90.233, 'The Orange Box']
        ],
        comments: [
          { user: 'snaiper_na_vyshke', when: '1 минуту назад', text: 'Будь вежлив, будь деловит, имей план. Повесил над партой рядом с расписанием, учительница попросила снять.' },
          { user: 'kruzhka_nomer_odin', when: '2 минуты назад', text: 'На 0:58 у него кружка «#1 SNIPER», а рядом банки с чем-то жёлтым. Очень надеюсь, что это лимонад.' },
          { user: 'papa_ne_ponimaet', when: '3 минуты назад', text: '«Я не псих с ружьём, папа, я наёмный убийца!» Объяснял так же своему папе про компьютерные игры. Не помогло.' },
          { user: 'bolvanchik_98', when: '4 минуты назад', text: 'Болванчик на приборной панели в начале — лучший актёр ролика. Один щелчок пальцем, и голова качается до самой заставки.' },
          { user: 'modem_2400', when: '5 минут назад', text: 'Качал на 2400 целую неделю. Пока докачалось, успел сам позвонить маме.' }
        ]
      },
      {
        id: 'M33tTh3Sp1y',
        title: 'Meet the Spy',
        channel: 'Valve',
        added: 'только что',
        order: 86,
        category: 'games',
        description: 'Седьмой ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. На базе синих воет тревога: внутри красный шпион. Солдат хватает дробовик и бежит защищать кейс, по дороге громко набирая на замке секретный код один-один-один-один, пулемётчик выносит дверь вместе с солдатом и разведчиком, а кейс на месте — разведчик уже улёгся на него. Тут входит синий шпион с телом снайпера на плече и ножом в его спине: проблема никуда не делась. Он рассказывает, на что способен противник: турель обезврежена жучком, снайпер зарезан в собственной хижине, медик стал собственным двойником. Показывает разведчику фотографии его мамы в компании красного шпиона и объясняет главное: шпион может быть кем угодно. В этой самой комнате. Тобой. Мной. Даже… Солдат не дослушивает.\nTeam Fortress 2 уже продаётся для PC, а ещё его можно найти в The Orange Box.',
        tags: ['meet the spy', 'team fortress 2', 'tf2', 'шпион', 'нож-бабочка', 'маскировка', 'кейс', 'код 1111', 'meet the team', 'the orange box', 'valve'],
        views: 521640,
        rating: 5,
        ratings: 12130,
        favorited: 5640,
        honors: 22,
        links: 316,
        chapters: [
          [0, 'Тревога'],
          [5.625, 'Дробовик со стойки'],
          [9.875, 'Защитить кейс!'],
          [15.792, 'Код 1-1-1-1'],
          [19.625, 'Берегись!'],
          [23.75, 'Кейс на месте'],
          [28.417, 'Господа?'],
          [30.917, 'Заставка'],
          [36.541, 'Кто-нибудь убил шпиона?'],
          [47.916, 'И нож'],
          [50.416, 'Шпионов я убил полно'],
          [58.416, 'Совсем не такой, как я'],
          [66.916, 'Президент его фан-клуба?'],
          [73.916, 'Фотографии'],
          [79.291, 'Слушай внимательно, мальчик'],
          [90.416, 'Сигарета'],
          [95.791, 'Жучок на турели'],
          [106.375, 'Наши коллеги'],
          [121.75, 'Он может быть одним из нас'],
          [125.62, 'Двойник медика'],
          [137.958, 'В этой самой комнате'],
          [143.5, 'Это было очевидно!'],
          [150.45, 'Вот-вот покраснеет'],
          [159.041, 'Нет, это кровь'],
          [165.041, 'Большая проблема'],
          [167.624, 'Прямо за тобой'],
          [173.041, 'Команда'],
          [177.976, 'Ma petite chou-fleur'],
          [192.54, 'Уже в продаже']
        ],
        comments: [
          { user: 'kod_1111', when: '1 минуту назад', text: 'Солдат набирает код один-один-один-один и выкрикивает каждую цифру. А разведчик стоит рядом и внимательно слушает. Вот и вся охрана базы.' },
          { user: 'pokrasneet_98', when: '2 минуты назад', text: '«Вот-вот покраснеет… Ещё секунду… Видите? Красный! Нет, стойте, это кровь». Лучший детектив во всей синей базе.' },
          { user: 'tsvetnaya_kapusta', when: '3 минуты назад', text: 'Ma petite chou-fleur — «моя маленькая цветная капуста». Назвал так сестру, теперь она со мной не разговаривает.' },
          { user: 'dver_s_petel', when: '4 минуты назад', text: 'На 0:21 пулемётчик выносит дверь вместе с солдатом и разведчиком. Кейс при этом даже не шелохнулся.' },
          { user: 'modem_1200', when: '5 минут назад', text: 'Качал на 1200 десять дней. Под конец понял, кто всё это время стоял за спиной у пулемётчика, и пересмотрел с начала.' }
        ]
      },
      {
        id: 'M33tTh3M3d1',
        title: 'Meet the Medic',
        channel: 'Valve',
        added: 'только что',
        order: 88,
        category: 'games',
        description: 'Восьмой ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Пока красные один за другим гибнут на поле боя без медика, сам медик у себя в лаборатории меняет пулемётчику сердце и рассказывает, как лишился медицинской лицензии. Голубь Архимед лезет прямо в грудную клетку, обычное сердце не выдерживает напряжения убер-зарядника, зато сердце мега-бабуина из холодильника подходит идеально. В холодильнике заодно хранится голова шпиона, которая просит её прикончить. Потом белый халат, медиган, полная шкала убер-заряда, и пулемётчик становится пуленепробиваемым.\nА в самом конце хорошая новость: Team Fortress 2 теперь бесплатна. Навсегда.',
        tags: ['meet the medic', 'team fortress 2', 'tf2', 'медик', 'медиган', 'убер-заряд', 'архимед', 'голубь', 'сердце', 'meet the team', 'valve'],
        views: 528640,
        rating: 5,
        ratings: 12110,
        favorited: 5690,
        honors: 22,
        links: 316,
        chapters: [
          [0, 'Поле боя без медика'],
          [18.894, 'Заставка'],
          [23.065, 'Лаборатория'],
          [36.81, 'Медицинская лицензия'],
          [42.18, 'Архимед, нет!'],
          [48.048, 'Убер-зарядник'],
          [55.389, 'Звук прогресса'],
          [62.229, 'Холодильник'],
          [66.775, 'Сердце мега-бабуина'],
          [78.37, 'Получилось?'],
          [89.715, 'Мне обязательно не спать?'],
          [100.434, 'Рёбра отрастут'],
          [108.734, 'Медиган'],
          [119.661, 'Что теперь?'],
          [129.379, 'Практикуем медицину'],
          [132.841, 'Халат и медиган'],
          [146.521, 'В бой'],
          [179.596, 'Понятия не имею!'],
          [183.1, 'Убер-заряд'],
          [200.2, 'Я пуленепробиваемый!'],
          [214.339, 'На вершине'],
          [218.844, 'Команда'],
          [224.391, 'Очередь к доктору'],
          [237.696, 'Бесплатно. Навсегда']
        ],
        comments: [
          { user: 'arhimed_98', when: '1 минуту назад', text: 'Голубь залез в грудную клетку, а доктор только «там же грязно!». Вот это хладнокровие.' },
          { user: 'megababoon', when: '2 минуты назад', text: 'В холодильнике у медика пиво, бутерброд, запасные сердца и голова шпиона. У меня там только кефир, обидно.' },
          { user: 'uber_zaryad', when: '3 минуты назад', text: 'На 3:03 стрелка доходит до конца и загорается «ÜBERCHARGE READY». Мурашки по коже.' },
          { user: 'rebra_otrastut', when: '4 минуты назад', text: '«Не будь ребёнком, рёбра отрастут» — «Нет, не отрастут». Переписал в тетрадку по биологии.' },
          { user: 'modem_2400', when: '5 минут назад', text: 'Качал на 2400 трое суток, а в конце написали, что игра теперь бесплатная. Навсегда! Пойду обрадую маму.' }
        ]
      },
      {
        id: 'M33tTh3Pyr0',
        title: 'Meet the Pyro',
        channel: 'Valve',
        added: 'только что',
        order: 90,
        category: 'games',
        description: 'Девятый, заключительный ролик серии «Знакомьтесь, команда» о наёмниках Team Fortress 2. Пулемётчик не боится ни одного человека, но вот эта штука его пугает. Разведчик клянётся, что не говорит про этого урода, и на всякий случай проверяет, нет ли его рядом. Шпион содрогается при мысли о том, какие нечеловеческие мысли прячутся под маской. А тем временем поджигатель смотрит на горящий город сквозь стёкла противогаза и видит совсем другое: радуги, леденцы, мыльные пузыри, подарки и пухлых ангелочков в синих подгузниках. Снаружи, правда, всё выглядит немного иначе.\nСделано в Source Filmmaker. Team Fortress 2 можно найти в The Orange Box.',
        tags: ['meet the pyro', 'team fortress 2', 'tf2', 'поджигатель', 'пиро', 'огнемёт', 'пироленд', 'радуга', 'meet the team', 'valve'],
        views: 534210,
        rating: 5,
        ratings: 12480,
        favorited: 5870,
        honors: 23,
        links: 327,
        chapters: [
          [0, 'Заставка'],
          [6.172, 'Шаги по пепелищу'],
          [11.177, 'Я не боюсь ни одного человека'],
          [19.978, 'Синий на улице'],
          [24.482, 'Его здесь нет?'],
          [32.532, 'Запальник у двери'],
          [37.04, 'Что прячется под маской'],
          [44.294, 'Пожар'],
          [53.261, 'Сквозь стёкла противогаза'],
          [55.888, 'Пироленд'],
          [65.064, 'Холм леденцов'],
          [76.451, 'Леденцом по макушке'],
          [84.917, 'Пузыри'],
          [88.004, 'Подарок с сюрпризом'],
          [95.011, 'Городок'],
          [107.982, 'Как всё было на самом деле'],
          [116.699, 'Маска'],
          [119.41, 'Команда'],
          [124.207, 'Каска'],
          [140.98, 'Source Filmmaker']
        ],
        comments: [
          { user: 'pirolend_98', when: '1 минуту назад', text: 'Надел противогаз брата, чтобы увидеть радугу. Радуги не увидел, стёкла запотели. Наверное, нужен другой фильтр.' },
          { user: 'ne_pro_uroda', when: '2 минуты назад', text: '«Его же здесь нет?» — и разведчик убегает так, что камера падает со штатива. Я бы тоже убежал.' },
          { user: 'shariki_puzyri', when: '3 минуты назад', text: 'Разведчик в подгузнике и с наушниками теперь стоит у меня на рабочем столе вместо облаков.' },
          { user: 'ledenets_na_palke', when: '4 минуты назад', text: 'Ангелочек получает леденцом по лысине и улетает, хихикая. А на 1:15 показывают, как это выглядело на самом деле. Лучше бы не показывали.' },
          { user: 'modem_2400', when: '5 минут назад', text: 'Качал на 2400 четыре дня. Мама спросила, зачем мне мультик про единорогов. Объяснить не смог.' }
        ]
      },
      {
        id: 'K4fkaIr0ny9',
        title: 'Кафка «Ирония драмы»',
        channel: 'HSR98',
        added: 'только что',
        order: 30,
        category: 'games',
        description: 'Трейлер персонажа Кафка — «Ирония драмы» в русском дубляже студии «Блинчик». Ночью охрана в фуражках получает по рации приказ «Уничтожить на месте!», а Охотница за Стелларонами приходит сама, по приглашению. Плакат «РОЗЫСК» с наградой 10,899,000,000, лазерная сеть в парадном зале, часы на двадцать четыре деления, лифт, катана, чёрно-белый зал в розовых кристаллах, руины под луной и монета: орёл или решка?\nКафка уже ждёт на баннере события «Охотники за Стелларонами» в Honkai: Star Rail 98.\nОфициальный сайт: hsr.hoyoverse.com',
        tags: ['кафка', 'kafka', 'ирония драмы', 'охотники за стелларонами', 'трейлер', 'дубляж', 'hsr98', 'хср', 'honkai', 'star rail'],
        views: 241360,
        rating: 5,
        ratings: 6120,
        favorited: 2610,
        honors: 10,
        links: 112,
        chapters: [
          [0, 'Студия «Блинчик»'],
          [2.5, 'Нить в темноте'],
          [5.9, '«Внимание всем постам!»'],
          [14.8, 'Что вы видите?'],
          [18.7, '«Разве вы не сами меня пригласили?»'],
          [25.8, 'Плакат «РОЗЫСК»'],
          [29.9, 'Лазерная сеть'],
          [37.9, 'Паутина так хрупка'],
          [43.4, 'Знак на груди'],
          [49.4, 'Катана, часы и коридор'],
          [62.4, 'Клинок из ножен и лифт'],
          [71.9, 'У судьбы тысячи лиц'],
          [82.9, 'Шлем и антракт'],
          [88.9, 'Руины под луной'],
          [95.4, 'Макгаффин и «Конец»'],
          [98.2, 'Орёл или решка?'],
          [108.5, 'Зонт у красных окон'],
          [114.0, 'Honkai: Star Rail 98']
        ],
        comments: [
          { user: 'web_of_fate', when: '1 минуту назад', text: '«Эта паутина так хрупка...» — и через секунду чёрно-белый зал покрывается розовыми кристаллами. Мурашки даже через колонки от Sound Blaster.' },
          { user: 'nagrada_10899', when: '2 минуты назад', text: 'Награда 10,899,000,000 кредитов. Пересчитал нули три раза, модем за это время успел переподключиться.' },
          { user: 'orel_ili_reshka', when: '3 минуты назад', text: 'Подбросил монетку перед экраном на 1:52. Выпала единица. Каков мой ответ? Крутить баннер!' },
          { user: 'blinchik_fan', when: '4 минуты назад', text: 'Студия «Блинчик» снова на высоте: «Бум» на 1:33 сказано так спокойно, что стало не по себе.' },
          { user: 'antrakt98', when: '5 минут назад', text: 'Макгаффин, нелинейная структура, онейрическая структура — посмотрел трейлер и сдал зачёт по драматургии.' }
        ]
      },
      {
        id: 'VladK4rt1nk',
        title: 'Влад Савельев картинки',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 28,
        category: 'people',
        description: 'Слайд-шоу из пяти картинок под музыку. Влад в полосатом свитере на деревенском лугу, пока рядом пасутся телята; в тёмных очках и чёрной кофте у стены с картиной; в кожанке на вечерней дороге вдоль бетонной стены с граффити; у чёрного седана с открытой дверью на заснеженной стоянке. А в конце аниме-девочка с геймпадом благодарит всех за внимание.\nЗаставка со звёздочкой, переходы крестом, клином, стрелкой, кругом и переворотом карточки — всё как полагается.',
        tags: ['влад', 'савельев', 'картинки', 'слайд-шоу', 'фото', 'корова', 'очки', 'седан', 'аниме', 'ебатория'],
        views: 27410,
        rating: 5,
        ratings: 734,
        favorited: 288,
        honors: 3,
        links: 22,
        chapters: [
          [0, 'Заставка'],
          [4.0, 'На лугу'],
          [7.2, 'У стены'],
          [10.5, 'На дороге'],
          [13.8, 'У машины'],
          [17.0, 'Спасибо за внимание!']
        ],
        comments: [
          { user: 'burenka_98', when: '1 минуту назад', text: 'Телёнок на первой картинке позирует лучше всех: даже голову от травы не поднял. Профессионал.' },
          { user: 'slaid_shou', when: '2 минуты назад', text: 'Переворот карточки на 0:16 я три вечера пытался повторить в монтажке. Так и не вышло, а тут красота.' },
          { user: 'ochki_noch', when: '3 минуты назад', text: 'Тёмные очки в комнате и вспышка в лицо — это стиль. Картина на стене тоже ничего.' },
          { user: 'zimnyaya_stoyanka', when: '4 минуты назад', text: 'Дверь открыта, рука на крыше, снег кругом. Готовая обложка для журнала про машины.' },
          { user: 'modem_33600', when: '5 минут назад', text: 'Двадцать секунд грузились дольше, чем Влад переодевался между картинками. И вам спасибо за внимание!' }
        ]
      },
      {
        id: 'cAtsBG3r34L',
        title: "Cats in Baldur's Gate 3 are too real",
        channel: 'memes_ytp',
        added: 'только что',
        order: 34,
        category: 'games',
        description: "Лагерь у рощи, рыжий пушистый кот Grub и заклинание «Разговор с животными». Герой хочет выяснить, чего кот так боится, а кот отвечает дрожащим голосом, смотрит снизу вверх огромными глазами, выгибает спину, стоит только спросить, можно ли его погладить, и отворачивается, когда речь заходит о маме своей хозяйки.\nДо самого конца он просит помочь не ему, а девочке, у которой живёт. Сорок шесть секунд, после которых хочется насыпать коту полную миску. Субтитры и варианты ответа — как в игре.",
        tags: ["baldur's gate 3", 'bg3', 'балдурс гейт', 'кот', 'котик', 'grub', 'разговор с животными', 'рыжий', 'мем', 'ytp', 'memes'],
        views: 158230,
        rating: 5,
        ratings: 4410,
        favorited: 2080,
        honors: 7,
        links: 71,
        chapters: [
          [0, 'Лагерь'],
          [2.6, "«I'm just a Cat!»"],
          [11.3, '«W-why are you so nosy?»'],
          [16.4, '«May I pet you?»'],
          [21.3, 'Что случилось с мамой хозяйки'],
          [29.8, 'Кот отворачивается'],
          [36.1, '«H-help her, not me!»'],
          [44.2, 'Leave.']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'Выбрал «May I pet you?», а кот выгнул спину и ответил «P-please don\'t». Теперь сначала спрашиваю разрешения у своего.' },
          { user: 'ryzhiy_kot98', when: '2 минуты назад', text: 'Мой рыжий смотрит снизу вверх точно так же, когда я открываю холодильник. И заикается тоже, только при виде пылесоса.' },
          { user: 'speak_with_animals', when: '3 минуты назад', text: 'Потратил ячейку заклинания на разговор с котом. Ни о чём не жалею.' },
          { user: 'nopenopenope', when: '4 минуты назад', text: 'На 0:30 он отворачивается, и я тоже отвернулся. Слишком грустно для мема.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Сорок шесть секунд грузились дольше, чем мой кот просит завтрак по утрам. Но усы на 0:37 стоили каждого килобайта.' }
        ]
      },
      {
        id: 'Ka1amBurg98',
        title: 'каламбург',
        channel: 'memes_ytp',
        added: 'только что',
        order: 37,
        category: 'comedy',
        description: 'Заставка юмористического журнала «Каламбург», перемонтированная до неузнаваемости. TELECOMPANY ADEK, «&», «or», карточки героев: Билли Бобс с пачками жвачки и Юрий Стояк в рамочке. Россия начнёт поставлять топинамбур в Китай, CAL внезапно становится CUM, а логотип ДТБ подлетает к самому экрану.\nДальше ведущий в бирюзовом пиджаке жалуется официанту на буфет, жуёт, подглядывает сквозь жалюзи, раздаёт пальцы-пистолетики и роняет кассеты, как домино. Нос из избы отрывает листок календаря, водитель КрАСа переключает передачи, пилот показывает «окей» обеими руками, а оператор радара видит в экране чужое лицо. Финал под krutoe pike music.\nДомашнее задание, слушай.',
        tags: ['каламбург', 'ytp', 'пуп', 'мем', 'заставка', 'журнал', 'ведущий', 'топинамбур', 'кассеты', 'пилот', 'радар', 'krutoe pike music', 'memes'],
        views: 312540,
        rating: 5,
        ratings: 7840,
        favorited: 3120,
        honors: 12,
        links: 140,
        chapters: [
          [0, 'TELECOMPANY ADEK'],
          [8.3, 'Билли Бобс'],
          [10.2, 'Юрий Стояк'],
          [12.6, 'Топинамбур в Китай'],
          [16.8, 'CAL… CUM'],
          [22.4, '«Это безобразие!»'],
          [27.6, 'Тем временем в закусочной'],
          [33.9, 'Жуёт'],
          [41.6, 'Потолок студии'],
          [44.6, 'Вас заметили'],
          [46.3, '«Здравствуйте, здравствуйте…»'],
          [57.2, 'Листатели календаря'],
          [61.5, '«Шутки, комитки и смеёмся»'],
          [68.2, 'Кассеты-домино'],
          [74.2, 'РЖУ шоу 6'],
          [84.0, 'Водитель КрАСа'],
          [92.4, 'Комик группа КрАС'],
          [96.6, 'Пилот'],
          [106.1, 'Радар'],
          [113.3, 'krutoe pike music']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'На 0:20 CAL превращается в CUM, и после этого я не могу спокойно смотреть ни одни титры.' },
          { user: 'topinambur98', when: '2 минуты назад', text: 'Россия начнёт поставлять топинамбур в Китай. Новость дня, недели и всего девяносто девятого года.' },
          { user: 'listatel_kalendarya', when: '3 минуты назад', text: '«Дорогие глупые великолепно расстроенные листатели» — так теперь начинаю каждое письмо коллегам.' },
          { user: 'domashnee_zadanie', when: '4 минуты назад', text: 'Домашнее задание, слушай. Пилот на 1:40 показывает «окей» обеими руками, и вопросов больше нет.' },
          { user: 'vas_zametili', when: '5 минут назад', text: 'ВАС ЗАМЕТИЛИ на 0:44. А потом ведущий подглядывает сквозь жалюзи, то есть заметили всё-таки его.' }
        ]
      },
      {
        id: 'H4rryG3rm4n',
        title: 'Гарри Поттер, если бы его снимала Валерия Гай Германика в 3D',
        channel: 'memes_ytp',
        added: 'только что',
        order: 32,
        category: 'comedy',
        description: 'Один урок в обычном кабинете школы Хогвартс, снятый трясущейся камерой в духе сериала «Школа». Гарри сидит за партой в Распределяющей шляпе, Гермиона в огромных очках выясняет, что это у него на голове, а в класс заходит Волан-де-Морт и уже который раз зовёт Гарри выйти поговорить.\nДальше по расписанию: Букля приносит конверт, Рон находит в нём «маховик времени и Нимбус 2000», Гарри достаёт из парты пушистый дневник с блестящим сердцем и устраивает внеклассное чтение, а Тёмный Лорд пытается отобрать свои записи. Кончается всё как в настоящей школе: слезами за последней партой.\nКамера на месте не стоит ни секунды. Если укачивает, делайте перемену.',
        tags: ['гарри поттер', 'harry potter', 'хогвартс', 'школа', 'германика', 'волан-де-морт', 'гермиона', 'рон', 'букля', 'дневник', 'распределяющая шляпа', 'пародия', 'ytp', 'memes'],
        views: 228640,
        rating: 4.5,
        ratings: 5320,
        favorited: 2210,
        honors: 9,
        links: 96,
        chapters: [
          [0, 'Что у Поттера на голове'],
          [9.4, 'Входит Волан-де-Морт'],
          [14.8, '«Может, выйдем?»'],
          [24.1, '«Ты чё за мной постоянно ходишь?»'],
          [34.9, 'Гермиона обиделась'],
          [38.4, 'Прилетела Букля'],
          [43.4, 'Конверт для Гарри'],
          [46.0, 'Рон заглядывает в письмо'],
          [56.9, '«Так вот она где, тайная комната!»'],
          [63.0, 'Волан-де-Морт недоволен'],
          [70.0, 'Шляпу долой'],
          [73.4, 'Пушистый дневник'],
          [82.0, 'Внеклассное чтение'],
          [90.6, '«Это дневник Тома Реддла»'],
          [98.5, '«Всё, Поттер, отдай!»'],
          [104.7, '«Не трогай моих Пожирателей смерти»'],
          [113.0, 'Фига Тёмному Лорду'],
          [119.3, '«Зачем так говорить?»'],
          [128.0, 'Волан-де-Морт уходит к двери'],
          [131.4, '«Галя, ты как?»'],
          [145.0, 'Школа Хогвартс']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'На 0:03 камера развернулась так резко, что я схватился за стол. Узнаю почерк режиссёра.' },
          { user: 'zakladka98', when: '2 минуты назад', text: '«Это маховик времени и Нимбус 2000» — Рон, у тебя в руках обычный бумажный конверт.' },
          { user: 'nopenopenope', when: '3 минуты назад', text: 'Волан-де-Морт два раза зовёт выйти и два раза получает отказ. Тёмный Лорд, а такой вежливый.' },
          { user: 'bukla_pochta', when: '4 минуты назад', text: 'Букля долетела до окна с первой попытки и не уронила письмо. Лучшая актриса ролика.' },
          { user: 'dnevnik_toma', when: '5 минут назад', text: 'Пушистый дневник с сердечком на 1:15 — теперь понятно, почему его так прятали от всей школы.' }
        ]
      },
      {
        id: 'Br3akBadRmx',
        title: 'Breaking Bad Remix (Seasons 3-5)',
        channel: 'memes_ytp',
        added: 'только что',
        order: 65,
        category: 'music',
        description: 'Песня, собранная из реплик третьего, четвёртого и пятого сезонов «Во все тяжкие». Хэнк распевает у машины и хохочет в салоне рядом с напарником, Сол Гудман пританцовывает в офисе и улыбается из рекламы на фоне «We the People», Джесси трогает котёл суперлаборатории и выдаёт фирменное «Yeah, b***h!». Уолтер Уайт напоминает, кто здесь стучится в дверь, требует назвать его имя посреди пустыни и спорит с Хэнком на разделённом экране.\nПотом доктор в хирургической маске подпевает «бом-бом», дон Эладио смеётся над бутылкой текилы, а финал достаётся Майку: «You are not the guy». Экран делится на половинки и четвертинки, кадры мигают в такт, и все слова взяты из оригинальных сцен. Ремикс: placeboing.',
        tags: ['breaking bad', 'во все тяжкие', 'remix', 'ремикс', 'heisenberg', 'хайзенберг', 'уолтер уайт', 'джесси', 'хэнк', 'сол гудман', 'майк', 'say my name', 'ytp', 'memes'],
        views: 341260,
        rating: 5,
        ratings: 8120,
        favorited: 3540,
        honors: 13,
        links: 152,
        chapters: [
          [0, 'Хэнк у машины'],
          [12.7, 'Хэнк смеётся в машине'],
          [14.1, 'Сол танцует в офисе'],
          [19.9, '«We the People»'],
          [21.0, 'Суперлаборатория'],
          [28.3, '«Yeah, b***h!»'],
          [34.7, '«I am the danger»'],
          [42.7, 'Четыре окна'],
          [48.5, '«Say my name»'],
          [57.4, '«Willy Wonka?»'],
          [65.9, '«My name is ASAC Schrader»'],
          [78.8, '«Just listen to me!»'],
          [90.9, 'Доктор и дон Эладио'],
          [104.8, '«You are not the guy»'],
          [112.1, 'Склад и бежевый внедорожник'],
          [118.7, 'Майк за рулём']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: '«Say my name» посреди пустыни, а через пару секунд «Willy Wonka?». Теперь не могу смотреть серьёзные сцены без этой мелодии.' },
          { user: 'zakladka98', when: '2 минуты назад', text: 'На 0:42 экран делится на четыре окна, и в каждом что-то своё. Пересматривал четыре раза, по одному окну за раз.' },
          { user: 'nopenopenope', when: '3 минуты назад', text: 'Майк в конце: «You are not the guy». Так теперь отвечаю всем, кто просит подменить их на дежурстве.' },
          { user: 'odin_kto_stuchit', when: '4 минуты назад', text: '«I am the one who knocks» звучит так, будто его записывали для хит-парада. А Сол в офисе танцует лучше всех.' },
          { user: 'modem_33600', when: '5 минут назад', text: 'Две с лишним минуты грузились полчаса. Зато Джесси на 0:32 подпрыгивает так, что модем подпрыгнул вместе с ним.' }
        ]
      },
      {
        id: 'St41rsD4nc3',
        title: 'Stairs Dance Complete Scene',
        channel: 'memes_ytp',
        added: 'только что',
        order: 70,
        category: 'film',
        description: 'Полная сцена с лестницей из «Джокера». Артур в красном костюме идёт по тёмному коридору, толкает железную дверь лифта и поворачивается к камере уже в гриме, а потом двери закрываются.\nДальше длинная каменная лестница между домами с пожарными лестницами. Артур спускается в танце, пинает воздух, кружится так, что пиджак взлетает, и курит, запрокинув голову к небу. Наверху появляются два детектива, один в плаще, другой в синем пиджаке, и Артур сбегает вниз, на улицу с горами мусорных мешков.\nВесь ролик идёт под один барабанный рок-н-ролл, от титра до последнего кадра.',
        tags: ['joker', 'джокер', 'stairs dance', 'танец на лестнице', 'лестница', 'артур флек', 'arthur fleck', 'танец', 'красный костюм', 'rock and roll', 'мем', 'ytp', 'memes'],
        views: 412580,
        rating: 5,
        ratings: 9640,
        favorited: 4210,
        honors: 15,
        links: 188,
        chapters: [
          [0, 'Титр'],
          [3.2, 'Коридор'],
          [9.7, 'Дверь лифта'],
          [15.6, 'Поворот к камере'],
          [21.3, 'Двери закрываются'],
          [23.5, 'Лестница'],
          [28.4, 'Сигарета'],
          [36.6, 'Танец на ступенях'],
          [50.8, 'Вид сверху'],
          [52.8, 'Смех'],
          [56.5, 'Навстречу камере'],
          [67.2, 'Пиджак взлетает'],
          [69.4, 'Дым в небо'],
          [78.3, 'Детективы'],
          [83.0, 'Побег'],
          [88.0, 'Улица']
        ],
        comments: [
          { user: 'ytp_collector', when: '1 минуту назад', text: 'Барабаны играют с первой секунды, а танцевать он начинает только на 0:24. Двадцать с лишним секунд чистого напряжения.' },
          { user: 'zakladka98', when: '2 минуты назад', text: 'На 1:07 пиджак взлетает так, что я пересмотрел три раза. Где достать костюм такого кирпичного цвета?' },
          { user: 'lestnica_98', when: '3 минуты назад', text: 'Теперь спускаюсь по лестнице в подъезде только так. Соседи здороваются через раз.' },
          { user: 'nopenopenope', when: '4 минуты назад', text: 'Детективы наверху на 1:19 смотрят ровно так, как моя мама, когда я танцую на кухне.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Полторы минуты грузились двадцать минут. Дым на 1:15 того стоил.' }
        ]
      },
      {
        id: 'Vl4dNaCTC98',
        title: 'Влад Савельев на СТС, но он реально на СТС',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 43,
        category: 'comedy',
        description: 'Заставка как у настоящей субботней передачи, только вместо актёров вся Планета Ебатории. Стрим с прайсом челленджей, кожанка у машины, кроксы, коза на фоне системника, падение на кровать, неоновый лимузин, пурга в аэропорту, заплыв в море, компания во дворе, сок из пакета, танцы под окнами южного посёлка, полотенце и лифчик за 900 рублей из того самого прайса.\nВсё под песню «Даёшь молодёжь!» и с золотым логотипом СТС в углу. А под конец выясняется, что Влада и правда показывали по телевизору. Правда, не на экранах России.',
        tags: ['влад', 'савельев', 'стс', 'даёшь молодёжь', 'заставка', 'телевизор', 'греция', 'лимузин', 'кроксы', 'ебатория'],
        views: 51230,
        rating: 5,
        ratings: 1290,
        favorited: 540,
        honors: 4,
        links: 37,
        chapters: [
          [0, 'Прайс челленджей'],
          [1.7, 'Кожанка у машины'],
          [2.2, 'Кроксы'],
          [3.4, 'Системник и коза'],
          [5.4, 'Падение на кровать'],
          [8.8, 'Неоновый лимузин'],
          [12.4, 'Пурга в аэропорту'],
          [16.0, 'Заплыв'],
          [20.1, '«Неудачников года»'],
          [23.4, 'Вся компания'],
          [27.1, 'Сок из пакета'],
          [30.6, '«Настроение в порядке»'],
          [34.3, '«От Москвы до Камчатки»'],
          [38.3, '«Отдыхаем красиво»'],
          [41.8, '«На экранах России»'],
          [45.1, 'Лифчик за 900 рублей']
        ],
        comments: [
          { user: 'dayosh_molodezh', when: '1 минуту назад', text: 'На «экранах России» подписали «*Греции» — перемотал три раза, чтобы убедиться, что мне не показалось.' },
          { user: 'zolotoy_logotip', when: '2 минуты назад', text: 'Золотые буквы в углу висят весь ролик, даже под водой. Вот это эфирная дисциплина.' },
          { user: 'praice_900r', when: '3 минуты назад', text: 'В прайсе на первой секунде «надеть лифчик на 5 мин 900р». Досмотрел до конца: донат отработан честно.' },
          { user: 'limuzin_98', when: '4 минуты назад', text: 'Неоновый лимузин на 0:10 ярче, чем вся новогодняя гирлянда у нас в подъезде.' },
          { user: 'modem_19200', when: '5 минут назад', text: 'Пятьдесят секунд грузились всю субботу. Зато теперь знаю заставку наизусть, как настоящую телепередачу.' }
        ]
      },
      {
        id: 'Vaz3l1nD4dy',
        title: 'я мажу жопу вазелином',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 47,
        category: 'comedy',
        description: 'Папа Джимми заходит в кафе к Сэму и спрашивает, работает ли музыкальный автомат. Сэм его как раз смазал, так что монетка летит в щель, свет гаснет, и начинается танец на весь зал: шахматный пол, белые туфли, пальцы-пистолеты, книга по истории, словарь с его портретом и прогулка по прилавку.\nСинди и Либби не верят своим глазам, Ник и Карл стоят у стойки, Бетти закрывает лицо руками, а Сэм ныряет под прилавок и выныривает уже с гитарой.\nОзвучка любительская, песня тоже не для детского утренника. Записано с канала «ПЯТАК».',
        tags: ['вазелин', 'хью', 'папа джимми', 'кафе сэма', 'музыкальный автомат', 'танец', 'белые туфли', 'пятак', 'мульт', 'ебатория'],
        views: 52740,
        rating: 5,
        ratings: 1318,
        favorited: 547,
        honors: 4,
        links: 37,
        chapters: [
          [0, '«Эй, дед, он работает?»'],
          [2, '«Я только что смазал его!»'],
          [4.5, '«Прекрасно. Немного музыки»'],
          [7, 'Монетка в автомат'],
          [8.9, 'Свет гаснет'],
          [10.5, 'Синди и Либби'],
          [13.6, 'Проход по шахматному полу'],
          [16.3, 'Первый куплет'],
          [20.2, 'Книга по истории'],
          [23.2, 'Белые туфли'],
          [26.6, 'Пальцы-пистолеты для Ника'],
          [28.4, 'Карл'],
          [30.2, 'Танец у стойки'],
          [35.2, 'Словарь'],
          [38.9, 'Бетти не выдержала'],
          [41.4, 'Зрители'],
          [45.5, 'На прилавок'],
          [46.6, 'Гитара']
        ],
        comments: [
          { user: 'smazchik_98', when: '1 минуту назад', text: '«Я только что смазал его!» — и автомат сразу заиграл. Вот что значит вовремя обслужить технику.' },
          { user: 'belye_tufli', when: '2 минуты назад', text: 'Белые туфли на шахматном полу на 0:24 — лучший кадр. Хочу такие же на выпускной.' },
          { user: 'slovar_na_polke', when: '3 минуты назад', text: 'Открыла словарь на 0:36, а он там уже танцует прямо в статье. Теперь понятно, у кого списывали иллюстрации.' },
          { user: 'sam_za_stoikoy', when: '4 минуты назад', text: 'Сэм нырнул под прилавок и через полсекунды вынырнул с красной гитарой. Вот это я понимаю обслуживание.' },
          { user: 'modem_33600', when: '5 минут назад', text: 'Сорок восемь секунд грузились двадцать минут. Досмотрел и полез в шкаф искать свои старые солнечные очки.' }
        ]
      },
      {
        id: 'Str4nnInTr0',
        title: 'Самое странное начало видео от Влада Савельева',
        channel: 'EbatoriyaPlanet',
        added: 'только что',
        order: 53,
        category: 'people',
        description: 'Стол накрыт: сосиски, варёная картошка, помидоры с огурцом, тосты и миска супа. Влад обходит кресло, садится и долго смотрит то на еду, то в камеру. Потом торжественно: «Всем здорова, комрады, подписчики, подписчицы, случайные зрители и зрительницы, с вами Влад Савельев, и это...» — встаёт и уходит к окну.\nПостояв там, возвращается, садится заново и всё-таки договаривает. Футболка Vladdy Komrady Club, одно кресло, один дубль.',
        tags: ['влад', 'савельев', 'мукбанг', 'интро', 'начало', 'комрады', 'сосиски', 'картошка', 'суп', 'ебатория'],
        views: 21480,
        rating: 4.5,
        ratings: 655,
        favorited: 214,
        honors: 2,
        links: 17,
        chapters: [
          [0, 'Обход вокруг кресла'],
          [5, 'Посадка за стол'],
          [7, 'Долгий взгляд на еду'],
          [11.5, 'Взгляд в камеру'],
          [18.9, '«Всем здорова, комрады»'],
          [24.6, '«...и это...»'],
          [28, 'Встал и ушёл'],
          [33.6, 'Пауза у окна'],
          [38.8, 'Возвращение'],
          [44, 'Вторая попытка'],
          [50.9, '«Всем здорова» ещё раз'],
          [56, '«...и это мукбанг!»']
        ],
        comments: [
          { user: 'mukbang_1999', when: '1 минуту назад', text: 'Полминуты смотрел на сосиски, потом ушёл к окну. Вот это я понимаю интрига.' },
          { user: 'komrad_podpischik', when: '2 минуты назад', text: 'Подписчики, подписчицы, случайные зрители и зрительницы — первый раз вижу, чтобы поздоровались вообще со всеми.' },
          { user: 'sosiska_v_teste', when: '3 минуты назад', text: 'На 0:25 «и это...» — и всё, встал и ушёл. Я чуть модем не перезагрузил, думал, связь оборвалась.' },
          { user: 'kartoshka_98', when: '4 минуты назад', text: 'Суп остывает, картошка остывает, а Влад стоит у окна. Самое странное начало, честно.' },
          { user: 'modem_14400', when: '5 минут назад', text: 'Минуту грузил ради слова «мукбанг» в самом конце. Ни о чём не жалею, жду серию, где он наконец поест.' }
        ]
      },
      {
        id: 'S4iraSuP0sm',
        title: 'Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево.',
        channel: 'ShosumPosum',
        added: 'только что',
        order: 69,
        category: 'howto',
        description: 'Повторяю легендарный суп из сайры Влада Савельева. Рецепт в оригинале короткий: вскипятить воду и выложить туда банку сайры в томатном соусе. Только сайры в томате не нашлось ни в одном магазине в округе, так что сначала делаю её сам: обычная сайра на сковородку, сверху томатный соус, всё раздавить ложкой и в кастрюлю.\nДальше по оригиналу: маринованные помидоры, мытый помидор целиком и рассол вместо компота. Потом моя версия «Делюкс» с картошкой и луком, майонез для самых смелых и напоследок дичайшее хрючево из сухой лапши, сайры и томатной пасты прямо в микроволновке.\nПриятного аппетита, бандиты, и хорошей недели!',
        tags: ['сайра', 'суп', 'влад', 'савельев', 'рецепт', 'готовка', 'хрючево', 'томатный соус', 'делюкс', 'лапша', 'shosum posum'],
        views: 38760,
        rating: 4.5,
        ratings: 912,
        favorited: 341,
        honors: 3,
        links: 28,
        chapters: [
          [0, 'Тарелочки поближе'],
          [13.4, 'Оригинал за двадцать секунд'],
          [24.6, 'Сайры в томате нигде нет'],
          [38.0, 'Тейст-тест'],
          [46.5, 'Всё на сковородку'],
          [58.8, '180 граммов соуса'],
          [77.1, 'Перемешиваем'],
          [83.8, 'Как варил Влад'],
          [89.1, 'Давим ложкой'],
          [104.5, 'Время пробовать'],
          [109.1, 'В кастрюльку'],
          [133.9, 'Влад пробует'],
          [153.1, 'Из кастрюли в формочку'],
          [178.9, 'Пробуем первый вариант'],
          [205.4, 'Маринованные помидоры'],
          [231.7, 'Запить рассолом'],
          [243.8, 'Ритуал стучания по стеклу'],
          [290.8, 'Мытый помидор'],
          [339.4, 'Лук и чеснок'],
          [348.8, 'Суп Савельева Делюкс'],
          [405.6, 'Пробуем Делюкс'],
          [430.4, 'Может, майонез?'],
          [476.6, 'Хрючево из лапши'],
          [516.0, 'Помянем микроволновку'],
          [523.6, 'Дегустация хрючева'],
          [549.5, 'Итоги'],
          [605.0, 'Приятного аппетита, бандиты!']
        ],
        comments: [
          { user: 'sairoed_98', when: '1 минуту назад', text: 'Обошёл десяток магазинов и не нашёл сайру в томате — узнаю свой район. У нас её тоже разбирают раньше, чем завозят.' },
          { user: 'banditka_na_kuhne', when: '2 минуты назад', text: '«Ритуал стучания по стеклу соблюдаю» — теперь стучу по каждой банке, даже если она открывается сама.' },
          { user: 'deluxe_kartoshka', when: '3 минуты назад', text: 'Версия «Делюкс» с картошкой и луком выглядит как нормальный суп. Повторил, семья подвоха не заметила.' },
          { user: 'mikrovolnovka_rip', when: '4 минуты назад', text: 'Минута молчания по микроволновке на 8:43. Брызги на потолке видно даже на нашем четырнадцатидюймовом мониторе.' },
          { user: 'modem_33600_kot', when: '5 минут назад', text: 'Десять минут грузились всю ночь, а лучший кадр — рыжий кот, который на 2:24 гуляет по кровати мимо кастрюли.' }
        ]
      },
      {
        id: 'P4radB3dy98',
        title: 'Парад беды - STALKER',
        channel: 'Eptable',
        added: 'только что',
        order: 73,
        category: 'games',
        description: 'Деревня новичков на Кордоне, только вместо сталкеров — парад. Зелёные огры в набедренных повязках, Флинт в синем костюме с фиолетовым галстуком, ржавый рупор на палке, БТР и легковушки, которые скачут по дороге, гигантские банки тушёнки, стиральные машины и целая колонна унитазов.\nСначала болт, потом ППШ. Отстреливаюсь от бытовой техники в переулке, убегаю в поле, где жёлтый БТР встаёт на попа прямо под мёртвым деревом с вертолётом. А в конце — разговор с Флинтом во дворе у синего дома и бочка с огнём. Разговор вышел короткий.',
        tags: ['сталкер', 'stalker', 'парад беды', 'кордон', 'флинт', 'огры', 'унитазы', 'стиральные машины', 'ппш', 'моды', 'eptable'],
        views: 33410,
        rating: 4.5,
        ratings: 871,
        favorited: 302,
        honors: 3,
        links: 24,
        chapters: [
          [0, 'Деревня новичков'],
          [7, 'Огры, Флинт и рупор'],
          [13, 'Парад: БТР и легковушки'],
          [15.8, 'Банки и стиральные машины'],
          [19.8, 'Колонна унитазов'],
          [24.4, '«Бери оружие»'],
          [28.3, 'ППШ вместо болта'],
          [32, 'Огр убегает'],
          [35.3, 'Стиралка на дороге'],
          [39.5, 'Отступаю по переулку'],
          [44.5, 'Атака бытовой техники'],
          [52.4, 'Обратно к дому'],
          [55.6, 'В поле'],
          [61.5, 'Летающие унитазы на холме'],
          [70, 'БТР встаёт на попа'],
          [72.8, '«Используй болты»'],
          [78, 'Двор у синего дома'],
          [79.5, 'Флинт бежит навстречу'],
          [82.6, 'Разговор окончен'],
          [87, 'Тащу к бочке'],
          [95, 'Вспышка'],
          [96, 'Флинт в бочке']
        ],
        comments: [
          { user: 'bolt_metatel', when: '1 минуту назад', text: '«Кто такой есть Флинт» — и тут же Флинт в костюме стоит между двумя ограми. Вопрос снят.' },
          { user: 'unitaz_1999', when: '2 минуты назад', text: 'Колонна унитазов на 0:22 марширует ровнее, чем наш класс на линейке.' },
          { user: 'kordon_novichok', when: '3 минуты назад', text: 'Стиральная машина прилетела прямо в лицо на 0:44. Отжим на тысячу оборотов, не иначе.' },
          { user: 'zhelty_btr', when: '4 минуты назад', text: 'Жёлтый БТР на попа под мёртвым деревом на 1:11 — готовая обложка для игрового журнала.' },
          { user: 'modem_28800', when: '5 минут назад', text: 'Полторы минуты грузились целый вечер. Теперь болты кидаю только из-за угла: вдруг там рупор.' }
        ]
      },
      {
        id: 'D0wngr4d3Ed',
        title: 'STALKER - Downgrade Edition Trailer',
        channel: 'Eptable',
        added: 'только что',
        order: 80,
        category: 'games',
        description: 'Трейлер переиздания, которого мы все заслужили. Рейтинг 3+, сделано в Чехии силами русского аутсорса, а вместо логотипа из сортира в бункере выходит огр и сладко потягивается.\nДальше всё по-честному, с подписями: классическая Зона, устаревшая и ухудшенная. Оригинал в 640x320 против «8K», которое выглядит как запотевшие очки, поддержка геймпада, вырезанная русская озвучка, лучи выключены, а кадров в секунду стало тридцать. Старые и новые баги на месте: сталкер без рук в инвентаре и сталкер в бочке с огнём. В конце знак ЧАЭС пропадает вместе с серпом и молотом, а саркофаг превращается в сарай с тремя трубами.',
        tags: ['сталкер', 'stalker', 'downgrade', 'даунгрейд', 'трейлер', 'переиздание', 'чаэс', 'припять', 'кордон', 'огр', 'eptable'],
        views: 18760,
        rating: 4.5,
        ratings: 642,
        favorited: 219,
        honors: 2,
        links: 17,
        chapters: [
          [0, 'Рейтинг 3+'],
          [2.45, 'Сделано в Чехии'],
          [5.24, 'Огр выходит из сортира'],
          [10.25, 'Классическая Зона'],
          [13.81, 'Военные в экзоскелетах'],
          [15.97, 'Колесо обозрения'],
          [18.62, 'Downgrade Edition'],
          [24.27, 'Оригинал 640x320'],
          [26.86, 'Downgrade 8K'],
          [29.86, 'Поддержка геймпада'],
          [33.93, 'Грузовик и бандит'],
          [36.29, 'Русская озвучка вырезана'],
          [41.37, 'Лучи выключены'],
          [43.84, 'Тридцать кадров'],
          [46.55, 'Старые и новые баги'],
          [49.3, 'Инвентарь'],
          [51.73, 'Сталкер в бочке'],
          [55.04, 'Тревога: серп и молот'],
          [57.72, 'Знак ЧАЭС'],
          [61.18, 'Декоммунизация'],
          [64.46, 'Саркофаг'],
          [68.33, 'Деиндустриализация']
        ],
        comments: [
          { user: 'pegas_3plus', when: '1 минуту назад', text: 'Огр из сортира вместо заставки на 0:05 — лучшее начало трейлера, которое я видел. Потягивается прямо как я перед школой.' },
          { user: 'kordon_640x320', when: '2 минуты назад', text: '«Оригинал 640x320» чётче, чем «8K» на 0:27. У меня монитор четырнадцать дюймов, и даже на нём видно.' },
          { user: 'gamepad_na_kordone', when: '3 минуты назад', text: 'Поддержка геймпада на 0:30, а бандит всё равно подходит вплотную. Видно, тоже с геймпадом играет.' },
          { user: 'bochka_bolt', when: '4 минуты назад', text: 'Сталкер в бочке на 0:52 — это не баг, это он так греется. Новичку на Кордоне так и объясняли.' },
          { user: 'modem_33600_zona', when: '5 минут назад', text: 'Минута двенадцать секунд грузилась сорок минут. Саркофаг в конце превратился в сарай, а у меня телефонная линия освободилась.' }
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
