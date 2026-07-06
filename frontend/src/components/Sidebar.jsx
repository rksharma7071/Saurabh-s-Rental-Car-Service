import { NavLink } from "react-router-dom";
import { getUserRole } from "../auth";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/cars", label: "Cars", icon: "🚗" },
  { to: "/bookings", label: "Bookings", icon: "📋" },
  { to: "/availability", label: "Check Availability", icon: "🔍" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/receipt", label: "Receipt", icon: "🧾" },
  { to: "/send-message", label: "Send Message", icon: "💬" },
];

export default function Sidebar({ open, onClose }) {
  const isAdmin = getUserRole() === "admin";
  const displayedLinks = isAdmin 
    ? [...links, { to: "/users", label: "Users", icon: "👥" }] 
    : links;

  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {/* <h1>Saurabh's Rental<br />Car Service</h1> */}
          {/* <p>Car Rental Booking System</p> */}
          <img
            src="/logo2.png"
            alt="Saurabh's Rental Car Service Logo"
            style={{ width: "100%" }}
          />
        </div>
        <button className="modal-close sidebar-close-btn" style={{ color: "#fff" }} onClick={onClose}>✕</button>
      </div>
      <nav className="sidebar-nav">
        {displayedLinks.map((l) => (
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
      </div>
    </aside>
  );
}

