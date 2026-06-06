const PDFDocument = require("pdfkit");

const COLORS = {
  navy: "#111827",
  gold: "#C9A96E",
  lightGold: "#F6EBD2",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  green: "#16A34A",
  error: "#DC2626",
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (value = 0) =>
  `Rs. ${safeNumber(value).toLocaleString("en-IN")}`;

const titleCase = (text = "") =>
  String(text)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === "function") return value.toObject();
  return value;
};

const shortText = (text = "", limit = 70) => {
  const str = String(text || "");
  return str.length > limit ? str.slice(0, limit - 3) + "..." : str;
};

const txt = (doc, text, x, y, options = {}) => {
  doc.text(String(text || ""), x, y, {
    lineBreak: false,
    ...options,
  });
};

const card = (doc, x, y, w, h, fill = COLORS.white, stroke = COLORS.border) => {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, stroke);
};

/**
 * ENHANCED: Draw company logo (text-based badge style)
 * Can be replaced with actual logo image path in future
 */
const drawLogo = (doc, x, y) => {
  // Logo badge background
  doc.roundedRect(x, y, 45, 45, 6).fillAndStroke(COLORS.gold, COLORS.gold);

  // Logo text "TI" (Trendy Interiors initials)
  doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.navy);
  txt(doc, "TI", x + 5, y + 10, { width: 35, align: "center" });
};

/**
 * ENHANCED: Draw footer with page numbers and timestamp
 */
const drawFooter = (doc, pageNo, totalPages = 2, generatedTime = "") => {
  const pageW = 595.28;
  const footerY = 770;

  doc.rect(0, footerY, pageW, 45).fill(COLORS.navy);

  doc.strokeColor(COLORS.gold)
    .lineWidth(2)
    .moveTo(0, footerY)
    .lineTo(pageW, footerY)
    .stroke();

  doc.font("Helvetica").fontSize(7.5).fillColor("#CBD5E1");
  doc.text(
    "www.trendyinteriors.com  |  hello@trendyinteriors.com  |  +91 98765 43210",
    40,
    footerY + 12,
    {
      width: 400,
      align: "center",
      lineBreak: false,
    }
  );

  doc.font("Helvetica").fontSize(7).fillColor("#94A3B8");
  
  // Enhanced: Added generation timestamp
  if (generatedTime) {
    txt(doc, `Generated: ${generatedTime}`, 40, footerY + 27, {
      width: 515,
      align: "left",
    });
  }

  doc.font("Helvetica").fontSize(7).fillColor("#94A3B8");
  txt(doc, `Page ${pageNo} of ${totalPages}`, 40, footerY + 27, {
    width: 515,
    align: "right",
  });
};

/**
 * ENHANCED: Draw header with logo and company branding
 */
const drawHeader = (doc, currentDate, shortRef, generatedTime = "") => {
  const pageW = 595.28;

  doc.rect(0, 0, pageW, 105).fill(COLORS.navy);

  // ENHANCED: Add logo to header
  drawLogo(doc, 45, 18);

  // Company name with logo
  doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.gold);
  txt(doc, "TRENDY INTERIORS", 100, 28, { width: 200 });

  doc.font("Helvetica").fontSize(9).fillColor("#CBD5E1");
  txt(doc, "Interior Design & Furnishing Solutions", 100, 50, { width: 240 });

  doc.font("Helvetica").fontSize(8).fillColor("#94A3B8");
  txt(doc, "123 Design Street, Premium Plaza, Coimbatore  |  +91 98765 43210", 100, 62, { width: 240 });
  txt(doc, "hello@trendyinteriors.com  |  www.trendyinteriors.com", 100, 73, { width: 240 });

  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.white);
  txt(doc, "QUOTATION", 350, 30, { width: 205, align: "right" });

  doc.font("Helvetica").fontSize(8).fillColor("#CBD5E1");
  txt(doc, `REF: ${shortRef}`, 350, 55, { width: 205, align: "right" });
  txt(doc, `ISSUED: ${currentDate}`, 350, 67, { width: 205, align: "right" });
  
  // ENHANCED: Added generation timestamp in header
  if (generatedTime) {
    txt(doc, `Generated: ${generatedTime}`, 350, 79, { width: 205, align: "right" });
  }
};

