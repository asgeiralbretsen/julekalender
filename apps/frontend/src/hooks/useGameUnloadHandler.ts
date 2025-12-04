import { useEffect, useRef } from "react";

export function useGameUnloadHandler(
  onUnload: (ev: { isImmediate: boolean }) => Promise<void> | void, 
  enabled: boolean
) {
  const calledRef = useRef(false);
  const callbackRef = useRef(onUnload);
  const isMountedRef = useRef(true);

  useEffect(() => {
    callbackRef.current = onUnload;
  }, [onUnload]);


  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (enabled && !calledRef.current) {
        console.log("Component unmounting (client-side navigation), calling unload handler");
        calledRef.current = true;
        callbackRef.current({ isImmediate: false });
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;


    const handler = (ev: BeforeUnloadEvent) => {
      if (calledRef.current) return;
      calledRef.current = true;
      callbackRef.current({ isImmediate: true });
      ev.preventDefault();
      ev.returnValue = '';
    };

    const visHandler = () => {
      if (document.visibilityState === 'hidden' && !calledRef.current) {
        calledRef.current = true;
        callbackRef.current({ isImmediate: false });
      }
    };

    const pageHideHandler = () => {
      if (!calledRef.current) {
        calledRef.current = true;
        callbackRef.current({ isImmediate: true });
      }
    };

    const popStateHandler = () => {
      if (!calledRef.current) {
        console.log("popstate: back/forward button pressed");
        calledRef.current = true;
        callbackRef.current({ isImmediate: false });
      }
    };

    window.addEventListener('beforeunload', handler);
    window.addEventListener('unload', handler);
    window.addEventListener('pagehide', pageHideHandler);
    window.addEventListener('popstate', popStateHandler);
    document.addEventListener('visibilitychange', visHandler);

    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('unload', handler);
      window.removeEventListener('pagehide', pageHideHandler);
      window.removeEventListener('popstate', popStateHandler);
      document.removeEventListener('visibilitychange', visHandler);
      calledRef.current = false;
    };
  }, [enabled]);
}