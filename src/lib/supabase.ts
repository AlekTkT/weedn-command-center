import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
