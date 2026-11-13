"""Import Willo's illustrations (art/mascot/v3/<pose>.png, drawn on white) into the site.

Needs numpy, Pillow and scipy. From the repo root:
    python3 scripts/willo-import.py

For each pose: cut the art out of its white ground (only white that touches the
edge of the picture, so the cream belly and eye whites stay), un-mix the soft
edge from white so it sits cleanly on any colour,
drop loose specks, crop to the art and write
  art/mascot/src/<pose>.webp              full size, for the format generators
  public/mascot/deer-<pose>.webp          720 px tall
  public/mascot/deer-<pose>-sm.webp       360 px tall
  public/mascot/deer-<pose>-hd.webp       1080 px tall
No ground shadow is kept (the page gives its own). The app icon (icon.png) becomes public/mascot/formats/icon-stand.png, clipped to a squircle.
"""
import glob
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC, ART, PUB = "art/mascot/v3", "art/mascot/src", "public/mascot"


def cutout(im):
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    mn = a.min(-1)
    # white ground: near-white and connected to the border
    near = (mn > 190) & (a.max(-1) - mn < 30)  # white and the pale ground shadow, not the cream fur
    lab, _ = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    ground = np.isin(lab, list(border))
    fg = ~ground
    # soft edge: a thin band around the art takes its opacity from how far it is from white
    band = ndimage.binary_dilation(fg, iterations=3) & ~ndimage.binary_erosion(fg, iterations=2)
    alpha = fg.astype(np.float32)
    alpha = np.where(band, np.clip((255 - mn) / 55, 0, 1), alpha)
    # drop the painted ground shadow and loose specks: keep only sizeable shapes
    lab2, n2 = ndimage.label(alpha > 0.5)
    if n2:
        sizes = ndimage.sum(np.ones_like(alpha), lab2, range(1, n2 + 1))
        keep = np.isin(lab2, [i + 1 for i, z in enumerate(sizes) if z > alpha.size * 0.0004])
        keep = ndimage.binary_dilation(keep, iterations=3)
        alpha = np.where(keep, alpha, 0)
    shadow = np.zeros_like(ground)
    # un-mix white from partly clear pixels
    A = np.clip(alpha, 1e-3, 1)[..., None]
    rgb = np.clip((a - 255 * (1 - A)) / A, 0, 255)
    # the shadow is a warm dark tone at low opacity, so it reads on light and dark grounds
    rgb = np.where(shadow[..., None], np.array([70, 48, 38], np.float32), rgb)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    bb = Image.fromarray((alpha > 0.06).astype(np.uint8) * 255).getbbox()
    pad = 6
    return img.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(img.width, bb[2] + pad), min(img.height, bb[3] + pad)))


def squircle(n, r=0.235, ss=4):
    m = Image.new("L", (n * ss, n * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, n * ss - 1, n * ss - 1), radius=int(n * ss * r), fill=255)
    return m.resize((n, n), Image.LANCZOS)


if __name__ == "__main__":
    os.makedirs(ART, exist_ok=True)
    for f in sorted(glob.glob(f"{SRC}/*.png")):
        pose = os.path.basename(f)[:-4]
        im = Image.open(f)
        if pose == "icon":
            n = 512
            ic = im.convert("RGBA").resize((n, n), Image.LANCZOS)
            ic.putalpha(squircle(n))
            ic.save(f"{PUB}/formats/icon-stand.png", optimize=True)
            continue
        c = cutout(im)
        c.save(f"{ART}/{pose}.webp", quality=95, method=6)
        for h, suf in ((720, ""), (360, "-sm"), (1080, "-hd")):
            w = round(c.width * h / c.height)
            c.resize((w, h), Image.LANCZOS).save(f"{PUB}/deer-{pose}{suf}.webp", quality=92, method=6)
        print(pose, c.size, round(c.width * 720 / c.height))
