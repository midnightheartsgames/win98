(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  const LISTS = {
    SC: 'scenes', OB: 'objects', ME: 'meshes', CA: 'cameras', LA: 'lamps', MA: 'materials', TE: 'textures',
    WO: 'worlds', IP: 'ipos', TX: 'texts', IM: 'images', CU: 'curves', MB: 'mballs', LT: 'lattices', SO: 'sounds', SR: 'screens', IK: 'ikas', KE: 'keys', VF: 'vfonts'
  };

  const OB_FLAGS = { SEL: 1 };

  class Main {
    constructor() {
      Object.values(LISTS).forEach(k => { this[k] = []; });
      this.fileName = '';
      this.uidCounter = 1;
    }

    list(code) { return this[LISTS[code]]; }

    uniqueName(code, base) {
      const list = this.list(code);
      base = String(base || code).slice(0, 19);
      if (!list.some(id => id.name === base)) return base;
      const stem = base.replace(/\.\d{3}$/, '');
      for (let i = 1; i < 1000; i++) {
        const n = stem + '.' + String(i).padStart(3, '0');
        if (!list.some(id => id.name === n)) return n;
      }
      return stem + '.' + Date.now();
    }

    add(code, name, fields) {
      const id = Object.assign({ code, name: this.uniqueName(code, name), us: 0, uid: this.uidCounter++ }, fields || {});
      this.list(code).push(id);
      return id;
    }

    rename(id, name) {
      name = String(name).slice(0, 19) || id.name;
      if (name === id.name) return;
      id.name = '';
      id.name = this.uniqueName(id.code, name);
    }

    remove(id) {
      const list = this.list(id.code);
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1);
    }

    users(id) {
      let n = 0;
      const ref = x => { if (x === id) n++; };
      this.objects.forEach(o => { ref(o.data); ref(o.ipo); (o.mats || []).forEach(ref); });
      [...this.meshes, ...this.curves, ...this.mballs].forEach(d => (d.mats || []).forEach(ref));
      this.materials.forEach(m => { (m.mtex || []).forEach(t => t && ref(t.tex)); ref(m.ipo); });
      this.lamps.forEach(l => { (l.mtex || []).forEach(t => t && ref(t.tex)); ref(l.ipo); });
      this.worlds.forEach(w => { (w.mtex || []).forEach(t => t && ref(t.tex)); ref(w.ipo); });
      this.textures.forEach(t => ref(t.image));
      this.scenes.forEach(s => { ref(s.world); ref(s.set); s.bases.forEach(b => ref(b.object)); });
      this.cameras.forEach(c => ref(c.ipo));
      return n;
    }
  }

  function defaultRender() {
    return {
      xsch: 320, ysch: 256, xasp: 1, yasp: 1, size: 100, osa: 8, mode: { shadow: false, osa: false, mblur: false, panorama: false, fields: false, odd: false, notimediff: false, edge: false, edgeShift: false, edgeAll: false, border: false, gamma: true, extensions: false, crop: false, unified: false, backbuf: false, ftype: false },
      alphamode: 'sky', winpos: 4, rt: 0, framapto: 4,
      xparts: 1, yparts: 1, blurfac: 0.5, edgeint: 0, edgeR: 0, edgeG: 0, edgeB: 0, sfra: 1, efra: 250, frs_sec: 25,
      imtype: 'targa', planes: 'rgb', quality: 95, pic: '//render/', backbuf: '//', ftype: '//', dispwin: true, border: [0, 0, 1, 1], doSequence: false, maplen: 100, mapnew: 100
    };
  }

  function newScene(main, name) {
    return main.add('SC', name, {
      bases: [], camera: null, world: null, set: null, lay: 1, layact: 1, cfra: 1, cursor: [0, 0, 0],
      r: defaultRender(), basact: null, ed: { seqs: [] }, radio: null, scriptlinks: []
    });
  }

  function newMesh(main, name) {
    return main.add('ME', name, { verts: [], faces: [], mats: [], flag: { autosmooth: false, twoside: true, noPunoFlip: false }, smoothresh: 30, texspace: null, autotex: true, subdiv: 4, smesh: false, sticky: null, vcols: null, tfaces: null, key: null });
  }

  function newCamera(main, name) {
    return main.add('CA', name, { lens: 35, clipsta: 0.1, clipend: 100, drawsize: 0.5, ortho: false, showlimits: false, showmist: false, ipo: null, hold1: 0, hold2: 0 });
  }

  function newLamp(main, name) {
    return main.add('LA', name, {
      type: 'lamp', r: 1, g: 1, b: 1, energy: 1, dist: 20, spotsize: 45, spotblend: 0.15, haint: 1, quad1: 0, quad2: 1,
      mode: { shadow: true, halo: false, layer: false, quad: false, negative: false, onlyshadow: false, sphere: false, square: false },
      bufsize: 512, clipsta: 0.5, clipend: 40, samp: 3, bias: 1, soft: 3, buffers: 1, haloStep: 0, mtex: new Array(6).fill(null), texact: 0, ipo: null
    });
  }

  function newMaterial(main, name) {
    return main.add('MA', name, {
      r: 0.8, g: 0.8, b: 0.8, specr: 1, specg: 1, specb: 1, mirr: 1, mirg: 1, mirb: 1, ambr: 0, ambg: 0, ambb: 0,
      ref: 0.8, alpha: 1, emit: 0, amb: 0.5, spec: 0.5, hard: 50, spectra: 0, zoffs: 0, add: 0, fresnel: 0,
      mode: { traceable: true, shadow: true, shadeless: false, wire: false, vcolLight: false, vcolPaint: false, halo: false, ztransp: false, zinvert: false, env: false, onlyshadow: false, nomist: false, texface: false },
      halo: { size: 0.5, hard: 50, add: 0, rings: 4, lines: 12, star: 4, seed: 0, flaresize: 1, subsize: 1, flareboost: 1, flareseed: 0, flares: 1, flags: { flare: false, rings: false, lines: false, star: false, halotex: false, halopuno: false, xalpha: false, shaded: false } },
      colormodel: 'RGB', rgbsel: 0, mtex: new Array(8).fill(null), texact: 0, ipo: null, fhfrict: 0, fhforce: 0, fhdamp: 0, fhdist: 0, reflect: 0, dyn: false
    });
  }

  function newMTex(tex) {
    return { tex, texco: 'orco', mapto: { col: true, nor: false, csp: false, cmir: false, ref: false, spec: false, hard: false, alpha: false, emit: false }, blendtype: 'mix', r: 1, g: 0, b: 1, def_var: 1, colfac: 1, norfac: 0.5, varfac: 1, ofs: [0, 0, 0], size: [1, 1, 1], proj: [1, 2, 3], mapping: 'flat', stencil: false, neg: false, noRGB: false, object: null };
  }

  function newTexture(main, name) {
    return main.add('TE', name, {
      type: 'none', stype: 0, noisesize: 0.25, noisedepth: 2, noisetype: 'soft', turbul: 5, bright: 1, contrast: 1,
      rfac: 1, gfac: 1, bfac: 1, image: null, extend: 'repeat', xrepeat: 1, yrepeat: 1, crop: [0, 0, 1, 1], imaflag: { interpol: true, usealpha: false, calcalpha: false, negalpha: false, mipmap: true, fields: false, rot90: false, movie: false, anti: false },
      colorband: null, useColorband: false, flipXY: false, frames: 0, offset: 0, fie_ima: 2, sfra: 1, len: 0, cyclic: false, filtersize: 1, ipo: null
    });
  }

  function newWorld(main, name) {
    return main.add('WO', name, {
      horr: 0.05, horg: 0.22, horb: 0.4, zenr: 0.1, zeng: 0.1, zenb: 0.4, ambr: 0, ambg: 0, ambb: 0, exposure: 1, grav: 9.8,
      skytype: { blend: false, real: false, paper: false }, mist: { on: false, type: 'quad', sta: 0, dist: 0, height: 0, intensity: 0 },
      stars: { on: false, size: 2, mindist: 0, dist: 15, colnoise: 0 }, mtex: new Array(6).fill(null), texact: 0, ipo: null
    });
  }

  function newIpo(main, name, blocktype) {
    return main.add('IP', name, { blocktype, curves: [], showkey: false });
  }

  function newText(main, name) {
    return main.add('TX', name, { lines: [''], curl: 0, curc: 0, sell: 0, selc: 0, top: 0, filename: '' });
  }

  function newObject(main, type, name, data) {
    const ob = main.add('OB', name, {
      type, data, loc: [0, 0, 0], rot: [0, 0, 0], size: [1, 1, 1], dloc: [0, 0, 0], drot: [0, 0, 0], dsize: [0, 0, 0],
      parent: null, parentInv: M.ident(), partype: 'object', par1: 0, track: null, ipo: null, lay: 1, colbits: 0, mats: [], actcol: 0,
      dt: ['mesh', 'curve', 'surf', 'font', 'mball'].includes(type) ? 'shaded' : 'wire', dtx: { bounds: false, axis: false, texspace: false, name: false }, boundtype: 'box',
      sf: 0, ctime: 0, timeoffs: 0, transflag: { dupliframes: false, dupliverts: false, duplirot: false, nospeed: false, powertrack: false, autotime: false },
      dupsta: 1, dupend: 100, dupon: 1, dupoff: 0, trackflag: 'Y', upflag: 'Z', ipoflag: { drawkey: false, drawkeysel: false, offsOb: false, offsPar: false, offsParti: false },
      effects: [], gameflag: { sector: false, prop: false, actor: false, dynamic: false, mainactor: false, doFh: false, rotFh: false }, mass: 1, inertia: 1, damping: 0.04, rdamping: 0.1,
      props: [], sensors: [], controllers: [], actuators: [], scriptlinks: [], obmat: M.ident()
    });
    return ob;
  }

  function idUser(id) { if (id) id.us = (id.us || 0) + 1; return id; }

  function obMatrixLocal(ob) {
    const loc = V.add(ob.loc, ob.dloc), rot = V.add(ob.rot, ob.drot), size = V.add(ob.size, ob.dsize);
    return M.mul(M.translate(loc), M.mul(M.eul(rot), M.scale(size)));
  }

  function whereIs(ob, depth = 0) {
    let mat = obMatrixLocal(ob);
    if (ob.parent && depth < 64) {
      const pm = whereIs(ob.parent, depth + 1);
      let par = pm;
      if (ob.partype === 'vertex' && ob.parent.type === 'mesh' && ob.parent.data.verts[ob.par1]) {
        par = M.translate(M.loc(pm, ob.parent.data.verts[ob.par1].co));
      } else if (ob.partype === 'limb' && ob.parent.type === 'ika' && B.Ika) {
        par = M.mul(pm, B.Ika.limbMatrix(ob.parent.data, ob.par1));
      } else if (ob.parent.type === 'curve' && ob.parent.data.flag && ob.parent.data.flag.path && B.Curve && B.curFrame != null) {
        const cu = ob.parent.data;
        const t = (((B.curFrame - 1 - (ob.sf || 0)) / (cu.pathlen || 100)) % 1 + 1) % 1;
        const pp = B.Curve.pathPoint(cu, t);
        if (pp) {
          let off = M.translate(pp.pos);
          if (cu.flag.follow) {
            const d = pp.dir, up = [0, 0, 1];
            let side = V.norm(V.cross(up, d));
            if (V.len(side) < 0.5) side = [1, 0, 0];
            const u2 = V.cross(d, side);
            off = M.mul(off, [d[0], d[1], d[2], 0, -side[0], -side[1], -side[2], 0, u2[0], u2[1], u2[2], 0, 0, 0, 0, 1]);
          }
          par = M.mul(pm, off);
        }
      }
      mat = M.mul(par, M.mul(ob.parentInv, mat));
    }
    if (ob.track && ob.track !== ob && depth < 64) {
      const tm = whereIs(ob.track, depth + 1);
      const from = [mat[12], mat[13], mat[14]], to = [tm[12], tm[13], tm[14]];
      const dir = V.norm(V.sub(to, from));
      if (V.len(dir) > 0) {
        const sc = M.colScale(mat);
        const ax = trackAxes(dir, ob.trackflag, ob.upflag);
        mat = [ax[0][0] * sc[0], ax[0][1] * sc[0], ax[0][2] * sc[0], 0, ax[1][0] * sc[1], ax[1][1] * sc[1], ax[1][2] * sc[1], 0, ax[2][0] * sc[2], ax[2][1] * sc[2], ax[2][2] * sc[2], 0, from[0], from[1], from[2], 1];
      }
    }
    ob.obmat = mat;
    return mat;
  }

  function trackAxes(dir, track, up) {
    const axes = { X: 0, Y: 1, Z: 2, '-X': 0, '-Y': 1, '-Z': 2 };
    const t = track || 'Y';
    const neg = t[0] === '-';
    const ti = axes[t];
    const ui = axes[up || 'Z'] === ti ? (ti === 2 ? 1 : 2) : axes[up || 'Z'];
    const f = neg ? V.neg(dir) : dir;
    let u = [0, 0, 1];
    if (Math.abs(V.dot(u, f)) > 0.999) u = [0, 1, 0];
    let side = V.norm(V.cross(u, f));
    let upv = V.norm(V.cross(f, side));
    const res = [null, null, null];
    res[ti] = f;
    res[ui] = upv;
    const oi = 3 - ti - ui;
    const c = V.cross(res[(oi + 1) % 3], res[(oi + 2) % 3]);
    res[oi] = V.norm(c);
    return res;
  }

  function sceneObjects(sce) { return sce.bases.map(b => b.object); }

  function visibleBases(sce) { return sce.bases.filter(b => (b.object.lay & sce.lay)); }

  function defaultFile() {
    const main = new Main();
    const sce = newScene(main, '1');
    const me = newMesh(main, 'Plane');
    me.verts = [[1, 1, 0], [1, -1, 0], [-1, -1, 0], [-1, 1, 0]].map(co => ({ co, sel: true, hide: false }));
    me.faces = [{ v: [0, 1, 2, 3], mat: 0, smooth: false, sel: false }];
    const ma = newMaterial(main, 'Material');
    ma.mtex[0] = newMTex(idUser(newTexture(main, 'Tex')));
    me.mats = [idUser(ma)];
    const plane = newObject(main, 'mesh', 'Plane', idUser(me));
    const cam = newCamera(main, 'Camera');
    const camob = newObject(main, 'camera', 'Camera', idUser(cam));
    camob.loc = [0, -8.2, 0];
    camob.rot = [Math.PI / 2, 0, 0];
    sce.bases.push({ object: idUser(camob), sel: false }, { object: idUser(plane), sel: true });
    sce.camera = camob;
    sce.basact = sce.bases[1];
    main.curscene = sce;
    return main;
  }

  B.LISTS = LISTS;
  B.OB_FLAGS = OB_FLAGS;
  B.Main = Main;
  B.Data = {
    newScene, newMesh, newCamera, newLamp, newMaterial, newMTex, newTexture, newWorld, newIpo, newText, newObject,
    idUser, obMatrixLocal, whereIs, trackAxes, sceneObjects, visibleBases, defaultFile, defaultRender
  };
})(globalThis.B204 = globalThis.B204 || {});
