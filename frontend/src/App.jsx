import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Login from "./pages/Login";
import { isAuthenticated, logout } from "./auth";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Bookings from "./pages/Bookings";
import Availability from "./pages/Availability";
import CalendarPage from "./pages/CalendarPage";
import Receipt from "./pages/Receipt";
import SendMessage from "./pages/SendMessage";
import Users from "./pages/Users";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState(isAuthenticated());

  if (!authed) {
    return (
      <ToastProvider>
        <Login onLogin={() => setAuthed(true)} />
      </ToastProvider>
    );
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-shell">
          <div className="mobile-topbar">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="brand">Saurabh's Rental Car Service</span>
            <button className="mobile-logout-btn" onClick={handleLogout}>Log out</button>
          </div>
          <div
            className={"sidebar-overlay" + (sidebarOpen ? " open" : "")}
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="main">
            <div className="desktop-topbar">
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>⏻ Log out</button>
            </div>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/receipt" element={<Receipt />} />
              <Route path="/send-message" element={<SendMessage />} />
              <Route path="/users" element={<Users />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

