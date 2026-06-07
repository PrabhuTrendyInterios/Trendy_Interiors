// ─────────────────────────────────────────────────────────────────────────────
//  quotationPDF.js  —  Trendy Interiors
//  Professional Premium Interior Design Quotation PDF (Charcoal & Gold Theme)
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const PDFDocument = require("pdfkit");

// ─ Brand Colors ─────────────────────────────────────────────────────────────
const C = {
  gold:      "#D4AF37", // Luxury Gold
  charcoal:  "#1F1F1F", // Charcoal Black
  text:      "#333333", // Standard Text
  white:     "#FFFFFF",
  gray:      "#666666",
  lgray:     "#CCCCCC",
  bgLight:   "#FAFAFA", // Very subtle off-white for table zebra stripes
  border:    "#E0E0E0",
};

// ─ Page Geometry ────────────────────────────────────────────────────────────
const PW  = 595.28;
const PH  = 841.89;
const ML  = 40;
const MR  = 40;
const UW  = PW - ML - MR;
const MB  = 55;

// ─ Company Constants ────────────────────────────────────────────────────────
const CO = {
  name:  "TRENDY INTERIORS",
  brand: "Trendy Interiors",
  addr:  "138, Muthugoundampalayam, Kavindapadi, Erode",
  ph1:   "+91 99652 99777",
  ph2:   "+91 90803 98889",
  em1:   "trendyinteriors@gmail.com",
  web:   "www.trendyinteriors.com",
};

// ─ Package Data ─────────────────────────────────────────────────────────────
const PACKAGES = {
  starter: {
    name: "Basic", cost: 25000,
    benefits: ["Basic Finish", "Standard Hardware", "Basic Storage", "Professional Installation", "1-Year Warranty"],
  },
  budgetFriendly: {
    name: "Standard", cost: 50000,
    benefits: ["Standard Finish", "Quality Hardware", "Standard Storage", "Expert Installation", "3-Year Warranty", "Free Consultation"],
  },
  premium: {
    name: "Premium", cost: 75000,
    benefits: [
      "Premium Finish: High-quality, durable materials that provide a luxurious and elegant look to your interiors.",
      "Soft Close Hardware: Smooth, whisper-quiet hinges and drawer slides that prevent slamming and extend the life of your cabinets.",
      "Modular Storage Solutions: Customizable and adaptable storage units designed to maximize space and organization in any room.",
      "Professional Installation: Expert assembly and fitting by experienced technicians, ensuring a flawless and secure setup.",
      "Premium Support: Dedicated and priority customer service ready to assist you with any queries or issues promptly.",
      "Warranty Coverage: Comprehensive protection for your purchase, giving you peace of mind against manufacturing defects."
    ],
  },
  signature: {
    name: "Luxury", cost: 120000,
    benefits: ["Luxury Finish", "Imported Hardware", "Custom Storage", "White-Glove Installation", "10-Year Warranty", "Dedicated Support", "Premium Accessories"],
  },
};

// ─ Extra Add-ons ────────────────────────────────────────────────────────────
const ADDON_LABELS = {
  lighting: "Smart Lighting", wallpaper: "Wallpaper", pooja: "Pooja Unit",
  ceiling: "False Ceiling", flooring: "Luxury Flooring", curtains: "Curtains & Blinds",
};
const ADDON_COSTS = {
  lighting: 15000, wallpaper: 12000, pooja: 18000,
  ceiling: 25000, flooring: 35000, curtains: 10000,
};

// ─ Material labels by plan tier ─────────────────────────────────────────────
const PLAN_MATERIAL = {
  starter: "Commercial Ply", budgetFriendly: "MR Grade Ply",
  premium: "BWR Plywood", signature: "Marine Plywood",
};

