import { NextRequest, NextResponse } from 'next/server';
import {
  getIncwoProducts,
  getProductCategories,
  createProduct,
  IncwoProduct
} from '@/services/incwo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Récupérer les produits et/ou catégories
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // 'products' | 'categories' | 'all'

  try {
    const result: {
      success: boolean;
      products?: IncwoProduct[];
      categories?: { id: number; name: string }[];
    } = { success: true };

    if (type === 'products' || type === 'all') {
      result.products = await getIncwoProducts();
    }

    if (type === 'categories' || type === 'all') {
      result.categories = await getProductCategories();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Incwo Products GET Error:', error);
    return NextResponse.json(
      { error: 'Erreur récupération produits Incwo', details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Créer un nouveau produit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, priceTTC, vatRate, categoryId, description, barcode } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      );
    }

    if (priceTTC === undefined || priceTTC === null || isNaN(parseFloat(priceTTC))) {
      return NextResponse.json(
        { error: 'Le prix TTC est requis et doit être un nombre' },
        { status: 400 }
      );
    }

    if (![0, 2.1, 5.5, 10, 20].includes(parseFloat(vatRate))) {
      return NextResponse.json(
        { error: 'Taux de TVA invalide (0, 2.1, 5.5, 10, ou 20)' },
        { status: 400 }
      );
    }

    const product: IncwoProduct = {
      name: name.trim(),
      priceTTC: parseFloat(priceTTC),
      vatRate: parseFloat(vatRate),
      price: 0, // Sera calculé par createProduct
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      description: description?.trim(),
      barcode: barcode?.trim(),
    };

    const result = await createProduct(product);

    if (result.success) {
      return NextResponse.json({
        success: true,
        productId: result.productId,
        message: `Produit "${name}" créé avec succès`,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur création produit' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Incwo Products POST Error:', error);
    return NextResponse.json(
      { error: 'Erreur création produit Incwo', details: String(error) },
      { status: 500 }
    );
  }
}
