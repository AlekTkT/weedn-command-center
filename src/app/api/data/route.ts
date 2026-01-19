import { NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { getKlaviyoData, formatKlaviyoContext } from '@/services/klaviyo';
import { formatIncwoContext, getConfig as getIncwoConfig } from '@/services/incwo';
import { loadContacts } from '@/config';
import { formatVeilleForDashboard, getMarketPosition } from '@/services/veille';

// Endpoint principal qui retourne TOUTES les données pour les agents
export async function GET() {
  try {
    // Récupérer les données Shopify (async)
    const shopifyData = await getFullMetrics();

    // Récupérer les données statiques
    const klaviyoData = getKlaviyoData();
    const incwoConfig = getIncwoConfig();
    const contacts = loadContacts();

    // Récupérer les données de veille concurrentielle
    const veilleData = formatVeilleForDashboard();
    const marketPosition = getMarketPosition();

    return NextResponse.json({
      success: true,
      data: {
        shopify: shopifyData,
        klaviyo: klaviyoData,
        incwo: {
          config: incwoConfig,
          note: 'Données boutique physique - intégration à compléter',
        },
        veille: {
          competitors: veilleData.competitors,
          marketAnalysis: veilleData.marketAnalysis,
          weednPosition: marketPosition.weedn,
          alerts: veilleData.alerts,
          recommendations: veilleData.recommendations,
          lastUpdate: veilleData.lastUpdate
        },
        team: contacts?.team || {},
        business: contacts?.business?.weedn || {},
      },
      context: {
        klaviyo: formatKlaviyoContext(),
        incwo: formatIncwoContext(),
        veille: {
          competitorsCount: veilleData.competitors.length,
          competitorsWithPromos: veilleData.competitors.filter(c => c.promoPercent > 0).length,
          maxPromo: Math.max(...veilleData.competitors.map(c => c.promoPercent)),
          weednHasPromo: false,
          alertsCount: veilleData.alerts.length
        }
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Full data fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur récupération données', details: String(error) },
      { status: 500 }
    );
  }
}
