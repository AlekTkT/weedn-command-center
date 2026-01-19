---
description: Liste tous les agents Weedn disponibles avec leur role et statut.
allowed-tools: Read, Glob
---

# Agents - Liste des Agents Weedn

Affiche tous les agents disponibles et leur configuration.

## Actions

1. **Lister les agents**
   - Lire `.claude/agents/`
   - Extraire nom, description, modele

2. **Afficher**
   ```
   AGENTS WEEDN
   ━━━━━━━━━━━━

   COORDINATION
   chef-orchestre [Opus]
   └ Coordination strategique, rapports quotidiens

   OPERATIONS
   agent-ventes [Sonnet]
   └ Analyse CA, panier moyen, opportunites

   agent-inventaire [Sonnet]
   └ Stock 157 produits, alertes rupture

   agent-shopify [Sonnet]
   └ Gestion boutique en ligne

   MARKETING
   agent-email [Sonnet]
   └ Campagnes Klaviyo, segments 6.5k contacts

   agent-seo [Sonnet]
   └ Audit SEO weedn.fr, mots-cles

   agent-contenu [Sonnet]
   └ Articles blog, fiches produits

   SUPPORT
   agent-support [Sonnet]
   └ Service client, FAQ

   ANALYTICS
   agent-analytics [Sonnet]
   └ KPIs, rapports, tendances

   UTILISATION
   Use the [agent-name] agent to [task]
   Example: Use the agent-ventes agent to analyze today's sales
   ```

## Usage
```
/agents
```
