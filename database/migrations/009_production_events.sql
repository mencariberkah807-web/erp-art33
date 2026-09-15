CREATE TABLE IF NOT EXISTS production_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  process_type TEXT NOT NULL CHECK (process_type IN ('LASER_CUTTING', 'UV_PRINTING', 'ASSEMBLY', 'LASER_MARKING', 'FINISHING')),
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_events_work_order ON production_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_events_process ON production_events(process_type);
CREATE INDEX IF NOT EXISTS idx_production_events_created_at ON production_events(created_at);
