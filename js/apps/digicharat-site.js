class DiGiCharatSite {
  constructor() {
    this.baseUrl = 'http://www.digicharat.net';
    this.currentSection = 'news';
    this.currentEpisode = 1;
    this.currentSubtitleTrack = 'eng';
    this.subsData = null;
    this.activeCueText = '';
    this.activeCueClass = '';

    this.newsCommentsKey = 'win98_digi_news_comments_v1';
    this.videoRatingsKey = 'win98_digi_video_ratings_v1';
    this.videoCommentsKey = 'win98_digi_video_comments_v1';
    this.guestbookKey = 'win98_digi_guestbook_v1';
    this.hitsKey = 'win98_digi_hits_v1';

    this.musicPlaying = false;
    this.musicAudio = null;
    this.vizInterval = null;
    this.playerVolume = 0.8;

    this.loadSubtitles();

    this.episodes = [
      {
        id: 1,
        num: '01',
        title: 'Dejiko is Here-nyo!',
        jpTitle: 'でじこが来たにょ (Dejiko ga kita-nyo)',
        date: 'Nov 29, 1999',
        src: 'content/digi/video/DiGi Charat - 01_144p.mkv',
        desc: 'Princess Di Gi Charat (Dejiko), her younger sister-figure Puchiko, and their balloon-shaped guardian Gema crash-land in Akihabara from Planet Di Gi Charat with big dreams of becoming a legendary superstar idol! With zero yen in their pockets and facing homelessness on the cold city streets, they stumble upon the Gamers hobby shop, where the generous Mr. Manager offers them a free upstairs room in exchange for working as shop girls.'
      },
      {
        id: 2,
        num: '02',
        title: 'Call Me Rabi-en-Rose',
        jpTitle: 'ラ・ビ・アン・ローズと呼びなさい (Rabi-an-Rozu to Yobinasai)',
        date: 'Nov 30, 1999',
        src: 'content/digi/video/DiGi Charat - 02_144p.mkv',
        desc: "Dejiko's self-proclaimed arch-rival Rabi-en-Rose (real name Hikaru Usada) makes her dramatic entrance! Flashing giant bunny ears, oversized dice hair ornaments, and an ego larger than Akihabara, she claims to be the true idol of the electrical town. Dejiko ruthlessly mocks her real name 'Usada', sparking a fierce rivalry of sharp tongues and cartoon violence."
      },
      {
        id: 3,
        num: '03',
        title: 'A Scary Store?',
        jpTitle: 'こわいお店? (Kowai Omise?)',
        date: 'Dec 01, 1999',
        src: 'content/digi/video/DiGi Charat - 03_144p.mkv',
        desc: 'A nervous young schoolboy searching for rare collectible trading cards nervously enters the Gamers store. Rabi-en-Rose attempts to showcase her angelic customer service to win him over, but Dejiko and Puchiko interpret the interaction as a hostage negotiation, turning the routine visit into pure surreal terror.'
      },
      {
        id: 4,
        num: '04',
        title: 'What Is It Like?',
        jpTitle: 'なにがなにやら? (Nani ga nani yara?)',
        date: 'Dec 02, 1999',
        src: 'content/digi/video/DiGi Charat - 04_144p.mkv',
        desc: 'Two hardcore otaku fanboys, Takeshi and Yoshimi, arrive at Gamers on a quest for the newest anime character goods. The moment they lay eyes on Dejiko in her maid cat outfit, they fall into an instant trance of fanatical devotion, completely ignoring Gema’s stern warnings about her explosive temper.'
      },
      {
        id: 5,
        num: '05',
        title: "She's Long and Thin-nyo",
        jpTitle: '細くて長〜いのにょ (Hosokute nagai no-nyo)',
        date: 'Dec 06, 1999',
        src: 'content/digi/video/DiGi Charat - 05_144p.mkv',
        desc: 'A bizarre, exceedingly tall and lanky foreign customer walks through the front door of Gamers. Dejiko and Puchiko attempt their very best intercultural hospitality, leading to ridiculous misunderstandings, slapstick miscommunications, and Gema taking the brunt of every accident.'
      },
      {
        id: 6,
        num: '06',
        title: "The Eye Beam Won't Come Out-nyo",
        jpTitle: 'ビームが出ないにょ (Biimu ga denai-nyo)',
        date: 'Dec 07, 1999',
        src: 'content/digi/video/DiGi Charat - 06_144p.mkv',
        desc: "Catastrophe strikes! When Gema annoys Dejiko as usual, she prepares to blast him into oblivion with her signature superpower: the destructive Eye Beam ('Me kara Biimu'). But horror unfolds when only sad sparks flicker out! Dejiko embarks on an intense, hilarious regimen of ridiculous physical workouts to restore her lethal laser gaze."
      },
      {
        id: 7,
        num: '07',
        title: "Puchiko's Secret",
        jpTitle: 'ぷちこの秘密 (Puchiko no himitsu)',
        date: 'Dec 08, 1999',
        src: 'content/digi/video/DiGi Charat - 07_144p.mkv',
        desc: 'While Dejiko naps lazily behind the register, the spotlight turns to the quiet and enigmatic five-year-old Petit Charat (Puchiko). Viewers discover her strange daily routines, her stoic observations of human folly, and the mysterious charm behind her classic verbal tic: -nyu!'
      },
      {
        id: 8,
        num: '08',
        title: "Puchiko's Eye Beam",
        jpTitle: 'ぷちこのビーム (Puchiko no biimu)',
        date: 'Dec 09, 1999',
        src: 'content/digi/video/DiGi Charat - 08_144p.mkv',
        desc: "Inspired by Dejiko, Puchiko decides it is high time to awaken her own destructive Eye Beam! However, lacking Dejiko's sheer chaotic malice, Puchiko's attempts result in high-pressure water spouts and unexpected objects spraying out of her eyes, thoroughly soaking Gamers and everyone inside."
      },
      {
        id: 9,
        num: '09',
        title: 'Romantic in a Way',
        jpTitle: 'それなりにロマンチック (Sorenari ni Romanchikku)',
        date: 'Dec 13, 1999',
        src: 'content/digi/video/DiGi Charat - 09_144p.mkv',
        desc: 'Minagawa falls sick on the pavement and is tenderly rescued by Hikaru Usada in her ordinary, glasses-wearing middle-school girl guise. She opens up about her impoverished family, her part-time jobs, and her stubborn dream of rising from hardship to become the galaxy’s brightest star.'
      },
      {
        id: 10,
        num: '10',
        title: 'Imposter Dejiko Appears!',
        jpTitle: 'にせでじこ現る! (Nise Dejiko Arawaru!)',
        date: 'Dec 14, 1999',
        src: 'content/digi/video/DiGi Charat - 10_144p.mkv',
        desc: 'Akihabara is terrorized by a masked thief claiming to be Di Gi Charat! When Minagawa is robbed and points the finger straight at Dejiko, our cat-girl princess must take to the streets in fury to track down the counterfeit Dejiko and defend her sacred brand name!'
      },
      {
        id: 11,
        num: '11',
        title: 'Warm Fluffy Rice-nyo',
        jpTitle: 'ホカホカご飯にょ (Hoka Hoka Gohan-nyo)',
        date: 'Dec 15, 1999',
        src: 'content/digi/video/DiGi Charat - 11_144p.mkv',
        desc: 'With no salary yet and stomachs rumbling loudly in the dark, Dejiko and Puchiko sink into deep hunger delirium. Together, they conjure up vivid, poetic, tear-jerking hallucinations of freshly steamed, glistening white rice with savory toppings in an unforgettable ode to empty bellies.'
      },
      {
        id: 12,
        num: '12',
        title: 'Monsters and Stuff Appear!',
        jpTitle: '怪獣その他現る! (Kaiju Sonota Arawaru!)',
        date: 'Dec 16, 1999',
        src: 'content/digi/video/DiGi Charat - 12_144p.mkv',
        desc: 'A colossal kaiju suddenly rises from Tokyo Bay and marches straight toward Akihabara, threatening to crush the Gamers store into rubble! With her cozy home and idol future on the line, Dejiko unleashes 100% of her Eye Beam in an epic, over-the-top sci-fi showdown.'
      },
      {
        id: 13,
        num: '13',
        title: "I'm Possessed-nyo",
        jpTitle: 'とりつかれたにょ (Toritsuka Reta-nyo)',
        date: 'Dec 20, 1999',
        src: 'content/digi/video/DiGi Charat - 13_144p.mkv',
        desc: 'Dejiko begins behaving even more wildly and erratically than usual after being possessed by a vengeful clam spirit! Minagawa, Gema, and Puchiko team up to conduct an impromptu, utterly unhinged Akihabara exorcism to liberate Dejiko from the seafood curse.'
      },
      {
        id: 14,
        num: '14',
        title: 'Abarenbou Comes to Town',
        jpTitle: '暴れん坊がやってきた (Abarenbo ga yattekita)',
        date: 'Dec 21, 1999',
        src: 'content/digi/video/DiGi Charat - 14_144p.mkv',
        desc: 'The unstoppable, incoherent force of nature known as Abarenbou crashes through the front doors of Gamers! As merchandise flies and counters shatter, Dejiko meets her chaotic match in an all-out slapstick brawl for survival.'
      },
      {
        id: 15,
        num: '15',
        title: 'PARTY NIGHT (Music Special)',
        jpTitle: 'PARTY NIGHT (ミュージックビデオ)',
        date: 'Dec 22, 1999',
        src: 'content/digi/video/DiGi Charat - 15_144p.mkv',
        desc: "The show-stopping animated music video for the iconic anthem 'PARTY NIGHT'! Packed with relentless visual gags, flashing neon disco floors, Eurobeat synths, and all characters dancing at maximum speed, this episode remains one of the most legendary anime music videos of the 1990s."
      },
      {
        id: 16,
        num: '16',
        title: 'Usada Explodes',
        jpTitle: 'うさだ大爆発 (Usada Daibakuhatsu)',
        date: 'Dec 23, 1999',
        src: 'content/digi/video/DiGi Charat - 16_144p.mkv',
        desc: "It is Christmas Eve in Akihabara! In an uncharacteristically generous mood, Dejiko presents Rabi-en-Rose with a homemade holiday fruitcake. But the cake is rigged with dangerous explosives, culminating in a spectacular, hilarious fireworks finale to conclude the original TV series!"
      }
    ];

    this.newsArticles = [
      {
        id: 'news_1',
        title: 'Di Gi Charat TV Series Debuts on TBS Late-Night Variety "Wonderful"!',
        date: 'Nov 29, 1999',
        author: 'AkibaWebmaster',
        body: `
          <p>The moment anime fans and Akihabara shoppers have been waiting for has finally arrived! Tonight, November 29, 1999, the premiere episode of <b>Di Gi Charat</b> aired as part of the late-night TBS program <i>Wonderful</i>!</p>
          <p>Produced by the prestigious <b>Studio Madhouse</b> and directed by the comedy genius <b>Hiroaki Sakurai</b>, each 3-minute episode delivers frantic, lightning-fast surreal humor, dazzling chibi character animation, and the unforgettable voice acting of newcomer <b>Asami Sanada</b> as Dejiko, 14-year-old prodigy <b>Miyuki Sawashiro</b> as Puchiko, and <b>Kyoko Hikami</b> as Rabi~en~Rose!</p>
          <p>Broadcast schedule: Monday through Thursday at 23:55 JST. Don't miss a single second, nyo!</p>
        `
      },
      {
        id: 'news_2',
        title: 'Hit Theme Song "PARTY NIGHT" CD Single Hits Akihabara Shelves!',
        date: 'Dec 15, 1999',
        author: 'GemaFan_01',
        body: `
          <p>Gamers stores across Tokyo and Osaka report massive queues around the block for the release of the official Di Gi Charat maxi single <b>"PARTY NIGHT"</b>! Composed and arranged by Toshio Masuda with hyperactive lyrics by Yuki Mori, this Eurobeat/J-Pop hybrid is already blasting through every sound system in the Akihabara Electric Town.</p>
          <p>The single features vocal performances by D.U.P. (Dejiko, Usada, Puchiko). The track is included in our site's <b>Music Vault</b>—crank up your PC speakers and party like it's 1999!</p>
        `
      },
      {
        id: 'news_3',
        title: 'Broccoli Announces Grand Opening of Akihabara Gamers Flagship Store!',
        date: 'Dec 05, 1999',
        author: 'BroccoliInsider',
        body: `
          <p>Broccoli Co., Ltd. has officially unveiled the redesigned <b>Gamers Akihabara Headquarters</b>, featuring full-scale life-size cardboard cutouts of Dejiko, Puchiko, and Gema welcoming customers at the entrance!</p>
          <p>Exclusive character goods including telephone cards, trading cards, posters, and limited-edition cat-ear bonnets are now available. If you're visiting Akihabara this winter, make Gamers your first stop!</p>
        `
      },
      {
        id: 'news_4',
        title: 'D.U.P. Live Seiyuu Concert & Di Gi Charat Summer Special Teased for 2000!',
        date: 'Dec 24, 1999',
        author: 'AnimeExpress',
        body: `
          <p>Following the tremendous ratings and cultural impact of the 16-episode TV broadcast, Broccoli CEO Takaaki Kidani hinted at a major press conference today that the Di Gi Charat saga has only just begun! Plans are already underway for a <b>Summer 2000 OVA Special</b>, radio dramas, and a live stage concert featuring Asami Sanada, Miyuki Sawashiro, and Kyoko Hikami!</p>
          <p>Stay tuned to this fan club website for all the breaking news as we step into the year 2000!</p>
        `
      }
    ];

    this.galleryImages = [
      {
        id: 1,
        title: 'Dejiko & Puchiko - Key Visual',
        src: 'content/digi/pic/1.jpg',
        w: 583,
        h: 614,
        kb: 52,
        desc: 'Official character promo visual created by character designer Koge-Donbo for the launch of the TBS television broadcast.'
      },
      {
        id: 2,
        title: 'Rabi~en~Rose (Hikaru Usada) Standee',
        src: 'content/digi/pic/2.jpg',
        w: 411,
        h: 640,
        kb: 34,
        desc: 'Promotional idol standee of Dejiko\'s self-appointed rival, sporting her signature bunny ears and dice ornaments.'
      },
      {
        id: 3,
        title: 'Akihabara Gamers Trio at Storefront',
        src: 'content/digi/pic/3.jpg',
        w: 480,
        h: 360,
        kb: 34,
        desc: 'Dejiko, Puchiko, and Gema posing proudly outside the Akihabara Gamers retail store.'
      },
      {
        id: 4,
        title: 'Dejiko "Me kara Biimu" Eye Beam Blast',
        src: 'content/digi/pic/4.jpg',
        w: 480,
        h: 360,
        kb: 13,
        desc: 'Classic scene capture of Dejiko unleashing her terrifying eye laser beam attack to annihilate everything in sight.'
      },
      {
        id: 5,
        title: 'Petit Charat (Puchiko) Mascot Card',
        src: 'content/digi/pic/5.jpg',
        w: 320,
        h: 240,
        kb: 63,
        desc: 'Rare vintage telephone card artwork featuring the quiet brown-haired capuccino kitten, Puchiko.'
      }
    ];
  }

  async loadSubtitles() {
    try {
      const res = await fetch('content/digi/video/subs.json');
      if (res.ok) {
        this.subsData = await res.json();
      }
    } catch (e) {
      console.warn('Could not load subs.json directly, fallback available:', e);
    }
  }

  esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  bell() {
    return this.gif('bell');
  }

  link(path, label, attrs = '') {
    return `<a data-url="${this.baseUrl}${path}"${attrs}>${label}</a>`;
  }

  parseUrl(url) {
    const clean = String(url || '').toLowerCase().replace(/^https?:\/\/[^/]+/, '');
    const param = (name) => {
      const m = clean.match(new RegExp(`[?&]${name}=([a-z0-9_]+)`));
      return m ? m[1] : '';
    };
    const section = /^\/(episodes|video)/.test(clean) ? 'episodes'
      : /^\/(gallery|pic)/.test(clean) ? 'gallery'
      : /^\/(music|mp3)/.test(clean) ? 'music'
      : /^\/(about|characters)/.test(clean) ? 'about'
      : /^\/guestbook/.test(clean) ? 'guestbook'
      : 'news';
    return { section, ep: parseInt(param('ep'), 10), pic: parseInt(param('pic'), 10), article: param('id') };
  }

  renderSite(url = this.baseUrl) {
    const route = this.parseUrl(url);
    this.currentSection = route.section;
    if (this.episodes.some(e => e.id === route.ep)) this.currentEpisode = route.ep;
    const pages = {
      news: () => (route.article ? this.renderArticle(route.article) : this.renderNewsSection()),
      episodes: () => this.renderEpisodesSection(),
      gallery: () => (route.pic ? this.renderPicture(route.pic) : this.renderGallerySection()),
      music: () => this.renderMusicSection(),
      about: () => this.renderAboutSection(),
      guestbook: () => this.renderGuestbookSection()
    };
    this.isFrontPage = route.section === 'news' && !route.article;
    const body = pages[route.section]();
    return `
      <div class="dg-page">
        <table class="dg-sheet" cellspacing="0" cellpadding="0">
          <tr><td class="dg-ticker"><marquee scrollamount="3">Welcome to Planet Di Gi Charat! All 16 episodes are online with English and Russian subtitles. "Party Night" single out now at Gamers Akihabara. Me kara biimu, nyo!</marquee></td></tr>
          <tr><td class="dg-head">${this.renderHead()}</td></tr>
          <tr><td class="dg-lace"></td></tr>
          <tr><td class="dg-body">${body}</td></tr>
          <tr><td class="dg-foot">${this.renderFoot()}</td></tr>
        </table>
      </div>`;
  }

  renderHead() {
    const cast = [
      ['news', '', 'gema', 'News', 'Gema', 'Read the latest news, gema!'],
      ['episodes', '/episodes', 'dejiko', 'Episodes', 'Dejiko', 'Watch all 16 episodes, nyo!'],
      ['music', '/music', 'puchiko', 'Party Night', 'Puchiko', 'Listen to our song... nyu.'],
      ['gallery', '/gallery', 'rabi', 'Gallery', 'Rabi~en~Rose', 'Look at my photos! And call me Rabi~en~Rose!']
    ];
    const sub = (path, label, section) => this.link(path, label, this.currentSection === section ? ' class="is-current"' : '');
    return `
      <div class="dg-title">Di Gi Charat Fan Club</div>
      <div class="dg-title-jp">デ・ジ・キャラット 英語ファンクラブ &nbsp;&nbsp; since 1999.11.29</div>
      <table class="dg-cast" cellspacing="0">
        <tr>
          ${cast.map(([section, path, sprite, label, who, tip]) => `
          <td class="dg-cast-cell">
            <a class="dg-cast-link${this.currentSection === section ? ' is-current' : ''}" data-url="${this.baseUrl}${path}" title="${who}: ${tip}">
              <span class="dg-cast-sprite">${this.gif(sprite, 2)}</span>
              <span class="dg-cast-label">${label}</span>
            </a>
            <div class="dg-cast-who">${who}</div>
          </td>`).join('')}
        </tr>
      </table>
      <div class="dg-sublinks">[ ${sub('/about', 'Characters &amp; Staff', 'about')} ] &nbsp; [ ${sub('/guestbook', 'Guestbook', 'guestbook')} ]</div>`;
  }

  visitCount(countThisVisit) {
    let hits = 42199;
    try {
      hits = parseInt(localStorage.getItem(this.hitsKey) || '42199', 10);
      if (countThisVisit) localStorage.setItem(this.hitsKey, String(++hits));
    } catch (e) {}
    return hits;
  }

  renderFoot() {
    const hits = this.visitCount(this.isFrontPage);
    const ring = window.retroSites && window.retroSites.getWebRingSites ? window.retroSites.getWebRingSites() : [];
    const here = ring.findIndex(s => s.url === this.baseUrl);
    const prev = here >= 0 ? ring[(here - 1 + ring.length) % ring.length] : null;
    const next = here >= 0 ? ring[(here + 1) % ring.length] : null;
    return `
      <table class="dg-foot-grid" cellspacing="0">
        <tr>
          <td class="dg-foot-count">
            You are visitor <span class="dg-counter">${String(hits).padStart(6, '0')}</span><br>
            <small>Kiriban 44444: if you hit it, sign the guestbook and Dejiko sends you a wallpaper!</small>
          </td>
          <td class="dg-foot-banner">
            <span class="dg-banner">${this.gif('dejiko')}<span>DI GI CHARAT<br>FAN CLUB</span></span>
            <div><small>Link free! Please use this banner.</small></div>
          </td>
        </tr>
      </table>
      ${prev && next ? `<div class="dg-ring">${this.bell()} <b>Otaku WebRing 1999</b> &nbsp; [ <a data-url="${prev.url}" title="${this.esc(prev.name)}">&laquo; Prev</a> | <a data-url="${next.url}" title="${this.esc(next.name)}">Next &raquo;</a> ]</div>` : ''}
      <address class="dg-copy">Di Gi Charat &copy; 1999 Broccoli / TBS / Madhouse / Koge-Donbo. Non-profit fan club run by fans for otaku worldwide.<br>Webmaster: <a href="mailto:dejikosan99@digicharat.net">DejikoSan_99</a> &nbsp; Best viewed with Internet Explorer 5.0 at 800x600.</address>`;
  }

  renderNewsSection() {
    const saved = this.getNewsComments();
    const updates = [
      ['1999.12.24', '', 'News: D.U.P. live concert and a Summer 2000 special announced.'],
      ['1999.12.23', '/episodes?ep=16', 'Episodes: episode 16 is online. All 16 episodes are here!'],
      ['1999.12.15', '/music', 'Party Night: lyrics with English translation.'],
      ['1999.12.05', '/gallery', 'Gallery: five new scans.'],
      ['1999.11.29', '/guestbook', 'The fan club opened. Please sign the guestbook!']
    ];
    return `
      <table class="dg-welcome" cellspacing="0">
        <tr>
          <td class="dg-welcome-art"><img src="content/digi/pic/1.jpg" width="110" height="116" alt="Dejiko"></td>
          <td>
            <h1 class="dg-h1">Welcome, nyo!</h1>
            <p>This is the English-language fan club of <b>Di Gi Charat</b>, the Gamers shop mascot who became a TV star. Watch all 16 episodes with subtitles, listen to "Party Night" and meet the whole cast.</p>
            <p class="dg-small">We update every week. Last update: 1999.12.24.</p>
          </td>
        </tr>
      </table>
      <h2 class="dg-h">${this.bell()} What's new</h2>
      <table class="dg-updates" cellspacing="0">
        ${updates.map(([date, path, text], i) => `
        <tr><td class="dg-date">${date}</td><td>${path ? this.link(path, text) : text}${i === 0 ? ' <span class="web-new">NEW!</span>' : ''}</td></tr>`).join('')}
      </table>
      <h2 class="dg-h">${this.bell()} News from Akihabara</h2>
      ${this.newsArticles.map(a => {
        const count = (saved[a.id] || this.getDefaultNewsComments(a.id)).length;
        return `
      <div class="dg-news">
        <h3 class="dg-news-title">${a.title}</h3>
        <div class="dg-news-meta">Posted by <b>${a.author}</b> on ${a.date}</div>
        ${a.body}
        <div class="dg-news-more">${this.link(`/news?id=${a.id}`, `Read comments (${count}) &raquo;`)}</div>
      </div>`;
      }).join('<hr class="dg-hr">')}`;
  }

  renderArticle(id) {
    const article = this.newsArticles.find(a => a.id === id) || this.newsArticles[0];
    const comments = this.getNewsComments()[article.id] || this.getDefaultNewsComments(article.id);
    return `
      <p class="dg-crumbs">${this.link('', '&laquo; Back to the news')}</p>
      <h2 class="dg-h">${this.bell()} ${article.title}</h2>
      <div class="dg-news-meta">Posted by <b>${article.author}</b> on ${article.date}</div>
      ${article.body}
      <h3 class="dg-h3">Comments (<span id="dg_comment_count">${comments.length}</span>)</h3>
      <div class="dg-comments" id="dg_comments">${this.renderComments(comments)}</div>
      ${this.renderCommentForm('dg_news_form', ` data-news-id="${article.id}"`, 'Post comment')}`;
  }

  renderComments(list) {
    return list.map(c => `
      <div class="dg-comment">
        <div class="dg-comment-head"><b>${this.esc(c.user)}</b> <span>${this.esc(c.date)}</span></div>
        <div>${this.esc(c.text)}</div>
      </div>`).join('');
  }

  renderCommentForm(id, attrs, submitLabel) {
    return `
      <form class="dg-form" id="${id}"${attrs}>
        <table class="dg-form-table" cellspacing="0">
          <tr><td class="dg-form-label"><label for="${id}_user">Name:</label></td><td><input type="text" id="${id}_user" name="user" size="24" maxlength="30" required></td></tr>
          <tr><td class="dg-form-label"><label for="${id}_text">Comment:</label></td><td><textarea id="${id}_text" name="text" rows="4" cols="52" required></textarea></td></tr>
          <tr><td></td><td><button type="submit" class="win-btn">${submitLabel}</button></td></tr>
        </table>
      </form>`;
  }

  renderEpisodesSection() {
    const ep = this.episodes.find(e => e.id === this.currentEpisode) || this.episodes[0];
    const rating = this.getVideoRatings()[ep.id] || { count: 48, total: 236 };
    const comments = this.getVideoComments(ep.id);
    const track = this.currentSubtitleTrack;
    const tracks = [['eng', 'English'], ['rus', 'Russian (cah4e3)'], ['comment', "Director's commentary"], ['commentRus', 'Комментарии Режиссёра'], ['off', 'Off']];
    const prev = this.episodes.find(e => e.id === ep.id - 1);
    const next = this.episodes.find(e => e.id === ep.id + 1);
    return `
      <h2 class="dg-h">${this.bell()} Episodes</h2>
      <p>All 16 episodes of the 1999 TV series, 3 minutes each. Pick an episode on the right and choose subtitles under the picture.</p>
      <table class="dg-theater" cellspacing="0">
        <tr>
          <td class="dg-theater-player">
            <div class="dg-player">
              <div class="dg-player-bar"><span>ActiveMovie - Episode ${ep.num}</span><span class="dg-player-btns" aria-hidden="true"><span>_</span><span>&#9633;</span><span>x</span></span></div>
              <div class="dg-screen" id="digi_player_screen">
                <video id="digi_video_el" class="dg-video" src="${encodeURI(ep.src)}" preload="metadata" playsinline></video>
                <div class="dg-sub" id="digi_sub_overlay" style="display:${track === 'off' ? 'none' : 'block'}"><span class="dg-sub-text ${this.subtitleClass()}" id="digi_sub_text"></span></div>
                <div class="dg-hud" id="digi_hud_status">PAUSED [00:00]</div>
              </div>
              <div class="dg-player-controls">
                <button type="button" class="win-btn" id="digi_btn_play">&#9658; Play</button>
                <button type="button" class="win-btn" id="digi_btn_stop">&#9632; Stop</button>
                <input type="range" class="dg-seek" id="digi_seek_bar" min="0" max="100" value="0" step="0.1" aria-label="Seek">
                <span class="dg-time" id="digi_time_display">00:00 / 00:00</span>
              </div>
              <div class="dg-player-controls">
                <label for="digi_sub_select">Subtitles:</label>
                <select id="digi_sub_select">
                  ${tracks.map(([value, label]) => `<option value="${value}"${track === value ? ' selected' : ''}>${label}</option>`).join('')}
                </select>
                <button type="button" class="win-btn" id="digi_btn_fs">Full screen</button>
                <label for="digi_vol">Volume</label>
                <input type="range" class="dg-volume" id="digi_vol" min="0" max="1" step="0.05" value="${this.playerVolume}">
              </div>
            </div>
            <p class="dg-ep-nav">${[prev && this.link(`/episodes?ep=${prev.id}`, `&laquo; Episode ${prev.num}`), next && this.link(`/episodes?ep=${next.id}`, `Episode ${next.num} &raquo;`)].filter(Boolean).join(' &nbsp;|&nbsp; ')}</p>
          </td>
          <td class="dg-theater-list">
            <table class="dg-eplist" cellspacing="0">
              <tr><th>No.</th><th>Title</th></tr>
              ${this.episodes.map(e => `
              <tr${e.id === ep.id ? ' class="is-current"' : ''}><td>${e.num}</td><td>${e.id === ep.id ? `<b>${e.title}</b>` : this.link(`/episodes?ep=${e.id}`, e.title, ` title="First aired ${e.date}"`)}</td></tr>`).join('')}
            </table>
          </td>
        </tr>
      </table>
      <h3 class="dg-h3">Episode ${ep.num}: ${ep.title}</h3>
      <div class="dg-jp">${ep.jpTitle}</div>
      <p>${ep.desc}</p>
      <table class="dg-specs" cellspacing="0">
        <tr><th>First aired</th><td>${ep.date}, TBS "Wonderful"</td><th>Studio</th><td>Madhouse</td></tr>
        <tr><th>Director</th><td>Hiroaki Sakurai</td><th>File</th><td>MKV, 144p, 4 subtitle tracks</td></tr>
      </table>
      <div class="dg-rate">
        Rate this episode:
        <span id="digi_stars_wrap">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="dg-star" data-star="${n}" title="${n} of 5">&#9733;</button>`).join('')}</span>
        <span id="digi_rating_display">${(rating.total / rating.count).toFixed(1)} of 5 (${rating.count} votes)</span>
      </div>
      <h3 class="dg-h3">Reviews (<span id="dg_comment_count">${comments.length}</span>)</h3>
      <div class="dg-comments" id="ep_comments_list">${this.renderComments(comments)}</div>
      ${this.renderCommentForm('digi_ep_comment_form', '', 'Post review')}`;
  }

  subtitleClass() {
    return ['comment', 'commentRus'].includes(this.currentSubtitleTrack) ? 'is-commentary' : this.currentSubtitleTrack === 'rus' ? 'is-russian' : '';
  }

  renderGallerySection() {
    const fit = (img, box) => {
      const k = Math.min(box / img.w, box / img.h);
      return `width="${Math.round(img.w * k)}" height="${Math.round(img.h * k)}"`;
    };
    const rows = [];
    for (let i = 0; i < this.galleryImages.length; i += 3) rows.push(this.galleryImages.slice(i, i + 3));
    return `
      <h2 class="dg-h">${this.bell()} Gallery</h2>
      <p>Scans of Gamers promo sheets and telephone cards. Click a picture to see it full size. If you put a picture on your own homepage, please link back to us, nyo!</p>
      <table class="dg-thumbs" cellspacing="10">
        ${rows.map(row => `
        <tr>
          ${row.map(img => `
          <td>
            <a class="dg-thumb" data-url="${this.baseUrl}/gallery?pic=${img.id}"><img src="${img.src}" ${fit(img, 130)} alt="${this.esc(img.title)}"></a>
            <div class="dg-thumb-title">${img.title}</div>
            <div class="dg-small">${img.w}x${img.h}, ${img.kb} KB</div>
          </td>`).join('')}
        </tr>`).join('')}
      </table>`;
  }

  renderPicture(id) {
    const list = this.galleryImages;
    const index = Math.max(0, list.findIndex(img => img.id === id));
    const img = list[index];
    const prev = list[(index - 1 + list.length) % list.length];
    const next = list[(index + 1) % list.length];
    return `
      <p class="dg-crumbs">[ ${this.link(`/gallery?pic=${prev.id}`, '&laquo; Previous')} | ${this.link('/gallery', 'Gallery index')} | ${this.link(`/gallery?pic=${next.id}`, 'Next &raquo;')} ]</p>
      <h2 class="dg-h">${this.bell()} ${img.title}</h2>
      <p class="dg-picture"><img src="${img.src}" width="${img.w}" height="${img.h}" alt="${this.esc(img.title)}"></p>
      <p>${img.desc}</p>
      <p class="dg-small">Picture ${index + 1} of ${list.length}. JPEG, ${img.w}x${img.h}, ${img.kb} KB.</p>
      <p><button type="button" class="win-btn" id="dg_save_pic" data-pic="${img.id}">Save picture to My Documents</button></p>`;
  }

  renderMusicSection() {
    const romaji = ['Sekai de ichiban kagayakeru made', 'Ichinichi mainichi wo tanoshiku ikite', 'Totsuzen umarekuru setsuna no fuan', '2000-nen mondai yori jibun no yume', '', 'Sekai de ichiban kagayakitai', 'Omoi wa number 1 star', 'Kono sora no naka de', '', 'Warai korogetari chotto fukuretari', 'Kimi ga, kimi ga, kimi ga suki dayo', 'Happy day!', '', 'Madobe ni hoozue tsuite hekonde iru no wa dare?', 'Nani ga atta no? Itsumo nara oshaberi ga tomaranai no ni', 'Ai ni kite kureta dake de ureshikatta yo honto', 'Samishigariya no kimi dakara nantoka shinakucha ne', '', 'Wow, wow, wow!', 'Kimi ga soba ni inakucha monotarinai', 'Ichiban daiji na takaramono sa', 'Yowai tokoro mo zenbu hikkurumete', 'Kimi ga, kimi ga, kimi ga suki dayo!'];
    const english = ['Until I can shine the brightest in the whole wide world,', 'I will live each and every day to the fullest and have fun!', 'Any sudden fleeting worries that arise,', 'Forget the Y2K computer bug, my dreams come first!', '', 'I want to shine brighter than anyone in this world,', 'My heart is the Number 1 star', 'High up in this endless sky!', '', 'Rolling over in laughter, or pouting just a little bit,', 'I love, I love, I love you so much!', 'Happy day!', '', 'Who is resting their chin in their hands, feeling down by the window?', 'What happened? Usually you never stop chatting away!', 'Just having you come over to see me made me so truly happy.', "Because you get lonely easily, I've got to do something for you!", '', 'Wow, wow, wow!', "If you aren't by my side, something is always missing.", 'You are my absolute most precious treasure in the universe,', 'Even including all your quirky little weaknesses,', 'I love, I love, I love you so very much!'];
    return `
      <h2 class="dg-h">${this.bell()} Party Night</h2>
      <table class="dg-single" cellspacing="0">
        <tr>
          <td class="dg-single-art">${this.gif('cd', 3)}</td>
          <td>
            <b>PARTY NIGHT</b>, maxi single, Broccoli, 1999<br>
            Sung by D.U.P.: Asami Sanada, Miyuki Sawashiro and Kyoko Hikami.<br>
            Music by Toshio Masuda, lyrics by Yuki Mori.<br>
            <span class="dg-small">MP3, 128 kbit/s, 5.2 MB. About 18 minutes on a 56K modem.</span>
          </td>
        </tr>
      </table>
      <div class="dg-media">
        <audio id="digi_music_audio" src="content/digi/music/01 Party Night.mp3" preload="metadata"></audio>
        <div class="dg-media-top">
          <div class="dg-spectrum" id="digi_viz_wrap">${Array.from({ length: 12 }, () => '<span class="dg-bar"></span>').join('')}</div>
          <div class="dg-media-title">D.U.P. - Party Night</div>
        </div>
        <div class="dg-player-controls">
          <button type="button" class="win-btn" id="digi_m_play">&#9658; Play</button>
          <button type="button" class="win-btn" id="digi_m_pause">Pause</button>
          <button type="button" class="win-btn" id="digi_m_stop">&#9632; Stop</button>
          <input type="range" class="dg-seek" id="digi_m_seek" min="0" max="100" value="0" step="0.1" aria-label="Seek">
          <span class="dg-time" id="digi_m_time">00:00 / 05:43</span>
          <label for="digi_m_vol">Volume</label>
          <input type="range" class="dg-volume" id="digi_m_vol" min="0" max="1" step="0.05" value="${this.playerVolume}">
        </div>
      </div>
      <h3 class="dg-h3">Lyrics</h3>
      <table class="dg-lyrics" cellspacing="0">
        <tr><th>Romaji</th><th>English translation</th></tr>
        ${romaji.map((line, i) => (line ? `<tr><td>${line}</td><td>${english[i]}</td></tr>` : '<tr class="is-gap"><td></td><td></td></tr>')).join('')}
      </table>`;
  }

  renderAboutSection() {
    const cast = [
      ['dejiko', 'Di Gi Charat (Dejiko)', 'Asami Sanada', 'Age 10. Says "-nyo!". Weapon: Eye Beam.', 'The princess of Planet Di Gi Charat. She looks cute in her cat-maid dress, but she is cynical, hot-tempered and greedy, and blasts anyone who annoys her with lasers from her eyes. She wants to become an idol superstar.'],
      ['puchiko', 'Petit Charat (Puchiko)', 'Miyuki Sawashiro', 'Age 5. Says "-nyu!". Her Eye Beam misfires water.', "Dejiko's quiet companion. She speaks softly and rarely, but her deadpan remarks hit hard."],
      ['gema', 'Gema', 'Yoshiko Kamei', 'A floating yellow ball. Says "-gema!".', 'Dejiko\'s long-suffering caretaker with an upside-down face. He lectures her about manners and money and gets burned by her Eye Beam in almost every episode.'],
      ['rabienrose', 'Rabi~en~Rose (Hikaru Usada)', 'Kyoko Hikami', 'Age 14. Bunny ears and dice.', 'Dejiko\'s rival. On stage she is a glamorous idol, but in real life she is a poor middle-school girl who works part-time jobs to help her family. She gets angry when anyone calls her "Usada".'],
      ['otaku', 'Takeshi and Yoshimi', 'Ryo Naitou and Morihisa LeBlanc', '', 'Two loyal Gamers customers who worship Dejiko and buy everything with her face on it.'],
      ['manager', 'Mr. Manager', 'Kazuya Ichijou', 'Blue hood, big round glasses.', 'The patient manager of Gamers Akihabara. He gave Dejiko and Puchiko a room upstairs and calmly survives the daily explosions.']
    ];
    const staff = [
      ['Koge-Donbo', 'Character design', 'Drew Dejiko, Puchiko and Rabi~en~Rose: huge eyes, cat bonnets and maid dresses.'],
      ['Hiroaki Sakurai', 'Director', 'Turned a shop commercial into three minutes of non-stop gags.'],
      ['Toshio Masuda', 'Music', 'Wrote "Party Night" and the character songs.'],
      ['Madhouse and Broccoli', 'Animation and production', 'Producer Takaaki Kidani and the Madhouse team.']
    ];
    const trivia = [
      "Miyuki Sawashiro was 14 when she won Broccoli's 1999 audition. Puchiko is her first role.",
      '"Me kara biimu" (the Eye Beam) is already a favorite in Flash cartoons and on 2channel.',
      'Fans on IRC now end their sentences with "-nyo", "-nyu" and "-gema".',
      'Di Gi Charat started as a mascot for the Gamers shop that opened in Akihabara in 1998.'
    ];
    return `
      <h2 class="dg-h">${this.bell()} What is Di Gi Charat?</h2>
      <p><b>Di Gi Charat</b> (デ・ジ・キャラット) started in 1998 as the mascot of <i>Gamers</i>, the Akihabara anime shop of Broccoli Co., Ltd. Character designer <b>Koge-Donbo</b> drew her.</p>
      <p>On 29 November 1999 she got her own TV show: sixteen 3-minute episodes inside the late-night TBS program <i>Wonderful</i>, directed by <b>Hiroaki Sakurai</b> at <b>Madhouse</b>.</p>
      <h2 class="dg-h">${this.bell()} Characters</h2>
      <table class="dg-chars" cellspacing="0">
        ${cast.map(([pic, name, voice, facts, text]) => `
        <tr>
          <td class="dg-char-pic"><img src="content/digi/pic/profile_${pic}.jpg" width="96" height="96" alt="${this.esc(name)}"></td>
          <td>
            <b class="dg-char-name">${name}</b>${voice ? ` <span class="dg-small">voice: ${voice}</span>` : ''}<br>
            ${facts ? `<span class="dg-char-facts">${facts}</span><br>` : ''}
            ${text}
          </td>
        </tr>`).join('')}
      </table>
      <h2 class="dg-h">${this.bell()} Staff</h2>
      <table class="dg-staff" cellspacing="0">
        ${staff.map(([name, role, text]) => `<tr><th>${role}</th><td><b>${name}</b>. ${text}</td></tr>`).join('')}
      </table>
      <h2 class="dg-h">${this.bell()} Did you know?</h2>
      <ul class="dg-trivia">${trivia.map(t => `<li>${t}</li>`).join('')}</ul>`;
  }

  renderGuestbookSection() {
    const choices = [['Dejiko', 'Di Gi Charat (Dejiko)'], ['Puchiko', 'Petit Charat (Puchiko)'], ['Gema', 'Gema'], ['Rabi-en-Rose', 'Rabi~en~Rose'], ['Mr. Manager', 'Mr. Manager']];
    return `
      <h2 class="dg-h">${this.bell()} Guestbook</h2>
      <p>Please sign our guestbook! Tell us where you are dialing in from and who your favorite character is. HTML tags are not allowed.</p>
      <form class="dg-form" id="digi_gb_form">
        <table class="dg-form-table" cellspacing="0">
          <tr><td class="dg-form-label"><label for="digi_gb_name">Name:</label></td><td><input type="text" id="digi_gb_name" size="26" maxlength="30" required></td></tr>
          <tr><td class="dg-form-label"><label for="digi_gb_loc">From:</label></td><td><input type="text" id="digi_gb_loc" size="26" maxlength="40" required></td></tr>
          <tr><td class="dg-form-label"><label for="digi_gb_email">E-mail or homepage:</label></td><td><input type="text" id="digi_gb_email" size="34" maxlength="60"></td></tr>
          <tr><td class="dg-form-label"><label for="digi_gb_char">Favorite character:</label></td><td><select id="digi_gb_char">${choices.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></td></tr>
          <tr><td class="dg-form-label"><label for="digi_gb_msg">Message:</label></td><td><textarea id="digi_gb_msg" rows="5" cols="52" required></textarea></td></tr>
          <tr><td></td><td><button type="submit" class="win-btn">Sign the guestbook</button> <button type="reset" class="win-btn">Clear</button></td></tr>
        </table>
        <p class="dg-thanks" id="digi_gb_thanks" hidden>Thank you for signing, nyo! Your message is now at the top of the list.</p>
      </form>
      <div id="digi_gb_entries_wrap">${this.renderGuestbookEntries(this.getGuestbookEntries())}</div>`;
  }

  renderGuestbookEntries(entries) {
    const sprite = { Dejiko: 'dejiko', Puchiko: 'puchiko', Gema: 'gema', 'Rabi-en-Rose': 'rabi', 'Mr. Manager': 'box' };
    const favName = fav => (fav === 'Store Manager' ? 'Mr. Manager' : fav);
    return entries.map((e, i) => `
      <table class="dg-gb-entry" cellspacing="0">
        <tr><th>No.${entries.length - i} &nbsp; ${this.esc(e.name)} <span>from ${this.esc(e.loc)}</span></th><td class="dg-gb-date">${this.esc(e.date)}</td></tr>
        <tr>
          <td colspan="2">
            <span class="dg-gb-fav">${this.gif(sprite[favName(e.fav)] || 'user')}</span>${this.esc(e.msg)}
            <div class="dg-gb-meta">Favorite: ${this.esc(favName(e.fav))}${e.email ? ` &nbsp; E-mail: <u>${this.esc(e.email)}</u>` : ''}</div>
          </td>
        </tr>
      </table>`).join('');
  }

  attachEvents(container) {
    if (!container) return;
    if (this.vizInterval) clearInterval(this.vizInterval);
    this.vizInterval = null;
    this.attachCommentForms(container);
    this.attachVideoEvents(container);
    this.attachMusicEvents(container);
    this.attachGuestbookEvents(container);
    this.attachPictureEvents(container);
  }

  attachPictureEvents(container) {
    const btn = container.querySelector('#dg_save_pic');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const img = this.galleryImages.find(i => i.id === parseInt(btn.dataset.pic, 10));
      const name = `digicharat_${img.id}.jpg`;
      const saved = Boolean(window.vfs && window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], name, new URL(img.src, window.location.href).href));
      if (!window.winManager) return;
      window.winManager.openDialog({
        title: 'Сохранение рисунка',
        icon: saved ? 'info' : 'warning',
        message: saved
          ? `Рисунок <b>${name}</b> сохранён в папку «Мои документы\\Downloads». Его можно открыть в Paint.`
          : 'Не удалось сохранить рисунок: папка «Мои документы\\Downloads» не найдена.'
      });
    });
  }

  attachCommentForms(container) {
    const bind = (formId, listId, save, load) => {
      const form = container.querySelector(`#${formId}`);
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = form.elements.user.value.trim();
        const text = form.elements.text.value.trim();
        if (!user || !text) return;
        save(user, text);
        const list = load();
        const listEl = container.querySelector(`#${listId}`);
        if (listEl) listEl.innerHTML = this.renderComments(list);
        const countEl = container.querySelector('#dg_comment_count');
        if (countEl) countEl.textContent = String(list.length);
        form.elements.text.value = '';
      });
    };
    const newsForm = container.querySelector('#dg_news_form');
    if (newsForm) {
      const id = newsForm.dataset.newsId;
      bind('dg_news_form', 'dg_comments', (user, text) => this.saveNewsComment(id, user, text), () => this.getNewsComments()[id] || []);
    }
    bind('digi_ep_comment_form', 'ep_comments_list', (user, text) => this.saveVideoComment(this.currentEpisode, user, text), () => this.getVideoComments(this.currentEpisode));
  }

  attachGuestbookEvents(container) {
    const form = container.querySelector('#digi_gb_form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (id) => container.querySelector(`#${id}`).value.trim();
      if (!value('digi_gb_name') || !value('digi_gb_loc') || !value('digi_gb_msg')) return;
      this.saveGuestbookEntry(value('digi_gb_name'), value('digi_gb_loc'), value('digi_gb_email'), value('digi_gb_char'), value('digi_gb_msg'));
      container.querySelector('#digi_gb_entries_wrap').innerHTML = this.renderGuestbookEntries(this.getGuestbookEntries());
      container.querySelector('#digi_gb_msg').value = '';
      container.querySelector('#digi_gb_thanks').hidden = false;
    });
  }

  attachVideoEvents(container) {
    const video = container.querySelector('#digi_video_el');
    if (!video) return;
    const btnPlay = container.querySelector('#digi_btn_play');
    const btnStop = container.querySelector('#digi_btn_stop');
    const seekBar = container.querySelector('#digi_seek_bar');
    const timeDisplay = container.querySelector('#digi_time_display');
    const hudStatus = container.querySelector('#digi_hud_status');
    const subSelect = container.querySelector('#digi_sub_select');
    const subOverlay = container.querySelector('#digi_sub_overlay');
    const subText = container.querySelector('#digi_sub_text');
    const formatTime = (sec) => {
      if (!isFinite(sec)) return '00:00';
      return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    };
    const showState = () => {
      btnPlay.innerHTML = video.paused ? '&#9658; Play' : 'Pause';
      hudStatus.textContent = `${video.paused ? 'PAUSED' : 'PLAYING'} [${formatTime(video.currentTime)}]`;
    };

    btnPlay.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    btnStop.addEventListener('click', () => {
      video.pause();
      video.currentTime = 0;
    });
    video.addEventListener('play', showState);
    video.addEventListener('pause', showState);
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        seekBar.value = (video.currentTime / video.duration) * 100;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      }
      showState();
      this.syncSubtitles(video.currentTime, subOverlay, subText);
    });
    seekBar.addEventListener('input', () => {
      if (video.duration) video.currentTime = (seekBar.value / 100) * video.duration;
    });
    subSelect.addEventListener('change', () => {
      this.currentSubtitleTrack = subSelect.value;
      subOverlay.style.display = this.currentSubtitleTrack === 'off' ? 'none' : 'block';
      subText.className = `dg-sub-text ${this.subtitleClass()}`;
      this.syncSubtitles(video.currentTime, subOverlay, subText);
    });
    const volSlider = container.querySelector('#digi_vol');
    video.volume = this.playerVolume;
    volSlider.addEventListener('input', () => {
      this.playerVolume = parseFloat(volSlider.value);
      video.volume = this.playerVolume;
    });
    container.querySelector('#digi_btn_fs').addEventListener('click', () => {
      const screen = container.querySelector('#digi_player_screen');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (screen.requestFullscreen) screen.requestFullscreen().catch(() => {});
    });

    container.querySelectorAll('.dg-star').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.star, 10);
        const updated = this.saveVideoRating(this.currentEpisode, val);
        container.querySelectorAll('.dg-star').forEach(s => s.classList.toggle('is-on', parseInt(s.dataset.star, 10) <= val));
        container.querySelector('#digi_rating_display').textContent = `${(updated.total / updated.count).toFixed(1)} of 5 (${updated.count} votes). You gave ${val}.`;
      });
    });
  }

  getDefaultNewsComments(articleId) {
    switch (articleId) {
      case 'news_1':
        return [
          { user: 'AkibaOtaku99', date: '29.11.1999', text: 'I taped the broadcast on my VHS recorder! Dejiko firing her eye beam at Gema had me laughing so hard I woke up my parents!' },
          { user: 'Puchiko_Lover', date: '30.11.1999', text: 'Can we talk about how adorable Puchiko is?! The voice actress Sawashiro-san did an unbelievable job! -nyu!' },
          { user: 'AnimeGamer_US', date: '01.12.1999', text: 'Downloaded the RealMedia clip through 33.6K dialup. Madhouse animation quality for a 3-minute short is completely off the charts!' }
        ];
      case 'news_2':
        return [
          { user: 'EurobeatFiend', date: '16.12.1999', text: 'PARTY NIGHT is the catchiest song of the entire 90s! The synth riffs by Toshio Masuda are legendary!' },
          { user: 'ChocolatFan', date: '18.12.1999', text: 'Bought 3 copies at Gamers Akihabara: one to listen to, one to preserve in shrink wrap, and one to share!' }
        ];
      case 'news_3':
        return [
          { user: 'TokyoShopper', date: '06.12.1999', text: 'The life-sized Dejiko cutout in front of the store is huge! The line to buy phone cards was 50 meters long.' }
        ];
      default:
        return [
          { user: 'WinterOtaku', date: '25.12.1999', text: 'A summer special OVA in 2000?! Broccoli is taking over the world! Cant wait!' }
        ];
    }
  }

  getNewsComments() {
    try {
      return JSON.parse(localStorage.getItem(this.newsCommentsKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveNewsComment(articleId, user, text) {
    const data = this.getNewsComments();
    if (!data[articleId]) {
      data[articleId] = this.getDefaultNewsComments(articleId);
    }
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.1999`;
    data[articleId].unshift({ user: user.trim(), date: dateStr, text: text.trim() });
    localStorage.setItem(this.newsCommentsKey, JSON.stringify(data));
  }

  getVideoRatings() {
    try {
      return JSON.parse(localStorage.getItem(this.videoRatingsKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveVideoRating(epId, starVal) {
    const ratings = this.getVideoRatings();
    if (!ratings[epId]) {
      ratings[epId] = { count: 48, total: 236 };
    }
    ratings[epId].count += 1;
    ratings[epId].total += starVal;
    localStorage.setItem(this.videoRatingsKey, JSON.stringify(ratings));
    return ratings[epId];
  }

  getVideoComments(epId) {
    try {
      const all = JSON.parse(localStorage.getItem(this.videoCommentsKey) || '{}');
      if (all[epId]) return all[epId];
    } catch (e) {}

    return this.getDefaultEpisodeComments(epId);
  }

  getDefaultEpisodeComments(epId) {
    const defaults = {
      1: [
        { user: 'MeKaraBiimuFan', date: '30.11.1999', text: 'The arrival scene in Akihabara is legendary! Mr. Manager taking them in out of pity is so wholesome nyo!' },
        { user: 'PuchikoFanClub', date: '01.12.1999', text: 'Puchiko dragging her little cat tail across the floor melted my heart instantly!' }
      ],
      2: [
        { user: 'UsadaHater99', date: '01.12.1999', text: 'Rabi-en-Rose is so hilarious! She acts like a haughty idol queen but Dejiko calling her Usada immediately deflates her haha!' }
      ],
      15: [
        { user: 'PartyNightLovers', date: '23.12.1999', text: 'EPISODE 15 IS PURE PERFECTION! The eurobeat dancing, the insane visual gags, Toshio Masuda peaked right here!' },
        { user: 'StudioRivaNyo', date: '24.12.1999', text: 'Watched this episode on loop 20 times today. The director commentary track gives great insight into the Madhouse animators going crazy!' }
      ],
      16: [
        { user: 'AkibaXmas', date: '24.12.1999', text: 'The explosive Christmas cake! The grand finale was explosive in the most literal way possible! Long live Di Gi Charat!' }
      ]
    };
    return defaults[epId] || [
      { user: 'GemaGuard', date: '15.12.1999', text: 'Another classic rapid-fire episode! Sakurai-sensei’s directing timing is simply unmatched!' },
      { user: 'OtakuRanger', date: '16.12.1999', text: 'The facial expressions in this episode are gold. Downloaded it to my hard drive forever!' }
    ];
  }

  saveVideoComment(epId, user, text) {
    let all = {};
    try {
      all = JSON.parse(localStorage.getItem(this.videoCommentsKey) || '{}');
    } catch (e) {}
    if (!all[epId]) {
      all[epId] = this.getDefaultEpisodeComments(epId);
    }
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.1999`;
    all[epId].unshift({ user: user.trim(), date: dateStr, text: text.trim() });
    localStorage.setItem(this.videoCommentsKey, JSON.stringify(all));
  }

  getGuestbookEntries() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.guestbookKey) || '[]');
      if (saved && saved.length > 0) return saved;
    } catch (e) {}

    return [
      {
        name: 'SailorOtaku_99',
        loc: 'Osaka, Japan',
        email: 'otaku99@geocities.co.jp',
        fav: 'Dejiko',
        date: '24.12.1999',
        msg: 'Dejiko is the greatest cat-girl ever made in anime history! I bought all 16 episodes on VHS and listen to Party Night on repeat on my Sony Walkman!'
      },
      {
        name: 'CyberKitten',
        loc: 'Los Angeles, CA, USA',
        email: 'kitten@angelfire.com',
        fav: 'Puchiko',
        date: '21.12.1999',
        msg: 'Greetings from California! Dialing in through Netscape 4.5. Puchiko saying -nyu is the cutest thing on earth! Thank you for making this English website!'
      },
      {
        name: 'BobaFett_Akiba',
        loc: 'Akihabara, Tokyo',
        email: 'boba@gamers.akiba.ne.jp',
        fav: 'Rabi-en-Rose',
        date: '15.12.1999',
        msg: 'Hikaru Usada deserves more respect! Her dream of being an idol while working part-time touched my heart! Rabi-en-Rose forever!'
      },
      {
        name: 'GemaFanatic',
        loc: 'Paris, France',
        email: 'gema@wanadoo.fr',
        fav: 'Gema',
        date: '08.12.1999',
        msg: 'Bonjour! Gema getting blasted by the Eye Beam every single day is pure comedy gold! Best mascot in existence-gema!'
      }
    ];
  }

  saveGuestbookEntry(name, loc, email, fav, msg) {
    const entries = this.getGuestbookEntries();
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.1999`;
    entries.unshift({
      name: name.trim(),
      loc: loc.trim(),
      email: email.trim(),
      fav: fav,
      date: dateStr,
      msg: msg.trim()
    });
    localStorage.setItem(this.guestbookKey, JSON.stringify(entries));
  }

  syncSubtitles(currentTime, overlayEl, textEl) {
    if (!overlayEl || !textEl || this.currentSubtitleTrack === 'off' || !this.subsData) {
      if (textEl) textEl.textContent = '';
      return;
    }

    const epKey = String(this.currentEpisode).padStart(2, '0');
    const epSubs = this.subsData[epKey];
    if (!epSubs) {
      textEl.textContent = '';
      return;
    }

    const cues = epSubs[this.currentSubtitleTrack] || [];
    const activeCue = cues.find(c => currentTime >= c.start && currentTime <= c.end);

    if (activeCue) {
      textEl.textContent = activeCue.text;
      overlayEl.style.opacity = '1';
    } else {
      textEl.textContent = '';
      overlayEl.style.opacity = '0';
    }
  }

  attachMusicEvents(container) {
    const audio = container.querySelector('#digi_music_audio');
    if (!audio) return;

    const btnPlay = container.querySelector('#digi_m_play');
    const btnPause = container.querySelector('#digi_m_pause');
    const btnStop = container.querySelector('#digi_m_stop');
    const seekSlider = container.querySelector('#digi_m_seek');
    const timeDisplay = container.querySelector('#digi_m_time');
    const volSlider = container.querySelector('#digi_m_vol');
    const vizBars = container.querySelectorAll('.dg-bar');

    const formatTime = (sec) => {
      if (isNaN(sec) || !isFinite(sec)) return '00:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const startVisualizer = () => {
      if (this.vizInterval) clearInterval(this.vizInterval);
      this.vizInterval = setInterval(() => {
        vizBars.forEach(bar => {
          const rand = Math.floor(Math.random() * 85) + 15;
          bar.style.height = `${rand}%`;
        });
      }, 90);
    };

    const stopVisualizer = () => {
      if (this.vizInterval) clearInterval(this.vizInterval);
      this.vizInterval = null;
      vizBars.forEach(bar => bar.style.height = '10%');
    };

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        audio.play().catch(e => console.warn(e));
        startVisualizer();
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => {
        audio.pause();
        stopVisualizer();
      });
    }

    if (btnStop) {
      btnStop.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        stopVisualizer();
      });
    }

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        seekSlider.value = (audio.currentTime / audio.duration) * 100;
        timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
      }
    });

    audio.addEventListener('ended', () => {
      stopVisualizer();
    });

    if (seekSlider) {
      seekSlider.addEventListener('input', () => {
        if (audio.duration) {
          audio.currentTime = (seekSlider.value / 100) * audio.duration;
        }
      });
    }

    if (volSlider) {
      audio.volume = this.playerVolume;
      volSlider.addEventListener('input', () => {
        this.playerVolume = parseFloat(volSlider.value);
        audio.volume = this.playerVolume;
      });
    }
  }
}

window.DiGiCharatSite = DiGiCharatSite;
window.diGiCharatSite = new DiGiCharatSite();
