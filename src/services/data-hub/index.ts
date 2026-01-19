/**
 * Data Hub - Service de centralisation des données Weedn
 * Relie fournisseurs, factures, colis et emails
 */

// Keys de stockage localStorage
export const STORAGE_KEYS = {
  SUPPLIERS: 'weedn-suppliers',
  INVOICES: 'weedn-invoices',
  SHIPMENTS: 'weedn-shipments',
  EMAIL_DRAFTS: 'weedn-email-drafts',
  HISTORY: 'weedn-prompt-history',
} as const;

// Types centralisés
export interface Supplier {
  id: string;
  name: string;
  legalName: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  contact: {
    name: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
  };
  website: string;
  siret: string;
  paymentTerms: string;
  minOrderAmount: number | null;
  deliveryTime: string;
  notes: string;
  featuredProducts: FeaturedProduct[];
  categories: string[];
  rating: number | null;
}

export interface FeaturedProduct {
  name: string;
  category: string;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  margin: string;
  minQuantity: number;
  inStock: boolean;
  quality: string;
  thcLevel: string;
  cbdLevel: string;
  notes: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  supplierId: string;
  supplierName: string;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  items: InvoiceItem[];
  source: 'gmail' | 'incwo' | 'manual' | 'whatsapp';
  attachmentUrl?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: 'colissimo' | 'chronopost' | 'dpd' | 'ups' | 'fedex' | 'other';
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  supplierId?: string;
  supplierName?: string;
  origin?: string;
  destination: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  weight?: string;
  description?: string;
  events: TrackingEvent[];
  emailSource?: string;
  emailDate?: string;
  invoiceId?: string; // Lien vers facture associée
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

export interface EmailDraft {
  id: string;
  type: 'supplier_order' | 'supplier_negotiation' | 'customer_support' | 'customer_followup' | 'marketing';
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed';
  agentId: string;
  agentName: string;
  supplierId?: string;  // Lien vers fournisseur si applicable
  invoiceId?: string;   // Lien vers facture si applicable
  shipmentId?: string;  // Lien vers colis si applicable
  context?: any;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

// Relations entre entités
export interface SupplierRelations {
  supplier: Supplier;
  invoices: Invoice[];
  shipments: Shipment[];
  emails: EmailDraft[];
  totalSpent: number;
  pendingAmount: number;
  lastOrderDate?: string;
}

/**
 * DataHub - Singleton pour centraliser l'accès aux données
 */
class DataHub {
  private static instance: DataHub;

  private constructor() {}

  static getInstance(): DataHub {
    if (!DataHub.instance) {
      DataHub.instance = new DataHub();
    }
    return DataHub.instance;
  }

