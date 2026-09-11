import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oqdngfhupadfirmsfbfj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZG5nZmh1cGFkZmlybXNmYmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTQ0MzgsImV4cCI6MjEwNDY5MDQzOH0.JPlKEtFJDoyUlkO2JSkx804o5JT1OyefFftfcqnMOMk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)