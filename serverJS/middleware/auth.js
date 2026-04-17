import { bearerTokenFromRequest, parseAuthToken } from '../utils/token.js';

export function requireAdminRole(req, res, next) {
  try {
    const token = bearerTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'missing authorization token' });
    }

    const claims = parseAuthToken(token);
    if (claims.role !== 'Admin') {
      return res.status(403).json({ error: 'forbidden: admin role required' });
    }

    req.user = claims;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

export function authenticateToken(req, res, next) {
  try {
    const token = bearerTokenFromRequest(req);
    if (token) {
      const claims = parseAuthToken(token);
      req.user = claims;
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
}
