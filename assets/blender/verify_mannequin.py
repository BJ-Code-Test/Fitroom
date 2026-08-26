"""Programmatic acceptance check for the FitRoom mannequin.

Run:  D:\\Blender\\blender.exe -b mannequin.blend --python verify_mannequin.py
Prints VERIFY_OK on the last line only if every check passes.
"""
import bpy, bmesh, math, os, sys
from collections import defaultdict

FAIL = []


def ck(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        FAIL.append(msg)


objs = [o for o in bpy.data.objects if o.type == 'MESH']
ck(len(objs) == 1, "exactly one mesh object (found %d)" % len(objs))
obj = bpy.data.objects.get("Mannequin")
ck(obj is not None, "object named 'Mannequin' exists")
me = obj.data

bm = bmesh.new()
bm.from_mesh(me)
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()

nv, nf = len(bm.verts), len(bm.faces)
quads = sum(1 for f in bm.faces if len(f.verts) == 4)
tris3 = sum(1 for f in bm.faces if len(f.verts) == 3)
ngons = sum(1 for f in bm.faces if len(f.verts) > 4)
tri_count = sum(len(f.verts) - 2 for f in bm.faces)
nonman = [e for e in bm.edges if not e.is_manifold]
loose_e = [e for e in bm.edges if len(e.link_faces) == 0]
loose_v = [v for v in bm.verts if len(v.link_edges) == 0]

print("COUNT verts=%d faces=%d quads=%d tris=%d ngons=%d tri_count=%d"
      % (nv, nf, quads, tris3, ngons, tri_count))
print("COUNT quad_share=%.2f%%  tri_share=%.2f%%  ngon_share=%.2f%%"
      % (100.0 * quads / nf, 100.0 * tris3 / nf, 100.0 * ngons / nf))

ck(ngons == 0, "NGONS 0")
ck(len(nonman) == 0, "NONMANIFOLD 0 (found %d)" % len(nonman))
ck(len(loose_e) == 0, "LOOSE edges 0 (found %d)" % len(loose_e))
ck(len(loose_v) == 0, "LOOSE verts 0 (found %d)" % len(loose_v))
ck(12000 <= tri_count <= 30000, "TRIS_IN_BUDGET %d in 12000..30000" % tri_count)

# duplicate vertices
seen = {}
dups = 0
for v in bm.verts:
    k = (round(v.co.x, 6), round(v.co.y, 6), round(v.co.z, 6))
    if k in seen:
        dups += 1
    seen[k] = 1
ck(dups == 0, "DUPLICATE verts 0 (found %d)" % dups)

# single connected component
comp = 0
unvisited = set(range(nv))
while unvisited:
    comp += 1
    stack = [unvisited.pop()]
    while stack:
        i = stack.pop()
        for e in bm.verts[i].link_edges:
            j = e.other_vert(bm.verts[i]).index
            if j in unvisited:
                unvisited.discard(j)
                stack.append(j)
ck(comp == 1, "CONNECTED components 1 (found %d)" % comp)

# normals outward: volume via divergence theorem must be positive
vol = 0.0
for f in bm.faces:
    vs = f.verts
    for k in range(1, len(vs) - 1):
        a, b, c = vs[0].co, vs[k].co, vs[k + 1].co
        vol += a.dot(b.cross(c)) / 6.0
ck(vol > 0, "NORMALS outward (signed volume %.5f m3)" % vol)
print("INFO volume=%.5f m3" % abs(vol))

# bounding box / height / origin
xs = [v.co.x for v in bm.verts]
ys = [v.co.y for v in bm.verts]
zs = [v.co.z for v in bm.verts]
h = max(zs) - min(zs)
print("BBOX x=%.4f..%.4f y=%.4f..%.4f z=%.4f..%.4f" %
      (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)))
print("SIZE %.4f x %.4f x %.4f m" % (max(xs) - min(xs), max(ys) - min(ys), h))
ck(abs(h - 1.78) < 5e-4, "HEIGHT_OK %.5f m" % h)
ck(abs(min(zs)) < 1e-6, "ORIGIN_OK soles at z=%.6f" % min(zs))
ck(abs(obj.location.x) < 1e-9 and abs(obj.location.y) < 1e-9
   and abs(obj.location.z) < 1e-9, "object origin at world origin")
ck(abs(max(xs) + min(xs)) < 1e-4, "bbox centred on x=0")

# symmetry about the YZ plane
key = {}
for v in bm.verts:
    key[(round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5))] = 1
miss = 0
for v in bm.verts:
    if (round(-v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5)) not in key:
        miss += 1
ck(miss == 0, "SYMMETRY_OK mirrored partner missing for %d verts" % miss)

# feet on the ground
ground = [v for v in bm.verts if v.co.z < 1e-6]
ck(len(ground) >= 40, "sole vertices on z=0: %d" % len(ground))

# ---------------- measurement loops
TARGET = [("loop_hip", 0.930), ("loop_waist", 1.100), ("loop_chest", 1.270),
          ("loop_shoulder", 1.420), ("loop_knee", 0.500), ("loop_ankle", 0.090)]
