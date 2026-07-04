import { getToken, logout } from "./auth.js";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    logout();
    window.location.reload();
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Cars
  getCars: (query = "") => request(`/cars${query}`),
  createCar: (body) => request("/cars", { method: "POST", body: JSON.stringify(body) }),
  updateCar: (id, body) => request(`/cars/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCar: (id) => request(`/cars/${id}`, { method: "DELETE" }),

  // Bookings
  getBookings: (query = "") => request(`/bookings${query}`),
  getBooking: (id) => request(`/bookings/${id}`),
  createBooking: (body) => request("/bookings", { method: "POST", body: JSON.stringify(body) }),
  updateBooking: (id, body) => request(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  dismissBooking: (id, dismissed) =>
    request(`/bookings/${id}/dismiss`, { method: "PATCH", body: JSON.stringify({ dismissed }) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: "DELETE" }),
  getBookingMessage: (id) => request(`/bookings/${id}/message`),

  // Availability
  checkAvailability: (regNo, from, to) =>
    request(`/availability?reg_no=${encodeURIComponent(regNo)}&from=${from}&to=${to}`),

  // Calendar
  getCalendar: (start, days) => request(`/calendar?start=${start}&days=${days}`),

  // Receipt
  getReceipt: (id) => request(`/receipt/${id}`),
  getReceiptPdfUrl: (id) => `${BASE}/receipt/${id}/pdf`,
  emailReceipt: (id, email) =>
    request(`/receipt/${id}/email`, { method: "POST", body: JSON.stringify({ email }) }),

  // Users
  getUsers: () => request("/users"),
  createUser: (body) => request("/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
};
