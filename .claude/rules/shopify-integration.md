---
paths:
  - "src/services/shopify.ts"
  - "src/app/api/data/**"
  - "src/app/api/shopify/**"
---

# Shopify Integration Rules

## API Configuration
- Store: f24081-64.myshopify.com
- API Version: 2024-01
- App: Agent-Weedn-IA

## Rate Limits
- Max 4 requests/second (REST API)
- Implement exponential backoff on 429 errors
- Cache responses for minimum 5 minutes

## Error Handling
```typescript
// Retry pattern
const MAX_RETRIES = 3;
const BACKOFF_MS = 1000;

async function shopifyRequest(endpoint: string, retries = 0) {
  try {
    const response = await fetch(endpoint, { headers });
    if (response.status === 429) {
      await sleep(BACKOFF_MS * Math.pow(2, retries));
      return shopifyRequest(endpoint, retries + 1);
    }
    return response.json();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      return shopifyRequest(endpoint, retries + 1);
    }
    throw error;
  }
}
```

## Data Security
- Never expose API keys in client-side code
- Use environment variables only
- Validate all inputs before API calls

## Common Endpoints
```
GET /admin/api/2024-01/products.json
GET /admin/api/2024-01/orders.json?status=any
GET /admin/api/2024-01/inventory_levels.json
GET /admin/api/2024-01/customers.json
```
