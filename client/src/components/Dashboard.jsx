function DashboardCard({ title, value, detail }) {
  return (
    <article className="dashboard-card">
      <p className="dashboard-label">{title}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}

function DashboardSeries({ title, data }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="bar-series">
        {data.length ? (
          data.map((item) => (
            <div className="bar-row" key={`${title}-${item.label}`}>
              <span>{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(item.value * 8, 8)}px` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">No chart data yet.</p>
        )}
      </div>
    </article>
  )
}

export { DashboardCard, DashboardSeries }
