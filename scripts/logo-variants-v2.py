"""Logo tile variants v2 (richer colour, bevelled antlers). Run from the repo root: python3 scripts/logo-variants-v2.py"""
"""Logo tile variants v2: richer colour, bevelled antlers (light edge + core shade), glow behind the W, two-tone option."""
HALF = ['M17 37 C11.5 31 8.5 22 9.5 9.5', 'M15.6 31.5 C18 26 20 22.5 22.3 18.8', 'M9.4 20 C10.3 16.2 11.6 13.4 13.6 11', 'M13.8 38.6 H20.6']
WD = [5.5, 3.8, 3.8, 3.4]          # stem, inner tine, outer tine, base bar
HL = ['M9.3 26.4 C8.2 22 7.6 17 7.9 12.2', 'M16.5 27.6 C17.8 24.7 19 22.4 20.5 20', 'M8.7 16.2 C9.2 14.6 9.9 13.3 10.9 12']

def both(inner):
    return f'<g>{inner}</g><g transform="matrix(-1 0 0 1 48 0)">{inner}</g>'

def paths(idx, stroke, scale=1.0, dx=0, dy=0, op=1):
    ps = "".join(f'<path d="{HALF[i]}" stroke-width="{WD[i]*scale:.2f}"/>' for i in idx)
    return f'<g fill="none" stroke="{stroke}" stroke-opacity="{op}" stroke-linecap="round" stroke-linejoin="round" transform="translate({dx} {dy})">{ps}</g>'

def mark(uid, bg, glow, stem, tine, shade, edge, core, rim, light=False):
    ALL, STEM, TINE = [0, 1, 2, 3], [0, 3], [1, 2]
    defs = f'''<defs>
<linearGradient id="{uid}t" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="{bg[0]}"/><stop offset=".55" stop-color="{bg[1]}"/><stop offset="1" stop-color="{bg[2]}"/></linearGradient>
<radialGradient id="{uid}s" cx=".22" cy=".0" r=".85"><stop offset="0" stop-color="#fff" stop-opacity="{.2 if light else .32}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="{uid}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{glow}" stop-opacity=".6"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="{uid}v" x1="0" y1=".55" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="{.06 if light else .28}"/></linearGradient>
<linearGradient id="{uid}a" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="6"><stop offset="0" stop-color="{stem[0]}"/><stop offset=".6" stop-color="{stem[1]}"/><stop offset="1" stop-color="{stem[2]}"/></linearGradient>
<linearGradient id="{uid}c" gradientUnits="userSpaceOnUse" x1="0" y1="34" x2="0" y2="8"><stop offset="0" stop-color="{tine[0]}"/><stop offset=".6" stop-color="{tine[1]}"/><stop offset="1" stop-color="{tine[2]}"/></linearGradient>
<filter id="{uid}b" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation=".8"/></filter></defs>'''
    two = stem != tine
    body = f'''<rect width="48" height="48" rx="13" fill="url(#{uid}t)"/>
<ellipse cx="24" cy="23" rx="20" ry="19" fill="url(#{uid}g)"/>
<rect width="48" height="48" rx="13" fill="url(#{uid}v)"/><rect width="48" height="48" rx="13" fill="url(#{uid}s)"/>
<rect x=".6" y=".6" width="46.8" height="46.8" rx="12.5" fill="none" stroke="{rim}" stroke-opacity="{.5 if light else .22}" stroke-width="1.1"/>
{both(paths(ALL, shade, 1.0, 0, 1.7, .5).replace('<g fill', f'<g filter="url(#{uid}b)" fill', 1))}
{both(paths(ALL, shade, 1.08, .35, .9))}
{both(paths(STEM if two else ALL, f"url(#{uid}a)", 1.0))}
{both(paths(TINE, f"url(#{uid}c)", 1.0)) if two else ""}
{both(paths(ALL, core, .36, .6, .7, .35))}
{both(paths(ALL, edge, .26, -.7, -.7, .8))}'''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{defs}{body}</svg>'

