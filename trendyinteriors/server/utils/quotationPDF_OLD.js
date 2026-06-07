// ─────────────────────────────────────────────────────────────────────────────
//  quotationPDF.js  —  Trendy Interiors
//  Dynamic PDF generation with template overlay using pdf-lib
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

// ── Dependencies ───────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const pdfLib = require("pdf-lib");
const PDFLibDocument = pdfLib.PDFDocument;
const rgb = pdfLib.rgb;
const PDFDocument = require("pdfkit");  // For fallback dynamic PDF generation

// PDFKit no longer needed - using pdf-lib for template-based generation
// Kept for fallback dynamic PDF generation

// ── Brand colours (exact match to reference) ──────────────────────────────────
const ORANGE   = "#E8722A";   // brand orange (logo, titles, values)
const DARK     = "#2C2C2C";   // near-black (headers, table dark rows)
const CREAM    = "#F7F2EA";   // alternating rows / badge background
const WHITE    = "#FFFFFF";
const GRAY     = "#777777";   // secondary / label text
const LGRAY    = "#AAAAAA";   // muted text on dark backgrounds
const GREEN    = "#1A7A1A";   // advance payment
const GREEN_BG = "#EBF5EB";
const BORDER   = "#DDDDDD";
const ORG_TIN  = "#FFF3E8";   // light orange tint (premium add-ons rows)

// ── Page geometry ──────────────────────────────────────────────────────────────
const PW = 595.28, PH = 841.89;
const ML = 38, MR = 38;
const UW = PW - ML - MR;   // 519.28

// ── Company constants ──────────────────────────────────────────────────────────
const CO = {
  name:  "TRENDY INTERIORS",
  brand: "Trendy Interios",
  addr:  "138, Muthugoundampalayam, Sathy-Erode Road, Opp TNK School, Kavindapadi, Erode \u2013 638 455",
  ph1:   "+91 99652 99777",
  ph2:   "+91 90803 98889",
  em1:   "trendyinterios@gmail.com",
  em2:   "info@trendyinterios.com",
};

// ── Add-on label map ──────────────────────────────────────────────────────────
const AL = {
  lighting: "Lighting Package",
  wallpaper: "Wallpaper / Panels",
  pooja:    "Pooja Unit",
  ceiling:  "False Ceiling",
  flooring: "Luxury Flooring",
  curtains: "Curtains & Blinds",
};

// ── Utilities ──────────────────────────────────────────────────────────────────
function fmtINR(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN");
}
function fmtDate(d) {
  const M = ["January","February","March","April","May","June",
             "July","August","September","October","November","December"];
  const dt = d || new Date();
  return `${dt.getDate()} ${M[dt.getMonth()]} ${dt.getFullYear()}`;
}
function mkRef(id) {
  return "QT-" + String(id || "DRAFT").slice(-8).toUpperCase();
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ""; }

// Drawing helpers
function fr(doc, x, y, w, h, c) {
  doc.save().fillColor(c).rect(x, y, w, h).fill().restore();
}
function sr(doc, x, y, w, h, c, lw) {
  doc.save().strokeColor(c).lineWidth(lw || 0.5).rect(x, y, w, h).stroke().restore();
}
function hl(doc, x, y, w, c, lw) {
  doc.save().strokeColor(c || BORDER).lineWidth(lw || 0.5)
     .moveTo(x, y).lineTo(x + w, y).stroke().restore();
}

