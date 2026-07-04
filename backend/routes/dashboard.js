import express from "express";
import Car from "../db/models/Car.js";
import Booking from "../db/models/Booking.js";
import { enrichBookings } from "../utils/calc.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const totalCars = await Car.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: "Confirmed" });
    const pending = await Booking.countDocuments({ status: "Pending" });

    const confirmedRows = await Booking.find({ status: "Confirmed" }).lean();
    const confirmedEnriched = await enrichBookings(confirmedRows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));
    const bookedRevenue = confirmedEnriched.reduce((sum, b) => sum + b.total, 0);

    const activeRows = await Booking.find({ dismissed: false }).sort({ created_at: -1, _id: -1 }).lean();
    const activeList = await enrichBookings(activeRows.map((r) => { const { _id, ...rest } = r; return { ...rest, id: _id }; }));

    res.json({
      kpis: { totalCars, activeBookings, pending, bookedRevenue },
      bookings: activeList,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
