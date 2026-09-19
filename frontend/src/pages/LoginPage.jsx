import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

export default function LoginPage({ onLogin, onForgotPassword }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Login gagal.');
      }

      onLogin(payload.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">A</div>
          <div><strong>ARTKRILIK</strong><span>ERP V3</span></div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">SECURE ACCESS</p>
          <h1>Login</h1>
          <p>Masuk ke ARTKRILIK ERP menggunakan akun yang dibuat oleh Owner.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label>
            Username / Email
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <button className="auth-forgot" type="button" onClick={() => window.location.assign('/forgot-password')}>
          Lupa Password?
        </button>

        <p className="auth-note">Tidak ada pendaftaran mandiri. Hubungi Owner untuk membuat akun baru.</p>
      </section>
    </main>
  );
}
