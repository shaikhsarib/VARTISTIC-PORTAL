import pathlib, re

svg_path = pathlib.Path(r"c:\Users\JUBER\Downloads\main\vartistic-portal\logos\standard-autonomous-and-vartistic-logos.svg")
text = svg_path.read_text(encoding="utf-8")

# 1. Locate VARTISTIC 02 · STROKES section
idx_label = text.find("VARTISTIC 02")
assert idx_label != -1, "Vartistic 02 label not found"

# 2. Extract mark: translate(407.9,378.0)
m_mark = re.search(r'(<g transform="translate\(407\.9,378\.0\)[^>]*>.*?</g></g>)', text, re.S)
assert m_mark, "Mark not found"
mark_xml = m_mark.group(1)
print("Mark XML:\n", mark_xml)

# 3. Extract wordmark: translate(487.9,422.1)
m_word = re.search(r'<g transform="translate\(487\.9,422\.1\)">\s*<path d="([^"]+)" fill="([^"]+)"\s*/>\s*<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="([^"]+)"\s*/>\s*<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="([^"]+)"\s*/>', text, re.S)
assert m_word, "Wordmark not found"
wordmark_d = m_word.group(1)
dot1 = (float(m_word.group(3)), float(m_word.group(4)), float(m_word.group(5)))
dot2 = (float(m_word.group(7)), float(m_word.group(8)), float(m_word.group(9)))
print("Wordmark path len:", len(wordmark_d))
print("Dots:", dot1, dot2)

# Generate updated wordmark.ts
ts_content = f'''// AUTO-EXTRACTED from standard-autonomous-and-vartistic-logos.svg (02 · STROKES variation).
export const WORDMARK_PATH =
  "{wordmark_d}";

// i-dot circles (coral) positioned relative to the wordmark origin.
export const WORDMARK_DOTS = [
  {{ cx: {dot1[0]}, cy: {dot1[1]}, r: {dot1[2]} }},
  {{ cx: {dot2[0]}, cy: {dot2[1]}, r: {dot2[2]} }},
] as const;

// 02 · STROKES geometry: 4 slanted pill strokes at skewX(-12)
export const STROKES_CONFIG = {{
  skew: -12,
  strokes: [
    {{ x: 8, y: 12, width: 8, height: 76, rx: 4.0, isAccent: false }},
    {{ x: 26, y: 12, width: 12, height: 76, rx: 6.0, isAccent: false }},
    {{ x: 46, y: 12, width: 18, height: 76, rx: 9.0, isAccent: false }},
    {{ x: 72, y: 12, width: 26, height: 76, rx: 13.0, isAccent: true }},
  ],
}} as const;
'''

out_ts = pathlib.Path(r"c:\Users\JUBER\Downloads\main\vartistic-portal\vartistic-portal\src\components\vartistic\wordmark.ts")
out_ts.write_text(ts_content, encoding="utf-8")
print("Updated wordmark.ts successfully")

