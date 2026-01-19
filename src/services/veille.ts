/**
 * Service de Veille Concurrentielle Weedn
 * Gère la lecture et le parsing des rapports de veille générés par les agents
 */

import { promises as fs } from 'fs';
import path from 'path';

// Types pour les données de veille
export interface CompetitorData {
  name: string;
  url: string;
  status: 'online' | 'offline';
  priceRange: {
    fleurs?: { min: number; max: number; avg?: number };
    resines?: { min: number; max: number; avg?: number };
    huiles?: { min: number; max: number };
  };
  promoActive: string | null;
  promoPercentage: number | null;
  lastUpdated: string;
}

export interface VeilleReport {
  date: string;
  competitors: CompetitorData[];
  marketAnalysis: {
    fleursAvgPrice: number;
    resinesAvgPrice: number;
    competitorsWithPromos: number;
    totalCompetitors: number;
  };
  alerts: string[];
  recommendations: string[];
}

// Données statiques basées sur la dernière veille (19 janvier 2026)
// Ces données seront mises à jour automatiquement par les agents
const LAST_VEILLE_DATA: VeilleReport = {
  date: '2026-01-19',
  competitors: [
    {
      name: 'La Ferme du CBD',
      url: 'https://lafermeducbd.fr',
      status: 'online',
      priceRange: {
        fleurs: { min: 1.13, max: 15.00, avg: 7.50 },
        resines: { min: 5.00, max: 25.00, avg: 12.00 },
        huiles: { min: 29.00, max: 79.00 }
      },
      promoActive: 'SOLDES25',
      promoPercentage: 25,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'Mama Kana',
      url: 'https://mamakana.com',
      status: 'online',
      priceRange: {
        fleurs: { min: 1.24, max: 18.00, avg: 8.00 },
        resines: { min: 6.00, max: 30.00, avg: 15.00 },
        huiles: { min: 34.90, max: 100.00 }
      },
      promoActive: 'JANVIER50',
      promoPercentage: 50,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'JustBob',
      url: 'https://justbob.fr',
      status: 'online',
      priceRange: {
        fleurs: { min: 8.00, max: 14.00, avg: 11.00 },
        resines: { min: 10.00, max: 35.00, avg: 20.00 },
        huiles: { min: 39.90, max: 70.00 }
      },
      promoActive: 'DEAL50',
      promoPercentage: 50,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'Okiweed',
      url: 'https://okiweed.com',
      status: 'online',
      priceRange: {
        fleurs: { min: 2.52, max: 12.00, avg: 6.00 },
        resines: { min: 4.00, max: 20.00, avg: 10.00 },
        huiles: { min: 24.90, max: 99.00 }
      },
      promoActive: 'MEGA70',
      promoPercentage: 70,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'CBD.fr',
      url: 'https://cbd.fr',
      status: 'online',
      priceRange: {
        fleurs: { min: 2.25, max: 12.00, avg: 6.50 },
        resines: { min: 5.00, max: 22.00, avg: 11.00 },
        huiles: { min: 32.00, max: 59.60 }
      },
      promoActive: 'CBD17',
      promoPercentage: 17,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'High Society',
      url: 'https://high-society.fr',
      status: 'online',
      priceRange: {
        fleurs: { min: 5.00, max: 16.00, avg: 9.00 },
        resines: { min: 8.00, max: 28.00, avg: 15.00 },
        huiles: { min: 35.00, max: 80.00 }
      },
      promoActive: 'HS20',
      promoPercentage: 20,
      lastUpdated: '2026-01-19T21:19:00Z'
    },
    {
      name: 'Greenowl',
      url: 'https://greenowl.fr',
      status: 'online',
      priceRange: {
        fleurs: { min: 4.50, max: 14.00, avg: 8.50 },
        resines: { min: 7.00, max: 25.00, avg: 13.00 },
        huiles: { min: 31.90, max: 75.00 }
      },
      promoActive: 'GREEN30',
      promoPercentage: 30,
      lastUpdated: '2026-01-19T21:19:00Z'
    }
  ],
  marketAnalysis: {
    fleursAvgPrice: 7.50,
    resinesAvgPrice: 13.70,
    competitorsWithPromos: 7,
    totalCompetitors: 7
  },
  alerts: [
    'URGENT: Tous les concurrents sont en soldes (jusqu\'à -70%)',
    'Weedn n\'a actuellement AUCUNE promotion active',
    '77 produits en rupture de stock (60% du catalogue)',
    'CA web très faible ce mois (127€)'
  ],
  recommendations: [
    'Créer immédiatement le code promo WEEDN30 (-30%)',
    'Lancer campagne Klaviyo "Soldes Janvier"',
    'Publier post Instagram annonçant les soldes',
    'Nettoyer le catalogue (archiver produits en rupture)'
  ]
};

