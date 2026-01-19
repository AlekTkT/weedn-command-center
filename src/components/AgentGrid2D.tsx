'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface Agent {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  color: string
  q: number
  r: number
}

interface AgentGrid2DProps {
  agents: Agent[]
  onAgentClick?: (agent: Agent) => void
}

// Conversion coordonnées hexagonales vers pixels
function hexToPixel(q: number, r: number, size: number) {
  const x = size * (3/2 * q)
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  return { x, y }
}

const statusColors = {
  online: '#10B981',
  working: '#3B82F6',
  idle: '#F59E0B',
  offline: '#6B7280'
}

export default function AgentGrid2D({ agents, onAgentClick }: AgentGrid2DProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const hexSize = 60
  const centerX = 250
  const centerY = 200

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🗺️ Vue Agents 2D</h3>

      <svg width="100%" height="400" viewBox="0 0 500 400">
        {/* Lignes de connexion */}
        {agents.map((agent, i) => {
          const { x, y } = hexToPixel(agent.q, agent.r, hexSize)
          return agents.slice(i + 1).map((other) => {
            const { x: ox, y: oy } = hexToPixel(other.q, other.r, hexSize)
            const distance = Math.sqrt((agent.q - other.q) ** 2 + (agent.r - other.r) ** 2)
            if (distance <= 1.5) {
              return (
                <line
                  key={`${agent.id}-${other.id}`}
                  x1={centerX + x}
                  y1={centerY + y}
                  x2={centerX + ox}
                  y2={centerY + oy}
                  stroke="rgba(16, 185, 129, 0.2)"
                  strokeWidth="2"
                />
              )
            }
            return null
          })
        })}

        {/* Hexagones des agents */}
        {agents.map((agent) => {
          const { x, y } = hexToPixel(agent.q, agent.r, hexSize)
          const isHovered = hoveredAgent === agent.id
          const points = Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const px = hexSize * 0.8 * Math.cos(angle)
            const py = hexSize * 0.8 * Math.sin(angle)
            return `${px},${py}`
          }).join(' ')

          return (
            <motion.g
              key={agent.id}
              transform={`translate(${centerX + x}, ${centerY + y})`}
              whileHover={{ scale: 1.1 }}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              onClick={() => onAgentClick?.(agent)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow effect */}
              <polygon
                points={points}
                fill="none"
                stroke={statusColors[agent.status]}
                strokeWidth={isHovered ? "3" : "2"}
                opacity={isHovered ? 1 : 0.6}
                filter="url(#glow)"
              />

              {/* Hexagon fill */}
              <polygon
                points={points}
                fill={agent.color}
                opacity="0.3"
              />

              {/* Status indicator */}
              <circle
                cx={hexSize * 0.5}
                cy={-hexSize * 0.5}
                r="6"
                fill={statusColors[agent.status]}
              />

              {/* Icon */}
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                y="-5"
              >
                {agent.icon}
              </text>

              {/* Name */}
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="white"
                y="20"
                fontWeight="500"
              >
                {agent.name.replace('Agent ', '')}
              </text>
            </motion.g>
          )
        })}

        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Légende */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
