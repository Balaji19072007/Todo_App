import { useMemo } from 'react'

export default function AnalysisTable({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const rows = useMemo(() => {
    return habits.map(h => {
      let completed = 0
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (logs[`${h.id}_${dateStr}`]) completed++
      }
      const goal = daysInMonth
      const left = goal - completed
      const pct = Math.round((completed / goal) * 100)
      return { habit: h, goal, completed, left, pct }
    }).sort((a, b) => b.pct - a.pct)
  }, [habits, logs, year, month, daysInMonth])

  if (habits.length === 0) return null

  return (
    <div className="stats-card">
      <div className="stats-card-header">Analysis</div>
      <div className="analysis-table-wrap">
        <table className="analysis-table" aria-label="Habit analysis table">
          <thead>
            <tr>
              <th className="habit-col">Habit</th>
              <th>Goal</th>
              <th>Actual</th>
              <th>Left</th>
              <th className="habit-col" style={{ minWidth: 160 }}>Progress</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ habit, goal, completed, left, pct }) => (
              <tr key={habit.id}>
                <td className="habit-col">
                  {habit.emoji && <span style={{ marginRight: 6 }}>{habit.emoji}</span>}
                  {habit.name}
                </td>
                <td>{goal}</td>
                <td>{completed}</td>
                <td>{left}</td>
                <td className="progress-td">
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
