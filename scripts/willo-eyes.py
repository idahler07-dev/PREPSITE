"""Find Willo's open eyes in every mascot image, for the live blink/tear overlay.

Needs numpy, Pillow and scipy. From the repo root:
    python3 scripts/willo-eyes.py      # writes src/components/mascot/eyes.json

An open eye is a solid, near-round, dark navy blob (taller than wide, ~70% filled). Coordinates are
fractions of the image, so they hold at any display size. Each eye also stores the fur colour just
above it, which the eyelid uses.
"""
import glob
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = "src/components/mascot/eyes.json"


def eyes(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    H, W = al.shape
    m = (al > 200) & (r < 70) & (g < 80) & (b < 100) & (b >= r)
    lab, n = ndimage.label(m)
    found = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        area = len(ys)
        if area < W * H * 0.0006:
            continue
        w, h = int(np.ptp(xs)) + 1, int(np.ptp(ys)) + 1
        fill, aspect = area / (w * h), h / w
        if fill < 0.62 or not 0.95 <= aspect <= 1.45:
            continue
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        # fur colour in a band just above the eye
        y0, y1 = int(max(cy - h * 0.95, 0)), int(max(cy - h * 0.62, 1))
        x0, x1 = int(max(cx - w * 0.3, 0)), int(min(cx + w * 0.3, W - 1))
        band = a[y0:y1, x0:x1].reshape(-1, 4)
        band = band[(band[:, 3] > 220) & (band[:, :3].sum(1) > 300)]
        fur = "#%02x%02x%02x" % tuple(int(v) for v in np.median(band[:, :3], 0)) if len(band) else "#f08a3c"
        found.append({"x": round(cx / W, 4), "y": round(cy / H, 4), "rx": round(w / 2 / W, 4), "ry": round(h / 2 / H, 4), "area": int(area), "fur": fur})
    found.sort(key=lambda e: -e["area"])
    found = found[:2]
    if len(found) == 2 and found[1]["area"] < found[0]["area"] * 0.45:
        found = found[:1]
    found.sort(key=lambda e: e["x"])
    for e in found:
        e.pop("area")
    return {"w": W, "h": H, "eyes": found}


paths = sorted(glob.glob("public/mascot/formats/*.png") + glob.glob("public/mascot/deer-*.webp"))
data = {"/" + os.path.relpath(p, "public"): eyes(p) for p in paths if "deer-icon" not in p}
json.dump(data, open(OUT, "w"), indent=1)
for k, v in data.items():
    print(f"{len(v['eyes'])}  {k}")
