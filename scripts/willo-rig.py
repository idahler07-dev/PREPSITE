"""Needs numpy + Pillow. Run from the repo root: python3 scripts/willo-rig.py
Build the warp rig for each Willo pose: region masks (2 small PNGs) + geometry JSON."""
import json, math, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "public/mascot"
OUT = "public/mascot/rig"
os.makedirs(OUT, exist_ok=True)

# (x, y, open) eye centres measured from the art, left eye first.
POSES = {
    "stand": [(245, 320, 1), (412, 288, 1)],
    "wink": [(222, 314, 0), (394, 276, 1)],
    "idea": [(239, 303, 1), (403, 258, 1)],
    "think": [(323, 335, 1), (503, 279, 1)],
    "read": [(319, 382, 1), (494, 350, 1)],
    "laptop": [(356, 361, 1), (522, 328, 1)],
    "sad": [(284, 402, 1), (472, 356, 1)],
    "heart": [(246, 330, 0), (424, 267, 0)],
    "cheer": [(229, 327, 0), (408, 265, 0)],
    "jump": [(230, 308, 0), (406, 259, 0)],
    "trophy": [(273, 308, 0), (443, 247, 0)],
    "sleep": None,
}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(m, s):
    im = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(s))
    return np.asarray(im).astype(np.float32) / 255