const sectionTitle = (doc, title, x, y) => {
  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.navy);
  txt(doc, title, x, y, { width: 240 });

  doc.strokeColor(COLORS.gold).lineWidth(1.2).moveTo(x, y + 17).lineTo(x + 80, y + 17).stroke();
};

const labelValue = (doc, label, value, x, y, width = 220) => {
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.muted);
  txt(doc, label, x, y, { width });

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
  txt(doc, value || "Not Provided", x, y + 12, { width });
};

/**
 * ENHANCED: Draw user selected items/rooms section with visual formatting
 * Displays all rooms and selected design options in a structured format
 */
const drawSelectedItemsSection = (doc, lineItems, roomsObject, currentY) => {
  let y = currentY;
  
  sectionTitle(doc, "Selected Items & Services", 40, y);
  y += 35;

  card(doc, 40, y, 515, 8, COLORS.border);
  y += 8;

  // Display all line items in a structured list format
  lineItems.forEach((item, index) => {
    const itemHeight = 35;
    
    // Alternate background colors for better readability
    const bg = index % 2 === 0 ? COLORS.white : COLORS.bg;
    doc.rect(40, y, 515, itemHeight).fillAndStroke(bg, COLORS.border);

    // Item number and title
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy);
    txt(doc, `${index + 1}. ${item.label || item.roomName || 'Item'}`, 55, y + 8, { 
      width: 300 
    });

    // Item details
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted);
    
    let detailText = "";
    if ((item.roomId === "global-addons" || item.roomId === "extra-addons") && Array.isArray(item.addons)) {
      detailText = `Add-ons: ${item.addons.map(titleCase).join(", ")}`;
    } else if (safeNumber(item.areaSqFt) > 0) {
      const baseCost = safeNumber(item.baseCost, safeNumber(item.areaSqFt) * safeNumber(item.ratePerSqFt));
      detailText = `Area: ${safeNumber(item.areaSqFt)} sq.ft | Base: ${formatCurrency(baseCost)}`;
      if (safeNumber(item.layoutCost) > 0) {
        detailText += ` | Layout: ${formatCurrency(item.layoutCost)}`;
      }
      if (safeNumber(item.addonsCost) > 0) {
        detailText += ` | Add-ons: ${formatCurrency(item.addonsCost)}`;
      }
    }
    
    if (detailText) {
      txt(doc, detailText, 55, y + 21, { width: 400 });
    }

    // Cost on the right
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.gold);
    txt(doc, formatCurrency(item.estimatedCost), 435, y + 12, { 
      width: 80, 
      align: "right" 
    });

    y += itemHeight;
  });

  return y;
};

/**
 * ENHANCED: Main PDF generation function with:
 * - Company logo in header
 * - Generation timestamp
 * - Enhanced selected items section
 * - Improved terms & conditions
 * - Multi-page support
 */
