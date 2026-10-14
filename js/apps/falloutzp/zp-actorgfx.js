(function (Z) {
  'use strict';

  const FACE_LAYERS = 48;
  const FACE_SLOTS = 40;

  Z.Scene.prototype.initFaces = function () {
    const r = this.r, gl = r.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 9, gl.RGBA8, 256, 256, FACE_LAYERS);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    r.faceTex = t;
    this.faceSlots = new Map();
    this.faceNext = 0;
    this.models = new Map();
    this.boneBuf = new Float32Array(32 * 16);
  };

  Z.faceKey = look => [look.sex, (look.skin || []).join('.'), (look.hairCol || []).join('.'), look.beard, (look.eyes || []).join('.'), look.brows, look.scar ? 1 : 0, look.faceSeed, look.age > 0.55 ? Math.round(look.age * 10) : 0, look.grime ? 1 : 0, look.ghoulish ? 1 : 0, look.hair || ''].join('|');

  Z.Scene.prototype.faceLayer = function (look) {
    const key = Z.faceKey(look);
    let slot = this.faceSlots.get(key);
    if (slot !== undefined) return slot;
    const gl = this.r.gl;
    if (this.faceNext >= FACE_SLOTS) {
      const first = this.faceSlots.keys().next().value;
      slot = this.faceSlots.get(first);
      this.faceSlots.delete(first);
      for (const [k, m] of this.models) if (m.face === slot) { this.models.delete(k); }
    } else slot = this.faceNext++;
    const cv = Z.faceCanvas(look, 256);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.r.faceTex);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, slot, 256, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    this.faceSlots.set(key, slot);
    return slot;
  };

  Z.Scene.prototype.modelFor = function (look, kind) {
    const key = (kind || 'human') + JSON.stringify(look);
    let m = this.models.get(key);
    if (m) return m;
    let built, face;
    if (!kind || kind === 'human') {
      face = look.gasmask ? undefined : this.faceLayer(look);
      built = Z.Models.human(look, face);
    } else built = Z.Creatures[kind](look || {});
    const packed = built.mesh.pack();
    m = this.r.meshVAO(packed);
    m.def = built.def;
    m.face = face;
    m.height = built.height;
    m.extra = built.extra || null;
    this.models.set(key, m);
    return m;
  };

  Z.Scene.prototype.poseActor = function (a, m, t) {
    if (!a.pose || a.pose.def !== m.def) a.pose = new Z.Pose(m.def);
    const ctx = a.animCtx || {};
    const anim = (a.rig && Z.Anim[a.rig]) ? Z.Anim[a.rig] : Z.Anim.human;
    a.rootM = anim.call(Z.Anim, a.pose, a, t, ctx);
    return a.pose;
  };

  Z.Scene.prototype.drawActorList = function (r, list, t, depth) {
    const gl = r.gl;
    const p = depth ? r.prog.dSkin.use() : r.prog.skin.use();
    if (!depth) { r.setEnvUniforms(p); r.bindWorldTextures(p); }
    gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
    const ex = r.eye[0], ez = r.eye[2];
    let n = 0;
    for (const a of list) {
      if (a.hidden || !a.look) continue;
      if (a.kind === 'player' && !this.showPlayer) continue;
      const d = Math.hypot(a.x - ex, a.z - ez);
      if (d > (depth ? 90 : 220)) continue;
      const m = this.modelFor((a.kind === 'player' || a.companion) && !a.rig ? Z.dressedLook(a) : a.look, a.rig || 'human');
      const h = (m.height || 2) + 1;
      if (!depth && !r.boxVisible(a.x - h, a.y - 1, a.z - h, a.x + h, a.y + h * 1.5, a.z + h)) continue;
      if (!depth || !a.pose) this.poseActor(a, m, t);
      const bones = a.pose.skin;
      const nb = Math.min(32, m.def.n);
      gl.uniformMatrix4fv(p.u.uBones, false, bones.subarray(0, nb * 16));
      gl.bindVertexArray(m.vao);
      gl.drawElements(gl.TRIANGLES, m.count, m.type, 0);
      n++;
      if (!depth && this.drawHeld) this.drawHeld(r, a, m);
    }
    gl.bindVertexArray(null);
    if (!depth) r.stats.actors = n;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
