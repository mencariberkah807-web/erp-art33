-- ARTKRILIK ERP V3 authorization permission seed
-- ARTKRILIK ERP V3 authorization seed.
-- Uses the existing permissions(code, name) and role_permissions schema.

INSERT INTO permissions (code, name) VALUES
  ('CUSTOMER_VIEW', 'View customers'),
  ('CUSTOMER_MANAGE', 'Manage customers'),
  ('PRODUCT_VIEW', 'View products'),
  ('PRODUCT_MANAGE', 'Manage products'),
  ('SALES_ORDER_VIEW', 'View sales orders'),
  ('SALES_ORDER_MANAGE', 'Manage sales orders'),
  ('PAYMENT_VIEW', 'View payments'),
  ('PAYMENT_MANAGE', 'Manage payments'),
  ('WORK_ORDER_VIEW', 'View work orders'),
  ('WORK_ORDER_MANAGE', 'Manage work orders'),
  ('PRODUCTION_VIEW', 'View production'),
  ('PRODUCTION_MANAGE', 'Manage production'),
  ('PACKING_VIEW', 'View packing'),
  ('PACKING_MANAGE', 'Manage packing'),
  ('HANDOVER_VIEW', 'View handovers'),
  ('HANDOVER_MANAGE', 'Manage handovers'),
  ('FINANCE_VIEW', 'View finance'),
  ('FINANCE_MANAGE', 'Manage finance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO roles (code, name) VALUES
  ('FINANCE', 'Finance'),
  ('SALES', 'Sales'),
  ('PRODUCTION', 'Production'),
  ('PACKING_DELIVERY', 'Packing & Delivery')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON
  (r.code = 'FINANCE' AND p.code IN ('PAYMENT_VIEW', 'PAYMENT_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE'))
  OR
  (r.code = 'SALES' AND p.code IN (
    'CUSTOMER_VIEW', 'CUSTOMER_MANAGE',
    'PRODUCT_VIEW', 'PRODUCT_MANAGE',
    'SALES_ORDER_VIEW', 'SALES_ORDER_MANAGE',
    'PAYMENT_VIEW', 'PAYMENT_MANAGE',
    'WORK_ORDER_VIEW'
  ))
  OR
  (r.code = 'PRODUCTION' AND p.code IN (
    'WORK_ORDER_VIEW', 'WORK_ORDER_MANAGE',
    'PRODUCTION_VIEW', 'PRODUCTION_MANAGE'
  ))
  OR
  (r.code = 'PACKING_DELIVERY' AND p.code IN (
    'PACKING_VIEW', 'PACKING_MANAGE',
    'HANDOVER_VIEW', 'HANDOVER_MANAGE',
    'WORK_ORDER_VIEW'
  ))
ON CONFLICT DO NOTHING;
