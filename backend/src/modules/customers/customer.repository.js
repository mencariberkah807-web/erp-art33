import { getPool } from '../../db/pool.js';

export async function listCustomers({ page, pageSize, search, status }) {
  const pool = getPool();
  const offset = (page - 1) * pageSize;
  const values = [];
  const where = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`(customer_code ILIKE $${values.length} OR name ILIKE $${values.length} OR company ILIKE $${values.length} OR mobile ILIKE $${values.length})`);
  }

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM customers ${clause}`, values);

  values.push(pageSize, offset);
  const result = await pool.query(
    `SELECT id, customer_code, name, company, mobile, email, address, customer_type, status, notes, created_at, updated_at
     FROM customers ${clause}
     ORDER BY created_at DESC, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { rows: result.rows, total: countResult.rows[0].total };
}

export async function findCustomerById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, customer_code, name, company, mobile, email, address, customer_type, status, notes, created_at, updated_at
     FROM customers WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createCustomer(data) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO customers (name, company, mobile, email, address, customer_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, customer_code, name, company, mobile, email, address, customer_type, status, notes, created_at, updated_at`,
    [data.name, data.company, data.mobile, data.email, data.address, data.customerType, data.notes],
  );
  return result.rows[0];
}

export async function updateCustomer(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];

  const mapping = {
    customerCode: 'customer_code',
    name: 'name',
    company: 'company',
    mobile: 'mobile',
    email: 'email',
    address: 'address',
    customerType: 'customer_type',
    status: 'status',
    notes: 'notes',
  };

  for (const [key, column] of Object.entries(mapping)) {
    if (Object.hasOwn(data, key)) {
      values.push(data[key]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (!fields.length) return findCustomerById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, customer_code, name, company, mobile, email, address, customer_type, status, notes, created_at, updated_at`,
    values,
  );

  return result.rows[0] ?? null;
}
