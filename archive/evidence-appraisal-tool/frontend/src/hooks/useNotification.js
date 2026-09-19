import { useCallback, useEffect, useRef, useState } from 'react';

export function useNotification(timeoutMs = 3000) {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const notify = useCallback((message, type = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification({ message, type });
    timerRef.current = setTimeout(() => {
      setNotification(null);
      timerRef.current = null;
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { notification, notify, clearNotification };
}

export default useNotification;