// ─ Utility Functions ────────────────────────────────────────────────────────
const mkRef = (id) => `QT-${String(id).slice(-8).toUpperCase()}`;
const fmtDate = (d) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
};
const fmtINR = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const cap = (str) => {
  return String(str)
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// ─ Drawing Helpers ──────────────────────────────────────────────────────────
function fr(doc, x, y, w, h, c) { doc.save().fillColor(c).rect(x, y, w, h).fill().restore(); }
function sr(doc, x, y, w, h, c, lw) { doc.save().strokeColor(c).lineWidth(lw || 0.5).rect(x, y, w, h).stroke().restore(); }
function hl(doc, x, y, w, c, lw) { doc.save().strokeColor(c || C.border).lineWidth(lw || 0.5).moveTo(x, y).lineTo(x + w, y).stroke().restore(); }

/** Simple Gold/Charcoal Square Logo */
function drawLogo(doc, x, y, sz) {
  sz = sz || 36;
  fr(doc, x, y, sz, sz, C.charcoal);
  doc.font("Helvetica-Bold").fontSize(Math.floor(sz * 0.55)).fillColor(C.gold)
    .text("T", x, y + Math.floor(sz * 0.16), { width: sz, align: "center" });
}

// ─ Page Header (on every page) ──────────────────────────────────────────────
function drawPageHeader(doc, ref) {
  const lsz = 26;
  drawLogo(doc, ML, 16, lsz);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.charcoal)
    .text(CO.brand, ML + lsz + 10, 22);
  doc.font("Helvetica").fontSize(8).fillColor(C.gray)
    .text(`Ref: ${ref}`, ML, 24, { width: UW, align: "right" });
  hl(doc, ML, 48, UW, C.gold, 1.5);
}

// ─ Page Footer (on every page) ──────────────────────────────────────────────
function drawPageFooter(doc, pageNum, totalPages) {
  const fy = PH - 32;
  hl(doc, ML, fy - 6, UW, C.border, 0.5);
  doc.font("Helvetica").fontSize(7).fillColor(C.gray)
    .text(`${CO.name}  |  ${CO.ph1}  |  ${CO.em1}`, ML, fy, { width: UW * 0.7 });
  doc.font("Helvetica").fontSize(7).fillColor(C.gray)
    .text(`Page ${pageNum} of ${totalPages}`, ML, fy, { width: UW, align: "right" });
}

/** Start a new content page */
function newPage(doc, ref) {
  doc.addPage();
  drawPageHeader(doc, ref);
  return 60;
}

/** Premium Section title */
function title(doc, txt, y) {
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.charcoal).text(txt.toUpperCase(), ML, y, { characterSpacing: 1 });
  hl(doc, ML, doc.y + 4, UW, C.gold, 1.5);
  return doc.y + 12;
}

/** Clean premium table */
function drawTable(doc, y, cols, rows, opts) {
  const hdrH = opts?.headerHeight || 24;
  const rowH = opts?.rowHeight || 26;
  const fontSize = opts?.fontSize || 9;
  const hdrFontSize = opts?.headerFontSize || 8.5;
  let totalW = cols.reduce((s, c) => s + c.w, 0);

  // Header
  fr(doc, ML, y, totalW, hdrH, C.charcoal);
  let cx = ML;
  cols.forEach((col) => {
    doc.font("Helvetica-Bold").fontSize(hdrFontSize).fillColor(C.white)
      .text(col.label, cx + 8, y + (hdrH - hdrFontSize) / 2, { width: col.w - 16, align: col.align || "left" });
    cx += col.w;
  });
  y += hdrH;

  // Rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : C.bgLight;
    fr(doc, ML, y, totalW, rowH, bg);

    cx = ML;
    row.forEach((cell, ci) => {
      const col = cols[ci];
      const font = col.bold ? "Helvetica-Bold" : "Helvetica";
      const color = col.highlight ? C.gold : C.text;
      
      doc.font(font).fontSize(fontSize).fillColor(color);
      
      // Calculate vertical centering roughly
      const textH = doc.heightOfString(String(cell || ""), { width: col.w - 16, align: col.align || "left" });
      const ty = y + Math.max(0, (rowH - textH) / 2);
      
      doc.text(String(cell || ""), cx + 8, ty, { width: col.w - 16, align: col.align || "left" });
      cx += col.w;
    });
    hl(doc, ML, y + rowH, totalW, C.border, 0.5);
    y += rowH;
  });

  return y;
}

