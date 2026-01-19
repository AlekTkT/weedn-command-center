import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE = 'f24081-64.myshopify.com';

// Endpoint pour modifier les produits Shopify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, data, requireApproval = true } = body;

    if (!SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Shopify non configuré' }, { status: 500 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 });
    }

    // Actions qui peuvent être exécutées directement (lecture)
    const directActions = ['get_product', 'list_products', 'check_inventory'];

    if (directActions.includes(action)) {
      // Exécution directe pour les actions de lecture
      if (action === 'get_product' && productId) {
        const response = await fetch(
          `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${productId}.json`,
          {
            headers: {
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        return NextResponse.json({ success: true, product: result.product });
      }

      if (action === 'check_inventory') {
        const response = await fetch(
          `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=50`,
          {
            headers: {
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        const inventory = result.products?.map((p: any) => ({
          id: p.id,
          title: p.title,
          totalStock: p.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0),
          status: p.status,
        }));
        return NextResponse.json({ success: true, inventory });
      }
    }

    // Actions de modification - nécessitent approbation ou exécution différée
    const actionRequest = {
      id: `action_${Date.now()}`,
      type: 'shopify_product',
      action,
      params: { productId, data },
      status: requireApproval ? 'pending_approval' : 'pending_execution',
      createdAt: new Date().toISOString(),
    };

    // TODO: Pour les modifications réelles, implémenter:
    // - update_product: PUT /products/{id}.json
    // - update_inventory: POST /inventory_levels/set.json
    // - update_price: PUT /variants/{id}.json

    return NextResponse.json({
      success: true,
      message: requireApproval
        ? 'Modification en attente d\'approbation'
        : 'Modification programmée',
      actionRequest,
    });
  } catch (error) {
    console.error('Shopify action error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    availableActions: [
      { action: 'get_product', description: 'Récupérer un produit', requiresApproval: false },
      { action: 'list_products', description: 'Lister les produits', requiresApproval: false },
      { action: 'check_inventory', description: 'Vérifier les stocks', requiresApproval: false },
      { action: 'update_product', description: 'Modifier un produit', requiresApproval: true },
      { action: 'update_price', description: 'Modifier un prix', requiresApproval: true },
      { action: 'update_inventory', description: 'Modifier le stock', requiresApproval: true },
    ],
  });
}
