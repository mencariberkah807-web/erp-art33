CREATE TABLE IF NOT EXISTS handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  handover_type TEXT NOT NULL,
  recipient_name TEXT,
  courier_name TEXT,
  handover_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handed_over_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handovers_sales_order_id ON handovers(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_handovers_handover_at ON handovers(handover_at);
