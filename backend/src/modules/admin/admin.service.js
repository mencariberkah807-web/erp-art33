import * as repository from './admin.repository.js';

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function listRoles() {
  const roles = await repository.listRoles();
  const permissions = await repository.listPermissions();
  return { roles, permissions };
}

export async function getRole(id) {
  const role = await repository.findRoleById(id);
  if (!role) {
    const error = new Error('Role not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    role,
    permissions: await repository.getRolePermissions(id),
  };
}

export async function createRole(data) {
  const code = normalizeCode(data.code);
  const name = String(data.name || '').trim();

  if (!code || !name) {
    const error = new Error('Role code and name are required.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (code === 'OWNER') {
    const error = new Error('OWNER is reserved.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return repository.createRole({ code, name });
}

export async function updateRole(id, data) {
  const role = await repository.findRoleById(id);
  if (!role) {
    const error = new Error('Role not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (role.code === 'OWNER' && data.status === 'INACTIVE') {
    const error = new Error('OWNER cannot be deactivated.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return repository.updateRole(id, {
    name: data.name === undefined ? undefined : String(data.name).trim(),
    status: data.status,
  });
}

export async function replaceRolePermissions(id, permissionIds) {
  const role = await repository.findRoleById(id);
  if (!role) {
    const error = new Error('Role not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (role.code === 'OWNER') {
    return repository.getRolePermissions(id);
  }

  if (!Array.isArray(permissionIds)) {
    const error = new Error('permissionIds must be an array.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return repository.replaceRolePermissions(id, [...new Set(permissionIds)]);
}
