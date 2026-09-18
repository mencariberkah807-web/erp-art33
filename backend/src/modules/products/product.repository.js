const PRODUCT_FIELDS = `
  id,
  sku,
  name,
  category,
  material,
  thickness,
  length_cm AS "lengthCm",
  width_cm AS "widthCm",
  height_cm AS "heightCm",
  dimension,
  color,
  specification,
  unit,
  standard_price AS "standardPrice",
  standard_purchase_price AS "standardPurchasePrice",
  initial_stock AS "initialStock",
  description,
  image_url AS "imageUrl",
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function listProducts(pool, { page, pageSize, search, status }) {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);
    const index = values.length;
    conditions.push(`(sku ILIKE $${index} OR name ILIKE $${index} OR category ILIKE $${index} OR material ILIKE $${index})`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM products ${where}`, values);
  const total = countResult.rows[0].total;

  values.push(pageSize, offset);
  const result = await pool.query(
    `SELECT ${PRODUCT_FIELDS} FROM products ${where} ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { rows: result.rows, total };
}

export async function findProductById(pool, id) {
  const result = await pool.query(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function createProduct(pool, product) {
  const result = await pool.query(
    `INSERT INTO products (
      sku, name, category, material, thickness, length_cm, width_cm, height_cm, dimension, color,
      specification, unit, standard_price, standard_purchase_price, initial_stock, description, image_url, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING ${PRODUCT_FIELDS}`,
    [
      product.sku,
      product.name,
      product.category,
      product.material,
      product.thickness,
      product.lengthCm,
      product.widthCm,
      product.heightCm,
      product.dimension,
      product.color,
      product.specification,
      product.unit,
      product.standardPrice,
      product.standardPurchasePrice,
      product.initialStock,
      product.description,
      product.imageUrl,
      product.status,
    ],
  );

  return result.rows[0];
}

export async function updateProduct(pool, id, product) {
  const fields = [];
  const values = [];

  const columnMap = {
    sku: 'sku',
    name: 'name',
    category: 'category',
    material: 'material',
    thickness: 'thickness',
    lengthCm: 'length_cm',
    widthCm: 'width_cm',
    heightCm: 'height_cm',
    dimension: 'dimension',
    color: 'color',
    specification: 'specification',
    unit: 'unit',
    standardPrice: 'standard_price',
    standardPurchasePrice: 'standard_purchase_price',
    initialStock: 'initial_stock',
    description: 'description',
    imageUrl: 'image_url',
    status: 'status',
  };

  for (const [key, column] of Object.entries(columnMap)) {
    if (product[key] !== undefined) {
      values.push(product[key]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (!fields.length) return findProductById(pool, id);

  values.push(id);
  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING ${PRODUCT_FIELDS}`,
    values,
  );

  return result.rows[0] ?? null;
}
