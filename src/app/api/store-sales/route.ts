import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface StoreSale {
  id?: string;
  sale_date: string;
  sale_time?: string;
  subtotal: number;
  tax: number;
  total: number;
  items_count: number;
  payment_method: string;
  incwo_receipt_id?: string;
  notes?: string;
  created_by?: string;
}

export interface StoreSalesMetrics {
  today: { transactions: number; revenue: number; avgTicket: number };
  yesterday: { transactions: number; revenue: number; avgTicket: number };
  week: { transactions: number; revenue: number; avgTicket: number };
  month: { transactions: number; revenue: number; avgTicket: number };
  recentSales: StoreSale[];
}

// GET: Récupérer les ventes boutique et métriques
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase non configuré' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all';

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Ventes aujourd'hui
    const { data: todaySales } = await supabase
      .from('store_sales')
      .select('total')
      .eq('sale_date', today);

    // Ventes hier
    const { data: yesterdaySales } = await supabase
      .from('store_sales')
      .select('total')
      .eq('sale_date', yesterday);

    // Ventes semaine
    const { data: weekSales } = await supabase
      .from('store_sales')
      .select('total')
      .gte('sale_date', weekAgo);

    // Ventes mois
    const { data: monthSales } = await supabase
      .from('store_sales')
      .select('total')
      .gte('sale_date', monthAgo);

    // 10 dernières ventes
    const { data: recentSales } = await supabase
      .from('store_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const calcMetrics = (sales: { total: number }[] | null) => {
      if (!sales || sales.length === 0) {
        return { transactions: 0, revenue: 0, avgTicket: 0 };
      }
      const revenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      return {
        transactions: sales.length,
        revenue: Math.round(revenue * 100) / 100,
        avgTicket: Math.round((revenue / sales.length) * 100) / 100,
      };
    };

    const metrics: StoreSalesMetrics = {
      today: calcMetrics(todaySales),
      yesterday: calcMetrics(yesterdaySales),
      week: calcMetrics(weekSales),
      month: calcMetrics(monthSales),
      recentSales: recentSales || [],
    };

    return NextResponse.json({
      success: true,
      metrics,
      source: 'boutique_physique',
      address: '4 Rue Tiquetonne, 75002 Paris',
    });
  } catch (error) {
    console.error('Store sales error:', error);
    return NextResponse.json(
      { error: 'Erreur récupération ventes boutique', details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Ajouter une vente boutique
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase non configuré' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { total, subtotal, tax, items_count, payment_method, notes, incwo_receipt_id, created_by } = body;

    if (!total || total <= 0) {
      return NextResponse.json({ error: 'Montant total requis' }, { status: 400 });
    }

    const sale: Partial<StoreSale> = {
      sale_date: new Date().toISOString().split('T')[0],
      sale_time: new Date().toTimeString().split(' ')[0],
      total: parseFloat(total),
      subtotal: parseFloat(subtotal || total),
      tax: parseFloat(tax || 0),
      items_count: parseInt(items_count || 1),
      payment_method: payment_method || 'CB',
      notes,
      incwo_receipt_id,
      created_by: created_by || 'manual',
    };

    const { data, error } = await supabase
      .from('store_sales')
      .insert([sale])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Erreur enregistrement', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sale: data,
      message: `Vente de ${total}€ enregistrée`,
    });
  } catch (error) {
    console.error('Store sale POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
