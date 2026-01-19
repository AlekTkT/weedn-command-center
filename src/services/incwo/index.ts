// Service Incwo - Boutique Physique
// Gère les données de la caisse du magasin 4 Rue Tiquetonne 75002 Paris
// Documentation API: https://www.incwo.com/site/developer

import { getIncwoConfig } from '@/config';

// ===== TYPES =====

export interface IncwoSale {
  id: string;
  date: string;
  total: number;
  items: {
    product: string;
    quantity: number;
    price: number;
  }[];
  paymentMethod: string;
}

export interface IncwoInvoiceItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  totalTTC: number;
  vatRate: number;
}

export interface IncwoInvoice {
  id: number;
  reference: string;
  date: string;
  total: number;
  totalHT: number;
  totalTVA: number;
  items?: IncwoInvoiceItem[];
  customerName?: string;
  paymentMethod?: string;
}

export interface IncwoDailyHistory {
  date: string;
  dateFormatted: string;
  dayName: string;
  revenue: number;
  transactions: number;
  avgTicket: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface IncwoCashDeposit {
  id: number;
  date: string;
  amount: number;
  paymentType: string;
  reference?: string;
  bankAccount?: string;
}

export interface IncwoProduct {
  id?: number;
  name: string;
  reference?: string;
  description?: string;
  price: number; // Prix HT
  priceTTC?: number; // Prix TTC (calculé)
  vatRate: number; // Taux TVA (20, 10, 5.5, 2.1)
  vatId?: number; // ID TVA Incwo
  categoryId?: number;
  categoryName?: string;
  unit?: string;
  barcode?: string;
  isActive?: boolean;
}

export interface IncwoProductCategory {
  id: number;
  name: string;
}

// Mapping des taux de TVA vers les IDs Incwo (à ajuster selon votre compte)
export const VAT_RATES: Record<number, { id: number; label: string }> = {
  20: { id: 1, label: 'TVA 20%' },
  10: { id: 2, label: 'TVA 10%' },
  5.5: { id: 3, label: 'TVA 5.5%' },
  2.1: { id: 4, label: 'TVA 2.1%' },
  0: { id: 5, label: 'Exonéré' },
};

export interface IncwoMetrics {
  today: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  yesterday: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  lastWeekSameDay: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  week: {
    sales: number;
    revenue: number;
    transactions: number;
  };
  month: {
    sales: number;
    revenue: number;
    transactions: number;
  };
}

export interface IncwoConfig {
  baseUrl: string;
  accountId: string;
  apiUser: string;
  apiPassword: string;
  email: string;
  address: string;
  phone: string;
}

// ===== CONFIGURATION =====

export function getConfig(): IncwoConfig {
  const config = getIncwoConfig();
  return {
    baseUrl: process.env.INCWO_API_URL || config?.baseUrl || 'https://www.incwo.com/1047111',
    accountId: process.env.INCWO_ACCOUNT_ID || config?.accountId || '1047111',
    apiUser: process.env.INCWO_API_USER || '',
    apiPassword: process.env.INCWO_API_PASSWORD || '',
    email: config?.email || 'cbdoshop75@gmail.com',
    address: config?.address || '4 Rue Tiquetonne, 75002 Paris',
    phone: config?.phone || '01 42 60 98 74',
  };
}

// ===== HELPERS =====

// Format date pour Incwo API: DD-MM-YYYY
function formatIncwoDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper: Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Générer une référence unique
function generateReference(): string {
  const now = new Date();
  const prefix = 'WDN';
  const timestamp = now.getTime().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

// Parse le XML Incwo pour extraire les bill_sheets
function parseBillSheets(xml: string): IncwoInvoice[] {
  const invoices: IncwoInvoice[] = [];

  // Split by bill_sheet tags
  const billSheetMatches = xml.match(/<bill_sheet>[\s\S]*?<\/bill_sheet>/g);
  if (!billSheetMatches) return invoices;

  for (const billXml of billSheetMatches) {
    const getValue = (tag: string): string => {
      const match = billXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1] : '';
    };

    const invoice: IncwoInvoice = {
      id: parseInt(getValue('id')) || 0,
      reference: getValue('reference'),
      date: getValue('billing_date'),
      total: parseFloat(getValue('vat_inc_total')) || 0,
      totalHT: parseFloat(getValue('vat_exl_total')) || 0,
      totalTVA: parseFloat(getValue('vat_cost')) || 0,
    };

    invoices.push(invoice);
  }

  return invoices;
}

// ===== API CLIENT =====

class IncwoAPI {
  private baseUrl: string;
  private auth: string;
  private configured: boolean;

