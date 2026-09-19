import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload?.error?.message || 'Permintaan reset password gagal.');

      setMessage(payload.message);
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
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>Lupa Password</h1>
          <p>Masukkan email yang terdaftar pada akun ARTKRILIK ERP.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        {!message && (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email Terdaftar
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <button className="primary-button auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Mengirim…' : 'Kirim Link Reset'}
            </button>
          </form>
        )}

        <button className="auth-forgot" type="button" onClick={onBack}>
          ← Kembali ke Login
        </button>
      </section>
    </main>
  );
}
