import { useEffect, useRef } from "react";

export function usePolling(enabled: boolean, ms: number, fn: () => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let id: number | undefined;

    const tick = () => {
      fnRef.current();
      id = window.setTimeout(tick, ms);
    };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        tick();
      } else if (id) {
        clearTimeout(id);
      }
    };

    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (id) clearTimeout(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, ms]);
}