/** Charcoal/Gold total bar */
function totalBar(doc, y, label, amount, w) {
  w = w || UW;
  const h = 30;
  fr(doc, ML, y, w, h, C.charcoal);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.gold)
    .text(label.toUpperCase(), ML + 12, y + 9);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.gold)
    .text(amount, ML, y + 8, { width: w - 12, align: "right" });
  return y + h;
}

/** Check space */
function ensureSpace(doc, y, needed, ref) {
  if (y + needed > PH - MB - 10) {
    return newPage(doc, ref);
  }
  return y;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── PAGE 1: HEADER, CUSTOMER DETAILS, PROJECT OVERVIEW, PACKAGE ─────────────
function drawPage1(doc, d) {
  const { ref, now, ci, budgetPlan, selectedRooms, extraAddons, grandTotal, qs } = d;
  const pkg = PACKAGES[budgetPlan] || PACKAGES.premium;
  let y = 0;

  // ── Premium Header Box ────────────────────────────────────────────────
  sr(doc, ML, 20, UW, 110, C.gold, 1);

  // Logo + Title
  const lsz = 40;
  drawLogo(doc, ML + 15, 30, lsz);
  
  doc.font("Helvetica-Bold").fontSize(20).fillColor(C.charcoal)
    .text("INTERIOR QUOTATION", ML, 35, { width: UW - 15, align: "right", characterSpacing: 1 });

  hl(doc, ML + 15, 76, UW - 30, C.border, 0.5);

  // Quotation No & Date (right aligned)
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Quotation No :", ML, 88, { width: UW - 90, align: "right" });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.text).text(ref, ML, 88, { width: UW - 15, align: "right" });
  
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Date :", ML, 103, { width: UW - 90, align: "right" });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.text).text(fmtDate(now), ML, 103, { width: UW - 15, align: "right" });

  // Company info (left aligned)
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.charcoal).text(CO.brand, ML + 15, 84);
  doc.font("Helvetica").fontSize(8).fillColor(C.gray)
    .text(CO.addr, ML + 15, 98)
    .text(`${CO.ph1} | ${CO.ph2}`, ML + 15, 110)
    .text(`${CO.em1} | ${CO.web}`, ML + 15, 120);

  y = 155;

  // ── CUSTOMER DETAILS ──────────────────────────────────────────────────
  y = title(doc, "CUSTOMER DETAILS", y);

  const customerCols = [
    { label: "Field", w: UW * 0.35, bold: true },
    { label: "Value", w: UW * 0.65 },
  ];
  const customerRows = [
    ["Customer Name", ci.name || "—"],
    ["Phone Number", ci.phone || "—"],
    ["Email Address", ci.email || "—"],
    ["Project Address", ci.location || "—"],
  ];
  y = drawTable(doc, y, customerCols, customerRows, { headerHeight: 0 }); // No table header visually requested

  // ── PROJECT OVERVIEW ──────────────────────────────────────────────────
  // Display immediately below, no huge whitespace
  y += 15;
  y = title(doc, "PROJECT OVERVIEW", y);

  const overviewCols = [
    { label: "Description", w: UW * 0.55, bold: true },
    { label: "Value", w: UW * 0.45, bold: true, highlight: true }, // monetary/important values highlighted
  ];
  const overviewRows = [
    ["Selected Package", pkg.name],
    ["Total Rooms Selected", String(selectedRooms.length)],
    ["Add-ons Selected", String(extraAddons.length)],
    ["Total Area", `${qs.totalAreaSqFt || 0} Sq.ft`],
    ["Estimated Project Cost", fmtINR(grandTotal)],
  ];
  // Remove highlight flag from non-monetary items manually
  const modifiedOverviewRows = overviewRows.map((r, i) => {
    // Only highlight the last row (Cost)
    return r; // We will handle highlight in the table renderer based on column, but for specific cells we might need custom logic.
  });
  
  // Custom draw for overview to highlight only the cost
  fr(doc, ML, y, UW, 24, C.charcoal);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.white)
    .text("Description", ML + 8, y + 7, { width: UW * 0.55 - 16 })
    .text("Value", ML + UW * 0.55 + 8, y + 7, { width: UW * 0.45 - 16 });
  y += 24;

  overviewRows.forEach((row, ri) => {
    const isCost = ri === overviewRows.length - 1;
    const bg = ri % 2 === 0 ? C.white : C.bgLight;
    fr(doc, ML, y, UW, 26, bg);
    
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.text)
      .text(row[0], ML + 8, y + 8, { width: UW * 0.55 - 16 });
      
    doc.font("Helvetica-Bold").fontSize(9).fillColor(isCost ? C.gold : C.text)
      .text(row[1], ML + UW * 0.55 + 8, y + 8, { width: UW * 0.45 - 16 });
      
    hl(doc, ML, y + 26, UW, C.border, 0.5);
    y += 26;
  });

  // ── PACKAGE DETAILS ───────────────────────────────────────────────────
  y += 15;
  y = ensureSpace(doc, y, 150, ref);
  y = title(doc, "PACKAGE DETAILS", y);
  
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.gray).text("Selected Package:", ML, y);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.charcoal).text(pkg.name, ML + 110, y);
  y += 18;
  
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.gray).text("Package Cost:", ML, y);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.gold).text(fmtINR(d.pkgCost), ML + 110, y - 1);
  y += 25;
  
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.charcoal).text("Included Features:", ML, y);
  y += 15;
  
  pkg.benefits.forEach((b) => {
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.gold).text("•", ML + 5, y - 1);
    doc.font("Helvetica").fontSize(9).fillColor(C.text).text(b, ML + 20, y, { width: UW - 25 });
    y = doc.y + 6;
  });

  return y;
}

