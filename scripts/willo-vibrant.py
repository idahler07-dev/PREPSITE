"""Vibrant watercolor treatment for Willo's art: clean, saturated hues, wet edges
that deepen the pigment, and soft blooms (creams and whites stay clean).

Applied once to the finished art in public/mascot (all deer poses and formats):
    python3 scripts/willo-vibrant.py
Every file uses the same seed, so an open-eyed base and its wink match exactly.
Do not run it twice on the same files.
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

def noise(h, w, scale, seed):
    rng = np.random.default_rng(seed)
    n = rng.random((max(2, h // scale + 2), max(2, w // scale + 2))).astype(np.float32)
    a = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
    return (a - a.mean()) / (a.std() + 1e-6)

def rgb2hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx, mn = c.max(-1), c.min(-1); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h, (mx - mn) / (mx + 1e-6), mx

def hsv2rgb(h, s, v):
    i = np.floor(h * 6); f = h * 6 - i; i = i.astype(int) % 6
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.select([i[..., None] == k for k in range(6)], [np.stack(x, -1) for x in [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]])
    return out

def treat(im, vib=0.35, wash=1.0, seed=7):
    a = np.asarray(im.convert("RGBA")).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    H, W = al.shape; k = W / 1000
    h, s, v = rgb2hsv(rgb)
    pig = np.clip((s - 0.18) / 0.25, 0, 1)  # pigmented areas (fur, scarf, antlers); creams and whites stay clean
    # vibrance: more chroma, a touch more light; orange nudged toward a warm red-orange, teal toward a clearer teal
    orange = np.exp(-((h - 0.075) / 0.05) ** 2)
    teal = np.exp(-((h - 0.52) / 0.06) ** 2)
    h = h - 0.008 * orange * vib / 0.35 + 0.006 * teal
    s = s * (1 + vib * pig * (1 + 0.6 * teal))
    v = v * (1 + 0.07 * vib * pig + 0.22 * teal * vib)
    # wet edges: pigment pools at the borders of each wash, a deeper, richer band
    f = rgb
    sm = np.stack([gaussian_filter(f[..., i], 2.5 * k) for i in range(3)], -1)
    edge = np.clip(gaussian_filter(np.abs(f - sm).sum(-1), 1.5 * k) * 7, 0, 1) * pig
    s = s * (1 + 0.12 * wash * edge)
    v = v * (1 - 0.05 * wash * edge)
    # soft blooms: uneven washes vary in strength, not in dirt
    lo = noise(H, W, max(1, int(170 * k)), seed)
    mid = noise(H, W, max(1, int(55 * k)), seed + 1)
    s = s * (1 + wash * pig * (0.07 * lo + 0.03 * mid))
    v = v * (1 + wash * pig * 0.025 * lo)
    # a whisper of granulation and paper tooth
    gran = np.clip(noise(H, W, max(1, int(2.5 * k)), seed + 9), -2, 2)
    v = v * (1 - 0.012 * wash * gran * (0.4 + 0.6 * pig))
    out = hsv2rgb(h % 1, np.clip(s, 0, 1), np.clip(v, 0, 1))
    return Image.fromarray((np.concatenate([out, al[..., None]], -1) * 255 + 0.5).astype(np.uint8), "RGBA")

if __name__ == "__main__":
    import glob
    files = sorted(glob.glob("public/mascot/deer-*.webp") + glob.glob("public/mascot/formats/*.png"))
    for f in files:
        out = treat(Image.open(f), 0.3, 0.8)
        if f.endswith(".webp"):
            out.save(f, quality=92, method=6)
        else:
            out.save(f, optimize=True)
        print(f)
