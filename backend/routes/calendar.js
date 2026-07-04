import express from "express";
import Car from "../db/models/Car.js";
import Booking from "../db/models/Booking.js";

const router = express.Router();

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

router.get("/", async (req, res, next) => {
  try {
    const start = req.query.start || isoDate(new Date());
    const numDays = parseInt(req.query.days, 10) || 15;

    const days = [];
    const startDate = new Date(start + "T00:00:00");
    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(isoDate(d));
    }
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];

    const cars = await Car.find().sort({ _id: 1 }).lean();

    const grid = await Promise.all(
      cars.map(async (car) => {
        const bookings = await Booking.find({
          reg_no: car.reg_no,
          status: "Confirmed",
          from_date: { $lte: rangeEnd },
          to_date: { $gte: rangeStart },
        })
          .select("from_date to_date")
          .lean();

        const bookedSet = new Set();
        for (const b of bookings) {
          const f = new Date(b.from_date + "T00:00:00");
          const t = new Date(b.to_date + "T00:00:00");
          for (let d = new Date(f); d <= t; d.setDate(d.getDate() + 1)) {
            bookedSet.add(isoDate(d));
          }
        }
        return {
          id: car._id,
          reg_no: car.reg_no,
          model: car.model,
          type: car.type,
          status: car.status,
          booked: days.map((d) => bookedSet.has(d)),
        };
      })
    );

    res.json({ days, cars: grid });
  } catch (e) {
    next(e);
  }
});

export default router;
