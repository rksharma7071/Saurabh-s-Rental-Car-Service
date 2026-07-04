import mongoose from "../database.js";

const carSchema = new mongoose.Schema(
  {
    _id: { type: String }, // e.g. "C001"
    reg_no: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    type: { type: String, required: true },
    rate: { type: Number, required: true },
    status: { type: String, required: true, default: "Active" },
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

export default mongoose.models.Car || mongoose.model("Car", carSchema);
