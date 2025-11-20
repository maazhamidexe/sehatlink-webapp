import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpifquoelejdrtlqycsj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaWZxdW9lbGVqZHJ0bHF5Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODM4NTEsImV4cCI6MjA3Nzc1OTg1MX0.9xJjAStrw9z28lg0GOrFneJs7ckJiYnmzdwS_gz581M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

