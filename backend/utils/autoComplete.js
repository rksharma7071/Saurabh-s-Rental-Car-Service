import Booking from "../db/models/Booking.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Flips any "Confirmed" booking whose to_date has already passed to "Completed".
 *  Called opportunistically whenever bookings are listed, so status stays accurate
 *  without needing a scheduled job. Cancelled/Pending/Completed bookings are untouched. */
export async function autoCompletePastBookings() {
  await Booking.updateMany(
    { status: "Confirmed", to_date: { $lt: todayISO() } },
    { $set: { status: "Completed" } }
  );
}
