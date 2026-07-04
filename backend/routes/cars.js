import express from "express";
import Car from "../db/models/Car.js";
import Booking from "../db/models/Booking.js";
import { nextId } from "../utils/calc.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const cars = await Car.find().sort({ _id: 1 }).lean();
    res.json(cars.map((c) => ({ ...c, id: c._id, _id: undefined })));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).lean();
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json({ ...car, id: car._id, _id: undefined });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { reg_no, model, type, rate, status } = req.body;
    if (!reg_no || !model || !type || !rate) {
      return res.status(400).json({ error: "reg_no, model, type, rate are required" });
    }
    const id = await nextId(Car, "C");
    const car = await Car.create({ _id: id, reg_no, model, type, rate, status: status || "Active" });
    res.status(201).json(car.toJSON());
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: "Registration number already exists" });
    }
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await Car.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Car not found" });

    const { reg_no, model, type, rate, status } = req.body;
    existing.reg_no = reg_no ?? existing.reg_no;
    existing.model = model ?? existing.model;
    existing.type = type ?? existing.type;
    existing.rate = rate ?? existing.rate;
    existing.status = status ?? existing.status;

    await existing.save();
    res.json(existing.toJSON());
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: "Registration number already exists" });
    }
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await Car.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Car not found" });

    const inUse = await Booking.countDocuments({ reg_no: existing.reg_no });
    if (inUse > 0) {
      return res.status(400).json({
        error: `Cannot delete — ${inUse} booking(s) reference this car. Set status to Inactive instead.`,
      });
    }
    await Car.deleteOne({ _id: req.params.id });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;
