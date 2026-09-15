import { getPool } from '../../db/pool.js';
import * as service from './product.service.js';

function sendError(response, error) {
  const status = error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'CONFLICT' ? 409 : 500;
  const code = error.code === 'VALIDATION_ERROR' || error.code === 'CONFLICT'
    ? error.code
    : 'INTERNAL_SERVER_ERROR';

  response.status(status).json({
    error: {
      code,
      message: error.message,
      details: {},
    },
  });
}

export async function list(request, response) {
  try {
    const result = await service.listProducts(getPool(), request.query);
    response.json(result);
  } catch (error) {
    sendError(response, error);
  }
}

export async function getById(request, response) {
  try {
    const product = await service.getProduct(getPool(), request.params.id);
    if (!product) {
      return response.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found.',
          details: {},
        },
      });
    }
    response.json({ data: product });
  } catch (error) {
    sendError(response, error);
  }
}

export async function create(request, response) {
  try {
    const product = await service.createProduct(getPool(), request.body ?? {});
    response.status(201).json({ data: product });
  } catch (error) {
    sendError(response, error);
  }
}

export async function update(request, response) {
  try {
    const product = await service.updateProduct(getPool(), request.params.id, request.body ?? {});
    if (!product) {
      return response.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found.',
          details: {},
        },
      });
    }
    response.json({ data: product });
  } catch (error) {
    sendError(response, error);
  }
}
