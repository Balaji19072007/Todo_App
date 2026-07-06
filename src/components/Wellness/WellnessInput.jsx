import { useState } from 'react'

export default function WellnessInput({ year, month, onSave, getByDate }) {
  const today = new Date()
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [date, setDate] = useState(defaultDate)
  const [mood, setMood] = useState(7)
  const [sleep, setSleep] = useState(7)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const ok = await onSave(date, mood, sleep)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const moodEmoji = mood <= 3 ? '😞' : mood <= 5 ? '😐' : mood <= 7 ? '🙂' : mood <= 9 ? '😊' : '🤩'

  return (
    <div className="wellness-form-card">
      <div className="stats-card-header">Log Today&apos;s Wellness</div>
      <div className="wellness-form-grid">
        <div className="wellness-input-group">
          <label htmlFor="mood-slider">Mood — {moodEmoji} {mood}/10</label>
          <input
            id="mood-slider"
            type="range"
            className="mood-slider"
            min={1}
            max={10}
            value={mood}
            onChange={e => setMood(Number(e.target.value))}
          />
          <div className="mood-labels">
            <span>Terrible</span>
            <span>Amazing</span>
          </div>
        </div>
        <div className="wellness-input-group">
          <label htmlFor="sleep-input">Hours of Sleep 💤</label>
          <input
            id="sleep-input"
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleep}
            onChange={e => setSleep(e.target.value)}
            style={{ maxWidth: 100 }}
          />
        </div>
      </div>
      <div className="wellness-date-select">
        <label htmlFor="wellness-date">Date</label>
        <input
          id="wellness-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          className="wellness-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
