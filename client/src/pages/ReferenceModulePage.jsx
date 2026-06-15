function ReferenceModulePage({ area, title, status = 'Queued', dependencies = [] }) {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">{area}</span>
          <h2>{title}</h2>
          <p>This reference module is registered in the portal route map and queued for a production implementation pass.</p>
        </div>
        <div className="status-chip">{status}</div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Implementation readiness</h2>
        </div>
        <div className="gateway-list">
          {dependencies.map((dependency) => (
            <div className="gateway-row" key={dependency}>
              <span>{dependency}</span>
              <strong>Pending</strong>
            </div>
          ))}
          {!dependencies.length ? (
            <div className="gateway-row">
              <span>Product and backend audit</span>
              <strong>Pending</strong>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ReferenceModulePage
