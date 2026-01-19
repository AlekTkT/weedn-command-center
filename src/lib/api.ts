// API Services pour Weedn Command Center
// Connexions: Shopify, Klaviyo, GA4, Make.com

const SHOPIFY_CONFIG = {
  store: 'f24081-64.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  apiVersion: '2024-01'
}

const KLAVIYO_CONFIG = {
  apiKey: process.env.KLAVIYO_API_KEY || '',
  baseUrl: 'https://a.klaviyo.com/api'
}

const MAKE_CONFIG = {
  baseUrl: 'https://eu1.make.com/api/v2',
  apiToken: process.env.MAKE_API_TOKEN || '95e514a4-d5be-4d91-99f2-5ef89efdee12',
  orgId: 864497
}

// ========== SHOPIFY API ==========
export async function getShopifyOrders(limit = 50) {
  const res = await fetch(
    `https://${SHOPIFY_CONFIG.store}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders.json?limit=${limit}&status=any`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
        'Content-Type': 'application/json'
      }
    }
  )
  return res.json()
}

export async function getShopifyProducts() {
  const res = await fetch(
    `https://${SHOPIFY_CONFIG.store}/admin/api/${SHOPIFY_CONFIG.apiVersion}/products.json?limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
        'Content-Type': 'application/json'
      }
    }
  )
  return res.json()
}

export async function getShopifyAnalytics(period: 'today' | 'week' | 'month' = 'week') {
  const now = new Date()
  let sinceDate: Date

  switch (period) {
    case 'today':
      sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      sinceDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  const res = await fetch(
    `https://${SHOPIFY_CONFIG.store}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders.json?status=any&created_at_min=${sinceDate.toISOString()}&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
        'Content-Type': 'application/json'
      }
    }
  )

  const data = await res.json()
  const orders = data.orders || []
  const paidOrders = orders.filter((o: any) => o.financial_status === 'paid')

  return {
    period,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    revenue: paidOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0),
    avgOrderValue: paidOrders.length
      ? paidOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0) / paidOrders.length
      : 0
  }
}

// ========== MAKE.COM API ==========
export async function getMakeScenarios() {
  const res = await fetch(
    `${MAKE_CONFIG.baseUrl}/scenarios?organizationId=${MAKE_CONFIG.orgId}`,
    {
      headers: {
        'Authorization': `Token ${MAKE_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return res.json()
}

export async function triggerMakeScenario(scenarioId: number) {
  const res = await fetch(
    `${MAKE_CONFIG.baseUrl}/scenarios/${scenarioId}/run`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${MAKE_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return res.json()
}

// ========== AGENTS STATUS ==========
export interface AgentStatus {
  id: string
  name: string
  icon: string
  status: 'online' | 'idle' | 'offline' | 'working'
  tasksCompleted: number
  tasksTotal: number
  level: number
  xp: number
  currentTask?: string
}

export function getAgentsFromTiles(): AgentStatus[] {
  // Ces données viennent de ~/.vibecraft/data/tiles.json
  return [
    { id: 'weedn-central', name: 'Chef d\'Orchestre', icon: '👑', status: 'online', tasksCompleted: 51, tasksTotal: 60, level: 5, xp: 950 },
    { id: 'agent-seo', name: 'Agent SEO', icon: '🔍', status: 'online', tasksCompleted: 8, tasksTotal: 12, level: 2, xp: 450 },
    { id: 'agent-contenu', name: 'Agent Contenu', icon: '📝', status: 'online', tasksCompleted: 14, tasksTotal: 20, level: 2, xp: 466 },
    { id: 'agent-ventes', name: 'Agent Ventes', icon: '💰', status: 'online', tasksCompleted: 22, tasksTotal: 25, level: 4, xp: 890 },
    { id: 'agent-support', name: 'Agent Support', icon: '💬', status: 'online', tasksCompleted: 5, tasksTotal: 15, level: 2, xp: 380 },
    { id: 'agent-inventaire', name: 'Agent Inventaire', icon: '📦', status: 'online', tasksCompleted: 2, tasksTotal: 10, level: 1, xp: 120 },
    { id: 'agent-shopify', name: 'Agent Shopify', icon: '🛍️', status: 'idle', tasksCompleted: 0, tasksTotal: 8, level: 1, xp: 0 },
    { id: 'agent-email', name: 'Agent Email', icon: '📧', status: 'idle', tasksCompleted: 3, tasksTotal: 10, level: 1, xp: 100 },
    { id: 'agent-analytics', name: 'Agent Analytics', icon: '📊', status: 'idle', tasksCompleted: 5, tasksTotal: 15, level: 1, xp: 80 },
  ]
}
