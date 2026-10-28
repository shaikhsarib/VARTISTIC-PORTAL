#!/usr/bin/env python3
"""WCAG AA contrast verification for the Vartistic token system.
Parses :root (light) and .dark (dark) tokens from globals.css and checks the
critical text/background pairings. Exits non-zero on any failure."""
import re, sys, pathlib

css = pathlib.Path("/home/z/my-project/src/app/globals.css").read_text()

def lum(hex_color: str) -> float:
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def contrast(fg: str, bg: str) -> float:
    l1, l2 = lum(fg), lum(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)

def section(name: str) -> dict:
    m = re.search(name + r"\s*\{(.*?)\}", css, re.S)
    return dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", m.group(1)))

light, dark = section(r":root"), section(r"\.dark")

PAIRS = [
    # (label, fg token, bg token, required ratio)
    ("body text on background (L)", "--foreground", "--background", 4.5),
    ("body text on card (L)", "--card-foreground", "--card", 4.5),
    ("muted text on background (L)", "--muted-foreground", "--background", 4.5),
    ("primary button text (L)", "--primary-foreground", "--primary", 4.5),
    ("accent text on background (L)", "--accent-foreground", "--background", 4.5),
    ("danger on background (L)", "--destructive", "--background", 4.5),
    ("success on background (L)", "--success", "--background", 4.5),
    ("warning on background (L)", "--warning", "--background", 4.5),
    ("info on background (L)", "--info", "--background", 4.5),
    ("body text on background (D)", "--foreground", "--background", 4.5),
    ("body text on card (D)", "--card-foreground", "--card", 4.5),
    ("muted text on background (D)", "--muted-foreground", "--background", 4.5),
    ("primary button text (D)", "--primary-foreground", "--primary", 4.5),
    ("accent text on background (D)", "--accent-foreground", "--background", 4.5),
    ("danger on background (D)", "--destructive", "--background", 4.5),
    ("success on background (D)", "--success", "--background", 4.5),
    ("warning on background (D)", "--warning", "--background", 4.5),
    ("info on background (D)", "--info", "--background", 4.5),
]

theme_map = {"(L)": light, "(D)": dark}
failed = 0
print(f"{'pair':44s} {'ratio':>6s}  required")
for label, fg, bg, req in PAIRS:
    theme = theme_map[label[-3:]]
    ratio = contrast(theme[fg.lstrip("--")], theme[bg.lstrip("--")])
    ok = ratio >= req
    failed += 0 if ok else 1
    print(f"{label:44s} {ratio:6.2f}  {req:.1f} {'PASS' if ok else 'FAIL'}")

# brand pairings used directly in components (brand tokens live in :root, shared)
brand = light  # brand-* tokens are defined once in :root and shared by .dark
extra = [
    ("ink text on yellow chip", brand["brand-ink"], brand["brand-yellow"], 4.5),
    ("ink text on yellow chip (D)", brand["brand-ink"], brand["brand-yellow"], 4.5),
    ("coral on dark background (D)", brand["brand-coral"], dark["background"], 4.5),
    ("cream text on ink (preloader D)", brand["brand-cream"], "#111111", 4.5),
    ("ink text on cream (preloader L)", brand["brand-ink"], brand["brand-cream"], 4.5),
]
for label, fg, bg, req in extra:
    ratio = contrast(fg, bg)
    ok = ratio >= req
    failed += 0 if ok else 1
    print(f"{label:44s} {ratio:6.2f}  {req:.1f} {'PASS' if ok else 'FAIL'}")

print(f"\n{'ALL PASS' if failed == 0 else str(failed) + ' FAILURES'}")
sys.exit(1 if failed else 0)
