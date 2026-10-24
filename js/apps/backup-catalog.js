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
    { id: 'builtin', group: 'games', ru: 'Стандартные игры: Сапер, Косынка, Солитер, Пинбол', en: 'Standard games: Minesweeper, Solitaire, FreeCell, Pinball', icon: 'minesweeper', keys: ['win98_minesweeper_*', 'win98_solitaire_*', 'win98_freecell_*', 'win98_pinball_*'] },
    { id: 'office', group: 'games', ru: 'Офисные игры: рекорды', en: 'Office games high scores', icon: 'joystick', keys: ['office_games_*'] },
    game('hsr98', ['hsr98.*']),
    game('mc98', ['mc98.*']),
    game('doom', ['doom98-*']),
    game('wolf3d', ['wolf3d98-*']),
    game('cop98', ['cop98-*']),
    game('stalker98', ['stalker98-*']),
    game('stalker', ['stalker_save', 'stalker_prefs', 'stalker_unlocked_endings']),
    game('korovany', ['korovany98_*']),
    game('falloutzp', ['falloutzp_*']),
    game('gtann', ['gtann_*']),
    game('dao98', ['dao98_*']),
    game('avatar98', ['avatar98-*']),
    game('kotor98', ['kotor98_*']),
    game('gta90', ['gta90_*']),
    game('hl2', ['hl2_2000_*']),
    game('maxpayne', ['mp98_*']),
    game('sims3', ['sims3_2000_*']),
    game('sammax', ['sammax101_*']),
    game('sammax102', ['sammax102_*']),
    game('sammax103', ['sammax103_*']),
    game('sammax104', ['sammax104_*']),
    game('sammax105', ['sammax105_*']),
    game('sammax106', ['sammax106_*']),
    game('sammax201', ['sammax201_*']),
    game('sammax202', ['sammax202_*']),
    game('bttf', ['bttf_*']),
    game('diablo2', ['diablo2_98_*']),
    game('fallout', ['fallout98_*'], { dbs: ['fallout98'] }),
    game('anotherwar', ['anotherwar_*'], { dbs: ['anotherwar98'] }),
    game('fallout2', ['fo2_*']),
    game('homm1', ['win98_homm1_*']),
    game('diablo', ['diablo98-*']),
    game('dmc98', ['dmc98-*']),
    game('dota', ['dota98-*']),
    game('lol', ['lol98-*']),
    game('moh98', ['moh98-*']),
    game('serioussam', ['ss98-*']),
    game('half-life', ['hl98-*']),
    game('quake3', ['q3a_*']),
    game('xiii', ['x13_*']),
    game('forza', ['fh_riga_*', 'fh_photo_probe']),
    game('legion', ['legion98_*']),
    game('ow98', ['ow98_*']),
    game('tekken3', ['tekken3-98-*']),
    game('catniss', ['catniss98_*']),
    game('plov', ['plov98_*']),
    game('worldcup98', ['wc98_*']),
    game('burnout', ['win98_burnout_*']),
    game('neon-racer', ['midnight-*']),
    { id: 'ashroad', group: 'games', ru: 'Пепельный Тракт (браузерная игра)', en: 'Ash Road (browser game)', icon: 'ie-page', keys: ['win98_ashroad98_*'] }
  ];

  const other = { id: 'other', group: 'other', ru: 'Прочие данные', en: 'Other data', icon: 'file-txt', keys: [] };
  components.push(other);

  const matches = (rule, name) => (rule.endsWith('*') ? name.startsWith(rule.slice(0, -1)) : name === rule);
  const byId = id => components.find(c => c.id === id) || other;

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
