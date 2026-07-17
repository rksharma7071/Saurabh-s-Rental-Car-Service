import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import KpiCard from "../components/KpiCard";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs, todayISO, docStatus } from "../utils";
import { X, TriangleAlert, Search, Plus, Calendar, Car } from "lucide-react";

const STATUS_OPTIONS = ["All", "Confirmed", "Pending", "Completed", "Cancelled"];
const PAGE_SIZE = 20;
const DOC_FIELDS = [["insurance_expiry", "Insurance"], ["puc_expiry", "PUC"], ["rc_expiry", "RC"]];

function emptyFilters() {
  return { search: "", status: "All", regNo: "All", from: "", to: "" };
}

/** Bookings that are relevant "today" — picking up, dropping off, or currently out. */
function getTodaysBookings(bookings, today) {
  return bookings.filter((b) => b.status === "Confirmed" && b.from_date <= today && b.to_date >= today);
}

function todayKind(b, today) {
  const startsToday = b.from_date === today;
  const endsToday = b.to_date === today;
  if (startsToday && endsToday) return "Pickup & Return";
  if (startsToday) return "Pickup";
  if (endsToday) return "Return";
  return "Ongoing";
}

/** Pickup/return events happening in the next 7 days (excluding today, which the ticker/popup already cover). */
function getUpcomingWeek(bookings, today) {
  const in7 = new Date(today + "T00:00:00");
  in7.setDate(in7.getDate() + 7);
  const in7ISO = in7.toISOString().slice(0, 10);

  const events = [];
  for (const b of bookings) {
    if (b.status !== "Confirmed") continue;
    if (b.from_date > today && b.from_date <= in7ISO) {
      events.push({ booking: b, date: b.from_date, kind: "Pickup" });
    }
    if (b.to_date > today && b.to_date <= in7ISO && b.to_date !== b.from_date) {
      events.push({ booking: b, date: b.to_date, kind: "Return" });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/** Cars with a document expired or expiring within 30 days, for the Dashboard alert banner. */
function getExpiringDocs(cars) {
  const items = [];
  for (const c of cars) {
    for (const [field, label] of DOC_FIELDS) {
      const status = docStatus(c[field]);
      if (status.level === "expired" || status.level === "warning") {
        items.push({ car: c, label, status });
      }
    }
  }
  return items;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters());
  const [page, setPage] = useState(1);
  const [todayPopupOpen, setTodayPopupOpen] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [tickerDismissed, setTickerDismissed] = useState(false);
  const [docsAlertDismissed, setDocsAlertDismissed] = useState(false);
  const popupShownRef = useRef(false);
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

  // Show the "today's bookings" popup once per visit, the first time data loads with any.
  useEffect(() => {
    if (!data || popupShownRef.current) return;
    const todays = getTodaysBookings(data.bookings, todayISO());
    if (todays.length > 0) {
      setTodayPopupOpen(true);
      popupShownRef.current = true;
    }
  }, [data]);

  function closeTodayPopup() {
    setTodayPopupOpen(false);
    setShowTicker(true);
  }

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
  const todaysBookings = getTodaysBookings(bookings, todayISO());
  const upcomingWeek = getUpcomingWeek(bookings, todayISO());
  const expiringDocs = getExpiringDocs(cars);

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
      {showTicker && !tickerDismissed && todaysBookings.length > 0 && (
        <div className="today-ticker">
          <div className="today-ticker-track">
            <TickerContent bookings={todaysBookings} today={todayISO()} />
            <TickerContent bookings={todaysBookings} today={todayISO()} />
          </div>
          <button className="today-ticker-close" onClick={() => setTickerDismissed(true)} title="Dismiss" aria-label="Dismiss">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {!docsAlertDismissed && expiringDocs.length > 0 && (
        <div className="docs-alert">
          <div className="docs-alert-text">
            <TriangleAlert size={15} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
            <strong>{expiringDocs.length} document{expiringDocs.length > 1 ? "s" : ""}</strong> need attention —{" "}
            {expiringDocs.slice(0, 3).map((d, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {d.car.reg_no} {d.label} ({d.status.label === "Expired" ? "expired" : d.status.label})
              </span>
            ))}
            {expiringDocs.length > 3 && ` and ${expiringDocs.length - 3} more`}
            {" — "}
            <span className="docs-alert-link" onClick={() => navigate("/cars")}>View Cars</span>
          </div>
          <button className="docs-alert-close" onClick={() => setDocsAlertDismissed(true)} title="Dismiss" aria-label="Dismiss">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="page-header">
        <h2>Saurabh's Rental Car Service</h2>
        <p>Car Rental Booking System</p>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Cars" value={kpis.totalCars} />
        <KpiCard label="Active Bookings" value={kpis.activeBookings} />
        <KpiCard label="Pending" value={kpis.pending} />
        <KpiCard label="Booked Revenue" value={fmtRs(kpis.bookedRevenue)} />
        <KpiCard label="Total Expenses" value={fmtRs(kpis.totalExpenses)} />
        <KpiCard label="Net Profit" value={fmtRs(kpis.netProfit)} />
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn blue" onClick={() => navigate("/availability")}>
          <Search size={16} aria-hidden="true" /> Check Availability
        </button>
        <button className="quick-action-btn green" onClick={() => navigate("/bookings?new=1")}>
          <Plus size={16} aria-hidden="true" /> Add a Booking
        </button>
        <button className="quick-action-btn dark" onClick={() => navigate("/calendar")}>
          <Calendar size={16} aria-hidden="true" /> View Calendar
        </button>
      </div>

      {upcomingWeek.length > 0 && (
        <div className="card card-pad mb-16">
          <h3 className="section-title" style={{ marginTop: 0 }}>Coming Up This Week</h3>
          <div className="upcoming-list">
            {upcomingWeek.slice(0, 8).map((ev, i) => (
              <div className="upcoming-row" key={i}>
                <span className="upcoming-date">{fmtDate(ev.date)}</span>
                <span className={`today-kind-pill today-kind-${ev.kind.toLowerCase()}`}>{ev.kind}</span>
                <span className="upcoming-customer">{ev.booking.customer}</span>
                <span className="muted">{ev.booking.reg_no}</span>
              </div>
            ))}
          </div>
          {upcomingWeek.length > 8 && (
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              + {upcomingWeek.length - 8} more this week
            </div>
          )}
        </div>
      )}

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
            <X size={13} aria-hidden="true" /> Clear Filters
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

      {todayPopupOpen && (
        <Modal title={<><Calendar size={17} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6 }} />Today's Bookings ({todaysBookings.length})</>} onClose={closeTodayPopup}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todaysBookings.map((b) => {
              const kind = todayKind(b, todayISO());
              return (
                <div key={b.id} className="card card-pad" style={{ background: "var(--surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <strong>{b.customer}</strong>
                    <span className={`today-kind-pill today-kind-${kind.replace(/\s+/g, "-").replace("&", "and").toLowerCase()}`}>
                      {kind}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {b.reg_no} · {b.phone}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={closeTodayPopup}>Got it</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TickerContent({ bookings, today }) {
  return (
    <span className="today-ticker-group">
      {bookings.map((b, i) => (
        <span key={b.id + i}>
          <Car size={13} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
          <strong>{b.customer}</strong> ({b.reg_no}) — {todayKind(b, today)}
          <span className="today-ticker-sep">•</span>
        </span>
      ))}
    </span>
  );
}
