CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN ('DIRECT', 'MARKETPLACE')),
  customer_id UUID REFERENCES customers(id),
  marketplace TEXT CHECK (marketplace IN ('SHOPEE', 'TOKOPEDIA', 'TIKTOK_SHOP', 'LAZADA', 'BLIBLI', 'OTHER')),
  tracking_number TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'REGULAR' CHECK (priority IN ('REGULAR', 'SAME_DAY', 'INSTANT')),
  status TEXT NOT NULL DEFAULT 'NEW_ORDER' CHECK (status IN ('NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sales_orders_deadline_check CHECK (deadline >= order_date),
  CONSTRAINT sales_orders_type_fields_check CHECK (
    (order_type = 'DIRECT' AND customer_id IS NOT NULL AND marketplace IS NULL AND tracking_number IS NULL)
    OR
    (order_type = 'MARKETPLACE' AND marketplace IS NOT NULL AND tracking_number IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_deadline ON sales_orders(deadline);
