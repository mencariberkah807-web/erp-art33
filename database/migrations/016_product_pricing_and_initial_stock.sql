ALTER TABLE products
  ADD COLUMN IF NOT EXISTS standard_purchase_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (standard_purchase_price >= 0),
  ADD COLUMN IF NOT EXISTS initial_stock NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (initial_stock >= 0);
