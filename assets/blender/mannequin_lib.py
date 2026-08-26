"""Geometry helpers for the FitRoom mannequin (pure python, no bpy)."""
import math

# ---------------------------------------------------------------- interpolation
def pchip(xs, ys):
    """Monotone cubic Hermite (Fritsch-Carlson). Returns f(x)."""
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0] = d[0]
    m[-1] = d[-1]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] <= 0.0:
            m[i] = 0.0
        else:
            w1 = 2.0 * h[i] + h[i - 1]
            w2 = h[i] + 2.0 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])

    def f(x):
        if x <= xs[0]:
            return ys[0] + m[0] * (x - xs[0])
        if x >= xs[-1]:
            return ys[-1] + m[-1] * (x - xs[-1])
        lo, hi = 0, n - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if xs[mid] <= x:
                lo = mid
            else:
                hi = mid
        i = lo
        t = (x - xs[i]) / h[i]
        t2, t3 = t * t, t * t * t
        h00 = 2 * t3 - 3 * t2 + 1
        h10 = t3 - 2 * t2 + t
        h01 = -2 * t3 + 3 * t2
        h11 = t3 - t2
        return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]

    return f


class Profile:
    """Cross-section profile as a function of a driving parameter (usually z).

    table rows: (u, a, bf, bb, n, cx, cy)
      a  = half extent along +/-X
      bf = half extent toward the front (-Y)
      bb = half extent toward the back  (+Y)
      n  = superellipse exponent
      cx,cy = centre offset
    """

    def __init__(self, table):
        table = sorted(table, key=lambda r: r[0])
        us = [r[0] for r in table]
        self.u0, self.u1 = us[0], us[-1]
        self.a = pchip(us, [r[1] for r in table])
        self.bf = pchip(us, [r[2] for r in table])
        self.bb = pchip(us, [r[3] for r in table])
        self.n = pchip(us, [r[4] for r in table])
        self.cx = pchip(us, [r[5] for r in table])
        self.cy = pchip(us, [r[6] for r in table])

    def radius(self, u, phi):
        dx = math.sin(phi)
        dy = -math.cos(phi)
        a = max(1e-5, self.a(u))
        b = max(1e-5, self.bf(u) if dy < 0.0 else self.bb(u))
        n = max(1.2, self.n(u))
        t = (abs(dx) / a) ** n + (abs(dy) / b) ** n
        return t ** (-1.0 / n)

    def point2d(self, u, phi):
        r = self.radius(u, phi)
        return (self.cx(u) + r * math.sin(phi), self.cy(u) - r * math.cos(phi))


def ring_z(prof, z, phis):
    """Horizontal ring at height z, one point per angle in phis."""
    out = []
    for phi in phis:
        x, y = prof.point2d(z, phi)
        out.append((x, y, z))
    return out


def uniform_phis(n):
    return [2.0 * math.pi * j / n for j in range(n)]


def smoothstep(e0, e1, x):
    if e1 <= e0:
        return 0.0 if x < e0 else 1.0
    t = (x - e0) / (e1 - e0)
    t = min(1.0, max(0.0, t))
    return t * t * (3.0 - 2.0 * t)


def lerp_angle_list(src, dst, w):
    """Blend two angle lists, unwrapping so ordering is preserved."""
    out = []
    for a, b in zip(src, dst):
        d = b - a
        while d > math.pi:
            d -= 2.0 * math.pi
        while d < -math.pi:
            d += 2.0 * math.pi
        out.append(a + w * d)
    return out
