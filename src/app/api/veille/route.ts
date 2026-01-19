import { NextResponse } from 'next/server';
import {
  getVeilleData,
  getMarketPosition,
  formatVeilleForDashboard,
  updateVeilleData,
  WEEDN_PRICES
} from '@/services/veille';

/**
 * GET /api/veille
 * Récupère les données de veille concurrentielle
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'full';

  try {
    if (format === 'dashboard') {
      // Format optimisé pour le dashboard
      return NextResponse.json({
        success: true,
        data: formatVeilleForDashboard(),
        generatedAt: new Date().toISOString()
      });
    }

    if (format === 'position') {
      // Juste la position marché Weedn
      return NextResponse.json({
        success: true,
        data: getMarketPosition(),
        generatedAt: new Date().toISOString()
      });
    }

    // Format complet par défaut
    const veilleData = getVeilleData();
    const position = getMarketPosition();

    return NextResponse.json({
      success: true,
      data: {
        veille: veilleData,
        marketPosition: position,
        weednPrices: WEEDN_PRICES,
        summary: {
          totalCompetitors: veilleData.competitors.length,
          competitorsOnline: veilleData.competitors.filter(c => c.status === 'online').length,
          competitorsWithPromos: veilleData.competitors.filter(c => c.promoActive).length,
          maxPromoInMarket: Math.max(...veilleData.competitors.map(c => c.promoPercentage || 0)),
          weednHasPromo: false, // À connecter dynamiquement
          alertsCount: veilleData.alerts.length
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Veille API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur récupération données veille' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/veille
 * Met à jour les données de veille (appelé par les agents)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Valider les données
    if (!body.competitors && !body.alerts && !body.recommendations) {
      return NextResponse.json(
        { success: false, error: 'Données de veille invalides' },
        { status: 400 }
      );
    }

    // Mettre à jour
    const updated = await updateVeilleData(body);

    return NextResponse.json({
      success: updated,
      message: updated ? 'Données de veille mises à jour' : 'Échec mise à jour',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Veille update error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur mise à jour données veille' },
      { status: 500 }
    );
  }
}
