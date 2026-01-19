'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, MapPin, Clock, CheckCircle, AlertCircle,
  RefreshCw, ExternalLink, ChevronDown, ChevronUp, Calendar,
  Building2, Mail, Plus, X, Search
} from 'lucide-react';

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: 'colissimo' | 'chronopost' | 'dpd' | 'ups' | 'fedex' | 'other';
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  supplierId?: string;
  supplierName?: string;
  origin?: string;
  destination: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  weight?: string;
  description?: string;
  events: TrackingEvent[];
  emailSource?: string;
  emailDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Données simulées de colis (seront remplacées par les vraies données Gmail)
const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'ship-001',
    trackingNumber: '6A12345678901',
    carrier: 'colissimo',
    status: 'in_transit',
    supplierId: 'cbd-ethic',
    supplierName: 'CBD ETHIC',
    origin: 'Lyon',
    destination: '4 Rue Tiquetonne, 75002 Paris',
    estimatedDelivery: '2026-01-21',
    description: 'Commande fleurs CBD - 500g Indoor Mix',
    events: [
      { date: '2026-01-19', time: '14:30', status: 'Pris en charge', location: 'Lyon', description: 'Colis pris en charge par Colissimo' },
      { date: '2026-01-19', time: '18:45', status: 'En transit', location: 'Hub Lyon', description: 'Départ vers le hub de distribution' },
      { date: '2026-01-20', time: '06:00', status: 'En transit', location: 'Hub Paris', description: 'Arrivée au hub Paris' },
    ],
    emailSource: 'cbdoshop75@gmail.com',
    emailDate: '2026-01-19',
    createdAt: '2026-01-19T14:30:00Z',
    updatedAt: '2026-01-20T06:00:00Z',
  },
  {
    id: 'ship-002',
    trackingNumber: 'XY987654321FR',
    carrier: 'chronopost',
    status: 'out_for_delivery',
    supplierId: 'cali-terpenes',
    supplierName: 'Cali Terpenes',
    origin: 'Barcelone, Espagne',
    destination: '4 Rue Tiquetonne, 75002 Paris',
    estimatedDelivery: '2026-01-20',
    description: 'Terpènes OG Kush + Gelato',
    events: [
      { date: '2026-01-17', time: '10:00', status: 'Expédié', location: 'Barcelone', description: 'Colis expédié' },
      { date: '2026-01-18', time: '08:30', status: 'Passage frontière', location: 'Le Perthus', description: 'Dédouanement' },
      { date: '2026-01-19', time: '16:00', status: 'En transit', location: 'Paris', description: 'Arrivée à Paris' },
      { date: '2026-01-20', time: '07:30', status: 'En livraison', location: 'Paris 2ème', description: 'Colis en cours de livraison' },
    ],
    emailSource: 'theonlyweedn@gmail.com',
    emailDate: '2026-01-17',
    createdAt: '2026-01-17T10:00:00Z',
    updatedAt: '2026-01-20T07:30:00Z',
  },
  {
    id: 'ship-003',
    trackingNumber: '8R12345678',
    carrier: 'colissimo',
    status: 'delivered',
    supplierId: 'papeo',
    supplierName: 'Papeo',
    origin: 'Lille',
    destination: '4 Rue Tiquetonne, 75002 Paris',
    estimatedDelivery: '2026-01-18',
    actualDelivery: '2026-01-18',
    description: 'Sachets zip personnalisés + Étiquettes',
    events: [
      { date: '2026-01-16', time: '14:00', status: 'Expédié', location: 'Lille', description: 'Colis expédié' },
      { date: '2026-01-17', time: '09:00', status: 'En transit', location: 'Paris', description: 'Arrivée au hub' },
      { date: '2026-01-18', time: '10:30', status: 'En livraison', location: 'Paris 2ème', description: 'En cours de livraison' },
      { date: '2026-01-18', time: '14:15', status: 'Livré', location: 'Paris 2ème', description: 'Colis remis au destinataire' },
    ],
    emailSource: 'cbdoshop75@gmail.com',
    emailDate: '2026-01-16',
    createdAt: '2026-01-16T14:00:00Z',
    updatedAt: '2026-01-18T14:15:00Z',
  },
];

