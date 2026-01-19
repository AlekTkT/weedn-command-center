import { NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { createClient } from '@supabase/supabase-js';
import { getIncwoMetrics } from '@/services/incwo';

// Force dynamic rendering pour utiliser les env vars à runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fonction pour créer le client Supabase à runtime
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase URL ou Key non configurée');
    return null;
  }

  return createClient(url, key);
}

export interface CombinedMetrics {
  // Totaux combinés
  combined: {
    today: { revenue: number; orders: number };
    yesterday: { revenue: number; orders: number };
    lastWeekSameDay: { revenue: number; orders: number };
    week: { revenue: number; orders: number };
    month: { revenue: number; orders: number };
    avgOrderValue: number;
    evolution: { percent: number; isPositive: boolean }; // Évolution vs J-7
  };

  // Détails par canal
  shopify: {
    today: { revenue: number; orders: number };
    yesterday: { revenue: number; orders: number };
    week: { revenue: number; orders: number };
    month: { revenue: number; orders: number };
    recentOrders: any[];
  };

  store: {
    today: { revenue: number; transactions: number };
    yesterday: { revenue: number; transactions: number };
    lastWeekSameDay: { revenue: number; transactions: number };
    week: { revenue: number; transactions: number };
    month: { revenue: number; transactions: number };
    recentSales: any[];
    evolution: { percent: number; isPositive: boolean }; // Évolution vs J-7
  };

  // Pourcentages
  split: {
    shopifyPercent: number;
    storePercent: number;
  };

  // Progression objectif
  objective: {
    target: number;
    current: number;
    progress: number;
    remaining: number;
  };

  products: any;
  customers: any;
  generatedAt: string;
}