// ── PAGE 2: ROOM SUMMARY ────────────────────────────────────────────────────
function drawPage2(doc, y, d) {
  const { roomSummaries, roomCostTotal } = d;
  
  y = title(doc, "ROOM SUMMARY", y);

  const cols = [
    { label: "Room", w: UW * 0.20 },
    { label: "Selected Interiors", w: UW * 0.55 },
    { label: "Cost", w: UW * 0.25, align: "right" },
  ];
  
  const rowH = 28;
  const hdrH = 24;
  fr(doc, ML, y, UW, hdrH, C.charcoal);
  let cx = ML;
  cols.forEach(c => {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.white).text(c.label, cx + 8, y + 7, { width: c.w - 16, align: c.align || "left" });
    cx += c.w;
  });
  y += hdrH;
  
  roomSummaries.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : C.bgLight;
    
    // Auto-height for Selected Interiors if it's long
    const textH = doc.heightOfString(row[1], { width: cols[1].w - 16, font: "Helvetica", fontSize: 9 });
    const actualRowH = Math.max(rowH, textH + 14);
    
    fr(doc, ML, y, UW, actualRowH, bg);
    
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.text).text(row[0], ML + 8, y + 8, { width: cols[0].w - 16 });
    doc.font("Helvetica").fontSize(9).fillColor(C.gray).text(row[1], ML + cols[0].w + 8, y + 8, { width: cols[1].w - 16 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.charcoal).text(row[2], ML + cols[0].w + cols[1].w + 8, y + 8, { width: cols[2].w - 16, align: "right" });
    
    hl(doc, ML, y + actualRowH, UW, C.border, 0.5);
    y += actualRowH;
  });

  y += 5;
  y = totalBar(doc, y, "Total Room Cost", fmtINR(roomCostTotal));

  return y + 15;
}

