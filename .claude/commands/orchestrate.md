---
description: Lance le Chef d'Orchestre pour coordonner les agents Weedn et exécuter les tâches prioritaires.
allowed-tools: Read, Bash, WebFetch, Glob, Grep, Edit, Write
---

# Orchestrate Command - Chef d'Orchestre Weedn

Lance une session de coordination complète avec le Chef d'Orchestre.

## Processus

### 1. Analyse de la Situation
- Récupérer les KPIs actuels
- Identifier les alertes en cours
- Évaluer la progression objectif +40%

### 2. Génération des Tâches
- Utiliser le service metaprompts pour générer les tâches
- Prioriser par impact sur le CA
- Assigner aux agents appropriés

### 3. Exécution Coordonnée
- Déléguer aux subagents spécialisés:
  - `agent-ventes` pour analyse commerciale
  - `agent-inventaire` pour alertes stock
  - `agent-email` pour campagnes
  - `agent-analytics` pour rapports

### 4. Reporting
- Consolider les résultats
- Générer le rapport d'exécution
- Identifier les prochaines actions

## Output Format

```
👑 CHEF D'ORCHESTRE - SESSION [ID]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ÉTAT ACTUEL
- CA Mois: XX,XXX€
- Objectif: 63,000€
- Progress: XX%

📋 TÂCHES EXÉCUTÉES
[Liste des tâches avec statut]

🤖 AGENTS MOBILISÉS
[Liste des agents et leurs actions]

✅ RÉSULTATS
[Résumé des accomplissements]

⏭️ PROCHAINES ÉTAPES
[Actions à venir]
```

## Usage
```
/orchestrate
```
