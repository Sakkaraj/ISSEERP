import crypto from 'crypto';
import { Buffer } from 'buffer';

function authTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || 'boonsunclon-demo-secret';
}

export function generateAuthToken(username, role) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      username,
      role,
      iat: now,
      exp: now + 24 * 60 * 60 // 24 hours
    };

    const payload = JSON.stringify(claims);
    const encodedPayload = Buffer.from(payload).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const hmac = crypto.createHmac('sha256', authTokenSecret());
    hmac.update(encodedPayload);
    const signature = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${encodedPayload}.${signature}`;
  } catch (error) {
    throw new Error('Failed to generate auth token: ' + error.message);
  }
}

export function parseAuthToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('invalid token format');
    }

    const [payloadPart, signaturePart] = parts;

    // Verify signature
    const hmac = crypto.createHmac('sha256', authTokenSecret());
    hmac.update(payloadPart);
    const expectedSignature = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Compare signatures
    if (signaturePart !== expectedSignature) {
      throw new Error('invalid token signature');
    }

    // Decode and verify claims
    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64').toString('utf-8')
    );

    if (Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid token: ' + error.message);
  }
}

export function bearerTokenFromRequest(req) {
  const authorization = (req.get('Authorization') || '').trim();
  if (!authorization) return '';
  
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}
