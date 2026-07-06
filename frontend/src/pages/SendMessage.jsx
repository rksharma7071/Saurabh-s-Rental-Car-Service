import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

export default function SendMessage() {
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const toast = useToast();

  useEffect(() => {
    api.getBookings("?limit=1000").then((bRes) => {
      const b = Array.isArray(bRes) ? bRes : (bRes.data || []);
      setBookings(b);
      if (b.length) setBookingId(b[b.length - 1].id);
    }).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    api.getBookingMessage(bookingId).then((r) => {
      setMessage(r.message);
      setPhone(r.phone);
    }).catch((e) => toast.error(e.message));
  }, [bookingId]);

  function copyMessage() {
    navigator.clipboard.writeText(message);
    toast.success("Message copied — paste it into WhatsApp");
  }

  function waLink() {
    const digits = phone.replace(/[^\d]/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Send Message (WhatsApp)</h2>
        <p>Pick a booking, then copy the message or open it directly in WhatsApp.</p>
      </div>

      <div className="form-field highlight mb-16" style={{ maxWidth: 320 }}>
        <label>Booking</label>
        <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>{b.id} — {b.customer}</option>
          ))}
        </select>
      </div>

      {message && (
        <>
          <div
            className="card card-pad"
            style={{ maxWidth: 480, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace", fontSize: 13, background: "#E5DDD5" }}
          >
            {message}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={copyMessage}>📋 Copy Message</button>
            <a className="btn btn-success" href={waLink()} target="_blank" rel="noreferrer">
              💬 Open in WhatsApp
            </a>
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 14, maxWidth: 480 }}>
            Tip: "Open in WhatsApp" pre-fills the message to {phone} via WhatsApp Web/App —
            you just hit send.
          </p>
        </>
      )}
    </div>
  );
}
