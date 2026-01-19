'use client'

import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'

interface AgentCardProps {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  color: string
  tasksCompleted?: number
  tasksTotal?: number
  level?: number
  xp?: number
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
  online: 'Actif',
  working: 'En cours...',
  idle: 'En attente',
  offline: 'Inactif'
}

export default function AgentCard({
  name,
  icon,
  status,
  color,
  currentTask,
  onClick
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-all"
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-gray-400">{statusLabels[status]}</span>
            </div>
          </div>
        </div>
      </div>

      {currentTask && (
        <div className="mb-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="text-xs text-blue-400 mb-1">Tâche en cours</div>
          <div className="text-sm text-white truncate">{currentTask}</div>
        </div>
      )}

      {/* Action button */}
      <button
        className="w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        style={{
          backgroundColor: `${color}20`,
          color: color
        }}
      >
        <MessageSquare size={14} />
        Communiquer
      </button>
    </motion.div>
  )
}
