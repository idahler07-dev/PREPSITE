"""Paper-cut rendering of the Willo poses: flat cut-paper layers with cast shadows and fibre.

Needs numpy + Pillow. From the repo root:
    python3 scripts/willo-papercut.py <pose> [<pose> ...] [--out DIR]

Steps, on the original art (art/mascot/src):
  1. flatten: k-means to a small palette, then a mode filter so every colour is one clean
     piece of paper with a smooth cut edge
  2. stack: bigger pieces sit lower, smaller pieces (eyes, nose, scarf folds) on top
  3. light: each piece casts a soft shadow down-right onto the pieces below it, and
     catches a thin highlight on its top-left cut edge
  4. paper: fibre texture per piece, and a soft shadow under the whole figure
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "art/mascot/src"


def blur(a, r):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(np.float32) / 255


def shift(a, dx, dy):
    out = np.zeros_like(a)
    H, W = a.shape
    out[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = a[max(-dy, 0):H + min(-dy, 0), max(-dx, 0):W + min(-dx, 0)]
    return out


def kmeans(px, k, iters=14, seed=1):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(iters):
        d = ((px[:, None, :] - c[None]) ** 2).sum(-1)
        lab = d.argmin(1)
        for i in range(k):
            m = lab == i
            if m.any():
                c[i] = px[m].mean(0)
    return c


def papercut(pose, out_dir, height=1080, k=18):
    im = Image.open(f"{SRC}/{pose}.webp").convert("RGBA")
    W = round(im.width * height / im.height)
    im = im.resize((W, height), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    s = height / 1080
    inside = al > 0.5

    # 1. flatten
    sample = rgb[inside][:: max(1, inside.sum() // 40000)]
    lab_space = lambda x: np.stack([x[..., 0] * 0.8, x[..., 1], x[..., 2] * 0.8], -1)
    cents = kmeans(lab_space(sample).copy(), k)
    # merge near-identical clusters (soft gradients) so each colour is one sheet of paper
    keep = []
    for c in cents:
        if all(((c - q) ** 2).sum() > 0.075 ** 2 for q in keep):
            keep.append(c)
    cents = np.array(keep)
    k = len(cents)
    d = ((lab_space(rgb)[..., None, :] - cents[None, None]) ** 2).sum(-1)
    lab = d.argmin(-1).astype(np.uint8)
    lab[~inside] = 255
    # mode filter: clean, cut-looking edges (a few passes)
    li = Image.fromarray(lab, "L")
    for r in (7, 11, 9, 7):
        li = li.filter(ImageFilter.ModeFilter(int(r * s) | 1))
    lab = np.asarray(li).copy()
    lab[~inside] = 255
    # drop paper crumbs: tiny islands take the label of their nearest neighbour piece
    crumb = np.zeros(lab.shape, bool)
    for i in range(k):
        cc, n = ndimage.label(lab == i)
        if n:
            sizes = ndimage.sum(np.ones_like(cc), cc, range(1, n + 1))
            small = np.isin(cc, np.nonzero(sizes < 260 * s * s)[0] + 1)
            crumb |= small
    if crumb.any():
        solid = (~crumb) & inside
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        lab = np.where(crumb, lab[iy, ix], lab)
    # colour of each piece: the median of its pixels in the original
    cols = np.zeros((k, 3), np.float32)
    for i in range(k):
        m = lab == i
        if m.any():
            cols[i] = np.median(rgb[m], 0)

    # 2. stack: order pieces by area, largest at the bottom
    area = np.array([(lab == i).sum() for i in range(k)])
    order = np.argsort(-area)
    depth = np.full(lab.shape, -1, np.int16)
    for rank, i in enumerate(order):
        depth[lab == i] = rank

    flat = np.where(inside[..., None], cols[np.minimum(lab, k - 1)], 0)

    # 3. light
    shadow = np.zeros(lab.shape, np.float32)
    rim = np.zeros(lab.shape, np.float32)
    off = max(2, round(5 * s))
    for rank in range(1, k):
        above = (depth >= rank).astype(np.float32)
        cast = blur(shift(above, off, round(off * 1.3)), 4.5 * s)
        shadow = np.maximum(shadow, cast * (depth < rank) * (depth >= 0))
    for rank in range(0, k):
        piece = (depth == rank).astype(np.float32)
        edge = np.clip(piece - shift(piece, round(2 * s), round(2 * s)), 0, 1)  # top-left cut edge
        rim = np.maximum(rim, blur(edge, 0.8 * s))
    rgb2 = flat * (1 - 0.34 * shadow[..., None]) + np.array([0.24, 0.12, 0.08]) * 0.34 * shadow[..., None] * 0.5
    rgb2 = rgb2 + (1 - rgb2) * 0.35 * rim[..., None] * inside[..., None]

    # 4. paper fibre: low-frequency mottling + fine fibres, varied per piece
    rng = np.random.default_rng(5)
    H = lab.shape[0]
    fib = blur(rng.random(lab.shape).astype(np.float32), 0.6 * s) - 0.5
    mott = blur(rng.random(lab.shape).astype(np.float32), 9 * s) - 0.5
    streak = np.asarray(Image.fromarray((rng.random((H // 6, W)) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255 - 0.5
    tex = 1 + 0.07 * fib + 0.22 * mott + 0.025 * streak
    rgb2 = rgb2 * tex[..., None]

    # clean silhouette with a slightly crisp edge, plus the figure's own drop shadow
    al2 = blur(inside.astype(np.float32), 0.7 * s)
    ground = blur(shift(inside.astype(np.float32), round(6 * s), round(10 * s)), 9 * s) * 0.35
    out_rgb = rgb2 * al2[..., None]
    out_a = np.maximum(al2, ground)
    shadow_rgb = np.array([0.28, 0.16, 0.1])
    out_rgb = out_rgb + shadow_rgb * (out_a - al2)[..., None]
    out_rgb = np.where(out_a[..., None] > 1e-4, out_rgb / np.maximum(out_a[..., None], 1e-4), 0)
    img = Image.fromarray((np.dstack([np.clip(out_rgb, 0, 1), np.clip(out_a, 0, 1)]) * 255).astype(np.uint8), "RGBA")
    os.makedirs(out_dir, exist_ok=True)
    img.save(f"{out_dir}/deer-{pose}-paper.webp", quality=92, method=6)
    return img


if __name__ == "__main__":
    args = sys.argv[1:]
    out = "public/mascot/paper"
    if "--out" in args:
        i = args.index("--out")
        out = args[i + 1]
        args = args[:i] + args[i + 2:]
    for p in args or ["stand"]:
        papercut(p, out)
        print("ok", p)
