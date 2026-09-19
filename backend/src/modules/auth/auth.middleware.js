import { extractSessionToken, authenticate } from './auth.service.js';

export function requirePermission(permissionCode) {
  return (request, response, next) => {
    const permissions = request.user?.permissions || [];
    const allowed = permissions.some((permission) => permission.code === permissionCode);

    if (!allowed) {
      return response.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Permission denied.',
          details: { permission: permissionCode },
        },
      });
    }

    next();
  };
}

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
