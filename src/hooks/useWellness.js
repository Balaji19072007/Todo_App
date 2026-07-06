import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWellness(userId, year, month) {
  const [wellnessData, setWellnessData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWellness = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('wellness_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true })

    if (!error) setWellnessData(data || [])
    setLoading(false)
  }, [userId, year, month])

  useEffect(() => {
    fetchWellness()
  }, [fetchWellness])

  const upsertWellness = async (dateStr, mood, hoursOfSleep) => {
    const { error } = await supabase
      .from('wellness_logs')
      .upsert({
        user_id: userId,
        log_date: dateStr,
        mood: mood ? parseInt(mood) : null,
        hours_of_sleep: hoursOfSleep ? parseFloat(hoursOfSleep) : null
      }, { onConflict: 'user_id,log_date' })

    if (!error) fetchWellness()
    return !error
  }

  const getByDate = (dateStr) => {
    return wellnessData.find(w => w.log_date === dateStr) || null
  }

  return { wellnessData, loading, upsertWellness, getByDate, refetch: fetchWellness }
}
