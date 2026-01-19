import { NextResponse } from 'next/server';
import { checkAllAlerts } from '@/services/alerts';

export const dynamic = 'force-dynamic';

// Endpoint pour récupérer toutes les alertes
export async function GET() {
  try {
    const alerts = await checkAllAlerts();

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: criticalCount,
        warning: warningCount,
        info: alerts.length - criticalCount - warningCount,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur vérification alertes:', error);
    return NextResponse.json(
      { error: 'Erreur vérification alertes', details: String(error) },
      { status: 500 }
    );
  }
}
