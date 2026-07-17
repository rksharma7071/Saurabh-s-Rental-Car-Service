import express from "express";
import Car from "../db/models/Car.js";
import Booking from "../db/models/Booking.js";
import Expense from "../db/models/Expense.js";
import { enrichBookings } from "../utils/calc.js";
import { autoCompletePastBookings } from "../utils/autoComplete.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    await autoCompletePastBookings();

    const totalCars = await Car.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: "Confirmed" });
    const pending = await Booking.countDocuments({ status: "Pending" });

    const confirmedRows = await Booking.find({ status: "Confirmed" }).lean();
    const confirmedEnriched = await enrichBookings(confirmedRows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));
    const bookedRevenue = confirmedEnriched.reduce((sum, b) => sum + b.total, 0);

    const expenseAgg = await Expense.aggregate([{ $group: { _id: null, sum: { $sum: "$amount" } } }]);
    const totalExpenses = expenseAgg[0]?.sum || 0;
    const netProfit = bookedRevenue - totalExpenses;

    const activeRows = await Booking.find({ dismissed: false }).sort({ created_at: -1, _id: -1 }).lean();
    const activeList = await enrichBookings(activeRows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));

    res.json({
      kpis: { totalCars, activeBookings, pending, bookedRevenue, totalExpenses, netProfit },
      bookings: activeList,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
