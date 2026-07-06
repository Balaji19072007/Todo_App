import { useMemo } from 'react'

export default function TopHabits({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const sorted = useMemo(() => {
    return habits.map(h => {
      let completed = 0
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (logs[`${h.id}_${dateStr}`]) completed++
      }
      const pct = Math.round((completed / daysInMonth) * 100)
      return { ...h, completed, pct }
    }).sort((a, b) => b.pct - a.pct).slice(0, 10)
  }, [habits, logs, year, month, daysInMonth])

  if (habits.length === 0) return null

  return (
    <div className="stats-card">
      <div className="stats-card-header">TOP 10 HABITS</div>
      <div className="top-habits-list">
        {sorted.map((h, i) => (
          <div key={h.id} className="top-habit-item">
            <span className="top-habit-rank">{i + 1}</span>
            <span className="top-habit-emoji">{h.emoji || '·'}</span>
            <span className="top-habit-name">{h.name}</span>
            <div className="top-habit-bar">
              <div className="top-habit-bar-fill" style={{ width: `${h.pct}%` }} />
            </div>
            <span className="top-habit-pct">{h.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
