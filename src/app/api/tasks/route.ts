import { NextRequest, NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { getIncwoMetrics } from '@/services/incwo';
import {
  generateAllTasks,
  generateAgentTasks,
  getTaskHistory,
  addTaskToHistory,
  updateTaskStatus,
  AgentTask,
  MetapromptContext
} from '@/services/metaprompts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Récupérer les tâches générées et l'historique
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const type = searchParams.get('type') || 'all'; // 'generated' | 'history' | 'all'

  try {
    // Récupérer les données Shopify ET Incwo en parallèle
    const [shopifyData, incwoData] = await Promise.all([
      getFullMetrics(),
      getIncwoMetrics(),
    ]);

    // Calculer les totaux combinés
    const shopifyMonthRevenue = parseFloat(shopifyData.revenue.last30Days) || 0;
    const storeMonthRevenue = incwoData.month.revenue || 0;
    const totalMonthRevenue = shopifyMonthRevenue + storeMonthRevenue;

    // Calculer la progression vers l'objectif +40% CA
    const targetCA = 63000; // 45000 * 1.4
    const objectiveProgress = Math.min(100, Math.round((totalMonthRevenue / targetCA) * 100));

    // Split online vs boutique
    const splitOnline = totalMonthRevenue > 0 ? Math.round((shopifyMonthRevenue / totalMonthRevenue) * 100) : 100;
    const splitStore = totalMonthRevenue > 0 ? Math.round((storeMonthRevenue / totalMonthRevenue) * 100) : 0;

    // Panier moyen boutique
    const storeAvgTicket = incwoData.today.transactions > 0
      ? Math.round(incwoData.today.revenue / incwoData.today.transactions)
      : incwoData.month.transactions > 0
        ? Math.round(incwoData.month.revenue / incwoData.month.transactions)
        : 0;

    // Calculer évolution boutique vs J-7
    const j7Revenue = incwoData.lastWeekSameDay?.revenue || 0;
    const todayStoreRevenue = incwoData.today.revenue || 0;
    let evolutionPercent = 0;
    if (j7Revenue > 0) {
      evolutionPercent = Math.round(((todayStoreRevenue - j7Revenue) / j7Revenue) * 100);
    } else if (todayStoreRevenue > 0) {
      evolutionPercent = 100;
    }

    const context: MetapromptContext = {
      revenue: {
        today: parseFloat(shopifyData.revenue.today) || 0,
        yesterday: parseFloat(shopifyData.revenue.yesterday) || 0,
        last7Days: parseFloat(shopifyData.revenue.last7Days) || 0,
        last30Days: shopifyMonthRevenue,
        avgOrderValue: parseFloat(shopifyData.revenue.avgOrderValue) || 0,
      },
      orders: {
        today: shopifyData.orders.today || 0,
        last7Days: shopifyData.orders.last7Days || 0,
      },
      products: {
        lowStock: shopifyData.products.lowStock || 0,
        outOfStock: shopifyData.products.outOfStock || 0,
        lowStockItems: shopifyData.products.lowStockItems || [],
      },
      customers: {
        total: shopifyData.customers.total || 0,
        newLast30Days: shopifyData.customers.newLast30Days || 0,
      },
      objectiveProgress,
      // Données boutique Incwo
      store: {
        today: { revenue: incwoData.today.revenue, transactions: incwoData.today.transactions },
        yesterday: { revenue: incwoData.yesterday.revenue, transactions: incwoData.yesterday.transactions },
        lastWeekSameDay: { revenue: j7Revenue, transactions: incwoData.lastWeekSameDay?.transactions || 0 },
        week: { revenue: incwoData.week.revenue, transactions: incwoData.week.transactions },
        month: { revenue: storeMonthRevenue, transactions: incwoData.month.transactions },
        evolution: { percent: Math.abs(evolutionPercent), isPositive: evolutionPercent >= 0 },
        avgTicket: storeAvgTicket,
      },
      // Totaux combinés
      combined: {
        todayRevenue: (parseFloat(shopifyData.revenue.today) || 0) + incwoData.today.revenue,
        todayTransactions: (shopifyData.orders.today || 0) + incwoData.today.transactions,
        monthRevenue: totalMonthRevenue,
        splitOnline,
        splitStore,
      },
    };

    let generatedTasks: AgentTask[] = [];
    let history: AgentTask[] = [];

    if (type === 'generated' || type === 'all') {
      generatedTasks = agentId
        ? generateAgentTasks(agentId, context)
        : generateAllTasks(context);
    }

    if (type === 'history' || type === 'all') {
      history = getTaskHistory(agentId || undefined);
    }

    return NextResponse.json({
      success: true,
      generated: generatedTasks,
      history,
      context: {
        objectiveProgress,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Tasks API Error:', error);
    return NextResponse.json(
      { error: 'Erreur génération tâches', details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Ajouter une tâche à l'historique ou mettre à jour le statut
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, task, taskId, status, result } = body;

    if (action === 'add' && task) {
      addTaskToHistory(task);
      return NextResponse.json({ success: true, message: 'Tâche ajoutée' });
    }

    if (action === 'update' && taskId && status) {
      updateTaskStatus(taskId, status, result);
      return NextResponse.json({ success: true, message: 'Statut mis à jour' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Tasks POST Error:', error);
    return NextResponse.json(
      { error: 'Erreur traitement tâche' },
      { status: 500 }
    );
  }
}
