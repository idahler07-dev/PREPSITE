"""Closed-eye copies of every Willo image with open eyes, for natural blinks.

Needs numpy, Pillow and opencv-python-headless. From the repo root (after
scripts/willo-eyes.py):
    python3 scripts/willo-closed-eyes.py

For each image listed in src/components/mascot/eyes.json with open eyes, the
eyes (with their white ring) are painted over from the fur and cheek around them,
the eyes (with their white ring) are filled with the face's own flat cream
and fur colours, then a relaxed closed-eye line is drawn in the art's own ink, like the sleeping
pose. Writes <name>-closed[-sm|-hd].<ext> beside the image; the animation wipes
it in from the top to blink.
"""
import json
import re

import cv2
import numpy as np
from PIL import Image, ImageDraw

INK = (14, 52, 66, 255)
EYES = json.load(open("src/components/mascot/eyes.json"))


def closed_path(src):
    m = re.match(r"^(.*?)(-sm|-hd)?\.(png|webp)$", src)
    return f"{m.group(1)}-closed{m.group(2) or ''}.{m.group(3)}"


for key, info in EYES.items():
    if not info["eyes"] or "-closed" in key:
        continue
    path = "public" + key
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    a = np.asarray(im).copy()
    mask = np.zeros((H, W), np.uint8)
    for e in info["eyes"]:
        cx, cy, rx, ry = e["x"] * W, e["y"] * H, e["rx"] * W * 1.68, e["ry"] * H
        # tight above (the brow stays untouched), generous at the sides and below (the white ring)
        cv2.ellipse(mask, (round(cx), round(cy)), (round(rx), round(ry * 1.4)), 0, 180, 360, 255, -1)
        cv2.ellipse(mask, (round(cx), round(cy)), (round(rx), round(ry * 1.68)), 0, 0, 180, 255, -1)
    # fill the eye area with the face's own flat colours: each covered pixel takes the
    # colour family (cream or orange fur) of the nearest uncovered skin pixel, painted
    # in that family's typical tone nearby, then the family border is softened
    rgb = a[..., :3].astype(np.float32)
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    cream = (lum > 200) & (sat < 90) & (rgb[..., 0] > rgb[..., 2])
    fur = (rgb[..., 0] > 200) & (rgb[..., 1] > 110) & (rgb[..., 1] < 200) & (rgb[..., 2] < 140) & (sat > 90)
    near = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=int(max(6, W * 0.03))) > 0
    src = (cream | fur) & (mask == 0) & near
    from scipy import ndimage
    _, (iy, ix) = ndimage.distance_transform_edt(~src, return_indices=True)
    fam = cream[iy, ix].astype(np.float32)  # 1 cream, 0 fur
    ring = near & (mask == 0)
    c_col = np.median(rgb[ring & cream], 0) if (ring & cream).any() else np.array([252, 240, 225.0])
    f_col = np.median(rgb[ring & fur], 0) if (ring & fur).any() else np.array([250, 160, 80.0])
    # round off the border between the two (nearest-pixel borders come out as wedges)
    fam = cv2.GaussianBlur(fam, (0, 0), max(4.0, W * 0.03))
    fam = np.clip((fam - 0.38) / 0.24, 0, 1)
    fam = fam * fam * (3 - 2 * fam)
    fam = cv2.GaussianBlur(fam, (0, 0), max(1.0, W * 0.002))
    fill = fam[..., None] * c_col + (1 - fam[..., None]) * f_col
    m3 = (cv2.GaussianBlur(mask, (0, 0), max(1.0, W * 0.002)) / 255.0)[..., None]
    a[..., :3] = np.clip(rgb * (1 - m3) + fill * m3, 0, 255).astype(np.uint8)
    out = Image.fromarray(a, "RGBA")
    # the closed eye: a relaxed downward curve with round ends, drawn at 4x then reduced
    ss = 4
    ink = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(ink)
    for e in info["eyes"]:
        cx, cy, rx, ry = e["x"] * W, e["y"] * H, e["rx"] * W, e["ry"] * H
        w = max(2.0, rx * 0.26)
        pts = []
        for t in np.linspace(-1, 1, 40):
            x = cx + t * rx * 1.05
            y = cy + ry * 0.15 + (1 - t * t) * ry * 0.42
            pts.append((x * ss, y * ss))
        d.line(pts, fill=INK, width=int(w * ss), joint="curve")
        for px, py in (pts[0], pts[-1]):
            d.ellipse((px - w * ss / 2, py - w * ss / 2, px + w * ss / 2, py + w * ss / 2), fill=INK)
    out.alpha_composite(ink.resize((W, H), Image.LANCZOS))
    dst = "public" + closed_path(key)
    if dst.endswith(".webp"):
        out.save(dst, quality=92, method=6)
    else:
        out.save(dst, optimize=True)
    print(dst)
