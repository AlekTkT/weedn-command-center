---
paths:
  - "src/app/api/**"
  - "src/services/**"
  - "src/components/Dashboard*"
alwaysApply: false
---

# Monitoring & Alertes Weedn

## Seuils d'Alerte

### CA Journalier
| Niveau | Condition | Action |
|--------|-----------|--------|
| CRITIQUE | CA < 50% objectif (< 1,050 EUR) | Notification immediate |
| ALERTE | CA < 80% objectif (< 1,680 EUR) | Investigation requise |
| ATTENTION | CA < 90% objectif (< 1,890 EUR) | Surveillance |
| OK | CA >= 90% objectif | Normal |

### Stock
| Niveau | Condition | Action |
|--------|-----------|--------|
| RUPTURE | 0 unites | Alerte immediate + reapprovisionnement |
| CRITIQUE | < 3 unites | Commande urgente |
| BAS | < 5 unites | Planifier reapprovisionnement |
| ATTENTION | < 10 unites | Surveiller |

### Email Marketing
| Metrique | Seuil Alerte | Action |
|----------|--------------|--------|
| Taux ouverture | < 15% | Revoir sujet/expediteur |
| Taux clic | < 2% | Revoir contenu/CTA |
| Desabonnements | > 1% | Revoir frequence/ciblage |
| Bounce rate | > 5% | Nettoyer liste |

### Performance Site
| Metrique | Seuil | Action |
|----------|-------|--------|
| LCP | > 2.5s | Optimiser images/CDN |
| FID | > 100ms | Optimiser JS |
| CLS | > 0.1 | Fixer layout shifts |
| Uptime | < 99.9% | Investigation Vercel |

### Erreurs (Sentry)
| Niveau | Condition | Action |
|--------|-----------|--------|
| CRITIQUE | Erreur 500 en prod | Fix immediat |
| HAUTE | > 10 erreurs/heure | Investigation |
| MOYENNE | Nouvelle erreur | Triage |
| BASSE | Erreur connue | Backlog |

## Format des Alertes

```
[NIVEAU] [CATEGORIE] - [MESSAGE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timestamp: [DATE/HEURE]
Valeur: [VALEUR_ACTUELLE]
Seuil: [SEUIL_DEPASSE]

Action recommandee:
[DESCRIPTION_ACTION]

Dashboard: https://weedn-command-center.vercel.app
```

## Notifications

### Canaux
- **Slack**: Alertes CA, stock, erreurs critiques
- **Email**: Resume quotidien, rapports hebdo
- **Dashboard**: Toutes les alertes en temps reel

### Frequence
- **Temps reel**: Erreurs critiques, ruptures stock
- **Horaire**: Check CA, performance site
- **Quotidien**: Resume KPIs, alertes actives
- **Hebdomadaire**: Rapport complet

## Regles de Code

Lors de la modification des fichiers d'API ou services:

1. **Toujours logger les erreurs** avec contexte suffisant
2. **Implementer des timeouts** pour les appels externes
3. **Gerer les cas d'erreur** Shopify/Supabase gracieusement
4. **Retourner des messages d'erreur** comprehensibles

### Pattern de Gestion d'Erreur

```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error('[SERVICE_NAME] Error:', {
    message: error.message,
    timestamp: new Date().toISOString(),
    context: { /* relevant data */ }
  });
  return { success: false, error: error.message };
}
```

## Metriques a Monitorer

### Business
- CA total (E-commerce + Boutique)
- Nombre de commandes
- Panier moyen
- Taux de conversion
- Nouveaux clients

### Technique
- Response time API
- Error rate
- Uptime
- Build time Vercel

### Marketing
- Open rate emails
- Click rate
- Unsubscribe rate
- Traffic sources
