import { NextResponse } from 'next/server';
import { withCache } from '@/lib/cache';
import { treasuryService } from '@/lib/treasury';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const DATA_PATH = process.env.WEEDN_DATA_PATH || '/Users/alektkt/Documents/weedn-project/data';

// Charger les données d'abonnements
function loadSubscriptions() {
  const subPath = path.join(DATA_PATH, 'subscriptions', 'subscriptions.json');
  if (fs.existsSync(subPath)) {
    return JSON.parse(fs.readFileSync(subPath, 'utf-8'));
  }
  return { subscriptions: [], stats: { totalActive: 0, totalMonthlySpend: 0, alerts: { total: 0 } } };
}

// Charger les données de factures
function loadInvoices() {
  const invPath = path.join(DATA_PATH, 'invoices', 'invoices.json');
  if (fs.existsSync(invPath)) {
    return JSON.parse(fs.readFileSync(invPath, 'utf-8'));
  }
  return { invoices: [], alerts: [] };
}

export async function GET() {
  try {
    // Charger les données avec cache
    const [subscriptionsData, invoicesData, treasurySummary] = await Promise.all([
      withCache('treasury_subscriptions', () => Promise.resolve(loadSubscriptions()), 60000),
      withCache('treasury_invoices', () => Promise.resolve(loadInvoices()), 60000),
      withCache('treasury_summary', () => treasuryService.getSummary(), 30000), // Cache 30s for live data
    ]);

    // Récupérer les métriques combinées pour le CA
    let monthlyRevenue = 0;
    let monthlyProfit = 0;
    try {
      const metricsRes = await fetch('http://localhost:3003/api/combined-metrics');
      const metricsJson = await metricsRes.json();
      if (metricsJson.success && metricsJson.data) {
        monthlyRevenue = metricsJson.data.combined?.month?.revenue || 0;
        // Estimer le profit (marge ~20%)
        monthlyProfit = monthlyRevenue * 0.20 - subscriptionsData.stats.totalMonthlySpend;
      }
    } catch (e) {
      console.log('Metrics fetch error:', e);
    }

    // Map treasury accounts to expected format
    const accounts = treasurySummary.accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      bank: acc.bank,
      entity: acc.entity,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      iban: acc.iban,
      lastSync: acc.lastSync,
      status: acc.status,
    }));

    // Calculate total balance (from real data)
    const totalBalance = treasurySummary.totalBalance;

    // Construire les données de trésorerie
    const data = {
      holdings: {
        totalBalance,
        availableCash: totalBalance,
        pendingPayments: subscriptionsData.stats.totalMonthlySpend +
          invoicesData.invoices.filter((i: { status: string }) => i.status !== 'paid')
            .reduce((sum: number, i: { amount?: number }) => sum + (i.amount || 0), 0),
        monthlyProfit: monthlyProfit,
        yearToDateProfit: monthlyProfit * 0.6, // Janvier partiel
      },
      accounts,
      // Add crypto if available
      crypto: treasurySummary.crypto ? {
        asset: treasurySummary.crypto.asset,
        balance: treasurySummary.crypto.balance,
        priceUsd: treasurySummary.crypto.priceUsd,
        priceEur: treasurySummary.crypto.priceEur,
        valueUsd: treasurySummary.crypto.valueUsd,
        valueEur: treasurySummary.crypto.valueEur,
        change24h: treasurySummary.crypto.change24h,
      } : null,
      paymentMethods: [
        {
          id: 'viva_weedn',
          name: 'Viva.com Paiements',
          provider: 'Viva.com',
          entity: 'WEEDN',
          type: 'card' as const,
          enabled: true,
          monthlyVolume: monthlyRevenue * 0.5, // ~50% Shopify via Viva
          fees: monthlyRevenue * 0.5 * 0.019, // 1.9%
          feeRate: 1.9,
        },
        {
          id: 'monetico_weedn',
          name: 'Monetico TPE',
          provider: 'CIC',
          entity: 'WEEDN',
          type: 'pos' as const,
          enabled: true,
          monthlyVolume: 7001, // TPE Boutique Tiquetonne
          fees: 7001 * 0.008, // ~0.8% Monetico
          feeRate: 0.8,
        },
        {
          id: 'monetico_bijan',
          name: 'Monetico TPE',
          provider: 'CIC',
          entity: 'BIJAN_PARIS',
          type: 'pos' as const,
          enabled: true,
          monthlyVolume: 2800, // TPE Boutique Neyrpic
          fees: 2800 * 0.008, // ~0.8% Monetico
          feeRate: 0.8,
        },
        {
          id: 'virement_bancaire',
          name: 'Virement Bancaire',
          provider: 'CIC',
          entity: 'WEEDN',
          type: 'bank_transfer' as const,
          enabled: true,
          monthlyVolume: 500,
          fees: 0,
          feeRate: 0,
        },
      ],
      pendingInvoices: invoicesData.invoices
        .filter((i: { status: string }) => i.status !== 'paid')
        .map((i: { id: string; vendor: string; amount?: number; dueDate?: string; date?: string; status: string; entity?: string }) => ({
          id: i.id,
          vendor: i.vendor,
          amount: i.amount || 0,
          dueDate: i.dueDate || i.date,
          status: i.status === 'impayee' ? 'overdue' : 'pending',
          entity: i.entity,
        })),
      recentTransactions: treasurySummary.recentTransactions.length > 0
        ? treasurySummary.recentTransactions.map(tx => ({
            id: tx.id,
            date: tx.date,
            description: tx.label,
            amount: Math.abs(tx.amount),
            type: tx.type,
            entity: tx.provider === 'qonto' ? 'HOLDINGS' : 'WEEDN',
            category: tx.category || 'Autre',
          }))
        : [
            // Fallback transactions if no real data
            {
              id: 'tx_1',
              date: new Date().toISOString().split('T')[0],
              description: 'Vente Shopify',
              amount: 85.50,
              type: 'credit' as const,
              entity: 'WEEDN',
              category: 'Vente',
            },
          ],
      subscriptions: {
        active: subscriptionsData.stats.totalActive || 4,
        monthlyTotal: subscriptionsData.stats.totalMonthlySpend || 146,
        alerts: subscriptionsData.stats.alerts?.total || 0,
      },
      // Add errors for debugging
      _debug: {
        errors: treasurySummary.errors,
        lastSync: treasurySummary.lastSync,
      },
    };

    return NextResponse.json({
      success: true,
      data,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Treasury API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 });
  }
}
