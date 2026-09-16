CREATE SEQUENCE IF NOT EXISTS customer_code_seq;
CREATE SEQUENCE IF NOT EXISTS product_sku_seq;

DO $$
DECLARE
  customer_max BIGINT;
  product_max BIGINT;
BEGIN
  SELECT COALESCE(MAX((substring(customer_code FROM '[0-9]+$'))::BIGINT), 0)
    INTO customer_max
    FROM customers
   WHERE customer_code ~ '[0-9]+$';

  IF customer_max > 0 THEN
    PERFORM setval('customer_code_seq', customer_max, true);
  END IF;

  SELECT COALESCE(MAX((substring(sku FROM '[0-9]+$'))::BIGINT), 0)
    INTO product_max
    FROM products
   WHERE sku ~ '[0-9]+$';

  IF product_max > 0 THEN
    PERFORM setval('product_sku_seq', product_max, true);
  END IF;
END $$;

ALTER TABLE customers
  ALTER COLUMN customer_code SET DEFAULT ('CUST-' || lpad(nextval('customer_code_seq')::TEXT, 6, '0'));

ALTER TABLE products
  ALTER COLUMN sku SET DEFAULT ('PROD-' || lpad(nextval('product_sku_seq')::TEXT, 6, '0'));
