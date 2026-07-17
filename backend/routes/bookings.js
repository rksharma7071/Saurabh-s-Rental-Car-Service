import express from "express";
import Booking from "../db/models/Booking.js";
import Car from "../db/models/Car.js";
import { nextId, enrichBookings, enrichBooking } from "../utils/calc.js";
import { autoCompletePastBookings } from "../utils/autoComplete.js";

const router = express.Router();

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Finds a CONFIRMED booking for the same car whose date range overlaps [from_date, to_date].
 *  excludeId lets an update ignore the booking's own record when checking itself. */
async function findConflict(reg_no, from_date, to_date, excludeId) {
  const query = {
    reg_no,
    status: "Confirmed",
    from_date: { $lte: to_date },
    to_date: { $gte: from_date },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Booking.findOne(query).lean();
}

// Looks up how many past bookings share this phone number, so the booking form can show
// a "booked with us N times before" hint. Must be defined before "/:id" so Express doesn't
// treat "lookup" as an :id value.
router.get("/lookup", async (req, res, next) => {
  try {
    const { phone, exclude } = req.query;
    if (!phone || phone.trim().length < 5) {
      return res.json({ count: 0 });
    }
    const query = { phone: phone.trim() };
    if (exclude) query._id = { $ne: exclude };
    const matches = await Booking.find(query).sort({ created_at: -1 }).lean();
    if (matches.length === 0) return res.json({ count: 0 });
    res.json({
      count: matches.length,
      lastCustomerName: matches[0].customer,
      lastBookingDate: matches[0].from_date,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    await autoCompletePastBookings();

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
    const { reg_no, customer, phone, from_date, to_date, advance, status, notes, custom_price } = req.body;
    if (!reg_no || !customer || !phone || !from_date || !to_date) {
      return res.status(400).json({ error: "reg_no, customer, phone, from_date, to_date are required" });
    }
    const car = await Car.findOne({ reg_no }).lean();
    if (!car) return res.status(400).json({ error: "Unknown car registration number" });
    if (new Date(to_date) < new Date(from_date)) {
      return res.status(400).json({ error: "To date cannot be before From date" });
    }

    const conflict = await findConflict(reg_no, from_date, to_date);
    if (conflict) {
      return res.status(400).json({
        error: `Can't book — this car is already booked for ${conflict.customer} (${fmtDate(conflict.from_date)} to ${fmtDate(conflict.to_date)}). Please choose a different car or date.`,
      });
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
      custom_price: custom_price || 0,
      notes: notes || "",
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

    const { reg_no, customer, phone, from_date, to_date, advance, status, dismissed, notes, custom_price } = req.body;
    const mergedFrom = from_date ?? existing.from_date;
    const mergedTo = to_date ?? existing.to_date;
    const mergedRegNo = reg_no ?? existing.reg_no;

    if (new Date(mergedTo) < new Date(mergedFrom)) {
      return res.status(400).json({ error: "To date cannot be before From date" });
    }

    const conflict = await findConflict(mergedRegNo, mergedFrom, mergedTo, existing._id);
    if (conflict) {
      return res.status(400).json({
        error: `Can't book — this car is already booked for ${conflict.customer} (${fmtDate(conflict.from_date)} to ${fmtDate(conflict.to_date)}). Please choose a different car or date.`,
      });
    }

    existing.reg_no = mergedRegNo;
    existing.customer = customer ?? existing.customer;
    existing.phone = phone ?? existing.phone;
    existing.from_date = mergedFrom;
    existing.to_date = mergedTo;
    existing.advance = advance ?? existing.advance;
    existing.status = status ?? existing.status;
    existing.custom_price = custom_price ?? existing.custom_price;
    existing.notes = notes ?? existing.notes;
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
    ];

    if (b.notes && b.notes.trim()) {
      lines.push("", `Trip Notes:  ${b.notes.trim()}`);
    }

    lines.push("", "Please bring a valid ID and licence at pickup. Thank you!");

    res.json({ message: lines.join("\n"), phone: b.phone });
  } catch (e) {
    next(e);
  }
});

export default router;
