import * as customerService from './customer.service.js';

function sendError(response, error) {
  const statusByCode = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
  };
  const status = statusByCode[error.code] || 500;

  return response.status(status).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: error.details || {},
    },
  });
}

export async function list(request, response) {
  try {
    return response.json(await customerService.getCustomers(request.query));
  } catch (error) {
    return sendError(response, error);
  }
}

export async function getById(request, response) {
  try {
    return response.json({ data: await customerService.getCustomer(request.params.id) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function create(request, response) {
  try {
    const customer = await customerService.createCustomer(request.body);
    return response.status(201).json({ data: customer });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function update(request, response) {
  try {
    const customer = await customerService.updateCustomer(request.params.id, request.body);
    return response.json({ data: customer });
  } catch (error) {
    return sendError(response, error);
  }
}
