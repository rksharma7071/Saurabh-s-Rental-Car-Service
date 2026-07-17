import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { api } from "../api";
import { todayISO, fmtDate } from "../utils";

const DAYS = 21;
const DAY_WIDTH = 56;
const ROW_HEIGHT = 48;
const CAR_COL_WIDTH = 170;

function dayOffset(fromISO, toISO) {
  return Math.round((new Date(toISO + "T00:00:00") - new Date(fromISO + "T00:00:00")) / 86400000);
}

function shiftDate(dateISO, days) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [start, setStart] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragState, setDragState] = useState(null); // { bookingId, regNo, fromDate, toDate, startX, offsetDays }
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

  // Pointer-based drag: mousedown on a bar starts it, mousemove previews the shift,
  // mouseup commits the new dates via the API (or reverts on conflict/error).
  useEffect(() => {
    if (!dragState) return;

    function handleMouseMove(e) {
      const deltaX = e.clientX - dragState.startX;
      const offsetDays = Math.round(deltaX / DAY_WIDTH);
      setDragState((prev) => (prev ? { ...prev, offsetDays } : prev));
    }

    async function handleMouseUp() {
      setDragState((current) => {
        if (current && current.offsetDays !== 0) {
          const newFrom = shiftDate(current.fromDate, current.offsetDays);
          const newTo = shiftDate(current.toDate, current.offsetDays);
          api.updateBooking(current.bookingId, { from_date: newFrom, to_date: newTo })
            .then(() => {
              toast.success(`${current.bookingId} moved to ${fmtDate(newFrom)}`);
              load();
            })
            .catch((err) => toast.error(err.message));
        }
        return null;
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState?.startX, dragState?.bookingId]);

  function startDrag(e, booking, regNo) {
    e.preventDefault();
    setDragState({
      bookingId: booking.id,
      regNo,
      fromDate: booking.from_date,
      toDate: booking.to_date,
      startX: e.clientX,
      offsetDays: 0,
    });
  }

  function dayLabel(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
  }
  function dayNum(iso) {
    return new Date(iso + "T00:00:00").getDate();
  }
  function isWeekend(iso) {
    const wd = new Date(iso + "T00:00:00").getDay();
    return wd === 0 || wd === 6;
  }
  function isToday(iso) {
    return iso === todayISO();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Calendar</h2>
        <p>Drag a booking bar to reschedule it — the new dates save automatically.</p>
      </div>

      <div className="form-field highlight mb-16" style={{ maxWidth: 200 }}>
        <label>Start Date</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>

      {loading || !data ? (
        <div className="loading-spinner" />
      ) : (
        <div className="gantt-wrap">
          <div className="gantt-grid" style={{ width: CAR_COL_WIDTH + data.days.length * DAY_WIDTH }}>
            <div className="gantt-header-row">
              <div className="gantt-car-col gantt-car-col-header">Car</div>
              {data.days.map((d) => (
                <div
                  key={d}
                  className={"gantt-day-header" + (isWeekend(d) ? " weekend" : "") + (isToday(d) ? " is-today" : "")}
                  style={{ width: DAY_WIDTH }}
                >
                  <div className="gantt-day-name">{dayLabel(d)}</div>
                  <div className="gantt-day-num">{dayNum(d)}</div>
                </div>
              ))}
            </div>

            {data.cars.length === 0 && (
              <div className="empty-state" style={{ padding: 30 }}>No cars in the fleet yet.</div>
            )}

            {data.cars.map((car) => (
              <div className="gantt-row" key={car.id}>
                <div className="gantt-car-col">
                  <strong>{car.reg_no}</strong>
                  <div className="muted" style={{ fontSize: 11 }}>{car.model}</div>
                </div>
                <div className="gantt-row-track" style={{ width: data.days.length * DAY_WIDTH, height: ROW_HEIGHT }}>
                  {data.days.map((d, i) => (
                    <div
                      key={d}
                      className={"gantt-cell" + (isWeekend(d) ? " weekend" : "") + (isToday(d) ? " is-today" : "")}
                      style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                    />
                  ))}

                  {car.bookings.map((b) => {
                    const clippedFrom = b.from_date < data.rangeStart ? data.rangeStart : b.from_date;
                    const clippedTo = b.to_date > data.rangeEnd ? data.rangeEnd : b.to_date;
                    if (clippedTo < data.rangeStart || clippedFrom > data.rangeEnd) return null;

                    const isDragging = dragState && dragState.bookingId === b.id;
                    const offsetDays = isDragging ? dragState.offsetDays : 0;
                    const left = (dayOffset(data.rangeStart, clippedFrom) + offsetDays) * DAY_WIDTH;
                    const widthDays = dayOffset(clippedFrom, clippedTo) + 1;
                    const width = widthDays * DAY_WIDTH - 4;

                    return (
                      <div
                        key={b.id}
                        className={"gantt-bar" + (isDragging ? " dragging" : "")}
                        style={{ left, width }}
                        onMouseDown={(e) => startDrag(e, b, car.reg_no)}
                        title={`${b.customer} (${b.id}) — ${fmtDate(b.from_date)} to ${fmtDate(b.to_date)}. Drag to reschedule.`}
                      >
                        {b.customer}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 13, flexWrap: "wrap" }}>
        <Legend swatchClass="gantt-bar" text="Confirmed booking — drag to reschedule" />
        <Legend swatchClass="gantt-cell weekend" text="Weekend" />
        <Legend swatchClass="gantt-cell is-today" text="Today" />
      </div>
    </div>
  );
}

function Legend({ swatchClass, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span className={swatchClass} style={{ width: 22, height: 14, borderRadius: 3, display: "inline-block", position: "static" }} />
      {text}
    </div>
  );
}
