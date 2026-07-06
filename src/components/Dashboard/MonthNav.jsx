const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const YEARS = Array.from({ length: 5 }, (_, i) => 2023 + i)

export default function MonthNav({ year, month, onChange }) {
  const goBack = () => {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }

  const goForward = () => {
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  const goToday = () => {
    const now = new Date()
    onChange(now.getFullYear(), now.getMonth() + 1)
  }

  return (
    <div className="month-nav">
      <span className="month-nav-label">Year</span>
      <select
        id="year-select"
        value={year}
        onChange={e => onChange(parseInt(e.target.value), month)}
        aria-label="Select year"
      >
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <span className="month-nav-label" style={{ marginLeft: 8 }}>Month</span>
      <select
        id="month-select"
        value={month}
        onChange={e => onChange(year, parseInt(e.target.value))}
        aria-label="Select month"
      >
        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>

      <button className="month-nav-btn" onClick={goBack} aria-label="Previous month">‹</button>
      <span className="month-nav-current">{MONTHS[month - 1]} {year}</span>
      <button className="month-nav-btn" onClick={goForward} aria-label="Next month">›</button>

      <button className="month-nav-today-btn" onClick={goToday}>Today</button>
    </div>
  )
}
