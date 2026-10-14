class BlenderSite {
  constructor() {
    this.guestbookKey = 'win98_blender_guestbook_v2';
    this.hitCountKey = 'win98_blender_hits';
    this.newsletterKey = 'win98_blender_newsletter';
    this.renders = {};
    this.initHitCounter();
  }

  initHitCounter() {
    try {
      let count = parseInt(localStorage.getItem(this.hitCountKey), 10);
      if (isNaN(count) || count < 120000) count = 128734;
      count++;
      localStorage.setItem(this.hitCountKey, String(count));
      this.hitCount = count;
    } catch (e) {
      this.hitCount = 128735;
    }
  }

  gif(name, scale) {
    return typeof window !== 'undefined' && window.webGif ? window.webGif(name, scale || 1) : '';
  }

  esc(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  escapeHtml(str) { return this.esc(str); }

  news() {
    return [
      { id: 1, date: 'October 6, 2000', title: 'Blender 2.04 released', short: 'The fourth update of the 2.0 series is available for Win, Linux, FreeBSD, IRIX, Solaris and BeOS.', body: [
        'Today we release Blender 2.04. This version fixes a long list of bugs reported on the discussion server and adds a few features that many of you asked for.',
        'The Realtime buttons (F8) got property sensors with Interval and Changed tests, the Edit Object actuator can now replace meshes and track to other objects, and the camera actuator is much smoother.',
        'The renderer handles shadow buffers of spot lamps faster, and the Display buttons (F10) have the Unified Render and Crop options. Text objects can be converted to curves with ALT+C.',
        'As always, Blender is free. Download it, read the Readme.txt and the Copyright.txt that come with it, and have fun.'
      ] },
      { id: 2, date: 'September 12, 2000', title: 'Blender 2.03 and the first game demos', short: 'Bug fixes for the game engine, and three playable demos made by the NaN content team.', body: [
        'Blender 2.03 fixes collision problems with dynamic objects that move fast, and makes the keyboard sensor work with all keys at once.',
        'In the download section you will find three small demo files. Load them with F1, move the mouse over the 3D window and press P to play. ESC stops the game.'
      ] },
      { id: 3, date: 'August 4, 2000', title: 'Blender 2.0: interactive 3D', short: 'Blender is now a complete package for interactive 3D: models, animations and games from one tool.', body: [
        'Blender 2.0 brings a game engine inside Blender. You build game logic with sensors, controllers and actuators in the Realtime buttons and you play the result in the 3D window. No programming is needed; Python scripts are optional.',
        'The interface got pulldown menus in the Info window, tooltips and a new set of button icons.'
      ] },
      { id: 4, date: 'June 21, 2000', title: 'NaN opens office in Amsterdam', short: 'Not a Number grows. Our new office in Amsterdam will house the content and support teams.', body: [
        'The headquarters stays in Eindhoven, where the Blender developers work. The Amsterdam office will make demos, tutorials and the printed documentation.'
      ] },
      { id: 5, date: 'May 2, 2000', title: 'The Blender manual: 340 pages', short: 'The printed manual describes every button of Blender and contains tutorials for beginners and experts.', body: [
        'The manual is available in our shop. It is the best way to learn Blender. Order it by fax or at your local book store.'
      ] }
    ];
  }

  gallery() {
    return [
      { id: 'meta', title: 'Blobby', artist: 'NaN content team', scene: 'meta', desc: 'Three metaballs in a Ball and two TubeX elements. Threshold 0.6, rendersize 0.15. A red material with a sharp specular highlight.' },
      { id: 'donut', title: 'Marble Donut', artist: 'NaN content team', scene: 'donut', desc: 'A NURBS surface donut from the toolbox (SPACE, ADD, Surface). Marble texture on the colour channel, Soft noise, Turbulence 5.' },
      { id: 'text', title: 'Version 2.04', artist: 'NaN content team', scene: 'text', desc: 'A Text object with Ext1 0.25 and a bevel of Ext2 0.05, BevResol 1. The font is the built-in Bfont.' },
      { id: 'spot', title: 'Shadow Study', artist: 'NaN content team', scene: 'spot', desc: 'A spot lamp with shadow buffer 1024, Soft 3. Cube and sphere on a plane, OSA 5.' },
      { id: 'grid', title: 'Ripples', artist: 'NaN content team', scene: 'wave', desc: 'A Grid of 24 x 24 vertices shaped into ripples, with Set Smooth and a glossy blue material.' },
      { id: 'halo', title: 'Halo Lights', artist: 'NaN content team', scene: 'halo', desc: 'The vertices of an Icosphere with a Halo material: HaloSize 0.35, Star and Lines enabled.' }
    ];
  }

  section(url) {
    const clean = String(url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const path = clean.split('/').slice(1).join('/');
    const [base, query] = path.split('?');
    const params = {};
    (query || '').split('&').forEach(kv => { const [k, v] = kv.split('='); if (k) params[k] = decodeURIComponent(v || ''); });
    const name = (base || '').replace(/\/$/, '') || 'home';
    const known = ['home', 'news', 'download', 'features', 'gallery', 'tutorials', 'docs', 'faq', 'shop', 'community', 'discussion', 'about', 'guestbook'];
    const sec = known.includes(name) ? name : 'home';
    return { sec: sec === 'docs' ? 'tutorials' : sec === 'discussion' ? 'community' : sec, params };
  }

  link(path, label, cls) {
    return `<a class="${cls || ''}" data-url="http://www.blender3d.com${path}">${label}</a>`;
  }

  renderSite(url) {
    const { sec, params } = this.section(url);
    this.current = { sec, params };
    const menu = [['/', 'Home', 'home'], ['/download', 'Download', 'download'], ['/features', 'Features', 'features'], ['/gallery', 'Gallery', 'gallery'], ['/tutorials', 'Tutorials', 'tutorials'], ['/faq', 'FAQ', 'faq'], ['/shop', 'Shop', 'shop'], ['/community', 'Community', 'community'], ['/about', 'About NaN', 'about']];
    const bar = menu.map(([p, l, s]) => this.link(p, l, 'b3d-mi' + (s === sec || (s === 'home' && sec === 'news') ? ' b3d-mi-on' : ''))).join('<span class="b3d-msep">|</span>');
    return `
<div class="b3d">
  <table class="b3d-frame" cellspacing="0" cellpadding="0" align="center">
    <tr><td colspan="3" class="b3d-top">
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="b3d-logo-cell">${this.logo()}</td>
        <td class="b3d-top-right">
          <div class="b3d-top-news">${this.gif('star')} <b>NEW:</b> Blender 2.04 for all platforms</div>
          <div class="b3d-top-date">Last update: October 6, 2000</div>
          <div class="b3d-top-mail">${this.gif('mail')} blender@blender.nl</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td colspan="3" class="b3d-menubar">${bar}</td></tr>
    <tr>
      <td class="b3d-left">${this.leftColumn(sec)}</td>
      <td class="b3d-main">${this.page(sec, params)}</td>
      <td class="b3d-right">${this.rightColumn()}</td>
    </tr>
    <tr><td colspan="3" class="b3d-foot">
      Copyright &copy; 1998-2000 <b>Not a Number BV</b>, the Netherlands. Blender is a trademark of NaN.<br>
      Questions and support: <a href="mailto:support@blender3d.com">support@blender3d.com</a> &middot; ${this.link('/', 'www.blender3d.com')} &middot; <a data-url="http://www.blender.nl">www.blender.nl</a>
    </td></tr>
  </table>
</div>`;
  }

  logo() {
    const splash = typeof window !== 'undefined' && window.B204 && window.B204.ASSETS ? window.B204.ASSETS.splash : '';
    if (splash) return `<a data-url="http://www.blender3d.com/" class="b3d-logo" style="background-image:url('${splash}')" title="Blender"></a>`;
    return `<a data-url="http://www.blender3d.com/" class="b3d-logo-text">blender</a>`;
  }

  leftColumn(sec) {
    const items = [['/', 'home', 'News'], ['/download', 'disk', 'Download 2.04'], ['/features', 'tools', 'Features'], ['/gallery', 'camera', 'Gallery'], ['/tutorials', 'book', 'Tutorials'], ['/faq', 'question', 'FAQ'], ['/community', 'chat', 'Discussion'], ['/guestbook', 'pencil', 'Guestbook'], ['/shop', 'money', 'Shop'], ['/about', 'info', 'About NaN']];
    const counter = String(this.hitCount || 128735).padStart(7, '0').split('').map(d => `<span class="b3d-digit">${d}</span>`).join('');
    return `
      <div class="b3d-box">
        <div class="b3d-boxhead">Blender</div>
        <div class="b3d-nav">${items.map(([p, g, l]) => `<div class="b3d-navrow${('/' + sec) === p || (sec === 'home' && p === '/') ? ' b3d-navrow-on' : ''}">${this.gif(g)} ${this.link(p, l)}</div>`).join('')}</div>
      </div>
      <div class="b3d-box">
        <div class="b3d-boxhead">Get Blender</div>
        <div class="b3d-boxbody b3d-center">
          ${this.gif('disk', 2)}<br>
          <b>Blender 2.04</b><br>for Win 95/98/NT<br>
          <a class="b3d-btn" data-url="http://www.blender3d.com/download">DOWNLOAD</a><br>
          <span class="b3d-small">2.9 MB, free</span>
        </div>
      </div>
      <div class="b3d-box">
        <div class="b3d-boxhead">Visitors</div>
        <div class="b3d-boxbody b3d-center"><div class="b3d-counter">${counter}</div><br><span class="b3d-small">since June 1998</span></div>
      </div>
      <div class="b3d-badges">
        <div class="b3d-badge">Best viewed<br><b>800 x 600</b></div>
        <div class="b3d-badge b3d-badge-alt">Made with<br><b>Blender</b></div>
      </div>`;
  }

  rightColumn() {
    const subscribed = (() => { try { return localStorage.getItem(this.newsletterKey); } catch (e) { return null; } })();
    return `
      <div class="b3d-box">
        <div class="b3d-boxhead">Current version</div>
        <div class="b3d-boxbody">
          <div class="b3d-ver">2.04</div>
          <table class="b3d-plat" cellspacing="0">
            <tr><td>Win 95/98/NT</td><td>${this.link('/download', 'get')}</td></tr>
            <tr><td>Linux i386</td><td>ftp</td></tr>
            <tr><td>FreeBSD</td><td>ftp</td></tr>
            <tr><td>SGI IRIX</td><td>ftp</td></tr>
            <tr><td>Sun Solaris</td><td>ftp</td></tr>
            <tr><td>BeOS</td><td>ftp</td></tr>
          </table>
        </div>
      </div>
      <div class="b3d-box">
        <div class="b3d-boxhead">The manual</div>
        <div class="b3d-boxbody b3d-center">
          <div class="b3d-book"><span>Blender</span><b>the official manual</b><i>340 pages</i></div>
          ${this.link('/shop', 'Order now &raquo;')}
        </div>
      </div>
      <div class="b3d-box">
        <div class="b3d-boxhead">Newsletter</div>
        <div class="b3d-boxbody">
          ${subscribed ? `<span class="b3d-small">${this.gif('check')} Thank you! News goes to <b>${this.esc(subscribed)}</b>.</span>` : `
          <span class="b3d-small">Get release news by e-mail:</span>
          <form id="b3d-news-form"><input id="b3d-news-mail" class="b3d-input" type="text" value="" size="14"><br><input type="submit" class="b3d-submit" value="Subscribe"></form>`}
        </div>
      </div>
      <div class="b3d-box">
        <div class="b3d-boxhead">Links</div>
        <div class="b3d-boxbody b3d-small">
          <a data-url="http://www.blender.nl">www.blender.nl</a><br>
          <a data-url="http://www.search98.com/search?q=blender">Search: blender</a><br>
          <a data-url="http://forum.games98.com">games98 forum</a>
        </div>
      </div>`;
  }

  page(sec, params) {
    switch (sec) {
      case 'news': return this.newsPage(+params.id);
      case 'download': return this.downloadPage();
      case 'features': return this.featuresPage();
      case 'gallery': return params.id ? this.galleryItemPage(params.id) : this.galleryPage();
      case 'tutorials': return this.tutorialsPage();
      case 'faq': return this.faqPage();
      case 'shop': return this.shopPage();
      case 'community': return this.communityPage();
      case 'about': return this.aboutPage();
      case 'guestbook': return this.guestbookPage();
      default: return this.homePage();
    }
  }

  head(title) { return `<div class="b3d-h1">${this.gif('ball-red')} ${title}</div>`; }

  homePage() {
    const list = this.news();
    return `
      ${this.head('Welcome to Blender')}
      <p><b>Blender</b> is a free 3D creation package. You can model, render, animate and now also make interactive 3D games with it. Blender is small: the complete package for Win 95/98/NT is less than 3 MB.</p>
      <p>Blender was made by Ton Roosendaal at the Dutch animation studio NeoGeo. Since 1998 the company <b>Not a Number</b> develops Blender and gives it away for free.</p>
      <table class="b3d-hero" cellspacing="0" cellpadding="6"><tr>
        <td class="b3d-hero-img">${this.renderImg('text', 'Blender 2.04')}</td>
        <td><b>Blender 2.04 is here!</b><br>Game engine, NURBS, metaballs, 3D text, a fast renderer with shadows and toon edges, IPO animation and much more.<br><br><a class="b3d-btn" data-url="http://www.blender3d.com/download">Download now</a></td>
      </tr></table>
      ${this.head('News')}
      ${list.map(n => `
        <div class="b3d-news">
          <div class="b3d-news-head"><span class="b3d-news-date">${n.date}</span> ${n.id === 1 ? '<span class="b3d-new">NEW</span> ' : ''}${this.link('/news?id=' + n.id, '<b>' + n.title + '</b>')}</div>
          <div class="b3d-news-short">${n.short} ${this.link('/news?id=' + n.id, 'more &raquo;')}</div>
        </div>`).join('')}
      ${this.head('System requirements')}
      <table class="b3d-table" cellspacing="0">
        <tr><th></th><th>Minimum</th><th>Recommended</th></tr>
        <tr><td>Processor</td><td>Pentium 90</td><td>Pentium II 300</td></tr>
        <tr><td>Memory</td><td>32 MB</td><td>64 MB</td></tr>
        <tr><td>Graphics</td><td>OpenGL, 800 x 600, 16 bit</td><td>3D card with OpenGL (TNT2, Voodoo3)</td></tr>
        <tr><td>Mouse</td><td colspan="2">Three button mouse (or ALT + left mouse with "2-Mouse" in the user preferences)</td></tr>
        <tr><td>OS</td><td colspan="2">Microslop Win 95, Win 98, Win NT 4.0</td></tr>
      </table>`;
  }

  newsPage(id) {
    const n = this.news().find(x => x.id === id) || this.news()[0];
    return `
      ${this.head('News')}
      <div class="b3d-article">
        <div class="b3d-news-date">${n.date}</div>
        <h2 class="b3d-h2">${n.title}</h2>
        ${n.body.map(p => `<p>${p}</p>`).join('')}
        <p>${this.link('/', '&laquo; back to the news')}</p>
      </div>`;
  }

  status(id) {
    const gm = typeof window !== 'undefined' ? window.gameManager : null;
    if (!gm) return 'none';
    if (gm.isInstalled(id)) return 'installed';
    if (gm.isDownloaded(id)) return 'downloaded';
    return 'none';
  }

  downloadPage() {
    const st = this.status('blender204');
    let box;
    if (st === 'installed') box = `<div class="b3d-status b3d-status-ok">${this.gif('check')} <b>Blender 2.04 is installed</b> in C:\\Program Files\\Blender 2.04<br><button class="b3d-act" data-act="launch204">Start Blender 2.04</button> <button class="b3d-act" data-act="setup204">Run setup again</button></div>`;
    else if (st === 'downloaded') box = `<div class="b3d-status b3d-status-dl">${this.gif('box')} <b>blender2.04-windows.exe</b> is in C:\\My Documents\\Downloads<br><button class="b3d-act" data-act="setup204">Run setup</button> <button class="b3d-act" data-act="dl204">Download again</button></div>`;
    else box = `<div class="b3d-status b3d-status-none">${this.gif('warn')} Blender 2.04 is not installed on this computer. Choose a mirror below.</div>`;
    const st160 = this.status('blender');
    const old = st160 === 'installed' ? `<button class="b3d-act" data-act="launch160">Start 1.60</button>` : st160 === 'downloaded' ? `<button class="b3d-act" data-act="setup160">Run setup</button>` : `<button class="b3d-act" data-act="dl160">Download</button>`;
    return `
      ${this.head('Download Blender 2.04')}
      <p>Blender is free. You may use it for any purpose, also for commercial work. You may not sell Blender or distribute it bundled with other products. Please read the Copyright.txt that comes with the download.</p>
      ${box}
      <table class="b3d-table" cellspacing="0">
        <tr><th colspan="3">${this.gif('pc')} Win 95/98/NT &middot; blender2.04-windows.exe &middot; 2.9 MB</th></tr>
        <tr class="b3d-row-hi"><td>HTTP</td><td>Amsterdam, the Netherlands</td><td class="b3d-nw"><button class="b3d-act" data-act="dl204">Download</button></td></tr>
        <tr class="b3d-row-hi"><td>HTTP</td><td>Eindhoven, the Netherlands</td><td class="b3d-nw"><button class="b3d-act" data-act="dl204">Download</button></td></tr>
        <tr class="b3d-row-hi"><td>FTP</td><td>Mirror in the USA</td><td class="b3d-nw"><button class="b3d-act" data-act="dl204">Download</button></td></tr>
      </table>
      <table class="b3d-table" cellspacing="0">
        <tr><th>Other platforms</th><th>File</th><th>Size</th></tr>
        <tr><td>Linux i386 glibc 2.1</td><td class="b3d-small">blender2.04-linux-glibc2.1.2-i386.tar.gz</td><td class="b3d-nw">3.1 MB</td></tr>
        <tr><td>FreeBSD 3.4</td><td class="b3d-small">blender2.04-freebsd-3.4-i386.tar.gz</td><td class="b3d-nw">3.0 MB</td></tr>
        <tr><td>SGI IRIX 6.5</td><td class="b3d-small">blender2.04-irix-6.5-mips.tar.gz</td><td class="b3d-nw">4.6 MB</td></tr>
        <tr><td>Sun Solaris 2.8</td><td class="b3d-small">blender2.04-solaris-2.8-sparc.tar.gz</td><td class="b3d-nw">3.9 MB</td></tr>
        <tr><td>BeOS R5</td><td class="b3d-small">blender2.04-beos-5-i386.zip</td><td class="b3d-nw">3.2 MB</td></tr>
      </table>
      ${this.head('Installation')}
      <ol class="b3d-ol">
        <li>Download <b>blender2.04-windows.exe</b>. It goes to C:\\My Documents\\Downloads.</li>
        <li>Run it. The setup copies <b>Blender.exe</b>, <b>Python15.dll</b>, <b>Readme.txt</b> and <b>Copyright.txt</b> to C:\\Program Files\\Blender 2.04.</li>
        <li>Start Blender from the desktop or from Start, Programs. Move the mouse over the 3D window and press SPACE for the toolbox.</li>
        <li>Blender files (.blend) open with a double click.</li>
      </ol>
      ${this.head('Previous releases')}
      <table class="b3d-table" cellspacing="0">
        <tr><th>Version</th><th>Date</th><th>File</th><th></th></tr>
        <tr><td class="b3d-nw">Blender 1.60</td><td class="b3d-nw">April 1999</td><td class="b3d-small">Setup_Blender160.exe, 1.8 MB</td><td class="b3d-nw">${old}</td></tr>
      </table>
      <p class="b3d-small">Older versions are not supported any more. They do not read files saved by Blender 2.x.</p>`;
  }

  featuresPage() {
    const groups = [
      ['tools', 'Modeling', ['Meshes with vertex editing: extrude, spin, screw, subdivide, fractal subdivide, beauty fill, remove doubles', 'Bezier and NURBS curves with extrusion, bevel and bevel objects', 'NURBS surfaces: curve, circle, patch, tube, sphere, donut', 'Metaballs with Ball and Tube elements', '3D text with the built-in vector font', 'S-Mesh subdivision surfaces and lattice deformation', 'Proportional vertex editing with sharp and smooth falloff']],
      ['camera', 'Rendering', ['Fast scanline renderer with oversampling (5, 8, 11, 16 samples)', 'Lamp, Spot, Sun and Hemi lights; shadow buffers for spot lamps', 'Procedural textures: Clouds, Wood, Marble, Magic, Blend, Stucci, Noise, and image textures', 'Halos, Z-transparency, mist, stars, sky blend, toon edges, motion blur', 'Radiosity for global illumination', 'Output to Targa, IRIS, JPEG, AVI']],
      ['film', 'Animation', ['IPO curves for objects, materials, lamps, cameras and the world', 'Bezier, linear and constant interpolation; cyclic and extrapolated curves', 'Vertex keys, paths with CurveFollow, Ika chains', 'Build, Wave and Particle effects', 'Sequence editor with cross, add, subtract and alpha effects']],
      ['robot', 'Game engine', ['Logic bricks: sensors, controllers and actuators', 'Sensors: Always, Keyboard, Mouse, Touch, Collision, Near, Radar, Property', 'Actuators: Object (force, torque, velocity), Ipo, Camera, Sound, Property, Edit Object, Scene', 'Dynamic objects with mass, damping and collision', 'Play the game in the 3D window with P']],
      ['pc', 'Interface', ['Non-overlapping windows: split and join them as you like', '3D window, IPO window, Buttons, File window, Text editor, OOPS, Image window, Sequence editor, Sound window', 'Fully configurable screens; save your own default with CTRL+U', 'The complete package is one executable of less than 3 MB']]
    ];
    return `
      ${this.head('Features of Blender 2.04')}
      <p>Blender gives you a complete production pipeline in one small program. Everything works from the keyboard and the three-button mouse.</p>
      ${groups.map(([g, title, list]) => `
        <div class="b3d-feat">
          <div class="b3d-feat-head">${this.gif(g)} ${title}</div>
          <ul class="b3d-ul">${list.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`).join('')}
      ${this.head('File formats')}
      <table class="b3d-table" cellspacing="0">
        <tr><th>Read</th><td>.blend, Videoscape, images (Targa, IRIS, JPEG)</td></tr>
        <tr><th>Write</th><td>.blend, DXF (SHIFT+F2), VRML 1.0 (CTRL+F2), Videoscape (ALT+W)</td></tr>
      </table>`;
  }

  renderImg(scene, alt) {
    const url = this.renders[scene];
    if (url) return `<img class="b3d-render" src="${url}" alt="${this.esc(alt)}" width="160" height="120">`;
    return `<div class="b3d-render b3d-render-wait" data-scene="${scene}">rendering...</div>`;
  }

  galleryPage() {
    return `
      ${this.head('Gallery')}
      <p>All pictures on this page were rendered with Blender 2.04 when you opened the page. Click on a picture to read how it was made.</p>
      <table class="b3d-gal" cellspacing="6"><tr>
        ${this.gallery().map((g, i) => `${i && i % 2 === 0 ? '</tr><tr>' : ''}<td class="b3d-gal-cell"><a data-url="http://www.blender3d.com/gallery?id=${g.id}">${this.renderImg(g.scene, g.title)}</a><br><b>${g.title}</b><br><span class="b3d-small">${g.artist}</span></td>`).join('')}
      </tr></table>`;
  }

  galleryItemPage(id) {
    const g = this.gallery().find(x => x.id === id) || this.gallery()[0];
    return `
      ${this.head('Gallery: ' + g.title)}
      <table cellspacing="0" cellpadding="6"><tr><td class="b3d-gal-big">${this.renderImg(g.scene, g.title)}</td><td valign="top">
        <b>${g.title}</b><br><span class="b3d-small">by ${g.artist}</span><br><br>${g.desc}
      </td></tr></table>
      <p>${this.link('/gallery', '&laquo; back to the gallery')}</p>`;
  }

  tutorialsPage() {
    const keys = [['RMB', 'Select an object or a vertex (SHIFT adds to the selection)'], ['LMB', 'Place the 3D cursor; confirm a transform'], ['MMB', 'Rotate the view (SHIFT: move, CTRL: zoom)'], ['SPACE', 'Toolbox: add objects and much more'], ['TAB', 'Edit mode on/off'], ['G / R / S', 'Grab, rotate, scale; X/Y/Z locks the axis'], ['E', 'Extrude in edit mode'], ['A / B', 'Select all / border select'], ['X', 'Delete'], ['SHIFT+D', 'Duplicate'], ['I', 'Insert a key (IPO)'], ['F12', 'Render'], ['F4..F10', 'Lamp, Material, Texture, Animation, Realtime, Edit, Display buttons'], ['SHIFT+F4..F12', 'Change the window type'], ['P', 'Play the game'], ['CTRL+W / F1', 'Save / load a file']];
    return `
      ${this.head('Tutorial: your first game')}
      <ol class="b3d-ol">
        <li>Start Blender. You see the default Plane from above. Press <b>SPACE</b>, choose <b>ADD, Mesh, UVsphere</b> and confirm 16 segments and 16 rings. Press <b>TAB</b> to leave edit mode.</li>
        <li>Press <b>G</b> and <b>Z</b>, move the sphere up and click. Press <b>F8</b> for the Realtime buttons. Press <b>Actor</b> and <b>Dynamic</b>.</li>
        <li>Press <b>Add</b> under Sensors and choose <b>Keyboard</b>. Click on the key button and press the UP arrow key.</li>
        <li>Add an <b>AND</b> controller and an <b>Object</b> actuator. Type 0.5 in the second field of <b>Force</b>.</li>
        <li>Drag lines from the yellow dot of the sensor to the controller, and from the controller to the actuator.</li>
        <li>Move the mouse over the 3D window, press <b>NumPad 0</b> for the camera view and press <b>P</b>. The sphere falls on the plane, and the UP arrow pushes it. <b>ESC</b> stops the game.</li>
      </ol>
      ${this.head('The mouse and the keyboard')}
      <p>Blender uses the <b>right mouse button</b> to select and the <b>left mouse button</b> to act. Keep one hand on the keyboard: almost every command has a hotkey. The hotkeys work in the window under the mouse.</p>
      <table class="b3d-table" cellspacing="0">
        <tr><th width="90">Key</th><th>Function</th></tr>
        ${keys.map(([k, f]) => `<tr><td><span class="b3d-key">${k}</span></td><td>${f}</td></tr>`).join('')}
      </table>`;
  }

  faqPage() {
    const qa = [
      ['Is Blender really free?', 'Yes. You can use Blender and everything you make with it for any purpose. You may not sell Blender itself.'],
      ['Why does the right mouse button select?', 'Selecting is separated from acting. With the left button you place the 3D cursor and confirm commands, so you never move things by accident.'],
      ['I have a two button mouse.', 'Open the user preferences (drag the Info window down) and press "2-Mouse". ALT + left mouse then works as the middle mouse button.'],
      ['Where are the menus?', 'Press SPACE in the 3D window for the toolbox. The Info window at the top has File, Edit, View and Tools menus.'],
      ['How do I save my work?', 'Press F2 (save as) or CTRL+W (save). F1 loads a file. CTRL+U saves the current scene as your default startup file.'],
      ['How do I render a picture?', 'Press F12. The size and quality are in the Display buttons (F10). F3 saves the picture.'],
      ['The game runs slow.', 'The game engine draws the 3D window as fast as your graphics card allows. Use fewer faces and a smaller window.'],
      ['Can Blender read 3D Studio files?', 'Not yet. Blender reads and writes Videoscape files, and writes DXF and VRML.']
    ];
    return `${this.head('Frequently Asked Questions')}${qa.map(([q, a], i) => `<div class="b3d-faq"><div class="b3d-faq-q">${i + 1}. ${q}</div><div class="b3d-faq-a">${a}</div></div>`).join('')}`;
  }

  shopPage() {
    return `
      ${this.head('Shop')}
      <table class="b3d-table" cellspacing="0">
        <tr><th>Product</th><th>Price</th></tr>
        <tr><td><b>Blender, the official manual</b><br><span class="b3d-small">340 pages, full colour cover, tutorials and reference</span></td><td>NLG 99,-</td></tr>
        <tr><td><b>Blender CD-ROM</b><br><span class="b3d-small">All platforms, demo files, textures and the HTML manual</span></td><td>NLG 25,-</td></tr>
        <tr><td><b>Blender T-shirt</b><br><span class="b3d-small">Black, with the orange logo. Sizes M, L, XL</span></td><td>NLG 35,-</td></tr>
      </table>
      <div class="b3d-status b3d-status-dl">${this.gif('printer')} <b>How to order:</b> print this page, write your name, address and the products you want, and fax it to <b>(31) 40 247 5707</b>. We send an invoice with the package.</div>`;
  }

  communityPage() {
    const posts = [
      ['Oct 6, 2000', 'Re: 2.04 is out!', 'kmk'], ['Oct 5, 2000', 'Keyboard sensor with two keys?', 'gamer_nl'], ['Oct 4, 2000', 'Metaballs render black', 'Ingrid'],
      ['Oct 3, 2000', 'Ray tracing in Blender?', 'Dirk'], ['Oct 1, 2000', 'Python: move an object every frame', 'stefan_b'], ['Sep 29, 2000', 'How to make a lens flare with halos', 'Moscow3D']
    ];
    return `
      ${this.head('Discussion')}
      <p>The Blender discussion server is the place to ask questions, show your work and meet other Blender users. The NaN developers read it every day.</p>
      <table class="b3d-table" cellspacing="0">
        <tr><th>Date</th><th>Subject</th><th>From</th></tr>
        ${posts.map(([d, s, f]) => `<tr><td class="b3d-small">${d}</td><td>${this.gif('note')} ${s}</td><td class="b3d-small">${f}</td></tr>`).join('')}
      </table>
      <p>${this.link('/guestbook', 'Sign the guestbook &raquo;')}</p>`;
  }

  aboutPage() {
    return `
      ${this.head('About Not a Number')}
      <p><b>Not a Number</b> (NaN) develops and publishes Blender. NaN was founded in June 1998 by Ton Roosendaal, who started Blender in 1995 as the in-house tool of the animation studio NeoGeo.</p>
      <p>Blender is free. NaN makes money with the manual, with support for companies and with products based on the Blender technology.</p>
      <table class="b3d-table" cellspacing="0">
        <tr><th>Headquarters</th><td>Eindhoven, the Netherlands</td></tr>
        <tr><th>Office</th><td>Amsterdam, the Netherlands</td></tr>
        <tr><th>Fax</th><td>(31) 40 247 5707</td></tr>
        <tr><th>E-mail</th><td>blender@blender.nl, ton@blender.nl</td></tr>
        <tr><th>Support</th><td><a href="mailto:support@blender3d.com">support@blender3d.com</a></td></tr>
        <tr><th>Web</th><td>www.blender.nl, www.blender3d.com</td></tr>
      </table>
      ${this.head('History')}
      <table class="b3d-table" cellspacing="0">
        <tr><td>1988</td><td>Ton Roosendaal co-founds the animation studio NeoGeo.</td></tr>
        <tr><td>1995</td><td>Work starts on a new in-house 3D tool: Blender.</td></tr>
        <tr><td>1998</td><td>NaN is founded. Blender becomes free on the internet.</td></tr>
        <tr><td>1999</td><td>Blender 1.60 and the first Win 95/98 version.</td></tr>
        <tr><td>2000</td><td>Blender 2.0 with the game engine; versions 2.01 to 2.04.</td></tr>
      </table>`;
  }

  guestbookEntries() {
    try {
      const raw = localStorage.getItem(this.guestbookKey);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    } catch (e) {}
    return [
      { name: 'Ton Roosendaal', from: 'Eindhoven, NL', date: '06 Oct 2000', text: 'Thanks to everybody who reported bugs in 2.03. Enjoy 2.04!' },
      { name: 'Andrey "polygon" Belov', from: 'Novosibirsk, Russia', date: '06 Oct 2000', text: 'Скачал 2.04 за десять минут через модем. Игровой движок — это что-то! Мячик прыгает по плоскости, а я ни строчки кода не написал.' },
      { name: 'Maarten', from: 'Utrecht, NL', date: '05 Oct 2000', text: 'The toon edges in the renderer look great with the Eint slider at 128.' },
      { name: 'Jenny K.', from: 'Austin, TX, USA', date: '01 Oct 2000', text: 'My 3D class uses Blender now. The students love the hotkeys after the first week.' }
    ];
  }

  guestbookPage() {
    const list = this.guestbookEntries();
    return `
      ${this.head('Guestbook')}
      <form id="b3d-gb-form" class="b3d-gbform">
        <table cellspacing="0" cellpadding="2">
          <tr><td>Name:</td><td><input id="b3d-gb-name" class="b3d-input" type="text" size="24" maxlength="40"></td></tr>
          <tr><td>From:</td><td><input id="b3d-gb-from" class="b3d-input" type="text" size="24" maxlength="40"></td></tr>
          <tr><td valign="top">Message:</td><td><textarea id="b3d-gb-text" class="b3d-input" rows="3" cols="40" maxlength="400"></textarea></td></tr>
          <tr><td></td><td><input type="submit" class="b3d-submit" value="Sign the guestbook"></td></tr>
        </table>
      </form>
      ${list.map(e => `<div class="b3d-gb"><div class="b3d-gb-head"><b>${this.esc(e.name)}</b> <span class="b3d-small">(${this.esc(e.from)}) &middot; ${this.esc(e.date)}</span></div><div class="b3d-gb-text">${this.esc(e.text)}</div></div>`).join('')}`;
  }

  siteDate(d) {
    return String(d.getDate()).padStart(2, '0') + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' 2000';
  }

  saveGuestbookEntry(name, from, text) {
    const list = this.guestbookEntries();
    list.unshift({ name: String(name).trim().slice(0, 40), from: String(from || '').trim().slice(0, 40) || 'Internet', date: this.siteDate(new Date()), text: String(text).trim().slice(0, 400) });
    try { localStorage.setItem(this.guestbookKey, JSON.stringify(list.slice(0, 60))); } catch (e) {}
  }

  sceneFor(kind) {
    const B = window.B204;
    const D = B.Data, MO = B.MeshOps;
    const main = new B.Main();
    const sce = D.newScene(main, 'gal');
    const put = (ob, loc) => { ob.loc = loc || [0, 0, 0]; sce.bases.push({ object: D.idUser(ob), sel: false }); return ob; };
    const mesh = (name, p, ma) => { const me = D.newMesh(main, name); me.verts = p.verts; me.faces = p.faces; if (ma) me.mats = [D.idUser(ma)]; return D.newObject(main, 'mesh', name, D.idUser(me)); };
    const mat = (r, g, b, extra) => Object.assign(D.newMaterial(main, 'M'), { r, g, b }, extra || {});
    const cam = D.newObject(main, 'camera', 'Cam', D.idUser(D.newCamera(main, 'Cam')));
    cam.loc = [7.5, -9, 6]; cam.rot = [62 * Math.PI / 180, 0, 40 * Math.PI / 180];
    put(cam, cam.loc);
    sce.camera = cam;
    const lampOb = D.newObject(main, 'lamp', 'Lamp', D.idUser(D.newLamp(main, 'Lamp')));
    put(lampOb, [4, -4, 7]);
    const w = D.newWorld(main, 'W');
    w.skytype.blend = true; w.horr = 0.55; w.horg = 0.6; w.horb = 0.7; w.zenr = 0.15; w.zeng = 0.2; w.zenb = 0.45;
    w.ambr = w.ambg = w.ambb = 0.15;
    sce.world = D.idUser(w);
    sce.r.xsch = 160; sce.r.ysch = 120; sce.r.size = 100; sce.r.mode.osa = true; sce.r.osa = 5;
    const floor = () => { const p = MO.prim('plane'); p.verts.forEach(v => { v.co = [v.co[0] * 6, v.co[1] * 6, v.co[2] - 1.2]; }); put(mesh('Floor', p, mat(0.75, 0.75, 0.7, { spec: 0.1 }))); };
    if (kind === 'meta') {
      floor();
      const mb = B.ObTypes.mball.newData(main, 'Meta');
      mb.rendersize = 0.15;
      mb.elems = [{ type: 'ball', co: [0, 0, 0], rad: 2, s: 2, len: 1, sel: false }, { type: 'ball', co: [1.4, 0.4, 0.6], rad: 1.6, s: 2, len: 1, sel: false }, { type: 'tubex', co: [-1, -0.5, -0.2], rad: 1.2, s: 2, len: 1, sel: false }];
      mb.mats = [D.idUser(mat(0.85, 0.15, 0.1, { spec: 1, hard: 80 }))];
      put(D.newObject(main, 'mball', 'Meta', D.idUser(mb)));
    } else if (kind === 'donut') {
      floor();
      const cu = B.Curve.newCurveData(main, 'Donut', 'surf');
      cu.nurbs.push(B.Curve.primSurf('donut'));
      const ma = mat(0.9, 0.85, 0.75);
      const tx = D.newTexture(main, 'Marble');
      tx.type = 'marble'; tx.turbul = 5; tx.noisesize = 0.5;
      ma.mtex[0] = Object.assign(D.newMTex(D.idUser(tx)), { r: 0.25, g: 0.3, b: 0.5 });
      cu.mats = [D.idUser(ma)];
      const ob = put(D.newObject(main, 'surf', 'Donut', D.idUser(cu)));
      ob.size = [0.8, 0.8, 0.8];
    } else if (kind === 'text') {
      const cu = B.Curve.newCurveData(main, 'Text', 'font');
      cu.str = '2.04'; cu.ext1 = 0.25; cu.ext2 = 0.05; cu.bevresol = 1; cu.fsize = 2.4; cu.spacemode = 'middle';
      cu.mats = [D.idUser(mat(1, 0.55, 0.1, { spec: 0.8, hard: 40 }))];
      const ob = put(D.newObject(main, 'font', 'Text', D.idUser(cu)), [0, 0, -0.6]);
      ob.rot = [Math.PI / 2, 0, 40 * Math.PI / 180];
      cam.loc = [5, -9, 3]; cam.rot = [78 * Math.PI / 180, 0, 30 * Math.PI / 180];
    } else if (kind === 'spot') {
      floor();
      const la = lampOb.data;
      la.type = 'spot'; la.mode.shadow = true; la.bufsize = 1024; la.spotsize = 60; la.energy = 1.6; la.clipsta = 1; la.clipend = 30;
      lampOb.loc = [3, -4, 8];
      lampOb.rot = [34 * Math.PI / 180, 0, 37 * Math.PI / 180];
      sce.r.mode.shadow = true;
      put(mesh('Cube', MO.prim('cube'), mat(0.3, 0.5, 0.85)), [-1, 0.5, -0.2]);
      put(mesh('Ball', MO.prim('uvsphere', { segments: 16, rings: 12 }), mat(0.9, 0.9, 0.9, { spec: 1, hard: 90 })), [1.4, -0.8, -0.3]).size = [0.9, 0.9, 0.9];
    } else if (kind === 'wave') {
      const g = MO.prim('grid', { xres: 24, yres: 24 });
      g.verts.forEach(v => { const r = Math.hypot(v.co[0], v.co[1]); v.co = [v.co[0] * 4, v.co[1] * 4, Math.cos(r * 9) * 0.25 * Math.exp(-r * 1.5)]; });
      g.faces.forEach(f => { f.smooth = true; });
      put(mesh('Grid', g, mat(0.2, 0.5, 0.9, { spec: 1.2, hard: 60 })));
    } else if (kind === 'halo') {
      w.horr = w.horg = w.horb = 0.02; w.zenr = 0.05; w.zeng = 0.0; w.zenb = 0.15;
      const p = MO.prim('icosphere', { subdiv: 1 });
      p.verts.forEach(v => { v.co = v.co.map(c => c * 2.4); });
      const ma = mat(1, 0.7, 0.3, { alpha: 1 });
      ma.mode.halo = true; ma.halo.size = 0.35; ma.halo.hard = 30; ma.halo.flags.star = true; ma.halo.flags.lines = true;
      put(mesh('Halos', p, ma));
    }
    sce.bases.forEach(b => D.whereIs(b.object));
    return { main, sce, cam };
  }

  renderScene(kind) {
    const B = typeof window !== 'undefined' ? window.B204 : null;
    if (!B || !B.Render || typeof document === 'undefined' || !document.createElement('canvas').getContext) return null;
    if (this.renders[kind]) return this.renders[kind];
    try {
      const { sce, cam } = this.sceneFor(kind);
      const fake = { G: { obedit: null, f: {}, editMesh: null }, scene: sce, main: null };
      const res = B.Render.runSync(B.Render.renderJob(fake, sce, { camera: cam, noShadows: !sce.r.mode.shadow }));
      const canvas = B.Render.imageToCanvas(B.Render.toImage(res));
      this.renders[kind] = canvas.toDataURL('image/png');
      return this.renders[kind];
    } catch (e) {
      console.warn('gallery render failed', kind, e);
      this.renders[kind] = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      return this.renders[kind];
    }
  }

  fillRenders(win, container) {
    const waiting = [...container.querySelectorAll('.b3d-render-wait')];
    if (!waiting.length) return;
    const step = () => {
      const el = waiting.shift();
      if (!el || !el.isConnected) return;
      const url = this.renderScene(el.dataset.scene);
      if (url) {
        const img = document.createElement('img');
        img.className = 'b3d-render';
        img.width = 160; img.height = 120;
        img.src = url;
        el.replaceWith(img);
      }
      setTimeout(step, 30);
    };
    setTimeout(step, 60);
  }

  attachEvents(win, container) {
    const gm = window.gameManager;
    container.querySelectorAll('.b3d-act').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'dl204' && gm) gm.startDownload('blender204');
        else if (act === 'setup204' && gm) gm.openSetupWizard('blender204');
        else if (act === 'launch204' && window.appBlender204) window.appBlender204.open();
        else if (act === 'dl160' && gm) gm.startDownload('blender');
        else if (act === 'setup160' && gm) gm.openSetupWizard('blender');
        else if (act === 'launch160' && window.appBlender) window.appBlender.open();
      });
    });
    const gb = container.querySelector('#b3d-gb-form');
    if (gb) gb.addEventListener('submit', e => {
      e.preventDefault();
      const name = container.querySelector('#b3d-gb-name'), from = container.querySelector('#b3d-gb-from'), text = container.querySelector('#b3d-gb-text');
      if (!name.value.trim() || !text.value.trim()) return;
      this.saveGuestbookEntry(name.value, from.value, text.value);
      if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
      if (window.appIE) window.appIE.renderPage(win, window.appIE.currentUrl);
    });
    const nf = container.querySelector('#b3d-news-form');
    if (nf) nf.addEventListener('submit', e => {
      e.preventDefault();
      const mail = container.querySelector('#b3d-news-mail').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return;
      try { localStorage.setItem(this.newsletterKey, mail); } catch (err) {}
      if (window.appIE) window.appIE.renderPage(win, window.appIE.currentUrl);
    });
    this.fillRenders(win, container);
  }
}

window.blenderSite = new BlenderSite();
