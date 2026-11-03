import argparse
import json
import math
import os
import random
import sys

import bmesh
import bpy
import mathutils
import numpy as np

ELEVATION = math.pi / 6
C = math.cos(ELEVATION)
N = math.sin(ELEVATION)
K = C / math.sqrt(2)
TURNS = [(1, 0, 0, 1), (0, 1, -1, 0), (-1, 0, 0, -1), (0, -1, 1, 0)]
LIGHT = (-0.3558, 0.8642, 0.3558)
OFFSET = 100.0
DATA_OFFSET = 50.0
NEAR_TILE = 128
SHADOW_TILE = 64
SHADOW_PAD = 8


def to_blender(x, y, z):
    return (x, -z, y)


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def unit_y(tile):
    return tile / math.sqrt(2) * C


def add_material(name, spec):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    base = [srgb_to_linear(c) for c in spec['color']] + [1]
    look = spec.get('look', 'paint')
    bsdf.inputs['Base Color'].default_value = base
    bsdf.inputs['Roughness'].default_value = {'fabric': 0.95, 'wood': 0.5, 'paint': 0.45, 'metal': 0.35, 'glass': 0.12, 'bark': 0.9, 'leaf': 0.7}.get(look, 0.5)
    if look == 'metal':
        bsdf.inputs['Metallic'].default_value = 1
    coord = nodes.new('ShaderNodeTexCoord')
    if look in ('wood', 'bark', 'leaf', 'fabric'):
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = {'wood': 14, 'bark': 22, 'leaf': 26, 'fabric': 120}[look]
        noise.inputs['Detail'].default_value = 4
        mapping = nodes.new('ShaderNodeMapping')
        if look == 'wood':
            mapping.inputs['Scale'].default_value = (0.25, 4, 4)
        if look == 'bark':
            mapping.inputs['Scale'].default_value = (3, 3, 0.4)
        links.new(coord.outputs['Object'], mapping.inputs['Vector'])
        links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
        ramp = nodes.new('ShaderNodeValToRGB')
        strength = {'wood': 0.32, 'bark': 0.5, 'leaf': 0.55, 'fabric': 0.14}[look]
        ramp.color_ramp.elements[0].position = 0.3
        ramp.color_ramp.elements[1].position = 0.7
        ramp.color_ramp.elements[0].color = [c * (1 - strength) for c in base[:3]] + [1]
        ramp.color_ramp.elements[1].color = [min(1, c * (1 + strength)) for c in base[:3]] + [1]
        links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
        links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = {'wood': 0.1, 'bark': 0.6, 'leaf': 0.8, 'fabric': 0.25}[look]
        bump.inputs['Distance'].default_value = 0.02
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def add_face_data(bm, ch, mat_index, smooth, uv, chan):
    for face in bm.faces:
        face.material_index = mat_index
        face.smooth = smooth(face) if callable(smooth) else smooth
        face[chan] = ch + 1
        n = face.normal
        axis = max(range(3), key=lambda i: abs(n[i]))
        for loop in face.loops:
            p = loop.vert.co
            if axis == 0:
                loop[uv].uv = (p.y, p.z)
            elif axis == 1:
                loop[uv].uv = (p.x, p.z)
            else:
                loop[uv].uv = (p.x, p.y)


