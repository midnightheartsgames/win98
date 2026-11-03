(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh } = K;

  const LIT = [1, 1, 1, 0];

  function furTex(ctx, w, h) {
    const g = rand(91);
    const cols = ['#f59cc8', '#fbe48a', '#a8dcf2', '#f7b48e', '#d4b8f2', '#fbe48a', '#fdf6f0'];
    ctx.fillStyle = '#fbe6dc';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 20 + g() * 40, 14 + g() * 30, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4200; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = g() < 0.3 ? 'rgba(255,255,255,0.75)' : cols[Math.floor(g() * cols.length)];
      ctx.lineWidth = 0.8 + g() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const a = g() * PI * 2, l = 2 + g() * 6;
      ctx.lineTo(x + C(a) * l, y + S(a) * l);
      ctx.stroke();
    }
  }

  function heartTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const heart = () => {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.9);
      ctx.bezierCurveTo(w * 0.08, h * 0.6, w * 0.02, h * 0.18, w * 0.27, h * 0.12);
      ctx.bezierCurveTo(w * 0.4, h * 0.09, w * 0.48, h * 0.18, w * 0.5, h * 0.27);
      ctx.bezierCurveTo(w * 0.52, h * 0.18, w * 0.6, h * 0.09, w * 0.73, h * 0.12);
      ctx.bezierCurveTo(w * 0.98, h * 0.18, w * 0.92, h * 0.6, w * 0.5, h * 0.9);
      ctx.closePath();
    };
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#f8c4ec');
    gr.addColorStop(0.5, '#e98ad6');
    gr.addColorStop(1, '#c86ac4');
    ctx.fillStyle = gr;
    heart();
    ctx.fill();
    ctx.save();
    heart();
    ctx.clip();
    const g = rand(92);
    const cols = ['#ff5a8a', '#5ad0ff', '#ffe25a', '#8aff6a', '#ffffff', '#c86aff'];
    for (let i = 0; i < 110; i++) {
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.beginPath();
      ctx.arc(w * (0.2 + g() * 0.6), h * (0.45 + g() * 0.45), 1.5 + g() * 2.5, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(w * 0.33, h * 0.27, w * 0.08, h * 0.05, -0.6, 0, PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#f2b0e8';
    ctx.lineWidth = w * 0.03;
    heart();
    ctx.stroke();
  }

  function pageTex(ctx, w, h) {
    ctx.fillStyle = '#f6f2e8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,150,200,0.45)';
    ctx.lineWidth = 1;
    for (let y = h * 0.12; y < h; y += h * 0.075) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const g = rand(93);
    ctx.strokeStyle = 'rgba(40,50,120,0.75)';
    ctx.lineWidth = 1.2;
    for (let y = h * 0.11; y < h * 0.8; y += h * 0.075) {
      let x = w * 0.08;
      ctx.beginPath();
      ctx.moveTo(x, y);
      while (x < w * (0.75 + g() * 0.2)) {
        const nx = x + 2 + g() * 4;
        ctx.lineTo(nx, y - g() * 4);
        x = nx;
        if (g() < 0.12) { x += 4; ctx.moveTo(x, y); }
      }
      ctx.stroke();
    }
  }

  function owlTex(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    const g = rand(94);
    for (let i = 0; i < 1400; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = g() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(200,198,190,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 5, y + 3 + g() * 4);
      ctx.stroke();
    }
    for (let i = 0; i < 420; i++) {
      const x = g() * w, y = h * 0.15 + g() * h * 0.85;
      ctx.fillStyle = `rgba(${30 + g() * 30},${30 + g() * 30},${34 + g() * 30},${0.7 + g() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 1.5 + g() * 3.5, 1 + g() * 2, (g() - 0.5) * 0.6, 0, PI * 2);
      ctx.fill();
    }
  }

  function kraftTex(ctx, w, h) {
    K.noiseTex('#b8925e', 95, 0.12, 0.5)(ctx, w, h);
    ctx.strokeStyle = 'rgba(90,60,30,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, h * 0.45);
    ctx.lineTo(w, h);
    ctx.stroke();
  }

  function bookTex(ctx, w, h) {
    ctx.fillStyle = '#e8eef4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a5a8a';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#2a3a5a';
    ctx.font = `bold ${Math.round(h * 0.11)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ЗЕЛЬЯ', w / 2, h * 0.3);
    ctx.font = `${Math.round(h * 0.07)}px Georgia, serif`;
    ctx.fillText('5 курс', w / 2, h * 0.44);
  }

  function slab(b, w, h, d, faces) {
    b.box(w, h, d, LIT, { faces });
  }

  function build(r) {
    const T = {
      fur: r.texture(256, furTex),
      heart: r.texture(128, heartTex, { clamp: true }),
      page: r.texture(128, pageTex),
      owl: r.texture(128, owlTex),
      kraft: r.texture(64, kraftTex),
      book: r.texture(128, bookTex, { clamp: true })
    };
    const part = (fn, tex, opts) => ({ mesh: mesh(r, fn), tex, opts: opts || {} });
    const diaryClosed = [
      part(b => {
        b.at(0, 0, 0.012, h => slab(h, 0.17, 0.22, 0.024));
      }, T.fur),
      part(b => {
        b.at(0.002, 0, 0.012, h => h.box(0.164, 0.214, 0.02, 0xf4f0e6));
      }),
      part(b => {
        b.quad([-0.07, -0.08, 0.0255], [0.07, -0.08, 0.0255], [0.07, 0.055, 0.0255], [-0.07, 0.055, 0.0255], [1, 1, 1, 0.25]);
      }, T.heart)
    ];
    const diaryOpen = [
      part(b => {
        [-1, 1].forEach(s => b.at(s * 0.088, 0, -0.006, h => slab(h, 0.17, 0.22, 0.014)));
      }, T.fur),
      part(b => {
        [-1, 1].forEach(s => {
          const x0 = s > 0 ? 0.004 : -0.172, x1 = s > 0 ? 0.172 : -0.004;
          b.quad([x0, -0.105, 0.004], [x1, -0.105, 0.004], [x1, 0.105, 0.004 + 0.006], [x0, 0.105, 0.004 + 0.006], LIT);
        });
      }, T.page)
    ];
    const letter = [
      part(b => {
        b.box(0.165, 0.112, 0.004, LIT);
      }, T.kraft),
      part(b => {
        b.quad([-0.082, 0.056, 0.0025], [0.082, 0.056, 0.0025], [0.0, 0.0, 0.0035], [0.0, 0.0, 0.0035], 0x9a7448);
        b.at(-0.01, 0.075, -0.001, h => h.box(0.13, 0.06, 0.002, 0xe8e2d4));
      })
    ];
    const book = [
      part(b => {
        b.box(0.17, 0.24, 0.025, LIT, { faces: { front: LIT, back: 0x3a5a8a, left: 0xf2eee4, right: 0x2a3a5a, top: 0xf2eee4, bottom: 0xf2eee4 } });
      }, T.book)
    ];
    const pencil = [part(b => {
      K.tube(b, [[0, -0.08, 0], [0, 0.08, 0]], [0.0045, 0.0045], 6, 0x3a9a4a);
      K.tube(b, [[0, 0.08, 0], [0, 0.098, 0]], [0.0045, 0.0006], 6, 0xd8b890);
    })];
    const owl = [
      part(b => {
        b.at(0, 0.0, 0, h => h.ellipsoid(0.13, 0.16, 0.12, 16, 12, LIT));
        b.at(0, 0.18, 0.012, h => h.ellipsoid(0.105, 0.09, 0.095, 14, 10, LIT));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.1, 0.0, -0.01), M4.rotZ(s * 0.25));
          b.ellipsoid(0.035, 0.11, 0.075, 8, 6, LIT);
          b.pop();
        });
      }, T.owl),
      part(b => {
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.036, 0.192, 0.113), M4.rotY(s * 0.32));
          K.discXY(b, 0, 0, 0, 0.016, 12, 0x101012);
          b.at(0.004, 0.005, 0.001, h => K.discXY(h, 0, 0, 0, 0.004, 6, [0.9, 0.9, 0.9, 0.6]));
          b.pop();
        });
        b.push(M4.translate(0, 0.168, 0.112), M4.rotX(0.5));
        b.prism(4, 0.009, 0.007, 0, 0.001, 0.001, 0.022, 0x2a2622, { capBottom: true });
        b.pop();
        [-1, 1].forEach(s => b.at(s * 0.03, -0.13, 0.05, h => h.ellipsoid(0.022, 0.014, 0.03, 6, 4, 0x3a3634)));
      })
    ];
    return { T, diaryClosed, diaryOpen, letter, book, pencil, owl };
  }

  function drawList(r, list, M, extra) {
    list.forEach(p => r.draw(p.mesh, M, Object.assign({}, p.opts, p.tex ? { texture: p.tex } : {}, extra || {})));
  }

  function handFrame(m, side) {
    return m['hand' + side];
  }

  function held(r, PR, h, m) {
    let base;
    if (h.hand === 'both') {
      const a = M4.point(m.handL, [0, -0.09, 0.03]), c = M4.point(m.handR, [0, -0.09, 0.03]);
      const mid = V3.lerp(a, c, 0.5);
      const x = V3.norm(V3.sub(a, c));
      const fwd = V3.norm([m.chest[8], m.chest[9], m.chest[10]]);
      let up = V3.norm(V3.cross(fwd, x));
      if (up[1] < 0) up = V3.mul(up, -1);
      const z = V3.norm(V3.cross(x, up));
      base = new Float32Array([x[0], x[1], x[2], 0, up[0], up[1], up[2], 0, z[0], z[1], z[2], 0, mid[0], mid[1], mid[2], 1]);
    } else {
      base = M4.chain(handFrame(m, h.hand), M4.translate(0, -0.1, 0.03));
    }
    const off = h.off || [0, 0, 0], rot = h.rot || [0, 0, 0];
    const M = M4.chain(base, M4.translate(off[0], off[1], off[2]), M4.rotY(rot[1]), M4.rotX(rot[0]), M4.rotZ(rot[2]));
    drawItem(r, PR, h.item, M);
  }

  function drawItem(r, PR, item, M) {
    if (item === 'diary') drawList(r, PR.diaryClosed, M);
    else if (item === 'diaryOpen') drawList(r, PR.diaryOpen, M);
    else if (item === 'letter') drawList(r, PR.letter, M);
    else if (item === 'book') drawList(r, PR.book, M);
    else if (item === 'pencil') drawList(r, PR.pencil, M);
    else if (item === 'owl') drawList(r, PR.owl, M);
  }

  function draw(r, PR, props) {
    (props || []).forEach(p => {
      const M = M4.chain(M4.translate(p.pos[0], p.pos[1], p.pos[2]), M4.rotY(p.rot ? p.rot[1] : 0), M4.rotX(p.rot ? p.rot[0] : 0), M4.rotZ(p.rot ? p.rot[2] : 0));
      drawItem(r, PR, p.item, M);
      if (p.item === 'owl' && p.letter) drawList(r, PR.letter, M4.chain(M, M4.translate(0.0, 0.11, 0.12), M4.rotX(-0.2), M4.rotZ(0.25)));
    });
  }

  window.HogwProps = { build, held, draw, drawItem };
})();
