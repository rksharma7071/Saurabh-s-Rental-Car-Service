import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import KpiCard from "../components/KpiCard";
import StatusPill from "../components/StatusPill";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs } from "../utils";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDismiss(id) {
    try {
      await api.dismissBooking(id, true);
      toast.success(`${id} dismissed from dashboard`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading-spinner" />;
  if (!data) return null;

  const { kpis, bookings } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Saurabh's Rental Car Service</h2>
        <p>Car Rental Booking System</p>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Cars" value={kpis.totalCars} />
        <KpiCard label="Active Bookings" value={kpis.activeBookings} />
        <KpiCard label="Pending" value={kpis.pending} />
        <KpiCard label="Booked Revenue" value={fmtRs(kpis.bookedRevenue)} />
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn blue" onClick={() => navigate("/availability")}>
          ▶  Check Availability
        </button>
        <button className="quick-action-btn green" onClick={() => navigate("/bookings?new=1")}>
          +  Add a Booking
        </button>
        <button className="quick-action-btn dark" onClick={() => navigate("/calendar")}>
          📅  View Calendar
        </button>
      </div>

      <h3 className="section-title">Active Bookings (newest first)</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Car</th><th>From</th><th>To</th>
              <th>Total</th><th>Advance</th><th>Balance</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={10} className="empty-state">No active bookings yet.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.customer}</td>
                <td>{b.reg_no}</td>
                <td>{fmtDate(b.from_date)}</td>
                <td>{fmtDate(b.to_date)}</td>
                <td>{fmtRs(b.total)}</td>
                <td>{fmtRs(b.advance)}</td>
                <td>{fmtRs(b.balance)}</td>
                <td><StatusPill status={b.status} /></td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDismiss(b.id)}>
                    Dismiss
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
