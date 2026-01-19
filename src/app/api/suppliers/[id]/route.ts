import { NextRequest, NextResponse } from 'next/server';
import {
  getSupplierAsync,
  updateSupplierAsync,
  deleteSupplierAsync,
  addFeaturedProductAsync,
  removeFeaturedProductAsync,
} from '@/services/suppliers';

export const dynamic = 'force-dynamic';

// GET - Détails d'un fournisseur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await getSupplierAsync(params.id);

    if (!supplier) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error('Erreur GET supplier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un fournisseur
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateSupplierAsync(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fournisseur mis à jour',
      supplier: updated,
    });
  } catch (error) {
    console.error('Erreur PUT supplier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fournisseur
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteSupplierAsync(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Fournisseur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fournisseur supprimé',
    });
  } catch (error) {
    console.error('Erreur DELETE supplier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Ajouter/supprimer un produit phare
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, product, productName } = body;

    if (action === 'add_product' && product) {
      const success = await addFeaturedProductAsync(params.id, {
        name: product.name,
        category: product.category || '',
        wholesalePrice: product.wholesalePrice || 0,
        recommendedRetailPrice: product.recommendedRetailPrice || 0,
        margin: product.margin || '',
        minQuantity: product.minQuantity || 1,
        inStock: product.inStock !== false,
        quality: product.quality || 'Standard',
        thcLevel: product.thcLevel || '<0.3%',
        cbdLevel: product.cbdLevel || '',
        notes: product.notes || '',
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Fournisseur non trouvé' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Produit ajouté',
      });
    }

    if (action === 'remove_product' && productName) {
      const success = await removeFeaturedProductAsync(params.id, productName);

      if (!success) {
        return NextResponse.json(
          { error: 'Fournisseur ou produit non trouvé' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Produit supprimé',
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur PATCH supplier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}
