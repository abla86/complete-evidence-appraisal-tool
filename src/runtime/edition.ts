import { useEffect, useState } from 'react';

/**
 * Two builds share one codebase:
 * - `web`: served by server.ts; installable as a PWA and cached for offline use after the first visit.
 * - `offline`: a single self-contained HTML file in a downloadable zip. Runs from the local disk
 *   with no server; features that need the internet say so instead of failing silently.
 */
export type Edition = 'web' | 'offline';

export const EDITION: Edition = import.meta.env.MODE === 'offline' ? 'offline' : 'web';
export const IS_OFFLINE_EDITION = EDITION === 'offline';
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || '0.0.0';
export const LICENSE_PUBLIC_KEY: string = (import.meta.env.VITE_LICENSE_PUBLIC_KEY || '').trim();
/** Public website used for purchases and support links from the downloaded edition. */
export const PUBLIC_SITE_URL: string = (import.meta.env.VITE_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online;
}

/** True when the app's own server API is reachable (always false in the offline edition). */
export function useServerAvailable(): boolean | null {
  const online = useOnlineStatus();
  const [available, setAvailable] = useState<boolean | null>(IS_OFFLINE_EDITION ? false : null);
  useEffect(() => {
    if (IS_OFFLINE_EDITION) return;
    if (!online) { setAvailable(false); return; }
    let cancelled = false;
    fetch('/api/health', { cache: 'no-store' })
      .then(response => { if (!cancelled) setAvailable(response.ok); })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, [online]);
  return available;
}
