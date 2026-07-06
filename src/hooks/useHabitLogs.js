import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHabitLogs(userId, year, month) {
  const [logs, setLogs] = useState({}) // key: "habitId_YYYY-MM-DD" -> boolean
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)

    if (!error) {
      const map = {}
      for (const row of (data || [])) {
        map[`${row.habit_id}_${row.log_date}`] = row.completed
      }
      setLogs(map)
    }
    setLoading(false)
  }, [userId, year, month])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const toggleLog = async (habitId, dateStr, currentValue) => {
    const key = `${habitId}_${dateStr}`
    const newValue = !currentValue

    // Optimistic update
    setLogs(prev => ({ ...prev, [key]: newValue }))

    const { error } = await supabase
      .from('habit_logs')
      .upsert({
        user_id: userId,
        habit_id: habitId,
        log_date: dateStr,
        completed: newValue
      }, { onConflict: 'habit_id,log_date' })

    if (error) {
      // Rollback
      setLogs(prev => ({ ...prev, [key]: currentValue }))
      console.error('Toggle error:', error)
    }
  }

  const isChecked = (habitId, dateStr) => {
    return !!logs[`${habitId}_${dateStr}`]
  }

  // Compute stats
  const getDayStats = (dateStr, habitIds) => {
    const total = habitIds.length
    if (total === 0) return 0
    const done = habitIds.filter(id => isChecked(id, dateStr)).length
    return Math.round((done / total) * 100)
  }

  const getHabitStats = (habitId, daysInMonth, year, month) => {
    let completed = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (isChecked(habitId, dateStr)) completed++
    }
    return completed
  }

  return { logs, loading, toggleLog, isChecked, getDayStats, getHabitStats, refetch: fetchLogs }
}
