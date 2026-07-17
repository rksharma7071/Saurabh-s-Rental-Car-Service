import { useEffect, useState } from "react";
import { api } from "../api";
import StatusPill from "../components/StatusPill";
import { useToast } from "../components/Toast";
import { fmtDate, todayISO } from "../utils";
import { CircleCheck, CircleX } from "lucide-react";

export default function Availability() {
  const [cars, setCars] = useState([]);
  const [regNo, setRegNo] = useState("");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.getCars("?limit=1000").then(cRes => {
      if (Array.isArray(cRes)) {
        setCars(cRes);
      } else {
        setCars(cRes.data || []);
      }
    }).catch((e) => toast.error(e.message));
  }, []);

  async function handleCheck(e) {
    e.preventDefault();
    if (!regNo) return toast.error("Select a car first");
    setChecking(true);
    try {
      const r = await api.checkAvailability(regNo, from, to);
      setResult(r);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Check Availability</h2>
        <p>Pick a car and date range. Conflicting confirmed bookings appear below.</p>
      </div>

      <div className="card card-pad mb-16">
        <h3 className="section-title">1. Search</h3>
        <form onSubmit={handleCheck} className="form-grid search-grid">
          <div className="form-field highlight">
            <label>Car (Reg No)</label>
            <select required value={regNo} onChange={(e) => setRegNo(e.target.value)}>
              <option value="">Select a car…</option>
              {cars.map((c) => <option key={c.id} value={c.reg_no}>{c.reg_no} — {c.model}</option>)}
            </select>
          </div>
          <div className="form-field highlight">
            <label>Start Date</label>
            <input required type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-field highlight">
            <label>End Date</label>
            <input required type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={checking}>
            {checking ? "Checking…" : "Check"}
          </button>
        </form>
      </div>

      {result && (
        <>
          <h3 className="section-title">2. Result</h3>
          <div
            className="card card-pad mb-16 text-center"
            style={{
              background: result.available ? "var(--green-soft)" : "var(--red-soft)",
              color: result.available ? "var(--green-text)" : "var(--red-text)",
              fontSize: 20,
              fontWeight: 700,
              padding: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {result.available ? <CircleCheck size={24} aria-hidden="true" /> : <CircleX size={24} aria-hidden="true" />}
            {result.available ? "AVAILABLE" : "NOT AVAILABLE"}
          </div>

          <h3 className="section-title">3. Conflicting Confirmed Bookings</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Booking ID</th><th>Customer</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr>
              </thead>
              <tbody>
                {result.conflicts.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No conflicts — this car is free for the selected dates.</td></tr>
                )}
                {result.conflicts.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Booking ID">{c.id}</td>
                    <td data-label="Customer">{c.customer}</td>
                    <td data-label="From">{fmtDate(c.from_date)}</td>
                    <td data-label="To">{fmtDate(c.to_date)}</td>
                    <td data-label="Days">{c.days}</td>
                    <td data-label="Status"><StatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
