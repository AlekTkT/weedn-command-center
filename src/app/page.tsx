'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Users, TrendingUp, Package,
  Mail, BarChart3, Settings, RefreshCw,
  Bot, Zap, Target, MessageSquare
} from 'lucide-react'
import AgentCard from '@/components/AgentCard'
import MetricCard from '@/components/MetricCard'
import AgentGrid2D from '@/components/AgentGrid2D'
import ActivityFeed from '@/components/ActivityFeed'
import ObjectiveTracker from '@/components/ObjectiveTracker'
import AgentPromptPanel from '@/components/AgentPromptPanel'
import AlertsBanner from '@/components/AlertsBanner'
import SuppliersPanel from '@/components/SuppliersPanel'
import { Truck } from 'lucide-react'

// Données des agents (depuis tiles.json)
const agents = [
  { id: 'weedn-central', name: 'Chef d\'Orchestre', icon: '👑', status: 'online' as const, color: '#059669', q: 0, r: 0, tasksCompleted: 51, tasksTotal: 60, level: 5, xp: 950 },
  { id: 'agent-seo', name: 'Agent SEO', icon: '🔍', status: 'online' as const, color: '#10B981', q: 1, r: 0, tasksCompleted: 8, tasksTotal: 12, level: 2, xp: 450 },
  { id: 'agent-contenu', name: 'Agent Contenu', icon: '📝', status: 'online' as const, color: '#8B5CF6', q: 1, r: -1, tasksCompleted: 14, tasksTotal: 20, level: 2, xp: 466 },
  { id: 'agent-ventes', name: 'Agent Ventes', icon: '💰', status: 'online' as const, color: '#3B82F6', q: 0, r: -1, tasksCompleted: 22, tasksTotal: 25, level: 4, xp: 890 },
  { id: 'agent-support', name: 'Agent Support', icon: '💬', status: 'online' as const, color: '#F59E0B', q: -1, r: 1, tasksCompleted: 5, tasksTotal: 15, level: 2, xp: 380 },
  { id: 'agent-inventaire', name: 'Agent Inventaire', icon: '📦', status: 'online' as const, color: '#EF4444', q: -1, r: 0, tasksCompleted: 2, tasksTotal: 10, level: 1, xp: 120 },
  { id: 'agent-shopify', name: 'Agent Shopify', icon: '🛍️', status: 'idle' as const, color: '#EC4899', q: 0, r: 1, tasksCompleted: 0, tasksTotal: 8, level: 1, xp: 0 },
  { id: 'agent-email', name: 'Agent Email', icon: '📧', status: 'idle' as const, color: '#06B6D4', q: -1, r: -1, tasksCompleted: 3, tasksTotal: 10, level: 1, xp: 100 },
  { id: 'agent-analytics', name: 'Agent Analytics', icon: '📊', status: 'idle' as const, color: '#8B5CF6', q: 1, r: 1, tasksCompleted: 5, tasksTotal: 15, level: 1, xp: 80 },
]

