import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Fonction pour obtenir le client Supabase de manière sécurisée (runtime)
export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL ou Key non configurée')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Client Supabase lazy (pour compatibilité)
// Note: Peut être null au build time, utiliser getSupabaseClient() pour les routes API
let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient()
    }
    if (!_supabase) {
      throw new Error('Supabase non configuré')
    }
    return (_supabase as any)[prop]
  }
})

// Types pour la base de données Weedn
export interface Agent {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  tasks_completed: number
  tasks_total: number
  level: number
  xp: number
  last_activity: string
  current_task?: string
}

export interface Metric {
  id: string
  name: string
  value: number
  previous_value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  source: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  agent_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  completed_at?: string
}

export interface ActivityLog {
  id: string
  agent_id: string
  action: string
  result: 'success' | 'error' | 'pending'
  details?: string
  timestamp: string
}