// Draw the orange-square logo
function drawLogo(doc, x, y, sz) {
  sz = sz || 32;
  fr(doc, x, y, sz, sz, ORANGE);
  doc.font("Helvetica-Bold")
     .fontSize(Math.floor(sz * 0.5))
     .fillColor(WHITE)
     .text("T", x, y + Math.floor(sz * 0.16), { width: sz, align: "center" });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE 1
// ─────────────────────────────────────────────────────────────────────────────
function drawPage1(doc, d) {
  const { ref, now, planLabel, ci, rooms, qs, lineItems, extraAddons } = d;

  // ── Header: logo (left) + QUOTATION (right) ────────────────────────────────
  const LSZ = 34;
  drawLogo(doc, ML, 20, LSZ);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK)
     .text(CO.brand, ML + LSZ + 6, 30);

  doc.font("Helvetica-Bold").fontSize(38).fillColor(ORANGE)
     .text("QUOTATION", ML, 12, { width: UW, align: "right" });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(ORANGE)
     .text(`# ${ref}`, ML, 55, { width: UW, align: "right" });
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
     .text(`Date Issued: ${fmtDate(now)}`, ML, 68, { width: UW, align: "right" });
  doc.font("Helvetica-Oblique").fontSize(8).fillColor(GRAY)
     .text("Valid for 30 days from date of issue", ML, 80, { width: UW, align: "right" });

  // ── Address bar ───────────────────────────────────────────────────────────
  hl(doc, ML, 98, UW, BORDER, 0.5);
  doc.font("Helvetica").fontSize(7.5).fillColor(DARK)
     .text(`${CO.addr}  |  ${CO.ph1}  |  ${CO.ph2}  |  ${CO.em1}  |  ${CO.em2}`,
           ML, 104, { width: UW, align: "center" });
  hl(doc, ML, 118, UW, BORDER, 0.5);

  // ── Package badge (cream strip) ───────────────────────────────────────────
  fr(doc, ML, 123, UW, 24, CREAM);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(ORANGE)
     .text(`\u2605  ${planLabel} Package`, ML + 12, 131);
  doc.font("Helvetica").fontSize(9).fillColor(GRAY)
     .text("Selected Design Package", ML, 133, { width: UW - 12, align: "right" });
  hl(doc, ML, 147, UW, BORDER, 0.5);

  // ── Two-column: CLIENT INFORMATION | PROJECT OVERVIEW ─────────────────────
  const IY   = 153;   // info section top
  const ROWS = 4;
  const RH   = 16;    // row height
  const COL  = (UW - 10) / 2;
  const RX2  = ML + COL + 10;
  const BH   = 17 + ROWS * RH;  // box total height

  // Box borders (drawn first)
  sr(doc, ML,  IY, COL, BH, BORDER, 0.5);
  sr(doc, RX2, IY, COL, BH, BORDER, 0.5);

  // Dark header strips
  fr(doc, ML,  IY, COL, 17, DARK);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
     .text("CLIENT INFORMATION", ML + 7, IY + 4);

  fr(doc, RX2, IY, COL, 17, DARK);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
     .text("PROJECT OVERVIEW", RX2 + 7, IY + 4);

  // Client rows
  const addonCnt = Array.isArray(extraAddons) ? extraAddons.length : 0;
  [
    ["Client Name",  ci.name     || "\u2014"],
    ["Email",        ci.email    || "\u2014"],
    ["Phone",        ci.phone    || "\u2014"],
    ["Project Site", ci.location || "\u2014"],
  ].forEach(([lbl, val], i) => {
    const ry = IY + 17 + i * RH;
    if (i % 2 !== 0) fr(doc, ML, ry, COL, RH, CREAM);
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
       .text(lbl + ":", ML + 7, ry + 4, { width: 62 });
    doc.font("Helvetica").fontSize(7.5).fillColor(DARK)
       .text(val, ML + 71, ry + 4, { width: COL - 78 });
    if (i < ROWS - 1) hl(doc, ML, ry + RH, COL, BORDER, 0.3);
  });

  // Project rows (values in orange)
  [
    ["Selected Rooms",  Object.keys(rooms || {}).join(", ") || "\u2014"],
    ["Total Area",      (qs.totalAreaSqFt || 0) + " sq.ft"],
    ["Design Package",  planLabel],
    ["Add-on Services", addonCnt > 0 ? addonCnt + " selected" : "None"],
  ].forEach(([lbl, val], i) => {
    const ry = IY + 17 + i * RH;
    if (i % 2 !== 0) fr(doc, RX2, ry, COL, RH, CREAM);
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
       .text(lbl + ":", RX2 + 7, ry + 4, { width: 76 });
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(ORANGE)
       .text(val, RX2 + 85, ry + 4, { width: COL - 92 });
    if (i < ROWS - 1) hl(doc, RX2, ry + RH, COL, BORDER, 0.3);
  });

  // ── INTERIOR COST BREAKDOWN ───────────────────────────────────────────────
  const TY = IY + BH + 16;  // section title Y

  doc.font("Helvetica-Bold").fontSize(11).fillColor(ORANGE)
     .text("INTERIOR COST BREAKDOWN", ML, TY);
  hl(doc, ML, TY + 14, UW, ORANGE, 1);

  let ty = TY + 18;

  // Table column definitions
  const COLS = [
    { lbl: "Room / Item",     x: ML,       w: 152, a: "left"   },
    { lbl: "Area\n(sq.ft)",  x: ML + 152, w: 52,  a: "center" },
    { lbl: "Rate / sq.ft",   x: ML + 204, w: 72,  a: "center" },
    { lbl: "Design & Extras",x: ML + 276, w: 110, a: "left"   },
    { lbl: "Amount",          x: ML + 386, w: UW - 386, a: "right" },
  ];

  // Column header row (dark background)
  fr(doc, ML, ty, UW, 22, DARK);
  COLS.forEach((c) => {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(WHITE)
       .text(c.lbl, c.x + 4, ty + 4, { width: c.w - 8, align: c.a });
  });
  ty += 22;

  const roomItems = lineItems.filter((it) => it.roomId !== "extra-addons");
  const extraItem = lineItems.find((it) => it.roomId === "extra-addons");

  // Room rows: bold name subheader row + data row
  roomItems.forEach((item) => {
    // Name subheader row (cream, bold)
    fr(doc, ML, ty, UW, 14, CREAM);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK)
       .text(item.label || item.roomName, COLS[0].x + 6, ty + 3);
    hl(doc, ML, ty + 14, UW, BORDER, 0.3);
    ty += 14;

    // Data row (white)
    const layout = item.layout || "Standard";
    const addons = Array.isArray(item.addons) && item.addons.length > 0
      ? item.addons.join(", ") : "None";

    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(layout,                     COLS[0].x + 6, ty + 4, { width: COLS[0].w - 10 });
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(String(item.areaSqFt || 0), COLS[1].x + 4, ty + 4, { width: COLS[1].w - 8, align: "center" });
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(fmtINR(item.ratePerSqFt || 0), COLS[2].x + 4, ty + 4, { width: COLS[2].w - 8, align: "center" });
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(addons,                     COLS[3].x + 4, ty + 4, { width: COLS[3].w - 8 });
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK)
       .text(fmtINR(item.estimatedCost || 0), COLS[4].x + 4, ty + 4, { width: COLS[4].w - 8, align: "right" });

    hl(doc, ML, ty + 18, UW, BORDER, 0.3);
    ty += 18;
  });

  // Premium Add-ons rows (light orange tint)
  if (extraItem) {
    // Name subheader row
    fr(doc, ML, ty, UW, 14, ORG_TIN);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(ORANGE)
       .text("Premium Add-ons", COLS[0].x + 6, ty + 3);
    hl(doc, ML, ty + 14, UW, BORDER, 0.3);
    ty += 14;

    // Data row
    const addonNames = Array.isArray(extraItem.addons)
      ? extraItem.addons.map((a) => AL[a] || cap(a)).join(", ") : "\u2014";
    fr(doc, ML, ty, UW, 18, ORG_TIN);
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text("Premium Add-on Services", COLS[0].x + 6, ty + 4, { width: COLS[0].w - 10 });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
       .text("\u2014", COLS[1].x + 4, ty + 4, { width: COLS[1].w - 8, align: "center" });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
       .text("\u2014", COLS[2].x + 4, ty + 4, { width: COLS[2].w - 8, align: "center" });
    doc.font("Helvetica").fontSize(8.5).fillColor(DARK)
       .text(addonNames, COLS[3].x + 4, ty + 4, { width: COLS[3].w - 8 });
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(ORANGE)
       .text(fmtINR(extraItem.estimatedCost || 0), COLS[4].x + 4, ty + 4, { width: COLS[4].w - 8, align: "right" });
    hl(doc, ML, ty + 18, UW, BORDER, 0.5);
    ty += 18;
  }

  // Table outer border
  sr(doc, ML, TY + 18, UW, ty - (TY + 18), BORDER, 0.5);

  // ── Page 1 footer ─────────────────────────────────────────────────────────
  const F1Y = PH - 20;
  hl(doc, ML, F1Y - 3, UW, BORDER, 0.5);
  doc.font("Helvetica").fontSize(6.5).fillColor(LGRAY)
     .text(
       `TRENDY INTERIORS  \u00B7  ${CO.em1}  \u00B7  ${CO.ph1}  \u00B7  ${CO.em2}  \u00B7  Confidential 1 of 2  \u00B7  ${fmtDate(now)}`,
       ML, F1Y + 1, { width: UW, align: "center" }
     );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE 2
