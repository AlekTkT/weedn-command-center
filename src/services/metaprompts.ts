// Service de génération de tâches automatiques pour les agents Weedn
// Le Chef d'Orchestre utilise ce système pour distribuer des tâches cohérentes

export interface AgentTask {
  id: string;
  agentId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'needs_attention';
  createdAt: string;
  completedAt?: string;
  result?: string;
  category: string;
}

export interface MetapromptContext {
  revenue: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    avgOrderValue: number;
  };
  orders: {
    today: number;
    last7Days: number;
  };
  products: {
    lowStock: number;
    outOfStock: number;
    lowStockItems: Array<{ title: string; inventory: number }>;
  };
  customers: {
    total: number;
    newLast30Days: number;
  };
  objectiveProgress: number; // % vers objectif +40% CA
}

// Templates de metaprompts par agent
const METAPROMPT_TEMPLATES: Record<string, (ctx: MetapromptContext) => AgentTask[]> = {
  'agent-ventes': (ctx) => {
    const tasks: AgentTask[] = [];
    const revenueGrowth = ctx.revenue.today > ctx.revenue.yesterday
      ? ((ctx.revenue.today - ctx.revenue.yesterday) / ctx.revenue.yesterday * 100).toFixed(1)
      : '0';

    // Tâche quotidienne: Analyse CA
    tasks.push({
      id: `ventes-${Date.now()}-1`,
      agentId: 'agent-ventes',
      title: 'Analyser les ventes du jour',
      description: `CA aujourd'hui: ${ctx.revenue.today}€ (${revenueGrowth}% vs hier). Identifier les leviers de croissance.`,
      priority: ctx.revenue.today < ctx.revenue.yesterday ? 'high' : 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Analyse'
    });

    // Si panier moyen faible
    if (ctx.revenue.avgOrderValue < 45) {
      tasks.push({
        id: `ventes-${Date.now()}-2`,
        agentId: 'agent-ventes',
        title: 'Optimiser le panier moyen',
        description: `Panier moyen actuel: ${ctx.revenue.avgOrderValue}€. Proposer des bundles ou cross-sell pour atteindre 50€+`,
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Optimisation'
      });
    }

    return tasks;
  },

  'agent-inventaire': (ctx) => {
    const tasks: AgentTask[] = [];

    // Alertes stock faible
    if (ctx.products.lowStock > 0) {
      tasks.push({
        id: `inventaire-${Date.now()}-1`,
        agentId: 'agent-inventaire',
        title: `⚠️ ${ctx.products.lowStock} produit(s) stock faible`,
        description: ctx.products.lowStockItems.slice(0, 3).map(p => `${p.title}: ${p.inventory} unités`).join(', '),
        priority: 'high',
        status: 'needs_attention',
        createdAt: new Date().toISOString(),
        category: 'Alerte Stock'
      });
    }

    // Ruptures de stock
    if (ctx.products.outOfStock > 0) {
      tasks.push({
        id: `inventaire-${Date.now()}-2`,
        agentId: 'agent-inventaire',
        title: `🚨 ${ctx.products.outOfStock} rupture(s) de stock`,
        description: 'Commander en urgence auprès des fournisseurs',
        priority: 'high',
        status: 'needs_attention',
        createdAt: new Date().toISOString(),
        category: 'Rupture'
      });
    }

    return tasks;
  },

  'agent-seo': (ctx) => {
    const tasks: AgentTask[] = [];

    // Tâche hebdomadaire SEO
    tasks.push({
      id: `seo-${Date.now()}-1`,
      agentId: 'agent-seo',
      title: 'Audit mots-clés CBD Paris',
      description: 'Vérifier le positionnement sur "CBD Paris", "fleur CBD Paris", "boutique CBD 75002"',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'SEO Local'
    });

    // Si objectif loin
    if (ctx.objectiveProgress < 30) {
      tasks.push({
        id: `seo-${Date.now()}-2`,
        agentId: 'agent-seo',
        title: 'Accélérer acquisition organique',
        description: `Objectif à ${ctx.objectiveProgress}%. Créer 5 pages produits optimisées cette semaine.`,
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Croissance'
      });
    }

    return tasks;
  },

  'agent-contenu': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `contenu-${Date.now()}-1`,
      agentId: 'agent-contenu',
      title: 'Créer post Instagram',
      description: 'Post produit ou éducatif CBD pour engagement communauté',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Social Media'
    });

    // Si nouveaux clients
    if (ctx.customers.newLast30Days > 10) {
      tasks.push({
        id: `contenu-${Date.now()}-2`,
        agentId: 'agent-contenu',
        title: 'Email bienvenue nouveaux clients',
        description: `${ctx.customers.newLast30Days} nouveaux clients ce mois. Préparer séquence welcome.`,
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Email'
      });
    }

    return tasks;
  },

  'agent-support': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `support-${Date.now()}-1`,
      agentId: 'agent-support',
      title: 'Vérifier avis Google',
      description: 'Répondre aux nouveaux avis et identifier points d\'amélioration',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Réputation'
    });

    return tasks;
  },

  'agent-email': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `email-${Date.now()}-1`,
      agentId: 'agent-email',
      title: 'Analyser performances Klaviyo',
      description: 'Taux d\'ouverture, clics et conversions des dernières campagnes',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Analytics'
    });

    // Proposer campagne si CA en baisse
    if (ctx.revenue.today < ctx.revenue.yesterday * 0.8) {
      tasks.push({
        id: `email-${Date.now()}-2`,
        agentId: 'agent-email',
        title: 'Lancer campagne flash',
        description: 'CA en baisse de 20%+. Proposer une promo flash aux abonnés actifs.',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Campagne'
      });
    }

    return tasks;
  },

  'agent-analytics': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `analytics-${Date.now()}-1`,
      agentId: 'agent-analytics',
      title: 'Rapport KPI quotidien',
      description: `CA: ${ctx.revenue.today}€ | Commandes: ${ctx.orders.today} | Panier: ${ctx.revenue.avgOrderValue}€`,
      priority: 'low',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Reporting'
    });

    tasks.push({
      id: `analytics-${Date.now()}-2`,
      agentId: 'agent-analytics',
      title: 'Suivi objectif +40% CA',
      description: `Progression: ${ctx.objectiveProgress}% vers l'objectif. 90 jours restants.`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Objectif'
    });

    return tasks;
  },

  'agent-shopify': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `shopify-${Date.now()}-1`,
      agentId: 'agent-shopify',
      title: 'Vérifier performances site',
      description: 'Score Lighthouse, temps de chargement, erreurs 404',
      priority: 'low',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Technique'
    });

    return tasks;
  },

  'agent-factures': (ctx) => {
    const tasks: AgentTask[] = [];

    tasks.push({
      id: `factures-${Date.now()}-1`,
      agentId: 'agent-factures',
      title: 'Scanner emails fournisseurs',
      description: 'Rechercher nouvelles factures dans cbdoshop75@gmail.com et theonlyweedn@gmail.com',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: 'Comptabilité'
    });

    return tasks;
  }
};

