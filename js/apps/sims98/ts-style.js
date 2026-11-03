(function (S) {
  'use strict';
  const SIZE = 64;
  const CHANNELS = 4;
  const ROW_TEXELS = 5;
  const ROWS = 256;

  const grain = (x, y) => {
    const v = Math.sin((x & 63) * 12.9898 + (y & 63) * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  const PATTERNS = [
    { id: 'solid', weight: () => [1, 0, 0, 0] },
    { id: 'stripes', weight: (x) => ((x >> 3) & 1 ? [0, 1, 0, 0] : [1, 0, 0, 0]) },
    { id: 'checker', weight: (x, y) => (((x >> 3) + (y >> 3)) & 1 ? [0, 1, 0, 0] : [1, 0, 0, 0]) },
    {
      id: 'dots',
      weight: (x, y) => {
        const dx = (x % 16) - 8, dy = (y % 16) - 8;
        return dx * dx + dy * dy < 16 ? [0, 1, 0, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'tartan',
      weight: (x, y) => {
        const a = (x >> 2) & 3, b = (y >> 2) & 3;
        if (a === 0 && b === 0) return [0, 0, 1, 0];
        if (a === 0 || b === 0) return [0, 1, 0, 0];
        return [1, 0, 0, 0];
      }
    },
    {
      id: 'plaster',
      weight: (x, y) => (grain(x, y) < 0.14 ? [0, 1, 0, 0] : [1, 0, 0, 0])
    },
    {
      id: 'wallpaper',
      weight: (x, y) => {
        const dx = Math.abs(((x + (y >> 4 & 1) * 8) % 16) - 8), dy = Math.abs((y % 16) - 8);
        if (dx + dy < 3) return [0, 1, 0, 0];
        return x % 16 === 0 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'siding',
      weight: (x, y) => {
        const row = y % 16;
        if (row === 15) return [0, 1, 0, 0];
        return row === 14 || grain(x >> 2, y >> 4) < 0.25 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'brick',
      weight: (x, y) => {
        const course = y >> 3, bx = (x + (course & 1) * 8) & 15;
        if ((y & 7) === 7 || bx === 15) return [0, 1, 0, 0];
        return grain((x + (course & 1) * 8) >> 4, course) < 0.3 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'planks',
      weight: (x, y) => {
        const board = y >> 3, seam = (x + board * 23) & 31;
        if ((y & 7) === 7 || seam === 0) return [0, 1, 0, 0];
        return grain(seam >> 3, board) < 0.45 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'tile',
      weight: (x, y) => {
        if ((x & 31) === 31 || (y & 31) === 31) return [0, 0, 1, 0];
        return ((x >> 5) + (y >> 5)) & 1 ? [0, 1, 0, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'carpet',
      weight: (x, y) => (grain(x, y) < 0.3 ? [0, 1, 0, 0] : [1, 0, 0, 0])
    },
    {
      id: 'shingle',
      weight: (x, y) => {
        const row = y >> 3, tab = (x + (row & 1) * 4) >> 3;
        if ((y & 7) === 7) return [0, 1, 0, 0];
        return grain(tab, row) < 0.35 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    },
    {
      id: 'gravel',
      weight: (x, y) => {
        const g = grain(x >> 1, y >> 1);
        if (g < 0.3) return [0, 1, 0, 0];
        return g < 0.55 ? [0, 0, 1, 0] : [1, 0, 0, 0];
      }
    }
  ];

  const hex = text => [parseInt(text.slice(1, 3), 16), parseInt(text.slice(3, 5), 16), parseInt(text.slice(5, 7), 16)];

  S.Style = {
    SIZE, CHANNELS, ROW_TEXELS, ROWS, PATTERNS,
    patternId: id => PATTERNS.findIndex(p => p.id === id),

    patternData() {
      const data = new Uint8Array(SIZE * SIZE * 4 * PATTERNS.length);
      PATTERNS.forEach((p, layer) => {
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const w = p.weight(x, y), q = (layer * SIZE * SIZE + x + y * SIZE) * 4;
            for (let k = 0; k < 4; k++) data[q + k] = Math.round(w[k] * 255);
          }
        }
      });
      return data;
    },

    table(rows) {
      const data = new Uint8Array(CHANNELS * ROW_TEXELS * ROWS * 4);
      rows.forEach((channels, row) => {
        channels.forEach((c, ch) => {
          if (!c) return;
          const q = (row * CHANNELS * ROW_TEXELS + ch * ROW_TEXELS) * 4;
          data[q] = S.Style.patternId(c.pattern);
          data[q + 3] = 255;
          c.colors.forEach((color, k) => {
            const [r, g, b] = hex(color);
            data[q + (k + 1) * 4] = r;
            data[q + (k + 1) * 4 + 1] = g;
            data[q + (k + 1) * 4 + 2] = b;
            data[q + (k + 1) * 4 + 3] = 255;
          });
        });
      });
      return data;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
