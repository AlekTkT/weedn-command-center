-- Table fournisseurs pour Weedn Command Center
-- Migration: 002_create_suppliers_table.sql

CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  type TEXT DEFAULT 'Grossiste CBD' CHECK (type IN ('Grossiste CBD', 'Fabricant', 'Distributeur', 'Autre')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  contact JSONB DEFAULT '{"name": "", "phone": "", "email": "", "whatsapp": "", "address": ""}'::jsonb,
  website TEXT DEFAULT '',
  siret TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  min_order_amount DECIMAL(10, 2),
  delivery_time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  featured_products JSONB DEFAULT '[]'::jsonb,
  categories TEXT[] DEFAULT '{}',
  rating DECIMAL(2, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(type);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- Accès RLS (Row Level Security)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique pour anon
CREATE POLICY "Allow public read access" ON public.suppliers
  FOR SELECT
  USING (true);

-- Politique: Écriture pour anon (à restreindre en production avec auth)
CREATE POLICY "Allow public insert" ON public.suppliers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.suppliers
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete" ON public.suppliers
  FOR DELETE
  USING (true);

-- Insérer le fournisseur HONEY KING LAB initial
INSERT INTO public.suppliers (id, name, legal_name, type, status, contact, notes, categories)
VALUES (
  'honey-king-lab',
  'HONEY KING LAB',
  'SASU RETAR DIO - HONEY KING LAB',
  'Grossiste CBD',
  'active',
  '{"name": "", "phone": "", "email": "", "whatsapp": "", "address": ""}'::jsonb,
  'Contact via WhatsApp Group ''La fine équipe''',
  '{}'
)
ON CONFLICT (id) DO NOTHING;
