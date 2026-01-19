// Service Shopify - E-commerce weedn.fr
// Gère toutes les interactions avec l'API Shopify Admin

import { getShopifyConfig } from '@/config';

const API_VERSION = '2024-01';

// Récupérer la config Shopify de manière sécurisée
function getConfig() {
  const config = getShopifyConfig();
  if (!config) {
    // Fallback sur les variables d'environnement
    return {
      store: process.env.SHOPIFY_STORE || 'f24081-64.myshopify.com',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    };
  }
  return config;
}

// Fonction fetch générique pour Shopify
async function shopifyFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const config = getConfig();
  if (!config.accessToken) {
    throw new Error('Shopify non configuré: token manquant');
  }

  const response = await fetch(
    `https://${config.store}/admin/api/${API_VERSION}${endpoint}`,
    {
      ...options,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============ COMMANDES ============
export interface OrderParams {
  limit?: number;
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
  financial_status?: string;
  fulfillment_status?: string;
}

export async function getOrders(params?: OrderParams) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.created_at_min) queryParams.set('created_at_min', params.created_at_min);
  if (params?.created_at_max) queryParams.set('created_at_max', params.created_at_max);
  if (params?.financial_status) queryParams.set('financial_status', params.financial_status);
  if (params?.fulfillment_status) queryParams.set('fulfillment_status', params.fulfillment_status);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return shopifyFetch<{ orders: any[] }>(`/orders.json${query}`);
}

export async function getOrder(orderId: string) {
  return shopifyFetch<{ order: any }>(`/orders/${orderId}.json`);
}

export async function getOrdersCount(status?: string) {
  const query = status ? `?status=${status}` : '';
  return shopifyFetch<{ count: number }>(`/orders/count.json${query}`);
}

// ============ PRODUITS ============
export interface ProductParams {
  limit?: number;
  status?: string;
  product_type?: string;
  vendor?: string;
  collection_id?: string;
}

export async function getProducts(params?: ProductParams) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.product_type) queryParams.set('product_type', params.product_type);
  if (params?.vendor) queryParams.set('vendor', params.vendor);
  if (params?.collection_id) queryParams.set('collection_id', params.collection_id);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return shopifyFetch<{ products: any[] }>(`/products.json${query}`);
}

export async function getProduct(productId: string) {
  return shopifyFetch<{ product: any }>(`/products/${productId}.json`);
}

export async function getProductsCount() {
  return shopifyFetch<{ count: number }>('/products/count.json');
}

// ============ CLIENTS ============
export interface CustomerParams {
  limit?: number;
  created_at_min?: string;
  updated_at_min?: string;
}

export async function getCustomers(params?: CustomerParams) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.created_at_min) queryParams.set('created_at_min', params.created_at_min);
  if (params?.updated_at_min) queryParams.set('updated_at_min', params.updated_at_min);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return shopifyFetch<{ customers: any[] }>(`/customers.json${query}`);
}

export async function getCustomer(customerId: string) {
  return shopifyFetch<{ customer: any }>(`/customers/${customerId}.json`);
}

export async function getCustomersCount() {
  return shopifyFetch<{ count: number }>('/customers/count.json');
}

// ============ INVENTAIRE ============
export async function getInventoryLevels(locationIds?: string[]) {
  const query = locationIds ? `?location_ids=${locationIds.join(',')}` : '';
  return shopifyFetch<{ inventory_levels: any[] }>(`/inventory_levels.json${query}`);
}

export async function getLocations() {
  return shopifyFetch<{ locations: any[] }>('/locations.json');
}

// ============ COLLECTIONS ============
export async function getCollections(type: 'smart' | 'custom' = 'custom') {
  const endpoint = type === 'smart' ? '/smart_collections.json' : '/custom_collections.json';
  return shopifyFetch<any>(endpoint);
}

// ============ SHOP INFO ============
export async function getShopInfo() {
  return shopifyFetch<{ shop: any }>('/shop.json');
}

// ============ MÉTRIQUES COMPLÈTES ============
export interface ShopifyMetrics {
  shop: {
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
    country: string;
  };
  revenue: {
    today: string;
    yesterday: string;
    last7Days: string;
    last30Days: string;
    total: string;
    avgOrderValue: string;
  };
  orders: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    total: number;
    recent: any[];
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    lowStockItems: any[];
    outOfStockItems: any[];
    all: any[];
  };
  customers: {
    total: number;
    newLast30Days: number;
  };
  topProducts: any[];
  generatedAt: string;
}

