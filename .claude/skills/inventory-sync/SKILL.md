---
name: inventory-sync
description: Synchronise l'inventaire entre Shopify et Supabase, detecte les stocks bas et genere des alertes de reapprovisionnement.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# Inventory Sync - Synchronisation Inventaire Weedn

## Objectif
Maintenir l'inventaire synchronise entre Shopify et Supabase, detecter les produits en stock bas et generer des alertes de reapprovisionnement.

## Sources de Donnees

### Shopify (157 produits)
- Endpoint: `/api/data` pour les produits et stocks
- Donnees: product_id, title, inventory_quantity, sku, barcode

### Supabase
- Table: `products` (cache local)
- Table: `inventory_alerts` (alertes generees)

## Seuils d'Alerte

| Niveau | Quantite | Action |
|--------|----------|--------|
| CRITIQUE | 0 unites | Alerte immediate + notification |
| BAS | < 5 unites | Alerte reapprovisionnement |
| ATTENTION | < 10 unites | Surveillance renforcee |
| OK | >= 10 unites | Aucune action |

## Etapes d'Execution

### 1. Recuperer l'inventaire Shopify
```bash
# Appeler l'API Shopify via le dashboard
curl https://weedn-command-center.vercel.app/api/data
```

### 2. Comparer avec Supabase
- Identifier les ecarts de stock
- Detecter les produits modifies

### 3. Generer les alertes
```
ALERTE INVENTAIRE WEEDN
━━━━━━━━━━━━━━━━━━━━━━

RUPTURES (0 unites)
- [Produit] - SKU: XXX

STOCK BAS (< 5 unites)
- [Produit] (X unites) - Commander: Y unites

ATTENTION (< 10 unites)
- [Produit] (X unites)

TOTAL: X produits a surveiller
```

### 4. Calculer les recommandations
- Quantite a commander basee sur:
  - Vitesse de vente (30 derniers jours)
  - Delai fournisseur
  - Stock de securite

## Format de Sortie

```
SYNC INVENTAIRE WEEDN
━━━━━━━━━━━━━━━━━━━━━
Timestamp: [DATE/HEURE]

RESUME
├ Produits synchronises: 157
├ Ruptures: X
├ Stock bas: Y
└ Modifications: Z

ACTIONS RECOMMANDEES
1. Commander [Produit] - Qte: X (Fournisseur: Y)
2. ...

Prochaine sync: [TIMESTAMP]
```

## Automatisation

- Frequence recommandee: Toutes les 6 heures
- Notification Slack si rupture critique
- Email recapitulatif quotidien
