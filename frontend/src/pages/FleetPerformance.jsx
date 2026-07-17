import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import { fmtRs } from "../utils";

const PERIODS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export default function FleetPerformance() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await api.getFleetPerformance(days);
      setRows(res.cars || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [days]);

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      profit: acc.profit + r.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <h2>Fleet Performance</h2>
        <p>Which cars are earning the most vs. sitting idle, over the selected period.</p>
      </div>

      <div className="filters">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
        </select>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card"><div className="label">Fleet Revenue</div><div className="value">{fmtRs(totals.revenue)}</div></div>
        <div className="kpi-card"><div className="label">Fleet Expenses</div><div className="value">{fmtRs(totals.expenses)}</div></div>
        <div className="kpi-card"><div className="label">Fleet Net Profit</div><div className="value">{fmtRs(totals.profit)}</div></div>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Car</th><th>Bookings</th><th>Days Booked</th><th>Utilization</th>
                <th>Revenue</th><th>Expenses</th><th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="empty-state">No cars in the fleet yet.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.reg_no}>
                  <td data-label="Car"><strong>{r.reg_no}</strong> <span className="muted">| {r.model}</span></td>
                  <td data-label="Bookings">{r.bookingsCount}</td>
                  <td data-label="Days Booked">{r.bookedDays}</td>
                  <td data-label="Utilization">
                    <UtilizationGauge value={r.utilization} />
                  </td>
                  <td data-label="Revenue">{fmtRs(r.revenue)}</td>
                  <td data-label="Expenses">{fmtRs(r.expenses)}</td>
                  <td data-label="Net Profit">
                    <span style={{ color: r.profit >= 0 ? "var(--green-text)" : "var(--red-text)", fontWeight: 700 }}>
                      {fmtRs(r.profit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** The Fleet Performance page's signature element: a radial gauge dial for utilization,
 *  reserved specifically for this percentage metric rather than used generically. */
function UtilizationGauge({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="util-gauge" title={`${pct}% utilized`}>
      <div
        className="util-gauge-ring"
        style={{ background: `conic-gradient(var(--blue) 0% ${pct}%, var(--line) ${pct}% 100%)` }}
      >
        <div className="util-gauge-inner">{pct}%</div>
      </div>
    </div>
  );
}
