CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  item_number INTEGER NOT NULL CHECK (item_number >= 1),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_type TEXT NOT NULL DEFAULT 'NOMINAL' CHECK (discount_type IN ('NOMINAL', 'PERCENTAGE')),
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  item_total NUMERIC(14,2) NOT NULL CHECK (item_total >= 0),
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  production_notes TEXT,
  artwork_file_url TEXT,
  artwork_drive_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sales_order_items_number_unique UNIQUE (sales_order_id, item_number)
);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_status ON sales_order_items(status);
