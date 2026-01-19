-- Migration: Création table ventes boutique physique (Incwo)
-- Les ventes e-commerce viennent de Shopify
-- Les ventes boutique sont stockées ici (entrée manuelle ou Make.com)

CREATE TABLE IF NOT EXISTS store_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Date et heure de la vente
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_time TIME DEFAULT CURRENT_TIME,

  -- Montants
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Détails
  items_count INTEGER DEFAULT 1,
  payment_method VARCHAR(50) DEFAULT 'CB', -- CB, Espèces, Lydia, etc.

  -- Référence Incwo (si disponible)
  incwo_receipt_id VARCHAR(100),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'manual', -- manual, make, import

  -- Contraintes
  CONSTRAINT positive_total CHECK (total >= 0)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_store_sales_date ON store_sales(sale_date DESC);
CREATE INDEX idx_store_sales_created ON store_sales(created_at DESC);

-- Vue pour les métriques quotidiennes
CREATE OR REPLACE VIEW store_sales_daily AS
SELECT
  sale_date,
  COUNT(*) as transactions,
  SUM(total) as revenue,
  AVG(total) as avg_ticket,
  SUM(items_count) as items_sold
FROM store_sales
GROUP BY sale_date
ORDER BY sale_date DESC;

-- Vue pour les métriques mensuelles
CREATE OR REPLACE VIEW store_sales_monthly AS
SELECT
  DATE_TRUNC('month', sale_date)::DATE as month,
  COUNT(*) as transactions,
  SUM(total) as revenue,
  AVG(total) as avg_ticket
FROM store_sales
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month DESC;

-- RLS Policies
ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;

-- Lecture publique (via anon key)
CREATE POLICY "Allow read for all" ON store_sales
  FOR SELECT USING (true);

-- Insertion publique (pour Make.com et saisie manuelle)
CREATE POLICY "Allow insert for all" ON store_sales
  FOR INSERT WITH CHECK (true);

-- Update uniquement du même jour
CREATE POLICY "Allow update same day" ON store_sales
  FOR UPDATE USING (sale_date = CURRENT_DATE);

-- Commentaires
COMMENT ON TABLE store_sales IS 'Ventes boutique physique Weedn (4 Rue Tiquetonne). Entrées manuelles ou via Make.com depuis Incwo.';
COMMENT ON COLUMN store_sales.created_by IS 'Source: manual (saisie), make (automatisation), import (CSV)';
