import json
import math
import os
import struct

import bmesh
import bpy
from mathutils import Matrix

AXIS = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
AXIS_INV = AXIS.inverted()
FORMAT = 1


def game_point(v):
    p = AXIS @ v.to_4d()
    return (p.x, p.y, p.z)


def game_dir(v):
    p = AXIS.to_3x3() @ v
    return (p.x, p.y, p.z)


def align(buf):
    while len(buf) % 4:
        buf.append(0)


def pack(fmt, values):
    return bytearray(struct.pack('<' + fmt * len(values), *values)) if values else bytearray()


def mesh_arrays(ob, bones):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    tmp = bpy.data.meshes.new(ob.name + '_tri')
    bm.to_mesh(tmp)
    bm.free()
    world = ob.matrix_world
    nmat = world.to_3x3().inverted().transposed()
    uv0 = tmp.uv_layers[0].data if len(tmp.uv_layers) > 0 else None
    uv1 = tmp.uv_layers[1].data if len(tmp.uv_layers) > 1 else None
    groups = {g.index: g.name for g in ob.vertex_groups}
    bone_index = {name: i for i, name in enumerate(bones)}
    normals = tmp.corner_normals
    keys = {}
    pos, nor, uv, uv2, joints, weights, idx = [], [], [], [], [], [], []
    for poly in tmp.polygons:
        for li in poly.loop_indices:
            loop = tmp.loops[li]
            v = tmp.vertices[loop.vertex_index]
            p = game_point(world @ v.co)
            n = game_dir((nmat @ normals[li].vector).normalized())
            t = (uv0[li].uv.x, 1 - uv0[li].uv.y) if uv0 else (0.0, 0.0)
            t2 = (uv1[li].uv.x, 1 - uv1[li].uv.y) if uv1 else None
            j = [0, 0]
            w = [1.0, 0.0]
            if bones:
                infl = sorted(((g.weight, bone_index[groups[g.group]]) for g in v.groups if groups.get(g.group) in bone_index and g.weight > 0), reverse=True)[:2]
                total = sum(x[0] for x in infl) or 1
                for k, (gw, bi) in enumerate(infl):
                    j[k] = bi
                    w[k] = gw / total
                if len(infl) < 2:
                    w[1] = 0.0
            key = (tuple(round(x, 5) for x in p), tuple(round(x, 4) for x in n), tuple(round(x, 5) for x in t), t2 and tuple(round(x, 5) for x in t2), tuple(j), tuple(round(x, 4) for x in w))
            if key not in keys:
                keys[key] = len(keys)
                pos.extend(p)
                nor.extend(n)
                uv.extend(t)
                if t2:
                    uv2.extend(t2)
                joints.extend((j[0], j[1], 0, 0))
                weights.extend(w)
            idx.append(keys[key])
    bpy.data.meshes.remove(tmp)
    del depsgraph
    return pos, nor, uv, uv2, joints, weights, idx


def skin_pose(rig):
    out = []
    for b in rig.data.bones:
        pb = rig.pose.bones[b.name]
        m = AXIS @ (pb.matrix @ b.matrix_local.inverted()) @ AXIS_INV
        q = m.to_quaternion().normalized()
        t = m.to_translation()
        out.extend((q.x, q.y, q.z, q.w, t.x, t.y, t.z))
    return out


def sample_clips(rig, clips, fps):
    scene = bpy.context.scene
    out = {}
    for name, spec in clips.items():
        rig.animation_data.action = bpy.data.actions[spec['action']]
        data = []
        frames = spec['frames']
        for f in range(frames):
            scene.frame_set(f)
            bpy.context.view_layer.update()
            data.extend(skin_pose(rig))
        out[name] = {'frames': frames, 'loop': spec.get('loop', True), 'data': data}
    rig.animation_data.action = None
    return out


def save_texture(image, out_dir, name):
    os.makedirs(os.path.join(out_dir, 'tex'), exist_ok=True)
    path = os.path.join(out_dir, 'tex', name + '.png')
    image.filepath_raw = path
    image.file_format = 'PNG'
    image.save()
    return 'tex/' + name + '.png'


def export_model(mid, ob, out_dir, image=None, rig=None, clips=None, fps=15, kind=None, lightmap=None, tex_name=None, extra=None):
    bones = [b.name for b in rig.data.bones] if rig else []
    parents = [bones.index(b.parent.name) if b.parent else -1 for b in rig.data.bones] if rig else []
    pos, nor, uv, uv2, joints, weights, idx = mesh_arrays(ob, bones)
    if len(pos) // 3 > 65535:
        raise ValueError(mid + ': too many vertices')
    buf = bytearray()
    views = {}

    def put(name, fmt, values, comps):
        align(buf)
        views[name] = {'offset': len(buf), 'count': len(values) // comps if comps else len(values), 'type': fmt}
        buf.extend(pack(fmt, values))

    put('pos', 'f', pos, 3)
    put('nor', 'f', nor, 3)
    put('uv', 'f', uv, 2)
    if uv2:
        put('uv2', 'f', uv2, 2)
    if rig:
        put('joints', 'B', joints, 4)
        put('weights', 'f', weights, 2)
    put('idx', 'H', idx, 0)
    clip_meta = {}
    if rig and clips:
        sampled = sample_clips(rig, clips, fps)
        for name, c in sampled.items():
            put('clip:' + name, 'f', c['data'], 0)
            clip_meta[name] = {'frames': c['frames'], 'loop': c['loop'], 'view': 'clip:' + name}
    xs, ys, zs = pos[0::3], pos[1::3], pos[2::3]
    meta = {
        'format': FORMAT,
        'id': mid,
        'kind': kind or ('skinned' if rig else 'static'),
        'verts': len(pos) // 3,
        'tris': len(idx) // 3,
        'bounds': [min(xs), min(ys), min(zs), max(xs), max(ys), max(zs)],
        'bin': 'mesh/' + mid + '.bin',
        'views': views,
        'tex': save_texture(image, out_dir, tex_name or mid) if image else None,
        'lightmap': save_texture(lightmap, out_dir, mid + '-light') if lightmap else None,
        'bones': bones,
        'parents': parents,
        'fps': fps if rig else 0,
        'clips': clip_meta
    }
    if extra:
        meta.update(extra)
    os.makedirs(os.path.join(out_dir, 'mesh'), exist_ok=True)
    with open(os.path.join(out_dir, 'mesh', mid + '.bin'), 'wb') as f:
        f.write(bytes(buf))
    with open(os.path.join(out_dir, 'mesh', mid + '.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    return meta
