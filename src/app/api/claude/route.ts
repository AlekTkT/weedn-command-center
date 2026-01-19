import { NextRequest, NextResponse } from 'next/server';
import { getFullMetrics } from '@/services/shopify';
import { formatKlaviyoContext } from '@/services/klaviyo';
import { getAgent } from '@/config/agents';
import { ENV } from '@/config';

export async function POST(request: NextRequest) {
  try {
    const { prompt, agentId, systemPrompt } = await request.json();
    const apiKey = process.env.WEEDN_CLAUDE_API_KEY || ENV.ANTHROPIC_API_KEY;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Anthropic non configurée' }, { status: 500 });
    }

    // Récupérer TOUTES les données Shopify
    let shopifyContext = '';
    let hasRealData = false;
    const needsShopifyData = ['weedn-central', 'agent-ventes', 'agent-inventaire', 'agent-analytics', 'agent-shopify'].includes(agentId);

    if (needsShopifyData) {
      try {
        const data = await getFullMetrics();
        hasRealData = true;

        shopifyContext = `

## DONNÉES COMPLÈTES SHOPIFY WEEDN (${new Date().toLocaleString('fr-FR')})

### BOUTIQUE
- Nom: ${data.shop.name}
- Domaine: ${data.shop.domain}
- Email: ${data.shop.email}
- Devise: ${data.shop.currency}
- Pays: ${data.shop.country}

### CHIFFRE D'AFFAIRES
| Période | CA |
|---------|-----|
| Aujourd'hui | ${data.revenue.today}€ |
| Hier | ${data.revenue.yesterday}€ |
| 7 derniers jours | ${data.revenue.last7Days}€ |
| 30 derniers jours | ${data.revenue.last30Days}€ |
| Total | ${data.revenue.total}€ |
| Panier moyen | ${data.revenue.avgOrderValue}€ |

### COMMANDES
| Période | Nombre |
|---------|--------|
| Aujourd'hui | ${data.orders.today} |
| Hier | ${data.orders.yesterday} |
| 7 derniers jours | ${data.orders.last7Days} |
| 30 derniers jours | ${data.orders.last30Days} |
| Total | ${data.orders.total} |

### DERNIÈRES COMMANDES
${data.orders.recent.map((o: any) => `- #${o.number}: ${o.total}€ (${o.financialStatus}) - ${o.customerEmail || 'Sans email'}`).join('\n')}

### PRODUITS
- Total: ${data.products.total}
- Actifs: ${data.products.active}
- Stock faible (≤5): ${data.products.lowStock}
- En rupture: ${data.products.outOfStock}

${data.products.lowStockItems.length > 0 ? `### ⚠️ ALERTES STOCK FAIBLE
${data.products.lowStockItems.map((p: any) => `- ${p.title}: ${p.inventory} unités (${p.priceRange.min}-${p.priceRange.max}€)`).join('\n')}` : ''}

${data.products.outOfStockItems.length > 0 ? `### 🚨 PRODUITS EN RUPTURE
${data.products.outOfStockItems.map((p: any) => `- ${p.title}`).join('\n')}` : ''}

### TOP PRODUITS VENDUS
${data.topProducts.map((p: any, i: number) => `${i + 1}. ${p.title}: ${p.quantity} vendus (${p.revenue.toFixed(2)}€)`).join('\n')}

### CLIENTS
- Total: ${data.customers.total}
- Nouveaux (30j): ${data.customers.newLast30Days}

### CATALOGUE COMPLET (${data.products.all.length} produits)
${data.products.all.slice(0, 30).map((p: any) => `- ${p.title} | Stock: ${p.inventory} | Prix: ${p.priceRange.min}-${p.priceRange.max}€ | Type: ${p.productType || 'N/A'}`).join('\n')}
${data.products.all.length > 30 ? `\n... et ${data.products.all.length - 30} autres produits` : ''}
`;
      } catch (error) {
        console.error('Shopify data error:', error);
        shopifyContext = '\n⚠️ Impossible de récupérer les données Shopify en temps réel.\n';
      }
    }

    // Données Klaviyo statiques (récupérées via MCP)
    const klaviyoContext = `

## DONNÉES KLAVIYO

### Compte: WEEDN (contact@weedn.fr)
- Adresse: 4 Rue Tiquetonne, 75002 Paris
- Timezone: Europe/Paris | Devise: EUR

### Listes (3)
- Liste d'adresses e-mail (ID: VZHJQj)
- Liste de SMS (ID: T3T2rY)
- Prévisualiser la liste (ID: SXfL6A)

### Segments (9)
| Segment | ID | Description |
|---------|-----|-------------|
| Clients VIP | VHdHBg | +5 commandes |
| Acheteurs réguliers | SEKJRx | +1 commande |
| Acheteurs potentiels | V6cEYD | Actifs 30j sans achat |
| Nouveaux abonnés | UKFDB5 | Inscrits 14j |
| Risques d'attrition | VCAtfS | Inactifs 180j |
| Opportunités reconquête | WfBvSv | À réactiver |
| Engagement 30j | Wy7x7y | Actifs 30j |
| Engagement 60j | VV6uuV | Actifs 60j |
| Engagement 90j | TvDymP | Actifs 90j |

### Campagnes: 0 active
`;

    // System prompts enrichis avec contexte complet
    const agentSystemPrompts: Record<string, string> = {
      'weedn-central': `Tu es le Chef d'Orchestre de Weedn, une boutique CBD située au 4 Rue Tiquetonne, 75002 Paris.
Site e-commerce: weedn.fr (Shopify)
Objectif: Augmenter le CA de 40% en 90 jours.

Tu coordonnes 8 agents spécialisés et as accès à TOUTES les données business en temps réel.
Réponds avec des analyses précises basées UNIQUEMENT sur les données réelles ci-dessous.
${shopifyContext}
${klaviyoContext}`,

      'agent-ventes': `Tu es l'Agent Ventes de Weedn.
Tu analyses les données Shopify en temps réel et proposes des actions concrètes pour augmenter les ventes.
Tu as accès au CA, commandes, produits, clients et top ventes.
Base tes analyses UNIQUEMENT sur les données réelles.
${shopifyContext}`,

      'agent-inventaire': `Tu es l'Agent Inventaire de Weedn.
Tu surveilles TOUS les stocks en temps réel et alertes sur les ruptures.
Tu proposes des réapprovisionnements prioritaires basés sur les ventes.
${shopifyContext}`,

      'agent-analytics': `Tu es l'Agent Analytics de Weedn.
Tu analyses les KPIs business et crées des rapports détaillés.
Tu as accès à toutes les métriques: CA, commandes, produits, clients.
${shopifyContext}
${klaviyoContext}`,

      'agent-shopify': `Tu es l'Agent Shopify de Weedn.
Tu développes et optimises le site e-commerce weedn.fr.
Tu as accès à tous les produits, leurs prix, stocks et performances.
Store: f24081-64.myshopify.com
${shopifyContext}`,

      'agent-seo': `Tu es l'Agent SEO de Weedn.
Tu optimises le référencement de weedn.fr pour les mots-clés CBD Paris.
Tu analyses les rankings et proposes des améliorations concrètes.
Site: weedn.fr | Boutique: 4 Rue Tiquetonne, 75002 Paris`,

      'agent-contenu': `Tu es l'Agent Contenu de Weedn.
Tu crées des articles de blog, posts Instagram/Facebook et stories pour promouvoir les produits CBD.
Tu proposes du contenu engageant et conforme aux règles publicitaires CBD.
Site: weedn.fr | Instagram: @weedn.fr`,

      'agent-support': `Tu es l'Agent Support de Weedn.
Tu gères les avis Google, réponds aux clients et améliores la satisfaction.
Boutique: 4 Rue Tiquetonne, 75002 Paris
Téléphone: 01 42 60 98 74`,

      'agent-email': `Tu es l'Agent Email de Weedn.
Tu gères les campagnes Klaviyo, crées des newsletters et automatises les flows email.
Tu as accès aux segments clients pour des campagnes ciblées.
${klaviyoContext}`,

      'agent-factures': `Tu es l'Agent Factures de RETAR DIO (SIRET: 98853449100010).
Tu surveilles les emails Gmail (cbdoshop75@gmail.com et theonlyweedn@gmail.com) pour identifier les factures entrantes.
Tu analyses, classes et répertories les factures fournisseurs.

ENTREPRISE DESTINATAIRE:
- Raison sociale: RETAR DIO
- Dirigeant: Alexandre Courthieu
- Adresse: 4 rue Tiquetonne, 75002 PARIS
- SIRET: 98853449100010

CATÉGORIES DE FACTURES:
- produits: Achat de produits CBD
- packaging: Emballages, boîtes, étiquettes
- logistique: Transport, livraison, stockage
- marketing: Publicité, design, impression
- services: Comptabilité, juridique, web
- abonnements: SaaS, licences, outils
- divers: Autres dépenses

Tu dois alerter sur les factures en retard et proposer des optimisations de dépenses.`,
    };

    const finalSystemPrompt = systemPrompt || agentSystemPrompts[agentId] ||
      `Tu es un assistant IA pour Weedn, une boutique CBD à Paris. Aide à augmenter le chiffre d'affaires de 40%.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API Error:', errorData);
      return NextResponse.json({ error: 'Erreur API Anthropic', details: errorData }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      response: data.content[0]?.text || '',
      agentId,
      usage: data.usage,
      hasRealData,
    });
  } catch (error) {
    console.error('Error calling Claude:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