  constructor() {
    const config = getConfig();
    this.baseUrl = `https://www.incwo.com/${config.accountId}`;
    this.auth = Buffer.from(`${config.apiUser}:${config.apiPassword}`).toString('base64');
    this.configured = Boolean(config.apiUser && config.apiPassword);
  }

  isConfigured(): boolean {
    return this.configured;
  }

  // Reconfigure l'instance (utile après changement d'env vars)
  reconfigure(): void {
    const config = getConfig();
    this.baseUrl = `https://www.incwo.com/${config.accountId}`;
    this.auth = Buffer.from(`${config.apiUser}:${config.apiPassword}`).toString('base64');
    this.configured = Boolean(config.apiUser && config.apiPassword);
  }

  private async request(endpoint: string): Promise<string | null> {
    if (!this.configured) {
      console.warn('Incwo API non configurée. Ajoute INCWO_API_USER et INCWO_API_PASSWORD dans .env');
      return null;
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Incwo API: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        console.error(`Incwo API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error('Incwo API request failed:', error);
      return null;
    }
  }

  // POST request pour créer des objets
  async postRequest(endpoint: string, xmlBody: string): Promise<{ success: boolean; data?: string; error?: string }> {
    if (!this.configured) {
      return { success: false, error: 'Incwo API non configurée' };
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Incwo API: POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
        },
        body: xmlBody,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Incwo API POST error: ${response.status}`, responseText);
        return { success: false, error: `Erreur ${response.status}: ${responseText}` };
      }

      return { success: true, data: responseText };
    } catch (error) {
      console.error('Incwo API POST failed:', error);
      return { success: false, error: String(error) };
    }
  }

  // Récupérer les catégories de produits
  async getProductCategories(): Promise<IncwoProductCategory[]> {
    const xml = await this.request('/product_categories.xml');
    if (!xml) return [];

    const categories: IncwoProductCategory[] = [];
    const categoryMatches = xml.match(/<product_category>[\s\S]*?<\/product_category>/g);
    if (!categoryMatches) return categories;

    for (const catXml of categoryMatches) {
      const getValue = (tag: string): string => {
        const match = catXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
      };

      categories.push({
        id: parseInt(getValue('id')) || 0,
        name: getValue('name') || 'Sans nom',
      });
    }

    return categories;
  }

  // Récupérer les produits existants
  async getProducts(): Promise<IncwoProduct[]> {
    const xml = await this.request('/customer_products.xml?per_page=250');
    if (!xml) return [];

    const products: IncwoProduct[] = [];
    const productMatches = xml.match(/<customer_product>[\s\S]*?<\/customer_product>/g);
    if (!productMatches) return products;

    for (const prodXml of productMatches) {
      const getValue = (tag: string): string => {
        const match = prodXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
      };

      const priceHT = parseFloat(getValue('price')) || 0;
      const vatRate = parseFloat(getValue('vat_rate')) || 20;

      products.push({
        id: parseInt(getValue('id')) || 0,
        name: getValue('name') || 'Produit',
        reference: getValue('reference'),
        description: getValue('description'),
        price: priceHT,
        priceTTC: Math.round(priceHT * (1 + vatRate / 100) * 100) / 100,
        vatRate,
        categoryId: parseInt(getValue('product_category_id')) || undefined,
        unit: getValue('unit'),
        barcode: getValue('barcode'),
        isActive: getValue('archived') !== '1',
      });
    }

    return products;
  }

