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
  // Nouvelles propriétés pour l'exécution
  actionType?: 'api' | 'prompt' | 'redirect' | 'automation';
  actionPayload?: {
    endpoint?: string;
    method?: string;
    body?: any;
    prompt?: string;
    redirectUrl?: string;
    automationId?: string;
  };
  recommendations?: string[]; // Préconisations de l'agent
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
  // Données Incwo boutique physique
  store?: {
    today: { revenue: number; transactions: number };
    yesterday: { revenue: number; transactions: number };
    lastWeekSameDay: { revenue: number; transactions: number };
    week: { revenue: number; transactions: number };
    month: { revenue: number; transactions: number };
    evolution: { percent: number; isPositive: boolean };
    avgTicket: number;
    bestDayOfWeek?: string;
    topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
  };
  // Totaux combinés (web + boutique)
  combined?: {
    todayRevenue: number;
    todayTransactions: number;
    monthRevenue: number;
    splitOnline: number; // % CA online
    splitStore: number; // % CA boutique
  };
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
      category: 'Analyse',
      actionType: 'prompt',
      actionPayload: {
        prompt: `Analyse les ventes du jour (${ctx.revenue.today}€) vs hier (${ctx.revenue.yesterday}€). Identifie les produits best-sellers et propose 3 actions concrètes pour augmenter le CA demain.`
      },
      recommendations: [
        `CA actuel: ${ctx.revenue.today}€ (${revenueGrowth}% vs hier)`,
        'Vérifier les produits les plus vendus sur Shopify',
        'Analyser le trafic source (organique vs payant)',
        ctx.revenue.today < ctx.revenue.yesterday
          ? 'Envoyer une notification promo flash sur Instagram'
          : 'Maintenir la dynamique avec un post témoignage client'
      ]
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
        category: 'Optimisation',
        actionType: 'prompt',
        actionPayload: {
          prompt: `Le panier moyen est de ${ctx.revenue.avgOrderValue}€ (objectif: 50€+). Propose 3 bundles de produits CBD complémentaires et une stratégie de cross-sell pour la boutique Weedn.`
        },
        recommendations: [
          `Panier moyen actuel: ${ctx.revenue.avgOrderValue}€ (cible: 50€+)`,
          'Créer un bundle "Découverte CBD" (fleurs + huile + bonbons)',
          'Ajouter des suggestions "Souvent achetés ensemble" sur Shopify',
          'Proposer -10% dès 60€ d\'achat',
          'Mettre en avant les packs sur la homepage'
        ]
      });
    }

    // === TÂCHES BOUTIQUE PHYSIQUE (données Incwo) ===
    if (ctx.store) {
      const storeEvolution = ctx.store.evolution;
      const storeToday = ctx.store.today;

      // Analyse performance boutique vs J-7
      tasks.push({
        id: `ventes-store-${Date.now()}-1`,
        agentId: 'agent-ventes',
        title: '🏪 Analyse boutique vs J-7',
        description: `Boutique: ${storeToday.revenue}€ (${storeEvolution.isPositive ? '+' : '-'}${storeEvolution.percent}% vs semaine dernière)`,
        priority: storeEvolution.percent > 20 ? 'low' : storeEvolution.percent < -10 ? 'high' : 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Boutique',
        actionType: 'prompt',
        actionPayload: {
          prompt: `La boutique a fait ${storeToday.revenue}€ aujourd'hui (${storeEvolution.isPositive ? '+' : '-'}${storeEvolution.percent}% vs J-7). Analyse cette performance et propose des actions pour améliorer le CA en magasin.`
        },
        recommendations: [
          `CA boutique: ${storeToday.revenue}€ (${storeToday.transactions} ventes)`,
          `Évolution vs J-7: ${storeEvolution.isPositive ? '+' : '-'}${storeEvolution.percent}%`,
          `Panier moyen: ${ctx.store.avgTicket}€`,
          storeEvolution.percent < 0
            ? 'Proposer dégustation fleurs aux passants'
            : 'Maintenir la dynamique avec un jeu concours en boutique',
          'Vérifier affichage vitrine et signalétique'
        ]
      });

      // Si boutique sous-performe vs online
      if (ctx.combined && ctx.combined.splitStore < 30) {
        tasks.push({
          id: `ventes-store-${Date.now()}-2`,
          agentId: 'agent-ventes',
          title: '⚠️ Boutique sous-représentée',
          description: `Seulement ${ctx.combined.splitStore}% du CA vient de la boutique. Objectif: 40%+`,
          priority: 'high',
          status: 'needs_attention',
          createdAt: new Date().toISOString(),
          category: 'Boutique',
          actionType: 'prompt',
          actionPayload: {
            prompt: `La boutique représente seulement ${ctx.combined.splitStore}% du CA total (${ctx.store.month.revenue}€/mois). Comment augmenter le trafic en magasin et les ventes physiques?`
          },
          recommendations: [
            `Split actuel: ${ctx.combined.splitOnline}% online / ${ctx.combined.splitStore}% boutique`,
            'Lancer une promo "Retrait en boutique = -5%"',
            'Distribuer des flyers dans le quartier',
            'Organiser un événement CBD dégustation',
            'Ajouter "Click & Collect" sur Shopify'
          ]
        });
      }
    }

    return tasks;
  },

  'agent-inventaire': (ctx) => {
    const tasks: AgentTask[] = [];
    const lowStockNames = ctx.products.lowStockItems.slice(0, 3).map(p => p.title);

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
        category: 'Alerte Stock',
        actionType: 'prompt',
        actionPayload: {
          prompt: `Les produits suivants sont en stock faible: ${lowStockNames.join(', ')}. Génère un email de commande fournisseur avec les quantités recommandées.`
        },
        recommendations: [
          `${ctx.products.lowStock} produits en stock critique`,
          ...ctx.products.lowStockItems.slice(0, 3).map(p => `Commander ${p.title} (reste: ${p.inventory} unités)`),
          'Contacter Baboo pour validation commande fournisseur',
          'Prévoir 2-3 semaines de délai livraison'
        ]
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
        category: 'Rupture',
        actionType: 'automation',
        actionPayload: {
          automationId: 'stock-alert-supplier'
        },
        recommendations: [
          `${ctx.products.outOfStock} produits en rupture totale`,
          'Masquer temporairement sur Shopify pour éviter frustration client',
          'Envoyer commande express au fournisseur',
          'Proposer un produit alternatif aux clients intéressés',
          'Notifier l\'équipe boutique (WhatsApp)'
        ]
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
      category: 'SEO Local',
      actionType: 'prompt',
      actionPayload: {
        prompt: 'Analyse le positionnement SEO de weedn.fr sur les mots-clés "CBD Paris", "fleur CBD Paris", "boutique CBD 75002". Propose 5 optimisations concrètes.'
      },
      recommendations: [
        'Vérifier le ranking Google sur "CBD Paris" (cible: top 5)',
        'Optimiser la fiche Google Business avec photos récentes',
        'Ajouter des avis clients récents (objectif: 50+ avis)',
        'Créer une page "CBD Paris 2ème arrondissement"',
        'Publier 2 articles blog /semaine avec mots-clés locaux'
      ]
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
        category: 'Croissance',
        actionType: 'prompt',
        actionPayload: {
          prompt: `L'objectif CA est à ${ctx.objectiveProgress}%. Propose un plan SEO accéléré pour augmenter le trafic organique de 30% en 30 jours.`
        },
        recommendations: [
          `Objectif CA: ${ctx.objectiveProgress}% (besoin d'accélérer)`,
          'Créer 5 nouvelles pages catégories optimisées',
          'Rédiger 10 articles blog ciblés long-tail',
          'Obtenir 5 backlinks de sites CBD/wellness',
          'Optimiser les meta descriptions de tous les produits'
        ]
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
      category: 'Social Media',
      actionType: 'prompt',
      actionPayload: {
        prompt: 'Crée un post Instagram engageant pour Weedn. Thème: les bienfaits du CBD pour le sommeil. Inclus: caption, hashtags, et suggestions visuelles.'
      },
      recommendations: [
        'Publier entre 18h-20h (meilleur engagement)',
        'Utiliser un carrousel (3-5 slides) pour plus de reach',
        'Hashtags recommandés: #CBD #CBDParis #WellnessParis #SommeilNaturel',
        'Ajouter un CTA vers le site (lien en bio)',
        'Répondre aux commentaires dans l\'heure'
      ]
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
        category: 'Email',
        actionType: 'prompt',
        actionPayload: {
          prompt: `Rédige une séquence email de bienvenue en 3 emails pour les ${ctx.customers.newLast30Days} nouveaux clients Weedn. Ton: chaleureux et expert CBD.`
        },
        recommendations: [
          `${ctx.customers.newLast30Days} nouveaux clients à accueillir`,
          'Email 1 (J+0): Bienvenue + code -10% première commande',
          'Email 2 (J+3): Guide "Bien choisir son CBD"',
          'Email 3 (J+7): Témoignages clients + best-sellers',
          'Personnaliser avec le prénom (Klaviyo)'
        ]
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
