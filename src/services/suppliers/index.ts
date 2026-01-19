// Service de gestion des fournisseurs Weedn
// Version hybride: Fichiers locaux (dev) + Supabase (production)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export interface SupplierContact {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
}

export interface FeaturedProduct {
  name: string;
  category: string;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  margin: string;
  minQuantity: number;
  inStock: boolean;
  quality: 'Premium' | 'Standard' | 'Budget';
  thcLevel: string;
  cbdLevel: string;
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  legalName: string;
  type: 'Grossiste CBD' | 'Fabricant' | 'Distributeur' | 'Autre';
  status: 'active' | 'inactive' | 'pending';
  contact: SupplierContact;
  website: string;
  siret: string;
  paymentTerms: string;
  minOrderAmount: number | null;
  deliveryTime: string;
  notes: string;
  featuredProducts: FeaturedProduct[];
  categories: string[];
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersData {
  _metadata: {
    version: string;
    lastUpdated: string;
    description: string;
  };
  suppliers: Record<string, Supplier>;
}

// Détection environnement
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// Supabase client pour production
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

// ============================================
// MODE LOCAL (développement avec fichiers)
// ============================================

let cachedData: SuppliersData | null = null;

function loadSuppliersDataLocal(): SuppliersData {
  if (cachedData) return cachedData;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');

    const DATA_PATH = process.env.WEEDN_DATA_PATH || '/Users/alektkt/Documents/weedn-project/data';
    const SUPPLIERS_FILE = path.join(DATA_PATH, 'suppliers.json');

    if (fs.existsSync(SUPPLIERS_FILE)) {
      const data = fs.readFileSync(SUPPLIERS_FILE, 'utf-8');
      cachedData = JSON.parse(data);
      return cachedData!;
    }
  } catch (error) {
    console.error('Erreur chargement fournisseurs local:', error);
  }

  return {
    _metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: 'Fournisseurs Weedn',
    },
    suppliers: {},
  };
}

function saveSuppliersDataLocal(data: SuppliersData): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');

    const DATA_PATH = process.env.WEEDN_DATA_PATH || '/Users/alektkt/Documents/weedn-project/data';
    const SUPPLIERS_FILE = path.join(DATA_PATH, 'suppliers.json');

    data._metadata.lastUpdated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    cachedData = data;
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde fournisseurs local:', error);
    return false;
  }
}

// ============================================
// MODE SUPABASE (production Vercel)
// ============================================

