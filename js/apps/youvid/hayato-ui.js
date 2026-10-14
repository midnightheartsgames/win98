(function () {
  const PI = Math.PI;

  function outline(ctx, text, x, y, fill, stroke, width) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke || '#000000';
    ctx.lineWidth = width || 6;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill || '#ffffff';
    ctx.fillText(text, x, y);
  }

  function wrap(ctx, text, maxW) {
    const lines = [];
    String(text).split('\n').forEach(par => {
      let line = '';
      par.split(' ').forEach(word => {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = word;
        } else line = test;
      });
      lines.push(line);
    });
    return lines;
  }

  function portrait(ctx, x, y, w, h, look) {
    const L = Object.assign({ bg: '#8aa0d8', hair: '#3a2a4a', skin: '#fbe2d4', eyes: '#6a3a8a', cloth: '#ffffff' }, look);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, L.bg);
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const cx = x + w * 0.5, cy = y + h * 0.48, r = Math.min(w, h) * 0.3;
    ctx.fillStyle = L.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.3, r * 1.25, r * 1.6, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = L.cloth;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 1.02, r * 1.6, r * 0.9, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = L.skin;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.12, r * 0.82, r * 0.95, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = L.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.62, r * 0.95, r * 0.5, 0, PI, PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.95, cy - r * 0.64, r * 1.9, r * 0.28);
    ctx.fillStyle = L.eyes;
    [-1, 1].forEach(sx => {
      ctx.beginPath();
      ctx.ellipse(cx + sx * r * 0.34, cy + r * 0.12, r * 0.13, r * 0.2, 0, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    [-1, 1].forEach(sx => ctx.fillRect(cx + sx * r * 0.34 - r * 0.06, cy + r * 0.02, r * 0.07, r * 0.08));
    ctx.fillStyle = '#d06070';
    ctx.fillRect(cx - r * 0.1, cy + r * 0.55, r * 0.2, r * 0.05);
    ctx.restore();
  }

  function photo(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#f4f0e6';
      ctx.fillRect(0, 0, w, h);
      if (p.kind === 'cat') {
        ctx.fillStyle = '#b8b0a4';
        ctx.fillRect(12, 12, w - 24, h - 24);
        const cx = w / 2, cy = h * 0.56, r = h * 0.3;
        ctx.fillStyle = '#7a6a5a';
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(cx + s * r * 0.9, cy - r * 0.5);
          ctx.lineTo(cx + s * r * 0.75, cy - r * 1.35);
          ctx.lineTo(cx + s * r * 0.2, cy - r * 0.85);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.05, r * 0.9, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a3a2e';
        ctx.lineWidth = 6;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * r * 0.25, cy - r * 0.85);
          ctx.lineTo(cx + i * r * 0.2, cy - r * 0.45);
          ctx.stroke();
        }
        ctx.fillStyle = '#d8e070';
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.ellipse(cx + s * r * 0.4, cy - r * 0.05, r * 0.2, r * 0.14, 0, 0, PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#1a1208';
        [-1, 1].forEach(s => ctx.fillRect(cx + s * r * 0.4 - 3, cy - r * 0.18, 6, r * 0.26));
        ctx.fillStyle = '#e8a0a0';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + r * 0.25);
        ctx.lineTo(cx + 10, cy + r * 0.25);
        ctx.lineTo(cx, cy + r * 0.36);
        ctx.fill();
        return;
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f0b070');
      g.addColorStop(1, '#b86a30');
      ctx.fillStyle = g;
      ctx.fillRect(12, 12, w - 24, h - 24);
      const cx = w / 2, cy = h * 0.5, r = h * 0.28;
      ctx.fillStyle = '#5a3a2a';
      ctx.beginPath();
      ctx.ellipse(cx, h * 1.0, r * 1.7, r * 0.8, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b890';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1e18';
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.62, r * 0.84, r * 0.45, 0, PI, PI * 2);
      ctx.fill();
      ctx.fillRect(cx - r * 0.84, cy - r * 0.66, r * 1.68, r * 0.16);
      ctx.strokeStyle = '#1a1210';
      ctx.lineWidth = 6;
      [-1, 1].forEach(sx => {
        ctx.beginPath();
        ctx.arc(cx + sx * r * 0.36, cy - r * 0.05, r * 0.2, 0, PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#1a1210';
        ctx.beginPath();
        ctx.arc(cx + sx * r * 0.36, cy - r * 0.05, r * 0.06, 0, PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.16, cy - r * 0.05);
      ctx.lineTo(cx + r * 0.16, cy - r * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.35, r * 0.32, 0.15 * PI, 0.85 * PI);
      ctx.stroke();
    };
  }

  function catEmoji() {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.56, r = w * 0.36;
      ctx.fillStyle = '#f6c43a';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.95, cy - r * 0.2);
        ctx.lineTo(cx + s * r * 0.85, cy - r * 1.2);
        ctx.lineTo(cx + s * r * 0.2, cy - r * 0.8);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6a4a10';
      ctx.lineWidth = w * 0.03;
      ctx.lineCap = 'round';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.55, cy - r * 0.15);
        ctx.lineTo(cx + s * r * 0.2, cy - r * 0.1);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy + r * 0.35);
      ctx.quadraticCurveTo(cx + r * 0.1, cy + r * 0.45, cx + r * 0.45, cy + r * 0.2);
      ctx.stroke();
    };
  }

  function duo(p) {
    const LOOK = {
      bronya: { bg: '#4a6ac8', hair: '#e6e8f0', eyes: '#3a6ad0', cloth: '#f2f2f6' },
      yukong: { bg: '#4a6ac8', hair: '#2a2630', eyes: '#d8a840', cloth: '#1c2a48' }
    };
    return (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#0c1a48');
      g.addColorStop(1, '#2a5ad0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 22; i++) {
        const y = ((i * 97) % h);
        const lg = ctx.createLinearGradient(0, 0, w, 0);
        lg.addColorStop(0, 'rgba(160,220,255,0)');
        lg.addColorStop(0.6, 'rgba(160,220,255,0.35)');
        lg.addColorStop(1, 'rgba(255,255,255,0.7)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, y, w, 2 + (i % 3));
      }
      ctx.fillStyle = 'rgba(170,215,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.08);
      ctx.lineTo(w * 0.4, h * 0.02);
      ctx.lineTo(w * 0.34, h * 0.96);
      ctx.lineTo(0, h * 0.9);
      ctx.fill();
      (p.looks || []).forEach((k, i) => {
        const y = h * (0.06 + i * 0.3);
        ctx.fillStyle = 'rgba(10,18,50,0.65)';
        ctx.fillRect(w * 0.7, y, w * 0.3, h * 0.24);
        portrait(ctx, w * 0.855, y + 4, w * 0.14, h * 0.24 - 8, LOOK[k] || {});
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((p.names || [])[i] || '', w * 0.72, y + h * 0.07);
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(w * 0.72, y + h * 0.13, w * 0.12, 10);
        ctx.fillStyle = '#6ae08a';
        ctx.fillRect(w * 0.72, y + h * 0.13, w * 0.12 * (0.8 - i * 0.15), 10);
      });
    };
  }

  function poster() {
    return (ctx, w, h) => {
      ctx.fillStyle = '#6a1a1a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8c060';
      ctx.lineWidth = 14;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.lineWidth = 4;
      ctx.strokeRect(34, 34, w - 68, h - 68);
      [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#e8c060';
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, PI * 2);
        ctx.fill();
      });
      const ig = ctx.createLinearGradient(0, 90, 0, 90 + h * 0.6);
      ig.addColorStop(0, '#f0a050');
      ig.addColorStop(1, '#c05a20');
      ctx.fillStyle = ig;
      ctx.fillRect(60, 90, w - 120, h * 0.6);
      const cx = w / 2, cy = 90 + h * 0.33, rr = w * 0.26;
      ctx.fillStyle = '#2a9aa0';
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5ac8c8';
      ctx.beginPath();
      ctx.arc(cx - rr * 0.3, cy - rr * 0.35, rr * 0.3, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(cx - rr, cy - rr * 0.18, rr * 2, rr * 0.22);
      [-1, 1].forEach(sx => {
        ctx.fillStyle = '#f08a2a';
        ctx.beginPath();
        ctx.arc(cx + sx * rr * 0.42, cy - rr * 0.07, rr * 0.3, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe0a0';
        ctx.beginPath();
        ctx.arc(cx + sx * rr * 0.42, cy - rr * 0.07, rr * 0.17, 0, PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#1a3a3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy + rr * 0.4, rr * 0.3, 0.15 * PI, 0.85 * PI);
      ctx.stroke();
      ctx.fillStyle = '#f4e0a0';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('ЛЕГЕНДА', w / 2, 72);
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('Великая охота', w / 2, h - 60);
      ctx.textAlign = 'left';
    };
  }

  function pixelEmoji(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        const d = Math.hypot(x - 10.5, y - 10.5);
        if (d < 9.5) px(x, y, d > 8.5 ? '#8a6a10' : d > 7 ? '#e8b020' : '#f8d040');
      }
      if (p.face === 'x') {
        [[6, 7], [7, 8], [8, 9], [8, 7], [6, 9], [12, 7], [13, 8], [14, 9], [14, 7], [12, 9]].forEach(([x, y]) => px(x, y, '#1a1208'));
      } else {
        [[7, 7], [7, 8], [14, 7], [14, 8]].forEach(([x, y]) => px(x, y, '#1a1208'));
      }
      [[6, 13], [7, 14], [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 14], [14, 13]].forEach(([x, y]) => px(x, y, '#1a1208'));
      for (let y = 15; y < 22; y++) for (let x = 16; x < 22; x++) if (!(y < 17 && x > 17)) px(x, y, '#f0c090');
      for (let y = 11; y < 16; y++) px(17, y, '#f0c090'), px(16, y, '#f0c090');
      [[15, 15], [15, 18], [22, 16], [22, 20], [16, 22], [21, 22]].forEach(([x, y]) => px(x, y, '#6a3a1a'));
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function caption(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const size = p.size || 64;
      ctx.font = `bold ${size}px Impact, 'Arial Black', Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = wrap(ctx, p.text, w * 0.92);
      const lh = size * 1.02;
      if (p.pos === 'br') {
        ctx.textAlign = 'right';
        lines.forEach((l, i) => outline(ctx, l, w * 0.85, h * 0.72 + i * lh, p.color || '#ffffff', p.stroke || '#000000', size * 0.14));
        return;
      }
      const y0 = (p.pos === 'bottom' ? h - lh * lines.length : p.pos === 'top' ? 0 : (h - lh * lines.length) / 2) + lh / 2 + (p.pos === 'bottom' ? -size * 0.45 - 14 : p.pos === 'top' ? size * 0.3 + 10 : 0);
      lines.forEach((l, i) => outline(ctx, l, w / 2, y0 + i * lh, p.color || '#ffffff', p.stroke || '#000000', size * 0.14));
    };
  }

  function subtitle(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const size = p.size || 34;
      ctx.font = `bold ${size}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      outline(ctx, p.text, w / 2, h - 18, '#ffffff', '#000000', 7);
    };
  }

  function damage(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (p.framed) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(w * 0.17, h * 0.1, w * 0.66, h * 0.6);
        const bg = ctx.createRadialGradient(w * 0.55, h * 0.35, 10, w * 0.5, h * 0.4, w * 0.4);
        bg.addColorStop(0, '#6a4a22');
        bg.addColorStop(0.4, '#2a1e14');
        bg.addColorStop(1, '#120c08');
        ctx.fillStyle = bg;
        ctx.fillRect(w * 0.17 + 3, h * 0.1 + 3, w * 0.66 - 6, h * 0.6 - 6);
        ctx.save();
        ctx.beginPath();
        ctx.rect(w * 0.17 + 3, h * 0.1 + 3, w * 0.66 - 6, h * 0.6 - 6);
        ctx.clip();
        ctx.strokeStyle = 'rgba(240,200,90,0.35)';
        ctx.lineWidth = 5;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * PI * 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.55 + Math.cos(a) * 40, h * 0.35 + Math.sin(a) * 40);
          ctx.lineTo(w * 0.55 + Math.cos(a) * w * 0.5, h * 0.35 + Math.sin(a) * w * 0.5);
          ctx.stroke();
        }
        ctx.restore();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3a2408';
        ctx.lineWidth = 5;
        ctx.font = 'bold 34px Arial, sans-serif';
        ctx.strokeText(p.label || 'ОБЩИЙ УРОН', w * 0.78, h * 0.25);
        ctx.fillText(p.label || 'ОБЩИЙ УРОН', w * 0.78, h * 0.25);
        ctx.font = 'italic bold 190px Arial, sans-serif';
        const gg = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.62);
        gg.addColorStop(0, '#fffbe0');
        gg.addColorStop(0.5, '#f0d060');
        gg.addColorStop(1, '#f0b830');
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 6;
        ctx.strokeStyle = '#1a0e04';
        ctx.lineWidth = 12;
        ctx.strokeText(String(p.value), w * 0.78, h * 0.6);
        ctx.restore();
        ctx.fillStyle = gg;
        ctx.fillText(String(p.value), w * 0.78, h * 0.6);
        if (p.note) {
          ctx.textAlign = 'center';
          ctx.font = 'bold 72px Arial, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(p.note, w / 2, h * 0.88);
        }
        return;
      }
      if (!p.plain) {
        const g = ctx.createLinearGradient(0, h * 0.3, w, h * 0.7);
        g.addColorStop(0, 'rgba(10,14,30,0)');
        g.addColorStop(0.35, 'rgba(10,14,30,0.75)');
        g.addColorStop(1, 'rgba(10,14,30,0.9)');
        ctx.fillStyle = g;
        ctx.fillRect(0, h * 0.28, w, h * 0.46);
      }
      ctx.fillStyle = '#e8e8ee';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(p.label || 'ОБЩИЙ УРОН', w - 30, h * 0.4);
      ctx.textAlign = 'right';
      ctx.beginPath();
      ctx.arc(w - 40 - ctx.measureText(p.label || 'ОБЩИЙ УРОН').width, h * 0.4 - 10, 9, 0, PI * 2);
      ctx.fillStyle = '#e8e8ee';
      ctx.fill();
      ctx.font = 'italic bold 118px Arial, sans-serif';
      const gg = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.7);
      gg.addColorStop(0, '#fff6c8');
      gg.addColorStop(0.55, '#f2c24e');
      gg.addColorStop(1, '#b07818');
      ctx.fillStyle = gg;
      ctx.strokeStyle = '#3a2408';
      ctx.lineWidth = 5;
      ctx.strokeText(String(p.value), w - 30, h * 0.68);
      ctx.fillText(String(p.value), w - 30, h * 0.68);
      if (p.note) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 54px Arial, sans-serif';
        outline(ctx, p.note, w / 2, h * 0.93, '#ffffff', '#000000', 6);
      }
    };
  }

  function chat(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = p.bg || '#0e1621';
      ctx.fillRect(0, 0, w, h);
      let y = p.top || 40;
      ctx.textBaseline = 'top';
      (p.lines || []).forEach(m => {
        const size = m.size || 34;
        ctx.font = `${size}px Arial, sans-serif`;
        const lines = wrap(ctx, m.text, w * (p.wide ? 0.78 : 0.62));
        const nameH = m.name ? size * 1.05 : 0;
        const bw = Math.max(...lines.map(l => ctx.measureText(l).width), m.name ? ctx.measureText(m.name).width : 0) + 170;
        const bh = nameH + lines.length * size * 1.2 + 26;
        const x = m.right ? w - bw - 40 : 40;
        roundRect(ctx, x, y, bw, bh, 22);
        ctx.fillStyle = m.right ? '#2b5278' : '#182533';
        ctx.fill();
        if (m.name) {
          ctx.font = `bold ${size}px Arial, sans-serif`;
          ctx.fillStyle = '#6ab3f3';
          ctx.fillText(m.name, x + 24, y + 12);
        }
        ctx.font = `${size}px Arial, sans-serif`;
        ctx.fillStyle = '#f5f5f5';
        lines.forEach((l, i) => ctx.fillText(l, x + 24, y + 12 + nameH + i * size * 1.2));
        ctx.font = `${Math.round(size * 0.7)}px Arial, sans-serif`;
        ctx.fillStyle = '#7fa5c8';
        ctx.fillText(m.time || '20:42', x + bw - 120, y + bh - size * 0.95);
        ctx.strokeStyle = '#6ab3f3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + bw - 44, y + bh - 22);
        ctx.lineTo(x + bw - 36, y + bh - 14);
        ctx.lineTo(x + bw - 22, y + bh - 32);
        ctx.moveTo(x + bw - 34, y + bh - 22);
        ctx.lineTo(x + bw - 26, y + bh - 14);
        ctx.lineTo(x + bw - 12, y + bh - 32);
        ctx.stroke();
        y += bh + 16;
      });
    };
  }

  function post(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#0e1621';
      ctx.fillRect(0, 0, w, h);
      let y = 30;
      (p.posts || []).forEach(pp => {
        const bh = pp.poll ? 380 : 170;
        roundRect(ctx, 30, y, w - 60, bh, 18);
        ctx.fillStyle = '#182533';
        ctx.fill();
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#6ab3f3';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText('Кишлак Хаято', 54, y + 18);
        ctx.fillStyle = '#f5f5f5';
        ctx.font = '28px Arial, sans-serif';
        wrap(ctx, pp.text, w - 110).slice(0, 2).forEach((l, i) => ctx.fillText(l, 54, y + 56 + i * 34));
        if (pp.poll) {
          ctx.fillStyle = '#7fa5c8';
          ctx.font = '24px Arial, sans-serif';
          ctx.fillText('Анонимный опрос', 54, y + 100);
          pp.poll.forEach(([label, pct], i) => {
            const yy = y + 140 + i * 72;
            ctx.fillStyle = '#f5f5f5';
            ctx.font = 'bold 26px Arial, sans-serif';
            ctx.fillText(`${pct}%  ${label}`, 54, yy);
            ctx.fillStyle = '#6ab3f3';
            ctx.fillRect(54, yy + 36, (w - 140) * pct / 100, 8);
          });
          ctx.fillStyle = '#7fa5c8';
          ctx.font = '22px Arial, sans-serif';
          ctx.fillText('1 284 голоса', 54, y + 290);
          ctx.fillStyle = '#6ab3f3';
          ctx.font = '24px Arial, sans-serif';
          ctx.fillText('87 комментариев', 54, y + 330);
        } else {
          ctx.fillStyle = '#6ab3f3';
          ctx.font = '24px Arial, sans-serif';
          ctx.fillText('42 комментария', 54, y + 126);
        }
        y += bh + 20;
      });
    };
  }

  function panel(ctx, x, y, w, h, title) {
    ctx.fillStyle = 'rgba(16,20,36,0.86)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(210,190,140,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    if (!title) return 0;
    ctx.fillStyle = '#f0e6c8';
    ctx.textBaseline = 'top';
    let size = 30;
    ctx.font = `bold ${size}px Arial, sans-serif`;
    while (ctx.measureText(title).width > w - 36 && size > 24) {
      size -= 1;
      ctx.font = `bold ${size}px Arial, sans-serif`;
    }
    const lines = wrap(ctx, title, w - 36).slice(0, 2);
    lines.forEach((l, i) => ctx.fillText(l, x + 18, y + 16 + i * (size + 4)));
    return (lines.length - 1) * (size + 4);
  }

  function statScreen(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      panel(ctx, w * 0.66, h * 0.08, w * 0.3, h * 0.72, '');
      ctx.fillStyle = '#f0e6c8';
      let nf = 30;
      ctx.font = `bold ${nf}px Arial, sans-serif`;
      while (ctx.measureText(p.name || '').width > w * 0.27 && nf > 14) {
        nf -= 1;
        ctx.font = `bold ${nf}px Arial, sans-serif`;
      }
      ctx.textBaseline = 'top';
      ctx.fillText(p.name || '', w * 0.66 + 20, h * 0.08 + 16);
      ctx.textBaseline = 'top';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = '#c8c8d8';
      ctx.fillText(p.path || 'Гармония', w * 0.66 + 20, h * 0.08 + 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillText(`Ур. ${p.level || 20} / 20`, w * 0.66 + 20, h * 0.08 + 94);
      const stats = p.stats || [['HP', 544], ['Сила атаки', 261], ['Защита', 274], ['Скорость', 99], ['Шанс крит. попадания', '5,0%'], ['Крит. урон', '50,0%']];
      stats.forEach(([k, v], i) => {
        const yy = h * 0.08 + 150 + i * 40;
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(w * 0.66 + 14, yy - 6, w * 0.3 - 28, 36);
        ctx.fillStyle = '#d8d8e4';
        ctx.font = '22px Arial, sans-serif';
        ctx.fillText(k, w * 0.66 + 24, yy);
        const kw = ctx.measureText(k).width;
        let vf = 22;
        ctx.font = `${vf}px Arial, sans-serif`;
        while (ctx.measureText(String(v)).width > w * 0.3 - 70 - kw && vf > 11) {
          vf -= 1;
          ctx.font = `${vf}px Arial, sans-serif`;
        }
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(v), w * 0.96 - 24, yy);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = '#f2f2f2';
      roundRect(ctx, w * 0.72, h * 0.86, w * 0.24, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#20202a';
      let bf = 22;
      ctx.font = `bold ${bf}px Arial, sans-serif`;
      while (ctx.measureText(p.button || 'Повысить уровень').width > w * 0.22 && bf > 12) {
        bf -= 1;
        ctx.font = `bold ${bf}px Arial, sans-serif`;
      }
      ctx.textAlign = 'center';
      ctx.fillText(p.button || 'Повысить уровень', w * 0.84, h * 0.86 + 11);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '22px Arial, sans-serif';
      ['Подробнее', 'Световой конус', 'Следы', 'Эйдолоны', 'Информация'].forEach((m, i) => ctx.fillText(m, 36, h * 0.2 + i * 46));
      ctx.fillStyle = '#f2d06a';
      ctx.fillRect(22, h * 0.2 + 4, 6, 24);
      (p.roster || 12) && Array.from({ length: p.roster || 12 }).forEach((_, i) => {
        ctx.beginPath();
        ctx.arc(w * 0.28 + i * 50, 40, 20, 0, PI * 2);
        ctx.fillStyle = i === 3 ? '#f2d06a' : ['#c86a86', '#7a8ac8', '#c8a86a', '#6ac8b0'][i % 4];
        ctx.fill();
      });
    };
  }

  const BANNER_LOOKS = {
    cerydra: { bg: '#6080c0', hair: '#f4f4f8', eyes: '#3a5ad0', cloth: '#f2f4fa' },
    himeko: { bg: '#c86a3a', hair: '#a8243a', eyes: '#e8b040', cloth: '#f2f2f2' },
    bronya: { bg: '#4a6ac8', hair: '#e6e8f0', eyes: '#3a6ad0', cloth: '#f2f2f6' },
    caelus: { bg: '#5a5a7a', hair: '#7a7a80', eyes: '#d6a646', cloth: '#1c1c22' },
    welt: { bg: '#3a3a5a', hair: '#3a2a22', eyes: '#c8a040', cloth: '#1c1c28' },
    gepard: { bg: '#5a8ac8', hair: '#e8d070', eyes: '#3a6ad0', cloth: '#e8e8f0' },
    herta: { bg: '#7a5ab0', hair: '#e8e0f0', eyes: '#8a5ad8', cloth: '#2a1a3a' },
    march: { bg: '#d88ab0', hair: '#f0c0d8', eyes: '#4a8ad8', cloth: '#f2f2f6' }
  };

  function banner(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (p.cast) {
        const bg = ctx.createLinearGradient(w * 0.3, 0, w, h);
        bg.addColorStop(0, '#0e1430');
        bg.addColorStop(1, '#2a3a78');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        const n = p.cast.length;
        p.cast.forEach((k, i) => {
          const pw = w * 0.6 / n, px = w * 0.35 + i * pw;
          const main = i === 0;
          portrait(ctx, px, main ? h * 0.04 : h * 0.12, pw * (main ? 1.05 : 0.95), h * (main ? 0.8 : 0.7), BANNER_LOOKS[k] || {});
        });
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 12; i++) ctx.fillRect(w * 0.35 + i * 60, 0, 10, h);
      }
      if (!p.cast) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#1a2250');
        g.addColorStop(1, '#3a5ab0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 12; i++) ctx.fillRect(w * 0.35 + i * 60, 0, 22, h);
      }
      const extra = panel(ctx, w * 0.06, h * 0.12, w * 0.3, h * 0.7, p.title || 'Звёздный прыжок');
      ctx.fillStyle = '#d8d8e8';
      ctx.font = '20px Arial, sans-serif';
      ctx.textBaseline = 'top';
      wrap(ctx, p.text || 'Получение предметов 4★ или выше гарантировано каждые 10 прыжков.', w * 0.26).forEach((l, i) => ctx.fillText(l, w * 0.06 + 20, h * 0.12 + 64 + extra + i * 28));
      ctx.fillStyle = '#f2f2f2';
      roundRect(ctx, w * 0.6, h * 0.86, w * 0.16, 44, 22);
      ctx.fill();
      roundRect(ctx, w * 0.78, h * 0.86, w * 0.16, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#20202a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Прыжок ×1', w * 0.68, h * 0.86 + 12);
      ctx.fillText('Прыжок ×10', w * 0.86, h * 0.86 + 12);
      ctx.textAlign = 'left';
    };
  }

  function dialog(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const x = w * 0.2, y = h * 0.2, bw = w * 0.6, bh = h * 0.56;
      if (p.portrait) {
        const gl = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
        gl.addColorStop(0, 'rgba(190,150,255,0.55)');
        gl.addColorStop(1, 'rgba(90,50,160,0.55)');
        ctx.fillStyle = gl;
        ctx.fillRect(w * 0.03, h * 0.18, w * 0.18, h * 0.6);
        portrait(ctx, w * 0.045, h * 0.21, w * 0.15, h * 0.54, { bg: '#5a3a8a', hair: '#7a7a80', eyes: '#d6a646', cloth: '#1c1c22' });
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(w * 0.03, h * 0.18, w * 0.18, h * 0.6);
      }
      if (p.glass) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(w * (0.3 + i * 0.1), 0);
          ctx.lineTo(w * (0.36 + i * 0.1), 0);
          ctx.lineTo(w * (0.2 + i * 0.1), h);
          ctx.lineTo(w * (0.14 + i * 0.1), h);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(p.header || '', w * 0.28, h * 0.12);
      }
      ctx.fillStyle = p.glass ? 'rgba(176,164,224,0.72)' : p.light ? 'rgba(236,236,240,0.97)' : 'rgba(20,22,40,0.94)';
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = p.glass ? 'rgba(255,255,255,0.8)' : p.light ? '#9a9aa6' : 'rgba(170,150,255,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 6, y + 6, bw - 12, bh - 12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = p.titleColor || (p.glass ? '#ffffff' : p.light ? '#2a2a34' : '#e8e0ff');
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.fillText(p.title || '', w / 2, y + 26);
      ctx.fillStyle = p.light ? '#3a3a44' : '#c8c8e0';
      ctx.font = '26px Arial, sans-serif';
      wrap(ctx, p.text || '', bw - 80).forEach((l, i) => ctx.fillText(l, w / 2, y + 90 + i * 36));
      if (p.field) {
        ctx.fillStyle = p.light ? '#ffffff' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(w / 2 - 220, y + bh * 0.46, 440, 56);
        ctx.fillStyle = p.light ? '#1a1a22' : '#ffffff';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillText(p.field, w / 2, y + bh * 0.46 + 12);
        if (p.cursor) ctx.fillRect(w / 2 + ctx.measureText(p.field).width / 2 + 6, y + bh * 0.46 + 10, 3, 36);
      }
      const buttons = p.buttons || ['Подтвердить'];
      const bw2 = Math.min(360, (bw - 60) / buttons.length - 20);
      buttons.forEach((b, i, all) => {
        const bx = p.buttonLeft ? w * 0.25 : w / 2 + (i - (all.length - 1) / 2) * (bw2 + 24) - bw2 / 2;
        ctx.fillStyle = i === all.length - 1 ? '#f2f2f2' : 'rgba(255,255,255,0.18)';
        roundRect(ctx, bx, p.buttonLeft ? h * 0.8 : y + bh - 86, p.buttonLeft ? w * 0.33 : bw2, 50, 25);
        ctx.fill();
        ctx.fillStyle = i === all.length - 1 ? '#20202a' : '#ffffff';
        let fs = 22;
        ctx.font = `bold ${fs}px Arial, sans-serif`;
        while (ctx.measureText(b).width > bw2 - 20 && fs > 12) {
          fs -= 1;
          ctx.font = `bold ${fs}px Arial, sans-serif`;
        }
        ctx.fillText(b, bx + (p.buttonLeft ? w * 0.165 : bw2 / 2), p.buttonLeft ? h * 0.8 + 14 : y + bh - 72);
      });
      ctx.textAlign = 'left';
    };
  }

  function table(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const x = w * 0.06, y = h * 0.08, bw = w * 0.88, bh = h * 0.84;
      ctx.fillStyle = 'rgba(238,238,242,0.97)';
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = '#d8b460';
      ctx.fillRect(x, y, bw, 6);
      ctx.strokeStyle = '#2a2a34';
      ctx.lineWidth = 8;
      ctx.strokeRect(x + 4, y + 4, bw - 8, bh - 8);
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#2a2a34';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.title || 'Подробнее', x + bw * 0.3, y + 20);
      ctx.fillStyle = '#8a8a96';
      ctx.fillText('История', x + bw * 0.7, y + 20);
      ctx.fillStyle = '#b08a3a';
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillText(p.section || 'Персонажи', x + bw / 2, y + 86);
      const names = p.names || ['Март 7', 'Дань Хэн', 'Арлан', 'Аста', 'Герта', 'Наташа', 'Сервал', 'Пела', 'Химеко', 'Хук', 'Сушан', 'Цинцюэ'];
      ctx.font = '22px Arial, sans-serif';
      ctx.fillStyle = '#3a3a44';
      names.forEach((n, i) => {
        const cx = x + bw * (0.16 + (i % 4) * 0.23), cy = y + 136 + Math.floor(i / 4) * 44;
        ctx.fillText(n, cx, cy);
      });
      if (p.section2) {
        ctx.fillStyle = '#b08a3a';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(p.section2, x + bw / 2, y + 136 + Math.ceil(names.length / 4) * 44 + 20);
      }
      ctx.textAlign = 'left';
    };
  }

  function results(p) {
    const hairs = ['#c8c4d6', '#d24f76', '#2f8e9c', '#a0684a', '#6a4a2a', '#e8c860', '#b8342a', '#9cc2ea'];
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.1);
      ctx.translate(-w / 2, -h / 2);
      let card = 0;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
        const cx = w * (0.08 + col * 0.14), cy = h * (0.2 + row * 0.3);
        ctx.save();
        ctx.translate(cx, cy);
        if (col % 2 === 0) {
          const star = (p.gold || []).includes(card) ? '#f2c24e' : (p.purple || []).includes(card) ? '#b884ff' : '#6aa8ff';
          const cw = 116, ch = 160;
          if (card % 2 === 0) portrait(ctx, -cw / 2, -ch / 2, cw, ch, { bg: star, hair: hairs[(card * 3) % hairs.length], eyes: hairs[(card * 5 + 2) % hairs.length], cloth: hairs[(card * 5 + 1) % hairs.length] });
          else {
            const lg = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
            lg.addColorStop(0, hairs[(card * 3) % hairs.length]);
            lg.addColorStop(1, '#1a1a3a');
            ctx.fillStyle = lg;
            ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
            ctx.fillStyle = 'rgba(255,240,200,0.8)';
            ctx.beginPath();
            ctx.arc(20, -36, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = hairs[(card * 5 + 1) % hairs.length];
            ctx.beginPath();
            ctx.ellipse(-12, 36, 22, 30, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(-cw / 2 + 4, -ch / 2 + 4, cw - 8, ch - 8);
          ctx.strokeStyle = star;
          ctx.lineWidth = 6;
          ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
          card++;
        } else {
          ctx.fillStyle = '#20264a';
          roundRect(ctx, -34, -34, 68, 68, 10);
          ctx.fill();
          ctx.fillStyle = hairs[(row * 7 + col) % hairs.length];
          ctx.beginPath();
          ctx.moveTo(-20, 24);
          ctx.lineTo(0, -26);
          ctx.lineTo(20, 24);
          ctx.fill();
          ctx.strokeStyle = '#8ab8ff';
          ctx.lineWidth = 3;
          roundRect(ctx, -34, -34, 68, 68, 10);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    };
  }

  function levelUp(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(8,10,20,0.75)';
      ctx.fillRect(0, h * 0.2, w, h * 0.55);
      const ex = w * 0.215, ey = h * 0.45, er = h * 0.19;
      const eg = ctx.createRadialGradient(ex, ey - er * 0.3, 4, ex, ey, er);
      eg.addColorStop(0, '#fff2b0');
      eg.addColorStop(0.6, '#e0b040');
      eg.addColorStop(1, '#8a6018');
      ctx.fillStyle = eg;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * PI * 2 - PI / 2;
        const rr = i % 2 ? er * 0.62 : er;
        ctx.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5a3a08';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#5a3a08';
      ctx.beginPath();
      ctx.arc(ex, ey, er * 0.3, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      let tf = 40;
      ctx.font = `bold ${tf}px Arial, sans-serif`;
      while (ctx.measureText(p.title || 'Уровень повышен').width > w * 0.4 && tf > 18) {
        tf -= 1;
        ctx.font = `bold ${tf}px Arial, sans-serif`;
      }
      ctx.textBaseline = 'top';
      ctx.fillText(p.title || 'Уровень повышен', w * 0.46, h * 0.26);
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.fillStyle = '#f2d06a';
      ctx.fillText(`Ур. ${p.from || 20}  →  Ур. ${p.to || 30}`, w * 0.46, h * 0.36);
      ctx.fillStyle = '#d8d8e8';
      ctx.font = '28px Arial, sans-serif';
      (p.rows || [['HP', 266, 345], ['Сила атаки', 121, 157], ['Защита', 106, 137]]).forEach(([k, a, b], i) => {
        ctx.fillText(`${k}   ${a}  →  ${b}`, w * 0.46, h * 0.46 + i * 44);
      });
      ctx.fillStyle = '#8a8aa0';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('Нажмите, чтобы закрыть', w * 0.4, h * 0.86);
    };
  }

  function blessings(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10,12,24,0.8)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(p.title || 'Вы победили элитных противников. Выберите 1 благословение.', w / 2, h * 0.1);
      const texts = p.cards || ['Сверхскорость', 'Точный расчёт', 'Звёздный путь'];
      texts.forEach((t, i) => {
        const cx = w / 2 + (i - 1) * w * 0.2;
        const sel = p.pick === i;
        ctx.fillStyle = '#3a2c18';
        ctx.fillRect(cx - w * 0.085, h * 0.22, w * 0.17, h * 0.56);
        const g = ctx.createLinearGradient(0, h * 0.22, 0, h * 0.78);
        g.addColorStop(0, '#e8c070');
        g.addColorStop(0.45, '#8a6420');
        g.addColorStop(1, '#2a1e10');
        ctx.fillStyle = g;
        ctx.fillRect(cx - w * 0.08, h * 0.23, w * 0.16, h * 0.28);
        ctx.fillStyle = '#f6f0e0';
        ctx.fillRect(cx - w * 0.08, h * 0.52, w * 0.16, h * 0.25);
        ctx.fillStyle = '#2a2a34';
        ctx.font = '18px Arial, sans-serif';
        wrap(ctx, t, w * 0.14).slice(0, 5).forEach((l, k) => ctx.fillText(l, cx, h * 0.54 + k * 24));
        if (sel) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6;
          ctx.strokeRect(cx - w * 0.088, h * 0.215, w * 0.176, h * 0.57);
        }
      });
      ctx.textAlign = 'left';
    };
  }

  function suMap(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Виртуальная вселенная', 60, 30);
      ctx.fillStyle = '#b8b8d0';
      ctx.font = '20px Arial, sans-serif';
      ['Магазин Герты', 'Древо знаний'].forEach((m, i) => ctx.fillText(m, 60, 80 + i * 32));
      ctx.fillStyle = '#d8d8f0';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText(p.world || 'Мир 2', w * 0.36, h * 0.44);
      ctx.fillStyle = '#9aa0c8';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText(p.points || '1500/1500', 120, h - 60);
    };
  }

  function lost(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = 'rgba(20,14,16,0.9)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#e04a4a';
      ctx.font = 'bold 44px Arial, sans-serif';
      ctx.fillText('Бой проигран', w / 2, h * 0.18);
      ctx.fillStyle = '#d0c8c8';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('Рекомендуемый уровень отряда ' + (p && p.level ? p.level : 26), w * 0.36, h * 0.34);
      ctx.fillText('Уязвимость', w * 0.36, h * 0.4);
      ctx.fillText('Сообщение', w / 2, h * 0.52);
      ctx.fillStyle = '#9a9090';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Используйте расходуемые предметы, которые помогут в бою.', w / 2, h * 0.6);
      ctx.fillStyle = '#e8e8e8';
      roundRect(ctx, w * 0.28, h * 0.8, w * 0.18, 44, 22);
      ctx.fill();
      roundRect(ctx, w * 0.54, h * 0.8, w * 0.18, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#20202a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('Отступить', w * 0.37, h * 0.8 + 12);
      ctx.fillText('Повторить испытание', w * 0.63, h * 0.8 + 12);
      ctx.textAlign = 'left';
    };
  }

  function hudFrame(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const party = p.party || [];
      ctx.textBaseline = 'top';
      for (let i = 0; i < (p.order || 6); i++) {
        ctx.fillStyle = 'rgba(20,24,40,0.75)';
        ctx.fillRect(10, 60 + i * 64, 70, 58);
        ctx.fillStyle = (p.orderColors || [])[i] || ['#c86a86', '#6a7ac8', '#c8a86a', '#6ac8b0', '#8a8aa0', '#c86a6a'][i % 6];
        ctx.fillRect(16, 66 + i * 64, 58, 46);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText('Раунд 1', 14, 30);
      party.forEach((c, i) => {
        const x = w * 0.14 + i * w * 0.12;
        const y = h - 118;
        ctx.fillStyle = 'rgba(12,14,24,0.7)';
        ctx.fillRect(x, y, w * 0.105, 96);
        ctx.fillStyle = c.color || '#c8c8d8';
        ctx.beginPath();
        ctx.arc(x + 40, y + 40, 32, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbe6dc';
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 50, 20, 22, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = c.color || '#c8c8d8';
        ctx.fillRect(x + 18, y + 26, 44, 12);
        ctx.fillStyle = '#2a2030';
        ctx.fillRect(x + 30, y + 48, 6, 6);
        ctx.fillRect(x + 44, y + 48, 6, 6);
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(x + 8, y + 80, w * 0.105 - 16, 7);
        ctx.fillStyle = '#6ae08a';
        ctx.fillRect(x + 8, y + 80, (w * 0.105 - 16) * (c.hp === undefined ? 1 : c.hp), 7);
        if (c.hpText) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(String(c.hpText), x + w * 0.105 - 6, y + 56);
          ctx.fillText(String(c.hpText), x + w * 0.105 - 6, y + 56);
          ctx.textAlign = 'left';
        }
        ctx.strokeStyle = c.ult ? '#f2d06a' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + w * 0.105 - 34, y + 34, 22, 0, PI * 2 * (c.energy === undefined ? 0.5 : c.energy));
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText(String(i + 1), x + 6, y + 4);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.72 + i * 22, h - 42, 7, 0, PI * 2);
        if (i < (p.points === undefined ? 3 : p.points)) ctx.fill();
        else {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      [[w * 0.86, h - 90, 44], [w * 0.95, h - 60, 36]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, PI * 2);
        ctx.fillStyle = 'rgba(20,24,40,0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('2x', w - 160, 20);
      ctx.fillRect(w - 100, 22, 6, 20);
      ctx.fillRect(w - 90, 22, 6, 20);
      if (p.boss) {
        ctx.fillStyle = '#e8e0e0';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.boss, w / 2, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(w * 0.3, 50, w * 0.4, 12);
        ctx.fillStyle = '#e04a4a';
        ctx.fillRect(w * 0.3, 50, w * 0.4 * (p.bossHp === undefined ? 0.8 : p.bossHp), 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w * 0.3, 66, w * 0.4 * (p.bossTough === undefined ? 0.6 : p.bossTough), 5);
        ctx.textAlign = 'left';
      }
      if (p.banner) {
        const g = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, 'rgba(0,0,0,0.65)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(w * 0.2, h * 0.22, w * 0.6, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.banner, w / 2, h * 0.22 + 12);
        ctx.textAlign = 'left';
      }
    };
  }

  function skillName(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = p.low ? 'bold 30px Arial, sans-serif' : 'bold 36px Arial, sans-serif';
      const y = h * (p.low ? 0.86 : 0.66);
      outline(ctx, p.text, w - 40, y, '#ffffff', 'rgba(20,20,40,0.9)', 6);
      ctx.fillStyle = p.color || '#e05a8a';
      ctx.fillRect(w - 40 - Math.min(w * 0.4, ctx.measureText(p.text).width), y + 6, Math.min(w * 0.4, ctx.measureText(p.text).width), 5);
      ctx.textAlign = 'left';
    };
  }

  function sponsor(p) {
    return (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#101830');
      g.addColorStop(1, '#223a78');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (p.mode === 'logo') {
        ctx.fillStyle = '#3a8aff';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -PI / 2 + (i * 2 * PI) / 5;
          const a2 = a + PI / 5;
          ctx.lineTo(w * 0.22 + Math.cos(a) * 90, h / 2 + Math.sin(a) * 90);
          ctx.lineTo(w * 0.22 + Math.cos(a2) * 40, h / 2 + Math.sin(a2) * 40);
        }
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 110px Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('Звёздная касса', w * 0.31, h / 2);
        return;
      }
      if (p.mode === 'coupon') {
        ctx.fillStyle = '#e8f2ff';
        roundRect(ctx, w * 0.2, h * 0.25, w * 0.6, h * 0.5, 30);
        ctx.fill();
        ctx.fillStyle = '#2a6ae0';
        ctx.fillRect(w * 0.6, h * 0.25, w * 0.2, h * 0.5);
        ctx.fillStyle = '#2a6ae0';
        ctx.font = 'bold italic 120px Impact, Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('HAYATO', w * 0.24, h / 2 + 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 110px Impact, Arial, sans-serif';
        ctx.fillText('-5%', w * 0.62, h / 2 + 10);
        ctx.fillStyle = '#2a6ae0';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillText('Звёздная касса', w * 0.24, h * 0.3);
        return;
      }
      panel(ctx, w * 0.1, h * 0.08, w * 0.8, h * 0.84, p.title || 'Звёздная касса');
      ctx.fillStyle = '#d8e4ff';
      ctx.font = '24px Arial, sans-serif';
      ctx.textBaseline = 'top';
      (p.rows || []).forEach((row, i) => {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(w * 0.13, h * 0.2 + i * 52, w * 0.74, 44);
        ctx.fillStyle = '#e8eeff';
        ctx.fillText(row, w * 0.15, h * 0.2 + i * 52 + 10);
      });
      if (p.button) {
        ctx.fillStyle = '#2a7aff';
        roundRect(ctx, w * 0.38, h * 0.8, w * 0.24, 50, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.button, w / 2, h * 0.8 + 12);
        ctx.textAlign = 'left';
      }
    };
  }

  function boardTitle(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      let fs = 100;
      ctx.font = `bold ${fs}px Arial, sans-serif`;
      while (ctx.measureText(p.text).width > w - 40 && fs > 30) {
        fs -= 4;
        ctx.font = `bold ${fs}px Arial, sans-serif`;
      }
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      outline(ctx, p.text, 20, h / 2, '#ffffff', '#6a3a14', 10);
    };
  }

  function note(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = p.bg || '#f6f2e8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = p.color || '#2a2a34';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      let size = p.size || 34;
      ctx.font = `bold ${size}px Arial, sans-serif`;
      const lines = wrap(ctx, p.text || '', w - 40);
      const y0 = (h - lines.length * size * 1.2) / 2;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * size * 1.2));
      ctx.textAlign = 'left';
    };
  }

  function channelPage() {
    return (ctx, w, h) => {
      ctx.fillStyle = '#0f0f0f';
      const vids = [['ПРОКЛЯТЫЙ АККАУНТ', '9:32', 'прошёл весь эндгейм на проклятом аккаунте', '5,4 тыс.'], ['ЗАСТАВИЛ', '9:55', 'Заставил друга играть в ХСР', '3 тыс.'], ['СЛИЛ ВСЁ', '12:29', '5000 энергии на проклятом аккаунте', '8 тыс.'], ['36★', '13:32', 'Путь до 36★ на проклятом аккаунте', '13 тыс.'], ['КЛОНЫ', '10:38', 'Попробовал странные клоны ХСР', '30 тыс.']];
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Arial Black, Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('You', 30, 20);
      const yw = ctx.measureText('You').width;
      ctx.fillStyle = '#cc0000';
      roundRect(ctx, 34 + yw, 16, 96, 58, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Vid', 42 + yw, 20);
      const g = ctx.createLinearGradient(0, 100, 0, 250);
      g.addColorStop(0, '#05050e');
      g.addColorStop(1, '#1a1030');
      ctx.fillStyle = g;
      ctx.fillRect(30, 100, w - 60, 150);
      const neb = ctx.createRadialGradient(w * 0.62, 175, 5, w * 0.62, 175, w * 0.3);
      neb.addColorStop(0, 'rgba(150,90,220,0.55)');
      neb.addColorStop(0.5, 'rgba(60,40,140,0.3)');
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(30, 100, w - 60, 150);
      for (let i = 0; i < 90; i++) {
        const sx = 30 + ((i * 197) % (w - 60)), sy = 104 + ((i * 53) % 142);
        ctx.fillStyle = i % 7 ? 'rgba(255,255,255,0.7)' : 'rgba(180,200,255,0.9)';
        ctx.fillRect(sx, sy, i % 5 ? 2 : 3, i % 5 ? 2 : 3);
      }
      ctx.strokeStyle = 'rgba(255,40,30,0.9)';
      ctx.lineWidth = 4;
      [[w * 0.58, 168], [w * 0.64, 168]].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + w * 0.3, ey + 60);
        ctx.stroke();
        ctx.fillStyle = '#ff5040';
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#16161b';
      ctx.fillRect(30, 270, w - 60, h - 300);
      ctx.save();
      ctx.beginPath();
      ctx.arc(110, 320, 46, 0, PI * 2);
      ctx.clip();
      portrait(ctx, 64, 274, 92, 92, { bg: '#34506e', hair: '#1a1a22', eyes: '#3a8ab0', cloth: '#2a8a8a' });
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText('Hayato', 180, 282);
      ctx.fillStyle = '#d0d0d4';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('@Hayato_me · 807 подписчиков · 8 видео', 180, 322);
      ctx.fillText('Просчитался , но где?   t.me/Kishlak_Hayato', 180, 352);
      vids.forEach(([tag, dur, title, views], i) => {
        const x = 60 + i * ((w - 120) / 5), cw = (w - 120) / 5 - 16;
        ctx.fillStyle = ['#5a2a6a', '#2a5a8a', '#8a2a3a', '#2a7a5a', '#6a5a2a'][i];
        ctx.fillRect(x, 400, cw, 100);
        ctx.font = 'bold 20px Impact, Arial, sans-serif';
        outline(ctx, tag, x + 8, 410, '#ffffff', '#000000', 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + cw - 50, 476, 46, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.fillText(dur, x + cw - 46, 478);
        ctx.fillStyle = '#e8e8ec';
        ctx.font = '15px Arial, sans-serif';
        wrap(ctx, title, cw).slice(0, 2).forEach((l, k) => ctx.fillText(l, x, 508 + k * 18));
        ctx.fillStyle = '#9a9aa4';
        ctx.fillText(views + ' просмотров', x, 546);
      });
    };
  }

  function editor() {
    return (ctx, w, h) => {
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, w, 36);
      ctx.fillRect(w - 260, 36, 260, h - 36);
      ctx.fillStyle = '#c8c8c8';
      ctx.font = '18px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ['Файл', 'Правка', 'Вид', 'Объект', 'Поза'].forEach((m, i) => ctx.fillText(m, 16 + i * 80, 9));
      ['Armature', '  Hayato_body', '  Hayato_hair', '  Gloves', 'Camera', 'Light'].forEach((m, i) => ctx.fillText(m, w - 240, 56 + i * 30));
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let x = 0; x < w - 260; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 36);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 36; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w - 260, y);
        ctx.stroke();
      }
    };
  }

  function shop(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = 'rgba(10,12,28,0.92)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(p.title || 'Магазин', 50, 30);
      const cards = p.cards || ['За завтрашнее путешествие', 'Талисман экзорцизма', 'Эй, я здесь', 'Перед началом миссии', 'Запись ниндзя', 'Звёздный пропуск', 'Хор', 'Созвучие'];
      cards.forEach((c, i) => {
        const cx = 60 + (i % 4) * 235, cy = 100 + Math.floor(i / 4) * 230;
        ctx.fillStyle = ['#8a6ad8', '#5a8ad8', '#d8a44a', '#6ab8a8'][i % 4];
        ctx.fillRect(cx, cy, 200, 150);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(cx, cy + 150, 200, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = '17px Arial, sans-serif';
        wrap(ctx, c, 190).slice(0, 2).forEach((l, k) => ctx.fillText(l, cx + 6, cy + 154 + k * 20));
        ctx.fillStyle = '#f2d06a';
        ctx.fillText('Доступно: 1/1', cx + 6, cy + 8);
      });
    };
  }

  function team(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = 'rgba(10,12,28,0.94)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = ['#c86a86', '#6a7ac8', '#c8a86a', '#6ac8b0'][i % 4];
        ctx.fillRect(40 + (i % 3) * 110, 60 + Math.floor(i / 3) * 110, 96, 96);
      }
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(p.world || 'Мир 2', 440, 50);
      ctx.font = '22px Arial, sans-serif';
      ['Рекомендуемый уровень отряда 25', 'Рекомендуемый тип персонажей', 'Боссы', 'Возможные противники', 'Загруженные персонажи'].forEach((l, i) => ctx.fillText(l, 440, 110 + i * 60));
      (p.party || []).forEach((k, i) => {
        ctx.fillStyle = ['#d24f76', '#a0684a', '#c8c4d6', '#2f8e9c'][i % 4];
        ctx.beginPath();
        ctx.arc(470 + i * 80, 440, 32, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#f2f2f2';
      roundRect(ctx, w - 300, h - 80, 260, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#20202a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('Запустить Виртуальную вселенную', w - 290, h - 66);
    };
  }

  function paths(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = 'rgba(10,12,28,0.9)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.fillText('Выберите Путь', w / 2, 40);
      (p.paths || []).forEach((n, i, all) => {
        const cx = w / 2 + (i - (all.length - 1) / 2) * 220;
        ctx.strokeStyle = '#d8c8ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, h * 0.45, 70, 0, PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(160,140,255,0.3)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(n, cx, h * 0.45 + 90);
      });
      ctx.fillStyle = 'rgba(40,120,120,0.85)';
      roundRect(ctx, 60, h - 120, w - 120, 80, 16);
      ctx.fill();
      ctx.fillStyle = '#e8ffff';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText('Ты можешь выбрать любой Путь...', w / 2, h - 96);
      ctx.textAlign = 'left';
    };
  }

  function phone(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (!p.open) {
        ctx.fillStyle = 'rgba(28,28,36,0.96)';
        roundRect(ctx, w * 0.3, h * 0.12, w * 0.4, h * 0.76, 30);
        ctx.fill();
        ctx.fillStyle = '#f090b8';
        ctx.beginPath();
        ctx.arc(w * 0.38, h * 0.26, 44, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f2f2f2';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillText('Hayatososal?', w * 0.44, h * 0.2);
        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#a8a8b8';
        ctx.fillText('UID 827246486', w * 0.44, h * 0.27);
        ['Уровень Равновесия 0', 'Описания ещё нет...', 'Уровень Освоения 19', 'Опыт Освоения 285/1500'].forEach((l, i) => ctx.fillText(l, w * 0.34, h * 0.4 + i * 40));
        ['Магазин', 'Друзья', 'Поручения'].forEach((l, i) => ctx.fillText(l, w * 0.34 + i * 130, h * 0.78));
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.3 + i * 70, 40, 22, 0, PI * 2);
        ctx.fill();
      }
      if (p.corner) {
        ctx.font = 'bold 90px Arial, sans-serif';
        ctx.textBaseline = 'top';
        outline(ctx, p.corner, 30, 60, '#ffffff', '#000000', 8);
      }
    };
  }

  function walkHud(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(110, 110, 80, 0, PI * 2);
      ctx.fillStyle = 'rgba(20,24,40,0.55)';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(110, 96);
      ctx.lineTo(100, 122);
      ctx.lineTo(120, 122);
      ctx.fill();
      if (p.loc) {
        ctx.font = 'bold 22px Arial, sans-serif';
        outline(ctx, p.loc, 30, 200, '#ffffff', 'rgba(0,0,0,0.6)', 4);
      }
      if (p.topTag) {
        ctx.font = 'bold 26px Arial, sans-serif';
        const tw = ctx.measureText(p.topTag).width + 40;
        ctx.fillStyle = 'rgba(10,12,24,0.65)';
        ctx.fillRect(w / 2 - tw / 2, 8, tw, 40);
        ctx.fillStyle = '#f2e0b0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(p.topTag, w / 2, 14);
        ctx.textAlign = 'left';
      }
      if (p.quest) {
        ctx.font = '20px Arial, sans-serif';
        outline(ctx, p.quest, 30, 234, '#f2d06a', 'rgba(0,0,0,0.6)', 4);
      }
      (p.party || []).forEach((k, i) => {
        ctx.fillStyle = 'rgba(20,24,40,0.6)';
        ctx.fillRect(w - 230, 160 + i * 64, 210, 56);
        ctx.fillStyle = ['#d24f76', '#a0684a', '#c8c4d6', '#2f8e9c'][i % 4];
        ctx.beginPath();
        ctx.arc(w - 200, 188 + i * 64, 22, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText(String(k), w - 168, 178 + i * 64);
      });
      if (p.tag) {
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        outline(ctx, p.tag, w * 0.62, h * 0.26, '#ff8a6a', 'rgba(0,0,0,0.7)', 4);
        ctx.textAlign = 'left';
      }
      const level = p.banner && /Уровень Освоения (\d+)/.exec(p.banner);
      if (level) {
        const g = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(w * 0.25, 190, w * 0.5, 50);
        ctx.fillStyle = '#3aa85a';
        ctx.beginPath();
        ctx.arc(w / 2, 130, 52, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d8f8c8';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 52px Arial, sans-serif';
        ctx.fillText(level[1], w / 2, 104);
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText('Уровень Освоения', w / 2, 200);
        ctx.textAlign = 'left';
      } else if (p.banner) {
        ctx.font = 'bold 28px Arial, sans-serif';
        const bw = Math.max(w * 0.4, ctx.measureText(p.banner).width + 60);
        ctx.fillStyle = 'rgba(242,208,106,0.92)';
        ctx.fillRect(w / 2 - bw / 2, 120, bw, 56);
        ctx.fillStyle = '#2a2008';
        ctx.textAlign = 'center';
        ctx.fillText(p.banner, w / 2, 132);
        ctx.textAlign = 'left';
      }
      if (p.rewards) {
        ctx.font = '20px Arial, sans-serif';
        p.rewards.forEach((l, i) => {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(40, 300 + i * 34, 300, 30);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(l, 50, 304 + i * 34);
        });
      }
      if (p.sub) {
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'center';
        outline(ctx, p.sub, w / 2, h - 70, '#ffffff', 'rgba(0,0,0,0.8)', 5);
        ctx.textAlign = 'left';
      }
    };
  }

  function battleText(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = 'top';
      if (p.total !== undefined) {
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(w - 250, 70, 230, 70);
        ctx.fillStyle = '#e8e8ee';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText('ОБЩИЙ УРОН', w - 30, 74);
        ctx.fillStyle = '#f2c24e';
        ctx.font = 'italic bold 42px Arial, sans-serif';
        ctx.fillText(String(p.total), w - 30, 96);
        ctx.textAlign = 'left';
      }
      if (p.alert) {
        ctx.fillStyle = 'rgba(160,20,30,0.85)';
        ctx.fillRect(w * 0.18, h * 0.16, w * 0.64, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.alert, w / 2, h * 0.16 + 12);
        ctx.textAlign = 'left';
      }
      if (p.buffs) {
        ctx.font = 'bold 22px Arial, sans-serif';
        for (let i = 0; i < 3; i++) {
          const x = w * 0.04, y = h * 0.36 + i * 38;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x - 6, y - 4, ctx.measureText(p.buffs).width + 40, 32);
          ctx.fillStyle = '#6ae0ff';
          ctx.fillText('▲ ' + p.buffs, x, y);
        }
      }
    };
  }

  function skillCard(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#0c0e16';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1a1e2c';
      ctx.fillRect(40, 40, w * 0.62, h - 80);
      ctx.fillStyle = '#6ae08a';
      ctx.fillRect(60, 60, 150, 36);
      ctx.fillStyle = '#0c0e16';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Ultimate', 72, 66);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.fillText(p.title || '', 230, 64);
      ctx.fillStyle = '#c8c8d8';
      ctx.font = '24px Arial, sans-serif';
      ['Lv. 10', 'Energy gain: 5   Break: 20'].forEach((l, i) => ctx.fillText(l, 60, 130 + i * 36));
      const lines = wrap(ctx, p.text || '', w * 0.58);
      lines.forEach((l, i) => ctx.fillText(l, 60, 220 + i * 34));
      if (p.circle) {
        ctx.strokeStyle = '#e02020';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(w * 0.36, 236, 70, 34, 0, 0, PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.45, 330);
        ctx.lineTo(w * 0.39, 268);
        ctx.stroke();
      }
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(w * 0.7, 40, w * 0.26, h * 0.4);
      portrait(ctx, w * 0.72, 60, w * 0.22, h * 0.36, { bg: '#b0a0e0', hair: '#5a3a7a', eyes: '#2a6a9a' });
      if (p.arrows) {
        ctx.fillStyle = '#1a1e2c';
        ctx.fillRect(w * 0.3, h * 0.56, w * 0.68, h * 0.38);
        ctx.fillStyle = '#c8c8d8';
        ctx.font = '22px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Talent / Following Stars', w * 0.37, h * 0.6);
        ctx.fillText('Increases DMG dealt by all allies.', w * 0.37, h * 0.68);
        ctx.strokeStyle = '#e02020';
        ctx.lineWidth = 7;
        [[w * 0.42, h * 0.3, w * 0.5, h * 0.4], [w * 0.78, h * 0.7, w * 0.85, h * 0.8]].forEach(([x0, y0, x1, y1]) => {
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          const a = Math.atan2(y1 - y0, x1 - x0);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - Math.cos(a - 0.5) * 22, y1 - Math.sin(a - 0.5) * 22);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - Math.cos(a + 0.5) * 22, y1 - Math.sin(a + 0.5) * 22);
          ctx.stroke();
        });
      }
      if (p.inset) {
        ctx.fillStyle = '#3a3226';
        ctx.fillRect(40, h * 0.62, w * 0.3, h * 0.34);
        ctx.font = 'bold 34px Arial, sans-serif';
        ctx.textAlign = 'center';
        outline(ctx, p.inset, 40 + w * 0.15, h * 0.62 + h * 0.26, '#ffffff', '#b01010', 6);
        ctx.textAlign = 'left';
      }
    };
  }

  function search(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px Arial Black, Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('You', 30, 20);
      const yw = ctx.measureText('You').width;
      ctx.fillStyle = '#cc0000';
      roundRect(ctx, 34 + yw, 16, 76, 46, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Vid', 40 + yw, 20);
      ctx.strokeStyle = '#7f9db9';
      ctx.strokeRect(260, 24, 420, 36);
      [0, 1].forEach(i => {
        const y = 100 + i * 220;
        portrait(ctx, 30, y, 330, 190, i ? { bg: '#e080b0', hair: '#f0f0f0', eyes: '#c03060' } : { bg: '#303a58', hair: '#1a1a22', eyes: '#e0a030', cloth: '#d02020' });
        ctx.strokeStyle = '#999999';
        ctx.strokeRect(30, y, 330, 190);
        ctx.fillStyle = '#f1f1f1';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(i ? 'Как ощущается ЗЗЗ 2.0' : (p.title || ''), 390, y + 6);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText(i ? '4,6 млн просмотров · 3 месяца назад' : (p.views || ''), 390, y + 46);
      });
      if (p.overlay) {
        ctx.font = 'italic bold 30px Arial, sans-serif';
        wrap(ctx, p.overlay, w * 0.5).forEach((l, i) => outline(ctx, l, w * 0.42, 190 + i * 38, '#ffffff', '#000000', 6));
      }
    };
  }

  function tvList(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f1f1f1';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Другие видео, которые смотрели зрители', 20, 12);
      (p.items || []).forEach((t, i) => {
        const y = 70 + i * 150;
        const tint = ['#e8c85a', '#6a8ad8', '#d8604a', '#8a5ad8', '#5ab88a', '#c8c8d8'][i % 6];
        portrait(ctx, 20, y, 230, 130, { bg: tint, hair: ['#2a2430', '#e8e0f0', '#a8243a'][i % 3], eyes: '#3a6ad0', cloth: '#1c1c28' });
        ctx.font = 'bold 30px Impact, Arial, sans-serif';
        outline(ctx, 'ONLY', 30, y + 88, '#ffffff', '#000000', 5);
        ctx.fillStyle = '#f1f1f1';
        ctx.font = 'bold 24px Arial, sans-serif';
        wrap(ctx, t, w - 300).slice(0, 2).forEach((l, k) => ctx.fillText(l, 270, y + 8 + k * 30));
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '19px Arial, sans-serif';
        ctx.fillText((120 + i * 37) + ' тыс. просмотров', 270, y + 80);
      });
    };
  }

  function webcam() {
    return (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#6a5a4a');
      g.addColorStop(1, '#3a3028');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f0cdb8';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.5, w * 0.16, h * 0.28, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a4a2a';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.3, w * 0.2, h * 0.14, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      ctx.strokeRect(w / 2 - 50, h * 0.44, 40, 26);
      ctx.strokeRect(w / 2 + 10, h * 0.44, 40, 26);
      ctx.fillStyle = '#2a4a8a';
      ctx.fillRect(w * 0.25, h * 0.8, w * 0.5, h * 0.2);
      [-1, 1].forEach(s2 => {
        ctx.fillStyle = '#f0cdb8';
        ctx.beginPath();
        ctx.ellipse(w / 2 + s2 * w * 0.2, h * 0.3, 22, 30, 0, 0, PI * 2);
        ctx.fill();
      });
    };
  }

  function appGrid(p) {
    return (ctx, w, h) => {
      ctx.fillStyle = p.light ? '#dde6f4' : '#10131e';
      ctx.fillRect(0, 0, w, h);
      const cols = ['#e04a4a', '#4a8ae0', '#e0c04a', '#6ad08a', '#b04ae0', '#e08a4a', '#4ae0d0', '#8a8aa0'];
      const nc = p.cols || 9, nr = p.rows || 5;
      for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) {
        const x = 30 + i * 112 + (nc > 4 ? (j % 2) * 20 : 0), y = 20 + j * 112;
        ctx.fillStyle = cols[(i * 3 + j) % cols.length];
        roundRect(ctx, x, y, 96, 96, 20);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        if (p.game) {
          const kind = (i * 7 + j * 3) % 4;
          ctx.save();
          ctx.translate(x + 48, y + 48);
          ctx.beginPath();
          if (kind === 0) { ctx.moveTo(-6, 30); ctx.lineTo(-6, -24); ctx.lineTo(0, -34); ctx.lineTo(6, -24); ctx.lineTo(6, 30); ctx.rect(-18, 18, 36, 6); }
          else if (kind === 1) { for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? 12 : 30; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
          else if (kind === 2) { ctx.moveTo(0, -30); ctx.lineTo(26, 0); ctx.lineTo(0, 30); ctx.lineTo(-26, 0); }
          else { ctx.arc(0, -8, 16, 0, PI * 2); ctx.rect(-22, 10, 44, 20); }
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x + 48, y + 48, 18 + ((i + j) % 3) * 6, 0, PI * 2);
          ctx.fill();
        }
      }
    };
  }

  function teamLine(p) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(20,24,40,0.8)';
      ctx.fillRect(28, 20, 470, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Отряд 1', 40, 30);
      ctx.font = 'bold 18px Arial, sans-serif';
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i === 0 ? '#f2d06a' : 'rgba(255,255,255,0.45)';
        ctx.fillRect(40 + i * 60, 80, 48, 30);
        ctx.fillStyle = '#20202a';
        ctx.fillText('0' + (i + 1), 52 + i * 60, 86);
      }
      ctx.font = '24px Arial, sans-serif';
      ['Аста', 'Тинъюнь', 'Броня', 'Юйкун'].forEach((n, i) => {
        ctx.fillStyle = 'rgba(20,24,40,0.8)';
        ctx.fillRect(110 + i * 220, h - 150, 150, 68);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(n, 120 + i * 220, h - 144);
        ctx.fillStyle = '#c8b8ff';
        ctx.fillText('Гармония', 120 + i * 220, h - 112);
      });
      ctx.fillStyle = '#f2f2f2';
      roundRect(ctx, w - 320, h - 50, 280, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#20202a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('Активный отряд', w - 250, h - 41);
    };
  }

  window.HayatoUI = { skillCard, search, tvList, webcam, appGrid, teamLine, shop, team, paths, phone, walkHud, battleText, caption, subtitle, damage, chat, post, statScreen, banner, dialog, table, results, levelUp, blessings, suMap, lost, hudFrame, skillName, sponsor, boardTitle, note, channelPage, editor, outline, wrap, roundRect, photo, catEmoji, duo, poster, pixelEmoji };
})();
