const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Stream = require("stream");

const NAVY      = "#1a1a1a"; // Changed from navy to premium black
const GOLD      = "#d4af37"; // Premium metallic gold
const WHITE     = "#ffffff";
const ZEBRA     = "#f0f4ff";
const LIGHT_BG  = "#f7f9fc";
const DARK_TEXT = "#222222";
const MID_TEXT  = "#555555";
const BORDER    = "#d0d7e3";
const GOLD_LITE = "#fdf6dc";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 50; // roughly 18mm
const CONTENT_W = A4_W - 2 * MARGIN;

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(amount) {
  if (amount === undefined || amount === null) return "Rs. 0";
  const absAmt = Math.abs(amount);
  const s = String(Math.round(absAmt));
  if (s.length <= 3) return (amount < 0 ? "Rs. -" : "Rs. ") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  return (amount < 0 ? "Rs. -" : "Rs. ") + formatted;
}

// Ensure there is space for the next element, otherwise add a page
function checkSpace(doc, heightNeeded) {
  if (doc.y + heightNeeded > A4_H - 60) {
    doc.addPage();
    return true;
  }
  return false;
}

function getRowHeight(doc, row, colWidths) {
  const padding = 12;
  let maxHeight = 0;
  const originalFont = doc._font;
  const originalFontSize = doc._fontSize;

  doc.font("Helvetica").fontSize(9);
  row.forEach((cell, ci) => {
    const text = String(cell || "");
    const width = colWidths[ci] - 16;
    const align = ci === 0 ? "left" : (ci === row.length - 1 ? "right" : "center");
    const height = doc.heightOfString(text, { width, align, paragraphGap: 0, lineGap: 0 });
    if (height > maxHeight) {
      maxHeight = height;
    }
  });

  if (originalFont) doc.font(originalFont.name || originalFont);
  if (originalFontSize) doc.fontSize(originalFontSize);
  return Math.max(maxHeight + padding, 22);
}

function ensureSectionSpace(doc, estimatedHeight) {
  if (doc.y + estimatedHeight > A4_H - 60) {
    doc.addPage();
  }
}

function renderBlock(doc, estimatedHeight, drawFn) {
  if (doc.y + estimatedHeight > A4_H - 60) {
    doc.addPage();
  }
  drawFn();
}

// ── Table Drawing Engine ────────────────────────────────────────────────────
function drawSectionHeader(doc, title) {
  checkSpace(doc, 30);
  const y = doc.y;
  doc.rect(MARGIN, y, CONTENT_W, 24).fill(NAVY);
  doc.rect(MARGIN, y, 4, 24).fill(GOLD);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10);
  doc.text(title, MARGIN + 14, y + 7);
  doc.y = y + 24 + 8; // add some spacing
}

function drawInfoTable(doc, rows, colWidths = [CONTENT_W * 0.4, CONTENT_W * 0.6]) {
  const rowHeight = 22;
  checkSpace(doc, rows.length * rowHeight);

  let currentY = doc.y;
  
  // draw boundary box
  doc.lineWidth(0.4).strokeColor(BORDER);
  doc.rect(MARGIN, currentY, CONTENT_W, rows.length * rowHeight).stroke();

  rows.forEach((row, i) => {
    const isZebra = i % 2 === 0;
    if (isZebra) {
      doc.rect(MARGIN, currentY, CONTENT_W, rowHeight).fill(ZEBRA);
    }
    
    // Draw vertical divider
    doc.moveTo(MARGIN + colWidths[0], currentY).lineTo(MARGIN + colWidths[0], currentY + rowHeight).strokeColor(BORDER).stroke();

    doc.fillColor(DARK_TEXT).font("Helvetica-Bold").fontSize(9);
    doc.text(row[0], MARGIN + 8, currentY + 6, { width: colWidths[0] - 16, align: "left" });
    
    doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(9);
    doc.text(String(row[1] || ""), MARGIN + colWidths[0] + 8, currentY + 6, { width: colWidths[1] - 16, align: "left" });

    currentY += rowHeight;
    
    // draw horizontal divider
    if (i < rows.length - 1) {
      doc.moveTo(MARGIN, currentY).lineTo(MARGIN + CONTENT_W, currentY).strokeColor(BORDER).stroke();
    }
    doc.y = currentY;
  });

  doc.y = currentY + 10;
}

