CREATE TABLE IF NOT EXISTS packing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL UNIQUE REFERENCES sales_orders(id),
  packed_at TIMESTAMPTZ,
  packed_by UUID REFERENCES users(id),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PACKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packing_orders_status ON packing_orders(status);
CREATE INDEX IF NOT EXISTS idx_packing_orders_sales_order ON packing_orders(sales_order_id);
