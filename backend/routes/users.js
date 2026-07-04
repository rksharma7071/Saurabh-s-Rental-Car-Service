import express from "express";
import bcrypt from "bcryptjs";
import User from "../db/models/User.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role || "staff",
    });

    res.status(201).json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.username === "admin" && req.body.username && req.body.username !== "admin") {
      return res.status(400).json({ error: "Cannot change the username of the default admin user" });
    }
    if (user.username === "admin" && req.body.role && req.body.role !== "admin") {
      return res.status(400).json({ error: "Cannot change the role of the default admin user" });
    }

    if (req.body.username) {
      const existing = await User.findOne({ username: req.body.username.toLowerCase(), _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ error: "Username already exists" });
      user.username = req.body.username.toLowerCase();
    }
    
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }
    
    if (req.body.role) {
      user.role = req.body.role;
    }

    await user.save();
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.username === "admin") {
      return res.status(400).json({ error: "Cannot delete the default admin user" });
    }

    await User.deleteOne({ _id: req.params.id });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
