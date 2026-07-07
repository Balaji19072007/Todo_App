import { useState, useEffect, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Doughnut } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Tooltip, Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Tooltip, Legend
)

import { supabase } from './lib/supabase'
import { useHabits } from './hooks/useHabits'
import { useHabitLogs } from './hooks/useHabitLogs'
import { useWellness } from './hooks/useWellness'
import AuthPage from './components/Auth/AuthPage'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = Array.from({ length: 5 }, (_, i) => 2023 + i)
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

/* ─────────────── TOAST ─────────────── */
function Toasts({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item${t.type === 'error' ? ' err' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ─────────────── DAILY PROGRESS CHART ─────────────── */
function DailyProgressChart({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const todayStr = new Date().toISOString().slice(0, 10)

  const { labels, data: pts } = useMemo(() => {
    const labels = [], data = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      labels.push(d)
      if (ds > todayStr || !habits.length) { data.push(null); continue }
      const done = habits.filter(h => logs[`${h.id}_${ds}`]).length
      data.push(Math.round((done / habits.length) * 100))
    }
    return { labels, data }
  }, [habits, logs, year, month, daysInMonth, todayStr])

  const chartData = {
    labels,
    datasets: [{
      data: pts,
      backgroundColor: pts.map(v => v === null ? 'transparent' : v >= 80 ? '#ffffff' : v >= 50 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)'),
      borderRadius: 2,
      borderSkipped: false,
    }]
  }

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#aaa',
        borderColor: '#333', borderWidth: 1,
        callbacks: { label: ctx => `${ctx.parsed.y ?? 0}% done` }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { size: 9 } }, border: { color: '#333' } },
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.04)' },
           ticks: { color: '#555', font: { size: 9 }, callback: v => `${v}%`, stepSize: 25 },
           border: { color: '#333' } }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Daily Progress</div>
      <div style={{ flex: 1, padding: '8px', minHeight: 0 }}>
        <Bar data={chartData} options={opts} />
      </div>
    </div>
  )
}

