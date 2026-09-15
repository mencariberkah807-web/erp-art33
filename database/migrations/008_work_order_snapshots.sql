CREATE TABLE IF NOT EXISTS work_order_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL UNIQUE REFERENCES work_orders(id),
  customer_name TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  material TEXT,
  specification TEXT,
  dimension TEXT,
  color TEXT,
  thickness TEXT,
  production_notes TEXT,
  artwork_file_url TEXT,
  artwork_drive_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_snapshots_work_order ON work_order_snapshots(work_order_id);
