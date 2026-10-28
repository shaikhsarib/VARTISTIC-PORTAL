"""Fix TOC first-entry duplication left by the placeholder injector.

1. Give the PAGEREF _Toc1 field (inside the TOC field paragraph) a cached page number "1".
2. Remove the duplicated injected plain entry "1. Executive Summary ... 1".
"""
import re
import shutil
import zipfile

DOCX = "/home/z/my-project/download/Deep-Dive_Research_and_Analysis_UI_Design_AI_Sources.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as zin:
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}

xml = data["word/document.xml"].decode("utf-8")

# 1. cache page number "1" in the first PAGEREF field
pageref_pat = (
    r'(<w:fldChar w:fldCharType="begin" w:dirty="true"/>'
    r'<w:instrText xml:space="preserve">PAGEREF _Toc1 \\h</w:instrText>'
    r'<w:fldChar w:fldCharType="separate"/>)'
    r'(<w:fldChar w:fldCharType="end"/>)'
)
xml, n1 = re.subn(pageref_pat, r"\1<w:r><w:t>1</w:t></w:r>\2", xml)
print("pageref cached:", n1)

# 2. drop the duplicated injected entry
dup = (
    '<w:p><w:pPr><w:pStyle w:val="TOC1"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9026"/></w:tabs>'
    '<w:spacing w:before="120" w:after="60"/></w:pPr><w:r><w:t>1. Executive Summary</w:t></w:r>'
    '<w:r><w:tab/></w:r><w:r><w:t>1</w:t></w:r></w:p>'
)
n2 = xml.count(dup)
xml = xml.replace(dup, "")
print("duplicate removed:", n2)

if n1 != 1 or n2 != 1:
    raise SystemExit("unexpected match counts; aborting without write")

data["word/document.xml"] = xml.encode("utf-8")
with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        zout.writestr(n, data[n])
shutil.move(TMP, DOCX)
print("OK", DOCX)
