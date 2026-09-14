import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../src/app.js';

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('GET /health reports API availability without requiring PostgreSQL', async () => {
  const server = await listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'erp-art33-api');
    assert.equal(body.database.status, 'not_configured');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('unknown routes return a structured 404 response', async () => {
  const server = await listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/does-not-exist`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, 'NOT_FOUND');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
