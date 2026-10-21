(function () {
  const PI = Math.PI;

  const EYE_PATCH = [-1.0, 1.0, -0.52, 0.3];
  const MOUTH_PATCH = [-0.62, 0.62, -0.9, -0.4];

  const STYLES = {
    klee: {
      skin: '#ffd6c2',
      iris: ['#9c2a18', '#f0602a', '#ffc27a'],
      pupil: '#3a0c08',
      lash: '#4a1a12',
      brow: '#c88a6a',
      blush: [255, 120, 120],
      width: 0.28,
      height: 0.46,
      eyeY: -0.12,
      eyeX: 0.46,
      browY: 0.24
    },
    jean: {
      skin: '#ffd9c6',
      iris: ['#2a2a78', '#6a68d8', '#b8b4ff'],
      pupil: '#1a1a48',
      lash: '#4a3020',
      brow: '#b88a48',
      blush: [255, 150, 150],
      width: 0.25,
      height: 0.32,
      eyeY: -0.06,
      eyeX: 0.42,
      browY: 0.2
    },
    stelle: {
      skin: '#fde2d6',
      iris: ['#8a5a0c', '#e0a42a', '#ffe68e'],
      pupil: '#40260a',
      lash: '#3c383e',
      brow: '#8c8c96',
      blush: [255, 160, 150],
      width: 0.24,
      height: 0.31,
      eyeY: -0.08,
      eyeX: 0.42,
      browY: 0.2
    }
  };

  function patchMap(patch, w, h) {
    const [y0, y1, p0, p1] = patch;
    return {
      x: (yaw) => ((yaw - y0) / (y1 - y0)) * w,
      y: (pit) => (1 - (pit - p0) / (p1 - p0)) * h,
      kx: w / (y1 - y0),
      ky: h / (p1 - p0)
    };
  }

  function blush(ctx, x, y, rx, ry, rgb) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const OPEN_K = { open: 1, wide: 1.12, half: 0.62, look: 1, wink: 1 };

  function drawEye(ctx, m, st, state, sd) {
    const cx = m.x(sd * st.eyeX);
    const ey = m.y(st.eyeY);
    const rw = st.width * m.kx;
    const rh = st.height * m.ky * 0.5;
    const closed = state === 'shut' || state === 'happy' || (state === 'wink' && sd < 0);
    const browLift = state === 'wide' ? 0.04 : state === 'half' ? -0.03 : 0;
    const by = m.y(st.browY + browLift);
    ctx.strokeStyle = st.brow;
    ctx.lineWidth = Math.max(2, 0.03 * m.ky);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - sd * rw * 0.75, by + 0.02 * m.ky);
    ctx.quadraticCurveTo(cx, by - 0.03 * m.ky, cx + sd * rw * 0.9, by + 0.03 * m.ky);
    ctx.stroke();
    ctx.strokeStyle = st.lash;
    ctx.lineWidth = Math.max(3, 0.038 * m.ky);
    if (state === 'happy') {
      ctx.beginPath();
      ctx.moveTo(cx - rw * 0.9, ey + rh * 0.35);
      ctx.quadraticCurveTo(cx, ey - rh * 1.25, cx + rw * 0.9, ey + rh * 0.35);
      ctx.stroke();
      return;
    }
    if (closed) {
      ctx.beginPath();
      ctx.moveTo(cx - rw * 0.9, ey - rh * 0.2);
      ctx.quadraticCurveTo(cx, ey + rh * 0.75, cx + rw * 0.9, ey - rh * 0.2);
      ctx.stroke();
      return;
    }
    const ry = rh * (OPEN_K[state] || 1);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, ey, rw, ry, 0, 0, PI * 2);
    ctx.clip();
    ctx.fillStyle = '#fffaf6';
    ctx.fillRect(cx - rw, ey - ry, rw * 2, ry * 2);
    const ig = ctx.createLinearGradient(0, ey - ry, 0, ey + ry);
    ig.addColorStop(0, st.iris[0]);
    ig.addColorStop(0.5, st.iris[1]);
    ig.addColorStop(1, st.iris[2]);
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.ellipse(cx - sd * rw * 0.03, ey + ry * 0.02, rw * 0.88, ry * 1.02, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = st.pupil;
    ctx.beginPath();
    ctx.ellipse(cx - sd * rw * 0.03, ey, rw * 0.36, ry * 0.58, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.beginPath();
    ctx.ellipse(cx - rw * 0.3, ey - ry * 0.4, rw * 0.22, ry * 0.26, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + rw * 0.28, ey + ry * 0.45, rw * 0.11, ry * 0.12, 0, 0, PI * 2);
    ctx.fill();
    if (state === 'half') {
      ctx.fillStyle = st.skin;
      ctx.fillRect(cx - rw * 1.1, ey - ry * 1.1, rw * 2.2, ry * 1.1);
    }
    ctx.restore();
    ctx.beginPath();
    const lidY = state === 'half' ? ey : ey - ry * 0.98;
    ctx.moveTo(cx - sd * rw * 1.0, ey - ry * 0.12);
    ctx.quadraticCurveTo(cx, lidY - ry * 0.5, cx + sd * rw * 1.08, ey - ry * 0.22);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, 0.025 * m.ky);
    ctx.beginPath();
    ctx.moveTo(cx - sd * rw * 0.7, ey + ry * 0.92);
    ctx.quadraticCurveTo(cx + sd * rw * 0.1, ey + ry * 1.08, cx + sd * rw * 0.85, ey + ry * 0.5);
    ctx.stroke();
  }

  function drawEyes(styleName, state) {
    const st = STYLES[styleName];
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      ctx.fillStyle = st.skin;
      ctx.fillRect(0, 0, w, h);
      [-1, 1].forEach(sd => {
        blush(ctx, m.x(sd * (st.eyeX + 0.12)), m.y(st.eyeY - 0.2), 0.2 * m.kx, 0.1 * m.ky, st.blush);
        drawEye(ctx, m, st, state, sd);
      });
    };
  }

  function drawMouth(styleName, state) {
    const st = STYLES[styleName];
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      ctx.fillStyle = st.skin;
      ctx.fillRect(0, 0, w, h);
      const cx = m.x(0);
      const my = m.y(-0.62);
      const mw = 0.17 * m.kx;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const openMap = { talk: 0.07, open: 0.12, wide: 0.2, laugh: 0.24, o: 0.14 };
      const oh = (openMap[state] || 0) * m.ky;
      if (!oh) {
        const curve = (state === 'grin' ? 0.12 : state === 'smile' ? 0.09 : 0.03) * m.ky;
        ctx.strokeStyle = '#a8483c';
        ctx.lineWidth = Math.max(2.4, 0.04 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.85, my - curve * 0.2);
        ctx.quadraticCurveTo(cx, my + curve * 1.4, cx + mw * 0.85, my - curve * 0.2);
        ctx.stroke();
        return;
      }
      const wide = state === 'o' ? 0.5 : state === 'wide' || state === 'laugh' ? 1.1 : 0.8;
      const shape = () => {
        ctx.beginPath();
        ctx.moveTo(cx - mw * wide, my - oh * 0.3);
        ctx.quadraticCurveTo(cx, my - oh * 0.5, cx + mw * wide, my - oh * 0.3);
        ctx.bezierCurveTo(cx + mw * wide * 0.9, my + oh * 1.2, cx - mw * wide * 0.9, my + oh * 1.2, cx - mw * wide, my - oh * 0.3);
        ctx.closePath();
      };
      shape();
      ctx.fillStyle = '#6a1a1a';
      ctx.fill();
      ctx.save();
      shape();
      ctx.clip();
      ctx.fillStyle = '#ff7a82';
      ctx.beginPath();
      ctx.ellipse(cx, my + oh * 0.85, mw * wide * 0.7, oh * 0.55, 0, 0, PI * 2);
      ctx.fill();
      if (state !== 'o' && state !== 'talk') {
        ctx.fillStyle = '#fffaf6';
        ctx.fillRect(cx - mw * wide * 0.75, my - oh * 0.38, mw * wide * 1.5, oh * 0.28);
      }
      ctx.restore();
      ctx.strokeStyle = '#8a3028';
      ctx.lineWidth = 2.2;
      shape();
      ctx.stroke();
    };
  }

  function drawFaceCard(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = kind === 'slime' ? '#10202c' : '#3a1008';
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineCap = 'round';
      ctx.lineWidth = w * 0.045;
      if (kind === 'slime') {
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.ellipse(w * (0.5 + s * 0.2), h * 0.45, w * 0.055, h * 0.12, 0, 0, PI * 2);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.62, w * 0.07, 0.2, PI - 0.2);
        ctx.stroke();
        return;
      }
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(w * (0.5 + s * 0.28), h * 0.5);
        ctx.quadraticCurveTo(w * (0.5 + s * 0.2), h * 0.36, w * (0.5 + s * 0.12), h * 0.5);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.56, w * 0.06, 0.1, PI - 0.1);
      ctx.stroke();
    };
  }

  window.KleeFaces = { EYE_PATCH, MOUTH_PATCH, STYLES, drawEyes, drawMouth, drawFaceCard, patchMap };
})();
