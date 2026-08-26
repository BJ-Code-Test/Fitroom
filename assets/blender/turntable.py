"""120-frame scroll turntable for the FitRoom landing page.

  - 900x1260 RGBA, transparent film, no floor / no shadow catcher
  - frame 001 = front (0 deg), 3 deg per frame, last frame = 357 deg
  - PNG   -> assets/blender/turntable_png/0001.png ...
  - WebP  -> public/sequence/mannequin/0001.webp ...
  - contact sheet of every 10th frame
"""
import bpy, math, os, sys
import numpy as np
from mathutils import Vector

ROOT = r"D:\FitRoom"
BLEND = os.path.join(ROOT, "assets", "blender", "mannequin.blend")
PNG_DIR = os.path.join(ROOT, "assets", "blender", "turntable_png")
WEBP_DIR = os.path.join(ROOT, "public", "sequence", "mannequin")
CONTACT = os.path.join(ROOT, "assets", "blender", "turntable_contact.png")
os.makedirs(PNG_DIR, exist_ok=True)
os.makedirs(WEBP_DIR, exist_ok=True)

FRAMES = 120
STEP_DEG = 3.0
RES_X, RES_Y = 900, 1260
WEBP_QUALITY = 82

DO_RENDER = "--no-render" not in sys.argv

bpy.ops.wm.open_mainfile(filepath=BLEND)
obj = bpy.data.objects["Mannequin"]

sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x = RES_X
sc.render.resolution_y = RES_Y
sc.render.resolution_percentage = 100
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.image_settings.color_depth = '8'
sc.render.image_settings.compression = 25
if hasattr(sc.eevee, "taa_render_samples"):
    sc.eevee.taa_render_samples = 64
for attr in ("use_gtao", "use_raytracing", "use_shadows"):
    if hasattr(sc.eevee, attr):
        setattr(sc.eevee, attr, True)
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'None'

world = bpy.data.worlds.new("TurntableWorld")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.70, 0.73, 0.78, 1.0)
bg.inputs[1].default_value = 0.80

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 120.0
cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 36.0
cam = bpy.data.objects.new("Cam", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam
TARGET = Vector((0.0, 0.0, 0.89))
DIST = 6.6
cam.location = (0.0, -DIST, TARGET.z)
cam.rotation_euler = (TARGET - Vector(cam.location)).to_track_quat(
    '-Z', 'Y').to_euler()


def make_area(name, loc, energy, size, aim=Vector((0, 0, 1.05))):
    d = bpy.data.lights.new(name, type='AREA')
    d.energy = energy
    d.size = size
    o = bpy.data.objects.new(name, d)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (aim - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o


make_area("Key", (-2.6, -3.2, 3.1), 300, 2.8)
make_area("Fill", (3.1, -2.4, 1.5), 150, 3.2)
make_area("Rim", (1.4, 3.4, 2.9), 220, 2.6)
make_area("Top", (0.0, -0.6, 4.3), 90, 3.5, Vector((0, 0, 1.4)))

# ------------------------------------------------------------------ render
if DO_RENDER:
    for i in range(FRAMES):
        obj.rotation_euler = (0.0, 0.0, math.radians(i * STEP_DEG))
        sc.render.filepath = os.path.join(PNG_DIR, "%04d" % (i + 1))
        bpy.ops.render.render(write_still=True)
        if (i + 1) % 20 == 0:
            print("RENDERED %d/%d" % (i + 1, FRAMES))
    print("RENDER_DONE")

# ------------------------------------------------------------------ webp
sizes = []
for i in range(FRAMES):
    src = os.path.join(PNG_DIR, "%04d.png" % (i + 1))
    img = bpy.data.images.load(src, check_existing=False)
    s = img.image_settings if hasattr(img, "image_settings") else None
    st = sc.render.image_settings
    prev = (st.file_format, st.quality, st.color_mode)
    st.file_format = 'WEBP'
    st.quality = WEBP_QUALITY
    st.color_mode = 'RGBA'
    dst = os.path.join(WEBP_DIR, "%04d.webp" % (i + 1))
    img.save_render(filepath=dst, scene=sc)
    st.file_format, st.quality, st.color_mode = prev
    sizes.append(os.path.getsize(dst))
    bpy.data.images.remove(img)

total = sum(sizes)
print("WEBP frames=%d total=%d bytes (%.2f MB) avg=%d bytes (%.1f KB) max=%d"
      % (len(sizes), total, total / 1048576.0, total // len(sizes),
         total / len(sizes) / 1024.0, max(sizes)))

# ------------------------------------------------- bounds check (alpha bbox)
worst = None
for i in range(0, FRAMES, 5):
    src = os.path.join(PNG_DIR, "%04d.png" % (i + 1))
    img = bpy.data.images.load(src, check_existing=False)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    a = px[:, :, 3] > 0.02
    rows = np.where(a.any(axis=1))[0]
    cols = np.where(a.any(axis=0))[0]
    r0, r1, c0, c1 = rows.min(), rows.max(), cols.min(), cols.max()
    margin = min(r0, h - 1 - r1, c0, w - 1 - c1)
    cxx = 0.5 * (c0 + c1)
    if worst is None or margin < worst[1]:
        worst = (i + 1, margin)
    print("BOUNDS frame=%04d rows=%d..%d cols=%d..%d margin=%d centre_x=%.1f"
          % (i + 1, r0, r1, c0, c1, margin, cxx))
    bpy.data.images.remove(img)
print("BOUNDS_WORST frame=%04d margin=%d px" % worst)

# ------------------------------------------------------------ contact sheet
COLS, ROWS = 4, 3
TW, TH = RES_X // 4, RES_Y // 4
sheet = np.zeros((TH * ROWS, TW * COLS, 4), dtype=np.float32)
sheet[:, :, 0:3] = 0.30
sheet[:, :, 3] = 1.0
picks = [1 + 10 * k for k in range(COLS * ROWS)]
for n, fr in enumerate(picks):
    img = bpy.data.images.load(os.path.join(PNG_DIR, "%04d.png" % fr),
                               check_existing=False)
    img.scale(TW, TH)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(TH, TW, 4)
    a = px[:, :, 3:4]
    r = ROWS - 1 - (n // COLS)
    c = n % COLS
    dst = sheet[r * TH:(r + 1) * TH, c * TW:(c + 1) * TW, :]
    dst[:, :, 0:3] = px[:, :, 0:3] * a + dst[:, :, 0:3] * (1 - a)
    bpy.data.images.remove(img)
    # frame marker: 4px bar whose length encodes the angle
    ang = (fr - 1) * STEP_DEG
    bl = int(4 + (TW - 8) * ang / 360.0)
    sheet[r * TH + 4:r * TH + 10, c * TW + 4:c * TW + 4 + bl, 0:3] = (
        np.array([0.95, 0.55, 0.10], dtype=np.float32))

out = bpy.data.images.new("contact", TW * COLS, TH * ROWS, alpha=True)
out.pixels = sheet.reshape(-1)
out.file_format = 'PNG'
out.filepath_raw = CONTACT
out.save()
print("CONTACT %s %dx%d frames=%s" % (CONTACT, TW * COLS, TH * ROWS, picks))
print("TURNTABLE_OK")
