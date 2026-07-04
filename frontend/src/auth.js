// Simple hardcoded login for a single-owner app.
// No backend involved — this only gates the UI in the browser.
// Change these two values to whatever you want the login to be.
const USER_ID = "admin";
const PASSWORD = "274509";

const STORAGE_KEY = "rental_auth";

export function login(userId, password) {
  const ok = userId.trim().toLowerCase() === USER_ID.toLowerCase() && password === PASSWORD;
  if (ok) localStorage.setItem(STORAGE_KEY, "1");
  return ok;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}
