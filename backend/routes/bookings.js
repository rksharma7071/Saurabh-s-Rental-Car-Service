import express from "express";
import Booking from "../db/models/Booking.js";
import Car from "../db/models/Car.js";
import { nextId, enrichBookings, enrichBooking } from "../utils/calc.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { customer: { $regex: search, $options: "i" } },
        { reg_no: { $regex: search, $options: "i" } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const rows = await Booking.find(query).sort({ created_at: -1, _id: -1 }).skip(skip).limit(limitNum).lean();
    
    const data = await enrichBookings(rows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));
    
    res.json({
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const row = await Booking.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ error: "Booking not found" });
    res.json(await enrichBooking((({ _id, ...rest }) => ({ ...rest, id: _id }))(row)));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { reg_no, customer, phone, from_date, to_date, advance, status } = req.body;
    if (!reg_no || !customer || !phone || !from_date || !to_date) {
      return res.status(400).json({ error: "reg_no, customer, phone, from_date, to_date are required" });
    }
    const car = await Car.findOne({ reg_no }).lean();
    if (!car) return res.status(400).json({ error: "Unknown car registration number" });
    if (new Date(to_date) < new Date(from_date)) {
      return res.status(400).json({ error: "To date cannot be before From date" });
    }

    const id = await nextId(Booking, "B");
    const booking = await Booking.create({
      _id: id,
      reg_no,
      customer,
      phone,
      from_date,
      to_date,
      advance: advance || 0,
      status: status || "Pending",
      dismissed: false,
    });

    res.status(201).json(await enrichBooking(booking.toJSON()));
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Booking not found" });

    const { reg_no, customer, phone, from_date, to_date, advance, status, dismissed } = req.body;
    const mergedFrom = from_date ?? existing.from_date;
    const mergedTo = to_date ?? existing.to_date;

    if (new Date(mergedTo) < new Date(mergedFrom)) {
      return res.status(400).json({ error: "To date cannot be before From date" });
    }

    existing.reg_no = reg_no ?? existing.reg_no;
    existing.customer = customer ?? existing.customer;
    existing.phone = phone ?? existing.phone;
    existing.from_date = mergedFrom;
    existing.to_date = mergedTo;
    existing.advance = advance ?? existing.advance;
    existing.status = status ?? existing.status;
    existing.dismissed = dismissed === undefined ? existing.dismissed : !!dismissed;

    await existing.save();
    res.json(await enrichBooking(existing.toJSON()));
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/dismiss", async (req, res, next) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Booking not found" });
    existing.dismissed = !!req.body.dismissed;
    await existing.save();
    res.json(await enrichBooking(existing.toJSON()));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await Booking.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Booking not found" });
    await Booking.deleteOne({ _id: req.params.id });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

/** Plain-text WhatsApp message for a booking, mirroring the Excel "Send Message" sheet. */
router.get("/:id/message", async (req, res, next) => {
  try {
    const row = await Booking.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ error: "Booking not found" });
    const b = await enrichBooking((({ _id, ...rest }) => ({ ...rest, id: _id }))(row));
    const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const lines = [
      `Hi ${b.customer}, your car booking is confirmed!`,
      "",
      `Booking ID  :  ${b.id}`,
      `Car           :  ${b.reg_no}`,
      `From        :  ${fmtDate(b.from_date)}`,
      `To           :  ${fmtDate(b.to_date)}`,
      `Days        :  ${b.days}`,
      `Total        :  Rs. ${b.total.toLocaleString("en-IN")}`,
      `Advance   :  Rs. ${b.advance.toLocaleString("en-IN")}`,
      `Balance Due:  Rs. ${b.balance.toLocaleString("en-IN")}`,
      "",
      "Please bring a valid ID and licence at pickup. Thank you!",
    ];
    res.json({ message: lines.join("\n"), phone: b.phone });
  } catch (e) {
    next(e);
  }
});

export default router;
