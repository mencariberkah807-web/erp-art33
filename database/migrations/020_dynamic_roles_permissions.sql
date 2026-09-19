-- ARTKRILIK ERP V3 dynamic role and permission model.
-- Extends the existing roles/permissions tables without replacing them.

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'INACTIVE'));

UPDATE roles SET code = 'OWNER', name = 'Owner'
WHERE code = 'ADMIN';

UPDATE roles SET code = 'CS_ADMIN', name = 'CS Admin'
WHERE code = 'SALES';

UPDATE roles SET code = 'OPERATOR', name = 'Operator'
WHERE code = 'PRODUCTION';

UPDATE roles SET code = 'PACK', name = 'Pack'
WHERE code = 'PACKING_DELIVERY';

INSERT INTO roles (code, name, status) VALUES
  ('OWNER', 'Owner', 'ACTIVE'),
  ('CS_ADMIN', 'CS Admin', 'ACTIVE'),
  ('FINANCE', 'Finance', 'ACTIVE'),
  ('OPERATOR', 'Operator', 'ACTIVE'),
  ('PACK', 'Pack', 'ACTIVE')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO permissions (code, name) VALUES
  ('CUSTOMER_VIEW', 'Customer - View'),
  ('CUSTOMER_CREATE', 'Customer - Create'),
  ('CUSTOMER_EDIT', 'Customer - Edit'),
  ('CUSTOMER_DELETE', 'Customer - Delete'),
  ('CUSTOMER_ACTION', 'Customer - Action'),
  ('PRODUCT_VIEW', 'Product - View'),
  ('PRODUCT_CREATE', 'Product - Create'),
  ('PRODUCT_EDIT', 'Product - Edit'),
  ('PRODUCT_DELETE', 'Product - Delete'),
  ('PRODUCT_ACTION', 'Product - Action'),
  ('SALES_ORDER_VIEW', 'Sales Order - View'),
  ('SALES_ORDER_CREATE', 'Sales Order - Create'),
  ('SALES_ORDER_EDIT', 'Sales Order - Edit'),
  ('SALES_ORDER_DELETE', 'Sales Order - Delete'),
  ('SALES_ORDER_ACTION', 'Sales Order - Action'),
  ('PAYMENT_VIEW', 'Payment - View'),
  ('PAYMENT_CREATE', 'Payment - Create'),
  ('PAYMENT_EDIT', 'Payment - Edit'),
  ('PAYMENT_DELETE', 'Payment - Delete'),
  ('PAYMENT_ACTION', 'Payment - Action'),
  ('WORK_ORDER_VIEW', 'Work Order - View'),
  ('WORK_ORDER_CREATE', 'Work Order - Create'),
  ('WORK_ORDER_EDIT', 'Work Order - Edit'),
  ('WORK_ORDER_DELETE', 'Work Order - Delete'),
  ('WORK_ORDER_ACTION', 'Work Order - Action'),
  ('PRODUCTION_VIEW', 'Production - View'),
  ('PRODUCTION_CREATE', 'Production - Create'),
  ('PRODUCTION_EDIT', 'Production - Edit'),
  ('PRODUCTION_DELETE', 'Production - Delete'),
  ('PRODUCTION_ACTION', 'Production - Action'),
  ('PACKING_VIEW', 'Packing - View'),
  ('PACKING_CREATE', 'Packing - Create'),
  ('PACKING_EDIT', 'Packing - Edit'),
  ('PACKING_DELETE', 'Packing - Delete'),
  ('PACKING_ACTION', 'Packing - Action'),
  ('HANDOVER_VIEW', 'Handover - View'),
  ('HANDOVER_CREATE', 'Handover - Create'),
  ('HANDOVER_EDIT', 'Handover - Edit'),
  ('HANDOVER_DELETE', 'Handover - Delete'),
  ('HANDOVER_ACTION', 'Handover - Action'),
  ('FINANCE_VIEW', 'Finance - View'),
  ('FINANCE_CREATE', 'Finance - Create'),
  ('FINANCE_EDIT', 'Finance - Edit'),
  ('FINANCE_DELETE', 'Finance - Delete'),
  ('FINANCE_ACTION', 'Finance - Action')
ON CONFLICT (code) DO NOTHING;

-- Preserve the existing Owner full-access rule and make it explicit.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'OWNER'
ON CONFLICT DO NOTHING;
