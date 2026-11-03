export default function StatisticCard({ label, value, tone = 'neutral', note, onClick, active = false }) {
  const className = `stat-card stat-card--${tone}${onClick ? ' stat-card--clickable' : ''}${active ? ' stat-card--active' : ''}`
 
  const content = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </>
  )
 
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        {content}
      </button>
    )
  }
 
  return <div className={className}>{content}</div>
}