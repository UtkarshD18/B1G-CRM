function PlaceholderModule({ eyebrow, title, description, bullets }) {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="panel">
        <ul className="signal-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PlaceholderModule
