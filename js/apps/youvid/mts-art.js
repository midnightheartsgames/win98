(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  const CREAM = '#f7e8de';
  const RED = '#cf6d64';
  const BAND = '#3d3b3a';
  const TEXT = '#f1e5dc';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';

  const E_POLYS = [[[14, 0], [42, 0], [42, 100], [14, 100]], [[0, 0], [100, 0], [100, 16], [0, 16]], [[86, 0], [100, 0], [100, 34], [86, 34]], [[42, 42], [80, 42], [80, 58], [42, 58]], [[70, 32], [82, 32], [82, 68], [70, 68]], [[0, 84], [106, 84], [106, 100], [0, 100]], [[92, 64], [106, 64], [106, 100], [92, 100]]];

  function rects(ctx, list) {
    list.forEach(([x0, y0, x1, y1]) => ctx.rect(x0, y0, x1 - x0, y1 - y0));
  }

  const GLYPHS = {
    S: {
      w: 98,
      draw(ctx) {
        ctx.lineWidth = 24;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(82, 26);
        ctx.bezierCurveTo(74, 8, 28, 4, 22, 28);
        ctx.bezierCurveTo(17, 46, 44, 49, 54, 52);
        ctx.bezierCurveTo(74, 57, 90, 64, 80, 80);
        ctx.bezierCurveTo(70, 97, 24, 96, 16, 72);
        ctx.stroke();
        ctx.beginPath();
        rects(ctx, [[76, 4, 92, 38], [6, 62, 22, 96]]);
        ctx.fill();
      }
    },
    O: {
      w: 116,
      draw(ctx) {
        ctx.beginPath();
        ctx.ellipse(58, 50, 58, 50, 0, 0, PI * 2);
        ctx.ellipse(58, 50, 27, 31, 0, 0, PI * 2);
        ctx.fill('evenodd');
      }
    },
    L: {
      w: 98,
      draw(ctx) {
        ctx.beginPath();
        rects(ctx, [[14, 0, 42, 100], [0, 0, 58, 15], [0, 85, 98, 100], [84, 60, 98, 100]]);
        ctx.fill();
      }
    },
    D: {
      w: 114,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(56, 0);
        ctx.ellipse(56, 50, 58, 50, 0, -PI / 2, PI / 2);
        ctx.lineTo(0, 100);
        ctx.lineTo(0, 85);
        ctx.lineTo(14, 85);
        ctx.lineTo(14, 15);
        ctx.lineTo(0, 15);
        ctx.closePath();
        ctx.moveTo(42, 15);
        ctx.lineTo(56, 15);
        ctx.ellipse(56, 50, 30, 35, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 85);
        ctx.closePath();
        ctx.fill('evenodd');
      }
    },
    I: {
      w: 56,
      draw(ctx) {
        ctx.beginPath();
        rects(ctx, [[14, 0, 42, 100], [0, 0, 56, 15], [0, 85, 56, 100]]);
        ctx.fill();
      }
    },
    E: {
      w: 106,
      draw(ctx) {
        E_POLYS.forEach(poly => {
          ctx.beginPath();
          poly.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.closePath();
          ctx.fill();
        });
      }
    },
    R: {
      w: 120,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(68, 0);
        ctx.ellipse(68, 28, 36, 28, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 56);
        ctx.lineTo(42, 85);
        ctx.lineTo(56, 85);
        ctx.lineTo(56, 100);
        ctx.lineTo(0, 100);
        ctx.lineTo(0, 85);
        ctx.lineTo(14, 85);
        ctx.lineTo(14, 15);
        ctx.lineTo(0, 15);
        ctx.closePath();
        ctx.moveTo(42, 15);
        ctx.lineTo(64, 15);
        ctx.ellipse(64, 28.5, 16, 13.5, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 42);
        ctx.closePath();
        ctx.fill('evenodd');
        ctx.beginPath();
        ctx.moveTo(58, 50);
        ctx.lineTo(84, 50);
        ctx.lineTo(108, 86);
        ctx.lineTo(82, 86);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        rects(ctx, [[72, 85, 120, 100]]);
        ctx.fill();
      }
    }
  };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    for (const ch of word) {
      const g = GLYPHS[ch];
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(kx, k);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      g.draw(ctx);
      ctx.restore();
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function emblem(ctx, x, y, R, col, bg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.36, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i * PI / 2 + PI / 4);
      ctx.fillRect(-R * 0.09, R * 0.36, R * 0.18, R * 0.7);
      ctx.restore();
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tf2Words(ctx, x, y, h, fill) {
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fill;
    const a = 'TEAM', b = 'FORTRESS 2';
    const wa = ctx.measureText(a).width;
    ctx.fillText(a, x, y);
    ctx.fillText(b, x + wa + h * 0.22, y);
  }

  function smallLogo(ctx, x, y, h) {
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.03, y + i * h * 0.04, h, i > 4 ? '#7a3a1c' : '#b8662c');
    tf2Words(ctx, x, y, h, '#e08a3c');
  }

  function helmetIcon(ctx) {
    ctx.save();
    ctx.translate(240, 212);
    ctx.rotate(-0.59);
    const g = ctx.createLinearGradient(-60, -110, 60, 10);
    g.addColorStop(0, '#8d857b');
    g.addColorStop(0.5, '#6f665c');
    g.addColorStop(1, '#4f473f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-96, 2);
    ctx.bezierCurveTo(-104, -128, 92, -132, 96, -6);
    ctx.lineTo(108, 4);
    ctx.quadraticCurveTo(0, 16, -108, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,245,230,0.16)';
    ctx.beginPath();
    ctx.ellipse(-34, -70, 34, 16, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c332d';
    ctx.beginPath();
    ctx.moveTo(-108, 6);
    ctx.quadraticCurveTo(0, 16, 108, 4);
    ctx.quadraticCurveTo(0, 40, -108, 6);
    ctx.fill();
    ctx.fillStyle = '#4a2c26';
    ctx.beginPath();
    ctx.ellipse(-6, 18, 82, 11, 0, 0, PI);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#3b332d';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(185, 262);
    ctx.quadraticCurveTo(183, 320, 188, 372);
    ctx.stroke();
    ctx.strokeStyle = '#7d756c';
    ctx.lineWidth = 2;
    ctx.strokeRect(182, 368, 12, 14);
  }

  function rocketIcon(ctx, col) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.fillRect(682, 111, 34, 3);
    ctx.beginPath();
    ctx.moveTo(818, 112);
    ctx.lineTo(758, 76);
    ctx.lineTo(778, 100);
    ctx.lineTo(722, 112);
    ctx.lineTo(778, 124);
    ctx.lineTo(758, 148);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(822, 92);
    ctx.lineTo(840, 99);
    ctx.lineTo(990, 99);
    ctx.quadraticCurveTo(1016, 100, 1016, 112);
    ctx.quadraticCurveTo(1016, 124, 990, 125);
    ctx.lineTo(840, 125);
    ctx.lineTo(822, 132);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(884, 92, 28, 40);
    ctx.fillStyle = RED;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2) ctx.fillRect(926 + i * 10, 97 + j * 10, 10, 10);
      }
    }
    ctx.fillRect(876, 99, 4, 26);
    ctx.restore();
  }

  function planks(ctx, W, H, base, n, seed, vertical) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * (vertical ? W : H), s = (vertical ? W : H) / n;
      ctx.fillStyle = `rgba(${g() < 0.5 ? '20,12,8' : '200,170,140'},${0.05 + g() * 0.09})`;
      if (vertical) ctx.fillRect(a, 0, s, H); else ctx.fillRect(0, a, W, s);
      ctx.fillStyle = 'rgba(20,12,8,0.55)';
      if (vertical) ctx.fillRect(a, 0, 2, H); else ctx.fillRect(0, a, W, 2);
    }
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(30,18,12,${g() * 0.12})`;
      if (vertical) ctx.fillRect(g() * W, g() * H, 1, 6 + g() * 22); else ctx.fillRect(g() * W, g() * H, 6 + g() * 22, 1);
    }
  }

  const DRAW = {
    title(ctx, W) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(82, 30);
      ctx.lineTo(1205, 44);
      ctx.lineTo(1192, 672);
      ctx.lineTo(87, 660);
      ctx.closePath();
      ctx.fill();
      const band = () => {
        ctx.beginPath();
        ctx.moveTo(204, 160);
        ctx.lineTo(1280, 160);
        ctx.lineTo(1280, 552);
        ctx.lineTo(258, 458);
        ctx.closePath();
      };
      ctx.fillStyle = BAND;
      band();
      ctx.fill();
      ctx.save();
      band();
      ctx.clip();
      emblem(ctx, 776, 330, 335, '#484644', BAND);
      ctx.restore();
      rocketIcon(ctx, '#f1c6ba');
      helmetIcon(ctx);
      ctx.fillStyle = TEXT;
      ctx.textBaseline = 'alphabetic';
      ctx.font = `48px ${SANS}`;
      ctx.fillText('Meet', 279, 255);
      ctx.font = `32px ${SANS}`;
      ctx.fillText('THE', 330, 290);
      slabWord(ctx, 'SOLDIER', 328, 298, 68, 8, TEXT, 1.6);
      smallLogo(ctx, 530, 626, 34);
      ctx.fillStyle = '#f0d0c0';
      ctx.font = `bold 12px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 761, 605);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillText('A Valve Picture', 761, 626);
      ctx.restore();
    },

    barnWall(ctx, W, H) {
      planks(ctx, W, H, '#3f312d', 14, 61, true);
      const g = rand(62);
      for (let i = 0; i < 60; i++) {
        const x = g() * W, y = g() * H, r = W * (0.02 + g() * 0.06);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${g() < 0.5 ? '30,18,16' : '120,96,90'},0.16)`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#d8cfc4';
      ctx.font = `bold ${Math.round(H * 0.4)}px Georgia, "Times New Roman", serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText('FEED & GRAIN', W * 0.5, H * 0.46);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(0,0,0,${g() * 0.12})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 5, 1 + g() * 3);
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#4b3833';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    },

    corrugated(ctx, W, H) {
      ctx.fillStyle = '#9a6a4c';
      ctx.fillRect(0, 0, W, H);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W, w = W / n;
        const gr = ctx.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, 'rgba(60,30,20,0.35)');
        gr.addColorStop(0.45, 'rgba(255,220,190,0.18)');
        gr.addColorStop(1, 'rgba(60,30,20,0.35)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, w, H);
      }
      const g = rand(71);
      for (let i = 0; i < 120; i++) {
        const x = g() * W, y = g() * H, len = 20 + g() * 120;
        const gr = ctx.createLinearGradient(0, y, 0, y + len);
        gr.addColorStop(0, `rgba(${g() < 0.6 ? '120,50,20' : '200,150,110'},${0.15 + g() * 0.2})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, y, 3 + g() * 8, len);
      }
    },

    woodPlanks(ctx, W, H) {
      planks(ctx, W, H, '#8a6448', 8, 73, false);
    },

    darkPlanks(ctx, W, H) {
      planks(ctx, W, H, '#5a443a', 10, 74, true);
    },

    dirt(ctx, W, H) {
      ctx.fillStyle = '#b08a5e';
      ctx.fillRect(0, 0, W, H);
      const g = rand(75);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '120,86,56' : '214,184,140'},${g() * 0.14})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 4, 2 + g() * 3);
      }
      for (let i = 0; i < 30; i++) {
        const x = g() * W, y = g() * H, r = W * (0.04 + g() * 0.08);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${g() < 0.5 ? '110,80,50' : '220,190,150'},0.14)`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    },

    tuft(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(76);
      for (let i = 0; i < 70; i++) {
        const x0 = W * (0.1 + g() * 0.8);
        const h = H * (0.45 + g() * 0.55);
        const lean = (g() - 0.5) * W * 0.35;
        const c = g();
        ctx.strokeStyle = c < 0.33 ? '#c99a4e' : c < 0.66 ? '#dcb466' : '#a87c3c';
        ctx.lineWidth = 1.5 + g() * 2;
        ctx.beginPath();
        ctx.moveTo(x0, H);
        ctx.quadraticCurveTo(x0 + lean * 0.3, H - h * 0.6, x0 + lean, H - h);
        ctx.stroke();
      }
    },

    crate(ctx, W, H) {
      ctx.fillStyle = '#a07a52';
      ctx.fillRect(0, 0, W, H);
      const g = rand(77);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '60,40,20' : '220,190,150'},${0.06 + g() * 0.08})`;
        ctx.fillRect(0, (i / 6) * H, W, H / 6);
        ctx.fillStyle = 'rgba(60,40,20,0.5)';
        ctx.fillRect(0, (i / 6) * H, W, 2);
      }
      ctx.strokeStyle = '#7a5634';
      ctx.lineWidth = W * 0.09;
      ctx.strokeRect(W * 0.045, H * 0.045, W * 0.91, H * 0.91);
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.92);
      ctx.lineTo(W * 0.92, H * 0.08);
      ctx.stroke();
    },

    dynamite(ctx, W, H) {
      DRAW.crate(ctx, W, H);
      ctx.fillStyle = 'rgba(40,30,24,0.82)';
      ctx.font = `bold ${Math.round(H * 0.16)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-PI / 4);
      ctx.fillText('DYNAMITE', 0, 0);
      ctx.restore();
    },

    bluSign(ctx, W, H) {
      ctx.fillStyle = '#2d4c63';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#c9d4dc';
      ctx.lineWidth = H * 0.05;
      ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H * 0.9);
      ctx.fillStyle = '#eef2f4';
      ctx.beginPath();
      ctx.arc(W * 0.24, H * 0.48, H * 0.28, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d4c63';
      ctx.beginPath();
      ctx.arc(W * 0.24, H * 0.48, H * 0.17, 0, PI * 2);
      ctx.fill();
      ctx.fillRect(W * 0.24, H * 0.42, H * 0.3, H * 0.12);
      ctx.fillStyle = '#eef2f4';
      ctx.font = `bold ${Math.round(H * 0.5)}px ${SANS}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('BLU', W * 0.4, H * 0.5);
      ctx.font = `bold ${Math.round(H * 0.1)}px Arial, sans-serif`;
      ctx.fillText('BUILDERS LEAGUE UNITED', W * 0.4, H * 0.82);
    },

    drill(ctx, W, H) {
      ctx.fillStyle = '#e7e2d8';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2f3d58';
      ctx.font = `bold ${Math.round(H * 0.62)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DRILL HALL', W / 2, H * 0.54);
    },

    noSmoking(ctx, W, H) {
      ctx.fillStyle = '#e4ddd0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#3a3330';
      ctx.lineWidth = W * 0.03;
      ctx.strokeRect(W * 0.04, H * 0.03, W * 0.92, H * 0.94);
      ctx.fillStyle = '#5a3a2a';
      for (let i = 0; i < 4; i++) ctx.fillRect(W * (0.34 + i * 0.08), H * 0.22, W * 0.07, H * 0.34);
      ctx.strokeStyle = '#2a2420';
      ctx.lineWidth = W * 0.015;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.22);
      ctx.quadraticCurveTo(W * 0.56, H * 0.1, W * 0.62, H * 0.14);
      ctx.stroke();
      ctx.strokeStyle = '#b8352a';
      ctx.lineWidth = W * 0.06;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.38, W * 0.3, 0, PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.29, H * 0.17);
      ctx.lineTo(W * 0.71, H * 0.59);
      ctx.stroke();
      ctx.fillStyle = '#3a3330';
      ctx.font = `bold ${Math.round(H * 0.11)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('NO SMOKING', W / 2, H * 0.86);
    },

    number3(ctx, W, H) {
      ctx.fillStyle = '#e8e2d6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8352a';
      ctx.fillRect(0, 0, W, H * 0.22);
      ctx.font = `bold ${Math.round(H * 0.6)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('3', W / 2, H * 0.62);
    },

    siloLogo(ctx, W, H) {
      ctx.fillStyle = '#a99c8c';
      ctx.fillRect(0, 0, W, H);
      const g = rand(78);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '80,70,60' : '220,210,200'},${0.05 + g() * 0.08})`;
        ctx.fillRect(0, g() * H, W, 2 + g() * 6);
      }
      ctx.strokeStyle = 'rgba(60,52,46,0.6)';
      ctx.lineWidth = W * 0.02;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.45, W * 0.12, 0, PI * 2);
      ctx.stroke();
    },

    sky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#c7cfd2');
      g.addColorStop(0.55, '#ece6da');
      g.addColorStop(1, '#f6efe2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    corn(ctx, W, H) {
      ctx.fillStyle = '#b39b62';
      ctx.fillRect(0, 0, W, H);
      const g = rand(79);
      for (let i = 0; i < 260; i++) {
        const x = g() * W, h = H * (0.4 + g() * 0.6);
        ctx.strokeStyle = g() < 0.5 ? 'rgba(120,128,70,0.7)' : 'rgba(200,180,110,0.6)';
        ctx.lineWidth = 2 + g() * 3;
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.lineTo(x + (g() - 0.5) * 10, H - h);
        ctx.stroke();
      }
    },

    gate(ctx, W, H) {
      planks(ctx, W, H, '#b08560', 6, 80, false);
      const g = rand(81);
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(90,60,36,${g() * 0.1})`;
        ctx.fillRect(g() * W, g() * H, 10 + g() * 40, 1);
      }
    },

    blood(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(82);
      ctx.fillStyle = '#8e1a14';
      ctx.fillRect(0, 0, W, H * 0.12);
      for (let i = 0; i < 18; i++) {
        const x = g() * W, len = H * (0.15 + g() * 0.75), w = 0.8 + g() * 1.6;
        ctx.fillRect(x, 0, w, len);
        ctx.beginPath();
        ctx.arc(x + w / 2, len, w * 0.75, 0, PI * 2);
        ctx.fill();
      }
    },

    patchSleeve(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      emblem(ctx, W / 2, H / 2, W * 0.46, '#d9793e', 'rgba(0,0,0,0)');
    },

    socket(ctx, W, H) {
      ctx.fillStyle = '#d6d2c8';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#9c978e';
      [[0.3, 0.5], [0.7, 0.5]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(W * x, H * y, W * 0.16, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2826';
        ctx.fillRect(W * x - W * 0.06, H * y - H * 0.03, W * 0.03, H * 0.06);
        ctx.fillRect(W * x + W * 0.03, H * y - H * 0.03, W * 0.03, H * 0.06);
        ctx.fillStyle = '#9c978e';
      });
    }
  };

  const SIZES = {
    title: [1024, 576], barnWall: [1024, 512], corrugated: [256, 256], woodPlanks: [256, 256], darkPlanks: [256, 256], dirt: [256, 256], tuft: [128, 128],
    crate: [128, 128], dynamite: [128, 128], bluSign: [256, 96], drill: [256, 64], noSmoking: [128, 160], number3: [64, 64], siloLogo: [256, 128],
    sky: [64, 256], corn: [512, 64], gate: [256, 256], blood: [256, 64], patchSleeve: [64, 64], socket: [64, 32]
  };

  const REPEAT = ['corrugated', 'woodPlanks', 'darkPlanks', 'dirt', 'gate', 'corn', 'blood'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      const [w, h] = SIZES[key] || [256, 256];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
    }
    return cache[key];
  }

  window.MtsArt = { DRAW, SIZES, tex, slabWord, emblem, GLYPHS };
})();
