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
    const limit = searchParams.get('limit') || '50';

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=${limit}`,
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
    const products = data.products || [];

    // Analyser les produits
    const productsSummary = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      productType: p.product_type,
      vendor: p.vendor,
      variants: p.variants?.length || 0,
      totalInventory: p.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
      priceRange: {
        min: Math.min(...(p.variants?.map((v: any) => parseFloat(v.price) || 0) || [0])),
        max: Math.max(...(p.variants?.map((v: any) => parseFloat(v.price) || 0) || [0])),
      },
    }));

    // Produits en rupture ou stock faible
    const lowStock = productsSummary.filter((p: any) => p.totalInventory <= 5 && p.totalInventory > 0);
    const outOfStock = productsSummary.filter((p: any) => p.totalInventory === 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === 'active').length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
      lowStock,
      outOfStock,
      products: productsSummary.slice(0, 20),
    });
  } catch (error) {
    console.error('Shopify Products API Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