// ─────────────────────────────────────────────────────────────────────────────
function drawPage2(doc, d) {
  const { ref, now, lineItems, baseAmount, gstAmount, grandTotal, advance50 } = d;
  let y = 0;

  // ── Header: logo + brand + company name + ref ──────────────────────────────
  const LSZ2 = 30;
  drawLogo(doc, ML, 18, LSZ2);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK)
     .text(CO.brand, ML + LSZ2 + 6, 24);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK)
     .text(CO.name, ML + LSZ2 + 6 + 80, 23);
  doc.font("Helvetica").fontSize(9).fillColor(GRAY)
     .text(`Ref: ${ref}`, ML, 25, { width: UW, align: "right" });
  hl(doc, ML, 54, UW, BORDER, 0.5);
  y = 62;

  // ── SELECTED ROOMS — DESIGN SHOWCASE ─────────────────────────────────────
  const roomItems = lineItems.filter((it) => it.roomId !== "extra-addons");
  const extraItem = lineItems.find((it) => it.roomId === "extra-addons");

  doc.font("Helvetica-Bold").fontSize(11).fillColor(ORANGE)
     .text("SELECTED ROOMS \u2014 DESIGN SHOWCASE", ML, y);
  hl(doc, ML, y + 15, UW, ORANGE, 1);
  y += 22;

  // 3-column dark room cards
  const nCards = roomItems.length || 1;
  const CW = Math.floor((UW - (nCards - 1) * 8) / nCards);
  const CARD_H = 65;

  roomItems.forEach((item, i) => {
    const cx = ML + i * (CW + 8);
    fr(doc, cx, y, CW, CARD_H, DARK);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(WHITE)
       .text(item.label || item.roomName, cx + 8, y + 8, { width: CW - 16 });
    doc.font("Helvetica").fontSize(8).fillColor(LGRAY)
       .text(`${item.areaSqFt} sq.ft  \u00B7  ${item.layout || "Standard"}`, cx + 8, y + 24, { width: CW - 16 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(WHITE)
       .text(fmtINR(item.estimatedCost), cx + 8, y + 42, { width: CW - 16 });
  });
  y += CARD_H + 18;

  // ── FINANCIAL SUMMARY ─────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(11).fillColor(ORANGE)
     .text("FINANCIAL SUMMARY", ML, y);
  hl(doc, ML, y + 15, UW, ORANGE, 1);
  y += 22;

  const sumStartY = y;

  // Per-addon label rows (cream)
  if (extraItem && Array.isArray(extraItem.addons) && extraItem.addons.length > 0) {
    extraItem.addons.forEach((aid, i) => {
      const lbl = AL[aid] || cap(aid);
      fr(doc, ML, y, UW, 16, CREAM);
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
         .text(`Add-on: ${lbl}`, ML + 8, y + 4, { width: UW * 0.5 });
      // Add-ons total on last row
      if (i === extraItem.addons.length - 1) {
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK)
           .text(`Add-ons Total: ${fmtINR(extraItem.estimatedCost)}`, ML, y + 4, { width: UW - 8, align: "right" });
      }
      hl(doc, ML, y + 16, UW, BORDER, 0.3);
      y += 16;
    });
  }

  // Financial rows
  [
    { l: "Base Cost (excl. GST)",    v: fmtINR(baseAmount), bg: WHITE,    tc: DARK,  vc: DARK,  b: false, h: 18 },
    { l: "GST @ 18%",               v: fmtINR(gstAmount),  bg: CREAM,    tc: DARK,  vc: DARK,  b: false, h: 18 },
    { l: "GRAND TOTAL (incl. GST)", v: fmtINR(grandTotal), bg: DARK,     tc: WHITE, vc: WHITE, b: true,  h: 24 },
    { l: "50% Advance to Confirm",  v: fmtINR(advance50),  bg: GREEN_BG, tc: GREEN, vc: GREEN, b: false, h: 20 },
  ].forEach((row) => {
    fr(doc, ML, y, UW, row.h, row.bg);
    doc.font(row.b ? "Helvetica-Bold" : "Helvetica").fontSize(9)
       .fillColor(row.tc)
       .text(row.l, ML + 10, y + (row.h - 9) / 2 + 1);
    doc.font("Helvetica-Bold").fontSize(10)
       .fillColor(row.vc)
       .text(row.v, ML, y + (row.h - 10) / 2 + 1, { width: UW - 10, align: "right" });
    hl(doc, ML, y + row.h, UW, BORDER, 0.3);
    y += row.h;
  });

  // Box border around entire summary block
  sr(doc, ML, sumStartY, UW, y - sumStartY, BORDER, 0.5);

  y += 4;
  doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(GRAY)
     .text("Balance payable before final project handover", ML, y, { width: UW, align: "right" });
  y += 18;

  // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(11).fillColor(ORANGE)
     .text("TERMS & CONDITIONS", ML, y);
  hl(doc, ML, y + 15, UW, ORANGE, 1);
  y += 22;

  const TERMS = [
    ["Approximate Estimate",         "Estimated price only; subject to revision after site visit."],
    ["Final Price After Site Visit",  "Confirmed only after on-site consultation with our design team."],
    ["Material Price Variations",    "Prices may change based on market conditions and supplier availability."],
    ["Customisation & Extra Work",   "Additional designs or special requests not listed here will affect the final cost."],
    ["Validity \u2014 30 Days",      "This quotation is valid for 30 days from the date of issue."],
    ["Advance Payment \u2014 50%",   "50% of grand total must be paid before work begins."],
    ["Final Balance Before Handover","Remaining balance due in full prior to project handover."],
  ];

  TERMS.forEach(([title, desc], i) => {
    const TH = 16;
    fr(doc, ML, y, UW, TH, i % 2 === 0 ? WHITE : CREAM);
    // Coloured number box (odd=orange, even=dark)
    fr(doc, ML + 3, y + 2, 12, 12, i % 2 === 0 ? ORANGE : DARK);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(WHITE)
       .text(String(i + 1), ML + 3, y + 4, { width: 12, align: "center" });
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK)
       .text(title, ML + 19, y + 4, { width: 138 });
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
       .text(desc, ML + 160, y + 4, { width: UW - 166 });
    hl(doc, ML, y + TH, UW, BORDER, 0.3);
    y += TH;
  });

  y += 12;

  // ── APPROVAL & SIGN-OFF ───────────────────────────────────────────────────
  fr(doc, ML, y, UW, 16, DARK);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
     .text("APPROVAL & SIGN-OFF", ML + 8, y + 4);
  y += 16;

  const HALF   = (UW - 8) / 2;
  const RX3    = ML + HALF + 8;
  const PNL_H  = 108;  // panel height

  // Left panel — dark background
  fr(doc, ML, y, HALF, PNL_H, DARK);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(ORANGE)
     .text("PREPARED BY", ML + 10, y + 8);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
     .text("Trendy Interiors", ML + 10, y + 22);
  doc.font("Helvetica").fontSize(7.5).fillColor(LGRAY)
     .text("Interior Design & Estimation Team", ML + 10, y + 36)
     .text(`Date: ${fmtDate(now)}`, ML + 10, y + 50);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(ORANGE)
     .text("Digitally Prepared & Verified", ML + 10, y + 65);

  // Right panel — white background with border
  fr(doc, RX3, y, HALF, PNL_H, WHITE);
  sr(doc, RX3, y, HALF, PNL_H, BORDER, 0.5);

  // "Thank You" large orange text
  doc.font("Helvetica-Bold").fontSize(26).fillColor(ORANGE)
     .text("Thank You", RX3 + 10, y + 7, { width: HALF - 20 });

  // Description paragraph
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
     .text(
       "Thank you for considering Trendy Interiors. We look forward to transforming your space into a beautiful and functional environment.",
       RX3 + 10, y + 42, { width: HALF - 20 }
     );

  // CLIENT ACCEPTANCE bar (inside right panel at bottom)
  fr(doc, RX3, y + PNL_H - 30, HALF, 13, DARK);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(WHITE)
     .text("CLIENT ACCEPTANCE", RX3 + 8, y + PNL_H - 27);

  // Signature line + labels
  hl(doc, RX3 + 8, y + PNL_H - 11, 125, DARK, 0.5);
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
     .text("Authorised Signature", RX3 + 8, y + PNL_H - 8)
     .text("Date: __________", RX3 + HALF - 83, y + PNL_H - 8);

  // ── Page 2 footer ─────────────────────────────────────────────────────────
  const F2Y = PH - 20;
  hl(doc, ML, F2Y - 3, UW, BORDER, 0.5);
  doc.font("Helvetica").fontSize(6.5).fillColor(LGRAY)
     .text(
       `TRENDY INTERIORS  \u00B7  ${CO.em1}  \u00B7  ${CO.ph1}  \u00B7  ${CO.em2}  \u00B7  Confidential 2 of 2  \u00B7  ${fmtDate(now)}`,
       ML, F2Y + 1, { width: UW, align: "center" }
     );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export - Dynamic PDF with Template Base
