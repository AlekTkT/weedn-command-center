'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Wallet, Bot, RefreshCw,
  TrendingUp, ArrowRight, ExternalLink,
  ArrowUpRight, ArrowDownRight, AlertCircle, Upload, Landmark, Package,
  PiggyBank, CreditCard
} from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import HoldingsStatsTable from '@/components/HoldingsStatsTable'

// Objectifs mensuels Holdings
const TARGETS = {
  weedn: 54508,     // €54,508/mois = Weedn
  bijan: 33692,     // €33,692/mois = BIJAN
  combined: 88200   // €88,200/mois = Holdings total
}
const ANNUAL_TARGET = 800000 // €800K/an

interface MetricsState {
  weedn: {
    todayRevenue: number
    monthRevenue: number
    monthOrders: number
    vsYesterday: number
  }
  bijan: {
    todayRevenue: number
    monthRevenue: number
    monthOrders: number
    configured: boolean
  }
  loading: boolean
  error: string | null
  lastUpdate: string | null
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<MetricsState>({
    weedn: { todayRevenue: 0, monthRevenue: 0, monthOrders: 0, vsYesterday: 0 },
    bijan: { todayRevenue: 0, monthRevenue: 0, monthOrders: 0, configured: false },
    loading: true,
    error: null,
    lastUpdate: null
  })