const generateQuotationPDF = (estimator, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="quotation-${estimator._id}.pdf"`
  );

  doc.pipe(res);

  const {
    quoteSummary = {},
    customerInfo = {},
    rooms,
  } = estimator;

  const roomsObject = normalizeMap(rooms);
  const lineItems = Array.isArray(quoteSummary.lineItems) ? quoteSummary.lineItems : [];

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ENHANCED: Add generation timestamp (current date and time)
  const generatedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const shortRef = String(estimator._id || "N/A").slice(-10).toUpperCase();

  const subtotal =
    safeNumber(quoteSummary.estimatedAmount) ||
    lineItems.reduce((sum, item) => sum + safeNumber(item.estimatedCost), 0);

  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;
  const advance = Math.round(grandTotal * 0.5);

  const roomsList =
    Object.entries(roomsObject)
      .map(([room, count]) => `${titleCase(room)} (${count})`)
      .join(", ") || "Not Provided";

  // ================= PAGE 1 =================
  drawHeader(doc, currentDate, shortRef, generatedTime);

  let y = 130;

  card(doc, 40, y, 515, 68, COLORS.bg);

  doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.navy);
  txt(doc, "Interior Design Quotation", 60, y + 16, { width: 300 });

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  txt(
    doc,
    "Prepared for client review after website estimation and project requirement selection.",
    60,
    y + 39,
    { width: 370 }
  );

  y = 225;

  const colW = 247;
  card(doc, 40, y, colW, 120);
  card(doc, 308, y, colW, 120);

  sectionTitle(doc, "Client Details", 58, y + 16);
  labelValue(doc, "Full Name", customerInfo.name, 58, y + 45, 200);
  labelValue(doc, "Email", customerInfo.email, 58, y + 70, 220);
  labelValue(doc, "Phone", customerInfo.phone, 58, y + 95, 200);

  sectionTitle(doc, "Project Details", 326, y + 16);
  labelValue(doc, "Location", customerInfo.location, 326, y + 45, 190);
  labelValue(doc, "Quote Type", "Custom Interior Estimate", 326, y + 70, 190);
  labelValue(doc, "Quote Validity", "30 days from issue date", 326, y + 95, 190);

  y = 370;

  card(doc, 40, y, 515, 78, COLORS.bg);

  sectionTitle(doc, "Project Summary", 58, y + 16);

  labelValue(doc, "Selected Rooms", roomsList, 58, y + 46, 280);
  labelValue(doc, "Total Area", `${safeNumber(quoteSummary.totalAreaSqFt)} sq.ft`, 390, y + 46, 120);

  y = 480;

  sectionTitle(doc, "Cost Breakdown", 40, y);

  y += 35;

  const tableX = 40;
  const tableW = 515;

  doc.roundedRect(tableX, y, tableW, 30, 6).fill(COLORS.navy);

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.white);
  txt(doc, "Description", tableX + 12, y + 11, { width: 220 });
  txt(doc, "Area / Qty", tableX + 285, y + 11, { width: 70 });
  txt(doc, "Rate", tableX + 365, y + 11, { width: 65, align: "right" });
  txt(doc, "Amount", tableX + 435, y + 11, { width: 65, align: "right" });

  y += 30;

  const page1Items = lineItems.slice(0, 5);

  page1Items.forEach((item, index) => {
    const rowH = 45;
    const bg = index % 2 === 0 ? COLORS.white : COLORS.bg;

    doc.rect(tableX, y, tableW, rowH).fillAndStroke(bg, COLORS.border);

    let title = item.label || "Item";
    let sub = "";

    if ((item.roomId === "global-addons" || item.roomId === "extra-addons") && Array.isArray(item.addons)) {
      title = "Extra Add-ons";
      sub = item.addons.map(titleCase).join(", ");
    } else if (safeNumber(item.areaSqFt) > 0) {
      const baseCost = safeNumber(item.baseCost, safeNumber(item.areaSqFt) * safeNumber(item.ratePerSqFt));
      sub = `${safeNumber(item.areaSqFt)} sq.ft x ${formatCurrency(item.ratePerSqFt)}/sq.ft = ${formatCurrency(baseCost)}`;
      if (safeNumber(item.layoutCost) > 0) {
        sub += ` + Layout ${formatCurrency(item.layoutCost)}`;
      }
      if (safeNumber(item.addonsCost) > 0) {
        sub += ` + Add-ons ${formatCurrency(item.addonsCost)}`;
      }
    }

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.text);
    txt(doc, shortText(title, 45), tableX + 12, y + 9, { width: 230 });

    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted);
    txt(doc, shortText(sub, 60), tableX + 12, y + 24, { width: 250 });

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);
    txt(
      doc,
      safeNumber(item.areaSqFt) > 0 ? `${safeNumber(item.areaSqFt)} sq.ft` : "1 unit",
      tableX + 285,
      y + 17,
      { width: 70 }
    );

    txt(
      doc,
      safeNumber(item.ratePerSqFt) > 0 ? formatCurrency(item.ratePerSqFt) : "-",
      tableX + 365,
      y + 17,
      { width: 65, align: "right" }
    );

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.navy);
    txt(doc, formatCurrency(item.estimatedCost), tableX + 435, y + 17, {
      width: 65,
      align: "right",
    });

    y += rowH;
  });

  if (lineItems.length > 5) {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
    txt(doc, `Remaining ${lineItems.length - 5} item(s) continued on the next page.`, 52, y + 12, {
      width: 400,
    });
  }

  drawFooter(doc, 1, lineItems.length > 5 ? 3 : 2, generatedTime);

  // ================= PAGE 2: Enhanced Selected Items =================
  doc.addPage({ size: "A4", margin: 0 });

  drawHeader(doc, currentDate, shortRef, generatedTime);

  y = 130;

  // ENHANCED: Draw complete selected items section with all line items
  y = drawSelectedItemsSection(doc, lineItems, roomsObject, y);

  y += 15;

  drawFooter(doc, 2, lineItems.length > 5 ? 3 : 2, generatedTime);

  // ================= PAGE 3: Summary & Terms =================
  doc.addPage({ size: "A4", margin: 0 });

  drawHeader(doc, currentDate, shortRef, generatedTime);

  y = 130;

  sectionTitle(doc, "Quotation Summary", 40, y);

  y += 35;

  card(doc, 315, y, 240, 145, COLORS.bg, COLORS.gold);

  const totalRow = (label, value, yy, bold = false, color = COLORS.text) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9).fillColor(color);
    txt(doc, label, 335, yy, { width: 100 });

    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9).fillColor(color);
    txt(doc, value, 435, yy, { width: 95, align: "right" });
  };

  totalRow("Subtotal", formatCurrency(subtotal), y + 22);
  totalRow("GST 18%", formatCurrency(gst), y + 48);

  doc.strokeColor(COLORS.border).moveTo(335, y + 75).lineTo(535, y + 75).stroke();

  totalRow("Grand Total", formatCurrency(grandTotal), y + 92, true, COLORS.navy);
  totalRow("Advance 50%", formatCurrency(advance), y + 120, true, COLORS.gold);

  card(doc, 40, y, 250, 145);

  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.navy);
  txt(doc, "Payment Information", 60, y + 22, { width: 180 });

  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted);
  txt(doc, "Advance Required", 60, y + 55, { width: 120 });
  doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.gold);
  txt(doc, formatCurrency(advance), 60, y + 72, { width: 160 });

  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
  txt(
    doc,
    "Balance payment will be collected based on final site inspection, confirmed materials, and project scope.",
    60,
    y + 100,
    { width: 200 }
  );

  y = 310;

  /**
   * ENHANCED: Comprehensive Terms & Conditions section with better formatting
   */
  sectionTitle(doc, "Terms & Conditions", 40, y);

  // ENHANCED: Expanded T&C list with more detail
  const termsConditions = [
    "This quotation is valid for 30 days from the date of issue. After this period, please request a fresh quotation.",
    "50% advance payment is required to commence work. The remaining balance is due upon project completion.",
    "Final pricing may vary based on exact on-site measurements and material availability.",
    "Any changes to design, materials, dimensions, or project scope will be billed separately.",
    "GST (18%), delivery charges, installation, and additional services will be finalized before formal approval.",
    "Material warranties follow manufacturer terms and company warranty policy (typically 1-2 years).",
    "This quotation does NOT include external demolition, wall removal, or structural modifications.",
    "All payment disputes must be raised within 7 days of invoice issuance.",
  ];

  y += 30;

  card(doc, 40, y, 515, termsConditions.length * 18 + 20);

  doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);

  termsConditions.forEach((term, i) => {
    const ty = y + 18 + i * 18;
    doc.circle(56, ty + 3, 1.5).fill(COLORS.gold);
    txt(doc, term, 70, ty, { width: 470 });
  });

  y += termsConditions.length * 18 + 40;

  sectionTitle(doc, "Approval & Sign-Off", 40, y);

  y += 40;

  card(doc, 40, y, 515, 110);

  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted);
  txt(doc, "Prepared By", 60, y + 22, { width: 150 });

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.navy);
  txt(doc, "Trendy Interiors Team", 60, y + 38, { width: 190 });

  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted);
  txt(
    doc,
    "This is a computer-generated quotation. Digital signatures and approvals are accepted.",
    60,
    y + 60,
    { width: 240 }
  );

  const sigX = 350;

  doc.strokeColor(COLORS.border).lineWidth(1).moveTo(sigX, y + 65).lineTo(525, y + 65).stroke();

  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted);
  txt(doc, "Client Signature / Email Approval", sigX, y + 75, {
    width: 175,
    align: "center",
  });

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.green);
  txt(doc, "✓ Quotation Ready for Client Review", 60, y + 85, { width: 250 });

  drawFooter(doc, lineItems.length > 5 ? 3 : 2, lineItems.length > 5 ? 3 : 2, generatedTime);

  doc.end();
};

module.exports = { generateQuotationPDF };