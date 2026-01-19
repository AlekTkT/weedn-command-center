import { NextResponse } from 'next/server';
import {
  generateSupplierOrderEmail,
  generateCustomerSupportEmail,
  enhanceNegotiation,
  EmailDraft,
  SupplierOrderRequest,
  CustomerSupportRequest
} from '@/services/email-agent';

/**
 * GET /api/email-agent
 * Récupère les brouillons d'emails
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // supplier_order, customer_support, all

  // Les brouillons sont stockés côté client (localStorage)
  // Cette API retourne la configuration et les capacités

  return NextResponse.json({
    success: true,
    capabilities: {
      supplierOrder: {
        strategies: ['standard', 'aggressive', 'friendly', 'volume'],
        templates: ['firstOrder', 'recurringOrder', 'urgentNegotiation', 'volumeDiscount']
      },
      customerSupport: {
        issueTypes: ['shipping', 'product', 'refund', 'general', 'complaint'],
        templates: ['shippingIssue', 'productIssue', 'generalInquiry', 'complaint', 'positiveFollowup']
      }
    },
    agents: [
      {
        id: 'agent-negociateur',
        name: 'Agent Négociateur',
        description: 'Spécialiste des commandes fournisseurs et négociations',
        capabilities: ['supplier_order', 'supplier_negotiation'],
        style: 'Fin négociateur, utilise des techniques de persuasion'
      },
      {
        id: 'agent-support',
        name: 'Agent Support',
        description: 'Gestion des réponses clients',
        capabilities: ['customer_support', 'customer_followup'],
        style: 'Empathique, professionnel, orienté solution'
      }
    ],
    emailAccounts: [
      { email: 'cbdoshop75@gmail.com', type: 'primary', usage: 'support' },
      { email: 'theonlyweedn@gmail.com', type: 'secondary', usage: 'marketing' }
    ]
  });
}

/**
 * POST /api/email-agent
 * Génère un brouillon d'email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'generate_supplier_order': {
        const orderRequest: SupplierOrderRequest = data;

        if (!orderRequest.supplierEmail || !orderRequest.products?.length) {
          return NextResponse.json(
            { success: false, error: 'Email fournisseur et produits requis' },
            { status: 400 }
          );
        }

        const draft = generateSupplierOrderEmail(orderRequest);
        return NextResponse.json({
          success: true,
          draft,
          message: 'Brouillon de commande fournisseur généré'
        });
      }

      case 'generate_customer_support': {
        const supportRequest: CustomerSupportRequest = data;

        if (!supportRequest.customerEmail || !supportRequest.issueType) {
          return NextResponse.json(
            { success: false, error: 'Email client et type de demande requis' },
            { status: 400 }
          );
        }

        const draft = generateCustomerSupportEmail(supportRequest);
        return NextResponse.json({
          success: true,
          draft,
          message: 'Brouillon de réponse client généré'
        });
      }

      case 'enhance_negotiation': {
        const { draft, strategy } = data;

        if (!draft || !strategy) {
          return NextResponse.json(
            { success: false, error: 'Brouillon et stratégie requis' },
            { status: 400 }
          );
        }

        const enhanced = enhanceNegotiation(draft, strategy);
        return NextResponse.json({
          success: true,
          draft: enhanced,
          message: `Négociation améliorée avec stratégie: ${strategy}`
        });
      }

      case 'send_email': {
        const { draft, fromEmail } = data;

        if (!draft || !draft.to || !draft.subject || !draft.body) {
          return NextResponse.json(
            { success: false, error: 'Brouillon incomplet' },
            { status: 400 }
          );
        }

        // Note: L'envoi réel se fait via le MCP Gmail côté client
        // Cette API prépare les données pour le MCP
        return NextResponse.json({
          success: true,
          mcpCall: {
            tool: 'mcp__gmail-mcp__send_email',
            params: {
              to: draft.to,
              cc: draft.cc,
              subject: draft.subject,
              body: draft.body,
              mimeType: 'text/plain'
            }
          },
          message: 'Email prêt à être envoyé via Gmail MCP'
        });
      }

      case 'create_draft': {
        const { draft, fromEmail } = data;

        if (!draft || !draft.to || !draft.subject || !draft.body) {
          return NextResponse.json(
            { success: false, error: 'Brouillon incomplet' },
            { status: 400 }
          );
        }

        // Prépare l'appel MCP pour créer un brouillon Gmail
        return NextResponse.json({
          success: true,
          mcpCall: {
            tool: 'mcp__gmail-mcp__draft_email',
            params: {
              to: draft.to,
              cc: draft.cc,
              subject: draft.subject,
              body: draft.body,
              mimeType: 'text/plain'
            }
          },
          message: 'Brouillon prêt à être créé dans Gmail'
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur génération email' },
      { status: 500 }
    );
  }
}
