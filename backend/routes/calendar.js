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
        const bookingRows = await Booking.find({
          reg_no: car.reg_no,
          status: "Confirmed",
          from_date: { $lte: rangeEnd },
          to_date: { $gte: rangeStart },
        })
          .select("customer phone from_date to_date")
          .lean();

        return {
          id: car._id,
          reg_no: car.reg_no,
          model: car.model,
          type: car.type,
          status: car.status,
          bookings: bookingRows.map((b) => ({
            id: b._id,
            customer: b.customer,
            phone: b.phone,
            from_date: b.from_date,
            to_date: b.to_date,
          })),
        };
      })
    );

    res.json({ days, rangeStart, rangeEnd, cars: grid });
  } catch (e) {
    next(e);
  }
});

export default router;
