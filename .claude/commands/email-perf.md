---
description: Affiche les performances des campagnes email Klaviyo des 7 derniers jours.
allowed-tools: Read, Bash, WebFetch
mcp-servers: klaviyo
---

# Email Performance - Metriques Klaviyo

Recupere et affiche les performances email des 7 derniers jours.

## Actions

1. **Recuperer metriques Klaviyo**
   - Via MCP server klaviyo
   - Derniere campagne envoyee
   - Metriques globales 7 jours

2. **Analyser performances**
   - Comparer aux benchmarks
   - Identifier anomalies

3. **Afficher rapport**
   ```
   EMAIL PERFORMANCE - 7 JOURS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━

   DERNIERE CAMPAGNE
   Nom: [Campagne]
   Envois: X,XXX
   Ouvertures: XX.X% [OK/BAS]
   Clics: X.X% [OK/BAS]

   MOYENNE 7 JOURS
   ├ Taux ouverture: XX.X%
   ├ Taux clic: X.X%
   └ Desabonnements: X.X%

   RECOMMANDATION
   [Conseil base sur les donnees]
   ```

## Usage
```
/email-perf
/campaign-status
```
