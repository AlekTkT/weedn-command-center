import { NextRequest, NextResponse } from 'next/server';

// Endpoint pour créer une campagne Klaviyo
// Les actions réelles sont exécutées via MCP depuis Claude Code

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, subject, listId, segmentId, content, requireApproval = true } = body;

    // Validation
    if (!action || !name) {
      return NextResponse.json({ error: 'Action et nom requis' }, { status: 400 });
    }

    // Pour l'instant, on stocke la demande d'action
    // Elle sera exécutée par Claude Code via MCP
    const actionRequest = {
      id: `action_${Date.now()}`,
      type: 'klaviyo_campaign',
      action,
      params: { name, subject, listId, segmentId, content },
      status: requireApproval ? 'pending_approval' : 'pending_execution',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      executedAt: null,
      result: null,
    };

    // TODO: Stocker dans Supabase
    // Pour l'instant, retourner la structure de l'action

    return NextResponse.json({
      success: true,
      message: requireApproval
        ? 'Action en attente d\'approbation'
        : 'Action programmée pour exécution',
      actionRequest,
      note: 'Cette action sera exécutée via Claude Code MCP',
    });
  } catch (error) {
    console.error('Klaviyo action error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    availableActions: [
      { action: 'create_campaign', description: 'Créer une nouvelle campagne email' },
      { action: 'create_template', description: 'Créer un template email' },
      { action: 'send_campaign', description: 'Envoyer une campagne' },
      { action: 'create_flow', description: 'Créer un flow automatisé' },
    ],
    requiredParams: {
      create_campaign: ['name', 'subject', 'listId OR segmentId'],
      create_template: ['name', 'html'],
      send_campaign: ['campaignId'],
      create_flow: ['name', 'trigger'],
    },
  });
}
