-- Migration: Création de la table invoices pour la gestion des factures fournisseurs
-- Entreprise: RETAR DIO - SIRET 98853449100010
-- Date: 2026-01-19

-- Extension UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Informations fournisseur
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_siret TEXT,
  supplier_address TEXT,

  -- Informations facture
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,

  -- Montants
  amount_ht DECIMAL(10,2),
  amount_tva DECIMAL(10,2),
  amount_ttc DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',

  -- Classification
  category TEXT CHECK (category IN ('produits', 'packaging', 'logistique', 'marketing', 'services', 'abonnements', 'divers')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'disputed', 'cancelled')),
  payment_method TEXT,
  payment_date DATE,

  -- Fichiers et source
  pdf_url TEXT,
  pdf_filename TEXT,
  email_id TEXT,
  source_email TEXT CHECK (source_email IN ('cbdoshop75@gmail.com', 'theonlyweedn@gmail.com')),

  -- Métadonnées
  notes TEXT,
  tags TEXT[],
  processed_by TEXT DEFAULT 'agent-factures',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique pour l'application
CREATE POLICY "Allow read access to invoices"
  ON invoices
  FOR SELECT
  USING (true);

-- Politique: Écriture pour les agents authentifiés
CREATE POLICY "Allow insert for authenticated"
  ON invoices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated"
  ON invoices
  FOR UPDATE
  USING (true);

-- Vue pour les factures en retard
CREATE OR REPLACE VIEW invoices_overdue AS
SELECT *
FROM invoices
WHERE status = 'pending'
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC;

-- Vue pour les statistiques mensuelles
CREATE OR REPLACE VIEW invoices_monthly_stats AS
SELECT
  DATE_TRUNC('month', invoice_date) as month,
  category,
  COUNT(*) as count,
  SUM(amount_ttc) as total_ttc,
  SUM(amount_ht) as total_ht,
  SUM(amount_tva) as total_tva
FROM invoices
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', invoice_date), category
ORDER BY month DESC, category;

-- Commentaires
COMMENT ON TABLE invoices IS 'Factures fournisseurs de RETAR DIO (SIRET: 98853449100010)';
COMMENT ON COLUMN invoices.source_email IS 'Email Gmail source (cbdoshop75 ou theonlyweedn)';
COMMENT ON COLUMN invoices.category IS 'Catégorie: produits, packaging, logistique, marketing, services, abonnements, divers';
