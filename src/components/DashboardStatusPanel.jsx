export default function DashboardStatusPanel({
  panelRef,
  height,
  statusItems,
  getChipClass,
  getItemTitle,
  formatLabel,
}) {
  return (
    <section
      ref={panelRef}
      className="dashboard-right-section dashboard-status-section"
      style={{ height: `${height}px` }}
      aria-label="現在状態"
    >
      <div className="dashboard-section-heading">
        <strong>現在状態</strong>
        <span>進捗と取得状態</span>
      </div>
      <div className="zone-zero-status-row dashboard-status-row-expanded">
        {statusItems.map((item) => (
          <div key={item.label} className={getChipClass(item)} title={getItemTitle(item)}>
            <strong className="zone0-status-chip-title">{formatLabel(item.label)}</strong>
            <span className="zone0-status-chip-value">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
