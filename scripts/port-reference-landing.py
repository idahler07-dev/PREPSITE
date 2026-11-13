"""Port the approved landing design to src/components/lp/reference-landing.tsx, keeping every value.

From the repo root:
    npx tsx art/design/landing/print-mark.ts > /tmp/mark.svg
    python3 -I scripts/port-reference-landing.py art/design/landing/landing-reference.html /tmp/mark.svg \
        src/components/lp/reference-landing.tsx art/design/landing/logic.tsx.part
    npx prettier --write src/components/lp/reference-landing.tsx
"""
import json
import re
import sys
from html.parser import HTMLParser

SRC, MARK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(SRC, encoding="utf8").read()
body = s[s.index("<x-dc>") + 6 : s.index("</x-dc>")]

# global CSS from <helmet>, scoped to the page wrapper
css = re.search(r"<style>(.*?)</style>", body, re.S).group(1)
css = css.replace("body{margin:0;background:#fff}", "")
css = css.replace("a{color:#3A3A3C;text-decoration:none}a:hover{color:#0B0B0C}", ".ref-lp a{color:#3A3A3C;text-decoration:none}.ref-lp a:hover{color:#0B0B0C}")
# Undo the site's CSS reset (Tailwind preflight, in @layer base) inside the page, so it renders as the
# design file does on its own; inline styles still apply on top.
css = ".ref-lp,.ref-lp *,.ref-lp *::before,.ref-lp *::after{all:revert-layer}.ref-lp{display:block;line-height:normal;background:#fff}.ref-lp svg,.ref-lp img,.ref-lp video{display:inline;vertical-align:baseline;max-width:none;height:revert-layer}.ref-lp :is(h1,h2,h3,h4,h5,h6){font-family:inherit;font-weight:bold;letter-spacing:normal;word-spacing:normal;text-wrap:wrap}.ref-lp *{border-color:currentColor;font-variant-numeric:normal;text-wrap:wrap;hyphens:manual}" + css
body = body[body.index("</helmet>") + 9 :]

# the gold antler tile replaces the old cream one everywhere it is used
mark = open(MARK, encoding="utf8").read()
a = body.index('<g id="tile">')
depth, k = 0, a
for m in re.finditer(r"<g\b|</g>", body[a:]):
    depth += 1 if m.group(0) == "<g" else -1
    if depth == 0:
        k = a + m.end()
        break
body = body[:a] + f'<g id="tile">{mark}</g>' + body[k:]

# real routes for every link (the design used "#")
LINKS = {
    "WilloPrep home": "/", "Practice": "/practice", "Mock tests": "/mocks", "Score calculator": "/sat/score-calculator", "Log in": "/login",
    "START": "/login", "START PREPARING": "/login", "START FREE": "/login", "GET PREMIUM": "/pricing", "See every feature": "/resources",
    "Willo AI": "/willo", "SAT test dates": "/sat", "Vocabulary list": "/vocab", "Parents": "/contact", "Teachers and tutors": "/contact",
    "Schools": "/contact", "Privacy": "/privacy", "Terms": "/terms", "Still unsure? Write to us": "/contact", "Start drill": "/login",
    "22 days left": "/sat",
}

SVG_ATTRS = {k.lower(): k for k in ["viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform", "stdDeviation", "baseFrequency", "numOctaves", "stitchTiles", "patternUnits", "textLength", "markerWidth", "markerHeight", "refX", "refY", "clipPathUnits", "maskUnits", "fillRule", "clipRule"]}
TAGS = {k.lower(): k for k in ["linearGradient", "radialGradient", "feGaussianBlur", "feDropShadow", "feTurbulence", "feColorMatrix", "feComposite", "feBlend", "feOffset", "feMerge", "feMergeNode", "feFlood", "feComponentTransfer", "feFuncA", "clipPath", "textPath", "foreignObject", "feMorphology", "feDisplacementMap"]}
VOID = {"img", "br", "hr", "input", "meta", "link", "source"}


def camel(n):
    return re.sub(r"-([a-z])", lambda m: m.group(1).upper(), n)


def style_obj(v):
    out = {}
    for decl in v.split(";"):
        if ":" not in decl:
            continue
        p, val = decl.split(":", 1)
        p, val = p.strip(), val.strip()
        if not p:
            continue
        if p.startswith("-webkit-"):
            key = "Webkit" + camel(p[8:])[0].upper() + camel(p[8:])[1:]
        else:
            key = camel(p)
        if p == "font-family":
            val = val.replace("Inter, system-ui", "var(--font-inter), Inter, system-ui")
        out[key] = val  # later declarations win, as in CSS
    return "{{" + ", ".join(f"{json.dumps(k)}: {json.dumps(v)}" for k, v in out.items()) + "}}"


def expr(v):
    """Attribute value with {{x}} -> JSX expression or literal."""
    m = re.fullmatch(r"\{\{([\w.]+)\}\}", v)
    if m:
        return "{" + m.group(1) + "}"
    if "{{" in v:
        return "{`" + re.sub(r"\{\{([\w.]+)\}\}", r"${\1}", v) + "`}"
    return json.dumps(v)


