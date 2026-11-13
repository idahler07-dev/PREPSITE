"""Open-eyed base art for Willo's wink poses, so a wink can be animated from open eyes.

Needs numpy, Pillow, scipy and opencv-python-headless. From the repo root:
    python3 scripts/willo-open-eyes.py

For each wink image it paints out the closed-eye arc (inpaint from the fur around
it), then draws the open eye there: the other, open eye mirrored (so the highlight
sits on the matching side) and scaled to the closed eye's width. Writes
<name>-open.<ext> next to each source. The original wink image stays the target
the animation winks into.
"""
import cv2
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

FILES = [
    "public/mascot/deer-wink-hd.webp",
    "public/mascot/deer-wink.webp",
    "public/mascot/deer-wink-sm.webp",
    "public/mascot/formats/sticker-wink.png",
    "public/mascot/formats/avatar-wink.png",
    "public/mascot/formats/behind-wink.png",
]


def comps(a):
    r, g, b, al = (a[..., i] for i in range(4))
    navy = (al > 200) & (b > r + 15) & (r < 80) & (g < 90) & (b < 120)
    lab, n = ndimage.label(navy)
    H, W = r.shape
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) < W * H * 0.0004:
            continue
        bw, bh = np.ptp(xs) + 1, np.ptp(ys) + 1
        out.append(dict(i=i, x0=xs.min(), x1=xs.max(), y0=ys.min(), y1=ys.max(), cx=xs.mean(), cy=ys.mean(), w=bw, h=bh, fill=len(ys) / (bw * bh)))
    return lab, out


def open_eye(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(np.int32)
    H, W = a.shape[:2]
    lab, cs = comps(a)
    iris = max((c for c in cs if c["fill"] > 0.6 and 0.7 < c["w"] / c["h"] < 1.3), key=lambda c: c["w"] * c["h"])
    arc = min(
        (c for c in cs if c["fill"] < 0.5 and c["w"] / c["h"] > 1.5 and abs(c["cy"] - iris["cy"]) < 0.12 * H and c["w"] < 0.25 * W and c is not iris),
        key=lambda c: abs(c["cy"] - iris["cy"]),
    )
    # 1. paint out the closed-eye arc
    rgb = np.ascontiguousarray(a[..., :3].astype(np.uint8)[..., ::-1])
    k = max(3, int(W * 0.006))
    m = (lab == arc["i"]).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((k, k), np.uint8), iterations=3)
    rgb = cv2.inpaint(rgb, m, max(3, k), cv2.INPAINT_TELEA)
    out = a.copy()
    out[..., :3] = rgb[..., ::-1]
    # where the inpaint pulled in an outline, lay the cheek's own cream back down
    ring = cv2.dilate(m, np.ones((k, k), np.uint8), iterations=3) > 0
    ring &= m == 0
    lum = a[..., :3].mean(-1)
    cream = np.median(a[ring & (lum > 200)][:, :3], 0) if (ring & (lum > 200)).any() else None
    if cream is not None:
        dark = (m > 0) & (out[..., :3].mean(-1) < 228)
        soft = cv2.GaussianBlur(dark.astype(np.float32), (0, 0), max(1.0, k / 2))
        soft = np.clip(soft * 1.6, 0, 1)[..., None]
        out[..., :3] = (out[..., :3] * (1 - soft) + cream * soft).astype(np.int32)
    # 2. the open eye, with its white and outline, mirrored and scaled to the arc
    ex, ey = (iris["x0"] + iris["x1"]) / 2, (iris["y0"] + iris["y1"]) / 2
    rx, ry = iris["w"] / 2 * 1.42, iris["h"] / 2 * 1.36
    bx0, by0 = int(ex - rx * 1.15), int(ey - ry * 1.15)
    bx1, by1 = int(ex + rx * 1.15), int(ey + ry * 1.15)
    patch = Image.fromarray(a[by0:by1, bx0:bx1].astype(np.uint8), "RGBA").transpose(Image.FLIP_LEFT_RIGHT)
    s = 1.08  # the same eye, a touch larger as the nearer one (as in the two-eyed poses)
    pw, ph = round(patch.width * s), round(patch.height * s)
    patch = patch.resize((pw, ph), Image.LANCZOS)
    mask = Image.new("L", (pw * 4, ph * 4), 0)
    from PIL import ImageDraw

    ImageDraw.Draw(mask).ellipse(
        (
            (pw / 2 - rx * s * 0.99) * 4,
            (ph / 2 - ry * s * 0.99) * 4,
            (pw / 2 + rx * s * 0.99) * 4,
            (ph / 2 + ry * s * 0.99) * 4,
        ),
        fill=255,
    )
    mask = mask.resize((pw, ph), Image.LANCZOS).filter(ImageFilter.GaussianBlur(max(0.6, W / 900)))
    cx = arc["cx"]
    cy = arc["y0"] + arc["h"] * 0.55
    res = Image.fromarray(out.astype(np.uint8), "RGBA")
    res.paste(patch, (round(cx - pw / 2), round(cy - ph / 2)), mask)
    dot = path.rfind(".")
    dst = path[:dot].replace("-hd", "").replace("-sm", "") + "-open" + ("-hd" if "-hd" in path else "-sm" if "-sm" in path else "") + path[dot:]
    if dst.endswith(".webp"):
        res.save(dst, quality=92, method=6)
    else:
        res.save(dst, optimize=True)
    return dst, (cx / W, cy / H, rx * s / W, ry * s / H)


if __name__ == "__main__":
    for f in FILES:
        dst, eye = open_eye(f)
        print(dst, [round(v, 4) for v in eye])
