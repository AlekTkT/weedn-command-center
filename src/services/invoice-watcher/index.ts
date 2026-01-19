/**
 * Service de Veille Factures Fournisseurs
 * Scanne Gmail pour identifier et extraire les factures destinées à RETAR DIO
 *
 * Emails surveillés:
 * - cbdoshop75@gmail.com
 * - theonlyweedn@gmail.com
 *
 * Critères de détection facture fournisseur:
 * - PDF en pièce jointe
 * - Destinataire contenant: "RETAR DIO", "Alexandre Courthieu", "4 rue Tiquetonne"
 */

export interface DetectedSupplier {
  id: string;
  name: string;
  email: string;
  domain: string;
  category: 'CBD' | 'Packaging' | 'Services' | 'Logistique' | 'Marketing' | 'Autre';
  invoiceCount: number;
  lastInvoiceDate: string;
  totalAmount?: number;
  contacts: {
    name?: string;
    email: string;
    phone?: string;
  }[];
  products?: string[];
  notes?: string;
}

export interface InvoiceRecord {
  id: string;
  emailId: string;
  supplier: string;
  supplierEmail: string;
  date: string;
  subject: string;
  amount?: number;
  currency: string;
  attachmentName?: string;
  status: 'detected' | 'processed' | 'archived';
  extractedData?: {
    invoiceNumber?: string;
    dueDate?: string;
    items?: string[];
  };
}

// Patterns pour détecter les factures destinées à Weedn
const WEEDN_PATTERNS = [
  /RETAR\s*DIO/i,
  /Alexandre\s*Courthieu/i,
  /4\s*rue\s*Tiquetonne/i,
  /75002\s*Paris/i,
  /SASU\s*RETAR/i,
  /CBDO\s*SHOP/i,
  /WEEDN/i,
];

// Catégories de fournisseurs par mots-clés
const SUPPLIER_CATEGORIES: Record<string, { keywords: string[]; category: DetectedSupplier['category'] }> = {
  cbd: {
    keywords: ['cbd', 'cannabidiol', 'hemp', 'chanvre', 'fleur', 'resine', 'huile cbd', 'terpene'],
    category: 'CBD',
  },
  packaging: {
    keywords: ['packaging', 'emballage', 'boite', 'sachet', 'etiquette', 'imprimerie', 'papeo'],
    category: 'Packaging',
  },
  logistique: {
    keywords: ['colissimo', 'chronopost', 'mondial relay', 'ups', 'fedex', 'livraison', 'transport'],
    category: 'Logistique',
  },
  marketing: {
    keywords: ['marketing', 'pub', 'ads', 'seo', 'agence', 'communication', 'design'],
    category: 'Marketing',
  },
  services: {
    keywords: ['shopify', 'klaviyo', 'sumup', 'stripe', 'abonnement', 'saas', 'software', 'legal'],
    category: 'Services',
  },
};

// Fournisseurs CBD connus
const KNOWN_CBD_SUPPLIERS: Record<string, Partial<DetectedSupplier>> = {
  'cbdethic': {
    name: 'CBD ETHIC',
    category: 'CBD',
    notes: 'Grossiste CBD France',
  },
  'caliterpenes': {
    name: 'Cali Terpenes',
    category: 'CBD',
    notes: 'Fournisseur terpènes',
  },
  'thenewways': {
    name: 'The New Ways',
    category: 'CBD',
    notes: 'Fournisseur CBD',
  },
  'canaturawholesale': {
    name: 'Canatura Wholesale',
    category: 'CBD',
    notes: 'Grossiste CBD',
  },
  'honeykinglab': {
    name: 'HONEY KING LAB',
    category: 'CBD',
    notes: 'Contact via WhatsApp "La fine équipe"',
  },
};

/**
 * Extrait le domaine d'une adresse email
 */
function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Détecte la catégorie d'un fournisseur
 */
function detectCategory(email: string, subject: string, content?: string): DetectedSupplier['category'] {
  const searchText = `${email} ${subject} ${content || ''}`.toLowerCase();

  for (const [, config] of Object.entries(SUPPLIER_CATEGORIES)) {
    if (config.keywords.some(kw => searchText.includes(kw))) {
      return config.category;
    }
  }

  return 'Autre';
}

/**
 * Vérifie si un email contient une facture pour RETAR DIO
 */
function isWeednInvoice(subject: string, content?: string): boolean {
  const searchText = `${subject} ${content || ''}`;
  return WEEDN_PATTERNS.some(pattern => pattern.test(searchText));
}

/**
 * Extrait les informations d'un fournisseur depuis un email
 */
