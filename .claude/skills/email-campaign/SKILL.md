---
name: email-campaign
description: Gere les campagnes Klaviyo, analyse les performances et optimise les segments pour les 6.5k contacts Weedn.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
mcp-servers: klaviyo
---

# Email Campaign - Gestion Campagnes Klaviyo

## Objectif
Orchestrer les campagnes email Klaviyo, analyser les performances et optimiser les segments pour maximiser l'engagement des 6,500 contacts Weedn.

## Connexion Klaviyo

### Via MCP Server
```bash
# Le MCP Klaviyo est configure dans .mcp.json
# Utiliser les outils mcp__klaviyo__* pour les operations
```

### Segments Disponibles
- VIP Customers (top 10% CA)
- Active Buyers (achat < 30j)
- At Risk (pas d'achat > 60j)
- New Subscribers (< 7j)
- CBD Enthusiasts
- Huiles & Fleurs
- Accessoires

## Types de Campagnes

### 1. Promotionnelles
- Soldes saisonnieres
- Flash sales
- Offres exclusives VIP

### 2. Relationnelles
- Bienvenue nouveaux abonnes
- Anniversaire client
- Reactivation inactifs

### 3. Transactionnelles
- Confirmation commande
- Expedition
- Demande d'avis

### 4. Educatives
- Newsletter CBD
- Guides d'utilisation
- Nouveaux produits

## Metriques a Suivre

| Metrique | Objectif | Seuil Alerte |
|----------|----------|--------------|
| Taux d'ouverture | > 25% | < 15% |
| Taux de clic | > 5% | < 2% |
| Taux de conversion | > 2% | < 0.5% |
| Desabonnements | < 0.5% | > 1% |
| Taux de rebond | < 2% | > 5% |

## Format de Rapport

```
PERFORMANCE EMAIL WEEDN
━━━━━━━━━━━━━━━━━━━━━━━
Periode: [DATE_DEBUT] - [DATE_FIN]

DERNIERE CAMPAGNE
├ Nom: [CAMPAGNE]
├ Envois: X,XXX
├ Ouvertures: XX.X%
├ Clics: X.X%
├ Conversions: X.X%
└ CA genere: XXX EUR

TENDANCES (30 jours)
├ Taux ouverture moyen: XX.X%
├ Taux clic moyen: X.X%
└ Revenus email: X,XXX EUR

TOP SEGMENTS
1. [Segment] - XX.X% ouverture
2. [Segment] - XX.X% ouverture
3. [Segment] - XX.X% ouverture

RECOMMANDATIONS
- [Actions basees sur les donnees]
```

## Workflow A/B Testing

1. Definir l'hypothese
2. Creer 2 variantes (sujet, contenu, CTA)
3. Envoyer a 20% de la liste
4. Attendre 4h pour resultats
5. Envoyer variante gagnante a 80%

## Automatisations Actives

- Welcome Series (3 emails sur 7 jours)
- Abandon panier (1h, 24h, 72h)
- Post-achat (J+3: avis, J+14: cross-sell)
- Reactivation (J+45, J+60, J+90)

## Bonnes Pratiques

- Envoyer entre 10h-12h ou 18h-20h
- Eviter lundi matin et vendredi apres-midi
- Personnaliser avec prenom et historique
- Mobile-first (60% ouvertures mobile)
- Emojis dans sujet (+15% ouverture)
