/**
 * Treasury Service - COURTHIEU Holdings
 * Consolidates all financial sources:
 * - Banking: CIC, Qonto, BoursoBank (via bankingHub)
 * - Fintech: Revolut, VivaWallet
 * - Crypto: ETH wallet
 */

import { bankingHub, BankAccount, Transaction } from '../banking';

// ============ CONFIG ============

const REVOLUT_CONFIG = {
  baseUrl: 'https://b2b.revolut.com/api/1.0',
  clientId: process.env.REVOLUT_CLIENT_ID || '',
  jwtToken: process.env.REVOLUT_JWT || '',
};

const VIVA_CONFIG = {
  baseUrl: 'https://api.vivapayments.com',
  weedn: {
    clientId: process.env.VIVA_CLIENT_ID || '',
    clientSecret: process.env.VIVA_CLIENT_SECRET || '',
    merchantId: process.env.VIVA_MERCHANT_ID || '',
  },
  bijan: {
    clientId: process.env.BIJAN_VIVA_CLIENT_ID || '',
    clientSecret: process.env.BIJAN_VIVA_CLIENT_SECRET || '',
    merchantId: process.env.BIJAN_VIVA_MERCHANT_ID || '',
  },
};

const CRYPTO_CONFIG = {
  ethBalance: parseFloat(process.env.ETH_BALANCE || '0.11'), // ~400$ manual
  coingeckoUrl: 'https://api.coingecko.com/api/v3',
};

// ============ TYPES ============

export interface TreasuryAccount {
  id: string;
  name: string;
  bank: string;
  entity: 'WEEDN' | 'BIJAN_PARIS' | 'HOLDINGS' | 'PERSONAL';
  type: 'business' | 'personal' | 'crypto';
  balance: number;
  currency: string;
  iban?: string;
  lastSync: string | null;
  status: 'active' | 'pending' | 'error';
  source: 'banking_hub' | 'revolut' | 'viva' | 'crypto';
}

export interface CryptoAsset {
  asset: string;
  balance: number;
  priceUsd: number;
  priceEur: number;
  valueUsd: number;
  valueEur: number;
  change24h: number;
}

export interface TreasurySummary {
  totalBalance: number;
  totalBalanceUsd: number;
  accounts: TreasuryAccount[];
  crypto: CryptoAsset | null;
  recentTransactions: Transaction[];
  lastSync: string;
  errors: string[];
}

// ============ ETH / COINGECKO ============

async function getEthPrice(): Promise<{
  priceUsd: number;
  priceEur: number;
  change24h: number;
  error: string | null;
}> {
  try {
    const response = await fetch(
      `${CRYPTO_CONFIG.coingeckoUrl}/simple/price?ids=ethereum&vs_currencies=usd,eur&include_24hr_change=true`,
      { next: { revalidate: 60 } } // Cache 1 minute
    );

    if (!response.ok) {
      return { priceUsd: 0, priceEur: 0, change24h: 0, error: `CoinGecko API error: ${response.status}` };
    }

    const data = await response.json();
    const eth = data.ethereum;

    return {
      priceUsd: eth.usd,
      priceEur: eth.eur,
      change24h: eth.usd_24h_change || 0,
      error: null,
    };
  } catch (err) {
    return {
      priceUsd: 0,
      priceEur: 0,
      change24h: 0,
      error: err instanceof Error ? err.message : 'ETH fetch error',
    };
  }
}

async function getCryptoBalance(): Promise<CryptoAsset | null> {
  const eth = await getEthPrice();

  if (eth.error || CRYPTO_CONFIG.ethBalance === 0) {
    return null;
  }

  return {
    asset: 'ETH',
    balance: CRYPTO_CONFIG.ethBalance,
    priceUsd: eth.priceUsd,
    priceEur: eth.priceEur,
    valueUsd: CRYPTO_CONFIG.ethBalance * eth.priceUsd,
    valueEur: CRYPTO_CONFIG.ethBalance * eth.priceEur,
    change24h: eth.change24h,
  };
}

// ============ REVOLUT ============

async function getRevolutToken(): Promise<string | null> {
  // For now, check if direct token is available
  // In production, this would use OAuth refresh
  if (REVOLUT_CONFIG.jwtToken) {
    return REVOLUT_CONFIG.jwtToken;
  }
  return null;
}

async function getRevolutAccounts(): Promise<TreasuryAccount[]> {
  const token = await getRevolutToken();
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${REVOLUT_CONFIG.baseUrl}/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Revolut API error:', response.status);
      return [];
    }

    const accounts = await response.json();

    return accounts.map((acc: {
      id: string;
      name?: string;
      currency: string;
      balance: number;
      state?: string;
    }) => ({
      id: `revolut_${acc.id}`,
      name: acc.name || 'Revolut Business',
      bank: 'Revolut',
      entity: 'HOLDINGS' as const,
      type: 'business' as const,
      balance: acc.balance / 100, // Revolut returns cents
      currency: acc.currency,
      lastSync: new Date().toISOString(),
      status: acc.state === 'active' ? 'active' as const : 'pending' as const,
      source: 'revolut' as const,
    }));
  } catch (err) {
    console.error('Revolut fetch error:', err);
    return [];
  }
}

