'use client'

import { motion } from 'framer-motion'

interface AgentCardProps {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  tasksCompleted: number
  tasksTotal: number
  level: number
  xp: number
  currentTask?: string
  onClick?: () => void
}

const statusColors = {
  online: 'bg-emerald-500',
  working: 'bg-blue-500 animate-pulse',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500'
}

const statusLabels = {
  online: 'En ligne',
  working: 'En cours...',
  idle: 'En attente',
  offline: 'Hors ligne'
}

export default function AgentCard({
  name,
  icon,
  status,
  tasksCompleted,
  tasksTotal,
  level,
  xp,
  currentTask,
  onClick
}: AgentCardProps) {
  const progress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0
  const xpProgress = (xp / 1000) * 100

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-gray-400">{statusLabels[status]}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Niveau</div>
          <div className="text-lg font-bold text-emerald-400">{level}</div>
        </div>
      </div>

      {currentTask && (
        <div className="mb-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="text-xs text-blue-400 mb-1">Tâche en cours</div>
          <div className="text-sm text-white truncate">{currentTask}</div>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Tâches</span>
            <span className="text-white">{tasksCompleted}/{tasksTotal}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">XP</span>
            <span className="text-white">{xp}/1000</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
