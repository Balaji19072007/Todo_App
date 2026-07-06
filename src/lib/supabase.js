import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcjfegrfcbldvppwrkgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjamZlZ3JmY2JsZHZwcHdya2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjgwMjksImV4cCI6MjA5ODkwNDAyOX0.dZl2NSu9zpfWg8VFSyYjkEsK1K6NUePJ9ngGVk8_VG8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
