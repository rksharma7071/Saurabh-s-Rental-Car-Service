import express from "express";
import Expense, { EXPENSE_CATEGORIES } from "../db/models/Expense.js";
import { nextId } from "../utils/calc.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { reg_no, category, from, to, page = 1, limit = 20 } = req.query;
    const query = {};
    if (reg_no) query.reg_no = reg_no;
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Expense.countDocuments(query);
    const rows = await Expense.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean();
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);

    res.json({
      data: rows.map((e) => ({ ...e, id: e._id, _id: undefined })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      totalAmount: totalAmount[0]?.sum || 0,
      categories: EXPENSE_CATEGORIES,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { reg_no, category, amount, date, notes } = req.body;
    if (!reg_no || !category || !amount || !date) {
      return res.status(400).json({ error: "reg_no, category, amount, date are required" });
    }
    if (!EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${EXPENSE_CATEGORIES.join(", ")}` });
    }
    const id = await nextId(Expense, "E");
    const expense = await Expense.create({ _id: id, reg_no, category, amount, date, notes: notes || "" });
    res.status(201).json(expense.toJSON());
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await Expense.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Expense not found" });

    const { reg_no, category, amount, date, notes } = req.body;
    if (category && !EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${EXPENSE_CATEGORIES.join(", ")}` });
    }
    existing.reg_no = reg_no ?? existing.reg_no;
    existing.category = category ?? existing.category;
    existing.amount = amount ?? existing.amount;
    existing.date = date ?? existing.date;
    existing.notes = notes ?? existing.notes;

    await existing.save();
    res.json(existing.toJSON());
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await Expense.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Expense not found" });
    await Expense.deleteOne({ _id: req.params.id });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;
