import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DailyProgressChart({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { labels, dataPoints } = useMemo(() => {
    const labels = []
    const dataPoints = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      labels.push(d)
      if (dateStr > todayStr) {
        dataPoints.push(null)
      } else {
        const total = habits.length
        if (total === 0) { dataPoints.push(0); continue }
        const done = habits.filter(h => logs[`${h.id}_${dateStr}`]).length
        dataPoints.push(Math.round((done / total) * 100))
      }
    }
    return { labels, dataPoints }
  }, [habits, logs, year, month, daysInMonth, todayStr])

  const data = {
    labels,
    datasets: [{
      label: 'Daily %',
      data: dataPoints,
      backgroundColor: dataPoints.map(v =>
        v === null ? 'transparent' :
        v >= 80 ? 'rgba(255,255,255,0.9)' :
        v >= 50 ? 'rgba(255,255,255,0.6)' :
        'rgba(255,255,255,0.3)'
      ),
      borderRadius: 2,
      borderSkipped: false,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#ffffff',
        bodyColor: '#aaaaaa',
        borderColor: '#333333',
        borderWidth: 1,
        callbacks: {
          label: ctx => `${ctx.parsed.y ?? 0}% completed`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#777777', font: { size: 10 } },
        border: { color: '#333333' }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#777777',
          font: { size: 10 },
          callback: v => `${v}%`,
          stepSize: 25
        },
        border: { color: '#333333' }
      }
    }
  }

  return (
    <div className="stats-card">
      <div className="stats-card-header">Daily Progress</div>
      <div className="chart-container" style={{ height: 200 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
