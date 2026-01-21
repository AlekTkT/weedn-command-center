'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingBag, ArrowLeft, RefreshCw, Package, TrendingUp,
  Calendar, ExternalLink, Search, Filter
} from 'lucide-react'

interface Order {
  id: string
  name: string
  created_at: string
  total_price: string
  financial_status: string
  fulfillment_status: string | null
  customer: {
    first_name: string
    last_name: string
    email: string
  } | null
  line_items: Array<{
    title: string
    quantity: number
    price: string
  }>
}

interface ShopifyData {
  orders: Order[]
  summary: {
    totalRevenue: number
    orderCount: number
    avgOrderValue: number
  }
}

export default function ShopifySalesPage() {
  const [data, setData] = useState<ShopifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/shopify/orders?limit=50')
      if (!res.ok) throw new Error(`Erreur API: ${res.status}`)

      const json = await res.json()
      if (json.success && json.data) {
        const orders = json.data.orders || []
        const totalRevenue = orders.reduce((sum: number, o: Order) => sum + parseFloat(o.total_price || '0'), 0)

        setData({
          orders,
          summary: {
            totalRevenue,
            orderCount: orders.length,
            avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
          }
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'refunded': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getFulfillmentColor = (status: string | null) => {
    if (!status) return 'bg-yellow-500/20 text-yellow-400'
    switch (status) {
      case 'fulfilled': return 'bg-green-500/20 text-green-400'
      case 'partial': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredOrders = data?.orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customer?.first_name} ${order.customer?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.financial_status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/weedn" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </a>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShoppingBag size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ventes Shopify</h1>
              <p className="text-sm text-gray-400">weedn.fr - E-commerce</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <a
              href="https://admin.shopify.com/store/f24081-64/orders"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-500/30"
            >
              Shopify Admin <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 border border-blue-500/30">
              <div className="text-xs text-gray-500 mb-1">CA Total</div>
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(data.summary.totalRevenue)}
              </div>
            </div>
            <div className="glass rounded-xl p-5 border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Commandes</div>
              <div className="text-2xl font-bold text-white">
                {data.summary.orderCount}
              </div>
            </div>
            <div className="glass rounded-xl p-5 border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Panier moyen</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(data.summary.avgOrderValue)}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par n° commande, client, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payees</option>
              <option value="pending">En attente</option>
              <option value="refunded">Remboursees</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Orders List */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Commandes ({filteredOrders.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune commande trouvee</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-white">{order.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.financial_status)}`}>
                          {order.financial_status === 'paid' ? 'Payee' :
                           order.financial_status === 'pending' ? 'En attente' :
                           order.financial_status === 'refunded' ? 'Remboursee' : order.financial_status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getFulfillmentColor(order.fulfillment_status)}`}>
                          {order.fulfillment_status === 'fulfilled' ? 'Expediee' :
                           order.fulfillment_status === 'partial' ? 'Partielle' : 'A expedier'}
                        </span>
                      </div>

                      {order.customer && (
                        <div className="text-sm text-gray-400 mb-2">
                          {order.customer.first_name} {order.customer.last_name}
                          <span className="text-gray-600 ml-2">({order.customer.email})</span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {order.line_items.slice(0, 3).map((item, i) => (
                          <span key={i}>
                            {item.quantity}x {item.title}
                            {i < Math.min(order.line_items.length, 3) - 1 && ' • '}
                          </span>
                        ))}
                        {order.line_items.length > 3 && (
                          <span className="text-gray-600"> +{order.line_items.length - 3} autres</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(order.total_price)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Calendar size={12} />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
