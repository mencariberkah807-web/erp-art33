-- ARTKRILIK ERP V3 cleanup of legacy authorization permissions.
-- Granular module/action permissions from migration 020 are now the SSOT.
-- Remove only the obsolete *_MANAGE permissions seeded by migration 019.

DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id
  FROM permissions
  WHERE code IN (
    'CUSTOMER_MANAGE',
    'PRODUCT_MANAGE',
    'SALES_ORDER_MANAGE',
    'PAYMENT_MANAGE',
    'WORK_ORDER_MANAGE',
    'PRODUCTION_MANAGE',
    'PACKING_MANAGE',
    'HANDOVER_MANAGE',
    'FINANCE_MANAGE'
  )
);

DELETE FROM permissions
WHERE code IN (
  'CUSTOMER_MANAGE',
  'PRODUCT_MANAGE',
  'SALES_ORDER_MANAGE',
  'PAYMENT_MANAGE',
  'WORK_ORDER_MANAGE',
  'PRODUCTION_MANAGE',
  'PACKING_MANAGE',
  'HANDOVER_MANAGE',
  'FINANCE_MANAGE'
);
