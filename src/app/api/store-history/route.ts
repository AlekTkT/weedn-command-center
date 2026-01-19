import { NextResponse } from 'next/server';
import { getDailyHistory, getTopProducts, getIncwoMetrics } from '@/services/incwo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Récupérer les données en parallèle
    const [history, topProducts, metrics] = await Promise.all([
      getDailyHistory(days),
      getTopProducts(days),
      getIncwoMetrics(),
    ]);

    // Calculer les stats globales
    const totalRevenue = history.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = history.reduce((sum, d) => sum + d.transactions, 0);
    const avgDailyRevenue = history.length > 0 ? Math.round(totalRevenue / history.filter(d => d.transactions > 0).length) : 0;

    // Trouver le meilleur et pire jour
    const daysWithSales = history.filter(d => d.transactions > 0);
    const bestDay = daysWithSales.reduce((best, d) => d.revenue > best.revenue ? d : best, { revenue: 0, date: '', dayName: '' });
    const worstDay = daysWithSales.length > 0
      ? daysWithSales.reduce((worst, d) => d.revenue < worst.revenue ? d : worst, daysWithSales[0])
      : { revenue: 0, date: '', dayName: '' };

    // Stats par jour de la semaine
    const dayOfWeekStats: Record<string, { revenue: number; count: number }> = {};
    for (const day of history) {
      if (!dayOfWeekStats[day.dayName]) {
        dayOfWeekStats[day.dayName] = { revenue: 0, count: 0 };
      }
      if (day.transactions > 0) {
        dayOfWeekStats[day.dayName].revenue += day.revenue;
        dayOfWeekStats[day.dayName].count += 1;
      }
    }

    const avgByDayOfWeek = Object.entries(dayOfWeekStats).map(([day, stats]) => ({
      day,
      avgRevenue: stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0,
    })).sort((a, b) => b.avgRevenue - a.avgRevenue);

    return NextResponse.json({
      success: true,
      data: {
        history,
        topProducts,
        currentMetrics: metrics,
        stats: {
          totalRevenue,
          totalTransactions,
          avgDailyRevenue,
          avgTicket: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
          bestDay: {
            date: bestDay.date,
            dayName: bestDay.dayName,
            revenue: bestDay.revenue,
          },
          worstDay: {
            date: worstDay.date,
            dayName: worstDay.dayName,
            revenue: worstDay.revenue,
          },
          avgByDayOfWeek,
          daysWithSales: daysWithSales.length,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Store history error:', error);
    return NextResponse.json(
      { error: 'Erreur récupération historique boutique', details: String(error) },
      { status: 500 }
    );
  }
}
