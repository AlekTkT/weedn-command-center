# MCP Setup Guide - Weedn Command Center

## Commandes d'Installation MCP

Exécute ces commandes dans Claude Code pour connecter les services externes:

### Services Marketing & CRM
```bash
# Klaviyo - Email Marketing (6.5k contacts)
claude mcp add klaviyo --transport http https://mcp.klaviyo.com/mcp

# Canva - Création visuels
claude mcp add --transport http canva https://mcp.canva.com/mcp

# Figma - Design
claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp
```

### DevOps & Monitoring
```bash
# Vercel - Déploiement
claude mcp add --transport http vercel https://mcp.vercel.com

# Sentry - Error tracking
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

### Productivité
```bash
# Notion - Documentation
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Linear - Project management
claude mcp add --transport http linear https://mcp.linear.app/mcp
```

### Services Additionnels Recommandés
```bash
# GitHub - Code & PRs
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Airtable - Base de données no-code
# (Requiert configuration via npx)

# Honeycomb - Observabilité
claude mcp add --transport http honeycomb https://mcp.honeycomb.io/mcp
```

## Authentification

Après avoir ajouté un serveur MCP, utilise la commande:
```
/mcp
```
Puis sélectionne "Authenticate" pour le service concerné.

## Vérification

Pour vérifier les MCP installés:
```bash
claude mcp list
```

Pour voir les détails d'un serveur:
```bash
claude mcp get klaviyo
```

## Scopes Disponibles

- `--scope local` (défaut): Disponible uniquement dans le projet courant
- `--scope project`: Partagé via `.mcp.json` (committé en git)
- `--scope user`: Disponible dans tous tes projets

## Configuration dans .mcp.json

Le fichier `.mcp.json` à la racine du projet contient la configuration partagée:
```json
{
  "mcpServers": {
    "klaviyo": {
      "type": "http",
      "url": "https://mcp.klaviyo.com/mcp"
    }
  }
}
```

## Utilisation

Une fois connecté, tu peux demander à Claude:
- "Check Klaviyo email performance for last campaign"
- "Deploy to Vercel staging"
- "Review latest Sentry errors"
- "Create a Canva design for Instagram post"
