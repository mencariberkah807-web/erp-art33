import {
  createCustomer as insertCustomer,
  findCustomerById,
  listCustomers,
  updateCustomer as persistCustomer,
} from './customer.repository.js';

const ALLOWED_STATUS = new Set(['ACTIVE', 'INACTIVE']);

function normalize(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateCustomerInput(input, { partial = false } = {}) {
  const data = Object.fromEntries(
    Object.entries(input ?? {}).map(([key, value]) => [key, normalize(value)]),
  );

  if (!partial || Object.hasOwn(data, 'name')) {
    if (!data.name) throw domainError('VALIDATION_ERROR', 'Customer name is required.');
  }

  if (Object.hasOwn(data, 'status') && !ALLOWED_STATUS.has(data.status)) {
    throw domainError('VALIDATION_ERROR', 'Customer status must be ACTIVE or INACTIVE.');
  }

  return data;
}

function domainError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

export async function getCustomers(params) {
  const page = Math.max(Number(params.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
  const search = normalize(params.search) || '';
  const status = normalize(params.status) || undefined;

  if (status && !ALLOWED_STATUS.has(status)) {
    throw domainError('VALIDATION_ERROR', 'Customer status must be ACTIVE or INACTIVE.');
  }

  const result = await listCustomers({ page, pageSize, search, status });
  return { data: result.rows, meta: { page, pageSize, total: result.total } };
}

export async function getCustomer(id) {
  const customer = await findCustomerById(id);
  if (!customer) throw domainError('NOT_FOUND', 'Customer not found.');
  return customer;
}

export async function createCustomer(input) {
  const data = validateCustomerInput(input);
  delete data.customerCode;
  try {
    return await insertCustomer(data);
  } catch (error) {
    if (error.code === '23505') throw domainError('CONFLICT', 'Customer code or email already exists.');
    throw error;
  }
}

export async function updateCustomer(id, input) {
  const existing = await findCustomerById(id);
  if (!existing) throw domainError('NOT_FOUND', 'Customer not found.');

  const data = validateCustomerInput(input, { partial: true });
  delete data.customerCode;
  try {
    return await persistCustomer(id, data);
  } catch (error) {
    if (error.code === '23505') throw domainError('CONFLICT', 'Customer code or email already exists.');
    throw error;
  }
}
