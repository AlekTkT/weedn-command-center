import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSuppliersAsync,
  addSupplierAsync,
  getSuppliersStatsAsync,
  searchSuppliersAsync,
} from '@/services/suppliers';

export const dynamic = 'force-dynamic';

// GET - Liste des fournisseurs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    let suppliers;

    if (query) {
      suppliers = await searchSuppliersAsync(query);
    } else {
      suppliers = await getAllSuppliersAsync();
    }

    if (category) {
      suppliers = suppliers.filter(s => s.categories.includes(category));
    }

    const stats = await getSuppliersStatsAsync();

    return NextResponse.json({
      success: true,
      suppliers,
      stats,
      count: suppliers.length,
    });
  } catch (error) {
    console.error('Erreur GET suppliers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Ajouter un fournisseur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation minimale
    if (!body.name) {
      return NextResponse.json(
        { error: 'Le nom du fournisseur est requis' },
        { status: 400 }
      );
    }

    const newSupplier = await addSupplierAsync({
      name: body.name,
      legalName: body.legalName || body.name,
      type: body.type || 'Grossiste CBD',
      status: body.status || 'pending',
      contact: {
        name: body.contact?.name || '',
        phone: body.contact?.phone || '',
        email: body.contact?.email || '',
        whatsapp: body.contact?.whatsapp || '',
        address: body.contact?.address || '',
      },
      website: body.website || '',
      siret: body.siret || '',
      paymentTerms: body.paymentTerms || '',
      minOrderAmount: body.minOrderAmount || null,
      deliveryTime: body.deliveryTime || '',
      notes: body.notes || '',
      featuredProducts: body.featuredProducts || [],
      categories: body.categories || [],
      rating: body.rating || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Fournisseur ajouté',
      supplier: newSupplier,
    });
  } catch (error) {
    console.error('Erreur POST suppliers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}
