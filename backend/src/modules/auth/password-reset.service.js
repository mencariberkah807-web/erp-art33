import crypto from 'node:crypto';
import { getPool } from '../../db/pool.js';
import * as repository from './password-reset.repository.js';
import { hashPassword } from './auth.service.js';

const RESET_MINUTES = 30;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validation(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  return error;
}

async function sendResetEmail({ email, name, token }) {
  const { default: nodemailer } = await import('nodemailer');
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!host || !from) {
    const error = new Error('Password reset email service is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: user ? { user, pass } : undefined,
  });

  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'ARTKRILIK ERP — Reset Password',
    text: `Halo ${name || 'User'},\n\nGunakan link berikut untuk membuat password baru:\n${resetUrl}\n\nLink berlaku selama ${RESET_MINUTES} menit dan hanya dapat digunakan satu kali.\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
    html: `<p>Halo ${name || 'User'},</p><p>Gunakan link berikut untuk membuat password baru:</p><p><a href="${resetUrl}">Reset Password</a></p><p>Link berlaku selama ${RESET_MINUTES} menit dan hanya dapat digunakan satu kali.</p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
  });
}

export async function requestPasswordReset(emailInput) {
  const email = normalizeEmail(emailInput);
  if (!email) throw validation('Email is required.');

  const db = getPool();
  const user = await repository.findActiveUserByEmail(db, email);

  if (!user) {
    return { accepted: true };
  }

  await repository.invalidateUserResetTokens(db, user.id);

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

  await repository.createResetToken(db, {
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  try {
    await sendResetEmail({ email: user.email, name: user.name, token });
  } catch (error) {
    await repository.invalidateUserResetTokens(db, user.id);
    throw error;
  }

  return { accepted: true };
}

export async function resetPassword(tokenInput, newPassword) {
  const token = typeof tokenInput === 'string' ? tokenInput.trim() : '';
  if (!token) throw validation('Reset token is required.');

  const passwordHash = hashPassword(newPassword);

  const db = getPool();
  const resetToken = await repository.findValidResetToken(db, hashToken(token));

  if (!resetToken) {
    const error = new Error('Reset link is invalid or expired.');
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const consumed = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1
         AND used_at IS NULL
       RETURNING user_id`,
      [resetToken.id],
    );

    if (!consumed.rows[0]) {
      await client.query('ROLLBACK');
      const error = new Error('Reset link is invalid or expired.');
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    await client.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, consumed.rows[0].user_id],
    );

    await client.query(
      'DELETE FROM auth_sessions WHERE user_id = $1',
      [consumed.rows[0].user_id],
    );

    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }

  return { success: true };
}