  // === SUPPLIERS ===
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        return data.suppliers || [];
      }
    } catch (e) {
      console.error('DataHub: Erreur chargement fournisseurs', e);
    }
    return [];
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const suppliers = await this.getSuppliers();
    return suppliers.find(s => s.id === id) || null;
  }

  async getSupplierByName(name: string): Promise<Supplier | null> {
    const suppliers = await this.getSuppliers();
    return suppliers.find(s =>
      s.name.toLowerCase() === name.toLowerCase() ||
      s.legalName.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  // === INVOICES ===
  getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return stored ? JSON.parse(stored) : [];
  }

  saveInvoices(invoices: Invoice[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    }
  }

  getInvoicesBySupplier(supplierId: string): Invoice[] {
    return this.getInvoices().filter(inv => inv.supplierId === supplierId);
  }

  // === SHIPMENTS ===
  getShipments(): Shipment[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
    return stored ? JSON.parse(stored) : [];
  }

  saveShipments(shipments: Shipment[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    }
  }

  getShipmentsBySupplier(supplierId: string): Shipment[] {
    return this.getShipments().filter(s => s.supplierId === supplierId);
  }

  // === EMAIL DRAFTS ===
  getEmailDrafts(): EmailDraft[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.EMAIL_DRAFTS);
    return stored ? JSON.parse(stored) : [];
  }

  saveEmailDrafts(drafts: EmailDraft[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EMAIL_DRAFTS, JSON.stringify(drafts));
    }
  }

  getEmailsBySupplier(supplierId: string): EmailDraft[] {
    return this.getEmailDrafts().filter(e => e.supplierId === supplierId);
  }

  // === RELATIONS ===
  async getSupplierWithRelations(supplierId: string): Promise<SupplierRelations | null> {
    const supplier = await this.getSupplierById(supplierId);
    if (!supplier) return null;

    const invoices = this.getInvoicesBySupplier(supplierId);
    const shipments = this.getShipmentsBySupplier(supplierId);
    const emails = this.getEmailsBySupplier(supplierId);

    const totalSpent = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const pendingAmount = invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const lastOrderDate = paidInvoices.length > 0
      ? paidInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : undefined;

    return {
      supplier,
      invoices,
      shipments,
      emails,
      totalSpent,
      pendingAmount,
      lastOrderDate,
    };
  }

  // === LINKING ===

  /**
   * Lie automatiquement un colis à un fournisseur basé sur le nom
   */
  async linkShipmentToSupplier(shipment: Shipment): Promise<Shipment> {
    if (shipment.supplierId) return shipment; // Déjà lié

    // Essayer de trouver le fournisseur par le nom
    if (shipment.supplierName) {
      const supplier = await this.getSupplierByName(shipment.supplierName);
      if (supplier) {
        return { ...shipment, supplierId: supplier.id };
      }
    }

    // Essayer de trouver par l'origine ou la description
    const suppliers = await this.getSuppliers();
    for (const supplier of suppliers) {
      const searchTerms = [
        supplier.name.toLowerCase(),
        supplier.legalName.toLowerCase(),
        ...(supplier.contact.address?.toLowerCase().split(' ') || [])
      ];

      const shipmentText = `${shipment.origin || ''} ${shipment.description || ''}`.toLowerCase();

      if (searchTerms.some(term => term && shipmentText.includes(term))) {
        return {
          ...shipment,
          supplierId: supplier.id,
          supplierName: supplier.name
        };
      }
    }

    return shipment;
  }

  /**
   * Lie une facture à un fournisseur basé sur le nom
   */
  async linkInvoiceToSupplier(invoice: Invoice): Promise<Invoice> {
    if (invoice.supplierId) return invoice;

    const supplier = await this.getSupplierByName(invoice.supplierName);
    if (supplier) {
      return { ...invoice, supplierId: supplier.id };
    }

    return invoice;
  }

  // === STATS ===
  async getGlobalStats() {
    const suppliers = await this.getSuppliers();
    const invoices = this.getInvoices();
    const shipments = this.getShipments();
    const emails = this.getEmailDrafts();

    return {
      suppliers: {
        total: suppliers.length,
        active: suppliers.filter(s => s.status === 'active').length,
        withProducts: suppliers.filter(s => s.featuredProducts.length > 0).length,
      },
      invoices: {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'paid').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      },
      shipments: {
        total: shipments.length,
        active: shipments.filter(s => s.status !== 'delivered').length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
      },
      emails: {
        total: emails.length,
        sent: emails.filter(e => e.status === 'sent').length,
        drafts: emails.filter(e => e.status === 'draft').length,
      }
    };
  }

  // === SEARCH ===
  async searchAll(query: string) {
    const q = query.toLowerCase();
    const suppliers = await this.getSuppliers();
    const invoices = this.getInvoices();
    const shipments = this.getShipments();

    return {
      suppliers: suppliers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.legalName.toLowerCase().includes(q) ||
        s.categories.some(c => c.toLowerCase().includes(q))
      ),
      invoices: invoices.filter(inv =>
        inv.number.toLowerCase().includes(q) ||
        inv.supplierName.toLowerCase().includes(q)
      ),
      shipments: shipments.filter(s =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.supplierName?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      ),
    };
  }
}

// Export singleton
export const dataHub = DataHub.getInstance();

// Export helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
