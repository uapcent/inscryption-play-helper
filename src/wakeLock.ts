import { useEffect } from 'react';

export const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Keeps the screen on while `active`. The browser drops the lock whenever the page is hidden,
 * so it is asked for again each time the page comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !wakeLockSupported) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const request = () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      navigator.wakeLock.request('screen').then((l) => {
        if (done) l.release().catch(() => {});
        else lock = l;
      }).catch(() => { /* refused, e.g. battery saver: the screen behaves as usual */ });
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
