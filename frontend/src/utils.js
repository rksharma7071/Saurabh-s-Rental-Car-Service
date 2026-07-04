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
