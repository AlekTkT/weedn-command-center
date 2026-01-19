import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE = 'f24081-64.myshopify.com';

export async function GET(request: NextRequest) {
  try {
    if (!SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Shopify non configuré' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status') || 'any';

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json?limit=${limit}&status=${status}`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'Erreur Shopify', details: error }, { status: response.status });
    }

    const data = await response.json();

    // Calculer les métriques
    const orders = data.orders || [];
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today));

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0);
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue: totalRevenue.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
      },
      orders: orders.slice(0, 5).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        totalPrice: o.total_price,
        currency: o.currency,
        createdAt: o.created_at,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status,
        customerEmail: o.email,
        itemCount: o.line_items?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Shopify API Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
