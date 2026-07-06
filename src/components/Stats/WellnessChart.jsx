import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function WellnessChart({ wellnessData, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const { labels, moodData, sleepData } = useMemo(() => {
    const labels = []
    const moodData = []
    const sleepData = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const entry = wellnessData.find(w => w.log_date === dateStr)
      labels.push(d)
      moodData.push(entry?.mood ?? null)
      sleepData.push(entry?.hours_of_sleep ?? null)
    }
    return { labels, moodData, sleepData }
  }, [wellnessData, year, month, daysInMonth])

  const hasData = moodData.some(v => v !== null) || sleepData.some(v => v !== null)

  const data = {
    labels,
    datasets: [
      {
        label: 'Mood (1-10)',
        data: moodData,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#4caf50',
        spanGaps: true,
        yAxisID: 'yMood',
      },
      {
        label: 'Hours of Sleep',
        data: sleepData,
        borderColor: '#4a90d9',
        backgroundColor: 'rgba(74,144,217,0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#4a90d9',
        spanGaps: true,
        yAxisID: 'ySleep',
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#aaaaaa',
          font: { size: 11 },
          boxWidth: 12,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#ffffff',
        bodyColor: '#aaaaaa',
        borderColor: '#333333',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#777777', font: { size: 10 } },
        border: { color: '#333333' }
      },
      yMood: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#4caf50', font: { size: 10 } },
        border: { color: '#333333' }
      },
      ySleep: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 12,
        grid: { display: false },
        ticks: { color: '#4a90d9', font: { size: 10 } },
        border: { color: '#333333' }
      }
    }
  }

  return (
    <div className="stats-card">
      <div className="stats-card-header">Overall Wellness</div>
      {!hasData ? (
        <div className="empty-state" style={{ height: 180 }}>
          <div className="empty-state-icon">😴</div>
          <div className="empty-state-text">No wellness data yet</div>
          <div className="empty-state-hint">Log mood & sleep in the Wellness tab</div>
        </div>
      ) : (
        <div className="chart-container" style={{ height: 200 }}>
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  )
}