function drawDataTable(doc, headers, rows, colWidths, totalRow = null) {
  const headerHeight = 24;
  const pageBottom = A4_H - 60;

  const drawHeader = (y) => {
    doc.rect(MARGIN, y, CONTENT_W, headerHeight).fill(NAVY);
    let currentX = MARGIN;
    headers.forEach((h, i) => {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9);
      const align = i === 0 ? "left" : (i === headers.length - 1 ? "right" : "center");
      doc.text(h, currentX + 8, y + 7, { width: colWidths[i] - 16, align });
      currentX += colWidths[i];
    });
    doc.y = y + headerHeight;
  };

  if (doc.y + headerHeight > pageBottom) {
    doc.addPage();
  }
  drawHeader(doc.y);

  doc.lineWidth(0.4).strokeColor(BORDER);
  rows.forEach((row, ri) => {
    const rowHeight = Math.max(getRowHeight(doc, row, colWidths), 22);

    if (doc.y + rowHeight > pageBottom) {
      doc.addPage();
      drawHeader(doc.y);
    }

    const currentY = doc.y;
    const isZebra = ri % 2 === 0;
    if (isZebra) {
      doc.rect(MARGIN, currentY, CONTENT_W, rowHeight).fill(ZEBRA);
    }

    let currentX = MARGIN;
    row.forEach((cell, ci) => {
      doc.rect(currentX, currentY, colWidths[ci], rowHeight).stroke();
      doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(9);
      const align = ci === 0 ? "left" : (ci === row.length - 1 ? "right" : "center");
      doc.text(String(cell || ""), currentX + 8, currentY + 6, { width: colWidths[ci] - 16, align });
      currentX += colWidths[ci];
    });

    doc.y = currentY + rowHeight;
  });

  if (totalRow) {
    const totalHeight = 30;
    if (doc.y + totalHeight > pageBottom) {
      doc.addPage();
    }

    const currentY = doc.y;
    doc.rect(MARGIN, currentY, CONTENT_W, totalHeight).fill(GOLD_LITE);

    doc.lineWidth(1).strokeColor(GOLD);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + CONTENT_W, currentY).stroke();
    doc.moveTo(MARGIN, currentY + totalHeight).lineTo(MARGIN + CONTENT_W, currentY + totalHeight).stroke();

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
    doc.text(totalRow[0], MARGIN + 10, currentY + 8, { width: colWidths[0] + colWidths[1] - 20, align: "left" });
    doc.text(totalRow[2], MARGIN + colWidths[0] + colWidths[1] + 8, currentY + 8, { width: colWidths[2] - 16, align: "right" });
    doc.y = currentY + totalHeight + 10;
  } else {
    doc.y += 10;
  }
}

// ── Document Sections ───────────────────────────────────────────────────────
function drawLetterhead(doc, quotation) {
  const startY = doc.y;
  const height = 125;
  
  // Gold bounding box
  doc.lineWidth(1).strokeColor(GOLD);
  doc.rect(MARGIN, startY, CONTENT_W, height).stroke();

  // Padding inside box
  const padX = 15;
  const padY = 15;
  
  // Logo Block
  const localLogo = path.join(__dirname, "logo.png");
  const localLogoJpg = path.join(__dirname, "logo.jpg");
  const frontendLogo = path.join(__dirname, "..", "..", "client", "public", "images", "logo.png");
  
  const logoToUse = [localLogo, localLogoJpg, frontendLogo].find(fs.existsSync);
  
  if (logoToUse) {
    doc.image(logoToUse, MARGIN + padX, startY + padY, { fit: [40, 40], align: 'center', valign: 'center' });
  } else {
    doc.rect(MARGIN + padX, startY + padY, 40, 40).fill("#1a1a1a");
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(24);
    doc.text("T", MARGIN + padX, startY + padY + 10, { width: 40, align: "center" });
  }

  // "INTERIOR QUOTATION" title
  doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(20);
  doc.text("INTERIOR QUOTATION", MARGIN, startY + padY + 12, { width: CONTENT_W - padX, align: "right", characterSpacing: 1 });

  // Thin gray line
  doc.lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(MARGIN + padX, startY + padY + 40 + 10).lineTo(MARGIN + CONTENT_W - padX, startY + padY + 40 + 10).stroke();

  // Bottom section: Company Info (Left)
  const bottomY = startY + padY + 40 + 20;
  doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(10);
  doc.text("Trendy Interios.", MARGIN + padX, bottomY);
  
  doc.fillColor(MID_TEXT).font("Helvetica").fontSize(8);
  doc.text("138, Muthugoundampalayam, Sathy-Erode Road,", MARGIN + padX, bottomY + 12);
  doc.text("Opp TNK School, Kavindapadi, Erode - 638 455", MARGIN + padX, bottomY + 22);
  doc.text("+91 99652 99777 | +91 90803 98889", MARGIN + padX, bottomY + 32);
  doc.text("trendyinterios@gmail.com | info@trendyinterios.com", MARGIN + padX, bottomY + 42);

  // Bottom section: Quotation Details (Right)
  const labelWidth = 70;
  const valWidth = 80;
  doc.fillColor(MID_TEXT).font("Helvetica").fontSize(9);
  doc.text("Quotation No :", MARGIN + CONTENT_W - padX - valWidth - labelWidth, bottomY + 2, { width: labelWidth, align: "right" });
  doc.text("Date :", MARGIN + CONTENT_W - padX - valWidth - labelWidth, bottomY + 16, { width: labelWidth, align: "right" });
  
  doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(9);
  doc.text(quotation.quotation_no, MARGIN + CONTENT_W - padX - valWidth, bottomY + 2, { width: valWidth, align: "right" });
  doc.text(quotation.date, MARGIN + CONTENT_W - padX - valWidth, bottomY + 16, { width: valWidth, align: "right" });

  doc.y = startY + height + 25;
}

