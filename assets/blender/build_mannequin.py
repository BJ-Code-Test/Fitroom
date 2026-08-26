"""FitRoom - procedural shop-window mannequin.

Run:  D:\\Blender\\blender.exe --background --python build_mannequin.py

Builds an all-quad, manifold, symmetric mannequin (1.78 m), writes
  assets/blender/mannequin.blend  and  public/models/mannequin.glb
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath or __file__))
if HERE not in sys.path:
    sys.path.append(HERE)
if not os.path.isfile(os.path.join(HERE, "mannequin_lib.py")):
    HERE = r"D:\FitRoom\assets\blender"
    sys.path.append(HERE)
import importlib
import mannequin_lib
importlib.reload(mannequin_lib)
from mannequin_lib import (Profile, ring_z, uniform_phis, smoothstep,
                           lerp_angle_list, pchip)

ROOT = r"D:\FitRoom"
OUT_BLEND = os.path.join(ROOT, "assets", "blender", "mannequin.blend")
OUT_GLB = os.path.join(ROOT, "public", "models", "mannequin.glb")

# ============================================================ parameters
H = 1.78
N_T = 48          # torso ring resolution
N_LEG = 24
N_ARM = 24
DZ = 0.0125       # torso ring spacing

Z_BOT = 0.815     # pelvis underside ring
Z_HEAD_LAST = 1.730

# measurement loops (documented in the report)
Z_HIP = 0.930
Z_WAIST = 1.100
Z_CHEST = 1.270
Z_SHOULDER = 1.420
Z_KNEE = 0.500
Z_ANKLE = 0.090

# head ellipsoid (used for the crown cap)
HEAD_A, HEAD_B = 0.077, 0.095
HEAD_CY, HEAD_ZC, HEAD_HH = 0.009, 1.690, 0.090

# ---------------------------------------------------------- torso profile
# (z, a, bf, bb, n, cx, cy)
TORSO = [
    (0.815, 0.1700, 0.0830, 0.0880, 2.35, 0.0, 0.000),
    (0.845, 0.1720, 0.0900, 0.1045, 2.40, 0.0, 0.000),
    (0.880, 0.1750, 0.1000, 0.1285, 2.45, 0.0, 0.000),
    (0.930, 0.1760, 0.1080, 0.1470, 2.45, 0.0, 0.000),   # HIP
    (0.970, 0.172, 0.107, 0.142, 2.45, 0.0, 0.000),
    (1.010, 0.164, 0.105, 0.130, 2.42, 0.0, 0.000),
    (1.050, 0.152, 0.102, 0.115, 2.38, 0.0, 0.000),
    (1.100, 0.136, 0.098, 0.100, 2.35, 0.0, 0.000),   # WAIST
    (1.140, 0.138, 0.100, 0.099, 2.35, 0.0, 0.000),
    (1.180, 0.144, 0.106, 0.101, 2.33, 0.0, 0.000),
    (1.230, 0.150, 0.117, 0.106, 2.30, 0.0, 0.000),
    (1.270, 0.1530, 0.1260, 0.1120, 2.28, 0.0, 0.000),   # CHEST
    (1.310, 0.1570, 0.1245, 0.1140, 2.29, 0.0, 0.000),
    (1.353, 0.1580, 0.1170, 0.1125, 2.31, 0.0, 0.000),   # arm attach level
    (1.390, 0.1570, 0.1085, 0.1090, 2.33, 0.0, 0.000),
    (1.405, 0.1545, 0.1040, 0.1060, 2.34, 0.0, 0.000),
    (1.420, 0.1480, 0.0985, 0.1010, 2.32, 0.0, 0.001),   # SHOULDER
    (1.435, 0.1290, 0.0910, 0.0950, 2.26, 0.0, 0.003),
    (1.455, 0.1000, 0.0780, 0.0850, 2.18, 0.0, 0.005),
    (1.475, 0.0760, 0.0650, 0.0740, 2.12, 0.0, 0.008),
    (1.495, 0.0620, 0.0560, 0.0680, 2.08, 0.0, 0.010),
    (1.515, 0.0560, 0.0510, 0.0670, 2.06, 0.0, 0.012),
    (1.535, 0.0545, 0.0505, 0.0690, 2.06, 0.0, 0.013),
    (1.552, 0.0560, 0.0555, 0.0740, 2.08, 0.0, 0.013),
    (1.570, 0.0620, 0.0650, 0.0800, 2.08, 0.0, 0.012),
    (1.590, 0.0670, 0.0740, 0.0840, 2.06, 0.0, 0.011),
    (1.615, 0.0700, 0.0820, 0.0870, 2.04, 0.0, 0.010),
    (1.640, 0.0715, 0.0870, 0.0885, 2.02, 0.0, 0.009),
    (1.660, 0.0726, 0.0896, 0.0896, 2.00, 0.0, 0.009),
    (1.690, 0.0770, 0.0950, 0.0950, 2.00, 0.0, 0.009),
    (1.710, 0.0751, 0.0926, 0.0926, 2.00, 0.0, 0.009),
    (1.730, 0.0690, 0.0851, 0.0851, 2.00, 0.0, 0.009),
]
P_TORSO = Profile(TORSO)

# ------------------------------------------------------------ leg profile
LEG = [
    (0.000, 0.046, 0.147, 0.098, 4.00, -0.104, -0.047),
    (0.008, 0.048, 0.153, 0.103, 3.80, -0.104, -0.048),
    (0.020, 0.047, 0.148, 0.100, 3.40, -0.104, -0.045),
    (0.032, 0.044, 0.128, 0.092, 3.00, -0.104, -0.036),
    (0.046, 0.039, 0.096, 0.078, 2.70, -0.104, -0.022),
    (0.060, 0.035, 0.062, 0.058, 2.45, -0.105, -0.008),
    (0.075, 0.033, 0.041, 0.048, 2.35, -0.105, 0.000),
    (0.090, 0.032, 0.031, 0.039, 2.30, -0.105, 0.002),   # ANKLE
    (0.120, 0.034, 0.031, 0.036, 2.30, -0.1048, 0.001),
    (0.180, 0.038, 0.034, 0.039, 2.30, -0.1044, 0.000),
    (0.240, 0.043, 0.038, 0.045, 2.30, -0.1040, 0.000),
    (0.300, 0.049, 0.043, 0.054, 2.32, -0.1035, 0.000),
    (0.360, 0.056, 0.048, 0.067, 2.35, -0.1025, 0.000),
    (0.400, 0.059, 0.051, 0.073, 2.38, -0.1018, 0.000),  # calf max
    (0.430, 0.058, 0.053, 0.069, 2.38, -0.1012, 0.000),
    (0.470, 0.056, 0.055, 0.060, 2.36, -0.1002, 0.000),
    (0.500, 0.058, 0.058, 0.058, 2.34, -0.0995, 0.000),  # KNEE
    (0.545, 0.065, 0.062, 0.064, 2.36, -0.0983, 0.000),
    (0.600, 0.075, 0.070, 0.073, 2.38, -0.0962, 0.000),
    (0.650, 0.081, 0.075, 0.081, 2.40, -0.0942, 0.000),
    (0.700, 0.085, 0.079, 0.086, 2.40, -0.0922, 0.000),
    (0.750, 0.087, 0.082, 0.089, 2.40, -0.0902, 0.000),
    (0.790, 0.086, 0.082, 0.089, 2.42, -0.0885, 0.000),
    (0.815, 0.083, 0.081, 0.086, 2.45, -0.0878, 0.000),
]
P_LEG = Profile(LEG)

# ------------------------------------------------------------ arm profile
# built in T-pose: 'a' = extent along +/-Z (becomes medial-lateral after the
# shoulder rotation), 'bf'/'bb' = front / back extent.
ARM_ATTACH = (0.166, 0.0, 1.353)
ARM_LEN = 0.741
ARM_ANGLE = math.radians(77.0)   # rotation from T-pose -> 13 deg A-pose
ARM_FALLOFF = 0.078

ARM = [
    (0.000, 0.054, 0.058, 0.058, 2.10, 0.0, 0.0),
    (0.030, 0.054, 0.057, 0.057, 2.10, 0.0, 0.0),
    (0.070, 0.053, 0.054, 0.054, 2.10, 0.0, 0.0),
    (0.120, 0.051, 0.051, 0.051, 2.10, 0.0, 0.0),
    (0.200, 0.049, 0.049, 0.049, 2.10, 0.0, 0.0),
    (0.300, 0.046, 0.046, 0.046, 2.12, 0.0, 0.0),
    (0.398, 0.043, 0.043, 0.044, 2.20, 0.0, 0.0),   # elbow
    (0.460, 0.044, 0.043, 0.043, 2.20, 0.0, 0.0),
    (0.550, 0.041, 0.040, 0.039, 2.20, 0.0, 0.0),
    (0.650, 0.034, 0.034, 0.032, 2.22, 0.0, 0.0),
    (0.700, 0.029, 0.031, 0.029, 2.25, 0.0, 0.0),
    (0.756, 0.021, 0.028, 0.026, 2.30, 0.0, 0.0),   # wrist
    (0.810, 0.021, 0.038, 0.032, 2.50, 0.0, 0.0),
    (0.870, 0.018, 0.045, 0.036, 2.60, 0.0, 0.0),
    (0.930, 0.017, 0.044, 0.035, 2.70, 0.0, 0.0),
    (0.970, 0.015, 0.036, 0.029, 2.80, 0.0, 0.0),
    (1.000, 0.009, 0.017, 0.014, 2.50, 0.0, 0.0),
]
P_ARM = Profile(ARM)

# ============================================================ mesh buffers
V = []
F = []
TAG = {}          # vert index -> tag string


def addv(p, tag=None):
    V.append([float(p[0]), float(p[1]), float(p[2])])
    i = len(V) - 1
    if tag:
        TAG[i] = tag
    return i


def add_ring(pts, tag=None):
    return [addv(p, tag) for p in pts]


def bridge(a, b):
    """Quads between two closed loops of equal length (same orientation)."""
    n = len(a)
    assert n == len(b)
    for j in range(n):
        k = (j + 1) % n
        F.append((a[j], a[k], b[k], b[j]))


def bridge_open(a, b):
    for j in range(len(a) - 1):
        F.append((a[j], a[j + 1], b[j + 1], b[j]))


# ------------------------------------------------------------- Coons cap
def coons_grid(loop, m, warp_p=1.0, warp_axis='s'):
    """Return (m+1)x(m+1) array of positions; boundary == loop exactly.

    loop is ordered so that
        grid[u][0]   = loop[u]              u = 0..m
        grid[m][v]   = loop[m+v]            v = 0..m
        grid[u][m]   = loop[(3m-u) % 4m]
        grid[0][v]   = loop[(4m-v) % 4m]
    """
    L = len(loop)
    assert L == 4 * m

    def sample(idx0, idx1, t):
        """continuous sample along loop from idx0 to idx1 (m steps), t in 0..1"""
        x = t * m
        i = int(math.floor(x))
        if i >= m:
            i = m - 1
        f = x - i
        ia = loop[(idx0 + i * (1 if idx1 > idx0 else -1)) % L]
        ib = loop[(idx0 + (i + 1) * (1 if idx1 > idx0 else -1)) % L]
        return [ia[k] + f * (ib[k] - ia[k]) for k in range(3)]

    def bot(s):
        return sample(0, m, s)

    def rig(t):
        return sample(m, 2 * m, t)

    def top(s):
        return sample(3 * m, 2 * m, s)

    def lef(t):
        return sample(4 * m, 3 * m, t)

    P00, P10 = loop[0], loop[m]
    P11, P01 = loop[2 * m], loop[3 * m]

    def warp(s):
        un = 2.0 * s - 1.0
        w = math.copysign(abs(un) ** warp_p, un) if un != 0.0 else 0.0
        return 0.5 * (w + 1.0)

    grid = [[None] * (m + 1) for _ in range(m + 1)]
    for u in range(m + 1):
        for v in range(m + 1):
            s, t = u / m, v / m
            se, te = s, t
            if warp_p != 1.0:
                fade_t = math.sin(math.pi * t)
                fade_s = math.sin(math.pi * s)
                if warp_axis in ('s', 'both'):
                    se = s + fade_t * (warp(s) - s)
                if warp_axis in ('t', 'both'):
                    te = t + fade_s * (warp(t) - t)
            b, tp, l, r = bot(se), top(se), lef(te), rig(te)
            p = []
            for k in range(3):
                val = ((1 - te) * b[k] + te * tp[k] + (1 - se) * l[k] + se * r[k]
                       - ((1 - se) * (1 - te) * P00[k] + se * (1 - te) * P10[k]
                          + (1 - se) * te * P01[k] + se * te * P11[k]))
                p.append(val)
            grid[u][v] = p
    return grid


def loop_from_ring(ring_idx, m, start):
    """Reorder a closed ring of 4m indices so index 0 is at `start`."""
    L = len(ring_idx)
    return [ring_idx[(start + k) % L] for k in range(L)]


# ============================================================ torso stack
def build_torso():
    n_int = 74
    step = (Z_HEAD_LAST - Z_BOT) / n_int
    zs = [Z_BOT + i * step for i in range(n_int + 1)]
    for lm in (Z_HIP, Z_WAIST, Z_CHEST, Z_SHOULDER):
        i = min(range(len(zs)), key=lambda k: abs(zs[k] - lm))
        zs[i] = lm
    phis = uniform_phis(N_T)
    rings = []
    for z in zs:
        tag = None
        if abs(z - Z_HIP) < 1e-9: tag = 'loop_hip'
        elif abs(z - Z_WAIST) < 1e-9: tag = 'loop_waist'
        elif abs(z - Z_CHEST) < 1e-9: tag = 'loop_chest'
        elif abs(z - Z_SHOULDER) < 1e-9: tag = 'loop_shoulder'
        rings.append(add_ring(ring_z(P_TORSO, z, phis), tag))
    return zs, rings


ZS_T, RINGS_T = build_torso()

# arm hole: 6 face-rows x 6 face-cols, right side centred on j = N_T/4
I_TOP = min(range(len(ZS_T)), key=lambda k: abs(ZS_T[k] - 1.396))
I_BOT = I_TOP - 6
J0_R = N_T // 4 - 3          # 9
J1_R = N_T // 4 + 3          # 15
ARM_ATTACH = (0.166, 0.0, 0.5 * (ZS_T[I_BOT] + ZS_T[I_TOP]))

hole_faces = set()
for i in range(I_BOT, I_TOP):
    for j in range(J0_R, J1_R):
        hole_faces.add((i, j % N_T))
        hole_faces.add((i, (N_T - 1 - j) % N_T))   # mirrored column

for i in range(len(RINGS_T) - 1):
    a, b = RINGS_T[i], RINGS_T[i + 1]
    for j in range(N_T):
        if (i, j) in hole_faces:
            continue
        k = (j + 1) % N_T
        F.append((a[j], a[k], b[k], b[j]))


# ------------------------------------------------------------- head crown
def build_head_cap():
    m = N_T // 4
    loop_idx = loop_from_ring(RINGS_T[-1], m, (N_T - m // 2) % N_T)
    loop_pos = [V[i] for i in loop_idx]
    grid_pos = coons_grid(loop_pos, m)
    zl = ZS_T[-1]
    grid = [[None] * (m + 1) for _ in range(m + 1)]
    for u in range(m + 1):
        for v in range(m + 1):
            if u == 0 or v == 0 or u == m or v == m:
                continue
            x, y, _ = grid_pos[u][v]
            g = math.sqrt((x / HEAD_A) ** 2 + ((y - HEAD_CY) / HEAD_B) ** 2)
            g = min(1.0, g)
            z = HEAD_ZC + HEAD_HH * math.sqrt(max(0.0, 1.0 - g * g))
            grid[u][v] = addv((x, y, max(z, zl)))
    for u in range(m + 1):
        grid[u][0] = loop_idx[u]
        grid[m][u] = loop_idx[m + u]
        grid[u][m] = loop_idx[(3 * m - u) % (4 * m)]
        grid[0][u] = loop_idx[(4 * m - u) % (4 * m)]
    for u in range(m):
        for v in range(m):
            F.append((grid[u][v], grid[u + 1][v], grid[u + 1][v + 1], grid[u][v + 1]))


build_head_cap()


# ------------------------------------------------- pelvis underside + legs
M_P = N_T // 4                       # 12
LEG_U0, LEG_U1 = 0, 5                # vertex columns of the left leg hole
LEG_V0, LEG_V1 = 2, 9                # vertex rows

_loop_idx = loop_from_ring(RINGS_T[0], M_P, (N_T - M_P // 2) % N_T)
_loop_pos = [V[i] for i in _loop_idx]
_gp = coons_grid(_loop_pos, M_P, warp_p=1.35, warp_axis='s')

_X0 = P_TORSO.a(Z_BOT) * 1.02
_YF, _YB = P_TORSO.bf(Z_BOT), P_TORSO.bb(Z_BOT)
_Y0 = (_YF + _YB) * 0.5 * 1.04
_YC = (_YB - _YF) * 0.5
LIFT = 0.030

GRID_P = [[None] * (M_P + 1) for _ in range(M_P + 1)]
for u in range(M_P + 1):
    for v in range(M_P + 1):
        if u in (0, M_P) or v in (0, M_P):
            continue
        x, y, z = _gp[u][v]
        fx = max(0.0, 1.0 - (abs(x) / _X0) ** 2.0) ** 1.2
        fy = max(0.0, 1.0 - (abs(y - _YC) / _Y0) ** 2.0) ** 0.8
        GRID_P[u][v] = addv((x, y, z + LIFT * fx * fy))
for u in range(M_P + 1):
    GRID_P[u][0] = _loop_idx[u]
    GRID_P[M_P][u] = _loop_idx[M_P + u]
    GRID_P[u][M_P] = _loop_idx[(3 * M_P - u) % (4 * M_P)]
    GRID_P[0][u] = _loop_idx[(4 * M_P - u) % (4 * M_P)]

leg_hole_faces = set()
for u in range(LEG_U0, LEG_U1):
    for v in range(LEG_V0, LEG_V1):
        leg_hole_faces.add((u, v))
        leg_hole_faces.add((M_P - 1 - u, v))
for u in range(M_P):
    for v in range(M_P):
        if (u, v) in leg_hole_faces:
            continue
        F.append((GRID_P[u][v], GRID_P[u + 1][v],
                  GRID_P[u + 1][v + 1], GRID_P[u][v + 1]))


def order_loop(coords, idx_of, frame):
    """Order a rectangular boundary walk so that it starts near phi=0 and
    phi increases.  frame(pos, centre) -> phi."""
    idxs = [idx_of(c) for c in coords]
    pos = [V[i] for i in idxs]
    cx = sum(p[0] for p in pos) / len(pos)
    cy = sum(p[1] for p in pos) / len(pos)
    cz = sum(p[2] for p in pos) / len(pos)
    phis = [frame(p, (cx, cy, cz)) for p in pos]
    # orientation: signed area in the (cos,sin) plane
    s = 0.0
    for k in range(len(phis)):
        d = phis[(k + 1) % len(phis)] - phis[k]
        while d > math.pi:
            d -= 2 * math.pi
        while d < -math.pi:
            d += 2 * math.pi
        s += d
    if s < 0:
        coords = list(reversed(coords))
        phis = list(reversed(phis))
    k0 = min(range(len(phis)), key=lambda k: abs(math.atan2(math.sin(phis[k]),
                                                            math.cos(phis[k]))))
    n = len(coords)
    coords = [coords[(k0 + k) % n] for k in range(n)]
    phis = [phis[(k0 + k) % n] for k in range(n)]
    base = phis[0]
    out = []
    prev = base
    for p in phis:
        d = p - prev
        while d > math.pi:
            d -= 2 * math.pi
        while d < -math.pi:
            d += 2 * math.pi
        prev = prev + d
        out.append(prev)
    return coords, out


def rect_walk(u0, u1, v0, v1):
    c = []
    for u in range(u0, u1 + 1):
        c.append((u, v0))
    for v in range(v0 + 1, v1 + 1):
        c.append((u1, v))
    for u in range(u1 - 1, u0 - 1, -1):
        c.append((u, v1))
    for v in range(v1 - 1, v0, -1):
        c.append((u0, v))
    return c


def grid_cap_from_ring(ring, m, start, place):
    """Cap a closed ring of 4m verts with an (m+1)^2 quad grid.
    place(x,y,z,g) -> position for interior verts (g = 0..1 radial)."""
    loop_idx = loop_from_ring(ring, m, start)
    loop_pos = [V[i] for i in loop_idx]
    gp = coons_grid(loop_pos, m)
    grid = [[None] * (m + 1) for _ in range(m + 1)]
    for u in range(m + 1):
        for v in range(m + 1):
            if u in (0, m) or v in (0, m):
                continue
            s, t = u / m, v / m
            g = max(abs(2 * s - 1), abs(2 * t - 1))
            grid[u][v] = addv(place(*gp[u][v], g))
    for u in range(m + 1):
        grid[u][0] = loop_idx[u]
        grid[m][u] = loop_idx[m + u]
        grid[u][m] = loop_idx[(3 * m - u) % (4 * m)]
        grid[0][u] = loop_idx[(4 * m - u) % (4 * m)]
    for u in range(m):
        for v in range(m):
            F.append((grid[u][v], grid[u + 1][v], grid[u + 1][v + 1], grid[u][v + 1]))


# ---------------------------------------------------------------- LEGS
LEG_Z = []
_n = 53
for k in range(_n + 1):
    LEG_Z.append(0.800 - k * (0.800 - Z_ANKLE) / _n)
_i = min(range(len(LEG_Z)), key=lambda k: abs(LEG_Z[k] - Z_KNEE))
LEG_Z[_i] = Z_KNEE
LEG_Z += [0.075, 0.060, 0.046, 0.032, 0.020, 0.008, 0.000]

_leg_coords = rect_walk(LEG_U0, LEG_U1, LEG_V0, LEG_V1)
_leg_coords, _leg_phis = order_loop(
    _leg_coords, lambda c: GRID_P[c[0]][c[1]],
    lambda p, c: math.atan2(p[0] - c[0], -(p[1] - c[1])))

_uni = uniform_phis(N_LEG)
_leg_rings_pos = []
for k, z in enumerate(LEG_Z):
    w = smoothstep(0.0, 9.0, k)
    phis = lerp_angle_list(_leg_phis, _uni, w)
    _leg_rings_pos.append(ring_z(P_LEG, z, phis))

LEG_VERTS = []


def build_leg(mirror):
    sgn = -1.0 if mirror else 1.0
    coords = ([(M_P - u, v) for (u, v) in _leg_coords] if mirror else _leg_coords)
    prev = [GRID_P[u][v] for (u, v) in coords]
    for k, ringpos in enumerate(_leg_rings_pos):
        tag = None
        if abs(LEG_Z[k] - Z_KNEE) < 1e-9: tag = 'loop_knee'
        elif abs(LEG_Z[k] - Z_ANKLE) < 1e-9: tag = 'loop_ankle'
        pts = [(sgn * p[0], p[1], p[2]) for p in ringpos]
        cur = add_ring(pts, tag)
        LEG_VERTS.extend(cur)
        bridge(prev, cur)
        prev = cur
    grid_cap_from_ring(prev, N_LEG // 4, N_LEG - N_LEG // 8,
                       lambda x, y, z, g: (x, y, 0.0))


build_leg(False)
build_leg(True)

# ---------------------------------------------------------------- ARMS
ARM_S = [0.012 + k * (1.0 - 0.012) / 47 for k in range(48)]
_arm_coords = rect_walk(I_BOT, I_TOP, J0_R, J1_R)
_arm_coords, _arm_phis = order_loop(
    _arm_coords, lambda c: RINGS_T[c[0]][c[1] % N_T],
    lambda p, c: math.atan2(p[2] - c[2], -(p[1] - c[1])))

_uni_a = uniform_phis(N_ARM)
_arm_rings_pos = []
for k, s in enumerate(ARM_S):
    w = smoothstep(0.0, 7.0, k)
    phis = lerp_angle_list(_arm_phis, _uni_a, w)
    cx = ARM_ATTACH[0] + s * ARM_LEN
    cz = ARM_ATTACH[2]
    pts = []
    for phi in phis:
        r = P_ARM.radius(s, phi)
        pts.append((cx, -r * math.cos(phi), cz + r * math.sin(phi)))
    _arm_rings_pos.append(pts)

ARM_VERTS = []


def build_arm(mirror):
    sgn = -1.0 if mirror else 1.0
    coords = ([(i, (N_T - j) % N_T) for (i, j) in _arm_coords]
              if mirror else _arm_coords)
    prev = [RINGS_T[i][j % N_T] for (i, j) in coords]
    v_start = len(V)
    for ringpos in _arm_rings_pos:
        pts = [(sgn * p[0], p[1], p[2]) for p in ringpos]
        cur = add_ring(pts)
        bridge(prev, cur)
        prev = cur
    tipx = sgn * (ARM_ATTACH[0] + ARM_LEN)
    grid_cap_from_ring(
        prev, N_ARM // 4, N_ARM - N_ARM // 8,
        lambda x, y, z, g: (tipx + sgn * 0.013 * math.sqrt(max(0.0, 1 - g * g)), y, z))
    ARM_VERTS.extend(range(v_start, len(V)))


build_arm(False)
build_arm(True)


# ==================================================== deform: T-pose -> A-pose
def rotate_arms():
    px, pz = ARM_ATTACH[0], ARM_ATTACH[2]
    for i in ARM_SET:
        x, y, z = V[i]
        sgn = 1.0 if x >= 0 else -1.0
        ax = abs(x)
        w = smoothstep(0.0, ARM_FALLOFF, ax - px)
        if w <= 0.0:
            continue
        th = w * ARM_ANGLE
        rx, rz = ax - px, z - pz
        nx = rx * math.cos(th) + rz * math.sin(th)
        nz = -rx * math.sin(th) + rz * math.cos(th)
        V[i] = [sgn * (px + nx), y, pz + nz]


ARM_SET = set(ARM_VERTS)
rotate_arms()


def push_out_of_torso():
    """Keep the upper arm from sinking into the ribcage (armpit contact)."""
    for i in ARM_SET:
        x, y, z = V[i]
        if not (1.10 < z < ZS_T[I_TOP]):
            continue
        a = P_TORSO.a(z); bf = P_TORSO.bf(z); bb = P_TORSO.bb(z); n = P_TORSO.n(z)
        b = bf if y < 0 else bb
        t = (abs(x) / a) ** n + (abs(y) / b) ** n
        if t >= 1.0:
            continue
        f = t ** (-1.0 / n) * 1.004
        V[i] = [x * f, y * f, z]


push_out_of_torso()

# ==================================================== junction smoothing
ADJ = [set() for _ in range(len(V))]
for f in F:
    for k in range(len(f)):
        a, b = f[k], f[(k + 1) % len(f)]
        ADJ[a].add(b); ADJ[b].add(a)

seeds = set()
for (u, v) in _leg_coords:
    seeds.add(GRID_P[u][v]); seeds.add(GRID_P[M_P - u][v])
for (i, j) in _arm_coords:
    seeds.add(RINGS_T[i][j % N_T]); seeds.add(RINGS_T[i][(N_T - j) % N_T])

dist = {s: 0 for s in seeds}
frontier = set(seeds)
for d in range(1, 5):
    nxt = set()
    for v0 in frontier:
        for nb in ADJ[v0]:
            if nb not in dist:
                dist[nb] = d
                nxt.add(nb)
    frontier = nxt

PROTECT = {i for i, t in TAG.items() if t.startswith('loop_')}
PROTECT |= {i for i in range(len(V)) if V[i][2] <= 1e-9}


def taubin(nodes, lam=0.55, mu=-0.58, passes=4):
    for _ in range(passes):
        for f in (lam, mu):
            new = {}
            for i, w0 in nodes.items():
                if i in PROTECT or not ADJ[i]:
                    continue
                sx = sy = sz = 0.0
                for nb in ADJ[i]:
                    sx += V[nb][0]; sy += V[nb][1]; sz += V[nb][2]
                k = len(ADJ[i])
                w = f * w0
                new[i] = [V[i][0] + w * (sx / k - V[i][0]),
                          V[i][1] + w * (sy / k - V[i][1]),
                          V[i][2] + w * (sz / k - V[i][2])]
            for i, p in new.items():
                V[i] = p


taubin({i: 1.0 - 0.18 * d for i, d in dist.items()})

# ==================================================== normalise + symmetry
for i in range(len(V)):
    if abs(V[i][0]) < 1e-7:
        V[i][0] = 0.0
zmin = min(p[2] for p in V)
assert abs(zmin) < 1e-9, zmin
zmax = max(p[2] for p in V)
dz = H - zmax
for i in range(len(V)):
    z = V[i][2]
    if z > 1.60:
        V[i][2] = z + dz * smoothstep(1.60, zmax, z)

# ==================================================== build blender object
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)

me = bpy.data.meshes.new("Mannequin")
me.from_pydata([tuple(p) for p in V], [], [tuple(f) for f in F])
me.validate(verbose=False)
me.update()
obj = bpy.data.objects.new("Mannequin", me)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
loose = [v for v in bm.verts if len(v.link_faces) == 0]
if loose:
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
bm.free()

for p in me.polygons:
    p.use_smooth = True

# ---- material
mat = bpy.data.materials.new("Mannequin_White")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.90, 0.90, 0.90, 1.0)
bsdf.inputs["Roughness"].default_value = 0.45
bsdf.inputs["Metallic"].default_value = 0.0
if "Specular IOR Level" in bsdf.inputs:
    bsdf.inputs["Specular IOR Level"].default_value = 0.4
me.materials.append(mat)

# ---- UVs
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(58.0), island_margin=0.006,
                         correct_aspect=True, scale_to_bounds=False)
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')

# ---- vertex groups for the measurement loops (handy for the web app)
MEASURE_LOOPS = [('loop_hip', Z_HIP), ('loop_waist', Z_WAIST),
                 ('loop_chest', Z_CHEST), ('loop_shoulder', Z_SHOULDER),
                 ('loop_knee', Z_KNEE), ('loop_ankle', Z_ANKLE)]
LOOP_REPORT = []
for name, zt in MEASURE_LOOPS:
    idxs = [v.index for v in me.vertices if abs(v.co.z - zt) < 1e-6]
    vg = obj.vertex_groups.new(name=name)
    vg.add(idxs, 1.0, 'REPLACE')
    LOOP_REPORT.append((name, zt, len(idxs)))

bpy.ops.object.shade_smooth()

# ==================================================== stats
bm = bmesh.new()
bm.from_mesh(me)
quads = sum(1 for f in bm.faces if len(f.verts) == 4)
tris = sum(1 for f in bm.faces if len(f.verts) == 3)
ngons = sum(1 for f in bm.faces if len(f.verts) > 4)
nonman = sum(1 for e in bm.edges if not e.is_manifold)
loose_e = sum(1 for e in bm.edges if len(e.link_faces) == 0)
loose_v = sum(1 for v in bm.verts if len(v.link_edges) == 0)
tri_count = sum(len(f.verts) - 2 for f in bm.faces)
bm.free()

xs = [p[0] for p in V]; ys = [p[1] for p in V]; zs = [p[2] for p in V]
print("STAT verts=%d faces=%d quads=%d tris=%d ngons=%d tri_count=%d"
      % (len(me.vertices), len(me.polygons), quads, tris, ngons, tri_count))
print("STAT nonmanifold=%d loose_edges=%d loose_verts=%d" % (nonman, loose_e, loose_v))
print("STAT bbox x=%.4f..%.4f  y=%.4f..%.4f  z=%.4f..%.4f"
      % (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)))
print("STAT size %.4f x %.4f x %.4f" % (max(xs) - min(xs), max(ys) - min(ys),
                                        max(zs) - min(zs)))
print("STAT arm_attach_z=%.4f hole_rows=%d..%d" % (ARM_ATTACH[2], I_BOT, I_TOP))
for nm, zt, cnt in LOOP_REPORT:
    print("STAT %-14s z=%.4f verts=%d" % (nm, zt, cnt))

# ==================================================== save + export
os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB',
                          use_selection=True, export_yup=True,
                          export_apply=True, export_normals=True)
print("STAT glb=%d" % os.path.getsize(OUT_GLB))
print("BUILD_OK")
