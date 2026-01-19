# Weedn Command Center - Project Guidelines

## Project Overview
- **Name**: Weedn Command Center (QG Weedn)
- **Type**: Dashboard centralisé pour CBD Shop (boutique physique + e-commerce)
- **Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase, Shopify API
- **Production URL**: https://weedn-command-center.vercel.app
- **Objective**: +40% CA en 90 jours via coordination des 9 agents IA

## Business Context
- **Boutique physique**: 4 Rue Tiquetonne, Paris (système Incwo)
- **E-commerce**: weedn.fr (Shopify: f24081-64.myshopify.com)
- **157 produits CBD**: Fleurs, huiles, cosmétiques, accessoires
- **Segments clients**: Newsletter (6.5k), VIP, Inactifs

## Architecture des Agents

### Les 9 Agents Weedn
1. **Chef d'Orchestre** (weedn-central) - Coordination stratégique
2. **Agent Ventes** (agent-ventes) - Analyse commerciale
3. **Agent Inventaire** (agent-inventaire) - Gestion stocks
4. **Agent Email** (agent-email) - Klaviyo campaigns
5. **Agent SEO** (agent-seo) - Référencement
6. **Agent Contenu** (agent-contenu) - Rédaction marketing
7. **Agent Support** (agent-support) - Service client
8. **Agent Shopify** (agent-shopify) - Gestion boutique
9. **Agent Analytics** (agent-analytics) - Reporting données

## Integrations

### Connectées via MCP (prioritaire)
- **Klaviyo**: `claude mcp add klaviyo --transport http https://mcp.klaviyo.com/mcp`
- **Vercel**: `claude mcp add --transport http vercel https://mcp.vercel.com`
- **Notion**: `claude mcp add --transport http notion https://mcp.notion.com/mcp`
- **Canva**: `claude mcp add --transport http canva https://mcp.canva.com/mcp`
- **Figma**: `claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp`

### APIs Directes
- **Shopify Admin API**: Store f24081-64.myshopify.com
- **Supabase**: Database cmgpflxqunkrrbndtnne
- **Make.com**: Organization 864497, Token 95e514a4-d5be-4d91-99f2-5ef89efdee12
- **Google Analytics 4**: Trafic weedn.fr

## Code Standards

### TypeScript
- Strict mode enabled
- Interfaces over types for public APIs
- Async/await over .then() chains

### React/Next.js
- Functional components with hooks
- Server components by default, 'use client' when needed
- App Router patterns

### Database (Supabase)
- Row Level Security (RLS) enabled
- Parameterized queries only
- Migrations in `supabase/migrations/`

## Key Files
- `src/config/agents.ts` - Configuration des 9 agents
- `src/services/shopify.ts` - API Shopify
- `src/services/metaprompts.ts` - Génération tâches agents
- `src/app/api/tasks/route.ts` - API tâches
- `src/app/api/combined-metrics/route.ts` - Métriques combinées

## Common Commands
```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
vercel --prod        # Deploy to production
```

## Important Rules
- Toutes les modifications significatives nécessitent approbation d'Alex
- Ne jamais exposer les clés API dans le code
- Tester sur staging avant production
- Logger toutes les actions des agents dans Supabase
