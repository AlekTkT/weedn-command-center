import { NextResponse } from 'next/server';

// Cette route sert de proxy pour les données Klaviyo
// Les vraies données sont récupérées via MCP dans l'API Claude

export async function GET() {
  return NextResponse.json({
    message: 'Klaviyo data accessible via MCP',
    note: 'Les données Klaviyo sont intégrées directement dans les prompts des agents via MCP',
  });
}
