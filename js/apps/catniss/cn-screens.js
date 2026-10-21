(function (C) {
  'use strict';
  const { W, H, T, clamp, lerp } = C;
  const Screens = {};

  const ORANGE = '#f0a040', CREAM = '#fff1d8', PINK = '#ff7aa0', SKY = '#9ae8ff', DIM = '#a89cc8';

  function levelIndex(id) { return C.Levels.LEVELS.findIndex(l => l.id === id); }
  function mainLevels() { return C.Levels.LEVELS.filter(l => !l.bonus); }
  function fishCount(save) { return C.Levels.LEVELS.filter(l => l.fishIndex !== undefined && save.levels[l.id] && save.levels[l.id].fish).length; }
  function unlocked(save, lv) {
    if (lv.bonus) return fishCount(save) >= 12;
    const list = mainLevels();
    const i = list.indexOf(lv);
    return i <= 0 || !!(save.levels[list[i - 1].id] && save.levels[list[i - 1].id].done);
  }
  function hasProgress(save) { return Object.keys(save.levels).length > 0 || save.intro; }

  function scenery(ui, g, theme, camX, t, x0, w, yOff = 24) {
    const S = ui.S, th = C.Render.THEMES[theme];
    g.save();
    g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    const tileX = (im, off, y) => { let x = x0 - ((Math.round(off) % im.width) + im.width) % im.width; for (; x < x0 + w; x += im.width) g.drawImage(im, x, Math.round(y)); };
    if (th.skyImg) {
      const im = S.raw[th.skyImg];
      const info = ui.renderer.skyInfo(th.skyImg);
      if (im && info) {
        const sy = th.skyImg === 'c_far' || th.skyImg === 'i_bg' ? H - im.height : 0;
        g.fillStyle = info.top; g.fillRect(x0, 0, w, Math.max(0, sy + 1));
        g.fillStyle = info.bot; g.fillRect(x0, sy + im.height - 1, w, H);
        tileX(im, camX * 0.03, sy);
      }
    } else { g.fillStyle = th.sky; g.fillRect(x0, 0, w, H); }
    for (const L of th.layers) {
      const im = S.raw[L.img];
      if (!im) continue;
      if (L.top) { const span = im.width + L.gap; let x = x0 - (((camX * L.f + t * L.drift) % span) + span) % span; for (; x < x0 + w; x += span) g.drawImage(im, Math.round(x), L.y); continue; }
      tileX(im, camX * L.f, H - im.height - yOff);
    }
    g.restore();
  }

  function groundStrip(ui, g, theme, camX, y, x0, w) {
    const ts = ui.S.tiles[theme];
    g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    let x = x0 - ((Math.round(camX) % T) + T) % T;
    for (; x < x0 + w; x += T) {
      g.drawImage(ts, 1 * T, 0, T, T, x, y, T, T);
      for (let yy = y + T; yy < H; yy += T) g.drawImage(ts, 1 * T, 1 * T, T, T, x, yy, T, T);
    }
    g.restore();
  }

  function catFrame(ui, id, dir, k) {
    const fr = ui.S.cats[id] || ui.S.cats.catniss;
    if (!fr) return null;
    if (dir === 0) return fr.down[k % 3];
    return (dir < 0 ? fr.left : fr.right)[k % 3];
  }

  function drawCat(g, im, x, y) { if (im) g.drawImage(im, Math.round(x - 16), Math.round(y - 32)); }

  function menuList(ui, ctx, items, sel, x, y, o = {}) {
    const size = o.size || 10, gap = o.gap || 15;
    items.forEach((it, i) => {
      const yy = y + i * gap;
      const id = (o.prefix || 'm') + i;
      const hot = i === sel || ui.hovered(id);
      ctx.font = ui.font(size);
      const w = ctx.measureText(it.label).width;
      const bx = o.align === 'left' ? x : x - w / 2;
      ui.btn(bx - 10, yy - 2, w + 20, gap - 1, () => it.fn(), id);
      if (hot) {
        ctx.fillStyle = 'rgba(240,160,64,0.22)'; ctx.fillRect(bx - 10, yy - 2, w + 20, gap - 2);
        const head = ui.S.head[ui.save.skin] || ui.S.head.catniss;
        ui.sprite(ctx, head, bx - 9, yy + (size - 8) / 2);
      }
      ui.text(ctx, it.label, o.align === 'left' ? x : x, yy, { size, align: o.align === 'left' ? 'left' : 'center', color: it.disabled ? '#6a6080' : hot ? '#ffe2a8' : CREAM });
    });
  }

  Screens.loading = ui => ({
    draw(ctx) {
      ctx.fillStyle = '#120a20'; ctx.fillRect(0, 0, W, H);
      ui.text(ctx, 'CATNISS', W / 2, 96, { size: 20, align: 'center', color: ORANGE });
      const p = ui.loadP || 0;
      ctx.fillStyle = '#2a2040'; ctx.fillRect(100, 130, 120, 6);
      ctx.fillStyle = ORANGE; ctx.fillRect(100, 130, 120 * p, 6);
      ui.text(ctx, 'Загрузка...', W / 2, 142, { size: 8, align: 'center', color: DIM });
    }
  });

  Screens.title = ui => {
    let sel = 0, confirm = false;
    const items = () => {
      const list = [];
      if (hasProgress(ui.save)) list.push({ label: 'Продолжить', fn: () => ui.go('map') });
      list.push({ label: 'Новая игра', fn: () => { if (hasProgress(ui.save)) confirm = true; else startNew(); } });
      list.push({ label: 'Аквариум', fn: () => ui.go('aquarium', { back: 'title' }) });
      list.push({ label: 'Настройки', fn: () => ui.go('settings', { back: 'title' }) });
      if (ui.opts.onExit) list.push({ label: 'Выход', fn: () => ui.opts.onExit() });
      return list;
    };
    const startNew = () => {
      const keep = { music: ui.save.music, sfx: ui.save.sfx };
      ui.save = Object.assign(C.defaultSave(), keep);
      ui.persist();
      ui.go('intro');
    };
    return {
      enter() { ui.audio.play('menu'); },
      action(a) {
        if (confirm) {
          if (a === 'confirm' || a === 'jump') { confirm = false; startNew(); }
          else if (a === 'back') confirm = false;
          return;
        }
        const list = items();
        if (a === 'up') { sel = (sel + list.length - 1) % list.length; ui.audio.sfxPlay('select'); }
        if (a === 'down') { sel = (sel + 1) % list.length; ui.audio.sfxPlay('select'); }
        if (a === 'confirm' || a === 'jump') { ui.audio.sfxPlay('confirm'); list[sel].fn(); }
      },
      pixel(g) {
        const t = ui.t;
        scenery(ui, g, 'meadow', t * 18, t, 0, W);
        groundStrip(ui, g, 'meadow', t * 40, 208, 0, W);
        const k = Math.floor(t * 9) % 4;
        drawCat(g, catFrame(ui, 'catniss', 1, [0, 1, 2, 1][k]), 64, 209);
        drawCat(g, catFrame(ui, 'ugolek', 1, [1, 2, 1, 0][k]), 34, 209);
        drawCat(g, catFrame(ui, 'chernika', 1, [2, 1, 0, 1][k]), 14, 209);
      },
      draw(ctx) {
        const t = ui.t, S = ui.S;
        const front = S.title && S.title.front;
        if (front) {
          const im = front[Math.floor(t * 1.2) % 3 === 2 ? 1 : 0];
          const s = 120 / im.height;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(im, 222, 92 + Math.sin(t * 2) * 1.5, im.width * s, im.height * s);
          ctx.imageSmoothingEnabled = false;
        }
        const wob = i => Math.sin(t * 3 + i * 0.7) * 2;
        const title = 'CATNISS';
        ctx.font = ui.font(34);
        let x = 24;
        for (let i = 0; i < title.length; i++) {
          ui.text(ctx, title[i], x, 22 + wob(i), { size: 34, color: i % 2 ? '#ffb84a' : ORANGE, outline: true, shadowColor: '#3a1606' });
          x += ctx.measureText(title[i]).width;
        }
        ui.text(ctx, 'девять жизней одной рыжей кошки', 26, 60, { size: 8, color: CREAM });
        if (confirm) {
          ui.panel(ctx, 40, 100, 170, 54);
          ui.text(ctx, 'Начать заново?', 125, 108, { size: 10, align: 'center', color: '#ffe2a8' });
          ui.text(ctx, 'Сохранение будет стёрто.', 125, 122, { size: 8, align: 'center', color: CREAM });
          ui.text(ctx, '[Enter] да    [Esc] нет', 125, 138, { size: 8, align: 'center', color: DIM });
          ui.btn(40, 100, 170, 54, () => { confirm = false; startNew(); }, 'yes');
          return;
        }
        const list = items();
        sel = clamp(sel, 0, list.length - 1);
        ui.panel(ctx, 30, 84, 120, list.length * 15 + 10, { fill: 'rgba(16,10,34,0.7)' });
        menuList(ui, ctx, list, sel, 90, 90, { size: 10, prefix: 't' });
        ui.text(ctx, '(c) 2000 Kotelok Games  ·  Win 98 Edition', 6, 229, { size: 7, color: 'rgba(255,241,216,0.75)' });
      }
    };
  };

  const INTRO = [
    { text: 'Тихое утро на окраине деревни. Рыжая кошка Catniss присматривает за младшими: Угольком, Черникой, Пятнашкой и Снежкой.', scene: 'yard' },
    { text: 'Но к забору подъехал белый фургон с надписью «ОТЛОВ». Котят посадили в клетку, хлопнула дверца.', scene: 'van' },
    { text: 'На первом же ухабе дверца распахнулась. Уголёк, Черника и Пятнашка выпрыгнули кто где. Снежку фургон увёз в город.', scene: 'road' },
    { text: 'Catniss идёт следом. Впереди луга, горы, стройка и неоновый город. Девять жизней: это немало!', scene: 'go' }
  ];

  Screens.intro = ui => {
    let i = 0, t = 0;
    const next = () => { i++; t = 0; if (i >= INTRO.length) { ui.save.intro = true; ui.persist(); ui.go('map'); } };
    return {
      enter() { ui.audio.play('menu'); },
      update(dt) { t += dt; },
      action(a) {
        if (a === 'back') { ui.save.intro = true; ui.persist(); ui.go('map'); return; }
        if (a === 'confirm' || a === 'jump' || a === 'dash') {
          const full = INTRO[Math.min(i, INTRO.length - 1)].text.length;
          if (t * 40 < full) t = full / 40 + 0.01; else next();
        }
      },
      click() { this.action('confirm'); },
      pixel(g) {
        const card = INTRO[Math.min(i, INTRO.length - 1)];
        const tt = ui.t;
        if (card.scene === 'yard') {
          scenery(ui, g, 'meadow', 40, tt, 0, W);
          groundStrip(ui, g, 'meadow', 0, 176, 0, W);
          const kids = ['ugolek', 'chernika', 'pyatnashka', 'snezhka'];
          kids.forEach((k, n) => drawCat(g, catFrame(ui, k, 0, Math.floor(tt * 2 + n) % 2 ? 1 : 0), 120 + n * 30, 177));
          drawCat(g, catFrame(ui, 'catniss', 1, 1), 80, 177);
        } else if (card.scene === 'van') {
          scenery(ui, g, 'meadow', 120, tt, 0, W);
          groundStrip(ui, g, 'meadow', 0, 176, 0, W);
          const S = ui.S;
          g.drawImage(S.vanBody, 170, 176 - 58);
          g.drawImage(S.wheel[0], 178, 164); g.drawImage(S.wheel[0], 222, 164);
          drawCat(g, catFrame(ui, 'catniss', 1, Math.floor(tt * 6) % 3), 70 + Math.min(t * 30, 60), 177);
        } else if (card.scene === 'road') {
          scenery(ui, g, 'meadow', tt * 60, tt, 0, W);
          groundStrip(ui, g, 'meadow', tt * 150, 176, 0, W);
          const S = ui.S;
          const vx = 140 + t * 40;
          g.drawImage(S.vanBody, Math.round(vx), 176 - 58 + Math.round(Math.sin(tt * 18)));
          g.drawImage(S.wheel[Math.floor(tt * 14) % 2], Math.round(vx) + 8, 164); g.drawImage(S.wheel[Math.floor(tt * 14) % 2], Math.round(vx) + 52, 164);
          ['ugolek', 'chernika', 'pyatnashka'].forEach((k, n) => {
            const ph = clamp(t * 1.2 - n * 0.35, 0, 1);
            const x = vx - 10 - ph * (60 + n * 30), y = 150 - Math.sin(ph * Math.PI) * 50 + ph * 27;
            if (ph > 0) drawCat(g, catFrame(ui, k, -1, 2), x, y);
          });
        } else {
          scenery(ui, g, 'meadow', tt * 30, tt, 0, W);
          groundStrip(ui, g, 'meadow', tt * 75, 176, 0, W);
          drawCat(g, catFrame(ui, 'catniss', 1, [0, 1, 2, 1][Math.floor(tt * 9) % 4]), 150, 177);
        }
      },
      draw(ctx) {
        const card = INTRO[Math.min(i, INTRO.length - 1)];
        ui.panel(ctx, 14, 188, W - 28, 46);
        const shown = card.text.slice(0, Math.floor(t * 40));
        ui.wrap(ctx, shown, W - 48, 8).forEach((l, n) => ui.text(ctx, l, 24, 195 + n * 10, { size: 8, color: CREAM }));
        ui.text(ctx, `${i + 1}/${INTRO.length}   [Enter] далее   [Esc] пропустить`, W - 22, 224, { size: 6, align: 'right', color: DIM });
      }
    };
  };

  function nodePos(lv) {
    if (lv.bonus) return { x: 4 * 320 - 34, y: 186 };
    const n = lv.world * 3 + Number(lv.id.split('-')[1]) - 1;
    const w = lv.world, k = n % 3;
    return { x: w * 320 + 70 + k * 92, y: 186 };
  }

  Screens.map = (ui, arg) => {
    const levels = C.Levels.LEVELS;
    const open = () => levels.filter(l => unlocked(ui.save, l));
    let cur = arg.from ? levelIndex(arg.from) : -1;
    if (cur < 0 || !unlocked(ui.save, levels[cur])) {
      const o = open();
      const firstUndone = o.find(l => !(ui.save.levels[l.id] && ui.save.levels[l.id].done) && !l.bonus);
      cur = levelIndex((firstUndone || o[o.length - 1]).id);
    }
    const p0 = nodePos(levels[cur]);
    const cat = { x: p0.x, y: p0.y, tx: p0.x, ty: p0.y, dir: 1 };
    let camX = clamp(p0.x - W / 2, 0, 4 * 320 - W);
    let toast = arg.toast || null, toastT = arg.toast ? 3.5 : 0;
    const move = d => {
      const o = open();
      const idx = o.indexOf(levels[cur]);
      const nx = o[clamp(idx + d, 0, o.length - 1)];
      if (!nx || nx === levels[cur]) return;
      cur = levelIndex(nx.id);
      const p = nodePos(nx);
      cat.tx = p.x; cat.ty = p.y; cat.dir = p.x >= cat.x ? 1 : -1;
      ui.audio.sfxPlay('select');
    };
    const play = () => {
      if (Math.abs(cat.x - cat.tx) > 2) return;
      ui.audio.sfxPlay('confirm');
      ui.go('play', { id: levels[cur].id });
    };
    const cycleSkin = () => {
      const list = C.SKINS.filter(s => s === 'catniss' || ui.save.rescued.includes(s));
      const i = list.indexOf(ui.save.skin);
      ui.save.skin = list[(i + 1) % list.length];
      ui.persist();
      ui.audio.sfxPlay('meow');
    };
    return {
      enter() { ui.audio.play('menu'); },
      update(dt) {
        const dx = cat.tx - cat.x, dy = cat.ty - cat.y, l = Math.hypot(dx, dy);
        if (l > 0.5) { const s = Math.min(l, 190 * dt); cat.x += dx / l * s; cat.y += dy / l * s; cat.walking = true; } else { cat.x = cat.tx; cat.y = cat.ty; cat.walking = false; }
        camX = lerp(camX, clamp(cat.x - W / 2, 0, 4 * 320 - W), Math.min(1, dt * 4));
        if (toastT > 0) toastT -= dt;
      },
      action(a) {
        if (a === 'left' || a === 'up') move(-1);
        if (a === 'right' || a === 'down') move(1);
        if (a === 'confirm' || a === 'jump') play();
        if (a === 'back') { ui.audio.sfxPlay('back'); ui.go('title'); }
        if (a === 'aqua') ui.go('aquarium', { back: 'map' });
        if (a === 'cats') cycleSkin();
      },
      click(x, y) {
        for (const l of open()) {
          const p = nodePos(l);
          if (Math.abs(x + camX - p.x) < 12 && Math.abs(y - p.y + 4) < 12) {
            if (levels[cur] === l) play(); else { cur = levelIndex(l.id); cat.tx = p.x; cat.ty = p.y; cat.dir = p.x >= cat.x ? 1 : -1; }
          }
        }
      },
      pixel(g) {
        const S = ui.S;
        const cx = Math.round(camX);
        const ROAD = { meadow: ['#c8894a', '#7a4a24', '#e2aa64'], mountain: ['#d8cce8', '#5d4466', '#ffffff'], site: ['#5a646a', '#262d31', '#f2d24a'], neon: ['#2d2249', '#0b0a18', '#41f2ff'] };
        C.Levels.WORLDS.forEach((w, i) => {
          const x0 = i * 320 - cx;
          if (x0 > W || x0 + 320 < 0) return;
          const bx = Math.max(0, x0), bw = Math.min(W, x0 + 320) - bx;
          scenery(ui, g, w.theme, cx * 0.5 + i * 97, ui.t, bx, bw, 52);
          groundStrip(ui, g, w.theme, cx, 192, bx, bw);
          const r = ROAD[w.theme];
          g.fillStyle = r[1]; g.fillRect(bx, 183, bw, 9);
          g.fillStyle = r[0]; g.fillRect(bx, 184, bw, 7);
          g.fillStyle = r[2];
          for (let x = i * 320 + (i === 0 ? 40 : 0); x < (i + 1) * 320 - (i === 3 ? 20 : 0); x += 8) { const sx = x - cx; if (sx >= bx - 4 && sx < bx + bw) g.fillRect(sx, 187, 4, 1); }
        });
        for (const l of levels) {
          const p = nodePos(l);
          const sx = Math.round(p.x - cx), sy = p.y;
          if (sx < -24 || sx > W + 24) continue;
          const rec = ui.save.levels[l.id];
          const isOpen = unlocked(ui.save, l);
          if (l.bonus && !isOpen) continue;
          const plate = !isOpen ? ['#4a4060', '#2a2040'] : rec && rec.done ? ['#48d870', '#1a6a30'] : [ORANGE, '#7a3a08'];
          const px = sx + 16;
          g.fillStyle = '#3b2410'; g.fillRect(px - 1, sy - 16, 3, 14);
          g.fillStyle = '#1a1226'; g.fillRect(px - 9, sy - 26, 19, 11);
          g.fillStyle = plate[0]; g.fillRect(px - 8, sy - 25, 17, 9);
          g.fillStyle = plate[1]; g.fillRect(px - 8, sy - 17, 17, 1);
          if (l.bonus) { const f = S.fishSmall && S.fishSmall[5]; if (f) g.drawImage(f[0], px - 4, sy - 26, 8, 11); }
          else S.microText(g, l.id, px - 5, sy - 23, isOpen ? '#1a1226' : '#6a6080');
          if (rec && rec.fish) { g.fillStyle = '#1a1226'; g.fillRect(px + 7, sy - 29, 5, 5); g.fillStyle = SKY; g.fillRect(px + 8, sy - 28, 3, 3); }
          if (rec && rec.all) { g.fillStyle = '#1a1226'; g.fillRect(px - 12, sy - 29, 5, 5); g.fillStyle = '#ffe27a'; g.fillRect(px - 11, sy - 28, 3, 3); }
          g.fillStyle = 'rgba(10,6,20,0.35)'; g.fillRect(sx - 8, sy + 2, 16, 2);
          if (l.rescue) {
            const kit = S.cats[l.rescue];
            const saved = ui.save.rescued.includes(l.rescue);
            if (!saved) { if (kit) g.drawImage(kit.down[1], sx + 4, sy - 52, 24, 24); g.drawImage(S.cage, sx + 4, sy - 52); }
            else if (kit) g.drawImage(kit.down[Math.floor(ui.t * 2) % 2], sx + 22, sy - 30);
          }
        }
        const k = cat.walking ? [0, 1, 2, 1][Math.floor(ui.t * 10) % 4] : 1;
        drawCat(g, catFrame(ui, ui.save.skin, cat.walking ? cat.dir : 0, k), cat.x - cx, cat.y + 2);
      },
      draw(ctx) {
        const S = ui.S;
        const l = levels[cur];
        const w = C.Levels.WORLDS[l.world] || C.Levels.WORLDS[3];
        let hx = 6;
        ['catniss', 'ugolek', 'chernika', 'pyatnashka', 'snezhka'].forEach(id => {
          const got = id === 'catniss' || ui.save.rescued.includes(id);
          const im = got ? S.head[id] : null;
          ctx.fillStyle = 'rgba(16,10,34,0.7)'; ctx.fillRect(hx - 2, 4, 14, 13);
          if (im) ui.sprite(ctx, im, hx + 1, 6);
          else ui.text(ctx, '?', hx + 5, 6, { size: 8, align: 'center', color: '#6a6080' });
          if (ui.save.skin === id) { ctx.strokeStyle = ORANGE; ctx.strokeRect(hx - 1.5, 4.5, 13, 12); }
          hx += 16;
        });
        ui.text(ctx, '[C] ' + (ui.save.skin === 'catniss' ? 'Catniss' : C.SIBLINGS[ui.save.skin].name), 88, 7, { size: 7, color: CREAM });
        const fc = fishCount(ui.save);
        const fish = S.fishSmall && S.fishSmall[0];
        ctx.fillStyle = 'rgba(16,10,34,0.7)'; ctx.fillRect(W - 66, 4, 62, 14);
        if (fish) ctx.drawImage(fish[0], W - 64, 4, 8, 11);
        ui.text(ctx, `${fc}/12  [Q]`, W - 53, 7, { size: 7, color: SKY });
        ui.btn(W - 66, 4, 62, 14, () => ui.go('aquarium', { back: 'map' }), 'aq');
        C.Levels.WORLDS.forEach((wd, i) => {
          const mx = i * 320 + 160 - camX;
          if (mx < -120 || mx > W + 120) return;
          ui.text(ctx, `${i + 1}. ${wd.name}`, mx, 26, { size: 10, align: 'center', color: '#ffe2a8', outline: true });
          ui.text(ctx, wd.blurb, mx, 40, { size: 7, align: 'center', color: CREAM, outline: true });
        });
        const rec = ui.save.levels[l.id];
        ui.panel(ctx, 8, 210, W - 16, 27);
        ui.text(ctx, l.bonus ? 'Бонус' : `${l.id}  ${w.name}`, 14, 214, { size: 7, color: DIM });
        ui.text(ctx, l.name, 14, 224, { size: 9, color: '#ffe2a8' });
        const stamp = (x, ok, label) => {
          ctx.fillStyle = ok ? '#48d870' : '#3a3050'; ctx.fillRect(x, 217, 6, 6);
          ui.text(ctx, label, x + 9, 216, { size: 7, color: ok ? CREAM : '#7a7090' });
        };
        stamp(170, rec && rec.done, 'пройден');
        if (l.fishIndex !== undefined) stamp(232, rec && rec.fish, 'рыбка');
        ui.text(ctx, rec ? `монеты ${rec.coins}${rec.all ? ' (все)' : ''}` : 'ещё не пройден', 170, 227, { size: 7, color: rec && rec.all ? '#ffe27a' : '#a898c8' });
        ui.text(ctx, '[Enter]', W - 14, 227, { size: 7, align: 'right', color: ORANGE });
        ui.btn(W - 60, 222, 50, 14, play, 'play');
        if (toastT > 0 && toast) {
          ctx.globalAlpha = clamp(toastT, 0, 1);
          ui.panel(ctx, 50, 30, W - 100, 22);
          ui.text(ctx, toast, W / 2, 37, { size: 8, align: 'center', color: '#ffe2a8' });
          ctx.globalAlpha = 1;
        }
      }
    };
  };

  Screens.play = (ui, arg) => {
    const def = C.Levels.byId(arg.id);
    const lives = Math.max(ui.save.lives || C.START_LIVES, C.START_LIVES);
    let game, R = ui.renderer;
    let paused = false, psel = 0, banner = 2.8, result = null, resultT = 0, overT = 0, time = 0;
    const theme = def.theme;
    const start = () => {
      game = new C.Sim.Game(def, { lives });
      R.setGame(game, theme, ui.save.skin);
      ui.audio.play(def.boss ? 'menu' : 'level', def.scroll ? 1.08 : def.boss ? 1.12 : 1);
      time = 0; result = null; overT = 0; banner = 2.8;
    };
    const SFX = { jump: 'jump', walljump: 'walljump', dash: 'dash', land: 'land', cling: 'cling', coin: 'coin', butterfly: 'butterfly', life: 'life', fish: 'fish', stomp: 'stomp', kill: 'kill', hurt: 'hurt', die: 'die', drown: 'drown', check: 'check', bounce: 'bounce', bark: 'bark', growl: 'growl', howl: 'howl', screech: 'screech', crumble: 'crumble', shake: 'shake', brickfall: 'brickfall', brick: 'brick', car: 'car', honk: 'honk', doors: 'doors', expose: 'expose', clank: 'clank', bosshit: 'bosshit', vanbreak: 'vanbreak', meow: 'meow', rescue: 'rescue', clear: 'clear', over: 'over', bonk: 'bonk' };
    const finish = () => {
      const rec = ui.save.levels[def.id] || { done: false, fish: false, coins: 0, all: false, best: 0 };
      const first = !rec.done;
      rec.done = true;
      rec.fish = rec.fish || game.fish;
      rec.coins = Math.max(rec.coins, game.coins);
      rec.all = rec.all || game.coins >= game.coinsTotal;
      rec.best = rec.best ? Math.min(rec.best, time) : time;
      ui.save.levels[def.id] = rec;
      ui.save.lives = game.lives;
      let toast = null;
      if (def.rescue && !ui.save.rescued.includes(def.rescue)) { ui.save.rescued.push(def.rescue); toast = `${C.SIBLINGS[def.rescue].name} теперь с вами! [C] играть за котёнка`; }
      const fc = fishCount(ui.save);
      if (game.fish && fc === 12) toast = 'Все 12 рыбок найдены! Открыт бонус «Аквариум»';
      ui.persist();
      if (def.boss && first) { ui.go('ending'); return; }
      ui.go('map', { from: def.id, toast });
    };
    const pauseItems = () => [
      { label: 'Продолжить', fn: () => { paused = false; ui.audio.pauseMusic(false); } },
      { label: 'Начать уровень заново', fn: () => { paused = false; start(); } },
      { label: 'Музыка: ' + Math.round(ui.save.music * 10), fn: () => { ui.save.music = ui.save.music >= 0.95 ? 0 : Math.round(ui.save.music * 10 + 2) / 10; ui.audio.setVolumes(ui.save.music, ui.save.sfx); ui.persist(); } },
      { label: 'Звуки: ' + Math.round(ui.save.sfx * 10), fn: () => { ui.save.sfx = ui.save.sfx >= 0.95 ? 0 : Math.round(ui.save.sfx * 10 + 2) / 10; ui.audio.setVolumes(ui.save.music, ui.save.sfx); ui.persist(); } },
      { label: 'Выйти на карту', fn: () => { ui.audio.pauseMusic(false); ui.go('map', { from: def.id }); } }
    ];
    start();
    return {
      get game() { return game; },
      restart: start,
      action(a) {
        if (result) {
          if ((a === 'confirm' || a === 'jump') && resultT > 0.8) finish();
          return;
        }
        if (game.state === 'over') {
          if (overT < 0.8) return;
          if (a === 'confirm' || a === 'jump') { ui.audio.sfxPlay('confirm'); start(); }
          if (a === 'back') ui.go('map', { from: def.id });
          return;
        }
        if (paused) {
          const list = pauseItems();
          if (a === 'up') { psel = (psel + list.length - 1) % list.length; ui.audio.sfxPlay('select'); }
          if (a === 'down') { psel = (psel + 1) % list.length; ui.audio.sfxPlay('select'); }
          if (a === 'confirm' || a === 'jump') { ui.audio.sfxPlay('confirm'); list[psel].fn(); }
          if (a === 'back' || a === 'pause') { paused = false; ui.audio.pauseMusic(false); }
          return;
        }
        if (a === 'back' || a === 'pause') { paused = true; psel = 0; ui.audio.sfxPlay('pause'); ui.audio.pauseMusic(true); }
        if (a === 'mute') { ui.save.music = ui.save.music > 0 ? 0 : 0.7; ui.audio.setVolumes(ui.save.music, ui.save.sfx); ui.persist(); }
      },
      blur() { if (!result && game.state === 'play' && !ui.opts.noAutoPause) { paused = true; psel = 0; ui.audio.pauseMusic(true); } },
      update(dt) {
        if (!ui.isActive() && !paused && !result && game.state === 'play' && !ui.opts.noAutoPause) { paused = true; psel = 0; ui.audio.pauseMusic(true); }
        if (paused) return;
        const k = ui.keys;
        const input = { left: k.has('left'), right: k.has('right'), up: k.has('up'), down: k.has('down'), jump: k.has('jump'), dash: k.has('dash'), jumpPressed: ui.pressed('jump'), dashPressed: ui.pressed('dash') };
        game.update(dt, input);
        if (game.state === 'play') time += dt;
        const ev = game.drain();
        R.events(ev);
        for (const e of ev) if (SFX[e.t]) ui.audio.sfxPlay(SFX[e.t]);
        R.update(dt);
        if (banner > 0) banner -= dt;
        if ((game.state === 'clear' || game.state === 'rescue') && game.stateT > 1.4 && !result) {
          result = { coins: game.coins, total: game.coinsTotal, fish: game.fish, hasFish: game.hasFish, time, rescue: def.rescue, bonus: game.bonusCoins };
          resultT = 0;
          ui.audio.sfxPlay('clear');
        }
        if (result) resultT += dt;
        if (game.state === 'over') overT += dt;
      },
      pixel(g) { R.draw(ui.t); },
      draw(ctx) {
        const S = ui.S, p = game.player;
        const cx = Math.round(game.cam.x), cy = Math.round(game.cam.y);
        for (const e of game.ents) {
          if (e.type !== 'sign' || !e.alive) continue;
          const d = Math.abs(p.x + p.w / 2 - (e.x + 8)) + Math.abs(p.y - e.y) * 0.5;
          if (d > 44) continue;
          const txt = (def.signs && def.signs[e.sign]) || '';
          const lines = ui.wrap(ctx, txt, 150, 8);
          const bw = Math.max(...lines.map(l => { ctx.font = ui.font(8); return ctx.measureText(l).width; })) + 14;
          const bh = lines.length * 10 + 8;
          const bx = clamp(e.x + 8 - cx - bw / 2, 4, W - bw - 4), by = clamp(e.y - cy - bh - 6, 22, H - bh);
          ui.panel(ctx, bx, by, bw, bh, { fill: 'rgba(250,240,220,0.94)', edge: '#3b2410', inner: false });
          lines.forEach((l, i) => ui.text(ctx, l, bx + 7, by + 5 + i * 10, { size: 8, color: '#3b2410', shadow: false }));
        }
        for (const pop of R.pops) {
          ctx.globalAlpha = clamp(pop.life * 2, 0, 1);
          ui.text(ctx, pop.text, pop.x - cx, pop.y - cy, { size: 8, align: 'center', color: pop.col });
          if (pop.heart) ui.sprite(ctx, S.heart, pop.x - cx + 8, pop.y - cy + 1);
          ctx.globalAlpha = 1;
        }
        for (let i = 0; i < C.MAX_LIVES; i++) {
          const x = 6 + i * 9, y = 6;
          if (i < game.lives) ui.sprite(ctx, S.heart, x, y);
          else { ctx.globalAlpha = 0.35; ui.sprite(ctx, S.heart, x, y); ctx.globalAlpha = 1; }
        }
        if (S.coin[0]) ctx.drawImage(S.coin[Math.floor(ui.t * 8) % 6], 6, 15, 8, 8);
        ui.text(ctx, String(game.coins).padStart(3, '0') + (game.coinsTotal ? '/' + game.coinsTotal : ''), 17, 15, { size: 8, color: '#ffe27a' });
        if (game.hasFish) {
          const bag = S.fishSmall && S.fishSmall[def.fishIndex || 0];
          const had = ui.save.levels[def.id] && ui.save.levels[def.id].fish;
          ctx.fillStyle = 'rgba(16,10,34,0.6)'; ctx.fillRect(W - 20, 4, 16, 20);
          if (bag) {
            if (!game.fish && !had) ctx.globalAlpha = 0.25;
            ctx.drawImage(bag[0], W - 18, 5, 12, 17);
            ctx.globalAlpha = 1;
          }
        }
        const van = game.ents.find(e => e.type === 'van');
        if (van) {
          ui.text(ctx, 'ФУРГОН', W / 2 - 22, 6, { size: 7, align: 'right', color: CREAM });
          for (let i = 0; i < 3; i++) { ctx.fillStyle = i < van.hp ? '#ff4a4a' : '#3a3050'; ctx.fillRect(W / 2 - 16 + i * 12, 6, 9, 7); }
        }
        if (banner > 0) {
          ctx.globalAlpha = clamp(banner, 0, 1);
          const wname = def.bonus ? 'Бонус' : C.Levels.WORLDS[def.world].name;
          ui.panel(ctx, W / 2 - 90, 36, 180, 34);
          ui.text(ctx, `${def.id}  ·  ${wname}`, W / 2, 41, { size: 7, align: 'center', color: DIM });
          ui.text(ctx, def.name, W / 2, 52, { size: 11, align: 'center', color: '#ffe2a8' });
          if (def.scroll) ui.text(ctx, 'Беги! Волки близко!', W / 2, 76, { size: 9, align: 'center', color: PINK });
          ctx.globalAlpha = 1;
        }
        if (game.state === 'over') {
          ctx.fillStyle = `rgba(10,6,20,${clamp(overT, 0, 0.7)})`; ctx.fillRect(0, 0, W, H);
          if (overT > 0.6) {
            ui.panel(ctx, 60, 80, 200, 70);
            ui.text(ctx, 'Все жизни потрачены', W / 2, 90, { size: 11, align: 'center', color: PINK });
            ui.text(ctx, 'Catniss свернулась клубочком', W / 2, 106, { size: 8, align: 'center', color: CREAM });
            ui.text(ctx, '[Enter] ещё раз    [Esc] карта', W / 2, 130, { size: 8, align: 'center', color: DIM });
            ui.btn(60, 80, 200, 70, () => start(), 'retry');
          }
        }
        if (result) this.drawResult(ctx);
        if (paused) {
          ctx.fillStyle = 'rgba(10,6,20,0.6)'; ctx.fillRect(0, 0, W, H);
          const list = pauseItems();
          ui.panel(ctx, 80, 56, 160, list.length * 15 + 34);
          ui.text(ctx, 'Пауза', W / 2, 63, { size: 11, align: 'center', color: ORANGE });
          menuList(ui, ctx, list, psel, W / 2, 82, { size: 8, gap: 15, prefix: 'p' });
          ui.text(ctx, '[←][→] бег  [Z] прыжок  [X] наскок  [↓]+[Z] спрыгнуть', W / 2, H - 14, { size: 6, align: 'center', color: DIM });
        }
      },
      drawResult(ctx) {
        const r = result, S = ui.S;
        const k = clamp(resultT * 3, 0, 1);
        ctx.fillStyle = `rgba(10,6,20,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
        const y0 = lerp(-120, 50, k);
        ui.panel(ctx, 50, y0, 220, 130);
        const title = r.rescue ? `${C.SIBLINGS[r.rescue].name} спасён${r.rescue === 'ugolek' ? '' : 'а'}!` : 'Уровень пройден!';
        ui.text(ctx, title, W / 2, y0 + 8, { size: 12, align: 'center', color: '#ffe2a8' });
        if (r.rescue && S.cats48 && S.cats48[r.rescue]) ctx.drawImage(S.cats48[r.rescue].down[Math.floor(ui.t * 3) % 2 ? 1 : 0], W / 2 - 24, y0 + 22, 48, 48);
        const ly = y0 + (r.rescue ? 70 : 32);
        const row = (i, label, val, ok) => {
          ui.text(ctx, label, 72, ly + i * 12, { size: 8, color: CREAM });
          ui.text(ctx, val, 248, ly + i * 12, { size: 8, align: 'right', color: ok ? '#48d870' : '#ffe27a' });
        };
        const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
        row(0, 'Монеты', `${r.coins}/${r.total}${r.bonus ? ` +${r.bonus}` : ''}`, r.coins >= r.total);
        if (r.hasFish) row(1, 'Рыбка в пакете', r.fish ? 'найдена!' : 'не найдена', r.fish);
        row(r.hasFish ? 2 : 1, 'Время', `${mm}:${String(ss).padStart(2, '0')}`, false);
        row(r.hasFish ? 3 : 2, 'Жизни', String(game.lives), false);
        if (resultT > 0.8 && Math.floor(ui.t * 2) % 2) ui.text(ctx, '[Enter]', W / 2, y0 + 116, { size: 8, align: 'center', color: ORANGE });
        ui.btn(50, y0, 220, 130, () => { if (resultT > 0.8) finish(); }, 'res');
      }
    };
  };

  Screens.aquarium = (ui, arg) => {
    let sel = 0;
    const where = i => C.Levels.LEVELS.find(l => l.fishIndex === i);
    return {
      enter() { ui.audio.play('menu'); },
      action(a) {
        if (a === 'left') sel = (sel + 11) % 12;
        if (a === 'right') sel = (sel + 1) % 12;
        if (a === 'up' || a === 'down') sel = (sel + 6) % 12;
        if (['left', 'right', 'up', 'down'].includes(a)) ui.audio.sfxPlay('select');
        if (a === 'back' || a === 'aqua' || a === 'confirm') { ui.audio.sfxPlay('back'); ui.go(arg.back || 'map'); }
      },
      pixel(g) {
        const grd = g.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#0e3a6a'); grd.addColorStop(1, '#06142c');
        g.fillStyle = grd; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(154,232,255,0.5)';
        for (let i = 0; i < 26; i++) { const x = (i * 53) % W, y = H - ((ui.t * (14 + i % 5 * 6) + i * 37) % (H + 10)); g.fillRect(x + Math.round(Math.sin(ui.t * 2 + i) * 2), Math.round(y), i % 3 ? 1 : 2, i % 3 ? 1 : 2); }
        g.fillStyle = '#2a1a10'; g.fillRect(0, 222, W, 18);
        g.fillStyle = '#4a3020'; for (let x = 0; x < W; x += 7) g.fillRect(x, 222 + (x % 3), 4, 2);
      },
      draw(ctx) {
        const S = ui.S;
        ui.text(ctx, 'Аквариум', W / 2, 8, { size: 13, align: 'center', color: SKY });
        const fc = fishCount(ui.save);
        ui.text(ctx, `Найдено рыбок: ${fc} из 12`, W / 2, 24, { size: 8, align: 'center', color: CREAM });
        const k = Math.max(1, Math.floor(ui.scale * 46 / 62));
        const bw = 62 * k / ui.scale, bh = 80 * k / ui.scale;
        for (let i = 0; i < 12; i++) {
          const col = i % 6, row = Math.floor(i / 6);
          const x = 12 + col * 50 + (50 - bw) / 2, y = 40 + row * 84;
          const lv = where(i);
          const got = lv && ui.save.levels[lv.id] && ui.save.levels[lv.id].fish;
          const frames = S.fishBags[i];
          if (i === sel) { ctx.fillStyle = 'rgba(240,160,64,0.25)'; ctx.fillRect(x - 3, y - 2, bw + 6, bh + 14); }
          ui.btn(x - 3, y - 2, bw + 6, bh + 14, () => { sel = i; }, 'f' + i);
          if (frames && got) ctx.drawImage(frames[Math.floor(ui.t * 4 + i) % frames.length], 0, 0, 62, 80, x, y, bw, bh);
          else if (S.fishSil) { ctx.globalAlpha = 0.7; ctx.drawImage(S.fishSil[i], x, y, bw, bh); ctx.globalAlpha = 1; }
          ui.text(ctx, got ? C.FISH[i].name : '???', x + bw / 2, y + bh + 2, { size: 6, align: 'center', color: got ? CREAM : '#6a7a9a' });
        }
        const lv = where(sel);
        const got = lv && ui.save.levels[lv.id] && ui.save.levels[lv.id].fish;
        ui.panel(ctx, 20, 212, W - 40, 22, { edge: '#5ab8e0' });
        const msg = !lv ? 'Эта рыбка ещё плавает где-то далеко' : got ? `${C.FISH[sel].name}: найдена на уровне ${lv.id} «${lv.name}»` : `Спрятана на уровне ${lv.id}. Ищите трещины в стенах!`;
        ui.text(ctx, msg, W / 2, 219, { size: 7, align: 'center', color: got ? CREAM : DIM });
        ui.text(ctx, '[Esc]', W - 24, 8, { size: 7, align: 'right', color: DIM });
        ui.btn(W - 50, 4, 40, 14, () => ui.go(arg.back || 'map'), 'aqback');
      }
    };
  };

  Screens.settings = (ui, arg) => {
    let sel = 0;
    const set = (k, d) => { ui.save[k] = clamp(Math.round((ui.save[k] + d) * 10) / 10, 0, 1); ui.audio.setVolumes(ui.save.music, ui.save.sfx); ui.persist(); ui.audio.sfxPlay('select'); };
    const rows = () => [
      { label: `Музыка   ${'#'.repeat(Math.round(ui.save.music * 10)).padEnd(10, '.')}`, adj: d => set('music', d * 0.1), fn: () => set('music', ui.save.music >= 1 ? -1 : 0.1) },
      { label: `Звуки    ${'#'.repeat(Math.round(ui.save.sfx * 10)).padEnd(10, '.')}`, adj: d => set('sfx', d * 0.1), fn: () => set('sfx', ui.save.sfx >= 1 ? -1 : 0.1) },
      { label: 'Назад', fn: () => ui.go(arg.back || 'title') }
    ];
    return {
      action(a) {
        const list = rows();
        if (a === 'up') sel = (sel + list.length - 1) % list.length;
        if (a === 'down') sel = (sel + 1) % list.length;
        if ((a === 'left' || a === 'right') && list[sel].adj) list[sel].adj(a === 'left' ? -1 : 1);
        if (a === 'confirm' || a === 'jump') list[sel].fn();
        if (a === 'back') ui.go(arg.back || 'title');
      },
      pixel(g) { scenery(ui, g, 'mountain', ui.t * 10, ui.t, 0, W); },
      draw(ctx) {
        ui.panel(ctx, 30, 20, W - 60, H - 40);
        ui.text(ctx, 'Настройки', W / 2, 28, { size: 12, align: 'center', color: ORANGE });
        menuList(ui, ctx, rows(), sel, 60, 50, { size: 8, gap: 15, align: 'left', prefix: 's' });
        const keys = [
          ['← →  /  A D', 'бег'], ['Z  /  Пробел', 'прыжок (держите дольше, чтобы выше)'], ['X  /  Shift', 'наскок: рывок в прыжке, бьёт врагов'],
          ['у стены', 'жмите к стене: когти, затем Z'], ['↓ + Z', 'спрыгнуть с доски'], ['Esc  /  P', 'пауза'], ['M', 'музыка вкл/выкл'], ['Геймпад', 'A прыжок, X/B наскок, Start пауза']
        ];
        ui.text(ctx, 'Управление', 60, 104, { size: 9, color: '#ffe2a8' });
        keys.forEach(([k, v], i) => { ui.text(ctx, k, 60, 118 + i * 11, { size: 7, color: SKY }); ui.text(ctx, v, 128, 118 + i * 11, { size: 7, color: CREAM }); });
      }
    };
  };

  const CREDITS = [
    ['CATNISS', 24, ORANGE], ['', 8], ['Уголёк, Черника, Пятнашка и Снежка дома.', 8, CREAM], ['Фургон «ОТЛОВ» больше никого не увезёт.', 8, CREAM], ['', 12],
    ['Kotelok Games, 2000', 10, '#ffe2a8'], ['', 10],
    ['Кошки, собаки и прочая живность', 7, DIM], ['спрайт-листы из папки Catniss', 8, CREAM], ['Ginger & Topey: inkybiscuits', 8, CREAM], ['', 6],
    ['Фоны', 7, DIM], ['Cyberpunk Street, Industrial, Mountain:', 8, CREAM], ['Luis Zuno (@ansimuz), CC-BY 3.0 / CC0', 8, CREAM], ['GrassLand: тайлсет и детали', 8, CREAM], ['', 6],
    ['Рыбки в пакетах, монета', 7, DIM], ['Fish.gif, 24-color coin', 8, CREAM], ['', 6],
    ['Шрифт', 7, DIM], ['VCR OSD Mono (RUS by Daymarius)', 8, CREAM], ['', 6],
    ['Музыка', 7, DIM], ['ken@8bit: oboro, SAKURA (8-bit covers)', 8, CREAM], ['', 14],
    ['Спасибо, что играли!', 10, PINK], ['', 60]
  ];

  Screens.ending = ui => {
    let t = 0;
    return {
      enter() { ui.audio.play('menu'); },
      update(dt) { t += dt; },
      action(a) { if ((a === 'confirm' || a === 'back' || a === 'jump') && t > 1.5) ui.go('map', { toast: 'Все котята спасены! Ищите рыбок в пакетах' }); },
      pixel(g) {
        scenery(ui, g, 'meadow', t * 25, ui.t, 0, W);
        groundStrip(ui, g, 'meadow', t * 60, 208, 0, W);
        const k = Math.floor(ui.t * 9) % 4;
        ['catniss', 'ugolek', 'chernika', 'pyatnashka', 'snezhka'].forEach((id, i) => drawCat(g, catFrame(ui, id, 1, [0, 1, 2, 1][(k + i) % 4]), 200 - i * 34, 209));
      },
      draw(ctx) {
        let y = H - t * 16;
        for (const [s, size, col] of CREDITS) {
          if (y > -20 && y < 190) ui.text(ctx, s, W / 2, y, { size, align: 'center', color: col || CREAM, outline: true, shadowColor: '#120a20' });
          y += size + 5;
        }
        if (y < 0) ui.go('map', { toast: 'Все котята спасены! Ищите рыбок в пакетах' });
      }
    };
  };

  C.Screens = Screens;
  C.Progress = { fishCount, unlocked, hasProgress };
})(globalThis.Catniss = globalThis.Catniss || {});
