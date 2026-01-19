---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Security Rules

## API Keys & Secrets
- NEVER commit API keys to git
- Use environment variables only
- Rotate keys quarterly
- Different keys for dev/staging/prod

## Files to Never Read/Modify
- .env
- .env.local
- .env.production
- credentials.json
- Any file containing "secret" or "key" in name

## Input Validation
```typescript
// Always validate user input
function validateSaleAmount(amount: string): number {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0 || parsed > 100000) {
    throw new Error('Invalid amount');
  }
  return parsed;
}
```

## OWASP Top 10 Prevention
1. **Injection**: Use parameterized queries only
2. **Auth**: Validate tokens on every request
3. **XSS**: Escape all user output
4. **CSRF**: Use tokens for state-changing requests
5. **Security Misconfiguration**: Keep dependencies updated

## Supabase RLS
- All tables must have RLS enabled
- Define explicit policies for each operation
- Test policies before deployment

## Shopify Webhooks
- Verify HMAC signature on all webhooks
- Use HTTPS only
- Log all webhook events

## Code Review Checklist
- [ ] No hardcoded credentials
- [ ] Input validation in place
- [ ] SQL queries parameterized
- [ ] Error messages don't leak info
- [ ] Logging doesn't contain PII
