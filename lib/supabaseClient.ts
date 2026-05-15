import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || 'https://placeholder.supabase.co'
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// CRM Supabase Client
const crmUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL_CRM as string) || 'https://placeholder.supabase.co'
const crmAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CRM as string) || 'placeholder'

export const supabaseCRM = createClient(crmUrl, crmAnonKey)
