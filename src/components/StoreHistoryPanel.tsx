'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, TrendingDown, Store, RefreshCw,
  ChevronLeft, ChevronRight, BarChart3, Package, Award, AlertCircle, Plus
} from 'lucide-react';
import IncwoProductForm from './IncwoProductForm';

interface DailyData {
  date: string;
  dateFormatted: string;
  dayName: string;
  revenue: number;
  transactions: number;
  avgTicket: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface StoreStats {
  totalRevenue: number;
  totalTransactions: number;
  avgDailyRevenue: number;
  avgTicket: number;
  bestDay: { date: string; dayName: string; revenue: number };
  worstDay: { date: string; dayName: string; revenue: number };
  avgByDayOfWeek: { day: string; avgRevenue: number }[];
  daysWithSales: number;
}

interface StoreHistoryData {
  history: DailyData[];
  topProducts: TopProduct[];
  stats: StoreStats;
  generatedAt: string;
}

export default function StoreHistoryPanel() {
  const [data, setData] = useState<StoreHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(30);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'chart' | 'add-product'>('calendar');
  const [selectedDay, setSelectedDay] = useState<DailyData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store-history?days=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Grouper par semaine pour l'affichage calendrier
  const getWeeks = () => {
    if (!data) return [];
    const weeks: DailyData[][] = [];
    let currentWeek: DailyData[] = [];

    // Trier par date croissante
    const sorted = [...data.history].sort((a, b) => {
      const parseDate = (d: string) => {
        const [day, month, year] = d.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    for (const day of sorted) {
      currentWeek.push(day);
      if (day.dayName === 'Dimanche' || currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const getRevenueColor = (revenue: number) => {
    if (!data) return 'bg-gray-700';
    const max = data.stats.bestDay.revenue;
    if (revenue === 0) return 'bg-gray-800';
    const percent = (revenue / max) * 100;
    if (percent >= 80) return 'bg-emerald-500';
    if (percent >= 60) return 'bg-emerald-600/70';
    if (percent >= 40) return 'bg-yellow-500/70';
    if (percent >= 20) return 'bg-orange-500/70';
    return 'bg-red-500/50';
  };

  if (loading && !data) {
    return (
      <div className="glass rounded-xl p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin text-emerald-400" size={32} />
        <span className="ml-3 text-gray-400">Chargement historique Incwo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats globales */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="text-orange-400" size={20} />
            <h3 className="font-semibold text-white">Historique Boutique</h3>
            <span className="text-xs text-gray-500">4 Rue Tiquetonne</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sélecteur période */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {[7, 14, 30].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as 7 | 14 | 30)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    period === p
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p}j
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ rotate: 360 }}
              onClick={fetchData}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <RefreshCw className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} size={16} />
            </motion.button>
          </div>
        </div>

        {/* Stats KPI */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg text-center">
              <div className="text-xl font-bold text-orange-400">
                {data.stats.totalRevenue.toLocaleString('fr-FR')}€
              </div>
              <div className="text-xs text-gray-400">CA {period} jours</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-400">
                {data.stats.totalTransactions}
              </div>
              <div className="text-xs text-gray-400">Transactions</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-center">
              <div className="text-xl font-bold text-emerald-400">
                {data.stats.avgDailyRevenue}€
              </div>
              <div className="text-xs text-gray-400">Moy. /jour</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-400">
                {data.stats.avgTicket}€
              </div>
              <div className="text-xs text-gray-400">Panier moy.</div>
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur de vue */}
      <div className="flex gap-2">
        {[
          { id: 'calendar', label: 'Calendrier', icon: Calendar },
          { id: 'list', label: 'Liste', icon: BarChart3 },
          { id: 'chart', label: 'Produits', icon: Package },
          { id: 'add-product', label: 'Ajouter produit', icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === id
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-400 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon size={16} />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Vue Calendrier */}
      {viewMode === 'calendar' && data && (
        <div className="glass rounded-xl p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {getWeeks().map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {/* Remplir les jours manquants en début de semaine */}
                {weekIdx === 0 && week[0] && (() => {
                  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                  const firstDayIdx = dayNames.indexOf(week[0].dayName);
                  return Array(firstDayIdx).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ));
                })()}

                {week.map((day) => (
                  <motion.button
                    key={day.date}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                    className={`aspect-square rounded-lg ${getRevenueColor(day.revenue)}
                      flex flex-col items-center justify-center p-1 transition-all
                      ${selectedDay?.date === day.date ? 'ring-2 ring-white' : ''}
                      ${day.transactions === 0 ? 'opacity-30' : ''}`}
                  >
                    <span className="text-xs text-white/80">{day.dateFormatted}</span>
                    {day.transactions > 0 && (
                      <span className="text-xs font-bold text-white">{day.revenue}€</span>
                    )}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/70" />
              <span>Moyen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span>Faible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-800" />
              <span>Fermé</span>
            </div>
          </div>

          {/* Détail jour sélectionné */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {selectedDay.dayName} {selectedDay.dateFormatted}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {selectedDay.transactions} ventes • Panier moy: {selectedDay.avgTicket}€
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">
                    {selectedDay.revenue}€
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Vue Liste */}
      {viewMode === 'list' && data && (
        <div className="glass rounded-xl p-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.history.filter(d => d.transactions > 0).map((day, idx) => (
              <div
                key={day.date}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  idx === 0 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">{day.dayName.slice(0, 3)}</div>
                    <div className="text-sm text-white font-medium">{day.dateFormatted}</div>
                  </div>
                  <div className="h-8 w-px bg-gray-700" />
                  <div>
                    <div className="text-sm text-white">{day.transactions} ventes</div>
                    <div className="text-xs text-gray-400">Panier: {day.avgTicket}€</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-white">{day.revenue}€</div>
                  {idx === 0 && <span className="text-xs text-orange-400">Aujourd'hui</span>}
                </div>
              </div>
            ))}

            {data.history.filter(d => d.transactions > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>Aucune vente sur cette période</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vue Produits Top */}
      {viewMode === 'chart' && data && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Award className="text-yellow-400" size={16} />
            Top produits vendus ({period} jours)
          </h4>

          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, idx) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white truncate">{product.name}</div>
                    <div className="text-xs text-gray-400">
                      {product.quantity} vendus • {product.revenue.toFixed(0)}€
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${(product.quantity / data.topProducts[0].quantity) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto mb-2" size={32} />
              <p>Données produits non disponibles</p>
              <p className="text-xs mt-1">L'API Incwo ne retourne pas les détails produits</p>
            </div>
          )}
        </div>
      )}

      {/* Vue Ajout Produit */}
      {viewMode === 'add-product' && (
        <div className="grid md:grid-cols-2 gap-6">
          <IncwoProductForm />
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Package className="text-emerald-400" size={16} />
                Guide rapide
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">1.</span>
                  <span>Saisissez le <strong>nom du produit</strong> tel qu'il apparaîtra sur le ticket</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">2.</span>
                  <span>Indiquez le <strong>prix TTC</strong> (le prix HT sera calculé automatiquement)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">3.</span>
                  <span>Sélectionnez le <strong>taux de TVA</strong> applicable (20% pour le CBD)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">4.</span>
                  <span>Optionnel : choisissez une catégorie et ajoutez un code-barres</span>
                </li>
              </ul>
            </div>
            <div className="glass rounded-xl p-4 bg-orange-500/10 border border-orange-500/20">
              <h4 className="text-sm font-medium text-orange-400 mb-2">
                À savoir
              </h4>
              <p className="text-xs text-gray-400">
                Les produits créés ici seront immédiatement disponibles sur la caisse Incwo.
                Une référence unique sera générée automatiquement si vous n'en fournissez pas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights agents */}
      {data && (
        <div className="glass rounded-xl p-4 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={16} />
            Analyse Agent Ventes
          </h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <span className="text-orange-400">→</span> Meilleur jour : <strong>{data.stats.bestDay.dayName}</strong> ({data.stats.bestDay.revenue}€)
            </p>
            {data.stats.avgByDayOfWeek[0] && (
              <p>
                <span className="text-orange-400">→</span> Jour le plus rentable en moyenne : <strong>{data.stats.avgByDayOfWeek[0].day}</strong> ({data.stats.avgByDayOfWeek[0].avgRevenue}€/jour)
              </p>
            )}
            <p>
              <span className="text-orange-400">→</span> {data.stats.daysWithSales} jours avec ventes sur {period} ({Math.round((data.stats.daysWithSales / period) * 100)}% d'ouverture)
            </p>
            {data.stats.avgTicket < 35 && (
              <p className="text-yellow-400">
                <AlertCircle className="inline mr-1" size={14} />
                Panier moyen bas ({data.stats.avgTicket}€). Objectif : 40€+ avec cross-sell
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
