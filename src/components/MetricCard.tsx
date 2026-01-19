'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  previousValue?: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  icon?: React.ReactNode
  color?: string
}

export default function MetricCard({
  title,
  value,
  trend = 'stable',
  trendValue,
  icon,
  color = 'emerald'
}: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    stable: 'text-gray-400'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>

      <div className="flex items-end gap-2">
        <motion.span
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className={`text-2xl font-bold text-${color}-400`}
        >
          {value}
        </motion.span>

        {trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
            <TrendIcon size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
