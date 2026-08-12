const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Stream = require("stream");
const NAVY = "#1a1a1a"; // Changed from navy to premium black
const GOLD = "#d4af37"; // Premium metallic gold
const WHITE = "#ffffff";
const ZEBRA = "#f0f4ff";
const LIGHT_BG = "#f7f9fc";
const DARK_TEXT = "#222222";
const MID_TEXT = "#555555";
const BORDER = "#d0d7e3";
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
function drawRoomHeader(doc, roomTitle, sizeCategory, dimension, totalCost, isBedroom = false) {
 checkSpace(doc, 36);
 const y = doc.y;
 doc.rect(MARGIN, y, CONTENT_W, 26).fill(NAVY);
 doc.rect(MARGIN, y, 4, 26).fill(GOLD);
 // Left & Middle Info
 const startX = MARGIN + 12;
 doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9);
 doc.text(roomTitle, startX, y + 8, { continued: true });
 doc.fillColor("#cccccc").font("Helvetica").fontSize(8.5).text(" Size: ", { continued: true });
 doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8.5).text(`${sizeCategory} `, { continued: true });
 doc.fillColor("#cccccc").font("Helvetica").fontSize(8.5).text("Dimension: ", { continued: true });
 doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(8.5).text(dimension);
 // Right Total Cost
 const costLabel = isBedroom ? "TOTAL BEDROOM COST" : "TOTAL COST";
 doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9);
 doc.text(`${costLabel}: ${fmt(totalCost)}`, MARGIN, y + 8, { width: CONTENT_W - 12, align: "right" });
 doc.y = y + 26 + 8;
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
 const height = 164;
 
 // Gold bounding box
 doc.lineWidth(1).strokeColor(GOLD);
 doc.rect(MARGIN, startY, CONTENT_W, height).stroke();
 // Padding inside box
 const padX = 16;
 const padY = 12;
 const logoH = 82;
 const logoW = 160;
 
 // Logo Block (Large, prominent, and crystal clear)
 const localLogo = path.join(__dirname, "logo.png");
 const localLogoJpg = path.join(__dirname, "logo.jpg");
 const frontendLogo = path.join(__dirname, "..", "..", "client", "public", "images", "logo.png");
 
 const logoToUse = [localLogo, localLogoJpg, frontendLogo].find(fs.existsSync);
 
 if (logoToUse) {
 doc.image(logoToUse, MARGIN + padX, startY + padY, { fit: [logoW, logoH], align: 'left', valign: 'center' });
 } else {
 doc.rect(MARGIN + padX, startY + padY, logoW, logoH).fill("#1a1a1a");
 doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(36);
 doc.text("T", MARGIN + padX, startY + padY + 22, { width: logoW, align: "center" });
 }
 // "INTERIOR QUOTATION" title (Primary visual element, vertically balanced)
 doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(20);
 doc.text("INTERIOR QUOTATION", MARGIN, startY + padY + 28, { width: CONTENT_W - padX, align: "right", characterSpacing: 1 });
 // Subtle clean divider line
 const dividerY = startY + padY + logoH + 10;
 doc.lineWidth(0.6).strokeColor("#cbd5e1");
 doc.moveTo(MARGIN + padX, dividerY).lineTo(MARGIN + CONTENT_W - padX, dividerY).stroke();
 // Bottom section: Address (Left) & Contact Details (Right) - Parallel Layout
 const bottomY = dividerY + 10;
 const rightColWidth = (CONTENT_W - 2 * padX) * 0.52;
 const rightX = MARGIN + CONTENT_W - padX - rightColWidth;
 const CHARCOAL = "#2d3748";
 // LEFT: Company Address (Clearer readability & dark charcoal tone)
 doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(10);
 doc.text("Trendy Interios", MARGIN + padX, bottomY);
 
 doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
 doc.text("138, Muthugoundampalayam, Sathy-Erode Road,", MARGIN + padX, bottomY + 13);
 doc.text("Opp TNK School, Kavindapadi, Erode - 638 455", MARGIN + padX, bottomY + 25);
 // RIGHT: Contact Details & Date (Neatly aligned and visible)
 doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(8.5);
 doc.text(`Date: ${quotation.date}`, rightX, bottomY, { width: rightColWidth, align: "right" });
 doc.fillColor(CHARCOAL).font("Helvetica").fontSize(8.5);
 doc.text("Mobile: +91 99652 99777 | +91 90803 98889", rightX, bottomY + 13, { width: rightColWidth, align: "right" });
 doc.text("Email: trendyinterios@gmail.com | info@trendyinterios.com", rightX, bottomY + 25, { width: rightColWidth, align: "right" });
 doc.y = startY + height + 18;
}
function drawFooter(doc, pagesCount) {
 for (let i = 1; i <= pagesCount; i++) {
 doc.switchToPage(i - 1);
 const y = A4_H - 30; // 10mm from bottom
 doc.lineWidth(0.5).strokeColor(NAVY);
 doc.moveTo(MARGIN, y - 5).lineTo(MARGIN + CONTENT_W, y - 5).stroke();
 doc.fillColor(MID_TEXT).font("Helvetica").fontSize(7.5);
 doc.text("TRENDY INTERIOS | +91 99652 99777 | trendyinterios@gmail.com", MARGIN, y, { lineBreak: false });
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
 
 const getRoomOrderPriority = (item) => {
 const name = String(item.roomName || item.label || "").toLowerCase().trim();
 if (name.includes("kitchen")) return 1;
 if (name.includes("hall") || name.includes("living")) return 3;
 if (name.includes("bedroom") || name.includes("bed room")) return 4;
 return 2; // Other rooms (e.g. Pooja Room, Dining, etc.)
 };
 const roomLineItems = lineItems
 .filter(it => it.roomId !== "global-addons" && it.roomId !== "extra-addons")
 .sort((a, b) => {
 const pA = getRoomOrderPriority(a);
 const pB = getRoomOrderPriority(b);
 if (pA !== pB) return pA - pB;
 return (a.label || a.roomId || "").localeCompare(b.label || b.roomId || "", undefined, { numeric: true });
 });
 const globalAddonsItem = lineItems.find(it => it.roomId === "global-addons" || it.roomId === "extra-addons");
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
 const gst = 0;
 const grandTotal = qs.grandTotal || qs.estimatedAmount || 0;
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
 res.setHeader("Content-Disposition", `attachment; filename="Trendy_Interios_Quotation_${quoteNo}.pdf"`);
 doc.pipe(res);
 } else {
 // For local testing if needed
 doc.pipe(fs.createWriteStream(`Trendy_Interios_Quotation_${quoteNo}.pdf`));
 }
 doc.on("error", (err) => { if (callback) callback(err); });
 // PAGE 1: Letterhead
 drawLetterhead(doc, quotation);
 // ── PREMIUM DASHBOARD (CUSTOMER DETAILS) ──
 checkSpace(doc, 120);
 
 let dashY = doc.y + 10;
 const TEXT_DARK = "#1F1F1F";
 const TEXT_LIGHT = "#666666";
 // --- 1. CUSTOMER DETAILS ---
 doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(11);
 doc.text("CUSTOMER DETAILS", MARGIN, dashY, { characterSpacing: 1 });
 
 dashY += 20;
 doc.lineWidth(1).strokeColor(TEXT_DARK);
 doc.moveTo(MARGIN, dashY).lineTo(MARGIN + CONTENT_W, dashY).stroke();
 dashY += 12;
 // Row 1: Name & Phone
 const col1X = MARGIN;
 const col2X = MARGIN + (CONTENT_W / 2);
 const halfWidth = (CONTENT_W / 2) - 10;
 const drawField = (x, y, label, value) => {
 doc.fillColor(TEXT_LIGHT).font("Helvetica").fontSize(8);
 doc.text(label.toUpperCase(), x, y);
 doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(9.5);
 const valStr = String(value || "N/A");
 doc.text(valStr, x, y + 11, { width: halfWidth });
 const valHeight = doc.heightOfString(valStr, { width: halfWidth });
 return 11 + valHeight;
 };
 let h1 = drawField(col1X, dashY, "Customer Name", quotation.customer.name);
 let h2 = drawField(col2X, dashY, "Phone Number", quotation.customer.phone);
 dashY += Math.max(h1, h2) + 20;
 doc.y = dashY;
 // SECTION 4: ROOM DETAILS & EXTRA ADD-ONS
 const roomTypeCounters = {};
 const renderRoomItem = (item) => {
 const type = item.roomName || "Room";
 roomTypeCounters[type] = (roomTypeCounters[type] || 0) + 1;
 const roomNum = roomTypeCounters[type];
 const roomTitle = `${type.toUpperCase()} : ${roomNum}`;
 const itemName = `${type} ${roomNum}`;
 const isBedroom = type.toLowerCase().includes("bedroom");
 let len = item.length;
 let wid = item.width;
 let hei = item.height;
 
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
 let rawSize = item.sizeCategory || (dimensions && dimensions[item.roomId] && dimensions[item.roomId].sizeCategory) || "";
 if (!rawSize) {
 const area = item.areaSqFt || (len * wid) || 0;
 if (area > 180) rawSize = "LARGE";
 else if (area > 120) rawSize = "MEDIUM";
 else if (area > 0) rawSize = "SMALL";
 else rawSize = "MEDIUM";
 }
 let sizeCategory = rawSize.toUpperCase();
 if (sizeCategory === "LOW") sizeCategory = "SMALL";
 if (sizeCategory === "MID") sizeCategory = "MEDIUM";
 const dimension = (len && wid) ? `${len}' × ${wid}'` : "10' × 12'";
 const sizeString = (len && wid) ? (hei ? `L:${len}' W:${wid}' H:${hei}'` : `L:${len}' W:${wid}'`) : "L:10' W:12'";
 const roomTotal = item.estimatedCost || 0;
 checkSpace(doc, 60);
 drawRoomHeader(doc, roomTitle, sizeCategory, dimension, roomTotal, isBedroom);
 if (isBedroom) {
 // 1. BEDROOM SUMMARY ROW DIRECTLY BELOW HEADER
 const summaryRows = [
 [itemName, sizeString, fmt(roomTotal)]
 ];
 drawDataTable(
 doc,
 ["Item Name", "Size", "Total Cost"],
 summaryRows,
 [CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30]
 );
 // 2. COMPONENT TABLE DIRECTLY BELOW SUMMARY (Replaces Add-on Items table)
 const selectedComponents = (item.packageComponents || []).filter(c => c.isSelected);
 const compList = selectedComponents.length > 0 
 ? selectedComponents.map(c => ({ name: c.name, price: c.price || 0 }))
 : (item.addonDetails && item.addonDetails.length > 0
 ? item.addonDetails.map(a => ({ name: a.name, price: a.price || 0 }))
 : []);
 if (compList.length > 0) {
 doc.y += 6;
 const compRows = compList.map(comp => [
 comp.name, sizeString, fmt(comp.price || 0)
 ]);
 drawDataTable(
 doc,
 ["Item Name", "Size", "Item Cost"],
 compRows,
 [CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30]
 );
 }
 } else {
 // KITCHEN & OTHER ROOMS
 const hasLayout = Boolean(item.layout && item.layout !== "Standard" && item.layout !== "");
 let drewAnyTable = false;
 // 1. Layout Table (only when layout was actually selected)
 if (hasLayout) {
 drewAnyTable = true;
 const layoutCostTotal = (item.layoutCost || 0) + (item.layoutMaterialsCost || 0) + (item.baseCost || 0);
 const layoutRows = [
 [itemName, sizeString, item.layout, fmt(layoutCostTotal)]
 ];
 drawDataTable(
 doc,
 ["Item Name", "Size", "Layout Selection", "Layout Cost"],
 layoutRows,
 [CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.30, CONTENT_W * 0.20]
 );
 }
 // 2. Add-ons Table
 if (item.addonDetails && item.addonDetails.length > 0) {
 if (drewAnyTable) doc.y += 6;
 drewAnyTable = true;
 const addonRows = item.addonDetails.map(addon => [
 itemName, sizeString, addon.name, fmt(addon.price || 0)
 ]);
 drawDataTable(
 doc,
 ["Item Name", "Size", "Add-on Items", "Add-on Cost"],
 addonRows,
 [CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.30, CONTENT_W * 0.20]
 );
 }
 // 3. Package Components Table
 const selectedComponents = (item.packageComponents || []).filter(c => c.isSelected);
 if (selectedComponents.length > 0) {
 if (drewAnyTable) doc.y += 6;
 drewAnyTable = true;
 const compRows = selectedComponents.map(comp => [
 comp.name, sizeString, fmt(comp.price || 0)
 ]);
 drawDataTable(
 doc,
 ["Item Name", "Size", "Item Cost"],
 compRows,
 [CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30]
 );
 }
 // 4. Fallback if no layout, no addons, no package components
 if (!drewAnyTable) {
 const baseRows = [
 [itemName, sizeString, fmt(roomTotal)]
 ];
 drawDataTable(
 doc,
 ["Item Name", "Size", "Total Cost"],
 baseRows,
 [CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30]
 );
 }
 }
 doc.y += 15;
 };
 // SECTION 4: ROOM DETAILS (Kitchen -> Room -> Hall -> Bedroom)
 roomLineItems.forEach(renderRoomItem);
 // SECTION 5: EXTRA ADD-ONS
 if (quotation.global_addons && quotation.global_addons.length > 0) {
 drawSectionHeader(doc, "EXTRA ADD-ONS");
 const gaRows = quotation.global_addons.map(a => [a.name, "1", fmt(a.price)]);
 const gaTotal = quotation.global_addons.reduce((acc, curr) => acc + curr.price, 0);
 drawDataTable(
 doc,
 ["Item Name", "Qty", "Price"],
 gaRows,
 [CONTENT_W * 0.55, CONTENT_W * 0.15, CONTENT_W * 0.30],
 ["EXTRA ADD-ONS TOTAL", "", fmt(gaTotal)]
 );
 doc.y += 15;
 }
 // SECTION 7: WE ASSURE
 renderBlock(doc, 220, () => {
 drawSectionHeader(doc, "WE ASSURE");
 const assureY = doc.y;
 doc.rect(MARGIN, assureY, CONTENT_W, 115).fillAndStroke(LIGHT_BG, BORDER);
 doc.fillColor(MID_TEXT).font("Helvetica-Oblique").fontSize(8.5);
 doc.text("We assure our customers that all materials and workmanship will be delivered according to the agreed quality standards, approved specifications, and project requirements.", MARGIN + 12, assureY + 12, { width: CONTENT_W - 24, lineGap: 2 });
 doc.fillColor(DARK_TEXT).font("Helvetica").fontSize(9);
 const points = [
 "1 year free service and lifetime service support.",
 "10 years replacement warranty on plywood, laminate, and hinges.",
 "Materials can be upgraded or modified as per your choice.",
 "The final quotation will be submitted after our detailed discussion and approval."
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
 renderBlock(doc, 70, () => {
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
 doc.text("TRENDY INTERIOS", MARGIN, headerY + 28, {
 width: CONTENT_W,
 align: "center",
 characterSpacing: 0.5,
 });
 // Bottom border
 const blockBottom = headerY + 48;
 doc.lineWidth(0.5).strokeColor(BORDER);
 doc.moveTo(MARGIN, blockBottom).lineTo(MARGIN + CONTENT_W, blockBottom).stroke();
 doc.y = blockBottom + 15;
 });
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