import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

export default function ResetPasswordPage({ token, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmation) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload?.error?.message || 'Reset password gagal.');

      onComplete();
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
          <h1>Password Baru</h1>
          <p>Buat password baru untuk akun ARTKRILIK ERP.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label>
            Password Baru
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
          </label>
          <label>
            Konfirmasi Password
            <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan Password'}
          </button>
        </form>
      </section>
    </main>
  );
}
