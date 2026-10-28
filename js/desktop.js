class Desktop {
  constructor() {
    this.desktopEl = document.getElementById('desktop');
    this.iconsContainer = document.getElementById('desktop-icons');
    this.selectionBox = document.getElementById('selection-box');
    this.contextMenu = document.getElementById('context-menu');

    this.selectedIcons = new Set();
    this.isDraggingMarquee = false;
    this.startX = 0;
    this.startY = 0;

    this.storageKey = 'win98_desktop_icon_positions';
    this.iconPositions = this.loadIconPositions();
    this.isDraggingIcons = false;
    this.justDragged = false;
    this.justMarquee = false;

    const iconSettings = this.readIconSettings();
    this.largeIcons = iconSettings.large;
    this.iconOverrides = iconSettings.overrides;
    this.setLargeIconClass();

    if (window.gameManager) {
      window.gameManager.addListener(() => this.renderIcons());
    }
    if (window.i18n) {
      window.i18n.addListener(() => this.renderIcons());
    }

    this.renderIcons();
    this.initEvents();
  }

  loadIconPositions() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            delete parsed['digicharat'];
            delete parsed['Киномания 98.url'];
            const renames = (window.gameManager && window.gameManager.demoRenames) || {};
            Object.keys(renames).filter(id => parsed[id]).forEach(id => {
              parsed[renames[id]] = parsed[renames[id]] || parsed[id];
              delete parsed[id];
            });
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load desktop icon positions:', e);
    }
    return {};
  }

  saveIconPositions() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.iconPositions));
      }
    } catch (e) {
      console.warn('Failed to save desktop icon positions:', e);
    }
  }

  readIconSettings() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('win98_display_settings') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        return {
          large: parsed.largeIcons === true,
          overrides: parsed.desktopIcons && typeof parsed.desktopIcons === 'object' ? { ...parsed.desktopIcons } : {}
        };
      }
    } catch (e) {
      console.warn('Failed to read desktop icon settings:', e);
    }
    return { large: false, overrides: {} };
  }

  setLargeIconClass() {
    const list = typeof document !== 'undefined' && document.body && document.body.classList;
    if (!list) return;
    if (this.largeIcons) list.add('fx-large-icons');
    else if (list.remove) list.remove('fx-large-icons');
  }

  systemIcon(defaultKey) {
    const custom = this.iconOverrides && this.iconOverrides[defaultKey];
    return custom && typeof Icons !== 'undefined' && Icons[custom] ? custom : defaultKey;
  }

  applyIconSettings(large, overrides) {
    const nextLarge = Boolean(large);
    const nextOverrides = overrides && typeof overrides === 'object' ? { ...overrides } : {};
    const currentOverrides = this.iconOverrides || {};
    const iconsChanged = Array.from(new Set(Object.keys(currentOverrides).concat(Object.keys(nextOverrides))))
      .some(slot => currentOverrides[slot] !== nextOverrides[slot]);
    const sizeChanged = nextLarge !== this.largeIcons;
    if (!sizeChanged && !iconsChanged) return false;
    this.iconOverrides = nextOverrides;
    if (sizeChanged) this.regridIcons(nextLarge);
    this.renderIcons();
    return true;
  }

  regridIcons(large) {
    const before = this.getGridMetrics();
    const cells = {};
    Object.keys(this.iconPositions).forEach(id => {
      const p = this.iconPositions[id];
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;
      cells[id] = {
        col: Math.max(0, Math.round((p.x - 10) / before.cellWidth)),
        row: Math.max(0, Math.round((p.y - 10) / before.cellHeight))
      };
    });
    this.largeIcons = large;
    this.setLargeIconClass();
    const after = this.getGridMetrics();
    Object.keys(cells).forEach(id => {
      const { col, row } = cells[id];
      if (col >= after.maxCols || row >= after.maxRows) delete this.iconPositions[id];
      else this.iconPositions[id] = { x: 10 + col * after.cellWidth, y: 10 + row * after.cellHeight };
    });
    this.saveIconPositions();
  }

  getGridMetrics() {
    const dWidth = (this.desktopEl && this.desktopEl.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const dHeight = (this.desktopEl && this.desktopEl.clientHeight) || (typeof window !== 'undefined' ? window.innerHeight - 28 : 572);
    const cellWidth = this.largeIcons ? 94 : 78;
    const cellHeight = this.largeIcons ? 92 : 76;
    const maxRows = Math.max(1, Math.floor((dHeight - 20) / cellHeight));
    const maxCols = Math.max(1, Math.floor((dWidth - 20) / cellWidth));
    return { dWidth, dHeight, cellWidth, cellHeight, maxRows, maxCols };
  }

  ensureIconPositions() {
    const { cellWidth, cellHeight, maxRows } = this.getGridMetrics();

    const occupied = new Set();
    Object.keys(this.iconPositions).forEach(id => {
      const p = this.iconPositions[id];
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        const c = Math.max(0, Math.round((p.x - 10) / cellWidth));
        const r = Math.max(0, Math.round((p.y - 10) / cellHeight));
        occupied.add(`${c},${r}`);
      }
    });

    let nextSlotIndex = 0;
    const getNextFreeSlot = () => {
      while (true) {
        const col = Math.floor(nextSlotIndex / maxRows);
        const row = nextSlotIndex % maxRows;
        nextSlotIndex++;
        const key = `${col},${row}`;
        if (!occupied.has(key)) {
          occupied.add(key);
          return {
            x: 10 + col * cellWidth,
            y: 10 + row * cellHeight
          };
        }
      }
    };

    const taken = new Set();
    let changed = false;
    this.icons.forEach(item => {
      let pos = this.iconPositions[item.id];
      const valid = pos && typeof pos.x === 'number' && typeof pos.y === 'number';
      if (!valid || taken.has(`${pos.x},${pos.y}`)) {
        pos = getNextFreeSlot();
        this.iconPositions[item.id] = pos;
        changed = true;
      }
      taken.add(`${pos.x},${pos.y}`);
    });

    if (changed) {
      this.saveIconPositions();
    }
  }

  clampToViewport(pos, { dWidth, dHeight, cellWidth = 78, cellHeight = 76 }) {
    return {
      x: Math.max(0, Math.min(Math.max(0, dWidth - (cellWidth - 4)), pos.x)),
      y: Math.max(0, Math.min(Math.max(0, dHeight - (cellHeight - 4)), pos.y))
    };
  }

  shownPositions(metrics) {
    const { cellWidth, cellHeight, maxRows, maxCols } = metrics;
    const iconW = cellWidth - 4;
    const iconH = cellHeight - 4;
    const placed = [];
    const shown = {};
    const overlaps = (x, y) => placed.some(p => Math.abs(p.x - x) < iconW && Math.abs(p.y - y) < iconH);
    const displaced = [];
    (this.icons || []).forEach(item => {
      const stored = this.iconPositions[item.id] || { x: 10, y: 10 };
      const clamped = this.clampToViewport(stored, metrics);
      if (clamped.x === stored.x && clamped.y === stored.y) {
        shown[item.id] = clamped;
        placed.push(clamped);
      } else {
        displaced.push({ id: item.id, stored, clamped });
      }
    });
    displaced.sort((a, b) => (a.stored.x - b.stored.x) || (a.stored.y - b.stored.y));
    displaced.forEach(({ id, clamped }) => {
      let best = null;
      let bestDist = Infinity;
      for (let col = 0; col < maxCols; col++) {
        for (let row = 0; row < maxRows; row++) {
          const { x, y } = this.clampToViewport({ x: 10 + col * cellWidth, y: 10 + row * cellHeight }, metrics);
          const dist = Math.hypot(x - clamped.x, y - clamped.y);
          if (dist < bestDist && !overlaps(x, y)) {
            best = { x, y };
            bestDist = dist;
          }
        }
      }
      shown[id] = best || clamped;
      placed.push(shown[id]);
    });
    return shown;
  }

  applyPositions() {
    const shown = this.shownPositions(this.getGridMetrics());
    const iconEls = this.iconsContainer.querySelectorAll('.desktop-icon');
    iconEls.forEach(el => {
      const pos = shown[el.dataset.id];
      if (pos) {
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
      }
    });
  }

  arrangeIcons() {
    const { cellWidth, cellHeight, maxRows } = this.getGridMetrics();
    this.iconPositions = {};
    this.icons.forEach((item, index) => {
      const col = Math.floor(index / maxRows);
      const row = index % maxRows;
      this.iconPositions[item.id] = {
        x: 10 + col * cellWidth,
        y: 10 + row * cellHeight
      };
    });
    this.saveIconPositions();
    this.applyPositions();
  }

  lineUpIcons() {
    const { cellWidth, cellHeight, maxRows, maxCols } = this.getGridMetrics();
    const occupied = new Set();
    const newPositions = {};

    const sorted = [...this.icons].sort((a, b) => {
      const posA = this.iconPositions[a.id] || { x: 0, y: 0 };
      const posB = this.iconPositions[b.id] || { x: 0, y: 0 };
      return (posA.x - posB.x) || (posA.y - posB.y);
    });

    sorted.forEach(item => {
      const current = this.iconPositions[item.id] || { x: 10, y: 10 };
      let col = Math.max(0, Math.min(maxCols - 1, Math.round((current.x - 10) / cellWidth)));
      let row = Math.max(0, Math.min(maxRows - 1, Math.round((current.y - 10) / cellHeight)));

      if (occupied.has(`${col},${row}`)) {
        let found = false;
        for (let dist = 1; dist < maxCols + maxRows && !found; dist++) {
          for (let dc = -dist; dc <= dist && !found; dc++) {
            for (let dr = -dist; dr <= dist && !found; dr++) {
              if (Math.abs(dc) + Math.abs(dr) === dist) {
                const nc = col + dc;
                const nr = row + dr;
                if (nc >= 0 && nc < maxCols && nr >= 0 && nr < maxRows && !occupied.has(`${nc},${nr}`)) {
                  col = nc;
                  row = nr;
                  found = true;
                }
              }
            }
          }
        }
      }

      occupied.add(`${col},${row}`);
      newPositions[item.id] = {
        x: 10 + col * cellWidth,
        y: 10 + row * cellHeight
      };
    });

    this.iconPositions = newPositions;
    this.saveIconPositions();
    this.applyPositions();
  }

  isShortcut(item) {
    const systemIcons = ['my-computer', 'my-documents', 'network', 'recycle-bin', 'ie', 'cdrom_igromania'];
    return !item.isFile && !systemIcons.includes(item.id);
  }

  getBaseIcons() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isBinEmpty = window.vfs ? window.vfs.getRecycleBinItems().length === 0 : false;
    return [
      { id: 'my-computer', title: t('app.myComputer'), icon: this.systemIcon('my-computer'), action: () => window.appExplorer && window.appExplorer.open(['My Computer']) },
      { id: 'my-documents', title: t('app.myDocs'), icon: this.systemIcon('my-documents'), action: () => window.appExplorer && window.appExplorer.open(['My Computer', 'C:', 'My Documents']) },
      { id: 'network', title: t('app.network'), icon: this.systemIcon('network'), action: () => window.appExplorer ? window.appExplorer.open(['Network Neighborhood']) : (window.winManager && window.winManager.openDialog({ title: t('network.title'), icon: 'network', message: t('network.msg') })) },
      { id: 'recycle-bin', title: t('app.recycleBin'), icon: this.systemIcon(isBinEmpty ? 'recycle-bin-empty' : 'recycle-bin'), action: () => window.appRecycleBin && window.appRecycleBin.open() },
      { id: 'ie', title: 'Internet Explorer', icon: 'internet-explorer', action: () => window.appIE && window.appIE.open() },
      { id: 'netscape', title: 'Netscape 6', icon: 'netscape', action: () => window.appNetscape && window.appNetscape.open() },
      { id: 'notepad', title: t('app.notepad'), icon: 'notepad', action: () => window.appNotepad && window.appNotepad.open() },
      { id: 'paint', title: t('app.paint'), icon: 'paint', action: () => window.appPaint && window.appPaint.open() },
      { id: 'calc', title: t('app.calculator'), icon: 'calculator', action: () => window.appCalculator && window.appCalculator.open() },
      { id: 'minesweeper', title: t('app.minesweeper'), icon: 'minesweeper', action: () => window.appMinesweeper && window.appMinesweeper.open() },
      { id: 'solitaire', title: t('app.solitaire'), icon: 'solitaire', action: () => window.appSolitaire && window.appSolitaire.open() },
      { id: 'pinball', title: '3D Pinball', icon: 'pinball', action: () => window.appPinball && window.appPinball.open() },
      { id: 'icq', title: 'ICQ 98a', icon: 'icq-online', action: () => window.appICQ && window.appICQ.open() },
      { id: 'outlook', title: 'Outlook Express', icon: 'outlook', action: () => window.appOutlook && window.appOutlook.open() },
      { id: 'dialup', title: t('app.dialup'), icon: 'dialup', action: () => window.appDialUp && window.appDialUp.open() },
      { id: 'winrar', title: 'WinRAR 2.x', icon: 'winrar', action: () => window.appWinRAR && window.appWinRAR.open() },
      { id: 'freecell', title: t('app.freecell'), icon: 'freecell', action: () => window.appFreeCell && window.appFreeCell.open() },
      { id: 'wordpad', title: t('app.wordpad'), icon: 'wordpad', action: () => window.appWordPad && window.appWordPad.open() },
      { id: 'neko', title: 'Neko 98', icon: window.appNeko && window.appNeko.isClawd() ? 'clawd' : 'neko', action: () => window.appNeko && window.appNeko.open() },
      { id: 'msbackup', title: t('app.backup'), icon: 'backup', action: () => window.appBackup && window.appBackup.open() }
    ];
  }

  computeCurrentIcons() {
    const list = [...this.getBaseIcons()];

    if (window.gameManager) {
      if (window.gameManager.isInstalled('wolf3d')) {
        list.push({ id: 'wolf3d', title: 'Wolfenstein 3D', icon: 'wolf3d', action: () => window.appWolf3D && window.appWolf3D.open() });
      }
      if (window.gameManager.isInstalled('quest_demo')) {
        list.push({ id: 'quest_demo', title: 'LucasQuest 98 Demo', icon: 'lucas-quest', action: () => window.appScummQuest && window.appScummQuest.open() });
      }
      if (window.gameManager.isInstalled('stalker')) {
        list.push({ id: 'stalker', title: 'S.T.A.L.K.E.R.', icon: 'stalker', action: () => window.appStalker && window.appStalker.open() });
      }
      if (window.gameManager.isInstalled('fallout98_demo')) {
        list.push({ id: 'fallout98_demo', title: 'Fallout 98 Demo', icon: 'fallout2', action: () => window.appFallout2 && window.appFallout2.open() });
      }
      if (window.gameManager.isInstalled('burnout')) {
        list.push({ id: 'burnout', title: 'Burnout Demo', icon: 'burnout', action: () => window.appBurnout && window.appBurnout.open() });
      }
      if (window.gameManager.isInstalled('half-life_demo')) {
        list.push({ id: 'half-life_demo', title: 'Half-Life 98 Demo', icon: 'half-life', action: () => window.appHalfLife && window.appHalfLife.open() });
      }
      if (window.gameManager.isInstalled('neon-racer_demo')) {
        list.push({ id: 'neon-racer_demo', title: 'Midnight Glide Demo', icon: 'burnout', action: () => window.appNeonRacer && window.appNeonRacer.open() });
      }
      if (window.gameManager.isInstalled('doom')) {
        list.push({ id: 'doom', title: 'DOOM 98', icon: 'doom', action: () => window.appDoom && window.appDoom.open() });
      }
      if (window.gameManager.isInstalled('serioussam')) {
        list.push({ id: 'serioussam', title: 'Serious Sam 98', icon: 'serioussam', action: () => window.appSeriousSam && window.appSeriousSam.open() });
      }
      if (window.gameManager.isInstalled('stalker98_demo')) {
        list.push({ id: 'stalker98_demo', title: 'S.T.A.L.K.E.R. 98 Demo', icon: 'stalker98', action: () => window.appStalker98 && window.appStalker98.open() });
      }
      if (window.gameManager.isInstalled('moh98')) {
        list.push({ id: 'moh98', title: 'Medal of Honor 98', icon: 'moh98', action: () => window.appMoh98 && window.appMoh98.open() });
      }
      if (window.gameManager.isInstalled('cop98')) {
        list.push({ id: 'cop98', title: 'Зов Припяти 98', icon: 'cop98', action: () => window.appCop98 && window.appCop98.open() });
      }
      if (window.gameManager.isInstalled('mc98_demo')) {
        list.push({ id: 'mc98_demo', title: 'Minecraft 98 Demo', icon: 'mc98', action: () => window.appMc98 && window.appMc98.open() });
      }
      if (window.gameManager.isInstalled('hsr98')) {
        list.push({ id: 'hsr98', title: 'Star Rail 98', icon: 'hsr98', action: () => window.appHsr98 && window.appHsr98.open() });
      }
      if (window.gameManager.isInstalled('dao98_demo')) {
        list.push({ id: 'dao98_demo', title: 'Dragon Age 98 Demo', icon: 'dao98', action: () => window.appDao98 && window.appDao98.open() });
      }
      if (window.gameManager.isInstalled('dmc98_demo')) {
        list.push({ id: 'dmc98_demo', title: 'Devil May Cry 98 Demo', icon: 'dmc98', action: () => window.appDmc98 && window.appDmc98.open() });
      }
      if (window.gameManager.isInstalled('tekken98_demo')) {
        list.push({ id: 'tekken98_demo', title: 'Tekken 98 Demo', icon: 'tekken3', action: () => window.appTekken3 && window.appTekken3.open() });
      }
      if (window.gameManager.isInstalled('ow98')) {
        list.push({ id: 'ow98', title: 'Overwatch 98', icon: 'ow98', action: () => window.appOw98 && window.appOw98.open() });
      }
      if (window.gameManager.isInstalled('sammax')) {
        list.push({ id: 'sammax', title: 'Sam & Max', icon: 'sammax', action: () => window.appSamMax && window.appSamMax.open() });
      }
      if (window.gameManager.isInstalled('sammax102')) {
        list.push({ id: 'sammax102', title: 'Sam & Max 102', icon: 'sammax102', action: () => window.appSamMax102 && window.appSamMax102.open() });
      }
      if (window.gameManager.isInstalled('sammax103')) {
        list.push({ id: 'sammax103', title: 'Sam & Max 103', icon: 'sammax103', action: () => window.appSamMax103 && window.appSamMax103.open() });
      }
      if (window.gameManager.isInstalled('sammax104')) {
        list.push({ id: 'sammax104', title: 'Sam & Max 104', icon: 'sammax104', action: () => window.appSamMax104 && window.appSamMax104.open() });
      }
      if (window.gameManager.isInstalled('sammax105')) {
        list.push({ id: 'sammax105', title: 'Sam & Max 105', icon: 'sammax105', action: () => window.appSamMax105 && window.appSamMax105.open() });
      }
      if (window.gameManager.isInstalled('sammax106')) {
        list.push({ id: 'sammax106', title: 'Sam & Max 106', icon: 'sammax106', action: () => window.appSamMax106 && window.appSamMax106.open() });
      }
      if (window.gameManager.isInstalled('sammax201')) {
        list.push({ id: 'sammax201', title: 'Sam & Max 201', icon: 'sammax201', action: () => window.appSamMax201 && window.appSamMax201.open() });
      }
      if (window.gameManager.isInstalled('sammax202_demo')) {
        list.push({ id: 'sammax202_demo', title: 'Sam & Max 202 Demo', icon: 'sammax202', action: () => window.appSamMax202 && window.appSamMax202.open() });
      }
      if (window.gameManager.isInstalled('bttf')) {
        list.push({ id: 'bttf', title: 'Back to the Future', icon: 'bttf', action: () => window.appBTTF && window.appBTTF.open() });
      }
      if (window.gameManager.isInstalled('diablo2')) {
        list.push({ id: 'diablo2', title: 'Diablo II', icon: 'diablo2', action: () => window.appDiablo2 && window.appDiablo2.open() });
      }
      if (window.gameManager.isInstalled('forza')) {
        list.push({ id: 'forza', title: 'Forza Horizon', icon: 'forza', action: () => window.appForza && window.appForza.open() });
      }
      if (window.gameManager.isInstalled('xiii_demo')) {
        list.push({ id: 'xiii_demo', title: 'XIII Demo', icon: 'xiii', action: () => window.appXiii && window.appXiii.open() });
      }
      if (window.gameManager.isInstalled('maxpayne_demo')) {
        list.push({ id: 'maxpayne_demo', title: 'Max Payne Demo', icon: 'maxpayne', action: () => window.appMaxPayne && window.appMaxPayne.open() });
      }
      if (window.gameManager.isInstalled('gtann')) {
        list.push({ id: 'gtann', title: 'GTA: Нижний Сити', icon: 'gtann', action: () => window.appGtaNN && window.appGtaNN.open() });
      }
      if (window.gameManager.isInstalled('legion')) {
        list.push({ id: 'legion', title: 'Legion Arena', icon: 'legion', action: () => window.appLegion && window.appLegion.open() });
      }
      if (window.gameManager.isInstalled('anotherwar')) {
        list.push({ id: 'anotherwar', title: 'Another War', icon: 'anotherwar', action: () => window.appAnotherWar && window.appAnotherWar.open() });
      }
      if (window.gameManager.isInstalled('fallout')) {
        list.push({ id: 'fallout', title: 'Fallout', icon: 'fallout', action: () => window.appFallout && window.appFallout.open() });
      }
      if (window.gameManager.isInstalled('falloutzp_demo')) {
        list.push({ id: 'falloutzp_demo', title: 'Fallout: Запорожье Demo', icon: 'falloutzp', action: () => window.appFalloutZP && window.appFalloutZP.open() });
      }
      if (window.gameManager.isInstalled('korovany_demo')) {
        list.push({ id: 'korovany_demo', title: 'Корованы Demo', icon: 'korovany', action: () => window.appKorovany && window.appKorovany.open() });
      }
      if (window.gameManager.isInstalled('catniss')) {
        list.push({ id: 'catniss', title: 'Catniss', icon: 'catniss', action: () => window.appCatniss && window.appCatniss.open() });
      }
      if (window.gameManager.isInstalled('plov')) {
        list.push({ id: 'plov', title: 'Хаято, Где плов?', icon: 'plov', action: () => window.appPlov && window.appPlov.open() });
      }
      if (window.gameManager.isInstalled('homm1_demo')) {
        list.push({ id: 'homm1_demo', title: 'Heroes 98 Demo', icon: 'homm1', action: () => window.appHomm1 && window.appHomm1.open() });
      }
      if (window.gameManager.isInstalled('sims3')) {
        list.push({ id: 'sims3', title: 'The Sims 3', icon: 'sims3', action: () => window.appSims3 && window.appSims3.open() });
      }
      if (window.gameManager.isInstalled('kotor98_demo')) {
        list.push({ id: 'kotor98_demo', title: 'KOTOR 98 Demo', icon: 'kotor98', action: () => window.appKotor98 && window.appKotor98.open() });
      }
      if (window.gameManager.isInstalled('hl2_demo')) {
        list.push({ id: 'hl2_demo', title: 'Half-Life 2 Demo', icon: 'hl2', action: () => window.appHl2 && window.appHl2.open() });
      }
      if (window.gameManager.isInstalled('quake3')) {
        list.push({ id: 'quake3', title: 'Quake III Arena', icon: 'quake3', action: () => window.appQuake3 && window.appQuake3.open() });
      }
      if (window.gameManager.isInstalled('gta90')) {
        list.push({ id: 'gta90', title: "GTA: Екатеринбург '90", icon: 'gta90', action: () => window.appGta90 && window.appGta90.open() });
      }
      if (window.gameManager.isInstalled('lol')) {
        list.push({ id: 'lol', title: 'League of Legends 98', icon: 'lol', action: () => window.appLoL && window.appLoL.open() });
      }
      if (window.gameManager.isInstalled('avatar98')) {
        list.push({ id: 'avatar98', title: 'Аватар: Тихий цикл', icon: 'avatar98', action: () => window.appAvatar98 && window.appAvatar98.open() });
      }
      if (window.gameManager.isInstalled('dota')) {
        list.push({ id: 'dota', title: 'Dota 98', icon: 'dota', action: () => window.appDota && window.appDota.open() });
      }
      if (window.gameManager.isInstalled('diablo')) {
        list.push({ id: 'diablo', title: 'Diablo', icon: 'diablo', action: () => window.appDiablo && window.appDiablo.open() });
      }
      if (window.gameManager.isInstalled('hockey')) {
        list.push({ id: 'hockey', title: 'NHL 98', icon: 'hockey', action: () => window.appHockey && window.appHockey.open() });
      }
      if (window.gameManager.isInstalled('worldcup98')) {
        list.push({ id: 'worldcup98', title: 'World Cup 98', icon: 'worldcup98', action: () => window.appWorldCup98 && window.appWorldCup98.open() });
      }
      if (window.gameManager.isInstalled('avp')) {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        list.push({ id: 'avp', title: t('app.avp'), icon: 'avp', action: () => window.appAVP && window.appAVP.open() });
      }
      if (window.gameManager.isInstalled('videoplayer')) {
        list.push({ id: 'videoplayer', title: 'ActiveMovie Player', icon: 'video-player', action: () => window.appVideoPlayer && window.appVideoPlayer.open() });
      }
      if (window.gameManager.isInstalled('photoshop')) {
        list.push({ id: 'photoshop', title: 'RetroShop 98', icon: 'photoshop', action: () => window.appPhotoshop && window.appPhotoshop.open() });
      }
      if (window.gameManager.isInstalled('wincommander')) {
        list.push({ id: 'wincommander', title: 'WinCommander 98', icon: 'wincommander', action: () => window.appWinCommander && window.appWinCommander.open() });
      }
      if (window.gameManager.isInstalled('winamp')) {
        list.push({ id: 'winamp', title: 'WinAmp 98', icon: 'winamp', action: () => window.appWinamp && window.appWinamp.open() });
      }
      if (window.gameManager.isInstalled('blender')) {
        list.push({ id: 'blender', title: 'Blender 1.60', icon: 'blender', action: () => window.appBlender && window.appBlender.open() });
      }
      if (window.gameManager.isInstalled('blender204')) {
        list.push({ id: 'blender204', title: 'Blender 2.04', icon: 'blender204', action: () => window.appBlender204 && window.appBlender204.open() });
      }
      if (window.gameManager.isInstalled('steam')) {
        list.push({ id: 'steam', title: 'Steam', icon: 'steam', action: () => window.appSteam && window.appSteam.open() });
      }
      if (window.gameManager.isInstalled('esheep')) {
        list.push({ id: 'esheep', title: 'eSheep 98', icon: 'esheep', action: () => window.appESheep && window.appESheep.open() });
      }
    }

    if (window.vfs && window.vfs.isCdRomInserted && window.vfs.isCdRomInserted()) {
      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      const discId = window.vfs.cdRomState && window.vfs.cdRomState.discId;
      if (discId === 'office_games_98') {
        list.push({
          id: 'cdrom_office_games',
          title: t('cdrom.officeLabel'),
          icon: 'game-manager',
          action: () => {
            if (window.appOfficeLauncher) window.appOfficeLauncher.open();
          }
        });
      } else {
        list.push({
          id: 'cdrom_igromania',
          title: t('cdrom.label'),
          icon: 'igroman',
          action: () => {
            if (window.appIgroman) window.appIgroman.open();
          }
        });
      }
    }

    if (window.vfs && window.vfs.getDesktopItems) {
      const desktopFiles = window.vfs.getDesktopItems();
      desktopFiles.forEach(file => {
        let iconKey = file.icon;
        if (!iconKey) {
          if (file.type === 'folder') iconKey = 'folder';
          else if (file.name.endsWith('.bfc')) iconKey = 'briefcase';
          else if (file.name.endsWith('.ttf')) iconKey = 'file-ttf';
          else if (file.name.endsWith('.fon')) iconKey = 'file-fon';
          else if (file.name.endsWith('.exe')) iconKey = (file.name === 'totally_not_a_virus.exe' ? 'file-virus' : 'file-exe');
          else if (file.name.endsWith('.bmp') || file.name.endsWith('.png') || file.name.endsWith('.jpg')) iconKey = 'file-bmp';
          else if (file.name.endsWith('.avi') || file.name.endsWith('.mp4')) iconKey = 'file-video';
          else if (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.mid')) iconKey = 'file-music';
          else if (file.name.endsWith('.psd')) iconKey = 'file-psd';
          else if (file.name.endsWith('.xls')) iconKey = 'file-xls';
          else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) iconKey = 'winrar';
          else if (file.name.endsWith('.rtf') || file.name.endsWith('.doc')) iconKey = 'file-rtf';
          else if (/\.ac[st]$/i.test(file.name)) iconKey = 'file-actor';
          else if (/\.(nes|bin|smd|gen|smc|sfc|gb|gbc|sta)$/i.test(file.name)) iconKey = 'file-rom';
          else if (file.name.endsWith('.url') || file.name.endsWith('.htm') || file.name.endsWith('.html')) iconKey = 'internet-explorer';
          else iconKey = 'file-txt';
        }

        list.push({
          id: `desktop_file_${file.name}`,
          title: file.name,
          icon: iconKey,
          isFile: true,
          fileData: file,
          action: () => {
            const nameLower = (file.name || '').toLowerCase();
            if (file.type === 'folder') {
              if (window.appExplorer) window.appExplorer.open(['Desktop', file.name]);
            } else if (file.type === 'briefcase' || nameLower.endsWith('.bfc')) {
              if (window.appExplorer && window.appExplorer.openBriefcaseWindow) window.appExplorer.openBriefcaseWindow(file);
            } else if (file.type === 'shortcut' && file.targetPath) {
              if (window.appExplorer) window.appExplorer.open(file.targetPath);
            } else if (nameLower.endsWith('.ttf') || nameLower.endsWith('.fon')) {
              if (window.appCPanel && window.appCPanel.openFontViewer) window.appCPanel.openFontViewer(file);
            } else if (file.app === 'virus' || nameLower === 'totally_not_a_virus.exe') {
              if (window.appVirus) window.appVirus.open();
            } else if (file.app === 'emulator' || /^(emuland98|nesticle|genecyst|zsnesw|vgb98)\.exe$/.test(nameLower) || /\.(nes|bin|smd|gen|smc|sfc|gb|gbc|sta)$/.test(nameLower)) {
              if (window.appEmulator) window.appEmulator.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'esheep' || nameLower === 'sheep.exe' || nameLower === 'esheep.exe') {
              if (window.appESheep) window.appESheep.open();
            } else if (file.app === 'neko' || nameLower === 'neko.exe') {
              if (window.appNeko) window.appNeko.open();
            } else if (file.app === 'blender204' || nameLower.endsWith('.blend')) {
              if (window.gameManager && !window.gameManager.isInstalled('blender204')) window.winManager.openDialog({ title: 'Blender 2.04', icon: 'error', message: 'Blender 2.04 is not installed.' });
              else if (window.appBlender204) window.appBlender204.open(nameLower.endsWith('.blend') ? { dir: ['Desktop'], name: file.name } : null);
            } else if (file.app === 'blender' || nameLower === 'blender.exe') {
              if (window.appBlender) window.appBlender.open();
            } else if (file.app === 'hsrsetup') {
              if (window.hsrSite) window.hsrSite.openSetup();
            } else if (file.app === 'setup' || nameLower.startsWith('setup_') || nameLower === 'setup.exe') {
              if (window.gameManager) window.gameManager.openSetupWizard(file.gameId || 'blender');
            } else if (file.app === 'winrar' || nameLower.endsWith('.zip') || nameLower.endsWith('.rar')) {
              if (window.appWinRAR) window.appWinRAR.open(file.name);
            } else if (file.app === 'actor' || nameLower.endsWith('.acs') || nameLower.endsWith('.act')) {
              if (window.appClippy) window.appClippy.onActorFile(file.name);
            } else if (file.app === 'wordpad' || nameLower.endsWith('.rtf') || nameLower.endsWith('.doc')) {
              if (window.appWordPad) window.appWordPad.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'winamp' || nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.mid') || nameLower.endsWith('.ogg')) {
              if (window.appWinamp) window.appWinamp.open(file.name, file.content || file.path, ['Desktop']);
            } else if (file.app === 'imaging' || nameLower.endsWith('.bmp') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
              if (window.appImageViewer) window.appImageViewer.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'videoplayer' || nameLower.endsWith('.avi') || nameLower.endsWith('.mp4') || nameLower.endsWith('.mpg') || nameLower.endsWith('.mpeg') || nameLower.endsWith('.mov')) {
              if (window.appVideoPlayer) window.appVideoPlayer.open(file.name, file.content, true);
            } else if (file.app === 'photoshop' || nameLower.endsWith('.psd')) {
              if (window.appPhotoshop) window.appPhotoshop.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'paint') {
              if (window.appPaint) window.appPaint.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'excel' || nameLower.endsWith('.xls')) {
              if (window.appExcel) window.appExcel.open(file.name, file.content, ['Desktop']);
            } else if (file.app === 'ie' || nameLower.endsWith('.url') || nameLower.endsWith('.htm') || nameLower.endsWith('.html')) {
              let targetUrl = 'http://www.search98.com';
              if (file.content && (file.content.startsWith('http://') || file.content.startsWith('https://'))) {
                targetUrl = file.content;
              } else if (typeof file.content === 'string' && file.content.includes('URL=')) {
                const match = file.content.match(/URL=(https?:\/\/[^\r\n]+)/i);
                if (match) targetUrl = match[1];
              }
              if (window.appIE) window.appIE.open(targetUrl);
            } else if (file.action) {
              file.action();
            } else if (file.app === 'office_launcher') {
              if (window.appOfficeLauncher) window.appOfficeLauncher.open();
            } else if (file.app === 'og_snake3d') {
              if (window.appOgSnake3d) window.appOgSnake3d.open();
            } else if (file.app === 'og_arkanoid') {
              if (window.appOgArkanoid) window.appOgArkanoid.open();
            } else if (file.app === 'og_rush') {
              if (window.appOgRush) window.appOgRush.open();
            } else if (file.app === 'og_hunt') {
              if (window.appOgHunt) window.appOgHunt.open();
            } else if (file.app === 'og_gems') {
              if (window.appOgGems) window.appOgGems.open();
            } else if (file.app === 'og_lines') {
              if (window.appOgLines) window.appOgLines.open();
            } else if (file.app === 'og_tetris') {
              if (window.appOgTetris) window.appOgTetris.open();
            } else if (file.app === 'og_chairs') {
              if (window.appOgChairs) window.appOgChairs.open();
            } else {
              if (window.appNotepad) window.appNotepad.open(file.name, file.content, ['Desktop']);
            }
          }
        });
      });
    }

    const props = window.appFileProperties;
    if (!props) return list;
    list.forEach(item => {
      const custom = item.isFile ? null : props.iconFor(item.id);
      if (custom && Icons[custom]) item.icon = custom;
    });
    const showAll = window.appExplorer && window.appExplorer.folderOptions && window.appExplorer.folderOptions.showAllFiles;
    return showAll ? list : list.filter(item => !props.isHidden(item));
  }

  renderIcons() {
    this.icons = this.computeCurrentIcons();
    this.ensureIconPositions();
    const shown = this.shownPositions(this.getGridMetrics());
    this.iconsContainer.innerHTML = '';
    const isSingleClick = window.appExplorer && window.appExplorer.folderOptions && window.appExplorer.folderOptions.clickMode === 'single';
    this.icons.forEach(item => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.dataset.id = item.id;
      el.innerHTML = `
        <div class="desktop-icon-img">${Icons[item.icon] || Icons['folder']}${this.isShortcut(item) ? `<span class="shortcut-overlay">${Icons['shortcut-overlay']}</span>` : ''}</div>
        <div class="desktop-icon-label"${isSingleClick ? ' style="text-decoration:underline;cursor:pointer;"' : ''}>${item.title}</div>
      `;

      const pos = shown[item.id];
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';

      this.attachIconDrag(el, item);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.justDragged || this.justMarquee) return;
        this.selectIcon(el, e.ctrlKey || e.shiftKey);
        const single = window.appExplorer && window.appExplorer.folderOptions && window.appExplorer.folderOptions.clickMode === 'single';
        if (single && !e.ctrlKey && !e.shiftKey) {
          this.launchApp(item);
        }
      });

      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (this.justDragged || this.justMarquee) return;
        const single = window.appExplorer && window.appExplorer.folderOptions && window.appExplorer.folderOptions.clickMode === 'single';
        if (!single) {
          this.launchApp(item);
        }
      });

      this.iconsContainer.appendChild(el);
    });
  }

  attachIconDrag(el, item) {
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      if (window.contextMenu) window.contextMenu.hide();

      if (!this.selectedIcons.has(el)) {
        if (!e.ctrlKey && !e.shiftKey) {
          this.clearSelection();
        }
        this.selectIcon(el, true);
      } else if (e.ctrlKey) {
        el.classList.remove('selected');
        this.selectedIcons.delete(el);
        return;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      let isDragging = false;
      const dragThreshold = 4;

      const dragItems = [];
      this.selectedIcons.forEach(iconEl => {
        const iconObj = this.icons.find(ic => ic.id === iconEl.dataset.id);
        dragItems.push({
          el: iconEl,
          id: iconEl.dataset.id,
          item: iconObj,
          startX: parseFloat(iconEl.style.left) || 0,
          startY: parseFloat(iconEl.style.top) || 0
        });
      });

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (!isDragging) {
          if (Math.hypot(dx, dy) >= dragThreshold) {
            isDragging = true;
            this.isDraggingIcons = true;
            dragItems.forEach(d => d.el.classList.add('dragging'));
          }
        }

        if (isDragging) {
          const { dWidth, dHeight, cellWidth, cellHeight } = this.getGridMetrics();
          dragItems.forEach(d => {
            let newX = Math.max(0, Math.min(Math.max(0, dWidth - (cellWidth - 4)), d.startX + dx));
            let newY = Math.max(0, Math.min(Math.max(0, dHeight - (cellHeight - 4)), d.startY + dy));
            d.el.style.left = newX + 'px';
            d.el.style.top = newY + 'px';
          });
        }
      };

      const onMouseUp = (upEvent) => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (isDragging) {
          this.isDraggingIcons = false;
          this.justDragged = true;
          setTimeout(() => {
            this.justDragged = false;
          }, 120);

          let handledDrop = false;
          if (dragItems.some(d => d.item && d.item.isFile) && upEvent && typeof upEvent.clientX === 'number' && window.vfs) {
            const allIcons = this.iconsContainer.querySelectorAll('.desktop-icon');
            let dropTargetId = null;
            allIcons.forEach(targetEl => {
              if (this.selectedIcons.has(targetEl)) return;
              const tx = parseFloat(targetEl.style.left) || 0;
              const ty = parseFloat(targetEl.style.top) || 0;
              if (upEvent.clientX >= tx && upEvent.clientX <= tx + 74 && upEvent.clientY >= ty && upEvent.clientY <= ty + 72) {
                dropTargetId = targetEl.dataset.id;
              }
            });
            if (dropTargetId === 'recycle-bin') {
              dragItems.forEach(d => {
                if (d.item && d.item.isFile && d.item.fileData) {
                  window.vfs.deleteItem(['Desktop'], d.item.fileData.name, true);
                  delete this.iconPositions[d.id];
                }
              });
              this.saveIconPositions();
              this.renderIcons();
              handledDrop = true;
            } else if (dropTargetId) {
              const targetItem = this.icons.find(ic => ic.id === dropTargetId);
              if (targetItem && targetItem.isFile && targetItem.fileData && targetItem.fileData.type === 'folder') {
                dragItems.forEach(d => {
                  if (d.item && d.item.isFile && d.item.fileData && d.id !== dropTargetId) {
                    const src = d.item.fileData;
                    if (src.type === 'folder') {
                      window.vfs.createFolder(['Desktop', targetItem.fileData.name], src.name);
                    } else {
                      window.vfs.createFile(['Desktop', targetItem.fileData.name], src.name, src.content || '', src.icon || 'file-txt');
                    }
                    window.vfs.deleteItem(['Desktop'], src.name, false);
                    delete this.iconPositions[d.id];
                  }
                });
                this.saveIconPositions();
                this.renderIcons();
                handledDrop = true;
              }
            }
          }

          if (!handledDrop) {
            dragItems.forEach(d => {
              d.el.classList.remove('dragging');
              const finalX = parseFloat(d.el.style.left) || 0;
              const finalY = parseFloat(d.el.style.top) || 0;
              this.iconPositions[d.id] = {
                x: Math.round(finalX),
                y: Math.round(finalY)
              };
            });
            this.saveIconPositions();
          }
        } else if (!e.ctrlKey && !e.shiftKey && this.selectedIcons.size > 1) {
          this.clearSelection();
          this.selectIcon(el);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  selectIcon(iconEl, multiSelect = false) {
    if (!multiSelect) {
      this.clearSelection();
    }
    iconEl.classList.add('selected');
    this.selectedIcons.add(iconEl);
  }

  clearSelection() {
    this.selectedIcons.forEach(el => el.classList.remove('selected'));
    this.selectedIcons.clear();
  }

  launchApp(item) {
    if (window.soundSys) window.soundSys.playClick();
    if (item.action) {
      item.action();
    }
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.applyPositions();
    });

    this.desktopEl.addEventListener('click', (e) => {
      if (this.justDragged || this.justMarquee) {
        return;
      }
      if (e.target === this.desktopEl || e.target === this.iconsContainer) {
        this.clearSelection();
        if (window.contextMenu) window.contextMenu.hide();
      }
    });

    this.desktopEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.win-window')) return;

      e.preventDefault();

      const iconEl = e.target.closest('.desktop-icon');
      if (iconEl) {
        const iconId = iconEl.dataset.id;
        const iconItem = this.icons.find(i => i.id === iconId);
        if (!this.selectedIcons.has(iconEl)) {
          this.selectIcon(iconEl);
        }
        this.openIconContextMenu(e.clientX, e.clientY, iconItem);
        return;
      }

      if (e.target === this.desktopEl || e.target === this.iconsContainer) {
        this.clearSelection();
        this.openBackgroundContextMenu(e.clientX, e.clientY);
      }
    });

    this.desktopEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target !== this.desktopEl && e.target !== this.iconsContainer) return;

      this.isDraggingMarquee = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      let hasMovedMarquee = false;

      const deskRect = this.desktopEl.getBoundingClientRect();
      this.selectionBox.style.left = (this.startX - deskRect.left) + 'px';
      this.selectionBox.style.top = (this.startY - deskRect.top) + 'px';
      this.selectionBox.style.width = '0px';
      this.selectionBox.style.height = '0px';
      this.selectionBox.style.display = 'none';

      const initialSelected = (e.ctrlKey || e.shiftKey) ? new Set(this.selectedIcons) : new Set();
      if (!e.ctrlKey && !e.shiftKey) {
        this.clearSelection();
      }

      const onMouseMove = (moveEvent) => {
        if (!this.isDraggingMarquee) return;

        const currentX = moveEvent.clientX;
        const currentY = moveEvent.clientY;
        const dist = Math.hypot(currentX - this.startX, currentY - this.startY);

        if (!hasMovedMarquee && dist >= 3) {
          hasMovedMarquee = true;
          this.selectionBox.style.display = 'block';
        }

        if (!hasMovedMarquee) return;

        const left = Math.min(this.startX, currentX);
        const top = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);

        this.selectionBox.style.left = (left - deskRect.left) + 'px';
        this.selectionBox.style.top = (top - deskRect.top) + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';

        const boxRect = { left, top, right: left + width, bottom: top + height };
        const iconEls = this.iconsContainer.querySelectorAll('.desktop-icon');
        iconEls.forEach(el => {
          const r = el.getBoundingClientRect();
          const intersect = !(
            r.left > boxRect.right ||
            r.right < boxRect.left ||
            r.top > boxRect.bottom ||
            r.bottom < boxRect.top
          );
          if (intersect || initialSelected.has(el)) {
            el.classList.add('selected');
            this.selectedIcons.add(el);
          } else {
            el.classList.remove('selected');
            this.selectedIcons.delete(el);
          }
        });
      };

      const onMouseUp = () => {
        this.isDraggingMarquee = false;
        this.selectionBox.style.display = 'none';
        if (hasMovedMarquee) {
          this.justMarquee = true;
          setTimeout(() => {
            this.justMarquee = false;
          }, 150);
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  toggleChannelBar(forceState) {
    this.channelBarVisible = typeof forceState === 'boolean' ? forceState : !this.channelBarVisible;
    let bar = document.getElementById('active-desktop-channel-bar');
    if (!this.channelBarVisible) {
      if (bar) bar.remove();
      return;
    }
    if (!bar && this.desktopEl) {
      const ru = window.i18n && window.i18n.getLanguage() === 'ru';
      bar = document.createElement('div');
      bar.id = 'active-desktop-channel-bar';
      bar.innerHTML = `
        <div class="channel-bar-header">
          <span>Active Desktop</span>
          <span class="channel-bar-close" title="${ru ? 'Закрыть' : 'Close'}">×</span>
        </div>
        <div class="channel-bar-item" data-url="http://windowsupdate.microslop.com">${Icons['win-update'] || ''}<span>${ru ? 'Обновление Win' : 'Win Update'}</span></div>
        <div class="channel-bar-item" data-url="http://www.search98.com">${Icons['internet-explorer'] || ''}<span>${ru ? 'Путеводитель по каналам' : 'Channel Guide'}</span></div>
        <div class="channel-bar-item" data-url="http://www.gazeta98.ru">${Icons['file-txt'] || ''}<span>${ru ? 'Новости и технологии' : 'News &amp; Tech'}</span></div>
        <div class="channel-bar-item" data-url="http://www.steampowered.com">${Icons['joystick'] || ''}<span>${ru ? 'Игры и спорт' : 'Games &amp; Sports'}</span></div>
        <div class="channel-bar-item" data-url="http://www.kinomania98.ru">${Icons['video-player'] || ''}<span>${ru ? 'Развлечения' : 'Entertainment'}</span></div>
      `;
      const closeBtn = bar.querySelector('.channel-bar-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.toggleChannelBar(false));
      bar.querySelectorAll('.channel-bar-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.appIE) window.appIE.open(btn.dataset.url);
        });
      });
      this.desktopEl.appendChild(bar);
    }
  }

  openRecycleBinProperties() {
    const ru = window.i18n && window.i18n.getLanguage() === 'ru';
    const items = window.vfs ? window.vfs.getRecycleBinItems() : [];
    const html = `
      <div class="win-dialog-body" style="padding:10px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
        <div class="win-tabs">
          <div class="win-tab active">${ru ? 'Глобальные' : 'Global'}</div>
          <div class="win-tab">${ru ? 'Диск C:' : 'Disk C:'}</div>
        </div>
        <div class="win-tab-panel" style="flex:1;padding:12px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:32px;height:32px;">${Icons['recycle-bin']}</div>
            <div><b>${ru ? 'Корзина (Диск C:)' : 'Recycle Bin (Drive C:)'}</b><br><span style="font-size:11px;color:#444;">${ru ? 'Объектов в корзине:' : 'Items in Recycle Bin:'} ${items.length}</span></div>
          </div>
          <label style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
            <input type="checkbox" id="rb-no-bin"> ${ru ? 'Не помещать файлы в Корзину, а удалять сразу' : 'Do not move files to the Recycle Bin. Remove files immediately when deleted.'}
          </label>
          <fieldset style="border:1px groove #fff;padding:10px;margin-bottom:10px;">
            <legend>${ru ? 'Максимальный размер Корзины (% от диска)' : 'Maximum size of Recycle Bin (percent of each drive)'}</legend>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="range" id="rb-size-slider" min="1" max="100" value="10" style="flex:1;">
              <span id="rb-size-val" style="min-width:36px;font-weight:bold;">10%</span>
            </div>
          </fieldset>
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" checked> ${ru ? 'Запрашивать подтверждение на удаление' : 'Display delete confirmation dialog'}
          </label>
        </div>
        <div class="win-dialog-footer" style="margin-top:8px;">
          <button class="win-btn default" id="rb-ok">OK</button>
          <button class="win-btn" id="rb-cancel">${ru ? 'Отмена' : 'Cancel'}</button>
        </div>
      </div>
    `;
    const propWin = window.winManager.createWindow({
      id: 'recycle_bin_props',
      title: ru ? 'Свойства: Корзина' : 'Recycle Bin Properties',
      icon: 'recycle-bin',
      width: 360,
      height: 320,
      resizable: false,
      maximizable: false,
      minimizable: false,
      content: html
    });
    const slider = propWin.querySelector('#rb-size-slider');
    const valEl = propWin.querySelector('#rb-size-val');
    if (slider && valEl) {
      slider.addEventListener('input', () => { valEl.textContent = slider.value + '%'; });
    }
    propWin.querySelector('#rb-ok').addEventListener('click', () => window.winManager.closeWindow('recycle_bin_props'));
    propWin.querySelector('#rb-cancel').addEventListener('click', () => window.winManager.closeWindow('recycle_bin_props'));
  }

  openBackgroundContextMenu(x, y) {
    if (!window.contextMenu) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const ru = window.i18n && window.i18n.getLanguage() === 'ru';
    const hasClip = Boolean(window.sharedFileClipboard && window.sharedFileClipboard.item);

    const createDesktopFile = (defaultName, content, icon) => {
      if (window.vfs) {
        let name = defaultName;
        let idx = 1;
        while (window.vfs.exists(['Desktop'], name)) {
          idx++;
          const dot = defaultName.lastIndexOf('.');
          name = dot > 0 ? `${defaultName.slice(0, dot)} (${idx})${defaultName.slice(dot)}` : `${defaultName} (${idx})`;
        }
        window.vfs.createFile(['Desktop'], name, content, icon);
        this.renderIcons();
      }
    };

    window.contextMenu.show(x, y, [
      {
        label: 'Active Desktop',
        submenu: [
          {
            label: ru ? 'Отображать как веб-страницу' : 'View as Web Page',
            checked: Boolean(this.activeDesktopWeb),
            action: () => {
              this.activeDesktopWeb = !this.activeDesktopWeb;
              this.toggleChannelBar(this.activeDesktopWeb);
            }
          },
          {
            label: ru ? 'Панель каналов' : 'Show Channel Bar',
            checked: Boolean(this.channelBarVisible),
            action: () => this.toggleChannelBar()
          },
          { separator: true },
          {
            label: ru ? 'Настроить рабочий стол...' : 'Customize my Desktop...',
            action: () => window.appDialogs && window.appDialogs.openDisplayProperties()
          },
          {
            label: ru ? 'Обновить' : 'Update Now',
            action: () => this.renderIcons()
          }
        ]
      },
      {
        label: t('desktop.arrangeIcons'),
        action: () => this.arrangeIcons(),
        submenu: [
          { label: ru ? 'по имени' : 'by Name', action: () => this.arrangeIcons() },
          { label: ru ? 'по типу' : 'by Type', action: () => this.arrangeIcons() },
          { label: ru ? 'по размеру' : 'by Size', action: () => this.arrangeIcons() },
          { label: ru ? 'по дате' : 'by Date', action: () => this.arrangeIcons() },
          { separator: true },
          { label: ru ? 'автоматически' : 'Auto Arrange', action: () => this.arrangeIcons() }
        ]
      },
      { label: t('desktop.lineUpIcons'), action: () => this.lineUpIcons() },
      { label: t('desktop.refresh'), action: () => this.renderIcons() },
      { separator: true },
      {
        label: t('desktop.paste'),
        disabled: !hasClip,
        action: () => {
          const clip = window.sharedFileClipboard;
          if (!clip || !clip.item || !window.vfs) return;
          const src = clip.item;
          if (src.type === 'folder') {
            window.vfs.createFolder(['Desktop'], src.name);
          } else {
            window.vfs.createFile(['Desktop'], src.name, src.content || '', src.icon || 'file-txt');
          }
          if (clip.mode === 'cut' && clip.sourcePath) {
            window.vfs.deleteItem(clip.sourcePath, src.name, false);
            window.sharedFileClipboard = null;
          }
          this.renderIcons();
        }
      },
      {
        label: t('desktop.pasteShortcut'),
        disabled: !hasClip,
        action: () => {
          const clip = window.sharedFileClipboard;
          if (!clip || !clip.item || !window.vfs) return;
          const src = clip.item;
          const targetPath = [...(clip.sourcePath || ['Desktop']), src.name];
          window.vfs.writeFile(['Desktop'], ru ? `Ярлык для ${src.name}.lnk` : `Shortcut to ${src.name}.lnk`, {
            type: 'shortcut',
            icon: src.icon || 'file-txt',
            targetPath
          });
          this.renderIcons();
        }
      },
      { separator: true },
      {
        label: ru ? 'Создать' : 'New',
        submenu: [
          {
            label: t('desktop.newFolder'),
            action: () => {
              window.winManager.openPromptDialog({
                title: t('desktop.newFolder'),
                icon: 'folder',
                message: t('explorer.promptNewFolder'),
                value: ru ? 'Новая папка' : 'New Folder',
                onOk: (name) => {
                  if (name && name.trim() && window.vfs) {
                    window.vfs.createFolder(['Desktop'], name.trim());
                    this.renderIcons();
                  }
                }
              });
            }
          },
          {
            label: ru ? 'Ярлык' : 'Shortcut',
            action: () => {
              window.winManager.openPromptDialog({
                title: ru ? 'Создание ярлыка' : 'Create Shortcut',
                icon: 'folder',
                message: ru ? 'Командная строка или объект:' : 'Command line or target:',
                value: 'C:\\WINDOWS\\NOTEPAD.EXE',
                onOk: (val) => {
                  if (val && val.trim() && window.vfs) {
                    const base = val.trim().split('\\').pop();
                    window.vfs.writeFile(['Desktop'], ru ? `Ярлык для ${base}.lnk` : `Shortcut to ${base}.lnk`, {
                      type: 'shortcut',
                      icon: 'file-exe',
                      targetPath: ['My Computer', 'C:', 'WINDOWS', base]
                    });
                    this.renderIcons();
                  }
                }
              });
            }
          },
          { separator: true },
          {
            label: ru ? 'Портфель' : 'Briefcase',
            action: () => {
              if (window.vfs) {
                window.vfs.writeFile(['Desktop'], ru ? 'Портфель.bfc' : 'New Briefcase.bfc', {
                  type: 'briefcase',
                  icon: 'briefcase',
                  files: []
                });
                this.renderIcons();
              }
            }
          },
          { label: ru ? 'Точечный рисунок' : 'Bitmap Image', action: () => createDesktopFile(ru ? 'Точечный рисунок.bmp' : 'New Bitmap Image.bmp', '', 'file-bmp') },
          { label: t('desktop.newTextDoc'), action: () => createDesktopFile(ru ? 'Текстовый документ.txt' : 'New Text Document.txt', '', 'file-txt') },
          { label: ru ? 'Документ WordPad' : 'WordPad Document', action: () => createDesktopFile(ru ? 'Документ WordPad.rtf' : 'New WordPad Document.rtf', '', 'file-rtf') },
          { label: ru ? 'Звук Wave' : 'Wave Sound', action: () => createDesktopFile(ru ? 'Звук Wave.wav' : 'New Wave Sound.wav', '', 'file-music') }
        ]
      },
      { separator: true },
      {
        label: t('desktop.properties'),
        bold: true,
        action: () => window.appDialogs && window.appDialogs.openDisplayProperties()
      }
    ]);
  }

  openIconContextMenu(x, y, item) {
    if (!window.contextMenu || !item) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const ru = window.i18n && window.i18n.getLanguage() === 'ru';

    if (item.id === 'recycle-bin') {
      window.contextMenu.show(x, y, [
        { label: t('menu.open'), bold: true, action: () => this.launchApp(item) },
        { label: t('menu.explore'), action: () => window.appExplorer ? window.appExplorer.open(['Recycle Bin'], { showTree: true }) : this.launchApp(item) },
        {
          label: t('menu.emptyBin'),
          action: () => {
            window.winManager.openDialog({
              title: t('bin.title'),
              icon: 'recycle-bin',
              message: t('bin.confirmEmpty'),
              buttons: [
                { text: t('btn.yes'), primary: true, isDefault: true, onClick: () => {
                  window.vfs && window.vfs.emptyRecycleBin && window.vfs.emptyRecycleBin();
                  const deskIcon = document.querySelector('.desktop-icon[data-id="recycle-bin"] .desktop-icon-img');
                  if (deskIcon) deskIcon.innerHTML = Icons[this.systemIcon('recycle-bin-empty')];
                }},
                { text: t('btn.no'), onClick: () => {} }
              ]
            });
          }
        },
        { separator: true },
        { label: t('menu.createShortcut'), action: () => {} },
        { separator: true },
        {
          label: t('menu.properties'),
          action: () => this.openRecycleBinProperties()
        }
      ]);
      return;
    }

    if (item.id === 'network') {
      window.contextMenu.show(x, y, [
        { label: t('menu.open'), bold: true, action: () => this.launchApp(item) },
        { label: t('menu.explore'), action: () => window.appExplorer && window.appExplorer.open(['Network Neighborhood'], { showTree: true }) },
        { label: ru ? 'Найти компьютер...' : 'Find Computer...', action: () => window.appDialogs && window.appDialogs.openFindDialog() },
        { label: ru ? 'Подключить сетевой диск...' : 'Map Network Drive...', action: () => window.winManager.openDialog({ title: ru ? 'Подключение сетевого диска' : 'Map Network Drive', icon: 'network', message: ru ? 'Диск Z: подключен к \\\\FILESERVER\\Public' : 'Drive Z: mapped to \\\\FILESERVER\\Public' }) },
        { separator: true },
        { label: t('menu.createShortcut'), action: () => {} },
        { label: t('menu.rename'), action: () => {} },
        { separator: true },
        { label: t('menu.properties'), action: () => window.appCPanel && window.appCPanel.openNetworkProperties ? window.appCPanel.openNetworkProperties() : null }
      ]);
      return;
    }

    const sendToMenu = [
      {
        label: ru ? 'Диск 3,5 (A:)' : '3½ Floppy (A:)',
        action: () => {
          if (item.isFile && window.vfs) {
            window.vfs.createFile(['My Computer', 'A:'], item.fileData.name, item.fileData.content || '', item.icon || 'file-txt');
          }
        }
      },
      {
        label: ru ? 'Адресат' : 'Mail Recipient',
        action: () => {
          if (window.appOutlook) window.appOutlook.open();
        }
      },
      {
        label: ru ? 'Мои документы' : 'My Documents',
        action: () => {
          if (item.isFile && window.vfs) {
            window.vfs.createFile(['My Computer', 'C:', 'My Documents'], item.fileData.name, item.fileData.content || '', item.icon || 'file-txt');
          }
        }
      }
    ];

    window.contextMenu.show(x, y, [
      { label: t('menu.open'), bold: true, action: () => this.launchApp(item) },
      {
        label: t('menu.explore'),
        action: () => {
          if (item.id === 'my-computer') window.appExplorer && window.appExplorer.open(['My Computer'], { showTree: true });
          else if (item.id === 'my-documents') window.appExplorer && window.appExplorer.open(['My Computer', 'C:', 'My Documents'], { showTree: true });
          else if (item.isFile && item.fileData && item.fileData.type === 'folder') window.appExplorer && window.appExplorer.open(['Desktop', item.fileData.name], { showTree: true });
          else this.launchApp(item);
        }
      },
      { separator: true },
      { label: ru ? 'Отправить' : 'Send To', submenu: sendToMenu },
      { separator: true },
      {
        label: t('menu.cut'),
        disabled: !item.isFile,
        action: () => {
          if (item.isFile) {
            window.sharedFileClipboard = { mode: 'cut', item: { ...item.fileData }, sourcePath: ['Desktop'] };
          }
        }
      },
      {
        label: t('menu.copy'),
        disabled: !item.isFile,
        action: () => {
          if (item.isFile) {
            window.sharedFileClipboard = { mode: 'copy', item: { ...item.fileData }, sourcePath: ['Desktop'] };
          }
        }
      },
      { separator: true },
      {
        label: t('menu.createShortcut'),
        action: () => {
          if (item.isFile && window.vfs) {
            window.vfs.writeFile(['Desktop'], ru ? `Ярлык для ${item.fileData.name}.lnk` : `Shortcut to ${item.fileData.name}.lnk`, {
              type: 'shortcut',
              icon: item.icon || 'file-txt',
              targetPath: ['Desktop', item.fileData.name]
            });
            this.renderIcons();
          } else {
            window.winManager.openDialog({
              title: t('menu.createShortcut'),
              icon: item.icon,
              message: t('desktop.shortcutCreated', item.title)
            });
          }
        }
      },
      {
        label: t('menu.delete'),
        action: () => {
          window.winManager.openDialog({
            title: t('explorer.confirmDeleteTitle'),
            icon: 'warning',
            message: t('explorer.confirmDelete', item.title),
            buttons: [
              {
                text: t('btn.yes'),
                primary: true,
                isDefault: true,
                onClick: () => {
                  if (item.isFile && window.vfs) {
                    window.vfs.deleteItem(['Desktop'], item.fileData.name, true);
                    delete this.iconPositions[item.id];
                    this.saveIconPositions();
                    this.renderIcons();
                  }
                }
              },
              { text: t('btn.no'), onClick: () => {} }
            ]
          });
        }
      },
      {
        label: t('menu.rename'),
        action: () => {
          window.winManager.openPromptDialog({
            title: t('menu.rename'),
            icon: item.icon || 'folder',
            message: t('explorer.promptRename'),
            value: item.title,
            onOk: (newName) => {
              if (newName && newName.trim()) {
                const trimmed = newName.trim();
                if (item.isFile && window.vfs) {
                  window.vfs.renameItem(['Desktop'], item.fileData.name, trimmed);
                }
                item.title = trimmed;
                this.renderIcons();
              }
            }
          });
        }
      },
      { separator: true },
      {
        label: t('menu.properties'),
        action: () => {
          if (item.id === 'my-computer' || item.title === 'Мой компьютер' || item.title === 'My Computer') {
            if (window.appCPanel) window.appCPanel.openSystemProperties();
            return;
          }
          if (item.id === 'ie') {
            if (window.appCPanel) window.appCPanel.openInternetProperties();
            return;
          }
          if (item.id === 'esheep' || (item.fileData && item.fileData.app === 'esheep')) {
            if (window.appESheep) window.appESheep.openSettings();
            return;
          }
          if (item.id === 'neko' || (item.fileData && item.fileData.app === 'neko')) {
            if (window.appNeko) window.appNeko.openBasket();
            return;
          }
          if (item.isFile && item.fileData && window.appExplorer && window.appExplorer.openPropertiesDialog) {
            window.appExplorer.openPropertiesDialog(item.fileData, ['Desktop']);
            return;
          }
          if (item.id === 'my-documents' && window.appExplorer) {
            window.appExplorer.openPropertiesDialog({ key: 'My Documents', ...window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']) }, ['My Computer', 'C:']);
            return;
          }
          if (item.id.startsWith('cdrom_') && window.appExplorer) {
            window.appExplorer.openPropertiesDialog({ key: 'D:', type: 'drive', driveType: 'cdrom' }, ['My Computer']);
            return;
          }
          if (window.appFileProperties) window.appFileProperties.openForDesktopIcon(item);
        }
      }
    ]);
  }
}

class ContextMenuManager {
  constructor() {
    this.el = document.getElementById('context-menu');
    this.initEvents();
  }

  initEvents() {
    document.addEventListener('click', (e) => {
      if (this.el && !this.el.contains(e.target)) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });

    window.addEventListener('resize', () => this.hide());
  }

  renderMenuItems(container, items) {
    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'win-menu-separator';
        container.appendChild(sep);
        return;
      }

      const hasSub = Array.isArray(item.submenu) && item.submenu.length > 0;
      const row = document.createElement('div');
      row.className = 'context-menu-item' + (item.disabled ? ' disabled' : '') + (item.checked ? ' checked' : '') + (hasSub ? ' has-submenu' : '');

      const labelSpan = document.createElement('span');
      if (item.bold) {
        labelSpan.innerHTML = `<strong>${item.label}</strong>`;
      } else {
        labelSpan.textContent = item.label;
      }
      row.appendChild(labelSpan);

      if (hasSub) {
        const arr = document.createElement('span');
        arr.className = 'context-menu-arrow';
        arr.textContent = '▸';
        row.appendChild(arr);

        const subEl = document.createElement('div');
        subEl.className = 'win-context-submenu';
        this.renderMenuItems(subEl, item.submenu);
        row.appendChild(subEl);
      } else if (item.shortcut) {
        const sc = document.createElement('span');
        sc.className = 'context-menu-shortcut';
        sc.textContent = item.shortcut;
        row.appendChild(sc);
      }

      if (!item.disabled && item.action) {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.win-context-submenu') && row.querySelector('.win-context-submenu') === e.target.closest('.win-context-submenu')) {
            return;
          }
          e.stopPropagation();
          if (window.soundSys) window.soundSys.playClick();
          this.hide();
          item.action();
        });
      }

      container.appendChild(row);
    });
  }

  show(x, y, items) {
    if (!this.el) return;
    this.el.innerHTML = '';

    this.renderMenuItems(this.el, items);

    this.el.style.display = 'block';
    this.el.style.visibility = 'hidden';

    const rect = this.el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 4;
    const maxY = window.innerHeight - rect.height - 30;

    this.el.style.left = Math.max(2, Math.min(x, maxX)) + 'px';
    this.el.style.top = Math.max(2, Math.min(y, maxY)) + 'px';
    this.el.style.visibility = 'visible';
  }

  hide() {
    if (this.el) {
      this.el.style.display = 'none';
    }
  }
}

window.Desktop = Desktop;
window.contextMenu = new ContextMenuManager();
window.desktop = new Desktop();

