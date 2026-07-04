import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./database.js";
import Car from "./models/Car.js";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

export async function seed() {
  await connectDB();

  const carCount = await Car.countDocuments();
  if (carCount === 0) {
    const cars = [
      { _id: "C001", reg_no: "UP32 AB 1234", model: "Maruti Swift Dzire", type: "Sedan", rate: 2500, status: "Active" },
      { _id: "C002", reg_no: "UP32 CD 5678", model: "Hyundai Creta", type: "SUV", rate: 3500, status: "Active" },
      { _id: "C003", reg_no: "UP32 EF 9012", model: "Toyota Innova", type: "MUV", rate: 4500, status: "Active" },
      { _id: "C004", reg_no: "UP32 GH 3456", model: "Maruti Ertiga", type: "MUV", rate: 3200, status: "Active" },
      { _id: "C005", reg_no: "UP32 JK 7890", model: "Honda City", type: "Sedan", rate: 2800, status: "Active" },
    ];
    await Car.insertMany(cars);
    console.log(`Seeded ${cars.length} cars.`);
  } else {
    console.log("Cars collection already has data — skipping car seed.");
  }

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash("274509", 10);
    await User.create({ username: "admin", password: hashedPassword, role: "admin" });
    console.log("Seeded admin user.");
  } else {
    console.log("User collection already has data — skipping user seed.");
  }

  const bookingCount = await Booking.countDocuments();
  if (bookingCount === 0) {
    const bookings = [
      { _id: "B001", reg_no: "UP32 AB 1234", customer: "Rahul Sharma", phone: "+91 98765 43210", from_date: "2026-07-08", to_date: "2026-07-11", advance: 1000, status: "Confirmed" },
      { _id: "B002", reg_no: "UP32 CD 5678", customer: "Priya Verma", phone: "+91 98123 45678", from_date: "2026-07-18", to_date: "2026-07-23", advance: 2000, status: "Confirmed" },
      { _id: "B003", reg_no: "UP32 EF 9012", customer: "Amit Singh", phone: "+91 99887 76655", from_date: "2027-01-05", to_date: "2027-01-12", advance: 5000, status: "Confirmed" },
      { _id: "B004", reg_no: "UP32 AB 1234", customer: "Neha Gupta", phone: "+91 98890 12345", from_date: "2027-01-18", to_date: "2027-01-22", advance: 2500, status: "Confirmed" },
      { _id: "B005", reg_no: "UP32 JK 7890", customer: "Vikas Yadav", phone: "+91 99001 22334", from_date: "2026-08-12", to_date: "2026-08-15", advance: 0, status: "Pending" },
      { _id: "B006", reg_no: "UP32 CD 5678", customer: "Sachin Gupta", phone: "+91 98389 22420", from_date: "2026-09-15", to_date: "2026-09-20", advance: 3000, status: "Confirmed" },
    ];
    await Booking.insertMany(bookings.map((b) => ({ ...b, dismissed: false })));
    console.log(`Seeded ${bookings.length} bookings.`);
  } else {
    console.log("Bookings collection already has data — skipping booking seed.");
  }
}

// Allow running directly: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
