// Configuration centralisée Weedn Command Center
// Ce fichier charge les credentials depuis le fichier data externe

import fs from 'fs';
import path from 'path';

// Types pour les configurations
export interface ShopifyConfig {
  store: string;
  storeName: string;
  accessToken: string;
  adminUrl: string;
  apiVersion: string;
}

export interface IncwoConfig {
  baseUrl: string;
  accountId: string;
  email: string;
  address: string;
  phone: string;
}

export interface KlaviyoConfig {
  status: string;
  connector: string;
  features: string[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  channels: string[];
  notifications: {
    alerts: boolean;
    dailyReports: boolean;
    urgentOnly: boolean;
  };
}

export interface WeedConfig {
  shopify: ShopifyConfig;
  incwo: IncwoConfig;
  klaviyo: KlaviyoConfig;
  supabase: SupabaseConfig;
  team: Record<string, TeamMember>;
  business: {
    name: string;
    type: string;
    whatsappBusiness: string;
    website: string;
  };
}

// Chemin vers les fichiers data du projet weedn
const DATA_PATH = process.env.WEEDN_DATA_PATH || '/Users/alektkt/Documents/weedn-project/data';

// Cache pour éviter de relire les fichiers
let cachedCredentials: any = null;
let cachedContacts: any = null;

// Charger les credentials depuis le fichier externe
export function loadCredentials(): any {
  if (cachedCredentials) return cachedCredentials;

  try {
    const credPath = path.join(DATA_PATH, 'credentials.json');
    const data = fs.readFileSync(credPath, 'utf-8');
    cachedCredentials = JSON.parse(data);
    return cachedCredentials;
  } catch (error) {
    console.error('Erreur chargement credentials:', error);
    return null;
  }
}

// Charger les contacts depuis le fichier externe
export function loadContacts(): any {
  if (cachedContacts) return cachedContacts;

  try {
    const contactsPath = path.join(DATA_PATH, 'contacts.json');
    const data = fs.readFileSync(contactsPath, 'utf-8');
    cachedContacts = JSON.parse(data);
    return cachedContacts;
  } catch (error) {
    console.error('Erreur chargement contacts:', error);
    return null;
  }
}

// Obtenir la config Shopify
export function getShopifyConfig(): ShopifyConfig | null {
  const creds = loadCredentials();
  if (!creds?.shopify) return null;

  return {
    store: creds.shopify.store,
    storeName: creds.shopify.storeName,
    accessToken: creds.shopify.accessToken,
    adminUrl: creds.shopify.adminUrl,
    apiVersion: '2024-01',
  };
}

// Obtenir la config Incwo (boutique physique)
export function getIncwoConfig(): IncwoConfig | null {
  const creds = loadCredentials();
  if (!creds?.incwo) return null;

  return {
    baseUrl: creds.incwo.baseUrl,
    accountId: creds.incwo.accountId,
    email: creds.incwo.email,
    address: creds.incwo.address,
    phone: creds.incwo.phone,
  };
}

// Obtenir la config Supabase
export function getSupabaseConfig(): SupabaseConfig | null {
  const creds = loadCredentials();
  if (!creds?.supabase) return null;

  return {
    url: creds.supabase.url,
    anonKey: creds.supabase.anonKey,
    projectId: creds.supabase.projectId,
  };
}

// Obtenir l'équipe
export function getTeam(): Record<string, TeamMember> | null {
  const contacts = loadContacts();
  return contacts?.team || null;
}

// Obtenir les infos business
export function getBusiness() {
  const contacts = loadContacts();
  return contacts?.business?.weedn || null;
}

// Export par défaut de toute la config
export function getFullConfig(): WeedConfig | null {
  const creds = loadCredentials();
  const contacts = loadContacts();

  if (!creds || !contacts) return null;

  return {
    shopify: getShopifyConfig()!,
    incwo: getIncwoConfig()!,
    klaviyo: creds.klaviyo,
    supabase: getSupabaseConfig()!,
    team: contacts.team,
    business: {
      name: contacts.business?.weedn?.name || 'Weedn.fr',
      type: contacts.business?.weedn?.type || 'CBD Shop',
      whatsappBusiness: contacts.business?.weedn?.whatsappBusiness || '',
      website: contacts.business?.weedn?.website || 'https://weedn.fr',
    },
  };
}

// Variables d'environnement compilées
export const ENV = {
  // API Keys (depuis env ou credentials)
  ANTHROPIC_API_KEY: process.env.WEEDN_CLAUDE_API_KEY || loadCredentials()?.anthropic?.apiKey,

  // Shopify
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN || loadCredentials()?.shopify?.accessToken,
  SHOPIFY_STORE: loadCredentials()?.shopify?.store || 'f24081-64.myshopify.com',

  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || loadCredentials()?.supabase?.url,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || loadCredentials()?.supabase?.anonKey,

  // Make.com
  MAKE_API_TOKEN: process.env.MAKE_API_TOKEN || loadCredentials()?.make?.apiToken,
  MAKE_ORG_ID: loadCredentials()?.make?.organizationId,

  // Mode
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  DATA_PATH,
};