TEAL = ("#2093A1", "#0E6F7C", "#07313B")
V = {
 "1": ("Sunrise gold on teal", dict(bg=TEAL, glow="#52C0CC", stem=("#FFB347", "#FFD98A", "#FFF1C9"), tine=("#FFB347", "#FFD98A", "#FFF1C9"), shade="#3D1C04", edge="#FFFBEA", core="#C4620F", rim="#fff")),
 "2": ("Ember on deep ink", dict(bg=("#12424D", "#0A2A33", "#041419"), glow="#2A97A8", stem=("#FF6A1A", "#FFA050", "#FFD6A0"), tine=("#FF6A1A", "#FFA050", "#FFD6A0"), shade="#000", edge="#FFEBD2", core="#C2400A", rim="#5FD0DC")),
 "3": ("Chestnut on cream", dict(bg=("#FFFEFA", "#FBF2E0", "#EEDCBA"), glow="#FFD9A0", stem=("#8A4A22", "#B8703A", "#DB9A62"), tine=("#8A4A22", "#B8703A", "#DB9A62"), shade="#2A1306", edge="#F7DCBE", core="#5C2E12", rim="#D2A468", light=True)),
 "4": ("Cream on sunset orange", dict(bg=("#FFA05A", "#F5702A", "#D2491A"), glow="#FFE0B8", stem=("#FFF8EA", "#FFFFFF", "#FFFFFF"), tine=("#FFF8EA", "#FFFFFF", "#FFFFFF"), shade="#7A2208", edge="#FFFFFF", core="#F0C08A", rim="#fff")),
 "5": ("Two-tone: cream and copper", dict(bg=TEAL, glow="#52C0CC", stem=("#FFF3DA", "#FFFBEF", "#FFFFFF"), tine=("#FF8A3D", "#FFB067", "#FFD7A6"), shade="#032229", edge="#FFFFFF", core="#B7570F", rim="#fff")),
 "6": ("Mint and gold on midnight", dict(bg=("#14485A", "#0A2D3B", "#051820"), glow="#5FE0CF", stem=("#7FE3D4", "#BDF3EA", "#EFFFFC"), tine=("#FFB347", "#FFD98A", "#FFF1C9"), shade="#00090C", edge="#FFFFFF", core="#1B8F86", rim="#7FE3D4")),
}
import os
OUT = "public/brand/variants"
os.makedirs(OUT, exist_ok=True)
def uniq(svg, k, s): return svg.replace(f'id="{k}', f'id="{k}{s}').replace(f'url(#{k}', f'url(#{k}{s}')
cells = ""
for k, (name, kw) in V.items():
    svg = mark(f"m{k}", **kw)
    open(f"{OUT}/willoprep-mark-v2-{k}.svg", "w").write(svg)
    u = lambda s: uniq(svg, f"m{k}", s)
    cells += f'''<div style="background:#fff;border:1px solid #ECE9E3;border-radius:22px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:16px">
<div style="font:800 15px Inter;color:#0B0B0C;align-self:flex-start">{k} · {name}</div>
<div style="width:200px;height:200px;filter:drop-shadow(0 20px 24px rgba(12,58,67,.3))">{u("L")}</div>
<div style="display:flex;align-items:flex-end;gap:16px"><div style="width:64px;height:64px">{u("a")}</div><div style="width:40px;height:40px">{u("b")}</div><div style="width:24px;height:24px">{u("c")}</div></div>
<div style="display:flex;align-items:center;gap:10px;align-self:flex-start"><div style="width:34px;height:34px">{u("d")}</div><span style="font:800 21px Inter;letter-spacing:-.04em;color:#0B0B0C">Willo<span style="color:#0F6B78">Prep</span></span></div></div>'''
_ = (f'<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800&display=block" rel="stylesheet"><style>body{{margin:0;font-family:Inter}}#shot{{width:1200px;padding:36px;background:#F7F5F0;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}}</style></head><body><div id="shot">{cells}</div></body></html>')
