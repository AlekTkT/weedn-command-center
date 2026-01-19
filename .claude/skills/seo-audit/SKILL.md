---
name: seo-audit
description: Audit SEO complet de weedn.fr avec analyse technique, mots-cles et recommandations d'optimisation.
allowed-tools: Read, Bash, WebFetch, Glob, Grep
---

# SEO Audit - Audit Referencement weedn.fr

## Objectif
Realiser un audit SEO complet du site weedn.fr pour identifier les opportunites d'amelioration et augmenter le trafic organique.

## Domaines a Analyser

### 1. SEO Technique
- Vitesse de chargement (Core Web Vitals)
- Mobile-friendliness
- Structure des URLs
- Sitemap XML
- Robots.txt
- HTTPS et securite
- Erreurs 404 et redirections

### 2. SEO On-Page
- Balises title et meta descriptions
- Structure des headings (H1-H6)
- Optimisation des images (alt, taille)
- Contenu duplique
- Maillage interne

### 3. SEO Off-Page
- Profil de backlinks
- Autorite du domaine
- Citations locales
- Presence reseaux sociaux

### 4. Contenu
- Qualite et longueur du contenu
- Mots-cles cibles
- Fraicheur du contenu
- Pages orphelines

## Mots-Cles Cibles CBD

| Mot-cle | Volume | Difficulte | Position |
|---------|--------|------------|----------|
| cbd france | 22,000 | Haute | ? |
| huile cbd | 14,800 | Moyenne | ? |
| fleur cbd | 9,900 | Moyenne | ? |
| cbd shop | 6,600 | Haute | ? |
| cbd pas cher | 4,400 | Basse | ? |

## Outils d'Analyse

### Core Web Vitals
```bash
# PageSpeed Insights API
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://weedn.fr"
```

### Structure du Site
```bash
# Verifier le sitemap
curl https://weedn.fr/sitemap.xml

# Verifier robots.txt
curl https://weedn.fr/robots.txt
```

## Format du Rapport

```
AUDIT SEO WEEDN.FR
━━━━━━━━━━━━━━━━━━
Date: [DATE]

SCORE GLOBAL: XX/100

TECHNIQUE [XX/100]
├ Vitesse mobile: X.Xs
├ Vitesse desktop: X.Xs
├ LCP: X.Xs
├ FID: XXms
├ CLS: X.XX
└ HTTPS: OK/KO

ON-PAGE [XX/100]
├ Titles optimises: XX%
├ Meta descriptions: XX%
├ Images avec alt: XX%
├ H1 uniques: XX%
└ URLs propres: XX%

CONTENU [XX/100]
├ Pages indexees: XXX
├ Contenu mince: X pages
├ Mots/page moyen: XXX
└ Derniere MAJ blog: [DATE]

BACKLINKS [XX/100]
├ Domaines referents: XX
├ Backlinks totaux: XXX
├ DA: XX
└ Spam score: X%

ACTIONS PRIORITAIRES
1. [Action critique] - Impact: Eleve
2. [Action importante] - Impact: Moyen
3. [Action recommandee] - Impact: Faible

MOTS-CLES A CIBLER
1. [mot-cle] - Volume: X,XXX - Quick win
2. [mot-cle] - Volume: X,XXX - Potentiel
```

## Checklist Audit

### Technique
- [ ] Verifier temps de chargement < 3s
- [ ] Tester responsive mobile
- [ ] Valider sitemap.xml
- [ ] Controler robots.txt
- [ ] Scanner erreurs 404
- [ ] Verifier HTTPS partout
- [ ] Tester structured data

### Contenu
- [ ] Auditer titles (< 60 caracteres)
- [ ] Auditer meta descriptions (< 160 caracteres)
- [ ] Verifier unicite H1
- [ ] Controler densité mots-clés
- [ ] Identifier contenu duplique
- [ ] Evaluer maillage interne

### Off-Page
- [ ] Analyser profil backlinks
- [ ] Identifier opportunites liens
- [ ] Verifier NAP consistency
- [ ] Auditer Google Business Profile

## Frequence Recommandee

- Audit complet: Mensuel
- Suivi positions: Hebdomadaire
- Core Web Vitals: Apres chaque deploy
- Backlinks: Bi-mensuel
