(() => {
  const groups = [
    { id: 'system', ru: 'Система Win 98', en: 'Win 98 system', icon: 'my-computer' },
    { id: 'net', ru: 'Интернет и связь', en: 'Internet and communication', icon: 'internet-explorer' },
    { id: 'apps', ru: 'Программы', en: 'Programs', icon: 'programs' },
    { id: 'games', ru: 'Игры и сохранения', en: 'Games and saves', icon: 'joystick' },
    { id: 'other', ru: 'Прочее', en: 'Other', icon: 'folder' }
  ];

  const SITE_PREFIXES = [
    '3advanced', 'anekdot', 'animatrix', 'astralwiki', 'avp_site', 'bioware', 'blender_', 'carman', 'clippy98_', 'digi', 'dima_',
    'emuland_downloads', 'fargus', 'ferrum', 'fidonet', 'forum_', 'geocities', 'gsc', 'hsrsite', 'hsr98_save', 'interpedia', 'kinomania',
    'kish', 'kovcheg', 'krovatka', 'lucasarts', 'molotok', 'msft_', 'mult', 'muzzone', 'news_', 'pereplet', 'prodigy', 'retro_',
    'sunsetvalley', 'svodka', 'themeworld', 'valve', 'webcinema', 'xakep', 'xfiles', 'zooportal'
  ].map(p => 'win98_' + p + '*');

  const game = (gameId, keys, extra) => Object.assign({ id: 'game_' + gameId, group: 'games', gameId, keys }, extra || {});

  const components = [
    { id: 'files', group: 'system', ru: 'Файлы и папки диска C:', en: 'Files and folders on drive C:', icon: 'drive-c', keys: ['win98_vfs_data', 'win98_cdrom_state', 'win98_downloaded_videos'] },
    { id: 'steam', group: 'system', ru: 'Steam: покупки и установленные игры', en: 'Steam: purchases and installed games', icon: 'steam', keys: ['win98_game_state', 'win98_steam'] },
    { id: 'settings', group: 'system', ru: 'Реестр и настройки', en: 'Registry and settings', icon: 'regedit', keys: [
      'win98_registry_data', 'win98_display_settings', 'win98_custom_screensaver_timeout', 'win98_bios_settings', 'win98_language', 'win98_volume',
      'win98_plus_theme', 'win98_downloaded_wallpapers', 'win98_downloaded_screensavers', 'win98_downloaded_themes', 'win98_show_welcome',
      'win98_installed_updates', 'win98_folder_options', 'win98_mouse_settings', 'win98_appwiz_state', 'win98_ie_home', 'win98_power_settings',
      'win98_net_compname', 'win98_net_workgroup', 'win98_controls_*'
    ] },
    { id: 'desktop', group: 'system', ru: 'Рабочий стол, меню «Пуск» и окна', en: 'Desktop, Start menu and windows', icon: 'show-desktop', keys: [
      'win98_desktop_icon_positions', 'win98_taskbar_settings', 'win98_start_menu', 'win98_recent_docs', 'win98_run_mru', 'win98_shortcut_props',
      'win98_bounds_*', 'win98_ie_window_bounds', 'win98_explorer_window_bounds', 'win98_netscape_window_bounds'
    ] },
    { id: 'bugreports', group: 'system', ru: 'Отчёты об ошибках', en: 'Problem reports', icon: 'bugreport', keys: ['win98.bugs.*'], dbs: ['win98_bugs'] },
    { id: 'outlook', group: 'net', ru: 'Outlook Express: почта', en: 'Outlook Express mail', icon: 'outlook', keys: ['win98_outlook_*'] },
    { id: 'icq', group: 'net', ru: 'ICQ: профиль и контакты', en: 'ICQ profile and contacts', icon: 'icq-online', keys: ['win98_icq_*'] },
    { id: 'netscape', group: 'net', ru: 'Netscape: закладки и журнал', en: 'Netscape bookmarks and history', icon: 'netscape', keys: ['win98_netscape_*'] },
    { id: 'sites', group: 'net', ru: 'Сайты: гостевые книги, форумы, опросы', en: 'Web sites: guestbooks, forums, polls', icon: 'ie-page', keys: [...SITE_PREFIXES, 'blizzard98_*', 'poligon3d', 'youvid98'] },
    { id: 'clippy', group: 'apps', ru: 'Скрепыш: настройки, переписка, гардероб', en: 'Clippy: options, letters, wardrobe', icon: 'clippy', keys: ['win98_clippy_*'] },
    { id: 'neko', group: 'apps', ru: 'Neko', en: 'Neko', icon: 'neko', keys: ['win98_neko_*'] },
    { id: 'esheep', group: 'apps', ru: 'eSheep', en: 'eSheep', icon: 'esheep', keys: ['win98_esheep_*'] },
    { id: 'winamp', group: 'apps', ru: 'Winamp', en: 'Winamp', icon: 'winamp', keys: ['win98_winamp_*'] },
    { id: 'cdplayer', group: 'apps', ru: 'Лазерный проигрыватель', en: 'CD Player', icon: 'cdplayer', keys: ['win98_cdplayer_*'] },
    { id: 'emulator', group: 'apps', ru: 'EmuLand: сохранения эмулятора', en: 'EmuLand emulator states', icon: 'emulator', keys: ['win98_emuland_states*'] },
    { id: 'blender204', group: 'apps', ru: 'Blender 2.04: настройки', en: 'Blender 2.04 preferences', icon: 'blender204', keys: ['b204_*'] },
    { id: 'builtin', group: 'games', ru: 'Стандартные игры: Сапер, Косынка, Солитер, Пинбол, Безмятежность', en: 'Standard games: Minesweeper, Solitaire, FreeCell, Pinball, Bliss', icon: 'minesweeper', keys: ['win98_minesweeper_*', 'win98_solitaire_*', 'win98_freecell_*', 'win98_pinball_*', 'win98_bliss_*'] },
    { id: 'office', group: 'games', ru: 'Офисные игры: рекорды', en: 'Office games high scores', icon: 'joystick', keys: ['office_games_*'] },
    { id: 'office2', group: 'games', ru: 'Офисные игры 2: рекорды', en: 'Office Games 2 high scores', icon: 'joystick', keys: ['office_games2_*'] },
    game('hsr98', ['hsr98.*']),
    game('mc98_demo', ['mc98.*'], { id: 'game_mc98' }),
    game('doom', ['doom98-*']),
    game('wolf3d', ['wolf3d98-*']),
    game('cop98', ['cop98-*']),
    game('stalker98_demo', ['stalker98-*'], { id: 'game_stalker98' }),
    game('stalker', ['stalker_save', 'stalker_prefs', 'stalker_unlocked_endings']),
    game('korovany_demo', ['korovany98_*'], { id: 'game_korovany' }),
    game('falloutzp_demo', ['falloutzp_*'], { id: 'game_falloutzp' }),
    game('gtann', ['gtann_*']),
    game('dao98_demo', ['dao98_*'], { id: 'game_dao98' }),
    game('avatar98', ['avatar98-*']),
    game('kotor98_demo', ['kotor98_*'], { id: 'game_kotor98' }),
    game('gta90', ['gta90_*']),
    game('hl2_demo', ['hl2_2000_*'], { id: 'game_hl2' }),
    game('maxpayne_demo', ['mp98_*'], { id: 'game_maxpayne' }),
    game('sims3_demo', ['sims3_2000_*'], { id: 'game_sims3' }),
    game('sammax', ['sammax101_*']),
    game('sammax102', ['sammax102_*']),
    game('sammax103', ['sammax103_*']),
    game('sammax104', ['sammax104_*']),
    game('sammax105', ['sammax105_*']),
    game('sammax106', ['sammax106_*']),
    game('sammax201', ['sammax201_*']),
    game('sammax202_demo', ['sammax202_*'], { id: 'game_sammax202' }),
    game('bttf', ['bttf_*']),
    game('diablo2', ['diablo2_98_*']),
    game('fallout', ['fallout98_*'], { dbs: ['fallout98'] }),
    game('anotherwar', ['anotherwar_*'], { dbs: ['anotherwar98'] }),
    game('fallout98_demo', ['fo2_*'], { id: 'game_fallout2' }),
    game('homm1_demo', ['win98_homm1_*'], { id: 'game_homm1' }),
    game('diablo', ['diablo98-*']),
    game('dmc98_demo', ['dmc98-*'], { id: 'game_dmc98' }),
    game('dota', ['dota98-*']),
    game('lol', ['lol98-*']),
    game('moh98_demo', ['moh98-*'], { id: 'game_moh98' }),
    game('serioussam', ['ss98-*']),
    game('half-life_demo', ['hl98-*'], { id: 'game_half-life' }),
    game('quake3', ['q3a_*']),
    game('xiii_demo', ['x13_*'], { id: 'game_xiii' }),
    game('forza', ['fh_riga_*', 'fh_photo_probe']),
    game('legion', ['legion98_*']),
    game('ow98', ['ow98_*']),
    game('tekken98_demo', ['tekken3-98-*'], { id: 'game_tekken3' }),
    game('catniss', ['catniss98_*']),
    game('kirill98', ['kirill98_*'], { dbs: ['kirill98'] }),
    game('plov', ['plov98_*']),
    game('worldcup98', ['wc98_*']),
    game('burnout', ['win98_burnout_*']),
    game('neon-racer_demo', ['midnight-*'], { id: 'game_neon-racer' }),
    { id: 'ashroad', group: 'games', ru: 'Пепельный Тракт (браузерная игра)', en: 'Ash Road (browser game)', icon: 'ie-page', keys: ['win98_ashroad98_*'] }
  ];

  const other = { id: 'other', group: 'other', ru: 'Прочие данные', en: 'Other data', icon: 'file-txt', keys: [] };
  components.push(other);

  const matches = (rule, name) => (rule.endsWith('*') ? name.startsWith(rule.slice(0, -1)) : name === rule);
  const byId = id => components.find(c => c.id === id) || other;

  const PHONE_ONLY_KEYS = ['gtann_settings', 'ss98-options'];
  const PHONE_ONLY_FORZA = ['gfx', 'res', 'draw', 'flora', 'traffic', 'fps', 'tsteer', 'tslide', 'ttilt', 'tauto', 'tpreset', 'tpresetV'];
  const GTA_AUTO_SLOT = 'gtann_save_5';

  const localValue = key => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const forzaForPc = (text, pcText) => {
    try {
      const profile = JSON.parse(text);
      const pc = pcText ? JSON.parse(pcText) : null;
      const settings = profile.settings || {};
      for (const key of PHONE_ONLY_FORZA) {
        delete settings[key];
        if (pc && pc.settings && pc.settings[key] !== undefined) settings[key] = pc.settings[key];
      }
      profile.settings = settings;
      return JSON.stringify(profile);
    } catch (e) {
      return text;
    }
  };

  const gtaAutoToSlot = ls => {
    if (!ls[GTA_AUTO_SLOT]) return;
    const savedAt = key => {
      try {
        return String(JSON.parse(ls[key]).savedAt || '');
      } catch (e) {
        return '';
      }
    };
    const slots = [1, 2, 3, 4].map(n => 'gtann_save_' + n);
    const target = slots.find(k => !ls[k]) || slots.slice().sort((a, b) => savedAt(a).localeCompare(savedAt(b)))[0];
    if (!ls[target] || savedAt(GTA_AUTO_SLOT) >= savedAt(target)) ls[target] = ls[GTA_AUTO_SLOT];
    delete ls[GTA_AUTO_SLOT];
  };

  const fromPhone = raw => {
    const component = 'game_' + raw.game;
    const ls = {};
    for (const [k, v] of Object.entries(raw.keys || {})) if (Catalog.componentOfKey(k) === component && !PHONE_ONLY_KEYS.includes(k)) ls[k] = typeof v === 'string' ? v : JSON.stringify(v);
    if (!Object.keys(ls).length) return null;
    for (const key of PHONE_ONLY_KEYS) {
      const pc = Catalog.componentOfKey(key) === component ? localValue(key) : null;
      if (pc !== null) ls[key] = pc;
    }
    if (ls.fh_riga_profile_v1) ls.fh_riga_profile_v1 = forzaForPc(ls.fh_riga_profile_v1, localValue('fh_riga_profile_v1'));
    gtaAutoToSlot(ls);
    const c = byId(component);
    return { label: 'Пароход 98: ' + Catalog.nameOf(c, true), created: raw.date, data: { ls, idb: {} } };
  };

  const gameEntry = c => (c.gameId && window.gameManager && window.gameManager.catalog ? window.gameManager.catalog[c.gameId] : null);

  const Catalog = {
    groups,
    components,
    byId,
    componentOfKey(key) {
      return (components.find(c => (c.keys || []).some(r => matches(r, key))) || other).id;
    },
    componentOfDb(name) {
      return (components.find(c => (c.dbs || []).includes(name)) || other).id;
    },
    nameOf(c, ru) {
      if (!c) return '';
      const g = gameEntry(c);
      if (g) return g.title + (ru ? ' — сохранения' : ' saves');
      return ru ? (c.ru || c.id) : (c.en || c.ru || c.id);
    },
    iconOf(c) {
      const g = gameEntry(c);
      return (g && g.icon) || c.icon || 'joystick';
    },
    convertForeign(raw) {
      if (raw.format === 'Parohod98-saves') return fromPhone(raw);
      const slots = raw.format === 'StarRail98-saves' && raw.slots ? raw.slots : null;
      const ls = {};
      if (slots) {
        for (const [slot, data] of Object.entries(slots)) if (data && typeof data === 'object') ls['hsr98.save.' + slot] = JSON.stringify(data);
      } else {
        for (const [k, v] of Object.entries(raw)) if (/^hsr98\.save\./.test(k)) ls[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
      if (!Object.keys(ls).length) return null;
      return { label: 'Star Rail 98', created: raw.exported, data: { ls, idb: {} } };
    }
  };

  window.BackupCatalog = Catalog;
})();
