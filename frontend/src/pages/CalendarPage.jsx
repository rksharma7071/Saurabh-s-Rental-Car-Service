import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { api } from "../api";
import { todayISO } from "../utils";

const DAYS = 15;

export default function CalendarPage() {
  const [start, setStart] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const d = await api.getCalendar(start, DAYS);
      setData(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [start]);

  function dayLabel(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  }
  function dayNum(iso) {
    return new Date(iso + "T00:00:00").getDate();
  }
  function isWeekend(iso) {
    const wd = new Date(iso + "T00:00:00").getDay();
    return wd === 0 || wd === 6;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Calendar</h2>
        <p>Booked days marked red. Free days green. Edit Start Date to pan the window.</p>
      </div>

      <div className="form-field highlight mb-16" style={{ maxWidth: 200 }}>
        <label>Start Date</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>

      {loading || !data ? (
        <div className="loading-spinner" />
      ) : (
        <div className="table-wrap">
          <table className="data-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Car</th>
                {data.days.map((d) => (
                  <th
                    key={d}
                    style={{
                      width: 50,
                      textAlign: "center",
                      background: isWeekend(d) ? "var(--amber)" : "var(--ink-soft)",
                    }}
                  >
                    {dayLabel(d)}<br />{dayNum(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cars.length === 0 && (
                <tr><td colSpan={DAYS + 1} className="empty-state">No cars in the fleet yet.</td></tr>
              )}
              {data.cars.map((car) => (
                <tr key={car.id}>
                  <td style={{ fontWeight: 600 }}>{car.reg_no} <span className="muted">| {car.model}</span></td>
                  {car.booked.map((isBooked, i) => (
                    <td
                      key={i}
                      style={{
                        textAlign: "center",
                        background: isBooked ? "#FCA5A5" : "#BBF7D0",
                        color: isBooked ? "#991B1B" : "#065F46",
                        fontWeight: 700,
                      }}
                    >
                      {isBooked ? "●" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 13 }}>
        <Legend color="#FCA5A5" text="Booked" />
        <Legend color="#BBF7D0" text="Free" />
        <Legend color="var(--amber)" text="Weekend" />
      </div>
    </div>
  );
}

function Legend({ color, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 14, height: 14, background: color, borderRadius: 3, display: "inline-block" }} />
      {text}
    </div>
  );
}
