CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_number TEXT NOT NULL UNIQUE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  sales_order_item_id UUID NOT NULL UNIQUE REFERENCES sales_order_items(id),
  status TEXT NOT NULL DEFAULT 'READY_FOR_PRODUCTION' CHECK (status IN ('READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_sales_order ON work_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at);
