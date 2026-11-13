"""Logo tile variants (antler-W colours). Run from the repo root: python3 scripts/logo-variants.py"""
"""Logo tile variants: same antler-W geometry (48 grid), different antler/tile colours, polished with a lit gradient,
a soft cast shade, a thin top highlight on each tine and a glassy tile rim."""
HALF = ['M17 37 C11.5 31 8.5 22 9.5 9.5', 'M15.6 31.5 C18 26 20 22.5 22.3 18.8', 'M9.4 20 C10.3 16.2 11.6 13.4 13.6 11', 'M13.8 38.6 H20.6']
HL = ['M9.3 26.4 C8.2 22 7.6 17 7.9 12.2', 'M16.5 27.6 C17.8 24.7 19 22.4 20.5 20', 'M8.7 16.2 C9.2 14.6 9.9 13.3 10.9 12']

def both(inner):
    return f'<g>{inner}</g><g transform="matrix(-1 0 0 1 48 0)">{inner}</g>'

def lines(stroke, w, extra=""):
    k = w / 5.5
    wd = [4.6 * k, 3.1 * k, 3.1 * k, 3.0 * k]
    ps = "".join(f'<path d="{d}" stroke-width="{wd[i]:.2f}"/>' for i, d in enumerate(HALF))
    return both(f'<g fill="none" stroke="{stroke}" stroke-linecap="round" stroke-linejoin="round" {extra}>{ps}</g>')

def hl(col, op):
    ps = "".join(f'<path d="{d}"/>' for d in HL)
    return both(f'<g fill="none" stroke="{col}" stroke-opacity="{op}" stroke-width="1.0" stroke-linecap="round">{ps}</g>')

def tile(uid, bg, antler, shade, hi, tip=None, rim="#fff", bg_is_light=False, extra_tip=False):
    a0, a1 = antler
    g = f'''<defs>
<linearGradient id="{uid}t" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="{bg[0]}"/><stop offset=".55" stop-color="{bg[1]}"/><stop offset="1" stop-color="{bg[2]}"/></linearGradient>
<radialGradient id="{uid}s" cx=".25" cy=".02" r=".8"><stop offset="0" stop-color="#fff" stop-opacity="{.18 if bg_is_light else .3}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="{uid}a" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="6"><stop offset="0" stop-color="{a0}"/><stop offset="1" stop-color="{a1}"/></linearGradient>
<filter id="{uid}b" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation=".7"/></filter></defs>'''
    body = f'''<rect width="48" height="48" rx="13" fill="url(#{uid}t)"/><rect width="48" height="48" rx="13" fill="url(#{uid}s)"/>
<rect x=".6" y=".6" width="46.8" height="46.8" rx="12.5" fill="none" stroke="{rim}" stroke-opacity="{.45 if bg_is_light else .2}" stroke-width="1.1"/>
<g filter="url(#{uid}b)" opacity=".55" transform="translate(0 1.6)">{lines(shade, 6)}</g>
{lines(shade, 5.9, 'transform="translate(.45 1)"')}
{lines(f"url(#{uid}a)", 5.5)}
{hl(hi, .8)}'''
    if tip:
        seg = both("".join(f'<path d="{d}" pathLength="100" stroke-dasharray="0 82 18" fill="none" stroke="{tip}" stroke-width="{w_:.2f}" stroke-linecap="round"/>' for d, w_ in [(HALF[0], 4.6 * 5.5 / 5.5), (HALF[1], 3.1), (HALF[2], 3.1)]))
        body = body.replace(hl(hi, .8), seg + hl(hi, .8))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{g}{body}</svg>'

V = {
 "A": ("Copper on teal", dict(bg=("#1C8896", "#0F6B78", "#0A3D46"), antler=("#FFC48A", "#F0702E"), shade="#4A1A05", hi="#FFF1DE")),
 "B": ("Gold on teal", dict(bg=("#1C8896", "#0F6B78", "#0A3D46"), antler=("#FFE28A", "#E09A1F"), shade="#5A3A04", hi="#FFF8DA")),
 "C": ("Brown on cream", dict(bg=("#FFFDF7", "#FBF1DF", "#F2E2C4"), antler=("#B8723C", "#6B3A1B"), shade="#2F1708", hi="#F5D9B8", rim="#C99A5B", bg_is_light=True)),
 "D": ("Teal on orange", dict(bg=("#FF9A55", "#F5702A", "#D9531A"), antler=("#1B8E9C", "#0A3D46"), shade="#5A1E05", hi="#BDEFF2")),
 "E": ("Original cream, polished", dict(bg=("#1C8896", "#0F6B78", "#0A3D46"), antler=("#FFFBF0", "#F1D9A6"), shade="#04232A", hi="#FFFFFF")),
 "F": ("Mint on deep navy", dict(bg=("#15505C", "#0C3A43", "#072A31"), antler=("#CFF5EE", "#6FCFC7"), shade="#021A1F", hi="#FFFFFF")),
}
import os
OUT = "public/brand/variants"
os.makedirs(OUT, exist_ok=True)
cells = ""
for k, (name, kw) in V.items():
    svg = tile(k, **kw); open(f"{OUT}/willoprep-mark-{k}.svg", "w").write(svg)
    sm = lambda s: f'<div style="width:{s}px;height:{s}px">{svg.replace(f"id=\"{k}", f"id=\"{k}{s}").replace(f"url(#{k}", f"url(#{k}{s}")}</div>'
    cells += f'''<div style="background:#fff;border:1px solid #ECE9E3;border-radius:22px;padding:26px;display:flex;flex-direction:column;align-items:center;gap:16px">
<div style="font:800 15px Inter;color:#0B0B0C;align-self:flex-start">{k} · {name}</div>
<div style="width:190px;height:190px;filter:drop-shadow(0 18px 22px rgba(12,58,67,.28))">{svg.replace(f'id="{k}', f'id="{k}L').replace(f'url(#{k}', f'url(#{k}L')}</div>
<div style="display:flex;align-items:flex-end;gap:16px">{sm(64)}{sm(40)}{sm(24)}</div>
<div style="display:flex;align-items:center;gap:10px;align-self:flex-start"><div style="width:34px;height:34px">{svg.replace(f'id="{k}', f'id="{k}W').replace(f'url(#{k}', f'url(#{k}W')}</div><span style="font:800 21px Inter;letter-spacing:-.04em;color:#0B0B0C">Willo<span style="color:#0F6B78">Prep</span></span></div></div>'''
html = f'''<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800&display=block" rel="stylesheet"><style>body{{margin:0;font-family:Inter}}#shot{{width:1200px;padding:36px;background:#F7F5F0;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}}</style></head><body><div id="shot">{cells}</div></body></html>'''