  const loadMetrics = useCallback(async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }))

      // Charger les deux APIs en parallèle
      const [weednRes, bijanRes] = await Promise.all([
        fetch('/api/combined-metrics'),
        fetch('/api/bijan/metrics')
      ])

      // Weedn
      let weednData = { todayRevenue: 0, monthRevenue: 0, monthOrders: 0, vsYesterday: 0 }
      if (weednRes.ok) {
        const json = await weednRes.json()
        if (json.success && json.data) {
          const todayRev = json.data.combined?.today?.revenue || 0
          const yesterdayRev = json.data.combined?.yesterday?.revenue || 0
          weednData = {
            todayRevenue: todayRev,
            monthRevenue: json.data.combined?.month?.revenue || 0,
            monthOrders: json.data.combined?.month?.orders || 0,
            vsYesterday: yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 0
          }
        }
      }

      // BIJAN
      let bijanData = { todayRevenue: 0, monthRevenue: 0, monthOrders: 0, configured: false }
      if (bijanRes.ok) {
        const json = await bijanRes.json()
        if (json.success && json.data) {
          bijanData = {
            todayRevenue: json.data.today?.revenue || 0,
            monthRevenue: json.data.month?.revenue || 0,
            monthOrders: json.data.month?.orders || 0,
            configured: json.data.configured || false
          }
        }
      }

      setMetrics({
        weedn: weednData,
        bijan: bijanData,
        loading: false,
        error: null,
        lastUpdate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      })
    } catch (e) {
      console.error('Erreur chargement métriques:', e)
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur inconnue'
      }))
    }
  }, [])

  useEffect(() => {
    loadMetrics()
    // Refresh auto toutes les 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadMetrics])

  // Calculs combinés
  const totalToday = metrics.weedn.todayRevenue + metrics.bijan.todayRevenue
  const totalMonth = metrics.weedn.monthRevenue + metrics.bijan.monthRevenue
  const totalOrders = metrics.weedn.monthOrders + metrics.bijan.monthOrders

  // Progression vers objectifs
  const weednProgress = TARGETS.weedn > 0 ? (metrics.weedn.monthRevenue / TARGETS.weedn) * 100 : 0
  const bijanProgress = TARGETS.bijan > 0 ? (metrics.bijan.monthRevenue / TARGETS.bijan) * 100 : 0
  const combinedProgress = TARGETS.combined > 0 ? (totalMonth / TARGETS.combined) * 100 : 0

  // Calcul de la progression attendue selon le jour du mois
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const expectedProgress = (dayOfMonth / daysInMonth) * 100

  // Formatter monétaire
  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: decimals
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <Building2 className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">COURTHIEU Holdings</h1>
              <p className="text-sm text-gray-400">Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FileUpload compact />
            <button
              onClick={loadMetrics}
              disabled={metrics.loading}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={metrics.loading ? 'animate-spin' : ''} />
              {metrics.lastUpdate || 'Actualiser'}
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {metrics.loading ? '...' : formatCurrency(totalMonth)}
              </div>
              <div className="text-xs text-gray-400">
                CA Janvier • {combinedProgress.toFixed(0)}% objectif
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Erreur si présente */}
        {metrics.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400">{metrics.error}</span>
          </div>
        )}

        {/* Progression Holdings vers objectif mensuel */}
        <div className="glass rounded-xl p-5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Objectif Holdings</h2>
              <p className="text-xs text-gray-400">Weedn + BIJAN = {formatCurrency(TARGETS.combined)}/mois</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${combinedProgress >= expectedProgress ? 'text-green-400' : 'text-yellow-400'}`}>
                {metrics.loading ? '...' : formatCurrency(totalMonth)}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${combinedProgress >= expectedProgress ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {combinedProgress >= expectedProgress ? 'En avance' : 'En retard'}
              </span>
            </div>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden relative mb-2">
            {/* Marqueur progression attendue */}
            <div className="absolute h-full w-0.5 bg-gray-400 z-10" style={{ left: `${Math.min(expectedProgress, 100)}%` }} />
            {/* Barre de progression */}
            <div
              className={`h-full transition-all ${combinedProgress >= expectedProgress ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(combinedProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>€0</span>
            <span className="text-purple-400">
              Reste: {formatCurrency(Math.max(0, TARGETS.combined - totalMonth))}
            </span>
            <span>{formatCurrency(TARGETS.combined)}</span>
          </div>
        </div>

        {/* Tableau Stats Holdings - CA & Benefices */}
        <HoldingsStatsTable />

        {/* KPIs Rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">CA Aujourd'hui</div>
            <div className="text-3xl font-bold text-white">
              {metrics.loading ? '...' : formatCurrency(totalToday)}
            </div>
            <div className="text-xs text-gray-400">Weedn + BIJAN</div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Commandes du mois</div>
            <div className="text-3xl font-bold text-white">
              {metrics.loading ? '...' : totalOrders}
            </div>
            <div className="text-xs text-gray-400">
              Panier moy: {totalOrders > 0 ? formatCurrency(totalMonth / totalOrders) : '—'}
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Objectif 2026</div>
            <div className="text-3xl font-bold text-purple-400">{formatCurrency(ANNUAL_TARGET)}</div>
            <div className="text-xs text-gray-400">Holdings combiné</div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="text-xs text-gray-500 mb-1">Croissance cible</div>
            <div className="text-3xl font-bold text-emerald-400">+6.92%</div>
            <div className="text-xs text-gray-400">Par mois</div>
          </div>
        </div>

        {/* Navigation principale - 4 blocs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* WEEDN */}
          <Link
            href="/weedn"
            className="glass rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                  🌿
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">WEEDN</h2>
                  <p className="text-xs text-gray-400">RETAR DIO • CBD Paris</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-emerald-400 transition-colors" size={20} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Objectif mensuel</span>
                <span className="text-emerald-400">{weednProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(weednProgress, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <div className="text-xs text-gray-500">Aujourd'hui</div>
                <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                  {metrics.loading ? '...' : formatCurrency(metrics.weedn.todayRevenue)}
                  {metrics.weedn.vsYesterday !== 0 && (
                    <span className={`text-xs ${metrics.weedn.vsYesterday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.weedn.vsYesterday >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Janvier</div>
                <div className="text-lg font-bold text-white">
                  {metrics.loading ? '...' : formatCurrency(metrics.weedn.monthRevenue)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Cible: {formatCurrency(TARGETS.weedn)}
            </div>
          </Link>

          {/* BIJAN PARIS */}
          <Link
            href="/bijan"
            className="glass rounded-2xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center text-2xl">
                  💎
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">BIJAN PARIS</h2>
                  <p className="text-xs text-gray-400">Bijouterie • Grenoble</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-pink-400 transition-colors" size={20} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Objectif unité</span>
                <span className="text-pink-400">{bijanProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: `${Math.min(bijanProgress, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <div className="text-xs text-gray-500">Aujourd'hui</div>
                <div className="text-lg font-bold text-pink-400">
                  {metrics.loading ? '...' : formatCurrency(metrics.bijan.todayRevenue)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Janvier</div>
                <div className="text-lg font-bold text-white">
                  {metrics.loading ? '...' : formatCurrency(metrics.bijan.monthRevenue)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {metrics.bijan.configured
                ? `Cible: ${formatCurrency(TARGETS.bijan)}`
                : <span className="text-yellow-400">Config Shopify requise</span>
              }
            </div>
          </Link>

          {/* Suivi Bénéfices - PRIORITÉ */}
          <Link
            href="/profits"
            className="glass rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-bl-lg">
              PRIORITÉ
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="text-green-400" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Bénéfices</h2>
                  <p className="text-xs text-gray-400">Suivi strict rentabilité</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-green-400 transition-colors" size={20} />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Marges, charges, seuils rentabilité, alertes
            </p>
            <div className="pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-500">Bénéfice personnel estimé</div>
              <div className="text-lg font-bold text-green-400">
                ~{formatCurrency(totalMonth * 0.15)}
              </div>
              <div className="text-xs text-gray-500">~15% du profit net Holdings</div>
            </div>
          </Link>

          {/* Agents IA */}
          <Link
            href="/agents"
            className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Bot className="text-purple-400" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Agents IA</h2>
                  <p className="text-xs text-gray-400">Orchestration Holdings</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-purple-400 transition-colors" size={20} />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Chef d'Orchestre, Finance, Juridique + 11 agents
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <div className="text-xs text-gray-500">Architecture</div>
                <div className="text-lg font-bold text-green-400">Pyramidale</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Agents</div>
                <div className="text-lg font-bold text-white">14 actifs</div>
              </div>
            </div>
          </Link>

        </div>

        {/* Trésorerie Holdings - NOUVEAU */}
        <Link
          href="/treasury"
          className="glass rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-bl-lg flex items-center gap-1">
            <CreditCard size={12} /> FINANCES
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <PiggyBank className="text-cyan-400" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Trésorerie Holdings</h2>
                <p className="text-xs text-gray-400">Comptes • Paiements • Encaissements</p>
              </div>
            </div>
            <ArrowRight className="text-gray-600 group-hover:text-cyan-400 transition-colors" size={20} />
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Gestion complète : soldes bancaires, liens de paiement, factures, abonnements
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <div className="text-xs text-gray-500">Comptes</div>
              <div className="text-lg font-bold text-cyan-400">3</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Moyens paiement</div>
              <div className="text-lg font-bold text-green-400">5</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Abonnements</div>
              <div className="text-lg font-bold text-yellow-400">4</div>
            </div>
          </div>
        </Link>

        {/* Banking Hub + Suivi Colis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/banking"
            className="glass rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Landmark className="text-purple-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Banking Hub</h2>
                  <p className="text-xs text-gray-400">CIC • Qonto • BoursoBank</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-purple-400 transition-colors" size={20} />
            </div>
          </Link>

          <Link
            href="/suppliers/tracking"
            className="glass rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Package className="text-orange-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Suivi Colis</h2>
                  <p className="text-xs text-gray-400">Commandes fournisseurs</p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-orange-400 transition-colors" size={20} />
            </div>
          </Link>
        </div>

        {/* Liens rapides */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm">
              <Link href="/files" className="text-gray-400 hover:text-purple-400 flex items-center gap-1">
                <Upload size={12} /> Fichiers
              </Link>
              <Link href="/banking" className="text-gray-400 hover:text-cyan-400 flex items-center gap-1">
                <Landmark size={12} /> Banking
              </Link>
              <Link href="/ralph" className="text-gray-400 hover:text-purple-400 flex items-center gap-1">
                <Bot size={12} /> Ralph
              </Link>
              <a href="https://admin.shopify.com/store/f24081-64" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 flex items-center gap-1">
                Shopify Weedn <ExternalLink size={12} />
              </a>
              <a href="https://admin.shopify.com/store/011ce1-4" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 flex items-center gap-1">
                Shopify BIJAN <ExternalLink size={12} />
              </a>
              <a href="https://www.incwo.com/1047111" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 flex items-center gap-1">
                Incwo <ExternalLink size={12} />
              </a>
              <a href="https://www.klaviyo.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 flex items-center gap-1">
                Klaviyo <ExternalLink size={12} />
              </a>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 flex items-center gap-1">
                Analytics <ExternalLink size={12} />
              </a>
            </div>
            <div className="text-xs text-gray-500">
              Alexandre COURTHIEU • Président COURTHIEU Holdings
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
