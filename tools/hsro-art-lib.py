import importlib.util
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('hsro_export', os.path.join(HERE, 'hsro-export.py'))
EXPORT = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(EXPORT)

FPS = 15


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS


def new_image(name, size, pixels, height=None):
    img = bpy.data.images.new(name, size, height or size, alpha=True)
    img.pixels.foreach_set(np.clip(pixels, 0, 1).astype(np.float32).ravel())
    return img


def noise(rng, h, w, amount):
    return (rng.random((h, w)) - 0.5) * amount


def canvas(size, height=None, fill=0.5, alpha=1.0):
    px = np.zeros((height or size, size, 4), dtype=np.float32)
    px[..., :3] = fill
    px[..., 3] = alpha
    return px


def fill_region(px, rng, rect, color, grad=(0.84, 1.05), grain=0.035):
    x, y, w, h = rect
    base = np.array(color, dtype=np.float32) / 255
    g = np.linspace(grad[0], grad[1], h).reshape(h, 1, 1)
    px[y:y + h, x:x + w, :3] = np.clip(base.reshape(1, 1, 3) * g + noise(rng, h, w, grain)[..., None], 0, 1)
    px[y:y + h, x:x + w, 3] = 1


def rgb(c):
    return np.array(c, dtype=np.float32) / 255


def top_left(rect, size, height=None):
    x, y, w, h = rect
    return [x, (height or size) - y - h, w, h]


