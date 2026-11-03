(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  const ORANGE = '#f3a43a';
  const ORANGE_DK = '#7a3a12';
  const FONT = '"Arial Black", "Arial Bold", Arial, sans-serif';

  function fit(ctx, text, max, size, weight) {
    let s = size;
    ctx.font = `${weight || 900} ${s}px ${FONT}`;
    while (s > 8 && ctx.measureText(text).width > max) {
      s -= 2;
      ctx.font = `${weight || 900} ${s}px ${FONT}`;
    }
    return s;
  }

  function outlined(ctx, text, x, y, fill, stroke, lw) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function smoke(ctx, w, h, seed, dark) {
    const g = rand(seed);
    ctx.fillStyle = dark ? '#0b0b0b' : '#1c1c1c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = g() * w, y = g() * h, rr = (0.1 + g() * 0.3) * w;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
      const a = dark ? 0.04 + g() * 0.06 : 0.05 + g() * 0.09;
      gr.addColorStop(0, `rgba(220,220,220,${a})`);
      gr.addColorStop(1, 'rgba(220,220,220,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const a0 = g() * PI * 2;
      const len = 0.35 + g() * 0.6;
      const gr = ctx.createLinearGradient(w / 2, h / 2, w / 2 + Math.cos(a0) * w * len, h / 2 + Math.sin(a0) * h * len);
      gr.addColorStop(0, `rgba(255,255,255,${0.1 + g() * 0.12})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1 + g() * 7;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.52);
      ctx.lineTo(w / 2 + Math.cos(a0) * w * len, h * 0.52 + Math.sin(a0) * h * len);
      ctx.stroke();
    }
    const core = ctx.createRadialGradient(w / 2, h * 0.52, 0, w / 2, h * 0.52, w * 0.22);
    core.addColorStop(0, 'rgba(255,255,255,0.35)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  function smokeCard(lines, opts) {
    const o = opts || {};
    return (ctx, w, h) => {
      if (o.clear) ctx.clearRect(0, 0, w, h);
      else smoke(ctx, w, h, 11, false);
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'middle';
      const n = lines.length;
      lines.forEach((t, i) => {
        const size = fit(ctx, t, w * (o.wide || 0.62), Math.round(h * (o.size || (n > 2 ? 0.11 : 0.13))));
        ctx.font = `900 ${size}px ${FONT}`;
        const y = h * (0.5 + (i - (n - 1) / 2) * (o.gap || 0.13));
        const x = o.align === 'left' ? w * 0.05 : w / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(t, x + size * 0.06, y + size * 0.08);
        const gr = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.55, '#e6e6e6');
        gr.addColorStop(1, '#a8a8a8');
        ctx.fillStyle = gr;
        ctx.fillText(t, x, y);
      });
    };
  }

  function orangeTitle(text, opts) {
    const o = opts || {};
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = 'middle';
      const lines = text.split('\n');
      lines.forEach((t, i) => {
        const size = fit(ctx, t, w * 0.94, Math.round(h * (o.size || 0.5) / lines.length));
        const y = h * ((i + 0.5) / lines.length);
        const x = o.align === 'left' ? w * 0.03 : w / 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 1.05);
        if (o.glow) {
          ctx.shadowColor = o.glow;
          ctx.shadowBlur = size * 0.5;
        }
        outlined(ctx, t, 0, 0, o.fill || ORANGE, o.stroke || ORANGE_DK, size * 0.16);
        ctx.shadowBlur = 0;
        const gr = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
        gr.addColorStop(0, 'rgba(255,240,170,0.65)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillText(t, 0, 0);
        ctx.restore();
      });
    };
  }

  function logo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.52;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.08);
    const bw = w * 0.62, bh = h * 0.56;
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(-bw / 2 + 6, -bh / 2 + 8, bw, bh);
    const wood = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
    wood.addColorStop(0, '#d79a4a');
    wood.addColorStop(0.5, '#c4823a');
    wood.addColorStop(1, '#a96a2c');
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -bh / 2 + 12);
    ctx.lineTo(bw / 2 - 18, -bh / 2);
    ctx.lineTo(bw / 2, bh / 2 - 10);
    ctx.lineTo(-bw / 2 + 14, bh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.55)';
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-bw / 2, i * bh / 9);
      ctx.bezierCurveTo(-bw / 6, i * bh / 9 + 6, bw / 6, i * bh / 9 - 6, bw / 2, i * bh / 9 + 3);
      ctx.stroke();
    }
    ctx.strokeStyle = '#4a2e14';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s1 = fit(ctx, 'TEAM', bw * 0.42, Math.round(bh * 0.26));
    ctx.font = `900 ${s1}px ${FONT}`;
    outlined(ctx, 'TEAM', -bw * 0.18, -bh * 0.27, '#f6b63e', '#5a2a0e', s1 * 0.14);
    const s3 = fit(ctx, 'FABULOUS', bw * 0.72, Math.round(bh * 0.28));
    ctx.font = `900 ${s3}px ${FONT}`;
    outlined(ctx, 'FABULOUS', -bw * 0.1, -bh * 0.02, '#f6b63e', '#5a2a0e', s3 * 0.14);
    const s2 = Math.round(bh * 0.66);
    ctx.font = `900 ${s2}px ${FONT}`;
    outlined(ctx, '2', bw * 0.4, bh * 0.2, '#f6b63e', '#5a2a0e', s2 * 0.1);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#c23a2a';
    ctx.beginPath();
    ctx.arc(-bw * 0.22, bh * 0.3, bh * 0.07, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#3a78b8';
    ctx.beginPath();
    ctx.arc(-bw * 0.06, bh * 0.3, bh * 0.07, -PI / 2, PI / 2);
    ctx.stroke();
    ctx.restore();
    const arrow = (x, y, ang, col) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.strokeStyle = '#2a1a10';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-40, -12);
      ctx.lineTo(10, -12);
      ctx.lineTo(10, -30);
      ctx.lineTo(44, 0);
      ctx.lineTo(10, 30);
      ctx.lineTo(10, 12);
      ctx.lineTo(-40, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    arrow(w * 0.2, h * 0.36, PI * 0.95, '#c8352a');
    arrow(w * 0.79, h * 0.2, -PI * 0.38, '#3a78c8');
  }

  function sketch(kind) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#f6f6f2';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#141414';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const g = rand(kind.length * 97);
      const jit = (v) => v + (g() - 0.5) * w * 0.006;
      const path = (pts, lw) => {
        ctx.lineWidth = lw || 3;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(jit(x * w), jit(y * h)) : ctx.moveTo(jit(x * w), jit(y * h))));
        ctx.stroke();
      };
      const scribble = (x0, y0, x1, y1, n) => {
        ctx.lineWidth = 2;
        for (let i = 0; i < n; i++) {
          const ax = x0 + (x1 - x0) * g(), ay = y0 + (y1 - y0) * g();
          ctx.beginPath();
          ctx.moveTo(ax * w, ay * h);
          ctx.lineTo((ax + 0.04 * (g() - 0.3)) * w, (ay + 0.05 * (g() - 0.5)) * h);
          ctx.stroke();
        }
      };
      if (kind === 'heavy') {
        path([[0.38, 0.12], [0.44, 0.04], [0.56, 0.02], [0.66, 0.06], [0.7, 0.16]], 4);
        path([[0.38, 0.12], [0.33, 0.06], [0.28, 0.0]], 4);
        path([[0.7, 0.16], [0.76, 0.08], [0.8, 0.0]], 4);
        path([[0.38, 0.12], [0.36, 0.32], [0.38, 0.52], [0.46, 0.66], [0.56, 0.68], [0.65, 0.62], [0.7, 0.45], [0.7, 0.16]], 4);
        path([[0.42, 0.28], [0.5, 0.31], [0.55, 0.3], [0.64, 0.27]], 5);
        path([[0.45, 0.33], [0.49, 0.36], [0.53, 0.34]], 3);
        path([[0.58, 0.33], [0.61, 0.36], [0.65, 0.33]], 3);
        path([[0.53, 0.36], [0.52, 0.45], [0.56, 0.47]], 3);
        path([[0.46, 0.53], [0.52, 0.56], [0.58, 0.56], [0.64, 0.52]], 3);
        for (let i = 0; i < 9; i++) path([[0.47 + i * 0.019, 0.53], [0.47 + i * 0.019, 0.57]], 2);
        scribble(0.4, 0.06, 0.68, 0.2, 60);
        path([[0.3, 0.7], [0.4, 0.66], [0.46, 0.75], [0.6, 0.76], [0.7, 0.66], [0.82, 0.72]], 4);
        path([[0.3, 0.7], [0.22, 0.9], [0.2, 1.0]], 4);
        path([[0.82, 0.72], [0.9, 0.9], [0.92, 1.0]], 4);
      } else if (kind === 'scout') {
        path([[0.4, 0.22], [0.45, 0.12], [0.58, 0.08], [0.7, 0.12], [0.74, 0.2]], 4);
        path([[0.36, 0.25], [0.5, 0.2], [0.76, 0.22], [0.82, 0.27]], 4);
        path([[0.42, 0.25], [0.41, 0.42], [0.44, 0.55], [0.52, 0.64], [0.6, 0.65], [0.68, 0.58], [0.72, 0.42], [0.74, 0.25]], 4);
        path([[0.47, 0.34], [0.52, 0.32], [0.56, 0.35]], 3);
        path([[0.62, 0.35], [0.66, 0.32], [0.7, 0.34]], 3);
        path([[0.5, 0.38], [0.53, 0.37], [0.55, 0.39]], 3);
        path([[0.63, 0.39], [0.66, 0.37], [0.68, 0.39]], 3);
        path([[0.6, 0.38], [0.58, 0.48], [0.62, 0.5]], 3);
        path([[0.5, 0.55], [0.56, 0.58], [0.64, 0.57], [0.68, 0.53]], 3);
        path([[0.5, 0.55], [0.58, 0.54], [0.68, 0.53]], 2);
        path([[0.4, 0.3], [0.36, 0.3], [0.35, 0.42], [0.4, 0.44]], 4);
        path([[0.36, 0.42], [0.38, 0.6], [0.44, 0.62]], 3);
        path([[0.4, 0.68], [0.32, 0.78], [0.26, 1.0]], 4);
        path([[0.66, 0.66], [0.78, 0.74], [0.86, 1.0]], 4);
        path([[0.5, 0.72], [0.56, 0.86], [0.6, 0.74]], 2);
      } else if (kind === 'sniper') {
        path([[0.3, 0.6], [0.32, 0.3], [0.42, 0.1], [0.56, 0.04], [0.7, 0.1], [0.8, 0.3], [0.82, 0.6]], 4);
        path([[0.3, 0.6], [0.26, 0.82], [0.2, 1.0]], 4);
        path([[0.82, 0.6], [0.88, 0.82], [0.94, 1.0]], 4);
        path([[0.44, 0.3], [0.4, 0.5], [0.46, 0.72], [0.56, 0.78], [0.66, 0.72], [0.72, 0.5], [0.68, 0.3]], 3);
        path([[0.45, 0.36], [0.55, 0.34], [0.55, 0.42], [0.45, 0.43], [0.45, 0.36]], 4);
        path([[0.58, 0.34], [0.68, 0.36], [0.67, 0.43], [0.58, 0.42], [0.58, 0.34]], 4);
        for (let i = 0; i < 8; i++) path([[0.47 + i * 0.026, 0.58 + (i % 2) * 0.03], [0.48 + i * 0.026, 0.66 - (i % 2) * 0.03]], 3);
        path([[0.46, 0.58], [0.56, 0.56], [0.68, 0.58]], 3);
        path([[0.46, 0.66], [0.56, 0.68], [0.68, 0.66]], 3);
        scribble(0.33, 0.08, 0.8, 0.3, 30);
      }
      const label = { heavy: 'HEAVY', scout: 'SCOUT', sniper: 'SNIPER' }[kind] || kind.toUpperCase();
      const pos = { heavy: [0.2, 0.6, -0.16], scout: [0.14, 0.24, -0.2], sniper: [0.76, 0.84, -0.12] }[kind] || [0.5, 0.85, 0];
      ctx.save();
      ctx.translate(pos[0] * w, pos[1] * h);
      ctx.rotate(pos[2]);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const s = Math.round(h * 0.13);
      ctx.font = `900 ${s}px ${FONT}`;
      outlined(ctx, label, 0, 0, '#f2b75e', '#8a5a2a', s * 0.12);
      ctx.restore();
    };
  }

  function hudTimer(text, team) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const r = h * 0.2;
      const box = (x, y, bw, bh, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + bw, y, x + bw, y + bh, r);
        ctx.arcTo(x + bw, y + bh, x, y + bh, r);
        ctx.arcTo(x, y + bh, x, y, r);
        ctx.arcTo(x, y, x + bw, y, r);
        ctx.fill();
      };
      box(0, 0, w, h, 'rgba(250,240,220,0.9)');
      box(w * 0.025, h * 0.08, w * 0.95, h * 0.84, team === 'blu' ? '#5a7a98' : '#b0362c');
      ctx.fillStyle = '#f6f0e6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const s = fit(ctx, text, w * 0.58, Math.round(h * 0.66), 700);
      ctx.font = `700 ${s}px ${FONT}`;
      ctx.fillText(text, w * 0.38, h * 0.54);
      const cx = w * 0.82, cy = h * 0.52, rr = h * 0.3;
      ctx.fillStyle = '#f4d43a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rr, -PI * 0.15, PI * 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6a4a10';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#f4d43a';
        ctx.fillRect(w * 0.66 + i * w * 0.045, h * 0.08, w * 0.012, h * 0.08);
      }
    };
  }

  function bubble(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fbfbf6';
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = w * 0.03;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.42, w * 0.44, h * 0.34, 0, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.7);
      ctx.lineTo(w * 0.3, h * 0.96);
      ctx.lineTo(w * 0.52, h * 0.74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fbfbf6';
      ctx.fillRect(w * 0.34, h * 0.64, w * 0.2, h * 0.08);
      if (kind === 'medic') {
        ctx.fillStyle = '#d2232a';
        ctx.fillRect(w * 0.42, h * 0.18, w * 0.16, h * 0.48);
        ctx.fillRect(w * 0.3, h * 0.34, w * 0.4, h * 0.16);
      } else if (kind === 'alert') {
        ctx.fillStyle = '#d2232a';
        ctx.font = `900 ${Math.round(h * 0.5)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', w / 2, h * 0.44);
      }
    };
  }

  function chatLine(text) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(h * 0.62)}px Verdana, Arial, sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(text, w / 2 + 1, h / 2 + 1);
      ctx.fillStyle = '#f2f0e8';
      ctx.fillText(text, w / 2, h / 2);
    };
  }

  function checker(a, b, n) {
    return (ctx, w, h) => {
      const c = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? a : b;
        ctx.fillRect(x * c, y * c, c + 1, c + 1);
      }
    };
  }

  function hills(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const px = w / 128;
    const hill = (cx, top, rad, eyes) => {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.moveTo((cx - rad - 1) * px, h);
      ctx.lineTo((cx - rad - 1) * px, (top + rad) * px);
      ctx.arc(cx * px, (top + rad) * px, (rad + 1) * px, PI, 0);
      ctx.lineTo((cx + rad + 1) * px, h);
      ctx.fill();
      ctx.fillStyle = '#48b82c';
      ctx.beginPath();
      ctx.moveTo((cx - rad) * px, h);
      ctx.lineTo((cx - rad) * px, (top + rad) * px);
      ctx.arc(cx * px, (top + rad) * px, rad * px, PI, 0);
      ctx.lineTo((cx + rad) * px, h);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#7ed44a';
      for (let y = 0; y < 64; y += 2) for (let x = 0; x < 128; x += 2) if (((x + y) / 2) % 2 === 0) ctx.fillRect(x * px, y * px, px * 1.6, px * 1.6);
      ctx.restore();
      if (eyes) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect((cx - rad * 0.35) * px, (top + rad * 0.55) * px, px * 1.6, px * 4);
        ctx.fillRect((cx + rad * 0.2) * px, (top + rad * 0.55) * px, px * 1.6, px * 4);
      }
    };
    hill(18, 14, 15, true);
    hill(46, 26, 11, true);
    hill(72, 8, 18, true);
    hill(104, 22, 13, true);
    hill(124, 30, 9, false);
  }

  function rainbow(ctx, w, h) {
    const cols = ['#d8262a', '#f06a1a', '#f6c81a', '#3cb832', '#2a8ad8', '#6a3ab8', '#d83a9a'];
    const n = 8;
    const c = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = '#121212';
      ctx.fillRect(x * c, y * c, c, c);
      ctx.fillStyle = cols[(y + Math.floor(x / 2)) % cols.length];
      ctx.fillRect(x * c + c * 0.08, y * c + c * 0.08, c * 0.84, c * 0.84);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x * c + c * 0.08, y * c + c * 0.08, c * 0.84, c * 0.18);
    }
  }

  function stripes(ctx, w, h) {
    const cols = ['#d8262a', '#f06a1a', '#f6c81a', '#3cb832', '#2a8ad8', '#6a3ab8'];
    const rows = 24;
    const rh = h / rows;
    for (let y = 0; y < rows; y++) {
      ctx.fillStyle = cols[Math.floor(y / 4) % cols.length];
      ctx.fillRect(0, y * rh, w, rh);
      for (let x = 0; x < w; x += rh * 1.6) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y * rh, 1.5, rh);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 2, y * rh + 1, rh * 1.2, rh * 0.3);
      }
    }
  }

  function qblock(ctx, w, h) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2b81e';
    ctx.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
    ctx.fillStyle = '#c87a10';
    [[0.12, 0.12], [0.82, 0.12], [0.12, 0.82], [0.82, 0.82]].forEach(([x, y]) => ctx.fillRect(x * w, y * h, w * 0.06, h * 0.06));
    const px = w / 16;
    const q = ['..XXXX..', '.XX..XX.', '.XX..XX.', '....XX..', '...XX...', '...XX...', '........', '...XX...'];
    q.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === 'X') {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect((x + 4) * px + px * 0.3, (y + 4) * px + px * 0.3, px, px);
        ctx.fillStyle = '#fbe9b0';
        ctx.fillRect((x + 4) * px, (y + 4) * px, px, px);
      }
    }));
  }

  function studs(base, hi, lo) {
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const n = 8, c = w / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const x0 = x * c, y0 = y * c;
        ctx.fillStyle = hi;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + c, y0);
        ctx.lineTo(x0 + c / 2, y0 + c / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = lo;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + c);
        ctx.lineTo(x0 + c, y0 + c);
        ctx.lineTo(x0 + c / 2, y0 + c / 2);
        ctx.closePath();
        ctx.fill();
      }
    };
  }

  function sign(text, opts) {
    const o = opts || {};
    return (ctx, w, h) => {
      ctx.fillStyle = o.bg || '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      if (o.checker) {
        const c = h * 0.12;
        for (let y = 0; y < 2; y++) for (let x = 0; x < w / c; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#f4f4f4' : '#111';
          ctx.fillRect(x * c, y * c, c, c);
          ctx.fillRect(x * c, h - (y + 1) * c, c, c);
        }
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const size = fit(ctx, text, w * 0.9, Math.round(h * (o.size || 0.55)), o.weight || 900);
      ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 900} ${size}px ${o.font || FONT}`;
      if (o.stroke) outlined(ctx, text, w / 2, h / 2, o.fg || '#fff', o.stroke, size * 0.12);
      else {
        ctx.fillStyle = o.fg || '#fff';
        ctx.fillText(text, w / 2, h / 2);
      }
    };
  }

  function resupply(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const r = h * 0.3;
    ctx.fillStyle = '#1e5a86';
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.fill();
    ctx.fillStyle = '#4aa6dc';
    ctx.beginPath();
    ctx.moveTo(r + 6, 6);
    ctx.arcTo(w - 6, 6, w - 6, h - 6, r - 4);
    ctx.arcTo(w - 6, h - 6, 6, h - 6, r - 4);
    ctx.arcTo(6, h - 6, 6, 6, r - 4);
    ctx.arcTo(6, 6, w - 6, 6, r - 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fit(ctx, 'RESUPPLY', w * 0.84, Math.round(h * 0.6));
    ctx.font = `900 ${s}px ${FONT}`;
    ctx.fillText('RESUPPLY', w / 2, h * 0.54);
  }

  function xedSign(ctx, w, h) {
    ctx.fillStyle = '#7a2a1e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8c890';
    ctx.lineWidth = h * 0.05;
    ctx.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
    ctx.fillStyle = '#f2dcae';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic 700 ${Math.round(h * 0.62)}px Georgia, serif`;
    ctx.fillText('RED', w / 2, h * 0.55);
  }

  function garage(ctx, w, h) {
    ctx.fillStyle = '#5a6470';
    ctx.fillRect(0, 0, w, h);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const y = (i / n) * h;
      const g = ctx.createLinearGradient(0, y, 0, y + h / n);
      g.addColorStop(0, '#7a8692');
      g.addColorStop(0.7, '#56606c');
      g.addColorStop(1, '#3a424c');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, w, h / n);
    }
  }

  function pointSign(letter) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#e8e2d2';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.48, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8352a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.42, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2ecdc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(h * 0.56)}px ${FONT}`;
      ctx.fillText(letter, w / 2, h * 0.54);
    };
  }

  function planks(ctx, w, h) {
    const g = rand(21);
    for (let i = 0; i < 8; i++) {
      const v = 0.75 + g() * 0.3;
      ctx.fillStyle = `rgb(${Math.round(122 * v)},${Math.round(92 * v)},${Math.round(62 * v)})`;
      ctx.fillRect(i * w / 8, 0, w / 8, h);
      ctx.fillStyle = 'rgba(30,20,10,0.6)';
      ctx.fillRect(i * w / 8, 0, 2, h);
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = 'rgba(40,26,14,0.25)';
        ctx.fillRect(i * w / 8 + g() * w / 8, g() * h, 1, h * 0.2);
      }
    }
  }

  function gravel(ctx, w, h) {
    const g = rand(33);
    ctx.fillStyle = '#8c7c60';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 0.6 + g() * 0.6;
      ctx.fillStyle = `rgba(${Math.round(150 * v)},${Math.round(132 * v)},${Math.round(100 * v)},0.8)`;
      ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1 + g() * 2);
    }
  }

  function heartMask(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    const cx = w / 2, cy = h * 0.47, s = w * 0.2;
    ctx.moveTo(cx, cy + s * 1.1);
    ctx.bezierCurveTo(cx - s * 1.6, cy + s * 0.1, cx - s * 1.2, cy - s * 1.2, cx, cy - s * 0.45);
    ctx.bezierCurveTo(cx + s * 1.2, cy - s * 1.2, cx + s * 1.6, cy + s * 0.1, cx, cy + s * 1.1);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function inkWipe(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(77);
    ctx.fillStyle = '#0c0c08';
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.ellipse(x, y, w * (0.04 + g() * 0.12), h * (0.03 + g() * 0.1), g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function ration(ctx, w, h) {
    ctx.fillStyle = '#ecebe4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.17)}px "Courier New", monospace`;
    ctx.fillText('RATION, TYPE K', w / 2, h * 0.24);
    ctx.fillText('DINNER UNIT', w / 2, h * 0.44);
    ctx.font = `700 ${Math.round(h * 0.055)}px "Courier New", monospace`;
    ['OPEN INNER BAG CAREFULLY. IT MAY BE USED AS A WATERPROOF', 'CONTAINER FOR MATCHES, CIGARETTES, ETC.', 'FOR SECURITY, DO NOT DISCARD THE EMPTY CAN, PAPER, OR REFUSE', 'WHERE IT CAN BE SEEN FROM THE AIR. COVER WITH DIRT.'].forEach((l, i) => ctx.fillText(l, w / 2, h * (0.64 + i * 0.09)));
  }

  function scan(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(13);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(${Math.round(120 + g() * 120)},${Math.round(60 + g() * 60)},${Math.round(60 + g() * 60)},${0.25 + g() * 0.5})`;
      ctx.fillRect(0, y, w, 1);
    }
  }

  function streaks(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(17);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 140; i++) {
      const a = g() * PI * 2, r0 = 0.08 + g() * 0.3, r1 = r0 + 0.2 + g() * 0.6;
      const gr = ctx.createLinearGradient(w / 2 + Math.cos(a) * w * r0, h / 2 + Math.sin(a) * h * r0, w / 2 + Math.cos(a) * w * r1, h / 2 + Math.sin(a) * h * r1);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(1, `rgba(255,255,255,${0.2 + g() * 0.5})`);
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1 + g() * 6;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * w * r0, h / 2 + Math.sin(a) * h * r0);
      ctx.lineTo(w / 2 + Math.cos(a) * w * r1, h / 2 + Math.sin(a) * h * r1);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function scope(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.46, 0, PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.47);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.47, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - h * 0.46, h / 2);
    ctx.lineTo(w / 2 + h * 0.46, h / 2);
    ctx.moveTo(w / 2, h * 0.04);
    ctx.lineTo(w / 2, h * 0.96);
    ctx.stroke();
  }

  function redFrame(ctx, w, h) {
    ctx.fillStyle = '#c8281e';
    ctx.fillRect(0, 0, w, h);
    ctx.clearRect(w * 0.22, h * 0.24, w * 0.56, h * 0.52);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 0, w, h * 0.05);
  }

  function subtitle(text) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const s = fit(ctx, text, w * 0.96, Math.round(h * 0.62), 700);
      ctx.font = `700 ${s}px Arial, sans-serif`;
      outlined(ctx, text, w / 2, h / 2, '#f04a1a', 'rgba(60,10,0,0.9)', s * 0.12);
    };
  }

  function raceHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'middle';
    ctx.font = `italic 900 ${Math.round(h * 0.075)}px ${FONT}`;
    outlined(ctx, 'LAP 1/3', w * 0.04, h * 0.06, '#f2f2f2', '#202020', 4);
    ctx.textAlign = 'right';
    outlined(ctx, 'TIME 00\'00\'\'03', w * 0.97, h * 0.06, '#f2f2f2', '#202020', 4);
    ctx.textAlign = 'left';
    [0, 1].forEach(i => {
      ctx.fillStyle = '#1a3a8a';
      ctx.fillRect(w * 0.03, h * (0.12 + i * 0.09), w * 0.06, h * 0.08);
      ctx.fillStyle = '#e8b890';
      ctx.fillRect(w * 0.045, h * (0.13 + i * 0.09), w * 0.03, h * 0.06);
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.round(h * 0.05)}px ${FONT}`;
      ctx.fillText(String(i + 1), w * 0.032, h * (0.14 + i * 0.09));
    });
    ctx.fillStyle = '#c8a070';
    ctx.fillRect(w * 0.46, h * 0.03, w * 0.06, h * 0.08);
    ctx.font = `italic 900 ${Math.round(h * 0.12)}px ${FONT}`;
    outlined(ctx, '69th', w * 0.05, h * 0.88, '#f2d21a', '#6a4a0a', 5);
  }

  function banana(ctx, w, h) {
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(w * 0.04, h * 0.05, w * 0.92, h * 0.9);
    ctx.save();
    ctx.translate(w / 2, h * 0.5);
    ctx.fillStyle = '#f4e030';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.08, h * 0.3, 0.15, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(-w * 0.012, -h * 0.36, w * 0.024, h * 0.08);
    ctx.fillStyle = '#000';
    [-1, 1].forEach(s => ctx.fillRect(s * w * 0.025 - 3, -h * 0.1, 6, 8));
    ctx.beginPath();
    ctx.arc(0, -h * 0.02, w * 0.03, 0, PI);
    ctx.fill();
    ctx.strokeStyle = '#f4e030';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.07, 0);
    ctx.lineTo(-w * 0.16, -h * 0.18);
    ctx.moveTo(w * 0.07, 0);
    ctx.lineTo(w * 0.16, -h * 0.2);
    ctx.moveTo(-w * 0.04, h * 0.28);
    ctx.lineTo(-w * 0.08, h * 0.42);
    ctx.moveTo(w * 0.04, h * 0.28);
    ctx.lineTo(w * 0.1, h * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function coins(ctx, w, h) {
    ctx.fillStyle = '#7a6a10';
    ctx.fillRect(0, 0, w, h);
    const r = w / 8;
    for (let row = -1; row < 6; row++) {
      for (let col = -1; col < 6; col++) {
        const cx = col * r * 1.75 + (row % 2 ? r * 0.875 : 0) + r * 0.6, cy = row * r * 1.5 + r * 0.6;
        ctx.fillStyle = '#5a4a08';
        ctx.beginPath();
        for (let k = 0; k < 6; k++) ctx.lineTo(cx + Math.cos(k * PI / 3 + PI / 6) * r * 0.98, cy + Math.sin(k * PI / 3 + PI / 6) * r * 0.98);
        ctx.fill();
        ctx.fillStyle = '#c8a81a';
        ctx.beginPath();
        for (let k = 0; k < 6; k++) ctx.lineTo(cx + Math.cos(k * PI / 3 + PI / 6) * r * 0.86, cy + Math.sin(k * PI / 3 + PI / 6) * r * 0.86);
        ctx.fill();
        ctx.fillStyle = '#3a2e06';
        [-1, 1].forEach(s => ctx.fillRect(cx + s * r * 0.25 - r * 0.06, cy - r * 0.3, r * 0.12, r * 0.22));
        ctx.strokeStyle = '#3a2e06';
        ctx.lineWidth = r * 0.08;
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.05, r * 0.38, 0.2, PI - 0.2);
        ctx.stroke();
      }
    }
  }

  function shutterWood(ctx, w, h) {
    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * h;
      const g = ctx.createLinearGradient(0, y, 0, y + h / 10);
      g.addColorStop(0, '#8a6a4a');
      g.addColorStop(0.7, '#6a4e34');
      g.addColorStop(1, '#3a2a1c');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, w, h / 10);
    }
  }

  function comic(ctx, w, h) {
    ctx.fillStyle = '#f2f2ee';
    ctx.fillRect(0, 0, w, h);
    const g = rand(61);
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 3;
    [[0.03, 0.04, 0.45, 0.44], [0.52, 0.04, 0.45, 0.44], [0.03, 0.52, 0.3, 0.44], [0.36, 0.52, 0.61, 0.44]].forEach(([x, y, pw, ph]) => {
      ctx.strokeRect(x * w, y * h, pw * w, ph * h);
      for (let i = 0; i < 14; i++) {
        ctx.lineWidth = 1 + g() * 3;
        ctx.beginPath();
        const ax = (x + g() * pw) * w, ay = (y + g() * ph) * h;
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((x + g() * pw) * w, (y + g() * ph) * h, (x + g() * pw) * w, (y + g() * ph) * h);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse((x + pw * 0.3) * w, (y + ph * 0.25) * h, pw * w * 0.2, ph * h * 0.14, 0, 0, PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function spyCheck(ctx, w, h) {
    ctx.fillStyle = '#f4f0e2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a4a8a';
    ctx.fillRect(0, 0, w, h * 0.16);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.12)}px ${FONT}`;
    ctx.fillText('Spies?', w / 2, h * 0.085);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `700 ${Math.round(h * 0.08)}px Georgia, serif`;
    ctx.fillText('Sappin’ my sentries?', w * 0.62, h * 0.3);
    ctx.font = `italic 700 ${Math.round(h * 0.065)}px Georgia, serif`;
    ctx.fillText('it’s more likely than you think.', w * 0.62, h * 0.45);
    ctx.fillStyle = '#c8281e';
    ctx.fillRect(w * 0.36, h * 0.6, w * 0.56, h * 0.18);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.round(h * 0.09)}px ${FONT}`;
    ctx.fillText('FREE SPY CHECK!', w * 0.64, h * 0.69);
    ctx.fillStyle = '#3a4a6a';
    ctx.beginPath();
    ctx.ellipse(w * 0.17, h * 0.5, w * 0.11, h * 0.24, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2d8c0';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(w * (0.17 + s * 0.04), h * 0.44, w * 0.025, h * 0.04, 0, 0, PI * 2); ctx.fill(); });
  }

  function cinema(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0e1a3a');
    g.addColorStop(0.6, '#2a3a6a');
    g.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8b090';
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 0.3, w * 0.07, h * 0.15, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#24282e';
    ctx.beginPath();
    ctx.moveTo(w * 0.26, h);
    ctx.lineTo(w * 0.28, h * 0.48);
    ctx.lineTo(w * 0.48, h * 0.48);
    ctx.lineTo(w * 0.52, h);
    ctx.fill();
    ctx.fillStyle = '#3a3e44';
    ctx.fillRect(w * 0.5, h * 0.42, w * 0.1, h * 0.05);
    ctx.fillStyle = '#e8eef8';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(h * 0.06)}px Arial, sans-serif`;
    ctx.fillText('COMING SOON', w * 0.05, h * 0.8);
    ctx.fillText('TO THEATRES', w * 0.05, h * 0.88);
    ctx.textAlign = 'right';
    ctx.font = `italic 900 ${Math.round(h * 0.09)}px ${FONT}`;
    outlined(ctx, 'AGENT ZERO', w * 0.96, h * 0.82, '#f2f6ff', '#2a6ad8', 4);
    ctx.font = `700 ${Math.round(h * 0.045)}px Arial, sans-serif`;
    ctx.fillStyle = '#9ab8e8';
    ctx.fillText('THE MIND MAZE', w * 0.96, h * 0.91);
  }

  function polaroid(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a8c8e8';
    ctx.fillRect(w * 0.08, h * 0.07, w * 0.84, h * 0.66);
    ctx.fillStyle = '#c8a070';
    ctx.fillRect(w * 0.08, h * 0.55, w * 0.84, h * 0.18);
    ctx.fillStyle = '#9a6a3a';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.48, w * 0.16, h * 0.2, 0, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.25, w * 0.09, h * 0.09, 0, 0, PI * 2);
    ctx.fill();
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(w * (0.5 + s * 0.06), h * 0.15, w * 0.025, h * 0.07, s * 0.3, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.14);
    ctx.quadraticCurveTo(w * 0.5, h * 0.05, w * 0.6, h * 0.14);
    ctx.lineTo(w * 0.72, h * 0.6);
    ctx.lineTo(w * 0.28, h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    [-1, 1].forEach(s => ctx.fillRect(w * (0.5 + s * 0.035) - 2, h * 0.24, 4, 4));
    ctx.font = `italic 700 ${Math.round(h * 0.07)}px "Comic Sans MS", cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('with love', w / 2, h * 0.85);
  }

  function killcam(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(30,24,20,0.82)';
    ctx.fillRect(0, h * 0.3, w, h * 0.7);
    ctx.fillStyle = '#b8352a';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#f2e8d0';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(h * 0.17)}px Verdana, sans-serif`;
    ctx.fillText('You’ve been killed again by', w * 0.2, h * 0.47);
    ctx.font = `700 ${Math.round(h * 0.2)}px Verdana, sans-serif`;
    ctx.fillText('sneakyfella1999', w * 0.2, h * 0.8);
    ctx.fillStyle = '#f2e8d0';
    ctx.fillRect(w * 0.04, h * 0.42, w * 0.11, h * 0.46);
    ctx.fillStyle = '#b8352a';
    ctx.fillRect(w * 0.085, h * 0.47, w * 0.02, h * 0.36);
    ctx.fillRect(w * 0.06, h * 0.62, w * 0.07, h * 0.06);
    ctx.textAlign = 'right';
    ctx.font = `900 ${Math.round(h * 0.22)}px ${FONT}`;
    outlined(ctx, 'NEMESIS', w * 0.97, h * 0.16, '#f2e8d0', '#4a2a1a', 3);
  }

  function decoy(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#c8a86a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = w * 0.03;
    ctx.fillStyle = '#e8b890';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.28, w * 0.2, h * 0.12, 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(w * 0.18, h * 0.16, w * 0.64, h * 0.04);
    ctx.fillStyle = '#e88a1a';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + s * 0.15), h * 0.15);
      ctx.lineTo(w * (0.5 + s * 0.3), h * 0.02);
      ctx.lineTo(w * (0.5 + s * 0.22), h * 0.16);
      ctx.fill();
    });
    ctx.fillRect(w * 0.36, h * 0.25, w * 0.28, h * 0.04);
    ctx.fillStyle = '#a8442a';
    ctx.fillRect(w * 0.28, h * 0.42, w * 0.44, h * 0.32);
    ctx.strokeRect(w * 0.28, h * 0.42, w * 0.44, h * 0.32);
    ctx.fillStyle = '#5a4a32';
    ctx.fillRect(w * 0.3, h * 0.74, w * 0.16, h * 0.24);
    ctx.fillRect(w * 0.54, h * 0.74, w * 0.16, h * 0.24);
  }

  function pinWas(ctx, w, h) {
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d02a1e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.14)}px ${FONT}`;
    ctx.fillText('FOREMAN BOB', w / 2, h * 0.12);
    ctx.fillText('WAS HERE', w / 2, h * 0.9);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.62);
    ctx.lineTo(w * 0.85, h * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#e8c8a8';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.62, w * 0.18, PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    [-1, 1].forEach(s => ctx.fillRect(w / 2 + s * w * 0.07 - 3, h * 0.5, 6, 6));
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.53);
    ctx.lineTo(w / 2, h * 0.7);
    ctx.stroke();
    [-1, 1].forEach(s => { ctx.fillStyle = '#e8c8a8'; ctx.fillRect(w / 2 + s * w * 0.3 - 8, h * 0.62, 16, h * 0.08); ctx.strokeRect(w / 2 + s * w * 0.3 - 8, h * 0.62, 16, h * 0.08); });
  }

  function pinCrab(ctx, w, h) {
    ctx.fillStyle = '#d8e8f4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a2a4a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.1)}px Georgia, serif`;
    ctx.fillText('Save the', w / 2, h * 0.1);
    ctx.fillText('Endangered', w / 2, h * 0.2);
    ctx.fillText('Spy Crab!', w / 2, h * 0.3);
    ctx.fillStyle = '#2a3a6a';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.58, w * 0.2, h * 0.11, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a3a6a';
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(w / 2 + s * w * 0.15, h * (0.6 + i * 0.03)); ctx.lineTo(w / 2 + s * w * 0.32, h * (0.72 + i * 0.04)); ctx.stroke(); });
    ctx.fillStyle = '#f2d8c0';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(w / 2 + s * w * 0.06, h * 0.55, w * 0.03, h * 0.025, 0, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#1a2a4a';
    ctx.font = `italic 700 ${Math.round(h * 0.065)}px Georgia, serif`;
    ctx.fillText('Think twice', w / 2, h * 0.86);
    ctx.fillText('before you wrench!', w / 2, h * 0.94);
  }

  function pinSheep(ctx, w, h) {
    ctx.fillStyle = '#f4f2f8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8e4f0';
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.62, w * 0.38, h * 0.24, 0, 0, PI * 2);
    ctx.fill();
    const g = rand(8);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#8a8a9a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.35 + g() * 0.5), h * (0.45 + g() * 0.3), w * 0.08, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#c8c8d8';
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 0.42, w * 0.17, h * 0.15, -0.2, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2d84a';
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.28, w * 0.14, h * 0.06, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1a1a1a';
    [[0.24, 0.4], [0.36, 0.42]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(w * x, h * y, w * 0.05, 0, PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(w * 0.26, h * 0.42, w * 0.018, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.34, h * 0.39, w * 0.018, 0, PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.5, w * 0.03, 0.1, PI - 0.1);
    ctx.stroke();
  }

  function curse(ctx, w, h) {
    bubble('none')(ctx, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.28)}px Arial, sans-serif`;
    ctx.fillText('!@#$', w / 2, h * 0.42);
  }

  function vanSide(ctx, w, h) {
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3ad84a';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * (0.08 + i * 0.22), h * 0.12, w * 0.16, h * 0.28);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.2)}px "Courier New", monospace`;
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText('PARTY VAN 98', w / 2, h * 0.68);
  }

  function intermission(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fit(ctx, 'INTERMISSION', w * 0.5, Math.round(h * 0.12));
    ctx.font = `900 ${s}px ${FONT}`;
    outlined(ctx, 'INTERMISSION', w * 0.7, h * 0.86, '#f3a43a', '#7a3a12', s * 0.12);
  }

  function warpHaze(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, w * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.3, 'rgba(255,140,220,0.8)');
    g.addColorStop(0.7, 'rgba(240,110,60,0.75)');
    g.addColorStop(1, 'rgba(255,80,40,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function ink(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(91);
    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.3, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 40; i++) {
      const a = g() * PI * 2, d = w * (0.25 + g() * 0.22), r = w * (0.01 + g() * 0.05);
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, r, 0, PI * 2);
      ctx.fill();
    }
  }

  function line(ctx, pts, lw, col) {
    ctx.strokeStyle = col || '#141414';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }

  function blob(ctx, x, y, rx, ry, fill, lw, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (lw) {
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  function toonEngi(ctx, x, y, s, o) {
    const opts = o || {};
    const skin = '#f0a85a';
    if (opts.body !== false) {
      ctx.fillStyle = '#6a8aa8';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.55, y + s * 1.5);
      ctx.lineTo(x - s * 0.45, y + s * 0.55);
      ctx.lineTo(x + s * 0.45, y + s * 0.55);
      ctx.lineTo(x + s * 0.55, y + s * 1.5);
      ctx.fill();
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = s * 0.05;
      ctx.stroke();
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x - s * 0.3, y + s * 0.6, s * 0.6, s * 0.9);
    }
    blob(ctx, x, y, s * 0.42, s * 0.5, skin, s * 0.05);
    blob(ctx, x + s * 0.05, y + s * 0.42, s * 0.36, s * 0.22, skin, s * 0.05);
    if (opts.eyes === 'bulge') {
      [-1, 1].forEach(k => {
        blob(ctx, x + k * s * 0.2, y - s * 0.05, s * 0.2, s * 0.22, '#fff', s * 0.04);
        ctx.strokeStyle = '#d02a1e';
        ctx.lineWidth = s * 0.02;
        for (let i = 0; i < 4; i++) line(ctx, [[x + k * s * 0.2, y - s * 0.05], [x + k * s * (0.2 + Math.cos(i) * 0.18), y + s * (Math.sin(i * 2) * 0.18 - 0.05)]], s * 0.015, '#d02a1e');
        blob(ctx, x + k * s * 0.2, y - s * 0.02, s * 0.05, s * 0.05, '#141414');
      });
    } else if (opts.eyes === 'shine') {
      blob(ctx, x, y - s * 0.05, s * 0.48, s * 0.14, '#141414');
      [-1, 1].forEach(k => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const cx = x + k * s * 0.2, cy = y - s * 0.06, r = s * 0.12;
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.25, cy - r * 0.25);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx + r * 0.25, cy + r * 0.25);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r * 0.25, cy + r * 0.25);
        ctx.lineTo(cx - r, cy);
        ctx.lineTo(cx - r * 0.25, cy - r * 0.25);
        ctx.fill();
      });
    } else {
      blob(ctx, x, y - s * 0.05, s * 0.48, s * 0.12, '#141414');
    }
    if (opts.mouth === 'scream') blob(ctx, x + s * 0.05, y + s * 0.45, s * 0.22, s * 0.16, '#5a0a0a', s * 0.04);
    else if (opts.mouth === 'grin') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s * 0.05, y + s * 0.38, s * 0.25, 0.1, PI - 0.1);
      ctx.fill();
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = s * 0.04;
      ctx.stroke();
    } else line(ctx, [[x - s * 0.15, y + s * 0.45], [x + s * 0.25, y + s * 0.42]], s * 0.04);
  }

  function toonCritter(ctx, x, y, s, squash, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(1, squash || 1);
    blob(ctx, 0, 0, s * 0.6, s * 0.5, '#3ac8b0', s * 0.05);
    blob(ctx, s * 0.25, -s * 0.1, s * 0.12, s * 0.14, '#fff', s * 0.03);
    blob(ctx, s * 0.27, -s * 0.08, s * 0.04, s * 0.05, '#141414');
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.arc(s * 0.1, s * 0.15, s * 0.2, 0.2, PI - 0.2);
    ctx.stroke();
    const cols = ['#e83a3a', '#f2b81e', '#3ab83a', '#3a8ae8', '#a83ae8'];
    for (let i = 0; i < 5; i++) line(ctx, [[-s * 0.05 + Math.cos(i * 1.2) * s * 0.1 * i, -s * 0.45 - i * s * 0.08], [-s * 0.05 + Math.cos((i + 1) * 1.2) * s * 0.1 * (i + 1), -s * 0.45 - (i + 1) * s * 0.08]], s * 0.08, cols[i]);
    ctx.restore();
  }

  function cartoon(ctx, w, h, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#5ab8c8');
    sky.addColorStop(1, '#f2f0e0');
    const meadow = () => {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3ac84a';
      ctx.fillRect(0, h * 0.58, w, h * 0.42);
      line(ctx, [[0, h * 0.58], [w, h * 0.58]], 3);
      blob(ctx, w * 0.08, h * 0.27, w * 0.05, h * 0.06, '#3ab83a', 3);
      line(ctx, [[w * 0.08, h * 0.32], [w * 0.08, h * 0.58]], 5, '#5a3a1a');
      line(ctx, [[w * 0.16, h * 0.58], [w * 0.15, h * 0.36]], 4, '#5a3a1a');
      [-0.6, 0, 0.6].forEach(a => line(ctx, [[w * 0.15, h * 0.36], [w * (0.15 + Math.sin(a) * 0.06), h * (0.33 + Math.abs(a) * 0.05)]], 4, '#2a8a2a'));
    };
    const vign = () => {
      const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(40,20,0,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };
    if (t < 7.27) {
      meadow();
      const crawl = t < 1.2 ? 0 : Math.min(1, (t - 1.2) / 2.5);
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(w * (0.3 + crawl * 0.15), h * 0.62, w * 0.18, h * 0.07);
      ctx.fillStyle = '#f2a03a';
      ctx.fillRect(w * (0.48 + crawl * 0.15), h * 0.61, w * 0.06, h * 0.05);
      if (t > 3.0) {
        const up = Math.min(1, (t - 3.0) / 0.6);
        toonEngi(ctx, w * 0.6, h * (0.75 - up * 0.3), h * 0.22, { eyes: t > 5.5 ? 'bulge' : 'glasses', body: false, mouth: t > 5.5 ? 'scream' : 'line' });
      }
    } else if (t < 11.6) {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      const k = t - 7.27;
      const flat = k > 2.4 ? Math.max(0.35, 1 - (k - 2.4) * 2) : 1;
      toonCritter(ctx, w * 0.62, h * 0.65, h * 0.45, flat, 0);
      if (k > 1.0) {
        const hx = w * (0.1 + Math.min(1, (k - 1.0) / 0.6) * 0.32);
        blob(ctx, hx, h * 0.55, w * 0.07, h * 0.1, '#f0a85a', 3);
        if (k > 2.2) toonEngi(ctx, w * 0.32, h * 0.5, h * 0.22, { eyes: 'bulge', mouth: 'scream', body: false });
      }
    } else if (t < 12.31) {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      toonEngi(ctx, w * 0.35, h * 0.35, h * 0.2, { mouth: 'line' });
      toonCritter(ctx, w * 0.62, h * 0.55, h * 0.18, 1, 0.4);
      line(ctx, [[w * 0.45, h * 0.42], [w * 0.58, h * 0.48]], 6, '#f0a85a');
    } else if (t < 16.82) {
      const k = t - 12.31;
      if (k < 0.7) {
        ctx.fillStyle = '#e8a050';
        ctx.fillRect(0, 0, w, h);
        toonEngi(ctx, w / 2, h * 0.5, h * 0.7, { body: false, mouth: 'line' });
      } else if (k < 1.6) {
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        toonEngi(ctx, w * 0.4, h * 0.35, h * 0.24, { mouth: 'scream' });
        toonCritter(ctx, w * 0.68, h * 0.45, h * 0.14, 1, Math.sin(k * 20) * 0.4);
      } else if (k < 3.2) {
        ctx.fillStyle = k < 2.4 ? '#e83a2a' : '#a01a12';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#d8281e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0a0606';
        ctx.beginPath();
        ctx.ellipse(w * 0.42, h * 0.62, w * 0.2, h * 0.5, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.45, h * 0.22, w * 0.14, h * 0.2, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(w * 0.47, h * 0.3, w * 0.07, 0.1, PI - 0.1);
        ctx.fill();
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(w * (0.45 + s * 0.05), h * 0.17, w * 0.03, h * 0.03, 0, 0, PI * 2); ctx.fill(); });
        const flick = Math.sin(k * 30) * 0.02;
        ctx.fillStyle = '#0a0606';
        [[0.6, 0.45], [0.66, 0.5]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(w * (x + flick), h * y, w * 0.05, h * 0.12, 0.6, 0, PI * 2); ctx.fill(); });
      }
    } else if (t < 18.28) {
      ctx.fillStyle = '#f8f4e0';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.7, h * 0.4, 0, w * 0.7, h * 0.4, w * 0.5);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, 'rgba(90,200,200,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      toonEngi(ctx, w * 0.25, h * 0.4, h * 0.3, { eyes: 'shine', mouth: 'grin' });
    } else if (t < 19.82) {
      ctx.fillStyle = '#f2eee0';
      ctx.fillRect(0, 0, w, h);
      toonEngi(ctx, w * 0.12, h * 0.42, h * 0.3, { mouth: 'line' });
      ctx.fillStyle = '#c88a3a';
      ctx.fillRect(w * 0.56, h * 0.48, w * 0.3, h * 0.22);
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.56, h * 0.48, w * 0.3, h * 0.22);
      ctx.fillStyle = '#5a3a1a';
      ctx.font = `italic 700 ${Math.round(h * 0.06)}px "Comic Sans MS", cursive`;
      ctx.fillText('Fun Box', w * 0.62, h * 0.62);
    } else if (t < 22.69) {
      ctx.fillStyle = '#e8d8a8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b8862a';
      ctx.fillRect(0, h * 0.82, w, h * 0.18);
      const up = Math.min(1, (t - 19.82) / 1.4);
      toonEngi(ctx, w * 0.5, h * (1.1 - up * 0.45), h * 0.36, { mouth: up > 0.9 ? 'grin' : 'line', body: false });
      ctx.fillStyle = '#b8862a';
      ctx.fillRect(0, h * 0.82, w, h * 0.18);
      line(ctx, [[0, h * 0.82], [w, h * 0.82]], 3);
    } else {
      const k = t - 22.69;
      ctx.fillStyle = '#f2eee0';
      ctx.fillRect(0, 0, w, h);
      toonEngi(ctx, w * 0.22, h * 0.45, h * 0.28, { mouth: 'grin' });
      ctx.fillStyle = '#c88a3a';
      ctx.fillRect(w * 0.44, h * 0.6, w * 0.3, h * 0.2);
      if (k > 0.6) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (k - 0.6) * 1.5);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 9; i++) {
          const a = -PI * 0.9 + i * 0.22;
          ctx.beginPath();
          ctx.moveTo(w * 0.59, h * 0.6);
          ctx.lineTo(w * 0.59 + Math.cos(a - 0.06) * w, h * 0.6 + Math.sin(a - 0.06) * w);
          ctx.lineTo(w * 0.59 + Math.cos(a + 0.06) * w, h * 0.6 + Math.sin(a + 0.06) * w);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    vign();
  }

  function stripesWipe(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f4f4f4' : '#161616';
      ctx.fillRect(0, (i / 8) * h, w, h / 8 + 1);
    }
  }

  function chalkboard(ctx, w, h) {
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#26302a';
    ctx.fillRect(w * 0.04, h * 0.06, w * 0.92, h * 0.88);
    const g = rand(5);
    ctx.strokeStyle = 'rgba(230,230,220,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = h * (0.18 + i * 0.1);
      ctx.beginPath();
      let x = w * 0.1;
      ctx.moveTo(x, y);
      while (x < w * (0.6 + g() * 0.3)) {
        x += w * (0.01 + g() * 0.02);
        ctx.lineTo(x, y + (g() - 0.5) * h * 0.04);
      }
      ctx.stroke();
    }
  }

  function poster(kind) {
    return (ctx, w, h) => {
      const g = rand(kind.length * 31 + 7);
      const pal = {
        hero: ['#1a1a2a', '#e8d2a0', '#3a6ac8', '#d83a2a'],
        girls: ['#f2e6d6', '#5a8ae8', '#e85a8a', '#f2c84a'],
        racer: ['#2a2a2a', '#e8382a', '#f2f2f2', '#2a6ad8'],
        moon: ['#1a1030', '#e8b83a', '#6a3ab8', '#f2f2f2']
      }[kind] || ['#222', '#ddd', '#a33', '#3a8'];
      ctx.fillStyle = pal[0];
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = pal[1 + Math.floor(g() * 3)];
        ctx.globalAlpha = 0.5 + g() * 0.5;
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, (0.05 + g() * 0.2) * w, (0.05 + g() * 0.25) * h, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal[1];
      ctx.fillRect(0, h * 0.84, w, h * 0.16);
      ctx.fillStyle = pal[0];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const title = { hero: 'NEON RONIN', girls: 'STAR CLUB', racer: 'TURBO 98', moon: 'LAST NIGHT' }[kind] || 'POSTER';
      const s = fit(ctx, title, w * 0.9, Math.round(h * 0.1));
      ctx.font = `900 ${s}px ${FONT}`;
      ctx.fillText(title, w / 2, h * 0.92);
    };
  }

  function sepiaBg(ctx, w, h, glow) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.75, 0, w * 0.5, h * 0.6, w * 0.75);
    g.addColorStop(0, glow || '#f2d690');
    g.addColorStop(0.45, '#a8742c');
    g.addColorStop(1, '#2a1a08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function greenHill(ctx, x, y, r) {
    ctx.fillStyle = '#3aa82a';
    ctx.beginPath();
    ctx.arc(x, y, r, PI, 0);
    ctx.lineTo(x + r, y + r * 2);
    ctx.lineTo(x - r, y + r * 2);
    ctx.fill();
  }

  function coinRow(ctx, w, y, r, col) {
    for (let x = r; x < w; x += r * 2.3) {
      ctx.fillStyle = col || 'rgba(255,240,180,0.75)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,40,10,0.8)';
      ctx.fillRect(x - r * 0.35, y - r * 0.35, r * 0.15, r * 0.3);
      ctx.fillRect(x + r * 0.2, y - r * 0.35, r * 0.15, r * 0.3);
      ctx.beginPath();
      ctx.arc(x, y + r * 0.05, r * 0.45, 0.2, PI - 0.2);
      ctx.lineWidth = r * 0.12;
      ctx.strokeStyle = 'rgba(60,40,10,0.8)';
      ctx.stroke();
    }
  }

  function impHeadPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.95, cy - s * 0.15);
    ctx.lineTo(cx - s * 1.15, cy - s * 1.1);
    ctx.lineTo(cx - s * 0.45, cy - s * 0.65);
    ctx.quadraticCurveTo(cx, cy - s * 0.82, cx + s * 0.45, cy - s * 0.65);
    ctx.lineTo(cx + s * 1.15, cy - s * 1.1);
    ctx.lineTo(cx + s * 0.95, cy - s * 0.15);
    ctx.quadraticCurveTo(cx + s * 1.05, cy + s * 0.55, cx, cy + s * 0.78);
    ctx.quadraticCurveTo(cx - s * 1.05, cy + s * 0.55, cx - s * 0.95, cy - s * 0.15);
    ctx.closePath();
  }

  function impAntennae(ctx, cx, cy, s, col) {
    ctx.strokeStyle = col || '#141414';
    ctx.fillStyle = col || '#141414';
    ctx.lineWidth = s * 0.06;
    [-1, 1].forEach(k => {
      const tx = cx + k * s * 0.55, ty = cy - s * 1.3;
      ctx.beginPath();
      ctx.moveTo(cx + k * s * 0.2, cy - s * 0.72);
      ctx.quadraticCurveTo(cx + k * s * 0.3, cy - s * 1.15, tx, ty);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx + k * s * 0.16, ty - s * 0.1);
      ctx.lineTo(tx - k * s * 0.12, ty - s * 0.06);
      ctx.lineTo(tx + k * s * 0.02, ty + s * 0.14);
      ctx.closePath();
      ctx.fill();
    });
  }

  function impSilhouette(sip) {
    return (ctx, w, h) => {
      sepiaBg(ctx, w, h);
      greenHill(ctx, w * 0.92, h * 0.62, w * 0.14);
      const cx = w * 0.5, cy = h * 0.5, s = h * 0.36;
      ctx.fillStyle = '#060404';
      impHeadPath(ctx, cx, cy, s);
      ctx.fill();
      impAntennae(ctx, cx, cy, s, '#060404');
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const x = cx - s * 0.45 + i * s * 0.15;
        ctx.lineTo(x, cy - s * (i % 2 ? 0.95 : 0.6));
      }
      ctx.lineTo(cx + s * 0.45, cy - s * 0.5);
      ctx.lineTo(cx - s * 0.45, cy - s * 0.5);
      ctx.fill();
      ctx.fillRect(cx - s * 0.12, cy + s * 0.6, s * 0.24, h);
      ctx.fillStyle = '#fffbe8';
      ctx.shadowColor = 'rgba(255,255,220,0.9)';
      ctx.shadowBlur = s * 0.15;
      [-1, 1].forEach(k => {
        ctx.beginPath();
        ctx.moveTo(cx + k * s * 0.08, cy - s * 0.02);
        ctx.quadraticCurveTo(cx + k * s * 0.35, cy - s * 0.3, cx + k * s * 0.72, cy - s * 0.32);
        ctx.quadraticCurveTo(cx + k * s * 0.58, cy + s * 0.14, cx + k * s * 0.08, cy - s * 0.02);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      if (sip) {
        ctx.fillStyle = '#1a3ad8';
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.42, cy + s * 0.05);
        ctx.lineTo(cx + s * 0.42, cy + s * 0.05);
        ctx.lineTo(cx + s * 0.2, cy + s * 0.6);
        ctx.lineTo(cx + s * 0.06, cy + s * 0.62);
        ctx.lineTo(cx + s * 0.06, cy + s * 1.0);
        ctx.lineTo(cx + s * 0.25, cy + s * 1.08);
        ctx.lineTo(cx - s * 0.25, cy + s * 1.08);
        ctx.lineTo(cx - s * 0.06, cy + s * 1.0);
        ctx.lineTo(cx - s * 0.06, cy + s * 0.62);
        ctx.lineTo(cx - s * 0.2, cy + s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8ab0ff';
        ctx.lineWidth = s * 0.03;
        ctx.beginPath();
        ctx.arc(cx - s * 0.05, cy + s * 0.22, s * 0.09, 0.4, PI * 1.7);
        ctx.stroke();
      }
    };
  }

  function impShadowBig(ctx, w, h) {
    sepiaBg(ctx, w, h, '#f2e0a0');
    coinRow(ctx, w * 0.5, h * 0.88, h * 0.1);
    greenHill(ctx, w * 0.95, h * 0.55, w * 0.12);
    ctx.fillStyle = '#050303';
    impHeadPath(ctx, w * 0.56, h * 0.7, h * 0.6);
    ctx.fill();
    ctx.fillRect(w * 0.3, h * 0.95, w * 0.5, h);
  }

  function impFace(ctx, w, h) {
    sepiaBg(ctx, w, h, '#f8f0c0');
    coinRow(ctx, w * 0.4, h * 0.92, h * 0.11, 'rgba(255,255,240,0.9)');
    greenHill(ctx, w * 1.0, h * 0.4, w * 0.13);
    const cx = w * 0.55, cy = h * 0.58, s = h * 0.62;
    ctx.fillStyle = '#e8180e';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = s * 0.035;
    impHeadPath(ctx, cx, cy, s);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,0,0,0.55)';
    ctx.lineWidth = s * 0.02;
    [[-0.7, 0.1, -0.4, 0.35], [0.7, 0.1, 0.4, 0.35], [-0.5, -0.45, -0.3, -0.3], [0.5, -0.45, 0.3, -0.3]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(cx + a * s, cy + b * s);
      ctx.quadraticCurveTo(cx + (a + c) * 0.5 * s, cy + (b + d) * 0.4 * s, cx + c * s, cy + d * s);
      ctx.stroke();
    });
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#fbf8f0';
      ctx.strokeStyle = '#140808';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 0.3, cy - s * 0.2, s * 0.24, s * 0.2, k * -0.15, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#140808';
      ctx.beginPath();
      ctx.arc(cx + k * s * 0.3 - s * 0.08, cy - s * 0.3, s * 0.045, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8180e';
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 0.3, cy - s * 0.04, s * 0.27, s * 0.09, k * -0.15, PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 0.3, cy - s * 0.04, s * 0.27, s * 0.09, k * -0.15, PI, 0);
      ctx.stroke();
    });
    ctx.fillStyle = '#140808';
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.05, cy + s * 0.12, s * 0.18, s * 0.11, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.1, cy + s * 0.08, s * 0.06, s * 0.035, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.62, cy + s * 0.02);
    ctx.quadraticCurveTo(cx - s * 0.1, cy + s * 0.62, cx + s * 0.62, cy + s * 0.0);
    ctx.stroke();
  }

  function impBody(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5, s = h * 0.2;
    const cy = h * 0.3;
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = s * 0.05;
    ctx.fillStyle = '#e8261e';
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.5, h * 0.78);
    ctx.quadraticCurveTo(cx + s * 1.6, h * 0.86, cx + s * 1.5, h * 0.62);
    ctx.lineWidth = s * 0.12;
    ctx.strokeStyle = '#e8261e';
    ctx.stroke();
    ctx.fillStyle = '#e8261e';
    ctx.beginPath();
    ctx.moveTo(cx + s * 1.5, h * 0.55);
    ctx.lineTo(cx + s * 1.65, h * 0.65);
    ctx.lineTo(cx + s * 1.35, h * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#141414';
    ctx.fillRect(cx - s * 0.32, h * 0.8, s * 0.18, h * 0.2);
    ctx.fillRect(cx + s * 0.14, h * 0.8, s * 0.18, h * 0.2);
    ctx.fillStyle = '#f4f2ee';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, h * 0.52);
    ctx.lineTo(cx + s * 0.5, h * 0.52);
    ctx.lineTo(cx + s * 0.42, h * 0.84);
    ctx.lineTo(cx - s * 0.42, h * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#141414';
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.moveTo(cx + k * s * 0.5, h * 0.53);
      ctx.lineTo(cx + k * s * 0.85, h * 0.6);
      ctx.lineTo(cx + k * s * 0.75, h * 0.66);
      ctx.lineTo(cx + k * s * 0.45, h * 0.6);
      ctx.fill();
    });
    ctx.lineWidth = s * 0.08;
    ctx.strokeStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.8, h * 0.62);
    ctx.lineTo(cx - s * 0.45, h * 0.72);
    ctx.stroke();
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(cx - s * 0.55, h * 0.64, s * 0.36, s * 0.42);
    ctx.fillStyle = '#e8c84a';
    [0, 1, 2].forEach(i => ctx.fillRect(cx - s * 0.5 + i * s * 0.1, h * 0.6, s * 0.05, s * 0.22));
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.8, h * 0.62);
    ctx.lineTo(cx + s * 1.25, h * 0.4);
    ctx.stroke();
    ctx.fillStyle = '#e8261e';
    ctx.beginPath();
    ctx.arc(cx + s * 1.3, h * 0.37, s * 0.12, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8261e';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = s * 0.04;
    impHeadPath(ctx, cx, cy, s);
    ctx.fill();
    ctx.stroke();
    impAntennae(ctx, cx, cy, s);
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#f2e04a';
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 0.32, cy - s * 0.18, s * 0.2, s * 0.12, k * -0.2, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e8261e';
      ctx.fillRect(cx + k * s * 0.32 - s * 0.22, cy - s * 0.34, s * 0.44, s * 0.13);
      ctx.fillStyle = '#140808';
      ctx.beginPath();
      ctx.arc(cx + k * s * 0.3, cy - s * 0.14, s * 0.04, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#140808';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.12, s * 0.12, s * 0.08, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.62, cy + s * 0.25);
    ctx.quadraticCurveTo(cx, cy + s * 0.75, cx + s * 0.62, cy + s * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = s * 0.02;
    for (let i = 0; i < 9; i++) {
      const x = cx - s * 0.55 + i * s * 0.137;
      ctx.beginPath();
      ctx.moveTo(x, cy + s * 0.28);
      ctx.lineTo(x + s * 0.07, cy + s * 0.42);
      ctx.lineTo(x + s * 0.137, cy + s * 0.28);
      ctx.stroke();
    }
  }

  const CHECK = {
    top: 'Engie',
    bottom: 'Jeff',
    items: ['Spy', 'Heavy\n+ Scout BFF’s', 'Classes with Hats', 'Snoipeh', 'Agent Zero', 'Soldier', 'Alex', 'Mr. Rain', 'Blue Demon', 'Mondays', 'Spy', 'Another Spy', 'You', 'Ed, Ted & Fred', 'A new pencil', 'Everyone|Except|Protagonist']
  };

  function scrawl(ctx, size) {
    ctx.font = `${size}px "Segoe Print", "Comic Sans MS", cursive`;
  }

  function pencilHand(ctx, w, h, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.75);
    const L = w * 0.44, T = h * 0.13;
    ctx.lineJoin = 'round';
    ctx.lineWidth = w * 0.008;
    ctx.strokeStyle = '#141414';
    ctx.fillStyle = '#f6e690';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(T * 1.4, -T / 2);
    ctx.lineTo(L, -T / 2);
    ctx.lineTo(L, T / 2);
    ctx.lineTo(T * 1.4, T / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8c860';
    ctx.fillRect(T * 1.4, T * 0.1, L - T * 1.4, T * 0.4);
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(T * 0.6, -T * 0.22);
    ctx.lineTo(T * 0.6, T * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8483a';
    ctx.beginPath();
    ctx.ellipse(L * 0.86, T * 1.6, L * 0.36, T * 2.6, 0.1, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(L * 0.6, -T * 0.05, L * 0.22, T * 0.85, 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fbe4dc';
    ctx.beginPath();
    ctx.ellipse(L * 0.5, -T * 0.08, L * 0.09, T * 0.5, 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,20,10,0.6)';
    ctx.beginPath();
    ctx.moveTo(L * 0.72, T * 1.2);
    ctx.quadraticCurveTo(L * 0.8, T * 1.6, L * 0.9, T * 1.3);
    ctx.stroke();
    ctx.restore();
  }

  function checklist(ctx, w, h, u) {
    const idx = Math.max(0, Math.min(CHECK.items.length - 1, Math.floor(u)));
    const ph = u - Math.floor(u);
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = w * 0.009;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const box = (x, y, bw, bh) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.03);
      ctx.strokeRect(0, 0, bw, bh);
      ctx.restore();
    };
    box(w * 0.06, -h * 0.22, w * 0.26, h * 0.3);
    box(w * 0.05, h * 0.3, w * 0.27, h * 0.34);
    box(w * 0.08, h * 0.86, w * 0.26, h * 0.3);
    ctx.fillStyle = '#141414';
    ctx.textBaseline = 'middle';
    scrawl(ctx, Math.round(h * 0.2));
    ctx.fillText(CHECK.top, w * 0.6, h * 0.0);
    ctx.fillText(CHECK.bottom, w * 0.62, h * 1.0);
    const lines = CHECK.items[idx].replace(/[|]/g, String.fromCharCode(10)).split('\n');
    let size = Math.round(h * (lines.length > 2 ? 0.13 : lines.length > 1 ? 0.16 : 0.2));
    scrawl(ctx, size);
    const widest = () => Math.max(...lines.map(l => ctx.measureText(l).width));
    while (size > 12 && widest() > w * 0.5) scrawl(ctx, size -= 2);
    const tw = widest();
    const tx = w * 0.46, ty = h * (lines.length > 2 ? 0.26 : lines.length > 1 ? 0.36 : 0.45);
    const write = Math.min(1, ph / 0.3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx - 4, 0, tw * write + 8, h);
    ctx.clip();
    lines.forEach((l, i) => ctx.fillText(l, tx, ty + i * size * 1.05));
    const uy = ty + (lines.length - 1) * size * 1.05;
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.moveTo(tx, uy + size * 0.62);
    ctx.lineTo(tx + tw * 0.55, uy + size * 0.6);
    ctx.lineTo(tx + tw * 0.35, uy + size * 0.8);
    ctx.lineTo(tx + tw * 0.6, uy + size * 0.78);
    ctx.stroke();
    ctx.restore();
    const tick = [[w * 0.07, h * 0.5], [w * 0.17, h * 0.64], [w * 0.5, h * 0.06]];
    const tk = Math.max(0, Math.min(1, (ph - 0.45) / 0.25));
    let tip = [tx + tw * write, ty + size * 0.3];
    if (ph >= 0.3 && ph < 0.45) {
      const k = (ph - 0.3) / 0.15;
      tip = [tip[0] + (tick[0][0] - tip[0]) * k, tip[1] + (tick[0][1] - tip[1]) * k];
    }
    if (tk > 0) {
      ctx.strokeStyle = '#4ee04a';
      ctx.lineWidth = h * 0.05;
      ctx.beginPath();
      ctx.moveTo(tick[0][0], tick[0][1]);
      if (tk < 0.3) tip = [tick[0][0] + (tick[1][0] - tick[0][0]) * tk / 0.3, tick[0][1] + (tick[1][1] - tick[0][1]) * tk / 0.3];
      else {
        ctx.lineTo(tick[1][0], tick[1][1]);
        const q = (tk - 0.3) / 0.7;
        tip = [tick[1][0] + (tick[2][0] - tick[1][0]) * q, tick[1][1] + (tick[2][1] - tick[1][1]) * q];
      }
      ctx.lineTo(tip[0], tip[1]);
      ctx.stroke();
    }
    if (ph < 0.85) {
      const out = Math.max(0, (ph - 0.7) / 0.15);
      pencilHand(ctx, w, h, tip[0] + out * w * 0.6, tip[1] - out * h * 0.8);
    }
  }

  function scroll(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#3a6a1a');
    g.addColorStop(0.5, '#8a5a1a');
    g.addColorStop(1, '#5a1a0a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.45, h * 0.55);
    ctx.rotate(-0.28);
    ctx.fillStyle = '#5a4ae8';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.55);
    ctx.lineTo(w * 0.32, -h * 0.62);
    ctx.quadraticCurveTo(w * 0.42, -h * 0.55, w * 0.38, -h * 0.4);
    ctx.lineTo(w * 0.4, h * 0.62);
    ctx.lineTo(-w * 0.52, h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f4f4ff';
    ctx.font = `${Math.round(h * 0.075)}px "Segoe Print", "Comic Sans MS", cursive`;
    ctx.textBaseline = 'middle';
    [['Project Takeover:', -0.36, -0.46], ['Capture Team fortress = ?', -0.44, -0.33], ['us', -0.3, -0.18], ['Capture /', 0.02, -0.12], ['Brainwash', 0.04, -0.02], ['2+2 = fish', -0.44, 0.17], ['TF2', 0.26, 0.15], ['mercs', 0.24, 0.27], ['moon', -0.3, 0.32], ['Destroy', 0.1, 0.42], ['World', 0.22, 0.54]].forEach(([t, x, y]) => ctx.fillText(t, x * w, y * h));
    ctx.strokeStyle = '#f4f4ff';
    ctx.lineWidth = 4;
    const stick = (x, y, sc) => {
      ctx.beginPath();
      ctx.arc(x, y, 10 * sc, 0, PI * 2);
      ctx.moveTo(x, y + 10 * sc);
      ctx.lineTo(x, y + 34 * sc);
      ctx.moveTo(x - 12 * sc, y + 20 * sc);
      ctx.lineTo(x + 12 * sc, y + 20 * sc);
      ctx.moveTo(x, y + 34 * sc);
      ctx.lineTo(x - 9 * sc, y + 50 * sc);
      ctx.moveTo(x, y + 34 * sc);
      ctx.lineTo(x + 9 * sc, y + 50 * sc);
      ctx.stroke();
    };
    stick(-w * 0.22, -h * 0.12, 1);
    stick(-w * 0.15, -h * 0.1, 1);
    stick(-w * 0.09, -h * 0.12, 1);
    ctx.beginPath();
    ctx.moveTo(-w * 0.05, -h * 0.02);
    ctx.lineTo(w * 0.1, h * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.12, h * 0.17, h * 0.07, 0, PI * 2);
    ctx.moveTo(w * 0.08, h * 0.15);
    ctx.lineTo(w * 0.16, h * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-w * 0.32, h * 0.44, h * 0.07, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-w * 0.32, h * 0.46, h * 0.035, 0.2, PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.33, h * 0.45, h * 0.06, 0, PI * 2);
    ctx.moveTo(w * 0.27, h * 0.45);
    ctx.lineTo(w * 0.39, h * 0.45);
    ctx.stroke();
    [[-0.42, -0.02], [-0.16, 0.04]].forEach(([x, y]) => {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x * w + Math.cos(i * 1.256) * 10, y * h + Math.sin(i * 1.256) * 10, 7, 0, PI * 2);
        ctx.stroke();
      }
    });
    ctx.restore();
    ctx.fillStyle = '#e8261e';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(w * 0.93, h * 0.55, w * 0.08, h * 0.16, 0.2, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd8d0';
    ctx.beginPath();
    ctx.ellipse(w * 0.9, h * 0.5, w * 0.03, h * 0.05, 0.2, 0, PI * 2);
    ctx.fill();
  }

  function previously(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.06);
    const s = fit(ctx, 'PREVIOUSLY', w * 0.86, Math.round(h * 0.4));
    ctx.font = `900 ${s}px ${FONT}`;
    outlined(ctx, 'PREVIOUSLY', 0, -s * 0.5, ORANGE, ORANGE_DK, s * 0.18);
    outlined(ctx, 'ON...', 0, s * 0.5, ORANGE, ORANGE_DK, s * 0.18);
    ctx.restore();
  }

  function tinyText(text) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e8e8e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(h * 0.026)}px Arial, sans-serif`;
      ctx.fillText(text, w / 2, h / 2);
    };
  }

  function bigNumber(text) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(h * 0.19)}px Arial, sans-serif`;
      ctx.fillText(text, w / 2, h * 0.5);
    };
  }

  function stopwatch(ctx, w, h, u) {
    ctx.clearRect(0, 0, w, h);
    const t = Math.max(0, Math.min(30, u)).toFixed(3);
    ctx.font = `700 ${Math.round(h * 0.075)}px Arial, sans-serif`;
    const tw = ctx.measureText(t).width;
    ctx.fillStyle = '#050505';
    ctx.fillRect(w * 0.94 - tw - 14, h * 0.86, tw + 18, h * 0.1);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, w * 0.94 - tw - 5, h * 0.912);
  }

  function gameTimer(ctx, w, h, u) {
    ctx.clearRect(0, 0, w, h);
    const sec = Math.max(0, u);
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60), c = Math.floor((sec % 1) * 100);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8261e';
    ctx.font = `italic 700 ${Math.round(h * 0.11)}px "Courier New", monospace`;
    ctx.fillText(`${m}:${String(s).padStart(2, '0')}`, w * 0.74, h * 0.14);
    ctx.font = `italic 700 ${Math.round(h * 0.06)}px "Courier New", monospace`;
    ctx.fillText(String(c).padStart(2, '0'), w * 0.88, h * 0.16);
  }

  function gauge(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.84, cy = h * 0.83, r = h * 0.12;
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, PI * 1.05, PI * 1.6);
    ctx.stroke();
    ctx.strokeStyle = '#e8a02a';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, PI * 1.62, PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(cx - r * 0.35, cy - r * 0.2, r * 0.7, r * 0.4);
  }

  function checkpoint(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e8eef2';
    ctx.font = `700 ${Math.round(h * 0.035)}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('CHECKPOINT', w * 0.18, h * 0.12);
  }

  function missionFailed(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8261e';
    ctx.font = `700 ${Math.round(h * 0.055)}px Arial, sans-serif`;
    ctx.fillText('MISSION FAILED', w * 0.08, h * 0.68);
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `700 ${Math.round(h * 0.03)}px Arial, sans-serif`;
    ['Load Last Checkpoint', 'Restart Level', 'Exit to Main Menu'].forEach((t, i) => ctx.fillText(t, w * 0.1, h * (0.76 + i * 0.045)));
  }

  function dash(dark) {
    return (ctx, w, h) => {
      if (dark) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#3a4448');
        g.addColorStop(1, '#14181a');
        ctx.fillStyle = g;
      } else ctx.fillStyle = '#c8ccd0';
      ctx.fillRect(0, 0, w, h);
      if (!dark) {
        ctx.strokeStyle = 'rgba(120,130,140,0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        const g2 = ctx.createRadialGradient(w * 0.6, h * 0.8, 0, w * 0.6, h * 0.8, w * 0.25);
        g2.addColorStop(0, 'rgba(255,240,140,1)');
        g2.addColorStop(0.4, 'rgba(255,140,30,0.9)');
        g2.addColorStop(1, 'rgba(255,90,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#5a4630';
        ctx.fillRect(w * 0.68, h * 0.3, w * 0.06, h * 0.3);
        ctx.fillStyle = '#c8a07a';
        ctx.beginPath();
        ctx.arc(w * 0.71, h * 0.26, h * 0.05, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a6a80';
        ctx.fillRect(w * 0.68, h * 0.6, w * 0.06, h * 0.25);
      } else {
        ctx.fillStyle = '#2a2e30';
        ctx.fillRect(w * 0.42, h * 0.35, w * 0.16, h * 0.14);
        ctx.fillStyle = '#c8b47a';
        ctx.fillRect(w * 0.45, h * 0.37, w * 0.03, h * 0.1);
      }
      ctx.fillStyle = dark ? '#e8eef2' : '#f8f8f8';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(h * 0.035)}px Arial, sans-serif`;
      ctx.fillText('Trophy Collection', w * 0.38, h * 0.04);
      ctx.font = `600 ${Math.round(h * 0.025)}px Arial, sans-serif`;
      ctx.fillText('kitty', w * 0.38, h * 0.08);
      ctx.font = `600 ${Math.round(h * 0.033)}px Arial, sans-serif`;
      ctx.fillText('Game Store', w * 0.38, h * 0.11);
      ctx.fillText('1/16 8:40 PM', w * 0.7, h * 0.11);
      ctx.fillText('Download Them Direct from the Network', w * 0.42, h * 0.16);
      ctx.fillStyle = dark ? '#d8dde0' : '#ffffff';
      [0.08, 0.16, 0.3, 0.45, 0.56, 0.68].forEach((x, i) => {
        ctx.fillRect(w * x, h * 0.27, w * 0.04, h * 0.05);
        if (i === 2) { ctx.font = `600 ${Math.round(h * 0.028)}px Arial, sans-serif`; ctx.fillText('Game', w * x, h * 0.35); }
      });
      ctx.font = `600 ${Math.round(h * 0.04)}px Arial, sans-serif`;
      ctx.fillText('Agent Zero: The Mind Maze', w * 0.4, h * 0.46);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.27, h * 0.62, w * 0.07, h * 0.05);
    };
  }

  function gameTitle(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a3a4a');
    g.addColorStop(1, '#0e161e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,190,220,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.42, h * 0.48, h * 0.32, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.42, 0);
    ctx.lineTo(w * 0.42, h);
    ctx.moveTo(0, h * 0.42);
    ctx.lineTo(w, h * 0.55);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8eef4';
    ctx.font = `700 ${Math.round(h * 0.03)}px Arial, sans-serif`;
    ctx.fillText('A SPY STORY', w * 0.24, h * 0.4);
    ctx.font = `900 ${Math.round(h * 0.11)}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('AGENT ZERO', w * 0.22, h * 0.5);
    ctx.fillStyle = '#e8a02a';
    ctx.font = `700 ${Math.round(h * 0.04)}px Arial, sans-serif`;
    ctx.fillText('THE MIND MAZE', w * 0.44, h * 0.59);
    ctx.fillStyle = '#e8eef4';
    ctx.font = `600 ${Math.round(h * 0.03)}px Arial, sans-serif`;
    ['New Campaign', 'Continue Campaign', 'Replay Chapter'].forEach((t, i) => ctx.fillText(t, w * 0.74, h * (0.65 + i * 0.045)));
    ctx.font = `600 ${Math.round(h * 0.03)}px Arial, sans-serif`;
    ctx.fillText('Resume the search for your identity', w * 0.4, h * 0.84);
    ctx.fillText('(A) Accept  (B) Back', w * 0.78, h * 0.84);
  }

  function resumeText(ctx, w, h) {
    gameTitle(ctx, w, h);
    ctx.fillStyle = 'rgba(14,22,30,0.92)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8eef4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(h * 0.05)}px Arial, sans-serif`;
    ctx.fillText('Resume the search for your identity', w / 2, h * 0.56);
  }

  function photoScore(ctx, w, h) {
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0, 0, w, h);
    ctx.clearRect(w * 0.14, h * 0.14, w * 0.6, h * 0.72);
    ctx.strokeStyle = '#e83ad8';
    ctx.lineWidth = h * 0.015;
    ctx.beginPath();
    ctx.ellipse(w * 0.4, h * 0.42, w * 0.08, h * 0.13, 0, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e83ad8';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.44);
    ctx.lineTo(w * 0.52, h * 0.41);
    ctx.lineTo(w * 0.52, h * 0.47);
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8261e';
    ctx.font = `italic 700 ${Math.round(h * 0.04)}px Arial, sans-serif`;
    ctx.fillText('TOTAL: 999999 PP', w * 0.68, h * 0.07);
    ctx.fillStyle = '#e83ad8';
    ctx.font = `600 ${Math.round(h * 0.035)}px Arial, sans-serif`;
    ctx.fillText('funny', w * 0.62, h * 0.21);
    ctx.fillText('999999+', w * 0.75, h * 0.21);
    ctx.font = `italic 900 ${Math.round(h * 0.13)}px "Arial Black", Arial, sans-serif`;
    outlined(ctx, 'YOU SUCK!!!', w * 0.14, h * 0.5, '#f2e8a0', '#5a4a1a', 5);
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `italic 700 ${Math.round(h * 0.035)}px Arial, sans-serif`;
    ctx.fillText('Covered wars? Easy.', w * 0.3, h * 0.59);
  }

  function freeHats(ctx, w, h) {
    ctx.fillStyle = '#f8f8f6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a5ab8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.34)}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('FREE', w / 2, h * 0.3);
    ctx.fillText('HATS', w / 2, h * 0.72);
  }

  function moonFace(ctx, w, h) {
    const g = rand(71);
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = g() * w, y = g() * h, r = 3 + g() * 18;
      ctx.fillStyle = `rgba(${g() < 0.5 ? '40,26,14' : '170,140,90'},${0.25 + g() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.8, 0, 0, PI * 2);
      ctx.fill();
    }
    const cx = w * 0.5, cy = h * 0.5, s = h * 0.32;
    ctx.fillStyle = 'rgba(30,18,8,0.8)';
    [[-0.36, -0.12, 0.26, 0.18], [0.34, -0.1, 0.2, 0.15]].forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(cx + x * s * 2, cy + y * s * 2, rx * s * 2, ry * s * 2, 0, 0, PI * 2);
      ctx.fill();
    });
    [[-0.36, -0.1, 0.11, '#ff3a1a'], [0.34, -0.09, 0.075, '#ff9a1a']].forEach(([x, y, r, col]) => {
      const gr = ctx.createRadialGradient(cx + x * s * 2, cy + y * s * 2, 0, cx + x * s * 2, cy + y * s * 2, r * s * 2);
      gr.addColorStop(0, '#fff8c0');
      gr.addColorStop(0.35, col);
      gr.addColorStop(1, 'rgba(80,10,0,0.9)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(cx + x * s * 2, cy + y * s * 2, r * s * 2, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(cx - s * 1.2, cy - s * 0.62);
    ctx.lineTo(cx - s * 0.2, cy - s * 0.34);
    ctx.moveTo(cx + s * 1.1, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.25, cy - s * 0.36);
    ctx.stroke();
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.06, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.16, cy + s * 0.32);
    ctx.lineTo(cx - s * 0.16, cy + s * 0.34);
    ctx.fill();
    ctx.fillStyle = '#1a0a04';
    ctx.beginPath();
    ctx.moveTo(cx - s * 1.05, cy + s * 0.45);
    ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 1.05, cx + s * 1.0, cy + s * 0.38);
    ctx.quadraticCurveTo(cx, cy + s * 0.68, cx - s * 1.05, cy + s * 0.45);
    ctx.fill();
    ctx.fillStyle = '#e8d890';
    for (let i = 0; i < 11; i++) {
      if (i === 3 || i === 7) continue;
      const k = i / 10;
      const x = cx - s * 0.9 + k * s * 1.8;
      const y = cy + s * (0.5 + Math.sin(k * PI) * 0.22);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.07, y - s * 0.02);
      ctx.lineTo(x + s * 0.07, y - s * 0.02);
      ctx.lineTo(x, y + s * (i % 2 ? 0.18 : 0.12));
      ctx.fill();
    }
  }

  function moonSky(ctx, w, h) {
    ctx.fillStyle = '#1a2ad8';
    ctx.fillRect(0, 0, w, h);
    const g = rand(44);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 160; i++) ctx.fillRect(g() * w, g() * h, 1 + g() * 2, 1 + g() * 2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * PI * 2;
      const r = h * (0.4 + (i % 2 ? 0.05 : 0) + g() * 0.04);
      ctx.lineTo(w / 2 + Math.cos(a) * r * 0.85, h / 2 + Math.sin(a) * r);
    }
    ctx.fill();
    ctx.fillStyle = '#05050c';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.53, h * 0.3, h * 0.34, 0, 0, PI * 2);
    ctx.fill();
  }

  function moonDisc(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, PI * 2);
    ctx.clip();
    ctx.translate(-w / 2, 0);
    moonFace(ctx, w * 2, h);
    ctx.restore();
    const g = ctx.createRadialGradient(w * 0.42, h * 0.4, w * 0.1, w / 2, h / 2, w * 0.49);
    g.addColorStop(0, 'rgba(255,230,180,0.18)');
    g.addColorStop(0.7, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(10,4,0,0.75)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.48, 0, PI * 2);
    ctx.fill();
  }

  function evilEyes(ctx, w, h) {
    ctx.fillStyle = '#030202';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h * 0.75, 0, h);
    g.addColorStop(0, 'rgba(255,170,60,0)');
    g.addColorStop(1, 'rgba(255,190,90,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    greenHill(ctx, w * 0.95, h * 0.3, w * 0.12);
    ctx.fillStyle = '#fffbe8';
    ctx.shadowColor = 'rgba(255,240,200,1)';
    ctx.shadowBlur = h * 0.05;
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + k * 0.08), h * 0.38);
      ctx.quadraticCurveTo(w * (0.5 + k * 0.2), h * 0.18, w * (0.5 + k * 0.36), h * 0.2);
      ctx.quadraticCurveTo(w * (0.5 + k * 0.26), h * 0.42, w * (0.5 + k * 0.08), h * 0.38);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function moonHands(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(0.6, '#f0d8a8');
    g.addColorStop(1, '#a87a3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0a0606';
    ctx.shadowColor = 'rgba(40,20,0,0.9)';
    ctx.shadowBlur = h * 0.04;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, w * 0.3, h * 0.62, 0, 0, PI * 2);
    ctx.fill();
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + k * 0.22), h);
      ctx.quadraticCurveTo(w * (0.5 + k * 0.42), h * 0.62, w * (0.5 + k * 0.33), h * 0.2);
      ctx.lineTo(w * (0.5 + k * 0.37), h * 0.05);
      ctx.lineTo(w * (0.5 + k * 0.28), h * 0.18);
      ctx.lineTo(w * (0.5 + k * 0.3), h * 0.02);
      ctx.lineTo(w * (0.5 + k * 0.22), h * 0.2);
      ctx.quadraticCurveTo(w * (0.5 + k * 0.2), h * 0.6, w * (0.5 + k * 0.08), h);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fffaf0';
    ctx.shadowColor = 'rgba(255,250,230,1)';
    ctx.shadowBlur = h * 0.05;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.68);
    for (let i = 0; i <= 8; i++) ctx.lineTo(w * (0.3 + i * 0.05), h * (i % 2 ? 0.74 : 0.69));
    ctx.lineTo(w * 0.7, h * 0.8);
    for (let i = 8; i >= 0; i--) ctx.lineTo(w * (0.3 + i * 0.05), h * (i % 2 ? 0.76 : 0.82));
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.34, h * 0.17, 0, PI * 2);
    ctx.clip();
    ctx.translate(w / 2 - h * 0.17 * 2, h * 0.34 - h * 0.17);
    ctx.scale(h * 0.17 * 4 / w, h * 0.34 / h);
    moonFace(ctx, w, h);
    ctx.restore();
  }

  function skyHead(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const skin = ['#e8b890', '#c88a60', '#f0c8a8'][kind];
      ctx.fillStyle = skin;
      ctx.strokeStyle = '#2a1a10';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w * 0.36, h * 0.42, 0, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ['#3a2a1a', '#141010', '#8a5a2a'][kind];
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.2, w * 0.34, h * 0.16, 0, PI, 0);
      ctx.fill();
      ctx.fillStyle = '#141010';
      [-1, 1].forEach(k => ctx.fillRect(w / 2 + k * w * 0.12 - 5, h * 0.42, 10, 8));
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.6, w * 0.14, 0.15, PI - 0.15);
      ctx.stroke();
      if (kind === 1) ctx.fillRect(w * 0.36, h * 0.54, w * 0.28, 6);
    };
  }

  function engiMask(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e8b880';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.58, w * 0.34, h * 0.36, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e88a1a';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.3, w * 0.42, h * 0.2, 0, PI, 0);
    ctx.fill();
    ctx.fillRect(w * 0.06, h * 0.28, w * 0.88, h * 0.06);
    ctx.fillStyle = '#141414';
    ctx.fillRect(w * 0.18, h * 0.44, w * 0.64, h * 0.1);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.7, w * 0.16, 0.2, PI - 0.2);
    ctx.fill();
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function doodle(ctx, w, h) {
    ctx.fillStyle = '#f4f4f2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.55, w * 0.22, h * 0.36, 0, 0, PI * 2);
    ctx.stroke();
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.ellipse(w * (0.5 + k * 0.08), h * 0.45, w * 0.07, h * 0.15, 0, 0, PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * (0.5 + k * 0.08), h * 0.48, 6, 0, PI * 2);
      ctx.fillStyle = '#2a2a3a';
      ctx.fill();
    });
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.75);
    ctx.lineTo(w * 0.58, h * 0.73);
    ctx.stroke();
  }

  function boardGame(ctx, w, h) {
    ctx.fillStyle = '#d8ecd0';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#d83a2a', '#e8c83a', '#3a8ad8', '#3ab83a', '#a83ab8', '#e87a2a'];
    const n = 9, c = w / n;
    for (let i = 0; i < n; i++) {
      [[i * c, 0], [i * c, h - c], [0, i * c], [w - c, i * c]].forEach(([x, y], j) => {
        ctx.fillStyle = '#f6f4ea';
        ctx.fillRect(x, y, c, c);
        ctx.fillStyle = cols[(i + j) % cols.length];
        ctx.fillRect(x + 2, y + 2, c - 4, c * 0.25);
        ctx.strokeStyle = '#2a2a2a';
        ctx.strokeRect(x, y, c, c);
      });
    }
    ctx.fillStyle = '#c82a1e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.12)}px ${FONT}`;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.6);
    ctx.fillText('TYCOON', 0, 0);
    ctx.restore();
  }

  function xenonBanner(ctx, w, h) {
    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, w, h);
    const c = h * 0.14;
    for (let y = 0; y < 2; y++) for (let x = 0; x < w / c; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#141414' : '#f6f6f2';
      ctx.fillRect(x * c, y * c, c, c);
      ctx.fillRect(x * c, h - (y + 1) * c, c, c);
    }
    ctx.fillStyle = '#141414';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(h * 0.2)}px "Courier New", monospace`;
    ctx.fillText('I HOPE XENON DOESN’T KILL', w / 2, h * 0.42);
    ctx.fillText('ME FOR EDITING HIS MAP', w / 2, h * 0.64);
  }

  function omegaSign(ctx, w, h) {
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8822a';
    ctx.lineWidth = h * 0.08;
    ctx.beginPath();
    ctx.arc(w * 0.3, h / 2, h * 0.32, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e8822a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.42)}px Arial, sans-serif`;
    ctx.fillText('Ω', w * 0.3, h * 0.52);
    ctx.font = `700 ${Math.round(h * 0.3)}px Arial, sans-serif`;
    ctx.fillText('LAB 98', w * 0.7, h * 0.52);
  }

  function blueTiles(ctx, w, h) {
    ctx.fillStyle = '#0a1a5a';
    ctx.fillRect(0, 0, w, h);
    const n = 4, c = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const g = ctx.createLinearGradient(x * c, y * c, x * c + c, y * c + c);
      g.addColorStop(0, '#3a6ae8');
      g.addColorStop(1, '#1a3ab8');
      ctx.fillStyle = g;
      ctx.fillRect(x * c + 3, y * c + 3, c - 6, c - 6);
    }
  }

  function tvScan(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  }

  function skyline(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a0e16');
    g.addColorStop(1, '#2a3440');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rand(23);
    let x = 0;
    while (x < w) {
      const bw = 20 + r() * 50, bh = h * (0.3 + r() * 0.55);
      ctx.fillStyle = '#06080c';
      ctx.fillRect(x, h - bh, bw, bh);
      ctx.fillStyle = 'rgba(255,220,150,0.7)';
      for (let yy = h - bh + 6; yy < h - 6; yy += 9) for (let xx = x + 4; xx < x + bw - 4; xx += 8) if (r() < 0.3) ctx.fillRect(xx, yy, 3, 4);
      x += bw + 2;
    }
  }

  function shops(ctx, w, h) {
    ctx.fillStyle = '#c8c4bc';
    ctx.fillRect(0, 0, w, h);
    const names = ['CAFE', 'SHOES', 'BOOKS', 'TOYS'];
    const cols = ['#8a3a2a', '#2a4a6a', '#3a5a2a', '#6a4a8a'];
    const sw = w / names.length;
    names.forEach((n, i) => {
      const x = i * sw;
      ctx.fillStyle = cols[i];
      ctx.fillRect(x + 4, 4, sw - 8, h * 0.18);
      ctx.fillStyle = '#f2f0e8';
      ctx.font = `700 ${Math.round(h * 0.12)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n, x + sw / 2, 4 + h * 0.09);
      const gl = ctx.createLinearGradient(0, h * 0.25, 0, h);
      gl.addColorStop(0, '#9ab4c0');
      gl.addColorStop(1, '#5a7480');
      ctx.fillStyle = gl;
      ctx.fillRect(x + 8, h * 0.25, sw - 16, h * 0.72);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x + sw * 0.4, h * 0.45, sw * 0.2, h * 0.52);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 12, h * 0.3, sw * 0.15, h * 0.6);
    });
  }

  function flagFake(ctx, w, h) {
    ctx.fillStyle = '#1e3a6e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(0, h * 0.42, w, h * 0.16);
    ctx.fillStyle = '#e8b82a';
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.18);
    ctx.lineTo(w * 0.62, h * 0.18);
    ctx.lineTo(w * 0.44, h * 0.66);
    ctx.lineTo(w * 0.64, h * 0.66);
    ctx.lineTo(w * 0.64, h * 0.82);
    ctx.lineTo(w * 0.36, h * 0.82);
    ctx.lineTo(w * 0.54, h * 0.34);
    ctx.lineTo(w * 0.38, h * 0.34);
    ctx.closePath();
    ctx.fill();
  }

  function winGrid(ctx, w, h) {
    ctx.fillStyle = '#3a3e42';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f2f6f8');
    g.addColorStop(1, '#b8c4cc');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
    ctx.fillStyle = '#1a1c1e';
    for (let i = 1; i < 8; i++) ctx.fillRect(w * 0.06 + i * w * 0.11 - 3, h * 0.06, 6, h * 0.88);
    ctx.fillRect(w * 0.06, h * 0.48, w * 0.88, 6);
  }

  function spiral(ctx, w, h) {
    ctx.fillStyle = '#3aa82a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1a5a14';
    ctx.lineWidth = 3;
    [[0.25, 0.3], [0.75, 0.3], [0.25, 0.8], [0.75, 0.8]].forEach(([cx, cy]) => {
      ctx.beginPath();
      for (let a = 0; a < PI * 12; a += 0.15) {
        const rr = a * w * 0.0062;
        ctx.lineTo(cx * w + Math.cos(a) * rr, cy * h + Math.sin(a) * rr);
      }
      ctx.stroke();
    });
  }

  function zigzag(ctx, w, h) {
    ctx.fillStyle = '#e8e2c4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8ab85a';
    const n = 8, c = w / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * c, h);
      ctx.lineTo(i * c + c / 2, h * 0.45);
      ctx.lineTo(i * c + c, h);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(i * c, 0);
      ctx.lineTo(i * c + c / 2, h * 0.3);
      ctx.lineTo(i * c + c, 0);
      ctx.fill();
    }
  }

  function pinkZig(ctx, w, h) {
    ctx.fillStyle = '#e86aa8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b83a7a';
    const n = 8, c = w / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * c, h);
      ctx.lineTo(i * c + c / 2, 0);
      ctx.lineTo(i * c + c, h);
      ctx.fill();
    }
  }

  function brick(ctx, w, h) {
    ctx.fillStyle = '#3a1810';
    ctx.fillRect(0, 0, w, h);
    const rows = 8, bh = h / rows, bw = w / 4;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2;
      ctx.fillStyle = (x + y) % 3 ? '#c8382a' : '#b02e22';
      ctx.fillRect(x * bw + ox + 2, y * bh + 2, bw - 4, bh - 4);
    }
  }

  function versusBlu(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a4a4a';
    ctx.font = `900 ${Math.round(h * 0.34)}px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('VERSUS', w * 0.05, h * 0.52);
    ctx.fillStyle = '#3a6ab8';
    ctx.beginPath();
    ctx.ellipse(w * 0.78, h * 0.5, w * 0.17, h * 0.36, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2f0ea';
    ctx.font = `900 ${Math.round(h * 0.3)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('BLU', w * 0.78, h * 0.53);
  }

  function redBill(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8301e';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.56, h * 0.32, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.47, h * 0.12, w * 0.06, h * 0.16);
    ctx.strokeStyle = '#c8301e';
    ctx.lineWidth = h * 0.03;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.12);
    ctx.quadraticCurveTo(w * 0.56, h * 0.02, w * 0.62, h * 0.08);
    ctx.stroke();
    ctx.fillStyle = '#f2f0ea';
    ctx.font = `900 italic ${Math.round(h * 0.26)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RED', w * 0.5, h * 0.6);
  }

  function iris(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(w * 0.46, h * 0.52, w * 0.3, h * 0.42, -0.08, 0, PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function grayPhoto(scene) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#e8e8e4';
      ctx.fillRect(0, 0, w, h);
      const x0 = w * 0.05, y0 = h * 0.06, pw = w * 0.9, ph = h * 0.88;
      const g = ctx.createLinearGradient(0, y0, 0, y0 + ph);
      g.addColorStop(0, '#8a8a88');
      g.addColorStop(1, '#4a4a48');
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, pw, ph);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, pw, ph);
      ctx.clip();
      ctx.fillStyle = '#b8b8b4';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x0 + pw * (0.12 + i * 0.2), y0 + ph * 0.62, ph * 0.18, PI, 0);
        ctx.lineTo(x0 + pw * (0.12 + i * 0.2) + ph * 0.18, y0 + ph * 0.75);
        ctx.lineTo(x0 + pw * (0.12 + i * 0.2) - ph * 0.18, y0 + ph * 0.75);
        ctx.fill();
        ctx.fillStyle = '#2a2a28';
        ctx.fillRect(x0 + pw * (0.1 + i * 0.2), y0 + ph * 0.56, 4, 8);
        ctx.fillRect(x0 + pw * (0.14 + i * 0.2), y0 + ph * 0.56, 4, 8);
        ctx.fillStyle = '#b8b8b4';
      }
      ctx.fillStyle = '#6a6a68';
      ctx.fillRect(x0, y0 + ph * 0.75, pw, ph * 0.25);
      ctx.fillStyle = '#1a1a1a';
      if (scene === 'heavy') {
        const cx = x0 + pw * 0.3, cy = y0 + ph * 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, pw * 0.045, ph * 0.12, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - ph * 0.15, ph * 0.04, 0, PI * 2);
        ctx.fill();
        ctx.fillRect(cx - pw * 0.03, cy + ph * 0.08, pw * 0.02, ph * 0.18);
        ctx.fillRect(cx + pw * 0.01, cy + ph * 0.08, pw * 0.02, ph * 0.16);
      } else {
        ctx.fillRect(x0 + pw * 0.52, y0 + ph * 0.7, pw * 0.22, ph * 0.08);
        ctx.beginPath();
        ctx.arc(x0 + pw * 0.56, y0 + ph * 0.79, ph * 0.04, 0, PI * 2);
        ctx.arc(x0 + pw * 0.7, y0 + ph * 0.79, ph * 0.04, 0, PI * 2);
        ctx.fill();
        ctx.font = `900 ${Math.round(ph * 0.14)}px ${FONT}`;
        ctx.fillStyle = '#f2f2f2';
        ctx.textAlign = 'center';
        ctx.fillText('NEMESIS!', x0 + pw * 0.5, y0 + ph * 0.2);
      }
      ctx.restore();
    };
  }

  function fireFlicker(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(19);
    [0, 1].forEach(side => {
      for (let i = 0; i < 9; i++) {
        const x = (i + 0.5) / 9 * w + (g() - 0.5) * w * 0.06;
        const len = h * (0.18 + g() * 0.22);
        const gr = side ? ctx.createLinearGradient(0, h, 0, h - len) : ctx.createLinearGradient(0, 0, 0, len);
        gr.addColorStop(0, 'rgb(255,220,120)');
        gr.addColorStop(0.5, 'rgb(230,120,20)');
        gr.addColorStop(1, 'rgb(0,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        if (side) {
          ctx.moveTo(x - w * 0.05, h);
          ctx.quadraticCurveTo(x - w * 0.02, h - len * 0.6, x + (g() - 0.5) * w * 0.04, h - len);
          ctx.quadraticCurveTo(x + w * 0.03, h - len * 0.5, x + w * 0.05, h);
        } else {
          ctx.moveTo(x - w * 0.05, 0);
          ctx.quadraticCurveTo(x - w * 0.02, len * 0.6, x + (g() - 0.5) * w * 0.04, len);
          ctx.quadraticCurveTo(x + w * 0.03, len * 0.5, x + w * 0.05, 0);
        }
        ctx.fill();
      }
    });
  }

  function glitch(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(27);
    for (let i = 0; i < 18; i++) {
      const y = g() * h, bh = 2 + g() * 10;
      ctx.fillStyle = g() < 0.5 ? 'rgb(60,110,255)' : 'rgb(200,220,255)';
      ctx.fillRect(g() * w * 0.3, y, w * (0.3 + g() * 0.7), bh);
    }
  }

  function scratches(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(31);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = g() < 0.6 ? 'rgba(255,250,235,1)' : 'rgba(60,40,20,1)';
      const x = g() * w;
      ctx.fillRect(x, 0, 1 + g() * 1.5, h);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(30,20,10,1)';
      ctx.fillRect(g() * w, g() * h, 2, 2);
    }
  }

  function bulletHole(ctx, w, h) {
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, w, h);
    const g = rand(41);
    ctx.fillStyle = '#c81e14';
    for (let i = 0; i < 6; i++) ctx.fillRect(g() * w * 0.25, g() * h, w * (0.05 + g() * 0.1), h * (0.02 + g() * 0.08));
    const cx = w * 0.52, cy = h * 0.42;
    ctx.strokeStyle = 'rgba(230,240,255,0.9)';
    for (let i = 0; i < 16; i++) {
      const a = g() * PI * 2;
      ctx.lineWidth = 1 + g() * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let x = cx, y = cy;
      for (let k = 0; k < 4; k++) {
        x += Math.cos(a + (g() - 0.5) * 0.6) * h * (0.04 + g() * 0.05);
        y += Math.sin(a + (g() - 0.5) * 0.6) * h * (0.04 + g() * 0.05);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#e8eef8';
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.07, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.045, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 30; i++) ctx.fillRect(cx + (g() - 0.5) * w * 0.4, cy + (g() - 0.5) * h * 0.6, 2, 2);
  }

  function impMood(mode) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.52, s = h * 0.38;
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#e8180e';
      ctx.strokeStyle = '#140808';
      ctx.lineWidth = s * 0.04;
      ctx.fillStyle = '#f4f2ee';
      ctx.fillRect(cx - s * 0.5, cy + s * 0.65, s, h);
      ctx.strokeRect(cx - s * 0.5, cy + s * 0.65, s, h);
      ctx.fillStyle = '#141414';
      ctx.fillRect(cx - s * 0.5, cy + s * 0.65, s * 0.22, h);
      ctx.fillRect(cx + s * 0.28, cy + s * 0.65, s * 0.22, h);
      ctx.fillStyle = '#e8180e';
      impHeadPath(ctx, cx, cy, s);
      ctx.fill();
      ctx.stroke();
      [-1, 1].forEach(k => {
        ctx.fillStyle = '#f8d8d8';
        ctx.beginPath();
        ctx.moveTo(cx + k * s * 0.82, cy - s * 0.32);
        ctx.lineTo(cx + k * s * 0.98, cy - s * 0.92);
        ctx.lineTo(cx + k * s * 0.55, cy - s * 0.6);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#e8180e';
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) ctx.lineTo(cx - s * 0.36 + i * s * 0.12, cy - s * (i % 2 ? 0.98 : 0.66));
      ctx.lineTo(cx + s * 0.36, cy - s * 0.6);
      ctx.lineTo(cx - s * 0.36, cy - s * 0.6);
      ctx.fill();
      impAntennae(ctx, cx, cy, s);
      const eye = (k, rx, ry, lid, look) => {
        const ex = cx + k * s * 0.3, ey = cy - s * 0.2;
        ctx.fillStyle = '#fbf8f0';
        ctx.strokeStyle = '#140808';
        ctx.lineWidth = s * 0.03;
        ctx.beginPath();
        ctx.ellipse(ex, ey, s * rx, s * ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#140808';
        ctx.beginPath();
        ctx.arc(ex + s * (look || 0), ey + s * ry * 0.2, s * 0.045, 0, PI * 2);
        ctx.fill();
        if (lid) {
          ctx.fillStyle = '#e8180e';
          ctx.fillRect(ex - s * rx * 1.15, ey - s * ry * 1.2, s * rx * 2.3, s * ry * 1.2 * lid);
          ctx.beginPath();
          ctx.moveTo(ex - s * rx * 1.1, ey - s * ry * 1.2 + s * ry * 1.2 * lid);
          ctx.lineTo(ex + s * rx * 1.1, ey - s * ry * 1.2 + s * ry * 1.2 * lid + k * s * 0.03);
          ctx.stroke();
        }
      };
      const mouth = (curve, teeth, tongue) => {
        ctx.fillStyle = '#140808';
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.12, s * 0.11, s * 0.075, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#140808';
        ctx.lineWidth = s * 0.035;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.45, cy + s * 0.28);
        ctx.quadraticCurveTo(cx, cy + s * (0.28 + curve), cx + s * 0.48, cy + s * 0.22);
        ctx.stroke();
        if (teeth) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx - s * 0.4, cy + s * 0.3);
          ctx.quadraticCurveTo(cx, cy + s * (0.3 + curve), cx + s * 0.42, cy + s * 0.25);
          ctx.quadraticCurveTo(cx, cy + s * (0.3 + curve * 0.4), cx - s * 0.4, cy + s * 0.3);
          ctx.fill();
          ctx.stroke();
        }
        if (tongue) {
          ctx.fillStyle = '#f2a0a0';
          ctx.beginPath();
          ctx.ellipse(cx + s * 0.15, cy + s * 0.36, s * 0.08, s * 0.06, 0.3, 0, PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      };
      if (mode === 'smirk') { eye(-1, 0.2, 0.15, 0.55, 0.06); eye(1, 0.2, 0.15, 0.45, 0.06); mouth(0.12, false, false); }
      if (mode === 'snarl') { eye(-1, 0.18, 0.13, 0.65, 0); eye(1, 0.18, 0.13, 0.65, 0); mouth(-0.06, true, false); }
      if (mode === 'bulge') { eye(-1, 0.3, 0.28, 0, 0.12); eye(1, 0.34, 0.3, 0, 0.14); mouth(0.02, false, false); }
      if (mode === 'sly') { eye(-1, 0.22, 0.16, 0.4, -0.05); eye(1, 0.22, 0.16, 0.5, -0.05); mouth(0.18, false, true); }
      if (mode === 'hearts' || mode === 'cry') {
        [-1, 1].forEach(k => {
          const ex = cx + k * s * 0.3, ey = cy - s * 0.2;
          ctx.fillStyle = mode === 'hearts' ? '#ffffff' : '#0a0a0a';
          ctx.shadowColor = mode === 'hearts' ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0)';
          ctx.shadowBlur = mode === 'hearts' ? s * 0.25 : 0;
          ctx.beginPath();
          ctx.ellipse(ex, ey, s * 0.3, s * 0.27, 0, 0, PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          if (mode === 'hearts') {
            ctx.strokeStyle = '#8ad8ff';
            ctx.lineWidth = s * 0.025;
            ctx.beginPath();
            ctx.moveTo(ex, ey + s * 0.12);
            ctx.bezierCurveTo(ex - s * 0.2, ey - s * 0.02, ex - s * 0.1, ey - s * 0.16, ex, ey - s * 0.05);
            ctx.bezierCurveTo(ex + s * 0.1, ey - s * 0.16, ex + s * 0.2, ey - s * 0.02, ex, ey + s * 0.12);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex - s * 0.08, ey - s * 0.08, s * 0.07, 0, PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3ad8e8';
            ctx.fillRect(ex + k * s * 0.05, ey + s * 0.25, s * 0.035, s * 0.45);
          }
        });
        mouth(mode === 'hearts' ? 0.2 : -0.12, mode === 'hearts', false);
      }
    };
  }

  function impHand(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#140808';
    ctx.lineWidth = h * 0.012;
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w * 0.2, h * 0.4);
    ctx.lineTo(w * 0.26, h * 0.5);
    ctx.lineTo(0, h * 0.8);
    ctx.fill();
    ctx.fillStyle = '#e8261e';
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h * 0.42);
    ctx.quadraticCurveTo(w * 0.35, h * 0.12, w * 0.55, h * 0.18);
    ctx.lineTo(w * 0.58, h * 0.28);
    ctx.quadraticCurveTo(w * 0.4, h * 0.26, w * 0.26, h * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(w * 0.62, h * 0.42);
    ctx.rotate(0.15);
    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(-w * 0.12, -h * 0.2, w * 0.24, h * 0.4);
    ctx.strokeRect(-w * 0.12, -h * 0.2, w * 0.24, h * 0.4);
    const g = ctx.createRadialGradient(0, -h * 0.03, 0, 0, -h * 0.03, w * 0.1);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#8ab8e8');
    g.addColorStop(1, '#2a3a5a');
    ctx.fillStyle = g;
    ctx.fillRect(-w * 0.1, -h * 0.17, w * 0.2, h * 0.27);
    ctx.restore();
    ctx.fillStyle = '#e8261e';
    [[0.52, 0.2], [0.56, 0.26], [0.58, 0.33]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(w * x + w * 0.05, h * y, w * 0.05, h * 0.025, 0.2, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  function moonRing(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(46);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * PI * 2;
      const r = w * (0.45 + (i % 2 ? 0.04 : 0) + g() * 0.03);
      ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    }
    ctx.fill();
    const in2 = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.4);
    in2.addColorStop(0, '#000');
    in2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = in2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.42, 0, PI * 2);
    ctx.fill();
  }

  function halftone(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < w; x += 6) {
      ctx.beginPath();
      ctx.arc(x + 1.5, y + 1.5, 1.6, 0, PI * 2);
      ctx.fill();
    }
  }

  function someTime(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const s = fit(ctx, 'TIME LATER...', w * 0.8, Math.round(h * 0.2));
    ctx.font = `900 ${s}px ${FONT}`;
    outlined(ctx, 'SOME', w * 0.48, h * 0.42, ORANGE, ORANGE_DK, s * 0.12);
    outlined(ctx, 'TIME LATER...', w * 0.52, h * 0.6, ORANGE, ORANGE_DK, s * 0.12);
  }

  function lessons(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#c8a878');
    g.addColorStop(1, '#a8885a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,60,30,0.35)';
    for (let x = 0; x < w; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = '#141414';
    ctx.font = `${Math.round(h * 0.3)}px "Segoe Print", "Comic Sans MS", cursive`;
    ctx.textBaseline = 'middle';
    ctx.fillText('GUITAR', w * 0.06, h * 0.3);
    ctx.fillText('LESSONS', w * 0.04, h * 0.72);
    ctx.fillStyle = '#9a9aa0';
    [[0.05, 0.08], [0.92, 0.08], [0.05, 0.9], [0.92, 0.9]].forEach(([x, y]) => ctx.fillRect(w * x, h * y, 8, 3));
  }

  function flammable(ctx, w, h) {
    ctx.fillStyle = '#e8e8e0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(h * 0.13)}px Arial, sans-serif`;
    ctx.fillText('FLAMMABLE', w / 2, h * 0.15);
    ctx.save();
    ctx.translate(w / 2, h * 0.65);
    ctx.rotate(PI / 4);
    ctx.fillStyle = '#e8261e';
    ctx.fillRect(-h * 0.22, -h * 0.22, h * 0.44, h * 0.44);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.48);
    ctx.quadraticCurveTo(w / 2 + h * 0.12, h * 0.68, w / 2, h * 0.8);
    ctx.quadraticCurveTo(w / 2 - h * 0.12, h * 0.68, w / 2, h * 0.48);
    ctx.fill();
  }

  function caution(ctx, w, h) {
    ctx.fillStyle = '#f2c81e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#141414';
    for (let x = -h; x < w; x += h * 0.5) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h * 0.25, h);
      ctx.lineTo(x + h * 0.25 + h * 0.3, h * 0.7);
      ctx.lineTo(x + h * 0.3, h * 0.7);
      ctx.fill();
    }
    ctx.font = `900 ${Math.round(h * 0.45)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CAUTION', w / 2, h * 0.38);
  }

  function laptopScreen(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1a5aa8');
    g.addColorStop(1, '#0a2a5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8dde8';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.05, h * (0.08 + i * 0.18), w * 0.08, h * 0.1);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, h * 0.92, w, h * 0.08);
  }

  function bigFace(ctx, w, h) {
    ctx.fillStyle = '#2a1c2c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c87aa8';
    ctx.strokeStyle = '#140a14';
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.55, w * 0.42, h * 0.4, 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.2, w * 0.3, h * 0.12, 0, PI, 0);
    ctx.fill();
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#f8f0f4';
      ctx.beginPath();
      ctx.ellipse(w * (0.5 + k * 0.15), h * 0.45, w * 0.1, h * 0.07, 0, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c87aa8';
      ctx.fillRect(w * (0.5 + k * 0.15) - w * 0.11, h * 0.37, w * 0.22, h * 0.07);
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + k * 0.15) - w * 0.11, h * 0.44);
      ctx.lineTo(w * (0.5 + k * 0.15) + w * 0.11, h * 0.44);
      ctx.stroke();
      ctx.fillStyle = '#140a14';
      ctx.beginPath();
      ctx.arc(w * (0.5 + k * 0.15) + w * 0.03, h * 0.47, w * 0.022, 0, PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.68);
    ctx.quadraticCurveTo(w * 0.5, h * 0.86, w * 0.76, h * 0.64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.48, h * 0.5);
    ctx.quadraticCurveTo(w * 0.55, h * 0.6, w * 0.47, h * 0.62);
    ctx.stroke();
  }

  function purpleEnergy(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = rand(57);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const a = g() * PI * 2, r = w * (0.15 + g() * 0.3);
      const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, w * (0.05 + g() * 0.08));
      gr.addColorStop(0, g() < 0.5 ? 'rgb(255,120,255)' : 'rgb(170,90,255)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function blackHole(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#7a3ad8';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.48, h * 0.2, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.28, 0, PI * 2);
    ctx.fill();
  }

  const CREDITS = [
    ['title', 'TEAM FABULOUS 2'],
    ['head', '-CREDITS-'],
    ['gap'],
    ['head', '*STARRING*'],
    ['line', 'The RED and BLU mercenaries'],
    ['line', 'Spunky the Imp'],
    ['line', 'And a whole lot of guests'],
    ['gap'],
    ['head', '*VOICE TALENT*'],
    ['row', 'Me', 'as myself'],
    ['row', 'My Little Brother', 'as The Kid on the Mic'],
    ['row', 'The Heavy', 'as the singer, he insisted'],
    ['gap'],
    ['head', '*MADE WITH*'],
    ['row', 'A pencil', 'all those drawings'],
    ['row', 'A very old computer', 'buggy, crashy, but it got there'],
    ['row', 'A tape recorder', 'every sound you heard'],
    ['row', 'A capture card', 'the Let’s Play on the TV'],
    ['row', 'Lots of patience', 'one frame at a time'],
    ['gap'],
    ['head', '*MAPS USED*'],
    ['row', 'kart_cakeway', 'custom, unreleased'],
    ['row', 'kart_cakeway_night', 'even more custom'],
    ['gap'],
    ['head', '*SPECIAL THANKS*'],
    ['row', 'The brother', 'for the commentary'],
    ['row', 'The forum', 'for some tubular ideas'],
    ['row', 'You', 'for watching this little production'],
    ['row', 'Me', 'for all those drawings and animations'],
    ['gap'],
    ['head', '*THE VERY END*'],
    ['line', 'Cool, you actually read the credits. Proud’a you. <3']
  ];

  function creditsLayout(w) {
    let y = 0;
    const s = w / 960;
    return CREDITS.map(([kind, a, b]) => {
      const item = { kind, a, b, y };
      y += kind === 'title' ? 54 * s : kind === 'head' ? 40 * s : kind === 'gap' ? 26 * s : 22 * s;
      return item;
    });
  }

  function credits(ctx, w, h, u) {
    ctx.clearRect(0, 0, w, h);
    const s = w / 960;
    const x0 = w * 0.36, x1 = w * 0.97;
    ctx.textBaseline = 'middle';
    creditsLayout(w).forEach(it => {
      const y = h + 10 * s + it.y - u * s;
      if (y < -40 * s || y > h + 40 * s) return;
      if (it.kind === 'title') {
        ctx.textAlign = 'center';
        ctx.font = `900 ${Math.round(26 * s)}px ${FONT}`;
        outlined(ctx, it.a, (x0 + x1) / 2, y, ORANGE, ORANGE_DK, 4 * s);
      } else if (it.kind === 'head') {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f2f2f0';
        ctx.font = `${Math.round(19 * s)}px Georgia, "Times New Roman", serif`;
        ctx.fillText(it.a, (x0 + x1) / 2, y);
      } else if (it.kind === 'line') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e8e8e4';
        ctx.font = `${Math.round(13 * s)}px Georgia, "Times New Roman", serif`;
        ctx.fillText(it.a, x0, y);
      } else if (it.kind === 'row') {
        ctx.fillStyle = '#e8e8e4';
        ctx.font = `${Math.round(13 * s)}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = 'left';
        ctx.fillText(it.a, x0, y);
        ctx.textAlign = 'right';
        ctx.fillText(it.b, x1, y);
        const aw = ctx.measureText(it.a).width;
        ctx.textAlign = 'left';
        const bw = ctx.measureText(it.b).width;
        let dots = '';
        const dw = ctx.measureText('.').width;
        const room = x1 - x0 - aw - bw - 12 * s;
        for (let i = 0; i < room / dw; i++) dots += '.';
        ctx.fillText(dots, x0 + aw + 6 * s, y);
      }
    });
  }

  function creditsLength() {
    const L = creditsLayout(960);
    return L[L.length - 1].y + 540 + 40;
  }

  function raceWindow(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.clearRect(w * 0.0625, h * 0.278, w * 0.44, h * 0.437);
  }

  function sketchPage(kind) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#ecebe6';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(160,170,190,0.35)';
      ctx.lineWidth = 1;
      for (let y = 14; y < h; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const g = rand(kind.length * 13 + 5);
      ctx.strokeStyle = 'rgba(40,40,44,0.75)';
      ctx.lineCap = 'round';
      const head = (cx, cy, r, k) => {
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const a = (i / 24) * PI * 2;
          const rr = r * (1 + (g() - 0.5) * 0.08) * (k === 'heavy' ? 1 : 0.9);
          ctx.lineTo(cx + Math.cos(a) * rr * (k === 'heavy' ? 1.1 : 0.85), cy + Math.sin(a) * rr);
        }
        ctx.stroke();
        ctx.lineWidth = 1.2;
        [-1, 1].forEach(sd => {
          ctx.beginPath();
          ctx.ellipse(cx + sd * r * 0.35, cy - r * 0.1, r * 0.13, r * 0.09, 0, 0, PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + sd * r * 0.55, cy - r * 0.32);
          ctx.lineTo(cx + sd * r * 0.15, cy - r * 0.26);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.05);
        ctx.quadraticCurveTo(cx + r * 0.15, cy + r * 0.2, cx - r * 0.05, cy + r * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.35, cy + r * 0.45);
        ctx.quadraticCurveTo(cx, cy + r * (k === 'imp' ? 0.75 : 0.55), cx + r * 0.38, cy + r * 0.42);
        ctx.stroke();
        if (k === 'imp') {
          [-1, 1].forEach(sd => {
            ctx.beginPath();
            ctx.moveTo(cx + sd * r * 0.5, cy - r * 0.75);
            ctx.lineTo(cx + sd * r * 0.85, cy - r * 1.4);
            ctx.lineTo(cx + sd * r * 0.2, cy - r * 0.95);
            ctx.stroke();
          });
        }
        if (k === 'engie') {
          ctx.beginPath();
          ctx.ellipse(cx, cy - r * 0.75, r * 1.5, r * 0.25, 0, 0, PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, cy - r * 0.95, r * 0.75, r * 0.4, 0, PI, 0);
          ctx.stroke();
        }
      };
      const n = kind === 'heavy' ? 4 : 3;
      for (let i = 0; i < n; i++) head(w * (0.18 + i * (0.64 / (n - 1))), h * (0.35 + (i % 2) * 0.3), h * (0.14 + g() * 0.04), kind);
      ctx.fillStyle = 'rgba(40,40,44,0.7)';
      ctx.font = `${Math.round(h * 0.07)}px "Segoe Print", "Comic Sans MS", cursive`;
      ctx.textAlign = 'left';
      ctx.fillText({ heavy: 'Heavy - face studies', imp: 'Spunky v3', engie: 'hero, hat ok?' }[kind], w * 0.05, h * 0.1);
    };
  }

  const DRAW = {
    presents: smokeCard(['KITTY0706', 'PRESENTS']),
    production: smokeCard(['A', '1999', 'PRODUCTION']),
    logo,
    starring: orangeTitle('STARRING...', { fill: '#f6b448', stroke: '#9a5a1a', glow: 'rgba(255,170,60,0.9)' }),
    peeps: orangeTitle('AND SOME\nOTHER PEEPS', { size: 0.8, fill: '#f2e6b8', stroke: '#5a7aa8', glow: 'rgba(90,170,255,0.95)' }),
    created: smokeCard(['CREATED BY', 'KITTY0706'], { clear: true, size: 0.3, gap: 0.3, wide: 0.9 }),
    sketchHeavy: sketch('heavy'),
    sketchScout: sketch('scout'),
    sketchSniper: sketch('sniper'),
    medic: bubble('medic'),
    alert: bubble('alert'),
    grass: checker('#5cbf2a', '#7ed83e', 8),
    grassDark: checker('#3a8a1e', '#4ea428', 8),
    sand: checker('#d6c896', '#d9cc9a', 2),
    hills,
    rainbow,
    stripes,
    qblock,
    redStuds: studs('#c8322a', '#e2483a', '#a02620'),
    blueStuds: studs('#5a8ac8', '#78a8e2', '#3c6aa8'),
    noU: sign('no.U', { bg: '#c8261e', fg: '#ffffff', italic: true, size: 0.6 }),
    cakeway: sign('XENON CAKEWAY', { bg: '#141414', fg: '#e8322a', checker: true, size: 0.42, stroke: '#ffd8d0' }),
    mph: sign('88 MPH', { bg: '#f2e23a', fg: '#141414', italic: true, size: 0.55 }),
    resupply,
    xed: xedSign,
    resupplyRed: sign('RESUPPLY', { bg: '#7a2a1e', fg: '#f2dcae', size: 0.6 }),
    resupplyBlue: sign('RESUPPLY', { bg: '#1a4a8a', fg: '#e8f0ff', size: 0.6 }),
    chalkboard,
    garage,
    pointA: pointSign('A'),
    pointB: pointSign('B'),
    pointC: pointSign('C'),
    planks,
    gravel,
    heartMask,
    inkWipe,
    ration,
    raceHud,
    banana,
    sub_Doo: subtitle('Doo'),
    sub_Doo_yooh_rhemnmmem: subtitle('Doo yooh rhemnmmem'),
    sub_vodka: subtitle('vodka'),
    scope,
    redFrame,
    scan,
    streaks,
    stripesWipe,
    coins,
    shutterWood,
    comic,
    spyCheck,
    cinema,
    polaroid,
    killcam,
    decoy,
    pinWas,
    pinCrab,
    pinSheep,
    curse,
    vanSide,
    intermission,
    warpHaze,
    ink,
    sub_sandwich: subtitle('sandwich'),
    trespass: sign('NO TRESPASSING', { bg: '#5a4632', fg: '#e8dcc0', size: 0.5 }),
    watch: sign('WATCH YOUR STEP', { bg: '#c8b04a', fg: '#2a2214', size: 0.5 }),
    exit: sign('EXIT →', { bg: '#1a3a1a', fg: '#7af07a', size: 0.6 }),
    posterHero: poster('hero'),
    posterGirls: poster('girls'),
    posterRacer: poster('racer'),
    posterMoon: poster('moon'),
    impFace,
    impBody,
    impSil: impSilhouette(false),
    impSip: impSilhouette(true),
    impSil2: impShadowBig,
    scroll,
    previously,
    bumpA: tinyText('hats'),
    bumpB: tinyText('[youvid.com]'),
    sw0: bigNumber('0.000'),
    sw30: bigNumber('30.000'),
    dashA: dash(false),
    dashB: dash(true),
    gameTitle,
    resumeText,
    missionFailed,
    gauge,
    checkpoint,
    photoScore,
    freeHats,
    moonFace,
    moonSky,
    moonDisc,
    evilEyes,
    moonHands,
    skyHeadA: skyHead(0),
    skyHeadB: skyHead(1),
    skyHeadC: skyHead(2),
    engiMask,
    doodle,
    boardGame,
    xenon: xenonBanner,
    omega: omegaSign,
    blueTiles,
    tvScan,
    skyline,
    shops,
    flagFake,
    winGrid,
    spiral,
    zigzag,
    pinkZig,
    brick,
    versusBlu,
    redBill,
    darkStuds: studs('#2a2a34', '#3c3c48', '#18181e'),
    flagBlue: checker('#eaf2ff', '#3a7ad8', 4),
    marble: checker('#e0dcd2', '#b0aa9e', 2),
    iris,
    photoHeavy: grayPhoto('heavy'),
    photoKill: grayPhoto('kill'),
    fireFlicker,
    glitch,
    scratches,
    bulletHole,
    impSmirk: impMood('smirk'),
    impSnarl: impMood('snarl'),
    impBulge: impMood('bulge'),
    impHearts: impMood('hearts'),
    impCry: impMood('cry'),
    impSly: impMood('sly'),
    impHand,
    moonRing,
    halftone,
    someTime,
    lessons,
    flammable,
    caution,
    laptopScreen,
    bigFace,
    purpleEnergy,
    blackHole,
    raceWindow,
    sketchPageHeavy: sketchPage('heavy'),
    sketchPageImp: sketchPage('imp'),
    sketchPageEngie: sketchPage('engie'),
    createdOrange: orangeTitle('CREATED BY\nKITTY0706', { size: 0.42 }),
    copyright: orangeTitle('(C) 1999', { size: 0.3 })
  };

  const SIZE = {
    coins: [256, 256], shutterWood: [64, 128], comic: [256, 256], spyCheck: [512, 288], cinema: [512, 288], polaroid: [128, 160], killcam: [512, 96], decoy: [128, 228],
    pinWas: [256, 200], pinCrab: [192, 256], pinSheep: [256, 200], curse: [128, 96], vanSide: [512, 160], intermission: [512, 288], warpHaze: [256, 144], ink: [256, 256], sub_sandwich: [512, 64],
    presents: [512, 288], production: [512, 288], logo: [512, 384], starring: [512, 128], peeps: [512, 256], created: [512, 256],
    sketchHeavy: [512, 288], sketchScout: [512, 288], sketchSniper: [512, 288], medic: [64, 64], alert: [64, 64],
    grass: [128, 128], grassDark: [128, 128], sand: [16, 16], hills: [512, 256], rainbow: [128, 128], stripes: [256, 256], qblock: [64, 64],
    redStuds: [64, 64], blueStuds: [64, 64], noU: [256, 64], cakeway: [512, 96], mph: [128, 64], resupply: [256, 64], xed: [128, 64], resupplyRed: [256, 64], resupplyBlue: [256, 64], chalkboard: [256, 128], garage: [64, 64], pointA: [64, 64], pointB: [64, 64], pointC: [64, 64], planks: [128, 128], gravel: [128, 128], trespass: [512, 64], watch: [256, 64], exit: [128, 40], heartMask: [512, 512], inkWipe: [256, 144], ration: [512, 160], raceHud: [512, 288], banana: [128, 96], sub_Doo: [512, 64], sub_Doo_yooh_rhemnmmem: [512, 64], sub_vodka: [512, 64], scope: [512, 288], redFrame: [256, 144], scan: [256, 144], streaks: [512, 288], stripesWipe: [64, 64],
    posterHero: [128, 192], posterGirls: [128, 192], posterRacer: [128, 192], posterMoon: [128, 192],
    impFace: [512, 288], impBody: [256, 256], impSil: [512, 288], impSip: [512, 288], impSil2: [512, 288], scroll: [512, 288], previously: [256, 96], bumpA: [512, 288], bumpB: [512, 288], sw0: [512, 288], sw30: [512, 288],
    dashA: [512, 288], dashB: [512, 288], gameTitle: [512, 288], resumeText: [512, 288], missionFailed: [512, 288], gauge: [512, 288], checkpoint: [512, 288], photoScore: [512, 288], freeHats: [256, 128],
    moonFace: [1024, 512], moonSky: [256, 256], moonDisc: [256, 256], evilEyes: [512, 288], moonHands: [512, 288], skyHeadA: [128, 128], skyHeadB: [128, 128], skyHeadC: [128, 128], engiMask: [128, 128], doodle: [256, 160],
    boardGame: [256, 256], xenon: [512, 96], omega: [256, 96], blueTiles: [128, 128], tvScan: [256, 144],
    skyline: [512, 128], shops: [512, 128], flagFake: [128, 160], winGrid: [128, 128], spiral: [256, 128], zigzag: [128, 64], pinkZig: [128, 32], brick: [128, 128],
    versusBlu: [512, 192], redBill: [256, 160], darkStuds: [64, 64], flagBlue: [64, 64], marble: [64, 64],
    iris: [512, 288], photoHeavy: [256, 192], photoKill: [256, 192], fireFlicker: [256, 144], glitch: [256, 144], scratches: [256, 144], bulletHole: [512, 288],
    impSmirk: [256, 256], impSnarl: [256, 256], impBulge: [256, 256], impHearts: [256, 256], impCry: [256, 256], impSly: [256, 256], impHand: [512, 288],
    moonRing: [256, 256], halftone: [256, 144], someTime: [512, 288], lessons: [256, 160], flammable: [128, 128], caution: [128, 40], laptopScreen: [128, 96],
    bigFace: [256, 256], purpleEnergy: [256, 256], blackHole: [256, 256],
    raceWindow: [960, 540], sketchPageHeavy: [384, 256], sketchPageImp: [384, 256], sketchPageEngie: [384, 256], createdOrange: [512, 288], copyright: [512, 288]
  };

  const NEAREST = { hills: true, qblock: true, grass: true, grassDark: true, rainbow: true };

  function tex(r, cache, key) {
    if (cache[key]) return cache[key];
    const sz = SIZE[key] || [256, 256];
    cache[key] = r.texture(sz[0], DRAW[key], { height: sz[1], nearest: !!NEAREST[key], clamp: !['grass', 'grassDark', 'sand', 'rainbow', 'stripes', 'redStuds', 'blueStuds', 'hills', 'garage', 'planks', 'gravel', 'coins', 'shutterWood', 'blueTiles', 'moonFace', 'spiral', 'zigzag', 'pinkZig', 'brick', 'darkStuds', 'marble', 'shops', 'skyline'].includes(key) });
    return cache[key];
  }

  function hud(r, cache, text, team) {
    const key = 'hud|' + team + '|' + text;
    if (!cache[key]) cache[key] = r.texture(256, hudTimer(text, team), { height: 64, clamp: true });
    return cache[key];
  }

  function chat(r, cache, text) {
    const key = 'chat|' + text;
    if (!cache[key]) cache[key] = r.texture(512, chatLine(text), { height: 32, clamp: true });
    return cache[key];
  }

  const LIVE = { cartoon, stopwatch, gameTimer, checklist, credits };
  const LIVE_SIZE = { credits: [960, 540] };

  window.FabArt = { DRAW, SIZE, LIVE, LIVE_SIZE, creditsLength, tex, hud, chat, orangeTitle, smokeCard, sign, fit, outlined, ORANGE, ORANGE_DK, FONT };
})();
