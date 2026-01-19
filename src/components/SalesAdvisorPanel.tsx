'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, Lightbulb, Users, ShoppingBag,
  RefreshCw, ChevronRight, Sparkles, Clock, CheckCircle,
  AlertCircle, Coffee, Sun, Moon
} from 'lucide-react';

interface DailyObjective {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  tips: string[];
}

interface SalesTip {
  id: string;
  category: 'upsell' | 'cross-sell' | 'loyalty' | 'timing' | 'product';
  title: string;
  description: string;
  expectedImpact: string;
  products?: string[];
}

interface StoreMetrics {
  todayRevenue: number;
  todayTransactions: number;
  avgTicket: number;
  lastWeekSameDay: number;
  evolution: number;
  currentHour: number;
  peakHours: number[];
}

interface SalesAdvisorPanelProps {
  compact?: boolean;
}

export default function SalesAdvisorPanel({ compact = false }: SalesAdvisorPanelProps) {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [objectives, setObjectives] = useState<DailyObjective[]>([]);
  const [tips, setTips] = useState<SalesTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  // Récupérer les données temps réel
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/combined-metrics');
      const data = await res.json();

      if (data.success && data.data) {
        const store = data.data.store;
        const combined = data.data.combined;
        const currentHour = new Date().getHours();

        const storeMetrics: StoreMetrics = {
          todayRevenue: store.today.revenue || 0,
          todayTransactions: store.today.transactions || 0,
          avgTicket: store.today.transactions > 0
            ? Math.round(store.today.revenue / store.today.transactions)
            : 0,
          lastWeekSameDay: store.lastWeekSameDay?.revenue || 0,
          evolution: store.evolution?.percent || 0,
          currentHour,
          peakHours: [12, 13, 17, 18, 19], // Heures de pointe typiques
        };

        setMetrics(storeMetrics);

        // Générer les objectifs journaliers basés sur les données
        generateDailyObjectives(storeMetrics);

        // Générer les conseils de vente contextuels
        generateSalesTips(storeMetrics, data.data);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer les objectifs du jour automatiquement
  const generateDailyObjectives = (m: StoreMetrics) => {
    const targetRevenue = Math.max(m.lastWeekSameDay * 1.1, 800); // +10% vs J-7 ou min 800€
    const targetTransactions = Math.max(Math.round(targetRevenue / 30), 25); // ~30€/transaction
    const targetAvgTicket = 35; // Objectif panier moyen

    const newObjectives: DailyObjective[] = [
      {
        id: 'revenue',
        title: 'Chiffre d\'affaires',
        target: Math.round(targetRevenue),
        current: m.todayRevenue,
        unit: '€',
        priority: m.todayRevenue < targetRevenue * 0.5 ? 'high' : 'medium',
        tips: [
          'Proposer les packs découverte aux nouveaux clients',
          'Mettre en avant les promos du jour',
          'Suggérer des produits complémentaires'
        ]
      },
      {
        id: 'transactions',
        title: 'Nombre de ventes',
        target: targetTransactions,
        current: m.todayTransactions,
        unit: '',
        priority: m.todayTransactions < targetTransactions * 0.5 ? 'high' : 'medium',
        tips: [
          'Accueillir chaque client avec le sourire',
          'Proposer une dégustation de nouvelles fleurs',
          'Mentionner le programme fidélité'
        ]
      },
      {
        id: 'avgTicket',
        title: 'Panier moyen',
        target: targetAvgTicket,
        current: m.avgTicket,
        unit: '€',
        priority: m.avgTicket < targetAvgTicket * 0.8 ? 'high' : 'low',
        tips: [
          'Proposer un grinder ou des feuilles avec les fleurs',
          'Suggérer l\'huile CBD pour le sommeil',
          'Offrir -10% dès 50€ d\'achat'
        ]
      }
    ];

    setObjectives(newObjectives);
  };

  // Générer des conseils de vente contextuels
  const generateSalesTips = (m: StoreMetrics, fullData: any) => {
    const hour = m.currentHour;
    const isPeakHour = m.peakHours.includes(hour);
    const newTips: SalesTip[] = [];

    // Conseil basé sur l'heure
    if (hour >= 8 && hour < 12) {
      newTips.push({
        id: 'morning',
        category: 'timing',
        title: 'Client du matin',
        description: 'Les clients matinaux cherchent souvent du CBD pour la concentration. Proposer les huiles CBD légères ou les fleurs Sativa.',
        expectedImpact: '+15% panier',
        products: ['Huile CBD 10%', 'Fleur Amnesia', 'Infusion Focus']
      });
    } else if (hour >= 12 && hour < 14) {
      newTips.push({
        id: 'lunch',
        category: 'timing',
        title: 'Pause déjeuner',
        description: 'Vente rapide, les clients ont peu de temps. Préparer des packs prêts à emporter.',
        expectedImpact: '+5 transactions',
        products: ['Pack Découverte', 'Bonbons CBD', 'Mini Fleurs 3g']
      });
    } else if (hour >= 17 && hour < 20) {
      newTips.push({
        id: 'evening',
        category: 'timing',
        title: 'Rush du soir',
        description: 'Période de forte affluence. Favoriser le conseil personnalisé pour maximiser le panier.',
        expectedImpact: '+20€ panier moyen',
        products: ['Fleurs Premium', 'Huile Sommeil', 'Pack Relaxation']
      });
    }

    // Conseil upsell si panier moyen faible
    if (m.avgTicket < 30) {
      newTips.push({
        id: 'upsell',
        category: 'upsell',
        title: 'Augmenter le panier',
        description: 'Le panier moyen est bas. À chaque vente de fleur, proposer un accessoire (grinder, feuilles, boîte de conservation).',
        expectedImpact: '+8€ par vente',
        products: ['Grinder 4 parties', 'Feuilles OCB', 'Bocal hermétique']
      });
    }

    // Conseil cross-sell
    newTips.push({
      id: 'crosssell',
      category: 'cross-sell',
      title: 'Vente croisée',
      description: 'Client qui achète des fleurs ? Proposer l\'huile pour la nuit. Client huile ? Suggérer les bonbons pour la journée.',
      expectedImpact: '+25% CA',
      products: ['Huile CBD 20%', 'Bonbons D9', 'Infusion Détente']
    });

    // Conseil fidélisation
    if (m.todayTransactions > 10) {
      newTips.push({
        id: 'loyalty',
        category: 'loyalty',
        title: 'Fidélisation',
        description: 'Proposer la carte fidélité à chaque nouveau client. Rappeler les points aux clients fidèles.',
        expectedImpact: '+30% retour client',
      });
    }

    // Conseil produit du jour
    newTips.push({
      id: 'product',
      category: 'product',
      title: 'Produit star du jour',
      description: 'Mettre en avant la Purple Haze cette semaine. Proposer une dégustation aux clients curieux.',
      expectedImpact: '+15 ventes/semaine',
      products: ['Purple Haze 5g', 'Purple Haze 10g', 'Purple Haze 20g']
    });

    setTips(newTips);
  };

  useEffect(() => {
    fetchData();
    // Rafraîchir toutes les 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (current: number, target: number) => {
    const percent = (current / target) * 100;
    if (percent >= 100) return 'bg-emerald-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return <Coffee className="text-amber-400" size={16} />;
    if (hour >= 12 && hour < 18) return <Sun className="text-yellow-400" size={16} />;
    return <Moon className="text-blue-400" size={16} />;
  };

  const getCategoryIcon = (category: SalesTip['category']) => {
    switch (category) {
      case 'upsell': return <TrendingUp className="text-emerald-400" size={16} />;
      case 'cross-sell': return <ShoppingBag className="text-blue-400" size={16} />;
      case 'loyalty': return <Users className="text-purple-400" size={16} />;
      case 'timing': return <Clock className="text-orange-400" size={16} />;
      case 'product': return <Sparkles className="text-pink-400" size={16} />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center">
        <RefreshCw className="animate-spin text-emerald-400" size={24} />
      </div>
    );
  }

  // Version compacte pour le dashboard
  if (compact) {
    const mainObjective = objectives[0]; // CA du jour
    const firstTip = tips[0]; // Premier conseil contextuel

    return (
      <div className="glass rounded-xl p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-yellow-400" size={18} />
            <h3 className="font-semibold text-white text-sm">Conseils Boutique</h3>
          </div>
          {getTimeIcon()}
        </div>

        {/* Objectif principal */}
        {mainObjective && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Objectif CA</span>
              <span className="text-white font-medium">
                {mainObjective.current}€ / {mainObjective.target}€
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (mainObjective.current / mainObjective.target) * 100)}%` }}
                className={getProgressColor(mainObjective.current, mainObjective.target)}
                style={{ height: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Évolution J-7 */}
        {metrics && (
          <div className={`text-center p-2 rounded-lg mb-3 ${
            metrics.evolution >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <span className={`text-xs font-medium ${
              metrics.evolution >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metrics.evolution >= 0 ? '▲' : '▼'} {Math.abs(metrics.evolution)}% vs J-7
            </span>
          </div>
        )}

        {/* Conseil du moment */}
        {firstTip && (
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              {getCategoryIcon(firstTip.category)}
              <span className="text-xs font-medium text-white">{firstTip.title}</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{firstTip.description}</p>
            {firstTip.products && firstTip.products.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {firstTip.products.slice(0, 2).map((p, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Astuce rapide */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Sparkles size={12} className="text-emerald-400" />
          {metrics?.peakHours.includes(new Date().getHours())
            ? 'Heure de pointe - Maximise le cross-sell!'
            : 'Période calme - Conseil en profondeur'}
        </div>
      </div>
    );
  }

  // Version complète
  return (
    <div className="space-y-4">
      {/* Header avec métriques temps réel */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-emerald-400" size={20} />
            <h3 className="font-semibold text-white">Objectifs du jour</h3>
            {getTimeIcon()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <motion.button
              whileTap={{ rotate: 360 }}
              onClick={fetchData}
              className="p-1.5 hover:bg-white/10 rounded-lg"
            >
              <RefreshCw className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} size={14} />
            </motion.button>
          </div>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
            <div className="text-lg font-bold text-emerald-400">
              {metrics?.todayRevenue || 0}€
            </div>
            <div className="text-xs text-gray-400">CA Boutique</div>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded-lg">
            <div className="text-lg font-bold text-blue-400">
              {metrics?.todayTransactions || 0}
            </div>
            <div className="text-xs text-gray-400">Ventes</div>
          </div>
          <div className="text-center p-2 bg-purple-500/10 rounded-lg">
            <div className="text-lg font-bold text-purple-400">
              {metrics?.avgTicket || 0}€
            </div>
            <div className="text-xs text-gray-400">Panier moy.</div>
          </div>
        </div>

        {/* Évolution vs J-7 */}
        {metrics && (
          <div className={`text-center p-2 rounded-lg ${
            metrics.evolution >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <span className={`text-sm font-medium ${
              metrics.evolution >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metrics.evolution >= 0 ? '+' : ''}{metrics.evolution}% vs la semaine dernière
            </span>
          </div>
        )}
      </div>

      {/* Objectifs détaillés */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <CheckCircle size={14} />
          Objectifs à atteindre
        </h4>
        <div className="space-y-3">
          {objectives.map((obj) => {
            const progress = Math.min(100, (obj.current / obj.target) * 100);
            const isCompleted = obj.current >= obj.target;

            return (
              <div key={obj.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{obj.title}</span>
                  <span className={`text-sm font-medium ${
                    isCompleted ? 'text-emerald-400' : 'text-gray-300'
                  }`}>
                    {obj.current}{obj.unit} / {obj.target}{obj.unit}
                    {isCompleted && ' ✓'}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${getProgressColor(obj.current, obj.target)}`}
                  />
                </div>
                {obj.priority === 'high' && !isCompleted && (
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <AlertCircle size={10} />
                    <span>Priorité : {obj.tips[0]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conseils de vente */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Lightbulb className="text-yellow-400" size={14} />
          Conseils de vente IA
        </h4>
        <div className="space-y-2">
          {tips.map((tip) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border transition-all cursor-pointer ${
                activeTip === tip.id
                  ? 'bg-white/5 border-emerald-500/30'
                  : 'border-white/5 hover:bg-white/5'
              }`}
              onClick={() => setActiveTip(activeTip === tip.id ? null : tip.id)}
            >
              <div className="p-3">
                <div className="flex items-start gap-2">
                  {getCategoryIcon(tip.category)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{tip.title}</span>
                      <span className="text-xs text-emerald-400">{tip.expectedImpact}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{tip.description}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      activeTip === tip.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              <AnimatePresence>
                {activeTip === tip.id && tip.products && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 border-t border-white/5 pt-2">
                      <div className="text-xs text-gray-500 mb-2">Produits à proposer :</div>
                      <div className="flex flex-wrap gap-1">
                        {tip.products.map((product, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="glass rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="text-emerald-400" size={24} />
          <div>
            <div className="text-sm font-medium text-white">Astuce du moment</div>
            <p className="text-xs text-gray-400">
              {metrics?.peakHours.includes(new Date().getHours())
                ? 'C\'est l\'heure de pointe ! Maximise chaque vente avec du cross-sell.'
                : 'Période calme idéale pour conseiller en profondeur et fidéliser.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
