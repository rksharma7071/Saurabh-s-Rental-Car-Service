import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import { fmtDate, fmtRs } from "../utils";
import { Download, Mail } from "lucide-react";

export default function Receipt() {
  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [email, setEmail] = useState("mailsachingupta20@gmail.com");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    api.getReceipt(bookingId).then(setReceipt).catch((e) => toast.error(e.message));
  }, [bookingId]);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await api.downloadReceiptPdf(receipt.id, `Receipt-${receipt.id}.pdf`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!email) return toast.error("Enter a recipient email");
    setSending(true);
    try {
      await api.emailReceipt(bookingId, email);
      toast.success(`Receipt emailed to ${email}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Receipt</h2>
        <p>Select a booking to generate, download, or email the receipt.</p>
      </div>

      <div className="form-field highlight mb-16" style={{ maxWidth: 320 }}>
        <label>Select Booking</label>
        <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>{b.id} — {b.customer}</option>
          ))}
        </select>
      </div>

      {receipt && (
        <div className="card" style={{ maxWidth: 600, padding: 0, position: "relative", overflow: "hidden" }}>
          {receipt.status === "Confirmed" && <ConfirmedStamp />}
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>Saurabh's Rental Car Service</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Lucknow, Uttar Pradesh &nbsp;|&nbsp; +91 98389 22420
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-soft)" }}>RECEIPT</div>
          </div>

          <div style={{ padding: "20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>BILL TO</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{receipt.customer}</div>
                <div className="muted" style={{ fontSize: 13 }}>{receipt.phone}</div>
              </div>
              <div className="text-right">
                <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>VEHICLE</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{receipt.reg_no}</div>
                <div className="muted" style={{ fontSize: 13 }}>{receipt.model} | {receipt.type}</div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />

            <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>BOOKING PERIOD</div>
            <div className="receipt-fields-grid" style={{ marginBottom: 18 }}>
              <FieldBox label="From" value={fmtDate(receipt.from_date)} />
              <FieldBox label="To" value={fmtDate(receipt.to_date)} />
              <FieldBox label="Days" value={receipt.days} />
              <FieldBox label="Daily Rate" value={fmtRs(receipt.rate)} />
            </div>

            {receipt.notes && receipt.notes.trim() && (
              <>
                <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>TRIP NOTES</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{receipt.notes.trim()}</div>
              </>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />

            <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>CHARGES</div>
            <Row
              label={Number(receipt.custom_price) > 0 ? "Custom Price" : `${receipt.days} days × ${fmtRs(receipt.rate)}`}
              value={fmtRs(receipt.total)}
            />
            <Row label="Total" value={fmtRs(receipt.total)} bold />
            <Row label="Advance Paid" value={fmtRs(receipt.advance)} />

            <div style={{
              background: "var(--ink-soft)", color: "#fff", borderRadius: 8,
              padding: "12px 16px", display: "flex", justifyContent: "space-between",
              marginTop: 14, fontWeight: 700,
            }}>
              <span>BALANCE DUE</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 17 }}>{fmtRs(receipt.balance)}</span>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div style={{ display: "flex", gap: 12, marginTop: 18, maxWidth: 600 }}>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? "Preparing…" : <><Download size={15} aria-hidden="true" /> Download PDF</>}
          </button>
        </div>
      )}

      {receipt && (
        <div className="card card-pad mt-24" style={{ maxWidth: 600 }}>
          <h3 className="section-title">Send via Email</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              style={{ flex: "1 1 200px", padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8 }}
            />
            <button className="btn btn-success" onClick={handleSendEmail} disabled={sending}>
              {sending ? "Sending…" : <><Mail size={15} aria-hidden="true" /> Send Receipt</>}
            </button>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
            Requires SMTP credentials configured in backend/.env — see README for Gmail app password setup.
          </p>
        </div>
      )}
    </div>
  );
}

function FieldBox({ label, value }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14 }}>{value}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span className={bold ? "" : "muted"} style={{ fontSize: 13, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: bold ? 600 : 500, fontSize: bold ? 14 : 13 }}>{value}</span>
    </div>
  );
}

/** The receipt's signature element: an ink-stamp motif for confirmed bookings,
 *  echoing the hand-stamped ledgers small businesses have long used. */
function ConfirmedStamp() {
  return (
    <div
      style={{
        position: "absolute",
        top: 18,
        right: 24,
        width: 74,
        height: 74,
        borderRadius: "50%",
        border: "2.5px solid var(--ink-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-10deg)",
        opacity: 0.85,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "1px solid var(--ink-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.15 }}>
          CONFIRMED
        </span>
      </div>
    </div>
  );
}
