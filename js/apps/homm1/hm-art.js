(function (H) {
  'use strict';

  function fillRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function strokeBevel(ctx, x, y, w, h, light, dark) {
    ctx.fillStyle = light || '#e8d8b0';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = dark || '#3a2818';
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  function drawMarbleFrame(ctx, x, y, w, h, darkBg) {
    fillRect(ctx, x, y, w, h, darkBg || '#2c241e');
    strokeBevel(ctx, x, y, w, h, '#d8c088', '#18120e');
    strokeBevel(ctx, x + 2, y + 2, w - 4, h - 4, '#987c48', '#443422');
  }

  function drawTerrainTile(ctx, terrainId, x, y, tx, ty, tick) {
    const t = H.TERRAINS[terrainId] || H.TERRAINS.grass;
    fillRect(ctx, x, y, 32, 32, t.color);
    const hVal = H.hash2(tx || 0, ty || 0, 17);
    const hVal2 = H.hash2(tx || 0, ty || 0, 53);

    if (terrainId === 'water') {
      const shift = ((tick || 0) >> 3) % 8;
      ctx.fillStyle = '#2868c4';
      ctx.fillRect(x + ((4 + shift) % 24), y + 6, 8, 2);
      ctx.fillRect(x + ((14 - shift + 24) % 24), y + 18, 10, 2);
      ctx.fillStyle = '#78b8ff';
      ctx.fillRect(x + ((6 + shift) % 24), y + 5, 4, 1);
      ctx.fillRect(x + ((16 - shift + 24) % 24), y + 17, 5, 1);
      return;
    }

    if (terrainId === 'road') {
      fillRect(ctx, x, y, 32, 32, '#387c2b');
      fillRect(ctx, x + 6, y + 6, 20, 20, '#9c8256');
      ctx.fillStyle = '#b89e70';
      ctx.fillRect(x + 8, y + 8, 7, 6);
      ctx.fillRect(x + 17, y + 9, 6, 6);
      ctx.fillRect(x + 9, y + 17, 7, 6);
      ctx.fillRect(x + 18, y + 17, 6, 6);
      ctx.fillStyle = '#745e3c';
      ctx.fillRect(x + 15, y + 8, 2, 16);
      ctx.fillRect(x + 8, y + 15, 16, 2);
      return;
    }

    if (terrainId === 'grass') {
      ctx.fillStyle = '#2b6420';
      const gx = x + 4 + ((hVal * 18) | 0);
      const gy = y + 5 + ((hVal2 * 18) | 0);
      ctx.fillRect(gx, gy, 3, 2);
      ctx.fillRect(gx + 5, gy + 3, 4, 2);
      ctx.fillStyle = '#52a442';
      ctx.fillRect(x + 6 + ((hVal2 * 14) | 0), y + 4 + ((hVal * 16) | 0), 3, 2);
      if (hVal > 0.72) {
        ctx.fillStyle = '#ffe058';
        ctx.fillRect(gx + 2, gy - 1, 2, 2);
      }
      return;
    }

    if (terrainId === 'dirt') {
      ctx.fillStyle = '#5e4226';
      ctx.fillRect(x + 5 + ((hVal * 16) | 0), y + 7 + ((hVal2 * 14) | 0), 5, 3);
      ctx.fillStyle = '#98724a';
      ctx.fillRect(x + 8 + ((hVal2 * 14) | 0), y + 4 + ((hVal * 18) | 0), 4, 2);
      return;
    }

    if (terrainId === 'desert') {
      ctx.fillStyle = '#b8903c';
      ctx.fillRect(x + 3, y + 10 + ((hVal * 6) | 0), 24, 2);
      ctx.fillRect(x + 6, y + 22 - ((hVal2 * 5) | 0), 20, 2);
      ctx.fillStyle = '#f0cf7a';
      ctx.fillRect(x + 4, y + 9 + ((hVal * 6) | 0), 22, 1);
      return;
    }

    if (terrainId === 'snow') {
      ctx.fillStyle = '#b8cce0';
      ctx.fillRect(x + 4 + ((hVal * 14) | 0), y + 8 + ((hVal2 * 14) | 0), 8, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6 + ((hVal2 * 14) | 0), y + 6 + ((hVal * 14) | 0), 6, 2);
      return;
    }

    if (terrainId === 'swamp') {
      ctx.fillStyle = '#1d3828';
      ctx.fillRect(x + 4, y + 12, 12, 6);
      ctx.fillStyle = '#487848';
      ctx.fillRect(x + 18, y + 6, 2, 8);
      ctx.fillRect(x + 21, y + 8, 2, 6);
      return;
    }

    if (terrainId === 'lava') {
      ctx.fillStyle = '#2c1814';
      ctx.fillRect(x + 3, y + 4, 10, 8);
      ctx.fillRect(x + 16, y + 16, 12, 10);
      ctx.fillStyle = '#e85820';
      ctx.fillRect(x + 6, y + 14, 16, 2);
      ctx.fillRect(x + 14, y + 6, 2, 14);
      ctx.fillStyle = '#ffc838';
      ctx.fillRect(x + 10, y + 14, 6, 1);
    }
  }

  function drawBlockedOverlay(ctx, terrainId, x, y) {
    if (terrainId === 'lava' || terrainId === 'dirt' || terrainId === 'desert') {
      ctx.fillStyle = '#4a382c';
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 28);
      ctx.lineTo(x + 12, y + 6);
      ctx.lineTo(x + 21, y + 28);
      ctx.fill();
      ctx.fillStyle = '#685242';
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 28);
      ctx.lineTo(x + 22, y + 9);
      ctx.lineTo(x + 30, y + 28);
      ctx.fill();
      ctx.fillStyle = '#9a826c';
      ctx.fillRect(x + 11, y + 8, 2, 6);
      ctx.fillRect(x + 21, y + 11, 2, 5);
    } else {
      ctx.fillStyle = '#4a2e18';
      ctx.fillRect(x + 13, y + 20, 5, 9);
      ctx.fillStyle = terrainId === 'snow' ? '#487868' : '#1e521c';
      ctx.beginPath();
      ctx.arc(x + 15, y + 15, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = terrainId === 'snow' ? '#e8f4ff' : '#388834';
      ctx.beginPath();
      ctx.arc(x + 13, y + 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function getPlayerHex(owner) {
    if (!owner) return '#a8a8b8';
    const col = H.PLAYER_COLORS.find(c => c.id === owner);
    return col ? col.hex : '#a8a8b8';
  }

  function drawOwnerFlag(ctx, x, y, owner) {
    const hex = getPlayerHex(owner);
    ctx.fillStyle = '#e8d8b8';
    ctx.fillRect(x, y, 2, 12);
    ctx.fillStyle = hex;
    ctx.fillRect(x + 2, y, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y + 1, 2, 2);
  }

  function drawTownOnMap(ctx, town, x, y) {
    const hasCastle = !!(town.buildings && town.buildings.castle);
    const fColor = town.faction === 'knight' ? '#3868b8' :
      town.faction === 'barbarian' ? '#a85828' :
      town.faction === 'sorceress' ? '#289858' : '#683898';

    fillRect(ctx, x + 2, y + 18, 28, 12, '#787068');
    if (hasCastle) {
      fillRect(ctx, x + 3, y + 8, 6, 20, '#b8b0a4');
      fillRect(ctx, x + 23, y + 8, 6, 20, '#b8b0a4');
      fillRect(ctx, x + 10, y + 5, 12, 23, '#d0c8bc');
      fillRect(ctx, x + 2, y + 5, 8, 4, fColor);
      fillRect(ctx, x + 22, y + 5, 8, 4, fColor);
      fillRect(ctx, x + 9, y + 2, 14, 4, fColor);
    } else {
      fillRect(ctx, x + 6, y + 12, 20, 14, '#b89464');
      fillRect(ctx, x + 4, y + 9, 24, 5, fColor);
    }
    fillRect(ctx, x + 13, y + 20, 6, 10, '#2a1c12');
    drawOwnerFlag(ctx, x + 20, y + 2, town.owner);
  }

  function drawMineOnMap(ctx, mine, x, y) {
    const resDef = H.RESOURCES[mine.res] || H.RESOURCES.gold;
    fillRect(ctx, x + 4, y + 10, 24, 18, '#5a4634');
    fillRect(ctx, x + 8, y + 14, 16, 14, '#1a1410');
    fillRect(ctx, x + 6, y + 10, 20, 3, '#8b5a2b');
    fillRect(ctx, x + 11, y + 19, 10, 7, resDef.color);
    drawOwnerFlag(ctx, x + 4, y + 2, mine.owner);
  }

  function drawMapObject(ctx, obj, x, y) {
    switch (obj.type) {
      case 'chest':
        fillRect(ctx, x + 7, y + 12, 18, 13, '#8b5a2b');
        strokeBevel(ctx, x + 7, y + 12, 18, 13, '#c89050', '#3a2010');
        fillRect(ctx, x + 7, y + 16, 18, 2, '#d8b028');
        fillRect(ctx, x + 14, y + 15, 4, 5, '#ffd700');
        break;
      case 'campfire':
        fillRect(ctx, x + 8, y + 21, 16, 4, '#5e3e28');
        fillRect(ctx, x + 10, y + 11, 12, 10, '#e84820');
        fillRect(ctx, x + 12, y + 13, 8, 7, '#ffa828');
        fillRect(ctx, x + 14, y + 15, 4, 4, '#fff080');
        break;
      case 'resource_pile': {
        const r = H.RESOURCES[obj.res] || H.RESOURCES.gold;
        fillRect(ctx, x + 5, y + 16, 22, 11, '#261c14');
        if (obj.res === 'wood') {
          fillRect(ctx, x + 6, y + 18, 20, 4, '#7a4a24');
          fillRect(ctx, x + 8, y + 14, 16, 4, '#9c6234');
          fillRect(ctx, x + 10, y + 11, 12, 3, '#b87a44');
        } else if (obj.res === 'ore') {
          fillRect(ctx, x + 7, y + 15, 18, 10, '#6e727c');
          fillRect(ctx, x + 10, y + 11, 12, 6, '#989ca8');
          fillRect(ctx, x + 12, y + 13, 4, 4, '#c8ccd8');
        } else {
          fillRect(ctx, x + 7, y + 14, 18, 11, r.color);
          strokeBevel(ctx, x + 7, y + 14, 18, 11, '#ffffff', '#222222');
          fillRect(ctx, x + 11, y + 11, 10, 5, r.color);
          fillRect(ctx, x + 13, y + 12, 3, 3, '#ffffff');
        }
        break;
      }
      case 'artifact':
        fillRect(ctx, x + 10, y + 20, 12, 6, '#888898');
        fillRect(ctx, x + 11, y + 9, 10, 11, '#ffd700');
        fillRect(ctx, x + 13, y + 11, 6, 6, '#40a0ff');
        break;
      case 'obelisk':
        fillRect(ctx, x + 9, y + 24, 14, 5, '#686878');
        fillRect(ctx, x + 12, y + 4, 8, 20, '#9898a8');
        fillRect(ctx, x + 14, y + 8, 4, 12, '#60d8ff');
        break;
      case 'windmill':
        fillRect(ctx, x + 10, y + 10, 12, 18, '#c8b898');
        fillRect(ctx, x + 9, y + 7, 14, 4, '#883828');
        ctx.strokeStyle = '#f0e6d2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + 28, y + 24);
        ctx.moveTo(x + 28, y + 4);
        ctx.lineTo(x + 4, y + 24);
        ctx.stroke();
        break;
      case 'water_wheel':
        fillRect(ctx, x + 6, y + 10, 14, 16, '#8b5a2b');
        ctx.strokeStyle = '#d2a274';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 22, y + 19, 6, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'gazebo':
        fillRect(ctx, x + 7, y + 22, 18, 5, '#dcdce8');
        fillRect(ctx, x + 9, y + 12, 3, 10, '#b4b4c6');
        fillRect(ctx, x + 20, y + 12, 3, 10, '#b4b4c6');
        fillRect(ctx, x + 7, y + 7, 18, 6, '#80bcff');
        break;
      case 'fort':
        fillRect(ctx, x + 5, y + 10, 22, 18, '#8e8ea2');
        fillRect(ctx, x + 5, y + 7, 5, 4, '#b4b4c6');
        fillRect(ctx, x + 13, y + 7, 6, 4, '#b4b4c6');
        fillRect(ctx, x + 22, y + 7, 5, 4, '#b4b4c6');
        fillRect(ctx, x + 13, y + 16, 6, 12, '#482818');
        break;
      case 'canyon':
        fillRect(ctx, x + 5, y + 8, 22, 18, '#5a2a88');
        fillRect(ctx, x + 10, y + 12, 12, 10, '#c68cff');
        break;
      case 'xanadu':
        fillRect(ctx, x + 5, y + 12, 22, 16, '#f4c842');
        fillRect(ctx, x + 10, y + 5, 12, 8, '#4080dc');
        break;
      case 'shrine':
        fillRect(ctx, x + 8, y + 16, 16, 10, '#b4b4c6');
        fillRect(ctx, x + 12, y + 8, 8, 8, '#ac68ec');
        break;
      case 'fountain':
        fillRect(ctx, x + 6, y + 18, 20, 8, '#b4b4c6');
        fillRect(ctx, x + 13, y + 7, 6, 12, '#5ca0f4');
        break;
      case 'temple':
        fillRect(ctx, x + 6, y + 8, 20, 18, '#eef6ff');
        fillRect(ctx, x + 12, y + 10, 8, 8, '#ffd700');
        break;
      case 'oasis':
      case 'watering_hole':
        fillRect(ctx, x + 5, y + 16, 22, 10, '#2e64b4');
        fillRect(ctx, x + 8, y + 6, 3, 12, '#7a5236');
        fillRect(ctx, x + 4, y + 4, 11, 5, '#389634');
        break;
      case 'watchtower':
      case 'observatory':
        fillRect(ctx, x + 11, y + 4, 10, 24, '#7a5236');
        fillRect(ctx, x + 9, y + 4, 14, 6, '#dca82e');
        break;
      case 'lighthouse':
        fillRect(ctx, x + 11, y + 5, 10, 23, '#ffffff');
        fillRect(ctx, x + 11, y + 11, 10, 5, '#dc4242');
        fillRect(ctx, x + 12, y + 2, 8, 4, '#ffe066');
        drawOwnerFlag(ctx, x + 4, y + 4, obj.owner);
        break;
      case 'graveyard':
        fillRect(ctx, x + 5, y + 16, 22, 10, '#3a3a4a');
        fillRect(ctx, x + 8, y + 10, 5, 12, '#8e8ea2');
        fillRect(ctx, x + 18, y + 11, 5, 11, '#8e8ea2');
        break;
      case 'shipwreck':
        fillRect(ctx, x + 5, y + 14, 22, 10, '#5e3e28');
        fillRect(ctx, x + 14, y + 6, 3, 12, '#986a46');
        break;
      case 'daemon_cave':
        fillRect(ctx, x + 5, y + 8, 22, 20, '#481010');
        fillRect(ctx, x + 10, y + 14, 12, 14, '#14141c');
        fillRect(ctx, x + 10, y + 11, 3, 3, '#ff8888');
        fillRect(ctx, x + 19, y + 11, 3, 3, '#ff8888');
        break;
      case 'dragon_utopia':
        fillRect(ctx, x + 4, y + 6, 24, 22, '#2c1444');
        fillRect(ctx, x + 8, y + 4, 16, 6, '#ffd700');
        fillRect(ctx, x + 12, y + 14, 8, 14, '#8c2222');
        break;
      case 'sphinx':
        fillRect(ctx, x + 5, y + 15, 22, 11, '#dca82e');
        fillRect(ctx, x + 9, y + 7, 12, 10, '#f4c842');
        fillRect(ctx, x + 11, y + 9, 8, 6, '#2e64b4');
        break;
      case 'teleporter':
        fillRect(ctx, x + 7, y + 5, 18, 23, '#525264');
        fillRect(ctx, x + 11, y + 9, 10, 15, '#48acac');
        break;
      case 'signpost':
        fillRect(ctx, x + 14, y + 10, 4, 18, '#7a5236');
        fillRect(ctx, x + 7, y + 10, 18, 6, '#d2a274');
        break;
      case 'monster':
        drawUnitSprite(ctx, obj.unit || 'goblin', x + 2, y + 1, 28, 26, false);
        fillRect(ctx, x + 14, y + 21, 17, 10, '#5a1212');
        strokeBevel(ctx, x + 14, y + 21, 17, 10, '#ff9888', '#220606');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(obj.count || 1), x + 22, y + 29);
        ctx.textAlign = 'left';
        break;
      default:
        fillRect(ctx, x + 8, y + 8, 16, 16, '#dca82e');
        break;
    }
  }

  function drawBoatOnMap(ctx, x, y, occupied, owner) {
    fillRect(ctx, x + 4, y + 18, 24, 8, '#7a5236');
    fillRect(ctx, x + 15, y + 5, 2, 14, '#d2a274');
    fillRect(ctx, x + 8, y + 6, 16, 11, '#ffffff');
    if (occupied && owner) {
      drawOwnerFlag(ctx, x + 17, y + 3, owner);
    }
  }

  function drawHeroOnMap(ctx, hero, x, y, isSelected) {
    if (hero.inBoat) {
      drawBoatOnMap(ctx, x, y, true, hero.owner);
    } else {
      const hex = getPlayerHex(hero.owner);
      fillRect(ctx, x + 6, y + 17, 18, 9, '#7a5236');
      fillRect(ctx, x + 21, y + 13, 6, 7, '#5e3e28');
      fillRect(ctx, x + 7, y + 25, 3, 5, '#442c1c');
      fillRect(ctx, x + 19, y + 25, 3, 5, '#442c1c');
      fillRect(ctx, x + 11, y + 8, 8, 10, hex);
      fillRect(ctx, x + 13, y + 4, 5, 5, '#eac296');
      drawOwnerFlag(ctx, x + 4, y + 3, hero.owner);
    }
    if (isSelected) {
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, 30, 30);
    }
  }

  function drawHeroPortrait(ctx, heroOrId, x, y, w, h) {
    const id = typeof heroOrId === 'string' ? heroOrId : (heroOrId && heroOrId.id);
    const prof = H.HERO_PROFILES[id] || H.HERO_PROFILE_LIST[0];
    const sky = prof.faction === 'warlock' ? '#2c1444' :
      prof.faction === 'barbarian' ? '#683818' :
      prof.faction === 'sorceress' ? '#184c38' : '#183668';
    fillRect(ctx, x, y, w, h, sky);

    const cx = x + (w >> 1);
    const cy = y + (h >> 1);
    fillRect(ctx, x + 6, cy + 8, w - 12, h - (cy - y) - 8, prof.armor || '#3868b8');
    fillRect(ctx, cx - 11, cy - 14, 22, 18, prof.hair || '#b88848');
    fillRect(ctx, cx - 8, cy - 10, 16, 16, '#eac296');
    fillRect(ctx, cx - 5, cy - 5, 3, 3, '#14141c');
    fillRect(ctx, cx + 2, cy - 5, 3, 3, '#14141c');
    fillRect(ctx, cx - 3, cy + 2, 6, 2, '#985236');

    if (prof.faction === 'knight') {
      fillRect(ctx, cx - 9, cy - 15, 18, 5, '#dcdce8');
    } else if (prof.faction === 'barbarian') {
      fillRect(ctx, cx - 12, cy - 15, 4, 6, '#fff2dc');
      fillRect(ctx, cx + 8, cy - 15, 4, 6, '#fff2dc');
    } else if (prof.faction === 'sorceress') {
      fillRect(ctx, cx - 8, cy - 13, 16, 3, '#ffd700');
    } else {
      fillRect(ctx, cx - 10, cy - 16, 20, 4, '#904cd0');
    }

    strokeBevel(ctx, x, y, w, h, '#d8c088', '#18120e');
  }

  function drawUnitSprite(ctx, unitId, x, y, w, h, flipX) {
    const u = H.UNITS[unitId] || H.UNITS.peasant;
    ctx.save();
    if (flipX) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    const p1 = (u.colors && u.colors[0]) || u.color || '#b88848';
    const p2 = (u.colors && u.colors[1]) || H.shade(p1, -0.35);
    const p3 = (u.colors && u.colors[2]) || H.shade(p1, 0.42);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + Math.floor(w * 0.15), y + h - 5, Math.floor(w * 0.7), 4);

    if (u.flying) {
      ctx.fillStyle = u.id === 'phoenix' ? '#ff9824' : (u.id === 'dragon' ? '#4a1868' : p2);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.45, y + h * 0.48);
      ctx.lineTo(x + w * 0.06, y + h * 0.08);
      ctx.lineTo(x + w * 0.24, y + h * 0.64);
      ctx.fill();
    }

    if (u.wide) {
      fillRect(ctx, x + Math.floor(w * 0.16), y + Math.floor(h * 0.44), Math.floor(w * 0.58), Math.floor(h * 0.34), p1);
      strokeBevel(ctx, x + Math.floor(w * 0.16), y + Math.floor(h * 0.44), Math.floor(w * 0.58), Math.floor(h * 0.34), p3, p2);
      fillRect(ctx, x + Math.floor(w * 0.2), y + Math.floor(h * 0.76), 6, Math.floor(h * 0.17), p2);
      fillRect(ctx, x + Math.floor(w * 0.34), y + Math.floor(h * 0.76), 5, Math.floor(h * 0.17), p2);
      fillRect(ctx, x + Math.floor(w * 0.54), y + Math.floor(h * 0.76), 5, Math.floor(h * 0.17), p2);
      fillRect(ctx, x + Math.floor(w * 0.66), y + Math.floor(h * 0.76), 6, Math.floor(h * 0.17), p2);
      fillRect(ctx, x + Math.floor(w * 0.56), y + Math.floor(h * 0.18), Math.floor(w * 0.26), Math.floor(h * 0.3), p1);
      fillRect(ctx, x + Math.floor(w * 0.72), y + Math.floor(h * 0.22), 4, 4, u.id === 'dragon' ? '#ff3824' : '#ffffff');
      fillRect(ctx, x + Math.floor(w * 0.08), y + Math.floor(h * 0.48), Math.floor(w * 0.1), Math.floor(h * 0.18), p2);
      if (u.id === 'dragon') {
        fillRect(ctx, x + Math.floor(w * 0.54), y + Math.floor(h * 0.1), 5, 8, '#ffd700');
        fillRect(ctx, x + Math.floor(w * 0.64), y + Math.floor(h * 0.1), 5, 8, '#ffd700');
        fillRect(ctx, x + Math.floor(w * 0.8), y + Math.floor(h * 0.28), 6, 4, '#ff6820');
      } else if (u.id === 'hydra') {
        fillRect(ctx, x + Math.floor(w * 0.38), y + Math.floor(h * 0.12), Math.floor(w * 0.15), Math.floor(h * 0.34), p3);
        fillRect(ctx, x + Math.floor(w * 0.22), y + Math.floor(h * 0.2), Math.floor(w * 0.14), Math.floor(h * 0.28), p2);
        fillRect(ctx, x + Math.floor(w * 0.48), y + Math.floor(h * 0.16), 3, 3, '#ff2828');
        fillRect(ctx, x + Math.floor(w * 0.3), y + Math.floor(h * 0.24), 3, 3, '#ff2828');
      } else if (u.id === 'cavalry') {
        fillRect(ctx, x + Math.floor(w * 0.34), y + Math.floor(h * 0.12), Math.floor(w * 0.2), Math.floor(h * 0.34), '#dcdce8');
        fillRect(ctx, x + Math.floor(w * 0.38), y + Math.floor(h * 0.06), 10, 6, '#ffe066');
        fillRect(ctx, x + Math.floor(w * 0.48), y + Math.floor(h * 0.28), Math.floor(w * 0.42), 3, '#e8eef8');
      } else if (u.id === 'unicorn') {
        fillRect(ctx, x + Math.floor(w * 0.78), y + Math.floor(h * 0.1), 8, 4, '#ffd700');
      }
    } else {
      fillRect(ctx, x + Math.floor(w * 0.3), y + Math.floor(h * 0.34), Math.floor(w * 0.38), Math.floor(h * 0.42), p1);
      strokeBevel(ctx, x + Math.floor(w * 0.3), y + Math.floor(h * 0.34), Math.floor(w * 0.38), Math.floor(h * 0.42), p3, p2);
      fillRect(ctx, x + Math.floor(w * 0.34), y + Math.floor(h * 0.75), 6, Math.floor(h * 0.18), p2);
      fillRect(ctx, x + Math.floor(w * 0.54), y + Math.floor(h * 0.75), 6, Math.floor(h * 0.18), p2);
      fillRect(ctx, x + Math.floor(w * 0.35), y + Math.floor(h * 0.13), Math.floor(w * 0.28), Math.floor(h * 0.22), p3);
      fillRect(ctx, x + Math.floor(w * 0.54), y + Math.floor(h * 0.2), 3, 3, u.id === 'cyclops' ? '#ff2020' : '#14141c');
      if (u.id === 'paladin') {
        fillRect(ctx, x + Math.floor(w * 0.44), y + Math.floor(h * 0.38), 4, Math.floor(h * 0.32), '#ffd700');
        fillRect(ctx, x + Math.floor(w * 0.36), y + Math.floor(h * 0.48), Math.floor(w * 0.26), 4, '#ffd700');
        fillRect(ctx, x + Math.floor(w * 0.38), y + Math.floor(h * 0.06), 10, 7, '#ff3838');
      } else if (u.id === 'minotaur') {
        fillRect(ctx, x + Math.floor(w * 0.28), y + Math.floor(h * 0.06), 5, 7, '#fff2dc');
        fillRect(ctx, x + Math.floor(w * 0.6), y + Math.floor(h * 0.06), 5, 7, '#fff2dc');
      } else if (u.id === 'swordsman' || u.id === 'pikeman') {
        fillRect(ctx, x + Math.floor(w * 0.22), y + Math.floor(h * 0.38), 8, Math.floor(h * 0.28), '#2858a8');
        strokeBevel(ctx, x + Math.floor(w * 0.22), y + Math.floor(h * 0.38), 8, Math.floor(h * 0.28), '#ffd700', '#142852');
      }
    }

    if (u.ranged) {
      ctx.strokeStyle = '#ffd868';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w * 0.72, y + h * 0.48, h * 0.22, -1.1, 1.1);
      ctx.stroke();
    } else if (!u.wide) {
      fillRect(ctx, x + Math.floor(w * 0.72), y + Math.floor(h * 0.22), 4, Math.floor(h * 0.48), '#e8eef8');
    }

    ctx.restore();
  }

  function drawTownPanorama(ctx, town, x, y, w, h, hoveredBuildingId) {
    const fac = town.faction;
    const skyColor = fac === 'knight' ? '#4080dc' :
      fac === 'barbarian' ? '#b4622e' :
      fac === 'sorceress' ? '#2e8878' : '#2c1444';
    const groundColor = fac === 'knight' ? '#387834' :
      fac === 'barbarian' ? '#7a5236' :
      fac === 'sorceress' ? '#2b5c28' : '#3a2420';

    fillRect(ctx, x, y, w, Math.floor(h * 0.55), skyColor);
    fillRect(ctx, x, y + Math.floor(h * 0.55), w, h - Math.floor(h * 0.55), groundColor);

    ctx.fillStyle = H.shade(groundColor, -0.25);
    ctx.beginPath();
    ctx.moveTo(x, y + Math.floor(h * 0.55));
    ctx.lineTo(x + 140, y + 70);
    ctx.lineTo(x + 310, y + Math.floor(h * 0.55));
    ctx.lineTo(x + 480, y + 60);
    ctx.lineTo(x + w, y + Math.floor(h * 0.55));
    ctx.fill();

    if (town.coastal) {
      fillRect(ctx, x + 460, y + 290, w - 460, h - 290, '#1b4f9c');
    }

    const allDefs = H.listTownBuildings(town.faction, town.coastal);
    for (const def of allDefs) {
      if (!def || !def.rect) continue;
      const isBuilt = !!(town.buildings && town.buildings[def.id]);
      if (!isBuilt && def.guildLevel && def.guildLevel > 1) continue;
      if (!isBuilt && def.guildLevel === 1 && (town.buildings.mage_guild_2 || town.buildings.mage_guild_3 || town.buildings.mage_guild_4)) continue;

      const [bx, by, bw, bh] = def.rect;
      const rx = x + bx;
      const ry = y + by;
      const isHovered = hoveredBuildingId === def.id;

      if (isBuilt) {
        const wallCol = def.tier ? '#d2a274' : (def.id === 'castle' ? '#dcdce8' : '#b4b4c6');
        const roofCol = fac === 'knight' ? '#2e64b4' :
          fac === 'barbarian' ? '#8c2222' :
          fac === 'sorceress' ? '#289838' : '#7438ac';

        fillRect(ctx, rx, ry + 14, bw, bh - 14, wallCol);
        fillRect(ctx, rx - 2, ry, bw + 4, 16, roofCol);
        strokeBevel(ctx, rx, ry + 14, bw, bh - 14, isHovered ? '#ffe066' : '#ffffff', '#262632');

        ctx.fillStyle = '#14141c';
        ctx.fillRect(rx + (bw >> 1) - 8, ry + bh - 18, 16, 18);

        if (def.tier && def.unit) {
          drawUnitSprite(ctx, def.unit, rx + (bw >> 1) - 14, ry + 16, 28, 26, false);
          const avail = (town.available && town.available[def.tier]) || 0;
          if (avail > 0) {
            fillRect(ctx, rx + bw - 26, ry + 16, 24, 13, '#1e5c24');
            strokeBevel(ctx, rx + bw - 26, ry + 16, 24, 13, '#88ff98', '#0a240c');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Tahoma, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+' + avail, rx + bw - 14, ry + 26);
          }
        }

        fillRect(ctx, rx + 2, ry + bh - 14, bw - 4, 13, 'rgba(20, 16, 12, 0.78)');
        ctx.fillStyle = isHovered ? '#ffe066' : '#fff6c4';
        ctx.font = 'bold 10px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(def.name, rx + (bw >> 1), ry + bh - 4);
      } else {
        ctx.strokeStyle = isHovered ? '#ffe066' : 'rgba(255, 240, 180, 0.42)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(rx, ry, bw, bh);
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        fillRect(ctx, rx + 4, ry + (bh >> 1) - 10, bw - 8, 16, 'rgba(18, 14, 10, 0.65)');
        ctx.fillStyle = isHovered ? '#ffe066' : 'rgba(255, 240, 180, 0.85)';
        ctx.font = '10px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(def.name, rx + (bw >> 1), ry + (bh >> 1) + 2);
      }
    }
    ctx.textAlign = 'left';
  }

  Object.assign(H, {
    fillRect,
    strokeBevel,
    drawMarbleFrame,
    drawTerrainTile,
    drawBlockedOverlay,
    getPlayerHex,
    drawOwnerFlag,
    drawTownOnMap,
    drawMineOnMap,
    drawMapObject,
    drawBoatOnMap,
    drawHeroOnMap,
    drawHeroPortrait,
    drawUnitSprite,
    drawTownPanorama
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