class Conv(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.text_link = [], [], None

    def attrs_jsx(self, tag, attrs):
        res = []
        for n, v in attrs:
            v = "" if v is None else v
            if tag in ("sc-for", "sc-if"):
                continue
            if n == "class":
                n = "className"
            elif n == "for":
                n = "htmlFor"
            elif n == "tabindex":
                n = "tabIndex"
            elif n == "onclick":
                n = "onClick"
            elif n in SVG_ATTRS:
                n = SVG_ATTRS[n]
            elif n.startswith("aria-") or n.startswith("data-"):
                pass
            elif "-" in n:
                n = camel(n)
            if n == "style":
                if "{{" in v:
                    res.append(f"style={{css({expr(v)[1:-1]})}}" if v.startswith("{{") and v.endswith("}}") else f"style={{css({expr(v)[1:-1]})}}")
                else:
                    res.append(f"style={style_obj(v)}")
                continue
            if n == "href" and v.startswith("assets/"):
                v = "/mascot/formats/" + v[7:]
            if n == "src" and v.startswith("assets/"):
                v = "/mascot/formats/" + v[7:]
            res.append(f"{n}={expr(v)}" if v != "" or n not in ("hidden",) else n)
        return res

    def handle_starttag(self, tag, attrs, closed=False):
        d = dict(attrs)
        if tag == "sc-for":
            lst = d["list"].strip("{}")
            var = d["as"]
            self.out.append(f"{{{lst}.map(({var}, {var}Index) => (<Fragment key={{{var}Index}}>")
            self.stack.append("sc-for")
            return
        if tag == "sc-if":
            self.out.append(f"{{{d['value'].strip('{}')} && (<>")
            self.stack.append("sc-if")
            return
        if tag == "a":
            self.stack.append("a")
            self.out.append(("<a", attrs))
            return
        if tag == "img" and (d.get("src") or "").startswith(("assets/", "/mascot/")):
            src = d["src"].replace("assets/", "/mascot/formats/")
            mood = '{tryMood}' if ("sticker-stand" in src or "sc-if" in self.stack) else ('"happy"' if "sticker-cheer" in src else '"idle"')
            st = d.get("style", "")
            alt = json.dumps(d.get("alt", ""))
            self.out.append(f"<LiveWillo src={json.dumps(src)} alt={alt} mood={mood} style={style_obj(st)} />")
            return
        if tag == "button" and "type" not in d:
            attrs = [("type", "button")] + list(attrs)
        a = " ".join(self.attrs_jsx(tag, attrs))
        tag = TAGS.get(tag, tag)
        if tag in VOID or closed:
            self.out.append(f"<{tag} {a} />")
        else:
            self.out.append(f"<{tag} {a}>")
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs, closed=True)
        if tag not in VOID and tag in self.stack and self.stack[-1] == tag:
            pass

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        top = self.stack.pop()
        if top == "sc-for":
            self.out.append("</Fragment>))}")
        elif top == "sc-if":
            self.out.append("</>)}")
        elif top == "a":
            # resolve the link: find the opening tuple, read the anchor text
            i = max(j for j, x in enumerate(self.out) if isinstance(x, tuple))
            _, attrs = self.out[i]
            inner = "".join(x for x in self.out[i + 1 :] if isinstance(x, str))
            text = re.sub(r"<[^>]+>|\{[^}]*\}", " ", inner)
            text = re.sub(r"\s+", " ", text).replace("→", "").replace("↓", "").strip()
            d = dict(attrs)
            label = d.get("aria-label") or text
            href = d.get("href", "#")
            if href == "#" or href == "":
                href = next((v for k, v in LINKS.items() if label == k or label.startswith(k + " ") or label.startswith(k + ".")), "/login")
            attrs = [(k, (href if k == "href" else v)) for k, v in attrs]
            a = " ".join(self.attrs_jsx("a", attrs))
            el = "Link" if href.startswith("/") else "a"
            self.out[i] = f"<{el} {a}>"
            self.out.append(f"</{el}>")
        else:
            self.out.append(f"</{TAGS.get(tag, tag)}>")

    def handle_data(self, data):
        if not data:
            return
        t = data
        parts = re.split(r"(\{\{[\w.]+\}\})", t)
        res = ""
        for p in parts:
            m = re.fullmatch(r"\{\{([\w.]+)\}\}", p)
            if m:
                res += "{" + m.group(1) + "}"
            elif p:
                if re.fullmatch(r"\s+", p):
                    res += " " if "\n" not in p else "\n"
                else:
                    res += p.replace("{", "{'{'}").replace("}", "{'}'}").replace("<", "{'<'}").replace(">", "{'>'}").replace("'", "&apos;")
        self.out.append(res)

    def handle_comment(self, data):
        self.out.append("{/* " + data.strip().replace("*/", "") + " */}")


c = Conv()
c.feed(body)
jsx = "".join(x if isinstance(x, str) else "" for x in c.out)
assert not c.stack, c.stack

tsx = (
    '"use client";\n\n'
    "/* eslint-disable react/jsx-no-literals, @next/next/no-img-element -- generated from the approved design file (scripts/port-reference-landing.py); copy and values are kept exactly as designed */\n"
    'import { Fragment, useState } from "react";\nimport { Link } from "@/i18n/navigation";\nimport { LiveWillo } from "@/components/mascot/live-willo";\n\n'
    "const CSS = " + json.dumps(css) + ";\n\n"
    "function camel(p: string) {\n  return p.startsWith(\"-webkit-\") ? \"Webkit\" + p.slice(8).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()) : p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());\n}\n"
    "/** Style strings computed at runtime (quiz states, FAQ rows) to React style objects. */\n"
    "function css(str: string): React.CSSProperties {\n  const o: Record<string, string> = {};\n  for (const decl of str.split(\";\")) {\n    const i = decl.indexOf(\":\");\n    if (i > 0) o[camel(decl.slice(0, i).trim())] = decl.slice(i + 1).trim();\n  }\n  return o as React.CSSProperties;\n}\n\n"
    + open(sys.argv[4], encoding="utf8").read()
    + "\n  return (\n    <div className=\"ref-lp\">\n      <style dangerouslySetInnerHTML={{ __html: CSS }} />\n"
    + jsx
    + "\n    </div>\n  );\n}\n"
)
open(OUT, "w", encoding="utf8").write(tsx)
print("ok", len(tsx))