// Données Weedn pour comparaison
export const WEEDN_PRICES = {
  fleurs: { min: 6.00, max: 12.00, avg: 9.00 },
  resines: { min: 8.00, max: 18.00, avg: 13.00 },
  huiles: { min: 29.90, max: 59.90 }
};

/**
 * Récupère les données de veille les plus récentes
 */
export function getVeilleData(): VeilleReport {
  return LAST_VEILLE_DATA;
}

/**
 * Récupère les données d'un concurrent spécifique
 */
export function getCompetitorData(name: string): CompetitorData | null {
  return LAST_VEILLE_DATA.competitors.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

/**
 * Calcule la position de Weedn sur le marché
 */
export function getMarketPosition() {
  const competitors = LAST_VEILLE_DATA.competitors;

  // Prix moyen des fleurs sur le marché
  const avgFleursPrice = competitors.reduce(
    (sum, c) => sum + (c.priceRange.fleurs?.avg || 0), 0
  ) / competitors.length;

  // Prix moyen des résines sur le marché
  const avgResinesPrice = competitors.reduce(
    (sum, c) => sum + (c.priceRange.resines?.avg || 0), 0
  ) / competitors.length;

  // Position Weedn
  const weedFleursPosition = WEEDN_PRICES.fleurs.avg > avgFleursPrice ? 'premium' :
                            WEEDN_PRICES.fleurs.avg < avgFleursPrice * 0.85 ? 'discount' : 'mid-range';

  const weedResinesPosition = WEEDN_PRICES.resines.avg > avgResinesPrice ? 'premium' :
                             WEEDN_PRICES.resines.avg < avgResinesPrice * 0.85 ? 'discount' : 'mid-range';

  return {
    market: {
      fleursAvgPrice: avgFleursPrice.toFixed(2),
      resinesAvgPrice: avgResinesPrice.toFixed(2),
      minPromo: Math.min(...competitors.map(c => c.promoPercentage || 0)),
      maxPromo: Math.max(...competitors.map(c => c.promoPercentage || 0)),
    },
    weedn: {
      fleursAvgPrice: WEEDN_PRICES.fleurs.avg,
      resinesAvgPrice: WEEDN_PRICES.resines.avg,
      fleursPosition: weedFleursPosition,
      resinesPosition: weedResinesPosition,
      hasPromo: false, // À connecter à Shopify
      promoPercentage: 0
    },
    competitiveGap: {
      fleurs: ((WEEDN_PRICES.fleurs.avg - avgFleursPrice) / avgFleursPrice * 100).toFixed(1) + '%',
      resines: ((WEEDN_PRICES.resines.avg - avgResinesPrice) / avgResinesPrice * 100).toFixed(1) + '%'
    }
  };
}

/**
 * Formate les données pour le dashboard
 */
export function formatVeilleForDashboard() {
  const data = getVeilleData();
  const position = getMarketPosition();

  return {
    lastUpdate: data.date,
    competitors: data.competitors.map(c => ({
      name: c.name,
      status: c.status,
      fleursPricePerGram: c.priceRange.fleurs?.avg || 'N/A',
      resinesPricePerGram: c.priceRange.resines?.avg || 'N/A',
      promo: c.promoActive || 'Aucune',
      promoPercent: c.promoPercentage || 0
    })),
    weedn: {
      fleursPricePerGram: WEEDN_PRICES.fleurs.avg,
      resinesPricePerGram: WEEDN_PRICES.resines.avg,
      promo: 'Aucune',
      promoPercent: 0,
      position: position.weedn
    },
    marketAnalysis: {
      ...data.marketAnalysis,
      weedFleursDiff: position.competitiveGap.fleurs,
      weedResinesDiff: position.competitiveGap.resines
    },
    alerts: data.alerts,
    recommendations: data.recommendations
  };
}

/**
 * Met à jour les données de veille (à appeler par les agents)
 */
export async function updateVeilleData(newData: Partial<VeilleReport>): Promise<boolean> {
  // TODO: Implémenter la persistance dans Supabase
  // Pour l'instant, les données sont mises à jour en mémoire
  Object.assign(LAST_VEILLE_DATA, newData);
  LAST_VEILLE_DATA.date = new Date().toISOString().split('T')[0];
  return true;
}
