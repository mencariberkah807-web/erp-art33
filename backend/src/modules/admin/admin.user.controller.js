import * as service from './admin.user.service.js';

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

export async function listUsers(_request, response) {
  try {
    return response.json({ data: await service.listUsers() });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function getUser(request, response) {
  try {
    return response.json({ data: await service.getUser(request.params.id) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function createUser(request, response) {
  try {
    return response.status(201).json({ data: await service.createUser(request.body || {}) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function updateUser(request, response) {
  try {
    return response.json({
      data: await service.updateUser(request.params.id, request.body || {}),
    });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function replaceUserRoles(request, response) {
  try {
    return response.json({
      data: await service.replaceUserRoles(request.params.id, request.body?.roleIds),
    });
  } catch (error) {
    return sendError(response, error);
  }
}
