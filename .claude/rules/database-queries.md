---
paths:
  - "src/lib/supabase.ts"
  - "src/app/api/**/*.ts"
  - "supabase/migrations/**"
---

# Database Query Rules (Supabase)

## Connection
- Project: cmgpflxqunkrrbndtnne
- Always use parameterized queries
- Never expose service key in client code

## Tables Principales

### store_sales
Ventes boutique physique (Incwo)
```sql
CREATE TABLE store_sales (
  id UUID PRIMARY KEY,
  sale_date DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  created_by VARCHAR(100)
);
```

### agent_logs
Historique actions agents
```sql
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY,
  agent_id VARCHAR(50),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMPTZ
);
```

## Query Best Practices

### Always Use
```typescript
// Good: Parameterized query
const { data } = await supabase
  .from('store_sales')
  .select('*')
  .eq('sale_date', date);

// Good: Specific columns
const { data } = await supabase
  .from('products')
  .select('id, name, price');
```

### Never Do
```typescript
// Bad: String interpolation
const { data } = await supabase
  .from('store_sales')
  .select('*')
  .filter('sale_date', 'eq', `${userInput}`); // SQL injection risk!
```

## Performance
- Select only needed columns
- Add pagination for large result sets (default: 50)
- Use indexes on frequently filtered columns
- Batch operations: max 100 records per transaction

## RLS Policies
- All tables have RLS enabled
- Anonymous read access for dashboard
- Authenticated write for mutations
