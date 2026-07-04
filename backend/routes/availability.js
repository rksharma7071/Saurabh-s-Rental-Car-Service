import express from "express";
import Booking from "../db/models/Booking.js";
import { enrichBookings } from "../utils/calc.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { reg_no, from, to } = req.query;
    if (!reg_no || !from || !to) {
      return res.status(400).json({ error: "reg_no, from, and to query params are required" });
    }
    if (new Date(to) < new Date(from)) {
      return res.status(400).json({ error: "'to' date cannot be before 'from' date" });
    }

    const rows = await Booking.find({
      reg_no,
      status: "Confirmed",
      from_date: { $lte: to },
      to_date: { $gte: from },
    })
      .sort({ from_date: 1 })
      .lean();

    const conflicts = await enrichBookings(rows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));
    res.json({ available: conflicts.length === 0, conflicts });
  } catch (e) {
    next(e);
  }
});

export default router;