// Storage key
const SHIPMENTS_STORAGE_KEY = 'weedn-shipments';

export default function ShipmentTracker() {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTracking, setNewTracking] = useState({ number: '', carrier: 'colissimo', description: '' });

  // Charger les colis depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (stored) {
      try {
        setShipments(JSON.parse(stored));
      } catch (e) {
        console.error('Erreur chargement colis:', e);
      }
    }
  }, []);

  // Sauvegarder
  useEffect(() => {
    if (shipments.length > 0) {
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
    }
  }, [shipments]);

  const getCarrierInfo = (carrier: Shipment['carrier']) => {
    const carriers = {
      colissimo: { name: 'Colissimo', color: 'bg-yellow-500', icon: '📮', url: 'https://www.laposte.fr/outils/suivre-vos-envois' },
      chronopost: { name: 'Chronopost', color: 'bg-blue-500', icon: '🚀', url: 'https://www.chronopost.fr/tracking' },
      dpd: { name: 'DPD', color: 'bg-red-500', icon: '📦', url: 'https://www.dpd.fr/trace' },
      ups: { name: 'UPS', color: 'bg-amber-600', icon: '🟫', url: 'https://www.ups.com/track' },
      fedex: { name: 'FedEx', color: 'bg-purple-500', icon: '✈️', url: 'https://www.fedex.com/tracking' },
      other: { name: 'Autre', color: 'bg-gray-500', icon: '📦', url: '' },
    };
    return carriers[carrier];
  };

  const getStatusInfo = (status: Shipment['status']) => {
    const statuses = {
      pending: { label: 'En attente', color: 'bg-gray-500/20 text-gray-400', icon: Clock },
      in_transit: { label: 'En transit', color: 'bg-blue-500/20 text-blue-400', icon: Truck },
      out_for_delivery: { label: 'En livraison', color: 'bg-orange-500/20 text-orange-400', icon: MapPin },
      delivered: { label: 'Livré', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
      exception: { label: 'Problème', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
    };
    return statuses[status];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const refreshTracking = async (shipmentId: string) => {
    setIsLoading(true);
    // TODO: Implémenter l'API de suivi réelle
    // Pour l'instant, simulation d'un refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const addShipment = () => {
    if (!newTracking.number.trim()) return;

    const newShipment: Shipment = {
      id: `ship-${Date.now()}`,
      trackingNumber: newTracking.number.trim(),
      carrier: newTracking.carrier as Shipment['carrier'],
      status: 'pending',
      destination: '4 Rue Tiquetonne, 75002 Paris',
      description: newTracking.description || 'Colis en attente',
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setShipments(prev => [newShipment, ...prev]);
    setNewTracking({ number: '', carrier: 'colissimo', description: '' });
    setShowAddForm(false);
  };

  const deleteShipment = (id: string) => {
    setShipments(prev => prev.filter(s => s.id !== id));
  };

  // Stats
  const stats = {
    total: shipments.length,
    active: shipments.filter(s => s.status !== 'delivered').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    outForDelivery: shipments.filter(s => s.status === 'out_for_delivery').length,
  };

  // Filtrage
  const filteredShipments = shipments
    .filter(s => {
      if (filter === 'active') return s.status !== 'delivered';
      if (filter === 'delivered') return s.status === 'delivered';
      return true;
    })
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.trackingNumber.toLowerCase().includes(q) ||
             s.supplierName?.toLowerCase().includes(q) ||
             s.description?.toLowerCase().includes(q);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="text-emerald-400" size={24} />
          Suivi des Colis
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Ajouter un colis
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.inTransit}</div>
          <div className="text-xs text-gray-400">En transit</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.outForDelivery}</div>
          <div className="text-xs text-gray-400">En livraison</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.delivered}</div>
          <div className="text-xs text-gray-400">Livrés</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.active}</div>
          <div className="text-xs text-gray-400">Actifs</div>
        </div>
      </div>

      {/* Formulaire ajout */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">Ajouter un colis</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Numéro de suivi"
                value={newTracking.number}
                onChange={(e) => setNewTracking(prev => ({ ...prev, number: e.target.value }))}
                className="px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500"
              />
              <select
                value={newTracking.carrier}
                onChange={(e) => setNewTracking(prev => ({ ...prev, carrier: e.target.value }))}
                className="px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white"
              >
                <option value="colissimo">Colissimo</option>
                <option value="chronopost">Chronopost</option>
                <option value="dpd">DPD</option>
                <option value="ups">UPS</option>
                <option value="fedex">FedEx</option>
                <option value="other">Autre</option>
              </select>
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={newTracking.description}
                onChange={(e) => setNewTracking(prev => ({ ...prev, description: e.target.value }))}
                className="px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500"
              />
              <button
                onClick={addShipment}
                disabled={!newTracking.number.trim()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un colis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'delivered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Livrés'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des colis */}
      {filteredShipments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="mx-auto mb-4" size={48} />
          <p>Aucun colis trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => {
            const carrierInfo = getCarrierInfo(shipment.carrier);
            const statusInfo = getStatusInfo(shipment.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === shipment.id;

            return (
              <motion.div
                key={shipment.id}
                layout
                className="glass rounded-xl overflow-hidden"
              >
                {/* Header colis */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : shipment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${carrierInfo.color} flex items-center justify-center text-2xl`}>
                        {carrierInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{shipment.trackingNumber}</span>
                          <span className="text-xs text-gray-500">{carrierInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {shipment.supplierName && (
                            <>
                              <Building2 size={14} />
                              <span>{shipment.supplierName}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{shipment.description}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                        {shipment.estimatedDelivery && shipment.status !== 'delivered' && (
                          <div className="text-xs text-gray-400 mt-1">
                            Prévu: {formatDate(shipment.estimatedDelivery)}
                          </div>
                        )}
                        {shipment.actualDelivery && (
                          <div className="text-xs text-emerald-400 mt-1">
                            Livré le {formatDate(shipment.actualDelivery)}
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails expandables */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-4">
                        {/* Infos */}
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Origine:</span>
                            <span className="text-white ml-2">{shipment.origin || 'Non spécifié'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Destination:</span>
                            <span className="text-white ml-2">{shipment.destination}</span>
                          </div>
                          {shipment.emailSource && (
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-400" />
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white">{shipment.emailSource}</span>
                            </div>
                          )}
                        </div>

                        {/* Timeline */}
                        {shipment.events.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3">Historique de suivi</h4>
                            <div className="relative pl-4 border-l-2 border-gray-700 space-y-4">
                              {shipment.events.slice().reverse().map((event, idx) => (
                                <div key={idx} className="relative">
                                  <div className={`absolute -left-[21px] w-4 h-4 rounded-full ${
                                    idx === 0 ? 'bg-emerald-500' : 'bg-gray-600'
                                  }`} />
                                  <div className="ml-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium text-white">{event.status}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-400">{event.location}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {formatDate(event.date)} à {event.time}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); refreshTracking(shipment.id); }}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                            >
                              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                              Actualiser
                            </button>
                            {carrierInfo.url && (
                              <a
                                href={`${carrierInfo.url}?tracking=${shipment.trackingNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-sm"
                              >
                                <ExternalLink size={14} />
                                {carrierInfo.name}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteShipment(shipment.id); }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info source */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Mail size={14} />
          <span>Colis détectés automatiquement via Gmail (cbdoshop75, theonlyweedn)</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Les emails de suivi de colis sont analysés et les fournisseurs sont automatiquement liés.
        </p>
      </div>
    </div>
  );
}