  // Créer un nouveau produit
  async createProduct(product: IncwoProduct): Promise<{ success: boolean; productId?: number; error?: string }> {
    // Calculer le prix HT depuis le TTC si fourni
    const priceHT = product.priceTTC
      ? Math.round((product.priceTTC / (1 + product.vatRate / 100)) * 100) / 100
      : product.price;

    // Trouver l'ID TVA correspondant
    const vatInfo = VAT_RATES[product.vatRate] || VAT_RATES[20];

    // Construire le XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<customer_product>
  <name>${escapeXml(product.name)}</name>
  <reference>${escapeXml(product.reference || generateReference())}</reference>
  <description>${escapeXml(product.description || '')}</description>
  <price>${priceHT}</price>
  <vat_id>${vatInfo.id}</vat_id>
  <is_from_vendor>0</is_from_vendor>
  <type_of_product_id>1</type_of_product_id>
  <activity_classification_choice>commerce</activity_classification_choice>
  ${product.categoryId ? `<product_category_id>${product.categoryId}</product_category_id>` : ''}
  ${product.unit ? `<unit>${escapeXml(product.unit)}</unit>` : '<unit>unité</unit>'}
  ${product.barcode ? `<barcode>${escapeXml(product.barcode)}</barcode>` : ''}
</customer_product>`;

    const result = await this.postRequest('/customer_products.xml', xml);

    if (result.success && result.data) {
      // Extraire l'ID du produit créé
      const idMatch = result.data.match(/<id>(\d+)<\/id>/);
      const productId = idMatch ? parseInt(idMatch[1]) : undefined;
      return { success: true, productId };
    }

    return { success: false, error: result.error };
  }

  // Récupérer les factures/tickets de caisse
  async getInvoices(filters?: { dateFrom?: string; dateTo?: string }): Promise<IncwoInvoice[]> {
    let endpoint = '/bill_sheets.xml?per_page=250';

    // Ajouter les filtres de date si présents
    if (filters?.dateFrom || filters?.dateTo) {
      const ufilters: any = { billing_date: {} };
      if (filters.dateFrom) ufilters.billing_date.date_gte = filters.dateFrom;
      if (filters.dateTo) ufilters.billing_date.date_lte = filters.dateTo;
      endpoint += `&ufilters=${encodeURIComponent(JSON.stringify(ufilters))}`;
    }

    const xml = await this.request(endpoint);
    if (!xml) return [];

    return parseBillSheets(xml);
  }

  // Récupérer les factures pour une date spécifique (DD-MM-YYYY format)
  async getInvoicesForDate(date: string): Promise<IncwoInvoice[]> {
    const allInvoices = await this.getInvoices();
    return allInvoices.filter(inv => inv.date === date);
  }
}

// Créer une nouvelle instance à chaque appel pour s'assurer d'avoir les env vars
// (Vercel serverless peut avoir des cold starts où les env vars changent)
function getAPI(): IncwoAPI {
  return new IncwoAPI();
}

// ===== FONCTIONS PUBLIQUES =====

export function formatIncwoContext(): string {
  const config = getConfig();
  const api = getAPI();
  const isConfigured = api.isConfigured();

  return `## DONNÉES INCWO (Boutique Physique)

### Configuration:
- Adresse: ${config.address}
- Téléphone: ${config.phone}
- Compte: ${config.accountId}
- Dashboard: ${config.baseUrl}
- API: ${isConfigured ? '✅ Configurée' : '❌ Non configurée'}

### Note:
Les données Incwo représentent les ventes EN MAGASIN.
CA Total Weedn = CA Shopify (web) + CA Incwo (boutique)`;
}

// Récupérer les métriques depuis l'API
export async function getIncwoMetrics(): Promise<IncwoMetrics> {
  const api = getAPI();

  // Valeurs par défaut si API non configurée
  const emptyMetrics = {
    today: { sales: 0, revenue: 0, transactions: 0 },
    yesterday: { sales: 0, revenue: 0, transactions: 0 },
    lastWeekSameDay: { sales: 0, revenue: 0, transactions: 0 },
    week: { sales: 0, revenue: 0, transactions: 0 },
    month: { sales: 0, revenue: 0, transactions: 0 },
  };

  if (!api.isConfigured()) {
    console.log('Incwo API non configurée - retour de données vides');
    return emptyMetrics;
  }

  // Dates au format Incwo (DD-MM-YYYY)
  const now = new Date();
  const today = formatIncwoDate(now);
  const yesterday = formatIncwoDate(new Date(now.getTime() - 86400000));
  const lastWeekSameDay = formatIncwoDate(new Date(now.getTime() - 7 * 86400000)); // J-7
  const weekAgo = formatIncwoDate(new Date(now.getTime() - 7 * 86400000));
  const monthAgo = formatIncwoDate(new Date(now.getTime() - 30 * 86400000));

  try {
    // Récupérer toutes les factures récentes (30 jours)
    const allInvoices = await api.getInvoices();

    // Filtrer par date côté client (plus fiable que le filtre API)
    const todayInvoices = allInvoices.filter(inv => inv.date === today);
    const yesterdayInvoices = allInvoices.filter(inv => inv.date === yesterday);
    const lastWeekSameDayInvoices = allInvoices.filter(inv => inv.date === lastWeekSameDay);

    // Pour la semaine et le mois, on compare les dates
    const parseIncwoDate = (d: string) => {
      const [day, month, year] = d.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const weekAgoDate = new Date(now.getTime() - 7 * 86400000);
    const monthAgoDate = new Date(now.getTime() - 30 * 86400000);

    const weekInvoices = allInvoices.filter(inv => {
      const invDate = parseIncwoDate(inv.date);
      return invDate >= weekAgoDate;
    });

    const monthInvoices = allInvoices.filter(inv => {
      const invDate = parseIncwoDate(inv.date);
      return invDate >= monthAgoDate;
    });

    const calcMetrics = (invoices: IncwoInvoice[]) => ({
      sales: invoices.length,
      revenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      transactions: invoices.length,
    });

    return {
      today: calcMetrics(todayInvoices),
      yesterday: calcMetrics(yesterdayInvoices),
      lastWeekSameDay: calcMetrics(lastWeekSameDayInvoices),
      week: calcMetrics(weekInvoices),
      month: calcMetrics(monthInvoices),
    };
  } catch (error) {
    console.error('Erreur récupération métriques Incwo:', error);
    return emptyMetrics;
  }
}

// Récupérer les ventes du jour
export async function getTodaySales(): Promise<IncwoInvoice[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];

  const today = formatIncwoDate(new Date());
  return api.getInvoicesForDate(today);
}

// Récupérer les dépôts de caisse du jour
export async function getTodayCashDeposits(): Promise<IncwoCashDeposit[]> {
  // Non implémenté pour l'instant - les ventes suffisent
  return [];
}

// Sync avec Supabase (pour le dashboard)
export async function syncToSupabase(): Promise<{ synced: number; errors: number }> {
  const todayInvoices = await getTodaySales();

  let synced = 0;
  let errors = 0;

  for (const invoice of todayInvoices) {
    try {
      const response = await fetch('/api/store-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: invoice.total,
          subtotal: invoice.totalHT,
          tax: invoice.totalTVA,
          items_count: 1,
          payment_method: 'CB',
          incwo_receipt_id: invoice.id.toString(),
          created_by: 'incwo_sync',
        }),
      });

      if (response.ok) synced++;
      else errors++;
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}

// Récupérer les lignes d'une facture (produits vendus)
export async function getInvoiceItems(invoiceId: number): Promise<IncwoInvoiceItem[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];

  try {
    // Appel API pour récupérer les lignes de la facture
    const xml = await (api as any).request(`/bill_sheets/${invoiceId}/bill_sheet_lines.xml`);
    if (!xml) return [];

    const items: IncwoInvoiceItem[] = [];
    const lineMatches = xml.match(/<bill_sheet_line>[\s\S]*?<\/bill_sheet_line>/g);
    if (!lineMatches) return items;

    for (const lineXml of lineMatches) {
      const getValue = (tag: string): string => {
        const match = lineXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
      };

      items.push({
        id: parseInt(getValue('id')) || 0,
        productName: getValue('description') || getValue('title') || 'Produit',
        quantity: parseFloat(getValue('quantity')) || 1,
        unitPrice: parseFloat(getValue('unit_price')) || 0,
        totalHT: parseFloat(getValue('vat_exl_total')) || 0,
        totalTTC: parseFloat(getValue('vat_inc_total')) || 0,
        vatRate: parseFloat(getValue('vat_rate')) || 20,
      });
    }

    return items;
  } catch (error) {
    console.error('Erreur récupération lignes facture:', error);
    return [];
  }
}

// Récupérer l'historique des ventes par jour (30 derniers jours)
export async function getDailyHistory(days: number = 30): Promise<IncwoDailyHistory[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];

  try {
    const allInvoices = await api.getInvoices();
    const now = new Date();
    const history: Map<string, IncwoDailyHistory> = new Map();

    // Initialiser les X derniers jours
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 86400000);
      const dateKey = formatIncwoDate(date);
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

      history.set(dateKey, {
        date: dateKey,
        dateFormatted: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        dayName: dayNames[date.getDay()],
        revenue: 0,
        transactions: 0,
        avgTicket: 0,
        topProducts: [],
      });
    }

    // Agréger les factures par jour
    for (const invoice of allInvoices) {
      const dayData = history.get(invoice.date);
      if (dayData) {
        dayData.revenue += invoice.total || 0;
        dayData.transactions += 1;
      }
    }

    // Calculer les moyennes
    history.forEach((dayData) => {
      if (dayData.transactions > 0) {
        dayData.avgTicket = Math.round(dayData.revenue / dayData.transactions);
      }
    });

    // Convertir en array et trier par date (plus récent en premier)
    return Array.from(history.values()).sort((a, b) => {
      const parseDate = (d: string) => {
        const [day, month, year] = d.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      };
      return parseDate(b.date) - parseDate(a.date);
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    return [];
  }
}

// Récupérer les produits les plus vendus (top sellers)
export async function getTopProducts(days: number = 30): Promise<{ name: string; quantity: number; revenue: number }[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];

  try {
    const allInvoices = await api.getInvoices();
    const productStats: Map<string, { quantity: number; revenue: number }> = new Map();

    // Pour chaque facture récente, récupérer les lignes
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 86400000);

    const parseIncwoDate = (d: string) => {
      const [day, month, year] = d.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const recentInvoices = allInvoices.filter(inv => parseIncwoDate(inv.date) >= cutoffDate);

    // Récupérer les lignes pour les 20 premières factures (limitation API)
    for (const invoice of recentInvoices.slice(0, 20)) {
      const items = await getInvoiceItems(invoice.id);
      for (const item of items) {
        const current = productStats.get(item.productName) || { quantity: 0, revenue: 0 };
        productStats.set(item.productName, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.totalTTC,
        });
      }
    }

    // Trier par quantité vendue
    return Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  } catch (error) {
    console.error('Erreur récupération top produits:', error);
    return [];
  }
}

// ===== FONCTIONS PRODUITS =====

// Récupérer les catégories de produits
export async function getProductCategories(): Promise<IncwoProductCategory[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];
  return api.getProductCategories();
}

// Récupérer tous les produits Incwo
export async function getIncwoProducts(): Promise<IncwoProduct[]> {
  const api = getAPI();
  if (!api.isConfigured()) return [];
  return api.getProducts();
}

// Créer un nouveau produit
export async function createProduct(product: IncwoProduct): Promise<{ success: boolean; productId?: number; error?: string }> {
  const api = getAPI();
  if (!api.isConfigured()) {
    return { success: false, error: 'API Incwo non configurée' };
  }
  return api.createProduct(product);
}

// Export API client pour usage avancé
export { getAPI, formatIncwoDate };

export default {
  getConfig,
  formatIncwoContext,
  getIncwoMetrics,
  getTodaySales,
  getTodayCashDeposits,
  syncToSupabase,
  getInvoiceItems,
  getDailyHistory,
  getTopProducts,
  getProductCategories,
  getIncwoProducts,
  createProduct,
  getAPI,
  VAT_RATES,
};
