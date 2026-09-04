import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

// Polls the backend's /health endpoint so the UI never claims "live" falsely.
export function useBackendStatus(intervalMs = 15000) {
  const [online, setOnline] = useState(null); // null = unknown yet

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (!cancelled) setOnline(res.ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return online;
}