async function getStoreSalesMetrics() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const calcMetrics = (sales: { total: number }[] | null) => {
    if (!sales || sales.length === 0) return { revenue: 0, transactions: 0 };
    return {
      revenue: sales.reduce((sum, s) => sum + (s.total || 0), 0),
      transactions: sales.length,
    };
  };

  // D'abord essayer de récupérer depuis Incwo directement
  try {
    console.log('🔄 Tentative récupération Incwo...');
    console.log('ENV CHECK - INCWO_API_USER:', process.env.INCWO_API_USER ? 'SET' : 'NOT SET');
    console.log('ENV CHECK - INCWO_API_PASSWORD:', process.env.INCWO_API_PASSWORD ? 'SET' : 'NOT SET');

    const incwoMetrics = await getIncwoMetrics();
    console.log('📊 Incwo metrics result:', JSON.stringify(incwoMetrics));

    if (incwoMetrics && (incwoMetrics.today.revenue > 0 || incwoMetrics.month.revenue > 0)) {
      console.log('✅ Données Incwo valides, utilisation directe');
      // Calcul évolution vs J-7
      const j7Revenue = incwoMetrics.lastWeekSameDay?.revenue || 0;
      const todayRevenue = incwoMetrics.today.revenue;
      let evolutionPercent = 0;
      if (j7Revenue > 0) {
        evolutionPercent = Math.round(((todayRevenue - j7Revenue) / j7Revenue) * 100);
      } else if (todayRevenue > 0) {
        evolutionPercent = 100; // Si J-7 était 0 et aujourd'hui > 0
      }

      return {
        today: { revenue: incwoMetrics.today.revenue, transactions: incwoMetrics.today.transactions },
        yesterday: { revenue: incwoMetrics.yesterday.revenue, transactions: incwoMetrics.yesterday.transactions },
        lastWeekSameDay: { revenue: j7Revenue, transactions: incwoMetrics.lastWeekSameDay?.transactions || 0 },
        week: { revenue: incwoMetrics.week.revenue, transactions: incwoMetrics.week.transactions },
        month: { revenue: incwoMetrics.month.revenue, transactions: incwoMetrics.month.transactions },
        recentSales: [],
        source: 'incwo' as const,
        evolution: { percent: Math.abs(evolutionPercent), isPositive: evolutionPercent >= 0 },
      };
    } else {
      console.log('⚠️ Incwo metrics vides ou nulles, fallback Supabase');
    }
  } catch (incwoError) {
    console.log('❌ Incwo API erreur, fallback Supabase:', incwoError);
  }

  // Fallback: récupérer depuis Supabase (store_sales)
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log('⚠️ Supabase non configuré, retour données vides');
    return {
      today: { revenue: 0, transactions: 0 },
      yesterday: { revenue: 0, transactions: 0 },
      lastWeekSameDay: { revenue: 0, transactions: 0 },
      week: { revenue: 0, transactions: 0 },
      month: { revenue: 0, transactions: 0 },
      recentSales: [],
      source: 'none' as const,
      evolution: { percent: 0, isPositive: true },
    };
  }

  try {
    const lastWeekSameDay = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [todayRes, yesterdayRes, lastWeekSameDayRes, weekRes, monthRes, recentRes] = await Promise.all([
      supabase.from('store_sales').select('total').eq('sale_date', today),
      supabase.from('store_sales').select('total').eq('sale_date', yesterday),
      supabase.from('store_sales').select('total').eq('sale_date', lastWeekSameDay),
      supabase.from('store_sales').select('total').gte('sale_date', weekAgo),
      supabase.from('store_sales').select('total').gte('sale_date', monthAgo),
      supabase.from('store_sales').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const todayMetrics = calcMetrics(todayRes.data);
    const j7Metrics = calcMetrics(lastWeekSameDayRes.data);

    // Calcul évolution
    let evolutionPercent = 0;
    if (j7Metrics.revenue > 0) {
      evolutionPercent = Math.round(((todayMetrics.revenue - j7Metrics.revenue) / j7Metrics.revenue) * 100);
    } else if (todayMetrics.revenue > 0) {
      evolutionPercent = 100;
    }

    return {
      today: todayMetrics,
      yesterday: calcMetrics(yesterdayRes.data),
      lastWeekSameDay: j7Metrics,
      week: calcMetrics(weekRes.data),
      month: calcMetrics(monthRes.data),
      recentSales: recentRes.data || [],
      source: 'supabase' as const,
      evolution: { percent: Math.abs(evolutionPercent), isPositive: evolutionPercent >= 0 },
    };
  } catch (error) {
    console.error('Store metrics error:', error);
    return {
      today: { revenue: 0, transactions: 0 },
      yesterday: { revenue: 0, transactions: 0 },
      lastWeekSameDay: { revenue: 0, transactions: 0 },
      week: { revenue: 0, transactions: 0 },
      month: { revenue: 0, transactions: 0 },
      recentSales: [],
      source: 'none' as const,
      evolution: { percent: 0, isPositive: true },
    };
  }
}

export async function GET() {
  try {
    // Récupérer données Shopify
    const shopifyData = await getFullMetrics();

    // Récupérer données boutique
    const storeData = await getStoreSalesMetrics();

    // Convertir les revenus Shopify en nombres
    const shopifyRevenue = {
      today: parseFloat(shopifyData.revenue.today) || 0,
      yesterday: parseFloat(shopifyData.revenue.yesterday) || 0,
      week: parseFloat(shopifyData.revenue.last7Days) || 0,
      month: parseFloat(shopifyData.revenue.last30Days) || 0,
    };

    // Calculer les totaux combinés (y compris J-7)
    const j7Revenue = storeData.lastWeekSameDay?.revenue || 0;
    const todayCombinedRevenue = Math.round((shopifyRevenue.today + storeData.today.revenue) * 100) / 100;

    // Calcul évolution combinée vs J-7
    let combinedEvolutionPercent = 0;
    if (j7Revenue > 0) {
      combinedEvolutionPercent = Math.round(((todayCombinedRevenue - j7Revenue) / j7Revenue) * 100);
    } else if (todayCombinedRevenue > 0) {
      combinedEvolutionPercent = 100;
    }

    const combined = {
      today: {
        revenue: todayCombinedRevenue,
        orders: shopifyData.orders.today + storeData.today.transactions,
      },
      yesterday: {
        revenue: Math.round((shopifyRevenue.yesterday + storeData.yesterday.revenue) * 100) / 100,
        orders: shopifyData.orders.yesterday + storeData.yesterday.transactions,
      },
      lastWeekSameDay: {
        revenue: j7Revenue,
        orders: storeData.lastWeekSameDay?.transactions || 0,
      },
      week: {
        revenue: Math.round((shopifyRevenue.week + storeData.week.revenue) * 100) / 100,
        orders: shopifyData.orders.last7Days + storeData.week.transactions,
      },
      month: {
        revenue: Math.round((shopifyRevenue.month + storeData.month.revenue) * 100) / 100,
        orders: (shopifyData.orders.last30Days || 0) + storeData.month.transactions,
      },
      avgOrderValue: 0,
      evolution: { percent: Math.abs(combinedEvolutionPercent), isPositive: combinedEvolutionPercent >= 0 },
    };

    // Panier moyen combiné
    const totalOrders = combined.month.orders;
    combined.avgOrderValue = totalOrders > 0
      ? Math.round((combined.month.revenue / totalOrders) * 100) / 100
      : 0;

    // Calcul du split
    const totalMonthRevenue = combined.month.revenue;
    const split = {
      shopifyPercent: totalMonthRevenue > 0 ? Math.round((shopifyRevenue.month / totalMonthRevenue) * 100) : 0,
      storePercent: totalMonthRevenue > 0 ? Math.round((storeData.month.revenue / totalMonthRevenue) * 100) : 0,
    };

    // Objectif +40% CA
    const TARGET_CA = 63000; // Objectif 30 jours
    const objective = {
      target: TARGET_CA,
      current: combined.month.revenue,
      progress: Math.round((combined.month.revenue / TARGET_CA) * 100),
      remaining: Math.max(0, TARGET_CA - combined.month.revenue),
    };

    const metrics: CombinedMetrics = {
      combined,
      shopify: {
        today: { revenue: shopifyRevenue.today, orders: shopifyData.orders.today },
        yesterday: { revenue: shopifyRevenue.yesterday, orders: shopifyData.orders.yesterday },
        week: { revenue: shopifyRevenue.week, orders: shopifyData.orders.last7Days },
        month: { revenue: shopifyRevenue.month, orders: shopifyData.orders.last30Days || 0 },
        recentOrders: shopifyData.orders.recent || [],
      },
      store: storeData,
      split,
      objective,
      products: shopifyData.products,
      customers: shopifyData.customers,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Combined metrics error:', error);
    return NextResponse.json(
      { error: 'Erreur récupération métriques combinées', details: String(error) },
      { status: 500 }
    );
  }
}
