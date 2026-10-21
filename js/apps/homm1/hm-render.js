(function (H) {
  'use strict';

  function drawButton(ctx, rect, label, active, disabled) {
    const [x, y, w, h] = rect;
    const bg = disabled ? '#3a342e' : (active ? '#7a5834' : '#523c26');
    H.fillRect(ctx, x, y, w, h, bg);
    H.strokeBevel(ctx, x, y, w, h, disabled ? '#686058' : '#e8d098', '#1c140e');
    ctx.fillStyle = disabled ? '#888078' : (active ? '#ffe888' : '#f6e8c8');
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + (w >> 1), y + (h >> 1));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function renderResourceBar(ctx, player, world, statusText) {
    H.fillRect(ctx, 0, 0, H.W, 16, '#1e1610');
    if (player) {
      let rx = 8;
      ctx.font = 'bold 10px Tahoma, sans-serif';
      for (const k of H.RES_ORDER) {
        const rDef = H.RESOURCES[k];
        H.fillRect(ctx, rx, 3, 9, 9, rDef.color);
        ctx.fillStyle = '#e8d8b0';
        ctx.fillText(rDef.short + ': ' + (player.resources[k] || 0), rx + 12, 11);
        rx += k === 'gold' ? 86 : 62;
      }
    }
    if (world) {
      ctx.fillStyle = '#ffe066';
      ctx.textAlign = 'right';
      ctx.fillText(`М:${world.month} Н:${world.week} Д:${world.day}`, H.W - 8, 11);
      ctx.textAlign = 'left';
    }

    H.fillRect(ctx, 0, H.H - 16, H.W, 16, '#1e1610');
    ctx.fillStyle = '#f6dfc0';
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillText(statusText || 'Герои Меча и Магии: Стратегический поход', 8, H.H - 4);
  }

  function renderMenuScreen(ctx, ui) {
    H.fillRect(ctx, 0, 0, H.W, H.H, '#16121e');
    H.drawMarbleFrame(ctx, 16, 16, H.W - 32, H.H - 32, '#241c2c');

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEROES OF MIGHT AND MAGIC', H.W >> 1, 56);
    ctx.fillStyle = '#e8d098';
    ctx.font = 'bold 13px Tahoma, sans-serif';
    ctx.fillText('Стратегический поход за Корону Энрота (1995)', H.W >> 1, 78);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ffe088';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText('1. Выберите правителя и класс:', 40, 110);

    for (let i = 0; i < H.FACTION_ORDER.length; i++) {
      const fid = H.FACTION_ORDER[i];
      const f = H.FACTIONS[fid];
      const bx = 40 + i * 142;
      const by = 120;
      const sel = ui.menuFaction === fid;
      H.drawMarbleFrame(ctx, bx, by, 132, 116, sel ? '#483420' : '#2a201a');
      if (sel) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, 130, 114);
        ctx.lineWidth = 1;
      }
      const sampleHero = H.HERO_PROFILE_LIST.find(p => p.faction === fid);
      H.drawHeroPortrait(ctx, sampleHero.id, bx + 42, by + 8, 48, 48);
      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, bx + 66, by + 72);
      ctx.fillStyle = '#dcdce8';
      ctx.font = '10px Tahoma, sans-serif';
      ctx.fillText(f.rulerShort, bx + 66, by + 88);
      ctx.fillStyle = '#b8b0a0';
      ctx.fillText(`А:${f.startStats.atk} З:${f.startStats.def} С:${f.startStats.power} Зн:${f.startStats.knowledge}`, bx + 66, by + 104);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#ffe088';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText('2. Режим похода и сценарий:', 40, 258);

    drawButton(ctx, [40, 266, 130, 26], 'Кампания (8 глав)', ui.menuMode === 'campaign');
    drawButton(ctx, [180, 266, 150, 26], 'Отдельный сценарий', ui.menuMode === 'standalone');

    const list = ui.menuMode === 'campaign' ? H.CAMPAIGN_SCENARIOS : H.STANDALONE_MAPS;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const col = i % 2;
      const row = (i / 2) | 0;
      const sx = 40 + col * 280;
      const sy = 300 + row * 26;
      const active = ui.menuMode === 'campaign' ? (ui.menuCampaignIdx === i) : (ui.menuStandaloneId === item.id);
      drawButton(ctx, [sx, sy, 270, 22], item.title + ` (${item.size}x${item.size})`, active);
    }

    ctx.fillStyle = '#ffe088';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText('3. Сложность:', 350, 258);
    const diffKeys = ['easy', 'normal', 'hard', 'expert', 'impossible'];
    for (let i = 0; i < diffKeys.length; i++) {
      const dk = diffKeys[i];
      const dDef = H.DIFFICULTY_PRESETS[dk];
      drawButton(ctx, [350 + i * 50, 266, 48, 26], dDef.name.slice(0, 4) + '.', ui.menuDifficulty === dk);
    }

    drawButton(ctx, [40, 416, 180, 34], 'Начать поход', true);
    drawButton(ctx, [230, 416, 180, 34], 'Быстрый бой (7x5)', false);
    drawButton(ctx, [420, 416, 180, 34], 'Продолжить сохр.', false, !ui.hasSavedGame());
  }

  function renderAdventureScreen(ctx, ui) {
    const world = ui.world;
    const player = world.getPlayer('blue');
    const hero = world.getHero(world.selectedHeroId);
    const town = world.getTown(world.selectedTownId);

    H.fillRect(ctx, 0, 0, H.W, H.H, '#261e18');
    renderResourceBar(ctx, player, world, ui.hoverText || ui.statusText);

    H.drawMarbleFrame(ctx, H.VIEW_X - 2, H.VIEW_Y - 2, H.VIEW_W + 4, H.VIEW_H + 4, '#000000');

    ctx.save();
    ctx.beginPath();
    ctx.rect(H.VIEW_X, H.VIEW_Y, H.VIEW_W, H.VIEW_H);
    ctx.clip();

    const map = world.map;
    for (let vy = 0; vy < H.VIEW_TILES; vy++) {
      for (let vx = 0; vx < H.VIEW_TILES; vx++) {
        const tx = ui.camX + vx;
        const ty = ui.camY + vy;
        const sx = H.VIEW_X + vx * H.TILE_SIZE;
        const sy = H.VIEW_Y + vy * H.TILE_SIZE;

        if (!H.inBounds(map, tx, ty)) {
          H.fillRect(ctx, sx, sy, 32, 32, '#0c0c12');
          continue;
        }

        const visible = world.isTileVisible('blue', tx, ty);
        if (!visible) {
          H.fillRect(ctx, sx, sy, 32, 32, '#101018');
          ctx.fillStyle = '#1c1c28';
          ctx.fillRect(sx + 6, sy + 6, 4, 4);
          ctx.fillRect(sx + 20, sy + 18, 4, 4);
          continue;
        }

        const terr = H.terrainAt(map, tx, ty);
        H.drawTerrainTile(ctx, terr, sx, sy, tx, ty, ui.tick);

        if (H.isBlockedTile(map, tx, ty)) {
          H.drawBlockedOverlay(ctx, terr, sx, sy);
        }

        if (map.dugTiles && map.dugTiles[H.tileIndex(map, tx, ty)]) {
          H.fillRect(ctx, sx + 8, sy + 12, 16, 10, '#3a2614');
          ctx.strokeStyle = '#684828';
          ctx.strokeRect(sx + 8, sy + 12, 16, 10);
        }
      }
    }

    for (const m of map.mines || []) {
      if (!world.isTileVisible('blue', m.x, m.y)) continue;
      const vx = m.x - ui.camX;
      const vy = m.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        H.drawMineOnMap(ctx, m, H.VIEW_X + vx * 32, H.VIEW_Y + vy * 32);
      }
    }

    for (const o of map.objects || []) {
      if (o.removed || !world.isTileVisible('blue', o.x, o.y)) continue;
      const vx = o.x - ui.camX;
      const vy = o.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        H.drawMapObject(ctx, o, H.VIEW_X + vx * 32, H.VIEW_Y + vy * 32);
      }
    }

    for (const t of map.towns || []) {
      if (!world.isTileVisible('blue', t.x, t.y)) continue;
      const vx = t.x - ui.camX;
      const vy = t.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        H.drawTownOnMap(ctx, t, H.VIEW_X + vx * 32, H.VIEW_Y + vy * 32);
      }
    }

    for (const b of map.boats || []) {
      if (b.occupied || !world.isTileVisible('blue', b.x, b.y)) continue;
      const vx = b.x - ui.camX;
      const vy = b.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        H.drawBoatOnMap(ctx, H.VIEW_X + vx * 32, H.VIEW_Y + vy * 32, false, null);
      }
    }

    if (ui.plannedPath && ui.plannedPath.steps && ui.plannedPath.steps.length > 0) {
      for (let i = 0; i < ui.plannedPath.steps.length; i++) {
        const st = ui.plannedPath.steps[i];
        const vx = st.x - ui.camX;
        const vy = st.y - ui.camY;
        if (vx < 0 || vy < 0 || vx >= H.VIEW_TILES || vy >= H.VIEW_TILES) continue;
        const px = H.VIEW_X + vx * 32 + 16;
        const py = H.VIEW_Y + vy * 32 + 16;
        const isLast = i === ui.plannedPath.steps.length - 1;
        const col = st.day === 1 ? '#5cf468' : '#ff9848';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, isLast ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        if (isLast) {
          ctx.strokeStyle = '#14141c';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    }

    for (const h of world.heroes) {
      if (!world.isTileVisible('blue', h.x, h.y)) continue;
      const vx = h.x - ui.camX;
      const vy = h.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        H.drawHeroOnMap(ctx, h, H.VIEW_X + vx * 32, H.VIEW_Y + vy * 32, h.id === world.selectedHeroId);
      }
    }

    if (ui.hoverTile) {
      const vx = ui.hoverTile.x - ui.camX;
      const vy = ui.hoverTile.y - ui.camY;
      if (vx >= 0 && vy >= 0 && vx < H.VIEW_TILES && vy < H.VIEW_TILES) {
        ctx.strokeStyle = 'rgba(255, 232, 120, 0.78)';
        ctx.lineWidth = 1;
        ctx.strokeRect(H.VIEW_X + vx * 32 + 1, H.VIEW_Y + vy * 32 + 1, 30, 30);
      }
    }

    ctx.restore();

    renderMinimap(ctx, ui);
    renderSidebar(ctx, ui, hero, town);
  }

  function renderMinimap(ctx, ui) {
    const world = ui.world;
    const map = world.map;
    const player = world.getPlayer('blue');
    H.drawMarbleFrame(ctx, H.MINIMAP_X - 2, H.MINIMAP_Y - 2, H.MINIMAP_SIZE + 4, H.MINIMAP_SIZE + 4, '#000000');

    const scale = H.MINIMAP_SIZE / map.w;
    const step = Math.max(1, Math.ceil(scale));

    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const mx = H.MINIMAP_X + Math.floor(x * scale);
        const my = H.MINIMAP_Y + Math.floor(y * scale);
        if (!world.isTileVisible('blue', x, y)) {
          ctx.fillStyle = '#101018';
        } else if (H.isBlockedTile(map, x, y)) {
          ctx.fillStyle = '#243024';
        } else {
          const terr = H.terrainAt(map, x, y);
          ctx.fillStyle = H.TERRAINS[terr] ? H.TERRAINS[terr].color : '#387c2b';
        }
        ctx.fillRect(mx, my, step, step);
      }
    }

    const ov = player ? player.viewOverlay : {};

    for (const m of map.mines || []) {
      if (!ov.mines && !world.isTileVisible('blue', m.x, m.y)) continue;
      ctx.fillStyle = H.getPlayerHex(m.owner);
      ctx.fillRect(H.MINIMAP_X + Math.floor(m.x * scale) - 1, H.MINIMAP_Y + Math.floor(m.y * scale) - 1, 3, 3);
    }

    for (const t of map.towns || []) {
      if (!ov.towns && !world.isTileVisible('blue', t.x, t.y)) continue;
      ctx.fillStyle = H.getPlayerHex(t.owner);
      ctx.fillRect(H.MINIMAP_X + Math.floor(t.x * scale) - 2, H.MINIMAP_Y + Math.floor(t.y * scale) - 2, 5, 5);
    }

    for (const h of world.heroes) {
      if (!ov.heroes && !world.isTileVisible('blue', h.x, h.y)) continue;
      ctx.fillStyle = H.getPlayerHex(h.owner);
      ctx.fillRect(H.MINIMAP_X + Math.floor(h.x * scale) - 1, H.MINIMAP_Y + Math.floor(h.y * scale) - 1, 4, 4);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      H.MINIMAP_X + Math.floor(ui.camX * scale),
      H.MINIMAP_Y + Math.floor(ui.camY * scale),
      Math.floor(H.VIEW_TILES * scale),
      Math.floor(H.VIEW_TILES * scale)
    );
  }

  function renderSidebar(ctx, ui, hero, town) {
    const world = ui.world;
    const myHeroes = world.getPlayerHeroes('blue');
    const myTowns = world.getPlayerTowns('blue');

    ctx.fillStyle = '#ffe088';
    ctx.font = 'bold 10px Tahoma, sans-serif';
    ctx.fillText('Герои:', 476, 174);
    ctx.fillText('Замки:', 556, 174);

    for (let i = 0; i < 4; i++) {
      const h = myHeroes[i];
      const bx = 476;
      const by = 180 + i * 27;
      H.drawMarbleFrame(ctx, bx, by, 74, 24, h && h.id === world.selectedHeroId ? '#5a4228' : '#2a2018');
      if (h) {
        ctx.fillStyle = '#f6e8c8';
        ctx.font = 'bold 10px Tahoma, sans-serif';
        ctx.fillText(h.name.slice(0, 9), bx + 4, by + 11);
        const pct = Math.min(1, (h.move || 0) / (h.maxMove || 1200));
        H.fillRect(ctx, bx + 4, by + 15, Math.round(66 * pct), 5, '#48c848');
      }
    }

    for (let i = 0; i < 4; i++) {
      const t = myTowns[i];
      const bx = 556;
      const by = 180 + i * 27;
      H.drawMarbleFrame(ctx, bx, by, 76, 24, t && t.id === world.selectedTownId ? '#5a4228' : '#2a2018');
      if (t) {
        ctx.fillStyle = '#f6e8c8';
        ctx.font = 'bold 10px Tahoma, sans-serif';
        ctx.fillText(t.name.slice(0, 9), bx + 4, by + 11);
        ctx.fillStyle = t.builtToday ? '#ff8868' : '#88e888';
        ctx.fillText(t.buildings.castle ? 'Замок' : 'Деревня', bx + 4, by + 21);
      }
    }

    H.drawMarbleFrame(ctx, 476, 290, 156, 92, '#221a14');
    if (hero) {
      H.drawHeroPortrait(ctx, hero.id, 480, 294, 40, 40);
      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillText(hero.name, 524, 306);
      ctx.fillStyle = '#dcdce8';
      ctx.font = '10px Tahoma, sans-serif';
      ctx.fillText(`Ур.${hero.level} А:${hero.atk} З:${hero.def} С:${hero.power} Зн:${hero.knowledge}`, 524, 320);
      ctx.fillText(`Ход: ${hero.move}/${hero.maxMove}`, 524, 333);

      for (let s = 0; s < H.ARMY_SLOTS; s++) {
        const slot = hero.army[s];
        const sx = 480 + s * 30;
        const sy = 340;
        H.drawMarbleFrame(ctx, sx, sy, 28, 38, ui.selectedArmySlot === s ? '#684c28' : '#18120e');
        if (slot && slot.count > 0) {
          H.drawUnitSprite(ctx, slot.unit, sx + 2, sy + 2, 24, 24, false);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Tahoma, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(slot.count), sx + 14, sy + 35);
          ctx.textAlign = 'left';
        }
      }
    } else {
      ctx.fillStyle = '#988c78';
      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillText('Нет выбранного героя', 490, 336);
    }

    drawButton(ctx, [476, 386, 76, 18], 'Идти (M)', false, !hero || !ui.plannedPath || !ui.plannedPath.reachable);
    drawButton(ctx, [556, 386, 76, 18], 'Копать (D)', false, !hero);
    drawButton(ctx, [476, 406, 76, 18], 'Чары (C)', false, !hero || !hero.hasSpellbook);
    drawButton(ctx, [556, 406, 76, 18], 'Герой (H)', false, !hero);
    drawButton(ctx, [476, 426, 76, 18], 'Замок (T)', false, !town);
    drawButton(ctx, [556, 426, 76, 18], 'Ход (E)', true, false);
    drawButton(ctx, [476, 446, 76, 16], 'Обелиски (P)', false, false);
    drawButton(ctx, [556, 446, 76, 16], 'Меню (Esc)', false, false);
  }

  function renderTownScreen(ctx, ui) {
    const world = ui.world;
    const town = world.getTown(world.selectedTownId) || world.getPlayerTowns('blue')[0];
    const player = world.getPlayer('blue');
    if (!town) return;

    H.drawTownPanorama(ctx, town, 0, 16, H.W, 336, ui.hoverBuildingId);
    renderResourceBar(ctx, player, world, ui.hoverText || ui.statusText);

    H.drawMarbleFrame(ctx, 0, 352, H.W, 112, '#241c16');
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 13px Tahoma, sans-serif';
    ctx.fillText(`${town.name} (${H.FACTIONS[town.faction].name})`, 12, 372);
    ctx.fillStyle = '#dcdce8';
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillText(`Доход: ${H.townDailyIncome(town)} зол./день`, 12, 390);

    const visiting = world.getHeroAt(town.x, town.y);
    const hasGarrisonUnits = H.countArmyStacks(town.garrison) > 0;
    if (visiting && visiting.owner === town.owner && hasGarrisonUnits) {
      drawButton(ctx, [234, 362, 124, 24], 'Гарнизон -> Герою', false, false);
    }

    drawButton(ctx, [12, 398, 118, 26], 'Строить здание', false, town.builtToday);
    drawButton(ctx, [12, 428, 118, 26], 'Нанять отряды', false);

    drawButton(ctx, [136, 398, 112, 26], 'Таверна (Герой)', false, !town.buildings.tavern);
    drawButton(ctx, [136, 428, 112, 26], 'Гильдия Магов', false, H.townMageGuildLevel(town) < 1);

    drawButton(ctx, [254, 398, 104, 26], 'Сводка воров', false, !town.buildings.thieves_guild);
    drawButton(ctx, [254, 428, 104, 26], 'Выход (Esc)', true);

    ctx.fillStyle = '#e8d8b0';
    ctx.font = 'bold 10px Tahoma, sans-serif';
    ctx.fillText('Гарнизон замка:', 370, 368);
    for (let i = 0; i < H.ARMY_SLOTS; i++) {
      const sx = 370 + i * 50;
      const sy = 372;
      const s = town.garrison[i];
      const sel = ui.townSlotSel && ui.townSlotSel.holder === 'garrison' && ui.townSlotSel.slot === i;
      H.drawMarbleFrame(ctx, sx, sy, 46, 38, sel ? '#785828' : '#18120e');
      if (s && s.count > 0) {
        H.drawUnitSprite(ctx, s.unit, sx + 8, sy + 2, 28, 24, false);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.count), sx + 23, sy + 35);
        ctx.textAlign = 'left';
      }
    }

    ctx.fillStyle = '#e8d8b0';
    ctx.fillText(visiting ? `Гость: ${visiting.name} (А:${visiting.atk} З:${visiting.def})` : 'Нет гостящего героя в воротах', 370, 422);
    for (let i = 0; i < H.ARMY_SLOTS; i++) {
      const sx = 370 + i * 50;
      const sy = 424;
      const s = visiting ? visiting.army[i] : null;
      const sel = ui.townSlotSel && ui.townSlotSel.holder === 'hero' && ui.townSlotSel.slot === i;
      H.drawMarbleFrame(ctx, sx, sy, 46, 38, sel ? '#785828' : '#18120e');
      if (s && s.count > 0) {
        H.drawUnitSprite(ctx, s.unit, sx + 8, sy + 2, 28, 24, false);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.count), sx + 23, sy + 35);
        ctx.textAlign = 'left';
      }
    }
  }

  function renderCombatScreen(ctx, ui) {
    const combat = ui.activeCombat || (ui.world && ui.world.activeCombat);
    if (!combat) return;

    const terr = H.TERRAINS[combat.terrain] || H.TERRAINS.grass;
    H.fillRect(ctx, 0, 0, H.W, H.H, '#1c1814');
    H.fillRect(ctx, 0, 64, H.W, 344, terr.color);

    H.drawMarbleFrame(ctx, 0, 0, H.W, 64, '#261e18');
    H.drawHeroPortrait(ctx, combat.attackerHero.id, 10, 8, 48, 48);
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText(combat.attackerHero.name, 66, 22);
    ctx.fillStyle = '#dcdce8';
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillText(`А:${combat.attackerHero.atk} З:${combat.attackerHero.def} С:${combat.attackerHero.power} Зн:${combat.attackerHero.knowledge}`, 66, 38);
    ctx.fillStyle = combat.attackerHero.hasSpellbook && !combat.castUsed.attacker ? '#78e888' : '#989088';
    ctx.font = '10px Tahoma, sans-serif';
    ctx.fillText(combat.attackerHero.hasSpellbook ? (combat.castUsed.attacker ? 'Книга чар: исп.' : 'Книга чар: готова') : 'Без книги чар', 66, 53);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(combat.siege ? `ОСАДА ЗАМКА (Раунд ${combat.round})` : `ТАКТИЧЕСКИЙ БОЙ (Раунд ${combat.round})`, H.W >> 1, 24);
    if (combat.activeStack) {
      const act = combat.activeStack;
      ctx.fillStyle = act.side === 'attacker' ? '#88ff98' : '#ff9888';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      const shotTxt = act.ranged ? `, Выстр: ${act.shots}` : '';
      ctx.fillText(`Ходит: ${act.name} (${act.count}) [ОЗ:${act.topHp}/${act.maxHp}${shotTxt}]`, H.W >> 1, 42);
    }
    if (ui.pendingCombatSpell && H.SPELLS[ui.pendingCombatSpell]) {
      ctx.fillStyle = '#60d8ff';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillText(`Выберите цель для заклинания «${H.SPELLS[ui.pendingCombatSpell].name}» (Правый клик: отмена)`, H.W >> 1, 57);
    }

    ctx.textAlign = 'right';
    H.drawHeroPortrait(ctx, combat.defenderHero.id, H.W - 58, 8, 48, 48);
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.fillText(combat.defenderHero.name, H.W - 66, 22);
    ctx.fillStyle = '#dcdce8';
    ctx.font = '11px Tahoma, sans-serif';
    ctx.fillText(`А:${combat.defenderHero.atk} З:${combat.defenderHero.def} С:${combat.defenderHero.power} Зн:${combat.defenderHero.knowledge}`, H.W - 66, 38);
    ctx.textAlign = 'left';

    const reach = combat.activeStack && combat.activeStack.side === 'attacker' ? combat.getReachableCells(combat.activeStack) : [];

    for (let r = 0; r < H.BF_ROWS; r++) {
      for (let c = 0; c < H.BF_COLS; c++) {
        const cx = H.BF_X + c * H.BF_CELL_W;
        const cy = H.BF_Y + r * H.BF_CELL_H;

        if (combat.siege && c === 4 && !(r === 2 && combat.bridgeDown)) {
          H.fillRect(ctx, cx + 2, cy + 2, H.BF_CELL_W - 4, H.BF_CELL_H - 4, '#1b4f9c');
        }

        const isReach = reach.some(cell => cell.col === c && cell.row === r);
        if (isReach) {
          H.fillRect(ctx, cx + 2, cy + 2, H.BF_CELL_W - 4, H.BF_CELL_H - 4, 'rgba(92, 244, 104, 0.25)');
        }

        if (ui.hoverBfCell && ui.hoverBfCell.col === c && ui.hoverBfCell.row === r) {
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx + 2, cy + 2, H.BF_CELL_W - 4, H.BF_CELL_H - 4);
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
          ctx.strokeRect(cx, cy, H.BF_CELL_W, H.BF_CELL_H);
        }

        if (combat.siege && c === 5) {
          if (r === 2) {
            H.fillRect(ctx, cx - 6, cy + 4, 12, H.BF_CELL_H - 8, combat.bridgeDown ? '#8b5a2b' : '#525264');
          } else {
            const wHp = combat.walls[r] || 0;
            if (wHp > 0) {
              H.fillRect(ctx, cx - 6, cy + 2, 12, H.BF_CELL_H - 4, wHp === 2 ? '#b4b4c6' : '#6e6e82');
            }
          }
        }
      }
    }

    for (const ob of combat.obstacles || []) {
      const cx = H.BF_X + ob.col * H.BF_CELL_W;
      const cy = H.BF_Y + ob.row * H.BF_CELL_H;
      H.drawBlockedOverlay(ctx, combat.terrain, cx + 16, cy + 12);
    }

    for (const st of combat.stacks) {
      if (st.count <= 0) continue;
      const minCol = Math.min(st.headCol, st.tailCol);
      const cx = H.BF_X + minCol * H.BF_CELL_W;
      const cy = H.BF_Y + st.row * H.BF_CELL_H;
      const sw = st.wide ? H.BF_CELL_W * 2 : H.BF_CELL_W;

      if (combat.activeStack && combat.activeStack.uid === st.uid) {
        ctx.strokeStyle = '#ffe066';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 2, cy + 2, sw - 4, H.BF_CELL_H - 4);
        ctx.lineWidth = 1;
      }

      H.drawUnitSprite(ctx, st.unit, cx + 6, cy + 4, sw - 12, H.BF_CELL_H - 12, st.side === 'defender');

      const hasBuffs = Object.keys(st.buffs || {}).length > 0;
      const hasDebuffs = Object.keys(st.debuffs || {}).length > 0;
      if (hasBuffs) {
        H.fillRect(ctx, cx + 4, cy + 4, 8, 8, '#38d858');
      }
      if (hasDebuffs) {
        H.fillRect(ctx, cx + 14, cy + 4, 8, 8, '#d838d8');
      }
      if (st.defending) {
        H.fillRect(ctx, cx + 24, cy + 4, 8, 8, '#58a8ff');
      }

      const badgeX = H.BF_X + st.headCol * H.BF_CELL_W + H.BF_CELL_W - 28;
      const badgeY = cy + H.BF_CELL_H - 16;
      const hpRatio = Math.max(0, Math.min(1, st.topHp / (st.maxHp || 1)));
      H.fillRect(ctx, badgeX, badgeY - 4, 26, 3, '#221414');
      H.fillRect(ctx, badgeX, badgeY - 4, Math.round(26 * hpRatio), 3, hpRatio > 0.5 ? '#48dc58' : '#f48838');

      H.fillRect(ctx, badgeX, badgeY, 26, 13, st.side === 'attacker' ? '#183668' : '#681818');
      H.strokeBevel(ctx, badgeX, badgeY, 26, 13, '#d8c088', '#14100c');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(st.count), badgeX + 13, badgeY + 10);
      ctx.textAlign = 'left';
    }

    if (combat.fx && combat.fx.length > 0) {
      for (let i = combat.fx.length - 1; i >= 0; i--) {
        const fx = combat.fx[i];
        const fxX = H.BF_X + fx.col * H.BF_CELL_W + (H.BF_CELL_W >> 1);
        const fxY = H.BF_Y + fx.row * H.BF_CELL_H + 22 - Math.floor((40 - fx.ttl) * 0.4);
        ctx.fillStyle = '#140808';
        ctx.font = 'bold 11px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fx.text, fxX + 1, fxY + 1);
        ctx.fillStyle = '#ffdf58';
        ctx.fillText(fx.text, fxX, fxY);
        ctx.textAlign = 'left';
        fx.ttl--;
        if (fx.ttl <= 0) combat.fx.splice(i, 1);
      }
    }

    H.drawMarbleFrame(ctx, 0, 408, H.W, 72, '#241c16');
    drawButton(ctx, [12, 414, 118, 24], 'Книга чар (C)', !!ui.pendingCombatSpell, combat.castUsed.attacker || !combat.attackerHero.hasSpellbook);
    drawButton(ctx, [136, 414, 118, 24], 'Ждать (W)', false, !combat.activeStack || combat.activeStack.waitedThisRound);
    drawButton(ctx, [260, 414, 118, 24], 'Оборона (D)', false);
    drawButton(ctx, [384, 414, 118, 24], 'Автобой (A)', false);
    drawButton(ctx, [508, 414, 118, 24], 'Бегство (R)', false);

    const logs = combat.log.slice(-2);
    ctx.fillStyle = '#f6dfc0';
    ctx.font = '11px Tahoma, sans-serif';
    if (logs[0]) ctx.fillText(logs[0], 12, 452);
    const bottomLine = ui.hoverText || logs[1] || '';
    ctx.fillStyle = ui.hoverText ? '#ffe066' : '#f6dfc0';
    if (bottomLine) ctx.fillText(bottomLine, 12, 468);
  }

  function renderModalOverlay(ctx, ui) {
    if (!ui.modal) return;
    const m = ui.modal;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, H.W, H.H);

    const mw = m.w || 460;
    const mh = m.h || 320;
    const mx = (H.W - mw) >> 1;
    const my = (H.H - mh) >> 1;

    H.drawMarbleFrame(ctx, mx, my, mw, mh, '#281e16');

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.title || 'Сообщение', mx + (mw >> 1), my + 26);
    ctx.textAlign = 'left';

    if (m.lines) {
      ctx.fillStyle = '#f6e8c8';
      ctx.font = '12px Tahoma, sans-serif';
      for (let i = 0; i < m.lines.length; i++) {
        ctx.fillText(m.lines[i], mx + 20, my + 52 + i * 19);
      }
    }

    if (typeof m.customDraw === 'function') {
      m.customDraw(ctx, mx, my, mw, mh);
    }

    if (m.buttons) {
      for (const b of m.buttons) {
        drawButton(ctx, [mx + b.x, my + b.y, b.w, b.h], b.label, !!b.primary, !!b.disabled);
      }
    }
  }

  Object.assign(H, {
    drawButton,
    renderResourceBar,
    renderMenuScreen,
    renderAdventureScreen,
    renderMinimap,
    renderSidebar,
    renderTownScreen,
    renderCombatScreen,
    renderModalOverlay
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
