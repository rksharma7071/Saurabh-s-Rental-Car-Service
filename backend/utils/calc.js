import Car from "../db/models/Car.js";

/** Inclusive day count between two ISO dates, e.g. 08-Jul to 11-Jul = 4 days. */
export function daysBetween(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / 86400000) + 1;
}

/** Look up the daily rate for a car by registration number. */
export async function getRateForReg(regNo) {
  const car = await Car.findOne({ reg_no: regNo }).lean();
  return car ? car.rate : 0;
}

/** Attach computed days / rate / total / balance to a raw booking doc (plain object). */
export async function enrichBooking(doc) {
  const days = daysBetween(doc.from_date, doc.to_date);
  const rate = await getRateForReg(doc.reg_no);
  const total = days * rate;
  const balance = total - doc.advance;
  return { ...doc, days, rate, total, balance };
}

export async function enrichBookings(docs) {
  return Promise.all(docs.map(enrichBooking));
}

/** Generate the next sequential ID for a collection, e.g. C006, B007. */
export async function nextId(Model, prefix) {
  const docs = await Model.find({}, { _id: 1 }).lean();
  let max = 0;
  for (const d of docs) {
    const n = parseInt(String(d._id).replace(prefix, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
