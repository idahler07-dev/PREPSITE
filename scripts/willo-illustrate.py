"""Editorial re-rendering of the Willo poses (keeps every shape, detail and expression).

Needs numpy + Pillow. From the repo root:
    python3 scripts/willo-illustrate.py [pose ...]   (reads art/mascot, writes public/mascot/deer-<pose>[-sm].webp)
Then run scripts/willo-rig.py so the rig matches the new art.

Pipeline, at 2x for clean lines, on the 720px cut-out art:
  1. proportions: eyes 16% smaller and the head 6% smaller (about the neck), using
     the rig geometry in public/mascot/rig, so Willo reads older, not babyish
  2. palette: deeper, slightly muted; warm ivory instead of cream, burnt orange fur
  3. light: soft two-tone shading from a top-left key light, light hatching in the shade
  4. ink: a warm-brown contour that is heavier on the shadow side
  5. paper grain
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

SRC = "art/mascot"  # the original painted poses (720px) and their rig, kept out of public/
RIG = "art/mascot/rig"
OUT = "public/mascot"
GEO = "art/mascot/illustrated-geometry.json"  # eye boxes and centres after the pass
EYE_BOX = {  # open-eye boxes from the art (720px), as in willo.tsx
    "stand": [(206, 275, 284, 366), (376, 246, 448, 331)],
    "wink": [(361, 235, 428, 318)],
    "idea": [(202, 261, 276, 346), (370, 220, 436, 296)],
    "think": [(284, 287, 363, 384), (463, 230, 544, 328)],
    "read": [(280, 338, 359, 426), (459, 307, 530, 394)],
    "laptop": [(317, 320, 396, 403), (490, 287, 555, 369)],
    "sad": [(238, 354, 331, 451), (429, 308, 516, 405)],
}


# eye centres the rig uses (scripts/willo-rig.py), mapped through the pass for the new rig
RIG_EYES = {
    "stand": [(245, 320), (412, 288)], "wink": [(222, 314), (394, 276)], "idea": [(239, 303), (403, 258)],
    "think": [(323, 335), (503, 279)], "read": [(319, 382), (494, 350)], "laptop": [(356, 361), (522, 328)],
    "sad": [(284, 402), (472, 356)], "heart": [(246, 330), (424, 267)], "cheer": [(229, 327), (408, 265)],
    "jump": [(230, 308), (406, 259)], "trophy": [(273, 308), (443, 247)],
}


def g(a, r):
    lo, hi = float(a.min()), float(a.max())
    if hi - lo < 1e-6:
        return a.astype(np.float32)
    im = Image.fromarray(((a - lo) / (hi - lo) * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(np.float32) / 255 * (hi - lo) + lo


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def sample(img, qx, qy):
    """Bilinear sample of an HxWxC float image at float coords."""
    H, W = img.shape[:2]
    outside = (qx < 0) | (qy < 0) | (qx > W - 1.001) | (qy > H - 1.001)
    qx = np.clip(qx, 0, W - 1.001)
    qy = np.clip(qy, 0, H - 1.001)
    x0 = np.floor(qx).astype(int)
    y0 = np.floor(qy).astype(int)
    fx = (qx - x0)[..., None]
    fy = (qy - y0)[..., None]
    a = img[y0, x0]
    b = img[y0, x0 + 1]
    c = img[y0 + 1, x0]
    d = img[y0 + 1, x0 + 1]
    out = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
    out[outside] = 0  # premultiplied: outside the art is transparent, never a smeared edge
    return out


def illustrate(pose):
    K = 3  # work at 3x the 720 frame, from the hi-res source art
    base = Image.open(f"{SRC}/deer-{pose}.webp").convert("RGBA")
    W0, H0 = base.size
    meta = json.load(open(f"{RIG}/{pose}.json"))
    # The hi-res cut-out (about 1.5x) is the same drawing as the 720 frame, so it maps straight onto it.
    big = Image.open(f"{SRC}/src/{pose}.webp").convert("RGBA").resize((W0 * K, H0 * K), Image.LANCZOS)
    a = np.asarray(big).astype(np.float32) / 255
    # premultiply for clean warping
    pm = a.copy()
    pm[..., :3] *= pm[..., 3:4]
    H, W = a.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    hw = None
    if "n" in meta:
        m1 = Image.open(f"{RIG}/{pose}-m1.png").convert("RGB").resize((W, H), Image.BILINEAR)
        hw = np.asarray(m1).astype(np.float32)[..., 0] / 255

    def where_from(X, Y):
        """For output coords, the source coords they sample (1a: head 6% smaller about the neck, 1b: eyes 16% smaller)."""
        qx, qy = X.copy(), Y.copy()
        if hw is not None:
            nx, ny = meta["n"][0] * K, meta["n"][1] * K
            w = sample(hw[..., None], X, Y)[..., 0]
            k = 0.94
            qx = qx + w * (nx + (X - nx) / k - X)
            qy = qy + w * (ny + (Y - ny) / k - Y)
        for x0, y0, x1, y1 in EYE_BOX.get(pose, []):
            cx, cy = (x0 + x1) / 2 * K, (y0 + y1) / 2 * K
            Ro = max(x1 - x0, y1 - y0) / 2 * K * 1.12 * 1.9
            dx, dy = qx - cx, qy - cy
            d = np.sqrt(dx * dx + dy * dy) + 1e-6
            f = 1 + 0.16 * (1 - smooth(0, Ro, d)) ** 1.3
            qx = cx + dx * f
            qy = cy + dy * f
        return qx, qy

    def where_to(px, py):
        """Inverse of where_from (fixed-point iteration): where a source point lands."""
        px = np.asarray(px, np.float32) * K
        py = np.asarray(py, np.float32) * K
        x, y = px.copy(), py.copy()
        for _ in range(60):
            qx, qy = where_from(x, y)
            x, y = x + (px - qx), y + (py - qy)
        return x / K, y / K

    qx, qy = where_from(X, Y)
    pm = sample(pm, qx, qy)
    al = pm[..., 3]
    rgb = np.where(al[..., None] > 1e-4, pm[..., :3] / np.maximum(al[..., None], 1e-4), 0)

    # 2. palette
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1)
    sat = 0.84
    rgb = lum[..., None] + (rgb - lum[..., None]) * sat
    # warm ivory highlights, burnt orange mids
    rgb = rgb * np.array([1.0, 0.95, 0.9], np.float32) + np.array([0.0, 0.01, 0.02], np.float32)
    rgb = np.clip((rgb - 0.5) * 1.06 + 0.49, 0, 1)

    # 3. light: two-tone shade from a top-left key light
    body = g(al, 30 * K)
    form = g(lum * al, 8 * K)
    h = body + 0.25 * form
    gy, gx = np.gradient(h)
    d = -(gx * -0.62 + gy * -0.78) * 40
    shade = smooth(0.06, 0.2, -d) * al  # crisp-ish shadow band
    shade = g(shade, 1.2 * K)
    light = smooth(0.08, 0.3, d) * al
    shadow_col = np.array([0.42, 0.22, 0.2], np.float32)
    rgb = rgb * (1 - 0.3 * shade[..., None]) + shadow_col * 0.3 * shade[..., None] * 0.6
    rgb = rgb + (np.array([1.0, 0.96, 0.88], np.float32) - rgb) * (0.12 * light[..., None])
    # light hatching inside the shade
    hatch = (np.sin((X + Y) * (2 * np.pi / (6.5 * K))) > 0.55).astype(np.float32)
    hatch = g(hatch, 0.6 * K)
    rgb = rgb * (1 - 0.09 * (hatch * shade)[..., None])

    # 4. ink contour (silhouette + colour boundaries), heavier in the shade
    sm = np.stack([g(rgb[..., c] * al, 1.0 * K) for c in range(3)], -1)
    ex = np.abs(np.diff(sm, axis=1, append=sm[:, -1:])).sum(-1)
    ey = np.abs(np.diff(sm, axis=0, append=sm[-1:])).sum(-1)
    edge = np.sqrt(ex * ex + ey * ey)
    aex = np.abs(np.diff(al, axis=1, append=al[:, -1:])) + np.abs(np.diff(al, axis=0, append=al[-1:]))
    ink = np.maximum(smooth(0.05, 0.13, edge), smooth(0.05, 0.25, aex))
    weight = 0.7 + 0.9 * g(shade, 6 * K)
    ink_img = Image.fromarray((np.clip(ink, 0, 1) * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(3))
    ink = np.asarray(ink_img).astype(np.float32) / 255
    ink = g(ink * np.clip(weight, 0, 1.4), 0.45 * K)
    ink = np.clip(ink, 0, 1)
    ink_col = np.array([0.24, 0.13, 0.09], np.float32)
    # the silhouette line sits just inside/outside the edge, so grow alpha a hair
    al_out = np.maximum(al, np.clip(g(al, 1.2 * K) * 1.6, 0, 1) * (ink > 0.2))
    rgb = rgb * (1 - 0.82 * ink[..., None]) + ink_col * 0.82 * ink[..., None]

    # 5. paper grain
    rng = np.random.default_rng(3)
    grain = g(rng.normal(0, 1, (H, W)).astype(np.float32), 0.8 * K)
    grain /= np.abs(grain).max() + 1e-6
    rgb = rgb * (1 + 0.03 * grain[..., None])

    geo = {"eyes": [], "boxes": []}
    rig_eyes = RIG_EYES.get(pose) or []
    for ex, ey, *_ in rig_eyes:
        nx_, ny_ = where_to([ex], [ey])
        geo["eyes"].append([round(float(nx_[0])), round(float(ny_[0]))])
    for x0, y0, x1, y1 in EYE_BOX.get(pose, []):
        xs, ys = where_to([x0, x1, (x0 + x1) / 2, (x0 + x1) / 2], [(y0 + y1) / 2, (y0 + y1) / 2, y0, y1])
        geo["boxes"].append([round(float(xs[0])), round(float(ys[2])), round(float(xs[1])), round(float(ys[3]))])

    out = np.dstack([np.clip(rgb, 0, 1), np.clip(al_out, 0, 1)])
    full = Image.fromarray((out * 255).astype(np.uint8), "RGBA")

    def export(scale, suffix, sharpen):
        im = full.resize((round(W0 * scale), round(H0 * scale)), Image.LANCZOS)
        rgb_, a_ = im.convert("RGB"), im.getchannel("A")
        rgb_ = rgb_.filter(ImageFilter.UnsharpMask(radius=sharpen[0], percent=sharpen[1], threshold=1))
        rgb_.putalpha(a_)
        rgb_.save(f"{OUT}/deer-{pose}{suffix}.webp", quality=92, method=6)

    export(1.5, "-hd", (1.4, 70))  # 1080px, for large and high-density displays
    export(1.0, "", (1.0, 60))  # 720px
    export(0.5, "-sm", (0.7, 50))  # 360px
    return geo


if __name__ == "__main__":
    poses = sys.argv[1:] or ["stand", "wink", "cheer", "jump", "trophy", "heart", "idea", "think", "read", "laptop", "sleep", "sad"]
    allgeo = json.load(open(GEO)) if os.path.exists(GEO) else {}
    for p in poses:
        allgeo[p] = illustrate(p)
        print("ok", p, allgeo[p])
    json.dump(allgeo, open(GEO, "w"), indent=1)
