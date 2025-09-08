import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ilynsedklhhvfbcwibys.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseW5zZWRrbGhodmZiY3dpYnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTg2NjMsImV4cCI6MjA3MjgzNDY2M30.UeArbwMyRZtFo8hXDMCosrdDzJrEJndP8ZKzH19S51M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)