---
name: revenue-forecast
description: Previsions de revenus 30/90 jours avec suivi de l'objectif +40% CA et ajustements saisonniers.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# Revenue Forecast - Previsions CA Weedn

## Objectif
Generer des previsions de revenus fiables pour atteindre l'objectif +40% CA (45k EUR -> 63k EUR/mois).

## Contexte Business

### Baseline
- **CA actuel**: ~45,000 EUR/mois
- **Objectif**: 63,000 EUR/mois (+40%)
- **Ecart a combler**: +18,000 EUR/mois
- **Timeline**: 90 jours

### Sources de Revenus
| Canal | Part | CA Mensuel |
|-------|------|------------|
| E-commerce (Shopify) | 70% | 31,500 EUR |
| Boutique physique | 30% | 13,500 EUR |

## Modele de Prevision

### Variables d'entree
1. **Historique ventes** (12 derniers mois)
2. **Tendance croissance** (MoM)
3. **Saisonnalite** (coefficients mensuels)
4. **Panier moyen** (evolution)
5. **Trafic** (sessions/visiteurs)
6. **Taux conversion** (CVR)

### Formule de base
```
CA prevu = Trafic x CVR x Panier moyen

Avec ajustements:
- Coefficient saisonnier
- Tendance lineaire
- Evenements speciaux (soldes, fetes)
```

### Coefficients Saisonniers CBD

| Mois | Coefficient | Notes |
|------|-------------|-------|
| Janvier | 0.85 | Post-fetes, calme |
| Fevrier | 0.90 | Reprise progressive |
| Mars | 1.00 | Normal |
| Avril | 1.05 | Printemps |
| Mai | 1.10 | Fete des meres |
| Juin | 1.05 | Debut ete |
| Juillet | 0.95 | Vacances |
| Aout | 0.90 | Creux estival |
| Septembre | 1.05 | Rentree |
| Octobre | 1.10 | Pre-fetes |
| Novembre | 1.20 | Black Friday |
| Decembre | 1.15 | Noel |

## Format du Rapport

```
PREVISIONS CA WEEDN
━━━━━━━━━━━━━━━━━━━
Genere le: [DATE]

OBJECTIF +40%
Progress: [████████░░] XX%
Actuel: XX,XXX EUR | Target: 63,000 EUR

PREVISIONS 30 JOURS
━━━━━━━━━━━━━━━━━━
Semaine 1: XX,XXX EUR [prevision]
Semaine 2: XX,XXX EUR [prevision]
Semaine 3: XX,XXX EUR [prevision]
Semaine 4: XX,XXX EUR [prevision]
────────────────────
TOTAL MOIS: XX,XXX EUR
vs Objectif: +/-X,XXX EUR (XX%)

PREVISIONS 90 JOURS
━━━━━━━━━━━━━━━━━━
Mois 1: XX,XXX EUR (coef: X.XX)
Mois 2: XX,XXX EUR (coef: X.XX)
Mois 3: XX,XXX EUR (coef: X.XX)
────────────────────
TOTAL Q: XXX,XXX EUR
Objectif Q: 189,000 EUR
Ecart: +/-XX,XXX EUR

HYPOTHESES
├ Panier moyen: XX EUR (+X%)
├ Trafic mensuel: XX,XXX (+X%)
├ CVR: X.XX% (+X.XX%)
└ Clients nouveaux: XXX/mois

SCENARIOS
━━━━━━━━━
Pessimiste (-10%): XX,XXX EUR/mois
Base: XX,XXX EUR/mois
Optimiste (+10%): XX,XXX EUR/mois

LEVIERS POUR ATTEINDRE +40%
━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Augmenter trafic: +XX% -> +X,XXX EUR
2. Ameliorer CVR: +X.X% -> +X,XXX EUR
3. Augmenter panier: +XX EUR -> +X,XXX EUR
4. Retention clients: +XX% -> +X,XXX EUR

ACTIONS PRIORITAIRES
1. [Action] - Impact estime: +X,XXX EUR
2. [Action] - Impact estime: +X,XXX EUR
3. [Action] - Impact estime: +X,XXX EUR
```

## Suivi des Ecarts

### KPIs a monitorer
| Indicateur | Objectif | Reel | Ecart |
|------------|----------|------|-------|
| CA mensuel | 63,000 | ? | ? |
| Panier moyen | 60 EUR | ? | ? |
| CVR | 3.0% | ? | ? |
| Commandes/jour | 35 | ? | ? |

### Alertes automatiques
- CA quotidien < 80% objectif: Alerte
- CVR < 2%: Investigation
- Panier moyen < 50 EUR: Action

## Calculs Avances

### Decomposition de l'objectif +40%
```
+18,000 EUR/mois =
  (+6,000) Augmentation trafic organique
+ (+4,000) Amelioration CVR
+ (+3,000) Augmentation panier moyen
+ (+3,000) Meilleure retention
+ (+2,000) Nouvelles sources (affiliation, B2B)
```

### ROI des Actions Marketing
```
ROI = (CA genere - Cout) / Cout x 100

Objectifs:
- Email: ROI > 4000%
- Paid social: ROI > 300%
- SEO: ROI > 1000% (long terme)
```

## Frequence de MAJ

- Prevision quotidienne: Chaque matin
- Prevision hebdomadaire: Lundi 9h
- Prevision mensuelle: 1er du mois
- Revue objectif 90j: Bi-mensuelle
