// Simple namespaced logger that is enabled in development. You can
// force-enable by setting globalThis.__RT_DEBUG = true in runtime if needed.

const isDev = ((): boolean => {
  // __DEV__ is defined by React Native Metro; fallback to true on web dev.
   
  // @ts-ignore
  if (typeof __DEV__ !== 'undefined') {return !!__DEV__;}
  return true;
})();

function enabled(): boolean {
  // Allow toggling at runtime for deeper debugging
   
  // @ts-ignore
  if (globalThis && (globalThis as any).__RT_DEBUG === true) {return true;}
  return isDev;
}

export function createLogger(ns: string) {
  const p = `[${ns}]`;
  return {
    debug: (...args: unknown[]) => {
      if (enabled()) {console.warn(p, ...args);}
    },
    info: (...args: unknown[]) => {
      if (enabled()) {console.warn(p, ...args);}
    },
    warn: (...args: unknown[]) => console.warn(p, ...args),
    error: (...args: unknown[]) => console.error(p, ...args),
  } as const;
}

export function fmtCoord(n: number | null | undefined): string {
  if (n === null || n === undefined) {return 'n/a';}
  return n.toFixed(6);
}
