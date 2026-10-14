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

  getGridMetrics() {
    const dWidth = (this.desktopEl && this.desktopEl.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const dHeight = (this.desktopEl && this.desktopEl.clientHeight) || (typeof window !== 'undefined' ? window.innerHeight - 28 : 572);
    const cellWidth = 78;
    const cellHeight = 76;
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

  clampToViewport(pos, { dWidth, dHeight }) {
    return {
      x: Math.max(0, Math.min(Math.max(0, dWidth - 74), pos.x)),
      y: Math.max(0, Math.min(Math.max(0, dHeight - 72), pos.y))
    };
  }

  applyPositions() {
    const metrics = this.getGridMetrics();
    const iconEls = this.iconsContainer.querySelectorAll('.desktop-icon');
    iconEls.forEach(el => {
      const pos = this.iconPositions[el.dataset.id];
      if (pos) {
        const shown = this.clampToViewport(pos, metrics);
        el.style.left = shown.x + 'px';
        el.style.top = shown.y + 'px';
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
    const systemIcons = ['my-computer', 'my-documents', 'network', 'recycle-bin', 'ie', 'outlook', 'cdrom_igromania'];
    return !item.isFile && !systemIcons.includes(item.id);
  }

  getBaseIcons() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isBinEmpty = window.vfs ? window.vfs.getRecycleBinItems().length === 0 : false;
    return [
      { id: 'my-computer', title: t('app.myComputer'), icon: 'my-computer', action: () => window.appExplorer && window.appExplorer.open(['My Computer']) },
      { id: 'my-documents', title: t('app.myDocs'), icon: 'my-documents', action: () => window.appExplorer && window.appExplorer.open(['My Computer', 'C:', 'My Documents']) },
      { id: 'network', title: t('app.network'), icon: 'network', action: () => window.winManager.openDialog({ title: t('network.title'), icon: 'network', message: t('network.msg') }) },
      { id: 'recycle-bin', title: t('app.recycleBin'), icon: isBinEmpty ? 'recycle-bin-empty' : 'recycle-bin', action: () => window.appRecycleBin && window.appRecycleBin.open() },
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
      { id: 'wordpad', title: t('app.wordpad'), icon: 'wordpad', action: () => window.appWordPad && window.appWordPad.open() }
    ];
  }

  computeCurrentIcons() {
    const list = [...this.getBaseIcons()];

    if (window.gameManager) {
      if (window.gameManager.isInstalled('wolf3d')) {
        list.push({ id: 'wolf3d', title: 'Wolfenstein 3D', icon: 'wolf3d', action: () => window.appWolf3D && window.appWolf3D.open() });
      }
      if (window.gameManager.isInstalled('quest')) {
        list.push({ id: 'quest', title: 'LucasQuest 98', icon: 'lucas-quest', action: () => window.appScummQuest && window.appScummQuest.open() });
      }
      if (window.gameManager.isInstalled('stalker')) {
        list.push({ id: 'stalker', title: 'S.T.A.L.K.E.R.', icon: 'stalker', action: () => window.appStalker && window.appStalker.open() });
      }
      if (window.gameManager.isInstalled('fallout2')) {
        list.push({ id: 'fallout2', title: 'Fallout 2 Demo', icon: 'fallout2', action: () => window.appFallout2 && window.appFallout2.open() });
      }
      if (window.gameManager.isInstalled('burnout')) {
        list.push({ id: 'burnout', title: 'Burnout Demo', icon: 'burnout', action: () => window.appBurnout && window.appBurnout.open() });
      }
      if (window.gameManager.isInstalled('half-life')) {
        list.push({ id: 'half-life', title: 'Half-Life 98', icon: 'half-life', action: () => window.appHalfLife && window.appHalfLife.open() });
      }
      if (window.gameManager.isInstalled('neon-racer')) {
        list.push({ id: 'neon-racer', title: 'Midnight Glide', icon: 'burnout', action: () => window.appNeonRacer && window.appNeonRacer.open() });
      }
      if (window.gameManager.isInstalled('doom')) {
        list.push({ id: 'doom', title: 'DOOM 98', icon: 'doom', action: () => window.appDoom && window.appDoom.open() });
      }
      if (window.gameManager.isInstalled('serioussam')) {
        list.push({ id: 'serioussam', title: 'Serious Sam 98', icon: 'serioussam', action: () => window.appSeriousSam && window.appSeriousSam.open() });
      }
      if (window.gameManager.isInstalled('stalker98')) {
        list.push({ id: 'stalker98', title: 'S.T.A.L.K.E.R. 98', icon: 'stalker98', action: () => window.appStalker98 && window.appStalker98.open() });
      }
      if (window.gameManager.isInstalled('moh98')) {
        list.push({ id: 'moh98', title: 'Medal of Honor 98', icon: 'moh98', action: () => window.appMoh98 && window.appMoh98.open() });
      }
      if (window.gameManager.isInstalled('cop98')) {
        list.push({ id: 'cop98', title: 'Зов Припяти 98', icon: 'cop98', action: () => window.appCop98 && window.appCop98.open() });
      }
      if (window.gameManager.isInstalled('mc98')) {
        list.push({ id: 'mc98', title: 'Minecraft 98', icon: 'mc98', action: () => window.appMc98 && window.appMc98.open() });
      }
      if (window.gameManager.isInstalled('hsr98')) {
        list.push({ id: 'hsr98', title: 'Star Rail 98', icon: 'hsr98', action: () => window.appHsr98 && window.appHsr98.open() });
      }
      if (window.gameManager.isInstalled('dao98')) {
        list.push({ id: 'dao98', title: 'Dragon Age 98', icon: 'dao98', action: () => window.appDao98 && window.appDao98.open() });
      }
      if (window.gameManager.isInstalled('dmc98')) {
        list.push({ id: 'dmc98', title: 'Devil May Cry 4', icon: 'dmc98', action: () => window.appDmc98 && window.appDmc98.open() });
      }
      if (window.gameManager.isInstalled('tekken3')) {
        list.push({ id: 'tekken3', title: 'Tekken 3 98', icon: 'tekken3', action: () => window.appTekken3 && window.appTekken3.open() });
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
      if (window.gameManager.isInstalled('sammax202')) {
        list.push({ id: 'sammax202', title: 'Sam & Max 202', icon: 'sammax202', action: () => window.appSamMax202 && window.appSamMax202.open() });
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
      if (window.gameManager.isInstalled('xiii')) {
        list.push({ id: 'xiii', title: 'XIII', icon: 'xiii', action: () => window.appXiii && window.appXiii.open() });
      }
      if (window.gameManager.isInstalled('maxpayne')) {
        list.push({ id: 'maxpayne', title: 'Max Payne', icon: 'maxpayne', action: () => window.appMaxPayne && window.appMaxPayne.open() });
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
      if (window.gameManager.isInstalled('falloutzp')) {
        list.push({ id: 'falloutzp', title: 'Fallout: Запорожье', icon: 'falloutzp', action: () => window.appFalloutZP && window.appFalloutZP.open() });
      }
      if (window.gameManager.isInstalled('plov')) {
        list.push({ id: 'plov', title: 'Хаято, Где плов?', icon: 'plov', action: () => window.appPlov && window.appPlov.open() });
      }
      if (window.gameManager.isInstalled('sims3')) {
        list.push({ id: 'sims3', title: 'The Sims 3', icon: 'sims3', action: () => window.appSims3 && window.appSims3.open() });
      }
      if (window.gameManager.isInstalled('kotor98')) {
        list.push({ id: 'kotor98', title: 'KOTOR 98', icon: 'kotor98', action: () => window.appKotor98 && window.appKotor98.open() });
      }
      if (window.gameManager.isInstalled('hl2')) {
        list.push({ id: 'hl2', title: 'Half-Life 2', icon: 'hl2', action: () => window.appHl2 && window.appHl2.open() });
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
          if (file.name.endsWith('.exe')) iconKey = (file.name === 'totally_not_a_virus.exe' ? 'file-virus' : 'file-exe');
          else if (file.name.endsWith('.bmp') || file.name.endsWith('.png') || file.name.endsWith('.jpg')) iconKey = 'file-bmp';
          else if (file.name.endsWith('.avi') || file.name.endsWith('.mp4')) iconKey = 'file-video';
          else if (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.mid')) iconKey = 'file-music';
          else if (file.name.endsWith('.psd')) iconKey = 'file-psd';
          else if (file.name.endsWith('.xls')) iconKey = 'file-xls';
          else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) iconKey = 'winrar';
          else if (file.name.endsWith('.rtf') || file.name.endsWith('.doc')) iconKey = 'file-rtf';
          else if (/\.ac[st]$/i.test(file.name)) iconKey = 'file-actor';
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
            if (file.app === 'virus' || nameLower === 'totally_not_a_virus.exe') {
              if (window.appVirus) window.appVirus.open();
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

    return list;
  }

  renderIcons() {
    this.icons = this.computeCurrentIcons();
    this.ensureIconPositions();
    const metrics = this.getGridMetrics();
    this.iconsContainer.innerHTML = '';
    this.icons.forEach(item => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.dataset.id = item.id;
      el.innerHTML = `
        <div class="desktop-icon-img">${Icons[item.icon] || Icons['folder']}${this.isShortcut(item) ? `<span class="shortcut-overlay">${Icons['shortcut-overlay']}</span>` : ''}</div>
        <div class="desktop-icon-label">${item.title}</div>
      `;

      const pos = this.clampToViewport(this.iconPositions[item.id] || { x: 10, y: 10 }, metrics);
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';

      this.attachIconDrag(el, item);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.justDragged || this.justMarquee) return;
        this.selectIcon(el, e.ctrlKey || e.shiftKey);
      });

      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (this.justDragged || this.justMarquee) return;
        this.launchApp(item);
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
        dragItems.push({
          el: iconEl,
          id: iconEl.dataset.id,
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
          const { dWidth, dHeight } = this.getGridMetrics();
          dragItems.forEach(d => {
            let newX = Math.max(0, Math.min(Math.max(0, dWidth - 74), d.startX + dx));
            let newY = Math.max(0, Math.min(Math.max(0, dHeight - 72), d.startY + dy));
            d.el.style.left = newX + 'px';
            d.el.style.top = newY + 'px';
          });
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (isDragging) {
          this.isDraggingIcons = false;
          this.justDragged = true;
          setTimeout(() => {
            this.justDragged = false;
          }, 120);

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

  openBackgroundContextMenu(x, y) {
    if (!window.contextMenu) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    window.contextMenu.show(x, y, [
      { label: t('desktop.arrangeIcons'), action: () => this.arrangeIcons() },
      { label: t('desktop.lineUpIcons'), action: () => this.lineUpIcons() },
      { label: t('desktop.refresh'), action: () => this.renderIcons() },
      { separator: true },
      { label: t('desktop.paste'), disabled: true },
      { label: t('desktop.pasteShortcut'), disabled: true },
      { separator: true },
      { label: t('desktop.newTextDoc'), action: () => window.appNotepad && window.appNotepad.open() },
      {
        label: t('desktop.newFolder'),
        action: () => {
          window.winManager.openPromptDialog({
            title: t('desktop.newFolder'),
            icon: 'folder',
            message: t('explorer.promptNewFolder'),
            value: 'New Folder',
            onOk: (name) => {
              if (name && name.trim()) {
                window.winManager.openDialog({
                  title: 'Desktop',
                  icon: 'folder',
                  message: t('desktop.folderCreated', name.trim())
                });
              }
            }
          });
        }
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

    if (item.id === 'recycle-bin') {
      window.contextMenu.show(x, y, [
        { label: t('menu.open'), bold: true, action: () => this.launchApp(item) },
        { label: t('menu.explore'), action: () => this.launchApp(item) },
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
                  if (deskIcon) deskIcon.innerHTML = Icons['recycle-bin-empty'];
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
          action: () => {
            window.winManager.openDialog({
              title: `${item.title} ${t('menu.properties')}`,
              icon: item.icon,
              message: `<b>${item.title}</b><br>${t('explorer.typeSystem')}<br>Location: Desktop<br>Space: 0 bytes used`
            });
          }
        }
      ]);
      return;
    }

    window.contextMenu.show(x, y, [
      { label: t('menu.open'), bold: true, action: () => this.launchApp(item) },
      { separator: true },
      { label: t('menu.cut'), disabled: true },
      { label: t('menu.copy'), disabled: true },
      { separator: true },
      {
        label: t('menu.createShortcut'),
        action: () => {
          window.winManager.openDialog({
            title: t('menu.createShortcut'),
            icon: item.icon,
            message: t('desktop.shortcutCreated', item.title)
          });
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
                item.title = newName.trim();
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
          window.winManager.openDialog({
            title: `${item.title} ${t('menu.properties')}`,
            icon: item.icon,
            message: `<b>${item.title}</b><br>${t('explorer.typeApp')}<br>Location: C:\\Windows\\Desktop`
          });
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

  show(x, y, items) {
    if (!this.el) return;
    this.el.innerHTML = '';

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'win-menu-separator';
        this.el.appendChild(sep);
        return;
      }

      const row = document.createElement('div');
      row.className = 'context-menu-item' + (item.disabled ? ' disabled' : '') + (item.checked ? ' checked' : '');

      const labelSpan = document.createElement('span');
      if (item.bold) {
        labelSpan.innerHTML = `<strong>${item.label}</strong>`;
      } else {
        labelSpan.textContent = item.label;
      }
      row.appendChild(labelSpan);

      if (item.shortcut) {
        const sc = document.createElement('span');
        sc.className = 'context-menu-shortcut';
        sc.textContent = item.shortcut;
        row.appendChild(sc);
      }

      if (!item.disabled && item.action) {
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundSys) window.soundSys.playClick();
          this.hide();
          item.action();
        });
      }

      this.el.appendChild(row);
    });

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

