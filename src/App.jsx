import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './components/Auth/AuthPage'
import MonthNav from './components/Dashboard/MonthNav'
import HabitSidebar from './components/Dashboard/HabitSidebar'
import HabitGrid from './components/Dashboard/HabitGrid'
import DailyProgressChart from './components/Stats/DailyProgressChart'
import OverallStatsDonut from './components/Stats/OverallStatsDonut'
import AnalysisTable from './components/Stats/AnalysisTable'
import TopHabits from './components/Stats/TopHabits'
import WellnessChart from './components/Stats/WellnessChart'
import WellnessInput from './components/Wellness/WellnessInput'
import { useHabits } from './hooks/useHabits'
import { useHabitLogs } from './hooks/useHabitLogs'
import { useWellness } from './hooks/useWellness'

const TABS = ['Tracker', 'Stats', 'Wellness']

function Toast({ message, type }) {
  return (
    <div className={`toast ${type}`}>{message}</div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tracker')
  const [toasts, setToasts] = useState([])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const userId = session?.user?.id

  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit } = useHabits(userId)
  const { logs, loading: logsLoading, toggleLog, isChecked } = useHabitLogs(userId, year, month)
  const { wellnessData, upsertWellness, getByDate } = useWellness(userId, year, month)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleMonthChange = (y, m) => {
    setYear(y)
    setMonth(m)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const handleAddHabit = async (name, emoji) => {
    const result = await addHabit(name, emoji)
    if (result) showToast(`"${name}" added!`)
    else showToast('Failed to add habit', 'error')
    return result
  }

  const handleDeleteHabit = async (id) => {
    const habit = habits.find(h => h.id === id)
    if (!window.confirm(`Delete "${habit?.name}"? All logs will be lost.`)) return
    await deleteHabit(id)
    showToast('Habit deleted')
  }

  if (sessionLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="app-layout">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span style={{ fontSize: 20 }}>🎮</span>
          <div>
            <div className="app-title">Habit Game Tracker</div>
            <div className="app-subtitle">{MONTHS[month - 1]} {year}</div>
          </div>
        </div>
        <div className="top-bar-right">
          <span className="user-email">{session.user.email}</span>
          <button className="btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="nav-tabs" aria-label="Main navigation">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`nav-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab === 'Tracker' && '📋 '}
            {tab === 'Stats' && '📊 '}
            {tab === 'Wellness' && '💤 '}
            {tab}
          </button>
        ))}
      </nav>

      {/* Month Navigator */}
      <MonthNav year={year} month={month} onChange={handleMonthChange} />

      {/* Content */}
      {activeTab === 'Tracker' && (
        <div className="main-content">
          <HabitSidebar
            habits={habits}
            loading={habitsLoading}
            onAdd={handleAddHabit}
            onUpdate={updateHabit}
            onDelete={handleDeleteHabit}
            logs={logs}
            year={year}
            month={month}
          />
          {logsLoading ? (
            <div className="habit-grid-container">
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading...</span>
              </div>
            </div>
          ) : (
            <HabitGrid
              habits={habits}
              logs={logs}
              year={year}
              month={month}
              onToggle={toggleLog}
            />
          )}
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className="stats-page">
          <div className="stats-top-row">
            <DailyProgressChart habits={habits} logs={logs} year={year} month={month} />
            <OverallStatsDonut habits={habits} logs={logs} year={year} month={month} />
            <div /> {/* spacer */}
          </div>
          <AnalysisTable habits={habits} logs={logs} year={year} month={month} />
          <TopHabits habits={habits} logs={logs} year={year} month={month} />
          <WellnessChart wellnessData={wellnessData} year={year} month={month} />
        </div>
      )}

      {activeTab === 'Wellness' && (
        <div className="wellness-page">
          <WellnessInput
            year={year}
            month={month}
            onSave={async (date, mood, sleep) => {
              const ok = await upsertWellness(date, mood, sleep)
              if (ok) showToast('Wellness logged!')
              else showToast('Failed to save', 'error')
              return ok
            }}
            getByDate={getByDate}
          />
          <WellnessChart wellnessData={wellnessData} year={year} month={month} />
        </div>
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
        </div>
      )}
    </div>
  )
}
