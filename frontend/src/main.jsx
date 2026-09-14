import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function App() {
  const [health, setHealth] = useState({ state: 'checking', data: null });

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/health`)
      .then(async (response) => {
        const data = await response.json();
        if (active) setHealth({ state: response.ok ? 'ok' : 'error', data });
      })
      .catch(() => {
        if (active) setHealth({ state: 'error', data: null });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">ARTKRILIK ERP V3</p>
        <h1>Foundation</h1>
        <p className="description">
          The application shell is connected to the V3 REST API foundation.
        </p>
        <div className="status-card" aria-live="polite">
          <span className={`status-dot status-${health.state}`} />
          <div>
            <strong>API Health</strong>
            <p>
              {health.state === 'checking' && 'Checking API…'}
              {health.state === 'ok' && 'API is reachable.'}
              {health.state === 'error' && 'API is unavailable.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
