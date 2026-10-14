(function (B) {
  'use strict';
  const MAGIC = 'BLENDER-v204';
  const TRANSIENT = new Set(['_edgeCache', 'disp', 'obmat', 'viewmat', 'winmat', 'persmat', 'viewinv', 'persinv', 'win', 'winx', 'winy', 'viewborder', 'camFrame', 'pixsize', 'ortho', 'pix', 'hdrBlock', 'winBlock', 'screen', 'dirty', 'fr', 'hdr', 'saved', 'stamp', 'listCache', 'runtime', 'dispKey']);

  function isID(v) { return v && typeof v === 'object' && typeof v.code === 'string' && v.code.length === 2 && typeof v.uid === 'number' && typeof v.name === 'string'; }

  function serializeValue(v, depth, top) {
    if (v == null || typeof v !== 'object') return typeof v === 'number' && !isFinite(v) ? null : v;
    if (isID(v) && !top) return { $ref: v.code + ':' + v.uid };
    if (depth > 40) return null;
    if (Array.isArray(v)) return v.map(x => serializeValue(x, depth + 1, false));
    if (ArrayBuffer.isView(v)) return Array.from(v);
    const out = {};
    for (const k of Object.keys(v)) {
      if ((TRANSIENT.has(k) && !(top && k === 'ortho')) || k[0] === '_' || typeof v[k] === 'function') continue;
      out[k] = serializeValue(v[k], depth + 1, false);
    }
    return out;
  }

  function serializeScreen(s) {
    const vi = new Map(s.verts.map((v, i) => [v, i]));
    return {
      name: s.name, w: s.w, h: s.h,
      verts: s.verts.map(v => [v.x, v.y]),
      areas: s.areas.map(a => ({ v: [vi.get(a.v1), vi.get(a.v2), vi.get(a.v3), vi.get(a.v4)], type: a.type, headertype: a.headertype, spaces: serializeValue(a.spaces, 0, false) })),
      scene: s.scene ? { $ref: 'SC:' + s.scene.uid } : null
    };
  }

  function serialize(ctx) {
    const main = ctx.main;
    const ids = {};
    Object.entries(B.LISTS).forEach(([code, key]) => {
      ids[code] = main[key].map(id => {
        const o = serializeValue(id, 0, true);
        if (code === 'IM') { o.src = id.src || null; }
        return o;
      });
    });
    const data = {
      version: 204,
      curscene: ctx.scene ? ctx.scene.uid : null,
      curScreen: main.screensUI ? main.screensUI.indexOf(ctx.screen) : 0,
      ids,
      screens: (main.screensUI || []).map(serializeScreen),
      uidCounter: main.uidCounter
    };
    return MAGIC + '\n' + JSON.stringify(data);
  }

  function parse(text) {
    if (typeof text !== 'string' || !text.startsWith(MAGIC)) return null;
    try { return JSON.parse(text.slice(MAGIC.length + 1)); } catch (e) { return null; }
  }

  function deserialize(text, w, h) {
    const data = parse(text);
    if (!data) return null;
    const main = new B.Main();
    const byRef = new Map();
    Object.entries(data.ids).forEach(([code, list]) => {
      const key = B.LISTS[code];
      if (!key) return;
      list.forEach(o => { main[key].push(o); byRef.set(code + ':' + o.uid, o); });
    });
    const resolve = v => {
      if (v == null || typeof v !== 'object') return v;
      if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = resolve(v[i]); return v; }
      if (v.$ref) return byRef.get(v.$ref) || null;
      for (const k of Object.keys(v)) v[k] = resolve(v[k]);
      return v;
    };
    Object.values(B.LISTS).forEach(key => main[key].forEach(id => { for (const k of Object.keys(id)) id[k] = resolve(id[k]); }));
    main.uidCounter = Math.max(data.uidCounter || 1, ...Object.values(B.LISTS).flatMap(k => main[k].map(i => i.uid + 1)), 1);
    main.objects.forEach(o => { if (!o.obmat) o.obmat = B.M.ident(); });
    main.images.forEach(im => { if (im.src) B.FileOps.decodeImage(im); });
    main.curscene = main.scenes.find(s => s.uid === data.curscene) || main.scenes[0];
    main.screensUI = (data.screens || []).map(sd => {
      const s = new B.Screen(sd.name, sd.w, sd.h);
      s.verts = sd.verts.map(([x, y]) => ({ x, y }));
      sd.areas.forEach(ad => {
        const a = new B.Area(s, s.verts[ad.v[0]], s.verts[ad.v[1]], s.verts[ad.v[2]], s.verts[ad.v[3]], ad.type);
        a.headertype = ad.headertype;
        a.spaces = resolve(ad.spaces || {});
        s.areas.push(a);
      });
      s.scene = resolve(sd.scene);
      s.resize(w, h);
      return s;
    });
    main.curScreenIndex = Math.max(0, data.curScreen || 0);
    return main;
  }

  const DEFAULT_DIR = ['My Computer', 'C:', 'My Documents'];

  function partsToPath(parts) {
    const p = parts[0] === 'My Computer' ? parts.slice(1) : parts;
    return p.length ? p.join('\\') + '\\' : '\\';
  }

  function pathToParts(path) {
    const s = String(path || '').replace(/\//g, '\\').replace(/^\/\//, '');
    const segs = s.split('\\').filter(Boolean);
    if (segs[0] === 'Desktop') return segs;
    if (!segs.length) return ['My Computer'];
    if (/^[A-Za-z]:$/.test(segs[0])) segs[0] = segs[0].toUpperCase();
    return ['My Computer', ...segs];
  }

  function vfs() { return typeof window !== 'undefined' ? window.vfs : null; }

  function writeVFS(parts, name, content, kind) {
    const fs = vfs();
    if (!fs) return false;
    const folder = fs.resolvePath(parts);
    if (!folder || !folder.children) return false;
    const node = { type: 'file', name, content };
    if (kind === 'blend') { node.icon = 'file-blend204'; node.app = 'blender204'; }
    else if (kind === 'image') { node.icon = 'file-bmp'; node.app = /\.(bmp|jpg|jpeg|png|gif)$/i.test(name) ? 'paint' : 'imaging'; }
    else { node.icon = 'file-txt'; node.app = 'notepad'; }
    folder.children[name] = node;
    fs.saveToStorage();
    const expWin = window.winManager && window.winManager.windows && window.winManager.windows.get('explorer');
    if (expWin && window.appExplorer && window.appExplorer.renderFolder) { try { window.appExplorer.renderFolder(expWin); } catch {} }
    if (folder === fs.root && window.desktop) window.desktop.renderIcons();
    return true;
  }

  function readVFS(parts, name) {
    const fs = vfs();
    if (!fs) return null;
    const folder = fs.resolvePath(parts);
    if (!folder || !folder.children) return null;
    const key = Object.keys(folder.children).find(k => k.toLowerCase() === String(name).toLowerCase());
    return key ? folder.children[key] : null;
  }

  function ensureDir(parts) {
    const fs = vfs();
    if (!fs) return false;
    let cur = [parts[0]];
    for (let i = 1; i < parts.length; i++) {
      const next = cur.concat(parts[i]);
      if (!fs.resolvePath(next)) fs.createFolder(cur, parts[i]);
      cur = next;
    }
    return !!fs.resolvePath(parts);
  }

  function splitFile(full) {
    const parts = pathToParts(full);
    const name = parts.pop();
    return { dir: parts, name };
  }

  function blendDirOf(ctx) {
    if (ctx.main.fileName) return splitFile(ctx.main.fileName).dir;
    return DEFAULT_DIR.slice();
  }

  function relPath(ctx, p) {
    if (String(p).startsWith('//')) return partsToPath(blendDirOf(ctx)) + String(p).slice(2).replace(/\//g, '\\');
    return p;
  }

  function setTitle(ctx) {
    if (typeof window !== 'undefined' && window.winManager && window.winManager.setTitle && window.winManager.windows.has('app_blender204')) {
      window.winManager.setTitle('app_blender204', ctx.main.fileName ? 'Blender [' + ctx.main.fileName + ']' : 'Blender');
    }
  }

  function loadMain(ctx, main, path) {
    ctx.exitEditMode(false);
    main.fileName = path;
    ctx.setMain(main);
    ctx.G.rendered = null;
    if (ctx.G.playing) ctx.G.playing.stop();
    setTitle(ctx);
    rememberRecent(path);
  }

  function parseVideoscape(text) {
    const tok = String(text).split(/\s+/).filter(Boolean);
    if (tok[0] !== '3DG1') return null;
    const n = parseInt(tok[1], 10);
    if (!(n > 0) || tok.length < 2 + n * 3) return null;
    let i = 2;
    const verts = [];
    for (let k = 0; k < n; k++, i += 3) verts.push({ co: [+tok[i] || 0, +tok[i + 1] || 0, +tok[i + 2] || 0], sel: false, hide: false });
    const faces = [];
    while (i < tok.length) {
      const c = parseInt(tok[i++], 10);
      if (!(c > 0) || i + c > tok.length) break;
      const v = tok.slice(i, i + c).map(Number);
      i += c + 1;
      if (!v.every(x => Number.isInteger(x) && x >= 0 && x < n)) continue;
      if (c <= 4) faces.push({ v, mat: 0, smooth: false });
      else for (let k = 1; k < c - 1; k++) faces.push({ v: [v[0], v[k], v[k + 1]], mat: 0, smooth: false });
    }
    return { verts, faces };
  }

  function importVideoscape(ctx, mesh, name) {
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    const base = name.replace(/\.[^.]*$/, '') || 'Mesh';
    const me = B.Data.newMesh(ctx.main, base);
    me.verts = mesh.verts;
    me.faces = mesh.faces;
    const ob = B.ObjectOps.addObject(ctx, 'mesh', base, me);
    ob.loc = [0, 0, 0];
    B.Data.whereIs(ob);
    ctx.redrawAll();
    return ob;
  }

  function rememberRecent(path) {
    try { localStorage.setItem('b204_last_file', path); } catch {}
  }

  function lastFile() { try { return localStorage.getItem('b204_last_file'); } catch (e) { return null; } }

  const FileOps = {
    MAGIC, serialize, deserialize, parse, parseVideoscape, partsToPath, pathToParts, writeVFS, readVFS, ensureDir, splitFile, relPath, DEFAULT_DIR,

    loadParts(ctx, dir, name) { return FileOps.loadPath(ctx, partsToPath(dir) + name); },

    loadPath(ctx, path) {
      const { dir, name } = splitFile(path);
      const node = readVFS(dir, name);
      if (!node) { B.UI.error(ctx, "Can't find file"); return false; }
      const main = deserialize(node.content, ctx.raster.w, ctx.raster.h);
      if (!main) {
        const vs = parseVideoscape(node.content);
        if (vs) { importVideoscape(ctx, vs, name); return true; }
        B.UI.error(ctx, 'Not a Blender file: ' + name);
        return false;
      }
      loadMain(ctx, main, partsToPath(dir) + name);
      return true;
    },

    savePath(ctx, path) {
      const { dir, name } = splitFile(path);
      if (!/\.blend$/i.test(name)) return FileOps.savePath(ctx, partsToPath(dir) + name + '.blend');
      const save = () => {
        if (ctx.G.obedit) B.Edit.exit(ctx, true);
        const versions = ctx.prefs.versions || 0;
        const old = readVFS(dir, name);
        if (old && versions > 0) {
          for (let i = versions; i > 1; i--) {
            const prev = readVFS(dir, name + (i - 1));
            if (prev) writeVFS(dir, name + i, prev.content, 'blend');
          }
          writeVFS(dir, name + '1', old.content, 'blend');
        }
        ctx.main.fileName = partsToPath(dir) + name;
        const ok = writeVFS(dir, name, serialize(ctx), 'blend');
        if (!ok) { B.UI.error(ctx, "Can't write file"); return; }
        setTitle(ctx);
        rememberRecent(ctx.main.fileName);
        ctx.redrawAll();
      };
      if (readVFS(dir, name) && ctx.main.fileName !== partsToPath(dir) + name) B.UI.okee(ctx, 'SAVE OVER ' + name).then(ok => { if (ok) save(); });
      else save();
      return true;
    },

    open(ctx) { B.FileSpace.start(ctx, { title: 'LOAD FILE', mode: 'load', filter: /\.(blend|obj)$/i, dir: blendDirOf(ctx), onOk: p => FileOps.loadPath(ctx, p) }); },
    saveAs(ctx) { B.FileSpace.start(ctx, { title: 'SAVE FILE', mode: 'save', filter: /\.blend\d*$/i, dir: blendDirOf(ctx), file: ctx.main.fileName ? splitFile(ctx.main.fileName).name : 'untitled.blend', onOk: p => FileOps.savePath(ctx, p) }); },
    save(ctx) { if (ctx.main.fileName) FileOps.savePath(ctx, ctx.main.fileName); else FileOps.saveAs(ctx); },
    reopen(ctx) { const p = lastFile(); if (!p) { B.UI.error(ctx, 'No file'); return; } B.UI.okee(ctx, 'Open file: ' + p).then(ok => { if (ok) FileOps.loadPath(ctx, p); }); },
    eraseAll(ctx) { B.UI.okee(ctx, 'ERASE ALL').then(ok => { if (!ok) return; ctx.newFile(false); ctx.main.fileName = ''; setTitle(ctx); }); },
    append(ctx) { B.FileSpace.start(ctx, { title: 'LOAD LIBRARY', mode: 'append', filter: /\.blend$/i, dir: blendDirOf(ctx), onOk: (p, items) => FileOps.appendItems(ctx, p, items) }); },

    appendItems(ctx, libPath, items) {
      const { dir, name } = splitFile(libPath);
      const node = readVFS(dir, name);
      if (!node) return;
      const lib = deserialize(node.content, ctx.raster.w, ctx.raster.h);
      if (!lib) return;
      const main = ctx.main;
      const done = new Map();
      const take = id => {
        if (!id || done.has(id)) return done.get(id);
        const key = B.LISTS[id.code];
        id.name = main.uniqueName(id.code, id.name);
        id.uid = main.uidCounter++;
        main[key].push(id);
        done.set(id, id);
        for (const k of Object.keys(id)) {
          const v = id[k];
          if (isID(v)) take(v);
          else if (Array.isArray(v)) v.forEach(x => { if (isID(x)) take(x); else if (x && typeof x === 'object') Object.values(x).forEach(y => { if (isID(y)) take(y); }); });
        }
        return id;
      };
      (items || []).forEach(({ code, name: nm }) => {
        const src = lib[B.LISTS[code]].find(i => i.name === nm);
        if (!src) return;
        const id = take(src);
        if (code === 'OB') {
          ctx.scene.bases.forEach(b => { b.sel = false; });
          const base = { object: B.Data.idUser(id), sel: true };
          id.lay = ctx.scene.lay & -ctx.scene.lay || 1;
          ctx.scene.bases.push(base);
          ctx.scene.basact = base;
        }
      });
      ctx.redrawAll();
    },

    libContents(libPath) {
      const { dir, name } = splitFile(libPath);
      const node = readVFS(dir, name);
      const data = node && parse(node.content);
      if (!data) return null;
      const out = {};
      Object.entries(data.ids).forEach(([code, list]) => { if (list.length && code !== 'SR') out[code] = list.map(i => i.name); });
      return out;
    },

    saveImage(ctx) {
      if (!ctx.G.rendered) { B.UI.error(ctx, 'No image rendered'); return; }
      const r = ctx.scene.r;
      const ext = { targa: '.tga', tgaraw: '.tga', iris: '.rgb', jpeg: '.jpg', hamx: '.ham', ftype: '.tga', avi_raw: '.avi', avi_jpg: '.avi' }[r.imtype] || '.tga';
      const titles = { targa: 'SAVE TARGA', tgaraw: 'SAVE RAW TARGA', iris: 'SAVE IRIS', jpeg: 'SAVE JPEG', hamx: 'SAVE HAMX', ftype: 'SAVE FTYPE' };
      const dir = pathToParts(relPath(ctx, r.pic.replace(/[^\\/]*$/, '') || '//'));
      ensureDir(dir);
      B.FileSpace.start(ctx, { title: titles[r.imtype] || 'SAVE IMAGE', mode: 'save', filter: /\.(tga|jpg|png|bmp|rgb)$/i, dir, file: 'untitled' + ext, onOk: p => FileOps.writeImage(ctx, p, ctx.G.rendered) });
    },

    imageDataURL(im, jpeg, quality) {
      if (typeof document === 'undefined') return '';
      const c = B.Render.imageToCanvas(im);
      return jpeg ? c.toDataURL('image/jpeg', (quality || 90) / 100) : c.toDataURL('image/png');
    },

    writeImage(ctx, path, im) {
      const { dir, name } = splitFile(path);
      ensureDir(dir);
      const jpeg = ctx.scene.r.imtype === 'jpeg' || /\.jpe?g$/i.test(name);
      writeVFS(dir, name, FileOps.imageDataURL(im, jpeg, ctx.scene.r.quality), 'image');
    },

    writeAnimFrame(ctx, im, frame) {
      const r = ctx.scene.r;
      const base = relPath(ctx, r.pic || '//render/');
      const { dir, name } = splitFile(base);
      ensureDir(dir);
      const fname = (name || '') + String(frame).padStart(4, '0') + (r.mode.extensions ? (r.imtype === 'jpeg' ? '.jpg' : '.tga') : '');
      const url = FileOps.imageDataURL(im, true, Math.min(r.quality, 75));
      if (url.length * (r.efra - r.sfra + 1) > 3500000 && frame - r.sfra > 4) return;
      writeVFS(dir, fname, url, 'image');
    },

    selectRenderDir(ctx) {
      const r = ctx.scene.r;
      B.FileSpace.start(ctx, { title: 'SELECT OUTPUT PICTURES', mode: 'save', dir: pathToParts(relPath(ctx, r.pic.replace(/[^\\/]*$/, '') || '//')), file: '', onOk: p => { r.pic = p; ctx.redrawAll(); } });
    },

    selectImageFor(ctx, cb) {
      B.FileSpace.start(ctx, { title: 'SELECT IMAGE', mode: 'load', filter: /\.(bmp|jpg|jpeg|png|gif|tga)$/i, dir: ['My Computer', 'C:', 'My Documents'], onOk: p => cb(p) });
    },

    decodeImage(im, done) {
      if (typeof Image === 'undefined' || !im.src) return;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, img.width, img.height);
        im.pix = { w: img.width, h: img.height, buf: new Uint32Array(d.data.buffer.slice(0)), flipY: false };
        im.w = img.width; im.h = img.height;
        if (done) done(im);
      };
      img.onerror = () => { im.pix = null; };
      img.src = im.src;
    },

    imageFromPath(ctx, path, done) {
      const { dir, name } = splitFile(path);
      const node = readVFS(dir, name);
      if (!node || typeof node.content !== 'string') { B.UI.error(ctx, "can't find image"); return null; }
      let im = ctx.main.images.find(i => i.path === path);
      if (!im) im = ctx.main.add('IM', name, { path, src: node.content, pix: null });
      im.src = node.content;
      FileOps.decodeImage(im, () => { if (done) done(im); ctx.redrawAll(); });
      return im;
    },

    loadTextureImage(ctx, tex) {
      FileOps.selectImageFor(ctx, p => {
        const im = FileOps.imageFromPath(ctx, p);
        if (im) { if (tex.image) tex.image.us--; tex.image = B.Data.idUser(im); }
        ctx.redrawAll();
      });
    },

    reloadImage(ctx, tex) { if (tex.image && tex.image.path) FileOps.imageFromPath(ctx, tex.image.path); },

    saveUserDefaults(ctx) {
      B.UI.okee(ctx, 'SAVE USER DEFAULTS').then(ok => {
        if (!ok) return;
        try {
          localStorage.setItem('b204_userdef', serialize(ctx));
          localStorage.setItem('b204_prefs', JSON.stringify(ctx.prefs));
        } catch (e) { B.UI.error(ctx, "Can't write ~/.B.blend"); }
      });
    },

    loadTemp(ctx) {
      let t = null;
      try { t = localStorage.getItem('b204_autosave'); } catch {}
      if (!t) { B.UI.error(ctx, 'No file'); return; }
      const main = deserialize(t, ctx.raster.w, ctx.raster.h);
      if (main) loadMain(ctx, main, '');
    },

    textExport(ctx, kind) {
      const lines = [];
      const meshes = ctx.scene.bases.filter(b => b.sel && b.object.type === 'mesh').map(b => b.object);
      if (!meshes.length) { B.UI.error(ctx, 'No mesh selected'); return null; }
      if (kind === 'vrml') {
        lines.push('#VRML V1.0 ascii', '', 'Separator {');
        meshes.forEach(ob => {
          B.Data.whereIs(ob);
          lines.push(`  DEF ${ob.name} Separator {`, '    Coordinate3 { point [');
          ob.data.verts.forEach(v => { const p = B.M.loc(ob.obmat, v.co); lines.push(`      ${p.map(x => x.toFixed(5)).join(' ')},`); });
          lines.push('    ] }', '    IndexedFaceSet { coordIndex [');
          ob.data.faces.filter(f => f.v.length > 2).forEach(f => lines.push(`      ${f.v.join(', ')}, -1,`));
          lines.push('    ] }', '  }');
        });
        lines.push('}');
      } else if (kind === 'dxf') {
        lines.push('0', 'SECTION', '2', 'ENTITIES');
        meshes.forEach(ob => {
          B.Data.whereIs(ob);
          ob.data.faces.filter(f => f.v.length > 2).forEach(f => {
            const p = f.v.map(i => B.M.loc(ob.obmat, ob.data.verts[i].co));
            while (p.length < 4) p.push(p[p.length - 1]);
            lines.push('0', '3DFACE', '8', ob.name);
            p.forEach((q, j) => lines.push(String(10 + j), q[0].toFixed(5), String(20 + j), q[1].toFixed(5), String(30 + j), q[2].toFixed(5)));
          });
        });
        lines.push('0', 'ENDSEC', '0', 'EOF');
      } else {
        const ob = meshes[0];
        B.Data.whereIs(ob);
        lines.push('3DG1', String(ob.data.verts.length));
        ob.data.verts.forEach(v => { const p = B.M.loc(ob.obmat, v.co); lines.push(p.map(x => x.toFixed(5)).join(' ')); });
        ob.data.faces.filter(f => f.v.length > 2).forEach(f => lines.push(`${f.v.length} ${f.v.join(' ')} 0x${'cccccc'}`));
      }
      return lines.join('\r\n');
    },

    exportText(ctx, kind, title, ext) {
      const txt = FileOps.textExport(ctx, kind);
      if (txt == null) return;
      const base = ctx.main.fileName ? splitFile(ctx.main.fileName).name.replace(/\.blend$/i, '') : 'untitled';
      B.FileSpace.start(ctx, { title, mode: 'save', dir: blendDirOf(ctx), file: base + ext, onOk: p => { const { dir, name } = splitFile(p); writeVFS(dir, name, txt, 'text'); } });
    },
    saveVRML(ctx) { FileOps.exportText(ctx, 'vrml', 'SAVE VRML', '.wrl'); },
    saveDXF(ctx) { FileOps.exportText(ctx, 'dxf', 'SAVE DXF', '.dxf'); },
    saveVideoscape(ctx) { FileOps.exportText(ctx, 'videoscape', 'SAVE VIDEOSCAPE', '.obj'); },

    packAll(ctx) {
      ctx.main.images.forEach(im => { im.packed = true; });
      B.UI.notice(ctx, 'Packed ' + ctx.main.images.length + ' file(s)');
    },
    unpackAll(ctx) {
      const n = ctx.main.images.filter(im => im.packed).length;
      if (!n) { B.UI.error(ctx, 'No packed files. Autopack disabled'); return; }
      ctx.main.images.forEach(im => { if (im.packed && im.src) { const { dir, name } = splitFile(im.path || ('C:\\My Documents\\' + im.name)); ensureDir(dir); writeVFS(dir, name, im.src, 'image'); im.packed = false; } });
      B.UI.notice(ctx, 'Unpacked ' + n + ' file(s)');
    },
    advancedUnpack(ctx) {
      const n = ctx.main.images.filter(im => im.packed).length;
      if (!n) { B.UI.error(ctx, 'No packed files. Autopack disabled'); return; }
      B.UI.pupmenu(ctx, `Unpack ${n} files%t|Use files in current directory (create when necessary)%x1|Write files to current directory (overwrite existing files)%x2|%l|Use files in original location (create when necessary)%x3|Write files to original location (overwrite existing files)%x4|%l|Disable AutoPack, keep all packed files %x5`).then(v => { if (v > 0 && v < 5) FileOps.unpackAll(ctx); });
    }
  };

  B.userDefaultFile = function () {
    try {
      const t = localStorage.getItem('b204_userdef');
      if (!t) return null;
      const main = deserialize(t, 1000, 700);
      if (main) main.fileName = '';
      return main;
    } catch (e) { return null; }
  };

  B.loadPrefs = function () { try { return JSON.parse(localStorage.getItem('b204_prefs') || '{}'); } catch (e) { return {}; } };
  B.savePrefs = function (p) { try { localStorage.setItem('b204_prefs', JSON.stringify(p)); } catch {} };

  B.FileOps = FileOps;
})(globalThis.B204 = globalThis.B204 || {});
