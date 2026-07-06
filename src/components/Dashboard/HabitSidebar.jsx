import { useState } from 'react'

export default function HabitSidebar({ habits, loading, onAdd, onUpdate, onDelete, logs, year, month }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmoji, setAddEmoji] = useState('')
  const [editHabit, setEditHabit] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  const daysInMonth = new Date(year, month, 0).getDate()

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addName.trim()) return
    await onAdd(addName.trim(), addEmoji.trim())
    setAddName('')
    setAddEmoji('')
    setShowAddForm(false)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    await onUpdate(editHabit.id, { name: editName.trim(), emoji: editEmoji.trim() })
    setEditHabit(null)
  }

  const getMonthlyPct = (habitId) => {
    let done = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (logs[`${habitId}_${dateStr}`]) done++
    }
    return Math.round((done / daysInMonth) * 100)
  }

  const totalGoal = habits.length * daysInMonth
  const totalDone = habits.reduce((sum, h) => {
    let done = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (logs[`${h.id}_${dateStr}`]) done++
    }
    return sum + done
  }, 0)
  const overallPct = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0

  return (
    <aside className="habit-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">My Habits</span>
        <button
          className="btn-add-habit"
          onClick={() => setShowAddForm(v => !v)}
          aria-label="Add habit"
          title="Add new habit"
        >
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state" style={{ height: 120 }}>
          <div className="spinner" />
        </div>
      ) : (
        <ul className="habit-list" style={{ listStyle: 'none' }}>
          {habits.map((h, i) => (
            <li key={h.id} className="habit-item">
              <span className="habit-item-number">{i + 1}</span>
              <span className="habit-item-emoji">{h.emoji || '·'}</span>
              <span className="habit-item-name" title={h.name}>{h.name}</span>
              <span className="habit-item-actions">
                <button
                  className="habit-action-btn"
                  onClick={() => { setEditHabit(h); setEditName(h.name); setEditEmoji(h.emoji || '') }}
                  aria-label={`Edit ${h.name}`}
                  title="Edit"
                >✎</button>
                <button
                  className="habit-action-btn delete"
                  onClick={() => onDelete(h.id)}
                  aria-label={`Delete ${h.name}`}
                  title="Delete"
                >✕</button>
              </span>
            </li>
          ))}
          {habits.length === 0 && !showAddForm && (
            <li>
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No habits yet</div>
                <div className="empty-state-hint">Click + to add your first habit</div>
              </div>
            </li>
          )}
        </ul>
      )}

      {showAddForm && (
        <form className="add-habit-form" onSubmit={handleAdd}>
          <div className="add-habit-row">
            <input
              className="add-habit-emoji-input"
              type="text"
              value={addEmoji}
              onChange={e => setAddEmoji(e.target.value)}
              placeholder="🔥"
              maxLength={2}
              aria-label="Emoji"
            />
            <input
              className="add-habit-name-input"
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="Habit name..."
              autoFocus
              aria-label="Habit name"
            />
          </div>
          <div className="add-habit-btns">
            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn-save" disabled={!addName.trim()}>Add</button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editHabit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditHabit(null)}>
          <div className="modal-card">
            <div className="modal-title">Edit Habit</div>
            <form className="modal-form" onSubmit={handleEdit}>
              <div className="add-habit-row">
                <input
                  className="add-habit-emoji-input"
                  type="text"
                  value={editEmoji}
                  onChange={e => setEditEmoji(e.target.value)}
                  placeholder="🔥"
                  maxLength={2}
                  aria-label="Emoji"
                />
                <input
                  className="add-habit-name-input"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Habit name..."
                  autoFocus
                  aria-label="Habit name"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditHabit(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={!editName.trim()}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="sidebar-footer">
        <div className="sidebar-stat">
          <span className="sidebar-stat-label">Goal</span>
          <span className="sidebar-stat-value">{totalGoal}</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-label">Done</span>
          <span className="sidebar-stat-value">{totalDone}</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-label">Left</span>
          <span className="sidebar-stat-value">{totalGoal - totalDone}</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-label">Progress</span>
          <span className={`sidebar-stat-value${overallPct >= 80 ? ' highlight' : ''}`}>{overallPct}%</span>
        </div>
      </div>
    </aside>
  )
}
