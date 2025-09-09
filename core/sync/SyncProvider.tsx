import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { flushOutboxOnce, pendingOutboxCount } from '@/core/sync/outbox';

type SyncState = {
  pending: number;
  flush: () => Promise<void>;
};

const SyncContext = createContext<SyncState | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);

  const refreshCount = React.useCallback(async () => {
    setPending(await pendingOutboxCount());
  }, []);

  const flush = React.useCallback(async () => {
    console.warn('Flushing outbox...');
    try {
      await flushOutboxOnce();
    } catch (error) {
      console.error('Error flushing outbox:', error);
    }
    try {
      await refreshCount();
    } catch (error) {
      console.error('Error refreshing count:', error);
    }
  }, [refreshCount]);

  useEffect(() => {
    // On mount and every app foreground, try flushing
    refreshCount();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        flush();
      }
    });
    const interval = setInterval(flush, 60 * 1000); // every 60s best-effort
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [flush, refreshCount]);

  const value = useMemo<SyncState>(() => ({ pending, flush }), [pending, flush]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) {throw new Error('useSync must be used within SyncProvider');}
  return ctx;
}
