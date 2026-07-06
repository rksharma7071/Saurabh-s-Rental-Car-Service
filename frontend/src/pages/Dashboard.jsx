import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import KpiCard from "../components/KpiCard";
import StatusPill from "../components/StatusPill";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs } from "../utils";

const STATUS_OPTIONS = ["All", "Confirmed", "Pending", "Completed", "Cancelled"];
const PAGE_SIZE = 20;

function emptyFilters() {
  return { search: "", status: "All", regNo: "All", from: "", to: "" };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters());
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const [d, cRes] = await Promise.all([api.getDashboard(), api.getCars("?limit=1000")]);
      setData(d);
      setCars(Array.isArray(cRes) ? cRes : (cRes.data || []));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [filters]);

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

  const filteredBookings = bookings.filter((b) => {
    if (filters.status !== "All" && b.status !== filters.status) return false;
    if (filters.regNo !== "All" && b.reg_no !== filters.regNo) return false;
    if (filters.from && b.to_date < filters.from) return false;
    if (filters.to && b.from_date > filters.to) return false;
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      const haystack = `${b.id} ${b.customer} ${b.reg_no} ${b.phone || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const filtersActive =
    !!filters.search || filters.status !== "All" || filters.regNo !== "All" || !!filters.from || !!filters.to;

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedBookings = filteredBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

      <div className="card card-pad mb-16 filter-bar">
        <div className="form-field">
          <label>Search</label>
          <input
            type="text"
            placeholder="Booking ID, customer, phone…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Car</label>
          <select value={filters.regNo} onChange={(e) => setFilters({ ...filters, regNo: e.target.value })}>
            <option value="All">All Cars</option>
            {cars.map((c) => <option key={c.id} value={c.reg_no}>{c.reg_no} — {c.model}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="form-field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        {filtersActive && (
          <button className="btn btn-ghost btn-sm filter-clear-btn" onClick={() => setFilters(emptyFilters())}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      <h3 className="section-title">
        Active Bookings (newest first)
        {filtersActive && (
          <span className="muted" style={{ fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
            — showing {filteredBookings.length} of {bookings.length}
          </span>
        )}
      </h3>
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
            {bookings.length > 0 && filteredBookings.length === 0 && (
              <tr><td colSpan={10} className="empty-state">No bookings match the selected filters.</td></tr>
            )}
            {pagedBookings.map((b) => (
              <tr key={b.id}>
                <td data-label="Booking ID">{b.id}</td>
                <td data-label="Customer">{b.customer}</td>
                <td data-label="Car">{b.reg_no}</td>
                <td data-label="From">{fmtDate(b.from_date)}</td>
                <td data-label="To">{fmtDate(b.to_date)}</td>
                <td data-label="Total">{fmtRs(b.total)}</td>
                <td data-label="Advance">{fmtRs(b.advance)}</td>
                <td data-label="Balance">{fmtRs(b.balance)}</td>
                <td data-label="Status"><StatusPill status={b.status} /></td>
                <td data-label="Action">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDismiss(b.id)}>
                    Dismiss
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredBookings.length > PAGE_SIZE && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {safePage} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
