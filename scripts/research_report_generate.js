// Research report generator - docx skill compliant
// Recipe R1 (Pure Paragraph Left) + DM-1 palette, 3-section page numbering, TOC field.
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableLayoutType, TableOfContents, VerticalAlign,
} = require("docx");
const fs = require("fs");
let sizeOfFn;
try {
  const m = require("image-size");
  sizeOfFn = m.imageSize || m.default || m;
} catch (e) { sizeOfFn = null; }

const { A } = require("./report_content_a.js");
const { B } = require("./report_content_b.js");
const BLOCKS = [...A, ...B];

// ---------------------------------------------------------------- palette (DM-1 Deep Cyan)
const P = {
  bg: "162235",
  titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078",
  accent: "37DCF2",
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
  h: "0F3B47",          // dark cyan-navy for body headings
  caption: "595959",
  body: "000000",
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

const FONT = { ascii: "Times New Roman", eastAsia: "SimSun" };
const HFONT = { ascii: "Times New Roman", eastAsia: "SimHei" };

// ---------------------------------------------------------------- cover helpers (design-system.md)
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."\uFF0C\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F", ..."\u7684\u4E0E\u548C\u53CA\u4E4B\u5728\u4E8E\u4E3A", ..."-_\u2014\u2013\u00B7/", ..." \t"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

// Latin adaptation: English glyphs are ~0.5x CJK width -> charWidth = pt * 10.5
function calcTitleLayoutEN(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 10.5;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

// ---------------------------------------------------------------- Recipe R1 cover
function buildCoverR1(config) {
  const C = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayoutEN(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length,
    fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 12 };
  const children = [];

  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: C.accent, font: { ascii: "Arial", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }

  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: C.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }

  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: C.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: C.metaColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: C.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: C.footerColor, font: { ascii: "Arial" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: C.bg }, borders: noBorders,
        verticalAlign: VerticalAlign.TOP,
        children,
      })],
    })],
  })];
}

// ---------------------------------------------------------------- body builders
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 400, after: 200, line: 380, lineRule: "atLeast" },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 32, color: P.h, font: HFONT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 280, after: 120, line: 340, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 28, color: P.h, font: HFONT })],
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 312 },
    children: [new TextRun({ text, size: 24, color: P.body, font: FONT })],
  });
}
function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    bullet: { level: 0 },
    spacing: { after: 100, line: 312 },
    children: [new TextRun({ text, size: 24, color: P.body, font: FONT })],
  });
}
function tableCaption(text) {
  return new Paragraph({
    keepNext: true,
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 21, color: P.h, font: FONT })],
  });
}
function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 220, line: 312 },
    children: [new TextRun({ text, italics: true, size: 20, color: P.caption, font: FONT })],
  });
}

function cellPara(text, opts) {
  const o = opts || {};
  return new Paragraph({
    alignment: o.align || AlignmentType.LEFT,
    spacing: { line: 276, after: 0 },
    children: [new TextRun({ text: String(text), bold: !!o.bold, size: 20, color: o.color || P.body, font: FONT })],
  });
}

function buildTable(spec) {
  const n = spec.headers.length;
  const widths = spec.widths && spec.widths.length === n ? spec.widths : Array(n).fill(Math.floor(100 / n));
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: spec.headers.map((htext, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: { top: 70, bottom: 70, left: 110, right: 110 },
      verticalAlign: VerticalAlign.CENTER,
      children: [cellPara(htext, { bold: true, color: P.table.headerText })],
    })),
  });
  const dataRows = spec.rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 1 ? P.table.surface : "FFFFFF" },
      margins: { top: 60, bottom: 60, left: 110, right: 110 },
      verticalAlign: VerticalAlign.CENTER,
      children: [cellPara(cell)],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  });
}

function pngSize(buf) {
  if (sizeOfFn) {
    try { const d = sizeOfFn(buf); if (d && d.width && d.height) return d; } catch (e) {}
  }
  // fallback: parse IHDR
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function buildFigure(spec) {
  const buf = fs.readFileSync(spec.path);
  const dim = pngSize(buf);
  const displayWidth = spec.width || 480;
  const displayHeight = Math.round(displayWidth * (dim.height / dim.width));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 160, after: 40 },
      children: [new ImageRun({ data: buf, transformation: { width: displayWidth, height: displayHeight }, type: "png" })],
    }),
    figCaption(spec.caption),
  ];
}

// ---------------------------------------------------------------- assemble body
const bodyChildren = [];
for (const blk of BLOCKS) {
  const kind = blk[0];
  if (kind === "h1") bodyChildren.push(h1(blk[1]));
  else if (kind === "h2") bodyChildren.push(h2(blk[1]));
  else if (kind === "p") bodyChildren.push(body(blk[1]));
  else if (kind === "bullets") blk[1].forEach((t) => bodyChildren.push(bullet(t)));
  else if (kind === "table") { bodyChildren.push(tableCaption(blk[1].caption)); bodyChildren.push(buildTable(blk[1])); bodyChildren.push(new Paragraph({ spacing: { after: 120 }, children: [] })); }
  else if (kind === "figure") buildFigure(blk[1]).forEach((el) => bodyChildren.push(el));
}

// ---------------------------------------------------------------- footers / headers
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240 },
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })],
    })],
  });
}
function docHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "C8DDE2", space: 4 } },
      children: [new TextRun({ text: "Deep-Dive Research and Analysis", size: 18, color: "808080", font: FONT })],
    })],
  });
}

// ---------------------------------------------------------------- document
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  creator: "Research and Analysis",
  title: "Deep-Dive Research and Analysis: 20 UI, Design and AI Sources",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: P.body },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: HFONT, size: 32, bold: true, color: P.h },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: HFONT, size: 28, bold: true, color: P.h },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
    },
  },
  sections: [
    { // Section 1: cover - margin 0, no footer, no pageNumbers
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "Deep-Dive Research and Analysis",
        subtitle: "20 UI, Design and AI Sources: Components, Galleries, Agents and Craft",
        englishLabel: "RESEARCH REPORT",
        metaLines: [
          "Scope: 20 websites and open-source repositories, fully scraped and analyzed",
          "Method: site scraping, repository cloning, registry and taxonomy extraction",
          "Status: research and analysis only; no development started",
        ],
        footerLeft: "Research and Analysis",
        footerRight: "October 2026",
        palette: P,
      }),
    },
    { // Section 2: front matter (TOC) - Roman numerals
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: pageNumFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360, line: 380, lineRule: "atLeast" },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: P.h, font: HFONT })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
            italics: true, size: 18, color: "888888", font: FONT,
          })],
        }),
      ],
    },
    { // Section 3: body - Arabic numerals restarting at 1
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: docHeader() },
      footers: { default: pageNumFooter() },
      children: bodyChildren,
    },
  ],
});

const OUT = "/home/z/my-project/download/Deep-Dive_Research_and_Analysis_UI_Design_AI_Sources.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("WROTE", OUT, buf.length, "bytes");
});
