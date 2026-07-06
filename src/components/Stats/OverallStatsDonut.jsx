import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

export default function OverallStatsDonut({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const { goal, completed, pct } = useMemo(() => {
    const goal = habits.length * daysInMonth
    let completed = 0
    for (const h of habits) {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (logs[`${h.id}_${dateStr}`]) completed++
      }
    }
    const pct = goal > 0 ? Math.round((completed / goal) * 100) : 0
    return { goal, completed, pct }
  }, [habits, logs, year, month, daysInMonth])

  const data = {
    datasets: [{
      data: [pct, 100 - pct],
      backgroundColor: ['#cccccc', '#2a2a2a'],
      borderWidth: 0,
      hoverOffset: 0,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  }

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw(chart) {
      const { width, height, ctx } = chart
      ctx.restore()
      const fontSize = (height / 100) * 16
      ctx.font = `700 ${fontSize}px Inter, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'middle'
      const text = `${pct}%`
      const textX = Math.round((width - ctx.measureText(text).width) / 2)
      const textY = height / 2
      ctx.fillText(text, textX, textY)
      ctx.save()
    }
  }

  return (
    <div className="overall-stats-card">
      <div className="stats-card-header">Overall Stats</div>
      <div className="stats-kpi-grid">
        <div className="stats-kpi">
          <span className="stats-kpi-label">Goal</span>
          <span className="stats-kpi-value goal">{goal}</span>
        </div>
        <div className="stats-kpi">
          <span className="stats-kpi-label">Completed</span>
          <span className="stats-kpi-value completed">{completed}</span>
        </div>
        <div className="stats-kpi">
          <span className="stats-kpi-label">Left</span>
          <span className="stats-kpi-value left">{goal - completed}</span>
        </div>
      </div>
      <div style={{ height: 140, padding: '12px 20px 16px' }}>
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
      </div>
    </div>
  )
}
