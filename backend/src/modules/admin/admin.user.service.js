import * as repository from './admin.user.repository.js';
import { hashPassword } from '../auth/auth.service.js';

const VALID_STATUS = new Set(['ACTIVE', 'INACTIVE']);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  const email = cleanText(value);
  return email ? email.toLowerCase() : null;
}

function validation(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  return error;
}

export async function listUsers() {
  return repository.listUsers();
}

export async function getUser(id) {
  const user = await repository.findUserById(id);
  if (!user) {
    const error = new Error('User not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    user,
    roles: await repository.getUserRoles(id),
  };
}

export async function createUser(data) {
  const username = cleanText(data.username);
  const name = cleanText(data.name);
  const email = normalizeEmail(data.email);
  const password = typeof data.password === 'string' ? data.password : '';

  if (!username || !name || !password) {
    throw validation('Username, name and password are required.');
  }

  const passwordHash = hashPassword(password);
  return repository.createUser({ username, name, email, passwordHash });
}

export async function updateUser(id, data) {
  const user = await repository.findUserById(id);
  if (!user) {
    const error = new Error('User not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const status = data.status === undefined ? undefined : cleanText(data.status).toUpperCase();
  if (status !== undefined && !VALID_STATUS.has(status)) {
    throw validation('Status must be ACTIVE or INACTIVE.');
  }

  if (status === 'INACTIVE') {
    const roles = await repository.getUserRoles(id);
    if (roles.some((role) => role.code === 'OWNER')) {
      const activeOwners = await repository.countActiveOwners();
      if (activeOwners <= 1) {
        throw validation('The last active OWNER cannot be deactivated.');
      }
    }
  }

  const passwordHash = data.password === undefined
    ? undefined
    : hashPassword(data.password);

  return repository.updateUser(id, {
    name: data.name === undefined ? undefined : cleanText(data.name),
    email: data.email === undefined ? undefined : normalizeEmail(data.email),
    status,
    passwordHash,
  });
}

export async function replaceUserRoles(id, roleIds) {
  const user = await repository.findUserById(id);
  if (!user) {
    const error = new Error('User not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!Array.isArray(roleIds)) {
    throw validation('roleIds must be an array.');
  }

  const normalizedIds = [...new Set(roleIds.map((id) => String(id).trim()).filter(Boolean))];
  const roles = await repository.findRolesByIds(normalizedIds);

  if (roles.length !== normalizedIds.length) {
    throw validation('One or more roles do not exist.');
  }

  if (roles.some((role) => role.status !== 'ACTIVE')) {
    throw validation('Only ACTIVE roles can be assigned.');
  }

  const currentRoles = await repository.getUserRoles(id);
  const currentlyOwner = currentRoles.some((role) => role.code === 'OWNER');
  const willBeOwner = roles.some((role) => role.code === 'OWNER');

  if (currentlyOwner && !willBeOwner) {
    const activeOwners = await repository.countActiveOwners();
    if (activeOwners <= 1 && user.status === 'ACTIVE') {
      throw validation('The last active OWNER cannot lose OWNER role.');
    }
  }

  if (user.status === 'ACTIVE' && !willBeOwner && currentlyOwner) {
    throw validation('An active OWNER must retain OWNER role unless another active OWNER exists.');
  }

  return repository.replaceUserRoles(id, normalizedIds);
}
