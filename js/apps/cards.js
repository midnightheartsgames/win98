const CardArt = (() => {
  const W = 71;
  const H = 96;
  const RED = '#ff0000';
  const BLACK = '#000000';

  const bigPips = {
    hearts: [
      '.XXX...XXX.',
      'XXXXX.XXXXX',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      '.XXXXXXXXX.',
      '..XXXXXXX..',
      '...XXXXX...',
      '....XXX....',
      '.....X.....'
    ],
    diamonds: [
      '....X....',
      '...XXX...',
      '...XXX...',
      '..XXXXX..',
      '.XXXXXXX.',
      'XXXXXXXXX',
      '.XXXXXXX.',
      '..XXXXX..',
      '...XXX...',
      '...XXX...',
      '....X....'
    ],
    spades: [
      '.....X.....',
      '....XXX....',
      '...XXXXX...',
      '..XXXXXXX..',
      '.XXXXXXXXX.',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      '.XXX.X.XXX.',
      '.....X.....',
      '....XXX....',
      '...XXXXX...'
    ],
    clubs: [
      '....XXX....',
      '...XXXXX...',
      '...XXXXX...',
      '...XXXXX...',
      '.XX.XXX.XX.',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      'XXXXXXXXXXX',
      '.XX..X..XX.',
      '.....X.....',
      '....XXX....',
      '...XXXXX...'
    ]
  };

  const smallPips = {
    hearts: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    diamonds: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    spades: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', 'XX.X.XX', '...X...', '..XXX..'],
    clubs: ['..XXX..', '..XXX..', 'XX.X.XX', 'XXXXXXX', 'XX.X.XX', '...X...', '..XXX..']
  };

  const glyphs = {
    A: ['..XXX..', '.XX.XX.', 'XX...XX', 'XX...XX', 'XXXXXXX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX'],
    2: ['.XXXXX.', 'XX...XX', '.....XX', '....XX.', '...XX..', '..XX...', '.XX....', 'XX.....', 'XXXXXXX'],
    3: ['XXXXXXX', '....XX.', '...XX..', '..XXXX.', '.....XX', '.....XX', '.....XX', 'XX...XX', '.XXXXX.'],
    4: ['....XX.', '...XXX.', '..XXXX.', '.XX.XX.', 'XX..XX.', 'XXXXXXX', '....XX.', '....XX.', '....XX.'],
    5: ['XXXXXXX', 'XX.....', 'XX.....', 'XXXXXX.', '.....XX', '.....XX', '.....XX', 'XX...XX', '.XXXXX.'],
    6: ['..XXXX.', '.XX....', 'XX.....', 'XXXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', '.XXXXX.'],
    7: ['XXXXXXX', '.....XX', '....XX.', '....XX.', '...XX..', '...XX..', '..XX...', '..XX...', '..XX...'],
    8: ['.XXXXX.', 'XX...XX', 'XX...XX', '.XXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', '.XXXXX.'],
    9: ['.XXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', '.XXXXXX', '.....XX', '.....XX', '....XX.', '.XXXX..'],
    10: ['.XX..XXX.', 'XXX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', 'XXXX.XXX.'],
    J: ['...XXXX', '....XX.', '....XX.', '....XX.', '....XX.', '....XX.', 'XX..XX.', 'XX..XX.', '.XXXX..'],
    Q: ['.XXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX.XXXX', 'XX..XX.', '.XXX.XX'],
    K: ['XX...XX', 'XX..XX.', 'XX.XX..', 'XXXX...', 'XXX....', 'XXXX...', 'XX.XX..', 'XX..XX.', 'XX...XX'],
    'Т': ['XXXXXX', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..'],
    'В': ['XXXXXX.', 'XX...XX', 'XX...XX', 'XXXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XXXXXX.'],
    'Д': ['..XXXX.', '.XX.XX.', '.XX.XX.', '.XX.XX.', '.XX.XX.', 'XX..XX.', 'XX..XX.', 'XXXXXXX', 'X.....X'],
    'К': ['XX...XX', 'XX..XX.', 'XX.XX..', 'XXXX...', 'XXX....', 'XXXX...', 'XX.XX..', 'XX..XX.', 'XX...XX']
  };

  const layouts = {
    2: [[35, 18], [35, 77, 1]],
    3: [[35, 18], [35, 47], [35, 77, 1]],
    4: [[20, 18], [50, 18], [20, 77, 1], [50, 77, 1]],
    5: [[20, 18], [50, 18], [35, 47], [20, 77, 1], [50, 77, 1]],
    6: [[20, 18], [50, 18], [20, 47], [50, 47], [20, 77, 1], [50, 77, 1]],
    7: [[20, 18], [50, 18], [35, 32], [20, 47], [50, 47], [20, 77, 1], [50, 77, 1]],
    8: [[20, 18], [50, 18], [35, 32], [20, 47], [50, 47], [35, 63, 1], [20, 77, 1], [50, 77, 1]],
    9: [[20, 18], [50, 18], [20, 38], [50, 38], [35, 47], [20, 57, 1], [50, 57, 1], [20, 77, 1], [50, 77, 1]],
    10: [[20, 18], [50, 18], [35, 28], [20, 38], [50, 38], [20, 57, 1], [50, 57, 1], [35, 67, 1], [20, 77, 1], [50, 77, 1]]
  };

  const cache = new Map();

  const make = (draw) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    draw(ctx);
    return c;
  };

  const bitmap = (ctx, rows, x, y, color, flip = false, scale = 1) => {
    ctx.fillStyle = color;
    const h = rows.length;
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] !== 'X') continue;
        const px = flip ? row.length - 1 - rx : rx;
        const py = flip ? h - 1 - ry : ry;
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    });
  };

  const outline = (ctx, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(1, 1, W - 2, H - 2);
    ctx.fillStyle = BLACK;
    ctx.fillRect(2, 0, W - 4, 1);
    ctx.fillRect(2, H - 1, W - 4, 1);
    ctx.fillRect(0, 2, 1, H - 4);
    ctx.fillRect(W - 1, 2, 1, H - 4);
    ctx.fillRect(1, 1, 1, 1);
    ctx.fillRect(W - 2, 1, 1, 1);
    ctx.fillRect(1, H - 2, 1, 1);
    ctx.fillRect(W - 2, H - 2, 1, 1);
  };

  const rankLabel = (rank) => {
    const ru = window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() !== 'en';
    if (!ru) return rank;
    return { A: 'Т', J: 'В', Q: 'Д', K: 'К' }[rank] || rank;
  };

  const corner = (ctx, rank, suit, color) => {
    const glyph = glyphs[rankLabel(rank)] || glyphs[rank];
    const gx = rank === '10' ? 2 : 3;
    bitmap(ctx, glyph, gx, 4, color);
    bitmap(ctx, smallPips[suit], 3, 15, color);
    const gw = glyph[0].length;
    bitmap(ctx, glyph, W - gx - gw, H - 4 - glyph.length, color, true);
    bitmap(ctx, smallPips[suit], W - 3 - 7, H - 15 - smallPips[suit].length, color, true);
  };

  const pip = (ctx, suit, cx, cy, color, flip, scale = 1) => {
    const rows = bigPips[suit];
    const w = rows[0].length * scale;
    const h = rows.length * scale;
    bitmap(ctx, rows, Math.round(cx - w / 2), Math.round(cy - h / 2), color, flip, scale);
  };

  const rect = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const courtPalettes = [
    { robe: '#ff0000', robe2: '#0000ff', trim: '#ffff00', hair: '#ffff00' },
    { robe: '#0000ff', robe2: '#ff0000', trim: '#ffff00', hair: '#000000' },
    { robe: '#ff0000', robe2: '#000000', trim: '#ffff00', hair: '#ffff00' },
    { robe: '#0000ff', robe2: '#ffff00', trim: '#ff0000', hair: '#000000' }
  ];

  const courtHalf = (ctx, rank, suitIndex, ox, oy) => {
    const p = courtPalettes[suitIndex];
    const k = BLACK;
    const hx = ox + 14;
    const hy = oy + (rank === 'K' ? 9 : 8);
    if (rank === 'K') {
      rect(ctx, hx - 1, oy + 1, 19, 8, k);
      rect(ctx, hx, oy + 2, 17, 6, p.trim);
      for (let i = 0; i < 5; i++) {
        rect(ctx, hx + 1 + i * 4, oy, 1, 2, k);
        rect(ctx, hx + 1 + i * 4, oy + 1, 1, 1, p.trim);
      }
      for (let i = 0; i < 4; i++) rect(ctx, hx + 3 + i * 4, oy + 5, 2, 2, RED);
    } else if (rank === 'Q') {
      rect(ctx, hx + 2, oy + 2, 13, 6, k);
      rect(ctx, hx + 3, oy + 3, 11, 4, p.trim);
      for (let i = 0; i < 3; i++) rect(ctx, hx + 4 + i * 4, oy + 1, 1, 2, k);
      rect(ctx, hx + 7, oy + 4, 3, 2, RED);
      rect(ctx, hx - 2, hy, 3, 17, p.hair);
      rect(ctx, hx + 16, hy, 3, 17, p.hair);
      rect(ctx, hx - 3, hy, 1, 17, k);
      rect(ctx, hx + 19, hy, 1, 17, k);
    } else {
      rect(ctx, hx - 3, oy + 2, 23, 7, k);
      rect(ctx, hx - 2, oy + 3, 21, 5, p.robe2);
      rect(ctx, hx - 2, oy + 6, 21, 2, p.trim);
      rect(ctx, hx + 17, oy, 2, 4, p.robe);
      rect(ctx, hx + 19, oy, 1, 3, k);
    }
    rect(ctx, hx - 1, hy, 19, 12, k);
    rect(ctx, hx, hy + 1, 17, 10, '#ffffff');
    if (rank !== 'K') rect(ctx, hx, hy + 1, 17, 2, p.hair);
    rect(ctx, hx + 3, hy + 4, 3, 1, k);
    rect(ctx, hx + 11, hy + 4, 3, 1, k);
    rect(ctx, hx + 4, hy + 5, 1, 1, k);
    rect(ctx, hx + 12, hy + 5, 1, 1, k);
    rect(ctx, hx + 8, hy + 5, 1, 3, k);
    rect(ctx, hx + 7, hy + 8, 3, 1, k);
    if (rank === 'K') {
      rect(ctx, hx, hy + 8, 17, 5, '#ffffff');
      rect(ctx, hx - 1, hy + 8, 1, 5, k);
      rect(ctx, hx + 17, hy + 8, 1, 5, k);
      rect(ctx, hx + 3, hy + 8, 4, 1, k);
      rect(ctx, hx + 10, hy + 8, 4, 1, k);
      for (let i = 0; i < 5; i++) rect(ctx, hx + 2 + i * 3, hy + 10, 1, 3, k);
      rect(ctx, hx + 1, hy + 13, 15, 1, k);
    } else {
      rect(ctx, hx + 6, hy + 9, 5, 1, RED);
    }
    const sy = oy + 23;
    const sh = 35 - (sy - oy);
    rect(ctx, ox + 3, sy - 1, 39, 1, k);
    rect(ctx, ox + 2, sy, 41, sh, k);
    rect(ctx, ox + 3, sy + 1, 18, sh - 1, p.robe);
    rect(ctx, ox + 24, sy + 1, 18, sh - 1, p.robe2);
    rect(ctx, ox + 21, sy + 1, 3, sh - 1, p.trim);
    for (let y = sy + 3; y < oy + 35; y += 4) {
      rect(ctx, ox + 3, y, 18, 1, p.trim);
      for (let x = ox + 26; x < ox + 42; x += 5) rect(ctx, x, y - 1, 2, 2, p.trim);
    }
    rect(ctx, hx + 5, hy + 12, 7, sy - (hy + 12), '#ffffff');
    rect(ctx, hx + 4, hy + 12, 1, sy - (hy + 12), k);
    rect(ctx, hx + 12, hy + 12, 1, sy - (hy + 12), k);
    if (rank === 'K') {
      rect(ctx, ox + 38, oy + 4, 2, 24, '#808080');
      rect(ctx, ox + 37, oy + 3, 1, 25, k);
      rect(ctx, ox + 40, oy + 3, 1, 25, k);
      rect(ctx, ox + 35, oy + 24, 8, 2, p.trim);
    } else if (rank === 'Q') {
      rect(ctx, ox + 36, oy + 10, 5, 5, RED);
      rect(ctx, ox + 37, oy + 11, 3, 3, p.trim);
      rect(ctx, ox + 38, oy + 15, 1, 12, '#008000');
    } else {
      rect(ctx, ox + 39, oy + 1, 1, 30, k);
      rect(ctx, ox + 36, oy + 1, 7, 5, '#808080');
      rect(ctx, ox + 36, oy + 1, 7, 1, k);
    }
  };

  const drawCourt = (ctx, rank, suit, suitIndex, color) => {
    const fx = 12;
    const fy = 12;
    const fw = 47;
    const fh = 72;
    rect(ctx, fx, fy, fw, fh, BLACK);
    rect(ctx, fx + 1, fy + 1, fw - 2, fh - 2, '#ffffff');
    const half = document.createElement('canvas');
    half.width = fw - 2;
    half.height = 35;
    const hctx = half.getContext('2d');
    courtHalf(hctx, rank, suitIndex, 0, 0);
    ctx.drawImage(half, fx + 1, fy + 1);
    ctx.save();
    ctx.translate(fx + fw - 1, fy + fh - 1);
    ctx.rotate(Math.PI);
    ctx.drawImage(half, 0, 0);
    ctx.restore();
    rect(ctx, fx + 1, fy + 36, fw - 2, 1, BLACK);
    bitmap(ctx, smallPips[suit], fx + 3, fy + 3, color);
    bitmap(ctx, smallPips[suit], fx + fw - 10, fy + fh - 3 - smallPips[suit].length, color, true);
  };

  const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];

  const face = (rank, suit) => {
    const lang = window.i18n && window.i18n.getLanguage ? window.i18n.getLanguage() : 'ru';
    const key = `f:${rank}:${suit}:${lang}`;
    if (cache.has(key)) return cache.get(key);
    const color = suit === 'hearts' || suit === 'diamonds' ? RED : BLACK;
    const canvas = make(ctx => {
      outline(ctx, '#ffffff');
      corner(ctx, rank, suit, color);
      if (rank === 'A') {
        pip(ctx, suit, 35, 48, color, false, suit === 'spades' ? 3 : 2);
      } else if (layouts[rank]) {
        layouts[rank].forEach(([x, y, flip]) => pip(ctx, suit, x, y, color, !!flip));
      } else {
        drawCourt(ctx, rank, suit, suitOrder.indexOf(suit), color);
      }
    });
    const url = canvas.toDataURL();
    cache.set(key, url);
    return url;
  };

  const backs = {
    weave: (ctx) => {
      rect(ctx, 4, 4, W - 8, H - 8, '#000080');
      ctx.fillStyle = '#0000ff';
      for (let y = 4; y < H - 4; y++) {
        for (let x = 4; x < W - 4; x++) {
          const a = (x + y) % 6;
          const b = (x - y + 600) % 6;
          if ((a === 0 || a === 1) !== (b === 0 || b === 1)) ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#ffffff';
      for (let y = 4; y < H - 4; y += 6) for (let x = 4 + ((y / 6) % 2) * 3; x < W - 4; x += 6) ctx.fillRect(x, y, 1, 1);
    },
    'weave-red': (ctx) => {
      rect(ctx, 4, 4, W - 8, H - 8, '#800000');
      ctx.fillStyle = '#ff0000';
      for (let y = 4; y < H - 4; y++) {
        for (let x = 4; x < W - 4; x++) {
          const a = (x + y) % 6;
          const b = (x - y + 600) % 6;
          if ((a === 0 || a === 1) !== (b === 0 || b === 1)) ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    castle: (ctx) => {
      rect(ctx, 4, 4, W - 8, H - 8, '#0000ff');
      rect(ctx, 4, 4, W - 8, 30, '#00ffff');
      rect(ctx, 50, 10, 8, 8, '#ffff00');
      rect(ctx, 4, 70, W - 8, H - 74, '#008000');
      rect(ctx, 14, 36, 43, 36, '#808080');
      rect(ctx, 10, 26, 12, 46, '#808080');
      rect(ctx, 49, 26, 12, 46, '#808080');
      for (let x = 10; x < 61; x += 4) rect(ctx, x, 22, 2, 4, '#808080');
      for (let x = 14; x < 57; x += 4) rect(ctx, x, 32, 2, 4, '#808080');
      rect(ctx, 30, 52, 11, 20, '#000000');
      rect(ctx, 14, 36, 43, 1, '#c0c0c0');
      [[14, 34], [53, 34], [26, 42], [43, 42]].forEach(([x, y]) => rect(ctx, x, y, 3, 5, '#000080'));
      rect(ctx, 35, 12, 1, 14, '#000000');
      rect(ctx, 36, 12, 8, 5, '#ff0000');
    },
    beach: (ctx) => {
      const bands = ['#ffff00', '#ffff80', '#ff8040', '#ff8040', '#ff0080'];
      bands.forEach((c, i) => rect(ctx, 4, 4 + i * 8, W - 8, 8, c));
      rect(ctx, 4, 44, W - 8, 22, '#0080ff');
      for (let y = 46; y < 66; y += 4) for (let x = 6 + (y % 8); x < W - 6; x += 8) rect(ctx, x, y, 4, 1, '#80ffff');
      rect(ctx, 4, 66, W - 8, H - 70, '#ffff80');
      rect(ctx, 30, 22, 12, 12, '#ffffff');
      rect(ctx, 16, 40, 4, 40, '#804000');
      [[4, 36, 16, 3], [18, 34, 16, 3], [10, 32, 10, 3], [18, 38, 10, 3]].forEach(([x, y, w, h]) => rect(ctx, x, y, w, h, '#008000'));
    },
    robot: (ctx) => {
      rect(ctx, 4, 4, W - 8, H - 8, '#008080');
      rect(ctx, 14, 16, 43, 58, '#c0c0c0');
      rect(ctx, 14, 16, 43, 1, '#ffffff');
      rect(ctx, 14, 16, 1, 58, '#ffffff');
      rect(ctx, 56, 16, 1, 58, '#808080');
      rect(ctx, 14, 73, 43, 1, '#808080');
      rect(ctx, 20, 26, 11, 11, '#000000');
      rect(ctx, 40, 26, 11, 11, '#000000');
      rect(ctx, 23, 29, 5, 5, '#ff0000');
      rect(ctx, 43, 29, 5, 5, '#00ff00');
      rect(ctx, 22, 50, 27, 8, '#000000');
      for (let x = 24; x < 48; x += 4) rect(ctx, x, 52, 2, 4, '#ffff00');
      rect(ctx, 34, 8, 3, 8, '#808080');
      rect(ctx, 32, 5, 7, 4, '#ff0000');
      rect(ctx, 8, 36, 6, 18, '#808080');
      rect(ctx, 57, 36, 6, 18, '#808080');
    },
    fish: (ctx) => {
      rect(ctx, 4, 4, W - 8, H - 8, '#0000ff');
      for (let y = 8; y < H - 8; y += 10) for (let x = 6 + (y % 20 ? 4 : 0); x < W - 8; x += 12) rect(ctx, x, y, 2, 2, '#80ffff');
      const fish = (x, y, c) => {
        rect(ctx, x, y, 16, 8, c);
        rect(ctx, x + 2, y - 2, 10, 2, c);
        rect(ctx, x + 2, y + 8, 10, 2, c);
        rect(ctx, x - 6, y - 2, 6, 3, c);
        rect(ctx, x - 6, y + 7, 6, 3, c);
        rect(ctx, x - 3, y + 2, 3, 4, c);
        rect(ctx, x + 11, y + 2, 2, 2, '#000000');
      };
      fish(22, 20, '#ffff00');
      fish(40, 46, '#ff8040');
      fish(18, 70, '#ffff00');
    }
  };

  const back = (design) => {
    const key = 'b:' + design;
    if (cache.has(key)) return cache.get(key);
    const canvas = make(ctx => {
      outline(ctx, '#ffffff');
      (backs[design] || backs.weave)(ctx);
      rect(ctx, 3, 3, W - 6, 1, BLACK);
      rect(ctx, 3, H - 4, W - 6, 1, BLACK);
      rect(ctx, 3, 3, 1, H - 6, BLACK);
      rect(ctx, W - 4, 3, 1, H - 6, BLACK);
    });
    const url = canvas.toDataURL();
    cache.set(key, url);
    return url;
  };

  return {
    width: W,
    height: H,
    designs: Object.keys(backs),
    face,
    back,
    clear: () => cache.clear()
  };
})();

window.CardArt = CardArt;
