---
name: daily-report
description: Génère le rapport quotidien complet Weedn avec KPIs, ventes, alertes et tâches. Utilise chaque matin pour le point business.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# Rapport Quotidien Weedn

## Objectif
Générer un rapport complet de la journée précédente et des priorités du jour.

## Sources de Données à Consulter

### 1. Données Ventes
- Appeler `/api/combined-metrics` pour les métriques combinées
- Vérifier `/api/data` pour les données Shopify
- Vérifier `/api/store-sales` pour les ventes boutique

### 2. Données Stock
- Identifier les produits en stock bas (< 5 unités)
- Alerter sur les ruptures (0 unités)

### 3. Emails (Klaviyo)
- Performance des campagnes récentes
- Taux d'ouverture et clics

## Format du Rapport

```
📊 RAPPORT QUOTIDIEN WEEDN
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 [DATE] | Par le Chef d'Orchestre

🎯 OBJECTIF +40% CA
Progress: ████████░░ [XX]%
Actuel: [XX,XXX]€ / Target: 63,000€

💰 VENTES HIER
━━━━━━━━━━━━━
CA Total: [XXX]€
├ E-commerce: [XX]€ (XX%)
└ Boutique: [XX]€ (XX%)

Commandes: [XX]
Panier moyen: [XX]€

📦 ALERTES STOCK
━━━━━━━━━━━━━━━
🚨 Ruptures: [X produits]
⚠️ Stock bas: [X produits]

📧 EMAIL MARKETING
━━━━━━━━━━━━━━━━━
Dernière campagne: [Nom]
Taux ouverture: [XX]%
Taux clic: [XX]%

✅ ACTIONS AGENTS HIER
━━━━━━━━━━━━━━━━━━━━━
[Liste des actions réalisées]

📋 PRIORITÉS AUJOURD'HUI
━━━━━━━━━━━━━━━━━━━━━━━
1. [Priorité 1]
2. [Priorité 2]
3. [Priorité 3]

💡 RECOMMANDATIONS
━━━━━━━━━━━━━━━━━
[Suggestions basées sur les données]
```

## Étapes d'Exécution

1. **Collecter les données**
   - Lire les fichiers de config pour les endpoints
   - Appeler les APIs nécessaires

2. **Analyser les métriques**
   - Comparer avec la veille
   - Calculer les tendances

3. **Identifier les alertes**
   - Stock bas/ruptures
   - Anomalies de ventes

4. **Générer les recommandations**
   - Actions prioritaires
   - Opportunités identifiées

5. **Formater le rapport**
   - Utiliser le template ci-dessus
   - Adapter selon les données disponibles
