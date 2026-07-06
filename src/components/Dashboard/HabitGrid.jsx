import { useMemo } from 'react'

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEK_NAMES = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']

function getWeekNumber(day, firstDayOfWeek) {
  return Math.floor((day - 1 + firstDayOfWeek) / 7)
}

export default function HabitGrid({ habits, logs, year, month, onToggle }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0=Sun

  // Build array of day info
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOfWeek = (firstDayOfWeek + i) % 7
      const weekNum = getWeekNumber(day, firstDayOfWeek)
      const isToday = dateStr === todayStr
      const isFuture = dateStr > todayStr
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      return { day, dateStr, dayOfWeek, weekNum, isToday, isFuture, isWeekend }
    })
  }, [year, month, daysInMonth, firstDayOfWeek, todayStr])

  // Group by weeks for header spans
  const weekGroups = useMemo(() => {
    const groups = []
    let currentWeek = -1
    let count = 0
    for (const d of days) {
      if (d.weekNum !== currentWeek) {
        if (currentWeek >= 0) groups.push({ weekNum: currentWeek, count })
        currentWeek = d.weekNum
        count = 1
      } else {
        count++
      }
    }
    if (currentWeek >= 0) groups.push({ weekNum: currentWeek, count })
    return groups
  }, [days])

  if (habits.length === 0) {
    return (
      <div className="habit-grid-container">
        <div className="empty-state" style={{ height: '300px' }}>
          <div className="empty-state-icon">➕</div>
          <div className="empty-state-text">Add habits from the left sidebar to get started</div>
        </div>
      </div>
    )
  }

  return (
    <div className="habit-grid-container">
      <table className="habit-grid" aria-label="Habit tracking grid">
        <thead>
          {/* Week header row */}
          <tr className="grid-week-row">
            <th style={{ minWidth: 180, textAlign: 'left', paddingLeft: 8 }}>Habit</th>
            {weekGroups.map(wg => (
              <th key={wg.weekNum} colSpan={wg.count}>{WEEK_NAMES[wg.weekNum]}</th>
            ))}
            <th style={{ minWidth: 80 }}>Progress</th>
          </tr>
          {/* Day number + day name row */}
          <tr className="grid-header-row">
            <th style={{ textAlign: 'left', paddingLeft: 8 }}>—</th>
            {days.map(d => (
              <th
                key={d.day}
                className={`day-col${d.isToday ? ' today-col' : ''}${d.isWeekend ? ' weekend-col' : ''}`}
                title={d.dateStr}
              >
                <div>{d.day}</div>
                <div style={{ fontSize: 9, fontWeight: 400 }}>{DAY_NAMES[d.dayOfWeek]}</div>
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {habits.map(habit => {
            let completedCount = 0
            for (const d of days) {
              if (logs[`${habit.id}_${d.dateStr}`]) completedCount++
            }
            const pct = Math.round((completedCount / daysInMonth) * 100)

            return (
              <tr key={habit.id} className="grid-habit-row">
                <td className="habit-name-cell">
                  <div className="habit-name-inner">
                    <span style={{ fontSize: 14 }}>{habit.emoji || '·'}</span>
                    <span>{habit.name}</span>
                  </div>
                </td>
                {days.map(d => {
                  const checked = !!logs[`${habit.id}_${d.dateStr}`]
                  return (
                    <td
                      key={d.day}
                      className={d.isToday ? 'today-col' : ''}
                    >
                      <div
                        className={`checkbox-cell${d.isFuture ? ' future-cell' : ''}`}
                        onClick={() => !d.isFuture && onToggle(habit.id, d.dateStr, checked)}
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${habit.name} on ${d.dateStr}`}
                        tabIndex={d.isFuture ? -1 : 0}
                        onKeyDown={e => {
                          if ((e.key === ' ' || e.key === 'Enter') && !d.isFuture) {
                            e.preventDefault()
                            onToggle(habit.id, d.dateStr, checked)
                          }
                        }}
                      >
                        <div className={`habit-checkbox${checked ? ' checked' : ''}`} />
                      </div>
                    </td>
                  )
                })}
                <td className="progress-cell">
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-pct">{pct}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
