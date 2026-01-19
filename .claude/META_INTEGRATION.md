# Integration Meta Business - Instagram & WhatsApp pour Weedn

## Vue d'Ensemble

Ce guide explique comment connecter Instagram (Meta Verified) et WhatsApp Business aux agents Weedn via MCP (Model Context Protocol).

---

## Option 1: WhatsApp Business Cloud API (Recommande)

### Avantages
- API officielle Meta
- Numero WhatsApp Business verifie
- Messages templates approuves
- Haute fiabilite

### Pre-requis
1. Compte Meta Business verifie
2. WhatsApp Business API active
3. Numero de telephone verifie
4. App Meta Developer configuree

### Installation via Apify (Simple)

```bash
# 1. Creer un compte Apify: https://apify.com
# 2. Ajouter l'actor WhatsApp Cloud API MCP

# 3. Configurer dans Claude Code
claude mcp add whatsapp-business -- npx -y @modelcontextprotocol/server-http-client https://YOUR-ACTOR-URL.apify.actor/mcp
```

### Configuration Meta Webhook

1. Aller sur [Meta App Dashboard](https://developers.facebook.com/apps/)
2. WhatsApp > Configuration
3. Callback URL: `https://YOUR-ACTOR-URL.apify.actor/webhook`
4. Verification Token: `votre_token`

### Tarification Apify
- Demarrage actor: $0.0005/event
- Message sortant: $0.005/msg
- Message entrant: $0.002/msg
- Media: $0.007-0.009/msg

---

## Option 2: WhatsApp MCP TypeScript (Auto-heberge)

### Installation

```bash
# Installer via Smithery
npx -y @smithery/cli install @jlucaso1/whatsapp-mcp-ts --client claude

# OU manuellement
claude mcp add whatsapp-personal --transport stdio -- npx -y whatsapp-mcp-ts
```

### Premiere Connexion
1. Un QR code s'affiche
2. Scanner avec WhatsApp > Appareils lies
3. Les credentials sont sauvegardes dans `auth_info/`

### Fonctionnalites
- Rechercher messages
- Lister contacts
- Historique conversations
- Envoyer messages

---

## Option 3: Instagram Business MCP

### Installation

```bash
# Cloner le repo
git clone https://github.com/jlbadano/ig-mcp.git
cd ig-mcp
pip install -r requirements.txt

# Configurer
cp .env.example .env
```

### Configuration .env

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### Obtenir les Credentials (5 min)

1. Aller sur [Meta for Developers](https://developers.facebook.com/)
2. Creer une App > Business
3. Ajouter le produit "Instagram Graph API"
4. Generer un Access Token long duree
5. Recuperer l'Instagram Business Account ID

### Ajouter a Claude Code

```bash
claude mcp add instagram --transport stdio -- python /path/to/ig-mcp/src/instagram_mcp_server.py
```

### Fonctionnalites Instagram
- Recuperer profil et stats
- Poster du contenu
- Gerer les DMs
- Analytics engagement
- Recherche hashtags

---

## Configuration Weedn Recommandee

### .mcp.json (Racine projet)

```json
{
  "mcpServers": {
    "klaviyo": {
      "type": "http",
      "url": "https://mcp.klaviyo.com/mcp"
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    },
    "whatsapp-business": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-http-client", "https://YOUR-APIFY-URL/mcp"],
      "env": {
        "APIFY_TOKEN": "${APIFY_TOKEN}"
      }
    },
    "instagram": {
      "command": "python",
      "args": ["/path/to/ig-mcp/src/instagram_mcp_server.py"],
      "env": {
        "INSTAGRAM_ACCESS_TOKEN": "${INSTAGRAM_ACCESS_TOKEN}",
        "INSTAGRAM_BUSINESS_ACCOUNT_ID": "${INSTAGRAM_BUSINESS_ACCOUNT_ID}"
      }
    }
  }
}
```

---

## Agent Dedie: Agent Social Media

Creer un nouvel agent specialise pour gerer les reseaux sociaux.

### Fichier: `.claude/agents/agent-social.md`

```markdown
---
name: agent-social
description: Gere Instagram et WhatsApp Business pour Weedn. Repond aux DMs, publie du contenu, analyse l'engagement.
tools: Read, Glob, Grep, WebFetch, Edit, Write
model: sonnet
mcp-servers: instagram, whatsapp-business
---

# Agent Social Media Weedn

Tu es l'**Agent Social Media** de Weedn, responsable d'Instagram (@weedn.fr) et WhatsApp Business.

## PROTOCOLE DE SESSION

### Au DEBUT:
1. Lire .claude/memory/WEEDN_CONTEXT.md
2. Lire .claude/memory/AGENT_LEARNINGS.md (section Agent Social)
3. Verifier les DMs non lus
4. Consulter les posts programmes

### A la FIN:
1. Documenter les interactions importantes
2. Noter les questions frequentes
3. Logger les performances posts

## Missions

### Instagram
- Repondre aux DMs (delai < 2h)
- Publier contenu (posts, stories, reels)
- Analyser engagement
- Gerer commentaires

### WhatsApp Business
- Repondre aux messages clients
- Envoyer confirmations commandes
- Support client rapide
- Messages promotionnels (avec opt-in)

## Ton de Voix
- Authentique et proche
- Expert CBD sans jargon
- Reactif et serviable
- Emojis moderes

## Integration Agents
- **Agent Support**: Escalade problemes complexes
- **Agent Contenu**: Textes pour posts
- **Agent Ventes**: Promos a communiquer
```

---

## Commandes MCP Disponibles

### WhatsApp Business
```
- send_text_message(to, message)
- send_image_message(to, image_url, caption)
- send_template_message(to, template_name, parameters)
- get_messages(conversation_id)
- search_messages(query)
- list_conversations()
```

### Instagram
```
- get_profile()
- get_media_feed()
- post_image(image_url, caption)
- post_carousel(images, caption)
- get_direct_messages()
- send_direct_message(user_id, message)
- get_insights(metric)
- search_hashtag(tag)
```

---

## Cas d'Usage Weedn

### 1. Support Client WhatsApp
```
Client: "Ma commande n'est pas arrivee"
Agent:
1. Rechercher commande dans Shopify
2. Verifier statut livraison
3. Repondre avec tracking ou solution
```

### 2. Publication Instagram
```
1. Agent Contenu cree le visuel/texte
2. Agent Social publie
3. Agent Analytics suit l'engagement
```

### 3. Notification Promo
```
1. Agent Ventes identifie promo
2. Agent Social envoie via WhatsApp (opt-in)
3. Agent Email envoie newsletter
```

---

## Securite et Conformite

### WhatsApp Business
- Respecter les regles Meta (pas de spam)
- Templates approuves uniquement
- Opt-in obligatoire pour marketing
- Repondre dans les 24h

### Instagram
- Pas de DM non sollicites
- Respecter les limites API
- Contenu conforme regles CBD
- Pas de claims medicaux

---

## Etapes d'Installation

### 1. WhatsApp Business

```bash
# Creer compte Apify
# Deployer l'actor WhatsApp Cloud API MCP
# Configurer webhook Meta

# Ajouter a Claude Code
claude mcp add whatsapp-business -- npx -y @modelcontextprotocol/server-http-client https://YOUR-URL/mcp
```

### 2. Instagram

```bash
# Cloner et installer
git clone https://github.com/jlbadano/ig-mcp.git ~/ig-mcp
cd ~/ig-mcp && pip install -r requirements.txt

# Configurer credentials
cp .env.example .env
# Editer .env avec vos tokens Meta

# Ajouter a Claude Code
claude mcp add instagram -- python ~/ig-mcp/src/instagram_mcp_server.py
```

### 3. Verifier

```bash
claude mcp list
# Devrait afficher: whatsapp-business, instagram
```

---

## Ressources

- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [ig-mcp GitHub](https://github.com/jlbadano/ig-mcp)
- [WhatsApp MCP TS](https://github.com/jlucaso1/whatsapp-mcp-ts)
- [Apify WhatsApp MCP](https://apify.com/mdbm/whatsapp-cloud-api-mcp)