export function extractSupplierFromEmail(email: {
  id: string;
  from: string;
  subject: string;
  date: string;
  body?: string;
}): { supplier: Partial<DetectedSupplier>; invoice: Partial<InvoiceRecord> } | null {
  const domain = extractDomain(email.from);

  // Vérifier si c'est un fournisseur connu
  let knownSupplier: Partial<DetectedSupplier> | undefined;
  for (const [key, supplier] of Object.entries(KNOWN_CBD_SUPPLIERS)) {
    if (domain.includes(key) || email.from.toLowerCase().includes(key)) {
      knownSupplier = supplier;
      break;
    }
  }

  // Extraire le nom depuis l'adresse email
  const nameMatch = email.from.match(/^([^<]+)</);
  const extractedName = nameMatch ? nameMatch[1].trim() : domain.split('.')[0];

  const supplier: Partial<DetectedSupplier> = {
    name: knownSupplier?.name || extractedName,
    email: email.from,
    domain,
    category: knownSupplier?.category || detectCategory(email.from, email.subject, email.body),
    lastInvoiceDate: email.date,
    contacts: [{
      email: email.from,
    }],
    notes: knownSupplier?.notes,
  };

  const invoice: Partial<InvoiceRecord> = {
    emailId: email.id,
    supplier: supplier.name,
    supplierEmail: email.from,
    date: email.date,
    subject: email.subject,
    currency: 'EUR',
    status: 'detected',
  };

  // Essayer d'extraire le montant du sujet
  const amountMatch = email.subject.match(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/);
  if (amountMatch) {
    invoice.amount = parseFloat((amountMatch[1] || amountMatch[2]).replace(',', '.'));
  }

  return { supplier, invoice };
}

/**
 * Requête Gmail pour trouver les factures fournisseurs
 */
export function buildGmailQuery(options?: { daysBack?: number }): string {
  const daysBack = options?.daysBack || 90;
  const dateAfter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '/');

  // Requête Gmail pour trouver les factures
  const queries = [
    `has:attachment filename:pdf`,
    `(facture OR invoice OR commande OR order)`,
    `-from:shopify -from:klaviyo -from:sumup -from:stripe`, // Exclure les services
    `after:${dateAfter}`,
  ];

  return queries.join(' ');
}

/**
 * Filtrer les emails qui sont des factures pour RETAR DIO
 */
export function filterWeednInvoices(emails: Array<{
  id: string;
  from: string;
  subject: string;
  date: string;
  body?: string;
}>): Array<{
  supplier: Partial<DetectedSupplier>;
  invoice: Partial<InvoiceRecord>;
}> {
  const results: Array<{
    supplier: Partial<DetectedSupplier>;
    invoice: Partial<InvoiceRecord>;
  }> = [];

  for (const email of emails) {
    // Vérifier si c'est potentiellement une facture fournisseur CBD
    const isCBDSupplier = Object.keys(KNOWN_CBD_SUPPLIERS).some(key =>
      email.from.toLowerCase().includes(key) ||
      email.subject.toLowerCase().includes(key)
    );

    // Vérifier si c'est une facture pour RETAR DIO
    const isForWeedn = isWeednInvoice(email.subject, email.body);

    // Vérifier si ça ressemble à une facture/commande
    const isInvoiceLike = /facture|invoice|commande|order|receipt|bill/i.test(email.subject);

    if (isCBDSupplier || isForWeedn || isInvoiceLike) {
      const extracted = extractSupplierFromEmail(email);
      if (extracted) {
        results.push(extracted);
      }
    }
  }

  return results;
}

/**
 * Consolider les fournisseurs depuis plusieurs factures
 */
export function consolidateSuppliers(
  invoices: Array<{ supplier: Partial<DetectedSupplier>; invoice: Partial<InvoiceRecord> }>
): DetectedSupplier[] {
  const suppliersMap = new Map<string, DetectedSupplier>();

  for (const { supplier, invoice } of invoices) {
    const key = supplier.domain || supplier.email || 'unknown';

    if (suppliersMap.has(key)) {
      const existing = suppliersMap.get(key)!;
      existing.invoiceCount++;
      if (invoice.amount) {
        existing.totalAmount = (existing.totalAmount || 0) + invoice.amount;
      }
      if (invoice.date && invoice.date > existing.lastInvoiceDate) {
        existing.lastInvoiceDate = invoice.date;
      }
    } else {
      suppliersMap.set(key, {
        id: `supplier-${key.replace(/[^a-z0-9]/gi, '-')}`,
        name: supplier.name || key,
        email: supplier.email || '',
        domain: supplier.domain || '',
        category: supplier.category || 'Autre',
        invoiceCount: 1,
        lastInvoiceDate: invoice.date || new Date().toISOString(),
        totalAmount: invoice.amount,
        contacts: supplier.contacts || [],
        notes: supplier.notes,
      });
    }
  }

  return Array.from(suppliersMap.values()).sort((a, b) =>
    new Date(b.lastInvoiceDate).getTime() - new Date(a.lastInvoiceDate).getTime()
  );
}

export default {
  extractSupplierFromEmail,
  buildGmailQuery,
  filterWeednInvoices,
  consolidateSuppliers,
  isWeednInvoice,
  KNOWN_CBD_SUPPLIERS,
  WEEDN_PATTERNS,
};
