import { NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config';

// Client Supabase pour les ventes boutique
const supabase = createClient(
  ENV.SUPABASE_URL || '',
  ENV.SUPABASE_ANON_KEY || ''
);

export interface CombinedMetrics {
  // Totaux combinés
  combined: {
    today: { revenue: number; orders: number };
    yesterday: { revenue: number; orders: number };
    week: { revenue: number; orders: number };
    month: { revenue: number; orders: number };
    avgOrderValue: number;
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
    week: { revenue: number; transactions: number };
    month: { revenue: number; transactions: number };
    recentSales: any[];
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

  try {
    const [todayRes, yesterdayRes, weekRes, monthRes, recentRes] = await Promise.all([
      supabase.from('store_sales').select('total').eq('sale_date', today),
      supabase.from('store_sales').select('total').eq('sale_date', yesterday),
      supabase.from('store_sales').select('total').gte('sale_date', weekAgo),
      supabase.from('store_sales').select('total').gte('sale_date', monthAgo),
      supabase.from('store_sales').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      today: calcMetrics(todayRes.data),
      yesterday: calcMetrics(yesterdayRes.data),
      week: calcMetrics(weekRes.data),
      month: calcMetrics(monthRes.data),
      recentSales: recentRes.data || [],
    };
  } catch (error) {
    console.error('Store metrics error:', error);
    return {
      today: { revenue: 0, transactions: 0 },
      yesterday: { revenue: 0, transactions: 0 },
      week: { revenue: 0, transactions: 0 },
      month: { revenue: 0, transactions: 0 },
      recentSales: [],
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

    // Calculer les totaux combinés
    const combined = {
      today: {
        revenue: Math.round((shopifyRevenue.today + storeData.today.revenue) * 100) / 100,
        orders: shopifyData.orders.today + storeData.today.transactions,
      },
      yesterday: {
        revenue: Math.round((shopifyRevenue.yesterday + storeData.yesterday.revenue) * 100) / 100,
        orders: shopifyData.orders.yesterday + storeData.yesterday.transactions,
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
