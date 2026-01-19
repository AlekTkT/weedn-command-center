'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'

interface Activity {
  id: string
  agent: string
  agentIcon: string
  action: string
  result: 'success' | 'error' | 'pending'
  timestamp: string
  details?: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

const resultIcons = {
  success: <CheckCircle className="text-emerald-400" size={16} />,
  error: <AlertCircle className="text-red-400" size={16} />,
  pending: <Clock className="text-yellow-400" size={16} />
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="text-emerald-400" size={18} />
        <h3 className="font-semibold text-white">Activité en temps réel</h3>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="text-xl">{activity.agentIcon}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{activity.agent}</span>
                  {resultIcons[activity.result]}
                </div>
                <p className="text-sm text-gray-400 truncate">{activity.action}</p>
                {activity.details && (
                  <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                )}
              </div>

              <div className="text-xs text-gray-500 whitespace-nowrap">
                {activity.timestamp}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