// ── ROOM DETAIL PAGE ────────────────────────────────────────────────────────
function drawRoomDetailPage(doc, y, roomName, detailRows, roomTotal, ref) {
  y = title(doc, roomName.toUpperCase(), y);
  
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Configuration Details", ML, y);
  y += 15;

  const cols = [
    { label: "Item", w: UW * 0.25 },
    { label: "Size", w: UW * 0.15 },
    { label: "Material", w: UW * 0.20 },
    { label: "Qty", w: UW * 0.08, align: "center" },
    { label: "Unit Price", w: UW * 0.16, align: "right" },
    { label: "Total", w: UW * 0.16, align: "right" },
  ];
  
  y = drawTable(doc, y, cols, detailRows, { rowHeight: 28 });
  y += 5;
  y = totalBar(doc, y, `${roomName} Total`, fmtINR(roomTotal));
  return y + 15;
}

// ── ADD-ONS PAGE ────────────────────────────────────────────────────────────
function drawAddOnsPage(doc, y, d) {
  const { extraAddons } = d;

  y = title(doc, "ADD-ON SERVICES", y);

  const cols = [
    { label: "Add-On", w: UW * 0.70 },
    { label: "Cost", w: UW * 0.30, align: "right" },
  ];
  const rows = extraAddons.map((id) => [
    ADDON_LABELS[id] || cap(String(id)),
    fmtINR(ADDON_COSTS[id] || 0),
  ]);
  y = drawTable(doc, y, cols, rows, { rowHeight: 28 });

  let total = 0;
  extraAddons.forEach((id) => { total += ADDON_COSTS[id] || 0; });
  y += 5;
  y = totalBar(doc, y, "Add-On Total", fmtINR(total));
  return y + 15;
}

// ── COST SUMMARY PAGE ───────────────────────────────────────────────────────
function drawCostSummary(doc, y, d) {
  const { roomCostTotal, pkgCost, addOnTotal, gstAmount, grandTotal } = d;

  y = title(doc, "PROJECT COST SUMMARY", y);

  const cols = [
    { label: "Description", w: UW * 0.65 },
    { label: "Amount", w: UW * 0.35, align: "right" },
  ];
  const rows = [
    ["Room Cost", fmtINR(roomCostTotal)],
    ["Package Cost", fmtINR(pkgCost)],
    ["Add-On Cost", fmtINR(addOnTotal)],
    ["GST / Tax", fmtINR(gstAmount)],
  ];
  y = drawTable(doc, y, cols, rows, { rowHeight: 32, fontSize: 10 });

  // ── GRAND TOTAL SECTION ───────────────────────────────────────────────
  y += 25;
  const gtH = 90;
  const gtW = UW * 0.7;
  const gtX = ML + (UW - gtW) / 2;
  
  // Luxury Gold Card
  fr(doc, gtX, y, gtW, gtH, C.gold);
  sr(doc, gtX + 4, y + 4, gtW - 8, gtH - 8, C.white, 1); // Inner border
  
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.charcoal)
    .text("GRAND TOTAL", gtX, y + 25, { width: gtW, align: "center", characterSpacing: 2 });
    
  doc.font("Helvetica-Bold").fontSize(28).fillColor(C.charcoal)
    .text(fmtINR(grandTotal), gtX, y + 45, { width: gtW, align: "center" });

  return y + gtH + 30;
}

