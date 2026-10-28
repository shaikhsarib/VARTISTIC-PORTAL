"""Patch page-number fields for WPS/Office compatibility (docx skill toc.md rules).

1. Remove empty <w:pgNumType/> emitted for the cover section.
2. Patch footer PAGE instrText with explicit format switches:
   - footer referenced by section 2 (front matter) -> PAGE \\* ROMAN \\* MERGEFORMAT
   - footer referenced by section 3 (body)         -> PAGE \\* arabic \\* MERGEFORMAT
"""
import re
import shutil
import sys
import zipfile

DOCX = "/home/z/my-project/download/Deep-Dive_Research_and_Analysis_UI_Design_AI_Sources.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as zin:
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}

doc = data["word/document.xml"].decode("utf-8")

# 1. remove empty pgNumType (confuses WPS on the cover section)
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
print(f"removed {before} empty <w:pgNumType/>")

# 2. map sections -> footer rels (in document order)
sect_prs = re.findall(r"<w:sectPr[^>]*>.*?</w:sectPr>", doc, flags=re.S)
print(f"sections found: {len(sect_prs)}")
footer_ids_per_section = []
for sp in sect_prs:
    ids = re.findall(r'<w:footerReference[^>]*w:type="default"[^>]*r:id="([^"]+)"', sp)
    if not ids:
        ids = re.findall(r'<w:footerReference[^>]*r:id="([^"]+)"', sp)
    footer_ids_per_section.append(ids)
print("footer refs per section:", footer_ids_per_section)

rels = data["word/_rels/document.xml.rels"].decode("utf-8")
rid_to_target = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))

def patch_footer(fname, fmt):
    key = "word/" + fname
    if key not in data:
        print(f"  !! {key} missing")
        return
    xml = data[key].decode("utf-8")
    xml2, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        r"\1 PAGE \\* " + fmt + r" \\* MERGEFORMAT \2",
        xml,
    )
    data[key] = xml2.encode("utf-8")
    print(f"  patched {key} -> {fmt} ({n} fields)")

# section 1 = cover (no footer), 2 = front matter (ROMAN), 3 = body (arabic)
if len(footer_ids_per_section) >= 3:
    front_ids = footer_ids_per_section[1]
    body_ids = footer_ids_per_section[2]
    for rid in front_ids:
        target = rid_to_target.get(rid, "")
        patch_footer(target.split("/")[-1], "ROMAN")
    for rid in body_ids:
        target = rid_to_target.get(rid, "")
        patch_footer(target.split("/")[-1], "arabic")
else:
    print("!! unexpected section count; no footer patch applied")
    sys.exit(1)

data["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        zout.writestr(n, data[n])
shutil.move(TMP, DOCX)
print("OK patched", DOCX)
