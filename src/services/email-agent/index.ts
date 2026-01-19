/**
 * Service Email Agent - Gestion des emails pour Weedn
 * Permet aux agents de rédiger et envoyer des emails via Gmail MCP
 *
 * Agents concernés:
 * - Agent Négociateur: Commandes fournisseurs (fin négociateur)
 * - Agent Support: Réponses clients
 * - Agent Email: Campagnes marketing (via Klaviyo)
 */

// Types pour les emails
export interface EmailDraft {
  id: string;
  type: 'supplier_order' | 'supplier_negotiation' | 'customer_support' | 'customer_followup' | 'marketing';
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed';
  agentId: string;
  agentName: string;
  context?: {
    supplierId?: string;
    supplierName?: string;
    orderId?: string;
    customerId?: string;
    customerName?: string;
    products?: { name: string; quantity: number; priceTarget?: number }[];
    negotiationStrategy?: string;
  };
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export interface SupplierOrderRequest {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  products: {
    name: string;
    quantity: number;
    lastPrice?: number;
    targetPrice?: number;
  }[];
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CustomerSupportRequest {
  customerEmail: string;
  customerName?: string;
  originalMessage: string;
  orderId?: string;
  issueType: 'shipping' | 'product' | 'refund' | 'general' | 'complaint';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// Templates d'emails négociateur
const NEGOTIATOR_TEMPLATES = {
  // Première commande - établir la relation
  firstOrder: (data: SupplierOrderRequest) => ({
    subject: `Demande de devis - ${data.supplierName} x Weedn`,
    body: `Bonjour,

Je me permets de vous contacter au nom de Weedn, boutique CBD située au cœur de Paris (4 rue Tiquetonne, 75002).

Nous sommes à la recherche d'un partenaire fiable pour notre approvisionnement et votre catalogue a retenu notre attention.

Pourriez-vous nous faire parvenir un devis pour les produits suivants :
${data.products.map(p => `- ${p.name} : ${p.quantity} unités`).join('\n')}

Nous privilégions les partenariats sur le long terme avec des fournisseurs de qualité. Notre volume mensuel est en croissance constante et nous recherchons des conditions avantageuses pour une collaboration durable.

Pourriez-vous également nous indiquer :
- Vos conditions de paiement
- Vos délais de livraison
- Votre franco de port

Dans l'attente de votre retour,
Cordialement,

Alexandre Courthieu
Weedn - CBD & Bien-être
4 rue Tiquetonne, 75002 Paris
Tel: 01 42 60 98 74
www.weedn.fr`
  }),

  // Commande récurrente - négociation prix
  recurringOrder: (data: SupplierOrderRequest) => ({
    subject: `Commande Weedn - ${new Date().toLocaleDateString('fr-FR')}`,
    body: `Bonjour,

Suite à notre excellente collaboration, je souhaite passer une nouvelle commande :

${data.products.map(p => {
  const priceNote = p.lastPrice && p.targetPrice && p.targetPrice < p.lastPrice
    ? ` (dernière commande à ${p.lastPrice}€/u - objectif ${p.targetPrice}€/u)`
    : p.lastPrice ? ` (dernière commande à ${p.lastPrice}€/u)` : '';
  return `- ${p.name} : ${p.quantity} unités${priceNote}`;
}).join('\n')}

${data.urgency === 'high' ? '⚠️ URGENT: Nous avons besoin de cette livraison rapidement (rupture imminente).\n' : ''}
Compte tenu de notre volume croissant et de notre fidélité, serait-il possible de revoir les tarifs à la baisse ? Nous aimerions augmenter nos quantités si les conditions s'y prêtent.

Merci de me confirmer la disponibilité et le meilleur tarif possible.

Cordialement,

Alexandre Courthieu
Weedn
01 42 60 98 74`
  }),

  // Négociation agressive (rupture de stock)
  urgentNegotiation: (data: SupplierOrderRequest) => ({
    subject: `🔴 URGENT - Commande prioritaire Weedn`,
    body: `Bonjour,

Situation urgente de notre côté : nous sommes en rupture sur plusieurs références clés.

Commande prioritaire :
${data.products.map(p => `- ${p.name} : ${p.quantity} unités`).join('\n')}

Nous avons besoin d'une livraison EXPRESS (24-48h si possible).

En contrepartie de cette réactivité, nous sommes prêts à :
- Augmenter le volume de nos prochaines commandes
- Envisager un partenariat exclusif sur certaines références
- Payer d'avance si nécessaire

Quel est le meilleur tarif que vous pouvez nous proposer pour cette commande urgente ?

Merci de votre retour rapide.

Alexandre Courthieu
Weedn - Paris
01 42 60 98 74`
  }),

  // Demande de remise volume
  volumeDiscount: (data: SupplierOrderRequest) => ({
    subject: `Proposition partenariat volume - Weedn x ${data.supplierName}`,
    body: `Bonjour,

Je me permets de vous solliciter concernant nos conditions commerciales.

Notre collaboration fonctionne bien et nous souhaitons l'intensifier. Nos prévisions pour les prochains mois sont en forte hausse (+40% de CA visé).

Pour cette raison, nous aimerions discuter d'une grille tarifaire préférentielle basée sur un engagement volume :

Commande immédiate envisagée :
${data.products.map(p => `- ${p.name} : ${p.quantity} unités`).join('\n')}

Questions :
1. Avez-vous une grille tarifaire dégressive ?
2. Quels sont les paliers de volume pour obtenir de meilleures conditions ?
3. Pouvez-vous nous faire une offre spéciale "partenaire premium" ?

Nous sommes ouverts à un engagement sur plusieurs mois si les conditions sont attractives.

Dans l'attente de votre proposition,

Alexandre Courthieu
Gérant - Weedn
01 42 60 98 74`
  })
};

// Templates support client
const SUPPORT_TEMPLATES = {
  // Problème livraison
  shippingIssue: (data: CustomerSupportRequest) => ({
    subject: `Re: Votre commande Weedn${data.orderId ? ` #${data.orderId}` : ''}`,
    body: `Bonjour${data.customerName ? ` ${data.customerName}` : ''},

Merci de nous avoir contactés concernant votre livraison.

Je comprends votre préoccupation et je m'en excuse sincèrement. Nous prenons ce type de situation très au sérieux.

J'ai immédiatement vérifié le suivi de votre colis et voici ce que j'ai trouvé :
[STATUT À COMPLÉTER]

Actions que nous mettons en place :
- Suivi prioritaire de votre colis
- Contact direct avec le transporteur
- Vous tiendrez informé(e) sous 24h maximum

Si vous avez la moindre question, n'hésitez pas à nous appeler directement au 01 42 60 98 74.

Encore toutes nos excuses pour ce désagrément.

À très vite,

L'équipe Weedn 🌿
4 rue Tiquetonne, Paris 2ème`
  }),

  // Problème produit
  productIssue: (data: CustomerSupportRequest) => ({
    subject: `Re: Votre retour sur nos produits Weedn`,
    body: `Bonjour${data.customerName ? ` ${data.customerName}` : ''},

Merci d'avoir pris le temps de nous faire part de votre retour.

Votre satisfaction est notre priorité absolue et nous prenons très au sérieux chaque commentaire de nos clients.

Pour résoudre cette situation au mieux, nous vous proposons :
- Un échange gratuit du produit concerné
- OU un avoir de [MONTANT]€ sur votre prochaine commande
- OU un remboursement intégral

Quelle option préférez-vous ?

N'hésitez pas à passer en boutique (4 rue Tiquetonne, Paris 2ème) pour en discuter directement avec notre équipe.

Cordialement,

L'équipe Weedn 🌿
Tel: 01 42 60 98 74`
  }),

  // Demande générale
  generalInquiry: (data: CustomerSupportRequest) => ({
    subject: `Re: Votre demande d'information Weedn`,
    body: `Bonjour${data.customerName ? ` ${data.customerName}` : ''},

Merci pour votre message et l'intérêt que vous portez à Weedn !

[RÉPONSE PERSONNALISÉE]

N'hésitez pas si vous avez d'autres questions, nous sommes là pour vous conseiller.

Vous pouvez également nous rendre visite en boutique :
📍 4 rue Tiquetonne, 75002 Paris
📞 01 42 60 98 74
🕐 Du lundi au samedi, 11h-20h

À bientôt chez Weedn ! 🌿

Cordialement,
L'équipe Weedn`
  }),

  // Réclamation / Client mécontent
  complaint: (data: CustomerSupportRequest) => ({
    subject: `Re: Votre réclamation - Priorité haute`,
    body: `Bonjour${data.customerName ? ` ${data.customerName}` : ''},

J'ai bien reçu votre message et je tiens avant tout à vous présenter nos plus sincères excuses pour cette expérience décevante.

Chez Weedn, nous mettons un point d'honneur à satisfaire nos clients et il est clair que nous n'avons pas été à la hauteur de vos attentes dans ce cas précis.

Je prends personnellement en charge votre dossier et voici ce que je vous propose immédiatement :
- [ACTION CORRECTIVE 1]
- [ACTION CORRECTIVE 2]
- Un geste commercial de notre part pour vous remercier de votre patience

Je vous recontacte personnellement d'ici demain pour m'assurer que tout est résolu.

Encore une fois, toutes mes excuses au nom de l'équipe Weedn.

Alexandre Courthieu
Gérant - Weedn
01 42 60 98 74 (ligne directe)`
  }),

  // Suivi positif
  positiveFollowup: (data: CustomerSupportRequest) => ({
    subject: `Merci pour votre confiance ! 🌿`,
    body: `Bonjour${data.customerName ? ` ${data.customerName}` : ''},

Un grand merci pour votre récent achat chez Weedn !

Nous espérons que nos produits vous donnent entière satisfaction. Votre avis compte énormément pour nous.

Si vous avez un moment, nous serions ravis de recevoir votre retour :
- Sur Google : [LIEN]
- Ou simplement en répondant à ce mail

En remerciement, bénéficiez de -10% sur votre prochaine commande avec le code : MERCI10

À très bientôt en boutique ou sur weedn.fr !

L'équipe Weedn 🌿`
  })
};

/**
 * Génère un email pour une commande fournisseur
 */
export function generateSupplierOrderEmail(request: SupplierOrderRequest): EmailDraft {
  // Déterminer le template à utiliser
  let template;
  if (request.urgency === 'high') {
    template = NEGOTIATOR_TEMPLATES.urgentNegotiation(request);
  } else if (request.products.some(p => p.targetPrice && p.lastPrice && p.targetPrice < p.lastPrice)) {
    template = NEGOTIATOR_TEMPLATES.volumeDiscount(request);
  } else if (request.products.some(p => p.lastPrice)) {
    template = NEGOTIATOR_TEMPLATES.recurringOrder(request);
  } else {
    template = NEGOTIATOR_TEMPLATES.firstOrder(request);
  }

  return {
    id: `draft-${Date.now()}`,
    type: 'supplier_order',
    to: [request.supplierEmail],
    subject: template.subject,
    body: template.body,
    status: 'draft',
    agentId: 'agent-negociateur',
    agentName: 'Agent Négociateur',
    context: {
      supplierId: request.supplierId,
      supplierName: request.supplierName,
      products: request.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        priceTarget: p.targetPrice
      })),
      negotiationStrategy: request.urgency === 'high' ? 'urgent' : 'standard'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Génère un email de réponse support client
 */
export function generateCustomerSupportEmail(request: CustomerSupportRequest): EmailDraft {
  let template;

  switch (request.issueType) {
    case 'shipping':
      template = SUPPORT_TEMPLATES.shippingIssue(request);
      break;
    case 'product':
      template = SUPPORT_TEMPLATES.productIssue(request);
      break;
    case 'complaint':
      template = SUPPORT_TEMPLATES.complaint(request);
      break;
    case 'general':
    default:
      template = request.sentiment === 'positive'
        ? SUPPORT_TEMPLATES.positiveFollowup(request)
        : SUPPORT_TEMPLATES.generalInquiry(request);
  }

  return {
    id: `draft-${Date.now()}`,
    type: 'customer_support',
    to: [request.customerEmail],
    subject: template.subject,
    body: template.body,
    status: 'draft',
    agentId: 'agent-support',
    agentName: 'Agent Support',
    context: {
      customerName: request.customerName,
      orderId: request.orderId
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Améliore un email avec des techniques de négociation
 */
export function enhanceNegotiation(draft: EmailDraft, strategy: 'aggressive' | 'friendly' | 'volume'): EmailDraft {
  let enhancedBody = draft.body;

  if (strategy === 'aggressive') {
    // Ajouter des éléments de pression
    enhancedBody = enhancedBody.replace(
      /Cordialement,/,
      `PS: Nous avons également reçu des propositions de concurrents mais nous préférerions continuer à travailler avec vous si les conditions sont compétitives.\n\nCordialement,`
    );
  } else if (strategy === 'friendly') {
    // Renforcer la relation
    enhancedBody = enhancedBody.replace(
      /Bonjour,/,
      `Bonjour,\n\nJ'espère que vous allez bien !`
    );
  } else if (strategy === 'volume') {
    // Insister sur le volume
    enhancedBody = enhancedBody.replace(
      /Cordialement,/,
      `Nous prévoyons d'augmenter significativement nos volumes dans les prochains mois. Une remise maintenant pourrait être le début d'un partenariat très profitable pour nous deux.\n\nCordialement,`
    );
  }

  return {
    ...draft,
    body: enhancedBody,
    context: {
      ...draft.context,
      negotiationStrategy: strategy
    },
    updatedAt: new Date().toISOString()
  };
}

// Storage key
const EMAIL_DRAFTS_STORAGE_KEY = 'weedn-email-drafts';

/**
 * Sauvegarde un brouillon
 */
export function saveDraft(draft: EmailDraft): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(EMAIL_DRAFTS_STORAGE_KEY);
  const drafts: EmailDraft[] = stored ? JSON.parse(stored) : [];

  const existingIndex = drafts.findIndex(d => d.id === draft.id);
  if (existingIndex >= 0) {
    drafts[existingIndex] = draft;
  } else {
    drafts.push(draft);
  }

  localStorage.setItem(EMAIL_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Récupère tous les brouillons
 */
export function getDrafts(): EmailDraft[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(EMAIL_DRAFTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Supprime un brouillon
 */
export function deleteDraft(id: string): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(EMAIL_DRAFTS_STORAGE_KEY);
  const drafts: EmailDraft[] = stored ? JSON.parse(stored) : [];

  const filtered = drafts.filter(d => d.id !== id);
  localStorage.setItem(EMAIL_DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Marque un email comme envoyé
 */
export function markAsSent(id: string): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(EMAIL_DRAFTS_STORAGE_KEY);
  const drafts: EmailDraft[] = stored ? JSON.parse(stored) : [];

  const draft = drafts.find(d => d.id === id);
  if (draft) {
    draft.status = 'sent';
    draft.sentAt = new Date().toISOString();
    localStorage.setItem(EMAIL_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }
}
