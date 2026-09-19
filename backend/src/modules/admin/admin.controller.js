import * as service from './admin.service.js';

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

export async function listRoles(_request, response) {
  try {
    return response.json({ data: await service.listRoles() });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function getRole(request, response) {
  try {
    return response.json({ data: await service.getRole(request.params.id) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function createRole(request, response) {
  try {
    return response.status(201).json({ data: await service.createRole(request.body || {}) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function updateRole(request, response) {
  try {
    return response.json({ data: await service.updateRole(request.params.id, request.body || {}) });
  } catch (error) {
    return sendError(response, error);
  }
}

export async function replaceRolePermissions(request, response) {
  try {
    return response.json({
      data: await service.replaceRolePermissions(
        request.params.id,
        request.body?.permissionIds,
      ),
    });
  } catch (error) {
    return sendError(response, error);
  }
}
