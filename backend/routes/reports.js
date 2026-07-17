import express from "express";
import Car from "../db/models/Car.js";
import Booking from "../db/models/Booking.js";
import Expense from "../db/models/Expense.js";
import { enrichBookings } from "../utils/calc.js";

const router = express.Router();

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Per-car performance over a trailing window (default 30 days): bookings, days booked,
 *  utilization %, revenue, expenses, and net profit — sorted by profit descending so it's
 *  immediately obvious which cars are earning the most vs. sitting idle. */
router.get("/fleet-performance", async (req, res, next) => {
  try {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const windowStart = daysAgoISO(days);

    const cars = await Car.find().lean();
    const results = [];

    for (const car of cars) {
      const bookingRows = await Booking.find({
        reg_no: car.reg_no,
        status: "Confirmed",
        from_date: { $gte: windowStart },
      }).lean();
      const enriched = await enrichBookings(
        bookingRows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; })
      );
      const bookedDays = enriched.reduce((sum, b) => sum + b.days, 0);
      const revenue = enriched.reduce((sum, b) => sum + b.total, 0);

      const expenseAgg = await Expense.aggregate([
        { $match: { reg_no: car.reg_no, date: { $gte: windowStart } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]);
      const expenses = expenseAgg[0]?.sum || 0;

      results.push({
        reg_no: car.reg_no,
        model: car.model,
        type: car.type,
        status: car.status,
        bookingsCount: enriched.length,
        bookedDays,
        utilization: Math.min(100, Math.round((bookedDays / days) * 100)),
        revenue,
        expenses,
        profit: revenue - expenses,
      });
    }

    results.sort((a, b) => b.profit - a.profit);
    res.json({ days, cars: results });
  } catch (e) {
    next(e);
  }
});

export default router;
