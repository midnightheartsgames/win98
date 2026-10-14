class VirtualFileSystem {
  constructor() {
    this.storageKey = 'win98_vfs_data';
    this.cdRomStorageKey = 'win98_cdrom_state';
    let savedCd = null;
    try {
      const raw = localStorage.getItem(this.cdRomStorageKey);
      if (raw) savedCd = JSON.parse(raw);
    } catch (e) {}
    this.cdRomState = savedCd || {
      inserted: true,
      discId: 'igromania_09_1998',
      label: 'Игромания (D:)',
      volumeLabel: 'ИГРОМАНИЯ_09_98'
    };
    this.root = this.loadFromStorage() || this.getDefaultTree();
    this.ensureIntegrity();
  }

  getHomeworkDocContent() {
    return `================================================================
  ДОМАШНЯЯ РАБОТА ПО АЛГЕБРЕ И ИНФОРМАТИКЕ (1998 год)
  Ученик: Иванов Алексей, 9-й класс «Б»
================================================================

[ ЗАДАНИЕ 1: Линейное уравнение ]
  3x + 12 = 27
  3x = 27 - 12
  3x = 15
  x = 5
  Ответ: x = 5  (Проверено!)

----------------------------------------------------------------
[ ЗАДАНИЕ 2: Квадратное уравнение ]
  x^2 - 7x + 10 = 0
  a = 1, b = -7, c = 10
  Дискриминант: D = b^2 - 4ac = 49 - 40 = 9  (sqrt(D) = 3)
  x1 = (7 + 3) / 2 = 5
  x2 = (7 - 3) / 2 = 2
  Ответ: x1 = 5, x2 = 2

----------------------------------------------------------------
[ ЗАДАНИЕ 3: Программа на QBasic для урока Информатики ]
  10 CLS
  20 PRINT "================================="
  30 PRINT " ПРИВЕТ ИЗ 1998 ГОДА! WIN 98 "
  40 PRINT "================================="
  50 FOR I = 1 TO 5
  60   PRINT "Загрузка процессора Pentium II: "; I * 20; "%"
  70 NEXT I
  80 PRINT "Готово! Запуск Wolfenstein 3D..."
  90 END

----------------------------------------------------------------
P.S. Мама, уроки сделаны на отлично! Можно я запущу Wolfenstein 3D
     или схожу к Мишке по локальной сети рубиться в Doom?
================================================================`;
  }

  generateSamplePictures() {
    const pictures = {};
    if (typeof document === 'undefined') return pictures;

    const createBmpData = (drawFn) => {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      const ctx = c.getContext('2d');
      drawFn(ctx, 320, 240);
      return c.toDataURL('image/png');
    };

    try {
      const cloudsImg = createBmpData((ctx, w, h) => {
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        sky.addColorStop(0, '#1a75cf');
        sky.addColorStop(1, '#7ec4fb');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(60, 50, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        const drawCloud = (cx, cy, s) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 20 * s, 0, Math.PI * 2);
          ctx.arc(cx + 20 * s, cy - 8 * s, 26 * s, 0, Math.PI * 2);
          ctx.arc(cx + 45 * s, cy, 22 * s, 0, Math.PI * 2);
          ctx.arc(cx + 25 * s, cy + 8 * s, 18 * s, 0, Math.PI * 2);
          ctx.fill();
        };
        drawCloud(70, 70, 0.9);
        drawCloud(210, 50, 1.1);
        drawCloud(150, 100, 0.6);

        ctx.fillStyle = '#2d992d';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.bezierCurveTo(w * 0.3, h * 0.55, w * 0.6, h * 0.75, w, h * 0.6);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        ctx.fillStyle = '#3eb53e';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.75);
        ctx.bezierCurveTo(w * 0.4, h * 0.65, w * 0.7, h * 0.85, w, h * 0.72);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        ctx.fillStyle = '#4cd64c';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.88);
        ctx.bezierCurveTo(w * 0.5, h * 0.8, w * 0.8, h * 0.92, w, h * 0.85);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('Microslop Win 98 • Bliss Edition', 10, h - 10);
      });

      const retroPcImg = createBmpData((ctx, w, h) => {
        ctx.fillStyle = '#2b3a4a';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#7a4f26';
        ctx.fillRect(0, 160, w, 80);
        ctx.fillStyle = '#5c3917';
        ctx.fillRect(0, 160, w, 6);

        ctx.fillStyle = '#dcd7ca';
        ctx.fillRect(230, 70, 70, 110);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(230, 70, 70, 110);
        ctx.fillStyle = '#b5afa2';
        ctx.fillRect(240, 85, 50, 12);
        ctx.fillRect(240, 105, 50, 8);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(280, 140, 4, 4);

        ctx.fillStyle = '#dcd7ca';
        ctx.fillRect(60, 50, 140, 110);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(60, 50, 140, 110);
        ctx.fillStyle = '#111';
        ctx.fillRect(72, 60, 116, 85);
        ctx.fillStyle = '#008080';
        ctx.fillRect(75, 63, 110, 79);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 68, 8, 8);
        ctx.fillRect(80, 82, 8, 8);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(75, 134, 110, 8);
        ctx.fillStyle = '#000080';
        ctx.fillRect(76, 135, 12, 6);

        ctx.fillStyle = '#c5bfb0';
        ctx.fillRect(110, 160, 40, 12);

        ctx.fillStyle = '#dcd7ca';
        ctx.fillRect(70, 180, 120, 25);
        ctx.strokeRect(70, 180, 120, 25);
        ctx.fillRect(205, 185, 18, 26);
        ctx.strokeRect(205, 185, 18, 26);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('Pentium II Workstation (1998)', 10, 25);
      });

      const cyberImg = createBmpData((ctx, w, h) => {
        const sky = ctx.createLinearGradient(0, 0, 0, 140);
        sky.addColorStop(0, '#0a0017');
        sky.addColorStop(0.5, '#40003b');
        sky.addColorStop(1, '#ff3b81');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, 140);

        const sun = ctx.createLinearGradient(0, 40, 0, 130);
        sun.addColorStop(0, '#fffb00');
        sun.addColorStop(1, '#ff0055');
        ctx.fillStyle = sun;
        ctx.beginPath();
        ctx.arc(160, 85, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#40003b';
        for (let y = 80; y < 130; y += 7) {
          ctx.fillRect(110, y, 100, 2);
        }

        ctx.fillStyle = '#1c0529';
        ctx.beginPath();
        ctx.moveTo(0, 140);
        ctx.lineTo(50, 100);
        ctx.lineTo(100, 140);
        ctx.lineTo(170, 95);
        ctx.lineTo(240, 140);
        ctx.lineTo(280, 110);
        ctx.lineTo(w, 140);
        ctx.fill();

        ctx.fillStyle = '#05000e';
        ctx.fillRect(0, 140, w, 100);

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        for (let y = 140; y < h; y += (y - 130) * 0.45 + 3) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let x = -80; x <= w + 80; x += 35) {
          ctx.beginPath();
          ctx.moveTo(160, 140);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('SYNTHWAVE CYBERSPACE 1998', 10, 20);
      });

      const artImg = createBmpData((ctx, w, h) => {
        const dusk = ctx.createLinearGradient(0, 0, 0, 120);
        dusk.addColorStop(0, '#151c38');
        dusk.addColorStop(0.7, '#6b306b');
        dusk.addColorStop(1, '#d87040');
        ctx.fillStyle = dusk;
        ctx.fillRect(0, 0, w, 120);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
          const sx = (i * 47) % w;
          const sy = (i * 23) % 70;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        ctx.fillStyle = '#fff5cc';
        ctx.beginPath();
        ctx.arc(260, 35, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#151c38';
        ctx.beginPath();
        ctx.arc(265, 33, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#221528';
        ctx.beginPath();
        ctx.moveTo(0, 120);
        ctx.lineTo(80, 50);
        ctx.lineTo(140, 90);
        ctx.lineTo(210, 45);
        ctx.lineTo(w, 120);
        ctx.fill();

        const lake = ctx.createLinearGradient(0, 120, 0, h);
        lake.addColorStop(0, '#1f1a3a');
        lake.addColorStop(1, '#0c0b1a');
        ctx.fillStyle = lake;
        ctx.fillRect(0, 120, w, 120);

        ctx.fillStyle = 'rgba(216, 112, 64, 0.4)';
        for (let y = 125; y < h; y += 8) {
          ctx.fillRect(170 + Math.sin(y) * 15, y, 60, 2);
        }

        ctx.fillStyle = '#0a0d14';
        const drawPine = (tx, ty, th) => {
          ctx.beginPath();
          ctx.moveTo(tx, ty - th);
          ctx.lineTo(tx - th * 0.4, ty);
          ctx.lineTo(tx + th * 0.4, ty);
          ctx.fill();
        };
        drawPine(30, 150, 45);
        drawPine(50, 155, 55);
        drawPine(75, 160, 38);
        drawPine(280, 160, 50);
        drawPine(300, 155, 60);

        ctx.fillStyle = '#ffeedd';
        ctx.font = 'italic 11px "Times New Roman", serif';
        ctx.fillText('Lake Redmond at Dusk • 1998 Oil Painting', 10, h - 10);
      });

      return {
        'windows_clouds.bmp': {
          type: 'file',
          name: 'windows_clouds.bmp',
          icon: 'file-bmp',
          app: 'imaging',
          content: cloudsImg
        },
        'retro_workstation.bmp': {
          type: 'file',
          name: 'retro_workstation.bmp',
          icon: 'file-bmp',
          app: 'imaging',
          content: retroPcImg
        },
        'cyberpunk_neon_1998.bmp': {
          type: 'file',
          name: 'cyberpunk_neon_1998.bmp',
          icon: 'file-bmp',
          app: 'imaging',
          content: cyberImg
        },
        'pixel_masterpiece.bmp': {
          type: 'file',
          name: 'pixel_masterpiece.bmp',
          icon: 'file-bmp',
          app: 'imaging',
          content: artImg
        }
      };
    } catch (e) {
      console.warn('generateSamplePictures failed:', e);
      return {};
    }
  }

  ensureIntegrity() {
    try {
      const cDrive = this.resolvePath(['My Computer', 'C:']);
      if (cDrive && cDrive.children) {
        if (!cDrive.children['Downloads']) {
          cDrive.children['Downloads'] = { type: 'folder', name: 'Downloads', icon: 'folder', children: {} };
        }
        if (!cDrive.children['Work']) {
          cDrive.children['Work'] = { type: 'folder', name: 'Work', icon: 'folder', children: {} };
        }
      }

      const myDocs = this.resolvePath(['My Computer', 'C:', 'My Documents']);
      if (myDocs && myDocs.children) {
        if (!myDocs.children['Downloads']) {
          myDocs.children['Downloads'] = {
            type: 'folder',
            name: 'Downloads',
            icon: 'folder-downloads',
            children: {}
          };
          this.saveToStorage();
        } else {
          const dl = myDocs.children['Downloads'];
          if (!dl.children) dl.children = {};
          if (dl.icon !== 'folder-downloads') {
            dl.icon = 'folder-downloads';
            this.saveToStorage();
          }
        }

        const dlFolder = myDocs.children['Downloads'];

        Object.keys(myDocs.children).forEach(k => {
          if (k !== 'Downloads' && (k.startsWith('Setup_') || k === 'burndemo.exe')) {
            dlFolder.children[k] = myDocs.children[k];
            delete myDocs.children[k];
            this.saveToStorage();
          }
        });

        if (window.gameManager && window.gameManager.state && window.gameManager.state.downloaded) {
          window.gameManager.state.downloaded.forEach(id => {
            const item = window.gameManager.catalog[id];
            if (item && !dlFolder.children[item.setupExe]) {
              dlFolder.children[item.setupExe] = {
                type: 'executable',
                name: item.setupExe,
                icon: 'setup-installer',
                app: 'setup',
                gameId: id
              };
              this.saveToStorage();
            }
          });
        }

        if (!myDocs.children['Мои рисунки']) {
          myDocs.children['Мои рисунки'] = {
            type: 'folder',
            name: 'Мои рисунки',
            icon: 'folder-pictures',
            children: this.generateSamplePictures()
          };
          this.saveToStorage();
        } else {
          const pics = myDocs.children['Мои рисунки'];
          if (!pics.children || Object.keys(pics.children).length === 0) {
            pics.children = this.generateSamplePictures();
            this.saveToStorage();
          }
        }

        if (!myDocs.children['Моя музыка']) {
          myDocs.children['Моя музыка'] = {
            type: 'folder',
            name: 'Моя музыка',
            icon: 'folder-music',
            children: {
              'Loadsamoney.mp3': {
                type: 'file',
                name: 'Loadsamoney.mp3',
                icon: 'file-music',
                app: 'winamp',
                content: 'content/music/Loadsamoney.mp3'
              },
              'Intro.mp3': {
                type: 'file',
                name: 'Intro.mp3',
                icon: 'file-music',
                app: 'winamp',
                content: 'content/music/Intro.mp3'
              }
            }
          };
          this.saveToStorage();
        } else {
          const musicFolder = myDocs.children['Моя музыка'];
          if (!musicFolder.children) musicFolder.children = {};
          if (!musicFolder.children['Loadsamoney.mp3']) {
            musicFolder.children['Loadsamoney.mp3'] = {
              type: 'file',
              name: 'Loadsamoney.mp3',
              icon: 'file-music',
              app: 'winamp',
              content: 'content/music/Loadsamoney.mp3'
            };
          }
          if (!musicFolder.children['Intro.mp3']) {
            musicFolder.children['Intro.mp3'] = {
              type: 'file',
              name: 'Intro.mp3',
              icon: 'file-music',
              app: 'winamp',
              content: 'content/music/Intro.mp3'
            };
          }
          if (!musicFolder.children['canyon.mid']) {
            musicFolder.children['canyon.mid'] = {
              type: 'file',
              name: 'canyon.mid',
              icon: 'file-music',
              app: 'winamp',
              content: '[Standard MIDI File: Canyon.mid - Win 98 Sound Track]'
            };
          }
          if (!musicFolder.children['passport.mid']) {
            musicFolder.children['passport.mid'] = {
              type: 'file',
              name: 'passport.mid',
              icon: 'file-music',
              app: 'winamp',
              content: '[Standard MIDI File: Passport.mid - Win 98 Sound Track]'
            };
          }
          this.saveToStorage();
        }

        if (!myDocs.children['Мои видео']) {
          myDocs.children['Мои видео'] = {
            type: 'folder',
            name: 'Мои видео',
            icon: 'folder-videos',
            children: {
              '98.mp4': {
                type: 'file',
                name: '98.mp4',
                icon: 'file-video',
                app: 'videoplayer',
                content: 'content/video/98.mp4'
              },
              'DEMO_CLIP.AVI': {
                type: 'file',
                name: 'DEMO_CLIP.AVI',
                icon: 'file-video',
                app: 'videoplayer',
                content: '[ActiveMovie Video Clip: 320x240 Cinepak 30fps]'
              },
              'WebCinema 98.url': {
                type: 'file',
                name: 'WebCinema 98.url',
                icon: 'internet-explorer',
                app: 'ie',
                content: 'http://www.webcinema98.com'
              }
            }
          };
        }
        const videoFolder = myDocs.children['Мои видео'];
        if (!videoFolder.children) videoFolder.children = {};
        if (!videoFolder.children['98.mp4']) {
          videoFolder.children['98.mp4'] = {
            type: 'file',
            name: '98.mp4',
            icon: 'file-video',
            app: 'videoplayer',
            content: 'content/video/98.mp4'
          };
        }
        if (!videoFolder.children['DEMO_CLIP.AVI']) {
          videoFolder.children['DEMO_CLIP.AVI'] = {
            type: 'file',
            name: 'DEMO_CLIP.AVI',
            icon: 'file-video',
            app: 'videoplayer',
            content: '[ActiveMovie Video Clip: 320x240 Cinepak 30fps]'
          };
        }
        if (!videoFolder.children['WebCinema 98.url']) {
          videoFolder.children['WebCinema 98.url'] = {
            type: 'file',
            name: 'WebCinema 98.url',
            icon: 'internet-explorer',
            app: 'ie',
            content: 'http://www.webcinema98.com'
          };
        }

        let downloadedVideos = [];
        try {
          const dlStr = localStorage.getItem('win98_downloaded_videos');
          if (dlStr) downloadedVideos = JSON.parse(dlStr);
        } catch (e) {}

        if (myDocs.children['Мои видеозаписи']) {
          const legacyFolder = myDocs.children['Мои видеозаписи'];
          if (legacyFolder.children) {
            Object.entries(legacyFolder.children).forEach(([name, item]) => {
              if (!videoFolder.children[name]) {
                videoFolder.children[name] = item;
              }
              if (!downloadedVideos.includes(name)) {
                downloadedVideos.push(name);
              }
            });
            try {
              localStorage.setItem('win98_downloaded_videos', JSON.stringify(downloadedVideos));
            } catch (e) {}
          }
          delete myDocs.children['Мои видеозаписи'];
        }

        const webVideoNames = [
          'The Prodigy - Live 1997 Manege Square.mp4',
          'The Prodigy - Live @ 27 September 1997 - Russia, Moscow, Manege Square (MTV Proshot).mp4',
          'Half-Life 1 trailer.mp4',
          'Fallout 1 Intro HD.mp4',
          'Fallout 2 Trailer.mp4',
          'Berserk TV Trailer.mp4',
          'Trailer for Another War.mp4',
          'Captain Jeff - Первый Уровень.mp4'
        ];

        webVideoNames.forEach(name => {
          if (videoFolder.children[name] && !downloadedVideos.includes(name)) {
            delete videoFolder.children[name];
          }
        });

        this.saveToStorage();

        if (!myDocs.children['DEMO_CLIP.AVI']) {
          myDocs.children['DEMO_CLIP.AVI'] = {
            type: 'file',
            name: 'DEMO_CLIP.AVI',
            icon: 'file-video',
            app: 'videoplayer',
            content: '[ActiveMovie Video Clip: 320x240 Cinepak 30fps]'
          };
          this.saveToStorage();
        }

        myDocs.children['Банковская карта и сайты.txt'] = {
          type: 'file',
          name: 'Банковская карта и сайты.txt',
          icon: 'file-txt',
          content: this.getCreditCardAndSitesDocContent()
        };
        this.saveToStorage();
      }

      const winFolder = this.resolvePath(['My Computer', 'C:', 'WINDOWS']);
      if (winFolder && winFolder.children && !winFolder.children['KODAKIMG.EXE']) {
        winFolder.children['KODAKIMG.EXE'] = {
          type: 'executable',
          name: 'KODAKIMG.EXE',
          icon: 'imaging',
          app: 'imaging'
        };
        this.saveToStorage();
      }

      const accFolder = this.resolvePath(['My Computer', 'C:', 'Program Files', 'Accessories']);
      if (accFolder && accFolder.children && !accFolder.children['KODAKIMG.EXE']) {
        accFolder.children['KODAKIMG.EXE'] = {
          type: 'executable',
          name: 'KODAKIMG.EXE',
          icon: 'imaging',
          app: 'imaging'
        };
        this.saveToStorage();
      }

      const progFolder = this.resolvePath(['My Computer', 'C:', 'Program Files']);
      if (progFolder && progFolder.children) {
        if (!progFolder.children['Winamp']) {
          progFolder.children['Winamp'] = {
            type: 'folder',
            name: 'Winamp',
            icon: 'folder',
            children: {}
          };
        }
        if (!progFolder.children['Winamp'].children['WINAMP.EXE']) {
          progFolder.children['Winamp'].children['WINAMP.EXE'] = {
            type: 'executable',
            name: 'WINAMP.EXE',
            icon: 'winamp',
            app: 'winamp'
          };
          this.saveToStorage();
        }
      }

      const bin = this.root.children['Recycle Bin'];
      if (bin && bin.items) {
        bin.items.forEach(item => {
          if (item.name === 'homework.txt') {
            item.type = 'file';
            item.icon = 'file-txt';
            item.app = 'notepad';
            if (!item.content || item.content.length < 50) item.content = this.getHomeworkDocContent();
          } else if (item.name === 'totally_not_a_virus.exe') {
            item.type = 'executable';
            item.icon = 'file-virus';
            item.app = 'virus';
          } else if (item.name === 'old_memes.bmp') {
            item.type = 'file';
            item.icon = 'file-bmp';
            item.app = 'paint';
            item.content = 'all-your-base';
          } else if (item.name === 'budget_1998.xls') {
            item.type = 'file';
            item.icon = 'file-xls';
            item.app = 'excel';
            item.content = 'budget_data';
          }
        });
      }

      const downloads = this.resolvePath(['My Computer', 'C:', 'Downloads']);
      if (downloads && downloads.children && downloads.children['totally_not_a_virus.exe']) {
        const item = downloads.children['totally_not_a_virus.exe'];
        item.type = 'executable';
        item.icon = 'file-virus';
        item.app = 'virus';
      }

      const work = this.resolvePath(['My Computer', 'C:', 'Work']);
      if (work && work.children && work.children['budget_1998.xls']) {
        const item = work.children['budget_1998.xls'];
        item.type = 'file';
        item.icon = 'file-xls';
        item.app = 'excel';
        item.content = 'budget_data';
      }

      if (myDocs && myDocs.children) {
        if (myDocs.children['old_memes.bmp']) {
          const item = myDocs.children['old_memes.bmp'];
          item.type = 'file';
          item.icon = 'file-bmp';
          item.app = 'paint';
          item.content = 'all-your-base';
        }
        if (myDocs.children['homework.txt']) {
          const item = myDocs.children['homework.txt'];
          item.type = 'file';
          item.icon = 'file-txt';
          item.app = 'notepad';
          if (!item.content || item.content.length < 50) item.content = this.getHomeworkDocContent();
        }
      }

      const games = this.resolvePath(['My Computer', 'C:', 'Games']);
      if (games && games.children) {
        const gmInstalled = (window.gameManager && window.gameManager.state)
          ? window.gameManager.state.installed
          : ['minesweeper'];

        if (!gmInstalled.includes('wolf3d') && games.children['WOLF3D.EXE']) {
          delete games.children['WOLF3D.EXE'];
        } else if (gmInstalled.includes('wolf3d') && !games.children['WOLF3D.EXE']) {
          games.children['WOLF3D.EXE'] = { type: 'executable', name: 'WOLF3D.EXE', icon: 'wolf3d', app: 'wolf3d' };
        }

        if (!gmInstalled.includes('quest') && games.children['QUEST.EXE']) {
          delete games.children['QUEST.EXE'];
        } else if (gmInstalled.includes('quest') && !games.children['QUEST.EXE']) {
          games.children['QUEST.EXE'] = { type: 'executable', name: 'QUEST.EXE', icon: 'lucas-quest', app: 'quest' };
        }

        if (!gmInstalled.includes('stalker') && games.children['STALKER.EXE']) {
          delete games.children['STALKER.EXE'];
        } else if (gmInstalled.includes('stalker') && !games.children['STALKER.EXE']) {
          games.children['STALKER.EXE'] = { type: 'executable', name: 'STALKER.EXE', icon: 'stalker', app: 'stalker' };
        }

        if (!gmInstalled.includes('fallout2') && games.children['FALLOUT2.EXE']) {
          delete games.children['FALLOUT2.EXE'];
        } else if (gmInstalled.includes('fallout2') && !games.children['FALLOUT2.EXE']) {
          games.children['FALLOUT2.EXE'] = { type: 'executable', name: 'FALLOUT2.EXE', icon: 'fallout2', app: 'fallout2' };
        }

        if (!gmInstalled.includes('doom') && games.children['Doom']) {
          delete games.children['Doom'];
        } else if (gmInstalled.includes('doom') && !games.children['Doom']) {
          games.children['Doom'] = {
            type: 'folder', name: 'Doom', icon: 'folder', children: {
              'DOOM.EXE': { type: 'executable', name: 'DOOM.EXE', icon: 'doom', app: 'doom' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'DOOM 98\r\n==================================\r\nid Software (1993) - fan clone for Win 98\r\n\r\nControls:\r\n[W/S] or [Up/Down] - Move   [A/D] - Strafe   [Left/Right] or Mouse - Turn\r\n[Ctrl] / [Left Click] - Fire   [E] / [Space] / [Right Click] - Use / Open\r\n[Shift] - Run   [1-7] / Mouse wheel - Weapons   [Tab] - Automap\r\n[Esc] - Menu   [F2]/[F3] - Save/Load   [F6]/[F9] - Quicksave/Quickload\r\n\r\nClick the game view to capture the mouse.\r\nCheat codes from doom2_cheats.zip work here too.' }
            }
          };
        }

        if (!gmInstalled.includes('serioussam') && games.children['SeriousSam']) {
          delete games.children['SeriousSam'];
        } else if (gmInstalled.includes('serioussam') && !games.children['SeriousSam']) {
          games.children['SeriousSam'] = {
            type: 'folder', name: 'SeriousSam', icon: 'folder', children: {
              'SAM.EXE': { type: 'executable', name: 'SAM.EXE', icon: 'serioussam', app: 'serioussam' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Serious Sam 98: The First Encounter\r\n==================================\r\nCroteam (2001) - fan remake for Win 98\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] / [Ctrl] - Fire\r\n[Space] - Jump   [Shift] - Walk   [1-9, 0] / Mouse wheel - Weapons   [Q] - Previous weapon\r\n[Tab] - NETRICSA   [Esc] - Menu\r\n\r\nLevels: Hatshepsut, Sand Canyon, Valley of the Kings,\r\nAlley of Sphinxes, The Great Pyramid.\r\nConsole: please god / please giveall / please killall\r\n[F7] - Debug: weapons, invulnerability, heal, armor, noclip, fast run, high jump, infinite ammo' }
            }
          };
        }

        if (!gmInstalled.includes('moh98') && games.children['MOH98']) {
          delete games.children['MOH98'];
        } else if (gmInstalled.includes('moh98') && !games.children['MOH98']) {
          games.children['MOH98'] = {
            type: 'folder', name: 'MOH98', icon: 'folder', children: {
              'MOH.EXE': { type: 'executable', name: 'MOH.EXE', icon: 'moh98', app: 'moh98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Medal of Honor 98\r\n==================================\r\nDreamWorks Interactive (1999) - fan remake for Win 98\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Aim / scope\r\n[Shift] - Walk quietly   [Ctrl]/[C] - Crouch   [Space] - Jump   [Q]/[E] - Lean\r\n[R] - Reload   [F] - Use (doors, explosives, prisoners, papers)   [G] - Grenade\r\n[1-7] / Mouse wheel - Weapons (7 - papers)   [Tab] - Objectives   [Esc] - Menu\r\n\r\nMissions: Operation Retriever, U-4902, Heavy Water,\r\nSiegfried Forest, Colditz Castle, Nordhausen.\r\nPasswords are entered in the main menu.' }
            }
          };
        }

        if (!gmInstalled.includes('cop98') && games.children['CoP98']) {
          delete games.children['CoP98'];
        } else if (gmInstalled.includes('cop98') && !games.children['CoP98']) {
          games.children['CoP98'] = {
            type: 'folder', name: 'CoP98', icon: 'folder', children: {
              'ZATON.EXE': { type: 'executable', name: 'ZATON.EXE', icon: 'cop98', app: 'cop98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'S.T.A.L.K.E.R.: Call of Pripyat 98 - Zaton\r\n==================================\r\nGSC Game World (1999) - Win 98 Edition, software renderer\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse]/[Arrows] - Look   [Left Click] - Fire   [Right Click] - Aim\r\n[Shift] - Sprint   [Ctrl]/[C] - Crouch   [Space] - Jump   [R] - Reload\r\n[1-4] - Weapons   [G] - Grenade   [B] - Bolt   [O] - Detector   [L] - Flashlight\r\n[F] - Use   [I] - Inventory   [P] - PDA   [F1-F4] - Quick slots   [F5]/[F9] - Save/Load\r\n\r\nHide from emissions indoors. Throw bolts before you step.' }
            }
          };
        }

        if (!gmInstalled.includes('mc98') && games.children['MC98']) {
          delete games.children['MC98'];
        } else if (gmInstalled.includes('mc98') && !games.children['MC98']) {
          games.children['MC98'] = {
            type: 'folder', name: 'MC98', icon: 'folder', children: {
              'MINECRAFT.EXE': { type: 'executable', name: 'MINECRAFT.EXE', icon: 'mc98', app: 'mc98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Minecraft 98 Alpha\r\n==================================\r\nMojang Specifications (1999) - Win 98 Edition\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse]/[Arrows] - Look   [Left Click] - Dig   [Right Click] - Place / Use\r\n[Space] - Jump / Swim   [Shift] - Sneak   [Ctrl] - Sprint   [E] - Inventory   [Q] - Drop\r\n[1-9] / Mouse wheel - Hotbar   [Middle Click] - Pick block   [F3] - Debug   [Esc] - Pause\r\nCreative: double-tap Space to fly.\r\n\r\nPunch trees. Craft a workbench. Build a shelter before night.\r\nWorlds are saved automatically every minute and on exit.' }
            }
          };
        }
        if (!gmInstalled.includes('dao98') && games.children['DAO98']) {
          delete games.children['DAO98'];
        } else if (gmInstalled.includes('dao98') && !games.children['DAO98']) {
          games.children['DAO98'] = {
            type: 'folder', name: 'DAO98', icon: 'folder', children: {
              'DAORIGINS.EXE': { type: 'executable', name: 'DAORIGINS.EXE', icon: 'dao98', app: 'dao98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Dragon Age: Origins 98\r\n==================================\r\nBioWare (2000) - Win 98 Edition\r\n\r\n[Left Click] - Move / Attack / Talk / Use   [W/A/S/D] - Move   [Space] - Pause\r\n[F1-F4] - Party   [1-0] - Quickbar   [C/K/I/J/M/T/N/P] - Panels   [F5]/[F9] - Quick save/load\r\n\r\nChoose your origin. Survive Ostagar. Reach Lothering.' }
            }
          };
        }
        if (!gmInstalled.includes('tekken3') && games.children['Tekken3']) {
          delete games.children['Tekken3'];
        } else if (gmInstalled.includes('tekken3') && !games.children['Tekken3']) {
          games.children['Tekken3'] = {
            type: 'folder', name: 'Tekken3', icon: 'folder', children: {
              'TEKKEN3.EXE': { type: 'executable', name: 'TEKKEN3.EXE', icon: 'tekken3', app: 'tekken3' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Tekken 3 98\r\n==================================\r\nNamco (1998) - Win 98 Edition\r\n\r\nP1: [W/A/S/D] move, [U] 1  [I] 2  [J] 3  [K] 4\r\nP2: [Arrows] move, [Num 4] 1  [Num 5] 2  [Num 1] 3  [Num 2] 4\r\n[Enter] - Start / Pause   [Esc] - Pause menu and move list\r\n\r\nTap up or down to sidestep. 1+3 / 2+4 throw, break with 1 / 2.\r\nClear Arcade to unlock hidden fighters, endings and modes.' }
            }
          };
        }
        if (!gmInstalled.includes('ow98') && games.children['Overwatch']) {
          delete games.children['Overwatch'];
        } else if (gmInstalled.includes('ow98') && !games.children['Overwatch']) {
          games.children['Overwatch'] = {
            type: 'folder', name: 'Overwatch', icon: 'folder', children: {
              'OVERWATCH.EXE': { type: 'executable', name: 'OVERWATCH.EXE', icon: 'ow98', app: 'ow98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Overwatch 98\r\n==================================\r\nBlizzard Entertainment (2000) - Win 98 Edition, 3D accelerated\r\n\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left/Right Click] - Fire   [Space] - Jump\r\n[Shift] / [E] - Abilities   [Q] - Ultimate   [R] - Reload   [V] - Melee   [H] - Change hero\r\n[Tab] - Scoreboard   [T] - Spray   [X]/[Z] - Voice lines   [Esc] - Menu\r\n\r\n12 heroes, 8 maps, 4 game modes, training range and tutorial.\r\nThe world could always use more heroes!' }
            }
          };
        }
        if (!gmInstalled.includes('sammax106') && games.children['SamMax106']) {
          delete games.children['SamMax106'];
        } else if (gmInstalled.includes('sammax106') && !games.children['SamMax106']) {
          games.children['SamMax106'] = {
            type: 'folder', name: 'SamMax106', icon: 'folder', children: {
              'SAMMAX6.EXE': { type: 'executable', name: 'SAMMAX6.EXE', icon: 'sammax106', app: 'sammax106' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Bright Side of the Moon\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Back / Menu   [F5] - Save and load\r\nUse the DeSoto to fly between the street and the Moon.\r\n\r\nA rainbow hangs over the city at night and it comes from the Moon.\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax201') && games.children['SamMax201']) {
          delete games.children['SamMax201'];
        } else if (gmInstalled.includes('sammax201') && !games.children['SamMax201']) {
          games.children['SamMax201'] = {
            type: 'folder', name: 'SamMax201', icon: 'folder', children: {
              'SAMMAX21.EXE': { type: 'executable', name: 'SAMMAX21.EXE', icon: 'sammax201', app: 'sammax201' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Ice Station Santa\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Back / Menu   [F5] - Save and load\r\nUse the DeSoto to fly between the street and the North Pole.\r\n\r\nA giant robot arrived a week before Christmas, a present from Santa\'s workshop.\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax202') && games.children['SamMax202']) {
          delete games.children['SamMax202'];
        } else if (gmInstalled.includes('sammax202') && !games.children['SamMax202']) {
          games.children['SamMax202'] = {
            type: 'folder', name: 'SamMax202', icon: 'folder', children: {
              'SAMMAX22.EXE': { type: 'executable', name: 'SAMMAX22.EXE', icon: 'sammax202', app: 'sammax202' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Moai Better Blues\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Back / Menu   [F5] - Save and load\r\nStep through the Bermuda Triangle portal to visit Easter Island.\r\n\r\nA triangular portal opened right outside the office and the volcano is rumbling.\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('bttf') && games.children['BTTF']) {
          delete games.children['BTTF'];
        } else if (gmInstalled.includes('bttf') && !games.children['BTTF']) {
          games.children['BTTF'] = {
            type: 'folder', name: 'BTTF', icon: 'folder', children: {
              'BTTF.EXE': { type: 'executable', name: 'BTTF.EXE', icon: 'bttf', app: 'bttf' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Back to the Future: The Game - Episode 1: It\'s About Time\r\n==================================\r\nTelltale Games (2000) - Win 98 Edition, 640x480, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / Use / Talk   [Right Click] - Look   [Wheel] / bar at the bottom - Pockets\r\n[Click an item] then [Click a target] - Use an item   [1-6] - Pick a line in a conversation\r\n[Space] / [Click] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save and load\r\nStuck? Open the menu and press THINK, McFLY: up to four hints for every goal.\r\n\r\nDoc vanished six months ago. Tonight the DeLorean came back on its own.\r\nGreat Scott!' }
            }
          };
        }
        if (!gmInstalled.includes('sammax105') && games.children['SamMax105']) {
          delete games.children['SamMax105'];
        } else if (gmInstalled.includes('sammax105') && !games.children['SamMax105']) {
          games.children['SamMax105'] = {
            type: 'folder', name: 'SamMax105', icon: 'folder', children: {
              'SAMMAX5.EXE': { type: 'executable', name: 'SAMMAX5.EXE', icon: 'sammax105', app: 'sammax105' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Reality 2.0\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Back / Menu   [F5] - Save and load\r\nThe goggles button in the lower right corner switches between the street and Reality 2.0.\r\n\r\nComputers all over the country went crazy and the neighbours will not take their goggles off.\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax104') && games.children['SamMax104']) {
          delete games.children['SamMax104'];
        } else if (gmInstalled.includes('sammax104') && !games.children['SamMax104']) {
          games.children['SamMax104'] = {
            type: 'folder', name: 'SamMax104', icon: 'folder', children: {
              'SAMMAX4.EXE': { type: 'executable', name: 'SAMMAX4.EXE', icon: 'sammax104', app: 'sammax104' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Abe Lincoln Must Die!\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Close a panel / Menu   [F5] - Save and load\r\n\r\nThe President banned pudding. The Commissioner sends you to Washington.\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax103') && games.children['SamMax103']) {
          delete games.children['SamMax103'];
        } else if (gmInstalled.includes('sammax103') && !games.children['SamMax103']) {
          games.children['SamMax103'] = {
            type: 'folder', name: 'SamMax103', icon: 'folder', children: {
              'SAMMAX3.EXE': { type: 'executable', name: 'SAMMAX3.EXE', icon: 'sammax103', app: 'sammax103' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: The Mole, the Mob and the Meatball\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Menu   [F5] - Save and load\r\n\r\nFind the Commissioner\'s mole inside the Toy Mafia. Ask everyone: "Does the carpet match the drapes?"\r\nTalk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax102') && games.children['SamMax102']) {
          delete games.children['SamMax102'];
        } else if (gmInstalled.includes('sammax102') && !games.children['SamMax102']) {
          games.children['SamMax102'] = {
            type: 'folder', name: 'SamMax102', icon: 'folder', children: {
              'SAMMAX2.EXE': { type: 'executable', name: 'SAMMAX2.EXE', icon: 'sammax102', app: 'sammax102' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Situation: Comedy\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Menu   [F5] - Save and load\r\n\r\nMyra Stump wants stars. Become one by tonight. Talk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('sammax') && games.children['SamMax']) {
          delete games.children['SamMax'];
        } else if (gmInstalled.includes('sammax') && !games.children['SamMax']) {
          games.children['SamMax'] = {
            type: 'folder', name: 'SamMax', icon: 'folder', children: {
              'SAMMAX.EXE': { type: 'executable', name: 'SAMMAX.EXE', icon: 'sammax', app: 'sammax' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Sam & Max: Culture Shock\r\n==================================\r\nLucasArts (2000) - Win 98 Edition\r\n\r\n[Left Click] - Walk / Act   [Right Click] - Next cursor   [1-4] - Cursors\r\n[I] - Inventory   [.] - Skip line   [Esc] - Skip / Menu   [F5] - Save and load\r\n\r\nThe Soda Poppers are back. Talk to Max when you are stuck.' }
            }
          };
        }
        if (!gmInstalled.includes('quake3') && games.children['Quake3']) {
          delete games.children['Quake3'];
        } else if (gmInstalled.includes('quake3') && !games.children['Quake3']) {
          games.children['Quake3'] = {
            type: 'folder', name: 'Quake3', icon: 'folder', children: {
              'QUAKE3.EXE': { type: 'executable', name: 'QUAKE3.EXE', icon: 'quake3', app: 'quake3' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Quake III Arena\r\n==================================\r\nid Software (1999) - Win 98 Edition, OpenGL\r\n\r\n[W/A/S/D] - Move   [Mouse] - Look   [LMB] - Attack   [RMB] - Zoom\r\n[Space] - Jump   [C] - Crouch   [1-9] - Weapons   [Tab] - Scores   [~] - Console\r\n\r\nTier 1: Arena Gate, House of Pain, Arena of Death, Power Station 0218.\r\nTier 2: The Place of Many Deaths, The Forgotten Place, The Camping Grounds, The Proving Grounds.\r\n\r\nFIGHT!' },
              'baseq3': {
                type: 'folder', name: 'baseq3', icon: 'folder', children: {
                  'PAK0.PK3': { type: 'file', name: 'PAK0.PK3', icon: 'winrar', content: 'PK' },
                  'Q3CONFIG.CFG': { type: 'file', name: 'Q3CONFIG.CFG', icon: 'notepad', app: 'notepad', content: 'bind TAB "+scores"\r\nbind SPACE "+moveup"\r\nbind c "+movedown"\r\nbind w "+forward"\r\nbind s "+back"\r\nbind a "+moveleft"\r\nbind d "+moveright"\r\nbind MOUSE1 "+attack"\r\nbind MOUSE2 "+zoom"\r\nseta name "UnnamedPlayer"\r\nseta model "sarge"\r\nseta sensitivity "5"\r\nseta cg_fov "90"\r\nseta com_maxfps "85"\r\n' },
                  'demos': { type: 'folder', name: 'demos', icon: 'folder', children: {} },
                  'screenshots': { type: 'folder', name: 'screenshots', icon: 'folder', children: {} }
                }
              }
            }
          };
        }
        if (!gmInstalled.includes('diablo2') && games.children['Diablo2']) {
          delete games.children['Diablo2'];
        } else if (gmInstalled.includes('diablo2') && !games.children['Diablo2']) {
          games.children['Diablo2'] = {
            type: 'folder', name: 'Diablo2', icon: 'folder', children: {
              'DIABLO2.EXE': { type: 'executable', name: 'DIABLO2.EXE', icon: 'diablo2', app: 'diablo2' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Diablo II - Act I\r\n==================================\r\nBlizzard North (2000) - Win 98 Edition, 800x600\r\n\r\n[Left Click] - Walk, attack, talk, pick up   [Right Click] - Right skill\r\n[C] Character  [I] Inventory  [T] Skills  [Q] Quests  [Tab] Map  [Alt] Items\r\n[1-4] - Potions   [W] - Swap weapons   [H] - Help   [Esc] - Menu\r\n\r\nSeven classes, the Rogue Encampment and Andariel.\r\nStay a while and listen.' },
              'SAVE': { type: 'folder', name: 'SAVE', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('xiii') && games.children['XIII']) {
          delete games.children['XIII'];
        } else if (gmInstalled.includes('xiii') && !games.children['XIII']) {
          games.children['XIII'] = {
            type: 'folder', name: 'XIII', icon: 'folder', children: {
              'XIII.EXE': { type: 'executable', name: 'XIII.EXE', icon: 'xiii', app: 'xiii' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'XIII\r\n==================================\r\nUbisoft Paris (2000) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 350 MHz, 64 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Zoom\r\n[Space] - Jump   [C]/[Ctrl] - Crouch   [Shift] - Walk quietly   [E]/[F] - Use, pick locks, take a hostage\r\n[R] - Reload   [1-9] - Weapons   [Q] - Last weapon   [G] - Grenade   [H] - Medkit\r\n[Tab] - Objectives   [F5] - Quick save   [F9] - Quick load   [Esc] - Pause menu\r\n\r\nTen chapters from Brighton Beach to Plain Rock Penitentiary.\r\nEvery document you find is a piece of your past. Collect them all for the XX dossier.' },
              'SAVE': { type: 'folder', name: 'SAVE', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('maxpayne') && games.children['MaxPayne']) {
          delete games.children['MaxPayne'];
        } else if (gmInstalled.includes('maxpayne') && !games.children['MaxPayne']) {
          games.children['MaxPayne'] = {
            type: 'folder', name: 'MaxPayne', icon: 'folder', children: {
              'MAXPAYNE.EXE': { type: 'executable', name: 'MAXPAYNE.EXE', icon: 'maxpayne', app: 'maxpayne' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Max Payne\r\n==================================\r\nRemedy Entertainment (2001) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 450 MHz, 96 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Aim   [Left Click] - Fire   [Right Click] - Bullet time / Shootdodge\r\n[Shift] - Bullet time   [Q] - Shootdodge   [Space] - Jump   [C]/[Ctrl] - Crouch   [Alt] - Walk\r\n[E]/[F] - Use   [R] - Reload   [H]/[Backspace] - Painkillers   [G] - Throw grenade or Molotov\r\n[1-5], [Wheel] - Weapons   [Tab] - Max\'s thoughts   [Enter] - Skip a line   [F5] - Quick save   [F9] - Quick load   [Esc] - Menu\r\n\r\nPart I: The American Dream. A tutorial, a prologue and nine chapters, from Roscoe Street Station to Aesir Plaza.\r\nKills refill the hourglass. Painkillers heal over time. Harder modes open after Part I.' },
              'SAVEGAMES': { type: 'folder', name: 'SAVEGAMES', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('gtann') && games.children['GTANN']) {
          delete games.children['GTANN'];
        } else if (gmInstalled.includes('gtann') && !games.children['GTANN']) {
          games.children['GTANN'] = {
            type: 'folder', name: 'GTANN', icon: 'folder', children: {
              'GTANN.EXE': { type: 'executable', name: 'GTANN.EXE', icon: 'gtann', app: 'gtann' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Grand Theft Auto: Nizhny City\r\n==================================\r\nRockstar North (2002) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium III 600 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.\r\n\r\nControls:\r\n[W/A/S/D] - Walk / Drive   [Mouse] - Look   [Left Click]/[Ctrl] - Attack, fire   [Right Click] - Aim, sniper scope\r\n[Shift] - Sprint   [Space] - Jump / Handbrake   [F]/[Enter] - Get in / out of a car   [Q]/[E], [1-7] - Weapons (in a car: look sideways, drive-by)\r\n[G] - Grenade   [R] - Reload / Next radio station   [H] - Horn, siren   [T] - Taxi or militia job   [C] - Camera   [M]/[Tab] - Map   [Esc] - Pause\r\n\r\nSave the game at the hotel «Zarechnaya». Lose the militia out of sight, at a respray shop or with a bribe.\r\nCheats: ZDOROVIE, BRONYA, STVOLY, BABKI, MENTY, POGODA.' },
              'SAVES': { type: 'folder', name: 'SAVES', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('legion') && games.children['LegionArena']) {
          delete games.children['LegionArena'];
        } else if (gmInstalled.includes('legion') && !games.children['LegionArena']) {
          games.children['LegionArena'] = {
            type: 'folder', name: 'LegionArena', icon: 'folder', children: {
              'ARENA.EXE': { type: 'executable', name: 'ARENA.EXE', icon: 'legion', app: 'legion' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Legion Arena\r\n==================================\r\nSlitherine Software (2005) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium III 700 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.\r\n\r\nDeployment:\r\n[Left drag] - Move a squad inside the deployment zone   [Right drag] - Turn it   [1/2/3] - Formation   [Enter] - Start the battle\r\n\r\nBattle:\r\n[Left Click] / [Drag a box] - Select squads   [Right Click] - Move / Attack   [Space] - Pause   [+]/[-] - Speed\r\n[G] - Signal   [R] - Rally   [H] - Halt   [C] - Charge   [X] - Pull cavalry out   [T] - Show terrain\r\n[W/A/S/D]/[Arrows] - Camera   [Q]/[E] - Turn   [Wheel] - Zoom   [Tab] - Next squad   [Home] - General   [Esc] - Menu\r\n\r\nTen battles of the Roman campaign, the Arena and the encyclopedia.\r\nCommand points are scarce. Plan well, then let your men fight.' },
              'SAVE GAMES': { type: 'folder', name: 'SAVE GAMES', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('fallout') && games.children['Fallout']) {
          delete games.children['Fallout'];
        } else if (gmInstalled.includes('fallout') && !games.children['Fallout']) {
          games.children['Fallout'] = {
            type: 'folder', name: 'Fallout', icon: 'folder', children: {
              'FALLOUTW.EXE': { type: 'executable', name: 'FALLOUTW.EXE', icon: 'fallout', app: 'fallout' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Fallout: A Post-Nuclear Role-Playing Game\r\n==================================\r\nInterplay Productions (1997) - Win 98 Edition, version 1.2, 640x480, 256 colors\r\n\r\nSystem requirements: Pentium 90 MHz, 16 MB RAM, SVGA video card (640x480, 256 colors), DirectX 3.0a, 2x CD-ROM, mouse.\r\n\r\nControls:\r\n[Left Click] - Walk or act with the current cursor   [Right Click] - Switch the walk and action cursors\r\n[Hold Left Button] on an object - Action menu: look, talk, use, skill, rotate\r\n[A] - Attack   [Space] - End turn   [Enter] - End combat   [N] - Weapon mode   [B] - Swap hands   [M] - Cursor mode\r\n[I] - Inventory   [C] - Character   [P] - Pip-Boy   [Z] - Pip-Boy clock   [S] - Skilldex   [Tab] - Automap   [O]/[Esc] - Options\r\n[1-8] - Sneak, Lockpick, Steal, Traps, First Aid, Doctor, Science, Repair\r\n[Home] - Center on you   [,]/[.] - Turn   [/] - Time   [+]/[-] - Brightness   [F1] - Help\r\n[F4]/[Ctrl+S] - Save   [F5]/[Ctrl+L] - Load   [F6] - Quick save   [F7] - Quick load   [F10]/[Ctrl+Q] - Quit\r\n\r\nVault 13, 5 December 2161. The water chip has failed and the vault has water for 150 days.\r\nThe Overseer has chosen you to find a new one.' },
              'DATA': { type: 'folder', name: 'DATA', icon: 'folder', children: { 'SAVEGAME': { type: 'folder', name: 'SAVEGAME', icon: 'folder', children: {} } } }
            }
          };
        }
        if (!gmInstalled.includes('falloutzp') && games.children['FalloutZP']) {
          delete games.children['FalloutZP'];
        } else if (gmInstalled.includes('falloutzp') && !games.children['FalloutZP']) {
          games.children['FalloutZP'] = {
            type: 'folder', name: 'FalloutZP', icon: 'folder', children: {
              'FALLOUTZP.EXE': { type: 'executable', name: 'FALLOUTZP.EXE', icon: 'falloutzp', app: 'falloutzp' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Fallout: Запорожье\r\n==================================\r\nObsidian Entertainment (2001) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium III 600 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire / Swing   [Right Click] - Aim   [Shift] - Walk   [Space] - Jump\r\n[Ctrl] - Sneak   [E] - Use, talk, open   [R] - Reload   [F] - First / third person   [H] - Holster   [G] - Throw grenade\r\n[V] - S.T.R.E.L.A. targeting   [Tab] - Pioneer-77   [T] - Wait   [L] - Pioneer light   [1-8] - Hotkeys   [Wheel] - Next weapon\r\n[F5] - Quick save   [F9] - Quick load   [Esc] - Menu\r\n\r\nZaporozhye, 1 September 2280. The courier of the Main Post Office was shot on the bridge and thrown into the Dnieper.\r\nVoznesenovsky district and the island of Khortytsia are open from the start. Danger grows with distance from Voznesenka.\r\n\r\nMap of Zaporozhye based on OpenStreetMap data, (c) OpenStreetMap contributors, ODbL. Heights: SRTM, NASA.' },
              'SAVE': { type: 'folder', name: 'SAVE', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('anotherwar') && games.children['AnotherWar']) {
          delete games.children['AnotherWar'];
        } else if (gmInstalled.includes('anotherwar') && !games.children['AnotherWar']) {
          games.children['AnotherWar'] = {
            type: 'folder', name: 'AnotherWar', icon: 'folder', children: {
              'AW.EXE': { type: 'executable', name: 'AW.EXE', icon: 'anotherwar', app: 'anotherwar' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Другая война (Another War)\r\n==================================\r\nMirage Interactive (2002) - Win 98 Edition, 800x600\r\n\r\nСистемные требования: Pentium II 433 МГц, 128 MB RAM, видеокарта с 8 MB памяти, DirectX 8.1.\r\n\r\nУправление:\r\n[Левая кнопка] - идти, осмотреть, подобрать   [Правая кнопка] - говорить, использовать, открыть\r\n[D] - достать или спрятать оружие   [Ctrl]+[Левая кнопка] - прицельный выстрел   [Enter] - атаковать ближайшего врага\r\n[R] - перезарядить   [E] - починить оружие   [1-7] - предметы на поясе   [W] - шаг или бег\r\n[F1-F8] - выбрать особый навык   [Пробел] - применить навык   [Backspace] - отменить выбор\r\n[I] - снаряжение   [S] - параметры   [N] - дневник   [M] - карта   [O] - настройки   [H]/[F10] - помощь\r\n[Ctrl+S] - сохранить   [Ctrl+L] - загрузить   [F11] - быстрое сохранение   [F12] - быстрая загрузка\r\n[P] - пауза   [Пробел]/[Enter] - пропустить реплику в сценке   [Esc] - меню\r\n\r\nАкт I. Аннет, оккупированная Франция. Выберите героя: Силач, Вор или Интеллектуал.\r\nВыберитесь из подвалов вместе с Иоганном и найдите способ уехать из города.\r\nПродолжение следует: впереди Югославия.' },
              'SAVEGAME': { type: 'folder', name: 'SAVEGAME', icon: 'folder', children: {} }
            }
          };
        }
        if (!gmInstalled.includes('plov') && games.children['HayatoPlov']) {
          delete games.children['HayatoPlov'];
        } else if (gmInstalled.includes('plov') && !games.children['HayatoPlov']) {
          games.children['HayatoPlov'] = {
            type: 'folder', name: 'HayatoPlov', icon: 'folder', children: {
              'PLOV.EXE': { type: 'executable', name: 'PLOV.EXE', icon: 'plov', app: 'plov' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Хаято, Где плов?\r\n==================================\r\nKishlak Soft (2000) - Win 98 Edition, 800x600, 16-bit color\r\n\r\nControls:\r\n[Left Click] - Walk and act, clicks queue up to five jobs   [Right Click]/[Q] - Cancel the jobs\r\n[Drag] - Drag guests from the gate to a table   [Tab] - Pick guests in the line   [1-6] - Seat them at table N\r\n[W/A/S/D]/[Arrows] - Walk   [Space]/[E] - Use what is next to you   [Esc]/[P] - Pause\r\n\r\nKeep the kazan busy: meat, carrots with onion, rice, then steam.\r\nGroups of three and four sit only on the topchans. Tea brews two pots at a time.\r\nA quarter of every day goes to the savings box. Spend it at the bazaar.' }
            }
          };
        }
        if (!gmInstalled.includes('sims3') && games.children['Sims3']) {
          delete games.children['Sims3'];
        } else if (gmInstalled.includes('sims3') && !games.children['Sims3']) {
          games.children['Sims3'] = {
            type: 'folder', name: 'Sims3', icon: 'folder', children: {
              'SIMS3.EXE': { type: 'executable', name: 'SIMS3.EXE', icon: 'sims3', app: 'sims3' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'The Sims 3 - 2000 Edition\r\n==================================\r\nMaxis (2000) - Win 98 Edition, 3D accelerated\r\n\r\n[Left Click] - Interact   [Right Click] - Cancel action   [Q/E] - Rotate   [Wheel] - Zoom\r\n[Space] - Pause   [1-3] - Speed   [F1/F2/F3] - Live, Buy, Build   [M] - Map   [Esc] - Menu\r\n\r\nWelcome to Sunset Valley.' }
            }
          };
        }
        if (!gmInstalled.includes('forza') && games.children['ForzaHorizon']) {
          delete games.children['ForzaHorizon'];
        } else if (gmInstalled.includes('forza') && !games.children['ForzaHorizon']) {
          games.children['ForzaHorizon'] = {
            type: 'folder', name: 'ForzaHorizon', icon: 'folder', children: {
              'FORZA.EXE': { type: 'executable', name: 'FORZA.EXE', icon: 'forza', app: 'forza' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Forza Horizon: Riga\r\n==================================\r\nPlayground Games (2000) - Win 98 Edition, 3D accelerated\r\n\r\n[W/S] - Throttle, brake   [A/D] - Steer   [Space] - Handbrake   [R] - Rewind\r\n[C] - Camera, cockpit view   [M] - Map   [Tab] - Radio   [Esc] - Horizon menu\r\n[F7] - Debug: credits, XP, weather, time of day, teleport\r\n\r\nYour first car is a Lada 2105. The festival is waiting in Mezaparks.\r\nWeather changes on its own: clear, overcast, downpour, thunderstorm and fog.' }
            }
          };
        }
        if (!gmInstalled.includes('dmc98') && games.children['DMC98']) {
          delete games.children['DMC98'];
        } else if (gmInstalled.includes('dmc98') && !games.children['DMC98']) {
          games.children['DMC98'] = {
            type: 'folder', name: 'DMC98', icon: 'folder', children: {
              'DMC4.EXE': { type: 'executable', name: 'DMC4.EXE', icon: 'dmc98', app: 'dmc98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Devil May Cry 4 98\r\n==================================\r\nCapcom (2000) - Win 98 Edition\r\n\r\n[W/A/S/D] - Move   [J] - Sword   [K] - Gun   [L] - Devil Bringer   [Space] - Jump\r\n[Shift] - Lock-on   [I] - Exceed   [O] - Devil Trigger   [U] - Taunt   [Esc] - Pause\r\n\r\nThis party is getting crazy. Five missions, five bosses.' }
            }
          };
        }
        if (!gmInstalled.includes('hl2') && games.children['HL2']) {
          delete games.children['HL2'];
        } else if (gmInstalled.includes('hl2') && !games.children['HL2']) {
          games.children['HL2'] = {
            type: 'folder', name: 'HL2', icon: 'folder', children: {
              'HL2.EXE': { type: 'executable', name: 'HL2.EXE', icon: 'hl2', app: 'hl2' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Half-Life 2 - 2000 Edition\r\n==================================\r\nValve Software (2000) - Win 98 Edition\r\n\r\n[W/A/S/D] - Move   [Mouse] - Look   [LMB]/[RMB] - Fire / Alt fire   [E] - Use\r\n[Space] - Jump   [C] - Crouch   [Shift] - Sprint   [F] - Flashlight   [G] - Squad\r\n[1-6] - Weapons   [F6]/[F9] - Quick save/load   [Esc] - Menu\r\n\r\nWake up, Mr. Freeman.' }
            }
          };
        }
        if (!gmInstalled.includes('gta90') && games.children['GTA90']) {
          delete games.children['GTA90'];
        } else if (gmInstalled.includes('gta90') && !games.children['GTA90']) {
          games.children['GTA90'] = {
            type: 'folder', name: 'GTA90', icon: 'folder', children: {
              'GTA90.EXE': { type: 'executable', name: 'GTA90.EXE', icon: 'gta90', app: 'gta90' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: "Grand Theft Auto: Yekaterinburg '90\r\n==================================\r\nDMA Design (1997) - Win 98 Edition\r\n\r\n[Arrows] - Drive / Walk   [Space] - Handbrake / Fire   [Ctrl] - Fire   [Enter] - Car in / out\r\n[R] - Radio   [T] - Taxi job   [M] - Map   [Esc] - Pause\r\n\r\nSverdlovsk, autumn 1990. Answer the payphones. Earn the chapter target." }
            }
          };
        }
        if (!gmInstalled.includes('kotor98') && games.children['KOTOR98']) {
          delete games.children['KOTOR98'];
        } else if (gmInstalled.includes('kotor98') && !games.children['KOTOR98']) {
          games.children['KOTOR98'] = {
            type: 'folder', name: 'KOTOR98', icon: 'folder', children: {
              'KOTOR.EXE': { type: 'executable', name: 'KOTOR.EXE', icon: 'kotor98', app: 'kotor98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Star Wars: Knights of the Old Republic 98 - Taris\r\n==================================\r\nBioWare / LucasArts (1999) - Win 98 Edition\r\n\r\n[Left Click] - Move / Attack / Talk / Use   [W/A/S/D] - Move   [Space] - Pause\r\n[Tab] - Switch leader   [U/I/C/K/J/M/P/L] - Panels   [F5]/[F9] - Quick save/load\r\n\r\nFind Bastila Shan and escape Taris aboard the Ebon Hawk.' }
            }
          };
        }
        if (!gmInstalled.includes('hsr98') && games.children['StarRail98']) {
          delete games.children['StarRail98'];
        } else if (gmInstalled.includes('hsr98') && !games.children['StarRail98']) {
          games.children['StarRail98'] = {
            type: 'folder', name: 'StarRail98', icon: 'folder', children: {
              'STARRAIL.EXE': { type: 'executable', name: 'STARRAIL.EXE', icon: 'hsr98', app: 'hsr98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Honkai: Star Rail 98 - Jarilo-VI Edition\r\n==================================\r\nmiHoYo (1999) - Win 98 Edition\r\n\r\nControls:\r\n[W/A/S/D]/[Arrows] - Move   [Shift] - Walk   [Space]/[Enter] - Talk / Use\r\n[F] - Attack on the map (first strike)   [E] - Technique   [1-4] - Leader   [Esc] - Menu\r\nBattle: [Q] Basic ATK   [E] Skill   [1-4] Ultimate   [T] Contact   [R] Fusion   [V] Auto\r\n\r\nHerta Space Station, the Astral Express and Jarilo-VI up to Cocolia.\r\nSave at Space Anchors. Spread rumors to make them true.' }
            }
          };
        }

        if (!gmInstalled.includes('stalker98') && games.children['Stalker98']) {
          delete games.children['Stalker98'];
        } else if (gmInstalled.includes('stalker98') && !games.children['Stalker98']) {
          games.children['Stalker98'] = {
            type: 'folder', name: 'Stalker98', icon: 'folder', children: {
              'XR98.EXE': { type: 'executable', name: 'XR98.EXE', icon: 'stalker98', app: 'stalker98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'S.T.A.L.K.E.R. 98: Shadow of Chernobyl\r\n==================================\r\nGSC Game World (2000) - fan remake for Win 98\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Aim\r\n[Shift] - Sprint   [Ctrl]/[C] - Crouch   [Space] - Jump   [Q]/[E] - Lean\r\n[R] - Reload   [B] - Fire mode   [1-6] - Knife, pistol, rifle, grenade, binoculars, bolt\r\n[F] - Talk / Search / Pick up   [I] - Inventory   [P]/[Tab] - PDA   [M] - Map   [L] - Flashlight\r\n[F1-F4] - Medkit, bandage, anti-rad, food   [F6]/[F7] - Quick save/load   [Esc] - Menu\r\n\r\nLevels: Cordon, Garbage. Find Strelok.\r\nThe text quest STALKER.EXE is a different game.' }
            }
          };
        }

        if (!gmInstalled.includes('lol') && games.children['LoL']) {
          delete games.children['LoL'];
        } else if (gmInstalled.includes('lol') && !games.children['LoL']) {
          games.children['LoL'] = {
            type: 'folder', name: 'LoL', icon: 'folder', children: {
              'LOL.EXE': { type: 'executable', name: 'LOL.EXE', icon: 'lol', app: 'lol' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'League of Legends 98\r\n==================================\r\nRiot Games (1999) - fan edition for Win 98\r\n\r\nControls:\r\n[Right Click] - Move / Attack   [A + Left Click] - Attack-move   [S] - Stop\r\n[Q/W/E/R] - Abilities   [Ctrl+Q/W/E/R] - Learn ability   [D/F] - Summoner spells\r\n[1-6] - Items   [B] - Recall   [P] - Shop   [Tab] - Scoreboard\r\n[Y] - Lock camera   [Space] - Center camera   [Enter] - Chat   [Esc] - Menu\r\n\r\n10 champions: Lulu, Jinx, Garen, Annie, Ashe, Master Yi,\r\nMalphite, Teemo, Ryze, Alistar. 5v5 vs bots on the Rift.\r\nChat cheats: /gold 1000, /level, /win' }
            }
          };
        }

        if (!gmInstalled.includes('avatar98') && games.children['Avatar98']) {
          delete games.children['Avatar98'];
        } else if (gmInstalled.includes('avatar98') && !games.children['Avatar98']) {
          games.children['Avatar98'] = {
            type: 'folder', name: 'Avatar98', icon: 'folder', children: {
              'SILENT.EXE': { type: 'executable', name: 'SILENT.EXE', icon: 'avatar98', app: 'avatar98' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Аватар: Тихий цикл (демо, Глава 1)\r\n==================================\r\nСтудия «Кузница» (1999)\r\n\r\n[Стрелки/WASD] - ходьба  [Shift] - бег  [Z/Enter] - действие\r\n[X/Esc] - отмена  [C] - меню  [V] - радио\r\nСохранение - у святилищ. Экспорт .SAV пишется в «Мои документы».' }
            }
          };
        }

        if (!gmInstalled.includes('dota') && games.children['Dota']) {
          delete games.children['Dota'];
        } else if (gmInstalled.includes('dota') && !games.children['Dota']) {
          games.children['Dota'] = {
            type: 'folder', name: 'Dota', icon: 'folder', children: {
              'DOTA.EXE': { type: 'executable', name: 'DOTA.EXE', icon: 'dota', app: 'dota' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Dota 98\r\n==================================\r\nValve & IceFrog (1999) - fan edition for Win 98\r\n\r\nControls:\r\n[Right Click] - Move / Attack / Deny / Pick up   [A + Left Click] - Attack-move   [S] - Stop   [H] - Hold\r\n[Q/W/E/R/D] - Abilities   [Ctrl+Q/W/E/R] - Learn   [U] - Talents   [Z X C V B N] - Items   [T] - Town Portal\r\n[F3] - Courier   [F4] - Shop   [Tab] - Scoreboard   [Space] - Center camera   [Enter] - Chat   [Esc] - Menu\r\n\r\n10 heroes: Techies, Enigma, Sven, Crystal Maiden, Sniper,\r\nAxe, Lina, Juggernaut, Pudge, Lion. 5v5 vs bots.\r\nLobby cheats: -gold 5000, -lvlup 5, -refresh, -wtf' }
            }
          };
        }

        if (!gmInstalled.includes('diablo') && games.children['Diablo']) {
          delete games.children['Diablo'];
        } else if (gmInstalled.includes('diablo') && !games.children['Diablo']) {
          games.children['Diablo'] = {
            type: 'folder', name: 'Diablo', icon: 'folder', children: {
              'DIABLO.EXE': { type: 'executable', name: 'DIABLO.EXE', icon: 'diablo', app: 'diablo' },
              'README.TXT': { type: 'file', name: 'README.TXT', icon: 'notepad', app: 'notepad', content: 'Diablo\r\n==================================\r\nBlizzard North (1996)\r\n\r\nControls:\r\n[Left Click] - Move / Attack / Talk / Pick up\r\n[Shift + Click] - Attack in place\r\n[Right Click] - Cast current spell\r\n[I] Inventory  [C] Character  [B] Spellbook  [Q] Quests\r\n[S] Spell select, [F5-F8] Spell hotkeys\r\n[1-8] Belt  [Tab] Automap  [Alt] Item labels  [Esc] Menu' }
            }
          };
        }
        this.saveToStorage();
      }

      const cp = this.resolvePath(['My Computer', 'Control Panel']);
      if (cp && cp.children) {
        if (!cp.children['Regional']) {
          cp.children['Regional'] = { type: 'action', name: 'Regional Settings', icon: 'regional', action: 'regional-settings' };
        }
        if (!cp.children['Date/Time']) {
          cp.children['Date/Time'] = { type: 'action', name: 'Date/Time', icon: 'timedate', action: 'timedate-properties' };
        }
        if (!cp.children['System']) {
          cp.children['System'] = { type: 'action', name: 'System', icon: 'system', action: 'system-properties' };
        }
        if (!cp.children['Mouse']) {
          cp.children['Mouse'] = { type: 'action', name: 'Mouse', icon: 'mouse', action: 'mouse-properties' };
        }
        if (!cp.children['Multimedia']) {
          cp.children['Multimedia'] = { type: 'action', name: 'Multimedia', icon: 'multimedia', action: 'multimedia-properties' };
        }
        if (!cp.children['Add/Remove Programs']) {
          cp.children['Add/Remove Programs'] = { type: 'action', name: 'Add/Remove Programs', icon: 'appwiz', action: 'appwiz-properties' };
        }
        if (!cp.children['Internet']) {
          cp.children['Internet'] = { type: 'action', name: 'Internet Options', icon: 'inetcpl', action: 'internet-properties' };
        }
        this.saveToStorage();
      }

      const winDir = this.resolvePath(['My Computer', 'C:', 'WINDOWS']);
      if (winDir && winDir.children) {
        if (!winDir.children['MSCONFIG.EXE']) {
          winDir.children['MSCONFIG.EXE'] = { type: 'executable', name: 'MSCONFIG.EXE', icon: 'msconfig', app: 'msconfig' };
        }
        if (!winDir.children['DXDIAG.EXE']) {
          winDir.children['DXDIAG.EXE'] = { type: 'executable', name: 'DXDIAG.EXE', icon: 'dxdiag', app: 'dxdiag' };
        }
        if (!winDir.children['SYSEDIT.EXE']) {
          winDir.children['SYSEDIT.EXE'] = { type: 'executable', name: 'SYSEDIT.EXE', icon: 'sysedit', app: 'sysedit' };
        }
        if (!winDir.children['CHARMAP.EXE']) {
          winDir.children['CHARMAP.EXE'] = { type: 'executable', name: 'CHARMAP.EXE', icon: 'charmap', app: 'charmap' };
        }
        if (!winDir.children['SCANDISK.EXE']) {
          winDir.children['SCANDISK.EXE'] = { type: 'executable', name: 'SCANDISK.EXE', icon: 'scandisk', app: 'scandisk' };
        }
        if (!winDir.children['SNDVOL32.EXE']) {
          winDir.children['SNDVOL32.EXE'] = { type: 'executable', name: 'SNDVOL32.EXE', icon: 'volume-mixer', app: 'sndvol32' };
        }
        if (!winDir.children['CLEANMGR.EXE']) {
          winDir.children['CLEANMGR.EXE'] = { type: 'executable', name: 'CLEANMGR.EXE', icon: 'cleanmgr', app: 'cleanmgr' };
        }
        if (!winDir.children['COMMAND.COM']) {
          winDir.children['COMMAND.COM'] = { type: 'executable', name: 'COMMAND.COM', icon: 'dos-prompt', app: 'command' };
        }
        if (!winDir.children['SYSTEM.INI']) {
          winDir.children['SYSTEM.INI'] = { type: 'file', name: 'SYSTEM.INI', icon: 'file-txt', content: '[boot]\r\nshell=Explorer.exe\r\nsystem.drv=system.drv\r\ndrivers=mmsystem.dll\r\n\r\n[386Enh]\r\nmouse=*vmouse\r\nnetwork=*vnetbios' };
        }
        this.saveToStorage();
      }

      const cRoot = this.resolvePath(['My Computer', 'C:']);
      if (cRoot && cRoot.children) {
        if (!cRoot.children['AUTOEXEC.BAT']) {
          cRoot.children['AUTOEXEC.BAT'] = { type: 'file', name: 'AUTOEXEC.BAT', icon: 'file-txt', content: '@ECHO OFF\r\nPROMPT $p$g\r\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\r\nSET TEMP=C:\\TEMP\r\nSET BLASTER=A220 I5 D1 T4' };
        }
        if (!cRoot.children['CONFIG.SYS']) {
          cRoot.children['CONFIG.SYS'] = { type: 'file', name: 'CONFIG.SYS', icon: 'file-txt', content: 'DEVICE=C:\\WINDOWS\\HIMEM.SYS\r\nDOS=HIGH,UMB\r\nFILES=40\r\nBUFFERS=30' };
        }
        this.saveToStorage();
      }

      if (this.root && this.root.children && this.root.children['Киномания 98.url']) {
        delete this.root.children['Киномания 98.url'];
        this.saveToStorage();
      }

      const dDrive = this.resolvePath(['My Computer', 'D:']);
      if (dDrive) {
        dDrive.driveType = 'cdrom';
        if (this.cdRomState && this.cdRomState.inserted) {
          if (this.cdRomState.discId === 'office_games_98') {
            dDrive.name = 'Офисные игры ’98 (D:)';
            dDrive.icon = 'drive-cd';
            if (!dDrive.children || !dDrive.children['LAUNCHER.EXE']) {
              dDrive.children = this.getOfficeGamesCdTree();
              this.saveToStorage();
            }
          } else {
            dDrive.name = 'Игромания (D:)';
            dDrive.icon = 'drive-cd';
            if (!dDrive.children || !dDrive.children['igroman.exe']) {
              dDrive.children = this.getIgromaniaCdTree();
              this.saveToStorage();
            } else {
              let changed = false;
              if (dDrive.children['demo'] && dDrive.children['demo'].children) {
                const demoFiles = dDrive.children['demo'].children;
                if (demoFiles['nhl98demo.exe'] && demoFiles['nhl98demo.exe'].gameId !== 'hockey') {
                  demoFiles['nhl98demo.exe'].gameId = 'hockey';
                  demoFiles['nhl98demo.exe'].icon = 'setup-installer';
                  changed = true;
                }
              }
              if (dDrive.children['video'] && dDrive.children['video'].children) {
                const vids = dDrive.children['video'].children;
                const updated = this.getIgromaniaCdTree().video.children;
                for (const [k, v] of Object.entries(updated)) {
                  if (!vids[k] || vids[k].content !== v.content) {
                    vids[k] = v;
                    changed = true;
                  }
                }
              }
              if (changed) this.saveToStorage();
            }
          }
        }
      }
    } catch (e) {
      console.warn('ensureIntegrity error:', e);
    }
  }

  isCdRomInserted(drive = 'D:') {
    return !!(this.cdRomState && this.cdRomState.inserted);
  }

  ejectCdRom(drive = 'D:') {
    this.cdRomState = {
      inserted: false,
      discId: null,
      label: 'Компакт-диск (D:)',
      volumeLabel: ''
    };
    try {
      localStorage.setItem(this.cdRomStorageKey, JSON.stringify(this.cdRomState));
    } catch (e) {}
    const dDrive = this.resolvePath(['My Computer', 'D:']);
    if (dDrive) {
      dDrive.name = 'Компакт-диск (D:)';
      dDrive.icon = 'drive-cd-empty';
      dDrive.children = {};
      this.saveToStorage();
    }
    if (window.soundSys) {
      window.soundSys.playCdEject();
    }
    if (window.appExplorer && window.winManager && window.winManager.windows.has('app_explorer')) {
      const expWin = window.winManager.windows.get('app_explorer');
      window.appExplorer.renderFolder(expWin);
    }
    if (window.taskbar && window.taskbar.updateCdRomTray) {
      window.taskbar.updateCdRomTray();
    }
    if (window.desktop && window.desktop.render) {
      window.desktop.render();
    }
  }

  insertCdRom(drive = 'D:', discId = 'igromania_09_1998') {
    if (discId === 'office_games_98') {
      this.cdRomState = {
        inserted: true,
        discId: 'office_games_98',
        label: 'Офисные игры ’98 (D:)',
        volumeLabel: 'OFFICE_GAMES_98'
      };
    } else {
      this.cdRomState = {
        inserted: true,
        discId: 'igromania_09_1998',
        label: 'Игромания (D:)',
        volumeLabel: 'ИГРОМАНИЯ_09_98'
      };
    }
    try {
      localStorage.setItem(this.cdRomStorageKey, JSON.stringify(this.cdRomState));
    } catch (e) {}
    const dDrive = this.resolvePath(['My Computer', 'D:']);
    if (dDrive) {
      dDrive.name = this.cdRomState.label;
      dDrive.icon = 'drive-cd';
      dDrive.children = discId === 'office_games_98' ? this.getOfficeGamesCdTree() : this.getIgromaniaCdTree();
      this.saveToStorage();
    }
    if (window.soundSys) {
      window.soundSys.playCdSpinUp();
    }
    if (window.appExplorer && window.winManager && window.winManager.windows.has('app_explorer')) {
      const expWin = window.winManager.windows.get('app_explorer');
      window.appExplorer.renderFolder(expWin);
    }
    if (window.taskbar && window.taskbar.updateCdRomTray) {
      window.taskbar.updateCdRomTray();
    }
    if (window.desktop && window.desktop.render) {
      window.desktop.render();
    }
  }

  getOfficeGamesCdTree() {
    return {
      'AUTORUN.INF': {
        type: 'file',
        name: 'AUTORUN.INF',
        icon: 'file-txt',
        content: '[autorun]\r\nopen=LAUNCHER.EXE\r\nicon=LAUNCHER.EXE,0\r\n'
      },
      'LAUNCHER.EXE': {
        type: 'executable',
        name: 'LAUNCHER.EXE',
        icon: 'game-manager',
        app: 'office_launcher',
        content: 'Сборник лучших офисных игр 1998 года'
      },
      'README.TXT': {
        type: 'file',
        name: 'README.TXT',
        icon: 'file-txt',
        content: '================================================================\r\n   СБОРНИК: ЛУЧШИЕ ИГРЫ ДЛЯ ОФИСА \'98 (Золотая коллекция)\r\n================================================================\r\n\r\nВ сборник вошли захватывающие офисные игры:\r\n1. ЗМЕЙКА В 3D (GAMES\\SNAKE3D\\SNAKE3D.EXE)\r\n2. ОФИСНЫЙ АРКАНОИД (GAMES\\ARKANOID\\ARKANOID.EXE)\r\n3. ПОБЕГ В 18:00 (GAMES\\PLATFORM\\OFFICERUN.EXE)\r\n4. ОФИСНЫЙ ТИР (GAMES\\SHOOTER\\MOORHUNT.EXE)\r\n5. ТРИ В РЯД (GAMES\\MATCH3\\GEMS98.EXE)\r\n6. ЦВЕТНЫЕ ЛИНИИ 98 (GAMES\\LINES98\\LINES98.EXE)\r\n7. ОФИСНЫЙ ТЕТРИС (GAMES\\TETRIS\\TETRIS.EXE)\r\n8. ГОНКИ НА КРЕСЛАХ (GAMES\\CHAIRS\\CHAIRS.EXE)\r\n\r\nВНИМАНИЕ!\r\nПри приближении руководства немедленно нажимайте клавишу F12\r\n(ТРЕВОЖНАЯ КНОПКА BOSS KEY).\r\n'
      },
      'GAMES': {
        type: 'folder',
        name: 'GAMES',
        icon: 'folder',
        children: {
          'SNAKE3D': {
            type: 'folder',
            name: 'SNAKE3D',
            icon: 'folder',
            children: {
              'SNAKE3D.EXE': {
                type: 'executable',
                name: 'SNAKE3D.EXE',
                icon: 'file-exe',
                app: 'og_snake3d',
                content: '3D Змейка'
              }
            }
          },
          'ARKANOID': {
            type: 'folder',
            name: 'ARKANOID',
            icon: 'folder',
            children: {
              'ARKANOID.EXE': {
                type: 'executable',
                name: 'ARKANOID.EXE',
                icon: 'file-exe',
                app: 'og_arkanoid',
                content: 'Офисный Арканоид'
              }
            }
          },
          'PLATFORM': {
            type: 'folder',
            name: 'PLATFORM',
            icon: 'folder',
            children: {
              'OFFICERUN.EXE': {
                type: 'executable',
                name: 'OFFICERUN.EXE',
                icon: 'file-exe',
                app: 'og_rush',
                content: 'Побег в 18:00'
              }
            }
          },
          'SHOOTER': {
            type: 'folder',
            name: 'SHOOTER',
            icon: 'folder',
            children: {
              'MOORHUNT.EXE': {
                type: 'executable',
                name: 'MOORHUNT.EXE',
                icon: 'file-exe',
                app: 'og_hunt',
                content: 'Офисный Тир'
              }
            }
          },
          'MATCH3': {
            type: 'folder',
            name: 'MATCH3',
            icon: 'folder',
            children: {
              'GEMS98.EXE': {
                type: 'executable',
                name: 'GEMS98.EXE',
                icon: 'file-exe',
                app: 'og_gems',
                content: 'Офисные Самоцветы'
              }
            }
          },
          'LINES98': {
            type: 'folder',
            name: 'LINES98',
            icon: 'folder',
            children: {
              'LINES98.EXE': {
                type: 'executable',
                name: 'LINES98.EXE',
                icon: 'file-exe',
                app: 'og_lines',
                content: 'Цветные Линии 98'
              }
            }
          },
          'TETRIS': {
            type: 'folder',
            name: 'TETRIS',
            icon: 'folder',
            children: {
              'TETRIS.EXE': {
                type: 'executable',
                name: 'TETRIS.EXE',
                icon: 'file-exe',
                app: 'og_tetris',
                content: 'Офисный Тетрис'
              }
            }
          },
          'CHAIRS': {
            type: 'folder',
            name: 'CHAIRS',
            icon: 'folder',
            children: {
              'CHAIRS.EXE': {
                type: 'executable',
                name: 'CHAIRS.EXE',
                icon: 'file-exe',
                app: 'og_chairs',
                content: 'Гонки на креслах'
              }
            }
          }
        }
      }
    };
  }

  getIgromaniaCdTree() {
    return {
      'AUTORUN.INF': {
        type: 'file',
        name: 'AUTORUN.INF',
        icon: 'file-txt',
        content: '[autorun]\r\nopen=igroman.exe\r\n'
      },
      'igroman.exe': {
        type: 'executable',
        name: 'igroman.exe',
        icon: 'igroman',
        app: 'igroman',
        content: 'Электронный журнал «Игромания» — Сентябрь 1998 года'
      },
      'bc3k': {
        type: 'folder',
        name: 'bc3k',
        icon: 'folder',
        children: {
          'bc3k.exe': { type: 'executable', name: 'bc3k.exe', icon: 'file-exe', app: 'setup', content: 'Battlecruiser 3000AD Full Game' },
          'bc3k104b.exe': { type: 'executable', name: 'bc3k104b.exe', icon: 'file-exe', app: 'setup', content: 'Battlecruiser 3000AD Patch 1.04b' },
          'ar32e301.exe': { type: 'executable', name: 'ar32e301.exe', icon: 'file-exe', app: 'setup', content: 'Adobe Acrobat Reader 3.01 Installer' }
        }
      },
      'demo': {
        type: 'folder',
        name: 'demo',
        icon: 'folder',
        children: {
          'pipe.exe': { type: 'executable', name: 'pipe.exe', icon: 'file-exe', app: 'setup', content: 'Полная Труба (Демо-версия квеста Никита)' },
          'sin_demo.exe': { type: 'executable', name: 'sin_demo.exe', icon: 'file-exe', app: 'setup', content: 'SiN 3D Action Demo (Activision)' },
          'kknd2_demoall.exe': { type: 'executable', name: 'kknd2_demoall.exe', icon: 'file-exe', app: 'setup', content: 'KKnD 2: Krossfire RTS Demo' },
          'crocdem6.exe': { type: 'executable', name: 'crocdem6.exe', icon: 'file-exe', app: 'setup', content: 'Croc: Legend of the Gobbos Demo' },
          'addictiondemo.exe': { type: 'executable', name: 'addictiondemo.exe', icon: 'file-exe', app: 'setup', content: 'Addiction Pinball Demo (Team17)' },
          'burndemo.exe': { type: 'executable', name: 'burndemo.exe', icon: 'setup-installer', app: 'setup', gameId: 'burnout', content: 'Burnout Championship Drag Racing Demo Installer' },
          'demour-nointro.exe': { type: 'executable', name: 'demour-nointro.exe', icon: 'file-exe', app: 'setup', content: 'Ultim@te Race Pro Demo (MicroProse)' },
          'lb2demo.exe': { type: 'executable', name: 'lb2demo.exe', icon: 'file-exe', app: 'setup', content: 'Jane\'s Longbow 2 Helicopter Demo' },
          'nhl98demo.exe': { type: 'executable', name: 'nhl98demo.exe', icon: 'setup-installer', app: 'setup', gameId: 'hockey', content: 'EA Sports NHL 98 Demo Installer' },
          'worldcup98.exe': { type: 'executable', name: 'worldcup98.exe', icon: 'file-exe', app: 'setup', content: 'EA Sports World Cup 98 Demo' },
          'msgolf98.exe': { type: 'executable', name: 'msgolf98.exe', icon: 'file-exe', app: 'setup', content: 'Microslop Golf 1998 Edition Demo' },
          'nic_demo.exe': { type: 'executable', name: 'nic_demo.exe', icon: 'file-exe', app: 'setup', content: 'Nightmare Creatures Demo (Activision)' },
          'pcdemo.exe': { type: 'executable', name: 'pcdemo.exe', icon: 'file-exe', app: 'setup', content: 'Panzer Commander Tank Sim Demo' },
          'kopinst.exe': { type: 'executable', name: 'kopinst.exe', icon: 'file-exe', app: 'setup', content: 'Neophyte: Koplio\'s Story Demo' },
          'smgdemo_c.exe': { type: 'executable', name: 'smgdemo_c.exe', icon: 'file-exe', app: 'setup', content: 'Sid Meier\'s Gettysburg! (Северяне)' },
          'smgdemo_u.exe': { type: 'executable', name: 'smgdemo_u.exe', icon: 'file-exe', app: 'setup', content: 'Sid Meier\'s Gettysburg! (Южане)' },
          'wargames': {
            type: 'folder',
            name: 'wargames',
            icon: 'folder',
            children: {
              'SETUP.EXE': { type: 'executable', name: 'SETUP.EXE', icon: 'setup-installer', app: 'setup', content: 'WarGames: Defcon 1 Demo Setup' }
            }
          }
        }
      },
      'patch': {
        type: 'folder',
        name: 'patch',
        icon: 'folder',
        children: {
          'FALL11.exe': { type: 'executable', name: 'FALL11.exe', icon: 'file-exe', app: 'setup', content: 'Fallout v1.1 Update (Убирает второе ограничение по времени на Vault 13)' },
          'Descent2p.exe': { type: 'executable', name: 'Descent2p.exe', icon: 'file-exe', app: 'setup', content: 'Descent 2 3Dfx Voodoo Patch' },
          'Fs10x-uk.exe': { type: 'executable', name: 'Fs10x-uk.exe', icon: 'file-exe', app: 'setup', content: 'Descent: Freespace UK Patch' },
          'Fs10x-us.exe': { type: 'executable', name: 'Fs10x-us.exe', icon: 'file-exe', app: 'setup', content: 'Descent: Freespace US Patch' },
          'SOTE1_1.exe': { type: 'executable', name: 'SOTE1_1.exe', icon: 'file-exe', app: 'setup', content: 'Shadows of the Empire v1.1 Patch' },
          'RSUPD101.exe': { type: 'executable', name: 'RSUPD101.exe', icon: 'file-exe', app: 'setup', content: 'Star Wars: Rebellion v1.01 Patch' },
          'PATCH1_2.EXE': { type: 'executable', name: 'PATCH1_2.EXE', icon: 'file-exe', app: 'setup', content: 'Dark Reign: The Future of War v1.2' },
          'SK_P12.exe': { type: 'executable', name: 'SK_P12.exe', icon: 'file-exe', app: 'setup', content: 'Stonekeep v1.2 Patch' },
          'SUMM_12.exe': { type: 'executable', name: 'SUMM_12.exe', icon: 'file-exe', app: 'setup', content: 'The Summoning v1.2 Patch' },
          'WC4WIN95.exe': { type: 'executable', name: 'WC4WIN95.exe', icon: 'file-exe', app: 'setup', content: 'Wing Commander IV Win 95 Patch' },
          'WC4JOY.exe': { type: 'executable', name: 'WC4JOY.exe', icon: 'file-exe', app: 'setup', content: 'Wing Commander IV Joystick Patch' },
          'WCPVOOD2.exe': { type: 'executable', name: 'WCPVOOD2.exe', icon: 'file-exe', app: 'setup', content: 'Wing Commander: Prophecy Voodoo 2 Patch' },
          'TR_PENT.exe': { type: 'executable', name: 'TR_PENT.exe', icon: 'file-exe', app: 'setup', content: 'The Terminator: Rampage Pentium Patch' },
          'TFS_130.exe': { type: 'executable', name: 'TFS_130.exe', icon: 'file-exe', app: 'setup', content: 'The Terminator: Future Shock v1.30 US' },
          'TFS130UK.exe': { type: 'executable', name: 'TFS130UK.exe', icon: 'file-exe', app: 'setup', content: 'The Terminator: Future Shock v1.30 UK' },
          'SKY101.exe': { type: 'executable', name: 'SKY101.exe', icon: 'file-exe', app: 'setup', content: 'SKYNET: No Limits v1.01 Patch' },
          'bzpat131.exe': { type: 'executable', name: 'bzpat131.exe', icon: 'file-exe', app: 'setup', content: 'Battlezone v1.3.1 Patch' },
          'unrealpatch101.exe': { type: 'executable', name: 'unrealpatch101.exe', icon: 'file-exe', app: 'setup', content: 'Unreal v101 Patch' },
          'f15patch.exe': { type: 'executable', name: 'f15patch.exe', icon: 'file-exe', app: 'setup', content: 'F-15 Eagle Patch' },
          'max2p13.exe': { type: 'executable', name: 'max2p13.exe', icon: 'file-exe', app: 'setup', content: 'M.A.X. 2 v1.3 Patch' },
          'WETUP11.exe': { type: 'executable', name: 'WETUP11.exe', icon: 'file-exe', app: 'setup', content: 'Wetlands v1.1 Patch' },
          'Hgp187patch.exe': { type: 'executable', name: 'Hgp187patch.exe', icon: 'file-exe', app: 'setup', content: 'Heavy Gear v1.8.7 Patch' },
          'jkupd101.exe': { type: 'executable', name: 'jkupd101.exe', icon: 'file-exe', app: 'setup', content: 'Jedi Knight: Dark Forces II v1.01' },
          'P2PATCH.exe': { type: 'executable', name: 'P2PATCH.exe', icon: 'file-exe', app: 'setup', content: 'Privateer 2: The Darkening Patch' }
        }
      },
      'video': {
        type: 'folder',
        name: 'video',
        icon: 'folder-videos',
        children: {
          'ascension.avi': { type: 'file', name: 'ascension.avi', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/ascension.mp4' },
          'heretic.avi': { type: 'file', name: 'heretic.avi', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/heretic.mp4' },
          'metro20.avi': { type: 'file', name: 'metro20.avi', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/metro20.mp4' },
          'AVPRED.AVI': { type: 'file', name: 'AVPRED.AVI', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/AVPRED.mp4' },
          'TUROK2.AVI': { type: 'file', name: 'TUROK2.AVI', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/TUROK2.mp4' },
          'Blckstn.avi': { type: 'file', name: 'Blckstn.avi', icon: 'file-video', app: 'videoplayer', content: 'content/igromania/Blckstn.mp4' }
        }
      },
      'soft_int': {
        type: 'folder',
        name: 'soft_int',
        icon: 'folder',
        children: {
          'cc32r405.exe': { type: 'executable', name: 'cc32r405.exe', icon: 'file-exe', app: 'setup', content: 'Netscape Communicator 4.05 Russian' },
          'cc32e405.exe': { type: 'executable', name: 'cc32e405.exe', icon: 'file-exe', app: 'setup', content: 'Netscape Communicator 4.05 English' },
          'icq98a.exe': { type: 'executable', name: 'icq98a.exe', icon: 'file-exe', app: 'setup', content: 'Mirabilis ICQ98a Installer' },
          'the_bat.exe': { type: 'executable', name: 'the_bat.exe', icon: 'file-exe', app: 'setup', content: 'The Bat! 1.0 Email Client' },
          'windownload.exe': { type: 'executable', name: 'windownload.exe', icon: 'file-exe', app: 'setup', content: 'WinDownload 4.01' },
          'cppro.exe': { type: 'executable', name: 'cppro.exe', icon: 'file-exe', app: 'setup', content: 'ConnectionPal Professional' },
          'nm.exe': { type: 'executable', name: 'nm.exe', icon: 'file-exe', app: 'setup', content: 'Net.Medic' },
          'tank.wav': { type: 'file', name: 'tank.wav', icon: 'file-music', app: 'winamp', content: 'ИгроманияСентябрь1998CD/soft_int/tank.wav' },
          'ie401rus': {
            type: 'folder',
            name: 'ie401rus',
            icon: 'folder',
            children: {
              'IE4SETUP.EXE': { type: 'executable', name: 'IE4SETUP.EXE', icon: 'file-exe', app: 'setup', content: 'MS Internet Explorer 4.01 Russian Setup' }
            }
          },
          'ie401eng': {
            type: 'folder',
            name: 'ie401eng',
            icon: 'folder',
            children: {
              'IE4SETUP.EXE': { type: 'executable', name: 'IE4SETUP.EXE', icon: 'file-exe', app: 'setup', content: 'MS Internet Explorer 4.01 English Setup' }
            }
          }
        }
      },
      'soft_u': {
        type: 'folder',
        name: 'soft_u',
        icon: 'folder',
        children: {
          'acdc3223.exe': { type: 'executable', name: 'acdc3223.exe', icon: 'file-exe', app: 'setup', content: 'ACDSee 32 v2.23' },
          'iview283.exe': { type: 'executable', name: 'iview283.exe', icon: 'file-exe', app: 'setup', content: 'IrfanView 32 v2.83' },
          'wintn975_616.exe': { type: 'executable', name: 'wintn975_616.exe', icon: 'file-exe', app: 'setup', content: 'Wintune 97 for Win 95/NT' },
          'clibench.exe': { type: 'executable', name: 'clibench.exe', icon: 'file-exe', app: 'setup', content: 'CliBench MK II CPU & HDD Benchmark' },
          'mon_test.exe': { type: 'executable', name: 'mon_test.exe', icon: 'file-exe', app: 'setup', content: 'Nokia Monitor Tester' },
          'v95i319e.exe': { type: 'executable', name: 'v95i319e.exe', icon: 'file-exe', app: 'setup', content: 'McAfee VirusScan 3.19' },
          'tbw95807.exe': { type: 'executable', name: 'tbw95807.exe', icon: 'file-exe', app: 'setup', content: 'Thunderbyte Anti-Virus 8.07' },
          'dx6rus.exe': { type: 'executable', name: 'dx6rus.exe', icon: 'file-exe', app: 'setup', content: 'DirectX 6.0 Russian' },
          'dx6eng.exe': { type: 'executable', name: 'dx6eng.exe', icon: 'file-exe', app: 'setup', content: 'DirectX 6.0 English' },
          'winzip95.exe': { type: 'executable', name: 'winzip95.exe', icon: 'file-exe', app: 'setup', content: 'WinZip 6.3 for Win 95' },
          'pd98eval.exe': { type: 'executable', name: 'pd98eval.exe', icon: 'file-exe', app: 'setup', content: 'PowerDesk Utilities 98' }
        }
      },
      'winamp': {
        type: 'folder',
        name: 'winamp',
        icon: 'folder',
        children: {
          'Winamp192.exe': { type: 'executable', name: 'Winamp192.exe', icon: 'winamp', app: 'setup', gameId: 'winamp', content: 'Winamp 1.92 Setup' },
          'cdex014.exe': { type: 'executable', name: 'cdex014.exe', icon: 'file-exe', app: 'setup', content: 'CDex 0.14 Audio Ripper' },
          'skins': {
            type: 'folder',
            name: 'skins',
            icon: 'folder',
            children: {
              '_skins.html': { type: 'file', name: '_skins.html', icon: 'internet-explorer', app: 'ie', content: 'ИгроманияСентябрь1998CD/winamp/skins/_skins.html' }
            }
          },
          'plugins': {
            type: 'folder',
            name: 'plugins',
            icon: 'folder',
            children: {
              'for_3dfx': { type: 'folder', name: 'for_3dfx', icon: 'folder', children: {} }
            }
          }
        }
      }
    };
  }

  getCreditCardAndSitesDocContent() {
    return `================================================================
  ИНТЕРНЕТ-ССЫЛКИ, ПРОМОКОДЫ И ДАННЫЕ КАРТЫ ДЛЯ ПОКУПОК В СЕТИ
================================================================

[ ДАННЫЕ БАНКОВСКОЙ КАРТЫ (GOLD VISA 1998) ]
Тип карты:         Gold Visa CyberCard
Номер карты:       4276 3800 1998 2024
Срок действия:     12/28
Код безопасности:  777
Имя владельца:     RETRO USER
Баланс счета:      $500.00 USD

[ ДЕЙСТВУЮЩИЕ ПРОМОКОДЫ НА СКИДКУ 20% ]
Промокод 1:        WIN98SE
Промокод 2:        CYBER1998
* Введите в поле «Промокод» при оформлении заказа в магазинах
  Steam или SoftStore 98 для получения скидки 20%!

----------------------------------------------------------------
[ ПОЛНЫЙ КАТАЛОГ 14 САЙТОВ ДЛЯ INTERNET EXPLORER 5.0 ]
----------------------------------------------------------------

1. WebSeeker 98 (Поисковая система Интернета):
   http://www.search98.com
   - Быстрый полнотекстовый поиск веб-ресурсов, популярные запросы.

2. Рамблер '98 (Главная страница российского Интернета):
   http://www.rambler98.ru
   - Официальный курс ЦБ РФ (USD = 20.80 руб.), сводки погоды СНГ,
     интерактивный конвертер валют и рейтинг Top 100 сайтов Рунета.

3. Steam (Игры с доставкой по Сети):
   http://www.steampowered.com
   - Загрузите клиент Steam: в нём все игры, оплата картой и загрузка.
   - Wolfenstein 3D, DOOM 98, Half-Life 98, Diablo и другие.

4. SoftStore 98 (Каталог лицензионных программ):
   http://www.softstore98.com
   - WinZip 7.0, RetroAV 98 Pro, ActiveMovie Video Player, RetroShop 98,
     WinCommander 98 и Winamp Pro.

5. GamerZone Forum (Всероссийский форум геймеров):
   http://forum.games98.com
   - Восемь разделов и сорок с лишним тем: Steam по модему, читы и меню F7,
     «Нижний Сити», Fallout: Запорожье, Quake III, флейм Voodoo против TNT.
   - Новые темы и ответы, UBB-коды и смайлики. Регистрации нет.

6. Cyberspace Times (Ежедневная цифровая газета):
   http://www.retro-news98.com
   - 8 авторских статей (релиз Half-Life, суд RIAA против MP3, дефолт, Y2K).
   - Интерактивный опрос читателей с графиками и система комментариев.

7. Microslop Win 98 Web Portal (Официальный справочный портал):
   http://www.microslop.com
   - Каталог системных программ, справочник команд «Выполнить»,
     горячие клавиши и двуязычный форум поддержки сообщества.

8. MP3 Vault '98 (Цифровой архив музыки MP3):
   http://www.mp3vault98.com
   - Культовые треки: The Prodigy, The Offspring, Fatboy Slim, Сплин.
   - Прямая загрузка MP3 в папку «Моя музыка» и запуск в Winamp!

9. AntiVirus Lab 1998 (Лаборатория компьютерной безопасности):
   http://www.antivirus98.com
   - Оповещение об угрозах (totally_not_a_virus.exe, Чернобыль CIH).
   - Онлайн-сканирование диска C: с удалением вирусов и загрузка RetroCure.exe.

10. Anekdot.ru 1998 (Свежие анекдоты из России Дмитрия Вернера):
    http://www.anekdot98.ru
    - Золотой фонд юмора 90-х: модемы 56k, новые русские, Билл Гейтс и дефолт.
    - Голосование за шутки (+1 / -1), кнопка «Случайный анекдот», форма отправки.

11. Чат «Кроватка '98» (Главное место онлайн-общения):
    http://chat.krovatka98.ru
    - Комнаты «Разговоры», «Компьютерщики», «Флирт».
    - Живые пользователи онлайн, звуковые сигналы и автоматические реплики ботов.

12. GeoCities '98 (Каталог персональных домашних страниц):
    http://www.geocities.com
    - Кварталы SiliconValley, Area51, SunsetStrip, Tokyo.
    - Конструктор для публикации собственной странички со стилями оформления!

13. 3dfx Voodoo Zone & Hardware Overclockers:
    http://www.3dfx-zone.com
    - Интерактивный калькулятор FPS в играх 1998 года (CPU, GPU, разрешение).
    - Руководство по разгону Celeron 300A до 450 МГц на чипсете BX440.

14. Retro Web 1998 (Классический ретро-портал):
    http://www.retro-web.net
    - Домашняя страница энтузиастов Сети 90-х, аркада и гостевая книга.

15. WebCinema '98 (Всемирный видеоархив Всемирной Паутины):
    http://www.webcinema98.com
    - Видеоклипы и трейлеры: The Prodigy (концерт на Манежке 1997), Half-Life 1,
      Fallout 1 & 2, Berserk TV (1997), Another War.
    - Встроенный плеер ActiveMovie DirectShow, расчет времени загрузки по модемам 28.8k - 56k,
      интерактивная гостевая книга зрителей.

16. Киномания '98 (Главный портал кино, сериалов и КиноФорум Рунета):
    http://www.kinomania98.ru
    - Новости кино и сериалов (ноябрь 1998): тизер «Эпизода I», 6-й сезон
      The X-Files, «Сибирский цирюльник», касса США, цены на Горбушке.
    - КиноФорум, «Зрительский зал» с рецензиями читателей и страница редакции.

================================================================`;
  }

  getDefaultTree() {
    return {
      type: 'root',
      name: 'Desktop',
      children: {
        'My Computer': {
          type: 'special',
          name: 'My Computer',
          icon: 'my-computer',
          children: {
            'C:': {
              type: 'drive',
              name: '(C:)',
              icon: 'drive-c',
              children: {
                'WINDOWS': {
                  type: 'folder',
                  name: 'WINDOWS',
                  icon: 'folder',
                  children: {
                    'SYSTEM': { type: 'folder', name: 'SYSTEM', icon: 'folder', children: {} },
                    'MEDIA': {
                      type: 'folder',
                      name: 'MEDIA',
                      icon: 'folder-music',
                      children: {
                        'CANYON.MID': { type: 'file', name: 'CANYON.MID', icon: 'file-music', app: 'midi', content: '[MIDI Music: Canyon.mid Standard Win 98 Theme]' },
                        'PASSPORT.MID': { type: 'file', name: 'PASSPORT.MID', icon: 'file-music', app: 'midi', content: '[MIDI Music: Passport.mid Standard Win 98 Theme]' }
                      }
                    },
                    'NOTEPAD.EXE': { type: 'executable', name: 'NOTEPAD.EXE', icon: 'notepad', app: 'notepad' },
                    'WORDPAD.EXE': { type: 'executable', name: 'WORDPAD.EXE', icon: 'wordpad', app: 'wordpad' },
                    'WINRAR.EXE': { type: 'executable', name: 'WINRAR.EXE', icon: 'winrar', app: 'winrar' },
                    'AVP.EXE': { type: 'executable', name: 'AVP.EXE', icon: 'avp', app: 'avp' },
                    'RASPHONE.EXE': { type: 'executable', name: 'RASPHONE.EXE', icon: 'dialup', app: 'dialup' },
                    'FREECELL.EXE': { type: 'executable', name: 'FREECELL.EXE', icon: 'freecell', app: 'freecell' },
                    'NEKO.EXE': { type: 'executable', name: 'NEKO.EXE', icon: 'neko', app: 'neko' },
                    'KODAKIMG.EXE': { type: 'executable', name: 'KODAKIMG.EXE', icon: 'imaging', app: 'imaging' },
                    'MSCONFIG.EXE': { type: 'executable', name: 'MSCONFIG.EXE', icon: 'msconfig', app: 'msconfig' },
                    'DXDIAG.EXE': { type: 'executable', name: 'DXDIAG.EXE', icon: 'dxdiag', app: 'dxdiag' },
                    'SYSEDIT.EXE': { type: 'executable', name: 'SYSEDIT.EXE', icon: 'sysedit', app: 'sysedit' },
                    'CHARMAP.EXE': { type: 'executable', name: 'CHARMAP.EXE', icon: 'charmap', app: 'charmap' },
                    'SCANDISK.EXE': { type: 'executable', name: 'SCANDISK.EXE', icon: 'scandisk', app: 'scandisk' },
                    'SNDVOL32.EXE': { type: 'executable', name: 'SNDVOL32.EXE', icon: 'volume-mixer', app: 'sndvol32' },
                    'CLEANMGR.EXE': { type: 'executable', name: 'CLEANMGR.EXE', icon: 'cleanmgr', app: 'cleanmgr' },
                    'COMMAND.COM': { type: 'executable', name: 'COMMAND.COM', icon: 'dos-prompt', app: 'command' },
                    'WIN.INI': { type: 'file', name: 'WIN.INI', icon: 'file-txt', content: '[windows]\r\nload=\r\nrun=\r\nNullPort=None\r\nDeviceNotSelectedTimeout=15\r\nTransmissionRetryTimeout=45' },
                    'SYSTEM.INI': { type: 'file', name: 'SYSTEM.INI', icon: 'file-txt', content: '[boot]\r\nshell=Explorer.exe\r\nsystem.drv=system.drv\r\ndrivers=mmsystem.dll\r\n\r\n[386Enh]\r\nmouse=*vmouse\r\nnetwork=*vnetbios' },
                    'README.TXT': { type: 'file', name: 'README.TXT', icon: 'file-txt', content: 'Welcome to Microslop Win 98!\r\n\r\nThis is a nostalgic interactive web recreation.\r\nFeel free to explore, draw in Paint, calculate, or play Minesweeper.' }
                  }
                },
                'AUTOEXEC.BAT': { type: 'file', name: 'AUTOEXEC.BAT', icon: 'file-txt', content: '@ECHO OFF\r\nPROMPT $p$g\r\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\r\nSET TEMP=C:\\TEMP\r\nSET BLASTER=A220 I5 D1 T4' },
                'CONFIG.SYS': { type: 'file', name: 'CONFIG.SYS', icon: 'file-txt', content: 'DEVICE=C:\\WINDOWS\\HIMEM.SYS\r\nDOS=HIGH,UMB\r\nFILES=40\r\nBUFFERS=30' },
                'Program Files': {
                  type: 'folder',
                  name: 'Program Files',
                  icon: 'folder',
                  children: {
                    'Accessories': {
                      type: 'folder',
                      name: 'Accessories',
                      icon: 'folder',
                      children: {
                        'MSPAINT.EXE': { type: 'executable', name: 'MSPAINT.EXE', icon: 'paint', app: 'paint' },
                        'CALC.EXE': { type: 'executable', name: 'CALC.EXE', icon: 'calculator', app: 'calculator' },
                        'KODAKIMG.EXE': { type: 'executable', name: 'KODAKIMG.EXE', icon: 'imaging', app: 'imaging' }
                      }
                    },
                    'Internet Explorer': {
                      type: 'folder',
                      name: 'Internet Explorer',
                      icon: 'folder',
                      children: {
                        'IEXPLORE.EXE': { type: 'executable', name: 'IEXPLORE.EXE', icon: 'internet-explorer', app: 'ie' }
                      }
                    }
                  }
                },
                'My Documents': {
                  type: 'folder',
                  name: 'My Documents',
                  icon: 'my-documents',
                  children: {
                    'Downloads': {
                      type: 'folder',
                      name: 'Downloads',
                      icon: 'folder-downloads',
                      children: {}
                    },
                    'Мои рисунки': {
                      type: 'folder',
                      name: 'Мои рисунки',
                      icon: 'folder-pictures',
                      children: this.generateSamplePictures()
                    },
                    'Моя музыка': {
                      type: 'folder',
                      name: 'Моя музыка',
                      icon: 'folder-music',
                      children: {
                        'Loadsamoney.mp3': {
                          type: 'file',
                          name: 'Loadsamoney.mp3',
                          icon: 'file-music',
                          app: 'winamp',
                          content: 'content/music/Loadsamoney.mp3'
                        },
                        'Intro.mp3': {
                          type: 'file',
                          name: 'Intro.mp3',
                          icon: 'file-music',
                          app: 'winamp',
                          content: 'content/music/Intro.mp3'
                        }
                      }
                    },
                    'Мои видео': {
                      type: 'folder',
                      name: 'Мои видео',
                      icon: 'folder-videos',
                      children: {
                        '98.mp4': {
                          type: 'file',
                          name: '98.mp4',
                          icon: 'file-video',
                          app: 'videoplayer',
                          content: 'content/video/98.mp4'
                        },
                        'DEMO_CLIP.AVI': {
                          type: 'file',
                          name: 'DEMO_CLIP.AVI',
                          icon: 'file-video',
                          app: 'videoplayer',
                          content: '[ActiveMovie Video Clip: 320x240 Cinepak 30fps]'
                        },
                        'WebCinema 98.url': {
                          type: 'file',
                          name: 'WebCinema 98.url',
                          icon: 'internet-explorer',
                          app: 'ie',
                          content: 'http://www.webcinema98.com'
                        }
                      }
                    },
                    'DEMO_CLIP.AVI': {
                      type: 'file',
                      name: 'DEMO_CLIP.AVI',
                      icon: 'file-video',
                      app: 'videoplayer',
                      content: '[ActiveMovie Video Clip: 320x240 Cinepak 30fps]'
                    },
                    'Банковская карта и сайты.txt': {
                      type: 'file',
                      name: 'Банковская карта и сайты.txt',
                      icon: 'file-txt',
                      content: this.getCreditCardAndSitesDocContent()
                    },
                    'Welcome.txt': {
                      type: 'file',
                      name: 'Welcome.txt',
                      icon: 'file-txt',
                      content: 'Welcome to your Win 98 PC!\r\n\r\nDouble-click any program on the desktop or open the Start menu.\r\nHave fun!'
                    },
                    'Secret Plans.txt': {
                      type: 'file',
                      name: 'Secret Plans.txt',
                      icon: 'file-txt',
                      content: 'Project Apollo 1998:\r\n1. Launch retro web browser.\r\n2. Solve Minesweeper in under 20 seconds.\r\n3. Enjoy dial-up nostalgia.'
                    },
                    'doom2_cheats.zip': {
                      type: 'file',
                      name: 'doom2_cheats.zip',
                      icon: 'file-zip',
                      app: 'winrar',
                      content: '[ZIP Archive: DOOM II Cheats and Walkthroughs]'
                    },
                    'Реферат по истории 1998.rtf': {
                      type: 'file',
                      name: 'Реферат по истории 1998.rtf',
                      icon: 'file-rtf',
                      app: 'wordpad',
                      content: '[RTF Document: Реферат по истории]'
                    }
                  }
                },
                'Games': {
                  type: 'folder',
                  name: 'Games',
                  icon: 'folder',
                  children: {
                    'WINMINE.EXE': { type: 'executable', name: 'WINMINE.EXE', icon: 'minesweeper', app: 'minesweeper' },
                    'FREECELL.EXE': { type: 'executable', name: 'FREECELL.EXE', icon: 'freecell', app: 'freecell' }
                  }
                },
                'Downloads': {
                  type: 'folder',
                  name: 'Downloads',
                  icon: 'folder',
                  children: {
                    'matrix_screensaver.rar': {
                      type: 'file',
                      name: 'matrix_screensaver.rar',
                      icon: 'file-rar',
                      app: 'winrar',
                      content: '[RAR Archive: Matrix Screensaver Installer]'
                    }
                  }
                },
                'Work': {
                  type: 'folder',
                  name: 'Work',
                  icon: 'folder',
                  children: {}
                }
              }
            },
            'D:': {
              type: 'drive',
              name: 'Игромания (D:)',
              icon: 'drive-cd',
              driveType: 'cdrom',
              children: this.getIgromaniaCdTree()
            },
            'Control Panel': {
              type: 'special',
              name: 'Control Panel',
              icon: 'control-panel',
              children: {
                'Display': { type: 'action', name: 'Display Properties', icon: 'monitor', action: 'display-properties' },
                'Regional': { type: 'action', name: 'Regional Settings', icon: 'regional', action: 'regional-settings' },
                'Date/Time': { type: 'action', name: 'Date/Time', icon: 'timedate', action: 'timedate-properties' },
                'System': { type: 'action', name: 'System', icon: 'system', action: 'system-properties' },
                'Mouse': { type: 'action', name: 'Mouse', icon: 'mouse', action: 'mouse-properties' },
                'Multimedia': { type: 'action', name: 'Multimedia', icon: 'multimedia', action: 'multimedia-properties' },
                'Add/Remove Programs': { type: 'action', name: 'Add/Remove Programs', icon: 'appwiz', action: 'appwiz-properties' },
                'Internet': { type: 'action', name: 'Internet Options', icon: 'inetcpl', action: 'internet-properties' }
              }
            }
          }
        },
        'Recycle Bin': {
          type: 'recycle',
          name: 'Recycle Bin',
          icon: 'recycle-bin',
          items: [
            {
              name: 'homework.txt',
              originalPath: 'C:\\My Documents\\homework.txt',
              date: '04/12/1998 14:22',
              size: '14 KB',
              type: 'file',
              icon: 'file-txt',
              app: 'notepad',
              content: this.getHomeworkDocContent()
            },
            {
              name: 'totally_not_a_virus.exe',
              originalPath: 'C:\\Downloads\\totally_not_a_virus.exe',
              date: '08/02/1998 01:15',
              size: '64 KB',
              type: 'executable',
              icon: 'file-virus',
              app: 'virus',
              content: 'Free smiley screensaver!'
            },
            {
              name: 'old_memes.bmp',
              originalPath: 'C:\\My Documents\\old_memes.bmp',
              date: '11/18/1998 18:40',
              size: '320 KB',
              type: 'file',
              icon: 'file-bmp',
              app: 'paint',
              content: 'all-your-base'
            },
            {
              name: 'budget_1998.xls',
              originalPath: 'C:\\Work\\budget_1998.xls',
              date: '12/31/1998 23:59',
              size: '42 KB',
              type: 'file',
              icon: 'file-xls',
              app: 'excel',
              content: 'budget_data'
            }
          ]
        }
      }
    };
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('VFS load failed', e);
    }
    return null;
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.root));
    } catch (e) {
      console.warn('VFS save failed', e);
    }
  }

  resolvePath(pathParts) {
    if (!pathParts || pathParts.length === 0) return this.root;
    if (pathParts[0] === 'Desktop' && !(this.root.children && this.root.children['Desktop'])) pathParts = pathParts.slice(1);
    let curr = this.root;
    for (const part of pathParts) {
      if (!curr) return null;
      if (curr.children && curr.children[part]) {
        curr = curr.children[part];
      } else if (curr.children) {
        const lower = part.toLowerCase();
        const found = Object.keys(curr.children).find(k => k.toLowerCase() === lower);
        if (found) {
          curr = curr.children[found];
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    return curr;
  }

  getNodeDisplayName(node, key = null) {
    if (!node) return '';
    if (!window.i18n) return node.name || key || '';
    const name = node.name || key || '';
    if (name === 'My Computer') return window.i18n.t('app.myComputer');
    if (name === 'Control Panel') return window.i18n.t('cpanel.title');
    if (name === 'My Documents') return window.i18n.t('app.myDocs');
    if (name === 'Recycle Bin') return window.i18n.t('bin.title');
    if (name === 'Display Properties' || key === 'Display') return window.i18n.t('disp.title');
    if (name === 'Regional Settings' || key === 'Regional') return window.i18n.t('cpanel.regionalName');
    if (name === 'Date/Time' || key === 'Date/Time') return window.i18n.t('cpanel.timedateName');
    if (name === 'System' || key === 'System') return window.i18n.t('cpanel.systemName');
    if (name === 'Mouse' || key === 'Mouse') return window.i18n.t('cpanel.mouseName');
    if (name === 'Multimedia' || key === 'Multimedia') return window.i18n.t('cpanel.multimediaName');
    if (name === 'Add/Remove Programs' || key === 'Add/Remove Programs') return window.i18n.t('cpanel.appwizName');
    if (name === 'Internet Options' || key === 'Internet') return window.i18n.t('cpanel.inetName');
    if (name === 'Accessories') return window.i18n.t('start.accessories');
    if (name === 'Games') return window.i18n.t('start.games');
    if (name === 'Downloads' || key === 'Downloads' || name === 'downloads' || key === 'downloads') return window.i18n.t('app.myDownloads');
    if (name === 'Мои рисунки' || key === 'Мои рисунки' || name === 'My Pictures' || key === 'My Pictures') return window.i18n.t('app.myPictures');
    if (name === 'Моя музыка' || key === 'Моя музыка' || name === 'My Music' || key === 'My Music') return window.i18n.t('app.myMusic');
    if (name === 'Мои видео' || key === 'Мои видео' || name === 'My Videos' || key === 'My Videos') return window.i18n.t('app.myVideos');
    if (name === 'Игромания (D:)' || key === 'Игромания (D:)') return window.i18n.t('cdrom.label');
    if (name === 'Офисные игры ’98 (D:)' || key === 'Офисные игры ’98 (D:)') return window.i18n.t('cdrom.officeLabel');
    if (name === 'Network Neighborhood' || key === 'Network Neighborhood' || name === 'Сетевое окружение' || key === 'Сетевое окружение') return window.i18n.t('app.network');
    return name;
  }

  list(pathParts) {
    const node = this.resolvePath(pathParts);
    if (!node || !node.children) return [];
    return Object.keys(node.children).map(key => ({
      key,
      ...node.children[key],
      displayName: this.getNodeDisplayName(node.children[key], key)
    }));
  }

  writeFile(pathParts, fileName, content) {
    const folderNode = this.resolvePath(pathParts);
    if (!folderNode || !folderNode.children) return false;

    let icon = 'file-txt';
    let app = null;
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.avi') || lower.endsWith('.mpg') || lower.endsWith('.wmv')) {
      icon = 'file-video';
      app = 'videoplayer';
    } else if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.mid')) {
      icon = 'file-audio';
      app = 'winamp';
    } else if (lower.endsWith('.wsz')) {
      icon = 'winamp';
      app = 'winamp';
    } else if (lower.endsWith('.bmp') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.gif')) {
      icon = 'file-bmp';
      app = 'paint';
    } else if (lower.endsWith('.rtf') || lower.endsWith('.doc') || lower.endsWith('.wri')) {
      icon = 'file-rtf';
      app = 'wordpad';
    } else if (lower.endsWith('.acs') || lower.endsWith('.act')) {
      icon = 'file-actor';
      app = 'actor';
    }

    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      folderNode.children[fileName] = {
        type: content.type || 'file',
        name: fileName,
        icon: content.icon || icon,
        ...(content.app || app ? { app: content.app || app } : {}),
        content: content.content || '',
        ...(content.action ? { action: content.action } : {})
      };
    } else {
      folderNode.children[fileName] = {
        type: 'file',
        name: fileName,
        icon: icon,
        ...(app ? { app } : {}),
        content: content
      };
    }

    this.saveToStorage();
    if (folderNode === this.root && typeof window !== 'undefined' && window.desktop && window.desktop.renderIcons) window.desktop.renderIcons();
    return true;
  }

  readFile(pathParts, fileName) {
    const folderNode = this.resolvePath(pathParts);
    if (!folderNode || !folderNode.children) return null;
    const file = folderNode.children[fileName];
    return file ? file.content : null;
  }

  getRecycleBinItems() {
    const bin = this.root.children['Recycle Bin'];
    return bin ? bin.items || [] : [];
  }

  emptyRecycleBin() {
    const bin = this.root.children['Recycle Bin'];
    if (bin) {
      const removed = (bin.items || []).slice();
      bin.items = [];
      bin.icon = 'recycle-bin-empty';
      this.saveToStorage();
      if (window.soundSys) window.soundSys.playRecycle();
      if (window.appClippy && window.appClippy.onRecycleBinEmptied) window.appClippy.onRecycleBinEmptied(removed);
      return true;
    }
    return false;
  }

  restoreRecycleBinItem(itemName, destinationMode = 'original') {
    const bin = this.root.children['Recycle Bin'];
    if (!bin || !bin.items) return { success: false, error: 'Bin not found' };

    const itemIndex = bin.items.findIndex(i => i.name === itemName);
    if (itemIndex === -1) return { success: false, error: 'Item not in bin' };

    const item = bin.items[itemIndex];

    let targetPathParts;
    let targetFolder;

    const norm = (item.originalPath || '').replace(/\//g, '\\');
    const parts = norm.split('\\').filter(Boolean);
    if (parts[0] === 'My Computer') parts.shift();
    if (destinationMode === 'desktop' || (parts.length === 2 && parts[0] === 'Desktop')) {
      targetPathParts = ['Desktop'];
      targetFolder = this.root;
    } else {
      const folderNames = parts.slice(0, -1);

      let curr = this.resolvePath(['My Computer']);
      if (!curr) curr = this.root;

      targetPathParts = ['My Computer'];
      for (const fName of folderNames) {
        targetPathParts.push(fName);
        if (!curr.children) curr.children = {};
        if (!curr.children[fName]) {
          curr.children[fName] = {
            type: fName.endsWith(':') ? 'drive' : 'folder',
            name: fName,
            icon: fName.endsWith(':') ? 'drive-c' : 'folder',
            children: {}
          };
        }
        curr = curr.children[fName];
      }
      targetFolder = curr;
    }

    if (!targetFolder.children) targetFolder.children = {};

    let restoredType = item.type || (item.name.endsWith('.exe') ? 'executable' : 'file');
    let restoredIcon = item.icon || (item.name.endsWith('.exe') ? 'file-exe' : 'file-txt');
    let restoredApp = item.app;
    if (!restoredApp) {
      if (item.name.endsWith('.exe')) restoredApp = 'virus';
      else if (item.name.endsWith('.bmp') || item.name.endsWith('.png') || item.name.endsWith('.jpg')) {
        restoredApp = 'imaging';
        restoredIcon = 'file-bmp';
      }
      else if (item.name.endsWith('.avi') || item.name.endsWith('.mp4') || item.name.endsWith('.mpg')) {
        restoredApp = 'videoplayer';
        restoredIcon = 'file-video';
      }
      else if (item.name.endsWith('.psd')) {
        restoredApp = 'photoshop';
        restoredIcon = 'file-psd';
      }
      else if (item.name.endsWith('.xls')) restoredApp = 'excel';
      else if (item.name.endsWith('.txt') || item.name.endsWith('.ini')) restoredApp = 'notepad';
    }

    targetFolder.children[item.name] = {
      type: restoredType,
      name: item.name,
      icon: restoredIcon,
      app: restoredApp,
      content: item.content || ''
    };

    bin.items.splice(itemIndex, 1);
    if (bin.items.length === 0) {
      bin.icon = 'recycle-bin-empty';
    }

    this.saveToStorage();

    if (window.soundSys && window.soundSys.playClick) {
      window.soundSys.playClick();
    }

    if (window.desktop && window.desktop.renderIcons) {
      window.desktop.renderIcons();
    }

    const fullPathStr = destinationMode === 'desktop'
      ? 'Desktop\\' + item.name
      : targetPathParts.slice(1).join('\\') + '\\' + item.name;

    return {
      success: true,
      item: targetFolder.children[item.name],
      targetPathParts,
      fullPathStr
    };
  }

  getDesktopItems() {
    const specialKeys = ['My Computer', 'Recycle Bin'];
    if (!this.root || !this.root.children) return [];
    return Object.keys(this.root.children)
      .filter(key => !specialKeys.includes(key))
      .map(key => ({
        key,
        ...this.root.children[key]
      }));
  }

  createFolder(pathParts, folderName) {
    const node = this.resolvePath(pathParts);
    if (!node || !node.children) return false;
    node.children[folderName] = {
      type: 'folder',
      name: folderName,
      icon: 'folder',
      children: {}
    };
    this.saveToStorage();
    return true;
  }

  deleteItem(pathParts, key, moveToBin = true) {
    const node = this.resolvePath(pathParts);
    if (!node || !node.children || !node.children[key]) return false;
    const item = node.children[key];

    if (moveToBin) {
      const bin = this.root.children['Recycle Bin'];
      if (bin) {
        if (!bin.items) bin.items = [];
        const now = new Date();
        const dateStr = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        const loc = pathParts.filter(part => part !== 'My Computer').join('\\') + '\\' + (item.name || key);
        bin.items.push({
          name: item.name || key,
          originalPath: loc,
          date: dateStr,
          size: item.size || '16 KB',
          content: item.content || '',
          icon: item.icon || 'file-txt',
          app: item.app || null,
          type: item.type || 'file'
        });
        bin.icon = 'recycle-bin';
      }
    }

    delete node.children[key];
    this.saveToStorage();
    if (window.desktop && window.desktop.renderIcons) window.desktop.renderIcons();
    if (moveToBin && window.appClippy && window.appClippy.onFileDeleted) window.appClippy.onFileDeleted(pathParts, item);
    return true;
  }

  renameItem(pathParts, oldKey, newName) {
    const node = this.resolvePath(pathParts);
    if (!node || !node.children || !node.children[oldKey]) return false;
    const item = node.children[oldKey];
    item.name = newName;
    delete node.children[oldKey];
    node.children[newName] = item;
    this.saveToStorage();
    if (window.desktop && window.desktop.renderIcons) window.desktop.renderIcons();
    return true;
  }
}

window.vfs = new VirtualFileSystem();
