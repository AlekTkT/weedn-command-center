'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, TrendingUp, Package, Users,
  ExternalLink, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Zap, Target, TrendingDown, CheckCircle2
} from 'lucide-react'

interface Recommendation {
  id: string
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: {
    metric: string
    value: number
    timeframe: string
    confidence: number
  }
  suggestedAction?: {
    type: string
    parameters: Record<string, unknown>
  }
}

// Objectif mensuel Weedn
const MONTHLY_TARGET = 54508 // €54,508/mois
const MONTHLY_GROWTH_TARGET = 6.92 // 6.92%/mois

interface MetricsState {
  // Aujourd'hui
  todayRevenue: number
  todayOrders: number
  // Mois
  monthRevenue: number
  monthOrders: number
  // Shopify vs Boutique
  shopifyRevenue: number
  shopifyOrders: number
  storeRevenue: number
  storeTransactions: number
  // Evolution
  vsYesterday: number
  vsLastWeek: number
  // Produits
  totalProducts: number
  lowStock: number
  outOfStock: number
  // Clients
  totalCustomers: number
  newCustomers: number
  // État
  loading: boolean
  error: string | null
  lastUpdate: string | null
}

export default function WeednPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [totalPotential, setTotalPotential] = useState(0)

  const [metrics, setMetrics] = useState<MetricsState>({
    todayRevenue: 0,
    todayOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    shopifyRevenue: 0,
    shopifyOrders: 0,
    storeRevenue: 0,
    storeTransactions: 0,
    vsYesterday: 0,
    vsLastWeek: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalCustomers: 0,
    newCustomers: 0,
    loading: true,
    error: null,
    lastUpdate: null
  })

  const loadRecommendations = useCallback(async () => {
    try {
      setRecsLoading(true)
      const res = await fetch('/api/recommendations?filter=top&limit=5')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setRecommendations(json.data)
          setTotalPotential(json.totalPotential || 0)
        }
      }
    } catch (e) {
      console.error('Erreur chargement recommandations:', e)
    } finally {
      setRecsLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }))

      const res = await fetch('/api/combined-metrics')
      if (!res.ok) throw new Error(`Erreur API: ${res.status}`)

      const json = await res.json()
      if (!json.success || !json.data) throw new Error('Données invalides')

      const data = json.data

      // Calcul évolution vs hier
      const todayRev = data.combined?.today?.revenue || 0
      const yesterdayRev = data.combined?.yesterday?.revenue || 0
      const vsYesterday = yesterdayRev > 0
        ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100)
        : 0

      // Calcul évolution vs J-7
      const j7Rev = data.combined?.lastWeekSameDay?.revenue || data.store?.lastWeekSameDay?.revenue || 0
      const vsLastWeek = j7Rev > 0
        ? Math.round(((todayRev - j7Rev) / j7Rev) * 100)
        : 0

      setMetrics({
        todayRevenue: data.combined?.today?.revenue || 0,
        todayOrders: data.combined?.today?.orders || 0,
        monthRevenue: data.combined?.month?.revenue || 0,
        monthOrders: data.combined?.month?.orders || 0,
        shopifyRevenue: data.shopify?.month?.revenue || 0,
        shopifyOrders: data.shopify?.month?.orders || 0,
        storeRevenue: data.store?.month?.revenue || 0,
        storeTransactions: data.store?.month?.transactions || 0,
        vsYesterday,
        vsLastWeek,
        totalProducts: data.products?.total || 0,
        lowStock: data.products?.lowStock || 0,
        outOfStock: data.products?.outOfStock || 0,
        totalCustomers: data.customers?.total || 0,
        newCustomers: data.customers?.newLast30Days || 0,
        loading: false,
        error: null,
        lastUpdate: new Date().toLocaleTimeString('fr-FR')
      })
    } catch (e) {
      console.error('Erreur chargement metrics:', e)
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur inconnue'
      }))
    }
  }, [])

  useEffect(() => {
    loadData()
    loadRecommendations()
    // Refresh auto toutes les 5 minutes
    const interval = setInterval(() => {
      loadData()
      loadRecommendations()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData, loadRecommendations])

  const progress = metrics.monthRevenue > 0 ? (metrics.monthRevenue / MONTHLY_TARGET) * 100 : 0
  const remainingToTarget = Math.max(0, MONTHLY_TARGET - metrics.monthRevenue)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dayOfMonth = new Date().getDate()
  const expectedProgress = (dayOfMonth / daysInMonth) * 100
  const isOnTrack = progress >= expectedProgress

  // Formatter les nombres
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
              🌿
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">WEEDN</h1>
              <p className="text-sm text-gray-400">SASU RETAR DIO • CBD Paris</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={metrics.loading}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw size={14} className={metrics.loading ? 'animate-spin' : ''} />
              {metrics.lastUpdate || 'Actualiser'}
            </button>
            <a
              href="https://admin.shopify.com/store/f24081-64"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-500/30"
            >
              Shopify <ExternalLink size={14} />
            </a>
            <a href="/" className="text-sm text-gray-400 hover:text-white">
              ← Holdings
            </a>
          </div>
        </div>

        {/* Erreur si présente */}
        {metrics.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <span className="text-red-400">{metrics.error}</span>
          </div>
        )}

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* CA Aujourd'hui */}
          <div className="glass rounded-xl p-5 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">CA Aujourd'hui</span>
              {metrics.vsYesterday !== 0 && (
                <span className={`text-xs flex items-center gap-0.5 ${metrics.vsYesterday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.vsYesterday >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(metrics.vsYesterday)}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {metrics.loading ? '...' : formatCurrency(metrics.todayRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{metrics.todayOrders} commandes</div>
          </div>

          {/* CA Mois */}
          <div className="glass rounded-xl p-5 border border-emerald-500/30">
            <div className="text-xs text-gray-500 mb-2">CA Janvier</div>
            <div className="text-3xl font-bold text-white">
              {metrics.loading ? '...' : formatCurrency(metrics.monthRevenue)}
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              {progress.toFixed(0)}% de {formatCurrency(MONTHLY_TARGET)}
            </div>
          </div>

          {/* Commandes mois */}
          <div className="glass rounded-xl p-5 border border-gray-700">
            <div className="text-xs text-gray-500 mb-2">Commandes du mois</div>
            <div className="text-3xl font-bold text-white">
              {metrics.loading ? '...' : metrics.monthOrders}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Panier moy: {metrics.monthOrders > 0 ? formatCurrency(metrics.monthRevenue / metrics.monthOrders) : '—'}
            </div>
          </div>

          {/* Produits & Stock */}
          <div className="glass rounded-xl p-5 border border-gray-700">
            <div className="text-xs text-gray-500 mb-2">Produits actifs</div>
            <div className="text-3xl font-bold text-white">
              {metrics.loading ? '...' : metrics.totalProducts}
            </div>
            {(metrics.lowStock > 0 || metrics.outOfStock > 0) && (
              <div className="flex gap-2 mt-1">
                {metrics.outOfStock > 0 && (
                  <span className="text-xs text-red-400">{metrics.outOfStock} rupture</span>
                )}
                {metrics.lowStock > 0 && (
                  <span className="text-xs text-yellow-400">{metrics.lowStock} stock bas</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progression vers objectif Phi */}
        <div className="glass rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm text-gray-400">Progression objectif mensuel</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${isOnTrack ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isOnTrack ? 'En bonne voie' : 'En retard'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-medium">{progress.toFixed(1)}%</span>
              <span className="text-xs text-gray-500 ml-2">
                (attendu: {expectedProgress.toFixed(0)}%)
              </span>
            </div>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden relative">
            {/* Marqueur progression attendue */}
            <div
              className="absolute h-full w-0.5 bg-gray-400 z-10"
              style={{ left: `${Math.min(expectedProgress, 100)}%` }}
            />
            {/* Barre de progression */}
            <div
              className={`h-full transition-all ${isOnTrack ? 'bg-emerald-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>€0</span>
            <span className="text-emerald-400">
              Reste: {formatCurrency(remainingToTarget)}
              {remainingToTarget > 0 && ` (${formatCurrency(remainingToTarget / (daysInMonth - dayOfMonth + 1))}/jour)`}
            </span>
            <span>{formatCurrency(MONTHLY_TARGET)}</span>
          </div>
        </div>

        {/* Canaux de vente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shopify */}
          <a href="/weedn/sales/shopify" className="glass rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-blue-400" />
                <span className="font-medium text-white">E-commerce (Shopify)</span>
              </div>
              <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">weedn.fr →</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">CA du mois</div>
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.loading ? '...' : formatCurrency(metrics.shopifyRevenue)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Commandes</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.loading ? '...' : metrics.shopifyOrders}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-500">
                Part du CA total: <span className="text-blue-400">
                  {metrics.monthRevenue > 0 ? Math.round((metrics.shopifyRevenue / metrics.monthRevenue) * 100) : 0}%
                </span>
              </div>
            </div>
          </a>

          {/* Boutique */}
          <a href="/weedn/sales/store" className="glass rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-orange-400" />
                <span className="font-medium text-white">Boutique (Incwo)</span>
              </div>
              <span className="text-xs text-gray-500 group-hover:text-orange-400 transition-colors">4 Rue Tiquetonne →</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">CA du mois</div>
                <div className="text-2xl font-bold text-orange-400">
                  {metrics.loading ? '...' : formatCurrency(metrics.storeRevenue)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Transactions</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.loading ? '...' : metrics.storeTransactions}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-500">
                Part du CA total: <span className="text-orange-400">
                  {metrics.monthRevenue > 0 ? Math.round((metrics.storeRevenue / metrics.monthRevenue) * 100) : 0}%
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Alertes Stock */}
        {(metrics.outOfStock > 0 || metrics.lowStock > 0) && (
          <div className="glass rounded-xl p-5 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Alertes Stock</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metrics.outOfStock > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 font-medium">{metrics.outOfStock} produit(s) en rupture</div>
                  <div className="text-xs text-gray-400 mt-1">Action urgente requise</div>
                </div>
              )}
              {metrics.lowStock > 0 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-400 font-medium">{metrics.lowStock} produit(s) stock bas</div>
                  <div className="text-xs text-gray-400 mt-1">Réapprovisionner bientôt</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Wins - Recommandations */}
        <div className="glass rounded-xl p-5 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Quick Wins</h2>
              {totalPotential > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                  +{formatCurrency(totalPotential)} potentiel
                </span>
              )}
            </div>
            <button
              onClick={loadRecommendations}
              disabled={recsLoading}
              className="text-xs text-gray-400 hover:text-white"
            >
              {recsLoading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {recsLoading ? 'Analyse en cours...' : 'Aucune recommandation pour le moment'}
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : rec.priority === 'high'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rec.priority === 'critical'
                            ? 'bg-red-500/30 text-red-400'
                            : rec.priority === 'high'
                            ? 'bg-amber-500/30 text-amber-400'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {rec.priority === 'critical' ? '🔥 Urgent' : rec.priority === 'high' ? '⚡ Important' : '💡 Suggestion'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {rec.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-white font-medium text-sm mb-1">{rec.title}</h3>
                      <p className="text-gray-400 text-xs">{rec.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Target size={12} />
                        <span className="text-sm font-medium">+{formatCurrency(rec.expectedImpact.value)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        /{rec.expectedImpact.timeframe}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {rec.expectedImpact.confidence}% confiance
                      </div>
                    </div>
                  </div>
                  {rec.suggestedAction && (
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Action: {rec.suggestedAction.type.replace(/_/g, ' ')}
                      </span>
                      <button className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Appliquer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {recommendations.filter(r => r.priority === 'critical').length} critiques,{' '}
                {recommendations.filter(r => r.priority === 'high').length} importantes
              </div>
              <a href="/recommendations" className="text-xs text-emerald-400 hover:underline">
                Voir toutes les recommandations →
              </a>
            </div>
          )}
        </div>

        {/* Clients */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Clients</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Total clients</div>
              <div className="text-2xl font-bold text-white">
                {metrics.loading ? '...' : metrics.totalCustomers}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Nouveaux (30j)</div>
              <div className="text-2xl font-bold text-purple-400">
                {metrics.loading ? '...' : metrics.newCustomers}
              </div>
            </div>
          </div>
        </div>

        {/* Agents Weedn */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Agents Actifs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Inventaire', icon: '📦', status: 'actif', desc: 'Alerte stocks' },
              { name: 'Ventes', icon: '💰', status: 'actif', desc: 'Analyse CA' },
              { name: 'Email', icon: '📧', status: 'actif', desc: 'Klaviyo' },
              { name: 'Shopify', icon: '🛒', status: 'actif', desc: 'Produits' },
              { name: 'SEO', icon: '🔍', status: 'veille', desc: 'Référencement' },
              { name: 'Analytics', icon: '📊', status: 'actif', desc: 'Métriques' },
            ].map(agent => (
              <div key={agent.name} className="p-3 bg-gray-800/50 rounded-lg flex items-center gap-3">
                <span className="text-xl">{agent.icon}</span>
                <div>
                  <div className="text-sm text-white">{agent.name}</div>
                  <div className={`text-xs ${agent.status === 'actif' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {agent.status} • {agent.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="https://admin.shopify.com/store/f24081-64/products"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-center"
            >
              <div className="text-blue-400 font-medium">Gérer produits</div>
              <div className="text-xs text-gray-400">Shopify Admin</div>
            </a>
            <a
              href="https://www.incwo.com/1047111"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-colors text-center"
            >
              <div className="text-orange-400 font-medium">Caisse boutique</div>
              <div className="text-xs text-gray-400">Incwo</div>
            </a>
            <a
              href="https://www.klaviyo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors text-center"
            >
              <div className="text-purple-400 font-medium">Email Marketing</div>
              <div className="text-xs text-gray-400">Klaviyo</div>
            </a>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors text-center"
            >
              <div className="text-yellow-400 font-medium">Analytics</div>
              <div className="text-xs text-gray-400">Google</div>
            </a>
          </div>
        </div>

        {/* Infos légales */}
        <div className="glass rounded-xl p-4 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            <span className="text-white">SIRET:</span> 98853449100010
          </div>
          <div className="text-gray-400">
            <span className="text-white">Tél:</span> 01 42 60 98 74
          </div>
          <div className="text-gray-400">
            <span className="text-white">Objectif:</span> +40% CA ({formatCurrency(MONTHLY_TARGET)}/mois)
          </div>
        </div>

      </div>
    </div>
  )
}