def build_part(part, mat_index, rng):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    chan = bm.faces.layers.float.new('ch')
    shape = part['shape']
    smooth = False
    if shape == 'box':
        sx, sy, sz = part['size']
        verts = bmesh.ops.create_cube(bm, size=1)['verts']
        for v in verts:
            v.co = mathutils.Vector((v.co.x * sx, v.co.y * sz, v.co.z * sy))
        if part.get('round'):
            offset = min(sx, sy, sz) * 0.42
            bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=offset, segments=4, profile=0.6, affect='EDGES', clamp_overlap=True)
            smooth = True
        elif part.get('bevel'):
            bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=part['bevel'], segments=2, profile=0.6, affect='EDGES', clamp_overlap=True)
    elif shape == 'cyl':
        r = part['r']
        r2 = part.get('r2', r)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=r2, radius2=r, depth=part['h'])
        smooth = lambda face: len(face.verts) == 4
    elif shape == 'blob':
        rx, ry, rz = part['radius']
        bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1)
        rough = part.get('rough', 0)
        seed = mathutils.Vector((rng.random() * 40, rng.random() * 40, rng.random() * 40))
        for v in bm.verts:
            d = v.co.normalized()
            bump = mathutils.noise.fractal(d * 2.6 + seed, 1.0, 2.0, 4) * rough
            fine = mathutils.noise.noise(d * 9 + seed) * rough * 0.35
            v.co = mathutils.Vector((d.x * rx * (1 + bump + fine), d.y * rz * (1 + bump + fine), d.z * ry * (1 + bump + fine)))
        smooth = True
    else:
        raise ValueError('unknown shape ' + shape)
    bm.normal_update()
    if part.get('tilt'):
        tx, ty, tz = part['tilt']
        bmesh.ops.rotate(bm, verts=list(bm.verts), matrix=mathutils.Euler((tx, -tz, ty)).to_matrix(), cent=(0, 0, 0))
    x, y, z = part['at']
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=to_blender(x, y, z))
    bm.normal_update()
    add_face_data(bm, part.get('ch', 3), mat_index, smooth, uv, chan)
    return bm


