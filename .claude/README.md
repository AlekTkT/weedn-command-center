# Configuration Claude Code - Weedn Command Center

## Structure Complete

```
.claude/
├── CLAUDE.md              # Guidelines projet (objectifs, architecture, regles)
├── README.md              # Ce fichier
├── MCP_SETUP.md           # Guide installation MCP servers
├── settings.json          # Permissions et configuration
│
├── agents/                # 10 subagents Weedn
│   ├── chef-orchestre.md  # Coordination (Opus) - Orchestration strategique
│   ├── agent-ventes.md    # Analyse commerciale - CA, panier, tendances
│   ├── agent-inventaire.md # Gestion stocks - 157 produits, alertes
│   ├── agent-email.md     # Campagnes Klaviyo - 6.5k contacts
│   ├── agent-seo.md       # Referencement - weedn.fr
│   ├── agent-contenu.md   # Redaction marketing - Blog, fiches
│   ├── agent-support.md   # Service client - FAQ, tickets
│   ├── agent-shopify.md   # Gestion boutique - Produits, commandes
│   ├── agent-analytics.md # Reporting - KPIs, dashboards
│   └── agent-social.md    # Instagram + WhatsApp Business (NEW)
│
├── memory/                # Systeme de memoire persistante
│   ├── WEEDN_CONTEXT.md   # Contexte partage par tous les agents
│   └── AGENT_LEARNINGS.md # Journal des apprentissages
│
├── rules/                 # Regles contextuelles (4 fichiers)
│   ├── shopify-integration.md  # Rate limits, endpoints, best practices
│   ├── database-queries.md     # Supabase, RLS, securite
│   ├── security.md             # Authentification, credentials
│   └── monitoring.md           # Alertes, seuils, notifications
│
├── skills/                # Workflows reutilisables (6 skills)
│   ├── daily-report/
│   │   └── SKILL.md       # Rapport quotidien complet
│   ├── inventory-sync/
│   │   └── SKILL.md       # Synchronisation inventaire
│   ├── email-campaign/
│   │   └── SKILL.md       # Gestion campagnes Klaviyo
│   ├── seo-audit/
│   │   └── SKILL.md       # Audit SEO weedn.fr
│   ├── customer-analytics/
│   │   └── SKILL.md       # Segmentation RFM, LTV
│   └── revenue-forecast/
│       └── SKILL.md       # Previsions CA 30/90 jours
│
└── commands/              # Slash commands (8 commandes)
    ├── orchestrate.md     # /orchestrate - Lance le Chef d'Orchestre
    ├── sync-data.md       # /sync-data - Synchronise les donnees
    ├── check-revenue.md   # /check-revenue - CA du jour
    ├── inventory-status.md # /inventory-status - Etat stock
    ├── email-perf.md      # /email-perf - Performance Klaviyo
    ├── forecast.md        # /forecast - Previsions 30 jours
    ├── agents.md          # /agents - Liste des agents
    └── daily-briefing.md  # /daily-briefing - Briefing matinal

.mcp.json                  # Configuration MCP servers (racine projet)
```

## Agents Disponibles

| Agent | Model | Description |
|-------|-------|-------------|
| `chef-orchestre` | Opus | Coordination strategique, rapports quotidiens |
| `agent-ventes` | Sonnet | Analyse CA, panier moyen, opportunites |
| `agent-inventaire` | Sonnet | Stock 157 produits, alertes rupture |
| `agent-email` | Sonnet | Campagnes Klaviyo, segments 6.5k contacts |
| `agent-seo` | Sonnet | Audit SEO weedn.fr, mots-cles |
| `agent-contenu` | Sonnet | Articles blog, fiches produits |
| `agent-support` | Sonnet | Service client, FAQ |
| `agent-shopify` | Sonnet | Gestion boutique en ligne |
| `agent-analytics` | Sonnet | KPIs, rapports, tendances |
| `agent-social` | Sonnet | **NEW** Instagram + WhatsApp Business |

## Utilisation

### Lancer un agent specifique
```
Use the chef-orchestre agent to generate the daily report
Use the agent-ventes agent to analyze today's sales
Use the agent-inventaire agent to check low stock products
```

### Commandes slash disponibles
```
/orchestrate       # Lance la coordination complete
/sync-data         # Synchronise Shopify + Supabase
/check-revenue     # Verifie le CA du jour
/inventory-status  # Etat du stock
/email-perf        # Performance Klaviyo 7 jours
/forecast          # Previsions CA 30 jours
/agents            # Liste des agents disponibles
/daily-briefing    # Briefing matinal complet
/mcp               # Gerer les connexions MCP
```

### Utiliser un skill
```
Use the daily-report skill to generate this morning's report
Use the inventory-sync skill to sync products with Supabase
Use the seo-audit skill to audit weedn.fr
Use the customer-analytics skill to segment our customers
Use the revenue-forecast skill to project next month's revenue
```

## MCP Servers Configures

| Service | Usage | URL/Type |
|---------|-------|----------|
| **klaviyo** | Email marketing | https://mcp.klaviyo.com/mcp |
| **vercel** | Deploiement | https://mcp.vercel.com |
| **notion** | Documentation | https://mcp.notion.com/mcp |
| **canva** | Design | https://mcp.canva.com/mcp |
| **figma** | UI/UX | https://mcp.figma.com/mcp |
| **sentry** | Error tracking | https://mcp.sentry.dev/mcp |
| **linear** | Project management | https://mcp.linear.app/mcp |
| **instagram** | Social media (NEW) | ig-mcp (local) |
| **whatsapp-business** | Messaging (NEW) | Cloud API MCP |

Pour s'authentifier: `/mcp` puis selectionner le service.

### Integration Meta Business (NEW)

Voir `META_INTEGRATION.md` pour les instructions completes d'installation:
- Instagram: DMs, posts, stories, analytics
- WhatsApp Business: Messages, templates, support client

## Objectif Business

**+40% CA en 90 jours**
- Baseline: 45,000 EUR/mois
- Target: 63,000 EUR/mois
- Canaux: E-commerce (Shopify) + Boutique physique (Incwo/Supabase)

## Variables d'Environnement

```
SHOPIFY_STORE=f24081-64.myshopify.com
WEEDN_REVENUE_TARGET_CURRENT=45000
WEEDN_REVENUE_TARGET_GOAL=63000
WEEDN_PRODUCTS_COUNT=157
WEEDN_CUSTOMER_BASE=6500
```

## Permissions

### Autorisees
- Commandes npm, git, vercel
- Lecture/ecriture src/, public/, .claude/
- WebFetch vers Shopify, Supabase, Klaviyo, Make.com
- Tous les MCP configures

### Interdites
- Lecture fichiers .env
- Commandes destructives (rm -rf, DROP, TRUNCATE)
- Publication npm

### Demandent confirmation
- git push
- Deploiement production Vercel
- Modifications API endpoints

## Documentation

- Voir `CLAUDE.md` pour les guidelines detaillees
- Voir `MCP_SETUP.md` pour les commandes d'installation MCP
- Voir `rules/` pour les regles specifiques par contexte
- Voir `skills/` pour les workflows disponibles
- Voir `commands/` pour les commandes slash

## Quick Start

1. **Briefing matinal**: `/daily-briefing`
2. **Verifier le CA**: `/check-revenue`
3. **Etat du stock**: `/inventory-status`
4. **Orchestration complete**: `/orchestrate`
