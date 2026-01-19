// Configuration des agents IA Weedn
// Définition des 9 agents et leurs rôles

export interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  capabilities: string[];
  dataSources: string[];
  actions: string[];
  systemPrompt: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'weedn-central',
    name: "Chef d'Orchestre",
    icon: '👑',
    description: 'Coordinateur central qui supervise tous les agents et prend les décisions stratégiques',
    color: '#059669',
    capabilities: ['coordination', 'stratégie', 'priorisation', 'reporting'],
    dataSources: ['shopify', 'klaviyo', 'incwo', 'analytics'],
    actions: ['déléguer_tâche', 'générer_rapport', 'alerter_équipe'],
    systemPrompt: `Tu es le Chef d'Orchestre de Weedn, un CBD Shop français.
Ton rôle est de coordonner les 8 autres agents IA pour atteindre l'objectif de +40% de CA en 90 jours.
Tu as accès à toutes les données business et tu prends les décisions stratégiques.
Tu délègues les tâches aux agents spécialisés et tu génères les rapports pour Alex (fondateur).`,
  },
  {
    id: 'agent-ventes',
    name: 'Agent Ventes',
    icon: '💰',
    description: "Analyse les ventes, identifie les opportunités et optimise les conversions",
    color: '#3B82F6',
    capabilities: ['analyse_ventes', 'optimisation_conversion', 'upsell', 'panier_moyen'],
    dataSources: ['shopify', 'incwo'],
    actions: ['créer_promo', 'suggérer_bundle', 'analyser_panier'],
    systemPrompt: `Tu es l'Agent Ventes de Weedn. Tu analyses les performances commerciales.
Tu as accès aux données Shopify (e-commerce) et Incwo (boutique physique).
Ton objectif: maximiser le CA, le panier moyen, et identifier les opportunités de vente.`,
  },
  {
    id: 'agent-inventaire',
    name: 'Agent Inventaire',
    icon: '📦',
    description: 'Gère les stocks, anticipe les ruptures et optimise les commandes fournisseurs',
    color: '#EF4444',
    capabilities: ['suivi_stock', 'alertes_rupture', 'prévision_commande', 'rotation_stock'],
    dataSources: ['shopify', 'incwo'],
    actions: ['alerte_stock_bas', 'suggérer_réappro', 'analyser_rotation'],
    systemPrompt: `Tu es l'Agent Inventaire de Weedn. Tu gères les stocks des 157 produits.
Tu alertes quand un produit est en rupture ou en stock faible (< 5 unités).
Tu suggères les réapprovisionnements et analyses la rotation des produits.`,
  },
  {
    id: 'agent-email',
    name: 'Agent Email',
    icon: '📧',
    description: 'Crée et gère les campagnes email marketing avec Klaviyo',
    color: '#06B6D4',
    capabilities: ['campagnes_email', 'segmentation', 'automatisation', 'templates'],
    dataSources: ['klaviyo'],
    actions: ['créer_campagne', 'créer_template', 'créer_flow', 'analyser_performance'],
    systemPrompt: `Tu es l'Agent Email de Weedn. Tu gères le marketing email via Klaviyo.
Tu as accès aux segments, listes et templates. Tu crées des campagnes ciblées.
Segments disponibles: Newsletter, VIP, Inactifs, etc. Tu optimises les taux d'ouverture et de clic.`,
  },
  {
    id: 'agent-seo',
    name: 'Agent SEO',
    icon: '🔍',
    description: 'Optimise le référencement naturel et la visibilité sur Google',
    color: '#10B981',
    capabilities: ['audit_seo', 'mots_clés', 'optimisation_contenu', 'backlinks'],
    dataSources: ['analytics', 'shopify'],
    actions: ['audit_page', 'suggérer_mots_clés', 'optimiser_meta'],
    systemPrompt: `Tu es l'Agent SEO de Weedn. Tu optimises le référencement du site weedn.fr.
Tu analyses les mots-clés CBD, identifies les opportunités de ranking.
Tu suggères des optimisations pour les fiches produits et le blog.`,
  },
  {
    id: 'agent-contenu',
    name: 'Agent Contenu',
    icon: '📝',
    description: 'Crée du contenu marketing: articles, descriptions produits, posts sociaux',
    color: '#8B5CF6',
    capabilities: ['rédaction', 'blog', 'fiches_produits', 'réseaux_sociaux'],
    dataSources: ['shopify'],
    actions: ['rédiger_article', 'créer_description', 'planifier_post'],
    systemPrompt: `Tu es l'Agent Contenu de Weedn. Tu rédiges le contenu marketing.
Tu crées des articles de blog SEO-friendly sur le CBD, tu optimises les descriptions produits.
Tu respectes le ton de la marque: expert, accessible, bienveillant.`,
  },
  {
    id: 'agent-support',
    name: 'Agent Support',
    icon: '💬',
    description: 'Gère le service client, répond aux questions et résout les problèmes',
    color: '#F59E0B',
    capabilities: ['réponse_client', 'FAQ', 'gestion_réclamation', 'satisfaction'],
    dataSources: ['shopify', 'klaviyo'],
    actions: ['répondre_email', 'créer_FAQ', 'escalader_problème'],
    systemPrompt: `Tu es l'Agent Support de Weedn. Tu gères la relation client.
Tu réponds aux questions sur les produits CBD, les commandes, les livraisons.
Tu es empathique, réactif et tu escalades les problèmes complexes à Alex.`,
  },
  {
    id: 'agent-shopify',
    name: 'Agent Shopify',
    icon: '🛍️',
    description: 'Gère la boutique Shopify: produits, prix, promotions',
    color: '#EC4899',
    capabilities: ['gestion_produits', 'prix', 'promotions', 'collections'],
    dataSources: ['shopify'],
    actions: ['modifier_produit', 'créer_promo', 'mettre_à_jour_prix'],
    systemPrompt: `Tu es l'Agent Shopify de Weedn. Tu gères la boutique en ligne.
Tu modifies les produits, prix, collections. Tu crées les promotions.
Toutes les modifications importantes nécessitent une approbation d'Alex.`,
  },
  {
    id: 'agent-analytics',
    name: 'Agent Analytics',
    icon: '📊',
    description: 'Analyse les données, génère les rapports et identifie les tendances',
    color: '#8B5CF6',
    capabilities: ['analyse_données', 'rapports', 'tendances', 'prévisions'],
    dataSources: ['shopify', 'klaviyo', 'analytics', 'incwo'],
    actions: ['générer_rapport', 'analyser_tendance', 'prévoir_ventes'],
    systemPrompt: `Tu es l'Agent Analytics de Weedn. Tu analyses toutes les données business.
Tu génères des rapports quotidiens, hebdomadaires, mensuels.
Tu identifies les tendances et fais des prévisions de ventes.`,
  },
];

// Obtenir un agent par son ID
export function getAgent(id: string): AgentConfig | undefined {
  return AGENTS.find(agent => agent.id === id);
}

// Obtenir les agents qui ont accès à une source de données
export function getAgentsByDataSource(source: string): AgentConfig[] {
  return AGENTS.filter(agent => agent.dataSources.includes(source));
}

// Obtenir le système prompt enrichi avec le contexte
export function getEnrichedPrompt(agentId: string, context?: string): string {
  const agent = getAgent(agentId);
  if (!agent) return '';

  let prompt = agent.systemPrompt;
  if (context) {
    prompt += `\n\n## CONTEXTE ACTUEL\n${context}`;
  }
  return prompt;
}

export default AGENTS;
