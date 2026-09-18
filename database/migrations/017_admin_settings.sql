CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_identity TEXT,
  document_identity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_group TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO roles (code, name)
VALUES
  ('ADMIN', 'Admin'),
  ('FINANCE', 'Finance'),
  ('SALES', 'Sales'),
  ('PRODUCTION', 'Production'),
  ('PACKING_DELIVERY', 'Packing / Delivery')
ON CONFLICT (code) DO NOTHING;
