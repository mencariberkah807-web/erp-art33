import { Router } from 'express';
import { getPool } from '../../db/pool.js';
import {
  extractSessionToken,
  getClearedSessionCookie,
  getSessionCookie,
  login,
  logout,
} from './auth.service.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

router.post('/login', async (request, response, next) => {
  try {
    const { identifier, password } = request.body || {};

    if (!identifier || !password) {
      return response.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Identifier and password are required.',
          details: {},
        },
      });
    }

    const result = await login(identifier, password);

    if (!result) {
      return response.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
          details: {},
        },
      });
    }

    response.setHeader('Set-Cookie', getSessionCookie(result.token, result.expiresAt));
    return response.json({ user: result.user });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user });
});

router.post('/logout', async (request, response, next) => {
  try {
    await logout(extractSessionToken(request));
    response.setHeader('Set-Cookie', getClearedSessionCookie());
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
