import { useEffect, useRef } from 'react';
import { usePOSStore } from '@/stores/posStore';

/**
 * Handle POS session timeout
 * Abandons sessions after N seconds of inactivity
 * Default: 5 hours (18000000 ms) as per spec
 */
export function useSessionTimeout(timeoutMs = 5 * 60 * 60 * 1000) {
  const { sessions, abandonSession } = usePOSStore();
  const timeoutRefsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const now = new Date().getTime();

    // Check each active session for timeout
    Object.entries(sessions).forEach(([sessionID, session]) => {
      if (session.status !== 'active') {
        return;
      }

      const lastActivityTime = new Date(session.lastActivity).getTime();
      const inactiveTime = now - lastActivityTime;

      if (inactiveTime >= timeoutMs) {
        // Session has timed out
        abandonSession(sessionID);
        console.log(`[Session Timeout] Abandoned inactive session ${sessionID}`);
        return;
      }

      // Clear existing timeout for this session
      if (timeoutRefsRef.current[sessionID]) {
        clearTimeout(timeoutRefsRef.current[sessionID]);
      }

      // Set new timeout for when this session will expire
      const timeUntilTimeout = timeoutMs - inactiveTime;
      timeoutRefsRef.current[sessionID] = setTimeout(() => {
        abandonSession(sessionID);
        console.log(`[Session Timeout] Auto-abandoned session ${sessionID}`);
      }, timeUntilTimeout);
    });

    // Clean up timeouts for deleted sessions
    Object.keys(timeoutRefsRef.current).forEach((sessionID) => {
      if (!sessions[sessionID]) {
        clearTimeout(timeoutRefsRef.current[sessionID]);
        delete timeoutRefsRef.current[sessionID];
      }
    });

    return () => {
      // Clean up on unmount
      Object.values(timeoutRefsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [sessions, timeoutMs, abandonSession]);

  return {
    timeoutMs,
    activeSessions: Object.values(sessions).filter((s) => s.status === 'active').length,
  };
}
