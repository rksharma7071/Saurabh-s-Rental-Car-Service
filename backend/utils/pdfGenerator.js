import PDFDocument from "pdfkit";

const INK = "#0F172A";
const INK_SOFT = "#1E293B";
const MUTED = "#64748B";
const LINE = "#CBD5E1";
const AMBER = "#F59E0B";

const BUSINESS_NAME = "Saurabh's Rental Car Service";
const BUSINESS_LOCATION = "Lucknow, Uttar Pradesh";
const BUSINESS_PHONE = "+91 98389 22420";
const BUSINESS_EMAIL = "mailsachingupta20@gmail.com";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtRs(n) {
  return "Rs " + Number(n).toLocaleString("en-IN");
}

/** Returns a Buffer containing the generated receipt PDF for a booking. */
export function generateReceiptPdf(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(BUSINESS_NAME, 50, 50);
    doc.fillColor(AMBER).font("Helvetica-Bold").fontSize(20).text("RECEIPT", 0, 50, { align: "right" });

    doc.fillColor(MUTED).font("Helvetica").fontSize(10)
      .text(`${BUSINESS_NAME}  |  ${BUSINESS_LOCATION}`, 50, 78);
    doc.text(`Phone: ${BUSINESS_PHONE}  |  Email: ${BUSINESS_EMAIL}`, 50, 92);

    doc.moveTo(50, 112).lineTo(545, 112).strokeColor(LINE).stroke();

    // Bill To / Vehicle
    let y = 130;
    doc.fillColor(MUTED).fontSize(9).text("BILL TO", 50, y);
    doc.text("VEHICLE", 320, y);

    y += 16;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(booking.customer, 50, y);
    doc.text(booking.reg_no, 320, y);

    y += 20;
    doc.fillColor(INK_SOFT).font("Helvetica").fontSize(10).text(booking.phone, 50, y);
    doc.text(`${booking.model} | ${booking.type}`, 320, y);

    y += 24;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();

    // Booking period
    y += 18;
    doc.fillColor(MUTED).fontSize(9).text("BOOKING PERIOD", 50, y);

    y += 16;
    const cols = [50, 180, 300, 380];
    const labels = ["From", "To", "Days", "Daily Rate"];
    const values = [fmtDate(booking.from_date), fmtDate(booking.to_date), String(booking.days), fmtRs(booking.rate)];
    labels.forEach((l, i) => doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(l, cols[i], y));
    y += 14;
    values.forEach((v, i) => doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(v, cols[i], y));

    y += 30;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();

    // Charges
    y += 18;
    doc.fillColor(MUTED).fontSize(9).text("CHARGES", 50, y);

    y += 18;
    doc.fillColor(INK_SOFT).font("Helvetica").fontSize(11)
      .text(`${booking.days} days x ${fmtRs(booking.rate)}`, 50, y);
    doc.font("Helvetica-Bold").fontSize(12).text(fmtRs(booking.total), 0, y, { align: "right", width: 545 });

    y += 22;
    doc.fillColor(INK_SOFT).font("Helvetica").fontSize(10).text("Total", 0, y, { align: "right", width: 480 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(fmtRs(booking.total), 0, y, { align: "right", width: 545 });

    y += 18;
    doc.fillColor(INK_SOFT).font("Helvetica").fontSize(10).text("Advance Paid", 0, y, { align: "right", width: 480 });
    doc.font("Helvetica").fontSize(11).text(fmtRs(booking.advance), 0, y, { align: "right", width: 545 });

    y += 24;
    doc.rect(50, y - 6, 495, 32).fill(INK_SOFT);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12).text("BALANCE DUE", 60, y + 2);
    doc.fontSize(14).text(fmtRs(booking.balance), 0, y + 1, { align: "right", width: 535 });

    // Signatures
    y += 80;
    doc.fillColor(MUTED).fontSize(10).text("_________________________", 50, y);
    doc.text("_________________________", 320, y);
    y += 14;
    doc.fontSize(9).text("Customer Signature", 50, y);
    doc.text("Authorised Signatory", 320, y);

    // Footer
    y += 40;
    doc.fillColor(INK_SOFT).font("Helvetica-Oblique").fontSize(12)
      .text(`Thank you for choosing ${BUSINESS_NAME}!`, 50, y, { align: "center", width: 495 });

    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
      .text(`Booking ID: ${booking.id}`, 50, 760, { align: "center", width: 495 });

    doc.end();
  });
}
