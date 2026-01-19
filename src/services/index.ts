// Services centralisés Weedn Command Center
// Point d'entrée unique pour tous les services

export * from './shopify';
export * from './klaviyo';
export * from './incwo';

import shopifyService from './shopify';
import klaviyoService from './klaviyo';
import incwoService from './incwo';

// Service agrégé pour toutes les données business
export interface BusinessData {
  shopify: any;
  klaviyo: any;
  incwo: any;
  combined: {
    totalRevenue: number;
    webRevenue: number;
    storeRevenue: number;
    totalProducts: number;
    totalCustomers: number;
  };
  generatedAt: string;
}

// Récupérer toutes les données business
export async function getAllBusinessData(): Promise<BusinessData> {
  const [shopifyData, incwoMetrics] = await Promise.all([
    shopifyService.getFullMetrics(),
    incwoService.getIncwoMetrics(),
  ]);

  const klaviyoData = klaviyoService.getKlaviyoData();

  // Calculer les totaux combinés
  const webRevenue = parseFloat(shopifyData.revenue.total);
  const storeRevenue = incwoMetrics ? incwoMetrics.month.revenue : 0;

  return {
    shopify: shopifyData,
    klaviyo: klaviyoData,
    incwo: incwoMetrics,
    combined: {
      totalRevenue: webRevenue + storeRevenue,
      webRevenue,
      storeRevenue,
      totalProducts: shopifyData.products.total,
      totalCustomers: shopifyData.customers.total,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Formater le contexte complet pour les agents
export function formatFullContext(): string {
  const klaviyoContext = klaviyoService.formatKlaviyoContext();
  const incwoContext = incwoService.formatIncwoContext();

  return `# CONTEXTE BUSINESS WEEDN

${incwoContext}

${klaviyoContext}

---
Note: Les données Shopify sont chargées dynamiquement via getFullMetrics()`;
}

export default {
  shopify: shopifyService,
  klaviyo: klaviyoService,
  incwo: incwoService,
  getAllBusinessData,
  formatFullContext,
};
