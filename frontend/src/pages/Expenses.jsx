import { useEffect, useState } from "react";
import { api } from "../api";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs, todayISO } from "../utils";

const CATEGORIES = ["Fuel", "Service", "Insurance", "Other"];

function emptyForm() {
  return { reg_no: "", category: "Fuel", amount: "", date: todayISO(), notes: "" };
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterCar, setFilterCar] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  async function load() {
    setLoading(true);
    try {
      const query = `?page=${page}&limit=15&reg_no=${filterCar}&category=${filterCategory}`;
      const [eRes, cRes] = await Promise.all([api.getExpenses(query), api.getCars("?limit=1000")]);
      setExpenses(eRes.data || []);
      setTotalPages(eRes.totalPages || 1);
      setTotalAmount(eRes.totalAmount || 0);
      setCars(Array.isArray(cRes) ? cRes : (cRes.data || []));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, filterCar, filterCategory]);
  useEffect(() => { setPage(1); }, [filterCar, filterCategory]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(exp) {
    setEditing(exp);
    setForm({ reg_no: exp.reg_no, category: exp.category, amount: exp.amount, date: exp.date, notes: exp.notes || "" });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) || 0 };
      if (editing) {
        await api.updateExpense(editing.id, payload);
        toast.success(`${editing.id} updated`);
      } else {
        const created = await api.createExpense(payload);
        toast.success(`${created.id} logged`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exp) {
    if (!confirm(`Delete this ${exp.category} expense of ${fmtRs(exp.amount)}?`)) return;
    try {
      await api.deleteExpense(exp.id);
      toast.success("Expense deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Expenses</h2>
          <p>Track fuel, service, insurance, and other costs per car.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Log Expense</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="label">Total (filtered)</div>
          <div className="value">{fmtRs(totalAmount)}</div>
        </div>
      </div>

      <div className="filters">
        <select value={filterCar} onChange={(e) => setFilterCar(e.target.value)}>
          <option value="">All Cars</option>
          {cars.map((c) => <option key={c.id} value={c.reg_no}>{c.reg_no} — {c.model}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Car</th><th>Category</th><th>Amount</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No expenses logged yet.</td></tr>
              )}
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td data-label="Date">{fmtDate(exp.date)}</td>
                  <td data-label="Car">{exp.reg_no}</td>
                  <td data-label="Category">
                    <span className={`expense-category-pill expense-category-${exp.category.toLowerCase()}`}>{exp.category}</span>
                  </td>
                  <td data-label="Amount">{fmtRs(exp.amount)}</td>
                  <td data-label="Notes">{exp.notes || <span className="muted">—</span>}</td>
                  <td data-label="Actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)}>Edit</button>{" "}
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(exp)}>Delete</button>
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
        <Modal title={editing ? `Edit Expense` : "Log an Expense"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Car</label>
                <select required value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })}>
                  <option value="">Select a car…</option>
                  {cars.map((c) => <option key={c.id} value={c.reg_no}>{c.reg_no} — {c.model}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Amount (Rs)</label>
                <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Date</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-field mt-24">
              <label>Notes (optional)</label>
              <textarea rows={2} placeholder="e.g. Full tank at Indian Oil, Hazratganj" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Log Expense"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
