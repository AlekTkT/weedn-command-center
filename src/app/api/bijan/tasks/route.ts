import { NextResponse } from 'next/server'
import { getBijanShopifyConfig, isBijanConfigured } from '@/config'

interface Task {
  id: string
  agent: string
  agentIcon: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
  actionUrl?: string
  impact?: string
  category: 'revenue' | 'stock' | 'marketing' | 'customer' | 'operations'
  data?: Record<string, any>
}

export async function GET() {
  const tasks: Task[] = []

  try {
    // Vérifier si Shopify est configuré
    if (!isBijanConfigured()) {
      // Tâche de configuration prioritaire
      tasks.push({
        id: 'config-shopify',
        agent: 'Manager',
        agentIcon: '👔',
        priority: 'high',
        title: 'Configurer Shopify POS',
        description: 'Le token Shopify BIJAN doit être configuré pour activer tous les agents',
        action: 'Configurer',
        actionUrl: 'https://admin.shopify.com/store/011ce1-4/settings/apps/development',
        impact: 'Débloque 9 agents IA',
        category: 'operations',
      })

      // Tâches marketing indépendantes de Shopify
      tasks.push(...getMarketingTasks())

      return NextResponse.json({
        success: true,
        data: {
          tasks,
          summary: {
            total: tasks.length,
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length,
          },
          configured: false,
        }
      })
    }

    const config = getBijanShopifyConfig()!

    // Récupérer les données en parallèle
    const [ordersData, productsData] = await Promise.all([
      fetchOrders(config),
      fetchProducts(config),
    ])

    // Générer les tâches basées sur les données réelles
    const salesTasks = generateSalesTasks(ordersData)
    const stockTasks = generateStockTasks(productsData)
    const marketingTasks = getMarketingTasks()
    const customerTasks = generateCustomerTasks(ordersData)
    const operationsTasks = generateOperationsTasks(ordersData, productsData)

    tasks.push(...salesTasks, ...stockTasks, ...marketingTasks, ...customerTasks, ...operationsTasks)

    // Trier par priorité
    tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        summary: {
          total: tasks.length,
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length,
          byCategory: {
            revenue: tasks.filter(t => t.category === 'revenue').length,
            stock: tasks.filter(t => t.category === 'stock').length,
            marketing: tasks.filter(t => t.category === 'marketing').length,
            customer: tasks.filter(t => t.category === 'customer').length,
            operations: tasks.filter(t => t.category === 'operations').length,
          },
        },
        configured: true,
        fetchedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Erreur API BIJAN tasks:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération des tâches',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

async function fetchOrders(config: { store: string; accessToken: string; apiVersion: string }) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const response = await fetch(
    `https://${config.store}/admin/api/${config.apiVersion}/orders.json?status=any&created_at_min=${startOfMonth.toISOString()}&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) return { orders: [], stats: {} }
  const data = await response.json()
  return processOrders(data.orders || [])
}

async function fetchProducts(config: { store: string; accessToken: string; apiVersion: string }) {
  const response = await fetch(
    `https://${config.store}/admin/api/${config.apiVersion}/products.json?limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) return { products: [], stats: {} }
  const data = await response.json()
  return processProducts(data.products || [])
}

function processOrders(orders: any[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const paidOrders = orders.filter(o => o.financial_status === 'paid' || o.financial_status === 'partially_paid')
  const todayOrders = paidOrders.filter(o => new Date(o.created_at) >= today)
  const monthOrders = paidOrders

  const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0)

  // Top produits vendus
  const productSales: Record<string, { title: string; quantity: number; revenue: number }> = {}
  monthOrders.forEach(order => {
    order.line_items?.forEach((item: any) => {
      const key = item.product_id || item.title
      if (!productSales[key]) {
        productSales[key] = { title: item.title, quantity: 0, revenue: 0 }
      }
      productSales[key].quantity += item.quantity
      productSales[key].revenue += parseFloat(item.price) * item.quantity
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Clients récurrents
  const customerOrders: Record<string, number> = {}
  monthOrders.forEach(order => {
    if (order.customer?.id) {
      customerOrders[order.customer.id] = (customerOrders[order.customer.id] || 0) + 1
    }
  })
  const recurringCustomers = Object.values(customerOrders).filter(count => count > 1).length

  return {
    orders,
    paidOrders,
    stats: {
      monthRevenue,
      todayRevenue,
      monthOrders: monthOrders.length,
      todayOrders: todayOrders.length,
      avgBasket: monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0,
      topProducts,
      recurringCustomers,
      totalCustomers: Object.keys(customerOrders).length,
      posOrders: paidOrders.filter(o => o.source_name === 'pos' || o.source_name === 'shopify_pos').length,
      webOrders: paidOrders.filter(o => o.source_name !== 'pos' && o.source_name !== 'shopify_pos').length,
    }
  }
}

function processProducts(products: any[]) {
  const active = products.filter(p => p.status === 'active')

  // Catégorisation bijoux BIJAN
  // Piercing titane + Bijoux corps acier inoxydable
  // Doré et argenté (PAS or ni argent véritable)
  const categorized = {
    piercing: [] as any[],
    bijoux_acier: [] as any[],
    dore: [] as any[],
    argente: [] as any[],
    autre: [] as any[],
  }

  active.forEach(product => {
    const title = (product.title || '').toLowerCase()
    const type = (product.product_type || '').toLowerCase()
    const tags = (product.tags || '').toLowerCase()

    // Piercing (titane)
    if (tags.includes('piercing') || type.includes('piercing') ||
        title.includes('piercing') || title.includes('labret') ||
        title.includes('septum') || title.includes('helix') ||
        title.includes('tragus') || title.includes('daith') ||
        title.includes('conch') || title.includes('rook') ||
        tags.includes('titane') || title.includes('titane')) {
      categorized.piercing.push(product)
    }
    // Doré (plaqué or, gold plated)
    else if (tags.includes('doré') || tags.includes('dore') || tags.includes('gold') ||
             title.includes('doré') || title.includes('dore') || title.includes('gold')) {
      categorized.dore.push(product)
    }
    // Argenté (couleur, pas argent massif)
    else if (tags.includes('argenté') || tags.includes('argente') || tags.includes('silver') ||
             title.includes('argenté') || title.includes('argente')) {
      categorized.argente.push(product)
    }
    // Acier inoxydable (bijoux corps fantaisie)
    else if (tags.includes('acier') || type.includes('acier') ||
             title.includes('acier') || title.includes('inox') ||
             title.includes('steel')) {
      categorized.bijoux_acier.push(product)
    }
    else {
      categorized.autre.push(product)
    }
  })

  // Produits en rupture ou stock bas
  const lowStock: any[] = []
  const outOfStock: any[] = []

  active.forEach(product => {
    const hasLowStock = product.variants?.some((v: any) =>
      v.inventory_quantity !== null && v.inventory_quantity > 0 && v.inventory_quantity < 5
    )
    const isOutOfStock = product.variants?.every((v: any) =>
      v.inventory_quantity === 0
    )

    if (isOutOfStock) {
      outOfStock.push(product)
    } else if (hasLowStock) {
      lowStock.push(product)
    }
  })

  // Produits sans images
  const noImages = active.filter(p => !p.images || p.images.length === 0)

  // Produits sans description
  const noDescription = active.filter(p => !p.body_html || p.body_html.length < 50)

  return {
    products,
    active,
    categorized,
    stats: {
      total: products.length,
      active: active.length,
      piercing: categorized.piercing.length,
      bijoux_acier: categorized.bijoux_acier.length,
      dore: categorized.dore.length,
      argente: categorized.argente.length,
      autre: categorized.autre.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      noImages: noImages.length,
      noDescription: noDescription.length,
    },
    lowStock,
    outOfStock,
    noImages,
    noDescription,
  }
}

function generateSalesTasks(ordersData: any): Task[] {
  const tasks: Task[] = []
  const { stats } = ordersData

  // Objectif mensuel BIJAN: 25 000 EUR
  const monthlyTarget = 25000
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currentDay = new Date().getDate()
  const expectedRevenue = (monthlyTarget / daysInMonth) * currentDay
  const progress = (stats.monthRevenue / monthlyTarget) * 100

  if (progress < 50 && currentDay > 15) {
    tasks.push({
      id: 'sales-behind',
      agent: 'Ventes',
      agentIcon: '💰',
      priority: 'high',
      title: 'Objectif mensuel en retard',
      description: `${Math.round(progress)}% de l'objectif atteint à mi-mois. Il faut ${(monthlyTarget - stats.monthRevenue).toFixed(0)}€ pour atteindre 25k€`,
      impact: `+${(monthlyTarget - stats.monthRevenue).toFixed(0)}€ CA`,
      category: 'revenue',
      data: { progress, target: monthlyTarget, current: stats.monthRevenue },
    })
  }

  // Panier moyen
  if (stats.avgBasket < 35) {
    tasks.push({
      id: 'upsell-basket',
      agent: 'Ventes',
      agentIcon: '💰',
      priority: 'medium',
      title: 'Augmenter le panier moyen',
      description: `Panier moyen actuel: ${stats.avgBasket.toFixed(0)}€. Proposer des lots ou accessoires complémentaires`,
      action: 'Créer bundle',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/products/new',
      impact: '+15% panier moyen',
      category: 'revenue',
    })
  }

  // Top produits à promouvoir
  if (stats.topProducts && stats.topProducts.length > 0) {
    const topProduct = stats.topProducts[0]
    tasks.push({
      id: 'promote-bestseller',
      agent: 'Ventes',
      agentIcon: '💰',
      priority: 'low',
      title: `Promouvoir le bestseller: ${topProduct.title.substring(0, 30)}...`,
      description: `${topProduct.quantity} ventes ce mois. Mettre en avant sur Instagram et vitrine`,
      impact: '+20% ventes produit',
      category: 'revenue',
      data: { product: topProduct },
    })
  }

  // Ventes web vs boutique
  if (stats.webOrders === 0 && stats.posOrders > 5) {
    tasks.push({
      id: 'boost-web-sales',
      agent: 'Ventes',
      agentIcon: '💰',
      priority: 'medium',
      title: 'Développer les ventes en ligne',
      description: '100% des ventes en boutique. Activer le site web bijanparis.com',
      action: 'Voir site',
      actionUrl: 'https://www.bijanparis.com',
      impact: '+30% CA potentiel',
      category: 'revenue',
    })
  }

  return tasks
}

function generateStockTasks(productsData: any): Task[] {
  const tasks: Task[] = []
  const { stats, lowStock, outOfStock, noImages, noDescription } = productsData

  // Ruptures de stock
  if (outOfStock.length > 0) {
    tasks.push({
      id: 'restock-urgent',
      agent: 'Stock',
      agentIcon: '📦',
      priority: 'high',
      title: `${outOfStock.length} produit(s) en rupture`,
      description: outOfStock.slice(0, 3).map((p: any) => p.title).join(', ') + (outOfStock.length > 3 ? '...' : ''),
      action: 'Voir stock',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/products/inventory',
      impact: 'Ventes perdues',
      category: 'stock',
      data: { products: outOfStock.slice(0, 5) },
    })
  }

  // Stock bas
  if (lowStock.length > 0) {
    tasks.push({
      id: 'restock-low',
      agent: 'Stock',
      agentIcon: '📦',
      priority: 'medium',
      title: `${lowStock.length} produit(s) stock bas (<5)`,
      description: 'Anticiper le réapprovisionnement avant rupture',
      action: 'Commander',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/products/inventory',
      impact: 'Éviter ruptures',
      category: 'stock',
      data: { products: lowStock.slice(0, 5) },
    })
  }

  // Produits sans photos
  if (noImages.length > 0) {
    tasks.push({
      id: 'add-photos',
      agent: 'Stock',
      agentIcon: '📦',
      priority: 'medium',
      title: `${noImages.length} produit(s) sans photo`,
      description: 'Ajouter des photos pour améliorer les conversions',
      action: 'Ajouter photos',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/products',
      impact: '+40% conversions',
      category: 'stock',
    })
  }

  // Catégories à développer
  if (stats.piercing < 20) {
    tasks.push({
      id: 'expand-piercing',
      agent: 'Piercing',
      agentIcon: '💎',
      priority: 'low',
      title: 'Élargir gamme piercing titane',
      description: `Seulement ${stats.piercing} références piercing. Segment à 65% de marge`,
      impact: '+65% marge',
      category: 'stock',
    })
  }

  return tasks
}

function getMarketingTasks(): Task[] {
  const tasks: Task[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const dayOfMonth = today.getDate()

  // Instagram - posts réguliers
  tasks.push({
    id: 'instagram-post',
    agent: 'Instagram',
    agentIcon: '📱',
    priority: dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6 ? 'high' : 'medium',
    title: 'Publier sur Instagram',
    description: 'Poster une photo produit ou du magasin. Objectif: 3 posts/semaine',
    action: 'Publier',
    actionUrl: 'https://instagram.com/bijan.paris',
    impact: '+15% visibilité',
    category: 'marketing',
  })

  // Stories quotidiennes
  tasks.push({
    id: 'instagram-story',
    agent: 'Instagram',
    agentIcon: '📱',
    priority: 'low',
    title: 'Partager en story',
    description: 'Nouveautés, coulisses, clients satisfaits',
    action: 'Story',
    actionUrl: 'https://instagram.com/bijan.paris',
    impact: 'Engagement +20%',
    category: 'marketing',
  })

  // Google Reviews - important pour le local
  tasks.push({
    id: 'google-reviews',
    agent: 'Marketing',
    agentIcon: '📍',
    priority: 'medium',
    title: 'Demander des avis Google',
    description: 'Encourager les clients satisfaits à laisser un avis. Objectif: 50 avis 5 étoiles',
    action: 'Voir profil',
    actionUrl: 'https://maps.app.goo.gl/3EvG6RVJzFZe7B1r6',
    impact: 'SEO local +30%',
    category: 'marketing',
  })

  // Promo fin de mois
  if (dayOfMonth >= 25) {
    tasks.push({
      id: 'month-end-promo',
      agent: 'Promotions',
      agentIcon: '🎁',
      priority: 'high',
      title: 'Lancer promo fin de mois',
      description: 'Booster les ventes des derniers jours. -10% sur sélection ou offre 2+1',
      action: 'Créer promo',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/discounts/new',
      impact: '+25% ventes',
      category: 'marketing',
    })
  }

  return tasks
}

function generateCustomerTasks(ordersData: any): Task[] {
  const tasks: Task[] = []
  const { stats } = ordersData

  // Fidélisation clients récurrents
  if (stats.recurringCustomers > 0) {
    tasks.push({
      id: 'loyalty-program',
      agent: 'Clients',
      agentIcon: '👥',
      priority: 'medium',
      title: 'Fidéliser les clients récurrents',
      description: `${stats.recurringCustomers} clients ont commandé plusieurs fois. Programme fidélité?`,
      impact: '+50% rétention',
      category: 'customer',
    })
  }

  // Nouveaux clients
  if (stats.totalCustomers > 10) {
    tasks.push({
      id: 'welcome-new',
      agent: 'Clients',
      agentIcon: '👥',
      priority: 'low',
      title: 'Email de bienvenue nouveaux clients',
      description: `${stats.totalCustomers} clients ce mois. Envoyer un email avec code promo retour`,
      impact: '+15% récurrence',
      category: 'customer',
    })
  }

  return tasks
}

function generateOperationsTasks(ordersData: any, productsData: any): Task[] {
  const tasks: Task[] = []

  // Analyse hebdomadaire
  const dayOfWeek = new Date().getDay()
  if (dayOfWeek === 1) { // Lundi
    tasks.push({
      id: 'weekly-review',
      agent: 'Manager',
      agentIcon: '👔',
      priority: 'medium',
      title: 'Revue hebdomadaire',
      description: 'Analyser les ventes de la semaine passée et ajuster la stratégie',
      impact: 'Optimisation continue',
      category: 'operations',
    })
  }

  // Vérifier les descriptions produits
  if (productsData.noDescription?.length > 5) {
    tasks.push({
      id: 'improve-descriptions',
      agent: 'Manager',
      agentIcon: '👔',
      priority: 'low',
      title: 'Améliorer les fiches produits',
      description: `${productsData.noDescription.length} produits sans description complète`,
      action: 'Voir produits',
      actionUrl: 'https://admin.shopify.com/store/011ce1-4/products',
      impact: '+25% SEO',
      category: 'operations',
    })
  }

  return tasks
}
