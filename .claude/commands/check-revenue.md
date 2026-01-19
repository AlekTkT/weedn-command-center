---
description: Verifie le CA du jour et compare avec l'objectif +40%. Affiche un resume rapide des performances.
allowed-tools: Read, Bash, WebFetch
---

# Check Revenue - Verification CA Rapide

Recupere le CA du jour depuis Shopify et la boutique, calcule la progression vers l'objectif.

## Actions

1. **Recuperer CA du jour**
   - Appeler `/api/combined-metrics`
   - Extraire CA e-commerce + boutique

2. **Calculer progression**
   - Objectif journalier: 2,100 EUR (63,000/30)
   - Comparer avec realise

3. **Afficher resume**
   ```
   CA WEEDN - [DATE]
   ━━━━━━━━━━━━━━━━━

   Aujourd'hui: X,XXX EUR
   ├ E-commerce: XXX EUR
   └ Boutique: XXX EUR

   Objectif jour: 2,100 EUR
   Status: [OK/ALERTE]

   Mois en cours: XX,XXX EUR
   Progress +40%: [████░░░░░░] XX%
   ```

## Usage
```
/check-revenue
```