// ─────────────────────────────────────────────────────────────────────────────

const generateQuotationPDF = async (estimator, res, callback) => {
  try {
    console.log("📄 Starting PDF generation for estimator:", estimator._id);
    
    if (!estimator) {
      throw new Error("Estimator data is required");
    }

    // For now, use the reliable dynamic generation instead of template overlay
    // This ensures consistent, working PDFs
    console.log("📋 Using dynamic PDF generation (reliable method)");
    return generateDynamicQuotationPDF(estimator, res, callback);
    
  } catch (err) {
    console.error("❌ Error generating PDF:", err.message);
    console.error("Stack:", err.stack);
    if (callback) callback(err);
    else throw err;
  }
};

// Function to add dynamic content to the PDF with proper positioning
function addDynamicContent(page, data) {
  const {
    ref,
    now,
    ci,
    rooms,
    lineItems,
    extraAddons,
    baseAmount,
    gstAmount,
    grandTotal,
    advance50,
    height,
  } = data;

  const fontSize = 9;
  const smallFontSize = 8;
  const tinyFontSize = 7;

  try {
    const ORANGE_RGB = rgb(0.91, 0.45, 0.16);   // #E8722A
    const DARK_RGB = rgb(0.17, 0.17, 0.17);     // #2C2C2C
    const GRAY_RGB = rgb(0.46, 0.46, 0.46);     // #777777

    console.log("🎨 Preparing to add content - RGB colors defined");

    // ── HEADER SECTION (Top Right) ───────────────────────────────────────────
    // Reference number with formatting
    const refNumber = `Reference: ${ref}`;
    console.log("✏️ Drawing reference:", refNumber);
    page.drawText(refNumber, {
      x: 340,
      y: height - 55,
      size: fontSize,
      color: ORANGE_RGB,
      maxWidth: 240,
    });

    // Date with proper formatting
    const dateFormatted = fmtDate(now);
    page.drawText(`Date Issued: ${dateFormatted}`, {
      x: 340,
      y: height - 70,
      size: tinyFontSize,
      color: DARK_RGB,
    });

    // Validity notice
    page.drawText("Valid for 30 days from date of issue", {
      x: 340,
      y: height - 82,
      size: tinyFontSize,
      color: GRAY_RGB,
    });

    // ── CLIENT INFORMATION (Left side, after address bar) ─────────────────────
    const clientStartY = height - 150;

    // Helper function to safely render client info
    const renderClientField = (label, value, yOffset) => {
      const safeValue = String(value || "—").trim();
      page.drawText(label, {
        x: 40,
        y: clientStartY - yOffset,
        size: smallFontSize,
        color: GRAY_RGB,
      });
      page.drawText(safeValue, {
        x: 140,
        y: clientStartY - yOffset,
        size: smallFontSize,
        color: DARK_RGB,
        maxWidth: 180,
      });
    };

    // Render all client fields
    renderClientField("Client Name:", ci.name, 0);
    renderClientField("Email:", ci.email, 22);
    renderClientField("Phone:", ci.phone, 44);
    renderClientField("Project Site:", ci.location, 66);

    // ── PROJECT OVERVIEW (Right side) ────────────────────────────────────────
    const projectStartY = clientStartY;

    // Helper function for project fields
    const renderProjectField = (label, value, yOffset) => {
      const safeValue = String(value || "—").trim();
      page.drawText(label, {
        x: 340,
        y: projectStartY - yOffset,
        size: smallFontSize,
        color: GRAY_RGB,
      });
      page.drawText(safeValue, {
        x: 480,
        y: projectStartY - yOffset,
        size: smallFontSize,
        color: ORANGE_RGB,
        maxWidth: 120,
      });
    };

    // Selected Rooms with safe handling
    const roomsList = rooms && Object.keys(rooms).length > 0 
      ? Object.keys(rooms)
          .map((r) => rooms[r] ? `${rooms[r]}x ${r}` : null)
          .filter(Boolean)
          .join(", ")
      : "—";
    renderProjectField("Selected Rooms:", roomsList, 0);

    // Total Area calculation
    const totalArea = Array.isArray(lineItems)
      ? lineItems.reduce((sum, item) => sum + (Number(item.areaSqFt) || 0), 0)
      : 0;
    renderProjectField("Total Area:", `${totalArea} sq.ft`, 22);

    // Design Package
    renderProjectField("Design Package:", "Premium", 44);

    // Add-on Services count
    const addonCount = Array.isArray(extraAddons) ? extraAddons.length : 0;
    const addonText = addonCount > 0 ? `${addonCount} selected` : "None";
    renderProjectField("Add-on Services:", addonText, 66);

    // ── COST BREAKDOWN (Bottom section, right side) ──────────────────────────
    const costStartY = 130;

    // Helper function for financial fields
    const renderFinancialField = (label, value, yOffset, isEmphasis = false) => {
      const size = isEmphasis ? fontSize + 1 : fontSize;
      const color = isEmphasis ? ORANGE_RGB : DARK_RGB;
      
      page.drawText(label, {
        x: 340,
        y: costStartY - yOffset,
        size: size,
        color: color,
      });
      page.drawText(String(value), {
        x: 480,
        y: costStartY - yOffset,
        size: size,
        color: color,
      });
    };

    // Render financial summary
    renderFinancialField("Base Amount:", fmtINR(baseAmount), 0);
    renderFinancialField("GST (18%):", fmtINR(gstAmount), 22);
    renderFinancialField("Grand Total:", fmtINR(grandTotal), 48, true);
    renderFinancialField(`Advance (50%):`, fmtINR(advance50), 70);

    // ── LINE ITEMS SUMMARY (if space available) ─────────────────────────────
    const itemsStartY = height - 320;
    let currentY = itemsStartY;

    // Display top 3 line items for preview
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      lineItems.slice(0, 3).forEach((item, idx) => {
        if (currentY > 200) {
          const roomLabel = String(item.roomName || `Room ${idx + 1}`).trim();
          const costLabel = fmtINR(item.estimatedCost || 0);
          const itemText = `• ${roomLabel}: ${costLabel}`;
          
          page.drawText(itemText, {
            x: 50,
            y: currentY,
            size: tinyFontSize,
            color: DARK_RGB,
            maxWidth: 280,
          });
          currentY -= 16;
        }
      });
    }

  } catch (err) {
    console.error("Error adding dynamic content to template:", err);
    throw err;  // Re-throw to be caught by caller
  }
}

