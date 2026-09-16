import * as repository from './product.repository.js';

const ALLOWED_STATUS = new Set(['ACTIVE', 'INACTIVE']);

function normalizeText(value) {
  if (value === undefined || value === null) return value;
  const normalized = String(value).trim();
  return normalized || null;
}

function validateProduct(input, { partial = false } = {}) {
  const product = { ...input };

  if (partial && input.sku !== undefined) {
    product.sku = normalizeText(input.sku);
  }

  if (!partial || input.name !== undefined) {
    product.name = normalizeText(input.name);
    if (!product.name) throw validationError('Product name is required.');
  }

  if (!partial || input.unit !== undefined) {
    product.unit = normalizeText(input.unit);
    if (!product.unit) throw validationError('Unit is required.');
  }

  if (!partial || input.standardPrice !== undefined) {
    const value = Number(input.standardPrice ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      throw validationError('Standard price must be a number greater than or equal to 0.');
    }
    product.standardPrice = value;
  }

  if (input.status !== undefined) {
    product.status = String(input.status).trim().toUpperCase();
    if (!ALLOWED_STATUS.has(product.status)) {
      throw validationError('Status must be ACTIVE or INACTIVE.');
    }
  } else if (!partial) {
    product.status = 'ACTIVE';
  }

  for (const key of ['category', 'material', 'thickness', 'dimension', 'color', 'specification', 'description', 'imageUrl']) {
    if (input[key] !== undefined) product[key] = normalizeText(input[key]);
  }

  return product;
}

function validationError(message) {
  return Object.assign(new Error(message), { code: 'VALIDATION_ERROR' });
}

export async function listProducts(pool, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 20, 1), 100);
  const search = normalizeText(query.search);
  const status = query.status ? String(query.status).trim().toUpperCase() : undefined;

  if (status && !ALLOWED_STATUS.has(status)) throw validationError('Status must be ACTIVE or INACTIVE.');

  const result = await repository.listProducts(pool, { page, pageSize, search, status });
  return {
    data: result.rows,
    meta: { page, pageSize, total: result.total },
  };
}

export async function getProduct(pool, id) {
  return repository.findProductById(pool, id);
}

export async function createProduct(pool, input) {
  const product = validateProduct(input);
  delete product.sku;
  try {
    return await repository.createProduct(pool, product);
  } catch (error) {
    if (error.code === '23505') {
      const conflict = new Error('A product with this SKU already exists.');
      conflict.code = 'CONFLICT';
      throw conflict;
    }
    throw error;
  }
}

export async function updateProduct(pool, id, input) {
  const product = validateProduct(input, { partial: true });
  delete product.sku;
  try {
    return await repository.updateProduct(pool, id, product);
  } catch (error) {
    if (error.code === '23505') {
      const conflict = new Error('A product with this SKU already exists.');
      conflict.code = 'CONFLICT';
      throw conflict;
    }
    throw error;
  }
}
