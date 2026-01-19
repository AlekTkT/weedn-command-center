'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Filter, Download, Eye, Calendar,
  Building2, Euro, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  supplierId: string;
  supplierName: string;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  source: 'gmail' | 'incwo' | 'manual' | 'whatsapp';
  attachmentUrl?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
}

// Factures simulées basées sur les fournisseurs connus
const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    number: 'FAC-2026-0119',
    date: '2026-01-14',
    dueDate: '2026-02-14',
    supplierId: 'sumup',
    supplierName: 'SumUp',
    total: 19.90,
    status: 'paid',
    items: [
      { description: 'Abonnement mensuel terminal', quantity: 1, unitPrice: 19.90, total: 19.90 }
    ],
    source: 'gmail',
    notes: 'Prélèvement automatique'
  },
  {
    id: 'inv-002',
    number: 'CBD-2026-006',
    date: '2026-01-06',
    dueDate: '2026-01-20',
    supplierId: 'cbd-ethic',
    supplierName: 'CBD ETHIC',
    total: 850.00,
    status: 'pending',
    items: [
      { description: 'Fleurs CBD Indoor Mix', quantity: 500, unitPrice: 1.20, total: 600.00 },
      { description: 'Résines Premium', quantity: 100, unitPrice: 2.50, total: 250.00 }
    ],
    source: 'gmail',
    notes: 'Offre dernières quantités - Stock limité'
  },
  {
    id: 'inv-003',
    number: 'TNW-PI2402332',
    date: '2024-07-29',
    supplierId: 'the-new-ways',
    supplierName: 'The New Ways',
    total: 1250.00,
    status: 'paid',
    items: [
      { description: 'Fleurs CBD Greenhouse', quantity: 1000, unitPrice: 0.90, total: 900.00 },
      { description: 'Huiles CBD 10%', quantity: 20, unitPrice: 17.50, total: 350.00 }
    ],
    source: 'gmail'
  },
  {
    id: 'inv-004',
    number: 'CAL-2025-0130',
    date: '2025-01-30',
    supplierId: 'cali-terpenes',
    supplierName: 'Cali Terpenes',
    total: 320.00,
    status: 'paid',
    items: [
      { description: 'Terpènes OG Kush 10ml', quantity: 10, unitPrice: 18.00, total: 180.00 },
      { description: 'Terpènes Gelato 10ml', quantity: 8, unitPrice: 17.50, total: 140.00 }
    ],
    source: 'gmail',
    notes: 'Contact: Monica Rusu'
  },
  {
    id: 'inv-005',
    number: 'PAP-2024-0708',
    date: '2024-07-08',
    supplierId: 'papeo',
    supplierName: 'Papeo',
    total: 189.50,
    status: 'paid',
    items: [
      { description: 'Sachets zip personnalisés 1000pcs', quantity: 1, unitPrice: 129.00, total: 129.00 },
      { description: 'Étiquettes produits 500pcs', quantity: 1, unitPrice: 60.50, total: 60.50 }
    ],
    source: 'gmail',
    notes: 'Packaging boutique'
  },
  {
    id: 'inv-006',
    number: 'LP-2025-0703',
    date: '2025-07-03',
    supplierId: 'legalplace',
    supplierName: 'LegalPlace',
    total: 79.00,
    status: 'paid',
    items: [
      { description: 'Abonnement juridique mensuel', quantity: 1, unitPrice: 79.00, total: 79.00 }
    ],
    source: 'gmail',
    notes: 'Services création société'
  },
  {
    id: 'inv-007',
    number: 'COL-2024-1014',
    date: '2024-10-14',
    supplierId: 'colissimo',
    supplierName: 'Colissimo / La Poste',
    total: 156.80,
    status: 'paid',
    items: [
      { description: 'Envois Colissimo (lot)', quantity: 28, unitPrice: 5.60, total: 156.80 }
    ],
    source: 'gmail',
    notes: 'FACILITE 365353'
  },
  {
    id: 'inv-008',
    number: 'CAN-2025-0207',
    date: '2025-02-07',
    supplierId: 'canatura-wholesale',
    supplierName: 'Canatura Wholesale',
    total: 0,
    status: 'draft',
    items: [],
    source: 'gmail',
    notes: 'Devis en cours - Contact: Kris Teaotea'
  }
];

