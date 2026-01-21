'use client'

import { useState, useEffect } from 'react'
import { Bot, Zap, TrendingUp, ArrowRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface TaskSummary {
  total: number
  high: number
  medium: number
  low: number
  configured: boolean
}

export default function AgentsPage() {
  const [bijanTasks, setBijanTasks] = useState<TaskSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      // Charger les taches BIJAN
      const bijanRes = await fetch('/api/bijan/tasks')
      const bijanData = await bijanRes.json()
      if (bijanData.success) {
        setBijanTasks(bijanData.data.summary)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // Pour WEEDN, les agents sont actifs
  const weedAgentsCount = 8
  const bijanAgentsCount = 9
  const totalAgents = weedAgentsCount + bijanAgentsCount + 3 // +3 pour les agents globaux

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Bot className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Centre de Taches</h1>
              <p className="text-sm text-gray-400">{totalAgents} agents IA au service du Holdings</p>
            </div>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white">
            ← Holdings
          </a>
        </div>

        {/* Info */}
        <div className="glass rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">
                Les agents IA generent des taches basees sur vos donnees reelles.
                Cliquez sur une entite pour voir et executer les taches.
              </p>
            </div>
          </div>
        </div>

        {/* Entites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* WEEDN */}
          <a
            href="/weedn"
            className="glass rounded-xl p-6 border border-emerald-500/20 hover:border-emerald-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌿</span>
                <div>
                  <h2 className="text-xl font-bold text-white">WEEDN</h2>
                  <p className="text-xs text-gray-500">CBD - Paris 2e</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Agents actifs</span>
                <span className="text-emerald-400 font-medium">{weedAgentsCount}/8</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Objectif</span>
                <span className="text-white">€54,508/mois</span>
              </div>
              <div className="pt-3 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle size={12} />
                  <span>Agents operationnels</span>
                </div>
              </div>
            </div>
          </a>

          {/* BIJAN PARIS */}
          <a
            href="/bijan"
            className="glass rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💎</span>
                <div>
                  <h2 className="text-xl font-bold text-white">BIJAN PARIS</h2>
                  <p className="text-xs text-gray-500">Bijouterie - Grenoble</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-pink-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Agents actifs</span>
                <span className="text-pink-400 font-medium">{bijanAgentsCount}/9</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Objectif</span>
                <span className="text-white">€25,000/mois</span>
              </div>

              {loading ? (
                <div className="pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-500">Chargement...</div>
                </div>
              ) : bijanTasks ? (
                <div className="pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-3 text-xs">
                    {bijanTasks.high > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertTriangle size={12} />
                        {bijanTasks.high} urgente(s)
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock size={12} />
                      {bijanTasks.total} taches
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-800">
                  <div className="text-xs text-pink-400">Voir les taches →</div>
                </div>
              )}
            </div>
          </a>
        </div>

        {/* Agents Globaux */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-purple-400" />
            Agents Globaux
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <span className="font-medium text-white">Finance</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Tresorerie, opportunites, subventions</p>
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">autonome</span>
            </div>

            <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚖️</span>
                <span className="font-medium text-white">Juridique</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Veille reglementaire CBD, normes piercing</p>
              <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">supervise</span>
            </div>

            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <span className="font-medium text-white">Orchestrateur</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Coordination des {totalAgents} agents</p>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">coordination</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalAgents}</div>
            <div className="text-xs text-gray-500">Agents IA</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">2</div>
            <div className="text-xs text-gray-500">Entites</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {(bijanTasks?.total || 0)}
            </div>
            <div className="text-xs text-gray-500">Taches actives</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">€88k</div>
            <div className="text-xs text-gray-500">Objectif Holdings</div>
          </div>
        </div>

      </div>
    </div>
  )
}
