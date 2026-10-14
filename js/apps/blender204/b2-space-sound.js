(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  function init() { return { sound: null, x1: -0.1, x2: 2 }; }

  function decode(ctx, so) {
    if (so.buffer || so.loading || typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !so.src) return;
    so.loading = true;
    const ac = B.audioCtx || (B.audioCtx = new AC());
    fetch(so.src).then(r => r.arrayBuffer()).then(buf => ac.decodeAudioData(buf)).then(ab => {
      so.buffer = ab;
      so.rate = ab.sampleRate; so.channels = ab.numberOfChannels; so.duration = ab.duration;
      const d = ab.getChannelData(0);
      const n = 2000;
      so.peaks = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let mx = 0;
        const a = Math.floor(i / n * d.length), b = Math.floor((i + 1) / n * d.length);
        for (let k = a; k < b; k += 4) mx = Math.max(mx, Math.abs(d[k]));
        so.peaks[i] = mx;
      }
      so.loading = false;
      ctx.redrawAll();
    }).catch(() => { so.loading = false; so.error = true; ctx.redrawAll(); });
  }

  function cur(ctx, sp) { if (sp.sound && ctx.main.sounds.includes(sp.sound)) return sp.sound; sp.sound = ctx.main.sounds[0] || null; return sp.sound; }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(160, 160, 160));
    const fps = ctx.scene.r.frs_sec || 25;
    const so = cur(ctx, sp);
    const tx = t => w.x1 + (t - sp.x1) / (sp.x2 - sp.x1) * area.winx;
    for (let t = Math.ceil(sp.x1 / 0.08) * 0.08; t <= sp.x2; t += 0.08) {
      const x = Math.round(tx(t));
      r.vline(x, w.y1 + 16, w.y2, rgb(150, 150, 150));
    }
    r.rect(w.x1, w.y1, w.x2 + 1, w.y1 + 14, rgb(170, 140, 140));
    for (let t = Math.ceil(sp.x1 / 0.08) * 0.08; t <= sp.x2; t += 0.16) r.text('helv8', t.toFixed(2), Math.round(tx(t)) - 8, w.y1 + 4, rgb(0, 0, 0));
    if (so) {
      decode(ctx, so);
      if (so.peaks && so.duration) {
        const mid = (w.y1 + 16 + w.y2) / 2, hh = (w.y2 - w.y1 - 20) / 2;
        for (let x = w.x1; x <= w.x2; x++) {
          const t = sp.x1 + (x - w.x1) / area.winx * (sp.x2 - sp.x1);
          if (t < 0 || t > so.duration) continue;
          const p = so.peaks[Math.min(so.peaks.length - 1, Math.floor(t / so.duration * so.peaks.length))];
          r.vline(x, Math.round(mid - p * hh), Math.round(mid + p * hh), rgb(40, 40, 40));
        }
      } else r.text('helv12', so.error ? 'Error reading ' + so.name : 'Loading ' + so.name + '...', w.x1 + 20, w.y2 - 30, rgb(0, 0, 0));
    }
    const t = (ctx.scene.cfra - 1) / fps;
    const x = Math.round(tx(t));
    r.vline(x, w.y1, w.y2, rgb(96, 192, 64));
    r.vline(Math.round(tx(0)), w.y1, w.y2, rgb(0, 0, 0));
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => { const so = cur(ctx, sp); sp.x1 = -0.1; sp.x2 = so && so.duration ? so.duration + 0.1 : 2; ctx.redraw(area); }, 'Home (HOMEKEY)');
    let x = 100;
    blk.col = blk.headerActive ? COL.PURPLE : COL.GREY;
    x = B.Buts.idBrowse(ctx, blk, x, 'SO', { get: () => cur(ctx, sp), set: s => { sp.sound = s; } });
    blk.but('Load', x, 0, 50, 22, () => loadSound(ctx, area), 'Load Sound (wav file)').col = COL.SALMON;
    const so = cur(ctx, sp);
    if (so && so.buffer) blk.label(`WAV: ${Math.round(so.rate / 1000)} kHz  ${so.channels > 1 ? 'Stereo' : 'Mono'}  16 bits`, x + 60, 1, 260, 20);
  }

  function loadSound(ctx, area) {
    B.FileSpace.start(ctx, {
      title: 'SELECT WAV FILE', mode: 'load', filter: /\.(wav|mp3|mid)$/i, dir: ['My Computer', 'C:', 'My Documents'],
      onOk: p => {
        const { dir, name } = B.FileOps.splitFile(p);
        const node = B.FileOps.readVFS(dir, name);
        if (!node) { B.UI.error(ctx, "Can't find file"); return; }
        const so = ctx.main.add('SO', name, { path: p, src: typeof node.content === 'string' ? node.content : node.src || node.url || '' });
        const a = ctx.screen.areas.find(x => x.type === 'sound') || area;
        a.space.sound = so;
        ctx.redrawAll();
      }
    });
  }

  function play(ctx, so, volume) {
    if (!so || !so.buffer || !B.audioCtx) return;
    const ac = B.audioCtx;
    const src = ac.createBufferSource();
    src.buffer = so.buffer;
    const g = ac.createGain();
    g.gain.value = volume == null ? 1 : volume;
    src.connect(g).connect(ac.destination);
    src.start();
    return src;
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      if (ev.button === 0) {
        const fps = ctx.scene.r.frs_sec || 25;
        const setf = e => { const t = sp.x1 + (e.x - area.win.x1) / area.winx * (sp.x2 - sp.x1); ctx.scene.cfra = Math.max(1, Math.round(t * fps) + 1); B.Anim.setFrame(ctx, ctx.scene.cfra); };
        setf(ev);
        ctx.modal = { move: e => { setf(e); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 1) {
        const sx = ev.x, s0 = { x1: sp.x1, x2: sp.x2 };
        ctx.modal = { move: e => { const d = (e.x - sx) / area.winx * (s0.x2 - s0.x1); if (ev.ctrl) { const f = Math.exp(-(e.x - sx) * 0.01); const c = (s0.x1 + s0.x2) / 2; sp.x1 = c - (c - s0.x1) * f; sp.x2 = c + (s0.x2 - c) * f; } else { sp.x1 = s0.x1 - d; sp.x2 = s0.x2 - d; } ctx.redraw(area); return false; }, up: () => true };
        return true;
      }
    }
    if (ev.type === 'key' && ev.key === 'SPACE') { play(ctx, cur(ctx, sp)); return true; }
    return false;
  }

  B.Sound = { play, decode };
  B.SPACES.sound = { name: 'Sound', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
