import { extractSessionToken, authenticate } from './auth.service.js';

export async function requireAuth(request, response, next) {
  try {
    const user = await authenticate(extractSessionToken(request));
    if (!user) {
      return response.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          details: {},
        },
      });
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
