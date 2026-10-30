(function (H) {
  'use strict';
  const T = 32, CH = 16, MD = H.MapData;
  const COLORS = {
    meadow: ['#4f7d3a', '#578742', '#477236'], steppe: ['#9a9a5a', '#a6a262', '#8e8c52'], palegrass: ['#b0b89a', '#bcc4a6', '#a4ac8e'],
    forest: ['#2f5a2a', '#376430', '#294f24'], swamp: ['#4a5a3a', '#3e4c34', '#566648'], sand: ['#d8c890', '#e2d49e', '#ccbc84'],
    saltflat: ['#e0e0d8', '#eaeae4', '#d2d2ca'], highland: ['#c8ccd2', '#d6dae0', '#b8bcc4'], ash: ['#5a5452', '#645e5c', '#4e4846'],
    lava: ['#c0401a', '#d8601a', '#a83012'], water: ['#2a5a8a', '#2f6294', '#26527e'], cave: ['#4a4038', '#54483e', '#3e362e'],
    fungal: ['#5a4a6a', '#665478', '#4e405e'], rock: ['#6a6460', '#5e5854', '#78726c']
  };
  const ROAD = [null, '#8a6a40', '#9a9488', '#e8e8f0'];
  const RES = { gold: '#f0c040', wood: '#8a5a2a', ore: '#8a8a92', salt: '#f4f4f0', amber: '#e09020', sulfur: '#e0e040', moonsilver: '#b8c8e8' };
  const hash = (c, r, k) => (((c * 73856093) ^ (r * 19349663) ^ ((k + 1) * 83492791)) >>> 0) % 1000 / 1000;

  const tile = (g, M, l, c, r, x, y) => {
    const t = MD.terrainAt(M, l, c, r), col = COLORS[t.id];
    g.fillStyle = col[Math.floor(hash(c, r, 0) * 3)];
    g.fillRect(x, y, T, T);
    for (let k = 0; k < 7; k++) {
      g.fillStyle = col[1 + (k % 2)];
      g.fillRect(x + Math.floor(hash(c, r, k + 3) * 30), y + Math.floor(hash(c, r, k + 11) * 30), 2, 2);
    }
    if (t.id === 'forest' || t.id === 'swamp') {
      g.fillStyle = t.id === 'forest' ? 'rgba(10,30,10,0.35)' : 'rgba(20,40,40,0.45)';
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.ellipse(x + 6 + hash(c, r, k + 20) * 20, y + 6 + hash(c, r, k + 30) * 20, 5, 3, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (const [dc, dr, ex, ey, ew, eh] of [[0, -1, 0, 0, T, 2], [0, 1, 0, T - 2, T, 2], [-1, 0, 0, 0, 2, T], [1, 0, T - 2, 0, 2, T]]) {
      const nc = c + dc, nr = r + dr;
      if (!MD.inside(M, nc, nr)) continue;
      const n = MD.terrainAt(M, l, nc, nr);
      if (n.id === t.id) continue;
      if (t.id === 'water' || n.id === 'water') g.fillStyle = t.id === 'water' ? 'rgba(200,230,255,0.45)' : 'rgba(20,40,60,0.35)';
      else if (n.id === 'rock' || t.id === 'rock') g.fillStyle = 'rgba(0,0,0,0.35)';
      else g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(x + ex, y + ey, ew, eh);
    }
  };

  const roadTile = (g, M, l, c, r, x, y) => {
    const kind = MD.roadAt(M, l, c, r);
    if (!kind) return;
    g.strokeStyle = ROAD[kind];
    g.lineWidth = 10;
    g.lineCap = 'round';
    let links = 0;
    for (const [dc, dr] of H.Path.DIRS) {
      const nc = c + dc, nr = r + dr;
      if (!MD.inside(M, nc, nr) || !MD.roadAt(M, l, nc, nr)) continue;
      if (dc && dr && (MD.roadAt(M, l, c + dc, r) || MD.roadAt(M, l, c, r + dr))) continue;
      links++;
      g.beginPath();
      g.moveTo(x + 16, y + 16);
      g.lineTo(x + 16 + dc * 16, y + 16 + dr * 16);
      g.stroke();
    }
    if (!links) {
      g.fillStyle = ROAD[kind];
      g.fillRect(x + 11, y + 11, 10, 10);
    }
  };

  const chunk = (cache, M, l, cx, cy) => {
    const key = l + ':' + cx + ':' + cy;
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas');
    cv.width = CH * T;
    cv.height = CH * T;
    const g = cv.getContext('2d');
    for (let r = cy * CH; r < Math.min(M.h, cy * CH + CH); r++) for (let c = cx * CH; c < Math.min(M.w, cx * CH + CH); c++) tile(g, M, l, c, r, (c - cx * CH) * T, (r - cy * CH) * T);
    for (let r = cy * CH; r < Math.min(M.h, cy * CH + CH); r++) for (let c = cx * CH; c < Math.min(M.w, cx * CH + CH); c++) roadTile(g, M, l, c, r, (c - cx * CH) * T, (r - cy * CH) * T);
    cache.set(key, cv);
    return cv;
  };

  const terrain = (g, cache, M, l, cam, view) => {
    const c0 = Math.floor(cam.x / (CH * T)), r0 = Math.floor(cam.y / (CH * T)), c1 = Math.floor((cam.x + view.w - 1) / (CH * T)), r1 = Math.floor((cam.y + view.h - 1) / (CH * T));
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= M.w || cy * CH >= M.h) continue;
      g.drawImage(chunk(cache, M, l, cx, cy), view.x + cx * CH * T - cam.x, view.y + cy * CH * T - cam.y);
    }
  };

  const flag = (g, x, y, color, t) => {
    g.fillStyle = '#4a3018';
    g.fillRect(x, y, 2, 22);
    g.fillStyle = color;
    const wave = Math.sin(t * 6 + x) * 1.5;
    g.beginPath();
    g.moveTo(x + 2, y);
    g.lineTo(x + 14, y + 3 + wave);
    g.lineTo(x + 2, y + 9);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 1;
    g.stroke();
  };

  const fortOf = o => [3, 2, 1].find(n => o.built.includes('fort' + n)) || 0;

  const town = (g, o, x, y, t, color) => {
    const pic = H.Art.image('townmap/' + o.faction + '-' + Math.max(1, fortOf(o)));
    if (pic) {
      g.drawImage(pic.img, x + 80 - pic.f.w / 2, y + 96 - pic.f.h, pic.f.w, pic.f.h);
      flag(g, x + 128, y - 40, color || '#e8e8e8', t);
      return;
    }
    const K = H.TownDraw.KINDS, L = H.TownDraw.LOOK[o.faction], lv = fortOf(o), o2 = { t };
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(x + 80, y + 90, 84, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.faction === 'league' ? '#8a7a5a' : '#c8bc94';
    g.fillRect(x + 6, y + 40, 148, 52);
    if (o.faction === 'league') {
      K.tower(g, L, x + 98, y - 30, 24, 84, o2);
      K.house(g, L, x + 12, y + 18, 40, 40, o2);
      K.hall(g, L, x + 50, y + 4, 52, 60, { t, level: o.built.includes('hall3') ? 3 : o.built.includes('hall2') ? 2 : 1 });
      K.house(g, L, x + 116, y + 26, 34, 34, o2);
    } else {
      K.mound(g, L, x + 92, y + 6, 58, 40, o2);
      K.yurt(g, L, x + 14, y + 22, 36, 34, o2);
      K.yurt(g, L, x + 54, y + 12, 44, 46, { t, level: o.built.includes('hall3') ? 3 : o.built.includes('hall2') ? 2 : 1 });
      K.idol(g, L, x + 128, y + 34, 16, 26, o2);
    }
    if (lv) {
      const wall = lv === 1 ? L.wood : L.stone, top = y + (lv === 3 ? 56 : 62);
      g.fillStyle = wall;
      g.strokeStyle = '#1a120a';
      for (const [wx, ww] of [[x + 4, 64], [x + 96, 60]]) {
        g.fillRect(wx, top, ww, y + 92 - top);
        g.strokeRect(wx + 0.5, top + 0.5, ww - 1, y + 92 - top - 1);
        if (lv === 1) for (let px = wx + 2; px < wx + ww - 2; px += 6) g.fillRect(px, top - 4, 3, 4);
        else for (let px = wx; px < wx + ww - 4; px += 10) g.fillRect(px, top - 5, 6, 5);
      }
      if (lv === 3) for (const tx of [x + 2, x + 146]) K.tower(g, L, tx, top - 22, 14, y + 92 - top + 22, o2);
    }
    g.fillStyle = '#1a1208';
    g.beginPath();
    g.moveTo(x + 68, y + 92);
    g.lineTo(x + 68, y + 72);
    g.arc(x + 80, y + 72, 12, Math.PI, 0);
    g.lineTo(x + 92, y + 92);
    g.closePath();
    g.fill();
    flag(g, x + 128, y - 40, color || '#e8e8e8', t);
  };

  const object = (g, o, x, y, t, ownerColor) => {
    const def = H.OBJ[o.t], w = def.foot[0] * T, h = def.foot[1] * T;
    g.save();
    g.lineWidth = 1;
    if (def.kind === 'town') town(g, o, x, y, t, ownerColor);
    else if (def.kind === 'shrine') {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(x + 32, y + 58, 30, 7, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#8a8a9a';
      g.strokeStyle = '#2a2a34';
      for (const px of [8, 46]) {
        g.fillRect(x + px, y + 14, 10, 44);
        g.strokeRect(x + px + 0.5, y + 14.5, 9, 43);
      }
      g.fillRect(x + 4, y + 8, 56, 8);
      g.strokeRect(x + 4.5, y + 8.5, 55, 7);
      const pulse = 0.35 + Math.sin(t * 3) * 0.15;
      g.fillStyle = 'rgba(150,190,255,' + pulse.toFixed(2) + ')';
      g.beginPath();
      g.arc(x + 32, y + 36, 11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8ecff';
      for (let k = 0; k < def.circle; k++) g.fillRect(x + 26 + k * 5, y + 11, 3, 3);
    } else if (def.kind === 'scroll') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 27, 11, 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8dcb8';
      g.strokeStyle = '#4a3a20';
      g.fillRect(x + 7, y + 12, 18, 12);
      g.strokeRect(x + 7.5, y + 12.5, 17, 11);
      g.fillStyle = o.spell ? H.SPELL_COLORS[H.SPELLS[o.spell].school] : '#a08a50';
      g.fillRect(x + 13, y + 15, 6, 6);
    } else if (def.kind === 'artifact') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 27, 12, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,240,170,' + (0.2 + Math.sin(t * 3) * 0.1).toFixed(2) + ')';
      g.beginPath();
      g.arc(x + 16, y + 15, 15, 0, Math.PI * 2);
      g.fill();
      H.Art.drawArtifact(g, o.art, x + 4, y + 3, 24);
    }
    else if (def.kind === 'mine') {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 4, w / 2, 7, 0, 0, Math.PI * 2);
      g.fill();
      if (o.t === 'sulfurspring') {
        g.fillStyle = '#8a7a30';
        g.beginPath();
        g.ellipse(x + w / 2, y + h - 18, 26, 14, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = RES.sulfur;
        g.beginPath();
        g.ellipse(x + w / 2, y + h - 18, 18, 9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(240,240,180,0.5)';
        for (let k = 0; k < 3; k++) g.fillRect(x + 22 + k * 8, y + h - 40 - ((t * 20 + k * 9) % 18), 3, 6);
      } else {
        g.fillStyle = '#6a5038';
        g.fillRect(x + 10, y + 18, w - 20, h - 22);
        g.strokeStyle = '#2a1a0a';
        g.strokeRect(x + 10.5, y + 18.5, w - 21, h - 23);
        g.fillStyle = '#8a3a2a';
        g.beginPath();
        g.moveTo(x + 4, y + 20);
        g.lineTo(x + w / 2, y + 2);
        g.lineTo(x + w - 4, y + 20);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = '#1a1208';
        g.fillRect(x + w / 2 - 8, y + h - 18, 16, 14);
        g.fillStyle = RES[def.res];
        g.beginPath();
        g.arc(x + w / 2, y + 30, 6, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      flag(g, x + w - 14, y - 8, ownerColor || '#e8e8e8', t);
    } else if (def.kind === 'pile') {
      for (const [dx, dy, rr] of [[10, 22, 7], [20, 23, 6], [15, 17, 6]]) {
        g.fillStyle = RES[def.res];
        g.beginPath();
        g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.55)';
        g.stroke();
      }
    } else if (def.kind === 'chest') {
      g.fillStyle = '#7a4a1a';
      g.fillRect(x + 6, y + 12, 20, 14);
      g.strokeStyle = '#2a1a0a';
      g.strokeRect(x + 6.5, y + 12.5, 19, 13);
      g.fillStyle = '#e0b040';
      g.fillRect(x + 6, y + 16, 20, 2);
      g.fillRect(x + 15, y + 15, 3, 5);
    } else if (def.kind === 'campfire') {
      g.fillStyle = '#5a3a1a';
      g.fillRect(x + 7, y + 22, 18, 4);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['#ff8020', '#ffc040', '#e04010'][k];
        const f = Math.sin(t * 10 + k * 2) * 2;
        g.beginPath();
        g.moveTo(x + 10 + k * 6, y + 22);
        g.lineTo(x + 13 + k * 6, y + 10 + f);
        g.lineTo(x + 16 + k * 6, y + 22);
        g.fill();
      }
    } else if (def.kind === 'monster') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 28, 12, 4, 0, 0, Math.PI * 2);
      g.fill();
      H.Art.drawUnit(g, o.unit, x + 16, y + 28, { scale: 0.62, tier: false, flip: true });
    } else if (o.t === 'tree' || o.t === 'pine') {
      g.fillStyle = '#4a2e1a';
      g.fillRect(x + 14, y + 18, 4, 12);
      g.fillStyle = o.t === 'pine' ? '#1f4a24' : '#3a7030';
      if (o.t === 'pine') {
        g.beginPath();
        g.moveTo(x + 16, y - 10);
        g.lineTo(x + 28, y + 22);
        g.lineTo(x + 4, y + 22);
        g.closePath();
        g.fill();
      } else {
        for (const [dx, dy, rr] of [[10, 10, 9], [22, 11, 9], [16, 2, 10]]) {
          g.beginPath();
          g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
          g.fill();
        }
      }
    } else if (o.t === 'rock') {
      g.fillStyle = '#7a746e';
      g.beginPath();
      g.moveTo(x + 4, y + 28);
      g.lineTo(x + 8, y + 12);
      g.lineTo(x + 20, y + 8);
      g.lineTo(x + 28, y + 28);
      g.closePath();
      g.fill();
      g.strokeStyle = '#3a3632';
      g.stroke();
    } else if (o.t === 'mountain') {
      g.fillStyle = '#6a6460';
      g.beginPath();
      g.moveTo(x, y + h);
      g.lineTo(x + w * 0.45, y - 24);
      g.lineTo(x + w, y + h);
      g.closePath();
      g.fill();
      g.strokeStyle = '#2a2622';
      g.stroke();
      g.fillStyle = '#eef0f4';
      g.beginPath();
      g.moveTo(x + w * 0.45, y - 24);
      g.lineTo(x + w * 0.58, y - 2);
      g.lineTo(x + w * 0.32, y - 2);
      g.closePath();
      g.fill();
    }
    g.restore();
  };

  const fighter = (g, B, side, t) => {
    const h = B.sides[side].hero;
    if (!h) return;
    const x = side ? H.W - 6 : 6;
    g.save();
    g.translate(x, 112);
    g.scale(side ? -1.3 : 1.3, 1.3);
    hero(g, { dir: 1 }, 0, 0, H.BattleDraw.SIDE[side], t);
    g.restore();
  };

  const hero = (g, h, x, y, color, t) => {
    g.save();
    g.translate(x + 16, y + 28);
    g.scale(h.dir < 0 ? -1 : 1, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6a4a2a';
    g.strokeStyle = '#2a1a0a';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, -10, 12, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    for (const lx of [-9, -5, 5, 9]) g.fillRect(lx - 1, -6, 2, 6);
    g.fillRect(10, -20, 4, 9);
    g.fillStyle = '#b89a6a';
    g.fillRect(-3, -24, 6, 12);
    g.fillStyle = '#e8c8a0';
    g.beginPath();
    g.arc(0, -27, 3.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
    flag(g, x + (h.dir < 0 ? 22 : 6), y - 10, color, t);
  };

  const steps = (g, plan, cam, view, font) => {
    if (!plan || !plan.steps.length) return;
    plan.steps.forEach((s, i) => {
      const x = view.x + s.c * T - cam.x + 16, y = view.y + s.r * T - cam.y + 16, last = i === plan.steps.length - 1;
      g.fillStyle = s.day === 0 ? '#50e050' : '#e8d040';
      g.strokeStyle = '#000';
      if (last) {
        g.beginPath();
        g.arc(x, y, 6, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      } else {
        g.fillRect(x - 3, y - 2, 4, 5);
        g.fillRect(x + 1, y - 4, 4, 5);
      }
      const dayEnd = last || plan.steps[i + 1].day !== s.day;
      if (dayEnd && (s.day > 0 || plan.steps.some(q => q.day > 0))) font(String(s.day + 1), x + 6, y - 14);
    });
  };

  const fog = (g, M, seen, vis, cam, view, pattern) => {
    const c0 = Math.max(0, Math.floor(cam.x / T)), r0 = Math.max(0, Math.floor(cam.y / T));
    const c1 = Math.min(M.w - 1, Math.floor((cam.x + view.w) / T)), r1 = Math.min(M.h - 1, Math.floor((cam.y + view.h) / T));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * M.w + c, x = view.x + c * T - cam.x, y = view.y + r * T - cam.y;
        if (!seen[i]) {
          g.fillStyle = '#000';
          g.fillRect(x, y, T, T);
        } else if (!vis[i]) {
          g.fillStyle = pattern;
          g.fillRect(x, y, T, T);
        }
      }
    }
    g.fillStyle = '#000';
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * M.w + c;
        if (!seen[i]) continue;
        const x = view.x + c * T - cam.x, y = view.y + r * T - cam.y;
        for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const nc = c + dc, nr = r + dr;
          if (!MD.inside(M, nc, nr) || seen[nr * M.w + nc]) continue;
          for (let k = 0; k < T; k += 4) {
            const off = Math.floor(hash(c, r, k) * 6);
            if (dr) g.fillRect(x + k, dr < 0 ? y : y + T - off, 4, off);
            else g.fillRect(dc < 0 ? x : x + T - off, y + k, off, 4);
          }
        }
      }
    }
  };

  const minimap = (S, l, pid, vis) => {
    const M = S.map, cv = document.createElement('canvas');
    cv.width = M.w;
    cv.height = M.h;
    const g = cv.getContext('2d'), img = g.createImageData(M.w, M.h), seen = S.players[pid].seen[l];
    for (let i = 0; i < M.w * M.h; i++) {
      const c = i % M.w, r = (i / M.w) | 0;
      let col = '#000000';
      if (seen[i]) col = MD.roadAt(M, l, c, r) ? ROAD[MD.roadAt(M, l, c, r)] : COLORS[MD.terrainAt(M, l, c, r).id][0];
      const n = parseInt(col.slice(1), 16), dim = seen[i] && !vis[i] ? 0.65 : 1;
      img.data[i * 4] = (n >> 16) * dim;
      img.data[i * 4 + 1] = ((n >> 8) & 255) * dim;
      img.data[i * 4 + 2] = (n & 255) * dim;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    for (const o of M.objs) {
      if (o.gone || o.l !== l) continue;
      const def = H.OBJ[o.t];
      if (def.kind === 'decor' || !seen[o.r * M.w + o.c]) continue;
      if (def.kind === 'monster' && !vis[o.r * M.w + o.c]) continue;
      g.fillStyle = def.kind === 'mine' || def.kind === 'town' ? (o.owner >= 0 ? H.PLAYER_COLORS[S.players[o.owner].color] : '#e8e8e8') : def.kind === 'monster' ? '#ff4030' : '#f0e0a0';
      g.fillRect(o.c, o.r, Math.max(1, def.foot[0] - 1), Math.max(1, def.foot[1] - 1));
    }
    for (const h of S.heroes) {
      if (!h.alive || h.l !== l) continue;
      g.fillStyle = H.PLAYER_COLORS[S.players[h.owner].color];
      g.fillRect(h.c - 1, h.r - 1, 3, 3);
    }
    return cv;
  };

  H.MapDraw = { T, COLORS, RES, terrain, object, town, fortOf, hero, fighter, steps, fog, minimap, flag };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
