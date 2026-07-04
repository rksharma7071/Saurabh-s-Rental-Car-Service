const STORAGE_KEY = "rental_auth";
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem(STORAGE_KEY, data.token);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}
