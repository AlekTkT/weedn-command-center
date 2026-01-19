import { NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { getKlaviyoData, formatKlaviyoContext } from '@/services/klaviyo';
import { formatIncwoContext, getConfig as getIncwoConfig } from '@/services/incwo';
import { loadContacts } from '@/config';

// Endpoint principal qui retourne TOUTES les données pour les agents
export async function GET() {
  try {
    // Récupérer les données Shopify (async)
    const shopifyData = await getFullMetrics();

    // Récupérer les données statiques
    const klaviyoData = getKlaviyoData();
    const incwoConfig = getIncwoConfig();
    const contacts = loadContacts();

    return NextResponse.json({
      success: true,
      data: {
        shopify: shopifyData,
        klaviyo: klaviyoData,
        incwo: {
          config: incwoConfig,
          note: 'Données boutique physique - intégration à compléter',
        },
        team: contacts?.team || {},
        business: contacts?.business?.weedn || {},
      },
      context: {
        klaviyo: formatKlaviyoContext(),
        incwo: formatIncwoContext(),
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
