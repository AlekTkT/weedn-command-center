---
name: customer-analytics
description: Analyse comportementale des clients Weedn avec segmentation RFM, calcul LTV et prediction de churn.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# Customer Analytics - Analyse Clients Weedn

## Objectif
Analyser le comportement des clients Weedn pour optimiser la retention, augmenter la LTV et reduire le churn.

## Base Clients

- **Total contacts**: 6,500 (Klaviyo)
- **Clients actifs**: ~2,000 (achat < 90j)
- **Nouveaux clients/mois**: ~150
- **Taux de retention**: A calculer

## Segmentation RFM

### Matrice RFM (Recency, Frequency, Monetary)

| Segment | R | F | M | Action |
|---------|---|---|---|--------|
| Champions | 5 | 5 | 5 | Recompenser, program VIP |
| Loyaux | 4-5 | 3-5 | 3-5 | Upsell, cross-sell |
| Potentiels | 4-5 | 1-2 | 1-2 | Convertir en loyaux |
| Nouveaux | 5 | 1 | 1-2 | Onboarding, education |
| A risque | 2-3 | 3-5 | 3-5 | Reactiver d'urgence |
| Perdus | 1 | 1-2 | 1-2 | Campagne reconquete |

### Calcul des Scores

**Recency (R)** - Jours depuis dernier achat
- 5: < 7 jours
- 4: 7-30 jours
- 3: 31-60 jours
- 2: 61-90 jours
- 1: > 90 jours

**Frequency (F)** - Nombre d'achats (12 mois)
- 5: > 10 achats
- 4: 6-10 achats
- 3: 3-5 achats
- 2: 2 achats
- 1: 1 achat

**Monetary (M)** - CA total (12 mois)
- 5: > 500 EUR
- 4: 250-500 EUR
- 3: 100-250 EUR
- 2: 50-100 EUR
- 1: < 50 EUR

## Metriques Cles

### Customer Lifetime Value (LTV)
```
LTV = (Panier moyen) x (Frequence achat/an) x (Duree relation moyenne)

Objectif Weedn:
- Panier moyen: 55 EUR
- Frequence: 4x/an
- Duree: 2 ans
- LTV cible: 440 EUR
```

### Coût d'Acquisition Client (CAC)
```
CAC = (Depenses marketing) / (Nouveaux clients)

Ratio sain: LTV/CAC > 3
```

### Taux de Churn
```
Churn = (Clients perdus) / (Clients debut periode) x 100

Objectif: < 5% mensuel
```

## Format du Rapport

```
ANALYTICS CLIENTS WEEDN
━━━━━━━━━━━━━━━━━━━━━━━
Periode: [MOIS]

METRIQUES GLOBALES
├ Clients actifs: X,XXX
├ Nouveaux clients: XXX
├ Clients perdus: XX
├ Taux retention: XX%
└ Churn mensuel: X.X%

VALEUR CLIENT
├ LTV moyenne: XXX EUR
├ Panier moyen: XX EUR
├ Frequence achat: X.X/an
└ CAC: XX EUR (LTV/CAC: X.X)

SEGMENTATION RFM
├ Champions: XXX (XX%)
├ Loyaux: XXX (XX%)
├ Potentiels: XXX (XX%)
├ Nouveaux: XXX (XX%)
├ A risque: XXX (XX%)
└ Perdus: XXX (XX%)

TOP 10 CLIENTS (CA 12 mois)
1. [Client] - X,XXX EUR (XX commandes)
2. ...

COHORTES D'ACQUISITION
├ M-1: XXX clients, XX% retenus
├ M-2: XXX clients, XX% retenus
└ M-3: XXX clients, XX% retenus

ACTIONS RECOMMANDEES
1. Reactiver XX clients "A risque"
2. Upsell XX "Potentiels" vers "Loyaux"
3. Programme VIP pour XX "Champions"
```

## Predictions Churn

### Signaux d'alerte
- Pas d'achat depuis 45+ jours
- Reduction frequence achat
- Baisse panier moyen
- Desabonnement newsletter
- Ticket support negatif

### Actions preventives
1. Email personnalise J+30
2. Offre exclusive J+45
3. Appel commercial J+60
4. Derniere chance J+75

## Integration Donnees

### Sources
- Shopify: Commandes, clients
- Klaviyo: Engagement email
- GA4: Comportement site
- Supabase: Donnees enrichies

### Frequence MAJ
- Scores RFM: Hebdomadaire
- LTV: Mensuel
- Churn prediction: Quotidien
- Cohortes: Mensuel
