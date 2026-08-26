"""Studio preview renders of the mannequin (front / side / 3-4 / back / wire)."""
import bpy, math, os, sys
from mathutils import Vector

ROOT = r"D:\FitRoom"
BLEND = os.path.join(ROOT, "assets", "blender", "mannequin.blend")
OUT = os.path.join(ROOT, "assets", "blender", "preview")
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=BLEND)
obj = bpy.data.objects["Mannequin"]

sc = bpy.context.scene
try:
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
except TypeError:
    sc.render.engine = 'BLENDER_EEVEE'
print("ENGINE", sc.render.engine)
sc.render.resolution_x = 800
sc.render.resolution_y = 1000
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.film_transparent = False
if hasattr(sc.eevee, "taa_render_samples"):
    sc.eevee.taa_render_samples = 96
for attr in ("use_gtao", "use_raytracing", "use_shadows"):
    if hasattr(sc.eevee, attr):
        setattr(sc.eevee, attr, True)
sc.view_settings.view_transform = 'AgX' if 'AgX' in [
    t.name for t in sc.view_settings.bl_rna.properties['view_transform'].enum_items
] else 'Standard'
sc.view_settings.look = 'None'

# ---- world
world = bpy.data.worlds.new("StudioWorld")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.62, 0.65, 0.70, 1.0)
bg.inputs[1].default_value = 0.45

# ---- floor
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "Floor"
fm = bpy.data.materials.new("FloorWhite")
fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.42, 0.44, 0.48, 1.0)
fb.inputs["Roughness"].default_value = 0.7
floor.data.materials.append(fm)

# ---- camera
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 100.0
cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 36.0
cam = bpy.data.objects.new("Cam", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam

TARGET = Vector((0.0, 0.0, 0.90))
DIST = 5.6


def make_area(name, loc, energy, size, aim=Vector((0, 0, 1.05))):
    d = bpy.data.lights.new(name, type='AREA')
    d.energy = energy
    d.size = size
    d.shape = 'SQUARE'
    o = bpy.data.objects.new(name, d)
    sc.collection.objects.link(o)
    o.location = loc
    dirv = (aim - Vector(loc))
    o.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()
    return o


LIGHTS = [
    make_area("Key", (-2.4, -3.0, 3.0), 260, 2.6),
    make_area("Fill", (2.9, -2.2, 1.5), 90, 3.0),
    make_area("Rim", (1.2, 3.2, 2.8), 170, 2.5),
    make_area("Top", (0.0, -0.6, 4.2), 70, 3.5, Vector((0, 0, 1.4))),
]
BASE = [tuple(l.location) for l in LIGHTS]
BASE_ROT = [tuple(l.rotation_euler) for l in LIGHTS]


def set_azimuth(az):
    """az in degrees, 0 = front view (camera on -Y)."""
    a = math.radians(az)
    cam.location = (DIST * math.sin(a), -DIST * math.cos(a), TARGET.z)
    cam.rotation_euler = (TARGET - Vector(cam.location)).to_track_quat(
        '-Z', 'Y').to_euler()
    for l, bl in zip(LIGHTS, BASE):
        x, y, z = bl
        l.location = (x * math.cos(a) - y * math.sin(a),
                      x * math.sin(a) + y * math.cos(a), z)
        aim = Vector((0, 0, 1.05))
        l.rotation_euler = (aim - Vector(l.location)).to_track_quat(
            '-Z', 'Y').to_euler()


def render(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("WROTE", path, os.path.getsize(path))


VIEWS = [("front", 0), ("side", 90), ("three_quarter", 38), ("back", 180)]
for name, az in VIEWS:
    set_azimuth(az)
    render(os.path.join(OUT, name + ".png"))

# ---- wireframe overlay render (front + 3/4)
wire_mat = bpy.data.materials.new("WireDark")
wire_mat.use_nodes = True
wb = wire_mat.node_tree.nodes["Principled BSDF"]
wb.inputs["Base Color"].default_value = (0.05, 0.15, 0.35, 1.0)
wb.inputs["Roughness"].default_value = 0.9

wire = obj.copy()
wire.data = obj.data.copy()
wire.name = "MannequinWire"
sc.collection.objects.link(wire)
wire.data.materials.clear()
wire.data.materials.append(wire_mat)
mod = wire.modifiers.new("Wire", 'WIREFRAME')
mod.thickness = 0.0032
mod.use_replace = True

for name, az in (("wireframe_front", 0), ("wireframe_three_quarter", 38)):
    set_azimuth(az)
    render(os.path.join(OUT, name + ".png"))

print("RENDER_OK")