gidx = {g.name: g.index for g in obj.vertex_groups}
loops_ok = True
print("LOOPS name            z(m)     verts  closed  planar  circumference(m)")
for name, zt in TARGET:
    if name not in gidx:
        loops_ok = False
        print("  MISSING %s" % name)
        continue
    gi = gidx[name]
    idxs = [v.index for v in me.vertices
            if any(g.group == gi for g in v.groups)]
    S = set(idxs)
    # closed: every member has exactly two neighbours inside the set
    degs = []
    for i in idxs:
        d = sum(1 for e in bm.verts[i].link_edges
                if e.other_vert(bm.verts[i]).index in S)
        degs.append(d)
    closed = all(d == 2 for d in degs) and len(idxs) > 0
    planar = max(abs(bm.verts[i].co.z - zt) for i in idxs) < 1e-6
    # circumference: walk the loop
    circ = 0.0
    if closed:
        start = idxs[0]
        prev, cur = None, start
        for _ in range(len(idxs)):
            nbs = [e.other_vert(bm.verts[cur]).index
                   for e in bm.verts[cur].link_edges
                   if e.other_vert(bm.verts[cur]).index in S]
            nxt = nbs[0] if nbs[0] != prev else nbs[1]
            circ += (bm.verts[cur].co - bm.verts[nxt].co).length
            prev, cur = cur, nxt
    # knee/ankle are two separate rings (one per leg)
    n_rings = 2 if name in ("loop_knee", "loop_ankle") else 1
    if n_rings == 2:
        closed = all(d == 2 for d in degs) and len(idxs) > 0
        circ = 0.0
        for e in bm.edges:
            a, b = e.verts[0].index, e.verts[1].index
            if a in S and b in S:
                circ += (e.verts[0].co - e.verts[1].co).length
        circ /= 2.0
    print("  %-16s %.4f   %3d    %-6s  %-6s  %.4f"
          % (name, zt, len(idxs), closed, planar, circ))
    if not (closed and planar):
        loops_ok = False
ck(loops_ok, "LOOPS_OK all measurement loops closed and horizontal")

# ---------------- material
mats = [m for m in me.materials if m]
ck(len(mats) == 1 and mats[0].name == "Mannequin_White",
   "MATERIAL_OK single material 'Mannequin_White' (%s)"
   % [m.name for m in mats])
if mats:
    b = mats[0].node_tree.nodes.get("Principled BSDF")
    if b:
        bc = b.inputs["Base Color"].default_value
        print("INFO base_color=(%.2f,%.2f,%.2f) roughness=%.2f metallic=%.2f"
              % (bc[0], bc[1], bc[2], b.inputs["Roughness"].default_value,
                 b.inputs["Metallic"].default_value))

# ---------------- UV overlap (rasterised)
ck(len(me.uv_layers) >= 1, "UV layer present")
if me.uv_layers:
    uvl = me.uv_layers.active.data
    N = 1024
    cover = defaultdict(int)
    outside = 0
    total_area = 0.0
    for poly in me.polygons:
        ls = list(poly.loop_indices)
        pts = [uvl[li].uv for li in ls]
        for p in pts:
            if p.x < -1e-4 or p.x > 1 + 1e-4 or p.y < -1e-4 or p.y > 1 + 1e-4:
                outside += 1
        for k in range(1, len(pts) - 1):
            a, b, c = pts[0], pts[k], pts[k + 1]
            total_area += abs((b.x - a.x) * (c.y - a.y)
                              - (c.x - a.x) * (b.y - a.y)) * 0.5
            minx = max(0, int(min(a.x, b.x, c.x) * N))
            maxx = min(N - 1, int(max(a.x, b.x, c.x) * N))
            miny = max(0, int(min(a.y, b.y, c.y) * N))
            maxy = min(N - 1, int(max(a.y, b.y, c.y) * N))
            for px in range(minx, maxx + 1):
                for py in range(miny, maxy + 1):
                    ux = (px + 0.5) / N
                    uy = (py + 0.5) / N
                    d1 = (ux - b.x) * (a.y - b.y) - (a.x - b.x) * (uy - b.y)
                    d2 = (ux - c.x) * (b.y - c.y) - (b.x - c.x) * (uy - c.y)
                    d3 = (ux - a.x) * (c.y - a.y) - (c.x - a.x) * (uy - a.y)
                    neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
                    pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
                    if not (neg and pos):
                        cover[(px, py)] += 1
    filled = len(cover)
    multi = sum(1 for v in cover.values() if v > 1)
    frac = 100.0 * multi / max(1, filled)
    print("UV islands cover %d/%d texels, %d multi-covered (%.3f%%), "
          "uv_area=%.4f, verts_outside_0_1=%d"
          % (filled, N * N, multi, frac, total_area, outside))
    ck(frac < 1.0, "UV_OK overlap %.3f%% of covered texels (< 1%%)" % frac)
    ck(outside == 0, "UVs inside the 0..1 square")

# ---------------- GLB
glb = r"D:\FitRoom\public\models\mannequin.glb"
ok = os.path.isfile(glb)
ck(ok, "GLB exists at %s" % glb)
if ok:
    print("INFO glb_size=%d bytes (%.1f KB)" % (os.path.getsize(glb),
                                                os.path.getsize(glb) / 1024.0))

bm.free()
print("")
if FAIL:
    print("VERIFY_FAILED %d checks" % len(FAIL))
    for m in FAIL:
        print("   - " + m)
else:
    print("VERIFY_OK")