// ── TERMS, CONDITIONS & SIGNATURE ───────────────────────────────────────────
function drawTermsAndSignature(doc, y, d) {
  const { now } = d;
  
  // Need to ensure enough space for both Terms and Signature on one page
  y = ensureSpace(doc, y, 400, "TERMS");
  
  y = title(doc, "TERMS & CONDITIONS", y);

  // Intro Statement
  const intro = '"We assure our customers that all materials and workmanship will be delivered according to the agreed quality standards, approved specifications, and project requirements."';
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(C.gray)
    .text(intro, ML, y, { width: UW, align: "justify" });
  y = doc.y + 15;

  const terms = [
    "10 Years Warranty on eligible materials and workmanship.",
    "Final amount may vary depending on material cost fluctuations.",
    "Materials may be upgraded or modified based on customer requirements.",
    "Additional work beyond approved quotation scope will be charged separately.",
    "Advance payments are non-refundable after material procurement.",
    "Warranty excludes accidental damage, misuse, water leakage, and structural issues.",
  ];

  terms.forEach((t, i) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.gold).text(`${i + 1}.`, ML, y);
    doc.font("Helvetica").fontSize(9).fillColor(C.text).text(t, ML + 20, y, { width: UW - 25 });
    y = doc.y + 8;
  });

  // ── APPROVAL & SIGNATURE ──────────────────────────────────────────────────
  y += 20;
  
  // Two clean columns
  const halfW = (UW - 40) / 2;
  const leftX = ML;
  const rightX = ML + halfW + 40;
  
  // Left: Customer Approval
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.charcoal).text("Customer Approval", leftX, y);
  hl(doc, leftX, y + 14, halfW, C.gold, 1);
  
  let ly = y + 35;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Name:", leftX, ly);
  hl(doc, leftX + 40, ly + 9, halfW - 40, C.border, 0.5);
  ly += 30;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Signature:", leftX, ly);
  hl(doc, leftX + 55, ly + 9, halfW - 55, C.border, 0.5);
  ly += 30;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Date:", leftX, ly);
  hl(doc, leftX + 35, ly + 9, halfW - 35, C.border, 0.5);

  // Right: Authorized By
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.charcoal).text("Authorized By", rightX, y);
  hl(doc, rightX, y + 14, halfW, C.gold, 1);
  
  let ry = y + 35;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.charcoal).text(CO.name, rightX, ry);
  ry += 30;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Authorized Signature", rightX, ry);
  hl(doc, rightX, ry - 5, halfW, C.border, 0.5);
  ry += 40;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Company Seal", rightX, ry);
  sr(doc, rightX, ry - 25, 80, 40, C.border, 0.5);

  return Math.max(ly, ry) + 30;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
