import express from "express";
import Booking from "../db/models/Booking.js";
import Car from "../db/models/Car.js";
import { enrichBooking } from "../utils/calc.js";
import { generateReceiptPdf } from "../utils/pdfGenerator.js";
import { sendReceiptEmail } from "../utils/mailer.js";

const router = express.Router();

async function getFullBooking(id) {
  const row = await Booking.findById(id).lean();
  if (!row) return null;
  const booking = await enrichBooking((({ _id, ...rest }) => ({ ...rest, id: _id }))(row));
  const car = await Car.findOne({ reg_no: booking.reg_no }).select("model type").lean();
  return { ...booking, model: car?.model || "", type: car?.type || "" };
}

router.get("/:id", async (req, res, next) => {
  try {
    const booking = await getFullBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const booking = await getFullBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    const pdfBuffer = await generateReceiptPdf(booking);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt-${booking.id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: "Failed to generate PDF: " + e.message });
  }
});

router.post("/:id/email", async (req, res) => {
  try {
    const booking = await getFullBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const pdfBuffer = await generateReceiptPdf(booking);
    const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const text = [
      `Dear ${booking.customer},`,
      "",
      "Please find your booking receipt attached.",
      "",
      `Booking ID: ${booking.id}`,
      `Car: ${booking.reg_no} (${booking.model})`,
      `From: ${fmtDate(booking.from_date)}`,
      `To: ${fmtDate(booking.to_date)}`,
      `Days: ${booking.days}`,
      `Total: Rs ${booking.total.toLocaleString("en-IN")}`,
      `Advance: Rs ${booking.advance.toLocaleString("en-IN")}`,
      `Balance Due: Rs ${booking.balance.toLocaleString("en-IN")}`,
      "",
      "Thank you!",
      "Saurabh's Rental Car Service",
      "+91 98389 22420",
    ].join("\n");

    await sendReceiptEmail({
      to: email,
      subject: `Receipt from Saurabh's Rental Car Service - ${booking.id}`,
      text,
      pdfBuffer,
      pdfFilename: `Receipt-${booking.id}.pdf`,
    });
    res.json({ sent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
