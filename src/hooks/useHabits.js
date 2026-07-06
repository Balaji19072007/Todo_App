import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHabits(userId) {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setHabits(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const addHabit = async (name, emoji = '') => {
    if (!userId || !name.trim()) return null
    const { data, error } = await supabase
      .from('habits')
      .insert([{ user_id: userId, name: name.trim(), emoji, sort_order: habits.length }])
      .select()
      .single()
    if (!error && data) {
      setHabits(prev => [...prev, data])
      return data
    }
    return null
  }

  const updateHabit = async (id, updates) => {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (!error && data) {
      setHabits(prev => prev.map(h => h.id === id ? data : h))
    }
  }

  const deleteHabit = async (id) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (!error) {
      setHabits(prev => prev.filter(h => h.id !== id))
    }
  }

  return { habits, loading, addHabit, updateHabit, deleteHabit, refetch: fetchHabits }
}
