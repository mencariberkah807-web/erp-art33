import crypto from 'node:crypto';
import { getPool } from '../../db/pool.js';
import * as repository from './auth.repository.js';

const SESSION_DAYS = 7;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  const [scheme, saltHex, keyHex] = storedHash.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function login(identifier, password) {
  const db = getPool();
  const user = await repository.findUserByIdentifier(db, identifier);

  if (!user || user.status !== 'ACTIVE' || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await repository.createSession(db, {
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const access = await repository.getUserAccess(db, user.id);
  return { token, expiresAt, user: access };
}

export async function authenticate(token) {
  if (!token) return null;

  const db = getPool();
  const session = await repository.findSession(db, hashToken(token));
  if (!session) return null;

  await repository.touchSession(db, session.id);
  return repository.getUserAccess(db, session.userId);
}

export async function logout(token) {
  if (!token) return;
  await repository.deleteSession(getPool(), hashToken(token));
}

export function getSessionCookie(token, expiresAt) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `artkrilik_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}${secure}`;
}

export function getClearedSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `artkrilik_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function extractSessionToken(request) {
  const header = request.headers.cookie || '';
  const match = header.match(/(?:^|;\\s*)artkrilik_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
