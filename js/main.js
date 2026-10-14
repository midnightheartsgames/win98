document.addEventListener('DOMContentLoaded', () => {
  if (window.appDialogs && typeof window.appDialogs.applySavedDisplaySettings === 'function') {
    window.appDialogs.applySavedDisplaySettings();
  }

  const bootScreen = document.getElementById('boot-screen');
  const bootFooter = document.querySelector('.boot-footer');
  if (bootFooter && window.i18n) {
    bootFooter.textContent = window.i18n.t('boot.starting');
  }
  drawBootSky(document.querySelector('#boot-screen .boot-sky'));
  drawBootFlag(document.querySelector('#boot-screen .boot-flag'));

  const unlockAudio = () => {
    if (window.soundSys) {
      window.soundSys.ensureContext();
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };

  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  window.launchWindowsBootSequence = () => {
    const postScreen = document.getElementById('bios-post-screen');
    if (postScreen) {
      postScreen.classList.remove('active');
    }
    if (!bootScreen) return;
    bootScreen.style.display = 'flex';
    bootScreen.classList.remove('fade-out');

    setTimeout(() => {
      bootScreen.classList.add('fade-out');

      if (window.soundSys) {
        window.soundSys.playStartup();
      }

      setTimeout(() => {
        bootScreen.style.display = 'none';
      }, 600);
    }, 3200);
  };

  if (window.biosEngine && typeof window.biosEngine.startPost === 'function') {
    window.biosEngine.startPost(() => {
      window.launchWindowsBootSequence();
    });
  } else {
    window.launchWindowsBootSequence();
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'Escape') || e.key === 'Meta') {
      e.preventDefault();
      if (window.taskbar) {
        window.taskbar.toggleStartMenu();
      }
      return;
    }
    const desktopFocused = !window.winManager || !window.winManager.activeWindowId;
    if (e.key === 'F5') {
      e.preventDefault();
      if (desktopFocused && window.desktop) window.desktop.renderIcons();
    } else if (e.key === 'F1' && desktopFocused) {
      e.preventDefault();
      const clippy = window.appClippy;
      if (clippy && clippy.opt('respondF1') !== false && clippy.opt('enabled') !== false) clippy.ask();
      else if (window.appDialogs) window.appDialogs.openHelp();
    } else if (e.key === 'F3' && desktopFocused) {
      e.preventDefault();
      if (window.appFind) window.appFind.open();
    }
  });

  console.log('Microslop Win 98 Second Edition Web Clone Ready.');
});

function bootRng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function drawBootSky(canvas) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const rand = bootRng(98);

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b3a9c');
  sky.addColorStop(0.45, '#2f6ad8');
  sky.addColorStop(1, '#6a9ff0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const puff = (x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(0.6, `rgba(${color},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  for (let c = 0; c < 34; c++) {
    const cy = Math.pow(rand(), 0.7) * h * 1.05 - 10;
    const cx = rand() * (w + 60) - 30;
    const depth = cy / h;
    const spreadX = 25 + depth * 55 + rand() * 20;
    const spreadY = 5 + depth * 12;
    const count = 16 + Math.floor(depth * 20);
    for (let i = 0; i < count; i++) {
      const dx = (rand() + rand() - 1) * spreadX;
      const dy = (rand() + rand() - 1) * spreadY;
      const r = 5 + rand() * (8 + depth * 14);
      puff(cx + dx, cy + dy + r * 0.35, r * 1.1, '120,150,205', 0.28);
      puff(cx + dx, cy + dy - r * 0.15, r, '255,255,255', 0.26 + depth * 0.12);
    }
  }

  for (let i = 0; i < 60; i++) {
    puff(rand() * w, rand() * h * 0.35, 4 + rand() * 8, '255,255,255', 0.12);
  }
}

function drawBootFlag(svg) {
  if (!svg) return;
  const warp = (x, y) => {
    const t = x / 120;
    return [x, y + Math.sin(t * Math.PI * 1.6 + 0.4) * 7 - t * 6 + (y - 50) * t * 0.08];
  };
  const quad = (x0, y0, x1, y1, fill) => {
    const pts = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) pts.push(warp(x0 + (x1 - x0) * i / steps, y0));
    for (let i = steps; i >= 0; i--) pts.push(warp(x0 + (x1 - x0) * i / steps, y1));
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('') + 'Z';
    return `<path d="${d}" fill="${fill}" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>`;
  };

  const red = '#ff2a12';
  const green = '#23b024';
  const blue = '#1d4cff';
  const yellow = '#ffd400';
  let out = '';

  const trail = [[38, 8, 1], [26, 7, 0.85], [16, 6, 0.65], [8, 5, 0.45], [2, 4, 0.3]];
  trail.forEach(([x, s, o]) => {
    out += `<g opacity="${o}">${quad(x, 30 - s / 2, x + s, 30 + s / 2, red)}`;
    out += `${quad(x, 65 - s / 2, x + s, 65 + s / 2, blue)}</g>`;
  });

  const fx = 50, fy = 14, cell = 32, gap = 3;
  out += quad(fx, fy, fx + cell, fy + cell, red);
  out += quad(fx + cell + gap, fy, fx + cell * 2 + gap, fy + cell, green);
  out += quad(fx, fy + cell + gap, fx + cell, fy + cell * 2 + gap, blue);
  out += quad(fx + cell + gap, fy + cell + gap, fx + cell * 2 + gap, fy + cell * 2 + gap, yellow);
  svg.innerHTML = out;
}