// Fallback function for dynamic PDF generation (original implementation)
const generateDynamicQuotationPDF = (estimator, res, callback) => {
  try {
    const chunks = [];
    
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
    });

    // Collect PDF data in buffer instead of piping directly
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Set headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="Trendy_Interiors_Quotation_${estimator._id || "draft"}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        // Send the PDF
        res.send(pdfBuffer);
        console.log("✓ PDF sent successfully - Size:", pdfBuffer.length, "bytes");
        
        if (callback) callback(null);
      } catch (err) {
        console.error("❌ Error sending PDF:", err.message);
        if (callback) callback(err);
      }
    });

    doc.on("error", (err) => {
      console.error("❌ PDF generation error:", err.message);
      if (callback) callback(err);
    });

    const now         = new Date();
    const ref         = mkRef(estimator._id);
    const qs          = estimator.quoteSummary   || {};
    const ci          = estimator.customerInfo   || {};
    const rooms       = estimator.rooms          || {};
    const plan        = estimator.budgetPlan     || "premium";
    const planLabel   = plan[0].toUpperCase()    + plan.slice(1);
    const lineItems   = Array.isArray(qs.lineItems)         ? qs.lineItems         : [];
    const extraAddons = Array.isArray(estimator.extraAddons) ? estimator.extraAddons : [];

    const baseAmount = Number(qs.estimatedAmount || 0);
    const gstAmount  = Math.round(baseAmount * 0.18);
    const grandTotal = baseAmount + gstAmount;
    const advance50  = Math.round(grandTotal * 0.5);

    const shared = { ref, now, planLabel, ci, rooms, qs, lineItems, extraAddons };

    console.log("📄 Drawing Page 1...");
    drawPage1(doc, shared);
    
    console.log("📄 Adding Page 2...");
    doc.addPage();
    drawPage2(doc, { ...shared, baseAmount, gstAmount, grandTotal, advance50 });

    console.log("📄 Finalizing PDF...");
    doc.flushPages();
    doc.end();

  } catch (err) {
    console.error("❌ Error in dynamic PDF generation:", err.message);
    console.error("Stack:", err.stack);
    if (callback) callback(err);
    else throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Export Module
// ─────────────────────────────────────────────────────────────────────────────
module.exports = { generateQuotationPDF };

// Log initialization
console.log("✓ PDF Generation Module Loaded - Ready for dynamic quotation generation");
