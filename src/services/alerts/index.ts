// Service d'alertes urgentes Weedn
// Surveille les problèmes critiques et notifie l'équipe

import { getFullMetrics } from '../shopify';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'payment' | 'stock' | 'orders' | 'website' | 'security';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  details?: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// Seuils d'alerte configurables
export const ALERT_THRESHOLDS = {
  // Stock
  lowStockThreshold: 5,       // Alerte stock faible
  criticalStockThreshold: 2,  // Alerte stock critique

  // Commandes
  maxOrderAge: 48,            // Heures max sans traitement
  minDailyOrders: 3,          // Commandes minimum par jour

  // Chiffre d'affaires
  minDailyRevenue: 100,       // CA minimum par jour (€)

  // Site
  maxResponseTime: 5000,      // Temps de réponse max (ms)
};

// Vérifier les alertes de stock
export async function checkStockAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const metrics = await getFullMetrics();

    // Produits en rupture totale
    if (metrics.products.outOfStock > 0) {
      alerts.push({
        id: `stock-out-${Date.now()}`,
        severity: 'critical',
        category: 'stock',
        title: `🚨 ${metrics.products.outOfStock} produit(s) en rupture de stock`,
        message: `Certains produits ne peuvent plus être vendus !`,
        details: metrics.products.outOfStockItems.map((p: any) => p.title).join(', '),
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Produits en stock faible
    if (metrics.products.lowStock > 0) {
      alerts.push({
        id: `stock-low-${Date.now()}`,
        severity: 'warning',
        category: 'stock',
        title: `⚠️ ${metrics.products.lowStock} produit(s) en stock faible`,
        message: `Prévoir un réapprovisionnement rapidement`,
        details: metrics.products.lowStockItems.map((p: any) => `${p.title}: ${p.inventory} unités`).join(', '),
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

  } catch (error) {
    console.error('Erreur vérification stocks:', error);
  }

  return alerts;
}

// Vérifier les alertes de commandes
export async function checkOrderAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const metrics = await getFullMetrics();

    // Pas de commandes aujourd'hui
    if (metrics.orders.today === 0) {
      const now = new Date();
      const hour = now.getHours();

      // Alerte seulement après 14h si aucune commande
      if (hour >= 14) {
        alerts.push({
          id: `orders-none-${Date.now()}`,
          severity: 'warning',
          category: 'orders',
          title: `📉 Aucune commande aujourd'hui`,
          message: `Il est ${hour}h et aucune commande n'a été passée`,
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }

    // CA très bas
    const todayRevenue = parseFloat(metrics.revenue.today);
    if (todayRevenue < ALERT_THRESHOLDS.minDailyRevenue && new Date().getHours() >= 18) {
      alerts.push({
        id: `revenue-low-${Date.now()}`,
        severity: 'warning',
        category: 'orders',
        title: `💰 CA journalier faible: ${todayRevenue.toFixed(2)}€`,
        message: `Objectif minimum: ${ALERT_THRESHOLDS.minDailyRevenue}€`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

  } catch (error) {
    console.error('Erreur vérification commandes:', error);
  }

  return alerts;
}

// Vérifier l'état du site web
export async function checkWebsiteAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    const start = Date.now();
    const response = await fetch('https://weedn.fr', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    const responseTime = Date.now() - start;

    // Site inaccessible
    if (!response.ok) {
      alerts.push({
        id: `website-down-${Date.now()}`,
        severity: 'critical',
        category: 'website',
        title: `🔴 Site weedn.fr inaccessible !`,
        message: `Code HTTP: ${response.status}`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Site lent
    if (responseTime > ALERT_THRESHOLDS.maxResponseTime) {
      alerts.push({
        id: `website-slow-${Date.now()}`,
        severity: 'warning',
        category: 'website',
        title: `🐢 Site weedn.fr lent`,
        message: `Temps de réponse: ${responseTime}ms (seuil: ${ALERT_THRESHOLDS.maxResponseTime}ms)`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

  } catch (error: any) {
    alerts.push({
      id: `website-error-${Date.now()}`,
      severity: 'critical',
      category: 'website',
      title: `🔴 Erreur connexion weedn.fr`,
      message: error.message || 'Impossible de joindre le site',
      createdAt: new Date().toISOString(),
      acknowledged: false,
    });
  }

  return alerts;
}

// Vérifier toutes les alertes
export async function checkAllAlerts(): Promise<Alert[]> {
  const [stockAlerts, orderAlerts, websiteAlerts] = await Promise.all([
    checkStockAlerts(),
    checkOrderAlerts(),
    checkWebsiteAlerts(),
  ]);

  return [...stockAlerts, ...orderAlerts, ...websiteAlerts]
    .sort((a, b) => {
      // Trier par sévérité puis par date
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

// Formater une alerte pour notification
export function formatAlertForNotification(alert: Alert): string {
  const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
  return `${emoji} ${alert.title}\n${alert.message}${alert.details ? `\n\nDétails: ${alert.details}` : ''}`;
}

export default {
  checkStockAlerts,
  checkOrderAlerts,
  checkWebsiteAlerts,
  checkAllAlerts,
  formatAlertForNotification,
  ALERT_THRESHOLDS,
};