// ============ VIVAWALLET ============

async function getVivaToken(account: 'weedn' | 'bijan'): Promise<string | null> {
  const config = account === 'weedn' ? VIVA_CONFIG.weedn : VIVA_CONFIG.bijan;

  if (!config.clientId || !config.clientSecret) {
    return null;
  }

  try {
    const response = await fetch('https://accounts.vivapayments.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch {
    return null;
  }
}

async function getVivaBalance(account: 'weedn' | 'bijan'): Promise<TreasuryAccount | null> {
  const token = await getVivaToken(account);
  if (!token) {
    return null;
  }

  // VivaWallet POS accounts don't have direct balance endpoint
  // We return a placeholder with pending status
  return {
    id: `viva_${account}`,
    name: account === 'weedn' ? 'Viva Wallet Weedn' : 'Viva Wallet BIJAN',
    bank: 'Viva.com',
    entity: account === 'weedn' ? 'WEEDN' : 'BIJAN_PARIS',
    type: 'business',
    balance: 0, // POS accounts - balance is pending settlement
    currency: 'EUR',
    lastSync: new Date().toISOString(),
    status: 'active',
    source: 'viva',
  };
}

// ============ TREASURY SERVICE ============

class TreasuryService {
  /**
   * Get consolidated treasury view
   */
  async getSummary(): Promise<TreasurySummary> {
    const errors: string[] = [];
    const accounts: TreasuryAccount[] = [];

    // 1. Get banking hub accounts (Qonto, CIC, BoursoBank)
    try {
      const bankingAccounts = await bankingHub.getAllBalances();
      bankingAccounts.forEach(acc => {
        accounts.push({
          id: `${acc.provider}_${acc.iban?.slice(-4) || 'main'}`,
          name: acc.accountName || `${acc.provider.toUpperCase()} Account`,
          bank: acc.provider.toUpperCase(),
          entity: this.mapEntity(acc.entity),
          type: 'business',
          balance: acc.balance,
          currency: acc.currency,
          iban: acc.iban,
          lastSync: acc.lastUpdate,
          status: acc.status === 'connected' ? 'active' : 'pending',
          source: 'banking_hub',
        });
      });
    } catch (err) {
      errors.push(`Banking Hub: ${err instanceof Error ? err.message : 'Error'}`);
    }

    // 2. Get Revolut accounts
    try {
      const revolutAccounts = await getRevolutAccounts();
      accounts.push(...revolutAccounts);
    } catch (err) {
      errors.push(`Revolut: ${err instanceof Error ? err.message : 'Error'}`);
    }

    // 3. Get VivaWallet accounts
    for (const vivaAccount of ['weedn', 'bijan'] as const) {
      try {
        const viva = await getVivaBalance(vivaAccount);
        if (viva) {
          accounts.push(viva);
        }
      } catch (err) {
        errors.push(`VivaWallet ${vivaAccount}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    // 4. Get crypto (ETH)
    const crypto = await getCryptoBalance();

    // 5. Get recent transactions from banking hub
    let recentTransactions: Transaction[] = [];
    try {
      recentTransactions = await bankingHub.getRecentTransactions(10);
    } catch (err) {
      errors.push(`Transactions: ${err instanceof Error ? err.message : 'Error'}`);
    }

    // Calculate totals
    const eurAccounts = accounts.filter(a => a.currency === 'EUR');
    const totalBalance = eurAccounts.reduce((sum, a) => sum + a.balance, 0) + (crypto?.valueEur || 0);
    const totalBalanceUsd = (totalBalance * 1.08) + (crypto?.valueUsd || 0) - (crypto?.valueEur || 0) * 1.08;

    return {
      totalBalance,
      totalBalanceUsd,
      accounts,
      crypto,
      recentTransactions,
      lastSync: new Date().toISOString(),
      errors,
    };
  }

  /**
   * Get ETH status only
   */
  async getEthStatus(): Promise<CryptoAsset | null> {
    return getCryptoBalance();
  }

  /**
   * Map entity names
   */
  private mapEntity(entity: string): 'WEEDN' | 'BIJAN_PARIS' | 'HOLDINGS' | 'PERSONAL' {
    const mapping: Record<string, 'WEEDN' | 'BIJAN_PARIS' | 'HOLDINGS' | 'PERSONAL'> = {
      'RETAR DIO': 'WEEDN',
      'FAST DELIVERY BOX': 'HOLDINGS',
      'Alexandre COURTHIEU': 'PERSONAL',
      'BIJAN PARIS': 'BIJAN_PARIS',
    };
    return mapping[entity] || 'HOLDINGS';
  }

  /**
   * Get accounts by entity
   */
  async getAccountsByEntity(entity: 'WEEDN' | 'BIJAN_PARIS' | 'HOLDINGS' | 'PERSONAL'): Promise<TreasuryAccount[]> {
    const summary = await this.getSummary();
    return summary.accounts.filter(a => a.entity === entity);
  }
}

export const treasuryService = new TreasuryService();
export { getCryptoBalance, getEthPrice };
