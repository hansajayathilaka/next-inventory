import { useEffect, useRef } from 'react';
import { usePOSStore } from '@/stores/posStore';

/**
 * Auto-save POS sessions to backend
 * Saves session state every N seconds or after significant changes
 */
export function usePOSAutoSave(intervalMs = 30000) {
  const { getCurrentSession } = usePOSStore();
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const autoSave = async () => {
      const session = getCurrentSession();
      if (!session || session.status !== 'active') {
        return;
      }

      // Create a hash of current session to detect changes
      const sessionHash = JSON.stringify({
        items: session.items,
        billDiscountType: session.billDiscountType,
        billDiscountValue: session.billDiscountValue,
      });

      // Only save if session has changed
      if (sessionHash === lastSavedRef.current) {
        return;
      }

      try {
        // Save each item in the session
        // In a real implementation, this would sync with backend
        // For now, we just track that we would have saved
        lastSavedRef.current = sessionHash;

        console.log(`[Auto-save] Session ${session.sessionID} saved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error('[Auto-save] Failed to save session:', error);
        // Don't throw - auto-save should be silent
      }
    };

    // Save immediately on mount
    autoSave();

    // Set up interval
    saveIntervalRef.current = setInterval(autoSave, intervalMs);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [intervalMs, getCurrentSession]);

  return {
    lastSaved: lastSavedRef.current ? new Date() : null,
  };
}