def label(mask, step=4):
    """Connected components on a downsampled copy. Returns (labels at full res, list of (area, cx, cy))."""
    H, W = mask.shape
    small = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((W // step, H // step), Image.BILINEAR)) > 100
    h, w = small.shape
    lab = np.zeros((h, w), np.int32)
    comps = []
    k = 0
    for y0 in range(h):
        for x0 in range(w):
            if small[y0, x0] and not lab[y0, x0]:
                k += 1
                q = deque([(y0, x0)])
                lab[y0, x0] = k
                pts = []
                while q:
                    y, x = q.popleft()
                    pts.append((y, x))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = y + dy, x + dx
                            if 0 <= yy < h and 0 <= xx < w and small[yy, xx] and not lab[yy, xx]:
                                lab[yy, xx] = k
                                q.append((yy, xx))
                p = np.array(pts)
                comps.append((len(pts) * step * step, p[:, 1].mean() * step, p[:, 0].mean() * step))
    full = np.asarray(Image.fromarray(lab.astype(np.int32), "I").resize((W, H), Image.NEAREST))
    return full, comps


def gen(name, eyes):
    im = Image.open(f"{SRC}/deer-{name}.webp").convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    meta = {"w": W, "h": H}
    z = np.zeros((H, W), np.float32)
    if eyes is None:
        meta["still"] = True
        return meta, z, z, z, z, z, z
    X, Y = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    e1, e2 = eyes
    d = math.hypot(e2[0] - e1[0], e2[1] - e1[1])
    phi = math.atan2(e2[1] - e1[1], e2[0] - e1[0])
    right = (math.cos(phi), math.sin(phi))
    down = (-math.sin(phi), math.cos(phi))
    mid = ((e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2)
    c = (mid[0] + down[0] * 0.06 * d, mid[1] + down[1] * 0.06 * d)
    R = 0.93 * d
    n = (c[0] + down[0] * R, c[1] + down[1] * R)
    rx, ry = X - c[0], Y - c[1]
    l = rx * right[0] + ry * right[1]
    s = rx * down[0] + ry * down[1]

    # antlers: brown above the face
    brown = (r > 70) & (r < 185) & (g > 30) & (g < 105) & (b > 10) & (b < 75) & (al > 200)
    ant = (brown & (s < -0.45 * R) & (np.abs(l) < 2.4 * R)).astype(np.float32)
    ant = np.clip(blur(ant, 5) * 1.9, 0, 1)

    # head block
    lat = 1 - smooth(1.28 * R, 1.7 * R, np.abs(l))
    vert = np.where(s < 0, 1.0, 1 - smooth(0.6 * R, 1.25 * R, s))
    head = np.maximum(lat * vert, ant)

    # ears: the cream inner patches that sit outside the face, left and right
    cream = (r > 244) & (g > 220) & (b > 185) & (al > 200) & (np.hypot(rx, ry) > 0.95 * R) & (s < 0.55 * R)
    clab, ccomps = label(cream.astype(np.float32), 3)
    ear_list = [cc for cc in ccomps if cc[0] > 1500]
    ears = z.copy()
    ear_meta = []
    for cc in sorted(ear_list, key=lambda t: t[1])[:6]:
        pass
    if len(ear_list) >= 1:
        left = min(ear_list, key=lambda t: (t[1] - c[0]) * right[0] + (t[2] - c[1]) * right[1])
        rightc = max(ear_list, key=lambda t: (t[1] - c[0]) * right[0] + (t[2] - c[1]) * right[1])
        picks = [left] if left is rightc else [left, rightc]
        for cc in picks:
            E = np.array([cc[1], cc[2]]); C = np.array(c)
            P = E + (C - E) * 0.6
            v = E - P
            t = np.clip(((X - P[0]) * v[0] + (Y - P[1]) * v[1]) / (v @ v), 0, 1)
            dist = np.hypot(X - E[0], Y - E[1])
            w = (1 - smooth(0.4 * R, 0.9 * R, dist)) * smooth(0.05, 0.6, t)
            ears = np.maximum(ears, w.astype(np.float32))
            ear_meta.append({"c": [float(E[0]), float(E[1])], "p": [float(P[0]), float(P[1])]})
    ears = np.clip(ears, 0, 1)

    # scarf tail: the teal blob joined to the neck, left of the face
    teal = (r < 110) & (b > r + 45) & (g > r + 28) & (g < 175) & (b < 195) & (al > 200)
    scarf = z.copy()
    lab, comps = label(teal.astype(np.float32), 3)
    keep = np.zeros((H, W), bool)
    for i, (area, cx, cy) in enumerate(comps):
        lc = (cx - c[0]) * right[0] + (cy - c[1]) * right[1]
        if area > 1500 and lc < -0.1 * R and cy < n[1] + 0.3 * R and math.hypot(cx - n[0], cy - n[1]) < 2.6 * R:
            keep |= lab == i + 1
    comp = keep & teal & (l < -0.15 * R)
    dn = np.hypot(X - n[0], Y - n[1])
    scarf = np.clip(blur(comp.astype(np.float32), 4) * smooth(0.75 * R, 1.5 * R, dn) * 1.3, 0, 1)

    # accent ticks and held item (yellow / red)
    yel = (r >= 238) & (g >= 170) & (g <= 228) & (b < 100) & (al > 200) & ((np.hypot(rx, ry) > 1.2 * R) | (s < -1.25 * R))
    ylab, ycomps = label(yel.astype(np.float32), 3)
    item = z.copy()
    ticks = z.copy()
    meta_item = None
    big = [i for i, cc in enumerate(ycomps) if cc[0] > 7000]
    solid = (al > 60).astype(np.float32)
    top = max(ycomps, key=lambda cc: cc[0]) if ycomps else None
    for i, (area, cx, cy) in enumerate(ycomps):
        m = (ylab == i + 1) & yel
        if name in ("trophy", "idea") and top is not None and area == top[0] and area > (7000 if name == "trophy" else 1500):
            item = np.maximum(item, blur(m.astype(np.float32), 3))
            ys2, xs2 = np.nonzero(m)
            meta_item = {"mode": "sway" if name == "trophy" else "bob", "c": [float(cx), float(cy)], "pivot": [float(cx), float(ys2.max())]}
        elif area < 7000 and math.hypot(cx - c[0], cy - c[1]) > 1.5 * R:
            ring = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
            ring &= ~m
            if ring.sum() and (solid[ring] < 0.25).mean() > 0.7:
                ticks = np.maximum(ticks, blur(m.astype(np.float32), 3))
    if name == "heart":
        red = (r > 205) & (g < 115) & (b < 105) & (al > 200)
        rlab, rcomps = label(red.astype(np.float32), 3)
        if rcomps:
            i = int(np.argmax([cc[0] for cc in rcomps]))
            m = (rlab == i + 1) & red
            item = blur(m.astype(np.float32), 3)
            meta_item = {"mode": "pulse", "c": [float(rcomps[i][1]), float(rcomps[i][2])]}

    # raised arm: a brown paw out to the right at shoulder height or higher
    arm = None
    pawmask = (brown & (s > -0.45 * R) & (Y < 0.8 * H) & (l > 0.7 * R)).astype(np.float32)
    plab, pcomps = label(pawmask, 4)
    cands = [cc for cc in pcomps if cc[0] > 1200 and cc[2] < n[1] + 0.5 * R]
    if cands and name in ("cheer", "wink", "idea", "jump"):
        cc = max(cands, key=lambda t: t[1])
        sh = (n[0] + right[0] * 0.5 * R + down[0] * 0.3 * R, n[1] + right[1] * 0.5 * R + down[1] * 0.3 * R)
        arm = {"s": [float(sh[0]), float(sh[1])], "p": [float(cc[1]), float(cc[2])], "w": float(0.42 * R)}

    meta.update(
        {
            "c": [float(c[0]), float(c[1])],
            "R": float(R),
            "n": [float(n[0]), float(n[1])],
            "right": list(map(float, right)),
            "down": list(map(float, down)),
            "eyes": [{"c": [float(e[0]), float(e[1])], "r": 40.0, "open": bool(e[2])} for e in eyes],
            "arm": arm,
            "ears": ear_meta,
            "item": meta_item,
            "ticks": bool(ticks.max() > 0.3),
            "scarf": bool(scarf.max() > 0.3),
        }
    )
    return meta, head, ant, ears, scarf, item, ticks


def save(name, meta, head, ant, ears, scarf, item, ticks):
    W, H = meta["w"], meta["h"]
    sw, sh = W // 4, H // 4
    def pack(*ch):
        arr = np.stack([np.clip(c, 0, 1) for c in ch], -1)
        return Image.fromarray((arr * 255).astype(np.uint8), "RGB").resize((sw, sh), Image.BILINEAR)
    pack(head, ant, ears).save(f"{OUT}/{name}-m1.png", optimize=True)
    pack(scarf, item, ticks).save(f"{OUT}/{name}-m2.png", optimize=True)
    json.dump(meta, open(f"{OUT}/{name}.json", "w"))


tiles = []
for name, eyes in POSES.items():
    meta, head, ant, ears, scarf, item, ticks = gen(name, eyes)
    save(name, meta, head, ant, ears, scarf, item, ticks)
    im = Image.open(f"{SRC}/deer-{name}.webp").convert("RGBA")
    bg = Image.new("RGBA", im.size, (235, 242, 246, 255)); bg.alpha_composite(im)
    base = np.asarray(bg.convert("RGB")).astype(np.float32)
    def tint(base, m, col, k=0.55):
        m = m[..., None] * k
        return base * (1 - m) + np.array(col, np.float32) * m
    if "c" in meta:
        base = tint(base, head, (255, 0, 60), 0.35)
        base = tint(base, ant, (0, 200, 60), 0.6)
        base = tint(base, ears, (0, 80, 255), 0.6)
        base = tint(base, scarf, (255, 220, 0), 0.7)
        base = tint(base, item, (200, 0, 255), 0.7)
        base = tint(base, ticks, (0, 220, 230), 0.8)
    out = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(out)
    if "c" in meta:
        for e in meta["eyes"]:
            x, y = e["c"]; d.ellipse((x - 40, y - 40, x + 40, y + 40), outline=(255, 255, 255) if e["open"] else (120, 120, 120), width=3)
        cx, cy = meta["c"]; d.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill=(0, 0, 0))
        nx, ny = meta["n"]; d.ellipse((nx - 7, ny - 7, nx + 7, ny + 7), outline=(0, 0, 0), width=3)
        if meta["arm"]:
            sx, sy = meta["arm"]["s"]; px, py = meta["arm"]["p"]; d.line((sx, sy, px, py), fill=(255, 0, 0), width=6); d.ellipse((px - 8, py - 8, px + 8, py + 8), fill=(255, 0, 0))
    out.thumbnail((360, 360))
    t = Image.new("RGB", (360, 380), (255, 255, 255)); t.paste(out, ((360 - out.width) // 2, 20))
    ImageDraw.Draw(t).text((8, 4), f"{name} arm={bool(meta.get('arm'))} item={bool(meta.get('item'))} ticks={meta.get('ticks')} scarf={meta.get('scarf')}", fill=(0, 0, 0))
    tiles.append(t)
sheet = Image.new("RGB", (360 * 4, 380 * 3), "white")
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 4) * 360, (i // 4) * 380))
pass
print("ok", sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT)) // 1024, "KB")
