import mongoose from "../database.js";

const bookingSchema = new mongoose.Schema(
  {
    _id: { type: String }, // e.g. "B001"
    reg_no: { type: String, required: true },
    customer: { type: String, required: true },
    phone: { type: String, required: true },
    from_date: { type: String, required: true }, // ISO date string, e.g. "2026-07-08"
    to_date: { type: String, required: true },
    advance: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: "Pending" },
    custom_price: { type: Number, default: 0 }, // 0 = use days × car rate; >0 overrides the daily-rate total entirely
    notes: { type: String, default: "" }, // free-text trip details, e.g. pickup/drop locations
    dismissed: { type: Boolean, required: true, default: false },
    created_at: { type: String, default: () => new Date().toISOString() },
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

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
