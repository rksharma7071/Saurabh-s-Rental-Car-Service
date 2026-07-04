import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/cars", label: "Cars", icon: "🚗" },
  { to: "/bookings", label: "Bookings", icon: "📋" },
  { to: "/availability", label: "Check Availability", icon: "🔍" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/receipt", label: "Receipt", icon: "🧾" },
  { to: "/send-message", label: "Send Message", icon: "💬" },
];

export default function Sidebar({ open, onClose, onLogout }) {
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Saurabh's Rental<br />Car Service</h1>
          <p>Car Rental Booking System</p>
        </div>
        <button className="modal-close sidebar-close-btn" style={{ color: "#fff" }} onClick={onClose}>✕</button>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={onClose}
          >
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div>Lucknow, UP · +91 98389 22420</div>
        <button className="sidebar-logout-btn" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}