export default function InvoicesPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'supplier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Charger les fournisseurs
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data.suppliers || []);
        }
      } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
      }
    };
    fetchSuppliers();
  }, []);

  // Stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingAmount: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0),
  };

  // Filtrage et tri
  const filteredInvoices = invoices
    .filter(inv => {
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      if (filterSupplier !== 'all' && inv.supplierId !== filterSupplier) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return inv.number.toLowerCase().includes(q) ||
               inv.supplierName.toLowerCase().includes(q) ||
               inv.notes?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'total') {
        comparison = a.total - b.total;
      } else if (sortBy === 'supplier') {
        comparison = a.supplierName.localeCompare(b.supplierName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
            <CheckCircle size={12} /> Payée
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
            <Clock size={12} /> En attente
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
            <AlertCircle size={12} /> En retard
          </span>
        );
      case 'draft':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
            <FileText size={12} /> Brouillon
          </span>
        );
    }
  };

  const getSourceBadge = (source: Invoice['source']) => {
    const styles = {
      gmail: 'bg-red-500/20 text-red-400',
      incwo: 'bg-blue-500/20 text-blue-400',
      manual: 'bg-purple-500/20 text-purple-400',
      whatsapp: 'bg-green-500/20 text-green-400'
    };
    const labels = {
      gmail: 'Gmail',
      incwo: 'Incwo',
      manual: 'Manuel',
      whatsapp: 'WhatsApp'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${styles[source]}`}>
        {labels[source]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Factures</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.paid}</div>
          <div className="text-xs text-gray-400">Payées</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-gray-400">En attente</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-xs text-gray-400">En retard</div>
        </div>
        <div className="glass rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <div className="text-xl font-bold text-white">€{stats.totalAmount.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-emerald-400">€{stats.paidAmount.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400">Réglé</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">€{stats.pendingAmount.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400">À payer</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="paid">Payées</option>
          <option value="pending">En attente</option>
          <option value="overdue">En retard</option>
          <option value="draft">Brouillons</option>
        </select>

        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Tous les fournisseurs</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-') as ['date' | 'total' | 'supplier', 'asc' | 'desc'];
            setSortBy(by);
            setSortOrder(order);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="date-desc">Date ↓</option>
          <option value="date-asc">Date ↑</option>
          <option value="total-desc">Montant ↓</option>
          <option value="total-asc">Montant ↑</option>
          <option value="supplier-asc">Fournisseur A-Z</option>
          <option value="supplier-desc">Fournisseur Z-A</option>
        </select>
      </div>

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="mx-auto mb-4" size={48} />
          <p>Aucune facture trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <motion.div
              key={invoice.id}
              layout
              className="glass rounded-xl overflow-hidden"
            >
              {/* Header facture */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      invoice.status === 'paid' ? 'bg-emerald-500/20' :
                      invoice.status === 'pending' ? 'bg-yellow-500/20' :
                      invoice.status === 'overdue' ? 'bg-red-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      <FileText className={
                        invoice.status === 'paid' ? 'text-emerald-400' :
                        invoice.status === 'pending' ? 'text-yellow-400' :
                        invoice.status === 'overdue' ? 'text-red-400' :
                        'text-gray-400'
                      } size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{invoice.number}</span>
                        {getSourceBadge(invoice.source)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Building2 size={14} />
                        <span>{invoice.supplierName}</span>
                        <span>•</span>
                        <Calendar size={14} />
                        <span>{formatDate(invoice.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        €{invoice.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {expandedId === invoice.id ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>
              </div>

              {/* Détails expandables */}
              <AnimatePresence>
                {expandedId === invoice.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* Dates */}
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-400">Date facture:</span>
                          <span className="text-white ml-2">{formatDate(invoice.date)}</span>
                        </div>
                        {invoice.dueDate && (
                          <div>
                            <span className="text-gray-400">Échéance:</span>
                            <span className={`ml-2 ${
                              new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
                                ? 'text-red-400'
                                : 'text-white'
                            }`}>
                              {formatDate(invoice.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Articles */}
                      {invoice.items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Détail</h4>
                          <div className="bg-white/5 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-white/5">
                                <tr className="text-gray-400">
                                  <th className="text-left p-2">Description</th>
                                  <th className="text-right p-2">Qté</th>
                                  <th className="text-right p-2">P.U.</th>
                                  <th className="text-right p-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoice.items.map((item, idx) => (
                                  <tr key={idx} className="border-t border-white/5">
                                    <td className="p-2 text-white">{item.description}</td>
                                    <td className="p-2 text-right text-gray-300">{item.quantity}</td>
                                    <td className="p-2 text-right text-gray-300">€{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-2 text-right text-white font-medium">€{item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-white/5">
                                <tr>
                                  <td colSpan={3} className="p-2 text-right text-gray-400 font-medium">Total TTC</td>
                                  <td className="p-2 text-right text-emerald-400 font-bold">€{invoice.total.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {invoice.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Notes</h4>
                          <p className="text-sm text-gray-300">{invoice.notes}</p>
                        </div>
                      )}

                      {/* Lien fournisseur */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigation vers fournisseur (à implémenter)
                          }}
                          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          <Building2 size={14} />
                          Voir fournisseur
                          <ExternalLink size={12} />
                        </button>
                        <div className="flex gap-2">
                          {invoice.attachmentUrl && (
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm">
                              <Download size={14} />
                              Télécharger
                            </button>
                          )}
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-400 text-sm">
                            <Eye size={14} />
                            Voir détails
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info source */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw size={14} />
          <span>Sources: Gmail (cbdoshop75, theonlyweedn), WhatsApp, Incwo</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Les factures sont automatiquement détectées via la veille email et liées aux fournisseurs connus.
        </p>
      </div>
    </div>
  );
}
