'use client'

import { useState, useEffect } from 'react'
import {
  Store, TrendingUp, Package, Users,
  ExternalLink, AlertTriangle, MapPin, RefreshCw, CheckCircle, Settings,
  ArrowRight, Target, Zap, Clock, ChevronRight
} from 'lucide-react'

interface Task {
  id: string
  agent: string
  agentIcon: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  actionUrl?: string
  impact?: string
  category: string
}

interface Metrics {
  today: number
  month: number
  orders: number
  avgBasket: number
  loading: boolean
  configured: boolean
  progress?: {
    monthly: number
    toObjective: number
    daysRemaining: number
    dailyTarget: number
  }
}

export default function BijanPage() {
  const objective = 25000 // Objectif mensuel BIJAN

  const [metrics, setMetrics] = useState<Metrics>({
    today: 0,
    month: 0,
    orders: 0,
    avgBasket: 0,
    loading: true,
    configured: false,
  })

  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    try {
      // Charger les metriques et les taches en parallele
      const [metricsRes, tasksRes] = await Promise.all([
        fetch('/api/bijan/metrics'),
        fetch('/api/bijan/tasks'),
      ])

      const metricsData = await metricsRes.json()
      const tasksData = await tasksRes.json()

      if (metricsData.success) {
        setMetrics({
          today: metricsData.data.today?.revenue || 0,
          month: metricsData.data.month?.revenue || 0,
          orders: metricsData.data.month?.orders || 0,
          avgBasket: metricsData.data.month?.avgBasket || 0,
          loading: false,
          configured: metricsData.data.configured,
          progress: metricsData.data.progress,
        })
      } else {
        setMetrics(prev => ({ ...prev, loading: false }))
      }

      if (tasksData.success) {
        setTasks(tasksData.data.tasks || [])
      }
      setTasksLoading(false)
    } catch (e) {
      console.error(e)
      setMetrics(prev => ({ ...prev, loading: false }))
      setTasksLoading(false)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
    // Charger les taches completees du localStorage
    const saved = localStorage.getItem('bijan_completed_tasks')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Garder seulement les taches completees aujourd'hui
      const today = new Date().toDateString()
      if (parsed.date === today) {
        setCompletedTasks(parsed.tasks || [])
      }
    }
  }, [])

  const completeTask = (taskId: string) => {
    const newCompleted = [...completedTasks, taskId]
    setCompletedTasks(newCompleted)
    localStorage.setItem('bijan_completed_tasks', JSON.stringify({
      date: new Date().toDateString(),
      tasks: newCompleted,
    }))
  }

  const progress = metrics.month > 0 ? (metrics.month / objective) * 100 : 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-500/5'
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5'
      case 'low': return 'border-gray-500/30 bg-gray-500/5'
      default: return 'border-gray-700'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'low': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  // Filtrer les taches non completees
  const activeTasks = tasks.filter(t => !completedTasks.includes(t.id))
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high')
  const otherTasks = activeTasks.filter(t => t.priority !== 'high')

  // Connexions configurees
  const connections = [
    { name: 'Instagram @bijan.paris', icon: '📱', connected: true, url: 'https://instagram.com/bijan.paris' },
    { name: 'Google Business', icon: '📍', connected: true, url: 'https://maps.app.goo.gl/3EvG6RVJzFZe7B1r6' },
    { name: 'Shopify POS', icon: '🛒', connected: metrics.configured, url: 'https://admin.shopify.com/store/011ce1-4' },
    { name: 'Site bijanparis.com', icon: '🌐', connected: true, url: 'https://www.bijanparis.com' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-2xl">
              💎
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BIJAN PARIS</h1>
              <p className="text-sm text-gray-400">Bijouterie & Piercing - Centre Neyrpic, Grenoble</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="/" className="text-sm text-gray-400 hover:text-white">
              ← Holdings
            </a>
          </div>
        </div>

        {/* KPIs rapides */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 border border-pink-500/20">
            <div className="text-xs text-gray-500 mb-1">CA Aujourd'hui</div>
            <div className="text-2xl font-bold text-pink-400">
              {metrics.loading ? '...' : `€${metrics.today.toFixed(0)}`}
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-pink-500/20">
            <div className="text-xs text-gray-500 mb-1">CA Janvier</div>
            <div className="text-2xl font-bold text-white">
              {metrics.loading ? '...' : `€${metrics.month.toFixed(0)}`}
            </div>
            <div className="text-xs text-pink-400">/ €{objective.toLocaleString()}</div>
          </div>

          <div className="glass rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Ventes</div>
            <div className="text-2xl font-bold text-white">
              {metrics.loading ? '...' : metrics.orders}
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Panier moyen</div>
            <div className="text-2xl font-bold text-white">
              {metrics.loading ? '...' : `€${metrics.avgBasket.toFixed(0)}`}
            </div>
          </div>
        </div>

        {/* Progression objectif */}
        <div className="glass rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-pink-400" />
              <span className="text-sm text-gray-400">Objectif janvier</span>
            </div>
            <span className="text-pink-400 font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {metrics.progress && (
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Reste: €{metrics.progress.toObjective?.toFixed(0) || 0}</span>
              <span>{metrics.progress.daysRemaining || 0} jours restants</span>
              <span>Objectif/jour: €{metrics.progress.dailyTarget?.toFixed(0) || 0}</span>
            </div>
          )}
        </div>

        {/* Taches prioritaires */}
        {highPriorityTasks.length > 0 && (
          <div className="glass rounded-xl p-5 border border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-red-400" />
              <h2 className="text-lg font-semibold text-white">Actions urgentes</h2>
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                {highPriorityTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {highPriorityTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border ${getPriorityColor(task.priority)} transition-all hover:border-pink-500/50`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{task.agentIcon}</span>
                        <span className="text-xs text-gray-500">{task.agent}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                          urgent
                        </span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-400">{task.description}</p>
                      {task.impact && (
                        <div className="mt-2 text-xs text-pink-400">
                          Impact: {task.impact}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {task.actionUrl && (
                        <a
                          href={task.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 flex items-center gap-1"
                        >
                          {task.action || 'Voir'} <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        onClick={() => completeTask(task.id)}
                        className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 flex items-center gap-1"
                      >
                        <CheckCircle size={12} /> Fait
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autres taches */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Taches du jour</h2>
              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">
                {otherTasks.length}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {completedTasks.length} completee(s) aujourd'hui
            </div>
          </div>

          {tasksLoading ? (
            <div className="text-center text-gray-500 py-8">Chargement des taches...</div>
          ) : otherTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
              Toutes les taches sont completees !
            </div>
          ) : (
            <div className="space-y-2">
              {otherTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${getPriorityColor(task.priority)} hover:border-pink-500/30 transition-all`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{task.agentIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm truncate">{task.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${getPriorityBadge(task.priority)}`}>
                            {task.priority === 'medium' ? 'moyen' : 'faible'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.actionUrl && (
                        <a
                          href={task.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-pink-400 hover:bg-pink-500/20 rounded"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => completeTask(task.id)}
                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded"
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connexions */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Connexions</h2>
          <div className="grid grid-cols-2 gap-3">
            {connections.map(conn => (
              <a
                key={conn.name}
                href={conn.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  conn.connected
                    ? 'border-green-500/20 hover:border-green-500/40 bg-green-500/5'
                    : 'border-yellow-500/20 hover:border-yellow-500/40 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{conn.icon}</span>
                  <span className="text-sm text-white">{conn.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    conn.connected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {conn.connected ? 'Connecte' : 'A configurer'}
                  </span>
                  <ChevronRight size={14} className="text-gray-500" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Boutique */}
        <div className="glass rounded-xl p-5 border border-pink-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Store size={20} className="text-pink-400" />
              <span className="font-medium text-white">Boutique Neyrpic</span>
            </div>
            <a
              href="https://www.bijanparis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
            >
              Site web <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-400">
            <MapPin size={16} className="text-pink-400 mt-0.5" />
            <div>
              <div className="text-white">Centre Commercial Neyrpic</div>
              <div>38000 Grenoble</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-2">Produits</div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs rounded">Piercing titane</span>
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">Bijoux acier inox</span>
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded">Dore</span>
              <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded">Argente</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <a
                href="https://admin.shopify.com/store/011ce1-4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 flex items-center gap-1"
              >
                Shopify <ExternalLink size={12} />
              </a>
              <a
                href="https://instagram.com/bijan.paris"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 flex items-center gap-1"
              >
                Instagram <ExternalLink size={12} />
              </a>
              <a
                href="https://maps.app.goo.gl/3EvG6RVJzFZe7B1r6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 flex items-center gap-1"
              >
                Google Maps <ExternalLink size={12} />
              </a>
            </div>
            <div className="text-gray-500">
              Objectif: <span className="text-pink-400">€25k/mois</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
