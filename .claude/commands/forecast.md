---
description: Genere une prevision de CA pour les 30 prochains jours avec suivi objectif +40%.
allowed-tools: Read, Bash, WebFetch, Glob
---

# Forecast - Prevision CA 30 Jours

Calcule et affiche les previsions de revenus.

## Actions

1. **Analyser historique**
   - Recuperer ventes 30 derniers jours
   - Calculer tendance

2. **Appliquer coefficients**
   - Saisonnalite mensuelle
   - Jour de la semaine

3. **Generer prevision**
   ```
   PREVISION CA - 30 JOURS
   ━━━━━━━━━━━━━━━━━━━━━━━

   OBJECTIF +40%
   [████████░░] XX%
   Actuel: XX,XXX EUR
   Target: 63,000 EUR

   PREVISION MOIS
   Semaine 1: XX,XXX EUR
   Semaine 2: XX,XXX EUR
   Semaine 3: XX,XXX EUR
   Semaine 4: XX,XXX EUR
   ─────────────────────
   TOTAL: XX,XXX EUR

   SCENARIOS
   Pessimiste: XX,XXX EUR
   Base: XX,XXX EUR
   Optimiste: XX,XXX EUR

   ECART OBJECTIF: +/-X,XXX EUR
   ```

## Usage
```
/forecast
```