def cell(i, size=256, step=64):
    per = size // step
    return ((i % per) * step, (i // per) * step, step, step)


def paint_cells(rng, name, spec, size=256, step=64):
    px = canvas(size)
    regions = {}
    for i, (region, (style, a, b)) in enumerate(spec.items()):
        rect = cell(i, size, step)
        regions[region] = rect
        x, y, w, h = rect
        fill_region(px, rng, rect, a)
        if callable(style):
            style(px[y:y + h, x:x + w], rng, a, b)
            continue
        sub = px[y:y + h, x:x + w]
        if style == 'trim':
            for r0 in (5, h - 10):
                sub[r0:r0 + 4, :, :3] = rgb(b)
            for k in range(0, w, 16):
                for j in range(14, h - 14):
                    c = k + int(5 * math.sin(j * 0.2))
                    if 0 <= c < w:
                        sub[j, c, :3] = rgb(b) * 0.9
        elif style == 'stars':
            for _ in range(70):
                sx, sy = rng.integers(0, w - 2), rng.integers(0, h - 2)
                n = 2 if rng.random() < 0.25 else 1
                sub[sy:sy + n, sx:sx + n, :3] = rgb(b)
        elif style == 'glow':
            yy, xx = np.mgrid[0:h, 0:w]
            t = np.clip(1 - np.hypot(xx - w / 2, yy - h / 2) / (w * 0.55), 0, 1) ** 1.2
            sub[..., :3] = rgb(a) * (1 - t[..., None]) + rgb(b) * t[..., None]
        elif style == 'fade':
            t = np.linspace(0, 1, h).reshape(h, 1, 1) ** 1.4
            sub[..., :3] = np.clip(rgb(a) * (1 - t) + rgb(b) * t + noise(rng, h, w, 0.03)[..., None], 0, 1)
        elif style == 'seams':
            for k in range(0, h, 16):
                sub[k:k + 2, :, :3] *= 0.62
            for k in range(8, w, 21):
                sub[:, k:k + 2, :3] *= 0.75
        elif style in ('eyes', 'eye1'):
            sub[h // 2 - 9:h // 2 + 7, 6:w - 6, :3] = rgb(a) * 0.35
            spots = (0.36, 0.64) if style == 'eyes' else (0.42,)
            for u in spots:
                cx = int(u * w)
                sub[h // 2 - 5:h // 2 + 3, cx - 6:cx + 6, :3] = rgb(b)
                sub[h // 2 - 3:h // 2 + 1, cx - 3:cx + 3, :3] = 1.0
        elif style == 'mask':
            for u in (0.36, 0.64):
                cx = int(u * w)
                for j in range(8):
                    sub[h // 2 - 2 + j // 3:h // 2 + j // 3, cx - 6 + j:cx - 3 + j, :3] = rgb(b)
            sub[h // 2 - 16:h // 2 - 6, w // 2 - 1:w // 2 + 1, :3] = rgb(b)
            sub[8:12, :, :3] = rgb(b) * 1.4
        elif style == 'pigface':
            for u in (0.38, 0.62):
                cx = int(u * w)
                sub[h // 2 + 2:h // 2 + 10, cx - 3:cx + 3, :3] = rgb(b)
                sub[h // 2 + 7:h // 2 + 9, cx - 1:cx + 1, :3] = 1.0
            sub[h // 2 + 14:h // 2 + 16, int(w * 0.3):int(w * 0.7), :3] = rgb((210, 170, 88))
    return new_image(name, size, px), regions


class Builder:
    def __init__(self, regions, atlas, bones):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('uv')
        self.deform = self.bm.verts.layers.deform.verify()
        self.regions = regions
        self.atlas = atlas
        self.bone_ids = {name: i for i, name in enumerate(bones)}

    def ruv(self, region, u, v):
        x, y, w, h = self.regions[region] if isinstance(region, str) else region
        return ((x + 1 + u * (w - 2)) / self.atlas, (y + 1 + v * (h - 2)) / self.atlas)

    def weigh(self, v, bone, blend=None, k=0.5):
        if bone is None:
            return
        v[self.deform][self.bone_ids[bone]] = (1 - k) if blend else 1.0
        if blend:
            v[self.deform][self.bone_ids[blend]] = k

    def tube(self, p0, p1, r0, r1, bone, region, sides=10, squash=1.0, cap=True, blend=None, bone1=None, twist=0.0):
        a, b = Vector(p0), Vector(p1)
        axis = (b - a).normalized()
        side = Vector((0, 1, 0)) if abs(axis.y) < 0.9 else Vector((1, 0, 0))
        ux = axis.cross(side).normalized()
        uy = axis.cross(ux).normalized()
        rings = []
        for t, r in ((0.0, r0), (1.0, r1)):
            ring = []
            for i in range(sides):
                ang = 2 * math.pi * i / sides + twist
                off = ux * (math.cos(ang) * r) + uy * (math.sin(ang) * r * squash)
                v = self.bm.verts.new(a.lerp(b, t) + off)
                if t == 0.0:
                    self.weigh(v, bone, blend)
                else:
                    self.weigh(v, bone1 or bone)
                ring.append((v, i / sides, t))
            rings.append(ring)
        for i in range(sides):
            j = (i + 1) % sides
            quad = [rings[0][i], rings[0][j], rings[1][j], rings[1][i]]
            f = self.bm.faces.new([q[0] for q in quad])
            us = [q[1] for q in quad]
            if j == 0:
                us[1] = us[2] = 1.0
            for loop, q, u in zip(f.loops, quad, us):
                loop[self.uv].uv = self.ruv(region, u, q[2])
        if cap:
            for ring, flip, r in ((rings[0], True, r0), (rings[1], False, r1)):
                if r <= 0.0005:
                    continue
                verts = [q[0] for q in ring]
                f = self.bm.faces.new(list(reversed(verts)) if flip else verts)
                for loop in f.loops:
                    loop[self.uv].uv = self.ruv(region, 0.5, 0.5)

    def chain(self, pts, radii, bones, region, sides=8, squash=1.0):
        rings = []
        for k, (p, r) in enumerate(zip(pts, radii)):
            a = Vector(p)
            nxt = Vector(pts[min(k + 1, len(pts) - 1)]) - Vector(pts[max(k - 1, 0)])
            axis = nxt.normalized()
            side = Vector((0, 0, 1)) if abs(axis.z) < 0.9 else Vector((1, 0, 0))
            ux = axis.cross(side).normalized()
            uy = axis.cross(ux).normalized()
            ring = []
            for i in range(sides):
                ang = 2 * math.pi * i / sides
                v = self.bm.verts.new(a + ux * (math.cos(ang) * r) + uy * (math.sin(ang) * r * squash))
                bone = bones[k]
                if isinstance(bone, tuple):
                    self.weigh(v, bone[0], bone[1], bone[2] if len(bone) > 2 else 0.5)
                else:
                    self.weigh(v, bone)
                ring.append((v, i / sides, k / (len(pts) - 1)))
            rings.append(ring)
        for k in range(len(rings) - 1):
            for i in range(sides):
                j = (i + 1) % sides
                quad = [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]]
                f = self.bm.faces.new([q[0] for q in quad])
                us = [q[1] for q in quad]
                if j == 0:
                    us[1] = us[2] = 1.0
                for loop, q, u in zip(f.loops, quad, us):
                    loop[self.uv].uv = self.ruv(region, u, q[2])
        for ring, flip, r in ((rings[0], True, radii[0]), (rings[-1], False, radii[-1])):
            if r <= 0.0005:
                continue
            verts = [q[0] for q in ring]
            f = self.bm.faces.new(list(reversed(verts)) if flip else verts)
            for loop in f.loops:
                loop[self.uv].uv = self.ruv(region, 0.5, 0.5)

    def box(self, c, size, bone, region, rot=None):
        geom = bmesh.ops.create_cube(self.bm, size=1.0)
        verts = geom['verts']
        m = Euler(rot, 'XYZ').to_matrix() if rot else None
        for v in verts:
            p = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
            if m:
                p = m @ p
            v.co = Vector(c) + p
            self.weigh(v, bone)
        faces = {f for v in verts for f in v.link_faces}
        for f in faces:
            n = f.normal
            if m:
                n = m.inverted() @ n
            for loop in f.loops:
                p = loop.vert.co - Vector(c)
                if m:
                    p = m.inverted() @ p
                if abs(n.z) > 0.5:
                    u, v = p.x / size[0] + 0.5, p.y / size[1] + 0.5
                elif abs(n.x) > 0.5:
                    u, v = p.y / size[1] + 0.5, p.z / size[2] + 0.5
                else:
                    u, v = p.x / size[0] + 0.5, p.z / size[2] + 0.5
                loop[self.uv].uv = self.ruv(region, min(1, max(0, u)), min(1, max(0, v)))

    def sphere(self, c, r, scale, bone, region, face_region=None, segs=10, rings=8, cut=None, cut_below=True, front_y=0.35, face_top=0.55):
        geom = bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=rings, radius=r)
        verts = geom['verts']
        for v in verts:
            v.co = Vector((c[0] + v.co.x * scale[0], c[1] + v.co.y * scale[1], c[2] + v.co.z * scale[2]))
            self.weigh(v, bone)
        faces = list({f for v in verts for f in v.link_faces})
        if cut is not None:
            drop = [f for f in faces if (f.calc_center_median().z < c[2] + cut) == cut_below]
            bmesh.ops.delete(self.bm, geom=drop, context='FACES')
            faces = [f for f in faces if f.is_valid]
        for f in faces:
            front = face_region and f.normal.y > front_y and f.calc_center_median().z < c[2] + r * scale[2] * face_top
            for loop in f.loops:
                p = loop.vert.co - Vector(c)
                if front:
                    u, v = p.x / (r * scale[0] * 2) + 0.5, p.z / (r * scale[2] * 2) + 0.5
                    reg = face_region
                else:
                    u, v = (math.atan2(p.y, p.x) / (2 * math.pi)) % 1.0, p.z / (r * scale[2] * 2) + 0.5
                    reg = region
                loop[self.uv].uv = self.ruv(reg, min(1, max(0, u)), min(1, max(0, v)))

    def arc(self, c, r0, r1, a0, a1, depth, bone, region, steps=6, bulge=0.0):
        c = Vector(c)
        rows = []
        for i in range(steps + 1):
            a = a0 + (a1 - a0) * i / steps
            d = Vector((math.cos(a), 0, math.sin(a)))
            lift = bulge * math.sin(math.pi * i / steps)
            row = []
            for r, y in ((r0, depth / 2), (r1, depth / 2 + lift), (r1, -depth / 2 + lift), (r0, -depth / 2)):
                v = self.bm.verts.new(c + d * r + Vector((0, y, 0)))
                self.weigh(v, bone)
                row.append(v)
            rows.append(row)
        made = []
        for i in range(steps):
            for k in range(4):
                quad = [rows[i][k], rows[i][(k + 1) % 4], rows[i + 1][(k + 1) % 4], rows[i + 1][k]]
                f = self.bm.faces.new(quad)
                made.append(f)
                for loop, (u, v) in zip(f.loops, ((i / steps, k / 4), (i / steps, (k + 1) / 4), ((i + 1) / steps, (k + 1) / 4), ((i + 1) / steps, k / 4))):
                    loop[self.uv].uv = self.ruv(region, u, v)
        for row in (rows[0], rows[-1]):
            f = self.bm.faces.new(row)
            made.append(f)
            for loop in f.loops:
                loop[self.uv].uv = self.ruv(region, 0.5, 0.5)
        bmesh.ops.recalc_face_normals(self.bm, faces=made)

    def cone(self, base, tip, r, bone, region, sides=6, squash=1.0):
        self.tube(base, tip, r, 0.0, bone, region, sides=sides, squash=squash)

    def finish(self, name, bones):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        for b in bones:
            ob.vertex_groups.new(name=b)
        for poly in me.polygons:
            poly.use_smooth = True
        return ob


def build_rig(name, bones):
    arm = bpy.data.armatures.new(name)
    rig = bpy.data.objects.new(name, arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for bname, parent, head, tail in bones:
        e = arm.edit_bones.new(bname)
        e.head, e.tail = head, tail
        e.roll = 0
        if parent:
            e.parent = arm.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in rig.pose.bones:
        pb.rotation_mode = 'XYZ'
    return rig


def bone_euler(pb, value):
    if len(value) == 3:
        return Euler(value, 'XYZ')
    axis = (pb.bone.matrix_local.to_3x3().inverted() @ Vector(value[:3])).normalized()
    return Quaternion(axis, value[3]).to_euler('XYZ')


def animate(rig, prefix, poses, clips, root_move=None):
    rig.animation_data_create()
    out = {}
    for name, (frames, loop) in clips.items():
        act = bpy.data.actions.new(prefix + '_' + name)
        rig.animation_data.action = act
        for f in range(frames):
            t = f / (frames if loop else frames - 1)
            pose = poses[name](t)
            for pb in rig.pose.bones:
                pb.rotation_euler = bone_euler(pb, pose.get(pb.name, (0, 0, 0)))
                pb.location = (0, 0, 0)
                pb.keyframe_insert('rotation_euler', frame=f)
            loc = root_move(name, t) if root_move else (0, 0, 0)
            rig.pose.bones[rig.pose.bones[0].name].location = loc
            rig.pose.bones[rig.pose.bones[0].name].keyframe_insert('location', frame=f)
        out[name] = {'action': act.name, 'frames': frames, 'loop': loop}
    rig.animation_data.action = None
    return out


def bind(ob, rig):
    ob.parent = rig
    mod = ob.modifiers.new('rig', 'ARMATURE')
    mod.object = rig
    return ob