def build_model(name, model, materials):
    rng = random.Random(name)
    used = []
    for part in model['parts']:
        if part['mat'] not in used:
            used.append(part['mat'])
    main = bpy.data.objects.new(name, bpy.data.meshes.new(name))
    bpy.context.scene.collection.objects.link(main)
    for m in used:
        main.data.materials.append(materials[m])
    objects = []
    for part in model['parts']:
        bm = build_part(part, used.index(part['mat']), rng)
        me = bpy.data.meshes.new('part')
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new('part', me)
        bpy.context.scene.collection.objects.link(ob)
        for m in used:
            me.materials.append(materials[m])
        objects.append(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:
        ob.select_set(True)
    main.select_set(True)
    bpy.context.view_layer.objects.active = main
    bpy.ops.object.join()
    if model.get('yaw'):
        main.data.transform(mathutils.Matrix.Rotation(math.radians(model['yaw']), 4, 'Z'))
    return main


def screen_of(rx, y, rz, tile):
    return (rx - rz) * tile / 2, (rx + rz) * tile / 4 - y * unit_y(tile)


def rotated_points(ob, turn):
    a, b, c, d = TURNS[turn]
    points = []
    for v in ob.data.vertices:
        lx, lz, y = v.co.x, -v.co.y, v.co.z
        points.append((a * lx + b * lz, y, c * lx + d * lz))
    return points


def rect_of(points, tile, pad=1):
    xs, ys = zip(*[screen_of(r, y, q, tile) for r, y, q in points])
    ox = math.floor(min(xs)) - pad
    oy = math.floor(min(ys)) - pad
    return ox, oy, math.ceil(max(xs)) + pad - ox, math.ceil(max(ys)) + pad - oy


def set_turn(ob, turn):
    ob.rotation_mode = 'XYZ'
    ob.rotation_euler = (0, 0, math.pi / 2 * turn)


def set_camera(cam, tile, ox, oy, w, h):
    scene = bpy.context.scene
    scale = tile / math.sqrt(2)
    cx, cy = ox + w / 2, oy + h / 2
    r = (1 / math.sqrt(2), 0, -1 / math.sqrt(2))
    u = (-N / math.sqrt(2), C, -N / math.sqrt(2))
    f = (-K, -N, -K)
    px = cx / scale
    py = -cy / scale
    target = [r[i] * px + u[i] * py for i in range(3)]
    eye = [target[i] - f[i] * 40 for i in range(3)]
    cam.location = to_blender(eye[0], eye[1], eye[2])
    forward = mathutils.Vector(to_blender(f[0], f[1], f[2]))
    up = mathutils.Vector(to_blender(u[0], u[1], u[2]))
    right = forward.cross(up)
    m = mathutils.Matrix((right, up, -forward)).transposed()
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = m.to_quaternion()
    cam.data.type = 'ORTHO'
    cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.ortho_scale = w / scale
    cam.data.clip_start = 0.1
    cam.data.clip_end = 200
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100


def override_material(name, build):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for n in list(nodes):
        nodes.remove(n)
    out = nodes.new('ShaderNodeOutputMaterial')
    emit = nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = 1
    links.new(emit.outputs[0], out.inputs['Surface'])
    build(nodes, links, emit)
    return mat


def build_data(nodes, links, emit):
    uv = nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'UVMap'
    sep = nodes.new('ShaderNodeSeparateXYZ')
    links.new(uv.outputs['UV'], sep.inputs[0])
    attr = nodes.new('ShaderNodeAttribute')
    attr.attribute_type = 'GEOMETRY'
    attr.attribute_name = 'ch'
    combine = nodes.new('ShaderNodeCombineXYZ')
    for i, src in enumerate((sep.outputs['X'], sep.outputs['Y'])):
        add = nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        add.inputs[1].default_value = DATA_OFFSET
        links.new(src, add.inputs[0])
        links.new(add.outputs[0], combine.inputs[i])
    links.new(attr.outputs['Fac'], combine.inputs[2])
    links.new(combine.outputs[0], emit.inputs['Color'])


def build_depth(nodes, links, emit):
    geo = nodes.new('ShaderNodeNewGeometry')
    dot = nodes.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    fx, fy, fz = to_blender(-K, -N, -K)
    dot.inputs[1].default_value = (fx, fy, fz)
    links.new(geo.outputs['Position'], dot.inputs[0])
    add = nodes.new('ShaderNodeMath')
    add.operation = 'ADD'
    add.inputs[1].default_value = OFFSET
    links.new(dot.outputs['Value'], add.inputs[0])
    combine = nodes.new('ShaderNodeCombineXYZ')
    links.new(add.outputs[0], combine.inputs[0])
    links.new(combine.outputs[0], emit.inputs['Color'])


def read_exr(path):
    img = bpy.data.images.load(path)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    os.remove(path)
    return px.reshape(h, w, 4)[::-1].copy()


def render(tmp, name):
    scene = bpy.context.scene
    path = os.path.join(tmp, name + '.exr')
    scene.render.filepath = path
    scene.render.use_file_extension = False
    bpy.ops.render.render(write_still=True)
    return read_exr(path)


def setup_gpu():
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            bpy.context.scene.cycles.device = 'GPU'
            return kind
    bpy.context.scene.cycles.device = 'CPU'
    return 'CPU'


def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'OPEN_EXR'
    scene.render.image_settings.color_depth = '32'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.exr_codec = 'ZIP'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.cycles.max_bounces = 4
    scene.cycles.sample_clamp_direct = 0
    scene.cycles.sample_clamp_indirect = 8
    device = setup_gpu()
    world = bpy.data.worlds.new('sky')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.82, 0.86, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.62
    scene.world = world
    sun = bpy.data.lights.new('key', 'SUN')
    sun.energy = 2.7
    sun.angle = math.radians(14)
    sun.color = (1.0, 0.96, 0.88)
    key = bpy.data.objects.new('key', sun)
    scene.collection.objects.link(key)
    d = mathutils.Vector(to_blender(*LIGHT)).normalized()
    key.rotation_mode = 'QUATERNION'
    key.rotation_quaternion = d.to_track_quat('Z', 'Y')
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    scene.collection.objects.link(cam)
    scene.camera = cam
    plane_mesh = bpy.data.meshes.new('ground')
    plane_mesh.from_pydata([(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [], [(0, 1, 2, 3)])
    plane = bpy.data.objects.new('ground', plane_mesh)
    scene.collection.objects.link(plane)
    plane.is_shadow_catcher = True
    plane.hide_render = True
    return scene, cam, plane, device


def shadow_rect(points):
    ground = []
    for rx, y, rz in points:
        t = max(y, 0) / LIGHT[1]
        ground.append((rx - LIGHT[0] * t, 0, rz - LIGHT[2] * t))
        ground.append((rx, 0, rz))
    return rect_of(ground, SHADOW_TILE, SHADOW_PAD)


def bake_turn(scene, cam, plane, ob, turn, samples, tmp, view_layer, overrides):
    set_turn(ob, turn)
    points = rotated_points(ob, turn)
    ox, oy, w, h = rect_of(points, NEAR_TILE)
    set_camera(cam, NEAR_TILE, ox, oy, w, h)
    view_layer.material_override = None
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.pixel_filter_type = 'BLACKMAN_HARRIS'
    scene.cycles.filter_width = 1.2
    color = render(tmp, 'color')
    view_layer.material_override = overrides['clay']
    clay = render(tmp, 'clay')
    scene.cycles.samples = 1
    scene.cycles.use_denoising = False
    scene.cycles.pixel_filter_type = 'BOX'
    scene.cycles.filter_width = 0.01
    view_layer.material_override = overrides['data']
    data = render(tmp, 'data')
    view_layer.material_override = overrides['depth']
    depth = render(tmp, 'depth')
    view_layer.material_override = None
    sox, soy, sw, sh = shadow_rect(points)
    set_camera(cam, SHADOW_TILE, sox, soy, sw, sh)
    scene.cycles.samples = max(16, samples // 2)
    scene.cycles.use_denoising = True
    scene.cycles.pixel_filter_type = 'BLACKMAN_HARRIS'
    scene.cycles.filter_width = 1.5
    ob.visible_camera = False
    plane.hide_render = False
    shadow = render(tmp, 'shadow')
    ob.visible_camera = True
    plane.hide_render = True
    return {
        'color': color, 'clay': clay[:, :, 0], 'data': data, 'depth': depth[:, :, 0] - OFFSET, 'shadow': shadow[:, :, 3],
        'rect': np.array([ox, oy, w, h]), 'shadow_rect': np.array([sox, soy, sw, sh])
    }


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--models', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--ids', default='')
    p.add_argument('--turns', default='0,1,2,3')
    p.add_argument('--samples', type=int, default=64)
    args = p.parse_args(argv)
    with open(args.models, encoding='utf-8') as f:
        doc = json.load(f)
    scene, cam, plane, device = setup_scene()
    print('render device', device)
    view_layer = bpy.context.view_layer
    materials = {name: add_material(name, spec) for name, spec in doc['materials'].items()}
    clay = bpy.data.materials.new('clay')
    clay.use_nodes = True
    clay_bsdf = next(n for n in clay.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    clay_bsdf.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1)
    clay_bsdf.inputs['Roughness'].default_value = 0.8
    overrides = {'clay': clay, 'data': override_material('data', build_data), 'depth': override_material('depth', build_depth)}
    ids = [i for i in args.ids.split(',') if i] or list(doc['models'].keys())
    turns = [int(t) for t in args.turns.split(',')]
    args.out = os.path.abspath(args.out)
    os.makedirs(args.out, exist_ok=True)
    tmp = os.path.join(args.out, 'tmp')
    os.makedirs(tmp, exist_ok=True)
    for name in ids:
        ob = build_model(name, doc['models'][name], materials)
        for turn in turns:
            result = bake_turn(scene, cam, plane, ob, turn, args.samples, tmp, view_layer, overrides)
            np.savez_compressed(os.path.join(args.out, f'{name}-{turn}.npz'), **result)
            print('baked', name, turn, result['rect'].tolist(), result['shadow_rect'].tolist(), flush=True)
        bpy.data.objects.remove(ob)
    os.rmdir(tmp)


main()
