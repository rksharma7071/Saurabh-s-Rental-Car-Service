import mongoose from "../database.js";

const EXPENSE_CATEGORIES = ["Fuel", "Service", "Insurance", "Other"];

const expenseSchema = new mongoose.Schema(
  {
    _id: { type: String }, // e.g. "E001"
    reg_no: { type: String, required: true },
    category: { type: String, required: true, enum: EXPENSE_CATEGORIES, default: "Other" },
    amount: { type: Number, required: true },
    date: { type: String, required: true }, // ISO date string
    notes: { type: String, default: "" },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

export { EXPENSE_CATEGORIES };
export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