async function getAllSuppliersSupabase(): Promise<Supplier[]> {
  const { data, error } = await getSupabase()
    .from('suppliers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur Supabase getAllSuppliers:', error);
    return [];
  }

  return (data || []).map(row => ({
    ...row,
    contact: row.contact || { name: '', phone: '', email: '', whatsapp: '', address: '' },
    featuredProducts: row.featured_products || [],
    categories: row.categories || [],
    legalName: row.legal_name || '',
    paymentTerms: row.payment_terms || '',
    minOrderAmount: row.min_order_amount,
    deliveryTime: row.delivery_time || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function getSupplierSupabase(id: string): Promise<Supplier | null> {
  const { data, error } = await getSupabase()
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    contact: data.contact || { name: '', phone: '', email: '', whatsapp: '', address: '' },
    featuredProducts: data.featured_products || [],
    categories: data.categories || [],
    legalName: data.legal_name || '',
    paymentTerms: data.payment_terms || '',
    minOrderAmount: data.min_order_amount,
    deliveryTime: data.delivery_time || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function addSupplierSupabase(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
  const id = supplier.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await getSupabase()
    .from('suppliers')
    .insert({
      id,
      name: supplier.name,
      legal_name: supplier.legalName,
      type: supplier.type,
      status: supplier.status,
      contact: supplier.contact,
      website: supplier.website,
      siret: supplier.siret,
      payment_terms: supplier.paymentTerms,
      min_order_amount: supplier.minOrderAmount,
      delivery_time: supplier.deliveryTime,
      notes: supplier.notes,
      featured_products: supplier.featuredProducts,
      categories: supplier.categories,
      rating: supplier.rating,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase addSupplier:', error);
    throw error;
  }

  return {
    ...data,
    contact: data.contact,
    featuredProducts: data.featured_products,
    categories: data.categories,
    legalName: data.legal_name,
    paymentTerms: data.payment_terms,
    minOrderAmount: data.min_order_amount,
    deliveryTime: data.delivery_time,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function updateSupplierSupabase(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  const updateData: Record<string, unknown> = {};

  if (updates.name) updateData.name = updates.name;
  if (updates.legalName !== undefined) updateData.legal_name = updates.legalName;
  if (updates.type) updateData.type = updates.type;
  if (updates.status) updateData.status = updates.status;
  if (updates.contact) updateData.contact = updates.contact;
  if (updates.website !== undefined) updateData.website = updates.website;
  if (updates.siret !== undefined) updateData.siret = updates.siret;
  if (updates.paymentTerms !== undefined) updateData.payment_terms = updates.paymentTerms;
  if (updates.minOrderAmount !== undefined) updateData.min_order_amount = updates.minOrderAmount;
  if (updates.deliveryTime !== undefined) updateData.delivery_time = updates.deliveryTime;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.featuredProducts) updateData.featured_products = updates.featuredProducts;
  if (updates.categories) updateData.categories = updates.categories;
  if (updates.rating !== undefined) updateData.rating = updates.rating;

  const { data, error } = await getSupabase()
    .from('suppliers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;

  return {
    ...data,
    contact: data.contact,
    featuredProducts: data.featured_products,
    categories: data.categories,
    legalName: data.legal_name,
    paymentTerms: data.payment_terms,
    minOrderAmount: data.min_order_amount,
    deliveryTime: data.delivery_time,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function deleteSupplierSupabase(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('suppliers')
    .delete()
    .eq('id', id);

  return !error;
}

// ============================================
// API UNIFIÉE (sélection automatique du mode)
// ============================================

export function invalidateCache() {
  cachedData = null;
}

export function getAllSuppliers(): Supplier[] {
  if (IS_VERCEL) {
    // En production, cette fonction ne devrait pas être utilisée directement
    // Utiliser getAllSuppliersAsync à la place
    console.warn('getAllSuppliers sync appelé en mode Vercel - utiliser getAllSuppliersAsync');
    return [];
  }
  const data = loadSuppliersDataLocal();
  return Object.values(data.suppliers).filter(s => s.id && s.id !== '_template');
}

export async function getAllSuppliersAsync(): Promise<Supplier[]> {
  if (IS_VERCEL) {
    return getAllSuppliersSupabase();
  }
  return getAllSuppliers();
}

export function getSupplier(id: string): Supplier | null {
  if (IS_VERCEL) {
    console.warn('getSupplier sync appelé en mode Vercel - utiliser getSupplierAsync');
    return null;
  }
  const data = loadSuppliersDataLocal();
  return data.suppliers[id] || null;
}

export async function getSupplierAsync(id: string): Promise<Supplier | null> {
  if (IS_VERCEL) {
    return getSupplierSupabase(id);
  }
  return getSupplier(id);
}

export function addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
  if (IS_VERCEL) {
    throw new Error('addSupplier sync non supporté en production - utiliser addSupplierAsync');
  }

  const data = loadSuppliersDataLocal();
  const id = supplier.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const now = new Date().toISOString().split('T')[0];
  const newSupplier: Supplier = {
    ...supplier,
    id,
    createdAt: now,
    updatedAt: now,
  };

  data.suppliers[id] = newSupplier;
  saveSuppliersDataLocal(data);
  return newSupplier;
}

export async function addSupplierAsync(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
  if (IS_VERCEL) {
    return addSupplierSupabase(supplier);
  }
  return addSupplier(supplier);
}

export function updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
  if (IS_VERCEL) {
    throw new Error('updateSupplier sync non supporté en production - utiliser updateSupplierAsync');
  }

  const data = loadSuppliersDataLocal();
  if (!data.suppliers[id]) return null;

  data.suppliers[id] = {
    ...data.suppliers[id],
    ...updates,
    id,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  saveSuppliersDataLocal(data);
  return data.suppliers[id];
}

export async function updateSupplierAsync(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  if (IS_VERCEL) {
    return updateSupplierSupabase(id, updates);
  }
  return updateSupplier(id, updates);
}

export function deleteSupplier(id: string): boolean {
  if (IS_VERCEL) {
    throw new Error('deleteSupplier sync non supporté en production - utiliser deleteSupplierAsync');
  }

  const data = loadSuppliersDataLocal();
  if (!data.suppliers[id]) return false;

  delete data.suppliers[id];
  saveSuppliersDataLocal(data);
  return true;
}

export async function deleteSupplierAsync(id: string): Promise<boolean> {
  if (IS_VERCEL) {
    return deleteSupplierSupabase(id);
  }
  return deleteSupplier(id);
}

export function addFeaturedProduct(supplierId: string, product: FeaturedProduct): boolean {
  if (IS_VERCEL) {
    throw new Error('addFeaturedProduct sync non supporté - utiliser addFeaturedProductAsync');
  }

  const data = loadSuppliersDataLocal();
  if (!data.suppliers[supplierId]) return false;

  data.suppliers[supplierId].featuredProducts.push(product);
  data.suppliers[supplierId].updatedAt = new Date().toISOString().split('T')[0];
  saveSuppliersDataLocal(data);
  return true;
}

export async function addFeaturedProductAsync(supplierId: string, product: FeaturedProduct): Promise<boolean> {
  if (IS_VERCEL) {
    const supplier = await getSupplierSupabase(supplierId);
    if (!supplier) return false;

    const updatedProducts = [...supplier.featuredProducts, product];
    const result = await updateSupplierSupabase(supplierId, { featuredProducts: updatedProducts });
    return result !== null;
  }
  return addFeaturedProduct(supplierId, product);
}

export function removeFeaturedProduct(supplierId: string, productName: string): boolean {
  if (IS_VERCEL) {
    throw new Error('removeFeaturedProduct sync non supporté - utiliser removeFeaturedProductAsync');
  }

  const data = loadSuppliersDataLocal();
  if (!data.suppliers[supplierId]) return false;

  const index = data.suppliers[supplierId].featuredProducts.findIndex(p => p.name === productName);
  if (index === -1) return false;

  data.suppliers[supplierId].featuredProducts.splice(index, 1);
  data.suppliers[supplierId].updatedAt = new Date().toISOString().split('T')[0];
  saveSuppliersDataLocal(data);
  return true;
}

export async function removeFeaturedProductAsync(supplierId: string, productName: string): Promise<boolean> {
  if (IS_VERCEL) {
    const supplier = await getSupplierSupabase(supplierId);
    if (!supplier) return false;

    const updatedProducts = supplier.featuredProducts.filter(p => p.name !== productName);
    if (updatedProducts.length === supplier.featuredProducts.length) return false;

    const result = await updateSupplierSupabase(supplierId, { featuredProducts: updatedProducts });
    return result !== null;
  }
  return removeFeaturedProduct(supplierId, productName);
}

export function searchSuppliers(query: string): Supplier[] {
  const suppliers = getAllSuppliers();
  const lowerQuery = query.toLowerCase();

  return suppliers.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.legalName.toLowerCase().includes(lowerQuery) ||
    s.categories.some(c => c.toLowerCase().includes(lowerQuery)) ||
    s.featuredProducts.some(p => p.name.toLowerCase().includes(lowerQuery))
  );
}

export async function searchSuppliersAsync(query: string): Promise<Supplier[]> {
  const suppliers = await getAllSuppliersAsync();
  const lowerQuery = query.toLowerCase();

  return suppliers.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.legalName.toLowerCase().includes(lowerQuery) ||
    s.categories.some(c => c.toLowerCase().includes(lowerQuery)) ||
    s.featuredProducts.some(p => p.name.toLowerCase().includes(lowerQuery))
  );
}

export function getSuppliersByCategory(category: string): Supplier[] {
  return getAllSuppliers().filter(s => s.categories.includes(category));
}

export function getActiveSuppliers(): Supplier[] {
  return getAllSuppliers().filter(s => s.status === 'active');
}

export async function getActiveSuppliersAsync(): Promise<Supplier[]> {
  const suppliers = await getAllSuppliersAsync();
  return suppliers.filter(s => s.status === 'active');
}

export function getSuppliersStats() {
  const suppliers = getAllSuppliers();

  return {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
    totalProducts: suppliers.reduce((sum, s) => sum + s.featuredProducts.length, 0),
    categories: Array.from(new Set(suppliers.flatMap(s => s.categories))),
  };
}

export async function getSuppliersStatsAsync() {
  const suppliers = await getAllSuppliersAsync();

  return {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
    totalProducts: suppliers.reduce((sum, s) => sum + s.featuredProducts.length, 0),
    categories: Array.from(new Set(suppliers.flatMap(s => s.categories))),
  };
}

export default {
  getAllSuppliers,
  getAllSuppliersAsync,
  getSupplier,
  getSupplierAsync,
  addSupplier,
  addSupplierAsync,
  updateSupplier,
  updateSupplierAsync,
  deleteSupplier,
  deleteSupplierAsync,
  addFeaturedProduct,
  addFeaturedProductAsync,
  removeFeaturedProduct,
  removeFeaturedProductAsync,
  searchSuppliers,
  searchSuppliersAsync,
  getSuppliersByCategory,
  getActiveSuppliers,
  getActiveSuppliersAsync,
  getSuppliersStats,
  getSuppliersStatsAsync,
  invalidateCache,
};