function drawFooter(doc, pagesCount) {
  for (let i = 1; i <= pagesCount; i++) {
    doc.switchToPage(i - 1);
    const y = A4_H - 30; // 10mm from bottom

    doc.lineWidth(0.5).strokeColor(NAVY);
    doc.moveTo(MARGIN, y - 5).lineTo(MARGIN + CONTENT_W, y - 5).stroke();

    doc.fillColor(MID_TEXT).font("Helvetica").fontSize(7.5);
    doc.text("TRENDY INTERIOS. | +91 99652 99777 | trendyinterios@gmail.com", MARGIN, y, { lineBreak: false });
    doc.text(`Page ${i}`, MARGIN, y, { width: CONTENT_W, align: "right", lineBreak: false });
  }
}

// ── Main Generation Function ────────────────────────────────────────────────
const generateQuotationPDF = async (estimator, res, callback) => {
  try {
    if (!estimator) throw new Error("Estimator data is required");

    // ── Extract and Map Data ──────────────────────────────────────────────
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB");
    const quoteNo = `QT-${(estimator._id || "DRAFT").toString().slice(-8).toUpperCase()}`;
    
    const qs = estimator.quoteSummary || {};
    const ci = estimator.customerInfo || {};
    const dimensions = estimator.roomDimensionsByRoom || {};
    const lineItems = Array.isArray(qs.lineItems) ? qs.lineItems : [];
    
    const roomLineItems = lineItems.filter(it => it.roomId !== "global-addons");
    const globalAddonsItem = lineItems.find(it => it.roomId === "global-addons");

    // Room Summary & Details
    const roomSummaries = [];
    const rooms = {};
    let totalRoomsCount = 0;
    
    roomLineItems.forEach(item => {
      const type = item.roomName || "Other";
      if (!rooms[type]) {
        rooms[type] = { rooms: [], addons: [], total: 0 };
      }
      
      const interiorsList = [];
      if (item.layout && item.layout !== "Standard") interiorsList.push(item.layout);
      if (item.addons && item.addons.length > 0) interiorsList.push(...item.addons);
      
      const selectedPackages = (item.packageComponents || []).filter(c => c.isSelected).map(c => c.name);
      if (selectedPackages.length > 0) interiorsList.push(...selectedPackages);

      const interiorsStr = interiorsList.length > 0 ? interiorsList.join(", ") : "Standard";

      // Calculate base + layout cost (excluding addons)
      const roomBasePlusLayout = (item.baseCost || 0) + (item.layoutCost || 0) + (item.layoutMaterialsCost || 0);

      let len = item.length;
      let wid = item.width;
      let hei = item.height;
      
      // Fallback to dimensions object/Map for older records
      if (!len || !wid) {
        let dim = {};
        if (dimensions && typeof dimensions.get === 'function') {
          dim = dimensions.get(item.roomId) || {};
        } else if (dimensions) {
          dim = dimensions[item.roomId] || {};
        }
        len = len || dim.length;
        wid = wid || dim.width;
        hei = hei || dim.height;
      }
      
      const measurement = (len && wid)
        ? (hei ? `L:${len}' W:${wid}' H:${hei}'` : `L:${len}' W:${wid}'`)
        : "";

      rooms[type].rooms.push({
        name: item.label || type,
        measurement: measurement,
        size: `${item.areaSqFt || 0} Sq.ft`,
        layout: item.layout || "Standard",
        qty: 1,
        cost: roomBasePlusLayout,
        addons: item.addonDetails || [],
        packageComponents: (item.packageComponents || []).filter(c => c.isSelected)
      });
      
      rooms[type].total += item.estimatedCost || 0;
      totalRoomsCount += 1;
      
      roomSummaries.push({
        room_type: item.label || type,
        interiors: interiorsStr,
        cost: item.estimatedCost || 0
      });
    });

    const globalAddons = globalAddonsItem ? globalAddonsItem.addonDetails : [];
    const globalAddonsTotal = globalAddonsItem ? globalAddonsItem.estimatedCost : 0;
    
    const roomCost = qs.roomTotals || 0;
    const addonCost = globalAddonsTotal;
    const gstBase = (qs.roomTotals || 0) + (qs.globalAddonsTotal || 0);
    const gst = qs.gstAmount || Math.round(gstBase * 0.18);
    const grandTotal = (qs.grandTotal || qs.estimatedAmount || 0) + gst;

    const quotation = {
      quotation_no: quoteNo,
      date: dateStr,
      customer: {
        name: ci.name || "N/A",
        phone: ci.phone || "N/A",
        email: ci.email || "N/A",
        address: ci.location || "N/A",
      },
      overview: {
        total_rooms: totalRoomsCount,
        global_addons_count: globalAddons.length,
        total_area: `${qs.totalAreaSqFt || 0} Sq.ft`,
      },
      room_summary: roomSummaries,
      rooms,
      global_addons: globalAddons,
      costs: { room_cost: roomCost, addon_cost: addonCost, gst, grand_total: grandTotal }
    };

    // ── Build PDF ────────────────────────────────────────────────────────
    const doc = new PDFDocument({ 
      size: "A4", 
      margins: { top: MARGIN, bottom: 20, left: MARGIN, right: MARGIN }, 
      autoFirstPage: true, 
      bufferPages: true 
    });
    
    if (res) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Trendy_Interios._Quotation_${quoteNo}.pdf"`);
      doc.pipe(res);
    } else {
      // For local testing if needed
      doc.pipe(fs.createWriteStream(`Trendy_Interios._Quotation_${quoteNo}.pdf`));
    }

    doc.on("error", (err) => { if (callback) callback(err); });

    // PAGE 1: Letterhead
    drawLetterhead(doc, quotation);

    // ── PREMIUM DASHBOARD (CUSTOMER & PROJECT OVERVIEW) ──
    checkSpace(doc, 250);
    
    const dashY = doc.y + 10;
    const colWidth = (CONTENT_W / 2) - 30;
    const centerX = MARGIN + (CONTENT_W / 2);
    const leftX = MARGIN;
    const rightX = centerX + 30;
    
    const TEXT_DARK = "#1F1F1F";
    const ACCENT = "#C9A227";
    const TEXT_LIGHT = "#666666";
    const ICON_BG = "#FAFAFA";
    const ICON_BORDER = "#EBEBEB";

    // Headers
    doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(11);
    doc.text("CUSTOMER DETAILS", leftX, dashY, { characterSpacing: 1 });
    doc.text("PROJECT OVERVIEW", rightX, dashY, { characterSpacing: 1 });
    
    let currentLeftY = dashY + 35;
    let currentRightY = dashY + 35;
    const nodeHeights = [];
    
    const drawCard = (x, y, iconChar, label, value) => {
      if (x === leftX) nodeHeights.push(y);
      // Label
      doc.fillColor(TEXT_LIGHT).font("Helvetica").fontSize(8);
      doc.text(label.toUpperCase(), x, y + 6);
      
      // Value
      doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(10);
      const valStr = String(value || "N/A");
      doc.text(valStr, x, y + 18, { width: colWidth });
      
      const valHeight = doc.heightOfString(valStr, { width: colWidth });
      return y + Math.max(35, 18 + valHeight + 10);
    };
    
    // Left Column Data
    currentLeftY = drawCard(leftX, currentLeftY, "C", "Customer Name", quotation.customer.name);
    currentLeftY = drawCard(leftX, currentLeftY, "P", "Phone Number", quotation.customer.phone);
    currentLeftY = drawCard(leftX, currentLeftY, "E", "Email Address", quotation.customer.email);
    currentLeftY = drawCard(leftX, currentLeftY, "A", "Project Address", quotation.customer.address);
    
    // Right Column Data
    currentRightY = drawCard(rightX, currentRightY, "R", "Total Rooms Selected", quotation.overview.total_rooms);
    currentRightY = drawCard(rightX, currentRightY, "G", "Global Add-ons", quotation.overview.global_addons_count);
    currentRightY = drawCard(rightX, currentRightY, "A", "Total Area", quotation.overview.total_area);
    currentRightY = drawCard(rightX, currentRightY, "E", "Estimated Project Cost", fmt(quotation.costs.grand_total));
    
    const endY = Math.max(currentLeftY, currentRightY);
    
    // Center Divider
    const dividerTop = nodeHeights[0] + 12;
    const dividerBottom = nodeHeights[nodeHeights.length - 1] + 12;
    
    doc.lineWidth(0.5).strokeColor("#EAEAEA");
    doc.moveTo(centerX, dividerTop).lineTo(centerX, dividerBottom).stroke();
    
    const drawNode = (y) => {
      doc.circle(centerX, y, 4).fill(WHITE);
      doc.lineWidth(1.5).strokeColor(ACCENT);
      doc.circle(centerX, y, 4).stroke();
      doc.circle(centerX, y, 1.5).fill(ACCENT);
    };
    
    nodeHeights.forEach(y => drawNode(y + 12));
    
    doc.y = endY + 10;

    // SECTION 3: ROOM SUMMARY
    drawSectionHeader(doc, "ROOM SUMMARY");
    const summaryRows = quotation.room_summary.map(rs => [rs.room_type, rs.interiors, fmt(rs.cost)]);
    
    let totalRoomCostForSummary = quotation.room_summary.reduce((acc, curr) => acc + curr.cost, 0);

    drawDataTable(
      doc, 
      ["Room Selected", "Interiors", "Cost"], 
      summaryRows, 
      [CONTENT_W * 0.25, CONTENT_W * 0.50, CONTENT_W * 0.25],
      ["TOTAL ROOM COST", "", fmt(totalRoomCostForSummary)]
    );

    // SECTION 4: ROOM DETAILS
    Object.entries(quotation.rooms).forEach(([roomType, roomData]) => {
      roomData.rooms.forEach((r, index) => {
        checkSpace(doc, 60);
        drawSectionHeader(doc, `${roomType.toUpperCase()} : ${index + 1}`);

        // Layout Table
        const layoutRows = [
          [r.name, r.measurement, r.size, r.layout, fmt(r.cost)]
        ];
        drawDataTable(
          doc,
          ["Room Name", "Measurement", "Room Area", "Layout Selection", "Layout Cost"],
          layoutRows,
          [CONTENT_W * 0.18, CONTENT_W * 0.22, CONTENT_W * 0.13, CONTENT_W * 0.30, CONTENT_W * 0.17]
        );

        // Add-ons Table
        if (r.addons && r.addons.length > 0) {
          doc.y += 15;
          const addonRows = r.addons.map(addon => [
            r.name, r.measurement, r.size, addon.name, fmt(addon.price || 0)
          ]);
          drawDataTable(
            doc,
            ["Room Name", "Measurement", "Room Area", "Add-on Name", "Add-on Cost"],
            addonRows,
            [CONTENT_W * 0.18, CONTENT_W * 0.22, CONTENT_W * 0.13, CONTENT_W * 0.30, CONTENT_W * 0.17]
          );
        }

        // Package Components Table
        if (r.packageComponents && r.packageComponents.length > 0) {
          doc.y += 15;
          const compRows = r.packageComponents.map(comp => [
            r.name, r.measurement, r.size, comp.name, fmt(comp.price || 0)
          ]);
          drawDataTable(
            doc,
            ["Room Name", "Measurement", "Room Area", "Component Name", "Component Cost"],
            compRows,
            [CONTENT_W * 0.18, CONTENT_W * 0.22, CONTENT_W * 0.13, CONTENT_W * 0.30, CONTENT_W * 0.17]
          );
        }
      });
      
      const totalY = doc.y + 10;
      doc.rect(MARGIN, totalY, CONTENT_W, 25).fill(GOLD_LITE);
      doc.lineWidth(1).strokeColor(GOLD);
      doc.moveTo(MARGIN, totalY).lineTo(MARGIN + CONTENT_W, totalY).stroke();
      doc.moveTo(MARGIN, totalY + 25).lineTo(MARGIN + CONTENT_W, totalY + 25).stroke();
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
      doc.text(`${roomType.toUpperCase()} TOTAL`, MARGIN + 10, totalY + 8, { width: CONTENT_W * 0.7 - 20, align: "right" });
      doc.fontSize(10);
      doc.text(fmt(roomData.total), MARGIN + CONTENT_W * 0.7, totalY + 8, { width: CONTENT_W * 0.3 - 10, align: "right" });
      doc.y = totalY + 35;
    });

    // SECTION 5: GLOBAL ADD-ONS
    if (quotation.global_addons && quotation.global_addons.length > 0) {
      drawSectionHeader(doc, "GLOBAL ADD-ONS");
      const gaRows = quotation.global_addons.map(a => [
        a.size ? `${a.name} (${a.size})` : a.name,
        String(a.count || 1),
        fmt(a.totalPrice ?? ((a.price || 0) * (a.count || 1))),
      ]);
      const gaTotal = quotation.global_addons.reduce(
        (acc, curr) => acc + (curr.totalPrice ?? ((curr.price || 0) * (curr.count || 1))),
        0,
      );
      drawDataTable(
        doc,
        ["Add-on", "Qty", "Price"],
        gaRows,
        [CONTENT_W * 0.55, CONTENT_W * 0.15, CONTENT_W * 0.30],
        ["GLOBAL ADD-ONS TOTAL", "", fmt(gaTotal)]
      );
    }

    // SECTION 6: PROJECT COST SUMMARY
    renderBlock(doc, 180, () => {
      drawSectionHeader(doc, "PROJECT COST SUMMARY");

      const roomCostWithoutPackages = (quotation.costs.room_cost || 0) - (qs.globalPackageComponentsTotal || 0);
      const packageCost = qs.globalPackageComponentsTotal || 0;

      const rows = [
        ["Base Room & Layout Cost", fmt(roomCostWithoutPackages)],
      ];

      if (packageCost > 0) {
        rows.push(["Package Components Cost", fmt(packageCost)]);
      }

      rows.push(["Add-On Cost", fmt(quotation.costs.addon_cost)]);
      rows.push(["GST / Tax (18%)", fmt(quotation.costs.gst)]);

      let cy = doc.y;
      doc.rect(MARGIN, cy, CONTENT_W, 24).fill(NAVY);
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9);
      doc.text("Description", MARGIN + 10, cy + 7);
      doc.text("Amount", MARGIN + CONTENT_W - 120, cy + 7, { width: 110, align: "right" });
      cy += 24;

      rows.forEach((row, i) => {
        doc.rect(MARGIN, cy, CONTENT_W, 22).stroke();

        doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(9);
        doc.text(row[0], MARGIN + 10, cy + 6);
        doc.text(row[1], MARGIN + CONTENT_W - 120, cy + 6, { width: 110, align: "right" });

        cy += 22;
      });

      if (cy + 30 > A4_H - 60) {
        doc.addPage();
        cy = doc.y;
      }

      doc.rect(MARGIN, cy, CONTENT_W, 30).fillAndStroke(GOLD_LITE, BORDER);

      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11);
      doc.text("GRAND TOTAL", MARGIN + 10, cy + 9);
      doc.text(fmt(quotation.costs.grand_total), MARGIN + CONTENT_W - 120, cy + 9, {
        width: 110,
        align: "right"
      });

      doc.y = cy + 40;
    });

    // SECTION 7: WE ASSURE
    renderBlock(doc, 220, () => {
      drawSectionHeader(doc, "WE ASSURE");

      const assureY = doc.y;

      doc.rect(MARGIN, assureY, CONTENT_W, 178).fillAndStroke(LIGHT_BG, BORDER);
      doc.fillColor(MID_TEXT).font("Helvetica-Oblique").fontSize(8.5);
      doc.text("We assure our customers that all materials and workmanship will be delivered according to the agreed quality standards, approved specifications, and project requirements.", MARGIN + 12, assureY + 12, { width: CONTENT_W - 24, lineGap: 2 });

      doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(9);
      const points = [
        "1. Ten Years Warranty on materials and workmanship.",
        "2. This price includes manufacturing and execution process.",
        "3. Freight and installation cost may vary based on site distance.",
        "4. Trendy Interios may revise the estimation for any material cost change.",
        "5. Civil, scaffolding, electrical, plumbing, painting, and stone works are not in our scope unless mentioned in writing.",
        "6. Materials may be upgraded or modified based on customer requirements.",
        "7. Additional work beyond approved quotation scope will be charged separately.",
        "8. Advance payments are non-refundable after material procurement.",
        "9. Material rusting, corrosion, oxidation, and deterioration due to environmental factors are not covered under the assurance."
      ];
      let ptY = doc.y + 5;
      points.forEach(pt => {
        doc.circle(MARGIN + 15, ptY + 4, 2.5).fill(GOLD);
        doc.fillColor(DARK_TEXT).text(pt, MARGIN + 25, ptY, { width: CONTENT_W - 35, lineGap: 2 });
        ptY += 16;
      });
      doc.y = ptY + 10;
    });

    // SECTION 8: AUTHORIZED BY
    renderBlock(doc, 160, () => {
      const headerY = doc.y;

      // Top border
      doc.lineWidth(0.5).strokeColor(BORDER);
      doc.moveTo(MARGIN, headerY).lineTo(MARGIN + CONTENT_W, headerY).stroke();

      // "AUTHORIZED BY" centred label
      doc.fillColor(DARK_TEXT).font("Helvetica-Bold").fontSize(10);
      doc.text("AUTHORIZED BY", MARGIN, headerY + 12, {
        width: CONTENT_W,
        align: "center",
        characterSpacing: 1,
      });

      // Company name in gold
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12);
      doc.text("TRENDY INTERIOS.", MARGIN, headerY + 28, {
        width: CONTENT_W,
        align: "center",
        characterSpacing: 0.5,
      });

      // Signature lines
      const sigY      = headerY + 75;
      const lineLen   = 160;
      const leftLineX = MARGIN + 30;
      const rightLineX = MARGIN + CONTENT_W - 30 - lineLen;

      doc.lineWidth(0.8).strokeColor(DARK_TEXT);
      doc.moveTo(leftLineX, sigY).lineTo(leftLineX + lineLen, sigY).stroke();
      doc.moveTo(rightLineX, sigY).lineTo(rightLineX + lineLen, sigY).stroke();

      // Labels below lines
      doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(8.5);
      doc.text("Authorized Signature", leftLineX, sigY + 7, {
        width: lineLen,
        align: "center",
      });
      doc.text("Company Seal / Stamp", rightLineX, sigY + 7, {
        width: lineLen,
        align: "center",
      });

      // Bottom border
      const blockBottom = sigY + 32;
      doc.lineWidth(0.5).strokeColor(BORDER);
      doc.moveTo(MARGIN, blockBottom).lineTo(MARGIN + CONTENT_W, blockBottom).stroke();

      doc.y = blockBottom + 15;
    });

    // FOOTERS
    // const pagesCount = doc.bufferedPageRange().count;
    // drawFooter(doc, pagesCount);

    doc.end();

    if (callback) {
      if (res) {
        res.on('finish', () => {
          callback(null);
        });
        res.on('error', (err) => {
          callback(err);
        });
      } else {
        // wait a bit for file write stream if no res provided
        setTimeout(() => callback(null), 500);
      }
    }

  } catch (err) {
    if (callback) callback(err);
    else throw err;
  }
};

const generateQuotationPDFBuffer = async (estimator, callback) => {
  const bufferStream = new Stream.PassThrough();
  const chunks = [];
  let finished = false;

  const finalize = (error) => {
    if (finished) return;
    finished = true;
    if (callback) {
      if (error) return callback(error);
      return callback(null, Buffer.concat(chunks));
    }
  };

  bufferStream.on("data", (chunk) => {
    chunks.push(chunk);
  });

  bufferStream.on("error", finalize);
  bufferStream.on("finish", () => finalize(null));

  bufferStream.setHeader = () => {};
  bufferStream.headersSent = false;

  try {
    await generateQuotationPDF(estimator, bufferStream, finalize);
  } catch (err) {
    finalize(err);
  }
};

module.exports = { generateQuotationPDF, generateQuotationPDFBuffer };
