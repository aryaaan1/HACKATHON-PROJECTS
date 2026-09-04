import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const RETRY_DELAY_MS = 3000;

async function ping() {
  try {
    // Uses the same endpoint the rest of the app already depends on, so the
    // status indicator reflects whether real app traffic actually succeeds
    // rather than a separate /health path that can behave differently.
    const res = await fetch(`${API_BASE_URL}/api/dashboard`);
    return res.ok;
  } catch {
    return false;
  }
}

// Polls the backend so the UI never claims "live" falsely.
// A failed check is retried once after a short delay before flipping to
// "unreachable" — this absorbs a slow Render free-tier cold start instead of
// flashing offline for a backend that's still waking up.
export function useBackendStatus(intervalMs = 15000) {
  const [online, setOnline] = useState(null); // null = unknown yet

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function check() {
      // Skip this tick if the previous check (including its retry delay)
      // hasn't finished yet, so the 15s interval never overlaps requests.
      if (inFlight) return;
      inFlight = true;

      let ok = await ping();
      if (!ok && !cancelled) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        if (!cancelled) ok = await ping();
      }

      if (!cancelled) setOnline(ok);
      inFlight = false;
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
