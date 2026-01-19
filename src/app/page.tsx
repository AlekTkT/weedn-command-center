'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Users, TrendingUp, Package,
  Mail, BarChart3, Settings, RefreshCw,
  Bot, Zap, Target, MessageSquare, Loader2
} from 'lucide-react'
import AgentCard from '@/components/AgentCard'
import MetricCard from '@/components/MetricCard'
import AgentGrid2D from '@/components/AgentGrid2D'
import ActivityFeed from '@/components/ActivityFeed'
import ObjectiveTracker from '@/components/ObjectiveTracker'
import AgentPromptPanel from '@/components/AgentPromptPanel'
import AlertsBanner from '@/components/AlertsBanner'
import SuppliersPanel from '@/components/SuppliersPanel'
import AgentTasksPanel from '@/components/AgentTasksPanel'
import { Truck, ExternalLink, Wrench } from 'lucide-react'

// Types pour les données du dashboard
interface DashboardData {
  shopify: {
    shop: { name: string; currency: string };
    revenue: {
      today: string;
      yesterday: string;
      last7Days: string;
      last30Days: string;
      avgOrderValue: string;
    };
    orders: {
      today: number;
      yesterday: number;
      last7Days: number;
      total: number;
      recent: any[];
    };
    products: {
      total: number;
      active: number;
      lowStock: number;
      outOfStock: number;
      lowStockItems: any[];
    };
    customers: {
      total: number;
      newLast30Days: number;
    };
  };
  generatedAt: string;
}

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
  { id: 'agent-factures', name: 'Agent Factures', icon: '🧾', status: 'online' as const, color: '#7C3AED', q: 2, r: 0, tasksCompleted: 0, tasksTotal: 5, level: 1, xp: 0 },
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch des données réelles
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Erreur de chargement')
      const result = await response.json()
      if (result.success && result.data) {
        setDashboardData(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger les données au montage et toutes les 60 secondes
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData().finally(() => setIsRefreshing(false))
  }

  // Calculs des métriques
  const todayRevenue = dashboardData?.shopify?.revenue?.today || '0'
  const todayOrders = dashboardData?.shopify?.orders?.today || 0
  const avgOrderValue = dashboardData?.shopify?.revenue?.avgOrderValue || '0'
  const totalCustomers = dashboardData?.shopify?.customers?.total || 0

  // Comparaisons avec hier
  const yesterdayRevenue = parseFloat(dashboardData?.shopify?.revenue?.yesterday || '0')
  const revenueChange = yesterdayRevenue > 0
    ? Math.round(((parseFloat(todayRevenue) - yesterdayRevenue) / yesterdayRevenue) * 100)
    : 0
  const yesterdayOrders = dashboardData?.shopify?.orders?.yesterday || 0
  const ordersChange = todayOrders - yesterdayOrders

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
                <span className="text-sm text-emerald-400">{agentsOnline}/{agents.length} agents actifs</span>
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
            {/* Objectif principal - CA 30 jours réel */}
            <ObjectiveTracker
              currentCA={parseFloat(dashboardData?.shopify?.revenue?.last30Days || '45000')}
              targetCA={63000}
              startDate="18 Jan"
              endDate="18 Avr"
              daysElapsed={Math.floor((Date.now() - new Date('2025-01-18').getTime()) / (1000 * 60 * 60 * 24))}
              totalDays={90}
            />

            {/* KPIs rapides - Données réelles Shopify */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="CA Aujourd'hui"
                value={isLoading ? '...' : `€${parseFloat(todayRevenue).toFixed(0)}`}
                trend={revenueChange >= 0 ? 'up' : 'down'}
                trendValue={revenueChange >= 0 ? `+${revenueChange}%` : `${revenueChange}%`}
                icon={isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              />
              <MetricCard
                title="Commandes"
                value={isLoading ? '...' : todayOrders.toString()}
                trend={ordersChange >= 0 ? 'up' : 'down'}
                trendValue={ordersChange >= 0 ? `+${ordersChange}` : ordersChange.toString()}
                icon={<Package size={18} />}
              />
              <MetricCard
                title="Panier Moyen"
                value={isLoading ? '...' : `€${parseFloat(avgOrderValue).toFixed(0)}`}
                trend="stable"
                trendValue="global"
                icon={<TrendingUp size={18} />}
              />
              <MetricCard
                title="Clients"
                value={isLoading ? '...' : totalCustomers.toString()}
                trend="up"
                trendValue={`+${dashboardData?.shopify?.customers?.newLast30Days || 0}/30j`}
                icon={<Users size={18} />}
              />
            </div>

            {/* Indicateur de dernière mise à jour */}
            {dashboardData?.generatedAt && (
              <div className="text-xs text-gray-500 text-right">
                Dernière MAJ: {new Date(dashboardData.generatedAt).toLocaleTimeString('fr-FR')}
                {error && <span className="text-red-400 ml-2">⚠️ {error}</span>}
              </div>
            )}

            {/* Grid 2 colonnes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Vue 2D des agents */}
              <AgentGrid2D
                agents={agents}
                onAgentClick={(agent) => {
                  setActiveTab('claude')
                }}
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
                  { icon: '📧', label: 'Lancer campagne email', color: 'blue', action: 'email' },
                  { icon: '📝', label: 'Créer article blog', color: 'purple', action: 'blog' },
                  { icon: '🎁', label: 'Nouvelle promo', color: 'pink', action: 'promo' },
                  { icon: '📊', label: 'Générer rapport', color: 'emerald', action: 'rapport' },
                ].map((item) => (
                  <motion.button
                    key={item.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={actionLoading === item.action}
                    onClick={() => setActiveTab('claude')}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      item.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50' :
                      item.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50' :
                      item.color === 'pink' ? 'bg-pink-500/10 border-pink-500/20 hover:border-pink-500/50' :
                      'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50'
                    } ${actionLoading === item.action ? 'opacity-50' : ''}`}
                  >
                    <div className="text-2xl mb-2">{actionLoading === item.action ? '⏳' : item.icon}</div>
                    <div className="text-sm text-white">{item.label}</div>
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
                {agentsOnline} actifs • Tâches distribuées automatiquement
              </div>
            </div>

            {/* Panneau des tâches avec metaprompts */}
            <AgentTasksPanel
              agents={agents}
              onExecuteTask={(task) => {
                setActiveTab('claude')
              }}
            />

            {/* Liste compacte des agents */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Agents disponibles</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveTab('claude')}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-white truncate">{agent.name.replace('Agent ', '')}</div>
                      <div className={`text-xs ${agent.status === 'online' ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {agent.status === 'online' ? '● Actif' : '○ Inactif'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">📊 Analytics & KPIs</h2>

            {/* KPIs principaux */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">CA 30 jours</div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : `€${parseFloat(dashboardData?.shopify?.revenue?.last30Days || '0').toLocaleString('fr-FR')}`}
                </div>
                <div className="text-xs text-emerald-400 mt-1">Objectif: €63,000</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Commandes 7j</div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : dashboardData?.shopify?.orders?.last7Days || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total: {dashboardData?.shopify?.orders?.total || 0}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Panier moyen</div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : `€${parseFloat(avgOrderValue).toFixed(0)}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">Cible: €50+</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Clients actifs</div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : totalCustomers}
                </div>
                <div className="text-xs text-emerald-400 mt-1">+{dashboardData?.shopify?.customers?.newLast30Days || 0} ce mois</div>
              </div>
            </div>

            {/* Données sources */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">🛍️</span>
                  Shopify Analytics
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Produits actifs</span>
                    <span className="text-white">{dashboardData?.shopify?.products?.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock faible</span>
                    <span className="text-orange-400">{dashboardData?.shopify?.products?.lowStock || 0} produits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ruptures</span>
                    <span className="text-red-400">{dashboardData?.shopify?.products?.outOfStock || 0} produits</span>
                  </div>
                </div>
                <a
                  href="https://admin.shopify.com/store/f24081-64/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                >
                  Voir sur Shopify <ExternalLink size={12} />
                </a>
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Google Analytics 4
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Property ID</span>
                    <span className="text-white">450777440</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stream</span>
                    <span className="text-white">weedn.fr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Statut</span>
                    <span className="text-emerald-400">Connecté</span>
                  </div>
                </div>
                <a
                  href="https://analytics.google.com/analytics/web/#/p450777440"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                >
                  Voir sur GA4 <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Dernières commandes */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">Dernières commandes</h3>
              <div className="space-y-2">
                {(dashboardData?.shopify?.orders?.recent || []).slice(0, 5).map((order: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{order.number}</span>
                      <span className="text-white">{order.total}€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        order.financialStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.financialStatus}
                      </span>
                      <span className="text-xs text-gray-500">{order.customerEmail || 'Sans email'}</span>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.shopify?.orders?.recent || dashboardData.shopify.orders.recent.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-4">Aucune commande récente</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">⚙️ Configuration & Outils</h2>

            {/* Services connectés */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Services connectés
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Shopify', status: 'Connecté', icon: '🛍️', details: 'f24081-64.myshopify.com', url: 'https://admin.shopify.com/store/f24081-64' },
                  { name: 'Google Analytics', status: 'Connecté', icon: '📊', details: 'Property 450777440', url: 'https://analytics.google.com' },
                  { name: 'Klaviyo', status: 'Connecté', icon: '📧', details: 'Email marketing', url: 'https://www.klaviyo.com' },
                  { name: 'Make.com', status: 'Connecté', icon: '⚡', details: 'Automatisations', url: 'https://eu1.make.com' },
                  { name: 'Gmail MCP', status: 'Connecté', icon: '📬', details: 'cbdoshop75 + theonlyweedn', url: null },
                  { name: 'Supabase', status: 'Connecté', icon: '🗄️', details: 'Base de données', url: 'https://supabase.com/dashboard' },
                  { name: 'Claude API', status: 'Connecté', icon: '🤖', details: 'claude-sonnet-4', url: null },
                ].map((service) => (
                  <div key={service.name} className="glass rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{service.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-white">{service.name}</div>
                          <div className="text-xs text-gray-500">{service.details}</div>
                        </div>
                      </div>
                      {service.url && (
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} className="text-gray-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outils recommandés pour croissance CA */}
            <div>
              <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <Wrench size={14} />
                Outils recommandés pour +40% CA
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Meta Business Suite',
                    description: 'Instagram vérifié + WhatsApp Business API pour atteindre plus de clients',
                    priority: 'Essentiel',
                    status: 'À configurer',
                    url: 'https://business.facebook.com',
                    icon: '📱'
                  },
                  {
                    name: 'Google Merchant Center',
                    description: 'Shopping Ads pour apparaître sur Google avec vos produits CBD',
                    priority: 'Important',
                    status: 'Recommandé',
                    url: 'https://merchants.google.com',
                    icon: '🛒'
                  },
                  {
                    name: 'Hotjar / Microsoft Clarity',
                    description: 'Heatmaps et enregistrements pour comprendre le comportement utilisateur',
                    priority: 'Utile',
                    status: 'Recommandé',
                    url: 'https://clarity.microsoft.com',
                    icon: '🔥'
                  },
                  {
                    name: 'Trustpilot',
                    description: 'Collecter et afficher les avis clients pour augmenter la confiance',
                    priority: 'Important',
                    status: 'Recommandé',
                    url: 'https://business.trustpilot.com',
                    icon: '⭐'
                  },
                  {
                    name: 'Semrush / Ahrefs',
                    description: 'SEO avancé pour dominer "CBD Paris" et mots-clés associés',
                    priority: 'Utile',
                    status: 'Optionnel',
                    url: 'https://www.semrush.com',
                    icon: '🔍'
                  },
                  {
                    name: 'Notion / Coda',
                    description: 'Documentation et processus équipe centralisés',
                    priority: 'Utile',
                    status: 'Optionnel',
                    url: 'https://notion.so',
                    icon: '📋'
                  },
                ].map((tool) => (
                  <div key={tool.name} className="glass rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <div className="font-medium text-white">{tool.name}</div>
                          <p className="text-xs text-gray-400 mt-1">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        tool.priority === 'Essentiel'
                          ? 'bg-red-500/20 text-red-400'
                          : tool.priority === 'Important'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tool.priority}
                      </span>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Découvrir <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info entreprise */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Informations entreprise</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Raison sociale</div>
                  <div className="text-white font-medium">RETAR DIO</div>
                </div>
                <div>
                  <div className="text-gray-500">SIRET</div>
                  <div className="text-white font-medium">98853449100010</div>
                </div>
                <div>
                  <div className="text-gray-500">Adresse</div>
                  <div className="text-white">4 rue Tiquetonne, 75002 PARIS</div>
                </div>
                <div>
                  <div className="text-gray-500">Dirigeant</div>
                  <div className="text-white">Alexandre Courthieu</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
