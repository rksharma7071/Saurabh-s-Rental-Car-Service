import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs, todayISO } from "../utils";

const STATUSES = ["Confirmed", "Pending", "Completed", "Cancelled"];

function emptyForm() {
  return { reg_no: "", customer: "", phone: "", from_date: todayISO(), to_date: todayISO(), advance: "", status: "Pending", notes: "", custom_price: "" };
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const query = `?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
      const [bRes, cRes] = await Promise.all([api.getBookings(query), api.getCars("?limit=1000")]);
      
      if (Array.isArray(bRes)) {
        setBookings(bRes);
        setTotalPages(1);
      } else {
        setBookings(bRes.data || []);
        setTotalPages(bRes.totalPages || 1);
      }

      if (Array.isArray(cRes)) {
        setCars(cRes);
      } else {
        setCars(cRes.data || []);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search]);
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openAdd();
      setSearchParams({});
    }
  }, [searchParams]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(b) {
    setEditing(b);
    setForm({
      reg_no: b.reg_no, customer: b.customer, phone: b.phone,
      from_date: b.from_date, to_date: b.to_date, advance: b.advance, status: b.status,
      notes: b.notes || "",
      custom_price: b.custom_price ? b.custom_price : "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, advance: Number(form.advance) || 0, custom_price: Number(form.custom_price) || 0 };
      if (editing) {
        await api.updateBooking(editing.id, payload);
        toast.success(`${editing.id} updated`);
      } else {
        const created = await api.createBooking(payload);
        toast.success(`${created.id} created`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(b) {
    if (!confirm(`Delete booking ${b.id} for ${b.customer}?`)) return;
    try {
      await api.deleteBooking(b.id);
      toast.success(`${b.id} deleted`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function toggleDismiss(b) {
    try {
      await api.dismissBooking(b.id, !b.dismissed);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const selectedCar = cars.find((c) => c.reg_no === form.reg_no);
  const previewDays = form.from_date && form.to_date
    ? Math.round((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1
    : 0;
  const previewRate = selectedCar?.rate || 0;
  const previewCustomPrice = Number(form.custom_price) || 0;
  const usingCustomPrice = previewCustomPrice > 0;
  const previewTotal = usingCustomPrice ? previewCustomPrice : (previewDays > 0 ? previewDays * previewRate : 0);
  const previewBalance = previewTotal - (Number(form.advance) || 0);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Bookings</h2>
          <p>Days, Rate, Total and Balance are auto-calculated.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add a Booking</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by customer name or reg no"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Car</th><th>Customer</th><th>Phone</th><th>From</th><th>To</th>
                <th>Days</th><th>Rate</th><th>Total</th><th>Advance</th><th>Balance</th>
                <th>Status</th><th>Dismiss</th><th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr><td colSpan={14} className="empty-state">No bookings yet — click "Add a Booking" to create one.</td></tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} style={b.dismissed ? { opacity: 0.5 } : {}}>
                  <td data-label="ID">{b.id}</td>
                  <td data-label="Car">{b.reg_no}</td>
                  <td data-label="Customer">{b.customer}</td>
                  <td data-label="Phone">{b.phone}</td>
                  <td data-label="From">{fmtDate(b.from_date)}</td>
                  <td data-label="To">{fmtDate(b.to_date)}</td>
                  <td data-label="Days">{b.days}</td>
                  <td data-label="Rate">{fmtRs(b.rate)}</td>
                  <td data-label="Total">
                    {fmtRs(b.total)}
                    {b.using_custom_price && (
                      <span title="Custom price — daily rate ignored" style={{ marginLeft: 4, color: "var(--amber)" }}>⚡</span>
                    )}
                  </td>
                  <td data-label="Advance">{fmtRs(b.advance)}</td>
                  <td data-label="Balance">{fmtRs(b.balance)}</td>
                  <td data-label="Status"><StatusPill status={b.status} /></td>
                  <td data-label="Dismiss">
                    <input type="checkbox" checked={!!b.dismissed} onChange={() => toggleDismiss(b)} />
                  </td>
                  <td data-label="Actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>{" "}
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages || 1}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? `Edit ${editing.id}` : "Add a Booking"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Car (Registration No)</label>
                <select required value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })}>
                  <option value="">Select a car…</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.reg_no}>{c.reg_no} — {c.model} (Rs {c.rate}/day)</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Customer Name</label>
                <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98XXX XXXXX" />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>From Date</label>
                <input required type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
              </div>
              <div className="form-field">
                <label>To Date</label>
                <input required type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Advance Paid (Rs)</label>
                <input type="number" min="0" value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Custom Price (Rs) — optional</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 = use days × daily rate"
                  value={form.custom_price}
                  onChange={(e) => setForm({ ...form, custom_price: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field mt-24">
              <label>Trip Details / Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. Pickup: Lucknow Railway Station → Drop: Ayodhya. Needs child seat, early pickup at 6 AM…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {selectedCar && (
              <div className="card card-pad mt-24" style={{ background: "var(--surface)" }}>
                {usingCustomPrice && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-text)", marginBottom: 10 }}>
                    ⚡ Custom price active — daily rate is ignored
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: usingCustomPrice ? 0.4 : 1 }}>
                  <span className="muted">Days</span><strong>{previewDays > 0 ? previewDays : "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6, opacity: usingCustomPrice ? 0.4 : 1 }}>
                  <span className="muted">Rate / day</span><strong>{fmtRs(previewRate)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                  <span className="muted">Total{usingCustomPrice ? " (custom)" : ""}</span><strong>{fmtRs(previewTotal)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                  <span className="muted">Balance Due</span><strong>{fmtRs(previewBalance)}</strong>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Booking"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
