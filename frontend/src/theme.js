const STORAGE_KEY = "rental_theme";

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
