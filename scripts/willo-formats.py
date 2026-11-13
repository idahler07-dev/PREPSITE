"""Custom Willo formats for UI, from the original art (art/mascot/src + art/mascot/rig).

Needs numpy + Pillow. From the repo root:
    python3 scripts/willo-formats.py [--out DIR]

Writes, per pose that suits it:
  icon-<pose>.png    1024 app-icon tile: squircle, lit deep-teal ground, bust whose scarf runs off the bottom edge
  avatar-<pose>.png  512 circle avatar: warm ground, bust clipped by the circle below and breaking out of it above
  sticker-<pose>.png die-cut sticker: bust with a white cut line and a soft lift shadow
  peek-<pose>.png    head and hooves for hooking over a card edge; the edge sits at the bottom
                     of the image minus the hoof overhang (see peek-<pose>.json)
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC, RIG = "art/mascot/src", "art/mascot/rig"


def load(pose):
    m = json.load(open(f"{RIG}/{pose}.json"))
    im = Image.open(f"{SRC}/{pose}.webp").convert("RGBA")
    k = im.height / m["h"]
    g = dict(cx=m["c"][0] * k, cy=m["c"][1] * k, R=m["R"] * k, nx=m["n"][0] * k, ny=m["n"][1] * k)
    return im, g


def bust(im, g, depth=0.62, soft=2.0, pose=None, side=None):
    """Head, antlers, ears and the scarf band only (no arms, hands or props), cut on a gentle U below the scarf."""
    a = np.asarray(im).astype(np.float32) / 255
    H, W = a.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    R = g["R"]
    yb = g["ny"] + depth * R + 0.10 * R * ((X - g["nx"]) / (1.3 * R)) ** 2
    keep = np.clip((yb - Y) / soft, 0, 1)
    if side:  # trim hands beside the head, below ear height
        lim = np.clip((side * R - np.abs(X - g["cx"])) / 6, 0, 1)
        keep = keep * np.where(Y < g["cy"] + 0.2 * R, 1, lim)
    if pose:
        m1 = np.asarray(Image.open(f"{RIG}/{pose}-m1.png").convert("RGB").resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
        headish = (m1[..., 0] > 0.97) | (m1[..., 1] > 0.5) | (m1[..., 2] > 0.5)
        rgb = a[..., :3]
        teal = (rgb[..., 2] > rgb[..., 0] + 0.12) & (rgb[..., 1] > rgb[..., 0]) & (np.abs(X - g["nx"]) < 1.25 * R) & (Y > g["ny"] - 0.6 * R)
        sel = Image.fromarray(((headish | teal) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
        keep = keep * np.asarray(sel).astype(np.float32) / 255
        # keep only the shape joined to the face and the scarf (drops hands, props and sparkles)
        solid = (keep * a[..., 3]) > 0.5
        lab, _ = ndimage.label(solid)
        ids = {lab[int(g["cy"]), int(g["cx"])], lab[int(min(g["ny"] + 0.2 * R, H - 1)), int(g["nx"])]} - {0}
        if ids:
            joined = np.isin(lab, list(ids))
            joined = np.asarray(Image.fromarray((joined * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
            keep = keep * joined
    a[..., 3] *= keep
    out = Image.fromarray((a * 255).astype(np.uint8), "RGBA")
    bb = out.getbbox()
    return out.crop(bb), (g["cx"] - bb[0], g["cy"] - bb[1], R, g["nx"] - bb[0], g["ny"] - bb[1])


def squircle(n, r=0.235, ss=4):
    m = Image.new("L", (n * ss, n * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, n * ss - 1, n * ss - 1), radius=int(n * ss * r), fill=255)
    return m.resize((n, n), Image.LANCZOS)


def radial(n, inner, outer, center=(0.5, 0.42), spread=0.75):
    Y, X = np.mgrid[0:n, 0:n].astype(np.float32) / n
    d = np.clip(np.sqrt((X - center[0]) ** 2 + (Y - center[1]) ** 2) / spread, 0, 1) ** 1.3
    a, b = np.array(inner, np.float32), np.array(outer, np.float32)
    return Image.fromarray((a + (b - a) * d[..., None]).astype(np.uint8), "RGB")


def soft_shadow(alpha, dx, dy, blur, opacity, color=(20, 30, 35)):
    sh = Image.new("RGBA", alpha.size, color + (0,))
    sh.putalpha(alpha.point(lambda v: int(v * opacity)))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new("RGBA", alpha.size, (0, 0, 0, 0))
    out.alpha_composite(sh, (dx, dy))
    return out


def icon(pose, out, n=1024):
    im, g = load(pose)
    b, (cx, cy, R, nx, ny) = bust(im, g, depth=0.9, pose=pose)
    s = (n * 0.80) / b.width  # head with ears and antlers spans most of the tile
    b = b.resize((round(b.width * s), round(b.height * s)), Image.LANCZOS)
    cx, cy, R = cx * s, cy * s, R * s
    tile = radial(n, (27, 102, 114), (9, 46, 54), center=(0.5, 0.40), spread=0.85).convert("RGBA")
    # a soft light disc behind the head
    glow = Image.new("L", (n, n), 0)
    ImageDraw.Draw(glow).ellipse((n * 0.16, n * 0.10, n * 0.84, n * 0.78), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(n * 0.08))
    tile.alpha_composite(Image.merge("RGBA", (Image.new("L", (n, n), 120), Image.new("L", (n, n), 205), Image.new("L", (n, n), 210), glow)))
    ox, oy = round(n / 2 - b.width / 2), n - b.height + round(n * 0.03)  # scarf runs off the bottom edge
    layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    layer.alpha_composite(b, (max(ox, 0), max(oy, 0)), (max(-ox, 0), max(-oy, 0)))
    tile.alpha_composite(soft_shadow(layer.getchannel("A"), 0, round(n * 0.018), n * 0.022, 0.45))
    tile.alpha_composite(layer)
    # top sheen, then clip to the squircle
    sheen = Image.new("L", (n, n), 0)
    ImageDraw.Draw(sheen).rectangle((0, 0, n, n * 0.5), fill=22)
    sheen = sheen.filter(ImageFilter.GaussianBlur(n * 0.12))
    tile.alpha_composite(Image.merge("RGBA", (Image.new("L", (n, n), 255),) * 3 + (sheen,)))
    tile.putalpha(squircle(n))
    tile.save(f"{out}/icon-{pose}.png", optimize=True)


def avatar(pose, out, n=512, ground=((255, 236, 220), (247, 204, 168))):
    im, g = load(pose)
    b, (cx, cy, R, nx, ny) = bust(im, g, depth=0.75, pose=pose)
    pad = int(n * 0.30)  # room above the circle for antlers breaking out
    N = n + pad
    s = (n * 0.76) / b.width
    b = b.resize((round(b.width * s), round(b.height * s)), Image.LANCZOS)
    cx, cy, R, ny = cx * s, cy * s, R * s, ny * s
    canvas = Image.new("RGBA", (n, N), (0, 0, 0, 0))
    disc = radial(n, ground[0], ground[1], center=(0.5, 0.35), spread=0.8).convert("RGBA")
    cm = Image.new("L", (n * 4, n * 4), 0)
    ImageDraw.Draw(cm).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255)
    cm = cm.resize((n, n), Image.LANCZOS)
    disc.putalpha(cm)
    canvas.alpha_composite(disc, (0, pad))
    layer = Image.new("RGBA", (n, N), (0, 0, 0, 0))
    ox, oy = round(n / 2 - b.width / 2), pad + n - b.height + round(n * 0.04)
    layer.alpha_composite(b, (max(ox, 0), max(oy, 0)), (max(-ox, 0), max(-oy, 0)))
    # clip: the scarf and below stay inside the circle; the whole head (ears, antlers) may break the frame
    clip = Image.new("L", (n, N), 0)
    clip.paste(cm, (0, pad))
    up = Image.new("L", (n, N), 0)
    ImageDraw.Draw(up).rectangle((0, 0, n, int(oy + ny - 0.32 * R)), fill=255)
    clip = Image.fromarray(np.maximum(np.asarray(clip), np.asarray(up.filter(ImageFilter.GaussianBlur(2)))))
    la = np.asarray(layer.getchannel("A")).astype(np.float32) * np.asarray(clip).astype(np.float32) / 255
    layer.putalpha(Image.fromarray(la.astype(np.uint8)))
    shadow_in_disc = soft_shadow(layer.getchannel("A"), 0, round(n * 0.02), n * 0.025, 0.28, (120, 60, 20))
    sa = np.asarray(shadow_in_disc.getchannel("A")).astype(np.float32) * np.asarray(Image.new("L", (n, N), 0).copy() if False else clip).astype(np.float32) / 255
    shadow_in_disc.putalpha(Image.fromarray(sa.astype(np.uint8)))
    canvas.alpha_composite(shadow_in_disc)
    canvas.alpha_composite(layer)
    canvas.save(f"{out}/avatar-{pose}.png", optimize=True)


def sticker(pose, out, h=640, line=0.035, tilt=-4):
    im, g = load(pose)
    b, (cx, cy, R, nx, ny) = bust(im, g, depth=0.85, soft=1.2)
    s = h / b.height
    b = b.resize((round(b.width * s), h), Image.LANCZOS)
    p = int(h * 0.12)
    c = Image.new("RGBA", (b.width + 2 * p, b.height + 2 * p), (0, 0, 0, 0))
    c.alpha_composite(b, (p, p))
    a = c.getchannel("A")
    w = int(h * line) | 1
    cut = a.filter(ImageFilter.MaxFilter(w)).filter(ImageFilter.MaxFilter(w)).filter(ImageFilter.GaussianBlur(1.6)).point(lambda v: 255 if v > 110 else int(v * 2.3))
    white = Image.new("RGBA", c.size, (255, 255, 255, 0))
    white.putalpha(cut)
    base = Image.new("RGBA", c.size, (0, 0, 0, 0))
    base.alpha_composite(soft_shadow(cut, 0, int(h * 0.018), h * 0.022, 0.32, (60, 40, 25)))
    base.alpha_composite(white)
    base.alpha_composite(c)
    base = base.rotate(tilt, resample=Image.BICUBIC, expand=True)
    base.crop(base.getbbox()).save(f"{out}/sticker-{pose}.png", optimize=True)


def peek(pose, out, h=520):
    """Head and scarf above an edge, two hooves hooked over it."""
    im, g = load(pose)
    b, (cx, cy, R, nx, ny) = bust(im, g, depth=0.30, soft=1.0, pose=pose)  # cut just under the chin, inside the scarf
    s = h / b.height
    b = b.resize((round(b.width * s), h), Image.LANCZOS)
    cx, cy, R, nx, ny = cx * s, cy * s, R * s, nx * s, ny * s
    over = int(R * 0.20)  # how far the hooves hang over the edge
    W = b.width
    c = Image.new("RGBA", (W, h + over), (0, 0, 0, 0))
    c.alpha_composite(b, (0, 0))
    edge = h  # the card's top edge, in image coordinates
    # hooves, drawn at 4x for clean curves; colours from the art
    arr = np.asarray(im).astype(np.float32)
    al = arr[..., 3] > 200
    lum = arr[..., :3].mean(-1)
    brown = np.median(arr[al & (lum < 90) & (arr[..., 0] > arr[..., 2] + 25)][:, :3], 0)
    fur = np.median(arr[al & (arr[..., 0] > 220) & (arr[..., 1] > 110) & (arr[..., 1] < 170) & (arr[..., 2] < 90)][:, :3], 0)
    ss = 4
    L = Image.new("RGBA", (W * ss, (h + over) * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    hw, hh = R * 0.56, R * 0.42
    for side in (-1, 1):
        x = nx + side * R * 0.58
        # forearm rising from behind the edge
        d.rounded_rectangle(((x - hw * 0.42) * ss, (edge - hh * 0.95) * ss, (x + hw * 0.42) * ss, (edge + over) * ss), radius=int(hw * 0.42 * ss), fill=tuple(int(v) for v in fur) + (255,))
        # hoof resting on the edge, its front hanging over
        top, bot = edge - hh * 0.55, edge + over * 0.92
        d.rounded_rectangle(((x - hw / 2) * ss, top * ss, (x + hw / 2) * ss, bot * ss), radius=int(hw * 0.46 * ss), fill=tuple(int(v) for v in brown) + (255,))
        d.line(((x * ss, (top + hh * 0.25) * ss), (x * ss, bot * ss - 6 * ss)), fill=tuple(int(v * 0.72) for v in brown) + (255,), width=int(max(2, R * 0.035) * ss))
        d.ellipse(((x - hw * 0.30) * ss, (top + hh * 0.08) * ss, (x - hw * 0.05) * ss, (top + hh * 0.26) * ss), fill=(255, 255, 255, 60))
    L = L.resize((W, h + over), Image.LANCZOS)
    c.alpha_composite(soft_shadow(L.getchannel("A"), 0, int(R * 0.03), R * 0.04, 0.35))
    c.alpha_composite(L)
    c.save(f"{out}/peek-{pose}.png", optimize=True)
    json.dump({"edge": edge / (h + over), "height": h + over, "width": W}, open(f"{out}/peek-{pose}.json", "w"))


if __name__ == "__main__":
    args = sys.argv[1:]
    out = args[args.index("--out") + 1] if "--out" in args else "public/mascot/formats"
    os.makedirs(out, exist_ok=True)
    for p in ("stand", "wink"):
        icon(p, out)  # wink keeps its thumb out of frame
    for p in ("stand", "wink", "think"):
        avatar(p, out)
    for p in ("wink", "cheer", "stand", "sad"):
        sticker(p, out)
    for p in ("stand", "idea"):
        peek(p, out)
    print("ok", out)
