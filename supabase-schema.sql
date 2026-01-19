-- Schema Supabase pour Weedn Command Center
-- Exécuter dans Supabase SQL Editor

-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- Agents IA
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'offline', 'working')),
  color TEXT,
  q INTEGER DEFAULT 0,
  r INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  current_task TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Métriques business
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  unit TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  source TEXT,
  period TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tâches
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT REFERENCES agents(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  action TEXT NOT NULL,
  result TEXT DEFAULT 'success' CHECK (result IN ('success', 'error', 'pending')),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Objectifs
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions utilisateur (pour auth privée)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insérer les agents
INSERT INTO agents (id, name, icon, status, color, q, r, tasks_completed, tasks_total, level, xp) VALUES
  ('weedn-central', 'Chef d''Orchestre', '👑', 'online', '#059669', 0, 0, 51, 60, 5, 950),
  ('agent-seo', 'Agent SEO', '🔍', 'online', '#10B981', 1, 0, 8, 12, 2, 450),
  ('agent-contenu', 'Agent Contenu', '📝', 'online', '#8B5CF6', 1, -1, 14, 20, 2, 466),
  ('agent-ventes', 'Agent Ventes', '💰', 'online', '#3B82F6', 0, -1, 22, 25, 4, 890),
  ('agent-support', 'Agent Support', '💬', 'online', '#F59E0B', -1, 1, 5, 15, 2, 380),
  ('agent-inventaire', 'Agent Inventaire', '📦', 'online', '#EF4444', -1, 0, 2, 10, 1, 120),
  ('agent-shopify', 'Agent Shopify', '🛍️', 'idle', '#EC4899', 0, 1, 0, 8, 1, 0),
  ('agent-email', 'Agent Email', '📧', 'idle', '#06B6D4', -1, -1, 3, 10, 1, 100),
  ('agent-analytics', 'Agent Analytics', '📊', 'idle', '#8B5CF6', 1, 1, 5, 15, 1, 80)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  tasks_completed = EXCLUDED.tasks_completed,
  level = EXCLUDED.level,
  xp = EXCLUDED.xp;

-- Objectif principal
INSERT INTO objectives (name, target_value, current_value, unit, start_date, end_date) VALUES
  ('CA +40%', 63000, 45000, 'EUR', '2026-01-18', '2026-04-18');

-- Utilisateur admin initial
INSERT INTO user_sessions (user_email, is_admin) VALUES
  ('theonlyweedn@gmail.com', true),
  ('cbdoshop75@gmail.com', true);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activer RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (accès restreint aux utilisateurs authentifiés)
CREATE POLICY "Users can view agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Users can view metrics" ON metrics FOR SELECT USING (true);
CREATE POLICY "Users can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can view activity" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Users can view objectives" ON objectives FOR SELECT USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can modify agents" ON agents FOR ALL USING (
  EXISTS (SELECT 1 FROM user_sessions WHERE user_email = auth.jwt()->>'email' AND is_admin = true)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_agent ON activity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp DESC);
