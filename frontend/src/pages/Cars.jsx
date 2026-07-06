import { useEffect, useState } from "react";
import { api } from "../api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";
import { useToast } from "../components/Toast";
import { fmtRs } from "../utils";

const TYPES = ["Sedan", "SUV", "MUV", "Hatchback", "Van"];
const STATUSES = ["Active", "Inactive", "Maintenance"];

const emptyForm = { reg_no: "", model: "", type: "Sedan", rate: "", status: "Active" };

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const query = `?page=${page}&limit=10&search=${encodeURIComponent(search)}&type=${filterType}&status=${filterStatus}`;
      const res = await api.getCars(query);
      // Fallback for API response before paginated schema is deployed
      if (Array.isArray(res)) {
        setCars(res);
        setTotalPages(1);
      } else {
        setCars(res.data || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search, filterType, filterStatus]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterType, filterStatus]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(car) {
    setEditing(car);
    setForm({ reg_no: car.reg_no, model: car.model, type: car.type, rate: car.rate, status: car.status });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, rate: Number(form.rate) };
      if (editing) {
        await api.updateCar(editing.id, payload);
        toast.success(`${editing.id} updated`);
      } else {
        const created = await api.createCar(payload);
        toast.success(`${created.id} added to fleet`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(car) {
    if (!confirm(`Delete ${car.reg_no} (${car.model})? This cannot be undone.`)) return;
    try {
      await api.deleteCar(car.id);
      toast.success(`${car.id} deleted`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Cars</h2>
          <p>Add, edit, or update your fleet here. Status drives the calendar and availability.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Car</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search by model or reg no" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Car ID</th><th>Registration No</th><th>Model</th><th>Type</th>
                <th>Daily Rate</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cars.length === 0 && (
                <tr><td colSpan={7} className="empty-state">No cars in the fleet yet.</td></tr>
              )}
              {cars.map((c) => (
                <tr key={c.id}>
                  <td data-label="Car ID">{c.id}</td>
                  <td data-label="Registration No">{c.reg_no}</td>
                  <td data-label="Model">{c.model}</td>
                  <td data-label="Type">{c.type}</td>
                  <td data-label="Daily Rate">{fmtRs(c.rate)}</td>
                  <td data-label="Status"><StatusPill status={c.status} /></td>
                  <td data-label="Actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>{" "}
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c)}>Delete</button>
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
        <Modal title={editing ? `Edit ${editing.id}` : "Add a Car"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Registration No</label>
                <input
                  required
                  value={form.reg_no}
                  onChange={(e) => setForm({ ...form, reg_no: e.target.value })}
                  placeholder="UP32 XX 0000"
                />
              </div>
              <div className="form-field">
                <label>Model</label>
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Maruti Swift Dzire"
                />
              </div>
              <div className="form-field">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Daily Rate (Rs)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Car"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
