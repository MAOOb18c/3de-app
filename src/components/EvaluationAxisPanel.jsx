export default function EvaluationAxisPanel({ title, guide, axisItems }) {
  return (
    <section className="dashboard-right-section dashboard-axis-section" aria-label={title}>
      <div className="zone-zero-axis-readable-panel">
        <div className="zone-zero-axis-readable-heading">
          <strong>{title}</strong>
          <span>{guide}</span>
        </div>
        <div className="zone-zero-axis-readable-grid">
          {axisItems.map((item) => (
            <div key={`zone0-readable-${item.axis}`} className="zone-zero-axis-readable-item">
              <b>{item.axis.toUpperCase()} {item.label}</b>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
