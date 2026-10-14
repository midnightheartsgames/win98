class AppThemes {
  constructor() {
    this.storageKey = 'win98_plus_theme';
    this.currentThemeId = this.loadTheme();

    this.themes = {
      classic: {
        id: 'classic',
        get name() { return window.i18n ? window.i18n.t('theme.classic.name') : 'Win 98 (Классическая)'; },
        bg: '#008080',
        wallpaper: 'none',
        titleGrad: 'linear-gradient(90deg, #000080, #1084d0)',
        inactiveGrad: 'linear-gradient(90deg, #808080, #b5b5b5)',
        cursor: 'default',
        soundScheme: 'classic',
        get desc() { return window.i18n ? window.i18n.t('theme.classic.desc') : 'Оригинальный интерфейс Win 98 с бирюзовым рабочим столом и классическими звуками.'; }
      },
      space: {
        id: 'space',
        get name() { return window.i18n ? window.i18n.t('theme.space.name') : 'Space (Космос)'; },
        bg: '#060714',
        wallpaper: 'space',
        titleGrad: 'linear-gradient(90deg, #180929, #66107b)',
        inactiveGrad: 'linear-gradient(90deg, #3c2f4a, #6c5d7c)',
        cursor: 'crosshair',
        soundScheme: 'space',
        get desc() { return window.i18n ? window.i18n.t('theme.space.desc') : 'Космическая тема: глубины Вселенной, футуристические окна и звуки сонаров и лазеров.'; }
      },
      creatures: {
        id: 'creatures',
        get name() { return window.i18n ? window.i18n.t('theme.creatures.name') : 'Dangerous Creatures (Опасные твари)'; },
        bg: '#2b1b11',
        wallpaper: 'creatures',
        titleGrad: 'linear-gradient(90deg, #42210b, #935116)',
        inactiveGrad: 'linear-gradient(90deg, #564940, #8d7e75)',
        cursor: 'default',
        soundScheme: 'creatures',
        get desc() { return window.i18n ? window.i18n.t('theme.creatures.desc') : 'Дикая природа: хищные кошки саванны, теплые древесные тона и звуки рычания.'; }
      },
      underwater: {
        id: 'underwater',
        get name() { return window.i18n ? window.i18n.t('theme.underwater.name') : 'Underwater (Подводный мир)'; },
        bg: '#002f3a',
        wallpaper: 'underwater',
        titleGrad: 'linear-gradient(90deg, #002d42, #066d86)',
        inactiveGrad: 'linear-gradient(90deg, #39525e, #678696)',
        cursor: 'cell',
        soundScheme: 'underwater',
        get desc() { return window.i18n ? window.i18n.t('theme.underwater.desc') : 'Морские глубины: коралловые рифы, сине-зелёная гамма и звуки всплывающих пузырей.'; }
      },
      mystery: {
        id: 'mystery',
        get name() { return window.i18n ? window.i18n.t('theme.mystery.name') : 'Mystery (Тайна)'; },
        bg: '#1c1324',
        wallpaper: 'mystery',
        titleGrad: 'linear-gradient(90deg, #2b113a, #5b2171)',
        inactiveGrad: 'linear-gradient(90deg, #44374d, #72627d)',
        cursor: 'help',
        soundScheme: 'mystery',
        get desc() { return window.i18n ? window.i18n.t('theme.mystery.desc') : 'Готическая тайна: сумерки, тёмно-пурпурные окна и звуки старинного органа.'; }
      },
      jungle: {
        id: 'jungle',
        get name() { return window.i18n ? window.i18n.t('theme.jungle.name') : 'Jungle (Джунгли)'; },
        bg: '#103014',
        wallpaper: 'jungle',
        titleGrad: 'linear-gradient(90deg, #19431d, #3e7a2b)',
        inactiveGrad: 'linear-gradient(90deg, #3f5241, #6b826e)',
        cursor: 'default',
        soundScheme: 'jungle',
        get desc() { return window.i18n ? window.i18n.t('theme.jungle.desc') : 'Тропические джунгли: буйная зелень, оливковые рамки и звуки барабанов и птиц.'; }
      },
      matrix: {
        id: 'matrix',
        get name() { return window.i18n ? window.i18n.t('theme.matrix.name') : 'The Matrix 1999 (Матрица)'; },
        bg: '#010a03',
        wallpaper: 'matrix',
        titleGrad: 'linear-gradient(90deg, #002b0e, #00ff41)',
        inactiveGrad: 'linear-gradient(90deg, #0f2414, #275230)',
        cursor: 'crosshair',
        soundScheme: 'matrix',
        get desc() { return window.i18n ? window.i18n.t('theme.matrix.desc') : 'Культовый кибер-стиль: зеленые светящиеся терминалы Небукаднезара, темный фон и звуки цифровой матрицы.'; }
      },
      cyberpunk: {
        id: 'cyberpunk',
        get name() { return window.i18n ? window.i18n.t('theme.cyberpunk.name') : 'Cyberpunk Neon 1998 (Неон)'; },
        bg: '#110024',
        wallpaper: 'cyberpunk',
        titleGrad: 'linear-gradient(90deg, #380062, #ff007f)',
        inactiveGrad: 'linear-gradient(90deg, #2b183d, #623f79)',
        cursor: 'pointer',
        soundScheme: 'cyberpunk',
        get desc() { return window.i18n ? window.i18n.t('theme.cyberpunk.desc') : 'Ретровейв и неоновый закат 90-х: пурпурно-розовые заголовки, футуристическая атмосфера и космический звук.'; }
      },
      redalert: {
        id: 'redalert',
        get name() { return window.i18n ? window.i18n.t('theme.redalert.name') : 'Red Alert (Военная база)'; },
        bg: '#170303',
        wallpaper: 'redalert',
        titleGrad: 'linear-gradient(90deg, #5e0505, #e62200)',
        inactiveGrad: 'linear-gradient(90deg, #3d1b1b, #703d3d)',
        cursor: 'crosshair',
        soundScheme: 'redalert',
        get desc() { return window.i18n ? window.i18n.t('theme.redalert.desc') : 'Штаб командования: тревожные рубиновые тона, строгие линии, тактическая карта и звуки тревоги.'; }
      },
      gold: {
        id: 'gold',
        get name() { return window.i18n ? window.i18n.t('theme.gold.name') : 'Millennium 98 Gold (Золотой век)'; },
        bg: '#1c1607',
        wallpaper: 'gold',
        titleGrad: 'linear-gradient(90deg, #6e4e00, #ffcc00)',
        inactiveGrad: 'linear-gradient(90deg, #423820, #807049)',
        cursor: 'default',
        soundScheme: 'classic',
        get desc() { return window.i18n ? window.i18n.t('theme.gold.desc') : 'Роскошный золотой интерфейс для истинных ценителей классики Win 98.'; }
      }
    };

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyTheme(this.currentThemeId, false));
      } else {
        this.applyTheme(this.currentThemeId, false);
      }
    }
  }

  loadTheme() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) return saved;
      }
    } catch (e) {}
    return 'classic';
  }

  saveTheme(themeId) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, themeId);
      }
    } catch (e) {}
  }

  getWallpaperGradient(wallId) {
    if (window.appDialogs && typeof window.appDialogs.getWallpaperCss === 'function') {
      const css = window.appDialogs.getWallpaperCss(wallId);
      if (css && css !== 'none') return css;
    }
    switch (wallId) {
      case 'space':
        return 'radial-gradient(circle at 70% 30%, #3a0d5c 0%, #15082a 45%, #04020a 100%)';
      case 'creatures':
        return 'radial-gradient(ellipse at 50% 40%, #873600 0%, #4a2306 60%, #1a0c02 100%)';
      case 'underwater':
        return 'radial-gradient(ellipse at 50% 20%, #0e6251 0%, #0b3c37 50%, #04181a 100%)';
      case 'mystery':
        return 'radial-gradient(circle at 40% 30%, #4a235a 0%, #240c30 55%, #0e0514 100%)';
      case 'jungle':
        return 'radial-gradient(circle at 60% 40%, #145a32 0%, #0d381e 50%, #05160a 100%)';
      case 'matrix':
        return (window.appDialogs && typeof window.appDialogs.getMatrixWallpaperUrl === 'function')
          ? `url("${window.appDialogs.getMatrixWallpaperUrl()}")`
          : 'radial-gradient(ellipse at 50% 50%, #003311 0%, #001507 55%, #000501 100%)';
      default:
        return 'none';
    }
  }

  applyTheme(themeId, playSound = true) {
    const theme = this.themes[themeId] || this.themes['classic'];
    this.currentThemeId = theme.id;
    this.saveTheme(theme.id);

    const desktopEl = document.getElementById('desktop');
    if (desktopEl) {
      desktopEl.style.backgroundColor = theme.bg;
      if (window.appDialogs && typeof window.appDialogs.applyWallpaperMode === 'function') {
        window.appDialogs.applyWallpaperMode(desktopEl, 'stretch', theme.wallpaper);
      } else {
        const wallGrad = this.getWallpaperGradient(theme.wallpaper);
        if (wallGrad !== 'none') {
          desktopEl.style.backgroundImage = wallGrad;
          desktopEl.style.backgroundSize = 'cover';
        } else {
          desktopEl.style.backgroundImage = 'none';
        }
      }
    }

    if (window.appDialogs && typeof window.appDialogs.saveDisplaySettings === 'function') {
      window.appDialogs.saveDisplaySettings({
        themeId: theme.id,
        themeGrad: theme.titleGrad,
        bgColor: theme.bg,
        wallpaper: theme.wallpaper || 'none'
      });
    }

    document.documentElement.style.setProperty('--win-active-title', theme.titleGrad);
    document.documentElement.style.setProperty('--win-theme-bg', theme.bg);
    document.documentElement.style.setProperty('--win-desktop-bg', theme.bg);
    document.body.style.cursor = theme.cursor;

    if (playSound && window.soundSys) {
      window.soundSys.playPlusSound(theme.soundScheme, 'startup');
    }
  }

  openThemeSelector() {
    if (window.appDialogs) {
      window.appDialogs.openDisplayProperties();
    }
  }
}

window.appThemes = new AppThemes();
