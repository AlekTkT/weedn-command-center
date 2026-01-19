---
description: Synchronise les données entre Shopify, Supabase et le dashboard. Utilise pour forcer un refresh des données.
allowed-tools: Bash, WebFetch, Read
---

# Sync Data Command

Synchronise toutes les sources de données Weedn.

## Actions

1. **Vérifier la connexion Shopify**
   - Tester l'API avec un appel simple
   - Confirmer que les credentials sont valides

2. **Synchroniser les ventes Shopify**
   - Récupérer les commandes des dernières 24h
   - Mettre à jour le cache si nécessaire

3. **Vérifier Supabase**
   - Tester la connexion
   - Vérifier les dernières entrées store_sales

4. **Rapport de sync**
   ```
   🔄 SYNC COMPLETE
   ━━━━━━━━━━━━━━━━
   ✅ Shopify: OK (XX commandes)
   ✅ Supabase: OK (XX ventes boutique)
   ✅ Dashboard: Données à jour

   Dernière sync: [TIMESTAMP]
   ```

## Usage
```
/sync-data
```