// Activités récentes simulées
const recentActivities = [
  { id: '1', agent: 'Agent Support', agentIcon: '💬', action: 'Répondu à 3 emails clients', result: 'success' as const, timestamp: 'Il y a 2min' },
  { id: '2', agent: 'Agent Ventes', agentIcon: '💰', action: 'Analyse panier moyen complétée', result: 'success' as const, timestamp: 'Il y a 5min' },
  { id: '3', agent: 'Agent SEO', agentIcon: '🔍', action: 'Audit mots-clés "CBD Paris"', result: 'success' as const, timestamp: 'Il y a 12min' },
  { id: '4', agent: 'Agent Contenu', agentIcon: '📝', action: 'Article blog en cours de rédaction', result: 'pending' as const, timestamp: 'Il y a 15min' },
  { id: '5', agent: 'Agent Inventaire', agentIcon: '📦', action: 'Alerte stock faible: Bonbons D9', result: 'error' as const, timestamp: 'Il y a 20min', details: '6 unités restantes' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'claude' | 'suppliers' | 'analytics' | 'config'>('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const agentsOnline = agents.filter(a => a.status === 'online').length

  return (
    <div className="min-h-screen">
      {/* Alertes urgentes */}
      <AlertsBanner />

      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌿</span>
              <div>
                <h1 className="text-xl font-bold text-white">Weedn Command Center</h1>
                <p className="text-xs text-gray-400">Pilotage IA • Objectif +40% CA</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full status-online" />
                <span className="text-sm text-emerald-400">{agentsOnline}/9 agents actifs</span>
              </div>

              <motion.button
                whileTap={{ rotate: 360 }}
                onClick={handleRefresh}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} size={20} />
              </motion.button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'agents', label: 'Agents', icon: Bot },
              { id: 'claude', label: 'Claude', icon: MessageSquare },
              { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'config', label: 'Config', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Objectif principal */}
            <ObjectiveTracker
              currentCA={45000}
              targetCA={63000}
              startDate="18 Jan"
              endDate="18 Avr"
              daysElapsed={2}
              totalDays={90}
            />

            {/* KPIs rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="CA Aujourd'hui"
                value="€847"
                trend="up"
                trendValue="+23%"
                icon={<ShoppingCart size={18} />}
              />
              <MetricCard
                title="Commandes"
                value="18"
                trend="up"
                trendValue="+5"
                icon={<Package size={18} />}
              />
              <MetricCard
                title="Panier Moyen"
                value="€47"
                trend="up"
                trendValue="+€4"
                icon={<TrendingUp size={18} />}
              />
              <MetricCard
                title="Visiteurs"
                value="324"
                trend="stable"
                trendValue="~0%"
                icon={<Users size={18} />}
              />
            </div>

            {/* Grid 2 colonnes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Vue 2D des agents */}
              <AgentGrid2D
                agents={agents}
                onAgentClick={(agent) => console.log('Agent clicked:', agent)}
              />

              {/* Feed d'activité */}
              <ActivityFeed activities={recentActivities} />
            </div>

            {/* Actions rapides */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-yellow-400" size={18} />
                <h3 className="font-semibold text-white">Actions rapides</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '📧', label: 'Lancer campagne email', color: 'blue' },
                  { icon: '📝', label: 'Créer article blog', color: 'purple' },
                  { icon: '🎁', label: 'Nouvelle promo', color: 'pink' },
                  { icon: '📊', label: 'Générer rapport', color: 'emerald' },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl bg-${action.color}-500/10 border border-${action.color}-500/20 hover:border-${action.color}-500/50 transition-all`}
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="text-sm text-white">{action.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Équipe d'Agents IA</h2>
              <div className="text-sm text-gray-400">
                {agentsOnline} actifs • {agents.reduce((sum, a) => sum + a.tasksCompleted, 0)} tâches complétées
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  {...agent}
                  onClick={() => console.log('Open agent:', agent.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'claude' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🤖 Console Claude</h2>
              <div className="text-sm text-gray-400">
                Communiquez directement avec les agents IA
              </div>
            </div>
            <AgentPromptPanel agents={agents} />
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🚚 Fournisseurs</h2>
              <div className="text-sm text-gray-400">
                Gérez vos fournisseurs et leurs produits phares
              </div>
            </div>
            <SuppliersPanel />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 Analytics</h2>
            <p className="text-gray-400">
              Connexion à Google Analytics 4 et Shopify en cours...
            </p>
            <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-emerald-400 text-sm">
                ✓ GA4 Property ID: properties/450777440<br/>
                ✓ Stream: weedn.fr (8489082656)<br/>
                ✓ Shopify: f24081-64.myshopify.com
              </p>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">⚙️ Configuration</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'Shopify', status: 'Connecté', icon: '🛍️', details: 'f24081-64.myshopify.com' },
                { name: 'Google Analytics', status: 'Connecté', icon: '📊', details: 'Property 450777440' },
                { name: 'Klaviyo', status: 'Connecté', icon: '📧', details: 'Email marketing actif' },
                { name: 'Make.com', status: 'Connecté', icon: '⚡', details: '3 scénarios actifs' },
                { name: 'Google Drive', status: 'Connecté', icon: '📁', details: 'cbdoshop75@gmail.com' },
                { name: 'Supabase', status: 'Connecté', icon: '🗄️', details: 'cmgpflxqunkrrbndtnne' },
                { name: 'Claude API', status: 'Connecté', icon: '🤖', details: 'Anthropic claude-sonnet-4' },
              ].map((service) => (
                <div key={service.name} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <div className="font-medium text-white">{service.name}</div>
                        <div className="text-xs text-gray-400">{service.details}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      service.status === 'Connecté'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {service.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
