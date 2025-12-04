import { useEffect, useRef } from "react";

/**
 * Triggers the provided callback function once (synchronously if needed) when the user is about to leave/close/refresh/navigate away from the page.
 * Use for submitting scores and marking the game as played.
 *
 * @param onUnload Callback to be called ONCE, passed a boolean `event.isImmediate` (sync if true, async if false)
 *        Must handle blocking onUnload for best effort submission — not all browsers support async in beforeunload.
 */
export function useGameUnloadHandler(onUnload: (ev: { isImmediate: boolean }) => Promise<void> | void, enabled: boolean) {
  const calledRef = useRef(false);
  const callbackRef = useRef(onUnload);

  useEffect(() => {
    callbackRef.current = onUnload;
  }, [onUnload]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (ev: BeforeUnloadEvent) => {
      // Only run once per game session
      if (calledRef.current) return;
      calledRef.current = true;
      // Try to make the call as sync as possible for reliability
      // Browsers may not wait for async work, but we try
      callbackRef.current({ isImmediate: true });
      // Custom message not supported by most browsers anymore
      ev.preventDefault();
      // For legacy support (might show warning)
      ev.returnValue = '';
    };
    const visHandler = () => {
      if (document.visibilityState === 'hidden' && !calledRef.current) {
        calledRef.current = true;
        // Non-blocking async on backgrounding
        callbackRef.current({ isImmediate: false });
      }
    };
    window.addEventListener('beforeunload', handler);
    window.addEventListener('unload', handler);
    document.addEventListener('visibilitychange', visHandler);

    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('unload', handler);
      document.removeEventListener('visibilitychange', visHandler);
      calledRef.current = false;
    };
  }, [enabled]);
}
