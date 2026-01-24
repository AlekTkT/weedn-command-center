'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Wallet, RefreshCw, ArrowLeft, CreditCard, Send,
  TrendingUp, AlertCircle, Landmark, PiggyBank, Receipt,
  ArrowUpRight, ArrowDownRight, Copy, ExternalLink, QrCode,
  Euro, Clock, CheckCircle2, XCircle, Banknote, Calculator, Coins
} from 'lucide-react'

// Types
interface CryptoAsset {
  asset: string
  balance: number
  priceUsd: number
  priceEur: number
  valueUsd: number
  valueEur: number
  change24h: number
}

interface TreasuryData {
  holdings: {
    totalBalance: number
    availableCash: number
    pendingPayments: number
    monthlyProfit: number
    yearToDateProfit: number
  }
  accounts: Array<{
    id: string
    name: string
    bank: string
    entity: 'WEEDN' | 'BIJAN_PARIS' | 'HOLDINGS' | 'PERSONAL'
    type: 'business' | 'savings' | 'pos' | 'personal' | 'crypto'
    balance: number
    currency: string
    lastSync: string | null
    status: 'active' | 'pending' | 'error'
  }>
  crypto: CryptoAsset | null
  paymentMethods: Array<{
    id: string
    name: string
    provider: string
    entity: string
    type: 'card' | 'bank_transfer' | 'pos' | 'cash'
    enabled: boolean
    monthlyVolume: number
    fees: number
    feeRate: number
  }>
  pendingInvoices: Array<{
    id: string
    vendor: string
    amount: number
    dueDate: string
    status: 'pending' | 'overdue' | 'paid'
    entity: string
  }>
  recentTransactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    type: 'credit' | 'debit'
    entity: string
    category: string
  }>
  subscriptions: {
    active: number
    monthlyTotal: number
    alerts: number
  }
}

