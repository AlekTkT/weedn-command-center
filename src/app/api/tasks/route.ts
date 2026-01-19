import { NextRequest, NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import {
  generateAllTasks,
  generateAgentTasks,
  getTaskHistory,
  addTaskToHistory,
  updateTaskStatus,
  AgentTask,
  MetapromptContext
} from '@/services/metaprompts';

// GET: Récupérer les tâches générées et l'historique
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const type = searchParams.get('type') || 'all'; // 'generated' | 'history' | 'all'

  try {
    // Récupérer les données Shopify pour le contexte
    const shopifyData = await getFullMetrics();

    // Calculer la progression vers l'objectif +40% CA
    const currentCA = parseFloat(shopifyData.revenue.last30Days) || 45000;
    const targetCA = 63000; // 45000 * 1.4
    const objectiveProgress = Math.min(100, Math.round((currentCA / targetCA) * 100));

    const context: MetapromptContext = {
      revenue: {
        today: parseFloat(shopifyData.revenue.today) || 0,
        yesterday: parseFloat(shopifyData.revenue.yesterday) || 0,
        last7Days: parseFloat(shopifyData.revenue.last7Days) || 0,
        last30Days: currentCA,
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
