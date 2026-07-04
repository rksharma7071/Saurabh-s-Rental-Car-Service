export default function StatusPill({ status }) {
  const cls = `pill pill-${(status || "").toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}
