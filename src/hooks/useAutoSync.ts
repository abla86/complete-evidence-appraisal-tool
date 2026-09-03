import { useEffect, useRef } from 'react';

export function useAutoSync<T>(
  sessionId: string | undefined,
  sync: (sessionId: string) => Promise<T>,
  intervalMs = 5000,
  enabled = true,
): void {
  const running = useRef(false);

  useEffect(() => {
    if (!enabled || !sessionId?.trim() || intervalMs <= 0) return;

    const tick = async () => {
      if (running.current) return;
      running.current = true;
      try {
        await sync(sessionId.trim());
      } finally {
        running.current = false;
      }
    };

    const timer = window.setInterval(() => void tick(), intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, sessionId, sync]);
}