/* ─────────────── KPI BOX ─────────────── */
function KPIBox({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const { goal, done } = useMemo(() => {
    const goal = habits.length * daysInMonth
    let done = 0
    for (const h of habits) {
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        if (logs[`${h.id}_${ds}`]) done++
      }
    }
    return { goal, done }
  }, [habits, logs, year, month, daysInMonth])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title" style={{textAlign:'left', paddingLeft:12}}>Goal</div>
      <div className="kpi-row">
        <div className="kpi-item">
          <div className="kpi-label">Goal</div>
          <div className="kpi-value">{goal}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value done">{done}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">Left</div>
          <div className="kpi-value left">{goal - done}</div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── OVERALL STATS DONUT ─────────────── */
const centerPlugin = {
  id: 'center',
  beforeDraw(chart) {
    const { width, height, ctx } = chart
    const pct = chart.config._pct || 0
    ctx.restore()
    const fs = Math.max(12, height / 5.5)
    ctx.font = `700 ${fs}px Inter, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    const text = `${pct}%`
    ctx.fillText(text, (width - ctx.measureText(text).width) / 2, height / 2)
    ctx.save()
  }
}

function OverallStats({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const pct = useMemo(() => {
    const goal = habits.length * daysInMonth
    if (!goal) return 0
    let done = 0
    for (const h of habits) {
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        if (logs[`${h.id}_${ds}`]) done++
      }
    }
    return Math.round((done / goal) * 100)
  }, [habits, logs, year, month, daysInMonth])

  const data = {
    _pct: pct,
    datasets: [{ data: [pct, 100 - pct], backgroundColor: ['#cccccc','#2a2a2a'], borderWidth: 0, hoverOffset: 0 }]
  }
  const opts = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }

  // Attach pct to chart config for plugin
  const plugin = {
    ...centerPlugin,
    beforeDraw(chart) {
      chart.config._pct = pct
      centerPlugin.beforeDraw(chart)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Overall Stats</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
        <div style={{ width: 120, height: 120 }}>
          <Doughnut data={data} options={opts} plugins={[plugin]} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────── HABIT SIDEBAR ─────────────── */
function HabitSidebar({ habits, loading, onAdd, onUpdate, onDelete, logs, year, month }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [editH, setEditH] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  const daysInMonth = new Date(year, month, 0).getDate()

  const totals = useMemo(() => {
    const goal = habits.length * daysInMonth
    let done = 0
    for (const h of habits) {
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        if (logs[`${h.id}_${ds}`]) done++
      }
    }
    return { goal, done, left: goal - done, pct: goal ? Math.round((done/goal)*100) : 0 }
  }, [habits, logs, year, month, daysInMonth])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await onAdd(name.trim(), emoji.trim())
    setName(''); setEmoji(''); setShowForm(false)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    await onUpdate(editH.id, { name: editName.trim(), emoji: editEmoji.trim() })
    setEditH(null)
  }

  return (
    <aside className="habit-sidebar">
      <div className="sidebar-top">
        <span className="sidebar-heading">My Habits</span>
        <button className="add-btn" onClick={() => setShowForm(v => !v)} title="Add habit">
          {showForm ? '×' : '+'}
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:20 }}>
          <div className="spinner" />
        </div>
      ) : (
        <ul className="habit-list-ul">
          {habits.map((h, i) => (
            <li key={h.id} className="habit-li">
              <span className="habit-li-num">{i+1}</span>
              <span className="habit-li-emoji">{h.emoji || '·'}</span>
              <span className="habit-li-name" title={h.name}>{h.name}</span>
              <div className="habit-li-actions">
                <button className="habit-li-btn" onClick={() => { setEditH(h); setEditName(h.name); setEditEmoji(h.emoji||'') }} title="Edit">✎</button>
                <button className="habit-li-btn del" onClick={() => onDelete(h.id)} title="Delete">✕</button>
              </div>
            </li>
          ))}
          {!habits.length && !showForm && (
            <li style={{ padding: '20px 10px' }}>
              <div className="empty-hint">
                <div className="icon">📋</div>
                <div className="msg">No habits yet</div>
                <div className="sub">Click + to add one</div>
              </div>
            </li>
          )}
        </ul>
      )}

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <div className="add-form-row">
            <input className="emoji-in" value={emoji} onChange={e=>setEmoji(e.target.value)} placeholder="🔥" maxLength={2} />
            <input className="name-in" value={name} onChange={e=>setName(e.target.value)} placeholder="Habit name..." autoFocus />
          </div>
          <div className="add-form-btns">
            <button type="button" className="f-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="f-btn-save" disabled={!name.trim()}>Add</button>
          </div>
        </form>
      )}

      {/* Edit modal */}
      {editH && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setEditH(null)}>
          <div className="modal-box">
            <h3>Edit Habit</h3>
            <form onSubmit={handleEdit}>
              <div className="add-form-row">
                <input className="emoji-in" value={editEmoji} onChange={e=>setEditEmoji(e.target.value)} placeholder="🔥" maxLength={2} />
                <input className="name-in" value={editName} onChange={e=>setEditName(e.target.value)} autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="f-btn-cancel" style={{flex:1}} onClick={() => setEditH(null)}>Cancel</button>
                <button type="submit" className="f-btn-save" style={{flex:1}} disabled={!editName.trim()}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sidebar-stats">
        <div className="s-stat"><span className="s-stat-label">Goal</span><span className="s-stat-val">{totals.goal}</span></div>
        <div className="s-stat"><span className="s-stat-label">Done</span><span className="s-stat-val">{totals.done}</span></div>
        <div className="s-stat"><span className="s-stat-label">Left</span><span className="s-stat-val">{totals.left}</span></div>
        <div className="s-stat"><span className="s-stat-label">%</span><span className={`s-stat-val${totals.pct>=80?' hi':''}`}>{totals.pct}%</span></div>
      </div>
    </aside>
  )
}

/* ─────────────── HABIT GRID (white cells) ─────────────── */
function HabitGrid({ habits, logs, year, month, onToggle }) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDOW = new Date(year, month - 1, 1).getDay()
  const todayStr = new Date().toISOString().slice(0, 10)

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const dow = (firstDOW + i) % 7
    const wk = Math.floor((i + firstDOW) / 7)
    const isPast = ds < todayStr
    return { d, ds, dow, wk, isToday: ds === todayStr, isFuture: ds > todayStr, isPast }
  }), [year, month, daysInMonth, firstDOW, todayStr])

  const weekGroups = useMemo(() => {
    const groups = []
    let cur = -1, cnt = 0
    for (const day of days) {
      if (day.wk !== cur) {
        if (cur >= 0) groups.push({ wk: cur, cnt })
        cur = day.wk; cnt = 1
      } else cnt++
    }
    if (cur >= 0) groups.push({ wk: cur, cnt })
    return groups
  }, [days])

  if (!habits.length) {
    return (
      <div className="grid-area">
        <div className="empty-hint" style={{ height: '100%' }}>
          <div className="icon">➕</div>
          <div className="msg">Add habits from the left panel</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid-area">
      <table className="habit-table">
        <thead>
          {/* Week header row */}
          <tr className="wk-header-tr">
            <th style={{ minWidth: 26 }}>—</th>
            {weekGroups.map(wg => (
              <th key={wg.wk} colSpan={wg.cnt}>Week {wg.wk + 1}</th>
            ))}
            <th style={{ minWidth: 70 }}>Progress</th>
          </tr>
          {/* Day number + name row */}
          <tr className="day-header-tr">
            <th></th>
            {days.map(d => (
              <th key={d.d} className={d.isToday ? 'today-hdr' : ''} title={d.ds}>
                <div>{d.d}</div>
                <div style={{ fontSize: 8, opacity: 0.7 }}>{DAY_NAMES[d.dow]}</div>
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => {
            let done = 0
            for (const d of days) if (logs[`${h.id}_${d.ds}`]) done++
            const pct = Math.round((done / daysInMonth) * 100)

            return (
              <tr key={h.id} className="habit-tr">
                {/* Habit name — dark, sticky left */}
                <td style={{
                  background: '#111', color: '#fff',
                  padding: '0 8px', fontSize: 11, fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 0, /* this col is from sidebar */
                  border: '1px solid #222',
                  height: 28
                }}>
                  {/* Empty — name is in sidebar, this is a placeholder */}
                </td>
                {/* Day cells — DARK, only today is clickable */}
                {days.map(d => {
                  const checked = !!logs[`${h.id}_${d.ds}`]
                  // Only today can be toggled; past & future are read-only
                  const canClick = d.isToday
                  const cls = [
                    'check-td',
                    checked   ? 'checked'   : '',
                    d.isToday ? 'today-td'  : '',
                    d.isPast  ? 'past-td'   : '',
                    d.isFuture? 'future-td' : ''
                  ].filter(Boolean).join(' ')
                  return (
                    <td
                      key={d.d}
                      className={cls}
                      onClick={() => canClick && onToggle(h.id, d.ds, checked)}
                      role="checkbox"
                      aria-checked={checked}
                      aria-disabled={!canClick}
                      tabIndex={canClick ? 0 : -1}
                      onKeyDown={e => (e.key===' '||e.key==='Enter') && canClick && onToggle(h.id, d.ds, checked)}
                      title={d.isToday ? 'Click to toggle' : d.isPast ? 'Past day (locked)' : 'Future day (locked)'}
                    >
                      <div className="checkbox-sq">
                        {checked ? '✓' : ''}
                      </div>
                    </td>
                  )
                })}
                {/* Progress */}
                <td className="prog-td">
                  <div className="prog-bar-wrap">
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="prog-pct">{pct}%</span>
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

/* ─────────────── ANALYSIS PANEL ─────────────── */
function AnalysisPanel({ habits, logs, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const rows = useMemo(() => habits.map(h => {
    let done = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      if (logs[`${h.id}_${ds}`]) done++
    }
    const pct = Math.round((done / daysInMonth) * 100)
    return { h, goal: daysInMonth, done, left: daysInMonth - done, pct }
  }), [habits, logs, year, month, daysInMonth])

  const sorted = useMemo(() => [...rows].sort((a, b) => b.pct - a.pct).slice(0, 10), [rows])

  return (
    <div className="analysis-panel">
      <div className="panel-title">Analysis</div>
      <div className="analysis-scroll">
        <table className="analysis-tbl">
          <thead>
            <tr>
              <th>Goal</th>
              <th>Actual</th>
              <th>Left</th>
              <th style={{ minWidth: 50 }}>Prog</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ h, goal, done, left, pct }) => (
              <tr key={h.id}>
                <td>{goal}</td>
                <td>{done}</td>
                <td>{left}</td>
                <td>
                  <div className="a-mini-bar">
                    <div className="a-mini-fill" style={{ width: `${pct}%` }} />
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOP 10 HABITS */}
      <div className="panel-title" style={{ borderTop: '1px solid #222' }}>TOP 10 HABITS</div>
      <div className="top10-panel" style={{ overflowY: 'auto', flex: 1 }}>
        {sorted.map((r, i) => (
          <div key={r.h.id} className="top10-item">
            <span className="top10-rank">{i + 1}</span>
            <span className="top10-emoji">{r.h.emoji || '·'}</span>
            <span className="top10-name">{r.h.name}</span>
            <div className="top10-bar"><div className="top10-fill" style={{ width: `${r.pct}%` }} /></div>
            <span className="top10-pct">{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── WELLNESS CHART ─────────────── */
function WellnessChart({ wellnessData, year, month }) {
  const daysInMonth = new Date(year, month, 0).getDate()

  const { labels, moods, sleeps } = useMemo(() => {
    const labels = [], moods = [], sleeps = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const e = wellnessData.find(w => w.log_date === ds)
      labels.push(d); moods.push(e?.mood ?? null); sleeps.push(e?.hours_of_sleep ?? null)
    }
    return { labels, moods, sleeps }
  }, [wellnessData, year, month, daysInMonth])

  const hasData = moods.some(v => v !== null) || sleeps.some(v => v !== null)

  const data = {
    labels,
    datasets: [
      { label: 'Mood', data: moods, borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.08)', tension: 0.4, pointRadius: 2, spanGaps: true, yAxisID: 'yM' },
      { label: 'Sleep (hrs)', data: sleeps, borderColor: '#4a90d9', backgroundColor: 'rgba(74,144,217,0.08)', tension: 0.4, pointRadius: 2, spanGaps: true, yAxisID: 'yS' }
    ]
  }

  const opts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10, padding: 12 } },
      tooltip: { backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#aaa', borderColor: '#333', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { size: 9 } }, border: { color: '#333' } },
      yM: { type: 'linear', position: 'left', min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4caf50', font: { size: 9 } }, border: { color: '#333' } },
      yS: { type: 'linear', position: 'right', min: 0, max: 12, grid: { display: false }, ticks: { color: '#4a90d9', font: { size: 9 } }, border: { color: '#333' } }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">Overall Wellness</div>
      {!hasData ? (
        <div className="empty-hint" style={{ flex: 1 }}>
          <div className="icon">😴</div>
          <div className="msg">No wellness data</div>
          <div className="sub">Log mood & sleep below</div>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '6px 8px', minHeight: 0 }}>
          <Line data={data} options={opts} />
        </div>
      )}
    </div>
  )
}

/* ─────────────── WELLNESS INPUT ─────────────── */
function WellnessInput({ year, month, onSave }) {
  const [mood, setMood] = useState(7)
  const [sleep, setSleep] = useState(7)
  const [saved, setSaved] = useState(false)
  const today = new Date()
  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const handleSave = async () => {
    const ok = await onSave(dateStr, mood, sleep)
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="wellness-log-box">
      <div className="wellness-field">
        <label>Mood {['😞','😐','🙂','😊','🤩'][Math.floor((mood-1)/2)]} {mood}/10</label>
        <input type="range" className="mood-slider" min={1} max={10} value={mood} onChange={e=>setMood(+e.target.value)} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize: 9, color:'#555' }}>
          <span>Bad</span><span>Great</span>
        </div>
      </div>
      <div className="wellness-field">
        <label>Sleep (hours) 💤</label>
        <input type="number" className="wellness-num-in" min={0} max={24} step={0.5} value={sleep} onChange={e=>setSleep(e.target.value)} />
      </div>
      <button className="wellness-save-btn" onClick={handleSave}>
        {saved ? '✓ Saved' : 'Log Today'}
      </button>
    </div>
  )
}

/* ─────────────── MAIN APP ─────────────── */
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const uid = session?.user?.id

  const { habits, loading: hLoad, addHabit, updateHabit, deleteHabit } = useHabits(uid)
  const { logs, loading: lLoad, toggleLog } = useHabitLogs(uid, year, month)
  const { wellnessData, upsertWellness } = useWellness(uid, year, month)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const toast = (msg, type = 'ok') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  const handleAdd = async (name, emoji) => {
    const r = await addHabit(name, emoji)
    if (r) toast(`"${name}" added!`)
    else toast('Failed to add', 'error')
    return r
  }

  const handleDelete = async (id) => {
    const h = habits.find(x => x.id === id)
    if (!window.confirm(`Delete "${h?.name}"? All logs lost.`)) return
    await deleteHabit(id)
    toast('Habit deleted')
  }

  const goBack = () => { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  const goFwd  = () => { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }
  const goNow  = () => { setYear(now.getFullYear()); setMonth(now.getMonth()+1) }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000' }}>
      <div className="spinner" />
    </div>
  )

  if (!session) return <AuthPage />

  return (
    <div className="app-root">
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-brand">🎮 Habit Tracker</div>

        <div className="header-nav">
          <span className="nav-label">Year</span>
          <select className="nav-select" value={year} onChange={e => setYear(+e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="nav-label">Month</span>
          <select className="nav-select" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <button className="nav-btn" onClick={goBack}>‹</button>
          <span className="nav-current">{MONTHS_SHORT[month-1]} {year}</span>
          <button className="nav-btn" onClick={goFwd}>›</button>
          <button className="today-btn" onClick={goNow}>Today</button>
        </div>

        <div className="header-right">
          <span className="user-label">{session.user.email}</span>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </header>

      {/* ── STATS ROW ── */}
      <div className="stats-row">
        <div className="stats-chart-box">
          <DailyProgressChart habits={habits} logs={logs} year={year} month={month} />
        </div>
        <div className="stats-kpi-box">
          <KPIBox habits={habits} logs={logs} year={year} month={month} />
        </div>
        <div className="stats-donut-box">
          <OverallStats habits={habits} logs={logs} year={year} month={month} />
        </div>
      </div>

      {/* ── MAIN CONTENT: Sidebar + Grid + Analysis ── */}
      <div className="content-area">
        <HabitSidebar
          habits={habits}
          loading={hLoad}
          onAdd={handleAdd}
          onUpdate={updateHabit}
          onDelete={handleDelete}
          logs={logs}
          year={year}
          month={month}
        />
        {lLoad ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <HabitGrid habits={habits} logs={logs} year={year} month={month} onToggle={toggleLog} />
        )}
        <AnalysisPanel habits={habits} logs={logs} year={year} month={month} />
      </div>

      {/* ── WELLNESS ROW ── */}
      <div className="wellness-row">
        <div className="wellness-chart-box">
          <WellnessChart wellnessData={wellnessData} year={year} month={month} />
        </div>
        <WellnessInput year={year} month={month} onSave={async (d, m, s) => {
          const ok = await upsertWellness(d, m, s)
          if (ok) toast('Wellness logged!')
          else toast('Save failed', 'error')
          return ok
        }} />
      </div>

      <Toasts toasts={toasts} />
    </div>
  )
}