// Génère toutes les tâches pour tous les agents
export function generateAllTasks(context: MetapromptContext): AgentTask[] {
  const allTasks: AgentTask[] = [];

  for (const [agentId, generator] of Object.entries(METAPROMPT_TEMPLATES)) {
    try {
      const tasks = generator(context);
      allTasks.push(...tasks);
    } catch (error) {
      console.error(`Erreur génération tâches ${agentId}:`, error);
    }
  }

  // Trier par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return allTasks;
}

// Génère les tâches pour un agent spécifique
export function generateAgentTasks(agentId: string, context: MetapromptContext): AgentTask[] {
  const generator = METAPROMPT_TEMPLATES[agentId];
  if (!generator) return [];
  return generator(context);
}

// Historique des tâches (simulé, sera remplacé par Supabase)
let taskHistory: AgentTask[] = [];

export function addTaskToHistory(task: AgentTask): void {
  taskHistory.unshift(task);
  if (taskHistory.length > 100) {
    taskHistory = taskHistory.slice(0, 100);
  }
}

export function getTaskHistory(agentId?: string): AgentTask[] {
  if (agentId) {
    return taskHistory.filter(t => t.agentId === agentId);
  }
  return taskHistory;
}

export function updateTaskStatus(taskId: string, status: AgentTask['status'], result?: string): void {
  const task = taskHistory.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    if (result) task.result = result;
    if (status === 'completed') task.completedAt = new Date().toISOString();
  }
}