interface PaymentLink {
  id: string
  amount: number
  description: string
  entity: string
  url: string
  qrCode: string
  status: 'active' | 'paid' | 'expired'
  createdAt: string
  expiresAt: string
}

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // États pour la création de lien de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    entity: 'WEEDN',
    expiresIn: '24h'
  })
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/treasury')
      const json = await res.json()

      if (json.success) {
        setData(json.data)
        setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      } else {
        setError(json.error || 'Erreur chargement')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const createPaymentLink = async () => {
    try {
      const res = await fetch('/api/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          description: paymentForm.description,
          entity: paymentForm.entity,
          expiresIn: paymentForm.expiresIn
        })
      })
      const json = await res.json()
      if (json.success) {
        setCreatedLink(json.link)
      } else {
        alert('Erreur: ' + json.error)
      }
    } catch (e) {
      alert('Erreur création lien')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copié!')
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
              <PiggyBank className="text-cyan-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Trésorerie Holdings</h1>
              <p className="text-sm text-gray-400">COURTHIEU Holdings • Gestion financière complète</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90"
            >
              <Send size={16} />
              Créer lien de paiement
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

        {/* KPIs Trésorerie */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass rounded-xl p-5 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Wallet size={14} />
                Solde Total Holdings
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {loading ? '...' : formatCurrency(data.holdings.totalBalance)}
              </div>
              <div className="text-xs text-gray-400">Tous comptes confondus</div>
            </div>

            <div className="glass rounded-xl p-5 border border-green-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Banknote size={14} />
                Cash Disponible
              </div>
              <div className="text-2xl font-bold text-green-400">
                {loading ? '...' : formatCurrency(data.holdings.availableCash)}
              </div>
              <div className="text-xs text-gray-400">Utilisable immédiatement</div>
            </div>

            <div className="glass rounded-xl p-5 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock size={14} />
                Paiements en attente
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {loading ? '...' : formatCurrency(data.holdings.pendingPayments)}
              </div>
              <div className="text-xs text-gray-400">Factures à régler</div>
            </div>

            <div className="glass rounded-xl p-5 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <TrendingUp size={14} />
                Bénéfice du mois
              </div>
              <div className={`text-2xl font-bold ${data.holdings.monthlyProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {loading ? '...' : formatCurrency(data.holdings.monthlyProfit)}
              </div>
              <div className="text-xs text-gray-400">Net après charges</div>
            </div>

            <div className="glass rounded-xl p-5 border border-purple-500/30">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calculator size={14} />
                YTD Profit
              </div>
              <div className={`text-2xl font-bold ${data.holdings.yearToDateProfit >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {loading ? '...' : formatCurrency(data.holdings.yearToDateProfit)}
              </div>
              <div className="text-xs text-gray-400">Depuis janvier</div>
            </div>
          </div>
        )}

        {/* Comptes bancaires */}
        {data && (
          <div className="glass rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Landmark className="text-cyan-400" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-white">Comptes Bancaires</h2>
                  <p className="text-xs text-gray-400">{data.accounts.length} comptes connectés</p>
                </div>
              </div>
              <Link
                href="/banking"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Gérer les comptes <ExternalLink size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.accounts.map((account) => (
                <div
                  key={account.id}
                  className={`bg-gray-800/50 rounded-xl p-4 border ${
                    account.entity === 'WEEDN' ? 'border-emerald-500/20' :
                    account.entity === 'BIJAN_PARIS' ? 'border-pink-500/20' :
                    'border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        account.entity === 'WEEDN' ? 'bg-emerald-500/20' :
                        account.entity === 'BIJAN_PARIS' ? 'bg-pink-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {account.entity === 'WEEDN' ? '🌿' :
                         account.entity === 'BIJAN_PARIS' ? '💎' : '🏢'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{account.name}</div>
                        <div className="text-xs text-gray-500">{account.bank}</div>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      account.status === 'active' ? 'bg-green-400' :
                      account.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                  </div>
                  <div className={`text-2xl font-bold ${account.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {formatCurrency(account.balance)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {account.lastSync ? `Sync: ${account.lastSync}` : 'Non synchronisé'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crypto Assets */}
        {data?.crypto && (
          <div className="glass rounded-2xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                  <Coins className="text-amber-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Crypto Holdings</h2>
                  <p className="text-xs text-gray-400">Portefeuille ETH COURTHIEU</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.crypto.change24h >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {data.crypto.change24h >= 0 ? '+' : ''}{data.crypto.change24h.toFixed(2)}% 24h
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Balance</div>
                <div className="text-xl font-bold text-white">
                  {data.crypto.balance.toFixed(4)} {data.crypto.asset}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Prix actuel</div>
                <div className="text-xl font-bold text-amber-400">
                  €{data.crypto.priceEur.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">${data.crypto.priceUsd.toFixed(2)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Valeur EUR</div>
                <div className="text-xl font-bold text-green-400">
                  €{data.crypto.valueEur.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Valeur USD</div>
                <div className="text-xl font-bold text-cyan-400">
                  ${data.crypto.valueUsd.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              <span className="text-xs text-amber-400/80">
                Balance ETH suivie manuellement. Set ETH_BALANCE env var pour mettre à jour.
              </span>
            </div>
          </div>
        )}

        {/* Moyens de paiement */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Encaissements */}
            <div className="glass rounded-2xl p-6 border border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="text-green-400" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-white">Moyens d'encaissement</h2>
                  <p className="text-xs text-gray-400">Capacités de paiement Holdings</p>
                </div>
              </div>

              <div className="space-y-3">
                {data.paymentMethods.filter(p => p.enabled).map((method) => (
                  <div key={method.id} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        method.type === 'card' ? 'bg-blue-500/20 text-blue-400' :
                        method.type === 'pos' ? 'bg-orange-500/20 text-orange-400' :
                        method.type === 'bank_transfer' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {method.type === 'card' ? <CreditCard size={20} /> :
                         method.type === 'pos' ? '💳' :
                         method.type === 'bank_transfer' ? <Landmark size={20} /> :
                         <Banknote size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.provider} • {method.entity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">
                        {formatCurrency(method.monthlyVolume)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {method.feeRate}% frais
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-green-500/10 rounded-xl">
                <div className="text-sm text-green-400 font-medium mb-1">Total encaissé ce mois</div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(data.paymentMethods.reduce((sum, p) => sum + p.monthlyVolume, 0))}
                </div>
                <div className="text-xs text-gray-400">
                  Frais: {formatCurrency(data.paymentMethods.reduce((sum, p) => sum + p.fees, 0))}
                </div>
              </div>
            </div>

            {/* Abonnements & Factures */}
            <div className="glass rounded-2xl p-6 border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="text-red-400" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-white">Abonnements & Factures</h2>
                  <p className="text-xs text-gray-400">Charges récurrentes</p>
                </div>
              </div>

              {/* Résumé abonnements */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{data.subscriptions.active}</div>
                  <div className="text-xs text-gray-500">Actifs</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(data.subscriptions.monthlyTotal)}</div>
                  <div className="text-xs text-gray-500">/mois</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-bold ${data.subscriptions.alerts > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {data.subscriptions.alerts}
                  </div>
                  <div className="text-xs text-gray-500">Alertes</div>
                </div>
              </div>

              {/* Factures en attente */}
              <div className="text-sm text-gray-400 mb-3">Factures à régler</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.pendingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`bg-gray-800/50 rounded-lg p-3 flex items-center justify-between ${
                      invoice.status === 'overdue' ? 'border border-red-500/30' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm text-white">{invoice.vendor}</div>
                      <div className="text-xs text-gray-500">
                        Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${invoice.status === 'overdue' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {formatCurrency(invoice.amount)}
                      </div>
                      {invoice.status === 'overdue' && (
                        <span className="text-xs text-red-400">En retard</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/suppliers"
                className="mt-4 block text-center text-sm text-cyan-400 hover:text-cyan-300"
              >
                Voir toutes les factures →
              </Link>
            </div>
          </div>
        )}

        {/* Transactions récentes */}
        {data && (
          <div className="glass rounded-2xl p-6 border border-gray-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Euro className="text-gray-400" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-white">Transactions récentes</h2>
                  <p className="text-xs text-gray-400">Derniers mouvements Holdings</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-left">Description</th>
                    <th className="pb-3 text-left">Entité</th>
                    <th className="pb-3 text-left">Catégorie</th>
                    <th className="pb-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800/50">
                      <td className="py-3 text-sm text-gray-400">
                        {new Date(tx.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 text-sm text-white">{tx.description}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.entity === 'WEEDN' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.entity === 'BIJAN_PARIS' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {tx.entity}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">{tx.category}</td>
                      <td className={`py-3 text-sm font-medium text-right ${
                        tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="glass rounded-xl p-5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-left"
          >
            <Send className="text-cyan-400 mb-3" size={24} />
            <div className="text-sm font-medium text-white">Créer lien de paiement</div>
            <div className="text-xs text-gray-500">Viva.com</div>
          </button>

          <Link
            href="/profits"
            className="glass rounded-xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all text-left"
          >
            <TrendingUp className="text-green-400 mb-3" size={24} />
            <div className="text-sm font-medium text-white">Suivi Bénéfices</div>
            <div className="text-xs text-gray-500">Marges & rentabilité</div>
          </Link>

          <Link
            href="/banking"
            className="glass rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all text-left"
          >
            <Landmark className="text-purple-400 mb-3" size={24} />
            <div className="text-sm font-medium text-white">Banking Hub</div>
            <div className="text-xs text-gray-500">Relevés & virements</div>
          </Link>

          <Link
            href="/suppliers"
            className="glass rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/40 transition-all text-left"
          >
            <Receipt className="text-orange-400 mb-3" size={24} />
            <div className="text-sm font-medium text-white">Fournisseurs</div>
            <div className="text-xs text-gray-500">Factures & commandes</div>
          </Link>
        </div>

      </main>

      {/* Modal création lien de paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Créer un lien de paiement</h3>
              <button
                onClick={() => { setShowPaymentModal(false); setCreatedLink(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            {!createdLink ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Montant (€)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Description</label>
                  <input
                    type="text"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    placeholder="Achat produits, service..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Entité</label>
                  <select
                    value={paymentForm.entity}
                    onChange={(e) => setPaymentForm({ ...paymentForm, entity: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="WEEDN">WEEDN (RETAR DIO)</option>
                    <option value="BIJAN_PARIS">BIJAN PARIS</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Expiration</label>
                  <select
                    value={paymentForm.expiresIn}
                    onChange={(e) => setPaymentForm({ ...paymentForm, expiresIn: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="1h">1 heure</option>
                    <option value="24h">24 heures</option>
                    <option value="7d">7 jours</option>
                    <option value="30d">30 jours</option>
                  </select>
                </div>

                <button
                  onClick={createPaymentLink}
                  disabled={!paymentForm.amount || !paymentForm.description}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Générer le lien
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-green-400" size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Lien créé!</h4>
                <p className="text-sm text-gray-400 mb-4">
                  {formatCurrency(createdLink.amount)} - {createdLink.description}
                </p>

                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={createdLink.url}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-cyan-400 outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(createdLink.url)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(createdLink.url, '_blank')}
                    className="flex-1 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700"
                  >
                    Ouvrir
                  </button>
                  <button
                    onClick={() => { setCreatedLink(null); setPaymentForm({ amount: '', description: '', entity: 'WEEDN', expiresIn: '24h' }); }}
                    className="flex-1 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600"
                  >
                    Nouveau lien
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
