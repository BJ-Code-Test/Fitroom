"""Assemble the turntable PNG sequence into a preview MP4 (30 fps, H.264)."""
import bpy, os

ROOT = r"D:\FitRoom"
PNG_DIR = os.path.join(ROOT, "assets", "blender", "turntable_png")
OUT = os.path.join(ROOT, "assets", "blender", "mannequin_turntable.mp4")

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.resolution_x = 900
sc.render.resolution_y = 1260
sc.render.resolution_percentage = 100
sc.render.fps = 30
sc.render.fps_base = 1.0
sc.frame_start = 1
sc.frame_end = 120
sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'

sc.sequence_editor_create()
files = sorted(f for f in os.listdir(PNG_DIR) if f.endswith(".png"))
assert len(files) == 120, len(files)
se = sc.sequence_editor
coll = se.strips if hasattr(se, "strips") else se.sequences
strip = coll.new_image(
    name="turntable", filepath=os.path.join(PNG_DIR, files[0]),
    channel=1, frame_start=1)
for f in files[1:]:
    strip.elements.append(f)

if hasattr(sc.render.image_settings, "media_type"):
    sc.render.image_settings.media_type = 'VIDEO'
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format = 'MPEG4'
sc.render.ffmpeg.codec = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.ffmpeg_preset = 'GOOD'
sc.render.ffmpeg.gopsize = 12
sc.render.filepath = OUT[:-4]
bpy.ops.render.render(animation=True)

# Blender appends the frame range to the filename; move it into place.
numbered = OUT[:-4] + "0001-0120.mp4"
if os.path.isfile(numbered):
    if os.path.isfile(OUT):
        os.remove(OUT)
    os.rename(numbered, OUT)
print("MP4 %s %d bytes" % (OUT, os.path.getsize(OUT)))
print("MP4_OK")
