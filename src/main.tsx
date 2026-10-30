import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LicenseGate } from './components/LicenseGate.tsx';
import { IS_OFFLINE_EDITION } from './runtime/edition';
import './index.css';

// The web edition caches itself for offline use. The downloadable edition is a single local file and needs no service worker.
if (!IS_OFFLINE_EDITION && import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LicenseGate>
        <App />
      </LicenseGate>
    </ErrorBoundary>
  </StrictMode>,
);
