// Service Incwo - Boutique Physique
// Gère les données de la caisse du magasin 4 Rue Tiquetonne 75002 Paris

import { getIncwoConfig } from '@/config';

export interface IncwoSale {
  id: string;
  date: string;
  total: number;
  items: {
    product: string;
    quantity: number;
    price: number;
  }[];
  paymentMethod: string;
}

export interface IncwoMetrics {
  today: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  week: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  month: {
    sales: number;
    revenue: number;
    transactions: number;
  };
}

// Configuration Incwo
export function getConfig() {
  const config = getIncwoConfig();
  return {
    baseUrl: config?.baseUrl || 'https://www.incwo.com/1047111',
    accountId: config?.accountId || '1047111',
    email: config?.email || 'cbdoshop75@gmail.com',
    address: config?.address || '4 Rue Tiquetonne, 75002 Paris',
    phone: config?.phone || '01 42 60 98 74',
  };
}

// Note: Incwo n'a pas d'API publique documentée
// Les données doivent être récupérées manuellement ou via scraping autorisé
// Ce service sert de placeholder pour l'intégration future

export function formatIncwoContext(): string {
  const config = getConfig();

  return `## DONNÉES INCWO (Boutique Physique)

### Configuration:
- Adresse: ${config.address}
- Téléphone: ${config.phone}
- Compte: ${config.accountId}
- Dashboard: ${config.baseUrl}

### Note:
Les données Incwo représentent les ventes EN MAGASIN.
CA Total Weedn = CA Shopify (web) + CA Incwo (boutique)

### À intégrer:
- Ventes journalières boutique
- Stock synchronisé
- Comparaison web vs boutique`;
}

// Placeholder pour les métriques (à implémenter)
export async function getIncwoMetrics(): Promise<IncwoMetrics | null> {
  // TODO: Implémenter l'intégration Incwo
  // Options:
  // 1. Scraping autorisé de l'interface web
  // 2. Export manuel quotidien
  // 3. Intégration Zapier/Make.com

  return null;
}

export default {
  getConfig,
  formatIncwoContext,
  getIncwoMetrics,
};
