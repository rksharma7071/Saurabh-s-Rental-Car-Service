import { useEffect, useState } from "react";
import { api } from "../api";
import { getUserRole } from "../auth";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

export default function Users() {
  const isAdmin = getUserRole() === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function load() {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (!isAdmin) {
    return (
      <div className="page-header">
        <h2>Users Management</h2>
        <p style={{ color: "var(--danger)" }}>Access Denied: You must be an administrator to view this page.</p>
      </div>
    );
  }

  function openAdd() {
    setEditing(null);
    setForm({ username: "", password: "", role: "staff" });
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ username: u.username, password: "", role: u.role });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.updateUser(editing._id, payload);
        toast.success(`User ${form.username} updated`);
      } else {
        await api.createUser(form);
        toast.success(`User ${form.username} created`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (user.username === "admin") {
      toast.error("Cannot delete the default admin user.");
      return;
    }
    if (!confirm(`Delete user ${user.username}?`)) return;
    try {
      await api.deleteUser(user._id);
      toast.success(`User ${user.username} deleted`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Users Management</h2>
          <p>Create and manage system access for staff members.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={4} className="empty-state">No users found.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u._id}>
                  <td data-label="Username"><strong>{u.username}</strong></td>
                  <td data-label="Role"><span style={{ textTransform: "capitalize" }}>{u.role}</span></td>
                  <td data-label="Created At">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>{" "}
                    {u.username !== "admin" && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? `Edit User: ${editing.username}` : "Create New User"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Username</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. staff1"
                />
              </div>
              <div className="form-field">
                <label>Password {editing && "(Leave blank to keep unchanged)"}</label>
                <input
                  required={!editing}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
