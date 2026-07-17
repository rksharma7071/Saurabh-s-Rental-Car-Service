export function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtRs(n) {
  if (n === null || n === undefined || n === "") return "";
  return "Rs " + Number(n).toLocaleString("en-IN");
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Compares a document's expiry date to today: expired, expiring within 30 days, ok, or not set.
 *  Shared by the Cars page (badges) and Dashboard (expiring-soon alert). */
export function docStatus(dateStr) {
  if (!dateStr) return { level: "none", label: "Not set" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  const daysLeft = Math.round((expiry - today) / 86400000);
  if (daysLeft < 0) return { level: "expired", label: "Expired" };
  if (daysLeft <= 30) return { level: "warning", label: `${daysLeft}d left` };
  return { level: "ok", label: "OK" };
}
