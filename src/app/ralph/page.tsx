'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bot, Play, Square, RefreshCw, ArrowLeft, Brain, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, Clock, DollarSign, Zap,
  FileText, Terminal, ChevronDown, ChevronRight, Eye, Loader2,
  Target, Award, AlertTriangle, Activity
} from 'lucide-react'

// Types
interface RalphSession {
  id: string
  date: string
  prdFile: string
  status: 'running' | 'completed' | 'failed' | 'partial'
  iterations: number
  maxIterations: number
  successes: number
  failures: number
  duration: string
  estimatedCost: number
  revenueImpact: number
  roi: number
  learningsSaved: number
  errorsLogged: number
  patternsUpdated: number
}

interface RalphStats {
  totalSessions: number
  totalIterations: number
  totalSuccesses: number
  totalFailures: number
  totalRevenueImpact: number
  totalCost: number
  averageROI: number
  bestSession: RalphSession | null
}

interface PRDFile {
  name: string
  path: string
  description: string
}

interface RunningSession {
  sessionId: string
  pid: number
  startedAt: string
  prd: string
}

export default function RalphPage() {
  const [sessions, setSessions] = useState<RalphSession[]>([])
  const [stats, setStats] = useState<RalphStats | null>(null)
  const [prds, setPrds] = useState<PRDFile[]>([])
  const [running, setRunning] = useState<RunningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // Launch modal
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [launchForm, setLaunchForm] = useState({
    prdFile: '',
    maxIterations: 10,
    mode: 'auto',
  })
  const [launching, setLaunching] = useState(false)

  // Logs modal
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [logs, setLogs] = useState<string>('')
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsMetrics, setLogsMetrics] = useState<any>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [sessionsRes, runningRes] = await Promise.all([
        fetch('/api/ralph'),
        fetch('/api/ralph/launch'),
      ])

      const sessionsJson = await sessionsRes.json()
      const runningJson = await runningRes.json()

      if (sessionsJson.success) {
        setSessions(sessionsJson.sessions)
        setStats(sessionsJson.stats)
        setPrds(sessionsJson.prds)
      } else {
        setError(sessionsJson.error || 'Erreur chargement')
      }

      if (runningJson.success) {
        setRunning(runningJson.running)
      }

      setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh toutes les 30s
    return () => clearInterval(interval)
  }, [loadData])

  const launchRalph = async () => {
    if (!launchForm.prdFile) return

    try {
      setLaunching(true)
      const res = await fetch('/api/ralph/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(launchForm),
      })
      const json = await res.json()

      if (json.success) {
        setShowLaunchModal(false)
        // Refresh après 2s pour voir la nouvelle session
        setTimeout(loadData, 2000)
      } else {
        alert('Erreur: ' + json.error)
      }
    } catch (e) {
      alert('Erreur lancement Ralph')
    } finally {
      setLaunching(false)
    }
  }

  const stopRalph = async (sessionId: string) => {
    if (!confirm(`Arrêter la session ${sessionId} ?`)) return

    try {
      const res = await fetch(`/api/ralph/launch?session=${sessionId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        loadData()
      }
    } catch (e) {
      alert('Erreur arrêt')
    }
  }

  const viewLogs = async (sessionId: string) => {
    setSelectedSession(sessionId)
    setShowLogsModal(true)
    setLogsLoading(true)

    try {
      const res = await fetch(`/api/ralph/logs?session=${sessionId}&tail=200`)
      const json = await res.json()
      if (json.success) {
        setLogs(json.content)
        setLogsMetrics(json.metrics)
      }
    } catch (e) {
      setLogs('Erreur chargement logs')
    } finally {
      setLogsLoading(false)
    }
  }

  const refreshLogs = async () => {
    if (!selectedSession) return
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/ralph/logs?session=${selectedSession}&tail=200`)
      const json = await res.json()
      if (json.success) {
        setLogs(json.content)
        setLogsMetrics(json.metrics)
      }
    } finally {
      setLogsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: RalphSession['status']) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> En cours</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Terminé</span>
      case 'failed':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Échoué</span>
      case 'partial':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1"><AlertTriangle size={12} /> Partiel</span>
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <Bot className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ralph Wiggum Loop</h1>
              <p className="text-sm text-gray-400">Agent Autonome • Coding la nuit pendant que tu dors</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLaunchModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90"
            >
              <Play size={16} />
              Lancer Ralph
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {lastUpdate || 'Actualiser'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Sessions en cours */}
        {running.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-blue-400 animate-pulse" size={24} />
              <h2 className="text-lg font-bold text-white">Sessions en cours</h2>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {running.length} active{running.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {running.map((r) => (
                <div key={r.sessionId} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Loader2 className="text-blue-400 animate-spin" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{r.sessionId}</div>
                      <div className="text-xs text-gray-400">{r.prd}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => viewLogs(r.sessionId)}
                      className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Eye size={14} />
                      Logs
                    </button>
                    <button
                      onClick={() => stopRalph(r.sessionId)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 flex items-center gap-2"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass rounded-xl p-5 border border-purple-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Bot size={14} />
                Sessions Total
              </div>
              <div className="text-2xl font-bold text-purple-400">{stats.totalSessions}</div>
              <div className="text-xs text-gray-400">{stats.totalIterations} itérations</div>
            </div>

            <div className="glass rounded-xl p-5 border border-green-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <TrendingUp size={14} />
                Revenue Impact
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(stats.totalRevenueImpact)}
              </div>
              <div className="text-xs text-gray-400">Impact estimé</div>
            </div>

            <div className="glass rounded-xl p-5 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <DollarSign size={14} />
                Coût API
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                ${stats.totalCost.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Claude API</div>
            </div>

            <div className="glass rounded-xl p-5 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Zap size={14} />
                ROI Moyen
              </div>
              <div className="text-2xl font-bold text-yellow-400">{stats.averageROI}x</div>
              <div className="text-xs text-gray-400">Retour sur investissement</div>
            </div>

            <div className="glass rounded-xl p-5 border border-pink-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <CheckCircle2 size={14} />
                Taux de succès
              </div>
              <div className="text-2xl font-bold text-pink-400">
                {stats.totalIterations > 0 ? Math.round((stats.totalSuccesses / stats.totalIterations) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-400">{stats.totalSuccesses}/{stats.totalIterations}</div>
            </div>
          </div>
        )}

        {/* Best Session */}
        {stats?.bestSession && (
          <div className="glass rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-yellow-400" size={24} />
              <h2 className="text-lg font-bold text-white">Meilleure Session</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-gray-400">Session</div>
                <div className="font-medium text-white">{stats.bestSession.id}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">PRD</div>
                <div className="font-medium text-white truncate">{stats.bestSession.prdFile.split('/').pop()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Revenue Impact</div>
                <div className="font-bold text-green-400">{formatCurrency(stats.bestSession.revenueImpact)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">ROI</div>
                <div className="font-bold text-yellow-400">{stats.bestSession.roi}x</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Durée</div>
                <div className="font-medium text-white">{stats.bestSession.duration}</div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des sessions */}
        <div className="glass rounded-2xl p-6 border border-gray-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Terminal className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-white">Historique des Sessions</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-3 text-left">Session</th>
                  <th className="pb-3 text-left">PRD</th>
                  <th className="pb-3 text-left">Statut</th>
                  <th className="pb-3 text-center">Itérations</th>
                  <th className="pb-3 text-right">Impact</th>
                  <th className="pb-3 text-right">ROI</th>
                  <th className="pb-3 text-right">Durée</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3">
                      <div className="text-sm font-medium text-white">{session.id}</div>
                      <div className="text-xs text-gray-500">{session.date}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-300 truncate max-w-[200px]">
                        {session.prdFile.split('/').pop()}
                      </div>
                    </td>
                    <td className="py-3">{getStatusBadge(session.status)}</td>
                    <td className="py-3 text-center">
                      <div className="text-sm text-white">{session.iterations}/{session.maxIterations}</div>
                      <div className="text-xs text-gray-500">
                        <span className="text-green-400">{session.successes}</span>
                        {session.failures > 0 && <span className="text-red-400 ml-1">/{session.failures}</span>}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className={`text-sm font-medium ${session.revenueImpact > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {session.revenueImpact > 0 ? formatCurrency(session.revenueImpact) : '-'}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className={`text-sm font-medium ${session.roi > 100 ? 'text-yellow-400' : session.roi > 0 ? 'text-cyan-400' : 'text-gray-400'}`}>
                        {session.roi > 0 ? `${session.roi}x` : '-'}
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{session.duration}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => viewLogs(session.id)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Voir les logs"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sessions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucune session Ralph trouvée</p>
              <p className="text-sm mt-2">Lance ta première session pour commencer!</p>
            </div>
          )}
        </div>

        {/* PRDs disponibles */}
        <div className="glass rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-purple-400" size={24} />
            <h2 className="text-lg font-bold text-white">PRDs Disponibles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prds.map((prd) => (
              <div
                key={prd.path}
                className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 cursor-pointer"
                onClick={() => {
                  setLaunchForm({ ...launchForm, prdFile: prd.path })
                  setShowLaunchModal(true)
                }}
              >
                <div className="flex items-start gap-3">
                  <FileText className="text-purple-400 mt-1" size={18} />
                  <div>
                    <div className="font-medium text-white text-sm">{prd.name}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{prd.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Modal Launch */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="text-purple-400" size={20} />
                Lancer Ralph
              </h3>
              <button onClick={() => setShowLaunchModal(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">PRD à exécuter</label>
                <select
                  value={launchForm.prdFile}
                  onChange={(e) => setLaunchForm({ ...launchForm, prdFile: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                >
                  <option value="">Sélectionner un PRD...</option>
                  {prds.map((prd) => (
                    <option key={prd.path} value={prd.path}>{prd.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Max Iterations</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={launchForm.maxIterations}
                  onChange={(e) => setLaunchForm({ ...launchForm, maxIterations: parseInt(e.target.value) || 10 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Mode</label>
                <select
                  value={launchForm.mode}
                  onChange={(e) => setLaunchForm({ ...launchForm, mode: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                >
                  <option value="auto">Auto (pause 5s entre itérations)</option>
                  <option value="until-done">Until Done (jusqu'à exit condition)</option>
                  <option value="supervised">Supervised (validation manuelle)</option>
                </select>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Brain className="text-purple-400 mt-0.5" size={18} />
                  <div className="text-sm">
                    <div className="text-white font-medium">Ralph va charger son cerveau</div>
                    <div className="text-gray-400 text-xs mt-1">
                      Learnings, erreurs à éviter, patterns gagnants, et KPIs seront injectés automatiquement.
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={launchRalph}
                disabled={!launchForm.prdFile || launching}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {launching ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Lancement...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Lancer la session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Logs */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="text-green-400" size={20} />
                Logs: {selectedSession}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshLogs}
                  disabled={logsLoading}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
                >
                  <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Metrics en temps réel */}
            {logsMetrics && (
              <div className="grid grid-cols-5 gap-3 p-4 border-b border-gray-800 bg-gray-900/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{logsMetrics.currentIteration}/{logsMetrics.maxIterations}</div>
                  <div className="text-xs text-gray-500">Itération</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{logsMetrics.successes}</div>
                  <div className="text-xs text-gray-500">Succès</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">{logsMetrics.failures}</div>
                  <div className="text-xs text-gray-500">Échecs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{logsMetrics.learningsLoaded}</div>
                  <div className="text-xs text-gray-500">Learnings</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${logsMetrics.brainLoaded ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {logsMetrics.brainLoaded ? '✓' : '...'}
                  </div>
                  <div className="text-xs text-gray-500">Brain</div>
                </div>
              </div>
            )}

            {/* Logs content */}
            <div className="flex-1 overflow-auto p-4">
              {logsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              ) : (
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{logs}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
