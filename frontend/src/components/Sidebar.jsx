import { NavLink } from "react-router-dom";
import { getUserRole } from "../auth";
import { Home, Car, ClipboardList, Search, Calendar, Wallet, TrendingUp, Receipt, MessageCircle, Users, X, LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/cars", label: "Cars", Icon: Car },
  { to: "/bookings", label: "Bookings", Icon: ClipboardList },
  { to: "/availability", label: "Check Availability", Icon: Search },
  { to: "/calendar", label: "Calendar", Icon: Calendar },
  { to: "/expenses", label: "Expenses", Icon: Wallet },
  { to: "/fleet-performance", label: "Fleet Performance", Icon: TrendingUp },
  { to: "/receipt", label: "Receipt", Icon: Receipt },
  { to: "/send-message", label: "Send Message", Icon: MessageCircle },
];

export default function Sidebar({ open, onClose, onLogout }) {
  const isAdmin = getUserRole() === "admin";
  const displayedLinks = isAdmin
    ? [...links, { to: "/users", label: "Users", Icon: Users }]
    : links;

  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <img
            src="/logo1.png"
            alt="Saurabh's Rental Car Service Logo"
            style={{ width: "100%" }}
          />
        </div>
        <button className="modal-close sidebar-close-btn" style={{ color: "#fff" }} onClick={onClose} aria-label="Close menu">
          <X size={18} aria-hidden="true" />
        </button>
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
            <l.Icon size={17} aria-hidden="true" /> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div>Lucknow, UP · +91 98389 22420</div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <LogOut size={14} aria-hidden="true" /> Log out
        </button>
      </div>
    </aside>
  );
}