const generateQuotationPDF = async (estimator, res, callback) => {
  try {
    if (!estimator) throw new Error("Estimator data is required");

    // ── Extract data ─────────────────────────────────────────────────────
    const now = new Date();
    const ref = mkRef(estimator._id);
    const qs  = estimator.quoteSummary || {};
    const ci  = estimator.customerInfo || {};
    const rawRooms = estimator.rooms || {};
    const rooms = rawRooms instanceof Map ? Object.fromEntries(rawRooms) : rawRooms;
    const lineItems   = Array.isArray(qs.lineItems) ? qs.lineItems : [];
    const extraAddons = Array.isArray(estimator.extraAddons) ? estimator.extraAddons : [];
    const budgetPlan  = estimator.budgetPlan || "premium";
    const pkg = PACKAGES[budgetPlan] || PACKAGES.premium;
    const material = PLAN_MATERIAL[budgetPlan] || "BWR Ply";

    // Selected rooms
    const selectedRooms = Object.entries(rooms).filter(([, c]) => c > 0).map(([r]) => r);

    // Room line items (exclude extra-addons)
    const roomLineItems = lineItems.filter((it) => it.roomId !== "extra-addons");

    // Aggregate costs by room name
    const roomCosts = {};
    const roomItemsByName = {};
    roomLineItems.forEach((item) => {
      const name = item.roomName || item.label || "Other";
      roomCosts[name] = (roomCosts[name] || 0) + (item.estimatedCost || 0);
      if (!roomItemsByName[name]) roomItemsByName[name] = [];
      roomItemsByName[name].push(item);
    });

    // Financial totals (DO NOT MODIFY CALCULATION LOGIC)
    const roomCostTotal = roomLineItems.reduce((s, it) => s + (it.estimatedCost || 0), 0);
    const pkgCost = pkg.cost || 0;
    let addOnTotal = 0;
    extraAddons.forEach((id) => { addOnTotal += ADDON_COSTS[id] || 0; });
    const baseAmount = roomCostTotal + pkgCost + addOnTotal;
    const gstAmount  = Math.round(baseAmount * 0.18);
    const grandTotal = baseAmount + gstAmount;

    // Build room summaries for Page 2
    const roomSummaries = Object.entries(roomCosts).map(([name, cost]) => {
      const items = roomItemsByName[name] || [];
      const selectedItemsList = [];
      items.forEach((it) => {
        if (it.layout && it.layout !== "Standard") selectedItemsList.push(it.layout);
        if (Array.isArray(it.addons)) it.addons.forEach((a) => selectedItemsList.push(a));
      });
      const selectedStr = selectedItemsList.length > 0 ? selectedItemsList.join(", ") : "Standard Items";
      return [name, selectedStr, fmtINR(cost)];
    });

    // Build room detail rows for per-room pages
    const roomDetails = {};
    Object.entries(roomItemsByName).forEach(([name, items]) => {
      const rows = [];
      items.forEach((item) => {
        // Base area row
        if (item.areaSqFt > 0) {
          const baseCost = item.baseCost || (item.areaSqFt * item.ratePerSqFt) || 0;
          rows.push([
            `${name} Base`,
            `${item.areaSqFt} sq.ft`,
            material,
            "1",
            fmtINR(baseCost),
            fmtINR(baseCost),
          ]);
        }
        // Layout row
        if (item.layout && item.layout !== "") {
          const lCost = item.layoutCost || 0;
          rows.push([
            `Layout (${item.layout})`,
            "Standard",
            material,
            "1",
            fmtINR(lCost),
            fmtINR(lCost),
          ]);
        }
        // Add-on rows
        if (Array.isArray(item.addons) && item.addons.length > 0) {
          item.addons.forEach((addon) => {
            const perCost = item.addonsCost ? Math.round(item.addonsCost / item.addons.length) : 15000;
            rows.push([
              addon,
              "Premium",
              material,
              "1",
              fmtINR(perCost),
              fmtINR(perCost),
            ]);
          });
        }
      });
      roomDetails[name] = { rows, total: roomCosts[name] || 0 };
    });

    // Shared data
    const shared = {
      ref, now, ci, rooms, budgetPlan, selectedRooms, lineItems,
      roomLineItems, extraAddons, roomCosts, roomCostTotal,
      pkgCost, addOnTotal, gstAmount, grandTotal, roomSummaries,
      roomDetails, material, qs
    };

    // ── Create PDF ───────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (err) => { if (callback) callback(err); });
    doc.on("end", () => {
      try {
        const buf = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition",
          `attachment; filename="Trendy_Interiors_Quotation_${estimator._id || "draft"}.pdf"`);
        res.setHeader("Content-Length", buf.length);
        res.send(buf);
        if (callback) callback(null);
      } catch (err) { if (callback) callback(err); }
    });

    // ═════════════════════════════════════════════════════════════════════
    //  DRAW ALL PAGES
    // ═════════════════════════════════════════════════════════════════════

    // PAGE 1 — Header, Customer Details, Project Overview, Package
    drawPage1(doc, shared);

    // PAGE 2 — Room Summary
    let y = newPage(doc, ref);
    drawPage2(doc, y, shared);

    // PAGE 3+ — Room Detail Pages (dynamically generated)
    const uniqueRooms = Object.keys(roomDetails);
    uniqueRooms.forEach((roomName) => {
      y = newPage(doc, ref);
      drawRoomDetailPage(doc, y, roomName, roomDetails[roomName].rows, roomDetails[roomName].total, ref);
    });

    // ADD-ONS PAGE (only if selected)
    if (extraAddons.length > 0) {
      y = newPage(doc, ref);
      drawAddOnsPage(doc, y, shared);
    }

    // COST SUMMARY PAGE
    y = newPage(doc, ref);
    y = drawCostSummary(doc, y, shared);

    // TERMS & CONDITIONS & SIGNATURE
    // Check if we need a new page or if we can fit it on the cost summary page
    y = ensureSpace(doc, y, 400, ref);
    drawTermsAndSignature(doc, y, shared);

    // ── Add footers with correct page numbers ────────────────────────────
    const pages = doc.bufferedPageRange();
    const total = pages.count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc, i + 1, total);
    }

    doc.flushPages();
    doc.end();
  } catch (err) {
    if (callback) callback(err);
    else throw err;
  }
};

module.exports = { generateQuotationPDF };