export async function getFullMetrics(): Promise<ShopifyMetrics> {
  const [ordersData, productsData, customersData, shopData] = await Promise.all([
    getOrders({ limit: 250, status: 'any' }),
    getProducts({ limit: 250 }),
    getCustomers({ limit: 250 }),
    getShopInfo(),
  ]);

  const orders = ordersData.orders || [];
  const products = productsData.products || [];
  const customers = customersData.customers || [];
  const shop = shopData.shop || {};

  // Calculs temporels
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Filtres par période
  const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today));
  const yesterdayOrders = orders.filter((o: any) => o.created_at?.startsWith(yesterday));
  const last7DaysOrders = orders.filter((o: any) => new Date(o.created_at) >= new Date(last7Days));
  const last30DaysOrders = orders.filter((o: any) => new Date(o.created_at) >= new Date(last30Days));

  // CA par période
  const calcRevenue = (orderList: any[]) =>
    orderList.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  const todayRevenue = calcRevenue(todayOrders);
  const yesterdayRevenue = calcRevenue(yesterdayOrders);
  const last7DaysRevenue = calcRevenue(last7DaysOrders);
  const last30DaysRevenue = calcRevenue(last30DaysOrders);
  const totalRevenue = calcRevenue(orders);

  // Panier moyen
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Stocks
  const productStock = products.map((p: any) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    status: p.status,
    productType: p.product_type,
    vendor: p.vendor,
    inventory: p.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    variants: p.variants?.length || 0,
    priceRange: {
      min: Math.min(...(p.variants?.map((v: any) => parseFloat(v.price) || 0) || [0])),
      max: Math.max(...(p.variants?.map((v: any) => parseFloat(v.price) || 0) || [0])),
    },
    images: p.images?.length || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  const lowStock = productStock.filter((p: any) => p.inventory <= 5 && p.inventory > 0);
  const outOfStock = productStock.filter((p: any) => p.inventory === 0);
  const activeProducts = productStock.filter((p: any) => p.status === 'active');

  // Clients
  const newCustomersLast30Days = customers.filter(
    (c: any) => new Date(c.created_at) >= new Date(last30Days)
  ).length;

  // Top produits vendus
  const productSales: Record<string, { title: string; quantity: number; revenue: number }> = {};
  orders.forEach((order: any) => {
    order.line_items?.forEach((item: any) => {
      const key = item.product_id?.toString() || item.title;
      if (!productSales[key]) {
        productSales[key] = { title: item.title, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].revenue += parseFloat(item.price) * item.quantity;
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    shop: {
      name: shop.name,
      email: shop.email,
      domain: shop.domain,
      currency: shop.currency,
      timezone: shop.timezone,
      country: shop.country_name,
    },
    revenue: {
      today: todayRevenue.toFixed(2),
      yesterday: yesterdayRevenue.toFixed(2),
      last7Days: last7DaysRevenue.toFixed(2),
      last30Days: last30DaysRevenue.toFixed(2),
      total: totalRevenue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
    },
    orders: {
      today: todayOrders.length,
      yesterday: yesterdayOrders.length,
      last7Days: last7DaysOrders.length,
      last30Days: last30DaysOrders.length,
      total: orders.length,
      recent: orders.slice(0, 10).map((o: any) => ({
        id: o.id,
        number: o.order_number,
        total: o.total_price,
        currency: o.currency,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status,
        customerEmail: o.email,
        itemCount: o.line_items?.length || 0,
        createdAt: o.created_at,
      })),
    },
    products: {
      total: products.length,
      active: activeProducts.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      all: productStock,
    },
    customers: {
      total: customers.length,
      newLast30Days: newCustomersLast30Days,
    },
    topProducts,
    generatedAt: new Date().toISOString(),
  };
}

export default {
  getOrders,
  getOrder,
  getOrdersCount,
  getProducts,
  getProduct,
  getProductsCount,
  getCustomers,
  getCustomer,
  getCustomersCount,
  getInventoryLevels,
  getLocations,
  getCollections,
  getShopInfo,
  getFullMetrics,
};
