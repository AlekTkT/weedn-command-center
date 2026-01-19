'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useRef } from 'react'

interface Agent {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  color: string
  q: number
  r: number
  lastAction?: string
  currentTask?: string
  codePreview?: string
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

const statusLabels = {
  online: 'En ligne',
  working: 'En cours',
  idle: 'Inactif',
  offline: 'Hors ligne'
}

// Exemples de code par agent pour la démo
const agentCodeExamples: Record<string, string> = {
  'weedn-central': `// Chef d'Orchestre - Coordination
async function orchestrate() {
  const context = await getBusinessContext();
  const priority = analyzePriorities(context);

  // Déléguer aux agents spécialisés
  await delegateToAgent('ventes', priority.sales);
  await delegateToAgent('inventaire', priority.stock);

  return generateDailyReport();
}`,
  'agent-ventes': `// Agent Ventes - Analyse commerciale
const analyzeConversion = async () => {
  const funnel = await shopify.getFunnel();
  const cartAbandonment = funnel.abandoned / funnel.total;

  if (cartAbandonment > 0.7) {
    await klaviyo.triggerFlow('cart_recovery');
  }
  return { rate: cartAbandonment };
}`,
  'agent-inventaire': `// Agent Inventaire - Gestion stocks
const checkStock = async () => {
  const products = await shopify.getProducts();
  const lowStock = products.filter(p =>
    p.inventory_quantity <= p.reorder_point
  );

  if (lowStock.length > 0) {
    await notifyTeam('stock_alert', lowStock);
  }
}`,
  'agent-email': `// Agent Email - Klaviyo automation
const sendCampaign = async (segment, template) => {
  const audience = await klaviyo.getSegment(segment);

  await klaviyo.createCampaign({
    name: 'Soldes Janvier',
    audience_id: audience.id,
    template_id: template,
    send_time: 'optimal'
  });
}`,
  'agent-seo': `// Agent SEO - Optimisation
const analyzeKeywords = async () => {
  const rankings = await getSearchRankings();
  const opportunities = rankings.filter(k =>
    k.position > 10 && k.volume > 100
  );

  return generateSEOReport(opportunities);
}`,
  'agent-contenu': `// Agent Contenu - Création
const generatePost = async (topic) => {
  const context = await getWeednContext();
  const post = await ai.generate({
    type: 'instagram',
    topic,
    tone: 'decontracte',
    hashtags: true
  });
  return post;
}`,
  'agent-support': `// Agent Support - SAV
const handleTicket = async (ticket) => {
  const sentiment = await analyzeSentiment(ticket);
  const category = classifyIssue(ticket);

  if (sentiment.urgent || category === 'refund') {
    await escalateToHuman(ticket);
  } else {
    await sendAutoResponse(ticket, category);
  }
}`,
  'agent-shopify': `// Agent Shopify - E-commerce
const updatePricing = async (rules) => {
  const products = await shopify.getProducts();

  for (const product of products) {
    const newPrice = applyPricingRules(product, rules);
    await shopify.updateVariant(product.id, {
      price: newPrice
    });
  }
}`,
  'agent-analytics': `// Agent Analytics - KPIs
const generateReport = async () => {
  const [ga, shopify, klaviyo] = await Promise.all([
    ga4.getMetrics('7daysAgo', 'today'),
    shopify.getAnalytics(),
    klaviyo.getFlowMetrics()
  ]);

  return mergeMetrics(ga, shopify, klaviyo);
}`
}

export default function AgentGrid2D({ agents, onAgentClick }: AgentGrid2DProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hexSize = 60
  const centerX = 250
  const centerY = 200

  // Debounced hover handler pour éviter les bugs
  const handleMouseEnter = useCallback((agentId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredAgent(agentId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAgent(null)
    }, 100)
  }, [])

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)
    onAgentClick?.(agent)
  }, [selectedAgent, onAgentClick])

  const hoveredAgentData = agents.find(a => a.id === hoveredAgent)

  return (
    <div className="glass rounded-xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🗺️ Vue Agents 2D</h3>
        <div className="text-xs text-gray-400">
          Cliquez sur un agent pour voir son code
        </div>
      </div>

      <div className="flex gap-4">
        {/* SVG Grid */}
        <div className="flex-1">
          <svg width="100%" height="400" viewBox="0 0 500 400" className="overflow-visible">
            {/* Glow filter - défini en premier */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Lignes de connexion */}
            {agents.map((agent, i) => {
              const { x, y } = hexToPixel(agent.q, agent.r, hexSize)
              return agents.slice(i + 1).map((other) => {
                const { x: ox, y: oy } = hexToPixel(other.q, other.r, hexSize)
                const distance = Math.sqrt((agent.q - other.q) ** 2 + (agent.r - other.r) ** 2)
                if (distance <= 1.5) {
                  const isActive = hoveredAgent === agent.id || hoveredAgent === other.id
                  return (
                    <line
                      key={`${agent.id}-${other.id}`}
                      x1={centerX + x}
                      y1={centerY + y}
                      x2={centerX + ox}
                      y2={centerY + oy}
                      stroke={isActive ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.2)"}
                      strokeWidth={isActive ? "3" : "2"}
                      className="transition-all duration-200"
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
              const isSelected = selectedAgent?.id === agent.id
              const points = Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 6
                const px = hexSize * 0.8 * Math.cos(angle)
                const py = hexSize * 0.8 * Math.sin(angle)
                return `${px},${py}`
              }).join(' ')

              return (
                <g
                  key={agent.id}
                  transform={`translate(${centerX + x}, ${centerY + y})`}
                  onMouseEnter={() => handleMouseEnter(agent.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleAgentClick(agent)}
                  style={{ cursor: 'pointer' }}
                  className="transition-transform duration-200"
                >
                  {/* Glow effect */}
                  <motion.polygon
                    points={points}
                    fill="none"
                    stroke={statusColors[agent.status]}
                    strokeWidth={isHovered || isSelected ? 3 : 2}
                    initial={{ opacity: 0.6 }}
                    animate={{
                      opacity: isHovered || isSelected ? 1 : 0.6,
                      scale: isHovered ? 1.1 : 1
                    }}
                    transition={{ duration: 0.15 }}
                    filter={isSelected ? "url(#glow-strong)" : "url(#glow)"}
                  />

                  {/* Hexagon fill */}
                  <motion.polygon
                    points={points}
                    fill={agent.color}
                    initial={{ opacity: 0.3 }}
                    animate={{
                      opacity: isHovered || isSelected ? 0.5 : 0.3,
                      scale: isHovered ? 1.1 : 1
                    }}
                    transition={{ duration: 0.15 }}
                  />

                  {/* Status indicator */}
                  <motion.circle
                    cx={hexSize * 0.5}
                    cy={-hexSize * 0.5}
                    r="6"
                    fill={statusColors[agent.status]}
                    animate={{ scale: isHovered ? 1.2 : 1 }}
                  />

                  {/* Pulse animation for working agents */}
                  {agent.status === 'working' && (
                    <motion.circle
                      cx={hexSize * 0.5}
                      cy={-hexSize * 0.5}
                      r="6"
                      fill="none"
                      stroke={statusColors.working}
                      strokeWidth="2"
                      animate={{
                        r: [6, 12, 6],
                        opacity: [1, 0, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {/* Icon */}
                  <motion.text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="24"
                    y="-5"
                    animate={{ scale: isHovered ? 1.1 : 1 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    {agent.icon}
                  </motion.text>

                  {/* Name */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fill="white"
                    y="20"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {agent.name.replace('Agent ', '')}
                  </text>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.polygon
                      points={points}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Info tooltip on hover */}
          <AnimatePresence>
            {hoveredAgentData && !selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl z-10 min-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{hoveredAgentData.icon}</span>
                  <span className="font-medium text-white">{hoveredAgentData.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[hoveredAgentData.status] }}
                  />
                  <span className="text-gray-400">{statusLabels[hoveredAgentData.status]}</span>
                </div>
                {hoveredAgentData.currentTask && (
                  <div className="mt-2 text-xs text-gray-400">
                    📋 {hoveredAgentData.currentTask}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Code Preview Panel */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="bg-gray-900/90 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <span>{selectedAgent.icon}</span>
                  <span className="text-sm font-medium text-white">{selectedAgent.name}</span>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[selectedAgent.status] }}
                  />
                  <span className="text-xs text-gray-400">{statusLabels[selectedAgent.status]}</span>
                </div>

                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code exemple
                </div>

                <pre className="text-[10px] text-gray-300 bg-gray-950 rounded p-2 overflow-x-auto max-h-[250px] overflow-y-auto font-mono">
                  <code>{agentCodeExamples[selectedAgent.id] || '// Aucun code disponible'}</code>
                </pre>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">Dernière action</div>
                  <div className="text-xs text-gray-400">
                    {selectedAgent.lastAction || 'En attente de tâche...'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400">{statusLabels[status as keyof typeof statusLabels]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
