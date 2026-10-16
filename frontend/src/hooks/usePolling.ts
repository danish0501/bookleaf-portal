'use client';

import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  intervalMs?: number; // default 6000 (6 seconds)
  enabled?: boolean;
}

export function usePolling(callback: () => Promise<void> | void, options: UsePollingOptions = {}) {
  const { intervalMs = 6000, enabled = true } = options;
  const savedCallback = useRef(callback);
  const isTabActive = useRef(true);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timerId: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActive.current = false;
        if (timerId) clearInterval(timerId);
      } else {
        isTabActive.current = true;
        // Fire callback immediately when user returns to tab
        savedCallback.current();
        startTimer();
      }
    };

    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        if (isTabActive.current) {
          savedCallback.current();
        }
      }, intervalMs);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
