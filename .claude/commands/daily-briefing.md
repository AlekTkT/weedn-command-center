---
description: Briefing matinal complet avec KPIs, alertes, taches du jour et recommandations prioritaires.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# Daily Briefing - Briefing Matinal Weedn

Genere un briefing complet pour demarrer la journee.

## Actions

1. **Collecter les KPIs**
   - CA veille (Shopify + boutique)
   - Commandes et panier moyen
   - Stock critique

2. **Verifier les alertes**
   - Ruptures de stock
   - Emails en echec
   - Erreurs Sentry

3. **Lister les priorites**
   - Taches en attente
   - Actions recommandees

4. **Generer le briefing**
   ```
   BRIEFING WEEDN - [DATE]
   ━━━━━━━━━━━━━━━━━━━━━━━

   RESUME HIER
   CA Total: X,XXX EUR (+/-XX%)
   ├ E-commerce: XXX EUR
   └ Boutique: XXX EUR
   Commandes: XX | Panier: XX EUR

   OBJECTIF +40%
   [████████░░] XX%
   Reste: X,XXX EUR pour objectif mois

   ALERTES
   Ruptures: X produits
   Stock bas: X produits
   Erreurs: X (Sentry)

   PRIORITES DU JOUR
   1. [Tache prioritaire]
   2. [Tache importante]
   3. [Tache normale]

   RECOMMANDATION IA
   [Conseil base sur l'analyse des donnees]

   Bonne journee!
   ```

## Usage
```
/daily-briefing
/morning
```
