'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, Calendar, Trophy } from 'lucide-react'

interface ObjectiveTrackerProps {
  currentCA: number
  targetCA: number
  startDate: string
  endDate: string
  daysElapsed: number
  totalDays: number
}

export default function ObjectiveTracker({
  currentCA,
  targetCA,
  startDate,
  endDate,
  daysElapsed,
  totalDays
}: ObjectiveTrackerProps) {
  const progress = (currentCA / targetCA) * 100
  const timeProgress = (daysElapsed / totalDays) * 100
  const onTrack = progress >= timeProgress

  return (
    <div className="glass rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="text-emerald-400" size={24} />
          <h3 className="text-lg font-bold text-white">Objectif +40% CA</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          onTrack ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {onTrack ? '✓ On Track' : '⚠ En retard'}
        </div>
      </div>

      {/* Progress principal */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progression CA</span>
          <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          />
          {/* Marqueur objectif temps */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: `${timeProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">€{currentCA.toLocaleString()}</span>
          <span className="text-gray-500">€{targetCA.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <Calendar className="mx-auto text-blue-400 mb-1" size={20} />
          <div className="text-lg font-bold text-white">J+{daysElapsed}</div>
          <div className="text-xs text-gray-400">/{totalDays} jours</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg">
          <TrendingUp className="mx-auto text-emerald-400 mb-1" size={20} />
          <div className="text-lg font-bold text-white">
            +{((currentCA / (targetCA / 1.4) - 1) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">vs départ</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg">
          <Trophy className="mx-auto text-yellow-400 mb-1" size={20} />
          <div className="text-lg font-bold text-white">
            €{Math.max(0, targetCA - currentCA).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">restant</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{startDate}</span>
          <span>Aujourd'hui</span>
          <span>{endDate}</span>
        </div>
      </div>
    </div>
  )
}
