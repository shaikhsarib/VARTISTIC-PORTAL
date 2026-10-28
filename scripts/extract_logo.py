#!/usr/bin/env python3
"""Extract the 02·PALETTE mark + shared wordmark path from vartistic-logo-v4.svg
and generate src/components/vartistic/wordmark.ts + public/app-icon.svg files."""
import re, pathlib

svg = pathlib.Path("/home/z/my-project/upload/vartistic-logo-v4.svg").read_text()

# The wordmark path is the long path inside <g transform="translate(125.3,161.9)">
paths = re.findall(r'<path d="(M9\.357[^"]+)" fill="#111111"/>', svg)
assert paths, "wordmark path not found"
wordmark = paths[1]  # variation 02 · PALETTE
print("wordmark length:", len(wordmark))

mark = re.search(
    r'<g transform="translate\(485\.3,113\.0\) scale\(0\.64\)">(.*?)</g>', svg, re.S)
print("mark found:", bool(mark))

ts = f"""// AUTO-EXTRACTED from vartistic-logo-v4.svg (02 · PALETTE variation).
// Wordmark is the shared bold-sans wordmark path; i-dots are separate circles.
export const WORDMARK_PATH =
  "{wordmark}";

// i-dot circles (orange) positioned relative to the wordmark origin.
export const WORDMARK_DOTS = [
  {{ cx: 100.8, cy: -33.3, r: 4.6 }},
  {{ cx: 157.4, cy: -33.3, r: 4.6 }},
] as const;

// Orbit mark viewBox 0 0 100 100 (from variation 02).
export const ORBIT_RING =
  "M4,50a46,46 0 1,0 92,0a46,46 0 1,0 -92,0Z M53,72a11,11 0 1,0 22,0a11,11 0 1,0 -22,0Z";
export const ORBIT_DOTS = [
  {{ cx: 30, cy: 42, r: 8, color: "ink" }},
  {{ cx: 50, cy: 24, r: 8, color: "blue" }},
  {{ cx: 72, cy: 36, r: 8, color: "yellow" }},
] as const;
"""
out = pathlib.Path("/home/z/my-project/src/components/vartistic/wordmark.ts")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(ts)
print("wrote", out)

# App icon: orbit mark centered on cream tile (reads on light & dark tabs).
icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#111111"/>
  <path d="M4,50a46,46 0 1,0 92,0a46,46 0 1,0 -92,0Z M53,72a11,11 0 1,0 22,0a11,11 0 1,0 -22,0Z" fill="#ff5b3a" fill-rule="evenodd" transform="translate(2,2) scale(0.92)"/>
  <circle cx="32" cy="44" r="8" fill="#f6efe3"/>
  <circle cx="52" cy="26" r="8" fill="#2b59ff"/>
  <circle cx="74" cy="38" r="8" fill="#ffc531"/>
</svg>
"""
pathlib.Path("/home/z/my-project/src/app/icon.svg").write_text(icon)
print("wrote src/app/icon.svg")
