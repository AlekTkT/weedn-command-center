---
description: Affiche l'etat du stock avec alertes ruptures et produits en stock bas parmi les 157 references Weedn.
allowed-tools: Read, Bash, WebFetch
---

# Inventory Status - Etat Stock Rapide

Verifie l'inventaire Shopify et affiche les alertes stock.

## Actions

1. **Scanner l'inventaire**
   - Recuperer les 157 produits
   - Identifier les stocks critiques

2. **Classifier par urgence**
   - RUPTURE: 0 unites
   - CRITIQUE: < 3 unites
   - BAS: < 5 unites
   - ATTENTION: < 10 unites

3. **Afficher alertes**
   ```
   INVENTAIRE WEEDN
   ━━━━━━━━━━━━━━━━
   Total produits: 157

   RUPTURES (0)
   - [Produit] - SKU: XXX

   STOCK BAS (< 5)
   - [Produit] (X unites)

   Produits OK: XXX
   Produits a surveiller: XX
   ```

## Usage
```
/inventory-status
/stock
```
