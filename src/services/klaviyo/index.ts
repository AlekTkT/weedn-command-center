// Service Klaviyo - Email Marketing
// Note: Les données Klaviyo sont accessibles via MCP, ce service sert d'interface

export interface KlaviyoSegment {
  id: string;
  name: string;
  profileCount?: number;
}

export interface KlaviyoList {
  id: string;
  name: string;
  profileCount?: number;
}

export interface KlaviyoCampaign {
  id: string;
  name: string;
  status: string;
  channel: string;
  createdAt: string;
}

export interface KlaviyoData {
  segments: KlaviyoSegment[];
  lists: KlaviyoList[];
  campaigns: KlaviyoCampaign[];
  account: {
    email: string;
    timezone: string;
    currency: string;
  };
}

// Segments connus de Weedn (mis à jour via MCP)
export const KNOWN_SEGMENTS: KlaviyoSegment[] = [
  { id: 'WdUHAd', name: 'Newsletter' },
  { id: 'XxdVEX', name: 'Engaged in the last 120 days' },
  { id: 'Xnbnxd', name: 'Engaged in the last 30 days' },
  { id: 'YKLb8e', name: 'Winback – 120 Day Lapsed Purchasers' },
  { id: 'XJNgUg', name: 'New subscribers' },
  { id: 'WVP7Xn', name: 'Repeat customers' },
  { id: 'VZAcmH', name: 'Potential churn' },
  { id: 'WtTmgu', name: 'Someone who has recently placed an order' },
  { id: 'WVQFm3', name: 'Abandoned cart reminder' },
];

// Listes connues de Weedn
export const KNOWN_LISTS: KlaviyoList[] = [
  { id: 'WTXhLX', name: 'Newsletter' },
  { id: 'WsnmM6', name: 'Sample Data List' },
  { id: 'VNKBLH', name: 'TEST Liste 01' },
];

// Obtenir les données Klaviyo (statiques ou via API)
export function getKlaviyoData(): KlaviyoData {
  return {
    segments: KNOWN_SEGMENTS,
    lists: KNOWN_LISTS,
    campaigns: [], // À remplir via MCP
    account: {
      email: 'cbdoshop75@gmail.com',
      timezone: 'Europe/Paris',
      currency: 'EUR',
    },
  };
}

// Formater le contexte Klaviyo pour les prompts agents
export function formatKlaviyoContext(): string {
  const data = getKlaviyoData();

  return `## DONNÉES KLAVIYO (Email Marketing)

### Segments disponibles (${data.segments.length}):
${data.segments.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}

### Listes disponibles (${data.lists.length}):
${data.lists.map(l => `- ${l.name} (ID: ${l.id})`).join('\n')}

### Actions possibles via MCP:
- Créer une campagne email
- Créer un template
- Créer un flow automatisé
- Récupérer les profils
- Analyser les performances`;
}

// Types pour les actions Klaviyo
export interface CreateCampaignParams {
  name: string;
  subject: string;
  listId?: string;
  segmentId?: string;
  content?: string;
}

export interface CreateTemplateParams {
  name: string;
  html: string;
}

export interface CreateFlowParams {
  name: string;
  trigger: string;
}

// Actions Klaviyo (à exécuter via MCP)
export const klaviyoActions = {
  createCampaign: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_create_campaign',
  createTemplate: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_create_email_template',
  getSegments: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_get_segments',
  getLists: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_get_lists',
  getCampaigns: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_get_campaigns',
  getCampaignReport: 'mcp__01920f2a-a077-4cb7-9d16-f8e1c52ab675__klaviyo_get_campaign_report',
};

export default {
  getKlaviyoData,
  formatKlaviyoContext,
  KNOWN_SEGMENTS,
  KNOWN_LISTS,
  klaviyoActions,
};
